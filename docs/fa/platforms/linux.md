---
read_when:
    - در جست‌وجوی وضعیت اپلیکیشن همراه لینوکس
    - برنامه‌ریزی برای پوشش پلتفرم‌ها یا مشارکت‌ها
    - اشکال‌زدایی از خاتمهٔ اجباری فرایند به‌دلیل کمبود حافظه در لینوکس یا کد خروج ۱۳۷ روی سرور مجازی خصوصی یا کانتینر
summary: وضعیت پشتیبانی از لینوکس و برنامهٔ همراه
title: برنامهٔ لینوکس
x-i18n:
    generated_at: "2026-07-12T10:17:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway در Linux به‌طور کامل پشتیبانی می‌شود. Node محیط اجرای توصیه‌شده است؛ Bun
توصیه نمی‌شود (به‌دلیل مشکلات شناخته‌شده با WhatsApp/Telegram).

هنوز برنامه همراه بومی برای Linux وجود ندارد. از مشارکت‌ها استقبال می‌شود.

## مسیر سریع (VPS)

1. Node 24 (توصیه‌شده) یا Node 22.19+ (نسخه LTS که همچنان پشتیبانی می‌شود) را نصب کنید.
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. از لپ‌تاپ خود اجرا کنید: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` را باز کنید و با راز مشترک پیکربندی‌شده
   احراز هویت کنید (به‌طور پیش‌فرض توکن؛ اگر `gateway.auth.mode` برابر `"password"` باشد، گذرواژه).

راهنمای کامل سرور: [سرور Linux](/fa/vps). نمونه گام‌به‌گام VPS:
[exe.dev](/fa/install/exe-dev).

## نصب

- [شروع به کار](/fa/start/getting-started)
- [نصب و به‌روزرسانی‌ها](/fa/install/updating)
- اختیاری: [Bun (آزمایشی)](/fa/install/bun)، [Nix](/fa/install/nix)، [Docker](/fa/install/docker)

## سرویس Gateway‏ (systemd)

با یکی از روش‌های زیر نصب کنید:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # هنگام درخواست، "Gateway service" را انتخاب کنید
```

نصب موجود را تعمیر یا مهاجرت دهید:

```bash
openclaw doctor
```

`openclaw gateway install` به‌طور پیش‌فرض یک واحد **کاربر** در systemd ایجاد می‌کند. راهنمای
کامل سرویس، از جمله نوع واحد سطح **سیستم** برای میزبان‌های اشتراکی یا
همیشه‌روشن، در [راهنمای عملیاتی Gateway](/fa/gateway#supervision-and-service-lifecycle) قرار دارد.

فقط برای راه‌اندازی سفارشی، واحد را به‌صورت دستی بنویسید. نمونه حداقلی واحد کاربر
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

آن را فعال کنید:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## فشار حافظه و خاتمه‌های OOM

در Linux، هنگامی که حافظه میزبان، ماشین مجازی یا cgroup کانتینر
تمام شود، هسته یک قربانی OOM انتخاب می‌کند. Gateway قربانی مناسبی نیست، زیرا مالک نشست‌های
بلندمدت و اتصال‌های کانال است؛ بنابراین OpenClaw تا حد امکان فرایندهای فرزند
موقتی را در اولویت خاتمه قرار می‌دهد.

برای اجرای فرایندهای فرزند واجد شرایط در Linux، OpenClaw فرمان را در یک لایه کوتاه
`/bin/sh` قرار می‌دهد که مقدار `oom_score_adj` خود فرایند فرزند را به `1000` افزایش می‌دهد و سپس
فرمان واقعی را با `exec` اجرا می‌کند. این کار به دسترسی ویژه نیاز ندارد: یک فرایند همیشه می‌تواند
امتیاز OOM خودش را افزایش دهد.

سطوح فرایند فرزند تحت پوشش:

- فرایندهای فرزند فرمان که توسط ناظر مدیریت می‌شوند
- فرایندهای فرزند پوسته PTY
- فرایندهای فرزند سرور stdio در MCP
- فرایندهای مرورگر/Chrome که OpenClaw راه‌اندازی می‌کند (از طریق محیط اجرای فرایند در SDK افزونه)

این پوشش فقط مخصوص Linux است و هنگامی که `/bin/sh` در دسترس نباشد، یا محیط
فرایند فرزند مقدار `OPENCLAW_CHILD_OOM_SCORE_ADJ` را روی `0`، `false`، `no` یا
`off` تنظیم کند، اعمال نمی‌شود.

یک فرایند فرزند را بررسی کنید:

```bash
cat /proc/<child-pid>/oom_score_adj
```

مقدار مورد انتظار برای فرایندهای فرزند تحت پوشش `1000` است؛ خود فرایند Gateway
امتیاز عادی‌اش را حفظ می‌کند (معمولاً `0`).

گزینه `OOMPolicy=continue` در واحد systemd باعث می‌شود هنگامی که OOM killer
یک فرایند فرزند موقتی را انتخاب می‌کند، سرویس Gateway فعال بماند؛ به‌جای اینکه کل
واحد ناموفق علامت‌گذاری شود و همه کانال‌ها از نو راه‌اندازی شوند. فرایند فرزند/نشست ناموفق،
خطای خودش را گزارش می‌کند.

این قابلیت جایگزین تنظیم عادی حافظه نمی‌شود. اگر یک VPS یا کانتینر به‌طور مکرر
فرایندهای فرزند را خاتمه می‌دهد، محدودیت حافظه را افزایش دهید، هم‌زمانی را کاهش دهید یا کنترل‌های
منابع قوی‌تری اضافه کنید (`MemoryMax=` در systemd، محدودیت‌های حافظه کانتینر).

## مرتبط

- [نمای کلی نصب](/fa/install)
- [سرور Linux](/fa/vps)
- [Raspberry Pi](/fa/install/raspberry-pi)
- [راهنمای عملیاتی Gateway](/fa/gateway)
- [پیکربندی Gateway](/fa/gateway/configuration)
