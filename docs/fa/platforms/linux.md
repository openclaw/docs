---
read_when:
    - در حال بررسی وضعیت برنامه همراه Linux
    - برنامه‌ریزی پوشش پلتفرم یا مشارکت‌ها
    - اشکال‌زدایی از کشتن فرایندها توسط OOM در Linux یا کد خروج 137 روی VPS یا کانتینر
summary: پشتیبانی از لینوکس + وضعیت برنامه همراه
title: برنامه لینوکس
x-i18n:
    generated_at: "2026-05-07T13:25:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

Gateway در Linux به‌طور کامل پشتیبانی می‌شود. **Node محیط اجرای پیشنهادی است**.
Bun برای Gateway توصیه نمی‌شود (باگ‌های WhatsApp/Telegram).

اپلیکیشن‌های همراه بومی Linux برنامه‌ریزی شده‌اند. اگر می‌خواهید در ساخت یکی کمک کنید، مشارکت‌ها پذیرفته می‌شوند.

## مسیر سریع مبتدیان (VPS)

1. Node 24 را نصب کنید (توصیه‌شده؛ Node 22 LTS، در حال حاضر `22.16+`، همچنان برای سازگاری کار می‌کند)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. از لپ‌تاپ خود: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` را باز کنید و با راز مشترک پیکربندی‌شده احراز هویت کنید (به‌طور پیش‌فرض token؛ اگر `gateway.auth.mode: "password"` را تنظیم کرده‌اید، password)

راهنمای کامل سرور Linux: [سرور Linux](/fa/vps). نمونه گام‌به‌گام VPS: [exe.dev](/fa/install/exe-dev)

## نصب

- [شروع به کار](/fa/start/getting-started)
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

OpenClaw به‌طور پیش‌فرض یک سرویس systemd از نوع **کاربر** نصب می‌کند. برای سرورهای اشتراکی یا همیشه‌روشن از سرویس **سیستم** استفاده کنید. `openclaw gateway install` و
`openclaw onboard --install-daemon` از قبل واحد canonical فعلی را برای شما تولید می‌کنند؛ فقط وقتی به یک راه‌اندازی سفارشی system/service-manager نیاز دارید، آن را دستی بنویسید. راهنمای کامل سرویس در [راهنمای عملیاتی Gateway](/fa/gateway) قرار دارد.

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

## فشار حافظه و خاتمه‌های OOM

در Linux، وقتی حافظه یک میزبان، VM یا cgroup کانتینر تمام می‌شود، kernel یک قربانی OOM انتخاب می‌کند. Gateway می‌تواند قربانی نامناسبی باشد، چون مالک نشست‌های بلندمدت و اتصال‌های کانال است. بنابراین OpenClaw در صورت امکان فرایندهای فرزند گذرا را طوری اولویت‌بندی می‌کند که پیش از Gateway خاتمه داده شوند.

برای spawnهای فرزند واجد شرایط در Linux، OpenClaw فرزند را از طریق یک wrapper کوتاه `/bin/sh` شروع می‌کند که `oom_score_adj` خود فرزند را به `1000` افزایش می‌دهد، سپس فرمان واقعی را `exec` می‌کند. این یک عملیات بدون امتیاز ویژه است، چون فرزند فقط احتمال خاتمه OOM خودش را افزایش می‌دهد.

سطح‌های فرایند فرزند پوشش‌داده‌شده شامل این‌ها هستند:

- فرزندان فرمان مدیریت‌شده توسط supervisor،
- فرزندان shell مربوط به PTY،
- فرزندان سرور stdio مربوط به MCP،
- فرایندهای مرورگر/Chrome که توسط OpenClaw اجرا شده‌اند.

این wrapper فقط مخصوص Linux است و وقتی `/bin/sh` در دسترس نباشد، رد می‌شود. همچنین اگر env فرزند `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`، `false`، `no` یا `off` را تنظیم کند، رد می‌شود.

برای بررسی یک فرایند فرزند:

```bash
cat /proc/<child-pid>/oom_score_adj
```

مقدار مورد انتظار برای فرزندان پوشش‌داده‌شده `1000` است. فرایند Gateway باید امتیاز عادی خود را حفظ کند، که معمولاً `0` است.

این جایگزین تنظیم معمول حافظه نیست. اگر یک VPS یا کانتینر به‌طور مکرر فرزندان را خاتمه می‌دهد، محدودیت حافظه را افزایش دهید، همزمانی را کاهش دهید، یا کنترل‌های منابع قوی‌تری مانند `MemoryMax=` در systemd یا محدودیت‌های حافظه در سطح کانتینر اضافه کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [سرور Linux](/fa/vps)
- [Raspberry Pi](/fa/install/raspberry-pi)
