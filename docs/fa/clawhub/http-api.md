---
read_when:
    - افزودن/تغییر endpointها
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API HTTP (عمومی + نقاط پایانی CLI + احراز هویت).
x-i18n:
    generated_at: "2026-06-28T20:41:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL پایه: `https://clawhub.ai` (پیش‌فرض).

همه مسیرهای v1 زیر `/api/v1/...` هستند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی می‌مانند (به `DEPRECATIONS.md` مراجعه کنید).
OpenAPI: `/api/v1/openapi.json`.

## استفاده مجدد از کاتالوگ عمومی

دایرکتوری‌های شخص ثالث می‌توانند از نقاط پایانی خواندن عمومی برای فهرست‌کردن یا جستجوی Skills در ClawHub استفاده کنند. لطفاً نتایج را cache کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست canonical در ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) برگردانید، و از القای تأیید سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای مخفی، خصوصی، یا مسدودشده توسط moderation را بیرون از سطح API عمومی mirror کنید.

میان‌برهای slug وب در سراسر خانواده‌های registry resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی تقدم route، از URLهای canonical برگشتی از نقاط پایانی خواندن استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال:

- درخواست‌های ناشناس: به ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (token معتبر Bearer): به ازای bucket کاربر اعمال می‌شود.
- اگر token وجود نداشته باشد/نامعتبر باشد، رفتار به اعمال بر اساس IP برمی‌گردد.
- نقاط پایانی نوشتن احراز هویت‌شده وقتی سرور دلیل را می‌داند نباید یک `Unauthorized` خام برگردانند. tokenهای مفقود، tokenهای نامعتبر/revoked، و حساب‌های حذف‌شده/banned/disabled باید هرکدام متن قابل اقدام دریافت کنند تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی آن‌ها را مسدود کرده است.

- خواندن: 3000/min به ازای هر IP، 12000/min به ازای هر key
- نوشتن: 300/min به ازای هر IP، 3000/min به ازای هر key
- دانلود: 1200/min به ازای هر IP، 6000/min به ازای هر key (نقاط پایانی دانلود)

Headers:

