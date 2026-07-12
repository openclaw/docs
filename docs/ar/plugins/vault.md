---
read_when:
    - تريد أن يقرأ OpenClaw مفاتيح API من HashiCorp Vault
    - أنت تُعِدّ SecretRefs على جهاز محلي أو خادم
    - تحتاج إلى تهيئة بيانات اعتماد موفّر النموذج المدعومة من Vault
summary: استخدم Plugin المضمّن لـ Vault لحل مراجع الأسرار SecretRefs من HashiCorp Vault
title: مراجع أسرار الخزنة
x-i18n:
    generated_at: "2026-07-12T06:18:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# مراجع الأسرار في Vault

يتيح Plugin ‏Vault المضمّن لـ OpenClaw تحليل مراجع الأسرار `exec` من HashiCorp Vault عند بدء تشغيل Gateway وعند إعادة التحميل. يخزّن OpenClaw مراجع Vault في الإعدادات، ويحتفظ بالقيم المحلولة في لقطة الأسرار داخل الذاكرة، ولا يعيد كتابة مفاتيح API المحلولة إلى `openclaw.json`.

استخدم هذا عندما تكون قد شغّلت Vault بالفعل أو تريد إبقاء مفاتيح موفّري النماذج خارج ملفات إعدادات OpenClaw. للاطلاع على نموذج وقت تشغيل مراجع الأسرار، راجع [إدارة الأسرار](/ar/gateway/secrets).

## قبل البدء

تحتاج إلى:

- OpenClaw مع توفّر Plugin ‏`vault` المضمّن
- خادم Vault يمكن الوصول إليه
- مصادقة Vault يمكنها إصدار رمز عميل مميّز يملك صلاحية قراءة مسارات الأسرار التي ينبغي لـ OpenClaw تحليلها
- يجب أن تتضمن البيئة التي تبدأ تشغيل Gateway المتغير `VAULT_ADDR`، وأحد الخيارات التالية: `VAULT_TOKEN`، أو `OPENCLAW_VAULT_AUTH_METHOD=token_file` مع `VAULT_TOKEN_FILE`، أو تسجيل دخول JWT/Kubernetes مُعدّ

يتصل المحلّل بـ Vault عبر HTTP من Node. لا يحتاج Gateway إلى CLI الخاص بـ Vault لتحليل مراجع الأسرار.

فعّل Plugin المضمّن قبل تشغيل أوامر `openclaw vault`:

```bash
openclaw plugins enable vault
```

## تخزين مفتاح موفّر في Vault

يستخدم OpenClaw افتراضيًا KV v2 المثبّت عند `secret`، بما يتوافق مع أمثلة خادم تطوير Vault. بالنسبة إلى Vault في بيئة الإنتاج، عيّن `OPENCLAW_VAULT_KV_MOUNT` إلى مسار تثبيت KV الفعلي قبل إنشاء معرّفات مراجع الأسرار. باستخدام إعدادات OpenClaw الافتراضية، يقرأ معرّف مرجع السر هذا:

```text
providers/openrouter/apiKey
```

حقل Vault التالي:

```text
secret/data/providers/openrouter -> apiKey
```

إحدى طرق إنشائه باستخدام CLI الخاص بـ Vault هي:

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

استخدم رمز عميل مميّزًا مقيّد النطاق لـ OpenClaw، وليس رمز الجذر المميّز. بالنسبة إلى تخطيط KV v2 الافتراضي، تبدو سياسة دنيا لمفاتيح موفّري النماذج كما يلي:

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## إتاحة Vault لـ Gateway

بالنسبة إلى Gateway محلي غير موضوع في حاوية، صدّر إعدادات Vault في الصدفة نفسها التي تبدأ تشغيل OpenClaw. تقرأ طريقة المصادقة الافتراضية رمز عميل Vault المميّز من `VAULT_TOKEN`:

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

إذا كتب Vault Agent رمزًا مميّزًا في ملف إخراج، فاستخدم المصادقة بملف الرمز المميّز:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

بالنسبة إلى خادم Vault موقّع بواسطة مرجع مصدّق خاص، ثبّت هذا المرجع المصدّق في مخزن ثقة المضيف وفعّل ثقة النظام في Node:

```bash
export NODE_USE_SYSTEM_CA=1
```

أو وفّر حزمة PEM مباشرةً:

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

يجب أن تكون هذه المتغيرات موجودة عند بدء تشغيل OpenClaw. يمرّرها Plugin ‏Vault إلى عملية المحلّل الخاصة به.

للمصادقة غير التفاعلية باستخدام JWT، استخدم ملف JWT لحمل العمل ودورًا في Vault من النوع `jwt`:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

يجب أن يكون ملف JWT رمز حمل عمل مميّزًا مُسقطًا، مثل رمز حساب خدمة Kubernetes مميّز ذي جمهور يقبله دور Vault.
يُعد تسجيل دخول OIDC التفاعلي عبر المتصفح مفيدًا للمستخدمين، لكن وقت تشغيل Gateway يحتاج إلى تسجيل دخول JWT غير تفاعلي أو ملف رمز مميّز.

بالنسبة إلى طريقة مصادقة Kubernetes في Vault، استخدم `kubernetes`. وهي مخصّصة لبوابات Gateway التي تعمل بوصفها Pods؛ ويكون التثبيت الافتراضي هو `kubernetes`، وملف JWT الافتراضي هو مسار رمز حساب الخدمة المميّز القياسي:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

عيّن `OPENCLAW_VAULT_AUTH_MOUNT` فقط عندما تكون مصادقة Kubernetes في Vault مثبّتة في موضع آخر غير `auth/kubernetes`. وعيّن `OPENCLAW_VAULT_JWT_FILE` فقط عندما يكون رمز حساب الخدمة المميّز مُسقطًا في مسار مخصّص.

إعدادات اختيارية:

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

تحقق مما تستطيع الصدفة الحالية رؤيته:

```bash
openclaw vault status
```

عند إعداد أكثر من موفّر أسرار واحد مدعوم من Vault، اختر أحدها بالاسم المستعار:

```bash
openclaw vault status --provider-alias corp-vault
```

لا يطبع `openclaw vault status` المتغير `VAULT_TOKEN` مطلقًا؛ بل يبلّغ فقط عما إذا كان الرمز المميّز وملف الرمز المميّز وملف JWT معيّنة أم لا.

<Warning>
إذا كان Gateway يعمل كخدمة أو LaunchAgent أو وحدة systemd أو مهمة مجدولة أو حاوية، فيجب أن تتلقى بيئة وقت التشغيل هذه متغيرات Vault نفسها. إن تعيين المتغيرات في صدفة تفاعلية يثبت عملها في تلك الصدفة فقط، وليس في Gateway قيد التشغيل بالفعل.
</Warning>

## إنشاء خطة لمراجع الأسرار وتطبيقها

أنشئ خطة تربط مفتاح API لموفّر نماذج OpenRouter بـ Vault:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

طبّق الخطة وتحقق منها:

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

استخدم `--allow-exec` لأن Plugin ‏Vault ينفّذ التحليل عبر موفّر مراجع أسرار `exec` يديره OpenClaw.

إذا لم يكن Gateway قيد التشغيل بعد، فابدأ تشغيله بالطريقة المعتادة بعد تطبيق الخطة بدلًا من تشغيل `openclaw secrets reload`.

## إعداد المزيد من مفاتيح الموفّرين

اختصارات مضمّنة:

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

مفاتيح موفّرين متعددة في خطة واحدة:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

بالنسبة إلى الموفّرين المضمّنين الذين لا يملكون اختصارات، أو موفّري النماذج المخصّصين والمتوافقين مع OpenAI والمُعدّين مسبقًا، استخدم `--provider-key`:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

يكتب كل `--provider-key <provider=id>` مرجع سر في `models.providers.<provider>.apiKey`. بالنسبة إلى الموفّرين المخصّصين، لا ينشئ هذا الخيار إعدادات الموفّر `baseUrl` أو `api` أو `models`؛ أعدّها أولًا.

استخدم `--target <path=id>` لأي مسار هدف معروف لمرجع سر:

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

