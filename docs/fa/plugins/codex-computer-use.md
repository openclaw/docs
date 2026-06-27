---
read_when:
    - می‌خواهید عامل‌های OpenClaw در حالت Codex از Codex Computer Use استفاده کنند
    - شما در حال انتخاب بین Codex Computer Use، PeekabooBridge و MCP مستقیم cua-driver هستید
    - در حال انتخاب بین Codex Computer Use و راه‌اندازی مستقیم cua-driver MCP هستید
    - شما در حال پیکربندی computerUse برای Plugin همراه Codex هستید
    - در حال عیب‌یابی وضعیت یا نصب /codex computer-use هستید
summary: راه‌اندازی Codex Computer Use برای عامل‌های OpenClaw در حالت Codex
title: استفاده از رایانه Codex
x-i18n:
    generated_at: "2026-06-27T18:10:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use یک Plugin بومی Codex برای MCP جهت کنترل میزکار محلی است. OpenClaw
برنامهٔ میزکار را vendoring نمی‌کند، خودش اقدام‌های میزکار را اجرا نمی‌کند، یا
مجوزهای Codex را دور نمی‌زند. Plugin بسته‌بندی‌شدهٔ `codex` فقط app-server
Codex را آماده می‌کند: پشتیبانی Plugin در Codex را فعال می‌کند، Plugin پیکربندی‌شدهٔ
Codex Computer Use را پیدا یا نصب می‌کند، بررسی می‌کند که سرور MCP
`computer-use` در دسترس باشد، و سپس اجازه می‌دهد Codex در نوبت‌های حالت Codex
مالک فراخوانی‌های ابزار MCP بومی باشد.

از این صفحه زمانی استفاده کنید که OpenClaw از قبل از harness بومی Codex استفاده می‌کند. برای
خود راه‌اندازی runtime، [Codex harness](/fa/plugins/codex-harness) را ببینید.

## OpenClaw.app و Peekaboo

یکپارچه‌سازی Peekaboo در OpenClaw.app جدا از Codex Computer Use است. برنامهٔ
macOS می‌تواند یک سوکت PeekabooBridge میزبانی کند تا CLI `peekaboo` بتواند
مجوزهای محلی Accessibility و Screen Recording برنامه را برای ابزارهای خودکارسازی
خود Peekaboo دوباره استفاده کند. آن bridge، Codex Computer Use را نصب یا proxy
نمی‌کند، و Codex Computer Use از طریق سوکت PeekabooBridge فراخوانی نمی‌کند.

زمانی از [Peekaboo bridge](/fa/platforms/mac/peekaboo) استفاده کنید که می‌خواهید OpenClaw.app
یک میزبان آگاه به مجوز برای خودکارسازی Peekaboo CLI باشد. از این صفحه زمانی استفاده کنید که یک
عامل OpenClaw در حالت Codex باید پیش از شروع نوبت، Plugin بومی MCP
`computer-use` متعلق به Codex را در دسترس داشته باشد.

## برنامهٔ iOS

برنامهٔ iOS جدا از Codex Computer Use است. این برنامه سرور MCP
`computer-use` متعلق به Codex را نصب یا proxy نمی‌کند و backend کنترل میزکار نیست.
در عوض، برنامهٔ iOS به‌عنوان یک node OpenClaw متصل می‌شود و قابلیت‌های موبایل را
از طریق فرمان‌های node مانند `canvas.*`، `camera.*`، `screen.*`،
`location.*`، و `talk.*` در دسترس می‌گذارد.

زمانی از [iOS](/fa/platforms/ios) استفاده کنید که می‌خواهید یک عامل، یک node آیفون را از طریق
Gateway هدایت کند. از این صفحه زمانی استفاده کنید که یک عامل در حالت Codex باید میزکار محلی
macOS را از طریق Plugin بومی Computer Use متعلق به Codex کنترل کند.

## MCP مستقیم cua-driver

Codex Computer Use تنها راه ارائهٔ کنترل میزکار نیست. اگر می‌خواهید runtimeهای
مدیریت‌شده توسط OpenClaw مستقیماً driver متعلق به TryCua را فراخوانی کنند، به‌جای
جریان بازارچهٔ اختصاصی Codex، از سرور upstream `cua-driver mcp` از طریق
رجیستری MCP متعلق به OpenClaw استفاده کنید.

