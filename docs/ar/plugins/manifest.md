---
read_when:
    - أنت تبني Plugin لـ OpenClaw
    - أنت بحاجة إلى شحن مخطط config الخاص بـ Plugin أو تصحيح أخطاء التحقق من صحة Plugin
summary: متطلبات Plugin manifest + JSON schema (تحقق صارم من config)
title: Plugin manifest
x-i18n:
    generated_at: "2026-04-26T11:36:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
    source_path: plugins/manifest.md
    workflow: 15
---

هذه الصفحة مخصصة لـ **native OpenClaw plugin manifest** فقط.

بالنسبة إلى تخطيطات الحِزم المتوافقة، راجع [Plugin bundles](/ar/plugins/bundles).

تستخدم تنسيقات الحِزم المتوافقة ملفات manifest مختلفة:

- حزمة Codex: ‏`.codex-plugin/plugin.json`
- حزمة Claude: ‏`.claude-plugin/plugin.json` أو تخطيط مكونات Claude
  الافتراضي من دون manifest
- حزمة Cursor: ‏`.cursor-plugin/plugin.json`

يكتشف OpenClaw تلقائيًا تخطيطات الحِزم هذه أيضًا، لكنها لا تُتحقق
مقابل مخطط `openclaw.plugin.json` الموصوف هنا.

بالنسبة إلى الحِزم المتوافقة، يقرأ OpenClaw حاليًا بيانات الحزمة الوصفية بالإضافة
إلى جذور Skills المعلنة، وجذور أوامر Claude، والقيم الافتراضية لـ `settings.json` في حزمة Claude،
والقيم الافتراضية لـ Claude bundle LSP، وحِزم الخطافات المدعومة عندما يطابق التخطيط
توقعات وقت تشغيل OpenClaw.

يجب على كل native OpenClaw plugin **أن يشحن** ملف `openclaw.plugin.json` في
**جذر Plugin**. يستخدم OpenClaw هذا manifest للتحقق من صحة الإعدادات
**من دون تنفيذ كود Plugin**. وتُعامل manifests المفقودة أو غير الصالحة
على أنها أخطاء Plugin وتحظر التحقق من صحة config.

