---
read_when:
    - افزودن/تغییر نقاط پایانی
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API HTTP (عمومی + نقاط پایانی CLI + احراز هویت).
x-i18n:
    generated_at: "2026-07-02T14:07:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL پایه: `https://clawhub.ai` (پیش‌فرض).

همهٔ مسیرهای v1 زیر `/api/v1/...` هستند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی می‌مانند (به `DEPRECATIONS.md` مراجعه کنید).
OpenAPI: `/api/v1/openapi.json`.

## استفادهٔ دوباره از کاتالوگ عمومی

دایرکتوری‌های شخص ثالث می‌توانند از endpointهای خواندن عمومی برای فهرست کردن یا جست‌وجوی مهارت‌های ClawHub استفاده کنند. لطفاً نتایج را cache کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست canonical ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) برگردانید، و از القای تأیید سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای پنهان، خصوصی، یا مسدودشده توسط moderation را خارج از سطح API عمومی mirror کنید.

میانبرهای slug وب در خانواده‌های registry resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی اولویت route، از
URLهای canonical برگشتی از endpointهای خواندن استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال:

- درخواست‌های ناشناس: به‌ازای IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (توکن Bearer معتبر): به‌ازای bucket کاربر اعمال می‌شود.
- اگر توکن وجود نداشته باشد یا نامعتبر باشد، رفتار به اعمال بر اساس IP برمی‌گردد.
- endpointهای نوشتن احراز هویت‌شده نباید وقتی سرور دلیل را می‌داند، یک `Unauthorized` خالی برگردانند. توکن‌های غایب، توکن‌های نامعتبر/لغوشده، و
  حساب‌های حذف‌شده/مسدودشده/غیرفعال باید هرکدام متن قابل اقدام دریافت کنند تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی آن‌ها را مسدود کرده است.

- خواندن: 3000/min به‌ازای IP، 12000/min به‌ازای کلید
- نوشتن: 300/min به‌ازای IP، 3000/min به‌ازای کلید
- دانلود: 1200/min به‌ازای IP، 6000/min به‌ازای کلید (endpointهای دانلود)

Headerها:

- سازگاری قدیمی: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`، `RateLimit-Reset`
- روی `429`: `X-RateLimit-Remaining: 0` و `RateLimit-Remaining: 0`
- روی `429`: `Retry-After`

معنای headerها:

- `X-RateLimit-Reset`: ثانیه‌های epoch یونیکس مطلق
- `RateLimit-Reset`: ثانیه تا reset (تأخیر)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجهٔ دقیق باقی‌مانده وقتی وجود داشته باشد.
  درخواست‌های موفق sharded این header را حذف می‌کنند، به‌جای اینکه یک مقدار global تقریبی برگردانند.
- `Retry-After`: ثانیه‌های انتظار پیش از retry (تأخیر) روی `429`

نمونهٔ پاسخ `429`:

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

- اگر `Retry-After` وجود دارد، پیش از retry همان تعداد ثانیه صبر کنید.
- برای جلوگیری از retryهای هم‌زمان، از backoff همراه با jitter استفاده کنید.
- اگر `Retry-After` وجود ندارد، به `RateLimit-Reset` fallback کنید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- فقط وقتی deployment به‌صراحت headerهای forwarded مورد اعتماد را فعال کرده باشد، از headerهای IP کلاینت مورد اعتماد، از جمله `cf-connecting-ip`، استفاده می‌کند.
- ClawHub از headerهای forwarding مورد اعتماد برای شناسایی IP کلاینت‌ها در edge استفاده می‌کند.
- اگر IP کلاینت مورد اعتماد در دسترس نباشد، درخواست‌های ناشناس از bucketهای fallback استفاده می‌کنند که
  فقط بر اساس نوع محدودیت نرخ scoped هستند. این bucketهای fallback شامل
  مسیرهای ارائه‌شده توسط caller، slugها، نام‌های package، نسخه‌ها، query stringها، یا سایر
  پارامترهای artifact نمی‌شوند.

## پاسخ‌های خطا

پاسخ‌های خطای عمومی v1 متن ساده با `content-type: text/plain; charset=utf-8` هستند.
این شامل failureهای validation (`400`)، resourceهای عمومی غایب (`404`)، failureهای auth و
permission (`401`/`403`)، محدودیت‌های نرخ (`429`)، و دانلودهای مسدودشده می‌شود. کلاینت‌ها
باید body پاسخ را به‌عنوان رشته‌ای قابل خواندن برای انسان بخوانند. پارامترهای query ناشناخته
برای سازگاری نادیده گرفته می‌شوند، اما پارامترهای query شناخته‌شده با مقادیر نامعتبر
`400` برمی‌گردانند.

## endpointهای عمومی (بدون auth)

### `GET /api/v1/search`

پارامترهای query:

- `q` (الزامی): رشتهٔ query
- `limit` (اختیاری): integer
- `highlightedOnly` (اختیاری): `true` برای filter کردن به مهارت‌های highlighted
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان کردن مهارت‌های مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): alias قدیمی برای `nonSuspiciousOnly`

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

- نتایج به‌ترتیب relevance برگردانده می‌شوند (embedding similarity + boostهای دقیق token برای slug/name + یک popularity prior کوچک).
- relevance از popularity قوی‌تر است. یک match دقیق token برای slug یا display-name می‌تواند از یک match شل‌تر با engagement بسیار قوی‌تر رتبهٔ بالاتری بگیرد.
- متن ASCII روی مرزهای کلمه و punctuation token می‌شود. برای مثال، `personal-map` شامل یک token مستقل `map` است، درحالی‌که `amap-jsapi-skill` شامل `amap`، `jsapi`، و `skill` است؛ بنابراین جست‌وجوی `map` به `personal-map` یک match lexical قوی‌تر از `amap-jsapi-skill` می‌دهد.
- popularity با log scale می‌شود و سقف دارد. مهارت‌های با engagement بالا وقتی متن query match ضعیف‌تری باشد می‌توانند رتبهٔ پایین‌تری بگیرند.
- وضعیت moderation مشکوک یا پنهان می‌تواند بسته به filterهای caller و وضعیت فعلی moderation، یک مهارت را از جست‌وجوی عمومی حذف کند.

راهنمای discoverability برای publisherها:

- عبارت‌هایی را که کاربران دقیقاً جست‌وجو خواهند کرد در display name، summary، و tagها بگذارید. فقط وقتی از یک token مستقل slug استفاده کنید که آن نیز یک هویت پایدار باشد که می‌خواهید نگه دارید.
- صرفاً برای دنبال کردن یک query، slug را rename نکنید مگر اینکه slug جدید نام canonical بلندمدت بهتری باشد. slugهای قدیمی به aliasهای redirect تبدیل می‌شوند، اما URL canonical، slug نمایش‌داده‌شده، و digestهای جست‌وجوی آینده از slug جدید استفاده می‌کنند.
- aliasهای rename، resolution را برای URLهای قدیمی و نصب‌هایی که از طریق registry resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو پس از index شدن rename بر اساس metadata مهارت canonical است. آمار موجود با مهارت می‌ماند.
- اگر یک مهارت به‌طور غیرمنتظره نامرئی است، پیش از تغییر metadata مرتبط با رتبه‌بندی، ابتدا در حالت logged in وضعیت moderation را با `clawhub inspect @owner/slug` بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): integer (1–200)
- `cursor` (اختیاری): cursor صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended` (alias: `default`)، `createdAt` (alias: `newest`)، `downloads`، `stars` (alias: `rating`)، aliasهای نصب قدیمی `installsCurrent`/`installs`/`installsAllTime` به `downloads` map می‌شوند، `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان کردن مهارت‌های مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): alias قدیمی برای `nonSuspiciousOnly`

مقادیر نامعتبر `sort` مقدار `400` برمی‌گردانند.

نکته‌ها:

- `recommended` از سیگنال‌های engagement و recency استفاده می‌کند.
- `trending` بر اساس نصب‌ها در 7 روز گذشته رتبه‌بندی می‌کند (بر پایهٔ telemetry).
- `createdAt` برای crawlهای مهارت جدید پایدار است؛ `updated` وقتی مهارت‌های موجود دوباره publish شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` باشد، sortهای مبتنی بر cursor ممکن است در یک صفحه کمتر از `limit` آیتم برگردانند، چون مهارت‌های مشکوک پس از retrieval صفحه filter می‌شوند.
- وقتی `nextCursor` وجود دارد، از آن برای ادامهٔ pagination استفاده کنید. یک صفحهٔ کوتاه به‌تنهایی به معنی پایان نتایج نیست.

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

