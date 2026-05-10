---
read_when:
    - پیاده‌سازی قلاب‌های زمان اجرای ارائه‌دهنده، چرخهٔ حیات کانال، یا پک‌های بسته
    - اشکال‌زدایی ترتیب بارگذاری Plugin یا وضعیت رجیستری
    - افزودن یک قابلیت Plugin جدید یا یک Plugin موتور زمینه
summary: 'جزئیات داخلی معماری Plugin: خط لولهٔ بارگذاری، رجیستری، هوک‌های زمان اجرا، مسیرهای HTTP، و جدول‌های مرجع'
title: جزئیات داخلی معماری Plugin
x-i18n:
    generated_at: "2026-05-10T19:51:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

برای مدل قابلیت عمومی، شکل‌های Plugin، و قراردادهای مالکیت/اجرا،
[معماری Plugin](/fa/plugins/architecture) را ببینید. این صفحه مرجع
سازوکارهای داخلی است: خط لوله بارگذاری، رجیستری، هوک‌های زمان اجرا،
مسیرهای HTTP مربوط به Gateway، مسیرهای import، و جدول‌های schema.

## خط لوله بارگذاری

هنگام راه‌اندازی، OpenClaw به‌طور کلی این کارها را انجام می‌دهد:

1. ریشه‌های نامزد Plugin را کشف می‌کند
2. manifestهای bundle بومی یا سازگار و فراداده package را می‌خواند
3. نامزدهای ناامن را رد می‌کند
4. پیکربندی Plugin را نرمال‌سازی می‌کند (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. فعال‌سازی هر نامزد را تعیین می‌کند
6. ماژول‌های بومی فعال‌شده را بارگذاری می‌کند: ماژول‌های bundled ساخته‌شده از loader بومی استفاده می‌کنند؛
   source محلی TypeScript مربوط به third-party از fallback اضطراری Jiti استفاده می‌کند
7. هوک‌های بومی `register(api)` را فراخوانی می‌کند و ثبت‌ها را در رجیستری Plugin جمع‌آوری می‌کند
8. رجیستری را در اختیار commandها و سطح‌های زمان اجرا قرار می‌دهد

<Note>
`activate` یک alias قدیمی برای `register` است — loader هرکدام را که موجود باشد resolve می‌کند (`def.register ?? def.activate`) و آن را در همان نقطه فراخوانی می‌کند. همه Pluginهای bundled از `register` استفاده می‌کنند؛ برای Pluginهای جدید `register` را ترجیح دهید.
</Note>

دروازه‌های ایمنی **پیش از** اجرای زمان اجرا اعمال می‌شوند. نامزدها زمانی مسدود
می‌شوند که entry از ریشه Plugin خارج شود، مسیر world-writable باشد، یا مالکیت
مسیر برای Pluginهای non-bundled مشکوک به نظر برسد.

نامزدهای مسدودشده برای diagnostics همچنان به id مربوط به Plugin خود متصل می‌مانند. اگر config
هنوز به آن id اشاره کند، validation آن Plugin را حاضر اما مسدود گزارش می‌کند
و به‌جای اینکه entry پیکربندی را stale در نظر بگیرد، به هشدار path-safety برمی‌گردد.

### رفتار manifest-first

manifest منبع حقیقت control-plane است. OpenClaw از آن برای این موارد استفاده می‌کند:

- شناسایی Plugin
- کشف channelها/skills/config schema اعلام‌شده یا قابلیت‌های bundle
- اعتبارسنجی `plugins.entries.<id>.config`
- تکمیل labelها/placeholderهای Control UI
- نمایش فراداده نصب/catalog
- حفظ descriptorهای ارزان activation و setup بدون بارگذاری runtime Plugin

برای Pluginهای بومی، ماژول runtime بخش data-plane است. این ماژول رفتار واقعی
مانند hookها، toolها، commandها، یا جریان‌های provider را ثبت می‌کند.

بلوک‌های اختیاری `activation` و `setup` در manifest روی control plane می‌مانند.
آن‌ها descriptorهای فقط فراداده برای برنامه‌ریزی activation و کشف setup هستند؛
جایگزین runtime registration، `register(...)`، یا `setupEntry` نمی‌شوند.
نخستین مصرف‌کنندگان activation زنده اکنون از hintهای command، channel، و provider در manifest
برای محدود کردن بارگذاری Plugin پیش از materialization گسترده‌تر رجیستری استفاده می‌کنند:

- بارگذاری CLI به Pluginهایی محدود می‌شود که مالک command اصلی درخواست‌شده هستند
- setup/resolution مربوط به channel Plugin به Pluginهایی محدود می‌شود که مالک
  channel id درخواست‌شده هستند
- setup/runtime resolution صریح provider به Pluginهایی محدود می‌شود که مالک
  provider id درخواست‌شده هستند
- برنامه‌ریزی راه‌اندازی Gateway از `activation.onStartup` برای importهای صریح راه‌اندازی
  و opt-outهای راه‌اندازی استفاده می‌کند؛ Pluginهای بدون فراداده راه‌اندازی فقط
  از طریق triggerهای activation محدودتر بارگذاری می‌شوند

preloadهای runtime در زمان درخواست که scope گسترده `all` را می‌خواهند همچنان
یک مجموعه صریح از idهای مؤثر Plugin را از config، برنامه‌ریزی راه‌اندازی، channelهای
پیکربندی‌شده، slotها، و قاعده‌های auto-enable استخراج می‌کنند. اگر آن مجموعه استخراج‌شده خالی باشد، OpenClaw
به‌جای گسترش به هر Plugin قابل‌کشف، یک رجیستری runtime خالی بارگذاری می‌کند.

activation planner هم یک API فقط شامل idها برای فراخوان‌های موجود و هم یک
plan API برای diagnostics جدید ارائه می‌دهد. entryهای plan گزارش می‌کنند چرا یک Plugin انتخاب شده است،
و hintهای صریح planner در `activation.*` را از fallback مالکیت manifest
مانند `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, و hookها جدا می‌کنند. این تفکیک reason مرز compatibility است:
فراداده Plugin موجود همچنان کار می‌کند، در حالی که کد جدید می‌تواند hintهای گسترده
یا رفتار fallback را بدون تغییر semantics بارگذاری runtime تشخیص دهد.

کشف setup اکنون idهای مالک descriptor مانند `setup.providers` و
`setup.cliBackends` را ترجیح می‌دهد تا پیش از fallback به
`setup-api` برای Pluginهایی که هنوز به hookهای runtime در زمان setup نیاز دارند، Pluginهای نامزد را محدود کند. فهرست‌های
setup provider از `providerAuthChoices` در manifest، گزینه‌های setup استخراج‌شده از descriptor،
و فراداده install-catalog بدون بارگذاری runtime provider استفاده می‌کنند. `setup.requiresRuntime: false`
صریح یک cutoff فقط descriptor است؛ حذف `requiresRuntime` برای compatibility
fallback قدیمی setup-api را حفظ می‌کند. اگر بیش از یک Plugin کشف‌شده همان setup provider یا CLI
backend id نرمال‌شده را claim کند، setup lookup به‌جای تکیه بر
ترتیب discovery، مالک مبهم را رد می‌کند. وقتی setup runtime اجرا می‌شود، registry diagnostics
drift بین `setup.providers` / `setup.cliBackends` و providerها یا CLI
backendهای ثبت‌شده توسط setup-api را بدون مسدود کردن Pluginهای قدیمی گزارش می‌کند.

### مرز cache مربوط به Plugin

OpenClaw نتیجه‌های کشف Plugin یا داده مستقیم رجیستری manifest را پشت پنجره‌های
wall-clock cache نمی‌کند. نصب‌ها، ویرایش‌های manifest، و تغییرات load-path باید
در metadata read صریح بعدی یا snapshot rebuild بعدی قابل مشاهده شوند.
parser فایل manifest ممکن است یک cache محدود file-signature نگه دارد که با
مسیر manifest بازشده، inode، size، و timestampها key شده است؛ آن cache فقط از
re-parse کردن byteهای بدون تغییر جلوگیری می‌کند و نباید پاسخ‌های discovery، registry، owner، یا
policy را cache کند.

مسیر سریع metadata ایمن، مالکیت صریح object است، نه cache پنهان.
hot pathهای راه‌اندازی Gateway باید `PluginMetadataSnapshot` فعلی،
`PluginLookUpTable` استخراج‌شده، یا یک رجیستری manifest صریح را در call
chain عبور دهند. config validation، startup auto-enable، plugin bootstrap، و provider
selection می‌توانند تا زمانی که آن objectها نماینده config فعلی و inventory
Plugin هستند از آن‌ها دوباره استفاده کنند. setup lookup همچنان metadata manifest را on demand
بازسازی می‌کند مگر اینکه مسیر setup مشخص یک رجیستری manifest صریح دریافت کند؛ آن را
به‌عنوان fallback مسیر سرد نگه دارید، نه اینکه cacheهای lookup پنهان اضافه کنید. وقتی input
تغییر می‌کند، به‌جای mutate کردن snapshot یا نگه داشتن نسخه‌های تاریخی،
snapshot را rebuild و replace کنید.
viewهای روی active plugin registry و helperهای bundled channel bootstrap
باید از registry/root فعلی دوباره محاسبه شوند. mapهای کوتاه‌عمر داخل یک call برای dedupe کردن کار
یا guard کردن reentry مشکلی ندارند؛ اما نباید به cacheهای metadata process تبدیل شوند.

برای بارگذاری Plugin، لایه cache پایدار runtime loading است. این لایه ممکن است
وقتی code یا artifactهای نصب‌شده واقعاً بارگذاری می‌شوند، state loader را دوباره استفاده کند، مانند:

- `PluginLoaderCacheState` و رجیستری‌های runtime فعال سازگار
- cacheهای jiti/module و cacheهای loader مربوط به public-surface که برای جلوگیری از import
  مکرر همان سطح runtime استفاده می‌شوند
- cacheهای filesystem برای artifactهای Plugin نصب‌شده
- mapهای کوتاه‌عمر per-call برای path normalization یا duplicate resolution

این cacheها جزئیات پیاده‌سازی data-plane هستند. آن‌ها نباید به پرسش‌های
control-plane مانند «کدام Plugin مالک این provider است؟» پاسخ دهند مگر اینکه
caller عمداً runtime loading را درخواست کرده باشد.

cacheهای پایدار یا wall-clock برای موارد زیر اضافه نکنید:

- نتیجه‌های discovery
- رجیستری‌های مستقیم manifest
- رجیستری‌های manifest بازسازی‌شده از installed plugin index
- lookup مالک provider، model suppression، provider policy، یا فراداده public-artifact
- هر پاسخ manifest-derived دیگری که در آن manifest تغییرکرده، installed index،
  یا load path باید در metadata read بعدی قابل مشاهده باشد

callerهایی که metadata manifest را از installed plugin index پایدار بازسازی می‌کنند،
آن رجیستری را on demand بازسازی می‌کنند. installed index وضعیت پایدار source-plane است؛
یک cache metadata پنهان in-process نیست.

## مدل رجیستری

Pluginهای بارگذاری‌شده مستقیماً globalهای تصادفی core را mutate نمی‌کنند. آن‌ها در یک
رجیستری مرکزی Plugin ثبت می‌شوند.

رجیستری موارد زیر را track می‌کند:

- recordهای Plugin (identity، source، origin، status، diagnostics)
- toolها
- hookهای قدیمی و hookهای typed
- channelها
- providerها
- handlerهای Gateway RPC
- routeهای HTTP
- registrarهای CLI
- سرویس‌های پس‌زمینه
- commandهای متعلق به Plugin

سپس featureهای core به‌جای صحبت مستقیم با ماژول‌های Plugin، از آن رجیستری می‌خوانند.
این کار بارگذاری را یک‌طرفه نگه می‌دارد:

- ماژول Plugin -> registry registration
- runtime core -> registry consumption

این جداسازی برای maintainability مهم است. یعنی بیشتر سطح‌های core فقط
به یک نقطه integration نیاز دارند: «خواندن رجیستری»، نه «special-case کردن هر ماژول
Plugin».

## callbackهای conversation binding

Pluginهایی که یک conversation را bind می‌کنند می‌توانند هنگام resolve شدن یک approval واکنش نشان دهند.

برای دریافت callback پس از approve یا deny شدن یک bind request از `api.onConversationBindingResolved(...)` استفاده کنید:

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
- `binding`: binding resolve‌شده برای requestهای approved
- `request`: summary مربوط به request اصلی، detach hint، sender id، و
  metadata مربوط به conversation

این callback فقط notification است. اجازه bind کردن conversation را تغییر نمی‌دهد
و پس از پایان handling approval در core اجرا می‌شود.

## hookهای runtime مربوط به provider

Pluginهای provider سه لایه دارند:

- **metadata در manifest** برای lookup ارزان پیش از runtime:
  `setup.providers[].envVars`، compatibility قدیمی `providerAuthEnvVars`،
  `providerAuthAliases`، `providerAuthChoices`، و `channelEnvVars`.
- **hookهای زمان config**: `catalog` (قدیمی `discovery`) به‌همراه
  `applyConfigDefaults`.
- **hookهای runtime**: بیش از 40 hook اختیاری که auth، model resolution،
  stream wrapping، thinking levelها، replay policy، و endpointهای usage را پوشش می‌دهند. فهرست کامل را در
  [ترتیب و کاربرد hookها](#hook-order-and-usage) ببینید.

OpenClaw همچنان مالک agent loop عمومی، failover، handling transcript، و
tool policy است. این hookها سطح extension برای رفتار provider-specific هستند
بدون اینکه به یک transport inference کاملاً سفارشی نیاز باشد.

وقتی provider credentialهای مبتنی بر env دارد که مسیرهای generic auth/status/model-picker باید بدون
بارگذاری runtime Plugin ببینند، از `setup.providers[].envVars` در manifest استفاده کنید. `providerAuthEnvVars`
منسوخ‌شده همچنان طی پنجره deprecation توسط compatibility adapter خوانده می‌شود، و Pluginهای non-bundled
که از آن استفاده کنند یک diagnostic در manifest دریافت می‌کنند. وقتی یک provider id باید env varهای provider id دیگر، auth profileها،
auth مبتنی بر config، و گزینه onboarding مربوط به API-key را دوباره استفاده کند، از `providerAuthAliases` در manifest
استفاده کنید. وقتی سطح‌های onboarding/auth-choice مربوط به CLI باید choice id، group labelها، و wiring ساده یک‌flag auth مربوط به provider را بدون
بارگذاری runtime provider بدانند، از `providerAuthChoices` در manifest استفاده کنید. `envVars` مربوط به runtime
provider را برای hintهای operator-facing مانند onboarding labelها یا متغیرهای setup مربوط به OAuth
client-id/client-secret نگه دارید.

وقتی یک channel دارای auth یا setup مبتنی بر env است که generic shell-env fallback، بررسی‌های config/status، یا promptهای setup باید بدون
بارگذاری runtime channel ببینند، از `channelEnvVars` در manifest استفاده کنید.

### ترتیب و کاربرد hookها

برای Pluginهای model/provider، OpenClaw hookها را تقریباً به این ترتیب فراخوانی می‌کند.
ستون «زمان استفاده» راهنمای تصمیم سریع است.
فیلدهای provider که فقط برای compatibility هستند و OpenClaw دیگر آن‌ها را فراخوانی نمی‌کند، مانند
`ProviderPlugin.capabilities` و `suppressBuiltInModel`، عمداً اینجا فهرست نشده‌اند.

| #   | Hook                              | کاری که انجام می‌دهد                                                                                                   | زمان استفاده                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | پیکربندی ارائه‌دهنده را هنگام تولید `models.json` در `models.providers` منتشر می‌کند                                | ارائه‌دهنده مالک کاتالوگ یا پیش‌فرض‌های URL پایه است                                                                                                  |
| 2   | `applyConfigDefaults`             | پیش‌فرض‌های پیکربندی سراسریِ متعلق به ارائه‌دهنده را هنگام مادی‌سازی پیکربندی اعمال می‌کند                                      | پیش‌فرض‌ها به حالت احراز هویت، env، یا معناشناسی خانوادهٔ مدلِ ارائه‌دهنده وابسته‌اند                                                                         |
| --  | _(built-in model lookup)_         | OpenClaw ابتدا مسیر عادی رجیستری/کاتالوگ را امتحان می‌کند                                                          | _(هوک Plugin نیست)_                                                                                                                         |
| 3   | `normalizeModelId`                | نام‌های مستعار قدیمی یا preview شناسهٔ مدل را پیش از lookup نرمال‌سازی می‌کند                                                     | ارائه‌دهنده مالک پاک‌سازی alias پیش از تفکیک مدل canonical است                                                                                 |
| 4   | `normalizeTransport`              | `api` / `baseUrl` خانوادهٔ ارائه‌دهنده را پیش از مونتاژ عمومی مدل نرمال‌سازی می‌کند                                      | ارائه‌دهنده مالک پاک‌سازی ترابرد برای شناسه‌های سفارشی ارائه‌دهنده در همان خانوادهٔ ترابرد است                                                          |
| 5   | `normalizeConfig`                 | `models.providers.<id>` را پیش از تفکیک runtime/ارائه‌دهنده نرمال‌سازی می‌کند                                           | ارائه‌دهنده به پاک‌سازی پیکربندی نیاز دارد که باید همراه Plugin باشد؛ کمک‌کننده‌های bundled خانوادهٔ Google نیز ورودی‌های پیکربندی پشتیبانی‌شدهٔ Google را پشتیبان‌گیری می‌کنند   |
| 6   | `applyNativeStreamingUsageCompat` | بازنویسی‌های سازگاری native streaming-usage را روی ارائه‌دهنده‌های پیکربندی اعمال می‌کند                                               | ارائه‌دهنده به اصلاحات metadata استفاده از native streaming مبتنی بر endpoint نیاز دارد                                                                          |
| 7   | `resolveConfigApiKey`             | احراز هویت env-marker را برای ارائه‌دهنده‌های پیکربندی پیش از بارگذاری احراز هویت runtime تفکیک می‌کند                                       | ارائه‌دهنده تفکیک کلید API به روش env-marker متعلق به خود دارد؛ `amazon-bedrock` نیز در اینجا یک تفکیک‌کنندهٔ داخلی env-marker برای AWS دارد                  |
| 8   | `resolveSyntheticAuth`            | احراز هویت local/self-hosted یا پشتیبانی‌شده با پیکربندی را بدون پایدارسازی plaintext نمایان می‌کند                                   | ارائه‌دهنده می‌تواند با یک نشانگر اعتبارنامهٔ synthetic/local کار کند                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | پروفایل‌های احراز هویت خارجیِ متعلق به ارائه‌دهنده را overlay می‌کند؛ مقدار پیش‌فرض `persistence` برای اعتبارنامه‌های متعلق به CLI/برنامه، `runtime-only` است | ارائه‌دهنده از اعتبارنامه‌های احراز هویت خارجی بدون پایدارسازی refresh tokenهای کپی‌شده دوباره استفاده می‌کند؛ `contracts.externalAuthProviders` را در manifest اعلام کنید |
| 10  | `shouldDeferSyntheticProfileAuth` | placeholderهای پروفایل synthetic ذخیره‌شده را پشت احراز هویت مبتنی بر env/config پایین‌تر می‌برد                                      | ارائه‌دهنده پروفایل‌های placeholder synthetic ذخیره می‌کند که نباید تقدم پیدا کنند                                                                 |
| 11  | `resolveDynamicModel`             | fallback همگام برای شناسه‌های مدلِ متعلق به ارائه‌دهنده که هنوز در رجیستری local نیستند                                       | ارائه‌دهنده شناسه‌های دلخواه مدل upstream را می‌پذیرد                                                                                                 |
| 12  | `prepareDynamicModel`             | گرم‌سازی async، سپس `resolveDynamicModel` دوباره اجرا می‌شود                                                           | ارائه‌دهنده پیش از تفکیک شناسه‌های ناشناخته به metadata شبکه نیاز دارد                                                                                  |
| 13  | `normalizeResolvedModel`          | بازنویسی نهایی پیش از آنکه اجراکنندهٔ تعبیه‌شده از مدل تفکیک‌شده استفاده کند                                               | ارائه‌دهنده به بازنویسی‌های ترابرد نیاز دارد اما همچنان از یک ترابرد core استفاده می‌کند                                                                             |
| 14  | `contributeResolvedModelCompat`   | برای مدل‌های vendor پشت یک ترابرد سازگار دیگر، پرچم‌های compat مشارکت می‌دهد                                  | ارائه‌دهنده مدل‌های خودش را روی ترابردهای proxy بدون در اختیار گرفتن ارائه‌دهنده تشخیص می‌دهد                                                       |
| 15  | `normalizeToolSchemas`            | schemaهای ابزار را پیش از دیده‌شدن توسط اجراکنندهٔ تعبیه‌شده نرمال‌سازی می‌کند                                                    | ارائه‌دهنده به پاک‌سازی schema خانوادهٔ ترابرد نیاز دارد                                                                                                |
| 16  | `inspectToolSchemas`              | diagnostics schema متعلق به ارائه‌دهنده را پس از نرمال‌سازی نمایان می‌کند                                                  | ارائه‌دهنده بدون آموزش قوانین اختصاصی ارائه‌دهنده به core، هشدارهای keyword می‌خواهد                                                                 |
| 17  | `resolveReasoningOutputMode`      | قرارداد reasoning-output به‌صورت native در برابر tagged را انتخاب می‌کند                                                              | ارائه‌دهنده به reasoning/خروجی نهایی tagged به‌جای فیلدهای native نیاز دارد                                                                         |
| 18  | `prepareExtraParams`              | نرمال‌سازی پارامترهای درخواست پیش از wrapperهای عمومی گزینهٔ stream                                              | ارائه‌دهنده به پارامترهای پیش‌فرض درخواست یا پاک‌سازی پارامتر مختص ارائه‌دهنده نیاز دارد                                                                           |
| 19  | `createStreamFn`                  | مسیر عادی stream را کاملاً با یک ترابرد سفارشی جایگزین می‌کند                                                   | ارائه‌دهنده به یک پروتکل wire سفارشی نیاز دارد، نه فقط یک wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | wrapper جریان پس از اعمال wrapperهای عمومی                                                              | ارائه‌دهنده به wrapperهای سازگاری header/body/model درخواست بدون ترابرد سفارشی نیاز دارد                                                          |
| 21  | `resolveTransportTurnState`       | headerها یا metadata ترابرد native مخصوص هر turn را پیوست می‌کند                                                           | ارائه‌دهنده می‌خواهد ترابردهای عمومی هویت turn بومیِ ارائه‌دهنده را ارسال کنند                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | headerهای native WebSocket یا سیاست cool-down نشست را پیوست می‌کند                                                    | ارائه‌دهنده می‌خواهد ترابردهای عمومی WS، headerهای نشست یا سیاست fallback را تنظیم کنند                                                               |
| 23  | `formatApiKey`                    | formatter پروفایل احراز هویت: پروفایل ذخیره‌شده به رشتهٔ runtime `apiKey` تبدیل می‌شود                                     | ارائه‌دهنده metadata احراز هویت اضافی ذخیره می‌کند و به شکل توکن runtime سفارشی نیاز دارد                                                                    |
| 24  | `refreshOAuth`                    | override تازه‌سازی OAuth برای endpointهای تازه‌سازی سفارشی یا سیاست شکست تازه‌سازی                                  | ارائه‌دهنده با تازه‌سازهای مشترک `pi-ai` سازگار نیست                                                                                           |
| 25  | `buildAuthDoctorHint`             | راهنمای تعمیر که هنگام شکست تازه‌سازی OAuth افزوده می‌شود                                                                  | ارائه‌دهنده پس از شکست تازه‌سازی به راهنمای تعمیر احراز هویتِ متعلق به ارائه‌دهنده نیاز دارد                                                                      |
| 26  | `matchesContextOverflowError`     | matcher سرریز پنجرهٔ context متعلق به ارائه‌دهنده                                                                 | ارائه‌دهنده خطاهای خام overflow دارد که heuristicهای عمومی از دست می‌دهند                                                                                |
| 27  | `classifyFailoverReason`          | دسته‌بندی علت failover متعلق به ارائه‌دهنده                                                                  | ارائه‌دهنده می‌تواند خطاهای خام API/ترابرد را به محدودیت نرخ/بار بیش‌ازحد/غیره نگاشت کند                                                                          |
| 28  | `isCacheTtlEligible`              | سیاست کش پرامپت برای ارائه‌دهنده‌های proxy/backhaul                                                               | ارائه‌دهنده به gating مخصوص proxy برای TTL کش نیاز دارد                                                                                                |
| 29  | `buildMissingAuthMessage`         | جایگزین پیام عمومی بازیابی احراز هویتِ missing                                                      | ارائه‌دهنده به راهنمای بازیابی missing-auth مختص ارائه‌دهنده نیاز دارد                                                                                 |
| 30  | `augmentModelCatalog`             | ردیف‌های synthetic/final کاتالوگ که پس از discovery افزوده می‌شوند                                                          | ارائه‌دهنده در `models list` و انتخابگرها به ردیف‌های synthetic forward-compat نیاز دارد                                                                     |
| 31  | `resolveThinkingProfile`          | مجموعهٔ level مخصوص مدل برای `/think`، برچسب‌های نمایشی، و پیش‌فرض                                                 | ارائه‌دهنده یک نردبان thinking سفارشی یا برچسب دودویی برای مدل‌های منتخب ارائه می‌کند                                                                 |
| 32  | `isBinaryThinking`                | هوک سازگاری toggle روشن/خاموش reasoning                                                                     | ارائه‌دهنده فقط thinking دودویی روشن/خاموش ارائه می‌کند                                                                                                  |
| 33  | `supportsXHighThinking`           | هوک سازگاری پشتیبانی reasoning برای `xhigh`                                                                   | ارائه‌دهنده `xhigh` را فقط روی زیرمجموعه‌ای از مدل‌ها می‌خواهد                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | هوک سازگاری level پیش‌فرض `/think`                                                                      | ارائه‌دهنده مالک سیاست پیش‌فرض `/think` برای یک خانوادهٔ مدل است                                                                                      |
| 35  | `isModernModelRef`                | matcher مدل مدرن برای فیلترهای پروفایل live و انتخاب smoke                                              | ارائه‌دهنده مالک تطبیق مدل ترجیحی live/smoke است                                                                                             |
| 36  | `prepareRuntimeAuth`              | درست پیش از inference، یک اعتبارنامهٔ پیکربندی‌شده را به توکن/کلید واقعی runtime تبدیل می‌کند                       | ارائه‌دهنده به تبادل توکن یا اعتبارنامهٔ درخواست کوتاه‌عمر نیاز دارد                                                                             |
| 37  | `resolveUsageAuth`                | اعتبارنامه‌های مصرف/صورتحساب را برای `/usage` و سطوح وضعیت مرتبط رفع می‌کند                                     | ارائه‌دهنده به تجزیهٔ سفارشی توکن مصرف/سهمیه یا اعتبارنامهٔ مصرف متفاوت نیاز دارد                                                               |
| 38  | `fetchUsageSnapshot`              | پس از رفع احراز هویت، snapshotهای مصرف/سهمیهٔ خاص ارائه‌دهنده را دریافت و نرمال‌سازی می‌کند                             | ارائه‌دهنده به endpoint مصرف خاص ارائه‌دهنده یا تجزیه‌گر payload نیاز دارد                                                                           |
| 39  | `createEmbeddingProvider`         | یک آداپتور embedding متعلق به ارائه‌دهنده برای حافظه/جست‌وجو می‌سازد                                                     | رفتار embedding حافظه به Plugin ارائه‌دهنده تعلق دارد                                                                                    |
| 40  | `buildReplayPolicy`               | یک سیاست replay برمی‌گرداند که مدیریت transcript را برای ارائه‌دهنده کنترل می‌کند                                        | ارائه‌دهنده به سیاست transcript سفارشی نیاز دارد (برای مثال، حذف بلوک‌های thinking)                                                               |
| 41  | `sanitizeReplayHistory`           | پس از پاک‌سازی عمومی transcript، تاریخچهٔ replay را بازنویسی می‌کند                                                        | ارائه‌دهنده به بازنویسی‌های replay خاص ارائه‌دهنده، فراتر از helperهای مشترک compaction، نیاز دارد                                                             |
| 42  | `validateReplayTurns`             | اعتبارسنجی نهایی turnهای replay یا بازشکل‌دهی آن‌ها پیش از runner تعبیه‌شده                                           | انتقال ارائه‌دهنده پس از پاک‌سازی عمومی به اعتبارسنجی سخت‌گیرانه‌تر turn نیاز دارد                                                                    |
| 43  | `onModelSelected`                 | اثرات جانبی پس از انتخابِ متعلق به ارائه‌دهنده را اجرا می‌کند                                                                 | وقتی یک مدل فعال می‌شود، ارائه‌دهنده به telemetry یا وضعیت متعلق به ارائه‌دهنده نیاز دارد                                                                  |

`normalizeModelId`، `normalizeTransport`، و `normalizeConfig` ابتدا Plugin ارائه‌دهنده‌ی منطبق را بررسی می‌کنند، سپس به سراغ سایر Pluginهای ارائه‌دهنده‌ی دارای hook می‌روند تا زمانی که یکی واقعاً شناسه‌ی مدل یا transport/config را تغییر دهد. این کار باعث می‌شود shimهای ارائه‌دهنده‌ی alias/compat بدون نیاز به اینکه فراخواننده بداند کدام Plugin بسته‌بندی‌شده مالک بازنویسی است، کار کنند. اگر هیچ hook ارائه‌دهنده‌ای یک ورودی پیکربندی پشتیبانی‌شده از خانواده‌ی Google را بازنویسی نکند، نرمال‌ساز پیکربندی Google بسته‌بندی‌شده همچنان آن پاک‌سازی سازگاری را اعمال می‌کند.

اگر ارائه‌دهنده به یک پروتکل سیمی کاملاً سفارشی یا مجری درخواست سفارشی نیاز داشته باشد، این یک دسته‌ی متفاوت از افزونه است. این hookها برای رفتار ارائه‌دهنده‌ای هستند که همچنان روی حلقه‌ی معمول inference در OpenClaw اجرا می‌شود.

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

Pluginهای ارائه‌دهنده‌ی بسته‌بندی‌شده hookهای بالا را ترکیب می‌کنند تا با نیازهای catalog، auth، thinking، replay، و usage هر فروشنده سازگار شوند. مجموعه‌ی معتبر hookها همراه هر Plugin زیر `extensions/` قرار دارد؛ این صفحه به‌جای بازتاب کامل فهرست، شکل‌ها را نشان می‌دهد.

<AccordionGroup>
  <Accordion title="ارائه‌دهنده‌های catalog عبوری">
    OpenRouter، Kilocode، Z.AI، xAI افزون بر
    `resolveDynamicModel` / `prepareDynamicModel`، `catalog` را ثبت می‌کنند تا بتوانند شناسه‌های مدل بالادستی را پیش از catalog ایستای OpenClaw نمایش دهند.
  </Accordion>
  <Accordion title="ارائه‌دهنده‌های OAuth و endpoint مصرف">
    GitHub Copilot، Gemini CLI، ChatGPT Codex، MiniMax، Xiaomi، z.ai
    `prepareRuntimeAuth` یا `formatApiKey` را با `resolveUsageAuth` +
    `fetchUsageSnapshot` جفت می‌کنند تا مالکیت تبادل token و یکپارچه‌سازی `/usage` را داشته باشند.
  </Accordion>
  <Accordion title="خانواده‌های پاک‌سازی replay و transcript">
    خانواده‌های نام‌گذاری‌شده‌ی مشترک (`google-gemini`، `passthrough-gemini`،
    `anthropic-by-model`، `hybrid-anthropic-openai`) به ارائه‌دهنده‌ها اجازه می‌دهند به‌جای اینکه هر Plugin پاک‌سازی را دوباره پیاده‌سازی کند، از طریق `buildReplayPolicy` وارد سیاست transcript شوند.
  </Accordion>
  <Accordion title="ارائه‌دهنده‌های فقط catalog">
    `byteplus`، `cloudflare-ai-gateway`، `huggingface`، `kimi-coding`، `nvidia`،
    `qianfan`، `synthetic`، `together`، `venice`، `vercel-ai-gateway`، و
    `volcengine` فقط `catalog` را ثبت می‌کنند و از حلقه‌ی inference مشترک استفاده می‌کنند.
  </Accordion>
  <Accordion title="کمک‌کننده‌های stream مخصوص Anthropic">
    headerهای beta، `/fast` / `serviceTier`، و `context1m` داخل مرز عمومی
    `api.ts` / `contract-api.ts` در Plugin Anthropic قرار دارند
    (`wrapAnthropicProviderStream`، `resolveAnthropicBetas`،
    `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`) نه در
    SDK عمومی.
  </Accordion>
</AccordionGroup>

## کمک‌کننده‌های runtime

Pluginها می‌توانند از طریق `api.runtime` به کمک‌کننده‌های منتخب core دسترسی داشته باشند. برای TTS:

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

- `textToSpeech` payload خروجی معمول TTS core را برای سطح‌های file/voice-note برمی‌گرداند.
- از پیکربندی core با نام `messages.tts` و انتخاب ارائه‌دهنده استفاده می‌کند.
- بافر صوتی PCM + نرخ نمونه‌برداری را برمی‌گرداند. Pluginها باید برای ارائه‌دهنده‌ها resample/encode انجام دهند.
- `listVoices` برای هر ارائه‌دهنده اختیاری است. از آن برای voice pickerهای متعلق به فروشنده یا جریان‌های راه‌اندازی استفاده کنید.
- فهرست‌های صدا می‌توانند metadata غنی‌تری مانند locale، gender، و برچسب‌های personality برای pickerهای آگاه از ارائه‌دهنده داشته باشند.
- OpenAI و ElevenLabs امروز از telephony پشتیبانی می‌کنند. Microsoft پشتیبانی نمی‌کند.

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

- سیاست TTS، fallback، و تحویل پاسخ را در core نگه دارید.
- از ارائه‌دهنده‌های گفتار برای رفتار synthesis متعلق به فروشنده استفاده کنید.
- ورودی قدیمی Microsoft با نام `edge` به شناسه‌ی ارائه‌دهنده‌ی `microsoft` نرمال‌سازی می‌شود.
- مدل مالکیت ترجیحی شرکت‌محور است: یک Plugin فروشنده می‌تواند با اضافه شدن قراردادهای capability مربوطه در OpenClaw، مالک ارائه‌دهنده‌های متن، گفتار، تصویر، و رسانه‌های آینده باشد.

برای درک تصویر/صوت/ویدیو، Pluginها به‌جای یک کیسه‌ی عمومی key/value، یک ارائه‌دهنده‌ی media-understanding تایپ‌شده ثبت می‌کنند:

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

- orchestration، fallback، config، و سیم‌کشی channel را در core نگه دارید.
- رفتار فروشنده را در Plugin ارائه‌دهنده نگه دارید.
- گسترش افزایشی باید تایپ‌شده بماند: متدهای اختیاری جدید، فیلدهای نتیجه‌ی اختیاری جدید، capabilityهای اختیاری جدید.
- تولید ویدیو از همین الگو پیروی می‌کند:
  - core مالک قرارداد capability و کمک‌کننده‌ی runtime است
  - Pluginهای فروشنده `api.registerVideoGenerationProvider(...)` را ثبت می‌کنند
  - Pluginهای feature/channel از `api.runtime.videoGeneration.*` استفاده می‌کنند

برای کمک‌کننده‌های runtime مربوط به media-understanding، Pluginها می‌توانند فراخوانی کنند:

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

برای رونویسی صوت، Pluginها می‌توانند یا از runtime مربوط به media-understanding استفاده کنند یا از alias قدیمی‌تر STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

نکته‌ها:

- `api.runtime.mediaUnderstanding.*` سطح مشترک ترجیحی برای درک تصویر/صوت/ویدیو است.
- از پیکربندی صوتی media-understanding در core (`tools.media.audio`) و ترتیب fallback ارائه‌دهنده استفاده می‌کند.
- وقتی خروجی رونویسی تولید نشود، `{ text: undefined }` را برمی‌گرداند، برای مثال ورودی ردشده/پشتیبانی‌نشده.
- `api.runtime.stt.transcribeAudioFile(...)` به‌عنوان alias سازگاری باقی می‌ماند.

Pluginها همچنین می‌توانند اجراهای پس‌زمینه‌ی subagent را از طریق `api.runtime.subagent` آغاز کنند:

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
- OpenClaw آن فیلدهای override را فقط برای فراخواننده‌های مورد اعتماد رعایت می‌کند.
- برای اجراهای fallback متعلق به Plugin، operatorها باید با `plugins.entries.<id>.subagent.allowModelOverride: true` اعلام موافقت کنند.
- از `plugins.entries.<id>.subagent.allowedModels` برای محدود کردن Pluginهای مورد اعتماد به targetهای canonical مشخص `provider/model` استفاده کنید، یا از `"*"` برای اجازه‌ی صریح به هر target.
- اجراهای subagent مربوط به Pluginهای غیرقابل اعتماد همچنان کار می‌کنند، اما درخواست‌های override به‌جای fallback بی‌صدا رد می‌شوند.
- sessionهای subagent ساخته‌شده توسط Plugin با شناسه‌ی Plugin سازنده برچسب‌گذاری می‌شوند. fallback `api.runtime.subagent.deleteSession(...)` فقط می‌تواند همان sessionهای متعلق به خود را حذف کند؛ حذف arbitrary session همچنان به درخواست Gateway با محدوده‌ی admin نیاز دارد.

برای جست‌وجوی وب، Pluginها می‌توانند به‌جای دسترسی مستقیم به سیم‌کشی ابزار agent، از کمک‌کننده‌ی runtime مشترک استفاده کنند:

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

Pluginها همچنین می‌توانند ارائه‌دهنده‌های web-search را از طریق
`api.registerWebSearchProvider(...)` ثبت کنند.

نکته‌ها:

- انتخاب ارائه‌دهنده، credential resolution، و semantics مشترک درخواست را در core نگه دارید.
- از ارائه‌دهنده‌های web-search برای transportهای جست‌وجوی مخصوص فروشنده استفاده کنید.
- `api.runtime.webSearch.*` سطح مشترک ترجیحی برای Pluginهای feature/channel است که بدون وابستگی به wrapper ابزار agent به رفتار جست‌وجو نیاز دارند.

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

- `generate(...)`: تولید تصویر با استفاده از زنجیره‌ی پیکربندی‌شده‌ی ارائه‌دهنده‌ی image-generation.
- `listProviders(...)`: فهرست کردن ارائه‌دهنده‌های image-generation موجود و capabilityهای آن‌ها.

## مسیرهای HTTP Gateway

Pluginها می‌توانند endpointهای HTTP را با `api.registerHttpRoute(...)` ارائه کنند.

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

- `path`: مسیر route زیر سرور HTTP مربوط به gateway.
- `auth`: الزامی. از `"gateway"` برای الزام auth معمول gateway، یا از `"plugin"` برای auth/webhook verification مدیریت‌شده توسط Plugin استفاده کنید.
- `match`: اختیاری. `"exact"` (پیش‌فرض) یا `"prefix"`.
- `replaceExisting`: اختیاری. به همان Plugin اجازه می‌دهد ثبت route موجود خودش را جایگزین کند.
- `handler`: وقتی route درخواست را handled کرد، `true` برگردانید.

نکته‌ها:

- `api.registerHttpHandler(...)` حذف شده است و باعث خطای بارگذاری Plugin می‌شود. به‌جای آن از `api.registerHttpRoute(...)` استفاده کنید.
- مسیرهای Plugin باید `auth` را به‌صورت صریح اعلام کنند.
- تداخل‌های دقیق `path + match` رد می‌شوند، مگر اینکه `replaceExisting: true` باشد، و یک Plugin نمی‌تواند مسیر Plugin دیگری را جایگزین کند.
- مسیرهای هم‌پوشان با سطح‌های متفاوت `auth` رد می‌شوند. زنجیره‌های fallthrough مربوط به `exact`/`prefix` را فقط روی همان سطح auth نگه دارید.
- مسیرهای `auth: "plugin"` به‌طور خودکار scopeهای runtime اپراتور را دریافت نمی‌کنند. این مسیرها برای Webhookهای مدیریت‌شده توسط Plugin/اعتبارسنجی امضا هستند، نه فراخوانی‌های ممتاز کمکی Gateway.
- مسیرهای `auth: "gateway"` داخل scope runtime درخواست Gateway اجرا می‌شوند، اما این scope عمدا محافظه‌کارانه است:
  - auth bearer با shared-secret (`gateway.auth.mode = "token"` / `"password"`) scopeهای runtime مسیر Plugin را روی `operator.write` ثابت نگه می‌دارد، حتی اگر فراخواننده `x-openclaw-scopes` بفرستد
  - حالت‌های HTTP دارای هویت مورد اعتماد (برای مثال `trusted-proxy` یا `gateway.auth.mode = "none"` روی یک ingress خصوصی) فقط زمانی `x-openclaw-scopes` را رعایت می‌کنند که header به‌صورت صریح وجود داشته باشد
  - اگر `x-openclaw-scopes` در آن درخواست‌های مسیر Plugin دارای هویت وجود نداشته باشد، scope runtime به `operator.write` برمی‌گردد
- قاعده عملی: فرض نکنید مسیر Plugin با gateway-auth به‌طور ضمنی یک سطح admin است. اگر مسیر شما به رفتار فقط مخصوص admin نیاز دارد، یک حالت auth دارای هویت را الزامی کنید و قرارداد صریح header `x-openclaw-scopes` را مستند کنید.

## مسیرهای import مربوط به Plugin SDK

هنگام نوشتن Pluginهای جدید، به‌جای barrel ریشه یکپارچه `openclaw/plugin-sdk`
از subpathهای محدود SDK استفاده کنید. subpathهای اصلی:

| Subpath                             | هدف                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | primitiveهای ثبت Plugin                     |
| `openclaw/plugin-sdk/channel-core`  | helperهای ورود/ساخت Channel                        |
| `openclaw/plugin-sdk/core`          | helperهای مشترک عمومی و قرارداد umbrella       |
| `openclaw/plugin-sdk/config-schema` | schema ریشه `openclaw.json` در Zod (`OpenClawSchema`) |

Pluginهای Channel از خانواده‌ای از seamهای محدود انتخاب می‌کنند: `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` و `channel-actions`. رفتار approval باید روی یک قرارداد
`approvalCapability` متمرکز شود، نه اینکه بین fieldهای نامرتبط Plugin مخلوط شود.
[Pluginهای Channel](/fa/plugins/sdk-channel-plugins) را ببینید.

helperهای runtime و config زیر subpathهای متمرکز و متناظر `*-runtime` قرار دارند
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` و غیره). به‌جای barrel سازگاری گسترده
`config-runtime`، از `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` و `config-mutation`
استفاده کنید.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
و `openclaw/plugin-sdk/infra-runtime` shimهای سازگاری منسوخ‌شده برای
Pluginهای قدیمی‌تر هستند. کد جدید باید primitiveهای عمومی محدودتر را import کند.
</Info>

