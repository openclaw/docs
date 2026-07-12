---
read_when:
    - إعداد OpenClaw على Oracle Cloud
    - البحث عن استضافة VPS مجانية لـ OpenClaw
    - تريد تشغيل OpenClaw على مدار الساعة طوال أيام الأسبوع على خادم صغير
summary: استضف OpenClaw على فئة ARM المجانية دائمًا من Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-12T06:05:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

شغّل Gateway دائمًا لـ OpenClaw على فئة ARM ‏**Always Free** من Oracle Cloud (حتى 4 وحدات OCPU وذاكرة RAM بسعة 24 غيغابايت ومساحة تخزين 200 غيغابايت) دون تكلفة.

## المتطلبات الأساسية

- حساب Oracle Cloud ([التسجيل](https://www.oracle.com/cloud/free/)) -- راجع [دليل التسجيل المجتمعي](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) إذا واجهت مشكلات
- حساب Tailscale (مجاني على [tailscale.com](https://tailscale.com))
- زوج مفاتيح SSH
- نحو 30 دقيقة

## الإعداد

<Steps>
  <Step title="إنشاء مثيل OCI">
    1. سجّل الدخول إلى [وحدة تحكم Oracle Cloud](https://cloud.oracle.com/).
    2. انتقل إلى **Compute > Instances > Create Instance**.
    3. اضبط الإعدادات:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** وحدتان (أو حتى 4)
       - **Memory:** ‏12 غيغابايت (أو حتى 24 غيغابايت)
       - **Boot volume:** ‏50 غيغابايت (حتى 200 غيغابايت مجانًا)
       - **SSH key:** أضف مفتاحك العام
    4. انقر على **Create** ودوّن عنوان IP العام.

    <Tip>
    إذا فشل إنشاء المثيل مع ظهور الرسالة "Out of capacity"، فجرّب نطاق توافر مختلفًا أو أعد المحاولة لاحقًا. سعة الفئة المجانية محدودة.
    </Tip>

  </Step>

  <Step title="الاتصال بالنظام وتحديثه">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    حزمة `build-essential` مطلوبة لترجمة بعض الاعتماديات على ARM.

  </Step>

  <Step title="ضبط المستخدم واسم المضيف">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    يؤدي تمكين الاستمرار إلى إبقاء خدمات المستخدم قيد التشغيل بعد تسجيل الخروج.

  </Step>

  <Step title="تثبيت Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    من الآن فصاعدًا، اتصل عبر Tailscale: ‏`ssh ubuntu@openclaw`.

  </Step>

  <Step title="تثبيت OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    عند ظهور السؤال "How do you want to hatch your bot?"، حدّد **Do this later**.

  </Step>

  <Step title="ضبط Gateway">
    استخدم المصادقة بالرمز المميز مع Tailscale Serve للوصول الآمن عن بُعد.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    يُستخدم `gateway.trustedProxies=["127.0.0.1"]` هنا فقط لمعالجة عنوان IP المُمرَّر/العميل المحلي الخاصة بوكيل Tailscale Serve المحلي. وهو **ليس** `gateway.auth.mode: "trusted-proxy"`. تحتفظ مسارات عارض الفروق بسلوك الإغلاق عند الفشل في هذا الإعداد: تُرجع طلبات العارض المباشرة من `127.0.0.1` من دون ترويسات الوكيل المُمرَّرة الرسالة `Diff not found`. استخدم `mode=file` / `mode=both` للمرفقات، أو فعّل العارضات البعيدة عمدًا واضبط `plugins.entries.diffs.config.viewerBaseUrl` (أو مرّر `baseUrl` للوكيل) إذا كنت تحتاج إلى روابط عارض قابلة للمشاركة.

  </Step>

  <Step title="تأمين VCN">
    احظر جميع حركة المرور باستثناء Tailscale عند حافة الشبكة:

    1. انتقل إلى **Networking > Virtual Cloud Networks** في وحدة تحكم OCI.
    2. انقر على شبكة VCN الخاصة بك، ثم **Security Lists > Default Security List**.
    3. **أزل** جميع قواعد حركة المرور الواردة باستثناء `0.0.0.0/0 UDP 41641` ‏(Tailscale).
    4. احتفظ بقواعد حركة المرور الصادرة الافتراضية (السماح بكل الاتصالات الصادرة).

    يؤدي ذلك إلى حظر SSH على المنفذ 22 وHTTP وHTTPS وكل ما عداها عند حافة الشبكة. ومن هذه النقطة فصاعدًا، لا يمكنك الاتصال إلا عبر Tailscale.

  </Step>

  <Step title="التحقق">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    ادخل إلى واجهة التحكم من أي جهاز على شبكتك الخاصة:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    استبدل `<tailnet-name>` باسم شبكتك الخاصة (الظاهر في `tailscale status`).

  </Step>
</Steps>

## التحقق من الوضع الأمني

عند تأمين VCN (مع فتح UDP 41641 فقط) وربط Gateway بواجهة الاسترجاع، تُحظر حركة المرور العامة عند حافة الشبكة ويقتصر وصول المسؤول على الشبكة الخاصة. يلغي ذلك الحاجة إلى عدة خطوات تقليدية لتقوية أمان الخادم الافتراضي الخاص:

| الخطوة التقليدية                | هل هي مطلوبة؟ | السبب                                                                 |
| ------------------------------- | ------------- | --------------------------------------------------------------------- |
| جدار الحماية UFW                | لا            | تحظر VCN حركة المرور قبل وصولها إلى المثيل.                           |
| fail2ban                        | لا            | المنفذ 22 محظور على مستوى VCN؛ ولا يوجد سطح لهجمات القوة الغاشمة.     |
| تقوية أمان sshd                 | لا            | لا يستخدم SSH الخاص بـ Tailscale خدمة sshd.                           |
| تعطيل تسجيل دخول المستخدم الجذر | لا            | يصادق Tailscale عبر هوية الشبكة الخاصة، وليس عبر مستخدمي النظام.      |
| المصادقة بمفتاح SSH فقط         | لا            | للسبب نفسه -- تحل هوية الشبكة الخاصة محل مفاتيح SSH الخاصة بالنظام.  |
| تقوية أمان IPv6                 | ليس عادةً     | يعتمد على إعدادات VCN/الشبكة الفرعية؛ تحقّق مما أُسنِد وكُشِف فعليًا. |

لا يزال ما يلي موصى به:

- استخدم `chmod 700 ~/.openclaw` لتقييد أذونات ملفات بيانات الاعتماد.
- استخدم `openclaw security audit` لإجراء فحص للوضع الأمني خاص بـ OpenClaw.
- نفّذ `sudo apt update && sudo apt upgrade` بانتظام لتثبيت تصحيحات نظام التشغيل.
- راجع الأجهزة دوريًا في [وحدة تحكم إدارة Tailscale](https://login.tailscale.com/admin).

أوامر تحقق سريعة:

```bash
# تأكد من عدم وجود منافذ عامة في حالة استماع
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# تحقق من أن SSH الخاص بـ Tailscale نشط
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# اختياري: عطّل sshd بالكامل بعد التأكد من أن SSH الخاص بـ Tailscale يعمل
sudo systemctl disable --now ssh
```

## ملاحظات ARM

تعمل فئة Always Free بمعمارية ARM ‏(`aarch64`). تعمل معظم ميزات OpenClaw بصورة جيدة؛ إلا أن عددًا قليلًا من الملفات الثنائية الأصلية يحتاج إلى إصدارات مخصّصة لـ ARM:

- ‏Node.js وTelegram وWhatsApp ‏(Baileys): تعمل بلغة JavaScript فقط، ولا توجد مشكلات.
- معظم حزم npm التي تحتوي على شيفرة أصلية: تتوفر لها ملفات `linux-arm64` مُنشأة مسبقًا.
- أدوات CLI المساعدة الاختيارية (مثل ملفات Go/Rust الثنائية التي توفرها Skills): تحقّق من وجود إصدار `aarch64` / `linux-arm64` قبل التثبيت.

تحقّق من المعمارية باستخدام `uname -m` (يجب أن يطبع `aarch64`). بالنسبة إلى الملفات الثنائية التي لا يتوفر لها إصدار ARM، ثبّتها من المصدر أو تخطَّها.

## الاستمرارية والنسخ الاحتياطية

توجد حالة OpenClaw ضمن:

- `~/.openclaw/` -- ملف `openclaw.json` وملفات `auth-profiles.json` الخاصة بكل وكيل وحالة القنوات/الموفّرين وبيانات الجلسات.
- `~/.openclaw/workspace/` -- مساحة عمل الوكيل (SOUL.md والذاكرة والعناصر الناتجة).

تستمر هذه البيانات بعد عمليات إعادة التشغيل. لإنشاء لقطة قابلة للنقل:

```bash
openclaw backup create
```

## الخيار الاحتياطي: نفق SSH

إذا لم يعمل Tailscale Serve، فاستخدم نفق SSH من جهازك المحلي:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

ثم افتح `http://localhost:18789`.

## استكشاف الأخطاء وإصلاحها

**فشل إنشاء المثيل ("Out of capacity")** -- تحظى مثيلات ARM من الفئة المجانية بشعبية كبيرة. جرّب نطاق توافر مختلفًا أو أعد المحاولة في غير ساعات الذروة.

**تعذّر اتصال Tailscale** -- شغّل `sudo tailscale up --ssh --hostname=openclaw --reset` لإعادة المصادقة.

**تعذّر بدء Gateway** -- شغّل `openclaw doctor --non-interactive` وتحقّق من السجلات باستخدام `journalctl --user -u openclaw-gateway.service -n 50`.

**مشكلات الملفات الثنائية على ARM** -- تعمل معظم حزم npm على ARM64. بالنسبة إلى الملفات الثنائية الأصلية، ابحث عن إصدارات `linux-arm64` أو `aarch64`. تحقّق من المعمارية باستخدام `uname -m`.

## الخطوات التالية

- [القنوات](/ar/channels) -- وصّل Telegram وWhatsApp وDiscord وغيرها
- [إعداد Gateway](/ar/gateway/configuration) -- جميع خيارات الإعداد
- [التحديث](/ar/install/updating) -- حافظ على تحديث OpenClaw

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [GCP](/ar/install/gcp)
- [استضافة VPS](/ar/vps)
