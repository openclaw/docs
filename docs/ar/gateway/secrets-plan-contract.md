---
read_when:
    - إنشاء أو مراجعة خطط `openclaw secrets apply`
    - تصحيح أخطاء `Invalid plan target path` errors
    - فهم سلوك نوع الهدف والتحقق من المسار
summary: 'عقد خطط `secrets apply`: التحقق من الهدف، ومطابقة المسار، ونطاق الهدف `auth-profiles.json`'
title: عقد خطة تطبيق الأسرار
x-i18n:
    generated_at: "2026-04-24T07:43:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

تحدد هذه الصفحة العقد الصارم الذي يفرضه `openclaw secrets apply`.

إذا لم يطابق هدف ما هذه القواعد، يفشل التطبيق قبل تعديل الإعدادات.

## شكل ملف الخطة

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

## نطاق الهدف المدعوم

تُقبل أهداف الخطة لمسارات بيانات الاعتماد المدعومة في:

- [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)

## سلوك نوع الهدف

القاعدة العامة:

- يجب أن يكون `target.type` معروفًا ويجب أن يطابق شكل `target.path` المُطبَّع.

لا تزال الأسماء المستعارة المتوافقة مقبولة للخطط الحالية:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## قواعد التحقق من المسار

يتم التحقق من كل هدف وفق جميع ما يلي:

- يجب أن يكون `type` نوع هدف معروفًا.
- يجب أن يكون `path` مسارًا نقطيًا غير فارغ.
- يمكن حذف `pathSegments`. وإذا تم توفيره، فيجب أن يُطبَّع إلى المسار نفسه تمامًا مثل `path`.
- تُرفض المقاطع المحظورة: `__proto__` و`prototype` و`constructor`.
- يجب أن يطابق المسار المُطبَّع شكل المسار المسجَّل لنوع الهدف.
- إذا تم ضبط `providerId` أو `accountId`، فيجب أن يطابق المعرّف المُشفَّر في المسار.
- تتطلب أهداف `auth-profiles.json` وجود `agentId`.
- عند إنشاء ربط جديد في `auth-profiles.json`، ضمّن `authProfileProvider`.

## سلوك الفشل

إذا فشل هدف في التحقق، يخرج التطبيق بخطأ مثل:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

لا يتم تثبيت أي عمليات كتابة لخطة غير صالحة.

## سلوك الموافقة على موفر exec

- يتخطى `--dry-run` فحوصات SecretRef من نوع exec افتراضيًا.
- تُرفض الخطط التي تحتوي على SecretRefs/providers من نوع exec في وضع الكتابة ما لم يتم ضبط `--allow-exec`.
- عند التحقق من خطط تحتوي على exec أو تطبيقها، مرّر `--allow-exec` في كل من أوامر التنفيذ التجريبي وأوامر الكتابة.

## ملاحظات حول نطاق وقت التشغيل والتدقيق

- تُضمَّن إدخالات `auth-profiles.json` التي تحتوي على مراجع فقط (`keyRef`/`tokenRef`) في حلّ وقت التشغيل وفي تغطية التدقيق.
- يكتب `secrets apply` أهداف `openclaw.json` المدعومة، وأهداف `auth-profiles.json` المدعومة، وأهداف التنظيف الاختيارية.

## فحوصات المشغّل

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

إذا فشل التطبيق برسالة مسار هدف غير صالح، فأعد إنشاء الخطة باستخدام `openclaw secrets configure` أو أصلح مسار الهدف إلى شكل مدعوم كما هو موضح أعلاه.

## وثائق ذات صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [CLI `secrets`](/ar/cli/secrets)
- [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- [مرجع الإعدادات](/ar/gateway/configuration-reference)
