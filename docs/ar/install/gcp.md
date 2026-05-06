---
read_when:
    - تريد تشغيل OpenClaw على GCP على مدار الساعة طوال أيام الأسبوع
    - تريد Gateway دائم التشغيل وبمستوى إنتاجي على آلتك الافتراضية الخاصة
    - تريد تحكمًا كاملاً في الاستمرارية والملفات الثنائية وسلوك إعادة التشغيل
summary: تشغيل OpenClaw Gateway على مدار الساعة طوال أيام الأسبوع على جهاز افتراضي من GCP Compute Engine (Docker) مع حالة دائمة
title: GCP
x-i18n:
    generated_at: "2026-05-06T08:00:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: eefd3a324ababdaa3072cda5354c1d59ddfe80c2f88f24a4ad21208f54636e89
    source_path: install/gcp.md
    workflow: 16
---

شغّل OpenClaw Gateway دائمًا على جهاز VM من GCP Compute Engine باستخدام Docker، مع حالة دائمة، وثنائيات مدمجة، وسلوك إعادة تشغيل آمن.

إذا كنت تريد "OpenClaw على مدار الساعة مقابل نحو 5-12 دولارًا شهريًا"، فهذا إعداد موثوق على Google Cloud.
تختلف الأسعار حسب نوع الجهاز والمنطقة؛ اختر أصغر VM يناسب عبء عملك، ثم وسّع إذا واجهت نفادًا في الذاكرة.

## ماذا سنفعل (بعبارات بسيطة)؟

- إنشاء مشروع GCP وتفعيل الفوترة
- إنشاء VM على Compute Engine
- تثبيت Docker (بيئة تشغيل تطبيق معزولة)
- بدء تشغيل OpenClaw Gateway داخل Docker
- إبقاء `~/.openclaw` + `~/.openclaw/workspace` دائمة على المضيف (تبقى بعد إعادة التشغيل/إعادة البناء)
- الوصول إلى واجهة التحكم من حاسوبك المحمول عبر نفق SSH

تتضمن حالة `~/.openclaw` المثبتة هذه `openclaw.json`، وملف
`agents/<agentId>/agent/auth-profiles.json` لكل وكيل، و`.env`.

يمكن الوصول إلى Gateway عبر:

- تمرير منفذ SSH من حاسوبك المحمول
- تعريض المنفذ مباشرة إذا كنت تدير الجدار الناري والرموز بنفسك

يستخدم هذا الدليل Debian على GCP Compute Engine.
يعمل Ubuntu أيضًا؛ طابق الحزم وفقًا لذلك.
للتدفق العام في Docker، راجع [Docker](/ar/install/docker).

---

## المسار السريع (للمشغلين ذوي الخبرة)

1. أنشئ مشروع GCP + فعّل Compute Engine API
2. أنشئ VM على Compute Engine (e2-small، Debian 12، 20GB)
3. اتصل بالـ VM عبر SSH
4. ثبّت Docker
5. انسخ مستودع OpenClaw
6. أنشئ أدلة مضيف دائمة
7. اضبط `.env` و`docker-compose.yml`
8. ادمج الثنائيات المطلوبة، وابنِ، وشغّل

---

## ما تحتاج إليه

- حساب GCP (مؤهل للطبقة المجانية لـ e2-micro)
- تثبيت gcloud CLI (أو استخدام Cloud Console)
- وصول SSH من حاسوبك المحمول
- معرفة أساسية باستخدام SSH + النسخ/اللصق
- نحو 20-30 دقيقة
- Docker وDocker Compose
- بيانات اعتماد مصادقة النموذج
- بيانات اعتماد موفر اختيارية
  - رمز QR لـ WhatsApp
  - رمز بوت Telegram
  - OAuth لـ Gmail

---

