---
read_when:
    - إعداد OpenClaw على Oracle Cloud
    - تبحث عن استضافة VPS مجانية لـ OpenClaw
    - تريد OpenClaw يعمل على مدار الساعة طوال أيام الأسبوع على خادم صغير
summary: استضافة OpenClaw على طبقة ARM المجانية الدائمة من Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-24T07:49:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 15
---

شغّل Gateway دائمًا لـ OpenClaw على طبقة ARM **المجانية الدائمة** من Oracle Cloud (حتى 4 OCPU، و24 GB RAM، و200 GB تخزين) من دون تكلفة.

## المتطلبات المسبقة

- حساب Oracle Cloud ‏([التسجيل](https://www.oracle.com/cloud/free/)) -- راجع [دليل التسجيل المجتمعي](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) إذا واجهت مشكلات
- حساب Tailscale ‏(مجاني على [tailscale.com](https://tailscale.com))
- زوج مفاتيح SSH
- نحو 30 دقيقة

## الإعداد

<Steps>
  <Step title="أنشئ مثيل OCI">
    1. سجّل الدخول إلى [Oracle Cloud Console](https://cloud.oracle.com/).
    2. انتقل إلى **Compute > Instances > Create Instance**.
    3. قم بالتكوين:
       - **الاسم:** `openclaw`
       - **الصورة:** Ubuntu 24.04 ‏(aarch64)
       - **الشكل:** `VM.Standard.A1.Flex` ‏(Ampere ARM)
       - **OCPUs:** 2 (أو حتى 4)
       - **الذاكرة:** 12 GB (أو حتى 24 GB)
       - **وحدة إقلاع التخزين:** 50 GB (حتى 200 GB مجانًا)
       - **مفتاح SSH:** أضف مفتاحك العام
    4. انقر **Create** وسجّل عنوان IP العام.

    <Tip>
    إذا فشل إنشاء المثيل برسالة "Out of capacity"، فجرّب نطاق توفر مختلفًا أو أعد المحاولة لاحقًا. سعة الطبقة المجانية محدودة.
    </Tip>

  </Step>

  <Step title="اتصل وحدّث النظام">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    يلزم `build-essential` لتجميع بعض التبعيات على ARM.

  </Step>

  <Step title="كوّن المستخدم واسم المضيف">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    يؤدي تفعيل linger إلى إبقاء خدمات المستخدم قيد التشغيل بعد تسجيل الخروج.

  </Step>

  <Step title="ثبّت Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    من الآن فصاعدًا، اتصل عبر Tailscale: ‏`ssh ubuntu@openclaw`.

  </Step>

  <Step title="ثبّت OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    عندما يُطلب منك "How do you want to hatch your bot?"، اختر **Do this later**.

  </Step>

  <Step title="كوّن Gateway">
    استخدم مصادقة الرمز المميز مع Tailscale Serve للوصول البعيد الآمن.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    إن `gateway.trustedProxies=["127.0.0.1"]` هنا مخصص فقط للتعامل مع IP المُمرَّر/العميل المحلي من وكيل Tailscale Serve المحلي. وهو **ليس** `gateway.auth.mode: "trusted-proxy"`. وتبقى مسارات عارض الفروقات في هذا الإعداد ذات سلوك فشل مغلق: يمكن أن تعيد طلبات العارض الخام `127.0.0.1` من دون ترويسات الوكيل المُمرَّر الرسالة `Diff not found`. استخدم `mode=file` / `mode=both` للمرفقات، أو فعّل العارضات البعيدة عمدًا واضبط `plugins.entries.diffs.config.viewerBaseUrl` (أو مرّر `baseUrl` للوكيل) إذا كنت تحتاج إلى روابط عارض قابلة للمشاركة.

  </Step>

  <Step title="أحكم تأمين VCN">
    احظر كل حركة المرور باستثناء Tailscale عند حافة الشبكة:

    1. انتقل إلى **Networking > Virtual Cloud Networks** في OCI Console.
    2. انقر VCN الخاصة بك، ثم **Security Lists > Default Security List**.
    3. **أزل** كل قواعد الدخول باستثناء `0.0.0.0/0 UDP 41641` ‏(Tailscale).
    4. أبقِ قواعد الخروج الافتراضية (السماح بكل الخروج).

    يؤدي هذا إلى حظر SSH على المنفذ 22، وHTTP، وHTTPS، وكل شيء آخر عند حافة الشبكة. ولن تتمكن من الاتصال إلا عبر Tailscale من هذه النقطة فصاعدًا.

  </Step>

  <Step title="تحقق">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    ادخل إلى Control UI من أي جهاز على tailnet الخاص بك:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    استبدل `<tailnet-name>` باسم tailnet الخاص بك (الظاهر في `tailscale status`).

  </Step>
</Steps>

## احتياط: نفق SSH

إذا كان Tailscale Serve لا يعمل، فاستخدم نفق SSH من جهازك المحلي:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

ثم افتح `http://localhost:18789`.

## استكشاف الأخطاء وإصلاحها

**يفشل إنشاء المثيل ("Out of capacity")** -- تحظى مثيلات ARM المجانية بشعبية. جرّب نطاق توفر مختلفًا أو أعد المحاولة خلال ساعات انخفاض الضغط.

**لا يتصل Tailscale** -- شغّل `sudo tailscale up --ssh --hostname=openclaw --reset` لإعادة المصادقة.

**لا يبدأ Gateway** -- شغّل `openclaw doctor --non-interactive` وتحقق من السجلات باستخدام `journalctl --user -u openclaw-gateway.service -n 50`.

**مشكلات الملفات الثنائية على ARM** -- تعمل معظم حزم npm على ARM64. بالنسبة إلى الملفات الثنائية الأصلية، ابحث عن إصدارات `linux-arm64` أو `aarch64`. وتحقق من البنية باستخدام `uname -m`.

## الخطوات التالية

- [القنوات](/ar/channels) -- صِل Telegram وWhatsApp وDiscord وغير ذلك
- [تكوين Gateway](/ar/gateway/configuration) -- جميع خيارات التكوين
- [التحديث](/ar/install/updating) -- حافظ على OpenClaw محدثًا

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [GCP](/ar/install/gcp)
- [استضافة VPS](/ar/vps)
