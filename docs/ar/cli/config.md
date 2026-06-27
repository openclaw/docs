---
read_when:
    - تريد قراءة الإعدادات أو تعديلها بشكل غير تفاعلي
sidebarTitle: Config
summary: مرجع CLI لـ `openclaw config` (get/set/patch/unset/file/schema/validate)
title: الإعدادات
x-i18n:
    generated_at: "2026-06-27T17:20:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

مساعدات الإعدادات للتعديلات غير التفاعلية في `openclaw.json`: الحصول على القيم أو ضبطها أو ترقيعها أو إلغاء ضبطها أو عرض الملف أو المخطط أو التحقق منها حسب المسار، وطباعة ملف الإعدادات النشط. شغّل الأمر بدون أمر فرعي لفتح معالج الإعداد (مثل `openclaw configure`).

<Note>
عند ضبط `OPENCLAW_NIX_MODE=1`، يعامل OpenClaw ملف `openclaw.json` على أنه غير قابل للتغيير. تظل الأوامر المخصصة للقراءة فقط مثل `config get` و`config file` و`config schema` و`config validate` تعمل، لكن أوامر كتابة الإعدادات ترفض التنفيذ. ينبغي للوكلاء تعديل مصدر Nix للتثبيت بدلاً من ذلك؛ ولتوزيعة nix-openclaw الرسمية، استخدم [بدء التشغيل السريع لـ nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) واضبط القيم ضمن `programs.openclaw.config` أو `instances.<name>.config`.
</Note>

## خيارات الجذر

<ParamField path="--section <section>" type="string">
  مرشح قسم الإعداد الموجّه، قابل للتكرار، عند تشغيل `openclaw config` بدون أمر فرعي.
</ParamField>

الأقسام الموجّهة المدعومة: `workspace` و`model` و`web` و`gateway` و`daemon` و`channels` و`plugins` و`skills` و`health`.

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

يطبع مخطط JSON المولّد لـ `openclaw.json` إلى stdout بصيغة JSON.

<AccordionGroup>
  <Accordion title="ما الذي يتضمنه">
    - مخطط إعدادات الجذر الحالي، بالإضافة إلى حقل نصي جذري `$schema` لأدوات المحررات.
    - بيانات تعريف التوثيق للحقلين `title` و`description` المستخدمة بواسطة واجهة Control UI.
    - ترث عُقد الكائنات المتداخلة، وأحرف البدل (`*`)، وعناصر المصفوفة (`[]`) بيانات تعريف `title` / `description` نفسها عند وجود توثيق حقل مطابق.
    - ترث فروع `anyOf` / `oneOf` / `allOf` بيانات تعريف التوثيق نفسها أيضاً عند وجود توثيق حقل مطابق.
    - بيانات تعريف مخطط Plugin + قناة حية بأفضل جهد عندما يمكن تحميل بيانات runtime manifests.
    - مخطط احتياطي نظيف حتى عندما تكون الإعدادات الحالية غير صالحة.

  </Accordion>
  <Accordion title="runtime RPC ذو صلة">
    يعيد `config.schema.lookup` مسار إعدادات واحداً مطبّعاً مع عقدة مخطط سطحية (`title` و`description` و`type` و`enum` و`const` والحدود الشائعة)، وبيانات تعريف تلميح واجهة المستخدم المطابقة، وملخصات الأبناء المباشرين. استخدمه للتنقل التفصيلي محدود المسار في Control UI أو العملاء المخصصين.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

مرره إلى ملف عندما تريد فحصه أو التحقق منه باستخدام أدوات أخرى:

```bash
openclaw config schema > openclaw.schema.json
```

### المسارات

تستخدم المسارات ترميز النقاط أو الأقواس. ضع مسارات ترميز الأقواس بين علامات اقتباس في أمثلة shell حتى لا توسّع shells مثل zsh التعبير `[0]` كنمط glob قبل أن يتلقى OpenClaw المسار:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

استخدم فهرس قائمة الوكلاء لاستهداف وكيل معين:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## القيم

تُحلل القيم بصيغة JSON5 عندما يكون ذلك ممكناً؛ وإلا فتُعامل كسلاسل نصية. استخدم `--strict-json` لاشتراط تحليل JSON5. يظل `--json` مدعوماً كاسم مستعار قديم.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

يطبع `config get <path> --json` القيمة الخام بصيغة JSON بدلاً من نص منسق للطرفية.

