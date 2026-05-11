---
read_when:
    - می‌خواهید عامل‌های OpenClaw در حالت Codex از Pluginهای بومی Codex استفاده کنند
    - شما در حال مهاجرت Pluginهای Codex منتخب OpenAI نصب‌شده از منبع هستید
    - در حال عیب‌یابی `codexPlugins`، فهرست برنامه‌ها، اقدامات مخرب، یا عیب‌یابی‌های برنامهٔ Plugin هستید
summary: پیکربندی Pluginهای بومی Codex مهاجرت‌داده‌شده برای عامل‌های OpenClaw در حالت Codex
title: Plugin‌های بومی Codex
x-i18n:
    generated_at: "2026-05-11T20:39:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

پشتیبانی بومی Plugin های Codex به یک عامل OpenClaw در حالت Codex اجازه می‌دهد از قابلیت‌های برنامه و Plugin خود Codex app-server در همان رشته Codex استفاده کند که نوبت OpenClaw را مدیریت می‌کند.

OpenClaw، Plugin های Codex را به ابزارهای پویای مصنوعی `codex_plugin_*` در OpenClaw ترجمه نمی‌کند. فراخوانی‌های Plugin در رونوشت بومی Codex باقی می‌مانند و Codex app-server مالک اجرای MCP مبتنی بر برنامه است.

پس از راه‌اندازی [مهار Codex](/fa/plugins/codex-harness) پایه، از این صفحه استفاده کنید.

## الزامات

- محیط اجرای عامل OpenClaw انتخاب‌شده باید مهار بومی Codex باشد.
- `plugins.entries.codex.enabled` باید `true` باشد.
- `plugins.entries.codex.config.codexPlugins.enabled` باید `true` باشد.
- V1 فقط از Plugin های `openai-curated` پشتیبانی می‌کند که مهاجرت آن‌ها را به‌عنوان نصب‌شده از مبدأ در خانه Codex مبدأ مشاهده کرده باشد.
- Codex app-server مقصد باید بتواند موجودی marketplace، Plugin، و برنامه مورد انتظار را ببیند.

`codexPlugins` روی اجراهای PI، اجراهای عادی فراهم‌کننده OpenAI، پیوندهای گفت‌وگوی ACP، یا مهارهای دیگر اثری ندارد، زیرا این مسیرها رشته‌های Codex app-server را با پیکربندی بومی `apps` ایجاد نمی‌کنند.

## شروع سریع

پیش‌نمایش مهاجرت از خانه Codex مبدأ:

```bash
openclaw migrate codex --dry-run
```

وقتی طرح درست به نظر می‌رسد، مهاجرت را اعمال کنید:

```bash
openclaw migrate apply codex --yes
```

مهاجرت، ورودی‌های صریح `codexPlugins` را برای Plugin های واجد شرایط می‌نویسد و برای Plugin های انتخاب‌شده، `plugin/install` در Codex app-server را فراخوانی می‌کند. یک پیکربندی معمول مهاجرت‌شده شبیه این است:

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

پس از تغییر `codexPlugins`، از `/new`، `/reset` استفاده کنید یا gateway را بازراه‌اندازی کنید تا نشست‌های آینده مهار Codex با مجموعه برنامه به‌روزشده شروع شوند.

## نحوه کار راه‌اندازی بومی Plugin

این یکپارچه‌سازی سه وضعیت جداگانه دارد:

- نصب‌شده: Codex بسته Plugin محلی را در محیط اجرای app-server مقصد دارد.
- فعال‌شده: پیکربندی OpenClaw حاضر است Plugin را برای نوبت‌های مهار Codex در دسترس قرار دهد.
- قابل دسترسی: Codex app-server تأیید می‌کند که ورودی‌های برنامه Plugin برای حساب فعال در دسترس هستند و می‌توانند به هویت Plugin مهاجرت‌شده نگاشت شوند.

مهاجرت، مرحله نصب/احراز صلاحیت پایدار است. موجودی برنامه در زمان اجرا، بررسی دسترسی‌پذیری است. سپس راه‌اندازی نشست مهار Codex یک پیکربندی محدودکننده برنامه رشته را برای برنامه‌های Plugin فعال‌شده و قابل دسترسی محاسبه می‌کند.

پیکربندی برنامه رشته زمانی محاسبه می‌شود که OpenClaw یک نشست مهار Codex برقرار می‌کند یا یک پیوند رشته Codex کهنه را جایگزین می‌کند. این پیکربندی در هر نوبت دوباره محاسبه نمی‌شود.

## محدوده پشتیبانی V1

V1 عمداً محدود است:

- فقط Plugin های `openai-curated` که از قبل در موجودی Codex app-server مبدأ نصب شده بودند، واجد شرایط مهاجرت هستند.
- مهاجرت هویت‌های صریح Plugin را با `marketplaceName` و `pluginName` می‌نویسد؛ مسیرهای کش محلی `marketplacePath` را نمی‌نویسد.
- `codexPlugins.enabled` کلید فعال‌سازی سراسری است.
- هیچ wildcard با `plugins["*"]` و هیچ کلید پیکربندی‌ای که اختیار نصب دلخواه بدهد وجود ندارد.
- marketplace های پشتیبانی‌نشده، بسته‌های Plugin کش‌شده، hook ها، و فایل‌های پیکربندی Codex برای بازبینی دستی در گزارش مهاجرت حفظ می‌شوند.

