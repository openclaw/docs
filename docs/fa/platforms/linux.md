---
read_when:
    - در حال جست‌وجوی وضعیت برنامهٔ همراه Linux
    - برنامه‌ریزی پوشش پلتفرم یا مشارکت‌ها
    - عیب‌یابی کشته‌شدن فرایندها به‌دلیل OOM در Linux یا کد خروج 137 در VPS یا کانتینر
summary: وضعیت پشتیبانی Linux + برنامهٔ همراه
title: برنامه لینوکس
x-i18n:
    generated_at: "2026-06-27T18:07:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Gateway به‌طور کامل روی Linux پشتیبانی می‌شود. **Node زمان اجرای توصیه‌شده است**.
Bun برای Gateway توصیه نمی‌شود (اشکالات WhatsApp/Telegram).

برنامه‌های همراه بومی Linux برنامه‌ریزی شده‌اند. اگر می‌خواهید در ساخت یکی کمک کنید، مشارکت‌ها خوشامدند.

## مسیر سریع مبتدیان (VPS)

1. Node 24 را نصب کنید (توصیه‌شده؛ Node 22 LTS، در حال حاضر `22.19+`، همچنان برای سازگاری کار می‌کند)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. از لپ‌تاپ خود: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` را باز کنید و با راز مشترک پیکربندی‌شده احراز هویت کنید (به‌صورت پیش‌فرض توکن؛ اگر `gateway.auth.mode: "password"` را تنظیم کرده‌اید، گذرواژه)

راهنمای کامل سرور Linux: [سرور Linux](/fa/vps). نمونه گام‌به‌گام VPS: [exe.dev](/fa/install/exe-dev)

## نصب

- [شروع به کار](/fa/start/getting-started)
- [نصب و به‌روزرسانی‌ها](/fa/install/updating)
- جریان‌های اختیاری: [Bun (آزمایشی)](/fa/install/bun)، [Nix](/fa/install/nix)، [Docker](/fa/install/docker)

## Gateway

- [دفترچه اجرایی Gateway](/fa/gateway)
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

OpenClaw به‌صورت پیش‌فرض یک سرویس **کاربری** systemd نصب می‌کند. برای سرورهای مشترک یا همیشه‌روشن از سرویس **سیستمی** استفاده کنید. `openclaw gateway install` و
`openclaw onboard --install-daemon` از قبل واحد استاندارد فعلی را برای شما تولید می‌کنند؛ فقط وقتی به راه‌اندازی سفارشی سیستم/مدیر سرویس نیاز دارید، آن را دستی بنویسید. راهنمای کامل سرویس در [دفترچه اجرایی Gateway](/fa/gateway) قرار دارد.

راه‌اندازی حداقلی:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service` را بسازید:

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
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

آن را فعال کنید:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## فشار حافظه و پایان‌دادن‌های OOM

در Linux، وقتی حافظه یک میزبان، VM، یا cgroup کانتینر تمام می‌شود، kernel یک قربانی OOM انتخاب می‌کند. Gateway می‌تواند قربانی نامناسبی باشد، چون مالک نشست‌های طولانی‌مدت و اتصال‌های کانال است. بنابراین OpenClaw در صورت امکان فرایندهای فرزند موقتی را طوری اولویت‌بندی می‌کند که پیش از Gateway خاتمه داده شوند.

برای اجرای فرایندهای فرزند واجد شرایط در Linux، OpenClaw فرزند را از طریق یک پوشش کوتاه `/bin/sh` شروع می‌کند که مقدار `oom_score_adj` خود فرزند را به `1000` افزایش می‌دهد و سپس فرمان واقعی را `exec` می‌کند. این عملیات بدون امتیاز ویژه انجام می‌شود، چون فرزند فقط احتمال پایان‌داده‌شدن خودش توسط OOM را افزایش می‌دهد.

سطح‌های فرایند فرزند پوشش‌داده‌شده شامل این موارد هستند:

- فرزندان فرمان مدیریت‌شده توسط supervisor،
- فرزندان پوسته PTY،
- فرزندان سرور stdio مربوط به MCP،
- فرایندهای مرورگر/Chrome که OpenClaw راه‌اندازی کرده است.

این پوشش فقط مخصوص Linux است و وقتی `/bin/sh` در دسترس نباشد، نادیده گرفته می‌شود. همچنین اگر env فرزند `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`، `false`، `no`، یا `off` را تنظیم کند، نادیده گرفته می‌شود.

برای بررسی یک فرایند فرزند:

```bash
cat /proc/<child-pid>/oom_score_adj
```

مقدار مورد انتظار برای فرزندان پوشش‌داده‌شده `1000` است. فرایند Gateway باید امتیاز عادی خود را نگه دارد، معمولاً `0`.

واحد systemd توصیه‌شده همچنین `OOMPolicy=continue` را تنظیم می‌کند. این کار باعث می‌شود وقتی یک فرایند فرزند موقتی توسط پایان‌دهنده OOM انتخاب می‌شود، واحد Gateway زنده بماند؛ فرمان/نشست فرزند می‌تواند شکست بخورد و خطای خود را گزارش کند، بدون اینکه systemd کل سرویس Gateway را ناموفق علامت‌گذاری کند و همه کانال‌ها را دوباره راه‌اندازی کند.

این جایگزین تنظیم معمول حافظه نیست. اگر یک VPS یا کانتینر به‌طور مکرر فرزندان را خاتمه می‌دهد، حد حافظه را افزایش دهید، هم‌زمانی را کاهش دهید، یا کنترل‌های قوی‌تری برای منابع اضافه کنید، مانند `MemoryMax=` در systemd یا محدودیت‌های حافظه در سطح کانتینر.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [سرور Linux](/fa/vps)
- [Raspberry Pi](/fa/install/raspberry-pi)
