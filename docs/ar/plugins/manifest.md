---
read_when:
    - أنت تقوم ببناء plugin لـ OpenClaw.
    - تحتاج إلى إصدار مخطط إعدادات plugin أو تصحيح أخطاء التحقق من صحة plugin.
summary: بيان plugin + متطلبات JSON schema (التحقق الصارم من صحة الإعدادات)
title: بيان plugin
x-i18n:
    generated_at: "2026-04-11T02:46:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b254c121d1eb5ea19adbd4148243cf47339c960442ab1ca0e0bfd52e0154c88
    source_path: plugins/manifest.md
    workflow: 15
---

# بيان plugin (`openclaw.plugin.json`)

هذه الصفحة مخصصة فقط لـ **بيان OpenClaw الأصلي لـ plugin**.

للتنسيقات المتوافقة للحزم، راجع [حزم plugin](/ar/plugins/bundles).

تستخدم تنسيقات الحزم المتوافقة ملفات بيان مختلفة:

- حزمة Codex: `.codex-plugin/plugin.json`
- حزمة Claude: `.claude-plugin/plugin.json` أو تخطيط مكونات Claude
  الافتراضي من دون بيان
- حزمة Cursor: `.cursor-plugin/plugin.json`

يكتشف OpenClaw تلك التخطيطات المتوافقة للحزم تلقائيًا أيضًا، لكنها لا تُتحقق
مقارنتها بمخطط `openclaw.plugin.json` الموضح هنا.

بالنسبة إلى الحزم المتوافقة، يقرأ OpenClaw حاليًا بيانات الحزمة الوصفية بالإضافة إلى
جذور Skills المعلنة، وجذور أوامر Claude، وقيم `settings.json` الافتراضية في حزمة Claude،
وقيم LSP الافتراضية في حزمة Claude، وحزم hooks المدعومة عندما يطابق التخطيط
توقعات وقت تشغيل OpenClaw.

يجب على كل plugin أصلي في OpenClaw **أن** يوفّر ملف `openclaw.plugin.json` في
**جذر plugin**. يستخدم OpenClaw هذا البيان للتحقق من صحة الإعدادات
**من دون تنفيذ كود plugin**. وتُعامل البيانات المفقودة أو غير الصالحة على أنها
أخطاء plugin وتمنع التحقق من صحة الإعدادات.

