import pytest
from analyzers.seo_analyzer import analyze_seo
from analyzers.security_analyzer import analyze_security
from analyzers.performance_analyzer import analyze_performance
from analyzers.accessibility_analyzer import analyze_accessibility
from utils.scorer import calculate_audit_scores, calculate_category_score
from utils.ai_audit_reporter import AIAuditReporter


class TestSEOAnalyzer:
    def test_seo_detects_missing_tags(self):
        bad_html = "<html><body><p>Merhaba</p></body></html>"
        res = analyze_seo(bad_html, "https://example.com")

        assert res["title"] is None
        assert res["h1_count"] == 0
        assert res["issue_count"] >= 3
        codes = [i["code"] for i in res["issues"]]
        assert "missing_title" in codes
        assert "missing_h1" in codes

    def test_seo_valid_html_has_few_issues(self):
        good_html = """
        <html>
        <head>
            <title>AURA AI Kamu Web Denetim Sistemi</title>
            <meta name="description" content="AURA kamu web sitelerini SEO, güvenlik ve erişilebilirlik yönünden otomatik denetleyen AI platformudur.">
            <link rel="canonical" href="https://example.com">
            <meta property="og:title" content="AURA AI">
            <meta property="og:description" content="Kamu Denetim">
            <meta property="og:image" content="https://example.com/logo.png">
        </head>
        <body>
            <h1>AURA Ana Sayfa</h1>
        </body>
        </html>
        """
        res = analyze_seo(good_html, "https://example.com")
        assert res["title"] == "AURA AI Kamu Web Denetim Sistemi"
        assert res["h1_count"] == 1
        assert res["issue_count"] == 0


class TestSecurityAnalyzer:
    def test_security_detects_http_and_missing_headers(self):
        res = analyze_security("http://insecure.example.com", {})
        assert not res["is_https"]
        codes = [i["code"] for i in res["issues"]]
        assert "no_https" in codes
        assert "missing_hsts" in codes
        assert "missing_csp" in codes

    def test_security_with_secure_headers(self):
        headers = {
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'",
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff"
        }
        res = analyze_security("https://secure.example.com", headers)
        assert res["is_https"]
        assert res["headers_checked"]["hsts"]
        assert res["headers_checked"]["csp"]
        assert res["headers_checked"]["x_frame_options"]


class TestPerformanceAnalyzer:
    def test_performance_detects_slow_response(self):
        res = analyze_performance("https://example.com", response_time_ms=3500.0, html="x"*1000)
        assert res["response_time_ms"] == 3500.0
        codes = [i["code"] for i in res["issues"]]
        assert "slow_response_time" in codes


class TestAccessibilityAnalyzer:
    def test_accessibility_detects_missing_lang(self):
        bad_html = "<html><body><input type='text'></body></html>"
        res = analyze_accessibility(bad_html, "https://example.com")
        assert not res["has_html_lang"]
        codes = [i["code"] for i in res["issues"]]
        assert "missing_html_lang" in codes
        assert res["inputs_without_label"] == 1


class TestScorerAndReporter:
    def test_scoring_weights(self):
        seo_res = {"issues": [{"severity": "high"}]} # 100 - 15 = 85
        sec_res = {"issues": []}                     # 100
        perf_res = {"issues": []}                    # 100
        a11y_res = {"issues": []}                    # 100

        res = calculate_audit_scores(seo_res, sec_res, perf_res, a11y_res)
        assert res["scores"]["seo"] == 85
        assert res["scores"]["security"] == 100
        assert res["overall_score"] > 90

    def test_ai_audit_reporter_generate(self):
        reporter = AIAuditReporter()
        audit_data = {
            "overall_score": 78,
            "scores": {"seo": 80, "security": 70, "performance": 85, "accessibility": 80},
            "all_issues": [{"severity": "high", "message": "HTTPS kullanılmıyor."}]
        }
        report = reporter.generate_report(audit_data)
        assert "summary" in report
        assert "recommendations" in report
        assert len(report["recommendations"]) > 0
