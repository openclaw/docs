---
read_when:
    - تريد تشغيل OpenClaw على مدار الساعة طوال أيام الأسبوع على خادم افتراضي خاص سحابي (وليس على حاسوبك المحمول)
    - تريد Gateway دائم التشغيل بمستوى جاهز للإنتاج على خادم VPS الخاص بك
    - تريد تحكمًا كاملًا في الاستمرارية والملفات التنفيذية وسلوك إعادة التشغيل
    - أنت تشغّل OpenClaw في Docker على Hetzner أو لدى مزوّد مماثل
summary: شغّل OpenClaw Gateway على مدار الساعة طوال أيام الأسبوع على خادم VPS منخفض التكلفة من Hetzner (باستخدام Docker)، مع حالة دائمة وملفات تنفيذية مضمّنة مسبقًا
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T06:04:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

شغّل Gateway دائمًا لـ OpenClaw على خادم Hetzner VPS باستخدام Docker، مع حالة دائمة، وملفات تنفيذية مضمّنة في الصورة، وسلوك آمن عند إعادة التشغيل.

تتغير أسعار Hetzner؛ اختر أصغر خادم Debian/Ubuntu VPS يلبي احتياجاتك، ثم وسّع موارده إذا واجهت حالات نفاد الذاكرة.

يمكن الوصول إلى Gateway عبر إعادة توجيه منفذ SSH من حاسوبك المحمول، أو عبر كشف المنفذ مباشرةً إذا كنت تدير جدار الحماية والرموز المميزة بنفسك.

تذكير بنموذج الأمان:

- لا بأس بالوكلاء المشتركين على مستوى الشركة عندما يكون الجميع ضمن حدود الثقة نفسها وتكون بيئة التشغيل مخصصة للأعمال فقط.
- حافظ على فصل صارم: خادم VPS وبيئة تشغيل مخصصان + حسابات مخصصة؛ ولا تستخدم ملفات تعريف Apple أو Google أو المتصفح أو مدير كلمات المرور الشخصية على ذلك المضيف.
- إذا كان المستخدمون يمثلون تهديدًا لبعضهم، فافصل بينهم حسب Gateway أو المضيف أو مستخدم نظام التشغيل.

راجع [الأمان](/ar/gateway/security) و[الاستضافة على VPS](/ar/vps).

يفترض هذا الدليل استخدام Ubuntu أو Debian على Hetzner. على خادم Linux VPS آخر، استخدم الحزم المكافئة. للاطلاع على مسار Docker العام، راجع [Docker](/ar/install/docker).

## ما تحتاج إليه

- خادم Hetzner VPS مع صلاحيات الجذر
- وصول عبر SSH من حاسوبك المحمول
- Docker وDocker Compose
- بيانات اعتماد مصادقة النموذج
- بيانات اعتماد اختيارية لموفري الخدمات (رمز QR لـ WhatsApp، أو رمز بوت Telegram، أو Gmail OAuth)
- نحو 20 دقيقة

## المسار السريع

1. جهّز خادم Hetzner VPS
2. ثبّت Docker
3. استنسخ مستودع OpenClaw
4. أنشئ أدلة دائمة على المضيف
5. اضبط `.env` و`docker-compose.yml`
6. ضمّن الملفات التنفيذية المطلوبة في الصورة
7. نفّذ `docker compose up -d`
8. تحقّق من استمرارية الحالة وإمكانية الوصول إلى Gateway

