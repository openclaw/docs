---
read_when:
    - پیاده‌سازی قلاب‌های زمان اجرای ارائه‌دهنده، چرخهٔ حیات کانال، یا پک‌های بسته
    - اشکال‌زدایی ترتیب بارگذاری Plugin یا وضعیت رجیستری
    - افزودن یک قابلیت Plugin جدید یا Plugin موتور زمینه
summary: 'جزئیات داخلی معماری Plugin: خط لولهٔ بارگذاری، رجیستری، هوک‌های زمان اجرا، مسیرهای HTTP و جدول‌های مرجع'
title: جزئیات داخلی معماری Plugin
x-i18n:
    generated_at: "2026-05-02T11:53:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

برای مدل قابلیت عمومی، شکل‌های Plugin، و قراردادهای مالکیت/اجرا،
[معماری Plugin](/fa/plugins/architecture) را ببینید. این صفحه مرجع
سازوکارهای داخلی است: خط لوله بارگذاری، رجیستری، hookهای زمان اجرا،
مسیرهای HTTP در Gateway، مسیرهای import، و جدول‌های schema.

## خط لوله بارگذاری

در زمان راه‌اندازی، OpenClaw تقریباً این کارها را انجام می‌دهد:

1. ریشه‌های نامزد Plugin را پیدا می‌کند
2. مانیفست‌های bundle بومی یا سازگار و metadata بسته را می‌خواند
3. نامزدهای ناامن را رد می‌کند
4. پیکربندی Plugin را نرمال‌سازی می‌کند (`plugins.enabled`، `allow`، `deny`، `entries`،
   `slots`، `load.paths`)
5. فعال بودن هر نامزد را تعیین می‌کند
6. ماژول‌های بومی فعال‌شده را بارگذاری می‌کند: ماژول‌های bundle ساخته‌شده از یک بارگذار بومی استفاده می‌کنند؛
   TypeScript منبع محلی شخص ثالث از fallback اضطراری Jiti استفاده می‌کند
7. hookهای بومی `register(api)` را فراخوانی می‌کند و ثبت‌ها را در رجیستری Plugin جمع‌آوری می‌کند
8. رجیستری را در اختیار commandها/سطوح زمان اجرا قرار می‌دهد

<Note>
`activate` نام مستعار legacy برای `register` است — بارگذار هرکدام را که موجود باشد resolve می‌کند (`def.register ?? def.activate`) و در همان نقطه فراخوانی می‌کند. همه Pluginهای bundle‌شده از `register` استفاده می‌کنند؛ برای Pluginهای جدید `register` را ترجیح دهید.
</Note>

دروازه‌های ایمنی **پیش از** اجرای زمان اجرا اعمال می‌شوند. نامزدها زمانی مسدود
می‌شوند که entry از ریشه Plugin خارج شود، مسیر world-writable باشد، یا مالکیت
مسیر برای Pluginهای bundle‌نشده مشکوک به نظر برسد.

### رفتار manifest-first

مانیفست منبع حقیقت صفحه کنترل است. OpenClaw از آن برای این موارد استفاده می‌کند:

- شناسایی Plugin
- کشف کانال‌ها/Skills/schema پیکربندی یا قابلیت‌های bundle اعلام‌شده
- اعتبارسنجی `plugins.entries.<id>.config`
- تکمیل برچسب‌ها/placeholders در Control UI
- نمایش metadata نصب/کاتالوگ
- نگه داشتن descriptorهای فعال‌سازی و راه‌اندازی سبک بدون بارگذاری زمان اجرای Plugin

برای Pluginهای بومی، ماژول زمان اجرا بخش صفحه داده است. این ماژول رفتار واقعی
مانند hookها، ابزارها، commandها، یا جریان‌های ارائه‌دهنده را ثبت می‌کند.

بلوک‌های اختیاری `activation` و `setup` در مانیفست روی صفحه کنترل باقی می‌مانند.
آن‌ها descriptorهای فقط metadata برای برنامه‌ریزی فعال‌سازی و کشف setup هستند؛
جایگزین ثبت زمان اجرا، `register(...)`، یا `setupEntry` نمی‌شوند.
اولین مصرف‌کنندگان فعال‌سازی زنده اکنون از راهنمایی‌های command، کانال، و ارائه‌دهنده در مانیفست
برای محدود کردن بارگذاری Plugin پیش از materialization گسترده‌تر رجیستری استفاده می‌کنند:

- بارگذاری CLI به Pluginهایی محدود می‌شود که مالک command اصلی درخواست‌شده هستند
- resolve کردن setup/Plugin کانال به Pluginهایی محدود می‌شود که مالک شناسه کانال
  درخواست‌شده هستند
- resolve کردن setup/زمان اجرای صریح ارائه‌دهنده به Pluginهایی محدود می‌شود که مالک شناسه
  ارائه‌دهنده درخواست‌شده هستند
- برنامه‌ریزی راه‌اندازی Gateway از `activation.onStartup` برای importهای صریح راه‌اندازی
  و opt-outهای راه‌اندازی استفاده می‌کند؛ Pluginهای بدون metadata راه‌اندازی فقط
  از طریق triggerهای فعال‌سازی محدودتر بارگذاری می‌شوند

برنامه‌ریز فعال‌سازی هم یک API فقط شامل شناسه‌ها برای فراخوان‌های موجود و هم یک
API برنامه برای diagnostics جدید ارائه می‌کند. entryهای برنامه گزارش می‌دهند چرا یک Plugin انتخاب شده است،
و راهنمایی‌های صریح برنامه‌ریز `activation.*` را از fallback مالکیت مانیفست
مانند `providers`، `channels`، `commandAliases`، `setup.providers`،
`contracts.tools`، و hookها جدا می‌کنند. این تفکیک دلیل، مرز سازگاری است:
metadata موجود Plugin همچنان کار می‌کند، در حالی که کد جدید می‌تواند راهنمایی‌های گسترده
یا رفتار fallback را بدون تغییر semantics بارگذاری زمان اجرا تشخیص دهد.

کشف setup اکنون شناسه‌های متعلق به descriptor مانند `setup.providers` و
`setup.cliBackends` را ترجیح می‌دهد تا پیش از fallback به
`setup-api` برای Pluginهایی که هنوز به hookهای زمان اجرای زمان setup نیاز دارند، Pluginهای نامزد را محدود کند. فهرست‌های
setup ارائه‌دهنده از `providerAuthChoices` مانیفست، انتخاب‌های setup مشتق‌شده از descriptor،
و metadata کاتالوگ نصب بدون بارگذاری زمان اجرای ارائه‌دهنده استفاده می‌کنند. مقدار صریح
`setup.requiresRuntime: false` یک cutoff فقط descriptor است؛ حذف شدن
`requiresRuntime` برای سازگاری، fallback legacy به setup-api را حفظ می‌کند. اگر بیش از
یک Plugin کشف‌شده ادعا کند مالک همان ارائه‌دهنده setup یا شناسه backend در CLI نرمال‌شده است،
lookup setup به جای تکیه بر ترتیب کشف، مالک مبهم را رد می‌کند. وقتی زمان اجرای setup اجرا می‌شود،
diagnostics رجیستری drift میان `setup.providers` / `setup.cliBackends` و ارائه‌دهندگان یا backendهای CLI
ثبت‌شده توسط setup-api را بدون مسدود کردن Pluginهای legacy گزارش می‌کند.

### مرز کش Plugin

OpenClaw نتایج کشف Plugin یا داده مستقیم رجیستری مانیفست را پشت پنجره‌های
wall-clock کش نمی‌کند. نصب‌ها، ویرایش‌های مانیفست، و تغییرات load-path
باید در خواندن صریح بعدی metadata یا بازسازی snapshot بعدی قابل مشاهده شوند.
parser فایل مانیفست ممکن است یک کش محدود امضای فایل را نگه دارد که با مسیر
مانیفست بازشده، inode، اندازه، و timestamps کلیدگذاری شده است؛ آن کش فقط از
parse دوباره byteهای بدون تغییر جلوگیری می‌کند و نباید پاسخ‌های کشف، رجیستری، مالک، یا
policy را کش کند.

