---
doc-schema-version: 1
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تختار بين وثائق القناة أو المزوّد أو الواجهة الخلفية لـ CLI أو الأداة أو نقطة الربط
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لك في OpenClaw خلال دقائق
title: إنشاء Plugins
x-i18n:
    generated_at: "2026-07-12T06:13:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw من دون تغيير النواة. يمكن لـ Plugin إضافة قناة
مراسلة، أو موفّر نماذج، أو واجهة CLI خلفية محلية، أو أداة للوكيل، أو خطاف، أو موفّر وسائط،
أو قدرة أخرى يملكها Plugin.

لا تحتاج إلى إضافة Plugin خارجي إلى مستودع OpenClaw. انشر
الحزمة على [ClawHub](/clawhub)، ويمكن للمستخدمين تثبيتها باستخدام:

```bash
openclaw plugins install clawhub:<package-name>
```

تظل مواصفات الحزم المجرّدة تُثبَّت من npm خلال فترة الانتقال عند الإطلاق. استخدم
البادئة `clawhub:` عندما تريد الحل عبر ClawHub.

## المتطلبات

- Node 22.19+، أو Node 23.11+، أو Node 24+، و`npm` أو `pnpm`.
- وحدات TypeScript بنمط ESM.
- للعمل على Plugin مضمّن داخل المستودع، استنسخ المستودع وشغّل `pnpm install`.
  يقتصر تطوير Plugins من نسخة الشيفرة المصدرية على pnpm لأن OpenClaw يكتشف
  Plugins المضمّنة من حزم مساحة العمل `extensions/*`.

## اختر بنية Plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    صِل OpenClaw بمنصة مراسلة.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف موفّر نماذج، أو وسائط، أو بحث، أو جلب، أو كلام، أو وقت فعلي.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    شغّل CLI محلية للذكاء الاصطناعي من خلال الرجوع الاحتياطي لنماذج OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/ar/plugins/tool-plugins">
    سجّل أدوات الوكيل.
  </Card>
</CardGroup>

## البدء السريع

أنشئ Plugin أدوات بسيطًا عبر تسجيل أداة وكيل إلزامية واحدة. هذه هي
أقصر بنية مفيدة لـ Plugin، وتشمل الحزمة والبيان ونقطة الدخول
والتحقق المحلي.

