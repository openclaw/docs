---
read_when:
    - تريد قراءة التكوين أو تعديله بشكل غير تفاعلي
sidebarTitle: Config
summary: مرجع CLI لـ `openclaw config` (get/set/patch/unset/file/schema/validate)
title: التكوين
x-i18n:
    generated_at: "2026-05-06T17:52:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4e0d580347e162278277ddb33eed0e42105c5e85bac4325c07fa2cd700b831d
    source_path: cli/config.md
    workflow: 16
---

مساعدات الإعداد للتعديلات غير التفاعلية في `openclaw.json`: الحصول على القيم/تعيينها/تصحيحها/إلغاء تعيينها/الملف/المخطط/التحقق منها حسب المسار وطباعة ملف الإعداد النشط. شغّل الأمر بدون أمر فرعي لفتح معالج الإعداد (مثل `openclaw configure`).

<Note>
عندما تكون `OPENCLAW_NIX_MODE=1`، يتعامل OpenClaw مع `openclaw.json` على أنه غير قابل للتغيير. تظل الأوامر للقراءة فقط مثل `config get` و`config file` و`config schema` و`config validate` تعمل، لكن أوامر كتابة الإعداد ترفض التنفيذ. ينبغي للوكلاء تعديل مصدر Nix للتثبيت بدلاً من ذلك؛ وبالنسبة لتوزيعة nix-openclaw الرسمية، استخدم [البدء السريع مع nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) وعيّن القيم ضمن `programs.openclaw.config` أو `instances.<name>.config`.
</Note>

## خيارات الجذر

<ParamField path="--section <section>" type="string">
  مرشح قسم الإعداد الموجّه القابل للتكرار عند تشغيل `openclaw config` بدون أمر فرعي.
</ParamField>

الأقسام الموجّهة المدعومة: `workspace`، `model`، `web`، `gateway`، `daemon`، `channels`، `plugins`، `skills`، `health`.

## أمثلة

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

يطبع مخطط JSON المُولَّد لـ `openclaw.json` إلى stdout بصيغة JSON.

<AccordionGroup>
  <Accordion title="ما يتضمنه">
    - مخطط إعداد الجذر الحالي، بالإضافة إلى حقل سلسلة جذرية `$schema` لأدوات التحرير.
    - بيانات تعريف الوثائق `title` و`description` للحقول المستخدمة في Control UI.
    - ترث عُقد الكائنات المتداخلة، وحرف البدل (`*`)، وعناصر المصفوفة (`[]`) بيانات تعريف `title` / `description` نفسها عند وجود توثيق حقل مطابق.
    - ترث فروع `anyOf` / `oneOf` / `allOf` بيانات تعريف الوثائق نفسها أيضاً عند وجود توثيق حقل مطابق.
    - بيانات تعريف مخطط Plugin والقناة المباشرة بأفضل جهد عند إمكانية تحميل بيانات manifest وقت التشغيل.
    - مخطط احتياطي نظيف حتى عندما يكون الإعداد الحالي غير صالح.

  </Accordion>
  <Accordion title="RPC وقت التشغيل المرتبط">
    يعيد `config.schema.lookup` مسار إعداد واحداً مطبّعاً مع عقدة مخطط سطحية (`title`، `description`، `type`، `enum`، `const`، والحدود الشائعة)، وبيانات تعريف تلميحات واجهة المستخدم المطابقة، وملخصات الأبناء المباشرين. استخدمه للتنقيب محدود المسار في Control UI أو العملاء المخصصين.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

مرّره إلى ملف عندما تريد فحصه أو التحقق منه باستخدام أدوات أخرى:

```bash
openclaw config schema > openclaw.schema.json
```

### المسارات

تستخدم المسارات ترميز النقاط أو الأقواس:

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

تُحلَّل القيم كـ JSON5 عند الإمكان؛ وإلا فتُعامل كسلاسل نصية. استخدم `--strict-json` لاشتراط تحليل JSON5. يظل `--json` مدعوماً كاسم مستعار قديم.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

يطبع `config get <path> --json` القيمة الخام بصيغة JSON بدلاً من نص منسق للطرفية.

<Note>
يستبدل إسناد الكائن المسار الهدف افتراضياً. ترفض مسارات الخرائط/القوائم المحمية التي تحتوي عادةً على إدخالات أضافها المستخدم، مثل `agents.defaults.models` و`models.providers` و`models.providers.<id>.models` و`plugins.entries` و`auth.profiles`، عمليات الاستبدال التي قد تزيل إدخالات موجودة ما لم تمرر `--replace`.
</Note>

استخدم `--merge` عند إضافة إدخالات إلى تلك الخرائط:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

استخدم `--replace` فقط عندما تريد عمداً أن تصبح القيمة المقدمة هي القيمة الكاملة للهدف.

## أوضاع `config set`

يدعم `openclaw config set` أربعة أنماط للإسناد:

<Tabs>
  <Tab title="وضع القيمة">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="وضع بناء SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="وضع بناء المزوّد">
    يستهدف وضع بناء المزوّد مسارات `secrets.providers.<alias>` فقط:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="وضع الدُفعات">
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

  </Tab>
</Tabs>

<Warning>
تُرفض إسنادات SecretRef على الأسطح غير المدعومة القابلة للتغيير وقت التشغيل (مثل `hooks.token` و`commands.ownerDisplaySecret` ورموز Webhook ربط سلاسل Discord، وJSON بيانات اعتماد WhatsApp). راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Warning>

يستخدم تحليل الدُفعات دائماً حمولة الدُفعة (`--batch-json`/`--batch-file`) كمصدر للحقيقة. لا يغيّر `--strict-json` / `--json` سلوك تحليل الدُفعات.

## `config patch`

استخدم `config patch` عندما تريد لصق أو تمرير تصحيح بشكل إعداد بدلاً من تشغيل العديد من أوامر `config set` القائمة على المسارات. الإدخال كائن JSON5. تُدمج الكائنات تكرارياً، وتستبدل المصفوفات والقيم العددية القيمة الهدف، وتحذف `null` المسار الهدف.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

يمكنك أيضاً تمرير تصحيح عبر stdin، وهذا مفيد لبرامج إعداد الخوادم البعيدة:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

مثال على تصحيح:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

استخدم `--replace-path <path>` عندما يجب أن يصبح كائن أو مصفوفة واحد بالضبط القيمة المقدمة بدلاً من تصحيحه تكرارياً:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

يشغّل `--dry-run` فحوصات المخطط وقابلية حل SecretRef بدون كتابة. تُتخطى SecretRefs المدعومة بـ exec افتراضياً أثناء التشغيل التجريبي؛ أضف `--allow-exec` عندما تريد عمداً أن ينفّذ التشغيل التجريبي أوامر المزوّد.

يظل وضع مسار/قيمة JSON مدعوماً لكل من SecretRefs والمزوّدين:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## أعلام بناء المزوّد

يجب أن تستخدم أهداف بناء المزوّد `secrets.providers.<alias>` كمسار.

<AccordionGroup>
  <Accordion title="الأعلام الشائعة">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="مزوّد Env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (قابل للتكرار)

  </Accordion>
  <Accordion title="مزوّد File (--provider-source file)">
    - `--provider-path <path>` (مطلوب)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="مزوّد Exec (--provider-source exec)">
    - `--provider-command <path>` (مطلوب)
    - `--provider-arg <arg>` (قابل للتكرار)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (قابل للتكرار)
    - `--provider-pass-env <ENV_VAR>` (قابل للتكرار)
    - `--provider-trusted-dir <path>` (قابل للتكرار)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

مثال على مزوّد exec مقوّى:

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

استخدم `--dry-run` للتحقق من التغييرات بدون كتابة `openclaw.json`.

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

<AccordionGroup>
  <Accordion title="سلوك التشغيل التجريبي">
    - وضع البناء: يشغّل فحوصات قابلية حل SecretRef للمراجع/المزوّدين المتغيرين.
    - وضع JSON (`--strict-json`، `--json`، أو وضع الدُفعات): يشغّل التحقق من المخطط بالإضافة إلى فحوصات قابلية حل SecretRef.
    - يعمل التحقق من السياسة أيضاً للأسطح الهدف المعروفة غير المدعومة لـ SecretRef.
    - تقيّم فحوصات السياسة الإعداد الكامل بعد التغيير، لذلك لا يمكن لكتابات الكائن الأب (مثل تعيين `hooks` ككائن) تجاوز التحقق من الأسطح غير المدعومة.
    - تُتخطى فحوصات SecretRef من نوع Exec افتراضياً أثناء التشغيل التجريبي لتجنب الآثار الجانبية للأوامر.
    - استخدم `--allow-exec` مع `--dry-run` للاشتراك في فحوصات SecretRef من نوع exec (قد ينفّذ هذا أوامر المزوّد).
    - `--allow-exec` مخصص للتشغيل التجريبي فقط ويُنتج خطأ إذا استُخدم بدون `--dry-run`.

  </Accordion>
  <Accordion title="حقول --dry-run --json">
    يطبع `--dry-run --json` تقريراً قابلاً للقراءة آلياً:

    - `ok`: ما إذا كان التشغيل التجريبي قد نجح
    - `operations`: عدد التعيينات التي تم تقييمها
    - `checks`: ما إذا كانت فحوصات المخطط/إمكانية الحل قد شُغّلت
    - `checks.resolvabilityComplete`: ما إذا كانت فحوصات إمكانية الحل قد اكتملت (تكون false عند تخطي مراجع exec)
    - `refsChecked`: عدد المراجع التي حُلّت فعليًا أثناء التشغيل التجريبي
    - `skippedExecRefs`: عدد مراجع exec التي تم تخطيها لأن `--allow-exec` لم يكن مضبوطًا
    - `errors`: إخفاقات منظمة في المخطط/إمكانية الحل عندما تكون `ok=false`

  </Accordion>