پس از نصب `cua-driver`، یا از آن فرمان OpenClaw را بخواهید:

```bash
cua-driver mcp-config --client openclaw
```

یا خودتان سرور stdio را ثبت کنید:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

این مسیر سطح ابزار MCP upstream را دست‌نخورده نگه می‌دارد، از جمله schemaهای driver
و پاسخ‌های ساختاریافتهٔ MCP. زمانی از آن استفاده کنید که می‌خواهید driver CUA
به‌عنوان یک سرور MCP معمولی OpenClaw در دسترس باشد. زمانی از راه‌اندازی Codex Computer Use
در این صفحه استفاده کنید که app-server Codex باید مالک نصب Plugin، reloadهای MCP،
و فراخوانی‌های ابزار بومی داخل نوبت‌های حالت Codex باشد.

driver متعلق به CUA مختص macOS است و همچنان به مجوزهای محلی macOS نیاز دارد
که برنامهٔ آن درخواست می‌کند، مانند Accessibility و Screen Recording. OpenClaw
`cua-driver` را نصب نمی‌کند، آن مجوزها را اعطا نمی‌کند، یا مدل ایمنی driver
upstream را دور نمی‌زند.

## راه‌اندازی سریع

وقتی نوبت‌های حالت Codex باید پیش از شروع یک thread، Computer Use را در دسترس داشته باشند،
`plugins.entries.codex.config.computerUse` را تنظیم کنید. `autoInstall: true`
Computer Use را فعال می‌کند و به OpenClaw اجازه می‌دهد پیش از نوبت آن را نصب یا دوباره فعال کند:

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

