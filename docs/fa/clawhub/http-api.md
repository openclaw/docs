---
read_when:
    - افزودن/تغییر endpointها
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API HTTP (نقاط پایانی عمومی + نقاط پایانی CLI + احراز هویت).
x-i18n:
    generated_at: "2026-06-28T05:07:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

نشانی پایه: `https://clawhub.ai` (پیش‌فرض).

همهٔ مسیرهای v1 زیر `/api/v1/...` هستند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی مانده‌اند (به `DEPRECATIONS.md` مراجعه کنید).
OpenAPI: `/api/v1/openapi.json`.

## استفادهٔ دوباره از کاتالوگ عمومی

دایرکتوری‌های شخص ثالث می‌توانند از نقاط پایانی خواندن عمومی برای فهرست‌کردن یا جست‌وجوی مهارت‌های ClawHub استفاده کنند. لطفاً نتایج را کش کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست canonical در ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) برگردانید، و از القای تأیید سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای پنهان، خصوصی، یا مسدودشده توسط مدیریت را بیرون از سطح API عمومی آینه کنید.

میانبرهای slug وب در خانواده‌های رجیستری resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی اولویت مسیرها، از URLهای canonical برگشتی از نقاط پایانی خواندن استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (توکن Bearer معتبر): به‌ازای bucket هر کاربر اعمال می‌شود.
- اگر توکن وجود نداشته باشد یا نامعتبر باشد، رفتار به اعمال محدودیت بر اساس IP برمی‌گردد.
- نقاط پایانی نوشتن احراز هویت‌شده، وقتی سرور دلیل را می‌داند، نباید فقط یک `Unauthorized` خام برگردانند. توکن‌های مفقود، توکن‌های نامعتبر/لغوشده، و حساب‌های حذف‌شده/ممنوع‌شده/غیرفعال‌شده باید هرکدام متن قابل‌اقدامی دریافت کنند تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی آن‌ها را مسدود کرده است.

- خواندن: 3000/دقیقه به‌ازای هر IP، 12000/دقیقه به‌ازای هر کلید
- نوشتن: 300/دقیقه به‌ازای هر IP، 3000/دقیقه به‌ازای هر کلید
- دانلود: 1200/دقیقه به‌ازای هر IP، 6000/دقیقه به‌ازای هر کلید (نقاط پایانی دانلود)

هدرها:

- سازگاری قدیمی: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`، `RateLimit-Reset`
- روی `429`: `X-RateLimit-Remaining: 0` و `RateLimit-Remaining: 0`
- روی `429`: `Retry-After`

معنای هدرها:

- `X-RateLimit-Reset`: ثانیه‌های مطلق Unix epoch
- `RateLimit-Reset`: ثانیه تا reset (تأخیر)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجهٔ دقیق باقی‌مانده، وقتی موجود باشد.
  درخواست‌های موفق sharded این هدر را حذف می‌کنند به‌جای اینکه مقدار تقریبی global برگردانند.
- `Retry-After`: تعداد ثانیه‌هایی که باید قبل از تلاش دوباره صبر کرد (تأخیر) روی `429`

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

- اگر `Retry-After` وجود دارد، قبل از تلاش دوباره همان تعداد ثانیه صبر کنید.
- برای جلوگیری از تلاش‌های دوبارهٔ هم‌زمان، از backoff همراه با jitter استفاده کنید.
- اگر `Retry-After` وجود ندارد، به `RateLimit-Reset` fallback کنید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- فقط وقتی deployment صریحاً هدرهای forwarded مورد اعتماد را فعال کرده باشد، از هدرهای IP کلاینت مورد اعتماد، از جمله `cf-connecting-ip`، استفاده می‌کند.
- ClawHub از هدرهای forwarding مورد اعتماد برای شناسایی IP کلاینت در edge استفاده می‌کند.
- اگر هیچ IP کلاینت مورد اعتمادی در دسترس نباشد، درخواست‌های ناشناس از bucketهای fallback استفاده می‌کنند که فقط با نوع محدودیت نرخ scope شده‌اند. این bucketهای fallback شامل مسیرها، slugها، نام packageها، نسخه‌ها، رشته‌های query، یا سایر پارامترهای artifact ارائه‌شده توسط caller نیستند.

## پاسخ‌های خطا

پاسخ‌های خطای عمومی v1 متن ساده با `content-type: text/plain; charset=utf-8` هستند.
این شامل شکست‌های اعتبارسنجی (`400`)، منابع عمومی مفقود (`404`)، شکست‌های احراز هویت و مجوز (`401`/`403`)، محدودیت‌های نرخ (`429`)، و دانلودهای مسدودشده می‌شود. کلاینت‌ها باید بدنهٔ پاسخ را به‌عنوان یک رشتهٔ خواندنی برای انسان بخوانند. پارامترهای query ناشناخته برای سازگاری نادیده گرفته می‌شوند، اما پارامترهای query شناخته‌شده با مقادیر نامعتبر `400` برمی‌گردانند.

## نقاط پایانی عمومی (بدون احراز هویت)

### `GET /api/v1/search`

پارامترهای query:

- `q` (الزامی): رشتهٔ query
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): `true` برای فیلترکردن به مهارت‌های برجسته‌شده
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

نکات:

- نتایج به‌ترتیب ارتباط برگردانده می‌شوند (شباهت embedding + تقویت‌های token برای slug/name دقیق + یک prior کوچک محبوبیت).
- ارتباط قوی‌تر از محبوبیت است. تطبیق دقیق یک token در slug یا display-name می‌تواند از تطبیق آزادتر با engagement بسیار قوی‌تر رتبهٔ بالاتری بگیرد.
- متن ASCII روی مرزهای کلمه و نشانه‌گذاری tokenized می‌شود. برای مثال، `personal-map` شامل یک token مستقل `map` است، در حالی که `amap-jsapi-skill` شامل `amap`، `jsapi`، و `skill` است؛ بنابراین جست‌وجوی `map` به `personal-map` تطبیق lexical قوی‌تری نسبت به `amap-jsapi-skill` می‌دهد.
- محبوبیت log-scaled و capped است. مهارت‌های با engagement بالا می‌توانند وقتی متن query تطبیق ضعیف‌تری دارد، رتبهٔ پایین‌تری بگیرند.
- وضعیت مدیریت مشکوک یا پنهان می‌تواند بسته به فیلترهای caller و وضعیت فعلی مدیریت، یک مهارت را از جست‌وجوی عمومی حذف کند.

راهنمای discoverability ناشر:

- اصطلاحاتی را که کاربران دقیقاً جست‌وجو خواهند کرد در display name، summary، و tags قرار دهید. فقط وقتی از token مستقل در slug استفاده کنید که هویت پایداری هم باشد که می‌خواهید حفظ کنید.
- فقط برای دنبال‌کردن یک query، slug را تغییر نام ندهید، مگر اینکه slug جدید نام canonical بلندمدت بهتری باشد. slugهای قدیمی به aliasهای redirect تبدیل می‌شوند، اما URL canonical، slug نمایش‌داده‌شده، و digestهای جست‌وجوی آینده از slug جدید استفاده می‌کنند.
- aliasهای تغییر نام، resolution را برای URLهای قدیمی و نصب‌هایی که از طریق رجیستری resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو بر اساس metadata مهارت canonical پس از index شدن تغییر نام است. آمار موجود با همان مهارت باقی می‌ماند.
- اگر یک مهارت به‌طور غیرمنتظره نامرئی است، پیش از تغییر metadata مرتبط با رتبه‌بندی، ابتدا هنگام وارد بودن با `clawhub inspect @owner/slug` وضعیت مدیریت را بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): cursor صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended` (alias: `default`)، `createdAt` (alias: `newest`)، `downloads`، `stars` (alias: `rating`)، aliasهای نصب قدیمی `installsCurrent`/`installs`/`installsAllTime` به `downloads` map می‌شوند، `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن مهارت‌های مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): alias قدیمی برای `nonSuspiciousOnly`

مقادیر نامعتبر `sort` مقدار `400` برمی‌گردانند.

نکات:

- `recommended` از سیگنال‌های engagement و تازگی استفاده می‌کند.
- `trending` بر اساس نصب‌ها در 7 روز گذشته رتبه‌بندی می‌کند (مبتنی بر telemetry).
- `createdAt` برای crawlهای مهارت جدید پایدار است؛ `updated` وقتی مهارت‌های موجود دوباره منتشر می‌شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` باشد، sortهای مبتنی بر cursor ممکن است در یک صفحه کمتر از `limit` مورد برگردانند، چون مهارت‌های مشکوک پس از دریافت صفحه فیلتر می‌شوند.
- وقتی `nextCursor` موجود است، برای ادامهٔ صفحه‌بندی از آن استفاده کنید. یک صفحهٔ کوتاه به‌تنهایی به معنی پایان نتایج نیست.

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

