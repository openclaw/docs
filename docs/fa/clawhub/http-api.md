---
read_when:
    - افزودن/تغییر نقاط پایانی
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API HTTP (نقاط پایانی عمومی + نقاط پایانی CLI + احراز هویت).
x-i18n:
    generated_at: "2026-05-10T19:27:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# API ‏HTTP

URL پایه: `https://clawhub.ai` (پیش‌فرض).

همهٔ مسیرهای v1 زیر `/api/v1/...` هستند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی مانده‌اند (به `DEPRECATIONS.md` مراجعه کنید).
OpenAPI: `/api/v1/openapi.json`.

## استفادهٔ مجدد از کاتالوگ عمومی

دایرکتوری‌های شخص ثالث می‌توانند از endpointهای خواندن عمومی برای فهرست‌کردن یا جست‌وجوی Skills در ClawHub استفاده کنند. لطفاً نتایج را cache کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست canonical ClawHub (`https://clawhub.ai/<owner>/<slug>`) برگردانید، و از القای تأیید سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای مخفی، خصوصی، یا مسدودشده توسط moderation را خارج از سطح API عمومی mirror کنید.

میان‌برهای slug وب در سراسر خانواده‌های registry resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی تقدم route، از URLهای canonical برگشتی از endpointهای خواندن استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (توکن Bearer معتبر): به‌ازای bucket کاربر اعمال می‌شود.
- اگر توکن موجود نباشد/نامعتبر باشد، رفتار به اعمال بر اساس IP برمی‌گردد.
- endpointهای نوشتن احراز هویت‌شده وقتی سرور دلیل را می‌داند نباید یک `Unauthorized` خالی برگردانند. توکن‌های غایب، توکن‌های نامعتبر/لغوشده، و حساب‌های حذف‌شده/مسدودشده/غیرفعال‌شده باید هرکدام متن قابل‌اقدام دریافت کنند تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی آن‌ها را مسدود کرده است.

- خواندن: 600/min به‌ازای هر IP، ‏2400/min به‌ازای هر کلید
- نوشتن: 45/min به‌ازای هر IP، ‏180/min به‌ازای هر کلید
- دانلود: 30/min به‌ازای هر IP، ‏180/min به‌ازای هر کلید (`/api/v1/download`)

Headerها:

- سازگاری قدیمی: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- روی `429`: `Retry-After`

معنای Headerها:

- `X-RateLimit-Reset`: ثانیه‌های مطلق epoch یونیکس
- `RateLimit-Reset`: ثانیه تا reset (delay)
- `Retry-After`: ثانیه‌هایی که باید پیش از retry صبر شود (delay) روی `429`

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
- برای جلوگیری از retryهای هم‌زمان، از backoff همراه با jitter استفاده کنید.
- اگر `Retry-After` وجود ندارد، به `RateLimit-Reset` برگردید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- به‌طور پیش‌فرض از `cf-connecting-ip` (Cloudflare) برای IP کلاینت استفاده می‌کند.
- ClawHub از headerهای forwarding مورد اعتماد برای شناسایی IPهای کلاینت در edge استفاده می‌کند.
- اگر IP مورد اعتماد کلاینت در دسترس نباشد، درخواست‌های دانلود ناشناس به‌جای یک bucket سراسری `ip:unknown` از bucket جایگزین scoped به endpoint استفاده می‌کنند. درخواست‌های خواندن/نوشتن ناشناس همچنان از bucket ناشناس مشترک استفاده می‌کنند تا routing بدون IP همچنان قابل مشاهده و محافظه‌کارانه بماند.

## endpointهای عمومی (بدون auth)

### `GET /api/v1/search`

پارامترهای query:

