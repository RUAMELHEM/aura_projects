import re
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)


def _get_tag(html: str, tag: str) -> Optional[str]:
    match = re.search(rf"<{tag}[^>]*>([^<]+)</{tag}>", html, re.IGNORECASE)
    return match.group(1).strip() if match else None


def _get_meta(html: str, name: str) -> Optional[str]:
    """name veya property meta etiketini çeker."""
    match = re.search(
        rf'<meta[^>]+(?:name|property)=["\'](?:og:)?{name}["\'][^>]+content=["\']([^"\']+)["\']',
        html, re.IGNORECASE
    )
    if not match:
        match = re.search(
            rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:name|property)=["\'](?:og:)?{name}["\']',
            html, re.IGNORECASE
        )
    return match.group(1).strip() if match else None


def _count_headings(html: str, level: int) -> int:
    return len(re.findall(rf"<h{level}[^>]*>", html, re.IGNORECASE))


def _check_canonical(html: str) -> bool:
    return bool(re.search(r'<link[^>]+rel=["\']canonical["\']', html, re.IGNORECASE))


def _check_sitemap(html: str) -> bool:
    return bool(re.search(r'sitemap\.xml', html, re.IGNORECASE))


def _count_images_without_alt(html: str) -> int:
    imgs = re.findall(r'<img[^>]*>', html, re.IGNORECASE)
    missing = 0
    for img in imgs:
        if 'alt=' not in img.lower():
            missing += 1
        elif re.search(r'alt=["\']["\']', img):
            missing += 1
    return missing


def _check_open_graph(html: str) -> Dict[str, bool]:
    return {
        "og:title": bool(re.search(r'property=["\']og:title["\']', html, re.IGNORECASE)),
        "og:description": bool(re.search(r'property=["\']og:description["\']', html, re.IGNORECASE)),
        "og:image": bool(re.search(r'property=["\']og:image["\']', html, re.IGNORECASE)),
    }


def analyze_seo(html: str, url: str) -> Dict[str, Any]:
    """
    SEO analizi: title, meta description, heading hiyerarşisi, canonical, sitemap, Open Graph.
    """
    issues = []

    title = _get_tag(html, "title")
    meta_desc = _get_meta(html, "description")
    h1_count = _count_headings(html, 1)
    h2_count = _count_headings(html, 2)
    has_canonical = _check_canonical(html)
    has_sitemap = _check_sitemap(html)
    images_without_alt = _count_images_without_alt(html)
    og = _check_open_graph(html)

    # Sorun tespiti
    if not title:
        issues.append({"severity": "high", "code": "missing_title", "message": "Sayfa başlığı (title) eksik."})
    elif len(title) < 10:
        issues.append({"severity": "medium", "code": "short_title", "message": f"Sayfa başlığı çok kısa ({len(title)} karakter)."})
    elif len(title) > 60:
        issues.append({"severity": "low", "code": "long_title", "message": f"Sayfa başlığı uzun ({len(title)} karakter, önerilen <60)."})

    if not meta_desc:
        issues.append({"severity": "high", "code": "missing_meta_description", "message": "Meta description eksik."})
    elif len(meta_desc) < 50:
        issues.append({"severity": "medium", "code": "short_meta_description", "message": f"Meta description çok kısa ({len(meta_desc)} karakter)."})

    if h1_count == 0:
        issues.append({"severity": "high", "code": "missing_h1", "message": "H1 başlığı eksik."})
    elif h1_count > 1:
        issues.append({"severity": "medium", "code": "multiple_h1", "message": f"Birden fazla H1 başlığı var ({h1_count} adet)."})

    if not has_canonical:
        issues.append({"severity": "medium", "code": "missing_canonical", "message": "Canonical link etiketi eksik."})

    if images_without_alt > 0:
        issues.append({"severity": "medium", "code": "images_without_alt", "message": f"{images_without_alt} görüntü alt etiketi eksik."})

    missing_og = [k for k, v in og.items() if not v]
    if missing_og:
        issues.append({"severity": "low", "code": "missing_open_graph", "message": f"Open Graph etiketleri eksik: {', '.join(missing_og)}"})

    return {
        "url": url,
        "title": title,
        "meta_description": meta_desc,
        "h1_count": h1_count,
        "h2_count": h2_count,
        "has_canonical": has_canonical,
        "has_sitemap_ref": has_sitemap,
        "images_without_alt": images_without_alt,
        "open_graph": og,
        "issues": issues,
        "issue_count": len(issues),
    }
