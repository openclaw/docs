---
read_when:
    - تريد قراءة الإعدادات أو تعديلها دون تفاعل.
sidebarTitle: Config
summary: مرجع CLI لـ `openclaw config` ‏(get/set/patch/unset/file/schema/validate)
title: الإعدادات
x-i18n:
    generated_at: "2026-07-16T13:59:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

مساعدات غير تفاعلية لـ `openclaw.json`: الحصول على قيمة أو تعيينها أو ترقيعها أو إلغاء تعيينها حسب المسار، أو طباعة المخطط، أو التحقق من الصحة، أو طباعة مسار الملف النشط. شغّل `openclaw config` من دون أمر فرعي لفتح المعالج الإرشادي نفسه الذي يفتحه `openclaw configure`.

<Note>
عندما يكون `OPENCLAW_NIX_MODE=1`، يتعامل OpenClaw مع `openclaw.json` على أنه غير قابل للتغيير. تظل أوامر القراءة فقط (`config get` و`config file` و`config schema` و`config validate`) عاملة؛ بينما ترفض أوامر كتابة الإعدادات. عدّل مصدر Nix الخاص بالتثبيت بدلاً من ذلك؛ ولتوزيعة nix-openclaw الرسمية، استخدم [البدء السريع لـ nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) وعيّن القيم ضمن `programs.openclaw.config` أو `instances.<name>.config`.
</Note>

## خيارات الجذر

<ParamField path="--section <section>" type="string">
  مرشح قابل للتكرار لقسم الإعداد الإرشادي عند تشغيل `openclaw config` من دون أمر فرعي.
</ParamField>

الأقسام الإرشادية: `workspace`، `model`، `web`، `gateway`، `daemon`، `channels`، `plugins`، `skills`، `health`.

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

### المسارات

ترميز النقطة أو الأقواس. ضع مسارات الأقواس بين علامتي اقتباس في أمثلة الصدفة حتى لا يوسّعها zsh كنمط glob في `[0]`:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

يقرأ قيمة من لقطة الإعدادات المنقّحة (لا تُطبع الأسرار مطلقًا). يطبع `--json` القيمة الأولية بصيغة JSON؛ وبخلاف ذلك تُطبع السلاسل والأرقام والقيم المنطقية مباشرة، وتُطبع الكائنات والمصفوفات بصيغة JSON منسّقة.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

