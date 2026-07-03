---
read_when:
    - افزودن/تغییر نقاط پایانی
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API ‏HTTP (عمومی + نقاط پایانی CLI + احراز هویت).
x-i18n:
    generated_at: "2026-07-03T09:46:02Z"
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

## استفادهٔ مجدد از کاتالوگ عمومی

دایرکتوری‌های شخص ثالث می‌توانند از نقاط پایانی خواندن عمومی برای فهرست‌کردن یا جست‌وجوی ClawHub skills استفاده کنند. لطفاً نتایج را cache کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست canonical ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) برگردانید، و از القای تأیید سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای پنهان، خصوصی، یا مسدودشده توسط moderation را خارج از سطح API عمومی mirror کنید.

میانبرهای web slug در خانواده‌های registry resolve می‌شوند، اما API clients باید به‌جای بازسازی تقدم route، از
URLهای canonical برگردانده‌شده توسط نقاط پایانی خواندن استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (Bearer token معتبر): به‌ازای bucket کاربر اعمال می‌شود.
- اگر token موجود نباشد/نامعتبر باشد، رفتار به اعمال بر اساس IP برمی‌گردد.
- نقاط پایانی نوشتن احراز هویت‌شده نباید وقتی
  سرور دلیل را می‌داند، یک `Unauthorized` ساده برگردانند. tokenهای غایب، tokenهای نامعتبر/لغوشده، و
  حساب‌های حذف‌شده/مسدودشده/غیرفعال باید هرکدام متن قابل‌اقدام دریافت کنند تا CLI
  clients بتوانند به کاربران بگویند چه چیزی مانع آن‌ها شده است.

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
- `RateLimit-Reset`: ثانیه‌ها تا reset (delay)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجهٔ باقی‌ماندهٔ دقیق در صورت وجود.
  درخواست‌های موفق sharded به‌جای برگرداندن مقدار global تقریبی، این header را حذف می‌کنند.
- `Retry-After`: ثانیه‌های انتظار قبل از تلاش دوباره (delay) روی `429`

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

راهنمای client:

- اگر `Retry-After` وجود دارد، پیش از تلاش دوباره همان تعداد ثانیه صبر کنید.
- برای جلوگیری از تلاش‌های هم‌زمان، از backoff با jitter استفاده کنید.
- اگر `Retry-After` موجود نیست، به `RateLimit-Reset` fallback کنید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- فقط وقتی deployment به‌طور صریح headerهای forwarded قابل‌اعتماد را فعال کند،
  از headerهای IP client قابل‌اعتماد، از جمله `cf-connecting-ip`، استفاده می‌کند.
- ClawHub از headerهای forwarding قابل‌اعتماد برای شناسایی IPهای client در edge استفاده می‌کند.
- اگر IP client قابل‌اعتمادی در دسترس نباشد، درخواست‌های ناشناس از bucketهای fallback استفاده می‌کنند
  که فقط بر اساس نوع rate-limit محدود شده‌اند. این bucketهای fallback شامل
  مسیرهای ارائه‌شده توسط caller، slugها، نام packageها، versionها، query stringها، یا دیگر
  پارامترهای artifact نیستند.

## پاسخ‌های خطا

پاسخ‌های خطای عمومی v1 متن ساده با `content-type: text/plain; charset=utf-8` هستند.
این شامل شکست‌های اعتبارسنجی (`400`)، منابع عمومی مفقود (`404`)، شکست‌های auth و
permission (`401`/`403`)، محدودیت‌های نرخ (`429`)، و دانلودهای مسدودشده می‌شود. Clients
باید بدنهٔ پاسخ را به‌عنوان رشتهٔ خوانا برای انسان بخوانند. پارامترهای query ناشناخته برای
سازگاری نادیده گرفته می‌شوند، اما پارامترهای query شناخته‌شده با مقدارهای نامعتبر
`400` برمی‌گردانند.

## نقاط پایانی عمومی (بدون auth)

### `GET /api/v1/search`

پارامترهای query:

- `q` (الزامی): رشتهٔ query
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): `true` برای فیلترکردن به skills برجسته
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن skills مشکوک (`flagged.suspicious`)
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

- نتایج به ترتیب ارتباط برگردانده می‌شوند (embedding similarity + exact slug/name token boosts + یک popularity prior کوچک).
- ارتباط از محبوبیت قوی‌تر است. تطابق دقیق token در slug یا display-name می‌تواند از تطابق آزادتر با engagement بسیار قوی‌تر رتبهٔ بالاتری بگیرد.
- متن ASCII بر اساس مرزهای واژه و نشانه‌گذاری tokenized می‌شود. برای مثال، `personal-map` شامل token مستقل `map` است، در حالی که `amap-jsapi-skill` شامل `amap`، `jsapi`، و `skill` است؛ بنابراین جست‌وجوی `map` به `personal-map` نسبت به `amap-jsapi-skill` تطابق واژگانی قوی‌تری می‌دهد.
- محبوبیت log-scaled و capped است. skills با engagement بالا وقتی متن query تطابق ضعیف‌تری دارد، می‌توانند رتبهٔ پایین‌تری بگیرند.
- وضعیت moderation مشکوک یا پنهان می‌تواند بسته به فیلترهای caller و وضعیت فعلی moderation، یک skill را از جست‌وجوی عمومی حذف کند.

