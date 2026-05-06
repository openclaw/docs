---
read_when:
    - اجرای فرایند Gateway یا اشکال‌زدایی آن
summary: راهنمای عملیاتی برای سرویس Gateway، چرخه حیات و عملیات
title: راهنمای عملیاتی Gateway
x-i18n:
    generated_at: "2026-05-06T09:16:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

از این صفحه برای راه‌اندازی روز اول و عملیات روز دوم سرویس Gateway استفاده کنید.

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/fa/gateway/troubleshooting">
    عیب‌یابی مبتنی بر نشانه، همراه با نردبان‌های دقیق فرمان و امضاهای لاگ.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fa/gateway/configuration">
    راهنمای راه‌اندازی وظیفه‌محور + مرجع کامل پیکربندی.
  </Card>
  <Card title="Secrets management" icon="key-round" href="/fa/gateway/secrets">
    قرارداد SecretRef، رفتار snapshot زمان اجرا، و عملیات migrate/reload.
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/fa/gateway/secrets-plan-contract">
    قواعد دقیق هدف/مسیر `secrets apply` و رفتار auth-profile فقط مبتنی بر ref.
  </Card>
</CardGroup>

## راه‌اندازی محلی ۵ دقیقه‌ای

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

خط مبنای سالم: `Runtime: running`، `Connectivity probe: ok`، و `Capability: ...` که با انتظار شما مطابق باشد. وقتی به اثبات RPC با دامنه خواندن نیاز دارید، نه فقط دسترسی‌پذیری، از `openclaw gateway status --require-rpc` استفاده کنید.

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

با یک gateway دسترس‌پذیر، این فرمان برای هر حساب probeهای زنده کانال و auditهای اختیاری را اجرا می‌کند.
اگر gateway دسترس‌ناپذیر باشد، CLI به‌جای خروجی probe زنده، به خلاصه‌های فقط مبتنی بر پیکربندی کانال برمی‌گردد.

  </Step>
</Steps>

<Note>
بارگذاری دوباره پیکربندی Gateway مسیر فایل پیکربندی فعال را پایش می‌کند؛ این مسیر از پیش‌فرض‌های profile/state حل می‌شود، یا وقتی تنظیم شده باشد از `OPENCLAW_CONFIG_PATH`.
حالت پیش‌فرض `gateway.reload.mode="hybrid"` است.
پس از نخستین بارگذاری موفق، فرایند در حال اجرا snapshot فعال پیکربندی در حافظه را سرویس می‌دهد؛ بارگذاری دوباره موفق آن snapshot را به‌صورت اتمیک جایگزین می‌کند.
</Note>

## مدل زمان اجرا

- یک فرایند همیشه روشن برای مسیریابی، control plane، و اتصال‌های کانال.
- یک پورت multiplexed واحد برای:
  - کنترل/RPC از طریق WebSocket
  - APIهای HTTP، سازگار با OpenAI (`/v1/models`، `/v1/embeddings`، `/v1/chat/completions`، `/v1/responses`، `/tools/invoke`)
  - Control UI و hookها
- حالت bind پیش‌فرض: `loopback`.
- احراز هویت به‌صورت پیش‌فرض الزامی است. راه‌اندازی‌های shared-secret از
  `gateway.auth.token` / `gateway.auth.password` (یا
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) استفاده می‌کنند، و راه‌اندازی‌های reverse-proxy غیر loopback
  می‌توانند از `gateway.auth.mode: "trusted-proxy"` استفاده کنند.

## endpointهای سازگار با OpenAI

پرسودترین سطح سازگاری OpenClaw اکنون این‌هاست:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

چرا این مجموعه مهم است:

- بیشتر یکپارچه‌سازی‌های Open WebUI، LobeChat، و LibreChat ابتدا `/v1/models` را probe می‌کنند.
- بسیاری از pipelineهای RAG و حافظه انتظار `/v1/embeddings` را دارند.
- کلاینت‌های agent-native به‌طور فزاینده‌ای `/v1/responses` را ترجیح می‌دهند.

نکته برنامه‌ریزی:

- `/v1/models` در اولویت با agent است: `openclaw`، `openclaw/default`، و `openclaw/<agentId>` را برمی‌گرداند.
- `openclaw/default` نام مستعار پایداری است که همیشه به agent پیش‌فرض پیکربندی‌شده نگاشت می‌شود.
- وقتی override برای backend provider/model می‌خواهید از `x-openclaw-model` استفاده کنید؛ در غیر این صورت، مدل عادی و راه‌اندازی embedding مربوط به agent انتخاب‌شده کنترل را حفظ می‌کند.

