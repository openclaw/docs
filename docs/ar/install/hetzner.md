---
read_when:
    - تريد تشغيل OpenClaw على مدار الساعة طوال أيام الأسبوع على خادم VPS سحابي (وليس على حاسوبك المحمول)
    - تريد Gateway بمستوى إنتاجي ودائم التشغيل على خادم VPS الخاص بك.
    - تريد تحكمًا كاملًا في استبقاء البيانات والملفات الثنائية وسلوك إعادة التشغيل
    - أنت تشغّل OpenClaw في Docker على Hetzner أو مزوّد مشابه
summary: شغّل OpenClaw Gateway على مدار الساعة طوال أيام الأسبوع على خادم VPS رخيص من Hetzner (Docker) مع حالة دائمة وثنائيات مضمّنة مسبقًا
title: Hetzner
x-i18n:
    generated_at: "2026-04-30T08:08:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw على Hetzner (Docker، دليل VPS للإنتاج)

## الهدف

تشغيل OpenClaw Gateway دائم على Hetzner VPS باستخدام Docker، مع حالة دائمة، وثنائيات مضمّنة، وسلوك إعادة تشغيل آمن.

إذا كنت تريد “OpenClaw على مدار الساعة مقابل نحو 5 دولارات”، فهذا هو أبسط إعداد موثوق.
تتغير أسعار Hetzner؛ اختر أصغر VPS يعمل بـ Debian/Ubuntu وقم بالتوسعة إذا واجهت نفادًا في الذاكرة.

تذكير بنموذج الأمان:

- الوكلاء المشتركون على مستوى الشركة مناسبون عندما يكون الجميع ضمن حدود الثقة نفسها ويكون وقت التشغيل مخصصًا للأعمال فقط.
- حافظ على فصل صارم: VPS/وقت تشغيل مخصص + حسابات مخصصة؛ لا تستخدم ملفات Apple/Google/المتصفح/مدير كلمات المرور الشخصية على ذلك المضيف.
- إذا كان المستخدمون خصومًا لبعضهم البعض، فافصل حسب Gateway/المضيف/مستخدم نظام التشغيل.

راجع [الأمان](/ar/gateway/security) و[استضافة VPS](/ar/vps).

## ماذا نفعل (بعبارات بسيطة)؟

- استئجار خادم Linux صغير (Hetzner VPS)
- تثبيت Docker (وقت تشغيل تطبيق معزول)
- بدء OpenClaw Gateway في Docker
- الإبقاء على `~/.openclaw` + `~/.openclaw/workspace` على المضيف (تستمر بعد إعادة التشغيل/إعادة البناء)
- الوصول إلى Control UI من حاسوبك المحمول عبر نفق SSH

تتضمن حالة `~/.openclaw` المركّبة هذه `openclaw.json`، وملف
`agents/<agentId>/agent/auth-profiles.json` لكل وكيل، و`.env`.

يمكن الوصول إلى Gateway عبر:

- إعادة توجيه منفذ SSH من حاسوبك المحمول
- كشف المنفذ مباشرة إذا كنت تدير الجدار الناري والرموز المميزة بنفسك

يفترض هذا الدليل استخدام Ubuntu أو Debian على Hetzner.  
إذا كنت تستخدم VPS آخر يعمل بـ Linux، فطابق الحزم وفقًا لذلك.
للتدفق العام لـ Docker، راجع [Docker](/ar/install/docker).

---

## المسار السريع (للمشغلين ذوي الخبرة)

1. جهّز Hetzner VPS
2. ثبّت Docker
3. استنسخ مستودع OpenClaw
4. أنشئ أدلة مضيف دائمة
5. اضبط `.env` و`docker-compose.yml`
6. ضمّن الثنائيات المطلوبة في الصورة
7. `docker compose up -d`
8. تحقق من الاستمرارية والوصول إلى Gateway

---

## ما تحتاج إليه