- `q` (الزامی): رشتهٔ query
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): `true` برای فیلترکردن به Skills برجسته
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
      "updatedAt": 1730000000000
    }
  ]
}
```

یادداشت‌ها:

- نتایج به‌ترتیب مرتبط‌بودن برگردانده می‌شوند (شباهت embedding + تقویت‌های دقیق token برای slug/name + prior محبوبیت از دانلودها).
- مرتبط‌بودن از محبوبیت قوی‌تر است. تطابق دقیق token در slug یا display-name می‌تواند از تطابق آزادتر با دانلودهای بسیار بیشتر بالاتر رتبه بگیرد.
- متن ASCII روی مرزهای کلمه و نشانه‌گذاری tokenized می‌شود. برای مثال، `personal-map` شامل token مستقل `map` است، درحالی‌که `amap-jsapi-skill` شامل `amap`، `jsapi` و `skill` است؛ بنابراین جست‌وجوی `map` به `personal-map` تطابق واژگانی قوی‌تری نسبت به `amap-jsapi-skill` می‌دهد.
- دانلودها به‌عنوان prior کوچک log-scaled و tie-breaker استفاده می‌شوند، نه سیگنال اصلی رتبه‌بندی. Skills با دانلود زیاد وقتی متن query تطابق ضعیف‌تری دارد می‌توانند رتبهٔ پایین‌تری بگیرند.
- وضعیت moderation مشکوک یا مخفی می‌تواند بسته به فیلترهای caller و وضعیت فعلی moderation یک Skill را از جست‌وجوی عمومی حذف کند.

راهنمای discoverability برای ناشر:

- اصطلاحاتی را که کاربران واقعاً جست‌وجو خواهند کرد در display name، summary و tags بگذارید. فقط وقتی از token مستقل در slug استفاده کنید که همان هم هویت پایداری است که می‌خواهید نگه دارید.
- فقط برای دنبال‌کردن یک query، slug را تغییر نام ندهید مگر اینکه slug جدید نام canonical بلندمدت بهتری باشد. slugهای قدیمی به aliasهای redirect تبدیل می‌شوند، اما URL ‏canonical، slug نمایش‌داده‌شده، و digestهای جست‌وجوی آینده از slug جدید استفاده می‌کنند.
- aliasهای تغییر نام resolution را برای URLهای قدیمی و نصب‌هایی که از طریق registry resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو پس از index شدن تغییر نام بر اساس metadata canonical Skill است. آمار موجود با Skill باقی می‌ماند.
- اگر یک Skill به‌طور غیرمنتظره نامرئی است، پیش از تغییر metadata مرتبط با رتبه‌بندی، ابتدا در حالت logged in وضعیت moderation را با `clawhub inspect <slug>` بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): cursor صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `createdAt` (نام مستعار: `newest`)، `downloads`، `stars` (نام مستعار: `rating`)، `installsCurrent` (نام مستعار: `installs`)، `installsAllTime`، `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن Skills مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): نام مستعار قدیمی برای `nonSuspiciousOnly`

یادداشت‌ها:

- `trending` بر اساس نصب‌ها در 7 روز گذشته رتبه‌بندی می‌کند (مبتنی بر telemetry).
- `createdAt` برای crawlهای Skill جدید پایدار است؛ `updated` وقتی Skills موجود دوباره publish شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` است، sortهای مبتنی بر cursor ممکن است در یک صفحه کمتر از `limit` آیتم برگردانند، چون Skills مشکوک پس از بازیابی صفحه فیلتر می‌شوند.
- وقتی `nextCursor` وجود دارد، برای ادامهٔ صفحه‌بندی از آن استفاده کنید. یک صفحهٔ کوتاه به‌تنهایی به معنی پایان نتایج نیست.

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

یادداشت‌ها:

- slugهای قدیمی ایجادشده توسط جریان‌های تغییر نام/merge مالک به Skill canonical resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter ‏Skill (مثلاً `["macos"]`، `["linux"]`). اگر اعلام نشده باشد، `null`.
- `metadata.systems`: هدف‌های Nix system (مثلاً `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد، `null`.
- اگر Skill هیچ metadata پلتفرمی نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط وقتی شامل می‌شود که Skill flag شده باشد یا مالک در حال مشاهدهٔ آن باشد.

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

- مالکان و moderators می‌توانند به جزئیات moderation برای Skills مخفی دسترسی داشته باشند.
- callerهای عمومی فقط برای Skills قابل مشاهده‌ای که از قبل flag شده‌اند `200` دریافت می‌کنند.
- evidence برای callerهای عمومی redacted می‌شود و فقط برای مالکان/moderators شامل snippetهای raw است.

### `POST /api/v1/skills/{slug}/report`

گزارش یک Skill برای بررسی moderator. گزارش‌ها در سطح Skill هستند، به‌صورت اختیاری به یک نسخه پیوند می‌خورند، و صف گزارش Skill را تغذیه می‌کنند.

