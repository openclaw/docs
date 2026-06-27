---
read_when:
    - افزودن/تغییر دادن نقاط پایانی
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API HTTP (عمومی + نقاط پایانی CLI + احراز هویت).
x-i18n:
    generated_at: "2026-06-27T17:18:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL پایه: `https://clawhub.ai` (پیش‌فرض).

همهٔ مسیرهای v1 زیر `/api/v1/...` قرار دارند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی می‌مانند (نگاه کنید به `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## استفادهٔ مجدد از کاتالوگ عمومی

دایرکتوری‌های شخص ثالث می‌توانند از endpointهای خواندن عمومی برای فهرست‌کردن یا جست‌وجوی Skills در ClawHub استفاده کنند. لطفاً نتایج را cache کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست canonical در ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) برگردانید، و القا نکنید که ClawHub سایت شخص ثالث را تأیید می‌کند. تلاش نکنید محتوای پنهان، خصوصی، یا مسدودشده به‌دلیل moderation را بیرون از سطح API عمومی mirror کنید.

میان‌برهای web slug در میان خانواده‌های registry resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی اولویت مسیرها، از URLهای canonical برگشتی توسط endpointهای خواندن استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال:

- درخواست‌های ناشناس: بر اساس هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (token معتبر Bearer): بر اساس bucket هر کاربر اعمال می‌شود.
- اگر token وجود نداشته باشد/نامعتبر باشد، رفتار به اعمال بر اساس IP برمی‌گردد.
- endpointهای نوشتن احراز هویت‌شده نباید وقتی سرور دلیل را می‌داند، یک `Unauthorized` خالی برگردانند. tokenهای جاافتاده، tokenهای نامعتبر/لغوشده، و حساب‌های حذف‌شده/ممنوع‌شده/غیرفعال‌شده باید هرکدام متن قابل‌اقدام بگیرند تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی آن‌ها را مسدود کرده است.

- خواندن: 3000/دقیقه به‌ازای هر IP، 12000/دقیقه به‌ازای هر key
- نوشتن: 300/دقیقه به‌ازای هر IP، 3000/دقیقه به‌ازای هر key
- دانلود: 1200/دقیقه به‌ازای هر IP، 6000/دقیقه به‌ازای هر key (endpointهای دانلود)

Headerها:

- سازگاری قدیمی: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`, `RateLimit-Reset`
- روی `429`: `X-RateLimit-Remaining: 0` و `RateLimit-Remaining: 0`
- روی `429`: `Retry-After`

معنای headerها:

- `X-RateLimit-Reset`: ثانیه‌های مطلق Unix epoch
- `RateLimit-Reset`: ثانیه تا reset (تأخیر)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجهٔ دقیق باقی‌مانده در صورت وجود.
  درخواست‌های موفق sharded این header را حذف می‌کنند، به‌جای اینکه یک مقدار global تقریبی برگردانند.
- `Retry-After`: ثانیه‌هایی که باید پیش از retry روی `429` صبر کرد (تأخیر)

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

- اگر `Retry-After` وجود دارد، قبل از retry به همان تعداد ثانیه صبر کنید.
- برای جلوگیری از retryهای هم‌زمان، از backoff همراه با jitter استفاده کنید.
- اگر `Retry-After` وجود ندارد، به `RateLimit-Reset` fallback کنید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- از headerهای IP کلاینت قابل‌اعتماد، از جمله `cf-connecting-ip`، فقط وقتی استفاده می‌کند که deployment صراحتاً headerهای forwarded قابل‌اعتماد را فعال کرده باشد.
- ClawHub از headerهای forwarding قابل‌اعتماد برای شناسایی IPهای کلاینت در edge استفاده می‌کند.
- اگر IP کلاینت قابل‌اعتمادی در دسترس نباشد، درخواست‌های ناشناس از bucketهای fallback استفاده می‌کنند که فقط بر اساس نوع rate-limit scope شده‌اند. این bucketهای fallback شامل pathهای ارائه‌شده توسط caller، slugها، نام packageها، versionها، query stringها، یا دیگر پارامترهای artifact نمی‌شوند.

## پاسخ‌های خطا

پاسخ‌های خطای عمومی v1 متن ساده با `content-type: text/plain; charset=utf-8` هستند.
این شامل شکست‌های validation (`400`)، منابع عمومی پیدا‌نشده (`404`)، شکست‌های auth و permission (`401`/`403`)، محدودیت‌های نرخ (`429`)، و دانلودهای مسدودشده است. کلاینت‌ها باید بدنهٔ پاسخ را به‌عنوان یک رشتهٔ خوانای انسانی بخوانند. پارامترهای query ناشناخته برای سازگاری نادیده گرفته می‌شوند، اما پارامترهای query شناخته‌شده با مقدارهای نامعتبر `400` برمی‌گردانند.

## endpointهای عمومی (بدون auth)

### `GET /api/v1/search`

پارامترهای query:

- `q` (لازم): رشتهٔ query
- `limit` (اختیاری): integer
- `highlightedOnly` (اختیاری): `true` برای filter کردن به Skills برجسته‌شده
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن Skills مشکوک (`flagged.suspicious`)
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

نکات:

- نتایج به‌ترتیب relevance برگردانده می‌شوند (شباهت embedding + تقویت‌های token دقیق slug/name + یک prior کوچک popularity).
- relevance از popularity قوی‌تر است. یک تطابق دقیق token برای slug یا display-name می‌تواند از یک تطابق سست‌تر با engagement بسیار قوی‌تر بالاتر قرار بگیرد.
- متن ASCII بر اساس مرزهای واژه و نشانه‌گذاری tokenized می‌شود. برای مثال، `personal-map` شامل یک token مستقل `map` است، درحالی‌که `amap-jsapi-skill` شامل `amap`، `jsapi`، و `skill` است؛ بنابراین جست‌وجوی `map` به `personal-map` یک تطابق lexical قوی‌تر از `amap-jsapi-skill` می‌دهد.
- popularity با log scale می‌شود و سقف دارد. Skills با engagement بالا ممکن است وقتی متن query تطابق ضعیف‌تری دارد، رتبهٔ پایین‌تری بگیرند.
- وضعیت moderation مشکوک یا پنهان می‌تواند بسته به filterهای caller و وضعیت فعلی moderation، یک Skill را از جست‌وجوی عمومی حذف کند.

راهنمای discoverability برای publisher:

- واژه‌هایی را که کاربران عیناً جست‌وجو خواهند کرد در display name، summary، و tagها بگذارید. فقط وقتی از token مستقل slug استفاده کنید که همان‌طور یک identity پایدار هم باشد که می‌خواهید نگه دارید.
- فقط برای دنبال‌کردن یک query، slug را rename نکنید مگر اینکه slug جدید نام canonical بلندمدت بهتری باشد. slugهای قدیمی به aliasهای redirect تبدیل می‌شوند، اما URL canonical، slug نمایش‌داده‌شده، و digestهای جست‌وجوی آینده از slug جدید استفاده می‌کنند.
- aliasهای rename، resolution را برای URLهای قدیمی و installهایی که از طریق registry resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو بر اساس metadata canonical Skill پس از index شدن rename است. آمار موجود با Skill باقی می‌ماند.
- اگر یک Skill به‌شکل غیرمنتظره نامرئی است، قبل از تغییر metadata مربوط به رتبه‌بندی، ابتدا وضعیت moderation را با `clawhub inspect @owner/slug` در حالت logged in بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): integer (1–200)
- `cursor` (اختیاری): cursor صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended` (alias: `default`)، `createdAt` (alias: `newest`)، `downloads`، `stars` (alias: `rating`)، aliasهای install قدیمی `installsCurrent`/`installs`/`installsAllTime` به `downloads` map می‌شوند، `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن Skills مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): alias قدیمی برای `nonSuspiciousOnly`

