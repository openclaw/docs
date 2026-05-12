---
read_when:
    - افزودن/تغییر نقاط پایانی
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API HTTP (نقاط پایانی عمومی + CLI + احراز هویت).
x-i18n:
    generated_at: "2026-05-12T12:49:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL پایه: `https://clawhub.ai` (پیش‌فرض).

همه مسیرهای v1 زیر `/api/v1/...` قرار دارند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی مانده‌اند (نگاه کنید به `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## استفاده مجدد از کاتالوگ عمومی

فهرست‌های شخص ثالث می‌توانند از endpointهای خواندن عمومی برای فهرست‌کردن یا جست‌وجوی Skillsهای ClawHub استفاده کنند. لطفا نتایج را cache کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست canonical ClawHub (`https://clawhub.ai/<owner>/<slug>`) برگردانید، و از القای تایید سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای پنهان، خصوصی، یا مسدودشده توسط moderation را خارج از سطح API عمومی mirror کنید.

میان‌برهای slug وب در میان خانواده‌های registry resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی تقدم مسیرها، از
URLهای canonical برگردانده‌شده توسط endpointهای خواندن استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (Bearer token معتبر): به‌ازای bucket هر کاربر اعمال می‌شود.
- اگر token وجود نداشته باشد/نامعتبر باشد، رفتار به اعمال بر اساس IP برمی‌گردد.
- endpointهای نوشتن احراز هویت‌شده نباید وقتی
  سرور دلیل را می‌داند، یک `Unauthorized` خالی برگردانند. tokenهای جاافتاده، tokenهای نامعتبر/لغوشده، و
  حساب‌های حذف‌شده/مسدودشده/غیرفعال باید هرکدام متن قابل اقدام دریافت کنند تا کلاینت‌های CLI
  بتوانند به کاربران بگویند چه چیزی آن‌ها را مسدود کرده است.

- خواندن: 600/min به‌ازای هر IP، 2400/min به‌ازای هر key
- نوشتن: 45/min به‌ازای هر IP، 180/min به‌ازای هر key
- دانلود: 30/min به‌ازای هر IP، 180/min به‌ازای هر key (`/api/v1/download`)

Headerها:

- سازگاری قدیمی: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- روی `429`: `Retry-After`

معنای Headerها:

- `X-RateLimit-Reset`: ثانیه‌های مطلق Unix epoch
- `RateLimit-Reset`: ثانیه‌ها تا reset (تاخیر)
- `Retry-After`: ثانیه‌های انتظار پیش از تلاش دوباره (تاخیر) روی `429`

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
- برای جلوگیری از تلاش‌های دوباره همگام، از backoff همراه با jitter استفاده کنید.
- اگر `Retry-After` وجود ندارد، به `RateLimit-Reset` برگردید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- به‌طور پیش‌فرض از `cf-connecting-ip` (Cloudflare) برای IP کلاینت استفاده می‌کند.
- ClawHub برای شناسایی IPهای کلاینت در edge از headerهای forwarding مورد اعتماد استفاده می‌کند.
- اگر IP کلاینت مورد اعتماد در دسترس نباشد، درخواست‌های دانلود ناشناس به‌جای یک bucket سراسری `ip:unknown` از یک bucket جایگزین محدود به endpoint استفاده می‌کنند. درخواست‌های خواندن/نوشتن ناشناس همچنان از bucket ناشناخته مشترک استفاده می‌کنند تا مسیریابی بدون IP همچنان قابل مشاهده و محافظه‌کارانه بماند.

## endpointهای عمومی (بدون auth)

### `GET /api/v1/search`

پارامترهای query:

- `q` (الزامی): رشته query
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): `true` برای filter کردن به Skillsهای برجسته
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن Skillsهای مشکوک (`flagged.suspicious`)
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
      "updatedAt": 1730000000000
    }
  ]
}
```

نکته‌ها:

- نتایج به‌ترتیب مرتبط‌بودن برگردانده می‌شوند (شباهت embedding + boostهای token دقیق slug/name + پیش‌فرض محبوبیت از دانلودها).
- مرتبط‌بودن از محبوبیت قوی‌تر است. تطابق دقیق slug یا token نام نمایشی می‌تواند از تطابق آزادتر با دانلودهای بسیار بیشتر رتبه بالاتری بگیرد.
- متن ASCII بر اساس مرزهای واژه و نشانه‌گذاری tokenسازی می‌شود. برای مثال، `personal-map` شامل token مستقل `map` است، در حالی‌که `amap-jsapi-skill` شامل `amap`، `jsapi` و `skill` است؛ بنابراین جست‌وجوی `map` به `personal-map` نسبت به `amap-jsapi-skill` تطابق واژگانی قوی‌تری می‌دهد.
- دانلودها به‌عنوان پیش‌فرض کوچک با مقیاس لگاریتمی و عامل شکستن تساوی استفاده می‌شوند، نه به‌عنوان سیگنال اصلی رتبه‌بندی. Skillsهای با دانلود زیاد می‌توانند وقتی متن query تطابق ضعیف‌تری دارد، رتبه پایین‌تری بگیرند.
- وضعیت moderation مشکوک یا پنهان می‌تواند بسته به filterهای فراخواننده و وضعیت فعلی moderation یک skill را از جست‌وجوی عمومی حذف کند.

راهنمای discoverability ناشر:

- اصطلاحاتی را که کاربران دقیقا جست‌وجو خواهند کرد در نام نمایشی، خلاصه و tagها قرار دهید. فقط وقتی از یک token مستقل slug استفاده کنید که همان هم هویتی پایدار است که می‌خواهید نگه دارید.
- یک slug را صرفا برای دنبال‌کردن یک query تغییر نام ندهید، مگر اینکه slug جدید نام canonical بلندمدت بهتری باشد. slugهای قدیمی به aliasهای redirect تبدیل می‌شوند، اما URL canonical، slug نمایش‌داده‌شده، و digestهای جست‌وجوی آینده از slug جدید استفاده می‌کنند.
- aliasهای تغییر نام، resolution را برای URLهای قدیمی و نصب‌هایی که از طریق registry resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو بر اساس metadata مهارت canonical پس از index شدن تغییر نام است. آمار موجود با skill باقی می‌ماند.
- اگر یک skill به‌طور غیرمنتظره نامرئی است، پیش از تغییر metadata مرتبط با رتبه‌بندی، ابتدا در حالت واردشده با `clawhub inspect <slug>` وضعیت moderation را بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): cursor صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `createdAt` (alias: `newest`)، `downloads`، `stars` (alias: `rating`)، `installsCurrent` (alias: `installs`)، `installsAllTime`، `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن Skillsهای مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): alias قدیمی برای `nonSuspiciousOnly`

