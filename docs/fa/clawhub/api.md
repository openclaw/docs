---
read_when:
    - ساخت کلاینت‌های API
    - افزودن نقاط پایانی یا طرح‌واره‌ها
summary: نمای کلی و قراردادهای REST API عمومی (v1).
x-i18n:
    generated_at: "2026-05-12T00:56:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

پایه: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## استفادهٔ مجدد از کاتالوگ عمومی

می‌توانید بر پایهٔ APIهای خواندنی عمومی ClawHub، یک کاتالوگ، فهرست، یا سطح جست‌وجوی شخص ثالث بسازید. فرادادهٔ عمومی Skills و فایل‌های Skills تحت قوانین مجوز Skills در ClawHub منتشر می‌شوند، در حالی که خود API محدودیت نرخ دارد و باید مسئولانه مصرف شود.

راهنماها:

- برای فهرست‌های کاتالوگ از endpointهای خواندنی عمومی مانند `GET /api/v1/skills`، `GET /api/v1/search` و `GET /api/v1/skills/{slug}` استفاده کنید.
- پاسخ‌ها را cache کنید و به‌جای polling تهاجمی، به `429`، `Retry-After` و headerهای محدودیت نرخ احترام بگذارید.
- هنگام نمایش فهرست‌ها، به URL رسمی Skills در ClawHub لینک بدهید تا کاربران بتوانند رکورد رجیستری مبدأ را بررسی کنند.
- از URLهای صفحهٔ رسمی به شکل `https://clawhub.ai/<owner>/<slug>` استفاده کنید.
- القا نکنید که ClawHub سایت شخص ثالث را تأیید، راستی‌آزمایی، یا اداره می‌کند.
- با دور زدن فیلترهای API عمومی یا مرزهای auth، محتوای پنهان، خصوصی، یا مسدودشده توسط moderation را mirror نکنید.

## Auth

- خواندن عمومی: نیازی به token نیست.
- نوشتن + حساب: `Authorization: Bearer clh_...`.

## محدودیت‌های نرخ

اعمال وابسته به Auth:

- درخواست‌های ناشناس: به‌ازای هر IP.
- درخواست‌های احراز هویت‌شده (token معتبر Bearer): به‌ازای bucket هر کاربر.
- token ناموجود/نامعتبر به اعمال محدودیت بر اساس IP برمی‌گردد.

- خواندن: 600/min به‌ازای هر IP، 2400/min به‌ازای هر key
- نوشتن: 45/min به‌ازای هر IP، 180/min به‌ازای هر key

Headerها: `X-RateLimit-Limit`، `X-RateLimit-Remaining`، `X-RateLimit-Reset`، `RateLimit-Limit`، `RateLimit-Remaining`، `RateLimit-Reset`، `Retry-After` (روی 429).

معناشناسی:

- `X-RateLimit-Reset`: ثانیه‌های Unix epoch (زمان مطلق reset)
- `RateLimit-Reset`: ثانیه‌های تأخیر تا reset
- `Retry-After`: ثانیه‌های تأخیری که باید روی `429` منتظر بمانید

نمونهٔ `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

مدیریت client:

- در صورت وجود، `Retry-After` را ترجیح دهید.
- در غیر این صورت از `RateLimit-Reset` استفاده کنید یا تأخیر را از `X-RateLimit-Reset` استخراج کنید.
- به retryها jitter اضافه کنید.

## Endpointها

خواندن عمومی:

- `GET /api/v1/search?q=...`
  - فیلترهای اختیاری: `highlightedOnly=true`، `nonSuspiciousOnly=true`
  - alias قدیمی: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (پیش‌فرض)، `createdAt` (`newest`)، `downloads`، `stars` (`rating`)، `installsCurrent` (`installs`)، `installsAllTime`، `trending`
  - `cursor` روی sortهای غیر از `trending` اعمال می‌شود
  - فیلتر اختیاری: `nonSuspiciousOnly=true`
  - alias قدیمی: `nonSuspicious=true`
  - با `nonSuspiciousOnly=true`، صفحه‌های مبتنی بر cursor ممکن است کمتر از `limit` مورد داشته باشند؛ برای ادامه از `nextCursor` استفاده کنید.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

نیازمند Auth:

- `POST /api/v1/skills` (انتشار، multipart ترجیح داده می‌شود)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

فقط admin:

- `POST /api/v1/users/reserve`، slugهای root و placeholderهای بستهٔ خصوصی بدون release را برای handle یک owner رزرو می‌کند.

## قدیمی

`/api/*` و `/api/cli/*` قدیمی همچنان در دسترس‌اند. `DEPRECATIONS.md` را ببینید.
