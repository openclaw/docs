---
read_when:
    - استقرار خودکار سرور را همراه با سخت‌سازی امنیتی می‌خواهید
    - به راه‌اندازی ایزوله‌شده با فایروال و دسترسی VPN نیاز دارید
    - در حال استقرار روی سرورهای Debian/Ubuntu راه‌دور هستید
summary: نصب خودکار و سخت‌سازی‌شدهٔ OpenClaw با Ansible، VPN ‏Tailscale و جداسازی فایروال
title: Ansible
x-i18n:
    generated_at: "2026-05-07T13:24:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f7a2a0c575529fd45804e160299239339100ec37979a17162cee9537ddb4653
    source_path: install/ansible.md
    workflow: 16
---

OpenClaw را با **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** روی سرورهای تولید مستقر کنید -- یک نصب‌کننده خودکار با معماری امنیت‌محور.

<Info>
مخزن [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) منبع حقیقت برای استقرار Ansible است. این صفحه یک مرور سریع است.
</Info>

## پیش‌نیازها

| نیازمندی | جزئیات                                                   |
| ----------- | --------------------------------------------------------- |
| **سیستم‌عامل**      | Debian 11+ یا Ubuntu 20.04+                               |
| **دسترسی**  | دسترسی root یا امتیازهای sudo                                   |
| **شبکه** | اتصال اینترنت برای نصب بسته‌ها              |
| **Ansible** | 2.14+ (به‌صورت خودکار توسط اسکریپت شروع سریع نصب می‌شود) |

## چه چیزی دریافت می‌کنید

- **امنیت با اولویت فایروال** -- UFW + ایزوله‌سازی Docker (فقط SSH + Tailscale در دسترس)
- **Tailscale VPN** -- دسترسی راه دور امن بدون عمومی‌کردن سرویس‌ها
- **Docker** -- کانتینرهای سندباکس ایزوله، اتصال‌های فقط localhost
- **دفاع چندلایه** -- معماری امنیتی ۴ لایه
- **یکپارچه‌سازی با Systemd** -- شروع خودکار هنگام راه‌اندازی با سخت‌سازی امنیتی
- **راه‌اندازی با یک فرمان** -- استقرار کامل در چند دقیقه

## شروع سریع

نصب با یک فرمان:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## چه چیزهایی نصب می‌شود

پلی‌بوک Ansible این موارد را نصب و پیکربندی می‌کند:

1. **Tailscale** -- VPN مش برای دسترسی راه دور امن
2. **فایروال UFW** -- فقط پورت‌های SSH + Tailscale
3. **Docker CE + Compose V2** -- برای بک‌اند پیش‌فرض سندباکس عامل
4. **Node.js 24 + pnpm** -- وابستگی‌های زمان اجرا (Node 22 LTS، در حال حاضر `22.16+`، همچنان پشتیبانی می‌شود)
5. **OpenClaw** -- مبتنی بر میزبان، نه کانتینری‌شده
6. **سرویس Systemd** -- شروع خودکار با سخت‌سازی امنیتی

<Note>
Gateway مستقیما روی میزبان اجرا می‌شود (نه در Docker). سندباکس‌کردن عامل
اختیاری است؛ این پلی‌بوک Docker را نصب می‌کند چون بک‌اند سندباکس
پیش‌فرض است. برای جزئیات و بک‌اندهای دیگر، [سندباکس‌کردن](/fa/gateway/sandboxing) را ببینید.
</Note>

## راه‌اندازی پس از نصب

<Steps>
  <Step title="به کاربر openclaw بروید">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="ویزارد آغاز به کار را اجرا کنید">
    اسکریپت پس از نصب شما را در پیکربندی تنظیمات OpenClaw راهنمایی می‌کند.
  </Step>
  <Step title="ارائه‌دهندگان پیام‌رسانی را وصل کنید">
    به WhatsApp، Telegram، Discord یا Signal وارد شوید:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="نصب را بررسی کنید">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="به Tailscale وصل شوید">
    برای دسترسی راه دور امن، به مش VPN خود بپیوندید.
  </Step>
</Steps>

### فرمان‌های سریع

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

## معماری امنیتی

استقرار از یک مدل دفاعی ۴ لایه استفاده می‌کند:

1. **فایروال (UFW)** -- فقط SSH (22) + Tailscale (41641/udp) به‌صورت عمومی در معرض دسترس است
2. **VPN (Tailscale)** -- Gateway فقط از طریق مش VPN در دسترس است
3. **ایزوله‌سازی Docker** -- زنجیره iptables با نام DOCKER-USER از در معرض قرار گرفتن پورت‌های خارجی جلوگیری می‌کند
4. **سخت‌سازی Systemd** -- NoNewPrivileges، PrivateTmp، کاربر بدون امتیاز

برای بررسی سطح حمله خارجی خود:

```bash
nmap -p- YOUR_SERVER_IP
```

فقط پورت 22 (SSH) باید باز باشد. همه سرویس‌های دیگر (Gateway، Docker) قفل شده‌اند.

Docker برای سندباکس‌های عامل نصب می‌شود (اجرای ایزوله ابزار)، نه برای اجرای خود Gateway. برای پیکربندی سندباکس، [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) را ببینید.

## نصب دستی

اگر کنترل دستی را به خودکارسازی ترجیح می‌دهید:

<Steps>
  <Step title="پیش‌نیازها را نصب کنید">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="مخزن را کلون کنید">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="کالکشن‌های Ansible را نصب کنید">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="پلی‌بوک را اجرا کنید">
    ```bash
    ./run-playbook.sh
    ```

    در روش دیگر، مستقیما اجرا کنید و سپس اسکریپت راه‌اندازی را بعدا به‌صورت دستی اجرا کنید:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## به‌روزرسانی

نصب‌کننده Ansible، OpenClaw را برای به‌روزرسانی‌های دستی آماده می‌کند. برای جریان استاندارد به‌روزرسانی، [به‌روزرسانی](/fa/install/updating) را ببینید.

برای اجرای دوباره پلی‌بوک Ansible (برای مثال، برای تغییرات پیکربندی):

```bash
cd openclaw-ansible
./run-playbook.sh
```

این فرایند idempotent است و اجرای چندباره آن امن است.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="فایروال اتصال من را مسدود می‌کند">
    - مطمئن شوید ابتدا می‌توانید از طریق Tailscale VPN دسترسی داشته باشید
    - دسترسی SSH (پورت 22) همیشه مجاز است
    - Gateway طبق طراحی فقط از طریق Tailscale در دسترس است

  </Accordion>
  <Accordion title="سرویس شروع نمی‌شود">
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
  <Accordion title="مشکلات سندباکس Docker">
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
  <Accordion title="ورود ارائه‌دهنده ناموفق است">
    مطمئن شوید به‌عنوان کاربر `openclaw` اجرا می‌کنید:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## پیکربندی پیشرفته

برای معماری امنیتی دقیق و عیب‌یابی، مخزن openclaw-ansible را ببینید:

- [معماری امنیتی](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [جزئیات فنی](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [راهنمای عیب‌یابی](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## مرتبط

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- راهنمای کامل استقرار
- [Docker](/fa/install/docker) -- راه‌اندازی Gateway کانتینری‌شده
- [سندباکس‌کردن](/fa/gateway/sandboxing) -- پیکربندی سندباکس عامل
- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- ایزوله‌سازی برای هر عامل
