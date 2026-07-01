---
read_when:
    - شما clawhub package validate را اجرا کرده‌اید و باید یافته‌های Plugin را برطرف کنید
    - ClawHub هنگام انتشار بسته Plugin آن را رد کرد یا هشدار داد
    - در حال به‌روزرسانی فرادادهٔ بستهٔ Plugin پیش از انتشار هستید
summary: یافته‌های اعتبارسنجی بستهٔ Plugin در ClawHub را پیش از انتشار برطرف کنید
title: رفع‌های اعتبارسنجی Plugin
x-i18n:
    generated_at: "2026-07-01T18:16:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# اصلاحات اعتبارسنجی Plugin

ClawHub بسته‌های Plugin را پیش از انتشار اعتبارسنجی می‌کند و همچنین می‌تواند یافته‌های
اسکن‌های خودکار بسته را نمایش دهد. این صفحه یافته‌های روبه‌روی نویسنده را پوشش می‌دهد، یعنی
یافته‌هایی که نویسنده Plugin می‌تواند در فراداده بسته، manifest، importهای SDK
یا artifact منتشرشده خود اصلاح کند.

این صفحه یافته‌های پوشش داخلی Plugin Inspector را پوشش نمی‌دهد. اگر یک گزارش کامل
کدهای نگهداری اسکنر را بدون راهنمایی اصلاح برای نویسنده داشته باشد، آن‌ها برای
نگه‌دارندگان OpenClaw هستند، نه نویسندگان Plugin.

پس از اعمال هر اصلاح، دوباره اجرا کنید:

```bash
clawhub package validate <path-to-plugin>
```

## یافته‌های روبه‌روی نویسنده

