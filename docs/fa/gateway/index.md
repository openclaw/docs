---
read_when:
    - اجرای فرایند Gateway یا اشکال‌زدایی آن
summary: راهنمای عملیاتی سرویس Gateway، چرخهٔ حیات و عملیات
title: راهنمای عملیاتی Gateway
x-i18n:
    generated_at: "2026-04-29T22:52:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

از این صفحه برای راه‌اندازی روز اول و عملیات روز دوم سرویس Gateway استفاده کنید.

<CardGroup cols={2}>
  <Card title="عیب‌یابی عمیق" icon="siren" href="/fa/gateway/troubleshooting">
    عیب‌یابی بر اساس نشانه‌ها، همراه با نردبان‌های دقیق فرمان و امضاهای لاگ.
  </Card>
  <Card title="پیکربندی" icon="sliders" href="/fa/gateway/configuration">
    راهنمای راه‌اندازی وظیفه‌محور + مرجع کامل پیکربندی.
  </Card>
  <Card title="مدیریت اسرار" icon="key-round" href="/fa/gateway/secrets">
    قرارداد SecretRef، رفتار اسنپ‌شات زمان اجرا، و عملیات migrate/reload.
  </Card>
  <Card title="قرارداد برنامه اسرار" icon="shield-check" href="/fa/gateway/secrets-plan-contract">
    قوانین دقیق هدف/مسیر `secrets apply` و رفتار auth-profile فقط-ارجاعی.
  </Card>
</CardGroup>

## راه‌اندازی محلی ۵ دقیقه‌ای

<Steps>
  <Step title="Gateway را شروع کنید">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="سلامت سرویس را بررسی کنید">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

خط پایه سالم: `Runtime: running`، `Connectivity probe: ok`، و `Capability: ...` که با انتظار شما مطابقت دارد. وقتی به اثبات RPC با دامنه خواندن نیاز دارید، نه فقط دسترس‌پذیری، از `openclaw gateway status --require-rpc` استفاده کنید.

  </Step>

  <Step title="آمادگی کانال را اعتبارسنجی کنید">

```bash
openclaw channels status --probe
```

با یک gateway قابل دسترسی، این فرمان probeهای زنده کانال برای هر حساب و auditهای اختیاری را اجرا می‌کند.
اگر gateway قابل دسترسی نباشد، CLI به‌جای خروجی probe زنده، به خلاصه‌های کانال فقط-پیکربندی برمی‌گردد.

  </Step>
</Steps>

<Note>
بارگذاری مجدد پیکربندی Gateway مسیر فایل پیکربندی فعال را پایش می‌کند (که از پیش‌فرض‌های profile/state، یا وقتی تنظیم شده باشد از `OPENCLAW_CONFIG_PATH`، resolve می‌شود).
حالت پیش‌فرض `gateway.reload.mode="hybrid"` است.
پس از نخستین بارگذاری موفق، فرایند در حال اجرا اسنپ‌شات پیکربندی فعال در حافظه را سرو می‌کند؛ بارگذاری مجدد موفق آن اسنپ‌شات را به‌صورت اتمیک جایگزین می‌کند.
</Note>

## مدل زمان اجرا

- یک فرایند همیشه‌روشن برای مسیریابی، صفحه کنترل، و اتصال‌های کانال.
- یک پورت multiplexed واحد برای:
  - کنترل/RPC از طریق WebSocket
  - APIهای HTTP، سازگار با OpenAI (`/v1/models`، `/v1/embeddings`، `/v1/chat/completions`، `/v1/responses`، `/tools/invoke`)
  - UI کنترل و hookها
- حالت bind پیش‌فرض: `loopback`.
- احراز هویت به‌صورت پیش‌فرض الزامی است. راه‌اندازی‌های secret مشترک از
  `gateway.auth.token` / `gateway.auth.password` (یا
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) استفاده می‌کنند، و راه‌اندازی‌های reverse-proxy غیر-loopback
  می‌توانند از `gateway.auth.mode: "trusted-proxy"` استفاده کنند.

## endpointهای سازگار با OpenAI

سطح سازگاری با بیشترین اهرم OpenClaw اکنون این است:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

