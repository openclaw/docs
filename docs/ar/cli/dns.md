---
read_when:
    - تريد اكتشافًا عبر شبكة واسعة (DNS-SD) باستخدام Tailscale وCoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: مرجع CLI لـ `openclaw dns` (أدوات مساعدة للاكتشاف عبر الشبكات واسعة النطاق)
title: DNS
x-i18n:
    generated_at: "2026-07-12T05:40:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

أدوات مساعدة لـ DNS للاكتشاف عبر الشبكات الواسعة (Tailscale + CoreDNS). تدعم حاليًا macOS وCoreDNS المثبّت عبر Homebrew فقط.

ذو صلة:

- اكتشاف Gateway: [الاكتشاف](/ar/gateway/discovery)
- إعداد الاكتشاف عبر الشبكات الواسعة: [التهيئة](/ar/gateway/configuration)

## `dns setup`

خطّط لإعداد CoreDNS أو طبّقه لاكتشاف DNS-SD أحادي الإرسال.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| الخيار              | التأثير                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| `--domain <domain>` | نطاق الاكتشاف عبر الشبكات الواسعة (مثل `openclaw.internal`).                       |
| `--apply`           | تثبيت/تحديث إعداد CoreDNS وبدء الخدمة أو إعادة تشغيلها. يتطلب sudo، وعلى macOS فقط. |

من دون `--domain`، يستخدم OpenClaw القيمة `discovery.wideArea.domain` من الإعداد.

من دون `--apply`، يطبع الأمر فقط:

- نطاق الاكتشاف المحسوم ومسار ملف المنطقة
- عناوين IP الحالية لشبكة tailnet
- إعداد الاكتشاف الموصى به في `openclaw.json`
- قيم خادم الأسماء والنطاق لـSplit DNS في Tailscale، المطلوب تعيينها في وحدة تحكم إدارة Tailscale

مع `--apply` (على macOS فقط، ويتطلب CoreDNS المثبّت عبر Homebrew):

- يهيّئ ملف المنطقة إذا كان مفقودًا
- يضيف مقطع استيراد CoreDNS إذا كان مفقودًا
- يعيد تشغيل خدمة `coredns` في brew

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الاكتشاف](/ar/gateway/discovery)
