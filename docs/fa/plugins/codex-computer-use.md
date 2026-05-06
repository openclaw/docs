---
read_when:
    - می‌خواهید عامل‌های OpenClaw در حالت Codex از Codex Computer Use استفاده کنند
    - شما در حال انتخاب بین Codex Computer Use، PeekabooBridge و MCP مستقیمِ cua-driver هستید
    - شما در حال انتخاب بین Codex Computer Use و یک راه‌اندازی مستقیم cua-driver MCP هستید
    - شما در حال پیکربندی computerUse برای Plugin همراه Codex هستید
    - در حال عیب‌یابی وضعیت یا نصب /codex computer-use هستید
summary: راه‌اندازی Codex Computer Use برای عامل‌های OpenClaw در حالت Codex
title: استفاده از رایانه در Codex
x-i18n:
    generated_at: "2026-05-06T09:32:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use یک Plugin بومی Codex برای MCP جهت کنترل دسکتاپ محلی است. OpenClaw
برنامه دسکتاپ را vend نمی‌کند، خودش اقدام‌های دسکتاپ را اجرا نمی‌کند، یا
مجوزهای Codex را دور نمی‌زند. Plugin همراه `codex` فقط Codex app-server را آماده می‌کند:
پشتیبانی Plugin در Codex را فعال می‌کند، Plugin پیکربندی‌شده Codex
Computer Use را پیدا یا نصب می‌کند، بررسی می‌کند که سرور MCP به نام `computer-use` در دسترس باشد، و
سپس اجازه می‌دهد Codex مالک فراخوانی‌های ابزار MCP بومی در طول نوبت‌های حالت Codex باشد.

از این صفحه زمانی استفاده کنید که OpenClaw از قبل از harness بومی Codex استفاده می‌کند. برای
راه‌اندازی خود runtime، [Codex harness](/fa/plugins/codex-harness) را ببینید.

## OpenClaw.app و Peekaboo

یکپارچگی Peekaboo در OpenClaw.app از Codex Computer Use جدا است. برنامه
macOS می‌تواند یک socket به نام PeekabooBridge میزبانی کند تا CLI به نام `peekaboo` بتواند از
مجوزهای محلی Accessibility و Screen Recording برنامه برای ابزارهای
اتوماسیون خود Peekaboo استفاده مجدد کند. آن bridge، Codex Computer Use را نصب یا پراکسی نمی‌کند، و
Codex Computer Use از طریق socket به نام PeekabooBridge فراخوانی نمی‌شود.

وقتی می‌خواهید OpenClaw.app میزبان آگاه از مجوز برای اتوماسیون Peekaboo CLI باشد، از
[Peekaboo bridge](/fa/platforms/mac/peekaboo) استفاده کنید. وقتی یک agent در حالت
Codex باید پیش از شروع نوبت، Plugin بومی MCP به نام `computer-use` در Codex را
در دسترس داشته باشد، از این صفحه استفاده کنید.

## برنامه iOS

برنامه iOS از Codex Computer Use جدا است. این برنامه سرور MCP به نام
`computer-use` در Codex را نصب یا پراکسی نمی‌کند و backend کنترل دسکتاپ نیست.
در عوض، برنامه iOS به‌عنوان یک node در OpenClaw متصل می‌شود و قابلیت‌های موبایل را
از طریق فرمان‌های node مانند `canvas.*`، `camera.*`، `screen.*`،
`location.*`، و `talk.*` ارائه می‌کند.

وقتی می‌خواهید یک agent از طریق Gateway یک node آیفون را هدایت کند، از
[iOS](/fa/platforms/ios) استفاده کنید. وقتی یک agent در حالت Codex باید دسکتاپ محلی
macOS را از طریق Plugin بومی Computer Use در Codex کنترل کند، از این صفحه استفاده کنید.

## MCP مستقیم cua-driver

Codex Computer Use تنها راه ارائه کنترل دسکتاپ نیست. اگر می‌خواهید
runtimeهای مدیریت‌شده توسط OpenClaw مستقیما driver شرکت TryCua را فراخوانی کنند، به‌جای جریان
marketplace اختصاصی Codex، از سرور upstream به نام `cua-driver mcp` از طریق
registry MCP در OpenClaw استفاده کنید.

پس از نصب `cua-driver`، یا فرمان OpenClaw را از آن بخواهید:

```bash
cua-driver mcp-config --client openclaw
```

یا خودتان سرور stdio را ثبت کنید:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

