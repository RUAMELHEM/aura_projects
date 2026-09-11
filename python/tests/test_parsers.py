"""
PDF/DOCX/XLSX Ayrıştırma ve OCR Birim Testleri

Bu testler parsers/ modüllerini doğrudan test eder (FastAPI gerektirmez).
Docker container olmadan çalıştırılabilir.

Çalıştırma:
  docker exec aura_python python -m pytest tests/ -v
"""
import sys
import os

sys.path.insert(0, "/app")

import pytest
from unittest.mock import patch, MagicMock
from io import BytesIO
from PIL import Image


# ─── PDF Parser Testleri ─────────────────────────────────────────────────────

class TestPDFParser:
    def test_pdf_parser_extracts_text_from_text_pdf(self, tmp_path):
        """Metin içeren PDF'ten sayfa numarasıyla eşleşen metin çıkarılıyor."""
        import fitz
        from parsers.pdf_parser import PDFParser

        # Gerçek bir PDF oluştur
        pdf_path = str(tmp_path / "test.pdf")
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((72, 72), "Merhaba Dünya\nBu bir test sayfasıdır.", fontsize=12)
        doc.save(pdf_path)
        doc.close()

        parser = PDFParser()
        result = parser.parse(pdf_path, document_id=1)

        assert result.error is None
        assert result.total_pages == 1
        assert "Merhaba" in result.pages[0].text
        assert result.pages[0].page_number == 1
        assert result.pages[0].ocr_used is False

    def test_pdf_parser_uses_ocr_for_image_only_page(self, tmp_path):
        """Görüntü tabanlı PDF sayfasında OCR devreye giriyor."""
        import fitz
        from parsers.pdf_parser import PDFParser

        # Metin içermeyen boş bir PDF oluştur (taranmış PDF simülasyonu)
        pdf_path = str(tmp_path / "scanned.pdf")
        doc = fitz.open()
        doc.new_page()  # Boş sayfa
        doc.save(pdf_path)
        doc.close()

        mock_ocr_text = "Türkçe OCR metni: şçöüğı"

        with patch("parsers.pdf_parser.OCRHelper") as MockOCR:
            instance = MockOCR.return_value
            instance.extract_text.return_value = mock_ocr_text

            parser = PDFParser()
            result = parser.parse(pdf_path, document_id=2)

        assert result.total_pages == 1
        assert result.pages[0].ocr_used is True

    def test_pdf_parser_invalid_file_returns_error(self, tmp_path):
        """Bozuk/geçersiz dosyada hata içeren ParseResult dönüyor."""
        from parsers.pdf_parser import PDFParser

        bad_path = str(tmp_path / "bad.pdf")
        with open(bad_path, "w") as f:
            f.write("bu bir pdf degil")

        parser = PDFParser()
        result = parser.parse(bad_path, document_id=3)

        assert result.error is not None


# ─── DOCX Parser Testleri ────────────────────────────────────────────────────

class TestDOCXParser:
    def test_docx_parser_extracts_paragraphs(self, tmp_path):
        """DOCX'ten paragraflar ve tablo içeriği çıkarılıyor."""
        import docx as python_docx
        from parsers.docx_parser import DOCXParser

        docx_path = str(tmp_path / "test.docx")
        doc = python_docx.Document()
        doc.add_paragraph("Birinci paragraf: AURA projesi doküman yönetimi.")
        doc.add_paragraph("İkinci paragraf: Yapay zeka destekli analiz.")

        table = doc.add_table(rows=1, cols=2)
        table.cell(0, 0).text = "Hücre A"
        table.cell(0, 1).text = "Hücre B"
        doc.save(docx_path)

        parser = DOCXParser()
        result = parser.parse(docx_path, document_id=10)

        assert result.error is None
        assert result.total_pages >= 1
        full = result.full_text()
        assert "AURA" in full
        assert "Hücre A" in full

    def test_docx_parser_handles_empty_document(self, tmp_path):
        """Boş DOCX'te hata değil, boş sayfa dönüyor."""
        import docx as python_docx
        from parsers.docx_parser import DOCXParser

        docx_path = str(tmp_path / "empty.docx")
        python_docx.Document().save(docx_path)

        parser = DOCXParser()
        result = parser.parse(docx_path, document_id=11)

        assert result.error is None
        assert result.total_pages >= 1


# ─── XLSX Parser Testleri ────────────────────────────────────────────────────

class TestXLSXParser:
    def test_xlsx_parser_reads_sheets_as_pages(self, tmp_path):
        """Her XLSX sekmesi ayrı bir sayfa olarak okunuyor."""
        import openpyxl
        from parsers.xlsx_parser import XLSXParser

        xlsx_path = str(tmp_path / "test.xlsx")
        wb = openpyxl.Workbook()
        ws1 = wb.active
        ws1.title = "Personel"
        ws1.append(["Ad", "Soyad", "Departman"])
        ws1.append(["Ali", "Yılmaz", "Bilgi İşlem"])

        ws2 = wb.create_sheet("Bütçe")
        ws2.append(["Kalem", "Miktar"])
        ws2.append(["Sunucu", "50000"])
        wb.save(xlsx_path)

        parser = XLSXParser()
        result = parser.parse(xlsx_path, document_id=20)

        assert result.error is None
        assert result.total_pages == 2

        full = result.full_text()
        assert "Personel" in full
        assert "Bütçe" in full
        assert "Ali" in full


# ─── Parser Factory Testleri ─────────────────────────────────────────────────

class TestParserFactory:
    def test_factory_returns_pdf_parser_for_pdf_mime(self):
        from parsers import get_parser
        from parsers.pdf_parser import PDFParser

        parser = get_parser("application/pdf")
        assert isinstance(parser, PDFParser)

    def test_factory_returns_docx_parser_for_docx_mime(self):
        from parsers import get_parser
        from parsers.docx_parser import DOCXParser

        parser = get_parser(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        assert isinstance(parser, DOCXParser)

    def test_factory_returns_xlsx_parser_for_xlsx_mime(self):
        from parsers import get_parser
        from parsers.xlsx_parser import XLSXParser

        parser = get_parser(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        assert isinstance(parser, XLSXParser)

    def test_factory_returns_none_for_unsupported_mime(self):
        from parsers import get_parser

        parser = get_parser("application/x-msdownload")
        assert parser is None

    def test_parse_document_returns_error_for_unsupported_type(self, tmp_path):
        from parsers import parse_document

        result = parse_document(
            file_path=str(tmp_path / "file.exe"),
            mime_type="application/x-msdownload",
            document_id=99,
        )
        assert result.error is not None
        assert "Desteklenmeyen" in result.error


# ─── OCR Helper Testleri ─────────────────────────────────────────────────────

class TestOCRHelper:
    def test_ocr_extracts_text_from_image(self):
        """OCR helper bir görüntüden metin çıkarıyor."""
        from parsers.ocr_helper import OCRHelper

        helper = OCRHelper()
        # Beyaz üzerine siyah metin içeren küçük test görüntüsü
        img = Image.new("RGB", (400, 100), color="white")

        # pytesseract'ı mock'la (container dışında çalışırken Tesseract olmayabilir)
        with patch("pytesseract.image_to_string", return_value="Test OCR Metni"):
            text = helper.extract_text(img)

        assert isinstance(text, str)