راجع الدليل الكامل لنظام plugin: [Plugins](/ar/tools/plugin).
وبالنسبة إلى نموذج الإمكانات الأصلي والإرشادات الحالية للتوافق الخارجي:
[نموذج الإمكانات](/ar/plugins/architecture#public-capability-model).

## ما الذي يفعله هذا الملف

`openclaw.plugin.json` هو البيانات الوصفية التي يقرؤها OpenClaw قبل أن يحمّل
كود plugin الخاص بك.

استخدمه من أجل:

- هوية plugin
- التحقق من صحة الإعدادات
- بيانات المصادقة والإعداد الأولي التي يجب أن تكون متاحة من دون تشغيل وقت تشغيل plugin
- بيانات الأسماء المستعارة والتمكين التلقائي التي يجب أن تُحل قبل تحميل وقت تشغيل plugin
- بيانات ملكية عائلة النماذج المختصرة التي ينبغي أن تفعّل
  plugin تلقائيًا قبل تحميل وقت التشغيل
- لقطات ثابتة لملكية الإمكانات تُستخدم في توافق الحزم والتغطية التعاقدية
- بيانات إعدادات خاصة بالقنوات ينبغي دمجها في أسطح الفهرسة والتحقق
  من دون تحميل وقت التشغيل
- تلميحات UI للإعدادات

لا تستخدمه من أجل:

- تسجيل سلوك وقت التشغيل
- تعريف نقاط إدخال الكود
- بيانات تثبيت npm

هذه تنتمي إلى كود plugin الخاص بك و`package.json`.

## مثال أدنى

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## مثال موسع

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "plugin مزود OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "مفتاح API لـ OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "مفتاح API لـ OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "مفتاح API",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## مرجع الحقول ذات المستوى الأعلى

| الحقل                               | مطلوب | النوع                            | معناه                                                                                                                                                                                                       |
| ----------------------------------- | ------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | نعم    | `string`                         | معرّف plugin الأساسي. وهذا هو المعرّف المستخدم في `plugins.entries.<id>`.                                                                                                                                  |
| `configSchema`                      | نعم    | `object`                         | JSON Schema مضمن لإعدادات هذا plugin.                                                                                                                                                                       |
| `enabledByDefault`                  | لا     | `true`                           | يحدد أن plugin المجمّع مفعّل افتراضيًا. احذف هذا الحقل، أو اضبطه على أي قيمة غير `true`، للإبقاء على plugin معطلًا افتراضيًا.                                                                            |
| `legacyPluginIds`                   | لا     | `string[]`                       | معرّفات قديمة تُطبّع إلى معرّف plugin الأساسي هذا.                                                                                                                                                         |
| `autoEnableWhenConfiguredProviders` | لا     | `string[]`                       | معرّفات المزودات التي يجب أن تفعّل هذا plugin تلقائيًا عندما تشير إليها المصادقة أو الإعدادات أو مراجع النماذج.                                                                                             |
| `kind`                              | لا     | `"memory"` \| `"context-engine"` | يعلن نوع plugin حصريًا يُستخدم بواسطة `plugins.slots.*`.                                                                                                                                                   |
| `channels`                          | لا     | `string[]`                       | معرّفات القنوات التي يملكها هذا plugin. تُستخدم للاكتشاف والتحقق من صحة الإعدادات.                                                                                                                          |
| `providers`                         | لا     | `string[]`                       | معرّفات المزودات التي يملكها هذا plugin.                                                                                                                                                                    |
| `modelSupport`                      | لا     | `object`                         | بيانات وصفية مختصرة لعائلات النماذج يملكها البيان وتُستخدم لتحميل plugin تلقائيًا قبل وقت التشغيل.                                                                                                          |
| `cliBackends`                       | لا     | `string[]`                       | معرّفات الواجهات الخلفية للاستدلال في CLI التي يملكها هذا plugin. وتُستخدم للتفعيل التلقائي عند بدء التشغيل من مراجع الإعدادات الصريحة.                                                                      |
| `commandAliases`                    | لا     | `object[]`                       | أسماء الأوامر التي يملكها هذا plugin والتي ينبغي أن تنتج إعدادات خاصة بالـ plugin وتشخيصات CLI قبل تحميل وقت التشغيل.                                                                                         |
| `providerAuthEnvVars`               | لا     | `Record<string, string[]>`       | بيانات وصفية بسيطة لمتغيرات بيئة مصادقة المزود يمكن لـ OpenClaw فحصها من دون تحميل كود plugin.                                                                                                             |
| `providerAuthAliases`               | لا     | `Record<string, string>`         | معرّفات مزودات ينبغي أن تعيد استخدام معرّف مزود آخر للبحث عن المصادقة، مثل مزود coding يشارك مفتاح API الأساسي وملفات تعريف المصادقة الخاصة بالمزود الأساسي.                                                 |
| `channelEnvVars`                    | لا     | `Record<string, string[]>`       | بيانات وصفية بسيطة لمتغيرات بيئة القنوات يمكن لـ OpenClaw فحصها من دون تحميل كود plugin. استخدم هذا للإعداد المعتمد على البيئة للقنوات أو أسطح المصادقة التي ينبغي أن تراها أدوات البدء/الإعداد العامة.      |
| `providerAuthChoices`               | لا     | `object[]`                       | بيانات وصفية بسيطة لخيارات المصادقة لمحددات الإعداد الأولي، وحل المزود المفضل، وربط أعلام CLI البسيطة.                                                                                                       |
| `contracts`                         | لا     | `object`                         | لقطة ثابتة لإمكانات الحزم للتعرف على الكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الموسيقى، وتوليد الفيديو، وweb-fetch، وweb search، وملكية الأدوات.                            |
| `channelConfigs`                    | لا     | `Record<string, object>`         | بيانات وصفية لإعدادات القنوات يملكها البيان وتُدمج في أسطح الاكتشاف والتحقق قبل تحميل وقت التشغيل.                                                                                                           |
| `skills`                            | لا     | `string[]`                       | أدلة Skills المطلوب تحميلها، نسبةً إلى جذر plugin.                                                                                                                                                         |
| `name`                              | لا     | `string`                         | اسم plugin قابل للقراءة البشرية.                                                                                                                                                                            |
| `description`                       | لا     | `string`                         | ملخص قصير يظهر في أسطح plugin.                                                                                                                                                                              |
| `version`                           | لا     | `string`                         | إصدار plugin معلوماتي.                                                                                                                                                                                      |
| `uiHints`                           | لا     | `Record<string, object>`         | تسميات UI، وعناصر نائبة، وتلميحات الحساسية لحقول الإعدادات.                                                                                                                                                 |

## مرجع `providerAuthChoices`

يصف كل إدخال في `providerAuthChoices` خيارًا واحدًا للإعداد الأولي أو المصادقة.
يقرأ OpenClaw هذا قبل تحميل وقت تشغيل المزود.

| الحقل                 | مطلوب | النوع                                           | معناه                                                                                          |
| --------------------- | ------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `provider`            | نعم    | `string`                                        | معرّف المزود الذي ينتمي إليه هذا الخيار.                                                       |
| `method`              | نعم    | `string`                                        | معرّف طريقة المصادقة المطلوب التوجيه إليها.                                                    |
| `choiceId`            | نعم    | `string`                                        | معرّف ثابت لخيار المصادقة تستخدمه عمليات الإعداد الأولي وCLI.                                  |
| `choiceLabel`         | لا     | `string`                                        | تسمية موجهة للمستخدم. وإذا حُذفت، يعود OpenClaw إلى `choiceId`.                               |
| `choiceHint`          | لا     | `string`                                        | نص مساعد قصير للمحدد.                                                                          |
| `assistantPriority`   | لا     | `number`                                        | القيم الأقل تُرتَّب أولًا في المحددات التفاعلية التي يقودها المساعد.                           |
| `assistantVisibility` | لا     | `"visible"` \| `"manual-only"`                  | إخفاء الخيار من محددات المساعد مع الاستمرار في السماح باختياره يدويًا عبر CLI.                 |
| `deprecatedChoiceIds` | لا     | `string[]`                                      | معرّفات خيارات قديمة ينبغي إعادة توجيه المستخدمين منها إلى هذا الخيار البديل.                  |
| `groupId`             | لا     | `string`                                        | معرّف مجموعة اختياري لتجميع الخيارات المرتبطة.                                                 |
| `groupLabel`          | لا     | `string`                                        | تسمية موجهة للمستخدم لتلك المجموعة.                                                            |
| `groupHint`           | لا     | `string`                                        | نص مساعد قصير للمجموعة.                                                                        |
| `optionKey`           | لا     | `string`                                        | مفتاح خيار داخلي لتدفقات المصادقة البسيطة ذات العلم الواحد.                                    |
| `cliFlag`             | لا     | `string`                                        | اسم علم CLI، مثل `--openrouter-api-key`.                                                       |
| `cliOption`           | لا     | `string`                                        | الشكل الكامل لخيار CLI، مثل `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | لا     | `string`                                        | الوصف المستخدم في تعليمات CLI.                                                                 |
| `onboardingScopes`    | لا     | `Array<"text-inference" \| "image-generation">` | أسطح الإعداد الأولي التي ينبغي أن يظهر فيها هذا الخيار. وإذا حُذفت، تكون القيمة الافتراضية `["text-inference"]`. |

## مرجع `commandAliases`

استخدم `commandAliases` عندما يملك plugin اسم أمر وقت تشغيل قد
يضعه المستخدمون بالخطأ في `plugins.allow` أو يحاولون تشغيله كأمر CLI رئيسي. يستخدم OpenClaw
هذه البيانات الوصفية للتشخيصات من دون استيراد كود وقت تشغيل plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| الحقل        | مطلوب | النوع             | معناه                                                                  |
| ------------ | ------ | ----------------- | ---------------------------------------------------------------------- |
| `name`       | نعم    | `string`          | اسم الأمر الذي ينتمي إلى هذا plugin.                                   |
| `kind`       | لا     | `"runtime-slash"` | يحدد الاسم المستعار على أنه أمر slash في الدردشة وليس أمر CLI رئيسيًا. |
| `cliCommand` | لا     | `string`          | أمر CLI رئيسي ذي صلة لاقتراحه في عمليات CLI، إن وُجد.                  |

## مرجع `uiHints`

`uiHints` عبارة عن خريطة من أسماء حقول الإعدادات إلى تلميحات عرض صغيرة.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "مفتاح API",
      "help": "يُستخدم لطلبات OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

يمكن أن يتضمن كل تلميح حقل ما يلي:

| الحقل         | النوع      | معناه                                  |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | تسمية الحقل الموجهة للمستخدم.          |
| `help`        | `string`   | نص مساعد قصير.                         |
| `tags`        | `string[]` | وسوم UI اختيارية.                      |
| `advanced`    | `boolean`  | يحدد الحقل على أنه متقدم.              |
| `sensitive`   | `boolean`  | يحدد الحقل على أنه سري أو حساس.        |
| `placeholder` | `string`   | نص العنصر النائب لمدخلات النماذج.      |

## مرجع `contracts`

استخدم `contracts` فقط لبيانات ملكية الإمكانات الثابتة التي يستطيع OpenClaw
قراءتها من دون استيراد وقت تشغيل plugin.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

كل قائمة اختيارية:

| الحقل                            | النوع      | معناه                                                     |
| -------------------------------- | ---------- | --------------------------------------------------------- |
| `speechProviders`                | `string[]` | معرّفات مزودي الكلام التي يملكها هذا plugin.              |
| `realtimeTranscriptionProviders` | `string[]` | معرّفات مزودي النسخ الفوري التي يملكها هذا plugin.        |
| `realtimeVoiceProviders`         | `string[]` | معرّفات مزودي الصوت الفوري التي يملكها هذا plugin.        |
| `mediaUnderstandingProviders`    | `string[]` | معرّفات مزودي فهم الوسائط التي يملكها هذا plugin.         |
| `imageGenerationProviders`       | `string[]` | معرّفات مزودي توليد الصور التي يملكها هذا plugin.         |
| `videoGenerationProviders`       | `string[]` | معرّفات مزودي توليد الفيديو التي يملكها هذا plugin.       |
| `webFetchProviders`              | `string[]` | معرّفات مزودي web-fetch التي يملكها هذا plugin.           |
| `webSearchProviders`             | `string[]` | معرّفات مزودي web search التي يملكها هذا plugin.          |
| `tools`                          | `string[]` | أسماء أدوات الوكيل التي يملكها هذا plugin لفحوصات العقود المجمعة. |

## مرجع `channelConfigs`

استخدم `channelConfigs` عندما يحتاج plugin قناة إلى بيانات إعدادات بسيطة قبل
تحميل وقت التشغيل.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "عنوان URL للخادم المنزلي",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "اتصال Matrix homeserver",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

يمكن أن يتضمن كل إدخال قناة ما يلي:

| الحقل         | النوع                    | معناه                                                                                |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema لـ `channels.<id>`. وهو مطلوب لكل إدخال إعدادات قناة مُعلن عنه.         |
| `uiHints`     | `Record<string, object>` | تسميات UI وعناصر نائبة وتلميحات حساسية اختيارية لهذا القسم من إعدادات القناة.       |
| `label`       | `string`                 | تسمية القناة المدمجة في أسطح المحدد والفحص عندما لا تكون بيانات وقت التشغيل جاهزة.   |
| `description` | `string`                 | وصف قصير للقناة لأسطح الفحص والفهرس.                                                |
| `preferOver`  | `string[]`               | معرّفات plugin قديمة أو أقل أولوية ينبغي أن تتفوق عليها هذه القناة في أسطح الاختيار. |

## مرجع `modelSupport`

استخدم `modelSupport` عندما ينبغي لـ OpenClaw استنتاج plugin المزود الخاص بك من
معرّفات النماذج المختصرة مثل `gpt-5.4` أو `claude-sonnet-4.6` قبل تحميل
وقت تشغيل plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

يطبق OpenClaw ترتيب الأولوية التالي:

- تستخدم مراجع `provider/model` الصريحة بيانات البيان الوصفية `providers` الخاصة بالمالك
- تتفوق `modelPatterns` على `modelPrefixes`
- إذا طابق كل من plugin غير مجمّع وplugin مجمّع، فإن plugin
  غير المجمّع يفوز
- يتم تجاهل أي غموض متبقٍ إلى أن يحدد المستخدم أو الإعدادات مزودًا

الحقول:

| الحقل           | النوع      | معناه                                                                      |
| --------------- | ---------- | -------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | بادئات تتم مطابقتها باستخدام `startsWith` مع معرّفات النماذج المختصرة.    |
| `modelPatterns` | `string[]` | مصادر Regex تتم مطابقتها مع معرّفات النماذج المختصرة بعد إزالة لاحقة الملف الشخصي. |

أصبحت مفاتيح الإمكانات القديمة ذات المستوى الأعلى مهملة. استخدم `openclaw doctor --fix`
لنقل `speechProviders` و`realtimeTranscriptionProviders`،
و`realtimeVoiceProviders` و`mediaUnderstandingProviders`،
و`imageGenerationProviders` و`videoGenerationProviders`،
و`webFetchProviders` و`webSearchProviders` إلى `contracts`؛
إذ لم يعد تحميل البيان العادي يعامل تلك الحقول ذات المستوى الأعلى على أنها
ملكية للإمكانات.

## البيان مقابل `package.json`

يخدم الملفان غرضين مختلفين:

| الملف                  | استخدمه من أجل                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | الاكتشاف، والتحقق من صحة الإعدادات، وبيانات خيارات المصادقة، وتلميحات UI التي يجب أن تكون موجودة قبل تشغيل كود plugin           |
| `package.json`         | بيانات npm الوصفية، وتثبيت التبعيات، وكتلة `openclaw` المستخدمة لنقاط الإدخال، أو بوابات التثبيت، أو الإعداد، أو بيانات الفهرس |

إذا لم تكن متأكدًا من مكان انتماء جزء من البيانات الوصفية، فاستخدم هذه القاعدة:

- إذا كان يجب على OpenClaw معرفته قبل تحميل كود plugin، فضعه في `openclaw.plugin.json`
- إذا كان يتعلق بالتغليف، أو ملفات الإدخال، أو سلوك تثبيت npm، فضعه في `package.json`

### حقول `package.json` التي تؤثر في الاكتشاف

توجد بعض بيانات plugin الوصفية المقصودة قبل وقت التشغيل في `package.json` ضمن
كتلة `openclaw` بدلًا من `openclaw.plugin.json`.

أمثلة مهمة:

| الحقل                                                             | معناه                                                                                                                                         |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | يعرّف نقاط إدخال plugin الأصلية.                                                                                                              |
| `openclaw.setupEntry`                                             | نقطة إدخال خفيفة مخصصة للإعداد فقط وتُستخدم أثناء الإعداد الأولي وبدء تشغيل القنوات المؤجل.                                                   |
| `openclaw.channel`                                                | بيانات وصفية خفيفة لفهرس القنوات مثل التسميات، ومسارات الوثائق، والأسماء المستعارة، ونصوص الاختيار.                                          |
| `openclaw.channel.configuredState`                                | بيانات وصفية خفيفة لفاحص الحالة المهيأة يمكنها الإجابة عن سؤال "هل يوجد إعداد قائم يعتمد فقط على البيئة؟" من دون تحميل وقت تشغيل القناة الكامل. |
| `openclaw.channel.persistedAuthState`                             | بيانات وصفية خفيفة لفاحص المصادقة المحفوظة يمكنها الإجابة عن سؤال "هل يوجد أي تسجيل دخول قائم بالفعل؟" من دون تحميل وقت تشغيل القناة الكامل.   |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | تلميحات التثبيت/التحديث لـ plugins المجمعة والمنشورة خارجيًا.                                                                                  |
| `openclaw.install.defaultChoice`                                  | مسار التثبيت المفضل عندما تتوفر عدة مصادر للتثبيت.                                                                                             |
| `openclaw.install.minHostVersion`                                 | الحد الأدنى لإصدار مضيف OpenClaw المدعوم، باستخدام حد أدنى semver مثل `>=2026.3.22`.                                                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | يسمح بمسار استرداد ضيق لإعادة تثبيت plugin مجمّع عندما تكون الإعدادات غير صالحة.                                                              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | يتيح تحميل أسطح القنوات الخاصة بالإعداد فقط قبل plugin القناة الكامل أثناء بدء التشغيل.                                                         |

يتم فرض `openclaw.install.minHostVersion` أثناء التثبيت وتحميل
سجل البيانات. وتُرفض القيم غير الصالحة؛ أما القيم الأحدث ولكن الصالحة فتجعل
plugin يُتخطى على المضيفين الأقدم.

إن `openclaw.install.allowInvalidConfigRecovery` ضيق النطاق عمدًا. فهو
لا يجعل الإعدادات المعطلة العشوائية قابلة للتثبيت. واليوم لا يسمح إلا لعمليات التثبيت
بالتعافي من إخفاقات ترقية محددة في pluginات المجمعة القديمة، مثل مسار plugin مجمّع
مفقود أو إدخال `channels.<id>` قديم لذلك
plugin المجمّع نفسه. أما أخطاء الإعدادات غير المرتبطة فما تزال تمنع التثبيت وتوجه المشغلين
إلى `openclaw doctor --fix`.

إن `openclaw.channel.persistedAuthState` هو بيانات وصفية للحزمة لوحدة
فاحص صغيرة:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

استخدمه عندما تحتاج تدفقات الإعداد أو doctor أو الحالة المهيأة إلى
فحص مصادقة بسيط بنعم/لا قبل تحميل plugin القناة الكامل. يجب أن يكون التصدير المستهدف
دالة صغيرة تقرأ الحالة المحفوظة فقط؛ ولا توجهه عبر شريط وقت تشغيل القناة الكامل.

يتبع `openclaw.channel.configuredState` الشكل نفسه لفحوصات الحالة المهيأة
البسيطة المعتمدة فقط على البيئة:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

استخدمه عندما تستطيع قناة ما تحديد الحالة المهيأة من البيئة أو من مدخلات صغيرة أخرى
غير مرتبطة بوقت التشغيل. وإذا كان الفحص يحتاج إلى حل كامل للإعدادات أو إلى
وقت تشغيل القناة الفعلي، فأبقِ هذا المنطق في hook
`config.hasConfiguredState` الخاصة بـ plugin بدلًا من ذلك.

## متطلبات JSON Schema

- **يجب على كل plugin أن يوفّر JSON Schema**، حتى إذا كان لا يقبل أي إعدادات.
- يُقبل مخطط فارغ (مثلًا `{ "type": "object", "additionalProperties": false }`).
- يتم التحقق من المخططات وقت قراءة/كتابة الإعدادات، وليس وقت التشغيل.

## سلوك التحقق

- تُعد مفاتيح `channels.*` غير المعروفة **أخطاء**، إلا إذا كان معرّف القناة مُعلنًا من خلال
  بيان plugin.
- يجب أن تشير `plugins.entries.<id>` و`plugins.allow` و`plugins.deny` و`plugins.slots.*`
  إلى معرّفات plugin **قابلة للاكتشاف**. وتُعد المعرّفات غير المعروفة **أخطاء**.
- إذا كان plugin مثبتًا ولكن بيانه أو مخططه معطّلًا أو مفقودًا،
  يفشل التحقق ويبلّغ Doctor عن خطأ plugin.
- إذا وُجدت إعدادات plugin لكن plugin **معطّل**، فسيتم الاحتفاظ بالإعدادات
  وسيظهر **تحذير** في Doctor + السجلات.

راجع [مرجع الإعدادات](/ar/gateway/configuration) للحصول على مخطط `plugins.*` الكامل.

## ملاحظات

- البيان **مطلوب لـ plugins OpenClaw الأصلية**، بما في ذلك التحميلات المحلية من نظام الملفات.
- ما يزال وقت التشغيل يحمّل وحدة plugin بشكل منفصل؛ والبيان مخصص فقط لـ
  الاكتشاف + التحقق.
- تُحلل البيانات الأصلية باستخدام JSON5، لذلك تُقبل التعليقات والفواصل اللاحقة
  والمفاتيح غير المقتبسة ما دامت القيمة النهائية لا تزال كائنًا.
- لا يقرأ محمل البيان إلا حقول البيان الموثقة. تجنب إضافة
  مفاتيح مخصصة ذات مستوى أعلى هنا.
- `providerAuthEnvVars` هو مسار البيانات الوصفية البسيط لفحوصات المصادقة، والتحقق من
  علامات env، وأسحط مصادقة المزود المماثلة التي لا ينبغي أن تشغّل وقت تشغيل plugin
  فقط لفحص أسماء env.
- يتيح `providerAuthAliases` لمتغيرات المزود إعادة استخدام مصادقة مزود آخر
  env vars وملفات تعريف المصادقة والمصادقة المعتمدة على الإعدادات وخيار الإعداد الأولي لمفتاح API
  من دون ترميز هذه العلاقة بشكل ثابت داخل النواة.
- `channelEnvVars` هو مسار البيانات الوصفية البسيط للرجوع إلى shell-env، ولمطالبات الإعداد،
  وأسحط القنوات المماثلة التي لا ينبغي أن تشغّل وقت تشغيل plugin
  فقط لفحص أسماء env.
- `providerAuthChoices` هو مسار البيانات الوصفية البسيط لمحددات خيارات المصادقة،
  وحل `--auth-choice`، وربط المزود المفضل، وتسجيل أعلام CLI البسيطة في الإعداد الأولي
  قبل تحميل وقت تشغيل المزود. أما بيانات المعالج الإرشادي وقت التشغيل
  التي تتطلب كود المزود، فراجع
  [hooks وقت تشغيل المزود](/ar/plugins/architecture#provider-runtime-hooks).
- تُختار أنواع plugin الحصرية من خلال `plugins.slots.*`.
  - يتم اختيار `kind: "memory"` بواسطة `plugins.slots.memory`.
  - يتم اختيار `kind: "context-engine"` بواسطة `plugins.slots.contextEngine`
    (الافتراضي: `legacy` المدمج).
- يمكن حذف `channels` و`providers` و`cliBackends` و`skills` عندما لا
  يحتاجها plugin.
- إذا كان plugin الخاص بك يعتمد على وحدات أصلية، فوثّق خطوات البناء وأي
  متطلبات لقائمة السماح الخاصة بمدير الحزم (مثل pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins) — البدء باستخدام plugins
- [بنية Plugins](/ar/plugins/architecture) — البنية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع Plugin SDK
