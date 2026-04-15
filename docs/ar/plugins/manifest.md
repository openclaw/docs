---
read_when:
    - أنت تقوم ببناء Plugin لـ OpenClaw
    - تحتاج إلى شحن مخطط إعدادات Plugin أو تصحيح أخطاء التحقق من صحة Plugin
summary: متطلبات Plugin manifest + مخطط JSON (التحقق الصارم من صحة الإعدادات)
title: Plugin Manifest
x-i18n:
    generated_at: "2026-04-15T07:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba2183bfa8802871e4ef33a0ebea290606e8351e9e83e25ee72456addb768730
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifest (`openclaw.plugin.json`)

هذه الصفحة مخصّصة فقط لـ **Plugin manifest الأصلي في OpenClaw**.

للاطّلاع على تنسيقات الحِزم المتوافقة، راجع [Plugin bundles](/ar/plugins/bundles).

تستخدم تنسيقات الحِزم المتوافقة ملفات manifest مختلفة:

- حزمة Codex: `.codex-plugin/plugin.json`
- حزمة Claude: `.claude-plugin/plugin.json` أو تنسيق مكوّن Claude الافتراضي
  بدون manifest
- حزمة Cursor: `.cursor-plugin/plugin.json`

يكتشف OpenClaw هذه تنسيقات الحِزم تلقائيًا أيضًا، لكنها لا تُتحقَّق
مقارنتها بمخطط `openclaw.plugin.json` الموضَّح هنا.

بالنسبة إلى الحِزم المتوافقة، يقرأ OpenClaw حاليًا بيانات الحزمة الوصفية
بالإضافة إلى جذور Skills المعلنة، وجذور أوامر Claude، والقيم الافتراضية
لملف `settings.json` في حزمة Claude، والقيم الافتراضية لـ Claude bundle LSP،
وحِزم hooks المدعومة عندما يطابق التنسيق توقعات وقت تشغيل OpenClaw.

يجب على كل Plugin أصلي في OpenClaw **أن يضمّ** ملف `openclaw.plugin.json` في
**جذر Plugin**. يستخدم OpenClaw هذا manifest للتحقق من صحة الإعدادات
**من دون تنفيذ كود Plugin**. وتُعامل ملفات manifest المفقودة أو غير الصالحة
على أنها أخطاء في Plugin وتمنع التحقق من صحة الإعدادات.

