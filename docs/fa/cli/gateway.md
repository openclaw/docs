---
read_when:
    - اجرای Gateway از CLI (توسعه یا سرورها)
    - اشکال‌زدایی احراز هویت Gateway، حالت‌های bind و اتصال‌پذیری
    - کشف Gatewayها از طریق Bonjour (DNS-SD محلی و گسترده‌دامنه)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — اجرا، پرس‌وجو و کشف gatewayها
title: Gateway
x-i18n:
    generated_at: "2026-06-30T14:16:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket در OpenClaw است (کانال‌ها، نودها، نشست‌ها، هوک‌ها). زیر‌دستورهای این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="کشف Bonjour" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده.
  </Card>
  <Card title="نمای کلی کشف" href="/fa/gateway/discovery">
    اینکه OpenClaw چگونه Gatewayها را معرفی و پیدا می‌کند.
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
    - به‌طور پیش‌فرض، Gateway از شروع به کار خودداری می‌کند مگر اینکه `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم شده باشد. برای اجراهای موردی/توسعه‌ای از `--allow-unconfigured` استفاده کنید.
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` نیست، آن را به‌عنوان پیکربندی خراب یا بازنویسی‌شده در نظر بگیرید و به‌جای فرض ضمنی حالت محلی، آن را تعمیر کنید.
    - اگر فایل وجود دارد و `gateway.mode` نیست، Gateway آن را آسیب مشکوک به پیکربندی تلقی می‌کند و از «حدس زدن حالت محلی» برای شما خودداری می‌کند.
    - اتصال فراتر از loopback بدون احراز هویت مسدود است (گاردریل ایمنی).
    - `lan`، `tailnet` و `custom` در حال حاضر از مسیرهای BYOH فقط IPv4 resolve می‌شوند.
    - BYOH فقط IPv6 امروز به‌صورت بومی در این مسیر پشتیبانی نمی‌شود. اگر خود میزبان فقط IPv6 است، از یک سایدکار یا پروکسی IPv4 استفاده کنید.
    - `SIGUSR1` در صورت مجاز بودن، یک راه‌اندازی مجدد درون‌فرایندی را فعال می‌کند (`commands.restart` به‌طور پیش‌فرض فعال است؛ برای مسدود کردن راه‌اندازی مجدد دستی، `commands.restart: false` را تنظیم کنید، در حالی که اعمال/به‌روزرسانی ابزار/پیکربندی gateway همچنان مجاز می‌ماند).
    - هندلرهای `SIGINT`/`SIGTERM` فرایند gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی ترمینال را بازیابی نمی‌کنند. اگر CLI را با TUI یا ورودی raw-mode پوشش می‌دهید، پیش از خروج ترمینال را بازیابی کنید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  پورت WebSocket (پیش‌فرض از پیکربندی/env می‌آید؛ معمولاً `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  حالت bind شنونده. `lan`، `tailnet` و `custom` در حال حاضر از مسیرهای فقط IPv4 resolve می‌شوند.
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
  خواندن گذرواژه gateway از یک فایل.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  در دسترس گذاشتن Gateway از طریق Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  بازنشانی پیکربندی serve/funnel در Tailscale هنگام خاموشی.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  امروز انتظار یک نشانی IPv4 دارد. برای BYOH فقط IPv6، یک سایدکار یا پروکسی IPv4 جلوی Gateway قرار دهید و OpenClaw را به آن endpoint IPv4 اشاره دهید.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه شروع gateway بدون `gateway.mode=local` در پیکربندی. فقط برای bootstrap موردی/توسعه‌ای گارد راه‌اندازی را دور می‌زند؛ فایل پیکربندی را نمی‌نویسد یا تعمیر نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  اگر وجود ندارد، یک پیکربندی توسعه + workspace ایجاد کنید (`BOOTSTRAP.md` را رد می‌کند).
</ParamField>
<ParamField path="--reset" type="boolean">
  بازنشانی پیکربندی توسعه + اعتبارنامه‌ها + نشست‌ها + workspace (نیازمند `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنونده موجود روی پورت انتخاب‌شده را بکشید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  لاگ‌های مفصل.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط لاگ‌های backend مربوط به CLI را در کنسول نمایش بده (و stdout/stderr را فعال کن).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  سبک لاگ Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار برای `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  رویدادهای خام جریان مدل را در jsonl لاگ کن.
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

`openclaw gateway restart --safe` از Gateway در حال اجرا می‌خواهد کار فعال را پیش‌پرواز کند و پس از تخلیه کار فعال، یک راه‌اندازی مجدد ادغام‌شده زمان‌بندی کند. راه‌اندازی مجدد امن پیش‌فرض تا سقف `gateway.reload.deferralTimeoutMs` پیکربندی‌شده (پیش‌فرض ۵ دقیقه) منتظر کار فعال می‌ماند؛ وقتی این بودجه تمام شود، راه‌اندازی مجدد اجبار می‌شود. برای انتظار امن نامحدود که هرگز اجبار نمی‌کند، `gateway.reload.deferralTimeoutMs` را روی `0` تنظیم کنید. `restart` ساده رفتار موجود service-manager را حفظ می‌کند؛ `--force` همچنان مسیر بازنویسی فوری است.

`openclaw gateway restart --safe --skip-deferral` همان راه‌اندازی مجدد هماهنگ و آگاه از OpenClaw را مانند `--safe` اجرا می‌کند، اما گیت تعویق کار فعال را دور می‌زند تا Gateway حتی وقتی blockerها گزارش شده‌اند فوراً راه‌اندازی مجدد را منتشر کند. وقتی تعویق توسط اجرای یک تسک گیرکرده pin شده و `--safe` به‌تنهایی ممکن است توسط `gateway.reload.deferralTimeoutMs` محدود شود، از آن به‌عنوان راه خروج اپراتور استفاده کنید. `--skip-deferral` به `--safe` نیاز دارد.

<Warning>
`--password` درون‌خطی می‌تواند در فهرست‌های محلی فرایندها افشا شود. `--password-file`، env، یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید تا زمان‌بندی فازها هنگام راه‌اندازی Gateway لاگ شود، از جمله تأخیر `eventLoopMax` برای هر فاز و زمان‌بندی‌های جدول lookup Plugin برای installed-index، manifest registry، برنامه‌ریزی راه‌اندازی، و کار owner-map.
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` را تنظیم کنید تا خطوط `restart trace:` محدود به راه‌اندازی مجدد برای مدیریت سیگنال راه‌اندازی مجدد، تخلیه کار فعال، فازهای خاموشی، شروع بعدی، زمان‌بندی آماده‌شدن، و معیارهای حافظه لاگ شوند.
- `OPENCLAW_DIAGNOSTICS=timeline` را با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید تا یک timeline تشخیصی JSONL با بهترین تلاش برای راه‌اندازی، برای harnessهای QA خارجی نوشته شود. همچنین می‌توانید این flag را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از env تأمین می‌شود. برای درج نمونه‌های event-loop، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- ابتدا `pnpm build` را اجرا کنید، سپس `pnpm test:startup:gateway -- --runs 5 --warmup 1` را برای benchmark راه‌اندازی Gateway در برابر ورودی CLI ساخته‌شده اجرا کنید. benchmark نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های trace راه‌اندازی، تأخیر event-loop، و جزئیات زمان‌بندی جدول lookup Plugin را ثبت می‌کند.
- ابتدا `pnpm build` را اجرا کنید، سپس `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` را برای benchmark راه‌اندازی مجدد درون‌فرایندی Gateway در برابر ورودی CLI ساخته‌شده روی macOS یا Linux اجرا کنید. benchmark راه‌اندازی مجدد از SIGUSR1 استفاده می‌کند، هم traceهای راه‌اندازی و هم راه‌اندازی مجدد را در فرایند فرزند فعال می‌کند، و `/healthz` بعدی، `/readyz` بعدی، downtime، زمان‌بندی آماده‌شدن، CPU، RSS، و معیارهای trace راه‌اندازی مجدد را ثبت می‌کند.
- `/healthz` را به‌عنوان liveness و `/readyz` را به‌عنوان آمادگی قابل استفاده در نظر بگیرید. خطوط trace و خروجی benchmark برای انتساب به مالک هستند؛ یک بازه trace یا یک نمونه را نتیجه کامل عملکرد تلقی نکنید.

## پرس‌وجو از Gateway در حال اجرا

همه دستورهای پرس‌وجو از WebSocket RPC استفاده می‌کنند.

<Tabs>
  <Tab title="حالت‌های خروجی">
    - پیش‌فرض: خوانا برای انسان (رنگی در TTY).
    - `--json`: JSON قابل خواندن توسط ماشین (بدون استایل/spinner).
    - `--no-color` (یا `NO_COLOR=1`): غیرفعال کردن ANSI در حالی که چیدمان انسانی حفظ می‌شود.

  </Tab>
  <Tab title="گزینه‌های مشترک">
    - `--url <url>`: URL مربوط به WebSocket در Gateway.
    - `--token <token>`: توکن Gateway.
    - `--password <password>`: گذرواژه Gateway.
    - `--timeout <ms>`: timeout/بودجه (بسته به دستور متفاوت است).
    - `--expect-final`: منتظر یک پاسخ "final" بمان (فراخوانی‌های agent).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به اعتبارنامه‌های پیکربندی یا محیط fallback نمی‌کند. `--token` یا `--password` را صریحاً پاس بدهید. نبود اعتبارنامه‌های صریح خطا است.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

endpoint مربوط به HTTP `/healthz` یک probe برای liveness است: وقتی سرور بتواند به HTTP پاسخ بدهد، برمی‌گردد. endpoint مربوط به HTTP `/readyz` سخت‌گیرتر است و تا زمانی که سایدکارهای Plugin راه‌اندازی، کانال‌ها، یا هوک‌های پیکربندی‌شده هنوز در حال تثبیت هستند قرمز می‌ماند. پاسخ‌های آمادگی تفصیلی محلی یا احراز هویت‌شده شامل یک بلوک تشخیصی `eventLoop` با تأخیر event-loop، بهره‌وری event-loop، نسبت هسته CPU، و یک flag به نام `degraded` هستند.

<ParamField path="--port <port>" type="number">
  یک Gateway با local loopback را روی این پورت هدف بگیرید. این گزینه `OPENCLAW_GATEWAY_URL` و `OPENCLAW_GATEWAY_PORT` را برای فراخوانی health بازنویسی می‌کند.
</ParamField>

### `gateway usage-cost`

خلاصه‌های هزینه مصرف را از لاگ‌های نشست واکشی کنید.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید شامل شوند.
</ParamField>
<ParamField path="--agent <id>" type="string">
  خلاصه هزینه را به یک id پیکربندی‌شده agent محدود کنید.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  خلاصه هزینه را در همه agentهای پیکربندی‌شده تجمیع کنید. نمی‌تواند با `--agent` ترکیب شود.
</ParamField>

### `gateway stability`

ضبط‌کننده پایداری تشخیصی اخیر را از یک Gateway در حال اجرا واکشی کنید.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  حداکثر تعداد رویدادهای اخیر برای درج (حداکثر `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  فیلتر بر اساس نوع رویداد تشخیصی، مانند `payload.large` یا `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رویدادهای پس از یک شماره توالی تشخیصی را شامل کن.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک بسته پایداری persisted را بخوانید. برای جدیدترین بسته زیر دایرکتوری state از `--bundle latest` (یا فقط `--bundle`) استفاده کنید، یا مسیر JSON یک بسته را مستقیم پاس بدهید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک zip تشخیصی پشتیبانی قابل اشتراک‌گذاری بنویسید.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="حریم خصوصی و رفتار بسته">
    - رکوردها metadata عملیاتی را نگه می‌دارند: نام رویدادها، شمارش‌ها، اندازه‌های بایت، خوانش‌های حافظه، وضعیت صف/نشست، نام کانال/Plugin، و خلاصه‌های نشست redact‌شده. آن‌ها متن چت، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، مقادیر secret، نام میزبان‌ها، یا idهای خام نشست را نگه نمی‌دارند. برای غیرفعال کردن کامل recorder، `diagnostics.enabled: false` را تنظیم کنید.
    - هنگام خروج‌های fatal از Gateway، timeoutهای خاموشی، و شکست‌های راه‌اندازی پس از restart، OpenClaw وقتی recorder رویداد دارد همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد. جدیدترین بسته را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type` و `--since-seq` نیز روی خروجی بسته اعمال می‌شوند.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

یک zip تشخیصی محلی بنویسید که برای پیوست کردن به گزارش‌های باگ طراحی شده است. برای مدل حریم خصوصی و محتوای بسته، [خروجی تشخیصی](/fa/gateway/diagnostics) را ببینید.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسیر zip خروجی. پیش‌فرض آن یک خروجی پشتیبانی زیر دایرکتوری وضعیت است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  بیشترین تعداد خطوط لاگ پاک‌سازی‌شده برای درج.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  بیشترین تعداد بایت لاگ برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL مربوط به Gateway WebSocket برای عکس‌برداری وضعیت سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway برای عکس‌برداری وضعیت سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه Gateway برای عکس‌برداری وضعیت سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  مهلت زمانی عکس‌برداری وضعیت/سلامت.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  جست‌وجوی بسته پایداری ذخیره‌شده را رد کن.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه، و manifest را به‌صورت JSON چاپ کن.
</ParamField>

خروجی شامل یک manifest، خلاصه Markdown، شکل پیکربندی، جزئیات پیکربندی پاک‌سازی‌شده، خلاصه‌های لاگ پاک‌سازی‌شده، عکس‌برداری‌های وضعیت/سلامت پاک‌سازی‌شده Gateway، و تازه‌ترین بسته پایداری در صورت وجود است.

این خروجی برای اشتراک‌گذاری طراحی شده است. جزئیات عملیاتی مفید برای اشکال‌زدایی را نگه می‌دارد، مانند فیلدهای امن لاگ OpenClaw، نام‌های زیرسامانه، کدهای وضعیت، مدت‌زمان‌ها، حالت‌های پیکربندی‌شده، پورت‌ها، شناسه‌های plugin، شناسه‌های provider، تنظیمات غیرمحرمانه ویژگی‌ها، و پیام‌های لاگ عملیاتی پوشانده‌شده. متن گفت‌وگو، بدنه‌های webhook، خروجی‌های ابزار، اعتبارنامه‌ها، کوکی‌ها، شناسه‌های حساب/پیام، متن prompt/instruction، نام میزبان‌ها، و مقادیر محرمانه را حذف یا پوشانده می‌کند. وقتی یک پیام سبک LogTape شبیه متن payload کاربر/گفت‌وگو/ابزار باشد، خروجی فقط این را نگه می‌دارد که یک پیام حذف شده است، همراه با تعداد بایت‌های آن.

### `gateway status`

`gateway status` سرویس Gateway (launchd/systemd/schtasks) را به‌همراه یک probe اختیاری برای قابلیت اتصال/احراز هویت نشان می‌دهد.

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
  احراز هویت گذرواژه‌ای برای probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  مهلت زمانی probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  probe اتصال را رد کن (نمای فقط سرویس).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را هم اسکن کن.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  probe اتصال پیش‌فرض را به probe خواندن ارتقا بده و وقتی آن probe خواندن شکست خورد با مقدار غیرصفر خارج شو. نمی‌توان آن را با `--no-probe` ترکیب کرد.
</ParamField>

<AccordionGroup>
  <Accordion title="معنای وضعیت">
    - `gateway status` حتی وقتی پیکربندی CLI محلی وجود ندارد یا نامعتبر است، برای diagnostics در دسترس می‌ماند.
    - `gateway status` پیش‌فرض وضعیت سرویس، اتصال WebSocket، و قابلیت احراز هویت قابل مشاهده در زمان handshake را اثبات می‌کند. عملیات خواندن/نوشتن/admin را اثبات نمی‌کند.
    - probeهای diagnostic برای احراز هویت دستگاه در بار اول تغییردهنده نیستند: وقتی توکن دستگاه cacheشده موجود باشد از همان استفاده می‌کنند، اما فقط برای بررسی وضعیت، هویت دستگاه CLI جدید یا رکورد pairing دستگاه فقط‌خواندنی ایجاد نمی‌کنند.
    - `gateway status` در صورت امکان، SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت probe resolve می‌کند.
    - اگر یک SecretRef احراز هویت موردنیاز در این مسیر فرمان resolve نشود، وقتی اتصال/احراز هویت probe شکست بخورد `gateway status --json` مقدار `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریح بدهید یا ابتدا منبع secret را resolve کنید.
    - اگر probe موفق شود، هشدارهای auth-ref resolveنشده برای جلوگیری از مثبت کاذب سرکوب می‌شوند.
    - وقتی probing فعال باشد، خروجی JSON مقدار `gateway.version` را در صورت گزارش شدن از سوی Gateway در حال اجرا شامل می‌شود؛ اگر probe handshake بعدی نتواند metadata نسخه را فراهم کند، `--require-rpc` می‌تواند به payload مربوط به RPC `status.runtimeVersion` fallback کند.
    - وقتی سرویس در حال گوش دادن کافی نیست و لازم است فراخوانی‌های RPC با scope خواندن نیز سالم باشند، از `--require-rpc` در اسکریپت‌ها و automation استفاده کنید.
    - `--deep` یک اسکن best-effort برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه gateway شناسایی شود، خروجی انسانی نکته‌های پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که بیشتر setupها باید در هر ماشین یک gateway اجرا کنند.
    - `--deep` همچنین handoff اخیر restart سرپرست Gateway را گزارش می‌کند، وقتی فرایند سرویس برای restart سرپرست خارجی به‌طور تمیز خارج شده باشد.
    - `--deep` اعتبارسنجی پیکربندی را در حالت آگاه از plugin (`pluginValidation: "full"`) اجرا می‌کند و هشدارهای manifest مربوط به pluginهای پیکربندی‌شده را سطح‌بندی می‌کند (برای مثال metadata پیکربندی channel گم‌شده) تا بررسی‌های smoke نصب و به‌روزرسانی آن‌ها را بگیرند. `gateway status` پیش‌فرض مسیر سریع فقط‌خواندنی را نگه می‌دارد که اعتبارسنجی plugin را رد می‌کند.
    - خروجی انسانی مسیر resolveشده لاگ فایل به‌علاوه عکس‌برداری مسیرها/اعتبار پیکربندی CLI در برابر سرویس را شامل می‌شود تا به تشخیص drift در profile یا state-dir کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های drift احراز هویت Linux systemd">
    - در نصب‌های Linux systemd، بررسی‌های drift احراز هویت سرویس، مقدارهای `Environment=` و `EnvironmentFile=` را از unit می‌خوانند (شامل `%h`، مسیرهای quoted، چند فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift مقدارهای SecretRef مربوط به `gateway.auth.token` را با استفاده از env زمان اجرای mergeشده resolve می‌کنند (ابتدا env فرمان سرویس، سپس fallback به env فرایند).
    - اگر احراز هویت توکنی عملا فعال نباشد (`gateway.auth.mode` صریح برابر `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد در حالتی که گذرواژه می‌تواند برنده شود و هیچ نامزد توکنی نمی‌تواند برنده شود)، بررسی‌های token-drift، resolve کردن توکن پیکربندی را رد می‌کنند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` فرمان «اشکال‌زدایی همه‌چیز» است. همیشه این‌ها را probe می‌کند:

- gateway راه دور پیکربندی‌شده شما (اگر تنظیم شده باشد)، و
- localhost (loopback) **حتی اگر remote پیکربندی شده باشد**.

اگر `--url` را بدهید، آن هدف صریح جلوتر از هر دو اضافه می‌شود. خروجی انسانی هدف‌ها را این‌گونه برچسب می‌زند:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند هدف probe قابل دسترسی باشند، همه آن‌ها را چاپ می‌کند. یک تونل SSH، URL مربوط به TLS/proxy، و URL راه دور پیکربندی‌شده همگی می‌توانند به یک gateway یکسان اشاره کنند، حتی وقتی پورت‌های transport آن‌ها متفاوت است؛ `multiple_gateways` برای gatewayهای قابل دسترسی متمایز یا دارای ابهام هویتی نگه داشته شده است. وقتی از profileهای ایزوله استفاده می‌کنید (مثلا یک rescue bot)، چند gateway پشتیبانی می‌شود، اما بیشتر نصب‌ها همچنان یک gateway واحد اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  از این پورت برای هدف probe مربوط به local loopback و پورت راه دور تونل SSH استفاده کن. بدون `--url`، این گزینه به‌جای URL محیطی gateway پیکربندی‌شده، پورت محیطی، یا هدف‌های راه دور، هدف local loopback را انتخاب می‌کند.
</ParamField>

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی دست‌کم یک هدف اتصال WebSocket را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌کند probe چه چیزی را درباره احراز هویت توانسته اثبات کند. این از دسترسی‌پذیری جداست.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با scope خواندن (`health`/`status`/`system-presence`/`config.get`) نیز موفق شده‌اند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق بوده اما RPC با scope خواندن محدود است. این مورد به‌عنوان دسترسی‌پذیری **degraded** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` پس از `Connect: ok` یعنی Gateway اتصال WebSocket را پذیرفته، اما diagnostics خواندن بعدی timeout شده یا شکست خورده است. این هم دسترسی‌پذیری **degraded** است، نه Gateway غیرقابل دسترسی.
    - مانند `gateway status`، probe از احراز هویت دستگاه cacheشده موجود دوباره استفاده می‌کند اما هویت دستگاه بار اول یا وضعیت pairing ایجاد نمی‌کند.
    - کد خروج فقط وقتی غیرصفر است که هیچ هدف probeشده‌ای قابل دسترسی نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالایی:

    - `ok`: دست‌کم یک هدف قابل دسترسی است.
    - `degraded`: دست‌کم یک هدف اتصال را پذیرفته اما diagnostics کامل RPC جزئیات را تمام نکرده است.
    - `capability`: بهترین قابلیت دیده‌شده در میان هدف‌های قابل دسترسی (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین هدف برای در نظر گرفتن به‌عنوان برنده فعال، با این ترتیب: URL صریح، تونل SSH، remote پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار best-effort با `code`، `message`، و `targetIds` اختیاری.
    - `network`: راهنمای URLهای local loopback/tailnet که از پیکربندی فعلی و شبکه میزبان به‌دست آمده‌اند.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجه واقعی discovery که برای این نوبت probe استفاده شده است.

    برای هر هدف (`targets[].connect`):

    - `ok`: دسترسی‌پذیری پس از connect + طبقه‌بندی degraded.
    - `rpcOk`: موفقیت کامل RPC جزئیات.
    - `scopeLimited`: شکست RPC جزئیات به‌دلیل نبود scope مربوط به operator.

    برای هر هدف (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok`، در صورت موجود بودن.
    - `scopes`: scopeهای اعطاشده گزارش‌شده در `hello-ok`، در صورت موجود بودن.
    - `capability`: طبقه‌بندی قابلیت احراز هویت سطح‌بندی‌شده برای آن هدف.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی تونل SSH شکست خورد؛ فرمان به probeهای مستقیم fallback کرد.
    - `multiple_gateways`: هویت‌های gateway متمایز قابل دسترسی بودند، یا OpenClaw نتوانست ثابت کند هدف‌های قابل دسترسی همان gateway هستند. تونل SSH، URL پراکسی، یا URL راه دور پیکربندی‌شده به همان gateway این هشدار را فعال نمی‌کند.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای یک هدف شکست‌خورده resolve نشد.
    - `probe_scope_limited`: اتصال WebSocket موفق شد، اما probe خواندن به‌دلیل نبود `operator.read` محدود شد.

  </Accordion>
</AccordionGroup>

#### راه دور از طریق SSH (هم‌ترازی با برنامه Mac)

حالت "Remote over SSH" در برنامه macOS از یک port-forward محلی استفاده می‌کند تا gateway راه دور (که ممکن است فقط به loopback bind شده باشد) در `ws://127.0.0.1:<port>` قابل دسترسی شود.

معادل CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` یا `user@host:port` (پورت به‌صورت پیش‌فرض `22` است).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  فایل هویت.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  نخستین میزبان gateway کشف‌شده را از endpoint کشف resolveشده (`local.` به‌علاوه دامنه wide-area پیکربندی‌شده، در صورت وجود) به‌عنوان هدف SSH انتخاب کن. راهنمایی‌های فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، استفاده‌شده به‌عنوان پیش‌فرض):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

کمک‌کننده سطح پایین RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  رشته شیء JSON برای params.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL مربوط به Gateway WebSocket.
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
  عمدتا برای RPCهای سبک agent که پیش از payload نهایی، eventهای میانی را stream می‌کنند.
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی JSON قابل خواندن برای ماشین.
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

وقتی سرویس مدیریت‌شده باید از طریق یک فایل اجرایی دیگر شروع شود، مثلاً یک shim مدیر اسرار یا یک helper برای اجرا با کاربر دیگر، از `--wrapper` استفاده کنید. wrapper آرگومان‌های عادی Gateway را دریافت می‌کند و مسئول است که در نهایت `openclaw` یا Node را با همان آرگومان‌ها exec کند.

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

همچنین می‌توانید wrapper را از طریق محیط تنظیم کنید. `gateway install` بررسی می‌کند که مسیر یک فایل اجرایی باشد، wrapper را در `ProgramArguments` سرویس می‌نویسد، و `OPENCLAW_WRAPPER` را در محیط سرویس برای نصب‌های اجباری بعدی، به‌روزرسانی‌ها، و تعمیرهای doctor پایدار می‌کند.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

برای حذف یک wrapper پایدارشده، هنگام نصب دوباره `OPENCLAW_WRAPPER` را پاک کنید:

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
  <Accordion title="رفتار چرخه حیات">
    - برای راه‌اندازی دوباره یک سرویس مدیریت‌شده از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین restart زنجیره نکنید.
    - در macOS، `gateway stop` به‌طور پیش‌فرض از `launchctl bootout` استفاده می‌کند، که LaunchAgent را از جلسه بوت فعلی حذف می‌کند بدون اینکه غیرفعال‌سازی را پایدار کند — بازیابی خودکار KeepAlive برای خرابی‌های آینده فعال می‌ماند و `gateway start` بدون نیاز به `launchctl enable` دستی، آن را تمیز دوباره فعال می‌کند. برای سرکوب پایدار KeepAlive و RunAtLoad، `--disable` را پاس دهید تا Gateway تا `gateway start` صریح بعدی دوباره اجرا نشود؛ وقتی توقف دستی باید پس از reboot یا restart سیستم هم باقی بماند، از این استفاده کنید.
    - `gateway restart --safe` از Gateway در حال اجرا می‌خواهد کار فعال را preflight کند و پس از تخلیه کار فعال، یک restart ادغام‌شده زمان‌بندی کند. restart ایمن پیش‌فرض تا مقدار پیکربندی‌شده `gateway.reload.deferralTimeoutMs` برای کار فعال منتظر می‌ماند (پیش‌فرض ۵ دقیقه)؛ وقتی این بودجه تمام شود restart اجباری می‌شود. `gateway.reload.deferralTimeoutMs` را روی `0` بگذارید تا انتظار ایمن نامحدود باشد و هرگز اجبار نکند. `--safe` را نمی‌توان با `--force` یا `--wait` ترکیب کرد.
    - `gateway restart --wait 30s` بودجه پیکربندی‌شده تخلیه restart را برای همان restart بازنویسی می‌کند. اعداد بدون واحد میلی‌ثانیه هستند؛ واحدهایی مانند `s`، `m`، و `h` پذیرفته می‌شوند. `--wait 0` به‌طور نامحدود منتظر می‌ماند.
    - `gateway restart --safe --skip-deferral` restart ایمن آگاه از OpenClaw را اجرا می‌کند اما gate تعویق را دور می‌زند تا Gateway حتی وقتی blockerها گزارش شده‌اند، restart را فوراً منتشر کند. راه فرار operator برای تعویق‌های task-run گیرکرده؛ به `--safe` نیاز دارد.
    - `gateway restart --force` تخلیه کار فعال را رد می‌کند و فوراً restart می‌کند. وقتی operator قبلاً blockerهای task فهرست‌شده را بررسی کرده و اکنون Gateway را می‌خواهد، از آن استفاده کنید.
    - فرمان‌های چرخه حیات برای اسکریپت‌نویسی `--json` را می‌پذیرند.

  </Accordion>
  <Accordion title="Auth و SecretRefها هنگام نصب">
    - وقتی auth مبتنی بر token به token نیاز دارد و `gateway.auth.token` توسط SecretRef مدیریت می‌شود، `gateway install` بررسی می‌کند که SecretRef قابل resolve باشد اما token resolve‌شده را در metadata محیط سرویس پایدار نمی‌کند.
    - اگر auth مبتنی بر token به token نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolve نشده باشد، نصب به‌جای پایدار کردن متن ساده fallback، fail closed می‌شود.
    - برای auth مبتنی بر password در `gateway run`، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file`، یا `gateway.auth.password` پشتیبانی‌شده با SecretRef را به `--password` inline ترجیح دهید.
    - در حالت auth استنباط‌شده، `OPENCLAW_GATEWAY_PASSWORD` فقط در shell الزامات token نصب را سست نمی‌کند؛ هنگام نصب یک سرویس مدیریت‌شده، از پیکربندی پایدار (`gateway.auth.password` یا `env` پیکربندی) استفاده کنید.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صریحاً تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف Gatewayها (Bonjour)

`gateway discover` برای beaconهای Gateway (`_openclaw-gw._tcp`) اسکن می‌کند.

- DNS-SD چندپخشی: `local.`
- DNS-SD تک‌پخشی (Wide-Area Bonjour): یک دامنه انتخاب کنید (نمونه: `openclaw.internal.`) و split DNS + یک سرور DNS راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط Gatewayهایی که کشف Bonjour در آن‌ها فعال است (پیش‌فرض) beacon را advertise می‌کنند.

رکوردهای کشف wide-area می‌توانند این راهنمایی‌های TXT را شامل شوند:

- `role` (راهنمای نقش Gateway)
- `transport` (راهنمای transport، مثلاً `gateway`)
- `gatewayPort` (پورت WebSocket، معمولاً `18789`)
- `sshPort` (فقط حالت کشف کامل؛ وقتی غایب است، clientها هدف‌های SSH را به‌طور پیش‌فرض `22` می‌گذارند)
- `tailnetDns` (نام میزبان MagicDNS، وقتی در دسترس باشد)
- `gatewayTls` / `gatewayTlsSha256` (TLS فعال + اثرانگشت گواهی)
- `cliPath` (فقط حالت کشف کامل)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  timeout هر فرمان (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن توسط ماشین (همچنین styling/spinner را غیرفعال می‌کند).
</ParamField>

نمونه‌ها:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI وقتی یک دامنه wide-area فعال باشد، `local.` به‌علاوه آن دامنه پیکربندی‌شده را اسکن می‌کند.
- `wsUrl` در خروجی JSON از endpoint سرویس resolve‌شده مشتق می‌شود، نه از راهنمایی‌های فقط TXT مانند `lanHost` یا `tailnetDns`.
- در mDNS مربوط به `local.` و DNS-SD مربوط به wide-area، `sshPort` و `cliPath` فقط وقتی منتشر می‌شوند که `discovery.mdns.mode` برابر `full` باشد.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [runbook Gateway](/fa/gateway)
