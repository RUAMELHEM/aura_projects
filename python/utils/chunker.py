import re
from typing import List

class RecursiveCharacterTextSplitter:
    """
    Langchain'in RecursiveCharacterTextSplitter mantığının bağımlılıksız halidir.
    Metni büyükten küçüğe doğru ayraçlarla (paragraf, cümle, kelime) bölmeye çalışır.
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        # Ayırma önceliği: Çift satır sonu (paragraf), tek satır sonu, nokta/cümle sonu, boşluk, karakter
        self.separators = ["\n\n", "\n", ". ", " ", ""]

    def split_text(self, text: str) -> List[str]:
        return self._split_text(text, self.separators)

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        final_chunks = []
        separator = separators[-1]
        
        # Kullanılacak uygun ayracı bul
        for s in separators:
            if s == "":
                separator = s
                break
            if s in text:
                separator = s
                break

        # Metni ayraç ile böl
        if separator:
            splits = text.split(separator)
        else:
            splits = list(text)

        # Bölünen parçaları chunk_size'a uyacak şekilde birleştir
        good_splits = []
        for s in splits:
            if len(s) < self.chunk_size:
                good_splits.append(s)
            else:
                # Eger parca hala çok büyükse, bir sonraki daha küçük ayraçla alt parçalara böl
                if len(separators) > 1:
                    sub_splits = self._split_text(s, separators[separators.index(separator) + 1:])
                    good_splits.extend(sub_splits)
                else:
                    # En küçük ayraçta (karakter bazlı) bile sığmıyorsa, zorla kes
                    for i in range(0, len(s), self.chunk_size):
                        good_splits.append(s[i:i + self.chunk_size])

        # Şimdi iyi parçaları (good_splits) overlap (örtüşme) ile birleştirerek nihai chunk'ları oluştur
        current_chunk_text = []
        current_length = 0

        for s in good_splits:
            s_len = len(s) + (len(separator) if current_chunk_text else 0)
            
            if current_length + s_len > self.chunk_size and current_chunk_text:
                # Mevcut chunk doldu, listeye ekle
                chunk_str = separator.join(current_chunk_text)
                final_chunks.append(chunk_str.strip())
                
                # Overlap hesabı: sondan geriye doğru parçaları alıp overlap boyutunu geçmeyene kadar yeni chunk'a ekle
                overlap_text = []
                overlap_length = 0
                for prev_s in reversed(current_chunk_text):
                    prev_len = len(prev_s) + (len(separator) if overlap_text else 0)
                    if overlap_length + prev_len <= self.chunk_overlap:
                        overlap_text.insert(0, prev_s)
                        overlap_length += prev_len
                    else:
                        break
                        
                current_chunk_text = overlap_text
                current_length = overlap_length

            current_chunk_text.append(s)
            current_length += len(s) + (len(separator) if len(current_chunk_text) > 1 else 0)

        # Kalan son chunk'ı ekle
        if current_chunk_text:
            chunk_str = separator.join(current_chunk_text)
            if chunk_str.strip():
                final_chunks.append(chunk_str.strip())

        return final_chunks
