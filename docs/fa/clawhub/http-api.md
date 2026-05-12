---
read_when:
    - افزودن/تغییر نقاط پایانی
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API HTTP (نقاط پایانی عمومی + نقاط پایانی CLI + احراز هویت).
x-i18n:
    generated_at: "2026-05-12T04:09:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

نشانی پایه: `https://clawhub.ai` (پیش‌فرض).

همه مسیرهای v1 زیر `/api/v1/...` هستند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی می‌مانند (به `DEPRECATIONS.md` مراجعه کنید).
OpenAPI: `/api/v1/openapi.json`.

## استفاده دوباره از کاتالوگ عمومی

فهرست‌های شخص ثالث می‌توانند از endpointهای خواندنی عمومی برای فهرست کردن یا جست‌وجوی Skills در ClawHub استفاده کنند. لطفاً نتایج را cache کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست canonical در ClawHub (`https://clawhub.ai/<owner>/<slug>`) برگردانید، و از القای تأیید سایت شخص ثالث توسط ClawHub خودداری کنید. تلاش نکنید محتوای پنهان، خصوصی، یا مسدودشده به‌دلیل moderation را بیرون از سطح API عمومی mirror کنید.

میان‌برهای slug وب در میان خانواده‌های registry resolve می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی تقدم مسیرها، از URLهای canonical برگردانده‌شده توسط endpointهای خواندنی استفاده کنند.

## محدودیت‌های نرخ

مدل اعمال محدودیت:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (token معتبر Bearer): به‌ازای bucket کاربر اعمال می‌شود.
- اگر token وجود نداشته باشد یا نامعتبر باشد، رفتار به اعمال محدودیت بر اساس IP برمی‌گردد.
- endpointهای نوشتنی احراز هویت‌شده وقتی سرور دلیل را می‌داند نباید یک `Unauthorized` خالی برگردانند. tokenهای غایب، tokenهای نامعتبر/لغوشده، و حساب‌های حذف‌شده/مسدودشده/غیرفعال‌شده باید هرکدام متن قابل‌اقدام دریافت کنند تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی مانع آن‌ها شده است.

- خواندن: 600/min به‌ازای هر IP، 2400/min به‌ازای هر key
- نوشتن: 45/min به‌ازای هر IP، 180/min به‌ازای هر key
- دانلود: 30/min به‌ازای هر IP، 180/min به‌ازای هر key (`/api/v1/download`)

Headerها:

- سازگاری قدیمی: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- روی `429`: `Retry-After`

معنای Headerها:

- `X-RateLimit-Reset`: ثانیه‌های مطلق Unix epoch
- `RateLimit-Reset`: ثانیه تا reset (تأخیر)
- `Retry-After`: ثانیه‌هایی که پیش از تلاش دوباره باید صبر شود (تأخیر) روی `429`

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
- برای پرهیز از تلاش‌های دوباره هم‌زمان، از backoff همراه با jitter استفاده کنید.
- اگر `Retry-After` وجود ندارد، به `RateLimit-Reset` برگردید (یا از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- به‌طور پیش‌فرض از `cf-connecting-ip` (Cloudflare) برای IP کلاینت استفاده می‌کند.
- ClawHub از headerهای forwarding مورداعتماد برای شناسایی IPهای کلاینت در edge استفاده می‌کند.
- اگر IP کلاینت مورداعتمادی در دسترس نباشد، درخواست‌های دانلود ناشناس به‌جای یک bucket سراسری `ip:unknown` از یک bucket fallback scoped به endpoint استفاده می‌کنند. درخواست‌های خواندن/نوشتن ناشناس همچنان از bucket ناشناخته مشترک استفاده می‌کنند تا routing بدون IP همچنان قابل‌مشاهده و محافظه‌کارانه بماند.

## endpointهای عمومی (بدون احراز هویت)

### `GET /api/v1/search`

پارامترهای query:

- `q` (الزامی): رشته query
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): `true` برای فیلتر به Skills برجسته‌شده
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان کردن Skills مشکوک (`flagged.suspicious`)
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

نکات:

