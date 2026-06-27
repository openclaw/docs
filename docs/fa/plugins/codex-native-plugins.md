---
read_when:
    - می‌خواهید عامل‌های OpenClaw در حالت Codex از Pluginهای بومی Codex استفاده کنند
    - شما در حال مهاجرت Pluginهای Codex گزینش‌شده توسط openai و نصب‌شده از منبع هستید
    - در حال عیب‌یابی `codexPlugins`، فهرست موجودی برنامه‌ها، اقدامات مخرب، یا تشخیص‌های برنامه‌ی Plugin هستید
summary: پیکربندی Pluginهای بومی Codex مهاجرت‌داده‌شده برای عامل‌های OpenClaw در حالت Codex
title: Pluginهای بومی Codex
x-i18n:
    generated_at: "2026-06-27T18:12:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

پشتیبانی بومی از Pluginهای Codex به یک عامل OpenClaw در حالت Codex اجازه می‌دهد از قابلیت‌های برنامه و Plugin خود app-server مربوط به Codex، در همان رشته Codex که نوبت OpenClaw را مدیریت می‌کند، استفاده کند.

OpenClaw، Pluginهای Codex را به ابزارهای پویای مصنوعی `codex_plugin_*` در OpenClaw ترجمه نمی‌کند. فراخوانی‌های Plugin در رونوشت بومی Codex باقی می‌مانند، و app-server مربوط به Codex اجرای MCP مبتنی بر برنامه را در اختیار دارد.

پس از راه‌اندازی [هارنس Codex](/fa/plugins/codex-harness) پایه از این صفحه استفاده کنید.

## الزامات

- runtime عامل انتخاب‌شده OpenClaw باید هارنس بومی Codex باشد.
- `plugins.entries.codex.enabled` باید true باشد.
- `plugins.entries.codex.config.codexPlugins.enabled` باید true باشد.
- V1 فقط از Pluginهای `openai-curated` پشتیبانی می‌کند که migration آن‌ها را به‌عنوان نصب‌شده از منبع در خانه Codex مبدا مشاهده کرده باشد.
- app-server مقصد Codex باید بتواند marketplace، Plugin، و موجودی برنامه مورد انتظار را ببیند.

`codexPlugins` روی اجراهای OpenClaw، اجراهای عادی ارائه‌دهنده OpenAI، اتصال‌های گفت‌وگوی ACP، یا هارنس‌های دیگر اثری ندارد، چون آن مسیرها رشته‌های app-server مربوط به Codex را با پیکربندی بومی `apps` ایجاد نمی‌کنند.

دسترسی سمت OpenAI به Codex، دسترس‌پذیری برنامه، و کنترل‌های برنامه/Plugin در workspace از حساب واردشده Codex می‌آیند. برای مدل حساب OpenAI و مدیر، [استفاده از Codex با طرح ChatGPT خود](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) را ببینید.

## شروع سریع

migration از خانه Codex مبدا را پیش‌نمایش کنید:

```bash
openclaw migrate codex --dry-run
```

وقتی می‌خواهید migration پیش از برنامه‌ریزی فعال‌سازی بومی Plugin، دسترس‌پذیری برنامه مبدا را بررسی کند، از راستی‌آزمایی سخت‌گیرانه برنامه مبدا استفاده کنید:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

وقتی طرح درست به نظر می‌رسد، migration را اعمال کنید:

```bash
openclaw migrate apply codex --yes
```

migration برای Pluginهای واجد شرایط ورودی‌های صریح `codexPlugins` می‌نویسد و برای Pluginهای انتخاب‌شده، `plugin/install` app-server مربوط به Codex را فراخوانی می‌کند. یک پیکربندی معمول migrateشده شبیه این است:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

پس از تغییر `codexPlugins`، گفت‌وگوهای جدید Codex مجموعه برنامه به‌روزشده را به‌طور خودکار دریافت می‌کنند. برای تازه‌سازی گفت‌وگوی فعلی از `/new` یا `/reset` استفاده کنید. برای تغییرات فعال یا غیرفعال‌سازی Plugin، راه‌اندازی دوباره gateway لازم نیست.

## مدیریت Pluginها از چت