راهنمای discoverability ناشر:

- اصطلاحاتی را که کاربران دقیقاً جست‌وجو خواهند کرد در display name، summary، و tags قرار دهید. فقط وقتی از token مستقل slug استفاده کنید که آن نیز یک هویت پایدار باشد که می‌خواهید نگه دارید.
- فقط برای دنبال‌کردن یک query، slug را rename نکنید، مگر اینکه slug جدید نام canonical بلندمدت بهتری باشد. slugهای قدیمی به aliasهای redirect تبدیل می‌شوند، اما URL canonical، slug نمایش‌داده‌شده، و digestهای جست‌وجوی آینده از slug جدید استفاده می‌کنند.
- aliasهای rename، resolution را برای URLهای قدیمی و نصب‌هایی که از طریق registry resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو پس از index شدن rename بر اساس metadata canonical skill است. آمارهای موجود با skill باقی می‌مانند.
- اگر skill به‌طور غیرمنتظره نامرئی است، پیش از تغییر metadata مرتبط با رتبه‌بندی، ابتدا وضعیت moderation را با `clawhub inspect @owner/slug` در حالت logged in بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): cursor صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended` (alias: `default`)، `createdAt` (alias: `newest`)، `downloads`، `stars` (alias: `rating`)، aliasهای قدیمی نصب `installsCurrent`/`installs`/`installsAllTime` به `downloads` map می‌شوند، `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن skills مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): alias قدیمی برای `nonSuspiciousOnly`

مقدارهای نامعتبر `sort`، `400` برمی‌گردانند.

یادداشت‌ها:

- `recommended` از سیگنال‌های engagement و تازگی استفاده می‌کند.
- `trending` بر اساس نصب‌ها در 7 روز گذشته رتبه‌بندی می‌شود (بر پایهٔ telemetry).
- `createdAt` برای crawlهای skill جدید پایدار است؛ `updated` وقتی skills موجود دوباره منتشر شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` باشد، sortهای مبتنی بر cursor ممکن است در یک صفحه کمتر از `limit` مورد برگردانند، چون skills مشکوک پس از دریافت صفحه فیلتر می‌شوند.
- وقتی `nextCursor` موجود است، برای ادامهٔ صفحه‌بندی از آن استفاده کنید. یک صفحهٔ کوتاه به‌تنهایی به معنای پایان نتایج نیست.

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

- slugهای قدیمی ایجادشده توسط flowهای rename/merge مالک به skill canonical resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter skill (مانند `["macos"]`، `["linux"]`). اگر اعلام نشده باشد، `null`.
- `metadata.systems`: targetهای Nix system (مانند `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد، `null`.
- اگر skill هیچ metadata پلتفرمی نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط وقتی skill پرچم‌گذاری شده باشد یا مالک در حال مشاهدهٔ آن باشد گنجانده می‌شود.

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

- مالکان و moderators می‌توانند به جزئیات moderation برای skills پنهان دسترسی داشته باشند.
- callers عمومی فقط برای skills قابل‌مشاهده‌ای که از قبل پرچم‌گذاری شده‌اند `200` دریافت می‌کنند.
- evidence برای callers عمومی redact می‌شود و فقط برای مالکان/moderators شامل snippetهای خام است.

### `POST /api/v1/skills/{slug}/report`

گزارش‌کردن یک skill برای بازبینی moderator. گزارش‌ها در سطح skill هستند، به‌صورت اختیاری
به یک version لینک می‌شوند، و queue گزارش skill را تغذیه می‌کنند.

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

نقطه پایانی moderator/admin برای دریافت گزارش‌های skill.

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

نقطه پایانی moderator/admin برای resolve کردن یا بازگشایی گزارش‌های skill.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام
برگرداندن `status` به `open` می‌توان آن را حذف کرد. برای پنهان‌کردن skill در همان workflow قابل‌ممیزی، همراه با گزارش triaged
`finalAction: "hide"` را ارسال کنید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): cursor صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

