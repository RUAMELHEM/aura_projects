import pytest
from unittest.mock import MagicMock
from utils.rag_engine import RAGEngine, NOT_FOUND_MESSAGE, RAGSearchResult


class TestRAGEngine:
    def test_rag_prevents_hallucination_when_no_sources_found(self):
        """
        Yüklenmemiş bir konuda soru sorulduğunda
        AI 'bu bilgi yüklenen dokümanlar içerisinde bulunamadı' demeli,
        uydurma cevap vermemelidir.
        """
        mock_embedding_service = MagicMock()
        mock_embedding_service.get_embedding.return_value = [0.1] * 384

        mock_session_factory = MagicMock()
        mock_db = MagicMock()
        # Veritabanından hiçbir sonuç dönmüyor veya benzerlik eşik altında kalıyor
        mock_db.execute.return_value.fetchall.return_value = []
        mock_session_factory.return_value.__enter__.return_value = mock_db

        engine = RAGEngine(
            session_factory=mock_session_factory,
            embedding_service=mock_embedding_service,
            similarity_threshold=0.35,
        )

        result = engine.answer_query(query="Mars'a insanlı yolculuk ne zaman yapılacak?")

        assert result["answer"] == NOT_FOUND_MESSAGE
        assert result["sources"] == []
        assert result["found_sources_count"] == 0

    def test_rag_returns_correct_answer_and_sources_for_relevant_query(self):
        """
        Yüklenmiş bir konuda doğru cevap + en az 1 kaynak dönmelidir.
        """
        mock_embedding_service = MagicMock()
        mock_embedding_service.get_embedding.return_value = [0.1] * 384

        mock_session_factory = MagicMock()
        mock_db = MagicMock()
        # id, document_id, chunk_index, page_number, text, similarity_score
        mock_db.execute.return_value.fetchall.return_value = [
            (10, 1, 0, 3, "AURA sistemi kamu web sitelerini ve dokümanlarını denetler.", 0.75),
            (11, 1, 1, 4, "Denetim sonuçları SEO, Güvenlik ve Erişilebilirlik skorları üretir.", 0.62),
        ]
        mock_session_factory.return_value.__enter__.return_value = mock_db

        engine = RAGEngine(
            session_factory=mock_session_factory,
            embedding_service=mock_embedding_service,
            similarity_threshold=0.35,
        )

        result = engine.answer_query(query="AURA sistemi ne işe yarar?")

        assert result["answer"] != NOT_FOUND_MESSAGE
        assert "AURA sistemi" in result["answer"]
        assert result["found_sources_count"] == 2
        assert len(result["sources"]) == 2
        assert result["sources"][0]["document_id"] == 1
        assert result["sources"][0]["page_number"] == 3
        assert result["sources"][0]["similarity_score"] == 0.75
