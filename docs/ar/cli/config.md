---
read_when:
    - تريد قراءة التكوين أو تعديله بشكل غير تفاعلي
sidebarTitle: Config
summary: مرجع CLI لـ `openclaw config` (get/set/patch/unset/file/schema/validate)
title: التكوين
x-i18n:
    generated_at: "2026-05-03T21:28:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7be6a2ff8474fe78deb1d32dd822a4cf8a2b420dfb45306be5d7c5a1d54f0b4d
    source_path: cli/config.md
    workflow: 16
---

مساعدات الإعدادات للتعديلات غير التفاعلية في `openclaw.json`: جلب/تعيين/تصحيح/إلغاء تعيين/ملف/مخطط/التحقق من القيم حسب المسار وطباعة ملف الإعدادات النشط. شغّله من دون أمر فرعي لفتح معالج الإعدادات (مثل `openclaw configure`).

## خيارات الجذر

<ParamField path="--section <section>" type="string">
  مرشح قابل للتكرار لقسم الإعداد الموجّه عند تشغيل `openclaw config` من دون أمر فرعي.
</ParamField>

أقسام الإعداد الموجّه المدعومة: `workspace`، `model`، `web`، `gateway`، `daemon`، `channels`، `plugins`، `skills`، `health`.

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
  <Accordion title="What it includes">
    - مخطط إعدادات الجذر الحالي، بالإضافة إلى حقل سلسلة نصية جذري `$schema` لأدوات المحرر.
    - بيانات تعريف الوثائق للحقلين `title` و`description` المستخدمة بواسطة واجهة Control UI.
    - ترث عقد الكائنات المتداخلة، وحروف البدل (`*`)، وعناصر المصفوفات (`[]`) بيانات تعريف `title` / `description` نفسها عند وجود توثيق حقل مطابق.
    - ترث فروع `anyOf` / `oneOf` / `allOf` بيانات تعريف الوثائق نفسها أيضا عند وجود توثيق حقل مطابق.
    - بيانات تعريف مخطط Plugin + القناة المباشرة بأفضل جهد عند إمكانية تحميل بيانات manifest في وقت التشغيل.
    - مخطط احتياطي نظيف حتى عندما تكون الإعدادات الحالية غير صالحة.

  </Accordion>
  <Accordion title="Related runtime RPC">
    يعيد `config.schema.lookup` مسارا واحدا مُطبَّعا للإعدادات مع عقدة مخطط سطحية (`title`، `description`، `type`، `enum`، `const`، الحدود الشائعة)، وبيانات تعريف تلميحات واجهة مستخدم مطابقة، وملخصات فورية للعناصر الفرعية. استخدمه للتنقل التفصيلي المحدد بالمسار في Control UI أو العملاء المخصصين.
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

تستخدم المسارات تدوين النقطة أو الأقواس:

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

تُحلل القيم بصيغة JSON5 عندما يكون ذلك ممكنا؛ وإلا تُعامل كسلاسل نصية. استخدم `--strict-json` لفرض تحليل JSON5. يبقى `--json` مدعوما كاسم مستعار قديم.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

يطبع `config get <path> --json` القيمة الخام بصيغة JSON بدلا من نص منسق للطرفية.

<Note>
يستبدل تعيين الكائن المسار الهدف افتراضيا. ترفض مسارات الخرائط/القوائم المحمية التي عادة ما تحتوي على إدخالات مضافة من المستخدم، مثل `agents.defaults.models` و`models.providers` و`models.providers.<id>.models` و`plugins.entries` و`auth.profiles`، عمليات الاستبدال التي قد تزيل إدخالات موجودة ما لم تمرر `--replace`.
</Note>

استخدم `--merge` عند إضافة إدخالات إلى تلك الخرائط:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

استخدم `--replace` فقط عندما تريد عمدا أن تصبح القيمة المقدمة هي القيمة الهدف الكاملة.

## أوضاع `config set`

يدعم `openclaw config set` أربعة أنماط تعيين:

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    يستهدف وضع منشئ الموفر مسارات `secrets.providers.<alias>` فقط:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
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
تُرفض تعيينات SecretRef على الأسطح غير المدعومة والقابلة للتغيير في وقت التشغيل (على سبيل المثال `hooks.token`، و`commands.ownerDisplaySecret`، ورموز Webhook الخاصة بربط سلاسل Discord، وJSON لبيانات اعتماد WhatsApp). راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Warning>

