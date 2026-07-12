---
read_when:
    - می‌خواهید Gateway را روی یک سرور لینوکس یا VPS ابری اجرا کنید
    - به یک راهنمای سریع برای راهنماهای میزبانی نیاز دارید
    - شما خواهان تنظیمات عمومی سرور لینوکس برای OpenClaw هستید
sidebarTitle: Linux Server
summary: اجرای OpenClaw روی سرور Linux یا VPS ابری — انتخاب ارائه‌دهنده، معماری و بهینه‌سازی
title: سرور لینوکس
x-i18n:
    generated_at: "2026-07-12T11:05:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Gateway در OpenClaw را روی هر سرور Linux یا VPS ابری اجرا کنید. این صفحه به شما کمک می‌کند
یک ارائه‌دهنده انتخاب کنید، نحوه کار استقرارهای ابری را توضیح می‌دهد و تنظیمات عمومی Linux
را که در همه‌جا کاربرد دارند پوشش می‌دهد.

## انتخاب ارائه‌دهنده

<CardGroup cols={2}>
  <Card title="Azure" href="/fa/install/azure">ماشین مجازی Linux</Card>
  <Card title="DigitalOcean" href="/fa/install/digitalocean">VPS پولی ساده</Card>
  <Card title="exe.dev" href="/fa/install/exe-dev">ماشین مجازی با پروکسی HTTPS</Card>
  <Card title="Fly.io" href="/fa/install/fly">ماشین‌های Fly</Card>
  <Card title="GCP" href="/fa/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/fa/install/hetzner">Docker روی VPS شرکت Hetzner</Card>
  <Card title="Hostinger" href="/fa/install/hostinger">VPS با راه‌اندازی یک‌کلیکی</Card>
  <Card title="Northflank" href="/fa/install/northflank">راه‌اندازی یک‌کلیکی در مرورگر</Card>
  <Card title="Oracle Cloud" href="/fa/install/oracle">رده ARM همیشه رایگان</Card>
  <Card title="Railway" href="/fa/install/railway">راه‌اندازی یک‌کلیکی در مرورگر</Card>
  <Card title="Raspberry Pi" href="/fa/install/raspberry-pi">میزبانی شخصی روی ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / رده رایگان)** نیز به‌خوبی کار می‌کند.
یک راهنمای ویدئویی تهیه‌شده توسط جامعه در
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
موجود است (منبع جامعه — ممکن است از دسترس خارج شود).

## نحوه کار راه‌اندازی‌های ابری

- **Gateway روی VPS اجرا می‌شود** و مالک وضعیت و فضای کاری است.
- از لپ‌تاپ یا تلفن خود از طریق **رابط کنترل** یا **Tailscale/SSH** متصل می‌شوید.
- VPS را منبع حقیقت در نظر بگیرید و به‌طور منظم از وضعیت و فضای کاری **نسخه پشتیبان** تهیه کنید.
- پیش‌فرض امن: Gateway را روی local loopback نگه دارید و از طریق تونل SSH یا Tailscale Serve به آن دسترسی پیدا کنید.
  اگر آن را به `lan` یا `tailnet` متصل کنید، Gateway به یک راز مشترک
  (`gateway.auth.token` یا `gateway.auth.password`) نیاز دارد، مگر اینکه احراز هویت به یک
  پروکسی قابل‌اعتماد واگذار شده باشد.

صفحات مرتبط: [دسترسی راه دور Gateway](/fa/gateway/remote)، [مرکز پلتفرم‌ها](/fa/platforms).

## ابتدا دسترسی مدیریتی را ایمن کنید

پیش از نصب OpenClaw روی یک VPS عمومی، مشخص کنید چگونه می‌خواهید خود
سرور را مدیریت کنید.

- برای دسترسی مدیریتی فقط از طریق Tailnet: ابتدا Tailscale را نصب کنید، VPS را به
  tailnet خود متصل کنید، یک نشست SSH دوم را از طریق IP متعلق به Tailscale یا نام MagicDNS
  آزمایش کنید و سپس دسترسی عمومی SSH را محدود کنید.
- بدون Tailscale: پیش از در معرض قرار دادن سرویس‌های بیشتر، ایمن‌سازی معادل را برای
  مسیر SSH خود اعمال کنید.
- این موضوع از دسترسی به Gateway جدا است. همچنان می‌توانید OpenClaw را به
  local loopback متصل نگه دارید و برای داشبورد از تونل SSH یا Tailscale Serve استفاده کنید.