Auth:

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

### `POST /api/v1/skills/{slug}/appeal`

endpoint مالک/ناشر Skill برای appeal کردن moderation روی یک Skill.

Auth:

- به یک توکن API برای مالک Skill یا عضو ناشر نیاز دارد.

درخواست:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

Appealها برای outcomeهای Skill که hidden، removed، suspicious، malicious یا scanner-flagged هستند پذیرفته می‌شوند. ClawHub برای هر Skill یک appeal باز نگه می‌دارد.

پاسخ:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "skillAppeals:...",
  "skillId": "skills:...",
  "status": "open"
}
```

### `POST /api/v1/skills/{slug}/rescan`

درخواست rescan امنیتی برای آخرین نسخهٔ منتشرشدهٔ Skill.

Auth:

- به یک توکن API برای مالک Skill، admin ناشر، moderator پلتفرم، یا admin پلتفرم نیاز دارد.
- مالکان و adminهای ناشر مشمول محدودیت recovery مالک به‌ازای هر نسخه هستند. moderators و admins پلتفرم مشمول آن نیستند، اما ClawHub همچنان برای هر نسخه فقط یک rescan فعال اجازه می‌دهد.

پاسخ:

```json
{
  "ok": true,
  "targetKind": "skill",
  "name": "gifgrep",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/skills/-/reports`

endpoint مربوط به moderator/admin برای دریافت گزارش‌های Skill.

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

endpoint مربوط به moderator/admin برای resolve یا reopen کردن گزارش‌های Skill.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ وقتی `status` دوباره به `open` تنظیم می‌شود می‌توان آن را حذف کرد. برای پنهان‌کردن Skill در همان workflow قابل audit، همراه با یک گزارش triaged مقدار `finalAction: "hide"` را بفرستید.

### `GET /api/v1/skills/-/appeals`

endpoint مربوط به moderator/admin برای دریافت appealهای Skill.

پارامترهای query:

- `status` (اختیاری): `open` (پیش‌فرض)، `accepted`، `rejected`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-200)
- `cursor` (اختیاری): cursor صفحه‌بندی

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

endpoint مربوط به moderator/admin برای accept، reject، یا reopen کردن appeal یک Skill.
`note` برای `accepted` و `rejected` الزامی است؛ وقتی `status` دوباره به `open` تنظیم می‌شود می‌توان آن را حذف کرد. برای در دسترس‌کردن دوبارهٔ Skill، همراه با یک appeal پذیرفته‌شده مقدار `finalAction: "restore"` را بفرستید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): نشانگر صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

فراداده نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` در صورت موجود بودن، وضعیت تأیید اسکن نرمال‌سازی‌شده و جزئیات اسکنر
  (VirusTotal + LLM) را شامل می‌شود.

### `GET /api/v1/skills/{slug}/scan`

جزئیات تأیید اسکن امنیتی برای یک نسخه Skills را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): حل یک نسخه برچسب‌گذاری‌شده (برای مثال `latest`).

یادداشت‌ها:

- اگر نه `version` و نه `tag` ارائه نشده باشد، از آخرین نسخه استفاده می‌کند.
- وضعیت تأیید نرمال‌سازی‌شده به‌علاوه جزئیات مخصوص اسکنر را شامل می‌شود.
- `security.capabilityTags` برچسب‌های قطعی قابلیت/ریسک مانند
  `crypto`، `requires-wallet`، `can-make-purchases`، `can-sign-transactions`،
  `requires-oauth-token`، و `posts-externally` را هنگام شناسایی شامل می‌شود.
- `security.hasScanResult` فقط زمانی `true` است که یک اسکنر رأی قطعی (`clean`، `suspicious`، یا `malicious`) تولید کرده باشد.
- `moderation` یک نمای فوری فعلی از تعدیل در سطح Skills است که از آخرین نسخه مشتق شده است.
- هنگام پرس‌وجوی یک نسخه تاریخی، پیش از در نظر گرفتن `moderation` و `security` به‌عنوان زمینه نسخه یکسان، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

### `GET /api/v1/skills/{slug}/file`

محتوای متنی خام را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

یادداشت‌ها:

- به‌صورت پیش‌فرض از آخرین نسخه استفاده می‌کند.
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
- `executesCode` (اختیاری): `true` یا `false`
- `capabilityTag` (اختیاری): فیلتر قابلیت برای بسته‌های Plugin
- `target` / `hostTarget` (اختیاری): کوتاه‌نویسی برای `host:<target>`
- `os`، `arch`، `libc` (اختیاری): کوتاه‌نویسی برای فیلترهای قابلیت میزبان
- `requiresBrowser`، `requiresDesktop`، `requiresNativeDeps`،
  `requiresExternalService`، `requiresBinary`، `requiresOsPermission`
  (اختیاری): کوتاه‌نویسی `true`/`1` برای برچسب‌های نیازمندی محیط
- `externalService`، `binary`، `osPermission` (اختیاری): کوتاه‌نویسی برای برچسب‌های نام‌دار
  نیازمندی محیط
- `artifactKind` (اختیاری): `legacy-zip` یا `npm-pack`
- `npmMirror` (اختیاری): `true`/`1` برای نمایش نسخه‌های بسته متکی به ClawPack
  که از طریق آینه npm در دسترس‌اند

یادداشت‌ها:

- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار با خانواده ثابت باقی می‌مانند.
- ورودی‌های Skills همچنان بر رجیستری Skills متکی می‌مانند و هنوز فقط از طریق `POST /api/v1/skills` قابل انتشار هستند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخوان‌های ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخوان‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند در نتایج فهرست/جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/packages/search`

جست‌وجوی کاتالوگ یکپارچه در Skills + بسته‌های Plugin.

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
- `npmMirror` (اختیاری): `true`/`1` برای جست‌وجوی نسخه‌های بسته متکی به ClawPack
  که از طریق آینه npm در دسترس‌اند

یادداشت‌ها:

- فراخوان‌های ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخوان‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احراز هویت‌شده می‌تواند بخواند.
- فیلترهای artifact بر برچسب‌های قابلیت ایندکس‌شده متکی‌اند:
  `artifact:legacy-zip`، `artifact:npm-pack`، و `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را برمی‌گرداند.

یادداشت‌ها:

- Skills نیز می‌تواند از طریق این مسیر در کاتالوگ یکپارچه حل شود.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخوان بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.

یادداشت‌ها:

- به یک توکن API برای مالک بسته، مالک/مدیر ناشر سازمانی،
  ناظر پلتفرم، یا مدیر پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

یادداشت‌ها:

- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخوان بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را شامل فراداده فایل، سازگاری،
قابلیت‌ها، تأیید، فراداده artifact و داده اسکن برمی‌گرداند.

یادداشت‌ها:

- `version.artifact.kind` برای آرشیوهای بسته قدیمی `legacy-zip` یا
  برای انتشارهای متکی به ClawPack مقدار `npm-pack` است.
- انتشارهای ClawPack فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum`، و
  `npmTarballName` را شامل می‌شوند.
- `version.sha256hash`، `version.vtAnalysis`، `version.llmAnalysis`، و `version.staticScan` هنگام وجود داده اسکن گنجانده می‌شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخوان بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده صریح حل‌کننده artifact را برای یک نسخه بسته برمی‌گرداند.

یادداشت‌ها:

- نسخه‌های بسته Legacy یک artifact از نوع `legacy-zip` و یک
  `downloadUrl` مربوط به ZIP قدیمی برمی‌گردانند.
- نسخه‌های ClawPack یک artifact از نوع `npm-pack`، فیلدهای یکپارچگی npm، یک
  `tarballUrl`، و URL سازگاری ZIP قدیمی را برمی‌گردانند.
- این سطح حل‌کننده OpenClaw است؛ از حدس زدن قالب آرشیو از
  یک URL مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

artifact نسخه را از طریق مسیر حل‌کننده صریح دانلود می‌کند.

یادداشت‌ها:

- نسخه‌های ClawPack همان بایت‌های `.tgz` بارگذاری‌شده npm-pack را استریم می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` تغییر مسیر می‌دهند.
- از سطل نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آینده OpenClaw را برمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر است:

- وضعیت کانال رسمی
- در دسترس بودن آخرین نسخه
- در دسترس بودن artifact از نوع npm-pack مربوط به ClawPack
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

- به یک توکن API برای کاربر ناظر یا مدیر نیاز دارد.

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

