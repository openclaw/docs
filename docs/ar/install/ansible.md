---
read_when:
    - تريد نشرًا آليًا للخادم مع تعزيز الأمان
    - تحتاج إلى إعداد معزول بجدار حماية مع إمكانية الوصول عبر VPN
    - أنت تنشر على خوادم Debian/Ubuntu بعيدة
summary: تثبيت OpenClaw مؤتمت ومُحصّن باستخدام Ansible وشبكة Tailscale VPN وعزل جدار الحماية
title: أنسيبل
x-i18n:
    generated_at: "2026-07-12T05:58:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

انشر OpenClaw على خوادم الإنتاج باستخدام **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**، وهو مُثبّت آلي ذو بنية تضع الأمان في المقام الأول.

<Info>
يُعد مستودع [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) المصدر الموثوق لنشر Ansible. تقدم هذه الصفحة نظرة عامة سريعة.
</Info>

## المتطلبات الأساسية

| المتطلب     | التفاصيل                                                        |
| ----------- | --------------------------------------------------------------- |
| نظام التشغيل | Debian 11+ أو Ubuntu 20.04+                                     |
| الوصول      | صلاحيات الجذر أو `sudo`                                         |
| الشبكة      | اتصال بالإنترنت لتثبيت الحزم                                    |
| Ansible     | الإصدار 2.14+ (يثبّته تلقائيًا برنامج البدء السريع النصي)        |

## ما الذي ستحصل عليه

- أمان يبدأ بجدار الحماية: عزل UFW وDocker (لا يمكن الوصول إلا إلى SSH وTailscale)
- شبكة Tailscale الافتراضية الخاصة للوصول عن بُعد دون تعريض الخدمات للعامة
- Docker لحاويات بيئة الاختبار المعزولة ذات الارتباطات المحلية فقط
- تكامل مع systemd يتضمن تعزيز الأمان وبدء التشغيل تلقائيًا عند إقلاع النظام
- إعداد بأمر واحد

## البدء السريع

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## ما الذي يُثبَّت

1. Tailscale (شبكة افتراضية خاصة شبكية للوصول الآمن عن بُعد)
2. جدار حماية UFW (منافذ SSH وTailscale فقط)
3. Docker CE وCompose V2 (الواجهة الخلفية الافتراضية لبيئة اختبار الوكيل المعزولة)
4. Node.js وpnpm (يتطلب OpenClaw الإصدار Node 22.19+ أو 23.11+؛ ويوصى بالإصدار Node 24)
5. OpenClaw، مُثبّتًا مباشرةً على المضيف وليس داخل حاوية
6. خدمة systemd مع تعزيزات أمنية

<Note>
يعمل Gateway مباشرةً على المضيف، وليس داخل Docker. عزل الوكيل في بيئة اختبار
اختياري؛ يثبّت دليل التشغيل هذا Docker لأنه الواجهة الخلفية الافتراضية لبيئة
الاختبار المعزولة. راجع [العزل في بيئة اختبار](/ar/gateway/sandboxing) للتعرف على الواجهات الخلفية الأخرى.
</Note>

## الإعداد بعد التثبيت

<Steps>
  <Step title="التبديل إلى مستخدم openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="تشغيل معالج الإعداد الأولي">
    يرشدك البرنامج النصي لما بعد التثبيت خلال تهيئة OpenClaw.
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

# تسجيل الدخول إلى قناة (شغّله بصفة مستخدم openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## البنية الأمنية

نموذج دفاع مكوّن من أربع طبقات:

1. جدار الحماية (UFW): لا يُعرَّض للعامة إلا SSH ‏(22) وTailscale ‏(41641/udp)
2. الشبكة الافتراضية الخاصة (Tailscale): لا يمكن الوصول إلى Gateway إلا عبر شبكة VPN الشبكية
3. عزل Docker: تمنع سلسلة iptables المسماة `DOCKER-USER` تعريض المنافذ خارجيًا
4. تعزيز أمان systemd: ‏`NoNewPrivileges` و`PrivateTmp` ومستخدم غير ذي امتيازات

تحقق من سطح الهجوم الخارجي لخادمك:

```bash
nmap -p- YOUR_SERVER_IP
```

يجب ألا يكون مفتوحًا سوى المنفذ 22 ‏(SSH). يظل Gateway وDocker محميَّين من الوصول.

يُثبَّت Docker لبيئات اختبار الوكلاء المعزولة (تنفيذ الأدوات في بيئة معزولة)، وليس لتشغيل Gateway. راجع [بيئة الاختبار المعزولة متعددة الوكلاء والأدوات](/ar/tools/multi-agent-sandbox-tools) لتهيئة بيئة الاختبار المعزولة.

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

    أو شغّل دليل التشغيل مباشرةً ثم شغّل برنامج الإعداد النصي يدويًا:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # ثم شغّل: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## التحديث

يُعِد مُثبّت Ansible نظام OpenClaw للتحديثات اليدوية؛ راجع [التحديث](/ar/install/updating) للاطلاع على المسار القياسي.

لإعادة تشغيل دليل التشغيل (على سبيل المثال، بعد تغييرات التهيئة):

```bash
cd openclaw-ansible
./run-playbook.sh
```

هذه العملية متكررة النتائج وآمنة للتشغيل عدة مرات.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="جدار الحماية يحظر اتصالي">
    - اتصل أولًا عبر شبكة Tailscale الافتراضية الخاصة؛ فبحسب التصميم لا يمكن الوصول إلى Gateway إلا بهذه الطريقة.
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
  <Accordion title="مشكلات بيئة اختبار Docker المعزولة">
    ```bash
    # التحقق من أن Docker قيد التشغيل
    sudo systemctl status docker

    # التحقق من صورة بيئة الاختبار المعزولة
    sudo docker images | grep openclaw-sandbox

    # بناء صورة بيئة الاختبار المعزولة إذا كانت مفقودة (يتطلب نسخة عمل من المصدر)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # بالنسبة إلى عمليات تثبيت npm دون نسخة عمل من المصدر، راجع
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="فشل تسجيل الدخول إلى القناة">
    تأكد من أنك تشغّل الأوامر بصفة مستخدم `openclaw`:
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

## موضوعات ذات صلة

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): دليل النشر الكامل
- [Docker](/ar/install/docker): إعداد Gateway داخل حاوية
- [العزل في بيئة اختبار](/ar/gateway/sandboxing): تهيئة بيئة اختبار الوكيل المعزولة
- [بيئة الاختبار المعزولة متعددة الوكلاء والأدوات](/ar/tools/multi-agent-sandbox-tools): عزل كل وكيل على حدة