این مسیر سطح ابزار upstream MCP را دست‌نخورده نگه می‌دارد، از جمله schemaهای driver
و پاسخ‌های ساخت‌یافته MCP. وقتی می‌خواهید driver CUA به‌عنوان یک سرور MCP عادی
OpenClaw در دسترس باشد، از آن استفاده کنید. وقتی Codex app-server باید نصب Plugin،
reloadهای MCP، و فراخوانی‌های ابزار بومی درون نوبت‌های حالت Codex را مالکیت کند، از
راه‌اندازی Codex Computer Use در این صفحه استفاده کنید.

driver مربوط به CUA مختص macOS است و همچنان به مجوزهای محلی macOS
که برنامه آن درخواست می‌کند، مانند Accessibility و Screen Recording، نیاز دارد. OpenClaw
`cua-driver` را نصب نمی‌کند، آن مجوزها را اعطا نمی‌کند، یا مدل ایمنی driver upstream را دور نمی‌زند.

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
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

با این config، OpenClaw پیش از هر نوبت حالت Codex، Codex app-server را بررسی می‌کند.
اگر Computer Use وجود نداشته باشد اما Codex app-server از قبل یک marketplace قابل نصب
پیدا کرده باشد، OpenClaw از Codex app-server می‌خواهد Plugin را نصب یا دوباره فعال کند
و سرورهای MCP را reload کند. در macOS، وقتی هیچ marketplace منطبقی ثبت نشده باشد
و bundle استاندارد برنامه Codex وجود داشته باشد، OpenClaw همچنین تلاش می‌کند
marketplace همراه Codex را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند، پیش از آنکه
با شکست روبه‌رو شود. اگر راه‌اندازی همچنان نتواند سرور MCP را در دسترس قرار دهد، نوبت
پیش از شروع thread شکست می‌خورد.

sessionهای موجود runtime و binding thread خود در Codex را حفظ می‌کنند. پس از تغییر
`agentRuntime` یا config مربوط به Computer Use، پیش از آزمایش در چت تحت تاثیر، از
`/new` یا `/reset` استفاده کنید.

## فرمان‌ها

از فرمان‌های `/codex computer-use` در هر سطح چتی استفاده کنید که سطح فرمان Plugin
`codex` در آن در دسترس است. این‌ها فرمان‌های chat/runtime در OpenClaw هستند،
نه زیر‌فرمان‌های CLI به شکل `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` فقط خواندنی است. این فرمان sourceهای marketplace اضافه نمی‌کند، Plugin نصب نمی‌کند، یا
پشتیبانی Plugin در Codex را فعال نمی‌کند.

`install` پشتیبانی Plugin در Codex app-server را فعال می‌کند، در صورت نیاز یک
source پیکربندی‌شده marketplace اضافه می‌کند، Plugin پیکربندی‌شده را از طریق Codex
app-server نصب یا دوباره فعال می‌کند، سرورهای MCP را reload می‌کند، و تایید می‌کند که
سرور MCP ابزارها را ارائه می‌دهد.

## انتخاب‌های marketplace

OpenClaw از همان API مربوط به app-server استفاده می‌کند که خود Codex ارائه می‌دهد. فیلدهای
marketplace تعیین می‌کنند Codex باید `computer-use` را از کجا پیدا کند.

| فیلد                | چه زمانی استفاده کنید                                                        | پشتیبانی نصب                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| بدون فیلد marketplace | می‌خواهید Codex app-server از marketplaceهایی استفاده کند که از قبل می‌شناسد. | بله، وقتی app-server یک marketplace محلی برگرداند.        |
| `marketplaceSource`  | یک source marketplace در Codex دارید که app-server می‌تواند اضافه کند.         | بله، برای `/codex computer-use install` صریح.         |
| `marketplacePath`    | از قبل مسیر فایل marketplace محلی روی host را می‌دانید.   | بله، برای نصب صریح و auto-install در شروع نوبت.   |
| `marketplaceName`    | می‌خواهید یک marketplace از قبل ثبت‌شده را با نام انتخاب کنید.  | فقط وقتی بله که marketplace انتخاب‌شده یک مسیر محلی داشته باشد. |

homeهای تازه Codex ممکن است برای seed کردن marketplaceهای رسمی خود به کمی زمان نیاز داشته باشند.
هنگام نصب، OpenClaw تا
`marketplaceDiscoveryTimeoutMs` میلی‌ثانیه `plugin/list` را poll می‌کند. مقدار پیش‌فرض ۶۰ ثانیه است.

اگر چند marketplace شناخته‌شده شامل Computer Use باشند، OpenClaw ابتدا
`openai-bundled`، سپس `openai-curated`، و سپس `local` را ترجیح می‌دهد. matchهای ناشناخته و مبهم
fail closed می‌شوند و از شما می‌خواهند `marketplaceName` یا `marketplacePath` را تنظیم کنید.