- slugهای قدیمی ایجادشده توسط جریان‌های rename/merge مالک به مهارت canonical resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter مهارت (مثلاً `["macos"]`، `["linux"]`). اگر اعلام نشده باشد `null`.
- `metadata.systems`: targetهای سیستم Nix (مثلاً `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد `null`.
- اگر مهارت metadata پلتفرم نداشته باشد، `metadata` مقدار `null` است.
- `moderation` فقط وقتی مهارت flagged باشد یا مالک در حال مشاهدهٔ آن باشد، گنجانده می‌شود.

### `GET /api/v1/skills/{slug}/moderation`

وضعیت structured moderation را برمی‌گرداند.

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

- مالکان و moderatorها می‌توانند به جزئیات moderation برای مهارت‌های پنهان دسترسی داشته باشند.
- callerهای عمومی فقط برای مهارت‌های visible که از قبل flagged شده‌اند `200` دریافت می‌کنند.
- Evidence برای callerهای عمومی redacted می‌شود و فقط برای مالکان/moderatorها snippetهای خام را شامل می‌شود.

### `POST /api/v1/skills/{slug}/report`

یک مهارت را برای review توسط moderator گزارش کنید. گزارش‌ها در سطح مهارت هستند، به‌صورت اختیاری
به یک نسخه linked می‌شوند، و صف گزارش مهارت را تغذیه می‌کنند.

Auth:

- به یک API token نیاز دارد.

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

endpoint مخصوص moderator/admin برای دریافت گزارش‌های مهارت.

پارامترهای query:

- `status` (اختیاری): `open` (پیش‌فرض)، `confirmed`، `dismissed`، یا `all`
- `limit` (اختیاری): integer (1-200)
- `cursor` (اختیاری): cursor صفحه‌بندی

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

endpoint مخصوص moderator/admin برای resolve یا reopen کردن گزارش‌های مهارت.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام
تنظیم دوبارهٔ `status` به `open` می‌توان آن را حذف کرد. برای پنهان کردن مهارت در همان workflow قابل audit، همراه با گزارش triaged مقدار `finalAction: "hide"` را پاس دهید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای query:

- `limit` (اختیاری): integer
- `cursor` (اختیاری): cursor صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

metadata نسخه + فهرست fileها را برمی‌گرداند.

- `version.security` شامل وضعیت verification اسکن normalized و جزئیات scanner است
  (VirusTotal + LLM)، وقتی در دسترس باشد.

### `GET /api/v1/skills/{slug}/scan`

جزئیات verification اسکن امنیتی برای یک نسخهٔ مهارت را برمی‌گرداند.

پارامترهای query:

- `version` (اختیاری): رشتهٔ نسخهٔ مشخص.
- `tag` (اختیاری): resolve کردن یک نسخهٔ tagged (برای مثال `latest`).

نکته‌ها:

- اگر هیچ‌یک از `version` یا `tag` ارائه نشود، از آخرین نسخه استفاده می‌شود.
- وضعیت تأیید نرمال‌سازی‌شده به‌همراه جزئیات ویژهٔ اسکنر را شامل می‌شود.
- `security.hasScanResult` فقط زمانی `true` است که یک اسکنر رأی قطعی تولید کرده باشد (`clean`، `suspicious`، یا `malicious`).
- `moderation` یک نمایهٔ فعلی moderation در سطح مهارت است که از آخرین نسخه به‌دست آمده است.
- هنگام پرس‌وجوی یک نسخهٔ تاریخی، پیش از هم‌زمینه دانستن نسخهٔ `moderation` و `security`، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

### `POST /api/v1/skills/-/scan`

نقطهٔ پایانی ارسال احراز هویت‌شده برای کارهای جدید ClawScan.

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

- محموله‌های درخواست اسکن و گزارش‌های قابل دانلود پس از پنجرهٔ نگهداری از ذخیره‌گاه درخواست اسکن منقضی می‌شوند.
- اسکن‌های منتشرشده به دسترسی مدیریتی مالک/ناشر، یا اختیار moderator/admin پلتفرم نیاز دارند.
- اسکن‌های منتشرشده فقط زمانی بازنویسی می‌شوند که `update: true` باشد و اسکن با موفقیت کامل شود.
- پاسخ `202` با `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` است.
- کارهای اسکن ناهمگام هستند. درخواست‌های اسکن دستی پیش از کارهای عادی انتشار/بازپرکنی اولویت‌بندی می‌شوند، اما تکمیل همچنان به در دسترس بودن worker بستگی دارد.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطهٔ پایانی نظرسنجی احراز هویت‌شده برای یک اسکن ارسال‌شده.

- وضعیت queued/running/succeeded/failed را برمی‌گرداند.
- هنگام queued بودن، `queue.queuedAhead` و `queue.position` را برمی‌گرداند تا کلاینت‌ها بتوانند نشان دهند چند اسکن دستی اولویت‌دار جلوتر از درخواست قرار دارند. صف‌های بسیار بزرگ محدود می‌شوند و با `queuedAheadIsEstimate: true` گزارش می‌شوند.
- در صورت موجود بودن، `report` شامل بخش‌های `clawscan`، `skillspector`، `staticAnalysis`، و `virustotal` است.
- کارهای اسکن ناموفق `status: "failed"` را همراه با `lastError` برمی‌گردانند.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطهٔ پایانی آرشیو گزارش احراز هویت‌شده.

- به یک اسکن موفق نیاز دارد؛ اسکن‌های غیرنهایی `409` برمی‌گردانند.
- یک ZIP با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json`، و `README.md` برمی‌گرداند.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطهٔ پایانی آرشیو گزارش ذخیره‌شدهٔ احراز هویت‌شده برای نسخه‌های ارسال‌شده.

- به دسترسی مدیریتی مالک/ناشر به مهارت یا plugin، یا اختیار moderator/admin پلتفرم نیاز دارد.
- نتایج اسکن ذخیره‌شده برای همان نسخهٔ دقیق ارسال‌شده را برمی‌گرداند، از جمله نسخه‌های مسدود یا پنهان.
- مقدار پیش‌فرض `kind` برابر `skill` است؛ برای اسکن‌های plugin/package از `kind=plugin` استفاده کنید.
- همان شکل ZIP دانلودهای درخواست اسکن را برمی‌گرداند.

### `POST /api/v1/skills/-/scan/batch`

مسیر بازاسکن دسته‌ای canonical فقط برای admin. همان شکل محمولهٔ `POST /api/v1/skills/-/rescan-batch` قدیمی را می‌پذیرد.

### `POST /api/v1/skills/-/scan/batch/status`

مسیر وضعیت دسته‌ای canonical فقط برای admin. `{ "jobIds": ["..."] }` را می‌پذیرد و همان شمارنده‌های تجمیعی `POST /api/v1/skills/-/rescan-batch/status` قدیمی را برمی‌گرداند.

### `GET /api/v1/skills/{slug}/verify`

پوشش تأیید Skill Card مورد استفادهٔ `clawhub skill verify` را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشتهٔ نسخهٔ مشخص.
- `tag` (اختیاری): یک نسخهٔ برچسب‌خورده را resolve می‌کند (برای مثال `latest`).

نکات:

- `ok` فقط زمانی `true` است که نسخهٔ انتخاب‌شده یک Skill Card تولیدشده داشته باشد، توسط moderation به‌دلیل بدافزار مسدود نشده باشد، و تأیید ClawScan پاک باشد.
- هویت مهارت، هویت ناشر، و فرادادهٔ نسخهٔ انتخاب‌شده فیلدهای سطح بالای پوشش هستند (`slug`، `displayName`، `publisherHandle`، `version`، `resolvedFrom`، `tag`، `createdAt`) تا اتوماسیون shell بتواند آن‌ها را بدون باز کردن wrapperهای تو در تو بخواند.
- `security` رأی سطح بالای ClawScan/security است. اتوماسیون باید بر اساس `ok`، `decision`، `reasons`، و `security.status` عمل کند.
- `security.signals` شواهد پشتیبان اسکنر مانند `staticScan`، `virusTotal`، و `skillSpector` را شامل می‌شود.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 نگه داشته شده است، اما اسکنر وجود registry وابستگی بازنشسته شده و این کلید همیشه `null` است.
- `provenance` فقط زمانی `server-resolved-github-import` است که ClawHub هنگام انتشار یا import یک repo/ref/commit/path از GitHub را resolve و ذخیره کرده باشد؛ در غیر این صورت `unavailable` است.

### `POST /api/v1/skills/-/security-verdicts`

رأی‌های امنیتی فشردهٔ فعلی را برای نسخه‌های دقیق مهارت برمی‌گرداند. این
نقطهٔ پایانی مجموعه برای کلاینت‌هایی در نظر گرفته شده است که از قبل می‌دانند کدام نسخه‌های
مهارت ClawHub نصب‌شده را باید نمایش دهند، مانند OpenClaw Control UI.

درخواست:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

نکات:

- `items` باید شامل 1 تا 100 جفت یکتای `{ slug, version }` باشد.
- نتایج برای هر آیتم هستند؛ نبودن یک مهارت یا نسخه کل پاسخ را ناموفق نمی‌کند.
- پاسخ فقط امنیتی است. دادهٔ Skill Card، وضعیت کارت تولیدشده، فهرست فایل‌های artifact، یا محموله‌های مفصل اسکنر را شامل نمی‌شود.
- `security.signals` فقط شواهد پشتیبان در سطح وضعیت را شامل می‌شود؛ برای جزئیات کامل اسکنر از `/scan` یا صفحهٔ security-audit در ClawHub استفاده کنید.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 نگه داشته شده است، اما اسکنر وجود registry وابستگی بازنشسته شده و این کلید همیشه `null` است.
- نبود Skill Card بر `ok`، `decision`، یا `reasons` این نقطهٔ پایانی اثر نمی‌گذارد؛ کلاینت‌ها وقتی به محتوای کارت نیاز دارند باید `skill-card.md` نصب‌شده را به‌صورت محلی بخوانند.
- وقتی به پوشش تأیید Skill Card برای یک مهارت نیاز دارید از `/verify`، وقتی به markdown کارت تولیدشده نیاز دارید از `/card`، و وقتی به دادهٔ مفصل اسکنر نیاز دارید از `/scan` استفاده کنید.

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

- `path` (ضروری)
- `version` (اختیاری)
- `tag` (اختیاری)

یادداشت‌ها:

- به‌طور پیش‌فرض از آخرین نسخه استفاده می‌کند.
- محدودیت اندازه فایل: 200KB.

### `GET /api/v1/packages`

نقطه پایانی کاتالوگ یکپارچه برای:

- skills
- Pluginهای کد
- Pluginهای بسته‌ای

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended`، `trending`، `downloads`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins`، یا نقاط پایانی بسته با
  `family=code-plugin`/`family=bundle-plugin`). دسته‌بندی‌های کنترل‌شده و
  نام‌های مستعار فیلتر قدیمی v1 زیر `GET /api/v1/plugins` مستند شده‌اند.