metadata نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` شامل وضعیت تأیید scan نرمال‌سازی‌شده و جزئیات scanner است
  (VirusTotal + LLM)، در صورت موجود بودن.

### `GET /api/v1/skills/{slug}/scan`

جزئیات تأیید scan امنیتی برای یک version از skill را برمی‌گرداند.

پارامترهای query:

- `version` (اختیاری): رشتهٔ version مشخص.
- `tag` (اختیاری): resolve کردن یک version برچسب‌خورده (برای مثال `latest`).

یادداشت‌ها:

- اگر نه `version` و نه `tag` ارائه شود، از آخرین نسخه استفاده می‌شود.
- شامل وضعیت تأیید نرمال‌شده به‌همراه جزئیات ویژهٔ اسکنر است.
- `security.hasScanResult` فقط زمانی `true` است که یک اسکنر رأی قطعی تولید کرده باشد (`clean`، `suspicious`، یا `malicious`).
- `moderation` یک نمای لحظه‌ای فعلی از تعدیل در سطح Skill است که از آخرین نسخه مشتق شده است.
- هنگام پرس‌وجوی یک نسخهٔ تاریخی، پیش از اینکه `moderation` و `security` را به‌عنوان زمینهٔ یکسان نسخه در نظر بگیرید، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

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

نکته‌ها:

- بارهای درخواست اسکن و گزارش‌های قابل دانلود پس از پنجرهٔ نگهداری از مخزن درخواست اسکن منقضی می‌شوند.
- اسکن‌های منتشرشده به دسترسی مدیریتی مالک/ناشر، یا اختیار ناظر/مدیر پلتفرم نیاز دارند.
- اسکن‌های منتشرشده فقط وقتی بازنویسی می‌کنند که `update: true` باشد و اسکن با موفقیت کامل شود.
- پاسخ `202` با `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` است.
- کارهای اسکن ناهمگام هستند. درخواست‌های اسکن دستی جلوتر از کار عادی انتشار/پرکردن عقب‌مانده اولویت‌بندی می‌شوند، اما تکمیل همچنان به در دسترس بودن Worker وابسته است.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطهٔ پایانی نظرسنجی احراز هویت‌شده برای یک اسکن ارسال‌شده.

- وضعیت در صف/در حال اجرا/موفق/ناموفق را برمی‌گرداند.
- هنگام در صف بودن، `queue.queuedAhead` و `queue.position` را برمی‌گرداند تا کلاینت‌ها بتوانند نشان دهند چند اسکن دستی اولویت‌دار جلوتر از درخواست قرار دارند. صف‌های بسیار بزرگ محدود می‌شوند و با `queuedAheadIsEstimate: true` گزارش می‌شوند.
- در صورت موجود بودن، `report` شامل بخش‌های `clawscan`، `skillspector`، `staticAnalysis`، و `virustotal` است.
- کارهای اسکن ناموفق، `status: "failed"` را به‌همراه `lastError` برمی‌گردانند.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطهٔ پایانی بایگانی گزارش احراز هویت‌شده.

- به یک اسکن موفق نیاز دارد؛ اسکن‌های غیرنهایی `409` برمی‌گردانند.
- یک ZIP با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json`، و `README.md` برمی‌گرداند.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطهٔ پایانی بایگانی گزارش ذخیره‌شدهٔ احراز هویت‌شده برای نسخه‌های ارسال‌شده.

- به دسترسی مدیریتی مالک/ناشر به Skill یا Plugin، یا اختیار ناظر/مدیر پلتفرم نیاز دارد.
- نتایج اسکن ذخیره‌شده برای نسخهٔ دقیق ارسال‌شده را برمی‌گرداند، از جمله نسخه‌های مسدودشده یا پنهان.
- `kind` به‌طور پیش‌فرض `skill` است؛ برای اسکن‌های Plugin/بسته از `kind=plugin` استفاده کنید.
- همان شکل ZIP دانلودهای درخواست اسکن را برمی‌گرداند.

### `POST /api/v1/skills/-/scan/batch`

مسیر بازاسکن دسته‌ای canonical فقط برای مدیران. همان شکل بار `POST /api/v1/skills/-/rescan-batch` قدیمی را می‌پذیرد.

### `POST /api/v1/skills/-/scan/batch/status`

مسیر وضعیت دسته‌ای canonical فقط برای مدیران. `{ "jobIds": ["..."] }` را می‌پذیرد و همان شمارنده‌های تجمیعی `POST /api/v1/skills/-/rescan-batch/status` قدیمی را برمی‌گرداند.

### `GET /api/v1/skills/{slug}/verify`

پاکت تأیید Skill Card را که توسط `clawhub skill verify` استفاده می‌شود برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشتهٔ نسخهٔ مشخص.
- `tag` (اختیاری): یک نسخهٔ برچسب‌خورده را resolve می‌کند (برای مثال `latest`).

نکته‌ها:

- `ok` فقط زمانی `true` است که نسخهٔ انتخاب‌شده یک Skill Card تولیدشده داشته باشد، توسط تعدیل به‌عنوان بدافزار مسدود نشده باشد، و تأیید ClawScan پاک باشد.
- هویت Skill، هویت ناشر، و فرادادهٔ نسخهٔ انتخاب‌شده فیلدهای سطح بالای پاکت هستند (`slug`، `displayName`، `publisherHandle`، `version`، `resolvedFrom`، `tag`، `createdAt`) تا خودکارسازی shell بتواند آن‌ها را بدون باز کردن wrapperهای تو در تو بخواند.
- `security` رأی سطح بالای ClawScan/امنیت است. خودکارسازی باید بر اساس `ok`، `decision`، `reasons`، و `security.status` عمل کند.
- `security.signals` شامل شواهد پشتیبان اسکنر مانند `staticScan`، `virusTotal`، و `skillSpector` است.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 نگه داشته شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- `provenance` فقط زمانی `server-resolved-github-import` است که ClawHub هنگام انتشار یا import یک repo/ref/commit/path از GitHub را resolve و ذخیره کرده باشد؛ در غیر این صورت `unavailable` است.

### `POST /api/v1/skills/-/security-verdicts`

رأی‌های امنیتی فشردهٔ فعلی را برای نسخه‌های دقیق Skill برمی‌گرداند. این
نقطهٔ پایانی مجموعه برای کلاینت‌هایی در نظر گرفته شده است که از قبل می‌دانند کدام
نسخه‌های Skill نصب‌شدهٔ ClawHub را باید نمایش دهند، مانند OpenClaw Control UI.

