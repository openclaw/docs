---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - تحتاج إلى فهم الفرق بين `setup-entry.ts` و`index.ts`
    - أنت تعرّف مخططات إعدادات Plugin أو بيانات `openclaw` الوصفية في `package.json`
sidebarTitle: Setup and Config
summary: معالجات الإعداد، و`setup-entry.ts`، ومخططات الإعدادات، وبيانات `package.json` الوصفية
title: إعداد Plugin وضبطها
x-i18n:
    generated_at: "2026-04-24T07:56:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

مرجع لحزم Plugin (بيانات `package.json` الوصفية)، وملفات البيان
(`openclaw.plugin.json`)، ومدخلات الإعداد، ومخططات التهيئة.

<Tip>
  **هل تبحث عن شرح عملي؟** تغطي أدلة "كيفية" الحزم ضمن السياق:
  [Channel Plugins](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و
  [Provider Plugins](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات الحزمة الوصفية

يحتاج ملف `package.json` إلى حقل `openclaw` يوضح لنظام Plugin ما الذي
يوفره Plugin الخاص بك:

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

**Plugin موفّر / خط الأساس للنشر على ClawHub:**

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

إذا نشرت Plugin خارجيًا على ClawHub، فإن حقلي `compat` و`build`
مطلوبان. وتوجد مقتطفات النشر القياسية في
`docs/snippets/plugin-publish/`.

### حقول `openclaw`

| الحقل        | النوع      | الوصف                                                                                                                 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | ملفات نقطة الإدخال (بالنسبة إلى جذر الحزمة)                                                                           |
| `setupEntry` | `string`   | إدخال خفيف مخصص للإعداد فقط (اختياري)                                                                                 |
| `channel`    | `object`   | بيانات وصفية لفهرس القنوات لأسطح الإعداد والاختيار والبداية السريعة والحالة                                             |
| `providers`  | `string[]` | معرّفات الموفّرين التي يسجّلها هذا Plugin                                                                              |
| `install`    | `object`   | تلميحات التثبيت: `npmSpec` و`localPath` و`defaultChoice` و`minHostVersion` و`expectedIntegrity` و`allowInvalidConfigRecovery` |
| `startup`    | `object`   | علامات سلوك بدء التشغيل                                                                                               |

### `openclaw.channel`

يمثل `openclaw.channel` بيانات وصفية خفيفة على مستوى الحزمة لاكتشاف القنوات
وأسطح الإعداد قبل تحميل بيئة التشغيل.

| الحقل                                  | النوع      | المعنى                                                                 |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `id`                                   | `string`   | معرّف القناة القياسي.                                                  |
| `label`                                | `string`   | التسمية الأساسية للقناة.                                               |
| `selectionLabel`                       | `string`   | تسمية أداة الاختيار/الإعداد عندما ينبغي أن تختلف عن `label`.           |
| `detailLabel`                          | `string`   | تسمية تفاصيل ثانوية لكتالوجات قنوات أكثر ثراءً وأسـطح الحالة.         |
| `docsPath`                             | `string`   | مسار المستندات لروابط الإعداد والاختيار.                               |
| `docsLabel`                            | `string`   | تسمية بديلة تُستخدم لروابط المستندات عندما ينبغي أن تختلف عن معرّف القناة. |
| `blurb`                                | `string`   | وصف قصير للإعداد الأولي/الفهرس.                                        |
| `order`                                | `number`   | ترتيب الفرز في كتالوجات القنوات.                                       |
| `aliases`                              | `string[]` | أسماء مستعارة إضافية للبحث عن القناة واختيارها.                        |
| `preferOver`                           | `string[]` | معرّفات Plugin/قناة ذات أولوية أقل ينبغي أن تتفوق عليها هذه القناة.    |
| `systemImage`                          | `string`   | اسم أيقونة/صورة نظام اختياري لكتالوجات واجهة القناة.                  |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط المستندات في أسطح الاختيار.                         |
| `selectionDocsOmitLabel`               | `boolean`  | إظهار مسار المستندات مباشرة بدلًا من رابط مستندات معنْون في نص الاختيار. |
| `selectionExtras`                      | `string[]` | سلاسل قصيرة إضافية تُلحق في نص الاختيار.                               |
| `markdownCapable`                      | `boolean`  | يحدد القناة على أنها قادرة على Markdown لقرارات التنسيق الصادر.        |
| `exposure`                             | `object`   | عناصر تحكم ظهور القناة لأسطح الإعداد والقوائم المهيأة والمستندات.      |
| `quickstartAllowFrom`                  | `boolean`  | يضم هذه القناة إلى تدفق الإعداد القياسي للبداية السريعة `allowFrom`.   |
| `forceAccountBinding`                  | `boolean`  | يفرض ربط الحساب صراحةً حتى عند وجود حساب واحد فقط.                     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | يفضّل البحث في الجلسة عند حل أهداف الإعلان لهذه القناة.                |

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

- `configured`: تضمين القناة في أسطح القوائم المهيأة/المشابهة للحالة
- `setup`: تضمين القناة في أدوات الاختيار التفاعلية للإعداد/التهيئة
- `docs`: تمييز القناة على أنها موجهة للعامة في أسطح المستندات/التنقل

لا يزال `showConfigured` و`showInSetup` مدعومين كأسماء بديلة قديمة. يُفضل
استخدام `exposure`.

### `openclaw.install`

يمثل `openclaw.install` بيانات وصفية على مستوى الحزمة، وليس بيانات وصفية
لملف البيان.

| الحقل                        | النوع                | المعنى                                                                    |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | مواصفة npm القياسية لتدفقات التثبيت/التحديث.                              |
| `localPath`                  | `string`             | مسار التثبيت المحلي للتطوير أو التثبيت المضمن.                            |
| `defaultChoice`              | `"npm"` \| `"local"` | مصدر التثبيت المفضل عند توفر كلا الخيارين.                                 |
| `minHostVersion`             | `string`             | الحد الأدنى المدعوم من إصدار OpenClaw بصيغة `>=x.y.z`.                    |
| `expectedIntegrity`          | `string`             | سلسلة سلامة npm dist المتوقعة، وعادةً `sha512-...`، للتثبيتات المثبتة.     |
| `allowInvalidConfigRecovery` | `boolean`            | يسمح لتدفقات إعادة تثبيت Plugin المضمنة بالتعافي من أعطال تهيئة قديمة محددة. |

تستخدم تجربة الإعداد التفاعلية أيضًا `openclaw.install` لأسطح
التثبيت عند الطلب. إذا كان Plugin الخاص بك يعرض خيارات مصادقة الموفّر أو
بيانات إعداد/فهرسة القناة قبل تحميل بيئة التشغيل، فيمكن لتجربة الإعداد
إظهار هذا الخيار، وطلب الاختيار بين تثبيت npm أو التثبيت المحلي، ثم تثبيت
Plugin أو تمكينه، ثم متابعة التدفق المحدد. تتطلب خيارات الإعداد عبر npm
بيانات وصفية موثوقة للفهرس مع `npmSpec` من السجل. وتكون الإصدارات الدقيقة
و`expectedIntegrity` دبابيس اختيارية. إذا كان
`expectedIntegrity` موجودًا، فإن تدفقات التثبيت/التحديث تفرضه. احتفِظ
ببيانات "ما الذي يجب عرضه" الوصفية في `openclaw.plugin.json` وبيانات
"كيفية تثبيته" الوصفية في `package.json`.

إذا تم تعيين `minHostVersion`، فإن التثبيت وتحميل سجل ملفات البيان
يفرضانه كلاهما. وتتجاوز المضيفات الأقدم Plugin؛ كما تُرفض سلاسل الإصدارات
غير الصالحة.

بالنسبة إلى تثبيتات npm المثبتة بدبابيس، احتفِظ بالإصدار الدقيق في `npmSpec`
وأضف سلامة الأثر المتوقعة:

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

إن `allowInvalidConfigRecovery` ليس تجاوزًا عامًا للتهيئات المعطلة. بل هو
مخصص فقط لتعافٍ ضيق النطاق خاص بـ Plugin المضمنة، بحيث يمكن لإعادة
التثبيت/الإعداد إصلاح مخلفات ترقية معروفة مثل غياب مسار Plugin مضمن أو
وجود إدخال قديم `channels.<id>` لذلك Plugin نفسه. إذا كانت التهيئة
معطلة لأسباب غير ذات صلة، فإن التثبيت يظل مغلقًا آمنًا ويطلب من المشغل
تشغيل `openclaw doctor --fix`.

### تأجيل التحميل الكامل

يمكن لـ Channel Plugins الاشتراك في التحميل المؤجل باستخدام:

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

عند التمكين، يحمّل OpenClaw فقط `setupEntry` خلال مرحلة بدء التشغيل
قبل الاستماع، حتى للقنوات المُهيأة مسبقًا. ويتم تحميل الإدخال الكامل بعد
أن يبدأ Gateway بالاستماع.

<Warning>
  لا تفعّل التحميل المؤجل إلا عندما كان `setupEntry` الخاص بك يسجّل كل ما
  يحتاجه Gateway قبل أن يبدأ بالاستماع (تسجيل القناة، ومسارات HTTP،
  وطرائق Gateway). إذا كان الإدخال الكامل يملك قدرات بدء تشغيل مطلوبة،
  فأبقِ السلوك الافتراضي.
</Warning>

إذا كان إدخال الإعداد/الإدخال الكامل لديك يسجّل طرائق Gateway RPC، فاحتفِظ
بها ضمن بادئة خاصة بـ Plugin. وتظل نطاقات أسماء الإدارة الأساسية المحجوزة
(`config.*` و`exec.approvals.*` و`wizard.*` و`update.*`) مملوكة
للنواة وتُحل دائمًا إلى `operator.admin`.

## ملف بيان Plugin

يجب أن يشحن كل Plugin أصلي ملف `openclaw.plugin.json` في جذر الحزمة.
يستخدم OpenClaw هذا للتحقق من التهيئة من دون تنفيذ شيفرة Plugin.

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

بالنسبة إلى Channel Plugins، أضف `kind` و`channels`:

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

حتى Plugins التي لا تحتوي على أي تهيئة يجب أن تشحن مخططًا. ويكون المخطط
الفارغ صالحًا:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

راجع [Plugin Manifest](/ar/plugins/manifest) للاطلاع على المرجع الكامل
للمخطط.

## النشر على ClawHub

بالنسبة إلى حزم Plugin، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

الاسم البديل القديم الخاص بالنشر للـ Skills فقط مخصص لـ Skills. ويجب أن
تستخدم حزم Plugin دائمًا `clawhub package publish`.

## إدخال الإعداد

ملف `setup-entry.ts` هو بديل خفيف لـ `index.ts` يقوم OpenClaw بتحميله عندما
يحتاج فقط إلى أسطح الإعداد (الإعداد الأولي، وإصلاح التهيئة، وفحص القنوات
المعطلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يتجنب هذا تحميل شيفرة بيئة تشغيل ثقيلة (مكتبات التشفير، وتسجيلات CLI،
والخدمات الخلفية) أثناء تدفقات الإعداد.

يمكن لقنوات مساحة العمل المضمنة التي تحتفظ بعمليات التصدير الآمنة للإعداد
في وحدات sidecar استخدام `defineBundledChannelSetupEntry(...)` من
`openclaw/plugin-sdk/channel-entry-contract` بدلًا من
`defineSetupPluginEntry(...)`. ويدعم هذا العقد المضمن أيضًا عملية تصدير
`runtime` اختيارية بحيث يظل ربط بيئة التشغيل في وقت الإعداد خفيفًا وصريحًا.

**متى يستخدم OpenClaw `setupEntry` بدلًا من الإدخال الكامل:**

- تكون القناة معطلة لكنها تحتاج إلى أسطح الإعداد/الإعداد الأولي
- تكون القناة مفعلة ولكن غير مهيأة
- يكون التحميل المؤجل مفعّلًا (`deferConfiguredChannelFullLoadUntilAfterListen`)

**ما الذي يجب أن يسجله `setupEntry`:**

- كائن Channel Plugin (عبر `defineSetupPluginEntry`)
- أي مسارات HTTP مطلوبة قبل أن يبدأ Gateway الاستماع
- أي طرائق Gateway لازمة أثناء بدء التشغيل

يجب أن تتجنب طرائق Gateway الخاصة ببدء التشغيل هذه أيضًا نطاقات أسماء
إدارة النواة المحجوزة مثل `config.*` أو `update.*`.

**ما الذي يجب ألّا يتضمنه `setupEntry`:**

- تسجيلات CLI
- الخدمات الخلفية
- عمليات استيراد بيئة تشغيل ثقيلة (التشفير، وSDKs)
- طرائق Gateway المطلوبة فقط بعد بدء التشغيل

### عمليات استيراد مساعدات الإعداد الضيقة

للمسارات الساخنة الخاصة بالإعداد فقط، فضّل نقاط ربط مساعدات الإعداد الضيقة
على واجهة `plugin-sdk/setup` الأشمل عندما تحتاج فقط إلى جزء من سطح الإعداد:

| مسار الاستيراد                     | استخدمه من أجل                                                                          | أهم عمليات التصدير                                                                                                                                                                                                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدات بيئة التشغيل في وقت الإعداد التي تظل متاحة في `setupEntry` / بدء تشغيل القناة المؤجل | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | مهايئات إعداد الحساب الواعية بالبيئة                                                   | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                          |
| `plugin-sdk/setup-tools`           | مساعدات CLI/الأرشيف/المستندات الخاصة بالإعداد والتثبيت                                  | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                  |

استخدم نقطة الربط الأوسع `plugin-sdk/setup` عندما تريد مجموعة أدوات
الإعداد المشتركة الكاملة، بما في ذلك مساعدات ترقيع التهيئة مثل
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

تظل مهايئات ترقيع الإعداد آمنة للاستيراد في المسارات الساخنة. كما أن بحث
سطح عقد الترقية المضمن للحساب الواحد يتم بكسل، لذلك فإن استيراد
`plugin-sdk/setup-runtime` لا يحمّل مسبقًا وبشكل متعجل اكتشاف سطح العقد
المضمن قبل استخدام المهايئ فعليًا.

### ترقية الحساب الواحد المملوكة للقناة

عندما تُرقّي قناة من تهيئة عليا لحساب واحد إلى
`channels.<id>.accounts.*`، يكون السلوك المشترك الافتراضي هو نقل القيم
المرقّاة ذات النطاق الخاص بالحساب إلى `accounts.default`.

يمكن للقنوات المضمنة تضييق هذه الترقية أو تجاوزها عبر سطح عقد الإعداد
الخاص بها:

- `singleAccountKeysToMove`: مفاتيح علوية إضافية ينبغي نقلها إلى الحساب
  المرقّى
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل،
  تُنقل هذه المفاتيح فقط إلى الحساب المرقّى؛ بينما تبقى مفاتيح
  السياسة/التسليم المشتركة عند جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختيار الحساب الموجود الذي
  سيتلقى القيم المرقّاة

يُعد Matrix المثال المضمن الحالي. فإذا كان هناك حساب Matrix مسمى واحد فقط
موجود بالفعل، أو إذا كان `defaultAccount` يشير إلى مفتاح موجود غير قياسي
مثل `Ops`، فإن الترقية تحافظ على ذلك الحساب بدلًا من إنشاء إدخال جديد
`accounts.default`.

## مخطط التهيئة

تُتحقق تهيئة Plugin بمقارنتها مع JSON Schema الموجود في ملف البيان الخاص بك.
ويقوم المستخدمون بتهيئة Plugins عبر:

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

يتلقى Plugin الخاص بك هذه التهيئة على شكل `api.pluginConfig` أثناء التسجيل.

أما بالنسبة إلى التهيئة الخاصة بالقناة، فاستخدم قسم تهيئة القناة بدلًا من ذلك:

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

### بناء مخططات تهيئة القناة

استخدم `buildChannelConfigSchema` من `openclaw/plugin-sdk/core` لتحويل
مخطط Zod إلى الغلاف `ChannelConfigSchema` الذي يتحقق منه OpenClaw:

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

يمكن لـ Channel Plugins توفير معالجات إعداد تفاعلية لـ `openclaw onboard`.
يكون المعالج كائن `ChannelSetupWizard` على `ChannelPlugin`:

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

يدعم النوع `ChannelSetupWizard` الحقول `credentials` و`textInputs`
و`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` وغيرها.
راجع حزم Plugin المضمنة (على سبيل المثال Discord plugin
`src/channel.setup.ts`) للحصول على أمثلة كاملة.

بالنسبة إلى مطالبات قائمة السماح للرسائل المباشرة التي تحتاج فقط إلى التدفق
القياسي
`note -> prompt -> parse -> merge -> patch`، ففضّل مساعدات الإعداد
المشتركة من `openclaw/plugin-sdk/setup`:
`createPromptParsedAllowFromForAccount(...)` و
`createTopLevelChannelParsedAllowFromPrompt(...)` و
`createNestedChannelParsedAllowFromPrompt(...)`.

وبالنسبة إلى كتل حالة إعداد القناة التي لا تختلف إلا في التسميات والدرجات
والأسطر الإضافية الاختيارية، ففضّل
`createStandardChannelSetupStatus(...)` من
`openclaw/plugin-sdk/setup` بدلًا من بناء كائن `status` نفسه يدويًا
في كل Plugin.

أما بالنسبة إلى أسطح الإعداد الاختيارية التي ينبغي ألا تظهر إلا في سياقات
معينة، فاستخدم `createOptionalChannelSetupSurface` من
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

يكشف `plugin-sdk/channel-setup` أيضًا عن أدوات البناء الأقل مستوى
`createOptionalChannelSetupAdapter(...)` و
`createOptionalChannelSetupWizard(...)` عندما تحتاج فقط إلى أحد نصفي
سطح التثبيت الاختياري هذا.

يفشل المهايئ/المعالج الاختياري المولّد بإغلاق آمن عند عمليات كتابة
التهيئة الحقيقية. وهما يعيدان استخدام رسالة واحدة تفيد بأن التثبيت مطلوب
عبر `validateInput` و`applyAccountConfig` و`finalize`، ويضيفان رابط
مستندات عندما يكون `docsPath` مضبوطًا.

بالنسبة إلى واجهات الإعداد المدعومة بالثنائيات التنفيذية، فضّل المساعدات
المفوّضة المشتركة بدلًا من نسخ منطق الثنائيات/الحالة نفسه إلى كل قناة:

- `createDetectedBinaryStatus(...)` لكتل الحالة التي تختلف فقط في التسميات
  والتلميحات والدرجات واكتشاف الثنائيات
- `createCliPathTextInput(...)` لحقول النص المدعومة بالمسار
- `createDelegatedSetupWizardStatusResolvers(...)` و
  `createDelegatedPrepare(...)` و
  `createDelegatedFinalize(...)` و
  `createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى
  التمرير الكسول إلى معالج كامل أثقل
- `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط
  إلى تفويض قرار `textInputs[*].shouldPrompt`

## النشر والتثبيت

**Plugins الخارجية:** انشر إلى [ClawHub](/ar/tools/clawhub) أو npm، ثم ثبّت:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

يحاول OpenClaw استخدام ClawHub أولًا ثم يعود تلقائيًا إلى npm. ويمكنك أيضًا
فرض ClawHub صراحةً:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

لا يوجد تجاوز مماثل لـ `npm:`. استخدم مواصفة حزمة npm العادية عندما تريد
مسار npm بعد الرجوع من ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugin المضمنة وسيتم
اكتشافها تلقائيًا أثناء البناء.

**يمكن للمستخدمين التثبيت:**

```bash
openclaw plugins install <package-name>
```

<Info>
  بالنسبة إلى التثبيتات القادمة من npm، يشغّل `openclaw plugins install`
  الأمر `npm install --ignore-scripts` (من دون lifecycle scripts). احرص على
  أن تبقى أشجار تبعيات Plugin بلغة JS/TS خالصة، وتجنب الحزم التي تتطلب
  عمليات بناء `postinstall`.
</Info>

تشكل Plugins المضمنة المملوكة لـ OpenClaw استثناء الإصلاح الوحيد عند بدء
التشغيل: عندما يرى تثبيت معبأ واحدةً منها مفعلة عبر تهيئة Plugin أو تهيئة
قناة قديمة أو ملف بيانها المضمن ذي التفعيل الافتراضي، فإن بدء التشغيل
يثبّت تبعيات بيئة التشغيل المفقودة لذلك Plugin قبل الاستيراد. ولا ينبغي
أن تعتمد Plugins التابعة لجهات خارجية على التثبيتات عند بدء التشغيل؛
استمر في استخدام مثبّت Plugin الصريح.

## ذو صلة

- [SDK Entry Points](/ar/plugins/sdk-entrypoints) -- ‏`definePluginEntry` و `defineChannelPluginEntry`
- [Plugin Manifest](/ar/plugins/manifest) -- المرجع الكامل لمخطط ملف البيان
- [Building Plugins](/ar/plugins/building-plugins) -- دليل تمهيدي خطوة بخطوة
