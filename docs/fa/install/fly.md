---
read_when:
    - استقرار OpenClaw روی Fly.io
    - راه‌اندازی volumeها، secretها و پیکربندی اجرای نخست در Fly
summary: استقرار گام‌به‌گام OpenClaw در Fly.io با فضای ذخیره‌سازی پایدار و HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T16:34:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**هدف:** اجرای OpenClaw Gateway روی یک ماشین [Fly.io](https://fly.io) با فضای ذخیره‌سازی پایدار، HTTPS خودکار و دسترسی Discord/کانال.

## موارد موردنیاز

- [Flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) نصب‌شده
- حساب Fly.io (سطح رایگان قابل‌استفاده است)
- احراز هویت مدل: کلید API برای ارائه‌دهنده مدل انتخابی
- اعتبارنامه‌های کانال: توکن ربات Discord، توکن Telegram و غیره

## مسیر سریع برای مبتدیان

1. مخزن را کلون و `fly.toml` را سفارشی کنید
2. برنامه و volume را ایجاد و secretها را تنظیم کنید
3. با `fly deploy` مستقر کنید
4. برای ایجاد پیکربندی از طریق SSH وارد شوید یا از رابط کنترل استفاده کنید

<Steps>
  <Step title="ایجاد برنامه Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # نام دلخواهتان را انتخاب کنید
    fly apps create my-openclaw

    # معمولاً 1GB کافی است
    fly volumes create openclaw_data --size 1 --region iad
    ```

    منطقه‌ای نزدیک به خودتان انتخاب کنید. گزینه‌های رایج: `lhr` (لندن)، `iad` (ویرجینیا)، `sjc` (سن‌خوزه).

  </Step>

  <Step title="پیکربندی fly.toml">
    `fly.toml` را متناسب با نام برنامه و نیازهایتان ویرایش کنید. فایل `fly.toml` تحت‌کنترل نسخه در مخزن، الگوی عمومی نشان‌داده‌شده در ادامه است؛ `deploy/fly.private.toml` گونه سخت‌سازی‌شده و بدون IP عمومی است (به [استقرار خصوصی](#private-deployment-hardened) مراجعه کنید).

    ```toml
    app = "my-openclaw"  # نام برنامه شما
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    نقطه ورود تصویر Docker مربوط به OpenClaw، `tini` است که به‌طور پیش‌فرض `node openclaw.mjs gateway` را اجرا می‌کند. `[processes]` در Fly، `CMD` در Docker را جایگزین می‌کند (در اینجا `node dist/index.js gateway ...`، یعنی همان نقطه ورود کامپایل‌شده، مستقیماً اجرا می‌شود) بدون اینکه `ENTRYPOINT` تغییر کند؛ بنابراین فرایند همچنان تحت `tini` اجرا می‌شود.

    **تنظیمات کلیدی:**

    | تنظیم                        | دلیل                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | به `0.0.0.0` متصل می‌شود تا پراکسی Fly بتواند به Gateway دسترسی پیدا کند                     |
    | `--allow-unconfigured`         | بدون فایل پیکربندی شروع می‌شود (بعداً آن را ایجاد می‌کنید)                        |
    | `internal_port = 3000`         | برای بررسی‌های سلامت Fly باید با `--port 3000` (یا `OPENCLAW_GATEWAY_PORT`) مطابقت داشته باشد |
    | `memory = "2048mb"`            | 512MB بسیار کم است؛ 2GB توصیه می‌شود                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | وضعیت را روی volume پایدار نگه می‌دارد                                                |

  </Step>

  <Step title="تنظیم secretها">
    ```bash
    # الزامی: توکن احراز هویت Gateway برای اتصال غیر loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # کلیدهای API ارائه‌دهنده مدل
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # اختیاری: ارائه‌دهندگان دیگر
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # توکن‌های کانال
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    اتصال‌های غیر loopback (`--bind lan`) به یک مسیر معتبر احراز هویت Gateway نیاز دارند. این مثال از `OPENCLAW_GATEWAY_TOKEN` استفاده می‌کند، اما `gateway.auth.password` یا یک استقرار trusted-proxy غیر loopback با پیکربندی صحیح نیز این الزام را برآورده می‌کند. برای قرارداد SecretRef به [مدیریت secretها](/fa/gateway/secrets) مراجعه کنید.

    با این توکن‌ها مانند گذرواژه رفتار کنید. برای کلیدهای API و توکن‌ها، متغیرهای محیطی/`fly secrets` را به فایل پیکربندی ترجیح دهید تا secretها بیرون از `openclaw.json` بمانند.

  </Step>

  <Step title="استقرار">
    ```bash
    fly deploy
    ```

    نخستین استقرار تصویر Docker را می‌سازد. پس از استقرار، بررسی کنید:

    ```bash
    fly status
    fly logs
    ```

    پس از فعال‌شدن شنونده HTTP/WebSocket، راه‌اندازی Gateway پیام `gateway ready` را ثبت می‌کند. بررسی سلامت خود Fly طبق `fly.toml`، `internal_port = 3000` را زیر نظر دارد؛ دستور Docker با نام `HEALTHCHECK` در تصویر نیز `/healthz` را روی پورت پیش‌فرض 18789 بررسی می‌کند که در اینجا استفاده نمی‌شود، زیرا این استقرار Gateway را روی `--port 3000` تنظیم کرده است.

  </Step>

  <Step title="ایجاد فایل پیکربندی">
    برای ایجاد یک پیکربندی مناسب، از طریق SSH وارد ماشین شوید:

    ```bash
    fly ssh console
    ```

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    با `OPENCLAW_STATE_DIR=/data`، مسیر پیکربندی `/data/openclaw.json` است.

    `https://my-openclaw.fly.dev` را با مبدأ واقعی برنامه Fly خود جایگزین کنید. راه‌اندازی Gateway مبدأهای محلی رابط کنترل را از مقادیر زمان اجرای `--bind` و `--port` مقداردهی اولیه می‌کند تا راه‌اندازی نخست پیش از وجود پیکربندی انجام شود، اما دسترسی مرورگر از طریق Fly همچنان به مبدأ دقیق HTTPS فهرست‌شده در `gateway.controlUi.allowedOrigins` نیاز دارد.

    توکن Discord می‌تواند از یکی از این دو منبع تأمین شود:

    - متغیر محیطی `DISCORD_BOT_TOKEN` (برای secretها توصیه می‌شود)؛ نیازی به افزودن آن به پیکربندی نیست، Gateway آن را به‌طور خودکار می‌خواند
    - فایل پیکربندی `channels.discord.token`

    برای اعمال تغییرات، راه‌اندازی مجدد کنید:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="دسترسی به Gateway">
    ### رابط کنترل

    ```bash
    fly open
    ```

    یا به `https://my-openclaw.fly.dev/` مراجعه کنید.

    با secret مشترک پیکربندی‌شده احراز هویت کنید: توکن Gateway از `OPENCLAW_GATEWAY_TOKEN`، یا اگر احراز هویت را به گذرواژه تغییر داده‌اید، گذرواژه خودتان.

    ### گزارش‌ها

    ```bash
    fly logs              # گزارش‌های زنده
    fly logs --no-tail    # گزارش‌های اخیر
    ```

    ### کنسول SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## عیب‌یابی

### «برنامه روی نشانی موردانتظار گوش نمی‌دهد»

Gateway به‌جای `0.0.0.0` به `127.0.0.1` متصل شده است.

**راه‌حل:** `--bind lan` را به فرمان فرایند خود در `fly.toml` اضافه کنید.

### شکست بررسی‌های سلامت / رد اتصال

Fly نمی‌تواند روی پورت پیکربندی‌شده به Gateway دسترسی پیدا کند.

**راه‌حل:** مطمئن شوید `internal_port` با پورت Gateway (`--port 3000` یا `OPENCLAW_GATEWAY_PORT=3000`) مطابقت دارد.

### OOM / مشکلات حافظه

کانتینر پیوسته راه‌اندازی مجدد می‌شود یا از کار انداخته می‌شود. نشانه‌ها: `SIGABRT`، `v8::internal::Runtime_AllocateInYoungGeneration` یا راه‌اندازی‌های مجدد بدون پیام.

**راه‌حل:** حافظه را در `fly.toml` افزایش دهید:

```toml
[[vm]]
  memory = "2048mb"
```

یا یک ماشین موجود را به‌روزرسانی کنید:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB بسیار کم است. 1GB ممکن است کار کند، اما زیر بار یا با گزارش‌گیری پرجزئیات ممکن است دچار OOM شود. 2GB توصیه می‌شود.

### مشکلات قفل Gateway

پس از راه‌اندازی مجدد کانتینر، Gateway به‌دلیل خطاهای «از قبل در حال اجرا» از شروع خودداری می‌کند.

فایل‌های قفل زمان اجرا در `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
و `gateway.state.<hash>.lock` (در Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`) قرار دارند، نه روی volume پایدار `/data`؛ بنابراین
راه‌اندازی مجدد کامل کانتینر معمولاً آن‌ها را همراه با بقیه
سیستم فایل کانتینر پاک می‌کند. اگر قفلی باقی بماند (برای مثال یک `fly machine restart`
که سیستم فایل کانتینر را حفظ می‌کند) و جلوی راه‌اندازی را بگیرد، آن را
دستی حذف کنید:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### خوانده‌نشدن پیکربندی

