---
read_when:
    - افزودن/تغییر endpoints
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API HTTP (نقاط پایانی عمومی + CLI + احراز هویت).
x-i18n:
    generated_at: "2026-07-01T13:11:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

نشانی پایه: `https://clawhub.ai` (پیش‌فرض).

همه مسیرهای v1 زیر `/api/v1/...` هستند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی می‌مانند (به `DEPRECATIONS.md` مراجعه کنید).
OpenAPI: `/api/v1/openapi.json`.

## استفاده دوباره از کاتالوگ عمومی

دایرکتوری‌های شخص ثالث می‌توانند از نقاط پایانی خواندن عمومی برای فهرست‌کردن یا جست‌وجوی Skills در ClawHub استفاده کنند. لطفا نتایج را کش کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست رسمی ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) برگردانید، و از القای تایید سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای پنهان، خصوصی، یا مسدودشده توسط نظارت را خارج از سطح API عمومی بازتاب دهید.

میان‌برهای slug وب در خانواده‌های رجیستری resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی اولویت مسیرها، از URLهای رسمی برگشتی توسط نقاط پایانی خواندن استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال محدودیت:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (توکن Bearer معتبر): به‌ازای باکت هر کاربر اعمال می‌شود.
- اگر توکن وجود نداشته باشد یا نامعتبر باشد، رفتار به اعمال محدودیت بر پایه IP برمی‌گردد.
- نقاط پایانی نوشتن احراز هویت‌شده وقتی سرور دلیل را می‌داند نباید فقط یک `Unauthorized` خالی برگردانند. توکن‌های مفقود، توکن‌های نامعتبر/باطل‌شده، و حساب‌های حذف‌شده/مسدودشده/غیرفعال‌شده باید هرکدام متن قابل‌اقدامی دریافت کنند تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی مانع آن‌ها شده است.

- خواندن: 3000/min به‌ازای هر IP، 12000/min به‌ازای هر کلید
- نوشتن: 300/min به‌ازای هر IP، 3000/min به‌ازای هر کلید
- دانلود: 1200/min به‌ازای هر IP، 6000/min به‌ازای هر کلید (نقاط پایانی دانلود)

هدرها:

- سازگاری قدیمی: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`، `RateLimit-Reset`
- در `429`: `X-RateLimit-Remaining: 0` و `RateLimit-Remaining: 0`
- در `429`: `Retry-After`

معنای هدرها:

- `X-RateLimit-Reset`: ثانیه‌های مطلق epoch یونیکس
- `RateLimit-Reset`: ثانیه تا بازنشانی (تاخیر)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجه باقی‌مانده دقیق، وقتی وجود داشته باشد.
  درخواست‌های موفق shardشده به‌جای برگرداندن مقدار جهانی تقریبی، این هدر را حذف می‌کنند.
- `Retry-After`: تعداد ثانیه‌هایی که باید پیش از تلاش دوباره منتظر ماند (تاخیر) در `429`

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

- اگر `Retry-After` وجود دارد، پیش از تلاش دوباره همان تعداد ثانیه منتظر بمانید.
- برای جلوگیری از تلاش‌های دوباره هم‌زمان، از backoff با jitter استفاده کنید.
- اگر `Retry-After` وجود ندارد، به `RateLimit-Reset` برگردید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- فقط زمانی از هدرهای IP کلاینت مورداعتماد، از جمله `cf-connecting-ip`، استفاده می‌کند که استقرار به‌طور صریح هدرهای forwarded مورداعتماد را فعال کرده باشد.
- ClawHub از هدرهای forwarding مورداعتماد برای شناسایی IPهای کلاینت در edge استفاده می‌کند.
- اگر IP کلاینت مورداعتمادی در دسترس نباشد، درخواست‌های ناشناس از باکت‌های جایگزین استفاده می‌کنند که فقط بر اساس نوع محدودیت نرخ scoped شده‌اند. این باکت‌های جایگزین مسیرهای ارائه‌شده توسط فراخواننده، slugها، نام بسته‌ها، نسخه‌ها، رشته‌های query، یا سایر پارامترهای artifact را شامل نمی‌شوند.

## پاسخ‌های خطا

پاسخ‌های خطای عمومی v1 متن ساده با `content-type: text/plain; charset=utf-8` هستند.
این شامل شکست‌های اعتبارسنجی (`400`)، منابع عمومی مفقود (`404`)، شکست‌های احراز هویت و مجوز (`401`/`403`)، محدودیت‌های نرخ (`429`)، و دانلودهای مسدودشده است. کلاینت‌ها باید بدنه پاسخ را به‌عنوان یک رشته خوانا برای انسان بخوانند. پارامترهای query ناشناخته برای سازگاری نادیده گرفته می‌شوند، اما پارامترهای query شناخته‌شده با مقدار نامعتبر `400` برمی‌گردانند.

## نقاط پایانی عمومی (بدون احراز هویت)

### `GET /api/v1/search`

پارامترهای query:

- `q` (الزامی): رشته query
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): `true` برای فیلترکردن به Skills برجسته‌شده
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن Skills مشکوک (`flagged.suspicious`)
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

- نتایج به ترتیب ارتباط برگردانده می‌شوند (شباهت embedding + تقویت token دقیق slug/name + یک prior محبوبیت کوچک).
- ارتباط از محبوبیت قوی‌تر است. یک تطابق دقیق token برای slug یا display-name می‌تواند از یک تطابق آزادتر با درگیری بسیار قوی‌تر رتبه بالاتری بگیرد.
- متن ASCII بر اساس مرزهای کلمه و نشانه‌گذاری tokenسازی می‌شود. برای مثال، `personal-map` یک token مستقل `map` دارد، در حالی که `amap-jsapi-skill` شامل `amap`، `jsapi`، و `skill` است؛ بنابراین جست‌وجوی `map` به `personal-map` تطابق واژگانی قوی‌تری نسبت به `amap-jsapi-skill` می‌دهد.
- محبوبیت با log مقیاس‌بندی و سقف‌گذاری می‌شود. Skills با درگیری بالا وقتی متن query تطابق ضعیف‌تری دارد می‌توانند رتبه پایین‌تری بگیرند.
- وضعیت نظارتی مشکوک یا پنهان می‌تواند بسته به فیلترهای فراخواننده و وضعیت فعلی نظارت، یک Skill را از جست‌وجوی عمومی حذف کند.

راهنمای قابل‌کشف‌بودن برای ناشر:

- اصطلاحاتی را که کاربران واقعا جست‌وجو خواهند کرد در نام نمایشی، خلاصه، و برچسب‌ها قرار دهید. فقط وقتی از یک token مستقل slug استفاده کنید که هویت پایداری نیز هست و می‌خواهید آن را حفظ کنید.
- فقط برای دنبال‌کردن یک query، slug را تغییر نام ندهید، مگر اینکه slug جدید نام رسمی بلندمدت بهتری باشد. slugهای قدیمی به نام‌های مستعار redirect تبدیل می‌شوند، اما URL رسمی، slug نمایش‌داده‌شده، و digestهای جست‌وجوی آینده از slug جدید استفاده می‌کنند.
- نام‌های مستعار تغییر نام، resolution را برای URLهای قدیمی و نصب‌هایی که از طریق رجیستری resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو پس از index شدن تغییر نام، بر پایه فراداده رسمی Skill است. آمار موجود با Skill باقی می‌ماند.
- اگر یک Skill به‌شکل غیرمنتظره‌ای نامرئی است، پیش از تغییر فراداده مرتبط با رتبه‌بندی، ابتدا وضعیت نظارت را با `clawhub inspect @owner/slug` در حالت واردشده بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended` (نام مستعار: `default`)، `createdAt` (نام مستعار: `newest`)، `downloads`، `stars` (نام مستعار: `rating`)، نام‌های مستعار نصب قدیمی `installsCurrent`/`installs`/`installsAllTime` به `downloads` map می‌شوند، `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن Skills مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): نام مستعار قدیمی برای `nonSuspiciousOnly`

مقادیر نامعتبر `sort`، `400` برمی‌گردانند.

نکته‌ها:

- `recommended` از سیگنال‌های درگیری و تازگی استفاده می‌کند.
- `trending` بر اساس نصب‌ها در 7 روز گذشته رتبه‌بندی می‌کند (مبتنی بر telemetry).
- `createdAt` برای crawlهای Skill جدید پایدار است؛ `updated` وقتی Skills موجود دوباره منتشر می‌شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` باشد، sortهای مبتنی بر cursor ممکن است در یک صفحه کمتر از `limit` مورد برگردانند، چون Skills مشکوک پس از بازیابی صفحه فیلتر می‌شوند.
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

