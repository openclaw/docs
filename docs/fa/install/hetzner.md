---
read_when:
    - می‌خواهید OpenClaw به‌صورت ۲۴/۷ روی یک VPS ابری اجرا شود (نه روی لپ‌تاپتان)
    - شما یک Gateway در سطح تولید و همیشه روشن روی VPS خودتان می‌خواهید
    - شما می‌خواهید کنترل کامل بر ماندگاری، باینری‌ها و رفتار راه‌اندازی مجدد داشته باشید
    - شما در حال اجرای OpenClaw در Docker روی Hetzner یا یک ارائه‌دهندهٔ مشابه هستید
summary: اجرای ۲۴/۷ OpenClaw Gateway روی یک VPS ارزان Hetzner (Docker) با وضعیت ماندگار و باینری‌های تعبیه‌شده
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T17:58:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6102649b381b3b1ecd6f52e1cf518fc36147fe143ebc8fd4be5f44ab26cb3b4d
    source_path: install/hetzner.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## هدف

یک OpenClaw Gateway پایدار را روی یک Hetzner VPS با استفاده از Docker اجرا کنید، با وضعیت ماندگار، باینری‌های از پیش تعبیه‌شده، و رفتار راه‌اندازی مجدد ایمن.

اگر «OpenClaw شبانه‌روزی با حدود ۵ دلار» می‌خواهید، این ساده‌ترین راه‌اندازی قابل اتکا است.
قیمت‌گذاری Hetzner تغییر می‌کند؛ کوچک‌ترین VPS با Debian/Ubuntu را انتخاب کنید و اگر با OOM مواجه شدید، آن را ارتقا دهید.

یادآوری مدل امنیتی:

- عامل‌های مشترک شرکتی وقتی همه در یک مرز اعتماد هستند و محیط اجرا فقط کاری است، مشکلی ندارند.
- جداسازی سخت‌گیرانه را حفظ کنید: VPS/محیط اجرای اختصاصی + حساب‌های اختصاصی؛ هیچ پروفایل شخصی Apple/Google/مرورگر/مدیر گذرواژه روی آن میزبان نداشته باشید.
- اگر کاربران نسبت به یکدیگر خصمانه‌اند، آن‌ها را بر اساس gateway/میزبان/کاربر OS جدا کنید.

[امنیت](/fa/gateway/security) و [میزبانی VPS](/fa/vps) را ببینید.

## در حال انجام چه کاری هستیم (به زبان ساده)؟

- یک سرور Linux کوچک اجاره می‌کنیم (Hetzner VPS)
- Docker را نصب می‌کنیم (محیط اجرای برنامه ایزوله)
- OpenClaw Gateway را در Docker راه‌اندازی می‌کنیم
- `~/.openclaw` + `~/.openclaw/workspace` را روی میزبان ماندگار می‌کنیم (پس از راه‌اندازی مجدد/بازسازی باقی می‌ماند)
- از لپ‌تاپ خود از طریق یک تونل SSH به Control UI دسترسی پیدا می‌کنیم

آن وضعیت mount‌شده‌ی `~/.openclaw` شامل `openclaw.json`، فایل‌های هر عامل در
`agents/<agentId>/agent/auth-profiles.json`، و `.env` است.

Gateway از این روش‌ها قابل دسترسی است:

- بازارسال پورت SSH از لپ‌تاپ شما
- در معرض‌گذاری مستقیم پورت، اگر خودتان دیواره آتش و توکن‌ها را مدیریت می‌کنید

این راهنما Ubuntu یا Debian روی Hetzner را فرض می‌کند.  
اگر روی VPS Linux دیگری هستید، بسته‌ها را متناسب با آن نگاشت کنید.
برای جریان عمومی Docker، [Docker](/fa/install/docker) را ببینید.

---

## مسیر سریع (برای اپراتورهای باتجربه)

1. Hetzner VPS را provision کنید
2. Docker را نصب کنید
3. مخزن OpenClaw را clone کنید
4. دایرکتوری‌های ماندگار میزبان را ایجاد کنید
5. `.env` و `docker-compose.yml` را پیکربندی کنید
6. باینری‌های لازم را داخل image قرار دهید
7. `docker compose up -d`
8. ماندگاری و دسترسی Gateway را تأیید کنید

---

## آنچه نیاز دارید