## marketplace همراه macOS

buildهای اخیر دسکتاپ Codex، Computer Use را اینجا bundle می‌کنند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

وقتی `computerUse.autoInstall` برابر true باشد و هیچ marketplace شامل
`computer-use` ثبت نشده باشد، OpenClaw تلاش می‌کند root استاندارد marketplace همراه را
به‌صورت خودکار اضافه کند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

همچنین می‌توانید آن را صریحا از یک shell با Codex ثبت کنید:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

اگر از مسیر غیر استاندارد برنامه Codex استفاده می‌کنید، `computerUse.marketplacePath` را روی یک
مسیر فایل marketplace محلی تنظیم کنید یا یک‌بار `/codex computer-use install --source
<marketplace-source>` را اجرا کنید.

## محدودیت catalog راه دور

Codex app-server می‌تواند entryهای catalog فقط راه دور را فهرست کند و بخواند، اما در حال حاضر
از `plugin/install` راه دور پشتیبانی نمی‌کند. یعنی `marketplaceName` می‌تواند
یک marketplace فقط راه دور را برای بررسی‌های status انتخاب کند، اما نصب و فعال‌سازی دوباره
همچنان به یک marketplace محلی از طریق `marketplaceSource` یا `marketplacePath` نیاز دارد.

اگر status می‌گوید Plugin در یک marketplace راه دور Codex در دسترس است اما نصب راه دور
پشتیبانی نمی‌شود، install را با یک source یا path محلی اجرا کنید:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع پیکربندی

| فیلد                           | پیش‌فرض        | معنی                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | استنباط‌شده       | Computer Use را الزامی می‌کند. وقتی فیلد دیگری از Computer Use تنظیم شده باشد، پیش‌فرض true است. |
| `autoInstall`                   | false          | در شروع نوبت، از marketplaceهای از قبل کشف‌شده نصب یا دوباره فعال می‌کند.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدت زمانی که install برای کشف marketplace توسط Codex app-server منتظر می‌ماند.             |
| `marketplaceSource`             | تنظیم‌نشده          | رشته source که به `marketplace/add` در Codex app-server داده می‌شود.                    |
| `marketplacePath`               | تنظیم‌نشده          | مسیر فایل marketplace محلی Codex که شامل Plugin است.                       |
| `marketplaceName`               | تنظیم‌نشده          | نام marketplace ثبت‌شده Codex برای انتخاب.                                   |
| `pluginName`                    | `computer-use` | نام Plugin در marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | نام سرور MCP که Plugin نصب‌شده ارائه می‌کند.                               |

auto-install در شروع نوبت، عمدا مقدارهای پیکربندی‌شده `marketplaceSource` را رد می‌کند.
افزودن یک source تازه یک عملیات راه‌اندازی صریح است، بنابراین یک‌بار از
`/codex computer-use install --source <marketplace-source>` استفاده کنید، سپس اجازه دهید
`autoInstall` فعال‌سازی‌های دوباره آینده را از marketplaceهای محلی کشف‌شده انجام دهد.
auto-install در شروع نوبت می‌تواند از `marketplacePath` پیکربندی‌شده استفاده کند، چون آن
از قبل یک مسیر محلی روی host است.

## OpenClaw چه چیزهایی را بررسی می‌کند

OpenClaw یک دلیل راه‌اندازی پایدار را به‌صورت داخلی گزارش می‌کند و status قابل مشاهده برای کاربر
را برای chat قالب‌بندی می‌کند:

| دلیل                       | معنی                                                | گام بعدی                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` به false resolve شده است.               | `enabled` یا یک فیلد دیگر از Computer Use را تنظیم کنید.  |
| `marketplace_missing`        | هیچ marketplace منطبقی در دسترس نبود.                 | source، path، یا نام marketplace را پیکربندی کنید.  |
| `plugin_not_installed`       | marketplace وجود دارد، اما Plugin نصب نشده است.   | install را اجرا کنید یا `autoInstall` را فعال کنید.          |
| `plugin_disabled`            | Plugin نصب شده اما در config Codex غیرفعال است.      | install را اجرا کنید تا دوباره فعال شود.                  |
| `remote_install_unsupported` | marketplace انتخاب‌شده فقط راه دور است.                   | از `marketplaceSource` یا `marketplacePath` استفاده کنید. |
| `mcp_missing`                | Plugin فعال است، اما سرور MCP در دسترس نیست.  | Codex Computer Use و مجوزهای OS را بررسی کنید.  |
| `ready`                      | Plugin و ابزارهای MCP در دسترس هستند.                    | نوبت حالت Codex را شروع کنید.                    |
| `check_failed`               | یک درخواست Codex app-server هنگام بررسی status شکست خورد. | اتصال app-server و logها را بررسی کنید.       |
| `auto_install_blocked`       | راه‌اندازی شروع نوبت باید یک source تازه اضافه کند.       | ابتدا install صریح را اجرا کنید.                   |

خروجی chat شامل وضعیت Plugin، وضعیت سرور MCP، marketplace، ابزارها
در صورت موجود بودن، و پیام مشخص مربوط به مرحله راه‌اندازی ناموفق است.

## مجوزهای macOS

Computer Use مختص macOS است. سرور MCP تحت مالکیت Codex ممکن است پیش از آنکه بتواند
برنامه‌ها را inspect یا کنترل کند، به مجوزهای محلی OS نیاز داشته باشد. اگر OpenClaw می‌گوید Computer Use
نصب شده اما سرور MCP در دسترس نیست، ابتدا راه‌اندازی Computer Use در سمت Codex را
تایید کنید:

- ‏Codex app-server روی همان میزبانی اجرا می‌شود که کنترل دسکتاپ باید در آن
  انجام شود.
- ‏Plugin مربوط به Computer Use در پیکربندی Codex فعال است.
- سرور MCP با نام `computer-use` در وضعیت MCP مربوط به Codex app-server دیده می‌شود.
- ‏macOS مجوزهای لازم را برای برنامه کنترل دسکتاپ داده است.
- نشست فعلی میزبان می‌تواند به دسکتاپی که کنترل می‌شود دسترسی داشته باشد.

وقتی `computerUse.enabled` برابر true باشد، OpenClaw عامدانه به‌شکل بسته شکست
می‌خورد. یک نوبت در حالت Codex نباید بدون ابزارهای بومی دسکتاپی که پیکربندی
الزام کرده است، بی‌سروصدا ادامه پیدا کند.

## عیب‌یابی

**وضعیت می‌گوید نصب نشده است.** دستور `/codex computer-use install` را اجرا کنید. اگر
بازارچه کشف نشد، `--source` یا `--marketplace-path` را پاس بدهید.

**وضعیت می‌گوید نصب شده اما غیرفعال است.** دوباره `/codex computer-use install` را اجرا کنید.
نصب Codex app-server پیکربندی Plugin را دوباره با وضعیت فعال می‌نویسد.

**وضعیت می‌گوید نصب راه‌دور پشتیبانی نمی‌شود.** از یک منبع یا مسیر محلی بازارچه
استفاده کنید. ورودی‌های کاتالوگِ فقط راه‌دور قابل بررسی هستند، اما از طریق API
فعلی app-server نصب نمی‌شوند.

**وضعیت می‌گوید سرور MCP در دسترس نیست.** نصب را یک‌بار دیگر اجرا کنید تا سرورهای
MCP دوباره بارگذاری شوند. اگر همچنان در دسترس نبود، برنامه Codex Computer Use،
وضعیت MCP مربوط به Codex app-server، یا مجوزهای macOS را اصلاح کنید.

**وضعیت یا یک پروب روی `computer-use.list_apps` به پایان مهلت می‌رسد.** ‏Plugin و
سرور MCP حاضر هستند، اما پل محلی Computer Use پاسخ نداد. Codex Computer Use را
ببندید یا دوباره راه‌اندازی کنید، در صورت نیاز Codex Desktop را دوباره اجرا کنید،
سپس در یک نشست تازه OpenClaw دوباره تلاش کنید.

**یک ابزار Computer Use می‌گوید `Native hook relay unavailable`.** قلاب ابزار بومی
Codex نتوانست از طریق پل محلی یا مسیر جایگزین Gateway به یک رله فعال OpenClaw
برسد. با `/new` یا `/reset` یک نشست تازه OpenClaw شروع کنید. اگر همچنان رخ داد،
gateway را دوباره راه‌اندازی کنید تا threadهای قدیمی app-server و ثبت‌های قلاب
حذف شوند، سپس دوباره تلاش کنید.

**نصب خودکارِ آغاز نوبت یک منبع را رد می‌کند.** این عمدی است. ابتدا منبع را با
دستور صریح `/codex computer-use install --source <marketplace-source>` اضافه کنید،
سپس نصب خودکارِ آغاز نوبت‌های بعدی می‌تواند از بازارچه محلی کشف‌شده استفاده کند.

## مرتبط

- [هارنس Codex](/fa/plugins/codex-harness)
- [پل Peekaboo](/fa/platforms/mac/peekaboo)
- [برنامه iOS](/fa/platforms/ios)
