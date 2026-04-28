---
read_when:
    - تريد نشرًا مؤتمتًا للخادم مع تقوية أمنية
    - تحتاج إلى إعداد معزول بجدار ناري مع وصول عبر Tailscale
    - أنت تنشر إلى خوادم Debian/Ubuntu بعيدة
summary: تثبيت OpenClaw مؤتمت ومحصّن باستخدام Ansible وTailscale وعزل الجدار الناري
title: Ansible
x-i18n:
    generated_at: "2026-04-21T07:21:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# تثبيت Ansible

انشر OpenClaw إلى خوادم الإنتاج باستخدام **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- مثبّت مؤتمت بهندسة تركّز على الأمان أولًا.

<Info>
يُعد مستودع [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) مصدر الحقيقة لعمليات النشر عبر Ansible. وهذه الصفحة مجرد نظرة عامة سريعة.
</Info>

## المتطلبات المسبقة

| المتطلب | التفاصيل |
| ----------- | --------------------------------------------------------- |
| **نظام التشغيل** | Debian 11+ أو Ubuntu 20.04+ |
| **الوصول** | صلاحيات root أو sudo |
| **الشبكة** | اتصال بالإنترنت لتثبيت الحزم |
| **Ansible** | 2.14+ (يتم تثبيته تلقائيًا بواسطة نص البدء السريع) |

## ما الذي ستحصل عليه

- **أمان يعتمد على الجدار الناري أولًا** -- UFW + عزل Docker (إتاحة SSH + Tailscale فقط)
- **Tailscale VPN** -- وصول بعيد آمن من دون كشف الخدمات علنًا
- **Docker** -- حاويات عزل منفصلة، وروابط على localhost فقط
- **دفاع متعدد الطبقات** -- بنية أمان من 4 طبقات
- **تكامل Systemd** -- تشغيل تلقائي عند الإقلاع مع تقوية أمنية
- **إعداد بأمر واحد** -- نشر كامل في غضون دقائق

## البدء السريع

تثبيت بأمر واحد:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## ما الذي يتم تثبيته

يقوم Ansible playbook بتثبيت وتهيئة ما يلي:

1. **Tailscale** -- شبكة VPN شبكية للوصول البعيد الآمن
2. **جدار UFW الناري** -- منافذ SSH + Tailscale فقط
3. **Docker CE + Compose V2** -- لواجهة العزل الخلفية الافتراضية للوكيل
4. **Node.js 24 + pnpm** -- تبعيات وقت التشغيل (لا يزال Node 22 LTS، حاليًا `22.14+`، مدعومًا)
5. **OpenClaw** -- يعمل على المضيف، وليس داخل حاوية
6. **خدمة Systemd** -- تشغيل تلقائي مع تقوية أمنية

<Note>
يعمل Gateway مباشرةً على المضيف (وليس في Docker). عزل الوكلاء
اختياري؛ ويقوم هذا الـ playbook بتثبيت Docker لأنه الواجهة الخلفية
الافتراضية للعزل. راجع [العزل](/ar/gateway/sandboxing) لمزيد من التفاصيل والواجهات الخلفية الأخرى.
</Note>

## الإعداد بعد التثبيت

<Steps>
  <Step title="التبديل إلى مستخدم openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="تشغيل معالج الإعداد الأولي">
    سيرشدك النص البرمجي لما بعد التثبيت خلال تهيئة إعدادات OpenClaw.
  </Step>
  <Step title="ربط موفّري المراسلة">
    سجّل الدخول إلى WhatsApp أو Telegram أو Discord أو Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="التحقق من التثبيت">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="الاتصال بـ Tailscale">
    انضم إلى شبكة VPN الخاصة بك للوصول البعيد الآمن.
  </Step>
</Steps>

### أوامر سريعة

