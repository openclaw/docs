---
read_when:
    - افزودن/تغییر نقاط پایانی
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع HTTP API (عمومی + نقاط پایانی CLI + احراز هویت).
x-i18n:
    generated_at: "2026-07-04T03:56:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

نشانی پایه URL: `https://clawhub.ai` (پیش‌فرض).

همه مسیرهای v1 زیر `/api/v1/...` هستند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی مانده‌اند (به `DEPRECATIONS.md` مراجعه کنید).
OpenAPI: `/api/v1/openapi.json`.

## استفاده مجدد از کاتالوگ عمومی

دایرکتوری‌های شخص ثالث می‌توانند از نقاط پایانی خواندن عمومی برای فهرست کردن یا جست‌وجوی Skills در ClawHub استفاده کنند. لطفا نتایج را کش کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست اصلی ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) برگردانید، و از القای تایید سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای پنهان، خصوصی، یا مسدودشده توسط نظارت را بیرون از سطح API عمومی آینه کنید.

میانبرهای اسلاگ وب در خانواده‌های رجیستری resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی تقدم مسیر، از URLهای اصلی بازگردانده‌شده توسط نقاط پایانی خواندن استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (توکن Bearer معتبر): به‌ازای باکت کاربر اعمال می‌شود.
- اگر توکن وجود نداشته باشد یا نامعتبر باشد، رفتار به اعمال بر اساس IP برمی‌گردد.
- نقاط پایانی نوشتن احراز هویت‌شده نباید وقتی سرور دلیل را می‌داند، یک `Unauthorized` خالی برگردانند. توکن‌های جاافتاده، توکن‌های نامعتبر/لغوشده، و حساب‌های حذف‌شده/مسدودشده/غیرفعال‌شده باید هرکدام متن قابل‌اقدامی دریافت کنند تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی مانع آن‌ها شده است.

- خواندن: 3000/دقیقه به‌ازای هر IP، 12000/دقیقه به‌ازای هر کلید
- نوشتن: 300/دقیقه به‌ازای هر IP، 3000/دقیقه به‌ازای هر کلید
- دانلود: 1200/دقیقه به‌ازای هر IP، 6000/دقیقه به‌ازای هر کلید (نقاط پایانی دانلود)

سرصفحه‌ها:

- سازگاری قدیمی: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`، `RateLimit-Reset`
- روی `429`: `X-RateLimit-Remaining: 0` و `RateLimit-Remaining: 0`
- روی `429`: `Retry-After`

معنای سرصفحه‌ها:

- `X-RateLimit-Reset`: ثانیه‌های مطلق epoch یونیکس
- `RateLimit-Reset`: ثانیه‌ها تا بازنشانی (تاخیر)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجه باقی‌مانده دقیق، وقتی وجود داشته باشد.
  درخواست‌های موفق شاردشده به‌جای برگرداندن مقدار تقریبی سراسری، این سرصفحه را حذف می‌کنند.
- `Retry-After`: تعداد ثانیه‌های انتظار پیش از تلاش دوباره (تاخیر) روی `429`

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

- اگر `Retry-After` وجود دارد، پیش از تلاش دوباره به همان تعداد ثانیه صبر کنید.
- برای جلوگیری از تلاش‌های هم‌زمان، از عقب‌نشینی همراه با jitter استفاده کنید.
- اگر `Retry-After` وجود ندارد، به `RateLimit-Reset` برگردید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- فقط وقتی استقرار صراحتا سرصفحه‌های forwarded مورد اعتماد را فعال کرده باشد، از سرصفحه‌های IP کلاینت مورد اعتماد، از جمله `cf-connecting-ip`، استفاده می‌کند.
- ClawHub از سرصفحه‌های forwarding مورد اعتماد برای شناسایی IPهای کلاینت در لبه استفاده می‌کند.
- اگر هیچ IP کلاینت مورد اعتمادی در دسترس نباشد، درخواست‌های ناشناس از باکت‌های جایگزینی استفاده می‌کنند که فقط بر اساس نوع محدودیت نرخ scope شده‌اند. این باکت‌های جایگزین شامل مسیرهای ارائه‌شده توسط فراخواننده، اسلاگ‌ها، نام‌های بسته، نسخه‌ها، رشته‌های query، یا سایر پارامترهای artifact نمی‌شوند.

## پاسخ‌های خطا

پاسخ‌های خطای عمومی v1 متن ساده با `content-type: text/plain; charset=utf-8` هستند.
این شامل خطاهای اعتبارسنجی (`400`)، منابع عمومی جاافتاده (`404`)، خطاهای احراز هویت و مجوز (`401`/`403`)، محدودیت‌های نرخ (`429`)، و دانلودهای مسدودشده می‌شود. کلاینت‌ها باید بدنه پاسخ را به‌عنوان یک رشته خوانای انسانی بخوانند. پارامترهای query ناشناخته برای سازگاری نادیده گرفته می‌شوند، اما پارامترهای query شناخته‌شده با مقادیر نامعتبر `400` برمی‌گردانند.

## نقاط پایانی عمومی (بدون احراز هویت)

### `GET /api/v1/search`

پارامترهای query:

- `q` (الزامی): رشته query
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): `true` برای فیلتر کردن به Skills برجسته‌شده
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان کردن Skills مشکوک (`flagged.suspicious`)
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

یادداشت‌ها:

- نتایج به‌ترتیب ارتباط برگردانده می‌شوند (شباهت embedding + تقویت‌های دقیق توکن اسلاگ/نام + یک prior کوچک محبوبیت).
- ارتباط از محبوبیت قوی‌تر است. تطابق دقیق توکن اسلاگ یا نام نمایشی می‌تواند بالاتر از تطابق آزادتر با تعامل بسیار قوی‌تر رتبه بگیرد.
- متن ASCII روی مرزهای واژه و نشانه‌گذاری توکنیزه می‌شود. برای مثال، `personal-map` شامل یک توکن مستقل `map` است، درحالی‌که `amap-jsapi-skill` شامل `amap`، `jsapi`، و `skill` است؛ بنابراین جست‌وجوی `map` به `personal-map` تطابق واژگانی قوی‌تری نسبت به `amap-jsapi-skill` می‌دهد.
- محبوبیت با مقیاس لگاریتمی و سقف‌دار است. Skills با تعامل بالا می‌توانند وقتی متن query تطابق ضعیف‌تری دارد، پایین‌تر رتبه بگیرند.
- وضعیت نظارت مشکوک یا پنهان می‌تواند بسته به فیلترهای فراخواننده و وضعیت فعلی نظارت، یک Skill را از جست‌وجوی عمومی حذف کند.

راهنمای قابل‌کشف بودن ناشر:

- اصطلاحاتی را که کاربران عملا جست‌وجو می‌کنند در نام نمایشی، خلاصه، و برچسب‌ها قرار دهید. فقط وقتی از توکن اسلاگ مستقل استفاده کنید که همان هم یک هویت پایدار باشد که می‌خواهید حفظ کنید.
- فقط برای دنبال کردن یک query، اسلاگ را تغییر نام ندهید مگر اینکه اسلاگ جدید نام اصلی بلندمدت بهتری باشد. اسلاگ‌های قدیمی به نام‌های مستعار redirect تبدیل می‌شوند، اما URL اصلی، اسلاگ نمایش‌داده‌شده، و digestهای جست‌وجوی آینده از اسلاگ جدید استفاده می‌کنند.
- نام‌های مستعار تغییر نام، resolve شدن URLهای قدیمی و نصب‌هایی را که از طریق رجیستری resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو پس از ایندکس شدن تغییر نام، بر اساس متادیتای Skill اصلی است. آمار موجود همراه Skill باقی می‌ماند.
- اگر یک Skill به‌شکل غیرمنتظره نامرئی است، پیش از تغییر متادیتای مرتبط با رتبه‌بندی، ابتدا وضعیت نظارت را با `clawhub inspect @owner/slug` در حالت واردشده بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): نشانگر صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended` (نام مستعار: `default`)، `createdAt` (نام مستعار: `newest`)، `downloads`، `stars` (نام مستعار: `rating`)، نام‌های مستعار نصب قدیمی `installsCurrent`/`installs`/`installsAllTime` به `downloads` نگاشت می‌شوند، `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان کردن Skills مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): نام مستعار قدیمی برای `nonSuspiciousOnly`

مقادیر نامعتبر `sort` مقدار `400` برمی‌گردانند.

یادداشت‌ها:

- `recommended` از سیگنال‌های تعامل و تازگی استفاده می‌کند.
- `trending` بر اساس نصب‌ها در 7 روز گذشته رتبه‌بندی می‌کند (مبتنی بر telemetry).
- `createdAt` برای crawlهای Skill جدید پایدار است؛ `updated` وقتی Skills موجود دوباره منتشر می‌شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` باشد، sortهای مبتنی بر cursor ممکن است در یک صفحه کمتر از `limit` آیتم برگردانند، چون Skills مشکوک پس از دریافت صفحه فیلتر می‌شوند.
- وقتی `nextCursor` وجود دارد، از آن برای ادامه صفحه‌بندی استفاده کنید. یک صفحه کوتاه به‌تنهایی به معنی پایان نتایج نیست.

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

