import re
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


def analyze_security(url: str, headers: Dict[str, str], html: str = "") -> Dict[str, Any]:
    """
    Güvenlik analizi — YALNIZCA pasif gözlem, saldırı/exploit kodu içermez.
    Kontroller: HTTPS, HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Çerez güvenliği.
    """
    issues = []

    # Başlıkları büyük/küçük harfe duyarsız yap
    headers_lower = {k.lower(): v for k, v in headers.items()}

    # 1. HTTPS kontrolü
    is_https = url.startswith("https://")
    if not is_https:
        issues.append({
            "severity": "high",
            "code": "no_https",
            "message": "Site HTTPS kullanmıyor. Veriler şifresiz iletiliyor."
        })

    # 2. HTTP Strict Transport Security (HSTS)
    hsts = headers_lower.get("strict-transport-security")
    if not hsts:
        issues.append({
            "severity": "high",
            "code": "missing_hsts",
            "message": "Strict-Transport-Security (HSTS) başlığı eksik."
        })

    # 3. Content Security Policy (CSP)
    csp = headers_lower.get("content-security-policy")
    if not csp:
        issues.append({
            "severity": "high",
            "code": "missing_csp",
            "message": "Content-Security-Policy (CSP) başlığı eksik. XSS saldırılarına karşı savunmasız olabilir."
        })
    elif "unsafe-inline" in csp:
        issues.append({
            "severity": "medium",
            "code": "csp_unsafe_inline",
            "message": "CSP 'unsafe-inline' içeriyor. Bu XSS riskini artırabilir."
        })

    # 4. X-Frame-Options / Clickjacking Koruması
    xfo = headers_lower.get("x-frame-options")
    csp_frame = csp and "frame-ancestors" in csp if csp else False
    if not xfo and not csp_frame:
        issues.append({
            "severity": "medium",
            "code": "missing_x_frame_options",
            "message": "X-Frame-Options başlığı eksik. Clickjacking saldırılarına karşı savunmasız olabilir."
        })

    # 5. X-Content-Type-Options
    xcto = headers_lower.get("x-content-type-options")
    if not xcto or xcto.lower() != "nosniff":
        issues.append({
            "severity": "low",
            "code": "missing_x_content_type_options",
            "message": "X-Content-Type-Options: nosniff başlığı eksik."
        })

    # 6. Çerez güvenliği (HTML içindeki Set-Cookie başlıklarında)
    set_cookie = headers_lower.get("set-cookie", "")
    if set_cookie:
        if "secure" not in set_cookie.lower():
            issues.append({
                "severity": "medium",
                "code": "insecure_cookie",
                "message": "Çerezde 'Secure' bayrağı eksik."
            })
        if "httponly" not in set_cookie.lower():
            issues.append({
                "severity": "medium",
                "code": "cookie_no_httponly",
                "message": "Çerezde 'HttpOnly' bayrağı eksik."
            })

    # 7. Server başlığı bilgi sızdırma kontrolü
    server = headers_lower.get("server", "")
    if server and re.search(r"\d+\.\d+", server):
        issues.append({
            "severity": "low",
            "code": "server_version_exposed",
            "message": f"Server başlığı versiyon bilgisini açıklıyor: '{server}'"
        })

    return {
        "url": url,
        "is_https": is_https,
        "headers_checked": {
            "hsts": bool(hsts),
            "csp": bool(csp),
            "x_frame_options": bool(xfo),
            "x_content_type_options": bool(xcto and xcto.lower() == "nosniff"),
        },
        "issues": issues,
        "issue_count": len(issues),
    }