- نتایج به‌ترتیب ارتباط برگردانده می‌شوند (شباهت embedding + تقویت token دقیق slug/name + prior محبوبیت از دانلودها).
- ارتباط از محبوبیت قوی‌تر است. تطابق دقیق token در slug یا display-name می‌تواند از تطابق آزادتر با دانلودهای بسیار بیشتر بالاتر قرار بگیرد.
- متن ASCII بر اساس مرزهای کلمه و نشانه‌گذاری token می‌شود. برای مثال، `personal-map` شامل token مستقل `map` است، درحالی‌که `amap-jsapi-skill` شامل `amap`، `jsapi`، و `skill` است؛ بنابراین جست‌وجوی `map` به `personal-map` تطابق واژگانی قوی‌تری نسبت به `amap-jsapi-skill` می‌دهد.
- دانلودها به‌عنوان prior کوچک با مقیاس log و tie-breaker استفاده می‌شوند، نه به‌عنوان سیگنال اصلی رتبه‌بندی. Skills با دانلود بالا وقتی متن query تطابق ضعیف‌تری دارد می‌توانند پایین‌تر رتبه بگیرند.
- وضعیت moderation مشکوک یا پنهان می‌تواند بسته به فیلترهای فراخواننده و وضعیت فعلی moderation، یک skill را از جست‌وجوی عمومی حذف کند.

راهنمای discoverability برای ناشر:

- اصطلاحاتی را که کاربران دقیقاً جست‌وجو خواهند کرد در display name، summary، و tagها قرار دهید. فقط زمانی از token مستقل slug استفاده کنید که همان نیز یک هویت پایدار باشد که می‌خواهید نگه دارید.
- فقط برای دنبال کردن یک query، slug را تغییر ندهید مگر اینکه slug جدید نام canonical بلندمدت بهتری باشد. slugهای قدیمی به aliasهای redirect تبدیل می‌شوند، اما URL canonical، slug نمایش‌داده‌شده، و digestهای جست‌وجوی آینده از slug جدید استفاده می‌کنند.
- aliasهای rename، resolution را برای URLهای قدیمی و installهایی که از طریق registry resolve می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو پس از index شدن rename بر اساس metadata canonical skill است. آمار موجود با skill باقی می‌ماند.
- اگر یک skill به‌طور غیرمنتظره نامرئی است، پیش از تغییر metadata مرتبط با رتبه‌بندی، ابتدا هنگام ورود با `clawhub inspect <slug>` وضعیت moderation را بررسی کنید.

### `GET /api/v1/skills`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): cursor صفحه‌بندی برای هر sort غیر از `trending`
- `sort` (اختیاری): `updated` (پیش‌فرض), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (اختیاری): `true` برای پنهان کردن Skills مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): alias قدیمی برای `nonSuspiciousOnly`

نکات:

- `trending` بر اساس installها در 7 روز گذشته رتبه‌بندی می‌کند (بر پایه telemetry).
- `createdAt` برای crawlهای skill جدید پایدار است؛ `updated` زمانی تغییر می‌کند که Skills موجود دوباره منتشر شوند.
- وقتی `nonSuspiciousOnly=true` باشد، sortهای مبتنی بر cursor ممکن است در یک صفحه کمتر از `limit` آیتم برگردانند، چون Skills مشکوک پس از دریافت صفحه فیلتر می‌شوند.
- وقتی `nextCursor` وجود دارد، برای ادامه صفحه‌بندی از آن استفاده کنید. یک صفحه کوتاه به‌تنهایی به‌معنای پایان نتایج نیست.

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

نکات:

- slugهای قدیمی ایجادشده توسط جریان‌های rename/merge مالک به skill canonical resolve می‌شوند.
- `metadata.os`: محدودیت‌های OS اعلام‌شده در frontmatter skill (مثلاً `["macos"]`، `["linux"]`). اگر اعلام نشده باشد `null`.
- `metadata.systems`: هدف‌های Nix system (مثلاً `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد `null`.
- اگر skill هیچ metadata پلتفرمی نداشته باشد، `metadata` برابر `null` است.
- `moderation` فقط وقتی skill flagged باشد یا مالک آن را مشاهده کند گنجانده می‌شود.

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

نکات:

- مالکان و moderatorها می‌توانند به جزئیات moderation برای Skills پنهان دسترسی داشته باشند.
- فراخواننده‌های عمومی فقط برای Skills قابل‌مشاهده‌ای که از قبل flagged شده‌اند `200` دریافت می‌کنند.
- evidence برای فراخواننده‌های عمومی redact می‌شود و فقط برای مالکان/moderatorها شامل snippetهای خام است.

### `POST /api/v1/skills/{slug}/report`

یک skill را برای بازبینی moderator گزارش کنید. گزارش‌ها در سطح skill هستند، به‌صورت اختیاری به یک version پیوند می‌خورند، و وارد صف گزارش skill می‌شوند.

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

endpoint مخصوص moderator/admin برای intake گزارش skill.

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

endpoint مخصوص moderator/admin برای resolve کردن یا بازکردن دوباره گزارش‌های skill.

درخواست:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام تنظیم دوباره `status` به `open` می‌توان آن را حذف کرد. برای پنهان کردن skill در همان workflow قابل audit، همراه با یک گزارش triaged مقدار `finalAction: "hide"` را ارسال کنید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای query:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): cursor صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

metadata نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` وقتی در دسترس باشد، وضعیت verification اسکن نرمال‌شده و جزئیات scanner را شامل می‌شود
  (VirusTotal + LLM).

### `GET /api/v1/skills/{slug}/scan`

جزئیات verification اسکن امنیتی را برای یک نسخه skill برمی‌گرداند.

پارامترهای query:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): resolve کردن یک نسخه tag شده (برای مثال `latest`).