یادداشت‌ها:

- اسلاگ‌های قدیمی ایجادشده توسط جریان‌های تغییر نام/ادغام مالک به Skill اصلی resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter Skill (مثلا `["macos"]`، `["linux"]`). اگر اعلام نشده باشد `null`.
- `metadata.systems`: هدف‌های سیستم Nix (مثلا `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد `null`.
- اگر Skill هیچ متادیتای پلتفرمی نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط وقتی گنجانده می‌شود که Skill پرچم‌گذاری شده باشد یا مالک در حال مشاهده آن باشد.

### `GET /api/v1/skills/{slug}/moderation`

وضعیت ساختاریافته نظارت را برمی‌گرداند.

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

یادداشت‌ها:

- مالکان و ناظران می‌توانند به جزئیات نظارت برای Skills پنهان دسترسی داشته باشند.
- فراخواننده‌های عمومی فقط برای Skills قابل‌مشاهده‌ای که از قبل پرچم‌گذاری شده‌اند `200` دریافت می‌کنند.
- شواهد برای فراخواننده‌های عمومی redacted می‌شود و فقط برای مالکان/ناظران شامل snippetهای خام است.

### `POST /api/v1/skills/{slug}/report`

یک Skill را برای بازبینی ناظر گزارش کنید. گزارش‌ها در سطح Skill هستند، به‌صورت اختیاری به یک نسخه پیوند می‌خورند، و صف گزارش Skill را تغذیه می‌کنند.

احراز هویت:

- به یک توکن API نیاز دارد.

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

پارامترهای query:

- `status` (اختیاری): `open` (پیش‌فرض)، `confirmed`، `dismissed`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-200)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

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

نقطه پایانی ناظر/مدیر برای resolve کردن یا بازگشایی گزارش‌های Skill.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام تنظیم دوباره `status` به `open` می‌توان آن را حذف کرد. برای پنهان کردن Skill در همان گردش‌کار قابل‌ممیزی، `finalAction: "hide"` را همراه با یک گزارش triage‌شده ارسال کنید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): نشانگر صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

متادیتای نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` وضعیت نرمال‌شده تایید اسکن و جزئیات اسکنر را، در صورت موجود بودن، شامل می‌شود
  (VirusTotal + LLM).

### `GET /api/v1/skills/{slug}/scan`

جزئیات تایید اسکن امنیتی را برای یک نسخه Skill برمی‌گرداند.

پارامترهای query:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): یک نسخه برچسب‌گذاری‌شده را resolve می‌کند (برای مثال `latest`).

یادداشت‌ها:

