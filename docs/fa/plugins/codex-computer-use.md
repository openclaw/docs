---
read_when:
    - می‌خواهید عامل‌های OpenClaw در حالت Codex از Codex Computer Use استفاده کنند
    - در حال تصمیم‌گیری بین Codex Computer Use، PeekabooBridge و cua-driver MCP مستقیم هستید
    - شما در حال انتخاب بین Codex Computer Use و یک راه‌اندازی مستقیم cua-driver MCP هستید
    - شما در حال پیکربندی computerUse برای Plugin همراه Codex هستید
    - در حال عیب‌یابی وضعیت یا نصب /codex computer-use هستید
summary: استفاده از رایانه Codex را برای عامل‌های OpenClaw در حالت Codex راه‌اندازی کنید
title: استفاده از رایانه با Codex
x-i18n:
    generated_at: "2026-04-29T23:14:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use یک Plugin بومی Codex از نوع MCP برای کنترل دسکتاپ محلی است. OpenClaw
اپ دسکتاپ را vendor نمی‌کند، خودش اقدام‌های دسکتاپ را اجرا نمی‌کند، یا
مجوزهای Codex را دور نمی‌زند. Plugin همراه `codex` فقط app-server مربوط به Codex را آماده می‌کند:
پشتیبانی Plugin در Codex را فعال می‌کند، Plugin پیکربندی‌شده Codex
Computer Use را پیدا یا نصب می‌کند، بررسی می‌کند که سرور MCP با نام `computer-use` در دسترس باشد، و
سپس اجازه می‌دهد Codex فراخوانی‌های ابزار MCP بومی را در طول نوبت‌های حالت Codex مالکیت کند.

از این صفحه زمانی استفاده کنید که OpenClaw از قبل از هارنس بومی Codex استفاده می‌کند. برای
راه‌اندازی خود runtime، [هارنس Codex](/fa/plugins/codex-harness) را ببینید.

## OpenClaw.app و Peekaboo

یکپارچه‌سازی Peekaboo در OpenClaw.app جدا از Codex Computer Use است. اپ
macOS می‌تواند یک سوکت PeekabooBridge میزبانی کند تا CLI با نام `peekaboo` بتواند از
مجوزهای محلی Accessibility و Screen Recording اپ برای ابزارهای
اتوماسیون خود Peekaboo دوباره استفاده کند. آن پل Codex Computer Use را نصب یا proxy نمی‌کند، و
Codex Computer Use از طریق سوکت PeekabooBridge فراخوانی انجام نمی‌دهد.

وقتی می‌خواهید OpenClaw.app یک میزبان آگاه از مجوز برای اتوماسیون Peekaboo CLI باشد، از [پل Peekaboo](/fa/platforms/mac/peekaboo) استفاده کنید. از این صفحه زمانی استفاده کنید که یک
عامل OpenClaw در حالت Codex باید پیش از شروع نوبت، Plugin بومی MCP با نام `computer-use` متعلق به Codex را
در دسترس داشته باشد.

## اپ iOS

اپ iOS جدا از Codex Computer Use است. این اپ سرور MCP با نام `computer-use` متعلق به Codex را نصب یا proxy
نمی‌کند و backend کنترل دسکتاپ نیست.
در عوض، اپ iOS به‌عنوان یک Node از OpenClaw متصل می‌شود و قابلیت‌های موبایل را
از طریق فرمان‌های Node مانند `canvas.*`، `camera.*`، `screen.*`،
`location.*` و `talk.*` ارائه می‌کند.

وقتی می‌خواهید یک عامل از طریق Gateway یک Node آیفون را هدایت کند، از [iOS](/fa/platforms/ios) استفاده کنید. از این صفحه زمانی استفاده کنید که یک عامل حالت Codex باید دسکتاپ محلی
macOS را از طریق Plugin بومی Computer Use متعلق به Codex کنترل کند.

## Direct cua-driver MCP

Codex Computer Use تنها راه ارائه کنترل دسکتاپ نیست. اگر می‌خواهید
runtimeهای مدیریت‌شده توسط OpenClaw مستقیماً driver متعلق به TryCua را فراخوانی کنند، به‌جای
جریان marketplace مخصوص Codex، از سرور upstream با نام `cua-driver mcp` از طریق رجیستری MCP در OpenClaw استفاده کنید.

پس از نصب `cua-driver`، یا از آن فرمان OpenClaw را بخواهید:

```bash
cua-driver mcp-config --client openclaw
```

یا خودتان سرور stdio را ثبت کنید:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

