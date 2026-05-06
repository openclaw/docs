---
read_when:
    - تريد إقران تطبيق عقدة محمولة بـ Gateway بسرعة
    - تحتاج إلى مخرجات setup-code للمشاركة عن بُعد/اليدوية
summary: مرجع CLI لـ `openclaw qr` (إنشاء رمز QR لإقران الهاتف المحمول + رمز الإعداد)
title: QR
x-i18n:
    generated_at: "2026-05-06T07:46:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

أنشئ رمز QR لإقران الهاتف المحمول ورمز إعداد من تكوين Gateway الحالي لديك.

## الاستخدام

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## الخيارات

- `--remote`: يفضّل `gateway.remote.url`؛ إذا لم يكن مضبوطًا، فلا يزال بإمكان `gateway.tailscale.mode=serve|funnel` توفير عنوان URL العام البعيد
- `--url <url>`: يتجاوز عنوان URL الخاص بـ Gateway المستخدم في الحمولة
- `--public-url <url>`: يتجاوز عنوان URL العام المستخدم في الحمولة
- `--token <token>`: يتجاوز رمز Gateway الذي يتوثق تدفق التمهيد مقابله
- `--password <password>`: يتجاوز كلمة مرور Gateway التي يتوثق تدفق التمهيد مقابلها
- `--setup-code-only`: يطبع رمز الإعداد فقط
- `--no-ascii`: يتخطى عرض QR بنمط ASCII
- `--json`: يصدر JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## ملاحظات

- `--token` و`--password` متنافيان.
- يحمل رمز الإعداد نفسه الآن `bootstrapToken` مبهمًا وقصير العمر، وليس رمز/كلمة مرور Gateway المشتركة.
- في تدفق تمهيد العقدة/المشغّل المضمّن، لا يزال رمز العقدة الأساسي يصل مع `scopes: []`.
- إذا أصدر تسليم التمهيد أيضًا رمز مشغّل، فإنه يظل مقيّدًا بقائمة السماح الخاصة بالتمهيد: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- فحوصات نطاق التمهيد مسبوقة بالدور. قائمة سماح المشغّل هذه تلبّي طلبات المشغّل فقط؛ ولا تزال الأدوار غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.
- يفشل إقران الهاتف المحمول بإغلاق آمن لعناوين Gateway الخاصة بـ Tailscale/العامة من نوع `ws://`. تظل عناوين LAN الخاصة ومضيفو Bonjour ذوو اللاحقة `.local` مدعومة عبر `ws://`، لكن مسارات الهاتف المحمول عبر Tailscale/العامة يجب أن تستخدم Tailscale Serve/Funnel أو عنوان Gateway من نوع `wss://`.
- مع `--remote`، يتطلب OpenClaw إما `gateway.remote.url` أو
  `gateway.tailscale.mode=serve|funnel`.
- مع `--remote`، إذا تم تكوين بيانات الاعتماد البعيدة النشطة فعليًا كـ SecretRefs ولم تمرر `--token` أو `--password`، يحلّها الأمر من لقطة Gateway النشطة. إذا كان Gateway غير متاح، يفشل الأمر بسرعة.
- بدون `--remote`، تُحلّ SecretRefs الخاصة بمصادقة Gateway المحلي عندما لا يتم تمرير تجاوز مصادقة عبر CLI:
  - يُحلّ `gateway.auth.token` عندما يمكن لمصادقة الرمز أن تفوز (`gateway.auth.mode="token"` صريح أو وضع مستنتج لا يفوز فيه أي مصدر كلمة مرور).
  - يُحلّ `gateway.auth.password` عندما يمكن لمصادقة كلمة المرور أن تفوز (`gateway.auth.mode="password"` صريح أو وضع مستنتج لا يحتوي على رمز فائز من المصادقة/البيئة).
- إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs) وكان `gateway.auth.mode` غير مضبوط، يفشل حل رمز الإعداد إلى أن يتم ضبط الوضع صراحة.
- ملاحظة انحراف إصدار Gateway: يتطلب مسار الأمر هذا Gateway يدعم `secrets.resolve`؛ وتعيد بوابات Gateway الأقدم خطأ أسلوب غير معروف.
- بعد المسح، وافق على إقران الجهاز باستخدام:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإقران](/ar/cli/pairing)
