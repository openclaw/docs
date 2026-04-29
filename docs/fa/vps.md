---
read_when:
    - می‌خواهید Gateway را روی یک سرور Linux یا VPS ابری اجرا کنید
    - به یک نمای کلی سریع از راهنماهای میزبانی نیاز دارید
    - شما به بهینه‌سازی عمومی سرور لینوکس برای OpenClaw نیاز دارید
sidebarTitle: Linux Server
summary: اجرای OpenClaw روی یک سرور Linux یا VPS ابری — انتخاب‌کنندهٔ ارائه‌دهنده، معماری و بهینه‌سازی
title: سرور لینوکس
x-i18n:
    generated_at: "2026-04-29T23:48:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

OpenClaw Gateway را روی هر سرور لینوکس یا VPS ابری اجرا کنید. این صفحه به شما کمک می‌کند
یک ارائه‌دهنده انتخاب کنید، توضیح می‌دهد استقرارهای ابری چگونه کار می‌کنند، و تنظیمات عمومی لینوکس را
که همه‌جا کاربرد دارد پوشش می‌دهد.

## انتخاب ارائه‌دهنده

<CardGroup cols={2}>
  <Card title="Railway" href="/fa/install/railway">راه‌اندازی مرورگری با یک کلیک</Card>
  <Card title="Northflank" href="/fa/install/northflank">راه‌اندازی مرورگری با یک کلیک</Card>
  <Card title="DigitalOcean" href="/fa/install/digitalocean">VPS پولی ساده</Card>
  <Card title="Oracle Cloud" href="/fa/install/oracle">سطح ARM همیشه رایگان</Card>
  <Card title="Fly.io" href="/fa/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/fa/install/hetzner">Docker روی VPS هتزنر</Card>
  <Card title="Hostinger" href="/fa/install/hostinger">VPS با راه‌اندازی یک‌کلیکی</Card>
  <Card title="GCP" href="/fa/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/fa/install/azure">VM لینوکس</Card>
  <Card title="exe.dev" href="/fa/install/exe-dev">VM با پروکسی HTTPS</Card>
  <Card title="Raspberry Pi" href="/fa/install/raspberry-pi">خودمیزبان ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / سطح رایگان)** هم به‌خوبی کار می‌کند.
یک راهنمای ویدیویی جامعه در
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
در دسترس است (منبع جامعه -- ممکن است از دسترس خارج شود).

## راه‌اندازی‌های ابری چگونه کار می‌کنند

- **Gateway روی VPS اجرا می‌شود** و مالک وضعیت + فضای کاری است.
- از لپ‌تاپ یا گوشی خود از طریق **رابط کاربری کنترل** یا **Tailscale/SSH** متصل می‌شوید.
- با VPS به‌عنوان منبع حقیقت رفتار کنید و از وضعیت + فضای کاری به‌طور منظم **پشتیبان بگیرید**.
- پیش‌فرض امن: Gateway را روی loopback نگه دارید و از طریق تونل SSH یا Tailscale Serve به آن دسترسی پیدا کنید.
  اگر به `lan` یا `tailnet` bind می‌کنید، `gateway.auth.token` یا `gateway.auth.password` را الزامی کنید.

صفحه‌های مرتبط: [دسترسی راه دور Gateway](/fa/gateway/remote)، [هاب پلتفرم‌ها](/fa/platforms).

## ابتدا دسترسی مدیریتی را سخت‌سازی کنید

پیش از نصب OpenClaw روی یک VPS عمومی، تصمیم بگیرید چگونه می‌خواهید خود
سرور را مدیریت کنید.

- اگر دسترسی مدیریتی فقط از طریق Tailnet می‌خواهید، ابتدا Tailscale را نصب کنید، VPS را
  به tailnet خود وصل کنید، یک نشست دوم SSH را از طریق IP متعلق به Tailscale یا
  نام MagicDNS تأیید کنید، سپس SSH عمومی را محدود کنید.
- اگر از Tailscale استفاده نمی‌کنید، سخت‌سازی معادل را برای مسیر SSH خود
  پیش از در معرض گذاشتن سرویس‌های بیشتر اعمال کنید.
- این از دسترسی Gateway جداست. همچنان می‌توانید OpenClaw را محدود به
  loopback نگه دارید و برای داشبورد از تونل SSH یا Tailscale Serve استفاده کنید.

گزینه‌های اختصاصی Tailscale برای Gateway در [Tailscale](/fa/gateway/tailscale) قرار دارند.

## عامل مشترک شرکت روی VPS

اجرای یک عامل واحد برای یک تیم، وقتی همه کاربران در یک مرز اعتماد مشترک هستند و عامل فقط کاری است، راه‌اندازی معتبری است.

- آن را روی یک runtime اختصاصی نگه دارید (VPS/VM/container + کاربر/حساب‌های اختصاصی سیستم‌عامل).
- آن runtime را به حساب‌های شخصی Apple/Google یا پروفایل‌های شخصی مرورگر/مدیر گذرواژه وارد نکنید.
- اگر کاربران نسبت به یکدیگر خصمانه هستند، آن‌ها را بر اساس gateway/host/کاربر سیستم‌عامل جدا کنید.

جزئیات مدل امنیتی: [امنیت](/fa/gateway/security).

## استفاده از نودها با VPS

می‌توانید Gateway را در ابر نگه دارید و **نودها** را روی دستگاه‌های محلی خود
(Mac/iOS/Android/headless) جفت کنید. نودها قابلیت‌های صفحه‌نمایش/دوربین/canvas محلی و `system.run`
را فراهم می‌کنند، در حالی که Gateway در ابر می‌ماند.

مستندات: [نودها](/fa/nodes)، [CLI نودها](/fa/cli/nodes).

## تنظیم شروع به کار برای VMهای کوچک و میزبان‌های ARM

اگر فرمان‌های CLI روی VMهای کم‌مصرف (یا میزبان‌های ARM) کند به نظر می‌رسند، کش کامپایل ماژول Node را فعال کنید:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` زمان‌های شروع فرمان‌های تکراری را بهبود می‌دهد.
- `OPENCLAW_NO_RESPAWN=1` سربار اضافی شروع به کار از مسیر respawn خودکار را حذف می‌کند.
- اجرای نخستین فرمان کش را گرم می‌کند؛ اجراهای بعدی سریع‌تر هستند.
- برای جزئیات اختصاصی Raspberry Pi، [Raspberry Pi](/fa/install/raspberry-pi) را ببینید.

### چک‌لیست تنظیم systemd (اختیاری)

برای میزبان‌های VM که از `systemd` استفاده می‌کنند، در نظر بگیرید:

- افزودن env سرویس برای مسیر شروع پایدار:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- صریح نگه داشتن رفتار راه‌اندازی مجدد:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- برای مسیرهای وضعیت/کش، دیسک‌های مبتنی بر SSD را ترجیح دهید تا جریمه‌های شروع سرد ناشی از I/O تصادفی کاهش یابد.

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

برای رفتار OOM در لینوکس، انتخاب فرایند فرزند قربانی، و عیب‌یابی `exit 137`،
[فشار حافظه لینوکس و killهای OOM](/fa/platforms/linux#memory-pressure-and-oom-kills) را ببینید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [DigitalOcean](/fa/install/digitalocean)
- [Fly.io](/fa/install/fly)
- [Hetzner](/fa/install/hetzner)