نکته‌ها:

- slugهای قدیمی ایجادشده توسط جریان‌های تغییر نام/ادغام مالک به Skill رسمی resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter مربوط به Skill (مثلا `["macos"]`، `["linux"]`). اگر اعلام نشده باشد `null`.
- `metadata.systems`: هدف‌های سیستم Nix (مثلا `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد `null`.
- اگر Skill هیچ فراداده پلتفرمی نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط زمانی گنجانده می‌شود که Skill flag شده باشد یا مالک در حال مشاهده آن باشد.

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

نکته‌ها:

- مالکان و مدیران نظارت می‌توانند به جزئیات نظارت برای Skills پنهان دسترسی داشته باشند.
- فراخواننده‌های عمومی فقط برای Skills قابل‌مشاهده‌ای که از قبل flag شده‌اند `200` دریافت می‌کنند.
- evidence برای فراخواننده‌های عمومی redact می‌شود و فقط برای مالکان/مدیران نظارت شامل snippetهای خام است.

### `POST /api/v1/skills/{slug}/report`

گزارش یک Skill برای بازبینی مدیر نظارت. گزارش‌ها در سطح Skill هستند، به‌صورت اختیاری به یک نسخه پیوند می‌خورند، و صف گزارش Skill را تغذیه می‌کنند.

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

نقطه پایانی مدیر نظارت/ادمین برای دریافت گزارش‌های Skill.

پارامترهای query:

- `status` (اختیاری): `open` (پیش‌فرض)، `confirmed`، `dismissed`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-200)
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

نقطه پایانی مدیر نظارت/ادمین برای resolve کردن یا بازگشایی گزارش‌های Skill.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام تنظیم دوباره `status` به `open` می‌توان آن را حذف کرد. برای پنهان‌کردن Skill در همان workflow قابل‌ممیزی، `finalAction: "hide"` را همراه یک گزارش triageشده ارسال کنید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

فراداده نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` وضعیت تایید scan نرمال‌سازی‌شده و جزئیات scanner را، وقتی در دسترس باشد، شامل می‌شود
  (VirusTotal + LLM).

### `GET /api/v1/skills/{slug}/scan`

جزئیات تایید scan امنیتی برای یک نسخه Skill را برمی‌گرداند.

پارامترهای query:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): resolve کردن یک نسخه برچسب‌خورده (برای مثال `latest`).

نکته‌ها:

- اگر هیچ‌کدام از `version` یا `tag` ارائه نشود، از آخرین نسخه استفاده می‌کند.
- وضعیت تأیید نرمال‌سازی‌شده به‌همراه جزئیات ویژه اسکنر را شامل می‌شود.
- `security.hasScanResult` فقط زمانی `true` است که یک اسکنر رأی قطعی تولید کرده باشد (`clean`، `suspicious` یا `malicious`).
- `moderation` یک نمای لحظه‌ای فعلی از تعدیل در سطح مهارت است که از آخرین نسخه مشتق شده است.
- هنگام پرس‌وجوی یک نسخه تاریخی، پیش از اینکه `moderation` و `security` را در یک زمینه نسخه‌ای یکسان در نظر بگیرید، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

