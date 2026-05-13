---
read_when:
    - افزودن/تغییر نقاط پایانی
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API HTTP (نقاط پایانی عمومی + نقاط پایانی CLI + احراز هویت).
x-i18n:
    generated_at: "2026-05-13T04:17:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

نشانی پایه: `https://clawhub.ai` (پیش‌فرض).

همه مسیرهای v1 زیر `/api/v1/...` هستند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی می‌مانند (به `DEPRECATIONS.md` مراجعه کنید).
OpenAPI: `/api/v1/openapi.json`.

## استفاده دوباره از کاتالوگ عمومی

دایرکتوری‌های شخص ثالث می‌توانند از endpointهای خواندن عمومی برای فهرست‌کردن یا جستجوی Skills در ClawHub استفاده کنند. لطفا نتایج را cache کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست canonical ClawHub (`https://clawhub.ai/<owner>/<slug>`) برگردانید، و از القای تایید ClawHub برای سایت شخص ثالث خودداری کنید. تلاش نکنید محتوای پنهان، خصوصی، یا مسدودشده توسط moderation را بیرون از سطح API عمومی mirror کنید.

میان‌برهای slug وب در خانواده‌های registry resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی تقدم مسیرها، از URLهای canonical بازگردانده‌شده توسط endpointهای خواندن استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (Bearer token معتبر): به‌ازای bucket کاربر اعمال می‌شود.
- اگر token وجود نداشته باشد یا نامعتبر باشد، رفتار به اعمال بر اساس IP برمی‌گردد.
- endpointهای نوشتن احراز هویت‌شده، وقتی سرور دلیل را می‌داند، نباید یک `Unauthorized` ساده برگردانند. tokenهای مفقود، tokenهای نامعتبر/لغوشده، و حساب‌های حذف‌شده/مسدودشده/غیرفعال باید هرکدام متن قابل‌اقدام دریافت کنند تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی آن‌ها را مسدود کرده است.

- خواندن: 600/min به‌ازای هر IP، 2400/min به‌ازای هر key
- نوشتن: 45/min به‌ازای هر IP، 180/min به‌ازای هر key
- دانلود: 30/min به‌ازای هر IP، 180/min به‌ازای هر key (`/api/v1/download`)

Headerها:

- سازگاری قدیمی: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- روی `429`: `Retry-After`

معنای headerها:

- `X-RateLimit-Reset`: ثانیه‌های مطلق Unix epoch
- `RateLimit-Reset`: ثانیه تا reset (تاخیر)
- `Retry-After`: ثانیه‌هایی که پیش از retry باید منتظر ماند (تاخیر) روی `429`

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

- اگر `Retry-After` وجود دارد، پیش از retry همان تعداد ثانیه منتظر بمانید.
- برای جلوگیری از retryهای همگام، از backoff همراه با jitter استفاده کنید.
- اگر `Retry-After` وجود ندارد، به `RateLimit-Reset` برگردید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- به‌طور پیش‌فرض برای IP کلاینت از `cf-connecting-ip` (Cloudflare) استفاده می‌کند.
- ClawHub از headerهای forwarding مورد اعتماد برای شناسایی IP کلاینت‌ها در edge استفاده می‌کند.
- اگر IP کلاینت مورد اعتماد در دسترس نباشد، درخواست‌های دانلود ناشناس به‌جای یک bucket سراسری `ip:unknown` از bucket fallback محدود به endpoint استفاده می‌کنند. درخواست‌های خواندن/نوشتن ناشناس همچنان از bucket ناشناخته مشترک استفاده می‌کنند تا routing بدون IP همچنان قابل‌مشاهده و محافظه‌کارانه بماند.

## endpointهای عمومی (بدون احراز هویت)

### `GET /api/v1/search`

پارامترهای query:

- `q` (الزامی): رشته query
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): `true` برای فیلتر به Skills برجسته
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

نکته‌ها:

