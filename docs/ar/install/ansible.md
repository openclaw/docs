---
read_when:
    - تريد نشرًا آليًا للخادم مع تعزيز الأمان
    - تحتاج إلى إعداد معزول بجدار حماية مع وصول عبر VPN
    - أنت تنشر إلى خوادم Debian/Ubuntu بعيدة
summary: تثبيت OpenClaw آلي ومُحصَّن باستخدام Ansible وشبكة Tailscale الافتراضية الخاصة وعزل جدار الحماية
title: Ansible
x-i18n:
    generated_at: "2026-05-06T07:59:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7424e766619096f50fa0c83aa4e85e46adba11515b1871e58cf2406b7c8f815
    source_path: install/ansible.md
    workflow: 16
---

انشر OpenClaw على خوادم الإنتاج باستخدام **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- مثبّت آلي ببنية تعطي الأولوية للأمان.

<Info>
مستودع [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) هو مصدر الحقيقة لنشر Ansible. هذه الصفحة لمحة سريعة.
</Info>

## المتطلبات الأساسية

| المتطلب | التفاصيل                                                   |
| ----------- | --------------------------------------------------------- |
| **نظام التشغيل**      | Debian 11+ أو Ubuntu 20.04+                               |
| **الوصول**  | امتيازات root أو sudo                                   |
| **الشبكة** | اتصال بالإنترنت لتثبيت الحزم              |
| **Ansible** | 2.14+ (يثبّته سكربت البدء السريع تلقائيًا) |

## ما الذي ستحصل عليه

- **أمان يبدأ بالجدار الناري** -- عزل UFW + Docker (لا يمكن الوصول إلا إلى SSH + Tailscale)
- **Tailscale VPN** -- وصول آمن عن بُعد دون كشف الخدمات للعامة
- **Docker** -- حاويات sandbox معزولة، وارتباطات محلية فقط
- **الدفاع متعدد الطبقات** -- بنية أمان من 4 طبقات
- **تكامل Systemd** -- بدء تلقائي عند الإقلاع مع تقوية الأمان
- **إعداد بأمر واحد** -- نشر كامل خلال دقائق

## البدء السريع

تثبيت بأمر واحد:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## ما الذي يتم تثبيته

يثبّت دليل تشغيل Ansible ويهيّئ ما يلي:

1. **Tailscale** -- شبكة VPN شبكية للوصول الآمن عن بُعد
2. **جدار UFW الناري** -- منافذ SSH + Tailscale فقط
3. **Docker CE + Compose V2** -- للواجهة الخلفية الافتراضية لصندوق agent sandbox
4. **Node.js 24 + pnpm** -- تبعيات وقت التشغيل (يبقى Node 22 LTS، حاليًا `22.14+`، مدعومًا)
5. **OpenClaw** -- يعمل على المضيف، وليس داخل حاوية
6. **خدمة Systemd** -- بدء تلقائي مع تقوية الأمان

<Note>
يعمل Gateway مباشرة على المضيف (وليس في Docker). عزل agent sandbox
اختياري؛ يثبّت دليل التشغيل هذا Docker لأنه الواجهة الخلفية الافتراضية لصندوق sandbox.
راجع [Sandboxing](/ar/gateway/sandboxing) للتفاصيل والواجهات الخلفية الأخرى.
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
  <Step title="ربط مزوّدي المراسلة">
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
    انضم إلى شبكة VPN الشبكية الخاصة بك للوصول الآمن عن بُعد.
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

1. **الجدار الناري (UFW)** -- لا تُكشف للعامة إلا SSH (22) + Tailscale (41641/udp)
2. **VPN (Tailscale)** -- لا يمكن الوصول إلى Gateway إلا عبر شبكة VPN الشبكية
3. **عزل Docker** -- تمنع سلسلة iptables المسماة DOCKER-USER كشف المنافذ خارجيًا
4. **تقوية Systemd** -- NoNewPrivileges وPrivateTmp ومستخدم بلا امتيازات

للتحقق من سطح الهجوم الخارجي لديك:

```bash
nmap -p- YOUR_SERVER_IP
```

يجب أن يكون المنفذ 22 (SSH) وحده مفتوحًا. جميع الخدمات الأخرى (Gateway وDocker) مؤمّنة.

يُثبَّت Docker لصناديق agent sandbox (تنفيذ الأدوات المعزول)، وليس لتشغيل Gateway نفسه. راجع [Multi-Agent Sandbox and Tools](/ar/tools/multi-agent-sandbox-tools) لتهيئة sandbox.

## التثبيت اليدوي

إذا كنت تفضّل التحكم اليدوي بدلًا من الأتمتة:

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

    بدلاً من ذلك، شغّله مباشرة ثم نفّذ سكربت الإعداد يدويًا بعد ذلك:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## التحديث

يضبط مثبّت Ansible إعداد OpenClaw للتحديثات اليدوية. راجع [Updating](/ar/install/updating) لمسار التحديث القياسي.

لإعادة تشغيل دليل تشغيل Ansible (على سبيل المثال، لتغييرات التهيئة):

```bash
cd openclaw-ansible
./run-playbook.sh
```

هذا قابل للتكرار وآمن للتشغيل عدة مرات.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الجدار الناري يحظر اتصالي">
    - تأكد أولًا من قدرتك على الوصول عبر Tailscale VPN
    - يُسمح دائمًا بوصول SSH (المنفذ 22)
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
  <Accordion title="فشل تسجيل الدخول إلى المزوّد">
    تأكد من أنك تعمل بصفتك مستخدم `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## التهيئة المتقدمة

للحصول على بنية الأمان المفصلة واستكشاف الأخطاء وإصلاحها، راجع مستودع openclaw-ansible:

- [بنية الأمان](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [التفاصيل التقنية](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [دليل استكشاف الأخطاء وإصلاحها](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## ذو صلة

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- دليل النشر الكامل
- [Docker](/ar/install/docker) -- إعداد Gateway داخل حاوية
- [Sandboxing](/ar/gateway/sandboxing) -- تهيئة agent sandbox
- [Multi-Agent Sandbox and Tools](/ar/tools/multi-agent-sandbox-tools) -- عزل لكل agent