آن مسیر سطح ابزار MCP upstream را، از جمله schemaهای driver
و پاسخ‌های ساختاریافته MCP، دست‌نخورده نگه می‌دارد. وقتی می‌خواهید driver مربوط به CUA
به‌عنوان یک سرور عادی MCP در OpenClaw در دسترس باشد، از آن استفاده کنید. وقتی
Codex app-server باید نصب Plugin، بارگذاری مجدد MCP، و فراخوانی‌های ابزار بومی را
داخل نوبت‌های حالت Codex مالکیت کند، از راه‌اندازی Codex Computer Use در
این صفحه استفاده کنید.

driver متعلق به CUA مخصوص macOS است و همچنان به مجوزهای محلی macOS
که اپ آن درخواست می‌کند نیاز دارد، مانند Accessibility و Screen Recording. OpenClaw
`cua-driver` را نصب نمی‌کند، آن مجوزها را اعطا نمی‌کند، یا مدل ایمنی driver
upstream را دور نمی‌زند.

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
        fallback: "none",
      },
    },
  },
}
```

با این پیکربندی، OpenClaw پیش از هر نوبت حالت Codex، Codex app-server را بررسی می‌کند.
اگر Computer Use موجود نباشد اما Codex app-server از قبل یک
marketplace قابل نصب را کشف کرده باشد، OpenClaw از Codex app-server می‌خواهد
Plugin را نصب یا دوباره فعال کند و سرورهای MCP را دوباره بارگذاری کند. در macOS، وقتی هیچ marketplace
مطابقی ثبت نشده باشد و bundle استاندارد اپ Codex وجود داشته باشد، OpenClaw همچنین تلاش می‌کند
پیش از failure، marketplace همراه Codex را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند. اگر setup همچنان نتواند سرور MCP را در دسترس کند، نوبت
پیش از شروع thread شکست می‌خورد.

Sessionهای موجود runtime و اتصال thread به Codex خود را نگه می‌دارند. پس از تغییر
`agentRuntime` یا پیکربندی Computer Use، پیش از تست در چت مربوطه از
`/new` یا `/reset` استفاده کنید.

## فرمان‌ها

از فرمان‌های `/codex computer-use` از هر سطح چتی که سطح فرمان Plugin با نام `codex`
در دسترس است استفاده کنید. این‌ها فرمان‌های چت/runtime مربوط به OpenClaw هستند،
نه زیرفرمان‌های CLI به‌شکل `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` فقط خواندنی است. این فرمان sourceهای marketplace را اضافه نمی‌کند، pluginها را نصب نمی‌کند، یا
پشتیبانی Plugin در Codex را فعال نمی‌کند.

`install` پشتیبانی Plugin در Codex app-server را فعال می‌کند، در صورت نیاز یک
source پیکربندی‌شده marketplace اضافه می‌کند، Plugin پیکربندی‌شده را از طریق Codex
app-server نصب یا دوباره فعال می‌کند، سرورهای MCP را دوباره بارگذاری می‌کند، و بررسی می‌کند که سرور MCP ابزارها را ارائه می‌کند.

## انتخاب‌های marketplace

OpenClaw از همان API مربوط به app-server استفاده می‌کند که خود Codex ارائه می‌دهد. فیلدهای
marketplace تعیین می‌کنند Codex باید `computer-use` را از کجا پیدا کند.

| فیلد                | زمان استفاده                                                        | پشتیبانی نصب                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| بدون فیلد marketplace | می‌خواهید Codex app-server از marketplaceهایی استفاده کند که از قبل می‌شناسد. | بله، وقتی app-server یک marketplace محلی برمی‌گرداند.        |
| `marketplaceSource`  | یک source مربوط به Codex marketplace دارید که app-server می‌تواند اضافه کند.         | بله، برای `/codex computer-use install` صریح.         |
| `marketplacePath`    | از قبل مسیر فایل marketplace محلی را روی میزبان می‌دانید.   | بله، برای نصب صریح و auto-install هنگام شروع نوبت.   |
| `marketplaceName`    | می‌خواهید یک marketplace از قبل ثبت‌شده را با نام انتخاب کنید.  | فقط وقتی بله که marketplace انتخاب‌شده یک مسیر محلی داشته باشد. |

خانه‌های تازه Codex ممکن است برای seed کردن marketplaceهای رسمی خود به زمان کوتاهی نیاز داشته باشند.
هنگام نصب، OpenClaw تا
`marketplaceDiscoveryTimeoutMs` میلی‌ثانیه `plugin/list` را poll می‌کند. مقدار پیش‌فرض ۶۰ ثانیه است.

اگر چند marketplace شناخته‌شده شامل Computer Use باشند، OpenClaw ابتدا
`openai-bundled`، سپس `openai-curated`، سپس `local` را ترجیح می‌دهد. matchهای مبهم ناشناخته
fail closed می‌شوند و از شما می‌خواهند `marketplaceName` یا `marketplacePath` را تنظیم کنید.

## marketplace همراه macOS

buildهای جدید دسکتاپ Codex، Computer Use را اینجا همراه دارند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

وقتی `computerUse.autoInstall` برابر true باشد و هیچ marketplace شامل
`computer-use` ثبت نشده باشد، OpenClaw تلاش می‌کند root استاندارد marketplace همراه را
به‌صورت خودکار اضافه کند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

همچنین می‌توانید آن را صریحاً از یک shell با Codex ثبت کنید:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

اگر از مسیر غیرstandard برای اپ Codex استفاده می‌کنید، `computerUse.marketplacePath` را روی یک
مسیر فایل marketplace محلی تنظیم کنید یا یک بار
`/codex computer-use install --source <marketplace-source>` را اجرا کنید.

## محدودیت کاتالوگ remote

Codex app-server می‌تواند entryهای کاتالوگ فقط remote را فهرست و بخواند، اما در حال حاضر
از `plugin/install` به‌صورت remote پشتیبانی نمی‌کند. این یعنی `marketplaceName` می‌تواند
برای بررسی‌های status یک marketplace فقط remote را انتخاب کند، اما نصب‌ها و فعال‌سازی‌های مجدد
همچنان به یک marketplace محلی از طریق `marketplaceSource` یا `marketplacePath` نیاز دارند.

اگر status می‌گوید Plugin در یک marketplace ریموت Codex در دسترس است اما نصب remote
پشتیبانی نمی‌شود، نصب را با یک source یا path محلی اجرا کنید:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع پیکربندی

| فیلد                           | پیش‌فرض        | معنا                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use را الزامی می‌کند. وقتی فیلد دیگری از Computer Use تنظیم شده باشد، پیش‌فرض true است. |
| `autoInstall`                   | false          | هنگام شروع نوبت، از marketplaceهای از قبل کشف‌شده نصب یا دوباره فعال می‌کند.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدت زمانی که install منتظر کشف marketplace توسط Codex app-server می‌ماند.             |
| `marketplaceSource`             | unset          | رشته source که به `marketplace/add` در Codex app-server پاس داده می‌شود.                    |
| `marketplacePath`               | unset          | مسیر فایل marketplace محلی Codex که Plugin را شامل می‌شود.                       |
| `marketplaceName`               | unset          | نام marketplace ثبت‌شده Codex برای انتخاب.                                   |
| `pluginName`                    | `computer-use` | نام Plugin در Codex marketplace.                                                 |
| `mcpServerName`                 | `computer-use` | نام سرور MCP که توسط Plugin نصب‌شده ارائه می‌شود.                               |

auto-install هنگام شروع نوبت عمداً مقادیر پیکربندی‌شده `marketplaceSource`
را رد می‌کند. افزودن source جدید یک عملیات setup صریح است، بنابراین یک بار از
`/codex computer-use install --source <marketplace-source>` استفاده کنید، سپس بگذارید
`autoInstall` فعال‌سازی‌های مجدد آینده را از marketplaceهای محلی کشف‌شده انجام دهد.
auto-install هنگام شروع نوبت می‌تواند از `marketplacePath` پیکربندی‌شده استفاده کند، چون آن
از قبل یک مسیر محلی روی میزبان است.

## OpenClaw چه چیزهایی را بررسی می‌کند

OpenClaw یک دلیل setup پایدار را به‌صورت داخلی گزارش می‌کند و status قابل‌نمایش به کاربر را
برای چت قالب‌بندی می‌کند:

| دلیل                       | معنا                                                | گام بعدی                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` به false resolve شده است.               | `enabled` یا فیلد دیگری از Computer Use را تنظیم کنید.  |
| `marketplace_missing`        | هیچ marketplace مطابقی در دسترس نبود.                 | source، path، یا نام marketplace را پیکربندی کنید.  |
| `plugin_not_installed`       | marketplace وجود دارد، اما Plugin نصب نشده است.   | install را اجرا کنید یا `autoInstall` را فعال کنید.          |
| `plugin_disabled`            | Plugin نصب شده اما در پیکربندی Codex غیرفعال است.      | install را اجرا کنید تا دوباره فعال شود.                  |
| `remote_install_unsupported` | marketplace انتخاب‌شده فقط remote است.                   | از `marketplaceSource` یا `marketplacePath` استفاده کنید. |
| `mcp_missing`                | Plugin فعال است، اما سرور MCP در دسترس نیست.  | Codex Computer Use و مجوزهای OS را بررسی کنید.  |
| `ready`                      | Plugin و ابزارهای MCP در دسترس هستند.                    | نوبت حالت Codex را شروع کنید.                    |
| `check_failed`               | یک درخواست Codex app-server هنگام بررسی status شکست خورد. | اتصال app-server و logها را بررسی کنید.       |
| `auto_install_blocked`       | setup هنگام شروع نوبت نیاز به افزودن source جدید دارد.       | ابتدا install صریح را اجرا کنید.                   |

