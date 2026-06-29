---
read_when:
    - تريد قراءة التكوين أو تعديله دون تفاعل
sidebarTitle: Config
summary: مرجع CLI لـ `openclaw config` (get/set/patch/unset/file/schema/validate)
title: الإعدادات
x-i18n:
    generated_at: "2026-06-28T22:33:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

مساعدات إعدادات للتعديلات غير التفاعلية في `openclaw.json`: الحصول/التعيين/التصحيح/إلغاء التعيين/الملف/المخطط/التحقق من القيم حسب المسار وطباعة ملف الإعدادات النشط. شغّلها دون أمر فرعي لفتح معالج التهيئة (مثل `openclaw configure`).

<Note>
عند تعيين `OPENCLAW_NIX_MODE=1`، يتعامل OpenClaw مع `openclaw.json` باعتباره غير قابل للتغيير. تظل الأوامر للقراءة فقط مثل `config get` و`config file` و`config schema` و`config validate` تعمل، لكن أوامر كتابة الإعدادات ترفض التنفيذ. ينبغي للوكلاء تعديل مصدر Nix الخاص بالتثبيت بدلا من ذلك؛ وبالنسبة لتوزيعة nix-openclaw الرسمية، استخدم [البدء السريع في nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) واضبط القيم ضمن `programs.openclaw.config` أو `instances.<name>.config`.
</Note>

## خيارات الجذر

<ParamField path="--section <section>" type="string">
  مرشح قسم إعداد موجه قابل للتكرار عند تشغيل `openclaw config` دون أمر فرعي.
</ParamField>

الأقسام الموجهة المدعومة: `workspace` و`model` و`web` و`gateway` و`daemon` و`channels` و`plugins` و`skills` و`health`.

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
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
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

اطبع مخطط JSON المولّد لـ `openclaw.json` إلى stdout بصيغة JSON.

<AccordionGroup>
  <Accordion title="ما يتضمنه">
    - مخطط إعدادات الجذر الحالي، إضافة إلى حقل سلسلة `$schema` جذري لأدوات المحرر.
    - بيانات تعريف توثيقية للحقلين `title` و`description` تستخدمها واجهة Control UI.
    - ترث عقد الكائنات المتداخلة وحرف البدل (`*`) وعناصر المصفوفة (`[]`) بيانات تعريف `title` / `description` نفسها عند وجود توثيق مطابق للحقل.
    - ترث فروع `anyOf` / `oneOf` / `allOf` بيانات التعريف التوثيقية نفسها أيضا عند وجود توثيق مطابق للحقل.
    - بيانات تعريف مخطط Plugin + قناة مباشرة بأفضل جهد عندما يمكن تحميل بيانات manifest وقت التشغيل.
    - مخطط احتياطي نظيف حتى عندما تكون الإعدادات الحالية غير صالحة.

  </Accordion>
  <Accordion title="RPC وقت التشغيل ذي الصلة">
    يعيد `config.schema.lookup` مسار إعدادات واحدا مطبّعا مع عقدة مخطط سطحية (`title` و`description` و`type` و`enum` و`const` والحدود الشائعة)، وبيانات تعريف تلميح واجهة مستخدم مطابقة، وملخصات الأبناء المباشرين. استخدمه للتنقل التفصيلي محدود المسار في Control UI أو العملاء المخصصين.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

مرّره عبر أنبوب إلى ملف عندما تريد فحصه أو التحقق منه باستخدام أدوات أخرى:

```bash
openclaw config schema > openclaw.schema.json
```

### المسارات

تستخدم المسارات ترميز النقاط أو الأقواس. ضع مسارات ترميز الأقواس بين علامات اقتباس في أمثلة shell حتى لا توسع shells مثل zsh القيمة `[0]` كنمط glob قبل أن يتلقى OpenClaw المسار:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

استخدم فهرس قائمة الوكلاء لاستهداف وكيل محدد:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## القيم

تُحلل القيم كـ JSON5 عندما يكون ذلك ممكنا؛ وإلا فتُعامل كسلاسل. استخدم `--strict-json` لطلب تحليل JSON قياسي دون رجوع إلى السلاسل. يظل `--json` مدعوما كاسم بديل قديم لـ `--strict-json`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

عند تفعيل `--strict-json`، تُرفض صياغة JSON5 فقط مثل التعليقات أو الفواصل اللاحقة أو مفاتيح الكائنات غير المقتبسة. احذف `--strict-json` لتحليل قيم JSON5 مع الرجوع إلى السلسلة الخام.

يطبع `config get <path> --json` القيمة الخام بصيغة JSON بدلا من نص منسق للطرفية.

<Note>
يستبدل إسناد الكائن المسار الهدف افتراضيا. ترفض مسارات الخرائط/القوائم المحمية التي تحتفظ عادة بمدخلات يضيفها المستخدم، مثل `agents.defaults.models` و`models.providers` و`models.providers.<id>.models` و`plugins.entries` و`auth.profiles`، عمليات الاستبدال التي قد تزيل مدخلات موجودة ما لم تمرر `--replace`.
</Note>