مسیر سریع metadata امن مالکیت صریح object است، نه کش پنهان.
مسیرهای داغ راه‌اندازی Gateway باید `PluginMetadataSnapshot` فعلی،
`PluginLookUpTable` مشتق‌شده، یا رجیستری صریح مانیفست را از طریق زنجیره فراخوانی عبور دهند.
اعتبارسنجی پیکربندی، فعال‌سازی خودکار راه‌اندازی، bootstrap Plugin، و انتخاب ارائه‌دهنده
می‌توانند از آن objectها دوباره استفاده کنند، تا زمانی که نماینده پیکربندی فعلی و inventory Plugin باشند.
lookup setup همچنان metadata مانیفست را در صورت نیاز بازسازی می‌کند
مگر اینکه مسیر setup مشخص یک رجیستری صریح مانیفست دریافت کند؛ آن را
به عنوان fallback مسیر سرد نگه دارید، نه اینکه کش‌های پنهان lookup اضافه کنید. وقتی ورودی
تغییر می‌کند، به جای mutate کردن snapshot یا نگه داشتن نسخه‌های تاریخی،
آن را بازسازی و جایگزین کنید.
viewهای رجیستری فعال Plugin و helperهای bootstrap کانال bundle‌شده
باید از رجیستری/ریشه فعلی دوباره محاسبه شوند. mapهای کوتاه‌عمر
داخل یک فراخوان برای dedupe کردن کار یا guard کردن reentry قابل قبول‌اند؛ آن‌ها نباید به کش‌های
metadata فرایند تبدیل شوند.

برای بارگذاری Plugin، لایه کش پایدار همان بارگذاری زمان اجرا است. این لایه ممکن است
state بارگذار را زمانی دوباره استفاده کند که code یا artifactهای نصب‌شده واقعاً بارگذاری شده‌اند، مانند:

- `PluginLoaderCacheState` و رجیستری‌های سازگار زمان اجرای فعال
- کش‌های jiti/module و کش‌های بارگذار سطح عمومی که برای جلوگیری از import کردن
  مکرر همان سطح زمان اجرا استفاده می‌شوند
- کش‌های filesystem برای artifactهای Plugin نصب‌شده
- mapهای کوتاه‌عمر درون هر فراخوان برای نرمال‌سازی مسیر یا resolve کردن duplicate

آن کش‌ها جزئیات پیاده‌سازی صفحه داده هستند. آن‌ها نباید به پرسش‌های صفحه کنترل
مانند «کدام Plugin مالک این ارائه‌دهنده است؟» پاسخ دهند، مگر اینکه
فراخوان عمداً بارگذاری زمان اجرا را درخواست کرده باشد.

کش‌های پایدار یا wall-clock برای این موارد اضافه نکنید:

- نتایج کشف
- رجیستری‌های مستقیم مانیفست
- رجیستری‌های مانیفست بازسازی‌شده از index نصب‌شده Plugin
- lookup مالک ارائه‌دهنده، suppression مدل، policy ارائه‌دهنده، یا metadata artifact عمومی
- هر پاسخ دیگر مشتق‌شده از مانیفست که در آن تغییر مانیفست، index نصب‌شده،
  یا load path باید در خواندن بعدی metadata قابل مشاهده باشد

فراخوان‌هایی که metadata مانیفست را از index نصب‌شده persistشده Plugin بازسازی می‌کنند،
آن رجیستری را در صورت نیاز بازسازی می‌کنند. index نصب‌شده state پایدار source-plane است؛
یک کش پنهان metadata درون فرایند نیست.

## مدل رجیستری

Pluginهای بارگذاری‌شده به طور مستقیم globalهای تصادفی core را mutate نمی‌کنند. آن‌ها در یک
رجیستری مرکزی Plugin ثبت می‌شوند.

رجیستری این موارد را track می‌کند:

- رکوردهای Plugin (هویت، source، origin، status، diagnostics)
- ابزارها
- hookهای legacy و hookهای typed
- کانال‌ها
- ارائه‌دهندگان
- handlerهای RPC در Gateway
- مسیرهای HTTP
- registrarهای CLI
- سرویس‌های پس‌زمینه
- commandهای متعلق به Plugin

سپس قابلیت‌های core به جای صحبت مستقیم با ماژول‌های Plugin، از آن رجیستری می‌خوانند.
این کار بارگذاری را یک‌طرفه نگه می‌دارد:

- ماژول Plugin -> ثبت در رجیستری
- زمان اجرای core -> مصرف رجیستری

این جداسازی برای نگه‌داری‌پذیری مهم است. یعنی بیشتر سطوح core فقط
به یک نقطه یکپارچه‌سازی نیاز دارند: «خواندن رجیستری»، نه «special-case کردن هر ماژول
Plugin».

## callbackهای binding مکالمه

Pluginهایی که یک مکالمه را bind می‌کنند می‌توانند وقتی یک approval resolve شد واکنش نشان دهند.

از `api.onConversationBindingResolved(...)` برای دریافت callback پس از approve یا deny شدن درخواست bind
استفاده کنید:

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
- `binding`: binding resolve‌شده برای درخواست‌های approve‌شده
- `request`: خلاصه درخواست اصلی، detach hint، شناسه sender، و
  metadata مکالمه

این callback فقط برای notification است. تعیین نمی‌کند چه کسی اجازه bind کردن
یک مکالمه را دارد، و پس از پایان handling approval در core اجرا می‌شود.

## hookهای زمان اجرای ارائه‌دهنده

Pluginهای ارائه‌دهنده سه لایه دارند:

- **metadata مانیفست** برای lookup سبک پیش از زمان اجرا:
  `setup.providers[].envVars`، سازگاری deprecated `providerAuthEnvVars`،
  `providerAuthAliases`، `providerAuthChoices`، و `channelEnvVars`.
- **hookهای زمان پیکربندی**: `catalog` (legacy `discovery`) به‌علاوه
  `applyConfigDefaults`.
