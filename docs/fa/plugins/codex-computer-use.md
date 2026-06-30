---
read_when:
    - می‌خواهید عامل‌های OpenClaw در حالت Codex از Codex Computer Use استفاده کنند
    - شما در حال انتخاب میان Codex Computer Use، PeekabooBridge و MCP مستقیم cua-driver هستید
    - شما در حال تصمیم‌گیری بین Codex Computer Use و راه‌اندازی مستقیم cua-driver MCP هستید
    - در حال پیکربندی computerUse برای Plugin همراه Codex هستید
    - در حال عیب‌یابی وضعیت یا نصب computer-use در /codex هستید
summary: راه‌اندازی Codex Computer Use برای عامل‌های OpenClaw در حالت Codex
title: استفاده از رایانه با Codex
x-i18n:
    generated_at: "2026-06-30T14:15:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

استفاده از رایانه یک Plugin MCP بومی Codex برای کنترل دسکتاپ محلی است. OpenClaw
برنامه دسکتاپ را در خود vendoring نمی‌کند، خودش کنش‌های دسکتاپ را اجرا نمی‌کند، و
مجوزهای Codex را دور نمی‌زند. Plugin همراه `codex` فقط app-server مربوط به Codex را آماده می‌کند:
پشتیبانی Plugin در Codex را فعال می‌کند، Plugin پیکربندی‌شده Codex
Computer Use را پیدا یا نصب می‌کند، بررسی می‌کند که سرور MCP به نام `computer-use` در دسترس باشد، و
سپس اجازه می‌دهد Codex در طول نوبت‌های حالت Codex مالک فراخوانی‌های ابزار MCP بومی باشد.

از این صفحه زمانی استفاده کنید که OpenClaw از قبل از harness بومی Codex استفاده می‌کند. برای
خود راه‌اندازی runtime، [Codex harness](/fa/plugins/codex-harness) را ببینید.

## OpenClaw.app و Peekaboo

یکپارچه‌سازی Peekaboo در OpenClaw.app از Codex Computer Use جدا است. برنامه
macOS می‌تواند یک سوکت PeekabooBridge میزبانی کند تا CLI به نام `peekaboo` بتواند
مجوزهای محلی Accessibility و Screen Recording برنامه را برای ابزارهای
اتوماسیون خود Peekaboo دوباره استفاده کند. آن bridge، Codex Computer Use را نصب یا پراکسی نمی‌کند، و
Codex Computer Use از طریق سوکت PeekabooBridge فراخوانی انجام نمی‌دهد.

وقتی می‌خواهید OpenClaw.app یک میزبان آگاه از مجوز برای اتوماسیون Peekaboo CLI باشد، از [Peekaboo bridge](/fa/platforms/mac/peekaboo) استفاده کنید. از این صفحه زمانی استفاده کنید که یک
عامل OpenClaw در حالت Codex باید پیش از شروع نوبت، Plugin بومی MCP به نام `computer-use` مربوط به Codex را
در دسترس داشته باشد.

## برنامه iOS

برنامه iOS از Codex Computer Use جدا است. این برنامه سرور MCP به نام `computer-use` مربوط به Codex را نصب یا پراکسی نمی‌کند
و backend کنترل دسکتاپ نیست.
در عوض، برنامه iOS به‌عنوان یک گره OpenClaw متصل می‌شود و قابلیت‌های موبایل را
از طریق فرمان‌های گره مانند `canvas.*`، `camera.*`، `screen.*`،
`location.*`، و `talk.*` ارائه می‌کند.

وقتی می‌خواهید یک عامل از طریق Gateway یک گره iPhone را هدایت کند، از [iOS](/fa/platforms/ios) استفاده کنید. از این صفحه زمانی استفاده کنید که یک عامل حالت Codex باید دسکتاپ
macOS محلی را از طریق Plugin بومی Computer Use مربوط به Codex کنترل کند.

## MCP مستقیم cua-driver

Codex Computer Use تنها راه ارائه کنترل دسکتاپ نیست. اگر می‌خواهید
runtimeهای مدیریت‌شده توسط OpenClaw مستقیما درایور TryCua را فراخوانی کنند، به‌جای جریان بازارچه مختص Codex، از سرور upstream
`cua-driver mcp` از طریق رجیستری MCP مربوط به OpenClaw استفاده کنید.

