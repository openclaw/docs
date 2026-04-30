---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - تحتاج إلى فهم الفرق بين setup-entry.ts و index.ts
    - أنت تُعرّف مخططات إعدادات Plugin أو بيانات openclaw الوصفية في package.json
sidebarTitle: Setup and config
summary: معالجات الإعداد، setup-entry.ts، مخططات التهيئة، وبيانات تعريف package.json
title: إعداد Plugin وتكوينه
x-i18n:
    generated_at: "2026-04-30T08:17:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع لتغليف Plugins (بيانات `package.json` الوصفية)، والبيانات الظاهرية (`openclaw.plugin.json`)، ومدخلات الإعداد، ومخططات التكوين.

<Tip>
**هل تبحث عن شرح تفصيلي؟** تغطي أدلة الكيفية التغليف ضمن السياق: [Plugins القنوات](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و[Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات الحزمة الوصفية

يحتاج ملف `package.json` لديك إلى حقل `openclaw` يخبر نظام Plugins بما يوفّره Plugin الخاص بك:

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
إذا نشرت Plugin خارجيًا على ClawHub، فحقلا `compat` و`build` مطلوبان. توجد مقتطفات النشر المرجعية في `docs/snippets/plugin-publish/`.
</Note>

### حقول `openclaw`

<ParamField path="extensions" type="string[]">
  ملفات نقطة الدخول (نسبةً إلى جذر الحزمة).
</ParamField>
<ParamField path="setupEntry" type="string">
  مدخل خفيف للإعداد فقط (اختياري).
</ParamField>
<ParamField path="channel" type="object">
  بيانات وصفية لفهرس القنوات مخصصة لأسطح الإعداد والاختيار والبدء السريع والحالة.
</ParamField>
<ParamField path="providers" type="string[]">
  معرّفات المزوّدين التي يسجلها هذا Plugin.
</ParamField>
<ParamField path="install" type="object">
  تلميحات التثبيت: `npmSpec`، و`localPath`، و`defaultChoice`، و`minHostVersion`، و`expectedIntegrity`، و`allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  علامات سلوك بدء التشغيل.
</ParamField>

### `openclaw.channel`

`openclaw.channel` هي بيانات وصفية خفيفة للحزمة لاكتشاف القنوات وأس surfaces الإعداد قبل تحميل وقت التشغيل.

| الحقل                                  | النوع      | معناه                                                                         |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | معرّف القناة المرجعي.                                                         |
| `label`                                | `string`   | تسمية القناة الأساسية.                                                        |
| `selectionLabel`                       | `string`   | تسمية المنتقي/الإعداد عندما ينبغي أن تختلف عن `label`.                        |
| `detailLabel`                          | `string`   | تسمية تفصيلية ثانوية لفهارس القنوات الأكثر ثراءً وأس surfaces الحالة.         |
| `docsPath`                             | `string`   | مسار الوثائق لروابط الإعداد والاختيار.                                        |
| `docsLabel`                            | `string`   | تسمية بديلة تُستخدم لروابط الوثائق عندما ينبغي أن تختلف عن معرّف القناة.      |
| `blurb`                                | `string`   | وصف قصير للتجهيز الأولي/الفهرس.                                               |
| `order`                                | `number`   | ترتيب الفرز في فهارس القنوات.                                                 |
| `aliases`                              | `string[]` | أسماء بديلة إضافية للبحث عند اختيار القناة.                                   |
| `preferOver`                           | `string[]` | معرّفات Plugins/قنوات ذات أولوية أدنى ينبغي أن تتفوق عليها هذه القناة.        |
| `systemImage`                          | `string`   | اسم اختياري للأيقونة/صورة النظام لفهارس واجهة القنوات.                       |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط الوثائق في أس surfaces الاختيار.                           |
| `selectionDocsOmitLabel`               | `boolean`  | إظهار مسار الوثائق مباشرةً بدل رابط وثائق ذي تسمية في نص الاختيار.           |
| `selectionExtras`                      | `string[]` | سلاسل قصيرة إضافية تُلحق بنص الاختيار.                                        |
| `markdownCapable`                      | `boolean`  | يعلّم القناة بأنها قادرة على استخدام Markdown لقرارات تنسيق الإرسال الصادر.   |
| `exposure`                             | `object`   | عناصر التحكم في ظهور القناة لأس surfaces الإعداد والقوائم المكوّنة والوثائق. |
| `quickstartAllowFrom`                  | `boolean`  | يضم هذه القناة إلى تدفق إعداد البدء السريع القياسي `allowFrom`.               |
| `forceAccountBinding`                  | `boolean`  | يتطلب ربط حساب صريحًا حتى عند وجود حساب واحد فقط.                            |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | يفضّل البحث في الجلسة عند حل أهداف الإعلان لهذه القناة.                       |

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

- `configured`: تضمين القناة في أس surfaces القوائم المكوّنة/نمط الحالة
- `setup`: تضمين القناة في منتقيات الإعداد/التكوين التفاعلية
- `docs`: وسم القناة بأنها عامة الظهور في أس surfaces الوثائق/التنقل

<Note>
ما زال `showConfigured` و`showInSetup` مدعومين كأسماء بديلة قديمة. فضّل `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` هي بيانات وصفية للحزمة، وليست بيانات وصفية للبيان الظاهري.

| الحقل                        | النوع                | معناه                                                                                   |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | مواصفة npm المرجعية لتدفقات التثبيت/التحديث.                                           |
| `localPath`                  | `string`             | مسار التطوير المحلي أو التثبيت المضمّن.                                                 |
| `defaultChoice`              | `"npm"` \| `"local"` | مصدر التثبيت المفضّل عندما يكون كلاهما متاحًا.                                         |
| `minHostVersion`             | `string`             | أدنى إصدار مدعوم من OpenClaw بالصيغة `>=x.y.z`.                                         |
| `expectedIntegrity`          | `string`             | سلسلة سلامة توزيع npm المتوقعة، عادةً `sha512-...`، للتثبيتات المثبّتة بإصدار محدد.    |
| `allowInvalidConfigRecovery` | `boolean`            | يسمح لتدفقات إعادة تثبيت Plugin المضمّن بالتعافي من إخفاقات محددة في التكوين القديم. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    يستخدم التجهيز الأولي التفاعلي أيضًا `openclaw.install` لأس surfaces التثبيت عند الطلب. إذا كان Plugin الخاص بك يعرض خيارات مصادقة المزوّد أو بيانات وصفية لإعداد/فهرس القناة قبل تحميل وقت التشغيل، فيمكن للتجهيز الأولي إظهار ذلك الخيار، والمطالبة بالاختيار بين تثبيت npm أو التثبيت المحلي، وتثبيت Plugin أو تمكينه، ثم متابعة التدفق المحدد. تتطلب اختيارات تجهيز npm الأولي بيانات وصفية موثوقة للفهرس مع `npmSpec` في السجل؛ الإصدارات الدقيقة و`expectedIntegrity` تثبيتات اختيارية. إذا كان `expectedIntegrity` موجودًا، فإن تدفقات التثبيت/التحديث تفرضه. أبقِ بيانات "ما الذي ينبغي إظهاره" الوصفية في `openclaw.plugin.json`، وبيانات "كيفية تثبيته" الوصفية في `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    إذا تم تعيين `minHostVersion`، فسيتم فرضه في كل من التثبيت وتحميل سجل البيانات الظاهرية. تتخطى المضيفات الأقدم Plugin؛ وتُرفض سلاسل الإصدارات غير الصالحة.
  </Accordion>
  <Accordion title="Pinned npm installs">
    للتثبيتات المثبّتة بإصدار محدد من npm، أبقِ الإصدار الدقيق في `npmSpec` وأضف سلامة الأثر المتوقعة:

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
    `allowInvalidConfigRecovery` ليس تجاوزًا عامًا للتكوينات المعطلة. إنه مخصص لتعافي Plugin المضمّن ضمن نطاق ضيق فقط، بحيث يمكن لإعادة التثبيت/الإعداد إصلاح بقايا ترقية معروفة مثل مسار Plugin مضمّن مفقود أو إدخال `channels.<id>` قديم لنفس Plugin. إذا كان التكوين معطلاً لأسباب غير ذات صلة، يظل التثبيت يفشل بإغلاق آمن ويطلب من المشغّل تشغيل `openclaw doctor --fix`.
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

عند تمكين ذلك، يحمّل OpenClaw `setupEntry` فقط أثناء مرحلة بدء التشغيل السابقة للاستماع، حتى للقنوات المكوّنة مسبقًا. يُحمّل المدخل الكامل بعد أن يبدأ Gateway بالاستماع.

<Warning>
لا تمكّن التحميل المؤجل إلا عندما يسجل `setupEntry` لديك كل ما يحتاجه Gateway قبل أن يبدأ بالاستماع (تسجيل القناة، ومسارات HTTP، وطرائق Gateway). إذا كان المدخل الكامل يملك قدرات بدء تشغيل مطلوبة، فأبقِ السلوك الافتراضي.
</Warning>

إذا كان مدخل الإعداد/المدخل الكامل لديك يسجل طرائق RPC في Gateway، فأبقِها على بادئة خاصة بـ Plugin. تبقى مساحات أسماء الإدارة الأساسية المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`، و`update.*`) مملوكة للنواة وتُحل دائمًا إلى `operator.admin`.

## البيان الظاهري لـ Plugin

يجب أن يشحن كل Plugin أصلي ملف `openclaw.plugin.json` في جذر الحزمة. يستخدم OpenClaw هذا للتحقق من التكوين دون تنفيذ شيفرة Plugin.

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

حتى Plugins التي لا تحتوي على تكوين يجب أن تشحن مخططًا. المخطط الفارغ صالح:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

راجع [البيان الظاهري لـ Plugin](/ar/plugins/manifest) للحصول على مرجع المخطط الكامل.

## النشر على ClawHub

بالنسبة إلى حزم Plugins، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
اسم النشر البديل القديم المخصص لـ Skills فقط مخصص لـ Skills. يجب أن تستخدم حزم Plugins دائمًا `clawhub package publish`.
</Note>

## مدخل الإعداد

ملف `setup-entry.ts` هو بديل خفيف لـ `index.ts` يحمّله OpenClaw عندما يحتاج فقط إلى أس surfaces الإعداد (التجهيز الأولي، إصلاح التكوين، فحص القناة المعطلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يتجنب هذا تحميل كود وقت التشغيل الثقيل (مكتبات التشفير، وتسجيلات CLI، وخدمات الخلفية) أثناء مسارات الإعداد.

يمكن لقنوات مساحة العمل المضمّنة التي تحتفظ بصادرات آمنة للإعداد في وحدات جانبية استخدام `defineBundledChannelSetupEntry(...)` من `openclaw/plugin-sdk/channel-entry-contract` بدلا من `defineSetupPluginEntry(...)`. يدعم ذلك العقد المضمّن أيضا تصدير `runtime` اختياري حتى يبقى توصيل وقت التشغيل في وقت الإعداد خفيفا وصريحا.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - تكون القناة معطلة لكنها تحتاج إلى أسطح إعداد/تهيئة أولية.
    - تكون القناة مفعلة لكنها غير مهيأة.
    - يكون التحميل المؤجل مفعلا (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - كائن Plugin الخاص بالقناة (عبر `defineSetupPluginEntry`).
    - أي مسارات HTTP مطلوبة قبل استماع Gateway.
    - أي طرق Gateway مطلوبة أثناء بدء التشغيل.

    ينبغي أن تظل طرق Gateway الخاصة ببدء التشغيل هذه تتجنب نطاقات إدارة النواة المحجوزة مثل `config.*` أو `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - تسجيلات CLI.
    - خدمات الخلفية.
    - استيرادات وقت تشغيل ثقيلة (التشفير، SDKs).
    - طرق Gateway المطلوبة فقط بعد بدء التشغيل.

  </Accordion>
</AccordionGroup>

### استيرادات مساعد الإعداد الضيقة

بالنسبة إلى المسارات الساخنة الخاصة بالإعداد فقط، فضّل seams مساعد الإعداد الضيقة على مظلة `plugin-sdk/setup` الأوسع عندما تحتاج فقط إلى جزء من سطح الإعداد:

| مسار الاستيراد                        | استخدمه من أجل                                                                                | الصادرات الرئيسية                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدات وقت التشغيل في وقت الإعداد التي تبقى متاحة في `setupEntry` / بدء تشغيل القناة المؤجل | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | محولات إعداد الحساب الواعية بالبيئة                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | مساعدات setup/install CLI/archive/docs                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

استخدم seam `plugin-sdk/setup` الأوسع عندما تريد صندوق أدوات الإعداد المشترك الكامل، بما في ذلك مساعدات تصحيح الإعدادات مثل `moveSingleAccountChannelSectionToDefaultAccount(...)`.

تبقى محولات تصحيح الإعداد آمنة للمسار الساخن عند الاستيراد. يكون بحثها المضمّن في سطح عقد ترقية الحساب الواحد كسولا، لذا فإن استيراد `plugin-sdk/setup-runtime` لا يحمّل اكتشاف سطح العقد المضمّن مبكرا قبل استخدام المحول فعليا.

### ترقية الحساب الواحد المملوكة للقناة

عندما ترقّي قناة من إعداد علوي ذي حساب واحد إلى `channels.<id>.accounts.*`، فإن السلوك المشترك الافتراضي هو نقل القيم ذات النطاق الحسابي التي تمت ترقيتها إلى `accounts.default`.

يمكن للقنوات المضمّنة تضييق تلك الترقية أو تجاوزها عبر سطح عقد الإعداد الخاص بها:

- `singleAccountKeysToMove`: مفاتيح علوية إضافية ينبغي نقلها إلى الحساب الذي تمت ترقيته
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل، تنتقل هذه المفاتيح فقط إلى الحساب الذي تمت ترقيته؛ وتبقى مفاتيح السياسة/التسليم المشتركة في جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختيار الحساب الحالي الذي يتلقى القيم التي تمت ترقيتها

<Note>
Matrix هو المثال المضمّن الحالي. إذا كان يوجد حساب Matrix مسمى واحد بالضبط بالفعل، أو إذا كان `defaultAccount` يشير إلى مفتاح موجود غير قانوني مثل `Ops`، فإن الترقية تحافظ على ذلك الحساب بدلا من إنشاء إدخال `accounts.default` جديد.
</Note>

## مخطط الإعدادات

تُتحقق إعدادات Plugin مقابل JSON Schema في البيان الخاص بك. يهيئ المستخدمون plugins عبر:

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

يتلقى Plugin الخاص بك هذه الإعدادات بوصفها `api.pluginConfig` أثناء التسجيل.

بالنسبة إلى الإعدادات الخاصة بالقناة، استخدم قسم إعدادات القناة بدلا من ذلك:

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

استخدم `buildChannelConfigSchema` لتحويل مخطط Zod إلى غلاف `ChannelConfigSchema` المستخدم بواسطة عناصر إعدادات مملوكة للـ Plugin:

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

بالنسبة إلى plugins التابعة لجهات خارجية، يبقى عقد المسار البارد هو بيان Plugin: انسخ JSON Schema المولّد إلى `openclaw.plugin.json#channelConfigs` حتى تتمكن أسطح مخطط الإعدادات والإعداد وواجهة المستخدم من فحص `channels.<id>` دون تحميل كود وقت التشغيل.

## معالجات الإعداد

يمكن لـ plugins القنوات توفير معالجات إعداد تفاعلية لـ `openclaw onboard`. المعالج هو كائن `ChannelSetupWizard` على `ChannelPlugin`:

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

يدعم نوع `ChannelSetupWizard` كلا من `credentials` و`textInputs` و`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` والمزيد. راجع حزم Plugin المضمّنة (على سبيل المثال Plugin الخاص بـ Discord في `src/channel.setup.ts`) للحصول على أمثلة كاملة.

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    بالنسبة إلى مطالبات قائمة السماح للرسائل المباشرة التي لا تحتاج إلا إلى المسار القياسي `note -> prompt -> parse -> merge -> patch`، فضّل مساعدات الإعداد المشتركة من `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)` و`createTopLevelChannelParsedAllowFromPrompt(...)` و`createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    بالنسبة إلى كتل حالة إعداد القناة التي تختلف فقط حسب التسميات والدرجات والأسطر الإضافية الاختيارية، فضّل `createStandardChannelSetupStatus(...)` من `openclaw/plugin-sdk/setup` بدلا من إنشاء كائن `status` نفسه يدويا في كل Plugin.
  </Accordion>
  <Accordion title="Optional channel setup surface">
    بالنسبة إلى أسطح الإعداد الاختيارية التي ينبغي أن تظهر فقط في سياقات معينة، استخدم `createOptionalChannelSetupSurface` من `openclaw/plugin-sdk/channel-setup`:

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

    يعرّض `plugin-sdk/channel-setup` أيضا البناة الأدنى مستوى `createOptionalChannelSetupAdapter(...)` و`createOptionalChannelSetupWizard(...)` عندما تحتاج فقط إلى نصف واحد من سطح التثبيت الاختياري ذلك.

    يفشل المحول/المعالج الاختياري المولّد بصورة مغلقة عند عمليات كتابة الإعدادات الحقيقية. يعيد استخدام رسالة واحدة تفيد بأن التثبيت مطلوب عبر `validateInput` و`applyAccountConfig` و`finalize`، ويضيف رابط مستندات عندما يتم تعيين `docsPath`.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    بالنسبة إلى واجهات إعداد مدعومة بملف تنفيذي ثنائي، فضّل المساعدات المفوضة المشتركة بدلا من نسخ غراء الملف الثنائي/الحالة نفسه إلى كل قناة:

    - `createDetectedBinaryStatus(...)` لكتل الحالة التي تختلف فقط حسب التسميات والتلميحات والدرجات واكتشاف الملف الثنائي
    - `createCliPathTextInput(...)` لمدخلات النص المدعومة بمسار
    - `createDelegatedSetupWizardStatusResolvers(...)` و`createDelegatedPrepare(...)` و`createDelegatedFinalize(...)` و`createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى التوجيه إلى معالج كامل أثقل بصورة كسولة
    - `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط إلى تفويض قرار `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## النشر والتثبيت

**plugins خارجية:** انشر إلى [ClawHub](/ar/tools/clawhub)، ثم ثبّت:

<Tabs>
  <Tab title="Auto (ClawHub then npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    يحاول OpenClaw استخدام ClawHub أولا ثم يعود تلقائيا إلى npm.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    استخدم npm عندما لا تكون الحزمة قد انتقلت إلى ClawHub بعد، أو عندما تحتاج إلى
    مسار تثبيت npm مباشر أثناء الترحيل:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**plugins داخل المستودع:** ضعها تحت شجرة مساحة عمل Plugin المضمّنة وسيتم اكتشافها تلقائيا أثناء البناء.

**يمكن للمستخدمين التثبيت:**

```bash
openclaw plugins install <package-name>
```

<Info>
بالنسبة إلى التثبيتات sourced من npm، يشغّل `openclaw plugins install` الأمر `npm install --ignore-scripts` المحلي للمشروع (بلا نصوص دورة حياة)، مع تجاهل إعدادات تثبيت npm العامة الموروثة. أبق أشجار اعتماد Plugin نقية من JS/TS وتجنب الحزم التي تتطلب عمليات بناء `postinstall`.
</Info>

<Note>
تُعد Plugins المجمّعة المملوكة لـ OpenClaw استثناء إصلاح بدء التشغيل الوحيد: عندما يرى تثبيت مُعبّأ واحدًا منها مفعّلًا عبر تهيئة Plugin، أو تهيئة قناة قديمة، أو بيانها المجمّع المفعّل افتراضيًا، يثبّت بدء التشغيل اعتماديات وقت التشغيل الناقصة لذلك Plugin قبل الاستيراد. يمكن للمشغّلين فحص تلك المرحلة أو إصلاحها باستخدام `openclaw plugins deps`. يجب ألا تعتمد Plugins التابعة لجهات خارجية على تثبيتات بدء التشغيل؛ واصل استخدام مثبّت Plugin الصريح.
</Note>

اعتماديات وقت التشغيل المجمّعة على مستوى الحزمة هي بيانات وصفية صريحة، ولا تُستنتج من JavaScript المبني عند بدء تشغيل Gateway. إذا كان يجب أن تتوفر اعتمادية جذر مشتركة لـ OpenClaw داخل مرآة وقت التشغيل الخارجية لـ Plugin المجمّع، فأعلن عنها في `openclaw.bundle.mirroredRootRuntimeDependencies` ضمن بيان الحزمة الجذرية.

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins) — دليل بدء تفصيلي خطوة بخطوة
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان الكامل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — `definePluginEntry` و `defineChannelPluginEntry`
