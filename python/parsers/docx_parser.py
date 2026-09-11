"""
DOCX Parser

python-docx kütüphanesiyle Word dokümanlarından paragraf bazlı metin çıkarır.
Her 30 paragraf bir "sayfa" olarak gruplandırılır (Word'ün gerçek sayfa
düzeni yoktur, bu yüzden mantıksal gruplama kullanılır).
"""

import logging
from typing import List

import docx

from parsers.base_parser import BaseParser, ParseResult, ParsedPage

logger = logging.getLogger(__name__)

# Kaç paragraf bir mantıksal "sayfa" sayılsın
PARAGRAPHS_PER_PAGE = 30


class DOCXParser(BaseParser):
    supported_mime_types = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ]

    def parse(self, file_path: str, document_id: int) -> ParseResult:
        pages: List[ParsedPage] = []

        try:
            doc = docx.Document(file_path)
        except Exception as e:
            logger.error(f"DOCX açılamadı [{file_path}]: {e}")
            return ParseResult(
                document_id=document_id,
                file_path=file_path,
                file_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                error=str(e),
            )

        # Tüm paragrafların metnini topla (boş olanları atla)
        all_paragraphs: List[str] = [
            p.text.strip()
            for p in doc.paragraphs
            if p.text.strip()
        ]

        # Tabloların içindeki metni de çıkar
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    cell_text = cell.text.strip()
                    if cell_text:
                        all_paragraphs.append(cell_text)

        # Paragrafları mantıksal sayfalara böl
        page_number = 1
        for i in range(0, max(len(all_paragraphs), 1), PARAGRAPHS_PER_PAGE):
            chunk = all_paragraphs[i:i + PARAGRAPHS_PER_PAGE]
            text = "\n".join(chunk)
            pages.append(ParsedPage(page_number=page_number, text=text))
            page_number += 1

        if not pages:
            # Boş doküman — en azından boş bir sayfa ekle
            pages.append(ParsedPage(page_number=1, text=""))

        return ParseResult(
            document_id=document_id,
            file_path=file_path,
            file_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            pages=pages,
        )