چرا این مجموعه مهم است:

- بیشتر یکپارچه‌سازی‌های Open WebUI، LobeChat، و LibreChat ابتدا `/v1/models` را probe می‌کنند.
- بسیاری از pipelineهای RAG و حافظه انتظار `/v1/embeddings` را دارند.
- کلاینت‌های agent-native به‌طور فزاینده‌ای `/v1/responses` را ترجیح می‌دهند.

یادداشت برنامه‌ریزی:

- `/v1/models` agent-first است: `openclaw`، `openclaw/default`، و `openclaw/<agentId>` را برمی‌گرداند.
- `openclaw/default` نام مستعار پایداری است که همیشه به عامل پیش‌فرض پیکربندی‌شده map می‌شود.
- وقتی override برای provider/model پشتیبان می‌خواهید از `x-openclaw-model` استفاده کنید؛ در غیر این صورت مدل عادی و راه‌اندازی embedding عامل انتخاب‌شده کنترل را حفظ می‌کند.

همه این‌ها روی پورت اصلی Gateway اجرا می‌شوند و از همان مرز احراز هویت اپراتور مورد اعتماد مانند بقیه HTTP API Gateway استفاده می‌کنند.

### اولویت پورت و bind

| تنظیمات      | ترتیب resolution                                              |
| ------------ | ------------------------------------------------------------- |
| پورت Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| حالت bind    | CLI/override → `gateway.bind` → `loopback`                    |

سرویس‌های gateway نصب‌شده مقدار resolve‌شده `--port` را در متادیتای supervisor ثبت می‌کنند. پس از تغییر `gateway.port`، `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا کنید تا launchd/systemd/schtasks فرایند را روی پورت جدید شروع کند.

راه‌اندازی Gateway هنگام seed کردن originهای محلی
UI کنترل برای bindهای غیر-loopback از همان پورت و bind مؤثر استفاده می‌کند. برای مثال، `--bind lan --port 3000`
پیش از اجرای اعتبارسنجی زمان اجرا، `http://localhost:3000` و `http://127.0.0.1:3000` را seed می‌کند. هر origin مرورگر راه‌دور، مانند URLهای proxy HTTPS، را
به‌صراحت به `gateway.controlUi.allowedOrigins` اضافه کنید.

### حالت‌های hot reload

| `gateway.reload.mode` | رفتار                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | بدون بارگذاری مجدد پیکربندی                           |
| `hot`                 | فقط تغییرهای hot-safe را اعمال می‌کند                |
| `restart`             | هنگام تغییرهای نیازمند reload، restart می‌کند         |
| `hybrid` (پیش‌فرض)    | وقتی امن است hot-apply می‌کند، وقتی لازم است restart می‌کند |

