---
read_when:
    - ساخت کلاینت‌های API
    - افزودن نقاط پایانی یا طرح‌واره‌ها
summary: مروری بر API عمومی REST (نسخه ۱) و قراردادهای آن.
x-i18n:
    generated_at: "2026-07-16T15:35:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

پایه: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## استفادهٔ مجدد از کاتالوگ عمومی

می‌توانید با استفاده از APIهای خواندن عمومی ClawHub، یک کاتالوگ، فهرست راهنما یا رابط جست‌وجوی شخص ثالث بسازید. فراداده‌ها و فایل‌های عمومی Skills مطابق قواعد مجوز Skills در ClawHub منتشر می‌شوند، درحالی‌که خود API دارای محدودیت نرخ است و باید مسئولانه استفاده شود.

راهنما:

- برای فهرست‌های کاتالوگ، از نقاط پایانی خواندن عمومی مانند `GET /api/v1/skills`، `GET /api/v1/search` و `GET /api/v1/skills/{slug}` استفاده کنید.
- پاسخ‌ها را ذخیرهٔ موقت کنید و به‌جای نظرسنجی پرتکرار، `429`، `Retry-After` و سرآیندهای محدودیت نرخ را رعایت کنید.
- هنگام نمایش فهرست‌ها، به نشانی متعارف Skill در ClawHub پیوند دهید تا کاربران بتوانند رکورد رجیستری مبدأ را بررسی کنند.
- از نشانی‌های متعارف صفحه با قالب `https://clawhub.ai/<owner>/skills/<slug>` استفاده کنید.
- این تصور را ایجاد نکنید که ClawHub وب‌سایت شخص ثالث را تأیید یا اعتبارسنجی می‌کند یا ادارهٔ آن را بر عهده دارد.
- با دور زدن فیلترهای API عمومی یا مرزهای احراز هویت، محتوای پنهان، خصوصی یا مسدودشده توسط ناظران را آینه‌سازی نکنید.

## احراز هویت

- خواندن عمومی: به توکن نیاز ندارد.
- نوشتن + حساب: `Authorization: Bearer clh_...`.

## محدودیت‌های نرخ

اعمال محدودیت با توجه به احراز هویت:

- درخواست‌های ناشناس: به‌ازای هر IP.
- درخواست‌های احرازشده (توکن Bearer معتبر): به‌ازای باکت هر کاربر.
- توکن ناموجود/نامعتبر به اعمال محدودیت بر اساس IP بازمی‌گردد.

- خواندن: 3000/دقیقه به‌ازای هر IP، 12000/دقیقه به‌ازای هر کلید
- نوشتن: 300/دقیقه به‌ازای هر IP، 3000/دقیقه به‌ازای هر کلید
- بارگیری: 1200/دقیقه به‌ازای هر IP، 6000/دقیقه به‌ازای هر کلید

سرآیندها: `X-RateLimit-Limit`، `X-RateLimit-Reset`، `RateLimit-Limit`، `RateLimit-Reset`؛
`X-RateLimit-Remaining`، `RateLimit-Remaining` و `Retry-After` در `429` گنجانده می‌شوند.

معناشناسی:

- `X-RateLimit-Reset`: ثانیه‌های دورهٔ یونیکس (زمان مطلق بازنشانی)
- `RateLimit-Reset`: تعداد ثانیه‌های تأخیر تا بازنشانی
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجهٔ دقیق باقی‌مانده، در صورت
  وجود؛ درخواست‌های موفقِ شاردشده به‌جای بازگرداندن یک مقدار تقریبی
  سراسری، آن را حذف می‌کنند
- `Retry-After`: تعداد ثانیه‌های تأخیر برای انتظار هنگام `429`

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

نحوهٔ رسیدگی کلاینت:

- در صورت وجود، `Retry-After` را ترجیح دهید.
- در غیر این صورت، از `RateLimit-Reset` استفاده کنید یا تأخیر را از `X-RateLimit-Reset` به دست آورید.
- به تلاش‌های مجدد نوسان تصادفی اضافه کنید.

## خطاها

- خطاهای v1 متن ساده هستند (`text/plain; charset=utf-8`)؛ از جمله `400`،
  `401`، `403`، `404`، `429` و پاسخ‌های بارگیری مسدودشده.
- پارامترهای پرس‌وجوی ناشناخته برای سازگاری نادیده گرفته می‌شوند.
- پارامترهای پرس‌وجوی شناخته‌شده با مقادیر نامعتبر، `400` را بازمی‌گردانند.

## نقاط پایانی

خواندن عمومی:

- `GET /api/v1/search?q=...`
  - فیلترهای اختیاری: `highlightedOnly=true`، `nonSuspiciousOnly=true`
  - نام مستعار قدیمی: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (پیش‌فرض)، `recommended` (`default`)، `createdAt` (`newest`)، `downloads`، `stars` (`rating`)، نام‌های مستعار قدیمی نصب `installsCurrent`/`installs`/`installsAllTime` به `downloads`، `trending` نگاشت می‌شوند
  - مقادیر نامعتبر `sort`، `400` را بازمی‌گردانند
  - `cursor` برای مرتب‌سازی‌های غیر `trending` اعمال می‌شود
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
  - Skills فعلیِ مبتنی بر GitHub که اسکن `clean` یا `suspicious` دارند، به‌جای بایت‌های ClawHub،
    یک توصیف‌گر تحویل `public-github` از نوع JSON بازمی‌گردانند.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Skills میزبانی‌شده به‌شکل فایل‌های ذخیره‌شده صادر می‌شوند.
  - Skills فعلیِ مبتنی بر GitHub که اسکن `clean` یا `suspicious` دارند،
    به‌شکل توصیف‌گرهای تحویل `public-github` صادر می‌شوند.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (پیش‌فرض)، `recommended`، `downloads`، نام مستعار قدیمی `installs`
  - مقادیر نامعتبر `sort`، `400` را بازمی‌گردانند
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (پیش‌فرض)، `downloads`، `updated`، نام مستعار قدیمی `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

نیازمند احراز هویت:

- `POST /api/v1/skills` (انتشار، ترجیحاً چندبخشی)
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

- `POST /api/v1/users/reserve` اسلاگ‌های ریشه و جای‌نگهدارهای خصوصی بسته‌های بدون انتشار را برای شناسهٔ یک مالک رزرو می‌کند.

## قدیمی

نسخه‌های قدیمی `/api/*` و `/api/cli/*` همچنان در دسترس هستند. `DEPRECATIONS.md` را ببینید.