- نتایج به‌ترتیب relevance بازگردانده می‌شوند (شباهت embedding + boostهای token دقیق slug/name + prior محبوبیت از دانلودها).
- relevance از محبوبیت قوی‌تر است. تطابق دقیق token در slug یا display-name می‌تواند از تطابق سست‌تر با دانلودهای بسیار بیشتر رتبه بالاتری بگیرد.
- متن ASCII بر اساس مرزهای واژه و نشانه‌گذاری tokenسازی می‌شود. برای مثال، `personal-map` شامل token مستقل `map` است، درحالی‌که `amap-jsapi-skill` شامل `amap`، `jsapi`، و `skill` است؛ بنابراین جستجو برای `map` به `personal-map` تطابق واژگانی قوی‌تری نسبت به `amap-jsapi-skill` می‌دهد.
- دانلودها به‌عنوان prior کوچک با مقیاس لگاریتمی و معیار شکستن تساوی استفاده می‌شوند، نه به‌عنوان سیگنال اصلی رتبه‌بندی. Skills با دانلود بالا وقتی متن query تطابق ضعیف‌تری دارد می‌توانند رتبه پایین‌تری بگیرند.
- وضعیت moderation مشکوک یا پنهان می‌تواند بسته به فیلترهای caller و وضعیت فعلی moderation، یک Skill را از جستجوی عمومی حذف کند.

راهنمای discoverability برای ناشر:

- اصطلاحاتی را که کاربران دقیقا جستجو خواهند کرد در display name، summary، و tagها قرار دهید. فقط وقتی از token مستقل slug استفاده کنید که همان نیز هویت پایداری باشد که می‌خواهید نگه دارید.
- صرفا برای دنبال‌کردن یک query، slug را تغییر نام ندهید، مگر اینکه slug جدید نام canonical بلندمدت بهتری باشد. slugهای قدیمی به aliasهای redirect تبدیل می‌شوند، اما URL canonical، slug نمایش‌داده‌شده، و digestهای جستجوی آینده از slug جدید استفاده می‌کنند.
- aliasهای تغییر نام resolution را برای URLهای قدیمی و نصب‌هایی که از طریق registry resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جستجو پس از index شدن تغییر نام، بر اساس metadata canonical Skill است. آمار موجود با همان Skill باقی می‌ماند.
- اگر یک Skill به‌طور غیرمنتظره نامرئی است، پیش از تغییر metadata مرتبط با رتبه‌بندی، ابتدا در حالت logged in وضعیت moderation را با `clawhub inspect <slug>` بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): cursor صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان‌کردن Skills مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): نام مستعار قدیمی برای `nonSuspiciousOnly`

نکته‌ها:

- `trending` بر اساس نصب‌ها در 7 روز گذشته رتبه‌بندی می‌کند (بر پایه telemetry).
- `createdAt` برای crawlهای Skill جدید پایدار است؛ `updated` وقتی Skills موجود دوباره منتشر می‌شوند تغییر می‌کند.
- وقتی `nonSuspiciousOnly=true` باشد، sortهای مبتنی بر cursor ممکن است در یک صفحه کمتر از `limit` آیتم برگردانند، زیرا Skills مشکوک پس از دریافت صفحه فیلتر می‌شوند.
- وقتی `nextCursor` وجود دارد، برای ادامه صفحه‌بندی از آن استفاده کنید. کوتاه‌بودن یک صفحه به‌تنهایی به معنی پایان نتایج نیست.

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