- به یک توکن API برای کاربر مدیر نیاز دارد.

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

- `bundledPluginId` به حروف کوچک نرمال‌سازی می‌شود و کلید پایدار upsert است.
- `packageName` به‌صورت نام npm نرمال‌سازی می‌شود؛ بسته می‌تواند برای مهاجرت‌های برنامه‌ریزی‌شده
  موجود نباشد.
- این فقط آمادگی مهاجرت را رهگیری می‌کند. OpenClaw را تغییر نمی‌دهد و
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

نقطه پایانی ناظر/مدیر برای صف‌های بررسی انتشار بسته.

احراز هویت:

- به یک توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای پرس‌وجو:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

معانی وضعیت:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، لغوشده، یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، لغوشده، یا مخرب.
- `manual`: هر انتشاری با یک بازنویسی دستی تعدیل.
- `all`: هر انتشاری با بازنویسی دستی، وضعیت اسکن غیر پاک، یا گزارش بسته.

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
به یک نسخه پیوند می‌خورند. آن‌ها صف تعدیل را تغذیه می‌کنند اما خودشان به‌صورت خودکار دانلودها را پنهان یا
مسدود نمی‌کنند؛ ناظران باید از تعدیل انتشار برای
تأیید، قرنطینه، یا لغو artifactها استفاده کنند.

احراز هویت:

- به یک توکن API نیاز دارد.

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

### `POST /api/v1/packages/{name}/appeal`

نقطه پایانی مالک/ناشر بسته برای اعتراض به تعدیل روی یک انتشار.

احراز هویت:

- به یک توکن API برای مالک بسته یا عضو ناشر نیاز دارد.

درخواست:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

اعتراض‌ها فقط برای انتشارهایی پذیرفته می‌شوند که قرنطینه‌شده، لغوشده،
مشکوک، یا مخرب باشند. ClawHub برای هر انتشار یک اعتراض باز نگه می‌دارد.

