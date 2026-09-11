import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


def analyze_performance(
    url: str,
    response_time_ms: float,
    html: str,
    page_size_bytes: int = 0
) -> Dict[str, Any]:
    """
    Performans analizi: Sayfa yanıt süresi, sayfa boyutu, ağır görseller.
    """
    issues = []
    
    if page_size_bytes == 0 and html:
        page_size_bytes = len(html.encode("utf-8"))

    page_size_kb = round(page_size_bytes / 1024, 1)

    # 1. Yanıt süresi kontrolü
    if response_time_ms > 3000:
        issues.append({
            "severity": "high",
            "code": "slow_response_time",
            "message": f"Sayfa yanıt süresi çok yavaş ({round(response_time_ms)} ms, önerilen <1000 ms)."
        })
    elif response_time_ms > 1500:
        issues.append({
            "severity": "medium",
            "code": "moderate_response_time",
            "message": f"Sayfa yanıt süresi geliştirilebilir ({round(response_time_ms)} ms)."
        })

    # 2. Sayfa boyutu kontrolü
    if page_size_kb > 3000:
        issues.append({
            "severity": "high",
            "code": "large_page_size",
            "message": f"Sayfa boyutu çok yüksek ({page_size_kb} KB, önerilen <2000 KB)."
        })
    elif page_size_kb > 2000:
        issues.append({
            "severity": "medium",
            "code": "moderate_page_size",
            "message": f"Sayfa boyutu sınırda ({page_size_kb} KB)."
        })

    return {
        "url": url,
        "response_time_ms": round(response_time_ms, 1),
        "page_size_kb": page_size_kb,
        "issues": issues,
        "issue_count": len(issues),
    }
