---
read_when:
    - افزودن/تغییر نقاط پایانی
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع HTTP API (عمومی + نقاط پایانی CLI + احراز هویت).
x-i18n:
    generated_at: "2026-07-12T09:39:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

نشانی پایه: `https://clawhub.ai` (پیش‌فرض).

همه مسیرهای v1 زیرمجموعه `/api/v1/...` هستند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری همچنان باقی مانده‌اند (به `DEPRECATIONS.md` مراجعه کنید).
OpenAPI: `/api/v1/openapi.json`.

## استفاده مجدد از فهرست عمومی

دایرکتوری‌های شخص ثالث می‌توانند برای فهرست‌کردن یا جست‌وجوی Skills در ClawHub از نقاط پایانی عمومی خواندن استفاده کنند. لطفاً نتایج را کش کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست مرجع ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) پیوند دهید و از القای تأیید وب‌سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای پنهان، خصوصی یا مسدودشده توسط ناظران را خارج از سطح API عمومی آینه‌سازی کنید.

میان‌برهای نامک وب در خانواده‌های مختلف رجیستری تفکیک می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی اولویت مسیرها، از نشانی‌های مرجعی استفاده کنند که نقاط پایانی خواندن بازمی‌گردانند.

## محدودیت‌های نرخ

مدل اعمال محدودیت:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (توکن Bearer معتبر): به‌ازای سبد هر کاربر اعمال می‌شود.
- اگر توکن وجود نداشته باشد یا نامعتبر باشد، رفتار به اعمال محدودیت بر اساس IP بازمی‌گردد.
- وقتی سرور دلیل را می‌داند، نقاط پایانی نوشتنِ احراز هویت‌شده نباید فقط `Unauthorized` بازگردانند. برای توکن‌های مفقود، توکن‌های نامعتبر/لغوشده و حساب‌های حذف‌شده/مسدودشده/غیرفعال‌شده باید متن راهگشای جداگانه‌ای ارائه شود تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی مانع آن‌ها شده است.

- خواندن: ۳۰۰۰ در دقیقه به‌ازای هر IP، ۱۲۰۰۰ در دقیقه به‌ازای هر کلید
- نوشتن: ۳۰۰ در دقیقه به‌ازای هر IP، ۳۰۰۰ در دقیقه به‌ازای هر کلید
- بارگیری: ۱۲۰۰ در دقیقه به‌ازای هر IP، ۶۰۰۰ در دقیقه به‌ازای هر کلید (نقاط پایانی بارگیری)

سرآیندها:

- سازگاری قدیمی: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`، `RateLimit-Reset`
- هنگام `429`:‏ `X-RateLimit-Remaining: 0` و `RateLimit-Remaining: 0`
- هنگام `429`:‏ `Retry-After`

معنای سرآیندها:

- `X-RateLimit-Reset`: ثانیه‌های مطلق دوره یونیکس
- `RateLimit-Reset`: تعداد ثانیه تا بازنشانی (تأخیر)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: در صورت وجود، سهمیه دقیق باقی‌مانده.
  درخواست‌های موفقِ شاردشده به‌جای بازگرداندن مقدار تقریبی سراسری، این سرآیند را حذف می‌کنند.
- `Retry-After`: تعداد ثانیه انتظار پیش از تلاش مجدد (تأخیر) هنگام `429`

نمونه پاسخ `429`:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

راهنمای کلاینت:

- اگر `Retry-After` وجود دارد، پیش از تلاش مجدد به همان تعداد ثانیه منتظر بمانید.
- برای جلوگیری از تلاش‌های مجدد هم‌زمان، از پس‌نشینی همراه با نوسان تصادفی استفاده کنید.
- اگر `Retry-After` وجود ندارد، از `RateLimit-Reset` به‌عنوان جایگزین استفاده کنید (یا آن را از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- از سرآیندهای قابل‌اعتماد IP کلاینت، از جمله `cf-connecting-ip`، فقط زمانی استفاده می‌شود که استقرار، سرآیندهای انتقال‌یافته قابل‌اعتماد را صراحتاً فعال کرده باشد.
- ClawHub برای شناسایی IP کلاینت‌ها در لبه از سرآیندهای انتقال قابل‌اعتماد استفاده می‌کند.
- اگر IP قابل‌اعتمادی برای کلاینت موجود نباشد، درخواست‌های ناشناس از سبدهای جایگزینی استفاده می‌کنند که فقط بر اساس نوع محدودیت نرخ محدوده‌بندی شده‌اند. این سبدهای جایگزین شامل مسیرها، نامک‌ها، نام بسته‌ها، نسخه‌ها، رشته‌های پرس‌وجو یا سایر پارامترهای مصنوع ارائه‌شده توسط فراخواننده نیستند.

## پاسخ‌های خطا

پاسخ‌های خطای عمومی v1 متن ساده با `content-type: text/plain; charset=utf-8` هستند.
این شامل شکست‌های اعتبارسنجی (`400`)، منابع عمومی مفقود (`404`)، شکست‌های احراز هویت و مجوز (`401`/`403`)، محدودیت‌های نرخ (`429`) و بارگیری‌های مسدودشده است. کلاینت‌ها باید بدنه پاسخ را به‌عنوان رشته‌ای خوانا برای انسان بخوانند. پارامترهای پرس‌وجوی ناشناخته برای سازگاری نادیده گرفته می‌شوند، اما پارامترهای پرس‌وجوی شناخته‌شده با مقادیر نامعتبر، `400` بازمی‌گردانند.

## نقاط پایانی عمومی (بدون احراز هویت)

### `GET /api/v1/search`

پارامترهای پرس‌وجو:

- `q` (الزامی): رشته پرس‌وجو
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری):‏ `true` برای محدودکردن نتایج به Skills برجسته‌شده
- `nonSuspiciousOnly` (اختیاری):‏ `true` برای پنهان‌کردن Skills مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): نام مستعار قدیمی برای `nonSuspiciousOnly`

پاسخ:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

نکته‌ها:

- نتایج به‌ترتیب ارتباط بازگردانده می‌شوند (شباهت تعبیه‌سازی + تقویت تطابق دقیق توکن نامک/نام + پیشین محبوبیت کوچک).
- ارتباط از محبوبیت مهم‌تر است. تطابق دقیق توکن نامک یا نام نمایشی می‌تواند بالاتر از تطابقی آزادتر با تعامل بسیار بیشتر قرار گیرد.
- متن ASCII در مرزهای واژه و نشانه‌گذاری به توکن تقسیم می‌شود. برای مثال، `personal-map` شامل توکن مستقل `map` است، درحالی‌که `amap-jsapi-skill` شامل `amap`،‏ `jsapi` و `skill` است؛ بنابراین جست‌وجوی `map` برای `personal-map` تطابق واژگانی قوی‌تری نسبت به `amap-jsapi-skill` ایجاد می‌کند.
- محبوبیت با مقیاس لگاریتمی محاسبه و سقف‌گذاری می‌شود. Skills با تعامل بالا ممکن است وقتی متن پرس‌وجو تطابق ضعیف‌تری دارد، رتبه پایین‌تری بگیرند.
- وضعیت نظارتی مشکوک یا پنهان، بسته به فیلترهای فراخواننده و وضعیت فعلی نظارت، می‌تواند یک Skill را از جست‌وجوی عمومی حذف کند.

راهنمای قابلیت یافتن برای ناشر:

- عبارت‌هایی را که کاربران دقیقاً جست‌وجو می‌کنند در نام نمایشی، خلاصه و برچسب‌ها قرار دهید. تنها زمانی از یک توکن مستقل نامک استفاده کنید که هویتی پایدار نیز باشد و بخواهید آن را حفظ کنید.
- فقط برای هدف‌گرفتن یک پرس‌وجو نامک را تغییر ندهید، مگر اینکه نامک جدید در بلندمدت نام مرجع بهتری باشد. نامک‌های قدیمی به نام‌های مستعار تغییرمسیر تبدیل می‌شوند، اما نشانی مرجع، نامک نمایش‌داده‌شده و خلاصه‌های جست‌وجوی آینده از نامک جدید استفاده می‌کنند.
- نام‌های مستعار تغییرنام، تفکیک نشانی‌های قدیمی و نصب‌هایی را که از طریق رجیستری تفکیک می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو پس از نمایه‌شدن تغییرنام، بر اساس فراداده مرجع Skill انجام می‌شود. آمار موجود همراه Skill باقی می‌ماند.
- اگر یک Skill به‌طور غیرمنتظره‌ای دیده نمی‌شود، پیش از تغییر فراداده مرتبط با رتبه‌بندی، ابتدا در حالت واردشده وضعیت نظارت را با `clawhub inspect @owner/slug` بررسی کنید.

### `GET /api/v1/skills`

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (۱ تا ۲۰۰)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی برای هر مرتب‌سازی غیر از `trending`
- `sort` (اختیاری):‏ `updated` (پیش‌فرض)،‏ `recommended` (نام مستعار: `default`)،‏ `createdAt` (نام مستعار: `newest`)،‏ `downloads`،‏ `stars` (نام مستعار: `rating`)، نام‌های مستعار قدیمی نصب `installsCurrent`/`installs`/`installsAllTime` به `downloads` نگاشت می‌شوند،‏ `trending`
- `nonSuspiciousOnly` (اختیاری):‏ `true` برای پنهان‌کردن Skills مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): نام مستعار قدیمی برای `nonSuspiciousOnly`

مقادیر نامعتبر `sort`،‏ `400` بازمی‌گردانند.

نکته‌ها:

- `recommended` از سیگنال‌های تعامل و تازگی استفاده می‌کند.
- `trending` بر اساس نصب‌ها در ۷ روز گذشته رتبه‌بندی می‌کند (مبتنی بر تله‌متری).
- `createdAt` برای پیمایش Skills جدید پایدار است؛ `updated` هنگام انتشار مجدد Skills موجود تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` است، مرتب‌سازی‌های مبتنی بر مکان‌نما ممکن است در یک صفحه کمتر از `limit` مورد بازگردانند، زیرا Skills مشکوک پس از بازیابی صفحه فیلتر می‌شوند.
- در صورت وجود `nextCursor`، برای ادامه صفحه‌بندی از آن استفاده کنید. کوتاه‌بودن یک صفحه به‌تنهایی به‌معنای پایان نتایج نیست.

