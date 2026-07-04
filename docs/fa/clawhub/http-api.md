---
read_when:
    - افزودن/تغییر endpointها
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API HTTP (نقاط پایانی عمومی + نقاط پایانی CLI + احراز هویت).
x-i18n:
    generated_at: "2026-07-04T10:50:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API ‏HTTP

نشانی پایه: `https://clawhub.ai` (پیش‌فرض).

همهٔ مسیرهای v1 زیر `/api/v1/...` هستند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی می‌مانند (رجوع کنید به `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## استفادهٔ دوباره از فهرست عمومی

فهرست‌های شخص ثالث می‌توانند از نقاط پایانی خواندنی عمومی برای فهرست‌کردن یا جست‌وجوی مهارت‌های ClawHub استفاده کنند. لطفاً نتایج را cache کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست رسمی ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) پیوند دهید، و از القای تأیید سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای پنهان، خصوصی، یا مسدودشده توسط moderation را خارج از سطح API عمومی mirror کنید.

میان‌برهای slug وب در خانواده‌های registry resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی تقدم route، از URLهای رسمی برگشتی توسط نقاط پایانی خواندنی استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (Bearer token معتبر): به‌ازای bucket کاربر اعمال می‌شود.
- اگر token موجود نباشد یا نامعتبر باشد، رفتار به اعمال بر اساس IP برمی‌گردد.
- نقاط پایانی نوشتن احراز هویت‌شده وقتی سرور دلیل را می‌داند نباید یک `Unauthorized` خالی برگردانند. tokenهای مفقود، نامعتبر/لغوشده، و حساب‌های حذف‌شده/ممنوع‌شده/غیرفعال‌شده باید هرکدام متن قابل اقدام دریافت کنند تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی آن‌ها را مسدود کرده است.

- خواندن: 3000/min به‌ازای هر IP، 12000/min به‌ازای هر key
- نوشتن: 300/min به‌ازای هر IP، 3000/min به‌ازای هر key
- دانلود: 1200/min به‌ازای هر IP، 6000/min به‌ازای هر key (نقاط پایانی دانلود)

Headerها:

- سازگاری قدیمی: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`, `RateLimit-Reset`
- روی `429`: `X-RateLimit-Remaining: 0` و `RateLimit-Remaining: 0`
- روی `429`: `Retry-After`

معنای Headerها:

- `X-RateLimit-Reset`: ثانیه‌های مطلق Unix epoch
- `RateLimit-Reset`: ثانیه تا reset (تأخیر)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجهٔ باقی‌ماندهٔ دقیق، وقتی حاضر باشد.
  درخواست‌های موفق sharded این header را حذف می‌کنند، به‌جای اینکه یک مقدار تقریبی سراسری برگردانند.
- `Retry-After`: ثانیه‌هایی که پیش از تلاش دوباره باید صبر کرد (تأخیر) روی `429`

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

- اگر `Retry-After` وجود دارد، پیش از تلاش دوباره همان تعداد ثانیه صبر کنید.
- برای جلوگیری از تلاش‌های دوبارهٔ هم‌زمان، از backoff همراه با jitter استفاده کنید.
- اگر `Retry-After` موجود نیست، به `RateLimit-Reset` برگردید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- فقط وقتی deployment صراحتاً headerهای forwarded مورد اعتماد را فعال کرده باشد، از headerهای IP کلاینت مورد اعتماد، از جمله `cf-connecting-ip`، استفاده می‌کند.
- ClawHub از headerهای forwarding مورد اعتماد برای شناسایی IPهای کلاینت در edge استفاده می‌کند.
- اگر IP کلاینت مورد اعتماد در دسترس نباشد، درخواست‌های ناشناس از bucketهای fallback استفاده می‌کنند که فقط بر اساس نوع rate-limit scoped شده‌اند. این bucketهای fallback شامل مسیرها، slugها، نام‌های package، نسخه‌ها، query stringها، یا سایر پارامترهای artifact ارسال‌شده توسط caller نمی‌شوند.

## پاسخ‌های خطا

پاسخ‌های خطای عمومی v1 متن ساده با `content-type: text/plain; charset=utf-8` هستند.
این شامل شکست‌های اعتبارسنجی (`400`)، منابع عمومی مفقود (`404`)، شکست‌های احراز هویت و مجوز (`401`/`403`)، محدودیت‌های نرخ (`429`)، و دانلودهای مسدودشده است. کلاینت‌ها باید بدنهٔ پاسخ را به‌عنوان رشته‌ای خوانا برای انسان بخوانند. پارامترهای query ناشناخته برای سازگاری نادیده گرفته می‌شوند، اما پارامترهای query شناخته‌شده با مقادیر نامعتبر `400` برمی‌گردانند.

## نقاط پایانی عمومی (بدون auth)

### `GET /api/v1/search`

پارامترهای query:

- `q` (الزامی): رشتهٔ query
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): `true` برای filter کردن به مهارت‌های برجسته
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن مهارت‌های مشکوک (`flagged.suspicious`)
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

یادداشت‌ها:

- نتایج به‌ترتیب ارتباط برگردانده می‌شوند (شباهت embedding + تقویت‌های token دقیق slug/name + یک prior کوچک محبوبیت).
- ارتباط از محبوبیت قوی‌تر است. تطابق دقیق token مربوط به slug یا display-name می‌تواند از تطابق آزادتر با engagement بسیار قوی‌تر بالاتر رتبه بگیرد.
- متن ASCII روی مرزهای واژه و نشانه‌گذاری tokenized می‌شود. برای مثال، `personal-map` شامل token مستقل `map` است، در حالی که `amap-jsapi-skill` شامل `amap`، `jsapi` و `skill` است؛ بنابراین جست‌وجوی `map` به `personal-map` تطابق lexical قوی‌تری نسبت به `amap-jsapi-skill` می‌دهد.
- محبوبیت log-scaled و capped است. مهارت‌های با engagement بالا وقتی متن query تطابق ضعیف‌تری داشته باشد می‌توانند پایین‌تر رتبه بگیرند.
- وضعیت moderation مشکوک یا پنهان می‌تواند بسته به filterهای caller و وضعیت فعلی moderation، یک مهارت را از جست‌وجوی عمومی حذف کند.

راهنمای discoverability برای ناشر:

- اصطلاحاتی را که کاربران دقیقاً جست‌وجو خواهند کرد در display name، summary، و tags قرار دهید. فقط وقتی از token مستقل slug استفاده کنید که همچنین هویت پایداری باشد که می‌خواهید نگه دارید.
- یک slug را فقط برای دنبال‌کردن یک query تغییر نام ندهید، مگر اینکه slug جدید نام رسمی بلندمدت بهتری باشد. slugهای قدیمی به aliasهای redirect تبدیل می‌شوند، اما URL رسمی، slug نمایش‌داده‌شده، و digestهای جست‌وجوی آینده از slug جدید استفاده می‌کنند.
- aliasهای rename، resolution را برای URLهای قدیمی و installهایی که از طریق registry resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو پس از indexed شدن rename بر اساس metadata رسمی مهارت است. آمار موجود با مهارت باقی می‌ماند.
- اگر یک مهارت به‌طور غیرمنتظره نامرئی است، پیش از تغییر metadata مرتبط با رتبه‌بندی، ابتدا هنگام ورود، وضعیت moderation را با `clawhub inspect @owner/slug` بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): cursor صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended` (alias: `default`)، `createdAt` (alias: `newest`)، `downloads`، `stars` (alias: `rating`)، aliasهای install قدیمی `installsCurrent`/`installs`/`installsAllTime` به `downloads` نگاشت می‌شوند، `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن مهارت‌های مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): alias قدیمی برای `nonSuspiciousOnly`

مقادیر نامعتبر `sort` مقدار `400` برمی‌گردانند.

یادداشت‌ها:

- `recommended` از سیگنال‌های engagement و تازگی استفاده می‌کند.
- `trending` بر اساس installهای 7 روز گذشته رتبه‌بندی می‌کند (مبتنی بر telemetry).
- `createdAt` برای crawlهای مهارت جدید پایدار است؛ `updated` وقتی مهارت‌های موجود دوباره منتشر می‌شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` باشد، sortهای مبتنی بر cursor ممکن است در یک صفحه کمتر از `limit` مورد برگردانند، چون مهارت‌های مشکوک پس از بازیابی صفحه filter می‌شوند.
- وقتی `nextCursor` حاضر است، برای ادامهٔ صفحه‌بندی از آن استفاده کنید. یک صفحهٔ کوتاه به‌تنهایی به‌معنای پایان نتایج نیست.

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

- slugهای قدیمی ایجادشده توسط جریان‌های rename/merge مالک به مهارت رسمی resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter مهارت (مثلاً `["macos"]`، `["linux"]`). اگر اعلام نشده باشد `null`.
- `metadata.systems`: هدف‌های Nix system (مثلاً `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد `null`.
- اگر مهارت metadata پلتفرم نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط وقتی گنجانده می‌شود که مهارت flagged باشد یا مالک در حال مشاهدهٔ آن باشد.

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

یادداشت‌ها:

- مالکان و moderators می‌توانند به جزئیات moderation برای مهارت‌های پنهان دسترسی داشته باشند.
- callerهای عمومی فقط برای مهارت‌های visible که از قبل flagged شده‌اند `200` دریافت می‌کنند.
- Evidence برای callerهای عمومی redacted می‌شود و فقط برای مالکان/moderators شامل snippetهای خام است.

### `POST /api/v1/skills/{slug}/report`

یک مهارت را برای بررسی moderator گزارش کنید. گزارش‌ها در سطح مهارت هستند، به‌صورت اختیاری به یک نسخه پیوند می‌خورند، و queue گزارش مهارت را تغذیه می‌کنند.

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

نقطه پایانی moderator/admin برای دریافت گزارش‌های مهارت.

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

نقطه پایانی moderator/admin برای حل‌کردن یا بازگشایی گزارش‌های مهارت.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام تنظیم دوبارهٔ `status` به `open` می‌توان آن را حذف کرد. برای پنهان‌کردن مهارت در همان workflow قابل audit، همراه با یک گزارش triaged مقدار `finalAction: "hide"` را ارسال کنید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): cursor صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

