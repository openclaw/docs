---
read_when:
    - اجرا یا اشکال‌زدایی فرایند Gateway
summary: راهنمای عملیاتی سرویس Gateway، چرخهٔ حیات و عملیات آن
title: راهنمای عملیاتی Gateway
x-i18n:
    generated_at: "2026-07-16T16:53:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

از این صفحه برای راه‌اندازی روز اول و عملیات روز دوم سرویس Gateway استفاده کنید.

<CardGroup cols={2}>
  <Card title="عیب‌یابی عمیق" icon="siren" href="/fa/gateway/troubleshooting">
    عیب‌یابی مبتنی بر نشانه‌ها با زنجیره‌های دقیق فرمان و امضاهای گزارش.
  </Card>
  <Card title="پیکربندی" icon="sliders" href="/fa/gateway/configuration">
    راهنمای راه‌اندازی وظیفه‌محور + مرجع کامل پیکربندی.
  </Card>
  <Card title="مدیریت اسرار" icon="key-round" href="/fa/gateway/secrets">
    قرارداد SecretRef، رفتار عکس فوری زمان اجرا و عملیات مهاجرت/بارگذاری مجدد.
  </Card>
  <Card title="قرارداد طرح اسرار" icon="shield-check" href="/fa/gateway/secrets-plan-contract">
    قواعد دقیق هدف/مسیر `secrets apply` و رفتار نمایه احراز هویت فقط‌ارجاعی.
  </Card>
</CardGroup>

## راه‌اندازی محلی ۵دقیقه‌ای

<Steps>
  <Step title="راه‌اندازی Gateway">

```bash
openclaw gateway --port 18789
# اشکال‌زدایی/ردیابی در stdio بازتاب داده می‌شود
openclaw gateway --port 18789 --verbose
# شنونده روی درگاه انتخاب‌شده را به‌اجبار خاتمه دهید، سپس راه‌اندازی کنید
openclaw gateway --force
```

  </Step>

  <Step title="بررسی سلامت سرویس">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

خط پایه سالم: `Runtime: running`، `Connectivity probe: ok` و یک خط `Capability` که با انتظار شما مطابقت دارد. از `openclaw gateway status --require-rpc` برای اثبات RPC با دامنه خواندن استفاده کنید، نه صرفاً دسترسی‌پذیری.

  </Step>

  <Step title="اعتبارسنجی آمادگی کانال">

```bash
openclaw channels status --probe
```

با یک Gateway دردسترس، این فرمان کاوش‌های زنده کانال را برای هر حساب و ممیزی‌های اختیاری اجرا می‌کند. اگر Gateway دردسترس نباشد، CLI به خلاصه‌های کانال صرفاً مبتنی بر پیکربندی بازمی‌گردد.

  </Step>
</Steps>

<Note>
بارگذاری مجدد پیکربندی Gateway مسیر فایل پیکربندی فعال را پایش می‌کند (که از پیش‌فرض‌های نمایه/وضعیت یا در صورت تنظیم از `OPENCLAW_CONFIG_PATH` استخراج می‌شود). حالت پیش‌فرض `gateway.reload.mode="hybrid"` است. پس از نخستین بارگذاری موفق، فرایند در حال اجرا عکس فوری فعال پیکربندی درون حافظه را ارائه می‌کند؛ بارگذاری مجدد موفق آن عکس فوری را به‌صورت اتمی جایگزین می‌کند.
</Note>

## مدل زمان اجرا

- یک فرایند همیشه‌فعال برای مسیریابی، صفحه کنترل و اتصال‌های کانال.
- یک درگاه چندگانه واحد برای:
  - کنترل/RPC مبتنی بر WebSocket
  - APIهای HTTP ‏(`/v1/models`، `/v1/embeddings`، `/v1/chat/completions`، `/v1/responses`، `/tools/invoke`)
  - مسیرهای HTTP مربوط به Plugin، مانند `/api/v1/admin/rpc` اختیاری
  - رابط کاربری کنترل و هوک‌ها