نکات:

- اگر نه `version` و نه `tag` ارائه نشده باشد، از آخرین نسخه استفاده می‌کند.
- وضعیت verification نرمال‌شده به‌همراه جزئیات اختصاصی scanner را شامل می‌شود.
- `security.capabilityTags` شامل برچسب‌های قطعی capability/risk مانند
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token`, و `posts-externally` است، وقتی شناسایی شوند.
- `security.hasScanResult` فقط وقتی `true` است که یک scanner verdict قطعی (`clean`, `suspicious`, یا `malicious`) تولید کرده باشد.
- `moderation` یک snapshot فعلی در سطح skill از moderation است که از آخرین نسخه مشتق شده است.
- هنگام query کردن یک نسخه تاریخی، پیش از تلقی `moderation` و `security` به‌عنوان زمینه یکسان نسخه، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

### `GET /api/v1/skills/{slug}/file`

محتوای متن خام را برمی‌گرداند.

پارامترهای query:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌طور پیش‌فرض از آخرین نسخه استفاده می‌کند.
- محدودیت اندازه فایل: 200KB.

### `GET /api/v1/packages`

endpoint کاتالوگ یکپارچه برای:

- Skills
- code plugins
- bundle plugins

پارامترهای query:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `family` (اختیاری): `skill`، `code-plugin`، یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community`، یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `executesCode` (اختیاری): `true` یا `false`
- `capabilityTag` (اختیاری): فیلتر قابلیت برای بسته‌های Plugin
- `target` / `hostTarget` (اختیاری): میان‌بری برای `host:<target>`
- `os`، `arch`، `libc` (اختیاری): میان‌بری برای فیلترهای قابلیت میزبان
- `requiresBrowser`، `requiresDesktop`، `requiresNativeDeps`،
  `requiresExternalService`، `requiresBinary`، `requiresOsPermission`
  (اختیاری): میان‌بر `true`/`1` برای برچسب‌های نیازمندی محیط
- `externalService`، `binary`، `osPermission` (اختیاری): میان‌بری برای برچسب‌های
  نام‌گذاری‌شده نیازمندی محیط
- `artifactKind` (اختیاری): `legacy-zip` یا `npm-pack`
- `npmMirror` (اختیاری): `true`/`1` برای نمایش نسخه‌های بسته با پشتوانه ClawPack
  که از طریق آینه npm در دسترس‌اند

یادداشت‌ها:

- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` همچنان نام‌های مستعار خانواده‌ثابت باقی می‌مانند.
- ورودی‌های Skill همچنان با پشتوانه رجیستری Skill باقی می‌مانند و هنوز فقط از طریق `POST /api/v1/skills` می‌توانند منتشر شوند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای code-plugin و bundle-plugin است.
- فراخوان‌های ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخوان‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند در نتایج فهرست/جست‌وجو ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احراز هویت‌شده می‌تواند بخواند.

### `GET /api/v1/packages/search`

جست‌وجوی کاتالوگ یکپارچه در Skills و بسته‌های Plugin.

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
  `osPermission` به‌عنوان میان‌برهایی برای برچسب‌های رایج قابلیت پذیرفته می‌شوند
- `artifactKind` (اختیاری): `legacy-zip` یا `npm-pack`
- `npmMirror` (اختیاری): `true`/`1` برای جست‌وجوی نسخه‌های بسته با پشتوانه ClawPack
  که از طریق آینه npm در دسترس‌اند

یادداشت‌ها:

- فراخوان‌های ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخوان‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احراز هویت‌شده می‌تواند بخواند.
- فیلترهای آرتیفکت با برچسب‌های قابلیت ایندکس‌شده پشتیبانی می‌شوند:
  `artifact:legacy-zip`، `artifact:npm-pack` و `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