metadata نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` شامل وضعیت normalized scan verification و جزئیات scanner است
  (VirusTotal + LLM)، وقتی در دسترس باشد.

### `GET /api/v1/skills/{slug}/scan`

جزئیات security scan verification را برای یک نسخهٔ مهارت برمی‌گرداند.

پارامترهای query:

- `version` (اختیاری): رشتهٔ نسخهٔ مشخص.
- `tag` (اختیاری): resolve کردن یک نسخهٔ tagged (برای مثال `latest`).

یادداشت‌ها:

- اگر هیچ‌کدام از `version` یا `tag` ارائه نشود، از آخرین نسخه استفاده می‌کند.
- وضعیت راستی‌آزمایی نرمال‌شده به‌همراه جزئیات مخصوص اسکنر را شامل می‌شود.
- `security.hasScanResult` فقط زمانی `true` است که یک اسکنر رأی قطعی تولید کرده باشد (`clean`، `suspicious`، یا `malicious`).
- `moderation` یک نمای فعلی از نظارت در سطح مهارت است که از آخرین نسخه مشتق شده است.
- هنگام پرس‌وجوی یک نسخه تاریخی، پیش از اینکه `moderation` و `security` را متعلق به یک زمینه نسخه یکسان در نظر بگیرید، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

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

نکته‌ها:

- بارهای درخواست اسکن و گزارش‌های قابل دانلود پس از پنجره نگهداری از ذخیره‌گاه درخواست اسکن منقضی می‌شوند.
- اسکن‌های منتشرشده به دسترسی مدیریتی مالک/ناشر، یا اختیار ناظر/مدیر پلتفرم نیاز دارند.
- اسکن‌های منتشرشده فقط زمانی بازنویسی می‌شوند که `update: true` باشد و اسکن با موفقیت کامل شود.
- پاسخ `202` با `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` است.
- کارهای اسکن ناهمگام هستند. درخواست‌های اسکن دستی جلوتر از کار عادی انتشار/پرکردن مجدد اولویت‌بندی می‌شوند، اما تکمیل همچنان به در دسترس بودن ورکر وابسته است.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطه پایانی نظرسنجی احراز هویت‌شده برای یک اسکن ارسال‌شده.

- وضعیت در صف/در حال اجرا/موفق/ناموفق را برمی‌گرداند.
- هنگام در صف بودن، `queue.queuedAhead` و `queue.position` را برمی‌گرداند تا کلاینت‌ها بتوانند نشان دهند چند اسکن دستی اولویت‌دار جلوتر از درخواست قرار دارند. صف‌های بسیار بزرگ محدود می‌شوند و با `queuedAheadIsEstimate: true` گزارش می‌شوند.
- در صورت موجود بودن، `report` شامل بخش‌های `clawscan`، `skillspector`، `staticAnalysis` و `virustotal` است.
- کارهای اسکن ناموفق `status: "failed"` را همراه با `lastError` برمی‌گردانند.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطه پایانی بایگانی گزارش احراز هویت‌شده.

- به یک اسکن موفق نیاز دارد؛ اسکن‌های غیرپایانی `409` برمی‌گردانند.
- یک ZIP با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json` و `README.md` برمی‌گرداند.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطه پایانی بایگانی گزارش ذخیره‌شده احراز هویت‌شده برای نسخه‌های ارسال‌شده.

- به دسترسی مدیریتی مالک/ناشر به مهارت یا Plugin، یا اختیار ناظر/مدیر پلتفرم نیاز دارد.
- نتایج اسکن ذخیره‌شده را برای نسخه دقیق ارسال‌شده، شامل نسخه‌های مسدود یا پنهان، برمی‌گرداند.
- مقدار پیش‌فرض `kind` برابر `skill` است؛ برای اسکن‌های Plugin/بسته از `kind=plugin` استفاده کنید.
- همان شکل ZIP دانلودهای درخواست اسکن را برمی‌گرداند.

### `POST /api/v1/skills/-/scan/batch`

مسیر بازاسکن دسته‌ای رسمی فقط ویژه مدیر. همان شکل بار را می‌پذیرد که `POST /api/v1/skills/-/rescan-batch` قدیمی می‌پذیرفت.

### `POST /api/v1/skills/-/scan/batch/status`

مسیر وضعیت دسته‌ای رسمی فقط ویژه مدیر. `{ "jobIds": ["..."] }` را می‌پذیرد و همان شمارنده‌های تجمیعی را برمی‌گرداند که `POST /api/v1/skills/-/rescan-batch/status` قدیمی برمی‌گرداند.

### `GET /api/v1/skills/{slug}/verify`

پاکت راستی‌آزمایی کارت مهارت را که توسط `clawhub skill verify` استفاده می‌شود برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): یک نسخه برچسب‌خورده را resolve می‌کند (برای مثال `latest`).

نکته‌ها:

- `ok` فقط زمانی `true` است که نسخه انتخاب‌شده یک کارت مهارت تولیدشده داشته باشد، توسط نظارت به‌عنوان بدافزار مسدود نشده باشد، و راستی‌آزمایی ClawScan پاک باشد.
- هویت مهارت، هویت ناشر، و فراداده نسخه انتخاب‌شده فیلدهای سطح بالای پاکت هستند (`slug`، `displayName`، `publisherHandle`، `version`، `resolvedFrom`، `tag`، `createdAt`) تا اتوماسیون shell بتواند آن‌ها را بدون باز کردن wrapperهای تودرتو بخواند.
- `security` رأی سطح بالای ClawScan/امنیت است. اتوماسیون باید بر اساس `ok`، `decision`، `reasons` و `security.status` کلید بزند.
- `security.signals` شامل شواهد پشتیبان اسکنر مانند `staticScan`، `virusTotal` و `skillSpector` است.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 نگه داشته شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- `provenance` فقط زمانی `server-resolved-github-import` است که ClawHub هنگام انتشار یا وارد کردن، repo/ref/commit/path مربوط به GitHub را resolve و ذخیره کرده باشد؛ در غیر این صورت `unavailable` است.

