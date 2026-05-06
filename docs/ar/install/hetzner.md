---
read_when:
    - تريد تشغيل OpenClaw على مدار الساعة طوال أيام الأسبوع على خادم VPS سحابي (وليس على حاسوبك المحمول)
    - تريد Gateway جاهزًا للإنتاج ودائم التشغيل على خادم VPS الخاص بك
    - تريد تحكمًا كاملًا في الاستمرارية والملفات التنفيذية وسلوك إعادة التشغيل
    - أنت تشغّل OpenClaw في Docker على Hetzner أو موفّر مشابه
summary: شغّل OpenClaw Gateway على مدار الساعة طوال أيام الأسبوع على VPS رخيص من Hetzner (Docker) مع حالة دائمة وثنائيات مدمجة مسبقًا
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T08:00:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2625a028b6242f653d29b8f45035bf2d796c5c60453582cf269fd1c3776eca52
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw على Hetzner (Docker، دليل VPS للإنتاج)

## الهدف

تشغيل OpenClaw Gateway دائم على Hetzner VPS باستخدام Docker، مع حالة دائمة، وثنائيات مضمّنة في الصورة، وسلوك إعادة تشغيل آمن.

إذا كنت تريد "OpenClaw على مدار الساعة مقابل حوالي 5 دولارات"، فهذا هو أبسط إعداد موثوق.
تتغير أسعار Hetzner؛ اختر أصغر VPS يعمل بـ Debian/Ubuntu، ثم وسّع الموارد إذا واجهت حالات نفاد الذاكرة.

تذكير بنموذج الأمان:

- الوكلاء المشتركون على مستوى الشركة مقبولون عندما يكون الجميع ضمن حدود الثقة نفسها ويكون وقت التشغيل مخصصًا للأعمال فقط.
- حافظ على فصل صارم: VPS/وقت تشغيل مخصص + حسابات مخصصة؛ لا تستخدم ملفات Apple/Google/المتصفح/مدير كلمات المرور الشخصية على ذلك المضيف.
- إذا كان المستخدمون قد يتعاملون بعدائية فيما بينهم، فافصلهم حسب Gateway/المضيف/مستخدم نظام التشغيل.

راجع [الأمان](/ar/gateway/security) و[استضافة VPS](/ar/vps).

## ماذا سنفعل (بعبارات بسيطة)؟

- استئجار خادم Linux صغير (Hetzner VPS)
- تثبيت Docker (وقت تشغيل تطبيق معزول)
- بدء OpenClaw Gateway داخل Docker
- حفظ `~/.openclaw` + `~/.openclaw/workspace` على المضيف بشكل دائم (يبقى بعد إعادة التشغيل/إعادة البناء)
- الوصول إلى واجهة التحكم من حاسوبك المحمول عبر نفق SSH

تتضمن حالة `~/.openclaw` المركّبة هذه `openclaw.json`، وملف
`agents/<agentId>/agent/auth-profiles.json` لكل وكيل، و`.env`.

يمكن الوصول إلى Gateway عبر:

- توجيه منفذ SSH من حاسوبك المحمول
- تعريض المنفذ مباشرة إذا كنت تدير الجدار الناري والرموز بنفسك

يفترض هذا الدليل استخدام Ubuntu أو Debian على Hetzner.  
إذا كنت تستخدم VPS آخر يعمل بـ Linux، فطابق الحزم وفقًا لذلك.
للتدفق العام عبر Docker، راجع [Docker](/ar/install/docker).

---

## المسار السريع (للمشغلين ذوي الخبرة)

1. تهيئة Hetzner VPS
2. تثبيت Docker
3. استنساخ مستودع OpenClaw
4. إنشاء أدلة مضيف دائمة
5. تهيئة `.env` و`docker-compose.yml`
6. تضمين الثنائيات المطلوبة داخل الصورة
7. `docker compose up -d`
8. التحقق من الديمومة والوصول إلى Gateway

---

## ما تحتاج إليه