درخواست:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

نکته‌ها:

- `items` باید شامل 1 تا 100 جفت یکتای `{ slug, version }` باشد.
- نتایج به‌ازای هر آیتم هستند؛ نبودن یک Skill یا نسخه کل پاسخ را ناموفق نمی‌کند.
- پاسخ فقط امنیتی است. دادهٔ Skill Card، وضعیت کارت تولیدشده، فهرست‌های فایل artifact، یا بارهای جزئی اسکنر را شامل نمی‌شود.
- `security.signals` فقط شامل شواهد پشتیبان در سطح وضعیت است؛ برای جزئیات کامل اسکنر از `/scan` یا صفحهٔ security-audit در ClawHub استفاده کنید.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 نگه داشته شده است، اما اسکنر وجود رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- نبود Skill Card بر `ok`، `decision`، یا `reasons` این نقطهٔ پایانی اثر نمی‌گذارد؛ کلاینت‌ها وقتی به محتوای کارت نیاز دارند باید `skill-card.md` نصب‌شده را به‌صورت محلی بخوانند.
- وقتی به پاکت تأیید Skill Card برای یک Skill نیاز دارید از `/verify` استفاده کنید، وقتی به markdown کارت تولیدشده نیاز دارید از `/card`، و وقتی به دادهٔ جزئی اسکنر نیاز دارید از `/scan`.

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
- محدودیت اندازه فایل: 200KB.

### `GET /api/v1/packages`

نقطه پایانی کاتالوگ یکپارچه برای:

- skills
- code plugins
- bundle plugins

پارامترهای پرس‌وجو:

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
  نام‌های مستعار فیلتر v1 قدیمی در بخش `GET /api/v1/plugins` مستند شده‌اند.

نکات:

- مقدارهای نامعتبر برای `family`، `channel`، `isOfficial`، `featured`،
  `highlightedOnly`، یا `sort` مقدار `400` برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار با خانواده ثابت باقی می‌مانند.
- مدخل‌های Skill همچنان با رجیستری Skill پشتیبانی می‌شوند و هنوز فقط از طریق `POST /api/v1/skills` قابل انتشار هستند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخوان‌های ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخوان‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که عضو آن‌ها هستند در نتایج فهرست/جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/packages/search`

جست‌وجوی کاتالوگ یکپارچه در Skills + بسته‌های Plugin.

پارامترهای پرس‌وجو:

- `q` (الزامی): رشته پرس‌وجو
- `limit` (اختیاری): عدد صحیح (1–100)
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد. دسته‌های کنترل‌شده و نام‌های مستعار
  فیلتر v1 قدیمی در بخش `GET /api/v1/plugins` مستند شده‌اند.

نکات:

- مقدارهای نامعتبر برای `family`، `channel`، `isOfficial`، `featured`، یا
  `highlightedOnly` مقدار `400` برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- فراخوان‌های ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخوان‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که عضو آن‌ها هستند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/plugins`

مرور کاتالوگ فقط Plugin در بسته‌های code-plugin و bundle-plugin.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `recommended` (پیش‌فرض)، `trending`، `downloads`، `updated`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته Plugin. مقدارهای فعلی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نام‌های مستعار فیلتر v1 قدیمی همچنان در نقاط پایانی خواندن پذیرفته می‌شوند:

- `mcp-tooling`، `data`، و `automation` به `tools` حل می‌شوند.
- `observability` و `deployment` به `gateway` حل می‌شوند.
- `dev-tools` به `runtime` حل می‌شود.

`trending` جدول رتبه‌بندی نصب/دانلود هفت‌روزه است و از مجموع‌های کل دوره استفاده نمی‌کند.
در نقطه پایانی یکپارچه `/api/v1/packages` فقط مخصوص Plugin است؛ برای کاتالوگ Skill از
`/api/v1/skills?sort=trending` استفاده کنید.

نام‌های مستعار قدیمی به‌عنوان مقدارهای دسته ذخیره‌شده یا اعلام‌شده توسط نویسنده پذیرفته نمی‌شوند.

### `GET /api/v1/skills/export`

خروجی‌گیری انبوه از آخرین Skills عمومی برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای پرس‌وجو:

- `startDate` (الزامی): کران پایین Unix به میلی‌ثانیه برای `updatedAt` Skill.
- `endDate` (الزامی): کران بالای Unix به میلی‌ثانیه برای `updatedAt` Skill.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.

پاسخ:

- بدنه: آرشیو ZIP.
- ریشه هر Skill خروجی‌گرفته‌شده در `{publisher}/{slug}/` قرار دارد.
- Skills میزبانی‌شده شامل فایل‌های آخرین نسخه ذخیره‌شده هستند و در
  `_manifest.json` با `sourceRef: "public-clawhub"` فهرست می‌شوند.
- Skills فعلی مبتنی بر GitHub با اسکن `clean` یا `suspicious` شامل
  `_source_handoff.json` با `sourceRef: "public-github"`، مخزن، کامیت، مسیر،
  هش محتوا، و URL آرشیو هستند. آن‌ها فایل‌های منبع میزبانی‌شده در ClawHub را شامل نمی‌شوند.
