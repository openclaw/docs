---
read_when:
    - می‌خواهید عامل‌های OpenClaw در حالت Codex از Codex Computer Use استفاده کنند
    - شما در حال تصمیم‌گیری بین Codex Computer Use، PeekabooBridge و cua-driver MCP مستقیم هستید
    - شما در حال انتخاب بین Codex Computer Use و یک راه‌اندازی مستقیم cua-driver MCP هستید
    - در حال پیکربندی computerUse برای Plugin همراه Codex هستید
    - شما در حال عیب‌یابی وضعیت یا نصب /codex computer-use هستید
summary: استفاده از رایانه Codex را برای عامل‌های OpenClaw در حالت Codex راه‌اندازی کنید
title: استفاده از رایانه در Codex
x-i18n:
    generated_at: "2026-05-10T19:52:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use یک Plugin بومی Codex برای MCP جهت کنترل دسکتاپ محلی است. OpenClaw
برنامه دسکتاپ را در خود جا نمی‌دهد، خودش کنش‌های دسکتاپ را اجرا نمی‌کند، یا
مجوزهای Codex را دور نمی‌زند. Plugin همراه `codex` فقط app-server مربوط به Codex را آماده می‌کند:
پشتیبانی Plugin در Codex را فعال می‌کند، Plugin پیکربندی‌شده Codex
Computer Use را پیدا یا نصب می‌کند، بررسی می‌کند که سرور MCP با نام `computer-use` در دسترس باشد، و
سپس اجازه می‌دهد Codex مالک فراخوانی‌های بومی ابزار MCP در طول نوبت‌های حالت Codex باشد.

وقتی OpenClaw از قبل از harness بومی Codex استفاده می‌کند، از این صفحه استفاده کنید. برای
خود راه‌اندازی runtime، [Codex harness](/fa/plugins/codex-harness) را ببینید.

## OpenClaw.app و Peekaboo

یکپارچگی Peekaboo در OpenClaw.app جدا از Codex Computer Use است. برنامه
macOS می‌تواند یک سوکت PeekabooBridge میزبانی کند تا CLI مربوط به `peekaboo` بتواند از مجوزهای محلی
Accessibility و Screen Recording برنامه برای ابزارهای خودکارسازی خود Peekaboo دوباره استفاده کند.
این پل Codex Computer Use را نصب یا proxy نمی‌کند، و
Codex Computer Use از طریق سوکت PeekabooBridge فراخوانی نمی‌شود.

وقتی می‌خواهید OpenClaw.app یک میزبان آگاه از مجوز برای خودکارسازی Peekaboo CLI باشد، از
[Peekaboo bridge](/fa/platforms/mac/peekaboo) استفاده کنید. وقتی یک عامل OpenClaw در حالت
Codex باید پیش از شروع نوبت، Plugin بومی MCP با نام `computer-use` متعلق به Codex را
در دسترس داشته باشد، از این صفحه استفاده کنید.

## برنامه iOS

برنامه iOS جدا از Codex Computer Use است. این برنامه سرور MCP مربوط به Codex با نام
`computer-use` را نصب یا proxy نمی‌کند و backend کنترل دسکتاپ نیست.
در عوض، برنامه iOS به‌عنوان یک گره OpenClaw متصل می‌شود و قابلیت‌های موبایل را
از طریق دستورهای گره مانند `canvas.*`، `camera.*`، `screen.*`،
`location.*`، و `talk.*` ارائه می‌کند.

وقتی می‌خواهید یک عامل یک گره iPhone را از طریق gateway هدایت کند، از
[iOS](/fa/platforms/ios) استفاده کنید. وقتی یک عامل در حالت Codex باید دسکتاپ محلی
macOS را از طریق Plugin بومی Computer Use متعلق به Codex کنترل کند، از این صفحه استفاده کنید.

## MCP مستقیم cua-driver

Codex Computer Use تنها راه ارائه کنترل دسکتاپ نیست. اگر می‌خواهید
runtimeهای مدیریت‌شده توسط OpenClaw مستقیماً driver مربوط به TryCua را فراخوانی کنند، به‌جای
جریان marketplace مخصوص Codex، از سرور بالادستی `cua-driver mcp` از طریق registry
MCP در OpenClaw استفاده کنید.

پس از نصب `cua-driver`، یا دستور OpenClaw را از آن بخواهید:

```bash
cua-driver mcp-config --client openclaw
```

یا سرور stdio را خودتان ثبت کنید:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

این مسیر سطح ابزار MCP بالادستی را، شامل schemaهای driver و پاسخ‌های ساختاریافته MCP،
دست‌نخورده نگه می‌دارد. وقتی می‌خواهید driver مربوط به CUA به‌عنوان یک سرور معمولی MCP در
OpenClaw در دسترس باشد، از آن استفاده کنید. وقتی app-server مربوط به Codex باید مالک نصب Plugin،
بارگذاری دوباره MCP، و فراخوانی‌های بومی ابزار داخل نوبت‌های حالت Codex باشد، از راه‌اندازی
Codex Computer Use در این صفحه استفاده کنید.