- **hookهای زمان اجرا**: بیش از 40 hook اختیاری که auth، resolve مدل،
  stream wrapping، levels thinking، policy replay، و endpointهای usage را پوشش می‌دهند. فهرست کامل را زیر
  [ترتیب و کاربرد hook](#hook-order-and-usage) ببینید.

OpenClaw همچنان مالک generic agent loop، failover، transcript handling، و
tool policy است. این hookها سطح extension برای رفتار خاص ارائه‌دهنده هستند
بدون اینکه به transport inference کاملاً سفارشی نیاز باشد.

وقتی ارائه‌دهنده credentialهای مبتنی بر env دارد که مسیرهای generic auth/status/model-picker باید بدون
بارگذاری زمان اجرای Plugin ببینند، از `setup.providers[].envVars` مانیفست استفاده کنید. `providerAuthEnvVars`
deprecated همچنان در طول پنجره deprecation توسط adapter سازگاری خوانده می‌شود، و Pluginهای bundle‌نشده
که از آن استفاده کنند diagnostic مانیفست دریافت می‌کنند. وقتی یک شناسه ارائه‌دهنده باید env vars،
auth profiles، auth پشتیبانی‌شده با config، و انتخاب onboarding با API key شناسه ارائه‌دهنده دیگری را reuse کند،
از `providerAuthAliases` مانیفست استفاده کنید. وقتی سطوح onboarding/auth-choice در CLI باید شناسه انتخاب،
برچسب‌های گروه، و wiring ساده auth با یک flag را بدون بارگذاری زمان اجرای ارائه‌دهنده بدانند،
از `providerAuthChoices` مانیفست استفاده کنید. `envVars` زمان اجرای ارائه‌دهنده را
برای hintهای روبه‌روی operator مانند برچسب‌های onboarding یا vars راه‌اندازی
client-id/client-secret در OAuth نگه دارید.

وقتی یک کانال auth یا setup مبتنی بر env دارد که fallback generic shell-env،
بررسی‌های config/status، یا promptهای setup باید بدون بارگذاری زمان اجرای کانال ببینند،
از `channelEnvVars` مانیفست استفاده کنید.

### ترتیب و کاربرد hook

برای Pluginهای مدل/ارائه‌دهنده، OpenClaw hookها را تقریباً با این ترتیب فراخوانی می‌کند.
ستون «زمان استفاده» راهنمای تصمیم سریع است.
فیلدهای فقط سازگاری ارائه‌دهنده که OpenClaw دیگر فراخوانی نمی‌کند، مانند
`ProviderPlugin.capabilities` و `suppressBuiltInModel`، عمداً اینجا
فهرست نشده‌اند.

| #   | هوک                              | کارکرد آن                                                                                                   | زمان استفاده                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | انتشار پیکربندی ارائه‌دهنده در `models.providers` هنگام تولید `models.json`                                | ارائه‌دهنده مالک یک کاتالوگ یا پیش‌فرض‌های URL پایه است                                                                                                  |
| 2   | `applyConfigDefaults`             | اعمال پیش‌فرض‌های پیکربندی سراسریِ متعلق به ارائه‌دهنده هنگام مادی‌سازی پیکربندی                                      | پیش‌فرض‌ها به حالت احراز هویت، محیط، یا معنای خانواده مدلِ ارائه‌دهنده وابسته‌اند                                                                         |
| --  | _(جست‌وجوی مدل داخلی)_         | OpenClaw ابتدا مسیر عادی رجیستری/کاتالوگ را امتحان می‌کند                                                          | _(هوک Plugin نیست)_                                                                                                                         |
| 3   | `normalizeModelId`                | عادی‌سازی نام‌های مستعار قدیمی یا پیش‌نمایشِ شناسه مدل پیش از جست‌وجو                                                     | ارائه‌دهنده پیش از حل مدل کانونی، مالک پاک‌سازی نام‌های مستعار است                                                                                 |
| 4   | `normalizeTransport`              | عادی‌سازی `api` / `baseUrl` خانواده ارائه‌دهنده پیش از سرهم‌بندی عمومی مدل                                      | ارائه‌دهنده مالک پاک‌سازی انتقال برای شناسه‌های ارائه‌دهنده سفارشی در همان خانواده انتقال است                                                          |
| 5   | `normalizeConfig`                 | عادی‌سازی `models.providers.<id>` پیش از حل زمان اجرا/ارائه‌دهنده                                           | ارائه‌دهنده به پاک‌سازی پیکربندی نیاز دارد که باید همراه Plugin باشد؛ کمک‌کننده‌های بسته‌بندی‌شده خانواده Google نیز برای ورودی‌های پیکربندی پشتیبانی‌شده Google پشتوانه فراهم می‌کنند   |
| 6   | `applyNativeStreamingUsageCompat` | اعمال بازنویسی‌های سازگاری مصرف جریان بومی روی ارائه‌دهندگان پیکربندی                                               | ارائه‌دهنده به اصلاحات فراداده مصرف جریان بومی مبتنی بر نقطه پایانی نیاز دارد                                                                          |
| 7   | `resolveConfigApiKey`             | حل احراز هویت نشانگر محیط برای ارائه‌دهندگان پیکربندی پیش از بارگذاری احراز هویت زمان اجرا                                       | ارائه‌دهنده حل کلید API نشانگر محیطِ متعلق به ارائه‌دهنده دارد؛ `amazon-bedrock` نیز اینجا یک حل‌کننده نشانگر محیط AWS داخلی دارد                  |
| 8   | `resolveSyntheticAuth`            | نمایان‌سازی احراز هویت محلی/خودمیزبان یا مبتنی بر پیکربندی بدون پایدارسازی متن ساده                                   | ارائه‌دهنده می‌تواند با یک نشانگر اعتبارنامه مصنوعی/محلی کار کند                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | هم‌پوشانی پروفایل‌های احراز هویت خارجیِ متعلق به ارائه‌دهنده؛ `persistence` پیش‌فرض برای اعتبارنامه‌های متعلق به CLI/برنامه برابر `runtime-only` است | ارائه‌دهنده اعتبارنامه‌های احراز هویت خارجی را بدون پایدارسازی توکن‌های تازه‌سازی کپی‌شده بازاستفاده می‌کند؛ `contracts.externalAuthProviders` را در مانیفست اعلام کنید |
| 10  | `shouldDeferSyntheticProfileAuth` | پایین آوردن اولویت جای‌نگهدارهای پروفایل مصنوعی ذخیره‌شده پشت احراز هویت مبتنی بر محیط/پیکربندی                                      | ارائه‌دهنده پروفایل‌های جای‌نگهدار مصنوعی ذخیره می‌کند که نباید اولویت را ببرند                                                                 |
| 11  | `resolveDynamicModel`             | مسیر جایگزین همگام برای شناسه‌های مدلِ متعلق به ارائه‌دهنده که هنوز در رجیستری محلی نیستند                                       | ارائه‌دهنده شناسه‌های مدل دلخواه بالادستی را می‌پذیرد                                                                                                 |
| 12  | `prepareDynamicModel`             | گرم‌سازی ناهمگام، سپس `resolveDynamicModel` دوباره اجرا می‌شود                                                           | ارائه‌دهنده پیش از حل شناسه‌های ناشناخته به فراداده شبکه نیاز دارد                                                                                  |
| 13  | `normalizeResolvedModel`          | بازنویسی نهایی پیش از اینکه اجراکننده تعبیه‌شده از مدل حل‌شده استفاده کند                                               | ارائه‌دهنده به بازنویسی‌های انتقال نیاز دارد اما همچنان از انتقال هسته استفاده می‌کند                                                                             |
| 14  | `contributeResolvedModelCompat`   | افزودن پرچم‌های سازگاری برای مدل‌های فروشنده پشت یک انتقال سازگار دیگر                                  | ارائه‌دهنده مدل‌های خودش را روی انتقال‌های پراکسی تشخیص می‌دهد بدون اینکه کنترل ارائه‌دهنده را به دست بگیرد                                                       |
| 15  | `normalizeToolSchemas`            | عادی‌سازی شِماهای ابزار پیش از اینکه اجراکننده تعبیه‌شده آن‌ها را ببیند                                                    | ارائه‌دهنده به پاک‌سازی شِمای خانواده انتقال نیاز دارد                                                                                                |
| 16  | `inspectToolSchemas`              | نمایان‌سازی عیب‌یابی‌های شِمای متعلق به ارائه‌دهنده پس از عادی‌سازی                                                  | ارائه‌دهنده هشدارهای کلیدواژه‌ای می‌خواهد بدون اینکه قوانین اختصاصی ارائه‌دهنده به هسته آموزش داده شود                                                                 |
| 17  | `resolveReasoningOutputMode`      | انتخاب قرارداد خروجی استدلال بومی در برابر برچسب‌دار                                                              | ارائه‌دهنده به خروجی استدلال/نهایی برچسب‌دار به‌جای فیلدهای بومی نیاز دارد                                                                         |
| 18  | `prepareExtraParams`              | عادی‌سازی پارامترهای درخواست پیش از پوشاننده‌های عمومی گزینه جریان                                              | ارائه‌دهنده به پارامترهای درخواست پیش‌فرض یا پاک‌سازی پارامتر به‌ازای هر ارائه‌دهنده نیاز دارد                                                                           |
| 19  | `createStreamFn`                  | جایگزینی کامل مسیر عادی جریان با یک انتقال سفارشی                                                   | ارائه‌دهنده به یک پروتکل سیمی سفارشی نیاز دارد، نه فقط یک پوشاننده                                                                                     |
| 20  | `wrapStreamFn`                    | پوشاننده جریان پس از اعمال پوشاننده‌های عمومی                                                              | ارائه‌دهنده به پوشاننده‌های سازگاری سرآیند/بدنه/مدل درخواست بدون انتقال سفارشی نیاز دارد                                                          |
| 21  | `resolveTransportTurnState`       | الصاق سرآیندهای انتقال بومی یا فراداده به‌ازای هر نوبت                                                           | ارائه‌دهنده می‌خواهد انتقال‌های عمومی هویت نوبت بومیِ ارائه‌دهنده را بفرستند                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | الصاق سرآیندهای WebSocket بومی یا سیاست سردشدن نشست                                                    | ارائه‌دهنده می‌خواهد انتقال‌های WS عمومی سرآیندهای نشست یا سیاست جایگزین را تنظیم کنند                                                               |
| 23  | `formatApiKey`                    | قالب‌دهنده پروفایل احراز هویت: پروفایل ذخیره‌شده به رشته `apiKey` زمان اجرا تبدیل می‌شود                                     | ارائه‌دهنده فراداده احراز هویت اضافی ذخیره می‌کند و به شکل توکن زمان اجرای سفارشی نیاز دارد                                                                    |
| 24  | `refreshOAuth`                    | بازنویسی تازه‌سازی OAuth برای نقطه‌های پایانی تازه‌سازی سفارشی یا سیاست شکست تازه‌سازی                                  | ارائه‌دهنده با تازه‌سازهای مشترک `pi-ai` سازگار نیست                                                                                           |
| 25  | `buildAuthDoctorHint`             | راهنمای تعمیر که هنگام شکست تازه‌سازی OAuth اضافه می‌شود                                                                  | ارائه‌دهنده پس از شکست تازه‌سازی به راهنمای تعمیر احراز هویت متعلق به ارائه‌دهنده نیاز دارد                                                                      |
| 26  | `matchesContextOverflowError`     | تطبیق‌دهنده سرریز پنجره زمینه متعلق به ارائه‌دهنده                                                                 | ارائه‌دهنده خطاهای خام سرریز دارد که اکتشاف‌های عمومی آن‌ها را از دست می‌دهند                                                                                |
| 27  | `classifyFailoverReason`          | دسته‌بندی دلیل شکست‌گردانی متعلق به ارائه‌دهنده                                                                  | ارائه‌دهنده می‌تواند خطاهای خام API/انتقال را به محدودیت نرخ/بار بیش از حد/و غیره نگاشت کند                                                                          |
| 28  | `isCacheTtlEligible`              | سیاست کش پرامپت برای ارائه‌دهندگان پراکسی/بک‌هاول                                                               | ارائه‌دهنده به دروازه‌گذاری TTL کشِ اختصاصی پراکسی نیاز دارد                                                                                                |
| 29  | `buildMissingAuthMessage`         | جایگزین پیام عمومی بازیابی احراز هویت مفقود                                                      | ارائه‌دهنده به راهنمای بازیابی احراز هویت مفقودِ اختصاصی ارائه‌دهنده نیاز دارد                                                                                 |
| 30  | `augmentModelCatalog`             | ردیف‌های کاتالوگ مصنوعی/نهایی که پس از کشف اضافه می‌شوند                                                          | ارائه‌دهنده به ردیف‌های مصنوعی سازگاری آینده در `models list` و انتخاب‌گرها نیاز دارد                                                                     |
| 31  | `resolveThinkingProfile`          | مجموعه سطح ویژه مدل برای `/think`، برچسب‌های نمایشی، و پیش‌فرض                                                 | ارائه‌دهنده برای مدل‌های انتخاب‌شده یک نردبان تفکر سفارشی یا برچسب دودویی ارائه می‌کند                                                                 |
| 32  | `isBinaryThinking`                | هوک سازگاری کلید روشن/خاموش استدلال                                                                     | ارائه‌دهنده فقط تفکر دودویی روشن/خاموش ارائه می‌کند                                                                                                  |
| 33  | `supportsXHighThinking`           | هوک سازگاری پشتیبانی استدلال `xhigh`                                                                   | ارائه‌دهنده `xhigh` را فقط برای زیرمجموعه‌ای از مدل‌ها می‌خواهد                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | هوک سازگاری سطح پیش‌فرض `/think`                                                                      | ارائه‌دهنده مالک سیاست پیش‌فرض `/think` برای یک خانواده مدل است                                                                                      |
| 35  | `isModernModelRef`                | تطبیق‌دهنده مدل مدرن برای فیلترهای پروفایل زنده و انتخاب دود                                                      | ارائه‌دهنده مالک تطبیق مدل ترجیحی زنده/دود است                                                                                             |
| 36  | `prepareRuntimeAuth`              | تبدیل یک اعتبارنامه پیکربندی‌شده به توکن/کلید واقعی زمان اجرا درست پیش از استنتاج                       | ارائه‌دهنده به تبادل توکن یا اعتبارنامه درخواست کوتاه‌عمر نیاز دارد                                                                             |
| 37  | `resolveUsageAuth`                | اعتبارنامه‌های مصرف/صورت‌حساب را برای `/usage` و سطوح وضعیت مرتبط تعیین می‌کند                                     | ارائه‌دهنده به تجزیهٔ سفارشی توکن مصرف/سهمیه یا یک اعتبارنامهٔ مصرف متفاوت نیاز دارد                                                               |
| 38  | `fetchUsageSnapshot`              | نماهای فوری مصرف/سهمیهٔ ویژهٔ ارائه‌دهنده را پس از تعیین احراز هویت واکشی و نرمال‌سازی می‌کند                             | ارائه‌دهنده به نقطهٔ پایانی مصرف ویژهٔ ارائه‌دهنده یا تجزیه‌کنندهٔ payload نیاز دارد                                                                           |
| 39  | `createEmbeddingProvider`         | یک آداپتر embedding متعلق به ارائه‌دهنده برای حافظه/جست‌وجو می‌سازد                                                     | رفتار embedding حافظه به Plugin ارائه‌دهنده تعلق دارد                                                                                    |
| 40  | `buildReplayPolicy`               | یک سیاست بازپخش برمی‌گرداند که مدیریت رونوشت را برای ارائه‌دهنده کنترل می‌کند                                        | ارائه‌دهنده به سیاست رونوشت سفارشی نیاز دارد (برای مثال، حذف بلوک‌های تفکر)                                                               |
| 41  | `sanitizeReplayHistory`           | تاریخچهٔ بازپخش را پس از پاک‌سازی عمومی رونوشت بازنویسی می‌کند                                                        | ارائه‌دهنده به بازنویسی‌های بازپخش ویژهٔ ارائه‌دهنده، فراتر از کمک‌کننده‌های مشترک Compaction، نیاز دارد                                                             |
| 42  | `validateReplayTurns`             | اعتبارسنجی نهایی نوبت‌های بازپخش یا شکل‌دهی دوبارهٔ آن‌ها پیش از runner تعبیه‌شده                                           | انتقال ارائه‌دهنده پس از پاک‌سازی عمومی به اعتبارسنجی سخت‌گیرانه‌تر نوبت‌ها نیاز دارد                                                                    |
| 43  | `onModelSelected`                 | اثرات جانبی پس از انتخاب متعلق به ارائه‌دهنده را اجرا می‌کند                                                                 | وقتی یک مدل فعال می‌شود، ارائه‌دهنده به دورسنجی یا وضعیت متعلق به ارائه‌دهنده نیاز دارد                                                                  |

`normalizeModelId`، `normalizeTransport` و `normalizeConfig` ابتدا Plugin ارائه‌دهندهٔ منطبق را بررسی می‌کنند، سپس به سراغ سایر Pluginهای ارائه‌دهندهٔ دارای قابلیت هوک می‌روند تا زمانی که یکی واقعاً شناسهٔ مدل یا انتقال/پیکربندی را تغییر دهد. این کار باعث می‌شود shimهای ارائه‌دهنده برای alias/compat همچنان کار کنند، بدون اینکه فراخواننده لازم باشد بداند کدام Plugin بسته‌بندی‌شده مالک بازنویسی است. اگر هیچ هوک ارائه‌دهنده‌ای یک ورودی پیکربندی پشتیبانی‌شده از خانوادهٔ Google را بازنویسی نکند، نرمال‌ساز پیکربندی Google بسته‌بندی‌شده همچنان آن پاک‌سازی سازگاری را اعمال می‌کند.

اگر ارائه‌دهنده به یک پروتکل سیمی کاملاً سفارشی یا اجراکنندهٔ درخواست سفارشی نیاز داشته باشد، این یک دستهٔ متفاوت از افزونه است. این هوک‌ها برای رفتار ارائه‌دهنده‌ای هستند که همچنان روی حلقهٔ استنتاج عادی OpenClaw اجرا می‌شود.

### مثال ارائه‌دهنده

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

### مثال‌های داخلی

Pluginهای ارائه‌دهندهٔ بسته‌بندی‌شده، هوک‌های بالا را با هم ترکیب می‌کنند تا با کاتالوگ، احراز هویت، تفکر، بازپخش و نیازهای مصرف هر فروشنده سازگار شوند. مجموعهٔ معتبر هوک‌ها همراه با هر Plugin زیر `extensions/` قرار دارد؛ این صفحه شکل‌ها را نشان می‌دهد، نه اینکه فهرست را بازتاب دهد.

<AccordionGroup>
  <Accordion title="ارائه‌دهندگان کاتالوگ عبوری">
    OpenRouter، Kilocode، Z.AI و xAI، `catalog` به‌همراه
    `resolveDynamicModel` / `prepareDynamicModel` را ثبت می‌کنند تا بتوانند
    شناسه‌های مدل بالادستی را پیش از کاتالوگ ایستای OpenClaw نمایش دهند.
  </Accordion>
  <Accordion title="ارائه‌دهندگان نقطه‌پایانی OAuth و مصرف">
    GitHub Copilot، Gemini CLI، ChatGPT Codex، MiniMax، Xiaomi و z.ai،
    `prepareRuntimeAuth` یا `formatApiKey` را با `resolveUsageAuth` +
    `fetchUsageSnapshot` جفت می‌کنند تا مالکیت تبادل توکن و یکپارچه‌سازی `/usage` را بر عهده بگیرند.
  </Accordion>
  <Accordion title="خانواده‌های بازپخش و پاک‌سازی رونوشت">
    خانواده‌های نام‌گذاری‌شدهٔ مشترک (`google-gemini`، `passthrough-gemini`،
    `anthropic-by-model`، `hybrid-anthropic-openai`) به ارائه‌دهندگان اجازه می‌دهند
    از طریق `buildReplayPolicy` وارد سیاست رونوشت شوند، به‌جای اینکه هر Plugin
    پاک‌سازی را دوباره پیاده‌سازی کند.
  </Accordion>
  <Accordion title="ارائه‌دهندگان فقط کاتالوگ">
    `byteplus`، `cloudflare-ai-gateway`، `huggingface`، `kimi-coding`، `nvidia`،
    `qianfan`، `synthetic`، `together`، `venice`، `vercel-ai-gateway` و
    `volcengine` فقط `catalog` را ثبت می‌کنند و از حلقهٔ استنتاج مشترک استفاده می‌کنند.
  </Accordion>
  <Accordion title="کمک‌کارهای جریان مخصوص Anthropic">
    سرآیندهای بتا، `/fast` / `serviceTier` و `context1m` داخل مرز عمومی
    `api.ts` / `contract-api.ts` در Plugin مربوط به Anthropic قرار دارند
    (`wrapAnthropicProviderStream`، `resolveAnthropicBetas`،
    `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`) نه در
    SDK عمومی.
  </Accordion>
</AccordionGroup>

## کمک‌کارهای زمان اجرا

Pluginها می‌توانند از طریق `api.runtime` به کمک‌کارهای منتخب هسته دسترسی داشته باشند. برای TTS:

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

- `textToSpeech` خروجی معمول TTS هسته را برای سطح‌های فایل/یادداشت صوتی برمی‌گرداند.
- از پیکربندی `messages.tts` هسته و انتخاب ارائه‌دهنده استفاده می‌کند.
- بافر صوتی PCM + نرخ نمونه‌برداری را برمی‌گرداند. Pluginها باید برای ارائه‌دهندگان، نمونه‌برداری مجدد/کدگذاری انجام دهند.
- `listVoices` برای هر ارائه‌دهنده اختیاری است. از آن برای انتخابگرهای صدا یا جریان‌های راه‌اندازی تحت مالکیت فروشنده استفاده کنید.
- فهرست‌های صدا می‌توانند فرادادهٔ غنی‌تری مانند زبان/منطقه، جنسیت و برچسب‌های شخصیت برای انتخابگرهای آگاه از ارائه‌دهنده داشته باشند.
- OpenAI و ElevenLabs امروز از تلفن پشتیبانی می‌کنند. Microsoft پشتیبانی نمی‌کند.

Pluginها همچنین می‌توانند ارائه‌دهندگان گفتار را از طریق `api.registerSpeechProvider(...)` ثبت کنند.

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

- سیاست TTS، fallback و تحویل پاسخ را در هسته نگه دارید.
- از ارائه‌دهندگان گفتار برای رفتار سنتز تحت مالکیت فروشنده استفاده کنید.
- ورودی قدیمی Microsoft `edge` به شناسهٔ ارائه‌دهندهٔ `microsoft` نرمال‌سازی می‌شود.
- مدل مالکیت ترجیحی شرکت‌محور است: یک Plugin فروشنده می‌تواند مالک ارائه‌دهندگان متن، گفتار، تصویر و رسانه‌های آینده باشد، هم‌زمان با اینکه OpenClaw این قراردادهای قابلیت را اضافه می‌کند.

برای درک تصویر/صدا/ویدئو، Pluginها به‌جای یک کیسهٔ عمومی کلید/مقدار، یک ارائه‌دهندهٔ تایپ‌شدهٔ درک رسانه ثبت می‌کنند:

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

- هماهنگ‌سازی، fallback، پیکربندی و سیم‌کشی کانال را در هسته نگه دارید.
- رفتار فروشنده را در Plugin ارائه‌دهنده نگه دارید.
- گسترش افزایشی باید تایپ‌شده باقی بماند: متدهای اختیاری جدید، فیلدهای نتیجهٔ اختیاری جدید، قابلیت‌های اختیاری جدید.
- تولید ویدئو از قبل همین الگو را دنبال می‌کند:
  - هسته مالک قرارداد قابلیت و کمک‌کار زمان اجرا است
  - Pluginهای فروشنده `api.registerVideoGenerationProvider(...)` را ثبت می‌کنند
  - Pluginهای قابلیت/کانال، `api.runtime.videoGeneration.*` را مصرف می‌کنند

برای کمک‌کارهای زمان اجرای درک رسانه، Pluginها می‌توانند فراخوانی کنند:

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

برای رونویسی صوت، Pluginها می‌توانند از زمان اجرای درک رسانه یا alias قدیمی‌تر STT استفاده کنند:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

نکته‌ها:

- `api.runtime.mediaUnderstanding.*` سطح مشترک ترجیحی برای درک تصویر/صدا/ویدئو است.
- از پیکربندی صوتی درک رسانهٔ هسته (`tools.media.audio`) و ترتیب fallback ارائه‌دهنده استفاده می‌کند.
- وقتی هیچ خروجی رونویسی تولید نشود، `{ text: undefined }` را برمی‌گرداند (برای مثال ورودی ردشده/پشتیبانی‌نشده).
- `api.runtime.stt.transcribeAudioFile(...)` به‌عنوان alias سازگاری باقی می‌ماند.

Pluginها همچنین می‌توانند اجراهای subagent پس‌زمینه را از طریق `api.runtime.subagent` راه‌اندازی کنند:

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
- OpenClaw فقط این فیلدهای بازنویسی را برای فراخواننده‌های مورد اعتماد رعایت می‌کند.
- برای اجراهای fallback تحت مالکیت Plugin، اپراتورها باید با `plugins.entries.<id>.subagent.allowModelOverride: true` اعلام موافقت کنند.
- از `plugins.entries.<id>.subagent.allowedModels` برای محدود کردن Pluginهای مورد اعتماد به هدف‌های کانونی مشخص `provider/model`، یا از `"*"` برای مجاز کردن صریح هر هدف استفاده کنید.
- اجراهای subagent توسط Pluginهای نامطمئن همچنان کار می‌کنند، اما درخواست‌های بازنویسی به‌جای fallback بی‌صدا رد می‌شوند.
- نشست‌های subagent ایجادشده توسط Pluginها با شناسهٔ Plugin ایجادکننده برچسب‌گذاری می‌شوند. fallback `api.runtime.subagent.deleteSession(...)` فقط می‌تواند همان نشست‌های مالکیت‌دار را حذف کند؛ حذف دلخواه نشست همچنان به یک درخواست Gateway با دامنهٔ مدیر نیاز دارد.

برای جست‌وجوی وب، Pluginها می‌توانند به‌جای ورود به سیم‌کشی ابزار agent، کمک‌کار زمان اجرای مشترک را مصرف کنند:

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

Pluginها همچنین می‌توانند ارائه‌دهندگان جست‌وجوی وب را از طریق
`api.registerWebSearchProvider(...)` ثبت کنند.

نکته‌ها:

- انتخاب ارائه‌دهنده، حل اعتبارنامه و معناشناسی درخواست مشترک را در هسته نگه دارید.
- از ارائه‌دهندگان جست‌وجوی وب برای انتقال‌های جست‌وجوی مخصوص فروشنده استفاده کنید.
- `api.runtime.webSearch.*` سطح مشترک ترجیحی برای Pluginهای قابلیت/کانالی است که به رفتار جست‌وجو بدون وابستگی به wrapper ابزار agent نیاز دارند.

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

- `generate(...)`: تولید یک تصویر با استفاده از زنجیرهٔ ارائه‌دهندهٔ تولید تصویر پیکربندی‌شده.
- `listProviders(...)`: فهرست کردن ارائه‌دهندگان موجود تولید تصویر و قابلیت‌های آن‌ها.

## مسیرهای HTTP در Gateway

Pluginها می‌توانند با `api.registerHttpRoute(...)` نقطه‌پایان‌های HTTP ارائه کنند.

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

- `path`: مسیر route زیر سرور HTTP در gateway.
- `auth`: الزامی. از `"gateway"` برای نیاز داشتن به احراز هویت عادی gateway، یا از `"plugin"` برای احراز هویت/راستی‌آزمایی webhook مدیریت‌شده توسط Plugin استفاده کنید.
- `match`: اختیاری. `"exact"` (پیش‌فرض) یا `"prefix"`.
- `replaceExisting`: اختیاری. به همان Plugin اجازه می‌دهد ثبت route موجود خودش را جایگزین کند.
- `handler`: وقتی route درخواست را مدیریت کرد، `true` برگردانید.

نکته‌ها:

- `api.registerHttpHandler(...)` حذف شده است و باعث خطای بارگذاری Plugin می‌شود. به‌جای آن از `api.registerHttpRoute(...)` استفاده کنید.
- مسیرهای Plugin باید `auth` را به‌صراحت اعلام کنند.
- تداخل‌های دقیق `path + match` رد می‌شوند مگر اینکه `replaceExisting: true` باشد، و یک Plugin نمی‌تواند مسیر Plugin دیگری را جایگزین کند.
- مسیرهای هم‌پوشان با سطوح متفاوت `auth` رد می‌شوند. زنجیره‌های عبور `exact`/`prefix` را فقط روی همان سطح auth نگه دارید.
- مسیرهای `auth: "plugin"` دامنه‌های runtime اپراتور را به‌صورت خودکار دریافت **نمی‌کنند**. آن‌ها برای Webhookهای مدیریت‌شده توسط Plugin/اعتبارسنجی امضا هستند، نه فراخوانی‌های کمکی ممتاز Gateway.
- مسیرهای `auth: "gateway"` داخل دامنه runtime درخواست Gateway اجرا می‌شوند، اما آن دامنه عمداً محافظه‌کارانه است:
  - احراز هویت bearer با راز مشترک (`gateway.auth.mode = "token"` / `"password"`) دامنه‌های runtime مسیر Plugin را روی `operator.write` ثابت نگه می‌دارد، حتی اگر فراخواننده `x-openclaw-scopes` بفرستد
  - حالت‌های HTTP معتمد دارای هویت (برای مثال `trusted-proxy` یا `gateway.auth.mode = "none"` روی یک ورودی خصوصی) فقط وقتی سربرگ به‌صراحت حاضر باشد، به `x-openclaw-scopes` احترام می‌گذارند
  - اگر `x-openclaw-scopes` در آن درخواست‌های مسیر Plugin دارای هویت وجود نداشته باشد، دامنه runtime به `operator.write` برمی‌گردد
- قاعده عملی: فرض نکنید مسیر Plugin با احراز هویت Gateway به‌طور ضمنی یک سطح مدیر است. اگر مسیر شما به رفتار فقط مدیر نیاز دارد، یک حالت احراز هویت دارای هویت را الزامی کنید و قرارداد صریح سربرگ `x-openclaw-scopes` را مستند کنید.

## مسیرهای import در Plugin SDK

هنگام ساخت Pluginهای جدید، به‌جای barrel ریشه یکپارچه `openclaw/plugin-sdk` از زیردامنه‌های باریک SDK استفاده کنید. زیردامنه‌های هسته:

| زیردامنه                             | هدف                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | مقدمات ثبت Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | کمک‌کننده‌های ورود/ساخت کانال                        |
| `openclaw/plugin-sdk/core`          | کمک‌کننده‌های مشترک عمومی و قرارداد چتری       |
| `openclaw/plugin-sdk/config-schema` | شمای Zod ریشه `openclaw.json` (`OpenClawSchema`) |

Pluginهای کانال از خانواده‌ای از درزهای باریک انتخاب می‌کنند: `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` و `channel-actions`. رفتار تأیید باید روی یک قرارداد
`approvalCapability` یکپارچه شود، نه اینکه میان فیلدهای نامرتبط Plugin ترکیب شود. [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) را ببینید.

کمک‌کننده‌های runtime و پیکربندی زیر زیردامنه‌های متمرکز و متناظر `*-runtime`
قرار دارند (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` و غیره). به‌جای barrel سازگاری گسترده `config-runtime`، از `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` و `config-mutation`
استفاده کنید.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
و `openclaw/plugin-sdk/infra-runtime` شیم‌های سازگاری منسوخ برای
Pluginهای قدیمی‌تر هستند. کد جدید باید به‌جای آن مقدمات عمومی باریک‌تر را import کند.
</Info>

نقاط ورود داخلی مخزن (برای ریشه هر بسته Plugin بسته‌بندی‌شده):

- `index.js` — ورودی Plugin بسته‌بندی‌شده
- `api.js` — barrel کمک‌کننده/نوع‌ها
- `runtime-api.js` — barrel فقط runtime
- `setup-entry.js` — ورودی Plugin راه‌اندازی

Pluginهای خارجی فقط باید زیردامنه‌های `openclaw/plugin-sdk/*` را import کنند. هرگز
`src/*` بسته Plugin دیگری را از هسته یا از Plugin دیگری import نکنید.
نقاط ورود بارگذاری‌شده با facade وقتی snapshot پیکربندی runtime فعال وجود داشته باشد، آن را ترجیح می‌دهند
و سپس به فایل پیکربندی resolveشده روی دیسک برمی‌گردند.

زیردامنه‌های مختص قابلیت مانند `image-generation`, `media-understanding`
و `speech` وجود دارند چون Pluginهای بسته‌بندی‌شده امروز از آن‌ها استفاده می‌کنند. آن‌ها
به‌صورت خودکار قراردادهای خارجی ثابت بلندمدت نیستند؛ هنگام اتکا به آن‌ها
صفحه مرجع SDK مربوطه را بررسی کنید.

## شِماهای ابزار پیام

Pluginها باید سهم‌های شمای `describeMessageTool(...)` مخصوص کانال را
برای مقدمات غیرپیامی مانند واکنش‌ها، خوانده‌شدن‌ها و نظرسنجی‌ها مالک باشند.
ارائه مشترک ارسال باید به‌جای فیلدهای بومی ارائه‌دهنده مانند دکمه، کامپوننت، بلوک یا کارت، از قرارداد عمومی `MessagePresentation`
استفاده کند.
برای قرارداد، قواعد fallback، نگاشت ارائه‌دهنده و چک‌لیست نویسنده Plugin، [ارائه پیام](/fa/plugins/message-presentation) را ببینید.

Pluginهای دارای قابلیت ارسال اعلام می‌کنند چه چیزهایی را از طریق قابلیت‌های پیام می‌توانند رندر کنند:

- `presentation` برای بلوک‌های ارائه معنایی (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` برای درخواست‌های تحویل سنجاق‌شده

هسته تصمیم می‌گیرد ارائه را به‌صورت بومی رندر کند یا آن را به متن تنزل دهد.
از ابزار پیام عمومی، راه‌های فرار UI بومی ارائه‌دهنده را در معرض نگذارید.
کمک‌کننده‌های SDK منسوخ برای شِماهای بومی قدیمی همچنان برای Pluginهای
شخص ثالث موجود صادر می‌شوند، اما Pluginهای جدید نباید از آن‌ها استفاده کنند.

## resolve هدف کانال

Pluginهای کانال باید مالک معناشناسی هدف مخصوص کانال باشند. میزبان خروجی مشترک را
عمومی نگه دارید و برای قواعد ارائه‌دهنده از سطح adapter پیام‌رسانی استفاده کنید:

- `messaging.inferTargetChatType({ to })` پیش از lookup دایرکتوری تصمیم می‌گیرد آیا هدف نرمال‌شده
  باید به‌عنوان `direct`, `group` یا `channel` در نظر گرفته شود.
- `messaging.targetResolver.looksLikeId(raw, normalized)` به هسته می‌گوید آیا یک
  ورودی باید به‌جای جست‌وجوی دایرکتوری مستقیم به resolve شبیه شناسه برود.
- `messaging.targetResolver.resolveTarget(...)` fallback Plugin است وقتی
  هسته پس از نرمال‌سازی یا پس از miss دایرکتوری به resolve نهایی تحت مالکیت ارائه‌دهنده نیاز دارد.
- `messaging.resolveOutboundSessionRoute(...)` پس از resolve شدن هدف، ساخت مسیر جلسه مخصوص ارائه‌دهنده را
  مالک است.

تقسیم پیشنهادی:

- از `inferTargetChatType` برای تصمیم‌های دسته‌بندی که باید پیش از
  جست‌وجوی همتاها/گروه‌ها رخ دهند استفاده کنید.
- از `looksLikeId` برای بررسی‌های «این را به‌عنوان شناسه هدف صریح/بومی در نظر بگیر» استفاده کنید.
- از `resolveTarget` برای fallback نرمال‌سازی مخصوص ارائه‌دهنده استفاده کنید، نه برای
  جست‌وجوی گسترده دایرکتوری.
- شناسه‌های بومی ارائه‌دهنده مانند شناسه‌های چت، شناسه‌های thread، JIDها، handleها و شناسه‌های room را
  داخل مقدارهای `target` یا پارامترهای مخصوص ارائه‌دهنده نگه دارید، نه در فیلدهای عمومی SDK.

## دایرکتوری‌های مبتنی بر پیکربندی

Pluginهایی که ورودی‌های دایرکتوری را از پیکربندی استخراج می‌کنند باید آن منطق را در
Plugin نگه دارند و کمک‌کننده‌های مشترک را از
`openclaw/plugin-sdk/directory-runtime` دوباره استفاده کنند.

وقتی یک کانال به همتاها/گروه‌های مبتنی بر پیکربندی نیاز دارد از این استفاده کنید، مانند:

- همتایان پیام مستقیم مبتنی بر فهرست مجاز
- نگاشت‌های کانال/گروه پیکربندی‌شده
- fallbackهای دایرکتوری ایستای محدود به حساب

کمک‌کننده‌های مشترک در `directory-runtime` فقط عملیات عمومی را مدیریت می‌کنند:

- فیلتر کردن query
- اعمال limit
- کمک‌کننده‌های حذف تکرار/نرمال‌سازی
- ساخت `ChannelDirectoryEntry[]`

بازرسی حساب مخصوص کانال و نرمال‌سازی شناسه باید در پیاده‌سازی
Plugin باقی بماند.

## کاتالوگ‌های ارائه‌دهنده

Pluginهای ارائه‌دهنده می‌توانند کاتالوگ‌های مدل را برای inference با
`registerProvider({ catalog: { run(...) { ... } } })` تعریف کنند.

`catalog.run(...)` همان شکلی را برمی‌گرداند که OpenClaw در
`models.providers` می‌نویسد:

- `{ provider }` برای یک ورودی ارائه‌دهنده
- `{ providers }` برای چند ورودی ارائه‌دهنده

وقتی Plugin مالک شناسه‌های مدل مخصوص ارائه‌دهنده، پیش‌فرض‌های URL پایه
یا فراداده مدل وابسته به احراز هویت است، از `catalog` استفاده کنید.

`catalog.order` کنترل می‌کند کاتالوگ یک Plugin نسبت به ارائه‌دهنده‌های ضمنی داخلی OpenClaw
چه زمانی ادغام شود:

- `simple`: ارائه‌دهنده‌های ساده مبتنی بر کلید API یا env
- `profile`: ارائه‌دهنده‌هایی که وقتی پروفایل‌های احراز هویت وجود دارند ظاهر می‌شوند
- `paired`: ارائه‌دهنده‌هایی که چند ورودی ارائه‌دهنده مرتبط را synthesize می‌کنند
- `late`: گذر آخر، پس از سایر ارائه‌دهنده‌های ضمنی

ارائه‌دهنده‌های بعدی هنگام برخورد کلید برنده می‌شوند، بنابراین Pluginها می‌توانند عمداً یک
ورودی ارائه‌دهنده داخلی با همان شناسه ارائه‌دهنده را override کنند.

سازگاری:

- `discovery` همچنان به‌عنوان alias قدیمی کار می‌کند
- اگر هم `catalog` و هم `discovery` ثبت شده باشند، OpenClaw از `catalog` استفاده می‌کند

## بازرسی فقط خواندنی کانال

اگر Plugin شما یک کانال ثبت می‌کند، پیاده‌سازی
`plugin.config.inspectAccount(cfg, accountId)` را در کنار `resolveAccount(...)` ترجیح دهید.

چرا:

- `resolveAccount(...)` مسیر runtime است. مجاز است فرض کند credentials
  کاملاً materialize شده‌اند و وقتی secretهای لازم موجود نیستند سریع fail کند.
- مسیرهای فرمان فقط خواندنی مانند `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` و جریان‌های repair
  doctor/config نباید فقط برای توصیف پیکربندی مجبور باشند credentials runtime را materialize کنند.

رفتار پیشنهادی `inspectAccount(...)`:

- فقط وضعیت توصیفی حساب را برگردانید.
- `enabled` و `configured` را حفظ کنید.
- وقتی مرتبط است، فیلدهای منبع/وضعیت credential را شامل کنید، مانند:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- فقط برای گزارش دسترس‌پذیری فقط خواندنی، لازم نیست مقدارهای خام token را برگردانید.
  برگرداندن `tokenStatus: "available"` (و فیلد منبع متناظر)
  برای فرمان‌های سبک status کافی است.
- وقتی یک credential از طریق SecretRef پیکربندی شده اما
  در مسیر فرمان فعلی در دسترس نیست، از `configured_unavailable` استفاده کنید.

این اجازه می‌دهد فرمان‌های فقط خواندنی به‌جای crash کردن یا گزارش اشتباه حساب به‌عنوان پیکربندی‌نشده،
«پیکربندی‌شده اما در این مسیر فرمان در دسترس نیست» را گزارش کنند.

## بسته‌های پکیج

یک دایرکتوری Plugin ممکن است شامل `package.json` با `openclaw.extensions` باشد:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

هر ورودی به یک Plugin تبدیل می‌شود. اگر pack چند extension فهرست کند، شناسه Plugin
به `name/<fileBase>` تبدیل می‌شود.

اگر Plugin شما وابستگی‌های npm را import می‌کند، آن‌ها را در همان دایرکتوری نصب کنید تا
`node_modules` در دسترس باشد (`npm install` / `pnpm install`).

نرده امنیتی: هر ورودی `openclaw.extensions` پس از resolve شدن symlink باید داخل دایرکتوری Plugin
باقی بماند. ورودی‌هایی که از دایرکتوری package خارج شوند
رد می‌شوند.

یادداشت امنیتی: `openclaw plugins install` وابستگی‌های Plugin را با یک
`npm install --omit=dev --ignore-scripts` محلی پروژه نصب می‌کند (بدون lifecycle scripts،
بدون وابستگی‌های dev در runtime)، و تنظیمات نصب npm سراسری به‌ارث‌رسیده را نادیده می‌گیرد.
درخت‌های وابستگی Plugin را «JS/TS خالص» نگه دارید و از بسته‌هایی که به
ساخت‌های `postinstall` نیاز دارند پرهیز کنید.

اختیاری: `openclaw.setupEntry` می‌تواند به یک ماژول سبک فقط راه‌اندازی اشاره کند.
وقتی OpenClaw برای یک Plugin کانال غیرفعال به سطح‌های راه‌اندازی نیاز دارد، یا
وقتی یک Plugin کانال فعال است اما هنوز پیکربندی نشده، به‌جای ورودی کامل Plugin، `setupEntry`
را بارگذاری می‌کند. این کار startup و setup را سبک‌تر نگه می‌دارد
وقتی ورودی اصلی Plugin شما ابزارها، hookها یا کدهای دیگر فقط runtime را نیز سیم‌کشی می‌کند.

اختیاری: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
می‌تواند یک Plugin کانال را در همان مسیر `setupEntry` در فاز startup پیش از listen کردن gateway قرار دهد،
حتی وقتی کانال از قبل پیکربندی شده است.

فقط وقتی از این استفاده کنید که `setupEntry` سطح startup لازم پیش از
شروع listen کردن gateway را کاملاً پوشش دهد. در عمل، یعنی ورودی setup
باید هر قابلیت متعلق به کانال را که startup به آن وابسته است ثبت کند، مانند:

- خود ثبت کانال
- هر مسیر HTTP که باید پیش از شروع listen کردن gateway در دسترس باشد
- هر متد، ابزار یا سرویس gateway که باید در همان پنجره زمانی وجود داشته باشد

اگر ورودی کامل شما هنوز مالک هر قابلیت startup لازم است، این flag را فعال نکنید.
Plugin را روی رفتار پیش‌فرض نگه دارید و اجازه دهید OpenClaw ورودی کامل را هنگام startup بارگذاری کند.

کانال‌های بسته‌بندی‌شده همچنین می‌توانند کمک‌کننده‌های سطح قرارداد فقط setup منتشر کنند که هسته
پیش از بارگذاری runtime کامل کانال بتواند به آن‌ها رجوع کند. سطح promotion فعلی setup این است:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core زمانی از این سطح استفاده می‌کند که باید پیکربندی channel تک‌حسابی قدیمی را بدون بارگذاری ورودی کامل Plugin به `channels.<id>.accounts.*` ارتقا دهد. Matrix نمونه فعلی bundled است: فقط کلیدهای auth/bootstrap را به یک حساب ارتقایافته نام‌دار منتقل می‌کند، وقتی حساب‌های نام‌دار از قبل وجود دارند، و می‌تواند یک کلید حساب پیش‌فرض غیرمتعارف پیکربندی‌شده را به‌جای اینکه همیشه `accounts.default` بسازد حفظ کند.

این adapterهای patch راه‌اندازی، کشف سطح قرارداد bundled را lazy نگه می‌دارند. زمان import سبک می‌ماند؛ سطح ارتقا فقط هنگام نخستین استفاده بارگذاری می‌شود، نه اینکه هنگام import ماژول دوباره وارد startup channel bundled شود.

وقتی این سطوح startup شامل متدهای RPC مربوط به Gateway هستند، آن‌ها را روی یک پیشوند اختصاصی Plugin نگه دارید. namespaceهای admin مربوط به Core (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) رزرو می‌مانند و همیشه به `operator.admin` resolve می‌شوند، حتی اگر یک Plugin دامنه محدودتری درخواست کند.

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

### فراداده کاتالوگ channel

Pluginهای channel می‌توانند فراداده setup/discovery را از طریق `openclaw.channel` و راهنمایی‌های نصب را از طریق `openclaw.install` اعلام کنند. این کار داده‌های کاتالوگ Core را خالی نگه می‌دارد.

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

- `detailLabel`: برچسب ثانویه برای سطوح کاتالوگ/وضعیت غنی‌تر
- `docsLabel`: بازنویسی متن لینک برای لینک مستندات
- `preferOver`: شناسه‌های Plugin/channel با اولویت پایین‌تر که این ورودی کاتالوگ باید بالاتر از آن‌ها رتبه بگیرد
- `selectionDocsPrefix`، `selectionDocsOmitLabel`، `selectionExtras`: کنترل‌های متن سطح انتخاب
- `markdownCapable`: channel را برای تصمیم‌های قالب‌بندی خروجی به‌عنوان پشتیبان markdown علامت‌گذاری می‌کند
- `exposure.configured`: وقتی روی `false` تنظیم شود، channel را از سطوح فهرست‌کردن channelهای پیکربندی‌شده پنهان می‌کند
- `exposure.setup`: وقتی روی `false` تنظیم شود، channel را از انتخابگرهای تعاملی setup/configure پنهان می‌کند
- `exposure.docs`: channel را برای سطوح ناوبری مستندات به‌عنوان داخلی/خصوصی علامت‌گذاری می‌کند
- `showConfigured` / `showInSetup`: aliasهای قدیمی که هنوز برای سازگاری پذیرفته می‌شوند؛ `exposure` را ترجیح دهید
- `quickstartAllowFrom`: channel را وارد جریان استاندارد quickstart `allowFrom` می‌کند
- `forceAccountBinding`: حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند
- `preferSessionLookupForAnnounceTarget`: هنگام resolve کردن هدف announce، lookup جلسه را ترجیح می‌دهد

OpenClaw همچنین می‌تواند **کاتالوگ‌های channel خارجی** را ادغام کند (برای مثال، export رجیستری MPM). یک فایل JSON را در یکی از مسیرهای زیر قرار دهید:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

یا `OPENCLAW_PLUGIN_CATALOG_PATHS` (یا `OPENCLAW_MPM_CATALOG_PATHS`) را به یک یا چند فایل JSON اشاره دهید (جداشده با comma/semicolon/`PATH`). هر فایل باید شامل `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` باشد. parser همچنین `"packages"` یا `"plugins"` را به‌عنوان aliasهای قدیمی برای کلید `"entries"` می‌پذیرد.

ورودی‌های تولیدشده کاتالوگ channel و ورودی‌های کاتالوگ نصب provider، factهای نرمال‌سازی‌شده منبع نصب را کنار بلوک خام `openclaw.install` در معرض قرار می‌دهند. factهای نرمال‌سازی‌شده مشخص می‌کنند که آیا spec مربوط به npm یک نسخه دقیق است یا selector شناور، آیا فراداده integrity مورد انتظار وجود دارد، و آیا مسیر منبع محلی نیز در دسترس است. وقتی هویت کاتالوگ/بسته شناخته شده باشد، factهای نرمال‌سازی‌شده هشدار می‌دهند اگر نام بسته npm که parse شده از آن هویت منحرف شود. همچنین وقتی `defaultChoice` نامعتبر باشد یا به منبعی اشاره کند که در دسترس نیست، و وقتی فراداده integrity مربوط به npm بدون یک منبع npm معتبر وجود داشته باشد، هشدار می‌دهند. مصرف‌کنندگان باید `installSource` را به‌عنوان یک فیلد اختیاری افزایشی در نظر بگیرند تا ورودی‌های دستی و shimهای کاتالوگ مجبور نباشند آن را بسازند.
این به onboarding و diagnostics اجازه می‌دهد وضعیت source-plane را بدون import کردن runtime Plugin توضیح دهند.

ورودی‌های رسمی npm خارجی باید یک `npmSpec` دقیق به‌همراه `expectedIntegrity` را ترجیح دهند. نام‌های خالی بسته و dist-tagها همچنان برای سازگاری کار می‌کنند، اما هشدارهای source-plane نشان می‌دهند تا کاتالوگ بتواند بدون شکستن Pluginهای موجود به‌سمت نصب‌های pin‌شده و integrity-checked حرکت کند.
وقتی onboarding از یک مسیر کاتالوگ محلی نصب می‌کند، یک ورودی index مربوط به managed Plugin با `source: "path"` و در صورت امکان یک `sourcePath` نسبی به workspace ثبت می‌کند. مسیر بارگذاری عملیاتی absolute در `plugins.load.paths` باقی می‌ماند؛ رکورد نصب از تکرار مسیرهای workstation محلی در پیکربندی بلندمدت جلوگیری می‌کند. این کار نصب‌های توسعه محلی را برای diagnostics مربوط به source-plane قابل مشاهده نگه می‌دارد، بدون اینکه سطح افشای خام دوم برای مسیر filesystem اضافه کند. index پایدار `plugins/installs.json` مربوط به Plugin، منبع حقیقت نصب است و می‌تواند بدون بارگذاری ماژول‌های runtime Plugin به‌روزرسانی شود.
map مربوط به `installRecords` حتی وقتی manifest یک Plugin گم‌شده یا نامعتبر باشد پایدار است؛ آرایه `plugins` آن یک نمای manifest قابل بازسازی است.

## Pluginهای موتور context

Pluginهای موتور context مالک orchestration مربوط به context جلسه برای ingest، assembly و Compaction هستند. آن‌ها را از Plugin خود با `api.registerContextEngine(id, factory)` ثبت کنید، سپس موتور active را با `plugins.slots.contextEngine` انتخاب کنید.

وقتی Plugin شما باید pipeline پیش‌فرض context را جایگزین یا گسترش دهد، به‌جای اینکه فقط memory search یا hook اضافه کند، از این استفاده کنید.

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

factory `ctx` مقدارهای اختیاری `config`، `agentDir` و `workspaceDir` را برای initialization زمان ساخت در معرض قرار می‌دهد.

اگر موتور شما مالک الگوریتم Compaction **نیست**، `compact()` را پیاده‌سازی‌شده نگه دارید و آن را صریح delegate کنید:

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

وقتی یک Plugin به رفتاری نیاز دارد که با API فعلی سازگار نیست، با دسترسی خصوصی به داخل سیستم، سیستم Plugin را دور نزنید. قابلیت گم‌شده را اضافه کنید.

ترتیب پیشنهادی:

1. قرارداد Core را تعریف کنید
   تصمیم بگیرید Core باید مالک چه رفتار مشترکی باشد: policy، fallback، ادغام پیکربندی، lifecycle، semantics رو‌به‌channel، و شکل helper runtime.
2. سطوح ثبت/runtime تایپ‌شده Plugin را اضافه کنید
   `OpenClawPluginApi` و/یا `api.runtime` را با کوچک‌ترین سطح قابلیت تایپ‌شده مفید گسترش دهید.
3. مصرف‌کنندگان Core و channel/feature را سیم‌کشی کنید
   channelها و Pluginهای feature باید قابلیت جدید را از طریق Core مصرف کنند، نه با import مستقیم یک پیاده‌سازی vendor.
4. پیاده‌سازی‌های vendor را ثبت کنید
   سپس Pluginهای vendor backendهای خود را برای آن قابلیت ثبت می‌کنند.
5. پوشش قرارداد اضافه کنید
   test اضافه کنید تا مالکیت و شکل ثبت در طول زمان صریح بماند.

این‌گونه OpenClaw بدون اینکه به جهان‌بینی یک provider خاص hardcode شود، opinionated باقی می‌ماند. برای checklist فایل concrete و نمونه کامل، [کتابچه آشپزی قابلیت](/fa/plugins/architecture) را ببینید.

### checklist قابلیت

وقتی یک قابلیت جدید اضافه می‌کنید، پیاده‌سازی معمولا باید این سطوح را با هم لمس کند:

- typeهای قرارداد Core در `src/<capability>/types.ts`
- runner/helper runtime مربوط به Core در `src/<capability>/runtime.ts`
- سطح ثبت API مربوط به Plugin در `src/plugins/types.ts`
- سیم‌کشی رجیستری Plugin در `src/plugins/registry.ts`
- exposure مربوط به runtime Plugin در `src/plugins/runtime/*` وقتی Pluginهای feature/channel باید آن را مصرف کنند
- helperهای capture/test در `src/test-utils/plugin-registration.ts`
- assertionهای مالکیت/قرارداد در `src/plugins/contracts/registry.ts`
- مستندات operator/Plugin در `docs/`

اگر یکی از این سطوح وجود ندارد، معمولا نشانه این است که قابلیت هنوز کاملا یکپارچه نشده است.

### template قابلیت

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

- Core مالک قرارداد قابلیت + orchestration است
- Pluginهای vendor مالک پیاده‌سازی‌های vendor هستند
- Pluginهای feature/channel helperهای runtime را مصرف می‌کنند
- testهای قرارداد مالکیت را صریح نگه می‌دارند

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) — مدل و شکل‌های قابلیت عمومی
- [زیرمسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths)
- [راه‌اندازی SDK مربوط به Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
