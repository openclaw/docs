---
doc-schema-version: 1
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير الإضافات
    - أنت تختار بين وثائق القناة أو المزوّد أو واجهة CLI الخلفية أو الأداة أو الخطاف
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لك في OpenClaw خلال دقائق
title: إنشاء Plugins
x-i18n:
    generated_at: "2026-07-16T14:36:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw دون تغيير النواة. يمكن أن يضيف Plugin قناة
مراسلة، أو موفّر نموذج، أو واجهة CLI خلفية محلية، أو أداة وكيل، أو خطافًا، أو موفّر وسائط،
أو قدرة أخرى يملكها Plugin.

لا يلزم إضافة Plugin خارجي إلى مستودع OpenClaw. انشر
الحزمة على [ClawHub](/clawhub)، ويمكن للمستخدمين تثبيتها باستخدام:

```bash
openclaw plugins install clawhub:<package-name>
```

تظل مواصفات الحزم المجرّدة تُثبَّت من npm خلال مرحلة الانتقال عند الإطلاق. استخدم البادئة
`clawhub:` عندما تريد الحل عبر ClawHub.

## المتطلبات

- Node 22.22.3+، أو Node 24.15+، أو Node 25.9+، و`npm` أو `pnpm`.
- وحدات TypeScript ESM.
- للعمل على Plugin مضمّن داخل المستودع، استنسخ المستودع وشغّل `pnpm install`.
  يقتصر تطوير Plugins من نسخة المصدر على pnpm لأن OpenClaw يكتشف
  Plugins المضمّنة من حزم مساحة العمل `extensions/*`.

## اختيار بنية Plugin

<CardGroup cols={2}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    صِل OpenClaw بمنصة مراسلة.
  </Card>
  <Card title="Plugin موفّر" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف موفّر نموذج أو وسائط أو بحث أو جلب أو كلام أو وقت فعلي.
  </Card>
  <Card title="Plugin واجهة CLI خلفية" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    شغّل CLI محلية للذكاء الاصطناعي عبر احتياط نموذج OpenClaw.
  </Card>
  <Card title="Plugin أداة" icon="wrench" href="/ar/plugins/tool-plugins">
    سجّل أدوات الوكيل.
  </Card>
</CardGroup>

## البدء السريع

أنشئ Plugin أداة بسيطًا بتسجيل أداة وكيل واحدة مطلوبة. هذه هي
أقصر بنية مفيدة لـ Plugin، وتشمل الحزمة والبيان ونقطة الدخول
والتحقق المحلي.

<Steps>
  <Step title="إنشاء بيانات الحزمة الوصفية">
    <CodeGroup>

