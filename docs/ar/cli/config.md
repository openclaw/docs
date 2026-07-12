---
read_when:
    - تريد قراءة الإعدادات أو تعديلها دون تفاعل مباشر
sidebarTitle: Config
summary: مرجع CLI لـ `openclaw config` ‏(get/set/patch/unset/file/schema/validate)
title: الإعدادات
x-i18n:
    generated_at: "2026-07-12T05:41:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

مساعدات غير تفاعلية لملف `openclaw.json`: جلب قيمة أو تعيينها أو ترقيعها أو إلغاء تعيينها حسب المسار، أو طباعة المخطط، أو التحقق من الصحة، أو طباعة مسار الملف النشط. شغّل `openclaw config` من دون أمر فرعي لفتح المعالج الإرشادي نفسه الذي يفتحه `openclaw configure`.

<Note>
عندما تكون `OPENCLAW_NIX_MODE=1`، يتعامل OpenClaw مع `openclaw.json` بوصفه غير قابل للتغيير. تظل أوامر القراءة فقط (`config get` و`config file` و`config schema` و`config validate`) تعمل، بينما ترفض أوامر كتابة الإعدادات التنفيذ. عدّل بدلًا من ذلك مصدر Nix الخاص بالتثبيت؛ ولتوزيعة nix-openclaw الرسمية، استخدم [البدء السريع مع nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) وعيّن القيم ضمن `programs.openclaw.config` أو `instances.<name>.config`.
</Note>

## خيارات الجذر

<ParamField path="--section <section>" type="string">
  مرشّح قابل للتكرار لقسم الإعداد الإرشادي عند تشغيل `openclaw config` من دون أمر فرعي.
</ParamField>

الأقسام الإرشادية: `workspace` و`model` و`web` و`gateway` و`daemon` و`channels` و`plugins` و`skills` و`health`.

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

ترميز بالنقاط أو الأقواس. ضع مسارات الأقواس بين علامتَي اقتباس في أمثلة الصدفة حتى لا يوسّع zsh النمط `[0]`:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

يقرأ قيمة من لقطة الإعدادات المنقّحة (لا تُطبع الأسرار مطلقًا). يطبع `--json` القيمة الأولية بصيغة JSON؛ وإلا فتُطبع السلاسل والأرقام والقيم المنطقية مباشرة، بينما تُطبع الكائنات والمصفوفات بصيغة JSON منسّقة.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

