"""
OCR Yardımcı Modülü

Tesseract OCR motorunu sarar.
Türkçe ve İngilizce dil paketlerini kullanır.
PIL Image nesneleri üzerinde çalışır.
"""

import logging

import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)

# Tesseract konfigürasyonu:
# --oem 3 = En iyi LSTM motoru
# --psm 3 = Tam sayfa otomatik segmentasyon
TESSERACT_CONFIG = "--oem 3 --psm 3"


class OCRHelper:
    """
    Tesseract OCR motorunu kullanarak görüntüden metin çıkarır.
    Türkçe ('tur') ve İngilizce ('eng') dil paketleri kullanılır.
    """

    def __init__(self, languages: str = "tur+eng"):
        self.languages = languages
        self._verify_tesseract()

    def _verify_tesseract(self) -> None:
        """Tesseract'ın kurulu ve erişilebilir olduğunu doğrular."""
        try:
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract OCR hazır: v{version} | Diller: {self.languages}")
        except pytesseract.TesseractNotFoundError:
            logger.error(
                "Tesseract bulunamadı! Lütfen sisteminize Tesseract kurulu olduğundan "
                "emin olun ve PATH'e ekleyin."
            )
        except Exception as e:
            logger.warning(f"Tesseract sürümü kontrol edilemedi: {e}")

    def extract_text(self, image: Image.Image) -> str:
        """
        PIL Image nesnesinden Tesseract ile metin çıkarır.

        Args:
            image: Metin çıkarılacak PIL Image nesnesi

        Returns:
            Çıkarılan metin (boş string eğer hiç metin yoksa)
        """
        try:
            text = pytesseract.image_to_string(
                image,
                lang=self.languages,
                config=TESSERACT_CONFIG,
            )
            return text.strip()
        except Exception as e:
            logger.error(f"OCR hatası: {e}")
            return ""

    def extract_text_from_path(self, image_path: str) -> str:
        """
        Dosya yolundan görüntü okuyup metin çıkarır.

        Args:
            image_path: Görüntü dosyasının tam yolu

        Returns:
            Çıkarılan metin
        """
        try:
            image = Image.open(image_path)
            return self.extract_text(image)
        except Exception as e:
            logger.error(f"Görüntü açılamadı [{image_path}]: {e}")
            return ""
