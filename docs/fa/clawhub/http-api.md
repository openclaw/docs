---
read_when:
    - افزودن/تغییر نقاط پایانی
    - اشکال‌زدایی درخواست‌های CLI ↔ رجیستری
summary: مرجع API مبتنی بر HTTP (نقاط پایانی عمومی + CLI + احراز هویت).
x-i18n:
    generated_at: "2026-07-16T16:20:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

نشانی پایه: `https://clawhub.ai` (پیش‌فرض).

همه مسیرهای v1 زیرمجموعه `/api/v1/...` هستند.
مسیرهای قدیمی `/api/...` و `/api/cli/...` برای سازگاری باقی مانده‌اند (نگاه کنید به `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## استفاده مجدد از فهرست عمومی

دایرکتوری‌های شخص ثالث می‌توانند برای فهرست‌کردن یا جست‌وجوی Skills در ClawHub از نقاط پایانی عمومی خواندن استفاده کنند. لطفاً نتایج را کش کنید، `429`/`Retry-After` را رعایت کنید، کاربران را به فهرست مرجع ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) پیوند دهید و از القای تأیید سایت شخص ثالث توسط ClawHub خودداری کنید. برای بازتاب‌دادن محتوای پنهان، خصوصی یا مسدودشده توسط نظارت در خارج از سطح API عمومی تلاش نکنید.

میان‌برهای اسلاگ وب در خانواده‌های مختلف رجیستری تفکیک می‌شوند، اما کلاینت‌های API باید به‌جای بازسازی اولویت مسیر، از URLهای مرجعی استفاده کنند که نقاط پایانی خواندن بازمی‌گردانند.

## محدودیت‌های نرخ

مدل اعمال محدودیت:

- درخواست‌های ناشناس: به‌ازای هر IP اعمال می‌شود.
- درخواست‌های احراز هویت‌شده (توکن Bearer معتبر): به‌ازای سبد هر کاربر اعمال می‌شود.
- اگر توکن موجود نباشد یا نامعتبر باشد، رفتار به اعمال محدودیت بر اساس IP بازمی‌گردد.
- نقاط پایانی نوشتنِ احراز هویت‌شده نباید هنگامی که
  سرور دلیل را می‌داند، صرفاً `Unauthorized` برگردانند. برای توکن‌های مفقود،
  توکن‌های نامعتبر/لغوشده و حساب‌های حذف‌شده/مسدودشده/غیرفعال‌شده باید متن
  قابل‌اقدامی جداگانه ارائه شود تا کلاینت‌های CLI بتوانند به کاربران بگویند چه چیزی مانع آن‌ها شده است.

- خواندن: 3000/دقیقه به‌ازای هر IP، ‏12000/دقیقه به‌ازای هر کلید
- نوشتن: 300/دقیقه به‌ازای هر IP، ‏3000/دقیقه به‌ازای هر کلید
- دانلود: 1200/دقیقه به‌ازای هر IP، ‏6000/دقیقه به‌ازای هر کلید (نقاط پایانی دانلود)

سرآیندها:

- سازگاری قدیمی: `X-RateLimit-Limit`، `X-RateLimit-Reset`
- استانداردشده: `RateLimit-Limit`، `RateLimit-Reset`
- در `429`: ‏`X-RateLimit-Remaining: 0` و `RateLimit-Remaining: 0`
- در `429`: ‏`Retry-After`

معنای سرآیندها:

- `X-RateLimit-Reset`: ثانیه‌های مطلق دوره یونیکس
- `RateLimit-Reset`: تعداد ثانیه تا بازنشانی (تأخیر)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: بودجه دقیق باقی‌مانده، در صورت وجود.
  درخواست‌های شاردشده موفق به‌جای بازگرداندن یک مقدار تقریبی سراسری، این سرآیند را حذف می‌کنند.
- `Retry-After`: تعداد ثانیه انتظار پیش از تلاش مجدد (تأخیر) در `429`

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

محدودیت نرخ رد شد
```

راهنمای کلاینت:

- اگر `Retry-After` وجود دارد، پیش از تلاش مجدد به همان تعداد ثانیه صبر کنید.
- برای جلوگیری از تلاش‌های مجدد هم‌زمان، از عقب‌نشینی همراه با نوسان تصادفی استفاده کنید.
- اگر `Retry-After` موجود نیست، به `RateLimit-Reset` بازگردید (یا آن را از `X-RateLimit-Reset` محاسبه کنید).

منبع IP:

- از سرآیندهای مورداعتماد IP کلاینت، از جمله `cf-connecting-ip`، تنها زمانی استفاده می‌شود که
  استقرار به‌صراحت سرآیندهای بازارسال‌شده مورداعتماد را فعال کرده باشد.
- ClawHub برای شناسایی IP کلاینت‌ها در لبه از سرآیندهای بازارسال مورداعتماد استفاده می‌کند.
- اگر IP مورداعتمادی برای کلاینت در دسترس نباشد، درخواست‌های ناشناس از سبدهای جایگزینی استفاده می‌کنند
  که فقط بر اساس نوع محدودیت نرخ دامنه‌بندی شده‌اند. این سبدهای جایگزین شامل
  مسیرها، اسلاگ‌ها، نام بسته‌ها، نسخه‌ها، رشته‌های پرس‌وجو یا سایر
  پارامترهای مصنوع ارائه‌شده توسط فراخواننده نیستند.

## پاسخ‌های خطا

پاسخ‌های خطای عمومی v1 متن ساده با `content-type: text/plain; charset=utf-8` هستند.
این شامل شکست‌های اعتبارسنجی (`400`)، منابع عمومی موجودنبودن (`404`)، شکست‌های احراز هویت و
مجوز (`401`/`403`)، محدودیت‌های نرخ (`429`) و دانلودهای مسدودشده است. کلاینت‌ها
باید بدنه پاسخ را به‌عنوان رشته‌ای قابل‌خواندن برای انسان بخوانند. پارامترهای پرس‌وجوی ناشناخته برای
سازگاری نادیده گرفته می‌شوند، اما پارامترهای پرس‌وجوی شناخته‌شده با مقادیر نامعتبر
`400` را برمی‌گردانند.

## نقاط پایانی عمومی (بدون احراز هویت)

### `GET /api/v1/search`

پارامترهای پرس‌وجو:

- `q` (الزامی): رشته پرس‌وجو
- `limit` (اختیاری): عدد صحیح
- `highlightedOnly` (اختیاری): ‏`true` برای محدودکردن نتایج به Skills برجسته
- `nonSuspiciousOnly` (اختیاری): ‏`true` برای پنهان‌کردن Skills مشکوک (`flagged.suspicious`)
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

- نتایج به‌ترتیب ارتباط بازگردانده می‌شوند (شباهت تعبیه‌سازی + تقویت تطبیق دقیق توکن اسلاگ/نام + یک پیشین کوچک محبوبیت).
- ارتباط از محبوبیت تأثیرگذارتر است. تطبیق دقیق یک توکن اسلاگ یا نام نمایشی می‌تواند بالاتر از تطبیق آزادتر با تعامل بسیار بیشتر قرار گیرد.
- متن ASCII در مرزهای واژه و نشانه‌گذاری توکن‌سازی می‌شود. برای مثال، `personal-map` دارای توکن مستقل `map` است، درحالی‌که `amap-jsapi-skill` شامل `amap`، `jsapi` و `skill` است؛ بنابراین جست‌وجوی `map` برای `personal-map` تطبیق واژگانی قوی‌تری نسبت به `amap-jsapi-skill` ایجاد می‌کند.
- محبوبیت در مقیاس لگاریتمی محاسبه و سقف‌گذاری می‌شود. Skills با تعامل بالا ممکن است هنگامی که متن پرس‌وجو تطبیق ضعیف‌تری دارد، رتبه پایین‌تری بگیرند.
- وضعیت نظارتی مشکوک یا پنهان، بسته به فیلترهای فراخواننده و وضعیت فعلی نظارت، می‌تواند یک Skill را از جست‌وجوی عمومی حذف کند.

راهنمای قابلیت کشف برای ناشران:

- عبارت‌هایی را که کاربران دقیقاً جست‌وجو خواهند کرد در نام نمایشی، خلاصه و برچسب‌ها قرار دهید. فقط زمانی از یک توکن مستقل اسلاگ استفاده کنید که هویت پایداری نیز باشد که قصد حفظ آن را دارید.
- فقط برای دنبال‌کردن یک پرس‌وجو، اسلاگ را تغییر نام ندهید؛ مگر اینکه اسلاگ جدید نام مرجع بلندمدت بهتری باشد. اسلاگ‌های قدیمی به نام‌های مستعار تغییرمسیر تبدیل می‌شوند، اما URL مرجع، اسلاگ نمایش‌داده‌شده و خلاصه‌های جست‌وجوی آینده از اسلاگ جدید استفاده می‌کنند.
- نام‌های مستعار تغییرنام، تفکیک مسیر را برای URLهای قدیمی و نصب‌هایی که از طریق رجیستری تفکیک می‌شوند حفظ می‌کنند، اما رتبه‌بندی جست‌وجو پس از نمایه‌شدن تغییرنام بر اساس فراداده مرجع Skill انجام می‌شود. آمار موجود همراه Skill باقی می‌ماند.
- اگر یک Skill به‌طور غیرمنتظره نامرئی است، پیش از تغییر فراداده مرتبط با رتبه‌بندی، در حالت واردشده ابتدا وضعیت نظارت را با `clawhub inspect @owner/slug` بررسی کنید.

### `GET /api/v1/skills`

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–200)
- `cursor` (اختیاری): نشانگر صفحه‌بندی برای هر مرتب‌سازی غیر از `trending`
- `sort` (اختیاری): ‏`updated` (پیش‌فرض)، `recommended` (نام مستعار: `default`)، `createdAt` (نام مستعار: `newest`)، `downloads`، `stars` (نام مستعار: `rating`)؛ نام‌های مستعار قدیمی نصب `installsCurrent`/`installs`/`installsAllTime` به `downloads` نگاشت می‌شوند؛ `trending`
- `nonSuspiciousOnly` (اختیاری): ‏`true` برای پنهان‌کردن Skills مشکوک (`flagged.suspicious`)
- `nonSuspicious` (اختیاری): نام مستعار قدیمی برای `nonSuspiciousOnly`

