---
read_when:
    - تريد تشغيل OpenClaw على مدار الساعة طوال أيام الأسبوع على GCP
    - تريد Gateway بمستوى جاهز للإنتاج ويعمل باستمرار على جهازك الافتراضي الخاص
    - تريد تحكمًا كاملًا في استمرارية البيانات والملفات التنفيذية وسلوك إعادة التشغيل
summary: شغّل OpenClaw Gateway على مدار الساعة طوال أيام الأسبوع على جهاز افتراضي في GCP Compute Engine ‏(Docker) مع حالة دائمة
title: GCP
x-i18n:
    generated_at: "2026-07-12T06:08:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

شغّل Gateway دائمًا لـ OpenClaw على جهاز افتراضي في GCP Compute Engine باستخدام Docker، مع حالة دائمة، وملفات تنفيذية مضمّنة في الصورة، وسلوك آمن عند إعادة التشغيل.

تختلف الأسعار حسب نوع الجهاز والمنطقة؛ اختر أصغر جهاز افتراضي يلائم عبء عملك، وزِد موارده إذا واجهت حالات نفاد الذاكرة.

يمكن الوصول إلى Gateway عبر إعادة توجيه منفذ SSH من حاسوبك المحمول، أو عبر كشف المنفذ مباشرةً إذا كنت تدير جدار الحماية والرموز المميزة بنفسك.

يستخدم هذا الدليل Debian على GCP Compute Engine. يعمل Ubuntu أيضًا؛ استخدم الحزم المناظرة وفقًا لذلك. للاطلاع على مسار Docker العام، راجع [Docker](/ar/install/docker).

## ما تحتاج إليه

