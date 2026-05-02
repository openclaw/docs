---
read_when:
    - اجرای Gateway از CLI (توسعه یا سرورها)
    - اشکال‌زدایی احراز هویت Gateway، حالت‌های اتصال، و اتصال‌پذیری
    - کشف Gatewayها از طریق Bonjour (محلی + DNS-SD گسترده)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gatewayها را اجرا، پرس‌وجو و کشف کنید
title: Gateway
x-i18n:
    generated_at: "2026-05-02T11:40:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f204b58e03c9dd1b75a7ddb2be0634ee70b42aa317a2668ab86cb33a0570b01
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket مربوط به OpenClaw است (کانال‌ها، Nodeها، نشست‌ها، hookها). زیرفرمان‌های این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="کشف Bonjour" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده.
  </Card>
  <Card title="نمای کلی کشف" href="/fa/gateway/discovery">
    اینکه OpenClaw چگونه gatewayها را اعلام و پیدا می‌کند.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration">
    کلیدهای پیکربندی gateway در سطح بالایی.
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
    - به‌طور پیش‌فرض، Gateway شروع به کار نمی‌کند مگر اینکه `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم شده باشد. برای اجراهای موردی/توسعه از `--allow-unconfigured` استفاده کنید.
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` موجود نیست، آن را به‌عنوان پیکربندی خراب یا بازنویسی‌شده در نظر بگیرید و به‌جای فرض ضمنی حالت محلی، آن را تعمیر کنید.
    - اگر فایل وجود دارد و `gateway.mode` موجود نیست، Gateway این وضعیت را آسیب مشکوک پیکربندی تلقی می‌کند و حاضر نمی‌شود برای شما «محلی را حدس بزند».
    - اتصال فراتر از loopback بدون احراز هویت مسدود می‌شود (محافظ ایمنی).
    - `SIGUSR1` هنگام مجاز بودن، بازراه‌اندازی درون‌فرایندی را فعال می‌کند (`commands.restart` به‌طور پیش‌فرض فعال است؛ برای مسدود کردن بازراه‌اندازی دستی `commands.restart: false` را تنظیم کنید، درحالی‌که اعمال/به‌روزرسانی ابزار و پیکربندی gateway همچنان مجاز می‌ماند).
    - handlerهای `SIGINT`/`SIGTERM` فرایند gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی ترمینال را بازیابی نمی‌کنند. اگر CLI را با TUI یا ورودی raw-mode پوشش می‌دهید، پیش از خروج ترمینال را بازیابی کنید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  پورت WebSocket (پیش‌فرض از پیکربندی/env می‌آید؛ معمولاً `18789`).
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
  هنگام خاموشی، پیکربندی serve/funnel مربوط به Tailscale را بازنشانی کنید.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه دهید gateway بدون `gateway.mode=local` در پیکربندی شروع شود. فقط برای bootstrap موردی/توسعه، محافظ راه‌اندازی را دور می‌زند؛ فایل پیکربندی را نمی‌نویسد یا تعمیر نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  اگر پیکربندی توسعه + workspace موجود نیست، آن را ایجاد کنید (`BOOTSTRAP.md` را رد می‌کند).
</ParamField>
<ParamField path="--reset" type="boolean">
  پیکربندی توسعه + اعتبارنامه‌ها + نشست‌ها + workspace را بازنشانی کنید (به `--dev` نیاز دارد).
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

<Warning>
`--password` درون‌خطی می‌تواند در فهرست‌های فرایند محلی افشا شود. `--password-file`، env، یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری راه‌اندازی

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید تا زمان‌بندی فازها هنگام راه‌اندازی Gateway لاگ شود، از جمله تأخیر `eventLoopMax` برای هر فاز و زمان‌بندی‌های جدول lookup مربوط به plugin برای installed-index، registry مانیفست، برنامه‌ریزی راه‌اندازی، و کار owner-map.
- `OPENCLAW_DIAGNOSTICS=timeline` را همراه با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید تا یک خط زمانی تشخیصی JSONL از راه‌اندازی، به‌صورت best-effort، برای harnessهای QA خارجی نوشته شود. همچنین می‌توانید این flag را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از env ارائه می‌شود. برای شامل کردن نمونه‌های event-loop، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- برای benchmark کردن راه‌اندازی Gateway، `pnpm test:startup:gateway -- --runs 5 --warmup 1` را اجرا کنید. این benchmark نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های trace راه‌اندازی، تأخیر event-loop، و جزئیات زمان‌بندی جدول lookup مربوط به plugin را ثبت می‌کند.

