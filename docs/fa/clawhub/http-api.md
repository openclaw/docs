---
read_when:
    - افزودن/تغییر endpointها
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع HTTP API (نقاط پایانی عمومی + CLI + احراز هویت).
x-i18n:
    generated_at: "2026-06-28T00:10:32Z"
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
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی مانده‌اند (به `DEPRECATIONS.md` مراجعه کنید).
OpenAPI: `/api/v1/openapi.json`.

## استفادهٔ دوباره از کاتالوگ عمومی

دایرکتوری‌های شخص ثالث می‌توانند از endpointهای خواندن عمومی برای فهرست‌کردن یا جست‌وجوی Skillsهای ClawHub استفاده کنند. لطفاً نتایج را cache کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست canonical ClawHub برگردانید (`https://clawhub.ai/<owner>/skills/<slug>`)، و از القای تأیید سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای پنهان، خصوصی، یا مسدودشده توسط moderation را بیرون از سطح API عمومی mirror کنید.

میان‌برهای slug وب در خانواده‌های registry resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی تقدم route، از URLهای canonical برگشتی از endpointهای خواندن استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (Bearer token معتبر): به‌ازای bucket کاربر اعمال می‌شود.
- اگر token موجود نباشد یا نامعتبر باشد، رفتار به اعمال بر پایهٔ IP برمی‌گردد.
- endpointهای نوشتن احراز هویت‌شده وقتی سرور دلیل را می‌داند نباید یک `Unauthorized` خالی برگردانند. tokenهای مفقود، tokenهای نامعتبر/لغوشده، و حساب‌های حذف‌شده/مسدودشده/غیرفعال هرکدام باید متن قابل اقدام دریافت کنند تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی آن‌ها را مسدود کرده است.

- خواندن: 3000/min به‌ازای هر IP، 12000/min به‌ازای هر key
- نوشتن: 300/min به‌ازای هر IP، 3000/min به‌ازای هر key
- دانلود: 1200/min به‌ازای هر IP، 6000/min به‌ازای هر key (endpointهای دانلود)

Headerها:

- سازگاری قدیمی: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`, `RateLimit-Reset`
- روی `429`: `X-RateLimit-Remaining: 0` و `RateLimit-Remaining: 0`
- روی `429`: `Retry-After`

معنای headerها:

- `X-RateLimit-Reset`: ثانیه‌های absolute Unix epoch
- `RateLimit-Reset`: ثانیه تا reset (تأخیر)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجهٔ باقی‌ماندهٔ دقیق، وقتی موجود باشد.
  درخواست‌های موفق sharded این header را حذف می‌کنند، به‌جای اینکه یک مقدار جهانی تقریبی برگردانند.
- `Retry-After`: ثانیه‌های انتظار پیش از تلاش دوباره (تأخیر) روی `429`

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

- اگر `Retry-After` وجود دارد، پیش از تلاش دوباره همان تعداد ثانیه صبر کنید.
- برای جلوگیری از تلاش‌های دوبارهٔ هم‌زمان، از backoff همراه با jitter استفاده کنید.
- اگر `Retry-After` موجود نیست، به `RateLimit-Reset` fallback کنید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- فقط وقتی deployment به‌صورت صریح headerهای trusted forwarded را فعال کرده باشد، از headerهای IP کلاینت trusted، از جمله `cf-connecting-ip`، استفاده می‌کند.
- ClawHub از headerهای trusted forwarding برای شناسایی IPهای کلاینت در edge استفاده می‌کند.
- اگر IP کلاینت trusted در دسترس نباشد، درخواست‌های ناشناس از bucketهای fallback استفاده می‌کنند که فقط با نوع rate-limit scoped شده‌اند. این bucketهای fallback شامل pathهای ارائه‌شده توسط caller، slugها، نام packageها، versionها، query stringها، یا دیگر پارامترهای artifact نیستند.

## پاسخ‌های خطا

پاسخ‌های خطای عمومی v1 متن ساده با `content-type: text/plain; charset=utf-8` هستند.
این شامل شکست‌های اعتبارسنجی (`400`)، resourceهای عمومی مفقود (`404`)، شکست‌های auth و permission (`401`/`403`)، محدودیت‌های نرخ (`429`)، و دانلودهای مسدودشده است. کلاینت‌ها باید بدنهٔ پاسخ را به‌عنوان رشته‌ای قابل‌خواندن برای انسان بخوانند. پارامترهای query ناشناخته برای سازگاری نادیده گرفته می‌شوند، اما پارامترهای query شناخته‌شده با مقادیر نامعتبر `400` برمی‌گردانند.

## endpointهای عمومی (بدون auth)

### `GET /api/v1/search`

پارامترهای query:

- `q` (الزامی): رشتهٔ query
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): `true` برای محدودکردن به Skillsهای highlighted
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن Skillsهای suspicious (`flagged.suspicious`)
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

- نتایج به ترتیب مرتبط‌بودن برگردانده می‌شوند (شباهت embedding + تقویت tokenهای دقیق slug/name + یک prior کوچک popularity).
- مرتبط‌بودن از popularity قوی‌تر است. یک تطابق دقیق slug یا token نام نمایشی می‌تواند از تطابقی آزادتر با engagement بسیار قوی‌تر رتبهٔ بالاتری بگیرد.
- متن ASCII روی مرزهای کلمه و punctuation به token تبدیل می‌شود. برای مثال، `personal-map` شامل token مستقل `map` است، در حالی‌که `amap-jsapi-skill` شامل `amap`، `jsapi`، و `skill` است؛ بنابراین جست‌وجوی `map` به `personal-map` تطابق lexical قوی‌تری نسبت به `amap-jsapi-skill` می‌دهد.
- Popularity به‌صورت log-scaled و capped است. Skillsهای با engagement بالا وقتی متن query تطابق ضعیف‌تری دارد می‌توانند رتبهٔ پایین‌تری بگیرند.
- وضعیت moderation مشکوک یا پنهان می‌تواند بسته به filterهای caller و وضعیت فعلی moderation، یک Skill را از جست‌وجوی عمومی حذف کند.

راهنمای discoverability ناشر:

- اصطلاحاتی را که کاربران دقیقاً جست‌وجو خواهند کرد در نام نمایشی، خلاصه، و tagها قرار دهید. فقط وقتی از token مستقل slug استفاده کنید که همان هم یک هویت پایدار باشد که می‌خواهید حفظ کنید.
- فقط برای دنبال‌کردن یک query، slug را تغییر نام ندهید مگر اینکه slug جدید نام canonical بلندمدت بهتری باشد. slugهای قدیمی به aliasهای redirect تبدیل می‌شوند، اما URL canonical، slug نمایش‌داده‌شده، و digestهای جست‌وجوی آینده از slug جدید استفاده می‌کنند.
- aliasهای تغییر نام، resolve شدن URLهای قدیمی و نصب‌هایی را که از طریق registry resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو پس از index شدن rename بر پایهٔ metadata canonical Skill است. آمار موجود با Skill باقی می‌ماند.
- اگر یک Skill به‌طور غیرمنتظره نامرئی است، پیش از تغییر metadata مرتبط با رتبه‌بندی، ابتدا وضعیت moderation را با `clawhub inspect @owner/slug` در حالت logged in بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): cursor صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended` (alias: `default`)، `createdAt` (alias: `newest`)، `downloads`، `stars` (alias: `rating`)، aliasهای نصب قدیمی `installsCurrent`/`installs`/`installsAllTime` به `downloads` map می‌شوند، `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن Skillsهای suspicious (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): alias قدیمی برای `nonSuspiciousOnly`

مقادیر نامعتبر `sort` مقدار `400` برمی‌گردانند.

نکته‌ها:

- `recommended` از سیگنال‌های engagement و recency استفاده می‌کند.
- `trending` بر پایهٔ نصب‌ها در ۷ روز گذشته رتبه‌بندی می‌کند (بر پایهٔ telemetry).
- `createdAt` برای crawlهای Skill جدید پایدار است؛ `updated` وقتی Skillsهای موجود دوباره publish شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` باشد، sortهای cursor-based ممکن است به‌دلیل filter شدن Skillsهای suspicious پس از دریافت صفحه، تعداد itemهای کمتری از `limit` در یک صفحه برگردانند.
- وقتی `nextCursor` موجود است، از آن برای ادامهٔ صفحه‌بندی استفاده کنید. یک صفحهٔ کوتاه به‌تنهایی به‌معنی پایان نتایج نیست.

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

