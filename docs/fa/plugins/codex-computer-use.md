---
read_when:
    - می‌خواهید عامل‌های OpenClaw در حالت Codex از قابلیت استفاده از رایانه در Codex بهره ببرند
    - شما در حال انتخاب میان Codex Computer Use، PeekabooBridge و MCP مستقیم cua-driver هستید
    - شما در حال پیکربندی `computerUse` برای Plugin همراه Codex هستید
    - در حال عیب‌یابی وضعیت یا نصب قابلیت استفاده از رایانه در ‎/codex‎ هستید
summary: راه‌اندازی قابلیت استفاده از رایانه در Codex برای عامل‌های OpenClaw در حالت Codex
title: کاربرد رایانه‌ای Codex
x-i18n:
    generated_at: "2026-07-12T10:23:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use یک Plugin بومی Codex برای MCP و کنترل دسکتاپ محلی است. OpenClaw
برنامهٔ دسکتاپ را همراه خود عرضه نمی‌کند، اقدامات دسکتاپ را مستقیماً اجرا نمی‌کند و
مجوزهای Codex را دور نمی‌زند. Plugin همراه `codex` فقط app-server متعلق به Codex را آماده می‌کند:
پشتیبانی از Pluginهای Codex را فعال می‌کند، Plugin پیکربندی‌شدهٔ Computer Use را می‌یابد
یا نصب می‌کند، در دسترس بودن سرور MCP با نام `computer-use` را بررسی می‌کند و سپس
در نوبت‌های حالت Codex، مالکیت فراخوانی‌های بومی ابزار MCP را به Codex می‌سپارد.

زمانی از این صفحه استفاده کنید که OpenClaw از قبل از چارچوب بومی Codex استفاده می‌کند. برای
راه‌اندازی خود محیط اجرا، به [چارچوب Codex](/fa/plugins/codex-harness) مراجعه کنید.

این قابلیت با [ابزار رایانهٔ داخلی مبتنی بر Node](/fa/nodes/computer-use) در OpenClaw متفاوت است. زمانی از ابزار داخلی استفاده کنید که قرارداد یکسان عامل باید یک Mac جفت‌شده را کنترل کند، چه عامل روی Gateway اجرا شود و چه روی Node دیگری. زمانی از Codex Computer Use استفاده کنید که app-server متعلق به Codex باید نصب محلی MCP، مجوزها و فراخوانی‌های بومی ابزار را مدیریت کند.

## OpenClaw.app و Peekaboo

یکپارچه‌سازی Peekaboo در OpenClaw.app از Codex Computer Use جدا است.
برنامهٔ macOS می‌تواند یک سوکت PeekabooBridge میزبانی کند تا CLI مربوط به `peekaboo` بتواند
مجوزهای محلی دسترس‌پذیری و ضبط صفحهٔ برنامه را برای ابزارهای خودکارسازی خود Peekaboo
دوباره استفاده کند. آن پل، Codex Computer Use را نصب یا پروکسی نمی‌کند و
Codex Computer Use نیز از طریق سوکت PeekabooBridge فراخوانی انجام نمی‌دهد.

زمانی از [پل Peekaboo](/fa/platforms/mac/peekaboo) استفاده کنید که می‌خواهید OpenClaw.app
میزبانی آگاه از مجوز برای خودکارسازی CLI مربوط به Peekaboo باشد. زمانی از این صفحه استفاده کنید که
یک عامل OpenClaw در حالت Codex باید پیش از آغاز نوبت، به Plugin بومی MCP با نام
`computer-use` در Codex دسترسی داشته باشد.

## برنامهٔ iOS

برنامهٔ iOS از Codex Computer Use جدا است. این برنامه سرور MCP با نام
`computer-use` در Codex را نصب یا پروکسی نمی‌کند و یک بخش پشتیبان کنترل دسکتاپ نیست.
در عوض، برنامهٔ iOS به‌عنوان یک Node در OpenClaw متصل می‌شود و قابلیت‌های همراه را
از طریق فرمان‌های Node مانند `canvas.*`، `camera.*`، `screen.*`،
`location.*` و `talk.*` ارائه می‌کند.