يستخدم تحليل الدُفعات دائما حمولة الدُفعة (`--batch-json`/`--batch-file`) كمصدر للحقيقة. لا يغير `--strict-json` / `--json` سلوك تحليل الدُفعات.

## `config patch`

استخدم `config patch` عندما تريد لصق أو تمرير تصحيح على شكل إعدادات بدلا من تشغيل العديد من أوامر `config set` المستندة إلى المسارات. الإدخال هو كائن JSON5. تندمج الكائنات تكراريا، وتستبدل المصفوفات والقيم العددية القيمة الهدف، ويحذف `null` المسار الهدف.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

يمكنك أيضا تمرير تصحيح عبر stdin، وهو مفيد لبرامج إعداد المضيفات البعيدة:

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

يشغّل `--dry-run` فحوصات المخطط وقابلية حل SecretRef من دون كتابة. تُتخطى SecretRefs المدعومة بـ exec افتراضيا أثناء التشغيل التجريبي؛ أضف `--allow-exec` عندما تريد عمدا أن ينفذ التشغيل التجريبي أوامر الموفر.

يبقى وضع مسار/قيمة JSON مدعوما لكل من SecretRefs والموفرين:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## علامات منشئ الموفر

يجب أن تستخدم أهداف منشئ الموفر `secrets.providers.<alias>` كمسار.

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`، `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (قابل للتكرار)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (مطلوب)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
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

مثال على موفر exec مقوى:

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

استخدم `--dry-run` للتحقق من التغييرات من دون كتابة `openclaw.json`.

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
  <Accordion title="Dry-run behavior">
    - وضع المنشئ: يشغّل فحوصات قابلية حل SecretRef للمراجع/الموفرين المتغيرين.
    - وضع JSON (`--strict-json` أو `--json` أو وضع الدُفعات): يشغّل التحقق من المخطط بالإضافة إلى فحوصات قابلية حل SecretRef.
    - يعمل التحقق من السياسة أيضا للأسطح الهدف المعروفة غير المدعومة لـ SecretRef.
    - تقيّم فحوصات السياسة إعدادات ما بعد التغيير كاملة، لذلك لا يمكن لكتابات الكائن الأصل (مثل تعيين `hooks` ككائن) تجاوز التحقق من الأسطح غير المدعومة.
    - تُتخطى فحوصات SecretRef الخاصة بـ exec افتراضيا أثناء التشغيل التجريبي لتجنب الآثار الجانبية للأوامر.
    - استخدم `--allow-exec` مع `--dry-run` للاشتراك في فحوصات SecretRef الخاصة بـ exec (قد ينفذ ذلك أوامر الموفر).
    - `--allow-exec` مخصص للتشغيل التجريبي فقط ويُرجع خطأ إذا استُخدم من دون `--dry-run`.

  </Accordion>
  <Accordion title="--dry-run --json fields">
    يطبع `--dry-run --json` تقريرا قابلا للقراءة آليا:

    - `ok`: ما إذا كان التشغيل التجريبي قد نجح
    - `operations`: عدد التعيينات التي تم تقييمها
    - `checks`: ما إذا كانت فحوصات المخطط/قابلية الحل قد شُغلت
    - `checks.resolvabilityComplete`: ما إذا كانت فحوصات قابلية الحل قد اكتملت (false عندما تُتخطى مراجع exec)
    - `refsChecked`: عدد المراجع التي تم حلها فعليا أثناء التشغيل التجريبي
    - `skippedExecRefs`: عدد مراجع exec التي تُخطيت لأن `--allow-exec` لم يكن معينا
    - `errors`: إخفاقات مخطط/قابلية حل منظمة عندما تكون `ok=false`

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
  <Accordion title="إذا فشل dry-run">
    - `config schema validation failed`: شكل الإعدادات بعد التغيير غير صالح؛ أصلح المسار/القيمة أو شكل كائن المزوّد/المرجع.
    - `Config policy validation failed: unsupported SecretRef usage`: انقل بيانات الاعتماد هذه مرة أخرى إلى إدخال نص عادي/سلسلة نصية، وأبقِ SecretRefs على الأسطح المدعومة فقط.
    - `SecretRef assignment(s) could not be resolved`: يتعذر حل المزوّد/المرجع المشار إليه حاليًا (متغير بيئة مفقود، مؤشر ملف غير صالح، فشل مزوّد exec، أو عدم تطابق المزوّد/المصدر).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: تخطى dry-run مراجع exec؛ أعد التشغيل باستخدام `--allow-exec` إذا كنت تحتاج إلى التحقق من قابلية حل exec.
    - في وضع الدُفعات، أصلح الإدخالات الفاشلة وأعد تشغيل `--dry-run` قبل الكتابة.

  </Accordion>
