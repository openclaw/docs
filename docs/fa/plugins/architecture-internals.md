---
read_when:
    - پیاده‌سازی هوک‌های زمان اجرای ارائه‌دهنده، چرخهٔ حیات کانال، یا پک‌های بسته
    - عیب‌یابی ترتیب بارگذاری Plugin یا وضعیت رجیستری
    - افزودن یک قابلیت Plugin جدید یا Plugin موتور زمینه
summary: 'جزئیات داخلی معماری Plugin: خط لوله بارگذاری، رجیستری، هوک‌های زمان اجرا، مسیرهای HTTP، و جدول‌های مرجع'
title: جزئیات داخلی معماری Plugin
x-i18n:
    generated_at: "2026-05-03T21:37:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

برای مدل قابلیت عمومی، شکل‌های Plugin، و قراردادهای مالکیت/اجرا،
[معماری Plugin](/fa/plugins/architecture) را ببینید. این صفحه مرجع
سازوکارهای داخلی است: خط لوله بارگذاری، رجیستری، hookهای runtime،
مسیرهای HTTP در Gateway، مسیرهای import، و جدول‌های schema.

## خط لوله بارگذاری

در زمان راه‌اندازی، OpenClaw تقریبا این کارها را انجام می‌دهد:

1. ریشه‌های Plugin نامزد را کشف می‌کند
2. مانیفست‌های bundle بومی یا سازگار و فراداده package را می‌خواند
3. نامزدهای ناامن را رد می‌کند
4. پیکربندی Plugin را نرمال‌سازی می‌کند (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. فعال‌بودن هر نامزد را تعیین می‌کند
6. ماژول‌های بومی فعال‌شده را بارگذاری می‌کند: ماژول‌های bundleشده ساخته‌شده از loader بومی استفاده می‌کنند؛
   سورس TypeScript محلی شخص ثالث از fallback اضطراری Jiti استفاده می‌کند
7. hookهای بومی `register(api)` را فراخوانی می‌کند و ثبت‌ها را در رجیستری Plugin جمع‌آوری می‌کند
8. رجیستری را در اختیار commandها/سطح‌های runtime قرار می‌دهد

<Note>
`activate` یک alias قدیمی برای `register` است — loader هرکدام را که موجود باشد resolve می‌کند (`def.register ?? def.activate`) و آن را در همان نقطه فراخوانی می‌کند. همه Pluginهای bundleشده از `register` استفاده می‌کنند؛ برای Pluginهای جدید `register` را ترجیح دهید.
</Note>

دروازه‌های ایمنی **پیش از** اجرای runtime رخ می‌دهند. نامزدها زمانی مسدود
می‌شوند که entry از ریشه Plugin خارج شود، مسیر world-writable باشد، یا مالکیت
مسیر برای Pluginهای غیر-bundled مشکوک به نظر برسد.

نامزدهای مسدودشده برای عیب‌یابی همچنان به شناسه Plugin خود گره خورده می‌مانند.
اگر پیکربندی هنوز به آن شناسه ارجاع دهد، اعتبارسنجی Plugin را حاضر اما مسدود
گزارش می‌کند و به‌جای اینکه entry پیکربندی را stale تلقی کند، به هشدار ایمنی مسیر
اشاره می‌کند.

### رفتار manifest-first

مانیفست منبع حقیقت control-plane است. OpenClaw از آن برای این کارها استفاده می‌کند:

- شناسایی Plugin
- کشف channelها/Skills/schema پیکربندی یا قابلیت‌های bundle اعلام‌شده
- اعتبارسنجی `plugins.entries.<id>.config`
- تکمیل labelها/placeholders در Control UI
- نمایش فراداده نصب/catalog
- حفظ descriptorهای ارزان activation و setup بدون بارگذاری runtime Plugin

برای Pluginهای بومی، ماژول runtime بخش data-plane است. این ماژول رفتار واقعی
مانند hookها، toolها، commandها، یا flowهای provider را ثبت می‌کند.

بلوک‌های اختیاری `activation` و `setup` در مانیفست روی control plane باقی می‌مانند.
آن‌ها descriptorهای فقط-فراداده برای برنامه‌ریزی activation و کشف setup هستند؛
آن‌ها جایگزین ثبت runtime، `register(...)`، یا `setupEntry` نمی‌شوند.
نخستین مصرف‌کنندگان activation زنده اکنون از hintهای command، channel، و provider در مانیفست
برای محدودکردن بارگذاری Plugin پیش از materialization گسترده‌تر رجیستری استفاده می‌کنند:

- بارگذاری CLI به Pluginهایی محدود می‌شود که مالک command اصلی درخواست‌شده هستند
- setup/resolution مربوط به channel/Plugin به Pluginهایی محدود می‌شود که مالک شناسه
  channel درخواست‌شده هستند
- setup/resolution صریح provider در runtime به Pluginهایی محدود می‌شود که مالک شناسه
  provider درخواست‌شده هستند
- برنامه‌ریزی راه‌اندازی Gateway از `activation.onStartup` برای importهای صریح startup
  و opt-outهای startup استفاده می‌کند؛ Pluginهای بدون فراداده startup فقط
  از طریق triggerهای activation محدودتر بارگذاری می‌شوند

preloadهای runtime هنگام درخواست که scope گسترده `all` را می‌خواهند، همچنان یک
مجموعه شناسه Plugin موثر و صریح را از پیکربندی، برنامه‌ریزی startup، channelهای
پیکربندی‌شده، slotها، و قواعد auto-enable استخراج می‌کنند. اگر آن مجموعه استخراج‌شده
خالی باشد، OpenClaw به‌جای گسترش به همه Pluginهای قابل کشف،
یک رجیستری runtime خالی بارگذاری می‌کند.

activation planner هم یک API فقط-شناسه برای فراخوان‌های موجود و هم یک
API plan برای عیب‌یابی‌های جدید ارائه می‌کند. entryهای plan گزارش می‌کنند چرا
یک Plugin انتخاب شده است و hintهای planner صریح `activation.*` را از fallbackهای
مالکیت مانیفست مانند `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` و hookها جدا می‌کنند. این تفکیک دلیل، مرز سازگاری است:
فراداده Plugin موجود همچنان کار می‌کند، در حالی که کد جدید می‌تواند hintهای گسترده
یا رفتار fallback را بدون تغییر semantics بارگذاری runtime تشخیص دهد.

کشف setup اکنون شناسه‌های مالک-descriptor مانند `setup.providers` و
`setup.cliBackends` را ترجیح می‌دهد تا پیش از fallback به
`setup-api` برای Pluginهایی که هنوز به hookهای runtime زمان setup نیاز دارند،
Pluginهای نامزد را محدود کند. فهرست‌های setup مربوط به Provider از `providerAuthChoices`
در مانیفست، گزینه‌های setup مشتق‌شده از descriptor، و فراداده install-catalog
بدون بارگذاری runtime provider استفاده می‌کنند. `setup.requiresRuntime: false`
صریح یک cutoff فقط-descriptor است؛ حذف `requiresRuntime` برای سازگاری fallback قدیمی
setup-api را حفظ می‌کند. اگر بیش از یک Plugin کشف‌شده مدعی همان شناسه نرمال‌شده
setup provider یا CLI backend باشد، lookup setup به‌جای اتکا به ترتیب کشف،
مالک مبهم را رد می‌کند. وقتی runtime setup اجرا می‌شود، عیب‌یابی رجیستری drift
بین `setup.providers` / `setup.cliBackends` و providerها یا CLI backendهایی را که
setup-api ثبت کرده است بدون مسدودکردن Pluginهای قدیمی گزارش می‌کند.

### مرز کش Plugin

OpenClaw نتایج کشف Plugin یا داده مستقیم رجیستری مانیفست را پشت پنجره‌های
wall-clock کش نمی‌کند. نصب‌ها، ویرایش‌های مانیفست، و تغییرات مسیر بارگذاری
باید در خواندن صریح بعدی فراداده یا بازسازی snapshot بعدی قابل مشاهده شوند.
parser فایل مانیفست ممکن است یک کش محدود file-signature داشته باشد که با مسیر
مانیفست بازشده، inode، اندازه، و timestampها کلیدگذاری شده است؛ آن کش فقط از
parse دوباره byteهای بدون تغییر جلوگیری می‌کند و نباید پاسخ‌های کشف، رجیستری،
مالک، یا policy را کش کند.

مسیر سریع امن فراداده، مالکیت صریح object است، نه یک کش پنهان.
hot pathهای startup در Gateway باید `PluginMetadataSnapshot` جاری، `PluginLookUpTable`
استخراج‌شده، یا یک رجیستری مانیفست صریح را از طریق زنجیره فراخوانی عبور دهند.
اعتبارسنجی پیکربندی، auto-enable در startup، bootstrap کردن Plugin، و انتخاب provider
می‌توانند تا وقتی این objectها نماینده پیکربندی و موجودی Plugin جاری هستند از آن‌ها
استفاده کنند. lookup مربوط به setup همچنان فراداده مانیفست را در صورت نیاز بازسازی
می‌کند مگر اینکه مسیر setup مشخص یک رجیستری مانیفست صریح دریافت کند؛ این را به‌عنوان
fallback مسیر سرد نگه دارید، نه اینکه کش‌های lookup پنهان اضافه کنید. وقتی input
تغییر می‌کند، به‌جای mutate کردن snapshot یا نگه‌داشتن نسخه‌های تاریخی،
snapshot را بازسازی و جایگزین کنید.
viewهای روی رجیستری Plugin فعال و helperهای bootstrap مربوط به channelهای bundleشده
باید از رجیستری/root جاری دوباره محاسبه شوند. mapهای کوتاه‌عمر درون یک فراخوانی
برای dedupe کردن کار یا محافظت در برابر reentry اشکالی ندارند؛ اما نباید به
کش‌های فراداده process تبدیل شوند.

برای بارگذاری Plugin، لایه کش پایدار بارگذاری runtime است. این لایه ممکن است
وقتی کد یا artifactهای نصب‌شده واقعا بارگذاری می‌شوند، state loader را دوباره
استفاده کند، مانند:

- `PluginLoaderCacheState` و رجیستری‌های runtime فعال سازگار
- کش‌های jiti/module و کش‌های loader سطح عمومی که برای جلوگیری از import مکرر
  همان سطح runtime استفاده می‌شوند
- کش‌های filesystem برای artifactهای Plugin نصب‌شده
- mapهای کوتاه‌عمر per-call برای نرمال‌سازی مسیر یا resolve کردن duplicateها

این کش‌ها جزئیات پیاده‌سازی data-plane هستند. آن‌ها نباید به پرسش‌های
control-plane مانند «کدام Plugin مالک این provider است؟» پاسخ دهند، مگر اینکه
فراخوان عمدا بارگذاری runtime را درخواست کرده باشد.

کش‌های پایدار یا wall-clock برای این موارد اضافه نکنید:

- نتایج کشف
- رجیستری‌های مستقیم مانیفست
- رجیستری‌های مانیفست بازسازی‌شده از index مربوط به Pluginهای نصب‌شده
- lookup مالک provider، سرکوب مدل، policy مربوط به provider، یا فراداده public-artifact
- هر پاسخ دیگری مشتق‌شده از مانیفست که در آن مانیفست تغییرکرده، index نصب‌شده،
  یا مسیر بارگذاری باید در خواندن فراداده بعدی قابل مشاهده باشد

فراخوان‌هایی که فراداده مانیفست را از index پایدار Plugin نصب‌شده بازسازی می‌کنند،
آن رجیستری را در صورت نیاز بازسازی می‌کنند. index نصب‌شده وضعیت durable
source-plane است؛ یک کش فراداده پنهان درون process نیست.

## مدل رجیستری

Pluginهای بارگذاری‌شده مستقیما globalهای تصادفی core را mutate نمی‌کنند. آن‌ها در
یک رجیستری مرکزی Plugin ثبت می‌شوند.

رجیستری این موارد را پیگیری می‌کند:

- رکوردهای Plugin (هویت، منبع، origin، وضعیت، diagnostics)
- toolها
- hookهای legacy و hookهای typed
- channelها
- providerها
- handlerهای RPC در Gateway
- مسیرهای HTTP
- registrarهای CLI
- سرویس‌های پس‌زمینه
- commandهای مالکیت‌شده توسط Plugin

سپس featureهای core به‌جای صحبت مستقیم با ماژول‌های Plugin، از آن رجیستری می‌خوانند.
این کار بارگذاری را یک‌طرفه نگه می‌دارد:

- ماژول Plugin -> ثبت در رجیستری
- runtime core -> مصرف رجیستری

این جداسازی برای نگهداشت‌پذیری مهم است. یعنی بیشتر سطح‌های core فقط به یک نقطه
ادغام نیاز دارند: «خواندن رجیستری»، نه «special-case کردن هر ماژول Plugin».

## callbackهای binding گفتگو

Pluginهایی که یک گفتگو را bind می‌کنند می‌توانند وقتی یک approval resolve شد واکنش نشان دهند.

از `api.onConversationBindingResolved(...)` برای دریافت callback پس از approve یا deny شدن
درخواست bind استفاده کنید:

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
- `decision`: `"allow-once"`, `"allow-always"`, یا `"deny"`
- `binding`: binding resolveشده برای درخواست‌های approveشده
- `request`: خلاصه درخواست اصلی، hint مربوط به detach، شناسه sender، و
  فراداده گفتگو

این callback فقط اعلان است. این callback اینکه چه کسی مجاز به bind کردن یک گفتگو
است را تغییر نمی‌دهد، و پس از پایان handling approval در core اجرا می‌شود.

## hookهای runtime مربوط به Provider

Pluginهای Provider سه لایه دارند:

- **فراداده مانیفست** برای lookup ارزان پیش از runtime:
  `setup.providers[].envVars`، سازگاری deprecated `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, و `channelEnvVars`.
- **hookهای زمان پیکربندی**: `catalog` (legacy `discovery`) به‌علاوه
  `applyConfigDefaults`.
- **hookهای runtime**: بیش از 40 hook اختیاری که auth، resolve کردن مدل،
  wrapping استریم، سطح‌های thinking، policy مربوط به replay، و endpointهای usage را پوشش می‌دهند. فهرست کامل را زیر [ترتیب و کاربرد hookها](#hook-order-and-usage) ببینید.

OpenClaw همچنان مالک loop عمومی agent، failover، handling transcript، و
policy ابزار است. این hookها سطح extension برای رفتار ویژه provider هستند،
بدون اینکه به یک transport inference کاملا سفارشی نیاز باشد.

وقتی provider credentialهای مبتنی بر env دارد که مسیرهای عمومی auth/status/model-picker
باید بدون بارگذاری runtime Plugin ببینند، از `setup.providers[].envVars` در مانیفست
استفاده کنید. `providerAuthEnvVars` deprecated همچنان در بازه deprecation توسط
adapter سازگاری خوانده می‌شود، و Pluginهای غیر-bundled که از آن استفاده کنند
diagnostic مانیفست دریافت می‌کنند. وقتی یک شناسه provider باید env varها، auth profileها،
auth مبتنی بر پیکربندی، و گزینه onboarding مربوط به API-key یک شناسه provider دیگر
را دوباره استفاده کند، از `providerAuthAliases` در مانیفست استفاده کنید. وقتی سطح‌های
CLI مربوط به onboarding/auth-choice باید شناسه choice، labelهای گروه، و wiring ساده
auth با یک flag را بدون بارگذاری runtime provider بدانند، از `providerAuthChoices`
در مانیفست استفاده کنید. `envVars` مربوط به runtime provider را برای hintهای
روبه‌روی operator مانند labelهای onboarding یا متغیرهای setup مربوط به OAuth
client-id/client-secret نگه دارید.

وقتی یک channel دارای auth یا setup مبتنی بر env است که fallback عمومی shell-env،
بررسی‌های config/status، یا promptهای setup باید بدون بارگذاری runtime channel ببینند،
از `channelEnvVars` در مانیفست استفاده کنید.

### ترتیب و کاربرد hookها

برای Pluginهای model/provider، OpenClaw hookها را تقریبا به این ترتیب فراخوانی می‌کند.
ستون «چه زمانی استفاده شود» راهنمای تصمیم سریع است.
فیلدهای provider فقط-سازگاری که OpenClaw دیگر فراخوانی نمی‌کند، مانند
`ProviderPlugin.capabilities` و `suppressBuiltInModel`، عمدا اینجا فهرست نشده‌اند.

| #   | هوک                              | کاری که انجام می‌دهد                                                                                                   | زمان استفاده                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | پیکربندی ارائه‌دهنده را هنگام تولید `models.json` در `models.providers` منتشر می‌کند                                | ارائه‌دهنده مالک کاتالوگ یا پیش‌فرض‌های URL پایه است                                                                                                  |
| 2   | `applyConfigDefaults`             | پیش‌فرض‌های پیکربندی سراسری متعلق به ارائه‌دهنده را هنگام مادی‌سازی پیکربندی اعمال می‌کند                                      | پیش‌فرض‌ها به حالت احراز هویت، محیط، یا معناشناسی خانواده مدل ارائه‌دهنده وابسته‌اند                                                                         |
| --  | _(جست‌وجوی داخلی مدل)_         | OpenClaw ابتدا مسیر معمول رجیستری/کاتالوگ را امتحان می‌کند                                                          | _(هوک Plugin نیست)_                                                                                                                         |
| 3   | `normalizeModelId`                | نام‌های مستعار قدیمی یا پیش‌نمایش شناسه مدل را پیش از جست‌وجو نرمال‌سازی می‌کند                                                     | ارائه‌دهنده مالک پاک‌سازی نام مستعار پیش از حل مدل canonical است                                                                                 |
| 4   | `normalizeTransport`              | `api` / `baseUrl` خانواده ارائه‌دهنده را پیش از مونتاژ عمومی مدل نرمال‌سازی می‌کند                                      | ارائه‌دهنده مالک پاک‌سازی ترنسپورت برای شناسه‌های ارائه‌دهنده سفارشی در همان خانواده ترنسپورت است                                                          |
| 5   | `normalizeConfig`                 | `models.providers.<id>` را پیش از حل زمان اجرا/ارائه‌دهنده نرمال‌سازی می‌کند                                           | ارائه‌دهنده به پاک‌سازی پیکربندی نیاز دارد که باید همراه Plugin باشد؛ کمک‌کننده‌های بسته‌بندی‌شده خانواده Google نیز از ورودی‌های پیکربندی پشتیبانی‌شده Google پشتیبانی پشتیبان می‌کنند   |
| 6   | `applyNativeStreamingUsageCompat` | بازنویسی‌های سازگاری مصرف استریمینگ بومی را روی ارائه‌دهندگان پیکربندی اعمال می‌کند                                               | ارائه‌دهنده به اصلاحات فراداده مصرف استریمینگ بومی مبتنی بر endpoint نیاز دارد                                                                          |
| 7   | `resolveConfigApiKey`             | احراز هویت نشانگر محیطی را برای ارائه‌دهندگان پیکربندی، پیش از بارگذاری احراز هویت زمان اجرا، حل می‌کند                                       | ارائه‌دهنده حل کلید API نشانگر محیطی متعلق به خود را دارد؛ `amazon-bedrock` نیز اینجا یک حل‌کننده داخلی نشانگر محیطی AWS دارد                  |
| 8   | `resolveSyntheticAuth`            | احراز هویت محلی/خودمیزبان یا مبتنی بر پیکربندی را بدون پایدارسازی متن ساده آشکار می‌کند                                   | ارائه‌دهنده می‌تواند با یک نشانگر اعتبارنامه مصنوعی/محلی کار کند                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | پروفایل‌های احراز هویت خارجی متعلق به ارائه‌دهنده را روی هم می‌گذارد؛ مقدار پیش‌فرض `persistence` برای اعتبارنامه‌های متعلق به CLI/برنامه `runtime-only` است | ارائه‌دهنده اعتبارنامه‌های احراز هویت خارجی را بدون پایدارسازی توکن‌های نوسازی کپی‌شده دوباره استفاده می‌کند؛ `contracts.externalAuthProviders` را در manifest اعلام کنید |
| 10  | `shouldDeferSyntheticProfileAuth` | جای‌نگهدارهای پروفایل مصنوعی ذخیره‌شده را پشت احراز هویت مبتنی بر محیط/پیکربندی پایین‌تر می‌برد                                      | ارائه‌دهنده پروفایل‌های جای‌نگهدار مصنوعی ذخیره می‌کند که نباید در اولویت برنده شوند                                                                 |
| 11  | `resolveDynamicModel`             | جایگزین همگام برای شناسه‌های مدل متعلق به ارائه‌دهنده که هنوز در رجیستری محلی نیستند                                       | ارائه‌دهنده شناسه‌های مدل upstream دلخواه را می‌پذیرد                                                                                                 |
| 12  | `prepareDynamicModel`             | آماده‌سازی ناهمگام، سپس `resolveDynamicModel` دوباره اجرا می‌شود                                                           | ارائه‌دهنده پیش از حل شناسه‌های ناشناخته به فراداده شبکه نیاز دارد                                                                                  |
| 13  | `normalizeResolvedModel`          | بازنویسی نهایی پیش از اینکه runner جاسازی‌شده از مدل حل‌شده استفاده کند                                               | ارائه‌دهنده به بازنویسی‌های ترنسپورت نیاز دارد اما همچنان از یک ترنسپورت core استفاده می‌کند                                                                             |
| 14  | `contributeResolvedModelCompat`   | پرچم‌های سازگاری را برای مدل‌های فروشنده پشت ترنسپورت سازگار دیگر اضافه می‌کند                                  | ارائه‌دهنده مدل‌های خودش را روی ترنسپورت‌های پراکسی تشخیص می‌دهد، بدون اینکه کنترل ارائه‌دهنده را به دست بگیرد                                                       |
| 15  | `normalizeToolSchemas`            | اسکیماهای ابزار را پیش از اینکه runner جاسازی‌شده آن‌ها را ببیند نرمال‌سازی می‌کند                                                    | ارائه‌دهنده به پاک‌سازی اسکیمای خانواده ترنسپورت نیاز دارد                                                                                                |
| 16  | `inspectToolSchemas`              | عیب‌یابی‌های اسکیمای متعلق به ارائه‌دهنده را پس از نرمال‌سازی آشکار می‌کند                                                  | ارائه‌دهنده هشدارهای کلیدواژه‌ای می‌خواهد، بدون اینکه قوانین ویژه ارائه‌دهنده را به core آموزش دهد                                                                 |
| 17  | `resolveReasoningOutputMode`      | قرارداد خروجی استدلال بومی در برابر برچسب‌خورده را انتخاب می‌کند                                                              | ارائه‌دهنده به استدلال/خروجی نهایی برچسب‌خورده به‌جای فیلدهای بومی نیاز دارد                                                                         |
| 18  | `prepareExtraParams`              | نرمال‌سازی پارامترهای درخواست پیش از wrapperهای عمومی گزینه استریم                                              | ارائه‌دهنده به پارامترهای پیش‌فرض درخواست یا پاک‌سازی پارامترهای ویژه هر ارائه‌دهنده نیاز دارد                                                                           |
| 19  | `createStreamFn`                  | مسیر معمول استریم را کاملا با یک ترنسپورت سفارشی جایگزین می‌کند                                                   | ارائه‌دهنده به پروتکل سیمی سفارشی نیاز دارد، نه فقط یک wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | wrapper استریم پس از اعمال wrapperهای عمومی                                                              | ارائه‌دهنده به wrapperهای سازگاری هدرها/بدنه/مدل درخواست بدون ترنسپورت سفارشی نیاز دارد                                                          |
| 21  | `resolveTransportTurnState`       | هدرها یا فراداده ترنسپورت بومی هر نوبت را متصل می‌کند                                                           | ارائه‌دهنده می‌خواهد ترنسپورت‌های عمومی هویت نوبت بومی ارائه‌دهنده را ارسال کنند                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | هدرهای WebSocket بومی یا سیاست خنک‌سازی نشست را متصل می‌کند                                                    | ارائه‌دهنده می‌خواهد ترنسپورت‌های عمومی WS هدرهای نشست یا سیاست جایگزین را تنظیم کنند                                                               |
| 23  | `formatApiKey`                    | قالب‌ساز پروفایل احراز هویت: پروفایل ذخیره‌شده به رشته زمان اجرای `apiKey` تبدیل می‌شود                                     | ارائه‌دهنده فراداده احراز هویت اضافی ذخیره می‌کند و به شکل توکن زمان اجرای سفارشی نیاز دارد                                                                    |
| 24  | `refreshOAuth`                    | override نوسازی OAuth برای endpointهای نوسازی سفارشی یا سیاست شکست نوسازی                                  | ارائه‌دهنده با نوسازهای مشترک `pi-ai` سازگار نیست                                                                                           |
| 25  | `buildAuthDoctorHint`             | راهنمای تعمیر که هنگام شکست نوسازی OAuth افزوده می‌شود                                                                  | ارائه‌دهنده پس از شکست نوسازی به راهنمای تعمیر احراز هویت متعلق به ارائه‌دهنده نیاز دارد                                                                      |
| 26  | `matchesContextOverflowError`     | matcher سرریز پنجره context متعلق به ارائه‌دهنده                                                                 | ارائه‌دهنده خطاهای خام سرریز دارد که heuristicهای عمومی از دست می‌دهند                                                                                |
| 27  | `classifyFailoverReason`          | دسته‌بندی دلیل failover متعلق به ارائه‌دهنده                                                                  | ارائه‌دهنده می‌تواند خطاهای خام API/ترنسپورت را به محدودیت نرخ/بار بیش از حد/و غیره نگاشت کند                                                                          |
| 28  | `isCacheTtlEligible`              | سیاست prompt-cache برای ارائه‌دهندگان پراکسی/backhaul                                                               | ارائه‌دهنده به gating ویژه پراکسی برای TTL کش نیاز دارد                                                                                                |
| 29  | `buildMissingAuthMessage`         | جایگزینی برای پیام عمومی بازیابی احراز هویت ناموجود                                                      | ارائه‌دهنده به راهنمای بازیابی احراز هویت ناموجود ویژه ارائه‌دهنده نیاز دارد                                                                                 |
| 30  | `augmentModelCatalog`             | ردیف‌های کاتالوگ مصنوعی/نهایی که پس از کشف افزوده می‌شوند                                                          | ارائه‌دهنده در `models list` و انتخاب‌گرها به ردیف‌های مصنوعی سازگاری رو به جلو نیاز دارد                                                                     |
| 31  | `resolveThinkingProfile`          | مجموعه سطح ویژه مدل برای `/think`، برچسب‌های نمایشی، و پیش‌فرض                                                 | ارائه‌دهنده برای مدل‌های منتخب یک نردبان thinking سفارشی یا برچسب دودویی ارائه می‌کند                                                                 |
| 32  | `isBinaryThinking`                | هوک سازگاری کلید روشن/خاموش reasoning                                                                     | ارائه‌دهنده فقط thinking دودویی روشن/خاموش ارائه می‌کند                                                                                                  |
| 33  | `supportsXHighThinking`           | هوک سازگاری پشتیبانی از reasoning با `xhigh`                                                                   | ارائه‌دهنده `xhigh` را فقط روی زیرمجموعه‌ای از مدل‌ها می‌خواهد                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | هوک سازگاری سطح پیش‌فرض `/think`                                                                      | ارائه‌دهنده مالک سیاست پیش‌فرض `/think` برای یک خانواده مدل است                                                                                      |
| 35  | `isModernModelRef`                | matcher مدل مدرن برای فیلترهای پروفایل live و انتخاب smoke                                              | ارائه‌دهنده مالک تطبیق مدل ترجیحی live/smoke است                                                                                             |
| 36  | `prepareRuntimeAuth`              | یک اعتبارنامه پیکربندی‌شده را درست پیش از inference به توکن/کلید واقعی زمان اجرا تبدیل می‌کند                       | ارائه‌دهنده به تبادل توکن یا اعتبارنامه درخواست کوتاه‌عمر نیاز دارد                                                                             |
| 37  | `resolveUsageAuth`                | اعتبارنامه‌های استفاده/صورت‌حساب را برای `/usage` و سطوح وضعیت مرتبط حل می‌کند                                     | ارائه‌دهنده به تجزیهٔ سفارشی توکن استفاده/سهمیه یا اعتبارنامهٔ متفاوتی برای استفاده نیاز دارد                                                               |
| 38  | `fetchUsageSnapshot`              | پس از حل شدن احراز هویت، نماهای لحظه‌ای استفاده/سهمیهٔ ویژهٔ ارائه‌دهنده را دریافت و نرمال‌سازی می‌کند                             | ارائه‌دهنده به نقطهٔ پایانی استفادهٔ ویژهٔ ارائه‌دهنده یا تجزیه‌گر payload نیاز دارد                                                                           |
| 39  | `createEmbeddingProvider`         | یک آداپتر تعبیهٔ متعلق به ارائه‌دهنده برای حافظه/جست‌وجو می‌سازد                                                     | رفتار تعبیهٔ حافظه به Plugin ارائه‌دهنده تعلق دارد                                                                                    |
| 40  | `buildReplayPolicy`               | سیاست بازپخشی را برمی‌گرداند که مدیریت رونوشت را برای ارائه‌دهنده کنترل می‌کند                                        | ارائه‌دهنده به سیاست سفارشی رونوشت نیاز دارد (برای مثال، حذف بلوک‌های تفکر)                                                               |
| 41  | `sanitizeReplayHistory`           | تاریخچهٔ بازپخش را پس از پاک‌سازی عمومی رونوشت بازنویسی می‌کند                                                        | ارائه‌دهنده به بازنویسی‌های بازپخش ویژهٔ ارائه‌دهنده، فراتر از کمک‌تابع‌های مشترک Compaction، نیاز دارد                                                             |
| 42  | `validateReplayTurns`             | اعتبارسنجی نهایی نوبت‌های بازپخش یا شکل‌دهی دوبارهٔ آن‌ها پیش از اجراکنندهٔ تعبیه‌شده                                           | انتقال ارائه‌دهنده پس از پاک‌سازی عمومی به اعتبارسنجی سخت‌گیرانه‌تر نوبت‌ها نیاز دارد                                                                    |
| 43  | `onModelSelected`                 | عوارض جانبی پس از انتخاب را که متعلق به ارائه‌دهنده است اجرا می‌کند                                                                 | ارائه‌دهنده هنگام فعال شدن یک مدل به دورسنجی یا وضعیت متعلق به ارائه‌دهنده نیاز دارد                                                                  |

`normalizeModelId`، `normalizeTransport` و `normalizeConfig` ابتدا Plugin ارائه‌دهندهٔ
مطابق را بررسی می‌کنند، سپس به دیگر Pluginهای ارائه‌دهندهٔ دارای hook عبور می‌کنند
تا زمانی که یکی واقعاً شناسهٔ مدل یا transport/config را تغییر دهد. این کار باعث می‌شود
shimهای ارائه‌دهندهٔ alias/compat بدون نیاز به این‌که فراخواننده بداند کدام Plugin
بسته‌بندی‌شده مالک بازنویسی است، کار کنند. اگر هیچ hook ارائه‌دهنده‌ای یک ورودی
پیکربندی پشتیبانی‌شده از خانوادهٔ Google را بازنویسی نکند، نرمال‌ساز پیکربندی Google
بسته‌بندی‌شده همچنان آن پاک‌سازی سازگاری را اعمال می‌کند.

اگر ارائه‌دهنده به یک پروتکل سیمی کاملاً سفارشی یا executor درخواست سفارشی نیاز داشته
باشد، آن یک کلاس متفاوت از extension است. این hookها برای رفتار ارائه‌دهنده‌ای هستند
که همچنان روی حلقهٔ inference عادی OpenClaw اجرا می‌شود.

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

Pluginهای ارائه‌دهندهٔ بسته‌بندی‌شده hookهای بالا را ترکیب می‌کنند تا با catalog،
auth، thinking، replay و نیازهای usage هر vendor سازگار شوند. مجموعهٔ معتبر hookها
کنار هر Plugin در `extensions/` قرار دارد؛ این صفحه شکل‌ها را نشان می‌دهد، نه این‌که
فهرست را عیناً بازتاب دهد.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter، Kilocode، Z.AI و xAI‏ `catalog` به‌همراه
    `resolveDynamicModel` / `prepareDynamicModel` را ثبت می‌کنند تا بتوانند شناسه‌های
    مدل upstream را پیش از catalog ایستای OpenClaw نمایان کنند.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot، Gemini CLI، ChatGPT Codex، MiniMax، Xiaomi و z.ai
    `prepareRuntimeAuth` یا `formatApiKey` را با `resolveUsageAuth` +
    `fetchUsageSnapshot` جفت می‌کنند تا مالک exchange توکن و یکپارچه‌سازی `/usage`
    باشند.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    خانواده‌های نام‌دار مشترک (`google-gemini`، `passthrough-gemini`،
    `anthropic-by-model`، `hybrid-anthropic-openai`) به ارائه‌دهندگان اجازه می‌دهند
    از طریق `buildReplayPolicy` وارد سیاست transcript شوند، به‌جای این‌که هر Plugin
    پاک‌سازی را دوباره پیاده‌سازی کند.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`، `cloudflare-ai-gateway`، `huggingface`، `kimi-coding`، `nvidia`،
    `qianfan`، `synthetic`، `together`، `venice`، `vercel-ai-gateway` و
    `volcengine` فقط `catalog` را ثبت می‌کنند و از حلقهٔ inference مشترک استفاده می‌کنند.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    headerهای بتا، `/fast` / `serviceTier` و `context1m` داخل seam عمومی
    `api.ts` / `contract-api.ts` مربوط به Plugin‏ Anthropic قرار دارند
    (`wrapAnthropicProviderStream`، `resolveAnthropicBetas`،
    `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`) و نه در SDK عمومی.
  </Accordion>
</AccordionGroup>

## کمک‌تابع‌های زمان اجرا

Pluginها می‌توانند از طریق `api.runtime` به کمک‌تابع‌های منتخب core دسترسی داشته باشند. برای TTS:

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

- `textToSpeech` payload خروجی TTS عادی core را برای سطح‌های فایل/voice-note برمی‌گرداند.
- از پیکربندی core‏ `messages.tts` و انتخاب ارائه‌دهنده استفاده می‌کند.
- بافر صوتی PCM + نرخ نمونه‌برداری را برمی‌گرداند. Pluginها باید برای ارائه‌دهندگان resample/encode کنند.
- `listVoices` برای هر ارائه‌دهنده اختیاری است. از آن برای voice pickerهای مالک vendor یا جریان‌های setup استفاده کنید.
- فهرست‌های صدا می‌توانند metadata غنی‌تری مانند locale، gender و personality tagها برای pickerهای آگاه به ارائه‌دهنده داشته باشند.
- OpenAI و ElevenLabs امروز از telephony پشتیبانی می‌کنند. Microsoft پشتیبانی نمی‌کند.

Pluginها همچنین می‌توانند ارائه‌دهندگان speech را از طریق `api.registerSpeechProvider(...)` ثبت کنند.

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

- سیاست TTS، fallback و تحویل reply را در core نگه دارید.
- از ارائه‌دهندگان speech برای رفتار synthesis مالک vendor استفاده کنید.
- ورودی قدیمی Microsoft‏ `edge` به شناسهٔ ارائه‌دهندهٔ `microsoft` نرمال‌سازی می‌شود.
- مدل مالکیت ترجیحی شرکت‌محور است: یک Plugin متعلق به vendor می‌تواند مالک
  ارائه‌دهندگان text، speech، image و رسانه‌های آینده باشد، همان‌طور که OpenClaw آن
  قراردادهای capability را اضافه می‌کند.

برای درک image/audio/video، Pluginها به‌جای یک کیسهٔ عمومی key/value، یک
ارائه‌دهندهٔ media-understanding تایپ‌شده ثبت می‌کنند:

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

- orchestration، fallback، config و سیم‌کشی channel را در core نگه دارید.
- رفتار vendor را در Plugin ارائه‌دهنده نگه دارید.
- گسترش افزایشی باید تایپ‌شده بماند: متدهای اختیاری جدید، فیلدهای نتیجهٔ اختیاری جدید،
  capabilityهای اختیاری جدید.
- تولید ویدیو از پیش همین الگو را دنبال می‌کند:
  - core مالک قرارداد capability و کمک‌تابع زمان اجرا است
  - Pluginهای vendor‏ `api.registerVideoGenerationProvider(...)` را ثبت می‌کنند
  - Pluginهای feature/channel از `api.runtime.videoGeneration.*` استفاده می‌کنند

برای کمک‌تابع‌های زمان اجرای media-understanding، Pluginها می‌توانند فراخوانی کنند:

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
```

برای transcription صوتی، Pluginها می‌توانند یا از زمان اجرای media-understanding
یا از alias قدیمی‌تر STT استفاده کنند:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

نکته‌ها:

- `api.runtime.mediaUnderstanding.*` سطح مشترک ترجیحی برای درک
  image/audio/video است.
- از پیکربندی صوتی media-understanding در core (`tools.media.audio`) و ترتیب fallback ارائه‌دهنده استفاده می‌کند.
- وقتی هیچ خروجی transcription تولید نشود، `{ text: undefined }` را برمی‌گرداند (مثلاً ورودی ردشده/پشتیبانی‌نشده).
- `api.runtime.stt.transcribeAudioFile(...)` به‌عنوان alias سازگاری باقی می‌ماند.

Pluginها همچنین می‌توانند اجرای subagentهای پس‌زمینه را از طریق `api.runtime.subagent` راه‌اندازی کنند:

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

- `provider` و `model` overrideهای اختیاری per-run هستند، نه تغییرات persistent session.
- OpenClaw این فیلدهای override را فقط برای فراخواننده‌های trusted رعایت می‌کند.
- برای اجراهای fallback مالک Plugin، operatorها باید با `plugins.entries.<id>.subagent.allowModelOverride: true` opt in کنند.
- از `plugins.entries.<id>.subagent.allowedModels` برای محدود کردن Pluginهای trusted به هدف‌های canonical مشخص `provider/model`، یا از `"*"` برای اجازه دادن صریح به هر هدفی استفاده کنید.
- اجرای subagent توسط Pluginهای untrusted همچنان کار می‌کند، اما درخواست‌های override به‌جای fallback بی‌صدا رد می‌شوند.
- sessionهای subagent ساخته‌شده توسط Plugin با شناسهٔ Plugin سازنده tag می‌شوند. Fallback‏ `api.runtime.subagent.deleteSession(...)` فقط می‌تواند همان sessionهای مالک را حذف کند؛ حذف arbitrary session همچنان به درخواست Gateway با scope ادمین نیاز دارد.

برای جست‌وجوی وب، Pluginها می‌توانند به‌جای ورود به سیم‌کشی tool عامل، از کمک‌تابع زمان اجرای مشترک استفاده کنند:

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

Pluginها همچنین می‌توانند ارائه‌دهندگان web-search را از طریق
`api.registerWebSearchProvider(...)` ثبت کنند.

نکته‌ها:

- انتخاب ارائه‌دهنده، credential resolution و semantics درخواست مشترک را در core نگه دارید.
- از ارائه‌دهندگان web-search برای transportهای جست‌وجوی خاص vendor استفاده کنید.
- `api.runtime.webSearch.*` سطح مشترک ترجیحی برای Pluginهای feature/channel است که بدون وابستگی به wrapper ابزار عامل به رفتار جست‌وجو نیاز دارند.

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

- `generate(...)`: تولید یک تصویر با استفاده از زنجیرهٔ ارائه‌دهندهٔ image-generation پیکربندی‌شده.
- `listProviders(...)`: فهرست کردن ارائه‌دهندگان image-generation موجود و capabilityهای آن‌ها.

## مسیرهای HTTP‏ Gateway

Pluginها می‌توانند endpointهای HTTP را با `api.registerHttpRoute(...)` expose کنند.

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

فیلدهای route:

- `path`: مسیر route زیر سرور HTTP‏ gateway.
- `auth`: ضروری است. از `"gateway"` برای الزام auth عادی gateway، یا از `"plugin"` برای auth/تأیید Webhook مدیریت‌شده توسط Plugin استفاده کنید.
- `match`: اختیاری. `"exact"` (پیش‌فرض) یا `"prefix"`.
- `replaceExisting`: اختیاری. به همان Plugin اجازه می‌دهد ثبت route موجود خودش را جایگزین کند.
- `handler`: وقتی route درخواست را handle کرد، `true` برگردانید.

نکته‌ها:

- `api.registerHttpHandler(...)` حذف شده است و باعث خطای بارگذاری Plugin می‌شود. به‌جای آن از `api.registerHttpRoute(...)` استفاده کنید.
- مسیرهای Plugin باید `auth` را به‌صورت صریح اعلام کنند.
- تداخل‌های دقیق `path + match` رد می‌شوند مگر اینکه `replaceExisting: true` باشد، و یک Plugin نمی‌تواند مسیر Plugin دیگری را جایگزین کند.
- مسیرهای هم‌پوشان با سطوح متفاوت `auth` رد می‌شوند. زنجیره‌های عبور `exact`/`prefix` را فقط در همان سطح auth نگه دارید.
- مسیرهای `auth: "plugin"` به‌صورت خودکار scopeهای runtime اپراتور را دریافت **نمی‌کنند**. این مسیرها برای وبهوک‌های مدیریت‌شده توسط Plugin/اعتبارسنجی امضا هستند، نه فراخوانی‌های کمکی ممتاز Gateway.
- مسیرهای `auth: "gateway"` داخل scope runtime درخواست Gateway اجرا می‌شوند، اما آن scope عمدا محافظه‌کارانه است:
  - احراز هویت bearer با secret مشترک (`gateway.auth.mode = "token"` / `"password"`) scopeهای runtime مسیر Plugin را روی `operator.write` ثابت نگه می‌دارد، حتی اگر فراخواننده `x-openclaw-scopes` را بفرستد
  - حالت‌های HTTP دارای هویت مورد اعتماد (برای مثال `trusted-proxy` یا `gateway.auth.mode = "none"` روی ingress خصوصی) فقط وقتی header به‌صورت صریح وجود داشته باشد، `x-openclaw-scopes` را رعایت می‌کنند
  - اگر `x-openclaw-scopes` در آن درخواست‌های مسیر Plugin دارای هویت وجود نداشته باشد، scope runtime به `operator.write` برمی‌گردد
- قاعده عملی: فرض نکنید یک مسیر Plugin با احراز هویت gateway یک سطح admin ضمنی است. اگر مسیر شما به رفتار فقط مخصوص admin نیاز دارد، یک حالت احراز هویت دارای هویت را الزامی کنید و قرارداد صریح header `x-openclaw-scopes` را مستند کنید.

## مسیرهای import در SDK مربوط به Plugin

هنگام نوشتن Pluginهای جدید، به‌جای barrel ریشه یکپارچه `openclaw/plugin-sdk` از زیرمسیرهای محدود SDK استفاده کنید. زیرمسیرهای اصلی:

| زیرمسیر                             | هدف                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | سازه‌های اولیه ثبت Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | helperهای entry/build کانال                        |
| `openclaw/plugin-sdk/core`          | helperهای مشترک عمومی و قرارداد umbrella       |
| `openclaw/plugin-sdk/config-schema` | schema مربوط به Zod برای ریشه `openclaw.json` (`OpenClawSchema`) |

Pluginهای کانال از خانواده‌ای از seamهای محدود انتخاب می‌کنند: `channel-setup`،
`setup-runtime`، `setup-adapter-runtime`، `setup-tools`، `channel-pairing`،
`channel-contract`، `channel-feedback`، `channel-inbound`، `channel-lifecycle`،
`channel-reply-pipeline`، `command-auth`، `secret-input`، `webhook-ingress`،
`channel-targets`، و `channel-actions`. رفتار approval باید روی یک قرارداد
`approvalCapability` یکپارچه شود، نه اینکه میان fieldهای نامرتبط Plugin
مخلوط شود. [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.

helperهای runtime و config زیر زیرمسیرهای متمرکز و متناظر `*-runtime` قرار دارند
(`approval-runtime`، `agent-runtime`، `lazy-runtime`، `directory-runtime`،
`text-runtime`، `runtime-store`، `system-event-runtime`، `heartbeat-runtime`،
`channel-activity-runtime`، و غیره). به‌جای barrel سازگاری گسترده `config-runtime`،
`config-types`، `plugin-config-runtime`، `runtime-config-snapshot`، و `config-mutation`
را ترجیح دهید.

<Info>
`openclaw/plugin-sdk/channel-runtime`، `openclaw/plugin-sdk/config-runtime`،
و `openclaw/plugin-sdk/infra-runtime` shimهای سازگاری منسوخ برای
Pluginهای قدیمی‌تر هستند. کد جدید باید به‌جای آن سازه‌های اولیه عمومی محدودتر را import کند.
</Info>

نقاط ورود داخلی repo (برای ریشه package هر Plugin باندل‌شده):

- `index.js` — entry مربوط به Plugin باندل‌شده
- `api.js` — barrel مربوط به helperها/types
- `runtime-api.js` — barrel فقط مخصوص runtime
- `setup-entry.js` — entry مربوط به setup Plugin

Pluginهای خارجی فقط باید زیرمسیرهای `openclaw/plugin-sdk/*` را import کنند. هرگز
`src/*` مربوط به package یک Plugin دیگر را از core یا از Plugin دیگر import نکنید.
نقاط ورود بارگذاری‌شده از طریق facade، وقتی snapshot فعال config مربوط به runtime
وجود داشته باشد آن را ترجیح می‌دهند، سپس به فایل config resolveشده روی دیسک fallback می‌کنند.

زیرمسیرهای اختصاصی capability مانند `image-generation`، `media-understanding`،
و `speech` وجود دارند چون Pluginهای باندل‌شده امروز از آن‌ها استفاده می‌کنند. آن‌ها
به‌صورت خودکار قراردادهای خارجی بلندمدت و ثابت نیستند؛ هنگام اتکا به آن‌ها،
صفحه مرجع SDK مربوطه را بررسی کنید.

## schemaهای ابزار پیام

Pluginها باید سهم schema مخصوص کانال در `describeMessageTool(...)` را برای
سازه‌های اولیه غیرپیامی مانند واکنش‌ها، خواندن‌ها، و pollها مالک شوند.
نمایش مشترک ارسال باید به‌جای fieldهای دکمه، component، block، یا card بومی provider،
از قرارداد عمومی `MessagePresentation` استفاده کند.
برای قرارداد، قواعد fallback، نگاشت provider، و checklist نویسنده Plugin،
[نمایش پیام](/fa/plugins/message-presentation) را ببینید.

Pluginهای دارای قابلیت ارسال اعلام می‌کنند که از طریق قابلیت‌های پیام چه چیزی را می‌توانند render کنند:

- `presentation` برای blockهای نمایش معنایی (`text`، `context`، `divider`، `buttons`، `select`)
- `delivery-pin` برای درخواست‌های تحویل pinشده

Core تصمیم می‌گیرد نمایش را به‌صورت بومی render کند یا آن را به متن تنزل دهد.
escape hatchهای UI بومی provider را از ابزار پیام عمومی expose نکنید.
helperهای SDK منسوخ برای schemaهای بومی قدیمی همچنان برای Pluginهای third-party
موجود export می‌شوند، اما Pluginهای جدید نباید از آن‌ها استفاده کنند.

## resolve کردن target کانال

Pluginهای کانال باید معناشناسی target مخصوص کانال را مالک شوند. میزبان outbound
مشترک را عمومی نگه دارید و از سطح adapter پیام‌رسانی برای قواعد provider استفاده کنید:

- `messaging.inferTargetChatType({ to })` تصمیم می‌گیرد که یک target نرمال‌شده
  پیش از lookup در directory باید به‌عنوان `direct`، `group`، یا `channel` در نظر گرفته شود.
- `messaging.targetResolver.looksLikeId(raw, normalized)` به core می‌گوید که آیا یک
  ورودی باید به‌جای جست‌وجوی directory، مستقیم به resolve شبیه id برود یا نه.
- `messaging.targetResolver.resolveTarget(...)` fallback مربوط به Plugin است وقتی
  core پس از normalization یا پس از miss در directory به resolve نهایی مالک provider نیاز دارد.
- `messaging.resolveOutboundSessionRoute(...)` پس از resolve شدن target، ساخت مسیر session
  مخصوص provider را مالک می‌شود.

تقسیم‌بندی پیشنهادی:

- از `inferTargetChatType` برای تصمیم‌های category استفاده کنید که باید پیش از
  جست‌وجوی peers/groups انجام شوند.
- از `looksLikeId` برای بررسی‌های «این را به‌عنوان id صریح/بومی target در نظر بگیر» استفاده کنید.
- از `resolveTarget` برای fallback normalization مخصوص provider استفاده کنید، نه برای
  جست‌وجوی گسترده directory.
- idهای بومی provider مانند chat idها، thread idها، JIDها، handleها، و room
  idها را داخل مقدارهای `target` یا پارامترهای مخصوص provider نگه دارید، نه در fieldهای عمومی SDK.

## directoryهای متکی به config

Pluginهایی که entryهای directory را از config استخراج می‌کنند باید آن logic را در
Plugin نگه دارند و از helperهای مشترک
`openclaw/plugin-sdk/directory-runtime` دوباره استفاده کنند.

از این مورد زمانی استفاده کنید که یک کانال به peers/groups متکی به config نیاز دارد، مانند:

- peerهای DM مبتنی بر allowlist
- mapهای کانال/گروه پیکربندی‌شده
- fallbackهای directory ایستای محدود به account

helperهای مشترک در `directory-runtime` فقط عملیات عمومی را مدیریت می‌کنند:

- فیلتر کردن query
- اعمال limit
- helperهای deduping/normalization
- ساخت `ChannelDirectoryEntry[]`

بازرسی account مخصوص کانال و normalization مربوط به id باید در پیاده‌سازی
Plugin باقی بماند.

## catalogهای provider

Pluginهای provider می‌توانند catalogهای model را برای inference با
`registerProvider({ catalog: { run(...) { ... } } })` تعریف کنند.

`catalog.run(...)` همان شکلی را برمی‌گرداند که OpenClaw در
`models.providers` می‌نویسد:

- `{ provider }` برای یک entry مربوط به provider
- `{ providers }` برای چند entry مربوط به provider

وقتی Plugin مالک model idهای مخصوص provider، پیش‌فرض‌های base URL،
یا metadata مدل محدودشده با auth است، از `catalog` استفاده کنید.

`catalog.order` کنترل می‌کند catalog یک Plugin چه زمانی نسبت به providerهای ضمنی
داخلی OpenClaw ادغام شود:

- `simple`: providerهای ساده مبتنی بر API-key یا env
- `profile`: providerهایی که وقتی auth profileها وجود دارند ظاهر می‌شوند
- `paired`: providerهایی که چند entry مربوط و مرتبط به provider را synthesize می‌کنند
- `late`: آخرین pass، پس از سایر providerهای ضمنی

providerهای بعدی در برخورد key برنده می‌شوند، بنابراین Pluginها می‌توانند عمدا
یک entry provider داخلی را با همان provider id override کنند.

سازگاری:

- `discovery` همچنان به‌عنوان alias قدیمی کار می‌کند
- اگر هر دو `catalog` و `discovery` ثبت شده باشند، OpenClaw از `catalog` استفاده می‌کند

## بازرسی فقط خواندنی کانال

اگر Plugin شما یک کانال ثبت می‌کند، پیاده‌سازی
`plugin.config.inspectAccount(cfg, accountId)` را در کنار `resolveAccount(...)` ترجیح دهید.

چرا:

- `resolveAccount(...)` مسیر runtime است. مجاز است فرض کند credentialها
  کاملا materialize شده‌اند و می‌تواند وقتی secretهای لازم وجود ندارند سریع fail کند.
- مسیرهای command فقط خواندنی مانند `openclaw status`، `openclaw status --all`،
  `openclaw channels status`، `openclaw channels resolve`، و جریان‌های repair مربوط به doctor/config
  نباید فقط برای توصیف configuration نیاز داشته باشند credentialهای runtime را materialize کنند.

رفتار پیشنهادی `inspectAccount(...)`:

- فقط وضعیت توصیفی account را برگردانید.
- `enabled` و `configured` را حفظ کنید.
- fieldهای منبع/وضعیت credential را هنگام مرتبط بودن شامل کنید، مانند:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- لازم نیست فقط برای گزارش availability فقط خواندنی، مقدارهای خام token را برگردانید.
  برگرداندن `tokenStatus: "available"` (و field منبع متناظر)
  برای commandهای سبک status کافی است.
- وقتی یک credential از طریق SecretRef پیکربندی شده اما در مسیر command فعلی
  unavailable است، از `configured_unavailable` استفاده کنید.

این کار به commandهای فقط خواندنی اجازه می‌دهد به‌جای crash کردن یا گزارش اشتباه
account به‌عنوان پیکربندی‌نشده، «پیکربندی‌شده اما در این مسیر command unavailable» را گزارش کنند.

## packهای package

یک directory مربوط به Plugin ممکن است شامل `package.json` با `openclaw.extensions` باشد:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

هر entry به یک Plugin تبدیل می‌شود. اگر pack چند extension را فهرست کند، plugin id
به `name/<fileBase>` تبدیل می‌شود.

اگر Plugin شما npm deps را import می‌کند، آن‌ها را در همان directory نصب کنید تا
`node_modules` در دسترس باشد (`npm install` / `pnpm install`).

guardrail امنیتی: هر entry مربوط به `openclaw.extensions` باید پس از resolve شدن symlink
داخل directory Plugin باقی بماند. entryهایی که از directory package خارج شوند
رد می‌شوند.

نکته امنیتی: `openclaw plugins install` وابستگی‌های Plugin را با یک
`npm install --omit=dev --ignore-scripts` محلی پروژه نصب می‌کند (بدون lifecycle scriptها،
بدون وابستگی‌های dev در runtime)، و تنظیمات global ارث‌بری‌شده npm install را نادیده می‌گیرد.
درخت‌های وابستگی Plugin را «pure JS/TS» نگه دارید و از packageهایی که به
buildهای `postinstall` نیاز دارند دوری کنید.

اختیاری: `openclaw.setupEntry` می‌تواند به یک module سبک فقط مخصوص setup اشاره کند.
وقتی OpenClaw به سطح‌های setup برای یک Plugin کانال disabled نیاز دارد، یا
وقتی یک Plugin کانال enabled است اما هنوز unconfigured مانده، `setupEntry`
را به‌جای entry کامل Plugin بارگذاری می‌کند. این کار startup و setup را سبک‌تر نگه می‌دارد
وقتی entry اصلی Plugin شما همچنین tools، hooks، یا کد دیگر فقط مخصوص runtime را wire می‌کند.

اختیاری: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
می‌تواند یک Plugin کانال را حتی وقتی کانال از قبل configured است، در مرحله startup
پیش از listen کردن gateway وارد همان مسیر `setupEntry` کند.

از این فقط زمانی استفاده کنید که `setupEntry` سطح startup لازم پیش از شروع listen کردن
gateway را به‌طور کامل پوشش می‌دهد. در عمل، یعنی entry مربوط به setup
باید هر capability مالک کانال را که startup به آن وابسته است ثبت کند، مانند:

- خود ثبت کانال
- هر مسیر HTTP که باید پیش از شروع listen کردن gateway در دسترس باشد
- هر method، tool، یا service مربوط به gateway که باید در همان window وجود داشته باشد

اگر entry کامل شما همچنان مالک هر capability ضروری startup است، این flag را فعال نکنید.
Plugin را روی رفتار پیش‌فرض نگه دارید و اجازه دهید OpenClaw entry کامل را
در طول startup بارگذاری کند.

کانال‌های باندل‌شده همچنین می‌توانند helperهای contract-surface فقط مخصوص setup منتشر کنند که core
می‌تواند پیش از بارگذاری runtime کامل کانال از آن‌ها consult کند. سطح promotion مربوط به setup فعلی این است:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core هنگامی از این سطح استفاده می‌کند که لازم باشد پیکربندی یک کانال تک‌حسابی قدیمی را بدون بارگذاری ورودی کامل Plugin، به `channels.<id>.accounts.*` ارتقا دهد. Matrix نمونه فعلی بسته‌بندی‌شده است: وقتی حساب‌های نام‌گذاری‌شده از قبل وجود داشته باشند، فقط کلیدهای احراز هویت/راه‌اندازی را به یک حساب ارتقایافته نام‌گذاری‌شده منتقل می‌کند، و می‌تواند به‌جای اینکه همیشه `accounts.default` بسازد، یک کلید حساب پیش‌فرض غیرمتعارف پیکربندی‌شده را حفظ کند.

آن آداپتورهای وصله راه‌اندازی، کشف سطح قرارداد بسته‌بندی‌شده را lazy نگه می‌دارند. زمان import سبک می‌ماند؛ سطح ارتقا فقط در نخستین استفاده بارگذاری می‌شود، نه اینکه هنگام import ماژول دوباره وارد راه‌اندازی کانال بسته‌بندی‌شده شود.

وقتی آن سطوح راه‌اندازی شامل متدهای RPC مربوط به gateway هستند، آن‌ها را روی یک پیشوند اختصاصی Plugin نگه دارید. فضاهای نام مدیریتی Core (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) رزرو‌شده می‌مانند و همیشه به `operator.admin` resolve می‌شوند، حتی اگر یک Plugin دامنه محدودتری درخواست کند.

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

Pluginهای کانال می‌توانند فراداده راه‌اندازی/کشف را از طریق `openclaw.channel` و راهنمای نصب را از طریق `openclaw.install` اعلام کنند. این کار داده‌های کاتالوگ را از Core جدا نگه می‌دارد.

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

- `detailLabel`: برچسب ثانویه برای سطوح غنی‌تر کاتالوگ/وضعیت
- `docsLabel`: بازنویسی متن لینک برای لینک مستندات
- `preferOver`: شناسه‌های Plugin/کانال با اولویت پایین‌تر که این ورودی کاتالوگ باید از آن‌ها بالاتر قرار بگیرد
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: کنترل‌های متن سطح انتخاب
- `markdownCapable`: کانال را برای تصمیم‌های قالب‌بندی خروجی، دارای قابلیت markdown علامت‌گذاری می‌کند
- `exposure.configured`: وقتی روی `false` تنظیم شود، کانال را از سطوح فهرست کانال‌های پیکربندی‌شده پنهان می‌کند
- `exposure.setup`: وقتی روی `false` تنظیم شود، کانال را از انتخاب‌گرهای تعاملی راه‌اندازی/پیکربندی پنهان می‌کند
- `exposure.docs`: کانال را برای سطوح ناوبری مستندات، داخلی/خصوصی علامت‌گذاری می‌کند
- `showConfigured` / `showInSetup`: aliasهای قدیمی که هنوز برای سازگاری پذیرفته می‌شوند؛ `exposure` را ترجیح دهید
- `quickstartAllowFrom`: کانال را وارد جریان استاندارد quickstart با `allowFrom` می‌کند
- `forceAccountBinding`: حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند
- `preferSessionLookupForAnnounceTarget`: هنگام resolve کردن مقصدهای اعلان، جست‌وجوی نشست را ترجیح می‌دهد

OpenClaw همچنین می‌تواند **کاتالوگ‌های کانال خارجی** را ادغام کند؛ برای مثال، خروجی رجیستری MPM. یک فایل JSON را در یکی از این مسیرها قرار دهید:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

یا `OPENCLAW_PLUGIN_CATALOG_PATHS` (یا `OPENCLAW_MPM_CATALOG_PATHS`) را به یک یا چند فایل JSON اشاره دهید (جداشده با ویرگول/نقطه‌ویرگول/`PATH`). هر فایل باید شامل `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` باشد. parser همچنین `"packages"` یا `"plugins"` را به‌عنوان aliasهای قدیمی برای کلید `"entries"` می‌پذیرد.

ورودی‌های تولیدشده کاتالوگ کانال و ورودی‌های کاتالوگ نصب provider، واقعیت‌های normalize‌شده منبع نصب را کنار بلوک خام `openclaw.install` در دسترس می‌گذارند. این واقعیت‌های normalize‌شده مشخص می‌کنند که آیا spec مربوط به npm یک نسخه دقیق است یا selector شناور، آیا فراداده integrity مورد انتظار وجود دارد، و آیا مسیر منبع محلی هم در دسترس است یا نه. وقتی هویت کاتالوگ/بسته شناخته‌شده باشد، اگر نام بسته npm تجزیه‌شده از آن هویت منحرف شود، واقعیت‌های normalize‌شده هشدار می‌دهند. همچنین وقتی `defaultChoice` نامعتبر باشد یا به منبعی اشاره کند که در دسترس نیست، و وقتی فراداده integrity مربوط به npm بدون یک منبع معتبر npm وجود داشته باشد، هشدار می‌دهند. مصرف‌کنندگان باید `installSource` را به‌عنوان یک فیلد اختیاری افزایشی در نظر بگیرند تا ورودی‌های دستی و shimهای کاتالوگ مجبور نباشند آن را تولید کنند.
این کار به onboarding و diagnostics اجازه می‌دهد بدون import کردن runtime Plugin، وضعیت صفحه منبع را توضیح دهند.

ورودی‌های رسمی خارجی npm باید یک `npmSpec` دقیق همراه با `expectedIntegrity` را ترجیح دهند. نام‌های ساده بسته و dist-tagها همچنان برای سازگاری کار می‌کنند، اما هشدارهای صفحه منبع را نمایش می‌دهند تا کاتالوگ بتواند بدون شکستن Pluginهای موجود، به سمت نصب‌های pin‌شده و بررسی‌شده با integrity حرکت کند. وقتی onboarding از یک مسیر کاتالوگ محلی نصب می‌کند، یک ورودی شاخص Plugin مدیریت‌شده با `source: "path"` و در صورت امکان یک `sourcePath` نسبی به workspace ثبت می‌کند. مسیر عملیاتی مطلق بارگذاری در `plugins.load.paths` باقی می‌ماند؛ رکورد نصب از تکرار مسیرهای workstation محلی در پیکربندی بلندمدت جلوگیری می‌کند. این کار نصب‌های توسعه محلی را برای diagnostics صفحه منبع قابل مشاهده نگه می‌دارد، بدون اینکه یک سطح افشای دوم برای مسیر خام filesystem اضافه کند. شاخص Plugin پایدارشده `plugins/installs.json` منبع حقیقت نصب است و می‌تواند بدون بارگذاری ماژول‌های runtime Plugin بازسازی شود. map مربوط به `installRecords` حتی وقتی manifest یک Plugin وجود ندارد یا نامعتبر است، پایدار می‌ماند؛ آرایه `plugins` آن یک نمای manifest قابل بازسازی است.

## Pluginهای موتور زمینه

Pluginهای موتور زمینه مالک orchestration زمینه نشست برای ingest، assembly و Compaction هستند. آن‌ها را از Plugin خود با `api.registerContextEngine(id, factory)` ثبت کنید، سپس موتور فعال را با `plugins.slots.contextEngine` انتخاب کنید.

وقتی Plugin شما لازم دارد pipeline پیش‌فرض زمینه را جایگزین یا گسترش دهد، به‌جای اینکه فقط جست‌وجوی memory یا hook اضافه کند، از این استفاده کنید.

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

factory با نام `ctx` مقادیر اختیاری `config`، `agentDir` و `workspaceDir` را برای مقداردهی اولیه هنگام ساخت در دسترس می‌گذارد.

اگر موتور شما مالک الگوریتم Compaction نیست، `compact()` را پیاده‌سازی‌شده نگه دارید و آن را صریحا delegate کنید:

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

## افزودن یک capability جدید

وقتی یک Plugin به رفتاری نیاز دارد که با API فعلی سازگار نیست، سیستم Plugin را با یک دسترسی خصوصی دور نزنید. capability گمشده را اضافه کنید.

ترتیب پیشنهادی:

1. قرارداد Core را تعریف کنید
   تصمیم بگیرید Core باید مالک چه رفتار مشترکی باشد: policy، fallback، merge پیکربندی، lifecycle، semantics رو‌به‌کانال و شکل helper مربوط به runtime.
2. سطوح ثبت/runtime تایپ‌شده Plugin را اضافه کنید
   `OpenClawPluginApi` و/یا `api.runtime` را با کوچک‌ترین سطح capability تایپ‌شده مفید گسترش دهید.
3. Core و مصرف‌کنندگان کانال/feature را wire کنید
   کانال‌ها و Pluginهای feature باید capability جدید را از طریق Core مصرف کنند، نه با import مستقیم یک پیاده‌سازی vendor.
4. پیاده‌سازی‌های vendor را ثبت کنید
   سپس Pluginهای vendor backendهای خود را در برابر capability ثبت می‌کنند.
5. پوشش قرارداد اضافه کنید
   test اضافه کنید تا مالکیت و شکل ثبت در طول زمان صریح بماند.

این روشی است که OpenClaw با آن opinionated می‌ماند، بدون اینکه به جهان‌بینی یک provider خاص hardcoded شود. برای یک چک‌لیست فایل مشخص و مثال کامل، [Capability Cookbook](/fa/plugins/architecture) را ببینید.

### چک‌لیست capability

وقتی یک capability جدید اضافه می‌کنید، پیاده‌سازی معمولا باید این سطوح را با هم لمس کند:

- نوع‌های قرارداد Core در `src/<capability>/types.ts`
- runner/helper runtime مربوط به Core در `src/<capability>/runtime.ts`
- سطح ثبت API Plugin در `src/plugins/types.ts`
- wiring رجیستری Plugin در `src/plugins/registry.ts`
- exposure مربوط به runtime Plugin در `src/plugins/runtime/*` وقتی Pluginهای feature/کانال لازم است آن را مصرف کنند
- helperهای capture/test در `src/test-utils/plugin-registration.ts`
- assertionهای مالکیت/قرارداد در `src/plugins/contracts/registry.ts`
- مستندات operator/Plugin در `docs/`

اگر یکی از این سطوح وجود ندارد، معمولا نشانه این است که capability هنوز کاملا یکپارچه نشده است.

### قالب capability

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

الگوی test قرارداد:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

این قانون را ساده نگه می‌دارد:

- Core مالک قرارداد capability و orchestration است
- Pluginهای vendor مالک پیاده‌سازی‌های vendor هستند
- Pluginهای feature/کانال helperهای runtime را مصرف می‌کنند
- testهای قرارداد مالکیت را صریح نگه می‌دارند

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) — مدل و شکل‌های عمومی capability
- [زیرمسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths)
- [راه‌اندازی SDK مربوط به Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