مقادیر نامعتبر `sort`، ‏`400` را برمی‌گردانند.

نکته‌ها:

- `recommended` از سیگنال‌های تعامل و تازگی استفاده می‌کند.
- `trending` بر اساس نصب‌ها در 7 روز گذشته رتبه‌بندی می‌کند (مبتنی بر تله‌متری).
- `createdAt` برای خزش Skills جدید پایدار است؛ `updated` با انتشار مجدد Skills موجود تغییر می‌کند.
- هنگامی که `nonSuspiciousOnly=true`، مرتب‌سازی‌های مبتنی بر نشانگر ممکن است در یک صفحه کمتر از `limit` مورد برگردانند، زیرا Skills مشکوک پس از بازیابی صفحه فیلتر می‌شوند.
- در صورت وجود، برای ادامه صفحه‌بندی از `nextCursor` استفاده کنید. کوتاه‌بودن یک صفحه به‌تنهایی به‌معنای پایان نتایج نیست.

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

- اسلاگ‌های قدیمی ایجادشده توسط جریان‌های تغییرنام/ادغام مالک به Skill مرجع تفکیک می‌شوند.
- `metadata.os`: محدودیت‌های سیستم‌عامل اعلام‌شده در فرانت‌متر Skill (برای نمونه `["macos"]`، `["linux"]`). اگر اعلام نشده باشد، `null`.
- `metadata.systems`: اهداف سیستم Nix (برای نمونه `["aarch64-darwin", "x86_64-linux"]`). اگر اعلام نشده باشد، `null`.
- اگر Skill هیچ فراداده پلتفرمی نداشته باشد، `metadata` برابر با `null` است.
- `moderation` فقط زمانی گنجانده می‌شود که Skill علامت‌گذاری شده باشد یا مالک در حال مشاهده آن باشد.

### `GET /api/v1/skills/{slug}/moderation`

وضعیت ساختاریافته نظارت را برمی‌گرداند.

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

- مالکان و ناظران می‌توانند به جزئیات نظارت برای Skills پنهان دسترسی داشته باشند.
- فراخوانندگان عمومی فقط برای Skills قابل‌مشاهده‌ای که از قبل علامت‌گذاری شده‌اند، `200` را دریافت می‌کنند.
- شواهد برای فراخوانندگان عمومی ویرایش می‌شوند و قطعه‌های خام فقط برای مالکان/ناظران در دسترس‌اند.

### `POST /api/v1/skills/{slug}/report`

یک Skill را برای بررسی ناظر گزارش کنید. گزارش‌ها در سطح Skill هستند، می‌توانند به‌صورت اختیاری
به یک نسخه پیوند داده شوند و وارد صف گزارش Skill می‌شوند.

احراز هویت:

- به توکن API نیاز دارد.

درخواست:

```json
{ "reason": "گام نصب مشکوک", "version": "1.2.3" }
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

نقطه پایانی ناظر/مدیر برای دریافت گزارش‌های Skill.

پارامترهای پرس‌وجو:

- `status` (اختیاری): ‏`open` (پیش‌فرض)، `confirmed`، `dismissed` یا `all`
- `limit` (اختیاری): عدد صحیح (1-200)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

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
      "reason": "مرحله نصب مشکوک",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "گزارش‌دهنده"
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

نقطه پایانی ناظر/مدیر برای حل‌وفصل یا بازگشایی گزارش‌های Skills.

درخواست:

```json
{ "status": "confirmed", "note": "بررسی شد و نسخه تحت‌تأثیر پنهان شد.", "finalAction": "hide" }
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام
بازگرداندن `status` به `open` می‌توان آن را حذف کرد. برای پنهان‌کردن Skill در همان گردش‌کار قابل‌ممیزی، `finalAction: "hide"` را همراه با یک
گزارش بررسی‌شده ارسال کنید.

### `GET /api/v1/skills/{slug}/versions`

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

### `GET /api/v1/skills/{slug}/versions/{version}`

فراداده نسخه + فهرست فایل‌ها را برمی‌گرداند.

- `version.security` در صورت موجودبودن، شامل وضعیت عادی‌سازی‌شده تأیید اسکن و جزئیات اسکنر
  (VirusTotal + LLM) است.

### `GET /api/v1/skills/{slug}/scan`

جزئیات تأیید اسکن امنیتی یک نسخه Skill را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): حل یک نسخه برچسب‌خورده (برای مثال `latest`).

نکات:

- اگر نه `version` و نه `tag` ارائه نشده باشد، از آخرین نسخه استفاده می‌شود.
- شامل وضعیت عادی‌سازی‌شده تأیید به‌همراه جزئیات مختص هر اسکنر است.
- `security.hasScanResult` فقط زمانی `true` است که یک اسکنر رأی قطعی (`clean`، `suspicious` یا `malicious`) صادر کرده باشد.
- `moderation` یک نمای فوری فعلی از نظارت در سطح Skill است که از آخرین نسخه مشتق شده است.
- هنگام پرس‌وجوی یک نسخه تاریخی، پیش از درنظرگرفتن `moderation` و `security` به‌عنوان یک زمینه نسخه یکسان، `moderation.matchesRequestedVersion` و `moderation.sourceVersion` را بررسی کنید.

