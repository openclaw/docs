---
read_when:
    - اجرای Gateway از CLI (توسعه یا سرورها)
    - اشکال‌زدایی احراز هویت Gateway، حالت‌های بایند، و اتصال‌پذیری
    - کشف Gatewayها از طریق Bonjour (DNS-SD محلی + گسترده)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — Gatewayها را اجرا، پرس‌وجو و کشف کنید
title: Gateway
x-i18n:
    generated_at: "2026-05-01T11:43:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 127a6ccb4baa1ad5e5051db0bc7ef0ed30d410c4c3d13f36356483a6e03dce4c
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocketِ OpenClaw است (کانال‌ها، گره‌ها، نشست‌ها، hookها). زیر‌دستورهای این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="کشف Bonjour" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده.
  </Card>
  <Card title="نمای کلی کشف" href="/fa/gateway/discovery">
    اینکه OpenClaw چگونه gatewayها را اعلام و پیدا می‌کند.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration">
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
  <Accordion title="رفتار راه‌اندازی">
    - به‌طور پیش‌فرض، Gateway شروع به کار نمی‌کند مگر اینکه `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم شده باشد. برای اجراهای موقت/توسعه‌ای از `--allow-unconfigured` استفاده کنید.
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` موجود نیست، آن را پیکربندی خراب یا بازنویسی‌شده در نظر بگیرید و به‌جای فرض ضمنی حالت محلی، آن را تعمیر کنید.
    - اگر فایل وجود دارد و `gateway.mode` موجود نیست، Gateway آن را آسیب مشکوک به پیکربندی تلقی می‌کند و از «حدس‌زدن local» برای شما خودداری می‌کند.
    - اتصال فراتر از loopback بدون احراز هویت مسدود می‌شود (حفاظ ایمنی).
    - `SIGUSR1` در صورت مجاز بودن، راه‌اندازی مجدد درون‌فرایندی را فعال می‌کند (`commands.restart` به‌طور پیش‌فرض فعال است؛ برای جلوگیری از راه‌اندازی مجدد دستی، `commands.restart: false` را تنظیم کنید، در حالی که اعمال/به‌روزرسانی ابزار/پیکربندی gateway همچنان مجاز می‌ماند).
    - handlerهای `SIGINT`/`SIGTERM` فرایند gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی ترمینال را بازیابی نمی‌کنند. اگر CLI را با TUI یا ورودی raw-mode پوشش می‌دهید، پیش از خروج ترمینال را بازیابی کنید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  پورت WebSocket (پیش‌فرض از پیکربندی/env می‌آید؛ معمولا `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  حالت اتصال شنونده.
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
  خواندن passwordِ gateway از یک فایل.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  در دسترس قرار دادن Gateway از طریق Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  بازنشانی پیکربندی serve/funnelِ Tailscale هنگام خاموشی.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه شروع gateway بدون `gateway.mode=local` در پیکربندی. فقط برای bootstrap موقت/توسعه‌ای از حفاظ راه‌اندازی عبور می‌کند؛ فایل پیکربندی را نمی‌نویسد یا تعمیر نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  در صورت نبود، یک پیکربندی توسعه + workspace ایجاد می‌کند (`BOOTSTRAP.md` را رد می‌کند).
</ParamField>
<ParamField path="--reset" type="boolean">
  بازنشانی پیکربندی توسعه + credentials + نشست‌ها + workspace (به `--dev` نیاز دارد).
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنونده موجود روی پورت انتخاب‌شده را می‌کشد.
</ParamField>
<ParamField path="--verbose" type="boolean">
  logهای تفصیلی.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط logهای backendِ CLI را در console نشان می‌دهد (و stdout/stderr را فعال می‌کند).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  سبک logِ Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار برای `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  رویدادهای stream خام مدل را در jsonl ثبت می‌کند.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسیر jsonl برای stream خام.
</ParamField>

<Warning>
`--password` درون‌خطی می‌تواند در فهرست فرایندهای محلی افشا شود. `--password-file`، env، یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری راه‌اندازی

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید تا زمان‌بندی فازها هنگام راه‌اندازی Gateway ثبت شود، شامل تاخیر `eventLoopMax` برای هر فاز و زمان‌بندی‌های جدول جست‌وجوی Plugin برای installed-index، manifest registry، برنامه‌ریزی راه‌اندازی، و کار owner-map.
- `OPENCLAW_DIAGNOSTICS=timeline` را همراه با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید تا یک timeline تشخیصی راه‌اندازی JSONL با بهترین تلاش برای harnessهای QA خارجی نوشته شود. همچنین می‌توانید flag را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از env تامین می‌شود. برای افزودن نمونه‌های event-loop، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- برای benchmark راه‌اندازی Gateway، `pnpm test:startup:gateway -- --runs 5 --warmup 1` را اجرا کنید. benchmark نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های trace راه‌اندازی، تاخیر event-loop، و جزئیات زمان‌بندی جدول جست‌وجوی Plugin را ثبت می‌کند.

## پرس‌وجو از یک Gateway در حال اجرا

همه دستورهای پرس‌وجو از WebSocket RPC استفاده می‌کنند.

<Tabs>
  <Tab title="حالت‌های خروجی">
    - پیش‌فرض: خوانا برای انسان (رنگی در TTY).
    - `--json`: JSON خوانا برای ماشین (بدون styling/spinner).
    - `--no-color` (یا `NO_COLOR=1`): غیرفعال‌کردن ANSI با حفظ چیدمان انسانی.

  </Tab>
  <Tab title="گزینه‌های مشترک">
    - `--url <url>`: URLِ WebSocketِ Gateway.
    - `--token <token>`: tokenِ Gateway.
    - `--password <password>`: passwordِ Gateway.
    - `--timeout <ms>`: مهلت/بودجه زمانی (بسته به دستور متفاوت است).
    - `--expect-final`: انتظار برای پاسخ "final" (فراخوانی‌های agent).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به credentials موجود در پیکربندی یا محیط fallback نمی‌کند. `--token` یا `--password` را صریح ارسال کنید. نبود credentials صریح خطا است.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpointِ HTTPِ `/healthz` یک liveness probe است: وقتی سرور بتواند به HTTP پاسخ دهد، برمی‌گردد. endpointِ HTTPِ `/readyz` سخت‌گیرتر است و تا زمانی که وابستگی‌های runtimeِ Plugin هنگام راه‌اندازی، sidecarها، کانال‌ها، یا hookهای پیکربندی‌شده هنوز در حال پایدار شدن هستند، قرمز می‌ماند. پاسخ‌های readiness تفصیلی محلی یا احراز هویت‌شده شامل یک بلوک تشخیصی `eventLoop` با تاخیر event-loop، بهره‌برداری event-loop، نسبت هسته CPU، و flagِ `degraded` هستند.

### `gateway usage-cost`

خلاصه‌های usage-cost را از logهای نشست دریافت کنید.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید شامل شود.
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
  حداکثر تعداد رویدادهای اخیر برای درج (حداکثر `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  فیلتر بر اساس نوع رویداد تشخیصی، مانند `payload.large` یا `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رویدادهای بعد از یک شماره توالی تشخیصی را شامل می‌کند.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک bundle پایداری ذخیره‌شده را می‌خواند. برای جدیدترین bundle زیر دایرکتوری state از `--bundle latest` (یا فقط `--bundle`) استفاده کنید، یا مسیر JSONِ bundle را مستقیم ارسال کنید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک zip تشخیصی پشتیبانی قابل اشتراک می‌نویسد.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="حریم خصوصی و رفتار bundle">
    - رکوردها metadata عملیاتی را نگه می‌دارند: نام رویدادها، شمارش‌ها، اندازه‌های byte، خوانش‌های حافظه، وضعیت queue/session، نام‌های کانال/Plugin، و خلاصه‌های ویرایش‌شده نشست. آن‌ها متن chat، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، tokenها، cookieها، مقادیر secret، hostnameها، یا شناسه‌های خام نشست را نگه نمی‌دارند. برای غیرفعال‌کردن کامل recorder، `diagnostics.enabled: false` را تنظیم کنید.
    - هنگام خروج‌های fatalِ Gateway، timeoutهای خاموشی، و failureهای راه‌اندازی مجدد، وقتی recorder رویداد داشته باشد، OpenClaw همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد. جدیدترین bundle را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type`، و `--since-seq` برای خروجی bundle هم اعمال می‌شوند.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

یک zip تشخیصی محلی می‌نویسد که برای پیوست کردن به گزارش‌های باگ طراحی شده است. برای مدل حریم خصوصی و محتوای bundle، [Diagnostics Export](/fa/gateway/diagnostics) را ببینید.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسیر zip خروجی. پیش‌فرض یک export پشتیبانی زیر دایرکتوری state است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  حداکثر خط‌های log پاک‌سازی‌شده برای درج.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  حداکثر byteهای log برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  URLِ WebSocketِ Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  tokenِ Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  passwordِ Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeoutِ snapshot وضعیت/سلامت.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  جست‌وجوی bundle پایداری ذخیره‌شده را رد می‌کند.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه، و manifest را به‌صورت JSON چاپ می‌کند.
</ParamField>

export شامل یک manifest، خلاصه Markdown، شکل پیکربندی، جزئیات پیکربندی پاک‌سازی‌شده، خلاصه‌های log پاک‌سازی‌شده، snapshotهای وضعیت/سلامت پاک‌سازی‌شده Gateway، و جدیدترین bundle پایداری در صورت وجود است.

برای اشتراک‌گذاری در نظر گرفته شده است. جزئیات عملیاتی مفید برای اشکال‌زدایی را نگه می‌دارد، مانند فیلدهای امن logِ OpenClaw، نام‌های زیرسامانه، کدهای وضعیت، durationها، حالت‌های پیکربندی‌شده، پورت‌ها، شناسه‌های Plugin، شناسه‌های provider، تنظیمات feature غیرمحرمانه، و پیام‌های log عملیاتی ویرایش‌شده. متن chat، بدنه‌های webhook، خروجی‌های ابزار، credentials، cookieها، شناسه‌های account/message، متن prompt/instruction، hostnameها، و مقادیر secret را حذف یا ویرایش می‌کند. وقتی پیامی به سبک LogTape شبیه متن payload کاربر/chat/tool باشد، export فقط این را نگه می‌دارد که یک پیام حذف شده است به‌همراه تعداد byte آن.

### `gateway status`

`gateway status` سرویس Gateway (launchd/systemd/schtasks) را به‌همراه یک probe اختیاری از قابلیت اتصال/احراز هویت نشان می‌دهد.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  یک هدف probe صریح اضافه می‌کند. remote پیکربندی‌شده + localhost همچنان probe می‌شوند.
</ParamField>
<ParamField path="--token <token>" type="string">
  احراز هویت token برای probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  احراز هویت password برای probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  timeoutِ probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  probe اتصال را رد می‌کند (نمای فقط سرویس).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را هم scan می‌کند.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  probe اتصال پیش‌فرض را به یک read probe ارتقا می‌دهد و وقتی آن read probe شکست بخورد با خروجی غیرصفر خارج می‌شود. نمی‌توان آن را با `--no-probe` ترکیب کرد.
</ParamField>

<AccordionGroup>
  <Accordion title="معناشناسی وضعیت">
    - `gateway status` حتی زمانی که پیکربندی CLI محلی وجود ندارد یا نامعتبر است، برای عیب‌یابی در دسترس می‌ماند.
    - `gateway status` پیش‌فرض، وضعیت سرویس، اتصال WebSocket، و قابلیت احراز هویت قابل مشاهده در زمان دست‌دهی را اثبات می‌کند. عملیات خواندن/نوشتن/ادمین را اثبات نمی‌کند.
    - کاوش‌های عیب‌یابی برای احراز هویت دستگاه در اولین استفاده غیرتغییردهنده هستند: وقتی توکن دستگاه کش‌شده موجود باشد از همان استفاده می‌کنند، اما صرفا برای بررسی وضعیت، هویت دستگاه CLI جدید یا رکورد جفت‌سازی دستگاه فقط‌خواندنی ایجاد نمی‌کنند.
    - `gateway status` در صورت امکان، SecretRefs احراز هویت پیکربندی‌شده را برای احراز هویت کاوش resolve می‌کند.
    - اگر یک SecretRef احراز هویت ضروری در این مسیر فرمان resolve نشود، `gateway status --json` هنگام شکست اتصال/احراز هویت کاوش، `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صراحتا پاس دهید یا ابتدا منبع secret را resolve کنید.
    - اگر کاوش موفق شود، هشدارهای auth-ref resolveنشده برای جلوگیری از مثبت کاذب سرکوب می‌شوند.
    - در اسکریپت‌ها و اتوماسیون وقتی صرفا یک سرویس در حال گوش‌دادن کافی نیست و لازم است فراخوانی‌های RPC با scope خواندن هم سالم باشند، از `--require-rpc` استفاده کنید.
    - `--deep` یک اسکن best-effort برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه Gateway شناسایی شوند، خروجی انسانی نکات پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که بیشتر راه‌اندازی‌ها باید در هر ماشین یک Gateway اجرا کنند.
    - خروجی انسانی شامل مسیر resolved لاگ فایل به‌همراه نمایی از مسیرها/اعتبار پیکربندی CLI در برابر سرویس است تا به تشخیص drift در profile یا state-dir کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های drift احراز هویت Linux systemd">
    - در نصب‌های Linux systemd، بررسی‌های drift احراز هویت سرویس هم مقادیر `Environment=` و هم `EnvironmentFile=` را از unit می‌خوانند (شامل `%h`، مسیرهای نقل‌قول‌دار، چند فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift، SecretRefs مربوط به `gateway.auth.token` را با استفاده از env زمان اجرای ادغام‌شده resolve می‌کنند (ابتدا env فرمان سرویس، سپس fallback به env فرایند).
    - اگر احراز هویت token عملا فعال نباشد (`gateway.auth.mode` صریح با مقدار `password`/`none`/`trusted-proxy`، یا mode تنظیم‌نشده‌ای که در آن password می‌تواند برنده شود و هیچ token candidate نمی‌تواند برنده شود)، بررسی‌های token-drift از resolve کردن token پیکربندی صرف‌نظر می‌کنند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` فرمان «اشکال‌زدایی همه‌چیز» است. همیشه این موارد را کاوش می‌کند:

- Gateway راه‌دور پیکربندی‌شده شما (اگر تنظیم شده باشد)، و
- localhost (loopback) **حتی اگر راه‌دور پیکربندی شده باشد**.

اگر `--url` را پاس دهید، آن هدف صریح جلوتر از هر دو اضافه می‌شود. خروجی انسانی هدف‌ها را این‌طور برچسب می‌زند:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند Gateway قابل دسترسی باشند، همه آن‌ها را چاپ می‌کند. چند Gateway زمانی پشتیبانی می‌شود که از profile/portهای ایزوله استفاده کنید (مثلا یک ربات rescue)، اما بیشتر نصب‌ها همچنان یک Gateway واحد اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی دست‌کم یک هدف اتصال WebSocket را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌دهد کاوش چه چیزی را درباره احراز هویت توانسته اثبات کند. این از دسترس‌پذیری جداست.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با scope خواندن (`health`/`status`/`system-presence`/`config.get`) هم موفق بوده‌اند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق بوده اما RPC با scope خواندن محدود است. این وضعیت به‌عنوان دسترس‌پذیری **degraded** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` پس از `Connect: ok` یعنی Gateway اتصال WebSocket را پذیرفته، اما عیب‌یابی‌های خواندن بعدی timeout شده یا شکست خورده‌اند. این هم دسترس‌پذیری **degraded** است، نه یک Gateway غیرقابل دسترسی.
    - مانند `gateway status`، probe از احراز هویت دستگاه کش‌شده موجود دوباره استفاده می‌کند اما هویت دستگاه یا وضعیت جفت‌سازی اولین‌بار را ایجاد نمی‌کند.
    - کد خروج فقط زمانی غیرصفر است که هیچ هدف کاوش‌شده‌ای قابل دسترسی نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالا:

    - `ok`: دست‌کم یک هدف قابل دسترسی است.
    - `degraded`: دست‌کم یک هدف اتصال را پذیرفته اما عیب‌یابی‌های کامل RPC جزئیات را تکمیل نکرده است.
    - `capability`: بهترین قابلیتی که در میان هدف‌های قابل دسترسی دیده شده است (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین هدف برای درنظرگرفتن به‌عنوان برنده فعال به این ترتیب: URL صریح، تونل SSH، راه‌دور پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار best-effort با `code`، `message`، و `targetIds` اختیاری.
    - `network`: راهنمایی‌های URL برای local loopback/tailnet که از پیکربندی فعلی و شبکه میزبان به‌دست آمده‌اند.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجه واقعی discovery که برای این نوبت probe استفاده شده است.

    برای هر هدف (`targets[].connect`):

    - `ok`: دسترس‌پذیری پس از connect + طبقه‌بندی degraded.
    - `rpcOk`: موفقیت کامل RPC جزئیات.
    - `scopeLimited`: شکست RPC جزئیات به‌دلیل نبود operator scope.

    برای هر هدف (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok` وقتی موجود باشد.
    - `scopes`: scopeهای اعطاشده گزارش‌شده در `hello-ok` وقتی موجود باشند.
    - `capability`: طبقه‌بندی قابلیت احراز هویت ارائه‌شده برای آن هدف.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی تونل SSH شکست خورد؛ فرمان به probeهای مستقیم برگشت.
    - `multiple_gateways`: بیش از یک هدف قابل دسترسی بود؛ این غیرمعمول است مگر اینکه عمدا profileهای ایزوله اجرا کنید، مثل یک ربات rescue.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای یک هدف ناموفق resolve نشد.
    - `probe_scope_limited`: اتصال WebSocket موفق بود، اما probe خواندن به‌دلیل نبود `operator.read` محدود شد.

  </Accordion>
</AccordionGroup>

#### راه‌دور از طریق SSH (هم‌ارزی برنامه Mac)

حالت "Remote over SSH" در برنامه macOS از یک local port-forward استفاده می‌کند تا Gateway راه‌دور (که ممکن است فقط به loopback bound شده باشد) در `ws://127.0.0.1:<port>` قابل دسترسی شود.

معادل CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` یا `user@host:port` (port به‌طور پیش‌فرض `22` است).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  فایل identity.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  نخستین میزبان Gateway کشف‌شده را به‌عنوان هدف SSH از endpoint کشف resolved انتخاب کنید (`local.` به‌علاوه دامنه wide-area پیکربندی‌شده، در صورت وجود). راهنمایی‌های فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، به‌عنوان پیش‌فرض استفاده می‌شود):

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
  URL مربوط به Gateway WebSocket.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  رمز عبور Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  بودجه timeout.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  عمدتا برای RPCهای سبک agent که پیش از payload نهایی، رویدادهای میانی را stream می‌کنند.
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

وقتی سرویس مدیریت‌شده باید از طریق executable دیگری شروع شود، مثلا یک shim مدیریت secrets یا یک کمک‌ابزار run-as، از `--wrapper` استفاده کنید. wrapper آرگومان‌های عادی Gateway را دریافت می‌کند و مسئول است که در نهایت `openclaw` یا Node را با همان آرگومان‌ها exec کند.

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

همچنین می‌توانید wrapper را از طریق محیط تنظیم کنید. `gateway install` اعتبارسنجی می‌کند که مسیر یک فایل executable باشد، wrapper را در `ProgramArguments` سرویس می‌نویسد، و `OPENCLAW_WRAPPER` را در محیط سرویس برای نصب‌های مجدد اجباری، به‌روزرسانی‌ها، و تعمیرهای doctor بعدی پایدار می‌کند.

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
    - برای راه‌اندازی دوباره یک سرویس مدیریت‌شده از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین restart پشت سر هم اجرا نکنید؛ در macOS، `gateway stop` عمدا LaunchAgent را پیش از توقف آن غیرفعال می‌کند.
    - فرمان‌های چرخه عمر برای اسکریپت‌نویسی `--json` را می‌پذیرند.

  </Accordion>
  <Accordion title="احراز هویت و SecretRefs در زمان نصب">
    - وقتی احراز هویت token به token نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `gateway install` اعتبارسنجی می‌کند که SecretRef قابل resolve باشد اما token resolved را در metadata محیط سرویس پایدار نمی‌کند.
    - اگر احراز هویت token به token نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolveنشده باشد، نصب به‌جای پایدارکردن fallback plaintext به‌صورت بسته شکست می‌خورد.
    - برای احراز هویت password در `gateway run`، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file`، یا `gateway.auth.password` پشتیبانی‌شده با SecretRef را به `--password` درون‌خطی ترجیح دهید.
    - در حالت احراز هویت استنباط‌شده، `OPENCLAW_GATEWAY_PASSWORD` فقط در shell الزامات token نصب را relaxed نمی‌کند؛ هنگام نصب یک سرویس مدیریت‌شده از پیکربندی بادوام (`gateway.auth.password` یا config `env`) استفاده کنید.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که mode صراحتا تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف Gatewayها (Bonjour)

`gateway discover` برای beaconهای Gateway (`_openclaw-gw._tcp`) اسکن می‌کند.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): یک دامنه انتخاب کنید (مثال: `openclaw.internal.`) و split DNS + یک سرور DNS راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط Gatewayهایی که کشف Bonjour در آن‌ها فعال است (پیش‌فرض)، beacon را advertise می‌کنند.

رکوردهای Wide-Area discovery شامل این موارد هستند (TXT):

- `role` (راهنمای نقش Gateway)
- `transport` (راهنمای transport، مثلا `gateway`)
- `gatewayPort` (پورت WebSocket، معمولا `18789`)
- `sshPort` (اختیاری؛ clientها وقتی وجود نداشته باشد هدف‌های SSH را به‌طور پیش‌فرض `22` در نظر می‌گیرند)
- `tailnetDns` (نام میزبان MagicDNS، وقتی موجود باشد)
- `gatewayTls` / `gatewayTlsSha256` (TLS فعال + اثر انگشت گواهی)
- `cliPath` (راهنمای remote-install نوشته‌شده در wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  timeout هر فرمان (browse/resolve).
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
- CLI هنگام فعال بودن دامنهٔ گستردهٔ پیکربندی‌شده، `local.` به‌همراه آن دامنه را اسکن می‌کند.
- `wsUrl` در خروجی JSON از نقطهٔ پایانی سرویسِ حل‌شده به دست می‌آید، نه از راهنماهای فقط TXT مانند `lanHost` یا `tailnetDns`.
- در mDNS مربوط به `local.`، `sshPort` و `cliPath` فقط زمانی پخش می‌شوند که `discovery.mdns.mode` برابر با `full` باشد. DNS-SD گسترده همچنان `cliPath` را می‌نویسد؛ `sshPort` آنجا هم اختیاری می‌ماند.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای اجرایی Gateway](/fa/gateway)
