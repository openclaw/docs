---
read_when:
    - استقرار خودکار سرور همراه با سخت‌سازی امنیتی می‌خواهید
    - به راه‌اندازی ایزوله‌شده با فایروال و دارای دسترسی VPN نیاز دارید
    - در حال استقرار روی سرورهای راه دور Debian/Ubuntu هستید
summary: نصب خودکار و ایمن‌سازی‌شدهٔ OpenClaw با Ansible، شبکهٔ خصوصی مجازی Tailscale و جداسازی به‌وسیلهٔ دیوارهٔ آتش
title: Ansible
x-i18n:
    generated_at: "2026-07-16T16:34:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

OpenClaw را با **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**، یک نصب‌کننده خودکار با معماری امنیت‌محور، روی سرورهای عملیاتی مستقر کنید.

<Info>
مخزن [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) منبع معتبر استقرار با Ansible است. این صفحه مروری سریع ارائه می‌دهد.
</Info>

## پیش‌نیازها

| نیازمندی     | جزئیات                                                                  |
| ----------- | ----------------------------------------------------------------------- |
| سیستم‌عامل  | Debian 11+ یا Ubuntu 20.04+                                             |
| دسترسی      | امتیازهای root یا sudo                                                  |
| شبکه        | اتصال اینترنت برای نصب بسته‌ها                                         |
| Ansible     | 2.14+ (به‌طور خودکار توسط اسکریپت شروع سریع نصب می‌شود)                 |

## آنچه دریافت می‌کنید

- امنیت با اولویت فایروال: جداسازی UFW و Docker (فقط SSH و Tailscale قابل دسترسی هستند)
- VPN مبتنی بر Tailscale برای دسترسی از راه دور بدون قرار دادن سرویس‌ها در معرض دسترسی عمومی
- Docker برای کانتینرهای سندباکس ایزوله با اتصال‌های محدود به localhost
- یکپارچه‌سازی با systemd همراه با سخت‌سازی و راه‌اندازی خودکار هنگام بوت
- راه‌اندازی با یک فرمان

## شروع سریع

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## موارد نصب‌شده

1. Tailscale (VPN مش برای دسترسی امن از راه دور)
2. فایروال UFW (فقط درگاه‌های SSH و Tailscale)
3. Docker CE و Compose V2 (بک‌اند پیش‌فرض سندباکس عامل)
4. Node.js و pnpm (OpenClaw به Node 22.22.3+، 24.15+ یا 25.9+ نیاز دارد؛ Node 24 توصیه می‌شود)
5. OpenClaw که مستقیماً روی میزبان نصب می‌شود و کانتینری نیست
6. یک سرویس systemd با سخت‌سازی امنیتی

<Note>
Gateway مستقیماً روی میزبان اجرا می‌شود، نه در Docker. سندباکس‌سازی عامل
اختیاری است؛ این playbook، ‏Docker را نصب می‌کند زیرا بک‌اند پیش‌فرض سندباکس
است. برای سایر بک‌اندها به [سندباکس‌سازی](/fa/gateway/sandboxing) مراجعه کنید.
</Note>

## راه‌اندازی پس از نصب

<Steps>
  <Step title="تغییر کاربر به openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="اجرای راهنمای شروع به کار">
    اسکریپت پس از نصب، شما را در پیکربندی OpenClaw راهنمایی می‌کند.
  </Step>
  <Step title="اتصال کانال‌های پیام‌رسانی">
    وارد WhatsApp،‏ Telegram،‏ Discord یا Signal شوید:
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
    برای دسترسی امن از راه دور به شبکه مش VPN خود بپیوندید.
  </Step>
</Steps>

### فرمان‌های سریع

```bash
# بررسی وضعیت سرویس
sudo systemctl status openclaw

# مشاهده زنده گزارش‌ها
sudo journalctl -u openclaw -f

# راه‌اندازی مجدد Gateway
sudo systemctl restart openclaw

# ورود به کانال (به‌عنوان کاربر openclaw اجرا شود)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## معماری امنیتی

مدل دفاعی چهارلایه:

1. فایروال (UFW): فقط SSH (22) و Tailscale (41641/udp) در معرض دسترسی عمومی هستند
2. VPN ‏(Tailscale): ‏Gateway فقط از طریق شبکه مش VPN قابل دسترسی است
3. جداسازی Docker: زنجیره iptables ‏`DOCKER-USER` از قرار گرفتن درگاه‌ها در معرض دسترسی خارجی جلوگیری می‌کند
4. سخت‌سازی systemd: ‏`NoNewPrivileges`، ‏`PrivateTmp`، کاربر بدون امتیاز ویژه

سطح حمله خارجی خود را بررسی کنید:

```bash
nmap -p- YOUR_SERVER_IP
```

فقط درگاه 22 (SSH) باید باز باشد. Gateway و Docker همچنان قفل و محافظت‌شده می‌مانند.

Docker برای سندباکس‌های عامل (اجرای ایزوله ابزارها) نصب می‌شود، نه برای اجرای Gateway. برای پیکربندی سندباکس به [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) مراجعه کنید.

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

نصب‌کننده Ansible، ‏OpenClaw را برای به‌روزرسانی‌های دستی آماده می‌کند؛ برای روند استاندارد به [به‌روزرسانی](/fa/install/updating) مراجعه کنید.

برای اجرای مجدد playbook (برای مثال، پس از تغییرات پیکربندی):

```bash
cd openclaw-ansible
./run-playbook.sh
```

این فرایند هم‌توان است و می‌توان آن را چندین بار با ایمنی اجرا کرد.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="فایروال اتصال من را مسدود می‌کند">
    - ابتدا از طریق VPN ‏Tailscale متصل شوید؛ Gateway طبق طراحی فقط از این طریق قابل دسترسی است.
    - SSH (درگاه 22) همیشه مجاز است.

  </Accordion>
  <Accordion title="سرویس راه‌اندازی نمی‌شود">
    ```bash
    # بررسی گزارش‌ها
    sudo journalctl -u openclaw -n 100

    # بررسی مجوزها
    sudo ls -la /opt/openclaw

    # آزمایش راه‌اندازی دستی
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="مشکلات سندباکس Docker">
    ```bash
    # بررسی اجرای Docker
    sudo systemctl status docker

    # بررسی ایمیج سندباکس
    sudo docker images | grep openclaw-sandbox

    # ساخت ایمیج سندباکس در صورت نبود آن (به checkout کد منبع نیاز دارد)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # برای نصب‌های npm بدون checkout کد منبع، مراجعه کنید به
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

## مرتبط

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): راهنمای کامل استقرار
- [Docker](/fa/install/docker): راه‌اندازی کانتینری Gateway
- [سندباکس‌سازی](/fa/gateway/sandboxing): پیکربندی سندباکس عامل
- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools): جداسازی به‌ازای هر عامل
