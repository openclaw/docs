---
read_when:
    - می‌خواهید عامل‌های OpenClaw در حالت Codex از Codex Computer Use استفاده کنند
    - شما در حال تصمیم‌گیری بین Codex Computer Use، PeekabooBridge و MCP مستقیم cua-driver هستید
    - شما در حال تصمیم‌گیری بین Codex Computer Use و یک راه‌اندازی مستقیم cua-driver MCP هستید
    - شما در حال پیکربندی computerUse برای Plugin همراه Codex هستید
    - در حال عیب‌یابی وضعیت یا نصب /codex computer-use هستید
summary: راه‌اندازی استفاده از رایانه در Codex برای عامل‌های OpenClaw در حالت Codex
title: استفاده از رایانه در Codex
x-i18n:
    generated_at: "2026-05-03T11:39:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use یک Plugin بومی Codex برای MCP جهت کنترل دسکتاپ محلی است. OpenClaw
برنامه دسکتاپ را در خود بسته‌بندی نمی‌کند، خودش کنش‌های دسکتاپ را اجرا نمی‌کند، یا
مجوزهای Codex را دور نمی‌زند. Plugin همراه `codex` فقط app-server مربوط به Codex را آماده می‌کند:
پشتیبانی Plugin در Codex را فعال می‌کند، Plugin پیکربندی‌شده Codex
Computer Use را پیدا یا نصب می‌کند، بررسی می‌کند که سرور MCP با نام `computer-use` در دسترس باشد، و
سپس اجازه می‌دهد Codex مالک فراخوانی‌های ابزار MCP بومی در طول نوبت‌های حالت Codex باشد.

از این صفحه زمانی استفاده کنید که OpenClaw از قبل از harness بومی Codex استفاده می‌کند. برای
راه‌اندازی خود runtime، [Codex harness](/fa/plugins/codex-harness) را ببینید.

## OpenClaw.app و Peekaboo

یکپارچه‌سازی Peekaboo در OpenClaw.app جدا از Codex Computer Use است. برنامه
macOS می‌تواند یک سوکت PeekabooBridge میزبانی کند تا CLI مربوط به `peekaboo` بتواند مجوزهای محلی
Accessibility و Screen Recording برنامه را برای ابزارهای خودکارسازی Peekaboo بازاستفاده کند. آن bridge نه Codex Computer Use را نصب یا proxy می‌کند، و
نه Codex Computer Use از طریق سوکت PeekabooBridge فراخوانی انجام می‌دهد.

وقتی می‌خواهید OpenClaw.app یک میزبان آگاه از مجوزها برای خودکارسازی Peekaboo CLI باشد، از [Peekaboo bridge](/fa/platforms/mac/peekaboo) استفاده کنید. از این صفحه زمانی استفاده کنید که یک عامل OpenClaw در حالت
Codex باید پیش از شروع نوبت، Plugin بومی MCP با نام `computer-use` متعلق به Codex را
در دسترس داشته باشد.

## برنامه iOS

برنامه iOS جدا از Codex Computer Use است. این برنامه سرور MCP با نام `computer-use` متعلق به Codex را نصب یا proxy نمی‌کند و backend کنترل دسکتاپ نیست.
در عوض، برنامه iOS به‌عنوان یک node در OpenClaw متصل می‌شود و قابلیت‌های موبایل را
از طریق فرمان‌های node مانند `canvas.*`، `camera.*`، `screen.*`،
`location.*`، و `talk.*` در معرض استفاده قرار می‌دهد.

وقتی می‌خواهید یک عامل از طریق gateway یک node آیفون را هدایت کند، از [iOS](/fa/platforms/ios) استفاده کنید. از این صفحه زمانی استفاده کنید که یک عامل در حالت Codex باید دسکتاپ محلی
macOS را از طریق Plugin بومی Computer Use در Codex کنترل کند.

## MCP مستقیم cua-driver

Codex Computer Use تنها راه در معرض گذاشتن کنترل دسکتاپ نیست. اگر می‌خواهید
runtimeهای مدیریت‌شده توسط OpenClaw به‌طور مستقیم driver متعلق به TryCua را فراخوانی کنند، به‌جای جریان marketplace ویژه Codex، از سرور بالادستی
`cua-driver mcp` از طریق registry مربوط به MCP در OpenClaw استفاده کنید.

پس از نصب `cua-driver`، یا فرمان OpenClaw را از آن بخواهید:

```bash
cua-driver mcp-config --client openclaw
```

یا خودتان سرور stdio را ثبت کنید:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

