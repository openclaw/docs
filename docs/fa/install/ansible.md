---
read_when:
    - به استقرار خودکار سرور همراه با سخت‌سازی امنیتی نیاز دارید
    - به راه‌اندازی ایزوله‌شده با فایروال و دسترسی شبکهٔ خصوصی مجازی نیاز دارید
    - در حال استقرار روی سرورهای راه‌دور Debian/Ubuntu هستید
summary: نصب خودکار و سخت‌سازی‌شده OpenClaw با Ansible، VPN Tailscale و جداسازی دیوار آتش
title: Ansible
x-i18n:
    generated_at: "2026-05-01T11:49:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 789763c82483f4eec0963f4dccb06f2daa22d470a5e69e275f38c70a00a10ba4
    source_path: install/ansible.md
    workflow: 16
---

# نصب Ansible

OpenClaw را با **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** روی سرورهای تولید مستقر کنید -- یک نصب‌کننده خودکار با معماری با اولویت امنیت.

<Info>
مخزن [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) مرجع اصلی برای استقرار Ansible است. این صفحه یک مرور سریع است.
</Info>

## پیش‌نیازها

| نیازمندی | جزئیات                                                   |
| ----------- | --------------------------------------------------------- |
| **سیستم‌عامل**      | Debian 11+ یا Ubuntu 20.04+                               |
| **دسترسی**  | امتیازهای Root یا sudo                                   |
| **شبکه** | اتصال اینترنت برای نصب بسته‌ها              |
| **Ansible** | 2.14+ (به‌صورت خودکار توسط اسکریپت شروع سریع نصب می‌شود) |

## آنچه دریافت می‌کنید

- **امنیت با اولویت فایروال** -- UFW + ایزوله‌سازی Docker (فقط SSH + Tailscale در دسترس است)
- **Tailscale VPN** -- دسترسی راه دور امن بدون عمومی‌کردن سرویس‌ها
- **Docker** -- کانتینرهای سندباکس ایزوله، اتصال‌ها فقط روی localhost
- **دفاع چندلایه** -- معماری امنیتی ۴ لایه
- **یکپارچه‌سازی Systemd** -- شروع خودکار هنگام بوت با سخت‌سازی امنیتی
- **راه‌اندازی با یک دستور** -- استقرار کامل در چند دقیقه

## شروع سریع

نصب با یک دستور:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## چه چیزهایی نصب می‌شود

پلی‌بوک Ansible این موارد را نصب و پیکربندی می‌کند:

1. **Tailscale** -- VPN مش برای دسترسی راه دور امن
2. **فایروال UFW** -- فقط پورت‌های SSH + Tailscale
3. **Docker CE + Compose V2** -- برای بک‌اند پیش‌فرض سندباکس عامل
4. **Node.js 24 + pnpm** -- وابستگی‌های زمان اجرا (Node 22 LTS، در حال حاضر `22.14+`، همچنان پشتیبانی می‌شود)
5. **OpenClaw** -- مبتنی بر میزبان، نه کانتینری
6. **سرویس Systemd** -- شروع خودکار با سخت‌سازی امنیتی

<Note>
Gateway مستقیماً روی میزبان اجرا می‌شود (نه در Docker). سندباکس‌کردن عامل
اختیاری است؛ این پلی‌بوک Docker را نصب می‌کند چون بک‌اند پیش‌فرض سندباکس
است. برای جزئیات و بک‌اندهای دیگر، [سندباکس‌کردن](/fa/gateway/sandboxing) را ببینید.
</Note>

## راه‌اندازی پس از نصب

<Steps>
  <Step title="Switch to the openclaw user">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Run the onboarding wizard">
    اسکریپت پس از نصب شما را در پیکربندی تنظیمات OpenClaw راهنمایی می‌کند.
  </Step>
  <Step title="Connect messaging providers">
    به WhatsApp، Telegram، Discord یا Signal وارد شوید:
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
    برای دسترسی راه دور امن، به مش VPN خود بپیوندید.
  </Step>
</Steps>

### دستورهای سریع

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
3. **ایزوله‌سازی Docker** -- زنجیره iptables به نام DOCKER-USER از در معرض قرار گرفتن پورت‌های خارجی جلوگیری می‌کند
4. **سخت‌سازی Systemd** -- NoNewPrivileges، PrivateTmp، کاربر بدون امتیاز

برای بررسی سطح حمله خارجی خود:

```bash
nmap -p- YOUR_SERVER_IP
```

فقط پورت 22 (SSH) باید باز باشد. همه سرویس‌های دیگر (Gateway، Docker) قفل شده‌اند.

Docker برای سندباکس‌های عامل (اجرای ابزار ایزوله) نصب می‌شود، نه برای اجرای خود Gateway. برای پیکربندی سندباکس، [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) را ببینید.

## نصب دستی

اگر کنترل دستی را به خودکارسازی ترجیح می‌دهید:

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

    همچنین می‌توانید آن را مستقیماً اجرا کنید و سپس اسکریپت راه‌اندازی را به‌صورت دستی اجرا کنید:
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

این کار idempotent است و اجرای چندباره آن امن است.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Firewall blocks my connection">
    - ابتدا مطمئن شوید می‌توانید از طریق Tailscale VPN دسترسی داشته باشید
    - دسترسی SSH (پورت 22) همیشه مجاز است
    - Gateway طبق طراحی فقط از طریق Tailscale در دسترس است

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
    مطمئن شوید که به‌عنوان کاربر `openclaw` اجرا می‌کنید:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## پیکربندی پیشرفته

برای معماری امنیتی و عیب‌یابی تفصیلی، مخزن openclaw-ansible را ببینید:

- [معماری امنیتی](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [جزئیات فنی](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [راهنمای عیب‌یابی](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## مرتبط

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- راهنمای کامل استقرار
- [Docker](/fa/install/docker) -- راه‌اندازی Gateway کانتینری
- [سندباکس‌کردن](/fa/gateway/sandboxing) -- پیکربندی سندباکس عامل
- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- ایزوله‌سازی برای هر عامل