## پرس‌وجو از Gateway در حال اجرا

همه فرمان‌های پرس‌وجو از WebSocket RPC استفاده می‌کنند.

<Tabs>
  <Tab title="حالت‌های خروجی">
    - پیش‌فرض: خوانا برای انسان (رنگی در TTY).
    - `--json`: JSON خوانا برای ماشین (بدون استایل/spinner).
    - `--no-color` (یا `NO_COLOR=1`): ANSI را غیرفعال کنید، درحالی‌که چیدمان انسانی حفظ می‌شود.

  </Tab>
  <Tab title="گزینه‌های مشترک">
    - `--url <url>`: نشانی URL مربوط به WebSocket در Gateway.
    - `--token <token>`: توکن Gateway.
    - `--password <password>`: گذرواژه Gateway.
    - `--timeout <ms>`: timeout/بودجه زمانی (برای هر فرمان متفاوت است).
    - `--expect-final`: منتظر پاسخ «final» بمانید (فراخوانی‌های agent).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به اعتبارنامه‌های پیکربندی یا محیط fallback نمی‌کند. `--token` یا `--password` را صریحاً پاس دهید. نبود اعتبارنامه‌های صریح یک خطاست.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP با نام `/healthz` یک probe زنده‌بودن است: وقتی سرور بتواند به HTTP پاسخ دهد، برمی‌گردد. endpoint HTTP با نام `/readyz` سخت‌گیرانه‌تر است و تا زمانی که sidecarهای plugin راه‌اندازی، کانال‌ها، یا hookهای پیکربندی‌شده هنوز در حال پایدار شدن هستند، قرمز می‌ماند. پاسخ‌های readiness محلی یا دارای احراز هویت، یک بلوک تشخیصی `eventLoop` شامل تأخیر event-loop، بهره‌برداری event-loop، نسبت هسته CPU، و flag `degraded` دارند.

### `gateway usage-cost`