driver مربوط به CUA مخصوص macOS است و همچنان به مجوزهای محلی macOS نیاز دارد
که برنامه‌اش درخواست می‌کند، مانند Accessibility و Screen Recording. OpenClaw
`cua-driver` را نصب نمی‌کند، آن مجوزها را اعطا نمی‌کند، یا مدل ایمنی driver بالادستی را دور نمی‌زند.

## راه‌اندازی سریع

وقتی نوبت‌های حالت Codex باید پیش از شروع یک thread، Computer Use را در دسترس داشته باشند،
`plugins.entries.codex.config.computerUse` را تنظیم کنید:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

با این پیکربندی، OpenClaw پیش از هر نوبت حالت Codex، app-server مربوط به Codex را بررسی می‌کند.
اگر Computer Use موجود نباشد اما app-server مربوط به Codex از قبل یک marketplace قابل نصب را
کشف کرده باشد، OpenClaw از app-server مربوط به Codex می‌خواهد Plugin را نصب یا دوباره فعال کند
و سرورهای MCP را دوباره بارگذاری کند. در macOS، وقتی هیچ marketplace مطابقی
ثبت نشده باشد و bundle استاندارد برنامه Codex وجود داشته باشد، OpenClaw همچنین تلاش می‌کند
marketplace همراه Codex را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند، پیش از آنکه
با شکست مواجه شود. اگر راه‌اندازی همچنان نتواند سرور MCP را در دسترس کند، نوبت
پیش از شروع thread شکست می‌خورد.

پس از تغییر پیکربندی Computer Use، اگر یک thread موجود Codex از قبل شروع شده است،
پیش از آزمایش از `/new` یا `/reset` در گفتگوی تحت تأثیر استفاده کنید.

## دستورها

از دستورهای `/codex computer-use` در هر سطح گفتگویی که سطح دستور Plugin مربوط به `codex`
در دسترس است استفاده کنید. این‌ها دستورهای chat/runtime در OpenClaw هستند،
نه زیر‌دستورهای CLI با قالب `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` فقط خواندنی است. منبع marketplace اضافه نمی‌کند، Plugin نصب نمی‌کند، یا
پشتیبانی Plugin در Codex را فعال نمی‌کند.

`install` پشتیبانی Plugin در app-server مربوط به Codex را فعال می‌کند، در صورت نیاز یک منبع
marketplace پیکربندی‌شده اضافه می‌کند، Plugin پیکربندی‌شده را از طریق app-server مربوط به Codex
نصب یا دوباره فعال می‌کند، سرورهای MCP را دوباره بارگذاری می‌کند، و تأیید می‌کند که سرور MCP
ابزارها را ارائه می‌دهد.

## گزینه‌های marketplace

OpenClaw از همان API مربوط به app-server استفاده می‌کند که خود Codex ارائه می‌کند. فیلدهای
marketplace مشخص می‌کنند Codex باید `computer-use` را از کجا پیدا کند.

| فیلد                | زمان استفاده                                                        | پشتیبانی نصب                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| بدون فیلد marketplace | می‌خواهید app-server مربوط به Codex از marketplaceهایی استفاده کند که از قبل می‌شناسد. | بله، وقتی app-server یک marketplace محلی برمی‌گرداند.        |
| `marketplaceSource`  | یک منبع marketplace مربوط به Codex دارید که app-server می‌تواند اضافه کند.         | بله، برای `/codex computer-use install` صریح.         |
| `marketplacePath`    | از قبل مسیر فایل marketplace محلی روی میزبان را می‌دانید.   | بله، برای نصب صریح و نصب خودکار هنگام شروع نوبت.   |
| `marketplaceName`    | می‌خواهید یک marketplace از پیش ثبت‌شده را با نام انتخاب کنید.  | فقط وقتی marketplace انتخاب‌شده مسیر محلی دارد، بله. |

خانه‌های تازه Codex ممکن است به لحظه کوتاهی برای seed کردن marketplaceهای رسمی خود نیاز داشته باشند.
در طول نصب، OpenClaw تا
`marketplaceDiscoveryTimeoutMs` میلی‌ثانیه `plugin/list` را poll می‌کند. مقدار پیش‌فرض ۶۰ ثانیه است.

اگر چند marketplace شناخته‌شده شامل Computer Use باشند، OpenClaw ابتدا
`openai-bundled`، سپس `openai-curated`، و سپس `local` را ترجیح می‌دهد. تطابق‌های مبهم ناشناخته
به‌صورت fail-closed شکست می‌خورند و از شما می‌خواهند `marketplaceName` یا `marketplacePath` را تنظیم کنید.

