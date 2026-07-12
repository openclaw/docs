---
read_when:
    - أنت تضيف معالج إعداد إلى Plugin
    - تحتاج إلى فهم `setup-entry.ts` مقارنةً بـ `index.ts`
    - أنت تُعرّف مخططات إعدادات Plugin أو بيانات OpenClaw الوصفية في package.json
sidebarTitle: Setup and config
summary: معالجات الإعداد، وsetup-entry.ts، ومخططات التكوين، وبيانات package.json الوصفية
title: إعداد Plugin وتهيئته
x-i18n:
    generated_at: "2026-07-12T06:23:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

مرجع لتحزيم Plugin (بيانات `package.json` الوصفية)، والبيانات التعريفية (`openclaw.plugin.json`)، ومداخل الإعداد، ومخططات الإعدادات.

<Tip>
**هل تبحث عن شرح تفصيلي؟** تغطي الأدلة الإرشادية التحزيم ضمن سياقه: [Plugins القنوات](/ar/plugins/sdk-channel-plugins#step-1-package-and-manifest) و[Plugins موفّري الخدمة](/ar/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## البيانات الوصفية للحزمة

يحتاج ملف `package.json` إلى حقل `openclaw` يوضّح لنظام Plugins ما يوفّره Plugin الخاص بك:

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
  <Tab title="Plugin موفّر خدمة / خط أساس ClawHub">
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
يتطلب النشر الخارجي على ClawHub الحقلين `compat` و`build`. توجد مقتطفات النشر القياسية في `docs/snippets/plugin-publish/`.
</Note>

### حقول `openclaw`

<ParamField path="extensions" type="string[]">
  ملفات نقاط الدخول (بالنسبة إلى جذر الحزمة). مداخل مصدر صالحة للتطوير ضمن مساحة العمل ونسخ git المستخرجة.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  نظائر JavaScript المبنية للحقل `extensions`، ويُفضّل استخدامها عندما يحمّل OpenClaw حزمة npm مثبّتة. راجع [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) لمعرفة ترتيب تحليل المصدر/الناتج المبني.
</ParamField>
<ParamField path="setupEntry" type="string">
  مدخل خفيف مخصّص للإعداد فقط (اختياري).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  نظير JavaScript المبني للحقل `setupEntry`. يتطلب ضبط `setupEntry` أيضًا.
</ParamField>
<ParamField path="plugin" type="object">
  هوية Plugin الاحتياطية `{ id, label }`، وتُستخدم عندما لا يحتوي Plugin على بيانات وصفية لقناة أو موفّر خدمة يمكن اشتقاق معرّف أو تسمية منها.
</ParamField>
<ParamField path="channel" type="object">
  بيانات وصفية لفهرس القنوات لواجهات الإعداد والاختيار والبدء السريع والحالة.
</ParamField>
<ParamField path="install" type="object">
  تلميحات التثبيت: `npmSpec`، و`localPath`، و`defaultChoice`، و`minHostVersion`، و`expectedIntegrity`، و`allowInvalidConfigRecovery`، و`requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  علامات سلوك بدء التشغيل.
</ParamField>
<ParamField path="compat" type="object">
  نطاق إصدار `pluginApi` الذي يدعمه Plugin هذا. مطلوب للنشر الخارجي على ClawHub.
</ParamField>

<Note>
معرّفات موفّري الخدمة (`providers: string[]`) هي بيانات وصفية للبيان التعريفي، وليست بيانات وصفية للحزمة. صرّح بها في `openclaw.plugin.json`، وليس هنا — راجع [بيان Plugin التعريفي](/ar/plugins/manifest).
</Note>

### `openclaw.channel`

يمثّل `openclaw.channel` بيانات وصفية خفيفة للحزمة، تُستخدم لاكتشاف القنوات وواجهات الإعداد قبل تحميل بيئة التشغيل.

| الحقل                                  | النوع       | معناه                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | معرّف القناة القياسي.                                                         |
| `label`                                | `string`   | التسمية الأساسية للقناة.                                                        |
| `selectionLabel`                       | `string`   | تسمية الاختيار/الإعداد عندما ينبغي أن تختلف عن `label`.                        |
| `detailLabel`                          | `string`   | تسمية تفاصيل ثانوية لفهارس القنوات وواجهات الحالة الأكثر ثراءً.       |
| `docsPath`                             | `string`   | مسار التوثيق لروابط الإعداد والاختيار.                                      |
| `docsLabel`                            | `string`   | تسمية بديلة تُستخدم لروابط التوثيق عندما ينبغي أن تختلف عن معرّف القناة. |
| `blurb`                                | `string`   | وصف موجز للتهيئة الأولية/الفهرس.                                         |
| `order`                                | `number`   | ترتيب الفرز في فهارس القنوات.                                               |
| `aliases`                              | `string[]` | أسماء بديلة إضافية للبحث عند اختيار القناة.                                   |
| `preferOver`                           | `string[]` | معرّفات Plugins/القنوات ذات الأولوية الأدنى التي ينبغي أن تتفوق عليها هذه القناة.                |
| `systemImage`                          | `string`   | اسم اختياري لأيقونة/صورة نظام في فهارس واجهة مستخدم القنوات.                      |
| `selectionDocsPrefix`                  | `string`   | نص بادئة قبل روابط التوثيق في واجهات الاختيار.                          |
| `selectionDocsOmitLabel`               | `boolean`  | عرض مسار التوثيق مباشرةً بدلًا من رابط توثيق ذي تسمية في نص الاختيار. |
| `selectionExtras`                      | `string[]` | نصوص قصيرة إضافية تُلحق بنص الاختيار.                               |
| `markdownCapable`                      | `boolean`  | يشير إلى أن القناة تدعم Markdown لاتخاذ قرارات تنسيق الرسائل الصادرة.      |
| `exposure`                             | `object`   | عناصر التحكم في ظهور القناة ضمن الإعداد والقوائم المضبوطة وواجهات التوثيق.   |
| `quickstartAllowFrom`                  | `boolean`  | تضمين هذه القناة في مسار إعداد `allowFrom` القياسي للبدء السريع.         |
| `forceAccountBinding`                  | `boolean`  | اشتراط ربط صريح بالحساب حتى عند وجود حساب واحد فقط.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | تفضيل البحث في الجلسة عند تحليل أهداف الإعلانات لهذه القناة.       |

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

- `configured`: تضمين القناة في واجهات القوائم المضبوطة/المشابهة للحالة
- `setup`: تضمين القناة في منتقيات الإعداد/الضبط التفاعلية
- `docs`: الإشارة إلى أن القناة موجّهة للجمهور في واجهات التوثيق/التنقل

<Note>
يظل `showConfigured` و`showInSetup` مدعومين كأسماء بديلة قديمة. يُفضّل استخدام `exposure`.
</Note>

### `openclaw.install`

يمثّل `openclaw.install` بيانات وصفية للحزمة، وليس للبيان التعريفي.

| الحقل                        | النوع                                | معناه                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | مواصفة ClawHub القياسية لمسارات التثبيت/التحديث والتثبيت عند الطلب أثناء التهيئة الأولية. |
| `npmSpec`                    | `string`                            | مواصفة npm القياسية لمسارات التثبيت/التحديث الاحتياطية.                             |
| `localPath`                  | `string`                            | مسار التطوير المحلي أو التثبيت المضمّن.                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | مصدر التثبيت المفضّل عند توفر مصادر متعددة.                     |
| `minHostVersion`             | `string`                            | أدنى إصدار مدعوم من OpenClaw، بصيغة `>=x.y.z` أو `>=x.y.z-prerelease`.            |
| `expectedIntegrity`          | `string`                            | سلسلة سلامة توزيعة npm المتوقعة، وعادةً `sha512-...`، للتثبيتات المثبّتة الإصدار.    |
| `allowInvalidConfigRecovery` | `boolean`                           | يتيح لمسارات إعادة تثبيت Plugin مضمّن التعافي من حالات محددة لفشل الإعدادات القديمة.  |
| `requiredPlatformPackages`   | `string[]`                          | أسماء npm البديلة المطلوبة الخاصة بالمنصة التي يجري التحقق منها أثناء تثبيت npm.               |

<AccordionGroup>
  <Accordion title="سلوك التهيئة الأولية">
    تستخدم التهيئة الأولية التفاعلية `openclaw.install` لواجهات التثبيت عند الطلب: إذا كان Plugin الخاص بك يعرض خيارات مصادقة موفّر الخدمة أو بيانات إعداد/فهرس القنوات قبل تحميل بيئة التشغيل، فيمكن للتهيئة الأولية مطالبة المستخدم بالتثبيت من ClawHub أو npm أو محليًا، ثم تثبيت Plugin أو تمكينه، ثم متابعة المسار المحدد. تستخدم خيارات ClawHub الحقل `clawhubSpec` وتُفضّل عند وجوده؛ وتتطلب خيارات npm بيانات وصفية موثوقة للفهرس تتضمن `npmSpec` من السجل (الإصدارات الدقيقة و`expectedIntegrity` قيود اختيارية، ويُفرض تطبيقها عند التثبيت/التحديث عند ضبطها). احتفظ بتفاصيل «ما يجب عرضه» في `openclaw.plugin.json` و«كيفية تثبيته» في `package.json`.
  </Accordion>
  <Accordion title="فرض minHostVersion">
    إذا ضُبط `minHostVersion`، فسيُفرض عند التثبيت وعند تحميل سجل البيانات التعريفية غير المضمّنة. تتخطى المضيفات الأقدم Plugins الخارجية، وتُرفض سلاسل الإصدارات غير الصالحة. يُفترض أن Plugins المصدر المضمّنة تستخدم الإصدار نفسه لنسخة المضيف المستخرجة.
  </Accordion>
  <Accordion title="تثبيتات npm المثبّتة الإصدار">
    بالنسبة إلى تثبيتات npm المثبّتة الإصدار، احتفظ بالإصدار الدقيق في `npmSpec` وأضف سلامة العنصر البرمجي المتوقعة:

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
    لا يمثّل `allowInvalidConfigRecovery` تجاوزًا عامًا للإعدادات المعطّلة. فهو مخصّص فقط للتعافي المحدود لـ Plugin مضمّن، إذ يسمح لإعادة التثبيت/الإعداد بإصلاح بقايا معروفة من الترقيات، مثل فقدان مسار Plugin مضمّن أو وجود إدخال `channels.<id>` قديم لـ Plugin نفسه. إذا كانت الإعدادات معطّلة لأسباب غير مرتبطة، فسيظل التثبيت يفشل وفق نهج الإغلاق الآمن، ويطلب من المشغّل تشغيل `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### تأجيل التحميل الكامل

يمكن لـ Plugins القنوات الاشتراك في التحميل المؤجّل باستخدام:

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

عند تمكينه، يحمّل OpenClaw الحقل `setupEntry` فقط خلال مرحلة بدء التشغيل السابقة للاستماع، حتى للقنوات المضبوطة مسبقًا. ويُحمّل المدخل الكامل بعد أن يبدأ Gateway الاستماع.

<Warning>
لا تمكّن التحميل المؤجّل إلا عندما يسجّل `setupEntry` كل ما يحتاجه Gateway قبل أن يبدأ الاستماع (تسجيل القناة، ومسارات HTTP، وأساليب Gateway). إذا كان المدخل الكامل يملك إمكانات بدء تشغيل مطلوبة، فاحتفظ بالسلوك الافتراضي.
</Warning>

إذا كان مدخل الإعداد/المدخل الكامل يسجّل أساليب RPC في Gateway، فاحتفظ بها ضمن بادئة خاصة بـ Plugin. تظل نطاقات إدارة النواة المحجوزة (`config.*`، و`exec.approvals.*`، و`wizard.*`، و`update.*`) مملوكة للنواة، وتُطبّع دائمًا إلى `operator.admin`.

## بيان Plugin التعريفي

يجب أن يوفّر كل Plugin أصلي ملف `openclaw.plugin.json` في جذر الحزمة. يستخدم OpenClaw هذا الملف للتحقق من صحة الإعدادات دون تنفيذ شيفرة Plugin.

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

بالنسبة إلى Plugins القنوات، أضف `channels` (وتضيف Plugins المزوّدات `providers`):

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

حتى Plugins التي لا تحتوي على إعدادات يجب أن توفّر مخططًا. المخطط الفارغ صالح:

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

تستخدم حزم Skills وPlugins أوامر نشر منفصلة في ClawHub. بالنسبة إلى حزم Plugins، استخدم الأمر الخاص بالحزم:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
الأمر `clawhub skill publish <path>` مختلف ومخصّص لنشر مجلد Skill، وليس حزمة Plugin. راجع [النشر على ClawHub](/ar/clawhub/publishing).
</Note>

## مدخل الإعداد

يُعد `setup-entry.ts` بديلًا خفيفًا لـ `index.ts`، ويحمّله OpenClaw عندما يحتاج فقط إلى واجهات الإعداد (التهيئة الأولية، وإصلاح الإعدادات، وفحص القنوات المعطّلة):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

يؤدي ذلك إلى تجنّب تحميل شيفرة وقت التشغيل الثقيلة (مكتبات التشفير، وتسجيلات CLI، وخدمات الخلفية) أثناء تدفقات الإعداد.

يمكن لقنوات مساحة العمل المضمّنة التي تحتفظ بصادرات آمنة للإعداد في وحدات جانبية استخدام `defineBundledChannelSetupEntry(...)` من `openclaw/plugin-sdk/channel-entry-contract` بدلًا من `defineSetupPluginEntry(...)`. يدعم هذا العقد المضمّن أيضًا تصدير `runtime` اختياريًا، بحيث تظل توصيلات وقت التشغيل في أثناء الإعداد خفيفة وصريحة.

<AccordionGroup>
  <Accordion title="متى يستخدم OpenClaw setupEntry بدلًا من المدخل الكامل">
    - تكون القناة معطّلة، لكنها تحتاج إلى واجهات الإعداد أو التهيئة الأولية.
    - تكون القناة مفعّلة، لكنها غير مضبوطة.
    - يكون التحميل المؤجّل مفعّلًا (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="ما يجب أن يسجّله setupEntry">
    - كائن Plugin القناة (عبر `defineSetupPluginEntry`).
    - أي مسارات HTTP مطلوبة قبل بدء Gateway الاستماع.
    - أي أساليب Gateway مطلوبة أثناء بدء التشغيل.

    يجب أن تظل أساليب Gateway الخاصة ببدء التشغيل هذه متجنّبة لمساحات أسماء الإدارة الأساسية المحجوزة، مثل `config.*` أو `update.*`.

  </Accordion>
  <Accordion title="ما يجب ألّا يتضمنه setupEntry">
    - تسجيلات CLI.
    - خدمات الخلفية.
    - استيرادات وقت التشغيل الثقيلة (التشفير، وحِزم SDK).
    - أساليب Gateway التي لا تكون مطلوبة إلا بعد بدء التشغيل.

  </Accordion>
</AccordionGroup>

### استيرادات مساعد الإعداد المحدودة

بالنسبة إلى المسارات السريعة الخاصة بالإعداد فقط، فضّل واجهات مساعد الإعداد المحدودة على الواجهة الشاملة الأوسع `plugin-sdk/setup` عندما لا تحتاج إلا إلى جزء من واجهة الإعداد:

| مسار الاستيراد                        | استخدامه                                                                                | الصادرات الرئيسية                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | مساعدات وقت التشغيل في أثناء الإعداد التي تظل متاحة في `setupEntry` / بدء تشغيل القناة المؤجّل | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | اسم بديل متوافق مهمل؛ استخدم `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | مساعدات CLI والأرشيف والمستندات الخاصة بالإعداد والتثبيت                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

استخدم الواجهة الأوسع `plugin-sdk/setup` عندما تريد مجموعة أدوات الإعداد المشتركة الكاملة، بما في ذلك مساعدات تصحيح الإعدادات مثل `moveSingleAccountChannelSectionToDefaultAccount(...)`.

استخدم `createSetupTranslator(...)` للنصوص الثابتة في معالج الإعداد. فهو يتبع لغة معالج CLI (`OPENCLAW_LOCALE`، ثم متغيرات لغة النظام)، ويعود إلى الإنجليزية عند التعذّر. احتفظ بنصوص الإعداد الخاصة بكل Plugin داخل الشيفرة التي يملكها ذلك Plugin، واستخدم مفاتيح الكتالوج المشتركة فقط لتسميات الإعداد العامة، ونصوص الحالة، ونصوص إعداد Plugins الرسمية المضمّنة.

تظل محوّلات تصحيح الإعداد آمنة عند استيرادها في المسار السريع. ويكون البحث في واجهة عقد ترقية الحساب الفردي المضمّنة كسولًا، لذا لا يؤدي استيراد `plugin-sdk/setup-runtime` إلى تحميل اكتشاف واجهة العقد المضمّنة مسبقًا قبل استخدام المحوّل فعليًا.

### ترقية الحساب الفردي المملوكة للقناة

عندما تنتقل قناة من إعداد علوي لحساب فردي إلى `channels.<id>.accounts.*`، ينقل السلوك المشترك الافتراضي القيم المرقّاة الخاصة بالحساب إلى `accounts.default`.

يمكن للقنوات المضمّنة تضييق نطاق هذه الترقية أو تجاوزها عبر واجهة عقد الإعداد الخاصة بها:

- `singleAccountKeysToMove`: مفاتيح علوية إضافية يجب نقلها إلى الحساب المرقّى
- `namedAccountPromotionKeys`: عندما تكون الحسابات المسماة موجودة بالفعل، تُنقل هذه المفاتيح فقط إلى الحساب المرقّى؛ وتبقى مفاتيح السياسة والتسليم المشتركة في جذر القناة
- `resolveSingleAccountPromotionTarget(...)`: اختيار الحساب الموجود الذي يتلقى القيم المرقّاة

<Note>
يُعد Matrix المثال المضمّن الحالي. إذا كان هناك حساب Matrix مسمى واحد بالضبط، أو إذا كان `defaultAccount` يشير إلى مفتاح موجود غير قياسي مثل `Ops`، فستحافظ الترقية على ذلك الحساب بدلًا من إنشاء إدخال `accounts.default` جديد.
</Note>

## مخطط الإعدادات

يُتحقق من صحة إعدادات Plugin وفق JSON Schema الموجود في البيان. يضبط المستخدمون Plugins عبر:

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

### إنشاء مخططات إعدادات القنوات

استخدم `buildChannelConfigSchema` لتحويل مخطط Zod إلى غلاف `ChannelConfigSchema` المستخدم في عناصر الإعدادات التي يملكها Plugin:

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

إذا كنت تنشئ العقد أصلًا بصيغة JSON Schema أو TypeBox، فاستخدم المساعد المباشر لكي يتمكن OpenClaw من تجاوز التحويل من Zod إلى JSON Schema في مسارات البيانات الوصفية:

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

بالنسبة إلى Plugins التابعة لجهات خارجية، يظل عقد المسار البارد هو بيان Plugin: انسخ JSON Schema المُنشأ إلى `openclaw.plugin.json#channelConfigs` بحيث تتمكن واجهات مخطط الإعدادات والإعداد وواجهة المستخدم من فحص `channels.<id>` دون تحميل شيفرة وقت التشغيل.

## معالجات الإعداد

يمكن لـ Plugins القنوات توفير معالجات إعداد تفاعلية للأمر `openclaw onboard`. المعالج هو كائن `ChannelSetupWizard` في `ChannelPlugin`:

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

يدعم `ChannelSetupWizard` أيضًا `textInputs` و`dmPolicy` و`allowFrom` و`groupAccess` و`prepare` و`finalize` وغير ذلك. راجع `src/setup-core.ts` الخاص بـ Plugin Discord للاطلاع على مثال مضمّن كامل.

<AccordionGroup>
  <Accordion title="مطالبات allowFrom المشتركة">
    بالنسبة إلى مطالبات قائمة السماح للرسائل المباشرة التي لا تحتاج إلا إلى التدفق القياسي `note -> prompt -> parse -> merge -> patch`، فضّل مساعدات الإعداد المشتركة من `openclaw/plugin-sdk/setup`: ‏`createPromptParsedAllowFromForAccount(...)` و`createTopLevelChannelParsedAllowFromPrompt(...)` و`createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="حالة إعداد القناة القياسية">
    بالنسبة إلى كتل حالة إعداد القناة التي لا تختلف إلا في التسميات والدرجات والأسطر الإضافية الاختيارية، فضّل `createStandardChannelSetupStatus(...)` من `openclaw/plugin-sdk/setup` بدلًا من إنشاء كائن `status` نفسه يدويًا في كل Plugin.
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

    يوفّر `plugin-sdk/channel-setup` أيضًا أداتي الإنشاء منخفضتي المستوى `createOptionalChannelSetupAdapter(...)` و`createOptionalChannelSetupWizard(...)` عندما لا تحتاج إلا إلى نصف واحد من واجهة التثبيت الاختيارية هذه.

    تتعطل الواجهة الاختيارية/المعالج الاختياري المُنشآن بصورة آمنة عند إجراء عمليات كتابة فعلية للإعدادات. ويعيدان استخدام رسالة واحدة تفيد بضرورة التثبيت عبر `validateInput` و`applyAccountConfig` و`finalize`، ويضيفان رابطًا للوثائق عندما تكون `docsPath` معيّنة.

  </Accordion>
  <Accordion title="مساعدات الإعداد المدعومة بملفات ثنائية">
    بالنسبة إلى واجهات الإعداد المدعومة بملفات ثنائية، يُفضّل استخدام المساعدات المشتركة المفوّضة بدلًا من نسخ منطق الملف الثنائي/الحالة نفسه إلى كل قناة:

    - `createDetectedBinaryStatus(...)` لكتل الحالة التي لا تختلف إلا في التسميات والتلميحات والدرجات واكتشاف الملف الثنائي
    - `createCliPathTextInput(...)` لمدخلات النص المستندة إلى مسار
    - `createDelegatedSetupWizardStatusResolvers(...)` و`createDelegatedPrepare(...)` و`createDelegatedFinalize(...)` و`createDelegatedResolveConfigured(...)` عندما يحتاج `setupEntry` إلى إعادة التوجيه إلى معالج كامل أثقل بطريقة كسولة
    - `createDelegatedTextInputShouldPrompt(...)` عندما يحتاج `setupEntry` فقط إلى تفويض قرار `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## النشر والتثبيت

**الإضافات الخارجية:** انشرها على [ClawHub](/ar/clawhub)، ثم ثبّتها:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    تُثبَّت مواصفات الحزم المجرّدة من npm أثناء الانتقال عند التشغيل، ما لم يتطابق الاسم مع معرّف إضافة مضمّنة أو رسمية، وعندئذٍ يستخدم OpenClaw تلك النسخة المحلية/الرسمية بدلًا منها. استخدم `clawhub:` أو `npm:` أو `git:` أو `npm-pack:` لاختيار المصدر بصورة حتمية — راجع [إدارة الإضافات](/ar/plugins/manage-plugins).

  </Tab>
  <Tab title="ClawHub فقط">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="مواصفة حزمة npm">
    استخدم npm عندما لا تكون الحزمة قد انتقلت إلى ClawHub بعد، أو عندما تحتاج إلى
    مسار تثبيت مباشر من npm أثناء الترحيل:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**الإضافات داخل المستودع:** ضعها ضمن شجرة مساحة عمل الإضافات المضمّنة؛ إذ تُكتشف تلقائيًا أثناء البناء.

<Info>
بالنسبة إلى عمليات التثبيت من مصدر npm، يثبّت `openclaw plugins install` الحزمة في مشروع خاص بكل إضافة ضمن `~/.openclaw/npm/projects` مع تعطيل نصوص دورة الحياة (`--ignore-scripts`). أبقِ أشجار اعتماديات الإضافات مقتصرة على JS/TS، وتجنّب الحزم التي تتطلب عمليات بناء `postinstall`.
</Info>

<Note>
لا يثبّت بدء تشغيل Gateway اعتماديات الإضافات. تتولى تدفقات تثبيت npm/git/ClawHub عملية توحيد الاعتماديات؛ ويجب أن تكون اعتماديات الإضافات المحلية مثبّتة مسبقًا.
</Note>

بيانات تعريف الحزم المضمّنة صريحة، ولا تُستنتج من JavaScript المبني عند بدء تشغيل Gateway. تنتمي اعتماديات وقت التشغيل إلى حزمة الإضافة المالكة لها؛ ولا يُصلح تشغيل OpenClaw المعبّأ اعتماديات الإضافات ولا يعكسها مطلقًا.

## ذو صلة

- [إنشاء الإضافات](/ar/plugins/building-plugins) — دليل بدء تدريجي خطوة بخطوة
- [بيان الإضافة](/ar/plugins/manifest) — مرجع مخطط البيان الكامل
- [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) — `definePluginEntry` و`defineChannelPluginEntry`
