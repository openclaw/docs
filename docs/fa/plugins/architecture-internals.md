---
read_when:
    - پیاده‌سازی هوک‌های زمان اجرای ارائه‌دهنده، چرخهٔ حیات کانال، یا مجموعه‌های بسته
    - اشکال‌زدایی ترتیب بارگذاری Plugin یا وضعیت رجیستری
    - افزودن یک قابلیت Plugin جدید یا Plugin موتور زمینه
summary: 'جزئیات داخلی معماری Plugin: خط لوله بارگذاری، رجیستری، قلاب‌های زمان اجرا، مسیرهای HTTP، و جدول‌های مرجع'
title: جزئیات داخلی معماری Plugin
x-i18n:
    generated_at: "2026-04-29T23:13:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

برای مدل قابلیت عمومی، ساختارهای Plugin، و قراردادهای مالکیت/اجرا،
[معماری Plugin](/fa/plugins/architecture) را ببینید. این صفحه مرجع
سازوکارهای داخلی است: خط لوله بارگذاری، رجیستری، هوک‌های زمان اجرا،
مسیرهای HTTP در Gateway، مسیرهای واردسازی، و جدول‌های schema.

## خط لوله بارگذاری

در زمان راه‌اندازی، OpenClaw تقریباً این کارها را انجام می‌دهد:

1. ریشه‌های نامزد Plugin را کشف می‌کند
2. مانیفست‌های bundle بومی یا سازگار و metadata بسته را می‌خواند
3. نامزدهای ناامن را رد می‌کند
4. پیکربندی Plugin را نرمال‌سازی می‌کند (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. برای هر نامزد درباره فعال‌سازی تصمیم می‌گیرد
6. ماژول‌های بومی فعال‌شده را بارگذاری می‌کند: ماژول‌های bundled ساخته‌شده از loader بومی استفاده می‌کنند؛
   Pluginهای بومی ساخته‌نشده از jiti استفاده می‌کنند
7. هوک‌های بومی `register(api)` را فراخوانی می‌کند و ثبت‌ها را در رجیستری Plugin جمع‌آوری می‌کند
8. رجیستری را در اختیار فرمان‌ها/سطح‌های زمان اجرا می‌گذارد

<Note>
`activate` یک نام مستعار قدیمی برای `register` است — loader هرکدام را که وجود داشته باشد resolve می‌کند (`def.register ?? def.activate`) و آن را در همان نقطه فراخوانی می‌کند. همه Pluginهای bundled از `register` استفاده می‌کنند؛ برای Pluginهای جدید `register` را ترجیح دهید.
</Note>

گیت‌های ایمنی **پیش از** اجرای زمان اجرا اعمال می‌شوند. نامزدها زمانی
مسدود می‌شوند که entry از ریشه Plugin خارج شود، مسیر برای همه قابل نوشتن
باشد، یا مالکیت مسیر برای Pluginهای غیر-bundled مشکوک به نظر برسد.

### رفتار با اولویت مانیفست

مانیفست منبع حقیقت صفحه کنترل است. OpenClaw از آن برای این موارد استفاده می‌کند:

- شناسایی Plugin
- کشف کانال‌ها/Skills/schema پیکربندی یا قابلیت‌های bundle اعلام‌شده
- اعتبارسنجی `plugins.entries.<id>.config`
- تکمیل برچسب‌ها/placeholderهای رابط کاربری کنترل
- نمایش metadata نصب/کاتالوگ
- نگه داشتن توصیفگرهای سبک فعال‌سازی و setup بدون بارگذاری زمان اجرای Plugin

برای Pluginهای بومی، ماژول زمان اجرا بخش صفحه داده است. این ماژول
رفتار واقعی مانند هوک‌ها، ابزارها، فرمان‌ها، یا جریان‌های ارائه‌دهنده را ثبت می‌کند.

بلوک‌های اختیاری `activation` و `setup` در مانیفست روی صفحه کنترل می‌مانند.
آن‌ها توصیفگرهای صرفاً metadata برای برنامه‌ریزی فعال‌سازی و کشف setup هستند؛
جایگزین ثبت زمان اجرا، `register(...)`، یا `setupEntry` نمی‌شوند.
نخستین مصرف‌کنندگان فعال‌سازی زنده اکنون از راهنماهای فرمان، کانال، و ارائه‌دهنده در مانیفست
برای محدود کردن بارگذاری Plugin پیش از materialization گسترده‌تر رجیستری استفاده می‌کنند:

- بارگذاری CLI به Pluginهایی محدود می‌شود که مالک فرمان اصلی درخواست‌شده هستند
- resolution مربوط به setup کانال/Plugin به Pluginهایی محدود می‌شود که مالک
  شناسه کانال درخواست‌شده هستند
- resolution صریح setup/زمان اجرای ارائه‌دهنده به Pluginهایی محدود می‌شود که مالک
  شناسه ارائه‌دهنده درخواست‌شده هستند
- برنامه‌ریزی راه‌اندازی Gateway از `activation.onStartup` برای واردسازی‌های صریح هنگام راه‌اندازی
  و انصراف‌های راه‌اندازی استفاده می‌کند؛ هر Plugin باید آن را اعلام کند، چون OpenClaw
  از واردسازی‌های ضمنی هنگام راه‌اندازی فاصله می‌گیرد، درحالی‌که Pluginهایی که metadata
  قابلیت ایستا و `activation.onStartup` ندارند هنوز برای سازگاری از fallback سایدکار
  ضمنی منسوخ‌شده راه‌اندازی استفاده می‌کنند

برنامه‌ریز فعال‌سازی هم یک API فقط-شناسه برای فراخوان‌های موجود و هم یک
API برنامه برای diagnostics جدید ارائه می‌کند. entryهای برنامه گزارش می‌دهند که چرا یک Plugin انتخاب شده است
و راهنماهای صریح برنامه‌ریز `activation.*` را از fallback مالکیت مانیفست
مانند `providers`، `channels`، `commandAliases`، `setup.providers`،
`contracts.tools`، و هوک‌ها جدا می‌کنند. این تفکیک دلیل مرز سازگاری است:
metadata موجود Plugin همچنان کار می‌کند، درحالی‌که کد جدید می‌تواند راهنماهای گسترده
یا رفتار fallback را بدون تغییر دادن معناشناسی بارگذاری زمان اجرا تشخیص دهد.

کشف setup اکنون شناسه‌های متعلق به توصیفگر مانند `setup.providers` و
`setup.cliBackends` را ترجیح می‌دهد تا Pluginهای نامزد را پیش از fallback به
`setup-api` برای Pluginهایی که هنوز به هوک‌های زمان اجرای هنگام setup نیاز دارند محدود کند. فهرست‌های
setup ارائه‌دهنده از `providerAuthChoices` مانیفست، choiceهای setup مشتق‌شده از توصیفگر،
و metadata کاتالوگ نصب بدون بارگذاری زمان اجرای ارائه‌دهنده استفاده می‌کنند. مقدار صریح
`setup.requiresRuntime: false` یک مرز توقف فقط-توصیفگر است؛ حذف
`requiresRuntime` برای سازگاری fallback قدیمی setup-api را حفظ می‌کند. اگر بیش از
یک Plugin کشف‌شده همان شناسه نرمال‌شده ارائه‌دهنده setup یا backend مربوط به CLI
را ادعا کند، lookup setup به‌جای تکیه بر ترتیب کشف، مالک مبهم را رد می‌کند. وقتی
زمان اجرای setup اجرا می‌شود، diagnostics رجیستری drift بین `setup.providers` /
`setup.cliBackends` و ارائه‌دهنده‌ها یا backendهای CLI ثبت‌شده توسط setup-api را
بدون مسدود کردن Pluginهای قدیمی گزارش می‌دهد.

### مرز کش Plugin

OpenClaw نتایج کشف Plugin یا داده مستقیم رجیستری مانیفست را پشت پنجره‌های
زمانی مبتنی بر ساعت واقعی کش نمی‌کند. نصب‌ها، ویرایش‌های مانیفست، و تغییرات load-path
باید در خواندن صریح بعدی metadata یا بازسازی snapshot بعدی قابل مشاهده شوند.
parser فایل مانیفست ممکن است یک کش محدود امضای فایل نگه دارد که با مسیر
مانیفست بازشده، inode، اندازه، و timestampها کلیدگذاری شده است؛ آن کش فقط از
parse دوباره byteهای بدون تغییر جلوگیری می‌کند و نباید پاسخ‌های کشف، رجیستری، مالک، یا
policy را کش کند.

مسیر سریع metadata امن، مالکیت صریح شیء است، نه یک کش پنهان.
مسیرهای داغ راه‌اندازی Gateway باید `PluginMetadataSnapshot` فعلی،
`PluginLookUpTable` مشتق‌شده، یا یک رجیستری صریح مانیفست را از زنجیره
فراخوانی عبور دهند. اعتبارسنجی پیکربندی، فعال‌سازی خودکار هنگام راه‌اندازی، bootstrap Plugin، و انتخاب
ارائه‌دهنده می‌توانند این شیءها را تا وقتی نماینده پیکربندی و موجودی فعلی
Plugin هستند دوباره استفاده کنند. lookup مربوط به setup همچنان metadata مانیفست را در صورت نیاز
بازسازی می‌کند، مگر اینکه مسیر setup مشخص یک رجیستری صریح مانیفست دریافت کند؛ این را
به‌عنوان fallback مسیر سرد نگه دارید، نه اینکه کش‌های پنهان lookup اضافه کنید. وقتی ورودی
تغییر می‌کند، به‌جای mutate کردن snapshot یا نگه داشتن کپی‌های تاریخی، آن را بازسازی و جایگزین کنید.
نماهای روی رجیستری فعال Plugin و helperهای bootstrap کانال bundled
باید از رجیستری/ریشه فعلی دوباره محاسبه شوند. mapهای کوتاه‌عمر برای حذف کار
تکراری یا محافظت از reentry درون یک فراخوانی مشکلی ندارند؛ آن‌ها نباید به کش‌های
metadata فرایند تبدیل شوند.

برای بارگذاری Plugin، لایه کش پایدار همان بارگذاری زمان اجرا است. وقتی کد یا artifactهای
نصب‌شده واقعاً بارگذاری می‌شوند، می‌تواند وضعیت loader را دوباره استفاده کند، مانند:

- `PluginLoaderCacheState` و رجیستری‌های فعال زمان اجرای سازگار
- کش‌های jiti/module و کش‌های loader سطح عمومی که برای جلوگیری از واردسازی
  مکرر همان سطح زمان اجرا استفاده می‌شوند
- mirrorهای وابستگی زمان اجرا و کش‌های filesystem برای artifactهای نصب‌شده Plugin
- mapهای کوتاه‌عمر در هر فراخوانی برای نرمال‌سازی مسیر یا resolution موارد تکراری

این کش‌ها جزئیات پیاده‌سازی صفحه داده هستند. آن‌ها نباید به پرسش‌های
صفحه کنترل مانند «کدام Plugin مالک این ارائه‌دهنده است؟» پاسخ دهند، مگر اینکه
فراخوان عمداً بارگذاری زمان اجرا را درخواست کرده باشد.

کش‌های پایدار یا مبتنی بر ساعت واقعی را برای این موارد اضافه نکنید:

- نتایج کشف
- رجیستری‌های مستقیم مانیفست
- رجیستری‌های مانیفست بازسازی‌شده از index نصب‌شده Plugin
- lookup مالک ارائه‌دهنده، suppression مدل، policy ارائه‌دهنده، یا metadata
  artifact عمومی
- هر پاسخ دیگر مشتق‌شده از مانیفست که در آن یک مانیفست تغییرکرده، index نصب‌شده،
  یا load path باید در خواندن بعدی metadata قابل مشاهده باشد

فراخوان‌هایی که metadata مانیفست را از index نصب‌شده و persisted Plugin
بازسازی می‌کنند، آن رجیستری را در صورت نیاز بازسازی می‌کنند. index نصب‌شده وضعیت پایدار
صفحه منبع است؛ این یک کش پنهان metadata درون فرایند نیست.

## مدل رجیستری

Pluginهای بارگذاری‌شده متغیرهای سراسری دلخواه هسته را مستقیماً mutate نمی‌کنند. آن‌ها در یک
رجیستری مرکزی Plugin ثبت می‌شوند.

رجیستری این موارد را ردیابی می‌کند:

- رکوردهای Plugin (هویت، منبع، origin، وضعیت، diagnostics)
- ابزارها
- هوک‌های قدیمی و هوک‌های تایپ‌شده
- کانال‌ها
- ارائه‌دهنده‌ها
- handlerهای RPC مربوط به Gateway
- مسیرهای HTTP
- registrarهای CLI
- سرویس‌های پس‌زمینه
- فرمان‌های متعلق به Plugin

سپس قابلیت‌های هسته به‌جای صحبت مستقیم با ماژول‌های Plugin، از آن رجیستری می‌خوانند.
این کار بارگذاری را یک‌طرفه نگه می‌دارد:

- ماژول Plugin -> ثبت در رجیستری
- زمان اجرای هسته -> مصرف رجیستری

این جداسازی برای نگهداشت‌پذیری مهم است. یعنی بیشتر سطح‌های هسته فقط
به یک نقطه یکپارچه‌سازی نیاز دارند: «رجیستری را بخوان»، نه «برای هر ماژول
Plugin حالت خاص بساز».

## callbackهای اتصال مکالمه

Pluginهایی که یک مکالمه را bind می‌کنند می‌توانند وقتی یک approval resolve می‌شود واکنش نشان دهند.

برای دریافت callback پس از تأیید یا رد شدن درخواست bind از
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

فیلدهای payload مربوط به callback:

- `status`: `"approved"` یا `"denied"`
- `decision`: `"allow-once"`، `"allow-always"`، یا `"deny"`
- `binding`: binding resolve‌شده برای درخواست‌های تأییدشده
- `request`: خلاصه درخواست اصلی، hint جداسازی، شناسه فرستنده، و
  metadata مکالمه

این callback فقط برای اعلان است. این callback تغییر نمی‌دهد چه کسی مجاز است یک
مکالمه را bind کند، و پس از پایان پردازش approval در هسته اجرا می‌شود.

## هوک‌های زمان اجرای ارائه‌دهنده

Pluginهای ارائه‌دهنده سه لایه دارند:

- **metadata مانیفست** برای lookup ارزان پیش از زمان اجرا:
  `setup.providers[].envVars`، سازگاری منسوخ‌شده `providerAuthEnvVars`،
  `providerAuthAliases`، `providerAuthChoices`، و `channelEnvVars`.
- **هوک‌های زمان پیکربندی**: `catalog` (`discovery` قدیمی) به‌علاوه
  `applyConfigDefaults`.
- **هوک‌های زمان اجرا**: بیش از 40 هوک اختیاری که auth، resolution مدل،
  wrap کردن stream، سطح‌های thinking، policy بازپخش، و endpointهای usage را پوشش می‌دهند. فهرست
  کامل را زیر [ترتیب و کاربرد هوک‌ها](#hook-order-and-usage) ببینید.

OpenClaw همچنان مالک حلقه عمومی agent، failover، مدیریت transcript، و
policy ابزار است. این هوک‌ها سطح توسعه‌پذیری برای رفتار ویژه ارائه‌دهنده هستند
بدون اینکه به یک transport کاملاً سفارشی برای inference نیاز باشد.

زمانی از `setup.providers[].envVars` مانیفست استفاده کنید که ارائه‌دهنده credentialهای مبتنی بر env دارد
که مسیرهای عمومی auth/status/model-picker باید بدون بارگذاری زمان اجرای Plugin ببینند.
`providerAuthEnvVars` منسوخ‌شده همچنان در پنجره deprecation توسط adapter سازگاری خوانده می‌شود،
و Pluginهای غیر-bundled که از آن استفاده می‌کنند یک diagnostic مانیفست دریافت می‌کنند. زمانی از
`providerAuthAliases` مانیفست استفاده کنید که یک شناسه ارائه‌دهنده باید env varهای یک شناسه ارائه‌دهنده دیگر،
profileهای auth، auth مبتنی بر پیکربندی، و choice راه‌اندازی اولیه کلید API را دوباره استفاده کند. زمانی از مانیفست
`providerAuthChoices` استفاده کنید که سطح‌های CLI مربوط به onboarding/auth-choice باید
شناسه choice ارائه‌دهنده، برچسب‌های گروه، و wiring ساده auth با یک flag را بدون
بارگذاری زمان اجرای ارائه‌دهنده بدانند. `envVars` زمان اجرای ارائه‌دهنده را برای hintهای
روبه‌روی اپراتور مانند برچسب‌های onboarding یا متغیرهای setup مربوط به client-id/client-secret در OAuth
نگه دارید.

زمانی از `channelEnvVars` مانیفست استفاده کنید که یک کانال auth یا setup مبتنی بر env دارد که
fallback عمومی shell-env، بررسی‌های config/status، یا promptهای setup باید
بدون بارگذاری زمان اجرای کانال ببینند.

### ترتیب و کاربرد هوک‌ها

برای Pluginهای مدل/ارائه‌دهنده، OpenClaw هوک‌ها را تقریباً به این ترتیب فراخوانی می‌کند.
ستون «زمان استفاده» راهنمای سریع تصمیم‌گیری است.
فیلدهای صرفاً سازگاری ارائه‌دهنده که OpenClaw دیگر فراخوانی نمی‌کند، مانند
`ProviderPlugin.capabilities` و `suppressBuiltInModel`، عمداً اینجا
فهرست نشده‌اند.

| #   | قلاب                              | کاری که انجام می‌دهد                                                                                                   | زمان استفاده                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | پیکربندی ارائه‌دهنده را هنگام تولید `models.json` در `models.providers` منتشر می‌کند                                | ارائه‌دهنده مالک کاتالوگ یا پیش‌فرض‌های URL پایه است                                                                                                  |
| 2   | `applyConfigDefaults`             | پیش‌فرض‌های پیکربندی سراسریِ متعلق به ارائه‌دهنده را هنگام مادی‌سازی پیکربندی اعمال می‌کند                                      | پیش‌فرض‌ها به حالت احراز هویت، env، یا معناشناسی خانواده مدلِ ارائه‌دهنده وابسته‌اند                                                                         |
| --  | _(جست‌وجوی داخلی مدل)_         | OpenClaw ابتدا مسیر عادی رجیستری/کاتالوگ را امتحان می‌کند                                                          | _(قلاب Plugin نیست)_                                                                                                                         |
| 3   | `normalizeModelId`                | نام‌های مستعار قدیمی یا پیش‌نمایشی شناسه مدل را پیش از جست‌وجو نرمال می‌کند                                                     | ارائه‌دهنده مالک پاک‌سازی نام مستعار پیش از تفکیک مدل کانونیکال است                                                                                 |
| 4   | `normalizeTransport`              | `api` / `baseUrl` خانواده ارائه‌دهنده را پیش از سرهم‌بندی عمومی مدل نرمال می‌کند                                      | ارائه‌دهنده مالک پاک‌سازی انتقال برای شناسه‌های سفارشی ارائه‌دهنده در همان خانواده انتقال است                                                          |
| 5   | `normalizeConfig`                 | `models.providers.<id>` را پیش از تفکیک زمان اجرا/ارائه‌دهنده نرمال می‌کند                                           | ارائه‌دهنده به پاک‌سازی پیکربندی نیاز دارد که باید با Plugin زندگی کند؛ کمک‌کننده‌های همراه خانواده Google نیز ورودی‌های پیکربندی پشتیبانی‌شده Google را پشتیبانی تکمیلی می‌کنند   |
| 6   | `applyNativeStreamingUsageCompat` | بازنویسی‌های سازگاری مصرف پخش جریانی بومی را روی ارائه‌دهندگان پیکربندی اعمال می‌کند                                               | ارائه‌دهنده به اصلاحات فراداده مصرف پخش جریانی بومیِ مبتنی بر endpoint نیاز دارد                                                                          |
| 7   | `resolveConfigApiKey`             | احراز هویت نشانگر env را برای ارائه‌دهندگان پیکربندی پیش از بارگذاری احراز هویت زمان اجرا تفکیک می‌کند                                       | ارائه‌دهنده تفکیک کلید API نشانگر env متعلق به خود را دارد؛ `amazon-bedrock` نیز اینجا یک تفکیک‌کننده داخلی نشانگر env مربوط به AWS دارد                  |
| 8   | `resolveSyntheticAuth`            | احراز هویت محلی/خودمیزبان یا مبتنی بر پیکربندی را بدون ماندگار کردن متن ساده سطح‌دهی می‌کند                                   | ارائه‌دهنده می‌تواند با یک نشانگر اعتبارنامه مصنوعی/محلی کار کند                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | پروفایل‌های احراز هویت خارجیِ متعلق به ارائه‌دهنده را روی هم می‌گذارد؛ `persistence` پیش‌فرض برای اعتبارنامه‌های متعلق به CLI/برنامه برابر `runtime-only` است | ارائه‌دهنده از اعتبارنامه‌های احراز هویت خارجی بدون ماندگار کردن توکن‌های refresh کپی‌شده دوباره استفاده می‌کند؛ `contracts.externalAuthProviders` را در manifest اعلام کنید |
| 10  | `shouldDeferSyntheticProfileAuth` | جای‌نگهدارهای پروفایل مصنوعی ذخیره‌شده را پشت احراز هویت مبتنی بر env/پیکربندی پایین‌تر می‌برد                                      | ارائه‌دهنده پروفایل‌های جای‌نگهدار مصنوعی ذخیره می‌کند که نباید در تقدم برنده شوند                                                                 |
| 11  | `resolveDynamicModel`             | پشتیبان همگام برای شناسه‌های مدلِ متعلق به ارائه‌دهنده که هنوز در رجیستری محلی نیستند                                       | ارائه‌دهنده شناسه‌های مدل upstream دلخواه را می‌پذیرد                                                                                                 |
| 12  | `prepareDynamicModel`             | گرم‌سازی ناهمگام، سپس `resolveDynamicModel` دوباره اجرا می‌شود                                                           | ارائه‌دهنده پیش از تفکیک شناسه‌های ناشناخته به فراداده شبکه نیاز دارد                                                                                  |
| 13  | `normalizeResolvedModel`          | بازنویسی نهایی پیش از آنکه runner تعبیه‌شده از مدل تفکیک‌شده استفاده کند                                               | ارائه‌دهنده به بازنویسی‌های انتقال نیاز دارد اما همچنان از یک انتقال هسته استفاده می‌کند                                                                             |
| 14  | `contributeResolvedModelCompat`   | پرچم‌های سازگاری را برای مدل‌های فروشنده پشت یک انتقال سازگار دیگر اضافه می‌کند                                  | ارائه‌دهنده مدل‌های خودش را روی انتقال‌های پروکسی بدون در اختیار گرفتن ارائه‌دهنده تشخیص می‌دهد                                                       |
| 15  | `normalizeToolSchemas`            | schemaهای ابزار را پیش از آنکه runner تعبیه‌شده آن‌ها را ببیند نرمال می‌کند                                                    | ارائه‌دهنده به پاک‌سازی schema خانواده انتقال نیاز دارد                                                                                                |
| 16  | `inspectToolSchemas`              | عیب‌یابی‌های schema متعلق به ارائه‌دهنده را پس از نرمال‌سازی سطح‌دهی می‌کند                                                  | ارائه‌دهنده هشدارهای کلیدواژه‌ای می‌خواهد بدون اینکه قوانین خاص ارائه‌دهنده به هسته آموزش داده شود                                                                 |
| 17  | `resolveReasoningOutputMode`      | قرارداد خروجی reasoning بومی در برابر برچسب‌دار را انتخاب می‌کند                                                              | ارائه‌دهنده به reasoning/خروجی نهایی برچسب‌دار به جای فیلدهای بومی نیاز دارد                                                                         |
| 18  | `prepareExtraParams`              | نرمال‌سازی پارامترهای درخواست پیش از wrapperهای عمومی گزینه stream                                              | ارائه‌دهنده به پارامترهای درخواست پیش‌فرض یا پاک‌سازی پارامتر به ازای هر ارائه‌دهنده نیاز دارد                                                                           |
| 19  | `createStreamFn`                  | مسیر عادی stream را به طور کامل با یک انتقال سفارشی جایگزین می‌کند                                                   | ارائه‌دهنده به پروتکل سیمی سفارشی نیاز دارد، نه فقط یک wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | wrapper مربوط به stream پس از اعمال wrapperهای عمومی                                                              | ارائه‌دهنده به wrapperهای سازگاری header/body/model درخواست بدون انتقال سفارشی نیاز دارد                                                          |
| 21  | `resolveTransportTurnState`       | headerها یا فراداده‌های انتقال بومیِ مخصوص هر نوبت را پیوست می‌کند                                                           | ارائه‌دهنده می‌خواهد انتقال‌های عمومی هویت نوبت بومیِ ارائه‌دهنده را ارسال کنند                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | headerهای WebSocket بومی یا سیاست cool-down جلسه را پیوست می‌کند                                                    | ارائه‌دهنده می‌خواهد انتقال‌های عمومی WS، headerهای جلسه یا سیاست fallback را تنظیم کنند                                                               |
| 23  | `formatApiKey`                    | قالب‌ساز پروفایل احراز هویت: پروفایل ذخیره‌شده به رشته `apiKey` زمان اجرا تبدیل می‌شود                                     | ارائه‌دهنده فراداده احراز هویت اضافی ذخیره می‌کند و به شکل توکن زمان اجرای سفارشی نیاز دارد                                                                    |
| 24  | `refreshOAuth`                    | بازنویسی refresh OAuth برای endpointهای refresh سفارشی یا سیاست شکست refresh                                  | ارائه‌دهنده با refreshکننده‌های مشترک `pi-ai` سازگار نیست                                                                                           |
| 25  | `buildAuthDoctorHint`             | راهنمای تعمیر که هنگام شکست refresh OAuth افزوده می‌شود                                                                  | ارائه‌دهنده پس از شکست refresh به راهنمای تعمیر احراز هویت متعلق به ارائه‌دهنده نیاز دارد                                                                      |
| 26  | `matchesContextOverflowError`     | تطبیق‌دهنده سرریز پنجره context متعلق به ارائه‌دهنده                                                                 | ارائه‌دهنده خطاهای خام سرریز دارد که heuristicهای عمومی آن‌ها را از دست می‌دهند                                                                                |
| 27  | `classifyFailoverReason`          | طبقه‌بندی دلیل failover متعلق به ارائه‌دهنده                                                                  | ارائه‌دهنده می‌تواند خطاهای خام API/انتقال را به rate-limit/overload/و غیره نگاشت کند                                                                          |
| 28  | `isCacheTtlEligible`              | سیاست prompt-cache برای ارائه‌دهندگان پروکسی/backhaul                                                               | ارائه‌دهنده به gating زمان ماندگاری cache خاص پروکسی نیاز دارد                                                                                                |
| 29  | `buildMissingAuthMessage`         | جایگزین پیام عمومی بازیابی احراز هویتِ مفقود                                                      | ارائه‌دهنده به راهنمای بازیابی احراز هویت مفقودِ خاص ارائه‌دهنده نیاز دارد                                                                                 |
| 30  | `augmentModelCatalog`             | ردیف‌های کاتالوگ مصنوعی/نهایی که پس از discovery افزوده می‌شوند                                                          | ارائه‌دهنده به ردیف‌های سازگاری رو به جلو مصنوعی در `models list` و انتخاب‌گرها نیاز دارد                                                                     |
| 31  | `resolveThinkingProfile`          | مجموعه سطح `/think` خاص مدل، برچسب‌های نمایش، و پیش‌فرض                                                 | ارائه‌دهنده برای مدل‌های انتخاب‌شده یک نردبان thinking سفارشی یا برچسب دودویی ارائه می‌کند                                                                 |
| 32  | `isBinaryThinking`                | قلاب سازگاری toggle reasoning روشن/خاموش                                                                     | ارائه‌دهنده فقط thinking دودویی روشن/خاموش ارائه می‌کند                                                                                                  |
| 33  | `supportsXHighThinking`           | قلاب سازگاری پشتیبانی reasoning با `xhigh`                                                                   | ارائه‌دهنده `xhigh` را فقط روی زیرمجموعه‌ای از مدل‌ها می‌خواهد                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | قلاب سازگاری سطح پیش‌فرض `/think`                                                                      | ارائه‌دهنده مالک سیاست پیش‌فرض `/think` برای یک خانواده مدل است                                                                                      |
| 35  | `isModernModelRef`                | تطبیق‌دهنده مدل مدرن برای فیلترهای پروفایل زنده و انتخاب smoke                                              | ارائه‌دهنده مالک تطبیق مدل ترجیحی live/smoke است                                                                                             |
| 36  | `prepareRuntimeAuth`              | یک اعتبارنامه پیکربندی‌شده را درست پیش از inference به توکن/کلید واقعی زمان اجرا تبدیل می‌کند                       | ارائه‌دهنده به تبادل توکن یا اعتبارنامه درخواست کوتاه‌عمر نیاز دارد                                                                             |
| 37  | `resolveUsageAuth`                | احراز هویت اعتبارنامه‌های استفاده/صورتحساب را برای `/usage` و سطوح وضعیت مرتبط حل می‌کند                                     | ارائه‌دهنده به تجزیهٔ سفارشی توکن استفاده/سهمیه یا اعتبارنامهٔ استفادهٔ متفاوتی نیاز دارد                                                               |
| 38  | `fetchUsageSnapshot`              | پس از حل شدن احراز هویت، نماهای لحظه‌ای استفاده/سهمیهٔ ویژهٔ ارائه‌دهنده را دریافت و نرمال‌سازی می‌کند                             | ارائه‌دهنده به endpoint استفادهٔ ویژهٔ ارائه‌دهنده یا تجزیه‌گر payload نیاز دارد                                                                           |
| 39  | `createEmbeddingProvider`         | یک آداپتور embedding متعلق به ارائه‌دهنده برای حافظه/جست‌وجو می‌سازد                                                     | رفتار embedding حافظه متعلق به Plugin ارائه‌دهنده است                                                                                    |
| 40  | `buildReplayPolicy`               | یک سیاست replay برمی‌گرداند که مدیریت رونوشت را برای ارائه‌دهنده کنترل می‌کند                                        | ارائه‌دهنده به سیاست سفارشی رونوشت نیاز دارد (برای مثال، حذف بلوک‌های تفکر)                                                               |
| 41  | `sanitizeReplayHistory`           | پس از پاک‌سازی عمومی رونوشت، تاریخچهٔ replay را بازنویسی می‌کند                                                        | ارائه‌دهنده به بازنویسی‌های replay ویژهٔ ارائه‌دهنده فراتر از کمک‌کننده‌های مشترک Compaction نیاز دارد                                                             |
| 42  | `validateReplayTurns`             | اعتبارسنجی نهایی نوبت‌های replay یا بازشکل‌دهی آن‌ها پیش از runner تعبیه‌شده                                           | انتقال ارائه‌دهنده پس از پاک‌سازی عمومی به اعتبارسنجی سخت‌گیرانه‌تر نوبت‌ها نیاز دارد                                                                    |
| 43  | `onModelSelected`                 | اثرات جانبی پس از انتخاب، متعلق به ارائه‌دهنده را اجرا می‌کند                                                                 | ارائه‌دهنده هنگام فعال شدن یک مدل به تله‌متری یا وضعیت متعلق به ارائه‌دهنده نیاز دارد                                                                  |

`normalizeModelId`، `normalizeTransport` و `normalizeConfig` ابتدا Plugin ارائه‌دهندهٔ
مطابق را بررسی می‌کنند، سپس میان سایر Pluginهای ارائه‌دهندهٔ دارای hook پیش می‌روند
تا یکی از آن‌ها واقعا شناسهٔ مدل یا transport/config را تغییر دهد. این کار باعث می‌شود
shimهای alias/compat ارائه‌دهنده بدون نیاز به اینکه فراخواننده بداند کدام Plugin
باندل‌شده مالک بازنویسی است، کار کنند. اگر هیچ hook ارائه‌دهنده‌ای یک ورودی
پیکربندی پشتیبانی‌شده از خانوادهٔ Google را بازنویسی نکند، نرمال‌ساز پیکربندی
Google باندل‌شده همچنان آن پاک‌سازی سازگاری را اعمال می‌کند.

اگر ارائه‌دهنده به یک پروتکل ارتباطی کاملا سفارشی یا اجراکنندهٔ درخواست سفارشی نیاز
داشته باشد، این یک کلاس متفاوت از افزونه است. این hookها برای رفتار ارائه‌دهنده‌ای
هستند که همچنان روی حلقهٔ استنتاج عادی OpenClaw اجرا می‌شود.

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

Pluginهای ارائه‌دهندهٔ باندل‌شده hookهای بالا را ترکیب می‌کنند تا با نیازهای کاتالوگ،
احراز هویت، تفکر، بازپخش و مصرف هر فروشنده هماهنگ شوند. مجموعهٔ معتبر hookها همراه
با هر Plugin زیر `extensions/` قرار دارد؛ این صفحه شکل‌ها را نشان می‌دهد، نه اینکه
فهرست را عینا بازتاب دهد.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter، Kilocode، Z.AI و xAI، `catalog` را همراه با
    `resolveDynamicModel` / `prepareDynamicModel` ثبت می‌کنند تا بتوانند شناسه‌های
    مدل بالادستی را جلوتر از کاتالوگ ایستای OpenClaw عرضه کنند.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot، Gemini CLI، ChatGPT Codex، MiniMax، Xiaomi و z.ai،
    `prepareRuntimeAuth` یا `formatApiKey` را با `resolveUsageAuth` +
    `fetchUsageSnapshot` جفت می‌کنند تا تبادل توکن و یکپارچه‌سازی `/usage` را مالک شوند.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    خانواده‌های نام‌دار مشترک (`google-gemini`، `passthrough-gemini`،
    `anthropic-by-model`، `hybrid-anthropic-openai`) به ارائه‌دهندگان اجازه می‌دهند
    به‌جای اینکه هر Plugin پاک‌سازی را دوباره پیاده‌سازی کند، از طریق
    `buildReplayPolicy` وارد سیاست transcript شوند.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`، `cloudflare-ai-gateway`، `huggingface`، `kimi-coding`، `nvidia`،
    `qianfan`، `synthetic`، `together`، `venice`، `vercel-ai-gateway` و
    `volcengine` فقط `catalog` را ثبت می‌کنند و از حلقهٔ استنتاج مشترک استفاده می‌کنند.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    headerهای بتا، `/fast` / `serviceTier` و `context1m` داخل مرز عمومی
    `api.ts` / `contract-api.ts` متعلق به Plugin Anthropic قرار دارند
    (`wrapAnthropicProviderStream`، `resolveAnthropicBetas`،
    `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`) و نه در SDK عمومی.
  </Accordion>
</AccordionGroup>

## helperهای runtime

Pluginها می‌توانند از طریق `api.runtime` به helperهای منتخب core دسترسی داشته باشند. برای TTS:

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
- از پیکربندی `messages.tts` و انتخاب ارائه‌دهنده در core استفاده می‌کند.
- بافر صوتی PCM + نرخ نمونه‌برداری را برمی‌گرداند. Pluginها باید برای ارائه‌دهندگان resample/encode کنند.
- `listVoices` برای هر ارائه‌دهنده اختیاری است. از آن برای voice pickerها یا جریان‌های راه‌اندازی متعلق به فروشنده استفاده کنید.
- فهرست‌های صدا می‌توانند فرادادهٔ غنی‌تری مانند locale، جنسیت و برچسب‌های شخصیت برای pickerهای آگاه از ارائه‌دهنده داشته باشند.
- OpenAI و ElevenLabs امروز از telephony پشتیبانی می‌کنند. Microsoft پشتیبانی نمی‌کند.

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

- سیاست TTS، fallback و تحویل پاسخ را در core نگه دارید.
- از ارائه‌دهندگان گفتار برای رفتار synthesis متعلق به فروشنده استفاده کنید.
- ورودی legacy Microsoft `edge` به شناسهٔ ارائه‌دهندهٔ `microsoft` نرمال می‌شود.
- مدل مالکیت ترجیحی شرکت‌محور است: یک Plugin فروشنده می‌تواند مالک ارائه‌دهندگان متن، گفتار، تصویر و رسانه‌های آینده باشد، هم‌زمان با اینکه OpenClaw آن قراردادهای قابلیت را اضافه می‌کند.

برای فهم تصویر/صوت/ویدئو، Pluginها به‌جای یک کیسهٔ عمومی key/value، یک ارائه‌دهندهٔ
media-understanding نوع‌دار ثبت می‌کنند:

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

- ارکستراسیون، fallback، پیکربندی و سیم‌کشی channel را در core نگه دارید.
- رفتار فروشنده را در Plugin ارائه‌دهنده نگه دارید.
- گسترش افزایشی باید نوع‌دار بماند: متدهای اختیاری جدید، فیلدهای نتیجهٔ اختیاری جدید، قابلیت‌های اختیاری جدید.
- تولید ویدئو همین حالا هم از همان الگو پیروی می‌کند:
  - core مالک قرارداد قابلیت و helper runtime است
  - Pluginهای فروشنده `api.registerVideoGenerationProvider(...)` را ثبت می‌کنند
  - Pluginهای feature/channel از `api.runtime.videoGeneration.*` مصرف می‌کنند

برای helperهای runtime مربوط به media-understanding، Pluginها می‌توانند فراخوانی کنند:

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

برای transcription صوتی، Pluginها می‌توانند از runtime مربوط به media-understanding
یا alias قدیمی‌تر STT استفاده کنند:

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
- از پیکربندی صوتی media-understanding در core (`tools.media.audio`) و ترتیب fallback ارائه‌دهنده استفاده می‌کند.
- وقتی هیچ خروجی transcription تولید نشود، `{ text: undefined }` را برمی‌گرداند (مثلا ورودی ردشده/پشتیبانی‌نشده).
- `api.runtime.stt.transcribeAudioFile(...)` به‌عنوان alias سازگاری باقی می‌ماند.

Pluginها همچنین می‌توانند اجرای subagent پس‌زمینه را از طریق `api.runtime.subagent` راه‌اندازی کنند:

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

- `provider` و `model` overrideهای اختیاری برای هر اجرا هستند، نه تغییرات پایدار session.
- OpenClaw فقط برای فراخواننده‌های مورد اعتماد به این فیلدهای override احترام می‌گذارد.
- برای اجراهای fallback متعلق به Plugin، operatorها باید با `plugins.entries.<id>.subagent.allowModelOverride: true` opt in کنند.
- از `plugins.entries.<id>.subagent.allowedModels` برای محدود کردن Pluginهای مورد اعتماد به هدف‌های canonical مشخص `provider/model` استفاده کنید، یا از `"*"` برای مجاز کردن صریح هر هدفی استفاده کنید.
- اجراهای subagent متعلق به Plugin نامعتبر همچنان کار می‌کنند، اما درخواست‌های override به‌جای fallback بی‌صدا رد می‌شوند.
- sessionهای subagent ساخته‌شده توسط Plugin با شناسهٔ Plugin سازنده tag می‌شوند. fallback `api.runtime.subagent.deleteSession(...)` فقط می‌تواند آن sessionهای تحت مالکیت را حذف کند؛ حذف session دلخواه همچنان به یک درخواست Gateway با scope ادمین نیاز دارد.

برای جست‌وجوی وب، Pluginها می‌توانند به‌جای دسترسی به سیم‌کشی tool عامل، از helper
runtime مشترک استفاده کنند:

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

- انتخاب ارائه‌دهنده، resolve کردن credential و معناشناسی درخواست مشترک را در core نگه دارید.
- از ارائه‌دهندگان جست‌وجوی وب برای transportهای جست‌وجوی خاص فروشنده استفاده کنید.
- `api.runtime.webSearch.*` سطح مشترک ترجیحی برای Pluginهای feature/channel است که بدون وابستگی به wrapper tool عامل به رفتار جست‌وجو نیاز دارند.

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

- `generate(...)`: تولید یک تصویر با استفاده از زنجیرهٔ پیکربندی‌شدهٔ ارائه‌دهندهٔ image-generation.
- `listProviders(...)`: فهرست کردن ارائه‌دهندگان image-generation موجود و قابلیت‌های آن‌ها.

## routeهای HTTP در Gateway

Pluginها می‌توانند endpointهای HTTP را با `api.registerHttpRoute(...)` عرضه کنند.

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

- `path`: مسیر route زیر سرور HTTP Gateway.
- `auth`: الزامی است. از `"gateway"` برای الزام auth عادی gateway، یا از `"plugin"` برای auth/webhook verification مدیریت‌شده توسط plugin استفاده کنید.
- `match`: اختیاری. `"exact"` (پیش‌فرض) یا `"prefix"`.
- `replaceExisting`: اختیاری. به همان Plugin اجازه می‌دهد ثبت route موجود خودش را جایگزین کند.
- `handler`: وقتی route درخواست را handled کرد، `true` را برگردانید.

نکته‌ها:

- `api.registerHttpHandler(...)` حذف شده است و باعث خطای بارگذاری Plugin می‌شود. به‌جای آن از `api.registerHttpRoute(...)` استفاده کنید.
- مسیرهای Plugin باید `auth` را صریحاً اعلام کنند.
- تداخل‌های دقیق `path + match` رد می‌شوند مگر اینکه `replaceExisting: true` باشد، و یک Plugin نمی‌تواند مسیر Plugin دیگری را جایگزین کند.
- مسیرهای هم‌پوشان با سطوح متفاوت `auth` رد می‌شوند. زنجیره‌های fallthrough برای `exact`/`prefix` را فقط در همان سطح auth نگه دارید.
- مسیرهای `auth: "plugin"` به‌طور خودکار scopeهای runtime اپراتور را دریافت **نمی‌کنند**. آن‌ها برای webhookهای مدیریت‌شده توسط Plugin/راستی‌آزمایی امضا هستند، نه فراخوانی‌های کمکی ممتاز Gateway.
- مسیرهای `auth: "gateway"` داخل scope runtime درخواست Gateway اجرا می‌شوند، اما آن scope عمداً محافظه‌کارانه است:
  - احراز هویت bearer با secret مشترک (`gateway.auth.mode = "token"` / `"password"`) scopeهای runtime مسیر Plugin را روی `operator.write` ثابت نگه می‌دارد، حتی اگر فراخواننده `x-openclaw-scopes` بفرستد
  - حالت‌های HTTP دارای هویت مورد اعتماد (برای مثال `trusted-proxy` یا `gateway.auth.mode = "none"` روی یک ingress خصوصی) فقط زمانی `x-openclaw-scopes` را رعایت می‌کنند که header به‌صراحت وجود داشته باشد
  - اگر `x-openclaw-scopes` در آن درخواست‌های مسیر Plugin دارای هویت وجود نداشته باشد، scope runtime به `operator.write` برمی‌گردد
- قاعده عملی: فرض نکنید مسیر Plugin با احراز هویت Gateway یک سطح admin ضمنی است. اگر مسیر شما به رفتار فقط-admin نیاز دارد، یک حالت auth دارای هویت الزام کنید و قرارداد صریح header `x-openclaw-scopes` را مستند کنید.

## مسیرهای import در SDK Plugin

هنگام نوشتن Pluginهای جدید، به‌جای barrel ریشه یکپارچه `openclaw/plugin-sdk` از زیرمسیرهای محدود SDK استفاده کنید. زیرمسیرهای اصلی:

| زیرمسیر                             | هدف                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitiveهای ثبت Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | helperهای ورود/ساخت Channel                        |
| `openclaw/plugin-sdk/core`          | helperهای عمومی مشترک و قرارداد umbrella       |
| `openclaw/plugin-sdk/config-schema` | schemaی Zod ریشه `openclaw.json` (`OpenClawSchema`) |

Pluginهای Channel از خانواده‌ای از seamهای محدود انتخاب می‌کنند — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`، و `channel-actions`. رفتار تأیید باید روی یک قرارداد
`approvalCapability` یکپارچه شود، نه اینکه میان فیلدهای نامرتبط Plugin ترکیب شود. [Pluginهای Channel](/fa/plugins/sdk-channel-plugins) را ببینید.

helperهای runtime و config زیر زیرمسیرهای متمرکز و متناظر `*-runtime` قرار دارند
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`، و غیره). به‌جای barrel سازگاری گسترده `config-runtime`،
`config-types`، `plugin-config-runtime`، `runtime-config-snapshot`، و `config-mutation` را ترجیح دهید.

<Info>
`openclaw/plugin-sdk/channel-runtime`، `openclaw/plugin-sdk/config-runtime`،
و `openclaw/plugin-sdk/infra-runtime` shimهای سازگاری منسوخ برای
Pluginهای قدیمی‌تر هستند. کد جدید باید به‌جای آن primitiveهای عمومی محدودتر را import کند.
</Info>

نقاط ورود داخلی repo (برای ریشه package هر Plugin همراه‌شده):

- `index.js` — ورودی Plugin همراه‌شده
- `api.js` — barrel helperها/types
- `runtime-api.js` — barrel فقط-runtime
- `setup-entry.js` — ورودی setup Plugin

Pluginهای خارجی فقط باید زیرمسیرهای `openclaw/plugin-sdk/*` را import کنند. هرگز
`src/*` مربوط به package یک Plugin دیگر را از core یا از Plugin دیگر import نکنید.
نقاط ورود بارگذاری‌شده با facade، وقتی snapshot فعال config runtime وجود داشته باشد، آن را ترجیح می‌دهند،
سپس به فایل config resolve‌شده روی disk برمی‌گردند.

زیرمسیرهای مختص capability مانند `image-generation`، `media-understanding`،
و `speech` وجود دارند چون Pluginهای همراه‌شده امروز از آن‌ها استفاده می‌کنند. آن‌ها
به‌طور خودکار قراردادهای خارجی منجمد بلندمدت نیستند — هنگام اتکا به آن‌ها، صفحه مرجع SDK مربوطه را بررسی کنید.

## schemaهای ابزار پیام

Pluginها باید contributionهای schema مربوط به Channel برای `describeMessageTool(...)` را
برای primitiveهای غیرپیامی مانند reactionها، readها و pollها مالک شوند.
ارائه مشترک send باید به‌جای فیلدهای button، component، block یا card بومی provider
از قرارداد عمومی `MessagePresentation` استفاده کند.
برای قرارداد، قواعد fallback، نگاشت provider و checklist نویسنده Plugin،
[Message Presentation](/fa/plugins/message-presentation) را ببینید.

Pluginهای دارای قابلیت send اعلام می‌کنند که از طریق capabilityهای پیام چه چیزهایی را می‌توانند render کنند:

- `presentation` برای blockهای ارائه معنایی (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` برای درخواست‌های تحویل پین‌شده

Core تصمیم می‌گیرد ارائه را به‌صورت بومی render کند یا آن را به text کاهش دهد.
escape hatchهای UI بومی provider را از ابزار پیام عمومی در دسترس قرار ندهید.
helperهای SDK منسوخ برای schemaهای بومی legacy همچنان برای Pluginهای شخص ثالث موجود
export می‌مانند، اما Pluginهای جدید نباید از آن‌ها استفاده کنند.

## resolution هدف Channel

Pluginهای Channel باید مالک معناشناسی هدف مختص Channel باشند. host outbound مشترک را
عمومی نگه دارید و برای قواعد provider از سطح adapter پیام‌رسانی استفاده کنید:

- `messaging.inferTargetChatType({ to })` تصمیم می‌گیرد که آیا یک هدف نرمال‌سازی‌شده
  قبل از lookup در directory باید به‌عنوان `direct`، `group` یا `channel` در نظر گرفته شود.
- `messaging.targetResolver.looksLikeId(raw, normalized)` به core می‌گوید که آیا یک
  ورودی باید به‌جای جست‌وجوی directory، مستقیم به resolution شبیه id برود.
- `messaging.targetResolver.resolveTarget(...)` fallback Plugin است وقتی
  core پس از normalization یا پس از یک directory miss به resolution نهایی متعلق به provider نیاز دارد.
- `messaging.resolveOutboundSessionRoute(...)` پس از resolve شدن یک هدف، ساخت
  مسیر session مختص provider را مالک می‌شود.

تقسیم پیشنهادی:

- از `inferTargetChatType` برای تصمیم‌های دسته‌بندی استفاده کنید که باید پیش از
  جست‌وجوی peers/groups رخ دهند.
- از `looksLikeId` برای بررسی‌های «این را به‌عنوان id هدف صریح/بومی در نظر بگیر» استفاده کنید.
- از `resolveTarget` برای fallback نرمال‌سازی مختص provider استفاده کنید، نه برای
  جست‌وجوی گسترده directory.
- idهای بومی provider مانند chat idها، thread idها، JIDها، handleها و room
  idها را داخل مقدارهای `target` یا paramهای مختص provider نگه دارید، نه در فیلدهای عمومی SDK.

## directoryهای مبتنی بر config

Pluginهایی که entryهای directory را از config مشتق می‌کنند باید آن منطق را در
Plugin نگه دارند و helperهای مشترک را از
`openclaw/plugin-sdk/directory-runtime` دوباره استفاده کنند.

وقتی یک Channel به peers/groups مبتنی بر config نیاز دارد، مانند موارد زیر، از این استفاده کنید:

- peers مربوط به DM که با allowlist هدایت می‌شوند
- mapهای پیکربندی‌شده channel/group
- fallbackهای directory ایستا با scope حساب

helperهای مشترک در `directory-runtime` فقط عملیات عمومی را مدیریت می‌کنند:

- فیلتر کردن query
- اعمال limit
- helperهای deduping/normalization
- ساختن `ChannelDirectoryEntry[]`

بازرسی حساب مختص Channel و normalization id باید در پیاده‌سازی
Plugin باقی بماند.

## catalogهای Provider

Pluginهای ارائه‌دهنده می‌توانند کاتالوگ‌های مدل را برای استنتاج با
`registerProvider({ catalog: { run(...) { ... } } })` تعریف کنند.

`catalog.run(...)` همان ساختاری را برمی‌گرداند که OpenClaw در
`models.providers` می‌نویسد:

- `{ provider }` برای یک ورودی ارائه‌دهنده
- `{ providers }` برای چند ورودی ارائه‌دهنده

وقتی Plugin مالک شناسه‌های مدل اختصاصی ارائه‌دهنده، پیش‌فرض‌های URL پایه،
یا فراداده مدل وابسته به احراز هویت است، از `catalog` استفاده کنید.

`catalog.order` کنترل می‌کند که کاتالوگ یک Plugin نسبت به ارائه‌دهنده‌های
ضمنی داخلی OpenClaw چه زمانی ادغام شود:

- `simple`: ارائه‌دهنده‌های ساده مبتنی بر کلید API یا env
- `profile`: ارائه‌دهنده‌هایی که وقتی پروفایل‌های احراز هویت وجود دارند ظاهر می‌شوند
- `paired`: ارائه‌دهنده‌هایی که چند ورودی ارائه‌دهنده مرتبط را ترکیب می‌کنند
- `late`: گذر آخر، پس از سایر ارائه‌دهنده‌های ضمنی

ارائه‌دهنده‌های بعدی در برخورد کلید برنده می‌شوند، بنابراین Pluginها می‌توانند
عامدانه یک ورودی ارائه‌دهنده داخلی را با همان شناسه ارائه‌دهنده بازنویسی کنند.

سازگاری:

- `discovery` همچنان به‌عنوان نام مستعار قدیمی کار می‌کند
- اگر هم `catalog` و هم `discovery` ثبت شده باشند، OpenClaw از `catalog` استفاده می‌کند

## بازرسی فقط‌خواندنی کانال

اگر Plugin شما یک کانال ثبت می‌کند، ترجیح دهید
`plugin.config.inspectAccount(cfg, accountId)` را در کنار `resolveAccount(...)`
پیاده‌سازی کنید.

چرایی:

- `resolveAccount(...)` مسیر زمان اجرا است. مجاز است فرض کند اعتبارنامه‌ها
  کاملا مادی‌سازی شده‌اند و می‌تواند وقتی رازهای لازم موجود نیستند سریع شکست بخورد.
- مسیرهای فرمان فقط‌خواندنی مانند `openclaw status`، `openclaw status --all`،
  `openclaw channels status`، `openclaw channels resolve`، و جریان‌های ترمیم
  doctor/config نباید فقط برای توصیف پیکربندی نیاز داشته باشند اعتبارنامه‌های
  زمان اجرا را مادی‌سازی کنند.

رفتار پیشنهادی `inspectAccount(...)`:

- فقط وضعیت توصیفی حساب را برگردانید.
- `enabled` و `configured` را حفظ کنید.
- در صورت مرتبط بودن، فیلدهای منبع/وضعیت اعتبارنامه را شامل کنید، مانند:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- لازم نیست فقط برای گزارش دسترس‌پذیری فقط‌خواندنی، مقادیر خام توکن را
  برگردانید. برگرداندن `tokenStatus: "available"` (و فیلد منبع متناظر) برای
  فرمان‌های سبک وضعیت کافی است.
- وقتی یک اعتبارنامه از طریق SecretRef پیکربندی شده اما در مسیر فرمان فعلی
  در دسترس نیست، از `configured_unavailable` استفاده کنید.

این باعث می‌شود فرمان‌های فقط‌خواندنی به‌جای خرابی یا گزارش نادرست حساب به‌عنوان
پیکربندی‌نشده، گزارش دهند «پیکربندی شده اما در این مسیر فرمان در دسترس نیست».

## بسته‌های پکیج

یک دایرکتوری Plugin می‌تواند یک `package.json` با `openclaw.extensions` داشته باشد:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

هر ورودی به یک Plugin تبدیل می‌شود. اگر بسته چندین extension فهرست کند، شناسه Plugin
به `name/<fileBase>` تبدیل می‌شود.

اگر Plugin شما وابستگی‌های npm را import می‌کند، آن‌ها را در همان دایرکتوری نصب کنید تا
`node_modules` در دسترس باشد (`npm install` / `pnpm install`).

حفاظ امنیتی: هر ورودی `openclaw.extensions` باید پس از resolve شدن symlink داخل
دایرکتوری Plugin باقی بماند. ورودی‌هایی که از دایرکتوری پکیج خارج شوند رد می‌شوند.

نکته امنیتی: `openclaw plugins install` وابستگی‌های Plugin را با یک
`npm install --omit=dev --ignore-scripts` محلی پروژه نصب می‌کند (بدون اسکریپت‌های چرخه حیات،
بدون وابستگی‌های dev در زمان اجرا)، و تنظیمات نصب npm سراسری به‌ارث‌رسیده را نادیده می‌گیرد.
درخت‌های وابستگی Plugin را «JS/TS خالص» نگه دارید و از پکیج‌هایی که به buildهای
`postinstall` نیاز دارند پرهیز کنید.

اختیاری: `openclaw.setupEntry` می‌تواند به یک ماژول سبک فقط برای setup اشاره کند.
وقتی OpenClaw برای یک Plugin کانال غیرفعال به سطح‌های setup نیاز دارد، یا
وقتی یک Plugin کانال فعال است اما هنوز پیکربندی نشده، به‌جای ورودی کامل Plugin،
`setupEntry` را بارگذاری می‌کند. این کار startup و setup را سبک‌تر نگه می‌دارد
وقتی ورودی اصلی Plugin شما همچنین tools، hooks، یا کدهای دیگر فقط‌زمان‌اجرا را متصل می‌کند.

اختیاری: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
می‌تواند یک Plugin کانال را حتی وقتی کانال از قبل پیکربندی شده است، در مرحله
startup پیش از listen کردن Gateway، وارد همان مسیر `setupEntry` کند.

این را فقط وقتی استفاده کنید که `setupEntry` تمام سطح startup لازم پیش از شروع
گوش‌دادن Gateway را کاملا پوشش می‌دهد. در عمل، یعنی ورودی setup باید هر قابلیت
متعلق به کانال را که startup به آن وابسته است ثبت کند، مانند:

- خود ثبت کانال
- هر مسیر HTTP که باید پیش از شروع گوش‌دادن Gateway در دسترس باشد
- هر متد، tool، یا سرویس Gateway که باید در همان بازه وجود داشته باشد

اگر ورودی کامل شما همچنان مالک هر قابلیت startup لازم است، این flag را فعال نکنید.
Plugin را روی رفتار پیش‌فرض نگه دارید و اجازه دهید OpenClaw ورودی کامل را هنگام
startup بارگذاری کند.

کانال‌های bundled همچنین می‌توانند helperهای سطح قرارداد فقط برای setup منتشر کنند که هسته
می‌تواند پیش از بارگذاری runtime کامل کانال به آن‌ها مراجعه کند. سطح promotion فعلی setup
این است:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

هسته زمانی از این سطح استفاده می‌کند که نیاز داشته باشد پیکربندی کانال تک‌حساب قدیمی را بدون بارگذاری ورودی کامل Plugin به `channels.<id>.accounts.*` ارتقا دهد. Matrix نمونهٔ بسته‌بندی‌شدهٔ فعلی است: فقط کلیدهای auth/bootstrap را، وقتی حساب‌های نام‌دار از قبل وجود دارند، به یک حساب نام‌دار ارتقایافته منتقل می‌کند، و می‌تواند به‌جای اینکه همیشه `accounts.default` را ایجاد کند، یک کلید حساب پیش‌فرض غیرکانونیِ پیکربندی‌شده را حفظ کند.

آن adapterهای patch راه‌اندازی، کشف سطح قراردادِ بسته‌بندی‌شده را lazy نگه می‌دارند. زمان import سبک می‌ماند؛ سطح ارتقا فقط در نخستین استفاده بارگذاری می‌شود، نه اینکه هنگام import ماژول دوباره وارد راه‌اندازی کانال بسته‌بندی‌شده شود.

وقتی این سطوح راه‌اندازی شامل روش‌های RPC مربوط به Gateway هستند، آن‌ها را روی یک پیشوند ویژهٔ Plugin نگه دارید. namespaceهای مدیریتی هسته (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) رزرو شده می‌مانند و همیشه به `operator.admin` resolve می‌شوند، حتی اگر یک Plugin محدودهٔ محدودتری درخواست کند.

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

### فرادادهٔ کاتالوگ کانال

Pluginهای کانال می‌توانند فرادادهٔ راه‌اندازی/کشف را از طریق `openclaw.channel` و راهنمایی‌های نصب را از طریق `openclaw.install` اعلام کنند. این کار داده‌های کاتالوگ هسته را خالی نگه می‌دارد.

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

- `detailLabel`: برچسب ثانویه برای سطوح کاتالوگ/وضعیت غنی‌تر
- `docsLabel`: بازنویسی متن لینک برای لینک مستندات
- `preferOver`: شناسه‌های Plugin/کانال با اولویت پایین‌تر که این ورودی کاتالوگ باید از آن‌ها بالاتر قرار بگیرد
- `selectionDocsPrefix`، `selectionDocsOmitLabel`، `selectionExtras`: کنترل‌های متن سطح انتخاب
- `markdownCapable`: کانال را برای تصمیم‌های قالب‌بندی خروجی به‌عنوان دارای قابلیت markdown علامت‌گذاری می‌کند
- `exposure.configured`: وقتی روی `false` تنظیم شود، کانال را از سطوح فهرست‌سازی کانال‌های پیکربندی‌شده پنهان می‌کند
- `exposure.setup`: وقتی روی `false` تنظیم شود، کانال را از انتخابگرهای راه‌اندازی/پیکربندی تعاملی پنهان می‌کند
- `exposure.docs`: کانال را برای سطوح ناوبری مستندات به‌عنوان داخلی/خصوصی علامت‌گذاری می‌کند
- `showConfigured` / `showInSetup`: نام‌های مستعار قدیمی که همچنان برای سازگاری پذیرفته می‌شوند؛ `exposure` را ترجیح دهید
- `quickstartAllowFrom`: کانال را وارد جریان استاندارد quickstart `allowFrom` می‌کند
- `forceAccountBinding`: حتی وقتی فقط یک حساب وجود دارد، binding صریح حساب را الزامی می‌کند
- `preferSessionLookupForAnnounceTarget`: هنگام resolve کردن مقصدهای announce، lookup نشست را ترجیح می‌دهد

OpenClaw همچنین می‌تواند **کاتالوگ‌های کانال خارجی** را merge کند (برای مثال، export رجیستری MPM). یک فایل JSON را در یکی از این مسیرها قرار دهید:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

یا `OPENCLAW_PLUGIN_CATALOG_PATHS` (یا `OPENCLAW_MPM_CATALOG_PATHS`) را به یک یا چند فایل JSON اشاره دهید (جداشده با کاما/نقطه‌ویرگول/`PATH`). هر فایل باید شامل `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` باشد. parser همچنین `"packages"` یا `"plugins"` را به‌عنوان نام‌های مستعار قدیمی برای کلید `"entries"` می‌پذیرد.

ورودی‌های کاتالوگ کانال تولیدشده و ورودی‌های کاتالوگ نصب provider، واقعیت‌های نرمال‌شدهٔ install-source را کنار بلوک خام `openclaw.install` ارائه می‌کنند. این واقعیت‌های نرمال‌شده مشخص می‌کنند که آیا spec مربوط به npm یک نسخهٔ دقیق است یا selector شناور، آیا فرادادهٔ integrity مورد انتظار وجود دارد، و آیا مسیر منبع محلی نیز در دسترس است. وقتی هویت کاتالوگ/بسته شناخته شده باشد، واقعیت‌های نرمال‌شده در صورت فاصله گرفتن نام parse‌شدهٔ بستهٔ npm از آن هویت هشدار می‌دهند. همچنین وقتی `defaultChoice` نامعتبر باشد یا به منبعی اشاره کند که در دسترس نیست، و وقتی فرادادهٔ integrity مربوط به npm بدون یک منبع معتبر npm وجود داشته باشد، هشدار می‌دهند. مصرف‌کنندگان باید `installSource` را به‌عنوان یک فیلد اختیاری افزوده در نظر بگیرند تا ورودی‌های دستی و shimهای کاتالوگ مجبور نباشند آن را synthesize کنند.
این به onboarding و diagnostics اجازه می‌دهد وضعیت source-plane را بدون import کردن runtime Plugin توضیح دهند.

ورودی‌های رسمی خارجی npm باید یک `npmSpec` دقیق به‌همراه `expectedIntegrity` را ترجیح دهند. نام‌های سادهٔ بسته و dist-tagها همچنان برای سازگاری کار می‌کنند، اما هشدارهای source-plane نشان می‌دهند تا کاتالوگ بتواند بدون شکستن Pluginهای موجود به‌سمت نصب‌های pin‌شده و integrity-check‌شده حرکت کند. وقتی onboarding از یک مسیر کاتالوگ محلی نصب می‌کند، یک ورودی مدیریت‌شدهٔ index مربوط به Plugin را با `source: "path"` و، در صورت امکان، `sourcePath` نسبی به workspace ثبت می‌کند. مسیر مطلق بارگذاری عملیاتی در `plugins.load.paths` باقی می‌ماند؛ رکورد نصب از تکرار مسیرهای workstation محلی در پیکربندی ماندگار جلوگیری می‌کند. این کار نصب‌های توسعهٔ محلی را برای diagnostics مربوط به source-plane قابل مشاهده نگه می‌دارد، بدون اینکه یک سطح دوم افشای مسیر خام filesystem اضافه کند. index ماندگار `plugins/installs.json` مربوط به Plugin، منبع حقیقت نصب است و می‌تواند بدون بارگذاری ماژول‌های runtime Plugin refresh شود. map مربوط به `installRecords` آن حتی زمانی که manifest یک Plugin مفقود یا نامعتبر باشد بادوام است؛ آرایهٔ `plugins` آن یک نمای manifest قابل بازسازی است.

## Pluginهای موتور context

Pluginهای موتور context مالک orchestration مربوط به context نشست برای ingest، assembly و Compaction هستند. آن‌ها را از Plugin خود با `api.registerContextEngine(id, factory)` ثبت کنید، سپس موتور فعال را با `plugins.slots.contextEngine` انتخاب کنید.

وقتی Plugin شما نیاز دارد pipeline پیش‌فرض context را جایگزین یا گسترش دهد، نه اینکه فقط جست‌وجوی memory یا hook اضافه کند، از این استفاده کنید.

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

factory `ctx` مقادیر اختیاری `config`، `agentDir` و `workspaceDir` را برای initialization در زمان ساخت ارائه می‌کند.

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

وقتی یک Plugin به رفتاری نیاز دارد که با API فعلی سازگار نیست، با دسترسی خصوصی به داخل سیستم Plugin آن را دور نزنید. قابلیت مفقود را اضافه کنید.

ترتیب پیشنهادی:

1. قرارداد هسته را تعریف کنید
   تصمیم بگیرید هسته باید مالک چه رفتار مشترکی باشد: policy، fallback، merge پیکربندی، lifecycle، معناشناسی روبه‌کانال، و شکل helper مربوط به runtime.
2. سطوح ثبت/runtime تایپ‌شدهٔ Plugin را اضافه کنید
   `OpenClawPluginApi` و/یا `api.runtime` را با کوچک‌ترین سطح قابلیت تایپ‌شدهٔ مفید گسترش دهید.
3. هسته + مصرف‌کنندگان کانال/ویژگی را سیم‌کشی کنید
   کانال‌ها و Pluginهای ویژگی باید قابلیت جدید را از طریق هسته مصرف کنند، نه با import مستقیم یک پیاده‌سازی vendor.
4. پیاده‌سازی‌های vendor را ثبت کنید
   سپس Pluginهای vendor backendهای خود را در برابر قابلیت ثبت می‌کنند.
5. پوشش قرارداد اضافه کنید
   تست‌هایی اضافه کنید تا مالکیت و شکل ثبت در طول زمان صریح بماند.

این همان روشی است که OpenClaw را opinionated نگه می‌دارد بدون اینکه به جهان‌بینی یک provider hardcoded شود. برای یک checklist فایل دقیق و مثال کارشده، [Capability Cookbook](/fa/plugins/architecture) را ببینید.

### checklist قابلیت

وقتی یک قابلیت جدید اضافه می‌کنید، پیاده‌سازی معمولاً باید این سطوح را با هم touch کند:

- انواع قرارداد هسته در `src/<capability>/types.ts`
- helper اجرای هسته/runtime در `src/<capability>/runtime.ts`
- سطح ثبت API مربوط به Plugin در `src/plugins/types.ts`
- سیم‌کشی registry مربوط به Plugin در `src/plugins/registry.ts`
- exposure مربوط به runtime Plugin در `src/plugins/runtime/*` وقتی Pluginهای ویژگی/کانال باید آن را مصرف کنند
- helperهای capture/test در `src/test-utils/plugin-registration.ts`
- assertionهای مالکیت/قرارداد در `src/plugins/contracts/registry.ts`
- مستندات operator/Plugin در `docs/`

اگر یکی از این سطوح وجود ندارد، معمولاً نشانهٔ این است که قابلیت هنوز کاملاً یکپارچه نشده است.

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

الگوی تست قرارداد:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

این قانون را ساده نگه می‌دارد:

- هسته مالک قرارداد قابلیت + orchestration است
- Pluginهای vendor مالک پیاده‌سازی‌های vendor هستند
- Pluginهای ویژگی/کانال helperهای runtime را مصرف می‌کنند
- تست‌های قرارداد مالکیت را صریح نگه می‌دارند

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) — مدل و شکل‌های عمومی قابلیت
- [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths)
- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
