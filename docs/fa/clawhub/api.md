---
read_when:
    - ساخت کلاینت‌های API
    - افزودن نقاط پایانی یا طرح‌واره‌ها
summary: نمای کلی و قراردادهای API عمومی REST (v1).
x-i18n:
    generated_at: "2026-06-28T07:41:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

پایه: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## استفادهٔ دوباره از کاتالوگ عمومی

می‌توانید روی APIهای خواندنی عمومی ClawHub یک کاتالوگ، فهرست‌نما، یا سطح جست‌وجوی شخص ثالث بسازید. فرادادهٔ عمومی skill و فایل‌های skill تحت قواعد مجوز skill در ClawHub منتشر می‌شوند، در حالی که خود API محدودیت نرخ دارد و باید مسئولانه مصرف شود.

دستورالعمل‌ها:

- برای فهرست‌های کاتالوگ از endpointهای خواندنی عمومی مانند `GET /api/v1/skills`، `GET /api/v1/search`، و `GET /api/v1/skills/{slug}` استفاده کنید.
- پاسخ‌ها را cache کنید و به‌جای polling تهاجمی، به `429`، `Retry-After`، و headerهای محدودیت نرخ احترام بگذارید.
- هنگام نمایش فهرست‌ها، به URL رسمی skill در ClawHub لینک دهید تا کاربران بتوانند رکورد registry منبع را بررسی کنند.
- از URLهای صفحهٔ رسمی در قالب `https://clawhub.ai/<owner>/skills/<slug>` استفاده کنید.
- القا نکنید که ClawHub سایت شخص ثالث را تأیید، راستی‌آزمایی، یا اداره می‌کند.
- محتوای پنهان، خصوصی، یا مسدودشده توسط moderation را با دور زدن فیلترهای API عمومی یا مرزهای auth mirror نکنید.

## Auth

- خواندن عمومی: token لازم نیست.
- نوشتن + account: `Authorization: Bearer clh_...`.

## محدودیت‌های نرخ

اعمال آگاه از auth:

- درخواست‌های ناشناس: بر اساس IP.
- درخواست‌های احراز هویت‌شده (Bearer token معتبر): بر اساس bucket کاربر.
- token ناموجود/نامعتبر به اعمال بر اساس IP fallback می‌کند.

- خواندن: 3000/min برای هر IP، 12000/min برای هر key
- نوشتن: 300/min برای هر IP، 3000/min برای هر key
- دانلود: 1200/min برای هر IP، 6000/min برای هر key

Headerها: `X-RateLimit-Limit`، `X-RateLimit-Reset`، `RateLimit-Limit`، `RateLimit-Reset`؛
`X-RateLimit-Remaining`، `RateLimit-Remaining`، و `Retry-After` روی `429` گنجانده می‌شوند.

معناشناسی:

- `X-RateLimit-Reset`: ثانیه‌های Unix epoch (زمان مطلق reset)
- `RateLimit-Reset`: ثانیه‌های تأخیر تا reset
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجهٔ باقی‌ماندهٔ دقیق در صورت
  وجود؛ درخواست‌های موفق sharded به‌جای برگرداندن مقدار global تقریبی،
  آن را حذف می‌کنند
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

- وقتی `Retry-After` وجود دارد، آن را ترجیح دهید.
- در غیر این صورت از `RateLimit-Reset` استفاده کنید یا تأخیر را از `X-RateLimit-Reset` به دست آورید.
- به retryها jitter اضافه کنید.

## خطاها

- خطاهای v1 متن ساده هستند (`text/plain; charset=utf-8`)، شامل `400`،
  `401`، `403`، `404`، `429`، و پاسخ‌های دانلود مسدودشده.
- پارامترهای query ناشناخته برای سازگاری نادیده گرفته می‌شوند.
- پارامترهای query شناخته‌شده با مقادیر نامعتبر `400` برمی‌گردانند.

## Endpointها

خواندن عمومی:

- `GET /api/v1/search?q=...`
  - فیلترهای اختیاری: `highlightedOnly=true`، `nonSuspiciousOnly=true`
  - alias قدیمی: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (پیش‌فرض)، `recommended` (`default`)، `createdAt` (`newest`)، `downloads`، `stars` (`rating`)، aliasهای نصب قدیمی `installsCurrent`/`installs`/`installsAllTime` به `downloads` نگاشت می‌شوند، `trending`
  - مقادیر نامعتبر `sort`، `400` برمی‌گردانند
  - `cursor` برای مرتب‌سازی‌های غیر `trending` اعمال می‌شود
  - فیلتر اختیاری: `nonSuspiciousOnly=true`
  - alias قدیمی: `nonSuspicious=true`
  - با `nonSuspiciousOnly=true`، صفحه‌های مبتنی بر cursor ممکن است کمتر از `limit` آیتم داشته باشند؛ برای ادامه از `nextCursor` استفاده کنید.
  - `recommended` از سیگنال‌های engagement و تازگی استفاده می‌کند.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills میزبانی‌شده byteهای ZIP deterministic برمی‌گردانند.
  - Skills فعلیِ پشتیبانی‌شده با GitHub که scan آنها `clean` یا `suspicious` است،
    به‌جای byteهای ClawHub یک توصیفگر handoff از نوع JSON `public-github` برمی‌گردانند.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills میزبانی‌شده به‌صورت فایل‌های ذخیره‌شده export می‌شوند.
  - Skills فعلیِ پشتیبانی‌شده با GitHub که scan آنها `clean` یا `suspicious` است،
    به‌صورت توصیفگرهای handoff نوع `public-github` export می‌شوند.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (پیش‌فرض)، `recommended`، `downloads`، alias قدیمی `installs`
  - مقادیر نامعتبر `sort`، `400` برمی‌گردانند
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (پیش‌فرض)، `downloads`، `updated`، alias قدیمی `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Auth لازم است:

- `POST /api/v1/skills` (publish، multipart ترجیح داده می‌شود)
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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

فقط admin:

- `POST /api/v1/users/reserve`، slugهای root و placeholderهای package خصوصی بدون release را برای یک owner handle رزرو می‌کند.

## Legacy

Legacy `/api/*` و `/api/cli/*` هنوز در دسترس هستند. `DEPRECATIONS.md` را ببینید.
