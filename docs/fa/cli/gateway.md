---
read_when:
    - اجرای Gateway از CLI (توسعه یا سرورها)
    - اشکال‌زدایی احراز هویت Gateway، حالت‌های اتصال و اتصال‌پذیری
    - کشف Gatewayها از طریق Bonjour (محلی + DNS-SD ناحیهٔ گسترده)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — اجرا، پرس‌وجو و کشف Gatewayها
title: Gateway
x-i18n:
    generated_at: "2026-05-10T19:32:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e436abba80f643f3b0bfc0a7d2f344beb18c3849a49e5d0825767ae7a81ae1d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket در OpenClaw است (کانال‌ها، Nodeها، نشست‌ها، hookها). زیرفرمان‌های این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="کشف Bonjour" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده.
  </Card>
  <Card title="نمای کلی کشف" href="/fa/gateway/discovery">
    OpenClaw چگونه Gatewayها را تبلیغ و پیدا می‌کند.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration">
    کلیدهای پیکربندی سطح بالای Gateway.
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
    - به‌طور پیش‌فرض، Gateway شروع به کار نمی‌کند مگر اینکه `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم شده باشد. برای اجراهای موقت/توسعه از `--allow-unconfigured` استفاده کنید.
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` وجود ندارد، آن را پیکربندی خراب یا بازنویسی‌شده در نظر بگیرید و به‌جای اینکه حالت محلی را ضمنی فرض کنید، آن را تعمیر کنید.
    - اگر فایل وجود دارد و `gateway.mode` وجود ندارد، Gateway این وضعیت را آسیب مشکوک به پیکربندی تلقی می‌کند و برای شما «local را حدس» نمی‌زند.
    - اتصال فراتر از loopback بدون احراز هویت مسدود است (حفاظ ایمنی).
    - `SIGUSR1` وقتی مجاز باشد یک راه‌اندازی مجدد درون‌فرایندی را فعال می‌کند (`commands.restart` به‌طور پیش‌فرض فعال است؛ برای مسدود کردن راه‌اندازی مجدد دستی، `commands.restart: false` را تنظیم کنید، در حالی که اعمال/به‌روزرسانی ابزار و پیکربندی Gateway همچنان مجاز می‌ماند).
    - handlerهای `SIGINT`/`SIGTERM` فرایند Gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی ترمینال را بازیابی نمی‌کنند. اگر CLI را با یک TUI یا ورودی raw-mode بسته‌بندی می‌کنید، پیش از خروج ترمینال را بازیابی کنید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  درگاه WebSocket (پیش‌فرض از پیکربندی/محیط می‌آید؛ معمولاً `18789`).
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
  بازنویسی گذرواژه.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  گذرواژه Gateway را از یک فایل بخوانید.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway را از طریق Tailscale در دسترس قرار دهید.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  هنگام خاموشی، پیکربندی serve/funnel در Tailscale را بازنشانی کنید.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه دهید Gateway بدون `gateway.mode=local` در پیکربندی شروع شود. فقط برای bootstrap موقت/توسعه از محافظ راه‌اندازی عبور می‌کند؛ فایل پیکربندی را نمی‌نویسد یا تعمیر نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  اگر وجود ندارد، پیکربندی توسعه + workspace بسازید (`BOOTSTRAP.md` را رد می‌کند).
