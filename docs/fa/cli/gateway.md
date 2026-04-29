---
read_when:
    - اجرای Gateway از طریق CLI (محیط توسعه یا سرورها)
    - اشکال‌زدایی احراز هویت Gateway، حالت‌های اتصال و اتصال‌پذیری
    - کشف Gatewayها از طریق Bonjour (محلی + DNS-SD با گسترهٔ وسیع)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gatewayها را اجرا، پرس‌وجو و کشف کنید
title: Gateway
x-i18n:
    generated_at: "2026-04-29T22:36:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe53f1ec289bf463766634a9b03bc234e109fdddf35b3fa3958fb8c5255c81a9
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket مربوط به OpenClaw است (کانال‌ها، Nodeها، نشست‌ها، hookها). زیر‌دستورهای این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="کشف Bonjour" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده.
  </Card>
  <Card title="نمای کلی کشف" href="/fa/gateway/discovery">
    اینکه OpenClaw چگونه Gatewayها را تبلیغ و پیدا می‌کند.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration">
    کلیدهای سطح بالای پیکربندی Gateway.
  </Card>
</CardGroup>

## اجرای Gateway

یک فرایند محلی Gateway را اجرا کنید:

```bash
openclaw gateway
```

نام مستعار اجرای foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="رفتار راه‌اندازی">
    - به‌طور پیش‌فرض، Gateway شروع به کار نمی‌کند مگر اینکه `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم شده باشد. برای اجراهای موقت/توسعه‌ای از `--allow-unconfigured` استفاده کنید.
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` موجود نیست، آن را به‌عنوان پیکربندی خراب یا بازنویسی‌شده در نظر بگیرید و به‌جای اینکه حالت محلی را ضمنی فرض کنید، آن را تعمیر کنید.
    - اگر فایل وجود دارد و `gateway.mode` موجود نیست، Gateway این وضعیت را آسیب مشکوک به پیکربندی تلقی می‌کند و برای شما «local را حدس» نمی‌زند.
    - اتصال بیرون از loopback بدون احراز هویت مسدود می‌شود (حفاظ ایمنی).
    - `SIGUSR1` وقتی مجاز باشد یک restart درون‌فرایندی را فعال می‌کند (`commands.restart` به‌طور پیش‌فرض فعال است؛ برای مسدود کردن restart دستی `commands.restart: false` را تنظیم کنید، درحالی‌که gateway tool/config apply/update همچنان مجاز می‌مانند).
    - handlerهای `SIGINT`/`SIGTERM` فرایند Gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی terminal را بازیابی نمی‌کنند. اگر CLI را با TUI یا ورودی raw-mode بسته‌بندی می‌کنید، پیش از خروج terminal را بازیابی کنید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  پورت WebSocket (مقدار پیش‌فرض از config/env می‌آید؛ معمولاً `18789`).
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
  بازنویسی password.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  خواندن password مربوط به Gateway از یک فایل.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway را از طریق Tailscale در معرض دسترس قرار دهید.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  هنگام خاموش شدن، پیکربندی serve/funnel مربوط به Tailscale را reset کنید.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه می‌دهد Gateway بدون `gateway.mode=local` در پیکربندی شروع شود. حفاظ راه‌اندازی را فقط برای bootstrap موقت/توسعه‌ای دور می‌زند؛ فایل پیکربندی را نمی‌نویسد یا تعمیر نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  اگر وجود ندارد، یک پیکربندی توسعه + workspace ایجاد کنید (`BOOTSTRAP.md` را رد می‌کند).
