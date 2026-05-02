---
read_when:
    - پیاده‌سازی قلاب‌های زمان اجرای ارائه‌دهنده، چرخهٔ حیات کانال، یا پک‌های بسته
    - اشکال‌زدایی ترتیب بارگذاری Plugin یا وضعیت رجیستری
    - افزودن یک قابلیت Plugin جدید یا یک Plugin موتور زمینه جدید
summary: 'جزئیات داخلی معماری Plugin: خط لولهٔ بارگذاری، رجیستری، هوک‌های زمان اجرا، مسیرهای HTTP و جدول‌های مرجع'
title: جزئیات داخلی معماری Plugin
x-i18n:
    generated_at: "2026-05-02T20:47:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

برای مدل قابلیت عمومی، شکل‌های Plugin، و قراردادهای مالکیت/اجرا، [معماری Plugin](/fa/plugins/architecture) را ببینید. این صفحه مرجع سازوکارهای داخلی است: خط لوله بارگذاری، رجیستری، هوک‌های زمان اجرا، مسیرهای HTTP مربوط به Gateway، مسیرهای import، و جدول‌های schema.

## خط لوله بارگذاری

در زمان راه‌اندازی، OpenClaw تقریباً این کارها را انجام می‌دهد:

1. ریشه‌های Plugin نامزد را کشف می‌کند
2. manifestهای bundle بومی یا سازگار و فراداده package را می‌خواند
3. نامزدهای ناامن را رد می‌کند
4. پیکربندی Plugin را نرمال‌سازی می‌کند (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. برای هر نامزد درباره فعال‌سازی تصمیم می‌گیرد
6. ماژول‌های بومی فعال‌شده را بارگذاری می‌کند: ماژول‌های bundle‌شده ساخته‌شده از یک بارگذار بومی استفاده می‌کنند؛
   منبع TypeScript محلی شخص ثالث از fallback اضطراری Jiti استفاده می‌کند
7. هوک‌های بومی `register(api)` را فراخوانی می‌کند و ثبت‌ها را در رجیستری Plugin جمع‌آوری می‌کند
8. رجیستری را در اختیار فرمان‌ها/سطح‌های زمان اجرا قرار می‌دهد

<Note>
`activate` یک نام مستعار قدیمی برای `register` است — بارگذار هرکدام را که موجود باشد حل می‌کند (`def.register ?? def.activate`) و آن را در همان نقطه فراخوانی می‌کند. همه Pluginهای bundle‌شده از `register` استفاده می‌کنند؛ برای Pluginهای جدید `register` را ترجیح دهید.
</Note>

دروازه‌های ایمنی **پیش از** اجرای زمان اجرا اعمال می‌شوند. نامزدها زمانی مسدود می‌شوند که entry از ریشه Plugin خارج شود، مسیر قابل نوشتن برای همه باشد، یا مالکیت مسیر برای Pluginهای غیرباندل‌شده مشکوک به نظر برسد.

### رفتار manifest-first

manifest منبع حقیقت سطح کنترل است. OpenClaw از آن برای موارد زیر استفاده می‌کند:

- شناسایی Plugin
- کشف کانال‌ها/Skills/schema پیکربندی اعلام‌شده یا قابلیت‌های bundle
- اعتبارسنجی `plugins.entries.<id>.config`
- تکمیل برچسب‌ها/placeholderهای Control UI
- نمایش فراداده نصب/catalog
- حفظ descriptorهای سبک فعال‌سازی و راه‌اندازی بدون بارگذاری زمان اجرای Plugin

برای Pluginهای بومی، ماژول زمان اجرا بخش سطح داده است. این ماژول رفتار واقعی مانند هوک‌ها، ابزارها، فرمان‌ها، یا جریان‌های provider را ثبت می‌کند.

بلوک‌های اختیاری manifest با نام‌های `activation` و `setup` روی سطح کنترل می‌مانند.
آن‌ها descriptorهای فقط-فراداده برای برنامه‌ریزی فعال‌سازی و کشف راه‌اندازی هستند؛
آن‌ها جایگزین ثبت زمان اجرا، `register(...)`، یا `setupEntry` نمی‌شوند.
اولین مصرف‌کنندگان فعال‌سازی زنده اکنون از راهنمایی‌های command، channel، و provider در manifest استفاده می‌کنند
تا پیش از مادی‌سازی گسترده‌تر رجیستری، بارگذاری Plugin را محدود کنند:

- بارگذاری CLI به Pluginهایی محدود می‌شود که مالک فرمان اصلی درخواست‌شده هستند
- حل setup/Plugin کانال به Pluginهایی محدود می‌شود که مالک
  channel id درخواست‌شده هستند
- حل صریح setup/runtime مربوط به provider به Pluginهایی محدود می‌شود که مالک
  provider id درخواست‌شده هستند
- برنامه‌ریزی راه‌اندازی Gateway از `activation.onStartup` برای importهای صریح زمان راه‌اندازی
  و opt-outهای راه‌اندازی استفاده می‌کند؛ Pluginهایی بدون فراداده راه‌اندازی فقط
  از طریق triggerهای محدودتر فعال‌سازی بارگذاری می‌شوند

preloadهای زمان درخواست که scope گسترده `all` را درخواست می‌کنند همچنان یک مجموعه صریح و مؤثر از idهای Plugin را از پیکربندی، برنامه‌ریزی راه‌اندازی، کانال‌های پیکربندی‌شده، slotها، و قواعد auto-enable استخراج می‌کنند. اگر آن مجموعه استخراج‌شده خالی باشد، OpenClaw به‌جای گسترش به همه Pluginهای قابل کشف، یک رجیستری زمان اجرای خالی بارگذاری می‌کند.

برنامه‌ریز فعال‌سازی هم یک API فقط-id برای فراخوان‌های موجود و هم یک API برنامه برای diagnostics جدید ارائه می‌کند. entryهای برنامه گزارش می‌دهند که چرا یک Plugin انتخاب شده است، و راهنمایی‌های صریح برنامه‌ریز `activation.*` را از fallback مالکیت manifest مانند `providers`، `channels`، `commandAliases`، `setup.providers`، `contracts.tools`، و هوک‌ها جدا می‌کنند. این تفکیک دلیل مرز سازگاری است:
فراداده Plugin موجود همچنان کار می‌کند، در حالی که کد جدید می‌تواند راهنمایی‌های گسترده
یا رفتار fallback را بدون تغییر دادن semantics بارگذاری زمان اجرا تشخیص دهد.

کشف setup اکنون idهای مالک-descriptor مانند `setup.providers` و
`setup.cliBackends` را ترجیح می‌دهد تا پیش از fallback به
`setup-api` برای Pluginهایی که هنوز به هوک‌های زمان اجرای زمان setup نیاز دارند، Pluginهای نامزد را محدود کند. فهرست‌های setup مربوط به provider از manifest `providerAuthChoices`، گزینه‌های setup مشتق‌شده از descriptor، و فراداده install-catalog بدون بارگذاری زمان اجرای provider استفاده می‌کنند. `setup.requiresRuntime: false` صریح یک cutoff فقط-descriptor است؛ حذف‌شدن `requiresRuntime` برای سازگاری fallback قدیمی setup-api را حفظ می‌کند. اگر بیش از یک Plugin کشف‌شده مالک همان provider یا CLI backend id نرمال‌شده setup باشد، lookup مربوط به setup به‌جای اتکا به ترتیب کشف، مالک مبهم را رد می‌کند. وقتی زمان اجرای setup اجرا می‌شود، diagnostics رجیستری drift بین `setup.providers` / `setup.cliBackends` و providerها یا CLI backendهایی را که توسط setup-api ثبت شده‌اند، بدون مسدود کردن Pluginهای قدیمی گزارش می‌کند.

### مرز cache مربوط به Plugin

OpenClaw نتایج کشف Plugin یا داده‌های مستقیم رجیستری manifest را پشت پنجره‌های wall-clock cache نمی‌کند. نصب‌ها، ویرایش‌های manifest، و تغییرات load-path باید در metadata read صریح بعدی یا rebuild بعدی snapshot قابل مشاهده شوند.
parser فایل manifest ممکن است یک cache محدود file-signature نگه دارد که با مسیر manifest بازشده، inode، اندازه، و timestampها keyed شده است؛ آن cache فقط از re-parse کردن byteهای تغییرنکرده جلوگیری می‌کند و نباید پاسخ‌های discovery، registry، owner، یا policy را cache کند.

مسیر سریع امن فراداده مالکیت صریح object است، نه یک cache پنهان.
مسیرهای داغ راه‌اندازی Gateway باید `PluginMetadataSnapshot` فعلی، `PluginLookUpTable` استخراج‌شده، یا یک رجیستری صریح manifest را در زنجیره فراخوانی عبور دهند. اعتبارسنجی پیکربندی، auto-enable زمان راه‌اندازی، bootstrap Plugin، و انتخاب provider می‌توانند از این objectها تا زمانی که نماینده پیکربندی و inventory فعلی Plugin هستند دوباره استفاده کنند. lookup مربوط به setup همچنان فراداده manifest را در صورت نیاز بازسازی می‌کند مگر اینکه مسیر خاص setup یک رجیستری صریح manifest دریافت کند؛ این را به‌عنوان fallback مسیر سرد نگه دارید، نه اینکه cacheهای lookup پنهان اضافه کنید. وقتی ورودی تغییر می‌کند، به‌جای mutate کردن snapshot یا نگه داشتن نسخه‌های تاریخی، آن را rebuild و replace کنید.
viewها روی رجیستری فعال Plugin و helperهای bootstrap کانال bundle‌شده باید از رجیستری/ریشه فعلی دوباره محاسبه شوند. mapهای کوتاه‌عمر داخل یک فراخوانی برای dedupe کردن کار یا محافظت در برابر reentry قابل قبول‌اند؛ آن‌ها نباید به cacheهای فراداده process تبدیل شوند.

برای بارگذاری Plugin، لایه cache پایدار بارگذاری زمان اجرا است. این لایه ممکن است زمانی که کد یا artifactهای نصب‌شده واقعاً بارگذاری می‌شوند، state بارگذار را دوباره استفاده کند، مانند:

- `PluginLoaderCacheState` و رجیستری‌های زمان اجرای فعال سازگار
- cacheهای jiti/module و cacheهای بارگذار سطح عمومی که برای جلوگیری از import مکرر همان سطح زمان اجرا استفاده می‌شوند
- cacheهای filesystem برای artifactهای نصب‌شده Plugin
- mapهای کوتاه‌عمر per-call برای نرمال‌سازی مسیر یا حل duplicate

آن cacheها جزئیات پیاده‌سازی سطح داده هستند. آن‌ها نباید به پرسش‌های سطح کنترل مانند «کدام Plugin مالک این provider است؟» پاسخ دهند مگر اینکه فراخوان عمداً بارگذاری زمان اجرا را درخواست کرده باشد.

cacheهای پایدار یا wall-clock را برای موارد زیر اضافه نکنید:

- نتایج discovery
- رجیستری‌های مستقیم manifest
- رجیستری‌های manifest بازسازی‌شده از index Plugin نصب‌شده
- lookup مالک provider، سرکوب model، policy مربوط به provider، یا فراداده public-artifact
- هر پاسخ مشتق‌شده از manifest دیگر که در آن manifest تغییرکرده، index نصب‌شده،
  یا load path باید در metadata read بعدی قابل مشاهده باشد

فراخوان‌هایی که فراداده manifest را از index پایدار Plugin نصب‌شده rebuild می‌کنند، آن رجیستری را در صورت نیاز بازسازی می‌کنند. index نصب‌شده state پایدار source-plane است؛ cache فراداده پنهان داخل process نیست.

## مدل رجیستری

Pluginهای بارگذاری‌شده مستقیماً globalهای تصادفی core را mutate نمی‌کنند. آن‌ها در یک رجیستری مرکزی Plugin ثبت می‌شوند.

رجیستری موارد زیر را ردیابی می‌کند:

- recordهای Plugin (هویت، منبع، origin، وضعیت، diagnostics)
- ابزارها
- هوک‌های قدیمی و هوک‌های typed
- کانال‌ها
- providerها
- handlerهای RPC مربوط به Gateway
- مسیرهای HTTP
- registrarهای CLI
- سرویس‌های پس‌زمینه
- فرمان‌های متعلق به Plugin

سپس featureهای core به‌جای صحبت مستقیم با ماژول‌های Plugin، از آن رجیستری می‌خوانند. این کار بارگذاری را یک‌طرفه نگه می‌دارد:

- ماژول Plugin -> ثبت در رجیستری
- زمان اجرای core -> مصرف رجیستری

این جداسازی برای maintainability مهم است. یعنی بیشتر سطح‌های core فقط به یک نقطه integration نیاز دارند: «رجیستری را بخوان»، نه «هر ماژول Plugin را special-case کن».

## callbackهای binding مکالمه

Pluginهایی که یک مکالمه را bind می‌کنند می‌توانند وقتی یک approval resolve می‌شود واکنش نشان دهند.

برای دریافت callback پس از approve یا deny شدن یک درخواست bind از `api.onConversationBindingResolved(...)` استفاده کنید:

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
- `binding`: binding resolve‌شده برای درخواست‌های approve‌شده
- `request`: summary درخواست اصلی، detach hint، sender id، و
  فراداده مکالمه

این callback فقط برای notification است. این callback تغییر نمی‌دهد چه کسی اجازه دارد یک مکالمه را bind کند، و پس از پایان handling approval در core اجرا می‌شود.

## هوک‌های زمان اجرای provider

Pluginهای provider سه لایه دارند:

- **فراداده manifest** برای lookup ارزان پیش از runtime:
  `setup.providers[].envVars`، سازگاری deprecated با `providerAuthEnvVars`،
  `providerAuthAliases`، `providerAuthChoices`، و `channelEnvVars`.
- **هوک‌های زمان پیکربندی**: `catalog` (قدیمی `discovery`) به‌علاوه
  `applyConfigDefaults`.
- **هوک‌های زمان اجرا**: بیش از 40 هوک اختیاری که auth، حل model،
  wrap کردن stream، سطح‌های thinking، policy مربوط به replay، و endpointهای usage را پوشش می‌دهند. فهرست کامل را زیر [ترتیب و کاربرد هوک](#hook-order-and-usage) ببینید.

OpenClaw همچنان مالک loop عمومی agent، failover، handling transcript، و
policy ابزار است. این هوک‌ها سطح extension برای رفتار مخصوص provider هستند بدون اینکه به یک transport استنتاج کاملاً سفارشی نیاز باشد.

وقتی provider دارای credentials مبتنی بر env است که مسیرهای generic auth/status/model-picker باید بدون بارگذاری زمان اجرای Plugin ببینند، از manifest `setup.providers[].envVars` استفاده کنید. `providerAuthEnvVars` deprecated همچنان در طول پنجره deprecation توسط adapter سازگاری خوانده می‌شود، و Pluginهای غیرباندل‌شده‌ای که از آن استفاده می‌کنند یک diagnostic مربوط به manifest دریافت می‌کنند. وقتی یک provider id باید از env varها، auth profileها، auth پشتیبانی‌شده با config، و گزینه onboarding مربوط به API-key یک provider id دیگر دوباره استفاده کند، از manifest `providerAuthAliases` استفاده کنید. وقتی سطح‌های CLI مربوط به onboarding/auth-choice باید choice id، برچسب‌های group، و wiring ساده auth تک-flag مربوط به provider را بدون بارگذاری زمان اجرای provider بدانند، از manifest `providerAuthChoices` استفاده کنید. `envVars` زمان اجرای provider را برای hintهای operator-facing مانند برچسب‌های onboarding یا متغیرهای setup مربوط به OAuth client-id/client-secret نگه دارید.

وقتی یک کانال auth یا setup مبتنی بر env دارد که fallback عمومی shell-env، بررسی‌های config/status، یا promptهای setup باید بدون بارگذاری زمان اجرای channel ببینند، از manifest `channelEnvVars` استفاده کنید.

### ترتیب و کاربرد هوک

برای Pluginهای model/provider، OpenClaw هوک‌ها را تقریباً به این ترتیب فراخوانی می‌کند.
ستون «زمان استفاده» راهنمای سریع تصمیم‌گیری است.
فیلدهای provider فقط-سازگاری که OpenClaw دیگر فراخوانی نمی‌کند، مانند
`ProviderPlugin.capabilities` و `suppressBuiltInModel`، عمداً اینجا فهرست نشده‌اند.

| #   | Hook                              | کاری که انجام می‌دهد                                                                                                   | زمان استفاده                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | در هنگام تولید `models.json`، پیکربندی ارائه‌دهنده را در `models.providers` منتشر می‌کند                                | ارائه‌دهنده مالک یک کاتالوگ یا پیش‌فرض‌های نشانی پایه است                                                                                                  |
| 2   | `applyConfigDefaults`             | در هنگام مادی‌سازی پیکربندی، پیش‌فرض‌های سراسری پیکربندیِ متعلق به ارائه‌دهنده را اعمال می‌کند                                      | پیش‌فرض‌ها به حالت احراز هویت، محیط، یا معناشناسی خانواده مدلِ ارائه‌دهنده وابسته‌اند                                                                         |
| --  | _(جست‌وجوی مدل داخلی)_         | OpenClaw ابتدا مسیر معمول رجیستری/کاتالوگ را امتحان می‌کند                                                          | _(قلاب Plugin نیست)_                                                                                                                         |
| 3   | `normalizeModelId`                | نام‌های مستعار قدیمی یا پیش‌نمایشِ شناسه مدل را پیش از جست‌وجو عادی‌سازی می‌کند                                                     | ارائه‌دهنده پیش از رفع مدل کانونی، مالک پاک‌سازی نام‌های مستعار است                                                                                 |
| 4   | `normalizeTransport`              | `api` / `baseUrl` خانواده ارائه‌دهنده را پیش از مونتاژ عمومی مدل عادی‌سازی می‌کند                                      | ارائه‌دهنده مالک پاک‌سازی انتقال برای شناسه‌های ارائه‌دهنده سفارشی در همان خانواده انتقال است                                                          |
| 5   | `normalizeConfig`                 | `models.providers.<id>` را پیش از رفع زمان اجرا/ارائه‌دهنده عادی‌سازی می‌کند                                           | ارائه‌دهنده به پاک‌سازی پیکربندی نیاز دارد که باید همراه Plugin باشد؛ کمک‌کننده‌های خانواده Google بسته‌بندی‌شده نیز از مدخل‌های پیکربندی پشتیبانی‌شده Google پشتیبانی پشتیبان می‌کنند   |
| 6   | `applyNativeStreamingUsageCompat` | بازنویسی‌های سازگاری مصرف پخش جریانی بومی را روی ارائه‌دهندگان پیکربندی اعمال می‌کند                                               | ارائه‌دهنده به اصلاحات فراداده مصرف پخش جریانی بومی مبتنی بر نقطه پایانی نیاز دارد                                                                          |
| 7   | `resolveConfigApiKey`             | احراز هویت نشانگر محیط را برای ارائه‌دهندگان پیکربندی، پیش از بارگذاری احراز هویت زمان اجرا، رفع می‌کند                                       | ارائه‌دهنده رفع کلید API نشانگر محیطِ متعلق به ارائه‌دهنده دارد؛ `amazon-bedrock` نیز اینجا یک رفع‌کننده داخلی نشانگر محیط AWS دارد                  |
| 8   | `resolveSyntheticAuth`            | احراز هویت محلی/خودمیزبان یا مبتنی بر پیکربندی را بدون ماندگار کردن متن ساده نمایان می‌کند                                   | ارائه‌دهنده می‌تواند با یک نشانگر اعتبارنامه مصنوعی/محلی کار کند                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | نمایه‌های احراز هویت خارجیِ متعلق به ارائه‌دهنده را روی هم می‌اندازد؛ `persistence` پیش‌فرض برای اعتبارنامه‌های متعلق به CLI/برنامه، `runtime-only` است | ارائه‌دهنده از اعتبارنامه‌های احراز هویت خارجی بدون ماندگار کردن توکن‌های نوسازی کپی‌شده دوباره استفاده می‌کند؛ `contracts.externalAuthProviders` را در مانیفست اعلام کنید |
| 10  | `shouldDeferSyntheticProfileAuth` | جایگاه‌نماهای ذخیره‌شده نمایه مصنوعی را پشت احراز هویت مبتنی بر محیط/پیکربندی پایین می‌آورد                                      | ارائه‌دهنده نمایه‌های جایگاه‌نمای مصنوعی ذخیره می‌کند که نباید اولویت را ببرند                                                                 |
| 11  | `resolveDynamicModel`             | جایگزین همگام برای شناسه‌های مدلِ متعلق به ارائه‌دهنده که هنوز در رجیستری محلی نیستند                                       | ارائه‌دهنده شناسه‌های دلخواه مدل بالادستی را می‌پذیرد                                                                                                 |
| 12  | `prepareDynamicModel`             | گرم‌سازی ناهمگام، سپس `resolveDynamicModel` دوباره اجرا می‌شود                                                           | ارائه‌دهنده پیش از رفع شناسه‌های ناشناخته به فراداده شبکه نیاز دارد                                                                                  |
| 13  | `normalizeResolvedModel`          | بازنویسی نهایی پیش از آنکه اجراکننده تعبیه‌شده از مدل رفع‌شده استفاده کند                                               | ارائه‌دهنده به بازنویسی‌های انتقال نیاز دارد اما همچنان از انتقال هسته استفاده می‌کند                                                                             |
| 14  | `contributeResolvedModelCompat`   | پرچم‌های سازگاری را برای مدل‌های فروشنده پشت یک انتقال سازگار دیگر فراهم می‌کند                                  | ارائه‌دهنده مدل‌های خودش را روی انتقال‌های پراکسی تشخیص می‌دهد، بدون اینکه کنترل ارائه‌دهنده را به دست بگیرد                                                       |
| 15  | `normalizeToolSchemas`            | طرح‌واره‌های ابزار را پیش از اینکه اجراکننده تعبیه‌شده آن‌ها را ببیند عادی‌سازی می‌کند                                                    | ارائه‌دهنده به پاک‌سازی طرح‌واره خانواده انتقال نیاز دارد                                                                                                |
| 16  | `inspectToolSchemas`              | عیب‌یابی‌های طرح‌واره متعلق به ارائه‌دهنده را پس از عادی‌سازی نمایان می‌کند                                                  | ارائه‌دهنده هشدارهای کلیدواژه‌ای می‌خواهد، بدون اینکه قواعد مخصوص ارائه‌دهنده به هسته آموزش داده شود                                                                 |
| 17  | `resolveReasoningOutputMode`      | قرارداد خروجی استدلال بومی در برابر برچسب‌دار را انتخاب می‌کند                                                              | ارائه‌دهنده به استدلال/خروجی نهایی برچسب‌دار به‌جای فیلدهای بومی نیاز دارد                                                                         |
| 18  | `prepareExtraParams`              | عادی‌سازی پارامترهای درخواست پیش از پوشش‌دهنده‌های عمومی گزینه پخش جریانی                                              | ارائه‌دهنده به پارامترهای درخواست پیش‌فرض یا پاک‌سازی پارامتر مخصوص ارائه‌دهنده نیاز دارد                                                                           |
| 19  | `createStreamFn`                  | مسیر عادی پخش جریانی را به‌طور کامل با یک انتقال سفارشی جایگزین می‌کند                                                   | ارائه‌دهنده به یک پروتکل سیمی سفارشی نیاز دارد، نه فقط یک پوشش‌دهنده                                                                                     |
| 20  | `wrapStreamFn`                    | پوشش‌دهنده پخش جریانی پس از اعمال پوشش‌دهنده‌های عمومی                                                              | ارائه‌دهنده به پوشش‌دهنده‌های سازگاری سرآیند/بدنه/مدل درخواست بدون انتقال سفارشی نیاز دارد                                                          |
| 21  | `resolveTransportTurnState`       | سرآیندها یا فراداده‌های انتقال بومیِ هر نوبت را پیوست می‌کند                                                           | ارائه‌دهنده می‌خواهد انتقال‌های عمومی، هویت نوبت بومی ارائه‌دهنده را ارسال کنند                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | سرآیندهای WebSocket بومی یا سیاست خنک‌سازی نشست را پیوست می‌کند                                                    | ارائه‌دهنده می‌خواهد انتقال‌های عمومی WS، سرآیندهای نشست یا سیاست جایگزین را تنظیم کنند                                                               |
| 23  | `formatApiKey`                    | قالب‌ساز نمایه احراز هویت: نمایه ذخیره‌شده به رشته `apiKey` زمان اجرا تبدیل می‌شود                                     | ارائه‌دهنده فراداده احراز هویت اضافی ذخیره می‌کند و به شکل توکن زمان اجرای سفارشی نیاز دارد                                                                    |
| 24  | `refreshOAuth`                    | بازنویسی نوسازی OAuth برای نقطه‌های پایانی نوسازی سفارشی یا سیاست شکست نوسازی                                  | ارائه‌دهنده با نوسازهای مشترک `pi-ai` سازگار نیست                                                                                           |
| 25  | `buildAuthDoctorHint`             | راهنمای تعمیر که هنگام شکست نوسازی OAuth افزوده می‌شود                                                                  | ارائه‌دهنده پس از شکست نوسازی به راهنمای تعمیر احراز هویتِ متعلق به ارائه‌دهنده نیاز دارد                                                                      |
| 26  | `matchesContextOverflowError`     | تطبیق‌دهنده سرریز پنجره زمینه متعلق به ارائه‌دهنده                                                                 | ارائه‌دهنده خطاهای خام سرریز دارد که ابتکارهای عمومی آن‌ها را از دست می‌دهند                                                                                |
| 27  | `classifyFailoverReason`          | طبقه‌بندی دلیل جایگزینی متعلق به ارائه‌دهنده                                                                  | ارائه‌دهنده می‌تواند خطاهای خام API/انتقال را به محدودیت نرخ/بار بیش از حد/و غیره نگاشت کند                                                                          |
| 28  | `isCacheTtlEligible`              | سیاست کش درخواست برای ارائه‌دهندگان پراکسی/پس‌انتقال                                                               | ارائه‌دهنده به دروازه‌گذاری TTL کش مخصوص پراکسی نیاز دارد                                                                                                |
| 29  | `buildMissingAuthMessage`         | جایگزین پیام عمومی بازیابی احراز هویتِ گم‌شده                                                      | ارائه‌دهنده به راهنمای بازیابی احراز هویت گم‌شده مخصوص ارائه‌دهنده نیاز دارد                                                                                 |
| 30  | `augmentModelCatalog`             | ردیف‌های مصنوعی/نهایی کاتالوگ که پس از کشف افزوده می‌شوند                                                          | ارائه‌دهنده به ردیف‌های مصنوعی سازگاری آینده در `models list` و انتخابگرها نیاز دارد                                                                     |
| 31  | `resolveThinkingProfile`          | مجموعه سطح‌های مخصوص مدل برای `/think`، برچسب‌های نمایشی، و پیش‌فرض                                                 | ارائه‌دهنده نردبان فکر کردن سفارشی یا برچسب دودویی را برای مدل‌های منتخب نمایان می‌کند                                                                 |
| 32  | `isBinaryThinking`                | قلاب سازگاری کلید روشن/خاموش استدلال                                                                     | ارائه‌دهنده فقط فکر کردن دودویی روشن/خاموش را نمایان می‌کند                                                                                                  |
| 33  | `supportsXHighThinking`           | قلاب سازگاری پشتیبانی از استدلال `xhigh`                                                                   | ارائه‌دهنده `xhigh` را فقط برای زیرمجموعه‌ای از مدل‌ها می‌خواهد                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | قلاب سازگاری سطح پیش‌فرض `/think`                                                                      | ارائه‌دهنده مالک سیاست پیش‌فرض `/think` برای یک خانواده مدل است                                                                                      |
| 35  | `isModernModelRef`                | تطبیق‌دهنده مدل مدرن برای فیلترهای نمایه زنده و انتخاب آزمون دود                                              | ارائه‌دهنده مالک تطبیق مدل ترجیحی زنده/آزمون دود است                                                                                             |
| 36  | `prepareRuntimeAuth`              | درست پیش از استنتاج، یک اعتبارنامه پیکربندی‌شده را به توکن/کلید واقعی زمان اجرا تبدیل می‌کند                       | ارائه‌دهنده به تبادل توکن یا اعتبارنامه درخواست کوتاه‌مدت نیاز دارد                                                                             |
| 37  | `resolveUsageAuth`                | اعتبارنامه‌های مصرف/صورتحساب را برای `/usage` و سطوح وضعیت مرتبط تعیین می‌کند                                     | ارائه‌دهنده به تجزیهٔ سفارشی توکن مصرف/سهمیه یا یک اعتبارنامهٔ مصرف متفاوت نیاز دارد                                                               |
| 38  | `fetchUsageSnapshot`              | پس از تعیین احراز هویت، نماهای لحظه‌ای مصرف/سهمیهٔ ویژهٔ ارائه‌دهنده را دریافت و نرمال‌سازی می‌کند                             | ارائه‌دهنده به یک نقطهٔ پایانی مصرف ویژهٔ ارائه‌دهنده یا تجزیه‌گر payload نیاز دارد                                                                           |
| 39  | `createEmbeddingProvider`         | یک آداپتر embedding متعلق به ارائه‌دهنده برای حافظه/جست‌وجو می‌سازد                                                     | رفتار embedding حافظه به Plugin ارائه‌دهنده تعلق دارد                                                                                    |
| 40  | `buildReplayPolicy`               | یک سیاست replay برمی‌گرداند که مدیریت رونوشت را برای ارائه‌دهنده کنترل می‌کند                                        | ارائه‌دهنده به سیاست رونوشت سفارشی نیاز دارد (برای مثال، حذف بلوک‌های تفکر)                                                               |
| 41  | `sanitizeReplayHistory`           | پس از پاک‌سازی عمومی رونوشت، تاریخچهٔ replay را بازنویسی می‌کند                                                        | ارائه‌دهنده به بازنویسی‌های replay ویژهٔ ارائه‌دهنده فراتر از کمک‌کننده‌های Compaction مشترک نیاز دارد                                                             |
| 42  | `validateReplayTurns`             | اعتبارسنجی نهایی نوبت‌های replay یا تغییر شکل آن‌ها پیش از runner تعبیه‌شده                                           | انتقال ارائه‌دهنده پس از پاک‌سازی عمومی به اعتبارسنجی سخت‌گیرانه‌تر نوبت‌ها نیاز دارد                                                                    |
| 43  | `onModelSelected`                 | اثرات جانبی پس از انتخابِ متعلق به ارائه‌دهنده را اجرا می‌کند                                                                 | وقتی یک مدل فعال می‌شود، ارائه‌دهنده به telemetry یا وضعیت متعلق به ارائه‌دهنده نیاز دارد                                                                  |

`normalizeModelId`، `normalizeTransport` و `normalizeConfig` ابتدا Plugin ارائه‌دهندهٔ
مطابق را بررسی می‌کنند، سپس از میان دیگر Pluginهای ارائه‌دهندهٔ دارای قابلیت hook عبور
می‌کنند تا زمانی که یکی از آن‌ها واقعاً شناسهٔ مدل یا transport/config را تغییر دهد. این کار
باعث می‌شود shimهای ارائه‌دهندهٔ alias/compat بدون نیاز به این‌که فراخواننده بداند کدام
Plugin بسته‌بندی‌شده مالک بازنویسی است، کار کنند. اگر هیچ hook ارائه‌دهنده‌ای یک ورودی
پیکربندی پشتیبانی‌شده از خانوادهٔ Google را بازنویسی نکند، نرمال‌ساز پیکربندی Google
بسته‌بندی‌شده همچنان آن پاک‌سازی سازگاری را اعمال می‌کند.

اگر ارائه‌دهنده به یک پروتکل wire کاملاً سفارشی یا اجراکنندهٔ درخواست سفارشی نیاز داشته
باشد، این یک ردهٔ متفاوت از افزونه است. این hookها برای رفتار ارائه‌دهنده‌ای هستند که همچنان
روی حلقهٔ استنتاج عادی OpenClaw اجرا می‌شود.

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

Pluginهای ارائه‌دهندهٔ بسته‌بندی‌شده hookهای بالا را ترکیب می‌کنند تا با کاتالوگ، احراز
هویت، thinking، replay و نیازهای مصرف هر فروشنده سازگار شوند. مجموعهٔ معتبر hookها با
هر Plugin در `extensions/` قرار دارد؛ این صفحه شکل‌ها را نشان می‌دهد، نه این‌که فهرست را
عیناً بازتاب دهد.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter، Kilocode، Z.AI، xAI، `catalog` را به‌همراه
    `resolveDynamicModel` / `prepareDynamicModel` ثبت می‌کنند تا بتوانند شناسه‌های
    مدل بالادستی را پیش از کاتالوگ ایستای OpenClaw عرضه کنند.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot، Gemini CLI، ChatGPT Codex، MiniMax، Xiaomi، z.ai،
    `prepareRuntimeAuth` یا `formatApiKey` را با `resolveUsageAuth` +
    `fetchUsageSnapshot` جفت می‌کنند تا تبادل توکن و یکپارچه‌سازی `/usage` را مالک شوند.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    خانواده‌های نام‌دار مشترک (`google-gemini`، `passthrough-gemini`،
    `anthropic-by-model`، `hybrid-anthropic-openai`) به ارائه‌دهندگان اجازه می‌دهند از
    طریق `buildReplayPolicy` در سیاست transcript شرکت کنند، به‌جای این‌که هر Plugin
    پاک‌سازی را دوباره پیاده‌سازی کند.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`، `cloudflare-ai-gateway`، `huggingface`، `kimi-coding`، `nvidia`،
    `qianfan`، `synthetic`، `together`، `venice`، `vercel-ai-gateway` و
    `volcengine` فقط `catalog` را ثبت می‌کنند و از حلقهٔ استنتاج مشترک استفاده می‌کنند.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    سرآیندهای بتا، `/fast` / `serviceTier` و `context1m` به‌جای SDK عمومی، داخل
    مرز عمومی `api.ts` / `contract-api.ts` متعلق به Plugin Anthropic قرار دارند
    (`wrapAnthropicProviderStream`، `resolveAnthropicBetas`،
    `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`).
  </Accordion>
</AccordionGroup>

## کمک‌کننده‌های زمان اجرا

Pluginها می‌توانند از طریق `api.runtime` به کمک‌کننده‌های منتخب هسته دسترسی داشته باشند. برای TTS:

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

- `textToSpeech` خروجی payload عادی TTS هسته را برای سطح‌های فایل/یادداشت صوتی برمی‌گرداند.
- از پیکربندی `messages.tts` هسته و انتخاب ارائه‌دهنده استفاده می‌کند.
- بافر صوتی PCM + نرخ نمونه‌برداری را برمی‌گرداند. Pluginها باید برای ارائه‌دهندگان resample/encode انجام دهند.
- `listVoices` برای هر ارائه‌دهنده اختیاری است. از آن برای انتخاب‌گرهای صدای متعلق به فروشنده یا جریان‌های راه‌اندازی استفاده کنید.
- فهرست صداها می‌تواند فرادادهٔ غنی‌تری مانند locale، gender و برچسب‌های personality برای انتخاب‌گرهای آگاه از ارائه‌دهنده داشته باشد.
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

یادداشت‌ها:

- سیاست TTS، fallback و تحویل پاسخ را در هسته نگه دارید.
- از ارائه‌دهندگان گفتار برای رفتار سنتز متعلق به فروشنده استفاده کنید.
- ورودی قدیمی Microsoft `edge` به شناسهٔ ارائه‌دهندهٔ `microsoft` نرمال می‌شود.
- مدل مالکیت ترجیحی شرکت‌محور است: یک Plugin فروشنده می‌تواند ارائه‌دهندگان متن، گفتار، تصویر و رسانه‌های آینده را با اضافه شدن قراردادهای قابلیت توسط OpenClaw مالک شود.

برای درک تصویر/صوت/ویدئو، Pluginها به‌جای یک مجموعهٔ key/value عمومی، یک ارائه‌دهندهٔ
typed برای media-understanding ثبت می‌کنند:

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

- orchestration، fallback، پیکربندی و سیم‌کشی کانال را در هسته نگه دارید.
- رفتار فروشنده را در Plugin ارائه‌دهنده نگه دارید.
- گسترش افزایشی باید typed بماند: متدهای اختیاری جدید، فیلدهای نتیجهٔ اختیاری جدید، قابلیت‌های اختیاری جدید.
- تولید ویدئو از پیش همین الگو را دنبال می‌کند:
  - هسته مالک قرارداد قابلیت و کمک‌کنندهٔ زمان اجرا است
  - Pluginهای فروشنده `api.registerVideoGenerationProvider(...)` را ثبت می‌کنند
  - Pluginهای ویژگی/کانال از `api.runtime.videoGeneration.*` استفاده می‌کنند

برای کمک‌کننده‌های زمان اجرای media-understanding، Pluginها می‌توانند فراخوانی کنند:

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

برای رونویسی صوت، Pluginها می‌توانند یا از زمان اجرای media-understanding استفاده کنند
یا از alias قدیمی‌تر STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

یادداشت‌ها:

- `api.runtime.mediaUnderstanding.*` سطح مشترک ترجیحی برای درک تصویر/صوت/ویدئو است.
- از پیکربندی صوتی media-understanding هسته (`tools.media.audio`) و ترتیب fallback ارائه‌دهنده استفاده می‌کند.
- وقتی هیچ خروجی رونویسی تولید نشود، `{ text: undefined }` را برمی‌گرداند؛ برای مثال ورودی ردشده/پشتیبانی‌نشده.
- `api.runtime.stt.transcribeAudioFile(...)` همچنان به‌عنوان alias سازگاری باقی می‌ماند.

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

یادداشت‌ها:

- `provider` و `model` بازنویسی‌های اختیاری برای هر اجرا هستند، نه تغییرات پایدار session.
- OpenClaw این فیلدهای بازنویسی را فقط برای فراخواننده‌های مورد اعتماد رعایت می‌کند.
- برای اجرای fallback متعلق به Plugin، اپراتورها باید با `plugins.entries.<id>.subagent.allowModelOverride: true` اعلام موافقت کنند.
- از `plugins.entries.<id>.subagent.allowedModels` برای محدود کردن Pluginهای مورد اعتماد به هدف‌های canonical مشخص `provider/model` استفاده کنید، یا از `"*"` برای مجاز کردن صریح هر هدف.
- اجرای subagent توسط Plugin نامعتبر همچنان کار می‌کند، اما درخواست‌های بازنویسی به‌جای fallback بی‌صدا، رد می‌شوند.
- sessionهای subagent ساخته‌شده توسط Plugin با شناسهٔ Plugin سازنده برچسب‌گذاری می‌شوند. fallback `api.runtime.subagent.deleteSession(...)` فقط می‌تواند همان sessionهای متعلق را حذف کند؛ حذف دلخواه session همچنان به یک درخواست Gateway با دامنهٔ admin نیاز دارد.

برای جست‌وجوی وب، Pluginها می‌توانند به‌جای دست بردن در سیم‌کشی ابزار agent، از
کمک‌کنندهٔ مشترک زمان اجرا استفاده کنند:

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

یادداشت‌ها:

- انتخاب ارائه‌دهنده، حل اعتبارنامه و معناشناسی درخواست مشترک را در هسته نگه دارید.
- از ارائه‌دهندگان جست‌وجوی وب برای transportهای جست‌وجوی ویژهٔ فروشنده استفاده کنید.
- `api.runtime.webSearch.*` سطح مشترک ترجیحی برای Pluginهای ویژگی/کانالی است که بدون وابستگی به wrapper ابزار agent به رفتار جست‌وجو نیاز دارند.

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

- `generate(...)`: با استفاده از زنجیرهٔ پیکربندی‌شدهٔ ارائه‌دهندهٔ image-generation یک تصویر تولید کنید.
- `listProviders(...)`: ارائه‌دهندگان image-generation موجود و قابلیت‌هایشان را فهرست کنید.

## مسیرهای HTTP در Gateway

Pluginها می‌توانند با `api.registerHttpRoute(...)` endpointهای HTTP ارائه کنند.

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

- `path`: مسیر route زیر سرور HTTP Gateway.
- `auth`: الزامی است. از `"gateway"` برای الزام احراز هویت عادی Gateway استفاده کنید، یا از `"plugin"` برای احراز هویت/Webhook verification مدیریت‌شده توسط Plugin.
- `match`: اختیاری. `"exact"` (پیش‌فرض) یا `"prefix"`.
- `replaceExisting`: اختیاری. به همان Plugin اجازه می‌دهد ثبت route موجود خودش را جایگزین کند.
- `handler`: وقتی route درخواست را پردازش کرد، `true` برگردانید.

یادداشت‌ها:

- `api.registerHttpHandler(...)` حذف شده است و باعث خطای بارگذاری Plugin می‌شود. به‌جای آن از `api.registerHttpRoute(...)` استفاده کنید.
- مسیرهای Plugin باید `auth` را به‌صراحت اعلام کنند.
- تداخل‌های دقیق `path + match` رد می‌شوند مگر اینکه `replaceExisting: true` باشد، و یک Plugin نمی‌تواند مسیر Plugin دیگری را جایگزین کند.
- مسیرهای هم‌پوشان با سطح‌های متفاوت `auth` رد می‌شوند. زنجیره‌های fallback مربوط به `exact`/`prefix` را فقط در همان سطح احراز هویت نگه دارید.
- مسیرهای `auth: "plugin"` به‌صورت خودکار scopeهای runtime اپراتور را دریافت نمی‌کنند. این مسیرها برای Webhookهای مدیریت‌شده توسط Plugin/اعتبارسنجی امضا هستند، نه فراخوانی‌های کمکی ممتاز Gateway.
- مسیرهای `auth: "gateway"` داخل scope runtime درخواست Gateway اجرا می‌شوند، اما این scope عمداً محافظه‌کارانه است:
  - احراز هویت bearer با secret مشترک (`gateway.auth.mode = "token"` / `"password"`) scopeهای runtime مسیر Plugin را روی `operator.write` ثابت نگه می‌دارد، حتی اگر فراخواننده `x-openclaw-scopes` را ارسال کند
  - حالت‌های HTTP مورد اعتماد و حامل هویت (برای مثال `trusted-proxy` یا `gateway.auth.mode = "none"` روی یک ورودی خصوصی) فقط وقتی `x-openclaw-scopes` را رعایت می‌کنند که header به‌صراحت وجود داشته باشد
  - اگر `x-openclaw-scopes` در آن درخواست‌های مسیر Plugin حامل هویت وجود نداشته باشد، scope runtime به `operator.write` بازمی‌گردد
- قاعده عملی: فرض نکنید یک مسیر Plugin با احراز هویت Gateway به‌طور ضمنی سطح ادمین است. اگر مسیر شما به رفتار فقط-ادمین نیاز دارد، یک حالت احراز هویت حامل هویت را الزامی کنید و قرارداد صریح header `x-openclaw-scopes` را مستند کنید.

## مسیرهای import در SDK Plugin

هنگام نوشتن Pluginهای جدید، به‌جای barrel ریشه یکپارچه `openclaw/plugin-sdk` از زیرمسیرهای باریک SDK استفاده کنید. زیرمسیرهای اصلی:

| زیرمسیر                             | هدف                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | سازوکارهای اولیه ثبت Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | کمک‌کننده‌های entry/build برای کانال                        |
| `openclaw/plugin-sdk/core`          | کمک‌کننده‌های مشترک عمومی و قرارداد چتری       |
| `openclaw/plugin-sdk/config-schema` | شِمای Zod ریشه `openclaw.json` (`OpenClawSchema`) |

Pluginهای کانال از خانواده‌ای از seamهای باریک انتخاب می‌کنند — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`، و `channel-actions`. رفتار تأیید باید به‌جای ترکیب کردن فیلدهای نامرتبط
Plugin، روی یک قرارداد `approvalCapability` واحد متمرکز شود. به [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) مراجعه کنید.

کمک‌کننده‌های runtime و پیکربندی زیر زیرمسیرهای متمرکز و متناظر `*-runtime` قرار دارند
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`، و غیره). به‌جای barrel سازگاری گسترده `config-runtime`، از `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`، و `config-mutation`
استفاده کنید.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
و `openclaw/plugin-sdk/infra-runtime` shimهای سازگاری منسوخ‌شده برای
Pluginهای قدیمی‌تر هستند. کد جدید باید به‌جای آن‌ها سازوکارهای اولیه عمومی باریک‌تر را import کند.
</Info>

نقطه‌های ورود داخلی repo (برای ریشه package هر Plugin بسته‌بندی‌شده):

- `index.js` — entry مربوط به Plugin بسته‌بندی‌شده
- `api.js` — barrel کمک‌کننده‌ها/types
- `runtime-api.js` — barrel فقط-runtime
- `setup-entry.js` — entry مربوط به Plugin راه‌اندازی

Pluginهای خارجی باید فقط زیرمسیرهای `openclaw/plugin-sdk/*` را import کنند. هرگز
`src/*` مربوط به package یک Plugin دیگر را از core یا از Plugin دیگر import نکنید.
نقطه‌های ورود بارگذاری‌شده از طریق facade وقتی snapshot پیکربندی runtime فعال وجود داشته باشد، آن را ترجیح می‌دهند و سپس به فایل پیکربندی resolveشده روی دیسک fallback می‌کنند.

زیرمسیرهای مخصوص capability مانند `image-generation`, `media-understanding`,
و `speech` وجود دارند چون Pluginهای بسته‌بندی‌شده امروز از آن‌ها استفاده می‌کنند. آن‌ها
به‌صورت خودکار قراردادهای خارجی بلندمدت و منجمد نیستند — هنگام اتکا به آن‌ها صفحه مرجع SDK مربوط را بررسی کنید.

## شِماهای ابزار پیام

Pluginها باید contributionهای شِمای `describeMessageTool(...)` مخصوص کانال را
برای سازوکارهای غیرپیامی مانند واکنش‌ها، خواندن‌ها، و نظرسنجی‌ها مالک شوند.
نمایش ارسال مشترک باید به‌جای فیلدهای دکمه، component، block، یا card بومی provider، از قرارداد عمومی `MessagePresentation` استفاده کند.
برای قرارداد، قواعد fallback، نگاشت provider، و چک‌لیست نویسنده Plugin، [نمایش پیام](/fa/plugins/message-presentation) را ببینید.

Pluginهای دارای قابلیت ارسال اعلام می‌کنند که چه چیزهایی را از طریق قابلیت‌های پیام می‌توانند render کنند:

- `presentation` برای blockهای نمایش معنایی (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` برای درخواست‌های تحویل pinشده

Core تصمیم می‌گیرد نمایش را به‌صورت بومی render کند یا آن را به متن تنزل دهد.
راه‌های فرار UI بومی provider را از ابزار پیام عمومی expose نکنید.
کمک‌کننده‌های SDK منسوخ‌شده برای شِماهای بومی legacy همچنان برای Pluginهای third-party موجود export می‌شوند، اما Pluginهای جدید نباید از آن‌ها استفاده کنند.

## resolve کردن target کانال

Pluginهای کانال باید معنای target مخصوص کانال را مالک شوند. میزبان outbound مشترک را عمومی نگه دارید و برای قواعد provider از سطح adapter پیام‌رسانی استفاده کنید:

- `messaging.inferTargetChatType({ to })` تصمیم می‌گیرد که یک target نرمال‌سازی‌شده پیش از جست‌وجوی directory باید به‌عنوان `direct`، `group`، یا `channel` در نظر گرفته شود.
- `messaging.targetResolver.looksLikeId(raw, normalized)` به core می‌گوید آیا ورودی باید به‌جای جست‌وجوی directory مستقیماً به resolution شبیه id برود یا نه.
- `messaging.targetResolver.resolveTarget(...)` fallback مربوط به Plugin است وقتی core پس از نرمال‌سازی یا پس از miss در directory به یک resolution نهایی متعلق به provider نیاز دارد.
- `messaging.resolveOutboundSessionRoute(...)` پس از resolve شدن target، ساخت مسیر session مخصوص provider را مالک می‌شود.

تقسیم پیشنهادی:

- از `inferTargetChatType` برای تصمیم‌های دسته‌بندی استفاده کنید که باید قبل از جست‌وجوی peers/groups انجام شوند.
- از `looksLikeId` برای بررسی‌های «این را به‌عنوان یک target id صریح/بومی در نظر بگیر» استفاده کنید.
- از `resolveTarget` برای fallback نرمال‌سازی مخصوص provider استفاده کنید، نه برای جست‌وجوی گسترده directory.
- idهای بومی provider مانند chat idها، thread idها، JIDها، handleها، و room idها را داخل مقدارهای `target` یا پارامترهای مخصوص provider نگه دارید، نه در فیلدهای عمومی SDK.

## Directoryهای مبتنی بر پیکربندی

Pluginهایی که entryهای directory را از پیکربندی مشتق می‌کنند باید آن منطق را در
Plugin نگه دارند و از کمک‌کننده‌های مشترک
`openclaw/plugin-sdk/directory-runtime` دوباره استفاده کنند.

وقتی یک کانال به peers/groups مبتنی بر پیکربندی نیاز دارد، مانند موارد زیر، از این استفاده کنید:

- peerهای DM مبتنی بر allowlist
- نگاشت‌های پیکربندی‌شده channel/group
- fallbackهای directory ایستا با scope حساب

کمک‌کننده‌های مشترک در `directory-runtime` فقط عملیات عمومی را مدیریت می‌کنند:

- فیلتر کردن query
- اعمال limit
- کمک‌کننده‌های dedupe/نرمال‌سازی
- ساخت `ChannelDirectoryEntry[]`

بازرسی حساب و نرمال‌سازی id مخصوص کانال باید در پیاده‌سازی
Plugin باقی بماند.

## Catalogهای provider

Pluginهای provider می‌توانند با
`registerProvider({ catalog: { run(...) { ... } } })` catalogهای مدل را برای inference تعریف کنند.

`catalog.run(...)` همان شکلی را برمی‌گرداند که OpenClaw در
`models.providers` می‌نویسد:

- `{ provider }` برای یک entry provider
- `{ providers }` برای چند entry provider

وقتی Plugin مالک idهای مدل مخصوص provider، پیش‌فرض‌های base URL، یا metadata مدل وابسته به auth است، از `catalog` استفاده کنید.

`catalog.order` کنترل می‌کند catalog یک Plugin نسبت به providerهای implicit داخلی OpenClaw چه زمانی merge شود:

- `simple`: providerهای ساده مبتنی بر API key یا env
- `profile`: providerهایی که وقتی auth profileها وجود دارند ظاهر می‌شوند
- `paired`: providerهایی که چند entry provider مرتبط را synthesize می‌کنند
- `late`: آخرین pass، پس از providerهای implicit دیگر

providerهای بعدی در collision کلید برنده می‌شوند، بنابراین Pluginها می‌توانند عمداً یک entry provider داخلی با همان provider id را override کنند.

سازگاری:

- `discovery` همچنان به‌عنوان alias legacy کار می‌کند
- اگر هم `catalog` و هم `discovery` ثبت شده باشند، OpenClaw از `catalog` استفاده می‌کند

## بازرسی فقط-خواندنی کانال

اگر Plugin شما یک کانال ثبت می‌کند، پیاده‌سازی
`plugin.config.inspectAccount(cfg, accountId)` را در کنار `resolveAccount(...)` ترجیح دهید.

چرا:

- `resolveAccount(...)` مسیر runtime است. مجاز است فرض کند credentials کاملاً materialize شده‌اند و وقتی secretهای لازم وجود ندارند سریع fail کند.
- مسیرهای command فقط-خواندنی مانند `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`، و جریان‌های repair مربوط به doctor/config
  نباید فقط برای توصیف پیکربندی نیاز داشته باشند credentials runtime را materialize کنند.

رفتار پیشنهادی `inspectAccount(...)`:

- فقط وضعیت توصیفی حساب را برگردانید.
- `enabled` و `configured` را حفظ کنید.
- هنگام مرتبط بودن، فیلدهای منبع/وضعیت credential را شامل کنید، مانند:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- فقط برای گزارش در دسترس بودن فقط-خواندنی لازم نیست مقدارهای خام token را برگردانید. برگرداندن `tokenStatus: "available"` (و فیلد source متناظر) برای commandهای سبک status کافی است.
- وقتی یک credential از طریق SecretRef پیکربندی شده اما در مسیر command فعلی در دسترس نیست، از `configured_unavailable` استفاده کنید.

این باعث می‌شود commandهای فقط-خواندنی به‌جای crash کردن یا گزارش اشتباه حساب به‌عنوان پیکربندی‌نشده، عبارت «پیکربندی‌شده اما در این مسیر command در دسترس نیست» را گزارش کنند.

## Package packها

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

هر entry به یک Plugin تبدیل می‌شود. اگر pack چند extension را فهرست کند، id مربوط به Plugin به
`name/<fileBase>` تبدیل می‌شود.

اگر Plugin شما deps مربوط به npm را import می‌کند، آن‌ها را در همان directory نصب کنید تا
`node_modules` در دسترس باشد (`npm install` / `pnpm install`).

محافظ امنیتی: هر entry در `openclaw.extensions` پس از resolve شدن symlink باید داخل directory مربوط به Plugin باقی بماند. entryهایی که از directory package خارج شوند رد می‌شوند.

نکته امنیتی: `openclaw plugins install` وابستگی‌های Plugin را با یک
`npm install --omit=dev --ignore-scripts` محلی پروژه نصب می‌کند (بدون lifecycle script،
بدون وابستگی dev در runtime)، و تنظیمات npm install سراسری inherited را نادیده می‌گیرد.
درخت‌های وابستگی Plugin را «JS/TS خالص» نگه دارید و از packageهایی که به buildهای `postinstall` نیاز دارند پرهیز کنید.

اختیاری: `openclaw.setupEntry` می‌تواند به یک module سبک فقط-راه‌اندازی اشاره کند.
وقتی OpenClaw به سطح‌های setup برای یک Plugin کانال غیرفعال نیاز دارد، یا
وقتی یک Plugin کانال فعال است اما هنوز پیکربندی نشده، به‌جای entry کامل Plugin،
`setupEntry` را بارگذاری می‌کند. این کار startup و setup را سبک‌تر نگه می‌دارد
وقتی entry اصلی Plugin شما همچنین tools، hooks، یا کدهای دیگر فقط-runtime را سیم‌کشی می‌کند.

اختیاری: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
می‌تواند یک Plugin کانال را حتی وقتی کانال از قبل پیکربندی شده است، در طول مرحله startup پیش از listen مربوط به gateway، وارد همان مسیر `setupEntry` کند.

فقط وقتی از این استفاده کنید که `setupEntry` سطح startup لازم پیش از شروع listen کردن gateway را کاملاً پوشش دهد. در عمل، یعنی setup entry
باید هر capability متعلق به کانال را که startup به آن وابسته است ثبت کند، مانند:

- خود ثبت کانال
- هر مسیر HTTP که باید پیش از شروع listen کردن gateway در دسترس باشد
- هر method، tool، یا service مربوط به gateway که باید در همان بازه وجود داشته باشد

اگر entry کامل شما هنوز مالک هر capability لازم برای startup است، این flag را فعال نکنید. Plugin را روی رفتار پیش‌فرض نگه دارید و اجازه دهید OpenClaw در طول startup entry کامل را بارگذاری کند.

کانال‌های بسته‌بندی‌شده همچنین می‌توانند کمک‌کننده‌های سطح قرارداد فقط-setup منتشر کنند که core بتواند پیش از بارگذاری runtime کامل کانال با آن‌ها مشورت کند. سطح promotion فعلی setup این است:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

هسته زمانی از این سطح استفاده می‌کند که لازم باشد پیکربندی کانال تک‌حساب قدیمی را بدون بارگذاری ورودی کامل Plugin، به `channels.<id>.accounts.*` ارتقا دهد. Matrix نمونهٔ بسته‌بندی‌شدهٔ فعلی است: فقط کلیدهای احراز هویت/بوت‌استرپ را به یک حساب ارتقایافتهٔ نام‌دار منتقل می‌کند، آن هم وقتی حساب‌های نام‌دار از قبل وجود داشته باشند، و می‌تواند به‌جای اینکه همیشه `accounts.default` را بسازد، یک کلید حساب پیش‌فرضِ پیکربندی‌شدهٔ غیرکاننیکال را حفظ کند.

آن آداپتورهای وصلهٔ راه‌اندازی، کشف سطح قرارداد بسته‌بندی‌شده را تنبل نگه می‌دارند. زمان واردسازی سبک می‌ماند؛ سطح ارتقا فقط در نخستین استفاده بارگذاری می‌شود، نه اینکه هنگام واردسازی ماژول دوباره وارد راه‌اندازی کانال بسته‌بندی‌شده شود.

وقتی آن سطوح راه‌اندازی شامل روش‌های RPC مربوط به Gateway هستند، آن‌ها را روی یک پیشوند مخصوص Plugin نگه دارید. فضاهای نام مدیریتی هسته (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) رزرو می‌مانند و همیشه به `operator.admin` resolve می‌شوند، حتی اگر یک Plugin دامنهٔ محدودتری درخواست کند.

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

Pluginهای کانال می‌توانند فرادادهٔ راه‌اندازی/کشف را از طریق `openclaw.channel` و راهنمایی‌های نصب را از طریق `openclaw.install` اعلام کنند. این کار کاتالوگ هسته را بدون داده نگه می‌دارد.

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
- `docsLabel`: متن پیوند مستندات را بازنویسی می‌کند
- `preferOver`: شناسه‌های Plugin/کانال با اولویت پایین‌تر که این ورودی کاتالوگ باید از آن‌ها جلوتر باشد
- `selectionDocsPrefix`، `selectionDocsOmitLabel`، `selectionExtras`: کنترل‌های متن سطح انتخاب
- `markdownCapable`: کانال را برای تصمیم‌های قالب‌بندی خروجی به‌عنوان سازگار با Markdown علامت‌گذاری می‌کند
- `exposure.configured`: وقتی روی `false` تنظیم شود، کانال را از سطوح فهرست‌کردن کانال‌های پیکربندی‌شده پنهان می‌کند
- `exposure.setup`: وقتی روی `false` تنظیم شود، کانال را از انتخاب‌گرهای تعاملی راه‌اندازی/پیکربندی پنهان می‌کند
- `exposure.docs`: کانال را برای سطوح ناوبری مستندات، داخلی/خصوصی علامت‌گذاری می‌کند
- `showConfigured` / `showInSetup`: نام‌های مستعار قدیمی که هنوز برای سازگاری پذیرفته می‌شوند؛ `exposure` را ترجیح دهید
- `quickstartAllowFrom`: کانال را وارد جریان استاندارد شروع سریع `allowFrom` می‌کند
- `forceAccountBinding`: حتی وقتی فقط یک حساب وجود دارد، اتصال صریح حساب را الزامی می‌کند
- `preferSessionLookupForAnnounceTarget`: هنگام resolve کردن هدف‌های اعلان، lookup نشست را ترجیح می‌دهد

OpenClaw همچنین می‌تواند **کاتالوگ‌های خارجی کانال** را ادغام کند؛ برای مثال، یک خروجی رجیستری MPM. یک فایل JSON را در یکی از این مسیرها قرار دهید:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

یا `OPENCLAW_PLUGIN_CATALOG_PATHS` (یا `OPENCLAW_MPM_CATALOG_PATHS`) را به یک یا چند فایل JSON اشاره دهید (جداشده با ویرگول/نقطه‌ویرگول/`PATH`). هر فایل باید شامل `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` باشد. پارسر همچنین `"packages"` یا `"plugins"` را به‌عنوان نام‌های مستعار قدیمی برای کلید `"entries"` می‌پذیرد.

ورودی‌های تولیدشدهٔ کاتالوگ کانال و ورودی‌های کاتالوگ نصب ارائه‌دهنده، اطلاعات نرمال‌شدهٔ منبع نصب را کنار بلوک خام `openclaw.install` در معرض قرار می‌دهند. این اطلاعات نرمال‌شده مشخص می‌کنند که آیا مشخصهٔ npm یک نسخهٔ دقیق است یا یک انتخابگر شناور، آیا فرادادهٔ تمامیت مورد انتظار وجود دارد، و آیا مسیر منبع محلی نیز در دسترس است. وقتی هویت کاتالوگ/بسته معلوم باشد، اطلاعات نرمال‌شده هشدار می‌دهند اگر نام بستهٔ npm پارس‌شده از آن هویت فاصله بگیرد. همچنین وقتی `defaultChoice` نامعتبر باشد یا به منبعی اشاره کند که در دسترس نیست، و وقتی فرادادهٔ تمامیت npm بدون منبع معتبر npm وجود داشته باشد، هشدار می‌دهند. مصرف‌کنندگان باید `installSource` را به‌عنوان یک فیلد اختیاری افزایشی در نظر بگیرند تا ورودی‌های دستی و شیم‌های کاتالوگ مجبور نباشند آن را بسازند. این به فرایند ورود و عیب‌یابی اجازه می‌دهد وضعیت صفحهٔ منبع را بدون واردسازی runtime مربوط به Plugin توضیح دهند.

ورودی‌های رسمی خارجی npm باید یک `npmSpec` دقیق به‌همراه `expectedIntegrity` را ترجیح دهند. نام‌های صرف بسته و dist-tagها هنوز برای سازگاری کار می‌کنند، اما هشدارهای صفحهٔ منبع را نمایش می‌دهند تا کاتالوگ بتواند بدون شکستن Pluginهای موجود به‌سمت نصب‌های پین‌شده و بررسی‌شده از نظر تمامیت حرکت کند. وقتی فرایند ورود از یک مسیر کاتالوگ محلی نصب می‌کند، یک ورودی فهرست Plugin مدیریت‌شده با `source: "path"` و در صورت امکان یک `sourcePath` نسبی به فضای کاری ثبت می‌کند. مسیر مطلق بارگذاری عملیاتی در `plugins.load.paths` باقی می‌ماند؛ رکورد نصب از تکرار مسیرهای workstation محلی در پیکربندی بلندمدت جلوگیری می‌کند. این کار نصب‌های توسعهٔ محلی را برای عیب‌یابی صفحهٔ منبع قابل مشاهده نگه می‌دارد، بدون اینکه سطح دوم افشای مسیر خام سیستم فایل اضافه کند. فهرست Plugin پایدارشدهٔ `plugins/installs.json` منبع حقیقت نصب است و می‌تواند بدون بارگذاری ماژول‌های runtime مربوط به Plugin تازه‌سازی شود. map مربوط به `installRecords` آن حتی وقتی manifest یک Plugin وجود ندارد یا نامعتبر است بادوام می‌ماند؛ آرایهٔ `plugins` آن یک نمای manifest قابل بازسازی است.

## Pluginهای موتور زمینه

Pluginهای موتور زمینه، هماهنگ‌سازی زمینهٔ نشست را برای دریافت، سرهم‌بندی و Compaction بر عهده دارند. آن‌ها را از Plugin خود با `api.registerContextEngine(id, factory)` ثبت کنید، سپس موتور فعال را با `plugins.slots.contextEngine` انتخاب کنید.

از این استفاده کنید وقتی Plugin شما باید خط لولهٔ پیش‌فرض زمینه را جایگزین یا گسترش دهد، نه اینکه فقط جست‌وجوی حافظه یا hook اضافه کند.

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

factory مربوط به `ctx` مقدارهای اختیاری `config`، `agentDir` و `workspaceDir` را برای مقداردهی اولیه در زمان ساخت در معرض قرار می‌دهد.

اگر موتور شما مالک الگوریتم Compaction **نیست**، `compact()` را پیاده‌سازی‌شده نگه دارید و آن را صریحاً واگذار کنید:

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

وقتی یک Plugin به رفتاری نیاز دارد که با API فعلی جور درنمی‌آید، با دسترسی خصوصی به داخل، سیستم Plugin را دور نزنید. قابلیتِ جاافتاده را اضافه کنید.

توالی پیشنهادی:

1. قرارداد هسته را تعریف کنید
   تصمیم بگیرید هسته باید مالک کدام رفتار مشترک باشد: سیاست، مسیر جایگزین، ادغام پیکربندی، چرخهٔ حیات، معناشناسی روبه‌کانال، و شکل کمک‌کنندهٔ runtime.
2. سطوح تایپ‌شدهٔ ثبت/زمان اجرای Plugin را اضافه کنید
   `OpenClawPluginApi` و/یا `api.runtime` را با کوچک‌ترین سطح قابلیت تایپ‌شدهٔ مفید گسترش دهید.
3. هسته + مصرف‌کنندگان کانال/ویژگی را متصل کنید
   کانال‌ها و Pluginهای ویژگی باید قابلیت جدید را از طریق هسته مصرف کنند، نه با واردسازی مستقیم یک پیاده‌سازی فروشنده.
4. پیاده‌سازی‌های فروشنده را ثبت کنید
   سپس Pluginهای فروشنده backendهای خود را در برابر قابلیت ثبت می‌کنند.
5. پوشش قرارداد را اضافه کنید
   آزمون‌هایی اضافه کنید تا مالکیت و شکل ثبت در طول زمان صریح بماند.

این روشی است که OpenClaw با رویکرد مشخص باقی می‌ماند، بدون اینکه به جهان‌بینی یک ارائه‌دهنده سخت‌کد شود. برای یک چک‌لیست فایل مشخص و نمونهٔ حل‌شده، [راهنمای عملی قابلیت](/fa/plugins/architecture) را ببینید.

### چک‌لیست قابلیت

وقتی یک قابلیت جدید اضافه می‌کنید، پیاده‌سازی معمولاً باید این سطوح را با هم لمس کند:

- نوع‌های قرارداد هسته در `src/<capability>/types.ts`
- اجراکننده/کمک‌کنندهٔ زمان اجرای هسته در `src/<capability>/runtime.ts`
- سطح ثبت API مربوط به Plugin در `src/plugins/types.ts`
- اتصال رجیستری Plugin در `src/plugins/registry.ts`
- در معرض‌گذاری runtime مربوط به Plugin در `src/plugins/runtime/*` وقتی Pluginهای ویژگی/کانال باید آن را مصرف کنند
- کمک‌کننده‌های ضبط/آزمون در `src/test-utils/plugin-registration.ts`
- بررسی‌های مالکیت/قرارداد در `src/plugins/contracts/registry.ts`
- مستندات اپراتور/Plugin در `docs/`

اگر یکی از این سطوح وجود ندارد، معمولاً نشانه‌ای است که قابلیت هنوز کاملاً یکپارچه نشده است.

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

الگوی آزمون قرارداد:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

این قانون را ساده نگه می‌دارد:

- هسته مالک قرارداد قابلیت + هماهنگ‌سازی است
- Pluginهای فروشنده مالک پیاده‌سازی‌های فروشنده هستند
- Pluginهای ویژگی/کانال کمک‌کننده‌های runtime را مصرف می‌کنند
- آزمون‌های قرارداد مالکیت را صریح نگه می‌دارند

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) — مدل و شکل‌های عمومی قابلیت
- [زیرمسیرهای Plugin SDK](/fa/plugins/sdk-subpaths)
- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
