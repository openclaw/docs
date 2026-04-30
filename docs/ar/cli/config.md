---
read_when:
    - تريد قراءة التكوين أو تعديله دون تفاعل
sidebarTitle: Config
summary: مرجع CLI لـ `openclaw config` (get/set/patch/unset/file/schema/validate)
title: التكوين
x-i18n:
    generated_at: "2026-04-30T07:46:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f55c4b932d469cb9112d9f55b66f0ff88dbe066250651df7a0a753060a223d
    source_path: cli/config.md
    workflow: 16
---

مساعدات ضبط التكوين للتعديلات غير التفاعلية في `openclaw.json`: الحصول على القيم/تعيينها/تصحيحها/إلغاء تعيينها/عرض الملف/المخطط/التحقق منها حسب المسار وطباعة ملف التكوين النشط. شغّله بدون أمر فرعي لفتح معالج التكوين (مثل `openclaw configure`).

## خيارات الجذر

<ParamField path="--section <section>" type="string">
  مرشح قسم الإعداد الموجّه القابل للتكرار عند تشغيل `openclaw config` بدون أمر فرعي.
</ParamField>

أقسام الإعداد الموجّه المدعومة: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

اطبع مخطط JSON المولّد لـ `openclaw.json` إلى stdout بصيغة JSON.

<AccordionGroup>
  <Accordion title="ما يتضمنه">
    - مخطط تكوين الجذر الحالي، إضافةً إلى حقل سلسلة جذر `$schema` لأدوات المحرر.
    - بيانات تعريف توثيق الحقلين `title` و `description` المستخدمة بواسطة واجهة التحكم.
    - ترث عقد الكائنات المتداخلة، وأحرف البدل (`*`)، وعناصر المصفوفة (`[]`) بيانات تعريف `title` / `description` نفسها عند وجود توثيق حقل مطابق.
    - ترث فروع `anyOf` / `oneOf` / `allOf` بيانات تعريف التوثيق نفسها أيضاً عند وجود توثيق حقل مطابق.
    - بيانات تعريف مخطط حيّة بأفضل جهد للإضافة + القناة عند إمكانية تحميل بيانات manifests وقت التشغيل.
    - مخطط احتياطي نظيف حتى عندما يكون التكوين الحالي غير صالح.

  </Accordion>
  <Accordion title="RPC وقت التشغيل ذي الصلة">
    يعيد `config.schema.lookup` مسار تكوين واحداً مُطبّعاً مع عقدة مخطط سطحية (`title`, `description`, `type`, `enum`, `const`, الحدود الشائعة)، وبيانات تعريف تلميح واجهة المستخدم المطابقة، وملخصات الأبناء المباشرة. استخدمه للتنقل التفصيلي محدود المسار في واجهة التحكم أو العملاء المخصصين.
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

تُحلّل القيم كـ JSON5 عندما يكون ذلك ممكناً؛ وإلا فتُعامل كسلاسل. استخدم `--strict-json` لاشتراط تحليل JSON5. يظل `--json` مدعوماً كاسم بديل قديم.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

يطبع `config get <path> --json` القيمة الخام كـ JSON بدلاً من نص منسق للطرفية.

<Note>
يستبدل تعيين الكائن المسار الهدف افتراضياً. ترفض مسارات الخرائط/القوائم المحمية التي تحتوي عادةً على إدخالات يضيفها المستخدم، مثل `agents.defaults.models` و `models.providers` و `models.providers.<id>.models` و `plugins.entries` و `auth.profiles`، عمليات الاستبدال التي ستزيل إدخالات موجودة ما لم تمرر `--replace`.
</Note>

استخدم `--merge` عند إضافة إدخالات إلى تلك الخرائط:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

استخدم `--replace` فقط عندما تريد عمداً أن تصبح القيمة المقدمة هي القيمة الهدف الكاملة.

## أوضاع `config set`

يدعم `openclaw config set` أربعة أنماط تعيين:

