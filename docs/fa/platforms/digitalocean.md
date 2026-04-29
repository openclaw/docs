---
read_when:
    - راه‌اندازی OpenClaw روی DigitalOcean
    - جست‌وجو برای میزبانی ارزان سرور مجازی خصوصی برای OpenClaw
summary: OpenClaw روی DigitalOcean (گزینهٔ سادهٔ سرور مجازی خصوصی پولی)
title: DigitalOcean (پلتفرم)
x-i18n:
    generated_at: "2026-04-29T23:09:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw روی DigitalOcean

## هدف

اجرای یک OpenClaw Gateway پایدار روی DigitalOcean با هزینه **$6 در ماه** (یا $4/mo با قیمت‌گذاری رزروشده).

اگر گزینه $0/month می‌خواهید و با ARM + راه‌اندازی مخصوص ارائه‌دهنده مشکلی ندارید، [راهنمای Oracle Cloud](/fa/install/oracle) را ببینید.

## مقایسه هزینه (۲۰۲۶)

| ارائه‌دهنده | پلن | مشخصات | قیمت/ماه | یادداشت‌ها |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | تا 4 OCPU، 24GB RAM | $0 | ARM، ظرفیت محدود / نکات خاص ثبت‌نام |
| Hetzner | CX22 | 2 vCPU، 4GB RAM | €3.79 (~$4) | ارزان‌ترین گزینه پولی |
| DigitalOcean | Basic | 1 vCPU، 1GB RAM | $6 | UI آسان، مستندات خوب |
| Vultr | Cloud Compute | 1 vCPU، 1GB RAM | $6 | موقعیت‌های مکانی زیاد |
| Linode | Nanode | 1 vCPU، 1GB RAM | $5 | اکنون بخشی از Akamai است |

**انتخاب ارائه‌دهنده:**

- DigitalOcean: ساده‌ترین تجربه کاربری + راه‌اندازی قابل پیش‌بینی (این راهنما)
- Hetzner: قیمت/کارایی خوب ([راهنمای Hetzner](/fa/install/hetzner) را ببینید)
- Oracle Cloud: می‌تواند $0/month باشد، اما حساس‌تر است و فقط ARM است ([راهنمای Oracle](/fa/install/oracle) را ببینید)

---

## پیش‌نیازها

