---
read_when:
    - پیاده‌سازی هوک‌های زمان اجرای ارائه‌دهنده، چرخهٔ حیات کانال، یا بسته‌های پکیج
    - اشکال‌زدایی ترتیب بارگذاری Plugin یا وضعیت رجیستری
    - افزودن یک قابلیت Plugin جدید یا یک Plugin موتور زمینه
summary: 'جزئیات داخلی معماری Plugin: خط لولهٔ بارگذاری، رجیستری، هوک‌های زمان اجرا، مسیرهای HTTP و جدول‌های مرجع'
title: جزئیات داخلی معماری Plugin
x-i18n:
    generated_at: "2026-05-11T20:38:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

برای مدل قابلیت عمومی، شکل‌های Plugin و قراردادهای مالکیت/اجرا، [معماری Plugin](/fa/plugins/architecture) را ببینید. این صفحه مرجع سازوکارهای داخلی است: pipeline بارگذاری، registry، hookهای runtime، مسیرهای HTTP مربوط به Gateway، مسیرهای import و جدول‌های schema.

## pipeline بارگذاری

هنگام راه‌اندازی، OpenClaw تقریباً این کارها را انجام می‌دهد:

1. ریشه‌های Plugin نامزد را کشف می‌کند
2. manifestهای bundle بومی یا سازگار و metadata بسته را می‌خواند
3. نامزدهای ناامن را رد می‌کند
4. پیکربندی Plugin را نرمال‌سازی می‌کند (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. فعال‌سازی هر نامزد را تعیین می‌کند
6. moduleهای بومی فعال‌شده را بارگذاری می‌کند: moduleهای bundled ساخته‌شده از loader بومی استفاده می‌کنند؛
   TypeScript منبع محلی شخص ثالث از fallback اضطراری Jiti استفاده می‌کند
7. hookهای بومی `register(api)` را فراخوانی می‌کند و registrationها را در registry مربوط به Plugin گردآوری می‌کند
8. registry را در اختیار commandها/سطح‌های runtime قرار می‌دهد

<Note>
`activate` یک alias قدیمی برای `register` است — loader هرکدام را که موجود باشد resolve می‌کند (`def.register ?? def.activate`) و در همان نقطه آن را فراخوانی می‌کند. همه Pluginهای bundled از `register` استفاده می‌کنند؛ برای Pluginهای جدید `register` را ترجیح دهید.
</Note>

gateهای ایمنی **پیش از** اجرای runtime اعمال می‌شوند. نامزدها زمانی مسدود می‌شوند
که entry از ریشه Plugin خارج شود، مسیر world-writable باشد، یا مالکیت مسیر برای Pluginهای غیر-bundled مشکوک به نظر برسد.

نامزدهای مسدودشده برای diagnostics همچنان به id مربوط به Plugin خود وابسته می‌مانند. اگر پیکربندی همچنان به آن id ارجاع دهد، validation آن Plugin را حاضر اما مسدود گزارش می‌کند
و به‌جای اینکه entry پیکربندی را منسوخ تلقی کند، به هشدار ایمنی مسیر ارجاع می‌دهد.

### رفتار manifest-first

manifest منبع حقیقت control-plane است. OpenClaw از آن برای این کارها استفاده می‌کند:

- شناسایی Plugin
- کشف channelها/Skills/schema پیکربندی اعلام‌شده یا قابلیت‌های bundle
- validation کردن `plugins.entries.<id>.config`
- تکمیل labelها/placeholderهای Control UI
- نمایش metadata نصب/catalog
- حفظ descriptorهای ارزان activation و setup بدون بارگذاری runtime مربوط به Plugin

برای Pluginهای بومی، module مربوط به runtime بخش data-plane است. این module رفتار واقعی مانند hookها، toolها، commandها یا جریان‌های provider را register می‌کند.

blockهای اختیاری `activation` و `setup` در manifest روی control plane می‌مانند.
آن‌ها descriptorهای صرفاً metadata برای planning فعال‌سازی و کشف setup هستند؛
جایگزین registration runtime، `register(...)` یا `setupEntry` نمی‌شوند.
نخستین مصرف‌کنندگان activation زنده اکنون از hintهای command، channel و provider در manifest استفاده می‌کنند
تا بارگذاری Plugin را پیش از materialization گسترده‌تر registry محدود کنند:

- بارگذاری CLI به Pluginهایی محدود می‌شود که مالک command اصلی درخواست‌شده هستند
- resolution مربوط به setup/Plugin برای channel به Pluginهایی محدود می‌شود که مالک
  id مربوط به channel درخواست‌شده هستند
- resolution صریح setup/runtime مربوط به provider به Pluginهایی محدود می‌شود که مالک
  id مربوط به provider درخواست‌شده هستند
- planning راه‌اندازی Gateway از `activation.onStartup` برای importهای صریح startup
  و opt-outهای startup استفاده می‌کند؛ Pluginهای بدون metadata مربوط به startup فقط
  از طریق triggerهای activation محدودتر بارگذاری می‌شوند

preloadهای runtime در زمان درخواست که scope گسترده `all` را می‌خواهند همچنان یک
مجموعه id مؤثر و صریح برای Plugin را از پیکربندی، planning راه‌اندازی، channelهای پیکربندی‌شده، slotها و ruleهای auto-enable استخراج می‌کنند. اگر آن مجموعه استخراج‌شده خالی باشد، OpenClaw
به‌جای گسترش به همه Pluginهای قابل کشف، یک registry runtime خالی بارگذاری می‌کند.

activation planner هم یک API فقط-id برای callerهای موجود و هم یک
API plan برای diagnostics جدید ارائه می‌دهد. entryهای plan گزارش می‌دهند چرا یک Plugin انتخاب شده است،
و hintهای planner صریح `activation.*` را از fallback مالکیت manifest مانند `providers`، `channels`، `commandAliases`، `setup.providers`،
`contracts.tools` و hookها جدا می‌کنند. این تفکیک دلیل، مرز سازگاری است:
metadata موجود Plugin همچنان کار می‌کند، در حالی که کد جدید می‌تواند hintهای گسترده
یا رفتار fallback را بدون تغییر semantics بارگذاری runtime تشخیص دهد.

کشف setup اکنون idهای descriptor-owned مانند `setup.providers` و
`setup.cliBackends` را ترجیح می‌دهد تا پیش از fallback به
`setup-api` برای Pluginهایی که هنوز به hookهای runtime در زمان setup نیاز دارند، Pluginهای نامزد را محدود کند. فهرست‌های setup مربوط به provider از `providerAuthChoices` در manifest، choiceهای setup مشتق‌شده از descriptor
و metadata مربوط به install-catalog بدون بارگذاری runtime مربوط به provider استفاده می‌کنند. `setup.requiresRuntime: false` صریح یک cutoff فقط-descriptor است؛ حذف
`requiresRuntime` برای سازگاری، fallback قدیمی setup-api را نگه می‌دارد. اگر بیش از یک
Plugin کشف‌شده claim کند که مالک همان id نرمال‌شده provider یا backend مربوط به CLI برای setup است، lookup مربوط به setup به‌جای اتکا به
ترتیب کشف، مالک مبهم را رد می‌کند. وقتی runtime مربوط به setup اجرا می‌شود، diagnostics registry
drift بین `setup.providers` / `setup.cliBackends` و providerها یا backendهای CLI
registerشده توسط setup-api را بدون مسدود کردن Pluginهای قدیمی گزارش می‌دهد.

### مرز cache مربوط به Plugin

OpenClaw نتایج کشف Plugin یا داده مستقیم registry مربوط به manifest را
پشت windowهای wall-clock cache نمی‌کند. نصب‌ها، ویرایش‌های manifest و تغییرات load-path
باید در خواندن صریح بعدی metadata یا بازسازی snapshot بعدی قابل مشاهده شوند.
parser فایل manifest می‌تواند یک cache محدود file-signature بر اساس
مسیر manifest بازشده، inode، اندازه و timestampها نگه دارد؛ این cache فقط از
parse دوباره byteهای بدون تغییر جلوگیری می‌کند و نباید پاسخ‌های discovery، registry، owner یا
policy را cache کند.

مسیر سریع و امن metadata مالکیت صریح object است، نه یک cache پنهان.
hot pathهای راه‌اندازی Gateway باید `PluginMetadataSnapshot` فعلی،
`PluginLookUpTable` استخراج‌شده، یا یک registry صریح manifest را در زنجیره call
عبور دهند. validation پیکربندی، auto-enable راه‌اندازی، bootstrap مربوط به Plugin و انتخاب provider
می‌توانند تا زمانی که این objectها نماینده پیکربندی فعلی و inventory مربوط به Plugin هستند، از آن‌ها دوباره استفاده کنند. setup lookup همچنان metadata مربوط به manifest را در صورت نیاز بازسازی می‌کند
مگر اینکه مسیر خاص setup یک registry صریح manifest دریافت کند؛ این را
به‌عنوان fallback مسیر سرد نگه دارید، نه اینکه cacheهای lookup پنهان اضافه کنید. وقتی input
تغییر می‌کند، به‌جای mutate کردن snapshot یا نگه داشتن copyهای تاریخی، آن را دوباره بسازید و جایگزین کنید.
viewهای روی registry فعال Plugin و helperهای bootstrap مربوط به channelهای bundled
باید از registry/root فعلی دوباره محاسبه شوند. mapهای کوتاه‌عمر درون یک call برای dedupe کردن کار یا محافظت از reentry اشکالی ندارند؛ آن‌ها نباید به cacheهای metadata فرایند تبدیل شوند.

برای بارگذاری Plugin، لایه cache پایدار بارگذاری runtime است. این لایه می‌تواند
state مربوط به loader را زمانی دوباره استفاده کند که code یا artifactهای نصب‌شده واقعاً بارگذاری شده‌اند، مانند:

- `PluginLoaderCacheState` و registryهای runtime فعال سازگار
- cacheهای jiti/module و cacheهای loader سطح عمومی که برای جلوگیری از import مکرر
  یک سطح runtime واحد استفاده می‌شوند
- cacheهای filesystem برای artifactهای نصب‌شده Plugin
- mapهای کوتاه‌عمر per-call برای نرمال‌سازی مسیر یا resolution تکراری

این cacheها جزئیات پیاده‌سازی data-plane هستند. آن‌ها نباید به
پرسش‌های control-plane مانند "کدام Plugin مالک این provider است؟" پاسخ دهند مگر اینکه
caller عمداً بارگذاری runtime را درخواست کرده باشد.

cacheهای پایدار یا wall-clock برای موارد زیر اضافه نکنید:

- نتایج discovery
- registryهای مستقیم manifest
- registryهای manifest بازسازی‌شده از index مربوط به Pluginهای نصب‌شده
- lookup مالک provider، suppression مدل، policy مربوط به provider، یا metadata مربوط به public-artifact
- هر پاسخ مشتق‌شده دیگری از manifest که در آن یک manifest تغییر‌یافته، index نصب‌شده،
  یا load path باید در خواندن بعدی metadata قابل مشاهده باشد

callerهایی که metadata مربوط به manifest را از index پایدار Pluginهای نصب‌شده
بازسازی می‌کنند، آن registry را در صورت نیاز بازسازی می‌کنند. index نصب‌شده state پایدار
source-plane است؛ یک cache metadata پنهان درون‌فرایندی نیست.

## مدل registry

Pluginهای بارگذاری‌شده مستقیماً globalهای تصادفی core را mutate نمی‌کنند. آن‌ها در یک
registry مرکزی Plugin register می‌شوند.

registry موارد زیر را دنبال می‌کند:

- recordهای Plugin (identity، source، origin، status، diagnostics)
- toolها
- hookهای قدیمی و hookهای typed
- channelها
- providerها
- handlerهای RPC مربوط به Gateway
- routeهای HTTP
- registrarهای CLI
- serviceهای پس‌زمینه
- commandهای متعلق به Plugin

سپس featureهای core به‌جای صحبت مستقیم با moduleهای Plugin، از آن registry می‌خوانند.
این کار بارگذاری را یک‌طرفه نگه می‌دارد:

- module مربوط به Plugin -> registration در registry
- runtime مربوط به core -> مصرف registry

این جداسازی برای نگهداشت‌پذیری اهمیت دارد. یعنی بیشتر سطح‌های core فقط به
یک نقطه integration نیاز دارند: "registry را بخوان"، نه "هر module مربوط به Plugin را special-case کن".

## callbackهای binding گفتگو

Pluginهایی که یک گفتگو را bind می‌کنند می‌توانند هنگام resolve شدن approval واکنش نشان دهند.

از `api.onConversationBindingResolved(...)` استفاده کنید تا پس از approve یا deny شدن درخواست bind،
یک callback دریافت کنید:

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

فیلدهای payload مربوط به callback:

- `status`: `"approved"` یا `"denied"`
- `decision`: `"allow-once"`، `"allow-always"` یا `"deny"`
- `binding`: binding resolveشده برای درخواست‌های approved
- `request`: خلاصه درخواست اصلی، hint مربوط به detach، id فرستنده و
  metadata گفتگو

این callback فقط notification است. اینکه چه کسی مجاز به bind کردن یک
گفتگو است را تغییر نمی‌دهد، و پس از پایان handling approval در core اجرا می‌شود.

## hookهای runtime مربوط به provider

Pluginهای provider سه لایه دارند:

- **metadata مربوط به manifest** برای lookup ارزان پیش از runtime:
  `setup.providers[].envVars`، compatibility منسوخ `providerAuthEnvVars`،
  `providerAuthAliases`، `providerAuthChoices` و `channelEnvVars`.
- **hookهای زمان پیکربندی**: `catalog` (قدیمی `discovery`) به‌همراه
  `applyConfigDefaults`.
- **hookهای runtime**: بیش از 40 hook اختیاری شامل auth، resolution مدل،
  stream wrapping، سطح‌های thinking، policy مربوط به replay و endpointهای usage. فهرست
  کامل را زیر [ترتیب و کاربرد hookها](#hook-order-and-usage) ببینید.

OpenClaw همچنان مالک حلقه generic agent، failover، handling transcript و
policy مربوط به tool است. این hookها سطح extension برای رفتار خاص provider هستند،
بدون اینکه به یک transport استنتاج کاملاً سفارشی نیاز باشد.

زمانی از `setup.providers[].envVars` در manifest استفاده کنید که provider credentialهای env-based دارد
و مسیرهای generic auth/status/model-picker باید بدون
بارگذاری runtime مربوط به Plugin آن‌ها را ببینند. `providerAuthEnvVars` منسوخ همچنان توسط
adapter سازگاری در بازه deprecation خوانده می‌شود، و Pluginهای غیر-bundled
که از آن استفاده می‌کنند یک diagnostic مربوط به manifest دریافت می‌کنند. زمانی از `providerAuthAliases` در manifest استفاده کنید
که یک id مربوط به provider باید env varها، profileهای auth،
auth مبتنی بر پیکربندی و choice onboarding مربوط به API-key را از id provider دیگری دوباره استفاده کند. زمانی از
`providerAuthChoices` در manifest استفاده کنید که سطح‌های CLI مربوط به onboarding/auth-choice باید
id مربوط به choice در provider، labelهای group و wiring ساده auth با یک flag را بدون
بارگذاری runtime مربوط به provider بدانند. `envVars` مربوط به runtime provider را برای hintهای operator-facing
مانند labelهای onboarding یا varهای setup مربوط به OAuth
client-id/client-secret نگه دارید.

زمانی از `channelEnvVars` در manifest استفاده کنید که یک channel دارای auth یا setup مبتنی بر env است که
generic shell-env fallback، checkهای config/status، یا promptهای setup باید بدون
بارگذاری runtime مربوط به channel ببینند.

### ترتیب و کاربرد hookها

برای Pluginهای model/provider، OpenClaw hookها را تقریباً به این ترتیب فراخوانی می‌کند.
ستون "زمان استفاده" راهنمای سریع تصمیم‌گیری است.
فیلدهای فقط-سازگاری provider که OpenClaw دیگر فراخوانی نمی‌کند، مانند
`ProviderPlugin.capabilities` و `suppressBuiltInModel`، عمداً اینجا
فهرست نشده‌اند.

| #   | هوک                              | کارکرد                                                                                                   | زمان استفاده                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | انتشار پیکربندی ارائه‌دهنده در `models.providers` هنگام تولید `models.json`                                | ارائه‌دهنده مالک کاتالوگ یا پیش‌فرض‌های URL پایه است                                                                                                  |
| 2   | `applyConfigDefaults`             | اعمال پیش‌فرض‌های سراسری پیکربندیِ متعلق به ارائه‌دهنده هنگام مادی‌سازی پیکربندی                                      | پیش‌فرض‌ها به حالت احراز هویت، env، یا معناشناسی خانواده مدل ارائه‌دهنده وابسته‌اند                                                                         |
| --  | _(جست‌وجوی مدل داخلی)_         | OpenClaw ابتدا مسیر عادی رجیستری/کاتالوگ را امتحان می‌کند                                                          | _(هوک Plugin نیست)_                                                                                                                         |
| 3   | `normalizeModelId`                | نرمال‌سازی نام‌های مستعار قدیمی یا پیش‌نمایش model-id پیش از جست‌وجو                                                     | ارائه‌دهنده مالک پاک‌سازی نام مستعار پیش از تحلیل مدل کانونی است                                                                                 |
| 4   | `normalizeTransport`              | نرمال‌سازی `api` / `baseUrl` خانواده ارائه‌دهنده پیش از مونتاژ عمومی مدل                                      | ارائه‌دهنده مالک پاک‌سازی انتقال برای شناسه‌های سفارشی ارائه‌دهنده در همان خانواده انتقال است                                                          |
| 5   | `normalizeConfig`                 | نرمال‌سازی `models.providers.<id>` پیش از تحلیل زمان اجرا/ارائه‌دهنده                                           | ارائه‌دهنده به پاک‌سازی پیکربندی نیاز دارد که باید با Plugin زندگی کند؛ کمک‌گرهای بسته‌بندی‌شده خانواده Google نیز از ورودی‌های پیکربندی Google پشتیبانی‌شده پشتیبان می‌گیرند   |
| 6   | `applyNativeStreamingUsageCompat` | اعمال بازنویسی‌های سازگاری کاربرد استریمینگ بومی روی ارائه‌دهندگان پیکربندی                                               | ارائه‌دهنده به اصلاحات فراداده کاربرد استریمینگ بومی مبتنی بر endpoint نیاز دارد                                                                          |
| 7   | `resolveConfigApiKey`             | تحلیل احراز هویت env-marker برای ارائه‌دهندگان پیکربندی پیش از بارگذاری احراز هویت زمان اجرا                                       | ارائه‌دهنده تحلیل کلید API با env-marker متعلق به خودش را دارد؛ `amazon-bedrock` نیز اینجا یک تحلیل‌گر داخلی env-marker برای AWS دارد                  |
| 8   | `resolveSyntheticAuth`            | نمایان‌کردن احراز هویت محلی/خودمیزبان یا متکی بر پیکربندی بدون پایدارسازی متن خام                                   | ارائه‌دهنده می‌تواند با یک نشانگر اعتبارنامه مصنوعی/محلی کار کند                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | هم‌پوشانی پروفایل‌های احراز هویت خارجی متعلق به ارائه‌دهنده؛ مقدار پیش‌فرض `persistence` برای اعتبارنامه‌های متعلق به CLI/برنامه `runtime-only` است | ارائه‌دهنده از اعتبارنامه‌های احراز هویت خارجی بدون پایدارسازی توکن‌های refresh کپی‌شده دوباره استفاده می‌کند؛ `contracts.externalAuthProviders` را در manifest اعلام کنید |
| 10  | `shouldDeferSyntheticProfileAuth` | پایین‌بردن نگه‌دارنده‌های جای پروفایل مصنوعی ذخیره‌شده پشت احراز هویت متکی بر env/پیکربندی                                      | ارائه‌دهنده پروفایل‌های نگه‌دارنده جای مصنوعی ذخیره می‌کند که نباید در تقدم برنده شوند                                                                 |
| 11  | `resolveDynamicModel`             | fallback همگام برای شناسه‌های مدل متعلق به ارائه‌دهنده که هنوز در رجیستری محلی نیستند                                       | ارائه‌دهنده شناسه‌های مدل دلخواه upstream را می‌پذیرد                                                                                                 |
| 12  | `prepareDynamicModel`             | گرم‌سازی ناهمگام، سپس `resolveDynamicModel` دوباره اجرا می‌شود                                                           | ارائه‌دهنده پیش از تحلیل شناسه‌های ناشناخته به فراداده شبکه نیاز دارد                                                                                  |
| 13  | `normalizeResolvedModel`          | بازنویسی نهایی پیش از آنکه اجراکننده تعبیه‌شده از مدل تحلیل‌شده استفاده کند                                               | ارائه‌دهنده به بازنویسی‌های انتقال نیاز دارد اما همچنان از انتقال هسته استفاده می‌کند                                                                             |
| 14  | `contributeResolvedModelCompat`   | افزودن پرچم‌های سازگاری برای مدل‌های فروشنده پشت یک انتقال سازگار دیگر                                  | ارائه‌دهنده مدل‌های خودش را روی انتقال‌های پروکسی تشخیص می‌دهد بدون آنکه کنترل ارائه‌دهنده را در دست بگیرد                                                       |
| 15  | `normalizeToolSchemas`            | نرمال‌سازی schemaهای ابزار پیش از آنکه اجراکننده تعبیه‌شده آنها را ببیند                                                    | ارائه‌دهنده به پاک‌سازی schema خانواده انتقال نیاز دارد                                                                                                |
| 16  | `inspectToolSchemas`              | نمایان‌کردن عیب‌یابی‌های schema متعلق به ارائه‌دهنده پس از نرمال‌سازی                                                  | ارائه‌دهنده هشدارهای کلیدواژه‌ای می‌خواهد بدون اینکه به هسته قواعد اختصاصی ارائه‌دهنده آموزش دهد                                                                 |
| 17  | `resolveReasoningOutputMode`      | انتخاب قرارداد خروجی reasoning بومی در برابر برچسب‌خورده                                                              | ارائه‌دهنده به reasoning/خروجی نهایی برچسب‌خورده به‌جای فیلدهای بومی نیاز دارد                                                                         |
| 18  | `prepareExtraParams`              | نرمال‌سازی پارامتر درخواست پیش از wrapperهای عمومی گزینه stream                                              | ارائه‌دهنده به پارامترهای درخواست پیش‌فرض یا پاک‌سازی پارامتر به‌ازای هر ارائه‌دهنده نیاز دارد                                                                           |
| 19  | `createStreamFn`                  | جایگزینی کامل مسیر عادی stream با یک انتقال سفارشی                                                   | ارائه‌دهنده به یک پروتکل سیمی سفارشی نیاز دارد، نه فقط یک wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | wrapper استریم پس از اعمال wrapperهای عمومی                                                              | ارائه‌دهنده به wrapperهای سازگاری header/body/model درخواست بدون انتقال سفارشی نیاز دارد                                                          |
| 21  | `resolveTransportTurnState`       | پیوست‌کردن headerها یا فراداده بومی انتقال به‌ازای هر turn                                                           | ارائه‌دهنده می‌خواهد انتقال‌های عمومی هویت turn بومی ارائه‌دهنده را ارسال کنند                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | پیوست‌کردن headerهای بومی WebSocket یا سیاست cool-down نشست                                                    | ارائه‌دهنده می‌خواهد انتقال‌های عمومی WS، headerهای نشست یا سیاست fallback را تنظیم کنند                                                               |
| 23  | `formatApiKey`                    | قالب‌دهنده پروفایل احراز هویت: پروفایل ذخیره‌شده به رشته زمان اجرای `apiKey` تبدیل می‌شود                                     | ارائه‌دهنده فراداده احراز هویت اضافی ذخیره می‌کند و به شکل توکن زمان اجرای سفارشی نیاز دارد                                                                    |
| 24  | `refreshOAuth`                    | override برای refresh در OAuth جهت endpointهای refresh سفارشی یا سیاست شکست refresh                                  | ارائه‌دهنده با refreshکننده‌های مشترک `pi-ai` سازگار نیست                                                                                           |
| 25  | `buildAuthDoctorHint`             | راهنمای تعمیر که هنگام شکست refresh در OAuth افزوده می‌شود                                                                  | ارائه‌دهنده پس از شکست refresh به راهنمایی تعمیر احراز هویت متعلق به خودش نیاز دارد                                                                      |
| 26  | `matchesContextOverflowError`     | matcher سرریز پنجره context متعلق به ارائه‌دهنده                                                                 | ارائه‌دهنده خطاهای خام سرریز دارد که heuristicهای عمومی آنها را از دست می‌دهند                                                                                |
| 27  | `classifyFailoverReason`          | دسته‌بندی دلیل failover متعلق به ارائه‌دهنده                                                                  | ارائه‌دهنده می‌تواند خطاهای خام API/انتقال را به rate-limit/overload/و غیره نگاشت کند                                                                          |
| 28  | `isCacheTtlEligible`              | سیاست cache پرامپت برای ارائه‌دهندگان پروکسی/backhaul                                                               | ارائه‌دهنده به gate کردن TTL cache اختصاصی پروکسی نیاز دارد                                                                                                |
| 29  | `buildMissingAuthMessage`         | جایگزین پیام عمومی بازیابی احراز هویتِ موجود نبودن احراز هویت                                                      | ارائه‌دهنده به راهنمای بازیابی احراز هویتِ موجود نبودن احراز هویت اختصاصی ارائه‌دهنده نیاز دارد                                                                                 |
| 30  | `augmentModelCatalog`             | ردیف‌های کاتالوگ مصنوعی/نهایی که پس از کشف افزوده می‌شوند                                                          | ارائه‌دهنده به ردیف‌های سازگاری رو به جلو مصنوعی در `models list` و انتخاب‌گرها نیاز دارد                                                                     |
| 31  | `resolveThinkingProfile`          | مجموعه سطح `/think` اختصاصی مدل، برچسب‌های نمایش، و مقدار پیش‌فرض                                                 | ارائه‌دهنده برای مدل‌های انتخاب‌شده یک نردبان thinking سفارشی یا برچسب دودویی ارائه می‌کند                                                                 |
| 32  | `isBinaryThinking`                | هوک سازگاری toggle روشن/خاموش reasoning                                                                     | ارائه‌دهنده فقط thinking دودویی روشن/خاموش ارائه می‌کند                                                                                                  |
| 33  | `supportsXHighThinking`           | هوک سازگاری پشتیبانی reasoning با `xhigh`                                                                   | ارائه‌دهنده `xhigh` را فقط روی زیرمجموعه‌ای از مدل‌ها می‌خواهد                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | هوک سازگاری سطح پیش‌فرض `/think`                                                                      | ارائه‌دهنده مالک سیاست پیش‌فرض `/think` برای یک خانواده مدل است                                                                                      |
| 35  | `isModernModelRef`                | matcher مدل مدرن برای فیلترهای پروفایل زنده و انتخاب smoke                                              | ارائه‌دهنده مالک تطبیق مدل ترجیحی live/smoke است                                                                                             |
| 36  | `prepareRuntimeAuth`              | تبدیل یک اعتبارنامه پیکربندی‌شده به توکن/کلید واقعی زمان اجرا درست پیش از inference                       | ارائه‌دهنده به تبدیل توکن یا اعتبارنامه درخواست کوتاه‌عمر نیاز دارد                                                                             |
| 37  | `resolveUsageAuth`                | اعتبارنامه‌های استفاده/صورتحساب را برای `/usage` و سطوح وضعیت مرتبط رفع می‌کند                                     | ارائه‌دهنده به تجزیهٔ سفارشی توکن استفاده/سهمیه یا اعتبارنامهٔ استفادهٔ متفاوتی نیاز دارد                                                               |
| 38  | `fetchUsageSnapshot`              | پس از رفع احراز هویت، نماهای لحظه‌ای استفاده/سهمیهٔ ویژهٔ ارائه‌دهنده را دریافت و نرمال‌سازی می‌کند                             | ارائه‌دهنده به نقطهٔ پایانی استفادهٔ ویژهٔ ارائه‌دهنده یا تجزیه‌کنندهٔ payload نیاز دارد                                                                           |
| 39  | `createEmbeddingProvider`         | یک آداپتور embedding تحت مالکیت ارائه‌دهنده برای حافظه/جست‌وجو می‌سازد                                                     | رفتار embedding حافظه به Plugin ارائه‌دهنده تعلق دارد                                                                                    |
| 40  | `buildReplayPolicy`               | یک سیاست بازپخش برمی‌گرداند که مدیریت transcript را برای ارائه‌دهنده کنترل می‌کند                                        | ارائه‌دهنده به سیاست سفارشی transcript نیاز دارد (برای مثال، حذف بلوک‌های thinking)                                                               |
| 41  | `sanitizeReplayHistory`           | تاریخچهٔ بازپخش را پس از پاک‌سازی عمومی transcript بازنویسی می‌کند                                                        | ارائه‌دهنده به بازنویسی‌های بازپخش ویژهٔ ارائه‌دهنده فراتر از کمک‌کننده‌های Compaction مشترک نیاز دارد                                                             |
| 42  | `validateReplayTurns`             | اعتبارسنجی یا بازشکل‌دهی نهایی نوبت‌های بازپخش پیش از runner تعبیه‌شده                                           | انتقال ارائه‌دهنده پس از پاک‌سازی عمومی به اعتبارسنجی سخت‌گیرانه‌تر نوبت‌ها نیاز دارد                                                                    |
| 43  | `onModelSelected`                 | اثرات جانبی پس از انتخاب، تحت مالکیت ارائه‌دهنده را اجرا می‌کند                                                                 | وقتی یک مدل فعال می‌شود، ارائه‌دهنده به telemetry یا وضعیت تحت مالکیت ارائه‌دهنده نیاز دارد                                                                  |

`normalizeModelId`، `normalizeTransport`، و `normalizeConfig` ابتدا Plugin ارائه‌دهندهٔ منطبق را بررسی می‌کنند، سپس از میان سایر Pluginهای ارائه‌دهنده‌ای که قابلیت هوک دارند عبور می‌کنند تا زمانی که یکی از آن‌ها واقعا شناسهٔ مدل یا انتقال/پیکربندی را تغییر دهد. این کار باعث می‌شود شیم‌های ارائه‌دهندهٔ سازگاری/نام مستعار بدون نیاز به اینکه فراخواننده بداند کدام Plugin همراه مالک بازنویسی است، کار کنند. اگر هیچ هوک ارائه‌دهنده‌ای یک ورودی پیکربندی پشتیبانی‌شده از خانوادهٔ Google را بازنویسی نکند، نرمال‌ساز پیکربندی Google همراه همچنان آن پاک‌سازی سازگاری را اعمال می‌کند.

اگر ارائه‌دهنده به یک پروتکل سیمی کاملا سفارشی یا اجراکنندهٔ درخواست سفارشی نیاز داشته باشد، این یک ردهٔ متفاوت از افزونه است. این هوک‌ها برای رفتار ارائه‌دهنده‌ای هستند که همچنان روی حلقهٔ استنتاج عادی OpenClaw اجرا می‌شود.

### نمونهٔ ارائه‌دهنده

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

Pluginهای ارائه‌دهندهٔ همراه، هوک‌های بالا را ترکیب می‌کنند تا با کاتالوگ، احراز هویت، تفکر، بازپخش، و نیازهای مصرف هر فروشنده سازگار شوند. مجموعهٔ معتبر هوک‌ها همراه هر Plugin زیر `extensions/` قرار دارد؛ این صفحه شکل‌ها را نشان می‌دهد، نه اینکه فهرست را بازتاب دهد.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter، Kilocode، Z.AI، و xAI، `catalog` را به‌همراه
    `resolveDynamicModel` / `prepareDynamicModel` ثبت می‌کنند تا بتوانند شناسه‌های مدل بالادستی را پیش از کاتالوگ ایستای OpenClaw نمایش دهند.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot، Gemini CLI، ChatGPT Codex، MiniMax، Xiaomi، و z.ai،
    `prepareRuntimeAuth` یا `formatApiKey` را با `resolveUsageAuth` +
    `fetchUsageSnapshot` جفت می‌کنند تا مالک تبادل توکن و یکپارچه‌سازی `/usage` باشند.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    خانواده‌های نام‌گذاری‌شدهٔ مشترک (`google-gemini`، `passthrough-gemini`،
    `anthropic-by-model`، `hybrid-anthropic-openai`) به ارائه‌دهنده‌ها اجازه می‌دهند از طریق `buildReplayPolicy` وارد سیاست رونوشت شوند، به‌جای اینکه هر Plugin پاک‌سازی را دوباره پیاده‌سازی کند.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`، `cloudflare-ai-gateway`، `huggingface`، `kimi-coding`، `nvidia`،
    `qianfan`، `synthetic`، `together`، `venice`، `vercel-ai-gateway`، و
    `volcengine` فقط `catalog` را ثبت می‌کنند و از حلقهٔ استنتاج مشترک استفاده می‌کنند.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    سرآیندهای بتا، `/fast` / `serviceTier`، و `context1m` داخل درز عمومی `api.ts` / `contract-api.ts` در Plugin Anthropic قرار دارند
    (`wrapAnthropicProviderStream`، `resolveAnthropicBetas`،
    `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`) نه در SDK عمومی.
  </Accordion>
</AccordionGroup>

## کمک‌یارهای زمان اجرا

Pluginها می‌توانند از طریق `api.runtime` به کمک‌یارهای منتخب هسته دسترسی داشته باشند. برای TTS:

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

نکته‌ها:

- `textToSpeech` خروجی عادی TTS هسته را برای سطوح فایل/یادداشت صوتی برمی‌گرداند.
- از پیکربندی `messages.tts` هسته و انتخاب ارائه‌دهنده استفاده می‌کند.
- بافر صوتی PCM + نرخ نمونه‌برداری را برمی‌گرداند. Pluginها باید برای ارائه‌دهنده‌ها بازنمونه‌برداری/رمزگذاری کنند.
- `listVoices` برای هر ارائه‌دهنده اختیاری است. از آن برای انتخابگرهای صدای تحت مالکیت فروشنده یا جریان‌های راه‌اندازی استفاده کنید.
- فهرست‌های صدا می‌توانند فرادادهٔ غنی‌تری مانند زبان‌محل، جنسیت، و برچسب‌های شخصیت برای انتخابگرهای آگاه از ارائه‌دهنده داشته باشند.
- OpenAI و ElevenLabs امروز از تلفنی پشتیبانی می‌کنند. Microsoft پشتیبانی نمی‌کند.

Pluginها همچنین می‌توانند ارائه‌دهنده‌های گفتار را از طریق `api.registerSpeechProvider(...)` ثبت کنند.

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

نکته‌ها:

- سیاست TTS، جایگزین، و تحویل پاسخ را در هسته نگه دارید.
- از ارائه‌دهنده‌های گفتار برای رفتار سنتز تحت مالکیت فروشنده استفاده کنید.
- ورودی قدیمی Microsoft `edge` به شناسهٔ ارائه‌دهندهٔ `microsoft` نرمال می‌شود.
- مدل مالکیت ترجیحی شرکت‌محور است: یک Plugin فروشنده می‌تواند مالک ارائه‌دهنده‌های متن، گفتار، تصویر، و رسانه‌های آینده باشد، هم‌زمان با اینکه OpenClaw آن قراردادهای قابلیت را اضافه می‌کند.

برای فهم تصویر/صوت/ویدئو، Pluginها به‌جای یک کیسهٔ کلید/مقدار عمومی، یک ارائه‌دهندهٔ فهم رسانهٔ تایپ‌شده ثبت می‌کنند:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

نکته‌ها:

- هماهنگ‌سازی، جایگزین، پیکربندی، و سیم‌کشی کانال را در هسته نگه دارید.
- رفتار فروشنده را در Plugin ارائه‌دهنده نگه دارید.
- گسترش افزایشی باید تایپ‌شده بماند: متدهای اختیاری جدید، فیلدهای نتیجهٔ اختیاری جدید، قابلیت‌های اختیاری جدید.
- تولید ویدئو از قبل همان الگو را دنبال می‌کند:
  - هسته مالک قرارداد قابلیت و کمک‌یار زمان اجرا است
  - Pluginهای فروشنده `api.registerVideoGenerationProvider(...)` را ثبت می‌کنند
  - Pluginهای ویژگی/کانال از `api.runtime.videoGeneration.*` استفاده می‌کنند

برای کمک‌یارهای زمان اجرای فهم رسانه، Pluginها می‌توانند فراخوانی کنند:

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

برای رونویسی صوتی، Pluginها می‌توانند یا از زمان اجرای فهم رسانه استفاده کنند یا از نام مستعار قدیمی‌تر STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

نکته‌ها:

- `api.runtime.mediaUnderstanding.*` سطح مشترک ترجیحی برای فهم تصویر/صوت/ویدئو است.
- `extractStructuredWithModel(...)` درز روبه‌روی Plugin برای استخراج محدود و تحت مالکیت ارائه‌دهنده با اولویت تصویر است. دست‌کم یک ورودی تصویر وارد کنید؛ ورودی‌های متنی زمینهٔ تکمیلی هستند.
  Pluginهای محصول مالک مسیرها و طرحواره‌های خود هستند، درحالی‌که OpenClaw مالک مرز ارائه‌دهنده/زمان اجرا است.
- از پیکربندی صوتی فهم رسانهٔ هسته (`tools.media.audio`) و ترتیب جایگزین ارائه‌دهنده استفاده می‌کند.
- وقتی هیچ خروجی رونویسی تولید نشود، `{ text: undefined }` را برمی‌گرداند، برای مثال ورودی ردشده/پشتیبانی‌نشده.
- `api.runtime.stt.transcribeAudioFile(...)` به‌عنوان نام مستعار سازگاری باقی می‌ماند.

Pluginها همچنین می‌توانند اجراهای زیردستیار پس‌زمینه را از طریق `api.runtime.subagent` راه‌اندازی کنند:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

نکته‌ها:

- `provider` و `model` بازنویسی‌های اختیاری برای هر اجرا هستند، نه تغییرات پایدار نشست.
- OpenClaw این فیلدهای بازنویسی را فقط برای فراخواننده‌های قابل اعتماد رعایت می‌کند.
- برای اجراهای جایگزین تحت مالکیت Plugin، اپراتورها باید با `plugins.entries.<id>.subagent.allowModelOverride: true` اعلام موافقت کنند.
- از `plugins.entries.<id>.subagent.allowedModels` برای محدود کردن Pluginهای قابل اعتماد به هدف‌های متعارف مشخص `provider/model` استفاده کنید، یا از `"*"` برای مجاز کردن صریح هر هدف.
- اجراهای زیردستیار Plugin نامطمئن همچنان کار می‌کنند، اما درخواست‌های بازنویسی به‌جای بازگشت بی‌صدا، رد می‌شوند.
- نشست‌های زیردستیار ساخته‌شده توسط Plugin با شناسهٔ Plugin سازنده برچسب‌گذاری می‌شوند. جایگزین `api.runtime.subagent.deleteSession(...)` فقط می‌تواند آن نشست‌های تحت مالکیت را حذف کند؛ حذف نشست دلخواه همچنان به یک درخواست Gateway با دامنهٔ مدیر نیاز دارد.

برای جست‌وجوی وب، Pluginها می‌توانند به‌جای دسترسی مستقیم به سیم‌کشی ابزار عامل، از کمک‌یار زمان اجرای مشترک استفاده کنند:

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

Pluginها همچنین می‌توانند ارائه‌دهنده‌های جست‌وجوی وب را از طریق
`api.registerWebSearchProvider(...)` ثبت کنند.

نکته‌ها:

- انتخاب ارائه‌دهنده، حل اعتبارنامه، و معناشناسی درخواست مشترک را در هسته نگه دارید.
- از ارائه‌دهنده‌های جست‌وجوی وب برای انتقال‌های جست‌وجوی ویژهٔ فروشنده استفاده کنید.
- `api.runtime.webSearch.*` سطح مشترک ترجیحی برای Pluginهای ویژگی/کانالی است که بدون وابستگی به پوشش ابزار عامل به رفتار جست‌وجو نیاز دارند.

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

- `generate(...)`: یک تصویر را با استفاده از زنجیرهٔ ارائه‌دهندهٔ تولید تصویر پیکربندی‌شده تولید می‌کند.
- `listProviders(...)`: ارائه‌دهنده‌های تولید تصویر موجود و قابلیت‌هایشان را فهرست می‌کند.

## مسیرهای HTTP Gateway

Pluginها می‌توانند با `api.registerHttpRoute(...)` نقاط پایانی HTTP را آشکار کنند.

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

- `path`: مسیر مسیر زیر سرور HTTP Gateway.
- `auth`: الزامی. از `"gateway"` برای نیاز داشتن به احراز هویت عادی Gateway، یا از `"plugin"` برای احراز هویت/راستی‌آزمایی Webhook مدیریت‌شده توسط Plugin استفاده کنید.
- `match`: اختیاری. `"exact"` (پیش‌فرض) یا `"prefix"`.
- `replaceExisting`: اختیاری. به همان Plugin اجازه می‌دهد ثبت مسیر موجود خودش را جایگزین کند.
- `handler`: وقتی مسیر درخواست را مدیریت کرد، `true` برگردانید.

نکته‌ها:

- `api.registerHttpHandler(...)` حذف شده است و باعث خطای بارگذاری Plugin می‌شود. به‌جای آن از `api.registerHttpRoute(...)` استفاده کنید.
- مسیرهای Plugin باید `auth` را به‌صراحت اعلام کنند.
- تعارض‌های دقیق `path + match` رد می‌شوند مگر اینکه `replaceExisting: true` باشد، و یک Plugin نمی‌تواند مسیر Plugin دیگری را جایگزین کند.
- مسیرهای هم‌پوشان با سطوح متفاوت `auth` رد می‌شوند. زنجیره‌های fallthrough با `exact`/`prefix` را فقط روی همان سطح auth نگه دارید.
- مسیرهای `auth: "plugin"` به‌طور خودکار scopeهای runtime اپراتور را دریافت **نمی‌کنند**. این مسیرها برای Webhookهای مدیریت‌شده توسط Plugin/اعتبارسنجی امضا هستند، نه فراخوانی‌های کمکی ممتاز Gateway.
- مسیرهای `auth: "gateway"` داخل scope runtime درخواست Gateway اجرا می‌شوند، اما آن scope عمدا محافظه‌کارانه است:
  - احراز هویت bearer با secret مشترک (`gateway.auth.mode = "token"` / `"password"`) scopeهای runtime مسیر Plugin را روی `operator.write` ثابت نگه می‌دارد، حتی اگر فراخواننده `x-openclaw-scopes` بفرستد
  - حالت‌های HTTP دارای هویت مورد اعتماد (برای مثال `trusted-proxy` یا `gateway.auth.mode = "none"` روی یک ingress خصوصی) فقط وقتی `x-openclaw-scopes` را رعایت می‌کنند که header به‌صراحت وجود داشته باشد
  - اگر `x-openclaw-scopes` در آن درخواست‌های مسیر Plugin دارای هویت وجود نداشته باشد، scope runtime به `operator.write` برمی‌گردد
- قاعده عملی: فرض نکنید یک مسیر Plugin با احراز هویت Gateway به‌صورت ضمنی سطح مدیریت است. اگر مسیر شما به رفتار فقط-مدیر نیاز دارد، یک حالت احراز هویت دارای هویت را الزام کنید و قرارداد صریح header `x-openclaw-scopes` را مستند کنید.

## مسیرهای import در SDK Plugin

هنگام نوشتن Pluginهای جدید، به‌جای barrel ریشه یکپارچه `openclaw/plugin-sdk` از subpathهای محدود SDK استفاده کنید.
subpathهای اصلی:

| Subpath                             | هدف                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitiveهای ثبت Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | helperهای ورود/ساخت Channel                        |
| `openclaw/plugin-sdk/core`          | helperهای مشترک عمومی و قرارداد چتری       |
| `openclaw/plugin-sdk/config-schema` | schema ریشه `openclaw.json` در Zod (`OpenClawSchema`) |

Pluginهای Channel از خانواده‌ای از seamهای محدود انتخاب می‌کنند — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` و `channel-actions`. رفتار approval باید روی یک قرارداد `approvalCapability` متمرکز شود، نه اینکه بین fieldهای نامرتبط Plugin ترکیب شود. [Pluginهای Channel](/fa/plugins/sdk-channel-plugins) را ببینید.

helperهای runtime و config زیر subpathهای متمرکز متناظر `*-runtime` قرار دارند
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` و غیره). به‌جای barrel سازگاری گسترده `config-runtime`، `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` و `config-mutation` را ترجیح دهید.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
و `openclaw/plugin-sdk/infra-runtime` shimهای سازگاری منسوخ برای
Pluginهای قدیمی‌تر هستند. کد جدید باید به‌جای آن primitiveهای عمومی محدودتر را import کند.
</Info>

نقطه‌های ورود داخلی repo (برای ریشه package هر Plugin بسته‌بندی‌شده):

- `index.js` — ورودی Plugin بسته‌بندی‌شده
- `api.js` — barrel helperها/types
- `runtime-api.js` — barrel فقط-runtime
- `setup-entry.js` — ورودی Plugin setup

Pluginهای خارجی فقط باید subpathهای `openclaw/plugin-sdk/*` را import کنند. هرگز
`src/*` یک package Plugin دیگر را از core یا از Plugin دیگر import نکنید.
نقطه‌های ورود بارگذاری‌شده از طریق facade وقتی snapshot config runtime فعال وجود دارد آن را ترجیح می‌دهند، سپس به فایل config resolveشده روی disk برمی‌گردند.

subpathهای مخصوص capability مانند `image-generation`, `media-understanding`,
و `speech` وجود دارند چون Pluginهای بسته‌بندی‌شده امروز از آن‌ها استفاده می‌کنند. آن‌ها به‌طور خودکار قراردادهای خارجی بلندمدت و ثابت نیستند — هنگام اتکا به آن‌ها، صفحه مرجع SDK مرتبط را بررسی کنید.

## schemaهای ابزار پیام

Pluginها باید contributionهای schema مربوط به Channel در `describeMessageTool(...)` را برای primitiveهای غیرپیامی مانند واکنش‌ها، خواندن‌ها و نظرسنجی‌ها مالک شوند.
نمایش مشترک ارسال باید به‌جای fieldهای button، component، block یا card بومی provider از قرارداد عمومی `MessagePresentation` استفاده کند.
برای قرارداد، قواعد fallback، نگاشت provider، و checklist نویسنده Plugin، [ارائه پیام](/fa/plugins/message-presentation) را ببینید.

Pluginهای دارای قابلیت ارسال، آنچه می‌توانند render کنند را از طریق capabilityهای پیام اعلام می‌کنند:

- `presentation` برای blockهای ارائه معنایی (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` برای درخواست‌های تحویل pinned

Core تصمیم می‌گیرد که presentation را به‌صورت بومی render کند یا آن را به متن degrade کند.
escape hatchهای UI بومی provider را از ابزار پیام عمومی در معرض قرار ندهید.
helperهای SDK منسوخ برای schemaهای بومی legacy همچنان برای Pluginهای شخص ثالث موجود export می‌شوند، اما Pluginهای جدید نباید از آن‌ها استفاده کنند.

## resolve کردن target در Channel

Pluginهای Channel باید semanticsهای target مخصوص Channel را مالک شوند. host outbound مشترک را عمومی نگه دارید و برای قواعد provider از سطح adapter پیام‌رسانی استفاده کنید:

- `messaging.inferTargetChatType({ to })` پیش از lookup در directory تصمیم می‌گیرد که آیا target نرمال‌شده باید به‌عنوان `direct`، `group` یا `channel` در نظر گرفته شود.
- `messaging.targetResolver.looksLikeId(raw, normalized)` به core می‌گوید آیا یک input باید به‌جای جست‌وجو در directory مستقیما به resolution شبیه id برود یا نه.
- `messaging.targetResolver.resolveTarget(...)` fallback Plugin است وقتی core پس از normalization یا پس از miss در directory به resolution نهایی متعلق به provider نیاز دارد.
- `messaging.resolveOutboundSessionRoute(...)` پس از resolve شدن target، ساخت route session مخصوص provider را مالک می‌شود.

تقسیم پیشنهادی:

- از `inferTargetChatType` برای تصمیم‌های category استفاده کنید که باید پیش از جست‌وجوی peers/groups انجام شوند.
- از `looksLikeId` برای بررسی‌های «این را به‌عنوان یک target id صریح/بومی در نظر بگیر» استفاده کنید.
- از `resolveTarget` برای fallback normalization مخصوص provider استفاده کنید، نه برای جست‌وجوی گسترده در directory.
- idهای بومی provider مانند chat idها، thread idها، JIDها، handleها و room idها را داخل مقدارهای `target` یا params مخصوص provider نگه دارید، نه در fieldهای عمومی SDK.

## directoryهای مبتنی بر config

Pluginهایی که entryهای directory را از config استخراج می‌کنند باید آن logic را در Plugin نگه دارند و helperهای مشترک را از
`openclaw/plugin-sdk/directory-runtime` دوباره استفاده کنند.

وقتی یک Channel به peers/groups مبتنی بر config مانند موارد زیر نیاز دارد، از این استفاده کنید:

- peers برای DM بر اساس allowlist
- mapهای channel/group پیکربندی‌شده
- fallbackهای directory static در scope حساب

helperهای مشترک در `directory-runtime` فقط operationهای عمومی را handle می‌کنند:

- filtering query
- اعمال limit
- helperهای dedupe/normalization
- ساخت `ChannelDirectoryEntry[]`

بازرسی حساب مخصوص Channel و normalization شناسه باید در implementation Plugin باقی بماند.

## کاتالوگ‌های provider

Pluginهای provider می‌توانند با
`registerProvider({ catalog: { run(...) { ... } } })` کاتالوگ مدل برای inference تعریف کنند.

`catalog.run(...)` همان شکلی را برمی‌گرداند که OpenClaw در
`models.providers` می‌نویسد:

- `{ provider }` برای یک entry provider
- `{ providers }` برای چند entry provider

وقتی Plugin مالک idهای مدل مخصوص provider، پیش‌فرض‌های base URL، یا metadata مدل پشت auth است، از `catalog` استفاده کنید.

`catalog.order` کنترل می‌کند کاتالوگ یک Plugin چه زمانی نسبت به providerهای ضمنی داخلی OpenClaw merge شود:

- `simple`: providerهای ساده مبتنی بر API key یا env
- `profile`: providerهایی که وقتی auth profileها وجود دارند ظاهر می‌شوند
- `paired`: providerهایی که چند entry provider مرتبط را synthesize می‌کنند
- `late`: آخرین pass، پس از سایر providerهای ضمنی

providerهای بعدی در برخورد key برنده می‌شوند، بنابراین Pluginها می‌توانند عمدا یک entry provider داخلی با همان provider id را override کنند.

Pluginها همچنین می‌توانند rowهای مدل read-only را از طریق
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` منتشر کنند. این مسیر آینده برای سطح‌های list/help/picker است و از rowهای
`text`, `image_generation`, `video_generation` و `music_generation` پشتیبانی می‌کند.
Pluginهای provider همچنان مالک فراخوانی‌های endpoint زنده، token exchange و نگاشت پاسخ vendor هستند؛ core مالک شکل row مشترک، labelهای source و formatting help ابزار media است. ثبت providerهای media-generation به‌طور خودکار rowهای catalog static را از `defaultModel`, `models` و `capabilities` synthesize می‌کند.

سازگاری:

- `discovery` هنوز به‌عنوان alias legacy کار می‌کند، اما warning منسوخ بودن emit می‌کند
- اگر هم `catalog` و هم `discovery` ثبت شده باشند، OpenClaw از `catalog` استفاده می‌کند
- `augmentModelCatalog` منسوخ شده است؛ providerهای بسته‌بندی‌شده باید rowهای supplemental را از طریق `registerModelCatalogProvider` منتشر کنند

## بازرسی read-only Channel

اگر Plugin شما یک Channel ثبت می‌کند، ترجیحا
`plugin.config.inspectAccount(cfg, accountId)` را در کنار `resolveAccount(...)` پیاده‌سازی کنید.

چرا:

- `resolveAccount(...)` مسیر runtime است. مجاز است فرض کند credentialها کاملا materialize شده‌اند و وقتی secretهای لازم وجود ندارند سریع fail کند.
- مسیرهای command read-only مانند `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`، و flowهای repair در doctor/config نباید فقط برای توصیف configuration نیاز داشته باشند credentialهای runtime را materialize کنند.

رفتار پیشنهادی `inspectAccount(...)`:

- فقط state توصیفی حساب را برگردانید.
- `enabled` و `configured` را حفظ کنید.
- وقتی مرتبط است، fieldهای source/status credential را شامل کنید، مانند:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- برای گزارش availability به‌صورت read-only لازم نیست مقدارهای raw token را برگردانید. برگرداندن `tokenStatus: "available"` (و field source متناظر) برای commandهای سبک status کافی است.
- وقتی یک credential از طریق SecretRef پیکربندی شده اما در مسیر command فعلی در دسترس نیست، از `configured_unavailable` استفاده کنید.

این کار به commandهای read-only اجازه می‌دهد به‌جای crash کردن یا گزارش نادرست حساب به‌عنوان پیکربندی‌نشده، «پیکربندی‌شده اما در این مسیر command در دسترس نیست» را گزارش کنند.

## packهای package

یک directory مربوط به Plugin می‌تواند یک `package.json` با `openclaw.extensions` داشته باشد:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

هر entry به یک Plugin تبدیل می‌شود. اگر pack چند extension فهرست کند، Plugin id به
`name/<fileBase>` تبدیل می‌شود.

اگر Plugin شما deps مربوط به npm را import می‌کند، آن‌ها را در همان directory نصب کنید تا
`node_modules` در دسترس باشد (`npm install` / `pnpm install`).

guardrail امنیتی: هر entry در `openclaw.extensions` باید پس از resolve شدن symlink داخل directory Plugin باقی بماند. entryهایی که از directory package خارج شوند رد می‌شوند.

نکته امنیتی: `openclaw plugins install` وابستگی‌های Plugin را با یک
`npm install --omit=dev --ignore-scripts` محلی project نصب می‌کند (بدون lifecycle scriptها،
بدون وابستگی‌های dev در runtime)، و settingهای install سراسری npm به‌ارث‌رسیده را نادیده می‌گیرد.
درخت‌های dependency مربوط به Plugin را «خالص JS/TS» نگه دارید و از packageهایی که به buildهای `postinstall` نیاز دارند پرهیز کنید.

اختیاری: `openclaw.setupEntry` می‌تواند به یک module سبک فقط-setup اشاره کند.
وقتی OpenClaw برای یک Plugin Channel غیرفعال به سطح‌های setup نیاز دارد، یا
وقتی یک Plugin Channel فعال است اما هنوز پیکربندی‌نشده، به‌جای entry کامل Plugin، `setupEntry` را بارگذاری می‌کند. این کار startup و setup را سبک‌تر نگه می‌دارد
وقتی entry اصلی Plugin شما همچنین tools، hooks یا کدهای دیگر فقط-runtime را wire می‌کند.

اختیاری: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
می‌تواند یک Plugin Channel را حتی وقتی Channel از قبل پیکربندی شده است، در phase startup پیش از listen در Gateway وارد همان مسیر `setupEntry` کند.

از این فقط زمانی استفاده کنید که `setupEntry` سطح راه‌اندازی‌ای را که باید
پیش از شروع گوش‌دادن gateway وجود داشته باشد، به‌طور کامل پوشش می‌دهد. در عمل، یعنی ورودی setup
باید هر قابلیت متعلق به کانال را که راه‌اندازی به آن وابسته است ثبت کند، مانند:

- خود ثبت کانال
- هر مسیر HTTP که باید پیش از شروع گوش‌دادن gateway در دسترس باشد
- هر متد، ابزار یا سرویس gateway که باید در همان بازه وجود داشته باشد

اگر ورودی کامل شما هنوز مالک هر قابلیت الزامی راه‌اندازی است، این پرچم را فعال نکنید.
Plugin را روی رفتار پیش‌فرض نگه دارید و اجازه دهید OpenClaw ورودی کامل را
در طول راه‌اندازی بارگذاری کند.

کانال‌های همراه همچنین می‌توانند helperهای سطح قراردادِ فقط-setup منتشر کنند که هسته
می‌تواند پیش از بارگذاری runtime کامل کانال با آن‌ها مشورت کند. سطح فعلی ارتقای setup
عبارت است از:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

هسته زمانی از این سطح استفاده می‌کند که لازم باشد پیکربندی کانال تک‌حسابِ قدیمی را
بدون بارگذاری ورودی کامل Plugin به `channels.<id>.accounts.*` ارتقا دهد.
Matrix نمونه همراه فعلی است: وقتی حساب‌های نام‌دار از قبل وجود دارند، فقط کلیدهای auth/bootstrap را به یک
حساب نام‌دار ارتقایافته منتقل می‌کند، و می‌تواند به‌جای اینکه همیشه
`accounts.default` را ایجاد کند، یک کلید حساب پیش‌فرض غیرکانونی پیکربندی‌شده را حفظ کند.

آن adapterهای patch مربوط به setup، کشف سطح قرارداد همراه را lazy نگه می‌دارند. زمان import
سبک می‌ماند؛ سطح ارتقا فقط در اولین استفاده بارگذاری می‌شود، به‌جای اینکه هنگام import ماژول
دوباره وارد راه‌اندازی کانال همراه شود.

وقتی آن سطوح راه‌اندازی شامل متدهای RPC مربوط به gateway هستند، آن‌ها را روی یک پیشوند
اختصاصی Plugin نگه دارید. namespaceهای مدیریتی هسته (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محفوظ می‌مانند و همیشه به
`operator.admin` resolve می‌شوند، حتی اگر یک Plugin scope محدودتری درخواست کند.

نمونه:

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

Pluginهای کانال می‌توانند فراداده setup/discovery را از طریق `openclaw.channel` و
راهنمایی‌های نصب را از طریق `openclaw.install` اعلام کنند. این کار داده‌های کاتالوگ هسته را خالی نگه می‌دارد.

نمونه:

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

فیلدهای مفید `openclaw.channel` فراتر از نمونه حداقلی:

- `detailLabel`: برچسب ثانویه برای سطح‌های کاتالوگ/وضعیت غنی‌تر
- `docsLabel`: بازنویسی متن لینک برای لینک مستندات
- `preferOver`: شناسه‌های Plugin/کانال با اولویت پایین‌تر که این مدخل کاتالوگ باید از آن‌ها پیشی بگیرد
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: کنترل‌های متن سطح انتخاب
- `markdownCapable`: کانال را برای تصمیم‌های قالب‌بندی خروجی، دارای قابلیت markdown علامت‌گذاری می‌کند
- `exposure.configured`: وقتی روی `false` تنظیم شود، کانال را از سطح‌های فهرست‌کردن کانال‌های پیکربندی‌شده پنهان می‌کند
- `exposure.setup`: وقتی روی `false` تنظیم شود، کانال را از انتخاب‌گرهای تعاملی setup/configure پنهان می‌کند
- `exposure.docs`: کانال را برای سطح‌های ناوبری مستندات به‌عنوان داخلی/خصوصی علامت‌گذاری می‌کند
- `showConfigured` / `showInSetup`: نام‌های مستعار قدیمی که هنوز برای سازگاری پذیرفته می‌شوند؛ `exposure` را ترجیح دهید
- `quickstartAllowFrom`: کانال را وارد جریان استاندارد quickstart `allowFrom` می‌کند
- `forceAccountBinding`: حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند
- `preferSessionLookupForAnnounceTarget`: هنگام resolve کردن هدف‌های اعلام، lookup نشست را ترجیح می‌دهد

OpenClaw همچنین می‌تواند **کاتالوگ‌های کانال خارجی** را merge کند (برای مثال، یک export
رجیستری MPM). یک فایل JSON را در یکی از این مسیرها قرار دهید:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

یا `OPENCLAW_PLUGIN_CATALOG_PATHS` (یا `OPENCLAW_MPM_CATALOG_PATHS`) را به
یک یا چند فایل JSON اشاره دهید (با جداکننده comma/semicolon/`PATH`). هر فایل باید
حاوی `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` باشد. parser همچنین `"packages"` یا `"plugins"` را به‌عنوان نام‌های مستعار قدیمی برای کلید `"entries"` می‌پذیرد.

مدخل‌های کاتالوگ کانال تولیدشده و مدخل‌های کاتالوگ نصب provider،
واقعیت‌های نرمال‌شده منبع نصب را در کنار بلوک خام `openclaw.install` ارائه می‌کنند.
این واقعیت‌های نرمال‌شده مشخص می‌کنند که آیا spec مربوط به npm یک نسخه دقیق است یا یک
selector شناور، آیا فراداده integrity مورد انتظار وجود دارد، و آیا مسیر منبع محلی
نیز در دسترس است. وقتی هویت کاتالوگ/بسته شناخته‌شده باشد،
واقعیت‌های نرمال‌شده هشدار می‌دهند اگر نام بسته npm تجزیه‌شده از آن هویت فاصله بگیرد.
همچنین زمانی هشدار می‌دهند که `defaultChoice` نامعتبر باشد یا به منبعی اشاره کند که
در دسترس نیست، و وقتی فراداده integrity مربوط به npm بدون یک منبع npm معتبر وجود داشته باشد.
مصرف‌کنندگان باید `installSource` را به‌عنوان یک فیلد اختیاری افزایشی در نظر بگیرند تا
مدخل‌های دست‌ساز و shimهای کاتالوگ مجبور به ساختن آن نباشند.
این کار به onboarding و diagnostics اجازه می‌دهد وضعیت source-plane را بدون
import کردن runtime مربوط به Plugin توضیح دهند.

مدخل‌های رسمی خارجی npm باید یک `npmSpec` دقیق به‌همراه
`expectedIntegrity` را ترجیح دهند. نام‌های bare package و dist-tagها همچنان برای
سازگاری کار می‌کنند، اما هشدارهای source-plane نمایش می‌دهند تا کاتالوگ بتواند
به سمت نصب‌های pinشده و بررسی‌شده با integrity حرکت کند بدون اینکه Pluginهای موجود را خراب کند.
وقتی onboarding از یک مسیر کاتالوگ محلی نصب می‌کند، یک مدخل index مربوط به Plugin مدیریت‌شده
با `source: "path"` و در صورت امکان یک `sourcePath` نسبی به workspace
ثبت می‌کند. مسیر عملیاتی مطلق بارگذاری در
`plugins.load.paths` باقی می‌ماند؛ رکورد نصب از تکرار مسیرهای workstation محلی
در پیکربندی بلندمدت جلوگیری می‌کند. این کار نصب‌های توسعه محلی را برای
diagnostics مربوط به source-plane قابل مشاهده نگه می‌دارد بدون اینکه سطح افشای
دوم مسیر خام filesystem اضافه کند. index ماندگار Plugin در `plugins/installs.json`
منبع حقیقت نصب است و می‌تواند بدون بارگذاری ماژول‌های runtime مربوط به Plugin تازه‌سازی شود.
map مربوط به `installRecords` حتی وقتی manifest یک Plugin گم شده یا
نامعتبر باشد پایدار است؛ آرایه `plugins` آن یک نمای manifest قابل بازسازی است.

## Pluginهای موتور زمینه

Pluginهای موتور زمینه مالک هماهنگ‌سازی زمینه نشست برای ingest، assembly،
و Compaction هستند. آن‌ها را از Plugin خود با
`api.registerContextEngine(id, factory)` ثبت کنید، سپس موتور فعال را با
`plugins.slots.contextEngine` انتخاب کنید.

وقتی Plugin شما نیاز دارد pipeline زمینه پیش‌فرض را جایگزین یا گسترش دهد،
نه اینکه فقط جست‌وجوی memory یا hook اضافه کند، از این استفاده کنید.

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

factory `ctx` مقادیر اختیاری `config`، `agentDir`، و `workspaceDir`
را برای مقداردهی اولیه در زمان ساخت ارائه می‌کند.

اگر موتور شما مالک الگوریتم Compaction **نیست**، `compact()` را
پیاده‌سازی‌شده نگه دارید و آن را صریحا delegate کنید:

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

وقتی یک Plugin به رفتاری نیاز دارد که با API فعلی سازگار نیست، با دسترسی خصوصی
به درون سیستم Plugin آن را دور نزنید. قابلیتِ گم‌شده را اضافه کنید.

ترتیب پیشنهادی:

1. قرارداد هسته را تعریف کنید
   تصمیم بگیرید هسته باید مالک چه رفتار مشترکی باشد: policy، fallback، merge پیکربندی،
   lifecycle، معناشناسی رو به کانال، و شکل helper مربوط به runtime.
2. سطح‌های typed ثبت Plugin/runtime را اضافه کنید
   `OpenClawPluginApi` و/یا `api.runtime` را با کوچک‌ترین سطح قابلیت typed مفید
   گسترش دهید.
3. مصرف‌کنندگان هسته + کانال/feature را وصل کنید
   کانال‌ها و Pluginهای feature باید قابلیت جدید را از طریق هسته مصرف کنند،
   نه با import مستقیم یک پیاده‌سازی vendor.
4. پیاده‌سازی‌های vendor را ثبت کنید
   سپس Pluginهای vendor backendهای خود را در برابر قابلیت ثبت می‌کنند.
5. پوشش قرارداد اضافه کنید
   تست‌هایی اضافه کنید تا مالکیت و شکل ثبت در طول زمان صریح بماند.

اینگونه OpenClaw نظرگاه مشخص خود را حفظ می‌کند بدون اینکه به worldview یک
provider خاص hardcode شود. برای یک checklist فایل مشخص و نمونه کارشده، [Capability Cookbook](/fa/plugins/adding-capabilities)
را ببینید.

### checklist قابلیت

وقتی یک قابلیت جدید اضافه می‌کنید، پیاده‌سازی معمولا باید این سطح‌ها را
با هم لمس کند:

- نوع‌های قرارداد هسته در `src/<capability>/types.ts`
- helper مربوط به runner/runtime هسته در `src/<capability>/runtime.ts`
- سطح ثبت API مربوط به Plugin در `src/plugins/types.ts`
- wiring رجیستری Plugin در `src/plugins/registry.ts`
- exposure مربوط به runtime Plugin در `src/plugins/runtime/*` وقتی Pluginهای feature/channel
  نیاز به مصرف آن دارند
- helperهای capture/test در `src/test-utils/plugin-registration.ts`
- assertionهای مالکیت/قرارداد در `src/plugins/contracts/registry.ts`
- مستندات operator/Plugin در `docs/`

اگر یکی از این سطح‌ها گم باشد، معمولا نشانه این است که قابلیت هنوز
به‌طور کامل یکپارچه نشده است.

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

این کار قاعده را ساده نگه می‌دارد:

- هسته مالک قرارداد قابلیت + هماهنگ‌سازی است
- Pluginهای vendor مالک پیاده‌سازی‌های vendor هستند
- Pluginهای feature/channel helperهای runtime را مصرف می‌کنند
- تست‌های قرارداد مالکیت را صریح نگه می‌دارند

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) — مدل و شکل‌های عمومی قابلیت
- [زیربخش‌های Plugin SDK](/fa/plugins/sdk-subpaths)
- [setup مربوط به Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