- سازگاری قدیمی: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`, `RateLimit-Reset`
- روی `429`: `X-RateLimit-Remaining: 0` و `RateLimit-Remaining: 0`
- روی `429`: `Retry-After`

معنای Headerها:

- `X-RateLimit-Reset`: ثانیه‌های epoch یونیکس مطلق
- `RateLimit-Reset`: ثانیه تا reset (delay)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجه باقی‌مانده دقیق وقتی وجود داشته باشد.
  درخواست‌های موفق sharded این header را حذف می‌کنند، به‌جای اینکه مقدار global تقریبی برگردانند.
- `Retry-After`: تعداد ثانیه‌های انتظار پیش از retry (delay) روی `429`

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

- اگر `Retry-After` وجود دارد، پیش از retry همان تعداد ثانیه صبر کنید.
- برای جلوگیری از retryهای همگام، از backoff همراه با jitter استفاده کنید.
- اگر `Retry-After` وجود ندارد، به `RateLimit-Reset` fallback کنید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- از headerهای IP کلاینت مورد اعتماد، از جمله `cf-connecting-ip`، فقط وقتی استفاده می‌کند که deployment به‌صورت صریح headerهای forwarded مورد اعتماد را فعال کرده باشد.
- ClawHub از headerهای forwarding مورد اعتماد برای شناسایی IP کلاینت در edge استفاده می‌کند.
- اگر IP کلاینت مورد اعتماد در دسترس نباشد، درخواست‌های ناشناس از bucketهای fallback استفاده می‌کنند که فقط بر اساس نوع rate-limit scoped هستند. این bucketهای fallback شامل pathها، slugها، نام packageها، versionها، query stringها، یا سایر پارامترهای artifact ارائه‌شده توسط caller نمی‌شوند.

## پاسخ‌های خطا

پاسخ‌های خطای عمومی v1 متن ساده با `content-type: text/plain; charset=utf-8` هستند.
این شامل شکست‌های validation (`400`)، منابع عمومی مفقود (`404`)، شکست‌های auth و permission (`401`/`403`)، محدودیت‌های نرخ (`429`)، و دانلودهای مسدودشده است. کلاینت‌ها باید بدنه پاسخ را به‌عنوان رشته‌ای خواندنی برای انسان بخوانند. پارامترهای query ناشناخته برای سازگاری نادیده گرفته می‌شوند، اما پارامترهای query شناخته‌شده با مقدارهای نامعتبر `400` برمی‌گردانند.

## نقاط پایانی عمومی (بدون auth)

### `GET /api/v1/search`

پارامترهای Query:

- `q` (الزامی): رشته query
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): `true` برای filter کردن به Skills برجسته
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

نکته‌ها:

- نتایج به‌ترتیب ارتباط برگردانده می‌شوند (شباهت embedding + تقویت token دقیق slug/name + یک prior کوچک محبوبیت).
- ارتباط از محبوبیت قوی‌تر است. یک تطابق دقیق token در slug یا display-name می‌تواند از تطابقی آزادتر با engagement بسیار بیشتر رتبه بالاتری بگیرد.
- متن ASCII روی مرزهای کلمه و نشانه‌گذاری token می‌شود. برای مثال، `personal-map` شامل یک token مستقل `map` است، در حالی که `amap-jsapi-skill` شامل `amap`، `jsapi` و `skill` است؛ بنابراین جستجو برای `map` به `personal-map` تطابق واژگانی قوی‌تری نسبت به `amap-jsapi-skill` می‌دهد.
- محبوبیت با log مقیاس‌بندی و capped می‌شود. Skills با engagement بالا وقتی متن query تطابق ضعیف‌تری دارد ممکن است رتبه پایین‌تری بگیرند.
- وضعیت moderation مشکوک یا مخفی می‌تواند بسته به filterهای caller و وضعیت فعلی moderation، یک Skill را از جستجوی عمومی حذف کند.

راهنمای discoverability برای ناشر:

- عبارت‌هایی را که کاربران به‌صورت لفظی جستجو خواهند کرد در display name، summary و tags بگذارید. فقط وقتی از token مستقل slug استفاده کنید که همان یک هویت پایدار نیز هست که می‌خواهید نگه دارید.
- فقط برای دنبال‌کردن یک query، slug را rename نکنید مگر اینکه slug جدید نام canonical بلندمدت بهتری باشد. slugهای قدیمی به aliasهای redirect تبدیل می‌شوند، اما URL canonical، slug نمایش‌داده‌شده، و digestهای جستجوی آینده از slug جدید استفاده می‌کنند.
- aliasهای rename برای URLهای قدیمی و installهایی که از طریق registry resolve می‌شوند resolution را حفظ می‌کنند، اما رتبه‌بندی جستجو پس از index شدن rename بر اساس metadata canonical مهارت است. stats موجود با مهارت باقی می‌مانند.
- اگر یک مهارت به‌طور غیرمنتظره نامرئی است، پیش از تغییر metadata مرتبط با رتبه‌بندی، ابتدا وضعیت moderation را با `clawhub inspect @owner/slug` در حالت logged in بررسی کنید.

### `GET /api/v1/skills`

پارامترهای Query:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): cursor صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended` (alias: `default`)، `createdAt` (alias: `newest`)، `downloads`، `stars` (alias: `rating`)، aliasهای install قدیمی `installsCurrent`/`installs`/`installsAllTime` به `downloads` map می‌شوند، `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن Skills مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): alias قدیمی برای `nonSuspiciousOnly`

مقادیر نامعتبر `sort` مقدار `400` برمی‌گردانند.

نکته‌ها:

- `recommended` از سیگنال‌های engagement و تازگی استفاده می‌کند.
- `trending` بر اساس installها در 7 روز گذشته رتبه‌بندی می‌کند (بر پایه telemetry).
- `createdAt` برای crawlهای مهارت جدید پایدار است؛ `updated` وقتی Skills موجود دوباره publish می‌شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true`، sortهای cursor-based ممکن است در یک page تعداد آیتم‌های کمتری از `limit` برگردانند، زیرا Skills مشکوک پس از بازیابی page filter می‌شوند.
- وقتی `nextCursor` وجود دارد، از آن برای ادامه صفحه‌بندی استفاده کنید. یک page کوتاه به‌تنهایی به معنای پایان نتایج نیست.

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
- `metadata.systems`: هدف‌های سیستم Nix (مثلاً `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد `null`.
- اگر مهارت metadata پلتفرم نداشته باشد، `metadata` مقدار `null` است.
- `moderation` فقط وقتی گنجانده می‌شود که مهارت flagged باشد یا مالک در حال مشاهده آن باشد.

### `GET /api/v1/skills/{slug}/moderation`

وضعیت ساختاریافته moderation را برمی‌گرداند.

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

- مالکان و moderatorها می‌توانند به جزئیات moderation برای Skills مخفی دسترسی داشته باشند.
- callerهای عمومی فقط برای Skills مرئی‌ای که از قبل flagged شده‌اند `200` دریافت می‌کنند.
- Evidence برای callerهای عمومی redacted می‌شود و فقط برای مالکان/moderatorها شامل snippetهای خام است.

### `POST /api/v1/skills/{slug}/report`

یک مهارت را برای بررسی moderator گزارش کنید. گزارش‌ها در سطح مهارت هستند، می‌توانند به‌صورت اختیاری به یک version پیوند داشته باشند، و صف گزارش مهارت را تغذیه می‌کنند.

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

نقطه پایانی moderator/admin برای دریافت گزارش‌های مهارت.

پارامترهای Query:

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

نقطه پایانی moderator/admin برای resolve کردن یا بازکردن دوباره گزارش‌های مهارت.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام تنظیم دوباره `status` به `open` می‌تواند حذف شود. برای پنهان‌کردن مهارت در همان workflow قابل audit، همراه یک گزارش triaged مقدار `finalAction: "hide"` را بفرستید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای Query:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): cursor صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

metadata نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` در صورت موجود بودن، وضعیت normalized scan verification و جزئیات scanner را شامل می‌شود
  (VirusTotal + LLM).

### `GET /api/v1/skills/{slug}/scan`

جزئیات security scan verification برای یک version از مهارت را برمی‌گرداند.

پارامترهای Query:

- `version` (اختیاری): رشته version مشخص.
- `tag` (اختیاری): resolve کردن یک version tagشده (برای مثال `latest`).

نکته‌ها:

- اگر نه `version` و نه `tag` ارائه شده باشد، از آخرین نسخه استفاده می‌کند.
- وضعیت راستی‌آزمایی نرمال‌شده به‌همراه جزئیات مخصوص اسکنر را شامل می‌شود.
- `security.hasScanResult` فقط زمانی `true` است که یک اسکنر حکم قطعی تولید کرده باشد (`clean`، `suspicious`، یا `malicious`).
- `moderation` یک نمای لحظه‌ای فعلی از مدیریت محتوا در سطح مهارت است که از آخرین نسخه مشتق شده است.
- هنگام پرس‌وجوی یک نسخه تاریخی، پیش از هم‌زمینه دانستن نسخه `moderation` و `security`، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

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

- محموله‌های درخواست اسکن و گزارش‌های قابل دانلود پس از بازه نگهداری از مخزن درخواست اسکن منقضی می‌شوند.
- اسکن‌های منتشرشده به دسترسی مدیریتی مالک/ناشر، یا اختیار ناظر/مدیر پلتفرم نیاز دارند.
- اسکن‌های منتشرشده فقط وقتی `update: true` باشد و اسکن با موفقیت کامل شود، بازنویسی می‌کنند.
- پاسخ `202` با `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` است.
- کارهای اسکن ناهمگام هستند. درخواست‌های اسکن دستی جلوتر از کارهای عادی انتشار/بازپرکنی اولویت‌بندی می‌شوند، اما تکمیل همچنان به دردسترس بودن worker وابسته است.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطه پایانی polling احراز هویت‌شده برای یک اسکن ارسال‌شده.

- وضعیت queued/running/succeeded/failed را برمی‌گرداند.
- هنگام در صف بودن، `queue.queuedAhead` و `queue.position` را برمی‌گرداند تا کلاینت‌ها بتوانند نشان دهند چند اسکن دستی اولویت‌دار جلوتر از درخواست قرار دارد. صف‌های بسیار بزرگ محدود می‌شوند و با `queuedAheadIsEstimate: true` گزارش می‌شوند.
- در صورت دردسترس بودن، `report` بخش‌های `clawscan`، `skillspector`، `staticAnalysis` و `virustotal` را دربر دارد.
- کارهای اسکن ناموفق `status: "failed"` را همراه با `lastError` برمی‌گردانند.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطه پایانی آرشیو گزارش احراز هویت‌شده.

- به یک اسکن موفق نیاز دارد؛ اسکن‌های غیرنهایی `409` برمی‌گردانند.
- یک ZIP شامل `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json` و `README.md` برمی‌گرداند.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطه پایانی آرشیو گزارش ذخیره‌شده احراز هویت‌شده برای نسخه‌های ارسال‌شده.

- به دسترسی مدیریتی مالک/ناشر به مهارت یا Plugin، یا اختیار ناظر/مدیر پلتفرم نیاز دارد.
- نتایج اسکن ذخیره‌شده را برای نسخه دقیق ارسال‌شده، شامل نسخه‌های مسدودشده یا پنهان، برمی‌گرداند.
- `kind` به‌طور پیش‌فرض `skill` است؛ برای اسکن‌های plugin/package از `kind=plugin` استفاده کنید.
- همان شکل ZIP دانلودهای درخواست اسکن را برمی‌گرداند.

### `POST /api/v1/skills/-/scan/batch`

مسیر بازاسکن دسته‌ای canonical فقط برای مدیر. همان شکل محموله legacy `POST /api/v1/skills/-/rescan-batch` را می‌پذیرد.

### `POST /api/v1/skills/-/scan/batch/status`

مسیر وضعیت دسته‌ای canonical فقط برای مدیر. `{ "jobIds": ["..."] }` را می‌پذیرد و همان شمارنده‌های تجمیعی legacy `POST /api/v1/skills/-/rescan-batch/status` را برمی‌گرداند.

### `GET /api/v1/skills/{slug}/verify`

envelope راستی‌آزمایی Skill Card را که توسط `clawhub skill verify` استفاده می‌شود برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): یک نسخه برچسب‌خورده را resolve می‌کند (برای مثال `latest`).