مقدارهای نامعتبر `sort`، `400` برمی‌گردانند.

نکات:

- `recommended` از سیگنال‌های engagement و recency استفاده می‌کند.
- `trending` بر اساس installها در ۷ روز گذشته رتبه‌بندی می‌کند (بر پایهٔ telemetry).
- `createdAt` برای crawlهای Skill جدید پایدار است؛ `updated` وقتی Skills موجود دوباره publish می‌شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` است، sortهای مبتنی بر cursor ممکن است در یک صفحه کمتر از `limit` item برگردانند، چون Skills مشکوک پس از page retrieval filter می‌شوند.
- وقتی `nextCursor` وجود دارد، از آن برای ادامهٔ صفحه‌بندی استفاده کنید. یک صفحهٔ کوتاه به‌خودی‌خود به‌معنای پایان نتایج نیست.

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

نکات:

- slugهای قدیمی ایجادشده توسط flowهای rename/merge مالک به Skill canonical resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter مربوط به Skill (مثلاً `["macos"]`، `["linux"]`). اگر اعلام نشده باشد `null`.
- `metadata.systems`: هدف‌های Nix system (مثلاً `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد `null`.
- اگر Skill هیچ metadata پلتفرمی نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط وقتی اضافه می‌شود که Skill flag شده باشد یا مالک آن را مشاهده کند.

### `GET /api/v1/skills/{slug}/moderation`

وضعیت ساختاریافتهٔ moderation را برمی‌گرداند.

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

نکات:

- مالکان و moderatorها می‌توانند به جزئیات moderation برای Skills پنهان دسترسی داشته باشند.
- callerهای عمومی فقط برای Skills قابل‌مشاهده‌ای که از قبل flag شده‌اند، `200` می‌گیرند.
- evidence برای callerهای عمومی redacted می‌شود و فقط برای مالکان/moderatorها snippetهای raw را شامل می‌شود.

### `POST /api/v1/skills/{slug}/report`

یک Skill را برای بررسی moderator گزارش کنید. گزارش‌ها در سطح Skill هستند، به‌صورت اختیاری به یک version پیوند می‌خورند، و queue گزارش Skill را تغذیه می‌کنند.

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

endpoint مربوط به moderator/admin برای intake گزارش Skill.

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