</AccordionGroup>

## أمان الكتابة

يتحقق `openclaw config set` وكتّاب الإعدادات الآخرون المملوكون لـ OpenClaw من الإعدادات الكاملة بعد التغيير قبل تثبيتها على القرص. إذا فشلت الحمولة الجديدة في التحقق من المخطط أو بدت كاستبدال هدّام، تُترك الإعدادات النشطة كما هي، وتُحفظ الحمولة المرفوضة بجانبها باسم `openclaw.json.rejected.*`.

<Warning>
يجب أن يكون مسار الإعدادات النشطة ملفًا عاديًا. تخطيطات `openclaw.json` المرتبطة رمزيًا غير مدعومة للكتابة؛ استخدم `OPENCLAW_CONFIG_PATH` للإشارة مباشرةً إلى الملف الحقيقي بدلًا من ذلك.
</Warning>

فضّل كتابات CLI للتعديلات الصغيرة:

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

ما زالت كتابات المحرر المباشرة مسموحة، لكن Gateway قيد التشغيل يعاملها كغير موثوقة إلى أن تجتاز التحقق. تفشل التعديلات المباشرة غير الصالحة في بدء التشغيل أو يتم تخطيها بواسطة إعادة التحميل الساخنة؛ لا يعيد Gateway كتابة `openclaw.json`. شغّل `openclaw doctor --fix` لإصلاح الإعدادات ذات البادئات/المستبدلة أو لاستعادة آخر نسخة سليمة معروفة. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config).

استرداد الملف بالكامل مخصص لإصلاح الطبيب. تبقى تغييرات مخطط Plugin أو عدم توافق `minHostVersion` واضحة بدلًا من التراجع عن إعدادات مستخدم غير مرتبطة مثل النماذج، والمزوّدين، وملفات تعريف المصادقة، والقنوات، وتعريض Gateway، والأدوات، والذاكرة، والمتصفح، أو إعدادات cron.

## الأوامر الفرعية

- `config file`: يطبع مسار ملف الإعدادات النشط (المحلول من `OPENCLAW_CONFIG_PATH` أو الموقع الافتراضي). ينبغي أن يسمي المسار ملفًا عاديًا، لا رابطًا رمزيًا.

أعد تشغيل Gateway بعد التعديلات.

## التحقق

تحقق من الإعدادات الحالية مقابل المخطط النشط دون بدء Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

بعد نجاح `openclaw config validate`، يمكنك استخدام TUI المحلي ليقارن وكيل مضمّن الإعدادات النشطة بالوثائق أثناء تحققك من كل تغيير من الطرفية نفسها:

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

حلقة الإصلاح النموذجية:

<Steps>
  <Step title="قارن بالوثائق">
    اطلب من الوكيل مقارنة إعداداتك الحالية بصفحة الوثائق ذات الصلة واقتراح أصغر إصلاح.
  </Step>
  <Step title="طبّق تعديلات مستهدفة">
    طبّق التعديلات المستهدفة باستخدام `openclaw config set` أو `openclaw configure`.
  </Step>
  <Step title="أعد التحقق">
    أعد تشغيل `openclaw config validate` بعد كل تغيير.
  </Step>
  <Step title="الطبيب لمشكلات وقت التشغيل">
    إذا نجح التحقق لكن وقت التشغيل ما زال غير سليم، فشغّل `openclaw doctor` أو `openclaw doctor --fix` للحصول على مساعدة في الترحيل والإصلاح.
  </Step>
</Steps>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإعدادات](/ar/gateway/configuration)
