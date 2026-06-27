---
read_when:
    - اجرای Gateway از CLI (توسعه یا سرورها)
    - اشکال‌زدایی احراز هویت Gateway، حالت‌های bind و اتصال
    - کشف Gatewayها از طریق Bonjour (DNS-SD محلی + گسترده‌ناحیه‌ای)
sidebarTitle: Gateway
summary: CLI‏ Gateway OpenClaw (`openclaw gateway`) — اجرا، پرس‌وجو و کشف Gatewayها
title: Gateway
x-i18n:
    generated_at: "2026-06-27T17:24:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket در OpenClaw است (کانال‌ها، گره‌ها، نشست‌ها، هوک‌ها). زیرفرمان‌های این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="کشف Bonjour" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده‌ناحیه.
  </Card>
  <Card title="نمای کلی کشف" href="/fa/gateway/discovery">
    اینکه OpenClaw چگونه Gatewayها را اعلام و پیدا می‌کند.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration">
    کلیدهای پیکربندی Gateway در سطح بالا.
  </Card>
</CardGroup>

## اجرای Gateway

یک فرایند Gateway محلی اجرا کنید:

```bash
openclaw gateway
```

نام مستعار پیش‌زمینه:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="رفتار راه‌اندازی">
    - به‌طور پیش‌فرض، Gateway از شروع به کار خودداری می‌کند مگر اینکه `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم شده باشد. برای اجراهای موردی/توسعه از `--allow-unconfigured` استفاده کنید.
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` موجود نیست، آن را به‌عنوان پیکربندی خراب یا بازنویسی‌شده در نظر بگیرید و به‌جای فرض ضمنی حالت محلی، آن را تعمیر کنید.
    - اگر فایل وجود دارد و `gateway.mode` موجود نیست، Gateway این وضعیت را آسیب مشکوک به پیکربندی تلقی می‌کند و از «حدس‌زدن local» برای شما خودداری می‌کند.
    - اتصال فراتر از loopback بدون احراز هویت مسدود می‌شود (حفاظ ایمنی).
    - `lan`، `tailnet` و `custom` در حال حاضر روی مسیرهای BYOH فقط IPv4 حل می‌شوند.
    - BYOH فقط IPv6 امروز به‌صورت بومی در این مسیر پشتیبانی نمی‌شود. اگر خود میزبان فقط IPv6 است، از یک سایدکار یا پراکسی IPv4 استفاده کنید.
    - `SIGUSR1` در صورت مجاز بودن، یک راه‌اندازی مجدد درون‌فرایندی را فعال می‌کند (`commands.restart` به‌طور پیش‌فرض فعال است؛ برای مسدود کردن راه‌اندازی مجدد دستی `commands.restart: false` را تنظیم کنید، در حالی که اعمال/به‌روزرسانی ابزار و پیکربندی Gateway همچنان مجاز می‌ماند).
    - هندلرهای `SIGINT`/`SIGTERM` فرایند Gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی ترمینال را بازیابی نمی‌کنند. اگر CLI را با یک TUI یا ورودی raw-mode پوشش می‌دهید، پیش از خروج ترمینال را بازیابی کنید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  پورت WebSocket (مقدار پیش‌فرض از پیکربندی/محیط می‌آید؛ معمولاً `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  حالت اتصال شنونده. `lan`، `tailnet` و `custom` در حال حاضر روی مسیرهای فقط IPv4 حل می‌شوند.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  بازنویسی حالت احراز هویت.
</ParamField>
<ParamField path="--token <token>" type="string">
  بازنویسی توکن (همچنین `OPENCLAW_GATEWAY_TOKEN` را برای فرایند تنظیم می‌کند).
</ParamField>
<ParamField path="--password <password>" type="string">
  بازنویسی گذرواژه.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  خواندن گذرواژه Gateway از یک فایل.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  در معرض قرار دادن Gateway از طریق Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  بازنشانی پیکربندی serve/funnel در Tailscale هنگام خاموشی.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  امروز انتظار یک نشانی IPv4 دارد. برای BYOH فقط IPv6، یک سایدکار یا پراکسی IPv4 را جلوی Gateway قرار دهید و OpenClaw را به آن نقطه پایانی IPv4 هدایت کنید.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه شروع Gateway بدون `gateway.mode=local` در پیکربندی. فقط برای راه‌اندازی اولیه موردی/توسعه، حفاظ شروع را دور می‌زند؛ فایل پیکربندی را نمی‌نویسد یا تعمیر نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  اگر وجود نداشته باشد، پیکربندی توسعه + workspace ایجاد می‌کند (`BOOTSTRAP.md` را رد می‌کند).
</ParamField>
<ParamField path="--reset" type="boolean">
  بازنشانی پیکربندی توسعه + اعتبارنامه‌ها + نشست‌ها + workspace (نیازمند `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنونده موجود روی پورت انتخاب‌شده را متوقف می‌کند.
</ParamField>
<ParamField path="--verbose" type="boolean">
  لاگ‌های پرجزئیات.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط لاگ‌های بک‌اند CLI را در کنسول نشان می‌دهد (و stdout/stderr را فعال می‌کند).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  سبک لاگ Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار برای `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  رویدادهای خام جریان مدل را در jsonl لاگ می‌کند.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسیر jsonl جریان خام.
</ParamField>

## راه‌اندازی مجدد Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` از Gateway در حال اجرا می‌خواهد پیش از راه‌اندازی مجدد، کارهای فعال OpenClaw را پیش‌بررسی کند. اگر عملیات صف‌شده، تحویل پاسخ، اجراهای تعبیه‌شده یا اجرای وظیفه‌ها فعال باشند، Gateway مسدودکننده‌ها را گزارش می‌کند، درخواست‌های تکراری راه‌اندازی مجدد ایمن را ادغام می‌کند و پس از تخلیه کار فعال راه‌اندازی مجدد می‌شود. `restart` ساده برای سازگاری، رفتار موجود مدیر سرویس را حفظ می‌کند. فقط زمانی از `--force` استفاده کنید که صراحتاً مسیر بازنویسی فوری را می‌خواهید.

`openclaw gateway restart --safe --skip-deferral` همان راه‌اندازی مجدد هماهنگ و آگاه از OpenClaw را مانند `--safe` اجرا می‌کند، اما گیت تعویق کار فعال را دور می‌زند تا Gateway حتی وقتی مسدودکننده‌ها گزارش شده‌اند، راه‌اندازی مجدد را فوراً منتشر کند. از آن به‌عنوان راه فرار اپراتور استفاده کنید وقتی یک تعویق به‌دلیل اجرای وظیفه گیرکرده ثابت مانده و `--safe` به‌تنهایی نامحدود منتظر می‌ماند. `--skip-deferral` به `--safe` نیاز دارد.

<Warning>
`--password` درون‌خطی می‌تواند در فهرست‌های فرایند محلی آشکار شود. `--password-file`، محیط، یا `gateway.auth.password` پشتیبانی‌شده با SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری Gateway

- برای لاگ کردن زمان‌بندی فازها هنگام شروع Gateway، از جمله تأخیر `eventLoopMax` برای هر فاز و زمان‌بندی‌های جدول جست‌وجوی Plugin برای installed-index، رجیستری manifest، برنامه‌ریزی شروع و کار owner-map، `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید.
- برای لاگ کردن خط‌های `restart trace:` محدود به راه‌اندازی مجدد برای پردازش سیگنال راه‌اندازی مجدد، تخلیه کار فعال، فازهای خاموشی، شروع بعدی، زمان آماده‌شدن و معیارهای حافظه، `OPENCLAW_GATEWAY_RESTART_TRACE=1` را تنظیم کنید.
- برای نوشتن یک timeline تشخیصی شروع JSONL به‌صورت best-effort برای harnessهای QA خارجی، `OPENCLAW_DIAGNOSTICS=timeline` را همراه با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید. همچنین می‌توانید این flag را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از محیط تأمین می‌شود. برای شامل کردن نمونه‌های event-loop، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- ابتدا `pnpm build` را اجرا کنید، سپس برای بنچمارک شروع Gateway در برابر ورودی CLI ساخته‌شده، `pnpm test:startup:gateway -- --runs 5 --warmup 1` را اجرا کنید. بنچمارک نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های trace شروع، تأخیر event-loop و جزئیات زمان‌بندی جدول جست‌وجوی Plugin را ثبت می‌کند.
- ابتدا `pnpm build` را اجرا کنید، سپس برای بنچمارک راه‌اندازی مجدد درون‌فرایندی Gateway در برابر ورودی CLI ساخته‌شده روی macOS یا Linux، `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` را اجرا کنید. بنچمارک راه‌اندازی مجدد از SIGUSR1 استفاده می‌کند، هر دو trace شروع و راه‌اندازی مجدد را در فرایند فرزند فعال می‌کند، و `/healthz` بعدی، `/readyz` بعدی، زمان ازکارافتادگی، زمان آماده‌شدن، CPU، RSS و معیارهای trace راه‌اندازی مجدد را ثبت می‌کند.
- `/healthz` را به‌عنوان زنده‌بودن و `/readyz` را به‌عنوان آمادگی قابل‌استفاده در نظر بگیرید. خط‌های trace و خروجی بنچمارک برای انتساب به مالک هستند؛ یک بازه trace یا یک نمونه را نتیجه کامل عملکرد تلقی نکنید.

## پرس‌وجو از Gateway در حال اجرا

همه فرمان‌های پرس‌وجو از WebSocket RPC استفاده می‌کنند.

<Tabs>
  <Tab title="حالت‌های خروجی">
    - پیش‌فرض: خوانا برای انسان (رنگی در TTY).
    - `--json`: JSON خوانا برای ماشین (بدون استایل/اسپینر).
    - `--no-color` (یا `NO_COLOR=1`): غیرفعال کردن ANSI همراه با حفظ چیدمان انسانی.

  </Tab>
  <Tab title="گزینه‌های مشترک">
    - `--url <url>`: URL WebSocket Gateway.
    - `--token <token>`: توکن Gateway.
    - `--password <password>`: گذرواژه Gateway.
    - `--timeout <ms>`: timeout/budget (بسته به فرمان متفاوت است).
    - `--expect-final`: انتظار برای پاسخ "final" (فراخوانی‌های عامل).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به اعتبارنامه‌های پیکربندی یا محیط بازنمی‌گردد. `--token` یا `--password` را صریحاً پاس دهید. نبود اعتبارنامه‌های صریح یک خطاست.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

نقطه پایانی HTTP `/healthz` یک پروب زنده‌بودن است: زمانی برمی‌گردد که سرور بتواند به HTTP پاسخ دهد. نقطه پایانی HTTP `/readyz` سخت‌گیرتر است و تا زمانی که سایدکارهای Plugin شروع، کانال‌ها یا هوک‌های پیکربندی‌شده هنوز در حال پایدار شدن هستند، قرمز می‌ماند. پاسخ‌های آمادگی تفصیلی محلی یا احراز هویت‌شده شامل یک بلوک تشخیصی `eventLoop` با تأخیر event-loop، بهره‌برداری event-loop، نسبت هسته CPU و flag `degraded` هستند.

<ParamField path="--port <port>" type="number">
  یک Gateway با local loopback روی این پورت را هدف بگیرید. این گزینه `OPENCLAW_GATEWAY_URL` و `OPENCLAW_GATEWAY_PORT` را برای فراخوانی health بازنویسی می‌کند.
</ParamField>

### `gateway usage-cost`

خلاصه‌های هزینه استفاده را از لاگ‌های نشست دریافت کنید.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید شامل شود.
</ParamField>
<ParamField path="--agent <id>" type="string">
  خلاصه هزینه را به یک شناسه عامل پیکربندی‌شده محدود کنید.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  خلاصه هزینه را در همه عامل‌های پیکربندی‌شده تجمیع کنید. نمی‌تواند با `--agent` ترکیب شود.
</ParamField>

### `gateway stability`

ضبط‌کننده پایداری تشخیصی اخیر را از یک Gateway در حال اجرا دریافت کنید.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  بیشینه تعداد رویدادهای اخیر برای گنجاندن (حداکثر `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  فیلتر بر اساس نوع رویداد تشخیصی، مانند `payload.large` یا `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رویدادهای پس از یک شماره توالی تشخیصی را شامل کنید.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک بسته پایداری پایدارشده را بخوانید. برای جدیدترین بسته زیر دایرکتوری state از `--bundle latest` (یا فقط `--bundle`) استفاده کنید، یا مسیر JSON بسته را مستقیماً پاس دهید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک zip تشخیصی پشتیبانی قابل اشتراک‌گذاری بنویسید.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="حریم خصوصی و رفتار بسته">
    - رکوردها فراداده عملیاتی را نگه می‌دارند: نام رویدادها، شمارش‌ها، اندازه‌های بایت، خوانش‌های حافظه، وضعیت صف/نشست، نام کانال/Plugin و خلاصه‌های نشست ویرایش‌شده. متن چت، بدنه‌های Webhook، خروجی ابزارها، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، مقادیر محرمانه، نام میزبان‌ها یا شناسه‌های خام نشست را نگه نمی‌دارند. برای غیرفعال کردن کامل ضبط‌کننده، `diagnostics.enabled: false` را تنظیم کنید.
    - هنگام خروج‌های مرگبار Gateway، timeoutهای خاموشی و شکست‌های شروع راه‌اندازی مجدد، OpenClaw همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد، زمانی که ضبط‌کننده رویدادهایی داشته باشد. جدیدترین بسته را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type` و `--since-seq` نیز روی خروجی بسته اعمال می‌شوند.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

یک zip تشخیصی محلی بنویسید که برای پیوست شدن به گزارش‌های باگ طراحی شده است. برای مدل حریم خصوصی و محتوای بسته، [برون‌بری تشخیص‌ها](/fa/gateway/diagnostics) را ببینید.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسیر فایل zip خروجی. به‌طور پیش‌فرض یک خروجی پشتیبانی زیر دایرکتوری وضعیت است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  حداکثر خطوط لاگ پاک‌سازی‌شده برای گنجاندن.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  حداکثر بایت‌های لاگ برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  نشانی WebSocket مربوط به Gateway برای عکس فوری سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway برای عکس فوری سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه Gateway برای عکس فوری سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  مهلت زمانی عکس فوری وضعیت/سلامت.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  جست‌وجوی بسته پایداری ذخیره‌شده را رد کن.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه، و مانیفست را به‌صورت JSON چاپ کن.
</ParamField>

خروجی شامل یک مانیفست، خلاصه Markdown، شکل پیکربندی، جزئیات پیکربندی پاک‌سازی‌شده، خلاصه‌های لاگ پاک‌سازی‌شده، عکس‌های فوری وضعیت/سلامت پاک‌سازی‌شده Gateway، و جدیدترین بسته پایداری در صورت وجود است.

این خروجی برای اشتراک‌گذاری در نظر گرفته شده است. جزئیات عملیاتی مفید برای اشکال‌زدایی را نگه می‌دارد، مانند فیلدهای امن لاگ OpenClaw، نام‌های زیرسامانه، کدهای وضعیت، مدت‌زمان‌ها، حالت‌های پیکربندی‌شده، پورت‌ها، شناسه‌های plugin، شناسه‌های ارائه‌دهنده، تنظیمات غیرمحرمانه قابلیت‌ها، و پیام‌های لاگ عملیاتی ویرایش‌شده. متن گفت‌وگو، بدنه‌های webhook، خروجی‌های ابزار، اعتبارنامه‌ها، کوکی‌ها، شناسه‌های حساب/پیام، متن prompt/دستورالعمل، نام‌های میزبان، و مقادیر محرمانه را حذف یا ویرایش می‌کند. وقتی یک پیام به سبک LogTape شبیه متن payload کاربر/گفت‌وگو/ابزار باشد، خروجی فقط این را نگه می‌دارد که یک پیام حذف شده است، همراه با تعداد بایت آن.

### `gateway status`

`gateway status` سرویس Gateway (launchd/systemd/schtasks) را به‌همراه یک probe اختیاری از قابلیت اتصال/احراز هویت نشان می‌دهد.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  یک هدف probe صریح اضافه کن. remote پیکربندی‌شده + localhost همچنان probe می‌شوند.
</ParamField>
<ParamField path="--token <token>" type="string">
  احراز هویت توکنی برای probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  احراز هویت با گذرواژه برای probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  مهلت زمانی probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  probe اتصال را رد کن (نمای فقط سرویس).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را نیز اسکن کن.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  probe پیش‌فرض اتصال را به یک probe خواندن ارتقا بده و وقتی آن probe خواندن شکست بخورد با کد غیرصفر خارج شو. نمی‌تواند با `--no-probe` ترکیب شود.
</ParamField>

<AccordionGroup>
  <Accordion title="معناشناسی وضعیت">
    - `gateway status` حتی وقتی پیکربندی CLI محلی وجود ندارد یا نامعتبر است، برای تشخیص عیب در دسترس می‌ماند.
    - `gateway status` پیش‌فرض وضعیت سرویس، اتصال WebSocket، و قابلیت احراز هویت قابل مشاهده در زمان handshake را اثبات می‌کند. عملیات خواندن/نوشتن/مدیریت را اثبات نمی‌کند.
    - probeهای تشخیصی برای احراز هویت دستگاه در بار اول تغییردهنده نیستند: وقتی توکن دستگاه cacheشده موجود باشد، همان را دوباره استفاده می‌کنند، اما فقط برای بررسی وضعیت، هویت دستگاه CLI جدید یا رکورد pairing دستگاه فقط‌خواندنی ایجاد نمی‌کنند.
    - `gateway status` تا جای ممکن SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت probe resolve می‌کند.
    - اگر یک SecretRef احراز هویت لازم در این مسیر فرمان resolve نشده باشد، `gateway status --json` هنگام شکست اتصال/احراز هویت probe مقدار `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحا بدهید یا ابتدا منبع secret را resolve کنید.
    - اگر probe موفق شود، هشدارهای auth-ref resolveنشده برای جلوگیری از مثبت‌های کاذب سرکوب می‌شوند.
    - وقتی probe فعال باشد، خروجی JSON شامل `gateway.version` است اگر Gateway در حال اجرا آن را گزارش کند؛ اگر probe handshake بعدی نتواند فراداده نسخه را فراهم کند، `--require-rpc` می‌تواند به payload ‏RPC ‏`status.runtimeVersion` fallback کند.
    - وقتی یک سرویس در حال گوش دادن کافی نیست و لازم دارید فراخوانی‌های RPC با scope خواندن نیز سالم باشند، از `--require-rpc` در اسکریپت‌ها و خودکارسازی استفاده کنید.
    - `--deep` یک اسکن best-effort برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه gateway شناسایی شوند، خروجی انسانی نکته‌های پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که بیشتر راه‌اندازی‌ها باید به‌ازای هر ماشین یک gateway اجرا کنند.
    - `--deep` همچنین handoff راه‌اندازی مجدد اخیر supervisor مربوط به Gateway را گزارش می‌کند، وقتی فرایند سرویس برای راه‌اندازی مجدد توسط یک supervisor خارجی به‌صورت تمیز خارج شده باشد.
    - `--deep` اعتبارسنجی پیکربندی را در حالت آگاه از plugin (`pluginValidation: "full"`) اجرا می‌کند و هشدارهای مانیفست plugin پیکربندی‌شده را نمایش می‌دهد (برای مثال نبود فراداده پیکربندی کانال) تا بررسی‌های smoke نصب و به‌روزرسانی آن‌ها را بگیرند. `gateway status` پیش‌فرض مسیر سریع فقط‌خواندنی را نگه می‌دارد که اعتبارسنجی plugin را رد می‌کند.
    - خروجی انسانی شامل مسیر resolveشده لاگ فایل به‌علاوه عکس فوری مسیرها/اعتبار پیکربندی CLI در برابر سرویس است تا به تشخیص drift پروفایل یا state-dir کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های auth-drift مربوط به Linux systemd">
    - در نصب‌های Linux systemd، بررسی‌های drift احراز هویت هر دو مقدار `Environment=` و `EnvironmentFile=` را از unit می‌خوانند (شامل `%h`، مسیرهای نقل‌قول‌شده، چند فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift، SecretRefهای `gateway.auth.token` را با استفاده از env زمان اجرای ادغام‌شده resolve می‌کنند (ابتدا env فرمان سرویس، سپس fallback به env فرایند).
    - اگر احراز هویت توکنی عملا فعال نباشد (`gateway.auth.mode` صریح با مقدار `password`/`none`/`trusted-proxy`، یا حالتی که تنظیم نشده و در آن گذرواژه می‌تواند برنده شود و هیچ کاندیدای توکنی نمی‌تواند برنده شود)، بررسی‌های token-drift، resolve کردن توکن پیکربندی را رد می‌کنند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` فرمان «اشکال‌زدایی همه‌چیز» است. همیشه این موارد را probe می‌کند:

- gateway راه دور پیکربندی‌شده شما (اگر تنظیم شده باشد)، و
- localhost (loopback) **حتی اگر remote پیکربندی شده باشد**.

اگر `--url` بدهید، آن هدف صریح جلوتر از هر دو اضافه می‌شود. خروجی انسانی هدف‌ها را این‌گونه برچسب می‌زند:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند هدف probe قابل دسترسی باشند، همه آن‌ها را چاپ می‌کند. یک تونل SSH، نشانی TLS/proxy، و نشانی remote پیکربندی‌شده همگی می‌توانند به همان gateway اشاره کنند حتی وقتی پورت‌های transport آن‌ها متفاوت باشد؛ `multiple_gateways` برای gatewayهای قابل دسترسی متمایز یا دارای هویت مبهم نگه داشته شده است. وقتی از پروفایل‌های ایزوله استفاده می‌کنید (مثلا یک بات نجات)، چند gateway پشتیبانی می‌شود، اما بیشتر نصب‌ها همچنان یک gateway واحد اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  از این پورت برای هدف probe مربوط به local loopback و پورت راه دور تونل SSH استفاده کن. بدون `--url`، این گزینه هدف local loopback را به‌جای نشانی محیط gateway پیکربندی‌شده، پورت محیط، یا هدف‌های remote انتخاب می‌کند.
</ParamField>

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی حداقل یک هدف اتصال WebSocket را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌دهد probe چه چیزی را درباره احراز هویت توانسته اثبات کند. این از قابلیت دسترسی جداست.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با scope خواندن (`health`/`status`/`system-presence`/`config.get`) نیز موفق بوده‌اند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق بوده اما RPC با scope خواندن محدود است. این به‌عنوان قابلیت دسترسی **کاهش‌یافته** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` بعد از `Connect: ok` یعنی Gateway اتصال WebSocket را پذیرفته، اما تشخیص‌های خواندن بعدی مهلتشان تمام شده یا شکست خورده‌اند. این نیز قابلیت دسترسی **کاهش‌یافته** است، نه یک Gateway غیرقابل دسترسی.
    - مانند `gateway status`، probe از احراز هویت دستگاه cacheشده موجود دوباره استفاده می‌کند، اما هویت دستگاه بار اول یا وضعیت pairing ایجاد نمی‌کند.
    - کد خروجی فقط وقتی غیرصفر است که هیچ هدف probeشده‌ای قابل دسترسی نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالا:

    - `ok`: حداقل یک هدف قابل دسترسی است.
    - `degraded`: حداقل یک هدف اتصال را پذیرفته اما تشخیص‌های RPC کامل جزئیات را کامل نکرده است.
    - `capability`: بهترین قابلیتی که در میان هدف‌های قابل دسترسی دیده شده (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین هدف برای در نظر گرفتن به‌عنوان برنده فعال به این ترتیب: نشانی صریح، تونل SSH، remote پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار best-effort با `code`، `message`، و `targetIds` اختیاری.
    - `network`: راهنمایی‌های نشانی local loopback/tailnet برگرفته از پیکربندی فعلی و شبکه میزبان.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجه واقعی discovery استفاده‌شده برای این اجرای probe.

    برای هر هدف (`targets[].connect`):

    - `ok`: قابلیت دسترسی پس از اتصال + دسته‌بندی کاهش‌یافته.
    - `rpcOk`: موفقیت کامل RPC جزئیات.
    - `scopeLimited`: شکست RPC جزئیات به‌دلیل نبود scope اپراتور.

    برای هر هدف (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok` وقتی در دسترس باشد.
    - `scopes`: scopeهای اعطاشده گزارش‌شده در `hello-ok` وقتی در دسترس باشند.
    - `capability`: دسته‌بندی قابلیت احراز هویت نمایش‌داده‌شده برای آن هدف.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی تونل SSH شکست خورد؛ فرمان به probeهای مستقیم fallback کرد.
    - `multiple_gateways`: هویت‌های gateway متمایز قابل دسترسی بودند، یا OpenClaw نتوانست اثبات کند هدف‌های قابل دسترسی همان gateway هستند. تونل SSH، نشانی proxy، یا نشانی remote پیکربندی‌شده به همان gateway این هشدار را ایجاد نمی‌کند.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای هدف شکست‌خورده resolve نشد.
    - `probe_scope_limited`: اتصال WebSocket موفق شد، اما probe خواندن به‌دلیل نبود `operator.read` محدود بود.

  </Accordion>
</AccordionGroup>

#### Remote از طریق SSH (برابری با اپ Mac)

حالت "Remote over SSH" در اپ macOS از یک port-forward محلی استفاده می‌کند تا gateway راه دور (که ممکن است فقط به loopback bind شده باشد) در `ws://127.0.0.1:<port>` قابل دسترسی شود.

معادل CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` یا `user@host:port` (پورت به‌طور پیش‌فرض `22` است).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  فایل هویت.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  نخستین میزبان gateway کشف‌شده را از endpoint کشف resolveشده (`local.` به‌علاوه دامنه wide-area پیکربندی‌شده، در صورت وجود) به‌عنوان هدف SSH انتخاب کن. راهنمایی‌های فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، استفاده‌شده به‌عنوان پیش‌فرض‌ها):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

کمک‌ابزار RPC سطح پایین.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  رشته شیء JSON برای params.
</ParamField>
<ParamField path="--url <url>" type="string">
  نشانی WebSocket مربوط به Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  بودجه مهلت زمانی.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  عمدتا برای RPCهای به سبک agent که پیش از payload نهایی رویدادهای میانی stream می‌کنند.
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی JSON قابل خواندن توسط ماشین.
</ParamField>

<Note>
`--params` باید JSON معتبر باشد.
</Note>

## مدیریت سرویس Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### نصب با یک wrapper

از `--wrapper` زمانی استفاده کنید که سرویس مدیریت‌شده باید از طریق یک فایل اجرایی دیگر شروع شود، برای مثال یک
shim مدیر اسرار یا یک کمک‌کننده run-as. wrapper آرگومان‌های معمول Gateway را دریافت می‌کند و
مسئول است در نهایت `openclaw` یا Node را با همان آرگومان‌ها exec کند.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

همچنین می‌توانید wrapper را از طریق محیط تنظیم کنید. `gateway install` اعتبارسنجی می‌کند که مسیر
یک فایل اجرایی باشد، wrapper را در `ProgramArguments` سرویس می‌نویسد، و
`OPENCLAW_WRAPPER` را در محیط سرویس برای نصب‌های مجدد اجباری، به‌روزرسانی‌ها، و تعمیرهای doctor بعدی پایدار می‌کند.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

برای حذف یک wrapper پایدارشده، هنگام نصب مجدد `OPENCLAW_WRAPPER` را پاک کنید:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="گزینه‌های فرمان">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="رفتار چرخه عمر">
    - برای راه‌اندازی مجدد یک سرویس مدیریت‌شده از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین راه‌اندازی مجدد زنجیره نکنید.
    - در macOS، `gateway stop` به‌طور پیش‌فرض از `launchctl bootout` استفاده می‌کند، که LaunchAgent را بدون پایدار کردن غیرفعال‌سازی از نشست بوت فعلی حذف می‌کند — بازیابی خودکار KeepAlive برای خرابی‌های آینده فعال می‌ماند و `gateway start` بدون `launchctl enable` دستی دوباره به‌صورت تمیز فعال می‌شود. برای سرکوب پایدار KeepAlive و RunAtLoad گزینه `--disable` را بدهید تا gateway تا `gateway start` صریح بعدی دوباره ایجاد نشود؛ زمانی از این استفاده کنید که توقف دستی باید پس از reboot یا راه‌اندازی مجدد سیستم نیز باقی بماند.
    - `gateway restart --safe` از Gateway در حال اجرا می‌خواهد کارهای فعال OpenClaw را پیش‌پرواز کند و راه‌اندازی مجدد را تا تخلیه تحویل پاسخ، اجراهای embedded، و اجراهای task به تعویق بیندازد. `--safe` را نمی‌توان با `--force` یا `--wait` ترکیب کرد.
    - `gateway restart --wait 30s` بودجه تخلیه راه‌اندازی مجدد پیکربندی‌شده را برای همان راه‌اندازی مجدد بازنویسی می‌کند. اعداد بدون واحد میلی‌ثانیه هستند؛ واحدهایی مانند `s`، `m`، و `h` پذیرفته می‌شوند. `--wait 0` به‌طور نامحدود منتظر می‌ماند.
    - `gateway restart --safe --skip-deferral` راه‌اندازی مجدد امن و آگاه از OpenClaw را اجرا می‌کند اما gate تعویق را دور می‌زند تا Gateway حتی وقتی مسدودکننده‌ها گزارش شده‌اند، راه‌اندازی مجدد را فوراً صادر کند. راه گریز operator برای تعویق‌های stuck-task-run؛ به `--safe` نیاز دارد.
    - `gateway restart --force` تخلیه کار فعال را رد می‌کند و فوراً راه‌اندازی مجدد می‌کند. زمانی از آن استفاده کنید که operator از قبل مسدودکننده‌های task فهرست‌شده را بررسی کرده و می‌خواهد gateway همین حالا برگردد.
    - فرمان‌های چرخه عمر برای اسکریپت‌نویسی `--json` را می‌پذیرند.

  </Accordion>
  <Accordion title="Auth و SecretRefs در زمان نصب">
    - وقتی token auth به token نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `gateway install` اعتبارسنجی می‌کند که SecretRef قابل resolve باشد اما token resolve‌شده را در metadata محیط سرویس پایدار نمی‌کند.
    - اگر token auth به token نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolve نشده باشد، نصب به‌جای پایدار کردن متن ساده fallback به‌صورت fail closed شکست می‌خورد.
    - برای password auth در `gateway run`، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file`، یا `gateway.auth.password` پشتیبانی‌شده با SecretRef را به `--password` درون‌خطی ترجیح دهید.
    - در حالت auth استنباط‌شده، `OPENCLAW_GATEWAY_PASSWORD` فقط در shell الزامات token نصب را آسان‌تر نمی‌کند؛ هنگام نصب یک سرویس مدیریت‌شده از پیکربندی بادوام (`gateway.auth.password` یا config `env`) استفاده کنید.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صریحاً تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف gatewayها (Bonjour)

`gateway discover` برای beaconهای Gateway (`_openclaw-gw._tcp`) اسکن می‌کند.

- DNS-SD چندپخشی: `local.`
- DNS-SD تک‌پخشی (Bonjour گسترده): یک دامنه انتخاب کنید (مثال: `openclaw.internal.`) و split DNS + یک سرور DNS راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط gatewayهایی که کشف Bonjour در آن‌ها فعال است (پیش‌فرض) beacon را advertise می‌کنند.

رکوردهای کشف گسترده می‌توانند این اشاره‌های TXT را شامل شوند:

- `role` (اشاره نقش gateway)
- `transport` (اشاره transport، مثلاً `gateway`)
- `gatewayPort` (درگاه WebSocket، معمولاً `18789`)
- `sshPort` (فقط حالت کشف کامل؛ clients وقتی وجود ندارد هدف‌های SSH را به‌طور پیش‌فرض `22` می‌گیرند)
- `tailnetDns` (نام میزبان MagicDNS، وقتی در دسترس باشد)
- `gatewayTls` / `gatewayTlsSha256` (TLS فعال + اثر انگشت گواهی)
- `cliPath` (فقط حالت کشف کامل)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلت زمانی هر فرمان (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن برای ماشین (همچنین styling/spinner را غیرفعال می‌کند).
</ParamField>

مثال‌ها:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI، `local.` به‌علاوه دامنه گسترده پیکربندی‌شده را زمانی که فعال باشد اسکن می‌کند.
- `wsUrl` در خروجی JSON از endpoint سرویس resolve‌شده مشتق می‌شود، نه از اشاره‌های فقط TXT مانند `lanHost` یا `tailnetDns`.
- در mDNS `local.` و DNS-SD گسترده، `sshPort` و `cliPath` فقط زمانی منتشر می‌شوند که `discovery.mdns.mode` برابر `full` باشد.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [runbook Gateway](/fa/gateway)
