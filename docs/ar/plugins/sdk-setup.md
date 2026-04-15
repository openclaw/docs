---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - تحتاج إلى فهم `setup-entry.ts` مقابل `index.ts`
    - أنت تعرّف مخططات تكوين Plugin أو بيانات تعريف `openclaw` في `package.json`
sidebarTitle: Setup and Config
summary: معالجات الإعداد، `setup-entry.ts`، مخططات التكوين، وبيانات التعريف في `package.json`
title: إعداد Plugin والتكوين
x-i18n:
    generated_at: "2026-04-15T19:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf28e25e381a4a38ac478e531586f59612e1a278732597375f87c2eeefc521b
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# إعداد Plugin والتكوين

مرجع لتغليف Plugin (بيانات تعريف `package.json`)، وملفات البيان
(`openclaw.plugin.json`)، ومداخل الإعداد، ومخططات التكوين.

<Tip>
  **هل تبحث عن شرح تطبيقي؟** تغطي أدلة كيفية التنفيذ التغليف ضمن السياق:
  [Plugins القنوات](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و
  [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات تعريف الحزمة

يحتاج ملف `package.json` الخاص بك إلى حقل `openclaw` يوضح لنظام Plugin ما
الذي يوفّره Plugin الخاص بك:

**Plugin قناة:**

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

**Plugin مزوّد / خط الأساس للنشر في ClawHub:**

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

إذا كنت تنشر Plugin خارجيًا على ClawHub، فإن حقلي `compat` و`build`
مطلوبان. توجد مقتطفات النشر القياسية في
`docs/snippets/plugin-publish/`.

### حقول `openclaw`

| الحقل        | النوع      | الوصف                                                                                                  |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | ملفات نقطة الإدخال (بالنسبة إلى جذر الحزمة)                                                           |
| `setupEntry` | `string`   | إدخال خفيف مخصّص للإعداد فقط (اختياري)                                                                 |
| `channel`    | `object`   | بيانات تعريف فهرس القناة لأسطح الإعداد والمنتقي والبدء السريع والحالة                                   |
| `providers`  | `string[]` | معرّفات المزوّدين التي يسجّلها هذا Plugin                                                              |
| `install`    | `object`   | تلميحات التثبيت: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | إشارات سلوك بدء التشغيل                                                                                |

### `openclaw.channel`

يُعد `openclaw.channel` بيانات تعريف حزمة منخفضة التكلفة لاكتشاف القناة
وأسطح الإعداد قبل تحميل وقت التشغيل.

| الحقل                                  | النوع      | ما الذي يعنيه                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | معرّف القناة القياسي.                                                         |
| `label`                                | `string`   | التسمية الأساسية للقناة.                                                      |
| `selectionLabel`                       | `string`   | تسمية المنتقي/الإعداد عندما ينبغي أن تختلف عن `label`.                        |
| `detailLabel`                          | `string`   | تسمية تفصيلية ثانوية لفهارس القنوات الأغنى وأسطح الحالة.                     |
| `docsPath`                             | `string`   | مسار الوثائق لروابط الإعداد والاختيار.                                        |
| `docsLabel`                            | `string`   | تسمية بديلة مستخدمة لروابط الوثائق عندما ينبغي أن تختلف عن معرّف القناة.      |
| `blurb`                                | `string`   | وصف قصير للفهرس/التهيئة الأولية.                                              |
| `order`                                | `number`   | ترتيب الفرز في فهارس القنوات.                                                 |
| `aliases`                              | `string[]` | أسماء بديلة إضافية للبحث عن القناة.                                           |
| `preferOver`                           | `string[]` | معرّفات Plugin/قناة ذات أولوية أقل ينبغي لهذه القناة أن تتقدّم عليها.         |
| `systemImage`                          | `string`   | اسم أيقونة/صورة نظام اختياري لواجهات فهارس القنوات.                           |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط الوثائق في أسطح الاختيار.                                  |
| `selectionDocsOmitLabel`               | `boolean`  | عرض مسار الوثائق مباشرة بدلًا من رابط وثائق ذي تسمية في نص الاختيار.          |
| `selectionExtras`                      | `string[]` | سلاسل قصيرة إضافية تُلحَق في نص الاختيار.                                     |
| `markdownCapable`                      | `boolean`  | يحدد أن القناة تدعم Markdown لقرارات التنسيق الصادر.                           |
| `exposure`                             | `object`   | عناصر تحكم في ظهور القناة للإعداد والقوائم المهيأة وأس surfaces الوثائق.       |
| `quickstartAllowFrom`                  | `boolean`  | يضم هذه القناة إلى تدفق إعداد `allowFrom` القياسي للبدء السريع.               |
| `forceAccountBinding`                  | `boolean`  | يفرض ربط الحساب صراحة حتى عند وجود حساب واحد فقط.                             |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | يفضّل البحث في الجلسة عند حل أهداف الإعلان لهذه القناة.                        |

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

- `configured`: تضمين القناة في أسطح القوائم المهيأة/على نمط الحالة
- `setup`: تضمين القناة في منتقيات الإعداد/التهيئة التفاعلية
- `docs`: تحديد القناة على أنها موجهة للعامة في أسطح الوثائق/التنقل

لا يزال `showConfigured` و`showInSetup` مدعومين كأسماء بديلة قديمة. يُفضّل
استخدام `exposure`.

### `openclaw.install`

يُعد `openclaw.install` بيانات تعريف حزمة، وليس بيانات تعريف بيان.

| الحقل                        | النوع                | ما الذي يعنيه                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | مواصفة npm القياسية لتدفقات التثبيت/التحديث.                                     |
| `localPath`                  | `string`             | مسار تثبيت محلي للتطوير أو مضمّن.                                                 |
| `defaultChoice`              | `"npm"` \| `"local"` | مصدر التثبيت المفضّل عندما يكون كلاهما متاحًا.                                   |
| `minHostVersion`             | `string`             | الحد الأدنى لإصدار OpenClaw المدعوم بصيغة `>=x.y.z`.                             |
| `allowInvalidConfigRecovery` | `boolean`            | يسمح لتدفقات إعادة تثبيت Plugin المضمّن بالتعافي من أعطال تهيئة قديمة محددة.      |

إذا تم تعيين `minHostVersion`، فإن كلًا من التثبيت وتحميل سجل البيان يفرضان
ذلك. تتجاوز الاستضافات الأقدم هذا Plugin؛ وتُرفض سلاسل الإصدار غير الصالحة.

لا يُعد `allowInvalidConfigRecovery` تجاوزًا عامًا للتكوينات المعطوبة. بل هو
مخصّص فقط لتعافٍ ضيق النطاق لـ Plugin المضمّن، بحيث يمكن لإعادة التثبيت/الإعداد
إصلاح بقايا ترقيات معروفة مثل غياب مسار Plugin المضمّن أو وجود إدخال قديم
`channels.<id>` لذاك Plugin نفسه. إذا كان التكوين معطوبًا لأسباب غير مرتبطة،
فلا يزال التثبيت يفشل بشكل آمن ويخبر المشغّل بتشغيل `openclaw doctor --fix`.

### تأجيل التحميل الكامل

يمكن لـ Plugins القنوات الاشتراك في التحميل المؤجل عبر:

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

عند التفعيل، يحمّل OpenClaw فقط `setupEntry` خلال مرحلة بدء التشغيل السابقة
للاستماع، حتى بالنسبة إلى القنوات المُهيأة بالفعل. ويُحمَّل الإدخال الكامل بعد
أن تبدأ Gateway بالاستماع.

<Warning>
  لا تفعّل التحميل المؤجل إلا عندما كان `setupEntry` الخاص بك يسجّل كل ما
  تحتاجه Gateway قبل أن تبدأ بالاستماع (تسجيل القناة، ومسارات HTTP، وطرق
  Gateway). إذا كان الإدخال الكامل يملك قدرات مطلوبة عند بدء التشغيل، فأبقِ
  السلوك الافتراضي.
</Warning>

إذا كان إدخال الإعداد/الإدخال الكامل لديك يسجّل طرق Gateway RPC، فاحتفظ بها
ضمن بادئة خاصة بـ Plugin. تظل مساحات أسماء إدارة النواة المحجوزة (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) مملوكة للنواة وتُحل دائمًا إلى
`operator.admin`.

## بيان Plugin

يجب أن يشحن كل Plugin أصلي ملف `openclaw.plugin.json` في جذر الحزمة.
يستخدم OpenClaw هذا للتحقق من صحة التكوين دون تنفيذ شيفرة Plugin.

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

حتى Plugins التي لا تحتوي على أي تكوين يجب أن تشحن مخططًا. مخطط فارغ صالح:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

راجع [بيان Plugin](/ar/plugins/manifest) للاطلاع على المرجع الكامل للمخطط.

## النشر على ClawHub

بالنسبة إلى حزم Plugins، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

الاسم البديل القديم الخاص بالنشر للمهارات فقط مخصّص للمهارات. يجب على حزم Plugins
استخدام `clawhub package publish` دائمًا.

## إدخال الإعداد

ملف `setup-entry.ts` هو بديل خفيف لـ `index.ts` يقوم OpenClaw بتحميله عندما
يحتاج فقط إلى أسطح الإعداد (التهيئة الأولية، إصلاح التكوين، فحص القنوات المعطلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

هذا يتجنب تحميل شيفرة وقت تشغيل ثقيلة (مكتبات التشفير، وتسجيلات CLI،
والخدمات الخلفية) أثناء تدفقات الإعداد.

يمكن لقنوات مساحة العمل المضمّنة التي تحتفظ بتصديرات آمنة للإعداد في وحدات
جانبية استخدام `defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من
`defineSetupPluginEntry(...)`. يدعم هذا العقد المضمّن أيضًا تصدير `runtime`
اختياريًا بحيث يبقى توصيل وقت التشغيل في وقت الإعداد خفيفًا وواضحًا.

**متى يستخدم OpenClaw `setupEntry` بدلًا من الإدخال الكامل:**

- تكون القناة معطّلة ولكنها تحتاج إلى أسطح الإعداد/التهيئة الأولية
- تكون القناة مفعّلة ولكن غير مهيأة
- يكون التحميل المؤجل مفعّلًا (`deferConfiguredChannelFullLoadUntilAfterListen`)

**ما الذي يجب أن يسجّله `setupEntry`:**

- كائن Plugin الخاص بالقناة (عبر `defineSetupPluginEntry`)
- أي مسارات HTTP مطلوبة قبل استماع Gateway
- أي طرق Gateway مطلوبة أثناء بدء التشغيل

يجب أن تتجنب طرق Gateway الخاصة ببدء التشغيل هذه أيضًا مساحات أسماء إدارة
النواة المحجوزة مثل `config.*` أو `update.*`.

**ما الذي يجب ألّا يتضمنه `setupEntry`:**

- تسجيلات CLI
- الخدمات الخلفية
- استيرادات وقت التشغيل الثقيلة (التشفير، وحِزم SDK)
- طرق Gateway المطلوبة فقط بعد بدء التشغيل

### استيرادات مساعدات الإعداد الضيقة

بالنسبة إلى مسارات الإعداد فقط الساخنة، يُفضَّل استخدام واجهات مساعدات الإعداد
الضيقة بدلًا من الواجهة الأوسع `plugin-sdk/setup` عندما تحتاج فقط إلى جزء من
سطح الإعداد:

| مسار الاستيراد                     | استخدمه من أجل                                                                          | التصديرات الأساسية                                                                                                                                                                                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدات وقت التشغيل وقت الإعداد التي تبقى متاحة في `setupEntry` / بدء تشغيل القناة المؤجل | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | محوّلات إعداد الحساب الواعية بالبيئة                                                   | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | مساعدات CLI/الأرشيف/الوثائق الخاصة بالإعداد/التثبيت                                     | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

استخدم الواجهة الأوسع `plugin-sdk/setup` عندما تريد مجموعة أدوات الإعداد
المشتركة الكاملة، بما في ذلك مساعدات تصحيح التكوين مثل
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

تبقى محوّلات تصحيح الإعداد آمنة للاستيراد في المسار الساخن. ويكون بحث سطح عقد
ترقية الحساب الفردي المضمّن كسولًا، لذا فإن استيراد
`plugin-sdk/setup-runtime` لا يحمّل مسبقًا اكتشاف سطح العقد المضمّن قبل
استخدام المحوّل فعليًا.

### ترقية الحساب الفردي المملوكة للقناة

عندما تُرقّي قناة من تكوين علوي لحساب واحد إلى
`channels.<id>.accounts.*`، يكون السلوك الافتراضي المشترك هو نقل القيم
المحددة بنطاق الحساب التي جرت ترقيتها إلى `accounts.default`.

يمكن للقنوات المضمّنة تضييق هذه الترقية أو تجاوزها عبر سطح عقد الإعداد الخاص
بها:

- `singleAccountKeysToMove`: مفاتيح علوية إضافية يجب نقلها إلى الحساب الذي
  جرت ترقيته
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل،
  تُنقل هذه المفاتيح فقط إلى الحساب الذي جرت ترقيته؛ بينما تبقى مفاتيح
  السياسة/التسليم المشتركة في جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختيار الحساب الموجود الذي
  سيتلقى القيم التي جرت ترقيتها

تُعد Matrix المثال المضمّن الحالي. إذا كان هناك حساب Matrix مسمّى واحد
بالضبط موجود بالفعل، أو إذا كانت `defaultAccount` تشير إلى مفتاح موجود
غير قياسي مثل `Ops`، فإن الترقية تحافظ على ذلك الحساب بدلًا من إنشاء إدخال
جديد `accounts.default`.

## مخطط التكوين

يُتحقق من صحة تكوين Plugin مقابل JSON Schema الموجود في البيان الخاص بك. يقوم
المستخدمون بتكوين Plugins عبر:

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

يتلقى Plugin الخاص بك هذا التكوين على هيئة `api.pluginConfig` أثناء التسجيل.

وبالنسبة إلى التكوين الخاص بالقناة، استخدم قسم تكوين القناة بدلًا من ذلك:

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

### بناء مخططات تكوين القناة

استخدم `buildChannelConfigSchema` من `openclaw/plugin-sdk/core` لتحويل مخطط
Zod إلى الغلاف `ChannelConfigSchema` الذي يتحقق OpenClaw من صحته:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## معالجات الإعداد

يمكن لـ Plugins القنوات توفير معالجات إعداد تفاعلية للأمر `openclaw onboard`.
والمعالج هو كائن `ChannelSetupWizard` على `ChannelPlugin`:

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

يدعم النوع `ChannelSetupWizard` كلاً من `credentials` و`textInputs` و
`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` وغير ذلك.
راجع حزم Plugins المضمّنة (على سبيل المثال Discord plugin في `src/channel.setup.ts`) للاطلاع على
أمثلة كاملة.

بالنسبة إلى مطالبات قائمة السماح للرسائل المباشرة التي تحتاج فقط إلى تدفق
`note -> prompt -> parse -> merge -> patch` القياسي، يُفضَّل استخدام
مساعدات الإعداد المشتركة من `openclaw/plugin-sdk/setup`:
`createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`، و
`createNestedChannelParsedAllowFromPrompt(...)`.

وبالنسبة إلى كتل حالة إعداد القناة التي تختلف فقط في التسميات والدرجات
والأسطر الإضافية الاختيارية، يُفضَّل استخدام
`createStandardChannelSetupStatus(...)` من
`openclaw/plugin-sdk/setup` بدلًا من إنشاء الكائن `status` نفسه يدويًا في
كل Plugin.

بالنسبة إلى أسطح الإعداد الاختيارية التي ينبغي أن تظهر فقط في سياقات معينة،
استخدم `createOptionalChannelSetupSurface` من
`openclaw/plugin-sdk/channel-setup`:

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

يكشف `plugin-sdk/channel-setup` أيضًا عن البنّائين الأدنى مستوى
`createOptionalChannelSetupAdapter(...)` و
`createOptionalChannelSetupWizard(...)` عندما تحتاج إلى نصف واحد فقط من
سطح التثبيت الاختياري هذا.

يفشل المحوّل/المعالج الاختياري المُنشأ بشكل آمن عند عمليات كتابة التكوين
الفعلية. ويعيدان استخدام رسالة واحدة تفيد بضرورة التثبيت عبر
`validateInput` و`applyAccountConfig` و`finalize`، ويُلحقان رابط وثائق
عندما يكون `docsPath` مضبوطًا.

بالنسبة إلى واجهات إعداد المستخدم المدعومة بملفات تنفيذية، يُفضَّل استخدام
المساعدات المشتركة المفوّضة بدلًا من نسخ منطق الربط نفسه الخاص بالملف
التنفيذي/الحالة إلى كل قناة:

- `createDetectedBinaryStatus(...)` لكتل الحالة التي تختلف فقط في التسميات،
  والتلميحات، والدرجات، واكتشاف الملف التنفيذي
- `createCliPathTextInput(...)` لإدخالات النص المدعومة بالمسار
- `createDelegatedSetupWizardStatusResolvers(...)`،
  `createDelegatedPrepare(...)`، `createDelegatedFinalize(...)`، و
  `createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى
  التمرير إلى معالج كامل أثقل بشكل كسول
- `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط إلى
  تفويض قرار `textInputs[*].shouldPrompt`

## النشر والتثبيت

**Plugins الخارجية:** انشر إلى [ClawHub](/ar/tools/clawhub) أو npm، ثم ثبّت:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

يجرّب OpenClaw أولًا ClawHub ثم يعود تلقائيًا إلى npm. يمكنك أيضًا
فرض ClawHub صراحة:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

لا يوجد تجاوز مماثل لـ `npm:`. استخدم مواصفة حزمة npm العادية عندما
تريد مسار npm بعد الرجوع من ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugins المضمّنة وسيتم
اكتشافها تلقائيًا أثناء البناء.

**يمكن للمستخدمين التثبيت:**

```bash
openclaw plugins install <package-name>
```

<Info>
  بالنسبة إلى عمليات التثبيت ذات المصدر npm، يقوم `openclaw plugins install`
  بتشغيل `npm install --ignore-scripts` (من دون نصوص دورة الحياة). حافظ على
  أشجار تبعيات Plugin بلغة JS/TS خالصة وتجنب الحزم التي تتطلب بناء
  `postinstall`.
</Info>

## ذو صلة

- [نقاط إدخال SDK](/ar/plugins/sdk-entrypoints) -- `definePluginEntry` و `defineChannelPluginEntry`
- [بيان Plugin](/ar/plugins/manifest) -- المرجع الكامل لمخطط البيان
- [بناء Plugins](/ar/plugins/building-plugins) -- دليل بدء خطوة بخطوة