این مسیر سطح ابزار MCP بالادستی، از جمله schemaهای driver و پاسخ‌های ساختاریافته MCP را دست‌نخورده نگه می‌دارد. وقتی می‌خواهید CUA driver به‌عنوان یک سرور عادی OpenClaw MCP
در دسترس باشد، از آن استفاده کنید. وقتی Codex app-server باید مالک نصب Plugin، reloadهای MCP،
و فراخوانی‌های ابزار بومی داخل نوبت‌های حالت Codex باشد، از راه‌اندازی Codex Computer Use در
این صفحه استفاده کنید.

driver مربوط به CUA ویژه macOS است و همچنان به مجوزهای محلی macOS
که برنامه‌اش درخواست می‌کند، مانند Accessibility و Screen Recording، نیاز دارد. OpenClaw
`cua-driver` را نصب نمی‌کند، آن مجوزها را اعطا نمی‌کند، یا مدل ایمنی driver بالادستی را دور نمی‌زند.

## راه‌اندازی سریع

وقتی نوبت‌های حالت Codex باید پیش از شروع یک رشته، Computer Use را در دسترس داشته باشند، `plugins.entries.codex.config.computerUse` را تنظیم کنید:

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

با این پیکربندی، OpenClaw پیش از هر نوبت حالت Codex، Codex app-server را بررسی می‌کند.
اگر Computer Use موجود نباشد اما Codex app-server از قبل یک marketplace قابل نصب را کشف کرده باشد، OpenClaw از Codex app-server می‌خواهد Plugin را نصب یا دوباره فعال کند و سرورهای MCP را reload کند. در macOS، وقتی هیچ marketplace مطابقی
ثبت نشده باشد و بسته استاندارد برنامه Codex وجود داشته باشد، OpenClaw همچنین تلاش می‌کند
marketplace همراه Codex را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند، پیش از آنکه
با شکست مواجه شود. اگر راه‌اندازی همچنان نتواند سرور MCP را در دسترس قرار دهد، نوبت
پیش از شروع رشته شکست می‌خورد.

sessionهای موجود runtime و binding رشته Codex خود را نگه می‌دارند. پس از تغییر
`agentRuntime` یا پیکربندی Computer Use، پیش از آزمایش در گفت‌وگوی متاثر از `/new` یا `/reset` استفاده کنید.

## فرمان‌ها

از فرمان‌های `/codex computer-use` در هر سطح گفت‌وگویی استفاده کنید که سطح فرمان Plugin
`codex` در آن در دسترس است. این‌ها فرمان‌های گفت‌وگو/runtime در OpenClaw هستند،
نه زیرفرمان‌های CLI به شکل `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` فقط خواندنی است. منبع marketplace اضافه نمی‌کند، Plugin نصب نمی‌کند، یا
پشتیبانی Plugin در Codex را فعال نمی‌کند.

`install` پشتیبانی Plugin در Codex app-server را فعال می‌کند، در صورت نیاز یک منبع
marketplace پیکربندی‌شده اضافه می‌کند، Plugin پیکربندی‌شده را از طریق Codex
app-server نصب یا دوباره فعال می‌کند، سرورهای MCP را reload می‌کند، و بررسی می‌کند که سرور MCP ابزارها را در معرض استفاده قرار دهد.

## انتخاب‌های marketplace

OpenClaw از همان API مربوط به app-server استفاده می‌کند که خود Codex در معرض استفاده قرار می‌دهد. فیلدهای
marketplace تعیین می‌کنند Codex باید `computer-use` را کجا پیدا کند.

| فیلد                 | زمان استفاده                                                        | پشتیبانی نصب                                           |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| بدون فیلد marketplace | می‌خواهید Codex app-server از marketplaceهایی استفاده کند که از قبل می‌شناسد. | بله، وقتی app-server یک marketplace محلی برگرداند.        |
| `marketplaceSource`  | یک منبع marketplace مربوط به Codex دارید که app-server می‌تواند اضافه کند.         | بله، برای `/codex computer-use install` صریح.         |
| `marketplacePath`    | از قبل مسیر فایل marketplace محلی روی میزبان را می‌دانید.   | بله، برای نصب صریح و نصب خودکار هنگام شروع نوبت.   |
| `marketplaceName`    | می‌خواهید یک marketplace از قبل ثبت‌شده را با نام انتخاب کنید.  | فقط وقتی marketplace انتخاب‌شده مسیر محلی داشته باشد. |

خانه‌های تازه Codex ممکن است برای seed کردن marketplaceهای رسمی خود به لحظه کوتاهی نیاز داشته باشند.
در هنگام نصب، OpenClaw تا
`marketplaceDiscoveryTimeoutMs` میلی‌ثانیه `plugin/list` را poll می‌کند. مقدار پیش‌فرض ۶۰ ثانیه است.

