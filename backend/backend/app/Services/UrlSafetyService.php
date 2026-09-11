<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class UrlSafetyService
{
    /**
     * RFC1918, loopback, link-local ve benzeri dahili aralıklar.
     *
     * @var list<array{0: string, 1: string}>
     */
    private const PRIVATE_RANGES = [
        ['0.0.0.0', '0.255.255.255'],
        ['10.0.0.0', '10.255.255.255'],
        ['100.64.0.0', '100.127.255.255'],
        ['127.0.0.0', '127.255.255.255'],
        ['169.254.0.0', '169.254.255.255'],
        ['172.16.0.0', '172.31.255.255'],
        ['192.168.0.0', '192.168.255.255'],
    ];

    /**
     * @return array{0: bool, 1: string}
     */
    public function inspect(string $url): array
    {
        $parts = parse_url($url);
        if ($parts === false || empty($parts['scheme']) || empty($parts['host'])) {
            return [false, 'Geçersiz URL formatı.'];
        }

        $scheme = strtolower($parts['scheme']);
        if (! in_array($scheme, ['http', 'https'], true)) {
            return [false, "İzin verilmeyen protokol: {$scheme}"];
        }

        $host = strtolower($parts['host']);
        $host = trim($host, '[]');

        if (in_array($host, ['localhost', 'localhost.localdomain', 'metadata.google.internal'], true)) {
            return [false, "SSRF Koruması: '{$host}' dahili adrese denk geliyor. Tarama reddedildi."];
        }

        if ($this->isPrivateIp($host)) {
            return [false, "SSRF Koruması: '{$host}' özel/dahili IP aralığında. Tarama reddedildi."];
        }

        $resolved = $this->resolveHostIps($host);
        foreach ($resolved as $ip) {
            if ($this->isPrivateIp($ip)) {
                return [false, "SSRF Koruması: '{$host}' çözümlenen IP ({$ip}) dahili ağda. Tarama reddedildi."];
            }
        }

        return [true, ''];
    }

    public function assertSafe(string $url, string $attribute = 'url'): void
    {
        [$allowed, $reason] = $this->inspect($url);
        if (! $allowed) {
            throw ValidationException::withMessages([
                $attribute => $reason,
            ]);
        }
    }

    public function validationRule(string $attribute = 'url'): \Closure
    {
        return function (string $attr, mixed $value, \Closure $fail) {
            if (! is_string($value)) {
                $fail('Geçersiz URL.');
                return;
            }
            [$allowed, $reason] = $this->inspect($value);
            if (! $allowed) {
                $fail($reason);
            }
        };
    }

    /**
     * @return list<string>
     */
    private function resolveHostIps(string $host): array
    {
        if ($this->looksLikeIp($host)) {
            return [$host];
        }

        $ips = [];
        $records = @dns_get_record($host, DNS_A + DNS_AAAA);
        if (is_array($records)) {
            foreach ($records as $record) {
                if (! empty($record['ip'])) {
                    $ips[] = $record['ip'];
                }
                if (! empty($record['ipv6'])) {
                    $ips[] = $record['ipv6'];
                }
            }
        }

        $fallback = @gethostbynamel($host);
        if (is_array($fallback)) {
            $ips = array_merge($ips, $fallback);
        }

        return array_values(array_unique($ips));
    }

    private function looksLikeIp(string $host): bool
    {
        return filter_var($host, FILTER_VALIDATE_IP) !== false;
    }

    public function isPrivateIp(string $ip): bool
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $packed = @inet_pton($ip);
            if ($packed === false) {
                return false;
            }
            // ::1 loopback
            if ($packed === inet_pton('::1')) {
                return true;
            }
            // fc00::/7 unique local, fe80::/10 link-local
            $first = ord($packed[0]);
            if (($first & 0xfe) === 0xfc || ($first === 0xfe && (ord($packed[1]) & 0xc0) === 0x80)) {
                return true;
            }
            // IPv4-mapped
            if (str_starts_with($ip, '::ffff:')) {
                return $this->isPrivateIp(substr($ip, 7));
            }
            return false;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) === false) {
            return false;
        }

        $long = ip2long($ip);
        if ($long === false) {
            return false;
        }

        foreach (self::PRIVATE_RANGES as [$start, $end]) {
            $startLong = ip2long($start);
            $endLong = ip2long($end);
            if ($startLong !== false && $endLong !== false && $long >= $startLong && $long <= $endLong) {
                return true;
            }
        }

        return false;
    }
}