یادداشت‌ها:

- مقدارهای نامعتبر برای `family`، `channel`، `isOfficial`، `featured`،
  `highlightedOnly`، یا `sort` مقدار `400` برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار با خانواده ثابت باقی می‌مانند.
- ورودی‌های Skill همچنان بر پایه رجیستری Skill پشتیبانی می‌شوند و هنوز فقط از طریق `POST /api/v1/skills` قابل انتشار هستند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخواننده‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند در نتایج فهرست/جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده بتواند بخواند.

### `GET /api/v1/packages/search`

جست‌وجوی کاتالوگ یکپارچه در Skills + بسته‌های Plugin.

پارامترهای پرس‌وجو:

- `q` (ضروری): رشته پرس‌وجو
- `limit` (اختیاری): عدد صحیح (1–100)
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد. دسته‌بندی‌های کنترل‌شده و
  نام‌های مستعار فیلتر قدیمی v1 زیر `GET /api/v1/plugins` مستند شده‌اند.

یادداشت‌ها:

- مقدارهای نامعتبر برای `family`، `channel`، `isOfficial`، `featured`، یا
  `highlightedOnly` مقدار `400` برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- فراخواننده‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده بتواند بخواند.

### `GET /api/v1/plugins`

مرور کاتالوگ فقط مخصوص Plugin در میان بسته‌های code-plugin و bundle-plugin.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `recommended` (پیش‌فرض)، `trending`، `downloads`، `updated`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقدارهای فعلی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نام‌های مستعار فیلتر قدیمی v1 همچنان در نقاط پایانی خواندن پذیرفته می‌شوند:

- `mcp-tooling`، `data`، و `automation` به `tools` نگاشت می‌شوند.
- `observability` و `deployment` به `gateway` نگاشت می‌شوند.
- `dev-tools` به `runtime` نگاشت می‌شود.

`trending` جدول رتبه‌بندی نصب/دانلود هفت‌روزه است و از مجموع کل زمان استفاده نمی‌کند.
در نقطه پایانی یکپارچه `/api/v1/packages` فقط مخصوص Plugin است؛ برای کاتالوگ Skill از
`/api/v1/skills?sort=trending` استفاده کنید.

نام‌های مستعار قدیمی به‌عنوان مقدارهای دسته‌بندی ذخیره‌شده یا اعلام‌شده توسط نویسنده پذیرفته نمی‌شوند.

### `GET /api/v1/skills/export`

خروجی انبوه از آخرین Skills عمومی برای تحلیل آفلاین.

احراز هویت:

- توکن API ضروری است.

پارامترهای پرس‌وجو:

- `startDate` (ضروری): حد پایین Unix بر حسب میلی‌ثانیه برای `updatedAt` Skill.
- `endDate` (ضروری): حد بالای Unix بر حسب میلی‌ثانیه برای `updatedAt` Skill.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.

پاسخ:

- بدنه: آرشیو ZIP.
- هر Skill صادرشده در `{publisher}/{slug}/` ریشه دارد.
- Skills میزبانی‌شده شامل فایل‌های آخرین نسخه ذخیره‌شده هستند و در
  `_manifest.json` با `sourceRef: "public-clawhub"` فهرست می‌شوند.
- Skills فعلی پشتیبانی‌شده با GitHub که اسکن `clean` یا `suspicious` دارند شامل
  `_source_handoff.json` با `sourceRef: "public-github"`، مخزن، کامیت، مسیر،
  هش محتوا، و URL آرشیو هستند. آن‌ها فایل‌های منبع میزبانی‌شده در ClawHub را شامل نمی‌شوند.