<Steps>
  <Step title="Create package metadata">
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

    يحتاج كل Plugin إلى بيان، حتى من دون إعدادات. يجب أن تظهر أدوات وقت التشغيل
    في `contracts.tools` حتى يتمكن OpenClaw من اكتشاف الملكية من دون
    تحميل وقت تشغيل كل Plugin مسبقًا. اضبط `activation.onStartup`
    عن قصد؛ يُحمَّل هذا المثال عند بدء تشغيل Gateway.

    تخضع أسطح Plugins الموثوق بها من المضيف أيضًا لبوابة البيان، وتتطلب تصريحًا
    صريحًا لـ Plugins المثبّتة: يتطلب `api.registerAgentToolResultMiddleware(...)`
    إدراج كل وقت تشغيل مستهدف في `contracts.agentToolResultMiddleware`،
    ويتطلب `api.registerTrustedToolPolicy(...)` إدراج معرّف كل سياسة في
    `contracts.trustedToolPolicies`. تُبقي هذه التصريحات الفحص وقت التثبيت
    وتسجيل وقت التشغيل متوافقين.

    للاطلاع على كل حقل في البيان، راجع [بيان Plugin](/ar/plugins/manifest).

  </Step>

  <Step title="Register the tool">
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

    استخدم `definePluginEntry` مع Plugins غير الخاصة بالقنوات. أما Plugins القنوات فتستخدم
    `defineChannelPluginEntry` من `openclaw/plugin-sdk/core` بدلًا منه.

  </Step>

  <Step title="Test the runtime">
    بالنسبة إلى Plugin مثبّت أو خارجي، افحص وقت التشغيل المحمّل:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    إذا كان Plugin يسجّل أمر CLI، فشغّل ذلك الأمر أيضًا وتحقق
    من المخرجات، مثل `openclaw demo-plugin ping`.

    بالنسبة إلى Plugin مضمّن في هذا المستودع، يكتشف OpenClaw حزم Plugins
    في نسخة الشيفرة المصدرية من مساحة العمل `extensions/*`. شغّل أقرب
    اختبار مستهدف:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    قبل نشر Plugin جاهز للحزم، اختبر بنية التثبيت نفسها التي
    سيحصل عليها المستخدمون. أضف أولًا خطوة بناء، ووجّه إدخالات وقت التشغيل مثل
    `openclaw.extensions` إلى JavaScript المبني مثل `./dist/index.js`، وتأكد
    من أن `npm pack` يتضمن مخرجات `dist/`. إدخالات شيفرة TypeScript المصدرية
    مخصّصة فقط لنسخ الشيفرة المصدرية ومسارات التطوير المحلي.

    بعد ذلك، حزّم Plugin وثبّت ملف tarball باستخدام `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    يستخدم `npm-pack:` مشروع npm المُدار لكل Plugin في OpenClaw، لذا فهو يكتشف
    أخطاء تبعيات وقت التشغيل التي قد يخفيها الاختبار من نسخة الشيفرة المصدرية. وهو يثبت
    صحة بنية الحزمة والتبعيات، لا الثقة الرسمية المرتبطة بالكتالوج.
    يجب أن تكون استيرادات وقت التشغيل ضمن `dependencies` أو `optionalDependencies`؛
    ولن تُثبَّت التبعيات الموجودة فقط في `devDependencies` ضمن
    مشروع وقت التشغيل المُدار.

    لا تستخدم تثبيتًا أوليًا من أرشيف/مسار بوصفه الإثبات النهائي لسلوك Plugin رسمي أو ذي امتيازات. تفيد المصادر الأولية في تصحيح الأخطاء محليًا، لكنها لا تثبت استخدام مسار التبعيات نفسه الذي تستخدمه عمليات التثبيت عبر npm أو ClawHub. إذا كان Plugin الخاص بك يعتمد على حالة Plugin رسمي موثوق، فأضف إثباتًا ثانيًا من خلال تثبيت رسمي مدعوم بكتالوج، أو من خلال مسار حزمة منشورة يسجل الثقة الرسمية. راجع
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
    ثبّت الحزمة المنشورة من خلال ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## تسجيل الأدوات

يمكن أن تكون الأدوات مطلوبة أو اختيارية. تكون الأدوات المطلوبة متاحة دائمًا عند تمكين
Plugin. وتتطلب الأدوات الاختيارية موافقة صريحة من المستخدم قبل أن يحمّل OpenClaw
بيئة تشغيل Plugin المالك لها.

تتلقى مصانع الأدوات سياق تشغيل موثوقًا، بما في ذلك `deliveryContext`،
و`nativeChannelId` لمحادثة المنصة النشطة عند توفره،
و`requesterSenderId`.

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

يختار المستخدمون الاشتراك باستخدام `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

تتحكم الأدوات الاختيارية في ما إذا كانت الأداة ستُعرض للنموذج. استخدم
[طلبات أذونات Plugin](/ar/plugins/plugin-permission-requests) عندما ينبغي لأداة
أو نقطة ربط طلب الموافقة بعد أن يحددها النموذج وقبل تنفيذ
الإجراء.

استخدم الأدوات الاختيارية للآثار الجانبية أو الملفات التنفيذية غير المعتادة أو الإمكانات التي
ينبغي ألا تُعرض افتراضيًا. يجب ألا تتعارض أسماء الأدوات مع أسماء الأدوات الأساسية؛
تُتخطى التعارضات ويُبلّغ عنها في تشخيصات Plugin. كما تُتخطى
التسجيلات غير الصالحة ويُبلّغ عنها بالطريقة نفسها: غياب `name`
غير فارغ، أو كون `execute` غير دالة، أو وجود واصف أداة بلا كائن
`parameters`.

تتلقى مصانع الأدوات كائن سياق توفره بيئة التشغيل. استخدم `ctx.activeModel`
عندما تحتاج أداة إلى تسجيل النموذج النشط للدور الحالي أو عرضه أو التكيف معه؛ ويمكن أن
يتضمن `provider` و`modelId` و`modelRef`. تعامل معه بوصفه
بيانات وصفية معلوماتية لبيئة التشغيل، لا حدًا أمنيًا في مواجهة المشغّل المحلي
أو كود Plugin المثبّت أو بيئة تشغيل OpenClaw معدّلة. ينبغي
للأدوات المحلية الحساسة أن تظل تتطلب اشتراكًا صريحًا من Plugin أو المشغّل،
وأن تفشل بصورة مغلقة عند غياب البيانات الوصفية للنموذج النشط أو عدم ملاءمتها.

يصرّح البيان بالملكية والاكتشاف؛ لكن التنفيذ يظل يستدعي تطبيق الأداة
المسجّل والفعّال. حافظ على محاذاة `toolMetadata.<tool>.optional: true`
مع `api.registerTool(..., { optional: true })` حتى يتمكن OpenClaw من تجنب
تحميل بيئة تشغيل Plugin تلك إلى أن تُضاف الأداة صراحةً إلى قائمة السماح.

