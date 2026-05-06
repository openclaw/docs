---
read_when:
    - می‌خواهید OpenClaw به‌صورت 24/7 روی یک VPS ابری اجرا شود (نه روی لپ‌تاپ شما)
    - به یک Gateway همیشه‌فعال و در سطح تولید روی سرور خصوصی مجازی خودتان نیاز دارید
    - می‌خواهید کنترل کاملی بر ماندگاری، باینری‌ها و رفتار راه‌اندازی مجدد داشته باشید
    - شما OpenClaw را در Docker روی Hetzner یا یک ارائه‌دهنده مشابه اجرا می‌کنید
summary: OpenClaw Gateway را به‌صورت ۲۴/۷ روی یک VPS ارزان Hetzner (Docker) با وضعیت پایدار و باینری‌های تعبیه‌شده اجرا کنید
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T09:25:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2625a028b6242f653d29b8f45035bf2d796c5c60453582cf269fd1c3776eca52
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw روی Hetzner (Docker، راهنمای VPS تولید)

## هدف

اجرای یک Gateway پایدار OpenClaw روی یک VPS از Hetzner با استفاده از Docker، همراه با وضعیت ماندگار، باینری‌های ازپیش‌پخته‌شده، و رفتار راه‌اندازی مجدد ایمن.

اگر «OpenClaw ۲۴/۷ با حدود ۵ دلار» می‌خواهید، این ساده‌ترین راه‌اندازی قابل‌اعتماد است.
قیمت‌های Hetzner تغییر می‌کنند؛ کوچک‌ترین VPS با Debian/Ubuntu را انتخاب کنید و اگر به خطاهای کمبود حافظه برخوردید، آن را بزرگ‌تر کنید.

یادآوری مدل امنیتی:

- عامل‌های مشترک شرکتی وقتی مناسب‌اند که همه در یک مرز اعتماد باشند و runtime فقط کاری باشد.
- جداسازی سخت‌گیرانه را حفظ کنید: VPS/runtime اختصاصی + حساب‌های اختصاصی؛ هیچ پروفایل شخصی Apple/Google/مرورگر/مدیر گذرواژه‌ای روی آن میزبان نباشد.
- اگر کاربران نسبت به هم خصمانه‌اند، بر اساس gateway/host/کاربر OS جدا کنید.

[امنیت](/fa/gateway/security) و [میزبانی VPS](/fa/vps) را ببینید.

## داریم چه کار می‌کنیم (به زبان ساده)؟

- اجاره یک سرور Linux کوچک (VPS از Hetzner)
- نصب Docker (runtime ایزوله برای برنامه)
- راه‌اندازی OpenClaw Gateway در Docker
- ماندگار کردن `~/.openclaw` + `~/.openclaw/workspace` روی میزبان (پس از راه‌اندازی مجدد/بازسازی باقی می‌ماند)
- دسترسی به Control UI از لپ‌تاپ از طریق یک تونل SSH

آن وضعیت mount‌شده‌ی `~/.openclaw` شامل `openclaw.json`، فایل‌های هر عامل
`agents/<agentId>/agent/auth-profiles.json`، و `.env` است.

Gateway از این راه‌ها قابل دسترسی است:

- پورت‌فورواردینگ SSH از لپ‌تاپ
- در معرض گذاشتن مستقیم پورت، اگر firewall و tokenها را خودتان مدیریت می‌کنید

این راهنما Ubuntu یا Debian روی Hetzner را فرض می‌کند.  
اگر روی VPS لینوکسی دیگری هستید، بسته‌ها را متناسب با آن نگاشت کنید.
برای جریان عمومی Docker، [Docker](/fa/install/docker) را ببینید.

---

## مسیر سریع (برای اپراتورهای باتجربه)

1. ساخت VPS در Hetzner
2. نصب Docker
3. clone کردن مخزن OpenClaw
4. ایجاد دایرکتوری‌های ماندگار روی میزبان
5. پیکربندی `.env` و `docker-compose.yml`
6. پختن باینری‌های لازم در image
7. `docker compose up -d`
8. تأیید ماندگاری و دسترسی Gateway

---

## چیزهایی که نیاز دارید

- VPS از Hetzner با دسترسی root
- دسترسی SSH از لپ‌تاپ
- آشنایی پایه با SSH + کپی/پیست
- حدود ۲۰ دقیقه
- Docker و Docker Compose
- اعتبارنامه‌های احراز هویت مدل
- اعتبارنامه‌های اختیاری provider
  - QR واتساپ
  - token ربات Telegram
  - OAuth جیمیل

---

