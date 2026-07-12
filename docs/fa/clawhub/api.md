---
read_when:
    - ساخت کلاینت‌های API
    - افزودن نقاط پایانی یا طرح‌واره‌ها
summary: مروری بر API عمومی REST (نسخه ۱) و قراردادهای آن.
x-i18n:
    generated_at: "2026-07-12T09:45:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API نسخهٔ ۱

پایه: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## استفادهٔ مجدد از فهرست عمومی

می‌توانید با استفاده از APIهای خواندنی عمومی ClawHub، یک فهرست، راهنما یا رابط جست‌وجوی شخص ثالث بسازید. فراداده‌ها و فایل‌های عمومی Skills طبق قواعد مجوز Skills در ClawHub منتشر می‌شوند، درحالی‌که خود API دارای محدودیت نرخ است و باید مسئولانه استفاده شود.

رهنمودها:

- برای فهرست‌کردن کاتالوگ از نقاط پایانی خواندنی عمومی مانند `GET /api/v1/skills`،‏ `GET /api/v1/search` و `GET /api/v1/skills/{slug}` استفاده کنید.
- پاسخ‌ها را در حافظهٔ نهان ذخیره کنید و به‌جای نظرسنجی تهاجمی، `429`،‏ `Retry-After` و سرآیندهای محدودیت نرخ را رعایت کنید.
- هنگام نمایش فهرست‌ها، به نشانی متعارف Skill در ClawHub پیوند دهید تا کاربران بتوانند رکورد رجیستری مبدأ را بررسی کنند.
- از نشانی‌های متعارف صفحه با قالب `https://clawhub.ai/<owner>/skills/<slug>` استفاده کنید.
- القا نکنید که ClawHub سایت شخص ثالث را تأیید، اعتبارسنجی یا اداره می‌کند.
- با دورزدن فیلترهای API عمومی یا مرزهای احراز هویت، محتوای پنهان، خصوصی یا مسدودشده توسط نظارت را بازتاب ندهید.

## احراز هویت

- خواندن عمومی: نیازی به توکن نیست.
- نوشتن و حساب کاربری: `Authorization: Bearer clh_...`.

## محدودیت‌های نرخ

اعمال محدودیت با توجه به احراز هویت:

- درخواست‌های ناشناس: به‌ازای هر IP.
- درخواست‌های احرازشده (توکن Bearer معتبر): به‌ازای سبد هر کاربر.
- در صورت نبودن یا نامعتبر بودن توکن، اعمال محدودیت مبتنی بر IP انجام می‌شود.

- خواندن: ۳۰۰۰ در دقیقه به‌ازای هر IP،‏ ۱۲۰۰۰ در دقیقه به‌ازای هر کلید
- نوشتن: ۳۰۰ در دقیقه به‌ازای هر IP،‏ ۳۰۰۰ در دقیقه به‌ازای هر کلید
- بارگیری: ۱۲۰۰ در دقیقه به‌ازای هر IP،‏ ۶۰۰۰ در دقیقه به‌ازای هر کلید

سرآیندها: `X-RateLimit-Limit`،‏ `X-RateLimit-Reset`،‏ `RateLimit-Limit`،‏ `RateLimit-Reset`؛
سرآیندهای `X-RateLimit-Remaining`،‏ `RateLimit-Remaining` و `Retry-After` در پاسخ‌های `429` گنجانده می‌شوند.

معناشناسی:

- `X-RateLimit-Reset`: ثانیه‌های دورهٔ یونیکس (زمان مطلق بازنشانی)
- `RateLimit-Reset`: مدت تأخیر برحسب ثانیه تا بازنشانی
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: سهمیهٔ دقیق باقی‌مانده، در صورت
  وجود؛ در درخواست‌های موفق شاردشده، به‌جای بازگرداندن یک مقدار تقریبی
  سراسری، این سرآیند حذف می‌شود
- `Retry-After`: مدت انتظار برحسب ثانیه برای پاسخ `429`

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

نحوهٔ مدیریت در کلاینت:

- در صورت وجود، `Retry-After` را ترجیح دهید.
- در غیر این صورت از `RateLimit-Reset` استفاده کنید یا تأخیر را از `X-RateLimit-Reset` به‌دست آورید.
- به تلاش‌های مجدد، تأخیر تصادفی اضافه کنید.

## خطاها

- خطاهای نسخهٔ ۱ به‌صورت متن ساده (`text/plain; charset=utf-8`) هستند؛ ازجمله `400`،
  `401`،‏ `403`،‏ `404`،‏ `429` و پاسخ‌های بارگیری مسدودشده.
- پارامترهای پرس‌وجوی ناشناخته برای سازگاری نادیده گرفته می‌شوند.
- پارامترهای پرس‌وجوی شناخته‌شده با مقادیر نامعتبر، `400` بازمی‌گردانند.

## نقاط پایانی

خواندن عمومی:

- `GET /api/v1/search?q=...`
  - فیلترهای اختیاری: `highlightedOnly=true`،‏ `nonSuspiciousOnly=true`
  - نام مستعار قدیمی: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`:‏ `updated` (پیش‌فرض)،‏ `recommended` (`default`)،‏ `createdAt` (`newest`)،‏ `downloads`،‏ `stars` (`rating`)، نام‌های مستعار قدیمی نصب یعنی `installsCurrent`/`installs`/`installsAllTime` به `downloads` نگاشت می‌شوند،‏ `trending`
  - مقادیر نامعتبر `sort`،‏ `400` بازمی‌گردانند
  - `cursor` برای مرتب‌سازی‌های غیر از `trending` اعمال می‌شود
  - فیلتر اختیاری: `nonSuspiciousOnly=true`
  - نام مستعار قدیمی: `nonSuspicious=true`
  - با `nonSuspiciousOnly=true`، صفحات مبتنی بر مکان‌نما ممکن است کمتر از `limit` مورد داشته باشند؛ برای ادامه از `nextCursor` استفاده کنید.
  - `recommended` از سیگنال‌های تعامل و تازگی استفاده می‌کند.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Skills میزبانی‌شده، بایت‌های ZIP قطعی بازمی‌گردانند.
  - Skills فعلی مبتنی بر GitHub که نتیجهٔ اسکن `clean` یا `suspicious` دارند، به‌جای بایت‌های ClawHub یک
    توصیف‌گر واگذاری JSON از نوع `public-github` بازمی‌گردانند.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills میزبانی‌شده به‌شکل فایل‌های ذخیره‌شده صادر می‌شوند.
  - Skills فعلی مبتنی بر GitHub که نتیجهٔ اسکن `clean` یا `suspicious` دارند، به‌شکل
    توصیف‌گرهای واگذاری `public-github` صادر می‌شوند.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`:‏ `updated` (پیش‌فرض)،‏ `recommended`،‏ `downloads`، نام مستعار قدیمی `installs`
  - مقادیر نامعتبر `sort`،‏ `400` بازمی‌گردانند
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`:‏ `recommended` (پیش‌فرض)،‏ `downloads`،‏ `updated`، نام مستعار قدیمی `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

نیازمند احراز هویت:

- `POST /api/v1/skills` (انتشار؛ چندبخشی ترجیح داده می‌شود)
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

فقط مدیر:

- `POST /api/v1/users/reserve` نامک‌های ریشه و جایگاه‌های نگه‌دارندهٔ بسته‌های خصوصی بدون انتشار را برای شناسهٔ مالک رزرو می‌کند.

## قدیمی

مسیرهای قدیمی `/api/*` و `/api/cli/*` همچنان در دسترس‌اند. به `DEPRECATIONS.md` مراجعه کنید.