خروجی چت شامل وضعیت Plugin، وضعیت سرور MCP، marketplace، ابزارها
در صورت در دسترس بودن، و پیام مشخص برای گام setup شکست‌خورده است.

## مجوزهای macOS

Computer Use مخصوص macOS است. سرور MCP تحت مالکیت Codex ممکن است پیش از اینکه بتواند اپ‌ها را بررسی یا کنترل کند، به مجوزهای محلی OS نیاز داشته باشد. اگر OpenClaw می‌گوید Computer Use
نصب شده اما سرور MCP در دسترس نیست، ابتدا setup مربوط به Computer
Use در سمت Codex را بررسی کنید:

- Codex app-server روی همان میزبانی در حال اجرا است که کنترل دسکتاپ باید
  در آن انجام شود.
- Plugin مربوط به Computer Use در پیکربندی Codex فعال است.
- سرور MCP مربوط به `computer-use` در وضعیت MCP مربوط به Codex app-server دیده می‌شود.
- macOS مجوزهای لازم را برای برنامه کنترل دسکتاپ اعطا کرده است.
- نشست فعلی میزبان می‌تواند به دسکتاپی که کنترل می‌شود دسترسی داشته باشد.

OpenClaw وقتی `computerUse.enabled` برابر با true باشد، عمداً به‌صورت بسته شکست می‌خورد. یک
نوبت در حالت Codex نباید بدون ابزارهای بومی دسکتاپی که
پیکربندی الزامی کرده است، بی‌سروصدا ادامه پیدا کند.

