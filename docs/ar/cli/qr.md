---
read_when:
    - تريد إقران تطبيق Node على الهاتف المحمول مع Gateway بسرعة
    - تحتاج إلى مخرجات رمز الإعداد للمشاركة عن بُعد/يدويًا
summary: مرجع CLI لـ `openclaw qr` (إنشاء رمز QR لإقران الهاتف المحمول + رمز الإعداد)
title: QR
x-i18n:
    generated_at: "2026-07-16T14:05:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

أنشئ رمز QR للاقتران على الهاتف المحمول ورمز إعداد من تكوين Gateway الحالي.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

تتصل تطبيقات OpenClaw الرسمية لنظامي iOS وAndroid تلقائيًا عندما تتطابق بيانات تعريف رمز الإعداد الخاصة بها. إذا ظل طلب معلقًا (على سبيل المثال، لعميل غير رسمي أو بسبب عدم تطابق بيانات التعريف)، فراجعه ووافق عليه:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## الخيارات

- `--remote`: تفضيل `gateway.remote.url`؛ والرجوع إلى `gateway.tailscale.mode=serve|funnel` إذا لم يكن عنوان URL هذا معيّنًا. يتجاهل `device-pair` الخاص بـ plugin `publicUrl`.
- `--url <url>`: تجاوز عنوان URL الخاص بـ Gateway والمستخدم في الحمولة
- `--public-url <url>`: تجاوز عنوان URL العام المستخدم في الحمولة
- `--token <token>`: تجاوز رمز Gateway الذي تتم المصادقة عليه في تدفق التمهيد
- `--password <password>`: تجاوز كلمة مرور Gateway التي تتم المصادقة عليها في تدفق التمهيد
- `--limited`: حذف صلاحية الوصول الإداري إلى Gateway من رمز المشغّل المُسلَّم
- `--setup-code-only`: طباعة رمز الإعداد فقط
- `--no-ascii`: تخطي عرض رمز QR بأحرف ASCII
- `--json`: إخراج JSON ‏(`setupCode`، `gatewayUrl`، `gatewayUrls` اختياري، `auth`، `access`، `accessDowngraded` اختياري، `urlSource`)

الخياران `--token` و`--password` متنافيان.

## محتويات رمز الإعداد

يحمل رمز الإعداد `bootstrapToken` مبهمًا وقصير الأجل، وليس رمز Gateway المشترك أو كلمة مروره. بالنسبة إلى نقطة نهاية `wss://` (أو الاسترجاع الحلقي على المضيف نفسه)، يُصدر تدفق التمهيد الافتراضي:

- رمز `node` أساسيًا مع `scopes: []`
- رمز تسليم `operator` كاملاً وأصليًا للهاتف المحمول مع `operator.admin` و`operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`

استخدم `--limited` للاحتفاظ برمز Node نفسه مع حذف `operator.admin` من تسليم المشغّل. لا يُسلَّم نطاق تعديل الاقتران مطلقًا بواسطة رمز إعداد.

يظل إعداد `ws://` عبر شبكة LAN بنص صريح متاحًا، لكن OpenClaw يستخدم ملف التعريف المحدود تلقائيًا لأن مراقبًا للشبكة قد يلتقط رمز التمهيد من نوع bearer ويسابق استخدامه. هيّئ `wss://` أو Tailscale Serve، ثم أنشئ رمزًا جديدًا للحصول على وصول كامل.

## تحليل عنوان URL الخاص بـ Gateway

يفشل اقتران الهاتف المحمول بصورة مغلقة مع عناوين URL الخاصة بـ Gateway من النوع Tailscale/العام `ws://`: استخدم Tailscale Serve/Funnel أو عنوان URL ‏`wss://` لـ Gateway في هذه الحالات. تظل عناوين شبكة LAN الخاصة ومضيفات Bonjour من النوع `.local` مدعومة عبر `ws://` الصريح، مع وصول محدود للمشغّل كما هو موضح أعلاه.

عندما يأتي عنوان URL المحدد لـ Gateway من `gateway.bind=lan`، يتحقق OpenClaw أيضًا من مسارات `tailscale serve status --json` الدائمة. يُضمَّن كمسار احتياطي أي جذر HTTPS Serve يمرر طلبات منفذ الاسترجاع الحلقي لـ Gateway النشط. يضيف أمر QR هذا المسار الاحتياطي إلى `lan` فقط؛ ويحتفظ `custom` و`tailnet` بالمسارات المعلنة صراحةً. تختبر عملاء iOS الحالية المسارات المعلنة بالترتيب وتحفظ أول مسار يمكن الوصول إليه؛ ويظل الحقل القديم `url` دون تغيير للعملاء الأقدم.

عند استخدام `--remote`، يلزم أحد الخيارين `gateway.remote.url` أو `gateway.tailscale.mode=serve|funnel`.

## تحليل المصادقة (من دون `--remote`)

عند عدم تمرير تجاوز للمصادقة عبر CLI، تُحل مراجع الأسرار SecretRefs الخاصة بمصادقة Gateway المحلي كما يلي:

| الشرط                                                                                                                    | القيمة المحلولة                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`، أو الوضع المستنتج من دون مصدر كلمة مرور فائز                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`، أو الوضع المستنتج من دون رمز فائز من المصادقة/البيئة                                         | `gateway.auth.password`                   |
| تهيئة كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs) وعدم تعيين `gateway.auth.mode` | يفشل؛ عيّن `gateway.auth.mode` صراحةً |

## تحليل المصادقة (`--remote`)

إذا كانت بيانات الاعتماد البعيدة النشطة فعليًا مهيأة بوصفها SecretRefs ولم يُمرَّر أي من `--token` أو `--password`، فسيحلها الأمر من لقطة Gateway النشطة. إذا لم يكن Gateway متاحًا، يفشل الأمر فورًا.

<Note>
يتطلب مسار هذا الأمر Gateway يدعم طريقة RPC المسماة `secrets.resolve`. تُرجع بوابات Gateway الأقدم خطأً يفيد بأن الطريقة غير معروفة.
</Note>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الأجهزة](/ar/cli/devices)
- [الاقتران](/ar/cli/pairing)