</ParamField>
<ParamField path="--reset" type="boolean">
  پیکربندی توسعه + credentials + نشست‌ها + workspace را reset کنید (به `--dev` نیاز دارد).
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنونده موجود روی پورت انتخاب‌شده را متوقف کنید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  لاگ‌های پرجزئیات.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط لاگ‌های backend مربوط به CLI را در console نشان دهید (و stdout/stderr را فعال کنید).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  سبک لاگ WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار برای `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  رویدادهای raw model stream را در jsonl لاگ کنید.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسیر jsonl برای raw stream.
</ParamField>

<Warning>
`--password` inline می‌تواند در فهرست فرایندهای محلی افشا شود. `--password-file`، env، یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری راه‌اندازی

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید تا زمان‌بندی phaseها هنگام راه‌اندازی Gateway لاگ شود، از جمله تأخیر `eventLoopMax` برای هر phase و زمان‌بندی‌های lookup-table مربوط به Plugin برای installed-index، manifest registry، startup planning، و owner-map work.
- `OPENCLAW_DIAGNOSTICS=timeline` را همراه با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید تا یک timeline تشخیصی راه‌اندازی JSONL به‌صورت best-effort برای harnessهای QA خارجی نوشته شود. همچنین می‌توانید این flag را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از env ارائه می‌شود. برای گنجاندن نمونه‌های event-loop، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- برای benchmark راه‌اندازی Gateway، `pnpm test:startup:gateway -- --runs 5 --warmup 1` را اجرا کنید. این benchmark نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های startup trace، تأخیر event-loop، و جزئیات زمان‌بندی lookup-table مربوط به Plugin را ثبت می‌کند.

## پرس‌وجو از یک Gateway در حال اجرا

همه دستورهای پرس‌وجو از WebSocket RPC استفاده می‌کنند.

<Tabs>
  <Tab title="حالت‌های خروجی">
    - پیش‌فرض: خوانا برای انسان (رنگی در TTY).
    - `--json`: JSON قابل خواندن برای ماشین (بدون styling/spinner).
    - `--no-color` (یا `NO_COLOR=1`): ANSI را غیرفعال می‌کند و چیدمان انسانی را نگه می‌دارد.

  </Tab>
  <Tab title="گزینه‌های مشترک">
    - `--url <url>`: URL مربوط به WebSocket Gateway.
    - `--token <token>`: token مربوط به Gateway.
    - `--password <password>`: password مربوط به Gateway.
    - `--timeout <ms>`: timeout/budget (بسته به دستور متفاوت است).
    - `--expect-final`: منتظر پاسخ "final" می‌ماند (فراخوانی‌های agent).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به credentials موجود در پیکربندی یا محیط fallback نمی‌کند. `--token` یا `--password` را صریحاً وارد کنید. نبود credentials صریح یک خطا است.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP به نام `/healthz` یک liveness probe است: وقتی سرور بتواند به HTTP پاسخ دهد، خروجی برمی‌گرداند. endpoint HTTP به نام `/readyz` سخت‌گیرانه‌تر است و تا زمانی که sidecarهای راه‌اندازی، کانال‌ها، یا hookهای پیکربندی‌شده هنوز در حال پایدار شدن هستند، در وضعیت قرمز می‌ماند. پاسخ‌های readiness محلی یا احراز هویت‌شده و پرجزئیات، شامل یک بلوک تشخیصی `eventLoop` با تأخیر event-loop، بهره‌برداری event-loop، نسبت هسته CPU، و flag به نام `degraded` هستند.

### `gateway usage-cost`

خلاصه‌های usage-cost را از لاگ‌های نشست دریافت کنید.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید گنجانده شوند.
</ParamField>

### `gateway stability`

recorder تشخیصی stability اخیر را از یک Gateway در حال اجرا دریافت کنید.

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
  فقط رویدادهای پس از یک شماره sequence تشخیصی را بگنجانید.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک stability bundle ماندگار را بخوانید. برای جدیدترین bundle زیر دایرکتوری state، از `--bundle latest` (یا فقط `--bundle`) استفاده کنید، یا مستقیماً یک مسیر JSON مربوط به bundle را وارد کنید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات stability، یک zip تشخیصی قابل اشتراک‌گذاری برای پشتیبانی بنویسید.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="حریم خصوصی و رفتار bundle">
    - رکوردها metadata عملیاتی را نگه می‌دارند: نام رویدادها، شمارش‌ها، اندازه‌های byte، خوانش‌های حافظه، وضعیت queue/session، نام‌های کانال/Plugin، و خلاصه‌های redact‌شده نشست. آن‌ها متن chat، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام request یا response، tokenها، cookieها، مقادیر secret، hostnameها، یا session idهای خام را نگه نمی‌دارند. برای غیرفعال کردن کامل recorder، `diagnostics.enabled: false` را تنظیم کنید.
    - هنگام خروج‌های fatal از Gateway، timeoutهای خاموشی، و شکست‌های راه‌اندازی restart، OpenClaw وقتی recorder رویداد داشته باشد همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد. جدیدترین bundle را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type`، و `--since-seq` نیز روی خروجی bundle اعمال می‌شوند.

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
  مسیر zip خروجی. به‌طور پیش‌فرض یک export پشتیبانی زیر دایرکتوری state است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  بیشینه تعداد خطوط لاگ sanitize‌شده برای گنجاندن.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  بیشینه تعداد byteهای لاگ برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL مربوط به WebSocket Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  token مربوط به Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  password مربوط به Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout مربوط به snapshot وضعیت/سلامت.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  lookup مربوط به stability bundle ماندگار را رد کنید.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه، و manifest را به‌صورت JSON چاپ کنید.