- حساب DigitalOcean ([ثبت‌نام با $200 اعتبار رایگان](https://m.do.co/c/signup))
- جفت کلید SSH (یا آمادگی برای استفاده از احراز هویت با گذرواژه)
- حدود ۲۰ دقیقه

## 1) ساخت یک Droplet

<Warning>
از یک تصویر پایه تمیز استفاده کنید (Ubuntu 24.04 LTS). از تصاویر 1-click شخص ثالث Marketplace پرهیز کنید، مگر اینکه اسکریپت‌های راه‌اندازی و پیش‌فرض‌های فایروال آن‌ها را بررسی کرده باشید.
</Warning>

1. وارد [DigitalOcean](https://cloud.digitalocean.com/) شوید
2. روی **Create → Droplets** کلیک کنید
3. انتخاب کنید:
   - **Region:** نزدیک‌ترین منطقه به شما (یا کاربران شما)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo** (1 vCPU، 1GB RAM، 25GB SSD)
   - **Authentication:** کلید SSH (توصیه‌شده) یا گذرواژه
4. روی **Create Droplet** کلیک کنید
5. نشانی IP را یادداشت کنید

## 2) اتصال از طریق SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) نصب OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) اجرای Onboarding

```bash
openclaw onboard --install-daemon
```

جادوگر شما را در این موارد راهنمایی می‌کند:

- احراز هویت مدل (کلیدهای API یا OAuth)
- راه‌اندازی کانال (Telegram، WhatsApp، Discord و غیره)
- توکن Gateway (تولید خودکار)
- نصب daemon (systemd)

## 5) تأیید Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) دسترسی به Dashboard

Gateway به‌طور پیش‌فرض به loopback متصل می‌شود. برای دسترسی به Control UI:

**گزینه A: تونل SSH (توصیه‌شده)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**گزینه B: Tailscale Serve (HTTPS، فقط loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

باز کنید: `https://<magicdns>/`

یادداشت‌ها:

- Serve، Gateway را فقط loopback نگه می‌دارد و ترافیک Control UI/WebSocket را از طریق هدرهای هویت Tailscale احراز هویت می‌کند (احراز هویت بدون توکن فرض می‌کند میزبان Gateway مورد اعتماد است؛ APIهای HTTP از آن هدرهای Tailscale استفاده نمی‌کنند و در عوض از حالت عادی احراز هویت HTTP Gateway پیروی می‌کنند).
- برای الزام به اعتبارنامه‌های shared-secret صریح، به‌جای آن `gateway.auth.allowTailscale: false` را تنظیم کنید و از `gateway.auth.mode: "token"` یا `"password"` استفاده کنید.

**گزینه C: اتصال Tailnet (بدون Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

باز کنید: `http://<tailscale-ip>:18789` (توکن لازم است).

## 7) اتصال کانال‌های شما

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

برای ارائه‌دهنده‌های دیگر، [Channels](/fa/channels) را ببینید.

---

## بهینه‌سازی‌ها برای 1GB RAM

Droplet با قیمت $6 فقط 1GB RAM دارد. برای اجرای روان‌تر:

### افزودن swap (توصیه‌شده)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### استفاده از مدل سبک‌تر

اگر با OOM مواجه می‌شوید، این موارد را در نظر بگیرید:

- استفاده از مدل‌های مبتنی بر API (Claude، GPT) به‌جای مدل‌های محلی
- تنظیم `agents.defaults.model.primary` روی یک مدل کوچک‌تر

### پایش حافظه

```bash
free -h
htop
```

---

## پایداری

تمام state در این مسیرها قرار دارد:

- `~/.openclaw/` — `openclaw.json`، `auth-profiles.json` برای هر agent، state کانال/ارائه‌دهنده، و داده‌های session
- `~/.openclaw/workspace/` — workspace (SOUL.md، حافظه و غیره)

این‌ها پس از reboot باقی می‌مانند. به‌صورت دوره‌ای از آن‌ها پشتیبان بگیرید:

```bash
openclaw backup create
```

---

## جایگزین رایگان Oracle Cloud

Oracle Cloud نمونه‌های ARM با عنوان **Always Free** ارائه می‌دهد که به‌طور قابل‌توجهی از هر گزینه پولی اینجا قدرتمندتر هستند — با هزینه $0/month.

| چیزی که دریافت می‌کنید | مشخصات |
| ----------------- | ---------------------- |
| **4 OCPUs** | ARM Ampere A1 |
| **24GB RAM** | بیش از کافی |
| **200GB storage** | Block volume |
| **Forever free** | بدون هزینه کارت اعتباری |

**نکات احتیاطی:**

- ثبت‌نام می‌تواند حساس باشد (اگر ناموفق بود دوباره تلاش کنید)
- معماری ARM — بیشتر چیزها کار می‌کنند، اما برخی binaryها به buildهای ARM نیاز دارند

برای راهنمای کامل راه‌اندازی، [Oracle Cloud](/fa/install/oracle) را ببینید. برای نکات ثبت‌نام و عیب‌یابی فرایند enrollment، این [راهنمای جامعه](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) را ببینید.

---

## عیب‌یابی

### Gateway شروع به کار نمی‌کند

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### پورت از قبل در حال استفاده است

```bash
lsof -i :18789
kill <PID>
```

### کمبود حافظه

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## مرتبط

- [راهنمای Hetzner](/fa/install/hetzner) — ارزان‌تر، قدرتمندتر
- [نصب Docker](/fa/install/docker) — راه‌اندازی containerized
- [Tailscale](/fa/gateway/tailscale) — دسترسی امن از راه دور
- [Configuration](/fa/gateway/configuration) — مرجع کامل config
