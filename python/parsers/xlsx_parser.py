"""
XLSX Parser

openpyxl kütüphanesiyle Excel dosyalarından hücre bazlı metin çıkarır.
Her sekme (sheet) bir "sayfa" olarak işlenir.
Formüller değil, hesaplanan değerler okunur.
"""

import logging
from typing import List

import openpyxl

from parsers.base_parser import BaseParser, ParseResult, ParsedPage

logger = logging.getLogger(__name__)


class XLSXParser(BaseParser):
    supported_mime_types = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    ]

    def parse(self, file_path: str, document_id: int) -> ParseResult:
        pages: List[ParsedPage] = []

        try:
            workbook = openpyxl.load_workbook(file_path, data_only=True, read_only=True)
        except Exception as e:
            logger.error(f"XLSX açılamadı [{file_path}]: {e}")
            return ParseResult(
                document_id=document_id,
                file_path=file_path,
                file_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                error=str(e),
            )

        for page_number, sheet_name in enumerate(workbook.sheetnames, start=1):
            sheet = workbook[sheet_name]
            rows_text: List[str] = []

            for row in sheet.iter_rows(values_only=True):
                # Satırdaki tüm hücreleri tab ile birleştir, boşları atla
                cells = [str(cell) for cell in row if cell is not None and str(cell).strip() != ""]
                if cells:
                    rows_text.append("\t".join(cells))

            text = f"[Sekme: {sheet_name}]\n" + "\n".join(rows_text)

            pages.append(ParsedPage(
                page_number=page_number,
                text=text,
            ))

        workbook.close()

        if not pages:
            pages.append(ParsedPage(page_number=1, text=""))

        return ParseResult(
            document_id=document_id,
            file_path=file_path,
            file_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            pages=pages,
        )
