---
read_when:
    - می‌خواهید OpenClaw به‌صورت شبانه‌روزی روی یک VPS ابری اجرا شود (نه روی لپ‌تاپتان)
    - شما یک Gateway همیشه‌فعال و در سطح تولید روی VPS خودتان می‌خواهید
    - می‌خواهید کنترل کاملی بر ماندگاری، فایل‌های اجرایی و رفتار راه‌اندازی مجدد داشته باشید
    - شما OpenClaw را در Docker روی Hetzner یا ارائه‌دهنده‌ای مشابه اجرا می‌کنید
summary: Gateway ‏OpenClaw را به‌صورت شبانه‌روزی روی یک VPS ارزان‌قیمت Hetzner (Docker)، با وضعیت پایدار و فایل‌های اجرایی ازپیش‌تعبیه‌شده اجرا کنید
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T10:16:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

یک Gateway پایدار OpenClaw را با استفاده از Docker روی یک VPS از Hetzner اجرا کنید؛ به‌گونه‌ای که وضعیت ماندگار، فایل‌های اجرایی تعبیه‌شده و رفتار راه‌اندازی مجدد ایمن داشته باشد.

قیمت‌گذاری Hetzner تغییر می‌کند؛ کوچک‌ترین VPS مبتنی بر Debian/Ubuntu را که پاسخ‌گوی نیازتان است انتخاب کنید و اگر با خطاهای کمبود حافظه مواجه شدید، منابع آن را افزایش دهید.

می‌توانید از طریق انتقال پورت SSH از لپ‌تاپ خود به Gateway دسترسی پیدا کنید، یا اگر دیوارهٔ آتش و توکن‌ها را شخصاً مدیریت می‌کنید، پورت را مستقیماً در دسترس قرار دهید.

یادآوری مدل امنیتی:

- عامل‌های مشترک در سطح شرکت زمانی مناسب‌اند که همه در یک مرز اعتماد یکسان باشند و محیط اجرا فقط برای امور تجاری استفاده شود.
- جداسازی سخت‌گیرانه را حفظ کنید: VPS/محیط اجرای اختصاصی + حساب‌های اختصاصی؛ هیچ نمایهٔ شخصی Apple، Google، مرورگر یا مدیر گذرواژه‌ای روی آن میزبان قرار ندهید.
- اگر کاربران نسبت به یکدیگر خصمانه‌اند، آن‌ها را بر اساس Gateway، میزبان یا کاربر سیستم‌عامل تفکیک کنید.

به [امنیت](/fa/gateway/security) و [میزبانی VPS](/fa/vps) مراجعه کنید.

این راهنما استفاده از Ubuntu یا Debian روی Hetzner را فرض می‌کند. در یک VPS لینوکسی دیگر، بسته‌های متناظر را به‌کار ببرید. برای فرایند عمومی Docker، به [Docker](/fa/install/docker) مراجعه کنید.

## آنچه نیاز دارید

- یک VPS از Hetzner با دسترسی root
- دسترسی SSH از لپ‌تاپ
- Docker و Docker Compose
- اطلاعات احراز هویت مدل
- اطلاعات احراز هویت اختیاری ارائه‌دهندگان (کد QR در WhatsApp، توکن ربات Telegram، OAuth در Gmail)
- حدود ۲۰ دقیقه

## مسیر سریع

1. آماده‌سازی VPS در Hetzner
2. نصب Docker
3. شبیه‌سازی مخزن OpenClaw
4. ایجاد دایرکتوری‌های ماندگار روی میزبان
5. پیکربندی `.env` و `docker-compose.yml`
6. تعبیهٔ فایل‌های اجرایی موردنیاز در ایمیج
7. اجرای `docker compose up -d`
8. تأیید ماندگاری و دسترسی به Gateway

