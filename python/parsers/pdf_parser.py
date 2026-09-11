"""
PDF Parser

PyMuPDF (fitz) ile sayfa sayfa metin çıkarımı yapar.
Sayfa yeterli metin içermiyorsa (taranmış / görüntü tabanlı PDF)
otomatik olarak Tesseract OCR'a geçer.
"""

import logging
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

from parsers.base_parser import BaseParser, ParseResult, ParsedPage
from parsers.ocr_helper import OCRHelper

logger = logging.getLogger(__name__)

# Bir sayfa bu kadar karakterden azsa OCR devreye girer
OCR_THRESHOLD_CHARS = 30


class PDFParser(BaseParser):
    supported_mime_types = ["application/pdf"]

    def __init__(self):
        self.ocr = OCRHelper()

    def parse(self, file_path: str, document_id: int) -> ParseResult:
        pages: list[ParsedPage] = []

        try:
            doc = fitz.open(file_path)
        except Exception as e:
            logger.error(f"PDF açılamadı [{file_path}]: {e}")
            return ParseResult(
                document_id=document_id,
                file_path=file_path,
                file_type="application/pdf",
                error=str(e),
            )

        for page_index in range(len(doc)):
            page = doc[page_index]
            page_number = page_index + 1

            # Önce doğrudan metin çıkar
            text = page.get_text("text").strip()

            if len(text) >= OCR_THRESHOLD_CHARS:
                # Yeterli metin var — doğrudan kullan
                parsed_page = ParsedPage(
                    page_number=page_number,
                    text=text,
                    ocr_used=False,
                )
            else:
                # Yeterli metin yok — sayfayı görüntüye çevirip OCR uygula
                logger.info(
                    f"Sayfa {page_number}: Yetersiz metin ({len(text)} karakter), "
                    f"OCR uygulanıyor..."
                )
                pix = page.get_pixmap(dpi=200)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                ocr_text = self.ocr.extract_text(img)

                parsed_page = ParsedPage(
                    page_number=page_number,
                    text=ocr_text,
                    ocr_used=True,
                )

            pages.append(parsed_page)

        doc.close()

        return ParseResult(
            document_id=document_id,
            file_path=file_path,
            file_type="application/pdf",
            pages=pages,
        )
