---
read_when:
    - تريد إقران تطبيق Node على الهاتف المحمول مع Gateway بسرعة
    - تحتاج إلى إخراج رمز الإعداد للمشاركة عن بُعد أو يدويًا
summary: مرجع CLI للأمر `openclaw qr` (إنشاء رمز QR لإقران الهاتف المحمول + رمز الإعداد)
title: رمز الاستجابة السريعة
x-i18n:
    generated_at: "2026-07-12T05:43:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

أنشئ رمز QR لاقتران جهاز محمول ورمز إعداد من تهيئة Gateway الحالية.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

تتصل تطبيقات OpenClaw الرسمية لنظامي iOS وAndroid تلقائيًا عندما تتطابق بيانات تعريف رمز الإعداد الخاصة بها. إذا ظل طلب قيد الانتظار (على سبيل المثال، لعميل غير رسمي أو بسبب عدم تطابق بيانات التعريف)، فراجعه ووافق عليه:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## الخيارات

- `--remote`: يفضّل `gateway.remote.url`؛ ويعود إلى `gateway.tailscale.mode=serve|funnel` إذا لم يُعيّن عنوان URL هذا. يتجاهل `publicUrl` في Plugin ‏`device-pair`.
- `--url <url>`: يتجاوز عنوان URL الخاص بـ Gateway المستخدم في الحمولة
- `--public-url <url>`: يتجاوز عنوان URL العام المستخدم في الحمولة
- `--token <token>`: يتجاوز رمز Gateway الذي تتم المصادقة عليه في تدفق التمهيد
- `--password <password>`: يتجاوز كلمة مرور Gateway التي تتم المصادقة عليها في تدفق التمهيد
- `--setup-code-only`: يطبع رمز الإعداد فقط
- `--no-ascii`: يتخطى عرض رمز QR باستخدام ASCII
- `--json`: يُخرج JSON ‏(`setupCode` و`gatewayUrl` و`gatewayUrls` الاختياري و`auth` و`urlSource`)

الخياران `--token` و`--password` متنافيان.

## محتويات رمز الإعداد

يحمل رمز الإعداد `bootstrapToken` مبهمًا وقصير العمر، وليس رمز Gateway المشترك أو كلمة مروره. يُصدر تدفق التمهيد المضمّن:

- رمز `node` أساسيًا مع `scopes: []`
- رمز تسليم `operator` محدودًا ومقيدًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`

لا تزال نطاقات تعديل الاقتران و`operator.admin` تتطلب اقتران مشغّل منفصلًا ومعتمدًا أو تدفق رمز مميز.

## تحديد عنوان URL الخاص بـ Gateway

يفشل اقتران الأجهزة المحمولة بصورة مغلقة لعناوين URL العامة أو الخاصة بـ Tailscale التي تستخدم `ws://` لـ Gateway: استخدم Tailscale Serve/Funnel أو عنوان URL لـ Gateway يستخدم `wss://` في هذه الحالات. تظل عناوين الشبكة المحلية الخاصة ومضيفات Bonjour ذات اللاحقة `.local` مدعومة عبر `ws://` العادي.

عندما يأتي عنوان URL المحدد لـ Gateway من `gateway.bind=lan`، يتحقق OpenClaw أيضًا من مسارات `tailscale serve status --json` الدائمة. يُضمَّن بوصفه خيارًا احتياطيًا أي جذر HTTPS لخدمة Serve يعمل وكيلاً لمنفذ الاسترجاع المحلي لـ Gateway النشط. يضيف أمر QR هذا الخيار الاحتياطي لـ`lan` فقط؛ بينما يحتفظ `custom` و`tailnet` بمساراتهما المعلنة صراحةً. تختبر عملاء iOS الحالية المسارات المعلنة بالترتيب وتحفظ أول مسار يمكن الوصول إليه؛ ويظل الحقل القديم `url` دون تغيير للعملاء الأقدم.

عند استخدام `--remote`، يلزم أحد الخيارين `gateway.remote.url` أو `gateway.tailscale.mode=serve|funnel`.

## تحديد المصادقة (من دون `--remote`)

عند عدم تمرير تجاوز للمصادقة عبر CLI، تُحدَّد SecretRefs لمصادقة Gateway المحلي كما يلي:

| الشرط                                                                                                                    | القيمة المحددة                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`، أو الوضع المستنتج عند عدم وجود مصدر كلمة مرور غالب                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`، أو الوضع المستنتج عند عدم وجود رمز غالب من المصادقة/البيئة                                         | `gateway.auth.password`                   |
| تهيئة كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs) وعدم تعيين `gateway.auth.mode` | يفشل؛ عيّن `gateway.auth.mode` صراحةً |

## تحديد المصادقة (`--remote`)

إذا كانت بيانات الاعتماد البعيدة النشطة فعليًا مهيأة على هيئة SecretRefs ولم يُمرَّر `--token` ولا `--password`، فسيحدد الأمر قيمها من لقطة Gateway النشطة. إذا لم يكن Gateway متاحًا، يفشل الأمر فورًا.

<Note>
يتطلب مسار هذا الأمر Gateway يدعم طريقة RPC ‏`secrets.resolve`. تُرجع إصدارات Gateway الأقدم خطأ يفيد بأن الطريقة غير معروفة.
</Note>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الأجهزة](/ar/cli/devices)
- [الاقتران](/ar/cli/pairing)