`--allow-unconfigured` فقط محافظ راه‌اندازی را دور می‌زند. این گزینه `/data/openclaw.json` را ایجاد یا ترمیم نمی‌کند؛ بنابراین مطمئن شوید پیکربندی واقعی شما وجود دارد و برای راه‌اندازی عادی Gateway محلی شامل `"gateway": { "mode": "local" }` است.

وجود پیکربندی را بررسی کنید:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### نوشتن پیکربندی از طریق SSH

`fly ssh console -C` از تغییر مسیر پوسته پشتیبانی نمی‌کند. برای نوشتن فایل پیکربندی:

```bash
# echo + tee (ارسال از سیستم محلی به راه‌دور با pipe)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# یا sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

اگر فایل از قبل وجود داشته باشد، `fly sftp` ممکن است شکست بخورد؛ ابتدا آن را حذف کنید:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### پایدار نماندن وضعیت

اگر پس از راه‌اندازی مجدد، پروفایل‌های احراز هویت، وضعیت کانال/ارائه‌دهنده یا نشست‌ها را از دست می‌دهید، پوشه وضعیت به‌جای volume در سیستم فایل کانتینر نوشته می‌شود.

**راه‌حل:** مطمئن شوید `OPENCLAW_STATE_DIR=/data` در `fly.toml` تنظیم شده است و دوباره مستقر کنید.

## به‌روزرسانی

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` در اینجا مسیر تحت‌نظارت است: تصویر را از Dockerfile دوباره می‌سازد؛ بنابراین نسخه CLI/Gateway، تصویر سیستم‌عامل پایه و هرگونه تغییر Dockerfile همگی با هم به‌روزرسانی می‌شوند. اجرای `openclaw update` درون کانتینر در حال اجرا همان عملیات نیست، زیرا تصویر به‌صورت یک درخت `dist/` ساخته‌شده با Docker ارائه می‌شود و هیچ checkout از `.git` یا نصب سراسری مدیریت‌شده با npm ندارد که بتواند آن را تشخیص دهد؛ برای این جریان در نصب‌های مشابه VM به [به‌روزرسانی](/fa/install/updating) مراجعه کنید.