- هر Skill شامل `_export_skill_meta.json` است.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- `_errors.json` زمانی گنجانده می‌شود که Skills یا فایل‌های جداگانه قابل
  خروجی‌گیری نبوده باشند.

سرآیندها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

خروجی‌گیری دسته‌ای از آخرین انتشارهای عمومی Plugin برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای پرس‌وجو:

- `startDate` (الزامی): کران پایین به میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `endDate` (الزامی): کران بالا به میلی‌ثانیه Unix برای `updatedAt` مربوط به Plugin.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.
- `family` (اختیاری): `code-plugin` یا `bundle-plugin`. حذف آن یعنی هر دو
  خانواده Plugin.

پاسخ:

- بدنه: آرشیو ZIP.
- ریشه هر Plugin خروجی‌گرفته‌شده در `{family}/{packageName}/` قرار دارد.
- هر Plugin خروجی‌گرفته‌شده شامل فایل‌های ذخیره‌شده آخرین انتشار است.
- فراداده خروجی‌گیری برای هر Plugin در
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` ذخیره می‌شود.
- `_manifest.json` همیشه در ریشه ZIP گنجانده می‌شود.
- وقتی Pluginها یا فایل‌های منفرد نتوانسته باشند
  خروجی‌گیری شوند، `_errors.json` گنجانده می‌شود.

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
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

یادداشت‌ها:

- نام‌های مستعار فیلتر قدیمی v1 که زیر `GET /api/v1/plugins` مستند شده‌اند نیز
  پذیرفته می‌شوند.
- فیلترکردن دسته‌بندی یک فیلتر واقعی API است که با ردیف‌های digest دسته‌بندی Plugin
  پشتیبانی می‌شود، نه بازنویسی پرس‌وجوی جست‌وجو.
- نتایج به ترتیب ارتباط بازگردانده می‌شوند و در حال حاضر صفحه‌بندی ندارند.
- کنترل‌های مرتب‌سازی رابط مرورگر برای جست‌وجوی Plugin نتایج بارگذاری‌شده بر اساس ارتباط را دوباره مرتب می‌کنند،
  مطابق با رفتار مرور فعلی `/skills`.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را بازمی‌گرداند.

یادداشت‌ها:

- Skills نیز می‌توانند از طریق این مسیر در کاتالوگ یکپارچه resolve شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.

یادداشت‌ها:

- به توکن API برای مالک بسته، مالک/مدیر ناشر سازمانی،
  ناظر پلتفرم، یا مدیر پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه‌ها را بازمی‌گرداند.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

یادداشت‌ها:

- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را، شامل فراداده فایل، سازگاری،
راستی‌آزمایی، فراداده artifact و داده‌های اسکن، بازمی‌گرداند.

یادداشت‌ها:

- `version.artifact.kind` برای آرشیوهای بسته قدیمی `legacy-zip` است یا
  برای انتشارهای مبتنی بر ClawPack مقدار `npm-pack`.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum`، و
  `npmTarballName` هستند.
- `version.sha256hash` فراداده سازگاری منسوخ‌شده برای کلاینت‌های قدیمی است. این مقدار
  بایت‌های دقیق ZIP بازگردانده‌شده توسط `/api/v1/packages/{name}/download` را hash می‌کند.
  کلاینت‌های جدید باید از `version.artifact.sha256` استفاده کنند که
  artifact انتشار canonical را شناسایی می‌کند.
- `version.vtAnalysis`، `version.llmAnalysis`، و `version.staticScan` زمانی
  گنجانده می‌شوند که داده اسکن وجود داشته باشد.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصه دقیق امنیت و اعتماد انتشار بسته را برای کلاینت‌های نصب
بازمی‌گرداند. این سطح مصرف عمومی OpenClaw برای تصمیم‌گیری درباره این است که آیا یک
انتشار resolveشده می‌تواند نصب شود یا نه.

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
  انتشار دقیقی را که ارزیابی شده است شناسایی می‌کنند.
- `release.artifactKind`، `release.artifactSha256`، `release.npmIntegrity`،
  `release.npmShasum`، و `release.npmTarballName` زمانی حضور دارند که برای
  artifact انتشار شناخته‌شده باشند.
- `trust.scanStatus` وضعیت اعتماد مؤثر است که از ورودی‌های اسکنر
  و moderation دستی انتشار به‌دست آمده است.
- `trust.moderationState` می‌تواند null باشد. وقتی moderation دستی انتشار
  وجود نداشته باشد `null` است.
- `trust.blockedFromDownload` سیگنال مسدودسازی نصب است. OpenClaw و سایر
  کلاینت‌های نصب باید وقتی این مقدار `true` است نصب را مسدود کنند، به‌جای اینکه
  قواعد مسدودسازی را دوباره از فیلدهای اسکنر یا moderation استخراج کنند.
- `trust.reasons` فهرست توضیح کاربرمحور و حسابرسی است. کدهای دلیل
  رشته‌هایی پایدار و فشرده مانند `manual:quarantined`، `scan:malicious`،
  و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد هنوز در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصه اعتماد از ورودی‌های قدیمی محاسبه شده است و
  باید پیش از تصمیم allow با اطمینان بالا، نیازمند refresh تلقی شود.