زمانی از [iOS](/fa/platforms/ios) استفاده کنید که می‌خواهید یک عامل از طریق Gateway
یک Node آیفون را کنترل کند. زمانی از این صفحه استفاده کنید که یک عامل در حالت Codex
باید دسکتاپ محلی macOS را از طریق Plugin بومی Computer Use در Codex کنترل کند.

## MCP مستقیم cua-driver

Codex Computer Use تنها راه ارائهٔ کنترل دسکتاپ نیست. اگر می‌خواهید
محیط‌های اجرای مدیریت‌شده توسط OpenClaw مستقیماً درایور TryCua را فراخوانی کنند، به‌جای
جریان بازارچهٔ مختص Codex، از سرور بالادستی `cua-driver mcp` از طریق
دفتر ثبت MCP در OpenClaw استفاده کنید.

پس از نصب `cua-driver`، یا از آن بخواهید فرمان OpenClaw را ارائه کند:

```bash
cua-driver mcp-config --client openclaw
```

یا سرور stdio را مستقیماً ثبت کنید:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

این مسیر سطح ابزار MCP بالادستی را، از جمله طرح‌واره‌های درایور
و پاسخ‌های ساختاریافتهٔ MCP، دست‌نخورده نگه می‌دارد. زمانی از آن استفاده کنید که می‌خواهید
درایور CUA به‌عنوان یک سرور عادی MCP در OpenClaw در دسترس باشد. زمانی از راه‌اندازی
Codex Computer Use در این صفحه استفاده کنید که app-server متعلق به Codex باید نصب Plugin،
بارگذاری مجدد MCP و فراخوانی‌های بومی ابزار را درون نوبت‌های حالت Codex مدیریت کند.

درایور CUA مختص macOS است و همچنان به مجوزهای محلی macOS که برنامهٔ آن درخواست می‌کند،
مانند دسترس‌پذیری و ضبط صفحه، نیاز دارد. OpenClaw برنامهٔ `cua-driver` را
نصب نمی‌کند، آن مجوزها را اعطا نمی‌کند و مدل ایمنی درایور بالادستی را دور نمی‌زند.

## راه‌اندازی سریع

زمانی که نوبت‌های حالت Codex باید پیش از آغاز یک رشته به Computer Use دسترسی داشته باشند،
`plugins.entries.codex.config.computerUse` را تنظیم کنید. گزینهٔ `autoInstall: true`
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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

با این پیکربندی، OpenClaw پیش از هر نوبت حالت Codex، app-server متعلق به Codex را
بررسی می‌کند. اگر Computer Use موجود نباشد اما app-server متعلق به Codex از قبل
یک بازارچهٔ قابل نصب را کشف کرده باشد، OpenClaw از app-server متعلق به Codex می‌خواهد
Plugin را نصب یا دوباره فعال کند و سرورهای MCP را مجدداً بارگذاری کند. در macOS،
وقتی هیچ بازارچهٔ منطبقی ثبت نشده باشد و یک بستهٔ استاندارد برنامهٔ دسکتاپ وجود داشته باشد،
OpenClaw همچنین تلاش می‌کند بازارچهٔ همراه Codex را از مسیر
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` ثبت کند و
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` را
به‌عنوان مسیر جایگزین برای نصب‌های مستقل قدیمی نگه می‌دارد. اگر راه‌اندازی همچنان نتواند
سرور MCP را در دسترس قرار دهد، نوبت پیش از آغاز رشته با شکست مواجه می‌شود.

پس از تغییر پیکربندی Computer Use، اگر یک رشتهٔ موجود Codex از قبل آغاز شده است،
پیش از آزمایش در گفت‌وگوی مربوطه از `/new` یا `/reset` استفاده کنید.

