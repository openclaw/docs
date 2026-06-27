---
read_when:
    - تريد إقران تطبيق Node للجوال مع Gateway بسرعة
    - تحتاج إلى مخرجات setup-code للمشاركة عن بُعد/يدويًا
summary: مرجع CLI لـ `openclaw qr` (إنشاء رمز QR للاقتران عبر الهاتف المحمول + رمز الإعداد)
title: QR
x-i18n:
    generated_at: "2026-06-27T17:24:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

أنشئ رمز QR لاقتران الهاتف المحمول ورمز إعداد من تكوين Gateway الحالي لديك.

## الاستخدام

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## الخيارات

- `--remote`: يفضّل `gateway.remote.url`؛ إذا لم يكن مضبوطًا، فيمكن أن يظل `gateway.tailscale.mode=serve|funnel` يوفّر عنوان URL العام البعيد
- `--url <url>`: يتجاوز عنوان URL الخاص بالبوابة المستخدم في الحمولة
- `--public-url <url>`: يتجاوز عنوان URL العام المستخدم في الحمولة
- `--token <token>`: يتجاوز رمز Gateway الذي يصادق عليه تدفق التمهيد
- `--password <password>`: يتجاوز كلمة مرور Gateway التي يصادق عليها تدفق التمهيد
- `--setup-code-only`: يطبع رمز الإعداد فقط
- `--no-ascii`: يتخطى عرض QR بأسلوب ASCII
- `--json`: يُخرج JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## ملاحظات

- `--token` و`--password` متنافيان.
- يحمل رمز الإعداد نفسه الآن `bootstrapToken` معتمًا وقصير العمر، وليس رمز/كلمة مرور Gateway المشتركة.
- يعيد تمهيد رمز الإعداد المدمج رمز `node` أساسيًا مع `scopes: []` بالإضافة إلى رمز تسليم `operator` محدود لإعداد الهاتف المحمول الموثوق.
- يقتصر رمز المشغّل المُسلَّم على `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`؛ ويتطلب `operator.admin` و`operator.pairing` تدفق اقتران مشغّل أو رمزًا منفصلًا ومعتمدًا.
- يفشل اقتران الهاتف المحمول بشكل مغلق لعناوين URL الخاصة بـ Gateway من نوع `ws://` العامة أو عبر Tailscale. تظل عناوين الشبكة المحلية الخاصة ومضيفو Bonjour بنطاق `.local` مدعومين عبر `ws://`، لكن يجب أن تستخدم مسارات الهاتف المحمول العامة أو عبر Tailscale‏ Tailscale Serve/Funnel أو عنوان URL للبوابة من نوع `wss://`.
- مع `--remote`، يتطلب OpenClaw إما `gateway.remote.url` أو
  `gateway.tailscale.mode=serve|funnel`.
- مع `--remote`، إذا كانت بيانات الاعتماد البعيدة الفعالة النشطة مكوّنة بصفتها SecretRefs ولم تمرر `--token` أو `--password`، فسيحلّها الأمر من لقطة Gateway النشطة. إذا كانت Gateway غير متاحة، يفشل الأمر سريعًا.
- من دون `--remote`، تُحل SecretRefs لمصادقة Gateway المحلية عندما لا يُمرَّر تجاوز مصادقة عبر CLI:
  - يُحل `gateway.auth.token` عندما يمكن لمصادقة الرمز الفوز (`gateway.auth.mode="token"` صريح أو وضع مستنتج لا يفوز فيه أي مصدر كلمة مرور).
  - يُحل `gateway.auth.password` عندما يمكن لمصادقة كلمة المرور الفوز (`gateway.auth.mode="password"` صريح أو وضع مستنتج بلا رمز فائز من المصادقة/البيئة).
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين (بما في ذلك SecretRefs) وكان `gateway.auth.mode` غير مضبوط، يفشل حل رمز الإعداد إلى أن يُضبط الوضع صراحة.
- ملاحظة حول اختلاف إصدارات Gateway: يتطلب مسار هذا الأمر بوابة تدعم `secrets.resolve`؛ وتعيد البوابات الأقدم خطأ طريقة غير معروفة.
- بعد المسح، وافق على اقتران الجهاز باستخدام:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الاقتران](/ar/cli/pairing)