</ParamField>
<ParamField path="--reset" type="boolean">
  پیکربندی توسعه + اعتبارنامه‌ها + نشست‌ها + workspace را بازنشانی کنید (به `--dev` نیاز دارد).
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنونده موجود روی درگاه انتخاب‌شده را خاتمه دهید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  گزارش‌های مفصل.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط گزارش‌های backend مربوط به CLI را در console نمایش دهید (و stdout/stderr را فعال کنید).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  سبک گزارش Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار برای `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  رویدادهای raw model stream را در jsonl ثبت کنید.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسیر jsonl برای raw stream.
</ParamField>

## راه‌اندازی مجدد Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` از Gateway در حال اجرا می‌خواهد پیش از راه‌اندازی مجدد، کارهای فعال OpenClaw را پیش‌بررسی کند. اگر عملیات صف‌شده، تحویل پاسخ، اجراهای تعبیه‌شده یا اجرای taskها فعال باشند، Gateway مسدودکننده‌ها را گزارش می‌کند، درخواست‌های تکراری راه‌اندازی مجدد ایمن را یکی می‌کند و پس از تخلیه کار فعال، راه‌اندازی مجدد انجام می‌دهد. `restart` ساده برای سازگاری، رفتار موجود service-manager را حفظ می‌کند. فقط وقتی از `--force` استفاده کنید که صراحتاً مسیر بازنویسی فوری را می‌خواهید.

`openclaw gateway restart --safe --skip-deferral` همان راه‌اندازی مجدد هماهنگ و آگاه از OpenClaw را مانند `--safe` اجرا می‌کند، اما از دروازه تعویق کار فعال عبور می‌کند تا Gateway حتی وقتی مسدودکننده‌ها گزارش شده‌اند، راه‌اندازی مجدد را فوراً منتشر کند. وقتی یک تعویق به‌دلیل گیر کردن اجرای task ثابت مانده و `--safe` به‌تنهایی نامحدود منتظر می‌ماند، از آن به‌عنوان راه خروج operator استفاده کنید. `--skip-deferral` به `--safe` نیاز دارد.

<Warning>
`--password` درون‌خطی می‌تواند در فهرست فرایندهای محلی افشا شود. `--password-file`، env، یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری راه‌اندازی