در macOS، راه‌اندازی مدیریت‌شدهٔ Computer Use ابتدا فایل اجرایی برنامهٔ دسکتاپ در
`/Applications/ChatGPT.app/Contents/Resources/codex` را ترجیح می‌دهد و سپس
برای نصب‌های مستقل قدیمی به
`/Applications/Codex.app/Contents/Resources/codex` بازمی‌گردد.
این قاعده برای فرمان‌های یک‌بارهٔ وضعیت و نصب Computer Use که کارخواه خود را
راه‌اندازی می‌کنند نیز اعمال می‌شود. این کار کنترل دسکتاپ را زیر نظر بستهٔ برنامه‌ای نگه می‌دارد
که مالک مجوزهای محلی macOS است. اگر برنامهٔ دسکتاپ نصب نشده باشد،
OpenClaw به فایل اجرایی مدیریت‌شدهٔ Codex که کنار Plugin نصب شده است بازمی‌گردد.
نوبت‌های عادی مدیریت‌شدهٔ Codex با خانهٔ پیش‌فرض و ایزولهٔ عامل، ابتدا آن بستهٔ
سنجاق‌شده را ترجیح می‌دهند تا یک برنامهٔ دسکتاپ قدیمی نتواند پشتیبانی از مدل‌های فعلی را
تحت‌الشعاع قرار دهد. خانه‌های محدودهٔ کاربر همچنان ابتدا دسکتاپ را ترجیح می‌دهند، زیرا
می‌توانند وضعیت بومی Computer Use را بارگذاری کنند. یک خانهٔ ایزولهٔ عامل که پیکربندی
مؤثر Codex آن، Computer Use را فعال می‌کند نیز ابتدا دسکتاپ را ترجیح می‌دهد.
پیکربندی صریح `appServer.command` یا `OPENCLAW_CODEX_APP_SERVER_BIN`
همچنان این انتخاب مدیریت‌شده را لغو می‌کند.

OpenClaw خواندن پیکربندی بومی Codex و نصب Computer Use را درون یک Gateway در حال اجرا
به‌صورت ترتیبی انجام می‌دهد. یک فرایند جداگانهٔ Codex یا Gateway دیگر بخشی از این
محدودهٔ انحصار نیست. پس از تغییر پیکربندی بومی Plugin در Codex خارج از Gateway،
Gateway را دوباره راه‌اندازی کنید و پیش از اتکا به انتخاب جدید، یک گفت‌وگوی تازه آغاز کنید.

## فرمان‌ها

از فرمان‌های `/codex computer-use` در هر سطح گفت‌وگویی استفاده کنید که
سطح فرمان Plugin با نام `codex` در آن در دسترس است. این‌ها فرمان‌های گفت‌وگو/محیط اجرای
OpenClaw هستند، نه زیرفرمان‌های CLI به‌شکل `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` اقدام پیش‌فرض و فقط‌خواندنی است: منبع بازارچه اضافه نمی‌کند،
Plugin نصب نمی‌کند و پشتیبانی از Pluginهای Codex را فعال نمی‌کند. اگر هیچ پیکربندی‌ای
Computer Use را فعال نکند، `status` ممکن است حتی پس از اجرای یک فرمان نصب یک‌باره،
وضعیت غیرفعال را گزارش کند.

`install` پشتیبانی از Pluginهای app-server متعلق به Codex را فعال می‌کند، در صورت نیاز
یک منبع بازارچهٔ پیکربندی‌شده را اضافه می‌کند، Plugin پیکربندی‌شده را از طریق app-server
متعلق به Codex نصب یا دوباره فعال می‌کند، سرورهای MCP را مجدداً بارگذاری می‌کند و
بررسی می‌کند که سرور MCP ابزارها را ارائه می‌دهد. از آنجا که نصب، منابع مورد اعتماد میزبان
را تغییر می‌دهد، فقط مالک یا یک کارخواه Gateway با نقش `operator.admin` می‌تواند
`install` را اجرا کند. سایر فرستندگان مجاز همچنان می‌توانند از فرمان فقط‌خواندنی
`status`، از جمله همراه با مقادیر بازنویسی، استفاده کنند.