<Steps>
  <Step title="Provision the VPS">
    یک VPS با Ubuntu یا Debian در Hetzner بسازید.

    به‌عنوان root وصل شوید:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    این راهنما فرض می‌کند VPS حالت‌مند است.
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
    همه وضعیت‌های بلندمدت باید روی میزبان زندگی کنند.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configure environment variables">
    در ریشه مخزن، `.env` بسازید.

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

    `OPENCLAW_GATEWAY_TOKEN` را خالی بگذارید، مگر اینکه صراحتاً بخواهید آن را
    از طریق `.env` مدیریت کنید؛ OpenClaw در اولین شروع یک token تصادفی gateway
    را در config می‌نویسد. یک گذرواژه keyring بسازید و آن را در
    `GOG_KEYRING_PASSWORD` وارد کنید:

    ```bash
    openssl rand -hex 32
    ```

    **این فایل را commit نکنید.**

    این فایل `.env` برای env کانتینر/runtime مانند `OPENCLAW_GATEWAY_TOKEN` است.
    احراز هویت OAuth/API-key ذخیره‌شده‌ی providerها در فایل mount‌شده‌ی
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار می‌گیرد.

  </Step>

  <Step title="Docker Compose configuration">
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

    `--allow-unconfigured` فقط برای راحتی bootstrap است و جایگزین پیکربندی درست gateway نیست. همچنان auth (`gateway.auth.token` یا گذرواژه) را تنظیم کنید و برای استقرار خود از تنظیمات bind ایمن استفاده کنید.

  </Step>

  <Step title="Shared Docker VM runtime steps">
    برای جریان مشترک میزبان Docker از راهنمای runtime مشترک استفاده کنید:

    - [پختن باینری‌های لازم در image](/fa/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ساخت و راه‌اندازی](/fa/install/docker-vm-runtime#build-and-launch)
    - [چه چیزی کجا ماندگار می‌شود](/fa/install/docker-vm-runtime#what-persists-where)
    - [به‌روزرسانی‌ها](/fa/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specific access">
    پس از مراحل ساخت و راه‌اندازی مشترک، برای باز کردن تونل این راه‌اندازی را کامل کنید:

    **پیش‌نیاز:** مطمئن شوید پیکربندی sshd روی VPS اجازه TCP forwarding می‌دهد. اگر
    پیکربندی SSH خود را سخت‌گیرانه کرده‌اید، `/etc/ssh/sshd_config` را بررسی کنید و تنظیم کنید:

    ```
    AllowTcpForwarding local
    ```

    `local` اجازه forward محلی `ssh -L` را از لپ‌تاپ شما می‌دهد، در حالی که
    forwardهای remote از سرور را مسدود می‌کند. تنظیم آن روی `no` باعث شکست تونل
    با این خطا می‌شود:
    `channel 3: open failed: administratively prohibited: open failed`

    پس از تأیید فعال بودن TCP forwarding، سرویس SSH را restart کنید
    (`systemctl restart ssh`) و تونل را از لپ‌تاپ اجرا کنید:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    باز کنید:

    `http://127.0.0.1:18789/`

    secret مشترک پیکربندی‌شده را paste کنید. این راهنما به‌صورت پیش‌فرض از token
    gateway استفاده می‌کند؛ اگر به احراز هویت با گذرواژه تغییر داده‌اید، به‌جای آن از همان گذرواژه استفاده کنید.

  </Step>
</Steps>

نقشه ماندگاری مشترک در [Docker VM Runtime](/fa/install/docker-vm-runtime#what-persists-where) قرار دارد.

## زیرساخت به‌عنوان کد (Terraform)

برای تیم‌هایی که جریان‌های کاری زیرساخت‌به‌عنوان‌کد را ترجیح می‌دهند، یک راه‌اندازی Terraform نگهداری‌شده توسط جامعه این موارد را فراهم می‌کند:

- پیکربندی ماژولار Terraform با مدیریت remote state
- provisioning خودکار از طریق cloud-init
- اسکریپت‌های استقرار (bootstrap، deploy، backup/restore)
- سخت‌سازی امنیتی (firewall، UFW، دسترسی فقط از طریق SSH)
- پیکربندی تونل SSH برای دسترسی gateway

**مخزن‌ها:**

- زیرساخت: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- پیکربندی Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

این رویکرد راه‌اندازی Docker بالا را با استقرارهای تکرارپذیر، زیرساخت version-controlled، و بازیابی خودکار در بحران تکمیل می‌کند.

<Note>
نگهداری‌شده توسط جامعه. برای issues یا مشارکت‌ها، پیوندهای مخزن بالا را ببینید.
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
