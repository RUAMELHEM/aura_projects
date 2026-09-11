import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Kategori ağırlıkları (Toplam %100)
WEIGHTS = {
    "security": 0.30,
    "seo": 0.25,
    "performance": 0.25,
    "accessibility": 0.20,
}

# Ceza puanları
PENALTIES = {
    "high": 15,
    "medium": 8,
    "low": 3,
}


def calculate_category_score(issues: List[Dict[str, Any]]) -> int:
    """Tek bir kategori için 0-100 arası puan hesaplar."""
    score = 100
    for issue in issues:
        severity = issue.get("severity", "low").lower()
        penalty = PENALTIES.get(severity, 3)
        score -= penalty
    return max(0, min(100, score))


def calculate_audit_scores(
    seo_result: Dict[str, Any],
    security_result: Dict[str, Any],
    performance_result: Dict[str, Any],
    accessibility_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Dört ana kategorideki skorları ve genel weighted audit skorunu hesaplar.
    """
    seo_score = calculate_category_score(seo_result.get("issues", []))
    security_score = calculate_category_score(security_result.get("issues", []))
    perf_score = calculate_category_score(performance_result.get("issues", []))
    a11y_score = calculate_category_score(accessibility_result.get("issues", []))

    overall_score = round(
        (security_score * WEIGHTS["security"]) +
        (seo_score * WEIGHTS["seo"]) +
        (perf_score * WEIGHTS["performance"]) +
        (a11y_score * WEIGHTS["accessibility"])
    )

    all_issues = (
        seo_result.get("issues", []) +
        security_result.get("issues", []) +
        performance_result.get("issues", []) +
        accessibility_result.get("issues", [])
    )

    # Önem derecesine göre sırala
    severity_order = {"high": 1, "medium": 2, "low": 3}
    sorted_issues = sorted(all_issues, key=lambda x: severity_order.get(x.get("severity", "low"), 4))

    return {
        "overall_score": overall_score,
        "scores": {
            "seo": seo_score,
            "security": security_score,
            "performance": perf_score,
            "accessibility": a11y_score,
        },
        "total_issues": len(all_issues),
        "issues_by_severity": {
            "high": sum(1 for i in all_issues if i.get("severity") == "high"),
            "medium": sum(1 for i in all_issues if i.get("severity") == "medium"),
            "low": sum(1 for i in all_issues if i.get("severity") == "low"),
        },
        "all_issues": sorted_issues
    }