با این config، OpenClaw پیش از هر نوبت حالت Codex، app-server Codex را بررسی می‌کند.
اگر Computer Use موجود نباشد اما app-server Codex از قبل یک بازارچهٔ قابل نصب را
کشف کرده باشد، OpenClaw از app-server Codex می‌خواهد Plugin را نصب یا دوباره فعال کند
و سرورهای MCP را reload کند. در macOS، وقتی هیچ بازارچهٔ منطبقی ثبت نشده باشد
و bundle استاندارد برنامهٔ Codex وجود داشته باشد، OpenClaw همچنین تلاش می‌کند
پیش از شکست، بازارچهٔ بسته‌بندی‌شدهٔ Codex را از
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` ثبت کند.
اگر راه‌اندازی همچنان نتواند سرور MCP را در دسترس کند، نوبت پیش از شروع thread
شکست می‌خورد.

پس از تغییر config مربوط به Computer Use، اگر یک thread موجود Codex از قبل شروع شده است،
پیش از آزمایش در chat مربوطه از `/new` یا `/reset` استفاده کنید.

در راه‌اندازی stdio مدیریت‌شده در macOS، وقتی bundle برنامهٔ امضاشدهٔ میزکار Codex در
`/Applications/Codex.app/Contents/Resources/codex` وجود داشته باشد، OpenClaw آن را ترجیح می‌دهد.
این کار Computer Use را زیر bundle برنامه‌ای نگه می‌دارد که مالک مجوزهای کنترل میزکار محلی است.
اگر برنامهٔ میزکار نصب نشده باشد، OpenClaw به binary مدیریت‌شدهٔ Codex که کنار Plugin نصب شده است
fallback می‌کند. اگر یک برنامهٔ میزکار نصب‌شده با نسخهٔ app-server پشتیبانی‌نشده initialize شود،
OpenClaw آن child را می‌بندد و به‌جای اینکه اجازه دهد یک برنامهٔ میزکار stale fallback محلی Plugin را
پنهان کند، candidate بعدی binary مدیریت‌شده را دوباره امتحان می‌کند. config صریح
`appServer.command` یا `OPENCLAW_CODEX_APP_SERVER_BIN` همچنان این انتخاب مدیریت‌شده را override می‌کند.

## فرمان‌ها

از فرمان‌های `/codex computer-use` از هر سطح chat که سطح فرمان Plugin `codex`
در دسترس است استفاده کنید. این‌ها فرمان‌های chat/runtime در OpenClaw هستند،
نه subcommandهای CLI به شکل `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` فقط خواندنی است. منبع بازارچه اضافه نمی‌کند، Plugin نصب نمی‌کند، یا
پشتیبانی Plugin در Codex را فعال نمی‌کند. اگر هیچ configی Computer Use را opt in نکند،
`status` می‌تواند حتی پس از یک فرمان نصب تک‌باره، disabled گزارش دهد.

`install` پشتیبانی Plugin در app-server Codex را فعال می‌کند، به‌صورت اختیاری یک
منبع بازارچهٔ پیکربندی‌شده اضافه می‌کند، Plugin پیکربندی‌شده را از طریق app-server Codex
نصب یا دوباره فعال می‌کند، سرورهای MCP را reload می‌کند، و بررسی می‌کند که سرور MCP
ابزارها را ارائه می‌دهد.

## انتخاب‌های بازارچه

OpenClaw از همان API app-server استفاده می‌کند که خود Codex ارائه می‌دهد. فیلدهای
بازارچه انتخاب می‌کنند که Codex باید `computer-use` را کجا پیدا کند.

| فیلد                 | چه زمانی استفاده شود                                         | پشتیبانی نصب                                             |
| -------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| بدون فیلد بازارچه    | می‌خواهید app-server Codex از بازارچه‌هایی استفاده کند که از قبل می‌شناسد. | بله، وقتی app-server یک بازارچهٔ محلی برگرداند.        |
| `marketplaceSource`  | یک منبع بازارچهٔ Codex دارید که app-server می‌تواند اضافه کند. | بله، برای `/codex computer-use install` صریح.           |
| `marketplacePath`    | از قبل مسیر فایل بازارچهٔ محلی روی host را می‌دانید.          | بله، برای نصب صریح و نصب خودکار در شروع نوبت.           |
| `marketplaceName`    | می‌خواهید یک بازارچهٔ از قبل ثبت‌شده را با نام انتخاب کنید.  | فقط وقتی بازارچهٔ انتخاب‌شده یک مسیر محلی داشته باشد. |

خانه‌های تازهٔ Codex ممکن است برای seed کردن بازارچه‌های رسمی خود به لحظه‌ای کوتاه نیاز داشته باشند.
هنگام نصب، OpenClaw تا
`marketplaceDiscoveryTimeoutMs` میلی‌ثانیه `plugin/list` را poll می‌کند. مقدار پیش‌فرض ۶۰ ثانیه است.

اگر چند بازارچهٔ شناخته‌شده شامل Computer Use باشند، OpenClaw ابتدا
`openai-bundled`، سپس `openai-curated`، سپس `local` را ترجیح می‌دهد. matchهای مبهم ناشناخته
fail closed می‌شوند و از شما می‌خواهند `marketplaceName` یا `marketplacePath` را تنظیم کنید.

## بازارچهٔ بسته‌بندی‌شدهٔ macOS

buildهای اخیر میزکار Codex، Computer Use را اینجا bundle می‌کنند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

وقتی `computerUse.autoInstall` true باشد و هیچ بازارچه‌ای که شامل
`computer-use` باشد ثبت نشده باشد، OpenClaw تلاش می‌کند root استاندارد بازارچهٔ
bundleشده را به‌صورت خودکار اضافه کند:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

همچنین می‌توانید آن را صراحتاً از یک shell با Codex ثبت کنید:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

اگر از مسیر غیر استاندارد برنامهٔ Codex استفاده می‌کنید، یک بار `/codex computer-use install
--source <marketplace-root>` را اجرا کنید یا `computerUse.marketplacePath` را روی یک
مسیر فایل بازارچهٔ محلی تنظیم کنید. فقط زمانی از `--marketplace-path` استفاده کنید که
مسیر فایل JSON بازارچه را دارید، نه root بازارچهٔ bundleشده.

## محدودیت catalog راه دور

app-server Codex می‌تواند entryهای catalog فقط راه دور را فهرست و بخواند، اما در حال حاضر
از `plugin/install` راه دور پشتیبانی نمی‌کند. یعنی `marketplaceName` می‌تواند
یک بازارچهٔ فقط راه دور را برای بررسی‌های status انتخاب کند، اما نصب‌ها و فعال‌سازی‌های دوباره
همچنان به یک بازارچهٔ محلی از طریق `marketplaceSource` یا `marketplacePath` نیاز دارند.

اگر status می‌گوید Plugin در یک بازارچهٔ راه دور Codex در دسترس است اما نصب راه دور
پشتیبانی نمی‌شود، install را با یک منبع یا مسیر محلی اجرا کنید:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع پیکربندی

| فیلد                            | پیش‌فرض       | معنی                                                                          |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use را الزامی می‌کند. وقتی فیلد دیگری از Computer Use تنظیم شده باشد، پیش‌فرض true است. |
| `autoInstall`                   | false          | در شروع نوبت از بازارچه‌های از قبل کشف‌شده نصب یا دوباره فعال می‌کند.        |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدت زمانی که install منتظر کشف بازارچه توسط app-server Codex می‌ماند.        |
| `marketplaceSource`             | unset          | رشتهٔ منبعی که به `marketplace/add` در app-server Codex ارسال می‌شود.        |
| `marketplacePath`               | unset          | مسیر فایل بازارچهٔ محلی Codex که شامل Plugin است.                            |
| `marketplaceName`               | unset          | نام بازارچهٔ ثبت‌شدهٔ Codex برای انتخاب.                                      |
| `pluginName`                    | `computer-use` | نام Plugin بازارچهٔ Codex.                                                     |
| `mcpServerName`                 | `computer-use` | نام سرور MCP که توسط Plugin نصب‌شده ارائه می‌شود.                             |

نصب خودکار در شروع نوبت، عمداً مقدارهای پیکربندی‌شدهٔ `marketplaceSource` را رد می‌کند.
افزودن یک منبع جدید یک عملیات راه‌اندازی صریح است، بنابراین یک بار از
`/codex computer-use install --source <marketplace-source>` استفاده کنید، سپس بگذارید
`autoInstall` فعال‌سازی‌های دوبارهٔ آینده را از بازارچه‌های محلی کشف‌شده انجام دهد.
نصب خودکار در شروع نوبت می‌تواند از `marketplacePath` پیکربندی‌شده استفاده کند، زیرا آن
از قبل یک مسیر محلی روی host است.

## OpenClaw چه چیزهایی را بررسی می‌کند

OpenClaw یک دلیل راه‌اندازی پایدار را به‌صورت داخلی گزارش می‌کند و status قابل مشاهده برای کاربر را
برای chat قالب‌بندی می‌کند:

| دلیل                        | معنی                                                   | گام بعدی                                      |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` به false resolve شد.             | `enabled` یا فیلد دیگری از Computer Use را تنظیم کنید. |
| `marketplace_missing`        | هیچ marketplace منطبقی در دسترس نبود.                 | source، path، یا نام marketplace را پیکربندی کنید. |
| `plugin_not_installed`       | Marketplace وجود دارد، اما plugin نصب نشده است.        | install را اجرا کنید یا `autoInstall` را فعال کنید. |
| `plugin_disabled`            | Plugin نصب شده اما در پیکربندی Codex غیرفعال است.     | install را اجرا کنید تا دوباره فعال شود.     |
| `remote_install_unsupported` | marketplace انتخاب‌شده فقط remote است.                 | از `marketplaceSource` یا `marketplacePath` استفاده کنید. |
| `mcp_missing`                | Plugin فعال است، اما سرور MCP در دسترس نیست.           | Computer Use در Codex و مجوزهای سیستم‌عامل را بررسی کنید. |
| `ready`                      | Plugin و ابزارهای MCP در دسترس هستند.                 | نوبت حالت Codex را شروع کنید.                |
| `check_failed`               | یک درخواست app-server در Codex هنگام بررسی وضعیت شکست خورد. | اتصال‌پذیری و لاگ‌های app-server را بررسی کنید. |
| `auto_install_blocked`       | آماده‌سازی آغاز نوبت نیاز داشت یک source جدید اضافه کند. | ابتدا install صریح را اجرا کنید.             |

