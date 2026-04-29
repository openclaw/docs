---
read_when:
    - می‌خواهید OpenClaw به‌صورت ۲۴/۷ روی یک VPS ابری اجرا شود (نه روی لپ‌تاپتان)
    - شما یک Gateway همیشه‌روشن و در سطح تولید روی VPS خودتان می‌خواهید
    - می‌خواهید کنترل کامل بر ماندگاری، فایل‌های باینری و رفتار راه‌اندازی مجدد داشته باشید
    - شما OpenClaw را در Docker روی Hetzner یا ارائه‌دهنده‌ای مشابه اجرا می‌کنید
summary: OpenClaw Gateway را با وضعیت پایدار و باینری‌های ازپیش‌تعبیه‌شده، به‌صورت ۲۴/۷ روی یک VPS ارزان Hetzner (Docker) اجرا کنید
title: Hetzner
x-i18n:
    generated_at: "2026-04-29T23:04:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw روی Hetzner (Docker، راهنمای VPS تولید)

## هدف

اجرای یک Gateway پایدار OpenClaw روی یک VPS از Hetzner با استفاده از Docker، همراه با وضعیت ماندگار، باینری‌های تعبیه‌شده، و رفتار راه‌اندازی مجدد ایمن.

اگر «OpenClaw به‌صورت ۲۴/۷ با حدود ۵ دلار» می‌خواهید، این ساده‌ترین راه‌اندازی قابل‌اعتماد است.
قیمت‌گذاری Hetzner تغییر می‌کند؛ کوچک‌ترین VPS مبتنی بر Debian/Ubuntu را انتخاب کنید و اگر به OOM برخوردید، آن را ارتقا دهید.

یادآوری مدل امنیتی:

- عامل‌های مشترک شرکتی وقتی مناسب‌اند که همه در یک مرز اعتماد یکسان باشند و محیط اجرا فقط کاری باشد.
- جداسازی سخت‌گیرانه را حفظ کنید: VPS/محیط اجرای اختصاصی + حساب‌های اختصاصی؛ هیچ پروفایل شخصی Apple/Google/مرورگر/مدیر گذرواژه روی آن میزبان نباشد.
- اگر کاربران نسبت به هم خصمانه‌اند، آن‌ها را بر اساس gateway/میزبان/کاربر OS جدا کنید.

[امنیت](/fa/gateway/security) و [میزبانی VPS](/fa/vps) را ببینید.

## در حال انجام چه کاری هستیم (به زبان ساده)؟

- اجاره یک سرور کوچک Linux ‏(VPS از Hetzner)
- نصب Docker (محیط اجرای ایزوله برنامه)
- شروع OpenClaw Gateway در Docker
- ماندگار کردن `~/.openclaw` + `~/.openclaw/workspace` روی میزبان (پس از راه‌اندازی مجدد/بازسازی باقی می‌ماند)
- دسترسی به رابط کاربری کنترل از لپ‌تاپ از طریق یک تونل SSH

آن وضعیت mount‌شده‌ی `~/.openclaw` شامل `openclaw.json`، فایل‌های مخصوص هر عامل
`agents/<agentId>/agent/auth-profiles.json`، و `.env` است.

Gateway را می‌توان از این راه‌ها در دسترس قرار داد:

- انتقال پورت SSH از لپ‌تاپ شما
- باز کردن مستقیم پورت اگر خودتان دیواره آتش و توکن‌ها را مدیریت می‌کنید

این راهنما Ubuntu یا Debian روی Hetzner را فرض می‌کند.  
اگر روی یک VPS لینوکسی دیگر هستید، بسته‌ها را متناسب با آن نگاشت کنید.
برای جریان عمومی Docker، [Docker](/fa/install/docker) را ببینید.

---

## مسیر سریع (اپراتورهای باتجربه)

1. تهیه VPS از Hetzner
2. نصب Docker
3. کلون کردن مخزن OpenClaw
4. ایجاد دایرکتوری‌های ماندگار روی میزبان
5. پیکربندی `.env` و `docker-compose.yml`
6. تعبیه باینری‌های لازم در image
7. `docker compose up -d`
8. بررسی ماندگاری و دسترسی به Gateway

---

## آنچه نیاز دارید