endpoint مربوط به moderator/admin برای resolve کردن یا reopen کردن گزارش‌های Skill.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` لازم است؛ هنگام تنظیم دوبارهٔ `status` به `open` می‌تواند حذف شود. برای پنهان‌کردن Skill در همان workflow قابل‌ممیزی، همراه با گزارش triaged مقدار `finalAction: "hide"` را بفرستید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای query:

- `limit` (اختیاری): integer
- `cursor` (اختیاری): cursor صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

metadata نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` شامل وضعیت verification اسکن normalize‌شده و جزئیات scanner است
  (VirusTotal + LLM)، وقتی در دسترس باشد.

### `GET /api/v1/skills/{slug}/scan`

جزئیات verification اسکن امنیتی را برای یک نسخهٔ Skill برمی‌گرداند.

پارامترهای query:

- `version` (اختیاری): رشتهٔ version مشخص.
- `tag` (اختیاری): resolve کردن یک نسخهٔ tagged (برای مثال `latest`).

نکات:

- اگر نه `version` و نه `tag` ارائه شود، از آخرین نسخه استفاده می‌کند.
- شامل وضعیت راستی‌آزمایی نرمال‌سازی‌شده به‌همراه جزئیات مخصوص اسکنر است.
- `security.hasScanResult` فقط زمانی `true` است که یک اسکنر رأی قطعی تولید کرده باشد (`clean`، `suspicious`، یا `malicious`).
- `moderation` یک نمای لحظه‌ای تعدیل در سطح مهارت است که از آخرین نسخه مشتق شده است.
- هنگام پرس‌وجوی یک نسخه تاریخی، پیش از اینکه `moderation` و `security` را متعلق به همان زمینه نسخه بدانید، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

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

نکات:

- بارهای درخواست اسکن و گزارش‌های قابل دانلود پس از پنجره نگهداری از ذخیره‌گاه درخواست اسکن منقضی می‌شوند.
- اسکن‌های منتشرشده به دسترسی مدیریتی مالک/ناشر، یا اختیار ناظر/ادمین پلتفرم نیاز دارند.
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

نقطه پایانی بایگانی گزارش احراز هویت‌شده.

- به یک اسکن موفق نیاز دارد؛ اسکن‌های غیرپایانی `409` برمی‌گردانند.
- یک ZIP با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json`، و `README.md` برمی‌گرداند.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطه پایانی بایگانی گزارش ذخیره‌شده احراز هویت‌شده برای نسخه‌های ارسال‌شده.

- به دسترسی مدیریتی مالک/ناشر به skill یا plugin، یا اختیار ناظر/ادمین پلتفرم نیاز دارد.
- نتایج اسکن ذخیره‌شده را برای نسخه ارسال‌شده دقیق، شامل نسخه‌های مسدودشده یا پنهان، برمی‌گرداند.
- مقدار پیش‌فرض `kind` برابر `skill` است؛ برای اسکن‌های plugin/package از `kind=plugin` استفاده کنید.
- همان شکل ZIP دانلودهای درخواست اسکن را برمی‌گرداند.

### `POST /api/v1/skills/-/scan/batch`

مسیر بازاسکن دسته‌ای کانونی فقط مخصوص ادمین. همان شکل بار را می‌پذیرد که `POST /api/v1/skills/-/rescan-batch` قدیمی می‌پذیرد.

### `POST /api/v1/skills/-/scan/batch/status`

مسیر وضعیت دسته‌ای کانونی فقط مخصوص ادمین. `{ "jobIds": ["..."] }` را می‌پذیرد و همان شمارنده‌های تجمیعی را برمی‌گرداند که `POST /api/v1/skills/-/rescan-batch/status` قدیمی برمی‌گرداند.

### `GET /api/v1/skills/{slug}/verify`

پاکت راستی‌آزمایی Skill Card را که توسط `clawhub skill verify` استفاده می‌شود برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): حل کردن یک نسخه برچسب‌گذاری‌شده (برای مثال `latest`).

نکات:

- `ok` فقط زمانی `true` است که نسخه انتخاب‌شده یک Skill Card تولیدشده داشته باشد، توسط تعدیل به‌عنوان بدافزار مسدود نشده باشد، و راستی‌آزمایی ClawScan پاک باشد.
- هویت Skill، هویت ناشر، و فراداده نسخه انتخاب‌شده فیلدهای سطح بالای پاکت هستند (`slug`، `displayName`، `publisherHandle`، `version`، `resolvedFrom`، `tag`، `createdAt`) تا اتوماسیون shell بتواند آن‌ها را بدون باز کردن wrapperهای تو در تو بخواند.
- `security` رأی سطح بالای ClawScan/security است. اتوماسیون باید بر اساس `ok`، `decision`، `reasons`، و `security.status` عمل کند.
- `security.signals` شامل شواهد پشتیبان اسکنر مانند `staticScan`، `virusTotal`، و `skillSpector` است.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- `provenance` فقط زمانی `server-resolved-github-import` است که ClawHub هنگام انتشار یا واردسازی، یک repo/ref/commit/path در GitHub را حل و ذخیره کرده باشد؛ در غیر این صورت `unavailable` است.

### `POST /api/v1/skills/-/security-verdicts`

رأی‌های امنیتی فشرده فعلی را برای نسخه‌های دقیق skill برمی‌گرداند. این
نقطه پایانی مجموعه برای کلاینت‌هایی در نظر گرفته شده است که از قبل می‌دانند کدام نسخه‌های skill نصب‌شده ClawHub را باید نمایش دهند، مانند OpenClaw Control UI.

درخواست:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

نکات:

- `items` باید شامل ۱ تا ۱۰۰ جفت یکتای `{ slug, version }` باشد.
- نتایج برای هر آیتم هستند؛ یک skill یا نسخه گمشده کل پاسخ را ناموفق نمی‌کند.
- پاسخ فقط امنیتی است. داده‌های Skill Card، وضعیت کارت تولیدشده، فهرست فایل‌های artifact، یا بارهای تفصیلی اسکنر را شامل نمی‌شود.
- `security.signals` فقط شامل شواهد پشتیبان در سطح وضعیت است؛ برای جزئیات کامل اسکنر از `/scan` یا صفحه security-audit در ClawHub استفاده کنید.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- نبود Skill Card بر `ok`، `decision`، یا `reasons` این نقطه پایانی اثر نمی‌گذارد؛ کلاینت‌ها وقتی به محتوای کارت نیاز دارند باید `skill-card.md` نصب‌شده را به‌صورت محلی بخوانند.
- وقتی به پاکت راستی‌آزمایی Skill Card برای یک skill نیاز دارید از `/verify`، وقتی به Markdown کارت تولیدشده نیاز دارید از `/card`، و وقتی به داده‌های تفصیلی اسکنر نیاز دارید از `/scan` استفاده کنید.

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

- به‌طور پیش‌فرض از آخرین نسخه استفاده می‌کند.
- محدودیت اندازه فایل: 200KB.

### `GET /api/v1/packages`

نقطه پایانی کاتالوگ یکپارچه برای:

- Skills
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

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured`،
  `highlightedOnly`، یا `sort` مقدار `400` برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار با خانواده ثابت باقی می‌مانند.