</AccordionGroup>

### شكل مخرجات JSON

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
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Success example">
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
  </Tab>
  <Tab title="Failure example">
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
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="If dry-run fails">
    - `config schema validation failed`: شكل الإعدادات بعد التغيير غير صالح؛ أصلح المسار/القيمة أو شكل كائن المزود/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: انقل بيانات الاعتماد تلك مرة أخرى إلى إدخال نص عادي/سلسلة نصية، وأبقِ SecretRefs على الأسطح المدعومة فقط.
    - `SecretRef assignment(s) could not be resolved`: لا يمكن حاليًا حل المزود/ref المشار إليه (متغير بيئة مفقود، مؤشر ملف غير صالح، فشل مزود exec، أو عدم تطابق المزود/المصدر).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: تخطى التشغيل التجريبي مراجع exec؛ أعد التشغيل باستخدام `--allow-exec` إذا كنت تحتاج إلى التحقق من إمكانية حل exec.
    - في وضع الدُفعات، أصلح الإدخالات الفاشلة وأعد تشغيل `--dry-run` قبل الكتابة.

  </Accordion>
</AccordionGroup>

## أمان الكتابة

يتحقق `openclaw config set` وغيره من كتّاب الإعدادات المملوكين لـ OpenClaw من الإعدادات الكاملة بعد التغيير قبل تثبيتها على القرص. إذا فشل الحمولة الجديدة في تحقق المخطط أو بدت كاستبدال تدميري، تُترك الإعدادات النشطة كما هي وتُحفظ الحمولة المرفوضة بجانبها باسم `openclaw.json.rejected.*`.

<Warning>
يجب أن يكون مسار الإعدادات النشط ملفًا عاديًا. تخطيطات `openclaw.json` المرتبطة رمزيًا غير مدعومة للكتابة؛ استخدم `OPENCLAW_CONFIG_PATH` للإشارة مباشرةً إلى الملف الحقيقي بدلًا من ذلك.
</Warning>

فضّل الكتابة عبر CLI للتعديلات الصغيرة:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

إذا رُفضت كتابة، افحص الحمولة المحفوظة وأصلح شكل الإعدادات الكامل:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

ما تزال الكتابة المباشرة بالمحرر مسموحة، لكن Gateway الجاري يعاملها كغير موثوقة حتى تنجح في التحقق. تؤدي التعديلات المباشرة غير الصالحة إلى فشل بدء التشغيل أو يتم تخطيها بواسطة إعادة التحميل الساخنة؛ لا يعيد Gateway كتابة `openclaw.json`. شغّل `openclaw doctor --fix` لإصلاح الإعدادات ذات البادئات/المستبدلة أو لاستعادة آخر نسخة سليمة معروفة. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config).

استرداد الملف الكامل مخصص لإصلاح doctor. تبقى تغييرات مخطط Plugin أو انحراف `minHostVersion` واضحة بدلًا من التراجع عن إعدادات المستخدم غير المرتبطة مثل النماذج، والمزودين، وملفات تعريف المصادقة، والقنوات، وتعريض Gateway، والأدوات، والذاكرة، والمتصفح، أو إعدادات cron.

## الأوامر الفرعية

- `config file`: اطبع مسار ملف الإعدادات النشط (المحلول من `OPENCLAW_CONFIG_PATH` أو الموقع الافتراضي). ينبغي أن يحدد المسار ملفًا عاديًا، لا رابطًا رمزيًا.

أعد تشغيل Gateway بعد التعديلات.

## التحقق

تحقق من الإعدادات الحالية مقابل المخطط النشط دون بدء Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

بعد نجاح `openclaw config validate`، يمكنك استخدام TUI المحلي لجعل وكيل مضمّن يقارن الإعدادات النشطة بالوثائق أثناء تحققك من كل تغيير من الطرفية نفسها:

<Note>
إذا كان التحقق يفشل بالفعل، فابدأ بـ `openclaw configure` أو `openclaw doctor --fix`. لا يتجاوز `openclaw chat` حارس الإعدادات غير الصالحة.
</Note>

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

حلقة الإصلاح المعتادة:

<Steps>
  <Step title="Compare with docs">
    اطلب من الوكيل مقارنة إعداداتك الحالية بصفحة الوثائق ذات الصلة واقتراح أصغر إصلاح.
  </Step>
  <Step title="Apply targeted edits">
    طبّق تعديلات مستهدفة باستخدام `openclaw config set` أو `openclaw configure`.
  </Step>
  <Step title="Re-validate">
    أعد تشغيل `openclaw config validate` بعد كل تغيير.
  </Step>
  <Step title="Doctor for runtime issues">
    إذا نجح التحقق لكن وقت التشغيل ما يزال غير سليم، فشغّل `openclaw doctor` أو `openclaw doctor --fix` للحصول على مساعدة في الترحيل والإصلاح.
  </Step>
</Steps>

## ذات صلة

- [مرجع CLI](/ar/cli)
- [الإعدادات](/ar/gateway/configuration)
