---
read_when:
    - استقرار OpenClaw روی Fly.io
    - راه‌اندازی ولوم‌ها، رازها و پیکربندی اجرای نخست در Fly
summary: استقرار گام‌به‌گام OpenClaw روی Fly.io با ذخیره‌سازی پایدار و HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-29T23:03:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 195a77c4cec439dc2b5030f5ee618274df76b16d878b8d16e65a754e4bd8072c
    source_path: install/fly.md
    workflow: 16
---

# استقرار Fly.io

**هدف:** اجرای OpenClaw Gateway روی یک ماشین [Fly.io](https://fly.io) با ذخیره‌سازی پایدار، HTTPS خودکار، و دسترسی به Discord/کانال.

## آنچه نیاز دارید

- نصب بودن [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- حساب Fly.io (سطح رایگان هم کافی است)
- احراز هویت مدل: کلید API برای ارائه‌دهنده مدل انتخابی شما
- اعتبارنامه‌های کانال: توکن بات Discord، توکن Telegram، و غیره

## مسیر سریع برای مبتدیان

1. مخزن را کلون کنید ← `fly.toml` را سفارشی کنید
2. برنامه + ولوم بسازید ← مقادیر محرمانه را تنظیم کنید
3. با `fly deploy` مستقر کنید
4. برای ساخت config با SSH وارد شوید یا از رابط کاربری کنترل استفاده کنید

<Steps>
  <Step title="Create the Fly app">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **نکته:** منطقه‌ای نزدیک به خودتان انتخاب کنید. گزینه‌های رایج: `lhr` (لندن)، `iad` (ویرجینیا)، `sjc` (سن‌خوزه).

  </Step>

  <Step title="Configure fly.toml">
    `fly.toml` را ویرایش کنید تا با نام برنامه و نیازهای شما مطابقت داشته باشد.

    **نکته امنیتی:** config پیش‌فرض یک URL عمومی را در معرض دسترس قرار می‌دهد. برای استقرار سخت‌سازی‌شده بدون IP عمومی، [استقرار خصوصی](#private-deployment-hardened) را ببینید یا از `fly.private.toml` استفاده کنید.

    ```toml
    app = "my-openclaw"  # Your app name
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

    **تنظیمات کلیدی:**

    | تنظیم                          | دلیل                                                                              |
    | ------------------------------ | --------------------------------------------------------------------------------- |
    | `--bind lan`                   | به `0.0.0.0` متصل می‌شود تا پراکسی Fly بتواند به Gateway برسد                     |
    | `--allow-unconfigured`         | بدون فایل config شروع می‌شود (بعدا آن را می‌سازید)                                |
    | `internal_port = 3000`         | برای health checkهای Fly باید با `--port 3000` (یا `OPENCLAW_GATEWAY_PORT`) یکی باشد |
    | `memory = "2048mb"`            | 512MB بسیار کم است؛ 2GB توصیه می‌شود                                               |
    | `OPENCLAW_STATE_DIR = "/data"` | وضعیت را روی ولوم پایدار نگه می‌دارد                                               |

  </Step>

  <Step title="Set secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **یادداشت‌ها:**

    - اتصال‌های غیرلوپ‌بک (`--bind lan`) به یک مسیر معتبر احراز هویت Gateway نیاز دارند. این نمونه Fly.io از `OPENCLAW_GATEWAY_TOKEN` استفاده می‌کند، اما `gateway.auth.password` یا یک استقرار غیرلوپ‌بک `trusted-proxy` که درست پیکربندی شده باشد نیز این نیاز را برآورده می‌کند.
    - با این توکن‌ها مثل گذرواژه رفتار کنید.
    - **برای همه کلیدهای API و توکن‌ها، متغیرهای محیطی را به فایل config ترجیح دهید**. این کار secrets را بیرون از `openclaw.json` نگه می‌دارد تا ناخواسته افشا یا لاگ نشوند.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    استقرار اول تصویر Docker را می‌سازد (حدود ۲ تا ۳ دقیقه). استقرارهای بعدی سریع‌تر هستند.

    پس از استقرار، بررسی کنید:

    ```bash
    fly status
    fly logs
    ```

    باید ببینید:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Create config file">
    برای ساخت یک config مناسب، با SSH وارد ماشین شوید:

    ```bash
    fly ssh console
    ```

    دایرکتوری و فایل config را بسازید:

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

    **نکته:** با `OPENCLAW_STATE_DIR=/data`، مسیر config برابر `/data/openclaw.json` است.

    **نکته:** `https://my-openclaw.fly.dev` را با origin واقعی برنامه Fly خودتان جایگزین کنید. راه‌اندازی Gateway، originهای محلی رابط کاربری کنترل را از مقادیر زمان اجرای `--bind` و `--port` مقداردهی اولیه می‌کند تا بوت اول پیش از وجود config ادامه پیدا کند، اما دسترسی مرورگر از طریق Fly همچنان به origin دقیق HTTPS فهرست‌شده در `gateway.controlUi.allowedOrigins` نیاز دارد.

    **نکته:** توکن Discord می‌تواند از یکی از این دو منبع بیاید:

    - متغیر محیطی: `DISCORD_BOT_TOKEN` (برای secrets توصیه می‌شود)
    - فایل config: `channels.discord.token`

    اگر از متغیر محیطی استفاده می‌کنید، نیازی نیست توکن را به config اضافه کنید. Gateway به‌طور خودکار `DISCORD_BOT_TOKEN` را می‌خواند.

    برای اعمال، راه‌اندازی مجدد کنید:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### رابط کاربری کنترل

    در مرورگر باز کنید:

    ```bash
    fly open
    ```

    یا به `https://my-openclaw.fly.dev/` بروید

    با secret مشترک پیکربندی‌شده احراز هویت کنید. این راهنما از توکن Gateway در `OPENCLAW_GATEWAY_TOKEN` استفاده می‌کند؛ اگر به احراز هویت با گذرواژه تغییر داده‌اید، به‌جای آن از همان گذرواژه استفاده کنید.

    ### لاگ‌ها

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### کنسول SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## عیب‌یابی

### «برنامه در نشانی مورد انتظار گوش نمی‌دهد»

Gateway به‌جای `0.0.0.0` به `127.0.0.1` متصل شده است.

**رفع مشکل:** `--bind lan` را به فرمان process خود در `fly.toml` اضافه کنید.

### خطای health checkها / رد شدن اتصال

Fly نمی‌تواند روی پورت پیکربندی‌شده به Gateway برسد.

**رفع مشکل:** مطمئن شوید `internal_port` با پورت Gateway یکی است (`--port 3000` یا `OPENCLAW_GATEWAY_PORT=3000` را تنظیم کنید).

### OOM / مشکلات حافظه

کانتینر مدام راه‌اندازی مجدد می‌شود یا کشته می‌شود. نشانه‌ها: `SIGABRT`، `v8::internal::Runtime_AllocateInYoungGeneration`، یا راه‌اندازی‌های مجدد بی‌صدا.

**رفع مشکل:** حافظه را در `fly.toml` افزایش دهید:

```toml
[[vm]]
  memory = "2048mb"
```

یا یک ماشین موجود را به‌روزرسانی کنید:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**نکته:** 512MB بسیار کم است. 1GB ممکن است کار کند، اما زیر بار یا با لاگ‌گیری مفصل ممکن است دچار OOM شود. **2GB توصیه می‌شود.**

### مشکلات قفل Gateway

Gateway با خطاهای «از قبل در حال اجراست» از شروع شدن خودداری می‌کند.

این زمانی رخ می‌دهد که کانتینر راه‌اندازی مجدد می‌شود اما فایل قفل PID روی ولوم باقی می‌ماند.

**رفع مشکل:** فایل قفل را حذف کنید:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

فایل قفل در `/data/gateway.*.lock` قرار دارد (نه در یک زیردایرکتوری).

### config خوانده نمی‌شود

`--allow-unconfigured` فقط guard راه‌اندازی را دور می‌زند. این گزینه `/data/openclaw.json` را ایجاد یا تعمیر نمی‌کند، بنابراین وقتی می‌خواهید یک Gateway محلی عادی شروع شود، مطمئن شوید config واقعی شما وجود دارد و شامل `gateway.mode="local"` است.

وجود config را بررسی کنید:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### نوشتن config از طریق SSH

فرمان `fly ssh console -C` از redirection پوسته پشتیبانی نمی‌کند. برای نوشتن فایل config:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**نکته:** اگر فایل از قبل وجود داشته باشد، `fly sftp` ممکن است شکست بخورد. ابتدا حذف کنید:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### وضعیت پایدار نمی‌ماند

اگر پس از راه‌اندازی مجدد، پروفایل‌های احراز هویت، وضعیت کانال/ارائه‌دهنده، یا نشست‌ها را از دست می‌دهید، دایرکتوری وضعیت در فایل‌سیستم کانتینر نوشته می‌شود.

**رفع مشکل:** مطمئن شوید `OPENCLAW_STATE_DIR=/data` در `fly.toml` تنظیم شده است و دوباره مستقر کنید.

## به‌روزرسانی‌ها

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### به‌روزرسانی فرمان ماشین

اگر لازم است فرمان راه‌اندازی را بدون استقرار کامل تغییر دهید:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**نکته:** پس از `fly deploy`، فرمان ماشین ممکن است به چیزی که در `fly.toml` است بازنشانی شود. اگر تغییرات دستی انجام داده‌اید، پس از deploy دوباره آن‌ها را اعمال کنید.

## استقرار خصوصی (سخت‌سازی‌شده)

به‌صورت پیش‌فرض، Fly IPهای عمومی اختصاص می‌دهد و Gateway شما را در `https://your-app.fly.dev` در دسترس قرار می‌دهد. این راحت است، اما یعنی استقرار شما برای اسکنرهای اینترنتی (Shodan، Censys و غیره) قابل کشف است.

برای استقرار سخت‌سازی‌شده با **بدون مواجهه عمومی**، از قالب خصوصی استفاده کنید.

### چه زمانی از استقرار خصوصی استفاده کنیم

- فقط تماس‌ها/پیام‌های **خروجی** برقرار می‌کنید (بدون Webhookهای ورودی)
- برای هر callback مربوط به Webhook از تونل‌های **ngrok یا Tailscale** استفاده می‌کنید
- به‌جای مرورگر، از طریق **SSH، پراکسی، یا WireGuard** به Gateway دسترسی دارید
- می‌خواهید استقرار از اسکنرهای اینترنتی **پنهان** باشد

### راه‌اندازی

به‌جای config استاندارد از `fly.private.toml` استفاده کنید:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

یا یک استقرار موجود را تبدیل کنید:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

پس از این، `fly ips list` باید فقط یک IP با نوع `private` نشان دهد:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### دسترسی به استقرار خصوصی

از آنجا که URL عمومی وجود ندارد، از یکی از این روش‌ها استفاده کنید:

**گزینه ۱: پراکسی محلی (ساده‌ترین)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**گزینه ۲: WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**گزینه ۳: فقط SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhookها با استقرار خصوصی

اگر به callbackهای Webhook (Twilio، Telnyx و غیره) بدون در معرض عموم قرار دادن نیاز دارید:

1. **تونل ngrok** - ngrok را داخل container یا به‌صورت sidecar اجرا کنید
2. **Tailscale Funnel** - مسیرهای مشخص را از طریق Tailscale در دسترس قرار دهید
3. **فقط خروجی** - برخی providerها (Twilio) برای تماس‌های خروجی بدون Webhookها به‌خوبی کار می‌کنند

نمونه پیکربندی تماس صوتی با ngrok:

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

تونل ngrok داخل container اجرا می‌شود و بدون در معرض عموم قرار دادن خود برنامه Fly، یک URL عمومی برای Webhook فراهم می‌کند. `webhookSecurity.allowedHosts` را روی hostname عمومی تونل تنظیم کنید تا headerهای host فورواردشده پذیرفته شوند.

### مزایای امنیتی

| جنبه               | عمومی          | خصوصی          |
| ------------------ | -------------- | -------------- |
| اسکنرهای اینترنتی | قابل کشف       | پنهان          |
| حملات مستقیم      | ممکن           | مسدود          |
| دسترسی Control UI | مرورگر         | Proxy/VPN      |
| تحویل Webhook     | مستقیم         | از طریق تونل   |

## نکات

- Fly.io از **معماری x86** استفاده می‌کند (نه ARM)
- Dockerfile با هر دو معماری سازگار است
- برای راه‌اندازی اولیه WhatsApp/Telegram، از `fly ssh console` استفاده کنید
- داده‌های پایدار روی volume در `/data` قرار دارند
- Signal به Java + signal-cli نیاز دارد؛ از یک تصویر سفارشی استفاده کنید و حافظه را روی ۲GB+ نگه دارید.

## هزینه

با پیکربندی پیشنهادی (`shared-cpu-2x`، ۲GB RAM):

- حدود ۱۰ تا ۱۵ دلار در ماه، بسته به میزان استفاده
- سطح رایگان شامل مقداری سهمیه است

برای جزئیات، [قیمت‌گذاری Fly.io](https://fly.io/docs/about/pricing/) را ببینید.

## گام‌های بعدی

- کانال‌های پیام‌رسانی را راه‌اندازی کنید: [کانال‌ها](/fa/channels)
- Gateway را پیکربندی کنید: [پیکربندی Gateway](/fa/gateway/configuration)
- OpenClaw را به‌روز نگه دارید: [به‌روزرسانی](/fa/install/updating)

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Hetzner](/fa/install/hetzner)
- [Docker](/fa/install/docker)
- [میزبانی VPS](/fa/vps)