### `POST /api/v1/skills/-/security-verdicts`

رأی‌های امنیتی فشرده فعلی را برای نسخه‌های دقیق مهارت برمی‌گرداند. این
نقطه پایانی مجموعه برای کلاینت‌هایی در نظر گرفته شده که از قبل می‌دانند کدام نسخه‌های مهارت
ClawHub نصب‌شده را باید نمایش دهند، مانند OpenClaw Control UI.

درخواست:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

نکته‌ها:

- `items` باید شامل 1 تا 100 جفت یکتای `{ slug, version }` باشد.
- نتایج به‌ازای هر آیتم هستند؛ نبودن یک مهارت یا نسخه کل پاسخ را ناموفق نمی‌کند.
- پاسخ فقط امنیتی است. داده کارت مهارت، وضعیت کارت تولیدشده، فهرست فایل‌های مصنوعه، یا بارهای تفصیلی اسکنر را شامل نمی‌شود.
- `security.signals` فقط شامل شواهد پشتیبان در سطح وضعیت است؛ برای جزئیات کامل اسکنر از `/scan` یا صفحه ممیزی امنیت ClawHub استفاده کنید.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 نگه داشته شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- نبود کارت مهارت بر `ok`، `decision` یا `reasons` این نقطه پایانی اثر نمی‌گذارد؛ کلاینت‌ها زمانی که به محتوای کارت نیاز دارند باید `skill-card.md` نصب‌شده را به‌صورت محلی بخوانند.
- زمانی از `/verify` استفاده کنید که به پاکت راستی‌آزمایی کارت مهارت تک‌مهارتی نیاز دارید، زمانی از `/card` که به markdown کارت تولیدشده نیاز دارید، و زمانی از `/scan` که به داده تفصیلی اسکنر نیاز دارید.

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

نکات:

- به‌طور پیش‌فرض از آخرین نسخه استفاده می‌کند.
- محدودیت اندازه فایل: 200KB.

### `GET /api/v1/packages`

نقطه پایانی کاتالوگ یکپارچه برای:

- Skills
- Pluginهای کد
- Pluginهای بسته‌ای

پارامترهای کوئری:

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
  نام‌های مستعار فیلتر قدیمی v1 زیر `GET /api/v1/plugins` مستند شده‌اند.

نکات:

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured`،
  `highlightedOnly`، یا `sort` مقدار `400` برمی‌گردانند. پارامترهای کوئری ناشناخته نادیده گرفته می‌شوند.
- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار با خانواده ثابت هستند.
- ورودی‌های Skill همچنان بر رجیستری Skill متکی می‌مانند و هنوز فقط از طریق `POST /api/v1/skills` قابل انتشار هستند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخواننده‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند در نتایج فهرست/جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/packages/search`

جست‌وجوی کاتالوگ یکپارچه در سراسر Skills + بسته‌های Plugin.

پارامترهای کوئری:

- `q` (الزامی): رشته کوئری
- `limit` (اختیاری): عدد صحیح (1–100)
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد. دسته‌بندی‌های کنترل‌شده و نام‌های مستعار
  فیلتر قدیمی v1 زیر `GET /api/v1/plugins` مستند شده‌اند.

نکات:

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured`، یا
  `highlightedOnly` مقدار `400` برمی‌گردانند. پارامترهای کوئری ناشناخته نادیده گرفته می‌شوند.
- فراخواننده‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/plugins`

مرور کاتالوگ فقط مخصوص Plugin در میان بسته‌های code-plugin و bundle-plugin.

پارامترهای کوئری:

- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `recommended` (پیش‌فرض)، `trending`، `downloads`، `updated`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقادیر فعلی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نام‌های مستعار فیلتر قدیمی v1 همچنان در نقاط پایانی خواندن پذیرفته می‌شوند:

- `mcp-tooling`، `data`، و `automation` به `tools` تبدیل می‌شوند.
- `observability` و `deployment` به `gateway` تبدیل می‌شوند.
- `dev-tools` به `runtime` تبدیل می‌شود.

`trending` یک جدول رتبه‌بندی نصب/دانلود هفت‌روزه است و از مجموع‌های همه‌زمانی استفاده نمی‌کند.
در نقطه پایانی یکپارچه `/api/v1/packages` فقط مخصوص Plugin است؛ برای کاتالوگ Skill از
`/api/v1/skills?sort=trending` استفاده کنید.

نام‌های مستعار قدیمی به‌عنوان مقادیر دسته‌بندی ذخیره‌شده یا اعلام‌شده توسط نویسنده پذیرفته نمی‌شوند.

### `GET /api/v1/skills/export`

خروجی انبوه از آخرین Skills عمومی برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای کوئری:

- `startDate` (الزامی): کران پایین بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به Skill.
- `endDate` (الزامی): کران بالای بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به Skill.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی از پاسخ قبلی.

پاسخ:

- بدنه: آرشیو ZIP.
- ریشه هر Skill خروجی‌گرفته‌شده در `{publisher}/{slug}/` است.
- Skills میزبانی‌شده شامل آخرین فایل‌های نسخه ذخیره‌شده هستند و در
  `_manifest.json` با `sourceRef: "public-clawhub"` فهرست می‌شوند.