نکته‌ها:

- `trending` بر اساس نصب‌ها در 7 روز گذشته رتبه‌بندی می‌کند (مبتنی بر telemetry).
- `createdAt` برای crawlهای skill جدید پایدار است؛ `updated` وقتی Skillsهای موجود دوباره منتشر می‌شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` است، sortهای مبتنی بر cursor ممکن است در یک صفحه کمتر از `limit` مورد برگردانند، چون Skillsهای مشکوک پس از دریافت صفحه filter می‌شوند.
- وقتی `nextCursor` وجود دارد از آن برای ادامه صفحه‌بندی استفاده کنید. یک صفحه کوتاه به‌خودی‌خود به‌معنی پایان نتایج نیست.

پاسخ:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
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

- slugهای قدیمی ایجادشده توسط flowهای تغییر نام/merge مالک به skill canonical resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter مهارت (مثلا `["macos"]`، `["linux"]`). اگر اعلام نشده باشد `null`.
- `metadata.systems`: هدف‌های system در Nix (مثلا `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد `null`.
- اگر skill هیچ metadata پلتفرمی نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط وقتی skill علامت‌گذاری شده باشد یا مالک در حال مشاهده آن باشد گنجانده می‌شود.

### `GET /api/v1/skills/{slug}/moderation`

وضعیت ساخت‌یافته moderation را برمی‌گرداند.

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
- فراخواننده‌های عمومی فقط برای Skillsهای قابل‌مشاهده‌ای که از قبل علامت‌گذاری شده‌اند `200` دریافت می‌کنند.
- Evidence برای فراخواننده‌های عمومی redacted می‌شود و فقط برای مالکان/moderatorها شامل snippetهای خام است.

### `POST /api/v1/skills/{slug}/report`

یک skill را برای بررسی moderator گزارش کنید. گزارش‌ها در سطح skill هستند، به‌صورت اختیاری به یک version پیوند می‌خورند،
و صف گزارش skill را تغذیه می‌کنند.

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

endpoint moderator/admin برای دریافت گزارش‌های skill.

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

endpoint moderator/admin برای حل‌کردن یا بازگشایی گزارش‌های skill.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام
برگرداندن `status` به `open` می‌توان آن را حذف کرد. برای پنهان‌کردن skill در همان workflow قابل audit، `finalAction: "hide"` را همراه با گزارش triageشده ارسال کنید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): cursor صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