نکات:

- `ok` فقط زمانی `true` است که نسخه انتخاب‌شده یک Skill Card تولیدشده داشته باشد، توسط مدیریت محتوا به‌عنوان malware مسدود نشده باشد، و راستی‌آزمایی ClawScan پاک باشد.
- هویت مهارت، هویت ناشر و فراداده نسخه انتخاب‌شده فیلدهای سطح بالای envelope هستند (`slug`، `displayName`، `publisherHandle`، `version`، `resolvedFrom`، `tag`، `createdAt`) تا اتوماسیون shell بتواند آن‌ها را بدون باز کردن wrapperهای تو در تو بخواند.
- `security` حکم سطح بالای ClawScan/امنیت است. اتوماسیون باید بر اساس `ok`، `decision`، `reasons` و `security.status` عمل کند.
- `security.signals` شواهد پشتیبان اسکنر مانند `staticScan`، `virusTotal` و `skillSpector` را دربر دارد.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود dependency registry بازنشسته شده و این کلید همیشه `null` است.
- `provenance` فقط زمانی `server-resolved-github-import` است که ClawHub هنگام انتشار یا import یک repo/ref/commit/path گیت‌هاب را resolve و ذخیره کرده باشد؛ در غیر این صورت `unavailable` است.

### `POST /api/v1/skills/-/security-verdicts`