- Skills فعلی متکی بر GitHub که اسکن `clean` یا `suspicious` دارند، شامل
  `_source_handoff.json` با `sourceRef: "public-github"`، مخزن، کامیت، مسیر،
  هش محتوا، و URL آرشیو هستند. آن‌ها فایل‌های منبع میزبانی‌شده در ClawHub را شامل نمی‌شوند.
- هر Skill شامل `_export_skill_meta.json` است.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- وقتی Skills یا فایل‌های جداگانه قابل خروجی گرفتن نباشند، `_errors.json` گنجانده می‌شود.

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

پارامترهای کوئری:

- `startDate` (الزامی): کران پایین بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `endDate` (الزامی): کران بالا بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی از پاسخ قبلی.
- `family` (اختیاری): `code-plugin` یا `bundle-plugin`. حذف آن یعنی هر دو
  خانواده Plugin.

پاسخ:

- بدنه: آرشیو ZIP.
- ریشه هر Plugin صادرشده در `{family}/{packageName}/` قرار دارد.
- هر Plugin صادرشده شامل فایل‌های ذخیره‌شده آخرین انتشار است.
- فراداده صدور برای هر Plugin در
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` ذخیره می‌شود.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- وقتی Pluginها یا فایل‌های منفرد قابل صدور نبوده‌اند، `_errors.json` گنجانده
  می‌شود.

هدرها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

جست‌وجوی فقط Plugin در میان بسته‌های code-plugin و bundle-plugin.

پارامترهای کوئری:

- `q` (الزامی): رشته کوئری
- `limit` (اختیاری): عدد صحیح (1-100)
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته Plugin. مقادیر فعلی:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

یادداشت‌ها:

- نام‌های مستعار فیلتر قدیمی v1 که زیر `GET /api/v1/plugins` مستند شده‌اند نیز
  پذیرفته می‌شوند.
- فیلتر کردن دسته یک فیلتر واقعی API است که به ردیف‌های خلاصه دسته Plugin متکی
  است، نه بازنویسی کوئری جست‌وجو.
- نتایج به ترتیب مرتبط بودن بازگردانده می‌شوند و در حال حاضر صفحه‌بندی ندارند.
- کنترل‌های مرتب‌سازی رابط مرورگر برای جست‌وجوی Plugin نتایج مرتبط بودن بارگذاری‌شده را
  دوباره مرتب می‌کنند و با رفتار مرور فعلی `/skills` همخوان هستند.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را بازمی‌گرداند.

یادداشت‌ها:

- Skills نیز می‌تواند از طریق این مسیر در کاتالوگ یکپارچه resolve شود.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.

یادداشت‌ها:

- به توکن API برای مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم، یا مدیر پلتفرم
  نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه را بازمی‌گرداند.

پارامترهای کوئری:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

یادداشت‌ها:

- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را شامل فراداده فایل، سازگاری، راستی‌آزمایی،
فراداده artifact و داده‌های اسکن بازمی‌گرداند.

یادداشت‌ها:

- `version.artifact.kind` برای آرشیوهای بسته دنیای قدیم `legacy-zip` یا برای
  انتشارهای مبتنی بر ClawPack برابر `npm-pack` است.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`, `npmShasum` و
  `npmTarballName` هستند.
- `version.sha256hash` فراداده سازگاری منسوخ برای کلاینت‌های قدیمی است. این مقدار
  بایت‌های دقیق ZIP بازگشتی از `/api/v1/packages/{name}/download` را هش می‌کند.
  کلاینت‌های مدرن باید از `version.artifact.sha256` استفاده کنند که artifact
  انتشار کانونی را شناسایی می‌کند.
- `version.vtAnalysis`, `version.llmAnalysis` و `version.staticScan` وقتی داده اسکن
  وجود داشته باشد گنجانده می‌شوند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصه دقیق امنیت و اعتماد انتشار بسته را برای کلاینت‌های نصب بازمی‌گرداند. این
سطح مصرف عمومی OpenClaw برای تصمیم‌گیری درباره این است که آیا یک انتشار resolve‌شده
قابل نصب است یا نه.

احراز هویت:

- نقطه پایانی خواندن عمومی. هیچ توکن مالک، ناشر، ناظر یا مدیر لازم نیست.

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

- `package.name`, `package.displayName` و `package.family` بسته رجیستری resolve‌شده
  را شناسایی می‌کنند.