نقطه‌های ورود داخلی repo (در ریشه هر بسته Plugin همراه‌شده):

- `index.js` — ورودی Plugin همراه‌شده
- `api.js` — barrel مربوط به helper/typeها
- `runtime-api.js` — barrel فقط مخصوص runtime
- `setup-entry.js` — ورودی setup Plugin

Pluginهای خارجی فقط باید subpathهای `openclaw/plugin-sdk/*` را import کنند. هرگز
`src/*` بسته Plugin دیگری را از core یا از Plugin دیگر import نکنید.
نقطه‌های ورود بارگذاری‌شده با facade، وقتی snapshot پیکربندی runtime فعال وجود داشته باشد
آن را ترجیح می‌دهند، سپس به فایل config resolve‌شده روی دیسک برمی‌گردند.

subpathهای مختص capability مانند `image-generation`, `media-understanding`
و `speech` وجود دارند چون Pluginهای همراه‌شده امروز از آن‌ها استفاده می‌کنند. آن‌ها
به‌طور خودکار قراردادهای خارجی ثابت‌شده بلندمدت نیستند؛ وقتی به آن‌ها متکی می‌شوید،
صفحه مرجع SDK مربوط را بررسی کنید.

## schemaهای ابزار پیام

Pluginها باید contributionهای schema مخصوص Channel در `describeMessageTool(...)` را
برای primitiveهای غیرپیامی مانند واکنش‌ها، readها و pollها مالک شوند.
نمایش ارسال مشترک باید به‌جای fieldهای button، component، block یا card بومی provider
از قرارداد عمومی `MessagePresentation` استفاده کند.
برای قرارداد، قواعد fallback، mapping provider و checklist نویسنده Plugin،
[نمایش پیام](/fa/plugins/message-presentation) را ببینید.

