---
read_when:
    - شما clawhub package validate را اجرا کردید و باید یافته‌های Plugin را برطرف کنید
    - ClawHub هنگام انتشار بستهٔ Plugin، آن را رد کرد یا هشدار داد
    - شما در حال به‌روزرسانی فرادادهٔ بستهٔ Plugin پیش از انتشار هستید
summary: یافته‌های اعتبارسنجی بسته Plugin در ClawHub را پیش از انتشار اصلاح کنید
title: اصلاحات اعتبارسنجی Plugin
x-i18n:
    generated_at: "2026-07-03T17:31:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# اصلاحات اعتبارسنجی Plugin

ClawHub پیش از انتشار، بسته‌های Plugin را اعتبارسنجی می‌کند و همچنین می‌تواند یافته‌های اسکن‌های خودکار بسته را نشان دهد. این صفحه یافته‌های مربوط به نویسنده را پوشش می‌دهد؛ یعنی یافته‌هایی که نویسندهٔ Plugin می‌تواند در فرادادهٔ بسته، manifest، importهای SDK، یا artifact منتشرشدهٔ خود اصلاح کند.

این صفحه یافته‌های داخلی پوشش Plugin Inspector را پوشش نمی‌دهد. اگر یک گزارش کامل شامل کدهای نگهداشت اسکنر بدون راهنمایی اصلاحی برای نویسنده باشد، آن موارد برای نگه‌دارندگان OpenClaw هستند، نه نویسندگان Plugin.

پس از اعمال هر اصلاح، دوباره اجرا کنید:

```bash
clawhub package validate <path-to-plugin>
```

## یافته‌های مربوط به نویسنده

