---
read_when:
    - می‌خواهید عامل‌های OpenClaw در حالت Codex از Pluginهای بومی Codex استفاده کنند
    - در حال مهاجرت Pluginهای Codex گزینش‌شده توسط OpenAI هستید که از منبع نصب شده‌اند
    - در حال عیب‌یابی `codexPlugins`، موجودی برنامه، اقدامات مخرب، یا عیب‌یابی‌های برنامه Plugin هستید
summary: Pluginهای بومی Codex مهاجرت‌یافته را برای عامل‌های OpenClaw در حالت Codex پیکربندی کنید
title: Pluginهای بومی Codex
x-i18n:
    generated_at: "2026-05-10T19:54:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

پشتیبانی بومی از Pluginهای Codex به یک عامل OpenClaw در حالت Codex اجازه می‌دهد از قابلیت‌های اپ و Plugin خود app-server مربوط به Codex، داخل همان رشته Codex که نوبت OpenClaw را مدیریت می‌کند، استفاده کند.

OpenClaw، Pluginهای Codex را به ابزارهای پویای مصنوعی `codex_plugin_*` در OpenClaw ترجمه نمی‌کند. فراخوانی‌های Plugin در رونوشت بومی Codex باقی می‌مانند، و app-server مربوط به Codex اجرای MCP متکی به اپ را در اختیار دارد.

پس از اینکه [هارنس Codex](/fa/plugins/codex-harness) پایه کار کرد، از این صفحه استفاده کنید.

## الزامات

- runtime عامل انتخاب‌شده OpenClaw باید هارنس بومی Codex باشد.
- `plugins.entries.codex.enabled` باید true باشد.
- `plugins.entries.codex.config.codexPlugins.enabled` باید true باشد.
- V1 فقط از Pluginهای `openai-curated` پشتیبانی می‌کند که مهاجرت مشاهده کرده است به‌صورت منبع‌نصب‌شده در خانه Codex مبدأ وجود دارند.
- app-server مقصد Codex باید بتواند marketplace، Plugin، و موجودی اپ مورد انتظار را ببیند.

`codexPlugins` روی اجراهای PI، اجراهای عادی ارائه‌دهنده OpenAI، اتصال‌های گفت‌وگوی ACP، یا هارنس‌های دیگر اثری ندارد، چون آن مسیرها رشته‌های app-server مربوط به Codex را با پیکربندی بومی `apps` ایجاد نمی‌کنند.

## شروع سریع

پیش‌نمایش مهاجرت از خانه Codex مبدأ:

```bash
openclaw migrate codex --dry-run
```

وقتی برنامه درست به نظر می‌رسد، مهاجرت را اعمال کنید:

```bash
openclaw migrate apply codex --yes
```

مهاجرت برای Pluginهای واجد شرایط ورودی‌های صریح `codexPlugins` را می‌نویسد و برای Pluginهای انتخاب‌شده، `plugin/install` مربوط به app-server در Codex را فراخوانی می‌کند. یک پیکربندی مهاجرت‌یافته معمولی به این شکل است:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

پس از تغییر `codexPlugins`، از `/new`، `/reset` استفاده کنید یا Gateway را راه‌اندازی مجدد کنید تا نشست‌های آینده هارنس Codex با مجموعه اپ به‌روزشده شروع شوند.

## نحوه کار راه‌اندازی بومی Plugin

این یکپارچه‌سازی سه وضعیت جداگانه دارد:

- نصب‌شده: Codex بسته Plugin محلی را در runtime app-server مقصد دارد.
- فعال: پیکربندی OpenClaw مایل است Plugin را در اختیار نوبت‌های هارنس Codex قرار دهد.
- قابل دسترسی: app-server مربوط به Codex تأیید می‌کند ورودی‌های اپ Plugin برای حساب فعال در دسترس هستند و می‌توانند به هویت Plugin مهاجرت‌یافته نگاشت شوند.

مهاجرت، مرحله پایدار نصب/واجد شرایط بودن است. موجودی اپ در runtime، بررسی دسترس‌پذیری است. سپس راه‌اندازی نشست هارنس Codex یک پیکربندی محدودکننده اپ رشته را برای اپ‌های Plugin فعال و قابل دسترسی محاسبه می‌کند.

پیکربندی اپ رشته زمانی محاسبه می‌شود که OpenClaw یک نشست هارنس Codex برقرار کند یا اتصال رشته Codex کهنه را جایگزین کند. در هر نوبت دوباره محاسبه نمی‌شود.

## مرز پشتیبانی V1

V1 عمداً محدود است:

- فقط Pluginهای `openai-curated` که از قبل در موجودی app-server مبدأ Codex نصب شده بودند، واجد شرایط مهاجرت هستند.
- مهاجرت هویت‌های صریح Plugin را با `marketplaceName` و `pluginName` می‌نویسد؛ مسیرهای کش محلی `marketplacePath` را نمی‌نویسد.
- `codexPlugins.enabled` کلید فعال‌سازی سراسری است.
- هیچ wildcard با `plugins["*"]` و هیچ کلید پیکربندی‌ای که اختیار نصب دلخواه بدهد وجود ندارد.
- marketplaceهای پشتیبانی‌نشده، بسته‌های کش‌شده Plugin، hookها، و فایل‌های پیکربندی Codex برای بازبینی دستی در گزارش مهاجرت حفظ می‌شوند.

