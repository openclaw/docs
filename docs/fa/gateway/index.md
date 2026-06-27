---
read_when:
    - اجرای یا اشکال‌زدایی فرایند Gateway
summary: راهنمای اجرایی سرویس Gateway، چرخهٔ حیات و عملیات
title: راهنمای عملیاتی Gateway
x-i18n:
    generated_at: "2026-06-27T17:44:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

از این صفحه برای راه‌اندازی روز اول و عملیات روز دوم سرویس Gateway استفاده کنید.

<CardGroup cols={2}>
  <Card title="عیب‌یابی عمیق" icon="siren" href="/fa/gateway/troubleshooting">
    عیب‌یابی مبتنی بر نشانه‌ها با نردبان‌های دقیق فرمان و امضاهای لاگ.
  </Card>
  <Card title="پیکربندی" icon="sliders" href="/fa/gateway/configuration">
    راهنمای راه‌اندازی وظیفه‌محور + مرجع کامل پیکربندی.
  </Card>
  <Card title="مدیریت محرمانه‌ها" icon="key-round" href="/fa/gateway/secrets">
    قرارداد SecretRef، رفتار snapshot زمان اجرا، و عملیات مهاجرت/بارگذاری مجدد.
  </Card>
  <Card title="قرارداد طرح محرمانه‌ها" icon="shield-check" href="/fa/gateway/secrets-plan-contract">
    قواعد دقیق هدف/مسیر `secrets apply` و رفتار نمایه احراز هویت فقط-ارجاع.
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

  <Step title="سلامت سرویس را تأیید کنید">

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

با یک Gateway قابل دسترس، این فرمان probeهای زنده کانال را برای هر حساب و auditهای اختیاری اجرا می‌کند.
اگر Gateway قابل دسترس نباشد، CLI به‌جای خروجی probe زنده، به خلاصه‌های کانال فقط مبتنی بر پیکربندی برمی‌گردد.

  </Step>
</Steps>

<Note>
بارگذاری مجدد پیکربندی Gateway مسیر فایل پیکربندی فعال را پایش می‌کند (از پیش‌فرض‌های نمایه/وضعیت resolve می‌شود، یا وقتی `OPENCLAW_CONFIG_PATH` تنظیم شده باشد از آن).
حالت پیش‌فرض `gateway.reload.mode="hybrid"` است.
پس از نخستین بارگذاری موفق، فرایند در حال اجرا snapshot پیکربندی فعال در حافظه را سرو می‌کند؛ بارگذاری مجدد موفق آن snapshot را به‌صورت اتمی جایگزین می‌کند.
</Note>

## مدل زمان اجرا