استخدم `--merge` عند إضافة مدخلات إلى تلك الخرائط:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

استخدم `--replace` فقط عندما تريد عمدا أن تصبح القيمة المقدمة هي القيمة الهدف الكاملة.

## أوضاع `config set`

يدعم `openclaw config set` أربعة أنماط إسناد:

<Tabs>
  <Tab title="وضع القيمة">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="وضع منشئ SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="وضع منشئ المزوّد">
    يستهدف وضع منشئ المزوّد مسارات `secrets.providers.<alias>` فقط:

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
تُرفض تعيينات SecretRef على الأسطح غير المدعومة والقابلة للتغيير وقت التشغيل (مثل `hooks.token` و`commands.ownerDisplaySecret` ورموز Webhook ربط سلاسل Discord وبيانات اعتماد WhatsApp بصيغة JSON). راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Warning>

يستخدم تحليل الدُفعات دائما حمولة الدُفعة (`--batch-json`/`--batch-file`) كمصدر الحقيقة. لا يغير `--strict-json` / `--json` سلوك تحليل الدُفعات.

## `config patch`

استخدم `config patch` عندما تريد لصق أو تمرير تصحيح له شكل الإعدادات بدلا من تشغيل العديد من أوامر `config set` المعتمدة على المسارات. يكون الإدخال كائن JSON5. تُدمج الكائنات تكراريا، وتستبدل المصفوفات والقيم القياسية القيمة الهدف، وتحذف `null` المسار الهدف.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

يمكنك أيضا تمرير تصحيح عبر stdin، وهذا مفيد لنصوص الإعداد عن بُعد:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

مثال تصحيح:

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

استخدم `--replace-path <path>` عندما يجب أن يصبح كائن أو مصفوفة واحدة القيمة المقدمة بالضبط بدلا من تصحيحها تكراريا:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

يشغّل `--dry-run` فحوصات المخطط وقابلية حل SecretRef دون كتابة. تُتخطى SecretRefs المدعومة بـ exec افتراضيا أثناء التشغيل التجريبي؛ أضف `--allow-exec` عندما تريد عمدا أن ينفذ التشغيل التجريبي أوامر المزوّد.

يبقى وضع مسار/قيمة JSON مدعوما لكل من SecretRefs والمزوّدين:

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

<AccordionGroup>
  <Accordion title="علامات شائعة">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="مزوّد Env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (قابل للتكرار)

  </Accordion>
  <Accordion title="مزوّد الملفات (--provider-source file)">
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

مثال لمزوّد exec محصّن:

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

## تشغيل تجريبي

استخدم `--dry-run` للتحقق من التغييرات دون الكتابة إلى `openclaw.json`.

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
    - وضع المنشئ: يشغّل فحوصات قابلية حل SecretRef للمراجع/المزوّدين الذين تغيّروا.
    - وضع JSON (`--strict-json` أو `--json` أو وضع الدُفعات): يشغّل التحقق من المخطط بالإضافة إلى فحوصات قابلية حل SecretRef.
    - يعمل التحقق من السياسة أيضًا لأسطح أهداف SecretRef المعروفة بأنها غير مدعومة.
    - تقيّم فحوصات السياسة التهيئة الكاملة بعد التغيير، لذلك لا يمكن لعمليات الكتابة على الكائن الأب (على سبيل المثال تعيين `hooks` ككائن) تجاوز التحقق من الأسطح غير المدعومة.
    - يتم تخطي فحوصات Exec SecretRef افتراضيًا أثناء التشغيل التجريبي لتجنب الآثار الجانبية للأوامر.
    - استخدم `--allow-exec` مع `--dry-run` للاشتراك في فحوصات Exec SecretRef (قد يؤدي ذلك إلى تنفيذ أوامر المزوّد).
    - `--allow-exec` مخصص للتشغيل التجريبي فقط ويُظهر خطأ إذا استُخدم بدون `--dry-run`.

  </Accordion>
  <Accordion title="حقول --dry-run --json">
    يطبع `--dry-run --json` تقريرًا قابلًا للقراءة آليًا:

    - `ok`: ما إذا كان التشغيل التجريبي قد نجح
    - `operations`: عدد التعيينات التي تم تقييمها
    - `checks`: ما إذا كانت فحوصات المخطط/قابلية الحل قد شُغّلت
    - `checks.resolvabilityComplete`: ما إذا كانت فحوصات قابلية الحل قد اكتملت (false عند تخطي مراجع exec)
    - `refsChecked`: عدد المراجع التي تم حلها فعليًا أثناء التشغيل التجريبي
    - `skippedExecRefs`: عدد مراجع exec التي تم تخطيها لأن `--allow-exec` لم يكن معيّنًا
    - `errors`: إخفاقات منظمة للمسار المفقود أو المخطط أو قابلية الحل عندما تكون `ok=false`

  </Accordion>
</AccordionGroup>