- `release.releaseId`, `release.version` و `release.createdAt` انتشار دقیق ارزیابی‌شده
  را شناسایی می‌کنند.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` و `release.npmTarballName` وقتی برای artifact انتشار معلوم
  باشند وجود دارند.
- `trust.scanStatus` وضعیت اعتماد مؤثر است که از ورودی‌های اسکنر و نظارت دستی
  انتشار مشتق شده است.
- `trust.moderationState` می‌تواند null باشد. وقتی هیچ نظارت دستی انتشار وجود
  نداشته باشد `null` است.
- `trust.blockedFromDownload` سیگنال مسدودسازی نصب است. OpenClaw و سایر کلاینت‌های
  نصب باید وقتی این مقدار `true` است نصب را مسدود کنند، نه اینکه قوانین مسدودسازی
  را دوباره از فیلدهای اسکنر یا نظارت استخراج کنند.
- `trust.reasons` فهرست توضیح برای کاربر و ممیزی است. کدهای دلیل رشته‌هایی پایدار
  و فشرده مانند `manual:quarantined`, `scan:malicious` و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد هنوز در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصه اعتماد از ورودی‌های منقضی محاسبه شده و پیش از تصمیم
  اجازه با اطمینان بالا باید نیازمند تازه‌سازی تلقی شود.

یادداشت‌ها:

- این نقطه پایانی دقیقاً به نسخه مربوط است. کلاینت‌ها باید آن را پس از resolve کردن
  نسخه بسته‌ای که قصد نصب آن را دارند فراخوانی کنند، نه صرفاً پس از خواندن آخرین
  فراداده بسته.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.
- این نقطه پایانی عمداً از نقاط پایانی نظارت مالک/ناظر محدودتر است. تصمیم نصب و
  توضیح عمومی را افشا می‌کند، نه هویت گزارش‌دهندگان، متن گزارش‌ها، شواهد خصوصی یا
  جدول‌های زمانی بررسی داخلی.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده resolver صریح artifact را برای یک نسخه بسته بازمی‌گرداند.

یادداشت‌ها:

- نسخه‌های بسته قدیمی یک artifact از نوع `legacy-zip` و یک `downloadUrl` قدیمی ZIP
  بازمی‌گردانند.
- نسخه‌های ClawPack یک artifact از نوع `npm-pack`، فیلدهای integrity مربوط به npm،
  یک `tarballUrl` و URL سازگاری ZIP قدیمی بازمی‌گردانند.
- این سطح resolver مربوط به OpenClaw است؛ از حدس زدن قالب آرشیو از روی یک URL مشترک
  جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

artifact نسخه را از مسیر resolver صریح دانلود می‌کند.

یادداشت‌ها:

- نسخه‌های ClawPack بایت‌های دقیق `.tgz` بارگذاری‌شده npm-pack را stream می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` هدایت می‌شوند.
- از bucket نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آینده OpenClaw را بازمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر است:

- وضعیت کانال رسمی
- در دسترس بودن آخرین نسخه
- در دسترس بودن artifact از نوع npm-pack مربوط به ClawPack
- digest مربوط به artifact
- خاستگاه مخزن منبع و commit
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

پارامترهای کوئری:

- `phase` (اختیاری): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` یا
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
- `packageName` با نام npm نرمال‌سازی می‌شود؛ بسته می‌تواند برای مهاجرت‌های برنامه‌ریزی‌شده
  موجود نباشد.
- این فقط آمادگی مهاجرت را رهگیری می‌کند. OpenClaw را تغییر نمی‌دهد یا ClawPack
  تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

نقطه پایانی ناظر/مدیر برای صف‌های بررسی انتشار بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای کوئری:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual` یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

معانی وضعیت:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، لغوشده یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، لغوشده یا مخرب.
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

یک بسته را برای بررسی ناظر گزارش می‌کند. گزارش‌ها در سطح بسته هستند و به‌صورت اختیاری
به یک نسخه پیوند می‌خورند. آن‌ها صف نظارت را تغذیه می‌کنند، اما به‌تنهایی دانلودها
را خودکار پنهان یا مسدود نمی‌کنند؛ ناظران باید از نظارت انتشار برای تأیید، قرنطینه
یا لغو artifactها استفاده کنند.

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

نقطه پایانی مدیر/ناظر برای دریافت گزارش‌های بسته.

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

نقطه پایانی مالک/ناظر برای مشاهده وضعیت نظارت بسته.

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

نقطه پایانی ناظر/مدیر برای حل‌وفصل یا بازگشایی گزارش‌های بسته.

درخواست:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام برگرداندن
`status` به `open` می‌توان آن را حذف کرد. برای اعمال نظارت انتشار در همان
گردش‌کار قابل حسابرسی، همراه با یک گزارش تأییدشده `finalAction: "quarantine"` یا
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
- `revoked`: پس از آنکه یک انتشار قبلاً مورد اعتماد بوده، مسدود شده است.

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود artifact مقدار `403` برمی‌گردانند.
هر تغییر یک ورودی گزارش حسابرسی می‌نویسد.

### `GET /api/v1/packages/{name}/file`

محتوای متن خام یک فایل بسته را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

یادداشت‌ها:

- به‌طور پیش‌فرض از آخرین انتشار استفاده می‌کند.
- از سبد نرخ خواندن استفاده می‌کند، نه سبد دانلود.
- فایل‌های دودویی `415` برمی‌گردانند.
- محدودیت اندازه فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن را مسدود نمی‌کنند؛ انتشارهای مخرب ممکن است همچنان در جای دیگری نگه داشته شوند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای یک انتشار بسته دانلود می‌کند.

پارامترهای پرس‌وجو:

- `version` (اختیاری)
- `tag` (اختیاری)

یادداشت‌ها:

- به‌طور پیش‌فرض از آخرین انتشار استفاده می‌کند.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشه `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP باقی می‌ماند. فایل‌های ClawPack `.tgz` را stream نمی‌کند.
- پاسخ‌ها برای بررسی یکپارچگی resolver شامل سرآیندهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` هستند.
- فراداده فقط-رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک packument سازگار با npm برای نسخه‌های بسته مبتنی بر ClawPack برمی‌گرداند.

یادداشت‌ها:

- فقط نسخه‌هایی که tarballهای npm-pack متعلق به ClawPack بارگذاری‌شده دارند فهرست می‌شوند.
- نسخه‌های قدیمی فقط-ZIP عمداً حذف می‌شوند.
- `dist.tarball`، `dist.integrity`، و `dist.shasum` از فیلدهای سازگار با npm
  استفاده می‌کنند تا کاربران در صورت تمایل بتوانند npm را به mirror اشاره دهند.
- packumentهای بسته scoped از هر دو مسیر درخواست `/api/npm/@scope/name` و مسیر
  کدگذاری‌شده npm یعنی `/api/npm/@scope%2Fname` پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball بارگذاری‌شده ClawPack را برای کلاینت‌های mirror npm stream می‌کند.

یادداشت‌ها:

- از سبد نرخ دانلود استفاده می‌کند.
- سرآیندهای دانلود شامل SHA-256 مربوط به ClawHub به‌همراه فراداده integrity/shasum مربوط به npm هستند.
- بررسی‌های نظارت و دسترسی به بسته خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

CLI از آن برای نگاشت یک اثرانگشت محلی به یک نسخه شناخته‌شده استفاده می‌کند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `hash` (الزامی): sha256 شانزدهی 64 کاراکتری از اثرانگشت bundle

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک ZIP نسخه Skills میزبانی‌شده را دانلود می‌کند، یا برای یک Skills فعلی مبتنی بر GitHub با اسکن `clean` یا `suspicious` و بدون نسخه میزبانی‌شده، واگذاری منبع GitHub را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `version` (اختیاری): رشته semver
- `tag` (اختیاری): نام tag (مثلاً `latest`)

یادداشت‌ها:

- اگر نه `version` و نه `tag` ارائه نشود، از آخرین نسخه استفاده می‌شود.
- نسخه‌های soft-delete شده `410` برمی‌گردانند.
- واگذاری‌های Skills مبتنی بر GitHub بایت‌ها را پروکسی یا mirror نمی‌کنند. پاسخ JSON
  شامل `sourceRef: "public-github"`، `repo`، `commit`، `path`، `contentHash`،
  و `archiveUrl` است؛ وضعیت اسکن/فعلی یک دروازه است و به‌عنوان فراداده payload موفقیت
  درج نمی‌شود.
- آمار دانلود به‌صورت هویت‌های منحصربه‌فرد در هر روز UTC شمرده می‌شود (`userId` وقتی توکن API معتبر است، در غیر این صورت IP).

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
- فیلد اختیاری payload: `ownerHandle`. وقتی حاضر باشد، API آن
  ناشر را در سمت سرور resolve می‌کند و نیاز دارد actor دسترسی ناشر داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` مقدار `true` باشد،
  یک Skills موجود می‌تواند به آن مالک منتقل شود، اگر actor روی هر دو ناشر فعلی
  و هدف مدیر/مالک باشد. بدون این opt-in، تغییرات مالک رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت توکن Bearer نیاز دارد.
- به `multipart/form-data` نیاز دارد.
- فیلدهای مجاز فرم `payload`، blobهای تکرارشونده `files`، یا یک مرجع tarball
  به نام `clawpack` هستند. `clawpack` می‌تواند یک blob `.tgz` یا یک storage id برگشتی از
  جریان upload-url باشد. انتشارهای storage-id مرحله‌بندی‌شده باید همچنین
  `clawpackUploadTicket` برگشتی با آن URL بارگذاری را شامل شوند.
- یا از `files` استفاده کنید یا از `clawpack`، هرگز هر دو را در یک درخواست به‌کار نبرید.
- بدنه‌های JSON و فراداده `payload.files` / `payload.artifact` ارائه‌شده توسط فراخواننده
  رد می‌شوند.
- درخواست‌های انتشار مستقیم multipart به 18MB محدود شده‌اند. tarballهای ClawPack می‌توانند
  تا سقف tarball یعنی 120MB از جریان upload-url استفاده کنند.
- فیلد اختیاری payload: `ownerHandle`. وقتی حاضر باشد، فقط مدیران می‌توانند از طرف آن مالک منتشر کنند.

نکات برجسته اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های `.tgz` مربوط به ClawPack باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- code pluginها به `package.json`، فراداده مخزن منبع، فراداده commit منبع،
  فراداده schema پیکربندی، `openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
- فقط ناشر org به نام `openclaw` و ناشران شخصی اعضای فعلی org به نام `openclaw`
  می‌توانند در کانال `official` منتشر کنند.
- انتشارهای از طرف دیگران همچنان واجدشرایط‌بودن کانال رسمی را نسبت به حساب مالک هدف اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

soft-delete / بازیابی یک Skills (مالک، ناظر، یا مدیر).

بدنه JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

وقتی حاضر باشد، `reason` به‌عنوان یادداشت نظارت Skills ذخیره و در گزارش حسابرسی کپی می‌شود.
soft deleteهای آغازشده توسط مالک، slug را برای 30 روز رزرو می‌کنند، سپس slug می‌تواند توسط
ناشر دیگری claim شود. وقتی این انقضا اعمال شود، پاسخ حذف شامل `slugReservedUntil` است.
پنهان‌سازی‌های ناظر/مدیر و حذف‌های امنیتی به این شکل منقضی نمی‌شوند.

پاسخ حذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

کدهای وضعیت:

- `200`: درست
- `401`: احراز هویت نشده
- `403`: ممنوع
- `404`: Skills/کاربر پیدا نشد
- `500`: خطای داخلی سرور

### `POST /api/v1/users/publisher`

فقط مدیر. تضمین می‌کند که یک ناشر org برای یک handle وجود داشته باشد. اگر handle هنوز به یک
کاربر مشترک قدیمی/ناشر شخصی اشاره کند، نقطه پایانی ابتدا آن را به یک ناشر org مهاجرت می‌دهد.
برای org تازه‌ساخته‌شده، `memberHandle` را ارائه کنید؛ مدیر در حال اقدام به‌عنوان عضو اضافه نمی‌شود.
`memberRole` به‌طور پیش‌فرض `owner` است.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

ایجاد ناشر org به‌صورت self-serve و احرازشده. یک ناشر org جدید می‌سازد و
فراخواننده را به‌عنوان مالک اضافه می‌کند. این نقطه پایانی handleهای کاربر/شخصی موجود را مهاجرت نمی‌دهد و
ناشر را trusted/official علامت‌گذاری نمی‌کند.

- بدنه: `{ "handle": "opik", "displayName": "Opik" }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- وقتی handle از قبل توسط یک ناشر، کاربر، یا ناشر شخصی استفاده شده باشد، `409` برمی‌گرداند.

### `POST /api/v1/users/reserve`

فقط مدیر. slugهای ریشه و نام‌های بسته را برای مالک شایسته رزرو می‌کند، بدون انتشار
release. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف release تبدیل می‌شوند، تا همان
مالک بتواند بعداً انتشار واقعی code-plugin یا bundle-plugin را در آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

فقط مدیر. یک ناشر شخصی را برای اصل GitHub OAuth جایگزینِ تأییدشده بازیابی می‌کند
بدون ویرایش ردیف‌های حساب Convex Auth. درخواست باید هر دو شناسه تغییرناپذیر حساب
provider در GitHub را نام ببرد؛ handleهای قابل تغییر فقط به‌عنوان محافظ رو‌به‌روی operator استفاده می‌شوند.

نقطهٔ پایانی به‌صورت پیش‌فرض روی اجرای آزمایشی است. اعمال بازیابی پس از آن‌که کارکنان به‌طور مستقل پیوستگی میان هر دو هویت اصلی GitHub را تأیید کردند، به `dryRun: false` و
`confirmIdentityVerified: true` نیاز دارد. اگر ناشر شخصی فعلی کاربر مقصد دارای مهارت‌ها، بسته‌ها، یا منابع مهارت GitHub باشد، بازیابی به‌صورت بسته شکست می‌خورد.
بازیابی همچنین فیلدهای قدیمی `ownerUserId` را برای مهارت‌های ناشر بازیابی‌شده،
نام‌های مستعار slug مهارت، بسته‌ها، هشدارهای بازرس بسته، و ردیف‌های مشتق‌شدهٔ چکیدهٔ جست‌وجو منتقل می‌کند تا مسیرهای مالک مستقیم با مرجع ناشر جدید هم‌خوان شوند. یک رزرو فعال دستهٔ محافظت‌شده برای دستهٔ بازیابی‌شده نیز به کاربر جایگزین بازتخصیص داده می‌شود تا همگام‌سازی‌های بعدی نمایه نتوانند مرجع رقیب کاربر قبلی را بازگردانند. هر جدول اصلی در هر تراکنش اعمال به
۱۰۰ ردیف محدود است؛ بازیابی‌های بزرگ‌تر باید ابتدا از یک مهاجرت مالک قابل‌ازسرگیری استفاده کنند.
منابع مهارت GitHub در محدودهٔ ناشر هستند و به‌جای بازنویسی، به‌عنوان بررسی‌شده گزارش می‌شوند.

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

- هر دو نقطهٔ پایانی به احراز هویت با توکن API نیاز دارند و فقط برای مالک مهارت کار می‌کنند.
- `rename`، slug قبلی را به‌عنوان نام مستعار تغییرمسیر حفظ می‌کند.
- `merge`، فهرست منبع را پنهان می‌کند و slug منبع را به فهرست مقصد تغییرمسیر می‌دهد.

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

مسدودی یک کاربر را بردارید و مهارت‌های واجد شرایط را بازیابی کنید (فقط مدیر).

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
محتوا تغییر دهید (فقط مدیر). مگر آن‌که `dryRun` برابر `false` باشد، به‌صورت پیش‌فرض اجرای آزمایشی است.

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

## نقاط پایانی قدیمی CLI (منسوخ‌شده)

همچنان برای نسخه‌های قدیمی‌تر CLI پشتیبانی می‌شود:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

برای برنامهٔ حذف، `DEPRECATIONS.md` را ببینید.

`POST /api/cli/upload-url` مقدارهای `uploadUrl` و `uploadTicket` را برمی‌گرداند. انتشارهای بسته‌ای که یک tarball از ClawPack را مرحله‌بندی می‌کنند باید شناسهٔ ذخیره‌سازی حاصل را به‌عنوان
`clawpack` و تیکت بازگردانده‌شده را به‌عنوان `clawpackUploadTicket` ارسال کنند.

## کشف رجیستری (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات رجیستری/احراز هویت را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

طرحواره:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر خودتان میزبانی می‌کنید، این فایل را سرو کنید (یا `CLAWHUB_REGISTRY` را صراحتاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی است).