- هر Skill شامل `_export_skill_meta.json` است.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- وقتی Skills یا فایل‌های جداگانه قابل
  صادر کردن نباشند، `_errors.json` گنجانده می‌شود.

سرآیندها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

صدور گروهی آخرین انتشارهای عمومی Plugin برای تحلیل آفلاین.

احراز هویت:

- توکن API لازم است.

پارامترهای Query:

- `startDate` (الزامی): کران پایین بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `endDate` (الزامی): کران بالا بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی از پاسخ قبلی.
- `family` (اختیاری): `code-plugin` یا `bundle-plugin`. حذف آن یعنی هر دو
  خانواده Plugin.

پاسخ:

- بدنه: آرشیو ZIP.
- هر Plugin صادرشده در `{family}/{packageName}/` ریشه دارد.
- هر Plugin صادرشده شامل فایل‌های ذخیره‌شده آخرین انتشار است.
- فراداده صدور هر Plugin در
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

جست‌وجوی فقط Plugin در میان بسته‌های code-plugin و bundle-plugin.

پارامترهای Query:

- `q` (الزامی): رشته پرس‌وجو
- `limit` (اختیاری): عدد صحیح (1-100)
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقادیر فعلی:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

نکته‌ها:

- نام‌های مستعار فیلتر v1 قدیمی که زیر `GET /api/v1/plugins` مستند شده‌اند نیز
  پذیرفته می‌شوند.
- فیلتر دسته‌بندی یک فیلتر API واقعی است که بر ردیف‌های digest دسته‌بندی Plugin
  متکی است، نه بازنویسی پرس‌وجوی جست‌وجو.
- نتایج به ترتیب ارتباط برگردانده می‌شوند و در حال حاضر صفحه‌بندی نمی‌شوند.
- کنترل‌های مرتب‌سازی UI مرورگر برای جست‌وجوی Plugin نتایج بارگذاری‌شده بر اساس ارتباط را دوباره مرتب می‌کنند،
  مطابق با رفتار مرور فعلی `/skills`.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را برمی‌گرداند.

نکته‌ها:

- Skills نیز می‌توانند از طریق این مسیر در کاتالوگ یکپارچه resolve شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارها را soft-delete می‌کند.

نکته‌ها:

- به توکن API برای مالک بسته، مالک/مدیر ناشر سازمانی،
  ناظر پلتفرم، یا مدیر پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه را برمی‌گرداند.

پارامترهای Query:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

نکته‌ها:

- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را برمی‌گرداند، شامل فراداده فایل، سازگاری،
تأیید، فراداده artifact، و داده‌های اسکن.

نکته‌ها:

- `version.artifact.kind` برای آرشیوهای بسته دنیای قدیمی `legacy-zip` یا
  برای انتشارهای متکی بر ClawPack مقدار `npm-pack` است.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm به نام‌های `npmIntegrity`، `npmShasum`، و
  `npmTarballName` هستند.
- `version.sha256hash` فراداده سازگاری منسوخ برای کلاینت‌های قدیمی است. این
  همان بایت‌های دقیق ZIP را که توسط `/api/v1/packages/{name}/download` برگردانده می‌شوند hash می‌کند.
  کلاینت‌های مدرن باید از `version.artifact.sha256` استفاده کنند، که
  artifact انتشار canonical را شناسایی می‌کند.
- `version.vtAnalysis`، `version.llmAnalysis`، و `version.staticScan` وقتی داده اسکن وجود داشته باشد
  گنجانده می‌شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصه دقیق امنیت و اعتماد انتشار بسته را برای کلاینت‌های نصب برمی‌گرداند.
این سطح مصرف عمومی OpenClaw برای تصمیم‌گیری درباره این است که آیا یک
انتشار resolveشده قابل نصب است یا نه.

احراز هویت:

- endpoint خواندن عمومی. هیچ توکن مالک، ناشر، ناظر، یا مدیر
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

- `package.name`، `package.displayName`، و `package.family` بسته registry
  resolveشده را شناسایی می‌کنند.
- `release.releaseId`، `release.version`، و `release.createdAt`
  انتشار دقیق ارزیابی‌شده را شناسایی می‌کنند.
- `release.artifactKind`، `release.artifactSha256`، `release.npmIntegrity`,
  `release.npmShasum`، و `release.npmTarballName` وقتی برای
  artifact انتشار شناخته‌شده باشند حاضر هستند.
- `trust.scanStatus` وضعیت اعتماد مؤثر است که از ورودی‌های اسکنر
  و moderation دستی انتشار مشتق شده است.
- `trust.moderationState` می‌تواند null باشد. وقتی هیچ moderation دستی انتشار
  وجود نداشته باشد، مقدار آن `null` است.
- `trust.blockedFromDownload` سیگنال مسدودسازی نصب است. OpenClaw و سایر
  کلاینت‌های نصب باید وقتی این مقدار `true` است نصب را مسدود کنند، به‌جای اینکه
  قواعد مسدودسازی را دوباره از فیلدهای اسکنر یا moderation مشتق کنند.
- `trust.reasons` فهرست توضیح کاربرپسند و audit است. کدهای دلیل
  رشته‌های پایدار و فشرده‌ای مانند `manual:quarantined`، `scan:malicious`،
  و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد هنوز در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصه اعتماد از ورودی‌های قدیمی محاسبه شده و
  باید پیش از تصمیم allow با اطمینان بالا، نیازمند refresh تلقی شود.

نکته‌ها:

- این endpoint دقیقاً وابسته به نسخه است. کلاینت‌ها باید پس از resolve کردن
  نسخه بسته‌ای که قصد نصب آن را دارند آن را فراخوانی کنند، نه صرفاً پس از خواندن آخرین
  فراداده بسته.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.
