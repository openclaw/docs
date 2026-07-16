---
read_when:
    - تريد نشرًا آليًا للخادم مع تعزيز الأمان
    - تحتاج إلى إعداد معزول بجدار حماية مع إمكانية الوصول عبر VPN
    - أنت تنشر على خوادم Debian/Ubuntu بعيدة.
summary: تثبيت OpenClaw آلي ومُحصَّن باستخدام Ansible وشبكة Tailscale VPN وعزل جدار الحماية
title: Ansible
x-i18n:
    generated_at: "2026-07-16T14:19:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

انشر OpenClaw على خوادم الإنتاج باستخدام **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**، وهو مُثبّت آلي ذو بنية تضع الأمان أولًا.

<Info>
يُعد مستودع [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) المصدر الموثوق لنشر Ansible. تقدم هذه الصفحة نظرة عامة سريعة.
</Info>

## المتطلبات الأساسية

| المتطلب     | التفاصيل                                                  |
| ----------- | --------------------------------------------------------- |
| نظام التشغيل | Debian 11+ أو Ubuntu 20.04+                               |
| الوصول      | صلاحيات الجذر أو sudo                                     |
| الشبكة      | اتصال بالإنترنت لتثبيت الحزم                              |
| Ansible     | 2.14+ (يُثبَّت تلقائيًا بواسطة برنامج البدء السريع)       |

## ما ستحصل عليه

- أمان يبدأ بجدار الحماية: UFW + عزل Docker (لا يمكن الوصول إلا إلى SSH + Tailscale)
- شبكة Tailscale VPN للوصول عن بُعد دون كشف الخدمات علنًا
- Docker لحاويات بيئة الاختبار المعزولة ذات الارتباطات المحلية فقط
- تكامل Systemd مع التعزيز الأمني والتشغيل التلقائي عند الإقلاع
- إعداد بأمر واحد

## البدء السريع

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## ما يتم تثبيته

1. Tailscale (شبكة VPN شبكية للوصول الآمن عن بُعد)
2. جدار حماية UFW (منافذ SSH + Tailscale فقط)
3. Docker CE + Compose V2 (الواجهة الخلفية الافتراضية لبيئة اختبار الوكيل)
4. Node.js وpnpm (يتطلب OpenClaw إصدار Node 22.22.3+ أو 24.15+ أو 25.9+؛ ويوصى باستخدام Node 24)
5. OpenClaw، مثبّت على المضيف وليس داخل حاوية
6. خدمة systemd مزودة بتعزيز أمني

<Note>
يعمل Gateway مباشرةً على المضيف، وليس في Docker. يُعد عزل الوكيل في بيئة اختبار
اختياريًا؛ يثبّت دليل التشغيل هذا Docker لأنه الواجهة الخلفية الافتراضية لبيئة
الاختبار. راجع [العزل في بيئة اختبار](/ar/gateway/sandboxing) للتعرف على الواجهات الخلفية الأخرى.
</Note>

## الإعداد بعد التثبيت

<Steps>
  <Step title="التبديل إلى مستخدم openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="تشغيل معالج الإعداد الأولي">
    يرشدك برنامج ما بعد التثبيت خلال تهيئة OpenClaw.
  </Step>
  <Step title="ربط قنوات المراسلة">
    سجّل الدخول إلى WhatsApp أو Telegram أو Discord أو Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="التحقق من التثبيت">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="الاتصال بـ Tailscale">
    انضم إلى شبكة VPN الشبكية للوصول الآمن عن بُعد.
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

# تسجيل الدخول إلى القناة (يُشغّل كمستخدم openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## البنية الأمنية

نموذج دفاع من أربع طبقات:

1. جدار الحماية (UFW): لا يُكشف علنًا إلا SSH (22) وTailscale (41641/udp)
2. شبكة VPN ‏(Tailscale): لا يمكن الوصول إلى Gateway إلا عبر شبكة VPN الشبكية
3. عزل Docker: تمنع سلسلة iptables ‏`DOCKER-USER` كشف المنافذ خارجيًا
4. تعزيز Systemd: ‏`NoNewPrivileges`، و`PrivateTmp`، ومستخدم بلا امتيازات

تحقق من سطح الهجوم الخارجي:

```bash
nmap -p- YOUR_SERVER_IP
```

يجب أن يكون المنفذ 22 (SSH) فقط مفتوحًا. يظل Gateway وDocker محميين من الوصول.

يُثبّت Docker لبيئات اختبار الوكلاء (تنفيذ الأدوات بصورة معزولة)، وليس لتشغيل Gateway. راجع [بيئة اختبار متعددة الوكلاء والأدوات](/ar/tools/multi-agent-sandbox-tools) لتهيئة بيئة الاختبار.

## التثبيت اليدوي

<Steps>
  <Step title="تثبيت المتطلبات الأساسية">
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
  <Step title="تشغيل دليل التشغيل">
    ```bash
    ./run-playbook.sh
    ```

    أو شغّل دليل التشغيل مباشرةً، ثم شغّل برنامج الإعداد يدويًا:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # ثم شغّل: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## التحديث

يُعد مُثبّت Ansible برنامج OpenClaw للتحديثات اليدوية؛ راجع [التحديث](/ar/install/updating) لمعرفة التدفق القياسي.

لإعادة تشغيل دليل التشغيل (على سبيل المثال، بعد تغييرات التهيئة):

```bash
cd openclaw-ansible
./run-playbook.sh
```

هذه العملية ثابتة النتائج وآمنة للتشغيل عدة مرات.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="جدار الحماية يحظر اتصالي">
    - اتصل أولًا عبر شبكة Tailscale VPN؛ إذ لا يمكن الوصول إلى Gateway إلا بهذه الطريقة حسب التصميم.
    - يُسمح دائمًا باتصال SSH (المنفذ 22).

  </Accordion>
  <Accordion title="الخدمة لا تبدأ">
    ```bash
    # التحقق من السجلات
    sudo journalctl -u openclaw -n 100

    # التحقق من الأذونات
    sudo ls -la /opt/openclaw

    # اختبار التشغيل اليدوي
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="مشكلات بيئة اختبار Docker">
    ```bash
    # التحقق من أن Docker قيد التشغيل
    sudo systemctl status docker

    # التحقق من صورة بيئة الاختبار
    sudo docker images | grep openclaw-sandbox

    # بناء صورة بيئة الاختبار إذا كانت مفقودة (يتطلب نسخة مصدر)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # لعمليات تثبيت npm دون نسخة مصدر، راجع
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="فشل تسجيل الدخول إلى القناة">
    تأكد من التشغيل بصفتك المستخدم `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## التهيئة المتقدمة

للاطلاع على تفاصيل البنية الأمنية واستكشاف الأخطاء وإصلاحها، راجع مستودع openclaw-ansible:

- [البنية الأمنية](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [التفاصيل التقنية](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [دليل استكشاف الأخطاء وإصلاحها](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## ذو صلة

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): دليل النشر الكامل
- [Docker](/ar/install/docker): إعداد Gateway داخل حاوية
- [العزل في بيئة اختبار](/ar/gateway/sandboxing): تهيئة بيئة اختبار الوكيل
- [بيئة اختبار متعددة الوكلاء والأدوات](/ar/tools/multi-agent-sandbox-tools): عزل كل وكيل على حدة
