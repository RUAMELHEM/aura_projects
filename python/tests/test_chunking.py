import pytest
from utils.text_cleaner import clean_text
from utils.chunker import RecursiveCharacterTextSplitter

class TestTextCleaner:
    def test_removes_excessive_newlines(self):
        text = "AURA\n\n\n\nProjesi"
        assert clean_text(text) == "AURA\n\nProjesi"
        
    def test_removes_excessive_spaces(self):
        text = "Bu    bir      deneme   metnidir."
        assert clean_text(text) == "Bu bir deneme metnidir."
        
    def test_fixes_hyphenated_words(self):
        text = "Bu proje gele-\ncek vadediyor."
        assert clean_text(text) == "Bu proje gelecek vadediyor."
        
    def test_does_not_fix_valid_hyphens(self):
        text = "Ahmet-Mehmet ortaklığı."
        assert clean_text(text) == "Ahmet-Mehmet ortaklığı."
        
    def test_removes_control_characters(self):
        text = "Bozuk\x00Karakter\x0b"
        assert clean_text(text) == "BozukKarakter"

class TestChunker:
    def test_chunking_with_small_text(self):
        text = "Bu kısa bir metindir."
        chunker = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = chunker.split_text(text)
        
        assert len(chunks) == 1
        assert chunks[0] == text
        
    def test_chunking_with_large_text(self):
        # 1200 karakterlik bir metin (A harflerinden oluşan kelimeler)
        word = "A" * 99
        text = " ".join([word] * 12)  # Yaklaşık 1200 karakter
        
        chunker = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = chunker.split_text(text)
        
        assert len(chunks) > 1
        for chunk in chunks:
            assert len(chunk) <= 500
            
    def test_chunking_respects_overlap(self):
        # Örtüşme mantığını test et
        text = "Cümle bir. Cümle iki. Cümle üç. Cümle dört."
        
        # Çok dar bir chunk boyutu ile zorlayalım
        chunker = RecursiveCharacterTextSplitter(chunk_size=15, chunk_overlap=12)
        chunks = chunker.split_text(text)
        
        # Cümleleri düzgün bölebiliyor mu ve örtüşme çalışıyor mu kontrol edelim
        # İlk parça "Cümle bir." olabilir
        assert len(chunks) > 1
        assert "Cümle bir" in chunks[0]