- برای ثبت زمان‌بندی فازها هنگام راه‌اندازی Gateway، از جمله تأخیر `eventLoopMax` به‌ازای هر فاز و زمان‌بندی‌های جدول lookup مربوط به Plugin برای installed-index، manifest registry، startup planning و owner-map work، مقدار `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید.
- برای نوشتن یک timeline تشخیصی راه‌اندازی JSONL با بهترین تلاش برای harnessهای QA خارجی، `OPENCLAW_DIAGNOSTICS=timeline` را همراه با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید. همچنین می‌توانید flag را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از env ارائه می‌شود. برای گنجاندن نمونه‌های event-loop، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- برای benchmark کردن راه‌اندازی Gateway، `pnpm test:startup:gateway -- --runs 5 --warmup 1` را اجرا کنید. benchmark نخستین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های startup trace، تأخیر event-loop و جزئیات زمان‌بندی جدول lookup مربوط به Plugin را ثبت می‌کند.

## پرس‌وجو از Gateway در حال اجرا

همه فرمان‌های پرس‌وجو از RPC مبتنی بر WebSocket استفاده می‌کنند.

<Tabs>
  <Tab title="حالت‌های خروجی">
    - پیش‌فرض: خوانا برای انسان (رنگی در TTY).
    - `--json`: JSON خوانا برای ماشین (بدون styling/spinner).
    - `--no-color` (یا `NO_COLOR=1`): ANSI را غیرفعال کنید و چیدمان انسانی را حفظ کنید.

  </Tab>
  <Tab title="گزینه‌های مشترک">
    - `--url <url>`: URL مربوط به WebSocket در Gateway.
    - `--token <token>`: token Gateway.
    - `--password <password>`: گذرواژه Gateway.
    - `--timeout <ms>`: timeout/budget (بسته به فرمان متفاوت است).
    - `--expect-final`: منتظر پاسخ "final" بمانید (agent calls).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به اعتبارنامه‌های پیکربندی یا محیط fallback نمی‌کند. `--token` یا `--password` را صراحتاً ارسال کنید. نبود اعتبارنامه‌های صریح خطاست.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

نقطه پایانی HTTP `/healthz` یک liveness probe است: وقتی server بتواند به HTTP پاسخ دهد، پاسخ برمی‌گرداند. نقطه پایانی HTTP `/readyz` سخت‌گیرانه‌تر است و تا زمانی که sidecarهای Plugin هنگام راه‌اندازی، کانال‌ها، یا hookهای پیکربندی‌شده هنوز در حال پایدار شدن هستند، قرمز می‌ماند. پاسخ‌های detailed readiness محلی یا احراز هویت‌شده شامل یک بلوک تشخیصی `eventLoop` با تأخیر event-loop، میزان استفاده از event-loop، نسبت هسته CPU، و flag `degraded` هستند.

### `gateway usage-cost`

خلاصه‌های usage-cost را از گزارش‌های نشست دریافت کنید.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید گنجانده شوند.
</ParamField>

### `gateway stability`

recorder پایداری تشخیصی اخیر را از Gateway در حال اجرا دریافت کنید.

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
  براساس نوع رویداد تشخیصی، مانند `payload.large` یا `diagnostic.memory.pressure` فیلتر کنید.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رویدادهای پس از یک شماره توالی تشخیصی را شامل کنید.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک بسته پایداری persist‌شده را بخوانید. برای جدیدترین بسته زیر state directory از `--bundle latest` (یا فقط `--bundle`) استفاده کنید، یا مسیر JSON بسته را مستقیماً ارسال کنید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک zip تشخیصی پشتیبانی قابل اشتراک بنویسید.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="حریم خصوصی و رفتار بسته">
    - رکوردها metadata عملیاتی را نگه می‌دارند: نام رویدادها، شمارش‌ها، اندازه‌های byte، خوانش‌های حافظه، وضعیت queue/session، نام کانال‌ها/Pluginها، و خلاصه‌های نشست redact‌شده. آن‌ها متن chat، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های raw request یا response، tokenها، cookieها، مقادیر secret، hostnameها، یا raw session idها را نگه نمی‌دارند. برای غیرفعال کردن کامل recorder، `diagnostics.enabled: false` را تنظیم کنید.
    - هنگام خروج‌های fatal از Gateway، timeoutهای خاموشی، و شکست‌های راه‌اندازی پس از restart، OpenClaw وقتی recorder رویداد داشته باشد، همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد. جدیدترین بسته را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type` و `--since-seq` نیز روی خروجی bundle اعمال می‌شوند.

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
  مسیر zip خروجی. پیش‌فرض، یک support export زیر state directory است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  حداکثر خطوط گزارش sanitized برای گنجاندن.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  حداکثر byteهای گزارش برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL مربوط به WebSocket در Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  token Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout مربوط به status/health snapshot.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  lookup بسته پایداری persist‌شده را رد کنید.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه، و manifest را به‌صورت JSON چاپ کنید.
</ParamField>

export شامل یک manifest، یک خلاصه Markdown، شکل پیکربندی، جزئیات پیکربندی sanitized، خلاصه‌های گزارش sanitized، snapshotهای status/health مربوط به Gateway به‌صورت sanitized، و جدیدترین bundle پایداری در صورت وجود است.

برای اشتراک‌گذاری در نظر گرفته شده است. جزئیات عملیاتی مفید برای debugging را نگه می‌دارد، مانند فیلدهای ایمن گزارش OpenClaw، نام زیرسیستم‌ها، status codeها، مدت‌زمان‌ها، حالت‌های پیکربندی‌شده، درگاه‌ها، plugin idها، provider idها، تنظیمات feature غیرمحرمانه، و پیام‌های گزارش عملیاتی redact‌شده. متن chat، بدنه‌های webhook، خروجی‌های ابزار، اعتبارنامه‌ها، cookieها، شناسه‌های account/message، متن prompt/instruction، hostnameها، و مقادیر secret را حذف یا redact می‌کند. وقتی یک پیام به سبک LogTape شبیه متن payload کاربر/chat/tool باشد، export فقط این را نگه می‌دارد که یک پیام حذف شده است به‌همراه شمار byte آن.

### `gateway status`