یادداشت‌ها:

- این endpoint دقیقاً وابسته به نسخه است. کلاینت‌ها باید پس از resolve کردن
  نسخه بسته‌ای که قصد نصب آن را دارند آن را فراخوانی کنند، نه فقط پس از خواندن آخرین
  فراداده بسته.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.
- این endpoint عمداً از endpointهای moderation مالک/ناظر محدودتر است.
  تصمیم نصب و توضیح عمومی را افشا می‌کند، نه
  هویت گزارش‌دهندگان، بدنه گزارش‌ها، شواهد خصوصی، یا جدول زمانی بازبینی داخلی.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده resolver صریح artifact را برای یک نسخه بسته بازمی‌گرداند.

یادداشت‌ها:

- نسخه‌های بسته قدیمی یک artifact از نوع `legacy-zip` و یک
  `downloadUrl` قدیمی ZIP برمی‌گردانند.
- نسخه‌های ClawPack یک artifact از نوع `npm-pack`، فیلدهای integrity مربوط به npm، یک
  `tarballUrl`، و URL سازگاری ZIP قدیمی را برمی‌گردانند.
- این سطح resolver OpenClaw است؛ از حدس‌زدن قالب آرشیو از
  یک URL مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

artifact نسخه را از مسیر resolver صریح دانلود می‌کند.

یادداشت‌ها:

- نسخه‌های ClawPack بایت‌های دقیق `.tgz` بارگذاری‌شده npm-pack را stream می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` redirect می‌شوند.
- از bucket نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آینده OpenClaw را بازمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر هستند:

- وضعیت کانال رسمی
- در دسترس بودن آخرین نسخه
- در دسترس بودن artifact مربوط به ClawPack npm-pack
- digest مربوط به artifact
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

endpoint ناظر برای فهرست‌کردن ردیف‌های migration مربوط به Plugin رسمی OpenClaw.

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

endpoint مدیر برای ایجاد یا به‌روزرسانی ردیف migration مربوط به Plugin رسمی.

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

- `bundledPluginId` به حروف کوچک normalize می‌شود و کلید upsert پایدار است.
- `packageName` به نام npm normalize می‌شود؛ بسته می‌تواند برای migrationهای برنامه‌ریزی‌شده
  موجود نباشد.
- این فقط آمادگی migration را پیگیری می‌کند. OpenClaw را تغییر نمی‌دهد یا
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

endpoint ناظر/مدیر برای صف‌های بازبینی انتشار بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای پرس‌وجو:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

معانی وضعیت:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، لغوشده، یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، لغوشده، یا مخرب.
- `manual`: هر انتشاری که override دستی moderation دارد.
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

یک بسته را برای بازبینی ناظر گزارش می‌کند. گزارش‌ها در سطح بسته هستند و به‌صورت اختیاری
به یک نسخه پیوند می‌خورند. آن‌ها صف moderation را تغذیه می‌کنند اما به‌تنهایی دانلودها را
به‌طور خودکار پنهان یا مسدود نمی‌کنند؛ ناظران باید از moderation انتشار برای
تأیید، قرنطینه‌کردن، یا لغو artifactها استفاده کنند.

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

نقطه پایانی مالک/ناظر برای مشاهده‌پذیری نظارت بسته.

احراز هویت:

- به یک توکن API برای مالک بسته، عضو منتشرکننده، ناظر، یا
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
`status` به `open` می‌توان آن را حذف کرد. برای اعمال نظارت روی انتشار در همان
گردش‌کار قابل ممیزی، همراه با گزارش تاییدشده `finalAction: "quarantine"` یا
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

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود آرتیفکت `403` برمی‌گردانند.
هر تغییر یک ورودی لاگ ممیزی می‌نویسد.

### `GET /api/v1/packages/{name}/file`

محتوای متنی خام یک فایل بسته را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌صورت پیش‌فرض از آخرین انتشار استفاده می‌کند.
- از سطل نرخ خواندن استفاده می‌کند، نه سطل دانلود.
- فایل‌های باینری `415` برمی‌گردانند.
- محدودیت اندازه فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن را مسدود نمی‌کنند؛ انتشارهای مخرب ممکن است همچنان در جای دیگری نگه داشته شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند منتشرکننده مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای یک انتشار بسته دانلود می‌کند.

پارامترهای پرس‌وجو:

- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌صورت پیش‌فرض از آخرین انتشار استفاده می‌کند.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشه `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP باقی می‌ماند. فایل‌های `.tgz` متعلق به ClawPack را استریم نمی‌کند.
- پاسخ‌ها برای بررسی یکپارچگی resolver شامل هدرهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` هستند.
- متادیتای فقط رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک packument سازگار با npm برای نسخه‌های بسته مبتنی بر ClawPack برمی‌گرداند.

نکات:

- فقط نسخه‌هایی که tarballهای npm-pack متعلق به ClawPack بارگذاری‌شده دارند فهرست می‌شوند.
- نسخه‌های قدیمی فقط-ZIP عمدا حذف می‌شوند.
- `dist.tarball`، `dist.integrity`، و `dist.shasum` از فیلدهای سازگار با npm
  استفاده می‌کنند تا کاربران در صورت تمایل بتوانند npm را به آینه اشاره دهند.
- packumentهای بسته scoped هم مسیر درخواست `/api/npm/@scope/name` و هم مسیر
  کدگذاری‌شده npm یعنی `/api/npm/@scope%2Fname` را پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball بارگذاری‌شده ClawPack را برای کلاینت‌های آینه npm استریم می‌کند.

نکات:

- از سطل نرخ دانلود استفاده می‌کند.
- هدرهای دانلود شامل SHA-256 متعلق به ClawHub به‌همراه متادیتای integrity/shasum متعلق به npm هستند.
- بررسی‌های نظارت و دسترسی بسته خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

CLI از آن برای نگاشت اثرانگشت محلی به یک نسخه شناخته‌شده استفاده می‌کند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز 64 کاراکتری اثرانگشت باندل

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک ZIP نسخه skill میزبانی‌شده را دانلود می‌کند، یا برای یک skill فعلی مبتنی بر GitHub
با اسکن `clean` یا `suspicious` و بدون نسخه میزبانی‌شده، واگذاری منبع GitHub را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `version` (اختیاری): رشته semver
- `tag` (اختیاری): نام تگ (مثلا `latest`)

نکات:

- اگر نه `version` و نه `tag` ارائه شوند، از آخرین نسخه استفاده می‌شود.
- نسخه‌های نرم‌حذف‌شده `410` برمی‌گردانند.
- واگذاری‌های skill مبتنی بر GitHub بایت‌ها را proxy یا mirror نمی‌کنند. پاسخ JSON
  شامل `sourceRef: "public-github"`، `repo`، `commit`، `path`، `contentHash`،
  و `archiveUrl` است؛ وضعیت اسکن/فعلی یک گیت است و به‌عنوان متادیتای بار موفقیت
  گنجانده نمی‌شود.
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
- فیلد اختیاری payload: `ownerHandle`. در صورت وجود، API آن
  منتشرکننده را در سمت سرور resolve می‌کند و از actor می‌خواهد دسترسی منتشرکننده داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` مقدار `true` باشد، یک
  skill موجود می‌تواند به آن مالک منتقل شود، اگر actor روی هر دو
  منتشرکننده فعلی و مقصد، مدیر/مالک باشد. بدون این opt-in، تغییرات مالک
  رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت با توکن Bearer نیاز دارد.
