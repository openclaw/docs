---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - تحتاج إلى فهم الفرق بين setup-entry.ts و index.ts
    - أنت تعرّف مخططات إعدادات Plugin أو بيانات openclaw الوصفية في package.json
sidebarTitle: Setup and config
summary: معالجات الإعداد، setup-entry.ts، مخططات التكوين، وبيانات تعريف package.json
title: إعداد Plugin وتكوينه
x-i18n:
    generated_at: "2026-05-10T19:54:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع لتحزيم Plugin (بيانات `package.json` الوصفية)، والبيانات التعريفية (`openclaw.plugin.json`)، وإدخالات الإعداد، ومخططات التهيئة.

<Tip>
**هل تبحث عن شرح تفصيلي؟** تغطي أدلة كيفية التنفيذ التحزيم ضمن السياق: [Plugins القنوات](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و[Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات الحزمة الوصفية

يحتاج `package.json` لديك إلى حقل `openclaw` يوضّح لنظام Plugin ما يوفّره Plugin لديك:

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
  ملفات نقطة الدخول (نسبية إلى جذر الحزمة).
</ParamField>
<ParamField path="setupEntry" type="string">
  إدخال خفيف خاص بالإعداد فقط (اختياري).
</ParamField>
<ParamField path="channel" type="object">
  بيانات وصفية لفهرس القنوات لواجهات الإعداد، والاختيار، والبدء السريع، والحالة.
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

`openclaw.channel` هو بيانات وصفية خفيفة للحزمة لاكتشاف القنوات وواجهات الإعداد قبل تحميل وقت التشغيل.

| الحقل                                  | النوع      | معناه                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | معرّف القناة المعتمد.                                                         |
| `label`                                | `string`   | تسمية القناة الرئيسية.                                                        |
| `selectionLabel`                       | `string`   | تسمية أداة الاختيار/الإعداد عندما ينبغي أن تختلف عن `label`.                        |
| `detailLabel`                          | `string`   | تسمية تفاصيل ثانوية لفهارس القنوات الأكثر ثراءً وواجهات الحالة.       |
| `docsPath`                             | `string`   | مسار الوثائق لروابط الإعداد والاختيار.                                      |
| `docsLabel`                            | `string`   | تسمية بديلة تُستخدم لروابط الوثائق عندما ينبغي أن تختلف عن معرّف القناة. |
| `blurb`                                | `string`   | وصف قصير للتعريف/الفهرس.                                         |
| `order`                                | `number`   | ترتيب الفرز في فهارس القنوات.                                               |
| `aliases`                              | `string[]` | أسماء مستعارة إضافية للبحث عند اختيار القناة.                                   |
| `preferOver`                           | `string[]` | معرّفات Plugins/قنوات ذات أولوية أدنى ينبغي أن تتقدم هذه القناة عليها.                |
| `systemImage`                          | `string`   | اسم اختياري لأيقونة/صورة نظام لفهارس واجهة مستخدم القنوات.                      |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط الوثائق في واجهات الاختيار.                          |
| `selectionDocsOmitLabel`               | `boolean`  | عرض مسار الوثائق مباشرة بدلًا من رابط وثائق ذي تسمية في نص الاختيار. |
| `selectionExtras`                      | `string[]` | سلاسل قصيرة إضافية تُلحق بنص الاختيار.                               |
| `markdownCapable`                      | `boolean`  | يعلّم القناة على أنها تدعم Markdown لقرارات التنسيق الصادر.      |
| `exposure`                             | `object`   | عناصر التحكم في ظهور القناة لواجهات الإعداد، والقوائم المهيأة، والوثائق.   |
| `quickstartAllowFrom`                  | `boolean`  | يضم هذه القناة إلى مسار إعداد البدء السريع القياسي `allowFrom`.         |
| `forceAccountBinding`                  | `boolean`  | يتطلب ربط الحساب صراحة حتى عند وجود حساب واحد فقط.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | يفضّل البحث عن الجلسة عند حل أهداف الإعلان لهذه القناة.       |

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
- `setup`: تضمين القناة في أدوات اختيار الإعداد/التهيئة التفاعلية
- `docs`: تعليم القناة على أنها عامة الظهور في واجهات الوثائق/التنقل

<Note>
لا يزال `showConfigured` و`showInSetup` مدعومين كأسماء مستعارة قديمة. فضّل `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` هو بيانات وصفية للحزمة، وليس بيانات وصفية للبيان التعريفي.

| الحقل                        | النوع                               | معناه                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | مواصفة ClawHub المعتمدة لمسارات التثبيت/التحديث وتثبيت التعريف عند الطلب. |
| `npmSpec`                    | `string`                            | مواصفة npm المعتمدة لمسارات التثبيت/التحديث الاحتياطية.                             |
| `localPath`                  | `string`                            | مسار التطوير المحلي أو التثبيت المضمّن.                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | مصدر التثبيت المفضل عند توفر عدة مصادر.                     |
| `minHostVersion`             | `string`                            | أدنى إصدار OpenClaw مدعوم بالصيغة `>=x.y.z` أو `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | سلسلة سلامة توزيعة npm المتوقعة، عادةً `sha512-...`، للتثبيتات المثبتة بإصدار محدد.    |
| `allowInvalidConfigRecovery` | `boolean`                           | يتيح لمسارات إعادة تثبيت Plugin المضمّن التعافي من إخفاقات محددة في تهيئة قديمة.  |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    يستخدم التعريف التفاعلي أيضًا `openclaw.install` لواجهات التثبيت عند الطلب. إذا كان Plugin لديك يعرض خيارات مصادقة المزوّد أو بيانات وصفية لإعداد/فهرس القنوات قبل تحميل وقت التشغيل، يمكن للتعريف عرض ذلك الخيار، والمطالبة بتثبيت ClawHub أو npm أو تثبيت محلي، ثم تثبيت Plugin أو تمكينه، ثم متابعة المسار المحدد. تستخدم خيارات تعريف ClawHub `clawhubSpec` وتُفضّل عند وجودها؛ وتتطلب خيارات npm بيانات وصفية موثوقة للفهرس مع `npmSpec` للسجل؛ وتكون الإصدارات الدقيقة و`expectedIntegrity` اختيارية كتثبيتات npm مثبتة. إذا كان `expectedIntegrity` موجودًا، تفرضه مسارات التثبيت/التحديث لـ npm. أبقِ بيانات "ما الذي يجب عرضه" الوصفية في `openclaw.plugin.json` وبيانات "كيفية تثبيته" الوصفية في `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    إذا تم تعيين `minHostVersion`، فإن كلًا من التثبيت وتحميل سجل البيانات التعريفية غير المضمّن يفرضان ذلك. تتخطى المضيفات الأقدم Plugins الخارجية؛ وتُرفض سلاسل الإصدارات غير الصالحة. يُفترض أن Plugins المصدر المضمّنة متوافقة الإصدار مع نسخة عمل المضيف.
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    لا يُعد `allowInvalidConfigRecovery` تجاوزًا عامًا للتهيئات المعطلة. إنه مخصص فقط لاسترداد Plugin المضمّن ضمن نطاق ضيق، بحيث يمكن لإعادة التثبيت/الإعداد إصلاح بقايا ترقية معروفة مثل مسار Plugin مضمّن مفقود أو إدخال `channels.<id>` قديم لذلك Plugin نفسه. إذا كانت التهيئة معطلة لأسباب غير ذات صلة، يظل التثبيت يفشل بإغلاق آمن ويطلب من المشغّل تشغيل `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### التحميل الكامل المؤجل

يمكن لـ Plugins القنوات اختيار التحميل المؤجل باستخدام:

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

عند التمكين، يحمّل OpenClaw فقط `setupEntry` أثناء مرحلة بدء التشغيل السابقة للاستماع، حتى للقنوات المهيأة مسبقًا. يتم تحميل الإدخال الكامل بعد أن يبدأ Gateway بالاستماع.

<Warning>
فعّل التحميل المؤجل فقط عندما يسجّل `setupEntry` لديك كل ما يحتاجه Gateway قبل أن يبدأ بالاستماع (تسجيل القناة، ومسارات HTTP، وطرق Gateway). إذا كان الإدخال الكامل يملك قدرات بدء تشغيل مطلوبة، فاحتفظ بالسلوك الافتراضي.
</Warning>

إذا كان إدخال الإعداد/الإدخال الكامل لديك يسجّل طرق RPC في Gateway، فأبقها ضمن بادئة خاصة بـ Plugin. تظل مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`، و`update.*`) مملوكة للنواة وتُحل دائمًا إلى `operator.admin`.

## البيان التعريفي لـ Plugin

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

حتى Plugins التي لا تحتوي على تهيئة يجب أن تشحن مخططًا. المخطط الفارغ صالح:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

راجع [البيان التعريفي لـ Plugin](/ar/plugins/manifest) للاطلاع على مرجع المخطط الكامل.

## النشر على ClawHub

بالنسبة إلى حزم Plugin، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
الاسم المستعار القديم للنشر الخاص بالـ Skills فقط مخصص للـ Skills. ينبغي لحزم Plugin استخدام `clawhub package publish` دائمًا.
</Note>

## إدخال الإعداد

ملف `setup-entry.ts` هو بديل خفيف لـ `index.ts` يحمّله OpenClaw عندما يحتاج فقط إلى أسطح الإعداد (التهيئة الأولية، إصلاح الإعدادات، فحص القناة المعطّلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يتجنب هذا تحميل كود وقت التشغيل الثقيل (مكتبات التشفير، تسجيلات CLI، خدمات الخلفية) أثناء تدفقات الإعداد.

يمكن لقنوات مساحة العمل المضمّنة التي تحتفظ بتصديرات آمنة للإعداد في وحدات جانبية استخدام `defineBundledChannelSetupEntry(...)` من `openclaw/plugin-sdk/channel-entry-contract` بدلًا من `defineSetupPluginEntry(...)`. يدعم ذلك العقد المضمّن أيضًا تصدير `runtime` اختياريًا بحيث تبقى وصلات وقت التشغيل أثناء الإعداد خفيفة وصريحة.

<AccordionGroup>
  <Accordion title="متى يستخدم OpenClaw setupEntry بدلًا من الإدخال الكامل">
    - تكون القناة معطّلة لكنها تحتاج إلى أسطح الإعداد/التهيئة الأولية.
    - تكون القناة مفعّلة لكنها غير مهيأة.
    - يكون التحميل المؤجل مفعّلًا (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="ما الذي يجب أن يسجله setupEntry">
    - كائن Channel Plugin (عبر `defineSetupPluginEntry`).
    - أي مسارات HTTP مطلوبة قبل استماع Gateway.
    - أي أساليب Gateway مطلوبة أثناء بدء التشغيل.

    يجب أن تتجنب أساليب Gateway عند بدء التشغيل هذه أيضًا مساحات أسماء الإدارة الأساسية المحجوزة مثل `config.*` أو `update.*`.

  </Accordion>
  <Accordion title="ما الذي ينبغي ألا يتضمنه setupEntry">
    - تسجيلات CLI.
    - خدمات الخلفية.
    - استيرادات وقت التشغيل الثقيلة (التشفير، SDKs).
    - أساليب Gateway التي لا تكون مطلوبة إلا بعد بدء التشغيل.

  </Accordion>
</AccordionGroup>

### استيرادات مساعدي الإعداد الضيقة

بالنسبة للمسارات الساخنة الخاصة بالإعداد فقط، فضّل منافذ مساعدي الإعداد الضيقة على مظلة `plugin-sdk/setup` الأوسع عندما لا تحتاج إلا إلى جزء من سطح الإعداد:

| مسار الاستيراد                     | استخدمه من أجل                                                                            | التصديرات الرئيسية                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدو وقت التشغيل أثناء الإعداد الذين يبقون متاحين في `setupEntry` / بدء تشغيل القناة المؤجل | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | اسم مستعار متوافق مهجور؛ استخدم `plugin-sdk/setup-runtime`                                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | مساعدو CLI/الأرشيف/المستندات للإعداد/التثبيت                                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

استخدم منفذ `plugin-sdk/setup` الأوسع عندما تريد صندوق أدوات الإعداد المشترك الكامل، بما في ذلك مساعدو تصحيح الإعدادات مثل `moveSingleAccountChannelSectionToDefaultAccount(...)`.

تبقى محولات تصحيح الإعداد آمنة للمسارات الساخنة عند الاستيراد. يكون البحث في سطح عقد ترقية الحساب الواحد المضمّن كسولًا، لذلك لا يؤدي استيراد `plugin-sdk/setup-runtime` إلى تحميل اكتشاف سطح العقد المضمّن مسبقًا قبل استخدام المحول فعليًا.

### ترقية الحساب الواحد المملوكة للقناة

عندما ترقّي قناة إعدادًا علويًا ذا حساب واحد إلى `channels.<id>.accounts.*`، يكون السلوك المشترك الافتراضي هو نقل القيم المرقّاة ذات نطاق الحساب إلى `accounts.default`.

يمكن للقنوات المضمّنة تضييق تلك الترقية أو تجاوزها عبر سطح عقد الإعداد الخاص بها:

- `singleAccountKeysToMove`: مفاتيح علوية إضافية ينبغي نقلها إلى الحساب المرقّى
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل، تُنقل هذه المفاتيح فقط إلى الحساب المرقّى؛ وتبقى مفاتيح السياسة/التسليم المشتركة في جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختيار الحساب الحالي الذي يتلقى القيم المرقّاة

<Note>
Matrix هو المثال المضمّن الحالي. إذا كان هناك حساب Matrix مسمى واحد بالضبط موجود بالفعل، أو إذا كان `defaultAccount` يشير إلى مفتاح غير قياسي موجود مثل `Ops`، فإن الترقية تحتفظ بذلك الحساب بدلًا من إنشاء إدخال `accounts.default` جديد.
</Note>

## مخطط الإعدادات

يُتحقق من إعدادات Plugin مقابل JSON Schema في البيان الخاص بك. يهيئ المستخدمون Plugins عبر:

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

يتلقى Plugin هذا الإعداد باسم `api.pluginConfig` أثناء التسجيل.

بالنسبة للإعداد الخاص بالقناة، استخدم قسم إعداد القناة بدلًا من ذلك:

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

### بناء مخططات إعداد القناة

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

إذا كنت تؤلف العقد بالفعل بوصفه JSON Schema أو TypeBox، فاستخدم المساعد المباشر حتى يتمكن OpenClaw من تخطي تحويل Zod إلى JSON-Schema في مسارات البيانات الوصفية:

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

بالنسبة لـ Plugins التابعة لأطراف ثالثة، يظل عقد المسار البارد هو بيان Plugin: انسخ JSON Schema المُنشأ إلى `openclaw.plugin.json#channelConfigs` بحيث يمكن لأسطح مخطط الإعدادات، والإعداد، والواجهة فحص `channels.<id>` دون تحميل كود وقت التشغيل.

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

يدعم نوع `ChannelSetupWizard` كلًا من `credentials` و`textInputs` و`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` والمزيد. راجع حزم Plugin المضمّنة (على سبيل المثال Plugin الخاص بـ Discord في `src/channel.setup.ts`) للحصول على أمثلة كاملة.

<AccordionGroup>
  <Accordion title="مطالبات allowFrom المشتركة">
    بالنسبة لمطالبات قائمة السماح في الرسائل المباشرة التي لا تحتاج إلا إلى التدفق القياسي `note -> prompt -> parse -> merge -> patch`، فضّل مساعدي الإعداد المشتركين من `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`، و`createTopLevelChannelParsedAllowFromPrompt(...)`، و`createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="حالة إعداد القناة القياسية">
    بالنسبة لكتل حالة إعداد القناة التي لا تختلف إلا بالملصقات والدرجات والسطور الإضافية الاختيارية، فضّل `createStandardChannelSetupStatus(...)` من `openclaw/plugin-sdk/setup` بدلًا من إنشاء كائن `status` نفسه يدويًا في كل Plugin.
  </Accordion>
  <Accordion title="سطح إعداد القناة الاختياري">
    بالنسبة لأسطح الإعداد الاختيارية التي ينبغي أن تظهر فقط في سياقات معينة، استخدم `createOptionalChannelSetupSurface` من `openclaw/plugin-sdk/channel-setup`:

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

    يعرّض `plugin-sdk/channel-setup` أيضًا بنّاءي المستوى الأدنى `createOptionalChannelSetupAdapter(...)` و`createOptionalChannelSetupWizard(...)` عندما لا تحتاج إلا إلى نصف واحد من سطح التثبيت الاختياري ذلك.

    يفشل المحول/المعالج الاختياري المُنشأ بإغلاق عند عمليات كتابة الإعدادات الحقيقية. يعيدان استخدام رسالة واحدة تفيد بأن التثبيت مطلوب عبر `validateInput` و`applyAccountConfig` و`finalize`، ويضيفان رابط مستندات عندما يكون `docsPath` مضبوطًا.

  </Accordion>
  <Accordion title="مساعدو الإعداد المدعومون بملفات تنفيذية">
    بالنسبة لواجهات إعداد مدعومة بملفات تنفيذية، فضّل المساعدين المشتركين المفوضين بدلًا من نسخ غراء الملف التنفيذي/الحالة نفسه إلى كل قناة:

    - `createDetectedBinaryStatus(...)` لكتل الحالة التي لا تختلف إلا بالملصقات والتلميحات والدرجات واكتشاف الملف التنفيذي
    - `createCliPathTextInput(...)` لمدخلات النص المدعومة بمسار
    - `createDelegatedSetupWizardStatusResolvers(...)`، و`createDelegatedPrepare(...)`، و`createDelegatedFinalize(...)`، و`createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى التمرير إلى معالج كامل أثقل بشكل كسول
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

    تُثبَّت مواصفات الحزم المجردة من npm أثناء انتقال الإطلاق.

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

**Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugin المضمّنة، وسيتم اكتشافها تلقائيًا أثناء البناء.

**يمكن للمستخدمين التثبيت:**

```bash
openclaw plugins install <package-name>
```

<Info>
بالنسبة إلى عمليات التثبيت من مصدر npm، يثبّت `openclaw plugins install` الحزمة ضمن `~/.openclaw/npm` مع تعطيل سكربتات دورة الحياة. أبقِ أشجار تبعيات Plugin نقية من JS/TS وتجنب الحزم التي تتطلب عمليات بناء `postinstall`.
</Info>

<Note>
بدء تشغيل Gateway لا يثبّت تبعيات Plugin. تدفقات تثبيت npm/git/ClawHub هي المسؤولة عن تسوية التبعيات؛ ويجب أن تكون تبعيات Plugins المحلية مثبتة مسبقًا.
</Note>

بيانات تعريف الحزمة المضمّنة صريحة، وليست مستنتجة من JavaScript المبني عند بدء تشغيل Gateway. تبعيات وقت التشغيل تنتمي إلى حزمة Plugin التي تملكها؛ ولا يقوم بدء تشغيل OpenClaw المعبأ أبدًا بإصلاح تبعيات Plugin أو نسخها.

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins) — دليل بدء خطوة بخطوة
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان الكامل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — `definePluginEntry` و `defineChannelPluginEntry`