حکم‌های امنیتی فشرده فعلی را برای نسخه‌های دقیق مهارت برمی‌گرداند. این
نقطه پایانی مجموعه برای کلاینت‌هایی در نظر گرفته شده است که از قبل می‌دانند کدام نسخه‌های مهارت نصب‌شده
ClawHub را باید نمایش دهند، مانند OpenClaw Control UI.

درخواست:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

نکات:

- `items` باید شامل 1 تا 100 جفت یکتای `{ slug, version }` باشد.
- نتایج برای هر آیتم جداگانه‌اند؛ نبود یک مهارت یا نسخه، کل پاسخ را ناموفق نمی‌کند.
- پاسخ فقط امنیتی است. داده Skill Card، وضعیت کارت تولیدشده، فهرست فایل‌های artifact یا محموله‌های تفصیلی اسکنر را شامل نمی‌شود.
- `security.signals` فقط شواهد پشتیبان در سطح وضعیت را شامل می‌شود؛ برای جزئیات کامل اسکنر از `/scan` یا صفحه security-audit در ClawHub استفاده کنید.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود dependency registry بازنشسته شده و این کلید همیشه `null` است.
- نبود Skill Card بر `ok`، `decision` یا `reasons` این نقطه پایانی اثر نمی‌گذارد؛ وقتی کلاینت‌ها به محتوای کارت نیاز دارند باید `skill-card.md` نصب‌شده را به‌صورت محلی بخوانند.
- وقتی به envelope راستی‌آزمایی Skill Card برای یک مهارت نیاز دارید از `/verify` استفاده کنید، وقتی به markdown کارت تولیدشده نیاز دارید از `/card`، و وقتی به داده تفصیلی اسکنر نیاز دارید از `/scan`.

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

پارامترهای کوئری:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- به‌طور پیش‌فرض از آخرین نسخه استفاده می‌کند.
- محدودیت اندازه فایل: 200KB.

### `GET /api/v1/packages`

نقطه پایانی کاتالوگ یکپارچه برای:

- skills
- Pluginهای کد
- Pluginهای بسته‌ای

پارامترهای کوئری:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended`، `trending`، `downloads`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins`، یا نقاط پایانی بسته با
  `family=code-plugin`/`family=bundle-plugin`). دسته‌های کنترل‌شده و
  نام‌های مستعار فیلتر قدیمی v1 زیر `GET /api/v1/plugins` مستند شده‌اند.

نکته‌ها:

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured`،
  `highlightedOnly` یا `sort` مقدار `400` برمی‌گردانند. پارامترهای کوئری ناشناخته نادیده گرفته می‌شوند.
- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار با خانواده ثابت باقی می‌مانند.
- ورودی‌های Skill همچنان با رجیستری Skill پشتیبانی می‌شوند و هنوز فقط از طریق `POST /api/v1/skills` قابل انتشار هستند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخوان‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخوان‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند در نتایج فهرست/جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/packages/search`

جست‌وجوی کاتالوگ یکپارچه در سراسر Skills + بسته‌های Plugin.

پارامترهای کوئری:

- `q` (الزامی): رشته کوئری
- `limit` (اختیاری): عدد صحیح (1–100)
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد. دسته‌های کنترل‌شده و نام‌های مستعار
  فیلتر قدیمی v1 زیر `GET /api/v1/plugins` مستند شده‌اند.

نکته‌ها:

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured` یا
  `highlightedOnly` مقدار `400` برمی‌گردانند. پارامترهای کوئری ناشناخته نادیده گرفته می‌شوند.
- فراخوان‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخوان‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/plugins`

مرور کاتالوگ فقط مخصوص Pluginها در میان بسته‌های code-plugin و bundle-plugin.

پارامترهای کوئری:

- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `recommended` (پیش‌فرض)، `trending`، `downloads`، `updated`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته Plugin. مقادیر فعلی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نام‌های مستعار فیلتر قدیمی v1 همچنان در نقاط پایانی خواندن پذیرفته می‌شوند:

- `mcp-tooling`، `data` و `automation` به `tools` حل می‌شوند.
- `observability` و `deployment` به `gateway` حل می‌شوند.
- `dev-tools` به `runtime` حل می‌شود.

`trending` جدول رتبه‌بندی نصب/دانلود هفت‌روزه است و از مجموع‌های همه‌زمانی استفاده نمی‌کند.
در نقطه پایانی یکپارچه `/api/v1/packages` فقط مخصوص Plugin است؛ برای کاتالوگ Skill از
`/api/v1/skills?sort=trending` استفاده کنید.

نام‌های مستعار قدیمی به‌عنوان مقادیر دسته ذخیره‌شده یا اعلام‌شده توسط نویسنده پذیرفته نمی‌شوند.

### `GET /api/v1/skills/export`

خروجی‌گیری گروهی از آخرین Skills عمومی برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای کوئری:

- `startDate` (الزامی): کران پایین میلی‌ثانیه‌های یونیکس برای `updatedAt` مهارت.
- `endDate` (الزامی): کران بالای میلی‌ثانیه‌های یونیکس برای `updatedAt` مهارت.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.

پاسخ:

- بدنه: آرشیو ZIP.
- هر Skill خروجی‌گرفته‌شده در `{publisher}/{slug}/` ریشه دارد.
- Skills میزبانی‌شده شامل فایل‌های آخرین نسخه ذخیره‌شده هستند و در
  `_manifest.json` با `sourceRef: "public-clawhub"` فهرست می‌شوند.