## مجموعه فرمان‌های اپراتور

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` برای کشف سرویس اضافی است (LaunchDaemons/واحدهای systemd system
/schtasks)، نه برای probe عمیق‌تر سلامت RPC.

## چند gateway (روی یک میزبان)

بیشتر نصب‌ها باید روی هر ماشین یک gateway اجرا کنند. یک gateway واحد می‌تواند چندین
عامل و کانال را میزبانی کند.

فقط زمانی به چند gateway نیاز دارید که عمداً isolation یا یک rescue bot بخواهید.

بررسی‌های مفید:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

انتظار چه چیزی را داشته باشید:

- `gateway status --deep` می‌تواند `Other gateway-like services detected (best effort)` را گزارش کند
  و وقتی نصب‌های قدیمی launchd/systemd/schtasks هنوز باقی هستند، راهنمای cleanup چاپ کند.
- `gateway probe` وقتی بیش از یک هدف پاسخ می‌دهد می‌تواند درباره `multiple reachable gateways` هشدار دهد.
- اگر این عمدی است، پورت‌ها، config/state، و ریشه‌های workspace را برای هر gateway جدا کنید.

چک‌لیست برای هر instance:

- `gateway.port` یکتا
- `OPENCLAW_CONFIG_PATH` یکتا
- `OPENCLAW_STATE_DIR` یکتا
- `agents.defaults.workspace` یکتا

مثال:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

راه‌اندازی تفصیلی: [/gateway/multiple-gateways](/fa/gateway/multiple-gateways).

## endpoint مغز بلادرنگ VoiceClaw

OpenClaw یک endpoint بلادرنگ WebSocket سازگار با VoiceClaw را در
`/voiceclaw/realtime` ارائه می‌کند. وقتی کلاینت دسکتاپ VoiceClaw باید
به‌جای عبور از یک فرایند relay جداگانه، مستقیماً با یک مغز بلادرنگ OpenClaw صحبت کند، از آن استفاده کنید.

این endpoint از Gemini Live برای صدای بلادرنگ استفاده می‌کند و با ارائه مستقیم ابزارهای OpenClaw به Gemini Live، OpenClaw را به‌عنوان مغز فراخوانی می‌کند. فراخوانی‌های ابزار یک
نتیجه فوری `working` برمی‌گردانند تا نوبت صدا پاسخ‌گو بماند، سپس OpenClaw
ابزار واقعی را به‌صورت asynchronous اجرا می‌کند و نتیجه را دوباره به جلسه
زنده inject می‌کند. `GEMINI_API_KEY` را در محیط فرایند gateway تنظیم کنید. اگر
احراز هویت gateway فعال باشد، کلاینت دسکتاپ token یا password gateway را
در نخستین پیام `session.config` خود ارسال می‌کند.

دسترسی بلادرنگ به مغز، فرمان‌های عامل OpenClaw مجازشده توسط مالک را اجرا می‌کند. `gateway.auth.mode: "none"` را به instanceهای تست فقط-loopback محدود نگه دارید. اتصال‌های غیرمحلی
بلادرنگ به مغز به احراز هویت gateway نیاز دارند.

برای یک gateway تست isolated، یک instance جداگانه با پورت، پیکربندی،
و state خودش اجرا کنید:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

سپس VoiceClaw را برای استفاده از این مقدار پیکربندی کنید:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## دسترسی راه‌دور

ترجیحی: Tailscale/VPN.
جایگزین: تونل SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

سپس کلاینت‌ها را به‌صورت محلی به `ws://127.0.0.1:18789` متصل کنید.

<Warning>
تونل‌های SSH احراز هویت gateway را دور نمی‌زنند. برای احراز هویت secret مشترک، کلاینت‌ها همچنان
باید `token`/`password` را حتی از طریق تونل ارسال کنند. برای حالت‌های دارای identity،
درخواست همچنان باید آن مسیر احراز هویت را برآورده کند.
</Warning>

ببینید: [Gateway راه‌دور](/fa/gateway/remote)، [احراز هویت](/fa/gateway/authentication)، [Tailscale](/fa/gateway/tailscale).

## نظارت و چرخه عمر سرویس

برای قابلیت اطمینان مشابه production از اجراهای supervised استفاده کنید.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

برای restartها از `openclaw gateway restart` استفاده کنید. `openclaw gateway stop` و `openclaw gateway start` را زنجیره نکنید؛ در macOS، `gateway stop` پیش از توقف، LaunchAgent را عمداً غیرفعال می‌کند.

برچسب‌های LaunchAgent برابرند با `ai.openclaw.gateway` (پیش‌فرض) یا `ai.openclaw.<profile>` (profile نام‌گذاری‌شده). `openclaw doctor` drift پیکربندی سرویس را audit و repair می‌کند.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

برای persistence پس از logout، lingering را فعال کنید:

```bash
sudo loginctl enable-linger <user>
```

نمونه user-unit دستی وقتی به مسیر نصب سفارشی نیاز دارید:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

راه‌اندازی managed بومی Windows از یک Scheduled Task با نام `OpenClaw Gateway`
(یا `OpenClaw Gateway (<profile>)` برای profileهای نام‌گذاری‌شده) استفاده می‌کند. اگر ایجاد Scheduled Task
رد شود، OpenClaw به یک launcher در پوشه Startup برای هر کاربر fallback می‌کند
که به `gateway.cmd` داخل دایرکتوری state اشاره دارد.

  </Tab>

  <Tab title="Linux (system service)">

برای میزبان‌های چندکاربره/همیشه‌روشن از system unit استفاده کنید.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