همه این‌ها روی پورت اصلی Gateway اجرا می‌شوند و از همان مرز احراز هویت operator مورد اعتماد مثل بقیه API HTTP مربوط به Gateway استفاده می‌کنند.

### اولویت پورت و bind

| تنظیم        | ترتیب حل                                                        |
| ------------ | --------------------------------------------------------------- |
| پورت Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`   |
| حالت Bind    | CLI/override → `gateway.bind` → `loopback`                      |

سرویس‌های Gateway نصب‌شده `--port` حل‌شده را در metadata supervisor ثبت می‌کنند. پس از تغییر `gateway.port`، `openclaw doctor --fix` یا `openclaw gateway install --force` را اجرا کنید تا launchd/systemd/schtasks فرایند را روی پورت جدید شروع کند.

راه‌اندازی Gateway هنگام seed کردن originهای محلی
Control UI برای bindهای غیر loopback از همان پورت و bind موثر استفاده می‌کند. برای مثال، `--bind lan --port 3000`
پیش از اجرای اعتبارسنجی زمان اجرا، `http://localhost:3000` و `http://127.0.0.1:3000` را seed می‌کند.
هر origin مرورگر راه دور، مانند URLهای proxy مبتنی بر HTTPS، را به‌صورت صریح به
`gateway.controlUi.allowedOrigins` اضافه کنید.

### حالت‌های hot reload

| `gateway.reload.mode` | رفتار                                             |
| --------------------- | ------------------------------------------------- |
| `off`                 | بدون بارگذاری دوباره پیکربندی                    |
| `hot`                 | فقط تغییرات hot-safe را اعمال می‌کند             |
| `restart`             | روی تغییراتی که reload-required هستند restart می‌کند |
| `hybrid` (پیش‌فرض)   | وقتی امن باشد hot-apply می‌کند، و وقتی لازم باشد restart می‌کند |

## مجموعه فرمان‌های operator

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

`gateway status --deep` برای کشف سرویس اضافی است (LaunchDaemons/systemd system
units/schtasks)، نه probe عمیق‌تر سلامت RPC.

## چند Gateway (روی یک میزبان)

بیشتر نصب‌ها باید برای هر ماشین یک gateway اجرا کنند. یک gateway واحد می‌تواند چندین
agent و کانال را میزبانی کند.

فقط زمانی به چند gateway نیاز دارید که عمدا isolation یا rescue bot بخواهید.

بررسی‌های مفید:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

انتظار چه چیزی را داشته باشید:

- `gateway status --deep` می‌تواند `Other gateway-like services detected (best effort)`
  را گزارش کند و وقتی نصب‌های قدیمی launchd/systemd/schtasks هنوز باقی هستند، راهنمای cleanup چاپ کند.
- `gateway probe` وقتی بیش از یک target پاسخ دهد می‌تواند درباره `multiple reachable gateways`
  هشدار دهد.
- اگر این وضعیت عمدی است، پورت‌ها، config/state، و ریشه‌های workspace را برای هر gateway جدا کنید.

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

## دسترسی راه دور

ترجیحی: Tailscale/VPN.
جایگزین: تونل SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

سپس کلاینت‌ها را به‌صورت محلی به `ws://127.0.0.1:18789` متصل کنید.

<Warning>
تونل‌های SSH احراز هویت gateway را دور نمی‌زنند. برای احراز هویت shared-secret، کلاینت‌ها همچنان
باید حتی از طریق تونل `token`/`password` را بفرستند. برای حالت‌های identity-bearing،
درخواست همچنان باید آن مسیر احراز هویت را برآورده کند.
</Warning>

ببینید: [Remote Gateway](/fa/gateway/remote)، [Authentication](/fa/gateway/authentication)، [Tailscale](/fa/gateway/tailscale).

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

برای restartها از `openclaw gateway restart` استفاده کنید. `openclaw gateway stop` و `openclaw gateway start` را زنجیره نکنید؛ در macOS، `gateway stop` پیش از توقف، LaunchAgent را عمدا غیرفعال می‌کند.