نسخه‌های قدیمی‌تر مقادیر بازنویسی یک‌بارهٔ هویت با `--plugin`، `--server` و
`--mcp-server` را می‌پذیرفتند. در عوض، `computerUse.pluginName` و
`computerUse.mcpServerName` را به‌صورت پایدار پیکربندی کنید. هنگامی که یک پرچم
قدیمی هویت استفاده شود، فرمان تنظیم دقیق موردنیاز برای ذخیره‌سازی را مشخص می‌کند و
در راهنمای مهاجرت خود، اقدام درخواستی را همراه با هر پرچم پشتیبانی‌شدهٔ بازارچه تکرار می‌کند.

## گزینه‌های بازارچه

OpenClaw از همان API مربوط به app-server استفاده می‌کند که خود Codex ارائه می‌دهد.
فیلدهای بازارچه تعیین می‌کنند Codex باید `computer-use` را در کجا پیدا کند.

| فیلد                 | زمان استفاده                                                     | پشتیبانی نصب                                                  |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| بدون فیلد بازارچه    | می‌خواهید app-server متعلق به Codex از بازارچه‌هایی استفاده کند که از قبل می‌شناسد. | بله، وقتی app-server یک بازارچهٔ محلی برگرداند.               |
| `marketplaceSource`  | یک منبع بازارچهٔ Codex دارید که app-server می‌تواند اضافه کند.   | بله، برای `/codex computer-use install` صریح.                 |
| `marketplacePath`    | مسیر محلی فایل بازارچه روی میزبان را از قبل می‌دانید.            | بله، برای نصب صریح و نصب خودکار هنگام آغاز نوبت.              |
| `marketplaceName`    | می‌خواهید یک بازارچهٔ از قبل ثبت‌شده را با نام انتخاب کنید.       | فقط زمانی بله که بازارچهٔ انتخاب‌شده مسیر محلی داشته باشد.   |

خانه‌های تازهٔ Codex ممکن است برای مقداردهی اولیهٔ بازارچه‌های رسمی خود به زمان کوتاهی
نیاز داشته باشند. هنگام نصب، OpenClaw تا `marketplaceDiscoveryTimeoutMs`
میلی‌ثانیه (پیش‌فرض ۶۰ ثانیه) `plugin/list` را به‌طور دوره‌ای بررسی می‌کند.

اگر چند بازارچهٔ شناخته‌شده حاوی Computer Use باشند، OpenClaw ابتدا
`openai-bundled`، سپس `openai-curated` و بعد `local` را ترجیح می‌دهد.
انطباق‌های ناشناخته و مبهم به‌صورت امن رد می‌شوند و از شما می‌خواهند
`marketplaceName` یا `marketplacePath` را تنظیم کنید.

## بازارچهٔ همراه macOS

نسخه‌های فعلی دسکتاپ ChatGPT، Computer Use را در این مسیر همراه دارند؛ نسخه‌های قدیمی
و مستقل دسکتاپ Codex نیز از همین چیدمان زیر `Codex.app` استفاده می‌کنند:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

وقتی `computerUse.autoInstall` برابر true باشد و هیچ بازارچه‌ای که شامل
`computer-use` است ثبت نشده باشد، OpenClaw تلاش می‌کند نخستین ریشهٔ استاندارد
بازارچهٔ همراه را که وجود دارد اضافه کند:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

همچنین می‌توانید آن را به‌طور صریح از پوسته و با Codex ثبت کنید:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

اگر از مسیر غیراستاندارد برنامهٔ Codex استفاده می‌کنید، یک‌بار
`/codex computer-use install --source <marketplace-root>` را اجرا کنید یا
`computerUse.marketplacePath` را روی مسیر محلی فایل بازارچه تنظیم کنید.
فقط زمانی از `--marketplace-path` استفاده کنید که مسیر فایل JSON بازارچه را دارید،
نه ریشهٔ بازارچهٔ همراه را.

### حافظهٔ نهان مشترک Plugin