- Skills فعلی مبتنی بر GitHub با اسکن `clean` یا `suspicious` شامل
  `_source_handoff.json` با `sourceRef: "public-github"`، مخزن، کامیت، مسیر،
  هش محتوا و URL آرشیو هستند. آن‌ها فایل‌های منبع میزبانی‌شده در ClawHub را شامل نمی‌شوند.
- هر Skill شامل `_export_skill_meta.json` است.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- وقتی Skillها یا فایل‌های جداگانه امکان خروجی‌گیری نداشته باشند،
  `_errors.json` گنجانده می‌شود.

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

پارامترهای پرس‌وجو:

- `startDate` (الزامی): کران پایین به میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `endDate` (الزامی): کران بالا به میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.
- `family` (اختیاری): `code-plugin` یا `bundle-plugin`. حذف آن به‌معنای هر دو
  خانواده Plugin است.

پاسخ:

- بدنه: آرشیو ZIP.
- ریشه هر Plugin صادرشده در `{family}/{packageName}/` قرار دارد.
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

پارامترهای پرس‌وجو:

- `q` (الزامی): رشته پرس‌وجو
- `limit` (اختیاری): عدد صحیح (1-100)
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقادیر فعلی:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

نکته‌ها:

- نام‌های مستعار قدیمی فیلتر v1 که زیر `GET /api/v1/plugins` مستند شده‌اند نیز
  پذیرفته می‌شوند.
- فیلتر کردن دسته‌بندی یک فیلتر واقعی API است که با ردیف‌های چکیده دسته‌بندی
  Plugin پشتیبانی می‌شود، نه بازنویسی پرس‌وجوی جست‌وجو.
- نتایج به ترتیب مرتبط بودن بازگردانده می‌شوند و در حال حاضر صفحه‌بندی نمی‌شوند.
- کنترل‌های مرتب‌سازی UI مرورگر برای جست‌وجوی Plugin، نتایج مرتبط بودن بارگذاری‌شده را
  دوباره مرتب می‌کنند و با رفتار مرور فعلی `/skills` مطابقت دارند.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را بازمی‌گرداند.

نکته‌ها:

- Skills نیز می‌توانند در کاتالوگ یکپارچه از طریق این مسیر resolve شوند.
- بسته‌های خصوصی `404` بازمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارها را به‌صورت نرم حذف می‌کند.

نکته‌ها:

- به توکن API برای مالک بسته، مالک/مدیر ناشر سازمانی، ناظر پلتفرم، یا مدیر پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه‌ها را بازمی‌گرداند.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

نکته‌ها:

- بسته‌های خصوصی `404` بازمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را، شامل فراداده فایل، سازگاری، راستی‌آزمایی،
فراداده artifact، و داده‌های اسکن، بازمی‌گرداند.

نکته‌ها:

- `version.artifact.kind` برای آرشیوهای بسته قدیمی `legacy-zip` یا
  برای انتشارهای پشتیبانی‌شده با ClawPack برابر `npm-pack` است.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum`، و
  `npmTarballName` هستند.
- `version.sha256hash` فراداده سازگاری منسوخ برای کلاینت‌های قدیمی است. این مقدار
  بایت‌های دقیق ZIP بازگردانده‌شده توسط `/api/v1/packages/{name}/download` را hash می‌کند.
  کلاینت‌های مدرن باید از `version.artifact.sha256` استفاده کنند، که
  artifact انتشار canonical را شناسایی می‌کند.
- `version.vtAnalysis`، `version.llmAnalysis`، و `version.staticScan` زمانی
  گنجانده می‌شوند که داده اسکن وجود داشته باشد.
- بسته‌های خصوصی `404` بازمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصه دقیق امنیت و اعتماد انتشار بسته را برای کلاینت‌های نصب بازمی‌گرداند.
این سطح مصرف عمومی OpenClaw برای تصمیم‌گیری درباره قابل نصب بودن یک
انتشار resolveشده است.

احراز هویت:

- نقطه پایانی خواندن عمومی. به توکن مالک، ناشر، ناظر، یا مدیر
  نیازی نیست.

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
- `release.releaseId`، `release.version`، و `release.createdAt` انتشار دقیقی را
  شناسایی می‌کنند که ارزیابی شده است.
- `release.artifactKind`، `release.artifactSha256`، `release.npmIntegrity`،
  `release.npmShasum`، و `release.npmTarballName` زمانی وجود دارند که برای
  artifact انتشار شناخته‌شده باشند.
- `trust.scanStatus` وضعیت اعتماد مؤثر است که از ورودی‌های اسکنر
  و نظارت دستی انتشار مشتق شده است.
- `trust.moderationState` می‌تواند null باشد. وقتی هیچ نظارت دستی انتشاری
  وجود نداشته باشد، مقدار آن `null` است.
- `trust.blockedFromDownload` سیگنال مسدودسازی نصب است. OpenClaw و سایر
  کلاینت‌های نصب باید وقتی این مقدار `true` است نصب را مسدود کنند، به‌جای اینکه
  قوانین مسدودسازی را از فیلدهای اسکنر یا نظارت دوباره مشتق کنند.
- `trust.reasons` فهرست توضیح کاربرمحور و حسابرسی است. کدهای دلیل
  رشته‌های پایدار و فشرده‌ای مانند `manual:quarantined`، `scan:malicious`،
  و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد هنوز در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصه اعتماد از ورودی‌های قدیمی محاسبه شده و
  باید پیش از تصمیم اجازه با اطمینان بالا، نیازمند تازه‌سازی تلقی شود.

نکته‌ها:

- این نقطه پایانی دقیقاً وابسته به نسخه است. کلاینت‌ها باید پس از resolve کردن
  نسخه بسته‌ای که قصد نصب آن را دارند آن را فراخوانی کنند، نه فقط پس از خواندن
  آخرین فراداده بسته.
- بسته‌های خصوصی `404` بازمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.
- این نقطه پایانی عمداً از نقاط پایانی نظارت مالک/ناظر محدودتر است.
  تصمیم نصب و توضیح عمومی را افشا می‌کند، نه هویت گزارش‌دهندگان،
  متن گزارش‌ها، شواهد خصوصی، یا زمان‌بندی‌های بررسی داخلی.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده resolver صریح artifact را برای یک نسخه بسته بازمی‌گرداند.

نکته‌ها:

- نسخه‌های قدیمی بسته یک artifact از نوع `legacy-zip` و یک
  `downloadUrl` قدیمی بازمی‌گردانند.
- نسخه‌های ClawPack یک artifact از نوع `npm-pack`، فیلدهای integrity مربوط به npm، یک
  `tarballUrl`، و URL سازگاری ZIP قدیمی را بازمی‌گردانند.
- این سطح resolver در OpenClaw است؛ از حدس زدن قالب آرشیو از
  یک URL مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

artifact نسخه را از طریق مسیر resolver صریح دانلود می‌کند.

نکته‌ها:

- نسخه‌های ClawPack بایت‌های دقیق `.tgz` بارگذاری‌شده npm-pack را stream می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` redirect می‌شوند.
- از bucket نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آینده OpenClaw را بازمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر است:

- وضعیت کانال رسمی
- در دسترس بودن آخرین نسخه
- در دسترس بودن artifact از نوع npm-pack در ClawPack
- چکیده artifact
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

- `bundledPluginId` به حروف کوچک normalize می‌شود و کلید upsert پایدار است.
- `packageName` به نام npm normalize می‌شود؛ بسته می‌تواند برای مهاجرت‌های برنامه‌ریزی‌شده
  موجود نباشد.
- این فقط آمادگی مهاجرت را پیگیری می‌کند. OpenClaw را mutate نمی‌کند و
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

نقطه پایانی ناظر/مدیر برای صف‌های بررسی انتشار بسته.

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
- `all`: هر انتشاری با override دستی، وضعیت اسکن غیرپاک، یا گزارش بسته.

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
به یک نسخه پیوند داده می‌شوند. آن‌ها صف نظارت را تغذیه می‌کنند اما به‌تنهایی
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

نقطهٔ پایانی ناظر/مدیر برای دریافت گزارش بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای کوئری:

- `status` (اختیاری): `open` (پیش‌فرض)، `confirmed`، `dismissed` یا `all`
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

- به توکن API برای مالک بسته، عضو ناشر، ناظر یا
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
بازگرداندن `status` به `open` می‌توان آن را حذف کرد. برای اعمال نظارت انتشار در همان
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
- `quarantined`: تا زمان پیگیری بعدی مسدود شده است.
- `revoked`: پس از آنکه یک انتشار قبلاً مورد اعتماد بوده، مسدود شده است.

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود آرتیفکت `403` برمی‌گردانند.
هر تغییر یک ورودی گزارش ممیزی می‌نویسد.

### `GET /api/v1/packages/{name}/file`

محتوای متنی خام یک فایل بسته را برمی‌گرداند.

پارامترهای کوئری:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض، آخرین انتشار است.
- از باکت نرخ خواندن استفاده می‌کند، نه باکت دانلود.
- فایل‌های باینری `415` برمی‌گردانند.
- محدودیت اندازهٔ فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن را مسدود نمی‌کنند؛ انتشارهای مخرب ممکن است همچنان در جای دیگری نگه داشته شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای یک انتشار بسته دانلود می‌کند.

پارامترهای کوئری:

- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض، آخرین انتشار است.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشهٔ `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP می‌ماند. فایل‌های ClawPack با پسوند `.tgz` را استریم نمی‌کند.
- پاسخ‌ها برای بررسی یکپارچگی resolver شامل سرآیندهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` هستند.
- فرادادهٔ فقط رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

برای نسخه‌های بستهٔ مبتنی بر ClawPack، یک packument سازگار با npm برمی‌گرداند.

نکته‌ها:

- فقط نسخه‌هایی که تاربال‌های npm-pack از ClawPack برای آن‌ها بارگذاری شده‌اند فهرست می‌شوند.
- نسخه‌های قدیمیِ فقط ZIP عمداً حذف می‌شوند.
- `dist.tarball`، `dist.integrity` و `dist.shasum` از فیلدهای سازگار با npm
  استفاده می‌کنند تا کاربران در صورت تمایل بتوانند npm را به mirror اشاره دهند.
- packumentهای بستهٔ scoped هم از `/api/npm/@scope/name` و هم از مسیر درخواست
  کدگذاری‌شدهٔ npm یعنی `/api/npm/@scope%2Fname` پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق تاربال ClawPack بارگذاری‌شده را برای کلاینت‌های mirror npm استریم می‌کند.

