---
read_when:
    - تريد إقران تطبيق عقدة متنقل مع Gateway بسرعة
    - تحتاج إلى مخرجات setup-code للمشاركة عن بُعد/يدويًا
summary: مرجع CLI لـ `openclaw qr` (إنشاء رمز QR للاقتران عبر الهاتف المحمول + رمز الإعداد)
title: QR
x-i18n:
    generated_at: "2026-07-04T18:02:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

أنشئ رمز QR لإقران الهاتف ورمز إعداد من تهيئة Gateway الحالية لديك.

## الاستخدام

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## الخيارات

- `--remote`: يفضّل `gateway.remote.url`؛ إذا لم يكن معيّناً، فيمكن لـ `gateway.tailscale.mode=serve|funnel` أن يوفّر عنوان URL العام البعيد أيضاً
- `--url <url>`: تجاوز عنوان URL الخاص بـ gateway المستخدم في الحمولة
- `--public-url <url>`: تجاوز عنوان URL العام المستخدم في الحمولة
- `--token <token>`: تجاوز رمز gateway الذي يتوثق تدفق التمهيد مقابله
- `--password <password>`: تجاوز كلمة مرور gateway التي يتوثق تدفق التمهيد مقابلها
- `--setup-code-only`: اطبع رمز الإعداد فقط
- `--no-ascii`: تخطَّ عرض QR بصيغة ASCII
- `--json`: أخرج JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## ملاحظات

- الخياران `--token` و`--password` متنافيان.
- يحمل رمز الإعداد نفسه الآن `bootstrapToken` معتماً وقصير العمر، وليس رمز gateway/كلمة المرور المشتركة.
- يعيد تمهيد رمز الإعداد المضمّن رمز `node` أساسياً مع `scopes: []` بالإضافة إلى رمز تسليم `operator` محدود للإعداد الموثوق للهاتف.
- يقتصر رمز المشغّل المسلَّم على `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`؛ ولا تزال نطاقات تعديل الإقران و`operator.admin` تتطلب إقران مشغّل منفصلاً ومعتمداً أو تدفق رمز.
- يفشل إقران الهاتف بشكل مغلق لعناوين URL الخاصة بـ gateway بصيغة `ws://` عبر Tailscale/العامة. تظل عناوين LAN الخاصة ومضيفو Bonjour بصيغة `.local` مدعومة عبر `ws://`، لكن يجب أن تستخدم مسارات الهاتف عبر Tailscale/العامة Tailscale Serve/Funnel أو عنوان URL لـ gateway بصيغة `wss://`.
- مع `--remote`، يتطلب OpenClaw إما `gateway.remote.url` أو
  `gateway.tailscale.mode=serve|funnel`.
- مع `--remote`، إذا كانت بيانات اعتماد البعيد الفعالة والنشطة مهيأة كـ SecretRefs ولم تمرر `--token` أو `--password`، يحلّها الأمر من لقطة gateway النشطة. إذا كان gateway غير متاح، يفشل الأمر سريعاً.
- بدون `--remote`، تُحل SecretRefs الخاصة بمصادقة gateway المحلي عند عدم تمرير تجاوز مصادقة عبر CLI:
  - يُحل `gateway.auth.token` عندما يمكن لمصادقة الرمز أن تفوز (`gateway.auth.mode="token"` الصريح أو الوضع المستنتج حيث لا يفوز أي مصدر كلمة مرور).
  - يُحل `gateway.auth.password` عندما يمكن لمصادقة كلمة المرور أن تفوز (`gateway.auth.mode="password"` الصريح أو الوضع المستنتج من دون رمز فائز من المصادقة/البيئة).
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين (بما في ذلك SecretRefs) وكان `gateway.auth.mode` غير معيّن، يفشل حل رمز الإعداد حتى يتم تعيين الوضع صراحةً.
- ملاحظة حول اختلاف إصدار Gateway: يتطلب مسار هذا الأمر gateway يدعم `secrets.resolve`؛ تعيد الإصدارات الأقدم من gateway خطأ طريقة غير معروفة.
- تتصل تطبيقات OpenClaw الرسمية على iOS وAndroid تلقائياً عندما تتطابق
  بيانات تعريف رمز الإعداد لديها. إذا ظل الطلب معلقاً (مثلاً، لعميل
  غير رسمي أو بيانات تعريف غير متطابقة)، فراجعه ووافق عليه باستخدام:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإقران](/ar/cli/pairing)
