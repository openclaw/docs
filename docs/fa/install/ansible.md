---
read_when:
    - می‌خواهید استقرار خودکار سرور را همراه با مقاوم‌سازی امنیتی انجام دهید
    - به راه‌اندازی ایزوله‌شده با فایروال و دارای دسترسی VPN نیاز دارید
    - شما در حال استقرار روی سرورهای راه‌دور Debian/Ubuntu هستید
summary: نصب خودکار و ایمن‌سازی‌شده OpenClaw با Ansible، شبکه خصوصی مجازی Tailscale و جداسازی دیوار آتش
title: Ansible
x-i18n:
    generated_at: "2026-07-12T10:09:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

OpenClaw را با **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**، یک نصب‌کنندهٔ خودکار با معماری امنیت‌محور، روی سرورهای عملیاتی مستقر کنید.

<Info>
مخزن [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) مرجع اصلی استقرار با Ansible است. این صفحه یک مرور سریع ارائه می‌دهد.
</Info>

## پیش‌نیازها

| نیازمندی | جزئیات                                                   |
| ----------- | --------------------------------------------------------- |
| سیستم‌عامل          | Debian 11+ یا Ubuntu 20.04+                               |
| دسترسی      | دسترسی‌های root یا sudo                                   |
| شبکه     | اتصال اینترنت برای نصب بسته‌ها              |
| Ansible     | نسخهٔ 2.14+ (به‌طور خودکار توسط اسکریپت شروع سریع نصب می‌شود) |

## آنچه دریافت می‌کنید

- امنیت مبتنی بر دیوار آتش: UFW + جداسازی Docker (فقط SSH + Tailscale در دسترس هستند)
- VPN مبتنی بر Tailscale برای دسترسی از راه دور بدون در معرض عموم قرار دادن سرویس‌ها
- Docker برای کانتینرهای sandbox ایزوله با اتصال فقط به localhost
- یکپارچه‌سازی با systemd همراه با مقاوم‌سازی و راه‌اندازی خودکار هنگام بوت
- راه‌اندازی با یک فرمان

## شروع سریع

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## موارد نصب‌شده

1. Tailscale (VPN مش برای دسترسی امن از راه دور)
2. دیوار آتش UFW (فقط درگاه‌های SSH + Tailscale)
3. Docker CE + Compose V2 (بک‌اند پیش‌فرض sandbox عامل)
4. Node.js و pnpm (OpenClaw به Node 22.19+ یا 23.11+ نیاز دارد؛ Node 24 توصیه می‌شود)
5. OpenClaw که مستقیماً روی میزبان نصب می‌شود، نه در کانتینر
6. یک سرویس systemd با مقاوم‌سازی امنیتی

<Note>
Gateway مستقیماً روی میزبان اجرا می‌شود، نه در Docker. sandbox کردن عامل
اختیاری است؛ این playbook به این دلیل Docker را نصب می‌کند که بک‌اند پیش‌فرض
sandbox است. برای بک‌اندهای دیگر به [Sandbox کردن](/fa/gateway/sandboxing) مراجعه کنید.
</Note>

## راه‌اندازی پس از نصب

<Steps>
  <Step title="تغییر به کاربر openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="اجرای راهنمای راه‌اندازی اولیه">
    اسکریپت پس از نصب شما را در پیکربندی OpenClaw راهنمایی می‌کند.
  </Step>
  <Step title="اتصال کانال‌های پیام‌رسانی">
    وارد WhatsApp، Telegram، Discord یا Signal شوید:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="تأیید نصب">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="اتصال به Tailscale">
    برای دسترسی امن از راه دور به شبکهٔ مش VPN خود بپیوندید.
  </Step>
</Steps>

### فرمان‌های سریع

