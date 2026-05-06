---
read_when:
    - می‌خواهید OpenClaw به‌صورت ۲۴/۷ روی GCP اجرا شود
    - شما یک Gateway در سطح تولید و همیشه‌روشن روی ماشین مجازی خودتان می‌خواهید
    - می‌خواهید کنترل کامل بر ماندگاری، باینری‌ها و رفتار راه‌اندازی مجدد داشته باشید
summary: OpenClaw Gateway را به‌صورت ۲۴/۷ روی یک ماشین مجازی GCP Compute Engine (Docker) با وضعیت ماندگار اجرا کنید
title: GCP
x-i18n:
    generated_at: "2026-05-06T17:58:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 678253bd90f0694668400ffddba957e442f8aaed3f5308af3c2481940e104733
    source_path: install/gcp.md
    workflow: 16
---

Gateway پایدار OpenClaw را روی یک VM از نوع GCP Compute Engine با Docker اجرا کنید، با وضعیت ماندگار، باینری‌های از پیش آماده‌شده، و رفتار راه‌اندازی مجدد امن.

اگر «OpenClaw 24/7 با حدود ~$5-12/mo» می‌خواهید، این یک راه‌اندازی قابل اتکا روی Google Cloud است.
قیمت‌گذاری بسته به نوع ماشین و منطقه متفاوت است؛ کوچک‌ترین VM مناسب بار کاری خود را انتخاب کنید و اگر با OOM مواجه شدید، آن را ارتقا دهید.

## چه کاری انجام می‌دهیم (به زبان ساده)؟

- یک پروژه GCP می‌سازیم و صورتحساب را فعال می‌کنیم
- یک VM در Compute Engine می‌سازیم
- Docker را نصب می‌کنیم (محیط اجرای ایزوله برای برنامه)
- OpenClaw Gateway را در Docker اجرا می‌کنیم
- `~/.openclaw` + `~/.openclaw/workspace` را روی میزبان ماندگار می‌کنیم (پس از راه‌اندازی مجدد/بازسازی باقی می‌ماند)
- از لپ‌تاپ خود از طریق تونل SSH به رابط کاربری کنترل دسترسی پیدا می‌کنیم

وضعیت mountشده‌ی `~/.openclaw` شامل `openclaw.json`، فایل‌های هر agent در
`agents/<agentId>/agent/auth-profiles.json`، و `.env` است.

Gateway از این روش‌ها قابل دسترسی است:

- هدایت پورت SSH از لپ‌تاپ شما
- باز کردن مستقیم پورت، اگر خودتان firewall و tokenها را مدیریت می‌کنید

این راهنما از Debian روی GCP Compute Engine استفاده می‌کند.
Ubuntu هم کار می‌کند؛ بسته‌ها را متناسب با آن نگاشت کنید.
برای جریان عمومی Docker، [Docker](/fa/install/docker) را ببینید.

---

## مسیر سریع (برای اپراتورهای باتجربه)

1. پروژه GCP بسازید + API مربوط به Compute Engine را فعال کنید
2. VM در Compute Engine بسازید (e2-small، Debian 12، 20GB)
3. به VM از طریق SSH وصل شوید
4. Docker را نصب کنید
5. مخزن OpenClaw را clone کنید
6. دایرکتوری‌های میزبان ماندگار را بسازید
7. `.env` و `docker-compose.yml` را پیکربندی کنید
8. باینری‌های لازم را داخل image آماده کنید، build بگیرید، و اجرا کنید

---

## به چه چیزهایی نیاز دارید