- VPS از Hetzner با دسترسی root
- دسترسی SSH از لپ‌تاپ
- آشنایی پایه با SSH + کپی/پیست
- حدود ۲۰ دقیقه
- Docker و Docker Compose
- اعتبارنامه‌های احراز هویت مدل
- اعتبارنامه‌های اختیاری ارائه‌دهنده
  - QR برای WhatsApp
  - توکن ربات Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="تهیه VPS">
    یک VPS با Ubuntu یا Debian در Hetzner بسازید.

    به‌عنوان root وصل شوید:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    این راهنما فرض می‌کند VPS دارای وضعیت ماندگار است.
    با آن مانند زیرساخت دورریختنی رفتار نکنید.

  </Step>

  <Step title="نصب Docker (روی VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    بررسی کنید:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="کلون کردن مخزن OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    این راهنما فرض می‌کند برای تضمین ماندگاری باینری‌ها، یک image سفارشی خواهید ساخت.

  </Step>

  <Step title="ایجاد دایرکتوری‌های ماندگار روی میزبان">
    کانتینرهای Docker گذرا هستند.
    همه وضعیت‌های بلندمدت باید روی میزبان زندگی کنند.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="پیکربندی متغیرهای محیطی">
    فایل `.env` را در ریشه مخزن بسازید.

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

    `OPENCLAW_GATEWAY_TOKEN` را خالی بگذارید مگر اینکه صریحا بخواهید آن را از طریق
    `.env` مدیریت کنید؛ OpenClaw در شروع نخست، یک توکن تصادفی gateway را در
    پیکربندی می‌نویسد. یک گذرواژه keyring تولید کنید و آن را در
    `GOG_KEYRING_PASSWORD` قرار دهید:

    ```bash
    openssl rand -hex 32
    ```

    **این فایل را commit نکنید.**

    این فایل `.env` برای env مربوط به کانتینر/محیط اجرا مانند `OPENCLAW_GATEWAY_TOKEN` است.
    احراز هویت ذخیره‌شده OAuth/API-key ارائه‌دهنده در فایل mount‌شده‌ی
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارد.

  </Step>

  <Step title="پیکربندی Docker Compose">
    `docker-compose.yml` را بسازید یا به‌روزرسانی کنید.

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

    `--allow-unconfigured` فقط برای راحتی bootstrap است و جایگزین پیکربندی درست gateway نیست. همچنان احراز هویت (`gateway.auth.token` یا گذرواژه) را تنظیم کنید و برای استقرار خود از تنظیمات bind ایمن استفاده کنید.

  </Step>

  <Step title="مراحل محیط اجرای مشترک Docker VM">
    برای جریان رایج میزبان Docker از راهنمای محیط اجرای مشترک استفاده کنید:

    - [تعبیه باینری‌های لازم در image](/fa/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ساخت و راه‌اندازی](/fa/install/docker-vm-runtime#build-and-launch)
    - [چه چیزی کجا ماندگار می‌شود](/fa/install/docker-vm-runtime#what-persists-where)
    - [به‌روزرسانی‌ها](/fa/install/docker-vm-runtime#updates)

  </Step>

  <Step title="دسترسی مخصوص Hetzner">
    پس از مراحل ساخت و راه‌اندازی مشترک، تنظیمات زیر را برای باز کردن تونل کامل کنید:

    **پیش‌نیاز:** مطمئن شوید پیکربندی sshd روی VPS شما اجازه TCP forwarding می‌دهد. اگر
    پیکربندی SSH خود را سخت‌گیرانه کرده‌اید، `/etc/ssh/sshd_config` را بررسی کنید و تنظیم کنید:

    ```
    AllowTcpForwarding local
    ```

    `local` اجازه می‌دهد از لپ‌تاپ خود با `ssh -L` انتقال محلی انجام دهید و در عین حال
    انتقال‌های راه دور از سرور را مسدود می‌کند. تنظیم آن روی `no` تونل را با این خطا
    ناموفق می‌کند:
    `channel 3: open failed: administratively prohibited: open failed`

    پس از تأیید فعال بودن TCP forwarding، سرویس SSH را راه‌اندازی مجدد کنید
    (`systemctl restart ssh`) و تونل را از لپ‌تاپ اجرا کنید:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    باز کنید:

    `http://127.0.0.1:18789/`

    shared secret پیکربندی‌شده را وارد کنید. این راهنما به‌صورت پیش‌فرض از توکن gateway استفاده می‌کند؛ اگر به احراز هویت با گذرواژه تغییر داده‌اید، همان گذرواژه را استفاده کنید.

  </Step>
</Steps>

نقشه ماندگاری مشترک در [محیط اجرای Docker VM](/fa/install/docker-vm-runtime#what-persists-where) قرار دارد.

## زیرساخت به‌عنوان کد (Terraform)

برای تیم‌هایی که جریان‌های کاری زیرساخت به‌عنوان کد را ترجیح می‌دهند، یک راه‌اندازی Terraform نگهداری‌شده توسط جامعه فراهم می‌کند:

- پیکربندی ماژولار Terraform با مدیریت وضعیت راه دور
- provisioning خودکار از طریق cloud-init
- اسکریپت‌های استقرار (bootstrap، deploy، backup/restore)
- سخت‌سازی امنیتی (firewall، UFW، دسترسی فقط از طریق SSH)
- پیکربندی تونل SSH برای دسترسی به gateway

**مخزن‌ها:**

- زیرساخت: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- پیکربندی Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

این رویکرد راه‌اندازی Docker بالا را با استقرارهای تکرارپذیر، زیرساخت تحت کنترل نسخه، و بازیابی خودکار از فاجعه تکمیل می‌کند.

<Note>
نگهداری‌شده توسط جامعه. برای مشکلات یا مشارکت‌ها، پیوندهای مخزن بالا را ببینید.
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