- slugهای قدیمی ایجادشده توسط جریان‌های تغییر نام/merge مالک به Skill canonical resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter مهارت (مثلاً `["macos"]`، `["linux"]`). اگر اعلام نشده باشد `null`.
- `metadata.systems`: هدف‌های system در Nix (مثلاً `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد `null`.
- اگر مهارت metadata پلتفرم نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط وقتی درج می‌شود که مهارت flagged باشد یا مالک در حال مشاهدهٔ آن باشد.

### `GET /api/v1/skills/{slug}/moderation`

وضعیت moderation ساختاریافته را برمی‌گرداند.

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

- مالکان و moderatorها می‌توانند به جزئیات moderation برای Skillsهای پنهان دسترسی داشته باشند.
- callerهای عمومی فقط برای Skillsهای visible که از قبل flagged شده‌اند `200` دریافت می‌کنند.
- Evidence برای callerهای عمومی redacted است و فقط برای مالکان/moderatorها snippetهای خام را شامل می‌شود.

### `POST /api/v1/skills/{slug}/report`

یک مهارت را برای بازبینی moderator گزارش کنید. گزارش‌ها در سطح مهارت هستند، به‌صورت اختیاری به یک version پیوند می‌خورند، و queue گزارش مهارت را تغذیه می‌کنند.

Auth:

- به API token نیاز دارد.

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

endpoint مربوط به moderator/admin برای دریافت گزارش‌های مهارت.

پارامترهای query:

- `status` (اختیاری): `open` (پیش‌فرض)، `confirmed`، `dismissed`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-200)
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

endpoint مربوط به moderator/admin برای resolve کردن یا reopen کردن گزارش‌های مهارت.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام تنظیم دوبارهٔ `status` به `open` می‌تواند حذف شود. برای پنهان‌کردن مهارت در همان workflow قابل audit، همراه با گزارش triaged مقدار `finalAction: "hide"` را ارسال کنید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): cursor صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

metadata version + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` شامل وضعیت verification اسکن نرمال‌شده و جزئیات scanner است
  (VirusTotal + LLM)، وقتی در دسترس باشد.

### `GET /api/v1/skills/{slug}/scan`

جزئیات verification اسکن امنیتی را برای version یک مهارت برمی‌گرداند.

پارامترهای query:

- `version` (اختیاری): رشتهٔ version مشخص.
- `tag` (اختیاری): resolve کردن یک version برچسب‌خورده (برای مثال `latest`).

نکته‌ها:

- اگر هیچ‌کدام از `version` یا `tag` ارائه نشود، از آخرین نسخه استفاده می‌کند.
- شامل وضعیت راستی‌آزمایی نرمال‌شده به‌همراه جزئیات ویژهٔ اسکنر است.
- `security.hasScanResult` فقط زمانی `true` است که یک اسکنر رأی قطعی تولید کرده باشد (`clean`، `suspicious`، یا `malicious`).
- `moderation` یک نمای لحظه‌ای فعلی از تعدیل در سطح skill است که از آخرین نسخه مشتق شده است.
- هنگام پرس‌وجوی یک نسخهٔ تاریخی، پیش از اینکه `moderation` و `security` را متعلق به همان زمینهٔ نسخه بدانید، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

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

- بارهای درخواست اسکن و گزارش‌های قابل دانلود پس از پنجرهٔ نگه‌داری از مخزن درخواست اسکن منقضی می‌شوند.
- اسکن‌های منتشرشده به دسترسی مدیریتی مالک/ناشر، یا اختیار ناظر/مدیر پلتفرم نیاز دارند.
- اسکن‌های منتشرشده فقط زمانی بازنویسی می‌کنند که `update: true` باشد و اسکن با موفقیت کامل شود.
- پاسخ `202` با `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` است.
- کارهای اسکن ناهمگام هستند. درخواست‌های اسکن دستی نسبت به کارهای عادی انتشار/پس‌پرکنی اولویت دارند، اما تکمیل همچنان به در دسترس بودن worker بستگی دارد.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطهٔ پایانی نظرسنجی احراز هویت‌شده برای یک اسکن ارسال‌شده.

- وضعیت در صف/در حال اجرا/موفق/ناموفق را برمی‌گرداند.
- هنگام در صف بودن، `queue.queuedAhead` و `queue.position` را برمی‌گرداند تا کلاینت‌ها بتوانند نشان دهند چند اسکن دستی اولویت‌دار جلوتر از درخواست قرار دارد. صف‌های بسیار بزرگ محدود می‌شوند و با `queuedAheadIsEstimate: true` گزارش می‌شوند.
- در صورت موجود بودن، `report` شامل بخش‌های `clawscan`، `skillspector`، `staticAnalysis`، و `virustotal` است.
- کارهای اسکن ناموفق `status: "failed"` را همراه با `lastError` برمی‌گردانند.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطهٔ پایانی آرشیو گزارش احراز هویت‌شده.

- به یک اسکن موفق نیاز دارد؛ اسکن‌های غیرنهایی `409` برمی‌گردانند.
- یک ZIP شامل `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json`، و `README.md` برمی‌گرداند.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطهٔ پایانی آرشیو گزارش ذخیره‌شدهٔ احراز هویت‌شده برای نسخه‌های ارسال‌شده.

- به دسترسی مدیریتی مالک/ناشر به skill یا plugin، یا اختیار ناظر/مدیر پلتفرم نیاز دارد.
- نتایج اسکن ذخیره‌شده را برای همان نسخهٔ دقیق ارسال‌شده برمی‌گرداند، از جمله نسخه‌های مسدودشده یا پنهان.
- مقدار پیش‌فرض `kind` برابر `skill` است؛ برای اسکن‌های plugin/package از `kind=plugin` استفاده کنید.
- همان شکل ZIP دانلودهای درخواست اسکن را برمی‌گرداند.

### `POST /api/v1/skills/-/scan/batch`

مسیر بازاسکن دسته‌ای canonical فقط برای مدیران. همان شکل بار `POST /api/v1/skills/-/rescan-batch` قدیمی را می‌پذیرد.

### `POST /api/v1/skills/-/scan/batch/status`

مسیر وضعیت دسته‌ای canonical فقط برای مدیران. `{ "jobIds": ["..."] }` را می‌پذیرد و همان شمارنده‌های تجمیعی `POST /api/v1/skills/-/rescan-batch/status` قدیمی را برمی‌گرداند.

### `GET /api/v1/skills/{slug}/verify`

پاکت راستی‌آزمایی Skill Card مورد استفادهٔ `clawhub skill verify` را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشتهٔ نسخهٔ مشخص.
- `tag` (اختیاری): یک نسخهٔ برچسب‌خورده را resolve می‌کند (برای مثال `latest`).

نکات:

- `ok` فقط زمانی `true` است که نسخهٔ انتخاب‌شده یک Skill Card تولیدشده داشته باشد، توسط تعدیل به‌عنوان بدافزار مسدود نشده باشد، و راستی‌آزمایی ClawScan پاک باشد.
- هویت skill، هویت ناشر، و فرادادهٔ نسخهٔ انتخاب‌شده فیلدهای سطح بالای پاکت هستند (`slug`، `displayName`، `publisherHandle`، `version`، `resolvedFrom`، `tag`، `createdAt`) تا خودکارسازی shell بتواند آن‌ها را بدون باز کردن wrapperهای تودرتو بخواند.
- `security` رأی سطح بالای ClawScan/امنیت است. خودکارسازی باید بر اساس `ok`، `decision`، `reasons`، و `security.status` عمل کند.
- `security.signals` شامل شواهد پشتیبان اسکنر مانند `staticScan`، `virusTotal`، و `skillSpector` است.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- `provenance` فقط زمانی `server-resolved-github-import` است که ClawHub هنگام انتشار یا وارد کردن، repo/ref/commit/path مربوط به GitHub را resolve و ذخیره کرده باشد؛ در غیر این صورت `unavailable` است.

### `POST /api/v1/skills/-/security-verdicts`

رأی‌های فشردهٔ امنیتی فعلی را برای نسخه‌های دقیق skill برمی‌گرداند. این
نقطهٔ پایانی مجموعه برای کلاینت‌هایی در نظر گرفته شده است که از قبل می‌دانند کدام نسخه‌های skill نصب‌شدهٔ
ClawHub را باید نمایش دهند، مانند OpenClaw Control UI.

درخواست:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

نکات:

- `items` باید شامل 1 تا 100 جفت یکتای `{ slug, version }` باشد.
- نتایج برای هر مورد جداگانه هستند؛ نبودن یک skill یا نسخه باعث شکست کل پاسخ نمی‌شود.
- پاسخ فقط امنیتی است. دادهٔ Skill Card، وضعیت کارت تولیدشده، فهرست فایل‌های artifact، یا بارهای تفصیلی اسکنر را شامل نمی‌شود.
- `security.signals` فقط شامل شواهد پشتیبان در سطح وضعیت است؛ برای جزئیات کامل اسکنر از `/scan` یا صفحهٔ security-audit در ClawHub استفاده کنید.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- نبود Skill Card روی `ok`، `decision`، یا `reasons` این نقطهٔ پایانی اثری ندارد؛ کلاینت‌ها وقتی به محتوای کارت نیاز دارند باید `skill-card.md` نصب‌شده را به‌صورت محلی بخوانند.
- وقتی به پاکت راستی‌آزمایی Skill Card برای یک skill تکی نیاز دارید از `/verify` استفاده کنید، وقتی به markdown کارت تولیدشده نیاز دارید از `/card` استفاده کنید، و وقتی به دادهٔ تفصیلی اسکنر نیاز دارید از `/scan` استفاده کنید.

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

پارامترهای Query:

- `path` (ضروری)
- `version` (اختیاری)
- `tag` (اختیاری)

یادداشت‌ها:

- به‌طور پیش‌فرض از آخرین نسخه استفاده می‌کند.
- محدودیت اندازه فایل: 200KB.

### `GET /api/v1/packages`

نقطه پایانی کاتالوگ یکپارچه برای:

- Skills
- Plugin های کد
- Plugin های بسته

پارامترهای Query:

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
  `highlightedOnly`، یا `sort` مقدار `400` برمی‌گردانند. پارامترهای Query ناشناخته نادیده گرفته می‌شوند.
- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار با خانواده ثابت هستند.
- ورودی‌های Skill همچنان با رجیستری Skill پشتیبانی می‌شوند و فقط از طریق `POST /api/v1/skills` قابل انتشار هستند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخواننده‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند در نتایج فهرست/جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده بتواند بخواند.

### `GET /api/v1/packages/search`

جست‌وجوی کاتالوگ یکپارچه در میان Skills + بسته‌های Plugin.

پارامترهای Query:

- `q` (ضروری): رشته Query
- `limit` (اختیاری): عدد صحیح (1–100)
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد. دسته‌بندی‌های کنترل‌شده و نام‌های مستعار فیلتر
  قدیمی v1 زیر `GET /api/v1/plugins` مستند شده‌اند.

یادداشت‌ها:

- مقدارهای نامعتبر برای `family`، `channel`، `isOfficial`، `featured`، یا
  `highlightedOnly` مقدار `400` برمی‌گردانند. پارامترهای Query ناشناخته نادیده گرفته می‌شوند.
- فراخواننده‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده بتواند بخواند.

### `GET /api/v1/plugins`

مرور کاتالوگ فقط Plugin در میان بسته‌های code-plugin و bundle-plugin.

پارامترهای Query:

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

`trending` جدول رتبه‌بندی نصب/دانلود هفت‌روزه است و از مجموع‌های همه‌زمان استفاده نمی‌کند.
در نقطه پایانی یکپارچه `/api/v1/packages` فقط مختص Plugin است؛ برای کاتالوگ Skill از
`/api/v1/skills?sort=trending` استفاده کنید.

نام‌های مستعار قدیمی به‌عنوان مقدارهای دسته‌بندی ذخیره‌شده یا اعلام‌شده توسط نویسنده پذیرفته نمی‌شوند.

### `GET /api/v1/skills/export`

خروجی‌گیری دسته‌ای از آخرین Skills عمومی برای تحلیل آفلاین.

احراز هویت:

- توکن API ضروری است.

پارامترهای Query:

- `startDate` (ضروری): حد پایین میلی‌ثانیه‌های Unix برای `updatedAt` مربوط به Skill.
- `endDate` (ضروری): حد بالای میلی‌ثانیه‌های Unix برای `updatedAt` مربوط به Skill.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.

پاسخ:

- بدنه: آرشیو ZIP.
- ریشه هر Skill خروجی‌گرفته‌شده در `{publisher}/{slug}/` قرار دارد.
- Skills میزبانی‌شده شامل فایل‌های آخرین نسخه ذخیره‌شده هستند و در
  `_manifest.json` با `sourceRef: "public-clawhub"` فهرست می‌شوند.
- Skills فعلی پشتیبانی‌شده با GitHub که اسکن `clean` یا `suspicious` دارند شامل
  `_source_handoff.json` با `sourceRef: "public-github"`، مخزن، commit، مسیر،
  هش محتوا، و URL آرشیو هستند. آن‌ها فایل‌های منبع میزبانی‌شده در ClawHub را شامل نمی‌شوند.
- هر Skill شامل `_export_skill_meta.json` است.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- `_errors.json` زمانی گنجانده می‌شود که Skills یا فایل‌های جداگانه قابل
  خروجی‌گیری نبوده باشند.

Headers:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

خروجی‌گیری گروهی از آخرین انتشارهای عمومی Plugin برای تحلیل آفلاین.

احراز هویت:

- توکن API لازم است.

پارامترهای پرس‌وجو:

- `startDate` (الزامی): کران پایین بر حسب میلی‌ثانیه یونیکس برای `updatedAt` مربوط به Plugin.
- `endDate` (الزامی): کران بالا بر حسب میلی‌ثانیه یونیکس برای `updatedAt` مربوط به Plugin.
- `limit` (اختیاری): عدد صحیح (1-250)، مقدار پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.
- `family` (اختیاری): `code-plugin` یا `bundle-plugin`. حذف آن یعنی هر دو
  خانواده Plugin.

پاسخ:

- بدنه: آرشیو ZIP.
- هر Plugin خروجی‌گرفته‌شده در `{family}/{packageName}/` ریشه دارد.
- هر Plugin خروجی‌گرفته‌شده شامل فایل‌های ذخیره‌شده آخرین انتشار است.
- فراداده خروجی‌گیری برای هر Plugin در
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` ذخیره می‌شود.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- وقتی Pluginها یا فایل‌های جداگانه قابل خروجی‌گیری نباشند، `_errors.json`
  گنجانده می‌شود.

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
- `category` (اختیاری): فیلتر دسته Plugin. مقادیر فعلی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نکته‌ها:

- نام‌های مستعار فیلتر v1 قدیمی که زیر `GET /api/v1/plugins` مستند شده‌اند نیز
  پذیرفته می‌شوند.
- فیلتر کردن دسته یک فیلتر واقعی API است که با ردیف‌های digest دسته Plugin
  پشتیبانی می‌شود، نه بازنویسی پرس‌وجوی جست‌وجو.
- نتایج به ترتیب مرتبط بودن برگردانده می‌شوند و در حال حاضر صفحه‌بندی نمی‌شوند.
- کنترل‌های مرتب‌سازی رابط مرورگر برای جست‌وجوی Plugin، نتایج مرتبط بارگذاری‌شده را
  دوباره مرتب می‌کنند و با رفتار مرور فعلی `/skills` مطابقت دارند.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را برمی‌گرداند.

نکته‌ها:

- Skills نیز می‌توانند از این مسیر در کاتالوگ یکپارچه resolve شوند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارهای آن را soft-delete می‌کند.

نکته‌ها:

- به توکن API برای مالک بسته، مالک/مدیر ناشر سازمانی،
  ناظر پلتفرم، یا مدیر پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه‌ها را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

نکته‌ها:

- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را برمی‌گرداند، شامل فراداده فایل، سازگاری،
راستی‌آزمایی، فراداده artifact، و داده‌های scan.

نکته‌ها:

- `version.artifact.kind` برای آرشیوهای بسته قدیمی `legacy-zip` یا
  برای انتشارهای پشتیبانی‌شده با ClawPack برابر `npm-pack` است.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum`، و
  `npmTarballName` هستند.
- `version.sha256hash` فراداده سازگاری منسوخ برای کلاینت‌های قدیمی است. این مقدار
  بایت‌های دقیق ZIP برگردانده‌شده توسط `/api/v1/packages/{name}/download` را hash می‌کند.
  کلاینت‌های مدرن باید از `version.artifact.sha256` استفاده کنند که
  artifact انتشار canonical را شناسایی می‌کند.
- `version.vtAnalysis`، `version.llmAnalysis`، و `version.staticScan` زمانی
  گنجانده می‌شوند که داده scan وجود داشته باشد.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصه دقیق امنیت و اعتماد انتشار بسته را برای کلاینت‌های نصب برمی‌گرداند. این سطح مصرف عمومی OpenClaw برای تصمیم‌گیری درباره این است که آیا یک انتشار resolve‌شده قابل نصب است یا نه.

احراز هویت:

- endpoint خواندن عمومی. توکن مالک، ناشر، ناظر، یا مدیر لازم نیست.

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
  resolve‌شده را شناسایی می‌کنند.
- `release.releaseId`، `release.version`، و `release.createdAt`
  انتشار دقیق ارزیابی‌شده را شناسایی می‌کنند.
- `release.artifactKind`، `release.artifactSha256`، `release.npmIntegrity`،
  `release.npmShasum`، و `release.npmTarballName` زمانی حاضر هستند که برای
  artifact انتشار شناخته‌شده باشند.
- `trust.scanStatus` وضعیت اعتماد مؤثر است که از ورودی‌های scanner
  و نظارت دستی انتشار به دست آمده است.
- `trust.moderationState` nullable است. وقتی نظارت دستی انتشار وجود نداشته باشد `null` است.
- `trust.blockedFromDownload` سیگنال مسدودسازی نصب است. OpenClaw و دیگر
  کلاینت‌های نصب باید وقتی این مقدار `true` است نصب را مسدود کنند، به جای اینکه
  قواعد مسدودسازی را از فیلدهای scanner یا moderation دوباره استخراج کنند.
- `trust.reasons` فهرست توضیح رو به کاربر و audit است. کدهای دلیل
  رشته‌های پایدار و فشرده‌ای مانند `manual:quarantined`، `scan:malicious`،
  و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد هنوز در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصه اعتماد از ورودی‌های منسوخ محاسبه شده و
  پیش از تصمیم allow با اطمینان بالا باید نیازمند تازه‌سازی تلقی شود.

نکته‌ها:

- این endpoint دقیقاً مربوط به نسخه است. کلاینت‌ها باید پس از resolve کردن
  نسخه بسته‌ای که قصد نصب آن را دارند آن را فراخوانی کنند، نه صرفاً پس از خواندن آخرین
  فراداده بسته.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.
- این endpoint عمداً محدودتر از endpointهای نظارت مالک/ناظر است.
  تصمیم نصب و توضیح عمومی را آشکار می‌کند، نه هویت گزارش‌دهندگان، متن گزارش‌ها،
  شواهد خصوصی، یا خط زمانی‌های بازبینی داخلی.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده resolver صریح artifact را برای یک نسخه بسته برمی‌گرداند.

نکته‌ها:

- نسخه‌های بسته قدیمی یک artifact از نوع `legacy-zip` و یک
  `downloadUrl` قدیمی برمی‌گردانند.
- نسخه‌های ClawPack یک artifact از نوع `npm-pack`، فیلدهای integrity مربوط به npm، یک
  `tarballUrl`، و URL سازگاری ZIP قدیمی را برمی‌گردانند.
- این سطح resolver مربوط به OpenClaw است؛ از حدس زدن قالب آرشیو از
  یک URL مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

artifact نسخه را از مسیر resolver صریح دانلود می‌کند.

نکته‌ها:

- نسخه‌های ClawPack بایت‌های دقیق `.tgz` بارگذاری‌شده npm-pack را stream می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` redirect می‌شوند.
- از bucket نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده را برای مصرف آینده OpenClaw برمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر است:

- وضعیت کانال رسمی
- در دسترس بودن آخرین نسخه
- در دسترس بودن artifact نوع ClawPack npm-pack
- digest مربوط به artifact
- منبع repo و منشأ commit
- فراداده سازگاری OpenClaw
- هدف‌های میزبان
- وضعیت scan

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

endpoint ناظر برای فهرست کردن ردیف‌های migration مربوط به Pluginهای رسمی OpenClaw.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای پرس‌وجو:

- `phase` (اختیاری): `planned`، `published`، `clawpack-ready`،
  `legacy-zip-only`، `metadata-ready`، `blocked`، `ready-for-openclaw`، یا
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

endpoint مدیر برای ایجاد یا به‌روزرسانی یک ردیف migration مربوط به Plugin رسمی.

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

- `bundledPluginId` به حروف کوچک normalize می‌شود و کلید stable upsert است.
- `packageName` به نام npm normalize می‌شود؛ بسته می‌تواند برای migrationهای برنامه‌ریزی‌شده
  وجود نداشته باشد.
- این فقط آمادگی migration را ردیابی می‌کند. OpenClaw را تغییر نمی‌دهد و
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

endpoint ناظر/مدیر برای صف‌های بازبینی انتشار بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای پرس‌وجو:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

معنای وضعیت‌ها:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، لغوشده، یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، لغوشده، یا مخرب.
- `manual`: هر انتشاری با override نظارت دستی.
- `all`: هر انتشاری با override دستی، وضعیت scan غیرپاک، یا گزارش بسته.

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

گزارش یک بسته برای بازبینی ناظر. گزارش‌ها در سطح بسته هستند و به‌صورت اختیاری
به یک نسخه پیوند می‌خورند. آن‌ها صف نظارت را تغذیه می‌کنند، اما به‌تنهایی
دانلودها را به‌طور خودکار پنهان یا مسدود نمی‌کنند؛ ناظران باید از نظارت انتشار برای
تأیید، قرنطینه، یا revoke کردن artifactها استفاده کنند.

احراز هویت:

- توکن API لازم است.

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

نقطهٔ پایانی ناظر/مدیر برای دریافت گزارش‌های بسته.

احراز هویت:

- به یک توکن API برای کاربر ناظر یا مدیر نیاز دارد.

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

نقطهٔ پایانی مالک/ناظر برای مشاهدهٔ وضعیت نظارت بسته.

احراز هویت:

- به یک توکن API برای مالک بسته، عضو ناشر، ناظر، یا
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

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام
برگرداندن `status` به `open` می‌توان آن را حذف کرد. برای اعمال نظارت بر انتشار در همان گردش‌کار قابل ممیزی، همراه با یک گزارش تأییدشده
`finalAction: "quarantine"` یا
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
- `revoked`: پس از آن‌که یک انتشار قبلاً مورد اعتماد بوده، مسدود شده است.

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود آرتیفکت `403` برمی‌گردانند.
هر تغییر یک ورودی در گزارش ممیزی ثبت می‌کند.

### `GET /api/v1/packages/{name}/file`

محتوای متنی خام یک فایل بسته را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌طور پیش‌فرض از آخرین انتشار استفاده می‌کند.
- از سطل نرخ خواندن استفاده می‌کند، نه سطل دانلود.
- فایل‌های دودویی `415` برمی‌گردانند.
- محدودیت اندازهٔ فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن را مسدود نمی‌کنند؛ انتشارهای مخرب ممکن است همچنان در جای دیگری withheld شوند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر این‌که فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای یک انتشار بسته دانلود می‌کند.

پارامترهای پرس‌وجو:

- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌طور پیش‌فرض از آخرین انتشار استفاده می‌کند.
- Skills به `GET /api/v1/download` تغییرمسیر می‌دهند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشهٔ `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP می‌ماند. فایل‌های ClawPack `.tgz` را استریم نمی‌کند.
- پاسخ‌ها برای بررسی‌های تمامیت resolver شامل سرآیندهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` هستند.
- فرادادهٔ فقط-رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر این‌که فراخواننده مالک باشد.

### `GET /api/npm/{package}`

برای نسخه‌های بستهٔ مبتنی بر ClawPack یک packument سازگار با npm برمی‌گرداند.

نکات:

- فقط نسخه‌هایی که tarballهای ClawPack npm-pack بارگذاری‌شده دارند فهرست می‌شوند.
- نسخه‌های قدیمی فقط-ZIP عمداً حذف می‌شوند.
- `dist.tarball`، `dist.integrity`، و `dist.shasum` از فیلدهای سازگار با npm استفاده می‌کنند
  تا کاربران در صورت تمایل بتوانند npm را به mirror اشاره دهند.
- packumentهای بستهٔ scoped هم از `/api/npm/@scope/name` و هم از مسیر درخواست کدگذاری‌شدهٔ npm یعنی
  `/api/npm/@scope%2Fname` پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball بارگذاری‌شدهٔ ClawPack را برای کلاینت‌های mirror npm استریم می‌کند.

نکات:

- از سطل نرخ دانلود استفاده می‌کند.
- سرآیندهای دانلود شامل SHA-256 مربوط به ClawHub به‌علاوهٔ فرادادهٔ integrity/shasum مربوط به npm هستند.
- بررسی‌های نظارت و دسترسی به بستهٔ خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

توسط CLI برای نگاشت یک اثرانگشت محلی به یک نسخهٔ شناخته‌شده استفاده می‌شود.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز 64نویسه‌ای از اثرانگشت باندل

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک ZIP نسخهٔ skill میزبانی‌شده را دانلود می‌کند، یا برای یک skill فعلی مبتنی بر GitHub که اسکن `clean` یا `suspicious` دارد و نسخهٔ میزبانی‌شده ندارد، تحویل منبع GitHub را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `version` (اختیاری): رشتهٔ semver
- `tag` (اختیاری): نام tag (برای مثال `latest`)

نکات:

- اگر نه `version` و نه `tag` ارائه شده باشد، از آخرین نسخه استفاده می‌شود.
- نسخه‌های soft-delete شده `410` برمی‌گردانند.
- تحویل‌های skill مبتنی بر GitHub بایت‌ها را proxy یا mirror نمی‌کنند. پاسخ JSON
  شامل `sourceRef: "public-github"`، `repo`، `commit`، `path`، `contentHash`،
  و `archiveUrl` است؛ وضعیت scan/current یک دروازه است و به‌عنوان فرادادهٔ payload موفقیت
  درج نمی‌شود.
- آمار دانلود به‌صورت هویت‌های یکتا در هر روز UTC شمرده می‌شود (`userId` وقتی توکن API معتبر است، در غیر این صورت IP).

## نقاط پایانی احراز هویت (توکن Bearer)

همهٔ نقاط پایانی نیاز دارند:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

توکن را اعتبارسنجی می‌کند و handle کاربر را برمی‌گرداند.

### `POST /api/v1/skills`

یک نسخهٔ جدید منتشر می‌کند.

- ترجیحی: `multipart/form-data` با JSON در `payload` + blobهای `files[]`.
- بدنهٔ JSON با `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. هنگام حضور، API آن
  ناشر را در سمت سرور resolve می‌کند و از کنشگر می‌خواهد دسترسی ناشر داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` برابر `true` باشد، یک
  skill موجود می‌تواند به آن مالک منتقل شود، اگر کنشگر روی ناشران فعلی و مقصد admin/owner باشد.
  بدون این opt-in، تغییرات مالک رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت با توکن Bearer نیاز دارد.
- به `multipart/form-data` نیاز دارد.
- فیلدهای فرم مجاز عبارت‌اند از `payload`، blobهای تکرارشوندهٔ `files`، یا یک ارجاع tarball
  `clawpack`. `clawpack` می‌تواند یک blob `.tgz` یا یک شناسهٔ ذخیره‌سازی باشد که از
  جریان upload-url برگشته است. انتشارهای stageشده با storage-id باید `clawpackUploadTicket`
  برگشته همراه با آن URL بارگذاری را نیز شامل شوند.
- یا از `files` استفاده کنید یا از `clawpack`، هرگز هر دو در یک درخواست.
- بدنه‌های JSON و فرادادهٔ `payload.files` / `payload.artifact`
  تأمین‌شده توسط فراخواننده رد می‌شوند.
- درخواست‌های انتشار مستقیم multipart به 18MB محدودند. tarballهای ClawPack می‌توانند
  از جریان upload-url تا سقف tarball برابر 120MB استفاده کنند.
- فیلد اختیاری payload: `ownerHandle`. هنگام حضور، فقط مدیران می‌توانند از طرف آن مالک منتشر کنند.

نکات برجستهٔ اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های ClawPack `.tgz` باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- code pluginها به `package.json`، فرادادهٔ مخزن منبع، فرادادهٔ commit منبع،
  فرادادهٔ schema پیکربندی، `openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فرادادهٔ اختیاری هستند.
- فقط ناشر org با نام `openclaw` و ناشران شخصی اعضای فعلی org با نام `openclaw`
  می‌توانند در کانال `official` منتشر کنند.
- انتشارهای از طرف دیگران همچنان صلاحیت کانال official را نسبت به حساب مالک مقصد اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

soft-delete / بازیابی یک skill (مالک، ناظر، یا مدیر).

بدنهٔ JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

هنگام حضور، `reason` به‌عنوان یادداشت نظارت skill ذخیره و در گزارش ممیزی کپی می‌شود.
soft deleteهایی که توسط مالک آغاز می‌شوند، slug را برای 30 روز رزرو می‌کنند؛ سپس slug می‌تواند توسط
ناشر دیگری مطالبه شود. پاسخ حذف وقتی این انقضا اعمال شود شامل `slugReservedUntil` است.
پنهان‌سازی‌های ناظر/مدیر و حذف‌های امنیتی به این شکل منقضی نمی‌شوند.

پاسخ حذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

کدهای وضعیت:

- `200`: تأیید
- `401`: احراز هویت نشده
- `403`: ممنوع
- `404`: skill/کاربر پیدا نشد
- `500`: خطای داخلی سرور

### `POST /api/v1/users/publisher`

فقط مدیر. اطمینان می‌دهد یک ناشر org برای یک handle وجود دارد. اگر handle هنوز به یک
کاربر اشتراکی قدیمی/ناشر شخصی اشاره کند، نقطهٔ پایانی ابتدا آن را به یک ناشر org مهاجرت می‌دهد.
برای یک org تازه‌ساخته‌شده، `memberHandle` را ارائه کنید؛ مدیر کنشگر به‌عنوان عضو اضافه نمی‌شود.
`memberRole` به‌طور پیش‌فرض `owner` است.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

ایجاد خودسرویس احرازشدهٔ ناشر org. یک ناشر org جدید ایجاد می‌کند و
فراخواننده را به‌عنوان مالک اضافه می‌کند. این نقطهٔ پایانی handleهای کاربر/شخصی موجود را مهاجرت نمی‌دهد و
ناشر را trusted/official علامت‌گذاری نمی‌کند.

- بدنه: `{ "handle": "opik", "displayName": "Opik" }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- وقتی handle از قبل توسط یک ناشر، کاربر، یا ناشر شخصی استفاده شده باشد `409` برمی‌گرداند.

### `POST /api/v1/users/reserve`

فقط مدیر. slugهای ریشه و نام‌های بسته را برای مالک ذی‌حق بدون انتشار یک
انتشار رزرو می‌کند. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف انتشار تبدیل می‌شوند، تا همان
مالک بتواند بعداً انتشار واقعی code-plugin یا bundle-plugin را با آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

فقط مدیر. یک ناشر شخصی را برای یک principal جایگزین تأییدشدهٔ GitHub OAuth بازیابی می‌کند
بدون ویرایش ردیف‌های حساب Convex Auth. درخواست باید هر دو شناسهٔ تغییرناپذیر حساب ارائه‌دهندهٔ GitHub
را نام ببرد؛ handleهای تغییرپذیر فقط به‌عنوان یک محافظ رو به اپراتور استفاده می‌شوند.

نقطهٔ پایانی به‌طور پیش‌فرض روی اجرای آزمایشی تنظیم است. اعمال بازیابی پس از آن‌که کارکنان به‌صورت مستقل پیوستگی بین هر دو اصل GitHub را تأیید کردند، به `dryRun: false` و
`confirmIdentityVerified: true` نیاز دارد. وقتی ناشر شخصی فعلی کاربر مقصد Skills، بسته‌ها، یا منابع Skill در GitHub داشته باشد، بازیابی به‌صورت بسته شکست می‌خورد.
بازیابی همچنین فیلدهای قدیمی `ownerUserId` را برای Skills ناشر بازیابی‌شده، نام‌های مستعار slug Skill، بسته‌ها، هشدارهای بازرس بسته، و ردیف‌های مشتق‌شدهٔ چکیدهٔ جست‌وجو مهاجرت می‌دهد تا
مسیرهای مالک مستقیم با مرجع ناشر جدید هم‌خوان شوند. یک رزرو فعال handle محافظت‌شده برای handle بازیابی‌شده نیز به کاربر جایگزین واگذار می‌شود تا همگام‌سازی بعدی پروفایل نتواند مرجع رقیب کاربر قبلی را بازگرداند. هر جدول اصلی در هر تراکنش اعمال به
۱۰۰ ردیف محدود است؛ بازیابی‌های بزرگ‌تر باید ابتدا از یک مهاجرت مالک قابل ازسرگیری استفاده کنند.
منابع Skill در GitHub در محدودهٔ ناشر هستند و به‌جای بازنویسی، به‌عنوان بررسی‌شده گزارش می‌شوند.

- بدنه: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- پاسخ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط پایانی مدیریت slug مالک

- `POST /api/v1/skills/{slug}/rename`
  - بدنه: `{ "newSlug": "new-canonical-slug" }`
  - پاسخ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - بدنه: `{ "targetSlug": "canonical-target-slug" }`
  - پاسخ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

نکته‌ها:

- هر دو نقطهٔ پایانی به احراز هویت با توکن API نیاز دارند و فقط برای مالک Skill کار می‌کنند.
- `rename` slug قبلی را به‌عنوان نام مستعار تغییرمسیر حفظ می‌کند.
- `merge` فهرست‌کردن منبع را پنهان می‌کند و slug منبع را به فهرست هدف تغییرمسیر می‌دهد.

### نقاط پایانی انتقال مالکیت

- `POST /api/v1/skills/{slug}/transfer`
  - بدنه: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - پاسخ: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - پاسخ (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - شکل پاسخ: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

یک کاربر را مسدود کنید و Skills متعلق به او را به‌صورت سخت حذف کنید (فقط ناظر/مدیر).

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

مسدودی یک کاربر را بردارید و Skills واجد شرایط را بازیابی کنید (فقط مدیر).

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

دلیل ذخیره‌شده برای یک مسدودی موجود را بدون برداشتن مسدودی یا بازیابی
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

نقش یک کاربر را تغییر دهید (فقط مدیر).

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

- `q` (اختیاری): عبارت جست‌وجو
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

## نقاط پایانی قدیمی CLI (منسوخ)

همچنان برای نسخه‌های قدیمی‌تر CLI پشتیبانی می‌شوند:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

برای برنامهٔ حذف، `DEPRECATIONS.md` را ببینید.

`POST /api/cli/upload-url` مقدارهای `uploadUrl` و `uploadTicket` را برمی‌گرداند. انتشارهای بسته که یک tarball از ClawPack را مرحله‌بندی می‌کنند باید شناسهٔ ذخیره‌سازی حاصل را به‌عنوان
`clawpack` و تیکت برگشتی را به‌عنوان `clawpackUploadTicket` ارسال کنند.

## کشف رجیستری (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات رجیستری/احراز هویت را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر خودمیزبانی می‌کنید، این فایل را ارائه کنید (یا `CLAWHUB_REGISTRY` را صراحتاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی است).