- حالت اتصال پیش‌فرض: `loopback`. درون یک محیط کانتینری شناسایی‌شده، پیش‌فرض مؤثر `auto` است (برای هدایت درگاه به `0.0.0.0` تفکیک می‌شود)، مگر اینکه سرویس‌دهی/تونل Tailscale فعال باشد که همیشه `loopback` را تحمیل می‌کند.
- احراز هویت به‌طور پیش‌فرض الزامی است. راه‌اندازی‌های مبتنی بر راز مشترک از `gateway.auth.token` / `gateway.auth.password` (یا `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) استفاده می‌کنند و راه‌اندازی‌های پراکسی معکوس غیرحلقه‌بازگشتی می‌توانند از `gateway.auth.mode: "trusted-proxy"` استفاده کنند.

## نقاط پایانی سازگار با OpenAI

اثرگذارترین سطح سازگاری OpenClaw:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

چرا این مجموعه مهم است:

- بیشتر یکپارچه‌سازی‌های Open WebUI، LobeChat و LibreChat ابتدا `/v1/models` را کاوش می‌کنند.
- بسیاری از خط‌لوله‌های RAG و حافظه انتظار `/v1/embeddings` را دارند.
- کلاینت‌های بومی عامل، به‌طور فزاینده‌ای `/v1/responses` را ترجیح می‌دهند.

`/v1/models` عامل‌محور است: برای هر عامل پیکربندی‌شده، `openclaw`، `openclaw/default` و `openclaw/<agentId>` را بازمی‌گرداند. `openclaw/default` نام مستعار پایداری است که همیشه به عامل پیش‌فرض پیکربندی‌شده نگاشت می‌شود. وقتی می‌خواهید ارائه‌دهنده/مدل پشتیبان را بازنویسی کنید، `x-openclaw-model` را ارسال کنید؛ در غیر این صورت، مدل عادی و تنظیمات تعبیه‌سازی عامل انتخاب‌شده کنترل را در دست خواهند داشت.

همه این موارد روی درگاه اصلی Gateway اجرا می‌شوند و از همان مرز احراز هویت اپراتور مورد اعتماد سایر بخش‌های API ‏HTTP ‏Gateway استفاده می‌کنند.

RPC مدیریتی HTTP ‏(`POST /api/v1/admin/rpc`) یک مسیر جداگانه و پیش‌فرض‌غیرفعال Plugin برای ابزارهای میزبان است که نمی‌توانند از RPC مبتنی بر WebSocket استفاده کنند. به [RPC مدیریتی HTTP](/fa/plugins/admin-http-rpc) مراجعه کنید.

### اولویت درگاه و اتصال

| تنظیم      | ترتیب تفکیک                                                     |
| ------------ | -------------------------------------------------------------------- |
| درگاه Gateway | `--port` ← `OPENCLAW_GATEWAY_PORT` ← `gateway.port` ← `18789`        |
| حالت اتصال    | CLI/بازنویسی ← `gateway.bind` ← `loopback` (یا `auto` در کانتینرها) |

سرویس‌های Gateway نصب‌شده، `--port` تفکیک‌شده را در فراداده ناظر ثبت می‌کنند. پس از تغییر `gateway.port`، فرمان `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا کنید تا launchd/systemd/schtasks فرایند را روی درگاه جدید راه‌اندازی کند.

راه‌اندازی Gateway هنگام مقداردهی اولیه مبدأهای محلی رابط کاربری کنترل برای اتصال‌های غیرحلقه‌بازگشتی، از همان درگاه و اتصال مؤثر استفاده می‌کند. برای نمونه، `--bind lan --port 3000` پیش از اجرای اعتبارسنجی زمان اجرا، `http://localhost:3000` و `http://127.0.0.1:3000` را مقداردهی اولیه می‌کند. هر مبدأ مرورگر راه‌دور، مانند URLهای پراکسی HTTPS، را صریحاً به `gateway.controlUi.allowedOrigins` اضافه کنید.

### حالت‌های بارگذاری مجدد داغ

| `gateway.reload.mode` | رفتار                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | بدون بارگذاری مجدد پیکربندی                           |
| `hot`                 | فقط تغییرات ایمن برای اعمال داغ را اعمال می‌کند                |
| `restart`             | هنگام تغییرات نیازمند بارگذاری مجدد، راه‌اندازی مجدد می‌کند         |
| `hybrid` (پیش‌فرض)    | در صورت ایمن بودن به‌صورت داغ اعمال می‌کند و در صورت نیاز راه‌اندازی مجدد می‌کند |

## مجموعه فرمان‌های اپراتور

```bash
openclaw gateway status
openclaw gateway status --deep   # یک پویش سرویس در سطح سیستم اضافه می‌کند
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` برای کشف بیشتر سرویس‌ها (LaunchDaemonها/واحدهای سیستمی systemd‏/schtasks) است، نه کاوش عمیق‌تر سلامت RPC.

## چند Gateway (روی یک میزبان)

بیشتر نصب‌ها باید روی هر دستگاه یک Gateway اجرا کنند. یک Gateway واحد می‌تواند میزبان چند عامل و کانال باشد. تنها زمانی به چند Gateway نیاز دارید که عمداً خواهان جداسازی یا یک ربات نجات باشید.

بررسی‌های مفید:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

آنچه باید انتظار داشت:

- `gateway status --deep` می‌تواند `Other gateway-like services detected (best effort)` را گزارش کند و هنگامی که نصب‌های قدیمی launchd/systemd/schtasks همچنان باقی هستند، راهنمای پاک‌سازی نمایش دهد.
- `gateway probe` می‌تواند درباره `multiple reachable gateway identities` هشدار دهد؛ هنگامی که Gatewayهای متمایز پاسخ می‌دهند یا OpenClaw نمی‌تواند اثبات کند اهداف دردسترس همان Gateway هستند. یک تونل SSH، نشانی پراکسی یا نشانی راه‌دور پیکربندی‌شده به همان Gateway، حتی وقتی درگاه‌های انتقال متفاوت‌اند، یک Gateway با چند انتقال محسوب می‌شود.
- اگر این کار عمدی است، درگاه‌ها، پیکربندی/وضعیت و ریشه‌های فضای کاری را برای هر Gateway جدا کنید.

فهرست بررسی برای هر نمونه:

- `gateway.port` یکتا
- `OPENCLAW_CONFIG_PATH` یکتا
- `OPENCLAW_STATE_DIR` یکتا
- `agents.defaults.workspace` یکتا

نمونه:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

راه‌اندازی تفصیلی: [/gateway/multiple-gateways](/fa/gateway/multiple-gateways).

## دسترسی راه‌دور

ترجیحی: Tailscale/VPN.
جایگزین: تونل SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

سپس کلاینت‌ها را به‌صورت محلی به `ws://127.0.0.1:18789` متصل کنید.

<Warning>
تونل‌های SSH احراز هویت Gateway را دور نمی‌زنند. برای احراز هویت مبتنی بر راز مشترک، کلاینت‌ها حتی از طریق تونل همچنان
باید `token`/`password` را ارسال کنند. برای حالت‌های حامل هویت،
درخواست همچنان باید آن مسیر احراز هویت را برآورده کند.
</Warning>

مراجعه کنید به: [Gateway راه‌دور](/fa/gateway/remote)، [احراز هویت](/fa/gateway/authentication)، [Tailscale](/fa/gateway/tailscale).

## نظارت و چرخه عمر سرویس

برای قابلیت اطمینان مشابه محیط عملیاتی، از اجراهای تحت نظارت استفاده کنید.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

برای راه‌اندازی مجدد از `openclaw gateway restart` استفاده کنید. از زنجیره کردن `openclaw gateway stop` و `openclaw gateway start` به‌عنوان جایگزین راه‌اندازی مجدد خودداری کنید.

در macOS، ‏`gateway stop` به‌طور پیش‌فرض از `launchctl bootout` استفاده می‌کند. این کار LaunchAgent را بدون ثبت غیرفعال‌سازی پایدار از نشست راه‌اندازی فعلی حذف می‌کند؛ بنابراین بازیابی خودکار KeepAlive پس از خرابی‌های غیرمنتظره همچنان کار می‌کند و `gateway start` به‌طور پاک دوباره فعال می‌شود. برای جلوگیری پایدار از ایجاد مجدد خودکار در راه‌اندازی‌های مجدد سیستم، `--disable` را ارسال کنید: `openclaw gateway stop --disable`.

برچسب‌های LaunchAgent عبارت‌اند از `ai.openclaw.gateway` (پیش‌فرض) یا `ai.openclaw.<profile>` (نمایه نام‌گذاری‌شده). `openclaw doctor` انحراف پیکربندی سرویس را ممیزی و ترمیم می‌کند.

  </Tab>

  <Tab title="Linux (کاربر systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

برای ماندگاری پس از خروج، lingering را فعال کنید:

```bash
sudo loginctl enable-linger $(whoami)
```

در یک سرور بدون رابط گرافیکی و فاقد نشست دسکتاپ، پیش از تلاش مجدد برای فرمان‌های `systemctl --user`، مطمئن شوید `XDG_RUNTIME_DIR` نیز تنظیم شده است (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`).

نمونه واحد کاربری دستی برای زمانی که به مسیر نصب سفارشی نیاز دارید:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (بومی)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

راه‌اندازی مدیریت‌شده بومی Windows از یک Scheduled Task با نام `OpenClaw Gateway`
(یا `OpenClaw Gateway (<profile>)` برای نمایه‌های نام‌گذاری‌شده) استفاده می‌کند. اگر ایجاد Scheduled Task
رد شود، OpenClaw به یک راه‌انداز پوشه Startup برای هر کاربر بازمی‌گردد
که به `gateway.cmd` درون پوشه وضعیت اشاره می‌کند.

  </Tab>

  <Tab title="Linux (سرویس سیستم)">

برای میزبان‌های چندکاربره/همیشه‌فعال از یک واحد سیستمی استفاده کنید.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

از همان بدنه سرویس واحد کاربری استفاده کنید، اما آن را زیر
`/etc/systemd/system/openclaw-gateway[-<profile>].service` نصب کنید و اگر فایل اجرایی `openclaw` شما در محل دیگری قرار دارد،
`ExecStart=` را تنظیم کنید.

همچنین اجازه ندهید `openclaw doctor --fix` برای همان نمایه/درگاه، یک سرویس Gateway در سطح کاربر نصب کند. Doctor وقتی یک سرویس Gateway ‏OpenClaw در سطح سیستم پیدا کند، از آن نصب خودکار خودداری می‌کند؛ هنگامی که واحد سیستم مالک چرخه عمر است، از `OPENCLAW_SERVICE_REPAIR_POLICY=external` استفاده کنید.

  </Tab>
</Tabs>

خطاهای پیکربندی نامعتبر با کد `78` خارج می‌شوند. واحدهای systemd لینوکس از `RestartPreventExitStatus=78` استفاده می‌کنند تا تا زمان اصلاح پیکربندی، راه‌اندازی مجدد را متوقف کنند. launchd و Windows Task Scheduler قانون توقف معادل برای هر کد خروج ندارند؛ بنابراین Gateway تاریخچه راه‌اندازی‌های سریع و ناپاک را نیز پایدار ذخیره می‌کند و پس از شکست‌های مکرر راه‌اندازی، شروع خودکار حساب کانال/ارائه‌دهنده را سرکوب می‌کند. در آن حالت ایمن، صفحه کنترل همچنان برای بازرسی و ترمیم راه‌اندازی می‌شود، بارگذاری‌های مجدد داغ پیکربندی و `secrets.reload` از راه‌اندازی مجدد خودکار کانال‌ها خودداری می‌کنند و یک درخواست صریح اپراتور با `channels.start` می‌تواند این سرکوب را نادیده بگیرد.

## مسیر سریع نمایه توسعه

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

پیش‌فرض‌ها شامل وضعیت/پیکربندی جداشده و درگاه پایه Gateway با مقدار `19001` هستند.

## مرجع سریع پروتکل (دید اپراتور)

- نخستین فریم کلاینت باید `connect` باشد.
- Gateway یک فریم `hello-ok` را همراه با یک `snapshot` ‏(`presence`، `health`، `stateVersion`، `uptimeMs`) به‌علاوه محدودیت‌های `policy` ‏(`maxPayload`، `maxBufferedBytes`، `tickIntervalMs`) بازمی‌گرداند.
- `hello-ok.features.methods` / `events` یک فهرست محافظه‌کارانه برای کشف هستند، نه
  خروجی تولیدشده‌ای از تمام مسیرهای کمکی قابل فراخوانی.
- درخواست‌ها: `req(method, params)` → `res(ok/payload|error)`.
- رویدادهای رایج شامل `connect.challenge`، `agent`، `chat`،
  `session.message`، `session.operation`، `session.tool`، رویدادهای اختیاری
  `session.approval`، `sessions.changed`، `presence`، `tick`، `health`،
  `heartbeat`، رویدادهای چرخه عمر جفت‌سازی/تأیید و `shutdown` هستند.

اجرای عامل‌ها دو مرحله دارد:

1. تأیید پذیرش فوری (`status:"accepted"`)
2. پاسخ نهایی تکمیل (`status:"ok"|"error"`)، با رویدادهای جریانی `agent` در فاصله میان آن‌ها.

مستندات کامل پروتکل را ببینید: [پروتکل Gateway](/fa/gateway/protocol).

## بررسی‌های عملیاتی

### زنده‌بودن

- یک WS باز کنید و `connect` را ارسال کنید.
- انتظار پاسخ `hello-ok` همراه با اسنپ‌شات را داشته باشید.

### آمادگی

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### بازیابی شکاف

رویدادها بازپخش نمی‌شوند. در صورت وجود شکاف در توالی، پیش از ادامه وضعیت را تازه‌سازی کنید (`health`، `system-presence`).

## نشانه‌های رایج خرابی

| نشانه                                                          | مشکل احتمالی                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | اتصال به آدرسی غیر از loopback بدون مسیر احراز هویت معتبر Gateway                           |
| `another gateway instance is already listening` / `EADDRINUSE` | تداخل پورت                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | پیکربندی روی حالت راه‌دور تنظیم شده است، یا `gateway.mode` در یک پیکربندی آسیب‌دیده وجود ندارد |
| `unauthorized` هنگام اتصال                                  | عدم تطابق احراز هویت میان کلاینت و Gateway                                      |

برای مراحل کامل تشخیص، از [عیب‌یابی Gateway](/fa/gateway/troubleshooting) استفاده کنید.

## تضمین‌های ایمنی

- کلاینت‌های پروتکل Gateway هنگامی که Gateway در دسترس نیست، به‌سرعت شکست می‌خورند (بدون بازگشت ضمنی به کانال مستقیم).
- فریم‌های نخست نامعتبر یا غیراتصالی رد می‌شوند و اتصال بسته می‌شود.
- خاموش‌سازی صحیح، پیش از بسته‌شدن سوکت رویداد `shutdown` را منتشر می‌کند.

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
- [فرایند پس‌زمینه](/fa/gateway/background-process)
- [سلامت](/fa/gateway/health)
- [Doctor](/fa/gateway/doctor)
- [احراز هویت](/fa/gateway/authentication)
- [دسترسی راه‌دور](/fa/gateway/remote)
- [مدیریت اسرار](/fa/gateway/secrets)