labelهای LaunchAgent برابرند با `ai.openclaw.gateway` (پیش‌فرض) یا `ai.openclaw.<profile>` (profile نام‌گذاری‌شده). `openclaw doctor` drift پیکربندی سرویس را audit و repair می‌کند.

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
رد شود، OpenClaw به یک launcher در Startup-folder مخصوص هر کاربر fallback می‌کند
که به `gateway.cmd` داخل state directory اشاره دارد.

  </Tab>

  <Tab title="Linux (system service)">

برای میزبان‌های multi-user/always-on از system unit استفاده کنید.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

از همان بدنه سرویس مثل user unit استفاده کنید، اما آن را زیر
`/etc/systemd/system/openclaw-gateway[-<profile>].service` نصب کنید و اگر binary مربوط به `openclaw` جای دیگری قرار دارد،
`ExecStart=` را تنظیم کنید.

اجازه ندهید `openclaw doctor --fix` هم‌زمان یک سرویس Gateway در سطح کاربر برای همان profile/port نصب کند. وقتی Doctor یک سرویس OpenClaw gateway در سطح سیستم پیدا کند، آن نصب خودکار را رد می‌کند؛ وقتی system unit مالک چرخه عمر است از `OPENCLAW_SERVICE_REPAIR_POLICY=external` استفاده کنید.

  </Tab>
</Tabs>

## مسیر سریع profile توسعه

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

پیش‌فرض‌ها شامل state/config جداشده و پورت پایه Gateway برابر `19001` هستند.

## مرجع سریع protocol (نمای operator)

- نخستین frame کلاینت باید `connect` باشد.
- Gateway snapshot مربوط به `hello-ok` را برمی‌گرداند (`presence`، `health`، `stateVersion`، `uptimeMs`، limits/policy).
- `hello-ok.features.methods` / `events` یک فهرست conservative discovery است، نه
  dump تولیدشده از هر helper route قابل فراخوانی.
- درخواست‌ها: `req(method, params)` → `res(ok/payload|error)`.
- eventهای رایج شامل `connect.challenge`، `agent`، `chat`،
  `session.message`، `session.tool`، `sessions.changed`، `presence`، `tick`،
  `health`، `heartbeat`، eventهای چرخه عمر pairing/approval، و `shutdown` هستند.

اجرای Agent دو مرحله‌ای است:

1. ack پذیرفته‌شده فوری (`status:"accepted"`)
2. پاسخ تکمیل نهایی (`status:"ok"|"error"`)، همراه با eventهای streamed مربوط به `agent` در بین آن‌ها.

مستندات کامل protocol را ببینید: [Gateway Protocol](/fa/gateway/protocol).

## بررسی‌های عملیاتی

### زنده بودن

- WS را باز کنید و `connect` بفرستید.
- انتظار پاسخ `hello-ok` همراه با snapshot داشته باشید.

### آمادگی

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### بازیابی gap

eventها replay نمی‌شوند. در صورت gapهای sequence، پیش از ادامه state را refresh کنید (`health`، `system-presence`).

## امضاهای رایج failure

| امضا                                                           | مشکل محتمل                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | bind غیر loopback بدون مسیر احراز هویت معتبر gateway                           |
| `another gateway instance is already listening` / `EADDRINUSE` | تداخل پورت                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | پیکربندی روی حالت remote تنظیم شده، یا stamp حالت local از پیکربندی آسیب‌دیده کم است |
| `unauthorized` during connect                                  | عدم تطابق احراز هویت بین کلاینت و gateway                                      |

برای نردبان‌های کامل تشخیص، از [Gateway Troubleshooting](/fa/gateway/troubleshooting) استفاده کنید.

## تضمین‌های ایمنی

- کلاینت‌های پروتکل Gateway وقتی Gateway در دسترس نیست به‌سرعت شکست می‌خورند (بدون بازگشت ضمنی به کانال مستقیم).
- فریم‌های نخستین نامعتبر/غیر connect رد و بسته می‌شوند.
- خاموش‌سازی آرام، رویداد `shutdown` را پیش از بسته شدن سوکت منتشر می‌کند.

---

مرتبط:

- [عیب‌یابی](/fa/gateway/troubleshooting)
- [فرایند پس‌زمینه](/fa/gateway/background-process)
- [پیکربندی](/fa/gateway/configuration)
- [سلامت](/fa/gateway/health)
- [عیب‌یاب](/fa/gateway/doctor)
- [احراز هویت](/fa/gateway/authentication)

## مرتبط

- [پیکربندی](/fa/gateway/configuration)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
- [دسترسی راه دور](/fa/gateway/remote)
- [مدیریت اسرار](/fa/gateway/secrets)
