---
read_when:
    - راه‌اندازی OpenClaw روی DigitalOcean
    - به‌دنبال یک VPS پولی ساده برای OpenClaw
summary: میزبانی OpenClaw روی یک Droplet در DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-29T23:03:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 16
---

یک Gateway پایدار OpenClaw را روی یک Droplet در DigitalOcean اجرا کنید.

## پیش‌نیازها

- حساب DigitalOcean ([ثبت‌نام](https://cloud.digitalocean.com/registrations/new))
- جفت‌کلید SSH (یا آمادگی برای استفاده از احراز هویت با گذرواژه)
- حدود ۲۰ دقیقه

## راه‌اندازی

<Steps>
  <Step title="ایجاد Droplet">
    <Warning>
    از یک تصویر پایه تمیز استفاده کنید (Ubuntu 24.04 LTS). از تصاویر ۱-کلیکی Marketplace شخص ثالث خودداری کنید، مگر اینکه اسکریپت‌های راه‌اندازی و پیش‌فرض‌های فایروال آن‌ها را بررسی کرده باشید.
    </Warning>

    1. وارد [DigitalOcean](https://cloud.digitalocean.com/) شوید.
    2. روی **Create > Droplets** کلیک کنید.
    3. انتخاب کنید:
       - **منطقه:** نزدیک‌ترین گزینه به شما
       - **تصویر:** Ubuntu 24.04 LTS
       - **اندازه:** Basic، Regular، 1 vCPU / 1 GB RAM / 25 GB SSD
       - **احراز هویت:** کلید SSH (توصیه‌شده) یا گذرواژه
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
    openclaw --version
    ```

  </Step>

  <Step title="اجرای پذیرش اولیه">
    ```bash
    openclaw onboard --install-daemon
    ```

    راهنما شما را در احراز هویت مدل، راه‌اندازی کانال، تولید توکن Gateway، و نصب daemon (systemd) همراهی می‌کند.

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

  <Step title="بررسی Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="دسترسی به رابط کاربری کنترل">
    Gateway به‌طور پیش‌فرض به loopback متصل می‌شود. یکی از این گزینه‌ها را انتخاب کنید.

    **گزینه A: تونل SSH (ساده‌ترین)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    سپس `http://localhost:18789` را باز کنید.

    **گزینه B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    سپس `https://<magicdns>/` را از هر دستگاهی در tailnet خود باز کنید.

    **گزینه C: اتصال tailnet (بدون Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    سپس `http://<tailscale-ip>:18789` را باز کنید (توکن لازم است).

  </Step>
</Steps>

## عیب‌یابی

**Gateway شروع نمی‌شود** -- `openclaw doctor --non-interactive` را اجرا کنید و گزارش‌ها را با `journalctl --user -u openclaw-gateway.service -n 50` بررسی کنید.

**درگاه از قبل در حال استفاده است** -- `lsof -i :18789` را اجرا کنید تا فرایند را پیدا کنید، سپس آن را متوقف کنید.

**کمبود حافظه** -- با `free -h` بررسی کنید که swap فعال باشد. اگر همچنان با OOM روبه‌رو می‌شوید، به‌جای مدل‌های محلی از مدل‌های مبتنی بر API (Claude، GPT) استفاده کنید، یا به یک Droplet با ۲ گیگابایت ارتقا دهید.

## گام‌های بعدی

- [کانال‌ها](/fa/channels) -- Telegram، WhatsApp، Discord و موارد دیگر را متصل کنید
- [پیکربندی Gateway](/fa/gateway/configuration) -- همه گزینه‌های پیکربندی
- [به‌روزرسانی](/fa/install/updating) -- OpenClaw را به‌روز نگه دارید

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Fly.io](/fa/install/fly)
- [Hetzner](/fa/install/hetzner)
- [میزبانی VPS](/fa/vps)