- اگر نه `version` و نه `tag` ارائه شود، از آخرین نسخه استفاده می‌کند.
- شامل وضعیت راستی‌آزمایی نرمال‌سازی‌شده به‌همراه جزئیات مختص اسکنر است.
- مقدار `security.hasScanResult` فقط زمانی `true` است که یک اسکنر رأی قطعی تولید کرده باشد (`clean`، `suspicious`، یا `malicious`).
- `moderation` یک نمای فوری فعلی از تعدیل در سطح skill است که از آخرین نسخه مشتق شده است.
- هنگام پرس‌وجوی یک نسخه تاریخی، قبل از اینکه `moderation` و `security` را در بافت نسخه یکسان در نظر بگیرید، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

### `POST /api/v1/skills/-/scan`

نقطه پایانی ارسال احراز هویت‌شده برای کارهای جدید ClawScan.

اسکن‌های بارگذاری محلی دیگر پشتیبانی نمی‌شوند. درخواست‌هایی که از
`multipart/form-data` یا `{ "source": { "kind": "upload" } }` استفاده کنند، `410` برمی‌گردانند.

اسکن‌های منتشرشده از JSON استفاده می‌کنند:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

نکات:

- محموله‌های درخواست اسکن و گزارش‌های قابل دانلود پس از پنجره نگه‌داری از مخزن درخواست اسکن منقضی می‌شوند.
- اسکن‌های منتشرشده به دسترسی مدیریتی مالک/ناشر، یا اختیار ناظر/مدیر پلتفرم نیاز دارند.
- اسکن‌های منتشرشده فقط زمانی بازنویسی می‌کنند که `update: true` باشد و اسکن با موفقیت کامل شود.
- پاسخ `202` با `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` است.
- کارهای اسکن ناهمگام هستند. درخواست‌های اسکن دستی جلوتر از کارهای عادی انتشار/پرکردن مجدد اولویت‌بندی می‌شوند، اما تکمیل همچنان به در دسترس بودن worker بستگی دارد.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطه پایانی نظرسنجی احراز هویت‌شده برای یک اسکن ارسال‌شده.

- وضعیت در صف/در حال اجرا/موفق/ناموفق را برمی‌گرداند.
- هنگام در صف بودن، `queue.queuedAhead` و `queue.position` را برمی‌گرداند تا کلاینت‌ها بتوانند نشان دهند چند اسکن دستی اولویت‌دار جلوتر از درخواست هستند. صف‌های بسیار بزرگ محدود می‌شوند و با `queuedAheadIsEstimate: true` گزارش می‌شوند.
- وقتی در دسترس باشد، `report` شامل بخش‌های `clawscan`، `skillspector`، `staticAnalysis`، و `virustotal` است.
- کارهای اسکن ناموفق `status: "failed"` را همراه با `lastError` برمی‌گردانند.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطه پایانی آرشیو گزارش احراز هویت‌شده.

- به یک اسکن موفق نیاز دارد؛ اسکن‌های غیرنهایی `409` برمی‌گردانند.
- یک ZIP شامل `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json`، و `README.md` برمی‌گرداند.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطه پایانی آرشیو گزارش ذخیره‌شده احراز هویت‌شده برای نسخه‌های ارسال‌شده.

- به دسترسی مدیریتی مالک/ناشر به skill یا plugin، یا اختیار ناظر/مدیر پلتفرم نیاز دارد.
- نتایج اسکن ذخیره‌شده برای نسخه دقیق ارسال‌شده، شامل نسخه‌های مسدودشده یا پنهان، را برمی‌گرداند.
- مقدار پیش‌فرض `kind` برابر `skill` است؛ برای اسکن‌های plugin/package از `kind=plugin` استفاده کنید.
- همان شکل ZIP دانلودهای درخواست اسکن را برمی‌گرداند.

### `POST /api/v1/skills/-/scan/batch`

مسیر بازاسکن دسته‌ای کانونی فقط برای مدیر. همان شکل محموله `POST /api/v1/skills/-/rescan-batch` قدیمی را می‌پذیرد.

### `POST /api/v1/skills/-/scan/batch/status`

مسیر وضعیت دسته‌ای کانونی فقط برای مدیر. `{ "jobIds": ["..."] }` را می‌پذیرد و همان شمارنده‌های تجمیعی `POST /api/v1/skills/-/rescan-batch/status` قدیمی را برمی‌گرداند.

### `GET /api/v1/skills/{slug}/verify`

پوش تأیید Skill Card را که توسط `clawhub skill verify` استفاده می‌شود برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): یک نسخه برچسب‌خورده را حل می‌کند (برای مثال `latest`).

نکات:

- `ok` فقط زمانی `true` است که نسخه انتخاب‌شده یک Skill Card تولیدشده داشته باشد، توسط تعدیل به‌عنوان بدافزار مسدود نشده باشد، و راستی‌آزمایی ClawScan پاک باشد.
- هویت skill، هویت ناشر، و فراداده نسخه انتخاب‌شده فیلدهای سطح بالای پوش هستند (`slug`، `displayName`، `publisherHandle`، `version`، `resolvedFrom`، `tag`، `createdAt`) تا خودکارسازی shell بتواند آن‌ها را بدون باز کردن wrapperهای تودرتو بخواند.
- `security` رأی سطح بالای ClawScan/security است. خودکارسازی باید بر اساس `ok`، `decision`، `reasons`، و `security.status` عمل کند.
- `security.signals` شامل شواهد پشتیبان اسکنر مانند `staticScan`، `virusTotal`، و `skillSpector` است.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- `provenance` فقط زمانی `server-resolved-github-import` است که ClawHub هنگام انتشار یا واردسازی، repo/ref/commit/path گیت‌هاب را حل و ذخیره کرده باشد؛ در غیر این صورت `unavailable` است.

### `POST /api/v1/skills/-/security-verdicts`

رأی‌های امنیتی فشرده فعلی را برای نسخه‌های دقیق skill برمی‌گرداند. این
نقطه پایانی مجموعه برای کلاینت‌هایی در نظر گرفته شده است که از قبل می‌دانند کدام نسخه‌های نصب‌شده
skill در ClawHub را باید نمایش دهند، مانند OpenClaw Control UI.

درخواست:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

نکات:

- `items` باید شامل 1 تا 100 جفت یکتای `{ slug, version }` باشد.
- نتایج به‌ازای هر مورد هستند؛ یک skill یا نسخه گمشده کل پاسخ را ناموفق نمی‌کند.
- پاسخ فقط امنیتی است. داده Skill Card، وضعیت کارت تولیدشده، فهرست فایل‌های artifact، یا محموله‌های تفصیلی اسکنر را شامل نمی‌شود.
- `security.signals` فقط شامل شواهد پشتیبان در سطح وضعیت است؛ برای جزئیات کامل اسکنر از `/scan` یا صفحه security-audit در ClawHub استفاده کنید.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- نبود Skill Card بر `ok`، `decision`، یا `reasons` این نقطه پایانی اثر نمی‌گذارد؛ کلاینت‌ها زمانی که به محتوای کارت نیاز دارند باید `skill-card.md` نصب‌شده را به‌صورت محلی بخوانند.
- وقتی به پوش تأیید Skill Card برای یک skill واحد نیاز دارید از `/verify` استفاده کنید، وقتی به markdown کارت تولیدشده نیاز دارید از `/card` استفاده کنید، و وقتی به داده تفصیلی اسکنر نیاز دارید از `/scan` استفاده کنید.

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

یادداشت‌ها:

- به‌طور پیش‌فرض از آخرین نسخه استفاده می‌شود.
- محدودیت اندازه فایل: 200KB.

### `GET /api/v1/packages`

نقطه پایانی کاتالوگ یکپارچه برای:

- Skills
- Pluginهای کد
- Pluginهای بسته‌ای

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended`، `trending`، `downloads`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins`، یا نقاط پایانی بسته با
  `family=code-plugin`/`family=bundle-plugin`). دسته‌بندی‌های کنترل‌شده و
  نام‌های مستعار فیلتر v1 قدیمی در زیر `GET /api/v1/plugins` مستند شده‌اند.

یادداشت‌ها:

- مقدارهای نامعتبر برای `family`، `channel`، `isOfficial`، `featured`،
  `highlightedOnly`، یا `sort` کد `400` برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار با family ثابت باقی می‌مانند.
- ورودی‌های Skill همچنان با رجیستری Skill پشتیبانی می‌شوند و هنوز فقط از طریق `POST /api/v1/skills` قابل انتشار هستند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخوانندگان ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخوانندگان احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند، در نتایج فهرست/جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/packages/search`

جست‌وجوی کاتالوگ یکپارچه در Skills + بسته‌های Plugin.

پارامترهای پرس‌وجو:

- `q` (الزامی): رشته پرس‌وجو
- `limit` (اختیاری): عدد صحیح (1–100)
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد. دسته‌بندی‌های کنترل‌شده و نام‌های مستعار
  فیلتر v1 قدیمی در زیر `GET /api/v1/plugins` مستند شده‌اند.

یادداشت‌ها:

- مقدارهای نامعتبر برای `family`، `channel`، `isOfficial`، `featured`، یا
  `highlightedOnly` کد `400` برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- فراخوانندگان ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخوانندگان احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/plugins`

مرور کاتالوگ فقط Plugin در سراسر بسته‌های code-plugin و bundle-plugin.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `recommended` (پیش‌فرض)، `trending`، `downloads`، `updated`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقادیر فعلی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نام‌های مستعار فیلتر v1 قدیمی همچنان در نقاط پایانی خواندن پذیرفته می‌شوند:

- `mcp-tooling`، `data` و `automation` به `tools` resolve می‌شوند.
- `observability` و `deployment` به `gateway` resolve می‌شوند.
- `dev-tools` به `runtime` resolve می‌شود.

`trending` جدول رتبه‌بندی نصب/دانلود هفت‌روزه است و از مجموع‌های تمام‌زمان استفاده نمی‌کند.
در نقطه پایانی یکپارچه `/api/v1/packages` فقط مخصوص Plugin است؛ برای کاتالوگ Skill از
`/api/v1/skills?sort=trending` استفاده کنید.

نام‌های مستعار قدیمی به‌عنوان مقادیر دسته‌بندی ذخیره‌شده یا اعلام‌شده توسط نویسنده پذیرفته نمی‌شوند.

### `GET /api/v1/skills/export`

خروجی‌گیری انبوه از آخرین Skills عمومی برای تحلیل آفلاین.

احراز هویت:

- توکن API لازم است.

پارامترهای پرس‌وجو:

- `startDate` (الزامی): کران پایین بر حسب میلی‌ثانیه یونیکس برای `updatedAt` Skill.
- `endDate` (الزامی): کران بالا بر حسب میلی‌ثانیه یونیکس برای `updatedAt` Skill.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی از پاسخ قبلی.

پاسخ:

- بدنه: آرشیو ZIP.
- هر Skill خروجی‌گرفته‌شده در `{publisher}/{slug}/` ریشه دارد.
- Skillهای میزبانی‌شده شامل فایل‌های آخرین نسخه ذخیره‌شده هستند و در
  `_manifest.json` با `sourceRef: "public-clawhub"` فهرست می‌شوند.
- Skillهای فعلی مبتنی بر GitHub با اسکن `clean` یا `suspicious` شامل
  `_source_handoff.json` با `sourceRef: "public-github"`، مخزن، commit، مسیر،
  هش محتوا، و URL آرشیو هستند. آن‌ها شامل فایل‌های منبع میزبانی‌شده در ClawHub نیستند.
- هر Skill شامل `_export_skill_meta.json` است.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- وقتی Skillها یا فایل‌های جداگانه قابل خروجی‌گیری نباشند،
  `_errors.json` گنجانده می‌شود.

سرآیندها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

صدور انبوه آخرین انتشارهای عمومی Plugin برای تحلیل آفلاین.

احراز هویت:

- توکن API لازم است.

پارامترهای پرس‌وجو:

- `startDate` (الزامی): کران پایین Unix بر حسب میلی‌ثانیه برای `updatedAt` مربوط به Plugin.
- `endDate` (الزامی): کران بالای Unix بر حسب میلی‌ثانیه برای `updatedAt` مربوط به Plugin.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.
- `family` (اختیاری): `code-plugin` یا `bundle-plugin`. حذف آن یعنی هر دو
  خانواده Plugin.

