---
read_when:
    - اجرای Gateway از CLI (توسعه یا سرورها)
    - اشکال‌زدایی احراز هویت Gateway، حالت‌های مقیدسازی و اتصال‌پذیری
    - کشف Gatewayها از طریق Bonjour (DNS-SD محلی + گسترده)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — اجرا، پرس‌وجو و کشف Gatewayها
title: Gateway
x-i18n:
    generated_at: "2026-05-05T08:25:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket متعلق به OpenClaw است (کانال‌ها، Nodeها، نشست‌ها، hookها). زیرفرمان‌های این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD ناحیه‌گسترده.
  </Card>
  <Card title="Discovery overview" href="/fa/gateway/discovery">
    اینکه OpenClaw چگونه Gatewayها را تبلیغ و پیدا می‌کند.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration">
    کلیدهای پیکربندی سطح‌بالای Gateway.
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
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` وجود ندارد، آن را یک پیکربندی خراب یا بازنویسی‌شده در نظر بگیرید و به‌جای اینکه حالت محلی را به‌طور ضمنی فرض کنید، آن را ترمیم کنید.
    - اگر فایل وجود دارد و `gateway.mode` وجود ندارد، Gateway این وضعیت را آسیب مشکوک به پیکربندی تلقی می‌کند و برای شما «حالت محلی را حدس» نمی‌زند.
    - bind کردن فراتر از loopback بدون احراز هویت مسدود می‌شود (محافظ ایمنی).
    - `SIGUSR1` وقتی مجاز باشد یک راه‌اندازی مجدد درون‌فرایندی را فعال می‌کند (`commands.restart` به‌طور پیش‌فرض فعال است؛ برای مسدود کردن راه‌اندازی مجدد دستی، `commands.restart: false` را تنظیم کنید، در حالی که اعمال/به‌روزرسانی ابزار/پیکربندی gateway همچنان مجاز می‌ماند).
    - هندلرهای `SIGINT`/`SIGTERM` فرایند gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی ترمینال را بازنمی‌گردانند. اگر CLI را با TUI یا ورودی raw-mode پوشش می‌دهید، پیش از خروج ترمینال را بازگردانید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  پورت WebSocket (مقدار پیش‌فرض از config/env می‌آید؛ معمولا `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  حالت bind شنونده.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  بازنویسی حالت احراز هویت.
</ParamField>
<ParamField path="--token <token>" type="string">
  بازنویسی token (همچنین `OPENCLAW_GATEWAY_TOKEN` را برای فرایند تنظیم می‌کند).
</ParamField>
<ParamField path="--password <password>" type="string">
  بازنویسی گذرواژه.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  خواندن گذرواژه gateway از یک فایل.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  در معرض قرار دادن Gateway از طریق Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  بازنشانی پیکربندی serve/funnel در Tailscale هنگام خاموشی.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه شروع gateway بدون `gateway.mode=local` در پیکربندی. فقط برای بوت‌استرپ موردی/توسعه از محافظ شروع عبور می‌کند؛ فایل پیکربندی را نمی‌نویسد یا ترمیم نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  اگر وجود ندارد، یک پیکربندی توسعه + workspace ایجاد کنید (`BOOTSTRAP.md` را نادیده می‌گیرد).
</ParamField>
<ParamField path="--reset" type="boolean">
  بازنشانی پیکربندی توسعه + credentials + نشست‌ها + workspace (به `--dev` نیاز دارد).
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنونده موجود روی پورت انتخاب‌شده را متوقف کنید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  لاگ‌های پرجزئیات.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط لاگ‌های backend مربوط به CLI را در کنسول نشان بده (و stdout/stderr را فعال کن).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  سبک لاگ Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار برای `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  رویدادهای خام stream مدل را در jsonl لاگ کن.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسیر jsonl برای stream خام.
</ParamField>

## راه‌اندازی مجدد Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` از Gateway در حال اجرا می‌خواهد پیش از راه‌اندازی مجدد، کارهای فعال OpenClaw را پیش‌بررسی کند. اگر عملیات صف‌شده، تحویل پاسخ، اجراهای تعبیه‌شده، یا اجرای taskها فعال باشند، Gateway مسدودکننده‌ها را گزارش می‌کند، درخواست‌های تکراری راه‌اندازی مجدد امن را ادغام می‌کند، و پس از تخلیه کار فعال راه‌اندازی مجدد می‌شود. `restart` ساده برای سازگاری، رفتار service-manager موجود را نگه می‌دارد. فقط زمانی از `--force` استفاده کنید که صریحا مسیر بازنویسی فوری را می‌خواهید.