مقدار پیش‌فرض `pluginCacheMode: "independent"` هر خانهٔ Codex و حافظهٔ نهان
Plugin آن را مدیریت‌نشده باقی می‌گذارد. `pluginCacheMode: "shared"` را تنظیم کنید تا
Plugin همراه Computer Use پیش از راه‌اندازی app-server در حافظهٔ نهان قابل کشف Plugin
در خانهٔ فعال Codex کپی شود. حالت مشترک نسخه‌های قدیمی‌تر ذخیره‌شده در حافظهٔ نهان را
حفظ می‌کند، زیرا کارخواه‌های در حال اجرای Codex ممکن است همچنان به پوشه‌های نسخه‌بندی‌شدهٔ
Plugin خود ارجاع دهند؛ شکست در کپی جایگزین نیز حافظهٔ نهان فعال را حفظ می‌کند.
پیکربندی صریح `marketplaceName` یا `marketplacePath` این همگام‌سازی را غیرفعال
می‌کند تا OpenClaw آن انتخاب را بازنویسی نکند.

## محدودیت فهرست راه‌دور

app-server متعلق به Codex می‌تواند ورودی‌های فهرستِ فقط راه‌دور را نمایش دهد و بخواند،
اما در حال حاضر از `plugin/install` راه‌دور پشتیبانی نمی‌کند. در نتیجه،
`marketplaceName` می‌تواند برای بررسی وضعیت، یک بازارچهٔ فقط راه‌دور را انتخاب کند،
اما نصب و فعال‌سازی مجدد همچنان به یک بازارچهٔ محلی از طریق
`marketplaceSource` یا `marketplacePath` نیاز دارد.

اگر وضعیت اعلام کرد که Plugin در یک بازارچهٔ راه‌دور Codex در دسترس است، اما نصب راه‌دور
پشتیبانی نمی‌شود، نصب را با یک منبع یا مسیر محلی اجرا کنید:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع پیکربندی

| فیلد                           | پیش‌فرض        | مفهوم                                                                                 |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| `enabled`                       | استنباط‌شده    | استفاده از رایانه را الزامی می‌کند. وقتی فیلد دیگری از استفاده از رایانه تنظیم شده باشد، مقدار پیش‌فرض true است. |
| `autoInstall`                   | false          | در آغاز نوبت، از بازارگاه‌های ازپیش کشف‌شده نصب یا دوباره فعال می‌کند.                 |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدت‌زمان انتظار نصب برای کشف بازارگاه توسط app-server در Codex.                       |
| `liveTestTimeoutMs`             | 60000          | مهلت زمانی ریسهٔ موقت آمادگی و درخواست‌های پاک‌سازی آن.                               |
| `toolCallTimeoutMs`             | 60000          | مهلت زمانی فراخوانی ابزار آمادگی `list_apps` در استفاده از رایانه.                    |
| `healthCheckEnabled`            | false          | تا زمانی که کلاینت app-server مالک فعال است، کاوش‌های دوره‌ای آمادگی را اجرا می‌کند.  |
| `healthCheckIntervalMinutes`    | 60             | تناوب کاوش؛ مقادیر پذیرفته‌شده 30، 60، 120 یا 240 دقیقه هستند.                        |
| `pluginCacheMode`               | `independent`  | برای تازه‌سازی حافظهٔ نهان خانهٔ Codex از Plugin دسکتاپ همراه، از `shared` استفاده کنید. |
| `strictReadiness`               | false          | در صورت شکست کاوش زنده، به‌جای ادامه با هشدار، راه‌اندازی را متوقف می‌کند.            |
| `autoRepair`                    | false          | فرایندهای فرزند MCP منقضی‌شده و محدودشده به استفاده از رایانه را می‌بندد و کاوش ناموفق را یک بار تکرار می‌کند. |
| `marketplaceSource`             | تنظیم‌نشده     | رشتهٔ منبعی که به `marketplace/add` در app-server متعلق به Codex ارسال می‌شود.         |
| `marketplacePath`               | تنظیم‌نشده     | مسیر فایل بازارگاه محلی Codex که حاوی Plugin است.                                     |
| `marketplaceName`               | تنظیم‌نشده     | نام بازارگاه ثبت‌شدهٔ Codex که باید انتخاب شود.                                       |
| `pluginName`                    | `computer-use` | نام Plugin در بازارگاه Codex.                                                         |
| `mcpServerName`                 | `computer-use` | نام سرور MCP ارائه‌شده توسط Plugin نصب‌شده.                                           |

