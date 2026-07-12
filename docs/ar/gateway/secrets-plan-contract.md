---
read_when:
    - إنشاء خطط `openclaw secrets apply` أو مراجعتها
    - تصحيح أخطاء `Invalid plan target path`
    - فهم سلوك التحقق من نوع الهدف والمسار
summary: 'عقد خطط `secrets apply`: التحقق من الأهداف، ومطابقة المسارات، ونطاق هدف `auth-profiles.json`'
title: عقد خطة تطبيق الأسرار
x-i18n:
    generated_at: "2026-07-12T06:00:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

تحدد هذه الصفحة العقد الصارم الذي يفرضه `openclaw secrets apply`. إذا لم يطابق هدفٌ ما هذه القواعد، تفشل عملية التطبيق قبل تعديل أي ملف.

## بنية ملف الخطة

يتوقع `openclaw secrets apply --from <plan.json>` مصفوفة `targets` من أهداف الخطة:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

ينشئ `openclaw secrets configure` الخطط بهذه البنية. ويمكنك أيضًا كتابة خطة أو تعديلها يدويًا.

## إدراج المزوّدين أو تحديثهم وحذفهم

قد تتضمن الخطط أيضًا حقلين اختياريين في المستوى الأعلى يعدّلان خريطة `secrets.providers` إلى جانب عمليات الكتابة الخاصة بكل هدف:

- `providerUpserts` -- كائن مفهرس بالاسم البديل للمزوّد. كل قيمة هي تعريف لمزوّد (بالبنية نفسها المقبولة ضمن `secrets.providers.<alias>` في `openclaw.json`، مثل مزوّد `exec` أو `file`).
- `providerDeletes` -- مصفوفة من الأسماء البديلة للمزوّدين المراد إزالتها.

تُنفّذ `providerUpserts` قبل `targets`، لذا يمكن أن يشير `target.ref.provider` إلى اسم بديل لمزوّد تضيفه الخطة نفسها في `providerUpserts`. من دون هذا الترتيب، تفشل الخطط التي تشير إلى اسم بديل لم يُضبط بعد في `openclaw.json` بالخطأ `provider "<alias>" is not configured`.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

تظل مزوّدات Exec المُضافة عبر `providerUpserts` خاضعة لقواعد الموافقة على Exec الواردة في [سلوك الموافقة على مزوّد Exec](#exec-provider-consent-behavior): تتطلب الخطط التي تحتوي على مزوّدات Exec الخيار `--allow-exec` في وضع الكتابة.

## نطاق الأهداف المدعوم

تُقبل أهداف الخطة لمسارات بيانات الاعتماد المدعومة في [نطاق بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).

## سلوك نوع الهدف

يجب أن يكون `target.type` نوع هدف معروفًا، ويجب أن يطابق `target.path` بعد تسويته بنية المسار المسجلة لذلك النوع.

تقبل بعض أنواع الأهداف اسمًا بديلًا للتوافق في `target.type` للخطط الحالية، بالإضافة إلى اسم النوع الأساسي:

| النوع الأساسي                         | الاسم البديل المقبول                            |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## قواعد التحقق من صحة المسار

يُتحقق من كل هدف وفق جميع القواعد الآتية:

- يجب أن يكون `type` نوع هدف معروفًا.
- يجب أن يكون `path` مسارًا نقطيًا غير فارغ.
- يمكن حذف `pathSegments`. وإذا قُدّم، فيجب أن ينتج بعد التسوية المسار نفسه تمامًا الذي ينتجه `path`.
- تُرفض المقاطع المحظورة: `__proto__` و`prototype` و`constructor`.
- يجب أن يطابق المسار بعد التسوية بنية المسار المسجلة لنوع الهدف.
- إذا ضُبط `providerId` أو `accountId`، فيجب أن يطابق المعرّف المضمّن في المسار.
- تتطلب أهداف `auth-profiles.json` وجود `agentId`.
- عند إنشاء تعيين جديد في `auth-profiles.json`، ضمّن `authProfileProvider`.

## سلوك الفشل

إذا فشل التحقق من صحة هدف، تنتهي عملية التطبيق بخطأ مثل:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

لا تُثبّت أي عمليات كتابة لخطة غير صالحة: تُجرى عملية حلّ الأهداف والتحقق من صحة المسارات قبل لمس أي ملف. وبشكل منفصل، بمجرد أن تبدأ خطة صالحة في الكتابة، تنشئ عملية التطبيق أولًا لقطة لكل ملف تمسه، وتستعيد تلك اللقطات إذا فشلت عملية كتابة لاحقة ضمن التشغيل نفسه، لذلك لا تتسبب أي كتابة جزئية في عدم تزامن حالة الإعدادات أو ملفات تعريف المصادقة أو متغيرات البيئة.

## سلوك الموافقة على مزوّد Exec

- يتخطى `--dry-run` عمليات التحقق من مراجع الأسرار SecretRef من نوع Exec افتراضيًا.
- تُرفض الخطط التي تحتوي على مراجع أسرار SecretRef أو مزوّدات من نوع Exec في وضع الكتابة ما لم يُضبط `--allow-exec`.
- عند التحقق من الخطط التي تحتوي على Exec أو تطبيقها، مرّر `--allow-exec` في أوامر التشغيل التجريبي والكتابة معًا.

## ملاحظات حول نطاق وقت التشغيل والتدقيق

- تُضمَّن إدخالات `auth-profiles.json` التي تحتوي على مراجع فقط (`keyRef`/`tokenRef`) في حل بيانات الاعتماد في وقت التشغيل وفي تغطية التدقيق.
- يكتب `secrets apply` أهداف `openclaw.json` المدعومة وأهداف `auth-profiles.json` المدعومة، وينفّذ ثلاث عمليات تنظيف اختيارية مفعّلة افتراضيًا: `scrubEnv` (تزيل قيم النص الصريح التي رُحّلت من `.env`)، و`scrubAuthProfilesForProviderTargets` (تمحو بقايا النص الصريح أو المراجع غير المستخدمة في `auth-profiles.json` للمزوّدين الذين رحّلتهم الخطة للتو)، و`scrubLegacyAuthJson` (تحذف إدخالات `api_key` المُرحّلة من مخازن `auth.json` القديمة). اضبط أيًا من `options.scrubEnv` أو `options.scrubAuthProfilesForProviderTargets` أو `options.scrubLegacyAuthJson` على `false` في الخطة لتخطي تلك العملية.

## فحوصات المشغّل

```bash
# التحقق من صحة الخطة من دون كتابة
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# ثم التطبيق فعليًا
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# للخطط التي تحتوي على exec، وافق صراحةً في كلا الوضعين
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

إذا فشلت عملية التطبيق برسالة تفيد بأن مسار الهدف غير صالح، فأعِد إنشاء الخطة باستخدام `openclaw secrets configure` أو صحّح مسار الهدف ليتوافق مع إحدى البنى المدعومة أعلاه.

## وثائق ذات صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [CLI ‏`secrets`](/ar/cli/secrets)
- [نطاق بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- [مرجع الإعدادات](/ar/gateway/configuration-reference)