<Warning>
`--password` درون‌خطی می‌تواند در فهرست‌های فرایند محلی آشکار شود. `--password-file`، env، یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری شروع

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید تا زمان‌بندی فازها هنگام شروع Gateway لاگ شود، از جمله تاخیر `eventLoopMax` در هر فاز و زمان‌بندی‌های جدول lookup Plugin برای installed-index، رجیستری manifest، برنامه‌ریزی شروع، و کار owner-map.
- `OPENCLAW_DIAGNOSTICS=timeline` را همراه با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید تا یک timeline تشخیصی شروع با فرمت JSONL و به‌صورت best-effort برای harnessهای QA خارجی نوشته شود. همچنین می‌توانید این flag را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از env تامین می‌شود. برای شامل کردن نمونه‌های event-loop، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- برای benchmark کردن شروع Gateway، `pnpm test:startup:gateway -- --runs 5 --warmup 1` را اجرا کنید. این benchmark نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های trace شروع، تاخیر event-loop، و جزئیات زمان‌بندی جدول lookup Plugin را ثبت می‌کند.

## پرس‌وجو از Gateway در حال اجرا

همه فرمان‌های پرس‌وجو از WebSocket RPC استفاده می‌کنند.

<Tabs>
  <Tab title="Output modes">
    - پیش‌فرض: خوانا برای انسان (رنگی در TTY).
    - `--json`: JSON خوانا برای ماشین (بدون استایل/spinner).
    - `--no-color` (یا `NO_COLOR=1`): ANSI را غیرفعال می‌کند و چیدمان انسانی را نگه می‌دارد.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL مربوط به Gateway WebSocket.
    - `--token <token>`: token مربوط به Gateway.
    - `--password <password>`: گذرواژه Gateway.
    - `--timeout <ms>`: timeout/budget (بسته به فرمان متفاوت است).
    - `--expect-final`: منتظر پاسخ «final» بمان (فراخوانی‌های agent).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به credentials پیکربندی یا محیط fallback نمی‌کند. `--token` یا `--password` را صریحا پاس بدهید. نبود credentials صریح یک خطا است.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint مربوط به HTTP `/healthz` یک probe زنده‌بودن است: وقتی server بتواند به HTTP پاسخ بدهد، برمی‌گردد. endpoint مربوط به HTTP `/readyz` سخت‌گیرانه‌تر است و تا زمانی که sidecarهای Plugin شروع، کانال‌ها، یا hookهای پیکربندی‌شده هنوز در حال پایدار شدن هستند، قرمز می‌ماند. پاسخ‌های آمادگی جزئی محلی یا احرازهویت‌شده شامل یک بلوک تشخیصی `eventLoop` با تاخیر event-loop، میزان استفاده event-loop، نسبت هسته CPU، و flag `degraded` هستند.

### `gateway usage-cost`

خلاصه‌های usage-cost را از لاگ‌های نشست دریافت کنید.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید شامل شوند.
</ParamField>

### `gateway stability`