پاسخ:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "open"
}
```

### `POST /api/v1/packages/{name}/rescan`

درخواست اسکن امنیتی دوباره برای آخرین نسخهٔ منتشرشدهٔ بسته را ثبت می‌کند.

احراز هویت:

- به توکن API برای مالک بسته، مدیر ناشر، ناظر پلتفرم، یا مدیر پلتفرم نیاز دارد.
- مالکان و مدیران ناشر مشمول محدودیت بازیابی مالک برای هر انتشار هستند. ناظران و مدیران پلتفرم مشمول آن نیستند، اما ClawHub همچنان فقط یک اسکن دوبارهٔ فعال برای هر انتشار را مجاز می‌داند.

پاسخ:

```json
{
  "ok": true,
  "targetKind": "package",
  "name": "@openclaw/example-plugin",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/packages/appeals`

نقطهٔ پایانی ناظر/مدیر برای دریافت اعتراض‌های بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا مدیر نیاز دارد.

پارامترهای پرس‌وجو:

- `status` (اختیاری): `open` (پیش‌فرض)، `accepted`، `rejected`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

پاسخ:

```json
{
  "items": [
    {
      "appealId": "packageAppeals:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "message": "The native binary is signed.",
      "status": "open",
      "createdAt": 1730000000000,
      "submitter": {
        "userId": "users:...",
        "handle": "publisher",
        "displayName": "Publisher"
      },
      "resolvedAt": null,
      "resolvedBy": null,
      "resolutionNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/appeals/{appealId}/resolve`

نقطهٔ پایانی ناظر/مدیر برای پذیرش، رد، یا بازگشایی یک اعتراض.

درخواست:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`note` برای `accepted` و `rejected` الزامی است؛ هنگام برگرداندن `status` به `open` می‌توان آن را حذف کرد. برای تأیید انتشار متأثر در همان گردش‌کار قابل حسابرسی، همراه با یک اعتراض پذیرفته‌شده `finalAction: "approve"` را ارسال کنید.

پاسخ:

```json
{
  "ok": true,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "rejected"
}
```

### `GET /api/v1/packages/reports`

نقطهٔ پایانی ناظر/مدیر برای دریافت گزارش‌های بسته.

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

نقطهٔ پایانی ناظر/مدیر برای حل‌وفصل یا بازگشایی گزارش‌های بسته.

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

نقطهٔ پایانی ناظر/مدیر برای بازبینی انتشار بسته.

درخواست:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

وضعیت‌های پشتیبانی‌شده:

- `approved`: به‌صورت دستی بازبینی و مجاز شده است.
- `quarantined`: تا زمان پیگیری مسدود شده است.
- `revoked`: پس از آن‌که انتشار قبلاً مورد اعتماد بوده، مسدود شده است.

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود آرتیفکت `403` برمی‌گردانند. هر تغییر یک ورودی گزارش حسابرسی ثبت می‌کند.

### `POST /api/v1/packages/backfill/artifacts`

نقطهٔ پایانی نگهداشت ویژهٔ مدیر برای برچسب‌گذاری انتشارهای قدیمی‌تر بسته با فرادادهٔ صریح نوع آرتیفکت.

بدنهٔ درخواست:

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

نکته‌ها:

- پیش‌فرض اجرای آزمایشی است.
- انتشارهای بدون فضای ذخیره‌سازی ClawPack با `legacy-zip` برچسب‌گذاری می‌شوند.
- ردیف‌های موجود مبتنی بر ClawPack که `artifactKind` ندارند، به‌صورت `npm-pack` ترمیم می‌شوند.
- این کار ClawPack تولید نمی‌کند و بایت‌های آرتیفکت را تغییر نمی‌دهد.

### `GET /api/v1/packages/{name}/file`

محتوای متنی خام یک فایل بسته را برمی‌گرداند.

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
- بسته‌های خصوصی `404` برمی‌گردانند، مگر این‌که فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای یک انتشار بسته دانلود می‌کند.

پارامترهای پرس‌وجو:

- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض، آخرین انتشار است.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشهٔ `package/` هستند تا کلاینت‌های قدیمی OpenClaw همچنان کار کنند.
- این مسیر فقط ZIP می‌ماند. فایل‌های `.tgz` مربوط به ClawPack را استریم نمی‌کند.
- پاسخ‌ها برای بررسی‌های یکپارچگی resolver شامل سرآیندهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type` و `X-ClawHub-Artifact-Sha256` هستند.
- فرادادهٔ فقط رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر این‌که فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک packument سازگار با npm برای نسخه‌های بستهٔ مبتنی بر ClawPack برمی‌گرداند.

نکته‌ها:

- فقط نسخه‌هایی که tarballهای npm-pack مربوط به ClawPack بارگذاری‌شده دارند فهرست می‌شوند.
- نسخه‌های قدیمی فقط-ZIP عمداً حذف می‌شوند.
- `dist.tarball`، `dist.integrity` و `dist.shasum` از فیلدهای سازگار با npm استفاده می‌کنند تا کاربران در صورت انتخاب بتوانند npm را به mirror اشاره دهند.
- packumentهای بستهٔ scoped هم از مسیر درخواست `/api/npm/@scope/name` و هم از مسیر کدگذاری‌شدهٔ npm یعنی `/api/npm/@scope%2Fname` پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball بارگذاری‌شدهٔ ClawPack را برای کلاینت‌های mirror npm استریم می‌کند.

نکته‌ها:

- از سطل نرخ دانلود استفاده می‌کند.
- سرآیندهای دانلود شامل SHA-256 مربوط به ClawHub به‌همراه فرادادهٔ integrity/shasum مربوط به npm هستند.
- بررسی‌های نظارت و دسترسی بستهٔ خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

توسط CLI برای نگاشت اثرانگشت محلی به یک نسخهٔ شناخته‌شده استفاده می‌شود.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز ۶۴ کاراکتری اثرانگشت بسته

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک zip از نسخهٔ یک skill را دانلود می‌کند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `version` (اختیاری): رشتهٔ semver
- `tag` (اختیاری): نام برچسب (برای مثال `latest`)

نکته‌ها:

- اگر نه `version` و نه `tag` ارائه شود، آخرین نسخه استفاده می‌شود.
- نسخه‌های نرم‌حذف‌شده `410` برمی‌گردانند.
- آمار دانلود به‌صورت هویت‌های یکتا در هر ساعت شمرده می‌شود (`userId` وقتی توکن API معتبر است، در غیر این صورت IP).

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
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، API آن ناشر را در سمت سرور resolve می‌کند و نیاز دارد actor به ناشر دسترسی داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی با `ownerHandle` مقدار `true` داشته باشد، اگر actor روی هر دو ناشر فعلی و مقصد مدیر/مالک باشد، یک skill موجود می‌تواند به آن مالک منتقل شود. بدون این پذیرش صریح، تغییرات مالک رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت با توکن Bearer نیاز دارد.
- ترجیحی: `multipart/form-data` با JSON در `payload` + blobهای `files[]`.
- بدنهٔ JSON با `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، فقط مدیران می‌توانند از طرف آن مالک منتشر کنند.

نکات برجستهٔ اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های `.tgz` مربوط به ClawPack باید آن را در `package/openclaw.plugin.json` داشته باشند.
- code pluginها به `package.json`، فرادادهٔ مخزن منبع، فرادادهٔ commit منبع، فرادادهٔ شِمای پیکربندی، `openclaw.compat.pluginApi` و `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فرادادهٔ اختیاری هستند.
- فقط ناشران مورد اعتماد می‌توانند در کانال `official` منتشر کنند.
- انتشارهای از طرف دیگران همچنان صلاحیت کانال رسمی را نسبت به حساب مالک مقصد اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

یک skill را نرم‌حذف / بازیابی می‌کند (مالک، ناظر، یا مدیر).

بدنهٔ JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

وقتی وجود داشته باشد، `reason` به‌عنوان یادداشت نظارت skill ذخیره می‌شود و در گزارش حسابرسی کپی می‌شود.
نرم‌حذف‌های آغازشده توسط مالک، slug را برای ۳۰ روز رزرو می‌کنند، سپس slug می‌تواند توسط ناشر دیگری تصاحب شود. پاسخ حذف، وقتی این انقضا اعمال شود، شامل `slugReservedUntil` است.
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

فقط برای مدیر. اطمینان می‌دهد یک ناشر سازمانی برای یک handle وجود دارد. اگر handle هنوز به یک ناشر کاربر/شخصی اشتراکی قدیمی اشاره کند، نقطهٔ پایانی ابتدا آن را به یک ناشر سازمانی مهاجرت می‌دهد.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

فقط مدیر. اسلاگ‌های ریشه و نام‌های بسته را بدون انتشار یک
نسخه برای مالک برحق رزرو می‌کند. نام‌های بسته به بسته‌های جایگزین خصوصی بدون ردیف‌های انتشار تبدیل می‌شوند، تا همان
مالک بتواند بعدا انتشار واقعی code-plugin یا bundle-plugin را در آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### نقاط پایانی مدیریت اسلاگ مالک

- `POST /api/v1/skills/{slug}/rename`
  - بدنه: `{ "newSlug": "new-canonical-slug" }`
  - پاسخ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - بدنه: `{ "targetSlug": "canonical-target-slug" }`
  - پاسخ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

نکته‌ها:

- هر دو نقطه پایانی به احراز هویت با توکن API نیاز دارند و فقط برای مالک مهارت کار می‌کنند.
- `rename` اسلاگ قبلی را به‌عنوان نام مستعار تغییرمسیر حفظ می‌کند.
- `merge` فهرست مبدا را پنهان می‌کند و اسلاگ مبدا را به فهرست مقصد تغییرمسیر می‌دهد.

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

یک کاربر را مسدود می‌کند و مهارت‌های تحت مالکیت او را به‌طور کامل حذف می‌کند (فقط گرداننده/مدیر).

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

مسدودی یک کاربر را برمی‌دارد و مهارت‌های واجد شرایط را بازیابی می‌کند (فقط مدیر).

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

نقش یک کاربر را تغییر می‌دهد (فقط مدیر).

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

فهرست کاربران را نمایش می‌دهد یا در آن جست‌وجو می‌کند (فقط مدیر).

پارامترهای پرس‌وجو:

- `q` (اختیاری): عبارت جست‌وجو
- `query` (اختیاری): نام مستعار برای `q`
- `limit` (اختیاری): بیشینه نتایج (پیش‌فرض 20، بیشینه 200)

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

افزودن/حذف ستاره (برجسته‌سازی‌ها). هر دو نقطه پایانی idempotent هستند.

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

اگر خودمیزبانی می‌کنید، این فایل را ارائه کنید (یا `CLAWHUB_REGISTRY` را صراحتا تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی).