نکته‌ها:

- از باکت نرخ دانلود استفاده می‌کند.
- سرآیندهای دانلود شامل SHA-256 مربوط به ClawHub به‌همراه فرادادهٔ integrity/shasum مربوط به npm هستند.
- بررسی‌های نظارت و دسترسی بستهٔ خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

CLI از آن برای نگاشت یک اثرانگشت محلی به یک نسخهٔ شناخته‌شده استفاده می‌کند.

پارامترهای کوئری:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز ۶۴ کاراکتری از اثرانگشت باندل

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک ZIP از نسخهٔ Skills میزبانی‌شده را دانلود می‌کند، یا برای یک Skills فعلیِ مبتنی بر GitHub
با اسکن `clean` یا `suspicious` و بدون نسخهٔ میزبانی‌شده، واگذاری منبع GitHub را برمی‌گرداند.

پارامترهای کوئری:

- `slug` (الزامی)
- `version` (اختیاری): رشتهٔ semver
- `tag` (اختیاری): نام تگ (مثلاً `latest`)

نکته‌ها:

- اگر نه `version` و نه `tag` ارائه شود، آخرین نسخه استفاده می‌شود.
- نسخه‌های soft-delete شده `410` برمی‌گردانند.
- واگذاری‌های Skills مبتنی بر GitHub بایت‌ها را proxy یا mirror نمی‌کنند. پاسخ JSON
  شامل `sourceRef: "public-github"`، `repo`، `commit`، `path`، `contentHash`
  و `archiveUrl` است؛ وضعیت اسکن/فعلی یک gate است و به‌عنوان فرادادهٔ payload موفقیت
  گنجانده نمی‌شود.
- آمار دانلود به‌عنوان هویت‌های یکتا در هر روز UTC شمرده می‌شود (`userId` وقتی توکن API معتبر است، در غیر این صورت IP).

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
- بدنهٔ JSON با `files` مبتنی بر storageId نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، API آن
  ناشر را سمت سرور resolve می‌کند و از actor دسترسی ناشر می‌خواهد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` مقدار `true` باشد، یک
  Skills موجود می‌تواند به آن مالک منتقل شود، اگر actor روی هر دو ناشر فعلی
  و هدف admin/owner باشد. بدون این opt-in، تغییرات مالک
  رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت با توکن Bearer نیاز دارد.
- به `multipart/form-data` نیاز دارد.
- فیلدهای مجاز فرم `payload`، blobهای تکرارشوندهٔ `files`، یا یک ارجاع تاربال `clawpack`
  هستند. `clawpack` می‌تواند blob با پسوند `.tgz` یا یک شناسهٔ ذخیره‌سازی باشد که توسط
  جریان upload-url برگردانده شده است. انتشارهای staged با storage-id باید
  `clawpackUploadTicket` برگشتی همراه آن URL بارگذاری را نیز شامل شوند.
- یا از `files` استفاده کنید یا از `clawpack`، هرگز هر دو را در یک درخواست استفاده نکنید.
- بدنه‌های JSON و فرادادهٔ `payload.files` / `payload.artifact`
  تأمین‌شده توسط فراخواننده رد می‌شوند.
- درخواست‌های انتشار multipart مستقیم به 18MB محدود هستند. تاربال‌های ClawPack می‌توانند
  از جریان upload-url تا سقف تاربال 120MB استفاده کنند.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، فقط مدیران می‌توانند به نمایندگی از آن مالک منتشر کنند.

نکات برجستهٔ اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های ClawPack با پسوند `.tgz` باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- code-pluginها به `package.json`، فرادادهٔ مخزن منبع، فرادادهٔ commit منبع،
  فرادادهٔ schema پیکربندی، `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فرادادهٔ اختیاری هستند.
- فقط ناشر سازمان `openclaw` و ناشران شخصی اعضای فعلی سازمان `openclaw`
  می‌توانند در کانال `official` منتشر کنند.
- انتشارهای به‌نمایندگی همچنان شایستگی کانال رسمی را نسبت به حساب مالک هدف اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

soft-delete / بازیابی یک Skills (مالک، ناظر یا مدیر).

بدنهٔ JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

وقتی وجود داشته باشد، `reason` به‌عنوان یادداشت نظارت Skills ذخیره می‌شود و در گزارش ممیزی کپی می‌شود.
soft deleteهای آغازشده توسط مالک، slug را برای ۳۰ روز رزرو می‌کنند، سپس ناشر دیگری می‌تواند
آن slug را مطالبه کند. پاسخ حذف وقتی این انقضا اعمال شود شامل `slugReservedUntil` است.
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

فقط مدیر. تضمین می‌کند برای یک handle، ناشر سازمان وجود داشته باشد. اگر handle هنوز به یک
کاربر مشترک قدیمی/ناشر شخصی اشاره کند، نقطهٔ پایانی ابتدا آن را به یک ناشر سازمان منتقل می‌کند.
برای سازمان تازه‌ساخته‌شده، `memberHandle` را ارائه کنید؛ مدیرِ اجراکننده به‌عنوان عضو اضافه نمی‌شود.
`memberRole` به‌صورت پیش‌فرض `owner` است.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

