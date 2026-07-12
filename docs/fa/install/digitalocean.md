---
read_when:
    - راه‌اندازی OpenClaw در DigitalOcean
    - به‌دنبال یک VPS پولی ساده برای OpenClaw هستید
summary: میزبانی OpenClaw روی یک Droplet در DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T10:15:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

یک Gateway دائمی OpenClaw را روی یک Droplet از DigitalOcean اجرا کنید (حدود ۶ دلار در ماه برای طرح Basic با ۱ گیگابایت حافظه).

DigitalOcean مسیری ساده برای استفاده از VPS پولی است. برای گزینه‌های ارزان‌تر یا رایگان:

- [Hetzner](/fa/install/hetzner) -- هسته‌ها و RAM بیشتر به‌ازای هر دلار.
- [Oracle Cloud](/fa/install/oracle) -- سطح ARM همیشه‌رایگان (تا ۴ OCPU و ۲۴ گیگابایت RAM)، اما ثبت‌نام ممکن است دردسرساز باشد و فقط از ARM پشتیبانی می‌کند.

## پیش‌نیازها

- حساب DigitalOcean ([ثبت‌نام](https://cloud.digitalocean.com/registrations/new))
- جفت کلید SSH (یا تمایل به استفاده از احراز هویت با گذرواژه)
- حدود ۲۰ دقیقه زمان

## راه‌اندازی

<Steps>
  <Step title="ایجاد یک Droplet">
    <Warning>
    از یک تصویر پایه تمیز (Ubuntu 24.04 LTS) استفاده کنید. از تصاویر یک‌کلیکی Marketplace متعلق به اشخاص ثالث بپرهیزید، مگر اینکه اسکریپت‌های راه‌اندازی و تنظیمات پیش‌فرض دیواره آتش آن‌ها را بررسی کرده باشید.
    </Warning>

    1. وارد [DigitalOcean](https://cloud.digitalocean.com/) شوید.
    2. روی **Create > Droplets** کلیک کنید.
    3. موارد زیر را انتخاب کنید:
       - **Region:** نزدیک‌ترین منطقه به شما
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic، Regular،‏ 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** کلید SSH (توصیه‌شده) یا گذرواژه
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

    از پوسته root فقط برای آماده‌سازی اولیه سیستم استفاده کنید. فرمان‌های OpenClaw را با کاربر غیر root به نام `openclaw` اجرا کنید تا وضعیت در مسیر `/home/openclaw/.openclaw/` نگهداری شود و Gateway به‌عنوان سرویس systemd متعلق به همان کاربر با گزینه `--user` نصب شود.

  </Step>

  <Step title="اجرای فرایند شروع به کار">
    ```bash
    openclaw onboard --install-daemon
    ```

    این راهنما شما را در مراحل احراز هویت مدل، راه‌اندازی کانال، تولید توکن Gateway و نصب دیمن (سرویس کاربری systemd) همراهی می‌کند.

  </Step>

  <Step title="افزودن فضای مبادله (توصیه‌شده برای Dropletهای ۱ گیگابایتی)">
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
    Gateway به‌طور پیش‌فرض به local loopback متصل می‌شود. یکی از گزینه‌های زیر را انتخاب کنید.

    **گزینه الف: تونل SSH (ساده‌ترین)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    سپس `http://localhost:18789` را باز کنید.

    **گزینه ب: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    سپس `https://<magicdns>/` را از هر دستگاهی در tailnet خود باز کنید.

    Tailscale Serve ترافیک رابط کاربری کنترل و WebSocket را از طریق سرآیندهای هویت tailnet احراز هویت می‌کند؛ این روش فرض می‌کند خود میزبان Gateway قابل اعتماد است. نقاط پایانی HTTP API، صرف‌نظر از این موضوع، همچنان از حالت عادی احراز هویت Gateway (توکن/گذرواژه) پیروی می‌کنند. برای الزام به استفاده از اطلاعات محرمانه مشترک و صریح از طریق Serve، مقدار `gateway.auth.allowTailscale: false` را تنظیم کنید و از `gateway.auth.mode: "token"` یا `"password"` استفاده کنید.

    **گزینه ج: اتصال به Tailnet (بدون Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    سپس `http://<tailscale-ip>:18789` را باز کنید (توکن الزامی است).

  </Step>
</Steps>

## ماندگاری و نسخه‌های پشتیبان

وضعیت OpenClaw در مسیرهای زیر نگهداری می‌شود:

- `~/.openclaw/` -- فایل `openclaw.json`، اطلاعات احراز هویت کانال/ارائه‌دهنده، فایل `auth-profiles.json` هر عامل و داده‌های نشست.
- `~/.openclaw/workspace/` -- فضای کاری عامل (SOUL.md، حافظه و دست‌ساخته‌ها).

این داده‌ها پس از راه‌اندازی مجدد Droplet حفظ می‌شوند. برای گرفتن یک تصویر لحظه‌ای قابل‌انتقال:

```bash
openclaw backup create
```

تصاویر لحظه‌ای DigitalOcean از کل Droplet نسخه پشتیبان تهیه می‌کنند؛ خروجی `openclaw backup create` میان میزبان‌های مختلف قابل‌انتقال است.

## نکته‌هایی برای RAM یک گیگابایتی

Droplet شش‌دلاری فقط ۱ گیگابایت RAM دارد. برای حفظ عملکرد روان:

- مطمئن شوید مرحله تنظیم فضای مبادله در بالا در `/etc/fstab` ثبت شده است تا پس از راه‌اندازی مجدد باقی بماند.
- مدل‌های مبتنی بر API مانند Claude و GPT را به مدل‌های محلی ترجیح دهید؛ استنتاج LLM محلی در ۱ گیگابایت نمی‌گنجد.
- اگر هنگام پردازش ورودی‌های بزرگ با خطای کمبود حافظه مواجه شدید، مقدار `agents.defaults.model.primary` را روی مدلی کوچک‌تر تنظیم کنید.
- وضعیت را با `free -h` و `htop` پایش کنید.

## عیب‌یابی

**Gateway راه‌اندازی نمی‌شود** -- فرمان `openclaw doctor --non-interactive` را اجرا کنید و گزارش‌ها را با `journalctl --user -u openclaw-gateway.service -n 50` بررسی کنید.

**درگاه از قبل در حال استفاده است** -- برای یافتن فرایند، `lsof -i :18789` را اجرا و سپس آن را متوقف کنید.

**کمبود حافظه** -- با `free -h` بررسی کنید که فضای مبادله فعال باشد. اگر همچنان با کمبود حافظه مواجه می‌شوید، به‌جای مدل‌های محلی از مدل‌های مبتنی بر API مانند Claude و GPT استفاده کنید یا Droplet را به طرح ۲ گیگابایتی ارتقا دهید.

## گام‌های بعدی

- [کانال‌ها](/fa/channels) -- Telegram،‏ WhatsApp،‏ Discord و موارد دیگر را متصل کنید
- [پیکربندی Gateway](/fa/gateway/configuration) -- همه گزینه‌های پیکربندی
- [به‌روزرسانی](/fa/install/updating) -- OpenClaw را به‌روز نگه دارید

## مطالب مرتبط

- [نمای کلی نصب](/fa/install)
- [Fly.io](/fa/install/fly)
- [Hetzner](/fa/install/hetzner)
- [میزبانی VPS](/fa/vps)
