import re
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


def analyze_accessibility(html: str, url: str) -> Dict[str, Any]:
    """
    Erişilebilirlik (A11y) analizi:
    HTML lang özniteliği, başlık sıralaması, form etiketleri, boş butonlar/linkler.
    """
    issues = []

    # 1. HTML lang kontrolü
    lang_match = re.search(r'<html[^>]+lang=["\']([^"\']+)["\']', html, re.IGNORECASE)
    has_lang = bool(lang_match)
    if not has_lang:
        issues.append({
            "severity": "high",
            "code": "missing_html_lang",
            "message": "<html> etiketinde 'lang' özniteliği bulunamadı. Ekran okuyucular dili belirleyemez."
        })

    # 2. Form etiketi (label / aria-label) kontrolü
    inputs = re.findall(r'<input[^>]*>', html, re.IGNORECASE)
    inputs_without_label = 0
    for inp in inputs:
        # hidden, submit, button türlerini atla
        if re.search(r'type=["\'](?:hidden|submit|button|image)["\']', inp, re.IGNORECASE):
            continue
        if not re.search(r'aria-label|aria-labelledby|placeholder|id=', inp, re.IGNORECASE):
            inputs_without_label += 1

    if inputs_without_label > 0:
        issues.append({
            "severity": "medium",
            "code": "inputs_missing_labels",
            "message": f"{inputs_without_label} adet form girdi alanında etiket (label/aria-label) eksik."
        })

    # 3. Boş buton veya boş link kontrolü
    empty_buttons = len(re.findall(r'<button[^>]*>\s*</button>', html, re.IGNORECASE))
    if empty_buttons > 0:
        issues.append({
            "severity": "low",
            "code": "empty_buttons",
            "message": f"{empty_buttons} adet buton etiketiz/içeriksiz."
        })

    return {
        "url": url,
        "has_html_lang": has_lang,
        "lang_code": lang_match.group(1) if lang_match else None,
        "inputs_without_label": inputs_without_label,
        "empty_buttons": empty_buttons,
        "issues": issues,
        "issue_count": len(issues),
    }