```json package.json
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

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    ينبغي أن تشير إدخالات وقت التشغيل في Plugins الخارجية المنشورة إلى ملفات JavaScript
    المبنية. راجع [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) للاطلاع على عقد نقطة
    الدخول الكامل.

    يحتاج كل Plugin إلى بيان، حتى دون إعدادات. يجب أن تظهر أدوات وقت التشغيل
    في `contracts.tools` لكي يتمكن OpenClaw من اكتشاف الملكية دون
    تحميل وقت تشغيل كل Plugin مسبقًا. عيّن `activation.onStartup`
    عن قصد؛ إذ يُحمَّل هذا المثال عند بدء تشغيل Gateway.

    تخضع أسطح Plugins الموثوقة من المضيف أيضًا لقيود البيان، وتتطلب تصريحًا
    صريحًا في Plugins المثبّتة: يتطلب `api.registerAgentToolResultMiddleware(...)`
    إدراج كل وقت تشغيل مستهدف في `contracts.agentToolResultMiddleware`،
    ويتطلب `api.registerTrustedToolPolicy(...)` إدراج كل معرّف سياسة في
    `contracts.trustedToolPolicies`. تحافظ هذه التصريحات على اتساق
    الفحص وقت التثبيت مع التسجيل وقت التشغيل.

    للاطلاع على كل حقل في البيان، راجع [بيان Plugin](/ar/plugins/manifest).

  </Step>

  <Step title="تسجيل الأداة">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    استخدم `definePluginEntry` لـ Plugins غير الخاصة بالقنوات. أما Plugins القنوات فتستخدم
    `defineChannelPluginEntry` من `openclaw/plugin-sdk/core` بدلًا منه.

  </Step>

  <Step title="اختبار وقت التشغيل">
    بالنسبة إلى Plugin مثبّت أو خارجي، افحص وقت التشغيل المحمّل:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    إذا كان Plugin يسجّل أمر CLI، فشغّل ذلك الأمر أيضًا وتحقق من
    المخرجات، مثل `openclaw demo-plugin ping`.

    بالنسبة إلى Plugin مضمّن في هذا المستودع، يكتشف OpenClaw حزم Plugins
    من نسخة المصدر ضمن مساحة العمل `extensions/*`. شغّل أقرب
    اختبار مستهدف:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="اختبار تثبيت الحزمة">
    قبل نشر Plugin جاهز للحزم، اختبر بنية التثبيت نفسها التي سيحصل
    عليها المستخدمون. أضف أولًا خطوة بناء، ووجّه إدخالات وقت التشغيل مثل
    `openclaw.extensions` إلى JavaScript مبني مثل `./dist/index.js`، وتأكد
    من أن `npm pack` يتضمن مخرجات `dist/`. إدخالات مصدر TypeScript
    مخصصة فقط لنسخ المصدر ومسارات التطوير المحلية.

    بعد ذلك، حزّم Plugin وثبّت ملف tar باستخدام `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    يستخدم `npm-pack:` مشروع npm الذي يديره OpenClaw لكل Plugin، ولذلك يكتشف
    أخطاء تبعيات وقت التشغيل التي قد يخفيها الاختبار من نسخة المصدر. وهو يثبت
    بنية الحزمة والتبعيات، وليس الثقة الرسمية المرتبطة بالكتالوج.
    يجب أن تكون استيرادات وقت التشغيل في `dependencies` أو `optionalDependencies`؛
    ولن تُثبَّت التبعيات الموجودة فقط في `devDependencies` ضمن
    مشروع وقت التشغيل المُدار.

    لا تستخدم تثبيت أرشيف أو مسار خام بوصفه التحقق النهائي من سلوك Plugin
    الرسمي أو ذي الامتيازات. تفيد المصادر الخام في تصحيح الأخطاء محليًا، لكنها
    لا تثبت مسار التبعيات نفسه الذي تثبته عمليات التثبيت عبر npm أو ClawHub. إذا
    كان Plugin يعتمد على حالة Plugin رسمي موثوق، فأضف تحققًا ثانيًا
    عبر تثبيت رسمي مدعوم بكتالوج أو مسار حزمة منشورة
    يسجّل الثقة الرسمية. راجع
    [حل تبعيات Plugin](/ar/plugins/dependency-resolution) للاطلاع على
    تفاصيل جذر التثبيت وملكية التبعيات.

  </Step>

  <Step title="النشر">
    تحقّق من الحزمة قبل نشرها:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    توجد مقتطفات حزم ClawHub القياسية في `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="التثبيت">
    ثبّت الحزمة المنشورة عبر ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## تسجيل الأدوات

يمكن أن تكون الأدوات مطلوبة أو اختيارية. تتوفر الأدوات المطلوبة دائمًا عندما يكون
Plugin مفعّلًا. أما الأدوات الاختيارية فتحتاج إلى اشتراك صريح من المستخدم قبل أن يحمّل OpenClaw
وقت تشغيل Plugin المالك.

تتلقى مصانع الأدوات سياق وقت تشغيل موثوقًا، بما في ذلك `deliveryContext`،
و`nativeChannelId` لمحادثة المنصة النشطة عند توفرها، و
`requesterSenderId`.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

يجب أيضًا التصريح عن كل أداة مسجّلة باستخدام `api.registerTool(...)` في
بيان Plugin:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

يشترك المستخدمون باستخدام `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

تتحكم الأدوات الاختيارية في عرض الأداة للنموذج من عدمه. استخدم
[طلبات أذونات Plugin](/ar/plugins/plugin-permission-requests) عندما ينبغي لأداة
أو خطاف طلب الموافقة بعد أن يختاره النموذج وقبل
تنفيذ الإجراء.

استخدم الأدوات الاختيارية للآثار الجانبية أو الملفات الثنائية غير المعتادة أو القدرات التي
لا ينبغي عرضها افتراضيًا. يجب ألا تتعارض أسماء الأدوات مع أسماء أدوات
النواة؛ إذ تُتخطى التعارضات ويُبلّغ عنها في تشخيصات Plugin. كما تُتخطى
التسجيلات المشوهة ويُبلّغ عنها بالطريقة نفسها: غياب قيمة غير فارغة
لـ `name`، أو كون `execute` غير دالة، أو وجود واصف أداة دون كائن `parameters`.

تتلقى مصانع الأدوات كائن سياق يوفّره وقت التشغيل. استخدم `ctx.activeModel`
عندما تحتاج الأداة إلى تسجيل النموذج النشط للدور الحالي أو عرضه أو التكيّف معه؛ ويمكن أن يتضمن
`provider` و`modelId` و`modelRef`. تعامل معه على أنه
بيانات وصفية معلوماتية لوقت التشغيل، وليس حدًا أمنيًا في مواجهة المشغّل المحلي
أو شيفرة Plugin المثبّت أو وقت تشغيل OpenClaw المعدّل. ومع ذلك،
ينبغي أن تتطلب الأدوات المحلية الحساسة اشتراكًا صريحًا من Plugin أو المشغّل، وأن
تفشل بشكل مغلق عند غياب البيانات الوصفية للنموذج النشط أو عدم ملاءمتها.

يصرّح البيان بالملكية والاكتشاف؛ لكن التنفيذ يظل يستدعي تطبيق الأداة
المسجّل والحالي. حافظ على اتساق `toolMetadata.<tool>.optional: true`
مع `api.registerTool(..., { optional: true })` كي يتمكن OpenClaw من تجنّب
تحميل وقت تشغيل ذلك Plugin إلى أن تُدرج الأداة صراحةً في قائمة السماح.

## اصطلاحات الاستيراد

استورد من المسارات الفرعية المركزة في SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

لا تستورد من الحزمة الجذرية المهملة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

داخل حزمة Plugin، استخدم ملفات الحزمة المحلية مثل `api.ts` و
`runtime-api.ts` لعمليات الاستيراد الداخلية. لا تستورد Plugin الخاص بك عبر
مسار SDK. ينبغي أن تبقى الأدوات المساعدة الخاصة بالموفّر في حزمة الموفّر ما لم
تكن الواجهة عامة فعلًا.

طرق RPC المخصصة في Gateway هي نقطة دخول متقدمة. احتفظ بها تحت
بادئة خاصة بـ Plugin؛ إذ تظل نطاقات إدارة النواة مثل `config.*`
و`exec.approvals.*` و`operator.admin.*` و`wizard.*` و`update.*` محجوزة
وتُحل إلى `operator.admin`. ويُحجز جسر
`openclaw/plugin-sdk/gateway-method-runtime` لمسارات HTTP الخاصة بـ Plugins
التي تصرّح عن `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

للاطلاع على خريطة الاستيراد الكاملة، راجع [نظرة عامة على SDK الخاص بـ Plugin](/ar/plugins/sdk-overview).

## قائمة التحقق قبل الإرسال

<Check>يحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>بيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم جميع الاستيرادات مسارات `plugin-sdk/<subpath>` المركزة</Check>
<Check>تستخدم الاستيرادات الداخلية الوحدات المحلية، لا الاستيراد الذاتي عبر SDK</Check>
<Check>تنجح الاختبارات (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (لـ Plugins داخل المستودع)</Check>

## الاختبار مقابل الإصدارات التجريبية

1. راقب إصدارات [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). تبدو وسوم الإصدار التجريبي مثل `v2026.3.N-beta.1`. يمكنك أيضًا متابعة [@openclaw](https://x.com/openclaw) على X للاطلاع على إعلانات الإصدارات.
2. اختبر Plugin الخاص بك باستخدام وسم الإصدار التجريبي فور ظهوره. عادةً لا تتجاوز الفترة السابقة للإصدار المستقر بضع ساعات.
3. انشر في سلسلة Plugin الخاص بك ضمن قناة Discord ‏`plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)) بعد الاختبار، مع ذكر إما `all good` أو ما تعطل. أنشئ سلسلة إذا لم تكن لديك واحدة بعد.
4. إذا تعطل شيء ما، فافتح مشكلة أو حدّث مشكلة بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق التصنيف `beta-blocker`. أدرج رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>`، وأدرج رابط المشكلة في كلٍ من PR وسلسلة Discord الخاصة بك. لا يمكن للمساهمين وضع تصنيفات على طلبات PR، لذا يُعد العنوان إشارة طلب PR للمشرفين وعمليات الأتمتة. تُدمج العوائق التي لها PR؛ أما العوائق التي ليس لها PR فقد تُضمَّن في الإصدار رغم ذلك.
6. الصمت يعني أن كل شيء سليم. عادةً ما يعني تفويت هذه الفترة أن إصلاحك سيُدمج في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Plugins قنوات المراسلة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    أنشئ Plugin لقناة مراسلة
  </Card>
  <Card title="Plugins المزوّدين" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أنشئ Plugin لمزوّد نماذج
  </Card>
  <Card title="Plugins الواجهة الخلفية لـ CLI" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    سجّل واجهة خلفية محلية للذكاء الاصطناعي عبر CLI
  </Card>
  <Card title="نظرة عامة على SDK" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وواجهة API للتسجيل
  </Card>
  <Card title="أدوات التشغيل المساعدة" icon="settings" href="/ar/plugins/sdk-runtime">
    تحويل النص إلى كلام والبحث والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="الاختبار" icon="test-tubes" href="/ar/plugins/sdk-testing">
    أدوات الاختبار وأنماطه
  </Card>
  <Card title="بيان Plugin" icon="file-json" href="/ar/plugins/manifest">
    المرجع الكامل لمخطط البيان
  </Card>
</CardGroup>

## ذو صلة

- [خطافات Plugin](/ar/plugins/hooks)
- [بنية Plugin](/ar/plugins/architecture)