## اصطلاحات الاستيراد

استورد من المسارات الفرعية المركّزة لحزمة SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

لا تستورد من وحدة التصدير الجذرية المهملة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

داخل حزمة Plugin الخاصة بك، استخدم ملفات تصدير محلية مثل `api.ts` و
`runtime-api.ts` لعمليات الاستيراد الداخلية. لا تستورد Plugin الخاص بك عبر
مسار SDK. ينبغي أن تبقى الأدوات المساعدة الخاصة بموفّر معين في حزمة الموفّر، ما لم
تكن الواجهة عامة بالفعل.

تُعد طرق RPC المخصصة في Gateway نقطة دخول متقدمة. أبقِها ضمن
بادئة خاصة بـPlugin؛ وتظل نطاقات الإدارة الأساسية مثل `config.*`
و`exec.approvals.*` و`operator.admin.*` و`wizard.*` و`update.*` محجوزة
وتُحل إلى `operator.admin`. جسر
`openclaw/plugin-sdk/gateway-method-runtime` محجوز لمسارات HTTP الخاصة بـPlugin
التي تصرّح عن `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

للاطلاع على خريطة الاستيراد الكاملة، راجع [نظرة عامة على SDK الخاص بـPlugin](/ar/plugins/sdk-overview).

## قائمة التحقق قبل الإرسال

<Check>يحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>بيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم جميع عمليات الاستيراد مسارات `plugin-sdk/<subpath>` المركّزة</Check>
<Check>تستخدم عمليات الاستيراد الداخلية وحدات محلية، لا استيراد Plugin لنفسه عبر SDK</Check>
<Check>تنجح الاختبارات (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (لوحدات Plugin داخل المستودع)</Check>

## الاختبار مقابل الإصدارات التجريبية

1. راقب إصدارات [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). تبدو وسوم الإصدار التجريبي مثل `v2026.3.N-beta.1`. يمكنك أيضًا متابعة [@openclaw](https://x.com/openclaw) على X للاطلاع على إعلانات الإصدارات.
2. اختبر Plugin الخاص بك باستخدام وسم الإصدار التجريبي فور ظهوره. عادةً لا تتجاوز المهلة السابقة للإصدار المستقر بضع ساعات.
3. بعد الاختبار، انشر في سلسلة Plugin الخاصة بك ضمن قناة `plugin-forum` على Discord ‏([discord.gg/clawd](https://discord.gg/clawd))، واكتب إما `all good` أو وضّح ما تعطّل. أنشئ سلسلة إذا لم تكن لديك واحدة بعد.
4. إذا تعطّل شيء ما، فافتح مشكلة أو حدّث مشكلة بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق التصنيف `beta-blocker`. أدرج رابط المشكلة في سلسلتك.
5. افتح طلب سحب إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>`، وأدرج رابط المشكلة في كلٍ من طلب السحب وسلسلتك على Discord. لا يمكن للمساهمين إضافة تصنيفات إلى طلبات السحب، لذا يُعد العنوان الإشارة الخاصة بطلب السحب للمشرفين وعمليات الأتمتة. تُدمج العوائق التي لها طلب سحب؛ أما العوائق التي ليس لها طلب سحب فقد يُنشر الإصدار رغم وجودها.
6. الصمت يعني أن كل شيء سليم. وعادةً ما يعني تفويت المهلة أن إصلاحك سيُدمج في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Plugins قنوات المراسلة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    أنشئ Plugin لقناة مراسلة
  </Card>
  <Card title="Plugins موفّري النماذج" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أنشئ Plugin لموفّر نماذج
  </Card>
  <Card title="Plugins الواجهات الخلفية لـ CLI" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    سجّل واجهة خلفية محلية للذكاء الاصطناعي عبر CLI
  </Card>
  <Card title="نظرة عامة على SDK" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وواجهة API للتسجيل
  </Card>
  <Card title="أدوات وقت التشغيل المساعدة" icon="settings" href="/ar/plugins/sdk-runtime">
    تحويل النص إلى كلام والبحث والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="الاختبار" icon="test-tubes" href="/ar/plugins/sdk-testing">
    أدوات وأنماط الاختبار
  </Card>
  <Card title="بيان Plugin" icon="file-json" href="/ar/plugins/manifest">
    مرجع مخطط البيان الكامل
  </Card>
</CardGroup>

## ذو صلة

- [خطافات Plugin](/ar/plugins/hooks)
- [بنية Plugin](/ar/plugins/architecture)
