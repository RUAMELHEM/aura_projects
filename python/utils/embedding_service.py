from abc import ABC, abstractmethod
import logging
from typing import List

logger = logging.getLogger(__name__)

# HuggingFace / FastEmbed modeli: Türkçe dahil 50+ dili destekler, 384 boyutlu vektör üretir.
DEFAULT_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


class EmbeddingServiceInterface(ABC):
    """
    Embedding servisleri için temel arayüz (Interface).
    """

    @abstractmethod
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Birden fazla metni vektör listesine çevirir."""
        pass

    @abstractmethod
    def get_embedding(self, text: str) -> List[float]:
        """Tek bir metni vektöre çevirir."""
        pass


class FastEmbedService(EmbeddingServiceInterface):
    """
    ONNX Runtime tabanlı, CPU üzerinde ultra hızlı ve hafif çalışan Embedding implementasyonu.
    PyTorch gerektirmez (500MB yerine ~25MB).
    """

    def __init__(self, model_name: str = DEFAULT_MODEL_NAME):
        self.model_name = model_name
        self._model = None

    def _get_model(self):
        if self._model is None:
            logger.info(f"FastEmbed modeli yükleniyor: {self.model_name}")
            try:
                from fastembed import TextEmbedding
                self._model = TextEmbedding(model_name=self.model_name)
                logger.info("FastEmbed modeli başarıyla yüklendi.")
            except Exception as e:
                logger.warning(f"Belirtilen model yüklenemedi ({e}), bge-small-en-v1.5 deneniyor...")
                try:
                    from fastembed import TextEmbedding
                    self._model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
                except Exception as inner_e:
                    logger.error(f"Embedding modeli yüklenemedi: {inner_e}")
                    raise inner_e
        return self._model

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        try:
            model = self._get_model()
            embeddings_generator = model.embed(texts)
            return [emb.tolist() for emb in embeddings_generator]
        except Exception as e:
            logger.error(f"Metinler vektörleştirilirken hata: {e}")
            raise e

    def get_embedding(self, text: str) -> List[float]:
        res = self.get_embeddings([text])
        return res[0] if res else []


# Singleton wrapper
class EmbeddingService:
    _instance = None

    @classmethod
    def get_instance(cls) -> EmbeddingServiceInterface:
        if cls._instance is None:
            cls._instance = FastEmbedService()
        return cls._instance