</ParamField>

این export شامل یک manifest، یک خلاصه Markdown، شکل پیکربندی، جزئیات پیکربندی sanitize‌شده، خلاصه‌های لاگ sanitize‌شده، snapshotهای وضعیت/سلامت sanitize‌شده مربوط به Gateway، و جدیدترین stability bundle در صورت وجود است.

این خروجی برای اشتراک‌گذاری در نظر گرفته شده است. جزئیات عملیاتی مفید برای debugging را نگه می‌دارد، مانند فیلدهای امن لاگ OpenClaw، نام‌های subsystem، status codeها، durationها، حالت‌های پیکربندی‌شده، پورت‌ها، plugin idها، provider idها، تنظیمات feature غیرsecret، و پیام‌های لاگ عملیاتی redact‌شده. متن chat، بدنه‌های webhook، خروجی‌های ابزار، credentials، cookieها، شناسه‌های account/message، متن prompt/instruction، hostnameها، و مقادیر secret را حذف یا redact می‌کند. وقتی یک پیام به سبک LogTape شبیه متن payload مربوط به user/chat/tool باشد، export فقط این را نگه می‌دارد که پیامی حذف شده است، به‌همراه شمارش byte آن.

### `gateway status`

`gateway status` سرویس Gateway (launchd/systemd/schtasks) را به‌همراه یک probe اختیاری برای قابلیت connectivity/auth نشان می‌دهد.

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
  probe اتصال را رد کنید (نمای service-only).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را هم scan کنید.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  probe اتصال پیش‌فرض را به read probe ارتقا دهید و وقتی آن read probe شکست بخورد با کد غیرصفر خارج شوید. نمی‌تواند با `--no-probe` ترکیب شود.
</ParamField>