نصب خودکار در آغاز نوبت عمداً مقادیر پیکربندی‌شدهٔ `marketplaceSource` را
نمی‌پذیرد. افزودن منبع جدید یک عملیات راه‌اندازی صریح است؛ بنابراین یک بار از
`/codex computer-use install --source <marketplace-source>` استفاده کنید و سپس
اجازه دهید `autoInstall` فعال‌سازی‌های مجدد آینده را از بازارگاه‌های محلی
کشف‌شده انجام دهد. نصب خودکار در آغاز نوبت می‌تواند از `marketplacePath`
پیکربندی‌شده استفاده کند، زیرا آن مسیر از قبل روی میزبان محلی است.

هر فیلد همچنین یک متغیر محیطی برای بازنویسی می‌پذیرد که وقتی کلید پیکربندی
منطبق تنظیم نشده باشد، بررسی می‌شود:

| فیلد                           | متغیر محیطی                                                    |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## مواردی که OpenClaw بررسی می‌کند

OpenClaw یک دلیل پایدار راه‌اندازی را به‌صورت داخلی گزارش می‌کند و وضعیت
نمایش‌داده‌شده به کاربر را برای گفت‌وگو قالب‌بندی می‌کند:

| دلیل                        | مفهوم                                                  | گام بعدی                                      |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | مقدار نهایی `computerUse.enabled` برابر false است.     | `enabled` یا فیلد دیگری از استفاده از رایانه را تنظیم کنید. |
| `marketplace_missing`        | هیچ بازارگاه منطبقی در دسترس نبود.                     | منبع، مسیر یا نام بازارگاه را پیکربندی کنید.  |
| `plugin_not_installed`       | بازارگاه وجود دارد، اما Plugin نصب نشده است.           | نصب را اجرا یا `autoInstall` را فعال کنید.    |
| `plugin_disabled`            | Plugin نصب شده اما در پیکربندی Codex غیرفعال است.      | برای فعال‌سازی دوباره، نصب را اجرا کنید.      |
| `remote_install_unsupported` | بازارگاه انتخاب‌شده فقط راه‌دور است.                   | از `marketplaceSource` یا `marketplacePath` استفاده کنید. |
| `mcp_missing`                | Plugin فعال است، اما سرور MCP در دسترس نیست.           | استفاده از رایانه در Codex و مجوزهای سیستم‌عامل را بررسی کنید. |
| `ready`                      | Plugin و ابزارهای MCP در دسترس هستند.                  | نوبت حالت Codex را آغاز کنید.                 |
| `check_failed`               | یک درخواست app-server در Codex هنگام بررسی وضعیت ناموفق بود. | اتصال app-server و گزارش‌ها را بررسی کنید.   |
| `auto_install_blocked`       | راه‌اندازی آغاز نوبت مستلزم افزودن منبع جدید است.      | ابتدا نصب صریح را اجرا کنید.                  |

خروجی گفت‌وگو شامل وضعیت Plugin، وضعیت سرور MCP، بازارگاه، ابزارها در صورت
دردسترس‌بودن و پیام اختصاصی گام ناموفق راه‌اندازی است.

## مجوزهای macOS

استفاده از رایانه مختص macOS است. سرور MCP متعلق به Codex ممکن است پیش از
بررسی یا کنترل برنامه‌ها به مجوزهای محلی سیستم‌عامل نیاز داشته باشد. اگر
OpenClaw اعلام می‌کند استفاده از رایانه نصب شده اما سرور MCP در دسترس نیست،
ابتدا راه‌اندازی استفاده از رایانه در سمت Codex را بررسی کنید:

- app-server در Codex روی همان میزبانی اجرا می‌شود که کنترل دسکتاپ باید در
  آن انجام شود.
- Plugin استفاده از رایانه در پیکربندی Codex فعال است.
- سرور MCP با نام `computer-use` در وضعیت MCP مربوط به app-server در Codex
  نمایش داده می‌شود.