خروجی چت شامل وضعیت plugin، وضعیت سرور MCP، marketplace، ابزارها در صورت
دردسترس‌بودن، و پیام مشخص برای گام ناموفق آماده‌سازی است.

## مجوزهای macOS

Computer Use ویژه macOS است. سرور MCP متعلق به Codex ممکن است پیش از آنکه
بتواند برنامه‌ها را بررسی یا کنترل کند، به مجوزهای محلی سیستم‌عامل نیاز داشته
باشد. اگر OpenClaw می‌گوید Computer Use نصب شده اما سرور MCP در دسترس نیست،
ابتدا راه‌اندازی Computer Use در سمت Codex را بررسی کنید:

- app-server در Codex روی همان میزبانی اجرا می‌شود که کنترل دسکتاپ باید در آن
  انجام شود.
- Plugin مربوط به Computer Use در پیکربندی Codex فعال است.
- سرور MCP با نام `computer-use` در وضعیت MCP مربوط به app-server در Codex
  دیده می‌شود.
- macOS مجوزهای لازم را برای برنامه کنترل دسکتاپ اعطا کرده است.
- نشست فعلی میزبان می‌تواند به دسکتاپ تحت کنترل دسترسی داشته باشد.

OpenClaw وقتی `computerUse.enabled` برابر true است، عمداً در حالت بسته شکست
می‌خورد. یک نوبت حالت Codex نباید بدون ابزارهای بومی دسکتاپ که پیکربندی لازم
دانسته است، بی‌صدا ادامه پیدا کند.

