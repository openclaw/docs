---
read_when:
    - شما clawhub package validate را اجرا کردید و باید یافته‌های Plugin را رفع کنید
    - ClawHub هنگام انتشار بسته Plugin رد کرد یا هشدار داد
    - در حال به‌روزرسانی فراداده بسته Plugin پیش از انتشار هستید
summary: رفع یافته‌های اعتبارسنجی بسته Plugin در ClawHub پیش از انتشار
title: اصلاحات اعتبارسنجی Plugin
x-i18n:
    generated_at: "2026-06-30T14:12:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# اصلاحات اعتبارسنجی Plugin

ClawHub بسته‌های Plugin را پیش از انتشار اعتبارسنجی می‌کند و همچنین می‌تواند یافته‌های
اسکن‌های خودکار بسته را نمایش دهد. این صفحه یافته‌های معطوف به نویسنده را پوشش می‌دهد؛ یعنی
یافته‌هایی که نویسنده Plugin می‌تواند در فراداده بسته، manifest، ایمپورت‌های SDK
یا artifact منتشرشده خود اصلاح کند.

این صفحه یافته‌های پوشش داخلی Plugin Inspector را پوشش نمی‌دهد. اگر یک گزارش کامل
شامل کدهای نگهداری scanner بدون راهنمایی اصلاحی برای نویسنده باشد، آن‌ها برای
نگه‌دارندگان OpenClaw هستند، نه نویسندگان Plugin.

پس از اعمال هر اصلاح، دوباره اجرا کنید:

```bash
clawhub package validate <path-to-plugin>
```

## یافته‌های معطوف به نویسنده