### `POST /api/v1/skills/-/scan`

نقطه پایانی ارسال احراز هویت‌شده برای کارهای جدید ClawScan.

اسکن‌های بارگذاری محلی دیگر پشتیبانی نمی‌شوند. درخواست‌هایی که از
`multipart/form-data` یا `{ "source": { "kind": "upload" } }` استفاده می‌کنند، `410` برمی‌گردانند.

اسکن‌های منتشرشده از JSON استفاده می‌کنند:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

یادداشت‌ها:

- بارهای درخواست اسکن و گزارش‌های قابل دانلود پس از بازه نگهداری از مخزن درخواست اسکن منقضی می‌شوند.
- اسکن‌های منتشرشده به دسترسی مدیریتی مالک/ناشر، یا اختیار ناظر/مدیر پلتفرم نیاز دارند.
- اسکن‌های منتشرشده فقط زمانی بازنویسی می‌کنند که `update: true` باشد و اسکن با موفقیت کامل شود.
- پاسخ `202` با `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` است.
- کارهای اسکن ناهمگام هستند. درخواست‌های اسکن دستی جلوتر از کارهای عادی انتشار/پرکردن معوقه اولویت‌بندی می‌شوند، اما تکمیل همچنان به دردسترس‌بودن worker بستگی دارد.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطه پایانی نظرسنجی احراز هویت‌شده برای یک اسکن ارسال‌شده.

- وضعیت در صف/در حال اجرا/موفق/ناموفق را برمی‌گرداند.
- هنگام در صف بودن، `queue.queuedAhead` و `queue.position` را برمی‌گرداند تا کلاینت‌ها بتوانند نشان دهند چند اسکن دستی اولویت‌دار جلوتر از درخواست قرار دارد. صف‌های بسیار بزرگ محدود می‌شوند و با `queuedAheadIsEstimate: true` گزارش می‌شوند.
- در صورت دردسترس بودن، `report` شامل بخش‌های `clawscan`، `skillspector`، `staticAnalysis` و `virustotal` است.
- کارهای اسکن ناموفق `status: "failed"` را همراه با `lastError` برمی‌گردانند.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطه پایانی آرشیو گزارش احراز هویت‌شده.

- به یک اسکن موفق نیاز دارد؛ اسکن‌های غیرنهایی `409` برمی‌گردانند.
- یک ZIP با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json` و `README.md` برمی‌گرداند.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطه پایانی آرشیو گزارش ذخیره‌شده احراز هویت‌شده برای نسخه‌های ارسال‌شده.

- به دسترسی مدیریتی مالک/ناشر به مهارت یا plugin، یا اختیار ناظر/مدیر پلتفرم نیاز دارد.
- نتایج اسکن ذخیره‌شده را برای نسخه دقیق ارسال‌شده، از جمله نسخه‌های مسدودشده یا پنهان، برمی‌گرداند.
- مقدار پیش‌فرض `kind` برابر `skill` است؛ برای اسکن‌های plugin/بسته از `kind=plugin` استفاده کنید.
- همان شکل ZIP دانلودهای درخواست اسکن را برمی‌گرداند.

### `POST /api/v1/skills/-/scan/batch`

مسیر بازاسکن دسته‌ای متعارف و فقط مخصوص مدیر. همان شکل بار `POST /api/v1/skills/-/rescan-batch` قدیمی را می‌پذیرد.

### `POST /api/v1/skills/-/scan/batch/status`

مسیر وضعیت دسته‌ای متعارف و فقط مخصوص مدیر. `{ "jobIds": ["..."] }` را می‌پذیرد و همان شمارنده‌های تجمیعی `POST /api/v1/skills/-/rescan-batch/status` قدیمی را برمی‌گرداند.

### `GET /api/v1/skills/{slug}/verify`

پاکت تأیید کارت مهارت را که توسط `clawhub skill verify` استفاده می‌شود برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): یک نسخه برچسب‌خورده را resolve می‌کند (برای مثال `latest`).

یادداشت‌ها:

- `ok` فقط زمانی `true` است که نسخه انتخاب‌شده کارت مهارت تولیدشده داشته باشد، توسط تعدیل به‌عنوان بدافزار مسدود نشده باشد، و تأیید ClawScan پاک باشد.
- هویت مهارت، هویت ناشر، و فراداده نسخه انتخاب‌شده فیلدهای سطح بالای پاکت هستند (`slug`، `displayName`، `publisherHandle`، `version`، `resolvedFrom`، `tag`، `createdAt`) تا اتوماسیون shell بتواند آن‌ها را بدون باز کردن wrapperهای تو در تو بخواند.
- `security` رأی سطح بالای ClawScan/امنیت است. اتوماسیون باید بر اساس `ok`، `decision`، `reasons` و `security.status` عمل کند.
- `security.signals` شامل شواهد پشتیبان اسکنر مانند `staticScan`، `virusTotal` و `skillSpector` است.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- `provenance` فقط زمانی `server-resolved-github-import` است که ClawHub هنگام انتشار یا وارد کردن، repo/ref/commit/path مربوط به GitHub را resolve و ذخیره کرده باشد؛ در غیر این صورت `unavailable` است.

### `POST /api/v1/skills/-/security-verdicts`

رأی‌های امنیتی فشرده فعلی را برای نسخه‌های دقیق مهارت برمی‌گرداند. این
نقطه پایانی مجموعه برای کلاینت‌هایی در نظر گرفته شده است که از قبل می‌دانند کدام
نسخه‌های مهارت ClawHub نصب‌شده را باید نمایش دهند، مانند OpenClaw Control UI.

درخواست:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

یادداشت‌ها:

- `items` باید شامل 1 تا 100 جفت یکتای `{ slug, version }` باشد.
- نتایج به‌ازای هر مورد هستند؛ نبود یک مهارت یا نسخه باعث شکست کل پاسخ نمی‌شود.
- پاسخ فقط امنیتی است. داده کارت مهارت، وضعیت کارت تولیدشده، فهرست فایل‌های artifact، یا بارهای تفصیلی اسکنر را شامل نمی‌شود.
- `security.signals` فقط شامل شواهد پشتیبان در سطح وضعیت است؛ برای جزئیات کامل اسکنر از `/scan` یا صفحه security-audit در ClawHub استفاده کنید.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- نبود کارت مهارت بر `ok`، `decision` یا `reasons` این نقطه پایانی اثر نمی‌گذارد؛ کلاینت‌ها وقتی به محتوای کارت نیاز دارند باید `skill-card.md` نصب‌شده را به‌صورت محلی بخوانند.
- زمانی از `/verify` استفاده کنید که به پاکت تأیید کارت مهارت برای یک مهارت نیاز دارید، زمانی از `/card` که به markdown کارت تولیدشده نیاز دارید، و زمانی از `/scan` که به داده تفصیلی اسکنر نیاز دارید.

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

محتوای متن خام را برمی‌گرداند.

پارامترهای کوئری:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌صورت پیش‌فرض از آخرین نسخه استفاده می‌کند.
- حد اندازه فایل: 200KB.

### `GET /api/v1/packages`

نقطه پایانی کاتالوگ یکپارچه برای:

- skills
- code plugins
- bundle plugins

پارامترهای کوئری:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `family` (اختیاری): `skill`، `code-plugin` یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community` یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended`، `trending`، `downloads`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های plugin محدود شده باشد (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins`، یا نقاط پایانی بسته با
  `family=code-plugin`/`family=bundle-plugin`). دسته‌بندی‌های کنترل‌شده و
  نام‌های مستعار فیلتر قدیمی v1 ذیل `GET /api/v1/plugins` مستند شده‌اند.

