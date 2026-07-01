---
read_when:
    - اجرای Gateway از CLI (توسعه یا سرورها)
    - اشکال‌زدایی احراز هویت Gateway، حالت‌های اتصال، و اتصال‌پذیری
    - کشف Gatewayها از طریق Bonjour (DNS-SD محلی + گسترده)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gatewayها را اجرا، پرس‌وجو و کشف کنید
title: Gateway
x-i18n:
    generated_at: "2026-07-01T08:20:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket در OpenClaw است (کانال‌ها، گره‌ها، نشست‌ها، hookها). زیر‌دستورهای این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده.
  </Card>
  <Card title="Discovery overview" href="/fa/gateway/discovery">
    OpenClaw چگونه Gatewayها را اعلام و پیدا می‌کند.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration">
    کلیدهای پیکربندی Gateway در سطح بالا.
  </Card>
</CardGroup>

## اجرای Gateway

یک فرایند Gateway محلی را اجرا کنید:

```bash
openclaw gateway
```

نام مستعار پیش‌زمینه:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - به‌طور پیش‌فرض، Gateway شروع به کار نمی‌کند مگر اینکه `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم شده باشد. برای اجراهای موقت/توسعه‌ای از `--allow-unconfigured` استفاده کنید.
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` در آن نیست، آن را به‌عنوان پیکربندی خراب یا بازنویسی‌شده در نظر بگیرید و به‌جای فرض ضمنی حالت محلی، آن را تعمیر کنید.
    - اگر فایل وجود دارد و `gateway.mode` در آن نیست، Gateway این را آسیب مشکوک به پیکربندی تلقی می‌کند و برای شما «حالت محلی را حدس» نمی‌زند.
    - اتصال فراتر از loopback بدون احراز هویت مسدود می‌شود (حفاظ ایمنی).
    - `lan`، `tailnet` و `custom` در حال حاضر از مسیرهای BYOH فقط IPv4 حل می‌شوند.
    - BYOH فقط IPv6 امروز به‌صورت بومی در این مسیر پشتیبانی نمی‌شود. اگر خود میزبان فقط IPv6 است، از یک sidecar یا proxy مبتنی بر IPv4 استفاده کنید.
    - `SIGUSR1` در صورت مجاز بودن، بازراه‌اندازی درون‌فرایندی را فعال می‌کند (`commands.restart` به‌طور پیش‌فرض فعال است؛ برای مسدود کردن بازراه‌اندازی دستی، `commands.restart: false` را تنظیم کنید، در حالی که اعمال/به‌روزرسانی ابزار/پیکربندی Gateway همچنان مجاز می‌ماند).
    - handlerهای `SIGINT`/`SIGTERM` فرایند Gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی ترمینال را بازیابی نمی‌کنند. اگر CLI را با TUI یا ورودی raw-mode پوشش می‌دهید، پیش از خروج ترمینال را بازیابی کنید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  پورت WebSocket (پیش‌فرض از پیکربندی/env می‌آید؛ معمولاً `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  حالت bind شنونده. `lan`، `tailnet` و `custom` در حال حاضر از مسیرهای فقط IPv4 حل می‌شوند.
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
  گذرواژه Gateway را از یک فایل بخوانید.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway را از طریق Tailscale در دسترس قرار دهید.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  پیکربندی serve/funnel مربوط به Tailscale را هنگام خاموشی بازنشانی کنید.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  امروز انتظار یک نشانی IPv4 دارد. برای BYOH فقط IPv6، یک sidecar یا proxy مبتنی بر IPv4 جلوی Gateway قرار دهید و OpenClaw را به آن endpoint مبتنی بر IPv4 اشاره دهید.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه می‌دهد Gateway بدون `gateway.mode=local` در پیکربندی شروع شود. فقط برای راه‌اندازی موقت/توسعه‌ای از حفاظ شروع به کار عبور می‌کند؛ فایل پیکربندی را نمی‌نویسد یا تعمیر نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  اگر موجود نباشد، پیکربندی توسعه + workspace بسازید (`BOOTSTRAP.md` را رد می‌کند).
</ParamField>
<ParamField path="--reset" type="boolean">
  پیکربندی توسعه + اعتبارنامه‌ها + نشست‌ها + workspace را بازنشانی کنید (به `--dev` نیاز دارد).
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنونده موجود روی پورت انتخاب‌شده را خاتمه دهید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  لاگ‌های مفصل.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط لاگ‌های backend مربوط به CLI را در کنسول نشان دهید (و stdout/stderr را فعال کنید).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  سبک لاگ WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار برای `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  رویدادهای خام جریان مدل را در jsonl لاگ کنید.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسیر jsonl جریان خام.
</ParamField>

## بازراه‌اندازی Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` از Gateway در حال اجرا می‌خواهد کار فعال را پیش‌بررسی کند و پس از تخلیه کار فعال، یک بازراه‌اندازی ادغام‌شده زمان‌بندی کند. بازراه‌اندازی امن پیش‌فرض تا سقف `gateway.reload.deferralTimeoutMs` پیکربندی‌شده برای کار فعال منتظر می‌ماند (پیش‌فرض ۵ دقیقه)؛ وقتی این بودجه تمام شود، بازراه‌اندازی اجباری می‌شود. برای انتظار امن نامحدود که هرگز اجبار نمی‌کند، `gateway.reload.deferralTimeoutMs` را روی `0` تنظیم کنید. `restart` ساده رفتار موجود service-manager را نگه می‌دارد؛ `--force` همچنان مسیر بازنویسی فوری است.

`openclaw gateway restart --safe --skip-deferral` همان بازراه‌اندازی هماهنگ و آگاه از OpenClaw را مانند `--safe` اجرا می‌کند، اما از gate تعویق کار فعال عبور می‌کند تا Gateway حتی وقتی مسدودکننده‌ها گزارش شده‌اند، بازراه‌اندازی را فوراً منتشر کند. وقتی یک تعویق توسط اجرای کار گیرکرده ثابت مانده و `--safe` به‌تنهایی ممکن است با `gateway.reload.deferralTimeoutMs` محدود شود، از آن به‌عنوان مسیر خروج اضطراری operator استفاده کنید. `--skip-deferral` به `--safe` نیاز دارد.

<Warning>
`--password` درون‌خطی می‌تواند در فهرست‌های فرایند محلی آشکار شود. `--password-file`، env یا `gateway.auth.password` پشتیبانی‌شده با SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید تا زمان‌بندی فازها هنگام شروع Gateway لاگ شود، از جمله تأخیر `eventLoopMax` برای هر فاز و زمان‌بندی‌های جدول lookup مربوط به Plugin برای installed-index، رجیستری manifest، برنامه‌ریزی شروع، و کار owner-map.
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` را تنظیم کنید تا خط‌های `restart trace:` محدود به بازراه‌اندازی برای مدیریت سیگنال بازراه‌اندازی، تخلیه کار فعال، فازهای خاموشی، شروع بعدی، زمان آماده‌بودن، و معیارهای حافظه لاگ شوند.
- `OPENCLAW_DIAGNOSTICS=timeline` را همراه با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید تا یک timeline تشخیصی JSONL به‌صورت best-effort برای شروع، مخصوص harnessهای QA خارجی نوشته شود. همچنین می‌توانید flag را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از env فراهم می‌شود. برای گنجاندن نمونه‌های event-loop، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- ابتدا `pnpm build` را اجرا کنید، سپس `pnpm test:startup:gateway -- --runs 5 --warmup 1` را اجرا کنید تا شروع Gateway را در برابر entry ساخته‌شده CLI benchmark کنید. benchmark نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های startup trace، تأخیر event-loop و جزئیات زمان‌بندی جدول lookup مربوط به Plugin را ثبت می‌کند.
- ابتدا `pnpm build` را اجرا کنید، سپس `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` را اجرا کنید تا بازراه‌اندازی درون‌فرایندی Gateway را در برابر entry ساخته‌شده CLI روی macOS یا Linux benchmark کنید. benchmark بازراه‌اندازی از SIGUSR1 استفاده می‌کند، هر دو trace شروع و بازراه‌اندازی را در فرایند فرزند فعال می‌کند، و `/healthz` بعدی، `/readyz` بعدی، downtime، زمان آماده‌بودن، CPU، RSS و معیارهای restart trace را ثبت می‌کند.
- `/healthz` را به‌عنوان liveness و `/readyz` را به‌عنوان آمادگی قابل استفاده در نظر بگیرید. خط‌های trace و خروجی benchmark برای انتساب مالکیت هستند؛ یک span از trace یا یک نمونه را نتیجه کامل عملکردی تلقی نکنید.

## پرس‌وجو از Gateway در حال اجرا

همه دستورهای پرس‌وجو از WebSocket RPC استفاده می‌کنند.

<Tabs>
  <Tab title="Output modes">
    - پیش‌فرض: خوانا برای انسان (رنگی در TTY).
    - `--json`: JSON قابل خواندن توسط ماشین (بدون styling/spinner).
    - `--no-color` (یا `NO_COLOR=1`): ANSI را غیرفعال می‌کند و چیدمان انسانی را حفظ می‌کند.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL مربوط به WebSocket در Gateway.
    - `--token <token>`: توکن Gateway.
    - `--password <password>`: گذرواژه Gateway.
    - `--timeout <ms>`: timeout/بودجه (بسته به دستور متفاوت است).
    - `--expect-final`: منتظر پاسخ «final» بمانید (فراخوانی‌های agent).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به اعتبارنامه‌های پیکربندی یا محیط fallback نمی‌کند. `--token` یا `--password` را صریحاً پاس دهید. نبود اعتبارنامه‌های صریح خطاست.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

endpoint HTTP به نام `/healthz` یک probe برای liveness است: وقتی سرور بتواند به HTTP پاسخ دهد، برمی‌گردد. endpoint HTTP به نام `/readyz` سخت‌گیرانه‌تر است و تا زمانی که sidecarهای Plugin شروع، کانال‌ها، یا hookهای پیکربندی‌شده هنوز در حال تثبیت هستند، قرمز می‌ماند. پاسخ‌های readiness محلی یا احراز هویت‌شده و جزئی شامل یک بلوک تشخیصی `eventLoop` با تأخیر event-loop، بهره‌برداری event-loop، نسبت هسته CPU، و flag به نام `degraded` هستند.

<ParamField path="--port <port>" type="number">
  یک Gateway مبتنی بر local loopback را روی این پورت هدف بگیرید. این مقدار `OPENCLAW_GATEWAY_URL` و `OPENCLAW_GATEWAY_PORT` را برای فراخوانی health بازنویسی می‌کند.
</ParamField>

### `gateway usage-cost`

خلاصه‌های هزینه مصرف را از لاگ‌های نشست دریافت کنید.

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
  خلاصه هزینه را به یک id عامل پیکربندی‌شده محدود کنید.
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
  حداکثر تعداد رویدادهای اخیر برای گنجاندن (حداکثر `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  بر اساس نوع رویداد تشخیصی فیلتر کنید، مانند `payload.large` یا `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رویدادهای پس از یک شماره توالی تشخیصی را شامل کنید.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک bundle پایداری پایدارشده را بخوانید. از `--bundle latest` (یا فقط `--bundle`) برای جدیدترین bundle زیر دایرکتوری state استفاده کنید، یا مستقیماً مسیر JSON مربوط به bundle را پاس دهید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک فایل zip تشخیصی پشتیبانی قابل اشتراک‌گذاری بنویسید.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - رکوردها metadata عملیاتی را نگه می‌دارند: نام رویدادها، شمارش‌ها، اندازه‌های byte، خوانش‌های حافظه، وضعیت queue/session، idهای تأیید، نام‌های channel/Plugin، و خلاصه‌های نشست redacted. آن‌ها متن chat، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام request یا response، توکن‌ها، cookieها، مقادیر secret، hostnameها، یا idهای خام نشست را نگه نمی‌دارند. برای غیرفعال کردن کامل ضبط‌کننده، `diagnostics.enabled: false` را تنظیم کنید.
    - هنگام خروج‌های fatal از Gateway، timeoutهای خاموشی، و شکست‌های شروع پس از بازراه‌اندازی، OpenClaw وقتی ضبط‌کننده رویداد دارد همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد. جدیدترین bundle را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type` و `--since-seq` نیز روی خروجی bundle اعمال می‌شوند.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

یک فایل zip تشخیصی محلی بنویسید که برای پیوست کردن به گزارش‌های bug طراحی شده است. برای مدل حریم خصوصی و محتوای bundle، [Diagnostics Export](/fa/gateway/diagnostics) را ببینید.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسیر فایل zip خروجی. پیش‌فرض، یک خروجی پشتیبانی در زیر پوشهٔ وضعیت است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  بیشترین تعداد خط گزارش پاک‌سازی‌شده برای گنجاندن.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  بیشترین تعداد بایت گزارش برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  نشانی WebSocket مربوط به Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژهٔ Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout مربوط به snapshot وضعیت/سلامت.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  جست‌وجوی بستهٔ پایداری ذخیره‌شده را رد کنید.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه و manifest را به صورت JSON چاپ کنید.
</ParamField>

خروجی شامل یک manifest، خلاصهٔ Markdown، شکل پیکربندی، جزئیات پیکربندی پاک‌سازی‌شده، خلاصه‌های گزارش پاک‌سازی‌شده، snapshotهای وضعیت/سلامت پاک‌سازی‌شدهٔ Gateway، و تازه‌ترین بستهٔ پایداری در صورت وجود است.

این خروجی برای اشتراک‌گذاری در نظر گرفته شده است. جزئیات عملیاتی کمک‌کننده به اشکال‌زدایی را نگه می‌دارد، مانند فیلدهای امن گزارش OpenClaw، نام زیرسامانه‌ها، کدهای وضعیت، مدت‌زمان‌ها، حالت‌های پیکربندی‌شده، پورت‌ها، شناسه‌های plugin، شناسه‌های provider، تنظیمات غیرمحرمانهٔ ویژگی‌ها، و پیام‌های گزارش عملیاتی ویرایش‌شده. متن چت، بدنه‌های Webhook، خروجی‌های ابزار، اعتبارنامه‌ها، کوکی‌ها، شناسه‌های حساب/پیام، متن prompt/دستورالعمل، نام میزبان‌ها و مقادیر محرمانه را حذف یا ویرایش می‌کند. وقتی یک پیام به سبک LogTape شبیه متن payload کاربر/چت/ابزار باشد، خروجی فقط این را نگه می‌دارد که پیامی حذف شده است، به‌همراه تعداد بایت آن.

### `gateway status`

`gateway status` سرویس Gateway (launchd/systemd/schtasks) را به‌همراه یک probe اختیاری برای قابلیت اتصال/احراز هویت نشان می‌دهد.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  یک هدف probe صریح اضافه کنید. remote پیکربندی‌شده + localhost همچنان probe می‌شوند.
</ParamField>
<ParamField path="--token <token>" type="string">
  احراز هویت توکنی برای probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  احراز هویت گذرواژه‌ای برای probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  timeout مربوط به probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  probe اتصال را رد کنید (نمای فقط سرویس).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را هم اسکن کنید.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  probe اتصال پیش‌فرض را به یک probe خواندن ارتقا دهید و وقتی آن probe خواندن شکست می‌خورد با مقدار غیرصفر خارج شوید. نمی‌تواند با `--no-probe` ترکیب شود.
</ParamField>

<AccordionGroup>
  <Accordion title="معنای وضعیت">
    - `gateway status` حتی وقتی پیکربندی CLI محلی موجود نیست یا نامعتبر است، برای diagnostics در دسترس می‌ماند.
    - `gateway status` پیش‌فرض وضعیت سرویس، اتصال WebSocket، و قابلیت احراز هویت قابل مشاهده در زمان handshake را اثبات می‌کند. عملیات خواندن/نوشتن/admin را اثبات نمی‌کند.
    - probeهای diagnostic برای احراز هویت دستگاه در اولین استفاده، غیرتغییردهنده هستند: وقتی توکن دستگاه cacheشدهٔ موجودی وجود داشته باشد، از آن دوباره استفاده می‌کنند، اما فقط برای بررسی وضعیت، هویت دستگاه CLI جدید یا رکورد pairing دستگاه فقط‌خواندنی ایجاد نمی‌کنند.
    - `gateway status` در صورت امکان SecretRefs احراز هویت پیکربندی‌شده را برای احراز هویت probe resolve می‌کند.
    - اگر یک SecretRef احراز هویت الزامی در این مسیر فرمان resolve نشده باشد، وقتی اتصال/احراز هویت probe شکست بخورد، `gateway status --json` مقدار `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحاً بدهید یا ابتدا منبع secret را resolve کنید.
    - اگر probe موفق شود، هشدارهای auth-ref resolveنشده برای جلوگیری از مثبت کاذب سرکوب می‌شوند.
    - وقتی probing فعال باشد، خروجی JSON شامل `gateway.version` است، اگر Gateway در حال اجرا آن را گزارش کند؛ اگر probe handshake بعدی نتواند metadata نسخه را فراهم کند، `--require-rpc` می‌تواند به payload RPC مربوط به `status.runtimeVersion` بازگردد.
    - وقتی یک سرویس در حال گوش‌دادن کافی نیست و لازم است فراخوانی‌های RPC با دامنهٔ خواندن هم سالم باشند، از `--require-rpc` در scriptها و automation استفاده کنید.
    - `--deep` یک اسکن best-effort برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه gateway شناسایی شوند، خروجی انسانی راهنمای پاک‌سازی چاپ می‌کند و هشدار می‌دهد که بیشتر setupها باید یک gateway برای هر ماشین اجرا کنند.
    - `--deep` همچنین handoff اخیر restart سرپرست Gateway را گزارش می‌کند، وقتی process سرویس برای restart سرپرست خارجی به‌صورت clean خارج شده باشد.
    - `--deep` اعتبارسنجی پیکربندی را در حالت آگاه از plugin اجرا می‌کند (`pluginValidation: "full"`) و هشدارهای manifest مربوط به pluginهای پیکربندی‌شده را نمایش می‌دهد (برای مثال metadata پیکربندی channel که موجود نیست) تا smoke checkهای نصب و به‌روزرسانی آن‌ها را بگیرند. `gateway status` پیش‌فرض مسیر سریع فقط‌خواندنی را نگه می‌دارد که اعتبارسنجی plugin را رد می‌کند.
    - خروجی انسانی مسیر فایل گزارش resolveشده و snapshot مسیرها/اعتبار پیکربندی CLI-در-برابر-سرویس را شامل می‌شود تا به تشخیص drift در profile یا state-dir کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های auth-drift در Linux systemd">
    - در نصب‌های Linux systemd، بررسی‌های drift احراز هویت هر دو مقدار `Environment=` و `EnvironmentFile=` را از unit می‌خوانند (شامل `%h`، مسیرهای quoted، چند فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift مقدار SecretRefهای `gateway.auth.token` را با استفاده از env زمان اجرای mergeشده resolve می‌کنند (ابتدا env فرمان سرویس، سپس process env به‌عنوان fallback).
    - اگر احراز هویت توکنی عملاً فعال نباشد (`gateway.auth.mode` صریح برابر با `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد جایی که password می‌تواند برنده شود و هیچ token candidate نتواند برنده شود)، بررسی‌های token-drift از resolve کردن توکن پیکربندی رد می‌شوند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` فرمان «اشکال‌زدایی همه‌چیز» است. همیشه این موارد را probe می‌کند:

- gateway remote پیکربندی‌شدهٔ شما (اگر تنظیم شده باشد)، و
- localhost (loopback) **حتی اگر remote پیکربندی شده باشد**.

اگر `--url` را بدهید، آن هدف صریح جلوتر از هر دو اضافه می‌شود. خروجی انسانی برچسب هدف‌ها را این‌گونه نشان می‌دهد:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند هدف probe قابل دسترس باشند، همهٔ آن‌ها را چاپ می‌کند. یک تونل SSH، نشانی TLS/proxy، و نشانی remote پیکربندی‌شده همگی می‌توانند به همان gateway اشاره کنند حتی وقتی پورت‌های transport آن‌ها متفاوت باشد؛ `multiple_gateways` برای gatewayهای قابل دسترسِ متمایز یا دارای هویت مبهم رزرو شده است. وقتی از profileهای ایزوله استفاده می‌کنید (مثلاً یک ربات rescue)، چند gateway پشتیبانی می‌شود، اما بیشتر نصب‌ها همچنان یک gateway واحد اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  از این پورت برای هدف probe مربوط به local loopback و پورت remote تونل SSH استفاده کنید. بدون `--url`، این گزینه هدف local loopback را به‌جای نشانی gateway environment پیکربندی‌شده، پورت environment، یا هدف‌های remote انتخاب می‌کند.
</ParamField>

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی دست‌کم یک هدف اتصال WebSocket را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌کند probe دربارهٔ احراز هویت چه چیزی را توانسته اثبات کند. این از قابل دسترس بودن جداست.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با دامنهٔ خواندن (`health`/`status`/`system-presence`/`config.get`) نیز موفق شده‌اند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق بوده اما RPC با دامنهٔ خواندن محدود است. این به‌صورت قابل دسترسی **degraded** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` بعد از `Connect: ok` یعنی Gateway اتصال WebSocket را پذیرفته، اما diagnostics خواندن بعدی timeout شده یا شکست خورده است. این هم قابل دسترسی **degraded** است، نه Gateway غیرقابل دسترس.
    - مانند `gateway status`، probe از احراز هویت دستگاه cacheشدهٔ موجود دوباره استفاده می‌کند اما هویت دستگاه یا وضعیت pairing اولین استفاده را ایجاد نمی‌کند.
    - exit code فقط وقتی غیرصفر است که هیچ هدف probeشده‌ای قابل دسترس نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالا:

    - `ok`: دست‌کم یک هدف قابل دسترس است.
    - `degraded`: دست‌کم یک هدف اتصال را پذیرفته اما diagnostics کامل جزئیات RPC را کامل نکرده است.
    - `capability`: بهترین قابلیت دیده‌شده در میان هدف‌های قابل دسترس (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین هدف برای در نظر گرفتن به‌عنوان برندهٔ فعال با این ترتیب: URL صریح، تونل SSH، remote پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار best-effort با `code`، `message`، و `targetIds` اختیاری.
    - `network`: راهنمایی‌های URL مربوط به local loopback/tailnet که از پیکربندی فعلی و شبکهٔ میزبان به دست آمده‌اند.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجهٔ واقعی discovery که برای این عبور probe استفاده شده است.

    برای هر هدف (`targets[].connect`):

    - `ok`: قابل دسترس بودن پس از connect + طبقه‌بندی degraded.
    - `rpcOk`: موفقیت کامل RPC جزئیات.
    - `scopeLimited`: شکست RPC جزئیات به دلیل نبود operator scope.

    برای هر هدف (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok`، وقتی موجود باشد.
    - `scopes`: دامنه‌های اعطاشدهٔ گزارش‌شده در `hello-ok`، وقتی موجود باشد.
    - `capability`: طبقه‌بندی قابلیت احراز هویت نمایش‌داده‌شده برای آن هدف.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی تونل SSH شکست خورد؛ فرمان به probeهای مستقیم fallback کرد.
    - `multiple_gateways`: هویت‌های متمایز gateway قابل دسترس بودند، یا OpenClaw نتوانست اثبات کند هدف‌های قابل دسترس همان gateway هستند. یک تونل SSH، URL proxy، یا URL remote پیکربندی‌شده به همان gateway این هشدار را فعال نمی‌کند.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای هدف شکست‌خورده resolve نشد.
    - `probe_scope_limited`: اتصال WebSocket موفق شد، اما probe خواندن به دلیل نبود `operator.read` محدود شد.

  </Accordion>
</AccordionGroup>

#### Remote از طریق SSH (هم‌ارزی برنامهٔ Mac)

حالت «Remote over SSH» در برنامهٔ macOS از یک port-forward محلی استفاده می‌کند تا gateway remote (که ممکن است فقط به loopback bind شده باشد) در `ws://127.0.0.1:<port>` قابل دسترس شود.

معادل CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` یا `user@host:port` (پورت پیش‌فرض `22` است).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  فایل identity.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  نخستین میزبان gateway کشف‌شده را از endpoint کشف resolveشده (`local.` به‌علاوهٔ domain گستردهٔ پیکربندی‌شده، در صورت وجود) به‌عنوان هدف SSH انتخاب کنید. راهنمایی‌های فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، استفاده‌شده به‌عنوان پیش‌فرض):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

کمک‌کنندهٔ RPC سطح پایین.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  رشتهٔ JSON object برای params.
</ParamField>
<ParamField path="--url <url>" type="string">
  نشانی WebSocket مربوط به Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژهٔ Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  بودجهٔ timeout.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  عمدتاً برای RPCهای سبک agent که رویدادهای میانی را پیش از payload نهایی stream می‌کنند.
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

زمانی از `--wrapper` استفاده کنید که سرویس مدیریت‌شده باید از طریق یک فایل اجرایی دیگر شروع شود، برای نمونه یک
shim مدیر اسرار یا یک ابزار run-as. wrapper آرگومان‌های عادی Gateway را دریافت می‌کند و
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
یک فایل اجرایی است، wrapper را در `ProgramArguments` سرویس می‌نویسد، و
`OPENCLAW_WRAPPER` را در محیط سرویس برای نصب‌های اجباری دوباره، به‌روزرسانی‌ها، و تعمیرهای doctor
بعدی پایدار می‌کند.

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
  <Accordion title="رفتار چرخه عمر">
    - برای راه‌اندازی دوباره یک سرویس مدیریت‌شده از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین restart زنجیره نکنید.
    - در macOS، `gateway stop` به‌طور پیش‌فرض از `launchctl bootout` استفاده می‌کند، که LaunchAgent را بدون پایدار کردن غیرفعال‌سازی از نشست بوت فعلی حذف می‌کند — بازیابی خودکار KeepAlive برای خرابی‌های آینده فعال می‌ماند و `gateway start` بدون نیاز به `launchctl enable` دستی دوباره به‌صورت تمیز فعال می‌شود. برای سرکوب پایدار KeepAlive و RunAtLoad، `--disable` را پاس دهید تا gateway تا `gateway start` صریح بعدی دوباره اجرا نشود؛ از این گزینه زمانی استفاده کنید که توقف دستی باید پس از reboot یا راه‌اندازی دوباره سیستم هم باقی بماند.
    - `gateway restart --safe` از Gateway در حال اجرا می‌خواهد کار فعال را پیش‌پرواز کند و پس از تخلیه کار فعال، یک restart ادغام‌شده زمان‌بندی کند. restart ایمن پیش‌فرض تا سقف `gateway.reload.deferralTimeoutMs` پیکربندی‌شده (پیش‌فرض ۵ دقیقه) منتظر کار فعال می‌ماند؛ وقتی این بودجه تمام شود restart اجباری می‌شود. برای انتظار ایمن نامحدود که هرگز اجباری نمی‌شود، `gateway.reload.deferralTimeoutMs` را روی `0` تنظیم کنید. `--safe` نمی‌تواند با `--force` یا `--wait` ترکیب شود.
    - `gateway restart --wait 30s` بودجه تخلیه restart پیکربندی‌شده را برای همان restart بازنویسی می‌کند. عددهای بدون واحد میلی‌ثانیه هستند؛ واحدهایی مانند `s`، `m`، و `h` پذیرفته می‌شوند. `--wait 0` به‌طور نامحدود منتظر می‌ماند.
    - `gateway restart --safe --skip-deferral` restart ایمن آگاه از OpenClaw را اجرا می‌کند اما دروازه defer را دور می‌زند تا Gateway حتی وقتی blocker گزارش شده‌اند restart را بی‌درنگ منتشر کند. راه گریز اپراتور برای deferهای اجرای task گیرکرده؛ به `--safe` نیاز دارد.
    - `gateway restart --force` تخلیه کار فعال را نادیده می‌گیرد و بی‌درنگ restart می‌کند. زمانی از آن استفاده کنید که اپراتور blockerهای task فهرست‌شده را از قبل بررسی کرده و می‌خواهد gateway همین حالا برگردد.
    - فرمان‌های چرخه عمر برای اسکریپت‌نویسی `--json` را می‌پذیرند.

  </Accordion>
  <Accordion title="Auth و SecretRefs در زمان نصب">
    - وقتی احراز هویت token به token نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `gateway install` اعتبارسنجی می‌کند که SecretRef قابل resolve است، اما token resolve‌شده را در فراداده محیط سرویس پایدار نمی‌کند.
    - اگر احراز هویت token به token نیاز داشته باشد و SecretRef پیکربندی‌شده token resolve نشده باشد، نصب به‌جای پایدار کردن متن ساده fallback به‌صورت fail-closed شکست می‌خورد.
    - برای احراز هویت password در `gateway run`، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file`، یا `gateway.auth.password` پشتیبانی‌شده با SecretRef را به `--password` درون‌خطی ترجیح دهید.
    - در حالت احراز هویت استنباط‌شده، `OPENCLAW_GATEWAY_PASSWORD` فقط در shell الزامات token نصب را آسان‌تر نمی‌کند؛ هنگام نصب یک سرویس مدیریت‌شده از پیکربندی بادوام (`gateway.auth.password` یا `env` پیکربندی) استفاده کنید.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صریح تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف gatewayها (Bonjour)

`gateway discover` برای beaconهای Gateway (`_openclaw-gw._tcp`) اسکن می‌کند.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): یک دامنه انتخاب کنید (مثال: `openclaw.internal.`) و split DNS + یک سرور DNS راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط gatewayهایی که کشف Bonjour در آن‌ها فعال است (پیش‌فرض)، beacon را advertise می‌کنند.

رکوردهای کشف wide-area می‌توانند این راهنمایی‌های TXT را شامل شوند:

- `role` (راهنمای نقش gateway)
- `transport` (راهنمای transport، مثل `gateway`)
- `gatewayPort` (پورت WebSocket، معمولا `18789`)
- `sshPort` (فقط حالت کشف کامل؛ وقتی غایب باشد، کلاینت‌ها مقصدهای SSH را به‌طور پیش‌فرض روی `22` می‌گذارند)
- `tailnetDns` (نام میزبان MagicDNS، وقتی موجود باشد)
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
  خروجی قابل‌خواندن برای ماشین (همچنین styling/spinner را غیرفعال می‌کند).
</ParamField>

مثال‌ها:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI علاوه بر دامنه wide-area پیکربندی‌شده، وقتی یکی فعال باشد، `local.` را اسکن می‌کند.
- `wsUrl` در خروجی JSON از endpoint سرویس resolve‌شده مشتق می‌شود، نه از راهنمایی‌های فقط TXT مانند `lanHost` یا `tailnetDns`.
- در mDNS با `local.` و DNS-SD wide-area، `sshPort` و `cliPath` فقط زمانی منتشر می‌شوند که `discovery.mdns.mode` برابر `full` باشد.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [runbook Gateway](/fa/gateway)
