---
read_when:
    - می‌خواهید OpenClaw به‌صورت ۲۴/۷ روی GCP اجرا شود
    - شما یک Gateway همیشه‌روشن و آمادهٔ تولید روی ماشین مجازی خودتان می‌خواهید
    - می‌خواهید کنترل کاملی بر ماندگاری، فایل‌های باینری و رفتار راه‌اندازی مجدد داشته باشید
summary: اجرای 24/7 OpenClaw Gateway روی یک VM در GCP Compute Engine (Docker) با حالت ماندگار
title: GCP
x-i18n:
    generated_at: "2026-04-29T23:04:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 16
---

# OpenClaw روی GCP Compute Engine (Docker، راهنمای VPS تولید)

## هدف

اجرای یک OpenClaw Gateway پایدار روی یک ماشین مجازی GCP Compute Engine با استفاده از Docker، همراه با وضعیت ماندگار، باینری‌های ازپیش‌پخته‌شده، و رفتار راه‌اندازی مجدد امن.

اگر «OpenClaw شبانه‌روزی با حدود ۵ تا ۱۲ دلار در ماه» می‌خواهید، این یک راه‌اندازی قابل‌اعتماد روی Google Cloud است.
قیمت‌گذاری بر اساس نوع ماشین و منطقه متفاوت است؛ کوچک‌ترین ماشین مجازی‌ای را انتخاب کنید که با بار کاری شما سازگار است و اگر با خطاهای کمبود حافظه روبه‌رو شدید، آن را ارتقا دهید.

## چه کاری انجام می‌دهیم (به زبان ساده)؟

- ایجاد یک پروژه GCP و فعال‌سازی صورت‌حساب
- ایجاد یک ماشین مجازی Compute Engine
- نصب Docker (محیط اجرای جداشده برنامه)
- راه‌اندازی OpenClaw Gateway در Docker
- ماندگار کردن `~/.openclaw` + `~/.openclaw/workspace` روی میزبان (پس از راه‌اندازی مجدد/بازسازی باقی می‌ماند)
- دسترسی به رابط کاربری کنترل از لپ‌تاپ از طریق تونل SSH

آن وضعیت متصل‌شده `~/.openclaw` شامل `openclaw.json`، فایل‌های
`agents/<agentId>/agent/auth-profiles.json` مربوط به هر عامل، و `.env` است.

Gateway از این روش‌ها قابل دسترسی است:

- انتقال پورت SSH از لپ‌تاپ شما
- در معرض قرار دادن مستقیم پورت، اگر خودتان دیواره آتش و توکن‌ها را مدیریت می‌کنید

این راهنما از Debian روی GCP Compute Engine استفاده می‌کند.
Ubuntu نیز کار می‌کند؛ بسته‌ها را متناسب با آن تطبیق دهید.
برای جریان عمومی Docker، [Docker](/fa/install/docker) را ببینید.

---

## مسیر سریع (اپراتورهای باتجربه)

1. ایجاد پروژه GCP + فعال‌سازی Compute Engine API
2. ایجاد ماشین مجازی Compute Engine (e2-small، Debian 12، 20GB)
3. اتصال SSH به ماشین مجازی
4. نصب Docker
5. کلون کردن مخزن OpenClaw
6. ایجاد دایرکتوری‌های ماندگار میزبان
7. پیکربندی `.env` و `docker-compose.yml`
8. پختن باینری‌های لازم، ساخت، و اجرا

---

## چیزهایی که نیاز دارید

- حساب GCP (واجد شرایط سطح رایگان برای e2-micro)
- CLI مربوط به gcloud نصب‌شده (یا استفاده از Cloud Console)
- دسترسی SSH از لپ‌تاپ
- آشنایی پایه با SSH + کپی/پیست
- حدود ۲۰ تا ۳۰ دقیقه
- Docker و Docker Compose
- اعتبارنامه‌های احراز هویت مدل
- اعتبارنامه‌های اختیاری ارائه‌دهنده
  - QR مربوط به WhatsApp
  - توکن ربات Telegram
  - OAuth مربوط به Gmail

---