- ورودی‌های Skills همچنان بر رجیستری Skills تکیه دارند و هنوز فقط از طریق `POST /api/v1/skills` قابل انتشار هستند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخواننده‌های ناشناس فقط کانال‌های عمومی بسته‌ها را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که عضو آن‌ها هستند در نتایج فهرست/جست‌وجو ببینند.
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
  فیلتر قدیمی v1 زیر `GET /api/v1/plugins` مستند شده‌اند.

یادداشت‌ها:

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured`، یا
  `highlightedOnly` مقدار `400` برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- فراخواننده‌های ناشناس فقط کانال‌های عمومی بسته‌ها را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که عضو آن‌ها هستند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/plugins`

مرور کاتالوگ فقط Plugin در میان بسته‌های code-plugin و bundle-plugin.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `recommended` (پیش‌فرض)، `trending`، `downloads`، `updated`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقادیر فعلی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نام‌های مستعار فیلتر قدیمی v1 همچنان در نقاط پایانی خواندن پذیرفته می‌شوند:

- `mcp-tooling`، `data`، و `automation` به `tools` resolve می‌شوند.
- `observability` و `deployment` به `gateway` resolve می‌شوند.
- `dev-tools` به `runtime` resolve می‌شود.

`trending` جدول رتبه‌بندی نصب/دانلود هفت‌روزه است و از مجموع‌های تمام‌دوره استفاده نمی‌کند.
در نقطه پایانی یکپارچه `/api/v1/packages` فقط مختص Plugin است؛ برای کاتالوگ Skills از
`/api/v1/skills?sort=trending` استفاده کنید.

نام‌های مستعار قدیمی به‌عنوان مقادیر دسته‌بندی ذخیره‌شده یا اعلام‌شده توسط نویسنده پذیرفته نمی‌شوند.

### `GET /api/v1/skills/export`

خروجی‌گیری گروهی از آخرین Skills عمومی برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای پرس‌وجو:

- `startDate` (الزامی): کران پایین بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به skill.
- `endDate` (الزامی): کران بالا بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به skill.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.

پاسخ:

- بدنه: آرشیو ZIP.
- هر skill خروجی‌گیری‌شده در `{publisher}/{slug}/` ریشه دارد.
- Skills میزبانی‌شده شامل آخرین فایل‌های نسخه ذخیره‌شده هستند و در
  `_manifest.json` با `sourceRef: "public-clawhub"` فهرست می‌شوند.
- Skills فعلی پشتیبانی‌شده توسط GitHub که اسکن `clean` یا `suspicious` دارند شامل
  `_source_handoff.json` با `sourceRef: "public-github"`، مخزن، commit، مسیر،
  hash محتوا، و URL آرشیو هستند. آن‌ها فایل‌های منبع میزبانی‌شده در ClawHub را شامل نمی‌شوند.
- هر skill شامل `_export_skill_meta.json` است.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- `_errors.json` زمانی گنجانده می‌شود که Skills یا فایل‌های منفرد قابل
  خروجی‌گیری نبوده باشند.

سرآیندها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

خروجی‌گیری گروهی از آخرین انتشارهای عمومی Plugin برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای کوئری:

- `startDate` (الزامی): کران پایین بر حسب میلی‌ثانیه Unix برای `updatedAt` Plugin.
- `endDate` (الزامی): کران بالا بر حسب میلی‌ثانیه Unix برای `updatedAt` Plugin.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
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

