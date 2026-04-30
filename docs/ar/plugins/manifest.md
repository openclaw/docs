---
read_when:
    - أنت تبني Plugin لـ OpenClaw
    - تحتاج إلى إصدار مخطط تكوين Plugin أو تصحيح أخطاء التحقق من صحة Plugin
summary: متطلبات بيان Plugin ومخطط JSON (التحقق الصارم من التكوين)
title: بيان Plugin
x-i18n:
    generated_at: "2026-04-30T08:14:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

هذه الصفحة مخصصة **لبيان Plugin الأصلي في OpenClaw** فقط.

للاطلاع على تخطيطات الحزم المتوافقة، راجع [حزم Plugin](/ar/plugins/bundles).

تستخدم تنسيقات الحزم المتوافقة ملفات بيان مختلفة:

- حزمة Codex: `.codex-plugin/plugin.json`
- حزمة Claude: `.claude-plugin/plugin.json` أو تخطيط مكوّن Claude الافتراضي
  بدون بيان
- حزمة Cursor: `.cursor-plugin/plugin.json`

يكتشف OpenClaw تخطيطات الحزم هذه تلقائيًا أيضًا، لكنها لا تُتحقق
وفق مخطط `openclaw.plugin.json` الموضح هنا.

بالنسبة إلى الحزم المتوافقة، يقرأ OpenClaw حاليًا بيانات تعريف الحزمة إضافةً إلى جذور
Skills المعلنة، وجذور أوامر Claude، وقيم `settings.json` الافتراضية في حزمة Claude،
وقيم LSP الافتراضية في حزمة Claude، وحزم الخطافات المدعومة عندما يطابق التخطيط
توقعات وقت تشغيل OpenClaw.

يجب أن يوفّر كل Plugin أصلي في OpenClaw ملف `openclaw.plugin.json` في
**جذر Plugin**. يستخدم OpenClaw هذا البيان للتحقق من صحة الإعدادات
**دون تنفيذ كود Plugin**. تُعامل البيانات المفقودة أو غير الصالحة على أنها
أخطاء في Plugin وتحظر التحقق من صحة الإعدادات.

