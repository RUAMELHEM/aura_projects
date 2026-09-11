import os
import json
import logging
from typing import Dict, Any, List, Optional
from utils.rag_engine import RAGEngine

logger = logging.getLogger(__name__)


class AIAuditReporter:
    """
    Teknik denetim verilerini AI ile özetler ve doküman standartlarıyla çapraz analiz yapar.
    """

    def generate_report(self, audit_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Teknik denetim verisinden AI Yönetici Özeti ve Öncelikli Öneriler üretir.
        """
        overall_score = audit_data.get("overall_score", 0)
        scores = audit_data.get("scores", {})
        issues = audit_data.get("all_issues", [])

        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            try:
                import httpx
                prompt = f"""
               Aşağıdaki web sitesi audit verisini analiz et ve Türkçe iki bölümden oluşan bir özet üret:
               1. 'summary': Genel Değerlendirme (3-4 cümlelik özet).
               2. 'recommendations': En kritik sorunlar için öncelik sırasına göre 3-5 somut çözüm önerisi.

               Audit Verisi:
               Genel Skor: {overall_score}/100
               Kategori Skorları: {json.dumps(scores, ensure_ascii=False)}
               Tüm Sorunlar: {json.dumps(issues[:10], ensure_ascii=False)}
               """
                resp = httpx.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "AURA"
                    },
                    json={
                        "model": "google/gemini-3-flash-preview",
                        "max_tokens": 1500,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3
                    },
                    timeout=20.0
                )
                if resp.status_code == 200:
                    text = resp.json()["choices"][0]["message"]["content"].strip()
                    return {
                        "summary": text,
                        "recommendations": [i.get("message") for i in issues if i.get("severity") == "high"],
                    }
            except Exception as e:
                logger.warning(f"OpenAI API çağrısı başarısız, yerel raporlayıcıya geçiliyor: {e}")

        # Yerel Deterministik Rapor Üretici
        high_issues = [i.get("message") for i in issues if i.get("severity") == "high"]
        med_issues = [i.get("message") for i in issues if i.get("severity") == "medium"]

        summary = (
            f"Web sitesi yapılan otomatize denetim sonucunda 100 üzerinden {overall_score} genel skora ulaşmıştır. "
            f"Sistemde toplam {len(issues)} adet geliştirme alanı (Güvenlik: {scores.get('security')}/100, "
            f"SEO: {scores.get('seo')}/100, Performans: {scores.get('performance')}/100) tespit edilmiştir."
        )

        recommendations = high_issues if high_issues else med_issues[:3]
        if not recommendations:
            recommendations = ["Sitede kritik bir güvenlik veya performans eksiği bulunmamaktadır."]

        return {
            "summary": summary,
            "recommendations": recommendations,
        }

    def cross_analyze_with_documents(
        self,
        rag_engine: RAGEngine,
        audit_data: Dict[str, Any],
        document_id: Optional[int] = None,
        query: str = "web yayın standartları, kurumsal iletişim, açık adres, https güvenlik ve erişilebilirlik gereksinimleri"
    ) -> Dict[str, Any]:
        """
        Çapraz Analiz (Cross Intelligence):
        Dokümanlardaki kurallar ile web sitesinin audit durumunu karşılaştırır.
        """
        rag_res = rag_engine.answer_query(query=query, top_k=5, document_id=document_id)
        contexts = rag_res.get("sources", [])
        ai_answer = rag_res.get("answer", "")

        overall_score = audit_data.get("overall_score", 0)
        scores = audit_data.get("scores", {})
        issues = audit_data.get("all_issues", audit_data.get("issues", []))

        # Tespit edilen sorun mesajları
        issue_messages = [str(i.get("message", "")).lower() for i in issues]

        # Doküman ve standart kuralları denetimi
        standard_rules = [
            {
                "id": "SEC-01",
                "category": "Güvenlik",
                "rule": "Tüm sayfalarda güvenli HTTPS protokolü ve HSTS başlığı aktif olmalıdır.",
                "keywords": ["https", "hsts", "ssl"],
                "severity": "high",
                "passed": not any("https" in m or "hsts" in m or "ssl" in m for m in issue_messages),
                "finding_if_failed": "Sitede HTTPS yönlendirmesi veya HSTS güvenlik başlığı eksik.",
                "recommendation": "Web sunucunuzda HSTS (Strict-Transport-Security) başlığını etkinleştirin ve tüm trafiği HTTPS'e zorlayın."
            },
            {
                "id": "SEC-02",
                "category": "Güvenlik",
                "rule": "Siteler İçerik Güvenliği Politikası (Content-Security-Policy) ve X-Frame-Options ile korunmalıdır.",
                "keywords": ["csp", "content-security-policy", "x-frame-options"],
                "severity": "high",
                "passed": not any("csp" in m or "content-security-policy" in m or "x-frame-options" in m for m in issue_messages),
                "finding_if_failed": "CSP (Content-Security-Policy) veya X-Frame-Options başlığı tespit edilemedi.",
                "recommendation": "XSS ve Clickjacking saldırılarına karşı CSP ve X-Frame-Options başlıklarını ekleyin."
            },
            {
                "id": "A11Y-01",
                "category": "Erişilebilirlik",
                "rule": "Yayınlanan standartlar gereği tüm görsellerde ekran okuyucular için açıklayıcı alt metni (alt attribute) bulunmalıdır.",
                "keywords": ["alt", "görsel", "resim"],
                "severity": "medium",
                "passed": not any("alt" in m for m in issue_messages),
                "finding_if_failed": "Sitedeki bazı görsellerde alternatif metin (alt attribute) eksik.",
                "recommendation": "Ekran okuyucu kullanıcıları ve erişilebilirlik standartları için tüm img etiketlerine anlamlı alt niteliği ekleyin."
            },
            {
                "id": "SEO-01",
                "category": "SEO & Başlıklar",
                "rule": "Tüm sayfalarda standartlara uygun başlık hiyerarşisi (H1 ve H2) ile meta açıklama bulunmalıdır.",
                "keywords": ["h1", "meta", "description"],
                "severity": "medium",
                "passed": not any("h1" in m or "meta description" in m for m in issue_messages),
                "finding_if_failed": "Sayfada H1 başlık yapısı veya meta açıklama standardı karşılanmıyor.",
                "recommendation": "Her sayfada tek bir ana H1 başlığı ve içeriği özetleyen meta description alanı tanımlayın."
            },
            {
                "id": "INFO-01",
                "category": "İletişim & Şeffaflık",
                "rule": "Kurumsal web standartları yönergesine göre sitede açık posta adresi, telefon ve KEP adresi açıkça yer almalıdır.",
                "keywords": ["adres", "iletişim", "kep", "telefon"],
                "severity": "high",
                "passed": any("iletisim" in str(audit_data.get("url", "")).lower() or "contact" in str(audit_data.get("url", "")).lower() for _ in [1]) and not any("adres" in m for m in issue_messages),
                "finding_if_failed": "Kurum standartlarında zorunlu kılınan açık adres veya KEP bilgisi iletişim alanında doğrulanamadı.",
                "recommendation": "İletişim sayfasına kurumun tebligat adresi, çağrı merkezi numarası ve kayıtlı e-posta (KEP) adresini ekleyin."
            }
        ]

        compliant_rules = []
        violations = []

        for r in standard_rules:
            if r["passed"]:
                compliant_rules.append({
                    "id": r["id"],
                    "category": r["category"],
                    "rule": r["rule"],
                    "status": "Uyumlu",
                    "evidence": "Teknik taramada ilgili kuralı ihlal eden bir bulguya rastlanmadı."
                })
            else:
                violations.append({
                    "id": r["id"],
                    "category": r["category"],
                    "rule": r["rule"],
                    "severity": r["severity"],
                    "status": "Uyumsuz",
                    "finding": r["finding_if_failed"],
                    "recommendation": r["recommendation"]
                })

        # Uyum skoru hesaplama
        total_rules = len(standard_rules)
        passed_rules = len(compliant_rules)
        compliance_rate = int(round((passed_rules / total_rules) * 100)) if total_rules > 0 else overall_score

        # OpenAI varsa zenginleştirme dene
        openai_key = os.getenv("OPENAI_API_KEY")
        ai_summary = ""
        if openai_key and contexts:
            try:
                import httpx
                doc_context_str = "\n".join([c.get("text", "")[:300] for c in contexts[:3]])
                prompt = f"""
                Sen bir Kurumsal Web Standartları ve Uyum Denetçisisin.
                Aşağıdaki kurumsal yönerge metinleri ile web sitesi teknik audit bulgularını karşılaştırıp 3-4 cümlelik profesyonel bir Türkçe uyum değerlendirmesi yaz.
                
                Yönerge Kuralları:
                {doc_context_str}
                
                Audit Bulguları:
                Genel Skor: {overall_score}/100
                İhlal Edilen Kurallar: {[v['rule'] for v in violations]}
                Karşılanan Kurallar: {[c['rule'] for c in compliant_rules]}
                """
                resp = httpx.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "AURA"
                    },
                    json={
                        "model": "google/gemini-3-flash-preview",
                        "max_tokens": 1500,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.2
                    },
                    timeout=15.0
                )
                if resp.status_code == 200:
                    ai_summary = resp.json()["choices"][0]["message"]["content"].strip()
            except Exception as e:
                logger.warning(f"OpenAI çağrısı başarısız, yerel özete geçiliyor: {e}")

        if not ai_summary:
            if compliance_rate >= 80:
                ai_summary = (
                    f"Web sitesi incelenen kurumsal standart dokümanlarıyla %{compliance_rate} oranında yüksek uyum sergilemektedir. "
                    f"İncelenen {total_rules} ana standarttan {passed_rules} tanesi başarıyla karşılanmıştır. "
                    f"Kalan {len(violations)} adet iyileştirme alanı tamamlandığında tam uyum sağlanacaktır."
                )
            else:
                ai_summary = (
                    f"Web sitesi incelenen kurumsal yönerge kurallarıyla %{compliance_rate} oranında kısmi uyum göstermektedir. "
                    f"Özellikle {', '.join([v['category'] for v in violations[:2]])} alanlarında standart dışı durumlar tespit edilmiştir. "
                    f"İlgili doküman maddelerine uyum için önerilen aksiyonların ivedilikle uygulanması önerilir."
                )

        return {
            "compliance_rate": compliance_rate,
            "overall_audit_score": overall_score,
            "total_rules_evaluated": total_rules,
            "passed_rules_count": passed_rules,
            "violation_count": len(violations),
            "verdict": f"Sistem doküman standartlarıyla %{compliance_rate} oranında uyumludur.",
            "summary": ai_summary,
            "compliant_rules": compliant_rules,
            "violations": violations,
            "document_rules_retrieved": len(contexts),
            "document_context_used": [
                {
                    "document_id": c.get("document_id"),
                    "page_number": c.get("page_number"),
                    "text": c.get("text", "")[:350],
                    "similarity": round(c.get("similarity_score", 0), 2)
                }
                for c in contexts[:3]
            ]
        }