<Note>
يستبدل إسناد الكائن المسار الهدف افتراضياً. ترفض مسارات الخرائط/القوائم المحمية التي عادةً ما تحتوي على إدخالات أضافها المستخدم، مثل `agents.defaults.models` و`models.providers` و`models.providers.<id>.models` و`plugins.entries` و`auth.profiles`، الاستبدالات التي قد تزيل إدخالات موجودة ما لم تمرر `--replace`.
</Note>

استخدم `--merge` عند إضافة إدخالات إلى تلك الخرائط:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

استخدم `--replace` فقط عندما تريد عمداً أن تصبح القيمة المقدمة هي القيمة الهدف الكاملة.

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
تُرفض إسنادات SecretRef على الأسطح غير المدعومة والقابلة للتغيير أثناء التشغيل (مثل `hooks.token` و`commands.ownerDisplaySecret` ورموز Webhook الخاصة بربط سلاسل Discord وبيانات اعتماد WhatsApp بصيغة JSON). راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Warning>

يستخدم تحليل الدُفعات دائماً حمولة الدُفعة (`--batch-json`/`--batch-file`) كمصدر الحقيقة. لا يغيّر `--strict-json` / `--json` سلوك تحليل الدُفعات.

## `config patch`

استخدم `config patch` عندما تريد لصق أو تمرير ترقيع بشكل الإعدادات بدلاً من تشغيل العديد من أوامر `config set` المعتمدة على المسارات. يكون الإدخال كائناً بصيغة JSON5. تُدمج الكائنات تكرارياً، وتستبدل المصفوفات والقيم القياسية القيمة الهدف، ويحذف `null` المسار الهدف.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

يمكنك أيضاً تمرير ترقيع عبر stdin، وهذا مفيد لسكربتات الإعداد عن بعد:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

مثال ترقيع:

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

استخدم `--replace-path <path>` عندما يجب أن يصبح كائن أو مصفوفة واحدة مطابقاً تماماً للقيمة المقدمة بدلاً من ترقيعه تكرارياً:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

يشغّل `--dry-run` فحوصات المخطط وقابلية حل SecretRef بدون كتابة. تُتخطى SecretRefs المدعومة بـ exec افتراضياً أثناء dry-run؛ أضف `--allow-exec` عندما تريد عمداً أن ينفذ dry-run أوامر المزوّد.

يظل وضع مسار/قيمة JSON مدعوماً لكل من SecretRefs والمزوّدين:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## أعلام منشئ المزوّد

يجب أن تستخدم أهداف منشئ المزوّد `secrets.providers.<alias>` كمسار.

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

مثال مزوّد exec مقوّى:

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

## Dry run

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
  <Accordion title="سلوك Dry-run">
    - وضع المنشئ: يشغّل فحوصات قابلية حل SecretRef للمراجع/المزوّدين المتغيرة.
    - وضع JSON (`--strict-json` أو `--json` أو وضع الدُفعات): يشغّل التحقق من المخطط بالإضافة إلى فحوصات قابلية حل SecretRef.
    - يعمل التحقق من السياسة أيضاً للأسطح الهدف المعروفة غير المدعومة لـ SecretRef.
    - تقيّم فحوصات السياسة الإعدادات الكاملة بعد التغيير، لذلك لا يمكن لعمليات كتابة كائنات الأصل (مثل ضبط `hooks` ككائن) تجاوز التحقق من الأسطح غير المدعومة.
    - تُتخطى فحوصات SecretRef من نوع Exec افتراضياً أثناء dry-run لتجنب الآثار الجانبية للأوامر.
    - استخدم `--allow-exec` مع `--dry-run` للاشتراك في فحوصات SecretRef من نوع exec (قد ينفذ هذا أوامر المزوّد).
    - يخص `--allow-exec` وضع dry-run فقط ويؤدي إلى خطأ إذا استُخدم بدون `--dry-run`.

  </Accordion>
  <Accordion title="حقول --dry-run --json">
    يطبع `--dry-run --json` تقريراً قابلاً للقراءة آلياً:

    - `ok`: ما إذا كان التشغيل التجريبي قد نجح
    - `operations`: عدد التعيينات التي تم تقييمها
    - `checks`: ما إذا كانت فحوصات المخطط/قابلية الحل قد شُغّلت
    - `checks.resolvabilityComplete`: ما إذا كانت فحوصات قابلية الحل قد اكتملت (تكون false عند تخطي مراجع exec)
    - `refsChecked`: عدد المراجع التي تم حلها فعليًا أثناء التشغيل التجريبي
    - `skippedExecRefs`: عدد مراجع exec التي تم تخطيها لأن `--allow-exec` لم يكن مضبوطًا
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
    - `config schema validation failed`: شكل الإعدادات بعد التغيير غير صالح؛ أصلح المسار/القيمة أو شكل كائن المزوّد/المرجع.
    - `Config policy validation failed: unsupported SecretRef usage`: انقل بيانات الاعتماد هذه مرة أخرى إلى إدخال نصي صريح/string، وأبقِ SecretRefs على الأسطح المدعومة فقط.
    - `SecretRef assignment(s) could not be resolved`: لا يمكن حاليًا حل المزوّد/المرجع المشار إليه (متغير بيئة مفقود، مؤشر ملف غير صالح، فشل مزوّد exec، أو عدم تطابق المزوّد/المصدر).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: تخطى التشغيل التجريبي مراجع exec؛ أعد التشغيل مع `--allow-exec` إذا كنت تحتاج إلى التحقق من قابلية حل exec.
    - في وضع الدُفعات، أصلح الإدخالات الفاشلة وأعد تشغيل `--dry-run` قبل الكتابة.

  </Accordion>