- این endpoint عمداً از endpointهای moderation مالک/ناظر محدودتر است.
  تصمیم نصب و توضیح عمومی را افشا می‌کند، نه هویت‌های گزارش‌دهنده،
  بدنه گزارش‌ها، شواهد خصوصی، یا timelineهای بررسی داخلی.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده resolver صریح artifact را برای یک نسخه بسته برمی‌گرداند.

نکته‌ها:

- نسخه‌های بسته قدیمی یک artifact از نوع `legacy-zip` و یک
  `downloadUrl` قدیمی ZIP برمی‌گردانند.
- نسخه‌های ClawPack یک artifact از نوع `npm-pack`، فیلدهای integrity مربوط به npm، یک
  `tarballUrl`، و URL سازگاری ZIP قدیمی را برمی‌گردانند.
- این سطح resolver مربوط به OpenClaw است؛ از حدس زدن قالب آرشیو از
  یک URL مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

artifact نسخه را از مسیر resolver صریح دانلود می‌کند.

نکته‌ها:

- نسخه‌های ClawPack همان بایت‌های دقیق `.tgz` مربوط به npm-pack آپلودشده را stream می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` redirect می‌شوند.
- از bucket نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آینده OpenClaw را برمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر هستند:

- وضعیت کانال رسمی
- در دسترس بودن آخرین نسخه
- در دسترس بودن artifact npm-pack مربوط به ClawPack
- digest artifact
- منشأ repo منبع و commit
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

endpoint ناظر برای فهرست کردن ردیف‌های مهاجرت Plugin رسمی OpenClaw.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای Query:

- `phase` (اختیاری): `planned`، `published`، `clawpack-ready`،
  `legacy-zip-only`، `metadata-ready`، `blocked`، `ready-for-openclaw`، یا
  `all` (پیش‌فرض).
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

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

endpoint مدیر برای ایجاد یا به‌روزرسانی ردیف مهاجرت Plugin رسمی.

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

نکته‌ها:

- `bundledPluginId` به حروف کوچک normalize می‌شود و کلید upsert پایدار است.
- `packageName` به شکل نام npm normalize می‌شود؛ بسته می‌تواند برای مهاجرت‌های برنامه‌ریزی‌شده
  وجود نداشته باشد.
- این فقط آمادگی مهاجرت را ردیابی می‌کند. OpenClaw را تغییر نمی‌دهد یا
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

endpoint ناظر/مدیر برای صف‌های بررسی انتشار بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای Query:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

معانی وضعیت:

- `open`: انتشارهای مشکوک، مخرب، pending، قرنطینه‌شده، revoked، یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، revoked، یا مخرب.
- `manual`: هر انتشاری با override دستی moderation.
- `all`: هر انتشاری با override دستی، وضعیت اسکن غیر clean، یا گزارش بسته.

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

گزارش یک بسته برای بررسی ناظر. گزارش‌ها در سطح بسته هستند و به‌صورت اختیاری
به یک نسخه پیوند می‌خورند. آن‌ها صف moderation را تغذیه می‌کنند، اما به‌تنهایی
دانلودها را به‌طور خودکار پنهان یا مسدود نمی‌کنند؛ ناظران باید از moderation انتشار برای
تأیید، قرنطینه کردن، یا revoke کردن artifactها استفاده کنند.

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

نقطه پایانی moderator/admin برای دریافت گزارش‌های بسته.

احراز هویت:

- به توکن API برای کاربر moderator یا admin نیاز دارد.

پارامترهای query:

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

نقطه پایانی مالک/moderator برای مشاهده وضعیت moderation بسته.

احراز هویت:

- به توکن API برای مالک بسته، عضو ناشر، moderator، یا
  کاربر admin نیاز دارد.

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

نقطه پایانی moderator/admin برای حل‌وفصل یا بازگشایی گزارش‌های بسته.

درخواست:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام
برگرداندن `status` به `open` می‌توان آن را حذف کرد. برای اعمال moderation انتشار در همان
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

نقطه پایانی moderator/admin برای بررسی انتشار بسته.

درخواست:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

وضعیت‌های پشتیبانی‌شده:

- `approved`: به‌صورت دستی بررسی و مجاز شده است.
- `quarantined`: تا زمان پیگیری بعدی مسدود شده است.
- `revoked`: پس از آن‌که یک انتشار قبلاً قابل اعتماد بوده، مسدود شده است.

انتشارهای قرنطینه‌شده و باطل‌شده از مسیرهای دانلود artifact مقدار `403` برمی‌گردانند.
هر تغییر یک ورودی audit log می‌نویسد.

### `GET /api/v1/packages/{name}/file`

محتوای متنی خام یک فایل بسته را برمی‌گرداند.

پارامترهای query:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض، آخرین انتشار است.
- از bucket نرخ خواندن استفاده می‌کند، نه bucket دانلود.
- فایل‌های باینری `415` برمی‌گردانند.
- محدودیت اندازه فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن را مسدود نمی‌کنند؛ انتشارهای مخرب ممکن است همچنان در جای دیگری نگه داشته شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی legacy را برای انتشار یک بسته دانلود می‌کند.

پارامترهای query:

- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض، آخرین انتشار است.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشه `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP باقی می‌ماند. فایل‌های ClawPack `.tgz` را stream نمی‌کند.
- پاسخ‌ها برای بررسی‌های یکپارچگی resolver شامل headerهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` هستند.
- فراداده‌ی فقط registry به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک packument سازگار با npm را برای نسخه‌های بسته مبتنی بر ClawPack برمی‌گرداند.

نکته‌ها:

- فقط نسخه‌هایی فهرست می‌شوند که tarballهای npm-pack مربوط به ClawPack برای آن‌ها بارگذاری شده باشد.
- نسخه‌های legacy فقط-ZIP عمداً حذف می‌شوند.
- `dist.tarball`، `dist.integrity`، و `dist.shasum` از فیلدهای سازگار با npm استفاده می‌کنند
  تا کاربران در صورت تمایل بتوانند npm را به mirror اشاره دهند.
- packumentهای بسته scoped هم از `/api/npm/@scope/name` و هم از مسیر درخواست
  encoded `/api/npm/@scope%2Fname` متعلق به npm پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball بارگذاری‌شده ClawPack را برای کلاینت‌های mirror npm stream می‌کند.

نکته‌ها:

- از bucket نرخ دانلود استفاده می‌کند.
- headerهای دانلود شامل SHA-256 مربوط به ClawHub به‌علاوه فراداده integrity/shasum مربوط به npm هستند.
- بررسی‌های moderation و دسترسی بسته خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

CLI از آن برای نگاشت یک اثرانگشت محلی به یک نسخه شناخته‌شده استفاده می‌کند.

پارامترهای query:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز 64 کاراکتری اثرانگشت bundle

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک ZIP نسخه skill میزبانی‌شده را دانلود می‌کند، یا برای یک skill فعلی مبتنی بر GitHub با اسکن `clean` یا `suspicious` و بدون
نسخه میزبانی‌شده، واگذاری منبع GitHub را برمی‌گرداند.

پارامترهای query:

- `slug` (الزامی)
- `version` (اختیاری): رشته semver
- `tag` (اختیاری): نام tag (مثلاً `latest`)

نکته‌ها:

- اگر نه `version` و نه `tag` ارائه نشود، از آخرین نسخه استفاده می‌شود.
- نسخه‌های soft-delete شده `410` برمی‌گردانند.
- واگذاری‌های skill مبتنی بر GitHub، بایت‌ها را proxy یا mirror نمی‌کنند. پاسخ JSON
  شامل `sourceRef: "public-github"`، `repo`، `commit`، `path`، `contentHash`،
  و `archiveUrl` است؛ وضعیت scan/current یک gate است و به‌عنوان فراداده payload موفقیت
  گنجانده نمی‌شود.
- آمار دانلود به‌صورت هویت‌های یکتا در هر روز UTC شمرده می‌شود (`userId` هنگام معتبر بودن توکن API، در غیر این صورت IP).

## نقاط پایانی احراز هویت (Bearer token)

همه نقاط پایانی نیاز دارند به:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

توکن را اعتبارسنجی می‌کند و handle کاربر را برمی‌گرداند.

### `POST /api/v1/skills`

یک نسخه جدید منتشر می‌کند.

- ترجیحی: `multipart/form-data` با JSON `payload` + blobهای `files[]`.
- بدنه JSON با `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. در صورت وجود، API آن
  ناشر را سمت سرور resolve می‌کند و از actor می‌خواهد دسترسی ناشر داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` مقدار `true` باشد،
  یک skill موجود می‌تواند به آن مالک منتقل شود اگر actor در هر دو
  ناشر فعلی و هدف admin/owner باشد. بدون این opt-in، تغییرات مالک
  رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت Bearer token نیاز دارد.
- به `multipart/form-data` نیاز دارد.
- فیلدهای مجاز فرم عبارت‌اند از `payload`، blobهای تکرارشونده `files`، یا یک ارجاع tarball
  `clawpack`. `clawpack` می‌تواند یک blob `.tgz` یا storage id برگردانده‌شده توسط
  جریان upload-url باشد. انتشارهای stage شده با storage-id باید همچنین
  `clawpackUploadTicket` برگردانده‌شده با آن URL بارگذاری را شامل شوند.
- یا از `files` استفاده کنید یا از `clawpack`، هرگز هر دو را در یک درخواست به‌کار نبرید.
- بدنه‌های JSON و فراداده `payload.files` / `payload.artifact`
  ارائه‌شده توسط فراخواننده رد می‌شوند.
- درخواست‌های انتشار مستقیم multipart به 18MB محدود هستند. tarballهای ClawPack می‌توانند
  تا سقف tarball برابر با 120MB از جریان upload-url استفاده کنند.
- فیلد اختیاری payload: `ownerHandle`. در صورت وجود، فقط adminها می‌توانند از طرف آن مالک منتشر کنند.

نکات برجسته اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های ClawPack `.tgz` باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- Pluginهای کد به `package.json`، فراداده مخزن منبع، فراداده commit منبع،
  فراداده schema پیکربندی، `openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
