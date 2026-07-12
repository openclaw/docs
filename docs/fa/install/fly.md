---
read_when:
    - استقرار OpenClaw روی Fly.io
    - راه‌اندازی حجم‌های ذخیره‌سازی Fly، اسرار و پیکربندی اجرای نخست
summary: استقرار گام‌به‌گام OpenClaw در Fly.io با فضای ذخیره‌سازی پایدار و HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T10:10:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**هدف:** اجرای OpenClaw Gateway روی یک ماشین [Fly.io](https://fly.io) با فضای ذخیره‌سازی پایدار، HTTPS خودکار و دسترسی Discord/کانال.

## پیش‌نیازها

- نصب بودن [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- حساب Fly.io (سطح رایگان نیز قابل استفاده است)
- احراز هویت مدل: کلید API برای ارائه‌دهنده مدل انتخابی شما
- اعتبارنامه‌های کانال: توکن ربات Discord، توکن Telegram و غیره

## مسیر سریع برای مبتدیان

1. مخزن را کلون و `fly.toml` را سفارشی کنید
2. برنامه و جلد را ایجاد و رازها را تنظیم کنید
3. با `fly deploy` استقرار دهید
4. برای ایجاد پیکربندی از طریق SSH وارد شوید، یا از رابط کنترل استفاده کنید

<Steps>
  <Step title="ایجاد برنامه Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # نام دلخواه خود را انتخاب کنید
    fly apps create my-openclaw

    # معمولاً ۱ گیگابایت کافی است
    fly volumes create openclaw_data --size 1 --region iad
    ```

    منطقه‌ای نزدیک به خود انتخاب کنید. گزینه‌های رایج: `lhr` (لندن)، `iad` (ویرجینیا)، `sjc` (سن‌خوزه).

  </Step>

  <Step title="پیکربندی fly.toml">
    `fly.toml` را متناسب با نام برنامه و نیازهای خود ویرایش کنید. فایل `fly.toml` ردیابی‌شده در مخزن، الگوی عمومی نمایش‌داده‌شده در زیر است؛ `deploy/fly.private.toml` گونه سخت‌سازی‌شده بدون IP عمومی است (به [استقرار خصوصی](#private-deployment-hardened) مراجعه کنید).

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

    نقطه ورود تصویر Docker مربوط به OpenClaw، `tini` است که به‌طور پیش‌فرض `node openclaw.mjs gateway` را اجرا می‌کند. بخش `[processes]` در Fly، دستور `CMD` داکر را جایگزین می‌کند (در اینجا همان نقطه ورود کامپایل‌شده را مستقیماً با `node dist/index.js gateway ...` اجرا می‌کند)، بدون آنکه `ENTRYPOINT` را تغییر دهد؛ بنابراین فرایند همچنان زیر نظر `tini` اجرا می‌شود.

    **تنظیمات کلیدی:**

    | تنظیم                          | دلیل                                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------------------------- |
    | `--bind lan`                   | به `0.0.0.0` متصل می‌شود تا پروکسی Fly بتواند به Gateway دسترسی پیدا کند                     |
    | `--allow-unconfigured`         | بدون فایل پیکربندی شروع می‌شود (بعداً آن را ایجاد می‌کنید)                                  |
    | `internal_port = 3000`         | برای بررسی‌های سلامت Fly باید با `--port 3000` (یا `OPENCLAW_GATEWAY_PORT`) مطابقت داشته باشد |
    | `memory = "2048mb"`            | ۵۱۲ مگابایت بسیار کم است؛ ۲ گیگابایت توصیه می‌شود                                             |
    | `OPENCLAW_STATE_DIR = "/data"` | وضعیت را روی جلد پایدار نگه می‌دارد                                                           |

  </Step>

  <Step title="تنظیم رازها">
    ```bash
    # الزامی: توکن احراز هویت Gateway برای اتصال غیر از local loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # کلیدهای API ارائه‌دهنده مدل
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # اختیاری: سایر ارائه‌دهندگان
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # توکن‌های کانال
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    اتصال‌های غیر از local loopback (`--bind lan`) به یک مسیر معتبر احراز هویت Gateway نیاز دارند. این مثال از `OPENCLAW_GATEWAY_TOKEN` استفاده می‌کند، اما `gateway.auth.password` یا یک استقرار پروکسی مورداعتماد با اتصال غیر از local loopback که به‌درستی پیکربندی شده باشد نیز این الزام را برآورده می‌کند. برای قرارداد SecretRef به [مدیریت رازها](/fa/gateway/secrets) مراجعه کنید.

    با این توکن‌ها مانند گذرواژه رفتار کنید. برای کلیدهای API و توکن‌ها، متغیرهای محیطی/`fly secrets` را به فایل پیکربندی ترجیح دهید تا رازها خارج از `openclaw.json` باقی بمانند.

  </Step>

  <Step title="استقرار">
    ```bash
    fly deploy
    ```

    نخستین استقرار، تصویر Docker را می‌سازد. پس از استقرار، آن را بررسی کنید:

    ```bash
    fly status
    fly logs
    ```

    پس از فعال شدن شنونده HTTP/WebSocket، راه‌اندازی Gateway پیام `gateway ready` را در گزارش‌ها ثبت می‌کند. بررسی سلامت خود Fly مطابق `fly.toml`، `internal_port = 3000` را پایش می‌کند؛ دستور `HEALTHCHECK` در تصویر Docker نیز مسیر `/healthz` را روی درگاه پیش‌فرض 18789 بررسی می‌کند که در اینجا استفاده نمی‌شود، زیرا این استقرار درگاه Gateway را با `--port 3000` بازنویسی می‌کند.

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

    `https://my-openclaw.fly.dev` را با مبدأ واقعی برنامه Fly خود جایگزین کنید. راه‌اندازی Gateway، مبدأهای محلی رابط کنترل را بر اساس مقادیر زمان اجرای `--bind` و `--port` مقداردهی اولیه می‌کند تا نخستین راه‌اندازی پیش از وجود پیکربندی انجام شود؛ اما دسترسی مرورگر از طریق Fly همچنان به مبدأ دقیق HTTPS فهرست‌شده در `gateway.controlUi.allowedOrigins` نیاز دارد.

    توکن Discord می‌تواند از یکی از این دو منبع تأمین شود:

    - متغیر محیطی `DISCORD_BOT_TOKEN` (برای رازها توصیه می‌شود)؛ نیازی به افزودن آن به پیکربندی نیست، Gateway آن را خودکار می‌خواند
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

    با راز مشترک پیکربندی‌شده احراز هویت کنید: توکن Gateway از `OPENCLAW_GATEWAY_TOKEN`، یا اگر احراز هویت را به گذرواژه تغییر داده‌اید، گذرواژه خودتان.

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

### «برنامه روی نشانی مورد انتظار گوش نمی‌دهد»

Gateway به‌جای `0.0.0.0` به `127.0.0.1` متصل شده است.

**راه‌حل:** `--bind lan` را به دستور فرایند خود در `fly.toml` اضافه کنید.

### ناموفق بودن بررسی‌های سلامت / رد شدن اتصال

Fly نمی‌تواند از طریق درگاه پیکربندی‌شده به Gateway دسترسی پیدا کند.

**راه‌حل:** مطمئن شوید `internal_port` با درگاه Gateway (`--port 3000` یا `OPENCLAW_GATEWAY_PORT=3000`) مطابقت دارد.

### مشکلات OOM / حافظه

کانتینر مرتباً راه‌اندازی مجدد یا متوقف می‌شود. نشانه‌ها: `SIGABRT`، `v8::internal::Runtime_AllocateInYoungGeneration` یا راه‌اندازی‌های مجدد بی‌صدا.

**راه‌حل:** حافظه را در `fly.toml` افزایش دهید:

```toml
[[vm]]
  memory = "2048mb"
```

یا یک ماشین موجود را به‌روزرسانی کنید:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

۵۱۲ مگابایت بسیار کم است. ۱ گیگابایت ممکن است کار کند، اما زیر بار یا با گزارش‌گیری پرجزئیات ممکن است با OOM مواجه شود. ۲ گیگابایت توصیه می‌شود.

### مشکلات قفل Gateway

پس از راه‌اندازی مجدد کانتینر، Gateway به‌دلیل خطاهای «از قبل در حال اجرا است» از شروع خودداری می‌کند.

فایل قفل تک‌نمونه‌ای در `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` قرار دارد (در لینوکس: `/tmp/openclaw-<uid>/gateway.<hash>.lock`)، نه روی جلد پایدار `/data`؛ بنابراین راه‌اندازی مجدد کامل کانتینر معمولاً آن را همراه با بقیه سامانه فایل کانتینر پاک می‌کند. اگر قفل باقی بماند (برای مثال، در یک `fly machine restart` که سامانه فایل کانتینر را حفظ می‌کند) و مانع راه‌اندازی شود، آن را دستی حذف کنید:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### خوانده نشدن پیکربندی

`--allow-unconfigured` فقط محافظ راه‌اندازی را دور می‌زند. این گزینه `/data/openclaw.json` را ایجاد یا ترمیم نمی‌کند؛ بنابراین مطمئن شوید پیکربندی واقعی شما وجود دارد و برای راه‌اندازی عادی Gateway محلی شامل `"gateway": { "mode": "local" }` است.

وجود پیکربندی را بررسی کنید:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### نوشتن پیکربندی از طریق SSH

`fly ssh console -C` از تغییر مسیر پوسته پشتیبانی نمی‌کند. برای نوشتن فایل پیکربندی:

```bash
# echo + tee (ارسال از محلی به دوردست از طریق لوله)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# یا sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

اگر فایل از قبل وجود داشته باشد، ممکن است `fly sftp` ناموفق شود؛ ابتدا آن را حذف کنید:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### پایدار نماندن وضعیت

اگر پس از راه‌اندازی مجدد، نمایه‌های احراز هویت، وضعیت کانال/ارائه‌دهنده یا نشست‌ها را از دست می‌دهید، دایرکتوری وضعیت به‌جای جلد روی سامانه فایل کانتینر نوشته می‌شود.

**راه‌حل:** مطمئن شوید `OPENCLAW_STATE_DIR=/data` در `fly.toml` تنظیم شده است و دوباره استقرار دهید.

## به‌روزرسانی

```bash
git pull
fly deploy
fly status
fly logs
```

در اینجا `git pull` + `fly deploy` مسیر تحت نظارت است: تصویر را از Dockerfile دوباره می‌سازد، بنابراین نسخه CLI/Gateway، تصویر پایه سیستم‌عامل و هرگونه تغییر Dockerfile همگی با هم به‌روزرسانی می‌شوند. اجرای `openclaw update` درون کانتینر در حال اجرا، عملیات یکسانی نیست؛ زیرا تصویر به‌صورت یک درخت `dist/` ساخته‌شده با Docker عرضه می‌شود و نه نسخه‌برداری `.git` دارد و نه نصب سراسری مدیریت‌شده با npm که بتواند آن را شناسایی کند. برای این فرایند در نصب‌های سبک ماشین مجازی، به [به‌روزرسانی](/fa/install/updating) مراجعه کنید.

### به‌روزرسانی دستور ماشین

برای تغییر دستور راه‌اندازی بدون استقرار مجدد کامل:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# یا همراه با افزایش حافظه
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

اجرای بعدی `fly deploy` دستور ماشین را به مقدار موجود در `fly.toml` بازمی‌گرداند؛ پس از استقرار مجدد، تغییرات دستی را دوباره اعمال کنید.

## استقرار خصوصی (سخت‌سازی‌شده)

Fly به‌طور پیش‌فرض IPهای عمومی اختصاص می‌دهد؛ بنابراین Gateway شما در `https://your-app.fly.dev` قابل دسترسی و برای پویشگرهای اینترنتی (Shodan، Censys و غیره) قابل کشف است.

برای استقرار سخت‌سازی‌شده با **بدون IP عمومی** از `deploy/fly.private.toml` استفاده کنید: این فایل بخش `[http_service]` را حذف می‌کند، بنابراین هیچ ورودی عمومی تخصیص داده نمی‌شود.

### چه زمانی از استقرار خصوصی استفاده کنید

- فقط تماس‌ها/پیام‌های خروجی (بدون Webhookهای ورودی)
- تونل‌های ngrok یا Tailscale فراخوانی‌های برگشتی Webhook را مدیریت می‌کنند
- دسترسی به Gateway به‌جای مرورگر از طریق SSH، پروکسی یا WireGuard انجام می‌شود
- استقرار باید از پویشگرهای اینترنتی پنهان باشد

### راه‌اندازی

```bash
fly deploy -c deploy/fly.private.toml
```

یا یک استقرار موجود را تبدیل کنید:

```bash
# فهرست IPهای فعلی
fly ips list -a my-openclaw

# آزادسازی IPهای عمومی
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# تغییر به پیکربندی خصوصی تا استقرارهای آینده IP عمومی را دوباره تخصیص ندهند
fly deploy -c deploy/fly.private.toml

# تخصیص IPv6 فقط خصوصی
fly ips allocate-v6 --private -a my-openclaw
```

پس از این، `fly ips list` باید فقط یک IP از نوع `private` را نشان دهد:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### دسترسی به استقرار خصوصی

**گزینه ۱: پروکسی محلی (ساده‌ترین)**

```bash
fly proxy 3000:3000 -a my-openclaw
# نشانی http://localhost:3000 را در مرورگر باز کنید
```

**گزینه ۲: VPN مبتنی بر WireGuard**

```bash
fly wireguard create
# آن را در یک کلاینت WireGuard وارد کنید، سپس از طریق IPv6 داخلی دسترسی پیدا کنید
# نمونه: http://[fdaa:x:x:x:x::x]:3000
```

**گزینه ۳: فقط SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhookها در استقرار خصوصی

برای فراخوانی‌های برگشتی Webhook (Twilio، Telnyx و غیره) بدون قرار گرفتن در معرض دسترسی عمومی:

1. **تونل ngrok**: ‏ngrok را درون کانتینر یا به‌صورت سایدکار اجرا کنید
2. **Tailscale Funnel**: مسیرهای مشخصی را از طریق Tailscale در دسترس قرار دهید
3. **فقط خروجی**: برخی ارائه‌دهندگان (مانند Twilio) برای تماس‌های خروجی بدون Webhook کار می‌کنند

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

تونل ngrok درون کانتینر اجرا می‌شود و بدون در معرض دسترسی عمومی قرار دادن خود برنامه Fly، یک نشانی عمومی Webhook فراهم می‌کند. مقدار `webhookSecurity.allowedHosts` را روی نام میزبان تونل تنظیم کنید تا سرآیندهای میزبانِ بازارسال‌شده پذیرفته شوند.

### ملاحظات امنیتی

| جنبه                  | عمومی            | خصوصی              |
| --------------------- | ---------------- | ------------------ |
| اسکنرهای اینترنتی     | قابل شناسایی     | پنهان               |
| حملات مستقیم          | ممکن             | مسدود               |
| دسترسی به رابط کنترل  | مرورگر           | پروکسی/VPN          |
| تحویل Webhook         | مستقیم           | از طریق تونل        |

## نکات

- Fly.io از معماری x86 استفاده می‌کند؛ Dockerfile با هر دو معماری x86 و ARM سازگار است.
- برای راه‌اندازی اولیه WhatsApp/Telegram، از `fly ssh console` استفاده کنید.
- داده‌های پایدار روی ولوم در مسیر `/data` قرار دارند.
- Signal به signal-cli (یک CLI مبتنی بر Java) در ایمیج نیاز دارد؛ از یک ایمیج سفارشی استفاده کنید و حافظه را روی ۲ گیگابایت یا بیشتر نگه دارید.

## هزینه

با پیکربندی توصیه‌شده (`shared-cpu-2x` و ۲ گیگابایت RAM)، بسته به میزان استفاده، هزینه‌ای حدود ۱۰ تا ۱۵ دلار در ماه انتظار می‌رود؛ سطح رایگان بخشی از سهمیه پایه را پوشش می‌دهد. برای مشاهده نرخ‌های فعلی، به [قیمت‌گذاری Fly.io](https://fly.io/docs/about/pricing/) مراجعه کنید.

## گام‌های بعدی

- کانال‌های پیام‌رسانی را راه‌اندازی کنید: [کانال‌ها](/fa/channels)
- Gateway را پیکربندی کنید: [پیکربندی Gateway](/fa/gateway/configuration)
- OpenClaw را به‌روز نگه دارید: [به‌روزرسانی](/fa/install/updating)

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Hetzner](/fa/install/hetzner)
- [Docker](/fa/install/docker)
- [میزبانی VPS](/fa/vps)