### به‌روزرسانی فرمان ماشین

برای تغییر فرمان راه‌اندازی بدون استقرار مجدد کامل:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# یا همراه با افزایش حافظه
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

اجرای بعدی `fly deploy` فرمان ماشین را به هرآنچه در `fly.toml` قرار دارد بازنشانی می‌کند؛ پس از استقرار مجدد، تغییرات دستی را دوباره اعمال کنید.

## استقرار خصوصی (سخت‌سازی‌شده)

به‌طور پیش‌فرض، Fly آدرس‌های IP عمومی اختصاص می‌دهد؛ بنابراین Gateway شما در `https://your-app.fly.dev` قابل‌دسترسی است و اسکنرهای اینترنتی (Shodan، Censys و غیره) می‌توانند آن را پیدا کنند.

برای استقرار سخت‌سازی‌شده با **بدون IP عمومی** از `deploy/fly.private.toml` استفاده کنید: این پیکربندی `[http_service]` را حذف می‌کند، بنابراین هیچ ورودی عمومی اختصاص داده نمی‌شود.

### چه زمانی از استقرار خصوصی استفاده شود

- فقط تماس‌ها/پیام‌های خروجی (بدون Webhook ورودی)
- تونل‌های ngrok یا Tailscale بازفراخوانی‌های Webhook را مدیریت می‌کنند
- دسترسی به Gateway به‌جای مرورگر از طریق SSH، پراکسی یا WireGuard انجام می‌شود
- استقرار باید از اسکنرهای اینترنتی پنهان باشد

