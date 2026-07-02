---
read_when:
    - clawhub package validate را اجرا کرده‌اید و باید یافته‌های Plugin را برطرف کنید
    - ClawHub انتشار بسته Plugin را رد کرد یا دربارهٔ آن هشدار داد
    - شما در حال به‌روزرسانی فرادادهٔ بستهٔ plugin پیش از انتشار هستید
summary: یافته‌های اعتبارسنجی بسته Plugin در ClawHub را پیش از انتشار برطرف کنید
title: رفع‌های اعتبارسنجی Plugin
x-i18n:
    generated_at: "2026-07-02T01:05:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# اصلاحات اعتبارسنجی Plugin

ClawHub بسته‌های Plugin را پیش از انتشار اعتبارسنجی می‌کند و همچنین می‌تواند یافته‌های اسکن‌های خودکار بسته را نشان دهد. این صفحه یافته‌های رو به نویسنده را پوشش می‌دهد؛ یعنی یافته‌هایی که نویسنده Plugin می‌تواند در فراداده بسته، مانیفست، واردکردن‌های SDK یا آرتیفکت منتشرشده بسته خود اصلاح کند.

این صفحه یافته‌های پوشش داخلی Plugin Inspector را پوشش نمی‌دهد. اگر یک گزارش کامل شامل کدهای نگهداری اسکنر بدون راهنمایی اصلاح برای نویسنده باشد، آن‌ها برای نگهدارندگان OpenClaw هستند، نه نویسندگان Plugin.

پس از اعمال هر اصلاح، دوباره اجرا کنید:

```bash
clawhub package validate <path-to-plugin>
```

## یافته‌های رو به نویسنده