فراداده جزئیات بسته را برمی‌گرداند.

یادداشت‌ها:

- Skills نیز می‌توانند از طریق این مسیر در کاتالوگ یکپارچه resolve شوند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخوان بتواند ناشر مالک را بخواند.

### `DELETE /api/v1/packages/{name}`

یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.

یادداشت‌ها:

- به توکن API برای مالک بسته، مالک/ادمین ناشر سازمانی،
  ناظر پلتفرم، یا ادمین پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچه نسخه‌ها را برمی‌گرداند.

پارامترهای کوئری:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

یادداشت‌ها:

- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخوان بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخه بسته را شامل فراداده فایل، سازگاری،
قابلیت‌ها، راستی‌آزمایی، فراداده آرتیفکت و داده‌های اسکن برمی‌گرداند.

یادداشت‌ها:

- `version.artifact.kind` برای آرشیوهای بسته قدیمی `legacy-zip` یا برای انتشارهای با پشتوانه ClawPack
  `npm-pack` است.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum` و
  `npmTarballName` هستند.
- `version.sha256hash`، `version.vtAnalysis`، `version.llmAnalysis` و `version.staticScan` زمانی گنجانده می‌شوند که داده اسکن وجود داشته باشد.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخوان بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فراداده resolver صریح آرتیفکت را برای یک نسخه بسته برمی‌گرداند.

یادداشت‌ها:

- نسخه‌های بسته قدیمی یک آرتیفکت `legacy-zip` و یک `downloadUrl` زیپ قدیمی برمی‌گردانند.
- نسخه‌های ClawPack یک آرتیفکت `npm-pack`، فیلدهای integrity مربوط به npm، یک
  `tarballUrl` و URL سازگاری زیپ قدیمی را برمی‌گردانند.
- این سطح resolver مربوط به OpenClaw است؛ از حدس‌زدن قالب آرشیو از
  یک URL مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

آرتیفکت نسخه را از مسیر resolver صریح دانلود می‌کند.

یادداشت‌ها:

- نسخه‌های ClawPack دقیقاً بایت‌های `.tgz` آپلودشده npm-pack را stream می‌کنند.
- نسخه‌های زیپ قدیمی به `/api/v1/packages/{name}/download?version=` redirect می‌شوند.
- از bucket نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای مصرف آینده OpenClaw را برمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر است:

- وضعیت کانال رسمی
- در دسترس بودن آخرین نسخه
- در دسترس بودن آرتیفکت npm-pack مربوط به ClawPack
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

endpoint ناظر برای فهرست‌کردن ردیف‌های مهاجرت Plugin رسمی OpenClaw.

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

endpoint ادمین برای ایجاد یا به‌روزرسانی ردیف مهاجرت Plugin رسمی.

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

یادداشت‌ها:

- `bundledPluginId` به حروف کوچک نرمال‌سازی می‌شود و کلید پایدار upsert است.
- `packageName` به نام npm نرمال‌سازی می‌شود؛ ممکن است بسته برای مهاجرت‌های برنامه‌ریزی‌شده
  وجود نداشته باشد.
- این فقط آمادگی مهاجرت را ردیابی می‌کند. OpenClaw را تغییر نمی‌دهد و
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

endpoint ناظر/ادمین برای صف‌های بررسی انتشار بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا ادمین نیاز دارد.

پارامترهای کوئری:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

معنای وضعیت‌ها:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، revoke‌شده یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، revoke‌شده یا مخرب.
- `manual`: هر انتشاری با override دستی moderation.
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

یک بسته را برای بررسی ناظر گزارش می‌کند. گزارش‌ها در سطح بسته هستند و به‌صورت اختیاری
به یک نسخه لینک می‌شوند. آن‌ها صف moderation را تغذیه می‌کنند، اما به‌خودی‌خود دانلودها را
خودکار پنهان یا مسدود نمی‌کنند؛ ناظران باید از moderation انتشار برای
تأیید، قرنطینه‌کردن یا revoke کردن آرتیفکت‌ها استفاده کنند.

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

endpoint ناظر/ادمین برای دریافت گزارش‌های بسته.

احراز هویت:

- به توکن API برای کاربر ناظر یا ادمین نیاز دارد.

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

endpoint مالک/ناظر برای مشاهده moderation بسته.

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

endpoint ناظر/ادمین برای حل‌وفصل یا بازگشایی گزارش‌های بسته.

درخواست:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام بازگرداندن
`status` به `open` می‌توان آن را حذف کرد. برای اعمال مدیریت انتشار در همان
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

نقطه پایانی ناظر/مدیر برای بازبینی انتشار بسته.

درخواست:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

وضعیت‌های پشتیبانی‌شده:

- `approved`: به‌صورت دستی بازبینی و مجاز شده است.
- `quarantined`: تا زمان پیگیری بعدی مسدود شده است.
- `revoked`: پس از آنکه یک انتشار پیش‌تر مورد اعتماد بود، مسدود شده است.

انتشارهای قرنطینه‌شده و لغوشده از مسیرهای دانلود artifact مقدار `403` برمی‌گردانند.
هر تغییر یک ورودی گزارش ممیزی می‌نویسد.

### `POST /api/v1/packages/backfill/artifacts`

نقطه پایانی نگهداری فقط ویژه مدیر برای برچسب‌گذاری انتشارهای قدیمی‌تر بسته با
فراداده صریح نوع artifact.

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
- این کار ClawPack تولید نمی‌کند و بایت‌های artifact را تغییر نمی‌دهد.

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
- محدودیت اندازه فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن‌ها را مسدود نمی‌کنند؛ انتشارهای مخرب همچنان ممکن است در جای دیگری نگه داشته شوند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای یک انتشار بسته دانلود می‌کند.

پارامترهای پرس‌وجو:

- `version` (اختیاری)
- `tag` (اختیاری)

نکته‌ها:

- پیش‌فرض، آخرین انتشار است.
- مهارت‌ها به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته فایل‌های zip با ریشه `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP باقی می‌ماند. فایل‌های ClawPack با پسوند `.tgz` را استریم نمی‌کند.
- پاسخ‌ها برای بررسی‌های یکپارچگی resolver شامل سرآیندهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` هستند.
- فراداده فقط رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` برمی‌گردانند.
- بسته‌های خصوصی `404` برمی‌گردانند، مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک packument سازگار با npm برای نسخه‌های بسته مبتنی بر ClawPack برمی‌گرداند.

