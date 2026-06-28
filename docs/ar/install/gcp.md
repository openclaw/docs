---
read_when:
    - تريد أن يعمل OpenClaw على مدار الساعة طوال أيام الأسبوع على GCP
    - تريد Gateway جاهزًا للإنتاج ودائم التشغيل على جهاز VM خاص بك
    - تريد تحكمًا كاملًا في الاستمرارية والملفات التنفيذية وسلوك إعادة التشغيل
summary: شغّل OpenClaw Gateway على مدار الساعة طوال أيام الأسبوع على آلة افتراضية من GCP Compute Engine ‏(Docker) مع حالة دائمة
title: GCP
x-i18n:
    generated_at: "2026-05-06T17:59:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 678253bd90f0694668400ffddba957e442f8aaed3f5308af3c2481940e104733
    source_path: install/gcp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

شغّل OpenClaw Gateway دائمًا على VM في GCP Compute Engine باستخدام Docker، مع حالة دائمة وثنائيات مضمّنة وسلوك إعادة تشغيل آمن.

إذا كنت تريد "OpenClaw 24/7 مقابل حوالي 5-12 دولارًا/شهرًا"، فهذا إعداد موثوق على Google Cloud.
تختلف الأسعار حسب نوع الجهاز والمنطقة؛ اختر أصغر VM تناسب حمل عملك، ثم وسّعها إذا واجهت حالات نفاد ذاكرة (OOM).

## ماذا نفعل (بعبارات بسيطة)؟

- إنشاء مشروع GCP وتفعيل الفوترة
- إنشاء VM في Compute Engine
- تثبيت Docker (بيئة تشغيل تطبيق معزولة)
- تشغيل OpenClaw Gateway في Docker
- إبقاء `~/.openclaw` + `~/.openclaw/workspace` دائمين على المضيف (يبقيان بعد إعادة التشغيل/إعادة البناء)
- الوصول إلى واجهة التحكم من حاسوبك المحمول عبر نفق SSH

تتضمن حالة `~/.openclaw` المثبتة هذه `openclaw.json` وملف
`agents/<agentId>/agent/auth-profiles.json` الخاص بكل وكيل و`.env`.

يمكن الوصول إلى Gateway عبر:

- تمرير منفذ SSH من حاسوبك المحمول
- تعريض المنفذ مباشرة إذا كنت تدير الجدار الناري والرموز المميزة بنفسك

يستخدم هذا الدليل Debian على GCP Compute Engine.
يعمل Ubuntu أيضًا؛ طابِق الحزم وفقًا لذلك.
للمسار العام الخاص بـ Docker، راجع [Docker](/ar/install/docker).

---

## المسار السريع (للمشغلين ذوي الخبرة)

1. أنشئ مشروع GCP + فعّل Compute Engine API
2. أنشئ VM في Compute Engine (e2-small، Debian 12، 20GB)
3. ادخل إلى VM عبر SSH
4. ثبّت Docker
5. استنسخ مستودع OpenClaw
6. أنشئ أدلة مضيف دائمة
7. اضبط `.env` و`docker-compose.yml`
8. ضمّن الثنائيات المطلوبة، وابنِ، وشغّل

---

## ما تحتاج إليه

