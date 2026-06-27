---
read_when:
    - نشر OpenClaw على Upstash Box
    - تريد بيئة Linux مُدارة لـ OpenClaw مع وصول إلى لوحة المعلومات عبر نفق SSH
summary: استضافة OpenClaw على Upstash Box مع keep-alive والوصول عبر نفق SSH
title: صندوق Upstash
x-i18n:
    generated_at: "2026-06-27T17:54:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

شغّل Gateway دائمًا من OpenClaw على Upstash Box، وهي بيئة Linux مُدارة
تدعم دورة حياة الإبقاء قيد التشغيل.

استخدم نفق SSH للوصول إلى لوحة المعلومات. لا تكشف منفذ Gateway مباشرةً
للإنترنت العام.

## المتطلبات الأساسية

- حساب Upstash
- Upstash Box مع إبقاء قيد التشغيل
- عميل SSH على جهازك المحلي

## إنشاء Box

أنشئ Box مع إبقاء قيد التشغيل في Upstash Console. دوّن معرّف Box، مثل
`right-flamingo-14486`، ومفتاح API الخاص بـ Box لديك.

تحتفظ Upstash بدليلها الحالي لإعداد OpenClaw Box على
[إعداد OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## الاتصال عبر نفق SSH

مرّر منفذ لوحة معلومات OpenClaw إلى جهازك المحلي. استخدم مفتاح API الخاص بـ Box
ككلمة مرور SSH عند مطالبتك بذلك:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

تقلل خيارات الإبقاء قيد التشغيل انقطاعات النفق الخامل أثناء الإعداد الأولي.

## تثبيت OpenClaw

داخل Box:

```bash
sudo npm install -g openclaw
```

## تشغيل الإعداد الأولي

```bash
openclaw onboard --install-daemon
```

اتبع المطالبات. انسخ عنوان URL ورمز لوحة المعلومات عند اكتمال الإعداد الأولي.

## بدء Gateway

هيّئ Gateway لشبكة Box وابدأ تشغيله في الخلفية:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

مع تفعيل نفق SSH، افتح عنوان URL الخاص بلوحة المعلومات محليًا:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## إعادة التشغيل التلقائي

عيّن هذا الأمر كسكربت تهيئة Box حتى يُعاد تشغيل Gateway عند بدء
Box:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## استكشاف الأخطاء وإصلاحها

إذا تجمّد SSH أثناء الإعداد الأولي، فأعد الاتصال باستخدام إعداد SSH نظيف
وخيارات الإبقاء قيد التشغيل:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

يتجاوز هذا إعدادات `~/.ssh/config` المحلية القديمة ويحافظ على النفق نشطًا
خلال فترات خمول الشبكة.

## ذات صلة

- [الوصول عن بُعد](/ar/gateway/remote)
- [أمان Gateway](/ar/gateway/security)
- [تحديث OpenClaw](/ar/install/updating)