- slugهای قدیمی ایجادشده توسط جریان‌های تغییر نام/merge مالک، به مهارت canonical resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter مهارت (مثلاً `["macos"]`، `["linux"]`). اگر اعلام نشده باشد `null`.
- `metadata.systems`: targetهای سیستم Nix (مثلاً `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد `null`.
- اگر مهارت metadata پلتفرم نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط وقتی شامل می‌شود که مهارت flagged شده باشد یا مالک در حال مشاهدهٔ آن باشد.

### `GET /api/v1/skills/{slug}/moderation`

وضعیت مدیریت ساختاریافته را برمی‌گرداند.

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

- مالکان و مدیران می‌توانند به جزئیات مدیریت برای مهارت‌های پنهان دسترسی داشته باشند.
- callerهای عمومی فقط برای مهارت‌های قابل‌مشاهده‌ای که از قبل flagged شده‌اند `200` دریافت می‌کنند.
- evidence برای callerهای عمومی redacted می‌شود و فقط برای مالکان/مدیران شامل snippetهای خام است.

### `POST /api/v1/skills/{slug}/report`

یک مهارت را برای بازبینی مدیر گزارش کنید. گزارش‌ها در سطح مهارت هستند، می‌توانند به‌صورت اختیاری به یک نسخه لینک شوند، و صف گزارش مهارت را تغذیه می‌کنند.

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

نقطهٔ پایانی مدیر/ادمین برای دریافت گزارش‌های مهارت.

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

نقطهٔ پایانی مدیر/ادمین برای حل‌کردن یا بازگشایی گزارش‌های مهارت.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام تنظیم دوبارهٔ `status` به `open` می‌تواند حذف شود. برای پنهان‌کردن مهارت در همان workflow قابل‌ممیزی، همراه با یک گزارش triaged مقدار `finalAction: "hide"` را ارسال کنید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): cursor صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

metadata نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` شامل وضعیت تأیید scan نرمال‌شده و جزئیات scanner است
  (VirusTotal + LLM)، وقتی در دسترس باشد.

### `GET /api/v1/skills/{slug}/scan`

جزئیات تأیید scan امنیتی را برای یک نسخهٔ مهارت برمی‌گرداند.

پارامترهای query:

- `version` (اختیاری): رشتهٔ نسخهٔ مشخص.
- `tag` (اختیاری): resolve کردن یک نسخهٔ tagged (برای مثال `latest`).

نکات:

- اگر نه `version` و نه `tag` ارائه شود، از آخرین نسخه استفاده می‌شود.
- شامل وضعیت راستی‌آزمایی نرمال‌سازی‌شده به‌همراه جزئیات ویژه‌ی هر اسکنر است.
- `security.hasScanResult` فقط زمانی `true` است که یک اسکنر رأی قطعی (`clean`، `suspicious`، یا `malicious`) تولید کرده باشد.
- `moderation` یک نمای فوری فعلی از تعدیل در سطح مهارت است که از آخرین نسخه مشتق شده است.
- هنگام پرس‌وجوی یک نسخه‌ی تاریخی، پیش از اینکه `moderation` و `security` را به‌عنوان زمینه‌ی نسخه‌ای یکسان در نظر بگیرید، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

### `POST /api/v1/skills/-/scan`

نقطه‌پایان ارسال احراز هویت‌شده برای کارهای جدید ClawScan.

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

- بارهای درخواست اسکن و گزارش‌های قابل دانلود پس از پنجره‌ی نگهداری از ذخیره‌گاه درخواست اسکن منقضی می‌شوند.
- اسکن‌های منتشرشده به دسترسی مدیریتی مالک/ناشر، یا اختیار ناظر/مدیر پلتفرم نیاز دارند.
- اسکن‌های منتشرشده فقط وقتی `update: true` باشد و اسکن با موفقیت کامل شود، نتیجه را بازنویسی می‌کنند.
- پاسخ `202` با `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` است.
- کارهای اسکن ناهمگام هستند. درخواست‌های اسکن دستی پیش از کارهای عادی انتشار/تکمیل گذشته اولویت‌بندی می‌شوند، اما تکمیل همچنان به در دسترس بودن کارگرها وابسته است.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطه‌پایان نظرسنجی احراز هویت‌شده برای یک اسکن ارسال‌شده.

- وضعیت در صف/در حال اجرا/موفق/ناموفق را برمی‌گرداند.
- تا وقتی در صف است، `queue.queuedAhead` و `queue.position` را برمی‌گرداند تا کلاینت‌ها بتوانند نشان دهند چند اسکن دستی اولویت‌دار جلوتر از درخواست هستند. صف‌های بسیار بزرگ محدود می‌شوند و با `queuedAheadIsEstimate: true` گزارش می‌شوند.
- در صورت موجود بودن، `report` شامل بخش‌های `clawscan`، `skillspector`، `staticAnalysis`، و `virustotal` است.
- کارهای اسکن ناموفق `status: "failed"` را همراه با `lastError` برمی‌گردانند.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطه‌پایان آرشیو گزارش احراز هویت‌شده.

- به یک اسکن موفق نیاز دارد؛ اسکن‌های غیرنهایی `409` برمی‌گردانند.
- یک ZIP شامل `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json`، و `README.md` برمی‌گرداند.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطه‌پایان آرشیو گزارش ذخیره‌شده‌ی احراز هویت‌شده برای نسخه‌های ارسال‌شده.

- به دسترسی مدیریتی مالک/ناشر به مهارت یا plugin، یا اختیار ناظر/مدیر پلتفرم نیاز دارد.
- نتایج اسکن ذخیره‌شده را برای نسخه‌ی دقیق ارسال‌شده برمی‌گرداند، از جمله نسخه‌های مسدودشده یا پنهان.
- مقدار پیش‌فرض `kind` برابر `skill` است؛ برای اسکن‌های plugin/بسته از `kind=plugin` استفاده کنید.
- همان شکل ZIP دانلودهای درخواست اسکن را برمی‌گرداند.

### `POST /api/v1/skills/-/scan/batch`

مسیر بازاسکن دسته‌ای canonical فقط برای مدیر. همان شکل بار را می‌پذیرد که مسیر قدیمی `POST /api/v1/skills/-/rescan-batch` می‌پذیرفت.

### `POST /api/v1/skills/-/scan/batch/status`

مسیر وضعیت دسته‌ای canonical فقط برای مدیر. `{ "jobIds": ["..."] }` را می‌پذیرد و همان شمارنده‌های تجمیعی مسیر قدیمی `POST /api/v1/skills/-/rescan-batch/status` را برمی‌گرداند.

### `GET /api/v1/skills/{slug}/verify`

پوشش راستی‌آزمایی Skill Card را که توسط `clawhub skill verify` استفاده می‌شود برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشته‌ی نسخه‌ی مشخص.
- `tag` (اختیاری): حل یک نسخه‌ی برچسب‌خورده (برای مثال `latest`).

نکات:

- `ok` فقط زمانی `true` است که نسخه‌ی انتخاب‌شده یک Skill Card تولیدشده داشته باشد، توسط تعدیل به‌عنوان بدافزار مسدود نشده باشد، و راستی‌آزمایی ClawScan پاک باشد.
- هویت مهارت، هویت ناشر، و فراداده‌ی نسخه‌ی انتخاب‌شده فیلدهای سطح بالای پوشش هستند (`slug`، `displayName`، `publisherHandle`، `version`، `resolvedFrom`، `tag`، `createdAt`) تا اتوماسیون shell بتواند بدون باز کردن پوشش‌های تودرتو آن‌ها را بخواند.
- `security` رأی سطح بالای ClawScan/امنیت است. اتوماسیون باید بر اساس `ok`، `decision`، `reasons`، و `security.status` عمل کند.
- `security.signals` شواهد پشتیبان اسکنر مانند `staticScan`، `virusTotal`، و `skillSpector` را شامل می‌شود.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- `provenance` فقط زمانی `server-resolved-github-import` است که ClawHub هنگام انتشار یا وارد کردن، یک مخزن/ارجاع/کامیت/مسیر GitHub را حل و ذخیره کرده باشد؛ در غیر این صورت `unavailable` است.

### `POST /api/v1/skills/-/security-verdicts`

رأی‌های امنیتی فشرده‌ی فعلی را برای نسخه‌های دقیق مهارت برمی‌گرداند. این
نقطه‌پایان مجموعه برای کلاینت‌هایی در نظر گرفته شده است که از قبل می‌دانند کدام نسخه‌های مهارت
ClawHub نصب‌شده را باید نمایش دهند، مانند OpenClaw Control UI.

درخواست:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

نکات:

- `items` باید شامل ۱ تا ۱۰۰ جفت یکتای `{ slug, version }` باشد.
- نتایج برای هر مورد جداگانه هستند؛ نبودن یک مهارت یا نسخه کل پاسخ را ناموفق نمی‌کند.
- پاسخ فقط امنیتی است. شامل داده‌های Skill Card، وضعیت کارت تولیدشده، فهرست فایل‌های آرتیفکت، یا بارهای تفصیلی اسکنر نیست.
- `security.signals` فقط شواهد پشتیبان در سطح وضعیت را شامل می‌شود؛ برای جزئیات کامل اسکنر از `/scan` یا صفحه‌ی بازرسی امنیتی ClawHub استفاده کنید.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- نبود Skill Card بر `ok`، `decision`، یا `reasons` این نقطه‌پایان اثر نمی‌گذارد؛ کلاینت‌ها وقتی به محتوای کارت نیاز دارند باید `skill-card.md` نصب‌شده را به‌صورت محلی بخوانند.
- وقتی به پوشش راستی‌آزمایی Skill Card برای یک مهارت نیاز دارید از `/verify`، وقتی به markdown کارت تولیدشده نیاز دارید از `/card`، و وقتی به داده‌های تفصیلی اسکنر نیاز دارید از `/scan` استفاده کنید.

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

نکته‌ها:

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

نکته‌ها:

- مقدارهای نامعتبر برای `family`، `channel`، `isOfficial`، `featured`،
  `highlightedOnly`، یا `sort` مقدار `400` را برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار با خانواده ثابت باقی می‌مانند.
- ورودی‌های Skills همچنان به رجیستری Skills متکی هستند و هنوز فقط از طریق `POST /api/v1/skills` می‌توانند منتشر شوند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخوان‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخوان‌های احرازهویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند در نتایج فهرست/جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احرازهویت‌شده بتواند بخواند.

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

نکته‌ها:

- مقدارهای نامعتبر برای `family`، `channel`، `isOfficial`، `featured`، یا
  `highlightedOnly` مقدار `400` را برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- فراخوان‌های ناشناس فقط کانال‌های بسته عمومی را می‌بینند.
- فراخوان‌های احرازهویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احرازهویت‌شده بتواند بخواند.

### `GET /api/v1/plugins`

مرور کاتالوگ فقط Pluginها در بسته‌های code-plugin و bundle-plugin.

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

`trending` جدول رتبه‌بندی نصب/دانلود هفت‌روزه است و از مجموع‌های تمام‌زمان استفاده نمی‌کند.
در نقطه پایانی یکپارچه `/api/v1/packages` فقط مخصوص Plugin است؛ برای کاتالوگ Skills از
`/api/v1/skills?sort=trending` استفاده کنید.

نام‌های مستعار قدیمی به‌عنوان مقدارهای دسته‌بندی ذخیره‌شده یا اعلام‌شده توسط نویسنده پذیرفته نمی‌شوند.

### `GET /api/v1/skills/export`

خروجی انبوه از آخرین Skills عمومی برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای پرس‌وجو:

- `startDate` (الزامی): کران پایین برحسب میلی‌ثانیه یونیکس برای `updatedAt` در Skill.
- `endDate` (الزامی): کران بالای برحسب میلی‌ثانیه یونیکس برای `updatedAt` در Skill.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.

پاسخ:

- بدنه: آرشیو ZIP.
- ریشه هر Skill خروجی‌گرفته‌شده در `{publisher}/{slug}/` قرار دارد.
- Skills میزبانی‌شده شامل آخرین فایل‌های نسخه ذخیره‌شده هستند و در
  `_manifest.json` با `sourceRef: "public-clawhub"` فهرست می‌شوند.
- Skills فعلی مبتنی بر GitHub با اسکن `clean` یا `suspicious` شامل
  `_source_handoff.json` با `sourceRef: "public-github"`، مخزن، کامیت، مسیر،
  هش محتوا، و URL آرشیو هستند. آن‌ها شامل فایل‌های منبع میزبانی‌شده در ClawHub نیستند.
- هر Skill شامل `_export_skill_meta.json` است.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- وقتی Skills یا فایل‌های جداگانه نتوانند خروجی گرفته شوند،
  `_errors.json` گنجانده می‌شود.

سرآیندها:

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

- `startDate` (الزامی): کران پایین بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `endDate` (الزامی): کران بالا بر حسب میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی از پاسخ قبلی.
- `family` (اختیاری): `code-plugin` یا `bundle-plugin`. حذف آن یعنی هر دو خانواده Plugin.

پاسخ:

- بدنه: آرشیو ZIP.
- ریشه هر Plugin خروجی‌گرفته‌شده در `{family}/{packageName}/` قرار دارد.
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

جست‌وجوی مخصوص Plugin در بسته‌های code-plugin و bundle-plugin.

پارامترهای پرس‌وجو:

- `q` (الزامی): رشته پرس‌وجو
- `limit` (اختیاری): عدد صحیح (1-100)
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): پالایه دسته‌بندی Plugin. مقدارهای فعلی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