metadata نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` شامل وضعیت verification اسکن نرمال‌شده و جزئیات scanner
  (VirusTotal + LLM)، در صورت وجود، است.

### `GET /api/v1/skills/{slug}/scan`

جزئیات verification اسکن امنیتی را برای یک نسخه skill برمی‌گرداند.

پارامترهای query:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): resolve کردن یک نسخه tagشده (برای مثال `latest`).

نکته‌ها:

- اگر نه `version` و نه `tag` ارائه شود، از آخرین نسخه استفاده می‌کند.
- شامل وضعیت verification نرمال‌شده به‌همراه جزئیات مخصوص scanner است.
- `security.capabilityTags` شامل برچسب‌های deterministic capability/risk مانند
  `crypto`، `requires-wallet`، `can-make-purchases`، `can-sign-transactions`،
  `requires-oauth-token` و `posts-externally` هنگام تشخیص است.
- `security.hasScanResult` فقط وقتی `true` است که یک scanner verdict قطعی تولید کرده باشد (`clean`، `suspicious`، یا `malicious`).
- `moderation` یک snapshot فعلی از moderation سطح skill است که از آخرین نسخه مشتق شده است.
- هنگام query کردن یک نسخه تاریخی، پیش از یکی‌دانستن context نسخه `moderation` و `security`، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

### `GET /api/v1/skills/{slug}/file`

محتوای متن خام را برمی‌گرداند.

پارامترهای query:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض آخرین نسخه است.
- محدودیت اندازه فایل: 200KB.

### `GET /api/v1/packages`

endpoint کاتالوگ یکپارچه برای:

- Skills
- Pluginهای کد
- Pluginهای bundle

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `executesCode` (اختیاری): `true` یا `false`
- `capabilityTag` (اختیاری): فیلتر قابلیت برای بسته‌های Plugin
- `target` / `hostTarget` (اختیاری): کوتاه‌نویسی برای `host:<target>`
- `os`، `arch`، `libc` (اختیاری): کوتاه‌نویسی برای فیلترهای قابلیت میزبان
- `requiresBrowser`، `requiresDesktop`، `requiresNativeDeps`،
  `requiresExternalService`، `requiresBinary`، `requiresOsPermission`
  (اختیاری): کوتاه‌نویسی `true`/`1` برای برچسب‌های نیازمندی محیط
- `externalService`، `binary`، `osPermission` (اختیاری): کوتاه‌نویسی برای برچسب‌های
  نام‌دار نیازمندی محیط
- `artifactKind` (اختیاری): `legacy-zip` یا `npm-pack`
- `npmMirror` (اختیاری): `true`/`1` برای نمایش نسخه‌های بسته پشتیبانی‌شده با ClawPack
  که از طریق آینه npm در دسترس‌اند

نکات:

- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` به‌عنوان نام‌های مستعار خانواده ثابت باقی می‌مانند.
- ورودی‌های Skills همچنان با رجیستری Skills پشتیبانی می‌شوند و هنوز فقط از طریق `POST /api/v1/skills` قابل انتشار هستند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخواننده‌های ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند در نتایج فهرست/جستجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/packages/search`

جستجوی کاتالوگ یکپارچه در Skills + بسته‌های Plugin.

پارامترهای پرس‌وجو:

- `q` (الزامی): رشته پرس‌وجو
- `limit` (اختیاری): عدد صحیح (1–100)
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `executesCode` (اختیاری): `true` یا `false`
- `capabilityTag` (اختیاری): فیلتر قابلیت برای بسته‌های Plugin
- `target` / `hostTarget`، `os`، `arch`، `libc`، `requiresBrowser`،
  `requiresDesktop`، `requiresNativeDeps`، `requiresExternalService`،
  `requiresBinary`، `requiresOsPermission`، `externalService`، `binary`، و
  `osPermission` به‌عنوان کوتاه‌نویسی برای برچسب‌های قابلیت رایج پذیرفته می‌شوند
- `artifactKind` (اختیاری): `legacy-zip` یا `npm-pack`
- `npmMirror` (اختیاری): `true`/`1` برای جستجوی نسخه‌های بسته پشتیبانی‌شده با ClawPack
  که از طریق آینه npm در دسترس‌اند

نکات:

- فراخواننده‌های ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جستجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده می‌تواند بخواند.
- فیلترهای آرتیفکت با برچسب‌های قابلیت ایندکس‌شده پشتیبانی می‌شوند:
  `artifact:legacy-zip`، `artifact:npm-pack`، و `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را برمی‌گرداند.