- Hetzner VPS مع وصول root
- وصول SSH من حاسوبك المحمول
- إلمام أساسي بـ SSH + النسخ/اللصق
- نحو 20 دقيقة
- Docker وDocker Compose
- بيانات اعتماد مصادقة النموذج
- بيانات اعتماد مزوّد اختيارية
  - رمز QR لـ WhatsApp
  - رمز بوت Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="تجهيز VPS">
    أنشئ VPS يعمل بـ Ubuntu أو Debian في Hetzner.

    اتصل كمستخدم root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    يفترض هذا الدليل أن VPS يحتفظ بالحالة.
    لا تتعامل معه كبنية تحتية قابلة للتخلص منها.

  </Step>

  <Step title="تثبيت Docker (على VPS)">
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

  <Step title="استنساخ مستودع OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    يفترض هذا الدليل أنك ستبني صورة مخصصة لضمان استمرار الثنائيات.

  </Step>

  <Step title="إنشاء أدلة مضيف دائمة">
    حاويات Docker عابرة.
    يجب أن تعيش كل الحالة طويلة الأجل على المضيف.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="ضبط متغيرات البيئة">
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

    اترك `OPENCLAW_GATEWAY_TOKEN` فارغًا ما لم تكن تريد صراحة
    إدارته عبر `.env`؛ يكتب OpenClaw رمز Gateway عشوائيًا إلى
    الإعدادات عند أول بدء. أنشئ كلمة مرور لحلقة المفاتيح والصقها في
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **لا تودع هذا الملف في المستودع.**

    ملف `.env` هذا مخصص لبيئة الحاوية/وقت التشغيل مثل `OPENCLAW_GATEWAY_TOKEN`.
    مصادقة OAuth/API-key المخزنة للمزوّد تعيش في المسار المركّب
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

    `--allow-unconfigured` مخصص فقط لتسهيل التمهيد، وليس بديلًا عن إعداد Gateway صحيح. مع ذلك اضبط المصادقة (`gateway.auth.token` أو كلمة مرور) واستخدم إعدادات ربط آمنة للنشر الخاص بك.

  </Step>

  <Step title="خطوات وقت تشغيل Docker VM المشتركة">
    استخدم دليل وقت التشغيل المشترك لتدفق مضيف Docker العام:

    - [تضمين الثنائيات المطلوبة في الصورة](/ar/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [البناء والتشغيل](/ar/install/docker-vm-runtime#build-and-launch)
    - [ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where)
    - [التحديثات](/ar/install/docker-vm-runtime#updates)

  </Step>

  <Step title="الوصول الخاص بـ Hetzner">
    بعد خطوات البناء والتشغيل المشتركة، أكمل الإعداد التالي لفتح النفق:

    **المتطلب السابق:** تأكد من أن إعداد sshd على VPS يسمح بإعادة توجيه TCP. إذا كنت
    قد شددت إعداد SSH لديك، فتحقق من `/etc/ssh/sshd_config` واضبط:

    ```
    AllowTcpForwarding local
    ```

    يسمح `local` بعمليات إعادة التوجيه المحلية `ssh -L` من حاسوبك المحمول مع حظر
    عمليات إعادة التوجيه البعيدة من الخادم. ضبطه على `no` سيفشل النفق
    مع:
    `channel 3: open failed: administratively prohibited: open failed`

    بعد التأكد من تمكين إعادة توجيه TCP، أعد تشغيل خدمة SSH
    (`systemctl restart ssh`) وشغّل النفق من حاسوبك المحمول:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    افتح:

    `http://127.0.0.1:18789/`

    الصق السر المشترك المضبوط. يستخدم هذا الدليل رمز Gateway افتراضيًا؛
    إذا انتقلت إلى مصادقة كلمة المرور، فاستخدم تلك الكلمة بدلًا من ذلك.

  </Step>
</Steps>

توجد خريطة الاستمرارية المشتركة في [وقت تشغيل Docker VM](/ar/install/docker-vm-runtime#what-persists-where).

## البنية التحتية ككود (Terraform)

للفرق التي تفضّل تدفقات عمل البنية التحتية ككود، يوفر إعداد Terraform مُدار من المجتمع:

- إعداد Terraform معياري مع إدارة حالة بعيدة
- تجهيز آلي عبر cloud-init
- سكربتات نشر (تمهيد، نشر، نسخ احتياطي/استعادة)
- تعزيز الأمان (جدار ناري، UFW، وصول SSH فقط)
- إعداد نفق SSH للوصول إلى Gateway

**المستودعات:**

- البنية التحتية: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- إعداد Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

يكمل هذا النهج إعداد Docker أعلاه بعمليات نشر قابلة للإعادة، وبنية تحتية مضبوطة بالإصدارات، وتعافٍ آلي من الكوارث.

<Note>
تتم صيانته من المجتمع. للمشكلات أو المساهمات، راجع روابط المستودعات أعلاه.
</Note>

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- ضبط Gateway: [إعداد Gateway](/ar/gateway/configuration)
- إبقاء OpenClaw محدّثًا: [التحديث](/ar/install/updating)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Fly.io](/ar/install/fly)
- [Docker](/ar/install/docker)
- [استضافة VPS](/ar/vps)
