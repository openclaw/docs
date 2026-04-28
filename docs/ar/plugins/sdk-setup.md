---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - تحتاج إلى فهم الفرق بين `setup-entry.ts` و`index.ts`
    - أنت تعرّف مخططات إعدادات Plugin أو بيانات OpenClaw الوصفية في `package.json`
sidebarTitle: Setup and config
summary: معالجات الإعداد، و`setup-entry.ts`، ومخططات الإعدادات، وبيانات `package.json` الوصفية
title: إعداد Plugin وتهيئتها
x-i18n:
    generated_at: "2026-04-26T11:37:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

مرجع لتغليف Plugin ‏(بيانات `package.json` الوصفية)، وmanifest ‏(`openclaw.plugin.json`)، وsetup entries، ومخططات الإعدادات.

<Tip>
**هل تبحث عن شرح تطبيقي؟** تغطي أدلة how-to التغليف ضمن السياق: [Channel plugins](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و[Provider plugins](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات الحزمة الوصفية

يحتاج `package.json` الخاص بك إلى حقل `openclaw` يخبر نظام Plugins بما الذي يقدمه Plugin الخاص بك:

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
  <Tab title="Provider plugin / خط أساس ClawHub">
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
إذا كنت ستنشر Plugin خارجيًا على ClawHub، فستكون الحقول `compat` و`build` مطلوبة. وتوجد مقتطفات النشر القياسية في `docs/snippets/plugin-publish/`.
</Note>

### حقول `openclaw`

<ParamField path="extensions" type="string[]">
  ملفات نقطة الدخول (نسبية إلى جذر الحزمة).
</ParamField>
<ParamField path="setupEntry" type="string">
  نقطة دخول خفيفة للإعداد فقط (اختيارية).
</ParamField>
<ParamField path="channel" type="object">
  بيانات وصفية لفهرس القنوات لاستخدامها في الإعداد، وأداة الاختيار، والبدء السريع، وأس surfaces الحالة.
</ParamField>
<ParamField path="providers" type="string[]">
  معرّفات providers التي يسجلها هذا Plugin.
</ParamField>
<ParamField path="install" type="object">
  تلميحات التثبيت: `npmSpec` و`localPath` و`defaultChoice` و`minHostVersion` و`expectedIntegrity` و`allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  علامات سلوك بدء التشغيل.
</ParamField>

### `openclaw.channel`

إن `openclaw.channel` عبارة عن بيانات package وصفية خفيفة لاكتشاف القنوات وأس surfaces الإعداد قبل تحميل runtime.

| الحقل                                  | النوع      | ما الذي يعنيه                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | معرّف القناة القياسي.                                                         |
| `label`                                | `string`   | التسمية الأساسية للقناة.                                                      |
| `selectionLabel`                       | `string`   | تسمية أداة الاختيار/الإعداد عندما ينبغي أن تختلف عن `label`.                  |
| `detailLabel`                          | `string`   | تسمية تفصيلية ثانوية لفهارس القنوات الغنية وأس surfaces الحالة.               |
| `docsPath`                             | `string`   | مسار التوثيق لروابط الإعداد والاختيار.                                         |
| `docsLabel`                            | `string`   | تسمية تجاوز تُستخدم في روابط التوثيق عندما ينبغي أن تختلف عن معرّف القناة.    |
| `blurb`                                | `string`   | وصف قصير للإعداد الأوّلي/الفهرس.                                              |
| `order`                                | `number`   | ترتيب الفرز في فهارس القنوات.                                                 |
| `aliases`                              | `string[]` | أسماء مستعارة إضافية للبحث لاختيار القناة.                                     |
| `preferOver`                           | `string[]` | معرّفات Plugins/قنوات أقل أولوية ينبغي أن تتغلب هذه القناة عليها.            |
| `systemImage`                          | `string`   | اسم اختياري للأيقونة/صورة النظام لفهارس واجهات القنوات.                       |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط التوثيق في أس surfaces الاختيار.                           |
| `selectionDocsOmitLabel`               | `boolean`  | اعرض مسار التوثيق مباشرةً بدلًا من رابط موثق معنّون في نص الاختيار.           |
| `selectionExtras`                      | `string[]` | سلاسل قصيرة إضافية تُلحَق في نص الاختيار.                                      |
| `markdownCapable`                      | `boolean`  | يعلّم القناة على أنها تدعم Markdown لقرارات التنسيق الصادر.                    |
| `exposure`                             | `object`   | عناصر تحكم في ظهور القناة لأس surfaces الإعداد، والقوائم المهيأة، والتوثيق.    |
| `quickstartAllowFrom`                  | `boolean`  | يشرك هذه القناة في تدفق الإعداد القياسي `allowFrom` للبدء السريع.             |
| `forceAccountBinding`                  | `boolean`  | يفرض ربط حساب صريح حتى عند وجود حساب واحد فقط.                                |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | يفضّل lookup الجلسة عند حل أهداف announce لهذه القناة.                        |

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

- `configured`: تضمين القناة في أس surfaces القوائم المهيأة/الحالة
- `setup`: تضمين القناة في أدوات الاختيار التفاعلية للإعداد/التهيئة
- `docs`: تعليم القناة على أنها موجهة للجمهور في أس surfaces التوثيق/التنقل

<Note>
لا يزال `showConfigured` و`showInSetup` مدعومين كأسماء مستعارة قديمة. ويفضّل استخدام `exposure`.
</Note>

### `openclaw.install`

إن `openclaw.install` عبارة عن بيانات package وصفية، وليست بيانات manifest وصفية.

| الحقل                        | النوع                 | ما الذي يعنيه                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | مواصفة npm القياسية لتدفقات التثبيت/التحديث.                                     |
| `localPath`                  | `string`             | مسار التثبيت المحلي للتطوير أو المسار المضمّن.                                   |
| `defaultChoice`              | `"npm"` \| `"local"` | مصدر التثبيت المفضل عندما يكون كلاهما متاحًا.                                    |
| `minHostVersion`             | `string`             | الحد الأدنى لإصدار OpenClaw المدعوم بصيغة `>=x.y.z`.                             |
| `expectedIntegrity`          | `string`             | سلسلة التكامل المتوقعة من npm dist، وعادةً `sha512-...`، للتثبيتات المثبّتة.      |
| `allowInvalidConfigRecovery` | `boolean`            | يسمح لتدفقات إعادة تثبيت الـ Plugin المضمّنة بالتعافي من بعض إخفاقات الإعدادات القديمة. |

<AccordionGroup>
  <Accordion title="سلوك الإعداد الأوّلي">
    يستخدم الإعداد الأوّلي التفاعلي أيضًا `openclaw.install` لأس surfaces التثبيت عند الطلب. وإذا كان Plugin الخاص بك يعرّض خيارات مصادقة provider أو بيانات وصفية لإعداد/فهرسة القنوات قبل تحميل runtime، فيمكن للإعداد الأوّلي إظهار ذلك الخيار، ثم طلب npm أو local install، ثم تثبيت Plugin أو تفعيله، ثم متابعة التدفق المحدد. تتطلب خيارات الإعداد الأوّلي عبر npm بيانات وصفية موثوقة من الفهرس مع `npmSpec` من السجل؛ وتُعد الإصدارات الدقيقة و`expectedIntegrity` تثبيتات اختيارية. وإذا كانت `expectedIntegrity` موجودة، فإن تدفقات التثبيت/التحديث تفرضها. أبقِ البيانات الوصفية الخاصة بـ "ما الذي يجب عرضه" في `openclaw.plugin.json`، والبيانات الخاصة بـ "كيفية تثبيته" في `package.json`.
  </Accordion>
  <Accordion title="فرض minHostVersion">
    إذا كانت `minHostVersion` مضبوطة، فإن كلًا من التثبيت وتحميل سجل manifest يفرضانها. وتتخطى المضيفات الأقدم هذا Plugin؛ وتُرفض سلاسل الإصدارات غير الصالحة.
  </Accordion>
  <Accordion title="تثبيتات npm المثبّتة">
    بالنسبة إلى تثبيتات npm المثبّتة، احتفظ بالإصدار الدقيق في `npmSpec` وأضف تكامل artifact المتوقع:

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
    إن `allowInvalidConfigRecovery` ليس تجاوزًا عامًا للإعدادات المعطلة. بل هو مخصص لتعافٍ ضيق النطاق لPlugins المضمّنة فقط، بحيث يمكن لإعادة التثبيت/الإعداد إصلاح بقايا ترقيات معروفة مثل غياب مسار Plugin مضمّنة أو إدخال `channels.<id>` قديم يخص Plugin نفسها. وإذا كانت الإعدادات معطلة لأسباب غير مرتبطة، فإن التثبيت لا يزال يفشل بشكل مغلق ويطلب من المشغّل تشغيل `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### التحميل المؤجل الكامل

يمكن لقنوات Plugins تفعيل التحميل المؤجل عبر:

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

عند التفعيل، يحمّل OpenClaw فقط `setupEntry` خلال مرحلة بدء التشغيل السابقة للاستماع، حتى بالنسبة إلى القنوات المهيأة بالفعل. ثم يُحمّل الإدخال الكامل بعد أن يبدأ gateway في الاستماع.

<Warning>
فعّل التحميل المؤجل فقط عندما يسجّل `setupEntry` لديك كل ما يحتاجه gateway قبل أن يبدأ الاستماع (تسجيل القناة، ومسارات HTTP، وطرق gateway). وإذا كان الإدخال الكامل يملك قدرات مطلوبة عند بدء التشغيل، فأبقِ السلوك الافتراضي.
</Warning>

إذا كان إدخال الإعداد/الإدخال الكامل لديك يسجل طرق Gateway RPC، فأبقها ضمن بادئة خاصة بالـ Plugin. تظل مجالات أسماء الإدارة الأساسية المحجوزة (`config.*` و`exec.approvals.*` و`wizard.*` و`update.*`) مملوكة للـ core وتُحل دائمًا إلى `operator.admin`.

## Plugin manifest

يجب أن تأتي كل Plugin أصلية بملف `openclaw.plugin.json` في جذر الحزمة. ويستخدم OpenClaw هذا للتحقق من الإعدادات من دون تنفيذ كود Plugin.

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

بالنسبة إلى Channel plugins، أضف `kind` و`channels`:

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

حتى Plugins التي لا تحتوي على إعدادات يجب أن تأتي مع schema. ويكون schema الفارغ صالحًا:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

راجع [Plugin manifest](/ar/plugins/manifest) للاطلاع على مرجع المخطط الكامل.

## النشر على ClawHub

بالنسبة إلى حزم Plugin، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
إن الاسم المستعار القديم للنشر المخصص للـ Skills فقط هو للـ Skills. أما حزم Plugins فينبغي أن تستخدم دائمًا `clawhub package publish`.
</Note>

## Setup entry

إن الملف `setup-entry.ts` بديل خفيف عن `index.ts` يحمّله OpenClaw عندما يحتاج فقط إلى أس surfaces الإعداد (الإعداد الأوّلي، وإصلاح الإعدادات، وفحص القنوات المعطلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يتجنب هذا تحميل كود runtime ثقيل (مكتبات التشفير، وتسجيلات CLI، والخدمات الخلفية) أثناء تدفقات الإعداد.

يمكن لقنوات مساحة العمل المضمّنة التي تحتفظ بعمليات تصدير آمنة للإعداد في وحدات sidecar استخدام `defineBundledChannelSetupEntry(...)` من `openclaw/plugin-sdk/channel-entry-contract` بدلًا من `defineSetupPluginEntry(...)`. ويدعم هذا العقد المضمّن أيضًا عملية تصدير `runtime` اختيارية بحيث يبقى ربط runtime وقت الإعداد خفيفًا وصريحًا.

<AccordionGroup>
  <Accordion title="متى يستخدم OpenClaw ‏setupEntry بدلًا من الإدخال الكامل">
    - تكون القناة معطلة لكنها تحتاج إلى أس surfaces الإعداد/الإعداد الأوّلي.
    - تكون القناة مفعلة لكنها غير مهيأة.
    - يكون التحميل المؤجل مفعّلًا (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="ما الذي يجب أن يسجله setupEntry">
    - كائن Channel plugin ‏(عبر `defineSetupPluginEntry`).
    - أي مسارات HTTP مطلوبة قبل استماع gateway.
    - أي طرق gateway مطلوبة أثناء بدء التشغيل.

    ولا ينبغي لطرق gateway الخاصة ببدء التشغيل هذه أن تستخدم مجالات أسماء الإدارة الأساسية المحجوزة مثل `config.*` أو `update.*`.

  </Accordion>
  <Accordion title="ما الذي ينبغي ألا يتضمنه setupEntry">
    - تسجيلات CLI.
    - الخدمات الخلفية.
    - واردات runtime الثقيلة (التشفير، وSDKs).
    - طرق gateway المطلوبة فقط بعد بدء التشغيل.

  </Accordion>
</AccordionGroup>

### واردات ضيقة لمساعدات الإعداد

بالنسبة إلى المسارات الساخنة الخاصة بالإعداد فقط، فضّل نقاط الوصل الضيقة لمساعدات الإعداد بدلًا من المظلّة الأوسع `plugin-sdk/setup` عندما تحتاج فقط إلى جزء من سطح الإعداد:

| مسار الاستيراد                     | استخدمه من أجل                                                                         | أهم عمليات التصدير                                                                                                                                                                                                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدات runtime وقت الإعداد التي تبقى متاحة في `setupEntry` / بدء التشغيل المؤجل للقناة | `createPatchedAccountSetupAdapter` و`createEnvPatchedAccountSetupAdapter` و`createSetupInputPresenceValidator` و`noteChannelLookupFailure` و`noteChannelLookupSummary` و`promptResolvedAllowFrom` و`splitSetupEntries` و`createAllowlistSetupWizardProxy` و`createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | محولات إعداد الحساب الواعية بالبيئة                                                   | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | مساعدات CLI/الأرشيف/التوثيق الخاصة بالإعداد/التثبيت                                   | `formatCliCommand` و`detectBinary` و`extractArchive` و`resolveBrewExecutable` و`formatDocsLink` و`CONFIG_DIR`                                                                                                                                                                                |

استخدم نقطة الوصل الأوسع `plugin-sdk/setup` عندما تريد صندوق أدوات الإعداد المشترك الكامل، بما في ذلك مساعدات patch الخاصة بالإعدادات مثل `moveSingleAccountChannelSectionToDefaultAccount(...)`.

تظل محولات patch الخاصة بالإعداد آمنة للمسار الساخن عند الاستيراد. ويكون lookup الخاص بسطح عقد الترقية للحساب الواحد المضمّن كسولًا، لذا فإن استيراد `plugin-sdk/setup-runtime` لا يحمّل على نحو eager عملية اكتشاف سطح العقد المضمّن قبل استخدام المحول فعليًا.

### الترقية المملوكة للقناة من حساب واحد

عندما تُرقّي قناة ما من إعدادات top-level ذات حساب واحد إلى `channels.<id>.accounts.*`، يكون السلوك المشترك الافتراضي هو نقل القيم المروَّجة ذات نطاق الحساب إلى `accounts.default`.

يمكن للقنوات المضمّنة تضييق أو تجاوز هذه الترقية عبر سطح عقد الإعداد الخاص بها:

- `singleAccountKeysToMove`: مفاتيح top-level إضافية ينبغي نقلها إلى الحساب المروَّج
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل، لا تُنقل إلى الحساب المروَّج إلا هذه المفاتيح؛ أما مفاتيح السياسة/التسليم المشتركة فتبقى عند جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختر أي حساب موجود سيتلقى القيم المروَّجة

<Note>
Matrix هو المثال المضمّن الحالي. فإذا كان هناك حساب Matrix واحد فقط مسمى موجود بالفعل، أو إذا كانت `defaultAccount` تشير إلى مفتاح غير قياسي موجود مثل `Ops`، فإن الترقية تحافظ على ذلك الحساب بدلًا من إنشاء إدخال جديد `accounts.default`.
</Note>

## Config schema

يتم التحقق من إعدادات Plugin مقابل JSON Schema الموجودة في manifest الخاصة بك. ويقوم المستخدمون بتهيئة Plugins عبر:

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

أما بالنسبة إلى إعدادات القنوات الخاصة، فاستخدم قسم إعدادات القناة بدلًا من ذلك:

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

استخدم `buildChannelConfigSchema` لتحويل مخطط Zod إلى الغلاف `ChannelConfigSchema` المستخدم بواسطة عناصر الإعدادات المملوكة للـ Plugin:

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

بالنسبة إلى Plugins الجهات الخارجية، لا يزال العقد الخاص بالمسار البارد هو manifest الخاصة بالـ Plugin: اعكس JSON Schema المولّدة إلى `openclaw.plugin.json#channelConfigs` بحيث يمكن لأس surfaces الإعدادات، والإعداد، والواجهة أن تفحص `channels.<id>` من دون تحميل كود runtime.

## معالجات الإعداد

يمكن لـ Channel plugins توفير معالجات إعداد تفاعلية لـ `openclaw onboard`. والمعالج هو كائن `ChannelSetupWizard` على `ChannelPlugin`:

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

يدعم النوع `ChannelSetupWizard` الحقول `credentials` و`textInputs` و`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` وغير ذلك. راجع حزم Plugins المضمّنة (مثل Plugin Discord في `src/channel.setup.ts`) للحصول على أمثلة كاملة.

<AccordionGroup>
  <Accordion title="مطالبات allowFrom المشتركة">
    بالنسبة إلى مطالبات allowlist للرسائل الخاصة التي تحتاج فقط إلى التدفق القياسي `note -> prompt -> parse -> merge -> patch`، فضّل مساعدات الإعداد المشتركة من `openclaw/plugin-sdk/setup`: ‏`createPromptParsedAllowFromForAccount(...)` و`createTopLevelChannelParsedAllowFromPrompt(...)` و`createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="حالة إعداد القناة القياسية">
    بالنسبة إلى كتل حالة إعداد القناة التي لا تختلف إلا في labels، والدرجات، والأسطر الإضافية الاختيارية، فضّل `createStandardChannelSetupStatus(...)` من `openclaw/plugin-sdk/setup` بدلًا من بناء كائن `status` نفسه يدويًا في كل Plugin.
  </Accordion>
  <Accordion title="سطح إعداد قناة اختياري">
    بالنسبة إلى أس surfaces الإعداد الاختيارية التي ينبغي ألا تظهر إلا في سياقات معينة، استخدم `createOptionalChannelSetupSurface` من `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // تُعيد { setupAdapter, setupWizard }
    ```

    كما يعرّض `plugin-sdk/channel-setup` البانيين الأقل مستوى `createOptionalChannelSetupAdapter(...)` و`createOptionalChannelSetupWizard(...)` عندما تحتاج فقط إلى أحد نصفي ذلك السطح الاختياري للتثبيت.

    يفشل المحول/المعالج الاختياري المُولَّد بشكل مغلق عند عمليات كتابة الإعدادات الفعلية. وهو يعيد استخدام رسالة واحدة تفيد بضرورة التثبيت عبر `validateInput` و`applyAccountConfig` و`finalize`، ويضيف رابط توثيق عندما تكون `docsPath` مضبوطة.

  </Accordion>
  <Accordion title="مساعدات الإعداد المدعومة بالثنائيات">
    بالنسبة إلى واجهات الإعداد المدعومة ببرامج ثنائية، فضّل المساعدات المشتركة المفوَّضة بدلًا من نسخ المنطق نفسه الخاص بالثنائي/الحالة في كل قناة:

    - `createDetectedBinaryStatus(...)` لكتل الحالة التي تختلف فقط في labels، والتلميحات، والدرجات، واكتشاف الثنائي
    - `createCliPathTextInput(...)` لمدخلات النص المدعومة بالمسار
    - `createDelegatedSetupWizardStatusResolvers(...)` و`createDelegatedPrepare(...)` و`createDelegatedFinalize(...)` و`createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى التمرير إلى معالج كامل أثقل بشكل كسول
    - `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط إلى تفويض قرار `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## النشر والتثبيت

**Plugins الخارجية:** انشر على [ClawHub](/ar/tools/clawhub) أو npm، ثم ثبّت:

<Tabs>
  <Tab title="تلقائي (ClawHub ثم npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    يحاول OpenClaw استخدام ClawHub أولًا ثم يعود تلقائيًا إلى npm.

  </Tab>
  <Tab title="ClawHub فقط">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="مواصفة حزمة npm">
    لا يوجد تجاوز مطابق باسم `npm:`. استخدم مواصفة حزمة npm العادية عندما تريد مسار npm بعد fallback من ClawHub:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugins داخل المستودع:** ضعها تحت شجرة مساحة العمل الخاصة بالـ Plugin المضمّنة وسيتم اكتشافها تلقائيًا أثناء البناء.

**يمكن للمستخدمين التثبيت:**

```bash
openclaw plugins install <package-name>
```

<Info>
بالنسبة إلى التثبيتات القادمة من npm، يشغّل `openclaw plugins install` الأمر المحلي بالمشروع `npm install --ignore-scripts` ‏(من دون lifecycle scripts)، مع تجاهل إعدادات تثبيت npm العامة الموروثة. أبقِ أشجار تبعيات Plugin خاصة بك في JS/TS خالصة وتجنب الحزم التي تتطلب build في `postinstall`.
</Info>

<Note>
إن الاستثناء الوحيد لإصلاح بدء التشغيل يخص Plugins المضمّنة والمملوكة لـ OpenClaw: فعندما يرى تثبيت مُعبأ واحدًا منها مفعّلًا عبر إعدادات Plugin، أو إعدادات قناة قديمة، أو manifest مضمّنة ذات تفعيل افتراضي، يقوم بدء التشغيل بتثبيت تبعيات runtime المفقودة لذلك Plugin قبل الاستيراد. أما Plugins الجهات الخارجية فلا ينبغي أن تعتمد على التثبيت عند بدء التشغيل؛ بل واصل استخدام مُثبّت Plugin الصريح.
</Note>

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins) — دليل بدء خطوة بخطوة
- [Plugin manifest](/ar/plugins/manifest) — مرجع مخطط manifest الكامل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — ‏`definePluginEntry` و`defineChannelPluginEntry`
