import os
import logging
import re
from pathlib import Path

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from parsers import parse_document
from utils.text_cleaner import clean_text
from utils.chunker import RecursiveCharacterTextSplitter
from utils.embedding_service import EmbeddingService
from utils.rag_engine import RAGEngine
from utils.crawler import WebCrawler, is_allowed_url
from config import CrawlerSettings
from analyzers.seo_analyzer import analyze_seo
from analyzers.security_analyzer import analyze_security
from analyzers.performance_analyzer import analyze_performance
from analyzers.accessibility_analyzer import analyze_accessibility
from utils.scorer import calculate_audit_scores
from utils.ai_audit_reporter import AIAuditReporter

# Loglama ayarı
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AURA AI Service", version="0.7.0")

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "gizli-anahtar-12345")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://aura_user:aura_pass@postgres:5432/aura")

# Veritabanı bağlantısı
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Laravel'deki storage/app klasörünün container içindeki karşılığı
STORAGE_BASE_PATH = os.getenv("STORAGE_BASE_PATH", "/var/www/html/backend/storage/app")

# Servis başlatılırken Embedding modelini ve RAG motorunu yükle
embedding_service = EmbeddingService.get_instance()
rag_engine = RAGEngine(session_factory=SessionLocal, embedding_service=embedding_service)

@app.on_event("startup")
def startup_warmup():
    logger.info("FastEmbed modeli önceden belleğe yükleniyor (Warmup)...")
    try:
        embedding_service.get_embedding("warmup")
        logger.info("FastEmbed modeli başarıyla belleğe alındı, sistem istek almaya hazır.")
    except Exception as e:
        logger.warning(f"Warmup sırasında hata oluştu: {e}")

# ─── Request/Response Şemaları ───────────────────────────────────────────────

class ProcessRequest(BaseModel):
    document_id: int
    file_path: str       # Örn: "documents/abc-uuid.pdf"
    file_type: str = "application/pdf"


class ParsedPageSchema(BaseModel):
    page_number: int
    text: str
    char_count: int
    ocr_used: bool

class ChunkSchema(BaseModel):
    chunk_index: int
    page_number: int | None = None
    text: str
    char_count: int

class ProcessResponse(BaseModel):
    document_id: int
    status: str          # "accepted" | "failed"
    message: str
    total_pages: int = 0
    total_chars: int = 0
    ocr_used: bool = False
    pages: list[ParsedPageSchema] = []
    chunks: list[ChunkSchema] = []
    error: str | None = None


class EmbedRequest(BaseModel):
    document_id: int
    chunks: list[str]


class EmbedResponse(BaseModel):
    document_id: int
    status: str
    chunks_count: int
    message: str


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    document_id: int | None = None


class SearchResultItem(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    page_number: int | None = None
    text: str
    similarity_score: float


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem]


class RAGAnswerRequest(BaseModel):
    query: str
    top_k: int = 4
    document_id: int | None = None
    similarity_threshold: float = 0.35


