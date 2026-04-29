---
read_when:
    - در حال بررسی وضعیت برنامهٔ همراه Linux
    - برنامه‌ریزی برای پوشش پلتفرم یا مشارکت‌ها
    - اشکال‌زدایی از کشته‌شدن‌های OOM لینوکس یا خروج با کد ۱۳۷ در یک VPS یا کانتینر
summary: پشتیبانی لینوکس + وضعیت برنامه همراه
title: برنامه Linux
x-i18n:
    generated_at: "2026-04-29T23:10:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 16
---

Gateway به‌طور کامل روی Linux پشتیبانی می‌شود. **Node زمان اجرای توصیه‌شده است**.
Bun برای Gateway توصیه نمی‌شود (به‌دلیل باگ‌های WhatsApp/Telegram).

اپلیکیشن‌های همراه بومی Linux برنامه‌ریزی شده‌اند. اگر می‌خواهید در ساخت یکی کمک کنید، مشارکت‌ها پذیرفته می‌شوند.

## مسیر سریع برای مبتدیان (VPS)

1. Node 24 را نصب کنید (توصیه‌شده؛ Node 22 LTS، در حال حاضر `22.14+`، همچنان برای سازگاری کار می‌کند)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. از لپ‌تاپ خود: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` را باز کنید و با secret مشترک پیکربندی‌شده احراز هویت کنید (به‌طور پیش‌فرض token؛ اگر `gateway.auth.mode: "password"` را تنظیم کرده باشید، password)

راهنمای کامل سرور Linux: [سرور Linux](/fa/vps). نمونه گام‌به‌گام VPS: [exe.dev](/fa/install/exe-dev)

## نصب

- [شروع کار](/fa/start/getting-started)
- [نصب و به‌روزرسانی‌ها](/fa/install/updating)
- جریان‌های اختیاری: [Bun (آزمایشی)](/fa/install/bun)، [Nix](/fa/install/nix)، [Docker](/fa/install/docker)

## Gateway

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [پیکربندی](/fa/gateway/configuration)

## نصب سرویس Gateway (CLI)

یکی از این‌ها را استفاده کنید:

```
openclaw onboard --install-daemon
```

یا:

```
openclaw gateway install
```

یا:

```
openclaw configure
```

وقتی درخواست شد، **سرویس Gateway** را انتخاب کنید.

تعمیر/مهاجرت:

```
openclaw doctor
```

## کنترل سیستم (واحد کاربری systemd)

OpenClaw به‌طور پیش‌فرض یک سرویس **کاربری** systemd نصب می‌کند. برای سرورهای مشترک یا همیشه‌روشن از سرویس **سیستمی** استفاده کنید. `openclaw gateway install` و
`openclaw onboard --install-daemon` از قبل واحد canonical فعلی را برای شما تولید می‌کنند؛ فقط زمانی یکی را دستی بنویسید که به یک چیدمان سفارشی system/service-manager نیاز دارید. راهنمای کامل سرویس در [راهنمای عملیاتی Gateway](/fa/gateway) قرار دارد.

راه‌اندازی حداقلی:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service` را ایجاد کنید:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

آن را فعال کنید:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## فشار حافظه و کشتن‌های OOM

در Linux، وقتی cgroup یک میزبان، VM یا container با کمبود حافظه مواجه شود، کرنل یک قربانی OOM انتخاب می‌کند. Gateway می‌تواند قربانی نامناسبی باشد، چون مالک sessionهای طولانی‌مدت و اتصال‌های channel است. بنابراین OpenClaw در صورت امکان، فرایندهای فرزند گذرا را طوری اولویت‌بندی می‌کند که پیش از Gateway کشته شوند.

برای فرایندهای فرزند واجد شرایط در Linux، OpenClaw فرزند را از طریق یک wrapper کوتاه
`/bin/sh` شروع می‌کند که `oom_score_adj` خود فرزند را به `1000` افزایش می‌دهد و سپس دستور واقعی را `exec` می‌کند. این یک عملیات بدون دسترسی ویژه است، چون فرزند فقط احتمال کشته‌شدن OOM خودش را افزایش می‌دهد.

سطح‌های فرایند فرزند تحت پوشش شامل این‌ها هستند:

- فرزندان command مدیریت‌شده توسط supervisor،
- فرزندان shell مربوط به PTY،
- فرزندان server stdio مربوط به MCP،
- فرایندهای browser/Chrome که توسط OpenClaw اجرا شده‌اند.

این wrapper فقط مخصوص Linux است و وقتی `/bin/sh` در دسترس نباشد نادیده گرفته می‌شود. همچنین اگر env فرزند `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`، `false`،
`no` یا `off` را تنظیم کرده باشد، نادیده گرفته می‌شود.

برای بررسی یک فرایند فرزند:

```bash
cat /proc/<child-pid>/oom_score_adj
```

مقدار مورد انتظار برای فرزندان تحت پوشش `1000` است. فرایند Gateway باید امتیاز عادی خود را حفظ کند، که معمولا `0` است.

این جایگزین تنظیمات معمول حافظه نمی‌شود. اگر یک VPS یا container بارها فرزندان را می‌کشد، محدودیت حافظه را افزایش دهید، هم‌زمانی را کاهش دهید، یا کنترل‌های منابع قوی‌تری مانند systemd `MemoryMax=` یا محدودیت‌های حافظه در سطح container اضافه کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [سرور Linux](/fa/vps)
- [Raspberry Pi](/fa/install/raspberry-pi)