نکات:

- Skills نیز می‌توانند در کاتالوگ یکپارچه از طریق این مسیر resolve شوند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.

نکات:

- به توکن API برای مالک بسته، مالک/ادمین ناشر سازمانی،
  ناظر پلتفرم، یا ادمین پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

نکات:

- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را، شامل فراداده فایل، سازگاری،
قابلیت‌ها، راستی‌آزمایی، فراداده آرتیفکت، و داده‌های اسکن برمی‌گرداند.

نکات:

- `version.artifact.kind` برای آرشیوهای بسته قدیمی `legacy-zip` یا
  برای انتشارهای پشتیبانی‌شده با ClawPack مقدار `npm-pack` است.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum`، و
  `npmTarballName` هستند.
- وقتی داده اسکن وجود داشته باشد، `version.sha256hash`، `version.vtAnalysis`، `version.llmAnalysis`، و `version.staticScan` گنجانده می‌شوند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده resolver صریح آرتیفکت را برای یک نسخه بسته برمی‌گرداند.

نکات:

- نسخه‌های بسته legacy یک آرتیفکت `legacy-zip` و یک
  `downloadUrl` ZIP legacy برمی‌گردانند.
- نسخه‌های ClawPack یک آرتیفکت `npm-pack`، فیلدهای یکپارچگی npm، یک
  `tarballUrl`، و URL سازگاری ZIP legacy را برمی‌گردانند.
- این سطح resolver مربوط به OpenClaw است؛ از حدس‌زدن قالب آرشیو از
  یک URL مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

آرتیفکت نسخه را از طریق مسیر resolver صریح دانلود می‌کند.

نکات:

- نسخه‌های ClawPack دقیقاً بایت‌های `.tgz` بارگذاری‌شده npm-pack را stream می‌کنند.
- نسخه‌های ZIP legacy به `/api/v1/packages/{name}/download?version=` هدایت می‌شوند.
- از bucket نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آینده OpenClaw را برمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر است:

- وضعیت کانال رسمی
- در دسترس بودن آخرین نسخه
- در دسترس بودن آرتیفکت npm-pack ClawPack
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

نقطه پایانی ناظر برای فهرست‌کردن ردیف‌های مهاجرت Plugin رسمی OpenClaw.

احراز هویت:

- به توکن API برای کاربر ناظر یا ادمین نیاز دارد.

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

نکات:

- `bundledPluginId` به حروف کوچک نرمال‌سازی می‌شود و کلید upsert پایدار است.
- `packageName` به نام npm نرمال‌سازی می‌شود؛ بسته می‌تواند برای مهاجرت‌های برنامه‌ریزی‌شده
  وجود نداشته باشد.
- این فقط آمادگی مهاجرت را ردیابی می‌کند. OpenClaw را تغییر نمی‌دهد و
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

نقطه پایانی ناظر/ادمین برای صف‌های بازبینی انتشار بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا ادمین نیاز دارد.

پارامترهای پرس‌وجو:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

معنی وضعیت‌ها:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، لغوشده، یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، لغوشده، یا مخرب.
- `manual`: هر انتشار با override دستی نظارت.
- `all`: هر انتشار با override دستی، وضعیت اسکن غیر clean، یا گزارش بسته.

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
به یک نسخه پیوند می‌خورند. آن‌ها صف نظارت را تغذیه می‌کنند، اما به‌خودی‌خود دانلودها را
به‌صورت خودکار مخفی یا مسدود نمی‌کنند؛ ناظران باید برای
تأیید، قرنطینه، یا لغو آرتیفکت‌ها از نظارت انتشار استفاده کنند.

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

نقطه پایانی ناظر/ادمین برای دریافت گزارش‌های بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا ادمین نیاز دارد.

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

- به توکن API برای مالک بسته، عضو ناشر، ناظر، یا
  کاربر ادمین نیاز دارد.

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

نقطه پایانی ناظر/ادمین برای حل‌وفصل یا بازگشایی گزارش‌های بسته.

درخواست:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام برگرداندن `status` به `open` می‌توان آن را حذف کرد. برای اعمال نظارت انتشار در همان گردش‌کار قابل حسابرسی، همراه با یک گزارش تأییدشده `finalAction: "quarantine"` یا `finalAction: "revoke"` را ارسال کنید.

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

نقطه پایانی مدیر/ناظر برای بازبینی انتشار بسته.

درخواست:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

وضعیت‌های پشتیبانی‌شده:

- `approved`: به‌صورت دستی بازبینی و مجاز شده است.
- `quarantined`: تا زمان پیگیری مسدود شده است.
- `revoked`: پس از آنکه یک انتشار قبلاً مورد اعتماد بوده، مسدود شده است.

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود آرتیفکت `403` برمی‌گردانند.
هر تغییر، یک ورودی در لاگ حسابرسی می‌نویسد.

### `POST /api/v1/packages/backfill/artifacts`

نقطه پایانی نگه‌داری فقط ویژه ادمین برای برچسب‌گذاری انتشارهای قدیمی‌تر بسته با
فراداده صریح نوع آرتیفکت.

بدنه درخواست:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

پاسخ:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

نکات:

- به‌صورت پیش‌فرض dry-run است.
- انتشارهای بدون ذخیره‌سازی ClawPack با `legacy-zip` برچسب‌گذاری می‌شوند.
- ردیف‌های موجود مبتنی بر ClawPack که `artifactKind` ندارند، به‌عنوان
  `npm-pack` ترمیم می‌شوند.
- این کار ClawPack تولید نمی‌کند و بایت‌های آرتیفکت را تغییر نمی‌دهد.

### `GET /api/v1/packages/{name}/file`

محتوای متن خام را برای یک فایل بسته برمی‌گرداند.

پارامترهای کوئری:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌صورت پیش‌فرض آخرین انتشار را استفاده می‌کند.
- از باکت نرخ خواندن استفاده می‌کند، نه باکت دانلود.
- فایل‌های باینری `415` برمی‌گردانند.
- سقف اندازه فایل: 200KB.
- اسکن‌های در انتظار VirusTotal جلوی خواندن را نمی‌گیرند؛ انتشارهای مخرب ممکن است همچنان در جای دیگری نگه داشته شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای یک انتشار بسته دانلود می‌کند.

پارامترهای کوئری:

- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌صورت پیش‌فرض آخرین انتشار را استفاده می‌کند.
- Skills به `GET /api/v1/download` ریدایرکت می‌شوند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشه `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP باقی می‌ماند. فایل‌های ClawPack با پسوند `.tgz` را استریم نمی‌کند.
- پاسخ‌ها برای بررسی‌های یکپارچگی resolver شامل سرآیندهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` هستند.
- فراداده فقط رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal جلوی دانلود را نمی‌گیرند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

برای نسخه‌های بسته مبتنی بر ClawPack یک packument سازگار با npm برمی‌گرداند.

نکات:

- فقط نسخه‌هایی فهرست می‌شوند که تاربال‌های npm-pack مربوط به ClawPack آپلودشده دارند.
- نسخه‌های قدیمی فقط ZIP عمداً حذف می‌شوند.
- `dist.tarball`، `dist.integrity`، و `dist.shasum` از فیلدهای سازگار با npm استفاده می‌کنند
  تا کاربران در صورت تمایل بتوانند npm را به آینه اشاره دهند.
- packumentهای بسته scoped هم از `/api/npm/@scope/name` و هم از مسیر درخواست
  کدگذاری‌شده npm یعنی `/api/npm/@scope%2Fname` پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق تاربال ClawPack آپلودشده را برای کلاینت‌های آینه npm استریم می‌کند.

نکات:

- از باکت نرخ دانلود استفاده می‌کند.
- سرآیندهای دانلود شامل SHA-256 مربوط به ClawHub به‌علاوه فراداده integrity/shasum مربوط به npm هستند.
- بررسی‌های نظارت و دسترسی بسته خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

CLI از آن برای نگاشت یک اثرانگشت محلی به یک نسخه شناخته‌شده استفاده می‌کند.

پارامترهای کوئری:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز 64 کاراکتری اثرانگشت باندل

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک zip از نسخه یک skill دانلود می‌کند.

پارامترهای کوئری:

- `slug` (الزامی)
- `version` (اختیاری): رشته semver
- `tag` (اختیاری): نام تگ (مثلاً `latest`)

نکات:

- اگر نه `version` و نه `tag` ارائه شود، آخرین نسخه استفاده می‌شود.
- نسخه‌های soft-delete شده `410` برمی‌گردانند.
- آمار دانلود به‌صورت هویت‌های یکتا در هر ساعت شمارش می‌شود (`userId` وقتی توکن API معتبر باشد، وگرنه IP).

## نقاط پایانی Auth (توکن Bearer)

همه نقاط پایانی نیاز دارند به:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

توکن را اعتبارسنجی می‌کند و handle کاربر را برمی‌گرداند.

### `POST /api/v1/skills`

نسخه جدیدی منتشر می‌کند.

- ترجیحی: `multipart/form-data` با JSON در `payload` + blobهای `files[]`.
- بدنه JSON با `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. وقتی حاضر باشد، API آن
  ناشر را در سمت سرور resolve می‌کند و نیاز دارد عامل دسترسی ناشر داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` برابر `true` باشد، یک
  skill موجود می‌تواند به آن مالک منتقل شود اگر عامل روی ناشران فعلی و مقصد ادمین/مالک باشد.
  بدون این انتخاب صریح، تغییرات مالک رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت توکن Bearer نیاز دارد.
- ترجیحی: `multipart/form-data` با JSON در `payload` + blobهای `files[]`.
- بدنه JSON با `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. وقتی حاضر باشد، فقط ادمین‌ها می‌توانند از طرف آن مالک منتشر کنند.