نکات:

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured`،
  `highlightedOnly` یا `sort` مقدار `400` برمی‌گردانند. پارامترهای کوئری ناشناخته نادیده گرفته می‌شوند.
- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار خانواده‌ثابت باقی می‌مانند.
- ورودی‌های Skill همچنان با رجیستری skill پشتیبانی می‌شوند و هنوز فقط از طریق `POST /api/v1/skills` قابل انتشار هستند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخوان‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخوان‌های احرازهویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند در نتایج فهرست/جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احرازهویت‌شده می‌تواند بخواند.

### `GET /api/v1/packages/search`

جست‌وجوی کاتالوگ یکپارچه در skills + بسته‌های plugin.

پارامترهای کوئری:

- `q` (الزامی): رشته کوئری
- `limit` (اختیاری): عدد صحیح (1–100)
- `family` (اختیاری): `skill`، `code-plugin` یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community` یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های plugin محدود شده باشد. دسته‌بندی‌های کنترل‌شده و نام‌های مستعار
  فیلتر قدیمی v1 ذیل `GET /api/v1/plugins` مستند شده‌اند.

نکات:

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured` یا
  `highlightedOnly` مقدار `400` برمی‌گردانند. پارامترهای کوئری ناشناخته نادیده گرفته می‌شوند.
- فراخوان‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخوان‌های احرازهویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احرازهویت‌شده می‌تواند بخواند.

### `GET /api/v1/plugins`

مرور کاتالوگ فقط Plugin در میان بسته‌های code-plugin و bundle-plugin.

پارامترهای کوئری:

- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `recommended` (پیش‌فرض)، `trending`، `downloads`، `updated`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی plugin. مقادیر فعلی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نام‌های مستعار فیلتر قدیمی v1 همچنان در نقاط پایانی خواندن پذیرفته می‌شوند:

- `mcp-tooling`، `data` و `automation` به `tools` نگاشت می‌شوند.
- `observability` و `deployment` به `gateway` نگاشت می‌شوند.
- `dev-tools` به `runtime` نگاشت می‌شود.

`trending` یک جدول رتبه‌بندی نصب/دانلود هفت‌روزه است و از مجموع‌های کل زمان استفاده نمی‌کند.
در نقطه پایانی یکپارچه `/api/v1/packages` فقط مخصوص plugin است؛ برای کاتالوگ skill از
`/api/v1/skills?sort=trending` استفاده کنید.

نام‌های مستعار قدیمی به‌عنوان مقادیر دسته‌بندی ذخیره‌شده یا اعلام‌شده توسط نویسنده پذیرفته نمی‌شوند.

### `GET /api/v1/skills/export`

خروجی‌گیری انبوه از آخرین skills عمومی برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای کوئری:

- `startDate` (الزامی): کران پایین به میلی‌ثانیه Unix برای `updatedAt` مربوط به skill.
- `endDate` (الزامی): کران بالا به میلی‌ثانیه Unix برای `updatedAt` مربوط به skill.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.

پاسخ:

- بدنه: آرشیو ZIP.
- ریشه هر skill خروجی‌گرفته‌شده در `{publisher}/{slug}/` قرار دارد.
- skills میزبانی‌شده شامل فایل‌های آخرین نسخه ذخیره‌شده هستند و در
  `_manifest.json` با `sourceRef: "public-clawhub"` فهرست می‌شوند.
- skills فعلی مبتنی بر GitHub با اسکن `clean` یا `suspicious` شامل
  `_source_handoff.json` با `sourceRef: "public-github"`، مخزن، کامیت، مسیر،
  هش محتوا و URL آرشیو هستند. آن‌ها شامل فایل‌های منبع میزبانی‌شده در ClawHub نیستند.
- هر skill شامل `_export_skill_meta.json` است.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- `_errors.json` زمانی گنجانده می‌شود که skills یا فایل‌های منفرد قابل
  خروجی‌گیری نباشند.

هدرها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

صدور گروهی آخرین انتشارهای عمومی Plugin برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای کوئری:

- `startDate` (الزامی): کران پایین بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `endDate` (الزامی): کران بالا بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.
- `family` (اختیاری): `code-plugin` یا `bundle-plugin`. حذف آن یعنی هر دو
  خانواده Plugin.

پاسخ:

- بدنه: آرشیو ZIP.
- ریشه هر Plugin صادرشده در `{family}/{packageName}/` است.
- هر Plugin صادرشده شامل فایل‌های ذخیره‌شده آخرین انتشار است.
- فراداده صدور برای هر Plugin در
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` ذخیره می‌شود.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- وقتی Pluginها یا فایل‌های جداگانه قابل صدور نباشند، `_errors.json` گنجانده
  می‌شود.