پس از نصب `cua-driver`، یا فرمان OpenClaw را از آن بخواهید:

```bash
cua-driver mcp-config --client openclaw
```

یا خودتان سرور stdio را ثبت کنید:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

این مسیر سطح ابزار MCP بالادستی را دست‌نخورده نگه می‌دارد، از جمله schemaهای درایور
و پاسخ‌های ساختاریافته MCP. وقتی می‌خواهید درایور CUA
به‌عنوان یک سرور عادی MCP در OpenClaw در دسترس باشد، از آن استفاده کنید. وقتی app-server مربوط به Codex باید مالک نصب Plugin، reloadهای MCP،
و فراخوانی‌های ابزار بومی درون نوبت‌های حالت Codex باشد، از راه‌اندازی Codex Computer Use در
این صفحه استفاده کنید.

درایور CUA مختص macOS است و همچنان به مجوزهای محلی macOS نیاز دارد
که برنامه‌اش درخواست می‌کند، مانند Accessibility و Screen Recording. OpenClaw
`cua-driver` را نصب نمی‌کند، آن مجوزها را اعطا نمی‌کند، یا مدل ایمنی درایور
بالادستی را دور نمی‌زند.

## راه‌اندازی سریع

وقتی نوبت‌های حالت Codex باید پیش از شروع یک thread، Computer Use را
در دسترس داشته باشند، `plugins.entries.codex.config.computerUse` را تنظیم کنید. `autoInstall: true`
Computer Use را فعال می‌کند و به OpenClaw اجازه می‌دهد پیش از نوبت، آن را نصب یا دوباره فعال کند:

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
اگر Computer Use موجود نباشد اما app-server مربوط به Codex پیش‌تر یک
بازارچه قابل‌نصب را کشف کرده باشد، OpenClaw از app-server مربوط به Codex می‌خواهد
Plugin را نصب یا دوباره فعال کند و سرورهای MCP را reload کند. در macOS، وقتی هیچ بازارچه منطبقی
ثبت نشده و bundle استاندارد برنامه Codex وجود دارد، OpenClaw همچنین تلاش می‌کند
بازارچه همراه Codex را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` پیش از شکست ثبت کند. اگر راه‌اندازی همچنان نتواند سرور MCP را در دسترس کند، نوبت
پیش از شروع thread شکست می‌خورد.

پس از تغییر پیکربندی Computer Use، اگر یک thread موجود Codex از قبل شروع شده است،
پیش از آزمایش از `/new` یا `/reset` در چت تحت‌تاثیر استفاده کنید.

در راه‌اندازی stdio مدیریت‌شده روی macOS، OpenClaw وقتی bundle امضاشده برنامه دسکتاپ Codex
در `/Applications/Codex.app/Contents/Resources/codex` وجود داشته باشد، آن را ترجیح می‌دهد.
این کار Computer Use را زیر همان bundle برنامه‌ای نگه می‌دارد که مالک مجوزهای کنترل دسکتاپ محلی است.
اگر برنامه دسکتاپ نصب نشده باشد، OpenClaw به باینری مدیریت‌شده Codex که کنار Plugin نصب شده است
fallback می‌کند. اگر یک برنامه دسکتاپ نصب‌شده با نسخه app-server پشتیبانی‌نشده initialize شود، OpenClaw آن فرزند را می‌بندد
و به‌جای اینکه یک برنامه دسکتاپ قدیمی fallback محلی Plugin را پنهان کند، کاندیدای بعدی باینری مدیریت‌شده را دوباره امتحان می‌کند. پیکربندی صریح `appServer.command`
یا `OPENCLAW_CODEX_APP_SERVER_BIN` همچنان این انتخاب مدیریت‌شده را override می‌کند.

## فرمان‌ها

از فرمان‌های `/codex computer-use` در هر سطح چتی که سطح فرمان Plugin به نام `codex`
در دسترس است استفاده کنید. این‌ها فرمان‌های چت/runtime در OpenClaw هستند،
نه زیر‌فرمان‌های CLI به شکل `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` فقط خواندنی است. این فرمان sourceهای بازارچه را اضافه نمی‌کند، Pluginها را نصب نمی‌کند، یا
پشتیبانی Plugin در Codex را فعال نمی‌کند. اگر هیچ پیکربندی‌ای Computer Use را opt in نکرده باشد، `status` می‌تواند
حتی پس از یک فرمان نصب تک‌باره، disabled گزارش کند.

`install` پشتیبانی Plugin در app-server مربوط به Codex را فعال می‌کند، به‌صورت اختیاری یک
source بازارچه پیکربندی‌شده را اضافه می‌کند، Plugin پیکربندی‌شده را از طریق app-server مربوط به Codex
نصب یا دوباره فعال می‌کند، سرورهای MCP را reload می‌کند، و بررسی می‌کند که سرور MCP ابزارها را ارائه کند.
از آنجا که نصب منابع میزبان مورد اعتماد را تغییر می‌دهد، فقط مالک یا یک
کلاینت Gateway با `operator.admin` می‌تواند `install` را اجرا کند. فرستنده‌های مجاز دیگر می‌توانند
همچنان از فرمان فقط‌خواندنی `status` استفاده کنند، از جمله با overrideها.

## انتخاب‌های بازارچه

OpenClaw از همان API app-server استفاده می‌کند که خود Codex ارائه می‌دهد. فیلدهای
بازارچه تعیین می‌کنند Codex باید `computer-use` را از کجا پیدا کند.

| فیلد                 | زمان استفاده                                                    | پشتیبانی نصب                                             |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| بدون فیلد بازارچه    | می‌خواهید app-server مربوط به Codex از بازارچه‌هایی استفاده کند که از قبل می‌شناسد. | بله، وقتی app-server یک بازارچه محلی برگرداند.          |
| `marketplaceSource`  | یک source بازارچه Codex دارید که app-server می‌تواند اضافه کند. | بله، برای `/codex computer-use install` صریح.            |
| `marketplacePath`    | از قبل مسیر فایل بازارچه محلی روی میزبان را می‌دانید.          | بله، برای نصب صریح و auto-install در شروع نوبت.          |
| `marketplaceName`    | می‌خواهید یک بازارچه از پیش ثبت‌شده را با نام انتخاب کنید.     | فقط وقتی بازارچه انتخاب‌شده مسیر محلی داشته باشد.       |

خانه‌های تازه Codex ممکن است برای seed کردن بازارچه‌های رسمی خود به لحظه‌ای کوتاه نیاز داشته باشند.
در طول نصب، OpenClaw تا
`marketplaceDiscoveryTimeoutMs` میلی‌ثانیه `plugin/list` را poll می‌کند. مقدار پیش‌فرض ۶۰ ثانیه است.

اگر چند بازارچه شناخته‌شده شامل Computer Use باشند، OpenClaw ابتدا
`openai-bundled`، سپس `openai-curated`، سپس `local` را ترجیح می‌دهد. تطابق‌های مبهم ناشناخته
fail closed می‌شوند و از شما می‌خواهند `marketplaceName` یا `marketplacePath` را تنظیم کنید.

## بازارچه همراه macOS

buildهای اخیر دسکتاپ Codex، Computer Use را اینجا همراه دارند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

وقتی `computerUse.autoInstall` برابر true باشد و هیچ بازارچه‌ای که شامل
`computer-use` باشد ثبت نشده باشد، OpenClaw تلاش می‌کند root استاندارد بازارچه همراه را
به‌صورت خودکار اضافه کند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

همچنین می‌توانید آن را به‌صورت صریح از یک shell با Codex ثبت کنید:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

اگر از مسیر غیر استاندارد برنامه Codex استفاده می‌کنید، یک‌بار `/codex computer-use install
--source <marketplace-root>` را اجرا کنید یا `computerUse.marketplacePath` را روی یک
مسیر فایل بازارچه محلی تنظیم کنید. فقط زمانی از `--marketplace-path` استفاده کنید که
مسیر فایل JSON بازارچه را دارید، نه root بازارچه همراه.

## محدودیت catalog راه دور

app-server مربوط به Codex می‌تواند entryهای catalog فقط‌راه‌دور را list و read کند، اما در حال حاضر
از `plugin/install` راه دور پشتیبانی نمی‌کند. یعنی `marketplaceName` می‌تواند
یک بازارچه فقط‌راه‌دور را برای بررسی‌های status انتخاب کند، اما نصب‌ها و فعال‌سازی‌های دوباره
همچنان به یک بازارچه محلی از طریق `marketplaceSource` یا `marketplacePath` نیاز دارند.

اگر status می‌گوید Plugin در یک بازارچه راه دور Codex در دسترس است اما نصب راه دور
پشتیبانی نمی‌شود، نصب را با یک source یا path محلی اجرا کنید:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع پیکربندی

| فیلد                            | پیش‌فرض        | معنی                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use را الزامی می‌کند. وقتی فیلد دیگری از Computer Use تنظیم شده باشد، مقدار پیش‌فرض true است. |
| `autoInstall`                   | false          | در شروع نوبت، از بازارچه‌های از پیش کشف‌شده نصب یا دوباره فعال می‌کند.        |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدت زمانی که نصب برای کشف بازارچه app-server مربوط به Codex منتظر می‌ماند.    |
| `marketplaceSource`             | unset          | رشته source که به `marketplace/add` در app-server مربوط به Codex فرستاده می‌شود. |
| `marketplacePath`               | unset          | مسیر فایل بازارچه محلی Codex که شامل Plugin است.                              |
| `marketplaceName`               | unset          | نام بازارچه ثبت‌شده Codex برای انتخاب.                                        |
| `pluginName`                    | `computer-use` | نام Plugin بازارچه Codex.                                                      |
| `mcpServerName`                 | `computer-use` | نام سرور MCP که Plugin نصب‌شده ارائه می‌کند.                                  |

auto-install در شروع نوبت عمدا مقدارهای پیکربندی‌شده `marketplaceSource` را رد می‌کند.
افزودن یک source جدید یک عملیات راه‌اندازی صریح است، بنابراین یک‌بار از
`/codex computer-use install --source <marketplace-source>` استفاده کنید، سپس اجازه دهید
`autoInstall` فعال‌سازی‌های دوباره آینده را از بازارچه‌های محلی کشف‌شده انجام دهد.
auto-install در شروع نوبت می‌تواند از `marketplacePath` پیکربندی‌شده استفاده کند، چون آن
از قبل یک مسیر محلی روی میزبان است.

## OpenClaw چه چیزهایی را بررسی می‌کند

OpenClaw یک دلیل راه‌اندازی پایدار را به‌صورت داخلی گزارش می‌کند و status قابل‌مشاهده برای کاربر را
برای چت قالب‌بندی می‌کند:

| دلیل                       | معنی                                                | گام بعدی                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | مقدار `computerUse.enabled` به false تبدیل شده است.               | `enabled` یا یک فیلد دیگر Computer Use را تنظیم کنید.  |
| `marketplace_missing`        | هیچ marketplace مطابقی در دسترس نبود.                 | منبع، مسیر، یا نام marketplace را پیکربندی کنید.  |
| `plugin_not_installed`       | marketplace وجود دارد، اما Plugin نصب نشده است.   | نصب را اجرا کنید یا `autoInstall` را فعال کنید.          |
| `plugin_disabled`            | Plugin نصب شده اما در پیکربندی Codex غیرفعال است.      | نصب را اجرا کنید تا دوباره فعال شود.                  |
| `remote_install_unsupported` | marketplace انتخاب‌شده فقط-راه‌دور است.                   | از `marketplaceSource` یا `marketplacePath` استفاده کنید. |
| `mcp_missing`                | Plugin فعال است، اما سرور MCP در دسترس نیست.  | Computer Use در Codex و مجوزهای سیستم‌عامل را بررسی کنید.  |
| `ready`                      | Plugin و ابزارهای MCP در دسترس هستند.                    | نوبت حالت Codex را شروع کنید.                    |
| `check_failed`               | یک درخواست app-server مربوط به Codex هنگام بررسی وضعیت ناموفق شد. | اتصال و گزارش‌های app-server را بررسی کنید.       |
| `auto_install_blocked`       | آماده‌سازی آغاز نوبت باید یک منبع جدید اضافه کند.       | ابتدا نصب صریح را اجرا کنید.                   |

خروجی چت شامل وضعیت Plugin، وضعیت سرور MCP، marketplace، ابزارها در صورت
در دسترس بودن، و پیام مشخص برای گام ناموفق آماده‌سازی است.

## مجوزهای macOS

Computer Use مخصوص macOS است. سرور MCP تحت مالکیت Codex ممکن است پیش از اینکه
بتواند برنامه‌ها را بررسی یا کنترل کند، به مجوزهای محلی سیستم‌عامل
نیاز داشته باشد. اگر OpenClaw می‌گوید Computer Use نصب شده است اما سرور MCP
در دسترس نیست، ابتدا راه‌اندازی Computer Use سمت Codex را بررسی کنید:

- app-server مربوط به Codex روی همان میزبانی اجرا می‌شود که کنترل دسکتاپ باید
  در آن انجام شود.
- Plugin مربوط به Computer Use در پیکربندی Codex فعال است.
- سرور MCP به نام `computer-use` در وضعیت MCP مربوط به app-server در Codex دیده می‌شود.
- macOS مجوزهای لازم را برای برنامه کنترل دسکتاپ داده است.
- نشست فعلی میزبان می‌تواند به دسکتاپی که کنترل می‌شود دسترسی داشته باشد.

OpenClaw وقتی `computerUse.enabled` برابر true باشد عمداً بسته و ناموفق عمل می‌کند. یک
نوبت حالت Codex نباید بدون ابزارهای بومی دسکتاپ که پیکربندی لازم دانسته است
بی‌سروصدا ادامه پیدا کند.

## عیب‌یابی

**وضعیت می‌گوید نصب نشده است.** `/codex computer-use install` را اجرا کنید. اگر
marketplace کشف نمی‌شود، `--source` یا `--marketplace-path` را بدهید.

**وضعیت می‌گوید نصب شده اما غیرفعال است.** دوباره `/codex computer-use install` را اجرا کنید.
نصب app-server در Codex پیکربندی Plugin را دوباره در حالت فعال می‌نویسد.

**وضعیت می‌گوید نصب راه‌دور پشتیبانی نمی‌شود.** از یک منبع یا
مسیر محلی marketplace استفاده کنید. ورودی‌های catalog فقط-راه‌دور را می‌توان بررسی کرد اما از طریق
API فعلی app-server نمی‌توان نصب کرد.

**وضعیت می‌گوید سرور MCP در دسترس نیست.** یک بار دیگر نصب را اجرا کنید تا سرورهای MCP
دوباره بارگذاری شوند. اگر همچنان در دسترس نبود، برنامه Codex Computer Use،
وضعیت MCP در app-server مربوط به Codex، یا مجوزهای macOS را اصلاح کنید.

**وضعیت یا یک probe روی `computer-use.list_apps` با پایان مهلت روبه‌رو می‌شود.** Plugin و سرور MCP
حاضر هستند، اما پل محلی Computer Use پاسخ نداد. Codex Computer Use را ببندید یا
راه‌اندازی مجدد کنید، در صورت نیاز Codex Desktop را دوباره اجرا کنید، سپس در یک
نشست تازه OpenClaw دوباره تلاش کنید. اگر میزبان قبلاً Computer Use را از طریق یک app-server مدیریت‌شده قدیمی‌تر Codex اجرا کرده است، Plugin نصب‌شده را از marketplace بسته‌بندی‌شده همراه دسکتاپ
تازه‌سازی کنید:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**یک ابزار Computer Use می‌گوید `Native hook relay unavailable`.** قلاب ابزار بومی Codex
نتوانست از طریق پل محلی یا fallback مربوط به Gateway به یک رله فعال OpenClaw
برسد. با `/new` یا `/reset` یک نشست تازه OpenClaw شروع کنید. اگر یک بار کار می‌کند
و سپس در فراخوانی ابزار بعدی دوباره ناموفق می‌شود، `/new` فقط تلاش فعلی را پاک می‌کند؛
app-server مربوط به Codex یا Gateway در OpenClaw را راه‌اندازی مجدد کنید تا threadهای قدیمی
و ثبت‌نام‌های hook حذف شوند، سپس در یک نشست تازه دوباره تلاش کنید.

**نصب خودکار آغاز نوبت یک منبع را رد می‌کند.** این عمدی است. ابتدا منبع را
با `/codex computer-use install --source <marketplace-source>` صریح اضافه کنید،
سپس نصب خودکار آغاز نوبت در آینده می‌تواند از marketplace محلی کشف‌شده استفاده کند.

## مرتبط

- [هارنس Codex](/fa/plugins/codex-harness)
- [پل Peekaboo](/fa/platforms/mac/peekaboo)
- [برنامه iOS](/fa/platforms/ios)
