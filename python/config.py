import os


def _env_bool(name: str, default: bool = True) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


class CrawlerSettings:
    """
    Crawler güvenlik ve limit parametreleri.
    """

    max_pages: int = int(os.getenv("CRAWL_MAX_PAGES", "10"))
    request_delay: float = float(os.getenv("CRAWL_REQUEST_DELAY", "0.5"))
    timeout: float = float(os.getenv("CRAWL_TIMEOUT", "10"))
    max_redirects: int = int(os.getenv("CRAWL_MAX_REDIRECTS", "3"))
    respect_robots: bool = _env_bool("CRAWL_RESPECT_ROBOTS", True)