نکات برجسته اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. آپلودهای ClawPack با پسوند `.tgz` باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- code plugins به `package.json`، فراداده repo منبع، فراداده commit منبع،
  فراداده schema پیکربندی، `openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
- فقط ناشران مورد اعتماد می‌توانند در کانال `official` منتشر کنند.
- انتشارهای از طرف دیگری همچنان صلاحیت کانال official را در برابر حساب مالک مقصد اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

یک skill را soft-delete / بازیابی می‌کند (مالک، ناظر، یا ادمین).

بدنه JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

وقتی حاضر باشد، `reason` به‌عنوان یادداشت نظارت skill ذخیره و در لاگ حسابرسی کپی می‌شود.
soft deleteهای آغازشده توسط مالک، slug را برای 30 روز رزرو می‌کنند، سپس slug می‌تواند توسط
ناشر دیگری ادعا شود. پاسخ حذف وقتی این انقضا اعمال شود شامل `slugReservedUntil` است.
مخفی‌سازی‌های ناظر/ادمین و حذف‌های امنیتی به این شکل منقضی نمی‌شوند.

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

فقط ویژه ادمین. تضمین می‌کند یک ناشر سازمانی برای یک handle وجود دارد. اگر handle همچنان به یک
ناشر اشتراکی قدیمی کاربر/شخصی اشاره کند، نقطه پایانی ابتدا آن را به یک ناشر سازمانی مهاجرت می‌دهد.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

فقط ویژه ادمین. slugهای ریشه و نام‌های بسته را برای مالک rightful بدون انتشار
release رزرو می‌کند. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف release تبدیل می‌شوند، بنابراین همان
مالک بعداً می‌تواند انتشار واقعی code-plugin یا bundle-plugin را در آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### نقاط پایانی مدیریت slug مالک

- `POST /api/v1/skills/{slug}/rename`
  - بدنه: `{ "newSlug": "new-canonical-slug" }`
  - پاسخ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - بدنه: `{ "targetSlug": "canonical-target-slug" }`
  - پاسخ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

نکات:

- هر دو نقطه پایانی به احراز هویت توکن API نیاز دارند و فقط برای مالک skill کار می‌کنند.
- `rename` slug قبلی را به‌عنوان نام مستعار ریدایرکت حفظ می‌کند.
- `merge` فهرست منبع را مخفی می‌کند و slug منبع را به فهرست مقصد ریدایرکت می‌کند.

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

یک کاربر را ban می‌کند و skillهای مالکیت‌شده را hard-delete می‌کند (فقط ناظر/ادمین).

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

یک کاربر را unban می‌کند و skillهای واجد شرایط را بازیابی می‌کند (فقط ادمین).

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

### `POST /api/v1/users/role`

نقش یک کاربر را تغییر می‌دهد (فقط ادمین).

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

کاربران را فهرست یا جست‌وجو می‌کند (فقط ادمین).

پارامترهای کوئری:

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

یک ستاره (highlight) اضافه/حذف می‌کند. هر دو نقطه پایانی idempotent هستند.

پاسخ‌ها:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقاط پایانی CLI قدیمی (منسوخ)

برای نسخه‌های قدیمی‌تر CLI همچنان پشتیبانی می‌شوند:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

برای برنامه حذف، `DEPRECATIONS.md` را ببینید.

## کشف رجیستری (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات رجیستری/احراز هویت را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر self-host می‌کنید، این فایل را serve کنید (یا `CLAWHUB_REGISTRY` را صریحاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی است).