یادداشت‌ها:

- نام‌های مستعار پالایه نسخه قدیمی v1 که زیر `GET /api/v1/plugins` مستند شده‌اند
  نیز پذیرفته می‌شوند.
- پالایش دسته‌بندی یک پالایه API واقعی است که با ردیف‌های چکیده دسته‌بندی Plugin
  پشتیبانی می‌شود، نه بازنویسی پرس‌وجوی جست‌وجو.
- نتایج به ترتیب ارتباط برگردانده می‌شوند و در حال حاضر صفحه‌بندی نمی‌شوند.
- کنترل‌های مرتب‌سازی UI مرورگر برای جست‌وجوی Plugin، نتایج بارگذاری‌شده بر اساس ارتباط را دوباره مرتب می‌کنند
  و با رفتار مرور فعلی `/skills` مطابقت دارند.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را برمی‌گرداند.

یادداشت‌ها:

- Skills نیز می‌تواند در کاتالوگ یکپارچه از طریق این مسیر resolve شود.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.

یادداشت‌ها:

- به توکن API برای مالک بسته، مالک/مدیر ناشر سازمانی،
  ناظر پلتفرم، یا مدیر پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

یادداشت‌ها:

- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را، شامل فراداده فایل، سازگاری،
راستی‌آزمایی، فراداده آرتیفکت، و داده‌های اسکن، برمی‌گرداند.

