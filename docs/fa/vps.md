---
read_when:
    - می‌خواهید Gateway را روی یک سرور Linux یا VPS ابری اجرا کنید.
    - شما به یک نقشهٔ سریع از راهنماهای میزبانی نیاز دارید
    - شما تنظیمات عمومی سرور Linux را برای OpenClaw می‌خواهید
sidebarTitle: Linux Server
summary: OpenClaw را روی یک سرور Linux یا VPS ابری اجرا کنید — انتخاب‌کنندهٔ ارائه‌دهنده، معماری، و تنظیمات بهینه‌سازی
title: سرور Linux
x-i18n:
    generated_at: "2026-06-27T19:07:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

OpenClaw Gateway را روی هر سرور Linux یا VPS ابری اجرا کنید. این صفحه به شما کمک می‌کند
یک ارائه‌دهنده انتخاب کنید، توضیح می‌دهد استقرارهای ابری چگونه کار می‌کنند، و تنظیمات عمومی Linux
را که همه‌جا کاربرد دارند پوشش می‌دهد.

## انتخاب ارائه‌دهنده

<CardGroup cols={2}>
  <Card title="Railway" href="/fa/install/railway">راه‌اندازی یک‌کلیکی در مرورگر</Card>
  <Card title="Northflank" href="/fa/install/northflank">راه‌اندازی یک‌کلیکی در مرورگر</Card>
  <Card title="DigitalOcean" href="/fa/install/digitalocean">VPS پولی ساده</Card>
  <Card title="Oracle Cloud" href="/fa/install/oracle">رده ARM همیشه رایگان</Card>
  <Card title="Fly.io" href="/fa/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/fa/install/hetzner">Docker روی Hetzner VPS</Card>
  <Card title="Hostinger" href="/fa/install/hostinger">VPS با راه‌اندازی یک‌کلیکی</Card>
  <Card title="GCP" href="/fa/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/fa/install/azure">ماشین مجازی Linux</Card>
  <Card title="exe.dev" href="/fa/install/exe-dev">ماشین مجازی با پراکسی HTTPS</Card>
  <Card title="Raspberry Pi" href="/fa/install/raspberry-pi">میزبانی شخصی ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / رده رایگان)** نیز به‌خوبی کار می‌کند.
یک راهنمای ویدیویی جامعه در دسترس است:
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(منبع جامعه -- ممکن است از دسترس خارج شود).

## راه‌اندازی‌های ابری چگونه کار می‌کنند

- **Gateway روی VPS اجرا می‌شود** و مالک وضعیت + فضای کاری است.
- از لپ‌تاپ یا تلفن خود از طریق **رابط کاربری کنترل** یا **Tailscale/SSH** وصل می‌شوید.
- VPS را منبع حقیقت در نظر بگیرید و از وضعیت + فضای کاری به‌طور منظم **پشتیبان بگیرید**.
- پیش‌فرض امن: Gateway را روی لوپ‌بک نگه دارید و از طریق تونل SSH یا Tailscale Serve به آن دسترسی پیدا کنید.
  اگر به `lan` یا `tailnet` متصل می‌کنید، `gateway.auth.token` یا `gateway.auth.password` را الزامی کنید.

صفحه‌های مرتبط: [دسترسی راه دور Gateway](/fa/gateway/remote)، [مرکز پلتفرم‌ها](/fa/platforms).

## ابتدا دسترسی ادمین را سخت‌سازی کنید

پیش از نصب OpenClaw روی یک VPS عمومی، تصمیم بگیرید چگونه می‌خواهید خود
ماشین را مدیریت کنید.

- اگر دسترسی ادمین فقط از طریق Tailnet می‌خواهید، ابتدا Tailscale را نصب کنید، VPS را
  به tailnet خود متصل کنید، یک نشست SSH دوم را از طریق IP Tailscale یا
  نام MagicDNS تأیید کنید، سپس SSH عمومی را محدود کنید.
- اگر از Tailscale استفاده نمی‌کنید، سخت‌سازی معادل را برای مسیر SSH خود
  پیش از آشکار کردن سرویس‌های بیشتر اعمال کنید.
