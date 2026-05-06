---
read_when:
    - إعداد OpenClaw على Oracle Cloud
    - البحث عن استضافة VPS مجانية لـ OpenClaw
    - تريد تشغيل OpenClaw على مدار الساعة على خادم صغير
summary: استضافة OpenClaw على فئة ARM المجانية دائمًا في Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T08:01:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
---

شغّل Gateway دائمًا لـ OpenClaw على طبقة ARM من Oracle Cloud **Always Free** (حتى 4 OCPU وذاكرة RAM بسعة 24 GB وتخزين بسعة 200 GB) من دون تكلفة.

## المتطلبات المسبقة

- حساب Oracle Cloud ([التسجيل](https://www.oracle.com/cloud/free/)) -- راجع [دليل التسجيل المجتمعي](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) إذا واجهت مشكلات
- حساب Tailscale (مجاني على [tailscale.com](https://tailscale.com))
- زوج مفاتيح SSH
- نحو 30 دقيقة

## الإعداد

<Steps>
  <Step title="إنشاء مثيل OCI">
    1. سجّل الدخول إلى [Oracle Cloud Console](https://cloud.oracle.com/).
    2. انتقل إلى **Compute > Instances > Create Instance**.
    3. اضبط الإعدادات:
       - **الاسم:** `openclaw`
       - **الصورة:** Ubuntu 24.04 (aarch64)
       - **الشكل:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **وحدات OCPU:** 2 (أو حتى 4)
       - **الذاكرة:** 12 GB (أو حتى 24 GB)
       - **وحدة تخزين الإقلاع:** 50 GB (حتى 200 GB مجانًا)
       - **مفتاح SSH:** أضف مفتاحك العام
    4. انقر **Create** ودوّن عنوان IP العام.

    <Tip>
    إذا فشل إنشاء المثيل برسالة "Out of capacity"، فجرّب نطاق إتاحة مختلفًا أو أعد المحاولة لاحقًا. سعة الطبقة المجانية محدودة.
    </Tip>

  </Step>

  <Step title="الاتصال وتحديث النظام">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    يلزم `build-essential` لترجمة بعض الاعتماديات على ARM.

  </Step>

  <Step title="إعداد المستخدم واسم المضيف">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    يضمن تفعيل linger استمرار تشغيل خدمات المستخدم بعد تسجيل الخروج.

  </Step>

  <Step title="تثبيت Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    من الآن فصاعدًا، اتصل عبر Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="تثبيت OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    عند ظهور المطالبة "How do you want to hatch your bot?"، اختر **Do this later**.

  </Step>

  <Step title="إعداد Gateway">
    استخدم مصادقة الرمز مع Tailscale Serve للوصول البعيد الآمن.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    يُستخدم `gateway.trustedProxies=["127.0.0.1"]` هنا فقط لمعالجة الوكيل المحلي لـ Tailscale Serve لعناوين IP الممرّرة والعملاء المحليين. هذا **ليس** `gateway.auth.mode: "trusted-proxy"`. تحتفظ مسارات عارض الفروقات بسلوك الإغلاق الآمن في هذا الإعداد: يمكن أن تعيد طلبات العارض الخام من `127.0.0.1` من دون ترويسات وكيل ممرّرة القيمة `Diff not found`. استخدم `mode=file` / `mode=both` للمرفقات، أو فعّل عارضين بعيدين عمدًا واضبط `plugins.entries.diffs.config.viewerBaseUrl` (أو مرّر `baseUrl` للوكيل) إذا كنت تحتاج إلى روابط عارض قابلة للمشاركة.

  </Step>

  <Step title="تأمين أمان VCN">
    احظر كل حركة المرور باستثناء Tailscale عند حافة الشبكة:

    1. انتقل إلى **Networking > Virtual Cloud Networks** في OCI Console.
    2. انقر VCN الخاص بك، ثم **Security Lists > Default Security List**.
    3. **أزِل** كل قواعد الدخول باستثناء `0.0.0.0/0 UDP 41641` (Tailscale).
    4. أبقِ قواعد الخروج الافتراضية (السماح بكل الاتصالات الصادرة).

    يحظر هذا SSH على المنفذ 22 وHTTP وHTTPS وكل شيء آخر عند حافة الشبكة. لا يمكنك الاتصال من هذه النقطة فصاعدًا إلا عبر Tailscale.

  </Step>

  <Step title="التحقق">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    ادخل إلى واجهة التحكم من أي جهاز على tailnet الخاص بك:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    استبدل `<tailnet-name>` باسم tailnet الخاص بك (يظهر في `tailscale status`).

  </Step>
</Steps>

## التحقق من الوضع الأمني

مع تأمين VCN (فتح UDP 41641 فقط) وربط Gateway بـ loopback، تُحظر حركة المرور العامة عند حافة الشبكة ويصبح وصول الإدارة محصورًا في tailnet. يزيل ذلك الحاجة إلى عدة خطوات تقليدية لتقوية VPS:

| الخطوة التقليدية | هل تلزم؟ | السبب |
| ------------------ | ----------- | ------------------------------------------------------------------------- |
| جدار حماية UFW | لا | يحظر VCN حركة المرور قبل أن تصل إلى المثيل. |
| fail2ban | لا | المنفذ 22 محظور على مستوى VCN؛ لا توجد مساحة هجوم بالقوة الغاشمة. |
| تقوية sshd | لا | لا يستخدم Tailscale SSH خدمة sshd. |
| تعطيل تسجيل دخول root | لا | يصادق Tailscale حسب هوية tailnet، وليس مستخدمي النظام. |
| مصادقة SSH بالمفاتيح فقط | لا | الأمر نفسه — تحل هوية tailnet محل مفاتيح SSH الخاصة بالنظام. |
| تقوية IPv6 | عادة لا | يعتمد ذلك على إعدادات VCN/الشبكة الفرعية؛ تحقّق مما أُسنِد أو كُشف فعليًا. |

لا يزال موصى به:

- `chmod 700 ~/.openclaw` لتقييد أذونات ملفات الاعتماد.
- `openclaw security audit` لفحص وضع أمني خاص بـ OpenClaw.
- تشغيل `sudo apt update && sudo apt upgrade` بانتظام لتطبيق تصحيحات نظام التشغيل.
- راجع الأجهزة في [وحدة إدارة Tailscale](https://login.tailscale.com/admin) دوريًا.

أوامر تحقق سريعة:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## ملاحظات ARM

طبقة Always Free تعمل على ARM (`aarch64`). تعمل معظم ميزات OpenClaw بشكل جيد؛ يحتاج عدد قليل من الثنائيات الأصلية إلى إصدارات ARM:

- Node.js وTelegram وWhatsApp (Baileys): JavaScript خالصة، بلا مشكلات.
- معظم حزم npm التي تحتوي على شيفرة أصلية: تتوفر لها عناصر `linux-arm64` مبنية مسبقًا.
- مساعدات CLI الاختيارية (مثل ثنائيات Go/Rust المشحونة بواسطة Skills): تحقق من توفر إصدار `aarch64` / `linux-arm64` قبل التثبيت.

تحقق من المعمارية باستخدام `uname -m` (ينبغي أن يطبع `aarch64`). بالنسبة إلى الثنائيات التي لا يتوفر لها بناء ARM، ثبّتها من المصدر أو تجاوزها.

## الاستمرارية والنسخ الاحتياطية

توجد حالة OpenClaw ضمن:

- `~/.openclaw/` — `openclaw.json` وملفات `auth-profiles.json` لكل وكيل، وحالة القنوات/الموفرين، وبيانات الجلسات.
- `~/.openclaw/workspace/` — مساحة عمل الوكيل (SOUL.md والذاكرة والآثار).

تبقى هذه البيانات بعد إعادة التشغيل. لإنشاء لقطة محمولة:

```bash
openclaw backup create
```

## بديل: نفق SSH

إذا لم يكن Tailscale Serve يعمل، فاستخدم نفق SSH من جهازك المحلي:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

ثم افتح `http://localhost:18789`.

## استكشاف الأخطاء وإصلاحها

**فشل إنشاء المثيل ("Out of capacity")** -- مثيلات ARM في الطبقة المجانية شائعة الاستخدام. جرّب نطاق إتاحة مختلفًا أو أعد المحاولة خلال ساعات انخفاض الطلب.

**لا يتصل Tailscale** -- شغّل `sudo tailscale up --ssh --hostname=openclaw --reset` لإعادة المصادقة.

**لا يبدأ Gateway** -- شغّل `openclaw doctor --non-interactive` وتحقق من السجلات باستخدام `journalctl --user -u openclaw-gateway.service -n 50`.

**مشكلات ثنائيات ARM** -- تعمل معظم حزم npm على ARM64. بالنسبة إلى الثنائيات الأصلية، ابحث عن إصدارات `linux-arm64` أو `aarch64`. تحقق من المعمارية باستخدام `uname -m`.

## الخطوات التالية

- [القنوات](/ar/channels) -- وصّل Telegram وWhatsApp وDiscord والمزيد
- [تكوين Gateway](/ar/gateway/configuration) -- كل خيارات التكوين
- [التحديث](/ar/install/updating) -- أبقِ OpenClaw محدّثًا

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [GCP](/ar/install/gcp)
- [استضافة VPS](/ar/vps)
