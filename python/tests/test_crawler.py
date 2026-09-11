import pytest
from utils.crawler import WebCrawler, is_allowed_url, is_private_ip


class TestSSRFProtection:
    def test_blocks_localhost(self):
        allowed, reason = is_allowed_url("http://localhost/admin")
        assert not allowed
        assert "SSRF" in reason or "dahili" in reason.lower() or "localhost" in reason.lower()

    def test_blocks_loopback_ip(self):
        allowed, reason = is_allowed_url("http://127.0.0.1/")
        assert not allowed

    def test_blocks_private_ip_10_range(self):
        allowed, reason = is_allowed_url("http://10.0.0.1/secret")
        assert not allowed

    def test_blocks_private_ip_192_range(self):
        allowed, reason = is_allowed_url("http://192.168.1.1/router")
        assert not allowed

    def test_blocks_link_local_169(self):
        allowed, reason = is_allowed_url("http://169.254.169.254/latest/meta-data/")
        assert not allowed

    def test_blocks_invalid_scheme(self):
        allowed, reason = is_allowed_url("ftp://example.com/file")
        assert not allowed
        assert "protokol" in reason.lower() or "scheme" in reason.lower()

    def test_allows_public_https_url(self):
        allowed, reason = is_allowed_url("https://www.example.com/about")
        assert allowed
        assert reason == ""


class TestWebCrawlerPageLimit:
    def test_max_pages_limit_respected(self, monkeypatch):
        """
        max_pages sınırına ulaşıldığında taramanın durduğunu doğrular.
        """
        # Gerçek HTTP isteği yapmadan test etmek için mock kullanıyoruz
        import unittest.mock as mock

        crawler = WebCrawler(max_pages=2, request_delay=0)

        fake_html = """
        <html><head><title>Test Page</title></head>
        <body>
            <a href="/page1">Link 1</a>
            <a href="/page2">Link 2</a>
            <a href="/page3">Link 3</a>
            <a href="/page4">Link 4</a>
        </body></html>
        """

        mock_response = mock.MagicMock()
        mock_response.status_code = 200
        mock_response.is_redirect = False
        mock_response.headers = {"content-type": "text/html"}
        mock_response.text = fake_html

        with mock.patch("httpx.Client") as mock_client_class:
            mock_client = mock.MagicMock()
            mock_client.get.return_value = mock_response
            mock_client.__enter__ = mock.MagicMock(return_value=mock_client)
            mock_client.__exit__ = mock.MagicMock(return_value=False)
            mock_client_class.return_value = mock_client

            result = crawler.crawl("https://example.com")

            # max_pages=2 ile sadece 2 sayfa ziyaret edilmeli
            assert len(result.pages) <= 2
            assert result.error is None


class TestRedirectSsrfProtection:
    def test_does_not_follow_redirect_to_private_ip(self):
        import unittest.mock as mock

        crawler = WebCrawler(max_pages=3, request_delay=0, respect_robots=False)

        redirect_response = mock.MagicMock()
        redirect_response.is_redirect = True
        redirect_response.headers = {"location": "http://127.0.0.1/secret"}
        redirect_response.url = "https://example.com"
        redirect_response.status_code = 302

        with mock.patch("httpx.Client") as mock_client_class:
            mock_client = mock.MagicMock()
            mock_client.get.return_value = redirect_response
            mock_client.__enter__ = mock.MagicMock(return_value=mock_client)
            mock_client.__exit__ = mock.MagicMock(return_value=False)
            mock_client_class.return_value = mock_client

            result = crawler.crawl("https://example.com")

            called_urls = [call.args[0] for call in mock_client.get.call_args_list]
            assert all("127.0.0.1" not in u for u in called_urls)
            assert result.error is not None
            assert "SSRF" in result.error or "dahili" in result.error.lower() or "yönlendirme" in result.error.lower()