پارامترهای کوئری:

- `q` (الزامی): رشته کوئری
- `limit` (اختیاری): عدد صحیح (1-100)
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقادیر فعلی:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

نکته‌ها:

- نام‌های مستعار فیلتر v1 قدیمی که زیر `GET /api/v1/plugins` مستند شده‌اند نیز
  پذیرفته می‌شوند.
- فیلتر دسته‌بندی یک فیلتر API واقعی است که با ردیف‌های چکیده دسته‌بندی Plugin
  پشتیبانی می‌شود، نه بازنویسی کوئری جست‌وجو.
- نتایج به ترتیب ارتباط برگردانده می‌شوند و در حال حاضر صفحه‌بندی نمی‌شوند.
- کنترل‌های مرتب‌سازی رابط کاربری مرورگر برای جست‌وجوی Plugin نتایج بارگذاری‌شده مرتبط را
  بازمرتب می‌کنند، مطابق با رفتار مرور فعلی `/skills`.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را برمی‌گرداند.

نکته‌ها:

- Skills نیز می‌تواند از طریق این مسیر در کاتالوگ یکپارچه حل شود.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.

نکته‌ها:

- به توکن API برای مالک بسته، مالک/مدیر ناشر سازمانی،
  ناظر پلتفرم، یا مدیر پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه را برمی‌گرداند.

پارامترهای کوئری:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

نکته‌ها:

- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را، شامل فراداده فایل، سازگاری،
تأیید، فراداده artifact، و داده‌های اسکن، برمی‌گرداند.

نکته‌ها:

- `version.artifact.kind` برای آرشیوهای بسته دنیای قدیم `legacy-zip` یا
  برای انتشارهای مبتنی بر ClawPack مقدار `npm-pack` است.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum`، و
  `npmTarballName` هستند.
- `version.sha256hash` فراداده سازگاری منسوخ برای کلاینت‌های قدیمی است. این فیلد
  بایت‌های دقیق ZIP برگردانده‌شده توسط `/api/v1/packages/{name}/download` را هش می‌کند.
  کلاینت‌های مدرن باید از `version.artifact.sha256` استفاده کنند، که
  artifact انتشار کانونی را مشخص می‌کند.
- وقتی داده اسکن وجود داشته باشد، `version.vtAnalysis`، `version.llmAnalysis`، و `version.staticScan`
  گنجانده می‌شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصه دقیق امنیت و اعتماد انتشار بسته را برای کلاینت‌های نصب
برمی‌گرداند. این سطح مصرف عمومی OpenClaw برای تصمیم‌گیری درباره این است که آیا یک
انتشار حل‌شده می‌تواند نصب شود یا نه.

احراز هویت:

- نقطه پایانی خواندن عمومی. به توکن مالک، ناشر، ناظر، یا مدیر
  نیاز نیست.

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
  حل‌شده را مشخص می‌کنند.
- `release.releaseId`، `release.version`، و `release.createdAt`
  انتشار دقیقی را که ارزیابی شده است مشخص می‌کنند.
- `release.artifactKind`، `release.artifactSha256`، `release.npmIntegrity`,
  `release.npmShasum`، و `release.npmTarballName` وقتی برای
  artifact انتشار شناخته شده باشند حضور دارند.
- `trust.scanStatus` وضعیت اعتماد مؤثر است که از ورودی‌های اسکنر
  و نظارت دستی انتشار مشتق شده است.
- `trust.moderationState` می‌تواند null باشد. وقتی هیچ نظارت دستی انتشار
  وجود نداشته باشد `null` است.
- `trust.blockedFromDownload` سیگنال مسدودسازی نصب است. OpenClaw و دیگر
  کلاینت‌های نصب باید وقتی این مقدار `true` است نصب را مسدود کنند، به‌جای اینکه
  قواعد مسدودسازی را دوباره از فیلدهای اسکنر یا نظارت مشتق کنند.
- `trust.reasons` فهرست توضیح رو‌به‌کاربر و حسابرسی است. کدهای دلیل
  رشته‌هایی پایدار و فشرده مانند `manual:quarantined`، `scan:malicious`،
  و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد هنوز در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصه اعتماد از ورودی‌های منسوخ محاسبه شده و
  باید پیش از تصمیم اجازه‌دهی با اطمینان بالا، نیازمند تازه‌سازی تلقی شود.

نکته‌ها:

- این نقطه پایانی دقیقاً وابسته به نسخه است. کلاینت‌ها باید پس از حل نسخه
  بسته‌ای که قصد نصب آن را دارند، آن را فراخوانی کنند، نه صرفاً پس از خواندن آخرین
  فراداده بسته.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.
- این نقطه پایانی عمداً از نقاط پایانی نظارت مالک/ناظر محدودتر است.
  تصمیم نصب و توضیح عمومی را افشا می‌کند، نه
  هویت گزارش‌دهندگان، متن گزارش‌ها، شواهد خصوصی، یا زمان‌بندی‌های بازبینی داخلی.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده حل‌کننده artifact صریح را برای یک نسخه بسته برمی‌گرداند.

نکته‌ها:

- نسخه‌های بسته قدیمی یک artifact از نوع `legacy-zip` و یک
  `downloadUrl` ZIP قدیمی برمی‌گردانند.
- نسخه‌های ClawPack یک artifact از نوع `npm-pack`، فیلدهای integrity مربوط به npm، یک
  `tarballUrl`، و نشانی سازگاری ZIP قدیمی را برمی‌گردانند.
- این سطح حل‌کننده OpenClaw است؛ از حدس‌زدن قالب آرشیو از
  یک URL مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

artifact نسخه را از طریق مسیر حل‌کننده صریح دانلود می‌کند.

نکته‌ها:

- نسخه‌های ClawPack بایت‌های دقیق `.tgz` بارگذاری‌شده npm-pack را استریم می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` هدایت می‌شوند.
- از سطل نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آینده OpenClaw را برمی‌گرداند.