پاسخ:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

پاسخ:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "topics": ["Productivity"],
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

نکته‌ها:

- نامک‌های قدیمی ایجادشده توسط جریان‌های تغییرنام/ادغام مالک، به Skill مرجع تفکیک می‌شوند.
- `metadata.os`: محدودیت‌های سیستم‌عامل اعلام‌شده در فرانت‌متر Skill (برای مثال `["macos"]`،‏ `["linux"]`). اگر اعلام نشده باشد، `null`.
- `metadata.systems`: هدف‌های سیستمی Nix (برای مثال `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد، `null`.
- اگر Skill هیچ فراداده پلتفرمی نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط زمانی گنجانده می‌شود که Skill علامت‌گذاری شده باشد یا مالک در حال مشاهده آن باشد.

### `GET /api/v1/skills/{slug}/moderation`

وضعیت ساخت‌یافته نظارت را بازمی‌گرداند.

پاسخ:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

نکته‌ها:

- مالکان و ناظران می‌توانند به جزئیات نظارت برای Skills پنهان دسترسی داشته باشند.
- فراخوانندگان عمومی فقط برای Skills قابل‌مشاهده‌ای که از قبل علامت‌گذاری شده‌اند، `200` دریافت می‌کنند.
- شواهد برای فراخوانندگان عمومی ویرایش می‌شوند و قطعه‌های خام فقط برای مالکان/ناظران ارائه می‌شوند.

### `POST /api/v1/skills/{slug}/report`

یک Skill را برای بررسی ناظران گزارش می‌کند. گزارش‌ها در سطح Skill هستند، می‌توانند به‌صورت اختیاری به یک نسخه پیوند داده شوند و وارد صف گزارش Skill می‌شوند.

احراز هویت:

- به توکن API نیاز دارد.

درخواست:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

پاسخ:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

نقطه پایانی ناظر/مدیر برای دریافت گزارش‌های Skill.

پارامترهای پرس‌وجو:

- `status` (اختیاری):‏ `open` (پیش‌فرض)،‏ `confirmed`،‏ `dismissed` یا `all`
- `limit` (اختیاری): عدد صحیح (۱ تا ۲۰۰)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

پاسخ:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

نقطه پایانی ناظر/مدیر برای حل‌وفصل یا بازگشایی گزارش‌های Skill.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام بازگرداندن `status` به `open` می‌توان آن را حذف کرد. برای پنهان‌کردن Skill در همان گردش‌کار قابل‌ممیزی، همراه یک گزارش بررسی‌شده `finalAction: "hide"` را ارسال کنید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

فراداده نسخه + فهرست فایل‌ها را بازمی‌گرداند.

- `version.security` در صورت موجودبودن، شامل وضعیت عادی‌سازی‌شده تأیید اسکن و جزئیات اسکنر
  (VirusTotal + LLM) است.

### `GET /api/v1/skills/{slug}/scan`

جزئیات تأیید اسکن امنیتی یک نسخه Skill را بازمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): تفکیک یک نسخه برچسب‌گذاری‌شده (برای مثال `latest`).

نکته‌ها:

- اگر نه `version` و نه `tag` ارائه شده باشد، از آخرین نسخه استفاده می‌شود.
- شامل وضعیت تأیید نرمال‌سازی‌شده به‌همراه جزئیات مختص هر اسکنر است.
- `security.hasScanResult` تنها زمانی `true` است که یک اسکنر رأی قطعی (`clean`، `suspicious` یا `malicious`) صادر کرده باشد.
- `moderation` یک نمای لحظه‌ای جاری از تعدیل در سطح Skill است که از آخرین نسخه به‌دست می‌آید.
- هنگام پرس‌وجوی یک نسخه تاریخی، پیش از آنکه `moderation` و `security` را متعلق به زمینه نسخه یکسان در نظر بگیرید، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

### `POST /api/v1/skills/-/scan`

نقطه پایانی احراز هویت‌شده برای ارسال کارهای جدید ClawScan.

اسکن بارگذاری محلی دیگر پشتیبانی نمی‌شود. درخواست‌هایی که از
`multipart/form-data` یا `{ "source": { "kind": "upload" } }` استفاده می‌کنند، `410` برمی‌گردانند.

اسکن‌های منتشرشده از JSON استفاده می‌کنند:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

نکات:

- محتوای درخواست‌های اسکن و گزارش‌های قابل دانلود پس از پایان بازه نگهداری از مخزن درخواست اسکن منقضی می‌شوند.
- اسکن‌های منتشرشده به دسترسی مدیریتی مالک/ناشر یا اختیار ناظر/مدیر پلتفرم نیاز دارند.
- اسکن‌های منتشرشده تنها زمانی نتیجه را بازنویسی می‌کنند که `update: true` باشد و اسکن با موفقیت تکمیل شود.
- پاسخ `202` با `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` است.
- کارهای اسکن ناهمگام هستند. درخواست‌های اسکن دستی پیش از کارهای عادی انتشار/تکمیل سوابق در اولویت قرار می‌گیرند، اما تکمیل همچنان به در دسترس بودن پردازشگر بستگی دارد.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطه پایانی احراز هویت‌شده برای بررسی دوره‌ای اسکن ارسال‌شده.

- وضعیت در صف/در حال اجرا/موفق/ناموفق را برمی‌گرداند.
- هنگام قرار داشتن در صف، `queue.queuedAhead` و `queue.position` را برمی‌گرداند تا کلاینت‌ها بتوانند تعداد اسکن‌های دستی اولویت‌داری را که پیش از درخواست قرار دارند نمایش دهند. صف‌های بسیار بزرگ محدود می‌شوند و با `queuedAheadIsEstimate: true` گزارش می‌شوند.
- در صورت موجود بودن، `report` شامل بخش‌های `clawscan`، `skillspector`، `staticAnalysis` و `virustotal` است.
- کارهای اسکن ناموفق، `status: "failed"` را همراه با `lastError` برمی‌گردانند.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطه پایانی احراز هویت‌شده برای بایگانی گزارش.

- به یک اسکن موفق نیاز دارد؛ اسکن‌های نهایی‌نشده `409` برمی‌گردانند.
- یک فایل ZIP شامل `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json` و `README.md` برمی‌گرداند.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطه پایانی احراز هویت‌شده برای بایگانی گزارش ذخیره‌شده نسخه‌های ارسال‌شده.

- به دسترسی مدیریتی مالک/ناشر برای Skill یا Plugin، یا اختیار ناظر/مدیر پلتفرم نیاز دارد.
- نتایج اسکن ذخیره‌شده برای نسخه دقیق ارسال‌شده، از جمله نسخه‌های مسدود یا پنهان، را برمی‌گرداند.
- مقدار پیش‌فرض `kind` برابر `skill` است؛ برای اسکن Plugin/بسته از `kind=plugin` استفاده کنید.
- همان ساختار ZIP دانلودهای درخواست اسکن را برمی‌گرداند.

### `POST /api/v1/skills/-/scan/batch`

مسیر متعارف بازاسکن دسته‌ای ویژه مدیران. این مسیر همان ساختار محتوای درخواست مسیر قدیمی `POST /api/v1/skills/-/rescan-batch` را می‌پذیرد.

### `POST /api/v1/skills/-/scan/batch/status`

مسیر متعارف وضعیت دسته‌ای ویژه مدیران. این مسیر `{ "jobIds": ["..."] }` را می‌پذیرد و همان شمارنده‌های تجمیعی مسیر قدیمی `POST /api/v1/skills/-/rescan-batch/status` را برمی‌گرداند.

### `GET /api/v1/skills/{slug}/verify`

پوش تأیید کارت Skill را که `clawhub skill verify` استفاده می‌کند، برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): تفکیک یک نسخه برچسب‌گذاری‌شده (برای مثال `latest`).

نکات:

- `ok` تنها زمانی `true` است که نسخه انتخاب‌شده دارای کارت Skill تولیدشده باشد، توسط تعدیل به‌دلیل بدافزار مسدود نشده باشد و تأیید ClawScan پاک باشد.
- هویت Skill، هویت ناشر و فراداده نسخه انتخاب‌شده، فیلدهای سطح بالای پوش (`slug`، `displayName`، `publisherHandle`، `version`، `resolvedFrom`، `tag`، `createdAt`) هستند تا خودکارسازی پوسته بتواند آن‌ها را بدون باز کردن پوشش‌های تودرتو بخواند.
- `security` رأی سطح بالای ClawScan/امنیت است. خودکارسازی باید بر اساس `ok`، `decision`، `reasons` و `security.status` عمل کند.
- `security.signals` شامل شواهد پشتیبان اسکنر، مانند `staticScan`، `virusTotal` و `skillSpector` است.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ نسخه ۱ حفظ شده است، اما اسکنر وجود در رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- `provenance` تنها زمانی `server-resolved-github-import` است که ClawHub هنگام انتشار یا درون‌ریزی، مخزن/مرجع/کامیت/مسیر GitHub را تفکیک و ذخیره کرده باشد؛ در غیر این صورت `unavailable` است.

### `POST /api/v1/skills/-/security-verdicts`

رأی‌های فشرده و جاری امنیتی را برای نسخه‌های دقیق Skill برمی‌گرداند. این
نقطه پایانی مجموعه برای کلاینت‌هایی در نظر گرفته شده است که از قبل می‌دانند کدام نسخه‌های
نصب‌شده Skill در ClawHub را باید نمایش دهند، مانند رابط کنترل OpenClaw.

درخواست:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

نکات:

- `items` باید شامل ۱ تا ۱۰۰ جفت منحصربه‌فرد `{ slug, version }` باشد.
- نتایج برای هر مورد جداگانه هستند؛ نبود یک Skill یا نسخه باعث شکست کل پاسخ نمی‌شود.
- پاسخ فقط شامل اطلاعات امنیتی است. داده‌های کارت Skill، وضعیت کارت تولیدشده، فهرست فایل‌های مصنوعه یا محتوای تفصیلی اسکنر را شامل نمی‌شود.
- `security.signals` فقط شامل شواهد پشتیبان در سطح وضعیت است؛ برای جزئیات کامل اسکنر از `/scan` یا صفحه ممیزی امنیتی ClawHub استفاده کنید.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ نسخه ۱ حفظ شده است، اما اسکنر وجود در رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- نبود کارت Skill بر `ok`، `decision` یا `reasons` این نقطه پایانی اثری ندارد؛ کلاینت‌ها در صورت نیاز به محتوای کارت باید `skill-card.md` نصب‌شده را به‌صورت محلی بخوانند.
- وقتی به پوش تأیید کارت Skill برای یک Skill نیاز دارید از `/verify`، وقتی به Markdown کارت تولیدشده نیاز دارید از `/card`، و وقتی به داده‌های تفصیلی اسکنر نیاز دارید از `/scan` استفاده کنید.

پاسخ:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

محتوای متنی خام را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌طور پیش‌فرض از آخرین نسخه استفاده می‌کند.
- محدودیت اندازهٔ فایل: ۲۰۰ کیلوبایت.

### `GET /api/v1/packages`

نقطهٔ پایانی یکپارچهٔ فهرست برای موارد زیر:

- Skills
- Pluginهای کد
- Pluginهای بسته‌ای

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (۱ تا ۱۰۰)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `family` (اختیاری): `skill`، `code-plugin` یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community` یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended`، `trending`، `downloads`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins` یا نقاط پایانی بسته با
  `family=code-plugin`/`family=bundle-plugin`). دسته‌بندی‌های کنترل‌شده و
  نام‌های مستعار قدیمی فیلتر نسخهٔ ۱ در بخش `GET /api/v1/plugins` مستند شده‌اند.