اگر چند marketplace شناخته‌شده شامل Computer Use باشند، OpenClaw ابتدا
`openai-bundled`، سپس `openai-curated`، و سپس `local` را ترجیح می‌دهد. تطابق‌های مبهم ناشناخته
به‌صورت fail closed متوقف می‌شوند و از شما می‌خواهند `marketplaceName` یا `marketplacePath` را تنظیم کنید.

## marketplace همراه macOS

buildهای اخیر دسکتاپ Codex، Computer Use را اینجا همراه خود دارند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

وقتی `computerUse.autoInstall` برابر true باشد و هیچ marketplace شامل
`computer-use` ثبت نشده باشد، OpenClaw تلاش می‌کند root استاندارد marketplace همراه را
به‌طور خودکار اضافه کند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

همچنین می‌توانید آن را به‌صورت صریح از shell با Codex ثبت کنید:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

اگر از مسیر غیر استاندارد برنامه Codex استفاده می‌کنید، `computerUse.marketplacePath` را روی یک
مسیر فایل marketplace محلی تنظیم کنید یا یک‌بار `/codex computer-use install --source
<marketplace-source>` را اجرا کنید.

## محدودیت catalog راه‌دور

Codex app-server می‌تواند entryهای catalog فقط-راه‌دور را فهرست و read کند، اما در حال حاضر
از `plugin/install` راه‌دور پشتیبانی نمی‌کند. یعنی `marketplaceName` می‌تواند
یک marketplace فقط-راه‌دور را برای بررسی‌های status انتخاب کند، اما نصب‌ها و فعال‌سازی‌های دوباره
هنوز از طریق `marketplaceSource` یا `marketplacePath` به یک marketplace محلی نیاز دارند.

اگر status می‌گوید Plugin در یک marketplace راه‌دور Codex در دسترس است اما نصب راه‌دور
پشتیبانی نمی‌شود، install را با یک source یا path محلی اجرا کنید:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع پیکربندی

| فیلد                            | پیش‌فرض        | معنی                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use را الزامی می‌کند. وقتی فیلد دیگری از Computer Use تنظیم شده باشد، به‌طور پیش‌فرض true است. |
| `autoInstall`                   | false          | از marketplaceهای از قبل کشف‌شده در شروع نوبت نصب یا دوباره فعال می‌کند.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدت زمانی که install منتظر کشف marketplace توسط Codex app-server می‌ماند.             |
| `marketplaceSource`             | unset          | رشته source که به `marketplace/add` در Codex app-server داده می‌شود.                    |
| `marketplacePath`               | unset          | مسیر فایل marketplace محلی Codex که شامل Plugin است.                       |
| `marketplaceName`               | unset          | نام marketplace ثبت‌شده Codex برای انتخاب.                                   |
| `pluginName`                    | `computer-use` | نام Plugin در marketplace مربوط به Codex.                                                 |
| `mcpServerName`                 | `computer-use` | نام سرور MCP که توسط Plugin نصب‌شده در معرض استفاده قرار می‌گیرد.                               |

نصب خودکار هنگام شروع نوبت عمدا مقدارهای پیکربندی‌شده `marketplaceSource` را رد می‌کند.
افزودن یک source جدید یک عملیات راه‌اندازی صریح است، پس یک‌بار از
`/codex computer-use install --source <marketplace-source>` استفاده کنید، سپس بگذارید
`autoInstall` فعال‌سازی‌های دوباره آینده را از marketplaceهای محلی کشف‌شده مدیریت کند.
نصب خودکار هنگام شروع نوبت می‌تواند از `marketplacePath` پیکربندی‌شده استفاده کند، چون آن
از قبل یک path محلی روی میزبان است.

## آنچه OpenClaw بررسی می‌کند

OpenClaw یک دلیل راه‌اندازی پایدار را به‌صورت داخلی گزارش می‌کند و status قابل مشاهده برای کاربر را
برای گفت‌وگو قالب‌بندی می‌کند:

| دلیل                        | معنی                                                 | گام بعدی                                      |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` به false resolve شده است.               | `enabled` یا فیلد دیگری از Computer Use را تنظیم کنید.  |
| `marketplace_missing`        | هیچ marketplace مطابقی در دسترس نبود.                 | source، path، یا نام marketplace را پیکربندی کنید.  |
| `plugin_not_installed`       | marketplace وجود دارد، اما Plugin نصب نشده است.   | install را اجرا کنید یا `autoInstall` را فعال کنید.          |
| `plugin_disabled`            | Plugin نصب شده اما در پیکربندی Codex غیرفعال است.      | install را اجرا کنید تا دوباره فعال شود.                  |
| `remote_install_unsupported` | marketplace انتخاب‌شده فقط-راه‌دور است.                   | از `marketplaceSource` یا `marketplacePath` استفاده کنید. |
| `mcp_missing`                | Plugin فعال است، اما سرور MCP در دسترس نیست.  | Codex Computer Use و مجوزهای OS را بررسی کنید.  |
| `ready`                      | Plugin و ابزارهای MCP در دسترس هستند.                    | نوبت حالت Codex را شروع کنید.                    |
| `check_failed`               | یک درخواست به Codex app-server در طول بررسی status شکست خورد. | اتصال app-server و logها را بررسی کنید.       |
| `auto_install_blocked`       | راه‌اندازی هنگام شروع نوبت باید یک source جدید اضافه می‌کرد.       | ابتدا install صریح را اجرا کنید.                   |

خروجی گفت‌وگو شامل وضعیت Plugin، وضعیت سرور MCP، marketplace، ابزارها
در صورت دسترس بودن، و پیام مشخص برای گام راه‌اندازی ناموفق است.

## مجوزهای macOS

Computer Use ویژه macOS است. سرور MCP تحت مالکیت Codex ممکن است پیش از اینکه بتواند appها را inspect یا کنترل کند، به مجوزهای محلی OS نیاز داشته باشد. اگر OpenClaw می‌گوید Computer Use
نصب شده اما سرور MCP در دسترس نیست، ابتدا راه‌اندازی Computer Use در سمت Codex را بررسی کنید:

- Codex app-server روی همان میزبانی اجرا می‌شود که کنترل دسکتاپ باید
  انجام شود.
- Plugin Computer Use در پیکربندی Codex فعال است.
- سرور MCP مربوط به `computer-use` در وضعیت MCP برای Codex app-server دیده می‌شود.
- macOS مجوزهای لازم را برای برنامه کنترل دسکتاپ داده است.
- نشست فعلی میزبان می‌تواند به دسکتاپی که کنترل می‌شود دسترسی داشته باشد.

OpenClaw وقتی `computerUse.enabled` برابر true باشد، عمداً به‌صورت بسته شکست می‌خورد. یک
نوبت در حالت Codex نباید بی‌سروصدا بدون ابزارهای بومی دسکتاپ
که پیکربندی الزام کرده است ادامه پیدا کند.

## عیب‌یابی

**وضعیت می‌گوید نصب نشده است.** `/codex computer-use install` را اجرا کنید. اگر
marketplace کشف نشد، `--source` یا `--marketplace-path` را پاس بدهید.

**وضعیت می‌گوید نصب شده اما غیرفعال است.** دوباره `/codex computer-use install` را اجرا کنید.
نصب Codex app-server پیکربندی Plugin را دوباره به حالت فعال می‌نویسد.

**وضعیت می‌گوید نصب از راه دور پشتیبانی نمی‌شود.** از یک منبع یا
مسیر marketplace محلی استفاده کنید. ورودی‌های کاتالوگ فقط‌ازراه‌دور را می‌توان بررسی کرد اما از طریق
API فعلی app-server نصب کردنی نیستند.

**وضعیت می‌گوید سرور MCP در دسترس نیست.** یک‌بار دیگر نصب را اجرا کنید تا سرورهای MCP
دوباره بارگذاری شوند. اگر همچنان در دسترس نبود، برنامه Codex Computer Use،
وضعیت MCP در Codex app-server، یا مجوزهای macOS را اصلاح کنید.

**وضعیت یا یک آزمون روی `computer-use.list_apps` زمان‌بر می‌شود و منقضی می‌گردد.** Plugin و سرور MCP
حاضر هستند، اما پل محلی Computer Use پاسخ نداده است. Codex Computer Use را ببندید یا
راه‌اندازی مجدد کنید، در صورت نیاز Codex Desktop را دوباره اجرا کنید، سپس در یک
نشست تازه OpenClaw دوباره تلاش کنید.

**یک ابزار Computer Use می‌گوید `Native hook relay unavailable`.** قلاب ابزار بومی Codex
نتوانسته از طریق پل محلی یا مسیر جایگزین Gateway به یک رله فعال OpenClaw برسد.
با `/new` یا `/reset` یک نشست تازه OpenClaw شروع کنید. اگر این
ادامه داشت، gateway را راه‌اندازی مجدد کنید تا رشته‌های قدیمی app-server و ثبت‌های hook
حذف شوند، سپس دوباره تلاش کنید.

**نصب خودکار ابتدای نوبت یک منبع را رد می‌کند.** این عمدی است. ابتدا
منبع را با `/codex computer-use install --source <marketplace-source>` صریح اضافه کنید،
سپس نصب خودکار ابتدای نوبت در آینده می‌تواند از marketplace محلی کشف‌شده استفاده کند.
