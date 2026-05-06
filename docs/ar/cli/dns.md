---
read_when:
    - تريد اكتشافًا واسع النطاق (DNS-SD) عبر Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: مرجع CLI لـ `openclaw dns` (أدوات مساعدة للاكتشاف واسع النطاق)
title: نظام أسماء النطاقات
x-i18n:
    generated_at: "2026-05-06T07:45:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

مساعدات DNS للاكتشاف واسع النطاق (Tailscale + CoreDNS). تركز حاليًا على macOS + Homebrew CoreDNS.

ذات صلة:

- اكتشاف Gateway: [الاكتشاف](/ar/gateway/discovery)
- تهيئة الاكتشاف واسع النطاق: [التهيئة](/ar/gateway/configuration)

## الإعداد

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

خطّط أو طبّق إعداد CoreDNS لاكتشاف DNS-SD أحادي البث.

الخيارات:

- `--domain <domain>`: نطاق الاكتشاف واسع النطاق (على سبيل المثال `openclaw.internal`)
- `--apply`: تثبيت تهيئة CoreDNS أو تحديثها وإعادة تشغيل الخدمة (يتطلب sudo؛ macOS فقط)

ما يعرضه:

- نطاق الاكتشاف المحلول
- مسار ملف المنطقة
- عناوين IP الحالية لشبكة tailnet
- تهيئة اكتشاف `openclaw.json` الموصى بها
- قيم خادم الأسماء/النطاق لـ Tailscale Split DNS المطلوب ضبطها

ملاحظات:

- بدون `--apply`، يكون الأمر مساعدًا للتخطيط فقط ويطبع الإعداد الموصى به.
- إذا حُذف `--domain`، يستخدم OpenClaw قيمة `discovery.wideArea.domain` من التهيئة.
- يدعم `--apply` حاليًا macOS فقط ويتوقع Homebrew CoreDNS.
- يقوم `--apply` بتمهيد ملف المنطقة عند الحاجة، ويتأكد من وجود مقطع استيراد CoreDNS، ويعيد تشغيل خدمة brew الخاصة بـ `coredns`.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [الاكتشاف](/ar/gateway/discovery)
