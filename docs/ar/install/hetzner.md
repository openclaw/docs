---
read_when:
    - تريد تشغيل OpenClaw على مدار الساعة طوال أيام الأسبوع على VPS سحابي (وليس على حاسوبك المحمول)
    - تريد Gateway بدرجة إنتاجية ويعمل دائمًا على VPS الخاص بك
    - تريد تحكمًا كاملًا في الاستمرارية، والملفات التنفيذية، وسلوك إعادة التشغيل
    - أنت تشغّل OpenClaw داخل Docker على Hetzner أو مزود مشابه
summary: تشغيل OpenClaw Gateway على مدار الساعة طوال أيام الأسبوع على VPS منخفض التكلفة من Hetzner ‏(Docker) مع حالة دائمة وملفات تنفيذية مضمّنة داخل الصورة
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T07:48:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw على Hetzner ‏(Docker، دليل VPS للإنتاج)

## الهدف

تشغيل OpenClaw Gateway دائم على VPS من Hetzner باستخدام Docker، مع حالة دائمة، وملفات تنفيذية مضمّنة داخل الصورة، وسلوك آمن عند إعادة التشغيل.

إذا كنت تريد "OpenClaw يعمل 24/7 مقابل ~$5"، فهذا أبسط إعداد موثوق.
تتغير أسعار Hetzner؛ اختر أصغر VPS يعمل بـ Debian/Ubuntu وقم بالتوسعة إذا اصطدمت بأخطاء OOM.

تذكير بنموذج الأمان:

- الوكلاء المشتركون داخل الشركة مناسبون عندما يكون الجميع ضمن حد الثقة نفسه ويكون وقت التشغيل مخصصًا للأعمال فقط.
- حافظ على فصل صارم: VPS/وقت تشغيل مخصص + حسابات مخصصة؛ من دون ملفات شخصية شخصية لـ Apple/Google/browser/password-manager على ذلك المضيف.
- إذا كان المستخدمون خصومًا لبعضهم البعض، فافصل حسب gateway/المضيف/مستخدم نظام التشغيل.

راجع [الأمان](/ar/gateway/security) و[VPS hosting](/ar/vps).

## ما الذي نفعله (بعبارات بسيطة)؟

- استئجار خادم Linux صغير (Hetzner VPS)
- تثبيت Docker ‏(وقت تشغيل تطبيق معزول)
- تشغيل OpenClaw Gateway داخل Docker
- حفظ `~/.openclaw` + `~/.openclaw/workspace` على المضيف (لتنجو من إعادة التشغيل/إعادة البناء)
- الوصول إلى Control UI من حاسوبك المحمول عبر SSH tunnel

تتضمن حالة `~/.openclaw` المركبة هذه `openclaw.json` وملف
`agents/<agentId>/agent/auth-profiles.json` لكل وكيل، و`.env`.

يمكن الوصول إلى Gateway عبر:

- تمرير المنافذ عبر SSH من حاسوبك المحمول
- كشف المنفذ مباشرة إذا كنت تدير الجدار الناري والرموز بنفسك

يفترض هذا الدليل Ubuntu أو Debian على Hetzner.  
إذا كنت على Linux VPS آخر، فقم بمواءمة الحزم وفقًا لذلك.
وبالنسبة إلى تدفق Docker العام، راجع [Docker](/ar/install/docker).

---

## المسار السريع (للمشغلين ذوي الخبرة)

1. جهّز Hetzner VPS
2. ثبّت Docker
3. استنسخ مستودع OpenClaw
4. أنشئ أدلة مضيف دائمة
5. اضبط `.env` و`docker-compose.yml`
6. ضمّن الملفات التنفيذية المطلوبة داخل الصورة
7. شغّل `docker compose up -d`
8. تحقق من الاستمرارية والوصول إلى Gateway

---

## ما الذي تحتاج إليه

