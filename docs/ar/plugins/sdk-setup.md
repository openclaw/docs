---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - تحتاج إلى فهم setup-entry.ts مقابل index.ts
    - أنت تعرّف مخططات إعدادات Plugin أو بيانات openclaw الوصفية في package.json
sidebarTitle: Setup and config
summary: معالجات الإعداد، وsetup-entry.ts، ومخططات التكوين، وبيانات تعريف package.json
title: إعداد Plugin وتكوينه
x-i18n:
    generated_at: "2026-05-02T21:01:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع لتغليف Plugin (بيانات `package.json` الوصفية)، والبيانات (`openclaw.plugin.json`)، وإدخالات الإعداد، ومخططات الإعدادات.

<Tip>
**هل تبحث عن شرح عملي؟** تغطي أدلة الكيفية التغليف ضمن السياق: [Plugins القنوات](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و[Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## بيانات الحزمة الوصفية

يحتاج `package.json` لديك إلى حقل `openclaw` يوضح لنظام Plugins ما يقدمه Plugin الخاص بك:

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
  ملفات نقطة الدخول (نسبة إلى جذر الحزمة).
</ParamField>
<ParamField path="setupEntry" type="string">
  إدخال خفيف مخصص للإعداد فقط (اختياري).
</ParamField>
<ParamField path="channel" type="object">
  بيانات وصفية لفهرس القنوات لواجهات الإعداد والمنتقي والبدء السريع والحالة.
</ParamField>
<ParamField path="providers" type="string[]">
  معرّفات المزوّدين التي يسجلها هذا Plugin.
</ParamField>
<ParamField path="install" type="object">
  تلميحات التثبيت: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  أعلام سلوك بدء التشغيل.
</ParamField>

### `openclaw.channel`

`openclaw.channel` هو بيانات وصفية خفيفة للحزمة لاكتشاف القنوات وواجهات الإعداد قبل تحميل وقت التشغيل.

| الحقل                                  | النوع      | ما يعنيه                                                                      |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | معرّف القناة المعتمد.                                                         |
| `label`                                | `string`   | تسمية القناة الأساسية.                                                        |
| `selectionLabel`                       | `string`   | تسمية المنتقي/الإعداد عندما ينبغي أن تختلف عن `label`.                        |
| `detailLabel`                          | `string`   | تسمية تفاصيل ثانوية لفهارس القنوات وواجهات الحالة الأكثر ثراءً.              |
| `docsPath`                             | `string`   | مسار المستندات لروابط الإعداد والاختيار.                                      |
| `docsLabel`                            | `string`   | تجاوز التسمية المستخدمة لروابط المستندات عندما ينبغي أن تختلف عن معرّف القناة. |
| `blurb`                                | `string`   | وصف قصير للتوجيه الأولي/الفهرس.                                               |
| `order`                                | `number`   | ترتيب الفرز في فهارس القنوات.                                                 |
| `aliases`                              | `string[]` | أسماء مستعارة إضافية للبحث عند اختيار القناة.                                 |
| `preferOver`                           | `string[]` | معرّفات Plugin/قناة أقل أولوية ينبغي لهذه القناة أن تتقدم عليها.              |
| `systemImage`                          | `string`   | اسم أيقونة/صورة نظام اختياري لفهارس واجهة القنوات.                           |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط المستندات في واجهات الاختيار.                              |
| `selectionDocsOmitLabel`               | `boolean`  | عرض مسار المستندات مباشرة بدلًا من رابط مستندات ذي تسمية في نص الاختيار.      |
| `selectionExtras`                      | `string[]` | سلاسل قصيرة إضافية تُلحق بنص الاختيار.                                        |
| `markdownCapable`                      | `boolean`  | يعلّم القناة على أنها تدعم Markdown لاتخاذ قرارات تنسيق الرسائل الصادرة.      |
| `exposure`                             | `object`   | عناصر التحكم في ظهور القناة لواجهات الإعداد والقوائم المهيأة والمستندات.      |
| `quickstartAllowFrom`                  | `boolean`  | إدراج هذه القناة في تدفق إعداد البدء السريع القياسي `allowFrom`.              |
| `forceAccountBinding`                  | `boolean`  | طلب ربط حساب صريح حتى عند وجود حساب واحد فقط.                                |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | تفضيل البحث في الجلسات عند حل أهداف الإعلان لهذه القناة.                     |

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
- `docs`: تعليم القناة على أنها عامة الظهور في واجهات المستندات/التنقل

<Note>
يبقى `showConfigured` و`showInSetup` مدعومين كأسماء مستعارة قديمة. فضّل `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` هو بيانات وصفية للحزمة، وليس بيانات وصفية للبيان.

| الحقل                        | النوع                               | ما يعنيه                                                                         |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | مواصفة ClawHub المعتمدة لتدفقات التثبيت/التحديث والتثبيت عند الطلب أثناء التوجيه الأولي. |
| `npmSpec`                    | `string`                            | مواصفة npm المعتمدة لتدفقات الرجوع في التثبيت/التحديث.                            |
| `localPath`                  | `string`                            | مسار تثبيت محلي للتطوير أو مضمّن.                                                 |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | مصدر التثبيت المفضل عند توفر عدة مصادر.                                           |
| `minHostVersion`             | `string`                            | الحد الأدنى لإصدار OpenClaw المدعوم بصيغة `>=x.y.z` أو `>=x.y.z-prerelease`.      |
| `expectedIntegrity`          | `string`                            | سلسلة سلامة حزمة npm dist المتوقعة، عادةً `sha512-...`، للتثبيتات المثبتة بإصدار محدد. |
| `allowInvalidConfigRecovery` | `boolean`                           | يتيح لتدفقات إعادة تثبيت Plugins المضمنة التعافي من إخفاقات إعدادات قديمة محددة. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    يستخدم التوجيه الأولي التفاعلي أيضًا `openclaw.install` لواجهات التثبيت عند الطلب. إذا كان Plugin الخاص بك يعرض خيارات مصادقة المزوّد أو بيانات وصفية لإعداد/فهرس القناة قبل تحميل وقت التشغيل، فيمكن للتوجيه الأولي عرض ذلك الخيار، والمطالبة باختيار ClawHub أو npm أو تثبيت محلي، وتثبيت Plugin أو تمكينه، ثم متابعة التدفق المحدد. تستخدم خيارات توجيه ClawHub الأولي `clawhubSpec` وتُفضّل عند وجودها؛ وتتطلب خيارات npm بيانات وصفية موثوقة للفهرس مع `npmSpec` في السجل؛ الإصدارات الدقيقة و`expectedIntegrity` دبابيس npm اختيارية. إذا كان `expectedIntegrity` موجودًا، تفرضه تدفقات التثبيت/التحديث على npm. احتفظ ببيانات "ما الذي يجب عرضه" الوصفية في `openclaw.plugin.json` وبيانات "كيفية تثبيته" الوصفية في `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    إذا تم تعيين `minHostVersion`، فإن كلًا من التثبيت وتحميل سجل البيانات غير المضمّنة يفرضانها. تتخطى المضيفات الأقدم Plugins الخارجية؛ وتُرفض سلاسل الإصدارات غير الصالحة. يُفترض أن Plugins المصدر المضمّنة لها إصدار متوافق مع نسخة المضيف.
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
    `allowInvalidConfigRecovery` ليس تجاوزًا عامًا للإعدادات المعطلة. إنه مخصص فقط للتعافي الضيق لـ Plugins المضمّنة، بحيث يمكن لإعادة التثبيت/الإعداد إصلاح بقايا ترقية معروفة مثل مسار Plugin مضمّن مفقود أو إدخال `channels.<id>` قديم لذلك Plugin نفسه. إذا كانت الإعدادات معطلة لأسباب غير ذات صلة، فسيظل التثبيت يفشل بإغلاق آمن ويطلب من المشغّل تشغيل `openclaw doctor --fix`.
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

عند التمكين، يحمّل OpenClaw `setupEntry` فقط أثناء مرحلة بدء التشغيل قبل الاستماع، حتى للقنوات المهيأة مسبقًا. يتم تحميل الإدخال الكامل بعد أن يبدأ Gateway الاستماع.

<Warning>
لا تمكّن التحميل المؤجل إلا عندما يسجل `setupEntry` لديك كل ما يحتاجه Gateway قبل أن يبدأ الاستماع (تسجيل القناة، ومسارات HTTP، وطرق Gateway). إذا كان الإدخال الكامل يملك قدرات بدء تشغيل مطلوبة، فاحتفظ بالسلوك الافتراضي.
</Warning>

إذا كان إدخال الإعداد/الإدخال الكامل لديك يسجل طرق Gateway RPC، فاحتفظ بها ضمن بادئة خاصة بـ Plugin. تبقى مساحات أسماء إدارة النواة المحجوزة (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) مملوكة للنواة وتُحل دائمًا إلى `operator.admin`.

## بيان Plugin

يجب أن يشحن كل Plugin أصلي ملف `openclaw.plugin.json` في جذر الحزمة. يستخدم OpenClaw هذا للتحقق من الإعدادات دون تنفيذ كود Plugin.

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

حتى Plugins التي لا تملك إعدادات يجب أن تشحن مخططًا. المخطط الفارغ صالح:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

راجع [بيان Plugin](/ar/plugins/manifest) لمرجع المخطط الكامل.

## النشر على ClawHub

بالنسبة إلى حزم Plugins، استخدم أمر ClawHub الخاص بالحزمة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
الاسم المستعار القديم للنشر الخاص بالـ Skills مخصص للـ Skills. يجب أن تستخدم حزم Plugin دائمًا `clawhub package publish`.
</Note>

## إدخال الإعداد

ملف `setup-entry.ts` هو بديل خفيف لملف `index.ts` يحمّله OpenClaw عندما يحتاج فقط إلى أسطح الإعداد (الإدخال الأولي، إصلاح الإعدادات، فحص القناة المعطّلة).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يتجنب هذا تحميل كود وقت التشغيل الثقيل (مكتبات التشفير، تسجيلات CLI، خدمات الخلفية) أثناء مسارات الإعداد.

يمكن لقنوات مساحة العمل المضمّنة التي تحتفظ بصادرات آمنة للإعداد في وحدات جانبية أن تستخدم `defineBundledChannelSetupEntry(...)` من `openclaw/plugin-sdk/channel-entry-contract` بدلًا من `defineSetupPluginEntry(...)`. يدعم هذا العقد المضمّن أيضًا تصدير `runtime` اختياريًا حتى تظل توصيلات وقت التشغيل أثناء الإعداد خفيفة وصريحة.

<AccordionGroup>
  <Accordion title="متى يستخدم OpenClaw setupEntry بدلًا من الإدخال الكامل">
    - تكون القناة معطّلة لكنها تحتاج إلى أسطح الإعداد/الإدخال الأولي.
    - تكون القناة مفعّلة لكنها غير مهيأة.
    - يكون التحميل المؤجل مفعّلًا (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="ما الذي يجب أن يسجله setupEntry">
    - كائن Plugin الخاص بالقناة (عبر `defineSetupPluginEntry`).
    - أي مسارات HTTP مطلوبة قبل بدء استماع Gateway.
    - أي أساليب Gateway مطلوبة أثناء بدء التشغيل.

    يجب أن تستمر أساليب Gateway الخاصة ببدء التشغيل هذه في تجنب مساحات أسماء الإدارة الأساسية المحجوزة مثل `config.*` أو `update.*`.

  </Accordion>
  <Accordion title="ما الذي يجب ألا يتضمنه setupEntry">
    - تسجيلات CLI.
    - خدمات الخلفية.
    - استيرادات وقت التشغيل الثقيلة (التشفير، SDKs).
    - أساليب Gateway المطلوبة فقط بعد بدء التشغيل.

  </Accordion>
</AccordionGroup>

### استيرادات مساعد الإعداد المحدودة

للمسارات الساخنة الخاصة بالإعداد فقط، فضّل seams مساعد الإعداد المحدودة على المظلة الأوسع `plugin-sdk/setup` عندما لا تحتاج إلا إلى جزء من سطح الإعداد:

| مسار الاستيراد                     | استخدمه من أجل                                                                           | الصادرات الرئيسية                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدات وقت التشغيل أثناء الإعداد التي تظل متاحة في `setupEntry` / بدء تشغيل القناة المؤجل | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | محولات إعداد الحساب الواعية بالبيئة                                                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | مساعدات CLI/الأرشيف/المستندات الخاصة بالإعداد/التثبيت                                     | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

استخدم seam الأوسع `plugin-sdk/setup` عندما تريد مجموعة أدوات الإعداد المشتركة كاملة، بما في ذلك مساعدات تصحيح الإعدادات مثل `moveSingleAccountChannelSectionToDefaultAccount(...)`.

تبقى محولات تصحيح الإعدادات آمنة للمسار الساخن عند الاستيراد. يكون البحث في سطح عقد ترقية الحساب الواحد المضمّن الخاص بها كسولًا، لذلك لا يؤدي استيراد `plugin-sdk/setup-runtime` إلى تحميل اكتشاف سطح العقد المضمّن مبكرًا قبل استخدام المحول فعليًا.

### ترقية الحساب الواحد المملوكة للقناة

عندما ترقي قناة إعدادًا علويًا ذا حساب واحد إلى `channels.<id>.accounts.*`، يكون السلوك المشترك الافتراضي هو نقل القيم المرقّاة ذات النطاق الحسابي إلى `accounts.default`.

يمكن للقنوات المضمّنة تضييق تلك الترقية أو تجاوزها عبر سطح عقد الإعداد الخاص بها:

- `singleAccountKeysToMove`: مفاتيح علوية إضافية يجب نقلها إلى الحساب المرقّى
- `namedAccountPromotionKeys`: عند وجود حسابات مسماة بالفعل، تُنقل هذه المفاتيح فقط إلى الحساب المرقّى؛ وتبقى مفاتيح السياسة/التسليم المشتركة في جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختيار الحساب الموجود الذي يتلقى القيم المرقّاة

<Note>
Matrix هو المثال المضمّن الحالي. إذا كان يوجد حساب Matrix مسمى واحد بالضبط بالفعل، أو إذا كان `defaultAccount` يشير إلى مفتاح غير قياسي موجود مثل `Ops`، فإن الترقية تحافظ على ذلك الحساب بدلًا من إنشاء إدخال `accounts.default` جديد.
</Note>

## مخطط الإعدادات

يتم التحقق من صحة إعدادات Plugin مقابل JSON Schema في ملف البيان. يهيئ المستخدمون Plugins عبر:

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

يتلقى Plugin الخاص بك هذه الإعدادات كـ `api.pluginConfig` أثناء التسجيل.

للإعدادات الخاصة بالقناة، استخدم قسم إعدادات القناة بدلًا من ذلك:

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

استخدم `buildChannelConfigSchema` لتحويل مخطط Zod إلى غلاف `ChannelConfigSchema` المستخدم بواسطة عناصر إعدادات القناة المملوكة للـ Plugin:

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

إذا كنت تؤلف العقد بالفعل كـ JSON Schema أو TypeBox، فاستخدم المساعد المباشر حتى يتمكن OpenClaw من تخطي تحويل Zod إلى JSON Schema في مسارات البيانات الوصفية:

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

بالنسبة إلى Plugins التابعة لجهات خارجية، يظل عقد المسار البارد هو بيان Plugin: اعكس JSON Schema المولّد في `openclaw.plugin.json#channelConfigs` حتى تتمكن أسطح مخطط الإعدادات والإعداد وواجهة المستخدم من فحص `channels.<id>` دون تحميل كود وقت التشغيل.

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

يدعم نوع `ChannelSetupWizard` كلًا من `credentials` و`textInputs` و`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` والمزيد. راجع حزم Plugins المضمّنة (مثل Discord Plugin `src/channel.setup.ts`) للحصول على أمثلة كاملة.

<AccordionGroup>
  <Accordion title="مطالبات allowFrom المشتركة">
    لمطالبات قائمة السماح للرسائل المباشرة التي لا تحتاج إلا إلى مسار `note -> prompt -> parse -> merge -> patch` القياسي، فضّل مساعدات الإعداد المشتركة من `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`، و`createTopLevelChannelParsedAllowFromPrompt(...)`، و`createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="حالة إعداد القناة القياسية">
    لكتل حالة إعداد القناة التي لا تختلف إلا بحسب التسميات والدرجات والأسطر الإضافية الاختيارية، فضّل `createStandardChannelSetupStatus(...)` من `openclaw/plugin-sdk/setup` بدلًا من إنشاء كائن `status` نفسه يدويًا في كل Plugin.
  </Accordion>
  <Accordion title="سطح إعداد القناة الاختياري">
    لأسطح الإعداد الاختيارية التي يجب أن تظهر فقط في سياقات معينة، استخدم `createOptionalChannelSetupSurface` من `openclaw/plugin-sdk/channel-setup`:

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

    يعرّض `plugin-sdk/channel-setup` أيضًا البانيين الأدنى مستوى `createOptionalChannelSetupAdapter(...)` و`createOptionalChannelSetupWizard(...)` عندما لا تحتاج إلا إلى نصف واحد من سطح التثبيت الاختياري ذلك.

    يفشل المحول/المعالج الاختياري المولّد بشكل مغلق عند عمليات كتابة الإعدادات الحقيقية. ويعيد استخدام رسالة واحدة تفيد بأن التثبيت مطلوب عبر `validateInput` و`applyAccountConfig` و`finalize`، ويضيف رابط مستندات عندما يتم ضبط `docsPath`.

  </Accordion>
  <Accordion title="مساعدات الإعداد المدعومة بالثنائيات">
    لواجهات الإعداد المدعومة بالثنائيات، فضّل المساعدات المشتركة المفوضة بدلًا من نسخ غراء الثنائي/الحالة نفسه إلى كل قناة:

    - `createDetectedBinaryStatus(...)` لكتل الحالة التي لا تختلف إلا بحسب التسميات والتلميحات والدرجات واكتشاف الثنائي
    - `createCliPathTextInput(...)` لمدخلات النص المدعومة بالمسارات
    - `createDelegatedSetupWizardStatusResolvers(...)`، و`createDelegatedPrepare(...)`، و`createDelegatedFinalize(...)`، و`createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى التمرير إلى معالج كامل أثقل بشكل كسول
    - `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط إلى تفويض قرار `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## النشر والتثبيت

**Plugins الخارجية:** انشر إلى [ClawHub](/ar/tools/clawhub)، ثم ثبّت:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    تثبّت مواصفات الحزم المجردة من npm أثناء انتقال الإطلاق.

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

**المكونات الإضافية داخل المستودع:** ضعها ضمن شجرة مساحة عمل المكونات الإضافية المضمّنة، وسيتم اكتشافها تلقائيًا أثناء البناء.

**يمكن للمستخدمين التثبيت:**

```bash
openclaw plugins install <package-name>
```

<Info>
بالنسبة إلى عمليات التثبيت من مصدر npm، يثبّت `openclaw plugins install` الحزمة ضمن `~/.openclaw/npm` مع تعطيل نصوص دورة الحياة. أبقِ أشجار اعتماد المكوّن الإضافي JS/TS صرفة، وتجنّب الحزم التي تتطلب عمليات بناء `postinstall`.
</Info>

<Note>
لا يثبّت بدء تشغيل Gateway اعتماديات المكوّن الإضافي. تتحكم تدفقات تثبيت npm/git/ClawHub في تقارب الاعتماديات؛ ويجب أن تكون اعتماديات المكونات الإضافية المحلية مثبتة مسبقًا.
</Note>

بيانات تعريف الحزمة المضمّنة صريحة، ولا تُستنتج من JavaScript المبني عند بدء تشغيل Gateway. تنتمي اعتماديات وقت التشغيل إلى حزمة المكوّن الإضافي التي تملكها؛ ولا يقوم بدء تشغيل OpenClaw المعبّأ أبدًا بإصلاح اعتماديات المكوّن الإضافي أو عكسها.

## ذو صلة

- [بناء المكونات الإضافية](/ar/plugins/building-plugins) — دليل بدء خطوة بخطوة
- [بيان Plugin](/ar/plugins/manifest) — مرجع مخطط البيان الكامل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — `definePluginEntry` و`defineChannelPluginEntry`