- این موضوع از دسترسی Gateway جداست. همچنان می‌توانید OpenClaw را به
  لوپ‌بک محدود نگه دارید و برای داشبورد از تونل SSH یا Tailscale Serve استفاده کنید.

گزینه‌های اختصاصی Gateway برای Tailscale در [Tailscale](/fa/gateway/tailscale) قرار دارند.

## عامل مشترک شرکت روی یک VPS

اجرای یک عامل واحد برای یک تیم، زمانی که همه کاربران در یک مرز اعتماد یکسان هستند و عامل فقط کاری است، یک راه‌اندازی معتبر است.

- آن را روی یک محیط اجرای اختصاصی نگه دارید (VPS/VM/container + کاربر/حساب‌های اختصاصی سیستم‌عامل).
- آن محیط اجرا را وارد حساب‌های شخصی Apple/Google یا پروفایل‌های شخصی مرورگر/مدیر گذرواژه نکنید.
- اگر کاربران نسبت به یکدیگر خصمانه هستند، بر اساس gateway/host/OS user جدا کنید.

جزئیات مدل امنیتی: [امنیت](/fa/gateway/security).

## استفاده از نودها با یک VPS

می‌توانید Gateway را در ابر نگه دارید و **نودها** را روی دستگاه‌های محلی خود
(Mac/iOS/Android/headless) جفت کنید. نودها قابلیت‌های صفحه/دوربین/بوم محلی و `system.run`
را فراهم می‌کنند، در حالی که Gateway در ابر باقی می‌ماند.

مستندات: [نودها](/fa/nodes)، [CLI نودها](/fa/cli/nodes).

## تنظیم راه‌اندازی برای ماشین‌های مجازی کوچک و میزبان‌های ARM

اگر فرمان‌های CLI روی ماشین‌های مجازی کم‌قدرت (یا میزبان‌های ARM) کند به نظر می‌رسند، کش کامپایل ماژول Node را فعال کنید:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` زمان راه‌اندازی فرمان‌های تکراری را بهبود می‌دهد.
- `OPENCLAW_NO_RESPAWN=1` راه‌اندازی‌های مجدد معمول Gateway را در همان فرایند نگه می‌دارد، که از واگذاری‌های اضافی فرایند جلوگیری می‌کند و ردیابی PID را روی میزبان‌های کوچک ساده نگه می‌دارد.
- نخستین اجرای فرمان کش را گرم می‌کند؛ اجراهای بعدی سریع‌تر هستند.
- برای جزئیات مخصوص Raspberry Pi، [Raspberry Pi](/fa/install/raspberry-pi) را ببینید.

### چک‌لیست تنظیم systemd (اختیاری)

برای میزبان‌های VM که از `systemd` استفاده می‌کنند، در نظر بگیرید:

- برای مسیر راه‌اندازی پایدار، env سرویس را اضافه کنید:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- رفتار راه‌اندازی مجدد را صریح نگه دارید:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- برای مسیرهای وضعیت/کش، دیسک‌های مبتنی بر SSD را ترجیح دهید تا جریمه‌های شروع سرد I/O تصادفی کاهش یابد.

برای مسیر استاندارد `openclaw onboard --install-daemon`، واحد کاربر را ویرایش کنید:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

اگر عمداً یک واحد سیستمی نصب کرده‌اید، به‌جای آن
`openclaw-gateway.service` را از طریق `sudo systemctl edit openclaw-gateway.service` ویرایش کنید.

این‌که سیاست‌های `Restart=` چگونه به بازیابی خودکار کمک می‌کنند:
[systemd می‌تواند بازیابی سرویس را خودکار کند](https://www.redhat.com/en/blog/systemd-automate-recovery).

برای رفتار OOM در Linux، انتخاب فرایند فرزند به‌عنوان قربانی، و عیب‌یابی `exit 137`،
[فشار حافظه Linux و کشتارهای OOM](/fa/platforms/linux#memory-pressure-and-oom-kills) را ببینید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [DigitalOcean](/fa/install/digitalocean)
- [Fly.io](/fa/install/fly)
- [Hetzner](/fa/install/hetzner)
