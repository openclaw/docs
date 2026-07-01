---
read_when:
    - شما `clawhub package validate` را اجرا کردید و باید یافته‌های Plugin را برطرف کنید
    - ClawHub انتشار بسته Plugin را رد کرد یا درباره آن هشدار داد
    - شما در حال به‌روزرسانی فرادادهٔ بستهٔ Plugin پیش از انتشار هستید
summary: یافته‌های اعتبارسنجی بسته Plugin در ClawHub را پیش از انتشار برطرف کنید
title: اصلاحات اعتبارسنجی Plugin
x-i18n:
    generated_at: "2026-07-01T13:10:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# رفع‌های اعتبارسنجی Plugin

ClawHub بسته‌های Plugin را پیش از انتشار اعتبارسنجی می‌کند و همچنین می‌تواند یافته‌های
اسکن‌های خودکار بسته را نشان دهد. این صفحه یافته‌های روبه‌روی نویسنده را پوشش می‌دهد؛ یعنی
یافته‌هایی که نویسنده Plugin می‌تواند در فراداده بسته، مانیفست، واردکردن‌های SDK
یا آرتیفکت منتشرشده خود رفع کند.

این صفحه یافته‌های پوشش داخلی Plugin Inspector را پوشش نمی‌دهد. اگر یک گزارش کامل
کدهای نگهداری اسکنر را بدون راهنمایی رفع برای نویسنده شامل شود، آن‌ها برای نگه‌دارندگان
OpenClaw هستند، نه نویسندگان Plugin.

پس از اعمال هر رفع، دوباره اجرا کنید:

```bash
clawhub package validate <path-to-plugin>
```

## یافته‌های روبه‌روی نویسنده