- به `multipart/form-data` نیاز دارد.
- فیلدهای فرم مجاز `payload`، blobهای تکرارشونده `files`، یا یک ارجاع tarball
  به نام `clawpack` هستند. `clawpack` می‌تواند یک blob `.tgz` یا یک storage id برگشتی از
  جریان upload-url باشد. انتشارهای مرحله‌بندی‌شده با storage-id باید
  `clawpackUploadTicket` برگشتی همراه با آن URL بارگذاری را نیز شامل شوند.
- یا از `files` استفاده کنید یا از `clawpack`، هرگز هر دو را در یک درخواست نفرستید.
- بدنه‌های JSON و متادیتای `payload.files` / `payload.artifact`
  ارائه‌شده توسط فراخواننده رد می‌شوند.
- درخواست‌های انتشار مستقیم multipart به 18MB محدود هستند. tarballهای ClawPack می‌توانند
  از جریان upload-url تا سقف tarball برابر 120MB استفاده کنند.
- فیلد اختیاری payload: `ownerHandle`. در صورت وجود، فقط مدیران می‌توانند از طرف آن مالک منتشر کنند.

نکات برجسته اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های `.tgz` متعلق به ClawPack باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- code pluginها به `package.json`، متادیتای repo منبع، متادیتای commit منبع،
  متادیتای اسکیمای config، `openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` متادیتای اختیاری هستند.
- فقط منتشرکننده org با نام `openclaw` و منتشرکننده‌های شخصی اعضای فعلی org با نام `openclaw`
  می‌توانند در کانال `official` منتشر کنند.
- انتشارهای از طرف دیگران همچنان شایستگی کانال رسمی را در برابر حساب مالک مقصد اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

نرم‌حذف / بازیابی یک skill (مالک، ناظر، یا مدیر).

بدنه JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

در صورت وجود، `reason` به‌عنوان یادداشت نظارت skill ذخیره می‌شود و در لاگ ممیزی کپی می‌شود.
نرم‌حذف‌های آغازشده توسط مالک slug را برای 30 روز رزرو می‌کنند، سپس ناشر دیگری می‌تواند
slug را claim کند. وقتی این انقضا اعمال شود، پاسخ حذف شامل `slugReservedUntil` است.
پنهان‌سازی‌های ناظر/مدیر و حذف‌های امنیتی به این شکل منقضی نمی‌شوند.

پاسخ حذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

کدهای وضعیت:

- `200`: درست
- `401`: احراز هویت نشده
- `403`: ممنوع
- `404`: skill/کاربر پیدا نشد
- `500`: خطای داخلی سرور

### `POST /api/v1/users/publisher`