- حساب GCP ‏(`e2-micro` مؤهل للطبقة المجانية)
- ‏CLI ‏`gcloud`، أو [Cloud Console](https://console.cloud.google.com)
- وصول SSH من حاسوبك المحمول
- Docker وDocker Compose
- بيانات اعتماد مصادقة النموذج
- بيانات اعتماد اختيارية لموفري الخدمات (رمز QR لـ WhatsApp، والرمز المميز لبوت Telegram، وOAuth لـ Gmail)
- نحو 20-30 دقيقة

## المسار السريع

1. أنشئ مشروع GCP، وفعّل الفوترة وواجهة Compute Engine API
2. أنشئ جهازًا افتراضيًا في Compute Engine ‏(`e2-small`، وDebian 12، و20GB)
3. اتصل بالجهاز الافتراضي عبر SSH، وثبّت Docker
4. استنسخ مستودع OpenClaw
5. أنشئ أدلة دائمة على المضيف
6. اضبط `.env` و`docker-compose.yml`
7. ضمّن الملفات التنفيذية المطلوبة في الصورة، وابنِها، وشغّلها

<Steps>
  <Step title="تثبيت CLI ‏gcloud (أو استخدام Console)">
    ثبّته من [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)، ثم نفّذ:

    ```bash
    gcloud init
    gcloud auth login
    ```

    أو نفّذ جميع الخطوات أدناه بدلًا من ذلك من خلال واجهة الويب [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="إنشاء مشروع GCP">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    فعّل الفوترة على [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (مطلوبة لـ Compute Engine).

    المسار المكافئ في Console: IAM & Admin > Create Project، ثم فعّل الفوترة، وبعدها APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="إنشاء الجهاز الافتراضي">
    | النوع      | المواصفات                    | التكلفة               | ملاحظات                                        |
    | --------- | ------------------------ | ------------------ | --------------------------------------------- |
    | e2-medium | وحدتا vCPU، وذاكرة RAM بسعة 4GB          | نحو $25 شهريًا            | الأكثر موثوقية لعمليات بناء Docker المحلية         |
    | e2-small  | وحدتا vCPU، وذاكرة RAM بسعة 2GB          | نحو $12 شهريًا            | الحد الأدنى الموصى به لبناء Docker        |
    | e2-micro  | وحدتا vCPU (مشتركتان)، وذاكرة RAM بسعة 1GB | مؤهل للطبقة المجانية | غالبًا ما يفشل بناء Docker بسبب نفاد الذاكرة (`exit 137`)  |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="الاتصال بالجهاز الافتراضي عبر SSH">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    في Console: انقر على "SSH" بجوار الجهاز الافتراضي في لوحة معلومات Compute Engine.

    قد يستغرق نشر مفتاح SSH من دقيقة إلى دقيقتين بعد إنشاء الجهاز الافتراضي؛ انتظر وأعد المحاولة إذا رُفض الاتصال.

  </Step>

  <Step title="تثبيت Docker (على الجهاز الافتراضي)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    سجّل الخروج ثم ادخل مجددًا لتفعيل تغيير المجموعة، ثم أعد الاتصال عبر SSH:

    ```bash
    exit
    ```

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

    ينشئ هذا الدليل صورة مخصصة كي تبقى أي ملفات تنفيذية تضمّنها فيها بعد عمليات إعادة التشغيل.

  </Step>

  <Step title="إنشاء أدلة دائمة على المضيف">
    حاويات Docker مؤقتة؛ يجب أن تكون كل الحالة طويلة الأمد محفوظة على المضيف.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="ضبط متغيرات البيئة">
    أنشئ `.env` في جذر المستودع:

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

    اضبط `OPENCLAW_GATEWAY_TOKEN` لإدارة الرمز المميز الثابت لـ Gateway من خلال
    `.env`؛ وإلا فاضبط `gateway.auth.token` قبل الاعتماد على العملاء عبر
    عمليات إعادة التشغيل. إذا لم يُضبط أي منهما، يستخدم OpenClaw رمزًا مميزًا
    خاصًا بوقت التشغيل لعملية بدء التشغيل تلك فقط. أنشئ كلمة مرور لحلقة المفاتيح من أجل `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **لا تودع هذا الملف في المستودع.** فهو يحتوي على متغيرات بيئة الحاوية/وقت التشغيل مثل
    `OPENCLAW_GATEWAY_TOKEN`. تُحفظ بيانات مصادقة OAuth/مفتاح API الخاصة بموفري الخدمات في
    الملف المركّب `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="إعداد Docker Compose">
    أنشئ `docker-compose.yml` أو حدّثه:

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
          # يُوصى بإبقاء Gateway مقتصرًا على local loopback في الجهاز الافتراضي، والوصول إليه عبر نفق SSH.
          # لكشفه للعامة، أزل البادئة `127.0.0.1:` واضبط جدار الحماية وفقًا لذلك.
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

    الخيار `--allow-unconfigured` مخصص فقط لتسهيل التمهيد، وليس بديلًا عن إعداد Gateway فعلي. يجب مع ذلك ضبط المصادقة (`gateway.auth.token` أو كلمة مرور) ووضع ربط آمن لعملية النشر.

  </Step>

  <Step title="خطوات وقت التشغيل المشتركة لجهاز Docker الافتراضي">
    اتبع دليل وقت التشغيل المشترك لمسار مضيف Docker العام:

    - [تضمين الملفات التنفيذية المطلوبة في الصورة](/ar/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [البناء والتشغيل](/ar/install/docker-vm-runtime#build-and-launch)
    - [ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where)
    - [التحديثات](/ar/install/docker-vm-runtime#updates)

  </Step>

  <Step title="ملاحظات تشغيل خاصة بـ GCP">
    إذا فشل البناء برسالة `Killed` أو `exit code 137` أثناء `pnpm install --frozen-lockfile`، فهذا يعني نفاد ذاكرة الجهاز الافتراضي. استخدم `e2-small` كحد أدنى، أو `e2-medium` للحصول على عمليات بناء أولية أكثر موثوقية.

    عند الربط بشبكة LAN ‏(`OPENCLAW_GATEWAY_BIND=lan`)، اضبط أصل متصفح موثوقًا قبل المتابعة:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    استبدل `18789` بالمنفذ الذي ضبطته إذا كنت قد غيّرته.

  </Step>

  <Step title="الوصول من حاسوبك المحمول">
    أنشئ نفق SSH لإعادة توجيه منفذ Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    افتح `http://127.0.0.1:18789/` في متصفحك.

    أعد طباعة رابط نظيف للوحة المعلومات:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    إذا طلبت واجهة المستخدم مصادقة باستخدام سر مشترك، فألصق الرمز المميز
    أو كلمة المرور المضبوطة في إعدادات واجهة التحكم (يكتب مسار Docker هذا رمزًا مميزًا
    افتراضيًا؛ استخدم كلمة المرور التي ضبطتها بدلًا منه إذا انتقلت إلى المصادقة
    بكلمة مرور).

    إذا عرضت واجهة التحكم `unauthorized` أو `disconnected (1008): pairing required`، فوافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    راجع [وقت تشغيل جهاز Docker الافتراضي](/ar/install/docker-vm-runtime#what-persists-where) للاطلاع على خريطة الاستمرارية المشتركة و[مسار التحديث](/ar/install/docker-vm-runtime#updates).

  </Step>
</Steps>

## استكشاف الأخطاء وإصلاحها

**رُفض اتصال SSH**

قد يستغرق نشر مفتاح SSH من دقيقة إلى دقيقتين بعد إنشاء الجهاز الافتراضي. انتظر وأعد المحاولة.

**مشكلات OS Login**

تحقّق من ملف تعريف OS Login:

```bash
gcloud compute os-login describe-profile
```

تأكد من أن حسابك يمتلك أذونات IAM المطلوبة (Compute OS Login أو Compute OS Admin Login).

**نفاد الذاكرة**

إذا فشل بناء Docker برسالة `Killed` و`exit code 137`، فهذا يعني أن الجهاز الافتراضي أُنهي بسبب نفاد الذاكرة:

```bash
# أوقف الجهاز الافتراضي أولًا
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# غيّر نوع الجهاز
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# شغّل الجهاز الافتراضي
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## حسابات الخدمة (أفضل ممارسة أمنية)

للاستخدام الشخصي، يعمل حساب المستخدم الافتراضي لديك جيدًا. للأتمتة أو CI/CD، أنشئ حساب خدمة مخصصًا بأدنى قدر من الأذونات:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

تجنّب دور Owner للأتمتة؛ استخدم أضيق دور يفي بالغرض. راجع [فهم الأدوار](https://cloud.google.com/iam/docs/understanding-roles).

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- إقران الأجهزة المحلية باعتبارها عُقدًا: [العُقد](/ar/nodes)
- إعداد Gateway: [إعداد Gateway](/ar/gateway/configuration)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Azure](/ar/install/azure)
- [استضافة VPS](/ar/vps)
