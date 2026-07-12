---
read_when:
    - نشر OpenClaw على Upstash Box
    - تريد بيئة Linux مُدارة لـ OpenClaw مع وصول إلى لوحة التحكم عبر نفق SSH
summary: استضِف OpenClaw على Upstash Box مع إبقائه نشطًا وإتاحة الوصول عبر نفق SSH
title: صندوق Upstash
x-i18n:
    generated_at: "2026-07-12T06:01:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

شغّل Gateway دائمًا لـ OpenClaw على Upstash Box، وهي بيئة Linux مُدارة
تدعم دورة حياة إبقاء التشغيل.

استخدم نفق SSH للوصول إلى لوحة التحكم. لا تكشف منفذ Gateway مباشرةً
للإنترنت العام.

## المتطلبات الأساسية

- حساب Upstash
- Upstash Box مع إبقاء التشغيل
- عميل SSH على جهازك المحلي

## إنشاء Box

أنشئ Box مع إبقاء التشغيل في Upstash Console. دوّن معرّف Box (على سبيل المثال
`right-flamingo-14486`) ومفتاح API الخاص بـ Box.

تحتفظ Upstash بدليلها الحالي لإعداد OpenClaw على Box في
[إعداد OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## الاتصال باستخدام نفق SSH

أعِد توجيه منفذ لوحة تحكم OpenClaw إلى جهازك المحلي. استخدم مفتاح API الخاص بـ Box
بصفته كلمة مرور SSH عند مطالبتك بذلك:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

تقلّل خيارات إبقاء الاتصال من انقطاعات النفق عند الخمول أثناء الإعداد الأولي.

## تثبيت OpenClaw

داخل Box:

```bash
sudo npm install -g openclaw
```

## تشغيل الإعداد الأولي

```bash
openclaw onboard --install-daemon
```

اتبع المطالبات. انسخ عنوان URL للوحة التحكم والرمز المميز عند اكتمال الإعداد الأولي.

## بدء Gateway

اضبط Gateway لشبكة Box وشغّله في الخلفية:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

مع بقاء نفق SSH نشطًا، افتح عنوان URL للوحة التحكم محليًا:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## إعادة التشغيل التلقائي

عيّن هذا الأمر بصفته برنامج التهيئة النصي لـ Box لكي يُعاد تشغيل Gateway عند بدء
تشغيل Box:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## استكشاف الأخطاء وإصلاحها

إذا تجمّد SSH أثناء الإعداد الأولي، فأعِد الاتصال باستخدام إعداد SSH نظيف
وخيارات إبقاء الاتصال:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

يتجاوز هذا إعدادات `~/.ssh/config` المحلية القديمة، ويحافظ على نشاط النفق
خلال فترات خمول الشبكة.

## ذو صلة

- [الوصول عن بُعد](/ar/gateway/remote)
- [أمان Gateway](/ar/gateway/security)
- [تحديث OpenClaw](/ar/install/updating)