<Tabs>
  <Tab title="وضع القيمة">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="وضع مُنشئ SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="وضع مُنشئ المزوّد">
    يستهدف وضع مُنشئ المزوّد مسارات `secrets.providers.<alias>` فقط:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="وضع الدفعات">
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
تُرفض تعيينات SecretRef على الأسطح غير المدعومة القابلة للتغيير وقت التشغيل (على سبيل المثال `hooks.token` و `commands.ownerDisplaySecret` ورموز Webhook لربط سلاسل Discord وبيانات اعتماد WhatsApp بصيغة JSON). راجع [سطح اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Warning>

يستخدم تحليل الدفعات دائماً حمولة الدفعة (`--batch-json`/`--batch-file`) كمصدر الحقيقة. لا يغير `--strict-json` / `--json` سلوك تحليل الدفعات.

## `config patch`

استخدم `config patch` عندما تريد لصق أو تمرير تصحيح على شكل تكوين بدلاً من تشغيل العديد من أوامر `config set` القائمة على المسارات. يكون الإدخال كائن JSON5. تُدمج الكائنات تكرارياً، وتستبدل المصفوفات والقيم العددية القيمة الهدف، ويحذف `null` المسار الهدف.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

يمكنك أيضاً تمرير تصحيح عبر stdin، وهذا مفيد لسكربتات الإعداد عن بُعد:

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

استخدم `--replace-path <path>` عندما يجب أن يصبح كائن أو مصفوفة واحد بالضبط القيمة المقدمة بدلاً من تصحيحه تكرارياً:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

يشغّل `--dry-run` فحوصات المخطط وقابلية حل SecretRef بدون كتابة. يتم تخطي SecretRefs المدعومة بـ exec افتراضياً أثناء التشغيل التجريبي؛ أضف `--allow-exec` عندما تريد عمداً أن ينفذ التشغيل التجريبي أوامر المزوّد.

يظل وضع مسار/قيمة JSON مدعوماً لكل من SecretRefs والمزوّدين:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## أعلام مُنشئ المزوّد

يجب أن تستخدم أهداف مُنشئ المزوّد `secrets.providers.<alias>` كمسار.

<AccordionGroup>
  <Accordion title="الأعلام الشائعة">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="مزوّد Env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (قابل للتكرار)

  </Accordion>
  <Accordion title="مزوّد الملف (--provider-source file)">
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

مثال مزوّد exec مُحصّن:

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
    - وضع المُنشئ: يشغّل فحوصات قابلية حل SecretRef للمراجع/المزوّدين المتغيرين.
    - وضع JSON (`--strict-json` أو `--json` أو وضع الدفعات): يشغّل التحقق من المخطط إضافةً إلى فحوصات قابلية حل SecretRef.
    - يُشغَّل التحقق من السياسة أيضاً لأسطح أهداف SecretRef المعروفة غير المدعومة.
    - تقيّم فحوصات السياسة التكوين الكامل بعد التغيير، لذلك لا يمكن لكتابات الكائن الأصل (على سبيل المثال تعيين `hooks` ككائن) تجاوز التحقق من الأسطح غير المدعومة.
    - يتم تخطي فحوصات exec SecretRef افتراضياً أثناء التشغيل التجريبي لتجنب الآثار الجانبية للأوامر.
    - استخدم `--allow-exec` مع `--dry-run` للاشتراك في فحوصات exec SecretRef (قد ينفذ هذا أوامر المزوّد).
    - `--allow-exec` خاص بالتشغيل التجريبي فقط ويُرجع خطأ إذا استُخدم بدون `--dry-run`.

  </Accordion>
  <Accordion title="حقول --dry-run --json">
    يطبع `--dry-run --json` تقريراً قابلاً للقراءة آلياً:

    - `ok`: ما إذا كان التشغيل التجريبي قد نجح
    - `operations`: عدد التعيينات التي جرى تقييمها
    - `checks`: ما إذا كانت فحوصات المخطط/قابلية الحل قد شُغّلت
    - `checks.resolvabilityComplete`: ما إذا كانت فحوصات قابلية الحل قد شُغّلت حتى الاكتمال (false عند تخطي مراجع exec)
    - `refsChecked`: عدد المراجع التي حُلّت فعلياً أثناء التشغيل التجريبي
    - `skippedExecRefs`: عدد مراجع exec التي تم تخطيها لأن `--allow-exec` لم يُعيّن
    - `errors`: إخفاقات المخطط/قابلية الحل المهيكلة عندما تكون `ok=false`

  </Accordion>
</AccordionGroup>

### شكل خرج JSON

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
  <Accordion title="إذا فشل التشغيل التجريبي">
    - `config schema validation failed`: شكل الإعدادات بعد التغيير غير صالح؛ أصلح المسار/القيمة أو شكل كائن المزوّد/المرجع.
    - `Config policy validation failed: unsupported SecretRef usage`: انقل بيانات الاعتماد تلك مرة أخرى إلى إدخال نصي صريح/سلسلة نصية، وأبقِ SecretRefs على الأسطح المدعومة فقط.
    - `SecretRef assignment(s) could not be resolved`: يتعذر حالياً حلّ المزوّد/المرجع المشار إليه (متغير بيئة مفقود، أو مؤشر ملف غير صالح، أو فشل مزوّد exec، أو عدم تطابق المزوّد/المصدر).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: تخطى التشغيل التجريبي مراجع exec؛ أعد التشغيل باستخدام `--allow-exec` إذا كنت تحتاج إلى التحقق من قابلية حل exec.
    - في وضع الدُفعات، أصلح الإدخالات الفاشلة وأعد تشغيل `--dry-run` قبل الكتابة.

  </Accordion>
</AccordionGroup>

## أمان الكتابة

يتحقق `openclaw config set` وغيره من كاتبي الإعدادات المملوكين لـ OpenClaw من الإعدادات الكاملة بعد التغيير قبل تثبيتها على القرص. إذا فشلت الحمولة الجديدة في تحقق المخطط أو بدت كاستبدال هدّام، تُترك الإعدادات النشطة كما هي، وتُحفظ الحمولة المرفوضة بجانبها باسم `openclaw.json.rejected.*`.

<Warning>
يجب أن يكون مسار الإعدادات النشط ملفاً عادياً. تخطيطات `openclaw.json` المرتبطة رمزياً غير مدعومة للكتابة؛ استخدم `OPENCLAW_CONFIG_PATH` للإشارة مباشرة إلى الملف الحقيقي بدلاً من ذلك.
</Warning>

فضّل كتابات CLI للتعديلات الصغيرة:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

إذا رُفضت كتابة، فافحص الحمولة المحفوظة وأصلح شكل الإعدادات الكامل:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

لا تزال الكتابة المباشرة بالمحرر مسموحة، لكن Gateway قيد التشغيل يعاملها كغير موثوقة حتى تجتاز التحقق. يمكن استعادة التعديلات المباشرة غير الصالحة من آخر نسخة احتياطية معروفة بأنها سليمة أثناء بدء التشغيل أو إعادة التحميل الساخنة. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config).