recorder پایداری تشخیصی اخیر را از یک Gateway در حال اجرا دریافت کنید.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  بیشینه تعداد رویدادهای اخیر که باید شامل شوند (حداکثر `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  فیلتر بر اساس نوع رویداد تشخیصی، مانند `payload.large` یا `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رویدادهای بعد از یک شماره توالی تشخیصی را شامل کن.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک bundle پایداری ذخیره‌شده را بخوان. برای جدیدترین bundle زیر دایرکتوری state از `--bundle latest` (یا فقط `--bundle`) استفاده کنید، یا مسیر JSON یک bundle را مستقیما پاس بدهید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک zip تشخیصی قابل اشتراک‌گذاری برای پشتیبانی بنویس.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - رکوردها metadata عملیاتی را نگه می‌دارند: نام رویدادها، شمارش‌ها، اندازه‌های byte، خوانش‌های memory، وضعیت queue/session، نام کانال/Plugin، و خلاصه‌های نشست redacted. آن‌ها متن chat، بدنه‌های webhook، خروجی‌های tool، بدنه‌های خام request یا response، tokenها، cookieها، مقادیر secret، hostnameها، یا شناسه‌های خام نشست را نگه نمی‌دارند. برای غیرفعال کردن کامل recorder، `diagnostics.enabled: false` را تنظیم کنید.
    - هنگام خروج‌های fatal از Gateway، timeoutهای خاموشی، و شکست‌های شروعِ راه‌اندازی مجدد، وقتی recorder رویداد داشته باشد، OpenClaw همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد. جدیدترین bundle را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type`، و `--since-seq` نیز روی خروجی bundle اعمال می‌شوند.

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
  مسیر zip خروجی. پیش‌فرض یک export پشتیبانی زیر دایرکتوری state است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  بیشینه خطوط لاگ sanitized که باید شامل شوند.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  بیشینه byteهای لاگ برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL مربوط به Gateway WebSocket برای snapshot سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  token مربوط به Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout مربوط به snapshot وضعیت/سلامت.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  lookup مربوط به bundle پایداری ذخیره‌شده را رد کن.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه، و manifest را به‌صورت JSON چاپ کن.
</ParamField>

این export شامل یک manifest، خلاصه Markdown، شکل پیکربندی، جزئیات پیکربندی sanitized، خلاصه‌های لاگ sanitized، snapshotهای وضعیت/سلامت sanitized مربوط به Gateway، و در صورت وجود، جدیدترین bundle پایداری است.

این خروجی برای اشتراک‌گذاری در نظر گرفته شده است. جزئیات عملیاتی مفید برای debugging را نگه می‌دارد، مانند فیلدهای امن لاگ OpenClaw، نام‌های subsystem، status codeها، durationها، modeهای پیکربندی‌شده، portها، شناسه‌های Plugin، شناسه‌های provider، تنظیمات feature غیرمحرمانه، و پیام‌های لاگ عملیاتی redacted. متن chat، بدنه‌های webhook، خروجی‌های tool، credentials، cookieها، شناسه‌های account/message، متن prompt/instruction، hostnameها، و مقادیر secret را حذف یا redacted می‌کند. وقتی یک پیام به سبک LogTape شبیه متن payload کاربر/chat/tool باشد، export فقط این را نگه می‌دارد که یک پیام حذف شده است، همراه با شمارش byte آن.

### `gateway status`

`gateway status` سرویس Gateway (`launchd`/`systemd`/`schtasks`) را همراه با یک probe اختیاری از قابلیت connectivity/auth نشان می‌دهد.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  یک هدف صریح برای کاوش اضافه کنید. ریموت پیکربندی‌شده + localhost همچنان کاوش می‌شوند.
</ParamField>
<ParamField path="--token <token>" type="string">
  احراز هویت با توکن برای کاوش.
</ParamField>
<ParamField path="--password <password>" type="string">
  احراز هویت با گذرواژه برای کاوش.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  مهلت زمانی کاوش.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  کاوش اتصال‌پذیری را رد کنید (نمای فقط سرویس).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را هم اسکن کنید.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  کاوش اتصال‌پذیری پیش‌فرض را به یک کاوش خواندن ارتقا دهید و وقتی آن کاوش خواندن ناموفق بود با کد غیرصفر خارج شوید. نمی‌تواند با `--no-probe` ترکیب شود.
</ParamField>

<AccordionGroup>
  <Accordion title="معناشناسی وضعیت">
    - `gateway status` حتی وقتی پیکربندی CLI محلی وجود ندارد یا نامعتبر است، برای عیب‌یابی در دسترس می‌ماند.
    - `gateway status` پیش‌فرض وضعیت سرویس، اتصال WebSocket، و قابلیت احراز هویت قابل مشاهده در زمان دست‌دهی را اثبات می‌کند. عملیات خواندن/نوشتن/مدیریت را اثبات نمی‌کند.
    - کاوش‌های عیب‌یابی برای احراز هویت دستگاه در نخستین استفاده تغییردهنده نیستند: وقتی توکن دستگاه کش‌شده موجود باشد همان را دوباره استفاده می‌کنند، اما فقط برای بررسی وضعیت، هویت دستگاه CLI جدید یا رکورد جفت‌سازی دستگاه فقط‌خواندنی ایجاد نمی‌کنند.
    - `gateway status` در صورت امکان SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت کاوش حل می‌کند.
    - اگر یک SecretRef احراز هویت لازم در این مسیر دستور حل نشود، `gateway status --json` وقتی اتصال‌پذیری/احراز هویت کاوش ناموفق باشد `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحاً پاس دهید یا ابتدا منبع راز را حل کنید.
    - اگر کاوش موفق شود، هشدارهای auth-ref حل‌نشده برای جلوگیری از مثبت کاذب سرکوب می‌شوند.
    - وقتی در اسکریپت‌ها و اتوماسیون یک سرویس در حال گوش‌دادن کافی نیست و لازم است فراخوانی‌های RPC با دامنه خواندن نیز سالم باشند، از `--require-rpc` استفاده کنید.
    - `--deep` یک اسکن بهترین‌تلاش برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه Gateway شناسایی شوند، خروجی انسانی نکته‌های پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که بیشتر راه‌اندازی‌ها باید روی هر ماشین یک Gateway اجرا کنند.
    - `--deep` همچنین یک واگذاری اخیر راه‌اندازی مجدد سرپرست Gateway را وقتی فرایند سرویس برای راه‌اندازی مجدد توسط سرپرست خارجی به‌صورت تمیز خارج شده باشد گزارش می‌کند.
    - خروجی انسانی مسیر لاگ فایل حل‌شده به‌همراه نمای لحظه‌ای مسیرها/اعتبار پیکربندی CLI در برابر سرویس را شامل می‌شود تا به عیب‌یابی drift پروفایل یا state-dir کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های drift احراز هویت systemd لینوکس">
    - در نصب‌های systemd لینوکس، بررسی‌های drift احراز هویت سرویس هر دو مقدار `Environment=` و `EnvironmentFile=` را از unit می‌خوانند (شامل `%h`، مسیرهای نقل‌قول‌شده، چند فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift، SecretRefهای `gateway.auth.token` را با env زمان اجرای ادغام‌شده حل می‌کنند (ابتدا env دستور سرویس، سپس env فرایند به‌عنوان fallback).
    - اگر احراز هویت توکنی عملاً فعال نباشد (`gateway.auth.mode` صریح با مقدار `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد و گذرواژه بتواند برنده شود و هیچ نامزد توکنی نتواند برنده شود)، بررسی‌های token-drift حل توکن پیکربندی را رد می‌کنند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` دستور «عیب‌یابی همه‌چیز» است. همیشه این‌ها را کاوش می‌کند:

- Gateway ریموت پیکربندی‌شده شما (اگر تنظیم شده باشد)، و
- localhost (loopback) **حتی اگر ریموت پیکربندی شده باشد**.

اگر `--url` را پاس دهید، آن هدف صریح قبل از هر دو اضافه می‌شود. خروجی انسانی هدف‌ها را این‌گونه برچسب‌گذاری می‌کند:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند Gateway قابل دسترسی باشند، همه آن‌ها را چاپ می‌کند. وقتی از پروفایل‌ها/پورت‌های جداافتاده استفاده می‌کنید (مثلاً یک ربات نجات)، چند Gateway پشتیبانی می‌شود، اما بیشتر نصب‌ها همچنان یک Gateway واحد اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی دست‌کم یک هدف اتصال WebSocket را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌کند کاوش درباره احراز هویت چه چیزی را توانسته اثبات کند. این از دسترس‌پذیری جدا است.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با دامنه خواندن (`health`/`status`/`system-presence`/`config.get`) نیز موفق شده‌اند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق بوده اما RPC با دامنه خواندن محدود است. این به‌عنوان دسترس‌پذیری **تنزل‌یافته** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` بعد از `Connect: ok` یعنی Gateway اتصال WebSocket را پذیرفته، اما عیب‌یابی‌های خواندن بعدی timeout شده یا ناموفق بوده‌اند. این هم دسترس‌پذیری **تنزل‌یافته** است، نه یک Gateway غیرقابل دسترسی.
    - مانند `gateway status`، کاوش از احراز هویت دستگاه کش‌شده موجود دوباره استفاده می‌کند اما هویت دستگاه یا وضعیت جفت‌سازی نخستین استفاده را ایجاد نمی‌کند.
    - کد خروج فقط وقتی غیرصفر است که هیچ هدف کاوش‌شده‌ای قابل دسترسی نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالا:

    - `ok`: دست‌کم یک هدف قابل دسترسی است.
    - `degraded`: دست‌کم یک هدف اتصال را پذیرفته اما عیب‌یابی‌های RPC با جزئیات کامل را تکمیل نکرده است.
    - `capability`: بهترین قابلیت دیده‌شده در میان هدف‌های قابل دسترسی (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین هدف برای در نظر گرفتن به‌عنوان برنده فعال، به این ترتیب: URL صریح، تونل SSH، ریموت پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار بهترین‌تلاش با `code`، `message`، و `targetIds` اختیاری.
    - `network`: راهنمایی‌های URL برای local loopback/tailnet که از پیکربندی فعلی و شبکه میزبان به دست آمده‌اند.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجه واقعی کشف که برای این گذر کاوش استفاده شده است.

    برای هر هدف (`targets[].connect`):

    - `ok`: دسترس‌پذیری پس از اتصال + طبقه‌بندی تنزل‌یافته.
    - `rpcOk`: موفقیت کامل RPC جزئیات.
    - `scopeLimited`: RPC جزئیات به‌دلیل نبود دامنه operator ناموفق شده است.

    برای هر هدف (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok` وقتی در دسترس باشد.
    - `scopes`: دامنه‌های اعطاشده گزارش‌شده در `hello-ok` وقتی در دسترس باشد.
    - `capability`: طبقه‌بندی قابلیت احراز هویت نمایش‌داده‌شده برای آن هدف.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی تونل SSH ناموفق بود؛ دستور به کاوش‌های مستقیم fallback کرد.
    - `multiple_gateways`: بیش از یک هدف قابل دسترسی بود؛ این غیرمعمول است مگر اینکه عمداً پروفایل‌های جداافتاده، مانند یک ربات نجات، اجرا کنید.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای یک هدف ناموفق قابل حل نبود.
    - `probe_scope_limited`: اتصال WebSocket موفق بود، اما کاوش خواندن به‌دلیل نبود `operator.read` محدود شد.

  </Accordion>
</AccordionGroup>

#### ریموت از طریق SSH (هم‌ارزی برنامه Mac)

حالت «ریموت از طریق SSH» در برنامه macOS از یک port-forward محلی استفاده می‌کند تا Gateway ریموت (که ممکن است فقط به loopback متصل شده باشد) در `ws://127.0.0.1:<port>` قابل دسترسی شود.

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
  نخستین میزبان Gateway کشف‌شده را از نقطه پایانی کشف حل‌شده (`local.` به‌علاوه دامنه گسترده پیکربندی‌شده، اگر وجود داشته باشد) به‌عنوان هدف SSH انتخاب کنید. راهنمایی‌های فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، به‌عنوان پیش‌فرض‌ها استفاده می‌شود):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

راهنمای سطح پایین RPC.

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
  توکن Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  بودجه مهلت زمانی.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  عمدتاً برای RPCهای سبک agent که پیش از payload نهایی، رویدادهای میانی را stream می‌کنند.
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

وقتی سرویس مدیریت‌شده باید از طریق اجرایی دیگری شروع شود، مثلاً یک shim مدیر رازها یا یک راهنمای run-as، از `--wrapper` استفاده کنید. wrapper آرگومان‌های عادی Gateway را دریافت می‌کند و مسئول است که در نهایت `openclaw` یا Node را با آن آرگومان‌ها exec کند.

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

همچنین می‌توانید wrapper را از طریق محیط تنظیم کنید. `gateway install` اعتبارسنجی می‌کند که مسیر یک فایل اجرایی باشد، wrapper را در `ProgramArguments` سرویس می‌نویسد، و `OPENCLAW_WRAPPER` را در محیط سرویس برای نصب مجدد اجباری، به‌روزرسانی‌ها، و تعمیرهای doctor بعدی پایدار می‌کند.

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
  <Accordion title="گزینه‌های دستور">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="رفتار چرخه عمر">
    - برای راه‌اندازی مجدد یک سرویس مدیریت‌شده از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین راه‌اندازی مجدد زنجیره نکنید؛ در macOS، `gateway stop` عمداً LaunchAgent را پیش از متوقف کردنش غیرفعال می‌کند.
    - `gateway restart --safe` از Gateway در حال اجرا می‌خواهد کارهای فعال OpenClaw را پیش‌پرواز کند و راه‌اندازی مجدد را تا تخلیه تحویل پاسخ، اجراهای embedded، و اجراهای task به تعویق بیندازد. `--safe` نمی‌تواند با `--force` یا `--wait` ترکیب شود.
    - `gateway restart --wait 30s` بودجه drain راه‌اندازی مجدد پیکربندی‌شده را برای آن راه‌اندازی مجدد override می‌کند. عددهای بدون واحد میلی‌ثانیه هستند؛ واحدهایی مانند `s`، `m`، و `h` پذیرفته می‌شوند. `--wait 0` نامحدود منتظر می‌ماند.
    - `gateway restart --force` drain کار فعال را رد می‌کند و فوراً راه‌اندازی مجدد انجام می‌دهد. وقتی یک operator از قبل blockerهای task فهرست‌شده را بررسی کرده و اکنون Gateway را دوباره می‌خواهد، از آن استفاده کنید.
    - دستورهای چرخه عمر برای اسکریپت‌نویسی `--json` را می‌پذیرند.

  </Accordion>
  <Accordion title="احراز هویت و SecretRefها در زمان نصب">
    - وقتی احراز هویت توکنی به توکن نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `gateway install` بررسی می‌کند که SecretRef قابل رفع باشد، اما توکن رفع‌شده را در فرادادهٔ محیط سرویس ذخیره نمی‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده رفع‌نشده باشد، نصب به‌صورت بسته شکست می‌خورد، به‌جای اینکه متن سادهٔ جایگزین را ذخیره کند.
    - برای احراز هویت گذرواژه در `gateway run`، به‌جای `--password` درون‌خطی، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file` یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
    - در حالت احراز هویت استنباط‌شده، `OPENCLAW_GATEWAY_PASSWORD` که فقط در پوسته وجود دارد، الزامات توکن نصب را آسان‌تر نمی‌کند؛ هنگام نصب یک سرویس مدیریت‌شده، از پیکربندی پایدار (`gateway.auth.password` یا `env` پیکربندی) استفاده کنید.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که حالت به‌صراحت تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف Gatewayها (Bonjour)

`gateway discover` به‌دنبال نشانک‌های Gateway (`_openclaw-gw._tcp`) پویش می‌کند.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Bonjour گسترده): یک دامنه انتخاب کنید (نمونه: `openclaw.internal.`) و split DNS به‌همراه یک سرور DNS راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط Gatewayهایی که کشف Bonjour در آن‌ها فعال است (پیش‌فرض) نشانک را تبلیغ می‌کنند.

رکوردهای کشف گسترده شامل این مواردند (TXT):

- `role` (راهنمای نقش Gateway)
- `transport` (راهنمای انتقال، برای مثال `gateway`)
- `gatewayPort` (درگاه WebSocket، معمولاً `18789`)
- `sshPort` (اختیاری؛ کلاینت‌ها وقتی موجود نباشد، اهداف SSH را به‌صورت پیش‌فرض `22` در نظر می‌گیرند)
- `tailnetDns` (نام میزبان MagicDNS، وقتی در دسترس باشد)
- `gatewayTls` / `gatewayTlsSha256` (TLS فعال + اثرانگشت گواهی)
- `cliPath` (راهنمای نصب از راه دور که در ناحیهٔ گسترده نوشته می‌شود)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلت زمانی هر فرمان (مرور/رفع).
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل‌خواندن برای ماشین (همچنین استایل‌دهی/اسپینر را غیرفعال می‌کند).
</ParamField>

نمونه‌ها:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI علاوه بر `local.`، دامنهٔ گستردهٔ پیکربندی‌شده را نیز، وقتی فعال باشد، پویش می‌کند.
- `wsUrl` در خروجی JSON از نقطهٔ پایانی سرویسِ رفع‌شده مشتق می‌شود، نه از راهنماهای فقط TXT مانند `lanHost` یا `tailnetDns`.
- در mDNS مربوط به `local.`، `sshPort` و `cliPath` فقط وقتی پخش می‌شوند که `discovery.mdns.mode` برابر `full` باشد. DNS-SD گسترده همچنان `cliPath` را می‌نویسد؛ `sshPort` آنجا هم اختیاری باقی می‌ماند.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
