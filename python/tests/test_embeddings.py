import pytest
import math
from utils.embedding_service import FastEmbedService, EmbeddingServiceInterface


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot_product / (norm1 * norm2)


class TestEmbeddingService:
    @pytest.fixture(scope="class")
    def service(self):
        return FastEmbedService()

    def test_implements_interface(self, service):
        assert isinstance(service, EmbeddingServiceInterface)

    def test_embedding_dimensions_and_validity(self, service):
        text = "Yapay zeka ve doğal dil işleme sistemleri."
        embedding = service.get_embedding(text)

        assert isinstance(embedding, list)
        assert len(embedding) == 384
        assert all(isinstance(x, float) for x in embedding)

    def test_batch_embeddings(self, service):
        texts = [
            "Birinci doküman parçası.",
            "İkinci doküman parçası.",
            "Üçüncü doküman parçası.",
        ]
        embeddings = service.get_embeddings(texts)

        assert len(embeddings) == 3
        for emb in embeddings:
            assert len(emb) == 384

    def test_semantic_similarity(self, service):
        """
        Aynı konudaki iki chunk'ın benzerlik skoru,
        alakasız iki chunk'a göre belirgin şekilde daha yüksek çıkmalıdır.
        """
        # Konu 1: Yapay zeka ve makine öğrenimi
        doc_ai_1 = "Yapay zeka modelleri derin öğrenme ve sinir ağları ile eğitilir."
        doc_ai_2 = "Makine öğrenmesi algoritmaları veri kümeleri üzerinde optimizasyon yapar."

        # Konu 2: Yemek tarifi (tamamen alakasız)
        doc_food = "Kısık ateşte soğanları pembeleşinceye kadar zeytinyağında kavurun."

        emb_ai_1 = service.get_embedding(doc_ai_1)
        emb_ai_2 = service.get_embedding(doc_ai_2)
        emb_food = service.get_embedding(doc_food)

        similarity_related = cosine_similarity(emb_ai_1, emb_ai_2)
        similarity_unrelated = cosine_similarity(emb_ai_1, emb_food)

        print(f"\nİlgili metinler benzerlik skoru: {similarity_related:.4f}")
        print(f"Alakasız metinler benzerlik skoru: {similarity_unrelated:.4f}")

        # İlgili metinlerin benzerliği alakasız metinlerden belirgin şekilde yüksek olmalı
        assert similarity_related > similarity_unrelated
        assert similarity_related > 0.45