Pluginهای دارای قابلیت ارسال، چیزی را که می‌توانند render کنند از طریق قابلیت‌های پیام اعلام می‌کنند:

- `presentation` برای blockهای ارائه معنایی (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` برای درخواست‌های pinned-delivery

Core تصمیم می‌گیرد presentation را به‌صورت بومی render کند یا آن را به متن کاهش دهد.
از ابزار پیام عمومی، راه‌های فرار UI بومی provider را expose نکنید.
helperهای منسوخ SDK برای schemaهای بومی قدیمی همچنان برای Pluginهای شخص ثالث موجود
export می‌شوند، اما Pluginهای جدید نباید از آن‌ها استفاده کنند.

## resolve کردن target در Channel

Pluginهای Channel باید semantics مربوط به target مختص Channel را مالک شوند. میزبان outbound
مشترک را عمومی نگه دارید و برای قواعد provider از سطح adapter پیام‌رسانی استفاده کنید:

- `messaging.inferTargetChatType({ to })` پیش از lookup در directory تصمیم می‌گیرد که یک target نرمال‌شده
  باید `direct`، `group` یا `channel` در نظر گرفته شود.
- `messaging.targetResolver.looksLikeId(raw, normalized)` به core می‌گوید آیا یک
  input باید به‌جای جست‌وجوی directory مستقیما به resolve شبیه id برود یا نه.
- `messaging.targetResolver.resolveTarget(...)` fallback مربوط به Plugin است، وقتی
  core پس از نرمال‌سازی یا پس از miss در directory به یک resolve نهایی متعلق به provider نیاز دارد.
- `messaging.resolveOutboundSessionRoute(...)` پس از resolve شدن target، ساخت route
  session مخصوص provider را مالک می‌شود.

تقسیم‌بندی پیشنهادی:

- از `inferTargetChatType` برای تصمیم‌های دسته‌بندی استفاده کنید که باید پیش از
  جست‌وجوی peerها/groupها انجام شوند.
- از `looksLikeId` برای بررسی‌های «این مورد را به‌عنوان یک target id صریح/بومی در نظر بگیر» استفاده کنید.
- از `resolveTarget` برای fallback نرمال‌سازی مخصوص provider استفاده کنید، نه برای
  جست‌وجوی گسترده directory.
- idهای بومی provider مانند chat idها، thread idها، JIDها، handleها و room
  idها را داخل مقدارهای `target` یا پارامترهای مخصوص provider نگه دارید، نه در fieldهای عمومی SDK.

## directoryهای مبتنی بر config

Pluginهایی که entryهای directory را از config استخراج می‌کنند باید آن منطق را در
Plugin نگه دارند و helperهای مشترک را از
`openclaw/plugin-sdk/directory-runtime` بازاستفاده کنند.

وقتی یک Channel به peer/groupهای مبتنی بر config نیاز دارد، از این استفاده کنید، مانند:

- peerهای DM مبتنی بر allowlist
- mapهای channel/group پیکربندی‌شده
- fallbackهای directory ایستای محدود به account

helperهای مشترک در `directory-runtime` فقط عملیات عمومی را مدیریت می‌کنند:

- filter کردن query
- اعمال limit
- helperهای dedupe/normalization
- ساخت `ChannelDirectoryEntry[]`

بازرسی account و نرمال‌سازی id مخصوص Channel باید در پیاده‌سازی
Plugin باقی بماند.

## catalogهای provider

Pluginهای provider می‌توانند برای inference، catalogهای مدل را با
`registerProvider({ catalog: { run(...) { ... } } })` تعریف کنند.

`catalog.run(...)` همان شکلی را برمی‌گرداند که OpenClaw در
`models.providers` می‌نویسد:

- `{ provider }` برای یک entry provider
- `{ providers }` برای چند entry provider

وقتی Plugin مالک model idهای مخصوص provider، مقدارهای پیش‌فرض base URL
یا metadata مدل وابسته به auth است، از `catalog` استفاده کنید.

`catalog.order` کنترل می‌کند catalog یک Plugin چه زمانی نسبت به providerهای ضمنی built-in
OpenClaw merge شود:

- `simple`: providerهای ساده مبتنی بر API-key یا env
- `profile`: providerهایی که وقتی auth profileها وجود دارند ظاهر می‌شوند
- `paired`: providerهایی که چند entry provider مرتبط را synthesize می‌کنند
- `late`: گذر آخر، پس از providerهای ضمنی دیگر

در collision کلید، providerهای بعدی برنده می‌شوند، بنابراین Pluginها می‌توانند عمدا یک
entry provider built-in را با همان provider id override کنند.

Pluginها همچنین می‌توانند rowهای مدل فقط‌خواندنی را از طریق
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})` منتشر کنند. این مسیر آینده برای سطح‌های list/help/picker است و rowهای
`text`, `image_generation`, `video_generation` و `music_generation` را پشتیبانی می‌کند.
Pluginهای provider همچنان مالک فراخوانی‌های endpoint زنده، token exchange و mapping
پاسخ vendor هستند؛ core مالک شکل مشترک row، labelهای source و قالب‌بندی help ابزار media
است. ثبت‌های provider تولید media، rowهای catalog ایستا را به‌طور خودکار از
`defaultModel`, `models` و `capabilities` synthesize می‌کنند.

سازگاری:

- `discovery` همچنان به‌عنوان alias قدیمی کار می‌کند، اما هشدار منسوخ‌بودن emit می‌کند
- اگر هم `catalog` و هم `discovery` ثبت شده باشند، OpenClaw از `catalog` استفاده می‌کند
- `augmentModelCatalog` منسوخ شده است؛ providerهای همراه‌شده باید rowهای تکمیلی را
  از طریق `registerModelCatalogProvider` منتشر کنند

## بازرسی فقط‌خواندنی Channel

اگر Plugin شما یک Channel ثبت می‌کند، بهتر است
`plugin.config.inspectAccount(cfg, accountId)` را در کنار `resolveAccount(...)` پیاده‌سازی کنید.

دلیل:

- `resolveAccount(...)` مسیر runtime است. مجاز است فرض کند credentialها
  کاملا materialized شده‌اند و وقتی secretهای لازم missing باشند سریع fail کند.
- مسیرهای command فقط‌خواندنی مانند `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` و جریان‌های repair مربوط به doctor/config
  نباید فقط برای توصیف پیکربندی نیاز داشته باشند credentialهای runtime را materialize کنند.

رفتار پیشنهادی `inspectAccount(...)`:

- فقط state توصیفی account را برگردانید.
- `enabled` و `configured` را حفظ کنید.
- وقتی مرتبط است fieldهای source/status مربوط به credential را شامل کنید، مانند:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- فقط برای گزارش availability فقط‌خواندنی لازم نیست مقدارهای خام token را برگردانید.
  برگرداندن `tokenStatus: "available"` (و field source متناظر)
  برای commandهای سبک status کافی است.
- وقتی یک credential از طریق SecretRef پیکربندی شده اما در مسیر command فعلی
  unavailable است، از `configured_unavailable` استفاده کنید.

این باعث می‌شود commandهای فقط‌خواندنی به‌جای crash کردن یا گزارش نادرست account به‌عنوان پیکربندی‌نشده،
«پیکربندی‌شده اما در این مسیر command unavailable» را گزارش کنند.

## packهای package

یک directory مربوط به Plugin می‌تواند شامل `package.json` با `openclaw.extensions` باشد:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

هر entry به یک Plugin تبدیل می‌شود. اگر pack چند extension فهرست کند، plugin id
به `name/<fileBase>` تبدیل می‌شود.

اگر Plugin شما npm dependency import می‌کند، آن‌ها را در همان directory نصب کنید تا
`node_modules` در دسترس باشد (`npm install` / `pnpm install`).

guardrail امنیتی: هر entry مربوط به `openclaw.extensions` باید پس از resolve شدن symlink
داخل directory Plugin باقی بماند. entryهایی که از directory package خارج شوند
رد می‌شوند.

نکته امنیتی: `openclaw plugins install` dependencyهای Plugin را با یک
`npm install --omit=dev --ignore-scripts` محلی project نصب می‌کند (بدون lifecycle script،
بدون dev dependency در runtime)، و تنظیمات npm install سراسری ارث‌بری‌شده را نادیده می‌گیرد.
درخت‌های dependency مربوط به Plugin را «pure JS/TS» نگه دارید و از packageهایی که به buildهای
`postinstall` نیاز دارند دوری کنید.

اختیاری: `openclaw.setupEntry` می‌تواند به یک module سبک فقط مخصوص setup اشاره کند.
وقتی OpenClaw برای یک Plugin Channel غیرفعال به سطح‌های setup نیاز دارد، یا
وقتی یک Plugin Channel فعال است اما هنوز پیکربندی نشده، به‌جای ورودی کامل Plugin،
`setupEntry` را load می‌کند. این کار startup و setup را سبک‌تر نگه می‌دارد
وقتی ورودی اصلی Plugin شما ابزارها، hookها یا کدهای دیگر فقط مخصوص runtime را نیز wire می‌کند.

اختیاری: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
می‌تواند یک Plugin Channel را وارد همان مسیر `setupEntry` در مرحله startup پیش از listen
مربوط به gateway کند، حتی وقتی Channel از قبل پیکربندی شده است.

این را فقط زمانی استفاده کنید که `setupEntry` کاملاً سطح راه‌اندازی‌ای را پوشش می‌دهد که باید پیش از آنکه Gateway شروع به گوش دادن کند وجود داشته باشد. در عمل، یعنی ورودی راه‌اندازی باید هر قابلیت متعلق به کانال را که راه‌اندازی به آن وابسته است ثبت کند، مانند:

- خود ثبت کانال
- هر مسیر HTTP که باید پیش از شروع گوش دادن Gateway در دسترس باشد
- هر متد، ابزار یا سرویس Gateway که باید در همان بازه وجود داشته باشد

اگر ورودی کامل شما هنوز مالک هر قابلیت راه‌اندازیِ الزامی است، این پرچم را فعال نکنید. Plugin را روی رفتار پیش‌فرض نگه دارید و اجازه دهید OpenClaw ورودی کامل را هنگام راه‌اندازی بارگذاری کند.

کانال‌های بسته‌بندی‌شده همچنین می‌توانند کمک‌کننده‌های سطح قراردادِ فقط مخصوص راه‌اندازی منتشر کنند که هسته می‌تواند پیش از بارگذاری runtime کامل کانال از آن‌ها استفاده کند. سطح ارتقای راه‌اندازی فعلی این است:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

هسته زمانی از آن سطح استفاده می‌کند که لازم باشد یک پیکربندی کانال تک‌حسابِ قدیمی را بدون بارگذاری ورودی کامل Plugin به `channels.<id>.accounts.*` ارتقا دهد. Matrix نمونه بسته‌بندی‌شده فعلی است: وقتی حساب‌های نام‌دار از قبل وجود داشته باشند، فقط کلیدهای احراز هویت/بوت‌استرپ را به یک حساب ارتقایافته نام‌دار منتقل می‌کند، و می‌تواند به‌جای اینکه همیشه `accounts.default` را بسازد، یک کلید حساب پیش‌فرضِ پیکربندی‌شده و غیرمتعارف را حفظ کند.

آن adapterهای وصله راه‌اندازی، کشف سطح قرارداد بسته‌بندی‌شده را تنبل نگه می‌دارند. زمان import سبک می‌ماند؛ سطح ارتقا فقط در نخستین استفاده بارگذاری می‌شود، نه اینکه هنگام import ماژول دوباره وارد راه‌اندازی کانال بسته‌بندی‌شده شود.

وقتی آن سطوح راه‌اندازی شامل متدهای RPC مربوط به Gateway هستند، آن‌ها را روی یک پیشوند مخصوص Plugin نگه دارید. فضاهای نام مدیریتی هسته (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) رزرو شده می‌مانند و همیشه به `operator.admin` resolve می‌شوند، حتی اگر یک Plugin دامنه محدودتری درخواست کند.

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

Pluginهای کانال می‌توانند فراداده راه‌اندازی/کشف را از طریق `openclaw.channel` و راهنمای نصب را از طریق `openclaw.install` اعلام کنند. این کار داده‌های کاتالوگ را بیرون از هسته نگه می‌دارد.

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

فیلدهای مفید `openclaw.channel` فراتر از نمونه حداقلی:

- `detailLabel`: برچسب ثانویه برای سطوح کاتالوگ/وضعیت غنی‌تر
- `docsLabel`: بازنویسی متن لینک برای لینک مستندات
- `preferOver`: شناسه‌های Plugin/کانال با اولویت پایین‌تر که این ورودی کاتالوگ باید بر آن‌ها مقدم باشد
- `selectionDocsPrefix`، `selectionDocsOmitLabel`، `selectionExtras`: کنترل‌های متن سطح انتخاب
- `markdownCapable`: کانال را برای تصمیم‌های قالب‌بندی خروجی به‌عنوان پشتیبان Markdown علامت‌گذاری می‌کند
- `exposure.configured`: وقتی روی `false` تنظیم شود، کانال را از سطوح فهرست‌کردن کانال‌های پیکربندی‌شده پنهان می‌کند
- `exposure.setup`: وقتی روی `false` تنظیم شود، کانال را از انتخاب‌گرهای تعاملی راه‌اندازی/پیکربندی پنهان می‌کند
- `exposure.docs`: کانال را برای سطوح ناوبری مستندات به‌عنوان داخلی/خصوصی علامت‌گذاری می‌کند
- `showConfigured` / `showInSetup`: نام‌های مستعار قدیمی که هنوز برای سازگاری پذیرفته می‌شوند؛ `exposure` را ترجیح دهید
- `quickstartAllowFrom`: کانال را وارد جریان استاندارد quickstart یعنی `allowFrom` می‌کند
- `forceAccountBinding`: اتصال صریح حساب را حتی وقتی فقط یک حساب وجود دارد الزامی می‌کند
- `preferSessionLookupForAnnounceTarget`: هنگام resolve کردن هدف‌های announce، جست‌وجوی نشست را ترجیح می‌دهد

OpenClaw همچنین می‌تواند **کاتالوگ‌های کانال خارجی** را ادغام کند، برای مثال یک خروجی رجیستری MPM. یک فایل JSON را در یکی از مسیرهای زیر قرار دهید:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

یا `OPENCLAW_PLUGIN_CATALOG_PATHS` (یا `OPENCLAW_MPM_CATALOG_PATHS`) را به یک یا چند فایل JSON اشاره دهید (جداشده با ویرگول/نقطه‌ویرگول/`PATH`). هر فایل باید شامل `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` باشد. parser همچنین `"packages"` یا `"plugins"` را به‌عنوان نام‌های مستعار قدیمی برای کلید `"entries"` می‌پذیرد.

ورودی‌های کاتالوگ کانال تولیدشده و ورودی‌های کاتالوگ نصب provider، facts نرمال‌شده منبع نصب را کنار بلوک خام `openclaw.install` نمایش می‌دهند. facts نرمال‌شده مشخص می‌کنند که آیا npm spec یک نسخه دقیق است یا یک انتخاب‌گر شناور، آیا فراداده integrity مورد انتظار وجود دارد، و آیا مسیر منبع محلی نیز در دسترس است. وقتی هویت کاتالوگ/پکیج شناخته‌شده باشد، facts نرمال‌شده هشدار می‌دهند اگر نام پکیج npm تجزیه‌شده از آن هویت فاصله بگیرد. همچنین وقتی `defaultChoice` نامعتبر باشد یا به منبعی اشاره کند که در دسترس نیست، و وقتی فراداده integrity مربوط به npm بدون منبع npm معتبر وجود داشته باشد، هشدار می‌دهند. مصرف‌کنندگان باید با `installSource` به‌عنوان یک فیلد اختیاری افزایشی برخورد کنند تا ورودی‌های دستی و shimهای کاتالوگ مجبور نباشند آن را بسازند.
این به onboarding و diagnostics اجازه می‌دهد وضعیت سطح منبع را بدون import کردن runtime Plugin توضیح دهند.

ورودی‌های رسمی npm خارجی باید یک `npmSpec` دقیق به‌همراه `expectedIntegrity` را ترجیح دهند. نام‌های پکیجِ تنها و dist-tagها هنوز برای سازگاری کار می‌کنند، اما هشدارهای سطح منبع را نمایش می‌دهند تا کاتالوگ بتواند بدون شکستن Pluginهای موجود به‌سمت نصب‌های pinشده و بررسی‌شده با integrity حرکت کند. وقتی onboarding از مسیر کاتالوگ محلی نصب می‌کند، یک ورودی managed plugin در نمایه Plugin با `source: "path"` و در صورت امکان یک `sourcePath` نسبی به workspace ثبت می‌کند. مسیر عملیاتی مطلق بارگذاری در `plugins.load.paths` باقی می‌ماند؛ رکورد نصب از تکرار مسیرهای workstation محلی در پیکربندی بلندمدت جلوگیری می‌کند. این کار نصب‌های توسعه محلی را برای diagnostics سطح منبع قابل مشاهده نگه می‌دارد، بدون اینکه سطح دومی برای افشای خام مسیر filesystem اضافه کند. نمایه Plugin ماندگار `plugins/installs.json` منبع حقیقت نصب است و می‌تواند بدون بارگذاری ماژول‌های runtime مربوط به Plugin تازه‌سازی شود. نگاشت `installRecords` آن حتی وقتی manifest یک Plugin مفقود یا نامعتبر باشد پایدار است؛ آرایه `plugins` آن یک نمای manifest قابل بازسازی است.

## Pluginهای موتور زمینه

Pluginهای موتور زمینه مالک هماهنگ‌سازی زمینه نشست برای ingest، assembly و Compaction هستند. آن‌ها را از Plugin خود با `api.registerContextEngine(id, factory)` ثبت کنید، سپس موتور فعال را با `plugins.slots.contextEngine` انتخاب کنید.

زمانی از این استفاده کنید که Plugin شما نیاز دارد خط لولهٔ پیش‌فرض زمینه را جایگزین یا گسترش دهد، نه اینکه فقط جست‌وجوی حافظه یا hook اضافه کند.

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

کارخانهٔ `ctx` مقدارهای اختیاری `config`، `agentDir` و `workspaceDir` را برای مقداردهی اولیه در زمان ساخت در اختیار می‌گذارد.

اگر موتور شما مالک الگوریتم Compaction **نیست**، `compact()` را پیاده‌سازی‌شده نگه دارید و آن را به‌صورت صریح واگذار کنید:

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

وقتی یک Plugin به رفتاری نیاز دارد که با API فعلی سازگار نیست، با دسترسی خصوصی از کنار سامانهٔ Plugin عبور نکنید. قابلیتِ جاافتاده را اضافه کنید.

ترتیب پیشنهادی:

1. قرارداد هسته را تعریف کنید
   تصمیم بگیرید هسته باید مالک کدام رفتار مشترک باشد: سیاست، fallback، ادغام پیکربندی،
   چرخهٔ حیات، معناشناسی روبه‌کانال، و شکل helper زمان اجرا.
2. سطح‌های تایپ‌شدهٔ ثبت/زمان اجرای Plugin را اضافه کنید
   `OpenClawPluginApi` و/یا `api.runtime` را با کوچک‌ترین سطح تایپ‌شدهٔ مفید برای قابلیت گسترش دهید.
3. مصرف‌کنندگان هسته + کانال/ویژگی را سیم‌کشی کنید
   کانال‌ها و Pluginهای ویژگی باید قابلیت جدید را از طریق هسته مصرف کنند،
   نه با import مستقیم پیاده‌سازی فروشنده.
4. پیاده‌سازی‌های فروشنده را ثبت کنید
   سپس Pluginهای فروشنده backendهای خود را در برابر قابلیت ثبت می‌کنند.
5. پوشش قرارداد را اضافه کنید
   تست‌هایی اضافه کنید تا مالکیت و شکل ثبت در طول زمان صریح بمانند.

این همان روشی است که OpenClaw را صاحب‌نظر نگه می‌دارد بدون اینکه به جهان‌بینی یک ارائه‌دهنده hardcode شود. برای یک چک‌لیست فایل ملموس و نمونهٔ کارشده، [راهنمای عملی قابلیت](/fa/plugins/adding-capabilities) را ببینید.

### چک‌لیست قابلیت

وقتی یک قابلیت جدید اضافه می‌کنید، پیاده‌سازی معمولاً باید این سطح‌ها را با هم لمس کند:

- نوع‌های قرارداد هسته در `src/<capability>/types.ts`
- runner/helper زمان اجرای هسته در `src/<capability>/runtime.ts`
- سطح ثبت API مربوط به Plugin در `src/plugins/types.ts`
- سیم‌کشی registry مربوط به Plugin در `src/plugins/registry.ts`
- نمایش زمان اجرای Plugin در `src/plugins/runtime/*` وقتی Pluginهای ویژگی/کانال باید آن را مصرف کنند
- helperهای capture/test در `src/test-utils/plugin-registration.ts`
- assertionهای مالکیت/قرارداد در `src/plugins/contracts/registry.ts`
- مستندات operator/Plugin در `docs/`

اگر یکی از این سطح‌ها وجود ندارد، معمولاً نشانهٔ این است که قابلیت هنوز کاملاً یکپارچه نشده است.

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
- Pluginهای فروشنده مالک پیاده‌سازی‌های فروشنده هستند
- Pluginهای ویژگی/کانال helperهای زمان اجرا را مصرف می‌کنند
- تست‌های قرارداد مالکیت را صریح نگه می‌دارند

## مرتبط

- [معماری Plugin](/fa/plugins/architecture) — مدل و شکل‌های عمومی قابلیت
- [زیرمسیرهای SDK مربوط به Plugin](/fa/plugins/sdk-subpaths)
- [راه‌اندازی SDK مربوط به Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