نکات:

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured`،
  `highlightedOnly` یا `sort` پاسخ `400` برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار با خانوادهٔ ثابت باقی می‌مانند.
- ورودی‌های Skills همچنان مبتنی بر رجیستری Skills هستند و فقط از طریق `POST /api/v1/skills` قابل انتشارند.
- `POST /api/v1/packages` همچنان فقط برای انتشار Pluginهای کد و Pluginهای بسته‌ای است.
- فراخوان‌های ناشناس فقط کانال‌های عمومی بسته‌ها را می‌بینند.
- فراخوان‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند، در نتایج فهرست و جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احراز هویت‌شده اجازهٔ خواندنشان را دارد.

### `GET /api/v1/packages/search`

جست‌وجوی یکپارچهٔ فهرست در Skills و بسته‌های Plugin.

پارامترهای پرس‌وجو:

- `q` (الزامی): رشتهٔ پرس‌وجو
- `limit` (اختیاری): عدد صحیح (۱ تا ۱۰۰)
- `family` (اختیاری): `skill`، `code-plugin` یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community` یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد. دسته‌بندی‌های کنترل‌شده و نام‌های مستعار قدیمی
  فیلتر نسخهٔ ۱ در بخش `GET /api/v1/plugins` مستند شده‌اند.