## موجودی اپ و مالکیت

OpenClaw موجودی اپ Codex را از طریق `app/list` مربوط به app-server می‌خواند، آن را برای یک ساعت کش می‌کند، و ورودی‌های کهنه یا مفقود را به‌صورت ناهمگام تازه‌سازی می‌کند.

اپ Plugin فقط زمانی در معرض استفاده قرار می‌گیرد که OpenClaw بتواند آن را از طریق مالکیت پایدار به Plugin مهاجرت‌یافته نگاشت کند:

- شناسه دقیق اپ از جزئیات Plugin
- نام شناخته‌شده سرور MCP
- فراداده پایدار یکتا

مالکیتی که فقط بر اساس نام نمایشی باشد یا مبهم باشد، تا زمانی که تازه‌سازی بعدی موجودی مالکیت را اثبات کند، کنار گذاشته می‌شود.

## پیکربندی اپ رشته

OpenClaw یک وصله محدودکننده `config.apps` را برای رشته Codex تزریق می‌کند: `_default` غیرفعال می‌شود و فقط اپ‌های متعلق به Pluginهای مهاجرت‌یافته فعال، فعال می‌شوند.

OpenClaw مقدار سطح اپ `destructive_enabled` را از سیاست مؤثر سراسری یا به‌ازای هر Plugin در `allow_destructive_actions` تنظیم می‌کند و اجازه می‌دهد Codex فراداده ابزارهای مخرب را از annotationهای ابزار اپ بومی خود اعمال کند. پیکربندی اپ `_default` با `open_world_enabled: false` غیرفعال می‌شود. اپ‌های Plugin فعال با `open_world_enabled: true` منتشر می‌شوند؛ OpenClaw دکمه سیاست جداگانه‌ای برای open-world مربوط به Plugin ارائه نمی‌کند و فهرست‌های رد نام ابزار مخرب به‌ازای هر Plugin را نگه نمی‌دارد.

حالت تأیید ابزار برای اپ‌های Plugin به‌طور پیش‌فرض به‌صورت درخواستی است، چون OpenClaw در این مسیر هم‌رشته، رابط کاربری تعاملی برای درخواست اپ ندارد.

## سیاست اقدام مخرب

درخواست‌های مخرب Plugin به‌طور پیش‌فرض بسته رد می‌شوند:

- مقدار پیش‌فرض سراسری `allow_destructive_actions` برابر `false` است.
- مقدار `allow_destructive_actions` به‌ازای هر Plugin، سیاست سراسری را برای آن Plugin بازنویسی می‌کند.
- وقتی سیاست `false` باشد، OpenClaw یک رد قطعی برمی‌گرداند.
- وقتی سیاست `true` باشد، OpenClaw فقط schemaهای امنی را به‌صورت خودکار می‌پذیرد که بتواند به پاسخ تأیید نگاشت کند، مانند فیلد تأیید بولی.
- هویت مفقود Plugin، مالکیت مبهم، شناسه نوبت مفقود، شناسه نوبت اشتباه، یا schema درخواست ناامن به‌جای نمایش درخواست، رد می‌شود.

## عیب‌یابی

**`auth_required`:** مهاجرت Plugin را نصب کرده است، اما یکی از اپ‌های آن هنوز به احراز هویت نیاز دارد. ورودی صریح Plugin تا زمانی که دوباره مجوزدهی و آن را فعال کنید، به‌صورت غیرفعال نوشته می‌شود.

**`marketplace_missing` یا `plugin_missing`:** app-server مقصد Codex نمی‌تواند marketplace یا Plugin مورد انتظار `openai-curated` را ببیند. مهاجرت را دوباره در برابر runtime مقصد اجرا کنید یا وضعیت Plugin در app-server مربوط به Codex را بررسی کنید.

**`app_inventory_missing` یا `app_inventory_stale`:** آمادگی اپ از یک کش خالی یا کهنه آمده است. OpenClaw یک تازه‌سازی ناهمگام زمان‌بندی می‌کند و تا زمانی که مالکیت و آمادگی شناخته شوند، اپ‌های Plugin را کنار می‌گذارد.

**`app_ownership_ambiguous`:** موجودی اپ فقط بر اساس نام نمایشی تطبیق پیدا کرده است، بنابراین اپ در معرض رشته Codex قرار نمی‌گیرد.

**پیکربندی تغییر کرده اما عامل نمی‌تواند Plugin را ببیند:** از `/new`، `/reset` استفاده کنید یا Gateway را راه‌اندازی مجدد کنید. اتصال‌های موجود رشته Codex همان پیکربندی اپی را که با آن شروع شده‌اند نگه می‌دارند، تا زمانی که OpenClaw یک نشست هارنس جدید برقرار کند یا یک اتصال کهنه را جایگزین کند.

**اقدام مخرب رد می‌شود:** مقدارهای سراسری و به‌ازای هر Plugin در `allow_destructive_actions` را بررسی کنید. حتی وقتی سیاست true است، schemaهای درخواست ناامن و هویت مبهم Plugin همچنان به‌صورت بسته رد می‌شوند.

## مرتبط

- [هارنس Codex](/fa/plugins/codex-harness)
- [مرجع هارنس Codex](/fa/plugins/codex-harness-reference)
- [runtime هارنس Codex](/fa/plugins/codex-harness-runtime)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI مهاجرت](/fa/cli/migrate)