| کد                                     | از اینجا شروع کنید                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `package-json-missing`                 | [افزودن فراداده بسته](/fa/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`    | [افزودن بلوک openclaw بسته](/fa/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                                |
| `package-openclaw-entry-missing`       | [اعلام نقاط ورود بسته OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                               |
| `package-entrypoint-missing`           | [انتشار نقطه ورود اعلام‌شده](/fa/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                      |
| `package-install-metadata-incomplete`  | [تکمیل فراداده نصب](/fa/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                                      |
| `package-plugin-api-compat-missing`    | [اعلام سازگاری API مربوط به Plugin](/fa/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                        |
| `package-min-host-version-drift`       | [هم‌راستا کردن حداقل نسخه میزبان](/fa/clawhub/plugin-validation-fixes#package-min-host-version-drift)                             |
| `package-manifest-version-drift`       | [هم‌راستا کردن نسخه‌های بسته و مانیفست](/fa/clawhub/plugin-validation-fixes#package-manifest-version-drift)                       |
| `package-openclaw-unsupported-metadata` | [حذف فراداده پشتیبانی‌نشده بسته OpenClaw](/fa/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)              |
| `package-npm-pack-unavailable`         | [قابل بسته‌بندی کردن آرتیفکت npm](/fa/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                               |
| `package-npm-pack-entrypoint-missing`  | [گنجاندن نقاط ورود در خروجی npm pack](/fa/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                    |
| `package-npm-pack-metadata-missing`    | [گنجاندن فراداده در خروجی npm pack](/fa/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                        |
| `manifest-name-missing`                | [افزودن نام نمایشی مانیفست](/fa/clawhub/plugin-validation-fixes#manifest-name-missing)                                            |
| `manifest-unknown-fields`              | [حذف فیلدهای پشتیبانی‌نشده مانیفست](/fa/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`           | [حذف کلیدهای قرارداد پشتیبانی‌نشده](/fa/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                               |
| `legacy-root-sdk-import`               | [جایگزینی واردکردن‌های SDK ریشه](/fa/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                      |
| `reserved-sdk-import`                  | [حذف واردکردن‌های رزروشده SDK](/fa/clawhub/plugin-validation-fixes#reserved-sdk-import)                                           |
| `sdk-load-session-store`               | [جایگزینی دسترسی به کل session store](/fa/clawhub/plugin-validation-fixes#sdk-load-session-store)                                 |
| `sdk-session-store-write`              | [جایگزینی نوشتن در کل session store](/fa/clawhub/plugin-validation-fixes#sdk-session-store-write)                                 |
| `sdk-session-file-helper`              | [جایگزینی کمک‌گرهای مسیر فایل نشست](/fa/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                  |
| `sdk-session-transcript-file-target`   | [جایگزینی هدف‌های فایل رونوشت قدیمی](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                      |
| `sdk-session-transcript-low-level`     | [جایگزینی کمک‌گرهای سطح پایین رونوشت](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`            | [جایگزینی before_agent_start](/fa/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                      |
| `provider-auth-env-vars`               | [انتقال متغیرهای محیطی ارائه‌دهنده به فراداده راه‌اندازی](/fa/clawhub/plugin-validation-fixes#provider-auth-env-vars)             |
| `channel-env-vars`                     | [بازتاب دادن متغیرهای محیطی کانال در فراداده فعلی](/fa/clawhub/plugin-validation-fixes#channel-env-vars)                         |
| `security-manifest-schema-unavailable` | [حذف ارجاع‌های طرح‌واره مانیفست امنیتیِ دردسترس‌نبودنی](/fa/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`       | [حذف فایل‌های مانیفست امنیتی پشتیبانی‌نشده](/fa/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## فراداده بسته

### package-json-missing

ریشه بسته شامل `package.json` نیست، بنابراین ClawHub نمی‌تواند بسته npm، نسخه،
نقاط ورود یا فراداده OpenClaw را شناسایی کند.

- `package.json` را با `name`، `version` و `type` اضافه کنید.
- وقتی بسته یک Plugin مربوط به OpenClaw را عرضه می‌کند، یک بلوک `openclaw` اضافه کنید.
- برای یک نمونه حداقلی بسته از [ساخت Pluginها](/fa/plugins/building-plugins)
  و برای جداسازی بسته از مانیفست از [مانیفست Plugin](/fa/plugins/manifest#manifest-versus-packagejson)
  استفاده کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-openclaw-metadata-missing

بسته `package.json` دارد، اما فراداده بسته OpenClaw را اعلام نمی‌کند.

- `package.json#openclaw` را اضافه کنید.
- فراداده نقطه ورود مانند `openclaw.extensions` یا
  `openclaw.runtimeExtensions` را شامل کنید.
- وقتی بسته از طریق ClawHub منتشر یا نصب خواهد شد، فراداده سازگاری و نصب را اضافه کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-openclaw-entry-missing

فراداده بسته وجود دارد، اما یک نقطه ورود زمان اجرای OpenClaw را اعلام نمی‌کند.

- برای نقاط ورود بومی Plugin، `openclaw.extensions` را اضافه کنید.
- وقتی بسته منتشرشده باید JavaScript ساخته‌شده را بارگذاری کند،
  `openclaw.runtimeExtensions` را اضافه کنید.
- همه مسیرهای نقطه ورود را داخل دایرکتوری بسته نگه دارید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) و
  [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-entrypoint-missing

بسته یک نقطه ورود OpenClaw اعلام می‌کند، اما فایل ارجاع‌شده در بسته‌ای که
اعتبارسنجی می‌شود وجود ندارد.

- هر مسیر را در `openclaw.extensions`، `openclaw.runtimeExtensions`،
  `openclaw.setupEntry` و `openclaw.runtimeSetupEntry` بررسی کنید.
- اگر نقطه ورود در `dist` تولید می‌شود، بسته را بسازید.
- اگر نقطه ورود جابه‌جا شده است، فراداده را به‌روزرسانی کنید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-install-metadata-incomplete

ClawHub نمی‌تواند تشخیص دهد بسته چگونه باید نصب یا به‌روزرسانی شود.

- `openclaw.install` را با منبع نصب پشتیبانی‌شده، مانند
  `clawhubSpec`، `npmSpec` یا `localPath` پر کنید.
- وقتی بیش از یک منبع نصب دردسترس است، `openclaw.install.defaultChoice` را تنظیم کنید.
- برای حداقل نسخه میزبان OpenClaw از `openclaw.install.minHostVersion` استفاده کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-plugin-api-compat-missing

بسته بازه API مربوط به Plugin در OpenClaw را که پشتیبانی می‌کند اعلام نمی‌کند.

- `openclaw.compat.pluginApi` را به `package.json` اضافه کنید.
- از نسخه API مربوط به Plugin در OpenClaw یا کف semver که بر اساس آن ساخته و آزمایش کرده‌اید استفاده کنید.
- این را از نسخه بسته جدا نگه دارید. نسخه بسته انتشار Plugin را توصیف می‌کند؛
  `openclaw.compat.pluginApi` قرارداد API میزبان را توصیف می‌کند.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-min-host-version-drift

حداقل نسخه میزبان بسته با فراداده نسخه OpenClaw که بسته بر اساس آن ساخته شده است
مطابقت ندارد.

- `openclaw.install.minHostVersion` را بررسی کنید.
- هر فراداده ساخت OpenClaw در بسته، مانند نسخه OpenClaw استفاده‌شده هنگام انتشار، را بررسی کنید.
- حداقل نسخه میزبان را با بازه نسخه میزبانی که بسته واقعاً پشتیبانی می‌کند هم‌راستا کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-manifest-version-drift

نسخه بسته و نسخه مانیفست Plugin با هم اختلاف دارند.

- `package.json#version` را به‌عنوان نسخه انتشار بسته ترجیح دهید.
- اگر `openclaw.plugin.json` نیز `version` دارد، آن را برای تطبیق به‌روزرسانی کنید یا
  وقتی فراداده بسته مرجع است، فراداده نسخه مانیفست کهنه را حذف کنید.
- پس از تغییر فراداده منتشرشده، یک نسخه بسته جدید منتشر کنید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-openclaw-unsupported-metadata

بلوک `package.json#openclaw` شامل فیلدهایی است که به‌عنوان فراداده بسته OpenClaw
پشتیبانی نمی‌شوند.

- فیلدهای پشتیبانی‌نشده مانند `openclaw.bundle` را حذف کنید.
- فراداده Plugin بومی را در `openclaw.plugin.json` نگه دارید.
- نقاط ورود بسته، سازگاری، نصب، راه‌اندازی و فراداده کاتالوگ را در فیلدهای
  پشتیبانی‌شده `package.json#openclaw` نگه دارید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

## آرتیفکت منتشرشده

### package-npm-pack-unavailable

بسته را نمی‌توان به آرتیفکتی بسته‌بندی کرد که ClawHub بررسی یا منتشر می‌کند.

- `npm pack --dry-run` را از ریشه بسته اجرا کنید.
- فراداده نامعتبر بسته، اسکریپت‌های چرخه‌عمر خراب، یا ورودی‌های files را که
  باعث شکست بسته‌بندی می‌شوند رفع کنید.
- اگر این بسته برای انتشار عمومی در نظر گرفته شده است، `private: true` را حذف کنید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-npm-pack-entrypoint-missing

بسته قابل بسته‌بندی است، اما آرتیفکت بسته‌بندی‌شده فایل‌های نقطه ورودی را که در
`package.json#openclaw` اعلام شده‌اند شامل نمی‌شود.

- `npm pack --dry-run` را اجرا کنید و فایل‌هایی را که شامل خواهند شد بررسی کنید.
- پیش از بسته‌بندی، نقاط ورود تولیدشده را بسازید.
- `files`، `.npmignore` یا خروجی ساخت را به‌روزرسانی کنید تا نقاط ورود اعلام‌شده
  شامل شوند.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

### package-npm-pack-metadata-missing

آرتیفکت بسته‌بندی‌شده فراداده OpenClaw را که در بسته منبع شما وجود دارد کم دارد.

- `npm pack --dry-run` را اجرا کنید و فایل‌های فراداده شامل‌شده را بررسی کنید.
- مطمئن شوید `package.json` بلوک `openclaw` را در آرتیفکت بسته‌بندی‌شده شامل می‌کند.
- وقتی بسته یک Plugin بومی OpenClaw است، مطمئن شوید `openclaw.plugin.json` شامل شده است.
- `files` یا `.npmignore` را به‌روزرسانی کنید تا فراداده بسته حذف نشود.
- [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.
- دوباره `clawhub package validate <path-to-plugin>` را اجرا کنید.

## فراداده مانیفست

### manifest-name-missing

مانیفست Plugin بومی شامل نام نمایشی نیست.

- یک فیلد `name` غیرخالی به `openclaw.plugin.json` اضافه کنید.
- `name` را خوانا برای انسان نگه دارید و `id` را به‌عنوان شناسهٔ پایدار ماشین نگه دارید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-fields

مانیفست Plugin دارای فیلدهای سطح‌بالایی است که OpenClaw پشتیبانی نمی‌کند.

- هر فیلد سطح‌بالا را با
  [مرجع فیلدهای مانیفست](/fa/plugins/manifest#top-level-field-reference) مقایسه کنید.
- فیلدهای سفارشی را از `openclaw.plugin.json` حذف کنید.
- فرادادهٔ بسته یا نصب را به‌جای مانیفست، به فیلدهای پشتیبانی‌شدهٔ `package.json#openclaw`
  منتقل کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-contracts

مانیفست کلیدهای پشتیبانی‌نشده‌ای را داخل `contracts` اعلام می‌کند.

- هر کلید زیر `contracts` را با
  [مرجع contracts](/fa/plugins/manifest#contracts-reference) مقایسه کنید.
- کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید.
- رفتار زمان اجرا را به کد ثبت Plugin منتقل کنید و `contracts`
  را به فرادادهٔ ایستای مالکیت قابلیت محدود نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مهاجرت SDK و سازگاری

### legacy-root-sdk-import

Plugin از barrel ریشهٔ منسوخ‌شدهٔ SDK import می‌کند:
`openclaw/plugin-sdk`.

- importهای root-barrel را با importهای زیرمسیر عمومی متمرکز جایگزین کنید.
- برای `definePluginEntry` از `openclaw/plugin-sdk/plugin-entry` استفاده کنید.
- برای کمک‌سازهای ورودی کانال از `openclaw/plugin-sdk/channel-core` استفاده کنید.
- برای یافتن import محدودتر، از [قراردادهای Import](/fa/plugins/building-plugins#import-conventions) و
  [زیرمسیرهای SDK Plugin](/fa/plugins/sdk-subpaths) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### reserved-sdk-import

Plugin یک مسیر SDK را import می‌کند که برای Pluginهای بسته‌بندی‌شده یا سازگاری
داخلی رزرو شده است.

- importهای SDK داخلی رزروشدهٔ OpenClaw را با زیرمسیرهای عمومی مستندشدهٔ
  `openclaw/plugin-sdk/*` جایگزین کنید.
- اگر رفتار SDK عمومی ندارد، کمک‌ساز را داخل بستهٔ خود نگه دارید یا
  یک API عمومی OpenClaw درخواست کنید.
- برای انتخاب import پشتیبانی‌شده، از [زیرمسیرهای SDK Plugin](/fa/plugins/sdk-subpaths) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-load-session-store

Plugin هنوز از کمک‌ساز منسوخ‌شدهٔ کل session-store
`loadSessionStore` استفاده می‌کند.

- هنگام خواندن وضعیت نشست، از `getSessionEntry(...)` یا `listSessionEntries(...)` استفاده کنید.
- هنگام نوشتن وضعیت نشست، از `patchSessionEntry(...)` یا `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، تغییر و ذخیرهٔ کل شیء session store خودداری کنید.
- `loadSessionStore(...)` را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما
  همچنان از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای SDK Plugin](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-store-write

Plugin هنوز از یک کمک‌ساز نوشتن منسوخ‌شدهٔ کل session-store مانند
`saveSessionStore` یا `updateSessionStore` استفاده می‌کند.

- هنگام به‌روزرسانی فیلدها روی یک ورودی نشست موجود، از `patchSessionEntry(...)` استفاده کنید.
- هنگام جایگزین کردن یا ایجاد یک ورودی نشست، از `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، تغییر و ذخیرهٔ کل شیء session store خودداری کنید.
- کمک‌سازهای نوشتن whole-store را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما
  همچنان از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای SDK Plugin](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-file-helper

Plugin هنوز از کمک‌سازهای منسوخ‌شدهٔ مسیر فایل نشست مانند
`resolveSessionFilePath` یا `resolveAndPersistSessionFile` استفاده می‌کند.

- برای خواندن فرادادهٔ نشست بر اساس عامل و هویت نشست، از `getSessionEntry(...)` استفاده کنید.
- برای ماندگار کردن فرادادهٔ نشست، از `patchSessionEntry(...)` یا `upsertSessionEntry(...)` استفاده کنید.
- وقتی کد در حال آماده‌سازی یک عملیات transcript است، از هویت transcript یا کمک‌سازهای target استفاده کنید.
- مسیرهای فایل transcript قدیمی را ماندگار نکنید و به آن‌ها وابسته نباشید.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای SDK Plugin](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-file-target

Plugin هنوز از کمک‌ساز منسوخ‌شدهٔ هدف فایل transcript
`resolveSessionTranscriptLegacyFileTarget` استفاده می‌کند.

- وقتی کد فقط به هویت عمومی نشست نیاز دارد، از `resolveSessionTranscriptIdentity(...)` استفاده کنید.
- وقتی کد به یک هدف ساختاریافته برای عملیات transcript نیاز دارد، از `resolveSessionTranscriptTarget(...)` استفاده کنید.
- از خواندن یا ساخت مستقیم هدف‌های فایل transcript قدیمی خودداری کنید.
- کمک‌ساز قدیمی را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما همچنان
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای SDK Plugin](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-low-level

Plugin هنوز از کمک‌سازهای سطح‌پایین transcript منسوخ‌شده مانند
`appendSessionTranscriptMessage` یا `emitSessionTranscriptUpdate` استفاده می‌کند.

- برای افزودن به transcript از `appendSessionTranscriptMessageByIdentity(...)` استفاده کنید.
- برای اعلان‌های به‌روزرسانی transcript از `publishSessionTranscriptUpdateByIdentity(...)` استفاده کنید.
- سطح زمان اجرای ساختاریافتهٔ transcript را ترجیح دهید تا OpenClaw بتواند
  مرزهای تراکنش و مدیریت هویت درست را اعمال کند.
- کمک‌سازهای سطح‌پایین transcript را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما
  همچنان از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیرمسیرهای SDK Plugin](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### legacy-before-agent-start

Plugin هنوز از hook قدیمی `before_agent_start` استفاده می‌کند.

- کار مربوط به override مدل یا ارائه‌دهنده را به `before_model_resolve` منتقل کنید.
- کار مربوط به تغییر prompt یا context را به `before_prompt_build` منتقل کنید.
- `before_agent_start` را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما همچنان
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [Hookها](/fa/plugins/hooks) و
  [سازگاری Plugin](/fa/plugins/compatibility) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### provider-auth-env-vars

مانیفست هنوز از فرادادهٔ احراز هویت ارائه‌دهندهٔ قدیمی `providerAuthEnvVars` استفاده می‌کند.

- فرادادهٔ env-var ارائه‌دهنده را در `setup.providers[].envVars` بازتاب دهید.
- `providerAuthEnvVars` را فقط به‌عنوان فرادادهٔ سازگاری نگه دارید، تا زمانی که بازهٔ
  پشتیبانی‌شدهٔ OpenClaw شما هنوز به آن نیاز دارد.
- [مرجع setup](/fa/plugins/manifest#setup-reference) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### channel-env-vars

مانیفست از فرادادهٔ env-var کانال قدیمی یا کهنه استفاده می‌کند، بدون فرادادهٔ setup یا config فعلی که ClawHub انتظار دارد.

- فرادادهٔ env-var کانال را اعلانی نگه دارید تا OpenClaw بتواند وضعیت setup را
  بدون بارگذاری زمان اجرای کانال بررسی کند.
- setup کانال مبتنی بر env را در setup فعلی، config کانال، یا
  فرادادهٔ کانال بسته که شکل Plugin شما استفاده می‌کند بازتاب دهید.
- `channelEnvVars` را فقط به‌عنوان فرادادهٔ سازگاری نگه دارید، تا زمانی که نسخه‌های قدیمی‌تر
  پشتیبانی‌شدهٔ OpenClaw هنوز به آن نیاز دارند.
- [مانیفست Plugin](/fa/plugins/manifest) و
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مانیفست امنیت

### security-manifest-schema-unavailable

بسته `openclaw.security.json` را با ارجاع schemaای منتشر می‌کند که ClawHub
آن را به‌عنوان در دسترس تشخیص نمی‌دهد.

- اگر URL schema فقط جنبهٔ توصیه‌ای دارد، آن را حذف کنید.
- فقط پس از آنکه OpenClaw یک schema نسخه‌دار منتشر کرد، از آن schema مستندشده استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### unrecognized-security-manifest

بسته یک فایل مانیفست امنیت پشتیبانی‌نشده منتشر می‌کند.

- تا زمانی که OpenClaw یک schema مانیفست امنیت نسخه‌دار و رفتار ClawHub را مستند نکرده است،
  `openclaw.security.json` را حذف کنید.
- تا زمان وجود قرارداد مانیفست، رفتار حساس از نظر امنیتی را در مستندات عمومی بستهٔ خود یا
  README مستند نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مرتبط

- [CLI ClawHub](/fa/clawhub/cli)
- [انتشار ClawHub](/fa/clawhub/publishing)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مانیفست Plugin](/fa/plugins/manifest)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [سازگاری Plugin](/fa/plugins/compatibility)