<Steps>
  <Step title="آماده‌سازی VPS">
    یک VPS مبتنی بر Ubuntu یا Debian در Hetzner ایجاد کنید، سپس به‌عنوان root متصل شوید:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    با VPS به‌عنوان زیرساختی دارای وضعیت و نه یک زیرساخت دورریختنی رفتار کنید.

  </Step>

  <Step title="نصب Docker (روی VPS)">
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

  <Step title="شبیه‌سازی مخزن OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    این راهنما یک ایمیج سفارشی می‌سازد تا هر فایل اجرایی که در آن تعبیه می‌کنید، پس از راه‌اندازی مجدد باقی بماند.

  </Step>

  <Step title="ایجاد دایرکتوری‌های ماندگار روی میزبان">
    کانتینرهای Docker موقتی‌اند؛ تمام وضعیت‌های بلندمدت باید روی میزبان قرار گیرند.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="پیکربندی متغیرهای محیطی">
    فایل `.env` را در ریشهٔ مخزن ایجاد کنید:

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

    برای مدیریت توکن پایدار Gateway از طریق `.env`، مقدار `OPENCLAW_GATEWAY_TOKEN` را تنظیم کنید؛ در غیر این صورت، پیش از اتکا به کلاینت‌ها در راه‌اندازی‌های مجدد، `gateway.auth.token` را پیکربندی کنید. اگر هیچ‌کدام تنظیم نشده باشند، OpenClaw برای همان راه‌اندازی از توکنی مختص محیط اجرای جاری استفاده می‌کند. برای `GOG_KEYRING_PASSWORD` یک گذرواژهٔ جاکلیدی ایجاد کنید:

    ```bash
    openssl rand -hex 32
    ```

    **این فایل را ثبت نکنید.** این فایل شامل متغیرهای محیطی کانتینر/محیط اجرا مانند `OPENCLAW_GATEWAY_TOKEN` است. احراز هویت ذخیره‌شدهٔ ارائه‌دهنده مبتنی بر OAuth/کلید API در فایل سوارشدهٔ `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارد.

  </Step>

  <Step title="پیکربندی Docker Compose">
    فایل `docker-compose.yml` را ایجاد یا به‌روزرسانی کنید:

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

    گزینهٔ `--allow-unconfigured` فقط برای سهولت راه‌اندازی اولیه است و جایگزین پیکربندی واقعی Gateway نیست. همچنان احراز هویت (`gateway.auth.token` یا گذرواژه) و یک حالت اتصال ایمن را برای استقرار خود تنظیم کنید.

  </Step>

  <Step title="مراحل مشترک محیط اجرای ماشین مجازی Docker">
    برای فرایند مشترک میزبان Docker، راهنمای محیط اجرای مشترک را دنبال کنید:

    - [تعبیهٔ فایل‌های اجرایی موردنیاز در ایمیج](/fa/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ساخت و اجرا](/fa/install/docker-vm-runtime#build-and-launch)
    - [چه چیزی در کجا ماندگار می‌شود](/fa/install/docker-vm-runtime#what-persists-where)
    - [به‌روزرسانی‌ها](/fa/install/docker-vm-runtime#updates)

  </Step>

  <Step title="دسترسی مختص Hetzner">
    پس از انجام مراحل مشترک ساخت و اجرا، تونل را باز کنید.

    **پیش‌نیاز:** مطمئن شوید پیکربندی sshd در VPS اجازهٔ انتقال TCP را می‌دهد. اگر پیکربندی SSH خود را سخت‌گیرانه کرده‌اید، فایل `/etc/ssh/sshd_config` را بررسی و مقدار زیر را تنظیم کنید:

    ```text
    AllowTcpForwarding local
    ```

    مقدار `local` ضمن مسدودکردن انتقال‌های راه‌دور از سرور، انتقال‌های محلی `ssh -L` را از لپ‌تاپ شما مجاز می‌کند. تنظیم آن روی `no` باعث شکست تونل با خطای زیر می‌شود:
    `channel 3: open failed: administratively prohibited: open failed`

    پس از تأیید فعال‌بودن انتقال TCP، سرویس SSH را راه‌اندازی مجدد کنید (`systemctl restart ssh`) و تونل را از لپ‌تاپ خود اجرا کنید:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    نشانی `http://127.0.0.1:18789/` را باز کنید و راز مشترک پیکربندی‌شده را وارد کنید. این راهنما به‌طور پیش‌فرض از توکن Gateway استفاده می‌کند؛ اگر به احراز هویت با گذرواژه تغییر داده‌اید، به‌جای آن گذرواژهٔ پیکربندی‌شدهٔ خود را وارد کنید.

  </Step>
</Steps>

نقشهٔ مشترک ماندگاری در [محیط اجرای ماشین مجازی Docker](/fa/install/docker-vm-runtime#what-persists-where) قرار دارد.

## زیرساخت به‌صورت کد (Terraform)

برای تیم‌هایی که فرایندهای زیرساخت به‌صورت کد را ترجیح می‌دهند، یک پیکربندی Terraform با نگهداری جامعه امکانات زیر را فراهم می‌کند:

- پیکربندی ماژولار Terraform با مدیریت وضعیت راه‌دور
- آماده‌سازی خودکار از طریق cloud-init
- اسکریپت‌های استقرار (راه‌اندازی اولیه، استقرار، پشتیبان‌گیری/بازیابی)
- مقاوم‌سازی امنیتی (دیوارهٔ آتش، UFW، دسترسی فقط از طریق SSH)
- پیکربندی تونل SSH برای دسترسی به Gateway

**مخازن:**

- زیرساخت: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- پیکربندی Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

این رویکرد، پیکربندی Docker بالا را با استقرارهای تکرارپذیر، زیرساخت تحت کنترل نسخه و بازیابی خودکار پس از خرابی تکمیل می‌کند.

<Note>
این پروژه توسط جامعه نگهداری می‌شود. برای گزارش مشکلات یا مشارکت، به پیوندهای مخزن در بالا مراجعه کنید.
</Note>

## مراحل بعدی

- راه‌اندازی کانال‌های پیام‌رسانی: [کانال‌ها](/fa/channels)
- پیکربندی Gateway: [پیکربندی Gateway](/fa/gateway/configuration)
- به‌روز نگه‌داشتن OpenClaw: [به‌روزرسانی](/fa/install/updating)

## مطالب مرتبط

- [نمای کلی نصب](/fa/install)
- [Fly.io](/fa/install/fly)
- [Docker](/fa/install/docker)
- [میزبانی VPS](/fa/vps)