بررسی‌های آمادگی پوشش می‌دهند:

- وضعیت کانال رسمی
- در دسترس بودن آخرین نسخه
- در دسترس بودن artifact npm-pack از ClawPack
- چکیده artifact
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

پارامترهای کوئری:

- `phase` (اختیاری): `planned`، `published`، `clawpack-ready`,
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

نکته‌ها:

- `bundledPluginId` به حروف کوچک نرمال‌سازی می‌شود و کلید upsert پایدار است.
- `packageName` به نام npm نرمال‌سازی می‌شود؛ بسته می‌تواند برای مهاجرت‌های
  برنامه‌ریزی‌شده وجود نداشته باشد.
- این فقط آمادگی مهاجرت را پیگیری می‌کند. OpenClaw را تغییر نمی‌دهد یا
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

نقطه پایانی ناظر/مدیر برای صف‌های بازبینی انتشار بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای کوئری:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

معانی وضعیت:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، لغوشده، یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، لغوشده، یا مخرب.
- `manual`: هر انتشار با بازنویسی نظارت دستی.
- `all`: هر انتشار با بازنویسی دستی، وضعیت اسکن غیرپاک، یا گزارش بسته.

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
به یک نسخه پیوند می‌خورند. آن‌ها صف نظارت را تغذیه می‌کنند اما به‌تنهایی
دانلودها را خودکار پنهان یا مسدود نمی‌کنند؛ ناظران باید از نظارت انتشار برای
تأیید، قرنطینه، یا لغو artifactها استفاده کنند.

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

نقطه پایانی مالک/ناظر برای مشاهده وضعیت نظارت بسته.

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

نقطه پایانی ناظر/مدیر برای حل‌وفصل یا بازگشایی گزارش‌های بسته.

درخواست:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام
تنظیم دوباره `status` به `open` می‌توان آن را حذف کرد. برای اعمال نظارت انتشار در
همان گردش‌کار قابل حسابرسی، همراه با گزارش تاییدشده `finalAction: "quarantine"` یا
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

نقطه پایانی ناظر/مدیر برای بازبینی انتشار بسته.

درخواست:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

وضعیت‌های پشتیبانی‌شده:

- `approved`: به‌صورت دستی بازبینی و مجاز شده است.
- `quarantined`: تا زمان پیگیری مسدود شده است.
- `revoked`: پس از اینکه انتشار قبلا مورد اعتماد بوده، مسدود شده است.

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود مصنوع `403` برمی‌گردانند.
هر تغییر یک ورودی گزارش حسابرسی می‌نویسد.

### `GET /api/v1/packages/{name}/file`

محتوای متن خام را برای یک فایل بسته برمی‌گرداند.

پارامترهای پرس‌وجو:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

یادداشت‌ها:

- پیش‌فرض، آخرین انتشار است.
- از سطل نرخ خواندن استفاده می‌کند، نه سطل دانلود.
- فایل‌های دودویی `415` برمی‌گردانند.
- محدودیت اندازه فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن را مسدود نمی‌کنند؛ انتشارهای مخرب ممکن است همچنان در جای دیگری نگه داشته شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای انتشار یک بسته دانلود می‌کند.

پارامترهای پرس‌وجو:

- `version` (اختیاری)
- `tag` (اختیاری)

یادداشت‌ها:

- پیش‌فرض، آخرین انتشار است.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشه `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP باقی می‌ماند. فایل‌های ClawPack `.tgz` را استریم نمی‌کند.
- پاسخ‌ها سرآیندهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` را برای بررسی‌های یکپارچگی resolver شامل می‌شوند.
- فراداده فقط-رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک packument سازگار با npm را برای نسخه‌های بسته مبتنی بر ClawPack برمی‌گرداند.

یادداشت‌ها:

- فقط نسخه‌هایی که tarballهای ClawPack npm-pack آپلودشده دارند فهرست می‌شوند.
- نسخه‌های قدیمی فقط-ZIP عمدا حذف شده‌اند.
- `dist.tarball`، `dist.integrity`، و `dist.shasum` از فیلدهای سازگار با npm
  استفاده می‌کنند تا کاربران در صورت تمایل بتوانند npm را به آینه اشاره دهند.
