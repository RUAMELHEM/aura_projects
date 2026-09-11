"""
Temel Parser Arayüzü (Abstract Base Class)

Her doküman tipi için ayrı bir parser yazılır ve bu arayüzü uygular.
Böylece yeni bir dosya türü eklemek için sadece yeni bir parser sınıfı
oluşturmak yeterli olur — mevcut koda dokunmak gerekmez.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List


@dataclass
class ParsedPage:
    """Tek bir sayfadan çıkarılan metin ve meta verisi."""
    page_number: int      # 1-indexed
    text: str             # Sayfanın ham metni
    char_count: int = 0   # Karakter sayısı (OCR gerekip gerekmediğini anlamak için)
    ocr_used: bool = False  # Bu sayfa için OCR kullanıldı mı?

    def __post_init__(self):
        self.char_count = len(self.text.strip())


@dataclass
class ParseResult:
    """Tüm doküman için ayrıştırma sonucu."""
    document_id: int
    file_path: str
    file_type: str
    pages: List[ParsedPage] = field(default_factory=list)
    total_pages: int = 0
    total_chars: int = 0
    ocr_used: bool = False
    error: str | None = None

    def __post_init__(self):
        self.total_pages = len(self.pages)
        self.total_chars = sum(p.char_count for p in self.pages)
        self.ocr_used = any(p.ocr_used for p in self.pages)

    def full_text(self) -> str:
        """Tüm sayfaların metnini birleştirerek döndürür."""
        return "\n\n".join(
            f"[Sayfa {p.page_number}]\n{p.text}" for p in self.pages if p.text.strip()
        )


class BaseParser(ABC):
    """
    Tüm parser sınıflarının uygulaması gereken temel arayüz.
    """

    # Alt sınıflar destekledikleri MIME tiplerini buraya yazar
    supported_mime_types: List[str] = []

    @abstractmethod
    def parse(self, file_path: str, document_id: int) -> ParseResult:
        """
        Dosyayı ayrıştırır ve ParseResult döndürür.

        Args:
            file_path: Dosyanın tam yolu
            document_id: Veritabanındaki doküman ID'si

        Returns:
            ParseResult nesnesi
        """
        ...

    @classmethod
    def can_handle(cls, mime_type: str) -> bool:
        """Bu parser verilen MIME tipini destekliyor mu?"""
        return mime_type.lower() in [m.lower() for m in cls.supported_mime_types]
