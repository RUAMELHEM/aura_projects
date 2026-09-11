import os
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy import text
from utils.embedding_service import EmbeddingServiceInterface

logger = logging.getLogger(__name__)

NOT_FOUND_MESSAGE = "Bu bilgi yüklenen dokümanlar içerisinde bulunamadı."


class RAGSearchResult:
    def __init__(self, id: int, document_id: int, chunk_index: int, text: str, similarity_score: float, page_number: int | None = None):
        self.id = id
        self.document_id = document_id
        self.chunk_index = chunk_index
        self.page_number = page_number
        self.text = text
        self.similarity_score = similarity_score

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "document_id": self.document_id,
            "chunk_index": self.chunk_index,
            "page_number": self.page_number,
            "text": self.text,
            "similarity_score": round(self.similarity_score, 4)
        }


class RAGEngine:
    """
    Retrieval-Augmented Generation (RAG) motoru.
    Doküman vektörlerini sorgular, eşik değerine göre filtreler ve halüsinasyonu önleyecek şekilde cevap üretir.
    """

    def __init__(
        self,
        session_factory,
        embedding_service: EmbeddingServiceInterface,
        similarity_threshold: float = 0.35
    ):
        self.session_factory = session_factory
        self.embedding_service = embedding_service
        self.similarity_threshold = similarity_threshold

    def search_context(
        self,
        query: str,
        top_k: int = 4,
        document_id: Optional[int] = None
    ) -> List[RAGSearchResult]:
        """
        Kullanıcı sorgusuna en yakın doküman parçalarını pgvector üzerinden çeker.
        """
        query_emb = self.embedding_service.get_embedding(query)
        if not query_emb:
            return []

        emb_str = "[" + ",".join(map(str, query_emb)) + "]"

        query_sql = """
            SELECT id, document_id, chunk_index, page_number, text,
                   1 - (embedding <=> :emb) as similarity_score
            FROM document_chunks
        """
        params = {"emb": emb_str, "limit": top_k}

        if document_id is not None:
            query_sql += " WHERE document_id = :doc_id"
            params["doc_id"] = document_id

        query_sql += " ORDER BY embedding <=> :emb LIMIT :limit"

        results = []
        with self.session_factory() as db:
            rows = db.execute(text(query_sql), params).fetchall()
            for row in rows:
                score = float(row[5])
                # Yalnızca eşik değerin üzerindeki kaliteli eşleşmeleri al
                if score >= self.similarity_threshold:
                    results.append(
                        RAGSearchResult(
                            id=row[0],
                            document_id=row[1],
                            chunk_index=row[2],
                            page_number=row[3],
                            text=row[4],
                            similarity_score=score
                        )
                    )

        return results

    def answer_query(
        self,
        query: str,
        top_k: int = 4,
        document_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        RAG akışı:
        1. İlgili doküman parçalarını ara.
        2. Eşik değer üstü parça bulunamazsa, halüsinasyon görmeden doğrudan red yanıtı dön.
        3. Bulunan parçaları bağlam olarak LLM'e besleyip kaynak referanslı cevap üret.
        """
        contexts = self.search_context(query=query, top_k=top_k, document_id=document_id)

        # 1. Hallucination Guardrail: Eşik değeri geçen bağlam yoksa reddet
        if not contexts:
            logger.info(f"Sorgu için yeterli benzerlikte bağlam bulunamadı: '{query}'")
            return {
                "answer": NOT_FOUND_MESSAGE,
                "sources": [],
                "found_sources_count": 0
            }

        # 2. Bağlamları birleştir
        combined_context = "\n---\n".join([f"[Kaynak {i+1} (Doc {c.document_id}, Chunk {c.chunk_index})]: {c.text}" for i, c in enumerate(contexts)])

        # 3. LLM Yanıtı Sentezle
        answer = self._synthesize_answer(query, combined_context, contexts)

        return {
            "answer": answer,
            "sources": [c.to_dict() for c in contexts],
            "found_sources_count": len(contexts)
        }

    def _synthesize_answer(self, query: str, context_str: str, contexts: List[RAGSearchResult]) -> str:
        """
        LLM ile bağlamı sentezler. Dış LLM API anahtarı yoksa yerel bağlam tabanlı özet üretir.
        """
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            try:
                import httpx
                system_prompt = (
                    "Sen AURA yapay zeka denetim ve araştırma asistanısın. "
                    "YALNIZCA sana verilen bağlamdaki (context) bilgilere dayanarak Türkçe ve profesyonel bir yanıt ver. "
                    "Bağlamda açıkça yer almayan hiçbir bilgiyi uydurma. "
                    "Eğer bağlam soruya cevap vermeye yetmiyorsa açıkça 'Bu bilgi yüklenen dokümanlar içerisinde bulunamadı.' de."
                )
                user_message = f"Bağlam:\n{context_str}\n\nSoru: {query}"
                
                resp = httpx.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "AURA"
                    },
                    json={
                        "model": "google/gemini-3-flash-preview",
                        "max_tokens": 1500,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_message}
                        ],
                        "temperature": 0.2
                    },
                    timeout=20.0
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"].strip()
                else:
                    return f"[OPENAI API HATASI - {resp.status_code}]: {resp.text}"
            except Exception as e:
                return f"[SİSTEM HATASI]: OpenAI çağrısı yapılamadı. Detay: {e}"

        # Dış LLM yapılandırılmamışsa bağlamdan doğrudan yanıt döner
        if not contexts:
            return "Yüklenen dokümanlar içerisinde bu soruyla ilgili bilgi bulunamadı."

        snippets = [c.text.strip() for c in contexts[:2]]
        return f"Dokümanlardan elde edilen bilgilere göre: {' '.join(snippets)}"
