---
read_when:
    - راه‌اندازی OpenClaw روی DigitalOcean
    - به‌دنبال یک سرور مجازی خصوصی پولی ساده برای OpenClaw
summary: میزبانی OpenClaw روی یک Droplet در DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T09:25:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

یک OpenClaw Gateway پایدار را روی یک DigitalOcean Droplet اجرا کنید (حدود ۶ دلار در ماه برای طرح ۱ GB Basic).

DigitalOcean ساده‌ترین مسیر VPS پولی است. اگر گزینه‌های ارزان‌تر یا رایگان را ترجیح می‌دهید:

- [Hetzner](/fa/install/hetzner) — ۳٫۷۹ یورو در ماه، هسته‌ها/RAM بیشتر در برابر هر دلار.
- [Oracle Cloud](/fa/install/oracle) — Always Free ARM (تا ۴ OCPU و ۲۴ GB RAM)، اما ثبت‌نام می‌تواند بدقلق باشد و فقط ARM است.

## پیش‌نیازها

- حساب DigitalOcean ([ثبت‌نام](https://cloud.digitalocean.com/registrations/new))
- جفت کلید SSH (یا آمادگی برای استفاده از احراز هویت با گذرواژه)
- حدود ۲۰ دقیقه

## راه‌اندازی

<Steps>
  <Step title="ایجاد یک Droplet">
    <Warning>
    از یک تصویر پایه تمیز استفاده کنید (Ubuntu 24.04 LTS). از تصاویر ۱-کلیک Marketplace شخص ثالث پرهیز کنید، مگر اینکه اسکریپت‌های راه‌اندازی و پیش‌فرض‌های فایروال آن‌ها را بررسی کرده باشید.
    </Warning>

    1. وارد [DigitalOcean](https://cloud.digitalocean.com/) شوید.
    2. روی **Create > Droplets** کلیک کنید.
    3. انتخاب کنید:
       - **Region:** نزدیک‌ترین به شما
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic، Regular، 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** کلید SSH (توصیه‌شده) یا گذرواژه
    4. روی **Create Droplet** کلیک کنید و آدرس IP را یادداشت کنید.

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

  <Step title="اجرای آماده‌سازی اولیه">
    ```bash
    openclaw onboard --install-daemon
    ```

    ویزارد شما را در احراز هویت مدل، راه‌اندازی کانال، تولید توکن Gateway و نصب daemon (systemd) راهنمایی می‌کند.

  </Step>

  <Step title="افزودن swap (برای Dropletهای ۱ GB توصیه می‌شود)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="تأیید Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="دسترسی به Control UI">
    Gateway به‌صورت پیش‌فرض به loopback متصل می‌شود. یکی از این گزینه‌ها را انتخاب کنید.

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

    Tailscale Serve ترافیک Control UI و WebSocket را از طریق سرآیندهای هویت tailnet احراز هویت می‌کند، که فرض می‌کند خود میزبان Gateway مورد اعتماد است. نقاط پایانی HTTP API در هر صورت از حالت احراز هویت معمول Gateway (توکن/گذرواژه) پیروی می‌کنند. برای الزام اعتبارنامه‌های shared-secret صریح روی Serve، `gateway.auth.allowTailscale: false` را تنظیم کنید و از `gateway.auth.mode: "token"` یا `"password"` استفاده کنید.

    **گزینه C: اتصال tailnet (بدون Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    سپس `http://<tailscale-ip>:18789` را باز کنید (توکن لازم است).

  </Step>
</Steps>

## پایداری و پشتیبان‌گیری

وضعیت OpenClaw در مسیرهای زیر قرار دارد:

- `~/.openclaw/` — `openclaw.json`، فایل `auth-profiles.json` برای هر agent، وضعیت کانال/ارائه‌دهنده، و داده‌های نشست.
- `~/.openclaw/workspace/` — فضای کاری agent (SOUL.md، حافظه، artifactها).

این موارد پس از راه‌اندازی مجدد Droplet باقی می‌مانند. برای گرفتن یک snapshot قابل‌حمل:

```bash
openclaw backup create
```

snapshotهای DigitalOcean از کل Droplet پشتیبان می‌گیرند؛ `openclaw backup create` بین میزبان‌ها قابل‌حمل است.

## نکات RAM ۱ GB

Droplet شش‌دلاری فقط ۱ GB RAM دارد. برای روان نگه داشتن کارها:

- مطمئن شوید مرحله swap بالا در `/etc/fstab` قرار دارد تا پس از راه‌اندازی مجدد باقی بماند.
- مدل‌های مبتنی بر API (Claude، GPT) را به مدل‌های محلی ترجیح دهید — اجرای محلی استنتاج LLM در ۱ GB جا نمی‌شود.
- اگر در promptهای بزرگ با OOM مواجه شدید، `agents.defaults.model.primary` را روی مدل کوچک‌تری تنظیم کنید.
- با `free -h` و `htop` پایش کنید.

## عیب‌یابی

**Gateway شروع نمی‌شود** -- `openclaw doctor --non-interactive` را اجرا کنید و لاگ‌ها را با `journalctl --user -u openclaw-gateway.service -n 50` بررسی کنید.

**درگاه از قبل در حال استفاده است** -- `lsof -i :18789` را اجرا کنید تا فرایند را پیدا کنید، سپس آن را متوقف کنید.

**کمبود حافظه** -- با `free -h` بررسی کنید که swap فعال است. اگر همچنان با OOM مواجه می‌شوید، به‌جای مدل‌های محلی از مدل‌های مبتنی بر API (Claude، GPT) استفاده کنید، یا به یک Droplet با ۲ GB ارتقا دهید.

## مراحل بعدی

- [کانال‌ها](/fa/channels) -- Telegram، WhatsApp، Discord و موارد بیشتر را متصل کنید
- [پیکربندی Gateway](/fa/gateway/configuration) -- همه گزینه‌های پیکربندی
- [به‌روزرسانی](/fa/install/updating) -- OpenClaw را به‌روز نگه دارید

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Fly.io](/fa/install/fly)
- [Hetzner](/fa/install/hetzner)
- [میزبانی VPS](/fa/vps)