- حساب GCP (واجد شرایط free tier برای e2-micro)
- نصب بودن gcloud CLI (یا استفاده از Cloud Console)
- دسترسی SSH از لپ‌تاپ
- آشنایی پایه با SSH + کپی/پیست
- حدود ۲۰ تا ۳۰ دقیقه
- Docker و Docker Compose
- اعتبارنامه‌های احراز هویت مدل
- اعتبارنامه‌های اختیاری provider
  - QR مربوط به WhatsApp
  - token ربات Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Install gcloud CLI (or use Console)">
    **گزینه A: gcloud CLI** (پیشنهادی برای automation)

    از [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) نصب کنید

    مقداردهی اولیه و احراز هویت:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **گزینه B: Cloud Console**

    همه مراحل را می‌توان از طریق رابط وب در [https://console.cloud.google.com](https://console.cloud.google.com) انجام داد

  </Step>

  <Step title="Create a GCP project">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    صورتحساب را در [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) فعال کنید (برای Compute Engine لازم است).

    API مربوط به Compute Engine را فعال کنید:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. به IAM & Admin > Create Project بروید
    2. نامی برای آن بگذارید و ایجاد کنید
    3. صورتحساب را برای پروژه فعال کنید
    4. به APIs & Services > Enable APIs بروید > عبارت "Compute Engine API" را جست‌وجو کنید > Enable را بزنید

  </Step>

  <Step title="Create the VM">
    **انواع ماشین:**

    | نوع       | مشخصات                   | هزینه              | نکات                                         |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU، 4GB RAM          | حدود ~$25/mo       | قابل‌اتکاترین گزینه برای buildهای محلی Docker |
    | e2-small  | 2 vCPU، 2GB RAM          | حدود ~$12/mo       | حداقل گزینه پیشنهادی برای build Docker       |
    | e2-micro  | 2 vCPU (مشترک)، 1GB RAM | واجد شرایط free tier | اغلب هنگام build Docker با OOM شکست می‌خورد (exit 137) |

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
    3. Region: `us-central1`، Zone: `us-central1-a`
    4. نوع ماشین: `e2-small`
    5. دیسک راه‌انداز: Debian 12، 20GB
    6. ایجاد کنید

  </Step>

  <Step title="SSH into the VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    در داشبورد Compute Engine، کنار VM خود روی دکمه "SSH" کلیک کنید.

    نکته: انتشار کلید SSH پس از ایجاد VM ممکن است ۱ تا ۲ دقیقه طول بکشد. اگر اتصال رد شد، صبر کنید و دوباره تلاش کنید.

  </Step>

  <Step title="Install Docker (on the VM)">
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

  <Step title="Clone the OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    این راهنما فرض می‌کند برای تضمین ماندگاری باینری‌ها، یک image سفارشی build می‌کنید.

  </Step>

  <Step title="Create persistent host directories">
    کانتینرهای Docker ناپایدار هستند.
    تمام وضعیت‌های بلندمدت باید روی میزبان قرار بگیرند.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configure environment variables">
    در ریشه مخزن، `.env` بسازید.

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

    زمانی `OPENCLAW_GATEWAY_TOKEN` را تنظیم کنید که می‌خواهید token پایدار Gateway
    را از طریق `.env` مدیریت کنید؛ در غیر این صورت پیش از اتکا به clientها در بین
    راه‌اندازی‌های مجدد، `gateway.auth.token` را پیکربندی کنید. اگر هیچ‌کدام از این منابع وجود نداشته باشد، OpenClaw برای آن اجرا از یک token فقط زمان اجرا استفاده می‌کند.
    یک گذرواژه keyring بسازید و آن را در `GOG_KEYRING_PASSWORD` وارد کنید:

    ```bash
    openssl rand -hex 32
    ```

    **این فایل را commit نکنید.**

    این فایل `.env` برای env مربوط به کانتینر/زمان اجرا مانند `OPENCLAW_GATEWAY_TOKEN` است.
    احراز هویت ذخیره‌شده provider از نوع OAuth/API-key در فایل mountشده‌ی
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

    `--allow-unconfigured` فقط برای سهولت bootstrap است و جایگزین پیکربندی درست Gateway نیست. همچنان auth (`gateway.auth.token` یا گذرواژه) را تنظیم کنید و برای استقرار خود از تنظیمات bind امن استفاده کنید.

  </Step>

  <Step title="Shared Docker VM runtime steps">
    برای جریان رایج میزبان Docker، از راهنمای runtime مشترک استفاده کنید:

    - [آماده‌سازی باینری‌های لازم داخل image](/fa/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build و اجرا](/fa/install/docker-vm-runtime#build-and-launch)
    - [چه چیزی کجا ماندگار می‌شود](/fa/install/docker-vm-runtime#what-persists-where)
    - [به‌روزرسانی‌ها](/fa/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-specific launch notes">
    در GCP، اگر build هنگام `pnpm install --frozen-lockfile` با `Killed` یا `exit code 137` شکست خورد، حافظه VM تمام شده است. حداقل از `e2-small` استفاده کنید، یا برای buildهای اولیه قابل‌اتکاتر از `e2-medium` استفاده کنید.

    هنگام bind کردن به LAN (`OPENCLAW_GATEWAY_BIND=lan`)، پیش از ادامه یک browser origin مورد اعتماد پیکربندی کنید:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    اگر پورت Gateway را تغییر داده‌اید، `18789` را با پورت پیکربندی‌شده خود جایگزین کنید.

  </Step>

  <Step title="Access from your laptop">
    یک تونل SSH بسازید تا پورت Gateway را forward کند:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    در مرورگر خود باز کنید:

    `http://127.0.0.1:18789/`

    یک لینک تمیز داشبورد را دوباره چاپ کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    اگر رابط کاربری برای احراز هویت shared-secret درخواست داد، token یا
    گذرواژه پیکربندی‌شده را در تنظیمات رابط کاربری کنترل وارد کنید. این جریان Docker به‌صورت
    پیش‌فرض یک token می‌نویسد؛ اگر پیکربندی کانتینر را به احراز هویت با گذرواژه تغییر دهید، به‌جای آن از همان
    گذرواژه استفاده کنید.

    اگر رابط کاربری کنترل `unauthorized` یا `disconnected (1008): pairing required` نشان داد، دستگاه مرورگر را تأیید کنید:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    دوباره به مرجع مشترک ماندگاری و به‌روزرسانی نیاز دارید؟
    [Docker VM Runtime](/fa/install/docker-vm-runtime#what-persists-where) و [به‌روزرسانی‌های Docker VM Runtime](/fa/install/docker-vm-runtime#updates) را ببینید.

  </Step>
</Steps>

---

## عیب‌یابی

**اتصال SSH رد شد**

انتشار کلید SSH پس از ایجاد VM ممکن است ۱ تا ۲ دقیقه طول بکشد. صبر کنید و دوباره تلاش کنید.

**مشکلات OS Login**

پروفایل OS Login خود را بررسی کنید:

```bash
gcloud compute os-login describe-profile
```

مطمئن شوید حساب شما مجوزهای IAM لازم را دارد (Compute OS Login یا Compute OS Admin Login).

**کمبود حافظه (OOM)**

اگر build Docker با `Killed` و `exit code 137` شکست خورد، VM به‌دلیل OOM متوقف شده است. به e2-small (حداقل) یا e2-medium (پیشنهادی برای buildهای محلی قابل‌اتکا) ارتقا دهید:

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

## Service accountها (بهترین روش امنیتی)

برای استفاده شخصی، حساب کاربری پیش‌فرض شما کافی است.

برای automation یا pipelineهای CI/CD، یک service account اختصاصی با حداقل مجوزها بسازید:

1. یک service account بسازید:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. نقش Compute Instance Admin را اعطا کنید (یا نقش سفارشی محدودتر):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

از نقش Owner برای automation استفاده نکنید. از اصل حداقل دسترسی پیروی کنید.

برای جزئیات نقش‌های IAM، [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) را ببینید.

---

## مراحل بعدی

- کانال‌های پیام‌رسانی را راه‌اندازی کنید: [کانال‌ها](/fa/channels)
- دستگاه‌های محلی را به‌عنوان Nodeها جفت کنید: [Nodeها](/fa/nodes)
- Gateway را پیکربندی کنید: [پیکربندی Gateway](/fa/gateway/configuration)

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Azure](/fa/install/azure)
- [میزبانی VPS](/fa/vps)
