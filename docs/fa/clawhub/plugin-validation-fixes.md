---
read_when:
    - شما `clawhub package validate` را اجرا کردید و باید یافته‌های Plugin را رفع کنید
    - ClawHub هنگام انتشار بسته Plugin آن را رد کرد یا هشدار داد
    - شما در حال به‌روزرسانی فراداده بسته Plugin پیش از انتشار هستید
summary: یافته‌های اعتبارسنجی بسته Plugin مربوط به ClawHub را پیش از انتشار رفع کنید
title: اصلاحات اعتبارسنجی Plugin
x-i18n:
    generated_at: "2026-07-01T20:28:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# اصلاحات اعتبارسنجی Plugin

ClawHub بسته‌های Plugin را پیش از انتشار اعتبارسنجی می‌کند و همچنین می‌تواند یافته‌های اسکن‌های خودکار بسته را نشان دهد. این صفحه یافته‌های روبه‌روی نویسنده را پوشش می‌دهد؛ یعنی یافته‌هایی که نویسنده Plugin می‌تواند در فراداده بسته، manifest، importهای SDK، یا artifact منتشرشده بسته خود اصلاح کند.

این صفحه یافته‌های داخلی پوشش Plugin Inspector را پوشش نمی‌دهد. اگر یک گزارش کامل شامل کدهای نگهداشت اسکنر بدون راهنمای اصلاح برای نویسنده باشد، آن‌ها برای نگه‌دارندگان OpenClaw هستند، نه نویسندگان Plugin.

پس از اعمال هر اصلاح، دوباره اجرا کنید:

```bash
clawhub package validate <path-to-plugin>
```

## یافته‌های روبه‌روی نویسنده