<Steps>
  <Step title="تجهيز خادم VPS">
    أنشئ خادم Ubuntu أو Debian VPS في Hetzner، ثم اتصل به بصفة المستخدم الجذر:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    تعامل مع خادم VPS على أنه بنية تحتية ذات حالة، لا بنية قابلة للاستبدال.

  </Step>

  <Step title="تثبيت Docker (على خادم VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
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
    حاويات Docker مؤقتة؛ لذا يجب أن تكون جميع الحالات طويلة الأمد على المضيف.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="ضبط متغيرات البيئة">
    أنشئ `.env` في جذر المستودع:

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

    عيّن `OPENCLAW_GATEWAY_TOKEN` لإدارة رمز Gateway المميز الثابت من خلال
    `.env`؛ وإلا فاضبط `gateway.auth.token` قبل الاعتماد على العملاء
    عبر عمليات إعادة التشغيل. إذا لم يُضبط أي منهما، فسيستخدم OpenClaw رمزًا مميزًا خاصًا ببيئة التشغيل
    لعملية بدء التشغيل تلك فقط. أنشئ كلمة مرور لسلسلة المفاتيح من أجل `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **لا تثبّت هذا الملف في المستودع.** فهو يحتوي على متغيرات بيئة الحاوية وبيئة التشغيل مثل
    `OPENCLAW_GATEWAY_TOKEN`. تُخزّن مصادقة OAuth أو مفتاح API الخاصة بموفر الخدمة في
    الملف المثبّت `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

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

    الخيار `--allow-unconfigured` مخصص فقط لتسهيل التمهيد، وليس بديلًا عن إعداد Gateway فعلي. مع ذلك، اضبط المصادقة (`gateway.auth.token` أو كلمة مرور) ووضع ربط آمنًا لعملية النشر.

  </Step>

  <Step title="خطوات بيئة تشغيل جهاز Docker الافتراضي المشتركة">
    اتبع دليل بيئة التشغيل المشترك لمسار مضيف Docker العام:

    - [تضمين الملفات التنفيذية المطلوبة في الصورة](/ar/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [البناء والتشغيل](/ar/install/docker-vm-runtime#build-and-launch)
    - [ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where)
    - [التحديثات](/ar/install/docker-vm-runtime#updates)

  </Step>

  <Step title="الوصول الخاص بـ Hetzner">
    بعد إتمام خطوات البناء والتشغيل المشتركة، افتح النفق.

    **المتطلب الأساسي:** تأكد من أن إعداد sshd على خادم VPS يسمح بإعادة توجيه TCP. إذا كنت قد
    شددت إعدادات SSH، فتحقق من `/etc/ssh/sshd_config` وعيّن:

    ```text
    AllowTcpForwarding local
    ```

    تسمح القيمة `local` بعمليات إعادة التوجيه المحلية باستخدام `ssh -L` من حاسوبك المحمول، مع حظر
    عمليات إعادة التوجيه البعيدة من الخادم. يؤدي تعيينها إلى `no` إلى فشل النفق مع الرسالة:
    `channel 3: open failed: administratively prohibited: open failed`

    بعد التأكد من تمكين إعادة توجيه TCP، أعد تشغيل خدمة SSH
    (`systemctl restart ssh`) وشغّل النفق من حاسوبك المحمول:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    افتح `http://127.0.0.1:18789/` والصق السر المشترك المضبوط.
    يستخدم هذا الدليل رمز Gateway المميز افتراضيًا؛ استخدم كلمة المرور المضبوطة
    بدلًا منه إذا انتقلت إلى المصادقة بكلمة مرور.

  </Step>
</Steps>

توجد خريطة الاستمرارية المشتركة في [بيئة تشغيل جهاز Docker الافتراضي](/ar/install/docker-vm-runtime#what-persists-where).

## البنية التحتية بوصفها شيفرة (Terraform)

بالنسبة إلى الفرق التي تفضّل تدفقات عمل البنية التحتية بوصفها شيفرة، يوفر إعداد Terraform يديره المجتمع ما يلي:

- إعداد Terraform معياري مع إدارة الحالة عن بُعد
- تجهيز آلي عبر cloud-init
- نصوص برمجية للنشر (التمهيد، والنشر، والنسخ الاحتياطي/الاستعادة)
- تقوية الأمان (جدار الحماية، وUFW، والوصول عبر SSH فقط)
- إعداد نفق SSH للوصول إلى Gateway

**المستودعات:**

- البنية التحتية: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- إعداد Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

يكمّل هذا النهج إعداد Docker أعلاه بعمليات نشر قابلة لإعادة الإنتاج، وبنية تحتية خاضعة للتحكم في الإصدارات، وتعافٍ آلي من الكوارث.

<Note>
يديره المجتمع. للمشكلات أو المساهمات، راجع روابط المستودعات أعلاه.
</Note>

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- ضبط Gateway: [إعداد Gateway](/ar/gateway/configuration)
- إبقاء OpenClaw محدّثًا: [التحديث](/ar/install/updating)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Fly.io](/ar/install/fly)
- [Docker](/ar/install/docker)
- [الاستضافة على VPS](/ar/vps)