| کد                                     | از اینجا شروع کنید                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `package-json-missing`                 | [فراداده بسته را اضافه کنید](/fa/clawhub/plugin-validation-fixes#package-json-missing)                                            |
| `package-openclaw-metadata-missing`    | [بلوک openclaw بسته را اضافه کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                         |
| `package-openclaw-entry-missing`       | [نقاط ورود بسته OpenClaw را اعلام کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                       |
| `package-entrypoint-missing`           | [نقطه ورود اعلام‌شده را منتشر کنید](/fa/clawhub/plugin-validation-fixes#package-entrypoint-missing)                               |
| `package-install-metadata-incomplete`  | [فراداده نصب را کامل کنید](/fa/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`    | [سازگاری API Plugin را اعلام کنید](/fa/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                         |
| `package-min-host-version-drift`       | [حداقل نسخه میزبان را هم‌راستا کنید](/fa/clawhub/plugin-validation-fixes#package-min-host-version-drift)                          |
| `package-manifest-version-drift`       | [نسخه‌های بسته و مانیفست را هم‌راستا کنید](/fa/clawhub/plugin-validation-fixes#package-manifest-version-drift)                    |
| `package-openclaw-unsupported-metadata` | [فراداده پشتیبانی‌نشده بسته OpenClaw را حذف کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)      |
| `package-npm-pack-unavailable`         | [آرتیفکت npm را قابل بسته‌بندی کنید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                            |
| `package-npm-pack-entrypoint-missing`  | [نقاط ورود را در خروجی بسته‌بندی npm بگنجانید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)           |
| `package-npm-pack-metadata-missing`    | [فراداده را در خروجی بسته‌بندی npm بگنجانید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)               |
| `manifest-name-missing`                | [یک نام نمایشی مانیفست اضافه کنید](/fa/clawhub/plugin-validation-fixes#manifest-name-missing)                                     |
| `manifest-unknown-fields`              | [فیلدهای پشتیبانی‌نشده مانیفست را حذف کنید](/fa/clawhub/plugin-validation-fixes#manifest-unknown-fields)                          |
| `manifest-unknown-contracts`           | [کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید](/fa/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                       |
| `legacy-root-sdk-import`               | [واردکردن‌های SDK ریشه را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                               |
| `reserved-sdk-import`                  | [واردکردن‌های رزروشده SDK را حذف کنید](/fa/clawhub/plugin-validation-fixes#reserved-sdk-import)                                   |
| `sdk-load-session-store`               | [دسترسی به کل ذخیره‌گاه نشست را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-load-session-store)                         |
| `sdk-session-store-write`              | [نوشتن در کل ذخیره‌گاه نشست را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-store-write)                         |
| `sdk-session-file-helper`              | [کمک‌کننده‌های مسیر فایل نشست را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-file-helper)                       |
| `sdk-session-transcript-file-target`   | [هدف‌های فایل رونویسی قدیمی را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)              |
| `sdk-session-transcript-low-level`     | [کمک‌کننده‌های سطح پایین رونویسی را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)           |
| `legacy-before-agent-start`            | [before_agent_start را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#legacy-before-agent-start)                               |
| `provider-auth-env-vars`               | [متغیرهای محیطی ارائه‌دهنده را به فراداده راه‌اندازی منتقل کنید](/fa/clawhub/plugin-validation-fixes#provider-auth-env-vars)     |
| `channel-env-vars`                     | [متغیرهای محیطی کانال را در فراداده فعلی آینه کنید](/fa/clawhub/plugin-validation-fixes#channel-env-vars)                         |
| `security-manifest-schema-unavailable` | [ارجاع‌های طرح‌واره مانیفست امنیتی ناموجود را حذف کنید](/fa/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`       | [فایل‌های مانیفست امنیتی پشتیبانی‌نشده را حذف کنید](/fa/clawhub/plugin-validation-fixes#unrecognized-security-manifest)           |

## فراداده بسته

### package-json-missing

ریشه بسته شامل `package.json` نیست، بنابراین ClawHub نمی‌تواند بسته npm، نسخه، نقاط ورود یا فراداده OpenClaw را شناسایی کند.

- `package.json` را همراه با `name`، `version` و `type` اضافه کنید.
- وقتی بسته یک Plugin برای OpenClaw ارائه می‌کند، یک بلوک `openclaw` اضافه کنید.
- برای نمونه حداقلی بسته از [ساخت Pluginها](/fa/plugins/building-plugins) و برای جداسازی بسته از مانیفست از [مانیفست Plugin](/fa/plugins/manifest#manifest-versus-packagejson) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-metadata-missing

بسته `package.json` دارد، اما فراداده بسته OpenClaw را اعلام نمی‌کند.

- `package.json#openclaw` را اضافه کنید.
- فراداده نقطه ورود مانند `openclaw.extensions` یا `openclaw.runtimeExtensions` را بگنجانید.
- وقتی بسته از طریق ClawHub منتشر یا نصب خواهد شد، فراداده سازگاری و نصب را اضافه کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-entry-missing

فراداده بسته وجود دارد، اما نقطه ورود زمان اجرای OpenClaw را اعلام نمی‌کند.

- برای نقاط ورود Plugin بومی، `openclaw.extensions` را اضافه کنید.
- وقتی بسته منتشرشده باید JavaScript ساخته‌شده را بارگذاری کند، `openclaw.runtimeExtensions` را اضافه کنید.
- همه مسیرهای نقطه ورود را داخل دایرکتوری بسته نگه دارید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) و [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-entrypoint-missing

بسته یک نقطه ورود OpenClaw را اعلام می‌کند، اما فایل ارجاع‌شده در بسته‌ای که اعتبارسنجی می‌شود وجود ندارد.

- هر مسیر را در `openclaw.extensions`، `openclaw.runtimeExtensions`، `openclaw.setupEntry` و `openclaw.runtimeSetupEntry` بررسی کنید.
- اگر نقطه ورود در `dist` تولید می‌شود، بسته را بسازید.
- اگر نقطه ورود جابه‌جا شده است، فراداده را به‌روزرسانی کنید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-install-metadata-incomplete

ClawHub نمی‌تواند تشخیص دهد بسته چگونه باید نصب یا به‌روزرسانی شود.

- `openclaw.install` را با منبع نصب پشتیبانی‌شده، مانند `clawhubSpec`، `npmSpec` یا `localPath` پر کنید.
- وقتی بیش از یک منبع نصب در دسترس است، `openclaw.install.defaultChoice` را تنظیم کنید.
- برای حداقل نسخه میزبان OpenClaw از `openclaw.install.minHostVersion` استفاده کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-plugin-api-compat-missing

بسته بازه API Plugin OpenClaw را که پشتیبانی می‌کند اعلام نمی‌کند.

- `openclaw.compat.pluginApi` را به `package.json` اضافه کنید.
- از نسخه API Plugin OpenClaw یا کف semver که بر اساس آن ساخته و آزمایش کرده‌اید استفاده کنید.
- این را از نسخه بسته جدا نگه دارید. نسخه بسته انتشار Plugin را توصیف می‌کند؛ `openclaw.compat.pluginApi` قرارداد API میزبان را توصیف می‌کند.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-min-host-version-drift

حداقل نسخه میزبان بسته با فراداده نسخه OpenClaw که بسته بر اساس آن ساخته شده است همخوانی ندارد.

- `openclaw.install.minHostVersion` را بررسی کنید.
- هر فراداده ساخت OpenClaw در بسته را بررسی کنید، مانند نسخه OpenClaw که هنگام انتشار استفاده شده است.
- حداقل نسخه میزبان را با بازه نسخه میزبان که بسته واقعاً پشتیبانی می‌کند هم‌راستا کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-manifest-version-drift

نسخه بسته و نسخه مانیفست Plugin با هم ناسازگارند.

- `package.json#version` را به‌عنوان نسخه انتشار بسته ترجیح دهید.
- اگر `openclaw.plugin.json` نیز `version` دارد، آن را برای تطابق به‌روزرسانی کنید یا وقتی فراداده بسته مرجع معتبر است، فراداده نسخه مانیفست قدیمی را حذف کنید.
- پس از تغییر فراداده منتشرشده، نسخه جدیدی از بسته منتشر کنید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-unsupported-metadata

بلوک `package.json#openclaw` شامل فیلدهایی است که به‌عنوان فراداده بسته OpenClaw پشتیبانی نمی‌شوند.

- فیلدهای پشتیبانی‌نشده مانند `openclaw.bundle` را حذف کنید.
- فراداده Plugin بومی را در `openclaw.plugin.json` نگه دارید.
- نقاط ورود بسته، سازگاری، نصب، راه‌اندازی و فراداده کاتالوگ را در فیلدهای پشتیبانی‌شده `package.json#openclaw` نگه دارید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## آرتیفکت منتشرشده

### package-npm-pack-unavailable

بسته نمی‌تواند به آرتیفکتی بسته‌بندی شود که ClawHub آن را بررسی یا منتشر می‌کند.

- `npm pack --dry-run` را از ریشه بسته اجرا کنید.
- فراداده نامعتبر بسته، اسکریپت‌های چرخه عمر خراب یا ورودی‌های files را که باعث شکست بسته‌بندی می‌شوند اصلاح کنید.
- اگر این بسته برای انتشار عمومی در نظر گرفته شده است، `private: true` را حذف کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-entrypoint-missing

بسته قابل بسته‌بندی است، اما آرتیفکت بسته‌بندی‌شده فایل‌های نقطه ورودی را که در `package.json#openclaw` اعلام شده‌اند شامل نمی‌شود.

- `npm pack --dry-run` را اجرا کنید و فایل‌هایی را که قرار است گنجانده شوند بررسی کنید.
- پیش از بسته‌بندی، نقاط ورود تولیدشده را بسازید.
- `files`، `.npmignore` یا خروجی ساخت را به‌روزرسانی کنید تا نقاط ورود اعلام‌شده گنجانده شوند.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-metadata-missing

آرتیفکت بسته‌بندی‌شده فاقد فراداده OpenClaw است که در بسته منبع شما وجود دارد.

- `npm pack --dry-run` را اجرا کنید و فایل‌های فراداده گنجانده‌شده را بررسی کنید.
- مطمئن شوید `package.json` بلوک `openclaw` را در آرتیفکت بسته‌بندی‌شده شامل می‌شود.
- وقتی بسته یک Plugin بومی OpenClaw است، مطمئن شوید `openclaw.plugin.json` گنجانده شده است.
- `files` یا `.npmignore` را به‌روزرسانی کنید تا فراداده بسته مستثنا نشود.
- [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## فراداده مانیفست

### manifest-name-missing

manifest بومی Plugin شامل نام نمایشی نیست.

- یک فیلد `name` غیرخالی به `openclaw.plugin.json` اضافه کنید.
- `name` را خوانا برای انسان نگه دارید و `id` را به‌عنوان شناسه پایدار ماشین نگه دارید.
- [manifest Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-fields

manifest Plugin فیلدهای سطح‌بالایی دارد که OpenClaw پشتیبانی نمی‌کند.

- هر فیلد سطح‌بالا را با
  [مرجع فیلدهای manifest](/fa/plugins/manifest#top-level-field-reference) مقایسه کنید.
- فیلدهای سفارشی را از `openclaw.plugin.json` حذف کنید.
- فراداده package یا install را به‌جای manifest به فیلدهای پشتیبانی‌شده `package.json#openclaw`
  منتقل کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-contracts

manifest کلیدهای پشتیبانی‌نشده‌ای را داخل `contracts` اعلام می‌کند.

- هر کلید زیر `contracts` را با
  [مرجع contracts](/fa/plugins/manifest#contracts-reference) مقایسه کنید.
- کلیدهای contract پشتیبانی‌نشده را حذف کنید.
- رفتار runtime را به کد ثبت Plugin منتقل کنید، و `contracts` را
  محدود به فراداده ایستای مالکیت قابلیت نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## SDK و مهاجرت سازگاری

### legacy-root-sdk-import

Plugin از barrel ریشه‌ای SDK منسوخ‌شده import می‌کند:
`openclaw/plugin-sdk`.

- importهای barrel ریشه را با importهای subpath عمومی و متمرکز جایگزین کنید.
- برای `definePluginEntry` از `openclaw/plugin-sdk/plugin-entry` استفاده کنید.
- برای کمک‌کننده‌های ورودی channel از `openclaw/plugin-sdk/channel-core` استفاده کنید.
- برای یافتن import محدودتر از [قراردادهای import](/fa/plugins/building-plugins#import-conventions) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### reserved-sdk-import

Plugin یک مسیر SDK را import می‌کند که برای Pluginهای bundled یا سازگاری داخلی
رزرو شده است.

- importهای SDK داخلی رزروشده OpenClaw را با subpathهای عمومی مستندشده
  `openclaw/plugin-sdk/*` جایگزین کنید.
- اگر این رفتار SDK عمومی ندارد، کمک‌کننده را داخل package خود نگه دارید یا
  یک API عمومی OpenClaw درخواست کنید.
- برای انتخاب یک import پشتیبانی‌شده از [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-load-session-store

Plugin هنوز از کمک‌کننده منسوخ‌شده whole-session-store
`loadSessionStore` استفاده می‌کند.

- هنگام خواندن وضعیت session از `getSessionEntry(...)` یا `listSessionEntries(...)`
  استفاده کنید.
- هنگام نوشتن وضعیت session از `patchSessionEntry(...)` یا `upsertSessionEntry(...)`
  استفاده کنید.
- از بارگذاری، تغییر دادن، و ذخیره کردن کل شیء session store پرهیز کنید.
- `loadSessionStore(...)` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  هنوز نسخه‌های قدیمی‌تر OpenClaw را که به آن نیاز دارند پشتیبانی می‌کند.
- [API runtime](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-store-write

Plugin هنوز از یک کمک‌کننده نوشتن whole-session-store منسوخ‌شده مانند
`saveSessionStore` یا `updateSessionStore` استفاده می‌کند.

- هنگام به‌روزرسانی فیلدها روی یک entry موجود session از `patchSessionEntry(...)`
  استفاده کنید.
- هنگام جایگزینی یا ایجاد یک entry session از `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، تغییر دادن، و ذخیره کردن کل شیء session store پرهیز کنید.
- کمک‌کننده‌های نوشتن whole-store را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  هنوز نسخه‌های قدیمی‌تر OpenClaw را که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API runtime](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-file-helper

Plugin هنوز از کمک‌کننده‌های منسوخ‌شده مسیر فایل session مانند
`resolveSessionFilePath` یا `resolveAndPersistSessionFile` استفاده می‌کند.

- برای خواندن فراداده session بر اساس هویت agent و session از `getSessionEntry(...)`
  استفاده کنید.
- برای ماندگار کردن فراداده session از `patchSessionEntry(...)` یا `upsertSessionEntry(...)`
  استفاده کنید.
- وقتی کد در حال آماده‌سازی یک عملیات transcript است، از هویت transcript یا کمک‌کننده‌های target استفاده کنید.
- مسیرهای فایل transcript قدیمی را ماندگار نکنید و به آن‌ها وابسته نباشید.
- [API runtime](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-file-target

Plugin هنوز از کمک‌کننده منسوخ‌شده target فایل transcript
`resolveSessionTranscriptLegacyFileTarget` استفاده می‌کند.

- وقتی کد فقط به هویت عمومی session نیاز دارد، از `resolveSessionTranscriptIdentity(...)`
  استفاده کنید.
- وقتی کد به یک target ساختاریافته برای عملیات transcript نیاز دارد، از
  `resolveSessionTranscriptTarget(...)` استفاده کنید.
- از خواندن یا ساختن مستقیم targetهای فایل transcript قدیمی پرهیز کنید.
- کمک‌کننده قدیمی را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما هنوز
  نسخه‌های قدیمی‌تر OpenClaw را که به آن نیاز دارند پشتیبانی می‌کند.
- [API runtime](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-low-level

Plugin هنوز از کمک‌کننده‌های سطح‌پایین transcript منسوخ‌شده مانند
`appendSessionTranscriptMessage` یا `emitSessionTranscriptUpdate` استفاده می‌کند.

- برای افزودن به transcript از `appendSessionTranscriptMessageByIdentity(...)` استفاده کنید.
- برای اعلان‌های به‌روزرسانی transcript از `publishSessionTranscriptUpdateByIdentity(...)`
  استفاده کنید.
- سطح runtime ساختاریافته transcript را ترجیح دهید تا OpenClaw بتواند
  مرزهای transaction و مدیریت هویت درست را اعمال کند.
- کمک‌کننده‌های سطح‌پایین transcript را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  هنوز نسخه‌های قدیمی‌تر OpenClaw را که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API runtime](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### legacy-before-agent-start

Plugin هنوز از hook قدیمی `before_agent_start` استفاده می‌کند.

- کار override مدل یا provider را به `before_model_resolve` منتقل کنید.
- کار تغییر prompt یا context را به `before_prompt_build` منتقل کنید.
- `before_agent_start` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما هنوز
  نسخه‌های قدیمی‌تر OpenClaw را که به آن نیاز دارند پشتیبانی می‌کند.
- [Hookها](/fa/plugins/hooks) و
  [سازگاری Plugin](/fa/plugins/compatibility) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### provider-auth-env-vars

manifest هنوز از فراداده احراز هویت provider قدیمی `providerAuthEnvVars` استفاده می‌کند.

- فراداده env-var مربوط به provider را در `setup.providers[].envVars` بازتاب دهید.
- `providerAuthEnvVars` را فقط به‌عنوان فراداده سازگاری نگه دارید تا زمانی که بازه
  OpenClaw پشتیبانی‌شده شما هنوز به آن نیاز دارد.
- [مرجع setup](/fa/plugins/manifest#setup-reference) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### channel-env-vars

manifest از فراداده env-var قدیمی یا کهنه‌تر channel بدون فراداده setup یا config فعلی
که ClawHub انتظار دارد استفاده می‌کند.

- فراداده env-var مربوط به channel را declarative نگه دارید تا OpenClaw بتواند وضعیت setup را
  بدون بارگذاری runtime channel بررسی کند.
- setup مبتنی بر env برای channel را در setup فعلی، config channel، یا
  فراداده channel در package که شکل Plugin شما استفاده می‌کند بازتاب دهید.
- `channelEnvVars` را فقط به‌عنوان فراداده سازگاری نگه دارید تا زمانی که نسخه‌های قدیمی‌تر
  پشتیبانی‌شده OpenClaw هنوز به آن نیاز دارند.
- [manifest Plugin](/fa/plugins/manifest) و
  [Pluginهای channel](/fa/plugins/sdk-channel-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## manifest امنیت

### security-manifest-schema-unavailable

package همراه با `openclaw.security.json` عرضه می‌شود که یک ارجاع schema دارد که ClawHub
آن را به‌عنوان schema در دسترس نمی‌شناسد.

- اگر URL schema فقط advisory است، آن را حذف کنید.
- فقط پس از انتشار یک schema نسخه‌دار مستندشده توسط OpenClaw، از آن استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### unrecognized-security-manifest

package یک فایل manifest امنیت پشتیبانی‌نشده عرضه می‌کند.

- `openclaw.security.json` را حذف کنید تا زمانی که OpenClaw یک schema نسخه‌دار manifest امنیت
  و رفتار ClawHub را مستند کند.
- تا زمانی که contract مربوط به manifest وجود ندارد، رفتارهای حساس به امنیت را در مستندات عمومی package یا
  README خود مستند نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مرتبط

- [ClawHub CLI](/fa/clawhub/cli)
- [انتشار در ClawHub](/fa/clawhub/publishing)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [manifest Plugin](/fa/plugins/manifest)
- [نقاط ورودی Plugin](/fa/plugins/sdk-entrypoints)
- [سازگاری Plugin](/fa/plugins/compatibility)