<AccordionGroup>
  <Accordion title="معناشناسی وضعیت">
    - `gateway status` حتی وقتی پیکربندی CLI محلی وجود ندارد یا نامعتبر است، برای عیب‌یابی در دسترس می‌ماند.
    - `gateway status` پیش‌فرض وضعیت سرویس، اتصال WebSocket، و قابلیت احراز هویت قابل مشاهده در زمان دست‌دهی را اثبات می‌کند. این دستور عملیات خواندن/نوشتن/مدیریت را اثبات نمی‌کند.
    - کاوش‌های عیب‌یابی برای احراز هویت بار اول دستگاه تغییردهنده نیستند: وقتی توکن دستگاه کش‌شده‌ای وجود داشته باشد، از همان استفاده می‌کنند، اما فقط برای بررسی وضعیت، هویت دستگاه CLI جدید یا رکورد جفت‌سازی دستگاه فقط-خواندنی ایجاد نمی‌کنند.
    - `gateway status` در صورت امکان SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت کاوش حل می‌کند.
    - اگر یک SecretRef احراز هویت الزامی در این مسیر فرمان حل نشود، `gateway status --json` هنگام شکست اتصال/احراز هویت کاوش، `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صراحتا پاس دهید یا ابتدا منبع راز را حل کنید.
    - اگر کاوش موفق شود، هشدارهای auth-ref حل‌نشده برای جلوگیری از مثبت‌های کاذب سرکوب می‌شوند.
    - وقتی فقط داشتن یک سرویس در حال گوش دادن کافی نیست و لازم است فراخوانی‌های RPC با دامنه خواندن نیز سالم باشند، در اسکریپت‌ها و خودکارسازی از `--require-rpc` استفاده کنید.
    - `--deep` یک اسکن best-effort برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه Gateway شناسایی شوند، خروجی انسانی راهنمایی‌های پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که بیشتر راه‌اندازی‌ها باید در هر ماشین یک Gateway اجرا کنند.
    - خروجی انسانی مسیر فایل لاگ حل‌شده به‌همراه نمای لحظه‌ای مسیرها/اعتبار پیکربندی CLI در برابر سرویس را شامل می‌شود تا به عیب‌یابی drift پروفایل یا state-dir کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های auth-drift در Linux systemd">
    - در نصب‌های Linux systemd، بررسی‌های drift احراز هویت سرویس هم مقدارهای `Environment=` و هم `EnvironmentFile=` را از unit می‌خوانند (شامل `%h`، مسیرهای نقل‌قول‌شده، چند فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift، SecretRefهای `gateway.auth.token` را با استفاده از env زمان اجرای ادغام‌شده حل می‌کنند (ابتدا env فرمان سرویس، سپس fallback به env فرایند).
    - اگر احراز هویت توکنی به‌طور مؤثر فعال نباشد (`gateway.auth.mode` صریح برابر با `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد در حالتی که password می‌تواند برنده شود و هیچ کاندید توکنی نمی‌تواند برنده شود)، بررسی‌های token-drift حل توکن پیکربندی را رد می‌کنند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` فرمان «عیب‌یابی همه‌چیز» است. این فرمان همیشه این موارد را کاوش می‌کند:

- Gateway راه دور پیکربندی‌شده شما (اگر تنظیم شده باشد)، و
- local loopback **حتی اگر راه دور پیکربندی شده باشد**.

اگر `--url` را پاس دهید، آن هدف صریح پیش از هر دو اضافه می‌شود. خروجی انسانی هدف‌ها را این‌گونه برچسب‌گذاری می‌کند:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند Gateway قابل دسترس باشند، همه آن‌ها را چاپ می‌کند. وقتی از پروفایل‌ها/پورت‌های جداافتاده استفاده می‌کنید (مثلا یک ربات نجات)، چند Gateway پشتیبانی می‌شود، اما بیشتر نصب‌ها همچنان یک Gateway واحد را اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی دست‌کم یک هدف اتصال WebSocket را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌کند کاوش چه چیزی را درباره احراز هویت توانسته اثبات کند. این مورد از قابلیت دسترسی جداست.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با دامنه خواندن (`health`/`status`/`system-presence`/`config.get`) نیز موفق بوده‌اند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق بوده اما RPC با دامنه خواندن محدود است. این وضعیت به‌عنوان قابلیت دسترسی **تنزل‌یافته** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` پس از `Connect: ok` یعنی Gateway اتصال WebSocket را پذیرفته، اما عیب‌یابی‌های خواندنی بعدی timeout شده یا شکست خورده‌اند. این نیز قابلیت دسترسی **تنزل‌یافته** است، نه یک Gateway غیرقابل دسترس.
    - مانند `gateway status`، کاوش از احراز هویت دستگاه کش‌شده موجود دوباره استفاده می‌کند، اما هویت دستگاه بار اول یا وضعیت جفت‌سازی ایجاد نمی‌کند.
    - کد خروج فقط زمانی غیرصفر است که هیچ هدف کاوش‌شده‌ای قابل دسترس نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالایی:

    - `ok`: دست‌کم یک هدف قابل دسترس است.
    - `degraded`: دست‌کم یک هدف اتصال را پذیرفته اما عیب‌یابی کامل RPC جزئیات را کامل نکرده است.
    - `capability`: بهترین قابلیت دیده‌شده در میان هدف‌های قابل دسترس (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین هدف برای در نظر گرفتن به‌عنوان برنده فعال، به این ترتیب: URL صریح، تونل SSH، راه دور پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار best-effort با `code`، `message`، و `targetIds` اختیاری.
    - `network`: راهنمایی‌های URL برای local loopback/tailnet که از پیکربندی فعلی و شبکه میزبان استخراج شده‌اند.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجه واقعی discovery استفاده‌شده برای این گذر کاوش.

    به‌ازای هر هدف (`targets[].connect`):

    - `ok`: قابلیت دسترسی پس از اتصال + طبقه‌بندی تنزل‌یافته.
    - `rpcOk`: موفقیت کامل RPC جزئیات.
    - `scopeLimited`: شکست RPC جزئیات به‌دلیل نبود دامنه operator.

    به‌ازای هر هدف (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok` وقتی در دسترس باشد.
    - `scopes`: دامنه‌های اعطاشده گزارش‌شده در `hello-ok` وقتی در دسترس باشند.
    - `capability`: طبقه‌بندی قابلیت احراز هویت نمایش‌داده‌شده برای آن هدف.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی تونل SSH شکست خورد؛ فرمان به کاوش‌های مستقیم fallback کرد.
    - `multiple_gateways`: بیش از یک هدف قابل دسترس بود؛ این وضعیت غیرمعمول است مگر اینکه عمدا پروفایل‌های جداافتاده، مانند یک ربات نجات، اجرا کنید.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای یک هدف شکست‌خورده قابل حل نبود.
    - `probe_scope_limited`: اتصال WebSocket موفق بود، اما کاوش خواندن به‌دلیل نبود `operator.read` محدود شد.

  </Accordion>
</AccordionGroup>

#### راه دور روی SSH (هم‌ارزی اپ Mac)

حالت «راه دور روی SSH» در اپ macOS از یک port-forward محلی استفاده می‌کند تا Gateway راه دور (که ممکن است فقط به loopback bind شده باشد) در `ws://127.0.0.1:<port>` قابل دسترس شود.

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
  نخستین میزبان Gateway کشف‌شده را از endpoint حل‌شده discovery (`local.` به‌علاوه دامنه wide-area پیکربندی‌شده، اگر وجود داشته باشد) به‌عنوان هدف SSH انتخاب می‌کند. راهنمایی‌های فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، به‌عنوان پیش‌فرض استفاده می‌شود):

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
  عمدتا برای RPCهای سبک agent که پیش از payload نهایی رویدادهای میانی را stream می‌کنند.
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

وقتی سرویس مدیریت‌شده باید از طریق اجرایی دیگری شروع شود، مثلا یک shim مدیر رازها یا کمک‌کننده run-as، از `--wrapper` استفاده کنید. wrapper آرگومان‌های عادی Gateway را دریافت می‌کند و مسئول است در نهایت `openclaw` یا Node را با همان آرگومان‌ها exec کند.

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

همچنین می‌توانید wrapper را از طریق محیط تنظیم کنید. `gateway install` اعتبارسنجی می‌کند که مسیر یک فایل اجرایی است، wrapper را در `ProgramArguments` سرویس می‌نویسد، و `OPENCLAW_WRAPPER` را در محیط سرویس برای نصب‌های اجباری دوباره، به‌روزرسانی‌ها، و تعمیرهای doctor بعدی پایدار می‌کند.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

برای حذف یک wrapper پایدارشده، هنگام نصب دوباره `OPENCLAW_WRAPPER` را خالی کنید:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="گزینه‌های فرمان">
    - `gateway status`: `--url`، `--token`، `--password`، `--timeout`، `--no-probe`، `--require-rpc`، `--deep`، `--json`
    - `gateway install`: `--port`، `--runtime <node|bun>`، `--token`، `--wrapper <path>`، `--force`، `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="رفتار چرخه عمر">
    - برای راه‌اندازی دوباره یک سرویس مدیریت‌شده از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین restart زنجیره نکنید؛ در macOS، `gateway stop` عمدا LaunchAgent را پیش از توقف آن غیرفعال می‌کند.
    - فرمان‌های چرخه عمر برای اسکریپت‌نویسی `--json` را می‌پذیرند.

  </Accordion>
  <Accordion title="احراز هویت و SecretRefها در زمان نصب">
    - وقتی احراز هویت توکنی به توکن نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `gateway install` اعتبارسنجی می‌کند که SecretRef قابل حل است اما توکن حل‌شده را در فراداده محیط سرویس پایدار نمی‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، نصب به‌صورت fail-closed شکست می‌خورد، نه اینکه plaintext جایگزین را پایدار کند.
    - برای احراز هویت گذرواژه در `gateway run`، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file`، یا `gateway.auth.password` پشتیبانی‌شده با SecretRef را به `--password` درون‌خطی ترجیح دهید.
    - در حالت احراز هویت inferred، `OPENCLAW_GATEWAY_PASSWORD` فقط در shell الزامات توکن نصب را آسان‌تر نمی‌کند؛ هنگام نصب یک سرویس مدیریت‌شده از پیکربندی پایدار (`gateway.auth.password` یا config `env`) استفاده کنید.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صراحتا تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف Gatewayها (Bonjour)

`gateway discover` beaconهای Gateway (`_openclaw-gw._tcp`) را اسکن می‌کند.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): یک دامنه انتخاب کنید (مثال: `openclaw.internal.`) و split DNS + یک سرور DNS را راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط Gatewayهایی که discovery مربوط به Bonjour در آن‌ها فعال است (پیش‌فرض)، beacon را advertise می‌کنند.