- slugهای قدیمی ایجادشده توسط جریان‌های تغییر نام/ادغام owner به Skill canonical resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter Skill (مثلا `["macos"]`، `["linux"]`). اگر اعلام نشده باشد `null`.
- `metadata.systems`: targetهای system در Nix (مثلا `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد `null`.
- اگر Skill هیچ metadata پلتفرمی نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط وقتی گنجانده می‌شود که Skill flag شده باشد یا owner در حال مشاهده آن باشد.

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

- ownerها و moderatorها می‌توانند به جزئیات moderation برای Skills پنهان دسترسی داشته باشند.
- callerهای عمومی فقط برای Skills قابل‌مشاهده‌ای که از قبل flag شده‌اند `200` دریافت می‌کنند.
- evidence برای callerهای عمومی redacted می‌شود و فقط برای ownerها/moderatorها شامل snippetهای خام است.

### `POST /api/v1/skills/{slug}/report`

یک Skill را برای بازبینی moderator گزارش کنید. گزارش‌ها در سطح Skill هستند، به‌صورت اختیاری به یک version پیوند می‌خورند، و صف گزارش Skill را تغذیه می‌کنند.

احراز هویت:

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

endpoint moderator/admin برای دریافت گزارش‌های Skill.

پارامترهای query:

- `status` (اختیاری): `open` (پیش‌فرض), `confirmed`, `dismissed`, یا `all`
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

endpoint moderator/admin برای resolve کردن یا بازکردن دوباره گزارش‌های Skill.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام تنظیم دوباره `status` به `open` می‌توان آن را حذف کرد. برای پنهان‌کردن Skill در همان workflow قابل audit، همراه با یک گزارش triaged مقدار `finalAction: "hide"` را ارسال کنید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): cursor صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

metadata نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` شامل وضعیت verification اسکن normalizeشده و جزئیات scanner است
  (VirusTotal + LLM)، وقتی در دسترس باشد.

### `GET /api/v1/skills/{slug}/scan`

جزئیات verification اسکن امنیتی را برای یک نسخه Skill برمی‌گرداند.

پارامترهای query:

- `version` (اختیاری): رشته version مشخص.
- `tag` (اختیاری): resolve کردن یک نسخه tag شده (برای مثال `latest`).

نکته‌ها:

- اگر نه `version` و نه `tag` ارائه شود، از آخرین version استفاده می‌کند.
- شامل وضعیت verification normalizeشده به‌علاوه جزئیات اختصاصی هر scanner است.
- `security.capabilityTags` شامل labelهای قطعی capability/risk مانند
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token`, و `posts-externally` هنگام تشخیص است.
- `security.hasScanResult` فقط وقتی `true` است که یک scanner verdict قطعی تولید کرده باشد (`clean`, `suspicious`, یا `malicious`).
- `moderation` یک snapshot فعلی از moderation سطح Skill است که از آخرین version مشتق شده است.
- هنگام query گرفتن از یک version تاریخی، پیش از اینکه `moderation` و `security` را به‌عنوان context یک version واحد در نظر بگیرید، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

### `GET /api/v1/skills/{slug}/file`

محتوای متن خام را برمی‌گرداند.

پارامترهای query:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض، آخرین version است.
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
- `target` / `hostTarget` (اختیاری): اختصار برای `host:<target>`
- `os`، `arch`، `libc` (اختیاری): اختصار برای فیلترهای قابلیت میزبان
- `requiresBrowser`، `requiresDesktop`، `requiresNativeDeps`،
  `requiresExternalService`، `requiresBinary`، `requiresOsPermission`
  (اختیاری): اختصار `true`/`1` برای تگ‌های نیازمندی محیط
- `externalService`، `binary`، `osPermission` (اختیاری): اختصار برای تگ‌های
  نام‌دار نیازمندی محیط
- `artifactKind` (اختیاری): `legacy-zip` یا `npm-pack`
- `npmMirror` (اختیاری): `true`/`1` برای نمایش نسخه‌های بسته مبتنی بر ClawPack
  که از طریق آینه npm در دسترس‌اند

نکات:

- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار ثابت برای خانواده‌های مشخص باقی می‌مانند.
- ورودی‌های Skill همچنان مبتنی بر رجیستری Skill هستند و هنوز فقط از طریق `POST /api/v1/skills` قابل انتشارند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخواننده‌های ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند در نتایج فهرست/جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/packages/search`

جست‌وجوی کاتالوگ یکپارچه در میان Skills + بسته‌های Plugin.

پارامترهای کوئری:

- `q` (الزامی): رشته کوئری
- `limit` (اختیاری): عدد صحیح (1–100)
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `executesCode` (اختیاری): `true` یا `false`
- `capabilityTag` (اختیاری): فیلتر قابلیت برای بسته‌های Plugin
- `target` / `hostTarget`، `os`، `arch`، `libc`، `requiresBrowser`،
  `requiresDesktop`، `requiresNativeDeps`، `requiresExternalService`،
  `requiresBinary`، `requiresOsPermission`، `externalService`، `binary` و
  `osPermission` به‌عنوان اختصار برای تگ‌های قابلیت رایج پذیرفته می‌شوند
- `artifactKind` (اختیاری): `legacy-zip` یا `npm-pack`
- `npmMirror` (اختیاری): `true`/`1` برای جست‌وجوی نسخه‌های بسته مبتنی بر ClawPack
  که از طریق آینه npm در دسترس‌اند

نکات:

- فراخواننده‌های ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخواننده‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احراز هویت‌شده می‌تواند بخواند.
- فیلترهای آرتیفکت مبتنی بر تگ‌های قابلیت ایندکس‌شده هستند:
  `artifact:legacy-zip`، `artifact:npm-pack`، و `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را برمی‌گرداند.

نکات:

- Skills نیز می‌توانند از طریق این مسیر در کاتالوگ یکپارچه resolve شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.

نکات:

- به توکن API برای مالک بسته، مالک/ادمین ناشر سازمانی، ناظر پلتفرم، یا ادمین پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه را برمی‌گرداند.

پارامترهای کوئری:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

نکات:

- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را، شامل فراداده فایل، سازگاری، قابلیت‌ها، راستی‌آزمایی، فراداده آرتیفکت، و داده‌های اسکن برمی‌گرداند.

نکات:

- `version.artifact.kind` برای آرشیوهای بسته قدیمی `legacy-zip` یا برای انتشارهای مبتنی بر ClawPack برابر `npm-pack` است.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum` و `npmTarballName` هستند.
- `version.sha256hash`، `version.vtAnalysis`، `version.llmAnalysis` و `version.staticScan` زمانی درج می‌شوند که داده اسکن وجود داشته باشد.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصه دقیق امنیت و اعتماد انتشار بسته را برای کلاینت‌های نصب برمی‌گرداند. این سطح مصرف عمومی OpenClaw برای تصمیم‌گیری درباره این است که آیا یک انتشار resolve‌شده می‌تواند نصب شود یا نه.

احراز هویت:

- نقطه پایانی خواندن عمومی. به توکن مالک، ناشر، ناظر، یا ادمین نیاز نیست.

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

- `package.name`، `package.displayName` و `package.family` بسته رجیستری resolve‌شده را شناسایی می‌کنند.
- `release.releaseId`، `release.version` و `release.createdAt` انتشار دقیقی را که ارزیابی شده است شناسایی می‌کنند.
- `release.artifactKind`، `release.artifactSha256`، `release.npmIntegrity`، `release.npmShasum` و `release.npmTarballName` زمانی حاضرند که برای آرتیفکت انتشار شناخته‌شده باشند.
- `trust.scanStatus` وضعیت اعتماد مؤثری است که از ورودی‌های اسکنر و نظارت دستی انتشار به‌دست آمده است.
- `trust.moderationState` می‌تواند null باشد. وقتی هیچ نظارت دستی انتشاری وجود نداشته باشد `null` است.
- `trust.blockedFromDownload` سیگنال مسدودسازی نصب است. OpenClaw و سایر کلاینت‌های نصب باید وقتی این مقدار `true` است نصب را مسدود کنند، به‌جای اینکه قوانین مسدودسازی را دوباره از فیلدهای اسکنر یا نظارت استخراج کنند.
- `trust.reasons` فهرست توضیحات کاربرپسند و قابل ممیزی است. کدهای دلیل رشته‌های پایدار و فشرده‌ای مانند `manual:quarantined`، `scan:malicious`، `static:malicious`، `vt:suspicious` و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد هنوز در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصه اعتماد از ورودی‌های منسوخ محاسبه شده است و باید پیش از تصمیم اجازه با اطمینان بالا، نیازمند نوسازی تلقی شود.

نکات:

- این نقطه پایانی دقیقاً وابسته به نسخه است. کلاینت‌ها باید آن را پس از resolve کردن نسخه بسته‌ای که قصد نصب آن را دارند فراخوانی کنند، نه فقط پس از خواندن آخرین فراداده بسته.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.
- این نقطه پایانی عمداً محدودتر از نقاط پایانی نظارت مالک/ناظر است. تصمیم نصب و توضیح عمومی را در معرض می‌گذارد، نه هویت گزارش‌دهندگان، متن گزارش‌ها، شواهد خصوصی، یا جدول‌های زمانی بررسی داخلی.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده resolveکننده آرتیفکت صریح برای یک نسخه بسته را برمی‌گرداند.

نکات:

- نسخه‌های بسته قدیمی یک آرتیفکت `legacy-zip` و یک `downloadUrl` قدیمی ZIP برمی‌گردانند.
- نسخه‌های ClawPack یک آرتیفکت `npm-pack`، فیلدهای integrity در npm، یک `tarballUrl`، و URL سازگاری ZIP قدیمی برمی‌گردانند.
- این سطح resolver در OpenClaw است؛ از حدس زدن قالب آرشیو از روی یک URL مشترک پرهیز می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

آرتیفکت نسخه را از طریق مسیر resolver صریح دانلود می‌کند.

نکات:

- نسخه‌های ClawPack دقیقاً بایت‌های `.tgz` آپلودشده npm-pack را stream می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` redirect می‌شوند.
- از bucket نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آینده OpenClaw را برمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر است:

- وضعیت کانال رسمی
- در دسترس بودن آخرین نسخه
- در دسترس بودن آرتیفکت npm-pack در ClawPack
- digest آرتیفکت
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

- به توکن API برای کاربر ناظر یا ادمین نیاز دارد.

پارامترهای کوئری:

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

نقطه پایانی ادمین برای ایجاد یا به‌روزرسانی ردیف مهاجرت Plugin رسمی.

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

- `bundledPluginId` به حروف کوچک normalize می‌شود و کلید upsert پایدار است.
- `packageName` به نام npm normalize می‌شود؛ بسته می‌تواند برای مهاجرت‌های برنامه‌ریزی‌شده غایب باشد.
- این فقط آمادگی مهاجرت را پیگیری می‌کند. OpenClaw را تغییر نمی‌دهد و ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

نقطه پایانی ناظر/ادمین برای صف‌های بررسی انتشار بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا ادمین نیاز دارد.

پارامترهای کوئری:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

معانی وضعیت:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، لغوشده، یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، لغوشده، یا مخرب.
- `manual`: هر انتشاری با override نظارت دستی.
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

یک بسته را برای بازبینی ناظر گزارش کنید. گزارش‌ها در سطح بسته هستند و می‌توانند به‌صورت اختیاری
به یک نسخه پیوند داده شوند. آن‌ها وارد صف نظارت می‌شوند اما خودشان به‌طور خودکار پنهان‌سازی یا
مسدودسازی دانلودها را انجام نمی‌دهند؛ ناظران باید از نظارت انتشار برای
تأیید، قرنطینه یا لغو مصنوعات استفاده کنند.

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

### `GET /api/v1/packages/reports`

نقطه پایانی ناظر/مدیر برای دریافت گزارش‌های بسته.

احراز هویت:

- به یک توکن API برای کاربر ناظر یا مدیر نیاز دارد.

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

نقطه پایانی مالک/ناظر برای مشاهده‌پذیری نظارت بسته.

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
برگرداندن `status` به `open` می‌توان آن را حذف کرد. برای اعمال نظارت انتشار در همان
روند کاری قابل ممیزی، همراه با یک گزارش تأییدشده `finalAction: "quarantine"` یا
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
- `revoked`: پس از اینکه یک انتشار قبلاً مورد اعتماد بوده، مسدود شده است.

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود مصنوع `403` برمی‌گردانند.
هر تغییر یک ورودی گزارش ممیزی می‌نویسد.

### `POST /api/v1/packages/backfill/artifacts`

نقطه پایانی نگه‌داری فقط مخصوص مدیر برای برچسب‌گذاری انتشارهای قدیمی‌تر بسته با
فراداده صریح نوع مصنوع.

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

نکته‌ها:

- پیش‌فرض، اجرای آزمایشی است.
- انتشارهای بدون ذخیره‌سازی ClawPack با `legacy-zip` برچسب‌گذاری می‌شوند.
- ردیف‌های موجود مبتنی بر ClawPack که `artifactKind` ندارند، به‌صورت
  `npm-pack` ترمیم می‌شوند.
- این کار ClawPack تولید نمی‌کند و بایت‌های مصنوع را تغییر نمی‌دهد.

### `GET /api/v1/packages/{name}/file`

محتوای متنی خام را برای یک فایل بسته برمی‌گرداند.

پارامترهای کوئری:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض، آخرین انتشار است.
- از باکت نرخ خواندن استفاده می‌کند، نه باکت دانلود.
- فایل‌های دودویی `415` برمی‌گردانند.
- محدودیت اندازه فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن را مسدود نمی‌کنند؛ انتشارهای مخرب ممکن است همچنان در جای دیگری نگه داشته شوند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای انتشار یک بسته دانلود می‌کند.

پارامترهای کوئری:

- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض، آخرین انتشار است.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشه `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP می‌ماند. فایل‌های `.tgz` مربوط به ClawPack را استریم نمی‌کند.
- پاسخ‌ها شامل سرآیندهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type`، و
  `X-ClawHub-Artifact-Sha256` برای بررسی‌های یکپارچگی حل‌کننده هستند.
- فراداده فقط-رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک packument سازگار با npm را برای نسخه‌های بسته مبتنی بر ClawPack برمی‌گرداند.

نکته‌ها:

- فقط نسخه‌هایی که tarballهای npm-pack مربوط به ClawPack را بارگذاری کرده‌اند فهرست می‌شوند.
- نسخه‌های قدیمی فقط-ZIP عمداً حذف می‌شوند.
- `dist.tarball`، `dist.integrity`، و `dist.shasum` از فیلدهای سازگار با npm
  استفاده می‌کنند تا کاربران در صورت تمایل بتوانند npm را به mirror اشاره دهند.
- packumentهای بسته scoped هم از مسیر درخواست `/api/npm/@scope/name` و هم مسیر
  کدگذاری‌شده npm یعنی `/api/npm/@scope%2Fname` پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball بارگذاری‌شده ClawPack را برای کلاینت‌های mirror npm استریم می‌کند.

نکته‌ها:

- از باکت نرخ دانلود استفاده می‌کند.
- سرآیندهای دانلود شامل SHA-256 مربوط به ClawHub به‌همراه فراداده integrity/shasum مربوط به npm هستند.
- بررسی‌های نظارت و دسترسی به بسته خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

توسط CLI برای نگاشت یک اثرانگشت محلی به یک نسخه شناخته‌شده استفاده می‌شود.

پارامترهای کوئری:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز 64-کاراکتری از اثرانگشت بسته

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک zip از نسخه یک skill را دانلود می‌کند.

پارامترهای کوئری:

- `slug` (الزامی)
- `version` (اختیاری): رشته semver
- `tag` (اختیاری): نام برچسب (مثلاً `latest`)

نکته‌ها:

- اگر نه `version` و نه `tag` ارائه شود، از آخرین نسخه استفاده می‌شود.
- نسخه‌های نرم‌حذف‌شده `410` برمی‌گردانند.
- آمار دانلود به‌عنوان هویت‌های یکتا در هر ساعت شمارش می‌شود (`userId` وقتی توکن API معتبر است، در غیر این صورت IP).

## نقاط پایانی احراز هویت (توکن Bearer)

همه نقاط پایانی نیاز دارند:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

توکن را اعتبارسنجی می‌کند و handle کاربر را برمی‌گرداند.

### `POST /api/v1/skills`

یک نسخه جدید را منتشر می‌کند.

- ترجیحی: `multipart/form-data` با JSON در `payload` + blobهای `files[]`.
- بدنه JSON با `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، API آن
  ناشر را در سمت سرور resolve می‌کند و نیاز دارد actor دسترسی ناشر داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` مقدار `true` باشد،
  یک skill موجود می‌تواند به آن مالک منتقل شود، اگر actor روی هر دو ناشر فعلی
  و مقصد مدیر/مالک باشد. بدون این انتخاب صریح، تغییرات مالک رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin را منتشر می‌کند.

- به احراز هویت با توکن Bearer نیاز دارد.
- ترجیحی: `multipart/form-data` با JSON در `payload` + blobهای `files[]`.
- بدنه JSON با `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، فقط مدیران می‌توانند به نمایندگی از آن مالک منتشر کنند.

نکات برجسته اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های `.tgz` مربوط به ClawPack باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- Pluginهای کد به `package.json`، فراداده مخزن منبع، فراداده commit منبع،
  فراداده schema پیکربندی، `openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
- فقط ناشران مورد اعتماد می‌توانند در کانال `official` منتشر کنند.
- انتشارهای از طرف دیگران همچنان واجد شرایط بودن کانال رسمی را در برابر حساب مالک مقصد اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

نرم‌حذف / بازیابی یک skill (مالک، ناظر، یا مدیر).

بدنه JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

وقتی وجود داشته باشد، `reason` به‌عنوان یادداشت نظارت skill ذخیره می‌شود و در گزارش ممیزی کپی می‌شود.
نرم‌حذف‌هایی که توسط مالک آغاز می‌شوند slug را به مدت 30 روز رزرو می‌کنند، سپس slug می‌تواند توسط
ناشر دیگری ادعا شود. پاسخ حذف وقتی این انقضا اعمال شود شامل `slugReservedUntil` است.
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

فقط مخصوص مدیر. تضمین می‌کند یک ناشر سازمانی برای یک handle وجود دارد. اگر handle همچنان به یک
ناشر قدیمی مشترک کاربری/شخصی اشاره کند، نقطه پایانی ابتدا آن را به یک ناشر سازمانی مهاجرت می‌دهد.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

فقط مخصوص مدیر. slugهای ریشه و نام‌های بسته را بدون انتشار یک
انتشار برای مالک برحق رزرو می‌کند. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف انتشار تبدیل می‌شوند، تا همان
مالک بتواند بعداً انتشار واقعی code-plugin یا bundle-plugin را در آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### نقاط پایانی مدیریت slug مالک

- `POST /api/v1/skills/{slug}/rename`
  - بدنه: `{ "newSlug": "new-canonical-slug" }`
  - پاسخ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - بدنه: `{ "targetSlug": "canonical-target-slug" }`
  - پاسخ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

نکته‌ها:

- هر دو نقطه پایانی به احراز هویت با توکن API نیاز دارند و فقط برای مالک skill کار می‌کنند.
- `rename`، slug قبلی را به‌عنوان نام مستعار redirect حفظ می‌کند.
- `merge` فهرست منبع را پنهان می‌کند و slug منبع را به فهرست مقصد redirect می‌کند.

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

کاربری را مسدود کنید و Skills تحت مالکیت او را به‌صورت دائمی حذف کنید (فقط ناظر/مدیر).

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

مسدودی یک کاربر را رفع کنید و Skills واجد شرایط را بازیابی کنید (فقط مدیر).

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

پارامترهای کوئری:

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

یک ستاره اضافه/حذف کنید (موارد برجسته). هر دو نقطه پایانی نسبت به تکرار درخواست همان‌اثر هستند.

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

طرحواره:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر خودمیزبانی می‌کنید، این فایل را سرو کنید (یا `CLAWHUB_REGISTRY` را صراحتاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی).
