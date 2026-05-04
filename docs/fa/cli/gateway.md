---
read_when:
    - اجرای Gateway از CLI (توسعه یا سرورها)
    - عیب‌یابی احراز هویت Gateway، حالت‌های bind، و اتصال‌پذیری
    - کشف Gatewayها از طریق Bonjour (محلی + DNS-SD گسترده)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — اجرای Gateway‌ها، پرس‌وجو از آن‌ها و کشف آن‌ها
title: Gateway
x-i18n:
    generated_at: "2026-05-04T18:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 310867c59148577f2e8ce6f708da6bce936e09243ce7fbe5daeb453c6b3b370d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket متعلق به OpenClaw است (کانال‌ها، Nodeها، نشست‌ها، hookها). زیر‌دستورهای این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده.
  </Card>
  <Card title="Discovery overview" href="/fa/gateway/discovery">
    اینکه OpenClaw چگونه gatewayها را معرفی و پیدا می‌کند.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration">
    کلیدهای پیکربندی gateway در سطح بالا.
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
  <Accordion title="Startup behavior">
    - به‌طور پیش‌فرض، Gateway شروع به کار نمی‌کند مگر اینکه `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم شده باشد. برای اجراهای موقت/توسعه از `--allow-unconfigured` استفاده کنید.
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` وجود ندارد، آن را به‌عنوان پیکربندی خراب یا بازنویسی‌شده در نظر بگیرید و به‌جای فرض ضمنی حالت محلی، آن را تعمیر کنید.
    - اگر فایل وجود دارد و `gateway.mode` وجود ندارد، Gateway این وضعیت را آسیب مشکوک به پیکربندی تلقی می‌کند و حاضر نیست برای شما «محلی را حدس بزند».
    - اتصال فراتر از loopback بدون احراز هویت مسدود می‌شود (ریل ایمنی).
    - `SIGUSR1` وقتی مجاز باشد یک راه‌اندازی مجدد درون‌فرایندی را فعال می‌کند (`commands.restart` به‌طور پیش‌فرض فعال است؛ برای مسدود کردن راه‌اندازی مجدد دستی، `commands.restart: false` را تنظیم کنید، در حالی که اعمال/به‌روزرسانی ابزار/پیکربندی gateway همچنان مجاز می‌ماند).
    - handlerهای `SIGINT`/`SIGTERM` فرایند gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی ترمینال را بازیابی نمی‌کنند. اگر CLI را با TUI یا ورودی raw-mode بسته‌بندی می‌کنید، پیش از خروج ترمینال را بازیابی کنید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  پورت WebSocket (پیش‌فرض از پیکربندی/env می‌آید؛ معمولا `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  حالت bind شنونده.
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
  گذرواژه gateway را از یک فایل بخوانید.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway را از طریق Tailscale در دسترس قرار دهید.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  پیکربندی serve/funnel مربوط به Tailscale را هنگام خاموش‌شدن بازنشانی کنید.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه دهید gateway بدون `gateway.mode=local` در پیکربندی شروع شود. فقط برای bootstrap موقت/توسعه، guard شروع را دور می‌زند؛ فایل پیکربندی را نمی‌نویسد یا تعمیر نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  اگر وجود ندارد، پیکربندی توسعه + workspace بسازید (`BOOTSTRAP.md` را رد می‌کند).
</ParamField>
<ParamField path="--reset" type="boolean">
  پیکربندی توسعه + credentials + نشست‌ها + workspace را بازنشانی کنید (به `--dev` نیاز دارد).
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنونده موجود روی پورت انتخاب‌شده را بکشید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  لاگ‌های پرجزئیات.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط لاگ‌های backend مربوط به CLI را در کنسول نشان دهید (و stdout/stderr را فعال کنید).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  سبک لاگ Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار برای `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  رویدادهای خام stream مدل را در jsonl لاگ کنید.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسیر jsonl مربوط به stream خام.
</ParamField>

## راه‌اندازی مجدد Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` از Gateway در حال اجرا می‌خواهد پیش از راه‌اندازی مجدد، کارهای فعال OpenClaw را پیش‌بررسی کند. اگر عملیات صف‌شده، تحویل پاسخ، اجراهای embedded، یا اجرای taskها فعال باشند، Gateway مسدودکننده‌ها را گزارش می‌کند، درخواست‌های تکراری راه‌اندازی مجدد امن را ادغام می‌کند، و پس از تخلیه کار فعال راه‌اندازی مجدد می‌شود. `restart` ساده برای سازگاری، رفتار موجود service-manager را نگه می‌دارد. فقط زمانی از `--force` استفاده کنید که صراحتا مسیر بازنویسی فوری را می‌خواهید.

<Warning>
`--password` درون‌خطی می‌تواند در فهرست‌های فرایند محلی آشکار شود. `--password-file`، env، یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری شروع

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید تا زمان‌بندی فازها هنگام شروع Gateway لاگ شود، از جمله تاخیر `eventLoopMax` برای هر فاز و زمان‌بندی‌های جدول lookup مربوط به Plugin برای installed-index، manifest registry، برنامه‌ریزی شروع، و کار owner-map.
- `OPENCLAW_DIAGNOSTICS=timeline` را همراه با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید تا یک timeline تشخیصی شروع JSONL به‌صورت best-effort برای harnessهای QA خارجی نوشته شود. همچنین می‌توانید این پرچم را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از env تامین می‌شود. برای افزودن نمونه‌های event-loop، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- برای benchmark کردن شروع Gateway، `pnpm test:startup:gateway -- --runs 5 --warmup 1` را اجرا کنید. benchmark نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های trace شروع، تاخیر event-loop، و جزئیات زمان‌بندی جدول lookup مربوط به Plugin را ثبت می‌کند.

## پرس‌وجو از یک Gateway در حال اجرا

همه دستورهای پرس‌وجو از RPC روی WebSocket استفاده می‌کنند.

<Tabs>
  <Tab title="Output modes">
    - پیش‌فرض: خوانا برای انسان (رنگی در TTY).
    - `--json`: JSON خوانا برای ماشین (بدون سبک‌دهی/spinner).
    - `--no-color` (یا `NO_COLOR=1`): ANSI را غیرفعال می‌کند و چیدمان انسانی را نگه می‌دارد.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket مربوط به Gateway.
    - `--token <token>`: توکن Gateway.
    - `--password <password>`: گذرواژه Gateway.
    - `--timeout <ms>`: timeout/budget (بسته به دستور متفاوت است).
    - `--expect-final`: منتظر پاسخ "final" بمانید (فراخوانی‌های agent).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به credentials موجود در پیکربندی یا محیط fallback نمی‌کند. `--token` یا `--password` را صراحتا پاس دهید. نبودن credentials صریح یک خطاست.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint ‏HTTP ‏`/healthz` یک liveness probe است: وقتی سرور بتواند به HTTP پاسخ دهد، خروجی برمی‌گرداند. endpoint ‏HTTP ‏`/readyz` سخت‌گیرتر است و تا زمانی که sidecarهای Plugin شروع، کانال‌ها، یا hookهای پیکربندی‌شده هنوز در حال پایدار شدن باشند، قرمز می‌ماند. پاسخ‌های detailed readiness محلی یا احراز هویت‌شده شامل یک بلوک diagnostic به نام `eventLoop` هستند که تاخیر event-loop، میزان استفاده event-loop، نسبت هسته CPU، و یک پرچم `degraded` را دارد.

### `gateway usage-cost`

خلاصه‌های usage-cost را از لاگ‌های نشست دریافت کنید.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید لحاظ شوند.
</ParamField>

### `gateway stability`

recorder تشخیصی پایداری اخیر را از یک Gateway در حال اجرا دریافت کنید.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  حداکثر تعداد رویدادهای اخیر برای لحاظ کردن (حداکثر `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  فیلتر بر اساس نوع رویداد تشخیصی، مانند `payload.large` یا `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رویدادهای پس از یک شماره توالی تشخیصی را لحاظ کنید.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک bundle پایداری persisted را بخوانید. برای جدیدترین bundle زیر دایرکتوری state از `--bundle latest` (یا فقط `--bundle`) استفاده کنید، یا مسیر JSON یک bundle را مستقیما پاس دهید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک zip تشخیصی قابل اشتراک‌گذاری برای پشتیبانی بنویسید.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - رکوردها metadata عملیاتی را نگه می‌دارند: نام رویدادها، شمارش‌ها، اندازه‌های بایتی، خوانش‌های حافظه، وضعیت صف/نشست، نام کانال/Plugin، و خلاصه‌های نشست redact‌شده. آن‌ها متن گفت‌وگو، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، مقادیر محرمانه، hostnames، یا شناسه‌های خام نشست را نگه نمی‌دارند. برای غیرفعال کردن کامل recorder، `diagnostics.enabled: false` را تنظیم کنید.
    - هنگام خروج‌های fatal از Gateway، timeoutهای خاموشی، و شکست‌های شروع پس از راه‌اندازی مجدد، وقتی recorder رویدادهایی داشته باشد، OpenClaw همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد. جدیدترین bundle را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type`، و `--since-seq` نیز روی خروجی bundle اعمال می‌شوند.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

یک zip تشخیصی محلی بنویسید که برای پیوست کردن به گزارش‌های bug طراحی شده است. برای مدل حریم خصوصی و محتوای bundle، [Diagnostics Export](/fa/gateway/diagnostics) را ببینید.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسیر zip خروجی. پیش‌فرض، یک export پشتیبانی زیر دایرکتوری state است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  حداکثر تعداد خطوط لاگ sanitize‌شده برای لحاظ کردن.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  حداکثر بایت‌های لاگ برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket مربوط به Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout مربوط به snapshot وضعیت/سلامت.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  lookup مربوط به bundle پایداری persisted را رد کنید.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه، و manifest را به‌صورت JSON چاپ کنید.
</ParamField>

export شامل یک manifest، یک خلاصه Markdown، شکل پیکربندی، جزئیات پیکربندی sanitize‌شده، خلاصه‌های لاگ sanitize‌شده، snapshotهای وضعیت/سلامت Gateway به‌صورت sanitize‌شده، و در صورت وجود، جدیدترین bundle پایداری است.

قرار است قابل اشتراک‌گذاری باشد. جزئیات عملیاتی کمک‌کننده به debugging را نگه می‌دارد، مانند فیلدهای امن لاگ OpenClaw، نام‌های subsystem، کدهای وضعیت، مدت‌زمان‌ها، حالت‌های پیکربندی‌شده، پورت‌ها، شناسه‌های Plugin، شناسه‌های provider، تنظیمات feature غیرمحرمانه، و پیام‌های لاگ عملیاتی redact‌شده. متن گفت‌وگو، بدنه‌های webhook، خروجی‌های ابزار، credentials، کوکی‌ها، شناسه‌های حساب/پیام، متن prompt/instruction، hostnames، و مقادیر محرمانه را حذف یا redact می‌کند. وقتی یک پیام سبک LogTape شبیه متن payload کاربر/گفت‌وگو/ابزار باشد، export فقط این را نگه می‌دارد که پیام حذف شده است، به‌همراه تعداد بایت آن.

### `gateway status`

`gateway status` سرویس Gateway (launchd/systemd/schtasks) را به‌همراه یک probe اختیاری از قابلیت اتصال/احراز هویت نشان می‌دهد.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  یک هدف پروب صریح اضافه کنید. راه دور پیکربندی‌شده + localhost همچنان پروب می‌شوند.
</ParamField>
<ParamField path="--token <token>" type="string">
  احراز هویت با توکن برای پروب.
</ParamField>
<ParamField path="--password <password>" type="string">
  احراز هویت با گذرواژه برای پروب.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  مهلت زمانی پروب.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  پروب اتصال را رد کنید (نمای فقط سرویس).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را هم اسکن کنید.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  پروب اتصال پیش‌فرض را به پروب خواندن ارتقا دهید و وقتی آن پروب خواندن شکست می‌خورد با کد غیرصفر خارج شوید. نمی‌توان آن را با `--no-probe` ترکیب کرد.
</ParamField>

<AccordionGroup>
  <Accordion title="معناشناسی وضعیت">
    - `gateway status` حتی وقتی پیکربندی CLI محلی وجود ندارد یا نامعتبر است، برای تشخیص عیب در دسترس می‌ماند.
    - `gateway status` پیش‌فرض وضعیت سرویس، اتصال وب‌سوکت، و قابلیت احراز هویت قابل مشاهده هنگام دست‌دهی را اثبات می‌کند. عملیات خواندن/نوشتن/مدیریت را اثبات نمی‌کند.
    - پروب‌های تشخیصی برای احراز هویت دستگاه در نخستین استفاده تغییردهنده نیستند: وقتی توکن دستگاه کش‌شده‌ای وجود داشته باشد، همان را دوباره استفاده می‌کنند، اما صرفاً برای بررسی وضعیت، هویت جدید دستگاه CLI یا رکورد جفت‌سازی فقط‌خواندنی دستگاه ایجاد نمی‌کنند.
    - `gateway status` در صورت امکان SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت پروب حل می‌کند.
    - اگر یک SecretRef احراز هویت الزامی در این مسیر فرمان حل‌نشده باشد، `gateway status --json` هنگام شکست اتصال/احراز هویت پروب، `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحاً بدهید یا ابتدا منبع secret را حل کنید.
    - اگر پروب موفق شود، هشدارهای ارجاع احراز هویت حل‌نشده برای جلوگیری از مثبت‌های کاذب سرکوب می‌شوند.
    - وقتی سرویس در حال گوش دادن کافی نیست و لازم است فراخوانی‌های RPC با محدوده خواندن هم سالم باشند، در اسکریپت‌ها و خودکارسازی از `--require-rpc` استفاده کنید.
    - `--deep` یک اسکن با بهترین تلاش برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه Gateway شناسایی شوند، خروجی انسانی نکته‌های پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که بیشتر راه‌اندازی‌ها باید روی هر دستگاه یک Gateway اجرا کنند.
    - خروجی انسانی مسیر حل‌شده فایل لاگ به‌علاوه نمای لحظه‌ای مسیرها/اعتبار پیکربندی CLI در برابر سرویس را شامل می‌شود تا به تشخیص drift پروفایل یا دایرکتوری وضعیت کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های drift احراز هویت در systemd لینوکس">
    - در نصب‌های systemd لینوکس، بررسی‌های drift احراز هویت سرویس مقدارهای `Environment=` و `EnvironmentFile=` را از unit می‌خوانند (از جمله `%h`، مسیرهای نقل‌قول‌شده، چند فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift، SecretRefهای `gateway.auth.token` را با استفاده از محیط زمان اجرای ادغام‌شده حل می‌کنند (ابتدا محیط فرمان سرویس، سپس محیط فرایند به‌عنوان جایگزین).
    - اگر احراز هویت با توکن عملاً فعال نباشد (`gateway.auth.mode` صریحِ `password`/`none`/`trusted-proxy`، یا حالتی که تنظیم نشده و در آن گذرواژه می‌تواند انتخاب شود و هیچ نامزد توکنی نمی‌تواند انتخاب شود)، بررسی‌های drift توکن از حل توکن پیکربندی صرف‌نظر می‌کنند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` فرمان «اشکال‌زدایی همه‌چیز» است. همیشه این موارد را پروب می‌کند:

- Gateway راه دور پیکربندی‌شده شما (اگر تنظیم شده باشد)، و
- localhost (loopback) **حتی اگر راه دور پیکربندی شده باشد**.

اگر `--url` را بدهید، آن هدف صریح پیش از هر دوی آن‌ها اضافه می‌شود. خروجی انسانی هدف‌ها را این‌گونه برچسب می‌زند:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند Gateway در دسترس باشند، همه آن‌ها را چاپ می‌کند. چند Gateway وقتی از پروفایل‌ها/پورت‌های ایزوله استفاده می‌کنید (مثلاً یک ربات نجات) پشتیبانی می‌شوند، اما بیشتر نصب‌ها همچنان یک Gateway واحد اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی حداقل یک هدف اتصال وب‌سوکت را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌کند که پروب درباره احراز هویت چه چیزی را توانسته اثبات کند. این از دسترس‌پذیری جداست.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با محدوده خواندن (`health`/`status`/`system-presence`/`config.get`) نیز موفق شده‌اند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق شده اما RPC با محدوده خواندن محدود است. این به‌عنوان دسترس‌پذیری **تنزل‌یافته** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` پس از `Connect: ok` یعنی Gateway اتصال وب‌سوکت را پذیرفته، اما تشخیص‌های خواندن بعدی timeout شده‌اند یا شکست خورده‌اند. این هم دسترس‌پذیری **تنزل‌یافته** است، نه Gateway غیرقابل دسترس.
    - مانند `gateway status`، پروب از احراز هویت دستگاه کش‌شده موجود دوباره استفاده می‌کند اما هویت دستگاه یا وضعیت جفت‌سازی نخستین‌بار ایجاد نمی‌کند.
    - کد خروج تنها زمانی غیرصفر است که هیچ هدف پروب‌شده‌ای در دسترس نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالا:

    - `ok`: حداقل یک هدف در دسترس است.
    - `degraded`: حداقل یک هدف اتصال را پذیرفته اما تشخیص‌های RPC جزئیات کامل را تکمیل نکرده است.
    - `capability`: بهترین قابلیت دیده‌شده در میان اهداف در دسترس (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین هدف برای در نظر گرفتن به‌عنوان برنده فعال با این ترتیب: URL صریح، تونل SSH، راه دور پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار با بهترین تلاش همراه با `code`، `message`، و `targetIds` اختیاری.
    - `network`: راهنماهای URL برای local loopback/tailnet که از پیکربندی فعلی و شبکه‌بندی میزبان استخراج شده‌اند.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجه واقعی کشف که برای این گذر پروب استفاده شده است.

    برای هر هدف (`targets[].connect`):

    - `ok`: دسترس‌پذیری پس از اتصال + طبقه‌بندی تنزل‌یافته.
    - `rpcOk`: موفقیت کامل RPC جزئیات.
    - `scopeLimited`: RPC جزئیات به دلیل نبود محدوده operator شکست خورده است.

    برای هر هدف (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok`، وقتی موجود باشد.
    - `scopes`: محدوده‌های اعطاشده گزارش‌شده در `hello-ok`، وقتی موجود باشد.
    - `capability`: طبقه‌بندی قابلیت احراز هویت نمایش‌داده‌شده برای آن هدف.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی تونل SSH شکست خورد؛ فرمان به پروب‌های مستقیم برگشت.
    - `multiple_gateways`: بیش از یک هدف در دسترس بود؛ این غیرمعمول است مگر اینکه عمداً پروفایل‌های ایزوله، مانند یک ربات نجات، اجرا کنید.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای یک هدف ناموفق قابل حل نبود.
    - `probe_scope_limited`: اتصال وب‌سوکت موفق شد، اما پروب خواندن به دلیل نبود `operator.read` محدود شد.

  </Accordion>
</AccordionGroup>

#### راه دور از طریق SSH (هم‌ارزی با اپ Mac)

حالت «راه دور از طریق SSH» در اپ macOS از یک فوروارد پورت محلی استفاده می‌کند تا Gateway راه دور (که ممکن است فقط به loopback متصل شده باشد) در `ws://127.0.0.1:<port>` در دسترس شود.

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
  اولین میزبان Gateway کشف‌شده را از نقطه پایانی کشف حل‌شده (`local.` به‌علاوه دامنه گستره‌وسیع پیکربندی‌شده، اگر وجود داشته باشد) به‌عنوان هدف SSH انتخاب کنید. راهنماهای فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، به‌عنوان پیش‌فرض استفاده می‌شود):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

کمک‌رسان سطح‌پایین RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  رشته شیء JSON برای پارامترها.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL وب‌سوکت Gateway.
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
  عمدتاً برای RPCهای سبک عامل که رویدادهای میانی را پیش از محموله نهایی به‌صورت جریان ارسال می‌کنند.
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

### نصب با یک پوشش‌دهنده

وقتی سرویس مدیریت‌شده باید از طریق اجرایی دیگری شروع شود، از `--wrapper` استفاده کنید؛ برای مثال یک شیم مدیر اسرار یا کمک‌رسان اجرای با کاربر دیگر. پوشش‌دهنده آرگومان‌های عادی Gateway را دریافت می‌کند و مسئول است در نهایت `openclaw` یا Node را با آن آرگومان‌ها اجرا کند.

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

همچنین می‌توانید پوشش‌دهنده را از طریق محیط تنظیم کنید. `gateway install` اعتبارسنجی می‌کند که مسیر یک فایل اجرایی باشد، پوشش‌دهنده را در `ProgramArguments` سرویس می‌نویسد، و `OPENCLAW_WRAPPER` را در محیط سرویس برای نصب‌های اجباری دوباره، به‌روزرسانی‌ها، و تعمیرهای doctor بعدی پایدار می‌کند.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

برای حذف یک پوشش‌دهنده پایدارشده، هنگام نصب دوباره `OPENCLAW_WRAPPER` را پاک کنید:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="گزینه‌های فرمان">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="رفتار چرخه عمر">
    - برای restart کردن یک سرویس مدیریت‌شده از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین restart زنجیره نکنید؛ در macOS، `gateway stop` عمداً LaunchAgent را پیش از توقف آن غیرفعال می‌کند.
    - `gateway restart --wait 30s` بودجه تخلیه restart پیکربندی‌شده را برای آن restart بازنویسی می‌کند. عددهای تنها میلی‌ثانیه هستند؛ واحدهایی مانند `s`، `m`، و `h` پذیرفته می‌شوند. `--wait 0` به‌طور نامحدود منتظر می‌ماند.
    - `gateway restart --force` تخلیه کار فعال را رد می‌کند و فوراً restart می‌کند. وقتی یک اپراتور مسدودکننده‌های وظیفه فهرست‌شده را از قبل بررسی کرده و اکنون می‌خواهد gateway برگردد، از آن استفاده کنید.
    - فرمان‌های چرخه عمر برای اسکریپت‌نویسی `--json` را می‌پذیرند.

  </Accordion>
  <Accordion title="احراز هویت و SecretRefها هنگام نصب">
    - وقتی احراز هویت با توکن به توکن نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `gateway install` اعتبارسنجی می‌کند که SecretRef قابل حل باشد اما توکن حل‌شده را در فراداده محیط سرویس پایدار نمی‌کند.
    - اگر احراز هویت با توکن به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، نصب به‌صورت بسته شکست می‌خورد به جای اینکه متن ساده جایگزین را پایدار کند.
    - برای احراز هویت با گذرواژه در `gateway run`، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file`، یا `gateway.auth.password` مبتنی بر SecretRef را به `--password` درون‌خطی ترجیح دهید.
    - در حالت احراز هویت استنباطی، `OPENCLAW_GATEWAY_PASSWORD` فقط در پوسته الزامات توکن نصب را کاهش نمی‌دهد؛ هنگام نصب یک سرویس مدیریت‌شده از پیکربندی پایدار (`gateway.auth.password` یا `env` پیکربندی) استفاده کنید.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صریحاً تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف Gatewayها (Bonjour)

`gateway discover` بیکن‌های Gateway (`_openclaw-gw._tcp`) را اسکن می‌کند.

- DNS-SD چندپخشی: `local.`
- DNS-SD تک‌پخشی (Wide-Area Bonjour): یک دامنه انتخاب کنید (مثال: `openclaw.internal.`) و split DNS + یک سرور DNS راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط Gatewayهایی که کشف Bonjour در آن‌ها فعال است (پیش‌فرض) beacon را تبلیغ می‌کنند.

رکوردهای کشف Wide-Area شامل این موارد هستند (TXT):

- `role` (راهنمای نقش Gateway)
- `transport` (راهنمای transport، مثلاً `gateway`)
- `gatewayPort` (پورت WebSocket، معمولاً `18789`)
- `sshPort` (اختیاری؛ وقتی وجود نداشته باشد، کلاینت‌ها هدف‌های پیش‌فرض SSH را `22` در نظر می‌گیرند)
- `tailnetDns` (نام میزبان MagicDNS، در صورت موجود بودن)
- `gatewayTls` / `gatewayTlsSha256` (TLS فعال + اثرانگشت گواهی)
- `cliPath` (راهنمای نصب از راه دور که در zone گسترده‌محدوده نوشته می‌شود)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلت زمانی هر فرمان (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن توسط ماشین (همچنین استایل‌دهی/چرخنده را غیرفعال می‌کند).
</ParamField>

مثال‌ها:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI علاوه بر `local.`، دامنه گسترده‌محدوده پیکربندی‌شده را نیز هنگام فعال بودن اسکن می‌کند.
- `wsUrl` در خروجی JSON از endpoint سرویس resolve‌شده مشتق می‌شود، نه از راهنماهای فقط-TXT مانند `lanHost` یا `tailnetDns`.
- در mDNS مربوط به `local.`، `sshPort` و `cliPath` فقط وقتی broadcast می‌شوند که `discovery.mdns.mode` برابر `full` باشد. DNS-SD گسترده‌محدوده همچنان `cliPath` را می‌نویسد؛ `sshPort` آنجا هم اختیاری می‌ماند.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