`gateway status` سرویس Gateway (launchd/systemd/schtasks) به‌علاوه یک probe اختیاری برای قابلیت اتصال/احراز هویت را نمایش می‌دهد.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  یک مقصد صریح برای بررسی اضافه کنید. ریموت پیکربندی‌شده + localhost همچنان بررسی می‌شوند.
</ParamField>
<ParamField path="--token <token>" type="string">
  احراز هویت با توکن برای بررسی.
</ParamField>
<ParamField path="--password <password>" type="string">
  احراز هویت با رمز عبور برای بررسی.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  زمان انقضای بررسی.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  بررسی اتصال را رد کنید (نمای فقط سرویس).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را هم اسکن کنید.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  بررسی اتصال پیش‌فرض را به بررسی خواندن ارتقا می‌دهد و وقتی آن بررسی خواندن شکست بخورد با کد غیرصفر خارج می‌شود. نمی‌تواند با `--no-probe` ترکیب شود.
</ParamField>

<AccordionGroup>
  <Accordion title="معناشناسی وضعیت">
    - `gateway status` حتی وقتی پیکربندی CLI محلی وجود ندارد یا نامعتبر است، برای عیب‌یابی در دسترس می‌ماند.
    - `gateway status` پیش‌فرض وضعیت سرویس، اتصال WebSocket، و قابلیت احراز هویت قابل مشاهده در زمان دست‌دهی را اثبات می‌کند. عملیات خواندن/نوشتن/ادمین را اثبات نمی‌کند.
    - بررسی‌های عیب‌یابی برای احراز هویت اولین‌باره دستگاه، بدون تغییر هستند: وقتی توکن دستگاه کش‌شده موجود باشد از همان استفاده می‌کنند، اما فقط برای بررسی وضعیت، هویت دستگاه CLI جدید یا رکورد جفت‌سازی دستگاه فقط‌خواندنی ایجاد نمی‌کنند.
    - `gateway status` تا حد امکان SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت بررسی resolve می‌کند.
    - اگر یک SecretRef احراز هویت لازم در این مسیر فرمان resolve نشود، `gateway status --json` وقتی اتصال/احراز هویت بررسی شکست بخورد `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریح پاس دهید یا ابتدا منبع secret را resolve کنید.
    - اگر بررسی موفق شود، هشدارهای auth-ref resolveنشده برای جلوگیری از مثبت کاذب سرکوب می‌شوند.
    - وقتی یک سرویس در حال گوش‌دادن کافی نیست و لازم است فراخوانی‌های RPC با محدوده خواندن هم سالم باشند، در اسکریپت‌ها و اتوماسیون از `--require-rpc` استفاده کنید.
    - `--deep` یک اسکن best-effort برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه Gateway شناسایی شوند، خروجی انسانی راهنمای پاک‌سازی را چاپ می‌کند و هشدار می‌دهد که بیشتر راه‌اندازی‌ها باید روی هر ماشین یک Gateway اجرا کنند.
    - `--deep` همچنین وقتی فرایند سرویس برای restart توسط supervisor خارجی به‌صورت تمیز خارج شده باشد، handoff اخیر restart supervisor Gateway را گزارش می‌کند.
    - خروجی انسانی مسیر فایل log resolveشده به‌همراه snapshot مسیرها/اعتبار پیکربندی CLI در برابر سرویس را شامل می‌شود تا به عیب‌یابی drift پروفایل یا state-dir کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های drift احراز هویت systemd در Linux">
    - در نصب‌های systemd روی Linux، بررسی‌های drift احراز هویت سرویس مقدارهای `Environment=` و `EnvironmentFile=` را از unit می‌خوانند (از جمله `%h`، مسیرهای نقل‌قول‌شده، چندین فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift با استفاده از env زمان اجرای ادغام‌شده (ابتدا env فرمان سرویس، سپس fallback به env فرایند)، SecretRefهای `gateway.auth.token` را resolve می‌کنند.
    - اگر احراز هویت توکنی عملا فعال نباشد (`gateway.auth.mode` صریح با مقدار `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد در حالتی که password می‌تواند برنده شود و هیچ token candidate نمی‌تواند برنده شود)، بررسی‌های token-drift از resolve پیکربندی توکن صرف‌نظر می‌کنند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` فرمان «اشکال‌زدایی همه‌چیز» است. همیشه این موارد را بررسی می‌کند:

- Gateway ریموت پیکربندی‌شده شما (اگر تنظیم شده باشد)، و
- localhost (loopback) **حتی اگر ریموت پیکربندی شده باشد**.

اگر `--url` را پاس دهید، آن مقصد صریح جلوتر از هر دو اضافه می‌شود. خروجی انسانی مقصدها را این‌گونه برچسب‌گذاری می‌کند:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند Gateway قابل دسترسی باشند، همه آن‌ها را چاپ می‌کند. وقتی از پروفایل‌ها/portهای ایزوله استفاده می‌کنید (مثلا یک bot نجات)، چند Gateway پشتیبانی می‌شود، اما بیشتر نصب‌ها همچنان یک Gateway واحد اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی حداقل یک مقصد اتصال WebSocket را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌کند بررسی چه چیزی را درباره احراز هویت توانست اثبات کند. این از قابلیت دسترسی جدا است.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با محدوده خواندن (`health`/`status`/`system-presence`/`config.get`) هم موفق شدند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق شد اما RPC با محدوده خواندن محدود است. این به‌عنوان قابلیت دسترسی **تنزل‌یافته** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` بعد از `Connect: ok` یعنی Gateway اتصال WebSocket را پذیرفت، اما عیب‌یابی‌های خواندن بعدی timeout شدند یا شکست خوردند. این هم قابلیت دسترسی **تنزل‌یافته** است، نه Gateway غیرقابل دسترسی.
    - مانند `gateway status`، probe از احراز هویت دستگاه کش‌شده موجود استفاده می‌کند اما هویت دستگاه اولین‌باره یا state جفت‌سازی ایجاد نمی‌کند.
    - کد خروجی فقط وقتی غیرصفر است که هیچ مقصد بررسی‌شده‌ای قابل دسترسی نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالا:

    - `ok`: حداقل یک مقصد قابل دسترسی است.
    - `degraded`: حداقل یک مقصد اتصال را پذیرفته اما عیب‌یابی‌های RPC جزئیات کامل را تکمیل نکرده است.
    - `capability`: بهترین قابلیتی که در مقصدهای قابل دسترسی دیده شده است (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین مقصدی که باید به‌عنوان برنده فعال در این ترتیب در نظر گرفته شود: URL صریح، تونل SSH، ریموت پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار best-effort با `code`، `message`، و `targetIds` اختیاری.
    - `network`: راهنماهای URL مربوط به local loopback/tailnet مشتق‌شده از پیکربندی فعلی و شبکه میزبان.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجه واقعی discovery که برای این نوبت بررسی استفاده شده است.

    برای هر مقصد (`targets[].connect`):

    - `ok`: قابلیت دسترسی پس از اتصال + طبقه‌بندی تنزل‌یافته.
    - `rpcOk`: موفقیت RPC جزئیات کامل.
    - `scopeLimited`: RPC جزئیات به دلیل نبود scope اپراتور شکست خورد.

    برای هر مقصد (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok` در صورت موجود بودن.
    - `scopes`: scopeهای اعطاشده گزارش‌شده در `hello-ok` در صورت موجود بودن.
    - `capability`: طبقه‌بندی قابلیت احراز هویت نمایش‌داده‌شده برای آن مقصد.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی تونل SSH شکست خورد؛ فرمان به بررسی‌های مستقیم fallback کرد.
    - `multiple_gateways`: بیش از یک مقصد قابل دسترسی بود؛ این غیرمعمول است مگر اینکه عمدا پروفایل‌های ایزوله، مانند یک bot نجات، اجرا کنید.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای یک مقصد شکست‌خورده resolve نشد.
    - `probe_scope_limited`: اتصال WebSocket موفق شد، اما بررسی خواندن به دلیل نبود `operator.read` محدود شد.

  </Accordion>
</AccordionGroup>

#### ریموت از طریق SSH (هم‌ارزی با برنامه Mac)

حالت «ریموت از طریق SSH» در برنامه macOS از یک port-forward محلی استفاده می‌کند تا Gateway ریموت (که ممکن است فقط به loopback bind شده باشد) در `ws://127.0.0.1:<port>` قابل دسترسی شود.

معادل CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` یا `user@host:port` (port به‌صورت پیش‌فرض `22` است).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  فایل identity.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  اولین میزبان Gateway کشف‌شده را به‌عنوان مقصد SSH از endpoint کشف resolveشده انتخاب کنید (`local.` به‌علاوه دامنه wide-area پیکربندی‌شده، در صورت وجود). راهنماهای فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، استفاده‌شده به‌عنوان پیش‌فرض):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

ابزار کمکی RPC سطح پایین.

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
  رمز عبور Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  بودجه timeout.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  عمدتا برای RPCهای سبک agent که رویدادهای میانی را پیش از payload نهایی stream می‌کنند.
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

وقتی سرویس مدیریت‌شده باید از طریق executable دیگری شروع شود، مثلا یک shim مدیر secrets یا یک ابزار run-as، از `--wrapper` استفاده کنید. wrapper آرگومان‌های عادی Gateway را دریافت می‌کند و مسئول است در نهایت با همان آرگومان‌ها `openclaw` یا Node را exec کند.

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

همچنین می‌توانید wrapper را از طریق environment تنظیم کنید. `gateway install` اعتبارسنجی می‌کند که مسیر یک فایل executable باشد، wrapper را در `ProgramArguments` سرویس می‌نویسد، و `OPENCLAW_WRAPPER` را برای reinstallهای اجباری، updateها، و repairهای doctor بعدی در environment سرویس persist می‌کند.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

برای حذف wrapper persistشده، هنگام reinstall کردن `OPENCLAW_WRAPPER` را پاک کنید:

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
    - برای راه‌اندازی مجدد یک سرویس مدیریت‌شده، از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین راه‌اندازی مجدد به‌صورت زنجیره‌ای اجرا نکنید.
    - در macOS، `gateway stop` به‌طور پیش‌فرض از `launchctl bootout` استفاده می‌کند، که LaunchAgent را از نشست بوت فعلی حذف می‌کند بدون اینکه غیرفعال‌سازی را پایدار کند — بازیابی خودکار KeepAlive برای خرابی‌های آینده فعال می‌ماند و `gateway start` بدون نیاز به `launchctl enable` دستی، دوباره به‌صورت تمیز فعال می‌شود. برای جلوگیری پایدار از KeepAlive و RunAtLoad، گزینه `--disable` را بدهید تا gateway تا اجرای صریح بعدی `gateway start` دوباره اجرا نشود؛ زمانی از این گزینه استفاده کنید که توقف دستی باید پس از راه‌اندازی‌های مجدد یا ری‌استارت‌های سیستم نیز باقی بماند.
    - `gateway restart --safe` از Gateway در حال اجرا می‌خواهد کارهای فعال OpenClaw را از پیش بررسی کند و راه‌اندازی مجدد را تا تخلیه تحویل پاسخ، اجراهای تعبیه‌شده، و اجراهای وظیفه به تعویق بیندازد. `--safe` را نمی‌توان با `--force` یا `--wait` ترکیب کرد.
    - `gateway restart --wait 30s` بودجه تخلیه راه‌اندازی مجدد پیکربندی‌شده را برای همان راه‌اندازی مجدد بازنویسی می‌کند. عددهای بدون واحد بر حسب میلی‌ثانیه هستند؛ واحدهایی مانند `s`، `m` و `h` پذیرفته می‌شوند. `--wait 0` به‌صورت نامحدود منتظر می‌ماند.
    - `gateway restart --safe --skip-deferral` راه‌اندازی مجدد ایمن و آگاه از OpenClaw را اجرا می‌کند، اما دروازه تعویق را دور می‌زند تا Gateway حتی وقتی مسدودکننده‌ها گزارش شده‌اند، راه‌اندازی مجدد را بلافاصله صادر کند. این یک راه خروج اپراتور برای تعویق‌های گیرکرده ناشی از اجرای وظیفه است؛ به `--safe` نیاز دارد.
    - `gateway restart --force` تخلیه کار فعال را رد می‌کند و بلافاصله راه‌اندازی مجدد را انجام می‌دهد. زمانی از آن استفاده کنید که اپراتور مسدودکننده‌های وظیفه فهرست‌شده را قبلاً بررسی کرده و می‌خواهد gateway همین حالا برگردد.
    - فرمان‌های چرخه حیات `--json` را برای اسکریپت‌نویسی می‌پذیرند.

  </Accordion>
  <Accordion title="احراز هویت و SecretRefها در زمان نصب">
    - وقتی احراز هویت توکنی به توکن نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `gateway install` بررسی می‌کند که SecretRef قابل حل باشد، اما توکن حل‌شده را در فراداده محیط سرویس پایدار نمی‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، نصب به‌صورت بسته شکست می‌خورد، نه اینکه متن ساده جایگزین را پایدار کند.
    - برای احراز هویت گذرواژه در `gateway run`، به‌جای `--password` درون‌خطی، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file`، یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
    - در حالت احراز هویت استنباط‌شده، `OPENCLAW_GATEWAY_PASSWORD` فقط در پوسته الزامات توکن نصب را کاهش نمی‌دهد؛ هنگام نصب یک سرویس مدیریت‌شده از پیکربندی پایدار (`gateway.auth.password` یا `env` پیکربندی) استفاده کنید.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که حالت به‌صراحت تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف gatewayها (Bonjour)

`gateway discover` به‌دنبال بیکن‌های Gateway (`_openclaw-gw._tcp`) اسکن می‌کند.

- DNS-SD چندپخشی: `local.`
- DNS-SD تک‌پخشی (Bonjour گستره‌وسیع): یک دامنه انتخاب کنید (مثال: `openclaw.internal.`) و split DNS + یک سرور DNS راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط gatewayهایی که کشف Bonjour را فعال کرده‌اند (پیش‌فرض) بیکن را تبلیغ می‌کنند.

رکوردهای کشف گستره‌وسیع شامل این موارد هستند (TXT):

- `role` (راهنمای نقش gateway)
- `transport` (راهنمای انتقال، مثلاً `gateway`)
- `gatewayPort` (درگاه WebSocket، معمولاً `18789`)
- `sshPort` (اختیاری؛ وقتی وجود نداشته باشد، کلاینت‌ها هدف‌های SSH را به‌طور پیش‌فرض `22` در نظر می‌گیرند)
- `tailnetDns` (نام میزبان MagicDNS، وقتی در دسترس باشد)
- `gatewayTls` / `gatewayTlsSha256` (TLS فعال + اثرانگشت گواهی)
- `cliPath` (راهنمای نصب از راه دور که در ناحیه گستره‌وسیع نوشته می‌شود)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلت زمانی هر فرمان (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن برای ماشین (همچنین استایل‌دهی/چرخنده را غیرفعال می‌کند).
</ParamField>

مثال‌ها:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI وقتی دامنه گستره‌وسیع پیکربندی‌شده‌ای فعال باشد، `local.` را به‌همراه آن دامنه اسکن می‌کند.
- `wsUrl` در خروجی JSON از نقطه پایانی سرویس حل‌شده مشتق می‌شود، نه از راهنماهای فقط TXT مانند `lanHost` یا `tailnetDns`.
- در mDNS مربوط به `local.`، `sshPort` و `cliPath` فقط وقتی پخش می‌شوند که `discovery.mdns.mode` برابر `full` باشد. DNS-SD گستره‌وسیع همچنان `cliPath` را می‌نویسد؛ `sshPort` آنجا نیز اختیاری می‌ماند.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