class RAGSourceItem(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    page_number: int | None = None
    text: str
    similarity_score: float


class RAGAnswerResponse(BaseModel):
    answer: str
    sources: list[RAGSourceItem]
    found_sources_count: int


class CrawlRequest(BaseModel):
    url: str
    website_id: int | None = None
    scan_id: int | None = None
    max_pages: int | None = None
    request_delay: float | None = None
    timeout: float | None = None
    max_redirects: int | None = None


class PageItem(BaseModel):
    url: str
    status_code: int = 200
    response_time_ms: float = 250.0
    content_type: str = "text/html"
    html: str | None = None
    title: str | None = None
    error: str | None = None


class AnalyzeRequest(BaseModel):
    url: str
    website_id: int | None = None
    scan_id: int | None = None
    pages: list[PageItem] = []


# ─── Yardımcı Fonksiyon ──────────────────────────────────────────────────────

def _verify_api_key(key: str) -> None:
    if key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Geçersiz API anahtarı.")


# ─── Uç Noktalar ─────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Servis sağlık kontrolü."""
    return {"status": "ok", "service": "python-ai", "version": "0.7.0"}


@app.post("/internal/documents/process", response_model=ProcessResponse)
def process_document(
    request: ProcessRequest,
    x_internal_api_key: str = Header(...),
):
    """
    Laravel tarafından tetiklenen doküman işleme uç noktası.

    1. Güvenlik anahtarını doğrular.
    2. Dosyayı storage'dan okur.
    3. MIME tipine uygun parser ile metni çıkarır.
    4. Metin ve parçalama (chunking) sonucunu döner.
    """
    _verify_api_key(x_internal_api_key)

    # Dosyanın tam yolunu oluştur
    full_path = str(Path(STORAGE_BASE_PATH) / request.file_path)

    if not Path(full_path).exists():
        logger.error(f"Dosya bulunamadı: {full_path}")
        return ProcessResponse(
            document_id=request.document_id,
            status="failed",
            message="Dosya bulunamadı.",
            error=f"Dosya yolu erişilemiyor: {full_path}",
        )

    logger.info(
        f"Doküman işleniyor | ID: {request.document_id} | "
        f"Tip: {request.file_type} | Yol: {full_path}"
    )

    # Parser'ı çalıştır
    result = parse_document(
        file_path=full_path,
        mime_type=request.file_type,
        document_id=request.document_id,
    )

    if result.error:
        logger.error(f"Doküman ayrıştırma hatası (ID {request.document_id}): {result.error}")
        return ProcessResponse(
            document_id=request.document_id,
            status="failed",
            message="Doküman ayrıştırılamadı.",
            error=result.error,
        )

    logger.info(
        f"Doküman başarıyla işlendi | ID: {request.document_id} | "
        f"Sayfa: {result.total_pages} | Karakter: {result.total_chars} | "
        f"OCR: {result.ocr_used}"
    )

    # 1. Tüm sayfaların metnini birleştir
    full_text = result.full_text()

    # 2. Metni temizle
    cleaned_text = clean_text(full_text)

    # 3. Metni parçala (Chunking)
    chunker = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    raw_chunks = chunker.split_text(cleaned_text)
    
    chunks = []
    for i, chunk_text in enumerate(raw_chunks):
        page_match = re.search(r"\[Sayfa\s+(\d+)\]", chunk_text)
        chunks.append(ChunkSchema(
            chunk_index=i,
            page_number=int(page_match.group(1)) if page_match else None,
            text=chunk_text,
            char_count=len(chunk_text),
        ))

    # 4. Parçaları Embedding modelinden geçir (Vektörleştirme)
    texts_to_embed = [c.text for c in chunks]
    embeddings = embedding_service.get_embeddings(texts_to_embed)

    # 5. Veritabanına kaydet
    try:
        with SessionLocal() as db:
            # Önce bu dokümana ait eski chunklar varsa temizle (tekrar işleme durumu)
            db.execute(
                text("DELETE FROM document_chunks WHERE document_id = :doc_id"),
                {"doc_id": request.document_id}
            )
            
            # Yeni chunkları ve vektörleri ekle
            insert_query = text("""
                INSERT INTO document_chunks (document_id, chunk_index, page_number, text, embedding)
                VALUES (:doc_id, :idx, :page, :txt, :emb)
            """)
            
            for i, chunk in enumerate(chunks):
                # pgvector, Python listesini "[0.1, 0.2, ...]" formatında string olarak bekler
                # psycopg2 kullanırken list(float) desteklenir
                emb_list = embeddings[i]
                emb_str = "[" + ",".join(map(str, emb_list)) + "]"
                
                db.execute(insert_query, {
                    "doc_id": request.document_id,
                    "idx": chunk.chunk_index,
                    "page": chunk.page_number,
                    "txt": chunk.text,
                    "emb": emb_str
                })
            db.commit()
            logger.info(f"Doküman ID {request.document_id} için {len(chunks)} vektör DB'ye kaydedildi.")
    except Exception as e:
        logger.error(f"Veritabanına vektörler kaydedilirken hata: {e}")
        return ProcessResponse(
            document_id=request.document_id,
            status="failed",
            message="Vektörler veritabanına kaydedilemedi.",
            error=str(e),
        )

    # Laravel'e dönülecek cevapta vektörleri göndermiyoruz (Çok büyük boyutludur).
    # Laravel sadece işlemin başarıyla bittiğini bilse yeter.
    return ProcessResponse(
        document_id=request.document_id,
        status="accepted",
        message="Doküman başarıyla işlendi, parçalandı ve vektörleştirildi.",
        total_pages=result.total_pages,
        total_chars=result.total_chars,
        ocr_used=result.ocr_used,
        pages=[],   # Artık metni geri dönmemize gerek yok
        chunks=[],  # Vektörleri DB'ye yazdık, Laravel'in bilmesine gerek yok
    )


@app.post("/internal/documents/embed", response_model=EmbedResponse)
def embed_document_chunks(
    request: EmbedRequest,
    x_internal_api_key: str = Header(...),
):
    """
    Belirtilen dokümanın chunk'larını doğrudan vektörleştirip document_chunks tablosuna kaydeder.
    """
    _verify_api_key(x_internal_api_key)

    if not request.chunks:
        return EmbedResponse(
            document_id=request.document_id,
            status="failed",
            chunks_count=0,
            message="Gönderilen chunk listesi boş.",
        )

    logger.info(f"Doküman ID {request.document_id} için {len(request.chunks)} chunk embed ediliyor...")

    try:
        embeddings = embedding_service.get_embeddings(request.chunks)

        with SessionLocal() as db:
            # Eski kayıtları temizle
            db.execute(
                text("DELETE FROM document_chunks WHERE document_id = :doc_id"),
                {"doc_id": request.document_id}
            )

            insert_query = text("""
                INSERT INTO document_chunks (document_id, chunk_index, text, embedding)
                VALUES (:doc_id, :idx, :txt, :emb)
            """)

            for idx, (chunk_txt, emb) in enumerate(zip(request.chunks, embeddings)):
                emb_str = "[" + ",".join(map(str, emb)) + "]"
                db.execute(insert_query, {
                    "doc_id": request.document_id,
                    "idx": idx,
                    "txt": chunk_txt,
                    "emb": emb_str,
                })
            db.commit()

        return EmbedResponse(
            document_id=request.document_id,
            status="accepted",
            chunks_count=len(request.chunks),
            message=f"{len(request.chunks)} chunk başarıyla vektörleştirilip kaydedildi.",
        )

    except Exception as e:
        logger.error(f"Embed işlemi sırasında hata: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/internal/rag/search", response_model=SearchResponse)
def search_similar_chunks(
    request: SearchRequest,
    x_internal_api_key: str = Header(...),
):
    """
    Kullanıcının sorgusunu vektörleştirip pgvector (<=> kosinüs mesafesi) ile en yakın chunk'ları bulur.
    """
    _verify_api_key(x_internal_api_key)

    query_emb = embedding_service.get_embedding(request.query)
    emb_str = "[" + ",".join(map(str, query_emb)) + "]"

    query_sql = """
        SELECT id, document_id, chunk_index, page_number, text,
               1 - (embedding <=> :emb) as similarity_score
        FROM document_chunks
    """
    params = {"emb": emb_str, "limit": request.top_k}

    if request.document_id is not None:
        query_sql += " WHERE document_id = :doc_id"
        params["doc_id"] = request.document_id

    query_sql += " ORDER BY embedding <=> :emb LIMIT :limit"

    results = []
    with SessionLocal() as db:
        rows = db.execute(text(query_sql), params).fetchall()
        for row in rows:
            results.append(
                SearchResultItem(
                    id=row[0],
                    document_id=row[1],
                    chunk_index=row[2],
                    page_number=row[3],
                    text=row[4],
                    similarity_score=float(row[5]),
                )
            )

    return SearchResponse(query=request.query, results=results)


@app.post("/internal/rag/answer", response_model=RAGAnswerResponse)
def get_rag_answer(
    request: RAGAnswerRequest,
    x_internal_api_key: str = Header(...),
):
    """
    RAG Soru-Cevap Uç Noktası:
    1. Güvenlik anahtarını doğrular.
    2. Dokümanlardan en alakalı parçaları (chunks) arar.
    3. Eşik değer altındaysa halüsinasyonu önlemek için standart yanıt döner.
    4. Alakalı parçalardan kaynak referanslı AI cevabı üretir.
    """
    _verify_api_key(x_internal_api_key)

    logger.info(f"RAG soru-cevap talebi alındı: '{request.query}'")

    engine_to_use = RAGEngine(
        session_factory=SessionLocal,
        embedding_service=embedding_service,
        similarity_threshold=request.similarity_threshold,
    )

    result = engine_to_use.answer_query(
        query=request.query,
        top_k=request.top_k,
        document_id=request.document_id,
    )

    return RAGAnswerResponse(
        answer=result["answer"],
        sources=[
            RAGSourceItem(
                id=s["id"],
                document_id=s["document_id"],
                chunk_index=s["chunk_index"],
                page_number=s.get("page_number"),
                text=s["text"],
                similarity_score=s["similarity_score"],
            )
            for s in result["sources"]
        ],
        found_sources_count=result["found_sources_count"],
    )


@app.post("/internal/websites/crawl")
def crawl_website(
    request: CrawlRequest,
    x_internal_api_key: str = Header(...),
):
    """
    Kontrollü ve güvenli web crawler servisi.
    Keşfedilen sayfa listesini status code ve response time ile döner.
    """
    _verify_api_key(x_internal_api_key)

    allowed, reason = is_allowed_url(request.url)
    if not allowed:
        raise HTTPException(status_code=400, detail=reason)

    crawler = WebCrawler(
        max_pages=request.max_pages or CrawlerSettings.max_pages,
        request_delay=request.request_delay if request.request_delay is not None else CrawlerSettings.request_delay,
        timeout=request.timeout or CrawlerSettings.timeout,
        max_redirects=request.max_redirects or CrawlerSettings.max_redirects,
        respect_robots=CrawlerSettings.respect_robots,
    )

    logger.info(f"Website crawl başlıyor: {request.url} (max_pages={crawler.max_pages})")
    result = crawler.crawl(request.url)

    payload = result.to_dict()
    payload["website_id"] = request.website_id
    payload["scan_id"] = request.scan_id

    if result.error and (not result.pages):
        raise HTTPException(status_code=400, detail=result.error)

    return payload


@app.post("/internal/websites/analyze")
def analyze_website(
    request: AnalyzeRequest,
    x_internal_api_key: str = Header(...),
):
    """
    Tüm sayfalar için SEO, Security, Performance ve Accessibility analizlerini çalıştırır.
    Skorları hesaplar ve sonuçları döner.
    """
    _verify_api_key(x_internal_api_key)

    allowed, reason = is_allowed_url(request.url)
    if not allowed:
        raise HTTPException(status_code=400, detail=reason)

    logger.info(f"Website analiz ediliyor: {request.url} ({len(request.pages)} sayfa)")

    # Sayfalardan birleştirilmiş HTML ve başlıklar
    combined_html = "\n".join([p.html for p in request.pages if p.html]) or "<html><body></body></html>"
    first_page = request.pages[0] if request.pages else None
    response_time = first_page.response_time_ms if first_page else 250.0

    # 1. Analizörleri çalıştır
    seo_res = analyze_seo(combined_html, request.url)
    sec_res = analyze_security(request.url, {}, combined_html)
    perf_res = analyze_performance(request.url, response_time, combined_html)
    a11y_res = analyze_accessibility(combined_html, request.url)

    # 2. Skorları hesapla
    scores_data = calculate_audit_scores(seo_res, sec_res, perf_res, a11y_res)

    # 3. AI Özet Raporu Üret
    reporter = AIAuditReporter()
    ai_report = reporter.generate_report(scores_data)

    return {
        "status": "completed",
        "website_id": request.website_id,
        "scan_id": request.scan_id,
        "url": request.url,
        "overall_score": scores_data["overall_score"],
        "scores": scores_data["scores"],
        "total_issues": scores_data["total_issues"],
        "issues_by_severity": scores_data["issues_by_severity"],
        "issues": scores_data["all_issues"],
        "ai_summary": ai_report["summary"],
        "ai_recommendations": ai_report["recommendations"],
    }


class AIAuditRequest(BaseModel):
    audit_data: dict


@app.post("/internal/ai/analyze-audit")
def generate_ai_audit_analysis(
    request: AIAuditRequest,
    x_internal_api_key: str = Header(...),
):
    """
    Teknik audit verisinden AI Yönetici Özeti üretir.
    """
    _verify_api_key(x_internal_api_key)

    reporter = AIAuditReporter()
    report = reporter.generate_report(request.audit_data)
    return report


class CrossAnalysisRequest(BaseModel):
    audit_data: dict
    document_id: Optional[int] = None
    query: str = "web yayın standartları, kurumsal iletişim, açık adres, https güvenlik ve erişilebilirlik gereksinimleri"


@app.post("/internal/cross-intelligence/analyze")
def run_cross_intelligence(
    request: CrossAnalysisRequest,
    x_internal_api_key: str = Header(...),
):
    """
    Çapraz Analiz (Cross Intelligence):
    Yüklenen standart dokümanlar ile website audit bulgularını RAG ile karşılaştırır.
    """
    _verify_api_key(x_internal_api_key)

    reporter = AIAuditReporter()
    result = reporter.cross_analyze_with_documents(
        rag_engine=rag_engine,
        audit_data=request.audit_data,
        document_id=request.document_id,
        query=request.query,
    )
    return result