تنطبق مسارات الأهداف المجرّدة على `openclaw.json`. استخدم `auth-profiles:<agentId>:<path>` لأهداف `auth-profiles.json` الموجودة. يجب أن يكون مسار الهدف هدفًا مسجّلًا لمراجع أسرار OpenClaw. لا ينشئ أمر الإعداد أسرارًا اعتباطية مسمّاة في OpenClaw؛ إذ يظل Vault مخزن الأسرار، ولا يخزّن OpenClaw مراجع الأسرار إلا في حقول الإعدادات المدعومة.

## تنسيق معرّف مرجع السر

تستخدم معرّفات مراجع أسرار Vault الاصطلاح التالي:

```text
<vault-secret-path>/<field>
```

أمثلة:

| معرّف مرجع السر              | قراءة Vault الافتراضية باستخدام KV v2 | الحقل المُعاد |
| ----------------------------- | ---------------------------------- | -------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`       |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`       |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter`   |

يجب أن يكون حقل Vault المُعاد سلسلة نصية.

بالنسبة إلى KV v1، عيّن:

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

عندئذٍ يقرأ `providers/openrouter/apiKey`:

```text
secret/providers/openrouter -> apiKey
```

## ما يخزّنه OpenClaw

يؤدي تطبيق خطة إعداد Vault إلى تخزين موفّر يديره Plugin:

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

تشير حقول بيانات الاعتماد إلى ذلك الموفّر:

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

توجد القيمة المحلولة فقط في لقطة أسرار وقت التشغيل النشطة.

## الحاويات وعمليات النشر المُدارة

تستخدم بوابات Gateway الموضوعة في حاويات إعدادات Plugin ومراجع الأسرار نفسها. يجب أن تتلقى الحاوية:

- `VAULT_ADDR`
- مصدر مصادقة واحدًا:
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` بالإضافة إلى `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` بالإضافة إلى `OPENCLAW_VAULT_AUTH_MOUNT` و`OPENCLAW_VAULT_AUTH_ROLE` و`OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` بالإضافة إلى `OPENCLAW_VAULT_AUTH_ROLE`؛ ويمكن اختياريًا تجاوز `OPENCLAW_VAULT_AUTH_MOUNT` أو `OPENCLAW_VAULT_JWT_FILE`
- اختياريًا: `VAULT_NAMESPACE` و`OPENCLAW_VAULT_KV_MOUNT` و`OPENCLAW_VAULT_KV_VERSION`

عند استخدام Kubernetes، فضّل `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` عندما تكون مصادقة Kubernetes في Vault مُعدّة للعنقود. استخدم `OPENCLAW_VAULT_AUTH_METHOD=jwt` فقط عندما يكون Vault مُعدًّا للتعامل مع العنقود بوصفه جهة إصدار JWT/OIDC عامة. كلا الخيارين أفضل من رمز Vault مميّز طويل الأجل داخل سر Kubernetes. ويمكن لعمليات النشر التي تستخدم Vault Agent كحاوية جانبية أو أداة حقن استخدام `token_file` بدلًا من ذلك.

بالنسبة إلى إعدادات Vault متعددة المستأجرين، احتفظ بتوجيه المستأجرين ضمن سياسة Vault وإعدادات النشر. لا يتطلب OpenClaw تثبيتًا أو دورًا أو مسارًا ثابتًا؛ إذ يمكن لكل بيئة Gateway تعيين قيمها الخاصة لـ `OPENCLAW_VAULT_KV_MOUNT` و`OPENCLAW_VAULT_AUTH_ROLE` ومعرّفات مراجع الأسرار. إذا كان لا بد من أن يحل Gateway مشترك واحد أسرار مستخدمي Vault مختلفين في الوقت نفسه، فاستخدم موفّري `exec` مُعدّين يدويًا يغلّفون بيئات مصادقة منفصلة، أو وزّع المستأجرين على بيئات Gateway ذات بيئات Vault منفصلة.

## ذو صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [`openclaw secrets`](/ar/cli/secrets)
- [قائمة Plugins](/ar/plugins/plugin-inventory)