پاسخ:

- بدنه: آرشیو ZIP.
- ریشه هر Plugin صادرشده در `{family}/{packageName}/` قرار دارد.
- هر Plugin صادرشده شامل فایل‌های ذخیره‌شده آخرین انتشار است.
- فراداده صدور هر Plugin در
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` ذخیره می‌شود.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- `_errors.json` زمانی گنجانده می‌شود که Pluginها یا فایل‌های جداگانه قابل
  صدور نبوده باشند.

سرآیندها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

جست‌وجوی فقط Plugin در بسته‌های code-plugin و bundle-plugin.

پارامترهای پرس‌وجو:

- `q` (الزامی): رشته پرس‌وجو
- `limit` (اختیاری): عدد صحیح (1-100)
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقادیر فعلی:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

یادداشت‌ها:

- نام‌های مستعار فیلتر v1 قدیمی که زیر `GET /api/v1/plugins` مستند شده‌اند نیز
  پذیرفته می‌شوند.
- فیلتر کردن دسته‌بندی یک فیلتر واقعی API است که با ردیف‌های digest دسته‌بندی Plugin
  پشتیبانی می‌شود، نه بازنویسی پرس‌وجوی جست‌وجو.
- نتایج به ترتیب ارتباط بازگردانده می‌شوند و در حال حاضر صفحه‌بندی نمی‌شوند.
- کنترل‌های مرتب‌سازی رابط کاربری مرورگر برای جست‌وجوی Plugin نتایج ارتباط بارگذاری‌شده را دوباره مرتب می‌کنند،
  مطابق با رفتار مرور فعلی `/skills`.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را برمی‌گرداند.

یادداشت‌ها:

- Skills نیز می‌توانند در کاتالوگ یکپارچه از طریق این مسیر resolve شوند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر آنکه فراخواننده بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.

یادداشت‌ها:

- به توکن API برای مالک بسته، مالک/مدیر ناشر سازمانی،
  ناظر پلتفرم، یا مدیر پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه‌ها را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

یادداشت‌ها:

- بسته‌های خصوصی `404` برمی‌گردانند، مگر آنکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را، شامل فراداده فایل، سازگاری،
راستی‌آزمایی، فراداده آرتیفکت، و داده‌های اسکن، برمی‌گرداند.

یادداشت‌ها:

- `version.artifact.kind` برای آرشیوهای بسته قدیمی `legacy-zip` است یا
  برای انتشارهای مبتنی بر ClawPack مقدار `npm-pack` دارد.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum`، و
  `npmTarballName` هستند.
- `version.sha256hash` فراداده سازگاری منسوخ برای کلاینت‌های قدیمی است. این مقدار
  دقیقاً بایت‌های ZIP بازگردانده‌شده توسط `/api/v1/packages/{name}/download` را هش می‌کند.
  کلاینت‌های مدرن باید از `version.artifact.sha256` استفاده کنند که آرتیفکت
  انتشار کانونی را شناسایی می‌کند.
- `version.vtAnalysis`، `version.llmAnalysis`، و `version.staticScan` زمانی
  گنجانده می‌شوند که داده اسکن وجود داشته باشد.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر آنکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصه دقیق امنیت و اعتماد انتشار بسته را برای کلاینت‌های نصب برمی‌گرداند. این
سطح مصرف عمومی OpenClaw برای تصمیم‌گیری درباره امکان نصب یک انتشار
resolve‌شده است.

احراز هویت:

- نقطه پایانی خواندن عمومی. هیچ توکن مالک، ناشر، ناظر، یا مدیر
  لازم نیست.

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

- `package.name`، `package.displayName`، و `package.family` بسته رجیستری
  resolve‌شده را شناسایی می‌کنند.
- `release.releaseId`، `release.version`، و `release.createdAt`
  انتشار دقیقی را که ارزیابی شده است شناسایی می‌کنند.
- `release.artifactKind`، `release.artifactSha256`، `release.npmIntegrity`,
  `release.npmShasum`، و `release.npmTarballName` زمانی وجود دارند که برای
  آرتیفکت انتشار شناخته‌شده باشند.
- `trust.scanStatus` وضعیت اعتماد مؤثر است که از ورودی‌های اسکنر
  و نظارت دستی انتشار مشتق می‌شود.
- `trust.moderationState` تهی‌پذیر است. وقتی هیچ نظارت دستی انتشار
  وجود نداشته باشد، مقدار آن `null` است.
- `trust.blockedFromDownload` سیگنال مسدودسازی نصب است. OpenClaw و سایر
  کلاینت‌های نصب باید زمانی که این مقدار `true` است نصب را مسدود کنند، به‌جای آنکه
  قواعد مسدودسازی را دوباره از فیلدهای اسکنر یا نظارت استنتاج کنند.
- `trust.reasons` فهرست توضیح کاربرمحور و ممیزی است. کدهای دلیل
  رشته‌هایی پایدار و فشرده مانند `manual:quarantined`، `scan:malicious`،
  و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد هنوز در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصه اعتماد از ورودی‌های قدیمی محاسبه شده است و
  پیش از تصمیم اجازه با اطمینان بالا باید نیازمند تازه‌سازی تلقی شود.

یادداشت‌ها:

- این نقطه پایانی دقیقاً وابسته به نسخه است. کلاینت‌ها باید پس از resolve کردن
  نسخه بسته‌ای که قصد نصب آن را دارند آن را فراخوانی کنند، نه صرفاً پس از خواندن آخرین
  فراداده بسته.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر آنکه فراخواننده بتواند ناشر مالک را بخواند.
- این نقطه پایانی عمداً از نقاط پایانی نظارت مالک/ناظر محدودتر است.
  تصمیم نصب و توضیح عمومی را افشا می‌کند، نه هویت گزارش‌دهندگان،
  بدنه گزارش‌ها، شواهد خصوصی، یا جدول‌های زمانی بررسی داخلی.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده resolver آرتیفکت صریح را برای یک نسخه بسته برمی‌گرداند.