يطبع مسار ملف الإعدادات النشط، بعد حله من `OPENCLAW_CONFIG_PATH` أو من الموقع الافتراضي. يشير المسار إلى ملف عادي، وليس رابطًا رمزيًا؛ راجع [سلامة الكتابة](#write-safety).

### `config schema`

يطبع مخطط JSON المُنشأ لـ `openclaw.json` إلى stdout.

<AccordionGroup>
  <Accordion title="ما يتضمنه">
    - مخطط إعدادات الجذر الحالي، بالإضافة إلى حقل سلسلة جذري `$schema` لأدوات المحرر.
    - بيانات تعريف توثيق الحقلين `title` / `description` التي تستخدمها واجهة التحكم.
    - ترث عُقد الكائنات المتداخلة وأحرف البدل (`*`) وعناصر المصفوفة (`[]`) بيانات التعريف نفسها لـ `title` / `description` عند وجود توثيق مطابق للحقول.
    - ترث فروع `anyOf` / `oneOf` / `allOf` بيانات تعريف التوثيق نفسها أيضًا.
    - بيانات تعريف مخطط مباشرة لأفضل جهد للـ plugin والقناة عندما يمكن تحميل بيانات تشغيلها.
    - مخطط احتياطي سليم حتى عندما تكون الإعدادات الحالية غير صالحة.

  </Accordion>
  <Accordion title="استدعاء RPC ذي الصلة أثناء التشغيل">
    يعيد `config.schema.lookup` مسار إعدادات واحدًا مطبّعًا مع عقدة مخطط سطحية (`title` و`description` و`type` و`enum` و`const` والحدود الشائعة)، وبيانات تعريف تلميحات واجهة المستخدم المطابقة، وملخصات الأبناء المباشرين. استخدمه للتنقل التفصيلي المحدد بالمسار في واجهة التحكم أو العملاء المخصصين.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

يتحقق من صحة الإعدادات الحالية مقابل المخطط النشط من دون تشغيل Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
إذا كان التحقق من الصحة يفشل بالفعل، فابدأ بـ `openclaw configure` أو `openclaw doctor --fix`. لا يتجاوز `openclaw chat` حاجز الإعدادات غير الصالحة.
</Note>

## القيم

تُحلَّل القيم بصيغة JSON5 متى أمكن؛ وإلا فتُعامل كسلاسل أولية. استخدم `--strict-json` لفرض JSON القياسي من دون رجوع احتياطي إلى السلاسل (وعندئذ يُرفض بناء الجملة الخاص بـ JSON5 فقط، مثل التعليقات والفواصل الختامية والمفاتيح غير الموضوعة بين علامتي اقتباس). يُعد `--json` اسمًا مستعارًا قديمًا لـ `--strict-json` في `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

يطبع `config get <path> --json` القيمة الأولية بصيغة JSON بدلاً من نص منسّق للطرفية.

<Note>
يستبدل تعيين الكائن المسار الهدف افتراضيًا. ترفض المسارات المحمية التي تحتوي عادةً على إدخالات أضافها المستخدم عمليات الاستبدال التي قد تزيل إدخالات موجودة ما لم تمرر `--replace`: `agents.defaults.models`، و`agents.list`، و`models.providers`، و`models.providers.<id>`، و`models.providers.<id>.models`، و`plugins.entries`، و`auth.profiles`.
</Note>

استخدم `--merge` عند إضافة إدخالات إلى تلك الخرائط:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

استخدم `--replace` فقط عندما ينبغي أن تصبح القيمة المقدمة عمدًا هي القيمة الكاملة للهدف.

## أوضاع `config set`

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
    يستهدف مسارات `secrets.providers.<alias>` فقط:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="الوضع الدفعي">
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
تُرفض تعيينات SecretRef على الأسطح القابلة للتغيير أثناء التشغيل وغير المدعومة (مثل `hooks.token` و`commands.ownerDisplaySecret` ورموز Webhook لربط سلاسل Discord وملف JSON لبيانات اعتماد WhatsApp). راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Warning>

يستخدم التحليل الدفعي دائمًا حمولة الدفعة (`--batch-json`/`--batch-file`) بوصفها مصدر الحقيقة؛ ولا يغيّر `--strict-json` / `--json` سلوك التحليل الدفعي.

يعمل وضع مسار/قيمة JSON أيضًا مباشرةً مع SecretRefs والمزوّدين:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### علامات منشئ المزوّد

يجب أن تستخدم أهداف منشئ المزوّد `secrets.providers.<alias>` كمسار.

<AccordionGroup>
  <Accordion title="العلامات الشائعة">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`، `exec`)

  </Accordion>
  <Accordion title="مزوّد البيئة (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (قابل للتكرار)

  </Accordion>
  <Accordion title="مزوّد الملف (--provider-source file)">
    - `--provider-path <path>` (مطلوب)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="مزوّد التنفيذ (--provider-source exec)">
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

مثال على مزوّد تنفيذ محصّن:

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

## `config patch`

الصق أو مرّر عبر الأنبوب ترقيع JSON5 بشكل الإعدادات بدلاً من تشغيل العديد من أوامر `config set` القائمة على المسار. تُدمج الكائنات تكراريًا؛ وتستبدل المصفوفات والقيم القياسية الهدف؛ ويحذف `null` المسار الهدف.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

مرّر ترقيعًا عبر stdin لنصوص الإعداد البرمجية البعيدة:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

مثال على ترقيع:

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

استخدم `--replace-path <path>` عندما يجب أن يصبح كائن أو مصفوفة واحدة القيمة المقدمة بالضبط بدلاً من ترقيعها تكراريًا:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

ينفّذ `--dry-run` فحوصات المخطط وقابلية حل SecretRef من دون كتابة. يتم تخطي SecretRefs المدعومة بالتنفيذ افتراضيًا أثناء التشغيل التجريبي؛ أضف `--allow-exec` عندما تريد عمدًا أن ينفّذ التشغيل التجريبي أوامر المزوّد.

