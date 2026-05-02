---
read_when:
    - اجرای Gateway از CLI (توسعه یا سرورها)
    - اشکال‌زدایی احراز هویت Gateway، حالت‌های bind و اتصال‌پذیری
    - کشف Gatewayها از طریق Bonjour (DNS-SD محلی + گسترده‌ناحیه)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — اجرای Gatewayها، پرس‌وجوی آن‌ها و کشفشان
title: Gateway
x-i18n:
    generated_at: "2026-05-02T22:18:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket مربوط به OpenClaw است (کانال‌ها، گره‌ها، نشست‌ها، هوک‌ها). زیرفرمان‌های این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده.
  </Card>
  <Card title="Discovery overview" href="/fa/gateway/discovery">
    اینکه OpenClaw چگونه Gatewayها را معرفی و پیدا می‌کند.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration">
    کلیدهای پیکربندی سطح بالای Gateway.
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
    - به‌طور پیش‌فرض، Gateway از شروع به کار خودداری می‌کند مگر اینکه `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم شده باشد. برای اجراهای موردی/توسعه از `--allow-unconfigured` استفاده کنید.
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` وجود ندارد، آن را پیکربندی خراب یا بازنویسی‌شده در نظر بگیرید و به‌جای فرض ضمنی حالت محلی، آن را تعمیر کنید.
    - اگر فایل وجود دارد و `gateway.mode` وجود ندارد، Gateway این وضعیت را آسیب مشکوک پیکربندی تلقی می‌کند و برای شما «محلی بودن را حدس» نمی‌زند.
    - اتصال فراتر از loopback بدون احراز هویت مسدود می‌شود (محافظ ایمنی).
    - `SIGUSR1` در صورت مجاز بودن، یک راه‌اندازی مجدد درون‌فرایندی را فعال می‌کند (`commands.restart` به‌طور پیش‌فرض فعال است؛ برای مسدود کردن راه‌اندازی مجدد دستی، `commands.restart: false` را تنظیم کنید، در حالی که ابزار Gateway/اعمال پیکربندی/به‌روزرسانی همچنان مجاز می‌مانند).
    - کنترل‌گرهای `SIGINT`/`SIGTERM` فرایند Gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی ترمینال را بازگردانی نمی‌کنند. اگر CLI را با یک TUI یا ورودی raw-mode پوشش می‌دهید، پیش از خروج ترمینال را بازگردانی کنید.

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
  بازنویسی رمز عبور.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  رمز عبور Gateway را از یک فایل بخوانید.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway را از طریق Tailscale در دسترس قرار دهید.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  پیکربندی serve/funnel مربوط به Tailscale را هنگام خاموشی بازنشانی کنید.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه دهید Gateway بدون `gateway.mode=local` در پیکربندی شروع شود. فقط برای راه‌اندازی موقت/توسعه، محافظ شروع را دور می‌زند؛ فایل پیکربندی را نمی‌نویسد یا تعمیر نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  اگر موجود نباشد، یک پیکربندی توسعه + workspace ایجاد کنید (از BOOTSTRAP.md عبور می‌کند).
