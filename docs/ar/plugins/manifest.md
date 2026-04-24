---
read_when:
    - أنت تبني Plugin لـ OpenClaw
    - تحتاج إلى شحن مخطط إعدادات Plugin أو تصحيح أخطاء التحقق من Plugin
summary: بيان Plugin ومتطلبات JSON schema (تحقق صارم من الإعدادات)
title: بيان Plugin
x-i18n:
    generated_at: "2026-04-24T07:54:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e680a978c4f0bc8fec099462a6e08585f39dfd72e0c159ecfe5162586e7d7258
    source_path: plugins/manifest.md
    workflow: 15
---

هذه الصفحة مخصصة فقط لـ **بيان Plugin الأصلي الخاص بـ OpenClaw**.

أما بالنسبة إلى تخطيطات الحزم المتوافقة، فراجع [حزم Plugin](/ar/plugins/bundles).

تستخدم تنسيقات الحزم المتوافقة ملفات بيان مختلفة:

- حزمة Codex: ‏`.codex-plugin/plugin.json`
- حزمة Claude: ‏`.claude-plugin/plugin.json` أو تخطيط
  مكونات Claude الافتراضي من دون بيان
- حزمة Cursor: ‏`.cursor-plugin/plugin.json`

يكتشف OpenClaw تلقائيًا تخطيطات الحزم هذه أيضًا، لكنها لا تُتحقق
مقابل مخطط `openclaw.plugin.json` الموصوف هنا.

بالنسبة إلى الحزم المتوافقة، يقرأ OpenClaw حاليًا بيانات الحزمة الوصفية إضافة إلى
جذور Skills المعلنة، وجذور أوامر Claude، وقيم `settings.json` الافتراضية في حزمة Claude،
وقيم LSP الافتراضية في حزمة Claude، وحزم hooks المدعومة عندما يطابق التخطيط
توقعات وقت تشغيل OpenClaw.

يجب أن يشحن كل Plugin أصلي في OpenClaw **ملف `openclaw.plugin.json`** في
**جذر Plugin**. يستخدم OpenClaw هذا البيان للتحقق من الإعدادات
**من دون تنفيذ شيفرة Plugin**. وتُعامل البيانات المفقودة أو غير الصالحة على أنها
أخطاء Plugin وتمنع التحقق من الإعدادات.

