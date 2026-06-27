---
read_when:
    - استقرار OpenClaw روی Fly.io
    - راه‌اندازی volumeهای Fly، secretها، و پیکربندی اجرای نخست
summary: استقرار گام‌به‌گام Fly.io برای OpenClaw با ذخیره‌سازی پایدار و HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-06-27T17:58:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d74dbda6177ab279a59de720cf4e88a15aa90798e5f04e87712c99093282a1e
    source_path: install/fly.md
    workflow: 16
---

**هدف:** اجرای OpenClaw Gateway روی یک ماشین [Fly.io](https://fly.io) با ذخیره‌سازی پایدار، HTTPS خودکار، و دسترسی Discord/کانال.

## آنچه نیاز دارید

- نصب بودن [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- حساب Fly.io (سطح رایگان هم کافی است)
- احراز هویت مدل: کلید API برای ارائه‌دهنده مدل انتخابی شما
- اعتبارنامه‌های کانال: توکن ربات Discord، توکن Telegram، و غیره.

## مسیر سریع برای مبتدیان

1. مخزن را کلون کنید → `fly.toml` را سفارشی کنید
2. برنامه + حجم را بسازید → secretها را تنظیم کنید
3. با `fly deploy` استقرار دهید
4. با SSH وارد شوید تا پیکربندی بسازید یا از Control UI استفاده کنید

<Steps>
  <Step title="ساخت برنامه Fly">
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

  <Step title="پیکربندی fly.toml">
    `fly.toml` را ویرایش کنید تا با نام برنامه و نیازهای شما هماهنگ شود.

    **نکته امنیتی:** پیکربندی پیش‌فرض یک URL عمومی را در معرض قرار می‌دهد. برای استقرار سخت‌گیرانه‌تر بدون IP عمومی، [استقرار خصوصی](#private-deployment-hardened) را ببینید یا از `deploy/fly.private.toml` استفاده کنید.

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

    تصویر Docker مربوط به OpenClaw از `tini` به‌عنوان entrypoint خود استفاده می‌کند. فرمان‌های فرایند Fly، `CMD` در Docker را بدون جایگزین کردن `ENTRYPOINT` عوض می‌کنند، بنابراین فرایند همچنان زیر `tini` اجرا می‌شود.

    **تنظیمات کلیدی:**

    | تنظیم                        | دلیل                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | به `0.0.0.0` متصل می‌شود تا پراکسی Fly بتواند به Gateway برسد                     |
    | `--allow-unconfigured`         | بدون فایل پیکربندی شروع می‌شود (بعدا یکی می‌سازید)                      |
    | `internal_port = 3000`         | برای بررسی‌های سلامت Fly باید با `--port 3000` (یا `OPENCLAW_GATEWAY_PORT`) مطابقت داشته باشد |
    | `memory = "2048mb"`            | 512 مگابایت خیلی کم است؛ 2 گیگابایت توصیه می‌شود                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | وضعیت را روی volume پایدار نگه می‌دارد                                                |

  </Step>

  <Step title="تنظیم secretها">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    **یادداشت‌ها:**

    - اتصال‌های غیر loopback (`--bind lan`) به یک مسیر معتبر احراز هویت Gateway نیاز دارند. این نمونه Fly.io از `OPENCLAW_GATEWAY_TOKEN` استفاده می‌کند، اما `gateway.auth.password` یا یک استقرار `trusted-proxy` غیر loopback که درست پیکربندی شده باشد نیز این نیاز را برآورده می‌کند.
    - با این توکن‌ها مثل گذرواژه رفتار کنید.
    - **برای همه کلیدهای API و توکن‌ها، env varها را به فایل پیکربندی ترجیح دهید**. این کار secretها را از `openclaw.json` دور نگه می‌دارد، جایی که ممکن است تصادفی افشا یا ثبت شوند.

  </Step>

  <Step title="استقرار">
    ```bash
    fly deploy
    ```

    نخستین استقرار تصویر Docker را می‌سازد (حدود 2 تا 3 دقیقه). استقرارهای بعدی سریع‌تر هستند.

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

  <Step title="ساخت فایل پیکربندی">
    با SSH وارد ماشین شوید تا یک پیکربندی مناسب بسازید:

    ```bash
    fly ssh console
    ```

    دایرکتوری و فایل پیکربندی را بسازید:

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

    **یادداشت:** با `OPENCLAW_STATE_DIR=/data`، مسیر پیکربندی `/data/openclaw.json` است.

    **یادداشت:** `https://my-openclaw.fly.dev` را با origin واقعی برنامه Fly خود جایگزین کنید. راه‌اندازی Gateway، originهای محلی Control UI را از مقادیر زمان اجرا `--bind` و `--port` مقداردهی اولیه می‌کند تا نخستین بوت بتواند پیش از وجود پیکربندی ادامه پیدا کند، اما دسترسی مرورگر از طریق Fly همچنان نیاز دارد origin دقیق HTTPS در `gateway.controlUi.allowedOrigins` فهرست شده باشد.

    **یادداشت:** توکن Discord می‌تواند از یکی از این دو منبع بیاید:

    - متغیر محیطی: `DISCORD_BOT_TOKEN` (برای secretها توصیه می‌شود)
    - فایل پیکربندی: `channels.discord.token`

    اگر از env var استفاده می‌کنید، نیازی نیست توکن را به پیکربندی اضافه کنید. Gateway به‌طور خودکار `DISCORD_BOT_TOKEN` را می‌خواند.

    برای اعمال، راه‌اندازی مجدد کنید:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="دسترسی به Gateway">
    ### Control UI

    در مرورگر باز کنید:

    ```bash
    fly open
    ```

    یا به `https://my-openclaw.fly.dev/` بروید

    با secret مشترک پیکربندی‌شده احراز هویت کنید. این راهنما از توکن Gateway از `OPENCLAW_GATEWAY_TOKEN` استفاده می‌کند؛ اگر به احراز هویت با گذرواژه تغییر داده‌اید، همان گذرواژه را استفاده کنید.

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

### «برنامه روی آدرس مورد انتظار در حال گوش دادن نیست»

Gateway به‌جای `0.0.0.0` به `127.0.0.1` متصل شده است.

**راه‌حل:** `--bind lan` را به فرمان فرایند خود در `fly.toml` اضافه کنید.

### بررسی‌های سلامت ناموفق هستند / اتصال رد شد

Fly نمی‌تواند روی پورت پیکربندی‌شده به Gateway برسد.

**راه‌حل:** مطمئن شوید `internal_port` با پورت Gateway مطابقت دارد (`--port 3000` یا `OPENCLAW_GATEWAY_PORT=3000` را تنظیم کنید).

### OOM / مشکلات حافظه

کانتینر مدام راه‌اندازی مجدد می‌شود یا کشته می‌شود. نشانه‌ها: `SIGABRT`، `v8::internal::Runtime_AllocateInYoungGeneration`، یا راه‌اندازی‌های مجدد بی‌صدا.

**راه‌حل:** حافظه را در `fly.toml` افزایش دهید:

```toml
[[vm]]
  memory = "2048mb"
```

یا یک ماشین موجود را به‌روزرسانی کنید:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**یادداشت:** 512 مگابایت خیلی کم است. 1 گیگابایت ممکن است کار کند، اما زیر بار یا با لاگ‌گیری مفصل ممکن است دچار OOM شود. **2 گیگابایت توصیه می‌شود.**

### مشکلات قفل Gateway

Gateway با خطاهای «already running» از شروع شدن خودداری می‌کند.

این زمانی رخ می‌دهد که کانتینر راه‌اندازی مجدد می‌شود اما فایل قفل PID روی volume باقی می‌ماند.

**راه‌حل:** فایل قفل را حذف کنید:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

فایل قفل در `/data/gateway.*.lock` قرار دارد (نه در یک زیردایرکتوری).

### پیکربندی خوانده نمی‌شود

`--allow-unconfigured` فقط guard راه‌اندازی را دور می‌زند. این گزینه `/data/openclaw.json` را نمی‌سازد یا تعمیر نمی‌کند، بنابراین مطمئن شوید پیکربندی واقعی شما وجود دارد و وقتی یک شروع معمولی Gateway محلی می‌خواهید، شامل `gateway.mode="local"` است.

وجود پیکربندی را بررسی کنید:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### نوشتن پیکربندی از طریق SSH

فرمان `fly ssh console -C` از redirection شل پشتیبانی نمی‌کند. برای نوشتن یک فایل پیکربندی:

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

### وضعیت پایدار نمی‌ماند

اگر پس از راه‌اندازی مجدد، پروفایل‌های احراز هویت، وضعیت کانال/ارائه‌دهنده، یا sessionها را از دست می‌دهید، دایرکتوری وضعیت روی فایل‌سیستم کانتینر نوشته می‌شود.

**راه‌حل:** مطمئن شوید `OPENCLAW_STATE_DIR=/data` در `fly.toml` تنظیم شده است و دوباره استقرار دهید.

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

**یادداشت:** پس از `fly deploy`، فرمان ماشین ممکن است به چیزی که در `fly.toml` است بازنشانی شود. اگر تغییرات دستی انجام داده‌اید، پس از استقرار دوباره آن‌ها را اعمال کنید.

## استقرار خصوصی (سخت‌گیرانه)

به‌طور پیش‌فرض، Fly IPهای عمومی اختصاص می‌دهد و Gateway شما را در `https://your-app.fly.dev` در دسترس قرار می‌دهد. این راحت است، اما یعنی استقرار شما توسط اسکنرهای اینترنتی (Shodan، Censys، و غیره) قابل کشف است.

برای یک استقرار سخت‌گیرانه‌تر با **بدون در معرض‌گذاری عمومی**، از الگوی خصوصی استفاده کنید.

### چه زمانی از استقرار خصوصی استفاده کنید

- فقط تماس‌ها/پیام‌های **خروجی** انجام می‌دهید (بدون Webhook ورودی)
- از تونل‌های **ngrok یا Tailscale** برای هر callback مربوط به Webhook استفاده می‌کنید
- به‌جای مرورگر از طریق **SSH، پراکسی، یا WireGuard** به Gateway دسترسی دارید
- می‌خواهید استقرار از اسکنرهای اینترنتی **پنهان** باشد

### راه‌اندازی

به‌جای پیکربندی استاندارد، از `deploy/fly.private.toml` استفاده کنید:

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

پس از این، `fly ips list` باید فقط یک IP از نوع `private` نشان دهد:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### دسترسی به استقرار خصوصی

از آنجا که URL عمومی وجود ندارد، از یکی از این روش‌ها استفاده کنید:

**گزینه 1: پراکسی محلی (ساده‌ترین)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**گزینه ۲: VPN WireGuard**

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

اگر به callbackهای Webhook (Twilio، Telnyx و غیره) بدون در معرض عموم قرار گرفتن نیاز دارید:

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

تونل ngrok داخل کانتینر اجرا می‌شود و بدون افشای خود برنامه Fly، یک URL عمومی برای Webhook فراهم می‌کند. `webhookSecurity.allowedHosts` را روی hostname عمومی تونل تنظیم کنید تا headerهای host فورواردشده پذیرفته شوند.

### مزایای امنیتی

| جنبه              | عمومی            | خصوصی       |
| ----------------- | ---------------- | ----------- |
| اسکنرهای اینترنت | قابل کشف         | پنهان       |
| حمله مستقیم      | ممکن             | مسدود       |
| دسترسی UI کنترل  | مرورگر           | Proxy/VPN   |
| تحویل Webhook    | مستقیم           | از طریق تونل |

## نکات

- Fly.io از **معماری x86** استفاده می‌کند (نه ARM)
- Dockerfile با هر دو معماری سازگار است
- برای راه‌اندازی WhatsApp/Telegram، از `fly ssh console` استفاده کنید
- داده‌های پایدار روی volume در `/data` قرار دارند
- Signal به Java + signal-cli نیاز دارد؛ از یک image سفارشی استفاده کنید و حافظه را روی 2GB+ نگه دارید.

## هزینه

با پیکربندی پیشنهادی (`shared-cpu-2x`، ۲ گیگابایت RAM):

- حدود ۱۰ تا ۱۵ دلار در ماه، بسته به میزان استفاده
- tier رایگان شامل مقداری سهمیه است

برای جزئیات، [قیمت‌گذاری Fly.io](https://fly.io/docs/about/pricing/) را ببینید.

## مراحل بعدی

- کانال‌های پیام‌رسانی را راه‌اندازی کنید: [کانال‌ها](/fa/channels)
- Gateway را پیکربندی کنید: [پیکربندی Gateway](/fa/gateway/configuration)
- OpenClaw را به‌روز نگه دارید: [به‌روزرسانی](/fa/install/updating)

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Hetzner](/fa/install/hetzner)
- [Docker](/fa/install/docker)
- [میزبانی VPS](/fa/vps)