### راه‌اندازی

```bash
fly deploy -c deploy/fly.private.toml
```

یا یک استقرار موجود را تبدیل کنید:

```bash
# فهرست‌کردن IPهای فعلی
fly ips list -a my-openclaw

# آزادکردن IPهای عمومی
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# تغییر به پیکربندی خصوصی تا استقرارهای آینده IP عمومی را دوباره تخصیص ندهند
fly deploy -c deploy/fly.private.toml

# تخصیص IPv6 صرفاً خصوصی
fly ips allocate-v6 --private -a my-openclaw
```

پس از این، `fly ips list` باید فقط یک IP از نوع `private` را نشان دهد:

```text
نسخه    IP                   نوع              منطقه
v6       fdaa:x:x:x:x::x      خصوصی            سراسری
```

### دسترسی به استقرار خصوصی

**گزینه ۱: پراکسی محلی (ساده‌ترین)**

```bash
fly proxy 3000:3000 -a my-openclaw
# بازکردن http://localhost:3000 در مرورگر
```

**گزینه ۲: VPN مبتنی بر WireGuard**

```bash
fly wireguard create
# در یک کارخواه WireGuard وارد کنید، سپس از طریق IPv6 داخلی دسترسی پیدا کنید
# نمونه: http://[fdaa:x:x:x:x::x]:3000
```

**گزینه ۳: فقط SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhookها در استقرار خصوصی

برای فراخوانی‌های برگشتی Webhook ‏(Twilio، Telnyx و غیره) بدون قرارگیری در معرض دسترسی عمومی:

1. **تونل ngrok**: ‏ngrok را داخل کانتینر یا به‌صورت یک سایدکار اجرا کنید
2. **Tailscale Funnel**: مسیرهای مشخصی را از طریق Tailscale در دسترس قرار دهید
3. **فقط خروجی**: برخی ارائه‌دهندگان (Twilio) برای تماس‌های خروجی بدون Webhook کار می‌کنند

نمونه پیکربندی تماس صوتی با ngrok، در `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

تونل ngrok داخل کانتینر اجرا می‌شود و بدون در معرض دسترسی عمومی قرار دادن خود برنامه Fly، یک نشانی عمومی Webhook فراهم می‌کند. `webhookSecurity.allowedHosts` را روی نام میزبان تونل تنظیم کنید تا سرآیندهای میزبانِ هدایت‌شده پذیرفته شوند.

### ملاحظات امنیتی

| جنبه                   | عمومی                 | خصوصی                 |
| ---------------------- | --------------------- | --------------------- |
| پویشگرهای اینترنتی     | قابل‌شناسایی          | پنهان                 |
| حملات مستقیم           | ممکن                  | مسدود                 |
| دسترسی به رابط کنترل   | مرورگر                | پراکسی/VPN            |
| تحویل Webhook          | مستقیم                | از طریق تونل          |

## نکات

- Fly.io از معماری x86 استفاده می‌کند؛ Dockerfile با هر دو معماری x86 و ARM سازگار است.
- برای راه‌اندازی اولیه WhatsApp/Telegram، از `fly ssh console` استفاده کنید.
- داده‌های پایدار در جلد واقع در `/data` نگهداری می‌شوند.
- Signal به signal-cli (یک CLI مبتنی بر Java) در ایمیج نیاز دارد؛ از یک ایمیج سفارشی استفاده کنید و حافظه را روی 2GB یا بیشتر نگه دارید.

## هزینه

با پیکربندی توصیه‌شده (`shared-cpu-2x`، 2GB RAM)، بسته به میزان استفاده، هزینه‌ای حدود $10-15/month پیش‌بینی می‌شود؛ سطح رایگان بخشی از سهمیه پایه را پوشش می‌دهد. برای نرخ‌های فعلی، [قیمت‌گذاری Fly.io](https://fly.io/docs/about/pricing/) را ببینید.

## گام‌های بعدی

- کانال‌های پیام‌رسانی را راه‌اندازی کنید: [کانال‌ها](/fa/channels)
- Gateway را پیکربندی کنید: [پیکربندی Gateway](/fa/gateway/configuration)
- OpenClaw را به‌روز نگه دارید: [به‌روزرسانی](/fa/install/updating)

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Hetzner](/fa/install/hetzner)
- [Docker](/fa/install/docker)
- [میزبانی VPS](/fa/vps)