وقتی می‌خواهید Pluginهای بومی پیکربندی‌شده Codex را از همان چتی که در آن هارنس Codex را اجرا می‌کنید بررسی یا تغییر دهید، از `/codex plugins` استفاده کنید:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` نام مستعار `/codex plugins list` است. خروجی فهرست، کلیدهای Plugin پیکربندی‌شده، وضعیت روشن/خاموش، نام Plugin در Codex، و marketplace را از `plugins.entries.codex.config.codexPlugins.plugins` نشان می‌دهد.

`enable` و `disable` فقط در پیکربندی OpenClaw در `~/.openclaw/openclaw.json` می‌نویسند؛ آن‌ها `~/.codex/config.toml` را ویرایش نمی‌کنند و Pluginهای جدید Codex را نصب نمی‌کنند. فقط مالک یا یک کلاینت gateway با scope به نام `operator.admin` می‌تواند وضعیت Plugin را تغییر دهد.

فعال‌کردن یک Plugin پیکربندی‌شده همچنین کلید سراسری `codexPlugins.enabled` را روشن می‌کند. اگر Plugin به این دلیل غیرفعال نوشته شده بود که migration مقدار `auth_required` برگردانده است، پیش از فعال‌کردن آن در OpenClaw، برنامه را در Codex دوباره مجاز کنید.

## نحوه کار راه‌اندازی بومی Plugin

این یکپارچه‌سازی سه وضعیت جداگانه دارد:

- نصب‌شده: Codex بسته محلی Plugin را در runtime app-server مقصد دارد.
- فعال: پیکربندی OpenClaw مایل است Plugin را برای نوبت‌های هارنس Codex در دسترس قرار دهد.
- در دسترس: app-server مربوط به Codex تایید می‌کند که ورودی‌های برنامه Plugin برای حساب فعال در دسترس هستند و می‌توانند به هویت Plugin migrateشده نگاشت شوند.

migration گام پایدار نصب/واجد شرایط بودن است. در زمان برنامه‌ریزی، OpenClaw جزئیات `plugin/read` مربوط به Codex مبدا را می‌خواند و بررسی می‌کند که پاسخ حساب app-server مربوط به Codex مبدا، یک حساب اشتراک ChatGPT باشد. پاسخ‌های حساب غیر ChatGPT یا مفقود، Pluginهای مبتنی بر برنامه را با `codex_subscription_required` رد می‌کنند. به‌طور پیش‌فرض، migration فراخوانی `app/list` مبدا را انجام نمی‌دهد؛ Pluginهای مبدا مبتنی بر برنامه که از دروازه حساب عبور می‌کنند، بدون راستی‌آزمایی دسترس‌پذیری برنامه مبدا برنامه‌ریزی می‌شوند، و شکست‌های انتقال در جست‌وجوی حساب با `codex_account_unavailable` رد می‌شوند. با `--verify-plugin-apps`، migration یک snapshot تازه از `app/list` مبدا می‌گیرد و پیش از برنامه‌ریزی فعال‌سازی بومی، حضور، فعال‌بودن، و دسترس‌پذیری هر برنامه مالکیت‌دار را الزامی می‌کند. در آن حالت، شکست‌های انتقال در جست‌وجوی حساب به دروازه موجودی برنامه مبدا می‌رسند. موجودی برنامه runtime بررسی دسترس‌پذیری نشست مقصد پس از migration است. سپس راه‌اندازی نشست هارنس Codex یک پیکربندی محدودکننده برنامه رشته را برای برنامه‌های Plugin فعال و در دسترس محاسبه می‌کند.

پیکربندی برنامه رشته زمانی محاسبه می‌شود که OpenClaw یک نشست هارنس Codex برقرار می‌کند یا یک اتصال رشته Codex کهنه را جایگزین می‌کند. این پیکربندی در هر نوبت دوباره محاسبه نمی‌شود، بنابراین `/codex plugins enable` و `/codex plugins disable` روی گفت‌وگوهای جدید Codex اثر می‌گذارند. وقتی گفت‌وگوی فعلی باید مجموعه برنامه به‌روزشده را دریافت کند، از `/new` یا `/reset` استفاده کنید.

## مرز پشتیبانی V1

V1 عمدا محدود است:

- فقط Pluginهای `openai-curated` که از قبل در موجودی app-server مبدا Codex نصب شده بودند، برای migration واجد شرایط هستند.
- Pluginهای مبدا مبتنی بر برنامه باید از دروازه اشتراک در زمان migration عبور کنند. `--verify-plugin-apps` دروازه موجودی برنامه مبدا را اضافه می‌کند. حساب‌های مشمول اشتراک، و در حالت راستی‌آزمایی، برنامه‌های مبدا غیرقابل دسترس، غیرفعال، مفقود یا شکست‌های تازه‌سازی موجودی برنامه مبدا، به‌جای ورودی‌های پیکربندی فعال، به‌عنوان موارد دستی ردشده گزارش می‌شوند. جزئیات ناخوانای Plugin پیش از دروازه موجودی برنامه مبدا رد می‌شوند.
- migration هویت‌های صریح Plugin را با `marketplaceName` و `pluginName` می‌نویسد؛ مسیرهای cache محلی `marketplacePath` را نمی‌نویسد.
- `codexPlugins.enabled` کلید فعال‌سازی سراسری است.
- هیچ wildcard به شکل `plugins["*"]` و هیچ کلید پیکربندی‌ای که اختیار نصب دلخواه بدهد وجود ندارد.
- marketplaceهای پشتیبانی‌نشده، بسته‌های cacheشده Plugin، hookها، و فایل‌های پیکربندی Codex در گزارش migration برای بازبینی دستی حفظ می‌شوند.

## موجودی برنامه و مالکیت

OpenClaw موجودی برنامه Codex را از طریق `app/list` مربوط به app-server می‌خواند، آن را برای یک ساعت cache می‌کند، و ورودی‌های کهنه یا مفقود را به‌صورت async تازه‌سازی می‌کند. cache فقط در حافظه است؛ راه‌اندازی دوباره CLI یا gateway آن را حذف می‌کند، و OpenClaw آن را از خواندن بعدی `app/list` دوباره می‌سازد.

migration و runtime از کلیدهای cache جداگانه استفاده می‌کنند:

- راستی‌آزمایی migration مبدا از خانه Codex مبدا و گزینه‌های شروع app-server مبدا استفاده می‌کند. این فقط وقتی اجرا می‌شود که `--verify-plugin-apps` تنظیم شده باشد، و برای آن اجرای برنامه‌ریزی، یک پیمایش تازه `app/list` مبدا را اجبار می‌کند.
- راه‌اندازی runtime مقصد زمانی که پیکربندی برنامه رشته Codex را می‌سازد، از هویت app-server مربوط به Codex عامل مقصد استفاده می‌کند. فعال‌سازی Plugin آن کلید cache مقصد را نامعتبر می‌کند و سپس پس از `plugin/install` آن را با اجبار تازه‌سازی می‌کند.

یک برنامه Plugin فقط زمانی افشا می‌شود که OpenClaw بتواند آن را از طریق مالکیت پایدار به Plugin migrateشده نگاشت کند:

- شناسه دقیق برنامه از جزئیات Plugin
- نام شناخته‌شده سرور MCP
- فراداده پایدار یکتا

مالکیت فقط بر پایه نام نمایشی یا مالکیت مبهم تا زمانی که تازه‌سازی بعدی موجودی مالکیت را ثابت کند، کنار گذاشته می‌شود.

## پیکربندی برنامه رشته

OpenClaw یک patch محدودکننده `config.apps` برای رشته Codex تزریق می‌کند: `_default` غیرفعال است و فقط برنامه‌هایی که مالک آن‌ها Pluginهای migrateشده فعال هستند، فعال می‌شوند.

OpenClaw مقدار سطح برنامه `destructive_enabled` را از سیاست سراسری موثر یا سیاست هر Plugin برای `allow_destructive_actions` تنظیم می‌کند و اجازه می‌دهد Codex فراداده ابزار مخرب را از annotationهای ابزار برنامه بومی خودش enforce کند. `true`، `"auto"`، و `"always"` مقدار `destructive_enabled: true` را تنظیم می‌کنند؛ `false` آن را false می‌کند. پیکربندی برنامه `_default` با `open_world_enabled: false` غیرفعال می‌شود. برنامه‌های Plugin فعال با `open_world_enabled: true` منتشر می‌شوند؛ OpenClaw یک دکمه سیاست open-world جداگانه برای Plugin افشا نمی‌کند و فهرست‌های deny مربوط به نام ابزار مخرب برای هر Plugin نگه نمی‌دارد.

حالت تایید ابزار به‌طور پیش‌فرض برای برنامه‌های Plugin خودکار است تا ابزارهای خواندن غیرمخرب بتوانند بدون UI تایید در همان رشته اجرا شوند. ابزارهای مخرب همچنان توسط سیاست `destructive_enabled` هر برنامه کنترل می‌شوند.

## سیاست اقدام مخرب

elicitationهای مخرب Plugin به‌طور پیش‌فرض برای Pluginهای migrateشده Codex مجاز هستند، در حالی که schemaهای ناامن و مالکیت مبهم همچنان fail closed می‌شوند:

- مقدار پیش‌فرض سراسری `allow_destructive_actions` برابر `true` است.
- مقدار `allow_destructive_actions` در هر Plugin سیاست سراسری را برای آن Plugin override می‌کند.
- وقتی سیاست `false` باشد، OpenClaw یک رد قطعی برمی‌گرداند.
- وقتی سیاست `true` باشد، OpenClaw فقط schemaهای امنی را auto-accept می‌کند که بتواند به یک پاسخ تایید نگاشت کند، مانند یک فیلد approve بولی.
- وقتی سیاست `"auto"` باشد، OpenClaw اقدام‌های مخرب Plugin را در اختیار Codex قرار می‌دهد اما elicitationهای تایید MCP با مالکیت اثبات‌شده را پیش از بازگرداندن پاسخ تایید Codex، به تاییدهای Plugin در OpenClaw تبدیل می‌کند.
- وقتی سیاست `"always"` باشد، OpenClaw از همان gating نوشتن/مخرب Codex مانند `"auto"` استفاده می‌کند، overrideهای پایدار تایید هر ابزار Codex را برای برنامه پیش از شروع رشته پاک می‌کند، و فقط تایید یا رد یک‌باره ارائه می‌دهد تا تاییدهای پایدار نتوانند promptهای بعدی اقدام نوشتنی را سرکوب کنند.
- هویت مفقود Plugin، مالکیت مبهم، شناسه نوبت مفقود، شناسه نوبت اشتباه، یا schema ناامن elicitation به‌جای prompt کردن، رد می‌شود.

## عیب‌یابی

**`auth_required`:** migration، Plugin را نصب کرده است، اما یکی از برنامه‌های آن هنوز به احراز هویت نیاز دارد. ورودی صریح Plugin تا زمانی که دوباره مجاز کنید و آن را فعال کنید، غیرفعال نوشته می‌شود.

**`app_inaccessible`، `app_disabled`، یا `app_missing`:**
migration، Plugin را نصب نکرد چون موجودی برنامه Codex مبدا در حالی که `--verify-plugin-apps` تنظیم شده بود، همه برنامه‌های مالکیت‌دار را به‌صورت حاضر، فعال، و در دسترس نشان نداد. برنامه را در Codex دوباره مجاز یا فعال کنید، سپس migration را با `--verify-plugin-apps` دوباره اجرا کنید.

**`app_inventory_unavailable`:** migration، Plugin را نصب نکرد چون راستی‌آزمایی سخت‌گیرانه برنامه مبدا درخواست شده بود و تازه‌سازی موجودی برنامه Codex مبدا شکست خورد. دسترسی app-server مبدا Codex را اصلاح کنید یا اگر طرح سریع‌تر مبتنی بر دروازه حساب را می‌پذیرید، بدون `--verify-plugin-apps` دوباره تلاش کنید.

**`codex_subscription_required`:** migration، Plugin مبتنی بر برنامه را نصب نکرد چون حساب app-server مبدا Codex با یک حساب اشتراک ChatGPT وارد نشده بود. با auth اشتراک وارد برنامه Codex شوید، سپس migration را دوباره اجرا کنید.

**`codex_account_unavailable`:** migration، Plugin مبتنی بر برنامه را نصب نکرد چون حساب app-server مبدا Codex خوانده نشد. auth app-server مبدا Codex را اصلاح کنید یا اگر می‌خواهید وقتی جست‌وجوی حساب شکست می‌خورد، موجودی برنامه مبدا واجد شرایط بودن را تعیین کند، با `--verify-plugin-apps` دوباره اجرا کنید.

**`marketplace_missing` یا `plugin_missing`:** app-server مقصد Codex نمی‌تواند marketplace یا Plugin مورد انتظار `openai-curated` را ببیند. migration را دوباره در برابر runtime مقصد اجرا کنید یا وضعیت Plugin در app-server مربوط به Codex را بررسی کنید.

**`app_inventory_missing` یا `app_inventory_stale`:** آمادگی برنامه از یک cache خالی یا کهنه آمده است. OpenClaw یک تازه‌سازی async زمان‌بندی می‌کند و برنامه‌های Plugin را تا زمانی که مالکیت و آمادگی شناخته شوند، کنار می‌گذارد.

**`app_ownership_ambiguous`:** موجودی برنامه فقط با نام نمایشی match شده است، بنابراین برنامه در معرض رشته Codex قرار نمی‌گیرد.

**پیکربندی تغییر کرده اما عامل نمی‌تواند Plugin را ببیند:** برای تایید وضعیت پیکربندی‌شده از `/codex plugins list` استفاده کنید، سپس از `/new` یا `/reset` استفاده کنید. اتصال‌های رشته موجود Codex تا زمانی که OpenClaw یک نشست هارنس جدید برقرار کند یا یک اتصال کهنه را جایگزین کند، همان پیکربندی برنامه‌ای را نگه می‌دارند که با آن شروع شده‌اند.

**اقدام مخرب رد می‌شود:** مقدارهای سراسری و مختص هر Plugin برای
`allow_destructive_actions` را بررسی کنید. حتی وقتی خط‌مشی `true`، `"auto"` یا
`"always"` باشد، طرح‌واره‌های ناایمن درخواست اطلاعات و هویت مبهم Plugin همچنان
در حالت بسته رد می‌شوند.

## مرتبط

- [هارنس Codex](/fa/plugins/codex-harness)
- [مرجع هارنس Codex](/fa/plugins/codex-harness-reference)
- [زمان اجرای هارنس Codex](/fa/plugins/codex-harness-runtime)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#codex-harness-plugin-config)
- [مهاجرت CLI](/fa/cli/migrate)