| کد                                      | از اینجا شروع کنید                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [فراداده بسته را اضافه کنید](/fa/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [بلوک openclaw بسته را اضافه کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [entrypointهای بسته OpenClaw را اعلان کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [entrypoint اعلان‌شده را منتشر کنید](/fa/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [فراداده نصب را کامل کنید](/fa/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [سازگاری API Plugin را اعلان کنید](/fa/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [حداقل نسخه میزبان را هم‌راستا کنید](/fa/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [نسخه‌های بسته و manifest را هم‌راستا کنید](/fa/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [فراداده پشتیبانی‌نشده بسته OpenClaw را حذف کنید](/fa/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [artifact npm را قابل بسته‌بندی کنید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [entrypointها را در خروجی npm pack بگنجانید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [فراداده را در خروجی npm pack بگنجانید](/fa/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [یک نام نمایشی manifest اضافه کنید](/fa/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [فیلدهای پشتیبانی‌نشده manifest را حذف کنید](/fa/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [کلیدهای contract پشتیبانی‌نشده را حذف کنید](/fa/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [importهای SDK ریشه را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [importهای SDK رزروشده را حذف کنید](/fa/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [دسترسی به کل session store را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [نوشتن در کل session store را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [helperهای مسیر فایل session را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [هدف‌های فایل transcript قدیمی را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [helperهای transcript سطح پایین را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start را جایگزین کنید](/fa/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [env varهای provider را به فراداده setup منتقل کنید](/fa/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [env varهای channel را در فراداده فعلی mirror کنید](/fa/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ارجاع‌های schema امنیتی manifest دردسترس‌نبودنی را حذف کنید](/fa/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [فایل‌های security manifest پشتیبانی‌نشده را حذف کنید](/fa/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## فراداده بسته

### package-json-missing

ریشه بسته شامل `package.json` نیست، بنابراین ClawHub نمی‌تواند بسته
npm، نسخه، entrypointها یا فراداده OpenClaw را شناسایی کند.

- `package.json` را با `name`، `version` و `type` اضافه کنید.
- وقتی بسته یک Plugin OpenClaw ارائه می‌کند، یک بلوک `openclaw` اضافه کنید.
- برای یک نمونه حداقلی بسته از [ساخت Pluginها](/fa/plugins/building-plugins)
  و برای تفکیک بسته در برابر manifest از [Plugin manifest](/fa/plugins/manifest#manifest-versus-packagejson)
  استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-metadata-missing

بسته `package.json` دارد، اما فراداده بسته OpenClaw را اعلان نمی‌کند.

- `package.json#openclaw` را اضافه کنید.
- فراداده entrypoint مانند `openclaw.extensions` یا
  `openclaw.runtimeExtensions` را شامل کنید.
- وقتی بسته از طریق ClawHub منتشر یا نصب خواهد شد، فراداده سازگاری و نصب را اضافه کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-entry-missing

فراداده بسته وجود دارد، اما یک entrypoint زمان اجرای OpenClaw را اعلان نمی‌کند.

- برای entrypointهای Plugin بومی، `openclaw.extensions` را اضافه کنید.
- وقتی بسته منتشرشده باید JavaScript ساخته‌شده را بارگذاری کند،
  `openclaw.runtimeExtensions` را اضافه کنید.
- همه مسیرهای entrypoint را داخل دایرکتوری بسته نگه دارید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) و
  [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-entrypoint-missing

بسته یک entrypoint OpenClaw اعلان می‌کند، اما فایل ارجاع‌شده از بسته‌ای که
اعتبارسنجی می‌شود وجود ندارد.

- هر مسیر را در `openclaw.extensions`، `openclaw.runtimeExtensions`،
  `openclaw.setupEntry` و `openclaw.runtimeSetupEntry` بررسی کنید.
- اگر entrypoint در `dist` تولید می‌شود، بسته را build کنید.
- اگر entrypoint جابه‌جا شده است، فراداده را به‌روزرسانی کنید.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-install-metadata-incomplete

ClawHub نمی‌تواند تشخیص دهد بسته چگونه باید نصب یا به‌روزرسانی شود.

- `openclaw.install` را با منبع نصب پشتیبانی‌شده پر کنید، مانند
  `clawhubSpec`، `npmSpec` یا `localPath`.
- وقتی بیش از یک منبع نصب دردسترس است، `openclaw.install.defaultChoice` را تنظیم کنید.
- برای حداقل نسخه میزبان OpenClaw از `openclaw.install.minHostVersion` استفاده کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-plugin-api-compat-missing

بسته محدوده API Plugin OpenClaw را که پشتیبانی می‌کند اعلان نمی‌کند.

- `openclaw.compat.pluginApi` را به `package.json` اضافه کنید.
- از نسخه API Plugin OpenClaw یا کف semver که بر اساس آن ساخته و آزمایش کرده‌اید
  استفاده کنید.
- این را از نسخه بسته جدا نگه دارید. نسخه بسته انتشار Plugin را توصیف می‌کند؛
  `openclaw.compat.pluginApi` قرارداد API میزبان را توصیف می‌کند.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-min-host-version-drift

حداقل نسخه میزبان بسته با فراداده نسخه OpenClaw که بسته بر اساس آن ساخته شده است
مطابقت ندارد.

- `openclaw.install.minHostVersion` را بررسی کنید.
- هر فراداده build مربوط به OpenClaw را در بسته بررسی کنید، مانند نسخه OpenClaw
  که هنگام انتشار استفاده شده است.
- حداقل نسخه میزبان را با محدوده نسخه میزبان که بسته واقعاً پشتیبانی می‌کند
  هم‌راستا کنید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-manifest-version-drift

نسخه بسته و نسخه Plugin manifest با هم ناسازگارند.

- `package.json#version` را به‌عنوان نسخه انتشار بسته ترجیح دهید.
- اگر `openclaw.plugin.json` نیز `version` دارد، آن را برای مطابقت به‌روزرسانی کنید
  یا وقتی فراداده بسته مرجع است، فراداده نسخه manifest قدیمی را حذف کنید.
- پس از تغییر فراداده منتشرشده، نسخه بسته جدیدی منتشر کنید.
- [Plugin manifest](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-openclaw-unsupported-metadata

بلوک `package.json#openclaw` شامل فیلدهایی است که به‌عنوان فراداده بسته OpenClaw
پشتیبانی نمی‌شوند.

- فیلدهای پشتیبانی‌نشده مانند `openclaw.bundle` را حذف کنید.
- فراداده Plugin بومی را در `openclaw.plugin.json` نگه دارید.
- entrypointهای بسته، سازگاری، نصب، setup و فراداده catalog را
  در فیلدهای پشتیبانی‌شده `package.json#openclaw` نگه دارید.
- [فیلدهای package.json که بر کشف اثر می‌گذارند](/fa/plugins/manifest#packagejson-fields-that-affect-discovery) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## artifact منتشرشده

### package-npm-pack-unavailable

بسته نمی‌تواند به artifactی بسته‌بندی شود که ClawHub آن را بررسی یا
منتشر می‌کند.

- از ریشه بسته `npm pack --dry-run` را اجرا کنید.
- فراداده نامعتبر بسته، اسکریپت‌های lifecycle خراب، یا entries فایل‌هایی را که
  باعث شکست بسته‌بندی می‌شوند اصلاح کنید.
- اگر این بسته برای انتشار عمومی در نظر گرفته شده است، `private: true` را حذف کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-entrypoint-missing

بسته می‌تواند بسته‌بندی شود، اما artifact بسته‌بندی‌شده شامل فایل‌های
entrypoint اعلان‌شده در `package.json#openclaw` نیست.

- `npm pack --dry-run` را اجرا کنید و فایل‌هایی را که شامل خواهند شد بررسی کنید.
- entrypointهای تولیدشده را پیش از بسته‌بندی build کنید.
- `files`، `.npmignore` یا خروجی build را به‌روزرسانی کنید تا entrypointهای
  اعلان‌شده شامل شوند.
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### package-npm-pack-metadata-missing

artifact بسته‌بندی‌شده فاقد فراداده OpenClaw است که در بسته منبع شما وجود دارد.

- `npm pack --dry-run` را اجرا کنید و فایل‌های فراداده شامل‌شده را بررسی کنید.
- مطمئن شوید `package.json` بلوک `openclaw` را در artifact بسته‌بندی‌شده شامل می‌کند.
- وقتی بسته یک Plugin بومی OpenClaw است، مطمئن شوید `openclaw.plugin.json` شامل شده است.
- `files` یا `.npmignore` را به‌روزرسانی کنید تا فراداده بسته مستثنا نشود.
- [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## فراداده manifest

### manifest-name-missing

مانیفست Plugin بومی شامل نام نمایشی نیست.

- یک فیلد `name` غیرخالی به `openclaw.plugin.json` اضافه کنید.
- `name` را خوانا برای انسان نگه دارید و `id` را به‌عنوان شناسهٔ پایدار ماشینی حفظ کنید.
- [مانیفست Plugin](/fa/plugins/manifest) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-fields

مانیفست Plugin فیلدهای سطح‌بالایی دارد که OpenClaw از آن‌ها پشتیبانی نمی‌کند.

- هر فیلد سطح‌بالا را با
  [مرجع فیلدهای مانیفست](/fa/plugins/manifest#top-level-field-reference) مقایسه کنید.
- فیلدهای سفارشی را از `openclaw.plugin.json` حذف کنید.
- فرادادهٔ بسته یا نصب را به‌جای مانیفست، به فیلدهای پشتیبانی‌شدهٔ `package.json#openclaw`
  منتقل کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### manifest-unknown-contracts

مانیفست، کلیدهای پشتیبانی‌نشده‌ای را داخل `contracts` اعلام می‌کند.

- هر کلید زیر `contracts` را با
  [مرجع قراردادها](/fa/plugins/manifest#contracts-reference) مقایسه کنید.
- کلیدهای قرارداد پشتیبانی‌نشده را حذف کنید.
- رفتار زمان اجرا را به کد ثبت Plugin منتقل کنید و `contracts` را
  به فرادادهٔ ایستای مالکیت قابلیت محدود نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مهاجرت SDK و سازگاری

### legacy-root-sdk-import

Plugin از barrel ریشهٔ منسوخ SDK ایمپورت می‌کند:
`openclaw/plugin-sdk`.

- ایمپورت‌های root-barrel را با ایمپورت‌های زیربخش عمومی متمرکز جایگزین کنید.
- برای `definePluginEntry` از `openclaw/plugin-sdk/plugin-entry` استفاده کنید.
- برای کمک‌کننده‌های ورودی کانال از `openclaw/plugin-sdk/channel-core` استفاده کنید.
- برای یافتن ایمپورت محدود، از [قراردادهای ایمپورت](/fa/plugins/building-plugins#import-conventions) و
  [زیربخش‌های Plugin SDK](/fa/plugins/sdk-subpaths) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### reserved-sdk-import

Plugin یک مسیر SDK را ایمپورت می‌کند که برای Pluginهای بسته‌بندی‌شده یا سازگاری
داخلی رزرو شده است.

- ایمپورت‌های SDK داخلی رزروشدهٔ OpenClaw را با زیربخش‌های عمومی مستندشدهٔ
  `openclaw/plugin-sdk/*` جایگزین کنید.
- اگر رفتار، SDK عمومی ندارد، کمک‌کننده را داخل بستهٔ خود نگه دارید یا
  یک API عمومی OpenClaw درخواست کنید.
- برای انتخاب یک ایمپورت پشتیبانی‌شده، از [زیربخش‌های Plugin SDK](/fa/plugins/sdk-subpaths) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-load-session-store

Plugin هنوز از کمک‌کنندهٔ منسوخ کل session-store یعنی
`loadSessionStore` استفاده می‌کند.

- هنگام خواندن وضعیت نشست، از `getSessionEntry(...)` یا `listSessionEntries(...)`
  استفاده کنید.
- هنگام نوشتن وضعیت نشست، از `patchSessionEntry(...)` یا `upsertSessionEntry(...)`
  استفاده کنید.
- از بارگذاری، تغییر و ذخیرهٔ کل شیء session store خودداری کنید.
- `loadSessionStore(...)` را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیربخش‌های Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-store-write

Plugin هنوز از یک کمک‌کنندهٔ نوشتن منسوخ کل session-store مانند
`saveSessionStore` یا `updateSessionStore` استفاده می‌کند.

- هنگام به‌روزرسانی فیلدها روی یک ورودی نشست موجود، از `patchSessionEntry(...)`
  استفاده کنید.
- هنگام جایگزینی یا ایجاد یک ورودی نشست، از `upsertSessionEntry(...)` استفاده کنید.
- از بارگذاری، تغییر و ذخیرهٔ کل شیء session store خودداری کنید.
- کمک‌کننده‌های نوشتن whole-store را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیربخش‌های Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-file-helper

Plugin هنوز از کمک‌کننده‌های منسوخ مسیر فایل نشست مانند
`resolveSessionFilePath` یا `resolveAndPersistSessionFile` استفاده می‌کند.

- برای خواندن فرادادهٔ نشست بر اساس عامل و هویت نشست، از `getSessionEntry(...)`
  استفاده کنید.
- برای پایدارسازی فرادادهٔ نشست، از `patchSessionEntry(...)` یا `upsertSessionEntry(...)`
  استفاده کنید.
- وقتی کد در حال آماده‌سازی یک عملیات رونوشت است، از کمک‌کننده‌های هویت رونوشت یا هدف
  استفاده کنید.
- مسیرهای فایل رونوشت قدیمی را پایدار نکنید و به آن‌ها وابسته نشوید.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیربخش‌های Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-file-target

Plugin هنوز از کمک‌کنندهٔ منسوخ هدف فایل رونوشت
`resolveSessionTranscriptLegacyFileTarget` استفاده می‌کند.

- وقتی کد فقط به هویت عمومی نشست نیاز دارد، از `resolveSessionTranscriptIdentity(...)`
  استفاده کنید.
- وقتی کد به یک هدف ساختاریافته برای عملیات رونوشت نیاز دارد، از `resolveSessionTranscriptTarget(...)`
  استفاده کنید.
- از خواندن یا ساخت مستقیم هدف‌های فایل رونوشت قدیمی خودداری کنید.
- کمک‌کنندهٔ قدیمی را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما هنوز
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیربخش‌های Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### sdk-session-transcript-low-level

Plugin هنوز از کمک‌کننده‌های منسوخ سطح‌پایین رونوشت مانند
`appendSessionTranscriptMessage` یا `emitSessionTranscriptUpdate` استفاده می‌کند.

- برای افزودن به رونوشت، از `appendSessionTranscriptMessageByIdentity(...)` استفاده کنید.
- برای اعلان‌های به‌روزرسانی رونوشت، از `publishSessionTranscriptUpdateByIdentity(...)`
  استفاده کنید.
- سطح ساختاریافتهٔ زمان اجرای رونوشت را ترجیح دهید تا OpenClaw بتواند مرزهای تراکنش
  و مدیریت هویت درست را اعمال کند.
- کمک‌کننده‌های سطح‌پایین رونوشت را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما
  هنوز از نسخه‌های قدیمی‌تر OpenClaw که به آن‌ها نیاز دارند پشتیبانی می‌کند.
- [API زمان اجرا](/fa/plugins/sdk-runtime#agent-session-state) و
  [زیربخش‌های Plugin SDK](/fa/plugins/sdk-subpaths) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### legacy-before-agent-start

Plugin هنوز از hook قدیمی `before_agent_start` استفاده می‌کند.

- کارهای override مدل یا ارائه‌دهنده را به `before_model_resolve` منتقل کنید.
- کارهای تغییر prompt یا context را به `before_prompt_build` منتقل کنید.
- `before_agent_start` را فقط تا زمانی نگه دارید که بازهٔ سازگاری اعلام‌شدهٔ شما هنوز
  از نسخه‌های قدیمی‌تر OpenClaw که به آن نیاز دارند پشتیبانی می‌کند.
- [Hookها](/fa/plugins/hooks) و
  [سازگاری Plugin](/fa/plugins/compatibility) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### provider-auth-env-vars

مانیفست هنوز از فرادادهٔ احراز هویت ارائه‌دهندهٔ قدیمی `providerAuthEnvVars` استفاده می‌کند.

- فرادادهٔ env-var ارائه‌دهنده را در `setup.providers[].envVars` بازتاب دهید.
- `providerAuthEnvVars` را فقط تا زمانی به‌عنوان فرادادهٔ سازگاری نگه دارید که بازهٔ
  پشتیبانی‌شدهٔ OpenClaw شما هنوز به آن نیاز دارد.
- [مرجع setup](/fa/plugins/manifest#setup-reference) و
  [مهاجرت SDK](/fa/plugins/sdk-migration) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### channel-env-vars

مانیفست از فرادادهٔ env-var کانالِ قدیمی یا کهنه استفاده می‌کند، بدون فرادادهٔ setup
یا config فعلی که ClawHub انتظار دارد.

- فرادادهٔ env-var کانال را اعلانی نگه دارید تا OpenClaw بتواند وضعیت setup را
  بدون بارگذاری زمان اجرای کانال بررسی کند.
- setup کانالِ مبتنی بر env را در setup فعلی، config کانال، یا
  فرادادهٔ کانال بسته که شکل Plugin شما استفاده می‌کند بازتاب دهید.
- `channelEnvVars` را فقط تا زمانی به‌عنوان فرادادهٔ سازگاری نگه دارید که نسخه‌های قدیمی‌تر
  پشتیبانی‌شدهٔ OpenClaw هنوز به آن نیاز دارند.
- [مانیفست Plugin](/fa/plugins/manifest) و
  [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مانیفست امنیت

### security-manifest-schema-unavailable

بسته، `openclaw.security.json` را با ارجاع schemaای منتشر می‌کند که ClawHub
آن را به‌عنوان در دسترس نمی‌شناسد.

- اگر URL schema فقط جنبهٔ راهنما دارد، آن را حذف کنید.
- فقط پس از اینکه OpenClaw یک schema نسخه‌دار منتشر کرد، از schema مستندشدهٔ نسخه‌دار استفاده کنید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

### unrecognized-security-manifest

بسته یک فایل مانیفست امنیت پشتیبانی‌نشده منتشر می‌کند.

- تا زمانی که OpenClaw یک schema مانیفست امنیت نسخه‌دار و رفتار ClawHub را مستند نکرده است،
  `openclaw.security.json` را حذف کنید.
- تا زمانی که قرارداد مانیفست وجود دارد، رفتار حساس به امنیت را در مستندات عمومی بسته یا
  README خود مستند نگه دارید.
- `clawhub package validate <path-to-plugin>` را دوباره اجرا کنید.

## مرتبط

- [ClawHub CLI](/fa/clawhub/cli)
- [انتشار در ClawHub](/fa/clawhub/publishing)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [مانیفست Plugin](/fa/plugins/manifest)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [سازگاری Plugin](/fa/plugins/compatibility)