| کد                                      | از اینجا شروع کنید                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [افزودن فراداده بسته](/fa/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [افزودن بلوک openclaw بسته](/fa/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [اعلام entrypointهای بسته OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [انتشار entrypoint اعلام‌شده](/fa/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [تکمیل فراداده نصب](/fa/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [اعلام سازگاری API مربوط به Plugin](/fa/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [همسو کردن حداقل نسخه میزبان](/fa/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [همسو کردن نسخه‌های بسته و manifest](/fa/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [حذف فراداده پشتیبانی‌نشده بسته OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [قابل بسته‌بندی کردن artifact مربوط به npm](/fa/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [گنجاندن entrypointها در خروجی npm pack](/fa/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [گنجاندن فراداده در خروجی npm pack](/fa/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [افزودن نام نمایشی manifest](/fa/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [حذف فیلدهای پشتیبانی‌نشده manifest](/fa/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [حذف کلیدهای contract پشتیبانی‌نشده](/fa/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [جایگزینی ایمپورت‌های ریشه SDK](/fa/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [حذف ایمپورت‌های رزروشده SDK](/fa/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [جایگزینی دسترسی به کل session store](/fa/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [جایگزینی نوشتن در کل session store](/fa/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [جایگزینی helperهای مسیر فایل session](/fa/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [جایگزینی targetهای قدیمی فایل transcript](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [جایگزینی helperهای سطح پایین transcript](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [جایگزینی before_agent_start](/fa/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [انتقال env varهای provider به فراداده setup](/fa/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [بازتاب دادن env varهای channel در فراداده فعلی](/fa/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [حذف ارجاع‌های schema مربوط به security manifest که در دسترس نیستند](/fa/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [حذف فایل‌های security manifest پشتیبانی‌نشده](/fa/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## فراداده بسته

### package-json-missing

ریشه بسته شامل `package.json` نیست، بنابراین ClawHub نمی‌تواند بسته
npm، نسخه، entrypointها یا فراداده OpenClaw را شناسایی کند.

- `package.json` را با `name`، `version` و `type` اضافه کنید.
- وقتی بسته یک Plugin مربوط به OpenClaw ارائه می‌کند، یک بلوک `openclaw` اضافه کنید.
- برای یک نمونه حداقلی بسته از [ساخت Pluginها](/fa/plugins/building-plugins) و
  برای تفکیک بسته در برابر manifest از [Plugin manifest](/fa/plugins/manifest#manifest-versus-packagejson)
  استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-metadata-missing

بسته دارای `package.json` است، اما فراداده بسته OpenClaw را اعلام نمی‌کند.

- `package.json#openclaw` را اضافه کنید.
- فراداده entrypoint مانند `openclaw.extensions` یا
  `openclaw.runtimeExtensions` را بگنجانید.
- وقتی بسته قرار است از طریق ClawHub منتشر یا نصب شود، فراداده سازگاری و نصب را اضافه کنید.
- [فیلدهای package.json که بر discovery اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-entry-missing

فراداده بسته وجود دارد، اما یک entrypoint زمان اجرای OpenClaw اعلام نمی‌کند.

- برای entrypointهای Plugin بومی، `openclaw.extensions` را اضافه کنید.
- وقتی بسته منتشرشده باید JavaScript ساخته‌شده را بارگذاری کند،
  `openclaw.runtimeExtensions` را اضافه کنید.
- همه مسیرهای entrypoint را داخل دایرکتوری بسته نگه دارید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) و
  [فیلدهای package.json که بر discovery اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-entrypoint-missing

بسته یک entrypoint مربوط به OpenClaw اعلام می‌کند، اما فایل ارجاع‌شده
در بسته‌ای که اعتبارسنجی می‌شود وجود ندارد.

- هر مسیر را در `openclaw.extensions`، `openclaw.runtimeExtensions`،
  `openclaw.setupEntry` و `openclaw.runtimeSetupEntry` بررسی کنید.
- اگر entrypoint در `dist` تولید می‌شود، بسته را build کنید.
- اگر entrypoint جابه‌جا شده است، فراداده را به‌روزرسانی کنید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-install-metadata-incomplete

ClawHub نمی‌تواند تشخیص دهد بسته چگونه باید نصب یا به‌روزرسانی شود.

- `openclaw.install` را با منبع نصب پشتیبانی‌شده، مانند
  `clawhubSpec`، `npmSpec` یا `localPath`، پر کنید.
- وقتی بیش از یک منبع نصب در دسترس است، `openclaw.install.defaultChoice` را تنظیم کنید.
- برای حداقل نسخه میزبان OpenClaw از `openclaw.install.minHostVersion` استفاده کنید.
- [فیلدهای package.json که بر discovery اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-plugin-api-compat-missing

بسته بازه API مربوط به Plugin در OpenClaw را که پشتیبانی می‌کند اعلام نمی‌کند.

- `openclaw.compat.pluginApi` را به `package.json` اضافه کنید.
- از نسخه API مربوط به Plugin در OpenClaw یا کف semver که بر اساس آن ساخته و آزمایش کرده‌اید
  استفاده کنید.
- این مورد را از نسخه بسته جدا نگه دارید. نسخه بسته انتشار
  Plugin را توصیف می‌کند؛ `openclaw.compat.pluginApi` contract مربوط به API میزبان را توصیف می‌کند.
- [فیلدهای package.json که بر discovery اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-min-host-version-drift

حداقل نسخه میزبان بسته با فراداده نسخه OpenClaw که بسته بر اساس آن ساخته شده است
مطابقت ندارد.

- `openclaw.install.minHostVersion` را بررسی کنید.
- هر فراداده build مربوط به OpenClaw در بسته، مانند نسخه OpenClaw
  استفاده‌شده هنگام انتشار، را بررسی کنید.
- حداقل نسخه میزبان را با بازه نسخه میزبان که بسته
  واقعاً پشتیبانی می‌کند همسو کنید.
- [فیلدهای package.json که بر discovery اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-manifest-version-drift

نسخه بسته و نسخه manifest مربوط به Plugin با هم ناسازگارند.

- `package.json#version` را به‌عنوان نسخه انتشار بسته ترجیح دهید.
- اگر `openclaw.plugin.json` نیز `version` دارد، آن را به‌روزرسانی کنید تا مطابقت داشته باشد یا
  وقتی فراداده بسته مرجع معتبر است، فراداده نسخه manifest قدیمی را حذف کنید.
- پس از تغییر فراداده منتشرشده، یک نسخه جدید از بسته منتشر کنید.
- [Plugin manifest](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-unsupported-metadata

بلوک `package.json#openclaw` شامل فیلدهایی است که به‌عنوان فراداده بسته
OpenClaw پشتیبانی نمی‌شوند.

- فیلدهای پشتیبانی‌نشده مانند `openclaw.bundle` را حذف کنید.
- فراداده Plugin بومی را در `openclaw.plugin.json` نگه دارید.
- entrypointهای بسته، سازگاری، نصب، setup و فراداده catalog را
  در فیلدهای پشتیبانی‌شده `package.json#openclaw` نگه دارید.
- [فیلدهای package.json که بر discovery اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## artifact منتشرشده

### package-npm-pack-unavailable

بسته نمی‌تواند به artifactای بسته‌بندی شود که ClawHub آن را بررسی یا
منتشر می‌کند.

- `npm pack --dry-run` را از ریشه بسته اجرا کنید.
- فراداده نامعتبر بسته، scriptهای lifecycle خراب، یا entries فایل‌هایی را که
  باعث شکست بسته‌بندی می‌شوند اصلاح کنید.
- اگر این بسته برای انتشار عمومی در نظر گرفته شده است، `private: true` را حذف کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-entrypoint-missing

بسته می‌تواند بسته‌بندی شود، اما artifact بسته‌بندی‌شده شامل
فایل‌های entrypoint اعلام‌شده در `package.json#openclaw` نیست.

- `npm pack --dry-run` را اجرا کنید و فایل‌هایی را که گنجانده خواهند شد بررسی کنید.
- entrypointهای تولیدشده را پیش از بسته‌بندی build کنید.
- `files`، `.npmignore` یا خروجی build را به‌روزرسانی کنید تا entrypointهای اعلام‌شده
  گنجانده شوند.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-metadata-missing

artifact بسته‌بندی‌شده فاقد فراداده OpenClaw است که در بسته source شما وجود دارد.

- `npm pack --dry-run` را اجرا کنید و فایل‌های فراداده گنجانده‌شده را بررسی کنید.
- مطمئن شوید `package.json` شامل بلوک `openclaw` در artifact بسته‌بندی‌شده است.
- وقتی بسته یک Plugin بومی OpenClaw است، مطمئن شوید `openclaw.plugin.json` گنجانده شده است.
- `files` یا `.npmignore` را به‌روزرسانی کنید تا فراداده بسته حذف نشود.
- [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## فراداده manifest

### manifest-name-missing

مانیفست Plugin بومی شامل نام نمایشی نیست.

- یک فیلد `name` غیرخالی به `openclaw.plugin.json` اضافه کنید.
- `name` را خوانا برای انسان نگه دارید و `id` را به‌عنوان شناسه پایدار ماشینی حفظ کنید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### manifest-unknown-fields

مانیفست Plugin فیلدهای سطح بالایی دارد که OpenClaw از آن‌ها پشتیبانی نمی‌کند.

- هر فیلد سطح بالا را با
  [مرجع فیلدهای مانیفست](/fa/plugins/manifest#top-level-field-reference) مقایسه کنید.
- فیلدهای سفارشی را از `openclaw.plugin.json` حذف کنید.
- فراداده بسته یا نصب را به‌جای مانیفست، به فیلدهای پشتیبانی‌شده `package.json#openclaw`
  منتقل کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### manifest-unknown-contracts

مانیفست کلیدهای پشتیبانی‌نشده‌ای را داخل `contracts` اعلام می‌کند.

- هر کلید زیر `contracts` را با
  [مرجع قراردادها](/fa/plugins/manifest#contracts-reference) مقایسه کنید.
- کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید.
- رفتار زمان اجرا را به کد ثبت Plugin منتقل کنید و `contracts` را
  به فراداده ایستای مالکیت قابلیت محدود نگه دارید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

## SDK و مهاجرت سازگاری

### legacy-root-sdk-import

Plugin از barrel ریشه SDK منسوخ‌شده import می‌کند:
`openclaw/plugin-sdk`.

- importهای root-barrel را با importهای subpath عمومی و متمرکز جایگزین کنید.
- برای `definePluginEntry` از `openclaw/plugin-sdk/plugin-entry` استفاده کنید.
- برای helperهای ورودی کانال از `openclaw/plugin-sdk/channel-core` استفاده کنید.
- برای پیدا کردن import محدود، از [قراردادهای import](/fa/plugins/building-plugins#import-conventions) و
  [subpathهای SDK Plugin](/fa/plugins/sdk-subpaths) استفاده کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### reserved-sdk-import

Plugin یک مسیر SDK را import می‌کند که برای Pluginهای همراه یا سازگاری
داخلی رزرو شده است.

- importهای SDK داخلی رزروشده OpenClaw را با subpathهای عمومی مستندشده
  `openclaw/plugin-sdk/*` جایگزین کنید.
- اگر این رفتار SDK عمومی ندارد، helper را داخل بسته خود نگه دارید یا
  یک API عمومی OpenClaw درخواست کنید.
- برای انتخاب یک import پشتیبانی‌شده، از [subpathهای SDK Plugin](/fa/plugins/sdk-subpaths) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) استفاده کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### sdk-load-session-store

Plugin هنوز از helper منسوخ‌شده کل مخزن نشست
`loadSessionStore` استفاده می‌کند.

- هنگام خواندن وضعیت نشست از `getSessionEntry(...)` یا `listSessionEntries(...)`
  استفاده کنید.
- هنگام نوشتن وضعیت نشست از `patchSessionEntry(...)` یا `upsertSessionEntry(...)`
  استفاده کنید.
- از بارگذاری، تغییر دادن، و ذخیره کردن کل شیء مخزن نشست خودداری کنید.
- `loadSessionStore(...)` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای SDK Plugin](/fa/plugins/sdk-subpaths) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### sdk-session-store-write

Plugin هنوز از یک helper نوشتن منسوخ‌شده کل مخزن نشست مانند
`saveSessionStore` یا `updateSessionStore` استفاده می‌کند.

- هنگام به‌روزرسانی فیلدها روی یک ورودی نشست موجود، از `patchSessionEntry(...)`
  استفاده کنید.
- هنگام جایگزینی یا ایجاد یک ورودی نشست، از `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، تغییر دادن، و ذخیره کردن کل شیء مخزن نشست خودداری کنید.
- helperهای نوشتن کل مخزن را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای SDK Plugin](/fa/plugins/sdk-subpaths) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### sdk-session-file-helper

Plugin هنوز از helperهای منسوخ‌شده مسیر فایل نشست مانند
`resolveSessionFilePath` یا `resolveAndPersistSessionFile` استفاده می‌کند.

- برای خواندن فراداده نشست بر اساس هویت agent و نشست، از `getSessionEntry(...)`
  استفاده کنید.
- برای پایدارسازی فراداده نشست، از `patchSessionEntry(...)` یا `upsertSessionEntry(...)`
  استفاده کنید.
- وقتی کد در حال آماده‌سازی یک عملیات رونوشت است، از هویت رونوشت یا helperهای
  target استفاده کنید.
- مسیرهای فایل رونوشت قدیمی را پایدار نکنید و به آن‌ها وابسته نشوید.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای SDK Plugin](/fa/plugins/sdk-subpaths) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### sdk-session-transcript-file-target

Plugin هنوز از helper منسوخ‌شده target فایل رونوشت
`resolveSessionTranscriptLegacyFileTarget` استفاده می‌کند.

- وقتی کد فقط به هویت عمومی نشست نیاز دارد، از `resolveSessionTranscriptIdentity(...)` استفاده کنید.
- وقتی کد به target ساختاریافته عملیات رونوشت نیاز دارد، از `resolveSessionTranscriptTarget(...)` استفاده کنید.
- از خواندن یا ساخت مستقیم targetهای فایل رونوشت قدیمی خودداری کنید.
- helper قدیمی را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما هنوز
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای SDK Plugin](/fa/plugins/sdk-subpaths) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### sdk-session-transcript-low-level

Plugin هنوز از helperهای سطح‌پایین منسوخ‌شده رونوشت مانند
`appendSessionTranscriptMessage` یا `emitSessionTranscriptUpdate` استفاده می‌کند.

- برای افزودن به رونوشت، از `appendSessionTranscriptMessageByIdentity(...)` استفاده کنید.
- برای اعلان‌های به‌روزرسانی رونوشت، از `publishSessionTranscriptUpdateByIdentity(...)` استفاده کنید.
- سطح زمان اجرای ساختاریافته رونوشت را ترجیح دهید تا OpenClaw بتواند
  مرزهای تراکنش و مدیریت هویت درست را اعمال کند.
- helperهای سطح‌پایین رونوشت را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [subpathهای SDK Plugin](/fa/plugins/sdk-subpaths) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### legacy-before-agent-start

Plugin هنوز از hook قدیمی `before_agent_start` استفاده می‌کند.

- کارهای override مدل یا ارائه‌دهنده را به `before_model_resolve` منتقل کنید.
- کارهای تغییر prompt یا context را به `before_prompt_build` منتقل کنید.
- `before_agent_start` را فقط تا زمانی نگه دارید که بازه سازگاری اعلام‌شده شما هنوز
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [Hookها](/fa/plugins/hooks) و
  [سازگاری Plugin](/fa/plugins/compatibility) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### provider-auth-env-vars

مانیفست هنوز از فراداده auth ارائه‌دهنده قدیمی `providerAuthEnvVars` استفاده می‌کند.

- فراداده env-var ارائه‌دهنده را در `setup.providers[].envVars` بازتاب دهید.
- `providerAuthEnvVars` را فقط تا زمانی به‌عنوان فراداده سازگاری نگه دارید که بازه
  OpenClaw پشتیبانی‌شده شما هنوز به آن نیاز دارد.
- [مرجع setup](/fa/plugins/manifest#setup-reference) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### channel-env-vars

مانیفست از فراداده env-var کانال قدیمی یا کهنه استفاده می‌کند، بدون فراداده setup
یا config فعلی که ClawHub انتظار دارد.

- فراداده env-var کانال را declarative نگه دارید تا OpenClaw بتواند وضعیت setup را
  بدون بارگذاری زمان اجرای کانال بررسی کند.
- setup کانال مبتنی بر env را به setup فعلی، config کانال، یا
  فراداده کانال بسته که شکل Plugin شما استفاده می‌کند بازتاب دهید.
- `channelEnvVars` را فقط تا زمانی به‌عنوان فراداده سازگاری نگه دارید که نسخه‌های قدیمی‌تر
  پشتیبانی‌شده OpenClaw هنوز به آن نیاز دارند.
- [مانیفست Plugin](/fa/plugins/manifest) و
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

## مانیفست امنیت

### security-manifest-schema-unavailable

بسته، `openclaw.security.json` را با ارجاع schemaای منتشر می‌کند که ClawHub
آن را به‌عنوان موجود نمی‌شناسد.

- اگر URL schema فقط مشورتی است، آن را حذف کنید.
- فقط پس از اینکه OpenClaw یک schema نسخه‌دار منتشر کرد، از آن استفاده کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### unrecognized-security-manifest

بسته یک فایل مانیفست امنیت پشتیبانی‌نشده منتشر می‌کند.

- تا زمانی که OpenClaw یک schema نسخه‌دار برای مانیفست امنیت و رفتار ClawHub را مستند نکرده است،
  `openclaw.security.json` را حذف کنید.
- رفتار حساس به امنیت را تا زمان وجود قرارداد مانیفست، در اسناد عمومی بسته یا
  README خود مستند نگه دارید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

## مرتبط

- [CLI ClawHub](/fa/clawhub/cli)
- [انتشار در ClawHub](/fa/clawhub/publishing)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مانیفست Plugin](/fa/plugins/manifest)
- [نقاط ورودی Plugin](/fa/plugins/sdk-entrypoints)
- [سازگاری Plugin](/fa/plugins/compatibility)