<Steps>
  <Step title="نصب gcloud CLI (یا استفاده از Console)">
    **گزینه A: gcloud CLI** (برای خودکارسازی توصیه می‌شود)

    از [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) نصب کنید

    مقداردهی اولیه و احراز هویت:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **گزینه B: Cloud Console**

    همه مراحل را می‌توان از طریق رابط کاربری وب در [https://console.cloud.google.com](https://console.cloud.google.com) انجام داد

  </Step>

  <Step title="ایجاد یک پروژه GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    صورت‌حساب را در [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) فعال کنید (برای Compute Engine لازم است).

    Compute Engine API را فعال کنید:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. به IAM & Admin > Create Project بروید
    2. نام‌گذاری کنید و بسازید
    3. صورت‌حساب را برای پروژه فعال کنید
    4. به APIs & Services > Enable APIs بروید > عبارت "Compute Engine API" را جست‌وجو کنید > Enable

  </Step>

  <Step title="ایجاد ماشین مجازی">
    **انواع ماشین:**

    | نوع       | مشخصات                  | هزینه              | نکات                                         |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU، 4GB RAM          | حدود ۲۵ دلار/ماه   | قابل‌اعتمادترین گزینه برای ساخت‌های محلی Docker |
    | e2-small  | 2 vCPU، 2GB RAM          | حدود ۱۲ دلار/ماه   | حداقل گزینه پیشنهادی برای ساخت Docker        |
    | e2-micro  | 2 vCPU (اشتراکی)، 1GB RAM | واجد شرایط سطح رایگان | اغلب در ساخت Docker به‌دلیل کمبود حافظه شکست می‌خورد (خروج 137) |

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

  <Step title="اتصال SSH به ماشین مجازی">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    در داشبورد Compute Engine، روی دکمه "SSH" کنار ماشین مجازی خود کلیک کنید.

    نکته: انتشار کلید SSH پس از ایجاد ماشین مجازی ممکن است ۱ تا ۲ دقیقه طول بکشد. اگر اتصال رد شد، صبر کنید و دوباره تلاش کنید.

  </Step>

  <Step title="نصب Docker (روی ماشین مجازی)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    برای اعمال تغییر گروه، خارج شوید و دوباره وارد شوید:

    ```bash
    exit
    ```

    سپس دوباره با SSH وصل شوید:

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

    این راهنما فرض می‌کند برای تضمین ماندگاری باینری، یک تصویر سفارشی خواهید ساخت.

  </Step>

  <Step title="ایجاد دایرکتوری‌های ماندگار میزبان">
    کانتینرهای Docker گذرا هستند.
    همه وضعیت‌های بلندمدت باید روی میزبان زندگی کنند.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="پیکربندی متغیرهای محیطی">
    فایل `.env` را در ریشه مخزن ایجاد کنید.

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
    از طریق `.env` مدیریت کنید؛ OpenClaw در اولین شروع، یک توکن تصادفی Gateway را
    در پیکربندی می‌نویسد. یک گذرواژه keyring تولید کنید و آن را در
    `GOG_KEYRING_PASSWORD` قرار دهید:

    ```bash
    openssl rand -hex 32
    ```

    **این فایل را commit نکنید.**

    این فایل `.env` برای محیط کانتینر/زمان اجرا مانند `OPENCLAW_GATEWAY_TOKEN` است.
    احراز هویت ذخیره‌شده OAuth/API-key ارائه‌دهنده در فایل متصل‌شده
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` زندگی می‌کند.

  </Step>

  <Step title="پیکربندی Docker Compose">
    فایل `docker-compose.yml` را ایجاد یا به‌روزرسانی کنید.

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

    `--allow-unconfigured` فقط برای سهولت راه‌اندازی اولیه است و جایگزین پیکربندی درست Gateway نیست. همچنان احراز هویت (`gateway.auth.token` یا گذرواژه) را تنظیم کنید و از تنظیمات bind امن برای استقرار خود استفاده کنید.

  </Step>

  <Step title="مراحل مشترک زمان اجرای ماشین مجازی Docker">
    برای جریان رایج میزبان Docker از راهنمای مشترک زمان اجرا استفاده کنید:

    - [پختن باینری‌های لازم در تصویر](/fa/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ساخت و اجرا](/fa/install/docker-vm-runtime#build-and-launch)
    - [چه چیزی کجا ماندگار می‌شود](/fa/install/docker-vm-runtime#what-persists-where)
    - [به‌روزرسانی‌ها](/fa/install/docker-vm-runtime#updates)

  </Step>

  <Step title="نکات اجرای ویژه GCP">
    در GCP، اگر ساخت هنگام اجرای `pnpm install --frozen-lockfile` با `Killed` یا `exit code 137` شکست خورد، ماشین مجازی حافظه کافی ندارد. حداقل از `e2-small` استفاده کنید، یا برای ساخت‌های اولیه قابل‌اعتمادتر `e2-medium` را به‌کار ببرید.

    هنگام bind کردن به LAN (`OPENCLAW_GATEWAY_BIND=lan`)، پیش از ادامه یک origin مرورگر مورد اعتماد پیکربندی کنید:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    اگر پورت Gateway را تغییر داده‌اید، `18789` را با پورت پیکربندی‌شده خود جایگزین کنید.

  </Step>

  <Step title="دسترسی از لپ‌تاپ">
    برای انتقال پورت Gateway یک تونل SSH ایجاد کنید:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    در مرورگر خود باز کنید:

    `http://127.0.0.1:18789/`

    یک پیوند تمیز داشبورد را دوباره چاپ کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    اگر رابط کاربری برای احراز هویت با shared-secret درخواست داد، توکن یا
    گذرواژه پیکربندی‌شده را در تنظیمات رابط کاربری کنترل وارد کنید. این جریان Docker به‌صورت
    پیش‌فرض یک توکن می‌نویسد؛ اگر پیکربندی کانتینر را به احراز هویت با گذرواژه تغییر دهید، به‌جای آن از همان
    گذرواژه استفاده کنید.

    اگر رابط کاربری کنترل `unauthorized` یا `disconnected (1008): pairing required` نشان داد، دستگاه مرورگر را تأیید کنید:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    دوباره به مرجع ماندگاری و به‌روزرسانی مشترک نیاز دارید؟
    [Docker VM Runtime](/fa/install/docker-vm-runtime#what-persists-where) و [به‌روزرسانی‌های Docker VM Runtime](/fa/install/docker-vm-runtime#updates) را ببینید.

  </Step>
</Steps>

---

## عیب‌یابی

**اتصال SSH رد شد**

انتشار کلید SSH پس از ایجاد ماشین مجازی ممکن است ۱ تا ۲ دقیقه طول بکشد. صبر کنید و دوباره تلاش کنید.

**مشکلات OS Login**

پروفایل OS Login خود را بررسی کنید:

```bash
gcloud compute os-login describe-profile
```

مطمئن شوید حساب شما مجوزهای IAM لازم را دارد (Compute OS Login یا Compute OS Admin Login).

**کمبود حافظه (OOM)**

اگر ساخت Docker با `Killed` و `exit code 137` شکست خورد، ماشین مجازی به‌دلیل کمبود حافظه متوقف شده است. به e2-small (حداقل) یا e2-medium (توصیه‌شده برای ساخت‌های محلی قابل‌اعتماد) ارتقا دهید:

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

برای استفاده شخصی، حساب کاربری پیش‌فرض شما کاملاً مناسب است.

برای خودکارسازی یا خط لوله‌های CI/CD، یک حساب سرویس اختصاصی با حداقل مجوزها ایجاد کنید:

1. ایجاد یک حساب سرویس:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. اعطای نقش Compute Instance Admin (یا نقش سفارشی محدودتر):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

از نقش Owner برای خودکارسازی استفاده نکنید. از اصل حداقل دسترسی استفاده کنید.

برای جزئیات نقش‌های IAM، [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) را ببینید.

---

## گام‌های بعدی

- کانال‌های پیام‌رسانی را راه‌اندازی کنید: [کانال‌ها](/fa/channels)
- دستگاه‌های محلی را به‌عنوان گره‌ها جفت کنید: [گره‌ها](/fa/nodes)
- Gateway را پیکربندی کنید: [پیکربندی Gateway](/fa/gateway/configuration)

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Azure](/fa/install/azure)
- [میزبانی VPS](/fa/vps)