استرداد الملف بالكامل مخصص للإعدادات المعطلة عالمياً، مثل أخطاء التحليل، أو إخفاقات المخطط على مستوى الجذر، أو إخفاقات الترحيل القديمة، أو إخفاقات مختلطة في Plugin والجذر. إذا فشل التحقق فقط تحت `plugins.entries.<id>...`، يُبقي OpenClaw ملف `openclaw.json` النشط في مكانه ويبلغ عن المشكلة المحلية الخاصة بـ Plugin بدلاً من استعادة `.last-good`. يمنع هذا تغييرات مخطط Plugin أو انحراف `minHostVersion` من إرجاع إعدادات المستخدم غير ذات الصلة مثل النماذج، والمزوّدين، وملفات تعريف المصادقة، والقنوات، وانكشاف Gateway، والأدوات، والذاكرة، والمتصفح، أو إعدادات Cron.

## الأوامر الفرعية

- `config file`: اطبع مسار ملف الإعدادات النشط (المحلول من `OPENCLAW_CONFIG_PATH` أو الموقع الافتراضي). يجب أن يشير المسار إلى ملف عادي، لا إلى رابط رمزي.

أعد تشغيل Gateway بعد التعديلات.

## التحقق

تحقق من الإعدادات الحالية مقابل المخطط النشط دون بدء Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

بعد نجاح `openclaw config validate`، يمكنك استخدام TUI المحلي لجعل وكيل مضمن يقارن الإعدادات النشطة بالوثائق أثناء تحققك من كل تغيير من الطرفية نفسها:

<Note>
إذا كان التحقق يفشل بالفعل، فابدأ بـ `openclaw configure` أو `openclaw doctor --fix`. لا يتجاوز `openclaw chat` حاجز الإعدادات غير الصالحة.
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
  <Step title="قارن مع الوثائق">
    اطلب من الوكيل مقارنة إعداداتك الحالية بصفحة الوثائق ذات الصلة واقتراح أصغر إصلاح.
  </Step>
  <Step title="طبّق تعديلات محددة">
    طبّق تعديلات محددة باستخدام `openclaw config set` أو `openclaw configure`.
  </Step>
  <Step title="أعد التحقق">
    أعد تشغيل `openclaw config validate` بعد كل تغيير.
  </Step>
  <Step title="استخدم Doctor لمشكلات وقت التشغيل">
    إذا نجح التحقق لكن وقت التشغيل ما زال غير سليم، فشغّل `openclaw doctor` أو `openclaw doctor --fix` للحصول على مساعدة في الترحيل والإصلاح.
  </Step>
</Steps>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإعدادات](/ar/gateway/configuration)