- packumentهای بسته scopeدار هم از مسیر درخواست `/api/npm/@scope/name` و هم از مسیر
  کدگذاری‌شده npm یعنی `/api/npm/@scope%2Fname` پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball آپلودشده ClawPack را برای کلاینت‌های آینه npm استریم می‌کند.

یادداشت‌ها:

- از سطل نرخ دانلود استفاده می‌کند.
- سرآیندهای دانلود شامل SHA-256 مربوط به ClawHub به‌همراه فراداده integrity/shasum مربوط به npm هستند.
- بررسی‌های نظارت و دسترسی بسته خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

توسط CLI برای نگاشت یک اثرانگشت محلی به یک نسخه شناخته‌شده استفاده می‌شود.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز 64 نویسه‌ای اثرانگشت bundle

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک ZIP نسخه Skill میزبانی‌شده را دانلود می‌کند، یا برای یک Skill فعلی مبتنی بر GitHub
با اسکن `clean` یا `suspicious` و بدون نسخه میزبانی‌شده، واگذاری منبع GitHub برمی‌گرداند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `version` (اختیاری): رشته semver
- `tag` (اختیاری): نام برچسب (مثلا `latest`)

یادداشت‌ها:

- اگر نه `version` و نه `tag` ارائه نشود، از آخرین نسخه استفاده می‌شود.
- نسخه‌های حذف نرم‌شده `410` برمی‌گردانند.
- واگذاری‌های Skill مبتنی بر GitHub بایت‌ها را پروکسی یا آینه نمی‌کنند. پاسخ JSON
  شامل `sourceRef: "public-github"`، `repo`، `commit`، `path`، `contentHash`،
  و `archiveUrl` است؛ وضعیت اسکن/فعلی یک gate است و به‌عنوان فراداده payload موفقیت
  گنجانده نمی‌شود.
- آمار دانلود به‌عنوان هویت‌های یکتا در هر روز UTC شمرده می‌شود (`userId` وقتی توکن API معتبر است، وگرنه IP).

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
- فیلد اختیاری payload: `ownerHandle`. وقتی حاضر باشد، API آن ناشر را
  سمت سرور resolve می‌کند و از actor می‌خواهد دسترسی ناشر داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` مقدار `true` باشد، یک
  Skill موجود می‌تواند به آن مالک منتقل شود اگر actor روی هر دو ناشر فعلی و هدف
  مدیر/مالک باشد. بدون این opt-in، تغییرات مالک رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت با توکن Bearer نیاز دارد.
- به `multipart/form-data` نیاز دارد.
- فیلدهای مجاز فرم عبارت‌اند از `payload`، blobهای تکرارشونده `files`، یا یک ارجاع tarball
  با نام `clawpack`. `clawpack` می‌تواند یک blob `.tgz` یا یک شناسه storage برگشتی از
  جریان upload-url باشد. انتشارهای مرحله‌بندی‌شده با storage-id باید همچنین
  `clawpackUploadTicket` برگشتی همراه با آن URL آپلود را شامل شوند.
- از `files` یا `clawpack` استفاده کنید، هرگز هر دو را در یک درخواست به‌کار نبرید.
- بدنه‌های JSON و فراداده `payload.files` / `payload.artifact` تامین‌شده توسط فراخواننده
  رد می‌شوند.
- درخواست‌های انتشار multipart مستقیم به 18MB محدود هستند. tarballهای ClawPack می‌توانند
  از جریان upload-url تا سقف tarball برابر با 120MB استفاده کنند.
- فیلد اختیاری payload: `ownerHandle`. وقتی حاضر باشد، فقط مدیران می‌توانند از طرف آن مالک منتشر کنند.

نکات مهم اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. آپلودهای ClawPack `.tgz` باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- code pluginها به `package.json`، فراداده مخزن منبع، فراداده commit منبع،
  فراداده schema پیکربندی، `openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
- فقط ناشر org با نام `openclaw` و ناشران شخصی اعضای فعلی org با نام `openclaw`
  می‌توانند در کانال `official` منتشر کنند.
- انتشارهای ازطرف نیز صلاحیت کانال رسمی را نسبت به حساب مالک هدف اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف نرم / بازیابی یک Skill (مالک، ناظر، یا مدیر).

بدنه JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

وقتی حاضر باشد، `reason` به‌عنوان یادداشت نظارت Skill ذخیره و در گزارش حسابرسی کپی می‌شود.
حذف‌های نرم آغازشده توسط مالک، slug را برای 30 روز رزرو می‌کنند، سپس ناشر دیگری می‌تواند
slug را ادعا کند. وقتی این انقضا اعمال شود، پاسخ حذف شامل `slugReservedUntil` است.
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

فقط مدیر. تضمین می‌کند یک ناشر org برای یک handle وجود دارد. اگر handle همچنان به یک
کاربر مشترک قدیمی/ناشر شخصی اشاره کند، نقطه پایانی ابتدا آن را به یک ناشر org مهاجرت می‌دهد.
برای org تازه‌ساخته‌شده، `memberHandle` را ارائه کنید؛ مدیر اجراکننده به‌عنوان عضو افزوده نمی‌شود.
`memberRole` به‌طور پیش‌فرض `owner` است.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