گزینه‌های مخصوص Tailscale در Gateway در صفحه [Tailscale](/fa/gateway/tailscale) قرار دارند.

## عامل مشترک شرکت روی VPS

اجرای یک عامل واحد برای یک تیم، زمانی که همه کاربران در یک
مرز اعتماد قرار دارند و عامل فقط برای امور کاری استفاده می‌شود، راه‌اندازی معتبری است.

- آن را در یک محیط اجرای اختصاصی نگه دارید (VPS/ماشین مجازی/کانتینر و کاربر یا حساب‌های اختصاصی سیستم‌عامل).
- آن محیط اجرا را به حساب‌های شخصی Apple/Google یا نمایه‌های شخصی مرورگر/مدیر گذرواژه وارد نکنید.
- اگر کاربران نسبت به یکدیگر متخاصم هستند، آن‌ها را بر اساس Gateway/میزبان/کاربر سیستم‌عامل تفکیک کنید.

جزئیات مدل امنیتی: [امنیت](/fa/gateway/security).

## استفاده از Nodeها همراه با VPS

می‌توانید Gateway را در فضای ابری نگه دارید و **Nodeها** را روی دستگاه‌های محلی خود
(Mac/iOS/Android/بدون رابط گرافیکی) جفت کنید. Nodeها قابلیت‌های محلی صفحه‌نمایش/دوربین/canvas و `system.run`
را فراهم می‌کنند، درحالی‌که Gateway در فضای ابری باقی می‌ماند.

مستندات: [Nodeها](/fa/nodes)، [CLI مربوط به Nodeها](/fa/cli/nodes).

## تنظیم راه‌اندازی برای ماشین‌های مجازی کوچک و میزبان‌های ARM

اگر فرمان‌های CLI روی ماشین‌های مجازی کم‌قدرت (یا میزبان‌های ARM) کند به نظر می‌رسند، حافظه نهان کامپایل ماژول Node را فعال کنید:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` زمان آغاز اجرای مکرر فرمان‌ها را بهبود می‌دهد؛ اجرای نخست حافظه نهان را آماده می‌کند.
- `OPENCLAW_NO_RESPAWN=1` راه‌اندازی‌های مجدد معمول Gateway را در همان فرایند نگه می‌دارد؛ این کار از واگذاری‌های اضافی میان فرایندها جلوگیری می‌کند و ردیابی PID را روی میزبان‌های کوچک ساده نگه می‌دارد.
- برای جزئیات مخصوص Raspberry Pi، به [Raspberry Pi](/fa/install/raspberry-pi) مراجعه کنید.

### فهرست بررسی تنظیم systemd (اختیاری)

برای میزبان‌های ماشین مجازی که از `systemd` استفاده می‌کنند، موارد زیر را در نظر بگیرید:

- متغیرهای محیطی سرویس برای مسیر راه‌اندازی پایدار: `OPENCLAW_NO_RESPAWN=1` و
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- رفتار صریح راه‌اندازی مجدد: `Restart=always`، `RestartSec=2`، `TimeoutStartSec=90`
- دیسک‌های مبتنی بر SSD برای مسیرهای وضعیت/حافظه نهان، به‌منظور کاهش جریمه‌های شروع سرد ناشی از ورودی/خروجی تصادفی.

مسیر استاندارد `openclaw onboard --install-daemon` یک واحد کاربری systemd
نصب می‌کند؛ آن را با فرمان زیر ویرایش کنید:

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

اگر عمداً به‌جای آن یک واحد سیستمی نصب کرده‌اید، آن را از طریق
`sudo systemctl edit openclaw-gateway.service` ویرایش کنید.

نحوه کمک سیاست‌های `Restart=` به بازیابی خودکار:
[systemd می‌تواند بازیابی سرویس را خودکار کند](https://www.redhat.com/en/blog/systemd-automate-recovery).

برای رفتار OOM در Linux، انتخاب فرایند فرزند به‌عنوان قربانی و عیب‌یابی `exit 137`،
به [فشار حافظه و خاتمه‌های OOM در Linux](/fa/platforms/linux#memory-pressure-and-oom-kills) مراجعه کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [DigitalOcean](/fa/install/digitalocean)
- [Fly.io](/fa/install/fly)
- [Hetzner](/fa/install/hetzner)
