---
read_when:
    - راه‌اندازی OpenClaw در Oracle Cloud
    - جست‌وجوی میزبانی VPS کم‌هزینه برای OpenClaw
    - می‌خواهید OpenClaw را به‌صورت ۲۴/۷ روی یک سرور کوچک اجرا کنید
summary: OpenClaw روی Oracle Cloud (ARM همیشه رایگان)
title: Oracle Cloud (پلتفرم)
x-i18n:
    generated_at: "2026-04-29T23:13:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw روی Oracle Cloud (OCI)

## هدف

اجرای یک OpenClaw Gateway پایدار روی لایه ARM **Always Free** در Oracle Cloud.

لایه رایگان Oracle می‌تواند گزینه‌ای عالی برای OpenClaw باشد (به‌ویژه اگر از قبل حساب OCI دارید)، اما با چند مصالحه همراه است:

- معماری ARM (بیشتر چیزها کار می‌کنند، اما برخی باینری‌ها ممکن است فقط x86 باشند)
- ظرفیت و ثبت‌نام می‌تواند دردسرساز باشد

## مقایسه هزینه (2026)

| ارائه‌دهنده | طرح | مشخصات | قیمت/ماه | نکته‌ها |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | تا 4 OCPU، 24GB RAM | $0 | ARM، ظرفیت محدود |
| Hetzner | CX22 | 2 vCPU، 4GB RAM | ~ $4 | ارزان‌ترین گزینه پولی |
| DigitalOcean | Basic | 1 vCPU، 1GB RAM | $6 | رابط کاربری آسان، مستندات خوب |
| Vultr | Cloud Compute | 1 vCPU، 1GB RAM | $6 | موقعیت‌های زیاد |
| Linode | Nanode | 1 vCPU، 1GB RAM | $5 | اکنون بخشی از Akamai است |

---

## پیش‌نیازها