یادداشت‌ها:

- نسخه‌های بسته قدیمی یک آرتیفکت `legacy-zip` و یک `downloadUrl` قدیمی ZIP
  برمی‌گردانند.
- نسخه‌های ClawPack یک آرتیفکت `npm-pack`، فیلدهای integrity مربوط به npm، یک
  `tarballUrl`، و URL سازگاری ZIP قدیمی را برمی‌گردانند.
- این سطح resolver مربوط به OpenClaw است؛ از حدس زدن قالب آرشیو بر اساس
  یک URL مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

آرتیفکت نسخه را از طریق مسیر resolver صریح دانلود می‌کند.

یادداشت‌ها:

- نسخه‌های ClawPack دقیقاً بایت‌های `.tgz` مربوط به npm-pack بارگذاری‌شده را stream می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` هدایت می‌شوند.
- از bucket نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آینده OpenClaw را برمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر است:

- وضعیت کانال رسمی
- دسترس‌پذیری آخرین نسخه
- دسترس‌پذیری آرتیفکت npm-pack مربوط به ClawPack
- digest آرتیفکت
- منشأ مخزن منبع و commit
- فراداده سازگاری OpenClaw
- هدف‌های میزبان
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

نقطه پایانی ناظر برای فهرست کردن ردیف‌های مهاجرت Plugin رسمی OpenClaw.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای پرس‌وجو:

- `phase` (اختیاری): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, یا
  `all` (پیش‌فرض).
- `limit` (اختیاری): عدد صحیح (1-100)
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

نقطه پایانی مدیر برای ایجاد یا به‌روزرسانی یک ردیف مهاجرت Plugin رسمی.

احراز هویت:

- به توکن API برای کاربر مدیر نیاز دارد.

بدنه درخواست:

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

یادداشت‌ها:

- `bundledPluginId` به حروف کوچک نرمال‌سازی می‌شود و کلید upsert پایدار است.
- `packageName` به نام npm نرمال‌سازی می‌شود؛ بسته می‌تواند برای مهاجرت‌های برنامه‌ریزی‌شده
  وجود نداشته باشد.
- این فقط آمادگی مهاجرت را پیگیری می‌کند. OpenClaw را تغییر نمی‌دهد یا
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

نقطه پایانی ناظر/مدیر برای صف‌های بررسی انتشار بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای پرس‌وجو:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

معانی وضعیت:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، باطل‌شده، یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، باطل‌شده، یا مخرب.
- `manual`: هر انتشار با override نظارت دستی.
- `all`: هر انتشار با override دستی، وضعیت اسکن غیرتمیز، یا گزارش بسته.

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

یک بسته را برای بررسی ناظر گزارش می‌کند. گزارش‌ها در سطح بسته هستند و به‌صورت اختیاری
به یک نسخه پیوند می‌خورند. آن‌ها صف نظارت را تغذیه می‌کنند اما به‌خودی‌خود
دانلودها را پنهان یا مسدود نمی‌کنند؛ ناظران باید از نظارت انتشار برای
تأیید، قرنطینه، یا ابطال آرتیفکت‌ها استفاده کنند.

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

نقطهٔ پایانی مدیر/ناظر برای دریافت گزارش‌های بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای پرس‌وجو:

- `status` (اختیاری): `open` (پیش‌فرض)، `confirmed`، `dismissed`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
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

نقطهٔ پایانی مالک/ناظر برای مشاهده‌پذیری نظارت بسته.

احراز هویت:

- به توکن API برای مالک بسته، عضو ناشر، ناظر، یا
  کاربر مدیر نیاز دارد.

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

نقطهٔ پایانی ناظر/مدیر برای حل‌وفصل یا بازگشایی گزارش‌های بسته.

درخواست:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام تنظیم دوبارهٔ
`status` به `open` می‌تواند حذف شود. برای اعمال نظارت انتشار در همان
گردش‌کار قابل ممیزی، همراه با گزارش تأییدشده `finalAction: "quarantine"` یا
`finalAction: "revoke"` را ارسال کنید.

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

نقطهٔ پایانی ناظر/مدیر برای بازبینی انتشار بسته.

درخواست:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

وضعیت‌های پشتیبانی‌شده:

- `approved`: به‌صورت دستی بازبینی و مجاز شده است.
- `quarantined`: تا زمان پیگیری مسدود شده است.
- `revoked`: پس از آنکه قبلاً به یک انتشار اعتماد شده بود، مسدود شده است.

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود مصنوع `403` برمی‌گردانند.
هر تغییر یک ورودی گزارش ممیزی می‌نویسد.

### `GET /api/v1/packages/{name}/file`

محتوای متنی خام را برای یک فایل بسته برمی‌گرداند.

پارامترهای پرس‌وجو:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض، آخرین انتشار است.
- از سطل نرخ خواندن استفاده می‌کند، نه سطل دانلود.
- فایل‌های دودویی `415` برمی‌گردانند.
- محدودیت اندازهٔ فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن‌ها را مسدود نمی‌کنند؛ انتشارهای مخرب ممکن است همچنان در جای دیگری نگه داشته شوند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای انتشار یک بسته دانلود می‌کند.

پارامترهای پرس‌وجو:

- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض، آخرین انتشار است.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشهٔ `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP می‌ماند. فایل‌های ClawPack با پسوند `.tgz` را جریانی نمی‌کند.
- پاسخ‌ها سرآیندهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` را برای بررسی‌های یکپارچگی حل‌کننده شامل می‌شوند.
- فرادادهٔ فقط-رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک packument سازگار با npm را برای نسخه‌های بستهٔ مبتنی بر ClawPack برمی‌گرداند.

نکته‌ها:

- فقط نسخه‌هایی فهرست می‌شوند که tarballهای ClawPack npm-pack بارگذاری‌شده دارند.
- نسخه‌های قدیمی فقط-ZIP عمداً حذف می‌شوند.
- `dist.tarball`، `dist.integrity`، و `dist.shasum` از فیلدهای سازگار با npm
  استفاده می‌کنند تا کاربران در صورت تمایل بتوانند npm را به آینه اشاره دهند.
- packumentهای بستهٔ scoped هم مسیر درخواست `/api/npm/@scope/name` و هم مسیر
  کدگذاری‌شدهٔ npm یعنی `/api/npm/@scope%2Fname` را پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball بارگذاری‌شدهٔ ClawPack را برای کلاینت‌های آینهٔ npm جریانی می‌کند.

نکته‌ها:

- از سطل نرخ دانلود استفاده می‌کند.
- سرآیندهای دانلود شامل SHA-256 ClawHub به‌همراه فرادادهٔ integrity/shasum مربوط به npm هستند.
- بررسی‌های نظارت و دسترسی به بستهٔ خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

CLI از آن برای نگاشت یک اثرانگشت محلی به یک نسخهٔ شناخته‌شده استفاده می‌کند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `hash` (الزامی): sha256 شانزده‌شانزدهی 64 نویسه‌ای از اثرانگشت bundle

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک نسخهٔ ZIP میزبانی‌شدهٔ skill را دانلود می‌کند، یا برای یک skill فعلی مبتنی بر GitHub
که اسکن `clean` یا `suspicious` دارد و نسخهٔ میزبانی‌شده ندارد، واگذاری منبع GitHub برمی‌گرداند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `version` (اختیاری): رشتهٔ semver
- `tag` (اختیاری): نام برچسب (مثلاً `latest`)

نکته‌ها:

- اگر نه `version` و نه `tag` ارائه نشده باشد، آخرین نسخه استفاده می‌شود.
- نسخه‌های soft-deleted مقدار `410` برمی‌گردانند.
- واگذاری‌های skill مبتنی بر GitHub بایت‌ها را proxy یا mirror نمی‌کنند. پاسخ JSON
  شامل `sourceRef: "public-github"`، `repo`، `commit`، `path`، `contentHash`،
  و `archiveUrl` است؛ وضعیت اسکن/فعلی یک gate است و به‌عنوان فرادادهٔ payload موفقیت
  درج نمی‌شود.
- آمار دانلود به‌صورت هویت‌های یکتا در هر روز UTC شمرده می‌شود (`userId` وقتی توکن API معتبر است، وگرنه IP).

## نقاط پایانی احراز هویت (Bearer token)

همهٔ نقاط پایانی نیاز دارند به:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

توکن را اعتبارسنجی می‌کند و handle کاربر را برمی‌گرداند.

### `POST /api/v1/skills`

نسخهٔ جدیدی را منتشر می‌کند.

- ترجیحی: `multipart/form-data` با JSON در `payload` + blobهای `files[]`.
- بدنهٔ JSON با `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، API آن
  ناشر را سمت سرور resolve می‌کند و نیاز دارد actor دسترسی ناشر داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` مقدار `true` باشد،
  یک skill موجود ممکن است به آن مالک منتقل شود، اگر actor روی ناشران
  فعلی و هدف admin/owner باشد. بدون این opt-in، تغییرات مالک
  رد می‌شوند.

### `POST /api/v1/packages`

انتشار یک code-plugin یا bundle-plugin را منتشر می‌کند.

- به احراز هویت Bearer token نیاز دارد.
- به `multipart/form-data` نیاز دارد.
- فیلدهای مجاز فرم `payload`، blobهای تکرارشوندهٔ `files`، یا یک ارجاع tarball
  با نام `clawpack` هستند. `clawpack` می‌تواند یک blob با پسوند `.tgz` یا یک storage id برگردانده‌شده توسط
  جریان upload-url باشد. انتشارهای storage-id مرحله‌بندی‌شده همچنین باید
  `clawpackUploadTicket` برگردانده‌شده با آن URL بارگذاری را شامل شوند.
- یا از `files` استفاده کنید یا از `clawpack`، هرگز هر دو را در یک درخواست.
- بدنه‌های JSON و فرادادهٔ `payload.files` / `payload.artifact`
  ارائه‌شده توسط فراخواننده رد می‌شوند.
- درخواست‌های انتشار مستقیم multipart در 18MB سقف دارند. tarballهای ClawPack می‌توانند
  از جریان upload-url تا سقف tarball برابر با 120MB استفاده کنند.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، فقط مدیران می‌توانند از طرف آن مالک منتشر کنند.

نکات برجستهٔ اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های ClawPack `.tgz` باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- code pluginها به `package.json`، فرادادهٔ repo منبع، فرادادهٔ commit منبع،
  فرادادهٔ schema پیکربندی، `openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فرادادهٔ اختیاری هستند.