نکته‌ها:

- فقط نسخه‌هایی که tarballهای npm-pack مربوط به ClawPack را آپلود کرده‌اند فهرست می‌شوند.
- نسخه‌های قدیمی فقط-ZIP عمداً حذف شده‌اند.
- `dist.tarball`، `dist.integrity` و `dist.shasum` از فیلدهای سازگار با npm
  استفاده می‌کنند تا کاربران در صورت تمایل بتوانند npm را به mirror اشاره دهند.
- packumentهای بسته scoped هم از مسیر درخواست `/api/npm/@scope/name` و هم از مسیر کدگذاری‌شده npm یعنی
  `/api/npm/@scope%2Fname` پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball آپلودشده ClawPack را برای کلاینت‌های mirror npm استریم می‌کند.

نکته‌ها:

- از سطل نرخ دانلود استفاده می‌کند.
- سرآیندهای دانلود شامل SHA-256 مربوط به ClawHub به‌علاوه فراداده integrity/shasum مربوط به npm هستند.
- بررسی‌های مدیریت انتشار و دسترسی بسته خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

CLI از آن برای نگاشت یک اثر انگشت محلی به یک نسخه شناخته‌شده استفاده می‌کند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز 64 کاراکتری از اثر انگشت bundle

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

یک zip از نسخه مهارت را دانلود می‌کند.

پارامترهای پرس‌وجو:

- `slug` (الزامی)
- `version` (اختیاری): رشته semver
- `tag` (اختیاری): نام tag (مثلاً `latest`)

نکته‌ها:

- اگر نه `version` و نه `tag` ارائه شود، آخرین نسخه استفاده می‌شود.
- نسخه‌های soft-delete شده `410` برمی‌گردانند.
- آمار دانلود به‌صورت هویت‌های یکتا در هر ساعت شمرده می‌شود (`userId` وقتی توکن API معتبر است، در غیر این صورت IP).

## نقطه‌های پایانی احراز هویت (توکن Bearer)

