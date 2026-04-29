---
read_when:
    - شما یک Plugin OpenClaw را نگهداری می‌کنید
    - هشدار سازگاری Plugin را می‌بینید
    - شما در حال برنامه‌ریزی برای مهاجرت SDK یا مانیفست Plugin هستید
summary: قراردادهای سازگاری Plugin، فرادادهٔ منسوخ‌سازی، و انتظارات مهاجرت
title: سازگاری Plugin
x-i18n:
    generated_at: "2026-04-29T23:14:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw قراردادهای قدیمی‌تر Plugin را پیش از حذف، از طریق آداپتورهای سازگاری نام‌گذاری‌شده متصل نگه می‌دارد. این کار از Pluginهای داخلی و خارجی موجود محافظت می‌کند، در حالی که قراردادهای SDK، manifest، setup، config و agent runtime تکامل می‌یابند.

## رجیستری سازگاری

قراردادهای سازگاری Plugin در رجیستری اصلی در
`src/plugins/compat/registry.ts` پیگیری می‌شوند.

هر رکورد شامل این موارد است:

- یک کد سازگاری پایدار
- وضعیت: `active`، `deprecated`، `removal-pending`، یا `removed`
- مالک: SDK، config، setup، channel، provider، plugin execution، agent runtime،
  یا core
- تاریخ‌های معرفی و منسوخ‌سازی، در صورت کاربرد
- راهنمای جایگزینی
- مستندات، عیب‌یابی‌ها، و تست‌هایی که رفتار قدیمی و جدید را پوشش می‌دهند

رجیستری منبع برنامه‌ریزی نگه‌دارندگان و بررسی‌های آیندهٔ plugin inspector است. اگر رفتاری که رو به Plugin است تغییر کند، رکورد سازگاری را در همان تغییری که آداپتور را اضافه می‌کند، اضافه یا به‌روزرسانی کنید.

سازگاری تعمیر Doctor و مهاجرت به‌صورت جداگانه در
`src/commands/doctor/shared/deprecation-compat.ts` پیگیری می‌شود. این رکوردها شکل‌های قدیمی config، چیدمان‌های install-ledger، و وصله‌های تعمیر را پوشش می‌دهند که ممکن است پس از حذف مسیر سازگاری runtime همچنان لازم باشد در دسترس بمانند.

بازبینی‌های انتشار باید هر دو رجیستری را بررسی کنند. صرفا به این دلیل که رکورد سازگاری runtime یا config متناظر منقضی شده است، یک مهاجرت Doctor را حذف نکنید؛ ابتدا اطمینان بگیرید هیچ مسیر ارتقای پشتیبانی‌شده‌ای وجود ندارد که هنوز به آن تعمیر نیاز داشته باشد. همچنین در زمان برنامه‌ریزی انتشار، هر annotation جایگزین را دوباره اعتبارسنجی کنید، چون مالکیت Plugin و footprint پیکربندی می‌تواند با خروج providerها و channelها از core تغییر کند.

## بستهٔ plugin inspector

plugin inspector باید بیرون از مخزن اصلی OpenClaw و به‌عنوان یک package/repository جداگانه زندگی کند که پشتوانه‌اش قراردادهای نسخه‌گذاری‌شدهٔ سازگاری و manifest است.

CLI روز اول باید چنین باشد:

```sh
openclaw-plugin-inspector ./my-plugin
```

باید این موارد را خروجی دهد:

- اعتبارسنجی manifest/schema
- نسخهٔ سازگاری قرارداد که بررسی می‌شود
- بررسی‌های فرادادهٔ install/source
- بررسی‌های import مسیر سرد
- هشدارهای منسوخ‌سازی و سازگاری

برای خروجی پایدار و ماشین‌خوان در annotationهای CI از `--json` استفاده کنید. core OpenClaw باید قراردادها و fixtureهایی را در اختیار بگذارد که inspector بتواند مصرف کند، اما نباید باینری inspector را از package اصلی `openclaw` منتشر کند.

### مسیر پذیرش نگه‌دارنده

هنگام اعتبارسنجی inspector خارجی در برابر packageهای Plugin مربوط به OpenClaw، برای مسیر پذیرش package قابل نصب از Blacksmith Testbox استفاده کنید. پس از build شدن package، آن را از یک checkout تمیز OpenClaw اجرا کنید:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

این مسیر را برای نگه‌دارندگان opt-in نگه دارید، چون یک package خارجی npm را نصب می‌کند و ممکن است packageهای Plugin کلون‌شده بیرون از مخزن را بررسی کند. محافظ‌های مخزن محلی export map مربوط به SDK، فرادادهٔ رجیستری سازگاری، کاهش importهای منسوخ SDK، و مرزهای import افزونه‌های داخلی را پوشش می‌دهند؛ اثبات inspector در Testbox، package را همان‌گونه پوشش می‌دهد که نویسندگان Plugin خارجی آن را مصرف می‌کنند.

## سیاست منسوخ‌سازی

OpenClaw نباید یک قرارداد مستندشدهٔ Plugin را در همان انتشاری حذف کند که جایگزین آن را معرفی می‌کند.

توالی مهاجرت چنین است:

1. قرارداد جدید را اضافه کنید.
2. رفتار قدیمی را از طریق یک آداپتور سازگاری نام‌گذاری‌شده متصل نگه دارید.
3. وقتی نویسندگان Plugin می‌توانند اقدام کنند، عیب‌یابی‌ها یا هشدارها را منتشر کنید.
4. جایگزین و زمان‌بندی را مستند کنید.
5. هر دو مسیر قدیمی و جدید را تست کنید.
6. تا پایان بازهٔ مهاجرت اعلام‌شده صبر کنید.
7. فقط با تأیید صریح انتشار ناسازگار حذف کنید.

رکوردهای منسوخ باید تاریخ شروع هشدار، جایگزین، لینک مستندات، و تاریخ حذف نهایی را شامل شوند؛ تاریخ حذف نهایی نباید بیش از سه ماه پس از شروع هشدار باشد. یک مسیر سازگاری منسوخ با بازهٔ حذف بدون پایان اضافه نکنید، مگر این‌که نگه‌دارندگان صراحتا تصمیم بگیرند این سازگاری دائمی است و در عوض آن را `active` علامت بزنند.

## حوزه‌های سازگاری فعلی

رکوردهای سازگاری فعلی شامل این موارد هستند:

- importهای گسترده و قدیمی SDK مانند `openclaw/plugin-sdk/compat`
- شکل‌های قدیمی Plugin که فقط hook دارند و `before_agent_start`
- entrypointهای قدیمی Plugin به شکل `activate(api)` در حالی که Pluginها به
  `register(api)` مهاجرت می‌کنند
- aliasهای قدیمی SDK مانند `openclaw/extension-api`،
  `openclaw/plugin-sdk/channel-runtime`، سازنده‌های وضعیت `openclaw/plugin-sdk/command-auth`
  ، `openclaw/plugin-sdk/test-utils` (که با زیرمسیرهای تست متمرکز
  `openclaw/plugin-sdk/*` جایگزین شده‌اند)، و aliasهای نوع `ClawdbotConfig` /
  `OpenClawSchemaType`
- رفتار allowlist و enablement برای Pluginهای داخلی
- فرادادهٔ manifest قدیمی env-var برای provider/channel
- hookها و aliasهای نوع قدیمی برای provider Pluginها، در حالی که providerها به
  hookهای صریح catalog، auth، thinking، replay، و transport منتقل می‌شوند
- aliasهای runtime قدیمی مانند `api.runtime.taskFlow`،
  `api.runtime.subagent.getSession`، `api.runtime.stt`، و موارد منسوخ
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- ثبت split قدیمی memory-plugin در حالی که memory Pluginها به
  `registerMemoryCapability` مهاجرت می‌کنند
- helperهای قدیمی channel SDK برای schemaهای native message، mention gating،
  قالب‌بندی inbound envelope، و nesting قابلیت approval
- aliasهای قدیمی helper مربوط به channel route key و comparable-target، در حالی که Pluginها
  به `openclaw/plugin-sdk/channel-route` منتقل می‌شوند
- hintهای activation که با مالکیت contribution در manifest جایگزین می‌شوند
- بارگذاری ضمنی و منسوخ sidecar در startup برای Pluginهایی که
  `activation.onStartup` را اعلام نکرده‌اند؛ نگه‌دارندگان می‌توانند رفتار سخت‌گیرانه‌تر آینده را با
  `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` تست کنند
- fallback مربوط به runtime در `setup-api`، در حالی که descriptorهای setup به فرادادهٔ سرد
  `setup.requiresRuntime: false` منتقل می‌شوند
- hookهای `discovery` مربوط به provider، در حالی که hookهای catalog مربوط به provider به
  `catalog.run(...)` منتقل می‌شوند
- فرادادهٔ `showConfigured` / `showInSetup` مربوط به channel، در حالی که packageهای channel به
  `openclaw.channel.exposure` منتقل می‌شوند
- کلیدهای config قدیمی runtime-policy، در حالی که Doctor اپراتورها را به
  `agentRuntime` مهاجرت می‌دهد
- fallback فرادادهٔ config تولیدشده برای channel داخلی، در حالی که فرادادهٔ registry-first
  `channelConfigs` وارد می‌شود
- flagهای env مربوط به غیرفعال‌سازی رجیستری Plugin و install-migration ماندگارشده، در حالی که جریان‌های repair اپراتورها را به `openclaw plugins registry --refresh` و
  `openclaw doctor --fix` مهاجرت می‌دهند
- مسیرهای config قدیمی متعلق به Plugin برای web search، web fetch، و x_search، در حالی که
  Doctor آن‌ها را به `plugins.entries.<plugin>.config` مهاجرت می‌دهد
- config نوشته‌شدهٔ قدیمی `plugins.installs` و aliasهای load-path برای Plugin داخلی،
  در حالی که فرادادهٔ install به ledger مربوط به Plugin که توسط state مدیریت می‌شود منتقل می‌شود

کد جدید Plugin باید جایگزین فهرست‌شده در رجیستری و راهنمای مهاجرت مشخص را ترجیح دهد. Pluginهای موجود می‌توانند تا زمانی که مستندات، عیب‌یابی‌ها، و یادداشت‌های انتشار بازهٔ حذف را اعلام کنند، به استفاده از یک مسیر سازگاری ادامه دهند.

## یادداشت‌های انتشار

یادداشت‌های انتشار باید منسوخ‌سازی‌های پیش‌روی Plugin را همراه با تاریخ‌های هدف و لینک‌های مستندات مهاجرت شامل شوند. این هشدار باید پیش از آن رخ دهد که یک مسیر سازگاری به `removal-pending` یا `removed` منتقل شود.
