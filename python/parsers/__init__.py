"""
Parser Factory — Doküman Tipi Yönlendirici

MIME tipine göre doğru parser'ı seçer ve döndürür.
Yeni bir parser eklemek için sadece bu listeye eklemek yeterlidir.
"""

from parsers.base_parser import BaseParser, ParseResult
from parsers.pdf_parser import PDFParser
from parsers.docx_parser import DOCXParser
from parsers.xlsx_parser import XLSXParser

# Tüm kayıtlı parser'lar — yeni eklemek için buraya ekle
_PARSERS: list[type[BaseParser]] = [
    PDFParser,
    DOCXParser,
    XLSXParser,
]


def get_parser(mime_type: str) -> BaseParser | None:
    """
    MIME tipine uygun parser döndürür.
    Hiçbiri uygun değilse None döner.
    """
    for parser_class in _PARSERS:
        if parser_class.can_handle(mime_type):
            return parser_class()
    return None


def parse_document(file_path: str, mime_type: str, document_id: int) -> ParseResult:
    """
    Dosyayı uygun parser ile ayrıştırır.
    Desteklenmeyen MIME tiplerinde hata içeren ParseResult döner.
    """
    parser = get_parser(mime_type)

    if parser is None:
        return ParseResult(
            document_id=document_id,
            file_path=file_path,
            file_type=mime_type,
            error=f"Desteklenmeyen dosya türü: {mime_type}",
        )

    return parser.parse(file_path, document_id)