نکات:

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured` یا
  `highlightedOnly` پاسخ `400` برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- فراخوان‌های ناشناس فقط کانال‌های عمومی بسته‌ها را می‌بینند.
- فراخوان‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند، جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احراز هویت‌شده اجازهٔ خواندنشان را دارد.

### `GET /api/v1/plugins`

مرور فهرست مختص Plugin در میان بسته‌های Plugin کد و Plugin بسته‌ای.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (۱ تا ۱۰۰)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `recommended` (پیش‌فرض)، `trending`، `downloads`، `updated`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقادیر کنونی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نام‌های مستعار قدیمی فیلتر نسخهٔ ۱ همچنان در نقاط پایانی خواندن پذیرفته می‌شوند:

- `mcp-tooling`، `data` و `automation` به `tools` تبدیل می‌شوند.
- `observability` و `deployment` به `gateway` تبدیل می‌شوند.
- `dev-tools` به `runtime` تبدیل می‌شود.

`trending` جدول رتبه‌بندی نصب/دانلود هفت‌روزه است و از مجموع کل دوره استفاده نمی‌کند.
در نقطهٔ پایانی یکپارچهٔ `/api/v1/packages` فقط به Pluginها اختصاص دارد؛ برای فهرست
Skills از `/api/v1/skills?sort=trending` استفاده کنید.

نام‌های مستعار قدیمی به‌عنوان مقادیر دسته‌بندی ذخیره‌شده یا اعلام‌شده از سوی نویسنده پذیرفته نمی‌شوند.

### `GET /api/v1/skills/export`

برون‌بری انبوه آخرین Skills عمومی برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای پرس‌وجو:

- `startDate` (الزامی): کران پایین برحسب میلی‌ثانیهٔ یونیکس برای `updatedAt` مربوط به Skill.
- `endDate` (الزامی): کران بالا برحسب میلی‌ثانیهٔ یونیکس برای `updatedAt` مربوط به Skill.
- `limit` (اختیاری): عدد صحیح (۱ تا ۲۵۰)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.

پاسخ:

- بدنه: بایگانی ZIP.
- ریشهٔ هر Skill برون‌بری‌شده در `{publisher}/{slug}/` قرار دارد.
- Skills میزبانی‌شده شامل فایل‌های آخرین نسخهٔ ذخیره‌شده هستند و در
  `_manifest.json` با `sourceRef: "public-clawhub"` فهرست می‌شوند.
- Skills کنونی مبتنی بر GitHub که نتیجهٔ پویش `clean` یا `suspicious` دارند، شامل
  `_source_handoff.json` با `sourceRef: "public-github"`، مخزن، کامیت، مسیر،
  هش محتوا و نشانی اینترنتی بایگانی هستند. آن‌ها شامل فایل‌های منبع میزبانی‌شده در ClawHub نیستند.
- هر Skill شامل `_export_skill_meta.json` است.
- `_manifest.json` همیشه در ریشهٔ ZIP گنجانده می‌شود.
- اگر Skills یا فایل‌های منفرد قابل برون‌بری نباشند، `_errors.json` گنجانده می‌شود.

سرآیندها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

خروجی‌گیری انبوه از جدیدترین نسخه‌های عمومی Pluginها برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای کوئری:

- `startDate` (الزامی): کران پایین `updatedAt` برای Plugin بر حسب میلی‌ثانیهٔ یونیکس.
- `endDate` (الزامی): کران بالای `updatedAt` برای Plugin بر حسب میلی‌ثانیهٔ یونیکس.
- `limit` (اختیاری): عدد صحیح (۱ تا ۲۵۰)، مقدار پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.
- `family` (اختیاری): `code-plugin` یا `bundle-plugin`. در صورت حذف، هر دو
  خانوادهٔ Plugin در نظر گرفته می‌شوند.

پاسخ:

- بدنه: بایگانی ZIP.
- ریشهٔ هر Plugin خروجی‌گرفته‌شده در `{family}/{packageName}/` قرار دارد.
- هر Plugin خروجی‌گرفته‌شده شامل فایل‌های ذخیره‌شدهٔ جدیدترین نسخه است.
- فرادادهٔ خروجی‌گیری هر Plugin در
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` ذخیره می‌شود.
- `_manifest.json` همیشه در ریشهٔ ZIP قرار می‌گیرد.
- اگر خروجی‌گیری از برخی Pluginها یا فایل‌ها ممکن نباشد، `_errors.json`
  اضافه می‌شود.

سرآیندها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

