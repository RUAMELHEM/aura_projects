import ipaddress
import re
import socket
import time
import urllib.parse
import urllib.robotparser
import logging
from dataclasses import dataclass, field
from typing import Optional, List, Set, Dict, Any

logger = logging.getLogger(__name__)

# SSRF Koruması: Özel/dahili IP aralıkları
PRIVATE_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # Link-local
    ipaddress.ip_network("::1/128"),           # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),          # IPv6 private
]


@dataclass
class CrawledPage:
    url: str
    status_code: int
    response_time_ms: float
    content_type: str
    html: Optional[str] = None
    title: Optional[str] = None
    error: Optional[str] = None


@dataclass
class CrawlResult:
    base_url: str
    pages: List[CrawledPage] = field(default_factory=list)
    total_pages_found: int = 0
    crawl_time_seconds: float = 0.0
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "base_url": self.base_url,
            "pages_crawled": len(self.pages),
            "total_pages_found": self.total_pages_found,
            "crawl_time_seconds": round(self.crawl_time_seconds, 2),
            "error": self.error,
            "pages": [
                {
                    "url": p.url,
                    "status_code": p.status_code,
                    "response_time_ms": round(p.response_time_ms, 1),
                    "content_type": p.content_type,
                    "title": p.title,
                    "error": p.error,
                }
                for p in self.pages
            ],
        }


def is_private_ip(host: str) -> bool:
    """
    SSRF Koruması: Verilen host'un özel/dahili IP adresi mi olduğunu kontrol eder.
    DNS çözümlemesi yaparak yönlendirmeleri de yakalar (DNS Rebinding önlemi).
    """
    # Localhost kontrolü
    if host.lower() in ("localhost", "localhost.localdomain"):
        return True

    # Metadata endpoint kontrolü (AWS, GCP, Azure)
    if host.startswith("169.254.") or host in ("metadata.google.internal",):
        return True

    try:
        # DNS çözümlemesi yap
        resolved_ips = socket.getaddrinfo(host, None)
        for _, _, _, _, addr in resolved_ips:
            ip_str = addr[0]
            try:
                ip = ipaddress.ip_address(ip_str)
                if ip.is_loopback or ip.is_link_local or ip.is_private:
                    return True
                for private_range in PRIVATE_IP_RANGES:
                    if ip in private_range:
                        return True
            except ValueError:
                continue
    except socket.gaierror:
        # DNS çözümlemesi başarısız — bilinmeyen host, güvenli say
        pass
    return False


def is_allowed_url(url: str) -> tuple[bool, str]:
    """
    URL'nin crawl edilip edilemeyeceğini kontrol eder.
    Returns (allowed: bool, reason: str)
    """
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False, "Geçersiz URL formatı."

    if parsed.scheme not in ("http", "https"):
        return False, f"İzin verilmeyen protokol: {parsed.scheme}"

    host = parsed.hostname
    if not host:
        return False, "URL'de host bulunamadı."

    if is_private_ip(host):
        return False, f"SSRF Koruması: '{host}' dahili/özel IP aralığında. Tarama reddedildi."

    return True, ""


class SsrfBlockedError(Exception):
    """Yönlendirme veya hedef URL özel/dahili ağa düştüğünde fırlatılır."""