- Hetzner VPS با دسترسی root
- دسترسی SSH از لپ‌تاپ شما
- آشنایی پایه با SSH + کپی/پیست
- حدود ۲۰ دقیقه
- Docker و Docker Compose
- اعتبارنامه‌های احراز هویت مدل
- اعتبارنامه‌های اختیاری provider
  - کد QR برای WhatsApp
  - توکن ربات Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Provision the VPS">
    یک VPS با Ubuntu یا Debian در Hetzner ایجاد کنید.

    به‌عنوان root وصل شوید:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    این راهنما فرض می‌کند VPS وضعیت‌مند است.
    با آن مثل زیرساخت دورریختنی رفتار نکنید.

  </Step>

  <Step title="Install Docker (on the VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    تأیید کنید:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone the OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    این راهنما فرض می‌کند برای تضمین ماندگاری باینری‌ها یک image سفارشی می‌سازید.

  </Step>

  <Step title="Create persistent host directories">
    کانتینرهای Docker گذرا هستند.
    همه وضعیت‌های بلندمدت باید روی میزبان قرار بگیرند.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configure environment variables">
    فایل `.env` را در ریشه مخزن ایجاد کنید.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    وقتی می‌خواهید توکن پایدار gateway را از طریق `.env` مدیریت کنید،
    `OPENCLAW_GATEWAY_TOKEN` را تنظیم کنید؛ در غیر این صورت، پیش از تکیه بر
    کلاینت‌ها در راه‌اندازی‌های مجدد، `gateway.auth.token` را پیکربندی کنید.
    اگر هیچ‌کدام از این منابع وجود نداشته باشد، OpenClaw برای آن راه‌اندازی
    از یک توکن فقط در زمان اجرا استفاده می‌کند. یک گذرواژه keyring تولید کنید
    و آن را در `GOG_KEYRING_PASSWORD` جای‌گذاری کنید:

    ```bash
    openssl rand -hex 32
    ```

    **این فایل را commit نکنید.**

    این فایل `.env` برای env کانتینر/محیط اجرا مانند `OPENCLAW_GATEWAY_TOKEN` است.
    احراز هویت ذخیره‌شده OAuth/API-key مربوط به providerها در مسیر mount‌شده‌ی
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارد.

  </Step>

  <Step title="Docker Compose configuration">
    `docker-compose.yml` را ایجاد یا به‌روزرسانی کنید.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` فقط برای راحتی bootstrap است و جایگزین پیکربندی درست gateway نیست. همچنان auth (`gateway.auth.token` یا گذرواژه) را تنظیم کنید و برای deployment خود از تنظیمات bind ایمن استفاده کنید.

  </Step>

  <Step title="Shared Docker VM runtime steps">
    برای جریان مشترک میزبان Docker از راهنمای محیط اجرای مشترک استفاده کنید:

    - [قراردادن باینری‌های لازم داخل image](/fa/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ساخت و راه‌اندازی](/fa/install/docker-vm-runtime#build-and-launch)
    - [چه چیزی کجا ماندگار می‌شود](/fa/install/docker-vm-runtime#what-persists-where)
    - [به‌روزرسانی‌ها](/fa/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specific access">
    پس از مراحل ساخت و راه‌اندازی مشترک، برای باز کردن تونل، راه‌اندازی زیر را کامل کنید:

    **پیش‌نیاز:** مطمئن شوید پیکربندی sshd در VPS شما بازارسال TCP را مجاز می‌کند. اگر
    پیکربندی SSH خود را سخت‌گیرانه کرده‌اید، `/etc/ssh/sshd_config` را بررسی کنید و تنظیم کنید:

    ```
    AllowTcpForwarding local
    ```

    `local` بازارسال‌های محلی `ssh -L` از لپ‌تاپ شما را مجاز می‌کند و هم‌زمان
    بازارسال‌های راه‌دور از سرور را مسدود می‌کند. تنظیم آن روی `no` باعث شکست تونل
    با این پیام می‌شود:
    `channel 3: open failed: administratively prohibited: open failed`

    پس از تأیید فعال بودن بازارسال TCP، سرویس SSH را راه‌اندازی مجدد کنید
    (`systemctl restart ssh`) و تونل را از لپ‌تاپ خود اجرا کنید:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    باز کنید:

    `http://127.0.0.1:18789/`

    راز مشترک پیکربندی‌شده را جای‌گذاری کنید. این راهنما به‌صورت پیش‌فرض از توکن gateway
    استفاده می‌کند؛ اگر به احراز هویت با گذرواژه تغییر داده‌اید، به‌جای آن از همان گذرواژه استفاده کنید.

  </Step>
</Steps>

نقشه ماندگاری مشترک در [محیط اجرای Docker VM](/fa/install/docker-vm-runtime#what-persists-where) قرار دارد.

## زیرساخت به‌صورت کد (Terraform)

برای تیم‌هایی که گردش‌کارهای زیرساخت‌به‌صورت‌کد را ترجیح می‌دهند، یک راه‌اندازی Terraform نگه‌داری‌شده توسط جامعه این موارد را فراهم می‌کند:

- پیکربندی ماژولار Terraform با مدیریت وضعیت راه‌دور
- provision خودکار از طریق cloud-init
- اسکریپت‌های deployment (bootstrap، deploy، backup/restore)
- سخت‌سازی امنیتی (دیواره آتش، UFW، دسترسی فقط از طریق SSH)
- پیکربندی تونل SSH برای دسترسی به gateway

**مخازن:**

- زیرساخت: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- پیکربندی Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

این رویکرد راه‌اندازی Docker بالا را با deploymentهای بازتولیدپذیر، زیرساخت نسخه‌بندی‌شده، و بازیابی خودکار از فاجعه تکمیل می‌کند.

<Note>
نگه‌داری‌شده توسط جامعه. برای مشکلات یا مشارکت‌ها، پیوندهای مخزن بالا را ببینید.
</Note>

## گام‌های بعدی

- راه‌اندازی کانال‌های پیام‌رسانی: [کانال‌ها](/fa/channels)
- پیکربندی Gateway: [پیکربندی Gateway](/fa/gateway/configuration)
- به‌روز نگه داشتن OpenClaw: [به‌روزرسانی](/fa/install/updating)

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Fly.io](/fa/install/fly)
- [Docker](/fa/install/docker)
- [میزبانی VPS](/fa/vps)
