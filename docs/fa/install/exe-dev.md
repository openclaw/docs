---
read_when:
    - شما یک میزبان لینوکسی ارزان و همیشه‌روشن برای Gateway می‌خواهید
    - می‌خواهید بدون راه‌اندازی VPS شخصی خود، از راه دور به رابط کنترل دسترسی داشته باشید
summary: برای دسترسی از راه دور، Gateway ‏OpenClaw را روی exe.dev (ماشین مجازی + پراکسی HTTPS) اجرا کنید
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T10:15:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**هدف:** اجرای Gateway مربوط به OpenClaw روی یک ماشین مجازی [exe.dev](https://exe.dev)، با دسترسی از طریق `https://<vm-name>.exe.xyz`.

این راهنما تصویر پیش‌فرض **exeuntu** در exe.dev را فرض می‌کند. در توزیع‌های دیگر، بسته‌های معادل را استفاده کنید.

## موارد موردنیاز

- حساب exe.dev
- دسترسی `ssh exe.dev` به ماشین‌های مجازی exe.dev (اختیاری، برای راه‌اندازی دستی)

## مسیر سریع برای مبتدیان

1. [https://exe.new/openclaw](https://exe.new/openclaw) را باز کنید
2. کلید یا توکن احراز هویت خود را در صورت نیاز وارد کنید
3. روی "Agent" کنار ماشین مجازی خود کلیک کنید و منتظر بمانید تا Shelley آماده‌سازی را به پایان برساند
4. `https://<vm-name>.exe.xyz/` را باز کنید و با رمز مشترک پیکربندی‌شده احراز هویت کنید (به‌طور پیش‌فرض احراز هویت با توکن؛ اگر `gateway.auth.mode` را تغییر دهید، احراز هویت با گذرواژه نیز کار می‌کند)
5. درخواست‌های در انتظار جفت‌سازی دستگاه را با `openclaw devices approve <requestId>` تأیید کنید

## نصب خودکار با Shelley

Shelley، عامل exe.dev، می‌تواند OpenClaw را با استفاده از یک پرامپت نصب کند:

```text
OpenClaw (https://docs.openclaw.ai/install) را روی این ماشین مجازی راه‌اندازی کن. برای فرایند آغاز به کار openclaw از پرچم‌های non-interactive و accept-risk استفاده کن. احراز هویت یا توکن ارائه‌شده را در صورت نیاز اضافه کن. nginx را طوری پیکربندی کن که درخواست‌ها را از پورت پیش‌فرض 18789 به مسیر ریشه در پیکربندی پیش‌فرض فعال سایت هدایت کند و حتماً پشتیبانی Websocket را فعال کن. جفت‌سازی با "openclaw devices list" و "openclaw devices approve <request id>" انجام می‌شود. مطمئن شو داشبورد نشان می‌دهد سلامت OpenClaw مطلوب است. exe.dev هدایت پورت 8000 به پورت 80/443 و HTTPS را برای ما انجام می‌دهد، بنابراین نشانی نهایی «قابل دسترسی» باید <vm-name>.exe.xyz و بدون تعیین پورت باشد.
```

## نصب دستی

<Steps>
  <Step title="ایجاد ماشین مجازی">
    از دستگاه خود:

    ```bash
    ssh exe.dev new
    ```

    سپس متصل شوید:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    این ماشین مجازی را **دارای حالت پایدار** نگه دارید. OpenClaw فایل‌های `openclaw.json`، فایل `auth-profiles.json` هر عامل، نشست‌ها و وضعیت کانال/ارائه‌دهنده را در `~/.openclaw/` و فضای کاری را در `~/.openclaw/workspace/` ذخیره می‌کند.
    </Tip>

  </Step>

  <Step title="نصب پیش‌نیازها (روی ماشین مجازی)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="نصب OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="پیکربندی nginx برای پراکسی به پورت 8000">
    فایل `/etc/nginx/sites-enabled/default` را ویرایش کنید:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # پشتیبانی WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # سرآیندهای استاندارد پراکسی
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # تنظیمات مهلت زمانی برای اتصال‌های طولانی‌مدت
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    سرآیندهای هدایت را بازنویسی کنید و زنجیره‌های ارائه‌شده از سوی کارخواه را حفظ نکنید. OpenClaw فقط به فراداده IP هدایت‌شده از پراکسی‌هایی اعتماد می‌کند که صراحتاً پیکربندی شده‌اند و زنجیره‌های `X-Forwarded-For` با شیوه افزودنی به‌عنوان یک خطر مقاوم‌سازی در نظر گرفته می‌شوند.

  </Step>

  <Step title="دسترسی به OpenClaw و تأیید دستگاه‌ها">
    `https://<vm-name>.exe.xyz/` را باز کنید (خروجی رابط کنترل در فرایند آغاز به کار را ببینید). اگر از شما احراز هویت خواسته شد، رمز مشترک پیکربندی‌شده در ماشین مجازی را جای‌گذاری کنید.

    این راهنما به‌طور پیش‌فرض از احراز هویت با توکن استفاده می‌کند؛ بنابراین `gateway.auth.token` را با `openclaw config get gateway.auth.token` دریافت کنید یا با `openclaw doctor --n` توکن جدیدی بسازید. اگر Gateway را به احراز هویت با گذرواژه تغییر داده‌اید، به‌جای آن از `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` استفاده کنید.

    دستگاه‌ها را با `openclaw devices list` و `openclaw devices approve <requestId>` تأیید کنید. اگر تردید داشتید، از Shelley در مرورگر خود استفاده کنید.

  </Step>
</Steps>

## راه‌اندازی کانال راه دور

برای میزبان‌های راه دور، به‌جای چندین فراخوانی SSH برای `config set`، یک فراخوانی `config patch` را ترجیح دهید. توکن‌های واقعی را در محیط ماشین مجازی یا `~/.openclaw/.env` نگه دارید و فقط SecretRefها را در `openclaw.json` قرار دهید. برای قرارداد کامل SecretRef، به [مدیریت اسرار](/fa/gateway/secrets) مراجعه کنید.

روی ماشین مجازی، محیط سرویس را طوری تنظیم کنید که اسرار موردنیاز را دربر گیرد:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

در دستگاه محلی خود، یک فایل وصله ایجاد کنید و آن را از طریق لوله به ماشین مجازی بفرستید:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

هنگامی که یک فهرست مجاز تو‌در‌تو باید دقیقاً برابر مقدار وصله شود، از `--replace-path` استفاده کنید؛ برای نمونه، جایگزینی فهرست مجاز یک کانال Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

برای مرجع کامل پیکربندی کانال، به [Discord](/fa/channels/discord) و [Slack](/fa/channels/slack) مراجعه کنید.

## دسترسی راه دور

exe.dev احراز هویت برای دسترسی راه دور را مدیریت می‌کند. به‌طور پیش‌فرض، ترافیک HTTP از پورت 8000 با احراز هویت ایمیلی به `https://<vm-name>.exe.xyz` هدایت می‌شود.

## به‌روزرسانی

```bash
openclaw update
```

برای تغییر کانال‌ها و بازیابی دستی، به [به‌روزرسانی](/fa/install/updating) مراجعه کنید.

## مرتبط

- [Gateway راه دور](/fa/gateway/remote)
- [نمای کلی نصب](/fa/install)