## التشغيل التجريبي

يتحقق `--dry-run` من صحة التغييرات من دون كتابة `openclaw.json`. وهو متاح في `config set` و`config patch` و`config unset`.

```bash
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
    - وضع المنشئ: يُجري فحوصات قابلية حل SecretRef للمراجع/الموفّرين الذين تغيّروا.
    - وضع JSON ‏(`--strict-json` أو `--json` أو وضع الدُفعات): يُجري التحقق من المخطط بالإضافة إلى فحوصات قابلية حل SecretRef.
    - يُجرى التحقق من السياسة على الإعداد الكامل بعد التغيير، لذلك لا يمكن لعمليات كتابة الكائن الأب (مثل تعيين `hooks` بوصفه كائنًا) تجاوز التحقق من الأسطح غير المدعومة.
    - يتم تخطي فحوصات SecretRef التنفيذية افتراضيًا لتجنب الآثار الجانبية للأوامر؛ مرّر `--allow-exec` للاشتراك فيها (قد يؤدي ذلك إلى تنفيذ أوامر الموفّر). لا يُستخدم `--allow-exec` إلا في التشغيل التجريبي، ويُرجع خطأ دون `--dry-run`.

  </Accordion>
  <Accordion title="حقول --dry-run --json">
    - `ok`: ما إذا نجح التشغيل التجريبي
    - `operations`: عدد عمليات التعيين التي تم تقييمها
    - `checks`: ما إذا أُجريت فحوصات المخطط/قابلية الحل
    - `checks.resolvabilityComplete`: ما إذا اكتملت فحوصات قابلية الحل (تكون false عند تخطي مراجع exec)
    - `refsChecked`: عدد المراجع التي حُلّت فعليًا أثناء التشغيل التجريبي
    - `skippedExecRefs`: عدد مراجع exec التي تم تخطيها لأن `--allow-exec` لم يكن معيّنًا
    - `errors`: إخفاقات منظّمة للمسار المفقود أو المخطط أو قابلية الحل عندما `ok=false`

  </Accordion>
</AccordionGroup>

### بنية مخرجات JSON

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
      ref?: string, // موجود لأخطاء قابلية الحل
    },
  ],
}
```

<Tabs>
  <Tab title="مثال على النجاح">
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
  <Tab title="مثال على الإخفاق">
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
          "message": "خطأ: متغير البيئة \"MISSING_TEST_SECRET\" غير معيّن.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="إذا فشل التشغيل التجريبي">
    - `config schema validation failed`: بنية الإعداد بعد التغيير غير صالحة؛ أصلح المسار/القيمة أو بنية كائن الموفّر/المرجع.
    - `Config policy validation failed: unsupported SecretRef usage`: أعد بيانات الاعتماد تلك إلى إدخال نص عادي/سلسلة نصية؛ واحتفظ بـ SecretRefs على الأسطح المدعومة فقط.
    - `SecretRef assignment(s) could not be resolved`: لا يمكن حاليًا حل الموفّر/المرجع المشار إليه (متغير بيئة مفقود، أو مؤشر ملف غير صالح، أو إخفاق موفّر exec، أو عدم تطابق الموفّر/المصدر).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: أعد التشغيل باستخدام `--allow-exec` إذا كنت تحتاج إلى التحقق من قابلية حل exec.
    - في وضع الدُفعات، أصلح الإدخالات الفاشلة وأعد تشغيل `--dry-run` قبل الكتابة.

  </Accordion>
</AccordionGroup>

## تطبيق التغييرات

بعد كل عملية `config set` / `config patch` / `config unset` ناجحة، تطبع CLI واحدة من ثلاث تلميحات كي تعرف ما إذا كان Gateway يحتاج إلى إعادة تشغيل:

| التلميح                                              | المعنى                                  |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | يتطلب المسار الذي تغيّر إعادة تشغيل كاملة. |
| `Change will apply without restarting the gateway.` | يلتقطه إعادة التحميل السريع تلقائيًا.  |
| `No gateway restart needed.`                        | لم يتغيّر شيء ذو صلة بوقت التشغيل.      |