- Hetzner VPS مع وصول root
- وصول SSH من حاسوبك المحمول
- قدر أساسي من الراحة مع SSH + النسخ/اللصق
- حوالي 20 دقيقة
- Docker وDocker Compose
- بيانات اعتماد مصادقة النماذج
- بيانات اعتماد مزود اختيارية
  - QR لـ WhatsApp
  - رمز bot لـ Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="جهّز VPS">
    أنشئ Ubuntu أو Debian VPS في Hetzner.

    اتصل كمستخدم root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    يفترض هذا الدليل أن VPS يحتفظ بحالته.
    لا تتعامل معه كبنية تحتية قابلة للرمي.

  </Step>

  <Step title="ثبّت Docker (على VPS)">
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

  <Step title="استنسخ مستودع OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    يفترض هذا الدليل أنك ستبني صورة مخصصة لضمان استمرارية الملفات التنفيذية.

  </Step>

  <Step title="أنشئ أدلة مضيف دائمة">
    حاويات Docker مؤقتة.
    يجب أن تعيش كل حالة طويلة الأمد على المضيف.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="اضبط متغيرات البيئة">
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
    إدارته عبر `.env`؛ إذ يكتب OpenClaw رمز gateway عشوائيًا إلى
    الإعدادات عند أول تشغيل. أنشئ كلمة مرور keyring والصقها في
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **لا تقم بإيداع هذا الملف.**

    ملف `.env` هذا مخصص لبيئة الحاوية/وقت التشغيل مثل `OPENCLAW_GATEWAY_TOKEN`.
    أما مصادقة OAuth/API-key الخاصة بالـ provider والمخزنة فتوجد في
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

    إن `--allow-unconfigured` مخصص فقط لراحة الإقلاع الأولي، وليس بديلًا عن إعداد gateway صحيح. لا تزال بحاجة إلى ضبط المصادقة (`gateway.auth.token` أو كلمة المرور) واستخدام إعدادات ربط آمنة لنشرك.

  </Step>

  <Step title="خطوات وقت تشغيل Docker VM المشتركة">
    استخدم دليل وقت التشغيل المشترك لتدفق مضيف Docker العام:

    - [ضمّن الملفات التنفيذية المطلوبة داخل الصورة](/ar/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [البناء والتشغيل](/ar/install/docker-vm-runtime#build-and-launch)
    - [ما الذي يُحفَظ وأين](/ar/install/docker-vm-runtime#what-persists-where)
    - [التحديثات](/ar/install/docker-vm-runtime#updates)

  </Step>

  <Step title="الوصول الخاص بـ Hetzner">
    بعد خطوات البناء والتشغيل المشتركة، أنشئ tunnel من حاسوبك المحمول:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    افتح:

    `http://127.0.0.1:18789/`

    الصق السر المشترك المضبوط. يستخدم هذا الدليل رمز gateway بشكل
    افتراضي؛ وإذا كنت قد بدّلت إلى مصادقة كلمة المرور، فاستخدم تلك الكلمة بدلًا من ذلك.

  </Step>
</Steps>

توجد خريطة الاستمرارية المشتركة في [وقت تشغيل Docker VM](/ar/install/docker-vm-runtime#what-persists-where).

## البنية التحتية ككود (Terraform)

بالنسبة إلى الفرق التي تفضّل تدفقات البنية التحتية ككود، يوفّر إعداد Terraform محفوظ من المجتمع ما يلي:

- إعداد Terraform معياري مع إدارة حالة بعيدة
- تهيئة تلقائية عبر cloud-init
- سكربتات نشر (bootstrap، deploy، backup/restore)
- تعزيز أمني (جدار ناري، UFW، وصول SSH فقط)
- إعداد SSH tunnel للوصول إلى gateway

**المستودعات:**

- Infrastructure: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- إعداد Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

يكمل هذا النهج إعداد Docker أعلاه من خلال عمليات نشر قابلة لإعادة الإنتاج، وبنية تحتية مضبوطة بالإصدارات، واستعادة تلقائية من الكوارث.

> **ملاحظة:** محفوظ من المجتمع. وبالنسبة إلى المشكلات أو المساهمات، راجع روابط المستودعات أعلاه.

## الخطوات التالية

- اضبط قنوات المراسلة: [القنوات](/ar/channels)
- اضبط Gateway: [إعدادات Gateway](/ar/gateway/configuration)
- أبقِ OpenClaw محدّثًا: [التحديث](/ar/install/updating)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Fly.io](/ar/install/fly)
- [Docker](/ar/install/docker)
- [VPS hosting](/ar/vps)