### `POST /api/v1/skills/-/scan`

نقطه پایانی احرازهویت‌شده ارسال برای کارهای جدید ClawScan.

اسکن بارگذاری‌های محلی دیگر پشتیبانی نمی‌شود. درخواست‌هایی که از
`multipart/form-data` یا `{ "source": { "kind": "upload" } }` استفاده کنند، `410` را برمی‌گردانند.

اسکن‌های منتشرشده از JSON استفاده می‌کنند:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

نکات:

- بارهای درخواست اسکن و گزارش‌های قابل‌بارگیری، پس از بازه نگه‌داری از مخزن درخواست اسکن منقضی می‌شوند.
- اسکن‌های منتشرشده به دسترسی مدیریتی مالک/ناشر یا اختیار ناظر/مدیر پلتفرم نیاز دارند.
- اسکن‌های منتشرشده فقط زمانی نتیجه را بازنویسی می‌کنند که `update: true` باشد و اسکن با موفقیت تکمیل شود.
- پاسخ، `202` همراه با `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` است.
- کارهای اسکن ناهمگام هستند. درخواست‌های اسکن دستی پیش از کار عادی انتشار/پُرکردن عقب‌افتادگی در اولویت قرار می‌گیرند، اما تکمیل همچنان به دردسترس‌بودن Worker بستگی دارد.

### `GET /api/v1/skills/-/scan/{scanId}`

نقطه پایانی احرازهویت‌شده نظرسنجی برای یک اسکن ارسال‌شده.

- وضعیت در صف/در حال اجرا/موفق/ناموفق را برمی‌گرداند.
- در زمان قرارداشتن در صف، `queue.queuedAhead` و `queue.position` را برمی‌گرداند تا کلاینت‌ها بتوانند تعداد اسکن‌های دستی اولویت‌دار جلوتر از درخواست را نمایش دهند. صف‌های بسیار بزرگ محدود می‌شوند و با `queuedAheadIsEstimate: true` گزارش می‌شوند.
- در صورت موجودبودن، `report` شامل بخش‌های `clawscan`، `skillspector`، `staticAnalysis` و `virustotal` است.
- کارهای اسکن ناموفق، `status: "failed"` را همراه با `lastError` برمی‌گردانند.

### `GET /api/v1/skills/-/scan/{scanId}/download`

نقطه پایانی احرازهویت‌شده بایگانی گزارش.

- به یک اسکن موفق نیاز دارد؛ اسکن‌های غیرنهایی `409` را برمی‌گردانند.
- یک فایل ZIP شامل `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json` و `README.md` برمی‌گرداند.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

نقطه پایانی احرازهویت‌شده بایگانی گزارش ذخیره‌شده برای نسخه‌های ارسال‌شده.

- به دسترسی مدیریتی مالک/ناشر برای Skill یا Plugin، یا اختیار ناظر/مدیر پلتفرم نیاز دارد.
- نتایج اسکن ذخیره‌شده نسخه دقیق ارسال‌شده، از جمله نسخه‌های مسدود یا پنهان، را برمی‌گرداند.
- `kind` به‌طور پیش‌فرض `skill` است؛ برای اسکن‌های Plugin/بسته از `kind=plugin` استفاده کنید.
- همان ساختار ZIP بارگیری‌های درخواست اسکن را برمی‌گرداند.

### `POST /api/v1/skills/-/scan/batch`

مسیر متعارف اسکن مجدد دسته‌ای مختص مدیر. این مسیر همان ساختار بار legacy `POST /api/v1/skills/-/rescan-batch` را می‌پذیرد.

### `POST /api/v1/skills/-/scan/batch/status`

مسیر متعارف وضعیت دسته‌ای مختص مدیر. این مسیر `{ "jobIds": ["..."] }` را می‌پذیرد و همان شمارنده‌های تجمیعی legacy `POST /api/v1/skills/-/rescan-batch/status` را برمی‌گرداند.

### `GET /api/v1/skills/{slug}/verify`

پوش تأیید Skill Card مورداستفاده `clawhub skill verify` را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `version` (اختیاری): رشته نسخه مشخص.
- `tag` (اختیاری): حل یک نسخه برچسب‌خورده (برای مثال `latest`).

نکات:

- `ok` فقط زمانی `true` است که نسخه انتخاب‌شده دارای Skill Card تولیدشده باشد، توسط نظارت به‌دلیل بدافزار مسدود نشده باشد و تأیید ClawScan پاک باشد.
- هویت Skill، هویت ناشر و فراداده نسخه انتخاب‌شده، فیلدهای سطح بالای پوش (`slug`، `displayName`، `publisherHandle`، `version`، `resolvedFrom`، `tag`، `createdAt`) هستند تا خودکارسازی پوسته بتواند بدون بازکردن پوش‌های تودرتو آن‌ها را بخواند.
- `security` رأی سطح بالای ClawScan/امنیت است. خودکارسازی باید بر مبنای `ok`، `decision`، `reasons` و `security.status` عمل کند.
- `security.signals` شامل شواهد پشتیبان اسکنر مانند `staticScan`، `virusTotal` و `skillSpector` است.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود در رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- `provenance` فقط زمانی `server-resolved-github-import` است که ClawHub هنگام انتشار یا واردکردن، مخزن/ref/commit/path مربوط به GitHub را حل و ذخیره کرده باشد؛ در غیر این صورت `unavailable` است.

### `POST /api/v1/skills/-/security-verdicts`

رأی‌های امنیتی فشرده فعلی را برای نسخه‌های دقیق Skill برمی‌گرداند. این
نقطه پایانی مجموعه برای کلاینت‌هایی در نظر گرفته شده است که از قبل می‌دانند کدام نسخه‌های نصب‌شده
Skills در ClawHub را باید نمایش دهند، مانند رابط کنترل OpenClaw.

درخواست:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

نکات:

- `items` باید شامل 1-100 جفت یکتای `{ slug, version }` باشد.
- نتایج برای هر مورد جداگانه هستند؛ نبود یک Skill یا نسخه باعث شکست کل پاسخ نمی‌شود.
- پاسخ فقط امنیتی است. این پاسخ شامل داده‌های Skill Card، وضعیت کارت تولیدشده، فهرست فایل‌های آرتیفکت یا بارهای تفصیلی اسکنر نمی‌شود.
- `security.signals` فقط شامل شواهد پشتیبان در سطح وضعیت است؛ برای جزئیات کامل اسکنر از `/scan` یا صفحه ممیزی امنیتی ClawHub استفاده کنید.
- `security.signals.dependencyRegistry` برای سازگاری پاسخ v1 حفظ شده است، اما اسکنر وجود در رجیستری وابستگی بازنشسته شده و این کلید همیشه `null` است.
- نبود Skill Card بر `ok`، `decision` یا `reasons` این نقطه پایانی اثری ندارد؛ کلاینت‌ها هنگام نیاز به محتوای کارت باید `skill-card.md` نصب‌شده را به‌صورت محلی بخوانند.
- وقتی به پوش تأیید Skill Card برای یک Skill نیاز دارید از `/verify`، وقتی به Markdown کارت تولیدشده نیاز دارید از `/card` و وقتی به داده‌های تفصیلی اسکنر نیاز دارید از `/scan` استفاده کنید.

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
      "error": { "code": "version_not_found", "message": "نسخه یافت نشد" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

محتوای متن خام را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌طور پیش‌فرض از آخرین نسخه استفاده می‌شود.
- محدودیت اندازه فایل: 200KB.

### `GET /api/v1/packages`

نقطه پایانی یکپارچه کاتالوگ برای:

- Skills
- Pluginهای کد
- Pluginهای بسته‌ای

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی
- `family` (اختیاری): `skill`، `code-plugin` یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community` یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `updated` (پیش‌فرض)، `recommended`، `trending`، `downloads`، نام مستعار legacy یعنی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. فقط زمانی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود باشد (`/api/v1/plugins`،
  `/api/v1/code-plugins`، `/api/v1/bundle-plugins` یا نقاط پایانی بسته با
  `family=code-plugin`/`family=bundle-plugin`). دسته‌بندی‌های کنترل‌شده و
  نام‌های مستعار فیلتر legacy نسخه v1 در بخش `GET /api/v1/plugins` مستند شده‌اند.

نکات:

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured`،
  `highlightedOnly` یا `sort`، `400` را برمی‌گردانند. پارامترهای پرس‌وجوی ناشناخته نادیده گرفته می‌شوند.
- `GET /api/v1/code-plugins` و `GET /api/v1/bundle-plugins` به‌عنوان نام‌های مستعار خانواده ثابت باقی می‌مانند.
- ورودی‌های Skill همچنان بر رجیستری Skill متکی هستند و فقط از طریق `POST /api/v1/skills` قابل انتشارند.
- `POST /api/v1/packages` همچنان فقط برای انتشارهای Plugin کد و Plugin بسته‌ای است.
- فراخوانندگان ناشناس فقط کانال‌های عمومی بسته را می‌بینند.
- فراخوانندگان احرازهویت‌شده می‌توانند در نتایج فهرست/جست‌وجو، بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند ببینند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخواننده احرازهویت‌شده اجازه خواندنشان را دارد.

### `GET /api/v1/packages/search`

جست‌وجوی یکپارچه کاتالوگ در Skills + بسته‌های Plugin.

پارامترهای پرس‌وجو:

- `q` (الزامی): رشتهٔ پرس‌وجو
- `limit` (اختیاری): عدد صحیح (1–100)
- `family` (اختیاری): `skill`، `code-plugin` یا `bundle-plugin`
- `channel` (اختیاری): `official`، `community` یا `private`
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. فقط هنگامی پشتیبانی می‌شود که
  درخواست به بسته‌های Plugin محدود شده باشد. دسته‌بندی‌های کنترل‌شده و نام‌های مستعار قدیمی فیلتر v1
  در بخش `GET /api/v1/plugins` مستند شده‌اند.

نکته‌ها:

- مقادیر نامعتبر برای `family`، `channel`، `isOfficial`، `featured` یا
  `highlightedOnly` مقدار `400` را برمی‌گردانند. پارامترهای ناشناختهٔ پرس‌وجو نادیده گرفته می‌شوند.
- فراخوان‌های ناشناس فقط کانال‌های عمومی بسته‌ها را می‌بینند.
- فراخوان‌های احراز هویت‌شده می‌توانند بسته‌های خصوصی ناشرانی را که به آن‌ها تعلق دارند جست‌وجو کنند.
- `channel=private` فقط بسته‌هایی را برمی‌گرداند که فراخوان احراز هویت‌شده اجازهٔ خواندنشان را دارد.

### `GET /api/v1/plugins`

مرور کاتالوگ صرفاً ویژهٔ Plugin در میان بسته‌های code-plugin و bundle-plugin.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی
- `isOfficial` (اختیاری): `true` یا `false`
- `sort` (اختیاری): `recommended` (پیش‌فرض)، `trending`، `downloads`، `updated`، نام مستعار قدیمی `installs`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقادیر کنونی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نام‌های مستعار قدیمی فیلتر v1 همچنان در نقطه‌های پایانی خواندن پذیرفته می‌شوند:

- `mcp-tooling`، `data` و `automation` به `tools` نگاشت می‌شوند.
- `observability` و `deployment` به `gateway` نگاشت می‌شوند.
- `dev-tools` به `runtime` نگاشت می‌شود.

`trending` یک جدول رتبه‌بندی هفت‌روزهٔ نصب/بارگیری است و از مجموع کل دوره استفاده نمی‌کند.
در نقطهٔ پایانی یکپارچهٔ `/api/v1/packages`، این قابلیت فقط ویژهٔ Plugin است؛ برای کاتالوگ مهارت
از `/api/v1/skills?sort=trending` استفاده کنید.

نام‌های مستعار قدیمی به‌عنوان مقادیر ذخیره‌شده یا اعلام‌شده توسط نویسنده برای دسته‌بندی پذیرفته نمی‌شوند.

### `GET /api/v1/skills/export`

صدور گروهی جدیدترین مهارت‌های عمومی برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای پرس‌وجو:

- `startDate` (الزامی): کران پایین برحسب میلی‌ثانیهٔ Unix برای `updatedAt` مهارت.
- `endDate` (الزامی): کران بالا برحسب میلی‌ثانیهٔ Unix برای `updatedAt` مهارت.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.

پاسخ:

- بدنه: بایگانی ZIP.
- ریشهٔ هر مهارت صادرشده در `{publisher}/{slug}/` قرار دارد.
- مهارت‌های میزبانی‌شده شامل فایل‌های جدیدترین نسخهٔ ذخیره‌شده هستند و در
  `_manifest.json` با `sourceRef: "public-clawhub"` فهرست می‌شوند.
- مهارت‌های کنونی مبتنی بر GitHub که اسکن `clean` یا `suspicious` دارند، شامل
  `_source_handoff.json` همراه با `sourceRef: "public-github"`، مخزن، کامیت، مسیر،
  هش محتوا و نشانی اینترنتی بایگانی هستند. آن‌ها شامل فایل‌های منبع میزبانی‌شده در ClawHub نیستند.
- هر مهارت شامل `_export_skill_meta.json` است.
- `_manifest.json` همیشه در ریشهٔ ZIP گنجانده می‌شود.
- `_errors.json` هنگامی گنجانده می‌شود که مهارت‌ها یا فایل‌های منفرد قابل
  صدور نباشند.

سرآیندها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

صدور گروهی جدیدترین انتشارهای عمومی Plugin برای تحلیل آفلاین.

احراز هویت:

- توکن API الزامی است.

پارامترهای پرس‌وجو:

- `startDate` (الزامی): کران پایین برحسب میلی‌ثانیهٔ Unix برای `updatedAt` در Plugin.
- `endDate` (الزامی): کران بالا برحسب میلی‌ثانیهٔ Unix برای `updatedAt` در Plugin.
- `limit` (اختیاری): عدد صحیح (1-250)، پیش‌فرض `250`.
- `cursor` (اختیاری): نشانگر صفحه‌بندی از پاسخ قبلی.
- `family` (اختیاری): `code-plugin` یا `bundle-plugin`. حذف آن به‌معنای هر دو
  خانوادهٔ Plugin است.

پاسخ:

- بدنه: بایگانی ZIP.
- ریشهٔ هر Plugin صادرشده در `{family}/{packageName}/` قرار دارد.
- هر Plugin صادرشده شامل فایل‌های ذخیره‌شدهٔ جدیدترین انتشار است.
- فرادادهٔ صدور هر Plugin در
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` ذخیره می‌شود.
- `_manifest.json` همیشه در ریشهٔ ZIP گنجانده می‌شود.
- `_errors.json` هنگامی گنجانده می‌شود که Pluginها یا فایل‌های منفرد قابل
  صدور نباشند.

سرآیندها:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

جست‌وجوی صرفاً ویژهٔ Plugin در میان بسته‌های code-plugin و bundle-plugin.

پارامترهای پرس‌وجو:

- `q` (الزامی): رشتهٔ پرس‌وجو
- `limit` (اختیاری): عدد صحیح (1-100)
- `isOfficial` (اختیاری): `true` یا `false`
- `category` (اختیاری): فیلتر دسته‌بندی Plugin. مقادیر کنونی:
  `channels`، `models`، `memory`، `context`، `voice`، `media`، `web`،
  `tools`، `runtime`، `gateway`، `security`، `other`.

نکته‌ها:

- نام‌های مستعار قدیمی فیلتر v1 که در بخش `GET /api/v1/plugins` مستند شده‌اند نیز
  پذیرفته می‌شوند.
- فیلتر دسته‌بندی یک فیلتر واقعی API است که ردیف‌های چکیدهٔ دسته‌بندی Plugin از آن پشتیبانی می‌کنند،
  نه بازنویسی پرس‌وجوی جست‌وجو.
- نتایج به‌ترتیب ارتباط برگردانده می‌شوند و در حال حاضر صفحه‌بندی نمی‌شوند.
- کنترل‌های مرتب‌سازی رابط کاربری مرورگر برای جست‌وجوی Plugin، نتایج بارگذاری‌شده را بر اساس ارتباط دوباره مرتب می‌کنند؛
  این رفتار با مرور کنونی `/skills` مطابقت دارد.

### `GET /api/v1/packages/{name}`

فرادادهٔ جزئیات بسته را برمی‌گرداند.

نکته‌ها:

- مهارت‌ها نیز می‌توانند در کاتالوگ یکپارچه از طریق این مسیر تفکیک شوند.
- بسته‌های خصوصی مقدار `404` را برمی‌گردانند، مگر اینکه فراخوان اجازهٔ خواندن ناشر مالک را داشته باشد.

### `DELETE /api/v1/packages/{name}`

یک بسته و همهٔ انتشارهایش را به‌صورت نرم حذف می‌کند.

نکته‌ها:

- به توکن API متعلق به مالک بسته، مالک/مدیر ناشر سازمانی،
  ناظر پلتفرم یا مدیر پلتفرم نیاز دارد.

### `GET /api/v1/packages/{name}/versions`

تاریخچهٔ نسخه‌ها را برمی‌گرداند.

پارامترهای پرس‌وجو:

- `limit` (اختیاری): عدد صحیح (1–100)
- `cursor` (اختیاری): نشانگر صفحه‌بندی

نکته‌ها:

- بسته‌های خصوصی مقدار `404` را برمی‌گردانند، مگر اینکه فراخوان اجازهٔ خواندن ناشر مالک را داشته باشد.

### `GET /api/v1/packages/{name}/versions/{version}`

یک نسخهٔ بسته را، شامل فرادادهٔ فایل، سازگاری،
تأیید، فرادادهٔ مصنوع و داده‌های اسکن، برمی‌گرداند.

نکته‌ها:

- `version.artifact.kind` برای بایگانی‌های بستهٔ قدیمی `legacy-zip` و برای
  انتشارهای مبتنی بر ClawPack برابر با `npm-pack` است.
- انتشارهای ClawPack شامل فیلدهای سازگار با npm یعنی `npmIntegrity`، `npmShasum` و
  `npmTarballName` هستند.
- `version.sha256hash` فرادادهٔ سازگاری منسوخ‌شده برای کلاینت‌های قدیمی است. این مقدار
  دقیقاً بایت‌های ZIP برگردانده‌شده توسط `/api/v1/packages/{name}/download` را هش می‌کند.
  کلاینت‌های مدرن باید از `version.artifact.sha256` استفاده کنند که
  مصنوع متعارف انتشار را مشخص می‌کند.
- `version.vtAnalysis`، `version.llmAnalysis` و `version.staticScan`
  هنگام وجود داده‌های اسکن گنجانده می‌شوند.
- بسته‌های خصوصی مقدار `404` را برمی‌گردانند، مگر اینکه فراخوان اجازهٔ خواندن ناشر مالک را داشته باشد.

### `GET /api/v1/packages/{name}/versions/{version}/security`

خلاصهٔ دقیق امنیت و اعتماد مصنوع انتشار یک نسخهٔ بسته را برای کلاینت‌های
نصب برمی‌گرداند. این سطح مصرف عمومی OpenClaw برای تصمیم‌گیری دربارهٔ امکان
نصب یک انتشار تفکیک‌شده است.

احراز هویت:

- نقطهٔ پایانی خواندن عمومی است. هیچ توکن مالک، ناشر، ناظر یا مدیر
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

- `package.name`، `package.displayName` و `package.family`
  بستهٔ تفکیک‌شدهٔ رجیستری را مشخص می‌کنند.
- `release.releaseId`، `release.version` و `release.createdAt`
  انتشار دقیقی را که ارزیابی شده است مشخص می‌کنند.
- `release.artifactKind`، `release.artifactSha256`، `release.npmIntegrity`،
  `release.npmShasum` و `release.npmTarballName` در صورت شناخته‌بودن برای
  مصنوع انتشار وجود دارند.
- `trust.scanStatus` وضعیت مؤثر اعتماد است که از ورودی‌های اسکنر
  و نظارت دستی انتشار به‌دست می‌آید.
- `trust.moderationState` می‌تواند تهی باشد. هنگامی که نظارت دستی بر انتشار
  وجود نداشته باشد، مقدار آن `null` است.
- `trust.blockedFromDownload` سیگنال مسدودسازی نصب است. OpenClaw و سایر
  کلاینت‌های نصب باید هنگامی که این مقدار `true` است، نصب را مسدود کنند؛ نه اینکه
  قواعد مسدودسازی را از فیلدهای اسکنر یا نظارت دوباره استخراج کنند.
- `trust.reasons` فهرست توضیحات کاربرمحور و ممیزی است. کدهای دلیل
  رشته‌هایی پایدار و فشرده مانند `manual:quarantined`، `scan:malicious`
  و `package:malicious` هستند.
- `trust.pending` یعنی یک یا چند ورودی اعتماد همچنان در انتظار تکمیل هستند.
- `trust.stale` یعنی خلاصهٔ اعتماد از ورودی‌های منسوخ محاسبه شده است و
  پیش از تصمیم‌گیری برای اجازه با اطمینان بالا، باید نیازمند تازه‌سازی تلقی شود.

نکته‌ها:

- این نقطهٔ پایانی دقیقاً به نسخه وابسته است. کلاینت‌ها باید پس از تفکیک نسخهٔ
  بسته‌ای که قصد نصبش را دارند آن را فراخوانی کنند، نه صرفاً پس از خواندن جدیدترین
  فرادادهٔ بسته.
- بسته‌های خصوصی مقدار `404` را برمی‌گردانند، مگر اینکه فراخوان اجازهٔ خواندن ناشر مالک را داشته باشد.
- این نقطهٔ پایانی عمداً محدودتر از نقطه‌های پایانی نظارت مالک/ناظر
  است. این نقطه تصمیم نصب و توضیح عمومی را در معرض دید قرار می‌دهد، نه
  هویت گزارش‌دهندگان، متن گزارش‌ها، شواهد خصوصی یا جدول‌های زمانی بازبینی
  داخلی را.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

فرادادهٔ صریح تفکیک‌کنندهٔ مصنوع را برای یک نسخهٔ بسته برمی‌گرداند.

نکته‌ها:

- نسخه‌های قدیمی بسته یک مصنوع `legacy-zip` و یک
  `downloadUrl` قدیمی ZIP را برمی‌گردانند.
- نسخه‌های ClawPack یک مصنوع `npm-pack`، فیلدهای یکپارچگی npm، یک
  `tarballUrl` و نشانی اینترنتی قدیمی سازگاری ZIP را برمی‌گردانند.
- این سطح تفکیک‌کنندهٔ OpenClaw است؛ از حدس‌زدن قالب بایگانی بر اساس
  یک نشانی اینترنتی مشترک جلوگیری می‌کند.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

مصنوع نسخه را از طریق مسیر صریح تفکیک‌کننده بارگیری می‌کند.

نکته‌ها:

- نسخه‌های ClawPack دقیقاً بایت‌های npm-pack بارگذاری‌شدهٔ `.tgz` را استریم می‌کنند.
- نسخه‌های ZIP قدیمی به `/api/v1/packages/{name}/download?version=` هدایت می‌شوند.
- از سهمیهٔ نرخ دانلود استفاده می‌کند.

### `GET /api/v1/packages/{name}/readiness`

آمادگی محاسبه‌شده برای استفادهٔ آیندهٔ OpenClaw را برمی‌گرداند.

بررسی‌های آمادگی شامل موارد زیر است:

- وضعیت کانال رسمی
- در دسترس‌بودن آخرین نسخه
- در دسترس‌بودن آرتیفکت npm-pack مربوط به ClawPack
- چکیدهٔ آرتیفکت
- منشأ مخزن منبع و کامیت
- فرادادهٔ سازگاری OpenClaw
- مقصدهای میزبان
- وضعیت اسکن

پاسخ:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin نمونه",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "آرتیفکت ClawPack",
      "status": "fail",
      "message": "آخرین نسخه فقط به‌صورت ZIP قدیمی ارائه شده است."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

نقطهٔ پایانی ناظر برای فهرست‌کردن ردیف‌های مهاجرت Plugin رسمی OpenClaw.

احراز هویت:

- به توکن API متعلق به کاربر ناظر یا مدیر نیاز دارد.

پارامترهای کوئری:

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
      "blockers": ["ClawPack موجود نیست"],
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

نقطهٔ پایانی مدیر برای ایجاد یا به‌روزرسانی یک ردیف مهاجرت Plugin رسمی.

احراز هویت:

- به توکن API متعلق به کاربر مدیر نیاز دارد.

بدنهٔ درخواست:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["ClawPack موجود نیست"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "در انتظار بارگذاری ناشر"
}
```

نکات:

- `bundledPluginId` به حروف کوچک نرمال‌سازی می‌شود و کلید پایدار upsert است.
- `packageName` مطابق نام npm نرمال‌سازی می‌شود؛ برای مهاجرت‌های
  برنامه‌ریزی‌شده ممکن است بسته وجود نداشته باشد.
- این فقط آمادگی مهاجرت را پیگیری می‌کند. OpenClaw را تغییر نمی‌دهد و
  ClawPack تولید نمی‌کند.

### `GET /api/v1/packages/moderation/queue`

نقطهٔ پایانی ناظر/مدیر برای صف‌های بررسی انتشار بسته.

احراز هویت:

- به توکن API متعلق به کاربر ناظر یا مدیر نیاز دارد.

پارامترهای کوئری:

- `status` (اختیاری): `open` (پیش‌فرض)، `blocked`، `manual`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

معانی وضعیت‌ها:

- `open`: انتشارهای مشکوک، مخرب، در انتظار، قرنطینه‌شده، لغوشده یا گزارش‌شده.
- `blocked`: انتشارهای قرنطینه‌شده، لغوشده یا مخرب.
- `manual`: هر انتشار دارای بازنویسی دستی نظارت.
- `all`: هر انتشار دارای بازنویسی دستی، وضعیت اسکن غیرپاک یا گزارش بسته.

پاسخ:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Plugin نمونه",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "بررسی دستی",
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

یک بسته را برای بررسی ناظر گزارش می‌کند. گزارش‌ها در سطح بسته هستند و می‌توانند
به‌صورت اختیاری به یک نسخه پیوند داده شوند. آن‌ها صف نظارت را تغذیه می‌کنند، اما به‌تنهایی
موجب پنهان‌شدن خودکار یا مسدودشدن دانلودها نمی‌شوند؛ ناظران باید برای
تأیید، قرنطینه یا لغو آرتیفکت‌ها از نظارت انتشار استفاده کنند.

احراز هویت:

- به توکن API نیاز دارد.

درخواست:

```json
{ "reason": "فایل باینری بومی مشکوک", "version": "1.2.3" }
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

- به توکن API متعلق به کاربر ناظر یا مدیر نیاز دارد.

پارامترهای کوئری:

- `status` (اختیاری): `open` (پیش‌فرض)، `confirmed`، `dismissed`، یا `all`
- `limit` (اختیاری): عدد صحیح (1-100)
- `cursor` (اختیاری): مکان‌نمای صفحه‌بندی

پاسخ:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Plugin نمونه",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "فایل باینری بومی مشکوک",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "گزارش‌دهنده"
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

- به توکن API متعلق به مالک بسته، عضو ناشر، ناظر یا
  کاربر مدیر نیاز دارد.

پاسخ:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin نمونه",
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
    "moderationReason": "بررسی دستی",
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
  "note": "انتشار متأثر بررسی و قرنطینه شد.",
  "finalAction": "quarantine"
}
```

`note` برای `confirmed` و `dismissed` الزامی است؛ هنگام
بازگرداندن `status` به `open` می‌توان آن را حذف کرد. برای اعمال نظارت انتشار
در همان گردش‌کار قابل‌ممیزی، `finalAction: "quarantine"` یا
`finalAction: "revoke"` را همراه با گزارش تأییدشده ارسال کنید.

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

نقطهٔ پایانی ناظر/مدیر برای بررسی انتشار بسته.

درخواست:

```json
{ "state": "quarantined", "reason": "محمولهٔ بومی مشکوک." }
```

وضعیت‌های پشتیبانی‌شده:

- `approved`: به‌صورت دستی بررسی و مجاز شده است.
- `quarantined`: تا زمان پیگیری مسدود شده است.
- `revoked`: پس از آنکه انتشار قبلاً قابل‌اعتماد بود، مسدود شده است.

مسیرهای دانلود آرتیفکت برای انتشارهای قرنطینه‌شده و لغوشده، `403` را برمی‌گردانند.
هر تغییر یک ورودی در گزارش ممیزی ثبت می‌کند.

### `GET /api/v1/packages/{name}/file`

محتوای متنی خام یک فایل بسته را برمی‌گرداند.

پارامترهای کوئری:

- `path` (الزامی)
- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌طور پیش‌فرض از آخرین انتشار استفاده می‌کند.
- از سهمیهٔ نرخ خواندن استفاده می‌کند، نه سهمیهٔ دانلود.
- فایل‌های باینری `415` را برمی‌گردانند.
- محدودیت اندازهٔ فایل: 200KB.
- اسکن‌های در انتظار VirusTotal خواندن را مسدود نمی‌کنند؛ ممکن است انتشارهای مخرب همچنان در بخش دیگری ارائه نشوند.
- بسته‌های خصوصی `404` را برمی‌گردانند، مگر اینکه فراخواننده بتواند ناشر مالک را بخواند.

### `GET /api/v1/packages/{name}/download`

آرشیو ZIP قطعی قدیمی را برای یک انتشار بسته دانلود می‌کند.

پارامترهای کوئری:

- `version` (اختیاری)
- `tag` (اختیاری)

نکات:

- به‌طور پیش‌فرض از آخرین انتشار استفاده می‌کند.
- Skills به `GET /api/v1/download` هدایت می‌شوند.
- آرشیوهای Plugin/بسته، فایل‌های zip با ریشهٔ `package/` هستند تا کلاینت‌های قدیمی OpenClaw
  همچنان کار کنند.
- این مسیر فقط ZIP باقی می‌ماند. فایل‌های `.tgz` مربوط به ClawPack را استریم نمی‌کند.
- پاسخ‌ها برای بررسی یکپارچگی تفکیک‌کننده شامل هدرهای `ETag`، `Digest`، `X-ClawHub-Artifact-Type` و
  `X-ClawHub-Artifact-Sha256` هستند.
- فرادادهٔ مختص رجیستری به آرشیو دانلودشده تزریق نمی‌شود.
- اسکن‌های در انتظار VirusTotal دانلودها را مسدود نمی‌کنند؛ انتشارهای مخرب `403` را برمی‌گردانند.
- بسته‌های خصوصی `404` را برمی‌گردانند، مگر اینکه فراخواننده مالک باشد.

### `GET /api/npm/{package}`

یک packument سازگار با npm برای نسخه‌های بستهٔ مبتنی بر ClawPack برمی‌گرداند.

نکات:

- فقط نسخه‌هایی که tarballهای npm-pack مربوط به ClawPack آن‌ها بارگذاری شده‌اند، فهرست می‌شوند.
- نسخه‌های قدیمیِ فقط ZIP عمداً حذف می‌شوند.
- `dist.tarball`، `dist.integrity` و `dist.shasum` از فیلدهای سازگار با npm
  استفاده می‌کنند تا کاربران در صورت تمایل بتوانند npm را به mirror هدایت کنند.
- packumentهای بسته‌های scoped هم از `/api/npm/@scope/name` و هم از مسیر درخواست
  کدگذاری‌شدهٔ `/api/npm/@scope%2Fname` مربوط به npm پشتیبانی می‌کنند.

### `GET /api/npm/{package}/-/{tarball}.tgz`

بایت‌های دقیق tarball بارگذاری‌شدهٔ ClawPack را برای کلاینت‌های mirror مربوط به npm استریم می‌کند.

نکات:

- از سهمیهٔ نرخ دانلود استفاده می‌کند.
- هدرهای دانلود شامل SHA-256 مربوط به ClawHub به‌همراه فرادادهٔ integrity/shasum مربوط به npm هستند.
- بررسی‌های نظارت و دسترسی به بستهٔ خصوصی همچنان اعمال می‌شوند.

### `GET /api/v1/resolve`

CLI از این مورد برای نگاشت یک اثر انگشت محلی به نسخه‌ای شناخته‌شده استفاده می‌کند.

پارامترهای کوئری:

- `slug` (الزامی)
- `hash` (الزامی): sha256 هگز 64 نویسه‌ای اثر انگشت باندل

پاسخ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

فایل ZIP یک نسخهٔ Skills میزبانی‌شده را دانلود می‌کند، یا برای یک Skills فعلیِ
مبتنی بر GitHub که اسکن `clean` یا `suspicious` دارد و فاقد نسخهٔ میزبانی‌شده است،
تحویل منبع GitHub را برمی‌گرداند.

پارامترهای کوئری:

- `slug` (الزامی)
- `version` (اختیاری): رشته semver
- `tag` (اختیاری): نام برچسب (برای مثال `latest`)

نکته‌ها:

- اگر نه `version` و نه `tag` ارائه شده باشد، از آخرین نسخه استفاده می‌شود.
- نسخه‌های حذف نرم، `410` را برمی‌گردانند.
- تحویل Skills مبتنی بر GitHub، بایت‌ها را پروکسی یا آینه نمی‌کند. پاسخ JSON
  شامل `sourceRef: "public-github"`، `repo`، `commit`، `path`، `contentHash`،
  و `archiveUrl` است؛ وضعیت اسکن/فعلی یک گیت است و در فراداده محموله
  موفقیت گنجانده نمی‌شود.
- آمار دانلود به‌صورت هویت‌های یکتا در هر روز UTC محاسبه می‌شود (وقتی توکن API معتبر باشد `userId`، در غیر این صورت IP).

## نقطه‌های پایانی احراز هویت (توکن Bearer)

همه نقطه‌های پایانی به مورد زیر نیاز دارند:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

توکن را اعتبارسنجی می‌کند و شناسه کاربر را برمی‌گرداند.

### `POST /api/v1/skills`

نسخه‌ای جدید منتشر می‌کند.

- روش ترجیحی: `multipart/form-data` با JSON در `payload` به‌همراه blobهای `files[]`.
- بدنه JSON دارای `files` (مبتنی بر storageId) نیز پذیرفته می‌شود.
- فیلد اختیاری محموله: `ownerHandle`. در صورت وجود، API آن
  ناشر را در سمت سرور تفکیک می‌کند و از عامل می‌خواهد دسترسی ناشر داشته باشد.
- فیلد اختیاری محموله: `migrateOwner`. وقتی `true` همراه با `ownerHandle` باشد،
  اگر عامل در هر دو ناشر فعلی و مقصد مدیر/مالک باشد، یک Skill موجود
  می‌تواند به آن مالک منتقل شود. بدون این رضایت صریح، تغییر مالک
  رد می‌شود.

### `POST /api/v1/packages`

یک انتشار code-plugin یا bundle-plugin را منتشر می‌کند.

- به احراز هویت با توکن Bearer نیاز دارد.
- به `multipart/form-data` نیاز دارد.
- فیلدهای مجاز فرم عبارت‌اند از `payload`، blobهای تکرارشونده `files`، یا یک ارجاع
  tarball در `clawpack`. مقدار `clawpack` می‌تواند یک blob در `.tgz` یا شناسه ذخیره‌سازی برگردانده‌شده
  توسط جریان upload-url باشد. انتشارهای مرحله‌بندی‌شده با شناسه ذخیره‌سازی باید
  `clawpackUploadTicket` برگردانده‌شده همراه آن URL بارگذاری را نیز شامل شوند.
- یا از `files` استفاده کنید یا از `clawpack`؛ هرگز هر دو را در یک درخواست به‌کار نبرید.
- بدنه‌های JSON و فراداده `payload.files` / `payload.artifact`
  ارائه‌شده توسط فراخواننده رد می‌شوند.
- درخواست‌های انتشار مستقیم multipart حداکثر به 18MB محدودند. tarballهای ClawPack می‌توانند
  تا سقف 120MB برای tarball از جریان upload-url استفاده کنند.
- فیلد اختیاری محموله: `ownerHandle`. در صورت وجود، فقط مدیران می‌توانند از طرف آن مالک منتشر کنند.

نکات برجسته اعتبارسنجی:

- `family` باید `code-plugin` یا `bundle-plugin` باشد.
- بسته‌های Plugin به `openclaw.plugin.json` نیاز دارند. بارگذاری‌های ClawPack در `.tgz` باید
  آن را در `package/openclaw.plugin.json` داشته باشند.
- Pluginهای کد به `package.json`، فراداده مخزن منبع، فراداده commit منبع،
  فراداده طرح‌واره پیکربندی، `openclaw.compat.pluginApi`، و
  `openclaw.build.openclawVersion` نیاز دارند.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
- فقط ناشر سازمانی `openclaw` و ناشران شخصی اعضای فعلی سازمان `openclaw`
  می‌توانند در کانال `official` منتشر کنند.
- انتشارهای نیابتی همچنان واجد شرایط بودن برای کانال رسمی را بر اساس حساب مالک مقصد اعتبارسنجی می‌کنند.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

حذف نرم / بازیابی یک Skill (مالک، ناظر، یا مدیر).

بدنه JSON اختیاری:

```json
{ "reason": "برای بررسی نظارتی تا زمان بازبینی حقوقی نگه داشته شد." }
```

در صورت وجود، `reason` به‌عنوان یادداشت نظارتی Skill ذخیره و در گزارش ممیزی کپی می‌شود.
حذف‌های نرم آغازشده توسط مالک، slug را برای 30 روز رزرو می‌کنند و پس از آن ناشر
دیگری می‌تواند slug را تصاحب کند. وقتی این انقضا اعمال شود، پاسخ حذف شامل `slugReservedUntil` است.
پنهان‌سازی توسط ناظر/مدیر و حذف‌های امنیتی به این شکل منقضی نمی‌شوند.

پاسخ حذف:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

کدهای وضعیت:

- `200`: موفق
- `401`: احراز هویت نشده
- `403`: ممنوع
- `404`: Skill/کاربر یافت نشد
- `500`: خطای داخلی سرور

### `POST /api/v1/users/publisher`

فقط مدیر. اطمینان حاصل می‌کند که ناشر سازمانی برای یک شناسه وجود دارد. اگر شناسه همچنان به یک
کاربر مشترک قدیمی/ناشر شخصی اشاره کند، نقطه پایانی ابتدا آن را به ناشر سازمانی مهاجرت می‌دهد.
برای سازمان تازه‌ایجادشده، `memberHandle` را ارائه کنید؛ مدیر اقدام‌کننده به‌عنوان عضو افزوده نمی‌شود.
مقدار پیش‌فرض `memberRole` برابر `owner` است.

- بدنه: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

ایجاد سلف‌سرویس و احرازشده ناشر سازمانی. ناشر سازمانی جدیدی ایجاد می‌کند و
فراخواننده را به‌عنوان مالک می‌افزاید. این نقطه پایانی شناسه‌های کاربری/شخصی موجود را مهاجرت نمی‌دهد و
ناشر را مورداعتماد/رسمی علامت‌گذاری نمی‌کند.

- بدنه: `{ "handle": "opik", "displayName": "Opik" }`
- پاسخ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- وقتی شناسه از قبل توسط یک ناشر، کاربر، یا ناشر شخصی استفاده شده باشد، `409` را برمی‌گرداند.

### `POST /api/v1/users/reserve`

فقط مدیر. slugهای ریشه و نام بسته‌ها را بدون انتشار یک
نسخه برای مالک قانونی رزرو می‌کند. نام بسته‌ها به بسته‌های جای‌نگهدار خصوصی بدون ردیف انتشار تبدیل می‌شوند تا همان
مالک بتواند بعداً انتشار واقعی code-plugin یا bundle-plugin را با آن نام منتشر کند.

- بدنه: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- پاسخ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

فقط مدیر. یک ناشر شخصی را برای اصل جایگزین و تأییدشده GitHub OAuth
بدون ویرایش ردیف‌های حساب Convex Auth بازیابی می‌کند. درخواست باید هر دو شناسه تغییرناپذیر حساب
ارائه‌دهنده GitHub را مشخص کند؛ شناسه‌های قابل‌تغییر فقط به‌عنوان محافظ اپراتور استفاده می‌شوند.

حالت پیش‌فرض نقطه پایانی اجرای آزمایشی است. اعمال بازیابی پس از تأیید مستقل پیوستگی میان هر دو
اصل GitHub توسط کارکنان، به `dryRun: false` و
`confirmIdentityVerified: true` نیاز دارد. اگر ناشر شخصی فعلی کاربر مقصد دارای
Skills، بسته‌ها، یا منابع Skill در GitHub باشد، بازیابی به‌شکل بسته شکست می‌خورد.
بازیابی همچنین فیلدهای قدیمی `ownerUserId` را برای Skills ناشر بازیابی‌شده،
نام‌های مستعار slug مربوط به Skill، بسته‌ها، هشدارهای بازرس بسته، و ردیف‌های مشتق‌شده چکیده جست‌وجو مهاجرت می‌دهد تا
مسیرهای مالک مستقیم با اختیار ناشر جدید هم‌خوان باشند. رزرو فعال شناسه محافظت‌شده
برای شناسه بازیابی‌شده نیز به کاربر جایگزین واگذار می‌شود تا همگام‌سازی بعدی
پروفایل نتواند اختیار رقیب کاربر قبلی را بازیابی کند. هر جدول اصلی در هر تراکنش اعمال به
100 ردیف محدود است؛ بازیابی‌های بزرگ‌تر ابتدا باید از مهاجرت قابل‌ادامه مالک استفاده کنند.
منابع Skill در GitHub در سطح ناشر هستند و به‌جای بازنویسی، بررسی‌شده گزارش می‌شوند.

- بدنه: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- پاسخ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### نقطه‌های پایانی مدیریت slug مالک

- `POST /api/v1/skills/{slug}/rename`
  - بدنه: `{ "newSlug": "new-canonical-slug" }`
  - پاسخ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - بدنه: `{ "targetSlug": "canonical-target-slug" }`
  - پاسخ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

نکته‌ها:

- هر دو نقطه پایانی به احراز هویت با توکن API نیاز دارند و فقط برای مالک Skill کار می‌کنند.
- `rename`، slug قبلی را به‌عنوان نام مستعار تغییرمسیر حفظ می‌کند.
- `merge`، فهرست منبع را پنهان و slug منبع را به فهرست مقصد هدایت می‌کند.

### نقطه‌های پایانی انتقال مالکیت

- `POST /api/v1/skills/{slug}/transfer`
  - بدنه: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - پاسخ: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - پاسخ (پذیرش/رد/لغو): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - ساختار پاسخ: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

یک کاربر را مسدود و Skills متعلق به او را به‌طور سخت حذف می‌کند (فقط ناظر/مدیر).

بدنه:

```json
{ "handle": "user_handle", "reason": "دلیل اختیاری مسدودسازی" }
```

یا

```json
{ "userId": "users_...", "reason": "دلیل اختیاری مسدودسازی" }
```

پاسخ:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

مسدودسازی کاربر را لغو و Skills واجد شرایط را بازیابی می‌کند (فقط مدیر).

بدنه:

```json
{ "handle": "user_handle", "reason": "دلیل اختیاری لغو مسدودسازی" }
```

یا

```json
{ "userId": "users_...", "reason": "دلیل اختیاری لغو مسدودسازی" }
```

پاسخ:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

دلیل ذخیره‌شده برای یک مسدودسازی موجود را بدون لغو مسدودسازی یا بازیابی
محتوا تغییر می‌دهد (فقط مدیر). حالت پیش‌فرض اجرای آزمایشی است، مگر اینکه `dryRun` برابر `false` باشد.

بدنه:

```json
{ "handle": "user_handle", "reason": "هرزنامه انتشار انبوه", "dryRun": true }
```

یا

```json
{ "userId": "users_...", "reason": "هرزنامه انتشار انبوه", "dryRun": false }
```

پاسخ:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "مسدودسازی خودکار بدافزار",
  "nextReason": "هرزنامه انتشار انبوه",
  "changed": true
}
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
      "displayName": "کاربر",
      "name": "کاربر",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

