---
read_when:
    - تريد نشرًا آليًا للخادم مع تعزيز الأمان
    - تحتاج إلى إعداد معزول بجدار حماية مع إمكانية الوصول عبر شبكة خاصة افتراضية
    - تقوم بالنشر إلى خوادم Debian/Ubuntu بعيدة
summary: تثبيت OpenClaw مؤتمت ومحصّن باستخدام Ansible وTailscale VPN وعزل جدار الحماية
title: Ansible
x-i18n:
    generated_at: "2026-04-30T08:05:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# تثبيت Ansible

انشر OpenClaw على خوادم الإنتاج باستخدام **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- مثبّت آلي ببنية تضع الأمان أولاً.

<Info>
مستودع [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) هو مصدر الحقيقة لنشر Ansible. هذه الصفحة نظرة عامة سريعة.
</Info>

## المتطلبات الأساسية

| المتطلب | التفاصيل                                                   |
| ----------- | --------------------------------------------------------- |
| **نظام التشغيل**      | Debian 11+ أو Ubuntu 20.04+                               |
| **الوصول**  | صلاحيات Root أو sudo                                   |
| **الشبكة** | اتصال بالإنترنت لتثبيت الحزم              |
| **Ansible** | 2.14+ (يُثبّت تلقائياً بواسطة سكربت البدء السريع) |

## ما الذي تحصل عليه

- **أمان يبدأ بجدار الحماية** -- UFW + عزل Docker (يمكن الوصول فقط إلى SSH + Tailscale)
- **Tailscale VPN** -- وصول آمن عن بعد دون كشف الخدمات علناً
- **Docker** -- حاويات sandbox معزولة، وارتباطات localhost فقط
- **دفاع معمق** -- بنية أمان من 4 طبقات
- **تكامل Systemd** -- بدء تلقائي عند الإقلاع مع تعزيز الأمان
- **إعداد بأمر واحد** -- نشر كامل في دقائق

## البدء السريع

تثبيت بأمر واحد:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## ما الذي يتم تثبيته

يثبّت دليل تشغيل Ansible ويضبط:

1. **Tailscale** -- VPN شبكية للوصول الآمن عن بعد
2. **جدار حماية UFW** -- منافذ SSH + Tailscale فقط
3. **Docker CE + Compose V2** -- لواجهة sandbox الافتراضية الخاصة بالوكيل
4. **Node.js 24 + pnpm** -- تبعيات وقت التشغيل (Node 22 LTS، حالياً `22.14+`، لا يزال مدعوماً)
5. **OpenClaw** -- قائم على المضيف، وليس داخل حاوية
6. **خدمة Systemd** -- بدء تلقائي مع تعزيز الأمان

<Note>
يعمل Gateway مباشرة على المضيف (وليس في Docker). عزل sandbox للوكلاء
اختياري؛ يثبّت دليل التشغيل هذا Docker لأنه واجهة sandbox
الافتراضية. راجع [Sandboxing](/ar/gateway/sandboxing) للتفاصيل والواجهات الأخرى.
</Note>

## إعداد ما بعد التثبيت

<Steps>
  <Step title="التبديل إلى مستخدم openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="تشغيل معالج الإعداد الأولي">
    يرشدك سكربت ما بعد التثبيت خلال ضبط إعدادات OpenClaw.
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

1. **جدار الحماية (UFW)** -- لا يُكشف علناً إلا SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- لا يمكن الوصول إلى Gateway إلا عبر شبكة VPN الشبكية
3. **عزل Docker** -- تمنع سلسلة DOCKER-USER في iptables كشف المنافذ خارجياً
4. **تعزيز Systemd** -- NoNewPrivileges وPrivateTmp ومستخدم بلا امتيازات

للتحقق من سطح الهجوم الخارجي لديك:

```bash
nmap -p- YOUR_SERVER_IP
```

ينبغي أن يكون المنفذ 22 (SSH) فقط مفتوحاً. جميع الخدمات الأخرى (Gateway وDocker) مقفلة.

يُثبّت Docker لصناديق sandbox الخاصة بالوكلاء (تنفيذ أدوات معزول)، وليس لتشغيل Gateway نفسه. راجع [Multi-Agent Sandbox and Tools](/ar/tools/multi-agent-sandbox-tools) لضبط sandbox.

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
  <Step title="تشغيل دليل التشغيل">
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

يضبط مثبّت Ansible إعداد OpenClaw للتحديثات اليدوية. راجع [التحديث](/ar/install/updating) لمعرفة مسار التحديث القياسي.

لإعادة تشغيل دليل تشغيل Ansible (على سبيل المثال، لتغييرات الضبط):

```bash
cd openclaw-ansible
./run-playbook.sh
```

هذا الإجراء idempotent وآمن للتشغيل عدة مرات.

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

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="فشل تسجيل الدخول إلى المزوّد">
    تأكد من أنك تعمل كمستخدم `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## الضبط المتقدم

للحصول على تفاصيل بنية الأمان واستكشاف الأخطاء وإصلاحها، راجع مستودع openclaw-ansible:

- [بنية الأمان](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [التفاصيل التقنية](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [دليل استكشاف الأخطاء وإصلاحها](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## ذات صلة

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- دليل النشر الكامل
- [Docker](/ar/install/docker) -- إعداد Gateway داخل حاوية
- [Sandboxing](/ar/gateway/sandboxing) -- ضبط sandbox للوكيل
- [Multi-Agent Sandbox and Tools](/ar/tools/multi-agent-sandbox-tools) -- عزل لكل وكيل