يطبع مسار ملف الإعدادات النشط، المحسوم من `OPENCLAW_CONFIG_PATH` أو الموقع الافتراضي. يشير المسار إلى ملف عادي، وليس رابطًا رمزيًا؛ راجع [سلامة الكتابة](#write-safety).

### `config schema`

يطبع مخطط JSON المُنشأ لملف `openclaw.json` إلى المخرج القياسي.

<AccordionGroup>
  <Accordion title="ما يتضمنه">
    - مخطط إعدادات الجذر الحالي، إضافة إلى حقل سلسلة `$schema` في الجذر لأدوات المحرر.
    - بيانات توثيق الحقلين `title` و`description` التي تستخدمها واجهة التحكم.
    - ترث عُقد الكائنات المتداخلة وأحرف البدل (`*`) وعناصر المصفوفة (`[]`) بيانات `title` و`description` نفسها عند وجود توثيق مطابق للحقول.
    - ترث فروع `anyOf` و`oneOf` و`allOf` بيانات التوثيق نفسها أيضًا.
    - بيانات مخطط وصفية مباشرة للـ Plugin والقناة بأفضل جهد ممكن عندما يمكن تحميل بيانات وقت التشغيل.
    - مخطط احتياطي نظيف حتى عندما تكون الإعدادات الحالية غير صالحة.

  </Accordion>
  <Accordion title="استدعاء RPC المرتبط بوقت التشغيل">
    يعيد `config.schema.lookup` مسار إعدادات واحدًا بعد تسويته، مع عقدة مخطط سطحية (`title` و`description` و`type` و`enum` و`const` والحدود الشائعة)، وبيانات تلميحات واجهة المستخدم المطابقة، وملخصات الأبناء المباشرين. استخدمه للتعمق ضمن نطاق المسار في واجهة التحكم أو في العملاء المخصصين.
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
إذا كان التحقق من الصحة يفشل بالفعل، فابدأ باستخدام `openclaw configure` أو `openclaw doctor --fix`. لا يتجاوز `openclaw chat` حاجز الإعدادات غير الصالحة.
</Note>

## القيم

تُحلّل القيم بصيغة JSON5 متى أمكن؛ وإلا فتُعامل بوصفها سلاسل أولية. استخدم `--strict-json` لفرض JSON القياسي من دون الرجوع إلى السلاسل (وعندئذ يُرفض بناء الجملة الخاص بـ JSON5 فقط، مثل التعليقات أو الفواصل الختامية أو المفاتيح غير الموضوعة بين علامتَي اقتباس). يُعد `--json` اسمًا بديلًا قديمًا لـ `--strict-json` في `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

يطبع `config get <path> --json` القيمة الأولية بصيغة JSON بدلًا من نص منسّق للطرفية.

<Note>
يستبدل تعيين الكائن المسار الهدف افتراضيًا. ترفض المسارات المحمية التي غالبًا ما تحتوي إدخالات أضافها المستخدم عمليات الاستبدال التي قد تزيل الإدخالات الموجودة، ما لم تمرّر `--replace`: وهي `agents.defaults.models` و`agents.list` و`models.providers` و`models.providers.<id>` و`models.providers.<id>.models` و`plugins.entries` و`auth.profiles`.
</Note>

استخدم `--merge` عند إضافة إدخالات إلى هذه الخرائط:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

استخدم `--replace` فقط عندما يُراد عمدًا أن تصبح القيمة المقدمة هي القيمة الكاملة للهدف.

## أوضاع `config set`

<Tabs>
  <Tab title="وضع القيمة">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="وضع إنشاء SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="وضع إنشاء المزوّد">
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
تُرفض تعيينات SecretRef على الأسطح غير المدعومة القابلة للتعديل في وقت التشغيل (مثل `hooks.token` و`commands.ownerDisplaySecret` ورموز Webhook الخاصة بربط سلاسل Discord وملف JSON لبيانات اعتماد WhatsApp). راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Warning>

يستخدم التحليل الدفعي دائمًا حمولة الدفعة (`--batch-json`/`--batch-file`) بوصفها مصدر الحقيقة؛ ولا يغيّر `--strict-json` أو `--json` سلوك التحليل الدفعي.

يعمل وضع المسار/القيمة بصيغة JSON أيضًا مباشرة مع SecretRefs والمزوّدين:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### أعلام إنشاء المزوّد

يجب أن تستخدم أهداف إنشاء المزوّد `secrets.providers.<alias>` بوصفه المسار.

<AccordionGroup>
  <Accordion title="الأعلام الشائعة">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`، `exec`)

  </Accordion>
  <Accordion title="مزوّد البيئة (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (قابل للتكرار)

  </Accordion>
  <Accordion title="مزوّد الملفات (--provider-source file)">
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

الصق أو مرّر عبر أنبوب ترقيعًا للإعدادات بصيغة JSON5 بدلًا من تشغيل العديد من أوامر `config set` المعتمدة على المسار. تُدمج الكائنات بشكل متكرر؛ وتستبدل المصفوفات والقيم القياسية الهدف؛ وتحذف `null` المسار الهدف.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

مرّر ترقيعًا عبر الإدخال القياسي لبرامج الإعداد النصية البعيدة:

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

استخدم `--replace-path <path>` عندما يجب أن يصبح أحد الكائنات أو المصفوفات مساويًا تمامًا للقيمة المقدمة بدلًا من ترقيعه بشكل متكرر:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

