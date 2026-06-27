---
read_when:
    - پیاده‌سازی قلاب‌های زمان اجرای ارائه‌دهنده، چرخه حیات کانال، یا بسته‌های پکیج
    - اشکال‌زدایی ترتیب بارگذاری Plugin یا وضعیت رجیستری
    - افزودن یک قابلیت Plugin جدید یا Plugin موتور زمینه
summary: 'جزئیات داخلی معماری Plugin: خط لوله بارگذاری، رجیستری، قلاب‌های زمان اجرا، مسیرهای HTTP، و جدول‌های مرجع'
title: جزئیات داخلی معماری Plugin
x-i18n:
    generated_at: "2026-06-27T18:09:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

برای مدل قابلیت عمومی، شکل‌های Plugin، و قراردادهای مالکیت/اجرا،
[معماری Plugin](/fa/plugins/architecture) را ببینید. این صفحه مرجع
سازوکارهای داخلی است: خط لوله بارگذاری، رجیستری، هوک‌های زمان اجرا،
مسیرهای HTTP در Gateway، مسیرهای import، و جدول‌های schema.

## خط لوله بارگذاری

هنگام راه‌اندازی، OpenClaw تقریبا این کارها را انجام می‌دهد:

1. ریشه‌های نامزد Plugin را کشف می‌کند
2. مانیفست‌های باندل بومی یا سازگار و فراداده package را می‌خواند
3. نامزدهای ناامن را رد می‌کند
4. پیکربندی Plugin را نرمال می‌کند (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. فعال بودن هر نامزد را تعیین می‌کند
6. ماژول‌های بومی فعال‌شده را بارگذاری می‌کند: ماژول‌های باندل‌شده ساخته‌شده از بارگذار بومی استفاده می‌کنند؛
   سورس TypeScript محلی شخص ثالث از fallback اضطراری Jiti استفاده می‌کند
7. هوک‌های بومی `register(api)` را فراخوانی می‌کند و ثبت‌ها را در رجیستری Plugin جمع می‌کند
8. رجیستری را در اختیار فرمان‌ها/سطح‌های زمان اجرا می‌گذارد

<Note>
`activate` نام مستعار legacy برای `register` است — بارگذار هرکدام را که موجود باشد resolve می‌کند (`def.register ?? def.activate`) و در همان نقطه فراخوانی می‌کند. همه Pluginهای باندل‌شده از `register` استفاده می‌کنند؛ برای Pluginهای جدید `register` را ترجیح دهید.
</Note>

گیت‌های ایمنی **پیش از** اجرای زمان اجرا اتفاق می‌افتند. نامزدها زمانی مسدود می‌شوند
که entry از ریشه Plugin خارج شود، مسیر world-writable باشد، یا مالکیت مسیر
برای Pluginهای غیرباندل‌شده مشکوک به نظر برسد.

نامزدهای مسدودشده برای عیب‌یابی همچنان به شناسه Plugin خود گره می‌مانند. اگر پیکربندی
همچنان به آن شناسه ارجاع دهد، اعتبارسنجی Plugin را حاضر اما مسدود گزارش می‌کند
و به‌جای اینکه entry پیکربندی را stale بداند، به هشدار ایمنی مسیر برمی‌گرداند.

### رفتار manifest-first

مانیفست منبع حقیقت control-plane است. OpenClaw از آن برای موارد زیر استفاده می‌کند:

- شناسایی Plugin
- کشف channelها/skills/schema پیکربندی اعلام‌شده یا قابلیت‌های باندل
- اعتبارسنجی `plugins.entries.<id>.config`
- غنی‌سازی برچسب‌ها/placeholderهای Control UI
- نمایش فراداده نصب/catalog
- حفظ descriptorهای سبک activation و setup بدون بارگذاری runtime Plugin

برای Pluginهای بومی، ماژول runtime بخش data-plane است. این ماژول
رفتار واقعی مانند هوک‌ها، ابزارها، فرمان‌ها، یا جریان‌های provider را ثبت می‌کند.

بلوک‌های اختیاری مانیفست `activation` و `setup` روی control plane می‌مانند.
آن‌ها descriptorهای فقط-فراداده برای برنامه‌ریزی activation و کشف setup هستند؛
جایگزین ثبت runtime، `register(...)`، یا `setupEntry` نمی‌شوند.
اولین مصرف‌کنندگان activation زنده اکنون از hintهای command، channel، و provider در مانیفست
استفاده می‌کنند تا بارگذاری Plugin را پیش از مادی‌سازی گسترده‌تر رجیستری محدود کنند:

- بارگذاری CLI به Pluginهایی محدود می‌شود که مالک فرمان اصلی درخواست‌شده هستند
- resolution مربوط به setup/channel Plugin به Pluginهایی محدود می‌شود که مالک
  شناسه channel درخواست‌شده هستند
- resolution صریح setup/runtime provider به Pluginهایی محدود می‌شود که مالک
  شناسه provider درخواست‌شده هستند
- برنامه‌ریزی راه‌اندازی Gateway از `activation.onStartup` برای importهای صریح startup
  و opt-outهای startup استفاده می‌کند؛ Pluginهایی که فراداده startup ندارند فقط
  از طریق triggerهای محدودتر activation بارگذاری می‌شوند

preloadهای runtime در زمان درخواست که scope گسترده `all` را می‌خواهند، همچنان یک
مجموعه شناسه Plugin موثر و صریح را از پیکربندی، برنامه‌ریزی startup، channelهای
پیکربندی‌شده، slotها، و قواعد auto-enable استخراج می‌کنند. اگر آن مجموعه استخراج‌شده خالی باشد، OpenClaw
به‌جای گسترش به همه Pluginهای قابل کشف، یک رجیستری runtime خالی
بارگذاری می‌کند.

activation planner هم یک API فقط-شناسه برای callerهای موجود و هم یک
API plan برای عیب‌یابی‌های جدید ارائه می‌دهد. entryهای plan گزارش می‌دهند چرا یک Plugin انتخاب شده است،
و hintهای صریح planner در `activation.*` را از fallback مالکیت مانیفست
مانند `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`، و هوک‌ها جدا می‌کنند. این تفکیک دلیل مرز سازگاری است:
فراداده موجود Plugin همچنان کار می‌کند، در حالی که کد جدید می‌تواند hintهای گسترده
یا رفتار fallback را بدون تغییر دادن معنای بارگذاری runtime تشخیص دهد.

کشف setup اکنون شناسه‌های تحت مالکیت descriptor مانند `setup.providers` و
`setup.cliBackends` را ترجیح می‌دهد تا Pluginهای نامزد را پیش از fallback به
`setup-api` برای Pluginهایی که هنوز به هوک‌های runtime هنگام setup نیاز دارند محدود کند. فهرست‌های
setup provider از `providerAuthChoices` مانیفست، انتخاب‌های setup استخراج‌شده از descriptor،
و فراداده install-catalog بدون بارگذاری runtime provider استفاده می‌کنند. `setup.requiresRuntime: false`
صریح یک cutoff فقط-descriptor است؛ `requiresRuntime` حذف‌شده fallback legacy setup-api را
برای سازگاری نگه می‌دارد. اگر بیش از یک Plugin کشف‌شده ادعای همان provider setup یا شناسه backend
CLI نرمال‌شده را داشته باشد، lookup setup به‌جای تکیه بر ترتیب کشف،
مالک مبهم را رد می‌کند. وقتی runtime setup اجرا می‌شود، عیب‌یابی رجیستری
drift میان `setup.providers` / `setup.cliBackends` و providerها یا backendهای CLI
ثبت‌شده توسط setup-api را بدون مسدود کردن Pluginهای legacy گزارش می‌کند.

### مرز cache Plugin

OpenClaw نتایج کشف Plugin یا داده مستقیم رجیستری مانیفست را پشت پنجره‌های wall-clock
cache نمی‌کند. نصب‌ها، ویرایش‌های مانیفست، و تغییرات load-path
باید در خواندن صریح بعدی فراداده یا بازسازی snapshot بعدی قابل مشاهده شوند.
parser فایل مانیفست ممکن است یک cache محدود file-signature بر اساس
مسیر مانیفست بازشده، inode، size، و timestampها نگه دارد؛ آن cache فقط از
parsing دوباره byteهای بدون تغییر جلوگیری می‌کند و نباید پاسخ‌های discovery، registry، owner، یا
policy را cache کند.

مسیر سریع امن فراداده، مالکیت صریح object است، نه cache پنهان.
مسیرهای داغ startup در Gateway باید `PluginMetadataSnapshot` فعلی،
`PluginLookUpTable` استخراج‌شده، یا یک رجیستری مانیفست صریح را از طریق زنجیره فراخوانی
عبور دهند. اعتبارسنجی پیکربندی، auto-enable هنگام startup، bootstrap Plugin، و انتخاب
provider می‌توانند تا زمانی که این objectها نماینده پیکربندی فعلی و inventory
Plugin هستند، از آن‌ها دوباره استفاده کنند. lookup setup همچنان فراداده مانیفست را بر حسب نیاز
بازسازی می‌کند مگر اینکه مسیر setup مشخص یک رجیستری مانیفست صریح دریافت کند؛ آن را
به‌عنوان fallback مسیر سرد نگه دارید، نه اینکه cacheهای lookup پنهان اضافه کنید. وقتی ورودی
تغییر می‌کند، به‌جای mutate کردن snapshot یا نگه داشتن کپی‌های تاریخی،
snapshot را rebuild و replace کنید.
viewهای روی رجیستری فعال Plugin و helperهای bootstrap channel باندل‌شده
باید از رجیستری/ریشه فعلی دوباره محاسبه شوند. mapهای کوتاه‌عمر داخل یک فراخوانی برای dedupe کردن کار
یا guard کردن reentry اشکالی ندارند؛ آن‌ها نباید به cacheهای فراداده فرایند
تبدیل شوند.

برای بارگذاری Plugin، لایه cache پایدار همان بارگذاری runtime است. این لایه ممکن است
وقتی code یا artifactهای نصب‌شده واقعا بارگذاری می‌شوند، state بارگذار را دوباره استفاده کند، مانند:

- `PluginLoaderCacheState` و رجیستری‌های runtime فعال سازگار
- cacheهای jiti/module و cacheهای بارگذار public-surface که برای جلوگیری از import
  مکرر همان سطح runtime استفاده می‌شوند
- cacheهای filesystem برای artifactهای نصب‌شده Plugin
- mapهای کوتاه‌عمر per-call برای نرمال‌سازی مسیر یا resolve کردن duplicate

این cacheها جزئیات پیاده‌سازی data-plane هستند. آن‌ها نباید به پرسش‌های
control-plane مانند «کدام Plugin مالک این provider است؟» پاسخ دهند مگر اینکه
caller عمدا بارگذاری runtime را درخواست کرده باشد.

cacheهای پایدار یا wall-clock برای موارد زیر اضافه نکنید:

- نتایج discovery
- رجیستری‌های مستقیم مانیفست
- رجیستری‌های مانیفست بازسازی‌شده از index Plugin نصب‌شده
- lookup مالک provider، suppression مدل، policy provider، یا فراداده public-artifact
- هر پاسخ دیگر مشتق‌شده از مانیفست که در آن یک مانیفست تغییرکرده، index نصب‌شده،
  یا load path باید در خواندن بعدی فراداده قابل مشاهده باشد

callerهایی که فراداده مانیفست را از index پایدار Plugin نصب‌شده rebuild می‌کنند،
آن رجیستری را بر حسب نیاز بازسازی می‌کنند. index نصب‌شده state پایدار source-plane است؛
این یک cache فراداده پنهان درون‌فرایندی نیست.

## مدل رجیستری

Pluginهای بارگذاری‌شده مستقیما globalهای تصادفی core را mutate نمی‌کنند. آن‌ها در یک
رجیستری مرکزی Plugin ثبت می‌شوند.

رجیستری موارد زیر را دنبال می‌کند:

- رکوردهای Plugin (identity، source، origin، status، diagnostics)
- ابزارها
- هوک‌های legacy و هوک‌های typed
- channelها
- providerها
- handlerهای RPC در Gateway
- مسیرهای HTTP
- registrarهای CLI
- سرویس‌های پس‌زمینه
- فرمان‌های تحت مالکیت Plugin

سپس قابلیت‌های core به‌جای صحبت مستقیم با ماژول‌های Plugin،
از آن رجیستری می‌خوانند. این کار بارگذاری را یک‌طرفه نگه می‌دارد:

- ماژول Plugin -> ثبت در رجیستری
- runtime core -> مصرف رجیستری

این جداسازی برای نگهداشت‌پذیری مهم است. یعنی بیشتر سطح‌های core فقط به
یک نقطه integration نیاز دارند: «خواندن رجیستری»، نه «special-case کردن هر ماژول
Plugin».

## callbackهای اتصال conversation

Pluginهایی که یک conversation را bind می‌کنند می‌توانند وقتی یک approval resolve می‌شود واکنش نشان دهند.

برای دریافت callback پس از approved یا denied شدن یک درخواست bind از
`api.onConversationBindingResolved(...)` استفاده کنید:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

فیلدهای payload در callback:

- `status`: `"approved"` یا `"denied"`
- `decision`: `"allow-once"`، `"allow-always"`، یا `"deny"`
- `binding`: binding resolveشده برای درخواست‌های approved
- `request`: خلاصه درخواست اصلی، hint جداسازی، شناسه sender، و
  فراداده conversation

این callback فقط notification است. مشخص نمی‌کند چه کسی اجازه دارد یک
conversation را bind کند، و پس از پایان handling approval در core اجرا می‌شود.

## هوک‌های runtime provider

Pluginهای provider سه لایه دارند:

- **فراداده مانیفست** برای lookup ارزان پیش از runtime:
  `setup.providers[].envVars`، سازگاری deprecated `providerAuthEnvVars`،
  `providerAuthAliases`، `providerAuthChoices`، و `channelEnvVars`.
- **هوک‌های زمان پیکربندی**: `catalog` (legacy `discovery`) به‌همراه
  `applyConfigDefaults`.
- **هوک‌های runtime**: بیش از 40 هوک اختیاری که auth، resolution مدل،
  stream wrapping، سطح‌های thinking، policy replay، و endpointهای usage را پوشش می‌دهند. فهرست
  کامل را زیر [ترتیب و کاربرد هوک‌ها](#hook-order-and-usage) ببینید.

OpenClaw همچنان مالک loop عمومی agent، failover، handling transcript، و
policy ابزار است. این هوک‌ها سطح extension برای رفتارهای ویژه provider هستند
بدون اینکه به یک inference transport کاملا سفارشی نیاز باشد.

وقتی provider credentialهای مبتنی بر env دارد که مسیرهای generic auth/status/model-picker باید بدون
بارگذاری runtime Plugin ببینند، از `setup.providers[].envVars` مانیفست استفاده کنید.
`providerAuthEnvVars` deprecated همچنان توسط adapter سازگاری در طول پنجره deprecation خوانده می‌شود،
و Pluginهای غیرباندل‌شده‌ای که از آن استفاده کنند یک diagnostic مانیفست دریافت می‌کنند.
وقتی یک شناسه provider باید env varها، profileهای auth، auth پشتیبانی‌شده با config،
و گزینه onboarding کلید API یک شناسه provider دیگر را دوباره استفاده کند، از `providerAuthAliases`
مانیفست استفاده کنید. وقتی سطح‌های onboarding/auth-choice در CLI باید بدون
بارگذاری runtime provider شناسه choice، برچسب‌های group، و wiring ساده auth با یک flag
provider را بدانند، از `providerAuthChoices` مانیفست استفاده کنید. `envVars` مربوط به runtime
provider را برای hintهای روبه‌روی operator مانند برچسب‌های onboarding یا متغیرهای setup
client-id/client-secret در OAuth نگه دارید.

وقتی یک channel دارای auth یا setup مبتنی بر env است که fallback generic shell-env،
بررسی‌های config/status، یا promptهای setup باید بدون بارگذاری runtime channel ببینند،
از `channelEnvVars` مانیفست استفاده کنید.

### ترتیب و کاربرد هوک‌ها

برای Pluginهای model/provider، OpenClaw هوک‌ها را به این ترتیب تقریبی فراخوانی می‌کند.
ستون «زمان استفاده» راهنمای سریع تصمیم‌گیری است.
فیلدهای فقط-سازگاری provider که OpenClaw دیگر فراخوانی نمی‌کند، مانند
`ProviderPlugin.capabilities` و `suppressBuiltInModel`، عمدا اینجا
فهرست نشده‌اند.

| #   | قلاب                              | کارکرد                                                                                                   | زمان استفاده                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | انتشار پیکربندی ارائه‌دهنده در `models.providers` هنگام تولید `models.json`                                | ارائه‌دهنده مالک یک کاتالوگ یا پیش‌فرض‌های URL پایه است                                                                                                  |
| 2   | `applyConfigDefaults`             | اعمال پیش‌فرض‌های پیکربندی سراسری متعلق به ارائه‌دهنده هنگام مادی‌سازی پیکربندی                                      | پیش‌فرض‌ها به حالت احراز هویت، env، یا معناشناسی خانوادهٔ مدل ارائه‌دهنده وابسته‌اند                                                                         |
| --  | _(جست‌وجوی مدل داخلی)_         | OpenClaw ابتدا مسیر معمول رجیستری/کاتالوگ را امتحان می‌کند                                                          | _(قلاب Plugin نیست)_                                                                                                                         |
| 3   | `normalizeModelId`                | نرمال‌سازی نام‌های مستعار قدیمی یا پیش‌نمایش شناسهٔ مدل پیش از جست‌وجو                                                     | ارائه‌دهنده مالک پاک‌سازی نام مستعار پیش از حل مدل کانونی است                                                                                 |
| 4   | `normalizeTransport`              | نرمال‌سازی `api` / `baseUrl` خانوادهٔ ارائه‌دهنده پیش از مونتاژ عمومی مدل                                      | ارائه‌دهنده مالک پاک‌سازی ترابری برای شناسه‌های ارائه‌دهندهٔ سفارشی در همان خانوادهٔ ترابری است                                                          |
| 5   | `normalizeConfig`                 | نرمال‌سازی `models.providers.<id>` پیش از حل زمان اجرا/ارائه‌دهنده                                           | ارائه‌دهنده به پاک‌سازی پیکربندی نیاز دارد که باید با Plugin زندگی کند؛ کمک‌کننده‌های باندل‌شدهٔ خانوادهٔ Google نیز ورودی‌های پیکربندی Google پشتیبانی‌شده را پشتیبان‌گیری می‌کنند   |
| 6   | `applyNativeStreamingUsageCompat` | اعمال بازنویسی‌های سازگاری مصرف استریمینگ بومی روی ارائه‌دهندگان پیکربندی                                               | ارائه‌دهنده به اصلاحات فرادادهٔ مصرف استریمینگ بومی وابسته به نقطهٔ پایانی نیاز دارد                                                                          |
| 7   | `resolveConfigApiKey`             | حل احراز هویت نشانگر env برای ارائه‌دهندگان پیکربندی پیش از بارگذاری احراز هویت زمان اجرا                                       | ارائه‌دهندگان قلاب‌های حل کلید API نشانگر env خود را ارائه می‌کنند                                                                                |
| 8   | `resolveSyntheticAuth`            | آشکارسازی احراز هویت محلی/خودمیزبان یا مبتنی بر پیکربندی بدون پایدارسازی متن ساده                                   | ارائه‌دهنده می‌تواند با یک نشانگر اعتبارنامهٔ مصنوعی/محلی کار کند                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | پوشاندن پروفایل‌های احراز هویت خارجی متعلق به ارائه‌دهنده؛ `persistence` پیش‌فرض برای اعتبارنامه‌های متعلق به CLI/برنامه `runtime-only` است | ارائه‌دهنده بدون پایدارسازی توکن‌های refresh کپی‌شده از اعتبارنامه‌های احراز هویت خارجی استفادهٔ مجدد می‌کند؛ `contracts.externalAuthProviders` را در مانیفست اعلام کنید |
| 10  | `shouldDeferSyntheticProfileAuth` | پایین‌آوردن جای‌نگهدارهای پروفایل مصنوعی ذخیره‌شده پشت احراز هویت مبتنی بر env/پیکربندی                                      | ارائه‌دهنده پروفایل‌های جای‌نگهدار مصنوعی ذخیره می‌کند که نباید در اولویت برنده شوند                                                                 |
| 11  | `resolveDynamicModel`             | fallback همگام برای شناسه‌های مدل متعلق به ارائه‌دهنده که هنوز در رجیستری محلی نیستند                                       | ارائه‌دهنده شناسه‌های مدل بالادستی دلخواه را می‌پذیرد                                                                                                 |
| 12  | `prepareDynamicModel`             | گرم‌سازی ناهمگام، سپس `resolveDynamicModel` دوباره اجرا می‌شود                                                           | ارائه‌دهنده پیش از حل شناسه‌های ناشناخته به فرادادهٔ شبکه نیاز دارد                                                                                  |
| 13  | `normalizeResolvedModel`          | بازنویسی نهایی پیش از استفادهٔ رانر تعبیه‌شده از مدل حل‌شده                                               | ارائه‌دهنده به بازنویسی‌های ترابری نیاز دارد اما همچنان از یک ترابری هسته استفاده می‌کند                                                                             |
| 14  | `normalizeToolSchemas`            | نرمال‌سازی schemaهای ابزار پیش از دیدن آن‌ها توسط رانر تعبیه‌شده                                                    | ارائه‌دهنده به پاک‌سازی schema خانوادهٔ ترابری نیاز دارد                                                                                                |
| 15  | `inspectToolSchemas`              | آشکارسازی تشخیص‌های schema متعلق به ارائه‌دهنده پس از نرمال‌سازی                                                  | ارائه‌دهنده هشدارهای کلیدواژه‌ای می‌خواهد بدون اینکه به هسته قواعد ویژهٔ ارائه‌دهنده آموزش داده شود                                                                 |
| 16  | `resolveReasoningOutputMode`      | انتخاب قرارداد خروجی استدلال بومی در برابر برچسب‌دار                                                              | ارائه‌دهنده به خروجی استدلال/نهایی برچسب‌دار به‌جای فیلدهای بومی نیاز دارد                                                                         |
| 17  | `prepareExtraParams`              | نرمال‌سازی پارامتر درخواست پیش از wrapperهای عمومی گزینهٔ استریم                                              | ارائه‌دهنده به پارامترهای درخواست پیش‌فرض یا پاک‌سازی پارامتر به‌ازای هر ارائه‌دهنده نیاز دارد                                                                           |
| 18  | `createStreamFn`                  | جایگزینی کامل مسیر معمول استریم با یک ترابری سفارشی                                                   | ارائه‌دهنده به پروتکل سیمی سفارشی نیاز دارد، نه فقط یک wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | wrapper استریم پس از اعمال wrapperهای عمومی                                                              | ارائه‌دهنده به wrapperهای سازگاری header/body/model درخواست بدون ترابری سفارشی نیاز دارد                                                          |
| 21  | `resolveTransportTurnState`       | اتصال headerها یا فرادادهٔ ترابری بومی به‌ازای هر نوبت                                                           | ارائه‌دهنده می‌خواهد ترابری‌های عمومی هویت نوبت بومی ارائه‌دهنده را ارسال کنند                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | اتصال headerهای بومی WebSocket یا سیاست دورهٔ انتظار نشست                                                    | ارائه‌دهنده می‌خواهد ترابری‌های عمومی WS، headerهای نشست یا سیاست fallback را تنظیم کنند                                                               |
| 23  | `formatApiKey`                    | قالب‌ساز پروفایل احراز هویت: پروفایل ذخیره‌شده به رشتهٔ `apiKey` زمان اجرا تبدیل می‌شود                                     | ارائه‌دهنده فرادادهٔ احراز هویت اضافی ذخیره می‌کند و به شکل توکن زمان اجرای سفارشی نیاز دارد                                                                    |
| 24  | `refreshOAuth`                    | بازنویسی refresh OAuth برای نقطه‌های پایانی refresh سفارشی یا سیاست شکست refresh                                  | ارائه‌دهنده با refreshکننده‌های مشترک OpenClaw سازگار نیست                                                                                          |
| 25  | `buildAuthDoctorHint`             | راهنمای تعمیر پیوست‌شده هنگام شکست refresh OAuth                                                                  | ارائه‌دهنده پس از شکست refresh به راهنمای تعمیر احراز هویت متعلق به ارائه‌دهنده نیاز دارد                                                                      |
| 26  | `matchesContextOverflowError`     | تطبیق‌دهندهٔ سرریز پنجرهٔ context متعلق به ارائه‌دهنده                                                                 | ارائه‌دهنده خطاهای خام سرریز دارد که ابتکارهای عمومی از دست می‌دهند                                                                                |
| 27  | `classifyFailoverReason`          | طبقه‌بندی دلیل failover متعلق به ارائه‌دهنده                                                                  | ارائه‌دهنده می‌تواند خطاهای خام API/ترابری را به محدودیت نرخ/بار بیش از حد/و غیره نگاشت کند                                                                          |
| 28  | `isCacheTtlEligible`              | سیاست prompt-cache برای ارائه‌دهندگان proxy/backhaul                                                               | ارائه‌دهنده به دروازه‌گذاری TTL cache ویژهٔ proxy نیاز دارد                                                                                                |
| 29  | `buildMissingAuthMessage`         | جایگزین پیام عمومی بازیابی احراز هویت گمشده                                                      | ارائه‌دهنده به راهنمای بازیابی احراز هویت گمشدهٔ ویژهٔ ارائه‌دهنده نیاز دارد                                                                                 |
| 30  | `augmentModelCatalog`             | ردیف‌های کاتالوگ مصنوعی/نهایی که پس از کشف افزوده می‌شوند                                                          | ارائه‌دهنده به ردیف‌های مصنوعی سازگاری روبه‌جلو در `models list` و انتخاب‌گرها نیاز دارد                                                                     |
| 31  | `resolveThinkingProfile`          | مجموعهٔ سطح `/think` ویژهٔ مدل، برچسب‌های نمایشی، و پیش‌فرض                                                 | ارائه‌دهنده نردبان تفکر سفارشی یا برچسب دودویی برای مدل‌های منتخب ارائه می‌کند                                                                 |
| 32  | `isBinaryThinking`                | قلاب سازگاری toggle روشن/خاموش استدلال                                                                     | ارائه‌دهنده فقط تفکر دودویی روشن/خاموش ارائه می‌کند                                                                                                  |
| 33  | `supportsXHighThinking`           | قلاب سازگاری پشتیبانی استدلال `xhigh`                                                                   | ارائه‌دهنده `xhigh` را فقط روی زیرمجموعه‌ای از مدل‌ها می‌خواهد                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | قلاب سازگاری سطح پیش‌فرض `/think`                                                                      | ارائه‌دهنده مالک سیاست پیش‌فرض `/think` برای یک خانوادهٔ مدل است                                                                                      |
| 35  | `isModernModelRef`                | تطبیق‌دهندهٔ مدل مدرن برای فیلترهای پروفایل زنده و انتخاب آزمون دود                                              | ارائه‌دهنده مالک تطبیق مدل ترجیحی زنده/آزمون دود است                                                                                             |
| 36  | `prepareRuntimeAuth`              | تبدیل یک اعتبارنامهٔ پیکربندی‌شده به توکن/کلید واقعی زمان اجرا درست پیش از استنتاج                       | ارائه‌دهنده به تبادل توکن یا اعتبارنامهٔ درخواست کوتاه‌عمر نیاز دارد                                                                             |
| 37  | `resolveUsageAuth`                | حل اعتبارنامه‌های مصرف/صورت‌حساب برای `/usage` و سطوح وضعیت مرتبط                                     | ارائه‌دهنده به parsing سفارشی توکن مصرف/سهمیه یا اعتبارنامهٔ مصرف متفاوت نیاز دارد                                                               |
| 38  | `fetchUsageSnapshot`              | گرفتن و نرمال‌سازی نماهای لحظه‌ای مصرف/سهمیه ویژه ارائه‌دهنده پس از نهایی‌شدن احراز هویت                             | ارائه‌دهنده به یک نقطه پایانی مصرف ویژه ارائه‌دهنده یا تجزیه‌گر payload نیاز دارد                                                                           |
| 39  | `createEmbeddingProvider`         | ساخت یک adapter تعبیه‌سازی متعلق به ارائه‌دهنده برای حافظه/جست‌وجو                                                     | رفتار تعبیه‌سازی حافظه به Plugin ارائه‌دهنده تعلق دارد                                                                                    |
| 40  | `buildReplayPolicy`               | بازگرداندن سیاست replay که مدیریت رونوشت را برای ارائه‌دهنده کنترل می‌کند                                        | ارائه‌دهنده به سیاست سفارشی رونوشت نیاز دارد (برای مثال، حذف بلوک‌های تفکر)                                                               |
| 41  | `sanitizeReplayHistory`           | بازنویسی تاریخچه replay پس از پاک‌سازی عمومی رونوشت                                                        | ارائه‌دهنده به بازنویسی‌های replay ویژه ارائه‌دهنده فراتر از helperهای مشترک Compaction نیاز دارد                                                             |
| 42  | `validateReplayTurns`             | اعتبارسنجی یا تغییر شکل نهایی replay-turn پیش از runner تعبیه‌شده                                           | انتقال ارائه‌دهنده پس از پاک‌سازی عمومی به اعتبارسنجی سخت‌گیرانه‌تر نوبت نیاز دارد                                                                    |
| 43  | `onModelSelected`                 | اجرای عوارض جانبی پس از انتخاب که متعلق به ارائه‌دهنده است                                                                 | وقتی یک مدل فعال می‌شود، ارائه‌دهنده به telemetry یا وضعیت متعلق به ارائه‌دهنده نیاز دارد                                                                  |

`normalizeModelId`، `normalizeTransport`، و `normalizeConfig` ابتدا پلاگین ارائه‌دهنده‌ی
مطابق را بررسی می‌کنند، سپس به سایر پلاگین‌های ارائه‌دهنده‌ای که قابلیت هوک دارند
ادامه می‌دهند تا یکی واقعاً شناسه‌ی مدل یا ترنسپورت/پیکربندی را تغییر دهد. این کار
shimهای alias/compat ارائه‌دهنده را بدون نیاز به اینکه فراخواننده بداند کدام
پلاگین باندل‌شده مالک بازنویسی است، فعال نگه می‌دارد. اگر هیچ هوک ارائه‌دهنده‌ای
یک ورودی پیکربندی پشتیبانی‌شده از خانواده‌ی Google را بازنویسی نکند، نرمال‌ساز
پیکربندی Google باندل‌شده همچنان آن پاک‌سازی سازگاری را اعمال می‌کند.

اگر ارائه‌دهنده به یک پروتکل ارتباطی کاملاً سفارشی یا اجراکننده‌ی درخواست سفارشی
نیاز داشته باشد، آن یک دسته‌ی متفاوت از افزونه است. این هوک‌ها برای رفتار
ارائه‌دهنده‌ای هستند که همچنان روی حلقه‌ی استنتاج عادی OpenClaw اجرا می‌شود.

`resolveUsageAuth` تصمیم می‌گیرد که OpenClaw باید `fetchUsageSnapshot` را فراخوانی کند یا
برای سطوح usage/status به حل اعتبارنامه‌ی عمومی برگردد. وقتی ارائه‌دهنده اعتبارنامه‌ی usage دارد
`{ token, accountId? }` را برگردانید، وقتی احراز هویت usage متعلق به ارائه‌دهنده درخواست را
مدیریت کرده و باید بازگشت جایگزین عمومی API-key/OAuth را سرکوب کند
`{ handled: true }` را برگردانید، و وقتی ارائه‌دهنده احراز هویت usage را مدیریت نکرده است
`null` یا `undefined` را برگردانید.

### نمونه‌ی ارائه‌دهنده

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### نمونه‌های داخلی

پلاگین‌های ارائه‌دهنده‌ی باندل‌شده هوک‌های بالا را با هم ترکیب می‌کنند تا با نیازهای
کاتالوگ، احراز هویت، thinking، replay، و usage هر فروشنده هماهنگ شوند. مجموعه‌ی
معتبر هوک‌ها همراه هر پلاگین زیر `extensions/` قرار دارد؛ این صفحه شکل‌ها را
نمایش می‌دهد، نه اینکه فهرست را آینه کند.

<AccordionGroup>
  <Accordion title="ارائه‌دهنده‌های کاتالوگ عبوری">
    OpenRouter، Kilocode، Z.AI، xAI، `catalog` را به‌همراه
    `resolveDynamicModel` / `prepareDynamicModel` ثبت می‌کنند تا بتوانند شناسه‌های مدل بالادستی
    را پیش از کاتالوگ ایستای OpenClaw نمایش دهند.
  </Accordion>
  <Accordion title="ارائه‌دهنده‌های OAuth و نقطه‌پایانی usage">
    GitHub Copilot، Gemini CLI، ChatGPT Codex، MiniMax، Xiaomi، z.ai،
    `prepareRuntimeAuth` یا `formatApiKey` را با `resolveUsageAuth` +
    `fetchUsageSnapshot` جفت می‌کنند تا تبادل توکن و یکپارچه‌سازی `/usage` را در اختیار داشته باشند.
  </Accordion>
  <Accordion title="خانواده‌های پاک‌سازی replay و رونوشت">
    خانواده‌های نام‌دار مشترک (`google-gemini`، `passthrough-gemini`،
    `anthropic-by-model`، `hybrid-anthropic-openai`) به ارائه‌دهنده‌ها اجازه می‌دهند
    به‌جای اینکه هر پلاگین پاک‌سازی را دوباره پیاده‌سازی کند، از طریق
    `buildReplayPolicy` وارد سیاست رونوشت شوند.
  </Accordion>
  <Accordion title="ارائه‌دهنده‌های فقط کاتالوگ">
    `byteplus`، `cloudflare-ai-gateway`، `huggingface`، `kimi-coding`، `nvidia`،
    `qianfan`، `synthetic`، `together`، `venice`، `vercel-ai-gateway`، و
    `volcengine` فقط `catalog` را ثبت می‌کنند و از حلقه‌ی استنتاج مشترک استفاده می‌کنند.
  </Accordion>
  <Accordion title="کمک‌کننده‌های جریان مخصوص Anthropic">
    سرآیندهای بتا، `/fast` / `serviceTier`، و `context1m` داخل درز عمومی
    `api.ts` / `contract-api.ts` پلاگین Anthropic قرار دارند
    (`wrapAnthropicProviderStream`، `resolveAnthropicBetas`،
    `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`) و نه در
    SDK عمومی.
  </Accordion>
</AccordionGroup>

## کمک‌کننده‌های زمان اجرا

پلاگین‌ها می‌توانند از طریق `api.runtime` به کمک‌کننده‌های انتخاب‌شده‌ی هسته دسترسی داشته باشند. برای TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

یادداشت‌ها:

- `textToSpeech` بار خروجی TTS عادی هسته را برای سطوح فایل/یادداشت صوتی برمی‌گرداند.
- از پیکربندی `messages.tts` هسته و انتخاب ارائه‌دهنده استفاده می‌کند.
- بافر صوتی PCM + نرخ نمونه‌برداری را برمی‌گرداند. پلاگین‌ها باید برای ارائه‌دهنده‌ها resample/encode کنند.
- `listVoices` برای هر ارائه‌دهنده اختیاری است. از آن برای انتخاب‌گرهای صدای متعلق به فروشنده یا جریان‌های راه‌اندازی استفاده کنید.
- فهرست‌های صدا می‌توانند فراداده‌ی غنی‌تری مانند locale، gender، و برچسب‌های personality برای انتخاب‌گرهای آگاه از ارائه‌دهنده داشته باشند.
- OpenAI و ElevenLabs امروز از تلفنی پشتیبانی می‌کنند. Microsoft پشتیبانی نمی‌کند.

پلاگین‌ها همچنین می‌توانند ارائه‌دهنده‌های گفتار را از طریق `api.registerSpeechProvider(...)` ثبت کنند.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

یادداشت‌ها:

- سیاست TTS، بازگشت جایگزین، و تحویل پاسخ را در هسته نگه دارید.
- از ارائه‌دهنده‌های گفتار برای رفتار سنتز متعلق به فروشنده استفاده کنید.
- ورودی قدیمی `edge` متعلق به Microsoft به شناسه‌ی ارائه‌دهنده‌ی `microsoft` نرمال می‌شود.
- مدل مالکیت ترجیحی شرکت‌محور است: یک پلاگین فروشنده می‌تواند
  ارائه‌دهنده‌های متن، گفتار، تصویر، و رسانه‌های آینده را، هم‌زمان با اضافه شدن
  قراردادهای قابلیت توسط OpenClaw، مالک شود.

برای درک تصویر/صوت/ویدئو، پلاگین‌ها به‌جای یک کیسه‌ی عمومی key/value، یک
ارائه‌دهنده‌ی media-understanding تایپ‌شده ثبت می‌کنند:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

یادداشت‌ها:

- ارکستراسیون، بازگشت جایگزین، پیکربندی، و سیم‌کشی کانال را در هسته نگه دارید.
- رفتار فروشنده را در پلاگین ارائه‌دهنده نگه دارید.
- گسترش افزایشی باید تایپ‌شده بماند: متدهای اختیاری جدید، فیلدهای نتیجه‌ی اختیاری جدید،
  قابلیت‌های اختیاری جدید.
- تولید ویدئو از قبل از همین الگو پیروی می‌کند:
  - هسته مالک قرارداد قابلیت و کمک‌کننده‌ی زمان اجرا است
  - پلاگین‌های فروشنده `api.registerVideoGenerationProvider(...)` را ثبت می‌کنند
  - پلاگین‌های ویژگی/کانال `api.runtime.videoGeneration.*` را مصرف می‌کنند

برای کمک‌کننده‌های زمان اجرای media-understanding، پلاگین‌ها می‌توانند فراخوانی کنند:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

برای رونویسی صوت، پلاگین‌ها می‌توانند از زمان اجرای media-understanding
یا alias قدیمی‌تر STT استفاده کنند:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

یادداشت‌ها:

- `api.runtime.mediaUnderstanding.*` سطح مشترک ترجیحی برای
  درک تصویر/صوت/ویدئو است.
- `extractStructuredWithModel(...)` درز روبه‌پلاگین برای استخراج محدود
  متعلق به ارائه‌دهنده و تصویرمحور است. حداقل یک ورودی تصویر قرار دهید؛
  ورودی‌های متنی زمینه‌ی تکمیلی هستند.
  پلاگین‌های محصول مالک مسیرها و schemaهای خود هستند، در حالی که OpenClaw مالک
  مرز ارائه‌دهنده/زمان اجرا است.
- از پیکربندی صوتی media-understanding هسته (`tools.media.audio`) و ترتیب بازگشت جایگزین ارائه‌دهنده استفاده می‌کند.
- وقتی خروجی رونویسی تولید نشود، `{ text: undefined }` را برمی‌گرداند (برای مثال ورودی ردشده/پشتیبانی‌نشده).
- `api.runtime.stt.transcribeAudioFile(...)` به‌عنوان alias سازگاری باقی می‌ماند.

پلاگین‌ها همچنین می‌توانند اجراهای subagent پس‌زمینه را از طریق `api.runtime.subagent` راه‌اندازی کنند:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

یادداشت‌ها:

- `provider` و `model` overrideهای اختیاری برای هر اجرا هستند، نه تغییرات پایدار نشست.
- OpenClaw آن فیلدهای override را فقط برای فراخواننده‌های مورد اعتماد رعایت می‌کند.
- برای اجراهای بازگشت جایگزین متعلق به پلاگین، اپراتورها باید با `plugins.entries.<id>.subagent.allowModelOverride: true` فعال کنند.
- از `plugins.entries.<id>.subagent.allowedModels` برای محدود کردن پلاگین‌های مورد اعتماد به هدف‌های canonical مشخص `provider/model`، یا `"*"` برای اجازه‌ی صریح به هر هدف استفاده کنید.
- اجراهای subagent پلاگین‌های نامطمئن همچنان کار می‌کنند، اما درخواست‌های override به‌جای بازگشت جایگزین بی‌صدا، رد می‌شوند.
- نشست‌های subagent ساخته‌شده توسط پلاگین با شناسه‌ی پلاگین سازنده برچسب‌گذاری می‌شوند. بازگشت جایگزین `api.runtime.subagent.deleteSession(...)` فقط می‌تواند همان نشست‌های تحت مالکیت را حذف کند؛ حذف دلخواه نشست همچنان به درخواست Gateway با محدوده‌ی admin نیاز دارد.

برای جست‌وجوی وب، پلاگین‌ها می‌توانند به‌جای ورود به سیم‌کشی ابزار عامل، کمک‌کننده‌ی زمان اجرای مشترک را مصرف کنند:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

پلاگین‌ها همچنین می‌توانند ارائه‌دهنده‌های جست‌وجوی وب را از طریق
`api.registerWebSearchProvider(...)` ثبت کنند.

یادداشت‌ها:

- انتخاب ارائه‌دهنده، حل اعتبارنامه، و معناشناسی درخواست مشترک را در هسته نگه دارید.
- از ارائه‌دهنده‌های جست‌وجوی وب برای ترنسپورت‌های جست‌وجوی مخصوص فروشنده استفاده کنید.
- `api.runtime.webSearch.*` سطح مشترک ترجیحی برای پلاگین‌های ویژگی/کانالی است که بدون وابستگی به wrapper ابزار عامل به رفتار جست‌وجو نیاز دارند.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: یک تصویر را با استفاده از زنجیره‌ی پیکربندی‌شده‌ی ارائه‌دهنده‌ی تولید تصویر تولید می‌کند.
- `listProviders(...)`: ارائه‌دهنده‌های تولید تصویر موجود و قابلیت‌هایشان را فهرست می‌کند.

## مسیرهای HTTP Gateway

پلاگین‌ها می‌توانند با `api.registerHttpRoute(...)` نقطه‌پایانی‌های HTTP را در معرض دسترس قرار دهند.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

فیلدهای مسیر:

- `path`: مسیر route زیر سرور HTTP ‏Gateway.
- `auth`: الزامی. از `"gateway"` برای الزام احراز هویت عادی Gateway، یا از `"plugin"` برای احراز هویت/تأیید Webhook مدیریت‌شده توسط Plugin استفاده کنید.
- `match`: اختیاری. `"exact"` (پیش‌فرض) یا `"prefix"`.
- `replaceExisting`: اختیاری. به همان Plugin اجازه می‌دهد ثبت route موجود خودش را جایگزین کند.
- `handler`: وقتی route درخواست را مدیریت کرد، `true` برگردانید.

نکته‌ها:

- `api.registerHttpHandler(...)` حذف شده است و باعث خطای بارگذاری Plugin می‌شود. به‌جای آن از `api.registerHttpRoute(...)` استفاده کنید.
- routeهای Plugin باید `auth` را صریح اعلام کنند.
- تداخل‌های دقیق `path + match` رد می‌شوند مگر اینکه `replaceExisting: true` باشد، و یک Plugin نمی‌تواند route متعلق به Plugin دیگر را جایگزین کند.
- routeهای هم‌پوشان با سطح‌های متفاوت `auth` رد می‌شوند. زنجیره‌های fallthrough مربوط به `exact`/`prefix` را فقط روی همان سطح احراز هویت نگه دارید.
- routeهای `auth: "plugin"` به‌صورت خودکار scopeهای runtime اپراتور را دریافت نمی‌کنند. آن‌ها برای Webhookها/تأیید امضای مدیریت‌شده توسط Plugin هستند، نه فراخوانی‌های کمکی ممتاز Gateway.
- routeهای `auth: "gateway"` داخل scope runtime درخواست Gateway اجرا می‌شوند، اما این scope عمداً محافظه‌کارانه است:
  - احراز هویت bearer با shared-secret (`gateway.auth.mode = "token"` / `"password"`) scopeهای runtime routeهای Plugin را روی `operator.write` ثابت نگه می‌دارد، حتی اگر فراخواننده `x-openclaw-scopes` بفرستد
  - حالت‌های HTTP دارای هویت معتمد (برای مثال `trusted-proxy` یا `gateway.auth.mode = "none"` روی یک ingress خصوصی) فقط وقتی header به‌صورت صریح حاضر باشد به `x-openclaw-scopes` احترام می‌گذارند
  - اگر `x-openclaw-scopes` در این درخواست‌های route Plugin دارای هویت وجود نداشته باشد، scope runtime به `operator.write` برمی‌گردد
- قاعده عملی: فرض نکنید route یک Plugin با احراز هویت Gateway به‌طور ضمنی یک سطح ادمین است. اگر route شما به رفتار فقط-ادمین نیاز دارد، یک حالت احراز هویت دارای هویت را الزامی کنید و قرارداد صریح header ‏`x-openclaw-scopes` را مستند کنید.

## مسیرهای import در SDK ‏Plugin

هنگام نوشتن Pluginهای جدید، به‌جای barrel ریشه یکپارچه `openclaw/plugin-sdk` از زیرمسیرهای محدود SDK استفاده کنید. زیرمسیرهای اصلی:

| زیرمسیر                             | هدف                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitiveهای ثبت Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | helperهای entry/build کانال                        |
| `openclaw/plugin-sdk/core`          | helperهای مشترک عمومی و قرارداد چتری       |
| `openclaw/plugin-sdk/config-schema` | schema زاد ریشه `openclaw.json` (`OpenClawSchema`) |

Pluginهای کانال از خانواده‌ای از seamهای محدود انتخاب می‌کنند — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`، و `channel-actions`. رفتار تأیید باید روی یک قرارداد `approvalCapability` متمرکز شود، نه اینکه بین fieldهای نامرتبط Plugin ترکیب شود. [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.

helperهای runtime و config زیر زیرمسیرهای متمرکز و متناظر `*-runtime` قرار دارند
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`، و غیره). به‌جای barrel سازگاری گسترده `config-runtime`، `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`، و `config-mutation` را ترجیح دهید.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
facadeهای کوچک helper کانال، `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
و `openclaw/plugin-sdk/infra-runtime` shimهای سازگاری منسوخ برای
Pluginهای قدیمی‌تر هستند. کد جدید باید به‌جای آن primitiveهای عمومی محدودتر را import کند.
</Info>

نقطه‌های ورود داخلی repo (به‌ازای ریشه package هر Plugin باندل‌شده):

- `index.js` — entry ‏Plugin باندل‌شده
- `api.js` — barrel helperها/typeها
- `runtime-api.js` — barrel فقط-runtime
- `setup-entry.js` — entry ‏Plugin راه‌اندازی

Pluginهای خارجی فقط باید زیرمسیرهای `openclaw/plugin-sdk/*` را import کنند. هرگز
`src/*` package یک Plugin دیگر را از core یا از Plugin دیگر import نکنید.
نقطه‌های ورود بارگذاری‌شده با facade وقتی snapshot فعال config runtime وجود داشته باشد آن را ترجیح می‌دهند، سپس به فایل config resolve‌شده روی دیسک برمی‌گردند.

زیرمسیرهای مختص capability مانند `image-generation`, `media-understanding`,
و `speech` وجود دارند چون Pluginهای باندل‌شده امروز از آن‌ها استفاده می‌کنند. آن‌ها
به‌صورت خودکار قراردادهای خارجی منجمد بلندمدت نیستند — هنگام اتکا به آن‌ها، صفحه مرجع SDK مرتبط را بررسی کنید.

## schemaهای ابزار پیام

Pluginها باید contributionهای schema مخصوص کانال `describeMessageTool(...)` را
برای primitiveهای غیرپیامی مانند reactionها، readها، و pollها مالک شوند.
presentation مشترک ارسال باید به‌جای fieldهای native ارائه‌دهنده مانند دکمه، component، block، یا card، از قرارداد عمومی `MessagePresentation` استفاده کند.
برای قرارداد، قواعد fallback، نگاشت ارائه‌دهنده، و checklist نویسنده Plugin،
[Message Presentation](/fa/plugins/message-presentation) را ببینید.

Pluginهای دارای توان ارسال اعلام می‌کنند چه چیزهایی را می‌توانند از طریق capabilityهای پیام render کنند:

- `presentation` برای blockهای presentation معنایی (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` برای درخواست‌های pinned-delivery

core تصمیم می‌گیرد presentation را به‌صورت native render کند یا آن را به متن degrade کند.
escape hatchهای UI native ارائه‌دهنده را از ابزار پیام عمومی expose نکنید.
helperهای SDK منسوخ برای schemaهای native قدیمی همچنان برای Pluginهای شخص ثالث موجود export می‌شوند، اما Pluginهای جدید نباید از آن‌ها استفاده کنند.

## resolve کردن target کانال

Pluginهای کانال باید مالک semanticsهای target مخصوص کانال باشند. host مشترک
outbound را عمومی نگه دارید و از سطح messaging adapter برای قواعد ارائه‌دهنده استفاده کنید:

- `messaging.inferTargetChatType({ to })` تصمیم می‌گیرد آیا یک target نرمال‌سازی‌شده
  باید پیش از جست‌وجوی directory به‌عنوان `direct`, `group`, یا `channel` در نظر گرفته شود.
- `messaging.targetResolver.looksLikeId(raw, normalized)` به core می‌گوید آیا یک
  input باید به‌جای جست‌وجوی directory مستقیماً به resolution شبیه id برود.
- `messaging.targetResolver.reservedLiterals` واژه‌های ساده‌ای را فهرست می‌کند که
  برای آن ارائه‌دهنده ارجاع‌های کانال/session هستند. resolution قبل از رد کردن literalهای رزروشده، entryهای directory پیکربندی‌شده را حفظ می‌کند، سپس در صورت miss در directory به‌صورت fail-closed شکست می‌خورد.
- `messaging.targetResolver.resolveTarget(...)` fallback ‏Plugin است وقتی
  core پس از نرمال‌سازی یا پس از miss در directory به resolution نهایی متعلق به ارائه‌دهنده نیاز دارد.
- `messaging.resolveOutboundSessionRoute(...)` پس از resolve شدن target، ساخت route مخصوص session ارائه‌دهنده را مالک می‌شود.

تقسیم پیشنهادی:

- از `inferTargetChatType` برای تصمیم‌های دسته‌بندی استفاده کنید که باید پیش از
  جست‌وجوی peerها/groupها رخ دهند.
- از `looksLikeId` برای بررسی‌های «این را به‌عنوان id صریح/native target در نظر بگیر» استفاده کنید.
- از `resolveTarget` برای fallback نرمال‌سازی مخصوص ارائه‌دهنده استفاده کنید، نه برای
  جست‌وجوی گسترده directory.
- idهای native ارائه‌دهنده مانند chat idها، thread idها، JIDها، handleها، و room
  idها را داخل مقدارهای `target` یا پارامترهای مخصوص ارائه‌دهنده نگه دارید، نه در fieldهای عمومی SDK.

## directoryهای مبتنی بر config

Pluginهایی که entryهای directory را از config استخراج می‌کنند باید آن منطق را در
Plugin نگه دارند و از helperهای مشترک
`openclaw/plugin-sdk/directory-runtime` دوباره استفاده کنند.

وقتی یک کانال به peerها/groupهای مبتنی بر config نیاز دارد، مانند موارد زیر، از این استفاده کنید:

- peerهای DM مبتنی بر allowlist
- mapهای پیکربندی‌شده کانال/group
- fallbackهای directory ایستا با scope حساب

helperهای مشترک در `directory-runtime` فقط عملیات عمومی را مدیریت می‌کنند:

- فیلتر کردن query
- اعمال limit
- helperهای deduping/normalization
- ساخت `ChannelDirectoryEntry[]`

بازرسی حساب و نرمال‌سازی id مخصوص کانال باید در پیاده‌سازی
Plugin باقی بماند.

## catalogهای ارائه‌دهنده

Pluginهای ارائه‌دهنده می‌توانند با
`registerProvider({ catalog: { run(...) { ... } } })`، catalogهای مدل را برای inference تعریف کنند.

`catalog.run(...)` همان شکلی را برمی‌گرداند که OpenClaw در
`models.providers` می‌نویسد:

- `{ provider }` برای یک entry ارائه‌دهنده
- `{ providers }` برای چند entry ارائه‌دهنده

وقتی Plugin مالک idهای مدل مخصوص ارائه‌دهنده، پیش‌فرض‌های base URL،
یا metadata مدل وابسته به auth است، از `catalog` استفاده کنید.

`catalog.order` کنترل می‌کند catalog یک Plugin چه زمانی نسبت به ارائه‌دهنده‌های ضمنی built-in ‏OpenClaw merge شود:

- `simple`: ارائه‌دهنده‌های ساده مبتنی بر API key یا env
- `profile`: ارائه‌دهنده‌هایی که وقتی profileهای auth وجود دارند ظاهر می‌شوند
- `paired`: ارائه‌دهنده‌هایی که چند entry ارائه‌دهنده مرتبط را synthesize می‌کنند
- `late`: آخرین pass، پس از دیگر ارائه‌دهنده‌های ضمنی

در collision کلید، ارائه‌دهنده‌های بعدی برنده می‌شوند، بنابراین Pluginها می‌توانند عمداً یک
entry ارائه‌دهنده built-in با همان provider id را override کنند.

Pluginها همچنین می‌توانند rowهای مدل read-only را از طریق
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` منتشر کنند. این مسیر رو به جلو برای سطح‌های list/help/picker است و از rowهای
`text`, `image_generation`, `video_generation`، و `music_generation` پشتیبانی می‌کند.
Pluginهای ارائه‌دهنده همچنان مالک فراخوانی‌های endpoint زنده، token exchange، و نگاشت پاسخ vendor هستند؛ core مالک شکل row مشترک، labelهای source، و قالب‌بندی help ابزار media است. ثبت‌های ارائه‌دهنده media-generation به‌صورت خودکار از `defaultModel`, `models`، و `capabilities` rowهای catalog ایستا synthesize می‌کنند.

سازگاری:

- `discovery` همچنان به‌عنوان alias قدیمی کار می‌کند، اما هشدار deprecation emit می‌کند
- اگر هم `catalog` و هم `discovery` ثبت شده باشند، OpenClaw از `catalog` استفاده می‌کند
- `augmentModelCatalog` منسوخ است؛ ارائه‌دهنده‌های باندل‌شده باید rowهای مکمل را از طریق `registerModelCatalogProvider` منتشر کنند

## بازرسی read-only کانال

اگر Plugin شما یک کانال ثبت می‌کند، ترجیحاً
`plugin.config.inspectAccount(cfg, accountId)` را در کنار `resolveAccount(...)` پیاده‌سازی کنید.

چرا:

- `resolveAccount(...)` مسیر runtime است. مجاز است فرض کند credentialها
  کاملاً materialize شده‌اند و وقتی secretهای لازم missing هستند سریع fail کند.
- مسیرهای دستور read-only مانند `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`، و جریان‌های repair مربوط به doctor/config
  نباید فقط برای توصیف configuration نیاز داشته باشند credentialهای runtime را materialize کنند.

رفتار پیشنهادی `inspectAccount(...)`:

- فقط state توصیفی حساب را برگردانید.
- `enabled` و `configured` را حفظ کنید.
- وقتی مرتبط است، fieldهای source/status مربوط به credential را شامل کنید، مانند:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- لازم نیست فقط برای گزارش availability در حالت read-only، مقدارهای خام token را برگردانید. برگرداندن `tokenStatus: "available"` (و field source متناظر)
  برای دستورهای سبک status کافی است.
- وقتی credential از طریق SecretRef پیکربندی شده اما در مسیر دستور فعلی
  unavailable است، از `configured_unavailable` استفاده کنید.

این باعث می‌شود دستورهای read-only به‌جای crash کردن یا گزارش نادرست حساب به‌عنوان پیکربندی‌نشده، «پیکربندی‌شده اما در این مسیر دستور unavailable» را گزارش کنند.

## packهای package

یک directory ‏Plugin می‌تواند یک `package.json` با `openclaw.extensions` داشته باشد:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

هر entry به یک Plugin تبدیل می‌شود. اگر pack چند extension فهرست کند، id ‏Plugin
به `name/<fileBase>` تبدیل می‌شود.

اگر Plugin شما dependencyهای npm را import می‌کند، آن‌ها را در همان directory نصب کنید تا
`node_modules` در دسترس باشد (`npm install` / `pnpm install`).

guardrail امنیتی: هر entry در `openclaw.extensions` باید پس از resolve شدن symlink داخل directory ‏Plugin باقی بماند. entryهایی که از directory package خارج شوند رد می‌شوند.

نکته امنیتی: `openclaw plugins install` وابستگی‌های Plugin را با یک
`npm install --omit=dev --ignore-scripts` محلیِ پروژه نصب می‌کند (بدون اسکریپت‌های چرخه عمر،
بدون وابستگی‌های توسعه در زمان اجرا)، و تنظیمات سراسری موروثی نصب npm را نادیده می‌گیرد.
درخت‌های وابستگی Plugin را «JS/TS خالص» نگه دارید و از بسته‌هایی که به ساخت‌های
`postinstall` نیاز دارند پرهیز کنید.

اختیاری: `openclaw.setupEntry` می‌تواند به یک ماژول سبک مخصوص راه‌اندازی اشاره کند.
وقتی OpenClaw برای یک Plugin کانال غیرفعال به سطح‌های راه‌اندازی نیاز دارد، یا
وقتی یک Plugin کانال فعال است اما هنوز پیکربندی نشده، به‌جای ورودی کامل Plugin، `setupEntry`
را بارگذاری می‌کند. این کار شروع و راه‌اندازی را سبک‌تر نگه می‌دارد
وقتی ورودی اصلی Plugin شما ابزارها، هوک‌ها، یا کدهای دیگرِ فقط زمان اجرا را هم
سیم‌کشی می‌کند.

اختیاری: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
می‌تواند یک Plugin کانال را در مرحله شروع پیش از گوش‌دادنِ Gateway وارد همان مسیر
`setupEntry` کند، حتی وقتی کانال از قبل پیکربندی شده باشد.

فقط زمانی از این استفاده کنید که `setupEntry` سطح شروعی را که باید پیش از
شروع گوش‌دادن Gateway وجود داشته باشد، کامل پوشش دهد. در عمل، یعنی ورودی راه‌اندازی
باید هر قابلیت متعلق به کانال را که شروع به آن وابسته است ثبت کند، مانند:

- خود ثبت کانال
- هر مسیر HTTP که باید پیش از شروع گوش‌دادن Gateway در دسترس باشد
- هر روش، ابزار، یا سرویس Gateway که باید در همان بازه وجود داشته باشد

اگر ورودی کامل شما هنوز مالک هر قابلیت ضروریِ شروع است، این پرچم را فعال نکنید.
Plugin را روی رفتار پیش‌فرض نگه دارید و بگذارید OpenClaw ورودی کامل را
در زمان شروع بارگذاری کند.

کانال‌های همراه همچنین می‌توانند کمک‌سازهای سطح قراردادِ فقط راه‌اندازی منتشر کنند که هسته
می‌تواند پیش از بارگذاری زمان اجرای کامل کانال با آن‌ها مشورت کند. سطح فعلی ارتقای راه‌اندازی
این است:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

هسته وقتی از آن سطح استفاده می‌کند که لازم باشد یک پیکربندی کانال تک‌حساب قدیمی
را بدون بارگذاری ورودی کامل Plugin به `channels.<id>.accounts.*` ارتقا دهد.
Matrix نمونه همراه فعلی است: وقتی حساب‌های نام‌دار از قبل وجود دارند، فقط کلیدهای احراز هویت/راه‌اندازی اولیه را
به یک حساب نام‌دار ارتقایافته منتقل می‌کند، و می‌تواند به‌جای همیشه ساختن
`accounts.default`، یک کلید حساب پیش‌فرضِ غیرکانونیِ پیکربندی‌شده را حفظ کند.

آن سازگارکننده‌های وصله راه‌اندازی، کشف سطح قرارداد همراه را تنبل نگه می‌دارند. زمان
درون‌ریزی سبک می‌ماند؛ سطح ارتقا فقط در نخستین استفاده بارگذاری می‌شود، نه با
ورود دوباره به شروع کانال همراه هنگام درون‌ریزی ماژول.

وقتی این سطح‌های شروع شامل روش‌های RPC مربوط به Gateway هستند، آن‌ها را روی یک
پیشوند ویژه Plugin نگه دارید. فضاهای نام مدیریت هسته (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) رزرو شده می‌مانند و همیشه به
`operator.admin` حل می‌شوند، حتی اگر یک Plugin دامنه محدودتری درخواست کند.

مثال:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### فراداده کاتالوگ کانال

Pluginهای کانال می‌توانند فراداده راه‌اندازی/کشف را از طریق `openclaw.channel` و
راهنمای نصب را از طریق `openclaw.install` اعلام کنند. این کار داده‌های کاتالوگ هسته را خالی نگه می‌دارد.

مثال:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

فیلدهای مفید `openclaw.channel` فراتر از مثال حداقلی:

- `detailLabel`: برچسب ثانویه برای سطح‌های غنی‌تر کاتالوگ/وضعیت
- `docsLabel`: بازنویسی متن لینک برای لینک مستندات
- `preferOver`: شناسه‌های Plugin/کانال با اولویت پایین‌تر که این مدخل کاتالوگ باید از آن‌ها بالاتر قرار گیرد
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: کنترل‌های متن سطح انتخاب
- `markdownCapable`: کانال را برای تصمیم‌های قالب‌بندی خروجی به‌عنوان پشتیبان Markdown علامت‌گذاری می‌کند
- `exposure.configured`: وقتی روی `false` تنظیم شود، کانال را از سطح‌های فهرست کانال‌های پیکربندی‌شده پنهان می‌کند
- `exposure.setup`: وقتی روی `false` تنظیم شود، کانال را از انتخاب‌گرهای تعاملی راه‌اندازی/پیکربندی پنهان می‌کند
- `exposure.docs`: کانال را برای سطح‌های ناوبری مستندات به‌عنوان داخلی/خصوصی علامت‌گذاری می‌کند
- `showConfigured` / `showInSetup`: نام‌های مستعار قدیمی که همچنان برای سازگاری پذیرفته می‌شوند؛ `exposure` را ترجیح دهید
- `quickstartAllowFrom`: کانال را وارد جریان شروع سریع استاندارد `allowFrom` می‌کند
- `forceAccountBinding`: حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند
- `preferSessionLookupForAnnounceTarget`: هنگام حل هدف‌های اعلام، جست‌وجوی نشست را ترجیح می‌دهد

OpenClaw همچنین می‌تواند **کاتالوگ‌های کانال خارجی** را ادغام کند (برای مثال، یک خروجی
رجیستری MPM). یک فایل JSON را در یکی از این مسیرها قرار دهید:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

یا `OPENCLAW_PLUGIN_CATALOG_PATHS` (یا `OPENCLAW_MPM_CATALOG_PATHS`) را به
یک یا چند فایل JSON اشاره دهید (جداشده با ویرگول/نقطه‌ویرگول/`PATH`). هر فایل باید
شامل `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` باشد. تجزیه‌گر همچنین `"packages"` یا `"plugins"` را به‌عنوان نام‌های مستعار قدیمی برای کلید `"entries"` می‌پذیرد.

مدخل‌های تولیدشده کاتالوگ کانال و مدخل‌های کاتالوگ نصب ارائه‌دهنده، واقعیت‌های
نرمال‌سازی‌شده منبع نصب را کنار بلوک خام `openclaw.install` ارائه می‌کنند. این
واقعیت‌های نرمال‌سازی‌شده مشخص می‌کنند که آیا مشخصه npm نسخه دقیق است یا انتخاب‌گر شناور،
آیا فراداده یکپارچگی مورد انتظار وجود دارد، و آیا مسیر منبع محلی نیز در دسترس است.
وقتی هویت کاتالوگ/بسته معلوم باشد، واقعیت‌های نرمال‌سازی‌شده هشدار می‌دهند اگر نام بسته npm
تجزیه‌شده از آن هویت منحرف شود. همچنین وقتی `defaultChoice` نامعتبر باشد یا به منبعی اشاره کند که
در دسترس نیست، و وقتی فراداده یکپارچگی npm بدون منبع npm معتبر وجود داشته باشد، هشدار می‌دهند.
مصرف‌کنندگان باید `installSource` را به‌عنوان یک فیلد اختیاری افزایشی در نظر بگیرند تا
مدخل‌های دستی و شیم‌های کاتالوگ مجبور به ساختن آن نباشند.
این به راه‌اندازی اولیه و عیب‌یابی اجازه می‌دهد وضعیت سطح منبع را بدون
درون‌ریزی زمان اجرای Plugin توضیح دهند.

مدخل‌های رسمی npm خارجی باید یک `npmSpec` دقیق همراه با
`expectedIntegrity` را ترجیح دهند. نام‌های ساده بسته و برچسب‌های توزیع همچنان برای
سازگاری کار می‌کنند، اما هشدارهای سطح منبع را نشان می‌دهند تا کاتالوگ بتواند
به‌سمت نصب‌های سنجاق‌شده و بررسی‌شده از نظر یکپارچگی حرکت کند، بی‌آنکه Pluginهای موجود را بشکند.
وقتی راه‌اندازی اولیه از یک مسیر کاتالوگ محلی نصب می‌کند، یک مدخل فهرست Plugin
مدیریت‌شده با `source: "path"` و در صورت امکان یک
`sourcePath` نسبی به فضای کاری ثبت می‌کند. مسیر بارگذاری عملیاتی مطلق در
`plugins.load.paths` می‌ماند؛ رکورد نصب از تکثیر مسیرهای ایستگاه کاری محلی
در پیکربندی بلندمدت پرهیز می‌کند. این کار نصب‌های توسعه محلی را برای
عیب‌یابی سطح منبع قابل مشاهده نگه می‌دارد، بدون افزودن یک سطح افشای دومِ مسیر خام فایل‌سیستم.
ردیف SQLite ماندگار `installed_plugin_index` منبع حقیقت نصب است و می‌تواند
بدون بارگذاری ماژول‌های زمان اجرای Plugin تازه‌سازی شود.
نگاشت `installRecords` آن حتی وقتی مانیفست Plugin گم یا نامعتبر باشد ماندگار است؛
بار `plugins` آن نمای مانیفست قابل بازسازی است.

## Pluginهای موتور زمینه

Pluginهای موتور زمینه مالک هماهنگ‌سازی زمینه نشست برای دریافت، مونتاژ،
و Compaction هستند. آن‌ها را از Plugin خود با
`api.registerContextEngine(id, factory)` ثبت کنید، سپس موتور فعال را با
`plugins.slots.contextEngine` انتخاب کنید.

وقتی از این استفاده کنید که Plugin شما باید خط لوله زمینه پیش‌فرض را
جایگزین یا گسترش دهد، نه اینکه فقط جست‌وجوی حافظه یا هوک اضافه کند.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

کارخانه `ctx` مقادیر اختیاری `config`، `agentDir`، و `workspaceDir`
را برای مقداردهی اولیه در زمان ساخت ارائه می‌کند.

`assemble()` وقتی هارنس فعال یک رشته پشتیبان پایدار دارد، می‌تواند `contextProjection` برگرداند.
برای تصویرسازی قدیمیِ هر نوبت آن را حذف کنید. وقتی زمینه مونتاژشده باید
یک‌بار به یک رشته پشتیبان تزریق شود و تا تغییر epoch دوباره استفاده شود،
`{ mode: "thread_bootstrap", epoch }` را برگردانید. پس از تغییر زمینه معنایی موتور،
مانند پس از یک گذر Compaction متعلق به موتور، epoch را تغییر دهید. میزبان‌ها ممکن است فراداده فراخوانی ابزار،
شکل ورودی، و نتایج ابزارِ ویرایش‌شده از نظر محرمانگی را در یک تصویرسازی thread-bootstrap حفظ کنند تا
رشته‌های پشتیبان تازه بدون کپی‌کردن بارهای خام دارای راز، پیوستگی ابزار را حفظ کنند.

اگر موتور شما مالک الگوریتم Compaction **نیست**، `compact()` را
پیاده‌سازی‌شده نگه دارید و آن را صریحاً واگذار کنید:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## افزودن یک قابلیت جدید

وقتی یک Plugin به رفتاری نیاز دارد که در API فعلی نمی‌گنجد، سیستم Plugin را با
دسترسی خصوصی دور نزنید. قابلیتِ گم‌شده را اضافه کنید.

توالی پیشنهادی:

1. قرارداد هسته را تعریف کنید
   تصمیم بگیرید هسته باید مالک چه رفتار مشترکی باشد: سیاست، fallback، ادغام پیکربندی،
   چرخه عمر، معناشناسی روبه‌کانال، و شکل کمک‌ساز زمان اجرا.
2. سطح‌های ثبت/زمان اجرای Plugin نوع‌دار اضافه کنید
   `OpenClawPluginApi` و/یا `api.runtime` را با کوچک‌ترین سطح قابلیت
   نوع‌دارِ مفید گسترش دهید.
3. هسته و مصرف‌کنندگان کانال/ویژگی را سیم‌کشی کنید
   کانال‌ها و Pluginهای ویژگی باید قابلیت جدید را از طریق هسته مصرف کنند،
   نه با درون‌ریزی مستقیم پیاده‌سازی فروشنده.
4. پیاده‌سازی‌های فروشنده را ثبت کنید
   سپس Pluginهای فروشنده backendهای خود را در برابر قابلیت ثبت می‌کنند.
5. پوشش قرارداد اضافه کنید
   آزمون‌هایی اضافه کنید تا مالکیت و شکل ثبت در طول زمان صریح بمانند.

اینگونه OpenClaw نظر‌مند می‌ماند، بدون آنکه به جهان‌بینی یک
ارائه‌دهنده سخت‌کدنویسی شود. برای یک چک‌لیست فایل مشخص و نمونه عملی، [کتاب آشپزی قابلیت](/fa/plugins/adding-capabilities)
را ببینید.

### چک‌لیست قابلیت

وقتی یک قابلیت جدید اضافه می‌کنید، پیاده‌سازی معمولاً باید این
سطح‌ها را با هم لمس کند:

- نوع‌های قرارداد هسته در `src/<capability>/types.ts`
- اجراکننده/کمک‌ساز زمان اجرای هسته در `src/<capability>/runtime.ts`
- سطح ثبت API Plugin در `src/plugins/types.ts`
- سیم‌کشی رجیستری Plugin در `src/plugins/registry.ts`
- ارائه زمان اجرای Plugin در `src/plugins/runtime/*` وقتی Pluginهای ویژگی/کانال
  باید آن را مصرف کنند
- کمک‌سازهای ضبط/آزمون در `src/test-utils/plugin-registration.ts`
- گزاره‌های مالکیت/قرارداد در `src/plugins/contracts/registry.ts`
- مستندات اپراتور/Plugin در `docs/`

اگر یکی از آن سطح‌ها گم باشد، معمولاً نشانه این است که قابلیت هنوز
کاملاً یکپارچه نشده است.

### قالب قابلیت

الگوی حداقلی:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

الگوی تست قرارداد:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

این قاعده را ساده نگه می‌دارد:

- هسته مالک قرارداد قابلیت + هماهنگ‌سازی است
- Pluginهای فروشنده مالک پیاده‌سازی‌های فروشنده هستند
- Pluginهای ویژگی/کانال از کمک‌کننده‌های runtime استفاده می‌کنند
- تست‌های قرارداد مالکیت را صریح نگه می‌دارند

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) — مدل و شکل‌های عمومی قابلیت
- [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths)
- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