- macOS مجوزهای لازم را به برنامهٔ کنترل دسکتاپ داده است.
- نشست فعلی میزبان می‌تواند به دسکتاپ تحت کنترل دسترسی داشته باشد.

وقتی `computerUse.enabled` برابر true باشد، OpenClaw عمداً با حالت بسته و
ایمن شکست می‌خورد. نوبت حالت Codex نباید بدون ابزارهای بومی دسکتاپ که
پیکربندی الزامی کرده است، بی‌سروصدا ادامه یابد.

## عیب‌یابی

**وضعیت می‌گوید نصب نشده است.** `/codex computer-use install` را اجرا کنید.
اگر بازارگاه کشف نمی‌شود، `--source` یا `--marketplace-path` را وارد کنید.

**وضعیت می‌گوید نصب شده اما غیرفعال است.** دوباره
`/codex computer-use install` را اجرا کنید. نصب app-server در Codex،
پیکربندی Plugin را با وضعیت فعال بازنویسی می‌کند.

**وضعیت می‌گوید نصب راه‌دور پشتیبانی نمی‌شود.** از یک منبع یا مسیر بازارگاه
محلی استفاده کنید. ورودی‌های کاتالوگِ فقط راه‌دور را می‌توان بررسی کرد، اما
نمی‌توان آن‌ها را از طریق API فعلی app-server نصب کرد.

**وضعیت می‌گوید سرور MCP در دسترس نیست.** نصب را یک بار دیگر اجرا کنید تا
سرورهای MCP دوباره بارگذاری شوند. اگر همچنان در دسترس نبود، برنامهٔ استفاده
از رایانه در Codex، وضعیت MCP در app-server متعلق به Codex یا مجوزهای macOS
را اصلاح کنید.

**وضعیت یا یک کاوش روی `computer-use.list_apps` به پایان مهلت زمانی
می‌رسد.** Plugin و سرور MCP موجودند، اما پل محلی استفاده از رایانه پاسخ
نداده است. از استفاده از رایانه در Codex خارج شوید یا آن را بازراه‌اندازی
کنید، در صورت نیاز Codex Desktop را دوباره اجرا کنید و سپس در یک نشست تازهٔ
OpenClaw دوباره تلاش کنید. اگر میزبان قبلاً استفاده از رایانه را از طریق
یک app-server مدیریت‌شدهٔ قدیمی‌تر در Codex اجرا کرده است، Plugin نصب‌شده را
از بازارگاه همراه دسکتاپ تازه‌سازی کنید (برای نصب‌های مستقل دسکتاپ Codex از
مسیر `Codex.app` استفاده کنید):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**یک ابزار استفاده از رایانه می‌گوید `Native hook relay unavailable`.**
قلاب ابزار بومی Codex نتوانسته است از طریق پل محلی یا مسیر جایگزین Gateway
به یک رلهٔ فعال OpenClaw دسترسی پیدا کند. با `/new` یا `/reset` یک نشست تازهٔ
OpenClaw آغاز کنید. اگر یک بار کار می‌کند و سپس در فراخوانی ابزار بعدی دوباره
ناموفق می‌شود، `/new` فقط تلاش فعلی را پاک می‌کند؛ app-server در Codex یا
Gateway در OpenClaw را بازراه‌اندازی کنید تا ریسه‌های قدیمی و ثبت‌های قلاب
حذف شوند، سپس در یک نشست تازه دوباره تلاش کنید.

**نصب خودکار آغاز نوبت یک منبع را نمی‌پذیرد.** این رفتار عمدی است. ابتدا
منبع را به‌طور صریح با `/codex computer-use install --source
<marketplace-source>` اضافه کنید؛ سپس نصب خودکار آغاز نوبت در آینده می‌تواند
از بازارگاه محلی کشف‌شده استفاده کند.

## مرتبط

- [سامانهٔ اجرایی Codex](/fa/plugins/codex-harness)
- [پل Peekaboo](/fa/platforms/mac/peekaboo)
- [برنامهٔ iOS](/fa/platforms/ios)