- فقط ناشر org با نام `openclaw` و ناشران شخصی اعضای فعلی org با نام `openclaw`
  می‌توانند در کانال `official` منتشر کنند.
- انتشارهای ازطرف‌دیگری همچنان شایستگی کانال official را نسبت به حساب مالک هدف اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

soft-delete / بازیابی یک skill (مالک، moderator، یا admin).

بدنه JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

در صورت وجود، `reason` به‌عنوان یادداشت moderation مربوط به skill ذخیره می‌شود و در audit log کپی می‌گردد.
soft deleteهای آغازشده توسط مالک، slug را برای 30 روز رزرو می‌کنند، سپس slug می‌تواند توسط
ناشر دیگری claim شود. وقتی این انقضا اعمال شود، پاسخ حذف شامل `slugReservedUntil` است.
پنهان‌سازی‌های moderator/admin و حذف‌های امنیتی به این شکل منقضی نمی‌شوند.

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

فقط admin. اطمینان می‌دهد یک ناشر org برای یک handle وجود دارد. اگر handle همچنان به یک
ناشر legacy مشترک کاربر/شخصی اشاره کند، نقطه پایانی ابتدا آن را به یک ناشر org مهاجرت می‌دهد.
برای org تازه‌ساخته‌شده، `memberHandle` را ارائه کنید؛ admin عامل به‌عنوان عضو اضافه نمی‌شود.
`memberRole` به‌صورت پیش‌فرض `owner` است.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

ایجاد ناشر org به‌صورت self-serve و احراز هویت‌شده. یک ناشر org جدید ایجاد می‌کند و
فراخواننده را به‌عنوان owner اضافه می‌کند. این نقطه پایانی handleهای موجود کاربر/شخصی را migrate نمی‌کند و
ناشر را trusted/official علامت‌گذاری نمی‌کند.