یادداشت‌ها:

- `version.artifact.kind` برای آرشیوهای بسته قدیمی `legacy-zip` یا
  برای انتشارهای مبتنی بر ClawPack مقدار `npm-pack` است.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum`، و
  `npmTarballName` هستند.
- `version.sha256hash` فراداده سازگاری منسوخ‌شده برای کلاینت‌های قدیمی است. این مقدار
  بایت‌های دقیق ZIP برگشتی از `/api/v1/packages/{name}/download` را هش می‌کند.
  کلاینت‌های جدید باید از `version.artifact.sha256` استفاده کنند، که آرتیفکت
  انتشار متعارف را مشخص می‌کند.
- `version.vtAnalysis`، `version.llmAnalysis`، و `version.staticScan` زمانی
  گنجانده می‌شوند که داده اسکن وجود داشته باشد.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصه دقیق امنیت و اعتماد انتشار بسته را برای کلاینت‌های نصب
برمی‌گرداند. این سطح مصرف عمومی OpenClaw برای تصمیم‌گیری درباره این است که آیا یک
انتشار resolve‌شده می‌تواند نصب شود یا نه.

احراز هویت:

- نقطه پایانی خواندن عمومی. توکن مالک، ناشر، ناظر، یا مدیر
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
  resolve‌شده را مشخص می‌کنند.
- `release.releaseId`، `release.version`، و `release.createdAt` انتشار دقیق
  ارزیابی‌شده را مشخص می‌کنند.
- `release.artifactKind`، `release.artifactSha256`، `release.npmIntegrity`،
  `release.npmShasum`، و `release.npmTarballName` وقتی برای آرتیفکت انتشار
  شناخته شده باشند، وجود دارند.
- `trust.scanStatus` وضعیت اعتماد مؤثر است که از ورودی‌های اسکنر
  و نظارت دستی انتشار به‌دست می‌آید.
- `trust.moderationState` می‌تواند null باشد. وقتی نظارت دستی انتشار
  وجود نداشته باشد، مقدار آن `null` است.
- `trust.blockedFromDownload` سیگنال انسداد نصب است. OpenClaw و سایر
  کلاینت‌های نصب باید وقتی این مقدار `true` است نصب را مسدود کنند، به‌جای اینکه
  قواعد انسداد را دوباره از فیلدهای اسکنر یا نظارت استخراج کنند.
- `trust.reasons` فهرست توضیحات رو به کاربر و حسابرسی است. کدهای دلیل
  رشته‌های پایدار و فشرده‌ای مانند `manual:quarantined`، `scan:malicious`،
  و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد هنوز در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصه اعتماد از ورودی‌های قدیمی محاسبه شده و
  پیش از تصمیم اجازه با اطمینان بالا باید نیازمند تازه‌سازی در نظر گرفته شود.

یادداشت‌ها:

- این نقطه پایانی دقیقاً مخصوص همان نسخه است. کلاینت‌ها باید پس از resolve کردن
  نسخه بسته‌ای که قصد نصب آن را دارند آن را فراخوانی کنند، نه صرفاً پس از خواندن
  آخرین فراداده بسته.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.
- این نقطه پایانی عمداً از نقطه‌های پایانی نظارت مالک/ناظر محدودتر است.
  تصمیم نصب و توضیح عمومی را آشکار می‌کند، نه هویت گزارش‌دهندگان،
  متن گزارش‌ها، شواهد خصوصی، یا جدول‌های زمانی بازبینی داخلی.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده resolver صریح آرتیفکت را برای یک نسخه بسته برمی‌گرداند.

یادداشت‌ها:

- نسخه‌های بسته قدیمی یک آرتیفکت `legacy-zip` و یک `downloadUrl`
  ZIP قدیمی برمی‌گردانند.
- نسخه‌های ClawPack یک آرتیفکت `npm-pack`، فیلدهای integrity مربوط به npm، یک
  `tarballUrl`، و URL سازگاری ZIP قدیمی را برمی‌گردانند.
- این سطح resolver در OpenClaw است؛ از حدس‌زدن قالب آرشیو از
  یک URL مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

آرتیفکت نسخه را از طریق مسیر resolver صریح دانلود می‌کند.

یادداشت‌ها:

- نسخه‌های ClawPack بایت‌های دقیق `.tgz` مربوط به npm-pack بارگذاری‌شده را stream می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` redirect می‌شوند.
- از bucket نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده را برای مصرف آینده OpenClaw برمی‌گرداند.

