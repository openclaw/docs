---
read_when:
    - إنشاء أو مراجعة خطط `openclaw secrets apply`
    - استكشاف أخطاء `Invalid plan target path` وإصلاحها
    - فهم نوع الهدف وسلوك التحقق من صحة المسار
summary: 'عقد خطط `secrets apply`: التحقق من الهدف، ومطابقة المسار، ونطاق هدف `auth-profiles.json`'
title: عقد خطة تطبيق الأسرار
x-i18n:
    generated_at: "2026-06-27T17:43:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

تحدد هذه الصفحة العقد الصارم الذي يفرضه `openclaw secrets apply`.

إذا لم يطابق هدف هذه القواعد، يفشل التطبيق قبل تعديل الإعدادات.

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

## إدراجات الموفّرين وتحديثاتهم وحذفهم

قد تتضمن الخطط أيضًا حقلين اختياريين في المستوى الأعلى يعدّلان خريطة
`secrets.providers` إلى جانب الكتابات لكل هدف:

- `providerUpserts` — كائن مفهرس بالاسم المستعار للموفّر. كل قيمة هي
  تعريف موفّر (بالشكل نفسه المقبول ضمن
  `secrets.providers.<alias>` في `openclaw.json`، مثل موفّر `exec` أو `file`).
- `providerDeletes` — مصفوفة من الأسماء المستعارة للموفّرين المطلوب إزالتها.

يعمل `providerUpserts` قبل `targets`، لذلك يمكن أن يشير `target.ref.provider`
إلى اسم مستعار لموفّر تقدمه الخطة نفسها في
`providerUpserts`. من دون ذلك، تفشل الخطط التي تشير إلى اسم مستعار لم تتم
تهيئته بعد في `openclaw.json` مع `provider "<alias>" is not
configured`.

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

تظل موفّرات Exec المقدمة عبر `providerUpserts` خاضعة لقواعد موافقة exec في [سلوك موافقة موفّر Exec](#exec-provider-consent-behavior):
تتطلب الخطط التي تحتوي على موفّري exec الخيار `--allow-exec` في وضع الكتابة.

## نطاق الأهداف المدعوم

تُقبل أهداف الخطة لمسارات بيانات الاعتماد المدعومة في:

- [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)

## سلوك نوع الهدف

القاعدة العامة:

- يجب أن يكون `target.type` معروفًا وأن يطابق شكل `target.path` بعد التطبيع.

تبقى الأسماء المستعارة للتوافق مقبولة للخطط الحالية:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## قواعد التحقق من المسار

يتم التحقق من كل هدف وفق كل ما يلي:

- يجب أن يكون `type` نوع هدف معروفًا.
- يجب أن يكون `path` مسارًا نقطيًا غير فارغ.
- يمكن حذف `pathSegments`. إذا قُدم، فيجب أن يُطبّع إلى المسار نفسه تمامًا مثل `path`.
- تُرفض المقاطع المحظورة: `__proto__`، `prototype`، `constructor`.
- يجب أن يطابق المسار بعد التطبيع شكل المسار المسجل لنوع الهدف.
- إذا تم تعيين `providerId` أو `accountId`، فيجب أن يطابق المعرّف المرمّز في المسار.
- تتطلب أهداف `auth-profiles.json` وجود `agentId`.
- عند إنشاء ربط جديد في `auth-profiles.json`، ضمّن `authProfileProvider`.

## سلوك الفشل

إذا فشل التحقق من هدف، يخرج التطبيق بخطأ مثل:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

لا تُنفذ أي كتابات لخطة غير صالحة.

## سلوك موافقة موفّر Exec

- يتجاوز `--dry-run` فحوصات SecretRef من نوع exec افتراضيًا.
- تُرفض الخطط التي تحتوي على SecretRefs/موفّرين من نوع exec في وضع الكتابة ما لم يتم تعيين `--allow-exec`.
- عند التحقق من الخطط التي تحتوي على exec أو تطبيقها، مرّر `--allow-exec` في أوامر dry-run والكتابة معًا.

## ملاحظات نطاق وقت التشغيل والتدقيق

- تُضمّن إدخالات `auth-profiles.json` المرجعية فقط (`keyRef`/`tokenRef`) في حل وقت التشغيل وتغطية التدقيق.
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

إذا فشل التطبيق برسالة مسار هدف غير صالح، فأعد توليد الخطة باستخدام `openclaw secrets configure` أو أصلح مسار الهدف إلى شكل مدعوم أعلاه.

## مستندات ذات صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [CLI `secrets`](/ar/cli/secrets)
- [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- [مرجع الإعدادات](/ar/gateway/configuration-reference)