جست‌وجوی مختص Plugin در بسته‌های code-plugin و bundle-plugin.

پارامترهای کوئری:

- `q` (الزامی): رشتهٔ جست‌وجو
- `limit` (اختیاری): عدد صحیح (۱ تا ۱۰۰)
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقادیر فعلی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نکات:

- نام‌های مستعار قدیمی فیلتر v1 که در بخش `GET /api/v1/plugins` مستند شده‌اند نیز
  پذیرفته می‌شوند.
- فیلترکردن بر اساس دسته‌بندی، یک فیلتر واقعی API با پشتوانهٔ ردیف‌های چکیدهٔ
  دسته‌بندی Plugin است، نه بازنویسی کوئری جست‌وجو.
- نتایج به ترتیب ارتباط بازگردانده می‌شوند و در حال حاضر صفحه‌بندی ندارند.
- کنترل‌های مرتب‌سازی رابط مرورگر برای جست‌وجوی Plugin، نتایج مرتبط بارگذاری‌شده را
  مطابق رفتار فعلی مرور `/skills` دوباره مرتب می‌کنند.

### `GET /api/v1/packages/{name}`

فرادادهٔ جزئیات بسته را بازمی‌گرداند.

نکات:

- Skills نیز می‌توانند در کاتالوگ یکپارچه از طریق این مسیر تفکیک شوند.
- بسته‌های خصوصی `404` بازمی‌گردانند، مگر اینکه فراخواننده اجازهٔ خواندن ناشر مالک را داشته باشد.

### `DELETE /api/v1/packages/{name}`

یک بسته و همهٔ نسخه‌های آن را به‌صورت نرم حذف می‌کند.

نکات:

- به توکن API متعلق به مالک بسته، مالک/مدیر ناشر سازمانی،
  ناظر پلتفرم یا مدیر پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچهٔ نسخه‌ها را بازمی‌گرداند.

پارامترهای کوئری:

- `limit` (اختیاری): عدد صحیح (۱ تا ۱۰۰)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

نکات:

- بسته‌های خصوصی `404` بازمی‌گردانند، مگر اینکه فراخواننده اجازهٔ خواندن ناشر مالک را داشته باشد.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخهٔ بسته را همراه با فرادادهٔ فایل، سازگاری،
اعتبارسنجی، فرادادهٔ آرتیفکت و داده‌های اسکن بازمی‌گرداند.

نکات:

- `version.artifact.kind` برای بایگانی‌های بستهٔ قدیمی `legacy-zip` و
  برای نسخه‌های مبتنی بر ClawPack برابر با `npm-pack` است.
- نسخه‌های ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum` و
  `npmTarballName` هستند.
- `version.sha256hash` فرادادهٔ سازگاری منسوخ‌شده برای کلاینت‌های قدیمی است. این فیلد
  هش دقیق بایت‌های ZIP بازگردانده‌شده توسط `/api/v1/packages/{name}/download` را نگه می‌دارد.
  کلاینت‌های جدید باید از `version.artifact.sha256` استفاده کنند که
  آرتیفکت معیار نسخه را مشخص می‌کند.
- `version.vtAnalysis`، `version.llmAnalysis` و `version.staticScan` در صورت
  وجود داده‌های اسکن اضافه می‌شوند.
- بسته‌های خصوصی `404` بازمی‌گردانند، مگر اینکه فراخواننده اجازهٔ خواندن ناشر مالک را داشته باشد.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصهٔ دقیق امنیت و اعتماد نسخهٔ بسته را برای کلاینت‌های نصب
بازمی‌گرداند. این سطح عمومی مصرف OpenClaw برای تصمیم‌گیری دربارهٔ امکان نصب
نسخهٔ تفکیک‌شده است.

احراز هویت:

- نقطهٔ پایانی خواندن عمومی. توکن مالک، ناشر، ناظر یا مدیر
  الزامی نیست.

پاسخ:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

فیلدهای پاسخ:

- `package.name`، `package.displayName` و `package.family` بستهٔ تفکیک‌شدهٔ
  رجیستری را مشخص می‌کنند.
- `release.releaseId`، `release.version` و `release.createdAt`
  نسخهٔ دقیقی را که ارزیابی شده است مشخص می‌کنند.
- `release.artifactKind`، `release.artifactSha256`، `release.npmIntegrity`،
  `release.npmShasum` و `release.npmTarballName` در صورت شناخته‌شدن برای
  آرتیفکت نسخه ارائه می‌شوند.
- `trust.scanStatus` وضعیت مؤثر اعتماد است که از ورودی‌های اسکنر
  و نظارت دستی نسخه استخراج می‌شود.
- `trust.moderationState` می‌تواند تهی باشد. وقتی هیچ نظارت دستی برای نسخه
  وجود نداشته باشد، مقدار آن `null` است.
- `trust.blockedFromDownload` سیگنال مسدودسازی نصب است. OpenClaw و دیگر
  کلاینت‌های نصب باید در صورت `true` بودن این مقدار، به‌جای
  استخراج دوبارهٔ قواعد مسدودسازی از فیلدهای اسکنر یا نظارت، نصب را مسدود کنند.
- `trust.reasons` فهرست توضیحات کاربرمحور و ممیزی است. کدهای دلیل
  رشته‌هایی پایدار و فشرده مانند `manual:quarantined`، `scan:malicious`
  و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد همچنان در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصهٔ اعتماد بر اساس ورودی‌های منسوخ محاسبه شده است و
  پیش از تصمیم‌گیری مطمئن برای اجازه‌دادن، باید نیازمند به‌روزرسانی تلقی شود.

نکات:

- این نقطهٔ پایانی دقیقاً وابسته به نسخه است. کلاینت‌ها باید پس از تفکیک
  نسخهٔ بسته‌ای که قصد نصب آن را دارند، آن را فراخوانی کنند، نه صرفاً پس از خواندن
  جدیدترین فرادادهٔ بسته.
- بسته‌های خصوصی `404` بازمی‌گردانند، مگر اینکه فراخواننده اجازهٔ خواندن ناشر مالک را داشته باشد.
- این نقطهٔ پایانی عمداً محدودتر از نقاط پایانی نظارت مالک/ناظر است.
  این مسیر تصمیم نصب و توضیحات عمومی را ارائه می‌کند، نه
  هویت گزارش‌دهندگان، متن گزارش‌ها، شواهد خصوصی یا جدول زمانی بررسی داخلی.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فرادادهٔ صریح تفکیک‌کنندهٔ آرتیفکت را برای یک نسخهٔ بسته بازمی‌گرداند.

نکات:

- نسخه‌های قدیمی بسته یک آرتیفکت `legacy-zip` و `downloadUrl`
  قدیمی ZIP بازمی‌گردانند.
- نسخه‌های ClawPack یک آرتیفکت `npm-pack`، فیلدهای یکپارچگی npm،
  یک `tarballUrl` و نشانی سازگاری قدیمی ZIP بازمی‌گردانند.
- این سطح تفکیک‌کنندهٔ OpenClaw است؛ از حدس‌زدن قالب بایگانی بر اساس
  یک نشانی مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

آرتیفکت نسخه را از طریق مسیر صریح تفکیک‌کننده بارگیری می‌کند.

نکات:

- نسخه‌های ClawPack دقیقاً بایت‌های `.tgz` بارگذاری‌شدهٔ npm-pack را به‌صورت جریانی ارسال می‌کنند.
- نسخه‌های قدیمی ZIP به `/api/v1/packages/{name}/download?version=` هدایت می‌شوند.
- از سهمیهٔ نرخ بارگیری استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آیندهٔ OpenClaw را بازمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر هستند:

- وضعیت کانال رسمی
- در دسترس‌بودن جدیدترین نسخه
- در دسترس‌بودن آرتیفکت npm-pack مربوط به ClawPack
- چکیدهٔ آرتیفکت
- منشأ مخزن منبع و کامیت
- فرادادهٔ سازگاری OpenClaw
- مقصدهای میزبان
- وضعیت اسکن

پاسخ:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

نقطهٔ پایانی ناظر برای فهرست‌کردن ردیف‌های مهاجرت Pluginهای رسمی OpenClaw.

احراز هویت:

- به توکن API متعلق به کاربر ناظر یا مدیر نیاز دارد.

پارامترهای کوئری:

- `phase` (اختیاری): `planned`، `published`، `clawpack-ready`،
  `legacy-zip-only`، `metadata-ready`، `blocked`، `ready-for-openclaw` یا
  `all` (پیش‌فرض).
- `limit` (اختیاری): عدد صحیح (۱ تا ۱۰۰)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

پاسخ:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

نقطهٔ پایانی مدیر برای ایجاد یا به‌روزرسانی یک ردیف مهاجرت Plugin رسمی.

احراز هویت:

- به توکن API متعلق به کاربر مدیر نیاز دارد.

بدنهٔ درخواست:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

نکات:

- `bundledPluginId` به حروف کوچک نرمال‌سازی می‌شود و کلید پایدار درج یا به‌روزرسانی است.
- `packageName` بر اساس نام npm نرمال‌سازی می‌شود؛ بسته می‌تواند برای مهاجرت‌های
  برنامه‌ریزی‌شده وجود نداشته باشد.
- این فقط آمادگی مهاجرت را پیگیری می‌کند. OpenClaw را تغییر نمی‌دهد و
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

نقطهٔ پایانی ناظر/مدیر برای صف‌های بررسی نسخه‌های بسته.

احراز هویت:

- به توکن API متعلق به کاربر ناظر یا مدیر نیاز دارد.

پارامترهای کوئری:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual` یا `all`
- `limit` (اختیاری): عدد صحیح (۱ تا ۱۰۰)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

