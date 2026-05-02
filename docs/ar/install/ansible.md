---
read_when:
    - تريد نشر الخادم تلقائيًا مع تعزيز الأمان
    - تحتاج إلى إعداد معزول بجدار حماية مع إمكانية الوصول عبر VPN.
    - أنت تنشر على خوادم Debian/Ubuntu بعيدة
summary: تثبيت OpenClaw مؤتمت ومعزّز الأمان باستخدام Ansible وTailscale VPN وعزل جدار الحماية
title: Ansible
x-i18n:
    generated_at: "2026-05-02T07:32:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 789763c82483f4eec0963f4dccb06f2daa22d470a5e69e275f38c70a00a10ba4
    source_path: install/ansible.md
    workflow: 16
---

# تثبيت Ansible

انشر OpenClaw على خوادم الإنتاج باستخدام **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- مثبّت مؤتمت ببنية تضع الأمان أولاً.

<Info>
مستودع [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) هو مصدر الحقيقة لنشر Ansible. هذه الصفحة نظرة عامة سريعة.
</Info>

## المتطلبات الأساسية

| المتطلب     | التفاصيل                                                  |
| ----------- | --------------------------------------------------------- |
| **نظام التشغيل** | Debian 11+ أو Ubuntu 20.04+                               |
| **الوصول**  | صلاحيات Root أو sudo                                      |
| **الشبكة** | اتصال بالإنترنت لتثبيت الحزم                              |
| **Ansible** | 2.14+ (يُثبّت تلقائياً بواسطة سكربت البدء السريع) |

## ما الذي ستحصل عليه

- **أمان يبدأ بجدار الحماية** -- عزل UFW + Docker (يمكن الوصول فقط إلى SSH + Tailscale)
- **Tailscale VPN** -- وصول آمن عن بُعد دون كشف الخدمات للعامة
- **Docker** -- حاويات sandbox معزولة، وروابط localhost فقط
- **دفاع متعدد الطبقات** -- بنية أمان من 4 طبقات
- **تكامل Systemd** -- بدء تلقائي عند الإقلاع مع تقوية أمنية
- **إعداد بأمر واحد** -- نشر كامل خلال دقائق

## البدء السريع

تثبيت بأمر واحد:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## ما الذي يتم تثبيته

يثبّت Ansible playbook ويهيّئ ما يلي:

1. **Tailscale** -- شبكة VPN متداخلة للوصول الآمن عن بُعد
2. **جدار حماية UFW** -- منافذ SSH + Tailscale فقط
3. **Docker CE + Compose V2** -- للواجهة الخلفية الافتراضية لـ agent sandbox
4. **Node.js 24 + pnpm** -- اعتماديات وقت التشغيل (Node 22 LTS، حالياً `22.14+`، لا يزال مدعوماً)
5. **OpenClaw** -- قائم على المضيف، وليس داخل حاوية
6. **خدمة Systemd** -- بدء تلقائي مع تقوية أمنية

<Note>
يعمل Gateway مباشرة على المضيف (وليس داخل Docker). عزل agent sandbox
اختياري؛ يثبّت هذا playbook Docker لأنه واجهة sandbox الخلفية
الافتراضية. راجع [Sandboxing](/ar/gateway/sandboxing) للتفاصيل والواجهات الخلفية الأخرى.
</Note>

## إعداد ما بعد التثبيت

<Steps>
  <Step title="التبديل إلى مستخدم openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="تشغيل معالج الإعداد الأولي">
    يرشدك سكربت ما بعد التثبيت خلال تهيئة إعدادات OpenClaw.
  </Step>
  <Step title="ربط مزودي المراسلة">
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
    انضم إلى شبكة VPN المتداخلة الخاصة بك للوصول الآمن عن بُعد.
  </Step>
</Steps>

### أوامر سريعة

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## بنية الأمان

يستخدم النشر نموذج دفاع من 4 طبقات:

1. **جدار الحماية (UFW)** -- يتم كشف SSH (22) + Tailscale (41641/udp) فقط للعامة
2. **VPN (Tailscale)** -- لا يمكن الوصول إلى Gateway إلا عبر شبكة VPN المتداخلة
3. **عزل Docker** -- تمنع سلسلة iptables المسماة DOCKER-USER كشف المنافذ خارجياً
4. **تقوية Systemd** -- NoNewPrivileges وPrivateTmp ومستخدم بلا امتيازات

للتحقق من سطح الهجوم الخارجي لديك:

```bash
nmap -p- YOUR_SERVER_IP
```

يجب أن يكون المنفذ 22 (SSH) فقط مفتوحاً. جميع الخدمات الأخرى (Gateway وDocker) مقفلة.

يُثبّت Docker من أجل agent sandboxes (تنفيذ الأدوات المعزول)، وليس لتشغيل Gateway نفسه. راجع [Multi-Agent Sandbox and Tools](/ar/tools/multi-agent-sandbox-tools) لتهيئة sandbox.

## التثبيت اليدوي

إذا كنت تفضّل التحكم اليدوي بدلاً من الأتمتة:

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
  <Step title="تشغيل playbook">
    ```bash
    ./run-playbook.sh
    ```

    بدلاً من ذلك، شغّله مباشرة ثم نفّذ سكربت الإعداد يدوياً بعد ذلك:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## التحديث

يضبط مثبّت Ansible إعداد OpenClaw للتحديثات اليدوية. راجع [التحديث](/ar/install/updating) لمسار التحديث القياسي.

لإعادة تشغيل Ansible playbook (على سبيل المثال، لتغييرات التهيئة):

```bash
cd openclaw-ansible
./run-playbook.sh
```

هذا متوافق مع التكرار وآمن للتشغيل عدة مرات.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="جدار الحماية يحظر اتصالي">
    - تأكد أولاً من إمكانية الوصول عبر Tailscale VPN
    - يُسمح دائماً بوصول SSH (المنفذ 22)
    - لا يمكن الوصول إلى Gateway إلا عبر Tailscale حسب التصميم

  </Accordion>
  <Accordion title="الخدمة لا تبدأ">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="مشكلات Docker sandbox">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing (requires source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="فشل تسجيل الدخول إلى المزود">
    تأكد من أنك تعمل كمستخدم `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## التهيئة المتقدمة

للحصول على بنية الأمان التفصيلية واستكشاف الأخطاء وإصلاحها، راجع مستودع openclaw-ansible:

- [بنية الأمان](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [التفاصيل التقنية](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [دليل استكشاف الأخطاء وإصلاحها](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## ذو صلة

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- دليل النشر الكامل
- [Docker](/ar/install/docker) -- إعداد Gateway داخل حاوية
- [Sandboxing](/ar/gateway/sandboxing) -- تهيئة agent sandbox
- [Multi-Agent Sandbox and Tools](/ar/tools/multi-agent-sandbox-tools) -- عزل لكل agent
