---
read_when:
    - تريد إقران تطبيق عقدة على الهاتف المحمول مع Gateway بسرعة
    - تحتاج إلى مخرجات setup-code للمشاركة عن بُعد/يدويًا
summary: مرجع CLI لـ `openclaw qr` (إنشاء رمز QR لإقران الهاتف المحمول + رمز الإعداد)
title: QR
x-i18n:
    generated_at: "2026-07-03T13:31:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

أنشئ رمز QR لاقتران الجهاز المحمول ورمز إعداد من تهيئة Gateway الحالية لديك.

## الاستخدام

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## الخيارات

- `--remote`: يفضّل `gateway.remote.url`؛ وإذا لم يكن معيّنًا، فلا يزال بإمكان `gateway.tailscale.mode=serve|funnel` توفير عنوان URL العام البعيد
- `--url <url>`: تجاوز عنوان URL الخاص بالـ Gateway المستخدم في الحمولة
- `--public-url <url>`: تجاوز عنوان URL العام المستخدم في الحمولة
- `--token <token>`: تجاوز رمز Gateway الذي يصادق تدفق التمهيد مقابله
- `--password <password>`: تجاوز كلمة مرور Gateway التي يصادق تدفق التمهيد مقابلها
- `--setup-code-only`: اطبع رمز الإعداد فقط
- `--no-ascii`: تخطَّ عرض QR بصيغة ASCII
- `--json`: أصدِر JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## ملاحظات

- `--token` و`--password` متنافيان.
- يحمل رمز الإعداد نفسه الآن `bootstrapToken` قصير الأمد ومبهمًا، وليس رمز/كلمة مرور Gateway المشتركة.
- يعيد تمهيد رمز الإعداد المدمج رمز `node` أساسيًا مع `scopes: []` بالإضافة إلى رمز تسليم `operator` محدود للإعداد الموثوق للأجهزة المحمولة.
- يقتصر رمز المشغّل المُسلَّم على `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`؛ ولا تزال نطاقات تعديل الاقتران و`operator.admin` تتطلب اقتران مشغّل منفصلًا معتمدًا أو تدفق رمز منفصلًا.
- يفشل اقتران الجهاز المحمول بطريقة مغلقة لعناوين URL الخاصة بـ Gateway عبر Tailscale/العامة باستخدام `ws://`. تظل عناوين LAN الخاصة ومضيفو Bonjour من نوع `.local` مدعومة عبر `ws://`، لكن ينبغي لمسارات الأجهزة المحمولة عبر Tailscale/العامة استخدام Tailscale Serve/Funnel أو عنوان URL للـ Gateway عبر `wss://`.
- مع `--remote`، يتطلب OpenClaw إما `gateway.remote.url` أو
  `gateway.tailscale.mode=serve|funnel`.
- مع `--remote`، إذا كانت بيانات الاعتماد البعيدة الفعالة مهيأة بصفتها SecretRefs ولم تمرر `--token` أو `--password`، فسيحلّها الأمر من لقطة Gateway النشطة. إذا لم يكن Gateway متاحًا، يفشل الأمر بسرعة.
- بدون `--remote`، تُحلّ SecretRefs لمصادقة Gateway المحلية عندما لا يُمرَّر تجاوز مصادقة عبر CLI:
  - يُحلّ `gateway.auth.token` عندما يمكن لمصادقة الرمز الفوز (وضع `gateway.auth.mode="token"` الصريح أو الوضع المستنتج حيث لا يفوز أي مصدر كلمة مرور).
  - يُحلّ `gateway.auth.password` عندما يمكن لمصادقة كلمة المرور الفوز (وضع `gateway.auth.mode="password"` الصريح أو الوضع المستنتج بلا رمز فائز من المصادقة/البيئة).
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين (بما في ذلك SecretRefs) وكان `gateway.auth.mode` غير معيّن، يفشل حل رمز الإعداد إلى أن يُعيَّن الوضع صراحةً.
- ملاحظة اختلاف إصدار Gateway: يتطلب مسار هذا الأمر Gateway يدعم `secrets.resolve`؛ وتعيد البوابات الأقدم خطأ طريقة غير معروفة.
- بعد المسح، وافق على اقتران الجهاز باستخدام:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## ذات صلة

- [مرجع CLI](/ar/cli)
- [الاقتران](/ar/cli/pairing)