معانی وضعیت‌ها:

- `open`: نسخه‌های مشکوک، مخرب، در انتظار، قرنطینه‌شده، لغوشده یا گزارش‌شده.
- `blocked`: نسخه‌های قرنطینه‌شده، لغوشده یا مخرب.
- `manual`: هر نسخه‌ای که دارای بازنویسی دستی نظارت باشد.
- `all`: هر نسخه‌ای که دارای بازنویسی دستی، وضعیت اسکن غیرپاک یا گزارش بسته باشد.

پاسخ:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

یک بسته را برای بررسی ناظر گزارش می‌کند. گزارش‌ها در سطح بسته هستند و می‌توانند
به‌صورت اختیاری به یک نسخه پیوند داده شوند. این گزارش‌ها صف نظارت را تغذیه می‌کنند، اما به‌تنهایی
باعث پنهان‌شدن خودکار یا مسدودشدن بارگیری‌ها نمی‌شوند؛ ناظران باید برای
تأیید، قرنطینه یا لغو آرتیفکت‌ها از نظارت نسخه استفاده کنند.

احراز هویت:

- به توکن API نیاز دارد.

درخواست:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

پاسخ:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

نقطه پایانی ناظر/مدیر برای دریافت گزارش‌های بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای پرس‌وجو:

- `status` (اختیاری): `open` (پیش‌فرض)، `confirmed`، `dismissed` یا `all`
- `limit` (اختیاری): عدد صحیح (۱ تا ۱۰۰)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

پاسخ:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

نقطه پایانی مالک/ناظر برای مشاهده وضعیت نظارت بسته.

احراز هویت:

- به توکن API برای مالک بسته، عضو ناشر، ناظر یا کاربر مدیر نیاز دارد.

پاسخ:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

نقطه پایانی ناظر/مدیر برای حل‌وفصل یا بازگشایی گزارش‌های بسته.

درخواست:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام بازگرداندن `status` به `open` می‌توان آن را حذف کرد. برای اعمال نظارت بر انتشار در همان گردش‌کار قابل ممیزی، همراه گزارش تأییدشده `finalAction: "quarantine"` یا `finalAction: "revoke"` را ارسال کنید.

پاسخ:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

نقطه پایانی ناظر/مدیر برای بازبینی انتشار بسته.

درخواست:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

وضعیت‌های پشتیبانی‌شده:

- `approved`: به‌صورت دستی بازبینی و مجاز شده است.
- `quarantined`: تا زمان پیگیری مسدود شده است.
- `revoked`: پس از آنکه انتشار قبلاً مورد اعتماد بوده، مسدود شده است.

مسیرهای دانلود دست‌ساخته برای انتشارهای قرنطینه‌شده و لغوشده پاسخ `403` برمی‌گردانند.
هر تغییر یک ورودی در گزارش ممیزی ثبت می‌کند.

### `GET /api/v1/packages/{name}/file`

محتوای متنی خام یک فایل بسته را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌طور پیش‌فرض از آخرین انتشار استفاده می‌کند.
- از سهمیه نرخ خواندن استفاده می‌کند، نه سهمیه دانلود.
- فایل‌های دودویی پاسخ `415` برمی‌گردانند.
- محدودیت اندازه فایل: ۲۰۰ کیلوبایت.
- اسکن‌های در انتظار VirusTotal خواندن را مسدود نمی‌کنند؛ ممکن است انتشارهای مخرب همچنان در بخش‌های دیگر ارائه نشوند.
- بسته‌های خصوصی پاسخ `404` برمی‌گردانند، مگر اینکه فراخواننده مجاز به خواندن ناشر مالک باشد.

### `GET /api/v1/packages/{name}/download`

بایگانی ZIP قطعی قدیمی را برای یک انتشار بسته دانلود می‌کند.

پارامترهای پرس‌وجو:

- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌طور پیش‌فرض از آخرین انتشار استفاده می‌کند.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- بایگانی‌های Plugin/بسته فایل‌های zip با ریشه `package/` هستند تا کلاینت‌های قدیمی OpenClaw همچنان کار کنند.
- این مسیر فقط ZIP باقی می‌ماند. فایل‌های `.tgz` مربوط به ClawPack را به‌صورت جریانی ارسال نمی‌کند.
- پاسخ‌ها برای بررسی یکپارچگی توسط حل‌کننده، شامل سرآیندهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type` و `X-ClawHub-Artifact-Sha256` هستند.
- فراداده‌ای که فقط به رجیستری مربوط است، به بایگانی دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلود را مسدود نمی‌کنند؛ انتشارهای مخرب پاسخ `403` برمی‌گردانند.
- بسته‌های خصوصی پاسخ `404` برمی‌گردانند، مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک سند بسته سازگار با npm را برای نسخه‌های بسته مبتنی بر ClawPack برمی‌گرداند.

نکات:

- فقط نسخه‌هایی که tarballهای npm-pack مربوط به ClawPack برای آن‌ها بارگذاری شده‌اند فهرست می‌شوند.
- نسخه‌های قدیمیِ فقط ZIP عمداً حذف می‌شوند.
- `dist.tarball`، `dist.integrity` و `dist.shasum` از فیلدهای سازگار با npm استفاده می‌کنند تا کاربران در صورت تمایل بتوانند npm را به آینه هدایت کنند.
- اسناد بسته‌های دارای محدوده، هم از `/api/npm/@scope/name` و هم از مسیر درخواست کدگذاری‌شده npm یعنی `/api/npm/@scope%2Fname` پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball بارگذاری‌شده ClawPack را برای کلاینت‌های آینه npm به‌صورت جریانی ارسال می‌کند.

نکات:

- از سهمیه نرخ دانلود استفاده می‌کند.
- سرآیندهای دانلود شامل SHA-256 مربوط به ClawHub به‌همراه فراداده یکپارچگی/شاسام npm هستند.
- بررسی‌های نظارت و دسترسی به بسته خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

CLI از این مسیر برای نگاشت اثرانگشت محلی به یک نسخه شناخته‌شده استفاده می‌کند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `hash` (الزامی): sha256 شانزده‌شانزدهی ۶۴ نویسه‌ای اثرانگشت بسته

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک ZIP از نسخه میزبانی‌شده Skill را دانلود می‌کند، یا برای یک Skill جاری مبتنی بر GitHub که اسکن `clean` یا `suspicious` دارد و نسخه میزبانی‌شده‌ای ندارد، تحویل منبع GitHub را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `version` (اختیاری): رشته semver
- `tag` (اختیاری): نام برچسب (برای نمونه `latest`)

نکات:

- اگر نه `version` و نه `tag` ارائه شوند، از آخرین نسخه استفاده می‌شود.
- نسخه‌های حذف نرم‌شده پاسخ `410` برمی‌گردانند.
- تحویل‌های Skill مبتنی بر GitHub بایت‌ها را پراکسی یا آینه نمی‌کنند. پاسخ JSON شامل `sourceRef: "public-github"`، `repo`، `commit`، `path`، `contentHash` و `archiveUrl` است؛ وضعیت اسکن/جاری نقش دروازه را دارد و به‌عنوان فراداده بار موفق در پاسخ گنجانده نمی‌شود.
- آمار دانلود به‌صورت هویت‌های یکتا در هر روز UTC شمارش می‌شود (`userId` وقتی توکن API معتبر است، در غیر این صورت IP).

## نقاط پایانی احراز هویت (توکن Bearer)

همه نقاط پایانی نیاز دارند:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

توکن را اعتبارسنجی می‌کند و شناسه کاربری را برمی‌گرداند.

### `POST /api/v1/skills`

نسخه‌ای جدید منتشر می‌کند.

- روش ترجیحی: `multipart/form-data` همراه JSON در `payload` و داده‌های دودویی `files[]`.
- بدنه JSON دارای `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری بار: `ownerHandle`. در صورت وجود، API آن ناشر را در سمت سرور شناسایی می‌کند و لازم است کنشگر به ناشر دسترسی داشته باشد.
- فیلد اختیاری بار: `migrateOwner`. وقتی همراه `ownerHandle` مقدار آن `true` باشد، یک Skill موجود می‌تواند به آن مالک منتقل شود، مشروط بر اینکه کنشگر در ناشر فعلی و ناشر مقصد مدیر/مالک باشد. بدون این پذیرش صریح، تغییر مالک رد می‌شود.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت با توکن Bearer نیاز دارد.
- به `multipart/form-data` نیاز دارد.
- فیلدهای مجاز فرم عبارت‌اند از `payload`، داده‌های دودویی تکرارشونده `files` یا یک ارجاع tarball با نام `clawpack`. `clawpack` می‌تواند یک داده دودویی `.tgz` یا شناسه ذخیره‌سازی بازگردانده‌شده توسط گردش‌کار upload-url باشد. انتشارهای مرحله‌بندی‌شده با شناسه ذخیره‌سازی باید `clawpackUploadTicket` بازگردانده‌شده همراه آن نشانی بارگذاری را نیز شامل شوند.
- فقط از یکی از `files` یا `clawpack` استفاده کنید و هرگز هر دو را در یک درخواست نفرستید.
- بدنه‌های JSON و فراداده `payload.files` / `payload.artifact` ارائه‌شده توسط فراخواننده رد می‌شوند.
- درخواست‌های انتشار مستقیم چندبخشی به ۱۸ مگابایت محدودند. tarballهای ClawPack می‌توانند تا سقف ۱۲۰ مگابایت tarball از گردش‌کار upload-url استفاده کنند.
- فیلد اختیاری بار: `ownerHandle`. در صورت وجود، فقط مدیران می‌توانند از طرف آن مالک منتشر کنند.

نکات برجسته اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های `.tgz` مربوط به ClawPack باید آن را در `package/openclaw.plugin.json` داشته باشند.
- Pluginهای کد به `package.json`، فراداده مخزن منبع، فراداده کامیت منبع، فراداده شِمای پیکربندی، `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
- فقط ناشر سازمانی `openclaw` و ناشران شخصی اعضای فعلی سازمان `openclaw` می‌توانند در کانال `official` منتشر کنند.
- انتشارهای از طرف دیگران همچنان صلاحیت کانال رسمی را بر اساس حساب مالک مقصد اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

یک Skill را به‌صورت نرم حذف / بازیابی می‌کند (مالک، ناظر یا مدیر).

بدنه JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

در صورت وجود، `reason` به‌عنوان یادداشت نظارت Skill ذخیره و در گزارش ممیزی کپی می‌شود.
حذف‌های نرم آغازشده توسط مالک، slug را برای ۳۰ روز رزرو می‌کنند؛ پس از آن ناشر دیگری می‌تواند slug را تصاحب کند.
وقتی این انقضا اعمال شود، پاسخ حذف شامل `slugReservedUntil` است.
پنهان‌سازی توسط ناظر/مدیر و حذف‌های امنیتی به این روش منقضی نمی‌شوند.

پاسخ حذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

کدهای وضعیت:

- `200`: موفق
- `401`: احراز هویت نشده
- `403`: ممنوع
- `404`: Skill/کاربر یافت نشد
- `500`: خطای داخلی سرور

### `POST /api/v1/users/publisher`

فقط مدیر. تضمین می‌کند که یک ناشر سازمانی برای یک شناسه وجود داشته باشد. اگر شناسه همچنان به یک ناشر مشترک قدیمی یا ناشر کاربر/شخصی اشاره کند، نقطه پایانی ابتدا آن را به ناشر سازمانی مهاجرت می‌دهد.
برای یک سازمان تازه‌ساخته‌شده، `memberHandle` را ارائه کنید؛ مدیر اجراکننده به‌عنوان عضو افزوده نمی‌شود.
مقدار پیش‌فرض `memberRole` برابر `owner` است.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

ایجاد سلف‌سرویس و احرازشده ناشر سازمانی. یک ناشر سازمانی جدید می‌سازد و فراخواننده را به‌عنوان مالک می‌افزاید. این نقطه پایانی شناسه‌های کاربر/شخصی موجود را مهاجرت نمی‌دهد و ناشر را مورد اعتماد/رسمی علامت‌گذاری نمی‌کند.

- بدنه: `{ "handle": "opik", "displayName": "Opik" }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- وقتی شناسه از قبل توسط یک ناشر، کاربر یا ناشر شخصی استفاده شده باشد، `409` برمی‌گرداند.