## عیب‌یابی

**وضعیت می‌گوید نصب نشده است.** `/codex computer-use install` را اجرا کنید. اگر
marketplace کشف نشد، `--source` یا `--marketplace-path` را پاس دهید.

**وضعیت می‌گوید نصب شده اما غیرفعال است.** دوباره `/codex computer-use install`
را اجرا کنید. نصب app-server در Codex پیکربندی plugin را دوباره با حالت فعال
می‌نویسد.

**وضعیت می‌گوید نصب remote پشتیبانی نمی‌شود.** از یک source یا path محلی برای
marketplace استفاده کنید. ورودی‌های کاتالوگ فقط remote را می‌توان بررسی کرد،
اما از طریق API فعلی app-server نمی‌توان نصب کرد.

**وضعیت می‌گوید سرور MCP در دسترس نیست.** یک‌بار دیگر install را اجرا کنید تا
سرورهای MCP دوباره بارگذاری شوند. اگر همچنان در دسترس نبود، برنامه Computer Use
در Codex، وضعیت MCP مربوط به app-server در Codex، یا مجوزهای macOS را اصلاح
کنید.

**وضعیت یا یک probe روی `computer-use.list_apps` زمان‌تمام می‌شود.** Plugin و
سرور MCP حاضر هستند، اما bridge محلی Computer Use پاسخ نداد. از Codex Computer
Use خارج شوید یا آن را restart کنید، در صورت نیاز Codex Desktop را دوباره اجرا
کنید، سپس در یک نشست تازه OpenClaw دوباره تلاش کنید. اگر میزبان قبلاً Computer
Use را از طریق یک app-server مدیریت‌شده قدیمی‌تر در Codex اجرا کرده است، plugin
نصب‌شده را از marketplace بسته‌بندی‌شده همراه دسکتاپ تازه‌سازی کنید:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**یک ابزار Computer Use می‌گوید `Native hook relay unavailable`.** hook ابزار
بومی Codex نتوانست از طریق bridge محلی یا fallback مربوط به Gateway به یک relay
فعال OpenClaw برسد. یک نشست تازه OpenClaw را با `/new` یا `/reset` شروع کنید.
اگر یک‌بار کار کرد و سپس در فراخوانی ابزار بعدی دوباره شکست خورد، `/new` فقط
تلاش فعلی را پاک می‌کند؛ app-server در Codex یا OpenClaw Gateway را restart
کنید تا threadهای قدیمی و ثبت‌های hook حذف شوند، سپس در یک نشست تازه دوباره
تلاش کنید.

**auto-install در آغاز نوبت یک source را رد می‌کند.** این عمدی است. ابتدا source
را با `/codex computer-use install --source <marketplace-source>` صریح اضافه
کنید، سپس auto-install آغاز نوبت در آینده می‌تواند از marketplace محلی
کشف‌شده استفاده کند.

## مرتبط

- [harness در Codex](/fa/plugins/codex-harness)
- [bridge مربوط به Peekaboo](/fa/platforms/mac/peekaboo)
- [برنامه iOS](/fa/platforms/ios)