## marketplace همراه macOS

buildهای اخیر دسکتاپ Codex، Computer Use را در اینجا همراه دارند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

وقتی `computerUse.autoInstall` برابر true باشد و هیچ marketplace شامل
`computer-use` ثبت نشده باشد، OpenClaw تلاش می‌کند ریشه marketplace همراه استاندارد را
به‌صورت خودکار اضافه کند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

همچنین می‌توانید آن را از shell با Codex به‌طور صریح ثبت کنید:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

اگر از مسیر غیر‌استاندارد برنامه Codex استفاده می‌کنید، `computerUse.marketplacePath` را روی یک
مسیر فایل marketplace محلی تنظیم کنید یا یک‌بار `/codex computer-use install --source
<marketplace-source>` را اجرا کنید.

## محدودیت catalog راه دور

app-server مربوط به Codex می‌تواند ورودی‌های catalog فقط‌راه‌دور را فهرست کند و بخواند، اما در حال حاضر
از `plugin/install` راه دور پشتیبانی نمی‌کند. یعنی `marketplaceName` می‌تواند
یک marketplace فقط‌راه‌دور را برای بررسی‌های status انتخاب کند، اما نصب‌ها و فعال‌سازی‌های دوباره
همچنان به یک marketplace محلی از طریق `marketplaceSource` یا `marketplacePath` نیاز دارند.

اگر status می‌گوید Plugin در یک marketplace راه دور Codex در دسترس است اما نصب راه دور
پشتیبانی نمی‌شود، نصب را با یک منبع یا مسیر محلی اجرا کنید:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع پیکربندی

| فیلد                           | پیش‌فرض        | معنا                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | استنباط‌شده       | نیازمندی Computer Use. وقتی فیلد دیگری از Computer Use تنظیم شده باشد، پیش‌فرض true است. |
| `autoInstall`                   | false          | نصب یا فعال‌سازی دوباره از marketplaceهای از قبل کشف‌شده هنگام شروع نوبت.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدت زمانی که نصب منتظر کشف marketplace در app-server مربوط به Codex می‌ماند.             |
| `marketplaceSource`             | تنظیم‌نشده          | رشته منبعی که به `marketplace/add` در app-server مربوط به Codex پاس داده می‌شود.                    |
| `marketplacePath`               | تنظیم‌نشده          | مسیر فایل marketplace محلی Codex که شامل Plugin است.                       |
| `marketplaceName`               | تنظیم‌نشده          | نام marketplace ثبت‌شده Codex برای انتخاب.                                   |
| `pluginName`                    | `computer-use` | نام Plugin در marketplace مربوط به Codex.                                                 |
| `mcpServerName`                 | `computer-use` | نام سرور MCP که توسط Plugin نصب‌شده ارائه می‌شود.                               |

نصب خودکار هنگام شروع نوبت عمداً مقدارهای پیکربندی‌شده `marketplaceSource` را رد می‌کند.
افزودن یک منبع جدید یک عملیات راه‌اندازی صریح است، بنابراین یک‌بار از
`/codex computer-use install --source <marketplace-source>` استفاده کنید، سپس اجازه دهید
`autoInstall` فعال‌سازی‌های دوباره آینده را از marketplaceهای محلی کشف‌شده انجام دهد.
نصب خودکار هنگام شروع نوبت می‌تواند از `marketplacePath` پیکربندی‌شده استفاده کند، چون آن
از قبل یک مسیر محلی روی میزبان است.

## آنچه OpenClaw بررسی می‌کند

OpenClaw یک دلیل پایدار راه‌اندازی را به‌صورت داخلی گزارش می‌کند و status کاربرپسند را
برای گفتگو قالب‌بندی می‌کند:

| دلیل                       | معنا                                                | گام بعدی                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` به false resolve شده است.               | `enabled` یا یک فیلد دیگر از Computer Use را تنظیم کنید.  |
| `marketplace_missing`        | هیچ marketplace مطابقی در دسترس نبود.                 | منبع، مسیر، یا نام marketplace را پیکربندی کنید.  |
| `plugin_not_installed`       | marketplace وجود دارد، اما Plugin نصب نشده است.   | install را اجرا کنید یا `autoInstall` را فعال کنید.          |
| `plugin_disabled`            | Plugin نصب شده اما در پیکربندی Codex غیرفعال است.      | install را برای فعال‌سازی دوباره آن اجرا کنید.                  |
| `remote_install_unsupported` | marketplace انتخاب‌شده فقط‌راه‌دور است.                   | از `marketplaceSource` یا `marketplacePath` استفاده کنید. |
| `mcp_missing`                | Plugin فعال است، اما سرور MCP در دسترس نیست.  | Codex Computer Use و مجوزهای OS را بررسی کنید.  |
| `ready`                      | Plugin و ابزارهای MCP در دسترس هستند.                    | نوبت حالت Codex را شروع کنید.                    |
| `check_failed`               | یک درخواست app-server مربوط به Codex هنگام بررسی status شکست خورد. | اتصال و لاگ‌های app-server را بررسی کنید.       |
| `auto_install_blocked`       | راه‌اندازی هنگام شروع نوبت نیازمند افزودن یک منبع جدید است.       | ابتدا install صریح را اجرا کنید.                   |

خروجی گفتگو شامل وضعیت Plugin، وضعیت سرور MCP، marketplace، ابزارها
در صورت موجود بودن، و پیام مشخص برای گام راه‌اندازی ناموفق است.

## مجوزهای macOS

Computer Use مخصوص macOS است. سرور MCP تحت مالکیت Codex ممکن است پیش از آنکه بتواند
برنامه‌ها را بررسی یا کنترل کند، به مجوزهای محلی OS نیاز داشته باشد. اگر OpenClaw می‌گوید Computer Use
نصب شده اما سرور MCP در دسترس نیست، ابتدا راه‌اندازی Computer Use در سمت Codex را بررسی کنید:

- سرور برنامه Codex روی همان میزبانی اجرا می‌شود که کنترل دسکتاپ باید
  در آن انجام شود.
- Plugin مربوط به Computer Use در پیکربندی Codex فعال است.
- سرور MCP با نام `computer-use` در وضعیت MCP سرور برنامه Codex ظاهر می‌شود.
- macOS مجوزهای لازم را برای برنامه کنترل دسکتاپ اعطا کرده است.
- نشست فعلی میزبان می‌تواند به دسکتاپی که کنترل می‌شود دسترسی داشته باشد.

OpenClaw وقتی `computerUse.enabled` برابر true باشد، عمدا به‌صورت بسته شکست می‌خورد. یک
نوبت در حالت Codex نباید بدون ابزارهای بومی دسکتاپ که پیکربندی الزامی کرده است
بی‌سروصدا ادامه پیدا کند.

## عیب‌یابی

**وضعیت می‌گوید نصب نشده است.** `/codex computer-use install` را اجرا کنید. اگر
marketplace شناسایی نشد، `--source` یا `--marketplace-path` را بدهید.

**وضعیت می‌گوید نصب شده اما غیرفعال است.** دوباره `/codex computer-use install` را اجرا کنید.
نصب سرور برنامه Codex پیکربندی Plugin را دوباره به حالت فعال می‌نویسد.

**وضعیت می‌گوید نصب از راه دور پشتیبانی نمی‌شود.** از یک منبع یا
مسیر محلی marketplace استفاده کنید. ورودی‌های کاتالوگ فقط-از-راه-دور را می‌توان بررسی کرد اما از طریق
API فعلی سرور برنامه نصب نمی‌شوند.

**وضعیت می‌گوید سرور MCP در دسترس نیست.** نصب را یک بار دیگر اجرا کنید تا
سرورهای MCP دوباره بارگذاری شوند. اگر همچنان در دسترس نبود، برنامه Codex Computer Use،
وضعیت MCP سرور برنامه Codex، یا مجوزهای macOS را اصلاح کنید.

**وضعیت یا یک بررسی روی `computer-use.list_apps` زمان‌بر و منقضی می‌شود.** Plugin و سرور MCP
حاضر هستند، اما پل محلی Computer Use پاسخ نداد. Codex Computer Use را ببندید یا
راه‌اندازی مجدد کنید، در صورت نیاز Codex Desktop را دوباره اجرا کنید، سپس در یک
نشست تازه OpenClaw دوباره تلاش کنید.

**یک ابزار Computer Use می‌گوید `Native hook relay unavailable`.** قلاب ابزار بومی Codex
نتوانست از طریق پل محلی یا مسیر جایگزین Gateway به یک رله فعال OpenClaw برسد.
یک نشست تازه OpenClaw را با `/new` یا `/reset` شروع کنید. اگر این وضعیت
ادامه داشت، Gateway را راه‌اندازی مجدد کنید تا رشته‌های قدیمی سرور برنامه و
ثبت‌نام‌های قلاب حذف شوند، سپس دوباره تلاش کنید.

**نصب خودکار ابتدای نوبت یک منبع را رد می‌کند.** این عمدی است. ابتدا منبع را
با دستور صریح `/codex computer-use install --source <marketplace-source>` اضافه کنید،
سپس نصب خودکار ابتدای نوبت در آینده می‌تواند از marketplace محلی کشف‌شده استفاده کند.

## مرتبط

- [چارچوب اجرایی Codex](/fa/plugins/codex-harness)
- [پل Peekaboo](/fa/platforms/mac/peekaboo)
- [برنامه iOS](/fa/platforms/ios)