```bash
# بررسی وضعیت سرویس
sudo systemctl status openclaw

# مشاهدهٔ زندهٔ گزارش‌ها
sudo journalctl -u openclaw -f

# راه‌اندازی مجدد Gateway
sudo systemctl restart openclaw

# ورود به کانال (به‌عنوان کاربر openclaw اجرا شود)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## معماری امنیتی

مدل دفاعی چهارلایه:

1. دیوار آتش (UFW): فقط SSH (22) و Tailscale (41641/udp) در معرض دسترسی عمومی قرار دارند
2. VPN (Tailscale): Gateway فقط از طریق شبکهٔ مش VPN قابل دسترسی است
3. جداسازی Docker: زنجیرهٔ iptables با نام `DOCKER-USER` از در معرض قرار گرفتن درگاه‌ها برای دسترسی خارجی جلوگیری می‌کند
4. مقاوم‌سازی systemd: `NoNewPrivileges`، `PrivateTmp`، کاربر بدون امتیاز ویژه

سطح حملهٔ خارجی خود را بررسی کنید:

```bash
nmap -p- YOUR_SERVER_IP
```

فقط درگاه 22 (SSH) باید باز باشد. Gateway و Docker محدود و محافظت‌شده باقی می‌مانند.

Docker برای sandboxهای عامل (اجرای ایزولهٔ ابزارها) نصب می‌شود، نه برای اجرای Gateway. برای پیکربندی sandbox به [Sandbox و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) مراجعه کنید.

## نصب دستی

<Steps>
  <Step title="نصب پیش‌نیازها">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="همانندسازی مخزن">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="نصب مجموعه‌های Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="اجرای playbook">
    ```bash
    ./run-playbook.sh
    ```

    یا playbook را مستقیماً اجرا کنید و سپس اسکریپت راه‌اندازی را به‌صورت دستی اجرا کنید:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # سپس اجرا کنید: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## به‌روزرسانی

نصب‌کنندهٔ Ansible، OpenClaw را برای به‌روزرسانی دستی آماده می‌کند؛ برای روند استاندارد به [به‌روزرسانی](/fa/install/updating) مراجعه کنید.

برای اجرای دوبارهٔ playbook (برای مثال، پس از تغییرات پیکربندی):

```bash
cd openclaw-ansible
./run-playbook.sh
```

این عملیات ایدمپوتنت است و می‌توان آن را چندین بار با خیال آسوده اجرا کرد.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="دیوار آتش اتصال من را مسدود می‌کند">
    - ابتدا از طریق VPN مبتنی بر Tailscale متصل شوید؛ Gateway طبق طراحی فقط از این طریق قابل دسترسی است.
    - SSH (درگاه 22) همیشه مجاز است.

  </Accordion>
  <Accordion title="سرویس راه‌اندازی نمی‌شود">
    ```bash
    # بررسی گزارش‌ها
    sudo journalctl -u openclaw -n 100

    # تأیید مجوزها
    sudo ls -la /opt/openclaw

    # آزمایش راه‌اندازی دستی
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="مشکلات sandbox در Docker">
    ```bash
    # بررسی اجرای Docker
    sudo systemctl status docker

    # بررسی تصویر sandbox
    sudo docker images | grep openclaw-sandbox

    # ساخت تصویر sandbox در صورت نبودن آن (به یک نسخهٔ وارسی‌شده از کد منبع نیاز دارد)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # برای نصب‌های npm بدون نسخهٔ وارسی‌شده از کد منبع، مراجعه کنید به
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="ورود به کانال ناموفق است">
    مطمئن شوید که به‌عنوان کاربر `openclaw` اجرا می‌کنید:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## پیکربندی پیشرفته

برای معماری امنیتی و عیب‌یابی تفصیلی، به مخزن openclaw-ansible مراجعه کنید:

- [معماری امنیتی](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [جزئیات فنی](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [راهنمای عیب‌یابی](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## مطالب مرتبط

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): راهنمای کامل استقرار
- [Docker](/fa/install/docker): راه‌اندازی کانتینری Gateway
- [Sandbox کردن](/fa/gateway/sandboxing): پیکربندی sandbox عامل
- [Sandbox و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools): جداسازی برای هر عامل