بررسی‌های آمادگی شامل این موارد است:

- وضعیت کانال رسمی
- دسترس‌پذیری آخرین نسخه
- دسترس‌پذیری آرتیفکت npm-pack مربوط به ClawPack
- چکیده آرتیفکت
- منشأ repo منبع و commit
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
- این فقط آمادگی مهاجرت را ردیابی می‌کند. OpenClaw را mutate نمی‌کند و
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

نقطه پایانی ناظر/مدیر برای صف‌های بازبینی انتشار بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای پرس‌وجو:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

معنای وضعیت‌ها:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، لغوشده، یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، لغوشده، یا مخرب.
- `manual`: هر انتشاری با بازنویسی نظارت دستی.
- `all`: هر انتشاری با بازنویسی دستی، وضعیت اسکن غیرپاک، یا گزارش بسته.

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
به یک نسخه پیوند می‌خورند. آن‌ها صف نظارت را تغذیه می‌کنند اما به‌تنهایی دانلودها را
به‌طور خودکار پنهان یا مسدود نمی‌کنند؛ ناظران باید از نظارت انتشار برای
تأیید، قرنطینه، یا لغو آرتیفکت‌ها استفاده کنند.

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

- به یک توکن API برای کاربر ناظر یا مدیر نیاز دارد.

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

نقطه پایانی مالک/ناظر برای مشاهده وضعیت نظارت بسته.

احراز هویت:

- به یک توکن API برای مالک بسته، عضو ناشر، ناظر یا کاربر
  مدیر نیاز دارد.

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

نقطه پایانی مدیر/ناظر برای حل‌وفصل یا بازگشایی گزارش‌های بسته.

درخواست:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام
برگرداندن `status` به `open` می‌توان آن را حذف کرد. برای اعمال نظارت انتشار در همان
گردش‌کار قابل ممیزی، همراه با یک گزارش تأییدشده `finalAction: "quarantine"` یا
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

نقطه پایانی مدیر/ناظر برای بررسی انتشار بسته.

درخواست:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

وضعیت‌های پشتیبانی‌شده:

- `approved`: به‌صورت دستی بررسی و مجاز شده است.
- `quarantined`: تا پیگیری بعدی مسدود شده است.
- `revoked`: پس از آنکه انتشار قبلاً مورد اعتماد بوده، مسدود شده است.

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود artifact مقدار `403` برمی‌گردانند.
هر تغییر یک ورودی گزارش ممیزی می‌نویسد.

### `GET /api/v1/packages/{name}/file`

محتوای متنی خام را برای یک فایل بسته برمی‌گرداند.

