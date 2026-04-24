---
read_when:
    - أنت تريد تشغيل OpenClaw على مدار الساعة 24/7 على GCP
    - أنت تريد Gateway دائمة التشغيل بمستوى إنتاجي على جهاز VM خاص بك
    - أنت تريد تحكمًا كاملًا في الاستمرارية، والملفات التنفيذية، وسلوك إعادة التشغيل
summary: تشغيل OpenClaw Gateway على مدار الساعة 24/7 على جهاز GCP Compute Engine VM (Docker) مع حالة دائمة
title: GCP
x-i18n:
    generated_at: "2026-04-24T07:48:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw على GCP Compute Engine (Docker، دليل VPS للإنتاج)

## الهدف

تشغيل Gateway دائمة لـ OpenClaw على جهاز GCP Compute Engine VM باستخدام Docker، مع حالة دائمة، وملفات تنفيذية مضمّنة في الصورة، وسلوك آمن عند إعادة التشغيل.

إذا كنت تريد "OpenClaw تعمل 24/7 مقابل ~$5-12/mo"، فهذا إعداد موثوق على Google Cloud.
تختلف الأسعار حسب نوع الجهاز والمنطقة؛ اختر أصغر VM تناسب حملك وقم بالترقية إذا واجهت OOM.

## ماذا سنفعل (بشكل بسيط)؟

- إنشاء مشروع GCP وتفعيل الفوترة
- إنشاء Compute Engine VM
- تثبيت Docker (بيئة تشغيل معزولة للتطبيق)
- تشغيل OpenClaw Gateway داخل Docker
- جعل `~/.openclaw` + `~/.openclaw/workspace` دائمة على المضيف (تنجو من إعادة التشغيل/إعادة البناء)
- الوصول إلى Control UI من حاسوبك المحمول عبر نفق SSH

تتضمن هذه الحالة المركبة في `~/.openclaw`:
`openclaw.json`، و`agents/<agentId>/agent/auth-profiles.json` لكل وكيل،
و`.env`.

يمكن الوصول إلى Gateway عبر:

- إعادة توجيه المنفذ عبر SSH من حاسوبك المحمول
- كشف المنفذ مباشرة إذا كنت تدير الجدار الناري والرموز بنفسك

يستخدم هذا الدليل Debian على GCP Compute Engine.
كما تعمل Ubuntu أيضًا؛ فقط عدّل الحزم وفقًا لذلك.
أما تدفق Docker العام، فراجع [Docker](/ar/install/docker).

---

## المسار السريع (للمشغلين المتمرسين)

1. أنشئ مشروع GCP + فعّل Compute Engine API
2. أنشئ Compute Engine VM (`e2-small`، وDebian 12، و20GB)
3. اتصل بالـ VM عبر SSH
4. ثبّت Docker
5. انسخ مستودع OpenClaw
6. أنشئ أدلة المضيف الدائمة
7. اضبط `.env` و`docker-compose.yml`
8. ضمّن الملفات التنفيذية المطلوبة في الصورة، وابنِ، ثم شغّل

---

## ما الذي تحتاجه

- حساب GCP (مؤهل للطبقة المجانية مع `e2-micro`)
- تثبيت gcloud CLI (أو استخدام Cloud Console)
- وصول SSH من حاسوبك المحمول
- قدر أساسي من الراحة مع SSH + النسخ/اللصق
- نحو 20-30 دقيقة
- Docker وDocker Compose
- بيانات اعتماد مصادقة النموذج
- بيانات اعتماد مزوّدين اختيارية
  - QR لـ WhatsApp
  - token لبوت Telegram
  - OAuth لـ Gmail

---