يشغّل `--dry-run` فحوصات المخطط وقابلية حل SecretRef من دون كتابة. تُتخطى SecretRefs المدعومة بالتنفيذ افتراضيًا أثناء التشغيل التجريبي؛ أضف `--allow-exec` عندما تريد عمدًا أن ينفّذ التشغيل التجريبي أوامر المزوّد.

## التشغيل التجريبي

يتحقق `--dry-run` من صحة التغييرات من دون الكتابة إلى `openclaw.json`. وهو متاح مع `config set` و`config patch` و`config unset`.

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
    - وضع المنشئ: يُجري فحوصات قابلية حل SecretRef للمراجع/المزوّدين الذين جرى تغييرهم.
    - وضع JSON (`--strict-json` أو `--json` أو وضع الدُفعات): يُجري التحقق من صحة المخطط بالإضافة إلى فحوصات قابلية حل SecretRef.
    - يُجرى التحقق من السياسة على الإعداد الكامل بعد التغيير، لذا لا يمكن لعمليات الكتابة إلى الكائن الأب (مثل تعيين `hooks` ككائن) تجاوز التحقق من الأسطح غير المدعومة.
    - تُتخطى فحوصات SecretRef من نوع exec افتراضيًا لتجنب الآثار الجانبية للأوامر؛ مرّر `--allow-exec` للاشتراك فيها (قد يؤدي ذلك إلى تنفيذ أوامر المزوّد). لا يعمل `--allow-exec` إلا مع التشغيل التجريبي، ويُصدر خطأ عند استخدامه من دون `--dry-run`.

  </Accordion>
  <Accordion title="حقول --dry-run --json">
    - `ok`: ما إذا نجح التشغيل التجريبي
    - `operations`: عدد عمليات التعيين التي جرى تقييمها
    - `checks`: ما إذا أُجريت فحوصات المخطط/قابلية الحل
    - `checks.resolvabilityComplete`: ما إذا اكتملت فحوصات قابلية الحل (تكون false عند تخطي مراجع exec)
    - `refsChecked`: عدد المراجع التي جرى حلها فعليًا أثناء التشغيل التجريبي
    - `skippedExecRefs`: عدد مراجع exec التي جرى تخطيها لأن `--allow-exec` لم يكن معيّنًا
    - `errors`: إخفاقات منظّمة للمسار المفقود أو المخطط أو قابلية الحل عندما تكون `ok=false`

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
    - `config schema validation failed`: بنية الإعداد بعد التغيير غير صالحة؛ أصلح المسار/القيمة أو بنية كائن المزوّد/المرجع.
    - `Config policy validation failed: unsupported SecretRef usage`: أعد بيانات الاعتماد تلك إلى إدخال نص صريح/سلسلة نصية؛ وأبقِ SecretRefs على الأسطح المدعومة فقط.
    - `SecretRef assignment(s) could not be resolved`: يتعذر حاليًا حل المزوّد/المرجع المشار إليه (متغير بيئة مفقود، أو مؤشّر ملف غير صالح، أو إخفاق مزوّد exec، أو عدم تطابق المزوّد/المصدر).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: أعد التشغيل باستخدام `--allow-exec` إذا كنت تحتاج إلى التحقق من قابلية حل exec.
    - في وضع الدُفعات، أصلح الإدخالات الفاشلة وأعد تشغيل `--dry-run` قبل الكتابة.

  </Accordion>
</AccordionGroup>

## تطبيق التغييرات

بعد كل عملية ناجحة من `config set` أو `config patch` أو `config unset`، تطبع CLI أحد التلميحات الثلاثة التالية لتعرف ما إذا كان Gateway يحتاج إلى إعادة تشغيل:

| التلميح                                            | المعنى                                         |
| --------------------------------------------------- | ---------------------------------------------- |
| `Restart the gateway to apply.`                     | يحتاج المسار الذي جرى تغييره إلى إعادة تشغيل كاملة. |
| `Change will apply without restarting the gateway.` | يلتقطه إعادة التحميل الفوري تلقائيًا.          |
| `No gateway restart needed.`                        | لم يتغير شيء ذو صلة بوقت التشغيل.              |

تتطلب عمليات الكتابة إلى `plugins.entries` (أو أي مسار فرعي له) إعادة تشغيل دائمًا، لأن CLI لا يمكنها إثبات تحميل بيانات إعادة التحميل الوصفية لكل Plugin.

## أمان الكتابة

يتحقق `openclaw config set` وغيره من أدوات كتابة الإعداد المملوكة لـ OpenClaw من صحة الإعداد الكامل بعد التغيير قبل حفظه على القرص. إذا فشلت الحمولة الجديدة في التحقق من صحة المخطط أو بدت كاستبدال هدّام، يُترك الإعداد النشط دون تغيير، وتُحفظ الحمولة المرفوضة بجانبه باسم `openclaw.json.rejected.*`.

<Warning>
يجب أن يكون مسار الإعداد النشط ملفًا عاديًا. تخطيطات `openclaw.json` ذات الروابط الرمزية غير مدعومة للكتابة؛ استخدم `OPENCLAW_CONFIG_PATH` للإشارة مباشرةً إلى الملف الحقيقي بدلًا من ذلك.
</Warning>

فضّل الكتابة عبر CLI للتعديلات الصغيرة:

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

لا تزال الكتابة المباشرة عبر المحرر مسموحة، لكن Gateway الجاري يعاملها على أنها غير موثوقة حتى تجتاز التحقق. تؤدي التعديلات المباشرة غير الصالحة إلى فشل بدء التشغيل أو يتخطاها إعادة التحميل الفوري؛ ولا يعيد Gateway كتابة `openclaw.json`. شغّل `openclaw doctor --fix` لإصلاح الإعداد ذي البادئات/المستبدل أو لاستعادة آخر نسخة سليمة معروفة. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config).

يُحجز استرداد الملف بالكامل لإصلاح doctor. وتظل تغييرات مخطط Plugin أو عدم توافق `minHostVersion` ظاهرة بوضوح بدلًا من التراجع عن إعدادات مستخدم غير مرتبطة، مثل إعدادات النماذج أو المزوّدين أو ملفات تعريف المصادقة أو القنوات أو إتاحة Gateway أو الأدوات أو الذاكرة أو المتصفح أو cron.

## حلقة الإصلاح

بعد نجاح `openclaw config validate`، استخدم TUI المحلي ليقارن وكيل مضمّن الإعداد النشط بالوثائق بينما تتحقق من كل تغيير من الطرفية نفسها:

```bash
openclaw chat
```

داخل TUI، يؤدي الرمز `!` في البداية إلى تشغيل أمر shell محلي حرفيًا (بعد مطالبة تأكيد لمرة واحدة في كل جلسة):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="المقارنة مع الوثائق">
    اطلب من الوكيل مقارنة إعدادك الحالي بصفحة الوثائق ذات الصلة واقتراح أصغر إصلاح.
  </Step>
  <Step title="تطبيق تعديلات محددة">
    طبّق تعديلات محددة باستخدام `openclaw config set` أو `openclaw configure`.
  </Step>
  <Step title="إعادة التحقق">
    أعد تشغيل `openclaw config validate` بعد كل تغيير.
  </Step>
  <Step title="استخدام doctor لمشكلات وقت التشغيل">
    إذا نجح التحقق ولكن وقت التشغيل لا يزال غير سليم، فشغّل `openclaw doctor` أو `openclaw doctor --fix` للحصول على مساعدة في الترحيل والإصلاح.
  </Step>
</Steps>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإعداد](/ar/gateway/configuration)