از همان بدنه سرویس مانند user unit استفاده کنید، اما آن را زیر
`/etc/systemd/system/openclaw-gateway[-<profile>].service` نصب کنید و اگر binary `openclaw` شما جای دیگری است
`ExecStart=` را تنظیم کنید.

اجازه ندهید `openclaw doctor --fix` هم‌زمان برای همان profile/port یک سرویس gateway سطح کاربر نصب کند. وقتی Doctor یک سرویس OpenClaw gateway سطح system پیدا کند، آن نصب خودکار را رد می‌کند؛ وقتی system unit مالک چرخه عمر است از `OPENCLAW_SERVICE_REPAIR_POLICY=external` استفاده کنید.

  </Tab>
</Tabs>

## مسیر سریع profile توسعه

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

پیش‌فرض‌ها شامل state/config جداشده و پورت gateway پایه `19001` هستند.

## مرجع سریع پروتکل (نمای اپراتور)

- نخستین frame کلاینت باید `connect` باشد.
- Gateway اسنپ‌شات `hello-ok` را برمی‌گرداند (`presence`، `health`، `stateVersion`، `uptimeMs`، limits/policy).
- `hello-ok.features.methods` / `events` یک فهرست discovery محافظه‌کارانه است، نه
  dump تولیدشده از همه routeهای helper قابل فراخوانی.
- درخواست‌ها: `req(method, params)` → `res(ok/payload|error)`.
- رویدادهای رایج شامل `connect.challenge`، `agent`، `chat`،
  `session.message`، `session.tool`، `sessions.changed`، `presence`، `tick`،
  `health`، `heartbeat`، رویدادهای چرخه عمر pairing/approval، و `shutdown` هستند.

اجرای عامل‌ها دو مرحله‌ای است:

1. ack پذیرش فوری (`status:"accepted"`)
2. پاسخ تکمیل نهایی (`status:"ok"|"error"`)، همراه با رویدادهای streamed `agent` در میان آن‌ها.

مستندات کامل پروتکل را ببینید: [پروتکل Gateway](/fa/gateway/protocol).

## بررسی‌های عملیاتی

### زنده‌بودن

- WS را باز کنید و `connect` را ارسال کنید.
- انتظار پاسخ `hello-ok` همراه با snapshot را داشته باشید.

### آمادگی

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### بازیابی شکاف

رویدادها بازپخش نمی‌شوند. هنگام رخ‌دادن شکاف در sequence، پیش از ادامه وضعیت را تازه‌سازی کنید (`health`، `system-presence`).

## امضاهای رایج خرابی

| امضا                                                            | مشکل محتمل                                                                      |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                     | bind غیر loopback بدون یک مسیر معتبر برای احراز هویت gateway                    |
| `another gateway instance is already listening` / `EADDRINUSE`  | تداخل پورت                                                                      |
| `Gateway start blocked: set gateway.mode=local`                 | پیکربندی روی حالت remote تنظیم شده است، یا مهر local-mode از پیکربندی آسیب‌دیده حذف شده است |
| `unauthorized` هنگام اتصال                                      | ناهماهنگی احراز هویت بین کلاینت و Gateway                                       |

برای نردبان‌های کامل تشخیص، از [عیب‌یابی Gateway](/fa/gateway/troubleshooting) استفاده کنید.

## تضمین‌های ایمنی

- کلاینت‌های پروتکل Gateway وقتی Gateway در دسترس نباشد سریع شکست می‌خورند (بدون fallback ضمنی به کانال مستقیم).
- نخستین frameهای نامعتبر/غیر connect رد و بسته می‌شوند.
- خاموش‌سازی graceful پیش از بستن socket رویداد `shutdown` را منتشر می‌کند.

---

مرتبط:

- [عیب‌یابی](/fa/gateway/troubleshooting)
- [فرآیند پس‌زمینه](/fa/gateway/background-process)
- [پیکربندی](/fa/gateway/configuration)
- [سلامت](/fa/gateway/health)
- [Doctor](/fa/gateway/doctor)
- [احراز هویت](/fa/gateway/authentication)

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
- [دسترسی راه‌دور](/fa/gateway/remote)
- [مدیریت secrets](/fa/gateway/secrets)