<Steps>
  <Step title="تثبيت gcloud CLI (أو استخدام Console)">
    **الخيار A: gcloud CLI** (موصى به للأتمتة)

    ثبّتها من [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    قم بالتهيئة والمصادقة:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **الخيار B: Cloud Console**

    يمكن تنفيذ جميع الخطوات عبر واجهة الويب في [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="إنشاء مشروع GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    فعّل الفوترة من [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (مطلوبة لـ Compute Engine).

    فعّل Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. اذهب إلى IAM & Admin > Create Project
    2. سمِّ المشروع وأنشئه
    3. فعّل الفوترة للمشروع
    4. انتقل إلى APIs & Services > Enable APIs > ابحث عن "Compute Engine API" > Enable

  </Step>

  <Step title="إنشاء الـ VM">
    **أنواع الأجهزة:**

    | النوع      | المواصفات                | التكلفة             | الملاحظات                                      |
    | ---------- | ------------------------ | ------------------- | ---------------------------------------------- |
    | e2-medium  | 2 vCPU، 4GB RAM          | ~$25/mo             | الأكثر اعتمادية لعمليات Docker build المحلية   |
    | e2-small   | 2 vCPU، 2GB RAM          | ~$12/mo             | الحد الأدنى الموصى به لـ Docker build          |
    | e2-micro   | 2 vCPU (مشتركة)، 1GB RAM | مؤهل للطبقة المجانية | يفشل كثيرًا بسبب OOM أثناء Docker build (خروج 137) |

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

    1. اذهب إلى Compute Engine > VM instances > Create instance
    2. الاسم: `openclaw-gateway`
    3. المنطقة: `us-central1`، والمنطقة الفرعية: `us-central1-a`
    4. نوع الجهاز: `e2-small`
    5. قرص الإقلاع: Debian 12، 20GB
    6. أنشئ الجهاز

  </Step>

  <Step title="الاتصال بالـ VM عبر SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    انقر زر "SSH" بجانب الـ VM في لوحة Compute Engine.

    ملاحظة: قد يستغرق نشر مفتاح SSH مدة 1-2 دقيقة بعد إنشاء الـ VM. إذا رُفض الاتصال، انتظر ثم أعد المحاولة.

  </Step>

  <Step title="تثبيت Docker (على الـ VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    سجّل الخروج ثم ادخل مجددًا حتى يصبح تغيير المجموعة فعالًا:

    ```bash
    exit
    ```

    ثم اتصل مرة أخرى عبر SSH:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    تحقّق:

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

    يفترض هذا الدليل أنك ستبني صورة مخصصة لضمان استمرارية الملفات التنفيذية.

  </Step>

  <Step title="إنشاء أدلة المضيف الدائمة">
    حاويات Docker مؤقتة.
    يجب أن تعيش جميع الحالات طويلة الأمد على المضيف.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="إعداد متغيرات البيئة">
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

    اترك `OPENCLAW_GATEWAY_TOKEN` فارغًا ما لم تكن تريد صراحةً
    إدارته عبر `.env`؛ إذ يكتب OpenClaw رمز gateway عشوائيًا إلى
    الإعداد عند أول تشغيل. أنشئ كلمة مرور keyring والصقها في
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **لا تلتزم بهذا الملف.**

    ملف `.env` هذا مخصص لبيئة الحاوية/وقت التشغيل مثل `OPENCLAW_GATEWAY_TOKEN`.
    أما مصادقة OAuth/API-key الخاصة بالمزوّدات المخزنة فتعيش في
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` المركب.

  </Step>

  <Step title="إعداد Docker Compose">
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
          # الموصى به: أبقِ Gateway مقيدة بـ loopback على الـ VM؛ واصل إليها عبر نفق SSH.
          # لكشفها علنًا، أزل البادئة `127.0.0.1:` واضبط الجدار الناري وفقًا لذلك.
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

    إن `--allow-unconfigured` مخصص فقط لتسهيل bootstrap، وليس بديلًا عن إعداد gateway صحيح. لا يزال عليك ضبط المصادقة (`gateway.auth.token` أو password) واستخدام إعدادات bind آمنة للنشر الخاص بك.

  </Step>

  <Step title="خطوات وقت التشغيل المشتركة لـ Docker VM">
    استخدم دليل وقت التشغيل المشترك للتدفق العام لمضيف Docker:

    - [ضمّن الملفات التنفيذية المطلوبة في الصورة](/ar/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [البناء والتشغيل](/ar/install/docker-vm-runtime#build-and-launch)
    - [ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where)
    - [التحديثات](/ar/install/docker-vm-runtime#updates)

  </Step>

  <Step title="ملاحظات تشغيل خاصة بـ GCP">
    على GCP، إذا فشل البناء برسالة `Killed` أو `exit code 137` أثناء `pnpm install --frozen-lockfile`، فهذا يعني أن الـ VM نفدت ذاكرتها. استخدم `e2-small` كحد أدنى، أو `e2-medium` للحصول على بناء أولي أكثر موثوقية.

    عند الربط على LAN (`OPENCLAW_GATEWAY_BIND=lan`)، اضبط أصل متصفح موثوقًا قبل المتابعة:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    إذا غيّرت منفذ gateway، فاستبدل `18789` بالمنفذ الذي أعددته.

  </Step>

  <Step title="الوصول من حاسوبك المحمول">
    أنشئ نفق SSH لإعادة توجيه منفذ Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    افتح في متصفحك:

    `http://127.0.0.1:18789/`

    أعد طباعة رابط dashboard نظيف:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    إذا طلبت UI مصادقة السر المشترك، فالصق token أو
    password المضبوطتين في إعدادات Control UI. يكتب تدفق Docker هذا token
    افتراضيًا؛ وإذا بدّلت إعداد الحاوية إلى مصادقة password، فاستخدم
    تلك الكلمة بدلًا من ذلك.

    إذا عرضت Control UI الرسالة `unauthorized` أو `disconnected (1008): pairing required`، فوافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    هل تحتاج مرجع الاستمرارية المشتركة والتحديثات مرة أخرى؟
    راجع [Docker VM Runtime](/ar/install/docker-vm-runtime#what-persists-where) و[تحديثات Docker VM Runtime](/ar/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## استكشاف الأخطاء وإصلاحها

**تم رفض اتصال SSH**

قد يستغرق نشر مفتاح SSH مدة 1-2 دقيقة بعد إنشاء الـ VM. انتظر ثم أعد المحاولة.

**مشكلات OS Login**

تحقق من ملف تعريف OS Login لديك:

```bash
gcloud compute os-login describe-profile
```

تأكد من أن حسابك يملك أذونات IAM المطلوبة (Compute OS Login أو Compute OS Admin Login).

**نفاد الذاكرة (OOM)**

إذا فشل Docker build برسالة `Killed` و`exit code 137`، فهذا يعني أن الـ VM قُتلت بسبب OOM. قم بالترقية إلى e2-small (حد أدنى) أو e2-medium (موصى به للبناءات المحلية الموثوقة):

```bash
# أوقف الـ VM أولًا
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# غيّر نوع الجهاز
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# ابدأ الـ VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## حسابات الخدمة (أفضل ممارسة أمنية)

للاستخدام الشخصي، يعمل حساب المستخدم الافتراضي لديك بشكل جيد.

أما للأتمتة أو خطوط CI/CD، فأنشئ حساب خدمة مخصصًا بأقل قدر من الأذونات:

1. أنشئ حساب خدمة:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. امنحه دور Compute Instance Admin (أو دورًا مخصصًا أضيق):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

تجنب استخدام دور Owner للأتمتة. استخدم مبدأ أقل قدر من الامتيازات.

راجع [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) لمعرفة تفاصيل أدوار IAM.

---

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- اقتران الأجهزة المحلية كعُقد: [Nodes](/ar/nodes)
- إعداد Gateway: [إعداد Gateway](/ar/gateway/configuration)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Azure](/ar/install/azure)
- [استضافة VPS](/ar/vps)