class WebCrawler:
    """
    Güvenli ve kontrollü web crawler.
    - SSRF koruması (özel IP tespiti + DNS rebinding önlemi)
    - robots.txt uyumu
    - Sayfa limiti, gecikme ve timeout kontrolü
    - Redirect'ler otomatik takip edilmez; her hop SSRF kontrolünden geçer
    """

    def __init__(
        self,
        max_pages: int = 10,
        request_delay: float = 0.5,
        timeout: float = 10.0,
        respect_robots: bool = True,
        max_redirects: int = 3,
    ):
        self.max_pages = max_pages
        self.request_delay = request_delay
        self.timeout = timeout
        self.respect_robots = respect_robots
        self.max_redirects = max_redirects

    def _check_robots(self, base_url: str, url: str) -> bool:
        """robots.txt'i kontrol eder ve URL'ye izin verilip verilmediğini döner."""
        try:
            parsed = urllib.parse.urlparse(base_url)
            robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            return rp.can_fetch("*", url)
        except Exception:
            return True  # robots.txt okunamazsa izin ver

    def _extract_links(self, html: str, base_url: str) -> List[str]:
        """HTML içinden geçerli dahili linkleri çıkarır."""
        parsed_base = urllib.parse.urlparse(base_url)
        base_domain = f"{parsed_base.scheme}://{parsed_base.netloc}"

        links = set()
        href_pattern = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)
        for match in href_pattern.finditer(html):
            href = match.group(1).strip()
            if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
                continue

            if href.startswith("/"):
                full_url = base_domain + href
            elif href.startswith("http"):
                full_url = href
            else:
                full_url = base_domain + "/" + href

            # Sadece aynı domain'deki linkleri dahil et
            parsed_link = urllib.parse.urlparse(full_url)
            if parsed_link.netloc == parsed_base.netloc:
                # Query string ve fragment temizle
                clean_url = f"{parsed_link.scheme}://{parsed_link.netloc}{parsed_link.path}"
                if clean_url:
                    links.add(clean_url)

        return list(links)

    def _extract_title(self, html: str) -> Optional[str]:
        """HTML'den sayfa başlığını çıkarır."""
        match = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE)
        return match.group(1).strip() if match else None

    def _fetch(self, client, url: str):
        """
        Redirect'leri elle takip eder. Her hop'ta SSRF kontrolü yapılır;
        private IP / localhost hedefine asla istek atılmaz.
        """
        current = url
        redirects = 0

        while True:
            allowed, reason = is_allowed_url(current)
            if not allowed:
                raise SsrfBlockedError(reason)

            response = client.get(current, follow_redirects=False)

            if response.is_redirect:
                location = response.headers.get("location")
                if not location:
                    return response
                if redirects >= self.max_redirects:
                    raise SsrfBlockedError("Redirect limiti aşıldı, tarama durduruldu.")
                next_url = urllib.parse.urljoin(str(response.url), location)
                next_allowed, next_reason = is_allowed_url(next_url)
                if not next_allowed:
                    raise SsrfBlockedError(
                        f"SSRF Koruması: yönlendirme reddedildi ({next_url}). {next_reason}"
                    )
                current = next_url
                redirects += 1
                continue

            return response

    def crawl(self, start_url: str) -> CrawlResult:
        """
        Verilen URL'den başlayarak siteyi tarar.
        """
        start_time = time.time()

        # 1. URL güvenlik kontrolü
        allowed, reason = is_allowed_url(start_url)
        if not allowed:
            return CrawlResult(base_url=start_url, error=reason)

        try:
            import httpx
        except ImportError:
            return CrawlResult(base_url=start_url, error="httpx kütüphanesi bulunamadı.")

        result = CrawlResult(base_url=start_url)
        to_visit: List[str] = [start_url]
        visited: Set[str] = set()

        with httpx.Client(
            timeout=self.timeout,
            follow_redirects=False,
            headers={"User-Agent": "AURABot/1.0 (+https://aura.ai/bot)"},
        ) as client:
            while to_visit and len(visited) < self.max_pages:
                url = to_visit.pop(0)
                if url in visited:
                    continue

                visited.add(url)

                parsed = urllib.parse.urlparse(url)
                if is_private_ip(parsed.hostname or ""):
                    logger.warning(f"SSRF: Özel IP tespit edildi, atlanıyor: {url}")
                    continue

                # robots.txt kontrolü
                if self.respect_robots and not self._check_robots(start_url, url):
                    logger.info(f"robots.txt tarafından engellendi: {url}")
                    continue

                page_start = time.time()
                try:
                    response = self._fetch(client, url)
                    response_time = (time.time() - page_start) * 1000

                    content_type = response.headers.get("content-type", "")
                    html = response.text if "text/html" in content_type else None

                    page = CrawledPage(
                        url=url,
                        status_code=response.status_code,
                        response_time_ms=response_time,
                        content_type=content_type,
                        html=html,
                        title=self._extract_title(html) if html else None,
                    )
                    result.pages.append(page)

                    # Yeni linkler keşfet
                    if html:
                        new_links = self._extract_links(html, start_url)
                        result.total_pages_found += len(new_links)
                        for link in new_links:
                            if link not in visited and link not in to_visit:
                                to_visit.append(link)

                except SsrfBlockedError as e:
                    logger.warning(str(e))
                    result.pages.append(CrawledPage(
                        url=url,
                        status_code=0,
                        response_time_ms=(time.time() - page_start) * 1000,
                        content_type="",
                        error=str(e),
                    ))
                    if url == start_url:
                        result.error = str(e)
                        break
                except Exception as e:
                    result.pages.append(CrawledPage(
                        url=url,
                        status_code=0,
                        response_time_ms=(time.time() - page_start) * 1000,
                        content_type="",
                        error=str(e)
                    ))

                # İzin verilen gecikme
                if self.request_delay > 0 and to_visit:
                    time.sleep(self.request_delay)

        result.crawl_time_seconds = time.time() - start_time
        result.total_pages_found = max(result.total_pages_found, len(visited))
        return result
