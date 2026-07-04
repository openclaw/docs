---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - تحتاج إلى فهم setup-entry.ts مقابل index.ts
    - أنت تعرّف مخططات إعدادات Plugin أو بيانات openclaw الوصفية في package.json
sidebarTitle: Setup and config
summary: معالجات الإعداد، setup-entry.ts، مخططات التهيئة، وبيانات package.json الوصفية
title: إعداد Plugin وتكوينه
x-i18n:
    generated_at: "2026-07-04T15:21:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع لتغليف المكوّنات الإضافية (بيانات `package.json` الوصفية)، والبيانات التعريفية (`openclaw.plugin.json`)، وإدخالات الإعداد، ومخططات الإعدادات.

<Tip>
**تبحث عن شرح إرشادي؟** تغطي أدلة الكيفية التغليف ضمن السياق: [المكوّنات الإضافية للقنوات](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و[المكوّنات الإضافية للمزوّدين](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات الحزمة الوصفية

يحتاج `package.json` لديك إلى حقل `openclaw` يخبر نظام المكوّنات الإضافية بما يقدّمه المكوّن الإضافي:

<Tabs>
  <Tab title="Channel plugin">
    ```json
    {
      "name": "@myorg/openclaw-my-channel",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "my-channel",
          "label": "My Channel",
          "blurb": "Short description of the channel."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Provider plugin / ClawHub baseline">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
إذا نشرت المكوّن الإضافي خارجيًا على ClawHub، فحقلا `compat` و`build` مطلوبان. توجد مقتطفات النشر المعتمدة في `docs/snippets/plugin-publish/`.
</Note>

### حقول `openclaw`

<ParamField path="extensions" type="string[]">
  ملفات نقطة الدخول (نسبية إلى جذر الحزمة).
</ParamField>
<ParamField path="setupEntry" type="string">
  إدخال خفيف مخصص للإعداد فقط (اختياري).
</ParamField>
<ParamField path="channel" type="object">
  بيانات وصفية لفهرس القنوات لأسطح الإعداد والاختيار والبدء السريع والحالة.
</ParamField>
<ParamField path="providers" type="string[]">
  معرّفات المزوّدين التي يسجلها هذا المكوّن الإضافي.
</ParamField>
<ParamField path="install" type="object">
  تلميحات التثبيت: `npmSpec` و`localPath` و`defaultChoice` و`minHostVersion` و`expectedIntegrity` و`allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  أعلام سلوك بدء التشغيل.
</ParamField>

### `openclaw.channel`

`openclaw.channel` هي بيانات وصفية خفيفة للحزمة لاكتشاف القنوات وأسح الإعداد قبل تحميل وقت التشغيل.

| الحقل                                  | النوع      | ما يعنيه                                                                        |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `id`                                   | `string`   | معرّف القناة المعتمد.                                                            |
| `label`                                | `string`   | تسمية القناة الأساسية.                                                           |
| `selectionLabel`                       | `string`   | تسمية المنتقي/الإعداد عندما ينبغي أن تختلف عن `label`.                          |
| `detailLabel`                          | `string`   | تسمية تفاصيل ثانوية لفهارس قنوات أغنى وأسح حالة.                                |
| `docsPath`                             | `string`   | مسار الوثائق لروابط الإعداد والاختيار.                                           |
| `docsLabel`                            | `string`   | تسمية بديلة تُستخدم لروابط الوثائق عندما ينبغي أن تختلف عن معرّف القناة.         |
| `blurb`                                | `string`   | وصف قصير للإعداد الأولي/الفهرس.                                                  |
| `order`                                | `number`   | ترتيب الفرز في فهارس القنوات.                                                    |
| `aliases`                              | `string[]` | أسماء مستعارة إضافية للبحث عند اختيار القناة.                                    |
| `preferOver`                           | `string[]` | معرّفات مكوّنات إضافية/قنوات أدنى أولوية ينبغي أن تتقدم عليها هذه القناة.        |
| `systemImage`                          | `string`   | اسم أيقونة/صورة نظام اختياري لفهارس واجهة القنوات.                               |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط الوثائق في أسطح الاختيار.                                     |
| `selectionDocsOmitLabel`               | `boolean`  | عرض مسار الوثائق مباشرة بدل رابط وثائق مسمّى في نص الاختيار.                     |
| `selectionExtras`                      | `string[]` | سلاسل قصيرة إضافية تُلحق في نص الاختيار.                                         |
| `markdownCapable`                      | `boolean`  | يعلّم القناة بأنها تدعم Markdown لقرارات تنسيق الرسائل الصادرة.                  |
| `exposure`                             | `object`   | عناصر التحكم في ظهور القناة لأسح الإعداد والقوائم المهيأة والوثائق.              |
| `quickstartAllowFrom`                  | `boolean`  | إدخال هذه القناة في تدفق إعداد البدء السريع القياسي `allowFrom`.                 |
| `forceAccountBinding`                  | `boolean`  | طلب ربط حساب صريح حتى عند وجود حساب واحد فقط.                                   |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | تفضيل البحث في الجلسة عند حل أهداف الإعلان لهذه القناة.                          |

مثال:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

يدعم `exposure` ما يلي:

- `configured`: تضمين القناة في أسطح القوائم المهيأة/ذات نمط الحالة
- `setup`: تضمين القناة في منتقيات الإعداد/التهيئة التفاعلية
- `docs`: تعليم القناة بأنها موجّهة للعامة في أسطح الوثائق/التنقل

<Note>
يبقى `showConfigured` و`showInSetup` مدعومين كأسماء مستعارة قديمة. فضّل `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` هي بيانات وصفية للحزمة، وليست بيانات وصفية للبيان التعريفي.

| الحقل                        | النوع                               | ما يعنيه                                                                                 |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | مواصفة ClawHub المعتمدة لتدفقات التثبيت/التحديث والتثبيت عند الطلب أثناء الإعداد الأولي. |
| `npmSpec`                    | `string`                            | مواصفة npm المعتمدة لتدفقات الرجوع الاحتياطي للتثبيت/التحديث.                            |
| `localPath`                  | `string`                            | مسار تثبيت محلي للتطوير أو مضمّن.                                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | مصدر التثبيت المفضل عند توفر مصادر متعددة.                                                |
| `minHostVersion`             | `string`                            | أقل إصدار OpenClaw مدعوم بصيغة `>=x.y.z` أو `>=x.y.z-prerelease`.                        |
| `expectedIntegrity`          | `string`                            | سلسلة تكامل حزمة npm dist المتوقعة، عادةً `sha512-...`، للتثبيتات المثبتة.               |
| `allowInvalidConfigRecovery` | `boolean`                           | يتيح لتدفقات إعادة تثبيت المكوّنات الإضافية المضمّنة التعافي من إخفاقات إعدادات قديمة محددة. |
| `requiredPlatformPackages`   | `string[]`                          | أسماء مستعارة لحزم npm خاصة بالمنصة ومطلوبة ويتم التحقق منها أثناء تثبيت npm.             |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    يستخدم الإعداد الأولي التفاعلي أيضًا `openclaw.install` لأسطح التثبيت عند الطلب. إذا عرض المكوّن الإضافي لديك خيارات مصادقة مزوّد أو بيانات وصفية لإعداد/فهرس قناة قبل تحميل وقت التشغيل، فيمكن للإعداد الأولي إظهار ذلك الخيار، وطلب ClawHub أو npm أو تثبيت محلي، ثم تثبيت المكوّن الإضافي أو تمكينه، ثم متابعة التدفق المحدد. تستخدم خيارات الإعداد الأولي عبر ClawHub `clawhubSpec` وتكون مفضلة عند وجودها؛ وتتطلب خيارات npm بيانات وصفية موثوقة للفهرس مع `npmSpec` في السجل؛ أما الإصدارات الدقيقة و`expectedIntegrity` فهي تثبيتات اختيارية لـ npm. إذا كان `expectedIntegrity` موجودًا، فإن تدفقات التثبيت/التحديث تفرضه على npm. أبقِ بيانات "ما الذي يجب عرضه" الوصفية في `openclaw.plugin.json` وبيانات "كيفية تثبيته" الوصفية في `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    إذا تم تعيين `minHostVersion`، فإن كلًا من التثبيت وتحميل سجل بيانات المكوّنات غير المضمّنة يفرضان ذلك. تتخطى المضيفات الأقدم المكوّنات الإضافية الخارجية؛ وتُرفض سلاسل الإصدارات غير الصالحة. يُفترض أن المكوّنات الإضافية المصدرية المضمّنة متوافقة الإصدار مع نسخة المضيف.
  </Accordion>
  <Accordion title="Pinned npm installs">
    للتثبيتات المثبتة عبر npm، أبقِ الإصدار الدقيق في `npmSpec` وأضف تكامل الأثر المتوقع:

    ```json
    {
      "openclaw": {
        "install": {
          "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
          "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
          "defaultChoice": "npm"
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` ليس تجاوزًا عامًا للإعدادات المعطلة. إنه مخصص فقط لتعافٍ ضيق للمكوّنات الإضافية المضمّنة، بحيث يمكن لإعادة التثبيت/الإعداد إصلاح بقايا ترقية معروفة مثل مسار مكوّن إضافي مضمّن مفقود أو إدخال `channels.<id>` قديم لذلك المكوّن الإضافي نفسه. إذا كانت الإعدادات معطلة لأسباب غير ذات صلة، يظل التثبيت يفشل بشكل مغلق ويخبر المشغّل بتشغيل `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### التحميل الكامل المؤجل

يمكن للمكوّنات الإضافية للقنوات الاشتراك في التحميل المؤجل عبر:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

عند تفعيله، يحمّل OpenClaw فقط `setupEntry` أثناء مرحلة بدء التشغيل السابقة للاستماع، حتى للقنوات المهيأة مسبقًا. يتم تحميل الإدخال الكامل بعد أن يبدأ Gateway بالاستماع.

<Warning>
فعّل التحميل المؤجل فقط عندما يسجّل `setupEntry` لديك كل ما يحتاجه Gateway قبل أن يبدأ بالاستماع (تسجيل القناة، ومسارات HTTP، وطرق Gateway). إذا كان الإدخال الكامل يملك إمكانات بدء تشغيل مطلوبة، فأبقِ السلوك الافتراضي.
</Warning>

إذا كان إدخال الإعداد/الكامل لديك يسجّل طرق Gateway RPC، فأبقِها على بادئة خاصة بالمكوّن الإضافي. تبقى مساحات أسماء إدارة النواة المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*` و`update.*`) مملوكة للنواة وتُحل دائمًا إلى `operator.admin`.

## بيان المكوّن الإضافي

يجب أن يشحن كل مكوّن إضافي أصلي ملف `openclaw.plugin.json` في جذر الحزمة. يستخدم OpenClaw هذا للتحقق من الإعدادات دون تنفيذ كود المكوّن الإضافي.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

بالنسبة إلى المكوّنات الإضافية للقنوات، أضف `kind` و`channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

حتى Plugins التي لا تحتوي على إعدادات يجب أن تشحن مخططًا. المخطط الفارغ صالح:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

راجع [بيان Plugin](/ar/plugins/manifest) للاطلاع على مرجع المخطط الكامل.

## النشر على ClawHub

بالنسبة إلى حزم Plugin، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
الاسم المستعار القديم للنشر الخاص بالمهارات فقط مخصص للمهارات. يجب أن تستخدم حزم Plugin دائمًا `clawhub package publish`.
</Note>

## مدخل الإعداد

ملف `setup-entry.ts` هو بديل خفيف لملف `index.ts` يحمّله OpenClaw عندما يحتاج فقط إلى أسطح الإعداد (التهيئة الأولية، إصلاح الإعدادات، فحص القناة المعطّلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يتجنب هذا تحميل كود وقت التشغيل الثقيل (مكتبات التشفير، تسجيلات CLI، خدمات الخلفية) أثناء تدفقات الإعداد.

يمكن لقنوات مساحة العمل المضمّنة التي تحتفظ بصادرات آمنة للإعداد في وحدات جانبية استخدام `defineBundledChannelSetupEntry(...)` من `openclaw/plugin-sdk/channel-entry-contract` بدلًا من `defineSetupPluginEntry(...)`. يدعم ذلك العقد المضمّن أيضًا تصدير `runtime` اختياريًا حتى يبقى ربط وقت التشغيل في وقت الإعداد خفيفًا وصريحًا.

<AccordionGroup>
  <Accordion title="متى يستخدم OpenClaw setupEntry بدلًا من المدخل الكامل">
    - تكون القناة معطّلة لكنها تحتاج إلى أسطح الإعداد/التهيئة الأولية.
    - تكون القناة مفعّلة لكنها غير مضبوطة.
    - يكون التحميل المؤجل مفعّلًا (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="ما الذي يجب أن يسجله setupEntry">
    - كائن Plugin القناة (عبر `defineSetupPluginEntry`).
    - أي مسارات HTTP مطلوبة قبل أن يبدأ Gateway بالاستماع.
    - أي طرائق Gateway مطلوبة أثناء بدء التشغيل.

    يجب أن تستمر طرائق Gateway الخاصة ببدء التشغيل هذه في تجنب مساحات أسماء إدارة النواة المحجوزة مثل `config.*` أو `update.*`.

  </Accordion>
  <Accordion title="ما الذي يجب ألا يتضمنه setupEntry">
    - تسجيلات CLI.
    - خدمات الخلفية.
    - استيرادات وقت تشغيل ثقيلة (التشفير، SDKs).
    - طرائق Gateway المطلوبة بعد بدء التشغيل فقط.

  </Accordion>
</AccordionGroup>

### استيرادات مساعدي الإعداد الضيقة

للمسارات الساخنة الخاصة بالإعداد فقط، فضّل وصلات مساعدي الإعداد الضيقة على المظلّة الأوسع `plugin-sdk/setup` عندما تحتاج فقط إلى جزء من سطح الإعداد:

| مسار الاستيراد                        | استخدمه من أجل                                                                                | الصادرات الرئيسية                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدي وقت التشغيل في وقت الإعداد الذين يبقون متاحين في `setupEntry` / بدء تشغيل القناة المؤجل | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | اسم مستعار مهمل للتوافق؛ استخدم `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | مساعدو CLI/الأرشيف/المستندات للإعداد/التثبيت                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

استخدم وصلة `plugin-sdk/setup` الأوسع عندما تريد صندوق أدوات الإعداد المشترك الكامل، بما في ذلك مساعدي تصحيح الإعدادات مثل `moveSingleAccountChannelSectionToDefaultAccount(...)`.

استخدم `createSetupTranslator(...)` لنسخة معالج الإعداد الثابتة. يتبع لغة معالج
CLI (`OPENCLAW_LOCALE`، ثم متغيرات لغة النظام) ويعود
إلى الإنجليزية. أبقِ نص الإعداد الخاص بـ Plugin في الكود المملوك لـ Plugin، واستخدم
مفاتيح الفهرس المشتركة فقط لتسميات الإعداد العامة، ونصوص الحالة، ونسخة إعداد
Plugin الرسمي المضمّن.

تبقى محولات تصحيح الإعداد آمنة للمسار الساخن عند الاستيراد. إن بحث سطح عقد ترقية الحساب الواحد المضمّن الخاص بها كسول، لذا فإن استيراد `plugin-sdk/setup-runtime` لا يحمّل اكتشاف سطح العقد المضمّن مسبقًا قبل استخدام المحول فعليًا.

### ترقية الحساب الواحد المملوكة للقناة

عندما ترقي قناة إعدادًا علويًا بحساب واحد إلى `channels.<id>.accounts.*`، يكون السلوك المشترك الافتراضي هو نقل القيم ذات نطاق الحساب التي تمت ترقيتها إلى `accounts.default`.

يمكن للقنوات المضمّنة تضييق تلك الترقية أو تجاوزها من خلال سطح عقد الإعداد الخاص بها:

- `singleAccountKeysToMove`: مفاتيح علوية إضافية يجب نقلها إلى الحساب الذي تمت ترقيته
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل، تُنقل هذه المفاتيح فقط إلى الحساب الذي تمت ترقيته؛ تبقى مفاتيح السياسة/التسليم المشتركة في جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختر الحساب الحالي الذي يتلقى القيم التي تمت ترقيتها

<Note>
Matrix هو المثال المضمّن الحالي. إذا كان يوجد حساب Matrix مسمى واحد بالضبط بالفعل، أو إذا كان `defaultAccount` يشير إلى مفتاح غير قياسي موجود مثل `Ops`، فإن الترقية تحافظ على ذلك الحساب بدلًا من إنشاء إدخال `accounts.default` جديد.
</Note>

## مخطط الإعدادات

تُتحقق إعدادات Plugin مقابل JSON Schema في البيان الخاص بك. يضبط المستخدمون Plugins عبر:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

يتلقى Plugin هذه الإعدادات على أنها `api.pluginConfig` أثناء التسجيل.

بالنسبة إلى الإعدادات الخاصة بالقناة، استخدم قسم إعدادات القناة بدلًا من ذلك:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### بناء مخططات إعدادات القناة

استخدم `buildChannelConfigSchema` لتحويل مخطط Zod إلى غلاف `ChannelConfigSchema` المستخدم بواسطة عناصر الإعدادات المملوكة لـ Plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

إذا كنت تؤلف العقد بالفعل كـ JSON Schema أو TypeBox، فاستخدم المساعد المباشر حتى يتمكن OpenClaw من تخطي تحويل Zod إلى JSON-Schema على مسارات البيانات الوصفية:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

بالنسبة إلى Plugins التابعة لجهات خارجية، يبقى عقد المسار البارد هو بيان Plugin: انسخ JSON Schema المولّد إلى `openclaw.plugin.json#channelConfigs` حتى تتمكن أسطح مخطط الإعدادات والإعداد وواجهة المستخدم من فحص `channels.<id>` من دون تحميل كود وقت التشغيل.

## معالجات الإعداد

يمكن لـ Plugins القنوات توفير معالجات إعداد تفاعلية لـ `openclaw onboard`. المعالج هو كائن `ChannelSetupWizard` على `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

يدعم نوع `ChannelSetupWizard` كلًا من `credentials` و`textInputs` و`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` والمزيد. راجع حزم Plugin المضمّنة (على سبيل المثال Plugin الخاص بـ Discord في `src/channel.setup.ts`) للاطلاع على أمثلة كاملة.

<AccordionGroup>
  <Accordion title="مطالبات allowFrom المشتركة">
    بالنسبة إلى مطالبات قائمة السماح للرسائل المباشرة التي تحتاج فقط إلى التدفق القياسي `note -> prompt -> parse -> merge -> patch`، فضّل مساعدي الإعداد المشتركين من `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)` و`createTopLevelChannelParsedAllowFromPrompt(...)` و`createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="حالة إعداد القناة القياسية">
    بالنسبة إلى كتل حالة إعداد القناة التي تختلف فقط بحسب التسميات والدرجات والأسطر الإضافية الاختيارية، فضّل `createStandardChannelSetupStatus(...)` من `openclaw/plugin-sdk/setup` بدلًا من إنشاء كائن `status` نفسه يدويًا في كل Plugin.
  </Accordion>
  <Accordion title="سطح إعداد القناة الاختياري">
    بالنسبة إلى أسطح الإعداد الاختيارية التي يجب أن تظهر فقط في سياقات معينة، استخدم `createOptionalChannelSetupSurface` من `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Returns { setupAdapter, setupWizard }
    ```

    يكشف `plugin-sdk/channel-setup` أيضًا عن بُناة المستوى الأدنى `createOptionalChannelSetupAdapter(...)` و`createOptionalChannelSetupWizard(...)` عندما تحتاج إلى نصف واحد فقط من سطح التثبيت الاختياري هذا.

    يفشل المحول/المعالج الاختياري المولّد بإغلاق آمن عند عمليات كتابة الإعدادات الحقيقية. يعيدان استخدام رسالة واحدة تتطلب التثبيت عبر `validateInput` و`applyAccountConfig` و`finalize`، ويضيفان رابط مستندات عندما يكون `docsPath` مضبوطًا.

  </Accordion>
  <Accordion title="مساعدو الإعداد المدعومون بملف تنفيذي">
    بالنسبة إلى واجهات إعداد المستخدم المدعومة بملف تنفيذي، فضّل المساعدين المفوّضين المشتركين بدلًا من نسخ نفس ربط الملف التنفيذي/الحالة في كل قناة:

    - `createDetectedBinaryStatus(...)` لكتل الحالة التي لا تختلف إلا في التسميات، والتلميحات، والدرجات، واكتشاف الملفات الثنائية
    - `createCliPathTextInput(...)` لمدخلات النص المدعومة بمسار
    - `createDelegatedSetupWizardStatusResolvers(...)` و`createDelegatedPrepare(...)` و`createDelegatedFinalize(...)` و`createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى التمرير إلى معالج كامل أثقل بشكل كسول
    - `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط إلى تفويض قرار `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## النشر والتثبيت

**Plugins الخارجية:** انشر إلى [ClawHub](/clawhub)، ثم ثبّت:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    تُثبَّت مواصفات الحزم المجردة من npm أثناء مرحلة الانتقال إلى الإطلاق.

  </Tab>
  <Tab title="ClawHub فقط">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="مواصفة حزمة npm">
    استخدم npm عندما لا تكون الحزمة قد انتقلت إلى ClawHub بعد، أو عندما تحتاج إلى
    مسار تثبيت npm مباشر أثناء الترحيل:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugin المضمّنة، وسيُكتشف وجودها تلقائياً أثناء البناء.

**يمكن للمستخدمين التثبيت:**

```bash
openclaw plugins install <package-name>
```

<Info>
بالنسبة إلى عمليات التثبيت من مصدر npm، يثبّت `openclaw plugins install` الحزمة في مشروع لكل Plugin ضمن `~/.openclaw/npm/projects` مع تعطيل سكربتات دورة الحياة. أبقِ أشجار تبعيات Plugin من JS/TS خالصة وتجنب الحزم التي تتطلب عمليات بناء `postinstall`.
</Info>

<Note>
لا يثبّت بدء تشغيل Gateway تبعيات Plugin. تمتلك تدفقات تثبيت npm/git/ClawHub تقارب التبعيات؛ ويجب أن تكون تبعيات Plugins المحلية مثبتة مسبقاً.
</Note>

بيانات تعريف الحزمة المضمّنة صريحة، ولا تُستنتج من JavaScript المبني عند بدء تشغيل Gateway. تنتمي تبعيات وقت التشغيل إلى حزمة Plugin التي تملكها؛ ولا يعمل بدء تشغيل OpenClaw المعبأ أبداً على إصلاح تبعيات Plugin أو نسخها.

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins) — دليل بدء خطوة بخطوة
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان الكامل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — `definePluginEntry` و`defineChannelPluginEntry`