راجع الدليل الكامل لنظام Plugin: [Plugins](/ar/tools/plugin).
للاطلاع على نموذج القدرات الأصلي وإرشادات التوافق الخارجي الحالية:
[نموذج القدرات](/ar/plugins/architecture#public-capability-model).

## ما الذي يفعله هذا الملف

`openclaw.plugin.json` هو بيانات التعريف التي يقرأها OpenClaw **قبل أن يحمّل
كود Plugin الخاص بك**. يجب أن يكون كل ما يلي خفيفًا بما يكفي لفحصه دون تشغيل
وقت تشغيل Plugin.

**استخدمه من أجل:**

- هوية Plugin، والتحقق من صحة الإعدادات، وتلميحات واجهة إعدادات المستخدم
- بيانات تعريف المصادقة، والتهيئة الأولية، والإعداد (الاسم المستعار، التفعيل التلقائي، متغيرات بيئة المزوّد، خيارات المصادقة)
- تلميحات التفعيل لأسطح مستوى التحكم
- ملكية مختصرة لعائلة النماذج
- لقطات ثابتة لملكية القدرات (`contracts`)
- بيانات تعريف مشغّل QA التي يمكن لمضيف `openclaw qa` المشترك فحصها
- بيانات تعريف الإعدادات الخاصة بالقنوات المدمجة في أسطح الفهرس والتحقق

**لا تستخدمه من أجل:** تسجيل سلوك وقت التشغيل، أو إعلان نقاط دخول الكود،
أو بيانات تعريف تثبيت npm. هذه تنتمي إلى كود Plugin الخاص بك و`package.json`.

## مثال بسيط

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
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
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

## مرجع الحقول ذات المستوى الأعلى

| الحقل                                | مطلوب | النوع                            | معناه                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | نعم      | `string`                         | معرّف Plugin القانوني. هذا هو المعرّف المستخدم في `plugins.entries.<id>`.                                                                                                                                                               |
| `configSchema`                       | نعم      | `object`                         | JSON Schema مضمّن لتكوين هذا Plugin.                                                                                                                                                                                      |
| `enabledByDefault`                   | لا       | `true`                           | يعلّم Plugin المضمّن على أنه مفعّل افتراضيًا. احذفه، أو عيّن أي قيمة غير `true`، لترك Plugin معطّلًا افتراضيًا.                                                                                                      |
| `legacyPluginIds`                    | لا       | `string[]`                       | المعرّفات القديمة التي تُطبّع إلى معرّف Plugin القانوني هذا.                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | لا       | `string[]`                       | معرّفات المزوّدين التي يجب أن تفعّل هذا Plugin تلقائيًا عندما تذكرها مراجع المصادقة أو التكوين أو النموذج.                                                                                                                                   |
| `kind`                               | لا       | `"memory"` \| `"context-engine"` | يعلن نوع Plugin حصريًا يستخدمه `plugins.slots.*`.                                                                                                                                                                      |
| `channels`                           | لا       | `string[]`                       | معرّفات القنوات المملوكة لهذا Plugin. تُستخدم للاكتشاف والتحقق من التكوين.                                                                                                                                                       |
| `providers`                          | لا       | `string[]`                       | معرّفات المزوّدين المملوكة لهذا Plugin.                                                                                                                                                                                                |
| `providerDiscoveryEntry`             | لا       | `string`                         | مسار وحدة خفيفة لاكتشاف المزوّد، نسبيًا إلى جذر Plugin، لبيانات تعريف كتالوج المزوّدين ضمن نطاق المانيفست التي يمكن تحميلها دون تفعيل وقت تشغيل Plugin الكامل.                                             |
| `modelSupport`                       | لا       | `object`                         | اختصار مملوك للمانيفست لبيانات تعريف عائلة النماذج يُستخدم لتحميل Plugin تلقائيًا قبل وقت التشغيل.                                                                                                                                       |
| `modelCatalog`                       | لا       | `object`                         | بيانات تعريف تصريحية لكتالوج النماذج للمزوّدين المملوكين لهذا Plugin. هذا هو عقد مستوى التحكم للإدراج المستقبلي للقراءة فقط، والإعداد الأولي، ومنتقيات النماذج، والأسماء المستعارة، والكتم دون تحميل وقت تشغيل Plugin.       |
| `modelPricing`                       | لا       | `object`                         | سياسة بحث خارجية عن الأسعار مملوكة للمزوّد. استخدمها لاستبعاد المزوّدين المحليين أو المستضافين ذاتيًا من كتالوجات الأسعار البعيدة أو ربط مراجع المزوّد بمعرّفات كتالوج OpenRouter/LiteLLM دون ترميز معرّفات المزوّدين في النواة.           |
| `modelIdNormalization`               | لا       | `object`                         | تنظيف الأسماء المستعارة/البادئات لمعرّفات النماذج المملوك للمزوّد، ويجب تشغيله قبل تحميل وقت تشغيل المزوّد.                                                                                                                                         |
| `providerEndpoints`                  | لا       | `object[]`                       | بيانات تعريف المضيف/عنوان baseUrl لنقاط النهاية المملوكة للمانيفست لمسارات المزوّد التي يجب أن تصنّفها النواة قبل تحميل وقت تشغيل المزوّد.                                                                                                          |
| `providerRequest`                    | لا       | `object`                         | بيانات تعريف خفيفة لعائلة المزوّد وتوافق الطلبات تستخدمها سياسة الطلبات العامة قبل تحميل وقت تشغيل المزوّد.                                                                                                            |
| `cliBackends`                        | لا       | `string[]`                       | معرّفات واجهات خلفية لاستدلال CLI مملوكة لهذا Plugin. تُستخدم للتفعيل التلقائي عند بدء التشغيل من مراجع تكوين صريحة.                                                                                                                       |
| `syntheticAuthRefs`                  | لا       | `string[]`                       | مراجع المزوّد أو واجهة CLI الخلفية التي يجب فحص خطاف المصادقة الاصطناعي المملوك لـ Plugin الخاص بها أثناء اكتشاف النماذج البارد قبل تحميل وقت التشغيل.                                                                                            |
| `nonSecretAuthMarkers`               | لا       | `string[]`                       | قيم مفاتيح API نائبة مملوكة لـ Plugin مضمّن وتمثّل حالة اعتماد محلية أو OAuth أو محيطة غير سرية.                                                                                                              |
| `commandAliases`                     | لا       | `object[]`                       | أسماء أوامر مملوكة لهذا Plugin ويجب أن تنتج تشخيصات تكوين وCLI واعية بـ Plugin قبل تحميل وقت التشغيل.                                                                                                              |
| `providerAuthEnvVars`                | لا       | `Record<string, string[]>`       | بيانات تعريف بيئة توافقية مهملة للبحث عن مصادقة/حالة المزوّد. فضّل `setup.providers[].envVars` للـ Plugins الجديدة؛ لا يزال OpenClaw يقرأ هذا أثناء نافذة الإهمال.                                               |
| `providerAuthAliases`                | لا       | `Record<string, string>`         | معرّفات مزوّدين يجب أن تعيد استخدام معرّف مزوّد آخر للبحث عن المصادقة، مثل مزوّد برمجة يشارك مفتاح API الأساسي وملفات تعريف المصادقة للمزوّد.                                                                        |
| `channelEnvVars`                     | لا       | `Record<string, string[]>`       | بيانات تعريف خفيفة لبيئة القناة يمكن لـ OpenClaw فحصها دون تحميل كود Plugin. استخدم هذا لإعداد القنوات المعتمد على البيئة أو أسطح المصادقة التي يجب أن تراها مساعدات بدء التشغيل/التكوين العامة.                                          |
| `providerAuthChoices`                | لا       | `object[]`                       | بيانات تعريف خفيفة لخيارات المصادقة لمنتقيات الإعداد الأولي، وحل المزوّد المفضّل، وربط أعلام CLI البسيط.                                                                                                                     |
| `activation`                         | لا       | `object`                         | بيانات تعريف خفيفة لمخطط التفعيل لبدء التشغيل والمزوّد والأمر والقناة والمسار والتحميل المحفّز بالقدرات. بيانات تعريف فقط؛ لا يزال وقت تشغيل Plugin يملك السلوك الفعلي.                                                     |
| `setup`                              | لا       | `object`                         | واصفات إعداد/تهيئة أولية خفيفة يمكن لأسطح الاكتشاف والإعداد فحصها دون تحميل وقت تشغيل Plugin.                                                                                                                  |
| `qaRunners`                          | لا       | `object[]`                       | واصفات خفيفة لمشغّلات ضمان الجودة يستخدمها مضيف `openclaw qa` المشترك قبل تحميل وقت تشغيل Plugin.                                                                                                                                    |
| `contracts`                          | لا       | `object`                         | لقطة ثابتة لقدرات مضمّنة لخطافات المصادقة الخارجية، والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الموسيقى، وتوليد الفيديو، وجلب الويب، والبحث في الويب، وملكية الأدوات. |
| `mediaUnderstandingProviderMetadata` | لا       | `Record<string, object>`         | افتراضات خفيفة لفهم الوسائط لمعرّفات المزوّدين المعلنة في `contracts.mediaUnderstandingProviders`.                                                                                                                          |
| `channelConfigs`                     | لا       | `Record<string, object>`         | بيانات تعريف تكوين القناة المملوكة للمانيفست والمُدمجة في أسطح الاكتشاف والتحقق قبل تحميل وقت التشغيل.                                                                                                                        |
| `skills`                             | لا       | `string[]`                       | أدلة Skills المراد تحميلها، نسبيًا إلى جذر Plugin.                                                                                                                                                                           |
| `name`                               | لا       | `string`                         | اسم Plugin مقروء للبشر.                                                                                                                                                                                                       |
| `description`                        | لا       | `string`                         | ملخص قصير يظهر في أسطح Plugin.                                                                                                                                                                                           |
| `version`                            | لا       | `string`                         | إصدار Plugin معلوماتي.                                                                                                                                                                                                     |
| `uiHints`                            | لا       | `Record<string, object>`         | تسميات واجهة المستخدم، والعناصر النائبة، وتلميحات الحساسية لحقول التكوين.                                                                                                                                                                 |

## مرجع providerAuthChoices

يصف كل إدخال في `providerAuthChoices` خيار إعداد أولي أو مصادقة واحدًا.
يقرأ OpenClaw هذا قبل تحميل وقت تشغيل المزوّد.
تستخدم قوائم إعداد المزوّد خيارات المانيفست هذه، وخيارات الإعداد
المشتقة من الواصفات، وبيانات تعريف كتالوج التثبيت دون تحميل وقت تشغيل المزوّد.

| الحقل                 | مطلوب | النوع                                            | ما يعنيه                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | نعم      | `string`                                        | معرّف المزوّد الذي ينتمي إليه هذا الاختيار.                                                                      |
| `method`              | نعم      | `string`                                        | معرّف طريقة المصادقة التي سيتم التوجيه إليها.                                                                           |
| `choiceId`            | نعم      | `string`                                        | معرّف ثابت لاختيار المصادقة تستخدمه تدفقات الإعداد وCLI.                                                  |
| `choiceLabel`         | لا       | `string`                                        | تسمية معروضة للمستخدم. إذا حُذفت، يعود OpenClaw إلى `choiceId`.                                        |
| `choiceHint`          | لا       | `string`                                        | نص مساعد قصير للمُنتقي.                                                                        |
| `assistantPriority`   | لا       | `number`                                        | تُرتَّب القيم الأقل في وقت أبكر داخل المُنتقيات التفاعلية التي يقودها المساعد.                                       |
| `assistantVisibility` | لا       | `"visible"` \| `"manual-only"`                  | إخفاء الاختيار من مُنتقيات المساعد مع إبقاء التحديد اليدوي عبر CLI مسموحًا به.                        |
| `deprecatedChoiceIds` | لا       | `string[]`                                      | معرّفات اختيار قديمة ينبغي أن تعيد توجيه المستخدمين إلى هذا الاختيار البديل.                                 |
| `groupId`             | لا       | `string`                                        | معرّف مجموعة اختياري لتجميع الاختيارات ذات الصلة.                                                          |
| `groupLabel`          | لا       | `string`                                        | تسمية معروضة للمستخدم لتلك المجموعة.                                                                        |
| `groupHint`           | لا       | `string`                                        | نص مساعد قصير للمجموعة.                                                                         |
| `optionKey`           | لا       | `string`                                        | مفتاح خيار داخلي لتدفقات المصادقة البسيطة ذات العلم الواحد.                                                      |
| `cliFlag`             | لا       | `string`                                        | اسم علم CLI، مثل `--openrouter-api-key`.                                                           |
| `cliOption`           | لا       | `string`                                        | الشكل الكامل لخيار CLI، مثل `--openrouter-api-key <key>`.                                             |
| `cliDescription`      | لا       | `string`                                        | الوصف المستخدم في مساعدة CLI.                                                                            |
| `onboardingScopes`    | لا       | `Array<"text-inference" \| "image-generation">` | أسطح الإعداد التي ينبغي أن يظهر فيها هذا الاختيار. إذا حُذف، تكون قيمته الافتراضية `["text-inference"]`. |

## مرجع commandAliases

استخدم `commandAliases` عندما يملك Plugin اسم أمر وقت تشغيل قد يضعه المستخدمون
خطأً في `plugins.allow` أو يحاولون تشغيله كأمر CLI جذري. يستخدم OpenClaw
هذه البيانات الوصفية للتشخيصات من دون استيراد كود وقت تشغيل Plugin.

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

| الحقل        | مطلوب | النوع              | ما يعنيه                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | نعم      | `string`          | اسم الأمر الذي ينتمي إلى هذا Plugin.                               |
| `kind`       | لا       | `"runtime-slash"` | يضع علامة على الاسم المستعار باعتباره أمر شرطة مائلة في الدردشة بدلًا من أمر CLI جذري. |
| `cliCommand` | لا       | `string`          | أمر CLI جذري ذو صلة يُقترح لعمليات CLI، إن وُجد.  |

## مرجع activation

استخدم `activation` عندما يستطيع Plugin التصريح بتكلفة منخفضة عن أحداث مستوى التحكم
التي ينبغي أن تُدرجه في خطة تفعيل/تحميل.

هذه الكتلة هي بيانات وصفية للمخطِّط، وليست API دورة حياة. لا تسجّل
سلوك وقت التشغيل، ولا تستبدل `register(...)`، ولا تَعِد بأن
كود Plugin قد نُفِّذ بالفعل. يستخدم مخطِّط التفعيل هذه الحقول
لتضييق نطاق Plugins المرشحة قبل الرجوع إلى بيانات وصفية موجودة لملكية البيان
مثل `providers` و`channels` و`commandAliases` و`setup.providers`
و`contracts.tools` والخطافات.

فضّل أضيق بيانات وصفية تصف الملكية بالفعل. استخدم
`providers` أو `channels` أو `commandAliases` أو واصفات الإعداد أو `contracts`
عندما تعبّر تلك الحقول عن العلاقة. استخدم `activation` لتلميحات مخطِّط إضافية
لا يمكن تمثيلها عبر حقول الملكية تلك.
استخدم `cliBackends` في المستوى الأعلى للأسماء المستعارة لوقت تشغيل CLI مثل `claude-cli`
أو `codex-cli` أو `google-gemini-cli`؛ أما `activation.onAgentHarnesses` فهو مخصص فقط
لمعرّفات أحزمة الوكلاء المضمّنة التي لا تملك حقل ملكية بالفعل.

هذه الكتلة بيانات وصفية فقط. لا تسجّل سلوك وقت التشغيل، ولا
تستبدل `register(...)` أو `setupEntry` أو نقاط دخول وقت التشغيل/Plugin الأخرى.
يستخدمها المستهلكون الحاليون كتلميح لتضييق النطاق قبل تحميل Plugins على نطاق أوسع، لذا
فإن غياب بيانات تفعيل وصفية عادةً لا يكلّف إلا الأداء؛ ولا ينبغي أن
يغيّر الصحة ما دامت بدائل ملكية البيان القديمة ما زالت موجودة.

ينبغي لكل Plugin ضبط `activation.onStartup` عن قصد بينما ينتقل OpenClaw
بعيدًا عن استيرادات بدء التشغيل الضمنية. اضبطه إلى `true` فقط عندما يجب أن يعمل Plugin
أثناء بدء تشغيل Gateway. اضبطه إلى `false` عندما يكون Plugin خامدًا عند
بدء التشغيل وينبغي تحميله فقط من مشغلات أضيق. إن حذف `onStartup` يُبقي
بديل الرفيق الضمني القديم المهمل عند بدء التشغيل لـ Plugins التي لا تملك
بيانات وصفية ثابتة للقدرات؛ قد تتوقف الإصدارات المستقبلية عن تحميل تلك
Plugins عند بدء التشغيل ما لم تصرّح بـ `activation.onStartup: true`. تحذّر تقارير حالة Plugin
والتوافق بـ `legacy-implicit-startup-sidecar` عندما يظل Plugin
يعتمد على ذلك البديل.

لاختبار الترحيل، اضبط
`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` لتعطيل ذلك
البديل المهمل فقط. لا يمنع وضع الاشتراك هذا Plugins ذات
`activation.onStartup: true` الصريح أو Plugins المحمّلة بواسطة القناة أو الإعدادات
أو حزام الوكيل أو الذاكرة أو غيرها من مشغلات التفعيل الأضيق.

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| الحقل              | مطلوب | النوع                                                 | ما يعنيه                                                                                                                                                                                                                      |
| ------------------ | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | لا       | `boolean`                                            | تفعيل صريح عند بدء تشغيل Gateway. ينبغي لكل Plugin ضبط هذا. تؤدي `true` إلى استيراد Plugin أثناء بدء التشغيل؛ وتؤدي `false` إلى الانسحاب من بديل بدء التشغيل الضمني المهمل للرفيق ما لم يتطلب مشغل مطابق آخر التحميل. |
| `onProviders`      | لا       | `string[]`                                           | معرّفات المزوّدين التي ينبغي أن تُدرج هذا Plugin في خطط التفعيل/التحميل.                                                                                                                                                             |
| `onAgentHarnesses` | لا       | `string[]`                                           | معرّفات وقت تشغيل أحزمة الوكلاء المضمّنة التي ينبغي أن تُدرج هذا Plugin في خطط التفعيل/التحميل. استخدم `cliBackends` في المستوى الأعلى للأسماء المستعارة لخلفيات CLI.                                                                                  |
| `onCommands`       | لا       | `string[]`                                           | معرّفات الأوامر التي ينبغي أن تُدرج هذا Plugin في خطط التفعيل/التحميل.                                                                                                                                                              |
| `onChannels`       | لا       | `string[]`                                           | معرّفات القنوات التي ينبغي أن تُدرج هذا Plugin في خطط التفعيل/التحميل.                                                                                                                                                              |
| `onRoutes`         | لا       | `string[]`                                           | أنواع المسارات التي ينبغي أن تُدرج هذا Plugin في خطط التفعيل/التحميل.                                                                                                                                                              |
| `onConfigPaths`    | لا       | `string[]`                                           | مسارات إعداد مرتبطة بالجذر ينبغي أن تُدرج هذا Plugin في خطط بدء التشغيل/التحميل عندما يكون المسار موجودًا وغير معطّل صراحةً.                                                                                             |
| `onCapabilities`   | لا       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | تلميحات قدرات واسعة يستخدمها تخطيط التفعيل في مستوى التحكم. فضّل الحقول الأضيق عندما يكون ذلك ممكنًا.                                                                                                                            |

المستهلكون المباشرون الحاليون:

- يستخدم تخطيط بدء تشغيل Gateway ‏`activation.onStartup` للاستيراد الصريح عند بدء التشغيل
  والانسحاب من بديل بدء التشغيل الضمني المهمل للرفيق
- يعود تخطيط CLI المشغّل بالأوامر إلى
  `commandAliases[].cliCommand` أو `commandAliases[].name` القديمين
- يستخدم تخطيط بدء تشغيل وقت تشغيل الوكيل `activation.onAgentHarnesses` من أجل
  الأحزمة المضمّنة و`cliBackends[]` في المستوى الأعلى للأسماء المستعارة لوقت تشغيل CLI
- يعود تخطيط الإعداد/القنوات المشغّل بالقنوات إلى ملكية `channels[]`
  القديمة عندما تكون بيانات تفعيل القناة الصريحة مفقودة
- يستخدم تخطيط Plugin عند بدء التشغيل `activation.onConfigPaths` لأسطح إعداد جذرية
  غير قنوية مثل كتلة `browser` الخاصة بـ Plugin المتصفح المضمّن
- يعود تخطيط الإعداد/وقت التشغيل المشغّل بالمزوّد إلى ملكية
  `providers[]` و`cliBackends[]` في المستوى الأعلى القديمة عندما تكون بيانات تفعيل
  المزوّد الصريحة مفقودة

يمكن لتشخيصات المخطِّط التمييز بين تلميحات التفعيل الصريحة وبديل
ملكية البيان. على سبيل المثال، يعني `activation-command-hint` أن
`activation.onCommands` طابق، بينما يعني `manifest-command-alias` أن
المخطِّط استخدم ملكية `commandAliases` بدلًا من ذلك. تسميات الأسباب هذه مخصصة
لتشخيصات المضيف والاختبارات؛ وينبغي لمؤلفي Plugins الاستمرار في التصريح بالبيانات الوصفية
التي تصف الملكية بأفضل شكل.

## مرجع qaRunners

استخدم `qaRunners` عندما يساهم Plugin بمشغّل نقل واحد أو أكثر تحت
جذر `openclaw qa` المشترك. أبقِ هذه البيانات الوصفية منخفضة التكلفة وثابتة؛ فما زال
وقت تشغيل Plugin يملك تسجيل CLI الفعلي عبر سطح
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

| الحقل         | مطلوب | النوع     | ما يعنيه                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | نعم      | `string` | الأمر الفرعي المثبّت تحت `openclaw qa`، مثل `matrix`.    |
| `description` | لا       | `string` | نص المساعدة الاحتياطي المستخدم عندما يحتاج المضيف المشترك إلى أمر بديل. |

## مرجع setup

استخدم `setup` عندما تحتاج واجهات الإعداد والتهيئة الأولية إلى بيانات وصفية رخيصة مملوكة للـ plugin
قبل تحميل وقت التشغيل.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

يبقى `cliBackends` في المستوى الأعلى صالحًا ويستمر في وصف خلفيات استنتاج CLI.
`setup.cliBackends` هو سطح الواصف الخاص بالإعداد
لتدفقات مستوى التحكم/الإعداد التي يجب أن تبقى مقتصرة على البيانات الوصفية.

عند وجودهما، يكون `setup.providers` و`setup.cliBackends` هما
سطح البحث المفضل القائم على الواصفات أولًا لاكتشاف الإعداد. إذا كان الواصف يضيّق
الـ plugin المرشح فقط وكان الإعداد لا يزال يحتاج إلى خطافات وقت تشغيل أغنى في وقت الإعداد،
فعيّن `requiresRuntime: true` وأبقِ `setup-api` في مكانه بوصفه
مسار التنفيذ الاحتياطي.

يتضمن OpenClaw أيضًا `setup.providers[].envVars` في مصادقة المزوّد العامة وعمليات البحث عن
متغيرات البيئة. يظل `providerAuthEnvVars` مدعومًا عبر محوّل توافق
خلال نافذة الإهلاك، لكن plugins غير المضمّنة التي لا تزال تستخدمه
تتلقى تشخيصًا في البيان. يجب أن تضع plugins الجديدة بيانات تعريف بيئة الإعداد/الحالة
على `setup.providers[].envVars`.

يمكن لـ OpenClaw أيضًا اشتقاق خيارات إعداد بسيطة من `setup.providers[].authMethods`
عند عدم توفر إدخال إعداد، أو عندما يعلن `setup.requiresRuntime: false`
أن وقت تشغيل الإعداد غير ضروري. تبقى إدخالات `providerAuthChoices` الصريحة
مفضلة للتسميات المخصصة، وأعلام CLI، ونطاق التهيئة الأولية، وبيانات المساعد الوصفية.

عيّن `requiresRuntime: false` فقط عندما تكون تلك الواصفات كافية لسطح
الإعداد. يتعامل OpenClaw مع `false` الصريح كعقد مقتصر على الواصفات
ولن ينفذ `setup-api` أو `openclaw.setupEntry` لبحث الإعداد. إذا
كان plugin مقتصرًا على الواصفات لا يزال يشحن أحد إدخالات وقت تشغيل الإعداد تلك،
فسيبلغ OpenClaw عن تشخيص إضافي ويستمر في تجاهله. إبقاء
`requiresRuntime` محذوفًا يحافظ على سلوك الاحتياطي القديم كي لا تتعطل plugins الحالية التي أضافت
واصفات من دون العلم.

لأن بحث الإعداد يمكن أن ينفذ كود `setup-api` مملوكًا للـ plugin، يجب أن تبقى قيم
`setup.providers[].id` و`setup.cliBackends[]` المطبّعة فريدة عبر
plugins المكتشفة. يفشل الالتباس في الملكية بصورة مغلقة بدلًا من اختيار
فائز من ترتيب الاكتشاف.

عند تنفيذ وقت تشغيل الإعداد، تبلغ تشخيصات سجل الإعداد عن انحراف الواصفات
إذا سجّل `setup-api` مزوّدًا أو خلفية CLI لا تعلنها
واصفات البيان، أو إذا لم يكن لواصف تسجيل وقت تشغيل مطابق.
هذه التشخيصات إضافية ولا ترفض plugins القديمة.

### مرجع setup.providers

| الحقل          | مطلوب | النوع       | ما يعنيه                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | نعم      | `string`   | معرّف المزوّد المعروض أثناء الإعداد أو التهيئة الأولية. أبقِ المعرّفات المطبّعة فريدة عالميًا.             |
| `authMethods`  | لا       | `string[]` | معرّفات طرق الإعداد/المصادقة التي يدعمها هذا المزوّد من دون تحميل وقت التشغيل الكامل.                       |
| `envVars`      | لا       | `string[]` | متغيرات البيئة التي يمكن لواجهات الإعداد/الحالة العامة فحصها قبل تحميل وقت تشغيل الـ plugin.               |
| `authEvidence` | لا       | `object[]` | فحوصات أدلة مصادقة محلية رخيصة للمزوّدين الذين يمكنهم المصادقة عبر علامات غير سرية. |

`authEvidence` مخصص لعلامات بيانات الاعتماد المحلية المملوكة للمزوّد التي يمكن
التحقق منها من دون تحميل كود وقت التشغيل. يجب أن تبقى هذه الفحوصات رخيصة ومحلية:
لا استدعاءات شبكة، ولا قراءات من keychain أو مدير أسرار، ولا أوامر shell، ولا
اختبارات لمزود API.

إدخالات الأدلة المدعومة:

| الحقل              | مطلوب | النوع       | ما يعنيه                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | نعم      | `string`   | حاليًا `local-file-with-env`.                                                                               |
| `fileEnvVar`       | لا       | `string`   | متغير بيئة يحتوي على مسار صريح لملف بيانات الاعتماد.                                                           |
| `fallbackPaths`    | لا       | `string[]` | مسارات ملفات بيانات اعتماد محلية تُفحص عندما يكون `fileEnvVar` غائبًا أو فارغًا. يدعم `${HOME}` و`${APPDATA}`. |
| `requiresAnyEnv`   | لا       | `string[]` | يجب أن يكون واحد على الأقل من متغيرات البيئة المدرجة غير فارغ قبل أن يكون الدليل صالحًا.                                    |
| `requiresAllEnv`   | لا       | `string[]` | يجب أن يكون كل متغير بيئة مدرج غير فارغ قبل أن يكون الدليل صالحًا.                                           |
| `credentialMarker` | نعم      | `string`   | علامة غير سرية تُعاد عند وجود الدليل.                                                       |
| `source`           | لا       | `string`   | تسمية مصدر موجهة للمستخدم لمخرجات المصادقة/الحالة.                                                               |

### حقول setup

| الحقل              | مطلوب | النوع       | ما يعنيه                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | لا       | `object[]` | واصفات إعداد المزوّد المعروضة أثناء الإعداد والتهيئة الأولية.                                     |
| `cliBackends`      | لا       | `string[]` | معرّفات الخلفيات في وقت الإعداد المستخدمة لبحث الإعداد القائم على الواصفات أولًا. أبقِ المعرّفات المطبّعة فريدة عالميًا. |
| `configMigrations` | لا       | `string[]` | معرّفات ترحيل الإعدادات التي يملكها سطح إعداد هذا الـ plugin.                                          |
| `requiresRuntime`  | لا       | `boolean`  | ما إذا كان الإعداد لا يزال يحتاج إلى تنفيذ `setup-api` بعد بحث الواصفات.                            |

## مرجع uiHints

`uiHints` هو خريطة من أسماء حقول الإعدادات إلى تلميحات عرض صغيرة.

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

| الحقل         | النوع       | ما يعنيه                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | تسمية الحقل الموجهة للمستخدم.                |
| `help`        | `string`   | نص مساعدة قصير.                      |
| `tags`        | `string[]` | وسوم UI اختيارية.                       |
| `advanced`    | `boolean`  | يضع علامة على الحقل بأنه متقدم.            |
| `sensitive`   | `boolean`  | يضع علامة على الحقل بأنه سري أو حساس. |
| `placeholder` | `string`   | نص العنصر النائب لمدخلات النماذج.       |

## مرجع contracts

استخدم `contracts` فقط لبيانات تعريف ملكية القدرات الثابتة التي يمكن لـ OpenClaw
قراءتها من دون استيراد وقت تشغيل الـ plugin.

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
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

كل قائمة اختيارية:

| الحقل                            | النوع       | ما يعنيه                                                         |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | معرّفات مصانع امتدادات خادم تطبيق Codex، حاليًا `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | معرّفات وقت التشغيل التي قد يسجّل plugin مضمّن وسيط نتائج الأدوات لها. |
| `externalAuthProviders`          | `string[]` | معرّفات المزوّدين التي يملك هذا الـ plugin خطاف ملف تعريف المصادقة الخارجية لها.       |
| `speechProviders`                | `string[]` | معرّفات مزوّدي الكلام التي يملكها هذا الـ plugin.                                 |
| `realtimeTranscriptionProviders` | `string[]` | معرّفات مزوّدي النسخ الفوري التي يملكها هذا الـ plugin.                 |
| `realtimeVoiceProviders`         | `string[]` | معرّفات مزوّدي الصوت الفوري التي يملكها هذا الـ plugin.                         |
| `memoryEmbeddingProviders`       | `string[]` | معرّفات مزوّدي تضمين الذاكرة التي يملكها هذا الـ plugin.                       |
| `mediaUnderstandingProviders`    | `string[]` | معرّفات مزوّدي فهم الوسائط التي يملكها هذا الـ plugin.                    |
| `imageGenerationProviders`       | `string[]` | معرّفات مزوّدي توليد الصور التي يملكها هذا الـ plugin.                       |
| `videoGenerationProviders`       | `string[]` | معرّفات مزوّدي توليد الفيديو التي يملكها هذا الـ plugin.                       |
| `webFetchProviders`              | `string[]` | معرّفات مزوّدي جلب الويب التي يملكها هذا الـ plugin.                              |
| `webSearchProviders`             | `string[]` | معرّفات مزوّدي بحث الويب التي يملكها هذا الـ plugin.                             |
| `migrationProviders`             | `string[]` | معرّفات مزوّدي الاستيراد التي يملكها هذا الـ plugin لـ `openclaw migrate`.          |
| `tools`                          | `string[]` | أسماء أدوات الوكيل التي يملكها هذا الـ plugin لفحوصات العقود المضمّنة.        |

يُحتفظ بـ `contracts.embeddedExtensionFactories` لمصانع الامتدادات المضمّنة الخاصة
بخادم تطبيق Codex فقط. يجب أن تعلن تحويلات نتائج الأدوات المضمّنة
`contracts.agentToolResultMiddleware` وأن تسجّل باستخدام
`api.registerAgentToolResultMiddleware(...)` بدلًا من ذلك. لا تستطيع plugins الخارجية
تسجيل وسيط نتائج الأدوات لأن هذا الموضع يمكنه إعادة كتابة مخرجات الأدوات عالية الثقة
قبل أن يراها النموذج.

يجب أن تعلن plugins المزوّد التي تنفذ `resolveExternalAuthProfiles`
`contracts.externalAuthProviders`. لا تزال plugins التي لا تملك الإعلان تعمل
عبر احتياطي توافق مهمل، لكن ذلك الاحتياطي أبطأ
وسيُزال بعد نافذة الترحيل.

يجب أن تعلن مزوّدات تضمين الذاكرة المضمّنة
`contracts.memoryEmbeddingProviders` لكل معرّف محوّل تعرضه، بما في ذلك
المحوّلات المدمجة مثل `local`. تستخدم مسارات CLI المستقلة عقد البيان هذا
لتحميل الـ plugin المالك فقط قبل أن يكون وقت تشغيل Gateway الكامل قد
سجّل المزوّدين.

## مرجع mediaUnderstandingProviderMetadata

استخدم `mediaUnderstandingProviderMetadata` عندما يكون لدى موفر فهم الوسائط
نماذج افتراضية، أو أولوية احتياطية للمصادقة التلقائية، أو دعم مستندات أصلي
تحتاج إليه مساعدات النواة العامة قبل تحميل وقت التشغيل. يجب أيضًا تعريف المفاتيح في
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

يمكن أن يتضمن كل إدخال موفر ما يلي:

| الحقل                  | النوع                                | ما يعنيه                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | قدرات الوسائط التي يتيحها هذا الموفر.                                 |
| `defaultModels`        | `Record<string, string>`            | افتراضيات ربط القدرة بالنموذج المستخدمة عندما لا تحدد الإعدادات نموذجًا.      |
| `autoPriority`         | `Record<string, number>`            | الأرقام الأقل تُرتَّب أبكرًا للاحتياط التلقائي للموفر المستند إلى بيانات الاعتماد. |
| `nativeDocumentInputs` | `"pdf"[]`                           | مدخلات المستندات الأصلية التي يدعمها الموفر.                            |

## مرجع channelConfigs

استخدم `channelConfigs` عندما يحتاج Plugin قناة إلى بيانات تعريف إعدادات خفيفة قبل
تحميل وقت التشغيل. يمكن لاكتشاف إعداد/حالة القناة للقراءة فقط استخدام بيانات التعريف هذه
مباشرة للقنوات الخارجية المضبوطة عندما لا يتوفر إدخال إعداد، أو
عندما يعلن `setup.requiresRuntime: false` أن وقت تشغيل الإعداد غير ضروري.

`channelConfigs` هي بيانات تعريف بيان Plugin، وليست قسم إعدادات مستخدم جديدًا في المستوى الأعلى.
لا يزال المستخدمون يضبطون مثيلات القنوات ضمن `channels.<channel-id>`.
يقرأ OpenClaw بيانات تعريف البيان لتحديد أي Plugin يملك تلك القناة المضبوطة
قبل تنفيذ كود وقت تشغيل Plugin.

بالنسبة إلى Plugin قناة، يصف `configSchema` و`channelConfigs` مسارات مختلفة:

- يتحقق `configSchema` من `plugins.entries.<plugin-id>.config`
- يتحقق `channelConfigs.<channel-id>.schema` من `channels.<channel-id>`

يجب على Plugins غير المضمنة التي تعلن `channels[]` أن تعلن أيضًا إدخالات
`channelConfigs` المطابقة. من دونها، لا يزال بإمكان OpenClaw تحميل Plugin، لكن
مخطط إعدادات المسار البارد، والإعداد، وأسطح Control UI لا يمكنها معرفة
شكل الخيارات المملوكة للقناة حتى ينفذ وقت تشغيل Plugin.

يمكن لـ `channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` و
`nativeSkillsAutoEnabled` إعلان افتراضيات `auto` ثابتة لفحوصات إعدادات الأوامر
التي تعمل قبل تحميل وقت تشغيل القناة. يمكن للقنوات المضمنة أيضًا نشر
الافتراضيات نفسها عبر `package.json#openclaw.channel.commands` إلى جانب
بيانات تعريف كتالوج القنوات الأخرى المملوكة للحزمة.

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

| الحقل         | النوع                     | ما يعنيه                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema لـ `channels.<id>`. مطلوب لكل إدخال إعداد قناة معلن.         |
| `uiHints`     | `Record<string, object>` | تسميات/عناصر نائبة/تلميحات حساسة اختيارية لواجهة المستخدم لقسم إعدادات تلك القناة.          |
| `label`       | `string`                 | تسمية القناة المدمجة في أسطح الاختيار والفحص عندما لا تكون بيانات تعريف وقت التشغيل جاهزة. |
| `description` | `string`                 | وصف قصير للقناة لأسطح الفحص والكتالوج.                               |
| `commands`    | `object`                 | افتراضيات تلقائية ثابتة للأوامر الأصلية والمهارات الأصلية لفحوصات الإعداد قبل وقت التشغيل.       |
| `preferOver`  | `string[]`               | معرّفات Plugins قديمة أو أقل أولوية يجب أن تتفوق عليها هذه القناة في أسطح الاختيار.    |

### استبدال Plugin قناة آخر

استخدم `preferOver` عندما يكون Plugin الخاص بك هو المالك المفضل لمعرّف قناة يمكن
لـ Plugin آخر توفيره أيضًا. الحالات الشائعة هي معرّف Plugin أُعيدت تسميته، أو
Plugin مستقل يحل محل Plugin مضمن، أو تفرع تتم صيانته
يبقي معرّف القناة نفسه لتوافق الإعدادات.

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

عند ضبط `channels.chat`، يأخذ OpenClaw في الحسبان كلًا من معرّف القناة
ومعرّف Plugin المفضل. إذا كان Plugin الأقل أولوية قد اختير فقط لأنه
مضمن أو مفعّل افتراضيًا، يعطّله OpenClaw في إعدادات وقت التشغيل الفعالة
بحيث يملك Plugin واحد القناة وأدواتها. يظل اختيار المستخدم الصريح هو الحاسم:
إذا فعّل المستخدم كلا Pluginين صراحةً، يحافظ OpenClaw على ذلك الاختيار
ويبلغ عن تشخيصات القنوات/الأدوات المكررة بدلًا من تغيير مجموعة Plugins المطلوبة
بصمت.

أبقِ `preferOver` محصورًا في معرّفات Plugins التي يمكنها حقًا توفير القناة نفسها.
إنه ليس حقل أولوية عامًا ولا يعيد تسمية مفاتيح إعدادات المستخدم.

## مرجع modelSupport

استخدم `modelSupport` عندما ينبغي لـ OpenClaw استنتاج Plugin الموفر الخاص بك من
معرّفات النماذج المختصرة مثل `gpt-5.5` أو `claude-sonnet-4.6` قبل تحميل وقت تشغيل
Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

يطبق OpenClaw ترتيب الأسبقية هذا:

- تستخدم مراجع `provider/model` الصريحة بيانات تعريف بيان `providers` المالكة
- تتفوق `modelPatterns` على `modelPrefixes`
- إذا تطابق Plugin غير مضمن وPlugin مضمن، يفوز Plugin غير المضمن
- تُتجاهل أي حالة غموض متبقية حتى يحدد المستخدم أو الإعدادات موفرًا

الحقول:

| الحقل           | النوع       | ما يعنيه                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | بادئات تُطابق باستخدام `startsWith` مقابل معرّفات النماذج المختصرة.                 |
| `modelPatterns` | `string[]` | مصادر Regex تُطابق مقابل معرّفات النماذج المختصرة بعد إزالة لاحقة الملف الشخصي. |

## مرجع modelCatalog

استخدم `modelCatalog` عندما ينبغي لـ OpenClaw معرفة بيانات تعريف نماذج الموفر قبل
تحميل وقت تشغيل Plugin. هذا هو المصدر المملوك للبيان لصفوف الكتالوج الثابتة،
والأسماء المستعارة للموفر، وقواعد الإخماد، ووضع الاكتشاف. لا يزال تحديث وقت التشغيل
ينتمي إلى كود وقت تشغيل الموفر، لكن البيان يخبر النواة متى يكون وقت التشغيل
مطلوبًا.

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

حقول المستوى الأعلى:

| الحقل          | النوع                                                     | ما يعنيه                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | صفوف كتالوج لمعرّفات الموفرين المملوكة لهذا Plugin. يجب أن تظهر المفاتيح أيضًا في `providers` بالمستوى الأعلى.       |
| `aliases`      | `Record<string, object>`                                 | أسماء مستعارة للموفر يجب أن تُحل إلى موفر مملوك لتخطيط الكتالوج أو الإخماد.              |
| `suppressions` | `object[]`                                               | صفوف نماذج من مصدر آخر يخمدها هذا Plugin لسبب خاص بالموفر.                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | ما إذا كان يمكن قراءة كتالوج الموفر من بيانات تعريف البيان، أو تحديثه إلى التخزين المؤقت، أو أنه يتطلب وقت التشغيل. |

يشارك `aliases` في البحث عن ملكية الموفر لتخطيط كتالوج النماذج.
يجب أن تكون أهداف الأسماء المستعارة موفرين في المستوى الأعلى مملوكين لـ Plugin نفسه. عندما تستخدم
قائمة مفلترة حسب الموفر اسمًا مستعارًا، يمكن لـ OpenClaw قراءة البيان المالك
وتطبيق تجاوزات API/عنوان URL الأساسي للاسم المستعار من دون تحميل وقت تشغيل الموفر.
لا توسّع الأسماء المستعارة قوائم الكتالوج غير المفلترة؛ إذ تصدر القوائم الواسعة صفوف
الموفر القانوني المالك فقط.

يستبدل `suppressions` خطاف وقت تشغيل الموفر القديم `suppressBuiltInModel`.
لا تُحترم إدخالات الإخماد إلا عندما يكون الموفر مملوكًا لـ Plugin أو
معلنًا كمفتاح `modelCatalog.aliases` يستهدف موفرًا مملوكًا. لم تعد
خطافات الإخماد في وقت التشغيل تُستدعى أثناء حل النماذج.

حقول الموفر:

| الحقل     | النوع                     | ما يعنيه                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | عنوان URL أساسي افتراضي اختياري للنماذج في كتالوج هذا الموفر.    |
| `api`     | `ModelApi`               | محول API افتراضي اختياري للنماذج في كتالوج هذا الموفر. |
| `headers` | `Record<string, string>` | رؤوس ثابتة اختيارية تنطبق على كتالوج هذا الموفر.      |
| `models`  | `object[]`               | صفوف النماذج المطلوبة. تُتجاهل الصفوف التي لا تحتوي على `id`.            |

حقول النموذج:

| الحقل           | النوع                                                           | معناه                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | معرّف النموذج المحلي لدى المزوّد، من دون بادئة `provider/`.                    |
| `name`          | `string`                                                       | اسم عرض اختياري.                                                      |
| `api`           | `ModelApi`                                                     | تجاوز اختياري لواجهة API على مستوى النموذج.                                            |
| `baseUrl`       | `string`                                                       | تجاوز اختياري لعنوان URL الأساسي على مستوى النموذج.                                       |
| `headers`       | `Record<string, string>`                                       | ترويسات ثابتة اختيارية على مستوى النموذج.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | الأنماط التي يقبلها النموذج.                                               |
| `reasoning`     | `boolean`                                                      | ما إذا كان النموذج يوفّر سلوك الاستدلال.                               |
| `contextWindow` | `number`                                                       | نافذة السياق الأصلية لدى المزوّد.                                             |
| `contextTokens` | `number`                                                       | حدّ سياق التشغيل الفعّال الاختياري عندما يختلف عن `contextWindow`. |
| `maxTokens`     | `number`                                                       | الحد الأقصى لرموز الإخراج عند معرفته.                                           |
| `cost`          | `object`                                                       | تسعير اختياري بالدولار الأمريكي لكل مليون رمز، بما في ذلك `tieredPricing` الاختياري. |
| `compat`        | `object`                                                       | أعلام توافق اختيارية تطابق توافق إعدادات نماذج OpenClaw.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | حالة الإدراج. لا تكبتها إلا عندما يجب ألا يظهر الصف إطلاقًا.          |
| `statusReason`  | `string`                                                       | سبب اختياري يُعرض مع الحالة غير المتاحة.                            |
| `replaces`      | `string[]`                                                     | معرّفات النماذج المحلية القديمة لدى المزوّد التي يحل هذا النموذج محلها.                       |
| `replacedBy`    | `string`                                                       | معرّف نموذج محلي بديل لدى المزوّد للصفوف المهملة.                    |
| `tags`          | `string[]`                                                     | وسوم ثابتة تستخدمها أدوات الاختيار والتصفية.                                    |

حقول الكبت:

| الحقل                      | النوع       | معناه                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | معرّف المزوّد للصف الصاعد المراد كبته. يجب أن يكون مملوكًا لهذا Plugin أو مصرّحًا به كاسم بديل مملوك. |
| `model`                    | `string`   | معرّف النموذج المحلي لدى المزوّد المراد كبته.                                                                      |
| `reason`                   | `string`   | رسالة اختيارية تُعرض عند طلب الصف المكبوت مباشرةً.                                     |
| `when.baseUrlHosts`        | `string[]` | قائمة اختيارية بمضيفي عنوان URL الأساسي الفعّال للمزوّد، وهي مطلوبة قبل تطبيق الكبت.               |
| `when.providerConfigApiIn` | `string[]` | قائمة اختيارية بقيم `api` الدقيقة في إعدادات المزوّد، وهي مطلوبة قبل تطبيق الكبت.              |

لا تضع بيانات خاصة بالتشغيل فقط في `modelCatalog`. استخدم `static` فقط عندما تكون
صفوف البيان مكتملة بما يكفي لتمكين أسطح القوائم وأدوات الاختيار المفلترة حسب المزوّد من تخطي
اكتشاف السجل/التشغيل. استخدم `refreshable` عندما تكون صفوف البيان بذورًا أو مكمّلات
قابلة للإدراج ومفيدة، لكن يمكن للتحديث/التخزين المؤقت إضافة صفوف أخرى لاحقًا؛
الصفوف القابلة للتحديث ليست مرجعية بذاتها. استخدم `runtime` عندما يجب على OpenClaw
تحميل تشغيل المزوّد لمعرفة القائمة.

## مرجع modelIdNormalization

استخدم `modelIdNormalization` لتنظيف معرّفات النماذج المملوك للمزوّد بتكلفة منخفضة، عندما يجب
أن يحدث ذلك قبل تحميل تشغيل المزوّد. يحافظ هذا على الأسماء البديلة مثل أسماء النماذج
القصيرة، ومعرّفات المزوّد المحلية القديمة، وقواعد بادئات الوكيل داخل بيان Plugin
المالك بدلًا من جداول اختيار النماذج في النواة.

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

حقول المزوّد:

| الحقل                                | النوع                    | معناه                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | أسماء بديلة دقيقة لمعرّفات النماذج غير حساسة لحالة الأحرف. تُعاد القيم كما كُتبت.                  |
| `stripPrefixes`                      | `string[]`              | بادئات تُزال قبل البحث عن الاسم البديل، وهي مفيدة لتكرار المزوّد/النموذج القديم.     |
| `prefixWhenBare`                     | `string`                | بادئة تُضاف عندما لا يحتوي معرّف النموذج المطبّع بالفعل على `/`.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | قواعد شرطية لإضافة بادئة إلى المعرّفات العارية بعد البحث عن الاسم البديل، مفهرسة بواسطة `modelPrefix` و`prefix`. |

## مرجع providerEndpoints

استخدم `providerEndpoints` لتصنيف نقاط النهاية الذي يجب أن تعرفه سياسة الطلبات العامة
قبل تحميل تشغيل المزوّد. لا تزال النواة تملك معنى كل
`endpointClass`؛ بينما تملك بيانات Plugin الوصفية الخاصة بالمضيف وعنوان URL الأساسي.

حقول نقطة النهاية:

| الحقل                          | النوع       | معناه                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | فئة نقطة نهاية معروفة للنواة، مثل `openrouter` أو `moonshot-native` أو `google-vertex`.        |
| `hosts`                        | `string[]` | أسماء المضيفين الدقيقة التي ترتبط بفئة نقطة النهاية.                                                |
| `hostSuffixes`                 | `string[]` | لواحق المضيف التي ترتبط بفئة نقطة النهاية. ابدأ بـ `.` للمطابقة الخاصة بلاحقة النطاق فقط. |
| `baseUrls`                     | `string[]` | عناوين URL أساسية HTTP(S) مطبّعة ودقيقة ترتبط بفئة نقطة النهاية.                             |
| `googleVertexRegion`           | `string`   | منطقة Google Vertex ثابتة للمضيفين العالميين الدقيقين.                                            |
| `googleVertexRegionHostSuffix` | `string`   | لاحقة تُزال من المضيفين المطابقين لكشف بادئة منطقة Google Vertex.                 |

## مرجع providerRequest

استخدم `providerRequest` لبيانات وصفية منخفضة التكلفة لتوافق الطلبات تحتاجها
سياسة الطلبات العامة من دون تحميل تشغيل المزوّد. أبقِ إعادة كتابة الحمولة الخاصة بالسلوك
في خطافات تشغيل المزوّد أو مساعدات عائلات المزوّدين المشتركة.

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

حقول المزوّد:

| الحقل                 | النوع         | معناه                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | تسمية عائلة المزوّد التي تستخدمها قرارات توافق الطلبات العامة والتشخيصات. |
| `compatibilityFamily` | `"moonshot"` | مجموعة توافق اختيارية لعائلة المزوّد لمساعدات الطلبات المشتركة.              |
| `openAICompletions`   | `object`     | أعلام طلبات الإكمال المتوافقة مع OpenAI، حاليًا `supportsStreamingUsage`.       |

## مرجع modelPricing

استخدم `modelPricing` عندما يحتاج مزوّد إلى سلوك تسعير في مستوى التحكم قبل
تحميل التشغيل. تقرأ ذاكرة تسعير Gateway المؤقتة هذه البيانات الوصفية من دون استيراد
كود تشغيل المزوّد.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

حقول المزوّد:

| الحقل        | النوع              | معناه                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | اضبطه على `false` للمزوّدين المحليين/المستضافين ذاتيًا الذين يجب ألا يجلبوا أبدًا تسعير OpenRouter أو LiteLLM. |
| `openRouter` | `false \| object` | ربط البحث عن تسعير OpenRouter. يعطّل `false` البحث في OpenRouter لهذا المزوّد.           |
| `liteLLM`    | `false \| object` | ربط البحث عن تسعير LiteLLM. يعطّل `false` البحث في LiteLLM لهذا المزوّد.                 |

حقول المصدر:

| الحقل                      | النوع               | معناه                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | معرّف مزوّد الكتالوج الخارجي عندما يختلف عن معرّف مزوّد OpenClaw، مثل `z-ai` لمزوّد `zai`. |
| `passthroughProviderModel` | `boolean`          | تعامل مع معرّفات النماذج التي تحتوي على شرطة مائلة كمراجع مزوّد/نموذج متداخلة، وهو مفيد لمزوّدي الوكيل مثل OpenRouter.       |
| `modelIdTransforms`        | `"version-dots"[]` | متغيرات إضافية لمعرّف نموذج الكتالوج الخارجي. يجرّب `version-dots` معرّفات الإصدارات المنقوطة مثل `claude-opus-4.6`.            |

### فهرس مزوّدي OpenClaw

فهرس مزوّدي OpenClaw هو بيانات وصفية تجريبية مملوكة لـ OpenClaw للمزوّدين
الذين قد لا تكون Plugins الخاصة بهم مثبتة بعد. ليس جزءًا من بيان Plugin.
تظل بيانات Plugins مرجعية Plugins المثبتة. فهرس المزوّدين هو
العقد الاحتياطي الداخلي الذي ستستهلكه مستقبلًا أسطح المزوّدين القابلين للتثبيت واختيار النماذج
قبل التثبيت عندما لا يكون Plugin المزوّد مثبتًا.

ترتيب مرجعية الكتالوج:

1. إعدادات المستخدم.
2. `modelCatalog` في بيان Plugin المثبت.
3. ذاكرة كتالوج النماذج المؤقتة من تحديث صريح.
4. صفوف المعاينة في فهرس مزوّدي OpenClaw.

يجب ألا يحتوي فهرس المزوّدين على أسرار أو حالة التفعيل أو خطّافات وقت التشغيل أو
بيانات النماذج الحية الخاصة بالحسابات. تستخدم كتالوجات المعاينة الخاصة به شكل صف
المزوّد نفسه في `modelCatalog` كما في بيانات تعريف Plugin، ولكن يجب أن تبقى
محدودة ببيانات العرض الوصفية المستقرة ما لم تتم محاذاة حقول محوّل وقت التشغيل
مثل `api` أو `baseUrl` أو التسعير أو علامات التوافق عمدًا مع بيانات تعريف
Plugin المثبّتة. يجب على المزوّدين الذين لديهم اكتشاف حي عبر `/models` كتابة
الصفوف المحدّثة عبر مسار ذاكرة التخزين المؤقت الصريح لكتالوج النماذج بدلًا من
جعل الإدراج العادي أو التهيئة يستدعي واجهات برمجة تطبيقات المزوّد.

قد تحمل إدخالات فهرس المزوّدين أيضًا بيانات وصفية لـ Plugin قابل للتثبيت
للمزوّدين الذين انتقل Plugin الخاص بهم خارج النواة أو لم يُثبّت بعد بطريقة أخرى.
تعكس هذه البيانات الوصفية نمط كتالوج القنوات: اسم الحزمة، ومواصفة تثبيت npm،
والتكامل المتوقع، وتسميات اختيار المصادقة الخفيفة كافية لإظهار خيار إعداد قابل
للتثبيت. بمجرد تثبيت Plugin، تكون الغلبة لبيانات التعريف الخاصة به ويتم تجاهل
إدخال فهرس المزوّدين لذلك المزوّد.

تم إهمال مفاتيح الإمكانات القديمة في المستوى الأعلى. استخدم `openclaw doctor --fix`
لنقل `speechProviders` و`realtimeTranscriptionProviders` و`realtimeVoiceProviders`
و`mediaUnderstandingProviders` و`imageGenerationProviders` و`videoGenerationProviders`
و`webFetchProviders` و`webSearchProviders` تحت `contracts`؛ لم يعد تحميل بيانات
التعريف العادي يعامل تلك الحقول في المستوى الأعلى كملكية للإمكانات.

## بيانات التعريف مقابل package.json

يؤدي الملفان وظيفتين مختلفتين:

| الملف                  | استخدمه من أجل                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | الاكتشاف، والتحقق من صحة الإعدادات، وبيانات اختيار المصادقة الوصفية، وتلميحات واجهة المستخدم التي يجب أن توجد قبل تشغيل كود Plugin |
| `package.json`         | بيانات npm الوصفية، وتثبيت الاعتماديات، وكتلة `openclaw` المستخدمة لنقاط الدخول، أو حجب التثبيت، أو الإعداد، أو بيانات الكتالوج الوصفية |

إذا لم تكن متأكدًا من موضع جزء من البيانات الوصفية، فاستخدم هذه القاعدة:

- إذا كان يجب على OpenClaw معرفته قبل تحميل كود Plugin، فضعه في `openclaw.plugin.json`
- إذا كان متعلقًا بالتغليف، أو ملفات الدخول، أو سلوك تثبيت npm، فضعه في `package.json`

### حقول package.json التي تؤثر في الاكتشاف

توجد بعض بيانات Plugin الوصفية قبل وقت التشغيل عمدًا في `package.json` تحت كتلة
`openclaw` بدلًا من `openclaw.plugin.json`.

أمثلة مهمة:

| الحقل                                                             | معناه                                                                                                                                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | يعلن نقاط دخول Plugin الأصلية. يجب أن يبقى داخل دليل حزمة Plugin.                                                                                              |
| `openclaw.runtimeExtensions`                                      | يعلن نقاط دخول وقت تشغيل JavaScript المبنية للحزم المثبّتة. يجب أن يبقى داخل دليل حزمة Plugin.                                                                |
| `openclaw.setupEntry`                                             | نقطة دخول خفيفة مخصصة للإعداد فقط تُستخدم أثناء التهيئة، وبدء تشغيل القناة المؤجل، وحالة القناة للقراءة فقط/اكتشاف SecretRef. يجب أن تبقى داخل دليل حزمة Plugin. |
| `openclaw.runtimeSetupEntry`                                      | يعلن نقطة دخول إعداد JavaScript المبنية للحزم المثبّتة. يجب أن يبقى داخل دليل حزمة Plugin.                                                                    |
| `openclaw.channel`                                                | بيانات وصفية خفيفة لكتالوج القنوات مثل التسميات، ومسارات الوثائق، والأسماء المستعارة، ونص الاختيار.                                                           |
| `openclaw.channel.commands`                                       | بيانات وصفية ثابتة للأوامر الأصلية والاختيار التلقائي الافتراضي للـ Skills الأصلية، تُستخدم بواسطة الإعدادات والتدقيق وأسطح قوائم الأوامر قبل تحميل وقت تشغيل القناة. |
| `openclaw.channel.configuredState`                                | بيانات وصفية خفيفة لفاحص حالة الإعداد يمكنها الإجابة عن "هل يوجد إعداد env-only بالفعل؟" دون تحميل وقت تشغيل القناة الكامل.                                    |
| `openclaw.channel.persistedAuthState`                             | بيانات وصفية خفيفة لفاحص المصادقة المحفوظة يمكنها الإجابة عن "هل يوجد أي تسجيل دخول بالفعل؟" دون تحميل وقت تشغيل القناة الكامل.                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | تلميحات التثبيت/التحديث للـ Plugins المضمّنة والمنشورة خارجيًا.                                                                                                |
| `openclaw.install.defaultChoice`                                  | مسار التثبيت المفضّل عند توفر عدة مصادر تثبيت.                                                                                                                 |
| `openclaw.install.minHostVersion`                                 | الحد الأدنى المدعوم لإصدار مضيف OpenClaw، باستخدام حد أدنى semver مثل `>=2026.3.22`.                                                                           |
| `openclaw.install.expectedIntegrity`                              | سلسلة تكامل dist المتوقعة من npm مثل `sha512-...`؛ تتحقق مسارات التثبيت والتحديث من الأثر المُجلَب مقابلها.                                                     |
| `openclaw.install.allowInvalidConfigRecovery`                     | يسمح بمسار ضيق لاسترداد إعادة تثبيت Plugin مضمّن عندما تكون الإعدادات غير صالحة.                                                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | يسمح بتحميل أسطح القنوات المخصصة للإعداد فقط قبل Plugin القناة الكامل أثناء بدء التشغيل.                                                                       |

تقرر بيانات التعريف أي اختيارات للمزوّد/القناة/الإعداد تظهر في التهيئة قبل
تحميل وقت التشغيل. تخبر `package.json#openclaw.install` التهيئة بكيفية جلب ذلك
Plugin أو تمكينه عندما يختار المستخدم أحد تلك الخيارات. لا تنقل تلميحات التثبيت
إلى `openclaw.plugin.json`.

يُفرض `openclaw.install.minHostVersion` أثناء التثبيت وتحميل سجل بيانات التعريف.
تُرفض القيم غير الصالحة؛ أما القيم الأحدث ولكن الصالحة فتتخطى Plugin على المضيفات
الأقدم.

توجد بالفعل عملية تثبيت إصدار npm الدقيق في `npmSpec`، على سبيل المثال
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. يجب أن تقرن إدخالات الكتالوج
الخارجية الرسمية المواصفات الدقيقة مع `expectedIntegrity` حتى تفشل مسارات
التحديث بشكل مغلق إذا لم يعد أثر npm المُجلَب يطابق الإصدار المثبّت. لا تزال
التهيئة التفاعلية تقدم مواصفات npm من السجل الموثوق، بما في ذلك أسماء الحزم
المجردة وdist-tags، للتوافق. يمكن لتشخيصات الكتالوج التمييز بين المصادر الدقيقة،
والعائمة، والمثبتة بالتكامل، وناقصة التكامل، وغير المطابقة لاسم الحزمة، وخيارات
الافتراضي غير الصالحة. كما تحذر عندما يكون `expectedIntegrity` موجودًا ولكن لا
يوجد مصدر npm صالح يمكنه تثبيته. عند وجود `expectedIntegrity`، تفرضه مسارات
التثبيت/التحديث؛ وعند حذفه، يُسجل حل السجل دون تثبيت تكامل.

يجب أن توفر Plugins القنوات `openclaw.setupEntry` عندما تحتاج الحالة أو قائمة
القنوات أو عمليات فحص SecretRef إلى تحديد الحسابات المهيأة دون تحميل وقت التشغيل
الكامل. يجب أن تعرض نقطة دخول الإعداد بيانات القناة الوصفية بالإضافة إلى محوّلات
الإعداد والحالة والأسرار الآمنة للإعداد؛ وأبقِ عملاء الشبكة ومستمعي Gateway
وأوقات تشغيل النقل في نقطة دخول الامتداد الرئيسية.

لا تتجاوز حقول نقاط دخول وقت التشغيل فحوصات حدود الحزمة لحقول نقطة دخول المصدر.
على سبيل المثال، لا يمكن لـ `openclaw.runtimeExtensions` جعل مسار
`openclaw.extensions` الهارب قابلًا للتحميل.

`openclaw.install.allowInvalidConfigRecovery` ضيق عمدًا. لا يجعل الإعدادات
المعطلة عشوائيًا قابلة للتثبيت. اليوم، يسمح فقط لمسارات التثبيت بالتعافي من
إخفاقات ترقية Plugin مضمّن قديمة محددة، مثل مسار Plugin مضمّن مفقود أو إدخال
`channels.<id>` قديم لذلك Plugin المضمّن نفسه. لا تزال أخطاء الإعدادات غير
المرتبطة تحجب التثبيت وتوجّه المشغلين إلى `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` هي بيانات وصفية للحزمة من أجل وحدة فاحص
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

استخدمها عندما تحتاج مسارات الإعداد أو doctor أو الحالة أو الحضور للقراءة فقط
إلى فحص مصادقة رخيص بنعم/لا قبل تحميل Plugin القناة الكامل. حالة المصادقة
المحفوظة ليست حالة قناة مهيأة: لا تستخدم هذه البيانات الوصفية لتمكين Plugins
تلقائيًا، أو إصلاح اعتماديات وقت التشغيل، أو تحديد ما إذا كان يجب تحميل وقت
تشغيل القناة. يجب أن يكون التصدير الهدف دالة صغيرة تقرأ الحالة المحفوظة فقط؛ لا
تمررها عبر barrel وقت تشغيل القناة الكامل.

يتبع `openclaw.channel.configuredState` الشكل نفسه لفحوصات الإعداد الخفيفة
env-only:

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

استخدمه عندما تستطيع قناة الإجابة عن حالة الإعداد من env أو مدخلات صغيرة أخرى
ليست من وقت التشغيل. إذا كان الفحص يحتاج إلى حل إعدادات كامل أو وقت تشغيل القناة
الحقيقي، فأبقِ ذلك المنطق في خطاف `config.hasConfiguredState` الخاص بـ Plugin
بدلًا من ذلك.

## أسبقية الاكتشاف (معرّفات Plugin المكررة)

يكتشف OpenClaw الـ Plugins من عدة جذور (المضمّنة، والتثبيت العام، ومساحة العمل، والمسارات المحددة صراحة في الإعدادات). إذا تشارك اكتشافان `id` نفسه، فيُحتفظ فقط ببيانات التعريف ذات **الأسبقية الأعلى**؛ وتُسقط التكرارات ذات الأسبقية الأدنى بدلًا من تحميلها بجانبها.

الأسبقية، من الأعلى إلى الأدنى:

1. **محدد في الإعدادات** — مسار مثبّت صراحة في `plugins.entries.<id>`
2. **مضمّن** — Plugins المشحونة مع OpenClaw
3. **تثبيت عام** — Plugins المثبّتة في جذر Plugins العام لـ OpenClaw
4. **مساحة العمل** — Plugins المكتشفة نسبةً إلى مساحة العمل الحالية

الآثار:

- لن تطغى نسخة متفرعة أو قديمة من Plugin مضمّن موجودة في مساحة العمل على البناء المضمّن.
- لتجاوز Plugin مضمّن فعليًا بآخر محلي، ثبّته عبر `plugins.entries.<id>` حتى يفوز بالأسبقية بدلًا من الاعتماد على اكتشاف مساحة العمل.
- تُسجل عمليات إسقاط التكرارات حتى يتمكن Doctor وتشخيصات بدء التشغيل من الإشارة إلى النسخة المستبعدة.

## متطلبات JSON Schema

- **يجب أن يشحن كل Plugin مخطط JSON Schema**، حتى إذا كان لا يقبل أي إعدادات.
- المخطط الفارغ مقبول (على سبيل المثال، `{ "type": "object", "additionalProperties": false }`).
- يُتحقق من صحة المخططات في وقت قراءة/كتابة الإعدادات، وليس في وقت التشغيل.

## سلوك التحقق

- مفاتيح `channels.*` غير المعروفة هي **أخطاء**، ما لم يكن معرّف القناة مصرّحًا به في
  بيان Plugin.
- يجب أن تشير `plugins.entries.<id>` و`plugins.allow` و`plugins.deny` و`plugins.slots.*`
  إلى معرّفات Plugin **قابلة للاكتشاف**. المعرّفات غير المعروفة هي **أخطاء**.
- إذا كان Plugin مثبتًا ولكن لديه بيان أو مخطط معطوب أو مفقود،
  يفشل التحقق ويبلّغ Doctor عن خطأ Plugin.
- إذا كان إعداد Plugin موجودًا ولكن Plugin **معطّل**، فسيُحتفظ بالإعداد ويتم
  إظهار **تحذير** في Doctor + السجلات.

راجع [مرجع الإعدادات](/ar/gateway/configuration) للاطلاع على مخطط `plugins.*` الكامل.

## ملاحظات

- البيان **مطلوب لـ Plugins الأصلية في OpenClaw**، بما في ذلك التحميل من نظام الملفات المحلي. لا يزال وقت التشغيل يحمّل وحدة Plugin بشكل منفصل؛ فالبيان مخصص فقط للاكتشاف + التحقق.
- تُحلّل البيانات الأصلية باستخدام JSON5، لذلك تُقبل التعليقات والفواصل اللاحقة والمفاتيح غير المقتبسة ما دامت القيمة النهائية لا تزال كائنًا.
- لا يقرأ محمّل البيان إلا حقول البيان الموثقة. تجنّب المفاتيح المخصصة في المستوى الأعلى.
- يمكن حذف `channels` و`providers` و`cliBackends` و`skills` كلها عندما لا يحتاجها Plugin.
- يجب أن يظل `providerDiscoveryEntry` خفيفًا وألا يستورد كود وقت تشغيل واسعًا؛ استخدمه لبيانات تعريف كتالوج المزوّد الثابتة أو واصفات الاكتشاف الضيقة، وليس للتنفيذ وقت الطلب.
- تُحدَّد أنواع Plugin الحصرية عبر `plugins.slots.*`: `kind: "memory"` عبر `plugins.slots.memory`، و`kind: "context-engine"` عبر `plugins.slots.contextEngine` (الافتراضي `legacy`).
- صرّح بنوع Plugin الحصري في هذا البيان. أصبح `OpenClawPluginDefinition.kind` في مدخل وقت التشغيل مهملاً ويبقى فقط كبديل توافق لـ Plugins الأقدم.
- بيانات تعريف متغيرات البيئة (`setup.providers[].envVars`، و`providerAuthEnvVars` المهملة، و`channelEnvVars`) تصريحية فقط. لا تزال الحالة والتدقيق والتحقق من تسليم cron والأسطح الأخرى للقراءة فقط تطبّق ثقة Plugin وسياسة التفعيل الفعلية قبل التعامل مع متغير بيئة على أنه مضبوط.
- لبيانات تعريف معالج وقت التشغيل التي تتطلب كود المزوّد، راجع [خطافات وقت تشغيل المزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks).
- إذا كان Plugin الخاص بك يعتمد على وحدات أصلية، فوثّق خطوات البناء وأي متطلبات لقائمة السماح في مدير الحزم (على سبيل المثال، pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## ذات صلة

<CardGroup cols={3}>
  <Card title="بناء Plugins" href="/ar/plugins/building-plugins" icon="rocket">
    البدء مع Plugins.
  </Card>
  <Card title="معمارية Plugin" href="/ar/plugins/architecture" icon="diagram-project">
    المعمارية الداخلية ونموذج القدرات.
  </Card>
  <Card title="نظرة عامة على SDK" href="/ar/plugins/sdk-overview" icon="book">
    مرجع SDK الخاص بـ Plugin واستيرادات المسارات الفرعية.
  </Card>
</CardGroup>