- فقط ناشر org با نام `openclaw` و ناشران شخصی اعضای فعلی org با نام `openclaw`
  می‌توانند در کانال `official` منتشر کنند.
- انتشارهای از-طرف همچنان شایستگی کانال رسمی را نسبت به حساب مالک هدف اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

soft-delete / بازیابی یک skill (مالک، ناظر، یا مدیر).

بدنهٔ JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

وقتی وجود داشته باشد، `reason` به‌عنوان یادداشت نظارت skill ذخیره و در گزارش ممیزی کپی می‌شود.
soft deleteهای آغازشده توسط مالک، slug را برای 30 روز رزرو می‌کنند، سپس slug می‌تواند توسط
ناشر دیگری ادعا شود. وقتی این انقضا اعمال شود، پاسخ حذف شامل `slugReservedUntil` است.
پنهان‌سازی‌های ناظر/مدیر و حذف‌های امنیتی به این شکل منقضی نمی‌شوند.

پاسخ حذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

کدهای وضعیت:

- `200`: ok
- `401`: unauthorized
- `403`: forbidden
- `404`: skill/user not found
- `500`: internal server error

### `POST /api/v1/users/publisher`

فقط مدیر. تضمین می‌کند یک ناشر org برای یک handle وجود داشته باشد. اگر handle همچنان به یک
کاربر مشترک قدیمی/ناشر شخصی اشاره کند، نقطهٔ پایانی ابتدا آن را به یک ناشر org مهاجرت می‌دهد.
برای یک org تازه‌ساخته‌شده، `memberHandle` را ارائه کنید؛ مدیر اجراکننده به‌عنوان عضو افزوده نمی‌شود.
`memberRole` به‌طور پیش‌فرض `owner` است.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