<Steps>
  <Step title="ثبّت gcloud CLI (أو استخدم Console)">
    **الخيار أ: gcloud CLI** (موصى به للأتمتة)

    ثبّت من [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    ابدأ الإعداد وسجّل الدخول:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **الخيار ب: Cloud Console**

    يمكن تنفيذ جميع الخطوات عبر واجهة الويب في [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="أنشئ مشروع GCP">
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

    **Console:**

    1. انتقل إلى IAM & Admin > Create Project
    2. سمّه وأنشئه
    3. فعّل الفوترة للمشروع
    4. انتقل إلى APIs & Services > Enable APIs > ابحث عن "Compute Engine API" > Enable

  </Step>

  <Step title="أنشئ الـ VM">
    **أنواع الأجهزة:**

    | النوع      | المواصفات                    | التكلفة               | ملاحظات                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU، و4GB RAM          | نحو 25 دولارًا/شهرًا            | الأكثر موثوقية لبناء Docker المحلي        |
    | e2-small  | 2 vCPU، و2GB RAM          | نحو 12 دولارًا/شهرًا            | الحد الأدنى الموصى به لبناء Docker         |
    | e2-micro  | 2 vCPU (مشتركة)، و1GB RAM | مؤهل للطبقة المجانية | غالبًا يفشل مع نفاد الذاكرة أثناء بناء Docker (الخروج 137) |

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

    1. انتقل إلى Compute Engine > VM instances > Create instance
    2. الاسم: `openclaw-gateway`
    3. المنطقة: `us-central1`، النطاق: `us-central1-a`
    4. نوع الجهاز: `e2-small`
    5. قرص الإقلاع: Debian 12، 20GB
    6. أنشئ

  </Step>

  <Step title="اتصل بالـ VM عبر SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    انقر زر "SSH" بجانب الـ VM في لوحة معلومات Compute Engine.

    ملاحظة: قد يستغرق نشر مفتاح SSH دقيقة إلى دقيقتين بعد إنشاء الـ VM. إذا رُفض الاتصال، فانتظر وأعد المحاولة.

  </Step>

  <Step title="ثبّت Docker (على الـ VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    سجّل الخروج ثم ادخل مجددًا حتى يسري تغيير المجموعة:

    ```bash
    exit
    ```

    ثم اتصل عبر SSH مجددًا:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    تحقق:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="انسخ مستودع OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    يفترض هذا الدليل أنك ستبني صورة مخصصة لضمان دوام الثنائيات.

  </Step>

  <Step title="أنشئ أدلة مضيف دائمة">
    حاويات Docker مؤقتة.
    يجب أن تعيش كل الحالات طويلة الأمد على المضيف.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="اضبط متغيرات البيئة">
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

    اترك `OPENCLAW_GATEWAY_TOKEN` فارغًا إلا إذا كنت تريد صراحةً
    إدارته عبر `.env`؛ يكتب OpenClaw رمز Gateway عشوائيًا في
    الإعداد عند أول تشغيل. أنشئ كلمة مرور لسلسلة المفاتيح والصقها في
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **لا تثبت هذا الملف في المستودع.**

    ملف `.env` هذا مخصص لبيئة الحاوية/التشغيل مثل `OPENCLAW_GATEWAY_TOKEN`.
    مصادقة OAuth/API-key المخزنة للموفرين توجد في الملف المثبت
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

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

    `--allow-unconfigured` مخصص فقط لتسهيل الإقلاع الأولي، وليس بديلًا عن إعداد Gateway صحيح. اضبط المصادقة أيضًا (`gateway.auth.token` أو كلمة مرور) واستخدم إعدادات ربط آمنة لنشرك.

  </Step>

  <Step title="خطوات وقت تشغيل VM المشتركة لـ Docker">
    استخدم دليل وقت التشغيل المشترك للتدفق الشائع على مضيف Docker:

    - [ادمج الثنائيات المطلوبة داخل الصورة](/ar/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ابنِ وشغّل](/ar/install/docker-vm-runtime#build-and-launch)
    - [ما الذي يبقى وأين](/ar/install/docker-vm-runtime#what-persists-where)
    - [التحديثات](/ar/install/docker-vm-runtime#updates)

  </Step>

  <Step title="ملاحظات تشغيل خاصة بـ GCP">
    على GCP، إذا فشل البناء مع `Killed` أو `exit code 137` أثناء `pnpm install --frozen-lockfile`، فهذا يعني أن ذاكرة الـ VM نفدت. استخدم `e2-small` كحد أدنى، أو `e2-medium` لبناء أولي أكثر موثوقية.

    عند الربط بالشبكة المحلية (`OPENCLAW_GATEWAY_BIND=lan`)، اضبط أصل متصفح موثوقًا قبل المتابعة:

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

    أعد طباعة رابط لوحة معلومات نظيف:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    إذا طلبت الواجهة مصادقة السر المشترك، فالصق الرمز أو
    كلمة المرور المضبوطة في إعدادات واجهة التحكم. يكتب تدفق Docker هذا رمزًا
    افتراضيًا؛ إذا بدّلت إعداد الحاوية إلى مصادقة بكلمة مرور، فاستخدم تلك
    الكلمة بدلًا من ذلك.

    إذا أظهرت واجهة التحكم `unauthorized` أو `disconnected (1008): pairing required`، فوافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    هل تحتاج مرجع الدوام والتحديث المشترك مرة أخرى؟
    راجع [وقت تشغيل Docker VM](/ar/install/docker-vm-runtime#what-persists-where) و[تحديثات وقت تشغيل Docker VM](/ar/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## استكشاف الأخطاء وإصلاحها

**تم رفض اتصال SSH**

قد يستغرق نشر مفتاح SSH دقيقة إلى دقيقتين بعد إنشاء الـ VM. انتظر وأعد المحاولة.

**مشكلات OS Login**

تحقق من ملف تعريف OS Login الخاص بك:

```bash
gcloud compute os-login describe-profile
```

تأكد من أن حسابك لديه أذونات IAM المطلوبة (Compute OS Login أو Compute OS Admin Login).

**نفاد الذاكرة (OOM)**

إذا فشل بناء Docker مع `Killed` و`exit code 137`، فقد أوقف النظام الـ VM بسبب نفاد الذاكرة. رقِّ إلى e2-small (الحد الأدنى) أو e2-medium (موصى به للبناءات المحلية الموثوقة):

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

## حسابات الخدمة (أفضل ممارسات الأمان)

للاستخدام الشخصي، يعمل حساب المستخدم الافتراضي لديك جيدًا.

للأتمتة أو خطوط CI/CD، أنشئ حساب خدمة مخصصًا بأذونات محدودة:

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

تجنب استخدام دور Owner للأتمتة. استخدم مبدأ أقل امتياز.

راجع [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) للاطلاع على تفاصيل أدوار IAM.

---

## الخطوات التالية

- أعدّ قنوات المراسلة: [القنوات](/ar/channels)
- أقرِن الأجهزة المحلية كعُقد: [العُقد](/ar/nodes)
- كوّن Gateway: [تكوين Gateway](/ar/gateway/configuration)

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Azure](/ar/install/azure)
- [استضافة VPS](/ar/vps)