### شكل إخراج JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="مثال نجاح">
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
  <Tab title="مثال فشل">
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
  <Accordion title="إذا فشل التشغيل التجريبي">
    - `config schema validation failed`: شكل التهيئة بعد التغيير غير صالح؛ أصلح المسار/القيمة أو شكل كائن المزوّد/المرجع.
    - `Config policy validation failed: unsupported SecretRef usage`: انقل بيانات الاعتماد هذه مرة أخرى إلى إدخال نص عادي/سلسلة نصية، وأبقِ SecretRefs على الأسطح المدعومة فقط.
    - `SecretRef assignment(s) could not be resolved`: لا يمكن حاليًا حل المزوّد/المرجع المشار إليه (متغير بيئة مفقود، مؤشر ملف غير صالح، فشل مزوّد exec، أو عدم تطابق بين المزوّد/المصدر).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: تخطى التشغيل التجريبي مراجع exec؛ أعد التشغيل باستخدام `--allow-exec` إذا كنت تحتاج إلى التحقق من قابلية حل exec.
    - في وضع الدُفعات، أصلح الإدخالات الفاشلة وأعد تشغيل `--dry-run` قبل الكتابة.

  </Accordion>
</AccordionGroup>

## أمان الكتابة

يتحقق `openclaw config set` وكتّاب التهيئة الآخرون المملوكون لـ OpenClaw من التهيئة الكاملة بعد التغيير قبل حفظها على القرص. إذا فشل الحمولة الجديدة في التحقق من المخطط أو بدت كاستبدال هدّام، تُترك التهيئة النشطة كما هي وتُحفظ الحمولة المرفوضة بجانبها باسم `openclaw.json.rejected.*`.

<Warning>
يجب أن يكون مسار التهيئة النشطة ملفًا عاديًا. تخطيطات `openclaw.json` ذات الروابط الرمزية غير مدعومة للكتابة؛ استخدم `OPENCLAW_CONFIG_PATH` للإشارة مباشرة إلى الملف الحقيقي بدلًا من ذلك.
</Warning>

فضّل الكتابة عبر CLI للتعديلات الصغيرة:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

إذا رُفضت كتابة، افحص الحمولة المحفوظة وأصلح شكل التهيئة الكامل:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

لا تزال الكتابة المباشرة بالمحرر مسموحة، لكن Gateway الجاري يعتبرها غير موثوقة حتى يتم التحقق منها. تؤدي التعديلات المباشرة غير الصالحة إلى فشل بدء التشغيل أو يتم تخطيها بواسطة إعادة التحميل الساخنة؛ لا يعيد Gateway كتابة `openclaw.json`. شغّل `openclaw doctor --fix` لإصلاح التهيئة ذات البادئات/المستبدلة بشكل خاطئ أو لاستعادة آخر نسخة جيدة معروفة. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config).

استعادة الملف بالكامل مخصصة لإصلاح doctor. تبقى تغييرات مخطط Plugin أو انحراف `minHostVersion` واضحة بدلًا من التراجع عن إعدادات المستخدم غير المرتبطة مثل النماذج والمزوّدين وملفات تعريف المصادقة والقنوات وتعرّض Gateway والأدوات والذاكرة والمتصفح أو تهيئة cron.

## الأوامر الفرعية

- `config file`: اطبع مسار ملف التهيئة النشطة (المحلول من `OPENCLAW_CONFIG_PATH` أو الموقع الافتراضي). يجب أن يسمّي المسار ملفًا عاديًا، وليس رابطًا رمزيًا.

أعد تشغيل gateway بعد التعديلات.

## التحقق

تحقق من التهيئة الحالية مقابل المخطط النشط بدون بدء Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

بعد أن ينجح `openclaw config validate`، يمكنك استخدام TUI المحلي لجعل وكيل مضمّن يقارن التهيئة النشطة بالوثائق أثناء تحققك من كل تغيير من الطرفية نفسها:

<Note>
إذا كان التحقق يفشل بالفعل، فابدأ بـ `openclaw configure` أو `openclaw doctor --fix`. لا يتجاوز `openclaw chat` حارس التهيئة غير الصالحة.
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
  <Step title="المقارنة مع الوثائق">
    اطلب من الوكيل مقارنة التهيئة الحالية لديك بصفحة الوثائق ذات الصلة واقتراح أصغر إصلاح.
  </Step>
  <Step title="تطبيق تعديلات موجهة">
    طبّق تعديلات موجهة باستخدام `openclaw config set` أو `openclaw configure`.
  </Step>
  <Step title="إعادة التحقق">
    أعد تشغيل `openclaw config validate` بعد كل تغيير.
  </Step>
  <Step title="Doctor لمشكلات وقت التشغيل">
    إذا نجح التحقق لكن وقت التشغيل لا يزال غير سليم، فشغّل `openclaw doctor` أو `openclaw doctor --fix` للحصول على مساعدة في الترحيل والإصلاح.
  </Step>
</Steps>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [التهيئة](/ar/gateway/configuration)