```bash
# التحقق من حالة الخدمة
sudo systemctl status openclaw

# عرض السجلات المباشرة
sudo journalctl -u openclaw -f

# إعادة تشغيل Gateway
sudo systemctl restart openclaw

# تسجيل دخول الموفّر (شغّله كمستخدم openclaw)
sudo -i -u openclaw
openclaw channels login
```

## بنية الأمان

يستخدم هذا النشر نموذج دفاع من 4 طبقات:

1. **الجدار الناري (UFW)** -- يتم كشف SSH ‏(22) + Tailscale ‏(41641/udp) فقط علنًا
2. **VPN ‏(Tailscale)** -- لا يمكن الوصول إلى Gateway إلا عبر شبكة VPN
3. **عزل Docker** -- تمنع سلسلة iptables ‏DOCKER-USER كشف المنافذ الخارجية
4. **تقوية Systemd** -- ‏NoNewPrivileges وPrivateTmp ومستخدم غير مميّز

للتحقق من سطح الهجوم الخارجي لديك:

```bash
nmap -p- YOUR_SERVER_IP
```

يجب أن يكون المنفذ 22 ‏(SSH) فقط مفتوحًا. أما جميع الخدمات الأخرى (Gateway وDocker) فهي محكمة الإغلاق.

يتم تثبيت Docker من أجل حاويات عزل الوكلاء (تنفيذ أدوات معزول)، وليس لتشغيل Gateway نفسه. راجع [عزل وأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) لمعرفة إعدادات العزل.

## التثبيت اليدوي

إذا كنت تفضّل التحكم اليدوي بدل الأتمتة:

<Steps>
  <Step title="تثبيت المتطلبات المسبقة">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="استنساخ المستودع">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="تثبيت مجموعات Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="تشغيل الـ playbook">
    ```bash
    ./run-playbook.sh
    ```

    أو شغّله مباشرةً ثم نفّذ نص الإعداد يدويًا بعد ذلك:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # ثم شغّل: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## التحديث

يقوم مثبّت Ansible بإعداد OpenClaw للتحديثات اليدوية. راجع [التحديث](/ar/install/updating) لمعرفة تدفق التحديث القياسي.

لإعادة تشغيل Ansible playbook (على سبيل المثال، لتغييرات الإعدادات):

```bash
cd openclaw-ansible
./run-playbook.sh
```

هذا الإجراء idempotent وآمن للتشغيل عدة مرات.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الجدار الناري يحظر اتصالي">
    - تأكد أولًا من أنك تستطيع الوصول عبر Tailscale VPN
    - يُسمح دائمًا بالوصول عبر SSH ‏(المنفذ 22)
    - لا يمكن الوصول إلى Gateway إلا عبر Tailscale حسب التصميم

  </Accordion>
  <Accordion title="الخدمة لا تبدأ">
    ```bash
    # فحص السجلات
    sudo journalctl -u openclaw -n 100

    # التحقق من الأذونات
    sudo ls -la /opt/openclaw

    # اختبار البدء اليدوي
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="مشكلات عزل Docker">
    ```bash
    # التحقق من أن Docker يعمل
    sudo systemctl status docker

    # التحقق من صورة العزل
    sudo docker images | grep openclaw-sandbox

    # بناء صورة العزل إذا كانت مفقودة
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="فشل تسجيل دخول الموفّر">
    تأكد من أنك تعمل كمستخدم `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## إعدادات متقدمة

للاطلاع على بنية الأمان التفصيلية واستكشاف الأخطاء وإصلاحها، راجع مستودع openclaw-ansible:

- [بنية الأمان](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [التفاصيل التقنية](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [دليل استكشاف الأخطاء وإصلاحها](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## ذو صلة

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- دليل النشر الكامل
- [Docker](/ar/install/docker) -- إعداد Gateway داخل حاويات
- [العزل](/ar/gateway/sandboxing) -- إعداد عزل الوكلاء
- [عزل وأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) -- العزل لكل وكيل