- Hetzner VPS مع صلاحية root
- وصول SSH من حاسوبك المحمول
- إلمام أساسي بـ SSH + النسخ/اللصق
- حوالي 20 دقيقة
- Docker وDocker Compose
- بيانات اعتماد مصادقة النموذج
- بيانات اعتماد مزود اختيارية
  - رمز QR لـ WhatsApp
  - رمز بوت Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Provision the VPS">
    أنشئ VPS يعمل بـ Ubuntu أو Debian في Hetzner.

    اتصل كمستخدم root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    يفترض هذا الدليل أن VPS ذو حالة دائمة.
    لا تتعامل معه كبنية تحتية قابلة للتخلص منها.

  </Step>

  <Step title="Install Docker (on the VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    تحقق:

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

    يفترض هذا الدليل أنك ستبني صورة مخصصة لضمان ديمومة الثنائيات.

  </Step>

  <Step title="Create persistent host directories">
    حاويات Docker مؤقتة.
    يجب أن تعيش كل الحالة طويلة العمر على المضيف.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configure environment variables">
    أنشئ `.env` في جذر المستودع.

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

    اترك `OPENCLAW_GATEWAY_TOKEN` فارغًا ما لم تكن تريد صراحةً
    إدارته عبر `.env`؛ يكتب OpenClaw رمز gateway عشوائيًا إلى
    الإعدادات عند أول بدء. أنشئ كلمة مرور لحلقة المفاتيح والصقها في
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **لا تلتزم بهذا الملف في المستودع.**

    ملف `.env` هذا مخصص لبيئة الحاوية/وقت التشغيل مثل `OPENCLAW_GATEWAY_TOKEN`.
    تعيش مصادقة مزودي OAuth/API-key المخزّنة في
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` المركّب.

  </Step>

  <Step title="Docker Compose configuration">
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

    `--allow-unconfigured` مخصص فقط لتسهيل التمهيد، وليس بديلًا عن تهيئة gateway سليمة. مع ذلك اضبط المصادقة (`gateway.auth.token` أو كلمة مرور) واستخدم إعدادات ربط آمنة لعملية النشر لديك.

  </Step>

  <Step title="Shared Docker VM runtime steps">
    استخدم دليل وقت التشغيل المشترك للتدفق الشائع على مضيف Docker:

    - [تضمين الثنائيات المطلوبة داخل الصورة](/ar/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [البناء والتشغيل](/ar/install/docker-vm-runtime#build-and-launch)
    - [ما الذي يبقى وأين](/ar/install/docker-vm-runtime#what-persists-where)
    - [التحديثات](/ar/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specific access">
    بعد خطوات البناء والتشغيل المشتركة، أكمل الإعداد التالي لفتح النفق:

    **المتطلب السابق:** تأكد من أن إعداد sshd على VPS يسمح بتوجيه TCP. إذا كنت
    قد شددت إعداد SSH لديك، فتحقق من `/etc/ssh/sshd_config` واضبط:

    ```
    AllowTcpForwarding local
    ```

    يسمح `local` بتمريرات `ssh -L` المحلية من حاسوبك المحمول مع حظر
    التمريرات البعيدة من الخادم. سيؤدي ضبطه على `no` إلى فشل النفق
    مع:
    `channel 3: open failed: administratively prohibited: open failed`

    بعد التأكد من تمكين توجيه TCP، أعد تشغيل خدمة SSH
    (`systemctl restart ssh`) وشغّل النفق من حاسوبك المحمول:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    افتح:

    `http://127.0.0.1:18789/`

    الصق السر المشترك المهيأ. يستخدم هذا الدليل رمز gateway افتراضيًا؛
    إذا بدّلت إلى مصادقة بكلمة مرور، فاستخدم تلك الكلمة بدلًا من ذلك.

  </Step>
</Steps>

توجد خريطة الديمومة المشتركة في [وقت تشغيل Docker VM](/ar/install/docker-vm-runtime#what-persists-where).

## البنية التحتية ككود (Terraform)

للفرق التي تفضل تدفقات عمل البنية التحتية ككود، يوفر إعداد Terraform الذي يصونه المجتمع:

- تهيئة Terraform معيارية مع إدارة حالة بعيدة
- تهيئة تلقائية عبر cloud-init
- سكربتات نشر (تمهيد، نشر، نسخ احتياطي/استعادة)
- تقوية أمنية (جدار ناري، UFW، وصول SSH فقط)
- تهيئة نفق SSH للوصول إلى gateway

**المستودعات:**

- البنية التحتية: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- إعداد Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

يكمل هذا النهج إعداد Docker أعلاه من خلال عمليات نشر قابلة للتكرار، وبنية تحتية مضبوطة بالإصدارات، واستعادة تلقائية من الكوارث.

<Note>
يصونه المجتمع. للمشكلات أو المساهمات، راجع روابط المستودعات أعلاه.
</Note>

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- تهيئة Gateway: [تهيئة Gateway](/ar/gateway/configuration)
- إبقاء OpenClaw محدثًا: [التحديث](/ar/install/updating)

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Fly.io](/ar/install/fly)
- [Docker](/ar/install/docker)
- [استضافة VPS](/ar/vps)