- بدنه: `{ "handle": "opik", "displayName": "Opik" }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- وقتی handle از قبل توسط یک ناشر، کاربر، یا ناشر شخصی استفاده شده باشد، `409` برمی‌گرداند.

### `POST /api/v1/users/reserve`

فقط admin. slugهای ریشه و نام‌های بسته را بدون انتشار
یک release برای مالک برحق رزرو می‌کند. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف release تبدیل می‌شوند، تا همان
مالک بتواند بعداً انتشار واقعی code-plugin یا bundle-plugin را در آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

فقط admin. یک ناشر شخصی را برای principal جایگزین تأییدشده GitHub OAuth
بدون ویرایش ردیف‌های حساب Convex Auth بازیابی می‌کند. درخواست باید هر دو شناسه تغییرناپذیر حساب
provider GitHub را نام ببرد؛ handleهای تغییرپذیر فقط به‌عنوان محافظ روبه‌روی operator استفاده می‌شوند.

نقطهٔ پایانی به‌طور پیش‌فرض روی اجرای آزمایشی تنظیم است. اعمال بازیابی پس از آنکه کارکنان به‌طور مستقل تداوم بین هر دو
principal گیت‌هاب را راستی‌آزمایی کردند، به `dryRun: false` و
`confirmIdentityVerified: true` نیاز دارد. وقتی ناشر شخصی فعلی کاربر مقصد
skills، بسته‌ها، یا منابع skill گیت‌هاب داشته باشد، بازیابی به‌صورت بسته شکست می‌خورد.
بازیابی همچنین فیلدهای قدیمی `ownerUserId` را برای skills ناشر بازیابی‌شده،
نام‌های مستعار slug مربوط به skill، بسته‌ها، هشدارهای بازرس بسته، و ردیف‌های digest جستجوی مشتق‌شده مهاجرت می‌دهد تا
مسیرهای مالک مستقیم با اختیار ناشر جدید هم‌خوان شوند. رزرو فعال handle محافظت‌شده
برای handle بازیابی‌شده نیز به کاربر جایگزین بازاختصاص داده می‌شود تا همگام‌سازی بعدی
نمایه نتواند اختیار رقیب کاربر قبلی را بازگرداند. هر جدول اصلی در هر تراکنش اعمال به
۱۰۰ ردیف محدود است؛ بازیابی‌های بزرگ‌تر باید ابتدا از مهاجرت مالک قابل‌ازسرگیری استفاده کنند.
منابع skill گیت‌هاب در محدودهٔ ناشر هستند و به‌جای بازنویسی، به‌صورت بررسی‌شده گزارش می‌شوند.

- بدنه: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "تداوم حساب برای issue #2555 راستی‌آزمایی شد", "confirmIdentityVerified": true, "dryRun": false }`
- پاسخ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "تداوم حساب برای issue #2555 راستی‌آزمایی شد" }`

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
- `merge` فهرست منبع را پنهان می‌کند و slug منبع را به فهرست مقصد تغییرمسیر می‌دهد.

### نقطه‌های پایانی انتقال مالکیت

- `POST /api/v1/skills/{slug}/transfer`
  - بدنه: `{ "toUserHandle": "target_handle", "message": "اختیاری" }`
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
{ "handle": "user_handle", "reason": "دلیل اختیاری مسدودسازی" }
```

یا

```json
{ "userId": "users_...", "reason": "دلیل اختیاری مسدودسازی" }
```

پاسخ:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

رفع مسدودیت یک کاربر و بازیابی skills واجد شرایط (فقط مدیر).

بدنه:

```json
{ "handle": "user_handle", "reason": "دلیل اختیاری رفع مسدودیت" }
```

یا

```json
{ "userId": "users_...", "reason": "دلیل اختیاری رفع مسدودیت" }
```

پاسخ:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

دلیل ذخیره‌شده برای یک مسدودسازی موجود را بدون رفع مسدودیت یا بازیابی
محتوا تغییر می‌دهد (فقط مدیر). مگر آنکه `dryRun` برابر `false` باشد، پیش‌فرض اجرای آزمایشی است.

بدنه:

```json
{ "handle": "user_handle", "reason": "هرزنامه انتشار انبوه", "dryRun": true }
```

یا

```json
{ "userId": "users_...", "reason": "هرزنامه انتشار انبوه", "dryRun": false }
```

پاسخ:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "مسدودسازی خودکار بدافزار",
  "nextReason": "هرزنامه انتشار انبوه",
  "changed": true
}
```

### `POST /api/v1/users/role`

نقش کاربر را تغییر می‌دهد (فقط مدیر).

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

فهرست کردن یا جستجوی کاربران (فقط مدیر).

پارامترهای پرس‌وجو:

- `q` (اختیاری): عبارت جستجو
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

افزودن/حذف ستاره (برجسته‌سازی‌ها). هر دو نقطهٔ پایانی idempotent هستند.

پاسخ‌ها:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقطه‌های پایانی CLI قدیمی (منسوخ‌شده)

برای نسخه‌های قدیمی‌تر CLI همچنان پشتیبانی می‌شود:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

برای برنامهٔ حذف، `DEPRECATIONS.md` را ببینید.

`POST /api/cli/upload-url` مقدارهای `uploadUrl` و `uploadTicket` را برمی‌گرداند. انتشارهای بسته که یک tarball از ClawPack را stage می‌کنند، باید شناسهٔ storage حاصل را به‌عنوان
`clawpack` و ticket برگشتی را به‌عنوان `clawpackUploadTicket` ارسال کنند.

## کشف رجیستری (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات رجیستری/احراز هویت را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر خودمیزبانی می‌کنید، این فایل را سرو کنید (یا `CLAWHUB_REGISTRY` را صراحتاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی).