رکوردهای wide-area discovery شامل این موارد هستند (TXT):

- `role` (راهنمای نقش Gateway)
- `transport` (راهنمای transport، مثلا `gateway`)
- `gatewayPort` (پورت WebSocket، معمولا `18789`)
- `sshPort` (اختیاری؛ کلاینت‌ها وقتی وجود نداشته باشد هدف‌های SSH را به‌صورت پیش‌فرض `22` می‌گیرند)
- `tailnetDns` (نام میزبان MagicDNS، وقتی در دسترس باشد)
- `gatewayTls` / `gatewayTlsSha256` (TLS فعال + اثرانگشت گواهی)
- `cliPath` (راهنمای نصب راه دور نوشته‌شده در zone مربوط به wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  timeout به‌ازای هر فرمان (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن توسط ماشین (همچنین styling/spinner را غیرفعال می‌کند).
</ParamField>

مثال‌ها:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI وقتی دامنهٔ گسترده‌ناحیهٔ پیکربندی‌شده فعال باشد، `local.` را به‌همراه آن اسکن می‌کند.
- `wsUrl` در خروجی JSON از نقطهٔ پایانی سرویس حل‌شده مشتق می‌شود، نه از راهنماهای فقط TXT مانند `lanHost` یا `tailnetDns`.
- در mDNS مربوط به `local.`، `sshPort` و `cliPath` فقط زمانی پخش می‌شوند که `discovery.mdns.mode` برابر `full` باشد. DNS-SD گسترده‌ناحیه همچنان `cliPath` را می‌نویسد؛ `sshPort` آنجا هم اختیاری می‌ماند.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای اجرایی Gateway](/fa/gateway)
