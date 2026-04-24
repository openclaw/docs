---
read_when:
    - تريد قراءة التهيئة أو تعديلها دون تفاعل /*<<<analysis to=final code omitted reason="Need only translation output." />
summary: مرجع CLI لـ `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: التهيئة
x-i18n:
    generated_at: "2026-04-24T07:34:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e2eb75cc415df52ddcd104d8e5295d8d7b84baca65b4368deb3f06259f6bcd
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

مساعدات التهيئة للتعديلات غير التفاعلية في `openclaw.json`: ‏`get`/`set`/`unset`/`file`/`schema`/`validate`
للقيم حسب المسار وطباعة ملف التهيئة النشط. شغّله من دون أمر فرعي من أجل
فتح معالج التهيئة (وهو نفسه `openclaw configure`).

خيارات الجذر:

- `--section <section>`: مرشح أقسام إعداد موجّه قابل للتكرار عند تشغيل `openclaw config` بدون أمر فرعي

الأقسام الموجّهة المدعومة:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## أمثلة

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

يطبع JSON schema المُولَّد لـ `openclaw.json` إلى stdout بصيغة JSON.

ما الذي يتضمنه:

- schema تهيئة الجذر الحالية، بالإضافة إلى حقل سلسلة `$schema` عند الجذر لأدوات المحرر
- بيانات التوثيق الوصفية للحقلين `title` و`description` التي تستخدمها واجهة Control
- ترث عُقد الكائنات المتداخلة، والرموز الشاملة (`*`)، وعناصر المصفوفة (`[]`) نفس بيانات `title` / `description` الوصفية عند وجود توثيق مطابق للحقل
- ترث فروع `anyOf` / `oneOf` / `allOf` أيضًا نفس بيانات التوثيق الوصفية عند وجود توثيق مطابق للحقل
- بيانات schema وصفية حيّة، بأفضل جهد، خاصة بالقنوات وPlugin عند إمكانية تحميل manifestات وقت التشغيل
- schema احتياطية نظيفة حتى عندما تكون التهيئة الحالية غير صالحة

‏RPC ذو الصلة في وقت التشغيل:

- يعيد `config.schema.lookup` مسار تهيئة مُطبَّعًا واحدًا مع عقدة
  schema سطحية (`title`, `description`, `type`, `enum`, `const`, والحدود الشائعة)،
  وبيانات hints الوصفية المطابقة للواجهة، وملخصات الأبناء المباشرين. استخدمه من أجل
  التعمق المحصور بالمسار في واجهة Control أو العملاء المخصصين.

```bash
openclaw config schema
```

مرّره إلى ملف عندما تريد فحصه أو التحقق منه بأدوات أخرى:

```bash
openclaw config schema > openclaw.schema.json
```

### المسارات

تستخدم المسارات ترميز النقطة أو الأقواس:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

استخدم فهرس قائمة الوكلاء لاستهداف وكيل محدد:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## القيم

تُحلَّل القيم بصيغة JSON5 عندما يكون ذلك ممكنًا؛ وإلا فتُعامَل كسلاسل نصية.
استخدم `--strict-json` لفرض تحليل JSON5. وما زال `--json` مدعومًا كاسم مستعار قديم.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

يطبع `config get <path> --json` القيمة الخام بصيغة JSON بدلًا من النص المنسق للطرفية.

يستبدل إسناد الكائنات المسار الهدف افتراضيًا. وترفض مسارات الخرائط/القوائم المحمية
التي تحتوي عادةً على إدخالات مضافة من المستخدم، مثل `agents.defaults.models`,
و`models.providers`, و`models.providers.<id>.models`, و`plugins.entries`, و
`auth.profiles`، عمليات الاستبدال التي قد تزيل إدخالات موجودة ما لم
تمرر `--replace`.

استخدم `--merge` عند إضافة إدخالات إلى تلك الخرائط:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

استخدم `--replace` فقط عندما تريد عمدًا أن تصبح القيمة المُمرَّرة
هي القيمة الكاملة للهدف.

## أوضاع `config set`

يدعم `openclaw config set` أربعة أنماط للإسناد:

1. وضع القيمة: `openclaw config set <path> <value>`
2. وضع منشئ SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. وضع منشئ المزوّد (لمسار `secrets.providers.<alias>` فقط):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. وضع الدفعات (`--batch-json` أو `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

ملاحظة السياسة:

- تُرفَض إسنادات SecretRef على الأسطح غير المدعومة والقابلة للتغيير في وقت التشغيل (مثل `hooks.token`، و`commands.ownerDisplaySecret`، ورموز Webhook الخاصة بربط خيوط Discord، وJSON بيانات اعتماد WhatsApp). راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).

يستخدم تحليل الدفعات دائمًا حمولة الدفعة (`--batch-json`/`--batch-file`) كمصدر للحقيقة.
لا يغير `--strict-json` / `--json` سلوك تحليل الدفعات.

يبقى وضع مسار/قيمة JSON مدعومًا لكل من SecretRefs والمزوّدين:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## علامات منشئ المزوّد

يجب أن تستخدم أهداف منشئ المزوّد `secrets.providers.<alias>` كمسار.

العلامات الشائعة:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` ‏(`file`, `exec`)

مزوّد البيئة (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` ‏(قابل للتكرار)

مزوّد الملف (`--provider-source file`):

- `--provider-path <path>` ‏(مطلوب)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

مزوّد exec ‏(`--provider-source exec`):

- `--provider-command <path>` ‏(مطلوب)
- `--provider-arg <arg>` ‏(قابل للتكرار)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` ‏(قابل للتكرار)
- `--provider-pass-env <ENV_VAR>` ‏(قابل للتكرار)
- `--provider-trusted-dir <path>` ‏(قابل للتكرار)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

مثال مزوّد exec مُحصَّن:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## التشغيل التجريبي

استخدم `--dry-run` للتحقق من التغييرات دون كتابة `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

سلوك التشغيل التجريبي:

- وضع المنشئ: يشغّل فحوصات قابلية الحل لـ SecretRef للمراجع/المزوّدين المتغيرين.
- وضع JSON ‏(`--strict-json` أو `--json` أو وضع الدفعات): يشغّل التحقق من schema بالإضافة إلى فحوصات قابلية الحل لـ SecretRef.
- يعمل أيضًا التحقق من السياسة على أسطح أهداف SecretRef غير المدعومة المعروفة.
- تقيّم فحوصات السياسة كامل التهيئة بعد التغيير، لذلك لا يمكن لكتابات الكائنات الأصلية (مثل تعيين `hooks` ككائن) تجاوز التحقق من الأسطح غير المدعومة.
- تُتخطى فحوصات SecretRef الخاصة بـ exec افتراضيًا أثناء التشغيل التجريبي لتجنب الآثار الجانبية للأوامر.
- استخدم `--allow-exec` مع `--dry-run` للاشتراك في فحوصات SecretRef الخاصة بـ exec (قد يؤدي ذلك إلى تنفيذ أوامر المزوّد).
- `--allow-exec` خاص بالتشغيل التجريبي فقط ويُنتج خطأ إذا استُخدم دون `--dry-run`.

يطبع `--dry-run --json` تقريرًا قابلاً للقراءة الآلية:

- `ok`: ما إذا كان التشغيل التجريبي قد نجح
- `operations`: عدد الإسنادات التي جرى تقييمها
- `checks`: ما إذا كانت فحوصات schema/قابلية الحل قد شُغِّلت
- `checks.resolvabilityComplete`: ما إذا كانت فحوصات قابلية الحل قد اكتملت (تكون false عندما تُتخطى مراجع exec)
- `refsChecked`: عدد المراجع التي حُلَّت فعليًا أثناء التشغيل التجريبي
- `skippedExecRefs`: عدد مراجع exec التي جرى تخطيها لأن `--allow-exec` لم يُضبط
- `errors`: إخفاقات schema/قابلية الحل المنظمة عندما تكون `ok=false`

### شكل إخراج JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // موجود لأخطاء قابلية الحل
    },
  ],
}
```

مثال نجاح:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

مثال فشل:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

إذا فشل التشغيل التجريبي:

- `config schema validation failed`: شكل التهيئة بعد التغيير غير صالح؛ أصلح المسار/القيمة أو شكل كائن المزوّد/المرجع.
- `Config policy validation failed: unsupported SecretRef usage`: انقل بيانات الاعتماد تلك مرة أخرى إلى إدخال plaintext/string، واحتفظ بـ SecretRefs على الأسطح المدعومة فقط.
- `SecretRef assignment(s) could not be resolved`: لا يمكن حاليًا حل المزوّد/المرجع المشار إليه (متغير بيئة مفقود، أو مؤشر ملف غير صالح، أو فشل مزوّد exec، أو عدم تطابق المزوّد/المصدر).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: تخطى التشغيل التجريبي مراجع exec؛ أعد التشغيل مع `--allow-exec` إذا كنت تحتاج إلى التحقق من قابلية حل exec.
- بالنسبة إلى وضع الدفعات، أصلح الإدخالات الفاشلة وأعد تشغيل `--dry-run` قبل الكتابة.

## أمان الكتابة

تتحقق `openclaw config set` وغيرها من أدوات كتابة التهيئة المملوكة لـ OpenClaw من
التهيئة الكاملة بعد التغيير قبل تثبيتها على القرص. وإذا فشلت الحمولة الجديدة في
التحقق من schema أو بدت كأنها طمس تدميري، يُترك ملف التهيئة النشط كما هو
وتُحفَظ الحمولة المرفوضة إلى جانبه باسم `openclaw.json.rejected.*`.
يجب أن يكون مسار ملف التهيئة النشط ملفًا عاديًا. لا تُدعَم تخطيطات
`openclaw.json` المرتبطة بروابط رمزية عند الكتابة؛ استخدم `OPENCLAW_CONFIG_PATH` للإشارة مباشرةً
إلى الملف الحقيقي بدلًا من ذلك.

فضّل الكتابة عبر CLI للتعديلات الصغيرة:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

إذا رُفضت كتابة، فافحص الحمولة المحفوظة وأصلح شكل التهيئة الكامل:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

لا تزال عمليات الكتابة المباشرة من المحرر مسموحًا بها، لكن Gateway الجاري تشغيله يعاملها على أنها
غير موثوقة إلى أن تصبح صالحة. يمكن استعادة التعديلات المباشرة غير الصالحة من
نسخة الاحتياط الأخيرة المعروفة الصالحة أثناء بدء التشغيل أو إعادة التحميل السريع. راجع
[استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config).

## الأوامر الفرعية

- `config file`: اطبع مسار ملف التهيئة النشط (يُحل من `OPENCLAW_CONFIG_PATH` أو من الموقع الافتراضي). يجب أن يسمّي المسار ملفًا عاديًا، لا رابطًا رمزيًا.

أعد تشغيل Gateway بعد التعديلات.

## التحقق

تحقق من صحة التهيئة الحالية مقابل schema النشطة دون بدء
Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

بعد نجاح `openclaw config validate`، يمكنك استخدام TUI المحلي ليقوم
وكيل مضمّن بمقارنة التهيئة النشطة مع الوثائق بينما تتحقق من
كل تغيير من الطرفية نفسها:

إذا كان التحقق يفشل بالفعل، فابدأ بـ `openclaw configure` أو
`openclaw doctor --fix`. لا يتجاوز `openclaw chat` حارس
التهيئة غير الصالحة.

```bash
openclaw chat
```

ثم داخل TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

حلقة الإصلاح النموذجية:

- اطلب من الوكيل مقارنة التهيئة الحالية بصفحة الوثائق ذات الصلة واقتراح أصغر إصلاح ممكن.
- طبّق تعديلات مستهدفة باستخدام `openclaw config set` أو `openclaw configure`.
- أعد تشغيل `openclaw config validate` بعد كل تغيير.
- إذا نجح التحقق لكن وقت التشغيل لا يزال غير سليم، شغّل `openclaw doctor` أو `openclaw doctor --fix` للحصول على مساعدة في الترحيل والإصلاح.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [التهيئة](/ar/gateway/configuration)
