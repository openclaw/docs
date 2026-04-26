---
read_when:
    - تريد قراءة الإعدادات أو تعديلها بشكل غير تفاعلي
sidebarTitle: Config
summary: مرجع CLI لـ `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: الإعدادات
x-i18n:
    generated_at: "2026-04-26T11:25:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

مساعدات الإعدادات للتعديلات غير التفاعلية في `openclaw.json`: قراءة/تعيين/إلغاء تعيين/ملف/مخطط/التحقق من القيم حسب المسار وطباعة ملف الإعدادات النشط. شغّل الأمر بدون أمر فرعي لفتح معالج الإعداد (مثل `openclaw configure` تمامًا).

## خيارات الجذر

<ParamField path="--section <section>" type="string">
  مرشح قسم إعداد موجّه قابل للتكرار عند تشغيل `openclaw config` بدون أمر فرعي.
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
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### ‏`config schema`

يطبع مخطط JSON المُولَّد لـ `openclaw.json` إلى stdout بصيغة JSON.

<AccordionGroup>
  <Accordion title="ما الذي يتضمنه">
    - مخطط إعدادات الجذر الحالي، بالإضافة إلى حقل سلسلة `$schema` في الجذر لأدوات المحرر.
    - بيانات تعريف التوثيق في الحقلين `title` و`description` التي تستخدمها Control UI.
    - ترث كائنات التداخل، وعُقد wildcard (`*`)، وعناصر المصفوفة (`[]`) بيانات التعريف نفسها لـ `title` / `description` عندما تتوفر وثائق حقول مطابقة.
    - ترث فروع `anyOf` / `oneOf` / `allOf` أيضًا بيانات التعريف نفسها للتوثيق عند وجود وثائق حقول مطابقة.
    - بيانات تعريف مخطط Plugin + القناة الحية بأفضل جهد عندما يمكن تحميل manifestات وقت التشغيل.
    - مخطط احتياطي نظيف حتى عندما تكون الإعدادات الحالية غير صالحة.
  </Accordion>
  <Accordion title="Runtime RPC ذو صلة">
    يعيد `config.schema.lookup` مسار إعدادات واحدًا مُطبَّعًا مع عقدة مخطط سطحية (`title` و`description` و`type` و`enum` و`const` والحدود الشائعة)، وبيانات تعريف تلميحات UI المطابقة، وملخصات العناصر الفرعية المباشرة. استخدمه للتعمق المقيّد بالمسار في Control UI أو العملاء المخصصين.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

مرّره إلى ملف عندما تريد فحصه أو التحقق منه بأدوات أخرى:

```bash
openclaw config schema > openclaw.schema.json
```

### المسارات

تستخدم المسارات صيغة النقطة أو الأقواس:

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

تُحلَّل القيم بصيغة JSON5 متى أمكن؛ وإلا فتُعامَل كسلاسل نصية. استخدم `--strict-json` لفرض تحليل JSON5. ولا يزال `--json` مدعومًا كاسم بديل قديم.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

يطبع `config get <path> --json` القيمة الخام بصيغة JSON بدلًا من النص المنسق للطرفية.

<Note>
يستبدل إسناد الكائنات المسار المستهدف افتراضيًا. وترفض مسارات الخرائط/القوائم المحمية التي تحتوي عادةً على إدخالات مضافة من المستخدم، مثل `agents.defaults.models` و`models.providers` و`models.providers.<id>.models` و`plugins.entries` و`auth.profiles`، عمليات الاستبدال التي قد تزيل إدخالات موجودة ما لم تمرر `--replace`.
</Note>

استخدم `--merge` عند إضافة إدخالات إلى تلك الخرائط:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

استخدم `--replace` فقط عندما تريد عمدًا أن تصبح القيمة الممررة هي القيمة الكاملة للمسار المستهدف.

## أوضاع `config set`

يدعم `openclaw config set` أربعة أساليب للإسناد:

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
    يستهدف وضع إنشاء المزوّد مسارات `secrets.providers.<alias>` فقط:

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
تُرفض إسنادات SecretRef على الأسطح غير المدعومة القابلة للتغيير وقت التشغيل (مثل `hooks.token` و`commands.ownerDisplaySecret` ورموز Webhook لربط خيوط Discord وبيانات اعتماد WhatsApp JSON). راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Warning>

يستخدم تحليل الدفعات دائمًا حمولة الدفعة (`--batch-json`/`--batch-file`) كمصدر الحقيقة. ولا يغيّر `--strict-json` / `--json` سلوك تحليل الدفعات.

يظل وضع مسار/قيمة JSON مدعومًا لكل من SecretRefs والمزوّدين:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## أعلام إنشاء المزوّد

يجب أن تستخدم أهداف إنشاء المزوّد `secrets.providers.<alias>` كمسار.

<AccordionGroup>
  <Accordion title="أعلام شائعة">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`، `exec`)
  </Accordion>
  <Accordion title="مزوّد Env ‏(`--provider-source env`)">
    - `--provider-allowlist <ENV_VAR>` (قابل للتكرار)
  </Accordion>
  <Accordion title="مزوّد الملف ‏(`--provider-source file`)">
    - `--provider-path <path>` (مطلوب)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`
  </Accordion>
  <Accordion title="مزوّد Exec ‏(`--provider-source exec`)">
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

مثال لمزوّد exec مُحصَّن:

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
    - وضع الإنشاء: يشغّل فحوصات قابلية الحل لـ SecretRef للمراجع/المزوّدين الذين تغيروا.
    - وضع JSON ‏(`--strict-json` أو `--json` أو وضع الدفعات): يشغّل التحقق من المخطط بالإضافة إلى فحوصات قابلية الحل لـ SecretRef.
    - يعمل أيضًا التحقق من السياسة لأسطح SecretRef الهدف المعروفة غير المدعومة.
    - تقيّم فحوصات السياسة إعدادات ما بعد التغيير كاملة، لذلك لا يمكن لعمليات الكتابة على الكائن الأب (مثل تعيين `hooks` ككائن) تجاوز التحقق من الأسطح غير المدعومة.
    - تُتخطى فحوصات Exec SecretRef افتراضيًا أثناء التشغيل التجريبي لتجنب الآثار الجانبية للأوامر.
    - استخدم `--allow-exec` مع `--dry-run` للاشتراك في فحوصات Exec SecretRef (قد يؤدي هذا إلى تنفيذ أوامر المزوّد).
    - `--allow-exec` مخصص للتشغيل التجريبي فقط ويعطي خطأ إذا استُخدم بدون `--dry-run`.
  </Accordion>
  <Accordion title="حقول `--dry-run --json`">
    يطبع `--dry-run --json` تقريرًا قابلاً للقراءة آليًا:

    - `ok`: هل نجح التشغيل التجريبي
    - `operations`: عدد الإسنادات التي تم تقييمها
    - `checks`: هل شُغّلت فحوصات المخطط/قابلية الحل
    - `checks.resolvabilityComplete`: هل اكتملت فحوصات قابلية الحل بالكامل (تكون `false` عند تخطي مراجع exec)
    - `refsChecked`: عدد المراجع التي تم حلها فعليًا أثناء التشغيل التجريبي
    - `skippedExecRefs`: عدد مراجع exec التي تم تخطيها لأن `--allow-exec` لم يُضبط
    - `errors`: حالات الفشل المنظمة في المخطط/قابلية الحل عندما تكون `ok=false`

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
      ref?: string, // موجود في أخطاء قابلية الحل
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
    - `config schema validation failed`: شكل الإعدادات بعد التغيير غير صالح؛ أصلح المسار/القيمة أو شكل كائن provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: أعد بيانات الاعتماد هذه إلى إدخال نص عادي/سلسلة نصية، وأبقِ SecretRefs على الأسطح المدعومة فقط.
    - `SecretRef assignment(s) could not be resolved`: لا يمكن حاليًا حل provider/ref المشار إليه (متغير بيئة مفقود، أو مؤشر ملف غير صالح، أو فشل مزوّد exec، أو عدم تطابق بين provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: تخطى التشغيل التجريبي مراجع exec؛ أعد التشغيل مع `--allow-exec` إذا كنت تحتاج إلى التحقق من قابلية حل exec.
    - في وضع الدفعات، أصلح الإدخالات الفاشلة وأعد تشغيل `--dry-run` قبل الكتابة.
  </Accordion>
</AccordionGroup>

## أمان الكتابة

يتحقق `openclaw config set` وكتّاب الإعدادات الآخرين المملوكين لـ OpenClaw من كامل الإعدادات بعد التغيير قبل تثبيتها على القرص. وإذا فشلت الحمولة الجديدة في التحقق من المخطط أو بدت كاستبدال مدمر، تُترك الإعدادات النشطة كما هي وتُحفَظ الحمولة المرفوضة بجوارها باسم `openclaw.json.rejected.*`.

<Warning>
يجب أن يكون مسار الإعدادات النشط ملفًا عاديًا. تخطيطات `openclaw.json` المرتبطة رمزيًا غير مدعومة للكتابة؛ استخدم `OPENCLAW_CONFIG_PATH` للإشارة مباشرة إلى الملف الحقيقي بدلًا من ذلك.
</Warning>

فضّل الكتابة عبر CLI للتعديلات الصغيرة:

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

لا تزال الكتابة المباشرة عبر المحرر مسموحًا بها، لكن Gateway العامل يتعامل معها على أنها غير موثوقة حتى تجتاز التحقق. ويمكن استعادة التعديلات المباشرة غير الصالحة من آخر نسخة سليمة معروفة أثناء بدء التشغيل أو إعادة التحميل السريع. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config).

يُحجز الاسترداد الكامل للملف للحالات التي تكون فيها الإعدادات معطلة عالميًا، مثل أخطاء التحليل، أو إخفاقات مخطط الجذر، أو إخفاقات الترحيل القديمة، أو الإخفاقات المختلطة بين Plugin والجذر. وإذا فشل التحقق فقط تحت `plugins.entries.<id>...`، فسيُبقي OpenClaw ملف `openclaw.json` النشط في مكانه ويبلغ عن المشكلة المحلية الخاصة بالـ Plugin بدلًا من استعادة `.last-good`. ويمنع هذا تغييرات مخطط Plugin أو عدم توافق `minHostVersion` من التسبب في التراجع عن إعدادات مستخدم أخرى غير ذات صلة مثل النماذج، والمزوّدين، وملفات تعريف المصادقة، والقنوات، وكشف Gateway، والأدوات، والذاكرة، والمتصفح، أو إعدادات Cron.

## الأوامر الفرعية

- `config file`: يطبع مسار ملف الإعدادات النشط (المحلول من `OPENCLAW_CONFIG_PATH` أو من الموقع الافتراضي). يجب أن يشير المسار إلى ملف عادي، وليس إلى رابط رمزي.

أعد تشغيل Gateway بعد التعديلات.

## التحقق

تحقق من الإعدادات الحالية مقابل المخطط النشط دون بدء Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

بعد نجاح `openclaw config validate`، يمكنك استخدام TUI المحلي ليقوم وكيل مضمّن بمقارنة الإعدادات النشطة بالوثائق بينما تتحقق من كل تغيير من الطرفية نفسها:

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
  <Step title="قارن بالوثائق">
    اطلب من الوكيل مقارنة إعداداتك الحالية بصفحة الوثائق ذات الصلة واقتراح أصغر إصلاح ممكن.
  </Step>
  <Step title="طبّق تعديلات موجّهة">
    طبّق تعديلات موجّهة باستخدام `openclaw config set` أو `openclaw configure`.
  </Step>
  <Step title="أعد التحقق">
    أعد تشغيل `openclaw config validate` بعد كل تغيير.
  </Step>
  <Step title="Doctor لمشكلات وقت التشغيل">
    إذا نجح التحقق لكن وقت التشغيل لا يزال غير سليم، فشغّل `openclaw doctor` أو `openclaw doctor --fix` للحصول على مساعدة في الترحيل والإصلاح.
  </Step>
</Steps>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإعدادات](/ar/gateway/configuration)