پارامترهای کوئری:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌صورت پیش‌فرض از آخرین انتشار استفاده می‌کند.
- از سهمیه نرخ خواندن استفاده می‌کند، نه سهمیه دانلود.
- فایل‌های دودویی مقدار `415` برمی‌گردانند.
- محدودیت اندازه فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن را مسدود نمی‌کنند؛ انتشارهای مخرب ممکن است همچنان در جای دیگری نگه داشته شوند.
- بسته‌های خصوصی مقدار `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای یک انتشار بسته دانلود می‌کند.

پارامترهای کوئری:

- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌صورت پیش‌فرض از آخرین انتشار استفاده می‌کند.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته، فایل‌های zip با ریشه `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP باقی می‌ماند. فایل‌های ClawPack با پسوند `.tgz` را استریم نمی‌کند.
- پاسخ‌ها برای بررسی‌های یکپارچگی resolver شامل هدرهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` هستند.
- فراداده فقط-رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب مقدار `403` برمی‌گردانند.
- بسته‌های خصوصی مقدار `404` برمی‌گردانند، مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک packument سازگار با npm را برای نسخه‌های بسته پشتیبانی‌شده با ClawPack برمی‌گرداند.

نکات:

- فقط نسخه‌هایی فهرست می‌شوند که tarballهای npm-pack مربوط به ClawPack برای آن‌ها بارگذاری شده است.
- نسخه‌های قدیمی فقط-ZIP عمداً حذف شده‌اند.
- `dist.tarball`، `dist.integrity` و `dist.shasum` از فیلدهای سازگار با npm استفاده می‌کنند
  تا کاربران در صورت تمایل بتوانند npm را به mirror اشاره دهند.
- packumentهای بسته scoped هم از مسیر `/api/npm/@scope/name` و هم از مسیر درخواست
  کدگذاری‌شده npm یعنی `/api/npm/@scope%2Fname` پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball بارگذاری‌شده ClawPack را برای کلاینت‌های mirror npm استریم می‌کند.

نکات:

- از سهمیه نرخ دانلود استفاده می‌کند.
- هدرهای دانلود شامل SHA-256 مربوط به ClawHub به‌همراه فراداده integrity/shasum مربوط به npm هستند.
- بررسی‌های نظارت و دسترسی بسته خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

توسط CLI برای نگاشت یک اثر انگشت محلی به یک نسخه شناخته‌شده استفاده می‌شود.

پارامترهای کوئری:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز 64 کاراکتری از اثر انگشت bundle

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک ZIP نسخه skill میزبانی‌شده را دانلود می‌کند، یا برای یک skill فعلی پشتیبانی‌شده با GitHub که اسکن
`clean` یا `suspicious` دارد و نسخه میزبانی‌شده ندارد، یک واگذاری منبع GitHub برمی‌گرداند.

پارامترهای کوئری:

- `slug` (الزامی)
- `version` (اختیاری): رشته semver
- `tag` (اختیاری): نام tag (مثلاً `latest`)

نکات:

- اگر نه `version` و نه `tag` ارائه نشود، از آخرین نسخه استفاده می‌شود.
- نسخه‌های soft-delete شده مقدار `410` برمی‌گردانند.
- واگذاری‌های skill پشتیبانی‌شده با GitHub، بایت‌ها را proxy یا mirror نمی‌کنند. پاسخ JSON
  شامل `sourceRef: "public-github"`، `repo`، `commit`، `path`، `contentHash`
  و `archiveUrl` است؛ وضعیت اسکن/فعلی یک gate است و به‌عنوان فراداده payload موفقیت
  گنجانده نمی‌شود.
- آمار دانلود به‌صورت هویت‌های یکتا در هر روز UTC شمرده می‌شود (`userId` وقتی توکن API معتبر است، در غیر این صورت IP).

## نقاط پایانی احراز هویت (Bearer token)

همه نقاط پایانی به این نیاز دارند:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

توکن را اعتبارسنجی می‌کند و handle کاربر را برمی‌گرداند.

### `POST /api/v1/skills`

یک نسخه جدید منتشر می‌کند.

- ترجیحی: `multipart/form-data` با JSON در `payload` + blobهای `files[]`.
- بدنه JSON با `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، API آن
  ناشر را سمت سرور resolve می‌کند و نیاز دارد actor دسترسی ناشر داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` مقدار `true` باشد، یک
  skill موجود ممکن است به آن مالک منتقل شود، اگر actor در هر دو ناشر فعلی و هدف
  مدیر/مالک باشد. بدون این opt-in، تغییرات مالک رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت Bearer token نیاز دارد.
- به `multipart/form-data` نیاز دارد.
- فیلدهای فرم مجاز عبارت‌اند از `payload`، blobهای تکرارشونده `files`، یا یک مرجع tarball
  `clawpack`. `clawpack` می‌تواند یک blob با پسوند `.tgz` یا یک شناسه ذخیره‌سازی برگردانده‌شده توسط
  جریان upload-url باشد. انتشارهای staged با storage-id باید
  `clawpackUploadTicket` برگشتی همراه با آن URL بارگذاری را نیز شامل شوند.
- یا از `files` استفاده کنید یا از `clawpack`؛ هرگز هر دو را در یک درخواست به‌کار نبرید.
- بدنه‌های JSON و فراداده `payload.files` / `payload.artifact` تأمین‌شده توسط فراخواننده
  رد می‌شوند.
- درخواست‌های انتشار multipart مستقیم به 18MB محدود شده‌اند. tarballهای ClawPack می‌توانند
  از جریان upload-url تا سقف tarball برابر با 120MB استفاده کنند.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، فقط مدیران می‌توانند از طرف آن مالک منتشر کنند.

نکات برجسته اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های ClawPack با پسوند `.tgz` باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- Pluginهای کد به `package.json`، فراداده repo منبع، فراداده commit منبع،
  فراداده schema پیکربندی، `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
- فقط ناشر org مربوط به `openclaw` و ناشران شخصی اعضای فعلی org مربوط به `openclaw`
  می‌توانند در کانال `official` منتشر کنند.
- انتشارهای از طرف دیگران همچنان صلاحیت کانال official را در برابر حساب مالک هدف اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

soft-delete / بازیابی یک skill (مالک، ناظر یا مدیر).

بدنه JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

وقتی وجود داشته باشد، `reason` به‌عنوان یادداشت نظارت skill ذخیره و در گزارش ممیزی کپی می‌شود.
soft deleteهای آغازشده توسط مالک، slug را برای 30 روز رزرو می‌کنند؛ سپس slug می‌تواند توسط
ناشر دیگری claim شود. وقتی این انقضا اعمال شود، پاسخ حذف شامل `slugReservedUntil` است.
پنهان‌سازی‌های مدیر/ناظر و حذف‌های امنیتی به این شکل منقضی نمی‌شوند.