- یک فرایند همیشه روشن برای مسیریابی، control plane، و اتصال‌های کانال.
- یک پورت multiplexed واحد برای:
  - کنترل/RPC WebSocket
  - APIهای HTTP (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - مسیرهای HTTP مربوط به Plugin، مانند `/api/v1/admin/rpc` اختیاری
  - Control UI و hookها
- حالت bind پیش‌فرض: `loopback`.
- احراز هویت به‌طور پیش‌فرض الزامی است. راه‌اندازی‌های shared-secret از
  `gateway.auth.token` / `gateway.auth.password` (یا
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) استفاده می‌کنند، و راه‌اندازی‌های reverse-proxy غیر loopback
  می‌توانند از `gateway.auth.mode: "trusted-proxy"` استفاده کنند.

## endpointهای سازگار با OpenAI

سطح سازگاری پربازده OpenClaw اکنون این‌هاست:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

چرایی اهمیت این مجموعه:

- بیشتر یکپارچه‌سازی‌های Open WebUI، LobeChat، و LibreChat ابتدا `/v1/models` را probe می‌کنند.
- بسیاری از pipelineهای RAG و حافظه انتظار `/v1/embeddings` را دارند.
- کلاینت‌های agent-native به‌طور فزاینده‌ای `/v1/responses` را ترجیح می‌دهند.

نکته برنامه‌ریزی:

- `/v1/models` اولویت را به agent می‌دهد: `openclaw`، `openclaw/default`، و `openclaw/<agentId>` را برمی‌گرداند.
- `openclaw/default` alias پایداری است که همیشه به agent پیش‌فرض پیکربندی‌شده نگاشت می‌شود.
- وقتی override مربوط به ارائه‌دهنده/مدل backend می‌خواهید از `x-openclaw-model` استفاده کنید؛ در غیر این صورت، تنظیم عادی مدل و embedding مربوط به agent انتخاب‌شده کنترل را در دست نگه می‌دارد.

همه این‌ها روی پورت اصلی Gateway اجرا می‌شوند و همان مرز احراز هویت اپراتور قابل اعتماد را مثل بقیه APIهای HTTP Gateway استفاده می‌کنند.

RPC مدیریتی HTTP (`POST /api/v1/admin/rpc`) یک مسیر Plugin جداگانه و به‌طور پیش‌فرض خاموش برای ابزارهای میزبان است که نمی‌توانند از RPC WebSocket استفاده کنند. [RPC مدیریتی HTTP](/fa/plugins/admin-http-rpc) را ببینید.

### تقدم پورت و bind

| تنظیمات      | ترتیب resolve                                              |
| ------------ | ------------------------------------------------------------- |
| پورت Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| حالت bind    | CLI/override → `gateway.bind` → `loopback`                    |

سرویس‌های Gateway نصب‌شده مقدار resolveشده `--port` را در metadata supervisor ثبت می‌کنند. پس از تغییر `gateway.port`، `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا کنید تا launchd/systemd/schtasks فرایند را روی پورت جدید شروع کند.

راه‌اندازی Gateway هنگام seed کردن originهای محلی Control UI برای bindهای غیر loopback از همان پورت و bind مؤثر استفاده می‌کند. برای مثال، `--bind lan --port 3000`
پیش از اجرای اعتبارسنجی زمان اجرا، `http://localhost:3000` و `http://127.0.0.1:3000` را seed می‌کند. هر origin مرورگر راه دور، مانند URLهای proxy مبتنی بر HTTPS، را به‌صراحت به
`gateway.controlUi.allowedOrigins` اضافه کنید.

### حالت‌های hot reload

| `gateway.reload.mode` | رفتار                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | بدون بارگذاری مجدد پیکربندی                           |
| `hot`                 | فقط تغییرات hot-safe را اعمال می‌کند                |
| `restart`             | هنگام تغییراتی که نیازمند reload هستند restart می‌کند         |
| `hybrid` (پیش‌فرض)    | وقتی امن باشد hot-apply می‌کند، و وقتی لازم باشد restart می‌کند |

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

`gateway status --deep` برای کشف سرویس اضافی است (LaunchDaemons/واحدهای systemd system/schtasks)، نه probe سلامت RPC عمیق‌تر.

## چند Gateway (همان میزبان)

بیشتر نصب‌ها باید برای هر ماشین یک Gateway اجرا کنند. یک Gateway واحد می‌تواند چند agent و کانال را میزبانی کند.

فقط زمانی به چند Gateway نیاز دارید که عمداً isolation یا bot نجات می‌خواهید.

بررسی‌های مفید:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

انتظار چه چیزی را داشته باشید:

- `gateway status --deep` می‌تواند `Other gateway-like services detected (best effort)`
  را گزارش کند و وقتی نصب‌های قدیمی launchd/systemd/schtasks هنوز وجود دارند، راهنمای cleanup چاپ کند.
- `gateway probe` وقتی Gatewayهای متمایز پاسخ می‌دهند، یا وقتی OpenClaw نمی‌تواند ثابت کند هدف‌های قابل دسترس همان Gateway هستند، می‌تواند درباره `multiple reachable gateway identities` هشدار دهد.
  یک تونل SSH، URL proxy، یا URL راه دور پیکربندی‌شده به همان Gateway، یک
  Gateway با چند transport است، حتی وقتی پورت‌های transport متفاوت باشند.
- اگر این عمدی است، پورت‌ها، پیکربندی/وضعیت، و ریشه‌های workspace را برای هر Gateway جدا کنید.

چک‌لیست برای هر نمونه:

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

## دسترسی راه دور

ترجیحی: Tailscale/VPN.
fallback: تونل SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

سپس کلاینت‌ها را به‌صورت محلی به `ws://127.0.0.1:18789` وصل کنید.

<Warning>
تونل‌های SSH احراز هویت Gateway را دور نمی‌زنند. برای احراز هویت shared-secret، کلاینت‌ها همچنان
باید حتی روی تونل `token`/`password` ارسال کنند. برای حالت‌های دارای identity،
درخواست همچنان باید آن مسیر احراز هویت را برآورده کند.
</Warning>

ببینید: [Gateway راه دور](/fa/gateway/remote)، [احراز هویت](/fa/gateway/authentication)، [Tailscale](/fa/gateway/tailscale).

## نظارت و چرخه عمر سرویس

برای قابلیت اطمینان شبیه production از اجراهای تحت نظارت استفاده کنید.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

برای restartها از `openclaw gateway restart` استفاده کنید. `openclaw gateway stop` و `openclaw gateway start` را به‌عنوان جایگزین restart زنجیره نکنید.

در macOS، `gateway stop` به‌طور پیش‌فرض از `launchctl bootout` استفاده می‌کند — این LaunchAgent را از session بوت فعلی حذف می‌کند بدون آنکه disable را پایدار کند، بنابراین بازیابی خودکار KeepAlive پس از crashهای غیرمنتظره همچنان کار می‌کند و `gateway start` دوباره به‌شکلی تمیز فعال می‌کند. برای سرکوب پایدار auto-respawn در rebootها، `--disable` را پاس بدهید: `openclaw gateway stop --disable`.

labelهای LaunchAgent عبارت‌اند از `ai.openclaw.gateway` (پیش‌فرض) یا `ai.openclaw.<profile>` (نمایه نام‌گذاری‌شده). `openclaw doctor` drift پیکربندی سرویس را audit و repair می‌کند.

  </Tab>

  <Tab title="Linux (کاربر systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

برای ماندگاری پس از logout، lingering را فعال کنید:

```bash
sudo loginctl enable-linger <user>
```

مثال واحد کاربری دستی وقتی به مسیر نصب سفارشی نیاز دارید:

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

راه‌اندازی مدیریت‌شده بومی Windows از Scheduled Task با نام `OpenClaw Gateway`
(یا `OpenClaw Gateway (<profile>)` برای نمایه‌های نام‌گذاری‌شده) استفاده می‌کند. اگر ایجاد Scheduled Task
رد شود، OpenClaw به launcher پوشه Startup هر کاربر fallback می‌کند
که به `gateway.cmd` داخل دایرکتوری وضعیت اشاره می‌کند.

  </Tab>

  <Tab title="Linux (سرویس system)">

برای میزبان‌های چندکاربره/همیشه روشن از واحد system استفاده کنید.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

از همان بدنه سرویس واحد کاربری استفاده کنید، اما آن را زیر
`/etc/systemd/system/openclaw-gateway[-<profile>].service` نصب کنید و اگر binary `openclaw` شما جای دیگری قرار دارد،
`ExecStart=` را تنظیم کنید.

اجازه ندهید `openclaw doctor --fix` هم برای همان نمایه/پورت یک سرویس Gateway سطح کاربر نصب کند. وقتی Doctor یک سرویس OpenClaw Gateway سطح system پیدا می‌کند، آن نصب خودکار را رد می‌کند؛ وقتی واحد system مالک چرخه عمر است، از `OPENCLAW_SERVICE_REPAIR_POLICY=external` استفاده کنید.

  </Tab>
</Tabs>

## مسیر سریع نمایه توسعه

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

پیش‌فرض‌ها شامل وضعیت/پیکربندی جداشده و پورت پایه Gateway یعنی `19001` هستند.

## مرجع سریع پروتکل (نمای اپراتور)

- نخستین frame کلاینت باید `connect` باشد.
- Gateway یک snapshot با `hello-ok` برمی‌گرداند (`presence`، `health`، `stateVersion`، `uptimeMs`، limits/policy).
- `hello-ok.features.methods` / `events` فهرست کشف محافظه‌کارانه هستند، نه
  dump تولیدشده از همه مسیرهای helper قابل فراخوانی.
- درخواست‌ها: `req(method, params)` → `res(ok/payload|error)`.
- رویدادهای رایج شامل `connect.challenge`، `agent`، `chat`،
  `session.message`، `session.operation`، `session.tool`، `sessions.changed`،
  `presence`، `tick`، `health`، `heartbeat`، رویدادهای چرخه عمر pairing/approval،
  و `shutdown` هستند.

اجرای agent دو مرحله‌ای است:

1. ack پذیرفته‌شده فوری (`status:"accepted"`)
2. پاسخ تکمیل نهایی (`status:"ok"|"error"`)، همراه با رویدادهای streamed `agent` در میان آن‌ها.

مستندات کامل پروتکل را ببینید: [پروتکل Gateway](/fa/gateway/protocol).

## بررسی‌های عملیاتی

### زنده بودن

- WS را باز کنید و `connect` ارسال کنید.
- انتظار پاسخ `hello-ok` همراه با snapshot را داشته باشید.

### آمادگی

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### بازیابی شکاف

رویدادها replay نمی‌شوند. هنگام شکاف‌های sequence، پیش از ادامه وضعیت را refresh کنید (`health`، `system-presence`).

## امضاهای رایج خرابی

| امضا                                                          | مشکل محتمل                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | bind غیر local loopback بدون مسیر معتبر احراز هویت gateway                      |
| `another gateway instance is already listening` / `EADDRINUSE` | تداخل پورت                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | پیکربندی روی حالت راه دور تنظیم شده است، یا مهر حالت محلی از پیکربندی آسیب‌دیده حذف شده است |
| `unauthorized` during connect                                  | ناهماهنگی احراز هویت بین کلاینت و gateway                                      |

برای نردبان‌های تشخیص کامل، از [عیب‌یابی Gateway](/fa/gateway/troubleshooting) استفاده کنید.

## تضمین‌های ایمنی

- کلاینت‌های پروتکل Gateway وقتی Gateway در دسترس نباشد سریع شکست می‌خورند (بدون بازگشت ضمنی به کانال مستقیم).
- فریم‌های اول نامعتبر/غیراتصالی رد و بسته می‌شوند.
- خاموش‌سازی نرم پیش از بستن سوکت رویداد `shutdown` را منتشر می‌کند.

---

مرتبط:

- [عیب‌یابی](/fa/gateway/troubleshooting)
- [فرایند پس‌زمینه](/fa/gateway/background-process)
- [پیکربندی](/fa/gateway/configuration)
- [سلامت](/fa/gateway/health)
- [Doctor](/fa/gateway/doctor)
- [احراز هویت](/fa/gateway/authentication)

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
- [دسترسی راه دور](/fa/gateway/remote)
- [مدیریت اسرار](/fa/gateway/secrets)
