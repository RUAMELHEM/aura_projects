<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Website crawler güvenlik sınırları
    |--------------------------------------------------------------------------
    */
    'max_pages' => (int) env('CRAWL_MAX_PAGES', 10),
    'request_delay' => (float) env('CRAWL_REQUEST_DELAY', 0.5),
    'timeout' => (float) env('CRAWL_TIMEOUT', 10),
    'max_redirects' => (int) env('CRAWL_MAX_REDIRECTS', 3),
];