یک ستاره را اضافه/حذف می‌کند (برجسته‌سازی). هر دو نقطه پایانی idempotent هستند.

پاسخ‌ها:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## نقطه‌های پایانی قدیمی CLI (منسوخ)

همچنان برای نسخه‌های قدیمی‌تر CLI پشتیبانی می‌شوند:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

برای برنامه حذف، `DEPRECATIONS.md` را ببینید.

`POST /api/cli/upload-url`، `uploadUrl` و `uploadTicket` را برمی‌گرداند. انتشارهای بسته‌ای
که tarball مربوط به ClawPack را مرحله‌بندی می‌کنند باید شناسه ذخیره‌سازی حاصل را به‌عنوان
`clawpack` و تیکت برگردانده‌شده را به‌عنوان `clawpackUploadTicket` ارسال کنند.

## کشف رجیستری (`/.well-known/clawhub.json`)

CLI می‌تواند تنظیمات رجیستری/احراز هویت را از سایت کشف کند:

- `/.well-known/clawhub.json` (JSON، ترجیحی)
- `/.well-known/clawdhub.json` (قدیمی)

طرح‌واره:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

اگر خودتان میزبانی می‌کنید، این فایل را ارائه دهید (یا `CLAWHUB_REGISTRY` را صریحاً تنظیم کنید؛ `CLAWDHUB_REGISTRY` قدیمی است).
