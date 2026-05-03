---
read_when:
    - استقرار OpenClaw روی Fly.io
    - راه‌اندازی حجم‌های Fly، رازها و پیکربندی اجرای نخست
summary: استقرار گام‌به‌گام Fly.io برای OpenClaw با ذخیره‌سازی پایدار و HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-05-03T21:36:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9b98b2d1c102195e31ee7e93ba075e6cfa16080e78f8e17fc006a62d300ce1a
    source_path: install/fly.md
    workflow: 16
---

# استقرار روی Fly.io

**هدف:** اجرای OpenClaw Gateway روی یک ماشین [Fly.io](https://fly.io) با فضای ذخیره‌سازی پایدار، HTTPS خودکار، و دسترسی Discord/کانال.

## آنچه نیاز دارید

- نصب بودن [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- حساب Fly.io (سطح رایگان هم کار می‌کند)
- احراز هویت مدل: کلید API برای ارائه‌دهنده مدل انتخابی شما
- اعتبارنامه‌های کانال: توکن ربات Discord، توکن Telegram، و غیره.

## مسیر سریع برای مبتدیان

1. مخزن را clone کنید ← `fly.toml` را سفارشی کنید
2. برنامه + volume بسازید ← secrets را تنظیم کنید
3. با `fly deploy` مستقر کنید
4. برای ساخت config با SSH وارد شوید یا از Control UI استفاده کنید

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

    **نکته:** منطقه‌ای نزدیک به خودتان انتخاب کنید. گزینه‌های رایج: `lhr` (لندن)، `iad` (ویرجینیا)، `sjc` (سن خوزه).

  </Step>

  <Step title="Configure fly.toml">
    `fly.toml` را مطابق نام برنامه و نیازهایتان ویرایش کنید.

    **نکته امنیتی:** config پیش‌فرض یک URL عمومی را در دسترس قرار می‌دهد. برای استقرار مقاوم‌تر بدون IP عمومی، [استقرار خصوصی](#private-deployment-hardened) را ببینید یا از `deploy/fly.private.toml` استفاده کنید.

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

    | تنظیم                         | دلیل                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | به `0.0.0.0` متصل می‌شود تا proxy مربوط به Fly بتواند به Gateway برسد       |
    | `--allow-unconfigured`         | بدون فایل config شروع می‌شود (بعدا یکی می‌سازید)                            |
    | `internal_port = 3000`         | برای health checkهای Fly باید با `--port 3000` (یا `OPENCLAW_GATEWAY_PORT`) مطابقت داشته باشد |
    | `memory = "2048mb"`            | 512MB بسیار کم است؛ 2GB توصیه می‌شود                                        |
    | `OPENCLAW_STATE_DIR = "/data"` | state را روی volume پایدار نگه می‌دارد                                      |

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

    - اتصال‌های غیر loopback (`--bind lan`) به یک مسیر معتبر احراز هویت Gateway نیاز دارند. این مثال Fly.io از `OPENCLAW_GATEWAY_TOKEN` استفاده می‌کند، اما `gateway.auth.password` یا یک استقرار `trusted-proxy` غیر loopback که درست پیکربندی شده باشد نیز این نیاز را برآورده می‌کند.
    - با این توکن‌ها مانند گذرواژه رفتار کنید.
    - **برای همه کلیدهای API و توکن‌ها، env varها را به فایل config ترجیح دهید**. این کار secrets را بیرون از `openclaw.json` نگه می‌دارد تا به‌صورت تصادفی افشا یا log نشوند.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    نخستین استقرار image مربوط به Docker را می‌سازد (حدود 2-3 دقیقه). استقرارهای بعدی سریع‌تر هستند.

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

    پوشه و فایل config را بسازید:

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

    **یادداشت:** با `OPENCLAW_STATE_DIR=/data`، مسیر config برابر `/data/openclaw.json` است.

    **یادداشت:** `https://my-openclaw.fly.dev` را با origin واقعی برنامه Fly خود جایگزین کنید. شروع Gateway، originهای محلی Control UI را از مقادیر زمان اجرا یعنی `--bind` و `--port` seed می‌کند تا نخستین boot پیش از وجود config هم بتواند ادامه پیدا کند، اما دسترسی مرورگر از طریق Fly همچنان نیاز دارد origin دقیق HTTPS در `gateway.controlUi.allowedOrigins` فهرست شده باشد.

    **یادداشت:** توکن Discord می‌تواند از هرکدام از این‌ها بیاید:

    - متغیر محیطی: `DISCORD_BOT_TOKEN` (برای secrets توصیه می‌شود)
    - فایل config: `channels.discord.token`

    اگر از env var استفاده می‌کنید، نیازی نیست توکن را به config اضافه کنید. Gateway به‌طور خودکار `DISCORD_BOT_TOKEN` را می‌خواند.

    برای اعمال، راه‌اندازی مجدد کنید:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### Control UI

    در مرورگر باز کنید:

    ```bash
    fly open
    ```

    یا به `https://my-openclaw.fly.dev/` بروید

    با secret مشترک پیکربندی‌شده احراز هویت کنید. این راهنما از توکن Gateway موجود در `OPENCLAW_GATEWAY_TOKEN` استفاده می‌کند؛ اگر به احراز هویت با گذرواژه تغییر داده‌اید، به‌جای آن از همان گذرواژه استفاده کنید.

    ### Logها

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

### «برنامه روی نشانی مورد انتظار گوش نمی‌دهد»

Gateway به‌جای `0.0.0.0` به `127.0.0.1` متصل شده است.

**رفع:** `--bind lan` را به فرمان process خود در `fly.toml` اضافه کنید.

### Health checkها ناموفق هستند / اتصال رد می‌شود

Fly نمی‌تواند روی پورت پیکربندی‌شده به Gateway برسد.

**رفع:** مطمئن شوید `internal_port` با پورت Gateway مطابقت دارد (`--port 3000` یا `OPENCLAW_GATEWAY_PORT=3000` را تنظیم کنید).

### مشکلات OOM / حافظه

Container مدام restart می‌شود یا kill می‌شود. نشانه‌ها: `SIGABRT`، `v8::internal::Runtime_AllocateInYoungGeneration`، یا restartهای بی‌صدا.

**رفع:** حافظه را در `fly.toml` افزایش دهید:

```toml
[[vm]]
  memory = "2048mb"
```

یا یک ماشین موجود را به‌روزرسانی کنید:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**یادداشت:** 512MB بسیار کم است. 1GB ممکن است کار کند، اما زیر بار یا با logging پرجزئیات می‌تواند دچار OOM شود. **2GB توصیه می‌شود.**

### مشکلات lock در Gateway

Gateway با خطاهای «already running» از شروع خودداری می‌کند.

این زمانی رخ می‌دهد که container restart می‌شود اما فایل PID lock روی volume باقی می‌ماند.

**رفع:** فایل lock را حذف کنید:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

فایل lock در `/data/gateway.*.lock` است (نه در یک زیرپوشه).

### Config خوانده نمی‌شود

`--allow-unconfigured` فقط guard زمان شروع را دور می‌زند. این گزینه `/data/openclaw.json` را ایجاد یا repair نمی‌کند، پس مطمئن شوید config واقعی شما وجود دارد و وقتی یک شروع عادی Gateway محلی می‌خواهید، شامل `gateway.mode="local"` است.

وجود config را بررسی کنید:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### نوشتن config از طریق SSH

فرمان `fly ssh console -C` از redirection شل پشتیبانی نمی‌کند. برای نوشتن فایل config:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**یادداشت:** اگر فایل از قبل وجود داشته باشد، `fly sftp` ممکن است شکست بخورد. ابتدا حذف کنید:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### State پایدار نمی‌ماند

اگر پس از restart، auth profileها، state کانال/ارائه‌دهنده، یا sessionها را از دست می‌دهید، state dir در filesystem خود container نوشته می‌شود.

**رفع:** مطمئن شوید `OPENCLAW_STATE_DIR=/data` در `fly.toml` تنظیم شده است و دوباره مستقر کنید.

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

اگر لازم است فرمان startup را بدون استقرار کامل تغییر دهید:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**یادداشت:** پس از `fly deploy`، فرمان ماشین ممکن است به آنچه در `fly.toml` است بازنشانی شود. اگر تغییرات دستی داده‌اید، پس از deploy دوباره آن‌ها را اعمال کنید.

## استقرار خصوصی (مقاوم‌تر)

به‌صورت پیش‌فرض، Fly برای شما IPهای عمومی اختصاص می‌دهد و Gateway شما را در `https://your-app.fly.dev` در دسترس قرار می‌دهد. این راحت است، اما یعنی استقرار شما برای اسکنرهای اینترنتی (Shodan، Censys، و غیره) قابل کشف است.

برای استقراری مقاوم‌تر با **بدون در معرض قرارگیری عمومی**، از قالب خصوصی استفاده کنید.

### چه زمانی از استقرار خصوصی استفاده کنید

- فقط تماس‌ها/پیام‌های **خروجی** می‌فرستید (Webhook ورودی ندارید)
- برای هر callback مربوط به Webhook از تونل‌های **ngrok یا Tailscale** استفاده می‌کنید
- به‌جای مرورگر، از طریق **SSH، proxy، یا WireGuard** به Gateway دسترسی دارید
- می‌خواهید استقرار از اسکنرهای اینترنتی **پنهان** باشد

### راه‌اندازی

به‌جای config استاندارد از `deploy/fly.private.toml` استفاده کنید:

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
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
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

پس از این، `fly ips list` باید فقط یک IP با نوع `private` نشان دهد:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### دسترسی به یک استقرار خصوصی

از آنجا که URL عمومی وجود ندارد، از یکی از این روش‌ها استفاده کنید:

**گزینه 1: proxy محلی (ساده‌ترین)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**گزینه 2: VPN WireGuard**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**گزینه 3: فقط SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhookها با استقرار خصوصی

اگر به فراخوانی‌های برگشتی Webhook (Twilio، Telnyx و غیره) بدون قرارگیری در معرض عموم نیاز دارید:

1. **تونل ngrok** - ngrok را داخل کانتینر یا به‌صورت sidecar اجرا کنید
2. **Tailscale Funnel** - مسیرهای مشخصی را از طریق Tailscale در دسترس قرار دهید
3. **فقط خروجی** - برخی ارائه‌دهندگان (Twilio) برای تماس‌های خروجی بدون Webhook به‌خوبی کار می‌کنند

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

تونل ngrok داخل کانتینر اجرا می‌شود و بدون اینکه خود برنامه Fly را در معرض عموم قرار دهد، یک URL عمومی برای Webhook فراهم می‌کند. `webhookSecurity.allowedHosts` را روی نام میزبان عمومی تونل تنظیم کنید تا سرآیندهای host ارسال‌شده پذیرفته شوند.

### مزایای امنیتی

| جنبه                 | عمومی            | خصوصی          |
| -------------------- | ---------------- | -------------- |
| اسکنرهای اینترنت     | قابل کشف         | پنهان          |
| حملات مستقیم         | ممکن             | مسدود          |
| دسترسی رابط کنترل    | مرورگر           | پروکسی/VPN     |
| تحویل Webhook        | مستقیم           | از طریق تونل   |

## یادداشت‌ها

- Fly.io از **معماری x86** استفاده می‌کند (نه ARM)
- Dockerfile با هر دو معماری سازگار است
- برای راه‌اندازی اولیه WhatsApp/Telegram، از `fly ssh console` استفاده کنید
- داده‌های پایدار روی volume در `/data` قرار دارند
- Signal به Java + signal-cli نیاز دارد؛ از یک image سفارشی استفاده کنید و حافظه را روی ۲GB+ نگه دارید.

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