| کد                                      | از اینجا شروع کنید                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [افزودن فراداده بسته](/fa/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [افزودن بلوک openclaw بسته](/fa/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                                |
| `package-openclaw-entry-missing`        | [اعلام entrypointهای بسته OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                            |
| `package-entrypoint-missing`            | [انتشار entrypoint اعلام‌شده](/fa/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                      |
| `package-install-metadata-incomplete`   | [تکمیل فراداده نصب](/fa/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                                       |
| `package-plugin-api-compat-missing`     | [اعلام سازگاری API Plugin](/fa/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                                  |
| `package-min-host-version-drift`        | [هم‌راستا کردن حداقل نسخه میزبان](/fa/clawhub/plugin-validation-fixes#package-min-host-version-drift)                              |
| `package-manifest-version-drift`        | [هم‌راستا کردن نسخه‌های بسته و manifest](/fa/clawhub/plugin-validation-fixes#package-manifest-version-drift)                        |
| `package-openclaw-unsupported-metadata` | [حذف فراداده پشتیبانی‌نشده بسته OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)               |
| `package-npm-pack-unavailable`          | [قابل pack کردن artifact npm](/fa/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                    |
| `package-npm-pack-entrypoint-missing`   | [گنجاندن entrypointها در خروجی npm pack](/fa/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [گنجاندن فراداده در خروجی npm pack](/fa/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                         |
| `manifest-name-missing`                 | [افزودن نام نمایشی manifest](/fa/clawhub/plugin-validation-fixes#manifest-name-missing)                                            |
| `manifest-unknown-fields`               | [حذف فیلدهای پشتیبانی‌نشده manifest](/fa/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [حذف کلیدهای contract پشتیبانی‌نشده](/fa/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                               |
| `legacy-root-sdk-import`                | [جایگزینی importهای ریشه SDK](/fa/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                          |
| `reserved-sdk-import`                   | [حذف importهای رزروشده SDK](/fa/clawhub/plugin-validation-fixes#reserved-sdk-import)                                               |
| `sdk-load-session-store`                | [جایگزینی دسترسی به کل session store](/fa/clawhub/plugin-validation-fixes#sdk-load-session-store)                                  |
| `sdk-session-store-write`               | [جایگزینی نوشتن‌های کل session store](/fa/clawhub/plugin-validation-fixes#sdk-session-store-write)                                 |
| `sdk-session-file-helper`               | [جایگزینی helperهای مسیر فایل session](/fa/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                |
| `sdk-session-transcript-file-target`    | [جایگزینی targetهای فایل transcript قدیمی](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                 |
| `sdk-session-transcript-low-level`      | [جایگزینی helperهای سطح پایین transcript](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                    |
| `legacy-before-agent-start`             | [جایگزینی before_agent_start](/fa/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                       |
| `provider-auth-env-vars`                | [انتقال env varهای provider به فراداده setup](/fa/clawhub/plugin-validation-fixes#provider-auth-env-vars)                          |
| `channel-env-vars`                      | [بازتاب env varهای channel در فراداده فعلی](/fa/clawhub/plugin-validation-fixes#channel-env-vars)                                  |
| `security-manifest-schema-unavailable`  | [حذف ارجاع‌های schema manifest امنیتی ناموجود](/fa/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable)           |
| `unrecognized-security-manifest`        | [حذف فایل‌های manifest امنیتی پشتیبانی‌نشده](/fa/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## فراداده بسته

### package-json-missing

ریشه بسته شامل `package.json` نیست، بنابراین ClawHub نمی‌تواند بسته npm، نسخه، entrypointها یا فراداده OpenClaw را شناسایی کند.

- `package.json` را با `name`، `version` و `type` اضافه کنید.
- وقتی بسته یک Plugin برای OpenClaw ارائه می‌کند، یک بلوک `openclaw` اضافه کنید.
- برای یک نمونه حداقلی بسته از [ساخت Pluginها](/fa/plugins/building-plugins) و برای تفکیک بسته و manifest از [Plugin manifest](/fa/plugins/manifest#manifest-versus-packagejson) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-metadata-missing

بسته `package.json` دارد، اما فراداده بسته OpenClaw را اعلام نمی‌کند.

- `package.json#openclaw` را اضافه کنید.
- فراداده entrypoint مانند `openclaw.extensions` یا `openclaw.runtimeExtensions` را شامل کنید.
- وقتی بسته از طریق ClawHub منتشر یا نصب خواهد شد، فراداده سازگاری و نصب را اضافه کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-entry-missing

فراداده بسته وجود دارد، اما یک entrypoint زمان اجرای OpenClaw را اعلام نمی‌کند.

- برای entrypointهای Plugin بومی، `openclaw.extensions` را اضافه کنید.
- وقتی بسته منتشرشده باید JavaScript ساخته‌شده را بارگذاری کند، `openclaw.runtimeExtensions` را اضافه کنید.
- همه مسیرهای entrypoint را داخل دایرکتوری بسته نگه دارید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) و [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-entrypoint-missing

بسته یک entrypoint برای OpenClaw اعلام می‌کند، اما فایل ارجاع‌شده در بسته‌ای که اعتبارسنجی می‌شود وجود ندارد.

- هر مسیر را در `openclaw.extensions`، `openclaw.runtimeExtensions`، `openclaw.setupEntry` و `openclaw.runtimeSetupEntry` بررسی کنید.
- اگر entrypoint در `dist` تولید می‌شود، بسته را بسازید.
- اگر entrypoint جابه‌جا شده است، فراداده را به‌روزرسانی کنید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-install-metadata-incomplete

ClawHub نمی‌تواند تشخیص دهد بسته چگونه باید نصب یا به‌روزرسانی شود.

- `openclaw.install` را با منبع نصب پشتیبانی‌شده، مانند `clawhubSpec`، `npmSpec` یا `localPath` پر کنید.
- وقتی بیش از یک منبع نصب موجود است، `openclaw.install.defaultChoice` را تنظیم کنید.
- برای حداقل نسخه میزبان OpenClaw از `openclaw.install.minHostVersion` استفاده کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-plugin-api-compat-missing

بسته بازه API Plugin در OpenClaw را که پشتیبانی می‌کند اعلام نمی‌کند.

- `openclaw.compat.pluginApi` را به `package.json` اضافه کنید.
- از نسخه API Plugin در OpenClaw یا کف semver که بر اساس آن ساخته و آزمایش کرده‌اید استفاده کنید.
- این را از نسخه بسته جدا نگه دارید. نسخه بسته انتشار Plugin را توصیف می‌کند؛ `openclaw.compat.pluginApi` contract API میزبان را توصیف می‌کند.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-min-host-version-drift

حداقل نسخه میزبان بسته با فراداده نسخه OpenClaw که بسته بر اساس آن ساخته شده مطابقت ندارد.

- `openclaw.install.minHostVersion` را بررسی کنید.
- هر فراداده ساخت OpenClaw در بسته، مانند نسخه OpenClaw استفاده‌شده هنگام انتشار، را بررسی کنید.
- حداقل نسخه میزبان را با بازه نسخه میزبان که بسته واقعاً پشتیبانی می‌کند هم‌راستا کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-manifest-version-drift

نسخه بسته و نسخه Plugin manifest با هم ناسازگارند.

- `package.json#version` را به‌عنوان نسخه انتشار بسته ترجیح دهید.
- اگر `openclaw.plugin.json` نیز `version` دارد، آن را برای تطبیق به‌روزرسانی کنید یا وقتی فراداده بسته مرجع است، فراداده نسخه manifest قدیمی را حذف کنید.
- پس از تغییر فراداده منتشرشده، یک نسخه جدید از بسته منتشر کنید.
- [Plugin manifest](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-unsupported-metadata

بلوک `package.json#openclaw` شامل فیلدهایی است که به‌عنوان فراداده بسته OpenClaw پشتیبانی نمی‌شوند.

- فیلدهای پشتیبانی‌نشده مانند `openclaw.bundle` را حذف کنید.
- فراداده Plugin بومی را در `openclaw.plugin.json` نگه دارید.
- entrypointهای بسته، سازگاری، نصب، setup و فراداده catalog را در فیلدهای پشتیبانی‌شده `package.json#openclaw` نگه دارید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## artifact منتشرشده

### package-npm-pack-unavailable

بسته نمی‌تواند به artifactی pack شود که ClawHub بررسی یا منتشر می‌کند.

- `npm pack --dry-run` را از ریشه بسته اجرا کنید.
- فراداده نامعتبر بسته، scriptهای چرخه عمر خراب، یا entries فایل‌هایی را که باعث شکست pack می‌شوند اصلاح کنید.
- اگر این بسته برای انتشار عمومی در نظر گرفته شده است، `private: true` را حذف کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-entrypoint-missing

بسته قابل pack شدن است، اما artifact بسته‌بندی‌شده فایل‌های entrypoint اعلام‌شده در `package.json#openclaw` را شامل نمی‌شود.

- `npm pack --dry-run` را اجرا کنید و فایل‌هایی را که قرار است شامل شوند بررسی کنید.
- entrypointهای تولیدشده را پیش از pack بسازید.
- `files`، `.npmignore` یا خروجی ساخت را به‌روزرسانی کنید تا entrypointهای اعلام‌شده شامل شوند.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-metadata-missing

artifact بسته‌بندی‌شده فاقد فراداده OpenClaw است که در بسته منبع شما وجود دارد.

- `npm pack --dry-run` را اجرا کنید و فایل‌های فراداده شامل‌شده را بررسی کنید.
- مطمئن شوید `package.json` بلوک `openclaw` را در artifact بسته‌بندی‌شده شامل می‌کند.
- وقتی بسته یک Plugin بومی OpenClaw است، مطمئن شوید `openclaw.plugin.json` شامل شده است.
- `files` یا `.npmignore` را به‌روزرسانی کنید تا فراداده بسته حذف نشود.
- [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## فراداده manifest

### manifest-name-missing

مانیفست Plugin بومی شامل نام نمایشی نیست.

- یک فیلد `name` غیرخالی به `openclaw.plugin.json` اضافه کنید.
- `name` را خوانا برای انسان نگه دارید و `id` را به‌عنوان شناسهٔ ماشینی پایدار نگه دارید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-fields

مانیفست Plugin فیلدهای سطح‌بالایی دارد که OpenClaw از آن‌ها پشتیبانی نمی‌کند.

- هر فیلد سطح‌بالا را با
  [مرجع فیلدهای مانیفست](/fa/plugins/manifest#top-level-field-reference) مقایسه کنید.
- فیلدهای سفارشی را از `openclaw.plugin.json` حذف کنید.
- فرادادهٔ بسته یا نصب را به‌جای مانیفست، به فیلدهای پشتیبانی‌شدهٔ
  `package.json#openclaw` منتقل کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-contracts

مانیفست کلیدهای پشتیبانی‌نشده‌ای را داخل `contracts` اعلام می‌کند.

- هر کلید زیر `contracts` را با
  [مرجع قراردادها](/fa/plugins/manifest#contracts-reference) مقایسه کنید.
- کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید.
- رفتار زمان اجرا را به کد ثبت Plugin منتقل کنید و `contracts` را به فرادادهٔ ایستای مالکیت قابلیت محدود نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مهاجرت SDK و سازگاری

### legacy-root-sdk-import

Plugin از barrel ریشهٔ منسوخ‌شدهٔ SDK import می‌کند:
`openclaw/plugin-sdk`.

- importهای root-barrel را با importهای زیرمسیر عمومی متمرکز جایگزین کنید.
- برای `definePluginEntry` از `openclaw/plugin-sdk/plugin-entry` استفاده کنید.
- برای helperهای ورودی کانال از `openclaw/plugin-sdk/channel-core` استفاده کنید.
- برای یافتن import محدود، از [قراردادهای import](/fa/plugins/building-plugins#import-conventions) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### reserved-sdk-import

Plugin یک مسیر SDK را import می‌کند که برای Pluginهای bundled یا سازگاری داخلی رزرو شده است.

- importهای SDK داخلی رزروشدهٔ OpenClaw را با زیرمسیرهای عمومی مستندشدهٔ
  `openclaw/plugin-sdk/*` جایگزین کنید.
- اگر رفتار SDK عمومی ندارد، helper را داخل بستهٔ خود نگه دارید یا یک API عمومی OpenClaw درخواست کنید.
- برای انتخاب import پشتیبانی‌شده، از [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-load-session-store

Plugin هنوز از helper منسوخ‌شدهٔ کل session store یعنی
`loadSessionStore` استفاده می‌کند.

- هنگام خواندن وضعیت session از `getSessionEntry(...)` یا `listSessionEntries(...)` استفاده کنید.
- هنگام نوشتن وضعیت session از `patchSessionEntry(...)` یا `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، تغییر دادن و ذخیره کردن کل شیء session store پرهیز کنید.
- `loadSessionStore(...)` را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-store-write

Plugin هنوز از یک helper نوشتن منسوخ‌شدهٔ کل session store مانند
`saveSessionStore` یا `updateSessionStore` استفاده می‌کند.

- هنگام به‌روزرسانی فیلدهای یک ورودی session موجود، از `patchSessionEntry(...)` استفاده کنید.
- هنگام جایگزین کردن یا ایجاد یک ورودی session، از `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، تغییر دادن و ذخیره کردن کل شیء session store پرهیز کنید.
- helperهای نوشتن کل store را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-file-helper

Plugin هنوز از helperهای منسوخ‌شدهٔ مسیر فایل session مانند
`resolveSessionFilePath` یا `resolveAndPersistSessionFile` استفاده می‌کند.

- برای خواندن فرادادهٔ session بر اساس هویت agent و session از `getSessionEntry(...)` استفاده کنید.
- برای ماندگار کردن فرادادهٔ session از `patchSessionEntry(...)` یا `upsertSessionEntry(...)` استفاده کنید.
- وقتی کد در حال آماده‌سازی یک عملیات transcript است، از helperهای هویت transcript یا target استفاده کنید.
- مسیرهای فایل transcript قدیمی را ماندگار نکنید و به آن‌ها وابسته نباشید.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-file-target

Plugin هنوز از helper منسوخ‌شدهٔ target فایل transcript یعنی
`resolveSessionTranscriptLegacyFileTarget` استفاده می‌کند.

- وقتی کد فقط به هویت عمومی session نیاز دارد، از `resolveSessionTranscriptIdentity(...)` استفاده کنید.
- وقتی کد به target ساختاریافتهٔ عملیات transcript نیاز دارد، از `resolveSessionTranscriptTarget(...)` استفاده کنید.
- از خواندن یا ساختن مستقیم targetهای فایل transcript قدیمی پرهیز کنید.
- helper قدیمی را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-low-level

Plugin هنوز از helperهای سطح‌پایین منسوخ‌شدهٔ transcript مانند
`appendSessionTranscriptMessage` یا `emitSessionTranscriptUpdate` استفاده می‌کند.

- برای افزودن به transcript از `appendSessionTranscriptMessageByIdentity(...)` استفاده کنید.
- برای اعلان‌های به‌روزرسانی transcript از `publishSessionTranscriptUpdateByIdentity(...)` استفاده کنید.
- سطح زمان اجرای ساختاریافتهٔ transcript را ترجیح دهید تا OpenClaw بتواند مرزهای تراکنش و مدیریت هویت درست را اعمال کند.
- helperهای سطح‌پایین transcript را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### legacy-before-agent-start

Plugin هنوز از hook قدیمی `before_agent_start` استفاده می‌کند.

- کار override مدل یا provider را به `before_model_resolve` منتقل کنید.
- کار تغییر prompt یا context را به `before_prompt_build` منتقل کنید.
- `before_agent_start` را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [Hookها](/fa/plugins/hooks) و
  [سازگاری Plugin](/fa/plugins/compatibility) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### provider-auth-env-vars

مانیفست هنوز از فرادادهٔ auth provider قدیمی `providerAuthEnvVars` استفاده می‌کند.

- فرادادهٔ env-var مربوط به provider را در `setup.providers[].envVars` منعکس کنید.
- `providerAuthEnvVars` را فقط به‌عنوان فرادادهٔ سازگاری نگه دارید تا زمانی که بازهٔ OpenClaw پشتیبانی‌شدهٔ شما هنوز به آن نیاز دارد.
- [مرجع setup](/fa/plugins/manifest#setup-reference) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### channel-env-vars

مانیفست از فرادادهٔ env-var کانال قدیمی یا مسن‌تری استفاده می‌کند که فاقد فرادادهٔ setup یا config فعلی مورد انتظار ClawHub است.

- فرادادهٔ env-var کانال را declarative نگه دارید تا OpenClaw بتواند وضعیت setup را بدون بارگذاری runtime کانال بررسی کند.
- setup کانال مبتنی بر env را در setup فعلی، config کانال، یا فرادادهٔ کانال package که شکل Plugin شما استفاده می‌کند منعکس کنید.
- `channelEnvVars` را فقط به‌عنوان فرادادهٔ سازگاری نگه دارید تا زمانی که نسخه‌های قدیمی‌تر OpenClaw پشتیبانی‌شده هنوز به آن نیاز دارند.
- [مانیفست Plugin](/fa/plugins/manifest) و
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مانیفست امنیتی

### security-manifest-schema-unavailable

بسته، `openclaw.security.json` را با یک ارجاع schema ارائه می‌کند که ClawHub آن را به‌عنوان موجود تشخیص نمی‌دهد.

- اگر URL مربوط به schema فقط جنبهٔ توصیه‌ای دارد، آن را حذف کنید.
- فقط پس از آنکه OpenClaw یک schema نسخه‌دار منتشر کرد، از schema نسخه‌دار مستندشده استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### unrecognized-security-manifest

بسته یک فایل مانیفست امنیتی پشتیبانی‌نشده ارائه می‌کند.

- `openclaw.security.json` را حذف کنید تا زمانی که OpenClaw یک schema مانیفست امنیتی نسخه‌دار و رفتار ClawHub را مستند کند.
- تا زمانی که قرارداد مانیفست وجود ندارد، رفتار حساس به امنیت را در مستندات عمومی بسته یا README خود مستند نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مرتبط

- [ClawHub CLI](/fa/clawhub/cli)
- [انتشار در ClawHub](/fa/clawhub/publishing)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مانیفست Plugin](/fa/plugins/manifest)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [سازگاری Plugin](/fa/plugins/compatibility)