- حساب Oracle Cloud ([ثبت‌نام](https://www.oracle.com/cloud/free/)) — اگر به مشکل خوردید، [راهنمای ثبت‌نام جامعه](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) را ببینید
- حساب Tailscale (رایگان در [tailscale.com](https://tailscale.com))
- حدود 30 دقیقه

## 1) ساخت یک نمونه OCI

1. وارد [Oracle Cloud Console](https://cloud.oracle.com/) شوید
2. به **Compute → Instances → Create Instance** بروید
3. پیکربندی کنید:
   - **نام:** `openclaw`
   - **ایمیج:** Ubuntu 24.04 (aarch64)
   - **شکل:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUها:** 2 (یا تا 4)
   - **حافظه:** 12 GB (یا تا 24 GB)
   - **حجم بوت:** 50 GB (تا 200 GB رایگان)
   - **کلید SSH:** کلید عمومی خود را اضافه کنید
4. روی **Create** کلیک کنید
5. آدرس IP عمومی را یادداشت کنید

**نکته:** اگر ساخت نمونه با پیام «کمبود ظرفیت» ناموفق شد، یک دامنه دسترسی دیگر را امتحان کنید یا بعداً دوباره تلاش کنید. ظرفیت لایه رایگان محدود است.

## 2) اتصال و به‌روزرسانی

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**یادداشت:** `build-essential` برای کامپایل ARM برخی وابستگی‌ها لازم است.

## 3) پیکربندی کاربر و نام میزبان

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) نصب Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

این کار Tailscale SSH را فعال می‌کند، بنابراین می‌توانید از هر دستگاهی در tailnet خود با `ssh openclaw` وصل شوید — بدون نیاز به IP عمومی.

بررسی:

```bash
tailscale status
```

**از این به بعد، از طریق Tailscale وصل شوید:** `ssh ubuntu@openclaw` (یا از IP Tailscale استفاده کنید).

## 5) نصب OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

وقتی پرسیده شد «می‌خواهید ربات خود را چطور از تخم بیرون بیاورید؟»، گزینه **«بعداً انجام بده»** را انتخاب کنید.

> یادداشت: اگر به مشکلات ساخت بومی ARM برخوردید، پیش از رفتن سراغ Homebrew، از بسته‌های سیستمی شروع کنید (مثلاً `sudo apt install -y build-essential`).

## 6) پیکربندی Gateway (loopback + احراز هویت توکنی) و فعال‌سازی Tailscale Serve

احراز هویت توکنی را به‌عنوان پیش‌فرض استفاده کنید. قابل پیش‌بینی است و نیاز به هیچ پرچم «احراز هویت ناامن» در Control UI ندارد.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` در اینجا فقط برای مدیریت IP فورواردشده/کلاینت محلیِ پراکسی محلی Tailscale Serve است. این **نیست** `gateway.auth.mode: "trusted-proxy"`. مسیرهای نمایشگر diff در این تنظیمات رفتار fail-closed را حفظ می‌کنند: درخواست‌های خام نمایشگر از `127.0.0.1` بدون سرآیندهای پراکسی فورواردشده می‌توانند `Diff not found` برگردانند. برای پیوست‌ها از `mode=file` / `mode=both` استفاده کنید، یا اگر به لینک‌های قابل اشتراک نمایشگر نیاز دارید، عمداً نمایشگرهای راه‌دور را فعال کنید و `plugins.entries.diffs.config.viewerBaseUrl` را تنظیم کنید (یا یک `baseUrl` پراکسی پاس بدهید).

## 7) بررسی

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) قفل‌کردن امنیت VCN

حالا که همه چیز کار می‌کند، VCN را قفل کنید تا همه ترافیک به‌جز Tailscale مسدود شود. Virtual Cloud Network در OCI مانند دیوار آتش در لبه شبکه عمل می‌کند — ترافیک پیش از رسیدن به نمونه شما مسدود می‌شود.

1. در OCI Console به **Networking → Virtual Cloud Networks** بروید
2. روی VCN خود کلیک کنید → **Security Lists** → فهرست امنیتی پیش‌فرض
3. همه قوانین ورودی را **حذف** کنید، به‌جز:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. قوانین خروجی پیش‌فرض را نگه دارید (اجازه همه خروجی‌ها)

این کار SSH روی پورت 22، HTTP، HTTPS و هر چیز دیگر را در لبه شبکه مسدود می‌کند. از این به بعد، فقط می‌توانید از طریق Tailscale وصل شوید.

---

## دسترسی به Control UI

از هر دستگاهی در شبکه Tailscale خود:

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>` را با نام tailnet خود جایگزین کنید (در `tailscale status` قابل مشاهده است).

نیازی به تونل SSH نیست. Tailscale فراهم می‌کند:

- رمزنگاری HTTPS (گواهی‌های خودکار)
- احراز هویت از طریق هویت Tailscale
- دسترسی از هر دستگاهی در tailnet شما (لپ‌تاپ، تلفن و غیره)

---

## امنیت: VCN + Tailscale (خط مبنای پیشنهادی)

با قفل‌بودن VCN (فقط UDP 41641 باز) و اتصال Gateway به loopback، دفاع لایه‌ای قوی به دست می‌آورید: ترافیک عمومی در لبه شبکه مسدود می‌شود و دسترسی مدیریتی از طریق tailnet شما انجام می‌شود.

این تنظیمات اغلب _نیاز_ به قوانین اضافی دیوار آتش مبتنی بر میزبان را صرفاً برای جلوگیری از حملات brute force گسترده اینترنتی روی SSH از بین می‌برد — اما همچنان باید سیستم‌عامل را به‌روز نگه دارید، `openclaw security audit` را اجرا کنید، و بررسی کنید که تصادفاً روی رابط‌های عمومی گوش نمی‌دهید.

### از قبل محافظت‌شده

| گام سنتی | لازم است؟ | چرا |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| دیوار آتش UFW | نه | VCN پیش از رسیدن ترافیک به نمونه، آن را مسدود می‌کند |
| fail2ban | نه | اگر پورت 22 در VCN مسدود باشد، brute force وجود ندارد |
| سخت‌سازی sshd | نه | Tailscale SSH از sshd استفاده نمی‌کند |
| غیرفعال‌کردن ورود root | نه | Tailscale از هویت Tailscale استفاده می‌کند، نه کاربران سیستم |
| احراز هویت فقط با کلید SSH | نه | Tailscale از طریق tailnet شما احراز هویت می‌کند |
| سخت‌سازی IPv6 | معمولاً نه | به تنظیمات VCN/زیرشبکه شما بستگی دارد؛ بررسی کنید واقعاً چه چیزی تخصیص/در معرض دسترس قرار گرفته است |

### همچنان پیشنهاد می‌شود

- **مجوزهای اعتبارنامه:** `chmod 700 ~/.openclaw`
- **ممیزی امنیتی:** `openclaw security audit`
- **به‌روزرسانی‌های سیستم:** مرتباً `sudo apt update && sudo apt upgrade`
- **پایش Tailscale:** دستگاه‌ها را در [کنسول مدیریت Tailscale](https://login.tailscale.com/admin) مرور کنید

### بررسی وضعیت امنیتی

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## راه جایگزین: تونل SSH

اگر Tailscale Serve کار نمی‌کند، از تونل SSH استفاده کنید:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

سپس `http://localhost:18789` را باز کنید.

---

## عیب‌یابی

### ساخت نمونه ناموفق می‌شود («کمبود ظرفیت»)

نمونه‌های ARM لایه رایگان محبوب هستند. این موارد را امتحان کنید:

- دامنه دسترسی متفاوت
- تلاش دوباره در ساعت‌های کم‌ترافیک (صبح زود)
- هنگام انتخاب شکل، از فیلتر "Always Free" استفاده کنید

### Tailscale وصل نمی‌شود

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway شروع نمی‌شود

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### دسترسی به Control UI ممکن نیست

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### مشکلات باینری ARM

برخی ابزارها ممکن است ساخت ARM نداشته باشند. بررسی کنید:

```bash
uname -m  # Should show aarch64
```

بیشتر بسته‌های npm بدون مشکل کار می‌کنند. برای باینری‌ها، دنبال انتشارهای `linux-arm64` یا `aarch64` بگردید.

---

## ماندگاری

همه وضعیت در این مسیرها قرار دارد:

- `~/.openclaw/` — `openclaw.json`، فایل `auth-profiles.json` برای هر عامل، وضعیت کانال/ارائه‌دهنده، و داده‌های نشست
- `~/.openclaw/workspace/` — فضای کاری (SOUL.md، حافظه، مصنوعات)

به‌صورت دوره‌ای پشتیبان بگیرید:

```bash
openclaw backup create
```

---

## مرتبط

- [دسترسی راه‌دور Gateway](/fa/gateway/remote) — الگوهای دیگر دسترسی راه‌دور
- [یکپارچه‌سازی Tailscale](/fa/gateway/tailscale) — مستندات کامل Tailscale
- [پیکربندی Gateway](/fa/gateway/configuration) — همه گزینه‌های پیکربندی
- [راهنمای DigitalOcean](/fa/install/digitalocean) — اگر پرداختی + ثبت‌نام آسان‌تر می‌خواهید
- [راهنمای Hetzner](/fa/install/hetzner) — جایگزین مبتنی بر Docker