ایجاد ناشر org به‌صورت self-serve برای کاربر احراز هویت‌شده. یک ناشر org جدید ایجاد می‌کند و
فراخواننده را به‌عنوان مالک اضافه می‌کند. این نقطهٔ پایانی handleهای کاربر/شخصی موجود را مهاجرت نمی‌دهد و
ناشر را trusted/official علامت‌گذاری نمی‌کند.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- وقتی handle از قبل توسط یک ناشر، کاربر، یا ناشر شخصی استفاده شده باشد، `409` برمی‌گرداند.

### `POST /api/v1/users/reserve`

فقط مدیر. slugهای ریشه و نام‌های بسته را برای مالک برحق بدون انتشار یک
release رزرو می‌کند. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف release تبدیل می‌شوند، بنابراین همان
مالک می‌تواند بعداً انتشار واقعی code-plugin یا bundle-plugin را در آن نام منتشر کند.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

فقط مدیر. یک ناشر شخصی را برای principal جایگزین و تأییدشدهٔ GitHub OAuth
بدون ویرایش ردیف‌های حساب Convex Auth بازیابی می‌کند. درخواست باید هر دو شناسهٔ تغییرناپذیر
حساب ارائه‌دهندهٔ GitHub را نام ببرد؛ handleهای تغییرپذیر فقط به‌عنوان نگهبان رو به اپراتور استفاده می‌شوند.

نقطهٔ پایانی به‌طور پیش‌فرض روی dry-run تنظیم است. اعمال بازیابی، پس از آن‌که کارکنان به‌طور مستقل پیوستگی میان هر دو
اصل GitHub را تأیید کردند، به `dryRun: false` و
`confirmIdentityVerified: true` نیاز دارد. اگر ناشر شخصی فعلی کاربر مقصد
skills، بسته‌ها، یا منابع skill در GitHub داشته باشد، بازیابی به‌صورت fail-closed شکست می‌خورد.
بازیابی همچنین فیلدهای قدیمی `ownerUserId` را برای skills ناشر بازیابی‌شده،
نام‌های مستعار slug مربوط به skill، بسته‌ها، هشدارهای بازرس بسته، و ردیف‌های مشتق‌شدهٔ digest جست‌وجو مهاجرت می‌دهد تا
مسیرهای مالک مستقیم با اختیار ناشر جدید هم‌خوان شوند. یک رزرو protected-handle فعال
برای handle بازیابی‌شده نیز به کاربر جایگزین بازاختصاص داده می‌شود تا همگام‌سازی بعدی
نمایه نتواند اختیار رقیبِ کاربر پیشین را بازگرداند. هر جدول اصلی در هر تراکنش اعمال به
۱۰۰ ردیف محدود است؛ بازیابی‌های بزرگ‌تر باید ابتدا از یک مهاجرت مالک قابل‌ازسرگیری استفاده کنند.
منابع skill در GitHub وابسته به ناشر هستند و به‌جای بازنویسی، به‌صورت بررسی‌شده گزارش می‌شوند.

- بدنه: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- پاسخ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقطه‌های پایانی مدیریت slug مالک

- `POST /api/v1/skills/{slug}/rename`
  - بدنه: `{ "newSlug": "new-canonical-slug" }`
  - پاسخ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - بدنه: `{ "targetSlug": "canonical-target-slug" }`
  - پاسخ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

یادداشت‌ها:

- هر دو نقطهٔ پایانی به احراز هویت با توکن API نیاز دارند و فقط برای مالک skill کار می‌کنند.
- `rename`، slug قبلی را به‌عنوان نام مستعار تغییرمسیر حفظ می‌کند.
- `merge` فهرست مبدأ را پنهان می‌کند و slug مبدأ را به فهرست مقصد تغییرمسیر می‌دهد.

### نقطه‌های پایانی انتقال مالکیت

- `POST /api/v1/skills/{slug}/transfer`
  - بدنه: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - پاسخ: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - پاسخ (پذیرش/رد/لغو): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - شکل پاسخ: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

مسدود کردن یک کاربر و حذف سخت skills تحت مالکیت او (فقط مدیر ناظر/مدیر).

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

رفع مسدودی یک کاربر و بازیابی skills واجد شرایط (فقط مدیر).

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

تغییر دلیل ذخیره‌شده برای یک مسدودی موجود، بدون رفع مسدودی یا بازیابی
محتوا (فقط مدیر). مگر آن‌که `dryRun` برابر `false` باشد، به‌طور پیش‌فرض dry-run است.

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

فهرست کردن یا جست‌وجوی کاربران (فقط مدیر).

پارامترهای query:

- `q` (اختیاری): query جست‌وجو
- `query` (اختیاری): نام مستعار برای `q`
- `limit` (اختیاری): بیشینهٔ نتایج (پیش‌فرض ۲۰، بیشینه ۲۰۰)

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

افزودن/حذف یک ستاره (برجسته‌سازی‌ها). هر دو نقطهٔ پایانی idempotent هستند.

پاسخ‌ها:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقطه‌های پایانی CLI قدیمی (منسوخ‌شده)

همچنان برای نسخه‌های قدیمی‌تر CLI پشتیبانی می‌شود:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

برای برنامهٔ حذف، `DEPRECATIONS.md` را ببینید.

`POST /api/cli/upload-url` مقدارهای `uploadUrl` و `uploadTicket` را برمی‌گرداند. انتشارهای بسته‌ای
که یک tarball از ClawPack را مرحله‌بندی می‌کنند، باید شناسهٔ storage حاصل را به‌عنوان
`clawpack` و ticket برگشتی را به‌عنوان `clawpackUploadTicket` ارسال کنند.

## کشف رجیستری (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات رجیستری/احراز هویت را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر خودتان میزبانی می‌کنید، این فایل را سرو کنید (یا `CLAWHUB_REGISTRY` را صریحاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی).