راجع الدليل الكامل لنظام Plugins: [Plugins](/ar/tools/plugin).
وللاطّلاع على نموذج القدرات الأصلي وإرشادات التوافق الخارجي الحالية:
[Capability model](/ar/plugins/architecture#public-capability-model).

## ما الذي يفعله هذا الملف

`openclaw.plugin.json` هو البيانات الوصفية التي يقرأها OpenClaw قبل أن يحمّل
كود Plugin الخاص بك.

استخدمه من أجل:

- هوية Plugin
- التحقق من صحة الإعدادات
- بيانات auth وonboarding الوصفية التي يجب أن تكون متاحة دون تشغيل وقت تشغيل Plugin
- تلميحات تنشيط منخفضة الكلفة يمكن لأسطح control plane فحصها قبل تحميل وقت التشغيل
- واصفات إعداد منخفضة الكلفة يمكن لأسطح الإعداد/التهيئة الأولية فحصها قبل
  تحميل وقت التشغيل
- بيانات alias وauto-enable الوصفية التي يجب حلّها قبل تحميل وقت تشغيل Plugin
- بيانات وصفية مختصرة لملكية عائلة النموذج ينبغي أن تفعّل Plugin تلقائيًا قبل تحميل وقت التشغيل
- لقطات ثابتة لملكية القدرات تُستخدم في توصيل التوافق المضمّن وتغطية العقود
- بيانات وصفية منخفضة الكلفة لمشغّل QA يمكن للمضيف المشترك `openclaw qa` فحصها
  قبل تحميل وقت تشغيل Plugin
- بيانات وصفية خاصة بإعدادات القنوات ينبغي دمجها في أسطح الفهرسة والتحقق
  من الصحة من دون تحميل وقت التشغيل
- تلميحات واجهة المستخدم للإعدادات

لا تستخدمه من أجل:

- تسجيل سلوك وقت التشغيل
- التصريح بنقاط دخول الكود
- بيانات `npm` الوصفية الخاصة بالتثبيت

فهذه تنتمي إلى كود Plugin الخاص بك وإلى `package.json`.

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

## مرجع الحقول ذات المستوى الأعلى

| الحقل                               | مطلوب | النوع                            | ما الذي يعنيه                                                                                                                                                                                                 |
| ----------------------------------- | ------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | نعم    | `string`                         | المعرّف القياسي لـ Plugin. هذا هو المعرّف المستخدم في `plugins.entries.<id>`.                                                                                                                                |
| `configSchema`                      | نعم    | `object`                         | مخطط JSON مضمن لإعدادات هذا Plugin.                                                                                                                                                                           |
| `enabledByDefault`                  | لا     | `true`                           | يحدّد أن Plugin مضمّن ومفعّل افتراضيًا. احذفه، أو اضبطه على أي قيمة غير `true`، لترك Plugin معطّلًا افتراضيًا.                                                                                            |
| `legacyPluginIds`                   | لا     | `string[]`                       | معرّفات قديمة تُطبَّع إلى معرّف Plugin القياسي هذا.                                                                                                                                                          |
| `autoEnableWhenConfiguredProviders` | لا     | `string[]`                       | معرّفات providers التي يجب أن تفعّل هذا Plugin تلقائيًا عندما تشير auth أو الإعدادات أو مراجع النماذج إليها.                                                                                               |
| `kind`                              | لا     | `"memory"` \| `"context-engine"` | يصرّح بنوع Plugin حصري يُستخدم بواسطة `plugins.slots.*`.                                                                                                                                                     |
| `channels`                          | لا     | `string[]`                       | معرّفات القنوات المملوكة لهذا Plugin. تُستخدم للاكتشاف والتحقق من صحة الإعدادات.                                                                                                                             |
| `providers`                         | لا     | `string[]`                       | معرّفات providers المملوكة لهذا Plugin.                                                                                                                                                                       |
| `modelSupport`                      | لا     | `object`                         | بيانات وصفية مختصرة مملوكة للـ manifest لعائلة النماذج وتُستخدم لتحميل Plugin تلقائيًا قبل وقت التشغيل.                                                                                                     |
| `cliBackends`                       | لا     | `string[]`                       | معرّفات backends الخاصة بالاستدلال في CLI والمملوكة لهذا Plugin. تُستخدم للتنشيط التلقائي عند بدء التشغيل من مراجع إعدادات صريحة.                                                                          |
| `commandAliases`                    | لا     | `object[]`                       | أسماء الأوامر المملوكة لهذا Plugin والتي يجب أن تنتج إعدادات وتشخيصات CLI مدركة للـ Plugin قبل تحميل وقت التشغيل.                                                                                            |
| `providerAuthEnvVars`               | لا     | `Record<string, string[]>`       | بيانات وصفية منخفضة الكلفة لمتغيرات بيئة auth الخاصة بالـ provider يمكن لـ OpenClaw فحصها من دون تحميل كود Plugin.                                                                                          |
| `providerAuthAliases`               | لا     | `Record<string, string>`         | معرّفات providers التي يجب أن تعيد استخدام معرّف provider آخر لبحث auth، مثل provider للبرمجة يشارك مفتاح API الأساسي وملفات auth التعريفية الخاصة بالـ provider الأساسي.                                |
| `channelEnvVars`                    | لا     | `Record<string, string[]>`       | بيانات وصفية منخفضة الكلفة لمتغيرات بيئة القنوات يمكن لـ OpenClaw فحصها من دون تحميل كود Plugin. استخدم هذا لإعداد القنوات المعتمد على البيئة أو لأسطح auth التي ينبغي أن تراها مساعدات البدء/الإعداد العامة. |
| `providerAuthChoices`               | لا     | `object[]`                       | بيانات وصفية منخفضة الكلفة لاختيارات auth من أجل منتقيات onboarding، وحل provider المفضّل، وربط أعلام CLI البسيط.                                                                                           |
| `activation`                        | لا     | `object`                         | تلميحات تنشيط منخفضة الكلفة لتحميل يعتمد على provider أو command أو channel أو route أو capability. بيانات وصفية فقط؛ لا يزال وقت تشغيل Plugin يملك السلوك الفعلي.                                         |
| `setup`                             | لا     | `object`                         | واصفات إعداد/تهيئة أولية منخفضة الكلفة يمكن لأسطح الاكتشاف والإعداد فحصها من دون تحميل وقت تشغيل Plugin.                                                                                                   |
| `qaRunners`                         | لا     | `object[]`                       | واصفات منخفضة الكلفة لمشغّلات QA يستخدمها المضيف المشترك `openclaw qa` قبل تحميل وقت تشغيل Plugin.                                                                                                         |
| `contracts`                         | لا     | `object`                         | لقطة قدرات ثابتة ومضمّنة لـ speech وrealtime transcription وrealtime voice وmedia-understanding وimage-generation وmusic-generation وvideo-generation وweb-fetch وweb search وملكية الأدوات.                 |
| `channelConfigs`                    | لا     | `Record<string, object>`         | بيانات وصفية مملوكة للـ manifest لإعدادات القنوات تُدمج في أسطح الاكتشاف والتحقق قبل تحميل وقت التشغيل.                                                                                                     |
| `skills`                            | لا     | `string[]`                       | أدلة Skills المطلوب تحميلها، نسبةً إلى جذر Plugin.                                                                                                                                                           |
| `name`                              | لا     | `string`                         | اسم Plugin مقروء للبشر.                                                                                                                                                                                       |
| `description`                       | لا     | `string`                         | ملخص قصير يظهر في أسطح Plugin.                                                                                                                                                                                |
| `version`                           | لا     | `string`                         | إصدار Plugin لأغراض معلوماتية.                                                                                                                                                                               |
| `uiHints`                           | لا     | `Record<string, object>`         | تسميات واجهة المستخدم، والعناصر النائبة، وتلميحات الحساسية لحقول الإعدادات.                                                                                                                                  |

## مرجع `providerAuthChoices`

يصف كل عنصر في `providerAuthChoices` خيارًا واحدًا من خيارات onboarding أو auth.
يقرأ OpenClaw هذا قبل تحميل وقت تشغيل provider.

| الحقل                | مطلوب | النوع                                           | ما الذي يعنيه                                                                                                  |
| -------------------- | ------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`           | نعم    | `string`                                        | معرّف Provider الذي ينتمي إليه هذا الخيار.                                                                      |
| `method`             | نعم    | `string`                                        | معرّف طريقة auth المطلوب التوجيه إليها.                                                                         |
| `choiceId`           | نعم    | `string`                                        | معرّف ثابت لخيار auth تستخدمه تدفقات onboarding وCLI.                                                          |
| `choiceLabel`        | لا     | `string`                                        | تسمية موجهة للمستخدم. إذا حُذفت، يعود OpenClaw إلى `choiceId`.                                                 |
| `choiceHint`         | لا     | `string`                                        | نص مساعد قصير للمنتقي.                                                                                         |
| `assistantPriority`  | لا     | `number`                                        | تُرتَّب القيم الأقل أولًا في المنتقيات التفاعلية التي يقودها المساعد.                                          |
| `assistantVisibility`| لا     | `"visible"` \| `"manual-only"`                  | يُخفي الخيار من منتقيات المساعد مع الاستمرار في السماح بالاختيار اليدوي عبر CLI.                               |
| `deprecatedChoiceIds`| لا     | `string[]`                                      | معرّفات خيارات قديمة يجب أن تعيد توجيه المستخدمين إلى هذا الخيار البديل.                                        |
| `groupId`            | لا     | `string`                                        | معرّف مجموعة اختياري لتجميع الخيارات ذات الصلة.                                                                 |
| `groupLabel`         | لا     | `string`                                        | تسمية موجهة للمستخدم لتلك المجموعة.                                                                             |
| `groupHint`          | لا     | `string`                                        | نص مساعد قصير للمجموعة.                                                                                         |
| `optionKey`          | لا     | `string`                                        | مفتاح خيار داخلي لتدفقات auth البسيطة التي تعتمد على علم واحد.                                                 |
| `cliFlag`            | لا     | `string`                                        | اسم علم CLI، مثل `--openrouter-api-key`.                                                                       |
| `cliOption`          | لا     | `string`                                        | الشكل الكامل لخيار CLI، مثل `--openrouter-api-key <key>`.                                                      |
| `cliDescription`     | لا     | `string`                                        | الوصف المستخدم في تعليمات CLI.                                                                                  |
| `onboardingScopes`   | لا     | `Array<"text-inference" \| "image-generation">` | أسطح onboarding التي يجب أن يظهر فيها هذا الخيار. إذا حُذفت، تكون القيمة الافتراضية `["text-inference"]`.      |

## مرجع `commandAliases`

استخدم `commandAliases` عندما يملك Plugin اسم أمر في وقت التشغيل قد يضعه
المستخدمون عن طريق الخطأ في `plugins.allow` أو يحاولون تشغيله كأمر CLI جذري.
يستخدم OpenClaw هذه البيانات الوصفية للتشخيصات من دون استيراد كود وقت تشغيل Plugin.

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

| الحقل       | مطلوب | النوع             | ما الذي يعنيه                                                              |
| ----------- | ------ | ----------------- | -------------------------------------------------------------------------- |
| `name`      | نعم    | `string`          | اسم الأمر الذي ينتمي إلى هذا Plugin.                                       |
| `kind`      | لا     | `"runtime-slash"` | يحدّد أن alias هو أمر slash للدردشة وليس أمر CLI جذريًا.                   |
| `cliCommand`| لا     | `string`          | أمر CLI جذري ذو صلة يُقترح لعمليات CLI، إذا كان موجودًا.                   |

## مرجع `activation`

استخدم `activation` عندما يستطيع Plugin التصريح بكلفة منخفضة عن أحداث control plane
التي ينبغي أن تفعّله لاحقًا.

## مرجع `qaRunners`

استخدم `qaRunners` عندما يساهم Plugin بمشغّل نقل واحد أو أكثر تحت الجذر
المشترك `openclaw qa`. احرص على أن تكون هذه البيانات الوصفية منخفضة الكلفة
وثابتة؛ إذ لا يزال وقت تشغيل Plugin يملك تسجيل CLI الفعلي من خلال سطح
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

| الحقل        | مطلوب | النوع    | ما الذي يعنيه                                                                |
| ------------ | ------ | -------- | ---------------------------------------------------------------------------- |
| `commandName`| نعم    | `string` | الأمر الفرعي المُثبت تحت `openclaw qa`، مثل `matrix`.                        |
| `description`| لا     | `string` | نص مساعدة احتياطي يُستخدم عندما يحتاج المضيف المشترك إلى أمر stub.           |

هذه الكتلة هي بيانات وصفية فقط. فهي لا تسجل سلوك وقت التشغيل، ولا تستبدل
`register(...)` أو `setupEntry` أو نقاط دخول وقت التشغيل/Plugin الأخرى.
يستخدمها المستهلكون الحاليون كتلميح للتضييق قبل تحميل Plugin على نطاق أوسع،
لذا فإن غياب بيانات activation الوصفية يؤدي عادةً فقط إلى تكلفة في الأداء؛
ولا ينبغي أن يغيّر الصحة ما دامت آليات الرجوع إلى ملكية manifest القديمة
لا تزال موجودة.

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

| الحقل            | مطلوب | النوع                                                | ما الذي يعنيه                                                      |
| ---------------- | ------ | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `onProviders`    | لا     | `string[]`                                           | معرّفات providers التي يجب أن تفعّل هذا Plugin عند طلبها.          |
| `onCommands`     | لا     | `string[]`                                           | معرّفات الأوامر التي يجب أن تفعّل هذا Plugin.                      |
| `onChannels`     | لا     | `string[]`                                           | معرّفات القنوات التي يجب أن تفعّل هذا Plugin.                      |
| `onRoutes`       | لا     | `string[]`                                           | أنواع routes التي يجب أن تفعّل هذا Plugin.                         |
| `onCapabilities` | لا     | `Array<"provider" \| "channel" \| "tool" \| "hook">` | تلميحات قدرات عامة تُستخدم في تخطيط التنشيط ضمن control plane.     |

المستهلكون المباشرون الحاليون:

- يعود تخطيط CLI المحفَّز بالأوامر إلى
  `commandAliases[].cliCommand` أو `commandAliases[].name` القديمين
- يعود تخطيط الإعداد/القنوات المحفَّز بالقنوات إلى ملكية `channels[]` القديمة
  عندما تكون بيانات تنشيط القنوات الصريحة مفقودة
- يعود تخطيط الإعداد/وقت التشغيل المحفَّز بالـ provider إلى ملكية
  `providers[]` وملكية `cliBackends[]` ذات المستوى الأعلى القديمة عندما
  تكون بيانات تنشيط provider الصريحة مفقودة

## مرجع `setup`

استخدم `setup` عندما تحتاج أسطح الإعداد والتهيئة الأولية إلى بيانات وصفية
منخفضة الكلفة ومملوكة للـ Plugin قبل تحميل وقت التشغيل.

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

يبقى `cliBackends` على المستوى الأعلى صالحًا ويواصل وصف backends الخاصة
بالاستدلال في CLI. أما `setup.cliBackends` فهو سطح الواصفات الخاص بالإعداد
لتدفقات control plane/الإعداد التي ينبغي أن تبقى بيانات وصفية فقط.

عند وجوده، يكون `setup.providers` و`setup.cliBackends` هما سطح البحث المفضّل
المعتمد على الواصفات أولًا لاكتشاف الإعداد. إذا كان الواصف يضيّق فقط نطاق
Plugin المرشّح ولا يزال الإعداد يحتاج إلى hooks أغنى خاصة بوقت الإعداد ضمن
وقت التشغيل، فاضبط `requiresRuntime: true` وأبقِ `setup-api` في مكانه
كمسار تنفيذ احتياطي.

نظرًا إلى أن بحث الإعداد يمكنه تنفيذ كود `setup-api` المملوك للـ Plugin،
فيجب أن تبقى القيم المطَبَّعة لكل من `setup.providers[].id` و
`setup.cliBackends[]` فريدة عبر Plugins المكتشفة. تُغلَق الملكية الملتبسة
احترازيًا بدلًا من اختيار فائز وفق ترتيب الاكتشاف.

### مرجع `setup.providers`

| الحقل         | مطلوب | النوع      | ما الذي يعنيه                                                                       |
| ------------- | ------ | ---------- | ----------------------------------------------------------------------------------- |
| `id`          | نعم    | `string`   | معرّف Provider الذي يُعرَض أثناء الإعداد أو onboarding. احرص على أن تبقى المعرّفات المطَبَّعة فريدة عالميًا. |
| `authMethods` | لا     | `string[]` | معرّفات طرق الإعداد/auth التي يدعمها هذا الـ Provider من دون تحميل وقت التشغيل الكامل. |
| `envVars`     | لا     | `string[]` | متغيرات البيئة التي يمكن لأسطح الإعداد/الحالة العامة التحقق منها قبل تحميل وقت تشغيل Plugin. |

### حقول `setup`

| الحقل              | مطلوب | النوع      | ما الذي يعنيه                                                                                      |
| ------------------ | ------ | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | لا     | `object[]` | واصفات إعداد providers التي تُعرَض أثناء الإعداد وonboarding.                                      |
| `cliBackends`      | لا     | `string[]` | معرّفات backends في وقت الإعداد والمستخدمة للبحث المعتمد على الواصفات أولًا. احرص على أن تبقى المعرّفات المطَبَّعة فريدة عالميًا. |
| `configMigrations` | لا     | `string[]` | معرّفات ترحيل الإعدادات المملوكة لسطح الإعداد الخاص بهذا Plugin.                                   |
| `requiresRuntime`  | لا     | `boolean`  | ما إذا كان الإعداد لا يزال يحتاج إلى تنفيذ `setup-api` بعد البحث المعتمد على الواصفات.             |

## مرجع `uiHints`

`uiHints` عبارة عن خريطة من أسماء حقول الإعدادات إلى تلميحات عرض صغيرة.

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

| الحقل         | النوع      | ما الذي يعنيه                         |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | تسمية الحقل الموجّهة للمستخدم.         |
| `help`        | `string`   | نص مساعد قصير.                        |
| `tags`        | `string[]` | وسوم واجهة مستخدم اختيارية.            |
| `advanced`    | `boolean`  | يحدّد الحقل على أنه متقدم.             |
| `sensitive`   | `boolean`  | يحدّد الحقل على أنه سرّي أو حسّاس.     |
| `placeholder` | `string`   | نص العنصر النائب لمدخلات النماذج.      |

## مرجع `contracts`

استخدم `contracts` فقط لبيانات وصفية ثابتة لملكية القدرات يمكن لـ OpenClaw
قراءتها من دون استيراد وقت تشغيل Plugin.

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

| الحقل                           | النوع      | ما الذي يعنيه                                                   |
| ------------------------------- | ---------- | --------------------------------------------------------------- |
| `speechProviders`               | `string[]` | معرّفات providers الخاصة بـ speech التي يملكها هذا Plugin.      |
| `realtimeTranscriptionProviders`| `string[]` | معرّفات providers الخاصة بـ realtime-transcription التي يملكها هذا Plugin. |
| `realtimeVoiceProviders`        | `string[]` | معرّفات providers الخاصة بـ realtime-voice التي يملكها هذا Plugin. |
| `mediaUnderstandingProviders`   | `string[]` | معرّفات providers الخاصة بـ media-understanding التي يملكها هذا Plugin. |
| `imageGenerationProviders`      | `string[]` | معرّفات providers الخاصة بـ image-generation التي يملكها هذا Plugin. |
| `videoGenerationProviders`      | `string[]` | معرّفات providers الخاصة بـ video-generation التي يملكها هذا Plugin. |
| `webFetchProviders`             | `string[]` | معرّفات providers الخاصة بـ web-fetch التي يملكها هذا Plugin.   |
| `webSearchProviders`            | `string[]` | معرّفات providers الخاصة بـ web-search التي يملكها هذا Plugin.  |
| `tools`                         | `string[]` | أسماء أدوات agent التي يملكها هذا Plugin لفحوصات العقود المضمّنة. |

## مرجع `channelConfigs`

استخدم `channelConfigs` عندما يحتاج Plugin قناة إلى بيانات وصفية منخفضة الكلفة
للإعدادات قبل تحميل وقت التشغيل.

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

| الحقل         | النوع                    | ما الذي يعنيه                                                                                 |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | مخطط JSON لـ `channels.<id>`. مطلوب لكل إدخال مُعلَن لإعدادات القناة.                         |
| `uiHints`     | `Record<string, object>` | تسميات واجهة مستخدم/عناصر نائبة/تلميحات حساسية اختيارية لذلك القسم من إعدادات القناة.         |
| `label`       | `string`                 | تسمية القناة المدمجة في أسطح المنتقي والفحص عندما لا تكون بيانات وقت التشغيل الوصفية جاهزة.    |
| `description` | `string`                 | وصف قصير للقناة لأسطح الفحص والفهرس.                                                          |
| `preferOver`  | `string[]`               | معرّفات Plugins قديمة أو أقل أولوية ينبغي أن تتفوّق عليها هذه القناة في أسطح الاختيار.         |

## مرجع `modelSupport`

استخدم `modelSupport` عندما ينبغي لـ OpenClaw استنتاج Plugin الـ provider الخاص بك
من معرّفات نماذج مختصرة مثل `gpt-5.4` أو `claude-sonnet-4.6` قبل تحميل وقت تشغيل Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

يطبّق OpenClaw ترتيب الأولوية التالي:

- تستخدم مراجع `provider/model` الصريحة بيانات manifest الخاصة بالملكية في `providers`
- تتفوّق `modelPatterns` على `modelPrefixes`
- إذا طابق كل من Plugin غير مضمّن وPlugin مضمّن، يفوز الـ Plugin غير المضمّن
- يُتجاهل أي غموض متبقٍّ إلى أن يحدّد المستخدم أو الإعدادات provider

الحقول:

| الحقل          | النوع      | ما الذي يعنيه                                                                    |
| -------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes`| `string[]` | بادئات تُطابَق باستخدام `startsWith` مع معرّفات النماذج المختصرة.                |
| `modelPatterns`| `string[]` | مصادر Regex تُطابَق مع معرّفات النماذج المختصرة بعد إزالة لاحقة profile.          |

مفاتيح القدرات القديمة ذات المستوى الأعلى مهجورة. استخدم `openclaw doctor --fix`
لنقل `speechProviders` و`realtimeTranscriptionProviders` و
`realtimeVoiceProviders` و`mediaUnderstandingProviders` و
`imageGenerationProviders` و`videoGenerationProviders` و
`webFetchProviders` و`webSearchProviders` إلى `contracts`؛ لم يعد تحميل
manifest العادي يتعامل مع تلك الحقول ذات المستوى الأعلى على أنها ملكية للقدرات.

## manifest مقابل package.json

يخدم الملفان وظيفتين مختلفتين:

| الملف                  | استخدمه من أجل                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | الاكتشاف، والتحقق من صحة الإعدادات، وبيانات auth-choice الوصفية، وتلميحات واجهة المستخدم التي يجب أن تكون موجودة قبل تشغيل كود Plugin |
| `package.json`         | بيانات npm الوصفية، وتثبيت الاعتماديات، وكتلة `openclaw` المستخدمة لنقاط الدخول، أو بوابات التثبيت، أو الإعداد، أو بيانات الفهرس الوصفية |

إذا لم تكن متأكدًا من الموضع الذي تنتمي إليه معلومة وصفية ما، فاستخدم هذه القاعدة:

- إذا كان يجب على OpenClaw معرفتها قبل تحميل كود Plugin، فضَعها في `openclaw.plugin.json`
- إذا كانت تتعلق بالتغليف، أو ملفات الدخول، أو سلوك تثبيت npm، فضَعها في `package.json`

### حقول `package.json` التي تؤثر في الاكتشاف

توجد بعض بيانات Plugin الوصفية السابقة لوقت التشغيل عمدًا داخل `package.json` تحت
كتلة `openclaw` بدلًا من `openclaw.plugin.json`.

أمثلة مهمة:

| الحقل                                                             | ما الذي يعنيه                                                                                                                                  |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | يصرّح بنقاط دخول Plugin الأصلية.                                                                                                              |
| `openclaw.setupEntry`                                             | نقطة دخول خفيفة مخصّصة للإعداد فقط وتُستخدم أثناء onboarding وبدء تشغيل القناة المؤجل.                                                        |
| `openclaw.channel`                                                | بيانات وصفية منخفضة الكلفة لفهرس القنوات مثل التسميات، ومسارات الوثائق، وaliases، ونصوص الاختيار.                                           |
| `openclaw.channel.configuredState`                                | بيانات وصفية خفيفة لوحدة فحص الحالة المُعدّة يمكنها الإجابة عن سؤال "هل يوجد إعداد يعتمد على البيئة فقط بالفعل؟" من دون تحميل وقت تشغيل القناة الكامل. |
| `openclaw.channel.persistedAuthState`                             | بيانات وصفية خفيفة لوحدة فحص auth المحفوظة يمكنها الإجابة عن سؤال "هل تم تسجيل الدخول إلى أي شيء بالفعل؟" من دون تحميل وقت تشغيل القناة الكامل. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | تلميحات التثبيت/التحديث للـ Plugins المضمّنة والمنشورة خارجيًا.                                                                                |
| `openclaw.install.defaultChoice`                                  | مسار التثبيت المفضّل عند توفر عدة مصادر تثبيت.                                                                                                 |
| `openclaw.install.minHostVersion`                                 | الحد الأدنى المدعوم من إصدار مضيف OpenClaw، باستخدام حد أدنى semver مثل `>=2026.3.22`.                                                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | يسمح بمسار تعافٍ ضيق لإعادة تثبيت Plugin مضمّن عندما تكون الإعدادات غير صالحة.                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | يسمح بتحميل أسطح القنوات المخصّصة للإعداد فقط قبل Plugin القناة الكامل أثناء بدء التشغيل.                                                     |

يُفرَض `openclaw.install.minHostVersion` أثناء التثبيت وتحميل سجل manifest.
تُرفَض القيم غير الصالحة؛ أما القيم الأحدث ولكن الصالحة فتتخطى Plugin
على المضيفات الأقدم.

إن `openclaw.install.allowInvalidConfigRecovery` ضيق النطاق عمدًا. فهو لا
يجعل الإعدادات المعطوبة بشكل عشوائي قابلة للتثبيت. في الوقت الحالي، يسمح فقط
لتدفقات التثبيت بالتعافي من حالات فشل ترقية محددة وقديمة لPlugin مضمّن،
مثل غياب مسار Plugin مضمّن أو وجود إدخال `channels.<id>` قديم لذلك Plugin
المضمّن نفسه. أما أخطاء الإعدادات غير المرتبطة فلا تزال تمنع التثبيت وتوجّه
المشغّلين إلى `openclaw doctor --fix`.

إن `openclaw.channel.persistedAuthState` هي بيانات وصفية للحزمة لوحدة فحص صغيرة:

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

استخدمها عندما تحتاج تدفقات الإعداد أو doctor أو الحالة المُعدّة إلى فحص auth
خفيف بنعم/لا قبل تحميل Plugin القناة الكامل. يجب أن يكون التصدير الهدف
دالة صغيرة تقرأ الحالة المحفوظة فقط؛ لا تمرّرها عبر barrel الخاص بوقت تشغيل القناة الكامل.

يتبع `openclaw.channel.configuredState` الشكل نفسه لعمليات الفحص الخفيفة
للحالة المُعدّة المعتمدة على البيئة فقط:

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

استخدمه عندما تستطيع قناة ما الإجابة عن الحالة المُعدّة اعتمادًا على البيئة
أو مدخلات صغيرة أخرى غير مرتبطة بوقت التشغيل. إذا كان الفحص يحتاج إلى الحل
الكامل للإعدادات أو إلى وقت تشغيل القناة الحقيقي، فأبقِ هذا المنطق في hook
`config.hasConfiguredState` الخاص بالـ Plugin بدلًا من ذلك.

## متطلبات مخطط JSON

- **يجب على كل Plugin أن يضمّ مخطط JSON**، حتى إذا كان لا يقبل أي إعدادات.
- يُقبل مخطط فارغ (على سبيل المثال، `{ "type": "object", "additionalProperties": false }`).
- تُتحقَّق المخططات عند قراءة/كتابة الإعدادات، وليس في وقت التشغيل.

## سلوك التحقق من الصحة

- مفاتيح `channels.*` غير المعروفة هي **أخطاء**، ما لم يكن معرّف القناة
  مُعلَنًا بواسطة manifest تابع لـ Plugin.
- يجب أن تشير `plugins.entries.<id>` و`plugins.allow` و`plugins.deny` و`plugins.slots.*`
  إلى معرّفات Plugins **قابلة للاكتشاف**. والمعرّفات غير المعروفة هي **أخطاء**.
- إذا كان Plugin مثبّتًا لكن لديه manifest أو schema معطوب أو مفقود،
  يفشل التحقق من الصحة ويبلّغ Doctor عن خطأ Plugin.
- إذا كانت إعدادات Plugin موجودة لكن Plugin **معطّل**، فستُحفَظ الإعدادات
  ويظهر **تحذير** في Doctor + السجلات.

راجع [Configuration reference](/ar/gateway/configuration) للاطلاع على مخطط `plugins.*` الكامل.

## ملاحظات

- ملف manifest **مطلوب للـ Plugins الأصلية في OpenClaw**، بما في ذلك التحميلات المحلية من نظام الملفات.
- لا يزال وقت التشغيل يحمّل وحدة Plugin بشكل منفصل؛ manifest مخصّص فقط
  للاكتشاف + التحقق من الصحة.
- تُحلَّل ملفات manifest الأصلية باستخدام JSON5، لذا تُقبل التعليقات،
  والفواصل اللاحقة، والمفاتيح غير الموضوعة بين علامات اقتباس ما دامت
  القيمة النهائية لا تزال كائنًا.
- لا يقرأ مُحمِّل manifest إلا حقول manifest الموثقة. تجنّب إضافة
  مفاتيح مخصّصة ذات مستوى أعلى هنا.
- `providerAuthEnvVars` هو مسار البيانات الوصفية منخفضة الكلفة لفحوصات auth،
  والتحقق من env-marker، والأسطح المشابهة الخاصة بـ provider-auth التي
  لا ينبغي أن تشغّل وقت تشغيل Plugin لمجرد فحص أسماء env.
- يتيح `providerAuthAliases` لمتغيرات provider إعادة استخدام متغيرات env
  الخاصة بـ auth لProvider آخر، وملفات auth التعريفية الخاصة به، وauth
  المدعوم بالإعدادات، وخيار onboarding الخاص بمفتاح API، من دون ترميز هذه
  العلاقة بشكل ثابت في النواة.
- `channelEnvVars` هو مسار البيانات الوصفية منخفضة الكلفة لبدائل shell-env،
  ورسائل الإعداد، والأسطح المشابهة الخاصة بالقنوات التي لا ينبغي أن تشغّل
  وقت تشغيل Plugin لمجرد فحص أسماء env.
- `providerAuthChoices` هو مسار البيانات الوصفية منخفضة الكلفة لمنتقيات
  auth-choice، وحل `--auth-choice`، وربط provider المفضّل، وتسجيل أعلام CLI
  البسيطة الخاصة بالتهيئة الأولية قبل تحميل وقت تشغيل provider. أما بالنسبة
  إلى بيانات wizard الوصفية الخاصة بوقت التشغيل التي تتطلب كود provider،
  فراجع [Provider runtime hooks](/ar/plugins/architecture#provider-runtime-hooks).
- تُختار أنواع Plugins الحصرية عبر `plugins.slots.*`.
  - يتم اختيار `kind: "memory"` بواسطة `plugins.slots.memory`.
  - يتم اختيار `kind: "context-engine"` بواسطة `plugins.slots.contextEngine`
    (الافتراضي: `legacy` المضمّن).
- يمكن حذف `channels` و`providers` و`cliBackends` و`skills` عندما لا يحتاج
  Plugin إليها.
- إذا كان Plugin الخاص بك يعتمد على وحدات أصلية، فوثّق خطوات البناء وأي
  متطلبات لقائمة السماح الخاصة بمدير الحزم (على سبيل المثال، `allow-build-scripts`
  في pnpm
  - `pnpm rebuild <package>`).

## ذو صلة

- [Building Plugins](/ar/plugins/building-plugins) — البدء باستخدام Plugins
- [Plugin Architecture](/ar/plugins/architecture) — البنية الداخلية
- [SDK Overview](/ar/plugins/sdk-overview) — مرجع Plugin SDK