</ParamField>
<ParamField path="--reset" type="boolean">
  پیکربندی توسعه + اعتبارنامه‌ها + نشست‌ها + workspace را بازنشانی کنید (نیازمند `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنونده موجود روی پورت انتخاب‌شده را متوقف کنید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  گزارش‌های مفصل.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط گزارش‌های backend مربوط به CLI را در کنسول نشان دهید (و stdout/stderr را فعال کنید).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  سبک گزارش Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار برای `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  رویدادهای خام جریان مدل را در jsonl ثبت کنید.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسیر jsonl جریان خام.
</ParamField>

<Warning>
`--password` درون‌خطی ممکن است در فهرست فرایندهای محلی آشکار شود. `--password-file`، env، یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری شروع

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید تا زمان‌بندی مرحله‌ها هنگام شروع Gateway ثبت شود، از جمله تأخیر `eventLoopMax` برای هر مرحله و زمان‌بندی‌های جدول جست‌وجوی Plugin برای installed-index، manifest registry، برنامه‌ریزی شروع، و کارهای owner-map.
- `OPENCLAW_DIAGNOSTICS=timeline` را همراه با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید تا یک timeline تشخیصی شروع با بهترین تلاش در قالب JSONL برای harnessهای QA خارجی نوشته شود. همچنین می‌توانید این پرچم را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از env فراهم می‌شود. برای گنجاندن نمونه‌های event-loop، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- برای benchmark شروع Gateway، `pnpm test:startup:gateway -- --runs 5 --warmup 1` را اجرا کنید. benchmark نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های trace شروع، تأخیر event-loop، و جزئیات زمان‌بندی جدول جست‌وجوی Plugin را ثبت می‌کند.

## پرس‌وجوی یک Gateway در حال اجرا

همه فرمان‌های پرس‌وجو از WebSocket RPC استفاده می‌کنند.

<Tabs>
  <Tab title="Output modes">
    - پیش‌فرض: خوانا برای انسان (در TTY رنگی).
    - `--json`: JSON خوانا برای ماشین (بدون styling/spinner).
    - `--no-color` (یا `NO_COLOR=1`): ANSI را غیرفعال می‌کند و در عین حال چیدمان انسانی را حفظ می‌کند.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL مربوط به WebSocket Gateway.
    - `--token <token>`: توکن Gateway.
    - `--password <password>`: رمز عبور Gateway.
    - `--timeout <ms>`: timeout/budget (بسته به فرمان متفاوت است).
    - `--expect-final`: منتظر پاسخ "final" بمانید (فراخوانی‌های agent).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به اعتبارنامه‌های پیکربندی یا محیط fallback نمی‌کند. `--token` یا `--password` را صریحاً ارسال کنید. نبود اعتبارنامه‌های صریح خطاست.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP مربوط به `/healthz` یک probe زنده‌بودن است: وقتی سرور بتواند به HTTP پاسخ دهد، برمی‌گردد. endpoint HTTP مربوط به `/readyz` سخت‌گیرانه‌تر است و تا زمانی که sidecarهای Plugin شروع، کانال‌ها، یا hookهای پیکربندی‌شده هنوز در حال پایدار شدن هستند، قرمز می‌ماند. پاسخ‌های readiness محلی یا احراز هویت‌شده شامل یک بلوک تشخیصی `eventLoop` با تأخیر event-loop، بهره‌برداری event-loop، نسبت هسته CPU، و یک پرچم `degraded` هستند.

### `gateway usage-cost`

خلاصه‌های هزینه مصرف را از گزارش‌های نشست دریافت کنید.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید گنجانده شوند.
</ParamField>

### `gateway stability`

ثبت‌کننده پایداری تشخیصی اخیر را از یک Gateway در حال اجرا دریافت کنید.

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
  فیلتر بر اساس نوع رویداد تشخیصی، مانند `payload.large` یا `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رویدادهای پس از یک شماره توالی تشخیصی را شامل کنید.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک bundle پایداری ذخیره‌شده را بخوانید. برای جدیدترین bundle زیر دایرکتوری وضعیت از `--bundle latest` (یا فقط `--bundle`) استفاده کنید، یا مسیر JSON یک bundle را مستقیماً ارسال کنید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک zip تشخیصی پشتیبانی قابل اشتراک‌گذاری بنویسید.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - رکوردها metadata عملیاتی را نگه می‌دارند: نام رویدادها، شمارش‌ها، اندازه‌های byte، خوانش‌های حافظه، وضعیت صف/نشست، نام کانال/Plugin، و خلاصه‌های نشست ویرایش‌شده. آن‌ها متن chat، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، tokenها، cookieها، مقادیر secret، hostnameها، یا شناسه‌های خام نشست را نگه نمی‌دارند. برای غیرفعال کردن کامل ثبت‌کننده، `diagnostics.enabled: false` را تنظیم کنید.
    - هنگام خروج‌های fatal از Gateway، timeoutهای خاموشی، و شکست‌های شروع پس از restart، وقتی ثبت‌کننده رویداد داشته باشد، OpenClaw همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد. جدیدترین bundle را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type`، و `--since-seq` نیز روی خروجی bundle اعمال می‌شوند.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

یک zip تشخیصی محلی بنویسید که برای پیوست شدن به گزارش‌های bug طراحی شده است. برای مدل privacy و محتوای bundle، [Diagnostics Export](/fa/gateway/diagnostics) را ببینید.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسیر zip خروجی. پیش‌فرض، یک export پشتیبانی زیر دایرکتوری وضعیت است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  حداکثر خطوط log پاک‌سازی‌شده برای گنجاندن.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  حداکثر byteهای log برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL مربوط به WebSocket Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  رمز عبور Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout برای snapshot وضعیت/سلامت.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  جست‌وجوی bundle پایداری ذخیره‌شده را رد کنید.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه، و manifest را به‌صورت JSON چاپ کنید.
</ParamField>

export شامل یک manifest، یک خلاصه Markdown، شکل پیکربندی، جزئیات پیکربندی پاک‌سازی‌شده، خلاصه‌های log پاک‌سازی‌شده، snapshotهای وضعیت/سلامت پاک‌سازی‌شده Gateway، و جدیدترین bundle پایداری در صورت وجود است.

هدف آن اشتراک‌گذاری است. جزئیات عملیاتی مفید برای debugging را نگه می‌دارد، مانند فیلدهای امن log مربوط به OpenClaw، نام‌های subsystem، کدهای وضعیت، durationها، حالت‌های پیکربندی‌شده، پورت‌ها، شناسه‌های Plugin، شناسه‌های provider، تنظیمات feature غیرمحرمانه، و پیام‌های log عملیاتی ویرایش‌شده. متن chat، بدنه‌های webhook، خروجی‌های ابزار، اعتبارنامه‌ها، cookieها، شناسه‌های account/message، متن prompt/instruction، hostnameها، و مقادیر secret را حذف یا ویرایش می‌کند. وقتی یک پیام با سبک LogTape شبیه متن payload کاربر/chat/tool باشد، export فقط این را نگه می‌دارد که یک پیام حذف شده است به‌همراه شمار byte آن.

### `gateway status`

`gateway status` سرویس Gateway (launchd/systemd/schtasks) را به‌همراه یک probe اختیاری از قابلیت اتصال/احراز هویت نشان می‌دهد.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  یک هدف probe صریح اضافه کنید. remote پیکربندی‌شده + localhost همچنان probe می‌شوند.
</ParamField>
<ParamField path="--token <token>" type="string">
  احراز هویت token برای probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  احراز هویت password برای probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  timeout مربوط به probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  probe اتصال را رد کنید (نمای فقط سرویس).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را نیز scan کنید.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  probe اتصال پیش‌فرض را به یک probe خواندن ارتقا دهید و وقتی آن probe خواندن شکست بخورد، با مقدار غیرصفر خارج شوید. نمی‌تواند با `--no-probe` ترکیب شود.
</ParamField>

<AccordionGroup>
  <Accordion title="معنای وضعیت">
    - `gateway status` حتی وقتی پیکربندی CLI محلی موجود نیست یا نامعتبر است، برای عیب‌یابی در دسترس می‌ماند.
    - `gateway status` پیش‌فرض، وضعیت سرویس، اتصال WebSocket و قابلیت احراز هویت قابل مشاهده در زمان دست‌دهی را اثبات می‌کند. عملیات خواندن/نوشتن/مدیریت را اثبات نمی‌کند.
    - کاوش‌های عیب‌یابی برای احراز هویت دستگاه برای اولین بار، بدون تغییر هستند: وقتی توکن دستگاه ذخیره‌شده‌ای وجود داشته باشد از آن دوباره استفاده می‌کنند، اما فقط برای بررسی وضعیت، هویت دستگاه CLI جدید یا رکورد جفت‌سازی دستگاه فقط‌خواندنی ایجاد نمی‌کنند.
    - `gateway status` در صورت امکان SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت کاوش حل می‌کند.
    - اگر یک SecretRef احراز هویت موردنیاز در این مسیر فرمان حل نشود، `gateway status --json` هنگام شکست اتصال/احراز هویت کاوش، `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحا بدهید یا ابتدا منبع secret را حل کنید.
    - اگر کاوش موفق شود، هشدارهای auth-ref حل‌نشده برای جلوگیری از مثبت‌های کاذب پنهان می‌شوند.
    - وقتی سرویس در حال گوش دادن کافی نیست و لازم است فراخوانی‌های RPC با محدوده خواندن نیز سالم باشند، در اسکریپت‌ها و خودکارسازی از `--require-rpc` استفاده کنید.
    - `--deep` یک اسکن best-effort برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه Gateway شناسایی شود، خروجی انسانی نکات پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که بیشتر راه‌اندازی‌ها باید روی هر ماشین یک Gateway اجرا کنند.
    - خروجی انسانی شامل مسیر فایل لاگ حل‌شده به‌همراه تصویر لحظه‌ای مسیرها/اعتبار پیکربندی CLI در برابر سرویس است تا به عیب‌یابی drift پروفایل یا state-dir کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های drift احراز هویت systemd در Linux">
    - در نصب‌های Linux systemd، بررسی‌های drift احراز هویت سرویس هر دو مقدار `Environment=` و `EnvironmentFile=` را از unit می‌خوانند (شامل `%h`، مسیرهای نقل‌قول‌شده، چند فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift، SecretRefهای `gateway.auth.token` را با استفاده از env زمان اجرا ادغام‌شده حل می‌کنند (ابتدا env فرمان سرویس، سپس env فرایند به‌عنوان fallback).
    - اگر احراز هویت توکنی عملا فعال نباشد (`gateway.auth.mode` صریح با مقدار `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد که در آن password می‌تواند برنده شود و هیچ کاندیدای token نمی‌تواند برنده شود)، بررسی‌های token-drift از حل token پیکربندی صرف‌نظر می‌کنند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` فرمان «عیب‌یابی همه‌چیز» است. همیشه این موارد را کاوش می‌کند:

- Gateway راه دور پیکربندی‌شده شما (اگر تنظیم شده باشد)، و
- localhost (loopback) **حتی اگر remote پیکربندی شده باشد**.

اگر `--url` را بدهید، آن هدف صریح پیش از هر دو اضافه می‌شود. خروجی انسانی هدف‌ها را این‌گونه برچسب‌گذاری می‌کند:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند Gateway قابل دسترسی باشند، همه آن‌ها را چاپ می‌کند. وقتی از پروفایل‌ها/پورت‌های جداگانه استفاده می‌کنید (مثلا یک ربات نجات)، چند Gateway پشتیبانی می‌شود، اما بیشتر نصب‌ها همچنان یک Gateway واحد اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی دست‌کم یک هدف اتصال WebSocket را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌کند که کاوش چه چیزی را درباره احراز هویت توانسته اثبات کند. این از قابل دسترس بودن جداست.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با محدوده خواندن (`health`/`status`/`system-presence`/`config.get`) نیز موفق بوده‌اند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق بوده اما RPC با محدوده خواندن محدود است. این به‌عنوان قابل دسترس بودن **تنزل‌یافته** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` پس از `Connect: ok` یعنی Gateway اتصال WebSocket را پذیرفته، اما عیب‌یابی‌های خواندن بعدی timeout شده یا شکست خورده‌اند. این نیز قابل دسترس بودن **تنزل‌یافته** است، نه یک Gateway غیرقابل دسترس.
    - مانند `gateway status`، probe از احراز هویت دستگاه ذخیره‌شده موجود دوباره استفاده می‌کند اما هویت دستگاه برای اولین بار یا وضعیت جفت‌سازی ایجاد نمی‌کند.
    - کد خروج فقط زمانی غیرصفر است که هیچ هدف کاوش‌شده‌ای قابل دسترسی نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالا:

    - `ok`: دست‌کم یک هدف قابل دسترسی است.
    - `degraded`: دست‌کم یک هدف اتصال را پذیرفته اما عیب‌یابی‌های RPC جزئیات کامل را کامل نکرده است.
    - `capability`: بهترین قابلیت مشاهده‌شده در میان هدف‌های قابل دسترسی (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین هدف برای در نظر گرفتن به‌عنوان برنده فعال، به این ترتیب: URL صریح، SSH tunnel، remote پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار best-effort با `code`، `message` و `targetIds` اختیاری.
    - `network`: راهنمای URLهای local loopback/tailnet مشتق‌شده از پیکربندی فعلی و شبکه میزبان.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجه واقعی discovery استفاده‌شده برای این گذر probe.

    برای هر هدف (`targets[].connect`):

    - `ok`: قابل دسترس بودن پس از اتصال + طبقه‌بندی تنزل‌یافته.
    - `rpcOk`: موفقیت RPC جزئیات کامل.
    - `scopeLimited`: شکست RPC جزئیات به‌دلیل نبود محدوده operator.

    برای هر هدف (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok` وقتی در دسترس باشد.
    - `scopes`: محدوده‌های اعطاشده گزارش‌شده در `hello-ok` وقتی در دسترس باشند.
    - `capability`: طبقه‌بندی قابلیت احراز هویت نمایش‌داده‌شده برای آن هدف.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی SSH tunnel شکست خورد؛ فرمان به probeهای مستقیم fallback کرد.
    - `multiple_gateways`: بیش از یک هدف قابل دسترسی بود؛ این غیرمعمول است مگر اینکه عمدا پروفایل‌های جداگانه، مانند ربات نجات، اجرا کنید.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای یک هدف شکست‌خورده قابل حل نبود.
    - `probe_scope_limited`: اتصال WebSocket موفق بود، اما read probe به‌دلیل نبود `operator.read` محدود شد.

  </Accordion>
</AccordionGroup>

#### Remote روی SSH (هم‌ارزی برنامه Mac)

حالت "Remote over SSH" در برنامه macOS از یک port-forward محلی استفاده می‌کند تا Gateway راه دور (که ممکن است فقط به loopback متصل باشد) در `ws://127.0.0.1:<port>` قابل دسترسی شود.

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
  نخستین میزبان Gateway کشف‌شده را از endpoint حل‌شده discovery (`local.` به‌علاوه دامنه wide-area پیکربندی‌شده، اگر وجود داشته باشد) به‌عنوان هدف SSH انتخاب می‌کند. راهنماهای فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، استفاده به‌عنوان پیش‌فرض):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

کمک‌کار RPC سطح پایین.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  رشته شیء JSON برای params.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket مربوط به Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  token مربوط به Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  password مربوط به Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  بودجه timeout.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  عمدتا برای RPCهای سبک agent که پیش از payload نهایی، رویدادهای میانی را stream می‌کنند.
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

### نصب با wrapper

وقتی سرویس مدیریت‌شده باید از طریق executable دیگری شروع شود، مثلا یک shim مدیریت secrets یا کمک‌کار run-as، از `--wrapper` استفاده کنید. wrapper آرگومان‌های معمول Gateway را دریافت می‌کند و مسئول است در نهایت `openclaw` یا Node را با آن آرگومان‌ها exec کند.

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

همچنین می‌توانید wrapper را از طریق environment تنظیم کنید. `gateway install` اعتبارسنجی می‌کند که مسیر یک فایل executable باشد، wrapper را در `ProgramArguments` سرویس می‌نویسد، و `OPENCLAW_WRAPPER` را در environment سرویس برای نصب مجدد اجباری، به‌روزرسانی‌ها، و تعمیرهای doctor بعدی پایدار می‌کند.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

برای حذف wrapper پایدارشده، هنگام نصب مجدد `OPENCLAW_WRAPPER` را پاک کنید:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="گزینه‌های فرمان">
    - `gateway status`: `--url`، `--token`، `--password`، `--timeout`، `--no-probe`، `--require-rpc`، `--deep`، `--json`
    - `gateway install`: `--port`، `--runtime <node|bun>`، `--token`، `--wrapper <path>`، `--force`، `--json`
    - `gateway restart`: `--force`، `--wait <duration>`، `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="رفتار چرخه عمر">
    - برای راه‌اندازی مجدد یک سرویس مدیریت‌شده از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین restart زنجیره نکنید؛ در macOS، `gateway stop` عمدا پیش از توقف LaunchAgent، آن را غیرفعال می‌کند.
    - `gateway restart --wait 30s` بودجه drain راه‌اندازی مجدد پیکربندی‌شده را برای آن restart override می‌کند. عددهای بدون واحد میلی‌ثانیه هستند؛ واحدهایی مانند `s`، `m` و `h` پذیرفته می‌شوند. `--wait 0` به‌طور نامحدود منتظر می‌ماند.
    - `gateway restart --force` از drain کار فعال صرف‌نظر می‌کند و بلافاصله restart می‌کند. وقتی operator مسدودکننده‌های task فهرست‌شده را قبلا بررسی کرده و اکنون می‌خواهد Gateway برگردد، از آن استفاده کنید.
    - فرمان‌های چرخه عمر برای اسکریپت‌نویسی `--json` را می‌پذیرند.

  </Accordion>
  <Accordion title="احراز هویت و SecretRefها هنگام نصب">
    - وقتی احراز هویت توکنی به token نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `gateway install` اعتبارسنجی می‌کند که SecretRef قابل حل باشد اما token حل‌شده را در metadata مربوط به environment سرویس پایدار نمی‌کند.
    - اگر احراز هویت توکنی به token نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، نصب به‌جای پایدار کردن fallback plaintext به‌صورت بسته شکست می‌خورد.
    - برای احراز هویت password در `gateway run`، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file`، یا `gateway.auth.password` پشتیبانی‌شده با SecretRef را به inline `--password` ترجیح دهید.
    - در حالت احراز هویت استنباطی، `OPENCLAW_GATEWAY_PASSWORD` فقط در shell الزامات token نصب را آسان‌تر نمی‌کند؛ هنگام نصب یک سرویس مدیریت‌شده از پیکربندی بادوام (`gateway.auth.password` یا config `env`) استفاده کنید.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صریحا تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف Gatewayها (Bonjour)

`gateway discover` beaconهای Gateway (`_openclaw-gw._tcp`) را اسکن می‌کند.

- DNS-SD چندپخشی: `local.`
- DNS-SD تک‌پخشی (Wide-Area Bonjour): یک دامنه انتخاب کنید (مثال: `openclaw.internal.`) و split DNS + یک سرور DNS راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط Gatewayهایی که discovery مربوط به Bonjour در آن‌ها فعال است (پیش‌فرض)، beacon را تبلیغ می‌کنند.

رکوردهای Wide-Area discovery شامل (TXT) هستند:

- `role` (راهنمای نقش Gateway)
- `transport` (راهنمای transport، مثلا `gateway`)
- `gatewayPort` (پورت WebSocket، معمولا `18789`)
- `sshPort` (اختیاری؛ clientها وقتی وجود نداشته باشد هدف‌های SSH را به‌طور پیش‌فرض `22` می‌گیرند)
- `tailnetDns` (نام میزبان MagicDNS، وقتی در دسترس باشد)
- `gatewayTls` / `gatewayTlsSha256` (TLS فعال + اثر انگشت گواهی)
- `cliPath` (راهنمای remote-install نوشته‌شده در ناحیه wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلت زمانی برای هر فرمان (مرور/حل‌کردن).
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن برای ماشین (همچنین سبک‌دهی/نشانگر چرخان را غیرفعال می‌کند).
</ParamField>

نمونه‌ها:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI دامنه‌ی `local.` را به‌همراه دامنه‌ی پهنه‌گسترده‌ی پیکربندی‌شده، وقتی فعال باشد، پویش می‌کند.
- `wsUrl` در خروجی JSON از نقطه‌ی پایانی سرویسِ حل‌شده به‌دست می‌آید، نه از راهنمایی‌های فقط TXT مانند `lanHost` یا `tailnetDns`.
- در mDNS مربوط به `local.`، `sshPort` و `cliPath` فقط وقتی پخش می‌شوند که `discovery.mdns.mode` برابر با `full` باشد. DNS-SD پهنه‌گسترده همچنان `cliPath` را می‌نویسد؛ `sshPort` آنجا هم اختیاری می‌ماند.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