پاسخ حذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

کدهای وضعیت:

- `200`: تأیید
- `401`: مجاز نیست
- `403`: ممنوع
- `404`: skill/کاربر یافت نشد
- `500`: خطای داخلی سرور

### `POST /api/v1/users/publisher`

فقط مدیر. تضمین می‌کند یک ناشر org برای یک handle وجود دارد. اگر handle هنوز به یک
کاربر/ناشر شخصی اشتراکی قدیمی اشاره کند، نقطه پایانی ابتدا آن را به یک ناشر org مهاجرت می‌دهد.
برای org تازه ایجادشده، `memberHandle` را ارائه کنید؛ مدیر اقدام‌کننده به‌عنوان عضو اضافه نمی‌شود.
`memberRole` به‌صورت پیش‌فرض `owner` است.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

ایجاد self-serve ناشر org با احراز هویت. یک ناشر org جدید ایجاد می‌کند و
فراخواننده را به‌عنوان مالک اضافه می‌کند. این نقطه پایانی handleهای کاربر/شخصی موجود را مهاجرت نمی‌دهد و
ناشر را trusted/official علامت‌گذاری نمی‌کند.

- بدنه: `{ "handle": "opik", "displayName": "Opik" }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- وقتی handle قبلاً توسط یک ناشر، کاربر یا ناشر شخصی استفاده شده باشد، `409` برمی‌گرداند.

### `POST /api/v1/users/reserve`

فقط مدیر. slugهای ریشه و نام‌های بسته را برای مالک برحق، بدون انتشار یک
release، رزرو می‌کند. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف release تبدیل می‌شوند، تا همان
مالک بعداً بتواند انتشار واقعی code-plugin یا bundle-plugin را در آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

فقط مدیر. یک ناشر شخصی را برای یک اصل GitHub OAuth جایگزینِ تأییدشده
بدون ویرایش ردیف‌های حساب Convex Auth بازیابی می‌کند. درخواست باید هر دو شناسه تغییرناپذیر حساب
ارائه‌دهنده GitHub را نام ببرد؛ handleهای قابل تغییر فقط به‌عنوان guard روبه‌روی اپراتور استفاده می‌شوند.

نقطهٔ پایانی به‌طور پیش‌فرض روی اجرای آزمایشی تنظیم است. اعمال بازیابی پس از آن‌که کارکنان به‌طور مستقل پیوستگی بین هر دو اصل GitHub را تأیید کردند، به `dryRun: false` و
`confirmIdentityVerified: true` نیاز دارد. وقتی ناشر شخصی فعلی کاربر مقصد مهارت‌ها، بسته‌ها، یا منابع مهارت GitHub داشته باشد، بازیابی به‌صورت بسته شکست می‌خورد.
بازیابی همچنین فیلدهای قدیمی `ownerUserId` را برای مهارت‌های ناشر بازیابی‌شده،
نام‌های مستعار slug مهارت، بسته‌ها، هشدارهای بازرس بسته، و ردیف‌های مشتق‌شدهٔ خلاصهٔ جست‌وجو مهاجرت می‌دهد تا
مسیرهای مالک مستقیم با اختیار ناشر جدید هم‌خوان شوند. یک رزرو فعالِ شناسهٔ محافظت‌شده
برای شناسهٔ بازیابی‌شده نیز به کاربر جایگزین واگذار می‌شود تا همگام‌سازی بعدی
نمایه نتواند اختیار رقیبِ کاربر قبلی را بازگرداند. هر جدول اصلی در هر تراکنش اعمال به
100 ردیف محدود است؛ بازیابی‌های بزرگ‌تر باید ابتدا از یک مهاجرت مالک قابل‌ادامه استفاده کنند.
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

نکات:

- هر دو نقطهٔ پایانی به احراز هویت با توکن API نیاز دارند و فقط برای مالک مهارت کار می‌کنند.
- `rename`، slug قبلی را به‌عنوان نام مستعار تغییرمسیر حفظ می‌کند.
- `merge` فهرست مبدأ را پنهان می‌کند و slug مبدأ را به فهرست مقصد تغییرمسیر می‌دهد.

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

یک کاربر را مسدود کنید و مهارت‌های متعلق به او را به‌صورت دائمی حذف کنید (فقط ناظر/مدیر).

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

مسدودیت یک کاربر را بردارید و مهارت‌های واجد شرایط را بازیابی کنید (فقط مدیر).

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

کاربران را فهرست کنید یا جست‌وجو کنید (فقط مدیر).

پارامترهای پرس‌وجو:

- `q` (اختیاری): عبارت جست‌وجو
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

یک ستاره (برجسته‌سازی) اضافه/حذف کنید. هر دو نقطهٔ پایانی idempotent هستند.

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

برای برنامهٔ حذف، `DEPRECATIONS.md` را ببینید.

`POST /api/cli/upload-url`، `uploadUrl` و `uploadTicket` را برمی‌گرداند. انتشارهای بسته
که یک tarball از ClawPack را آماده می‌کنند باید شناسهٔ ذخیره‌سازی حاصل را به‌عنوان
`clawpack` و ticket برگشتی را به‌عنوان `clawpackUploadTicket` ارسال کنند.

## کشف رجیستری (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات رجیستری/احراز هویت را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

طرحواره:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر خودمیزبانی می‌کنید، این فایل را ارائه کنید (یا `CLAWHUB_REGISTRY` را صراحتاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی است).
