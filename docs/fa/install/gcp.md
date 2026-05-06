---
read_when:
    - می‌خواهید OpenClaw به‌صورت 24/7 روی GCP اجرا شود
    - شما یک Gateway همیشه‌فعال و در سطح تولید روی ماشین مجازی خودتان می‌خواهید
    - می‌خواهید کنترل کاملی بر ماندگاری، فایل‌های باینری و رفتار راه‌اندازی مجدد داشته باشید
summary: OpenClaw Gateway را به‌صورت ۲۴/۷ روی یک VM در GCP Compute Engine (Docker) با وضعیت پایدار اجرا کنید
title: GCP
x-i18n:
    generated_at: "2026-05-06T09:25:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: eefd3a324ababdaa3072cda5354c1d59ddfe80c2f88f24a4ad21208f54636e89
    source_path: install/gcp.md
    workflow: 16
---

یک OpenClaw Gateway پایدار را روی یک VM از نوع GCP Compute Engine با Docker اجرا کنید، با وضعیت بادوام، باینری‌های از پیش تعبیه‌شده، و رفتار راه‌اندازی مجدد ایمن.

اگر «OpenClaw 24/7 با حدود $5-12/mo» می‌خواهید، این یک راه‌اندازی قابل اعتماد روی Google Cloud است.
قیمت‌گذاری بسته به نوع ماشین و منطقه متفاوت است؛ کوچک‌ترین VM مناسب بار کاری خود را انتخاب کنید و اگر با OOM مواجه شدید، مقیاس را افزایش دهید.

## چه کاری انجام می‌دهیم (به زبان ساده)؟

- یک پروژه GCP ایجاد می‌کنیم و صورتحساب را فعال می‌کنیم
- یک VM در Compute Engine ایجاد می‌کنیم
- Docker را نصب می‌کنیم (زمان‌اجرای برنامه ایزوله)
- OpenClaw Gateway را در Docker راه‌اندازی می‌کنیم
- `~/.openclaw` + `~/.openclaw/workspace` را روی میزبان پایدار می‌کنیم (از راه‌اندازی مجدد/بازسازی جان سالم به در می‌برد)
- از لپ‌تاپ خود از طریق یک تونل SSH به Control UI دسترسی پیدا می‌کنیم

آن وضعیت نصب‌شده `~/.openclaw` شامل `openclaw.json`، فایل‌های هر عامل
`agents/<agentId>/agent/auth-profiles.json` و `.env` است.

Gateway از این روش‌ها قابل دسترسی است:

- هدایت پورت SSH از لپ‌تاپ شما
- در معرض‌گذاری مستقیم پورت، اگر خودتان فایروال و توکن‌ها را مدیریت کنید

این راهنما از Debian روی GCP Compute Engine استفاده می‌کند.
Ubuntu نیز کار می‌کند؛ بسته‌ها را متناسب با آن نگاشت کنید.
برای جریان عمومی Docker، [Docker](/fa/install/docker) را ببینید.

---

## مسیر سریع (اپراتورهای باتجربه)

1. پروژه GCP را ایجاد کنید + Compute Engine API را فعال کنید
2. VM در Compute Engine ایجاد کنید (e2-small، Debian 12، 20GB)
3. با SSH وارد VM شوید
4. Docker را نصب کنید
5. مخزن OpenClaw را کلون کنید
6. دایرکتوری‌های پایدار میزبان را ایجاد کنید
7. `.env` و `docker-compose.yml` را پیکربندی کنید
8. باینری‌های لازم را تعبیه کنید، بسازید و اجرا کنید

---

## چه چیزهایی لازم دارید

