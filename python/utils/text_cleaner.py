import re

def clean_text(text: str) -> str:
    """
    Ham metni temizler ve yapay zeka (LLM) işleme için uygun hale getirir.
    
    1. Bozuk / fazla tekrarlayan boşlukları tek boşluğa indirir.
    2. Satır sonlarındaki anlamsız kopmaları düzeltir.
    3. Kontrol karakterlerini temizler.
    """
    if not text:
        return ""

    # 1. Null karakterleri ve gereksiz kontrol karakterlerini sil (newline ve tab hariç)
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    # 2. Üç veya daha fazla art arda gelen yeni satırları iki yeni satıra indir (paragraf ayrımı korunsun)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    
    # 3. Aynı satır içindeki birden fazla boşluğu veya tabı tek boşluğa çevir
    cleaned = re.sub(r'[ \t]+', ' ', cleaned)
    
    # 4. Satır başı ve sonlarındaki gereksiz boşlukları temizle
    lines = [line.strip() for line in cleaned.split('\n')]
    
    # 5. Tire ile bölünen kelimeleri birleştir (örn. "gele- cek" -> "gelecek")
    # Not: Sadece kelime sonu tire + yeni satır + küçük harf durumunda yapıyoruz.
    cleaned_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.endswith('-') and i + 1 < len(lines) and lines[i+1] and lines[i+1][0].islower():
            # Tireyi at, sonraki satırı birleştir
            line = line[:-1] + lines[i+1]
            i += 1
        cleaned_lines.append(line)
        i += 1
        
    return '\n'.join(cleaned_lines).strip()