### `POST /api/v1/users/reserve`

فقط مدیر. slugهای ریشه و نام‌های بسته را بدون انتشار نسخه برای مالک برحق رزرو می‌کند. نام‌های بسته به بسته‌های جای‌نگهدار خصوصی بدون ردیف انتشار تبدیل می‌شوند تا همان مالک بعداً بتواند انتشار واقعی code-plugin یا bundle-plugin را با آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

فقط مدیر. یک ناشر شخصی را برای هویت جایگزین تأییدشده GitHub OAuth، بدون ویرایش ردیف‌های حساب Convex Auth، بازیابی می‌کند. درخواست باید هر دو شناسه تغییرناپذیر حساب ارائه‌دهنده GitHub را مشخص کند؛ شناسه‌های قابل تغییر فقط به‌عنوان محافظی برای اپراتور استفاده می‌شوند.

نقطهٔ پایانی به‌طور پیش‌فرض در حالت اجرای آزمایشی است. اعمال بازیابی پس از آن‌که کارکنان به‌صورت مستقل تداوم هویت میان هر دو حساب اصلی GitHub را تأیید کردند، به `dryRun: false` و `confirmIdentityVerified: true` نیاز دارد. اگر ناشر شخصی فعلی کاربر مقصد دارای Skills، بسته‌ها یا منابع Skill در GitHub باشد، بازیابی با رویکرد بسته و ایمن شکست می‌خورد.
بازیابی همچنین فیلدهای قدیمی `ownerUserId` را برای Skills ناشر بازیابی‌شده، نام‌های مستعار شناسهٔ Skill، بسته‌ها، هشدارهای بازرس بسته و ردیف‌های مشتق‌شدهٔ چکیدهٔ جست‌وجو منتقل می‌کند تا مسیرهای مالک مستقیم با اختیار ناشر جدید هم‌خوان باشند. رزرو فعال شناسهٔ محافظت‌شده برای شناسهٔ بازیابی‌شده نیز به کاربر جایگزین واگذار می‌شود تا همگام‌سازی بعدی نمایه نتواند اختیار رقیب کاربر پیشین را بازگرداند. هر جدول اصلی در هر تراکنش اعمال به ۱۰۰ ردیف محدود است؛ بازیابی‌های بزرگ‌تر باید ابتدا از مهاجرت قابل‌ازسرگیری مالک استفاده کنند.
منابع Skill در GitHub در محدودهٔ ناشر هستند و به‌جای بازنویسی‌شدن، به‌صورت بررسی‌شده گزارش می‌شوند.

- بدنه: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- پاسخ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط پایانی مدیریت شناسهٔ مالک

- `POST /api/v1/skills/{slug}/rename`
  - بدنه: `{ "newSlug": "new-canonical-slug" }`
  - پاسخ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - بدنه: `{ "targetSlug": "canonical-target-slug" }`
  - پاسخ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

نکات:

- هر دو نقطهٔ پایانی به احراز هویت با توکن API نیاز دارند و فقط برای مالک Skill کار می‌کنند.
- `rename` شناسهٔ قبلی را به‌عنوان نام مستعار تغییرمسیر حفظ می‌کند.
- `merge` فهرست مبدأ را پنهان می‌کند و شناسهٔ مبدأ را به فهرست مقصد تغییرمسیر می‌دهد.

### نقاط پایانی انتقال مالکیت

- `POST /api/v1/skills/{slug}/transfer`
  - بدنه: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - پاسخ: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - پاسخ (پذیرش/رد/لغو): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - ساختار پاسخ: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

مسدودکردن کاربر و حذف دائمی Skills متعلق به او (فقط ناظر/مدیر).

بدنه:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

یا

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

پاسخ:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

رفع مسدودی کاربر و بازیابی Skills واجد شرایط (فقط مدیر).

بدنه:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

یا

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

پاسخ:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

تغییر دلیل ذخیره‌شده برای یک مسدودی موجود، بدون رفع مسدودی یا بازیابی محتوا (فقط مدیر). مگر آن‌که `dryRun` برابر `false` باشد، به‌طور پیش‌فرض در حالت اجرای آزمایشی است.

بدنه:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

یا

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

پاسخ:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

تغییر نقش کاربر (فقط مدیر).

بدنه:

```json
{ "handle": "user_handle", "role": "moderator" }
```

یا

```json
{ "userId": "users_...", "role": "admin" }
```

پاسخ:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

فهرست‌کردن یا جست‌وجوی کاربران (فقط مدیر).

پارامترهای پرس‌وجو:

- `q` (اختیاری): عبارت جست‌وجو
- `query` (اختیاری): نام مستعار `q`
- `limit` (اختیاری): حداکثر نتایج (پیش‌فرض ۲۰، حداکثر ۲۰۰)

پاسخ:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

افزودن/حذف ستاره (برجسته‌سازی). هر دو نقطهٔ پایانی هم‌توان هستند.

پاسخ‌ها:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقاط پایانی قدیمی CLI (منسوخ‌شده)

همچنان برای نسخه‌های قدیمی‌تر CLI پشتیبانی می‌شوند:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

برای برنامهٔ حذف به `DEPRECATIONS.md` مراجعه کنید.

`POST /api/cli/upload-url` مقادیر `uploadUrl` و `uploadTicket` را برمی‌گرداند. انتشار بسته‌هایی که یک تاربال ClawPack را آماده‌سازی می‌کنند باید شناسهٔ ذخیره‌سازی حاصل را به‌صورت `clawpack` و بلیت بازگردانده‌شده را به‌صورت `clawpackUploadTicket` ارسال کنند.

## کشف رجیستری (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات رجیستری/احراز هویت را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

طرح‌واره:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر خودتان میزبانی می‌کنید، این فایل را ارائه دهید (یا `CLAWHUB_REGISTRY` را صراحتاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی است).
