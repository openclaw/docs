---
read_when:
    - استقرار OpenClaw در Upstash Box
    - شما یک محیط Linux مدیریت‌شده برای OpenClaw با دسترسی به داشبورد از طریق تونل SSH می‌خواهید
summary: OpenClaw را روی Upstash Box با دسترسی keep-alive و تونل SSH میزبانی کنید
title: جعبه Upstash
x-i18n:
    generated_at: "2026-06-27T18:01:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

یک OpenClaw Gateway پایدار را روی Upstash Box، یک محیط لینوکس مدیریت‌شده با پشتیبانی از چرخه عمر keep-alive، اجرا کنید.

برای دسترسی به داشبورد از تونل SSH استفاده کنید. پورت Gateway را مستقیماً در معرض اینترنت عمومی قرار ندهید.

## پیش‌نیازها

- حساب Upstash
- Upstash Box با keep-alive
- کلاینت SSH روی دستگاه محلی شما

## ایجاد یک Box

در Upstash Console یک Box با keep-alive ایجاد کنید. شناسه Box، مانند `right-flamingo-14486`، و کلید API Box خود را یادداشت کنید.

Upstash راهنمای فعلی OpenClaw Box خود را در
[راه‌اندازی OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup) نگه‌داری می‌کند.

## اتصال با تونل SSH

پورت داشبورد OpenClaw را به دستگاه محلی خود فوروارد کنید. هنگام درخواست، از کلید API Box خود به‌عنوان رمز عبور SSH استفاده کنید:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

گزینه‌های keepalive افتادن تونل در زمان بیکاری هنگام راه‌اندازی اولیه را کاهش می‌دهند.

## نصب OpenClaw

داخل Box:

```bash
sudo npm install -g openclaw
```

## اجرای راه‌اندازی اولیه

```bash
openclaw onboard --install-daemon
```

دستورالعمل‌ها را دنبال کنید. وقتی راه‌اندازی اولیه تمام شد، URL و توکن داشبورد را کپی کنید.

## شروع Gateway

Gateway را برای شبکه Box پیکربندی کنید و آن را در پس‌زمینه شروع کنید:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

با فعال بودن تونل SSH، URL داشبورد را به‌صورت محلی باز کنید:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## راه‌اندازی مجدد خودکار

این فرمان را به‌عنوان اسکریپت init Box تنظیم کنید تا Gateway هنگام شروع Box دوباره راه‌اندازی شود:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## عیب‌یابی

اگر SSH هنگام راه‌اندازی اولیه متوقف شد، با یک پیکربندی SSH تمیز و keepaliveها دوباره وصل شوید:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

این کار تنظیمات کهنه محلی `~/.ssh/config` را دور می‌زند و تونل را در دوره‌های بیکاری شبکه فعال نگه می‌دارد.

## مرتبط

- [دسترسی از راه دور](/fa/gateway/remote)
- [امنیت Gateway](/fa/gateway/security)
- [به‌روزرسانی OpenClaw](/fa/install/updating)
