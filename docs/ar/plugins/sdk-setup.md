---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - عليك فهم الفرق بين setup-entry.ts و index.ts
    - أنت تعرّف مخططات تكوين Plugin أو بيانات openclaw الوصفية في package.json
sidebarTitle: Setup and config
summary: معالجات الإعداد، setup-entry.ts، مخططات التكوين، وبيانات package.json الوصفية
title: إعداد Plugin وتكوينه
x-i18n:
    generated_at: "2026-05-02T07:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع لتحزيم Plugin (بيانات تعريف `package.json`)، وملفات البيان (`openclaw.plugin.json`)، وإدخالات الإعداد، ومخططات التهيئة.

<Tip>
**هل تبحث عن شرح تفصيلي؟** تغطي أدلة الكيفية التحزيم ضمن السياق: [Plugins القنوات](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و[Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات تعريف الحزمة

يحتاج `package.json` إلى حقل `openclaw` يوضح لنظام Plugin ما يوفّره Plugin الخاص بك:

<Tabs>
  <Tab title="Plugin قناة">
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
  <Tab title="Plugin مزوّد / أساس ClawHub">
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
  ملفات نقطة الدخول (نسبية إلى جذر الحزمة).
</ParamField>
<ParamField path="setupEntry" type="string">
  إدخال خفيف مخصص للإعداد فقط (اختياري).
</ParamField>
<ParamField path="channel" type="object">
  بيانات تعريف فهرس القناة للإعداد، والمنتقي، والبدء السريع، وواجهات الحالة.
</ParamField>
<ParamField path="providers" type="string[]">
  معرّفات المزوّدين التي يسجلها هذا Plugin.
</ParamField>
<ParamField path="install" type="object">
  تلميحات التثبيت: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  رايات سلوك بدء التشغيل.
</ParamField>

### `openclaw.channel`

`openclaw.channel` هي بيانات تعريف حزمة خفيفة لاكتشاف القنوات وواجهات الإعداد قبل تحميل وقت التشغيل.

| الحقل                                  | النوع      | معناه                                                                         |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | معرّف القناة المعتمد.                                                         |
| `label`                                | `string`   | تسمية القناة الأساسية.                                                        |
| `selectionLabel`                       | `string`   | تسمية المنتقي/الإعداد عندما ينبغي أن تختلف عن `label`.                        |
| `detailLabel`                          | `string`   | تسمية تفاصيل ثانوية لفهارس القنوات الأكثر ثراءً وواجهات الحالة.               |
| `docsPath`                             | `string`   | مسار التوثيق لروابط الإعداد والاختيار.                                        |
| `docsLabel`                            | `string`   | تجاوز التسمية المستخدمة لروابط التوثيق عندما ينبغي أن تختلف عن معرّف القناة. |
| `blurb`                                | `string`   | وصف قصير للتعريف الأولي/الفهرس.                                               |
| `order`                                | `number`   | ترتيب الفرز في فهارس القنوات.                                                 |
| `aliases`                              | `string[]` | أسماء مستعارة إضافية للبحث عند اختيار القناة.                                |
| `preferOver`                           | `string[]` | معرّفات Plugin/قناة ذات أولوية أدنى ينبغي أن تتفوق عليها هذه القناة.          |
| `systemImage`                          | `string`   | اسم أيقونة/صورة نظام اختياري لفهارس واجهة مستخدم القنوات.                    |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط التوثيق في واجهات الاختيار.                               |
| `selectionDocsOmitLabel`               | `boolean`  | عرض مسار التوثيق مباشرة بدلًا من رابط توثيق ذي تسمية في نص الاختيار.         |
| `selectionExtras`                      | `string[]` | سلاسل قصيرة إضافية تُلحق بنص الاختيار.                                       |
| `markdownCapable`                      | `boolean`  | يعلّم القناة على أنها قادرة على Markdown لقرارات تنسيق الرسائل الصادرة.       |
| `exposure`                             | `object`   | عناصر التحكم في ظهور القناة لواجهات الإعداد والقوائم المهيأة والتوثيق.       |
| `quickstartAllowFrom`                  | `boolean`  | إدراج هذه القناة في تدفق إعداد البدء السريع القياسي `allowFrom`.             |
| `forceAccountBinding`                  | `boolean`  | طلب ربط حساب صريح حتى عند وجود حساب واحد فقط.                                |
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

- `configured`: تضمين القناة في واجهات القوائم المهيأة/ذات نمط الحالة
- `setup`: تضمين القناة في منتقيات الإعداد/التهيئة التفاعلية
- `docs`: تعليم القناة على أنها عامة الظهور في واجهات التوثيق/التنقل

<Note>
يظل `showConfigured` و`showInSetup` مدعومين كأسماء مستعارة قديمة. فضّل `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` هي بيانات تعريف حزمة، وليست بيانات تعريف بيان.

| الحقل                        | النوع                | معناه                                                                             |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | مواصفة npm المعتمدة لتدفقات التثبيت/التحديث.                                     |
| `localPath`                  | `string`             | مسار التطوير المحلي أو التثبيت المضمّن.                                          |
| `defaultChoice`              | `"npm"` \| `"local"` | مصدر التثبيت المفضل عندما يكون كلاهما متاحًا.                                    |
| `minHostVersion`             | `string`             | أدنى إصدار OpenClaw مدعوم بالصيغة `>=x.y.z` أو `>=x.y.z-prerelease`.             |
| `expectedIntegrity`          | `string`             | سلسلة سلامة توزيع npm المتوقعة، عادةً `sha512-...`، للتثبيتات المثبتة بإصدار محدد. |
| `allowInvalidConfigRecovery` | `boolean`            | يسمح لتدفقات إعادة تثبيت Plugin المضمّن بالتعافي من إخفاقات محددة لتهيئة قديمة. |

<AccordionGroup>
  <Accordion title="سلوك التعريف الأولي">
    يستخدم التعريف الأولي التفاعلي أيضًا `openclaw.install` لواجهات التثبيت عند الطلب. إذا عرض Plugin الخاص بك خيارات مصادقة المزوّد أو بيانات تعريف إعداد/فهرس القناة قبل تحميل وقت التشغيل، فيمكن للتعريف الأولي عرض ذلك الخيار، وطلب الاختيار بين تثبيت npm أو المحلي، وتثبيت Plugin أو تمكينه، ثم متابعة التدفق المحدد. تتطلب خيارات التعريف الأولي عبر npm بيانات تعريف فهرس موثوقة مع `npmSpec` في السجل؛ الإصدارات الدقيقة و`expectedIntegrity` تثبيتات اختيارية. إذا كان `expectedIntegrity` موجودًا، فإن تدفقات التثبيت/التحديث تفرضه. احتفظ ببيانات تعريف "ما الذي يُعرض" في `openclaw.plugin.json` وبيانات تعريف "كيفية تثبيته" في `package.json`.
  </Accordion>
  <Accordion title="فرض minHostVersion">
    إذا تم تعيين `minHostVersion`، فإن كلًا من التثبيت وتحميل سجلّ بيانات البيان غير المضمّنة يفرضانها. تتخطى المضيفات الأقدم Plugins الخارجية؛ وتُرفض سلاسل الإصدارات غير الصالحة. تُفترض Plugins المصدر المضمّنة أنها متوافقة الإصدار مع نسخة المضيف.
  </Accordion>
  <Accordion title="تثبيتات npm المثبتة بإصدار محدد">
    بالنسبة إلى تثبيتات npm المثبتة بإصدار محدد، احتفظ بالإصدار الدقيق في `npmSpec` وأضف سلامة الأثر المتوقعة:

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
  <Accordion title="نطاق allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` ليس تجاوزًا عامًا للتهيئات المعطلة. إنه مخصص لتعافٍ ضيق لـ Plugin مضمّن فقط، بحيث يمكن لإعادة التثبيت/الإعداد إصلاح بقايا ترقية معروفة مثل مسار Plugin مضمّن مفقود أو إدخال قديم `channels.<id>` لذلك Plugin نفسه. إذا كانت التهيئة معطلة لأسباب غير ذات صلة، فسيظل التثبيت يفشل بشكل مغلق ويطلب من المشغّل تشغيل `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### التحميل الكامل المؤجل

يمكن لـ Plugins القنوات الاشتراك في التحميل المؤجل باستخدام:

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

عند تمكينه، يحمّل OpenClaw فقط `setupEntry` أثناء مرحلة بدء التشغيل السابقة للاستماع، حتى للقنوات المهيأة مسبقًا. يُحمّل الإدخال الكامل بعد أن يبدأ Gateway الاستماع.

<Warning>
لا تمكّن التحميل المؤجل إلا عندما يسجل `setupEntry` لديك كل ما يحتاج إليه Gateway قبل أن يبدأ الاستماع (تسجيل القناة، ومسارات HTTP، وطرائق Gateway). إذا كان الإدخال الكامل يمتلك قدرات بدء تشغيل مطلوبة، فأبقِ السلوك الافتراضي.
</Warning>

إذا كان إدخال الإعداد/الإدخال الكامل لديك يسجل طرائق RPC في Gateway، فأبقها ضمن بادئة خاصة بـ Plugin. تظل مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) مملوكة للنواة وتُحل دائمًا إلى `operator.admin`.

## بيان Plugin

يجب أن يشحن كل Plugin أصلي ملف `openclaw.plugin.json` في جذر الحزمة. يستخدم OpenClaw هذا الملف للتحقق من التهيئة دون تنفيذ كود Plugin.

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

بالنسبة إلى Plugins القنوات، أضف `kind` و`channels`:

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

حتى Plugins التي لا تملك تهيئة يجب أن تشحن مخططًا. المخطط الفارغ صالح:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

راجع [بيان Plugin](/ar/plugins/manifest) للحصول على مرجع المخطط الكامل.

## النشر على ClawHub

لحزم Plugin، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
الاسم المستعار القديم للنشر المخصص لـ Skills فقط مخصص لـ Skills. يجب أن تستخدم حزم Plugin دائمًا `clawhub package publish`.
</Note>

## إدخال الإعداد

يعد ملف `setup-entry.ts` بديلا خفيفا لـ `index.ts` يحمّله OpenClaw عندما يحتاج فقط إلى أسطح الإعداد (التهيئة الأولية، إصلاح الإعدادات، فحص القناة المعطلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يتجنب هذا تحميل شيفرة وقت التشغيل الثقيلة (مكتبات التشفير، تسجيلات CLI، خدمات الخلفية) أثناء تدفقات الإعداد.

يمكن لقنوات مساحة العمل المضمنة التي تحتفظ بتصديرات آمنة للإعداد في وحدات جانبية استخدام `defineBundledChannelSetupEntry(...)` من `openclaw/plugin-sdk/channel-entry-contract` بدلا من `defineSetupPluginEntry(...)`. يدعم ذلك العقد المضمن أيضا تصدير `runtime` اختياري حتى تبقى توصيلات وقت التشغيل في وقت الإعداد خفيفة وصريحة.

<AccordionGroup>
  <Accordion title="متى يستخدم OpenClaw setupEntry بدلا من نقطة الدخول الكاملة">
    - تكون القناة معطلة لكنها تحتاج إلى أسطح الإعداد/التهيئة الأولية.
    - تكون القناة مفعلة لكنها غير مهيأة.
    - يكون التحميل المؤجل مفعلا (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="ما الذي يجب أن يسجله setupEntry">
    - كائن Plugin الخاص بالقناة (عبر `defineSetupPluginEntry`).
    - أي مسارات HTTP مطلوبة قبل بدء استماع Gateway.
    - أي طرائق Gateway مطلوبة أثناء بدء التشغيل.

    يجب أن تستمر طرائق Gateway الخاصة ببدء التشغيل هذه في تجنب مساحات أسماء الإدارة الأساسية المحجوزة مثل `config.*` أو `update.*`.

  </Accordion>
  <Accordion title="ما الذي يجب ألا يتضمنه setupEntry">
    - تسجيلات CLI.
    - خدمات الخلفية.
    - استيرادات وقت التشغيل الثقيلة (التشفير، SDKs).
    - طرائق Gateway التي لا تلزم إلا بعد بدء التشغيل.

  </Accordion>
</AccordionGroup>

### استيرادات مساعدي الإعداد الضيقة

للمسارات الساخنة الخاصة بالإعداد فقط، فضّل فواصل مساعدي الإعداد الضيقة على المظلة الأوسع `plugin-sdk/setup` عندما تحتاج إلى جزء فقط من سطح الإعداد:

| مسار الاستيراد                        | استخدمه من أجل                                                                                | التصديرات الأساسية                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدو وقت التشغيل في وقت الإعداد الذين يبقون متاحين في `setupEntry` / بدء تشغيل القناة المؤجل | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | محولات إعداد الحساب الواعية بالبيئة                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | مساعدو إعداد/تثبيت CLI/الأرشيف/المستندات                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

استخدم فاصل `plugin-sdk/setup` الأوسع عندما تريد صندوق أدوات الإعداد المشترك الكامل، بما في ذلك مساعدي رقع الإعدادات مثل `moveSingleAccountChannelSectionToDefaultAccount(...)`.

تبقى محولات رقع الإعداد آمنة للمسار الساخن عند الاستيراد. يكون بحث سطح عقد ترقية الحساب الواحد المضمن فيها كسولا، لذلك لا يؤدي استيراد `plugin-sdk/setup-runtime` إلى تحميل اكتشاف سطح العقد المضمن مسبقا قبل استخدام المحول فعليا.

### ترقية الحساب الواحد المملوكة للقناة

عندما ترقي قناة إعدادات المستوى الأعلى ذات الحساب الواحد إلى `channels.<id>.accounts.*`، يكون السلوك المشترك الافتراضي هو نقل القيم المرقاة ذات نطاق الحساب إلى `accounts.default`.

يمكن للقنوات المضمنة تضييق تلك الترقية أو تجاوزها من خلال سطح عقد الإعداد الخاص بها:

- `singleAccountKeysToMove`: مفاتيح إضافية من المستوى الأعلى يجب نقلها إلى الحساب المرقى
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل، تنتقل هذه المفاتيح فقط إلى الحساب المرقى؛ وتبقى مفاتيح السياسة/التسليم المشتركة عند جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختيار الحساب الموجود الذي يتلقى القيم المرقاة

<Note>
Matrix هو المثال المضمن الحالي. إذا كان هناك حساب Matrix مسمى واحد بالضبط موجود بالفعل، أو إذا كان `defaultAccount` يشير إلى مفتاح غير قياسي موجود مثل `Ops`، فإن الترقية تحافظ على ذلك الحساب بدلا من إنشاء إدخال `accounts.default` جديد.
</Note>

## مخطط الإعدادات

يتم التحقق من إعدادات Plugin مقابل JSON Schema في البيان الخاص بك. يهيئ المستخدمون Plugins عبر:

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

يتلقى Plugin الخاص بك هذه الإعدادات على هيئة `api.pluginConfig` أثناء التسجيل.

للإعدادات الخاصة بالقناة، استخدم قسم إعدادات القناة بدلا من ذلك:

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

استخدم `buildChannelConfigSchema` لتحويل مخطط Zod إلى غلاف `ChannelConfigSchema` المستخدم بواسطة آثار الإعدادات المملوكة لـ Plugin:

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

بالنسبة إلى Plugins التابعة لأطراف ثالثة، يظل عقد المسار البارد هو بيان Plugin: اعكس JSON Schema المولد في `openclaw.plugin.json#channelConfigs` حتى تتمكن أسطح مخطط الإعدادات والإعداد وواجهة المستخدم من فحص `channels.<id>` دون تحميل شيفرة وقت التشغيل.

## معالجات الإعداد

يمكن لـ Plugins الخاصة بالقنوات توفير معالجات إعداد تفاعلية لـ `openclaw onboard`. المعالج هو كائن `ChannelSetupWizard` على `ChannelPlugin`:

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

يدعم النوع `ChannelSetupWizard` كلا من `credentials` و`textInputs` و`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` والمزيد. راجع حزم Plugins المضمنة (على سبيل المثال Plugin الخاص بـ Discord في `src/channel.setup.ts`) للحصول على أمثلة كاملة.

<AccordionGroup>
  <Accordion title="مطالبات allowFrom المشتركة">
    بالنسبة إلى مطالبات قائمة السماح للرسائل المباشرة التي لا تحتاج إلا إلى تدفق `note -> prompt -> parse -> merge -> patch` القياسي، فضّل مساعدي الإعداد المشتركين من `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)` و`createTopLevelChannelParsedAllowFromPrompt(...)` و`createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="حالة إعداد القناة القياسية">
    بالنسبة إلى كتل حالة إعداد القناة التي تختلف فقط بحسب التسميات والدرجات والأسطر الإضافية الاختيارية، فضّل `createStandardChannelSetupStatus(...)` من `openclaw/plugin-sdk/setup` بدلا من إنشاء كائن `status` نفسه يدويا في كل Plugin.
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

    يعرّض `plugin-sdk/channel-setup` أيضا البانيين ذوي المستوى الأدنى `createOptionalChannelSetupAdapter(...)` و`createOptionalChannelSetupWizard(...)` عندما تحتاج إلى نصف واحد فقط من سطح التثبيت الاختياري ذلك.

    يفشل المحول/المعالج الاختياري المولد بشكل مغلق عند عمليات كتابة الإعدادات الحقيقية. يعيدان استخدام رسالة واحدة تفيد بوجوب التثبيت عبر `validateInput` و`applyAccountConfig` و`finalize`، ويضيفان رابط مستندات عندما يكون `docsPath` مضبوطا.

  </Accordion>
  <Accordion title="مساعدو الإعداد المدعومون بملف تنفيذي">
    بالنسبة إلى واجهات إعداد مدعومة بملف تنفيذي، فضّل المساعدين المفوضين المشتركين بدلا من نسخ لاصق الملف التنفيذي/الحالة نفسه إلى كل قناة:

    - `createDetectedBinaryStatus(...)` لكتل الحالة التي تختلف فقط بحسب التسميات والتلميحات والدرجات واكتشاف الملف التنفيذي
    - `createCliPathTextInput(...)` لمدخلات النص المدعومة بمسار
    - `createDelegatedSetupWizardStatusResolvers(...)` و`createDelegatedPrepare(...)` و`createDelegatedFinalize(...)` و`createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى التمرير إلى معالج كامل أثقل بشكل كسول
    - `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط إلى تفويض قرار `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## النشر والتثبيت

**Plugins الخارجية:** انشر إلى [ClawHub](/ar/tools/clawhub)، ثم ثبّت:

<Tabs>
  <Tab title="تلقائي (ClawHub ثم npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    يجرب OpenClaw ‏ClawHub أولا ويتراجع إلى npm تلقائيا.

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

**Plugins داخل المستودع:** ضعها تحت شجرة مساحة عمل Plugin المضمنة وسيتم اكتشافها تلقائيا أثناء البناء.

**يمكن للمستخدمين التثبيت:**

```bash
openclaw plugins install <package-name>
```

<Info>
بالنسبة إلى التثبيتات المستندة إلى npm، يثبت `openclaw plugins install` الحزمة تحت `~/.openclaw/npm` مع تعطيل نصوص دورة الحياة. أبق أشجار اعتماديات Plugin نقية من JS/TS وتجنب الحزم التي تتطلب بنايات `postinstall`.
</Info>

<Note>
لا يثبت بدء تشغيل Gateway اعتماديات Plugin. تمتلك تدفقات تثبيت npm/git/ClawHub تقارب الاعتماديات؛ ويجب أن تكون اعتماديات Plugins المحلية مثبتة مسبقا.
</Note>

تكون بيانات تعريف الحزمة المضمّنة صريحة، ولا تُستنتج من JavaScript المبني عند بدء تشغيل Gateway. تنتمي تبعيات وقت التشغيل إلى حزمة Plugin التي تملكها؛ ولا يقوم بدء تشغيل OpenClaw المعبأ بإصلاح تبعيات Plugin أو عكسها مطلقًا.

## ذات صلة

- [إنشاء Plugins](/ar/plugins/building-plugins) — دليل بدء تدريجي خطوة بخطوة
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان الكامل
- [نقاط إدخال SDK](/ar/plugins/sdk-entrypoints) — `definePluginEntry` و`defineChannelPluginEntry`
