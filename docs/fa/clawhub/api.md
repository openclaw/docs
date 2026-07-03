---
read_when:
    - ساخت کلاینت‌های API
    - افزودن endpointها یا schemaها
summary: نمای کلی و قراردادهای API عمومی REST (v1).
x-i18n:
    generated_at: "2026-07-03T17:31:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API نسخه ۱

پایه: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## استفادهٔ دوباره از کاتالوگ عمومی

می‌توانید یک کاتالوگ، فهرست، یا سطح جست‌وجوی شخص ثالث را بر پایهٔ APIهای خواندنی عمومی ClawHub بسازید. فرادادهٔ عمومی Skills و فایل‌های Skills تحت قوانین مجوز Skills در ClawHub منتشر می‌شوند، درحالی‌که خود API محدودیت نرخ دارد و باید مسئولانه مصرف شود.

راهنماها:

- برای فهرست‌های کاتالوگ از endpointهای خواندنی عمومی مانند `GET /api/v1/skills`، `GET /api/v1/search`، و `GET /api/v1/skills/{slug}` استفاده کنید.
- پاسخ‌ها را cache کنید و به‌جای polling تهاجمی، به `429`، `Retry-After`، و headerهای محدودیت نرخ احترام بگذارید.
- هنگام نمایش فهرست‌ها، به URL رسمی Skill در ClawHub لینک دهید تا کاربران بتوانند رکورد registry منبع را بررسی کنند.
- از URLهای صفحهٔ رسمی با قالب `https://clawhub.ai/<owner>/skills/<slug>` استفاده کنید.
- القا نکنید که ClawHub سایت شخص ثالث را تأیید، راستی‌آزمایی، یا اداره می‌کند.
- با دور زدن فیلترهای API عمومی یا مرزهای احراز هویت، محتوای پنهان، خصوصی، یا مسدودشده توسط moderation را mirror نکنید.

## احراز هویت

- خواندن عمومی: token لازم نیست.
- نوشتن + حساب: `Authorization: Bearer clh_...`.

## محدودیت‌های نرخ

اعمال آگاه از احراز هویت:

- درخواست‌های ناشناس: به‌ازای هر IP.
- درخواست‌های احرازشده (Bearer token معتبر): به‌ازای bucket هر کاربر.
- token ناموجود/نامعتبر به اعمال بر اساس IP بازمی‌گردد.

- خواندن: ۳۰۰۰/دقیقه به‌ازای هر IP، ۱۲۰۰۰/دقیقه به‌ازای هر key
- نوشتن: ۳۰۰/دقیقه به‌ازای هر IP، ۳۰۰۰/دقیقه به‌ازای هر key
- دانلود: ۱۲۰۰/دقیقه به‌ازای هر IP، ۶۰۰۰/دقیقه به‌ازای هر key

Headerها: `X-RateLimit-Limit`، `X-RateLimit-Reset`، `RateLimit-Limit`، `RateLimit-Reset`;
`X-RateLimit-Remaining`، `RateLimit-Remaining`، و `Retry-After` در `429` گنجانده می‌شوند.

معناشناسی:

- `X-RateLimit-Reset`: ثانیه‌های Unix epoch (زمان مطلق reset)
- `RateLimit-Reset`: ثانیه‌های تأخیر تا reset
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجهٔ دقیق باقی‌مانده وقتی
  حاضر باشد؛ درخواست‌های موفق sharded به‌جای برگرداندن یک مقدار جهانی تقریبی
  آن را حذف می‌کنند
- `Retry-After`: ثانیه‌های تأخیر برای انتظار روی `429`

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

- وقتی `Retry-After` حاضر است، آن را ترجیح دهید.
- در غیر این صورت از `RateLimit-Reset` استفاده کنید یا تأخیر را از `X-RateLimit-Reset` استخراج کنید.
- به retryها jitter اضافه کنید.

## خطاها

- خطاهای نسخهٔ ۱ متن ساده هستند (`text/plain; charset=utf-8`)، شامل `400`،
  `401`، `403`، `404`، `429`، و پاسخ‌های دانلود مسدودشده.
- پارامترهای query ناشناخته برای سازگاری نادیده گرفته می‌شوند.
- پارامترهای query شناخته‌شده با مقدارهای نامعتبر `400` برمی‌گردانند.

## Endpointها

خواندن عمومی:

- `GET /api/v1/search?q=...`
  - فیلترهای اختیاری: `highlightedOnly=true`، `nonSuspiciousOnly=true`
  - alias قدیمی: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (پیش‌فرض)، `recommended` (`default`)، `createdAt` (`newest`)، `downloads`، `stars` (`rating`)، aliasهای نصب قدیمی `installsCurrent`/`installs`/`installsAllTime` به `downloads` نگاشت می‌شوند، `trending`
  - مقدارهای نامعتبر `sort`، `400` برمی‌گردانند
  - `cursor` برای sortهای غیر `trending` اعمال می‌شود
  - فیلتر اختیاری: `nonSuspiciousOnly=true`
  - alias قدیمی: `nonSuspicious=true`
  - با `nonSuspiciousOnly=true`، صفحه‌های مبتنی بر cursor ممکن است کمتر از `limit` مورد داشته باشند؛ برای ادامه از `nextCursor` استفاده کنید.
  - `recommended` از سیگنال‌های engagement و تازگی استفاده می‌کند.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills میزبانی‌شده byteهای ZIP قطعی برمی‌گردانند.
  - Skills فعلی مبتنی بر GitHub با scan برابر `clean` یا `suspicious` به‌جای byteهای ClawHub، یک توصیف‌گر handoff JSON از نوع `public-github` برمی‌گردانند.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills میزبانی‌شده به‌صورت فایل‌های ذخیره‌شده export می‌شوند.
  - Skills فعلی مبتنی بر GitHub با scan برابر `clean` یا `suspicious` به‌صورت توصیف‌گرهای handoff از نوع `public-github` export می‌شوند.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (پیش‌فرض)، `recommended`، `downloads`، alias قدیمی `installs`
  - مقدارهای نامعتبر `sort`، `400` برمی‌گردانند
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (پیش‌فرض)، `downloads`، `updated`، alias قدیمی `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

احراز هویت لازم است:

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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

فقط admin:

- `POST /api/v1/users/reserve` اسلاگ‌های ریشه و placeholderهای خصوصی بستهٔ بدون release را برای یک handle مالک رزرو می‌کند.

## قدیمی

مسیرهای قدیمی `/api/*` و `/api/cli/*` همچنان در دسترس هستند. `DEPRECATIONS.md` را ببینید.