- حساب GCP (مؤهل للطبقة المجانية لـ e2-micro)
- gcloud CLI مثبتة (أو استخدم Cloud Console)
- وصول SSH من حاسوبك المحمول
- إلمام أساسي بـ SSH + النسخ/اللصق
- ~20-30 دقيقة
- Docker وDocker Compose
- بيانات اعتماد مصادقة النموذج
- بيانات اعتماد مزود اختيارية
  - WhatsApp QR
  - رمز بوت Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="تثبيت gcloud CLI (أو استخدام وحدة التحكم)">
    **الخيار أ: gcloud CLI** (موصى به للأتمتة)

    ثبّت من [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    هيّئ وسجّل الدخول:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **الخيار ب: Cloud Console**

    يمكن تنفيذ جميع الخطوات عبر واجهة الويب في [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="إنشاء مشروع GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    فعّل الفوترة في [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (مطلوبة لـ Compute Engine).

    فعّل Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **وحدة التحكم:**

    1. انتقل إلى IAM والمسؤول > إنشاء مشروع
    2. سمّه وأنشئه
    3. فعّل الفوترة للمشروع
    4. انتقل إلى واجهات API والخدمات > تفعيل واجهات API > ابحث عن "Compute Engine API" > تفعيل

  </Step>

  <Step title="إنشاء VM">
    **أنواع الأجهزة:**

    | النوع     | المواصفات                | التكلفة            | ملاحظات                                      |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU، 4GB RAM          | ~$25/mo            | الأكثر موثوقية لعمليات بناء Docker المحلية  |
    | e2-small  | 2 vCPU، 2GB RAM          | ~$12/mo            | الحد الأدنى الموصى به لبناء Docker           |
    | e2-micro  | 2 vCPU (مشتركة)، 1GB RAM | مؤهل للطبقة المجانية | غالبًا يفشل عند بناء Docker بسبب نفاد الذاكرة (رمز الخروج 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **وحدة التحكم:**

    1. انتقل إلى Compute Engine > مثيلات VM > إنشاء مثيل
    2. الاسم: `openclaw-gateway`
    3. المنطقة: `us-central1`، النطاق: `us-central1-a`
    4. نوع الجهاز: `e2-small`
    5. قرص الإقلاع: Debian 12، 20GB
    6. أنشئ

  </Step>

  <Step title="الدخول إلى VM عبر SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **وحدة التحكم:**

    انقر زر "SSH" بجوار VM الخاصة بك في لوحة معلومات Compute Engine.

    ملاحظة: قد يستغرق نشر مفتاح SSH مدة 1-2 دقيقة بعد إنشاء VM. إذا رُفض الاتصال، انتظر ثم أعد المحاولة.

  </Step>

  <Step title="تثبيت Docker (على VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    سجّل الخروج ثم ادخل مجددًا لتطبيق تغيير المجموعة:

    ```bash
    exit
    ```

    ثم ادخل مرة أخرى عبر SSH:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    تحقق:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="استنساخ مستودع OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    يفترض هذا الدليل أنك ستبني صورة مخصصة لضمان استمرارية الثنائيات.

  </Step>

  <Step title="إنشاء أدلة مضيف دائمة">
    حاويات Docker مؤقتة.
    يجب أن تكون كل الحالة طويلة العمر على المضيف.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="ضبط متغيرات البيئة">
    أنشئ `.env` في جذر المستودع.

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

    عيّن `OPENCLAW_GATEWAY_TOKEN` عندما تريد إدارة رمز Gateway المميز
    المستقر من خلال `.env`؛ وإلا فاضبط `gateway.auth.token` قبل
    الاعتماد على العملاء عبر عمليات إعادة التشغيل. إذا لم يكن أي من المصدرين موجودًا، يستخدم OpenClaw
    رمزًا مميزًا مخصصًا لوقت التشغيل فقط لذلك التشغيل. أنشئ كلمة مرور لسلسلة المفاتيح والصقها
    في `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **لا تودع هذا الملف في Git.**

    ملف `.env` هذا مخصص لبيئة الحاوية/وقت التشغيل مثل `OPENCLAW_GATEWAY_TOKEN`.
    توجد مصادقة مزود OAuth/مفاتيح API المخزنة في المسار المثبت
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="تكوين Docker Compose">
    أنشئ أو حدّث `docker-compose.yml`.

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

    `--allow-unconfigured` مخصص فقط لتسهيل التمهيد، وليس بديلًا عن تكوين Gateway صحيح. مع ذلك، اضبط المصادقة (`gateway.auth.token` أو كلمة مرور) واستخدم إعدادات ربط آمنة لنشرك.

  </Step>

  <Step title="خطوات وقت تشغيل Docker VM المشتركة">
    استخدم دليل وقت التشغيل المشترك لتدفق مضيف Docker العام:

    - [تضمين الثنائيات المطلوبة في الصورة](/ar/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [البناء والتشغيل](/ar/install/docker-vm-runtime#build-and-launch)
    - [ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where)
    - [التحديثات](/ar/install/docker-vm-runtime#updates)

  </Step>

  <Step title="ملاحظات تشغيل خاصة بـ GCP">
    على GCP، إذا فشل البناء مع `Killed` أو `exit code 137` أثناء `pnpm install --frozen-lockfile`، فهذا يعني أن ذاكرة VM نفدت. استخدم `e2-small` كحد أدنى، أو `e2-medium` لعمليات بناء أولى أكثر موثوقية.

    عند الربط بالشبكة المحلية (LAN) (`OPENCLAW_GATEWAY_BIND=lan`)، اضبط أصل متصفح موثوقًا قبل المتابعة:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    إذا غيّرت منفذ Gateway، فاستبدل `18789` بالمنفذ الذي ضبطته.

  </Step>

  <Step title="الوصول من حاسوبك المحمول">
    أنشئ نفق SSH لتمرير منفذ Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    افتح في متصفحك:

    `http://127.0.0.1:18789/`

    أعد طباعة رابط نظيف للوحة المعلومات:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    إذا طالبت واجهة المستخدم بمصادقة سر مشترك، فالصق الرمز المميز أو
    كلمة المرور المضبوطة في إعدادات واجهة التحكم. يكتب مسار Docker هذا رمزًا مميزًا
    افتراضيًا؛ إذا بدّلت تكوين الحاوية إلى مصادقة بكلمة مرور، فاستخدم تلك
    الكلمة بدلًا من ذلك.

    إذا عرضت واجهة التحكم `unauthorized` أو `disconnected (1008): pairing required`، فوافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    هل تحتاج مرة أخرى إلى مرجع الاستمرارية والتحديثات المشترك؟
    راجع [وقت تشغيل Docker VM](/ar/install/docker-vm-runtime#what-persists-where) و[تحديثات وقت تشغيل Docker VM](/ar/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## استكشاف الأخطاء وإصلاحها

**رُفض اتصال SSH**

قد يستغرق نشر مفتاح SSH مدة 1-2 دقيقة بعد إنشاء VM. انتظر ثم أعد المحاولة.

**مشكلات OS Login**

تحقق من ملف تعريف OS Login لديك:

```bash
gcloud compute os-login describe-profile
```

تأكد من أن حسابك لديه أذونات IAM المطلوبة (Compute OS Login أو Compute OS Admin Login).

**نفاد الذاكرة (OOM)**

إذا فشل بناء Docker مع `Killed` و`exit code 137`، فقد أُوقفت VM بسبب نفاد الذاكرة. انتقل إلى e2-small (الحد الأدنى) أو e2-medium (الموصى به لعمليات البناء المحلية الموثوقة):

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

## حسابات الخدمة (أفضل ممارسة أمنية)

للاستخدام الشخصي، يكفي حساب المستخدم الافتراضي لديك.

لأغراض الأتمتة أو مسارات CI/CD، أنشئ حساب خدمة مخصصًا بأقل قدر من الأذونات:

1. أنشئ حساب خدمة:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. امنح دور Compute Instance Admin (أو دورًا مخصصًا أضيق):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

تجنب استخدام دور Owner للأتمتة. استخدم مبدأ أقل الامتيازات.

راجع [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) للاطلاع على تفاصيل أدوار IAM.

---

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- إقران الأجهزة المحلية كـ Nodes: [Nodes](/ar/nodes)
- تكوين Gateway: [تكوين Gateway](/ar/gateway/configuration)

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Azure](/ar/install/azure)
- [استضافة VPS](/ar/vps)