</AccordionGroup>

## أمان الكتابة

يتحقق `openclaw config set` وكاتبو الإعدادات الآخرون المملوكون لـ OpenClaw من الإعدادات الكاملة بعد التغيير قبل تثبيتها على القرص. إذا فشلت الحمولة الجديدة في التحقق من المخطط أو بدت كأنها استبدال هدّام، تُترك الإعدادات النشطة كما هي وتُحفظ الحمولة المرفوضة بجانبها باسم `openclaw.json.rejected.*`.

<Warning>
يجب أن يكون مسار الإعدادات النشط ملفًا عاديًا. تخطيطات `openclaw.json` المرتبطة برمز غير مدعومة للكتابة؛ استخدم `OPENCLAW_CONFIG_PATH` للإشارة مباشرة إلى الملف الحقيقي بدلًا من ذلك.
</Warning>

فضّل الكتابة عبر CLI للتعديلات الصغيرة:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

إذا رُفضت الكتابة، افحص الحمولة المحفوظة وأصلح شكل الإعدادات الكامل:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

لا تزال الكتابة المباشرة عبر المحرر مسموحة، لكن Gateway قيد التشغيل يتعامل معها على أنها غير موثوقة حتى تجتاز التحقق. تؤدي التعديلات المباشرة غير الصالحة إلى فشل بدء التشغيل أو يتخطاها إعادة التحميل الساخن؛ لا يعيد Gateway كتابة `openclaw.json`. شغّل `openclaw doctor --fix` لإصلاح الإعدادات ذات البادئة/المستبدلة أو استعادة آخر نسخة معروفة صالحة. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config).

استرداد الملف بالكامل مخصص لإصلاح doctor. تبقى تغييرات مخطط Plugin أو عدم توافق `minHostVersion` ظاهرة بدلًا من التراجع عن إعدادات مستخدم غير ذات صلة مثل النماذج، والمزوّدين، وملفات تعريف المصادقة، والقنوات، وتعريض Gateway، والأدوات، والذاكرة، والمتصفح، أو إعدادات cron.

## الأوامر الفرعية

- `config file`: اطبع مسار ملف الإعدادات النشط (محلولًا من `OPENCLAW_CONFIG_PATH` أو الموقع الافتراضي). يجب أن يسمي المسار ملفًا عاديًا، لا رابطًا رمزيًا.

أعد تشغيل Gateway بعد التعديلات.

## التحقق

تحقق من الإعدادات الحالية مقابل المخطط النشط دون بدء Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

بعد نجاح `openclaw config validate`، يمكنك استخدام TUI المحلي ليقارن وكيل مضمّن الإعدادات النشطة مع المستندات بينما تتحقق من كل تغيير من الطرفية نفسها:

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
    اطلب من الوكيل مقارنة إعداداتك الحالية بصفحة المستندات ذات الصلة واقتراح أصغر إصلاح.
  </Step>
  <Step title="Apply targeted edits">
    طبّق تعديلات موجهة باستخدام `openclaw config set` أو `openclaw configure`.
  </Step>
  <Step title="Re-validate">
    أعد تشغيل `openclaw config validate` بعد كل تغيير.
  </Step>
  <Step title="Doctor for runtime issues">
    إذا نجح التحقق لكن وقت التشغيل لا يزال غير سليم، فشغّل `openclaw doctor` أو `openclaw doctor --fix` للحصول على مساعدة في الترحيل والإصلاح.
  </Step>
</Steps>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإعدادات](/ar/gateway/configuration)
