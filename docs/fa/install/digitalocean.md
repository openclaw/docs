---
read_when:
    - راه‌اندازی OpenClaw در DigitalOcean
    - به‌دنبال یک سرور مجازی خصوصی پولی ساده برای OpenClaw
summary: میزبانی OpenClaw روی یک DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-10T19:48:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ddfe3e6df5e48616584e912e12eede30a62f869fc307f586c9604c9c06c9e5b
    source_path: install/digitalocean.md
    workflow: 16
---

یک OpenClaw Gateway پایدار را روی یک DigitalOcean Droplet اجرا کنید (حدود ۶ دلار در ماه برای پلن 1 GB Basic).

DigitalOcean ساده‌ترین مسیر VPS پولی است. اگر گزینه‌های ارزان‌تر یا رایگان را ترجیح می‌دهید:

- [Hetzner](/fa/install/hetzner) — ۳٫۷۹ یورو در ماه، هسته‌ها/RAM بیشتر به‌ازای هر دلار.
- [Oracle Cloud](/fa/install/oracle) — Always Free ARM (تا ۴ OCPU و ۲۴ گیگابایت RAM)، اما ثبت‌نام می‌تواند دردسرساز باشد و فقط ARM است.

## پیش‌نیازها

- حساب DigitalOcean ([ثبت‌نام](https://cloud.digitalocean.com/registrations/new))
- جفت کلید SSH (یا تمایل به استفاده از احراز هویت با رمز عبور)
- حدود ۲۰ دقیقه

## راه‌اندازی

<Steps>
  <Step title="ایجاد یک Droplet">
    <Warning>
    از یک تصویر پایه تمیز استفاده کنید (Ubuntu 24.04 LTS). از تصویرهای 1-click شخص ثالث در Marketplace پرهیز کنید، مگر اینکه اسکریپت‌های راه‌اندازی و پیش‌فرض‌های فایروال آن‌ها را بررسی کرده باشید.
    </Warning>

    1. وارد [DigitalOcean](https://cloud.digitalocean.com/) شوید.
    2. روی **Create > Droplets** کلیک کنید.
    3. انتخاب کنید:
       - **منطقه:** نزدیک‌ترین گزینه به شما
       - **تصویر:** Ubuntu 24.04 LTS
       - **اندازه:** Basic، Regular، 1 vCPU / 1 GB RAM / 25 GB SSD
       - **احراز هویت:** کلید SSH (توصیه‌شده) یا رمز عبور
    4. روی **Create Droplet** کلیک کنید و نشانی IP را یادداشت کنید.

  </Step>

  <Step title="اتصال و نصب">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    از پوسته root فقط برای بوت‌استرپ سیستم استفاده کنید. دستورهای OpenClaw را با کاربر غیر root یعنی `openclaw` اجرا کنید تا وضعیت زیر `/home/openclaw/.openclaw/` قرار بگیرد و Gateway به‌عنوان سرویس systemd همان کاربر نصب شود.

  </Step>

  <Step title="اجرای ورود اولیه">
    ```bash
    openclaw onboard --install-daemon
    ```

    ویزارد شما را از میان احراز هویت مدل، راه‌اندازی کانال، تولید توکن Gateway، و نصب daemon (systemd) عبور می‌دهد.

  </Step>

  <Step title="افزودن swap (توصیه‌شده برای Dropletهای ۱ گیگابایتی)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="اعتبارسنجی gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="دسترسی به Control UI">
    gateway به‌صورت پیش‌فرض به loopback متصل می‌شود. یکی از این گزینه‌ها را انتخاب کنید.

    **گزینه A: تونل SSH (ساده‌ترین)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    سپس `http://localhost:18789` را باز کنید.

    **گزینه B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    سپس `https://<magicdns>/` را از هر دستگاهی در tailnet خود باز کنید.

    Tailscale Serve ترافیک Control UI و WebSocket را از طریق سرآیندهای هویت tailnet احراز هویت می‌کند، که فرض می‌کند خود میزبان gateway قابل اعتماد است. نقاط پایانی HTTP API صرف‌نظر از این موضوع از حالت احراز هویت معمول gateway (توکن/رمز عبور) پیروی می‌کنند. برای الزام اعتبارنامه‌های shared-secret صریح روی Serve، `gateway.auth.allowTailscale: false` را تنظیم کنید و از `gateway.auth.mode: "token"` یا `"password"` استفاده کنید.

    **گزینه C: اتصال به Tailnet (بدون Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    سپس `http://<tailscale-ip>:18789` را باز کنید (توکن لازم است).

  </Step>
</Steps>

## پایداری و پشتیبان‌گیری

وضعیت OpenClaw زیر این مسیرها قرار دارد:

- `~/.openclaw/` — `openclaw.json`، فایل `auth-profiles.json` برای هر عامل، وضعیت کانال/ارائه‌دهنده، و داده‌های نشست.
- `~/.openclaw/workspace/` — فضای کاری عامل (SOUL.md، حافظه، مصنوعات).

این موارد پس از راه‌اندازی مجدد Droplet باقی می‌مانند. برای گرفتن یک snapshot قابل‌انتقال:

```bash
openclaw backup create
```

snapshotهای DigitalOcean از کل Droplet پشتیبان می‌گیرند؛ `openclaw backup create` میان میزبان‌ها قابل‌انتقال است.

## نکات RAM یک گیگابایتی

Droplet شش‌دلاری فقط ۱ گیگابایت RAM دارد. برای روان نگه داشتن کارها:

- مطمئن شوید مرحله swap بالا در `/etc/fstab` است تا پس از راه‌اندازی مجدد باقی بماند.
- مدل‌های مبتنی بر API (Claude، GPT) را به مدل‌های محلی ترجیح دهید — استنتاج LLM محلی در ۱ گیگابایت جا نمی‌شود.
- اگر در promptهای بزرگ با OOM روبه‌رو شدید، `agents.defaults.model.primary` را روی یک مدل کوچک‌تر تنظیم کنید.
- با `free -h` و `htop` پایش کنید.

## عیب‌یابی

**Gateway شروع نمی‌شود** -- `openclaw doctor --non-interactive` را اجرا کنید و logها را با `journalctl --user -u openclaw-gateway.service -n 50` بررسی کنید.

**پورت از قبل در حال استفاده است** -- برای یافتن فرایند `lsof -i :18789` را اجرا کنید، سپس آن را متوقف کنید.

**کمبود حافظه** -- با `free -h` بررسی کنید که swap فعال باشد. اگر همچنان با OOM روبه‌رو هستید، به‌جای مدل‌های محلی از مدل‌های مبتنی بر API (Claude، GPT) استفاده کنید، یا به یک Droplet دو گیگابایتی ارتقا دهید.

## گام‌های بعدی

- [کانال‌ها](/fa/channels) -- Telegram، WhatsApp، Discord، و موارد بیشتر را متصل کنید
- [پیکربندی Gateway](/fa/gateway/configuration) -- همه گزینه‌های پیکربندی
- [به‌روزرسانی](/fa/install/updating) -- OpenClaw را به‌روز نگه دارید

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Fly.io](/fa/install/fly)
- [Hetzner](/fa/install/hetzner)
- [میزبانی VPS](/fa/vps)