سرآیندها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

جست‌وجوی فقط Plugin در بسته‌های code-plugin و bundle-plugin.

پارامترهای کوئری:

- `q` (الزامی): رشته کوئری
- `limit` (اختیاری): عدد صحیح (1-100)
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته Plugin. مقادیر فعلی:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

یادداشت‌ها:

- نام‌های مستعار فیلتر v1 قدیمی که زیر `GET /api/v1/plugins` مستند شده‌اند نیز
  پذیرفته می‌شوند.
- فیلتر کردن دسته یک فیلتر واقعی API است که با ردیف‌های خلاصه دسته Plugin
  پشتیبانی می‌شود، نه بازنویسی کوئری جست‌وجو.
- نتایج به ترتیب ارتباط بازگردانده می‌شوند و در حال حاضر صفحه‌بندی نمی‌شوند.
- کنترل‌های مرتب‌سازی رابط مرورگر برای جست‌وجوی Plugin نتایج مرتبط بارگذاری‌شده را
  دوباره مرتب می‌کنند و با رفتار مرور فعلی `/skills` مطابقت دارند.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را برمی‌گرداند.

یادداشت‌ها:

- Skills همچنین می‌تواند از طریق این مسیر در کاتالوگ یکپارچه resolve شود.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.

یادداشت‌ها:

- به توکن API برای مالک بسته، مالک/ادمین ناشر سازمانی،
  ناظر پلتفرم، یا ادمین پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه را برمی‌گرداند.

پارامترهای کوئری:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

یادداشت‌ها:

- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را، شامل فراداده فایل، سازگاری،
راستی‌آزمایی، فراداده آرتیفکت، و داده‌های اسکن برمی‌گرداند.

یادداشت‌ها:

- `version.artifact.kind` برای آرشیوهای بسته قدیمی `legacy-zip` یا
  برای انتشارهای مبتنی بر ClawPack برابر `npm-pack` است.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`, `npmShasum`, و
  `npmTarballName` هستند.
- `version.sha256hash` فراداده سازگاری منسوخ برای کلاینت‌های قدیمی است. این مقدار
  همان بایت‌های دقیق ZIP را که توسط `/api/v1/packages/{name}/download` بازگردانده می‌شوند هش می‌کند.
  کلاینت‌های مدرن باید از `version.artifact.sha256` استفاده کنند که
  آرتیفکت انتشار canonical را شناسایی می‌کند.
- وقتی داده اسکن وجود داشته باشد، `version.vtAnalysis`, `version.llmAnalysis`, و `version.staticScan`
  گنجانده می‌شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصه دقیق امنیت و اعتماد انتشار بسته را برای کلاینت‌های نصب
برمی‌گرداند. این سطح مصرف عمومی OpenClaw برای تصمیم‌گیری درباره این است که آیا یک
انتشار resolve‌شده قابل نصب است یا نه.

احراز هویت:

- نقطه پایانی خواندن عمومی. هیچ توکن مالک، ناشر، ناظر، یا ادمین
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

- `package.name`, `package.displayName`, و `package.family` بسته رجیستری
  resolve‌شده را شناسایی می‌کنند.
- `release.releaseId`, `release.version`, و `release.createdAt` انتشار دقیقی را که
  ارزیابی شده شناسایی می‌کنند.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, و `release.npmTarballName` وقتی برای
  آرتیفکت انتشار شناخته‌شده باشند حاضر هستند.
- `trust.scanStatus` وضعیت اعتماد مؤثری است که از ورودی‌های اسکنر
  و نظارت دستی انتشار مشتق می‌شود.
- `trust.moderationState` می‌تواند nullable باشد. وقتی نظارت دستی انتشار
  وجود نداشته باشد، مقدار آن `null` است.
- `trust.blockedFromDownload` سیگنال مسدودسازی نصب است. OpenClaw و دیگر
  کلاینت‌های نصب باید وقتی این مقدار `true` است نصب را مسدود کنند، به‌جای اینکه
  قوانین مسدودسازی را دوباره از فیلدهای اسکنر یا نظارت مشتق کنند.
- `trust.reasons` فهرست توضیح کاربرمحور و حسابرسی است. کدهای دلیل
  رشته‌هایی پایدار و فشرده مانند `manual:quarantined`, `scan:malicious`,
  و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد هنوز در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصه اعتماد از ورودی‌های قدیمی محاسبه شده و
  پیش از تصمیم اجازه با اطمینان بالا باید نیازمند تازه‌سازی تلقی شود.

یادداشت‌ها:

- این نقطه پایانی دقیقاً وابسته به نسخه است. کلاینت‌ها باید پس از resolve کردن
  نسخه بسته‌ای که قصد نصب آن را دارند آن را فراخوانی کنند، نه فقط پس از خواندن آخرین
  فراداده بسته.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.
- این نقطه پایانی عمداً از نقاط پایانی نظارت مالک/ناظر محدودتر است.
  تصمیم نصب و توضیح عمومی را افشا می‌کند، نه
  هویت گزارش‌دهنده‌ها، متن گزارش‌ها، شواهد خصوصی، یا جدول‌های زمانی بازبینی داخلی.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده resolver صریح آرتیفکت را برای یک نسخه بسته برمی‌گرداند.

یادداشت‌ها:

- نسخه‌های بسته قدیمی یک آرتیفکت `legacy-zip` و یک
  `downloadUrl` قدیمی ZIP برمی‌گردانند.
- نسخه‌های ClawPack یک آرتیفکت `npm-pack`، فیلدهای integrity مربوط به npm، یک
  `tarballUrl`، و URL سازگاری ZIP قدیمی برمی‌گردانند.
- این سطح resolver مربوط به OpenClaw است؛ از حدس زدن قالب آرشیو از
  یک URL مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

آرتیفکت نسخه را از مسیر resolver صریح دانلود می‌کند.

یادداشت‌ها:

- نسخه‌های ClawPack همان بایت‌های دقیق `.tgz` بارگذاری‌شده npm-pack را stream می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` redirect می‌شوند.
- از bucket نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آینده OpenClaw را برمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر است:

- وضعیت کانال رسمی
- در دسترس بودن آخرین نسخه
- در دسترس بودن آرتیفکت ClawPack npm-pack
- digest آرتیفکت
- منشأ مخزن منبع و commit
- فراداده سازگاری OpenClaw
- اهداف میزبان
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

- به توکن API برای کاربر ناظر یا ادمین نیاز دارد.

پارامترهای کوئری:

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

نقطه پایانی ادمین برای ایجاد یا به‌روزرسانی یک ردیف مهاجرت Plugin رسمی.

احراز هویت:

- به توکن API برای کاربر ادمین نیاز دارد.

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

- `bundledPluginId` به حروف کوچک normalize می‌شود و کلید upsert پایدار است.
- `packageName` بر اساس نام npm normalize می‌شود؛ بسته می‌تواند برای مهاجرت‌های
  برنامه‌ریزی‌شده وجود نداشته باشد.
- این فقط آمادگی مهاجرت را ردیابی می‌کند. OpenClaw را تغییر نمی‌دهد یا
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

نقطه پایانی ناظر/ادمین برای صف‌های بازبینی انتشار بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا ادمین نیاز دارد.

پارامترهای کوئری:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

معنای وضعیت‌ها:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، باطل‌شده، یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، باطل‌شده، یا مخرب.
- `manual`: هر انتشار دارای override نظارت دستی.
- `all`: هر انتشار دارای override دستی، وضعیت اسکن غیرپاک، یا گزارش بسته.

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

یک بسته را برای بازبینی ناظر گزارش می‌کند. گزارش‌ها در سطح بسته هستند و به‌صورت اختیاری
به یک نسخه پیوند می‌خورند. آن‌ها صف نظارت را تغذیه می‌کنند اما به‌خودی‌خود دانلودها را
به‌صورت خودکار پنهان یا مسدود نمی‌کنند؛ ناظران باید از نظارت انتشار برای
تأیید، قرنطینه، یا باطل کردن آرتیفکت‌ها استفاده کنند.

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

پارامترهای کوئری:

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

نقطه پایانی مالک/ناظر برای مشاهده وضعیت نظارت بسته.

احراز هویت:

- به توکن API برای مالک بسته، عضو ناشر، ناظر، یا کاربر مدیر نیاز دارد.

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

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام برگرداندن `status` به `open` می‌توان آن را حذف کرد. برای اعمال نظارت انتشار در همان گردش کار قابل حسابرسی، همراه با یک گزارش تأییدشده `finalAction: "quarantine"` یا `finalAction: "revoke"` را ارسال کنید.

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
- `revoked`: پس از آنکه یک انتشار قبلاً قابل اعتماد بوده، مسدود شده است.

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود آرتیفکت `403` برمی‌گردانند.
هر تغییر یک ورودی گزارش حسابرسی می‌نویسد.

### `GET /api/v1/packages/{name}/file`

محتوای متنی خام یک فایل بسته را برمی‌گرداند.

پارامترهای کوئری:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

یادداشت‌ها:

- پیش‌فرض، آخرین انتشار است.
- از سطل نرخ خواندن استفاده می‌کند، نه سطل دانلود.
- فایل‌های دودویی `415` برمی‌گردانند.
- محدودیت اندازه فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن‌ها را مسدود نمی‌کنند؛ انتشارهای مخرب ممکن است همچنان در جای دیگری نگه داشته شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای انتشار یک بسته دانلود می‌کند.

پارامترهای کوئری:

- `version` (اختیاری)
- `tag` (اختیاری)

یادداشت‌ها:

- پیش‌فرض، آخرین انتشار است.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشه `package/` هستند تا کلاینت‌های قدیمی OpenClaw همچنان کار کنند.
- این مسیر فقط ZIP باقی می‌ماند. فایل‌های ClawPack با پسوند `.tgz` را استریم نمی‌کند.
- پاسخ‌ها برای بررسی یکپارچگی resolver شامل سرآیندهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type` و `X-ClawHub-Artifact-Sha256` هستند.
- فراداده فقط-رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک packument سازگار با npm برای نسخه‌های بسته مبتنی بر ClawPack برمی‌گرداند.

یادداشت‌ها:

- فقط نسخه‌هایی که tarballهای npm-pack بارگذاری‌شده ClawPack دارند فهرست می‌شوند.
- نسخه‌های قدیمی فقط-ZIP عمداً حذف می‌شوند.
- `dist.tarball`، `dist.integrity` و `dist.shasum` از فیلدهای سازگار با npm استفاده می‌کنند تا کاربران در صورت تمایل بتوانند npm را به mirror اشاره دهند.
- packumentهای بسته scopeشده از هر دو مسیر درخواست `/api/npm/@scope/name` و مسیر کدگذاری‌شده npm یعنی `/api/npm/@scope%2Fname` پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball بارگذاری‌شده ClawPack را برای کلاینت‌های mirror npm استریم می‌کند.

یادداشت‌ها:

- از سطل نرخ دانلود استفاده می‌کند.
- سرآیندهای دانلود شامل SHA-256 از ClawHub به‌علاوه فراداده integrity/shasum مربوط به npm هستند.
- بررسی‌های نظارت و دسترسی بسته خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

توسط CLI برای نگاشت یک اثرانگشت محلی به یک نسخه شناخته‌شده استفاده می‌شود.

پارامترهای کوئری:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز 64 کاراکتری اثرانگشت bundle

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک ZIP نسخه Skill میزبانی‌شده را دانلود می‌کند، یا برای یک Skill فعلی مبتنی بر GitHub با اسکن `clean` یا `suspicious` و بدون نسخه میزبانی‌شده، واگذاری منبع GitHub برمی‌گرداند.

پارامترهای کوئری:

- `slug` (الزامی)
- `version` (اختیاری): رشته semver
- `tag` (اختیاری): نام tag (مثلاً `latest`)

یادداشت‌ها:

- اگر نه `version` و نه `tag` ارائه نشود، آخرین نسخه استفاده می‌شود.
- نسخه‌های حذف نرم‌شده `410` برمی‌گردانند.
- واگذاری‌های Skill مبتنی بر GitHub بایت‌ها را پروکسی یا mirror نمی‌کنند. پاسخ JSON شامل `sourceRef: "public-github"`، `repo`، `commit`، `path`، `contentHash` و `archiveUrl` است؛ وضعیت اسکن/فعلی یک gate است و به‌عنوان فراداده payload موفقیت درج نمی‌شود.
- آمار دانلود به‌صورت هویت‌های یکتا در هر روز UTC شمرده می‌شود (`userId` وقتی توکن API معتبر است، در غیر این صورت IP).

## نقاط پایانی احراز هویت (توکن Bearer)

همه نقاط پایانی نیاز دارند:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

توکن را اعتبارسنجی می‌کند و handle کاربر را برمی‌گرداند.

### `POST /api/v1/skills`

یک نسخه جدید منتشر می‌کند.

- ترجیحی: `multipart/form-data` با JSON در `payload` + blobهای `files[]`.
- بدنه JSON با `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، API آن ناشر را سمت سرور resolve می‌کند و از actor می‌خواهد دسترسی ناشر داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` برابر `true` باشد، یک Skill موجود ممکن است به آن مالک منتقل شود، اگر actor روی هر دو ناشر فعلی و هدف مدیر/مالک باشد. بدون این انتخاب صریح، تغییرات مالک رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت با توکن Bearer نیاز دارد.
- به `multipart/form-data` نیاز دارد.
- فیلدهای مجاز فرم عبارت‌اند از `payload`، blobهای تکرارشونده `files`، یا یک ارجاع tarball به نام `clawpack`. `clawpack` می‌تواند یک blob با پسوند `.tgz` یا یک شناسه storage برگشتی از جریان upload-url باشد. انتشارهای storage-id مرحله‌بندی‌شده باید `clawpackUploadTicket` برگشتی همراه با آن URL بارگذاری را نیز شامل شوند.
- یا از `files` استفاده کنید یا از `clawpack`، هرگز هر دو را در یک درخواست نیاورید.
- بدنه‌های JSON و فراداده `payload.files` / `payload.artifact` ارائه‌شده توسط فراخواننده رد می‌شوند.
- درخواست‌های انتشار مستقیم multipart حداکثر 18MB هستند. tarballهای ClawPack می‌توانند از جریان upload-url تا سقف tarball برابر 120MB استفاده کنند.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، فقط مدیران می‌توانند از طرف آن مالک منتشر کنند.

نکات برجسته اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های ClawPack با پسوند `.tgz` باید آن را در `package/openclaw.plugin.json` داشته باشند.
- code pluginها به `package.json`، فراداده مخزن منبع، فراداده commit منبع، فراداده schema پیکربندی، `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
- فقط ناشر org با نام `openclaw` و ناشران شخصی اعضای فعلی org با نام `openclaw` می‌توانند در کانال `official` منتشر کنند.
- انتشارهای از طرف دیگران همچنان واجد شرایط بودن کانال official را در برابر حساب مالک هدف اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف نرم / بازیابی یک Skill (مالک، ناظر، یا مدیر).

بدنه JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

وقتی وجود داشته باشد، `reason` به‌عنوان یادداشت نظارت Skill ذخیره می‌شود و در گزارش حسابرسی کپی می‌شود.
حذف‌های نرم آغازشده توسط مالک، slug را برای 30 روز رزرو می‌کنند؛ سپس slug می‌تواند توسط ناشر دیگری ادعا شود. وقتی این انقضا اعمال شود، پاسخ حذف شامل `slugReservedUntil` است.
پنهان‌سازی‌های ناظر/مدیر و حذف‌های امنیتی به این شکل منقضی نمی‌شوند.

پاسخ حذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

کدهای وضعیت:

- `200`: ok
- `401`: غیرمجاز
- `403`: ممنوع
- `404`: Skill/کاربر پیدا نشد
- `500`: خطای داخلی سرور

### `POST /api/v1/users/publisher`

فقط مدیر. اطمینان می‌دهد که یک ناشر org برای یک handle وجود دارد. اگر handle هنوز به یک ناشر مشترک قدیمی کاربر/شخصی اشاره کند، نقطه پایانی ابتدا آن را به یک ناشر org مهاجرت می‌دهد.
برای org تازه ایجادشده، `memberHandle` را ارائه کنید؛ مدیر عامل به‌عنوان عضو اضافه نمی‌شود.
`memberRole` به‌صورت پیش‌فرض `owner` است.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

