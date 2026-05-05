---
read_when:
    - اجرای Gateway از طریق CLI (توسعه یا سرورها)
    - اشکال‌زدایی احراز هویت Gateway، حالت‌های bind و اتصال‌پذیری
    - کشف Gatewayها از طریق Bonjour (DNS-SD محلی + گستره‌وسیع)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — اجرای Gatewayها، پرس‌وجو از آن‌ها و کشفشان
title: Gateway
x-i18n:
    generated_at: "2026-05-05T01:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket متعلق به OpenClaw است (کانال‌ها، گره‌ها، نشست‌ها، قلاب‌ها). زیرفرمان‌های این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده.
  </Card>
  <Card title="Discovery overview" href="/fa/gateway/discovery">
    اینکه OpenClaw چگونه Gatewayها را تبلیغ و پیدا می‌کند.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration">
    کلیدهای پیکربندی سطح‌بالای Gateway.
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
    - به‌صورت پیش‌فرض، Gateway از شروع خودداری می‌کند مگر اینکه `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم شده باشد. برای اجراهای موقت/توسعه از `--allow-unconfigured` استفاده کنید.
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` وجود ندارد، آن را به‌عنوان پیکربندی خراب یا بازنویسی‌شده در نظر بگیرید و به‌جای فرض ضمنی حالت محلی، آن را تعمیر کنید.
    - اگر فایل وجود دارد و `gateway.mode` وجود ندارد، Gateway این را آسیب مشکوک پیکربندی تلقی می‌کند و از «حدس زدن حالت محلی» برای شما خودداری می‌کند.
    - اتصال فراتر از loopback بدون احراز هویت مسدود می‌شود (حفاظ ایمنی).
    - `SIGUSR1` وقتی مجاز باشد یک راه‌اندازی مجدد درون‌فرایندی را فعال می‌کند (`commands.restart` به‌صورت پیش‌فرض فعال است؛ برای مسدود کردن راه‌اندازی مجدد دستی، `commands.restart: false` را تنظیم کنید، درحالی‌که اعمال/به‌روزرسانی ابزار/پیکربندی Gateway همچنان مجاز می‌ماند).
    - هندلرهای `SIGINT`/`SIGTERM` فرایند gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی ترمینال را بازیابی نمی‌کنند. اگر CLI را با یک TUI یا ورودی raw-mode بسته‌بندی می‌کنید، پیش از خروج ترمینال را بازیابی کنید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  پورت WebSocket (پیش‌فرض از پیکربندی/محیط می‌آید؛ معمولاً `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  حالت اتصال شنونده.
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
  پیکربندی serve/funnel مربوط به Tailscale را هنگام خاموشی بازنشانی کنید.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه شروع gateway بدون `gateway.mode=local` در پیکربندی را بدهید. این فقط برای bootstrap موقت/توسعه، محافظ شروع را دور می‌زند؛ فایل پیکربندی را نمی‌نویسد یا تعمیر نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  اگر وجود نداشته باشد، یک پیکربندی توسعه + فضای کاری بسازید (`BOOTSTRAP.md` را رد می‌کند).
</ParamField>
<ParamField path="--reset" type="boolean">
  پیکربندی توسعه + اعتبارنامه‌ها + نشست‌ها + فضای کاری را بازنشانی کنید (به `--dev` نیاز دارد).
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنونده موجود روی پورت انتخاب‌شده را بکشید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  لاگ‌های پرجزئیات.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط لاگ‌های بک‌اند CLI را در کنسول نشان بده (و stdout/stderr را فعال کن).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  سبک لاگ Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار برای `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  رخدادهای خام جریان مدل را در jsonl لاگ کن.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسیر jsonl جریان خام.
</ParamField>

## راه‌اندازی مجدد Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` از Gateway در حال اجرا می‌خواهد پیش از راه‌اندازی مجدد، کارهای فعال OpenClaw را پیش‌بررسی کند. اگر عملیات صف‌شده، تحویل پاسخ، اجراهای جاسازی‌شده، یا اجراهای کار فعال باشند، Gateway مسدودکننده‌ها را گزارش می‌کند، درخواست‌های تکراری راه‌اندازی مجدد امن را ادغام می‌کند، و پس از تخلیه کار فعال دوباره راه‌اندازی می‌شود. `restart` ساده برای سازگاری، رفتار مدیر سرویس موجود را حفظ می‌کند. فقط وقتی از `--force` استفاده کنید که صراحتاً مسیر بازنویسی فوری را می‌خواهید.

<Warning>
`--password` درون‌خطی می‌تواند در فهرست فرایندهای محلی افشا شود. `--password-file`، محیط، یا `gateway.auth.password` متکی بر SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری شروع

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید تا زمان‌بندی فازها هنگام شروع Gateway لاگ شود، شامل تأخیر `eventLoopMax` برای هر فاز و زمان‌بندی‌های جدول جست‌وجوی Plugin برای installed-index، رجیستری مانیفست، برنامه‌ریزی شروع، و کار owner-map.
- `OPENCLAW_DIAGNOSTICS=timeline` را با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید تا یک timeline تشخیصی شروع JSONL به‌صورت best-effort برای ابزارهای QA خارجی نوشته شود. همچنین می‌توانید این پرچم را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از محیط فراهم می‌شود. برای شامل کردن نمونه‌های حلقه رخداد، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- برای benchmark شروع Gateway، `pnpm test:startup:gateway -- --runs 5 --warmup 1` را اجرا کنید. benchmark نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های ردگیری شروع، تأخیر حلقه رخداد، و جزئیات زمان‌بندی جدول جست‌وجوی Plugin را ثبت می‌کند.

## پرس‌وجو از یک Gateway در حال اجرا

همه فرمان‌های پرس‌وجو از RPC روی WebSocket استفاده می‌کنند.

<Tabs>
  <Tab title="Output modes">
    - پیش‌فرض: قابل‌خواندن برای انسان (رنگی در TTY).
    - `--json`: JSON قابل‌خواندن برای ماشین (بدون استایل/اسپینر).
    - `--no-color` (یا `NO_COLOR=1`): ANSI را غیرفعال کن و چیدمان انسانی را حفظ کن.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: نشانی WebSocket متعلق به Gateway.
    - `--token <token>`: توکن Gateway.
    - `--password <password>`: گذرواژه Gateway.
    - `--timeout <ms>`: زمان‌انتظار/بودجه (بسته به فرمان متفاوت است).
    - `--expect-final`: منتظر پاسخ "final" بمان (فراخوانی‌های عامل).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به اعتبارنامه‌های پیکربندی یا محیط fallback نمی‌کند. `--token` یا `--password` را صریحاً بدهید. نبود اعتبارنامه‌های صریح یک خطاست.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

نقطه پایانی HTTP `/healthz` یک probe زنده‌بودن است: وقتی سرور بتواند به HTTP پاسخ بدهد برمی‌گردد. نقطه پایانی HTTP `/readyz` سخت‌گیرانه‌تر است و تا وقتی sidecarهای Plugin شروع، کانال‌ها، یا hookهای پیکربندی‌شده هنوز در حال settle شدن هستند قرمز می‌ماند. پاسخ‌های آمادگی تفصیلی محلی یا احراز هویت‌شده شامل یک بلوک تشخیصی `eventLoop` با تأخیر حلقه رخداد، بهره‌وری حلقه رخداد، نسبت هسته CPU، و یک پرچم `degraded` هستند.

### `gateway usage-cost`

خلاصه‌های هزینه مصرف را از لاگ‌های نشست دریافت کن.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید شامل شود.
</ParamField>

### `gateway stability`

ضبط‌کننده پایداری تشخیصی اخیر را از یک Gateway در حال اجرا دریافت کن.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  حداکثر تعداد رخدادهای اخیر که باید شامل شوند (حداکثر `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  بر اساس نوع رخداد تشخیصی فیلتر کن، مانند `payload.large` یا `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رخدادهای پس از یک شماره توالی تشخیصی را شامل کن.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک bundle پایداری ماندگارشده را بخوان. برای جدیدترین bundle زیر دایرکتوری state از `--bundle latest` (یا فقط `--bundle`) استفاده کن، یا مسیر JSON یک bundle را مستقیماً بده.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک zip تشخیصی پشتیبانی قابل‌اشتراک بنویس.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - رکوردها metadata عملیاتی را نگه می‌دارند: نام رخدادها، شمارش‌ها، اندازه‌های بایت، خوانش‌های حافظه، وضعیت صف/نشست، نام کانال/Plugin، و خلاصه‌های نشست redact‌شده. آن‌ها متن چت، بدنه‌های Webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، مقدارهای محرمانه، نام میزبان‌ها، یا شناسه‌های خام نشست را نگه نمی‌دارند. برای غیرفعال کردن کامل ضبط‌کننده، `diagnostics.enabled: false` را تنظیم کنید.
    - هنگام خروج‌های fatal Gateway، timeoutهای خاموشی، و شکست‌های شروع پس از restart، وقتی ضبط‌کننده رخداد داشته باشد OpenClaw همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد. جدیدترین bundle را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type`، و `--since-seq` نیز روی خروجی bundle اعمال می‌شوند.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

یک zip تشخیصی محلی بنویس که برای پیوست کردن به گزارش‌های باگ طراحی شده است. برای مدل حریم خصوصی و محتوای bundle، [Diagnostics Export](/fa/gateway/diagnostics) را ببینید.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسیر zip خروجی. پیش‌فرض یک export پشتیبانی زیر دایرکتوری state است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  حداکثر خطوط لاگ پاک‌سازی‌شده که باید شامل شوند.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  حداکثر بایت‌های لاگ برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  نشانی WebSocket متعلق به Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  زمان‌انتظار snapshot وضعیت/سلامت.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  جست‌وجوی bundle پایداری ماندگارشده را رد کن.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه، و مانیفست را به‌صورت JSON چاپ کن.
</ParamField>

این export شامل یک مانیفست، یک خلاصه Markdown، شکل پیکربندی، جزئیات پیکربندی پاک‌سازی‌شده، خلاصه‌های لاگ پاک‌سازی‌شده، snapshotهای وضعیت/سلامت Gateway پاک‌سازی‌شده، و جدیدترین bundle پایداری در صورت وجود است.

برای اشتراک‌گذاری در نظر گرفته شده است. جزئیات عملیاتی کمک‌کننده به اشکال‌زدایی را نگه می‌دارد، مانند فیلدهای امن لاگ OpenClaw، نام‌های زیرسیستم، کدهای وضعیت، مدت‌زمان‌ها، حالت‌های پیکربندی‌شده، پورت‌ها، شناسه‌های Plugin، شناسه‌های provider، تنظیمات قابلیت غیرمحرمانه، و پیام‌های لاگ عملیاتی redact‌شده. متن چت، بدنه‌های Webhook، خروجی‌های ابزار، اعتبارنامه‌ها، کوکی‌ها، شناسه‌های حساب/پیام، متن prompt/instruction، نام میزبان‌ها، و مقدارهای محرمانه را حذف یا redact می‌کند. وقتی یک پیام به سبک LogTape شبیه متن payload کاربر/چت/ابزار باشد، export فقط این را نگه می‌دارد که یک پیام حذف شده است به‌همراه شمارش بایت آن.

### `gateway status`

`gateway status` سرویس Gateway (launchd/systemd/schtasks) را به‌همراه یک probe اختیاری از قابلیت اتصال/احراز هویت نشان می‌دهد.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  یک هدف کاوش صریح اضافه کنید. ریموت پیکربندی‌شده + localhost همچنان کاوش می‌شوند.
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
  از کاوش اتصال‌پذیری صرف‌نظر کنید (نمای فقط سرویس).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را هم اسکن کنید.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  کاوش اتصال‌پذیری پیش‌فرض را به کاوش خواندن ارتقا دهید و وقتی آن کاوش خواندن شکست می‌خورد با کد غیرصفر خارج شوید. نمی‌توان آن را با `--no-probe` ترکیب کرد.
</ParamField>

<AccordionGroup>
  <Accordion title="معناشناسی وضعیت">
    - `gateway status` حتی وقتی پیکربندی CLI محلی وجود ندارد یا نامعتبر است، برای عیب‌یابی در دسترس می‌ماند.
    - `gateway status` پیش‌فرض وضعیت سرویس، اتصال WebSocket، و قابلیت احراز هویت قابل مشاهده در زمان دست‌دهی را اثبات می‌کند. عملیات خواندن/نوشتن/مدیریت را اثبات نمی‌کند.
    - کاوش‌های عیب‌یابی برای احراز هویت بار اول دستگاه تغییردهنده نیستند: وقتی توکن دستگاه کش‌شده‌ای وجود داشته باشد از همان استفاده می‌کنند، اما فقط برای بررسی وضعیت، هویت دستگاه CLI جدید یا رکورد جفت‌سازی دستگاه فقط‌خواندنی ایجاد نمی‌کنند.
    - `gateway status` در صورت امکان SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت کاوش resolve می‌کند.
    - اگر یک SecretRef احراز هویت الزامی در این مسیر فرمان resolve نشده باشد، `gateway status --json` هنگام شکست اتصال‌پذیری/احراز هویت کاوش، `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریح پاس دهید یا ابتدا منبع secret را resolve کنید.
    - اگر کاوش موفق شود، هشدارهای auth-ref resolveنشده برای جلوگیری از مثبت‌های کاذب سرکوب می‌شوند.
    - وقتی یک سرویس در حال گوش‌دادن کافی نیست و لازم دارید فراخوانی‌های RPC با محدوده خواندن نیز سالم باشند، در اسکریپت‌ها و خودکارسازی از `--require-rpc` استفاده کنید.
    - `--deep` یک اسکن best-effort برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه Gateway شناسایی شوند، خروجی انسانی راهنمای پاک‌سازی چاپ می‌کند و هشدار می‌دهد که بیشتر راه‌اندازی‌ها باید برای هر ماشین یک Gateway اجرا کنند.
    - خروجی انسانی مسیر فایل لاگ resolveشده به‌همراه snapshot مسیرها/اعتبار پیکربندی CLI در برابر سرویس را شامل می‌شود تا به عیب‌یابی drift پروفایل یا state-dir کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های drift احراز هویت systemd در Linux">
    - در نصب‌های systemd روی Linux، بررسی‌های drift احراز هویت سرویس هر دو مقدار `Environment=` و `EnvironmentFile=` را از unit می‌خوانند (شامل `%h`، مسیرهای نقل‌قول‌شده، چند فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift با استفاده از env زمان اجرای ادغام‌شده، SecretRefهای `gateway.auth.token` را resolve می‌کنند (ابتدا env فرمان سرویس، سپس fallback به env فرایند).
    - اگر احراز هویت با توکن عملا فعال نباشد (`gateway.auth.mode` صریح با مقدار `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد، جایی که گذرواژه می‌تواند برنده شود و هیچ کاندید توکنی نمی‌تواند برنده شود)، بررسی‌های token-drift از resolve کردن توکن پیکربندی صرف‌نظر می‌کنند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` فرمان «عیب‌یابی همه‌چیز» است. همیشه موارد زیر را کاوش می‌کند:

- gateway ریموت پیکربندی‌شده شما (اگر تنظیم شده باشد)، و
- localhost (loopback) **حتی اگر ریموت پیکربندی شده باشد**.

اگر `--url` را پاس دهید، آن هدف صریح جلوتر از هر دو اضافه می‌شود. خروجی انسانی هدف‌ها را این‌گونه برچسب می‌زند:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند gateway قابل دسترس باشند، همه آن‌ها را چاپ می‌کند. وقتی از پروفایل‌ها/پورت‌های ایزوله استفاده می‌کنید (مثلا یک بات نجات)، چند gateway پشتیبانی می‌شود، اما بیشتر نصب‌ها همچنان یک Gateway واحد اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی حداقل یک هدف اتصال WebSocket را پذیرفت.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌دهد که کاوش درباره احراز هویت چه چیزی را توانسته اثبات کند. این از دسترس‌پذیری جدا است.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با محدوده خواندن (`health`/`status`/`system-presence`/`config.get`) نیز موفق شدند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق شد اما RPC با محدوده خواندن محدود است. این به‌عنوان دسترس‌پذیری **تنزل‌یافته** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` پس از `Connect: ok` یعنی Gateway اتصال WebSocket را پذیرفت، اما عیب‌یابی‌های خواندن بعدی timeout شدند یا شکست خوردند. این نیز دسترس‌پذیری **تنزل‌یافته** است، نه یک Gateway غیرقابل دسترس.
    - مانند `gateway status`، کاوش از احراز هویت دستگاه کش‌شده موجود استفاده می‌کند اما هویت دستگاه بار اول یا وضعیت جفت‌سازی ایجاد نمی‌کند.
    - کد خروج فقط وقتی غیرصفر است که هیچ هدف کاوش‌شده‌ای قابل دسترس نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالا:

    - `ok`: حداقل یک هدف قابل دسترس است.
    - `degraded`: حداقل یک هدف اتصال را پذیرفت اما عیب‌یابی‌های RPC جزئیات کامل را تکمیل نکرد.
    - `capability`: بهترین قابلیتی که بین هدف‌های قابل دسترس دیده شده است (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین هدف برای در نظر گرفتن به‌عنوان برنده فعال با این ترتیب: URL صریح، تونل SSH، ریموت پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار best-effort با `code`، `message`، و `targetIds` اختیاری.
    - `network`: راهنمایی‌های URL برای local loopback/tailnet مشتق‌شده از پیکربندی فعلی و شبکه میزبان.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجه واقعی discovery که برای این گذر کاوش استفاده شده است.

    برای هر هدف (`targets[].connect`):

    - `ok`: دسترس‌پذیری پس از connect + طبقه‌بندی degraded.
    - `rpcOk`: موفقیت RPC جزئیات کامل.
    - `scopeLimited`: شکست RPC جزئیات به‌دلیل نبود محدوده operator.

    برای هر هدف (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok` وقتی در دسترس باشد.
    - `scopes`: محدوده‌های اعطاشده گزارش‌شده در `hello-ok` وقتی در دسترس باشد.
    - `capability`: طبقه‌بندی قابلیت احراز هویت ارائه‌شده برای آن هدف.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی تونل SSH شکست خورد؛ فرمان به کاوش‌های مستقیم fallback کرد.
    - `multiple_gateways`: بیش از یک هدف قابل دسترس بود؛ این غیرمعمول است مگر اینکه عمدا پروفایل‌های ایزوله اجرا کنید، مثل یک بات نجات.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای یک هدف شکست‌خورده resolve نشد.
    - `probe_scope_limited`: اتصال WebSocket موفق شد، اما کاوش خواندن به‌دلیل نبود `operator.read` محدود شد.

  </Accordion>
</AccordionGroup>

#### ریموت از طریق SSH (برابری با برنامه Mac)

حالت "Remote over SSH" در برنامه macOS از یک port-forward محلی استفاده می‌کند تا gateway ریموت (که ممکن است فقط به loopback bind شده باشد) در `ws://127.0.0.1:<port>` قابل دسترس شود.

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
  نخستین میزبان gateway کشف‌شده را از endpoint کشف resolveشده (`local.` به‌علاوه دامنه wide-area پیکربندی‌شده، اگر وجود داشته باشد) به‌عنوان هدف SSH انتخاب کنید. راهنمایی‌های فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، استفاده‌شده به‌عنوان پیش‌فرض):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

کمک‌کننده RPC سطح پایین.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  رشته شیء JSON برای params.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL مربوط به WebSocket برای Gateway.
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
  عمدتا برای RPCهای سبک agent که پیش از payload نهایی eventهای میانی را stream می‌کنند.
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

وقتی سرویس مدیریت‌شده باید از طریق یک executable دیگر شروع شود، مثلا یک shim مدیریت secrets یا یک کمک‌کننده run-as، از `--wrapper` استفاده کنید. wrapper آرگومان‌های عادی Gateway را دریافت می‌کند و مسئول است در نهایت `openclaw` یا Node را با همان آرگومان‌ها exec کند.

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

همچنین می‌توانید wrapper را از طریق environment تنظیم کنید. `gateway install` اعتبارسنجی می‌کند که مسیر یک فایل executable است، wrapper را در `ProgramArguments` سرویس می‌نویسد، و `OPENCLAW_WRAPPER` را در environment سرویس برای نصب‌های مجدد اجباری، به‌روزرسانی‌ها، و تعمیرهای doctor بعدی پایدار می‌کند.

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
    - `gateway restart`: `--safe`، `--force`، `--wait <duration>`، `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="رفتار چرخه عمر">
    - برای راه‌اندازی مجدد یک سرویس مدیریت‌شده از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین restart زنجیره نکنید؛ در macOS، `gateway stop` عمدا LaunchAgent را پیش از توقف آن غیرفعال می‌کند.
    - `gateway restart --safe` از Gateway در حال اجرا می‌خواهد کار فعال OpenClaw را preflight کند و restart را تا تخلیه شدن تحویل پاسخ، اجراهای embedded، و اجراهای task به تعویق بیندازد. `--safe` را نمی‌توان با `--force` یا `--wait` ترکیب کرد.
    - `gateway restart --wait 30s` بودجه drain پیکربندی‌شده برای آن restart را override می‌کند. اعداد بدون واحد میلی‌ثانیه هستند؛ واحدهایی مثل `s`، `m`، و `h` پذیرفته می‌شوند. `--wait 0` به‌طور نامحدود منتظر می‌ماند.
    - `gateway restart --force` از drain کار فعال صرف‌نظر می‌کند و فورا restart می‌کند. وقتی operator پیش‌تر task blockerهای فهرست‌شده را بررسی کرده و اکنون gateway را دوباره می‌خواهد، از آن استفاده کنید.
    - فرمان‌های چرخه عمر `--json` را برای اسکریپت‌نویسی می‌پذیرند.

  </Accordion>
  <Accordion title="احراز هویت و SecretRefs در زمان نصب">
    - وقتی احراز هویت توکنی به یک توکن نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `gateway install` بررسی می‌کند که SecretRef قابل resolve باشد، اما توکن resolveشده را در فرادادهٔ محیط سرویس ذخیره نمی‌کند.
    - اگر احراز هویت توکنی به یک توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolve نشده باشد، نصب به‌صورت بسته شکست می‌خورد و متن سادهٔ جایگزین ذخیره نمی‌شود.
    - برای احراز هویت با رمز عبور در `gateway run`، به‌جای `--password` درون‌خطی، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file`، یا `gateway.auth.password` پشتیبانی‌شده با SecretRef را ترجیح دهید.
    - در حالت احراز هویت استنباط‌شده، `OPENCLAW_GATEWAY_PASSWORD` فقط در shell الزامات توکن نصب را سست نمی‌کند؛ هنگام نصب یک سرویس مدیریت‌شده، از پیکربندی پایدار (`gateway.auth.password` یا `env` پیکربندی) استفاده کنید.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که حالت به‌صراحت تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف Gatewayها (Bonjour)

`gateway discover` برای بیکن‌های Gateway (`_openclaw-gw._tcp`) اسکن می‌کند.

- DNS-SD چندپخشی: `local.`
- DNS-SD تک‌پخشی (Bonjour گسترده): یک دامنه انتخاب کنید (مثال: `openclaw.internal.`) و split DNS + یک سرور DNS را راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط Gatewayهایی که کشف Bonjour برای آن‌ها فعال است (پیش‌فرض)، بیکن را تبلیغ می‌کنند.

رکوردهای کشف گسترده شامل این موارد هستند (TXT):

- `role` (راهنمای نقش Gateway)
- `transport` (راهنمای transport، برای مثال `gateway`)
- `gatewayPort` (پورت WebSocket، معمولاً `18789`)
- `sshPort` (اختیاری؛ وقتی وجود نداشته باشد، کلاینت‌ها اهداف SSH را به‌طور پیش‌فرض `22` می‌گذارند)
- `tailnetDns` (نام میزبان MagicDNS، وقتی در دسترس باشد)
- `gatewayTls` / `gatewayTlsSha256` (TLS فعال + اثر انگشت گواهی)
- `cliPath` (راهنمای نصب راه دور که در ناحیهٔ گسترده نوشته می‌شود)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلت زمانی هر دستور (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن برای ماشین (همچنین سبک‌دهی/spinner را غیرفعال می‌کند).
</ParamField>

مثال‌ها:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI وقتی یک دامنهٔ گستردهٔ پیکربندی‌شده فعال باشد، `local.` به‌علاوهٔ آن دامنه را اسکن می‌کند.
- `wsUrl` در خروجی JSON از نقطهٔ پایانی سرویس resolveشده مشتق می‌شود، نه از راهنماهای فقط TXT مانند `lanHost` یا `tailnetDns`.
- در mDNS مربوط به `local.`، `sshPort` و `cliPath` فقط وقتی broadcast می‌شوند که `discovery.mdns.mode` برابر `full` باشد. DNS-SD گسترده همچنان `cliPath` را می‌نویسد؛ `sshPort` آنجا هم اختیاری می‌ماند.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [Runbook Gateway](/fa/gateway)