## موجودی برنامه و مالکیت

OpenClaw موجودی برنامه Codex را از طریق `app/list` در app-server می‌خواند، آن را به‌مدت یک ساعت کش می‌کند، و ورودی‌های کهنه یا گمشده را به‌صورت ناهمگام تازه‌سازی می‌کند.

یک برنامه Plugin فقط زمانی ارائه می‌شود که OpenClaw بتواند آن را از طریق مالکیت پایدار به Plugin مهاجرت‌شده نگاشت کند:

- شناسه دقیق برنامه از جزئیات Plugin
- نام شناخته‌شده سرور MCP
- فراداده پایدار یکتا

مالکیت صرفاً مبتنی بر نام نمایشی یا مبهم تا زمانی که تازه‌سازی بعدی موجودی مالکیت را ثابت کند، کنار گذاشته می‌شود.

## پیکربندی برنامه رشته

OpenClaw یک وصله محدودکننده `config.apps` را برای رشته Codex تزریق می‌کند: `_default` غیرفعال می‌شود و فقط برنامه‌هایی که مالک آن‌ها Plugin های مهاجرت‌شده فعال هستند، فعال می‌شوند.

OpenClaw مقدار `destructive_enabled` در سطح برنامه را از سیاست مؤثر سراسری یا مخصوص Plugin برای `allow_destructive_actions` تنظیم می‌کند و اجازه می‌دهد Codex فراداده ابزار مخرب را از حاشیه‌نویسی‌های ابزار برنامه بومی خود اعمال کند. پیکربندی برنامه `_default` با `open_world_enabled: false` غیرفعال می‌شود. برنامه‌های Plugin فعال با `open_world_enabled: true` خروجی داده می‌شوند؛ OpenClaw یک کنترل سیاست open-world جداگانه برای Plugin ارائه نمی‌کند و فهرست‌های منع نام ابزار مخرب مخصوص Plugin را نگهداری نمی‌کند.

حالت تأیید ابزار به‌طور پیش‌فرض برای برنامه‌های Plugin خودکار است تا ابزارهای خواندن غیرمخرب بتوانند بدون رابط تأیید در همان رشته اجرا شوند. ابزارهای مخرب همچنان توسط سیاست `destructive_enabled` هر برنامه کنترل می‌شوند.

## سیاست اقدام مخرب

درخواست‌های مخرب Plugin به‌طور پیش‌فرض بسته شکست می‌خورند:

- مقدار پیش‌فرض `allow_destructive_actions` سراسری `false` است.
- `allow_destructive_actions` مخصوص Plugin سیاست سراسری را برای آن Plugin بازنویسی می‌کند.
- وقتی سیاست `false` باشد، OpenClaw یک رد قطعی برمی‌گرداند.
- وقتی سیاست `true` باشد، OpenClaw فقط schema های ایمنی را که بتواند به یک پاسخ تأیید نگاشت کند، به‌صورت خودکار می‌پذیرد؛ مانند یک فیلد بولی approve.
- هویت Plugin گمشده، مالکیت مبهم، شناسه نوبت گمشده، شناسه نوبت اشتباه، یا schema درخواست ناایمن به‌جای نمایش درخواست، رد می‌شود.

## عیب‌یابی

**`auth_required`:** مهاجرت Plugin را نصب کرده است، اما یکی از برنامه‌های آن هنوز به احراز هویت نیاز دارد. ورودی صریح Plugin تا زمانی که دوباره مجوزدهی و آن را فعال کنید، به‌صورت غیرفعال نوشته می‌شود.

**`marketplace_missing` یا `plugin_missing`:** Codex app-server مقصد نمی‌تواند marketplace یا Plugin مورد انتظار `openai-curated` را ببیند. مهاجرت را دوباره در برابر محیط اجرای مقصد اجرا کنید یا وضعیت Plugin در Codex app-server را بررسی کنید.

**`app_inventory_missing` یا `app_inventory_stale`:** آمادگی برنامه از یک کش خالی یا کهنه آمده است. OpenClaw یک تازه‌سازی ناهمگام زمان‌بندی می‌کند و برنامه‌های Plugin را تا زمانی که مالکیت و آمادگی مشخص شوند، کنار می‌گذارد.

**`app_ownership_ambiguous`:** موجودی برنامه فقط بر اساس نام نمایشی تطبیق یافته است، بنابراین برنامه در معرض رشته Codex قرار نمی‌گیرد.

**پیکربندی تغییر کرده اما عامل نمی‌تواند Plugin را ببیند:** از `/new`، `/reset` استفاده کنید یا gateway را بازراه‌اندازی کنید. پیوندهای رشته Codex موجود، پیکربندی برنامه‌ای را که با آن شروع شده‌اند نگه می‌دارند تا زمانی که OpenClaw یک نشست مهار جدید برقرار کند یا یک پیوند کهنه را جایگزین کند.

**اقدام مخرب رد می‌شود:** مقدارهای سراسری و مخصوص Plugin برای `allow_destructive_actions` را بررسی کنید. حتی وقتی سیاست true باشد، schema های درخواست ناایمن و هویت مبهم Plugin همچنان بسته شکست می‌خورند.

## مرتبط

- [مهار Codex](/fa/plugins/codex-harness)
- [مرجع مهار Codex](/fa/plugins/codex-harness-reference)
- [محیط اجرای مهار Codex](/fa/plugins/codex-harness-runtime)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/fa/cli/migrate)