همه نقطه‌های پایانی نیاز دارند به:

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
  ناشر را در سمت سرور resolve می‌کند و نیاز دارد actor دسترسی ناشر داشته باشد.
- فیلد اختیاری payload: `migrateOwner`. وقتی همراه با `ownerHandle` مقدار `true` باشد،
  یک مهارت موجود می‌تواند به آن مالک منتقل شود، اگر actor روی ناشران فعلی و هدف
  مدیر/مالک باشد. بدون این opt-in، تغییرات مالک رد می‌شوند.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin منتشر می‌کند.

- به احراز هویت توکن Bearer نیاز دارد.
- ترجیحی: `multipart/form-data` با JSON در `payload` + blobهای `files[]`.
- بدنه JSON با `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری payload: `ownerHandle`. وقتی وجود داشته باشد، فقط مدیران می‌توانند از طرف آن مالک منتشر کنند.

نکات برجسته اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. آپلودهای ClawPack با پسوند `.tgz` باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- Code pluginها به `package.json`، فراداده repo منبع، فراداده commit منبع،
  فراداده schema پیکربندی، `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
- فقط ناشران مورد اعتماد می‌توانند در کانال `official` منتشر کنند.
- انتشارهای از طرف دیگران همچنان واجد شرایط بودن کانال official را در برابر حساب مالک هدف اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

soft-delete / بازیابی یک مهارت (مالک، ناظر یا مدیر).

بدنه JSON اختیاری:

```json
{ "reason": "Held for moderation pending legal review." }
```

وقتی وجود داشته باشد، `reason` به‌عنوان یادداشت مدیریت مهارت ذخیره می‌شود و در گزارش ممیزی کپی می‌شود.
soft deleteهای آغازشده توسط مالک، slug را برای 30 روز رزرو می‌کنند، سپس slug می‌تواند توسط
ناشر دیگری ادعا شود. وقتی این انقضا اعمال شود، پاسخ حذف شامل `slugReservedUntil` است.
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

فقط مدیر. اطمینان می‌دهد یک ناشر سازمانی برای یک handle وجود دارد. اگر handle هنوز به یک
ناشر کاربر/شخصی مشترک قدیمی اشاره کند، نقطه پایانی ابتدا آن را به یک ناشر سازمانی مهاجرت می‌دهد.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

فقط مدیر. slugهای ریشه و نام‌های بسته را برای مالک برحق بدون انتشار یک
release رزرو می‌کند. نام‌های بسته به بسته‌های placeholder خصوصی بدون ردیف release تبدیل می‌شوند، بنابراین همان
مالک می‌تواند بعداً انتشار واقعی code-plugin یا bundle-plugin را در آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### نقطه‌های پایانی مدیریت slug مالک

- `POST /api/v1/skills/{slug}/rename`
  - بدنه: `{ "newSlug": "new-canonical-slug" }`
  - پاسخ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - بدنه: `{ "targetSlug": "canonical-target-slug" }`
  - پاسخ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

نکته‌ها:

- هر دو نقطه پایانی به احراز هویت توکن API نیاز دارند و فقط برای مالک مهارت کار می‌کنند.
- `rename`، slug قبلی را به‌عنوان alias هدایت حفظ می‌کند.
- `merge`، فهرست‌بندی منبع را پنهان می‌کند و slug منبع را به فهرست‌بندی هدف هدایت می‌کند.

### نقطه‌های پایانی انتقال مالکیت

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

یک کاربر را ban می‌کند و مهارت‌های متعلق به او را hard-delete می‌کند (فقط ناظر/مدیر).

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

ban یک کاربر را برمی‌دارد و مهارت‌های واجد شرایط را بازیابی می‌کند (فقط مدیر).

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

فهرست کاربران را نشان می‌دهد یا کاربران را جست‌وجو می‌کند (فقط مدیر).

پارامترهای پرس‌وجو:

- `q` (اختیاری): query جست‌وجو
- `query` (اختیاری): alias برای `q`
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

یک star (برجسته‌سازی) اضافه/حذف می‌کند. هر دو نقطه پایانی idempotent هستند.

پاسخ‌ها:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقطه‌های پایانی CLI قدیمی (منسوخ)

هنوز برای نسخه‌های قدیمی‌تر CLI پشتیبانی می‌شوند:

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

اگر خودتان میزبانی می‌کنید، این فایل را سرو کنید (یا `CLAWHUB_REGISTRY` را صراحتاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی است).