ایجاد self-serve ناشر org با احراز هویت. یک ناشر org جدید ایجاد می‌کند و
فراخواننده را به‌عنوان مالک اضافه می‌کند. این نقطه پایانی handleهای کاربر/شخصی موجود را مهاجرت نمی‌دهد و
ناشر را trusted/official علامت‌گذاری نمی‌کند.

- بدنه: `{ "handle": "opik", "displayName": "Opik" }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- وقتی handle قبلا توسط یک ناشر، کاربر، یا ناشر شخصی استفاده شده باشد، `409` برمی‌گرداند.

### `POST /api/v1/users/reserve`

فقط مدیر. slugهای ریشه و نام‌های بسته را برای مالک بحق بدون انتشار یک
release رزرو می‌کند. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف release تبدیل می‌شوند، بنابراین همان
مالک می‌تواند بعدا انتشار code-plugin یا bundle-plugin واقعی را در آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

فقط مدیر. یک ناشر شخصی را برای principal جایگزین تاییدشده GitHub OAuth بدون
ویرایش ردیف‌های حساب Convex Auth بازیابی می‌کند. درخواست باید هر دو شناسه تغییرناپذیر حساب
provider مربوط به GitHub را نام ببرد؛ handleهای تغییرپذیر فقط به‌عنوان guard روبه‌روی operator استفاده می‌شوند.

نقطه پایانی به‌طور پیش‌فرض در حالت dry-run است. اعمال بازیابی پس از آن‌که کارکنان به‌طور مستقل تداوم میان هر دو اصل GitHub را تأیید کردند، به `dryRun: false` و
`confirmIdentityVerified: true` نیاز دارد. وقتی ناشر شخصی فعلی کاربر مقصد
Skills، بسته‌ها، یا منابع Skill در GitHub داشته باشد، بازیابی به‌صورت fail-closed شکست می‌خورد.
بازیابی همچنین فیلدهای قدیمی `ownerUserId` را برای Skills ناشر بازیابی‌شده،
نام‌های مستعار slug مربوط به Skill، بسته‌ها، هشدارهای بازرس بسته، و ردیف‌های مشتق‌شده digest جست‌وجو مهاجرت می‌دهد تا
مسیرهای مالک مستقیم با اختیار ناشر جدید هم‌خوان باشند. یک رزرو فعال protected-handle
برای handle بازیابی‌شده نیز به کاربر جایگزین تخصیص داده می‌شود تا همگام‌سازی بعدی
پروفایل نتواند اختیار رقیب کاربر قبلی را بازگرداند. هر جدول اصلی در هر تراکنش اعمال به
۱۰۰ ردیف محدود است؛ بازیابی‌های بزرگ‌تر باید ابتدا از مهاجرت مالک قابل ازسرگیری استفاده کنند.
منابع Skill در GitHub محدود به ناشر هستند و به‌جای بازنویسی، به‌صورت بررسی‌شده گزارش می‌شوند.

- بدنه: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- پاسخ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط پایانی مدیریت slug مالک

- `POST /api/v1/skills/{slug}/rename`
  - بدنه: `{ "newSlug": "new-canonical-slug" }`
  - پاسخ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - بدنه: `{ "targetSlug": "canonical-target-slug" }`
  - پاسخ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

نکات:

- هر دو نقطه پایانی به احراز هویت با توکن API نیاز دارند و فقط برای مالک Skill کار می‌کنند.
- `rename`، slug قبلی را به‌عنوان نام مستعار تغییرمسیر حفظ می‌کند.
- `merge`، فهرست مبدأ را پنهان می‌کند و slug مبدأ را به فهرست مقصد تغییرمسیر می‌دهد.

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

یک کاربر را مسدود کنید و Skills متعلق به او را hard-delete کنید (فقط moderator/admin).

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

مسدودسازی یک کاربر را بردارید و Skills واجد شرایط را بازیابی کنید (فقط admin).

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

دلیل ذخیره‌شده برای یک مسدودسازی موجود را بدون برداشتن مسدودسازی یا بازیابی
محتوا تغییر دهید (فقط admin). مگر آن‌که `dryRun` برابر `false` باشد، پیش‌فرض dry-run است.

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

نقش یک کاربر را تغییر دهید (فقط admin).

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

کاربران را فهرست یا جست‌وجو کنید (فقط admin).

پارامترهای query:

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

یک ستاره (برجسته‌سازی) اضافه/حذف کنید. هر دو نقطه پایانی idempotent هستند.

پاسخ‌ها:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقاط پایانی قدیمی CLI (منسوخ‌شده)

همچنان برای نسخه‌های قدیمی‌تر CLI پشتیبانی می‌شود:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

برای برنامه حذف، `DEPRECATIONS.md` را ببینید.

`POST /api/cli/upload-url`، `uploadUrl` و `uploadTicket` را برمی‌گرداند. انتشار بسته‌هایی
که یک tarball از ClawPack را مرحله‌بندی می‌کنند باید شناسه storage حاصل را به‌عنوان
`clawpack` و ticket برگشتی را به‌عنوان `clawpackUploadTicket` ارسال کنند.

## کشف registry (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات registry/auth را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر self-host می‌کنید، این فایل را ارائه کنید (یا `CLAWHUB_REGISTRY` را صراحتاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی است).
