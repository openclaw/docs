---
read_when:
    - أنت تريد إقران تطبيق Node على الهاتف المحمول مع gateway بسرعة
    - أنت تحتاج إلى إخراج رمز الإعداد للمشاركة عن بُعد/يدويًا
summary: مرجع CLI لـ `openclaw qr` (إنشاء رمز QR للاقتران عبر الهاتف المحمول + رمز الإعداد)
title: QR
x-i18n:
    generated_at: "2026-04-24T07:35:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

أنشئ رمز QR للاقتران عبر الهاتف المحمول ورمز إعداد من إعداد Gateway الحالي لديك.

## الاستخدام

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## الخيارات

- `--remote`: يفضّل `gateway.remote.url`؛ وإذا لم تكن مضبوطة، يمكن أيضًا لـ `gateway.tailscale.mode=serve|funnel` توفير عنوان URL العام البعيد
- `--url <url>`: تجاوز عنوان URL الخاص بـ gateway المستخدم في الحمولة
- `--public-url <url>`: تجاوز عنوان URL العام المستخدم في الحمولة
- `--token <token>`: تجاوز رمز gateway الذي يصادق عليه تدفق bootstrap
- `--password <password>`: تجاوز كلمة مرور gateway التي يصادق عليها تدفق bootstrap
- `--setup-code-only`: طباعة رمز الإعداد فقط
- `--no-ascii`: تخطي عرض QR بصيغة ASCII
- `--json`: إصدار JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## ملاحظات

- الخياران `--token` و`--password` متنافيان.
- يحمل رمز الإعداد نفسه الآن `bootstrapToken` معتمًا قصير العمر، وليس رمز/كلمة مرور gateway المشتركة.
- في تدفق bootstrap المدمج للعقدة/المشغل، يظل رمز العقدة الأساسي يُنشأ مع `scopes: []`.
- إذا أصدر تسليم bootstrap أيضًا رمز مشغل، فإنه يظل محصورًا في قائمة سماح bootstrap: `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`.
- فحوصات نطاق bootstrap ذات بادئة حسب الدور. قائمة سماح المشغل هذه تلبّي فقط طلبات المشغل؛ أما الأدوار غير المشغل فما تزال تحتاج إلى scopes تحت بادئة الدور الخاصة بها.
- يفشل الاقتران عبر الهاتف المحمول بشكل مغلق مع عناوين gateway من نوع `ws://` الخاصة بـ Tailscale/العامة. ما يزال `ws://` الخاص بالشبكة المحلية الخاصة مدعومًا، لكن المسارات المحمولة عبر Tailscale/العامة يجب أن تستخدم Tailscale Serve/Funnel أو عنوان `wss://` لـ gateway.
- مع `--remote`، يتطلب OpenClaw إما `gateway.remote.url` أو
  `gateway.tailscale.mode=serve|funnel`.
- مع `--remote`، إذا كانت بيانات الاعتماد البعيدة الفعالة مُعدّة كـ SecretRefs ولم تمرر `--token` أو `--password`، فإن الأمر يحلها من لقطة gateway النشطة. وإذا كانت gateway غير متاحة، يفشل الأمر بسرعة.
- من دون `--remote`، يتم حل SecretRefs الخاصة بمصادقة gateway المحلية عندما لا يتم تمرير تجاوز مصادقة عبر CLI:
  - يتم حل `gateway.auth.token` عندما يمكن لمصادقة الرمز أن تفوز (وجود `gateway.auth.mode="token"` صريح أو وضع مستنتج لا تفوز فيه أي كلمة مرور).
  - يتم حل `gateway.auth.password` عندما يمكن لمصادقة كلمة المرور أن تفوز (وجود `gateway.auth.mode="password"` صريح أو وضع مستنتج لا يوجد فيه رمز فائز من auth/env).
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين (بما في ذلك SecretRefs) ولم يكن `gateway.auth.mode` مضبوطًا، فإن تحليل رمز الإعداد يفشل إلى أن يتم ضبط الوضع صراحةً.
- ملاحظة حول عدم توافق إصدار gateway: يتطلب مسار هذا الأمر gateway تدعم `secrets.resolve`؛ أما الـ gateways الأقدم فتعيد خطأ unknown-method.
- بعد المسح، وافق على اقتران الجهاز باستخدام:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الاقتران](/ar/cli/pairing)