ایجاد ناشر org به‌صورت self-serve برای کاربر احرازشده. یک ناشر org جدید ایجاد می‌کند و فراخواننده را به‌عنوان مالک اضافه می‌کند. این نقطه پایانی handleهای موجود کاربر/شخصی را مهاجرت نمی‌دهد و ناشر را trusted/official علامت‌گذاری نمی‌کند.

- بدنه: `{ "handle": "opik", "displayName": "Opik" }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- وقتی handle از قبل توسط یک ناشر، کاربر، یا ناشر شخصی استفاده شده باشد، `409` برمی‌گرداند.

### `POST /api/v1/users/reserve`

فقط مدیر. slugهای ریشه و نام‌های بسته را برای مالک ذی‌حق بدون انتشار یک انتشار رزرو می‌کند. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف انتشار تبدیل می‌شوند، بنابراین همان مالک می‌تواند بعداً انتشار واقعی code-plugin یا bundle-plugin را با آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

فقط مدیر. یک ناشر شخصی را برای principal جایگزین تأییدشده GitHub OAuth بدون ویرایش ردیف‌های حساب Convex Auth بازیابی می‌کند. درخواست باید هر دو شناسه تغییرناپذیر حساب provider مربوط به GitHub را نام ببرد؛ handleهای قابل تغییر فقط به‌عنوان محافظ روبه‌روی operator استفاده می‌شوند.

نقطهٔ پایانی به‌طور پیش‌فرض در حالت اجرای آزمایشی است. اعمال بازیابی پس از آن‌که کارکنان به‌طور مستقل تداوم بین هر دو هویت اصلی GitHub را تأیید کردند، به `dryRun: false` و
`confirmIdentityVerified: true` نیاز دارد. اگر ناشر شخصی فعلی کاربر مقصد مهارت‌ها، بسته‌ها، یا منابع مهارت GitHub داشته باشد، بازیابی به‌صورت بسته شکست می‌خورد.
بازیابی همچنین فیلدهای قدیمی `ownerUserId` را برای مهارت‌های ناشر بازیابی‌شده،
نام‌های مستعار اسلاگ مهارت، بسته‌ها، هشدارهای بازرس بسته، و ردیف‌های مشتق‌شدهٔ چکیدهٔ جست‌وجو منتقل می‌کند تا
مسیرهای مالک مستقیم با مرجع ناشر جدید هم‌خوان شوند. یک رزرو فعال هندل حفاظت‌شده
برای هندل بازیابی‌شده نیز به کاربر جایگزین واگذار می‌شود تا همگام‌سازی بعدی
نمایه نتواند مرجع رقیب کاربر قبلی را بازیابی کند. هر جدول اصلی در هر تراکنش اعمال به
۱۰۰ ردیف محدود است؛ بازیابی‌های بزرگ‌تر باید ابتدا از یک مهاجرت مالک قابل‌ازسرگیری استفاده کنند.
منابع مهارت GitHub در محدودهٔ ناشر هستند و به‌جای بازنویسی، به‌عنوان بررسی‌شده گزارش می‌شوند.

- بدنه: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- پاسخ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط پایانی مدیریت اسلاگ مالک

- `POST /api/v1/skills/{slug}/rename`
  - بدنه: `{ "newSlug": "new-canonical-slug" }`
  - پاسخ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - بدنه: `{ "targetSlug": "canonical-target-slug" }`
  - پاسخ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

یادداشت‌ها:

- هر دو نقطهٔ پایانی به احراز هویت با توکن API نیاز دارند و فقط برای مالک مهارت کار می‌کنند.
- `rename` اسلاگ قبلی را به‌عنوان نام مستعار تغییرمسیر حفظ می‌کند.
- `merge` فهرست مبدأ را پنهان می‌کند و اسلاگ مبدأ را به فهرست مقصد تغییرمسیر می‌دهد.

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
  - شکل پاسخ: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

یک کاربر را مسدود کنید و مهارت‌های تحت مالکیت او را به‌طور سخت حذف کنید (فقط ناظر/مدیر).

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

مسدودیت کاربر را بردارید و مهارت‌های واجد شرایط را بازیابی کنید (فقط مدیر).

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

دلیل ذخیره‌شده برای یک مسدودیت موجود را بدون رفع مسدودیت یا بازیابی
محتوا تغییر دهید (فقط مدیر). مگر آن‌که `dryRun` برابر `false` باشد، پیش‌فرض اجرای آزمایشی است.

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

نقش کاربر را تغییر دهید (فقط مدیر).

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

کاربران را فهرست یا جست‌وجو کنید (فقط مدیر).

پارامترهای پرس‌وجو:

- `q` (اختیاری): پرس‌وجوی جست‌وجو
- `query` (اختیاری): نام مستعار برای `q`
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

یک ستاره (برجسته‌سازی) اضافه/حذف کنید. هر دو نقطهٔ پایانی idempotent هستند.

پاسخ‌ها:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقاط پایانی CLI قدیمی (منسوخ)

برای نسخه‌های قدیمی‌تر CLI همچنان پشتیبانی می‌شود:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

برای برنامهٔ حذف، `DEPRECATIONS.md` را ببینید.

`POST /api/cli/upload-url` مقدارهای `uploadUrl` و `uploadTicket` را برمی‌گرداند. انتشارهای بسته که یک tarball از ClawPack را مرحله‌بندی می‌کنند باید شناسهٔ ذخیره‌سازی حاصل را به‌عنوان
`clawpack` و ticket برگشتی را به‌عنوان `clawpackUploadTicket` ارسال کنند.

## کشف رجیستری (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات رجیستری/احراز هویت را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

طرح‌واره:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر خودتان میزبانی می‌کنید، این فایل را ارائه دهید (یا `CLAWHUB_REGISTRY` را صراحتاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی است).
