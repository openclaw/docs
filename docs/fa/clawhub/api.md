---
read_when:
    - ساخت کلاینت‌های API
    - افزودن نقاط پایانی یا طرح‌واره‌ها
summary: نمای کلی و قراردادهای API عمومی REST (v1).
x-i18n:
    generated_at: "2026-05-12T23:28:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

پایه: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## بازاستفاده از کاتالوگ عمومی

می‌توانید یک کاتالوگ، دایرکتوری، یا سطح جست‌وجوی شخص ثالث را بر پایه APIهای خواندن عمومی ClawHub بسازید. فراداده عمومی مهارت‌ها و فایل‌های مهارت تحت قواعد مجوز مهارت ClawHub منتشر می‌شوند، در حالی که خود API دارای محدودیت نرخ است و باید مسئولانه مصرف شود.

رهنمودها:

- برای فهرست‌های کاتالوگ، از endpointهای خواندن عمومی مانند `GET /api/v1/skills`، `GET /api/v1/search`، و `GET /api/v1/skills/{slug}` استفاده کنید.
- پاسخ‌ها را کش کنید و به‌جای polling تهاجمی، به `429`، `Retry-After`، و سرآیندهای محدودیت نرخ احترام بگذارید.
- هنگام نمایش فهرست‌ها، به URL کانونی مهارت ClawHub لینک دهید تا کاربران بتوانند رکورد رجیستری منبع را بررسی کنند.
- از URLهای صفحه کانونی به شکل `https://clawhub.ai/<owner>/<slug>` استفاده کنید.
- القا نکنید که ClawHub سایت شخص ثالث را تأیید، راستی‌آزمایی، یا اداره می‌کند.
- با دور زدن فیلترهای API عمومی یا مرزهای احراز هویت، محتوای پنهان، خصوصی، یا مسدودشده توسط moderation را mirror نکنید.

## احراز هویت

- خواندن عمومی: توکن لازم نیست.
- نوشتن + حساب: `Authorization: Bearer clh_...`.

## محدودیت‌های نرخ

اعمال با آگاهی از احراز هویت:

- درخواست‌های ناشناس: بر اساس IP.
- درخواست‌های احراز هویت‌شده (توکن Bearer معتبر): بر اساس bucket کاربر.
- توکن مفقود/نامعتبر به اعمال بر اساس IP بازمی‌گردد.

- خواندن: 600/min برای هر IP، 2400/min برای هر کلید
- نوشتن: 45/min برای هر IP، 180/min برای هر کلید

سرآیندها: `X-RateLimit-Limit`، `X-RateLimit-Remaining`، `X-RateLimit-Reset`، `RateLimit-Limit`، `RateLimit-Remaining`، `RateLimit-Reset`، `Retry-After` (روی 429).

معناشناسی:

- `X-RateLimit-Reset`: ثانیه‌های Unix epoch (زمان بازنشانی مطلق)
- `RateLimit-Reset`: ثانیه‌های تأخیر تا بازنشانی
- `Retry-After`: ثانیه‌های تأخیر برای انتظار روی `429`

نمونه `429`:

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

مدیریت سمت کلاینت:

- وقتی `Retry-After` موجود است، آن را ترجیح دهید.
- در غیر این صورت از `RateLimit-Reset` استفاده کنید یا تأخیر را از `X-RateLimit-Reset` استخراج کنید.
- به تلاش‌های مجدد jitter اضافه کنید.

## endpointها

خواندن عمومی:

- `GET /api/v1/search?q=...`
  - فیلترهای اختیاری: `highlightedOnly=true`، `nonSuspiciousOnly=true`
  - نام مستعار قدیمی: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (پیش‌فرض)، `createdAt` (`newest`)، `downloads`، `stars` (`rating`)، `installsCurrent` (`installs`)، `installsAllTime`، `trending`
  - `cursor` برای مرتب‌سازی‌های غیر `trending` اعمال می‌شود
  - فیلتر اختیاری: `nonSuspiciousOnly=true`
  - نام مستعار قدیمی: `nonSuspicious=true`
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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

فقط مدیر:

- `POST /api/v1/users/reserve` slugهای ریشه و placeholderهای بسته خصوصی بدون انتشار را برای handle مالک رزرو می‌کند.

## قدیمی

`/api/*` و `/api/cli/*` قدیمی همچنان در دسترس هستند. `DEPRECATIONS.md` را ببینید.