تتطلب عمليات الكتابة إلى `plugins.entries` (أو أي مسار فرعي) دائمًا إعادة تشغيل، لأن CLI لا يمكنها إثبات تحميل بيانات تعريف إعادة التحميل الخاصة بكل Plugin.

## أمان الكتابة

يتحقق `openclaw config set` وغيره من أدوات كتابة الإعداد المملوكة لـ OpenClaw من الإعداد الكامل بعد التغيير قبل حفظه على القرص. إذا فشلت الحمولة الجديدة في التحقق من المخطط أو بدت كاستبدال هدّام، يُترك الإعداد النشط دون تغيير وتُحفظ الحمولة المرفوضة بجانبه باسم `openclaw.json.rejected.*`.

تعيد عمليات الكتابة المملوكة لـ OpenClaw تسلسل JSON5 بصيغة JSON القياسية. عندما يحتوي المصدر على تعليقات، تحذّر أداة الكتابة مباشرة قبل إزالتها؛ استخدم محررًا مباشرًا عندما يكون الحفاظ على التعليقات مهمًا.

<Warning>
يجب أن يكون مسار الإعداد النشط ملفًا عاديًا. لا تُدعم تخطيطات `openclaw.json` المرتبطة رمزيًا لعمليات الكتابة؛ استخدم `OPENCLAW_CONFIG_PATH` للإشارة مباشرةً إلى الملف الحقيقي بدلًا من ذلك.
</Warning>

فضّل عمليات الكتابة عبر CLI للتعديلات الصغيرة:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

إذا رُفضت عملية كتابة، فافحص الحمولة المحفوظة وأصلح بنية الإعداد الكاملة:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

لا تزال الكتابة المباشرة بالمحرر مسموحة، لكن Gateway قيد التشغيل يعاملها على أنها غير موثوقة حتى تجتاز التحقق. تؤدي التعديلات المباشرة غير الصالحة إلى فشل بدء التشغيل أو يتم تخطيها عند إعادة التحميل السريع؛ ولا يعيد Gateway كتابة `openclaw.json`. شغّل `openclaw doctor --fix` لإصلاح الإعداد ذي البادئات/المستبدل أو لاستعادة آخر نسخة سليمة معروفة. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config).

تُحجز استعادة الملف بالكامل لإصلاح doctor. تظل تغييرات مخطط Plugin أو عدم اتساق `minHostVersion` ظاهرة بوضوح بدلًا من التراجع عن إعدادات مستخدم غير مرتبطة، مثل النماذج أو الموفّرين أو ملفات تعريف المصادقة أو القنوات أو تعريض Gateway أو الأدوات أو الذاكرة أو المتصفح أو إعداد Cron.

## حلقة الإصلاح

بعد نجاح `openclaw config validate`، استخدم TUI المحلية ليقارن وكيل مضمّن الإعداد النشط بالمستندات بينما تتحقق من كل تغيير من الطرفية نفسها:

```bash
openclaw chat
```

داخل TUI، يؤدي وضع `!` في البداية إلى تشغيل أمر صدفة محلي حرفيًا (بعد مطالبة تأكيد لمرة واحدة لكل جلسة):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="المقارنة بالمستندات">
    اطلب من الوكيل مقارنة إعدادك الحالي بصفحة المستندات ذات الصلة واقتراح أصغر إصلاح.
  </Step>
  <Step title="تطبيق تعديلات مستهدفة">
    طبّق تعديلات مستهدفة باستخدام `openclaw config set` أو `openclaw configure`.
  </Step>
  <Step title="إعادة التحقق">
    أعد تشغيل `openclaw config validate` بعد كل تغيير.
  </Step>
  <Step title="استخدام doctor لمشكلات وقت التشغيل">
    إذا نجح التحقق لكن وقت التشغيل لا يزال غير سليم، فشغّل `openclaw doctor` أو `openclaw doctor --fix` للحصول على مساعدة في الترحيل والإصلاح.
  </Step>
</Steps>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإعداد](/ar/gateway/configuration)