| کد                                      | از اینجا شروع کنید                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [افزودن فرادادهٔ بسته](/fa/clawhub/plugin-validation-fixes#package-json-missing)                                               |
| `package-openclaw-metadata-missing`     | [افزودن بلوک openclaw بسته](/fa/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [اعلام نقاط ورود بستهٔ OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                          |
| `package-entrypoint-missing`            | [انتشار نقطهٔ ورود اعلام‌شده](/fa/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                 |
| `package-install-metadata-incomplete`   | [تکمیل فرادادهٔ نصب](/fa/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                                 |
| `package-plugin-api-compat-missing`     | [اعلام سازگاری API مربوط به Plugin](/fa/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                    |
| `package-min-host-version-drift`        | [هم‌راستا کردن حداقل نسخهٔ میزبان](/fa/clawhub/plugin-validation-fixes#package-min-host-version-drift)                        |
| `package-manifest-version-drift`        | [هم‌راستا کردن نسخه‌های بسته و manifest](/fa/clawhub/plugin-validation-fixes#package-manifest-version-drift)                  |
| `package-openclaw-unsupported-metadata` | [حذف فرادادهٔ پشتیبانی‌نشدهٔ بستهٔ OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)       |
| `package-npm-pack-unavailable`          | [قابل بسته‌بندی کردن artifact مربوط به npm](/fa/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                 |
| `package-npm-pack-entrypoint-missing`   | [گنجاندن نقاط ورود در خروجی بستهٔ npm](/fa/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)               |
| `package-npm-pack-metadata-missing`     | [گنجاندن فراداده در خروجی بستهٔ npm](/fa/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                   |
| `manifest-name-missing`                 | [افزودن نام نمایشی manifest](/fa/clawhub/plugin-validation-fixes#manifest-name-missing)                                       |
| `manifest-unknown-fields`               | [حذف فیلدهای پشتیبانی‌نشدهٔ manifest](/fa/clawhub/plugin-validation-fixes#manifest-unknown-fields)                            |
| `manifest-unknown-contracts`            | [حذف کلیدهای contract پشتیبانی‌نشده](/fa/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                          |
| `legacy-root-sdk-import`                | [جایگزینی importهای ریشهٔ SDK](/fa/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                    |
| `reserved-sdk-import`                   | [حذف importهای رزروشدهٔ SDK](/fa/clawhub/plugin-validation-fixes#reserved-sdk-import)                                         |
| `sdk-load-session-store`                | [جایگزینی دسترسی به کل session store](/fa/clawhub/plugin-validation-fixes#sdk-load-session-store)                             |
| `sdk-session-store-write`               | [جایگزینی نوشتن در کل session store](/fa/clawhub/plugin-validation-fixes#sdk-session-store-write)                             |
| `sdk-session-file-helper`               | [جایگزینی helperهای مسیر فایل session](/fa/clawhub/plugin-validation-fixes#sdk-session-file-helper)                           |
| `sdk-session-transcript-file-target`    | [جایگزینی targetهای قدیمی فایل transcript](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)            |
| `sdk-session-transcript-low-level`      | [جایگزینی helperهای سطح پایین transcript](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)               |
| `legacy-before-agent-start`             | [جایگزینی before_agent_start](/fa/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                  |
| `provider-auth-env-vars`                | [انتقال متغیرهای محیطی provider به فرادادهٔ setup](/fa/clawhub/plugin-validation-fixes#provider-auth-env-vars)                |
| `channel-env-vars`                      | [بازتاب دادن متغیرهای محیطی channel در فرادادهٔ فعلی](/fa/clawhub/plugin-validation-fixes#channel-env-vars)                   |
| `security-manifest-schema-unavailable`  | [حذف ارجاع‌های در دسترس نبودن schema مربوط به security manifest](/fa/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [حذف فایل‌های security manifest پشتیبانی‌نشده](/fa/clawhub/plugin-validation-fixes#unrecognized-security-manifest)            |

## فرادادهٔ بسته

### package-json-missing

ریشهٔ بسته شامل `package.json` نیست، بنابراین ClawHub نمی‌تواند بستهٔ npm، نسخه، نقاط ورود، یا فرادادهٔ OpenClaw را شناسایی کند.

- `package.json` را با `name`، `version`، و `type` اضافه کنید.
- وقتی بسته یک Plugin برای OpenClaw ارائه می‌کند، یک بلوک `openclaw` اضافه کنید.
- برای نمونهٔ حداقلی بسته از [ساخت Pluginها](/fa/plugins/building-plugins) و برای تفکیک بسته از manifest از [manifest مربوط به Plugin](/fa/plugins/manifest#manifest-versus-packagejson) استفاده کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-openclaw-metadata-missing

بسته `package.json` دارد، اما فرادادهٔ بستهٔ OpenClaw را اعلام نمی‌کند.

- `package.json#openclaw` را اضافه کنید.
- فرادادهٔ نقطهٔ ورود مانند `openclaw.extensions` یا `openclaw.runtimeExtensions` را وارد کنید.
- وقتی بسته از طریق ClawHub منتشر یا نصب می‌شود، فرادادهٔ سازگاری و نصب را اضافه کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-openclaw-entry-missing

فرادادهٔ بسته وجود دارد، اما نقطهٔ ورود runtime مربوط به OpenClaw را اعلام نمی‌کند.

- برای نقاط ورود Plugin بومی، `openclaw.extensions` را اضافه کنید.
- وقتی بستهٔ منتشرشده باید JavaScript ساخته‌شده را بارگذاری کند، `openclaw.runtimeExtensions` را اضافه کنید.
- همهٔ مسیرهای نقطهٔ ورود را داخل دایرکتوری بسته نگه دارید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) و [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-entrypoint-missing

بسته یک نقطهٔ ورود OpenClaw اعلام می‌کند، اما فایل ارجاع‌شده در بسته‌ای که اعتبارسنجی می‌شود وجود ندارد.

- هر مسیر را در `openclaw.extensions`، `openclaw.runtimeExtensions`، `openclaw.setupEntry`، و `openclaw.runtimeSetupEntry` بررسی کنید.
- اگر نقطهٔ ورود در `dist` تولید می‌شود، بسته را بسازید.
- اگر نقطهٔ ورود جابه‌جا شده است، فراداده را به‌روزرسانی کنید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-install-metadata-incomplete

ClawHub نمی‌تواند تشخیص دهد بسته چگونه باید نصب یا به‌روزرسانی شود.

- `openclaw.install` را با منبع نصب پشتیبانی‌شده، مانند `clawhubSpec`، `npmSpec`، یا `localPath` پر کنید.
- وقتی بیش از یک منبع نصب در دسترس است، `openclaw.install.defaultChoice` را تنظیم کنید.
- برای حداقل نسخهٔ میزبان OpenClaw از `openclaw.install.minHostVersion` استفاده کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-plugin-api-compat-missing

بسته بازهٔ API مربوط به Plugin در OpenClaw را که پشتیبانی می‌کند اعلام نمی‌کند.

- `openclaw.compat.pluginApi` را به `package.json` اضافه کنید.
- از نسخهٔ API مربوط به Plugin در OpenClaw یا حداقل نسخهٔ معنایی‌ای استفاده کنید که بر اساس آن ساخته و آزمایش کرده‌اید.
- این را از نسخهٔ بسته جدا نگه دارید. نسخهٔ بسته انتشار Plugin را توصیف می‌کند؛ `openclaw.compat.pluginApi` قرارداد API میزبان را توصیف می‌کند.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-min-host-version-drift

حداقل نسخهٔ میزبان بسته با فرادادهٔ نسخهٔ OpenClaw که بسته بر اساس آن ساخته شده است مطابقت ندارد.

- `openclaw.install.minHostVersion` را بررسی کنید.
- هر فرادادهٔ ساخت OpenClaw در بسته، مانند نسخهٔ OpenClaw استفاده‌شده هنگام انتشار، را بررسی کنید.
- حداقل نسخهٔ میزبان را با بازهٔ نسخهٔ میزبانی که بسته واقعاً پشتیبانی می‌کند هم‌راستا کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-manifest-version-drift

نسخهٔ بسته و نسخهٔ manifest مربوط به Plugin با هم ناسازگارند.

- `package.json#version` را به‌عنوان نسخهٔ انتشار بسته ترجیح دهید.
- اگر `openclaw.plugin.json` نیز `version` دارد، آن را به‌روزرسانی کنید تا مطابقت داشته باشد، یا وقتی فرادادهٔ بسته مرجع است، فرادادهٔ قدیمی نسخهٔ manifest را حذف کنید.
- پس از تغییر فرادادهٔ منتشرشده، نسخهٔ جدیدی از بسته منتشر کنید.
- [manifest مربوط به Plugin](/fa/plugins/manifest) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-openclaw-unsupported-metadata

بلوک `package.json#openclaw` شامل فیلدهایی است که به‌عنوان فرادادهٔ بستهٔ OpenClaw پشتیبانی نمی‌شوند.

- فیلدهای پشتیبانی‌نشده مانند `openclaw.bundle` را حذف کنید.
- فرادادهٔ Plugin بومی را در `openclaw.plugin.json` نگه دارید.
- نقاط ورود بسته، سازگاری، نصب، setup، و فرادادهٔ catalog را در فیلدهای پشتیبانی‌شدهٔ `package.json#openclaw` نگه دارید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

## artifact منتشرشده

### package-npm-pack-unavailable

بسته نمی‌تواند به artifactای بسته‌بندی شود که ClawHub آن را بررسی یا منتشر می‌کند.

- از ریشهٔ بسته `npm pack --dry-run` را اجرا کنید.
- فرادادهٔ نامعتبر بسته، اسکریپت‌های lifecycle خراب، یا ورودی‌های files را که باعث شکست بسته‌بندی می‌شوند اصلاح کنید.
- اگر این بسته برای انتشار عمومی در نظر گرفته شده است، `private: true` را حذف کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-npm-pack-entrypoint-missing

بسته قابل بسته‌بندی است، اما artifact بسته‌بندی‌شده فایل‌های نقطهٔ ورود اعلام‌شده در `package.json#openclaw` را شامل نمی‌شود.

- `npm pack --dry-run` را اجرا کنید و فایل‌هایی را که قرار است گنجانده شوند بررسی کنید.
- پیش از بسته‌بندی، نقاط ورود تولیدشده را بسازید.
- `files`، `.npmignore`، یا خروجی ساخت را به‌روزرسانی کنید تا نقاط ورود اعلام‌شده گنجانده شوند.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-npm-pack-metadata-missing

artifact بسته‌بندی‌شده فرادادهٔ OpenClaw موجود در بستهٔ منبع شما را ندارد.

- `npm pack --dry-run` را اجرا کنید و فایل‌های فرادادهٔ گنجانده‌شده را بررسی کنید.
- مطمئن شوید `package.json` شامل بلوک `openclaw` در artifact بسته‌بندی‌شده است.
- وقتی بسته یک Plugin بومی OpenClaw است، مطمئن شوید `openclaw.plugin.json` گنجانده شده است.
- `files` یا `.npmignore` را به‌روزرسانی کنید تا فرادادهٔ بسته حذف نشود.
- [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

## فرادادهٔ manifest

### manifest-name-missing

مانیفست Plugin بومی شامل نام نمایشی نیست.

- یک فیلد `name` غیرخالی به `openclaw.plugin.json` اضافه کنید.
- `name` را خوانا برای انسان نگه دارید و `id` را به‌عنوان شناسه پایدار ماشینی نگه دارید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-fields

مانیفست Plugin فیلدهای سطح بالایی دارد که OpenClaw از آن‌ها پشتیبانی نمی‌کند.

- هر فیلد سطح بالا را با
  [مرجع فیلدهای مانیفست](/fa/plugins/manifest#top-level-field-reference) مقایسه کنید.
- فیلدهای سفارشی را از `openclaw.plugin.json` حذف کنید.
- فراداده بسته یا نصب را به فیلدهای پشتیبانی‌شده `package.json#openclaw` منتقل کنید
  به‌جای مانیفست.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-contracts

مانیفست کلیدهای پشتیبانی‌نشده‌ای را داخل `contracts` اعلام می‌کند.

- هر کلید زیر `contracts` را با
  [مرجع contracts](/fa/plugins/manifest#contracts-reference) مقایسه کنید.
- کلیدهای contract پشتیبانی‌نشده را حذف کنید.
- رفتار زمان اجرا را به کد ثبت Plugin منتقل کنید، و `contracts`
  را به فراداده مالکیت قابلیت ایستای محدود نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## SDK و مهاجرت سازگاری

### legacy-root-sdk-import

Plugin از بشکه ریشه SDK منسوخ‌شده وارد می‌کند:
`openclaw/plugin-sdk`.

- واردسازی‌های root-barrel را با واردسازی‌های زیرفایل عمومی متمرکز جایگزین کنید.
- برای `definePluginEntry` از `openclaw/plugin-sdk/plugin-entry` استفاده کنید.
- برای کمک‌کننده‌های ورودی کانال از `openclaw/plugin-sdk/channel-core` استفاده کنید.
- از [قراردادهای import](/fa/plugins/building-plugins#import-conventions) و
  [زیرفایل‌های Plugin SDK](/fa/plugins/sdk-subpaths) برای یافتن import محدود استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### reserved-sdk-import

Plugin یک مسیر SDK را وارد می‌کند که برای Pluginهای همراه یا سازگاری داخلی
رزرو شده است.

- importهای SDK داخلی رزروشده OpenClaw را با زیرفایل‌های عمومی مستندشده
  `openclaw/plugin-sdk/*` جایگزین کنید.
- اگر رفتار SDK عمومی ندارد، کمک‌کننده را داخل بسته خود نگه دارید یا
  یک API عمومی OpenClaw درخواست کنید.
- از [زیرفایل‌های Plugin SDK](/fa/plugins/sdk-subpaths) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) برای انتخاب یک import پشتیبانی‌شده استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-load-session-store

Plugin هنوز از کمک‌کننده منسوخ‌شده کل session store
`loadSessionStore` استفاده می‌کند.

- هنگام خواندن وضعیت session از `getSessionEntry(...)` یا `listSessionEntries(...)` استفاده کنید.
- هنگام نوشتن وضعیت session از `patchSessionEntry(...)` یا `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، تغییر دادن، و ذخیره کردن کل شیء session store پرهیز کنید.
- `loadSessionStore(...)` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرفایل‌های Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-store-write

Plugin هنوز از یک کمک‌کننده نوشتن کل session store منسوخ‌شده مانند
`saveSessionStore` یا `updateSessionStore` استفاده می‌کند.

- هنگام به‌روزرسانی فیلدها روی یک ورودی session موجود از `patchSessionEntry(...)` استفاده کنید.
- هنگام جایگزینی یا ایجاد یک ورودی session از `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، تغییر دادن، و ذخیره کردن کل شیء session store پرهیز کنید.
- کمک‌کننده‌های نوشتن کل store را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرفایل‌های Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-file-helper

Plugin هنوز از کمک‌کننده‌های منسوخ‌شده مسیر فایل session مانند
`resolveSessionFilePath` یا `resolveAndPersistSessionFile` استفاده می‌کند.

- برای خواندن فراداده session بر اساس agent و هویت session از `getSessionEntry(...)` استفاده کنید.
- برای ماندگار کردن فراداده session از `patchSessionEntry(...)` یا `upsertSessionEntry(...)` استفاده کنید.
- وقتی کد در حال آماده‌سازی یک عملیات transcript است، از هویت transcript یا کمک‌کننده‌های target استفاده کنید.
- مسیرهای فایل transcript قدیمی را ماندگار نکنید یا به آن‌ها وابسته نباشید.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرفایل‌های Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-file-target

Plugin هنوز از کمک‌کننده target فایل transcript منسوخ‌شده
`resolveSessionTranscriptLegacyFileTarget` استفاده می‌کند.

- وقتی کد فقط به هویت عمومی session نیاز دارد از `resolveSessionTranscriptIdentity(...)` استفاده کنید.
- وقتی کد به یک target ساختاریافته برای عملیات transcript نیاز دارد از `resolveSessionTranscriptTarget(...)` استفاده کنید.
- از خواندن یا ساختن مستقیم targetهای فایل transcript قدیمی پرهیز کنید.
- کمک‌کننده قدیمی را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما هنوز
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرفایل‌های Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-low-level

Plugin هنوز از کمک‌کننده‌های سطح پایین transcript منسوخ‌شده مانند
`appendSessionTranscriptMessage` یا `emitSessionTranscriptUpdate` استفاده می‌کند.

- برای افزودن به transcript از `appendSessionTranscriptMessageByIdentity(...)` استفاده کنید.
- برای اعلان‌های به‌روزرسانی transcript از `publishSessionTranscriptUpdateByIdentity(...)` استفاده کنید.
- سطح زمان اجرای transcript ساختاریافته را ترجیح دهید تا OpenClaw بتواند
  مرزهای تراکنش و رسیدگی به هویت درست را اعمال کند.
- کمک‌کننده‌های سطح پایین transcript را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرفایل‌های Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### legacy-before-agent-start

Plugin هنوز از hook قدیمی `before_agent_start` استفاده می‌کند.

- کار override مدل یا provider را به `before_model_resolve` منتقل کنید.
- کار تغییر prompt یا context را به `before_prompt_build` منتقل کنید.
- `before_agent_start` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما هنوز
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [Hookها](/fa/plugins/hooks) و
  [سازگاری Plugin](/fa/plugins/compatibility) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### provider-auth-env-vars

مانیفست هنوز از فراداده auth قدیمی provider با نام `providerAuthEnvVars` استفاده می‌کند.

- فراداده env-var مربوط به provider را در `setup.providers[].envVars` بازتاب دهید.
- `providerAuthEnvVars` را فقط به‌عنوان فراداده سازگاری نگه دارید تا زمانی که بازه
  OpenClaw پشتیبانی‌شده شما هنوز به آن نیاز دارد.
- [مرجع setup](/fa/plugins/manifest#setup-reference) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### channel-env-vars

مانیفست از فراداده env-var کانال قدیمی یا قدیمی‌تر استفاده می‌کند، بدون فراداده
setup یا config فعلی که ClawHub انتظار دارد.

- فراداده env-var کانال را declarative نگه دارید تا OpenClaw بتواند وضعیت setup را
  بدون بارگذاری زمان اجرای کانال بررسی کند.
- setup کانال مبتنی بر env را در setup فعلی، config کانال، یا
  فراداده کانال بسته که شکل Plugin شما استفاده می‌کند بازتاب دهید.
- `channelEnvVars` را فقط به‌عنوان فراداده سازگاری نگه دارید تا زمانی که نسخه‌های قدیمی‌تر
  پشتیبانی‌شده OpenClaw هنوز به آن نیاز دارند.
- [مانیفست Plugin](/fa/plugins/manifest) و
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مانیفست امنیتی

### security-manifest-schema-unavailable

بسته `openclaw.security.json` را با یک ارجاع schema منتشر می‌کند که ClawHub
آن را به‌عنوان موجود نمی‌شناسد.

- اگر URL schema فقط مشورتی است، آن را حذف کنید.
- فقط پس از آن‌که OpenClaw یک schema نسخه‌دار منتشر کرد، از schema نسخه‌دار مستندشده استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### unrecognized-security-manifest

بسته یک فایل مانیفست امنیتی پشتیبانی‌نشده منتشر می‌کند.

- `openclaw.security.json` را حذف کنید تا زمانی که OpenClaw یک schema مانیفست امنیتی
  نسخه‌دار و رفتار ClawHub را مستند کند.
- رفتار حساس به امنیت را تا زمانی که contract مانیفست وجود ندارد، در مستندات عمومی بسته خود یا
  README مستند نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مرتبط

- [CLI ClawHub](/fa/clawhub/cli)
- [انتشار ClawHub](/fa/clawhub/publishing)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مانیفست Plugin](/fa/plugins/manifest)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [سازگاری Plugin](/fa/plugins/compatibility)