## عیب‌یابی

**وضعیت می‌گوید نصب نشده است.** `/codex computer-use install` را اجرا کنید. اگر
بازارچه کشف نشد، `--source` یا `--marketplace-path` را ارسال کنید.

**وضعیت می‌گوید نصب شده اما غیرفعال است.** دوباره `/codex computer-use install` را اجرا کنید.
نصب Codex app-server پیکربندی Plugin را دوباره به حالت فعال می‌نویسد.

**وضعیت می‌گوید نصب از راه دور پشتیبانی نمی‌شود.** از یک منبع یا
مسیر بازارچه محلی استفاده کنید. ورودی‌های کاتالوگ فقط‌ازراه‌دور قابل بررسی هستند اما از طریق
API فعلی app-server نصب نمی‌شوند.

**وضعیت می‌گوید سرور MCP در دسترس نیست.** نصب را یک بار دیگر اجرا کنید تا سرورهای MCP
دوباره بارگذاری شوند. اگر همچنان در دسترس نبود، برنامه Codex Computer Use،
وضعیت MCP مربوط به Codex app-server، یا مجوزهای macOS را اصلاح کنید.

**وضعیت یا یک کاوش روی `computer-use.list_apps` مهلت زمانی را رد می‌کند.** Plugin و سرور MCP
حاضر هستند، اما پل محلی Computer Use پاسخ نداد. Codex Computer Use را ببندید یا
بازراه‌اندازی کنید، در صورت نیاز Codex Desktop را دوباره اجرا کنید، سپس در یک
نشست تازه OpenClaw دوباره تلاش کنید.

**یک ابزار Computer Use می‌گوید `Native hook relay unavailable`.** قلاب ابزار بومی Codex
نتوانست از طریق پل محلی یا گزینه جایگزین Gateway به یک رله فعال OpenClaw برسد.
یک نشست تازه OpenClaw را با `/new` یا `/reset` شروع کنید. اگر این مشکل
ادامه داشت، Gateway را بازراه‌اندازی کنید تا رشته‌های قدیمی app-server و ثبت‌های قلاب
حذف شوند، سپس دوباره تلاش کنید.

**نصب خودکار در شروع نوبت یک منبع را رد می‌کند.** این عمدی است. ابتدا منبع را
با `/codex computer-use install --source <marketplace-source>` صریح اضافه کنید،
سپس نصب خودکار در شروع نوبت‌های آینده می‌تواند از بازارچه محلی کشف‌شده استفاده کند.
