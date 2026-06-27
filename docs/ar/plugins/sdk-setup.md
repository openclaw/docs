---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - تحتاج إلى فهم setup-entry.ts مقابل index.ts
    - أنت تُعرّف مخططات إعدادات Plugin أو بيانات OpenClaw الوصفية في package.json
sidebarTitle: Setup and config
summary: معالجات الإعداد، وsetup-entry.ts، ومخططات التكوين، وبيانات package.json الوصفية
title: إعداد Plugin وتهيئته
x-i18n:
    generated_at: "2026-06-27T18:18:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع لتغليف Plugin (بيانات `package.json` الوصفية)، والبيانات التعريفية (`openclaw.plugin.json`)، ومدخلات الإعداد، ومخططات الإعدادات.

<Tip>
**تبحث عن شرح إرشادي؟** تغطي أدلة الكيفية التغليف ضمن السياق: [Pluginات القنوات](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و[Pluginات المزوّدين](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات الحزمة الوصفية

يحتاج `package.json` لديك إلى حقل `openclaw` يوضح لنظام Plugin ما الذي يقدمه Plugin الخاص بك:

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
إذا نشرت Plugin خارجيًا على ClawHub، فحقلا `compat` و`build` مطلوبان. توجد مقتطفات النشر المعتمدة في `docs/snippets/plugin-publish/`.
</Note>

### حقول `openclaw`

<ParamField path="extensions" type="string[]">
  ملفات نقطة الدخول (نسبةً إلى جذر الحزمة).
</ParamField>
<ParamField path="setupEntry" type="string">
  مدخل خفيف خاص بالإعداد فقط (اختياري).
</ParamField>
<ParamField path="channel" type="object">
  بيانات كتالوج القناة الوصفية لأسطح الإعداد والمنتقي والبدء السريع والحالة.
</ParamField>
<ParamField path="providers" type="string[]">
  معرّفات المزوّدين التي يسجلها هذا Plugin.
</ParamField>
<ParamField path="install" type="object">
  تلميحات التثبيت: `npmSpec`، و`localPath`، و`defaultChoice`، و`minHostVersion`، و`expectedIntegrity`، و`allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  أعلام سلوك بدء التشغيل.
</ParamField>

### `openclaw.channel`

`openclaw.channel` هي بيانات وصفية خفيفة للحزمة لاكتشاف القنوات وأسـطح الإعداد قبل تحميل وقت التشغيل.

| الحقل                                  | النوع      | معناه                                                                         |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | معرّف القناة المعتمد.                                                         |
| `label`                                | `string`   | تسمية القناة الأساسية.                                                        |
| `selectionLabel`                       | `string`   | تسمية المنتقي/الإعداد عندما ينبغي أن تختلف عن `label`.                        |
| `detailLabel`                          | `string`   | تسمية تفاصيل ثانوية لكتالوجات القنوات الأكثر تفصيلًا وأسـطح الحالة.          |
| `docsPath`                             | `string`   | مسار التوثيق لروابط الإعداد والاختيار.                                        |
| `docsLabel`                            | `string`   | تسمية بديلة تُستخدم لروابط التوثيق عندما ينبغي أن تختلف عن معرّف القناة.     |
| `blurb`                                | `string`   | وصف قصير للإعداد الأولي/الكتالوج.                                             |
| `order`                                | `number`   | ترتيب الفرز في كتالوجات القنوات.                                              |
| `aliases`                              | `string[]` | أسماء مستعارة إضافية للبحث عند اختيار القناة.                                 |
| `preferOver`                           | `string[]` | معرّفات Plugin/قناة ذات أولوية أدنى يجب أن تتقدم عليها هذه القناة.            |
| `systemImage`                          | `string`   | اسم أيقونة/صورة نظام اختياري لكتالوجات واجهة القناة.                         |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط التوثيق في أسـطح الاختيار.                                |
| `selectionDocsOmitLabel`               | `boolean`  | عرض مسار التوثيق مباشرة بدل رابط توثيق ذي تسمية في نص الاختيار.              |
| `selectionExtras`                      | `string[]` | سلاسل قصيرة إضافية تُضاف إلى نص الاختيار.                                    |
| `markdownCapable`                      | `boolean`  | يعلّم القناة باعتبارها قادرة على Markdown لقرارات التنسيق الصادر.             |
| `exposure`                             | `object`   | عناصر التحكم في ظهور القناة للإعداد والقوائم المُهيأة وأسـطح التوثيق.        |
| `quickstartAllowFrom`                  | `boolean`  | إدخال هذه القناة في تدفق إعداد البدء السريع القياسي `allowFrom`.             |
| `forceAccountBinding`                  | `boolean`  | اشتراط ربط حساب صريح حتى عند وجود حساب واحد فقط.                             |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | تفضيل البحث عن الجلسة عند حل أهداف الإعلان لهذه القناة.                      |

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

- `configured`: تضمين القناة في أسـطح القوائم ذات نمط المُهيأ/الحالة
- `setup`: تضمين القناة في منتقيات الإعداد/التهيئة التفاعلية
- `docs`: تعليم القناة باعتبارها عامة الواجهة في أسـطح التوثيق/التنقل

<Note>
يظل `showConfigured` و`showInSetup` مدعومين كأسماء مستعارة قديمة. فضّل `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` هي بيانات وصفية للحزمة، وليست بيانات وصفية للبيان التعريفي.

| الحقل                        | النوع                               | معناه                                                                            |
| ---------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | مواصفة ClawHub المعتمدة لتدفقات التثبيت/التحديث والتثبيت عند الطلب في الإعداد الأولي. |
| `npmSpec`                    | `string`                            | مواصفة npm المعتمدة لتدفقات الرجوع الاحتياطية للتثبيت/التحديث.                   |
| `localPath`                  | `string`                            | مسار التطوير المحلي أو التثبيت المضمّن.                                          |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | مصدر التثبيت المفضل عند توفر عدة مصادر.                                          |
| `minHostVersion`             | `string`                            | أدنى إصدار OpenClaw مدعوم بصيغة `>=x.y.z` أو `>=x.y.z-prerelease`.              |
| `expectedIntegrity`          | `string`                            | سلسلة سلامة توزيعة npm المتوقعة، عادةً `sha512-...`، للتثبيتات المثبتة بإصدار محدد. |
| `allowInvalidConfigRecovery` | `boolean`                           | يتيح لتدفقات إعادة تثبيت Pluginات المضمّنة التعافي من إخفاقات إعدادات قديمة محددة. |
| `requiredPlatformPackages`   | `string[]`                          | أسماء npm المستعارة المطلوبة الخاصة بالمنصة التي يتم التحقق منها أثناء تثبيت npm. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    يستخدم الإعداد الأولي التفاعلي أيضًا `openclaw.install` لأسـطح التثبيت عند الطلب. إذا كان Plugin الخاص بك يعرض اختيارات مصادقة المزوّد أو بيانات وصفية لإعداد/كتالوج القناة قبل تحميل وقت التشغيل، يمكن للإعداد الأولي عرض ذلك الاختيار، وطلب ClawHub أو npm أو التثبيت المحلي، ثم تثبيت Plugin أو تمكينه، وبعد ذلك متابعة التدفق المحدد. تستخدم اختيارات الإعداد الأولي في ClawHub `clawhubSpec` وتُفضّل عند وجودها؛ وتتطلب اختيارات npm بيانات وصفية موثوقة للكتالوج تحتوي على `npmSpec` في السجل؛ أما الإصدارات الدقيقة و`expectedIntegrity` فهي تثبيتات npm اختيارية. إذا كان `expectedIntegrity` موجودًا، تفرضه تدفقات التثبيت/التحديث على npm. أبقِ بيانات "ما الذي سيُعرض" الوصفية في `openclaw.plugin.json` وبيانات "كيفية تثبيته" الوصفية في `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    إذا تم تعيين `minHostVersion`، فإن كلًا من التثبيت وتحميل سجل البيانات التعريفية غير المضمّن يفرضانها. تتجاوز المضيفات الأقدم Pluginات الخارجية؛ وتُرفض سلاسل الإصدارات غير الصالحة. يُفترض أن Pluginات المصدر المضمّنة لها الإصدار نفسه مع نسخة المضيف.
  </Accordion>
  <Accordion title="Pinned npm installs">
    لتثبيتات npm المثبتة بإصدار محدد، أبقِ الإصدار الدقيق في `npmSpec` وأضف سلامة الأثر المتوقعة:

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
    `allowInvalidConfigRecovery` ليس تجاوزًا عامًا للإعدادات المعطوبة. إنه مخصص للتعافي الضيق في Pluginات مضمّنة فقط، بحيث يمكن لإعادة التثبيت/الإعداد إصلاح بقايا ترقيات معروفة مثل مسار Plugin مضمّن مفقود أو إدخال `channels.<id>` قديم لذلك Plugin نفسه. إذا كانت الإعدادات معطوبة لأسباب غير ذات صلة، فسيظل التثبيت يفشل بإغلاق آمن ويطلب من المشغّل تشغيل `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### التحميل الكامل المؤجل

يمكن لـ Pluginات القنوات الاشتراك في التحميل المؤجل باستخدام:

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

عند التمكين، يحمّل OpenClaw `setupEntry` فقط أثناء مرحلة بدء التشغيل السابقة للاستماع، حتى للقنوات المُهيأة مسبقًا. يتم تحميل المدخل الكامل بعد أن يبدأ Gateway الاستماع.

<Warning>
لا تمكّن التحميل المؤجل إلا عندما يسجّل `setupEntry` لديك كل ما يحتاجه Gateway قبل أن يبدأ الاستماع (تسجيل القناة، ومسارات HTTP، وطرائق Gateway). إذا كان المدخل الكامل يملك قدرات بدء تشغيل مطلوبة، فاحتفظ بالسلوك الافتراضي.
</Warning>

إذا كان مدخل الإعداد/المدخل الكامل لديك يسجّل طرائق Gateway RPC، فأبقِها على بادئة خاصة بـ Plugin. تظل مساحات أسماء إدارة النواة المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`، و`update.*`) مملوكة للنواة وتُحل دائمًا إلى `operator.admin`.

## البيان التعريفي لـ Plugin

يجب أن يشحن كل Plugin أصلي ملف `openclaw.plugin.json` في جذر الحزمة. يستخدم OpenClaw ذلك للتحقق من الإعدادات دون تنفيذ كود Plugin.

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

بالنسبة إلى Pluginات القنوات، أضف `kind` و`channels`:

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

حتى Pluginات التي لا تحتوي على إعدادات يجب أن تشحن مخططًا. المخطط الفارغ صالح:

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

لحزم Plugin، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
الاسم المستعار القديم للنشر المخصص للمهارات فقط مخصص للمهارات. يجب أن تستخدم حزم Plugin دائمًا `clawhub package publish`.
</Note>

## مدخل الإعداد

ملف `setup-entry.ts` هو بديل خفيف لملف `index.ts` يحمّله OpenClaw عندما يحتاج فقط إلى واجهات الإعداد (التهيئة الأولية، إصلاح الإعدادات، فحص القناة المعطلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يتجنب هذا تحميل كود وقت التشغيل الثقيل (مكتبات التشفير، تسجيلات CLI، خدمات الخلفية) أثناء مسارات الإعداد.

يمكن لقنوات مساحة العمل المضمّنة التي تحتفظ بصادرات آمنة للإعداد في وحدات جانبية استخدام `defineBundledChannelSetupEntry(...)` من `openclaw/plugin-sdk/channel-entry-contract` بدلًا من `defineSetupPluginEntry(...)`. يدعم ذلك العقد المضمّن أيضًا تصدير `runtime` اختياريًا بحيث يبقى توصيل وقت التشغيل في وقت الإعداد خفيفًا وصريحًا.

<AccordionGroup>
  <Accordion title="متى يستخدم OpenClaw setupEntry بدلًا من المدخل الكامل">
    - القناة معطلة لكنها تحتاج إلى واجهات الإعداد/التهيئة الأولية.
    - القناة مفعلة لكنها غير مهيأة.
    - التحميل المؤجل مفعّل (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="ما الذي يجب أن يسجله setupEntry">
    - كائن Channel Plugin (عبر `defineSetupPluginEntry`).
    - أي مسارات HTTP مطلوبة قبل استماع Gateway.
    - أي طرق Gateway مطلوبة أثناء بدء التشغيل.

    يجب أن تتجنب طرق Gateway الخاصة ببدء التشغيل هذه مع ذلك مساحات أسماء الإدارة الأساسية المحجوزة مثل `config.*` أو `update.*`.

  </Accordion>
  <Accordion title="ما الذي يجب ألا يتضمنه setupEntry">
    - تسجيلات CLI.
    - خدمات الخلفية.
    - استيرادات وقت التشغيل الثقيلة (التشفير، SDKs).
    - طرق Gateway المطلوبة فقط بعد بدء التشغيل.

  </Accordion>
</AccordionGroup>

### استيرادات مساعد الإعداد الضيقة

في المسارات الساخنة الخاصة بالإعداد فقط، فضّل وصلات مساعد الإعداد الضيقة على مظلة `plugin-sdk/setup` الأوسع عندما تحتاج إلى جزء فقط من واجهة الإعداد:

| مسار الاستيراد                        | استخدمه من أجل                                                                                | الصادرات الرئيسية                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدات وقت التشغيل وقت الإعداد التي تبقى متاحة في `setupEntry` / بدء تشغيل القناة المؤجل | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | اسم مستعار توافق مهمل؛ استخدم `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | مساعدات CLI/الأرشفة/المستندات للإعداد/التثبيت                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

استخدم وصلة `plugin-sdk/setup` الأوسع عندما تريد مجموعة أدوات الإعداد المشتركة الكاملة، بما في ذلك مساعدات تصحيح الإعدادات مثل `moveSingleAccountChannelSectionToDefaultAccount(...)`.

استخدم `createSetupTranslator(...)` لنصوص معالج الإعداد الثابتة. يتبع
لغة معالج CLI (`OPENCLAW_LOCALE`، ثم متغيرات لغة النظام) ويعود
إلى الإنجليزية. أبقِ نص الإعداد الخاص بـ Plugin داخل الكود المملوك لـ Plugin واستخدم
مفاتيح الفهرس المشتركة فقط لتسميات الإعداد الشائعة، ونصوص الحالة، ونصوص إعداد
Plugin الرسمي المضمّن.

تظل محولات تصحيح الإعداد آمنة للمسار الساخن عند الاستيراد. البحث عن واجهة عقد ترقية الحساب الواحد المضمّنة لديها كسول، لذا لا يؤدي استيراد `plugin-sdk/setup-runtime` إلى تحميل اكتشاف واجهة العقد المضمّنة مبكرًا قبل استخدام المحول فعليًا.

### ترقية الحساب الواحد المملوكة للقناة

عندما ترقي قناة من إعداد علوي بحساب واحد إلى `channels.<id>.accounts.*`، يكون السلوك المشترك الافتراضي هو نقل القيم ذات النطاق الحسابي المرقّاة إلى `accounts.default`.

يمكن للقنوات المضمّنة تضييق تلك الترقية أو تجاوزها من خلال واجهة عقد الإعداد الخاصة بها:

- `singleAccountKeysToMove`: مفاتيح علوية إضافية يجب نقلها إلى الحساب المرقّى
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل، تُنقل هذه المفاتيح فقط إلى الحساب المرقّى؛ تبقى مفاتيح السياسة/التسليم المشتركة في جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختر أي حساب موجود يتلقى القيم المرقّاة

<Note>
Matrix هو المثال المضمّن الحالي. إذا كان يوجد حساب Matrix مسمى واحد فقط بالفعل، أو إذا كان `defaultAccount` يشير إلى مفتاح غير قياسي موجود مثل `Ops`، فإن الترقية تحافظ على ذلك الحساب بدلًا من إنشاء إدخال `accounts.default` جديد.
</Note>

## مخطط الإعدادات

يتم التحقق من إعدادات Plugin مقابل JSON Schema في البيان الخاص بك. يهيئ المستخدمون Plugin عبر:

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

يتلقى Plugin هذه الإعدادات بوصفها `api.pluginConfig` أثناء التسجيل.

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

### بناء مخططات إعدادات القنوات

استخدم `buildChannelConfigSchema` لتحويل مخطط Zod إلى غلاف `ChannelConfigSchema` المستخدم بواسطة عناصر إعدادات مملوكة لـ Plugin:

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

إذا كنت تؤلف العقد بالفعل كـ JSON Schema أو TypeBox، فاستخدم المساعد المباشر كي يتمكن OpenClaw من تخطي تحويل Zod إلى JSON Schema في مسارات البيانات الوصفية:

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

بالنسبة إلى Plugins من جهات خارجية، يظل عقد المسار البارد هو بيان Plugin: انسخ JSON Schema المولّد إلى `openclaw.plugin.json#channelConfigs` بحيث تستطيع واجهات مخطط الإعدادات، والإعداد، وUI فحص `channels.<id>` دون تحميل كود وقت التشغيل.

## معالجات الإعداد

يمكن لـ Channel Plugins توفير معالجات إعداد تفاعلية لـ `openclaw onboard`. المعالج هو كائن `ChannelSetupWizard` على `ChannelPlugin`:

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

يدعم نوع `ChannelSetupWizard` كلًا من `credentials`، و`textInputs`، و`dmPolicy`، و`allowFrom`، و`groupAccess`، و`prepare`، و`finalize`، والمزيد. راجع حزم Plugin المضمّنة (مثل Discord Plugin في `src/channel.setup.ts`) للحصول على أمثلة كاملة.

<AccordionGroup>
  <Accordion title="مطالبات allowFrom المشتركة">
    بالنسبة إلى مطالبات قائمة سماح الرسائل المباشرة التي لا تحتاج إلا إلى تدفق `note -> prompt -> parse -> merge -> patch` القياسي، فضّل مساعدات الإعداد المشتركة من `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`، و`createTopLevelChannelParsedAllowFromPrompt(...)`، و`createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="حالة إعداد القناة القياسية">
    بالنسبة إلى كتل حالة إعداد القناة التي تختلف فقط في التسميات، والدرجات، والأسطر الإضافية الاختيارية، فضّل `createStandardChannelSetupStatus(...)` من `openclaw/plugin-sdk/setup` بدلًا من إنشاء كائن `status` نفسه يدويًا في كل Plugin.
  </Accordion>
  <Accordion title="واجهة إعداد القناة الاختيارية">
    بالنسبة إلى واجهات الإعداد الاختيارية التي يجب أن تظهر فقط في سياقات معينة، استخدم `createOptionalChannelSetupSurface` من `openclaw/plugin-sdk/channel-setup`:

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

    يعرّض `plugin-sdk/channel-setup` أيضًا بانيي المستوى الأدنى `createOptionalChannelSetupAdapter(...)` و`createOptionalChannelSetupWizard(...)` عندما تحتاج إلى نصف واحد فقط من واجهة التثبيت الاختيارية تلك.

    يفشل المحول/المعالج الاختياري المولّد بشكل مغلق عند عمليات كتابة الإعدادات الحقيقية. يعيدان استخدام رسالة واحدة تفيد بأن التثبيت مطلوب عبر `validateInput`، و`applyAccountConfig`، و`finalize`، ويضيفان رابط مستندات عندما يكون `docsPath` مضبوطًا.

  </Accordion>
  <Accordion title="مساعدات الإعداد المدعومة بملفات ثنائية">
    بالنسبة إلى واجهات إعداد UI المدعومة بملفات ثنائية، فضّل المساعدات المفوضة المشتركة بدلًا من نسخ ربط الملف الثنائي/الحالة نفسه في كل قناة:

    - `createDetectedBinaryStatus(...)` لكتل الحالة التي تختلف فقط في التسميات، والتلميحات، والدرجات، واكتشاف الملف الثنائي
    - `createCliPathTextInput(...)` لمدخلات النص المدعومة بمسار
    - `createDelegatedSetupWizardStatusResolvers(...)`، و`createDelegatedPrepare(...)`، و`createDelegatedFinalize(...)`، و`createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى إعادة التوجيه إلى معالج كامل أثقل بشكل كسول
    - `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط إلى تفويض قرار `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## النشر والتثبيت

**Plugins الخارجية:** انشر إلى [ClawHub](/ar/clawhub)، ثم ثبّت:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    تثبّت مواصفات الحزم المجرّدة من npm أثناء انتقال الإطلاق.

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

**Plugins داخل المستودع:** ضعها تحت شجرة مساحة عمل Plugin المضمّنة، وسيتم اكتشافها تلقائيًا أثناء البناء.

**يمكن للمستخدمين التثبيت:**

```bash
openclaw plugins install <package-name>
```

<Info>
بالنسبة إلى التثبيتات sourced من npm، يثبّت `openclaw plugins install` الحزمة في مشروع مخصّص لكل Plugin تحت `~/.openclaw/npm/projects` مع تعطيل سكربتات دورة الحياة. أبقِ أشجار تبعيات Plugin نقية من JS/TS وتجنّب الحزم التي تتطلب عمليات بناء `postinstall`.
</Info>

<Note>
لا يثبّت بدء تشغيل Gateway تبعيات Plugin. تمتلك تدفقات تثبيت npm/git/ClawHub تقارب التبعيات؛ ويجب أن تكون تبعيات Plugins المحلية مثبّتة مسبقًا.
</Note>

بيانات تعريف الحزمة المضمّنة صريحة، ولا تُستنتج من JavaScript المبني عند بدء تشغيل Gateway. تنتمي تبعيات وقت التشغيل إلى حزمة Plugin التي تملكها؛ ولا يقوم بدء تشغيل OpenClaw المحزّم أبدًا بإصلاح تبعيات Plugin أو عكسها.

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins) — دليل بدء خطوة بخطوة
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان الكامل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — `definePluginEntry` و `defineChannelPluginEntry`