راجع دليل نظام Plugin الكامل: [Plugins](/ar/tools/plugin).
وللاطلاع على نموذج الإمكانات الأصلي وإرشادات التوافق الخارجي الحالية:
[نموذج الإمكانات](/ar/plugins/architecture#public-capability-model).

## ما الذي يفعله هذا الملف

يُعد `openclaw.plugin.json` بيانات وصفية يقرأها OpenClaw **قبل أن يحمّل
شيفرة Plugin**. ويجب أن يكون كل ما أدناه رخيصًا بما يكفي لفحصه من دون تشغيل
وقت تشغيل Plugin.

**استخدمه من أجل:**

- هوية Plugin، والتحقق من الإعدادات، وتلميحات واجهة إعدادات الإعداد
- بيانات المصادقة، والإعداد الأولي، والإعداد (الاسم البديل، والتفعيل التلقائي، ومتغيرات بيئة المزوّد، وخيارات المصادقة)
- تلميحات التفعيل لأسطح مستوى التحكم
- ملكية مختصرة لعائلات النماذج
- لقطات ثابتة لملكية الإمكانات (`contracts`)
- بيانات QA runner الوصفية التي يمكن لمضيف `openclaw qa` المشترك فحصها
- بيانات إعدادات خاصة بالقناة يتم دمجها في أسطح الكتالوج والتحقق

**لا تستخدمه من أجل:** تسجيل سلوك وقت التشغيل، أو إعلان نقاط دخول الشيفرة،
أو بيانات تثبيت npm الوصفية. فهذه تنتمي إلى شيفرة Plugin و`package.json`.

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

## مثال غني

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
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
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
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

## مرجع الحقول العليا

| الحقل                                | مطلوب | النوع                            | ما الذي يعنيه                                                                                                                                                                                                                   |
| ------------------------------------ | ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | نعم   | `string`                         | معرّف Plugin المرجعي. وهذا هو المعرّف المستخدم في `plugins.entries.<id>`.                                                                                                                                                       |
| `configSchema`                       | نعم   | `object`                         | JSON Schema مضمن لإعدادات هذا Plugin.                                                                                                                                                                                            |
| `enabledByDefault`                   | لا    | `true`                           | يضع علامة على Plugin مضمن بوصفه مفعّلًا افتراضيًا. احذفه، أو اضبط أي قيمة غير `true`، لترك Plugin معطلًا افتراضيًا.                                                                                                          |
| `legacyPluginIds`                    | لا    | `string[]`                       | معرّفات قديمة تُطبَّع إلى معرّف Plugin المرجعي هذا.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | لا    | `string[]`                       | معرّفات مزوّدين يجب أن تفعّل هذا Plugin تلقائيًا عندما تذكرها المصادقة أو الإعدادات أو مراجع النماذج.                                                                                                                         |
| `kind`                               | لا    | `"memory"` \| `"context-engine"` | يعلن نوع Plugin حصريًا يُستخدم بواسطة `plugins.slots.*`.                                                                                                                                                                       |
| `channels`                           | لا    | `string[]`                       | معرّفات القنوات التي يملكها هذا Plugin. وتُستخدم للاكتشاف والتحقق من الإعدادات.                                                                                                                                                 |
| `providers`                          | لا    | `string[]`                       | معرّفات المزوّدين التي يملكها هذا Plugin.                                                                                                                                                                                        |
| `providerDiscoveryEntry`             | لا    | `string`                         | مسار وحدة خفيف لاكتشاف المزوّد، نسبي إلى جذر Plugin، من أجل بيانات كتالوج المزوّدات ذات النطاق البياني التي يمكن تحميلها من دون تفعيل وقت تشغيل Plugin الكامل.                                                               |
| `modelSupport`                       | لا    | `object`                         | بيانات وصفية مختصرة مملوكة للبيان لعائلات النماذج تُستخدم لتحميل Plugin تلقائيًا قبل وقت التشغيل.                                                                                                                              |
| `providerEndpoints`                  | لا    | `object[]`                       | بيانات وصفية مملوكة للبيان عن host/baseUrl لنقاط نهاية المزوّدات بالنسبة إلى مسارات المزوّد التي يجب أن يصنّفها core قبل تحميل وقت تشغيل المزوّد.                                                                             |
| `cliBackends`                        | لا    | `string[]`                       | معرّفات الواجهات الخلفية للاستدلال عبر CLI التي يملكها هذا Plugin. وتُستخدم للتفعيل التلقائي عند بدء التشغيل من مراجع الإعداد الصريحة.                                                                                        |
| `syntheticAuthRefs`                  | لا    | `string[]`                       | مراجع المزوّد أو الواجهة الخلفية لـ CLI التي يجب فحص خطاف المصادقة الاصطناعية المملوك للـ Plugin لها أثناء الاكتشاف البارد للنماذج قبل تحميل وقت التشغيل.                                                                      |
| `nonSecretAuthMarkers`               | لا    | `string[]`                       | قيم مفاتيح API النائبة غير السرية المملوكة للـ Plugin المضمن والتي تمثل حالة بيانات اعتماد محلية أو OAuth أو ambient غير سرية.                                                                                                   |
| `commandAliases`                     | لا    | `object[]`                       | أسماء الأوامر التي يملكها هذا Plugin والتي يجب أن تنتج تشخيصات واعية بالـ Plugin في الإعدادات وCLI قبل تحميل وقت التشغيل.                                                                                                       |
| `providerAuthEnvVars`                | لا    | `Record<string, string[]>`       | بيانات وصفية خفيفة لبيئة مصادقة المزوّد يمكن لـ OpenClaw فحصها من دون تحميل شيفرة Plugin.                                                                                                                                       |
| `providerAuthAliases`                | لا    | `Record<string, string>`         | معرّفات مزوّدين يجب أن تعيد استخدام معرّف مزوّد آخر للبحث عن المصادقة، مثل مزوّد برمجة يشارك مفتاح API وملفات تعريف المصادقة الخاصة بالمزوّد الأساسي.                                                                           |
| `channelEnvVars`                     | لا    | `Record<string, string[]>`       | بيانات وصفية خفيفة لبيئة القناة يمكن لـ OpenClaw فحصها من دون تحميل شيفرة Plugin. استخدم هذا لإعداد القناة المعتمد على البيئة أو أسطح المصادقة التي يجب أن تراها مساعدات البدء/الإعداد العامة.                               |
| `providerAuthChoices`                | لا    | `object[]`                       | بيانات وصفية خفيفة لخيارات المصادقة لمحددات الإعداد الأولي، وتحليل المزوّد المفضّل، وربط أعلام CLI البسيطة.                                                                                                                     |
| `activation`                         | لا    | `object`                         | بيانات وصفية خفيفة لمخطط التفعيل لتحميل يعتمد على المزوّد، أو الأمر، أو القناة، أو المسار، أو الإمكانية. بيانات وصفية فقط؛ وما يزال وقت تشغيل Plugin هو المالك للسلوك الفعلي.                                                |
| `setup`                              | لا    | `object`                         | واصفات خفيفة للإعداد/الإعداد الأولي يمكن لأسطح الاكتشاف والإعداد فحصها من دون تحميل وقت تشغيل Plugin.                                                                                                                           |
| `qaRunners`                          | لا    | `object[]`                       | واصفات خفيفة لـ QA runner يستخدمها مضيف `openclaw qa` المشترك قبل تحميل وقت تشغيل Plugin.                                                                                                                                       |
| `contracts`                          | لا    | `object`                         | لقطة ثابتة للإمكانات المضمنة للمصادقة الخارجية، والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الموسيقى، وتوليد الفيديو، وجلب الويب، والبحث في الويب، وملكية الأدوات.                             |
| `mediaUnderstandingProviderMetadata` | لا    | `Record<string, object>`         | إعدادات افتراضية خفيفة لفهم الوسائط لمعرّفات المزوّدين المعلنة في `contracts.mediaUnderstandingProviders`.                                                                                                                       |
| `channelConfigs`                     | لا    | `Record<string, object>`         | بيانات وصفية لإعدادات القناة مملوكة للبيان يتم دمجها في أسطح الاكتشاف والتحقق قبل تحميل وقت التشغيل.                                                                                                                             |
| `skills`                             | لا    | `string[]`                       | أدلة Skills المطلوب تحميلها، نسبةً إلى جذر Plugin.                                                                                                                                                                               |
| `name`                               | لا    | `string`                         | اسم Plugin مقروء للبشر.                                                                                                                                                                                                           |
| `description`                        | لا    | `string`                         | ملخص قصير يظهر في أسطح Plugin.                                                                                                                                                                                                    |
| `version`                            | لا    | `string`                         | إصدار Plugin معلوماتي.                                                                                                                                                                                                            |
| `uiHints`                            | لا    | `Record<string, object>`         | تسميات واجهة المستخدم، والعناصر النائبة، وتلميحات الحساسية لحقول الإعدادات.                                                                                                                                                      |

## مرجع `providerAuthChoices`

يصف كل إدخال في `providerAuthChoices` خيارًا واحدًا من خيارات الإعداد الأولي أو المصادقة.
يقرأ OpenClaw هذا قبل تحميل وقت تشغيل المزوّد.

| الحقل                 | مطلوب | النوع                                           | ما الذي يعنيه                                                                                         |
| --------------------- | ----- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`            | نعم   | `string`                                        | معرّف المزوّد الذي ينتمي إليه هذا الخيار.                                                              |
| `method`              | نعم   | `string`                                        | معرّف طريقة المصادقة المطلوب توجيهها إليه.                                                            |
| `choiceId`            | نعم   | `string`                                        | معرّف ثابت لخيار المصادقة تستخدمه تدفقات الإعداد الأولي وCLI.                                          |
| `choiceLabel`         | لا    | `string`                                        | تسمية موجهة للمستخدم. وإذا حُذفت، يعود OpenClaw إلى `choiceId`.                                      |
| `choiceHint`          | لا    | `string`                                        | نص مساعد قصير لمحدد الاختيار.                                                                         |
| `assistantPriority`   | لا    | `number`                                        | تُرتّب القيم الأدنى أولًا في محددات الاختيار التفاعلية التي يقودها المساعد.                           |
| `assistantVisibility` | لا    | `"visible"` \| `"manual-only"`                  | يُخفي الخيار من محددات المساعد مع السماح باختياره يدويًا عبر CLI.                                      |
| `deprecatedChoiceIds` | لا    | `string[]`                                      | معرّفات خيارات قديمة يجب أن تعيد توجيه المستخدمين إلى هذا الخيار البديل.                              |
| `groupId`             | لا    | `string`                                        | معرّف مجموعة اختياري لتجميع الخيارات ذات الصلة.                                                       |
| `groupLabel`          | لا    | `string`                                        | تسمية موجّهة للمستخدم لتلك المجموعة.                                                                  |
| `groupHint`           | لا    | `string`                                        | نص مساعد قصير للمجموعة.                                                                               |
| `optionKey`           | لا    | `string`                                        | مفتاح خيار داخلي لتدفقات المصادقة البسيطة أحادية العلم.                                                |
| `cliFlag`             | لا    | `string`                                        | اسم علم CLI، مثل `--openrouter-api-key`.                                                              |
| `cliOption`           | لا    | `string`                                        | شكل خيار CLI الكامل، مثل `--openrouter-api-key <key>`.                                                |
| `cliDescription`      | لا    | `string`                                        | الوصف المستخدم في مساعدة CLI.                                                                         |
| `onboardingScopes`    | لا    | `Array<"text-inference" \| "image-generation">` | الأسطح الخاصة بالإعداد الأولي التي يجب أن يظهر فيها هذا الخيار. وإذا حُذفت، فالقيمة الافتراضية هي `["text-inference"]`. |

## مرجع `commandAliases`

استخدم `commandAliases` عندما يملك Plugin اسم أمر وقت تشغيل قد
يضعه المستخدمون خطأً في `plugins.allow` أو يحاولون تشغيله كأمر CLI جذري. يستخدم OpenClaw
هذه البيانات الوصفية للتشخيص من دون استيراد شيفرة وقت تشغيل Plugin.

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

| الحقل        | مطلوب | النوع             | ما الذي يعنيه                                                          |
| ------------ | ----- | ----------------- | ---------------------------------------------------------------------- |
| `name`       | نعم   | `string`          | اسم الأمر الذي ينتمي إلى هذا Plugin.                                  |
| `kind`       | لا    | `"runtime-slash"` | يضع علامة على الاسم البديل بوصفه أمر شرطة مائلة للدردشة، وليس أمر CLI جذريًا. |
| `cliCommand` | لا    | `string`          | أمر CLI جذري ذي صلة لاقتراحه على عمليات CLI، إن وجد.                  |

## مرجع `activation`

استخدم `activation` عندما يستطيع Plugin أن يعلن بشكل خفيف أي أحداث مستوى التحكم
يجب أن تتضمنه في خطة تفعيل/تحميل.

هذه الكتلة هي بيانات وصفية للمخطط، وليست API لدورة الحياة. فهي لا تسجل
سلوك وقت التشغيل، ولا تستبدل `register(...)`، ولا تعد
بأن شيفرة Plugin قد تم تنفيذها بالفعل. يستخدم مخطط التفعيل هذه الحقول
لتضييق Plugins المرشحة قبل الرجوع إلى بيانات ملكية البيان الحالية
مثل `providers` و`channels` و`commandAliases` و`setup.providers` و`contracts.tools` وhooks.

فضّل أضيق بيانات وصفية تصف الملكية بالفعل. استخدم
`providers` أو `channels` أو `commandAliases` أو واصفات setup أو `contracts`
عندما تعبّر هذه الحقول عن العلاقة. واستخدم `activation` من أجل تلميحات إضافية
للمخطط لا يمكن تمثيلها عبر حقول الملكية تلك.

هذه الكتلة بيانات وصفية فقط. فهي لا تسجل سلوك وقت التشغيل، كما أنها
لا تستبدل `register(...)` أو `setupEntry` أو نقاط دخول وقت التشغيل/Plugin الأخرى.
ويستخدمها المستهلكون الحاليون كتلميح للتضييق قبل تحميل Plugins على نطاق أوسع، لذا
فإن غياب بيانات `activation` الوصفية عادةً لا يكلف إلا الأداء؛ ويجب ألا
يغيّر الصحة ما دامت حالات الرجوع إلى ملكية البيان القديمة ما تزال موجودة.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| الحقل            | مطلوب | النوع                                                | ما الذي يعنيه                                                                                          |
| ---------------- | ----- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `onProviders`    | لا    | `string[]`                                           | معرّفات المزوّدين التي يجب أن تتضمن هذا Plugin في خطط التفعيل/التحميل.                                 |
| `onCommands`     | لا    | `string[]`                                           | معرّفات الأوامر التي يجب أن تتضمن هذا Plugin في خطط التفعيل/التحميل.                                   |
| `onChannels`     | لا    | `string[]`                                           | معرّفات القنوات التي يجب أن تتضمن هذا Plugin في خطط التفعيل/التحميل.                                   |
| `onRoutes`       | لا    | `string[]`                                           | أنواع المسارات التي يجب أن تتضمن هذا Plugin في خطط التفعيل/التحميل.                                    |
| `onCapabilities` | لا    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | تلميحات إمكانات عامة تستخدمها خطط التفعيل في مستوى التحكم. ويفضّل استخدام الحقول الأضيق عندما يكون ذلك ممكنًا. |

المستهلكون الحيون الحاليون:

- يعود تخطيط CLI الذي يُطلقه الأمر إلى القيم القديمة
  `commandAliases[].cliCommand` أو `commandAliases[].name`
- يعود تخطيط الإعداد/القناة الذي تُطلقه القناة إلى ملكية `channels[]`
  القديمة عندما تكون بيانات تفعيل القناة الصريحة مفقودة
- يعود تخطيط الإعداد/وقت التشغيل الذي يُطلقه المزوّد إلى الملكية القديمة
  `providers[]` وملكية `cliBackends[]` على المستوى الأعلى عندما تكون بيانات تفعيل المزوّد
  الصريحة مفقودة

يمكن لتشخيصات المخطط التمييز بين تلميحات التفعيل الصريحة وحالات الرجوع إلى
ملكية البيان. على سبيل المثال، يعني `activation-command-hint` أن
`activation.onCommands` طابقت، بينما يعني `manifest-command-alias` أن
المخطط استخدم ملكية `commandAliases` بدلًا من ذلك. إن تسميات الأسباب هذه مخصصة
لتشخيصات المضيف والاختبارات؛ ويجب على مؤلفي Plugins الاستمرار في إعلان البيانات الوصفية
التي تصف الملكية بأفضل شكل.

## مرجع `qaRunners`

استخدم `qaRunners` عندما يساهم Plugin بواحد أو أكثر من transport runners تحت
الجذر المشترك `openclaw qa`. أبقِ هذه البيانات الوصفية خفيفة وثابتة؛ فما يزال
وقت تشغيل Plugin هو المالك للتسجيل الفعلي في CLI عبر سطح
`runtime-api.ts` خفيف يصدر `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| الحقل         | مطلوب | النوع    | ما الذي يعنيه                                                       |
| ------------- | ----- | -------- | ------------------------------------------------------------------- |
| `commandName` | نعم   | `string` | الأمر الفرعي المركّب تحت `openclaw qa`، مثل `matrix`.              |
| `description` | لا    | `string` | نص مساعدة احتياطي يستخدمه المضيف المشترك عندما يحتاج إلى أمر stub. |

## مرجع `setup`

استخدم `setup` عندما تحتاج أسطح الإعداد والإعداد الأولي إلى بيانات وصفية خفيفة مملوكة للـ Plugin
قبل تحميل وقت التشغيل.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

يبقى `cliBackends` على المستوى الأعلى صالحًا ويستمر في وصف
الواجهات الخلفية للاستدلال عبر CLI. أما `setup.cliBackends` فهو سطح الواصفات الخاص بالإعداد
لتدفقات مستوى التحكم/الإعداد التي يجب أن تبقى بيانات وصفية فقط.

عند وجودهما، تكون `setup.providers` و`setup.cliBackends` هما سطح البحث
المفضّل المعتمد على الواصفات أولًا لاكتشاف الإعداد. وإذا كانت الواصفة
لا تفعل إلا تضييق Plugin المرشّح وكان setup ما يزال يحتاج إلى خطافات وقت إعداد أغنى،
فاضبط `requiresRuntime: true` وأبقِ `setup-api` في مكانه كمسار تنفيذ احتياطي.

ولأن بحث setup قد ينفذ شيفرة `setup-api` مملوكة للـ Plugin، يجب أن تبقى
القيم المطبّعة لـ `setup.providers[].id` و`setup.cliBackends[]` فريدة عبر
Plugins المكتشفة. وتفشل الملكية الغامضة في وضع الإغلاق الآمن بدلًا من اختيار
فائز وفق ترتيب الاكتشاف.

### مرجع `setup.providers`

| الحقل         | مطلوب | النوع      | ما الذي يعنيه                                                                       |
| ------------- | ----- | ---------- | ----------------------------------------------------------------------------------- |
| `id`          | نعم   | `string`   | معرّف المزوّد المكشوف أثناء الإعداد أو الإعداد الأولي. أبقِ المعرّفات المطبّعة فريدة عالميًا. |
| `authMethods` | لا    | `string[]` | معرّفات طرق الإعداد/المصادقة التي يدعمها هذا المزوّد من دون تحميل وقت التشغيل الكامل. |
| `envVars`     | لا    | `string[]` | متغيرات البيئة التي يمكن لأسطح الإعداد/الحالة العامة فحصها قبل تحميل وقت تشغيل Plugin. |

### حقول `setup`

| الحقل              | مطلوب | النوع      | ما الذي يعنيه                                                                                      |
| ------------------ | ----- | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | لا    | `object[]` | واصفات إعداد المزوّد المكشوفة أثناء الإعداد والإعداد الأولي.                                       |
| `cliBackends`      | لا    | `string[]` | معرّفات الواجهات الخلفية وقت الإعداد المستخدمة في البحث المعتمد على الواصفات أولًا. أبقِ المعرّفات المطبّعة فريدة عالميًا. |
| `configMigrations` | لا    | `string[]` | معرّفات ترحيل الإعدادات التي يملكها سطح setup الخاص بهذا Plugin.                                  |
| `requiresRuntime`  | لا    | `boolean`  | ما إذا كان setup ما يزال يحتاج إلى تنفيذ `setup-api` بعد البحث المعتمد على الواصفات.             |

## مرجع `uiHints`

إن `uiHints` عبارة عن خريطة من أسماء حقول الإعدادات إلى تلميحات عرض صغيرة.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

يمكن أن يتضمن كل تلميح حقل ما يلي:

| الحقل         | النوع      | ما الذي يعنيه                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | تسمية الحقل الموجهة للمستخدم.           |
| `help`        | `string`   | نص مساعد قصير.                          |
| `tags`        | `string[]` | وسوم واجهة مستخدم اختيارية.             |
| `advanced`    | `boolean`  | يضع علامة على الحقل بوصفه متقدمًا.      |
| `sensitive`   | `boolean`  | يضع علامة على الحقل بوصفه سريًا أو حساسًا. |
| `placeholder` | `string`   | نص العنصر النائب لمدخلات النماذج.        |

## مرجع `contracts`

استخدم `contracts` فقط لبيانات ملكية الإمكانات الثابتة التي يمكن لـ OpenClaw
قراءتها من دون استيراد وقت تشغيل Plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| الحقل                            | النوع      | ما الذي يعنيه                                                     |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | معرّفات وقت تشغيل مضمن قد يسجّل لها Plugin مضمن factories.        |
| `externalAuthProviders`          | `string[]` | معرّفات المزوّدين التي يملك هذا Plugin خطاف ملف تعريف المصادقة الخارجي لها. |
| `speechProviders`                | `string[]` | معرّفات مزوّدي الكلام التي يملكها هذا Plugin.                     |
| `realtimeTranscriptionProviders` | `string[]` | معرّفات مزوّدي النسخ الفوري التي يملكها هذا Plugin.               |
| `realtimeVoiceProviders`         | `string[]` | معرّفات مزوّدي الصوت الفوري التي يملكها هذا Plugin.               |
| `memoryEmbeddingProviders`       | `string[]` | معرّفات مزوّدي embeddings الخاصة بالذاكرة التي يملكها هذا Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | معرّفات مزوّدي فهم الوسائط التي يملكها هذا Plugin.                |
| `imageGenerationProviders`       | `string[]` | معرّفات مزوّدي توليد الصور التي يملكها هذا Plugin.                |
| `videoGenerationProviders`       | `string[]` | معرّفات مزوّدي توليد الفيديو التي يملكها هذا Plugin.              |
| `webFetchProviders`              | `string[]` | معرّفات مزوّدي جلب الويب التي يملكها هذا Plugin.                  |
| `webSearchProviders`             | `string[]` | معرّفات مزوّدي البحث في الويب التي يملكها هذا Plugin.             |
| `tools`                          | `string[]` | أسماء أدوات الوكيل التي يملكها هذا Plugin لفحوصات العقود المضمنة. |

يجب على Plugins المزوّدين التي تنفذ `resolveExternalAuthProfiles` أن تعلن
`contracts.externalAuthProviders`. وما تزال Plugins التي لا تتضمن هذا الإعلان تعمل
عبر رجوع توافق قديم متقادم، لكن هذا الرجوع أبطأ
وسيُزال بعد نافذة الترحيل.

يجب على مزوّدي embeddings المضمنين للذاكرة أن يعلنوا
`contracts.memoryEmbeddingProviders` لكل معرّف محول يكشفونه، بما في ذلك
المحولات المضمنة مثل `local`. وتستخدم مسارات CLI المستقلة هذا العقد البياني
لتحميل Plugin المالك فقط قبل أن يسجّل وقت تشغيل Gateway الكامل
المزوّدين.

## مرجع `mediaUnderstandingProviderMetadata`

استخدم `mediaUnderstandingProviderMetadata` عندما يكون لدى مزوّد فهم الوسائط
نماذج افتراضية، أو أولوية رجوع تلقائي للمصادقة، أو دعم أصلي للمستندات
تحتاجه مساعدات core العامة قبل تحميل وقت التشغيل. كما يجب إعلان المفاتيح
أيضًا في `contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

يمكن أن يتضمن كل إدخال مزوّد ما يلي:

| الحقل                  | النوع                               | ما الذي يعنيه                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | إمكانات الوسائط التي يكشفها هذا المزوّد.                                     |
| `defaultModels`        | `Record<string, string>`            | القيم الافتراضية من الإمكانية إلى النموذج المستخدمة عندما لا تحدد الإعدادات نموذجًا. |
| `autoPriority`         | `Record<string, number>`            | تُرتّب الأرقام الأقل أولًا في الرجوع التلقائي إلى المزوّد المعتمد على بيانات الاعتماد. |
| `nativeDocumentInputs` | `"pdf"[]`                           | مدخلات المستندات الأصلية التي يدعمها المزوّد.                               |

## مرجع `channelConfigs`

استخدم `channelConfigs` عندما يحتاج Plugin قناة إلى بيانات إعدادات خفيفة
قبل تحميل وقت التشغيل.

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
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

يمكن أن يتضمن كل إدخال قناة ما يلي:

| الحقل         | النوع                    | ما الذي يعنيه                                                                                |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema لـ `channels.<id>`. وهو مطلوب لكل إدخال إعداد قناة معلن.                         |
| `uiHints`     | `Record<string, object>` | تسميات/عناصر نائبة/تلميحات حساسة اختيارية لواجهة المستخدم لذلك القسم من إعدادات القناة.     |
| `label`       | `string`                 | تسمية القناة المدمجة في أسطح المحدد والفحص عندما لا تكون بيانات وقت التشغيل الوصفية جاهزة.   |
| `description` | `string`                 | وصف قصير للقناة لأسطح الفحص والكتالوج.                                                       |
| `preferOver`  | `string[]`               | معرّفات Plugins قديمة أو أقل أولوية يجب أن تتفوق عليها هذه القناة في أسطح الاختيار.          |

## مرجع `modelSupport`

استخدم `modelSupport` عندما يجب على OpenClaw أن يستنتج Plugin المزوّد الخاص بك من
معرّفات نماذج مختصرة مثل `gpt-5.5` أو `claude-sonnet-4.6` قبل تحميل وقت تشغيل Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

يطبق OpenClaw هذه الأولوية:

- تستخدم مراجع `provider/model` الصريحة بيانات `providers` البيانية الخاصة بالملكية
- تتغلب `modelPatterns` على `modelPrefixes`
- إذا طابق كل من Plugin غير مضمّن وPlugin مضمّن معًا، فإن Plugin غير المضمّن
  يفوز
- يتم تجاهل الغموض المتبقي إلى أن يحدد المستخدم أو الإعدادات مزوّدًا

الحقول:

| الحقل           | النوع      | ما الذي يعنيه                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | بادئات يتم مطابقتها باستخدام `startsWith` مع معرّفات النماذج المختصرة.        |
| `modelPatterns` | `string[]` | مصادر Regex تُطابق مع معرّفات النماذج المختصرة بعد إزالة لاحقة ملف التعريف.    |

مفاتيح الإمكانات القديمة على المستوى الأعلى متقادمة. استخدم `openclaw doctor --fix` من أجل
نقل `speechProviders` و`realtimeTranscriptionProviders`,
و`realtimeVoiceProviders`, و`mediaUnderstandingProviders`,
و`imageGenerationProviders`, و`videoGenerationProviders`,
و`webFetchProviders`, و`webSearchProviders` تحت `contracts`; ولم يعد
تحميل البيان العادي يعامل تلك الحقول العليا على أنها ملكية للإمكانات.

## البيان مقابل package.json

يؤدي الملفان وظيفتين مختلفتين:

| الملف                  | استخدمه من أجل                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | الاكتشاف، والتحقق من الإعدادات، وبيانات خيارات المصادقة الوصفية، وتلميحات واجهة المستخدم التي يجب أن توجد قبل تشغيل شيفرة Plugin |
| `package.json`         | بيانات npm الوصفية، وتثبيت التبعيات، وكتلة `openclaw` المستخدمة لنقاط الدخول، وحجب التثبيت، والإعداد، أو بيانات الكتالوج الوصفية |

إذا لم تكن متأكدًا من مكان انتماء جزء من البيانات الوصفية، فاستخدم هذه القاعدة:

- إذا كان يجب على OpenClaw معرفته قبل تحميل شيفرة Plugin، فضعه في `openclaw.plugin.json`
- إذا كان متعلقًا بالتغليف أو ملفات الدخول أو سلوك تثبيت npm، فضعه في `package.json`

### حقول package.json التي تؤثر في الاكتشاف

تعيش بعض بيانات Plugin الوصفية المقصودة لما قبل وقت التشغيل عمدًا في `package.json` تحت
كتلة `openclaw` بدلًا من `openclaw.plugin.json`.

أمثلة مهمة:

| الحقل                                                             | ما الذي يعنيه                                                                                                                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | يعلن نقاط دخول Plugin الأصلية. ويجب أن تبقى داخل دليل حزمة Plugin.                                                                                                              |
| `openclaw.runtimeExtensions`                                      | يعلن نقاط دخول وقت التشغيل المبنية بلغة JavaScript للحزم المثبتة. ويجب أن تبقى داخل دليل حزمة Plugin.                                                                           |
| `openclaw.setupEntry`                                             | نقطة دخول خفيفة خاصة بالإعداد فقط تُستخدم أثناء الإعداد الأولي، وبدء القنوات المؤجل، واكتشاف حالة القنوات/SecretRef في وضع القراءة فقط. ويجب أن تبقى داخل دليل حزمة Plugin.       |
| `openclaw.runtimeSetupEntry`                                      | يعلن نقطة دخول الإعداد المبنية بلغة JavaScript للحزم المثبتة. ويجب أن تبقى داخل دليل حزمة Plugin.                                                                                |
| `openclaw.channel`                                                | بيانات وصفية خفيفة لكتالوج القنوات مثل التسميات، ومسارات الوثائق، والأسماء البديلة، والنص الخاص بالاختيار.                                                                        |
| `openclaw.channel.configuredState`                                | بيانات وصفية خفيفة لفاحص حالة الضبط يمكنها الإجابة عن سؤال «هل يوجد إعداد قائم على البيئة فقط بالفعل؟» من دون تحميل وقت تشغيل القناة الكامل.                                       |
| `openclaw.channel.persistedAuthState`                             | بيانات وصفية خفيفة لفاحص المصادقة المحفوظة يمكنها الإجابة عن سؤال «هل تم تسجيل الدخول إلى أي شيء بالفعل؟» من دون تحميل وقت تشغيل القناة الكامل.                                   |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | تلميحات التثبيت/التحديث لـ Plugins المضمنة والمنشورة خارجيًا.                                                                                                                    |
| `openclaw.install.defaultChoice`                                  | مسار التثبيت المفضل عند توفر عدة مصادر للتثبيت.                                                                                                                                   |
| `openclaw.install.minHostVersion`                                 | الحد الأدنى المدعوم من إصدار مضيف OpenClaw باستخدام حد semver أدنى مثل `>=2026.3.22`.                                                                                            |
| `openclaw.install.expectedIntegrity`                              | سلسلة integrity متوقعة لتوزيعة npm مثل `sha512-...`؛ وتتحقق تدفقات التثبيت والتحديث من العنصر المجلوب مقابلها.                                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | يسمح بمسار استرداد ضيق لإعادة تثبيت Plugin مضمن عندما تكون الإعدادات غير صالحة.                                                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | يسمح بتحميل أسطح القناة الخاصة بالإعداد فقط قبل Plugin القناة الكامل أثناء البدء.                                                                                                 |

تحدد بيانات البيان الوصفية خيارات المزوّد/القناة/الإعداد التي تظهر في
الإعداد الأولي قبل تحميل وقت التشغيل. ويخبر `package.json#openclaw.install`
الإعداد الأولي بكيفية جلب ذلك Plugin أو تفعيله عندما يختار المستخدم أحد تلك
الخيارات. لا تنقل تلميحات التثبيت إلى `openclaw.plugin.json`.

يتم فرض `openclaw.install.minHostVersion` أثناء التثبيت وتحميل
سجل البيان. وتُرفض القيم غير الصالحة؛ أما القيم الأحدث لكن الصالحة فتتخطى
Plugin على المضيفات الأقدم.

يوجد تثبيت الإصدار الدقيق لـ npm بالفعل في `npmSpec`، على سبيل المثال
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. ويجب أن تقرن إدخالات
الكتالوج الخارجي الرسمي المواصفات الدقيقة مع `expectedIntegrity` بحيث تفشل
تدفقات التحديث في وضع الإغلاق الآمن إذا لم يعد عنصر npm المجلوب يطابق الإصدار المثبت.
وما يزال الإعداد الأولي التفاعلي يعرض مواصفات npm لسجل موثوق، بما في ذلك
أسماء الحزم المجردة وdist-tags، للتوافق. ويمكن لتشخيصات الكتالوج
التمييز بين المصادر الدقيقة، والعائمة، والمثبتة عبر integrity، والمفتقدة لـ integrity.
وعندما تكون `expectedIntegrity` موجودة، تفرضها تدفقات التثبيت/التحديث؛ وعندما
تُحذف، يتم تسجيل تحليل السجل من دون تثبيت integrity.

يجب أن توفر Plugins القنوات `openclaw.setupEntry` عندما تحتاج الحالة، أو قائمة القنوات،
أو فحوصات SecretRef إلى تحديد الحسابات المضبوطة من دون تحميل
وقت التشغيل الكامل. ويجب أن تكشف نقطة دخول setup عن بيانات القناة الوصفية إضافة إلى محولات
الإعدادات، والحالة، والأسرار الآمنة بالنسبة إلى setup؛ وأبقِ عملاء الشبكة، ومستمعي gateway،
وأوقات تشغيل النقل في نقطة دخول الامتداد الرئيسية.

لا تتجاوز حقول نقطة دخول وقت التشغيل فحوصات حدود الحزم الخاصة
بحقول نقطة دخول المصدر. فعلى سبيل المثال، لا يمكن لـ `openclaw.runtimeExtensions`
أن تجعل مسار `openclaw.extensions` الهارب قابلًا للتحميل.

إن `openclaw.install.allowInvalidConfigRecovery` ضيق عمدًا. فهو لا
يجعل الإعدادات المكسورة العشوائية قابلة للتثبيت. واليوم لا يسمح إلا
لتدفقات التثبيت بالاسترداد من إخفاقات ترقية قديمة محددة خاصة بـ Plugin مضمن، مثل
غياب مسار Plugin مضمن أو إدخال قديم في `channels.<id>` لذلك
Plugin المضمن نفسه. أما أخطاء الإعدادات غير ذات الصلة فما تزال تحظر التثبيت وتوجّه
المشغلين إلى `openclaw doctor --fix`.

إن `openclaw.channel.persistedAuthState` هو بيانات package الوصفية لوحدة فحص صغيرة:

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

استخدمه عندما تحتاج تدفقات setup أو doctor أو configured-state إلى فحص مصادقة
رخيص بنعم/لا قبل تحميل Plugin القناة الكامل. ويجب أن يكون التصدير المستهدف
دالة صغيرة تقرأ الحالة المحفوظة فقط؛ ولا تمرره عبر
الحاوية الكاملة لوقت تشغيل القناة.

يتبع `openclaw.channel.configuredState` الشكل نفسه للفحوصات الرخيصة
للحالة المضبوطة اعتمادًا على البيئة فقط:

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

استخدمه عندما تتمكن القناة من الإجابة عن configured-state من البيئة أو من
مدخلات صغيرة أخرى غير وقت التشغيل. وإذا كان الفحص يحتاج إلى تحليل إعدادات كامل أو إلى
وقت تشغيل القناة الحقيقي، فأبقِ هذا المنطق في خطاف `config.hasConfiguredState`
داخل Plugin بدلًا من ذلك.

## أسبقية الاكتشاف (معرّفات Plugin المكررة)

يكتشف OpenClaw Plugins من عدة جذور (مضمنة، وتثبيت عام، ومساحة عمل، ومسارات صريحة مختارة بالإعدادات). وإذا تشارك اكتشافان في المعرف `id` نفسه، فلا يُحتفَظ إلا بالبيان **الأعلى أسبقية**؛ أما التكرارات ذات الأسبقية الأدنى فتُسقط بدلًا من تحميلها إلى جانبه.

الأسبقية، من الأعلى إلى الأدنى:

1. **مختار بالإعدادات** — مسار مثبت صراحةً في `plugins.entries.<id>`
2. **مضمن** — Plugins المشحونة مع OpenClaw
3. **تثبيت عام** — Plugins مثبتة داخل جذر Plugin العام الخاص بـ OpenClaw
4. **مساحة العمل** — Plugins مكتشفة نسبة إلى مساحة العمل الحالية

الآثار المترتبة:

- النسخة المتفرعة أو القديمة من Plugin مضمن الموجودة في مساحة العمل لن تحجب البناء المضمن.
- لكي تتجاوز فعلًا Plugin مضمنًا بنسخة محلية، ثبّتها عبر `plugins.entries.<id>` بحيث تفوز بالأسبقية بدلًا من الاعتماد على اكتشاف مساحة العمل.
- يتم تسجيل حالات إسقاط التكرار بحيث يتمكن Doctor وتشخيصات البدء من الإشارة إلى النسخة المُسقَطة.

## متطلبات JSON Schema

- **يجب أن يشحن كل Plugin ملف JSON Schema**، حتى لو لم يكن يقبل أي إعدادات.
- يُقبل مخطط فارغ (على سبيل المثال `{ "type": "object", "additionalProperties": false }`).
- يتم التحقق من المخططات وقت قراءة/كتابة الإعدادات، وليس وقت التشغيل.

## سلوك التحقق

- تُعد مفاتيح `channels.*` غير المعروفة **أخطاء**، ما لم يكن معرّف القناة معلنًا من
  بيان Plugin.
- يجب أن تشير `plugins.entries.<id>` و`plugins.allow` و`plugins.deny` و`plugins.slots.*`
  إلى معرّفات Plugin **قابلة للاكتشاف**. وتُعد المعرّفات غير المعروفة **أخطاء**.
- إذا كان Plugin مثبتًا لكن بيانه أو مخططه مكسورًا أو مفقودًا،
  فإن التحقق يفشل ويبلّغ Doctor عن خطأ Plugin.
- إذا كانت إعدادات Plugin موجودة لكن Plugin **معطل**، فإن الإعدادات تُحفظ
  ويظهر **تحذير** في Doctor + السجلات.

راجع [مرجع الإعدادات](/ar/gateway/configuration) للاطلاع على مخطط `plugins.*` الكامل.

## ملاحظات

- البيان **مطلوب لـ Plugins OpenClaw الأصلية**، بما في ذلك التحميلات المحلية من نظام الملفات. وما يزال وقت التشغيل يحمّل وحدة Plugin بشكل منفصل؛ والبيان مخصص فقط للاكتشاف + التحقق.
- تُحلل البيانات الأصلية باستخدام JSON5، لذلك تُقبل التعليقات، والفواصل اللاحقة، والمفاتيح غير المقتبسة ما دامت القيمة النهائية ما تزال كائنًا.
- لا يقرأ محمل البيان إلا حقول البيان الموثقة. تجنب المفاتيح العليا المخصصة.
- يمكن حذف `channels` و`providers` و`cliBackends` و`skills` جميعًا عندما لا يحتاجها Plugin.
- يجب أن يبقى `providerDiscoveryEntry` خفيفًا، وألا يستورد شيفرة وقت تشغيل واسعة؛ استخدمه لبيانات كتالوج المزوّدات الثابتة أو واصفات اكتشاف ضيقة، وليس لتنفيذ وقت الطلب.
- يتم اختيار أنواع Plugins الحصرية عبر `plugins.slots.*`: ‏`kind: "memory"` عبر `plugins.slots.memory`، و`kind: "context-engine"` عبر `plugins.slots.contextEngine` ‏(الافتراضي `legacy`).
- بيانات متغيرات البيئة الوصفية (`providerAuthEnvVars`, `channelEnvVars`) إعلانية فقط. وما تزال أسطح الحالة، والتدقيق، والتحقق من تسليم Cron، والأسطح الأخرى الخاصة بالقراءة فقط تطبق ثقة Plugin وسياسة التفعيل الفعالة قبل اعتبار متغير بيئة ما مضبوطًا.
- بالنسبة إلى بيانات المعالج الوصفية وقت التشغيل التي تتطلب شيفرة مزوّد، راجع [خطافات وقت تشغيل المزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks).
- إذا كان Plugin يعتمد على وحدات أصلية، فوثّق خطوات البناء وأي متطلبات قائمة سماح خاصة بمدير الحزم (على سبيل المثال، `allow-build-scripts` في pnpm + ‏`pnpm rebuild <package>`).

## ذو صلة

<CardGroup cols={3}>
  <Card title="بناء Plugins" href="/ar/plugins/building-plugins" icon="rocket">
    البدء باستخدام Plugins.
  </Card>
  <Card title="بنية Plugin" href="/ar/plugins/architecture" icon="diagram-project">
    البنية الداخلية ونموذج الإمكانات.
  </Card>
  <Card title="نظرة عامة على SDK" href="/ar/plugins/sdk-overview" icon="book">
    مرجع Plugin SDK والاستيرادات عبر المسارات الفرعية.
  </Card>
</CardGroup>