فقط مدیر. اطمینان می‌دهد که برای یک handle منتشرکننده org وجود دارد. اگر handle هنوز به یک
کاربر مشترک قدیمی/منتشرکننده شخصی اشاره کند، نقطه پایانی ابتدا آن را به یک منتشرکننده org مهاجرت می‌دهد.
برای org تازه‌ساخته‌شده، `memberHandle` را ارائه کنید؛ مدیر عامل به‌عنوان عضو اضافه نمی‌شود.
`memberRole` به‌صورت پیش‌فرض `owner` است.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

ایجاد self-serve منتشرکننده org با احراز هویت. یک منتشرکننده org جدید ایجاد می‌کند و
فراخواننده را به‌عنوان مالک اضافه می‌کند. این نقطه پایانی handleهای کاربر/شخصی موجود را مهاجرت نمی‌دهد و
منتشرکننده را trusted/official علامت‌گذاری نمی‌کند.

- بدنه: `{ "handle": "opik", "displayName": "Opik" }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- وقتی handle قبلا توسط یک منتشرکننده، کاربر، یا منتشرکننده شخصی استفاده شده باشد، `409` برمی‌گرداند.

### `POST /api/v1/users/reserve`

فقط مدیر. slugهای ریشه و نام‌های بسته را برای مالک برحق بدون انتشار یک
انتشار رزرو می‌کند. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف انتشار تبدیل می‌شوند، بنابراین همان
مالک می‌تواند بعدا انتشار واقعی code-plugin یا bundle-plugin را با آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

فقط مدیر. یک منتشرکننده شخصی را برای principal جایگزین تاییدشده GitHub OAuth
بدون ویرایش ردیف‌های حساب Convex Auth بازیابی می‌کند. درخواست باید هر دو شناسه تغییرناپذیر حساب provider
در GitHub را نام ببرد؛ handleهای تغییرپذیر فقط به‌عنوان گارد روبه‌روی operator استفاده می‌شوند.

نقطه پایانی به‌طور پیش‌فرض در حالت اجرای آزمایشی است. اعمال بازیابی پس از آنکه کارکنان به‌طور مستقل پیوستگی میان هر دو
شناسه اصلی GitHub را تأیید کردند، به `dryRun: false` و
`confirmIdentityVerified: true` نیاز دارد. اگر ناشر شخصی فعلی کاربر مقصد دارای مهارت‌ها، بسته‌ها، یا منابع مهارت GitHub باشد، بازیابی با حالت بسته شکست می‌خورد.
بازیابی همچنین فیلدهای قدیمی `ownerUserId` را برای مهارت‌های ناشر بازیابی‌شده،
نام‌های مستعار slug مهارت، بسته‌ها، هشدارهای بازرس بسته، و ردیف‌های مشتق‌شده digest جست‌وجو مهاجرت می‌دهد تا
مسیرهای مالک مستقیم با مرجعیت ناشر جدید همخوان باشند. رزرو فعال handle محافظت‌شده
برای handle بازیابی‌شده نیز به کاربر جایگزین واگذار می‌شود تا همگام‌سازی بعدی
پروفایل نتواند مرجعیت رقیب کاربر قبلی را بازگرداند. هر جدول اصلی در هر تراکنش اعمال به
100 ردیف محدود است؛ بازیابی‌های بزرگ‌تر باید ابتدا از مهاجرت مالک قابل ازسرگیری استفاده کنند.
منابع مهارت GitHub در محدوده ناشر هستند و به‌جای بازنویسی، به‌صورت بررسی‌شده گزارش می‌شوند.

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
- `rename` slug قبلی را به‌عنوان نام مستعار تغییرمسیر حفظ می‌کند.
- `merge` فهرست منبع را پنهان می‌کند و slug منبع را به فهرست هدف تغییرمسیر می‌دهد.

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

یک کاربر را مسدود می‌کند و مهارت‌های تحت مالکیت او را سخت‌حذف می‌کند (فقط ناظر/مدیر).

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

مسدودیت کاربر را رفع می‌کند و مهارت‌های واجد شرایط را بازمی‌گرداند (فقط مدیر).

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

دلیل ذخیره‌شده برای یک مسدودیت موجود را بدون رفع مسدودیت یا بازگرداندن
محتوا تغییر می‌دهد (فقط مدیر). مگر اینکه `dryRun` برابر `false` باشد، به‌طور پیش‌فرض اجرای آزمایشی است.

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

کاربران را فهرست یا جست‌وجو می‌کند (فقط مدیر).

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

یک ستاره (برجسته‌سازی) اضافه/حذف می‌کند. هر دو نقطه پایانی idempotent هستند.

پاسخ‌ها:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقاط پایانی CLI قدیمی (منسوخ‌شده)

همچنان برای نسخه‌های قدیمی‌تر CLI پشتیبانی می‌شوند:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

برای برنامه حذف، `DEPRECATIONS.md` را ببینید.

`POST /api/cli/upload-url` مقادیر `uploadUrl` و `uploadTicket` را برمی‌گرداند. انتشارهای بسته
که یک tarball از ClawPack را مرحله‌بندی می‌کنند، باید شناسه ذخیره‌سازی حاصل را به‌عنوان
`clawpack` و ticket برگشتی را به‌عنوان `clawpackUploadTicket` ارسال کنند.

## کشف registry (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات registry/auth را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر خودتان میزبانی می‌کنید، این فایل را ارائه دهید (یا `CLAWHUB_REGISTRY` را صراحتاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی).