ایجاد self-serve ناشر سازمان برای کاربر احراز هویت‌شده. یک ناشر سازمان جدید ایجاد می‌کند و
فراخواننده را به‌عنوان مالک اضافه می‌کند. این نقطهٔ پایانی handleهای کاربر/شخصی موجود را منتقل نمی‌کند و
ناشر را trusted/official علامت‌گذاری نمی‌کند.

- بدنه: `{ "handle": "opik", "displayName": "Opik" }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- وقتی handle قبلاً توسط یک ناشر، کاربر یا ناشر شخصی استفاده شده باشد، `409` برمی‌گرداند.

### `POST /api/v1/users/reserve`

فقط مدیر. slugهای ریشه و نام‌های بسته را برای مالک بحق، بدون انتشار
release رزرو می‌کند. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف release تبدیل می‌شوند، تا همان
مالک بتواند بعداً release واقعی code-plugin یا bundle-plugin را با آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

فقط مدیر. یک ناشر شخصی را برای principal جایگزین و تأییدشدهٔ GitHub OAuth
بدون ویرایش ردیف‌های حساب Convex Auth بازیابی می‌کند. درخواست باید هر دو شناسهٔ تغییرناپذیر حساب
provider مربوط به GitHub را نام ببرد؛ handleهای تغییرپذیر فقط به‌عنوان guard روبه‌روی operator استفاده می‌شوند.

نقطه پایانی به‌طور پیش‌فرض روی اجرای آزمایشی تنظیم است. اعمال بازیابی پس از آنکه کارکنان به‌طور مستقل تداوم بین هر دو اصل GitHub را تأیید کردند، به `dryRun: false` و
`confirmIdentityVerified: true` نیاز دارد. وقتی ناشر شخصی فعلی کاربر مقصد مهارت‌ها، بسته‌ها، یا منابع مهارت GitHub داشته باشد، بازیابی در حالت بسته شکست می‌خورد.
بازیابی همچنین فیلدهای قدیمی `ownerUserId` را برای مهارت‌های ناشر بازیابی‌شده،
نام‌های مستعار slug مهارت، بسته‌ها، هشدارهای بازرس بسته، و ردیف‌های خلاصه جست‌وجوی مشتق‌شده مهاجرت می‌دهد تا
مسیرهای مالک مستقیم با مرجع ناشر جدید هم‌خوان باشند. یک رزرو handle محافظت‌شده فعال
برای handle بازیابی‌شده نیز دوباره به کاربر جایگزین اختصاص داده می‌شود تا همگام‌سازی بعدی
نمایه نتواند مرجع رقیب کاربر قبلی را بازیابی کند. هر جدول اصلی در هر تراکنش اعمال به
100 ردیف محدود است؛ بازیابی‌های بزرگ‌تر ابتدا باید از مهاجرت مالک ازسرگرفتنی استفاده کنند.
منابع مهارت GitHub در محدوده ناشر هستند و به‌جای بازنویسی، به‌عنوان بررسی‌شده گزارش می‌شوند.

- بدنه: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- پاسخ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقاط پایانی مدیریت slug مالک

- `POST /api/v1/skills/{slug}/rename`
  - بدنه: `{ "newSlug": "new-canonical-slug" }`
  - پاسخ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - بدنه: `{ "targetSlug": "canonical-target-slug" }`
  - پاسخ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

یادداشت‌ها:

- هر دو نقطه پایانی به احراز هویت با توکن API نیاز دارند و فقط برای مالک مهارت کار می‌کنند.
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

مسدود کردن یک کاربر و حذف سخت مهارت‌های تحت مالکیت او (فقط ناظر/مدیر).

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

رفع مسدودی یک کاربر و بازیابی مهارت‌های واجد شرایط (فقط مدیر).

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

تغییر دلیل ذخیره‌شده برای یک مسدودی موجود بدون رفع مسدودی یا بازیابی
محتوا (فقط مدیر). مگر اینکه `dryRun` برابر `false` باشد، به‌طور پیش‌فرض اجرای آزمایشی است.

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

تغییر نقش یک کاربر (فقط مدیر).

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

پارامترهای پرس‌وجو:

- `q` (اختیاری): پرس‌وجوی جست‌وجو
- `query` (اختیاری): نام مستعار برای `q`
- `limit` (اختیاری): حداکثر نتایج (پیش‌فرض 20، حداکثر 200)

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

افزودن/برداشتن یک ستاره (برجسته‌سازی‌ها). هر دو نقطه پایانی idempotent هستند.

پاسخ‌ها:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقاط پایانی قدیمی CLI (منسوخ)

هنوز برای نسخه‌های قدیمی‌تر CLI پشتیبانی می‌شوند:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

برای برنامه حذف، `DEPRECATIONS.md` را ببینید.

`POST /api/cli/upload-url`، `uploadUrl` و `uploadTicket` را برمی‌گرداند. انتشارهای بسته‌ای
که یک tarball از ClawPack را مرحله‌بندی می‌کنند، باید شناسه ذخیره‌سازی حاصل را به‌عنوان
`clawpack` و ticket بازگشتی را به‌عنوان `clawpackUploadTicket` ارسال کنند.

## کشف رجیستری (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات رجیستری/احراز هویت را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

طرحواره:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر خودمیزبانی می‌کنید، این فایل را ارائه کنید (یا `CLAWHUB_REGISTRY` را صراحتاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی).
