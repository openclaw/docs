---
read_when:
    - تريد الاكتشاف على نطاق واسع (DNS-SD) عبر Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: مرجع CLI لـ `openclaw dns` (مساعدات الاكتشاف على نطاق واسع)
title: DNS
x-i18n:
    generated_at: "2026-04-24T07:34:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

مساعدات DNS للاكتشاف على نطاق واسع (Tailscale + CoreDNS). تركز حاليًا على macOS + Homebrew CoreDNS.

ذو صلة:

- اكتشاف Gateway: [الاكتشاف](/ar/gateway/discovery)
- إعداد الاكتشاف على نطاق واسع: [الإعداد](/ar/gateway/configuration)

## الإعداد

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

تخطيط أو تطبيق إعداد CoreDNS لاكتشاف DNS-SD أحادي الإرسال.

الخيارات:

- `--domain <domain>`: نطاق الاكتشاف على نطاق واسع (على سبيل المثال `openclaw.internal`)
- `--apply`: تثبيت أو تحديث إعداد CoreDNS وإعادة تشغيل الخدمة (يتطلب sudo؛ macOS فقط)

ما الذي يعرضه:

- نطاق الاكتشاف المحلول
- مسار ملف المنطقة
- عناوين tailnet IP الحالية
- إعداد `openclaw.json` الموصى به للاكتشاف
- قيم nameserver/domain الخاصة بـ Tailscale Split DNS التي يجب ضبطها

ملاحظات:

- من دون `--apply`، يكون الأمر مجرد أداة تخطيط ويطبع الإعداد الموصى به.
- إذا تم حذف `--domain`، يستخدم OpenClaw القيمة `discovery.wideArea.domain` من الإعدادات.
- يدعم `--apply` حاليًا macOS فقط ويتوقع وجود Homebrew CoreDNS.
- يقوم `--apply` بتهيئة ملف المنطقة الأولي عند الحاجة، ويضمن وجود مقطع import الخاص بـ CoreDNS، ويعيد تشغيل خدمة `coredns` التابعة لـ brew.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الاكتشاف](/ar/gateway/discovery)
