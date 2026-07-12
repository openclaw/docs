---
read_when:
    - استقرار OpenClaw در Upstash Box
    - شما برای OpenClaw یک محیط مدیریت‌شدهٔ لینوکس با دسترسی به داشبورد از طریق تونل SSH می‌خواهید
summary: میزبانی OpenClaw روی Upstash Box با قابلیت فعال‌نگه‌داشتن و دسترسی از طریق تونل SSH
title: باکس Upstash
x-i18n:
    generated_at: "2026-07-12T10:13:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

یک Gateway پایدار OpenClaw را روی Upstash Box، محیط مدیریت‌شدهٔ Linux با پشتیبانی از چرخهٔ حیات keep-alive، اجرا کنید.

برای دسترسی به داشبورد از تونل SSH استفاده کنید. پورت Gateway را مستقیماً در معرض اینترنت عمومی قرار ندهید.

## پیش‌نیازها

- حساب Upstash
- Upstash Box با قابلیت keep-alive
- کارخواه SSH روی دستگاه محلی شما

## ایجاد Box

در Upstash Console یک Box با قابلیت keep-alive ایجاد کنید. شناسهٔ Box (برای مثال `right-flamingo-14486`) و کلید API مربوط به Box را یادداشت کنید.

Upstash راهنمای فعلی خود برای راه‌اندازی OpenClaw Box را در
[راه‌اندازی OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup) نگه‌داری می‌کند.

## اتصال با تونل SSH

پورت داشبورد OpenClaw را به دستگاه محلی خود هدایت کنید. هنگام درخواست گذرواژهٔ SSH، کلید API مربوط به Box را وارد کنید:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

گزینه‌های keepalive احتمال قطع‌شدن تونل بی‌کار در طول راه‌اندازی اولیه را کاهش می‌دهند.

## نصب OpenClaw

درون Box:

```bash
sudo npm install -g openclaw
```

## اجرای راه‌اندازی اولیه

```bash
openclaw onboard --install-daemon
```

دستورالعمل‌ها را دنبال کنید. پس از پایان راه‌اندازی اولیه، نشانی داشبورد و توکن را کپی کنید.

## راه‌اندازی Gateway

Gateway را برای شبکهٔ Box پیکربندی کنید و آن را در پس‌زمینه اجرا کنید:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

درحالی‌که تونل SSH فعال است، نشانی داشبورد را به‌صورت محلی باز کنید:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## راه‌اندازی مجدد خودکار

این فرمان را به‌عنوان اسکریپت آغازین Box تنظیم کنید تا Gateway هنگام شروع Box مجدداً راه‌اندازی شود:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## عیب‌یابی

اگر SSH در طول راه‌اندازی اولیه متوقف شد، با یک پیکربندی پاک SSH و گزینه‌های keepalive دوباره متصل شوید:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

این کار تنظیمات قدیمی محلی `~/.ssh/config` را دور می‌زند و تونل را در دوره‌های بی‌کاری شبکه فعال نگه می‌دارد.

## مرتبط

- [دسترسی از راه دور](/fa/gateway/remote)
- [امنیت Gateway](/fa/gateway/security)
- [به‌روزرسانی OpenClaw](/fa/install/updating)