راجع الدليل الكامل لنظام Plugins: ‏[Plugins](/ar/tools/plugin).
وللاطلاع على نموذج الإمكانات الأصلية وإرشادات التوافق الخارجي الحالية:
[Capability model](/ar/plugins/architecture#public-capability-model).

## ما الذي يفعله هذا الملف

إن `openclaw.plugin.json` هو البيانات الوصفية التي يقرأها OpenClaw **قبل تحميل
كود Plugin الخاص بك**. ويجب أن يكون كل ما يرد أدناه منخفض الكلفة بما يكفي لفحصه من دون
إقلاع وقت تشغيل Plugin.

**استخدمه من أجل:**

- هوية Plugin، والتحقق من صحة config، وتلميحات واجهة config
- بيانات auth وonboarding وsetup الوصفية (الاسم المستعار، والتمكين التلقائي، ومتغيرات env الخاصة بالمزوّد، وخيارات auth)
- activation hints لأسطح مستوى التحكم
- الملكية المختصرة لعائلات النماذج
- لقطات static capability-ownership ‏(`contracts`)
- بيانات QA runner الوصفية التي يمكن للمضيف المشترك `openclaw qa` فحصها
- بيانات config الوصفية الخاصة بالقنوات والمُدمجة في الفهرس وأس surfaces التحقق

**لا تستخدمه من أجل:** تسجيل سلوك وقت التشغيل، أو التصريح بنقاط دخول الكود،
أو بيانات تثبيت npm الوصفية. فهذه تنتمي إلى كود Plugin الخاص بك و`package.json`.

## مثال مصغّر

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
  "description": "Plugin مزوّد OpenRouter",
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
      "choiceLabel": "مفتاح OpenRouter API",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "مفتاح OpenRouter API",
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

## مرجع الحقول من المستوى الأعلى

| الحقل                                | مطلوب    | النوع                            | ما الذي يعنيه                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | نعم      | `string`                         | معرّف Plugin أساسي. هذا هو المعرّف المستخدم في `plugins.entries.<id>`.                                                                                                                                                            |
| `configSchema`                       | نعم      | `object`                         | JSON Schema مضمنة لإعدادات هذا الـ Plugin.                                                                                                                                                                                        |
| `enabledByDefault`                   | لا       | `true`                           | يحدّد أن Plugin مضمّنًا مفعّل افتراضيًا. احذف هذا الحقل، أو عيّن أي قيمة ليست `true`، للإبقاء على الـ Plugin معطّلًا افتراضيًا.                                                                                                  |
| `legacyPluginIds`                    | لا       | `string[]`                       | معرّفات قديمة تُطبَّع إلى معرّف Plugin الأساسي هذا.                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | لا       | `string[]`                       | معرّفات المزوّدين التي يجب أن تفعّل هذا الـ Plugin تلقائيًا عندما تشير إليها المصادقة أو الإعدادات أو مراجع النماذج.                                                                                                            |
| `kind`                               | لا       | `"memory"` \| `"context-engine"` | يعرّف نوع Plugin حصريًا يُستخدم بواسطة `plugins.slots.*`.                                                                                                                                                                        |
| `channels`                           | لا       | `string[]`                       | معرّفات القنوات التي يملكها هذا الـ Plugin. تُستخدم للاكتشاف والتحقق من صحة الإعدادات.                                                                                                                                           |
| `providers`                          | لا       | `string[]`                       | معرّفات المزوّدين التي يملكها هذا الـ Plugin.                                                                                                                                                                                     |
| `providerDiscoveryEntry`             | لا       | `string`                         | مسار وحدة خفيف لاكتشاف المزوّدين، نسبةً إلى جذر الـ Plugin، لبيانات تعريف كتالوج المزوّدين ضمن النطاق الخاص بالـ manifest والتي يمكن تحميلها دون تفعيل وقت تشغيل الـ Plugin الكامل.                                           |
| `modelSupport`                       | لا       | `object`                         | بيانات تعريف مختصرة لعائلات النماذج يملكها الـ manifest وتُستخدم لتحميل الـ Plugin تلقائيًا قبل وقت التشغيل.                                                                                                                   |
| `modelCatalog`                       | لا       | `object`                         | بيانات تعريف تصريحية لكتالوج النماذج للمزوّدين الذين يملكهم هذا الـ Plugin. هذا هو تعاقد مستوى التحكّم من أجل السرد المستقبلي للقراءة فقط، والإعداد الأوّلي، ومنتقيات النماذج، والأسماء المستعارة، والإخفاء، دون تحميل وقت تشغيل الـ Plugin. |
| `providerEndpoints`                  | لا       | `object[]`                       | بيانات تعريف للمضيف/`baseUrl` لنقاط نهاية المزوّدين يملكها الـ manifest لمسارات المزوّد التي يجب على النواة تصنيفها قبل تحميل وقت تشغيل المزوّد.                                                                                |
| `cliBackends`                        | لا       | `string[]`                       | معرّفات واجهات CLI الخلفية للاستدلال التي يملكها هذا الـ Plugin. تُستخدم للتفعيل التلقائي عند بدء التشغيل من مراجع إعدادات صريحة.                                                                                               |
| `syntheticAuthRefs`                  | لا       | `string[]`                       | مراجع المزوّد أو واجهة CLI الخلفية التي يجب اختبار خطاف المصادقة الاصطناعية المملوك للـ Plugin لها أثناء الاكتشاف البارد للنموذج قبل تحميل وقت التشغيل.                                                                          |
| `nonSecretAuthMarkers`               | لا       | `string[]`                       | قيم مفاتيح API نائبة يملكها Plugin مضمّن وتمثل حالة بيانات اعتماد محلية أو OAuth أو محيطية غير سرية.                                                                                                                           |
| `commandAliases`                     | لا       | `object[]`                       | أسماء الأوامر التي يملكها هذا الـ Plugin والتي يجب أن تنتج إعدادات وتشخيصات CLI مدركة للـ Plugin قبل تحميل وقت التشغيل.                                                                                                         |
| `providerAuthEnvVars`                | لا       | `Record<string, string[]>`       | بيانات تعريف متوافقة ومهجورة لمتغيرات البيئة من أجل البحث عن مصادقة/حالة المزوّد. فضّل `setup.providers[].envVars` في Plugins الجديدة؛ لا يزال OpenClaw يقرأ هذا أثناء نافذة الإيقاف التدريجي.                                 |
| `providerAuthAliases`                | لا       | `Record<string, string>`         | معرّفات المزوّدين التي يجب أن تعيد استخدام معرّف مزوّد آخر للبحث عن المصادقة، على سبيل المثال مزوّد برمجة يشارك مفتاح API الأساسي وملفات تعريف المصادقة مع المزوّد الأساسي.                                                     |
| `channelEnvVars`                     | لا       | `Record<string, string[]>`       | بيانات تعريف خفيفة لمتغيرات بيئة القنوات يمكن لـ OpenClaw فحصها دون تحميل شيفرة الـ Plugin. استخدم هذا لأسطح إعداد القنوات أو المصادقة المعتمدة على البيئة التي يجب أن تراها أدوات بدء التشغيل/الإعدادات العامة.             |
| `providerAuthChoices`                | لا       | `object[]`                       | بيانات تعريف خفيفة لخيارات المصادقة لمنتقيات الإعداد الأوّلي، وحل المزوّد المفضّل، وربط أعلام CLI البسيطة.                                                                                                                      |
| `activation`                         | لا       | `object`                         | بيانات تعريف خفيفة لمخطط التفعيل من أجل التحميل الذي يتم تحفيزه بواسطة المزوّد أو الأمر أو القناة أو المسار أو الإمكانية. بيانات تعريف فقط؛ لا يزال وقت تشغيل الـ Plugin يملك السلوك الفعلي.                                     |
| `setup`                              | لا       | `object`                         | واصفات خفيفة للإعداد/الإعداد الأوّلي يمكن لأسطح الاكتشاف والإعداد فحصها دون تحميل وقت تشغيل الـ Plugin.                                                                                                                         |
| `qaRunners`                          | لا       | `object[]`                       | واصفات خفيفة لمشغلات QA يستخدمها مضيف `openclaw qa` المشترك قبل تحميل وقت تشغيل الـ Plugin.                                                                                                                                      |
| `contracts`                          | لا       | `object`                         | لقطة ثابتة للإمكانات المضمّنة لخطافات المصادقة الخارجية، والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الموسيقى، وتوليد الفيديو، وجلب الويب، والبحث في الويب، وملكية الأدوات.                     |
| `mediaUnderstandingProviderMetadata` | لا       | `Record<string, object>`         | إعدادات افتراضية خفيفة لفهم الوسائط لمعّرفات المزوّدين المصرّح بها في `contracts.mediaUnderstandingProviders`.                                                                                                                  |
| `channelConfigs`                     | لا       | `Record<string, object>`         | بيانات تعريف لإعدادات القنوات يملكها الـ manifest وتُدمج في أسطح الاكتشاف والتحقق قبل تحميل وقت التشغيل.                                                                                                                        |
| `skills`                             | لا       | `string[]`                       | أدلة Skills المطلوب تحميلها، نسبةً إلى جذر الـ Plugin.                                                                                                                                                                           |
| `name`                               | لا       | `string`                         | اسم Plugin قابل للقراءة البشرية.                                                                                                                                                                                                  |
| `description`                        | لا       | `string`                         | ملخّص قصير يظهر في أسطح الـ Plugin.                                                                                                                                                                                               |
| `version`                            | لا       | `string`                         | إصدار Plugin معلوماتي.                                                                                                                                                                                                            |
| `uiHints`                            | لا       | `Record<string, object>`         | تسميات واجهة المستخدم، والعناصر النائبة، وتلميحات الحساسية لحقول الإعدادات.                                                                                                                                                     |

## مرجع `providerAuthChoices`

يصف كل إدخال في `providerAuthChoices` خيار إعداد أوّلي أو مصادقة واحدًا.
يقرأ OpenClaw هذا قبل تحميل وقت تشغيل المزوّد.
تستخدم قوائم إعداد المزوّدين خيارات الـ manifest هذه، وخيارات الإعداد
المشتقة من الواصفات، وبيانات تعريف كتالوج التثبيت من دون تحميل وقت تشغيل المزوّد.

| الحقل                 | مطلوب    | النوع                                           | ما الذي يعنيه                                                                                           |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | نعم      | `string`                                        | معرّف المزوّد الذي ينتمي إليه هذا الخيار.                                                                |
| `method`              | نعم      | `string`                                        | معرّف طريقة المصادقة المطلوب التوجيه إليه.                                                               |
| `choiceId`            | نعم      | `string`                                        | معرّف ثابت لخيار المصادقة تستخدمه تدفقات الإعداد الأوّلي وCLI.                                           |
| `choiceLabel`         | لا       | `string`                                        | تسمية موجّهة للمستخدم. إذا حُذفت، يعود OpenClaw إلى `choiceId`.                                         |
| `choiceHint`          | لا       | `string`                                        | نص مساعد قصير للمنتقي.                                                                                  |
| `assistantPriority`   | لا       | `number`                                        | القيم الأقل تُرتَّب أولًا في المنتقيات التفاعلية التي يقودها المساعد.                                    |
| `assistantVisibility` | لا       | `"visible"` \| `"manual-only"`                  | يُخفي الخيار من منتقيات المساعد مع الاستمرار في السماح بتحديده يدويًا عبر CLI.                          |
| `deprecatedChoiceIds` | لا       | `string[]`                                      | معرّفات قديمة لخيارات يجب أن تعيد توجيه المستخدمين إلى هذا الخيار البديل.                                |
| `groupId`             | لا       | `string`                                        | معرّف مجموعة اختياري لتجميع الخيارات ذات الصلة.                                                          |
| `groupLabel`          | لا       | `string`                                        | تسمية موجّهة للمستخدم لتلك المجموعة.                                                                     |
| `groupHint`           | لا       | `string`                                        | نص مساعد قصير للمجموعة.                                                                                  |
| `optionKey`           | لا       | `string`                                        | مفتاح خيار داخلي لتدفقات المصادقة البسيطة ذات العلم الواحد.                                              |
| `cliFlag`             | لا       | `string`                                        | اسم علم CLI، مثل `--openrouter-api-key`.                                                                 |
| `cliOption`           | لا       | `string`                                        | صيغة خيار CLI الكاملة، مثل `--openrouter-api-key <key>`.                                                 |
| `cliDescription`      | لا       | `string`                                        | الوصف المستخدم في مساعدة CLI.                                                                            |
| `onboardingScopes`    | لا       | `Array<"text-inference" \| "image-generation">` | أسطح الإعداد الأوّلي التي يجب أن يظهر فيها هذا الخيار. إذا حُذفت، تكون القيمة الافتراضية `["text-inference"]`. |

## مرجع `commandAliases`

استخدم `commandAliases` عندما يملك Plugin اسم أمر وقت تشغيل قد يضعه
المستخدمون بالخطأ في `plugins.allow` أو يحاولون تشغيله كأمر CLI جذري. يستخدم OpenClaw
بيانات التعريف هذه للتشخيصات من دون استيراد شيفرة وقت تشغيل الـ Plugin.

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

| الحقل        | مطلوب    | النوع             | ما الذي يعنيه                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | نعم      | `string`          | اسم الأمر الذي ينتمي إلى هذا الـ Plugin.                                |
| `kind`       | لا       | `"runtime-slash"` | يحدّد أن الاسم المستعار هو أمر slash للدردشة وليس أمر CLI جذريًا.       |
| `cliCommand` | لا       | `string`          | أمر CLI جذري ذو صلة يُقترح لعمليات CLI، إذا كان موجودًا.                |

## مرجع `activation`

استخدم `activation` عندما يستطيع الـ Plugin أن يصرّح بتكلفة منخفضة عن
أحداث مستوى التحكّم التي يجب أن تدرجه في خطة تفعيل/تحميل.

هذه الكتلة هي بيانات تعريف للمخطِّط، وليست API لدورة الحياة. فهي لا تسجّل
سلوك وقت التشغيل، ولا تستبدل `register(...)`، ولا تَعِد بأن شيفرة
الـ Plugin قد نُفِّذت مسبقًا. يستخدم مخطِّط التفعيل هذه الحقول لتضييق
نطاق Plugins المرشحة قبل الرجوع إلى بيانات تعريف ملكية الـ manifest
الحالية مثل `providers` و`channels` و`commandAliases` و`setup.providers`
و`contracts.tools` وhooks.

فضّل أضيق بيانات تعريف تصف الملكية بالفعل. استخدم
`providers` أو `channels` أو `commandAliases` أو واصفات الإعداد أو `contracts`
عندما تعبّر هذه الحقول عن العلاقة. استخدم `activation` لتلميحات إضافية
للمخطِّط لا يمكن تمثيلها عبر حقول الملكية تلك.
استخدم `cliBackends` على المستوى الأعلى لأسماء CLI المستعارة لوقت التشغيل مثل `claude-cli`
أو `codex-cli` أو `google-gemini-cli`؛ أما `activation.onAgentHarnesses` فهو فقط
لمعرّفات agent harnesses المضمّنة التي لا تملك أصلًا حقل ملكية.

هذه الكتلة هي بيانات تعريف فقط. فهي لا تسجّل سلوك وقت التشغيل، ولا
تستبدل `register(...)` أو `setupEntry` أو نقاط دخول وقت التشغيل/الـ Plugin الأخرى.
يستخدمها المستهلكون الحاليون كتلميح تضييق قبل تحميل Plugins على نحو أوسع، لذلك فإن
غياب بيانات تعريف التفعيل عادةً لا يكلّف سوى الأداء؛ ويجب ألا
يغيّر الصحة ما دامت بدائل ملكية الـ manifest القديمة ما تزال موجودة.

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

| الحقل              | مطلوب    | النوع                                                | ما الذي يعنيه                                                                                                                                     |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders`      | لا       | `string[]`                                           | معرّفات المزوّدين التي يجب أن تُدرج هذا الـ Plugin في خطط التفعيل/التحميل.                                                                       |
| `onAgentHarnesses` | لا       | `string[]`                                           | معرّفات وقت تشغيل agent harnesses المضمّنة التي يجب أن تُدرج هذا الـ Plugin في خطط التفعيل/التحميل. استخدم `cliBackends` على المستوى الأعلى لأسماء واجهات CLI الخلفية المستعارة. |
| `onCommands`       | لا       | `string[]`                                           | معرّفات الأوامر التي يجب أن تُدرج هذا الـ Plugin في خطط التفعيل/التحميل.                                                                         |
| `onChannels`       | لا       | `string[]`                                           | معرّفات القنوات التي يجب أن تُدرج هذا الـ Plugin في خطط التفعيل/التحميل.                                                                         |
| `onRoutes`         | لا       | `string[]`                                           | أنواع المسارات التي يجب أن تُدرج هذا الـ Plugin في خطط التفعيل/التحميل.                                                                          |
| `onCapabilities`   | لا       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | تلميحات قدرات عامة تُستخدم بواسطة تخطيط التفعيل على مستوى التحكّم. فضّل الحقول الأضيق عندما يكون ذلك ممكنًا.                                   |

المستهلكون الحيّون الحاليون:

- تخطيط CLI المحفَّز بالأوامر يعود إلى
  `commandAliases[].cliCommand` أو `commandAliases[].name`
  القديمين
- تخطيط بدء تشغيل agent-runtime يستخدم `activation.onAgentHarnesses` من أجل
  الحوامل المضمّنة، ويستخدم `cliBackends[]` على المستوى الأعلى من أجل الأسماء المستعارة لوقت تشغيل CLI
- تخطيط الإعداد/القناة المحفَّز بالقنوات يعود إلى ملكية
  `channels[]` القديمة عند غياب بيانات تعريف تفعيل القناة الصريحة
- تخطيط الإعداد/وقت التشغيل المحفَّز بالمزوّدين يعود إلى
  ملكية `providers[]` القديمة و`cliBackends[]` على المستوى الأعلى عند غياب بيانات تعريف
  تفعيل المزوّد الصريحة

يمكن لتشخيصات المخطِّط التمييز بين تلميحات التفعيل الصريحة وبديل
ملكية الـ manifest. على سبيل المثال، يعني `activation-command-hint` أن
`activation.onCommands` قد طابق، بينما يعني `manifest-command-alias` أن
المخطِّط استخدم ملكية `commandAliases` بدلًا من ذلك. هذه تسميات أسباب
لتشخيصات المضيف والاختبارات؛ ويجب على مؤلفي Plugins الاستمرار في التصريح
ببيانات التعريف التي تصف الملكية على أفضل نحو.

## مرجع `qaRunners`

استخدم `qaRunners` عندما يساهم Plugin بمشغّل نقل واحد أو أكثر تحت
الجذر المشترك `openclaw qa`. حافظ على هذه البيانات التعريفية خفيفة وثابتة؛ فما يزال
وقت تشغيل الـ Plugin يملك تسجيل CLI الفعلي عبر سطح
`runtime-api.ts` خفيف يصدّر `qaRunnerCliRegistrations`.

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

| الحقل         | مطلوب    | النوع    | ما الذي يعنيه                                                     |
| ------------- | -------- | -------- | ----------------------------------------------------------------- |
| `commandName` | نعم      | `string` | الأمر الفرعي المُثبَّت تحت `openclaw qa`، مثل `matrix`.           |
| `description` | لا       | `string` | نص المساعدة الاحتياطي المستخدم عندما يحتاج المضيف المشترك إلى أمر stub. |

## مرجع `setup`

استخدم `setup` عندما تحتاج أسطح الإعداد والإعداد الأوّلي إلى بيانات تعريف
خفيفة يملكها الـ Plugin قبل تحميل وقت التشغيل.

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

يبقى `cliBackends` على المستوى الأعلى صالحًا ويستمر في وصف واجهات CLI الخلفية
لاستدلال CLI. أما `setup.cliBackends` فهو سطح الواصفات الخاص بالإعداد من أجل
تدفقات مستوى التحكّم/الإعداد التي يجب أن تبقى بيانات تعريف فقط.

عند وجوده، يكون `setup.providers` و`setup.cliBackends` هما سطح البحث
المفضّل أولًا بالواصفات لاكتشاف الإعداد. إذا كان الواصف يضيّق فقط Plugin المرشح
وكان الإعداد ما يزال يحتاج إلى hooks أغنى لوقت تشغيل الإعداد، فاضبط
`requiresRuntime: true` وأبقِ `setup-api` في مكانه كمسار التنفيذ الاحتياطي.

يدمج OpenClaw أيضًا `setup.providers[].envVars` في عمليات البحث العامة
عن مصادقة المزوّد ومتغيرات البيئة. يظل `providerAuthEnvVars` مدعومًا عبر
محوّل توافق خلال نافذة الإيقاف التدريجي، لكن Plugins غير المضمّنة التي ما تزال تستخدمه
تتلقى تشخيص manifest. يجب على Plugins الجديدة وضع بيانات تعريف
متغيرات البيئة الخاصة بالإعداد/الحالة في `setup.providers[].envVars`.

يمكن لـ OpenClaw أيضًا اشتقاق خيارات إعداد بسيطة من `setup.providers[].authMethods`
عندما لا يتوفر إدخال إعداد، أو عندما يصرّح `setup.requiresRuntime: false`
بأن وقت تشغيل الإعداد غير ضروري. تبقى إدخالات `providerAuthChoices` الصريحة
مفضّلة للتسميات المخصّصة، وأعلام CLI، ونطاق الإعداد الأوّلي، وبيانات تعريف المساعد.

اضبط `requiresRuntime: false` فقط عندما تكون هذه الواصفات كافية
لسطح الإعداد. يتعامل OpenClaw مع القيمة `false` الصريحة على أنها تعاقد
يعتمد على الواصفات فقط، ولن ينفّذ `setup-api` أو `openclaw.setupEntry` لبحث الإعداد. إذا
كان Plugin يعتمد على الواصفات فقط وما يزال يوفّر أحد إدخالات وقت تشغيل الإعداد هذه،
فإن OpenClaw يبلّغ عن تشخيص إضافي ويستمر في تجاهله. أما
حذف `requiresRuntime` فيبقي سلوك الرجوع الاحتياطي القديم حتى لا تنكسر
Plugins الحالية التي أضافت واصفات من دون هذا العلم.

نظرًا لأن بحث الإعداد يمكنه تنفيذ شيفرة `setup-api` التي يملكها Plugin،
فيجب أن تظل القيم المطبّعة لـ `setup.providers[].id` و`setup.cliBackends[]`
فريدة عبر Plugins المكتشفة. الملكية الملتبسة تُفشل الإجراء بشكل مغلق بدلًا من اختيار
فائز بناءً على ترتيب الاكتشاف.

عندما يُنفَّذ وقت تشغيل الإعداد، فإن تشخيصات سجل الإعداد تُبلغ عن
انحراف الواصفات إذا كان `setup-api` يسجّل مزوّدًا أو واجهة CLI خلفية لا
تعلن عنها واصفات الـ manifest، أو إذا كان هناك واصف لا يقابله تسجيل
وقت تشغيل مطابق. هذه التشخيصات إضافية ولا ترفض Plugins القديمة.

### مرجع `setup.providers`

| الحقل         | مطلوب    | النوع      | ما الذي يعنيه                                                                   |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------- |
| `id`          | نعم      | `string`   | معرّف المزوّد المعروض أثناء الإعداد أو الإعداد الأوّلي. احرص على بقاء المعرّفات المطبّعة فريدة عالميًا. |
| `authMethods` | لا       | `string[]` | معرّفات طرق الإعداد/المصادقة التي يدعمها هذا المزوّد من دون تحميل وقت التشغيل الكامل. |
| `envVars`     | لا       | `string[]` | متغيرات البيئة التي يمكن لأسطح الإعداد/الحالة العامة التحقق منها قبل تحميل وقت تشغيل الـ Plugin. |

### حقول `setup`

| الحقل              | مطلوب    | النوع      | ما الذي يعنيه                                                                                  |
| ------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `providers`        | لا       | `object[]` | واصفات إعداد المزوّدين المعروضة أثناء الإعداد والإعداد الأوّلي.                                |
| `cliBackends`      | لا       | `string[]` | معرّفات الواجهات الخلفية وقت الإعداد المستخدمة لبحث الإعداد المعتمد أولًا على الواصفات. احرص على بقاء المعرّفات المطبّعة فريدة عالميًا. |
| `configMigrations` | لا       | `string[]` | معرّفات ترحيل الإعدادات التي يملكها سطح الإعداد لهذا الـ Plugin.                              |
| `requiresRuntime`  | لا       | `boolean`  | ما إذا كان الإعداد ما يزال يحتاج إلى تنفيذ `setup-api` بعد بحث الواصفات.                      |

## مرجع `uiHints`

`uiHints` هي خريطة من أسماء حقول الإعدادات إلى تلميحات عرض صغيرة.

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

يمكن أن يتضمن تلميح كل حقل ما يلي:

| الحقل         | النوع      | ما الذي يعنيه                          |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | تسمية الحقل الموجّهة للمستخدم.         |
| `help`        | `string`   | نص مساعد قصير.                         |
| `tags`        | `string[]` | وسوم UI اختيارية.                      |
| `advanced`    | `boolean`  | يحدّد الحقل على أنه متقدّم.            |
| `sensitive`   | `boolean`  | يحدّد الحقل على أنه سرّي أو حسّاس.     |
| `placeholder` | `string`   | نص العنصر النائب لمدخلات النماذج.      |

## مرجع `contracts`

استخدم `contracts` فقط لبيانات تعريف ملكية الإمكانات الثابتة التي يمكن لـ OpenClaw
قراءتها من دون استيراد وقت تشغيل الـ Plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
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

| الحقل                            | النوع      | ما الذي يعنيه                                                        |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | معرّفات مصانع امتداد خادم تطبيق Codex، وحاليًا `codex-app-server`.   |
| `agentToolResultMiddleware`      | `string[]` | معرّفات وقت تشغيل يمكن لـ Plugin مضمّن أن يسجّل لها برمجيات وسيطة لنتائج الأدوات. |
| `externalAuthProviders`          | `string[]` | معرّفات المزوّدين التي يملك هذا الـ Plugin خطاف ملف تعريف المصادقة الخارجية الخاص بها. |
| `speechProviders`                | `string[]` | معرّفات مزوّدي الكلام التي يملكها هذا الـ Plugin.                    |
| `realtimeTranscriptionProviders` | `string[]` | معرّفات مزوّدي النسخ الفوري التي يملكها هذا الـ Plugin.              |
| `realtimeVoiceProviders`         | `string[]` | معرّفات مزوّدي الصوت الفوري التي يملكها هذا الـ Plugin.              |
| `memoryEmbeddingProviders`       | `string[]` | معرّفات مزوّدي تضمين الذاكرة التي يملكها هذا الـ Plugin.             |
| `mediaUnderstandingProviders`    | `string[]` | معرّفات مزوّدي فهم الوسائط التي يملكها هذا الـ Plugin.               |
| `imageGenerationProviders`       | `string[]` | معرّفات مزوّدي توليد الصور التي يملكها هذا الـ Plugin.               |
| `videoGenerationProviders`       | `string[]` | معرّفات مزوّدي توليد الفيديو التي يملكها هذا الـ Plugin.             |
| `webFetchProviders`              | `string[]` | معرّفات مزوّدي جلب الويب التي يملكها هذا الـ Plugin.                 |
| `webSearchProviders`             | `string[]` | معرّفات مزوّدي البحث في الويب التي يملكها هذا الـ Plugin.            |
| `tools`                          | `string[]` | أسماء أدوات الوكيل التي يملكها هذا الـ Plugin لفحوصات التعاقد المضمّنة. |

تم الاحتفاظ بـ `contracts.embeddedExtensionFactories` من أجل
مصانع الامتدادات المضمّنة الخاصة بخادم تطبيق Codex فقط. يجب أن
تُعلن تحولات نتائج الأدوات المضمّنة عن `contracts.agentToolResultMiddleware` وأن تُسجِّل عبر
`api.registerAgentToolResultMiddleware(...)` بدلًا من ذلك. لا يمكن للإضافات الخارجية
تسجيل برمجيات وسيطة لنتائج الأدوات لأن هذا السطح يمكنه إعادة كتابة
مخرجات الأدوات عالية الثقة قبل أن يراها النموذج.

يجب على Plugins المزوّدين التي تنفّذ `resolveExternalAuthProfiles` أن تُعلن
`contracts.externalAuthProviders`. أما Plugins التي لا تملك هذا التصريح فما تزال تعمل
عبر رجوع احتياطي متوافق ومهجور، لكن هذا الرجوع أبطأ
وسيُزال بعد نافذة الترحيل.

يجب على مزوّدي تضمين الذاكرة المضمّنين أن يصرّحوا عن
`contracts.memoryEmbeddingProviders` لكل معرّف محوّل يكشفونه، بما في ذلك
المحوّلات المضمّنة مثل `local`. تستخدم مسارات CLI المستقلة هذا التعاقد في الـ manifest
لتحميل الـ Plugin المالك فقط قبل أن يكون وقت تشغيل Gateway الكامل قد
سجّل المزوّدين.

## مرجع `mediaUnderstandingProviderMetadata`

استخدم `mediaUnderstandingProviderMetadata` عندما يكون لدى مزوّد فهم الوسائط
نماذج افتراضية، أو أولوية رجوع احتياطي تلقائية للمصادقة، أو دعم أصلي للمستندات
تحتاجه مساعدات النواة العامة قبل تحميل وقت التشغيل. يجب أيضًا التصريح عن المفاتيح في
`contracts.mediaUnderstandingProviders`.

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

| الحقل                  | النوع                               | ما الذي يعنيه                                                               |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | إمكانات الوسائط التي يكشفها هذا المزوّد.                                    |
| `defaultModels`        | `Record<string, string>`            | القيم الافتراضية من الإمكانية إلى النموذج المستخدمة عندما لا تحدد الإعدادات نموذجًا. |
| `autoPriority`         | `Record<string, number>`            | الأرقام الأقل تُرتَّب أولًا للرجوع الاحتياطي التلقائي للمزوّد المستند إلى بيانات الاعتماد. |
| `nativeDocumentInputs` | `"pdf"[]`                           | مدخلات المستندات الأصلية التي يدعمها المزوّد.                              |

## مرجع `channelConfigs`

استخدم `channelConfigs` عندما يحتاج Plugin قناة إلى بيانات تعريف إعدادات خفيفة
قبل تحميل وقت التشغيل. يمكن لاكتشاف إعداد/حالة القناة للقراءة فقط استخدام هذه البيانات
مباشرةً للقنوات الخارجية المضبوطة عندما لا يتوفر إدخال إعداد، أو
عندما يصرّح `setup.requiresRuntime: false` بأن وقت تشغيل الإعداد غير ضروري.

`channelConfigs` هي بيانات تعريف manifest للـ Plugin، وليست قسمًا جديدًا
لإعدادات المستخدم على المستوى الأعلى. ما يزال المستخدمون يضبطون مثيلات القنوات ضمن `channels.<channel-id>`.
يقرأ OpenClaw بيانات تعريف الـ manifest ليقرر أي Plugin يملك تلك
القناة المضبوطة قبل تنفيذ شيفرة وقت تشغيل الـ Plugin.

بالنسبة إلى Plugin قناة، يصف `configSchema` و`channelConfigs` مسارين مختلفين:

- يتحقق `configSchema` من `plugins.entries.<plugin-id>.config`
- يتحقق `channelConfigs.<channel-id>.schema` من `channels.<channel-id>`

يجب على Plugins غير المضمّنة التي تصرّح عن `channels[]` أن تصرّح أيضًا عن
إدخالات `channelConfigs` المطابقة. من دونها، ما يزال OpenClaw قادرًا على تحميل الـ Plugin،
لكن أسطح schema للإعدادات في المسار البارد، والإعداد، وControl UI لا يمكنها معرفة
شكل الخيارات الذي تملكه القناة حتى يُنفَّذ وقت تشغيل الـ Plugin.

يمكن لـ `channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` و
`nativeSkillsAutoEnabled` أن يصرّحا بقيم `auto` افتراضية ثابتة
لفحوصات إعدادات الأوامر التي تعمل قبل تحميل وقت تشغيل القناة. يمكن للقنوات المضمّنة أيضًا
نشر القيم الافتراضية نفسها عبر `package.json#openclaw.channel.commands` إلى جانب
بيانات تعريف كتالوج القنوات الأخرى التي تملكها الحزمة.

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

يمكن أن يتضمن كل إدخال قناة ما يلي:

| الحقل         | النوع                    | ما الذي يعنيه                                                                            |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema لـ `channels.<id>`. وهو مطلوب لكل إدخال مُعلَن لإعدادات القناة.             |
| `uiHints`     | `Record<string, object>` | تسميات UI اختيارية/عناصر نائبة/تلميحات حساسية لذلك القسم من إعدادات القناة.            |
| `label`       | `string`                 | تسمية القناة المدمجة في أسطح المنتقي والفحص عندما لا تكون بيانات تعريف وقت التشغيل جاهزة. |
| `description` | `string`                 | وصف قصير للقناة لأسطح الفحص والكتالوج.                                                  |
| `commands`    | `object`                 | القيم الافتراضية الثابتة للأوامر الأصلية والـ Skills الأصلية لفحوصات الإعدادات السابقة لوقت التشغيل. |
| `preferOver`  | `string[]`               | معرّفات Plugins قديمة أو أقل أولوية يجب أن تتفوّق عليها هذه القناة في أسطح الاختيار.    |

### استبدال Plugin قناة آخر

استخدم `preferOver` عندما يكون Plugin الخاص بك هو المالك المفضّل لمعرّف قناة
يمكن أن يوفّره أيضًا Plugin آخر. من الحالات الشائعة معرّف Plugin أعيدت تسميته،
أو Plugin مستقل يحل محل Plugin مضمّن، أو fork مُصان
يحافظ على معرّف القناة نفسه من أجل توافق الإعدادات.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

عندما يكون `channels.chat` مضبوطًا، ينظر OpenClaw إلى كلٍّ من معرّف القناة
ومعرّف Plugin المفضّل. إذا كان Plugin الأقل أولوية قد اختير فقط لأنه
مضمّن أو مفعّل افتراضيًا، فإن OpenClaw يعطّله في إعدادات وقت التشغيل
الفعّالة بحيث يملك Plugin واحد القناة وأدواتها. يظل اختيار المستخدم
الصريح هو الفاصل: إذا فعّل المستخدم كلا الـ Plugins صراحةً، فإن OpenClaw
يحافظ على هذا الاختيار ويبلّغ عن تشخيصات القنوات/الأدوات المكررة بدلًا من
تغيير مجموعة Plugins المطلوبة بصمت.

أبقِ `preferOver` محصورًا في معرّفات Plugins التي يمكنها فعلًا توفير القناة نفسها.
فهو ليس حقل أولوية عامًا، ولا يعيد تسمية مفاتيح إعدادات المستخدم.

## مرجع `modelSupport`

استخدم `modelSupport` عندما يجب على OpenClaw استنتاج Plugin المزوّد الخاص بك من
معرّفات النماذج المختصرة مثل `gpt-5.5` أو `claude-sonnet-4.6` قبل تحميل وقت تشغيل
الـ Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

يطبّق OpenClaw ترتيب الأولوية هذا:

- تستخدم مراجع `provider/model` الصريحة بيانات تعريف الـ manifest المملوكة في `providers`
- تتفوّق `modelPatterns` على `modelPrefixes`
- إذا طابق كلٌّ من Plugin غير مضمّن وPlugin مضمّن، فإن Plugin غير المضمّن
  يفوز
- يُتجاهل أي غموض متبقٍ حتى يحدّد المستخدم أو الإعدادات مزوّدًا

الحقول:

| الحقل           | النوع      | ما الذي يعنيه                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | بادئات تُطابَق باستخدام `startsWith` مع معرّفات النماذج المختصرة.             |
| `modelPatterns` | `string[]` | مصادر regex تُطابَق مع معرّفات النماذج المختصرة بعد إزالة لاحقة ملف التعريف.  |

## مرجع `modelCatalog`

استخدم `modelCatalog` عندما يجب أن يعرف OpenClaw بيانات تعريف نماذج المزوّد قبل
تحميل وقت تشغيل الـ Plugin. هذا هو المصدر المملوك من الـ manifest لصفوف
الكتالوج الثابتة، والأسماء المستعارة للمزوّدين، وقواعد الإخفاء، ووضع الاكتشاف.
يظل التحديث في وقت التشغيل تابعًا لشيفرة وقت تشغيل المزوّد، لكن الـ manifest
يخبر النواة متى يكون وقت التشغيل مطلوبًا.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

الحقول على المستوى الأعلى:

| الحقل          | النوع                                                    | ما الذي يعنيه                                                                                           |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | صفوف الكتالوج لمعرّفات المزوّدين التي يملكها هذا الـ Plugin. يجب أن تظهر المفاتيح أيضًا في `providers` على المستوى الأعلى. |
| `aliases`      | `Record<string, object>`                                 | أسماء مستعارة للمزوّدين يجب أن تُحل إلى مزوّد مملوك لأغراض تخطيط الكتالوج أو الإخفاء.                  |
| `suppressions` | `object[]`                                               | صفوف نماذج من مصدر آخر يخفيها هذا الـ Plugin لسبب خاص بالمزوّد.                                       |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | ما إذا كان يمكن قراءة كتالوج المزوّد من بيانات تعريف الـ manifest، أو تحديثه إلى cache، أو أنه يتطلب وقت تشغيل. |

حقول المزوّد:

| الحقل     | النوع                    | ما الذي يعنيه                                                    |
| --------- | ------------------------ | ---------------------------------------------------------------- |
| `baseUrl` | `string`                 | `baseUrl` افتراضي اختياري للنماذج في كتالوج هذا المزوّد.        |
| `api`     | `ModelApi`               | محوّل API افتراضي اختياري للنماذج في كتالوج هذا المزوّد.        |
| `headers` | `Record<string, string>` | headers ثابتة اختيارية تنطبق على كتالوج هذا المزوّد.            |
| `models`  | `object[]`               | صفوف النماذج المطلوبة. تُتجاهل الصفوف التي لا تحتوي على `id`.   |

حقول النموذج:

| الحقل           | النوع                                                          | ما الذي يعنيه                                                              |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | معرّف النموذج المحلي للمزوّد، من دون البادئة `provider/`.                 |
| `name`          | `string`                                                       | اسم عرض اختياري.                                                           |
| `api`           | `ModelApi`                                                     | تجاوز API اختياري لكل نموذج.                                               |
| `baseUrl`       | `string`                                                       | تجاوز `baseUrl` اختياري لكل نموذج.                                         |
| `headers`       | `Record<string, string>`                                       | headers ثابتة اختيارية لكل نموذج.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | الأنماط التي يقبلها النموذج.                                               |
| `reasoning`     | `boolean`                                                      | ما إذا كان النموذج يكشف سلوك reasoning.                                    |
| `contextWindow` | `number`                                                       | نافذة السياق الأصلية لدى المزوّد.                                          |
| `contextTokens` | `number`                                                       | حدّ سياق وقت تشغيل فعّال اختياري عندما يختلف عن `contextWindow`.           |
| `maxTokens`     | `number`                                                       | الحد الأقصى لرموز الإخراج عندما يكون معروفًا.                              |
| `cost`          | `object`                                                       | تسعير اختياري بالدولار الأمريكي لكل مليون رمز، بما في ذلك `tieredPricing` الاختياري. |
| `compat`        | `object`                                                       | أعلام توافق اختيارية تطابق توافق إعدادات نموذج OpenClaw.                  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | حالة الإدراج. استخدم الإخفاء فقط عندما يجب ألا يظهر الصف إطلاقًا.         |
| `statusReason`  | `string`                                                       | سبب اختياري يظهر مع الحالة غير المتاحة.                                    |
| `replaces`      | `string[]`                                                     | معرّفات نماذج أقدم محلية للمزوّد يحل هذا النموذج محلها.                    |
| `replacedBy`    | `string`                                                       | معرّف نموذج محلّي بديل للمزوّد للصفوف المهجورة.                            |
| `tags`          | `string[]`                                                     | وسوم ثابتة تستخدمها المنتقيات والمرشحات.                                   |

لا تضع بيانات خاصة بوقت التشغيل فقط في `modelCatalog`. إذا كان المزوّد يحتاج
إلى حالة الحساب، أو طلب API، أو اكتشاف عملية محلية لمعرفة مجموعة النماذج
الكاملة، فصرّح عن هذا المزوّد باعتباره `refreshable` أو `runtime` ضمن `discovery`.

### فهرس مزوّدي OpenClaw

فهرس مزوّدي OpenClaw هو بيانات تعريف معاينة مملوكة لـ OpenClaw للمزوّدين
الذين قد لا تكون Plugins الخاصة بهم مثبّتة بعد. وهو ليس جزءًا من manifest
الـ Plugin. تظل manifests الخاصة بالـ Plugin هي المرجع للـ Plugin المثبّت. فهرس
المزوّدين هو تعاقد الرجوع الاحتياطي الداخلي الذي ستستخدمه مستقبلًا
أسطح المزوّد القابل للتثبيت ومنتقي النموذج قبل التثبيت عندما لا تكون
Plugin المزوّد مثبّتة.

ترتيب سلطة الكتالوج:

1. إعدادات المستخدم.
2. `modelCatalog` في manifest الـ Plugin المثبّت.
3. cache كتالوج النموذج الناتجة عن تحديث صريح.
4. صفوف المعاينة في فهرس مزوّدي OpenClaw.

يجب ألا يحتوي فهرس المزوّدين على أسرار، أو حالة التفعيل، أو hooks وقت التشغيل،
أو بيانات نماذج حيّة خاصة بالحساب. تستخدم كتالوجات المعاينة الخاصة به
صيغة صفوف المزوّد `modelCatalog` نفسها المستخدمة في manifests الخاصة بالـ Plugin،
لكن يجب أن تظل محصورة في بيانات تعريف العرض الثابتة ما لم تكن حقول
محوّل وقت التشغيل مثل `api` أو `baseUrl` أو التسعير أو أعلام التوافق
مُحافَظًا عمدًا على اتساقها مع manifest الـ Plugin المثبّت. يجب على المزوّدين
الذين لديهم اكتشاف حي عبر `/models` كتابة الصفوف المُحدَّثة من خلال مسار
cache كتالوج النموذج الصريح بدلًا من جعل عمليات السرد أو الإعداد الأوّلي
العادية تستدعي APIs المزوّد.

قد تحمل إدخالات فهرس المزوّدين أيضًا بيانات تعريف Plugin قابلة للتثبيت
للمزوّدين الذين خرجت Plugin الخاصة بهم من النواة أو لم تُثبَّت بعد لسبب آخر.
تعكس هذه البيانات نمط كتالوج القنوات: اسم الحزمة، ومواصفة تثبيت npm،
والتكامل المتوقع، وتسميات خيارات المصادقة الخفيفة تكفي لإظهار
خيار إعداد قابل للتثبيت. وبمجرد تثبيت الـ Plugin، يفوز manifest الخاص بها
ويُتجاهل إدخال فهرس المزوّدين لذلك المزوّد.

مفاتيح الإمكانات القديمة على المستوى الأعلى مهجورة. استخدم `openclaw doctor --fix` من أجل
نقل `speechProviders` و`realtimeTranscriptionProviders` و
`realtimeVoiceProviders` و`mediaUnderstandingProviders` و
`imageGenerationProviders` و`videoGenerationProviders` و
`webFetchProviders` و`webSearchProviders` إلى `contracts`؛ لم تعد
عملية تحميل الـ manifest العادية تتعامل مع تلك الحقول على المستوى الأعلى بصفتها
ملكية للإمكانات.

## Manifest مقابل package.json

يخدم الملفان مهام مختلفة:

| الملف                  | استخدمه من أجل                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | الاكتشاف، والتحقق من صحة الإعدادات، وبيانات تعريف خيارات المصادقة، وتلميحات UI التي يجب أن تكون موجودة قبل تشغيل شيفرة الـ Plugin |
| `package.json`         | بيانات npm التعريفية، وتثبيت التبعيات، وكتلة `openclaw` المستخدمة لنقاط الدخول، أو بوابة التثبيت، أو الإعداد، أو بيانات تعريف الكتالوج |

إذا لم تكن متأكدًا من الموضع الذي تنتمي إليه قطعة من بيانات التعريف، فاستخدم هذه القاعدة:

- إذا كان يجب على OpenClaw معرفتها قبل تحميل شيفرة الـ Plugin، فضعها في `openclaw.plugin.json`
- إذا كانت تتعلق بالتغليف، أو ملفات الدخول، أو سلوك تثبيت npm، فضعها في `package.json`

### حقول `package.json` التي تؤثر في الاكتشاف

توجد بعض بيانات تعريف Plugins السابقة لوقت التشغيل عمدًا في `package.json` ضمن
كتلة `openclaw` بدلًا من `openclaw.plugin.json`.

أمثلة مهمة:

| الحقل                                                             | ما الذي يعنيه                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | يصرّح بنقاط دخول Plugin الأصلية. يجب أن تبقى داخل دليل حزمة الـ Plugin.                                                                                                            |
| `openclaw.runtimeExtensions`                                      | يصرّح بنقاط دخول وقت تشغيل JavaScript المبنية للحزم المثبّتة. يجب أن تبقى داخل دليل حزمة الـ Plugin.                                                                                |
| `openclaw.setupEntry`                                             | نقطة دخول خفيفة خاصة بالإعداد فقط تُستخدم أثناء الإعداد الأوّلي، وبدء تشغيل القنوات المؤجّل، واكتشاف حالة القناة/SecretRef للقراءة فقط. يجب أن تبقى داخل دليل حزمة الـ Plugin.     |
| `openclaw.runtimeSetupEntry`                                      | يصرّح بنقطة دخول الإعداد المبنية بلغة JavaScript للحزم المثبّتة. يجب أن تبقى داخل دليل حزمة الـ Plugin.                                                                              |
| `openclaw.channel`                                                | بيانات تعريف خفيفة لكتالوج القنوات مثل التسميات، ومسارات المستندات، والأسماء المستعارة، ونصوص الاختيار.                                                                            |
| `openclaw.channel.commands`                                       | بيانات تعريف ثابتة للقيم الافتراضية التلقائية للأوامر الأصلية وSkills الأصلية تُستخدم في أسطح الإعدادات والتدقيق وقائمة الأوامر قبل تحميل وقت تشغيل القناة.                         |
| `openclaw.channel.configuredState`                                | بيانات تعريف خفيفة لفاحص الحالة المضبوطة يمكنها الإجابة عن سؤال "هل يوجد بالفعل إعداد يعتمد على env فقط؟" من دون تحميل وقت تشغيل القناة الكامل.                                     |
| `openclaw.channel.persistedAuthState`                             | بيانات تعريف خفيفة لفاحص حالة المصادقة المخزّنة يمكنها الإجابة عن سؤال "هل يوجد بالفعل أي تسجيل دخول؟" من دون تحميل وقت تشغيل القناة الكامل.                                        |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | تلميحات التثبيت/التحديث للـ Plugins المضمّنة والمنشورة خارجيًا.                                                                                                                      |
| `openclaw.install.defaultChoice`                                  | مسار التثبيت المفضّل عندما تتوفر عدة مصادر تثبيت.                                                                                                                                   |
| `openclaw.install.minHostVersion`                                 | الحد الأدنى لإصدار مضيف OpenClaw المدعوم، باستخدام حد أدنى semver مثل `>=2026.3.22`.                                                                                               |
| `openclaw.install.expectedIntegrity`                              | سلسلة سلامة npm dist المتوقعة مثل `sha512-...`؛ تتحقق تدفقات التثبيت والتحديث من الأثرية التي جرى جلبها بمقارنتها بها.                                                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | يسمح بمسار استعادة ضيق لإعادة تثبيت Plugin مضمّن عندما تكون الإعدادات غير صالحة.                                                                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | يسمح بتحميل أسطح القنوات الخاصة بالإعداد فقط قبل Plugin القناة الكامل أثناء بدء التشغيل.                                                                                              |

تحدد بيانات تعريف الـ manifest خيارات المزوّد/القناة/الإعداد التي تظهر في
الإعداد الأوّلي قبل تحميل وقت التشغيل. ويخبر `package.json#openclaw.install`
الإعداد الأوّلي بكيفية جلب ذلك الـ Plugin أو تفعيله عندما يختار المستخدم أحد تلك
الخيارات. لا تنقل تلميحات التثبيت إلى `openclaw.plugin.json`.

يُفرض `openclaw.install.minHostVersion` أثناء التثبيت وتحميل
سجل الـ manifest. تُرفض القيم غير الصالحة؛ أما القيم الأحدث لكنها الصالحة فتتجاوز
الـ Plugin على المضيفين الأقدم.

إن تثبيت إصدار npm الدقيق موجود أصلًا في `npmSpec`، على سبيل المثال
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. يجب أن تقرن
إدخالات الكتالوج الخارجية الرسمية المواصفات الدقيقة مع `expectedIntegrity` حتى
تفشل تدفقات التحديث بشكل مغلق إذا لم تعد الأثرية التي جرى جلبها من npm
تطابق الإصدار المثبّت بدقة. وما يزال الإعداد الأوّلي التفاعلي يقدّم
مواصفات npm الخاصة بالسجل الموثوق، بما في ذلك أسماء الحزم المجردة وdist-tags، من أجل
التوافق. يمكن لتشخيصات الكتالوج التمييز بين المصادر الدقيقة، والعائمة،
والمثبّتة بالسلامة، والفاقدة للسلامة، وعدم تطابق اسم الحزمة، ومصادر
الاختيار الافتراضي غير الصالحة. كما أنها تحذّر عندما يكون
`expectedIntegrity` موجودًا ولكن لا يوجد مصدر npm صالح يمكنه تثبيته عليه.
عندما يكون `expectedIntegrity` موجودًا،
تفرضه تدفقات التثبيت/التحديث؛ وعندما يُحذف، يُسجَّل حل السجل من دون
تثبيت سلامة.

يجب على Plugins القنوات توفير `openclaw.setupEntry` عندما تحتاج الحالة، أو قائمة القنوات،
أو فحوصات SecretRef إلى تحديد الحسابات المضبوطة من دون تحميل وقت التشغيل الكامل.
يجب أن تكشف نقطة الإدخال الخاصة بالإعداد عن بيانات تعريف القناة بالإضافة إلى
مهايئات آمنة للإعداد تخص الإعدادات والحالة والأسرار؛ وأبقِ عملاء الشبكة،
ومستمعي Gateway، وأوقات تشغيل النقل في نقطة دخول الامتداد الرئيسية.

لا تتجاوز حقول نقطة دخول وقت التشغيل عمليات التحقق من حدود الحزمة لحقول
نقطة دخول المصدر. على سبيل المثال، لا يمكن لـ `openclaw.runtimeExtensions`
جعل مسار `openclaw.extensions` الهارب قابلًا للتحميل.

إن `openclaw.install.allowInvalidConfigRecovery` ضيق عمدًا. فهو
لا يجعل الإعدادات المعطوبة العشوائية قابلة للتثبيت. حاليًا لا يسمح إلا لتدفقات التثبيت
بالتعافي من إخفاقات ترقية محددة قديمة في Plugins المضمّنة، مثل
مسار Plugin مضمّن مفقود أو إدخال `channels.<id>` قديم لذلك الـ Plugin
المضمّن نفسه. وتظل أخطاء الإعدادات غير ذات الصلة تمنع التثبيت وتوجّه المشغّلين
إلى `openclaw doctor --fix`.

إن `openclaw.channel.persistedAuthState` هي بيانات تعريف حزمة لوحدة فحص
صغيرة:

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

استخدمها عندما تحتاج تدفقات الإعداد، أو doctor، أو الحالة المضبوطة إلى
فحص مصادقة رخيص بنعم/لا قبل تحميل Plugin القناة الكاملة. يجب أن يكون
التصدير الهدف دالة صغيرة تقرأ الحالة المخزّنة فقط؛ ولا تمررها عبر
barrel وقت تشغيل القناة الكامل.

يتبع `openclaw.channel.configuredState` الصيغة نفسها من أجل عمليات التحقق
الخفيفة من الحالة المضبوطة المعتمدة على env فقط:

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

استخدمه عندما تستطيع القناة الإجابة عن الحالة المضبوطة من env أو من
مدخلات صغيرة أخرى غير وقت التشغيل. وإذا كان الفحص يحتاج إلى حل إعدادات كامل أو
وقت تشغيل القناة الحقيقي، فأبقِ هذا المنطق في الخطاف
`config.hasConfiguredState` الخاص بالـ Plugin بدلًا من ذلك.

## أولوية الاكتشاف (معرّفات Plugins المكررة)

يكتشف OpenClaw Plugins من عدة جذور (مضمّنة، وتثبيت عام، ومساحة عمل، ومسارات محددة صراحة في الإعدادات). إذا اشترك اكتشافان في `id` نفسه، فلن يُحتفَظ إلا بـ manifest ذي **الأولوية الأعلى**؛ أما النسخ المكررة الأقل أولوية فتُستبعَد بدلًا من تحميلها إلى جانبه.

الأولوية، من الأعلى إلى الأدنى:

1. **محددة عبر الإعدادات** — مسار مثبت صراحة في `plugins.entries.<id>`
2. **مضمّنة** — Plugins المشحونة مع OpenClaw
3. **تثبيت عام** — Plugins المثبّتة في جذر Plugins العام لـ OpenClaw
4. **مساحة العمل** — Plugins المكتشفة نسبةً إلى مساحة العمل الحالية

الآثار المترتبة:

- النسخة المتفرعة أو القديمة من Plugin مضمّن الموجودة في مساحة العمل لن تطغى على البناء المضمّن.
- لتجاوز Plugin مضمّن فعليًا بآخر محلي، ثبّته عبر `plugins.entries.<id>` حتى يفوز بالأولوية بدلًا من الاعتماد على اكتشاف مساحة العمل.
- تُسجَّل عمليات إسقاط النسخ المكررة بحيث يمكن لـ Doctor وتشخيصات بدء التشغيل الإشارة إلى النسخة المستبعَدة.

## متطلبات JSON Schema

- **يجب أن يوفّر كل Plugin JSON Schema**، حتى لو كان لا يقبل أي إعدادات.
- يُقبل schema فارغ (على سبيل المثال، `{ "type": "object", "additionalProperties": false }`).
- يجري التحقق من schemas وقت قراءة/كتابة الإعدادات، وليس في وقت التشغيل.

## سلوك التحقق

- مفاتيح `channels.*` غير المعروفة هي **أخطاء**، ما لم يكن معرّف القناة مصرّحًا به بواسطة
  manifest Plugin.
- يجب أن تشير `plugins.entries.<id>` و`plugins.allow` و`plugins.deny` و`plugins.slots.*`
  إلى معرّفات Plugins **قابلة للاكتشاف**. المعرّفات غير المعروفة هي **أخطاء**.
- إذا كان Plugin مثبّتًا لكنه يملك manifest أو schema معطوبًا أو مفقودًا،
  يفشل التحقق ويبلّغ Doctor عن خطأ الـ Plugin.
- إذا وُجدت إعدادات Plugin لكن الـ Plugin كان **معطّلًا**، تُحفَظ الإعدادات
  ويظهر **تحذير** في Doctor + السجلات.

راجع [مرجع الإعدادات](/ar/gateway/configuration) للاطلاع على schema الكامل لـ `plugins.*`.

## ملاحظات

- إن الـ manifest **مطلوب للـ Plugins الأصلية في OpenClaw**، بما في ذلك التحميلات المحلية من نظام الملفات. وما يزال وقت التشغيل يحمّل وحدة الـ Plugin بشكل منفصل؛ الـ manifest مخصص فقط للاكتشاف + التحقق.
- تُحلَّل manifests الأصلية باستخدام JSON5، لذا تُقبل التعليقات، والفواصل اللاحقة، والمفاتيح غير الموضوعة بين علامتي اقتباس ما دامت القيمة النهائية ما تزال كائنًا.
- لا يقرأ محمّل الـ manifest إلا حقول الـ manifest الموثقة. تجنّب المفاتيح المخصصة على المستوى الأعلى.
- يمكن حذف `channels` و`providers` و`cliBackends` و`skills` كلها عندما لا يحتاجها Plugin.
- يجب أن يبقى `providerDiscoveryEntry` خفيفًا وألا يستورد شيفرة وقت تشغيل واسعة؛ استخدمه لبيانات تعريف كتالوج المزوّد الثابتة أو واصفات الاكتشاف الضيقة، وليس للتنفيذ وقت الطلب.
- تُختار أنواع Plugins الحصرية عبر `plugins.slots.*`: `kind: "memory"` عبر `plugins.slots.memory`، و`kind: "context-engine"` عبر `plugins.slots.contextEngine` (الافتراضي `legacy`).
- بيانات تعريف متغيرات البيئة (`setup.providers[].envVars`، و`providerAuthEnvVars` المهجور، و`channelEnvVars`) تصريحية فقط. فما تزال الحالة، والتدقيق، والتحقق من تسليم Cron، والأسطح الأخرى للقراءة فقط تطبّق ثقة الـ Plugin وسياسة التفعيل الفعّالة قبل اعتبار متغير البيئة مضبوطًا.
- للحصول على بيانات تعريف معالج وقت التشغيل التي تتطلب شيفرة مزوّد، راجع [خطافات وقت تشغيل المزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks).
- إذا كان Plugin الخاص بك يعتمد على وحدات أصلية، فوثّق خطوات البناء وأي متطلبات لقائمة سماح مدير الحزم (مثلًا pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## ذو صلة

<CardGroup cols={3}>
  <Card title="بناء Plugins" href="/ar/plugins/building-plugins" icon="rocket">
    بدء استخدام Plugins.
  </Card>
  <Card title="بنية Plugin" href="/ar/plugins/architecture" icon="diagram-project">
    البنية الداخلية ونموذج الإمكانات.
  </Card>
  <Card title="نظرة عامة على SDK" href="/ar/plugins/sdk-overview" icon="book">
    مرجع Plugin SDK وعمليات الاستيراد من المسارات الفرعية.
  </Card>
</CardGroup>