خلاصه‌های هزینه استفاده را از لاگ‌های نشست واکشی کنید.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید شامل شوند.
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
  بیشینه تعداد رویدادهای اخیر برای شامل کردن (حداکثر `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  بر اساس نوع رویداد تشخیصی فیلتر کنید، مانند `payload.large` یا `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رویدادهای پس از یک شماره توالی تشخیصی را شامل کنید.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک bundle پایداری ذخیره‌شده را بخوانید. برای جدیدترین bundle زیر دایرکتوری state از `--bundle latest` (یا فقط `--bundle`) استفاده کنید، یا مستقیماً یک مسیر JSON مربوط به bundle را پاس دهید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک zip تشخیصی قابل اشتراک برای پشتیبانی بنویسید.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="حریم خصوصی و رفتار bundle">
    - رکوردها metadata عملیاتی را نگه می‌دارند: نام رویدادها، شمارش‌ها، اندازه‌های بایت، خوانش‌های حافظه، وضعیت صف/نشست، نام کانال/plugin، و خلاصه‌های نشست ویرایش‌شده. آن‌ها متن چت، بدنه‌های webhook، خروجی ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، مقادیر secret، hostnameها، یا شناسه‌های خام نشست را نگه نمی‌دارند. برای غیرفعال کردن کامل ضبط‌کننده، `diagnostics.enabled: false` را تنظیم کنید.
    - در خروج‌های fatal مربوط به Gateway، timeoutهای خاموشی، و شکست‌های راه‌اندازی مجدد، وقتی ضبط‌کننده رویدادهایی داشته باشد، OpenClaw همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد. جدیدترین bundle را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type`، و `--since-seq` نیز روی خروجی bundle اعمال می‌شوند.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

یک zip تشخیصی محلی بنویسید که برای پیوست کردن به گزارش‌های bug طراحی شده است. برای مدل حریم خصوصی و محتوای bundle، [خروجی گرفتن از Diagnostics](/fa/gateway/diagnostics) را ببینید.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسیر zip خروجی. به‌طور پیش‌فرض یک خروجی پشتیبانی زیر دایرکتوری state است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  بیشینه خطوط لاگ پاک‌سازی‌شده برای شامل کردن.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  بیشینه بایت‌های لاگ برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  نشانی URL مربوط به WebSocket در Gateway برای snapshot سلامت.
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
  lookup مربوط به bundle پایداری ذخیره‌شده را رد کنید.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه، و مانیفست را به‌صورت JSON چاپ کنید.
</ParamField>

این خروجی شامل یک مانیفست، خلاصه Markdown، شکل پیکربندی، جزئیات پیکربندی پاک‌سازی‌شده، خلاصه‌های لاگ پاک‌سازی‌شده، snapshotهای وضعیت/سلامت Gateway پاک‌سازی‌شده، و جدیدترین bundle پایداری در صورت وجود است.

برای اشتراک‌گذاری در نظر گرفته شده است. این خروجی جزئیات عملیاتی مفید برای اشکال‌زدایی را نگه می‌دارد، مانند فیلدهای امن لاگ OpenClaw، نام زیرسیستم‌ها، کدهای وضعیت، مدت‌زمان‌ها، حالت‌های پیکربندی‌شده، پورت‌ها، شناسه‌های plugin، شناسه‌های provider، تنظیمات غیرمحرمانه قابلیت‌ها، و پیام‌های لاگ عملیاتی ویرایش‌شده. متن چت، بدنه‌های webhook، خروجی ابزار، اعتبارنامه‌ها، کوکی‌ها، شناسه‌های حساب/پیام، متن prompt/دستورالعمل، hostnameها، و مقادیر secret را حذف یا ویرایش می‌کند. وقتی پیامی به سبک LogTape شبیه متن payload کاربر/چت/ابزار باشد، خروجی فقط این را نگه می‌دارد که یک پیام حذف شده است، به‌همراه شمارش بایت آن.

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
  probe اتصال پیش‌فرض را به یک probe خواندن ارتقا دهید و وقتی آن probe خواندن شکست می‌خورد، با کد غیرصفر خارج شوید. نمی‌تواند با `--no-probe` ترکیب شود.
</ParamField>

<AccordionGroup>
  <Accordion title="معنای وضعیت">
    - `gateway status` حتی وقتی پیکربندی CLI محلی وجود ندارد یا نامعتبر است، برای عیب‌یابی در دسترس می‌ماند.
    - `gateway status` پیش‌فرض، وضعیت سرویس، اتصال WebSocket، و قابلیت احراز هویتِ قابل مشاهده در زمان دست‌دهی را اثبات می‌کند. عملیات خواندن/نوشتن/مدیریت را اثبات نمی‌کند.
    - پروب‌های عیب‌یابی برای احراز هویت دستگاهِ بار اول، بدون تغییر هستند: وقتی توکن دستگاهِ کش‌شده‌ای وجود داشته باشد از آن دوباره استفاده می‌کنند، اما صرفا برای بررسی وضعیت، هویت دستگاه CLI جدید یا رکورد جفت‌سازی دستگاهِ فقط‌خواندنی ایجاد نمی‌کنند.
    - `gateway status` در صورت امکان SecretRefهای احراز هویتِ پیکربندی‌شده را برای احراز هویت پروب resolve می‌کند.
    - اگر یک SecretRef احراز هویتِ الزامی در این مسیر فرمان resolve نشود، `gateway status --json` وقتی اتصال/احراز هویت پروب شکست بخورد `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صراحتا پاس دهید یا ابتدا منبع secret را resolve کنید.
    - اگر پروب موفق شود، هشدارهای auth-ref resolveنشده برای جلوگیری از مثبت‌های کاذب سرکوب می‌شوند.
    - وقتی یک سرویس در حال گوش دادن کافی نیست و لازم دارید فراخوانی‌های RPC با دامنه خواندن نیز سالم باشند، در اسکریپت‌ها و خودکارسازی از `--require-rpc` استفاده کنید.
    - `--deep` یک اسکن best-effort برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه Gateway تشخیص داده شود، خروجی انسانی راهنمایی‌های پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که بیشتر راه‌اندازی‌ها باید روی هر ماشین یک Gateway اجرا کنند.
    - خروجی انسانی، مسیر log فایل resolveشده به‌همراه نمای کلی مسیرهای پیکربندی/اعتبار CLI در برابر سرویس را شامل می‌شود تا به عیب‌یابی drift پروفایل یا state-dir کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های drift احراز هویت Linux systemd">
    - در نصب‌های Linux systemd، بررسی‌های drift احراز هویت سرویس، مقدارهای `Environment=` و `EnvironmentFile=` را از unit می‌خوانند (شامل `%h`، مسیرهای نقل‌قول‌دار، چند فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift، SecretRefهای `gateway.auth.token` را با استفاده از runtime env ادغام‌شده resolve می‌کنند (ابتدا env فرمان سرویس، سپس fallback به process env).
    - اگر احراز هویت توکنی عملا فعال نباشد (`gateway.auth.mode` صریحِ `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد و password بتواند برنده شود و هیچ token candidate نتواند برنده شود)، بررسی‌های token-drift از resolve کردن توکن پیکربندی صرف‌نظر می‌کنند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` فرمان «عیب‌یابی همه‌چیز» است. همیشه این موارد را probe می‌کند:

- Gateway راه‌دور پیکربندی‌شده شما (اگر تنظیم شده باشد)، و
- localhost (loopback) **حتی اگر راه‌دور پیکربندی شده باشد**.

اگر `--url` را پاس دهید، آن هدف صریح جلوتر از هر دو اضافه می‌شود. خروجی انسانی هدف‌ها را این‌گونه برچسب می‌زند:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند Gateway در دسترس باشند، همه آن‌ها را چاپ می‌کند. وقتی از پروفایل‌ها/پورت‌های ایزوله استفاده می‌کنید (مثلا یک ربات نجات)، چند Gateway پشتیبانی می‌شود، اما بیشتر نصب‌ها همچنان یک Gateway واحد اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی حداقل یک هدف اتصال WebSocket را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌کند پروب چه چیزی را درباره احراز هویت توانسته اثبات کند. این از reachability جدا است.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با دامنه خواندن (`health`/`status`/`system-presence`/`config.get`) نیز موفق شدند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق شد اما RPC با دامنه خواندن محدود است. این به‌عنوان reachability **تنزل‌یافته** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` بعد از `Connect: ok` یعنی Gateway اتصال WebSocket را پذیرفت، اما عیب‌یابی‌های خواندنِ بعدی timeout شدند یا شکست خوردند. این هم reachability **تنزل‌یافته** است، نه Gateway غیرقابل‌دسترسی.
    - مانند `gateway status`، probe از احراز هویت دستگاهِ کش‌شده موجود دوباره استفاده می‌کند اما هویت دستگاه یا وضعیت جفت‌سازیِ بار اول ایجاد نمی‌کند.
    - کد خروج فقط وقتی غیرصفر است که هیچ هدف probeشده‌ای reachable نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالا:

    - `ok`: حداقل یک هدف reachable است.
    - `degraded`: حداقل یک هدف اتصال را پذیرفته اما عیب‌یابی کامل RPC جزئیات را کامل نکرده است.
    - `capability`: بهترین قابلیت دیده‌شده در میان هدف‌های reachable (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین هدف برای تلقی به‌عنوان برنده فعال، به این ترتیب: URL صریح، SSH tunnel، راه‌دور پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار best-effort با `code`، `message`، و `targetIds` اختیاری.
    - `network`: راهنمایی‌های URL برای local loopback/tailnet که از پیکربندی فعلی و شبکه میزبان مشتق شده‌اند.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجه واقعی discovery که برای این گذر probe استفاده شده است.

    به‌ازای هر هدف (`targets[].connect`):

    - `ok`: reachability پس از connect + طبقه‌بندی degraded.
    - `rpcOk`: موفقیت کامل RPC جزئیات.
    - `scopeLimited`: RPC جزئیات به‌دلیل نبود دامنه operator شکست خورد.

    به‌ازای هر هدف (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok`، در صورت موجود بودن.
    - `scopes`: دامنه‌های اعطاشده گزارش‌شده در `hello-ok`، در صورت موجود بودن.
    - `capability`: طبقه‌بندی قابلیت احراز هویت نمایش‌داده‌شده برای آن هدف.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی SSH tunnel شکست خورد؛ فرمان به probeهای مستقیم fallback کرد.
    - `multiple_gateways`: بیش از یک هدف reachable بود؛ این غیرمعمول است مگر اینکه عمدا پروفایل‌های ایزوله، مانند یک ربات نجات، اجرا کنید.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویتِ پیکربندی‌شده برای یک هدف شکست‌خورده resolve نشد.
    - `probe_scope_limited`: اتصال WebSocket موفق شد، اما probe خواندن به‌دلیل نبود `operator.read` محدود شد.

  </Accordion>
</AccordionGroup>

#### راه‌دور از طریق SSH (همترازی برنامه Mac)

حالت "Remote over SSH" برنامه macOS از یک port-forward محلی استفاده می‌کند تا Gateway راه‌دور (که ممکن است فقط به loopback bind شده باشد) در `ws://127.0.0.1:<port>` قابل دسترسی شود.

معادل CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` یا `user@host:port` (port به‌طور پیش‌فرض `22` است).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  فایل هویت.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  نخستین میزبان Gateway کشف‌شده را به‌عنوان هدف SSH از endpoint کشف resolveشده انتخاب کنید (`local.` به‌علاوه دامنه wide-area پیکربندی‌شده، اگر وجود داشته باشد). راهنمایی‌های فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، به‌عنوان پیش‌فرض استفاده می‌شود):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

کمک‌کننده سطح‌پایین RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  رشته شیء JSON برای params.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL مربوط به WebSocket Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  بودجه timeout.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  عمدتا برای RPCهای سبک agent که رویدادهای میانی را پیش از payload نهایی stream می‌کنند.
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

### نصب با wrapper

وقتی سرویس مدیریت‌شده باید از طریق یک executable دیگر شروع شود، مثلا یک shim مدیر secrets یا یک کمک‌کننده run-as، از `--wrapper` استفاده کنید. wrapper آرگومان‌های معمول Gateway را دریافت می‌کند و مسئول است در نهایت `openclaw` یا Node را با همان آرگومان‌ها exec کند.

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

همچنین می‌توانید wrapper را از طریق محیط تنظیم کنید. `gateway install` اعتبارسنجی می‌کند که مسیر یک فایل executable است، wrapper را در `ProgramArguments` سرویس می‌نویسد، و `OPENCLAW_WRAPPER` را در محیط سرویس برای نصب‌های مجدد اجباری، به‌روزرسانی‌ها، و تعمیرهای doctor بعدی پایدار می‌کند.

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
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="رفتار چرخه عمر">
    - برای راه‌اندازی دوباره یک سرویس مدیریت‌شده از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین restart زنجیره نکنید؛ در macOS، `gateway stop` عمدا LaunchAgent را پیش از توقف آن غیرفعال می‌کند.
    - فرمان‌های چرخه عمر، `--json` را برای اسکریپت‌نویسی می‌پذیرند.

  </Accordion>
  <Accordion title="احراز هویت و SecretRefs در زمان نصب">
    - وقتی احراز هویت توکنی به توکن نیاز دارد و `gateway.auth.token` توسط SecretRef مدیریت می‌شود، `gateway install` اعتبارسنجی می‌کند که SecretRef قابل resolve است اما توکن resolveشده را در metadata محیط سرویس پایدار نمی‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolve نشده باشد، نصب به‌صورت fail closed شکست می‌خورد، به‌جای اینکه plaintext fallback را پایدار کند.
    - برای احراز هویت گذرواژه در `gateway run`، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file`، یا `gateway.auth.password` پشتوانه‌شده با SecretRef را به `--password` inline ترجیح دهید.
    - در حالت احراز هویت استنباط‌شده، `OPENCLAW_GATEWAY_PASSWORD` فقط در shell الزام‌های توکن نصب را شل نمی‌کند؛ هنگام نصب یک سرویس مدیریت‌شده از پیکربندی بادوام (`gateway.auth.password` یا config `env`) استفاده کنید.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صراحتا تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف Gatewayها (Bonjour)

`gateway discover` برای beaconهای Gateway (`_openclaw-gw._tcp`) اسکن می‌کند.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): یک دامنه انتخاب کنید (مثال: `openclaw.internal.`) و split DNS + یک DNS server راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط Gatewayهایی که کشف Bonjour در آن‌ها فعال است (پیش‌فرض) beacon را advertise می‌کنند.

رکوردهای کشف Wide-Area شامل این موارد هستند (TXT):

- `role` (راهنمای نقش Gateway)
- `transport` (راهنمای transport، مثلا `gateway`)
- `gatewayPort` (پورت WebSocket، معمولا `18789`)
- `sshPort` (اختیاری؛ clients وقتی وجود نداشته باشد اهداف SSH را به‌طور پیش‌فرض `22` می‌گذارند)
- `tailnetDns` (نام میزبان MagicDNS، هنگام موجود بودن)
- `gatewayTls` / `gatewayTlsSha256` (TLS فعال + fingerprint گواهی)
- `cliPath` (راهنمای نصب راه‌دور نوشته‌شده در wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  timeout به‌ازای هر فرمان (browse/resolve).
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
- CLI وقتی فعال باشد، `local.` را به‌همراه دامنهٔ گستردهٔ پیکربندی‌شده اسکن می‌کند.
- `wsUrl` در خروجی JSON از نقطهٔ پایانی سرویسِ حل‌شده به‌دست می‌آید، نه از راهنماهای فقط TXT مانند `lanHost` یا `tailnetDns`.
- در mDNS مربوط به `local.`، `sshPort` و `cliPath` فقط زمانی پخش می‌شوند که `discovery.mdns.mode` برابر با `full` باشد. DNS-SD گسترده همچنان `cliPath` را می‌نویسد؛ `sshPort` آنجا هم اختیاری می‌ماند.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
