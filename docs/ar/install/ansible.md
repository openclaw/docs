---
read_when:
    - تريد نشرًا آليًا للخادم مع تعزيز الأمان
    - تحتاج إلى إعداد معزول بجدار ناري مع وصول عبر VPN
    - أنت تنشر إلى خوادم Debian/Ubuntu بعيدة
summary: تثبيت OpenClaw مؤتمت ومحصّن باستخدام Ansible وTailscale VPN وعزل جدار الحماية
title: Ansible
x-i18n:
    generated_at: "2026-06-27T17:49:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03eb6f40139d7e154eee92a7a1a67471da90b128cc90daf86fbc87e383a5297c
    source_path: install/ansible.md
    workflow: 16
---

انشر OpenClaw على خوادم الإنتاج باستخدام **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- مثبّت آلي ببنية تعطي الأولوية للأمان.

<Info>
مستودع [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) هو مصدر الحقيقة لنشر Ansible. هذه الصفحة نظرة عامة سريعة.
</Info>

## المتطلبات الأساسية

| المتطلب | التفاصيل                                                   |
| ----------- | --------------------------------------------------------- |
| **نظام التشغيل**      | Debian 11+ أو Ubuntu 20.04+                               |
| **الوصول**  | صلاحيات root أو sudo                                   |
| **الشبكة** | اتصال بالإنترنت لتثبيت الحزم              |
| **Ansible** | 2.14+ (يثبّته سكربت البدء السريع تلقائيا) |

## ما الذي تحصل عليه

- **أمان يبدأ بجدار الحماية** -- عزل UFW + Docker (يمكن الوصول إلى SSH + Tailscale فقط)
- **Tailscale VPN** -- وصول آمن عن بعد من دون كشف الخدمات علنا
- **Docker** -- حاويات عزل منفصلة، وروابط إلى localhost فقط
- **دفاع متعدد الطبقات** -- بنية أمان من 4 طبقات
- **تكامل Systemd** -- بدء تلقائي عند الإقلاع مع التقوية الأمنية
- **إعداد بأمر واحد** -- نشر كامل في دقائق

## البدء السريع

تثبيت بأمر واحد:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## ما الذي يتم تثبيته

يثبّت دليل تشغيل Ansible ويضبط ما يلي:

1. **Tailscale** -- شبكة VPN شبكية للوصول الآمن عن بعد
2. **جدار حماية UFW** -- منافذ SSH + Tailscale فقط
3. **Docker CE + Compose V2** -- للواجهة الخلفية الافتراضية لعزل الوكيل
4. **Node.js 24 + pnpm** -- تبعيات وقت التشغيل (يبقى Node 22 LTS، حاليا `22.19+`، مدعوما)
5. **OpenClaw** -- مستند إلى المضيف، وليس داخل حاوية
6. **خدمة Systemd** -- بدء تلقائي مع تقوية أمنية

<Note>
يعمل Gateway مباشرة على المضيف (وليس في Docker). عزل الوكلاء
اختياري؛ يثبّت دليل التشغيل هذا Docker لأنه واجهة العزل الخلفية
الافتراضية. راجع [العزل](/ar/gateway/sandboxing) للتفاصيل والواجهات الخلفية الأخرى.
</Note>

## إعداد ما بعد التثبيت

<Steps>
  <Step title="Switch to the openclaw user">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Run the onboarding wizard">
    يرشدك سكربت ما بعد التثبيت خلال ضبط إعدادات OpenClaw.
  </Step>
  <Step title="Connect messaging providers">
    سجّل الدخول إلى WhatsApp أو Telegram أو Discord أو Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Verify the installation">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Connect to Tailscale">
    انضم إلى شبكة VPN الشبكية الخاصة بك للوصول الآمن عن بعد.
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

1. **جدار الحماية (UFW)** -- لا يُكشف علنا إلا SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- لا يمكن الوصول إلى Gateway إلا عبر شبكة VPN الشبكية
3. **عزل Docker** -- تمنع سلسلة iptables باسم DOCKER-USER كشف المنافذ الخارجية
4. **تقوية Systemd** -- NoNewPrivileges وPrivateTmp ومستخدم بلا امتيازات

للتحقق من سطح الهجوم الخارجي لديك:

```bash
nmap -p- YOUR_SERVER_IP
```

يجب أن يكون المنفذ 22 (SSH) فقط مفتوحا. جميع الخدمات الأخرى (Gateway وDocker) مقفلة.

يُثبّت Docker لعزل الوكلاء (تنفيذ الأدوات في بيئة معزولة)، وليس لتشغيل Gateway نفسه. راجع [عزل متعدد الوكلاء والأدوات](/ar/tools/multi-agent-sandbox-tools) لضبط العزل.

## التثبيت اليدوي

إذا كنت تفضّل التحكم اليدوي بدلا من الأتمتة:

<Steps>
  <Step title="Install prerequisites">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone the repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Install Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Run the playbook">
    ```bash
    ./run-playbook.sh
    ```

    بدلا من ذلك، شغّله مباشرة ثم نفّذ سكربت الإعداد يدويا بعد ذلك:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## التحديث

يضبط مثبّت Ansible OpenClaw للتحديثات اليدوية. راجع [التحديث](/ar/install/updating) لتدفق التحديث القياسي.

لإعادة تشغيل دليل تشغيل Ansible (على سبيل المثال، لتغييرات الضبط):

```bash
cd openclaw-ansible
./run-playbook.sh
```

هذا التكرار آمن ولا يغير إلا ما يلزم، ويمكن تشغيله عدة مرات.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="Firewall blocks my connection">
    - تأكد أولا من إمكانية الوصول عبر Tailscale VPN
    - الوصول عبر SSH (المنفذ 22) مسموح به دائما
    - لا يمكن الوصول إلى Gateway إلا عبر Tailscale حسب التصميم

  </Accordion>
  <Accordion title="Service will not start">
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
  <Accordion title="Docker sandbox issues">
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
  <Accordion title="Provider login fails">
    تأكد من أنك تعمل كمستخدم `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## الضبط المتقدم

للحصول على بنية الأمان التفصيلية واستكشاف الأخطاء وإصلاحها، راجع مستودع openclaw-ansible:

- [بنية الأمان](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [التفاصيل التقنية](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [دليل استكشاف الأخطاء وإصلاحها](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## ذات صلة

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- دليل النشر الكامل
- [Docker](/ar/install/docker) -- إعداد Gateway داخل حاوية
- [العزل](/ar/gateway/sandboxing) -- ضبط عزل الوكيل
- [عزل متعدد الوكلاء والأدوات](/ar/tools/multi-agent-sandbox-tools) -- عزل لكل وكيل