- حساب GCP (واجد شرایط سطح رایگان برای e2-micro)
- نصب بودن gcloud CLI (یا استفاده از Cloud Console)
- دسترسی SSH از لپ‌تاپ شما
- راحتی پایه با SSH + کپی/جای‌گذاری
- حدود ۲۰ تا ۳۰ دقیقه
- Docker و Docker Compose
- اعتبارنامه‌های احراز هویت مدل
- اعتبارنامه‌های اختیاری ارائه‌دهنده
  - کد QR برای WhatsApp
  - توکن ربات Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="نصب gcloud CLI (یا استفاده از Console)">
    **گزینه A: gcloud CLI** (توصیه‌شده برای خودکارسازی)

    از [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) نصب کنید

    مقداردهی اولیه و احراز هویت:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **گزینه B: Cloud Console**

    همه مراحل را می‌توان از طریق رابط وب در [https://console.cloud.google.com](https://console.cloud.google.com) انجام داد

  </Step>

  <Step title="ایجاد یک پروژه GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    صورتحساب را در [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) فعال کنید (برای Compute Engine الزامی است).

    Compute Engine API را فعال کنید:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. به IAM & Admin > Create Project بروید
    2. نام‌گذاری کنید و بسازید
    3. صورتحساب را برای پروژه فعال کنید
    4. به APIs & Services > Enable APIs بروید > عبارت "Compute Engine API" را جست‌وجو کنید > Enable

  </Step>

  <Step title="ایجاد VM">
    **نوع‌های ماشین:**

    | نوع       | مشخصات                   | هزینه             | نکته‌ها                                      |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU، 4GB RAM          | حدود $25/mo        | قابل اعتمادترین گزینه برای ساخت‌های محلی Docker |
    | e2-small  | 2 vCPU، 2GB RAM          | حدود $12/mo        | حداقل توصیه‌شده برای ساخت Docker             |
    | e2-micro  | 2 vCPU (اشتراکی)، 1GB RAM | واجد شرایط سطح رایگان | اغلب با OOM در ساخت Docker شکست می‌خورد (خروج 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. به Compute Engine > VM instances > Create instance بروید
    2. نام: `openclaw-gateway`
    3. منطقه: `us-central1`، ناحیه: `us-central1-a`
    4. نوع ماشین: `e2-small`
    5. دیسک راه‌انداز: Debian 12، 20GB
    6. ایجاد کنید

  </Step>

  <Step title="ورود به VM با SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    در داشبورد Compute Engine، روی دکمه "SSH" کنار VM خود کلیک کنید.

    نکته: انتشار کلید SSH پس از ایجاد VM ممکن است ۱ تا ۲ دقیقه طول بکشد. اگر اتصال رد شد، صبر کنید و دوباره تلاش کنید.

  </Step>

  <Step title="نصب Docker (روی VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    خارج شوید و دوباره وارد شوید تا تغییر گروه اعمال شود:

    ```bash
    exit
    ```

    سپس دوباره با SSH وارد شوید:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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

    این راهنما فرض می‌کند که یک تصویر سفارشی می‌سازید تا پایداری باینری تضمین شود.

  </Step>

  <Step title="ایجاد دایرکتوری‌های پایدار میزبان">
    کانتینرهای Docker گذرا هستند.
    همه وضعیت‌های بلندمدت باید روی میزبان قرار داشته باشند.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="پیکربندی متغیرهای محیطی">
    در ریشه مخزن، `.env` ایجاد کنید.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    `OPENCLAW_GATEWAY_TOKEN` را خالی بگذارید، مگر اینکه صراحتاً بخواهید آن را
    از طریق `.env` مدیریت کنید؛ OpenClaw در اولین شروع، یک توکن تصادفی Gateway را در
    پیکربندی می‌نویسد. یک گذرواژه keyring بسازید و آن را در
    `GOG_KEYRING_PASSWORD` جای‌گذاری کنید:

    ```bash
    openssl rand -hex 32
    ```

    **این فایل را commit نکنید.**

    این فایل `.env` برای محیط کانتینر/زمان‌اجرا مانند `OPENCLAW_GATEWAY_TOKEN` است.
    احراز هویت OAuth/API-key ذخیره‌شده ارائه‌دهنده در مسیر نصب‌شده
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` قرار دارد.

  </Step>

  <Step title="پیکربندی Docker Compose">
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
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
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

    `--allow-unconfigured` فقط برای راحتی bootstrap است و جایگزین پیکربندی درست Gateway نیست. همچنان احراز هویت (`gateway.auth.token` یا گذرواژه) را تنظیم کنید و برای استقرار خود از تنظیمات bind ایمن استفاده کنید.

  </Step>

  <Step title="مراحل مشترک زمان‌اجرای Docker VM">
    از راهنمای زمان‌اجرای مشترک برای جریان رایج میزبان Docker استفاده کنید:

    - [تعبیه باینری‌های لازم در تصویر](/fa/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ساخت و اجرا](/fa/install/docker-vm-runtime#build-and-launch)
    - [چه چیزی کجا پایدار می‌ماند](/fa/install/docker-vm-runtime#what-persists-where)
    - [به‌روزرسانی‌ها](/fa/install/docker-vm-runtime#updates)

  </Step>

  <Step title="نکته‌های اجرای مخصوص GCP">
    در GCP، اگر ساخت در طول `pnpm install --frozen-lockfile` با `Killed` یا `exit code 137` شکست بخورد، حافظه VM تمام شده است. حداقل از `e2-small` استفاده کنید، یا برای ساخت‌های اولیه قابل اعتمادتر از `e2-medium`.

    هنگام bind کردن به LAN (`OPENCLAW_GATEWAY_BIND=lan`)، پیش از ادامه یک مبدأ مرورگر مورد اعتماد پیکربندی کنید:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    اگر پورت Gateway را تغییر داده‌اید، `18789` را با پورت پیکربندی‌شده خود جایگزین کنید.

  </Step>

  <Step title="دسترسی از لپ‌تاپ شما">
    برای هدایت پورت Gateway، یک تونل SSH ایجاد کنید:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    در مرورگر خود باز کنید:

    `http://127.0.0.1:18789/`

    یک پیوند تمیز داشبورد را دوباره چاپ کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    اگر UI درخواست احراز هویت shared-secret کرد، توکن یا
    گذرواژه پیکربندی‌شده را در تنظیمات Control UI جای‌گذاری کنید. این جریان Docker به‌صورت
    پیش‌فرض یک توکن می‌نویسد؛ اگر پیکربندی کانتینر را به احراز هویت با گذرواژه تغییر دهید، به‌جای آن از همان
    گذرواژه استفاده کنید.

    اگر Control UI پیام `unauthorized` یا `disconnected (1008): pairing required` نشان داد، دستگاه مرورگر را تأیید کنید:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    دوباره به مرجع پایداری و به‌روزرسانی مشترک نیاز دارید؟
    [Docker VM Runtime](/fa/install/docker-vm-runtime#what-persists-where) و [به‌روزرسانی‌های Docker VM Runtime](/fa/install/docker-vm-runtime#updates) را ببینید.

  </Step>
</Steps>

---

## عیب‌یابی

**اتصال SSH رد شد**

انتشار کلید SSH پس از ایجاد VM ممکن است ۱ تا ۲ دقیقه طول بکشد. صبر کنید و دوباره تلاش کنید.

**مشکلات OS Login**

نمایه OS Login خود را بررسی کنید:

```bash
gcloud compute os-login describe-profile
```

مطمئن شوید حساب شما مجوزهای IAM لازم را دارد (Compute OS Login یا Compute OS Admin Login).

**کمبود حافظه (OOM)**

اگر ساخت Docker با `Killed` و `exit code 137` شکست بخورد، فرایند VM به‌دلیل OOM کشته شده است. به e2-small (حداقل) یا e2-medium (توصیه‌شده برای ساخت‌های محلی قابل اعتماد) ارتقا دهید:

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## حساب‌های سرویس (بهترین روش امنیتی)

برای استفاده شخصی، حساب کاربری پیش‌فرض شما به‌خوبی کار می‌کند.

برای خودکارسازی یا خطوط لوله CI/CD، یک حساب سرویس اختصاصی با حداقل مجوزها ایجاد کنید:

1. یک حساب سرویس ایجاد کنید:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. نقش Compute Instance Admin را اعطا کنید (یا یک نقش سفارشی محدودتر):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

از نقش Owner برای خودکارسازی استفاده نکنید. از اصل حداقل سطح دسترسی استفاده کنید.

برای جزئیات نقش‌های IAM، [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) را ببینید.

---

## مراحل بعدی

- کانال‌های پیام‌رسانی را راه‌اندازی کنید: [کانال‌ها](/fa/channels)
- دستگاه‌های محلی را به‌عنوان گره جفت کنید: [گره‌ها](/fa/nodes)
- Gateway را پیکربندی کنید: [پیکربندی Gateway](/fa/gateway/configuration)

## مطالب مرتبط

- [نمای کلی نصب](/fa/install)
- [Azure](/fa/install/azure)
- [میزبانی VPS](/fa/vps)
