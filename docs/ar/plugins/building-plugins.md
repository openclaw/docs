---
doc-schema-version: 1
read_when:
    - تريد إنشاء Plugin جديد في OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تختار بين توثيق القناة أو المزوّد أو خلفية CLI أو الأداة أو الخطاف
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لك في دقائق
title: بناء Plugins
x-i18n:
    generated_at: "2026-07-04T15:20:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

توسّع المكوّنات الإضافية OpenClaw دون تغيير النواة. يمكن للمكوّن الإضافي إضافة
قناة مراسلة، أو مزوّد نموذج، أو خلفية CLI محلية، أو أداة وكيل، أو hook، أو مزوّد وسائط،
أو قدرة أخرى يملكها المكوّن الإضافي.

لا تحتاج إلى إضافة مكوّن إضافي خارجي إلى مستودع OpenClaw. انشر
الحزمة إلى [ClawHub](/ar/clawhub) ويثبّتها المستخدمون باستخدام:

```bash
openclaw plugins install clawhub:<package-name>
```

ما تزال مواصفات الحزم العارية تثبّت من npm أثناء انتقال الإطلاق. استخدم بادئة
`clawhub:` عندما تريد حلّ ClawHub.

## المتطلبات

- استخدم Node 22.19+، أو Node 23.11+، أو Node 24+ ومدير حزم مثل `npm` أو `pnpm`.
- كن ملمًا بوحدات TypeScript ESM.
- للعمل على مكوّن إضافي مضمّن داخل المستودع، انسخ المستودع وشغّل `pnpm install`.
  تطوير المكوّنات الإضافية من نسخة المصدر يستخدم pnpm فقط لأن OpenClaw يحمّل المكوّنات
  الإضافية المضمّنة من حزم مساحة العمل `extensions/*`.

## اختر شكل المكوّن الإضافي

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    وصّل OpenClaw بمنصة مراسلة.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف مزوّد نموذج، أو وسائط، أو بحث، أو جلب، أو كلام، أو مزوّدًا فوريًا.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    شغّل CLI ذكاء اصطناعي محليًا عبر رجوع نموذج OpenClaw الاحتياطي.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/ar/plugins/tool-plugins">
    سجّل أدوات الوكيل.
  </Card>
</CardGroup>

## البدء السريع

ابنِ مكوّنًا إضافيًا بسيطًا للأدوات عبر تسجيل أداة وكيل مطلوبة واحدة. هذا هو
أقصر شكل مكوّن إضافي مفيد، ويوضح الحزمة، والبيان، ونقطة الدخول، والإثبات
المحلي.

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

    يجب أن تشير المكوّنات الإضافية الخارجية المنشورة في إدخالات وقت التشغيل إلى ملفات JavaScript
    المبنية. راجع [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) للاطلاع على عقد نقطة
    الدخول الكامل.

    يحتاج كل مكوّن إضافي إلى بيان، حتى عندما لا تكون لديه إعدادات. يجب أن تظهر أدوات وقت التشغيل
    في `contracts.tools` حتى يتمكن OpenClaw من اكتشاف الملكية دون
    تحميل كل وقت تشغيل لكل مكوّن إضافي بشراهة. اضبط `activation.onStartup`
    بعناية. يبدأ هذا المثال عند بدء تشغيل Gateway.

    الأسطح الموثوقة من المضيف للمكوّنات الإضافية محكومة أيضًا بالبيان وتتطلب تمكينًا صريحًا
    للمكوّنات الإضافية المثبّتة. إذا سجّل مكوّن إضافي مثبّت
    `api.registerAgentToolResultMiddleware(...)`، فأعلن كل وقت تشغيل مستهدف في
    `contracts.agentToolResultMiddleware`. إذا سجّل
    `api.registerTrustedToolPolicy(...)`، فأعلن كل معرّف سياسة في
    `contracts.trustedToolPolicies`. تحافظ هذه التصريحات على اتساق فحص وقت التثبيت
    مع تسجيل وقت التشغيل.

    لكل حقل في البيان، راجع [بيان Plugin](/ar/plugins/manifest).

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

    استخدم `definePluginEntry` للمكوّنات الإضافية غير القنوية. تستخدم مكوّنات القنوات الإضافية
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    بالنسبة إلى مكوّن إضافي مثبّت أو خارجي، افحص وقت التشغيل المحمّل:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    إذا سجّل المكوّن الإضافي أمر CLI، فشغّل ذلك الأمر أيضًا. على سبيل المثال،
    يجب أن يكون لأمر تجريبي إثبات تنفيذ مثل
    `openclaw demo-plugin ping`.

    بالنسبة إلى مكوّن إضافي مضمّن في هذا المستودع، يكتشف OpenClaw حزم المكوّنات
    الإضافية من نسخة المصدر من مساحة عمل `extensions/*`. شغّل أقرب اختبار مستهدف:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    قبل نشر مكوّن إضافي جاهز كحزمة، اختبر شكل التثبيت نفسه الذي سيحصل عليه المستخدمون.
    أضف أولًا خطوة بناء، ووجّه إدخالات وقت التشغيل مثل
    `openclaw.extensions` إلى JavaScript مبني مثل `./dist/index.js`، وتأكد
    من أن `npm pack` يتضمن مخرجات `dist/` تلك. إدخالات مصدر TypeScript
    مخصصة فقط لنسخ المصدر ومسارات التطوير المحلية.

    بعد ذلك احزم المكوّن الإضافي وثبّت أرشيف tar باستخدام `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    يستخدم `npm-pack:` مشروع npm مُدارًا لكل مكوّن إضافي في OpenClaw، لذلك يلتقط
    أخطاء اعتماديات وقت التشغيل التي قد يخفيها اختبار نسخة المصدر. إنه يثبت
    شكل الحزمة والاعتماديات، وليس الثقة الرسمية المرتبطة بالفهرس.
    يجب أن تكون استيرادات وقت التشغيل في `dependencies` أو `optionalDependencies`؛
    الاعتماديات المتروكة فقط في `devDependencies` لن تُثبّت لمشروع وقت التشغيل
    المُدار.

    لا تستخدم تثبيت أرشيف/مسار خام كإثبات نهائي لسلوك المكوّنات الإضافية الرسمية أو
    ذات الامتيازات. المصادر الخام مفيدة للتصحيح المحلي، لكنها لا تثبت مسار
    الاعتماديات نفسه مثل تثبيتات npm أو ClawHub. إذا كان مكوّنك الإضافي يعتمد على
    حالة المكوّن الإضافي الرسمي الموثوق، فأضف إثباتًا ثانيًا عبر تثبيت رسمي مدعوم
    بفهرس أو مسار حزمة منشورة يسجّل الثقة الرسمية. راجع
    [حل اعتماديات Plugin](/ar/plugins/dependency-resolution) للحصول على تفاصيل
    جذر التثبيت وملكية الاعتماديات.

  </Step>

  <Step title="Publish">
    تحقق من الحزمة قبل النشر:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    توجد مقتطفات ClawHub القياسية في `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Install">
    ثبّت الحزمة المنشورة عبر ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## تسجيل الأدوات

يمكن أن تكون الأدوات مطلوبة أو اختيارية. تكون الأدوات المطلوبة متاحة دائمًا عندما يكون
المكوّن الإضافي ممكّنًا. تتطلب الأدوات الاختيارية موافقة المستخدم.

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

يجب أيضًا التصريح بكل أداة مسجّلة باستخدام `api.registerTool(...)` في
بيان المكوّن الإضافي:

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

يوافق المستخدمون باستخدام `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

تتحكم الأدوات الاختيارية في ما إذا كانت الأداة مكشوفة للنموذج. استخدم
[طلبات أذونات المكوّن الإضافي](/ar/plugins/plugin-permission-requests) عندما يجب أن تطلب أداة
أو hook الموافقة بعد أن يحددها النموذج وقبل تشغيل
الإجراء.

استخدم الأدوات الاختيارية للتأثيرات الجانبية، أو الملفات الثنائية غير المعتادة، أو القدرات التي
لا ينبغي كشفها افتراضيًا. يجب ألا تتعارض أسماء الأدوات مع أدوات النواة؛
يتم تخطي التعارضات والإبلاغ عنها في تشخيصات المكوّن الإضافي. كما يتم تخطي
التسجيلات غير الصالحة، بما في ذلك واصفات الأدوات التي لا تحتوي على `parameters`،
والإبلاغ عنها بالطريقة نفسها. الأدوات المسجّلة هي دوال مكتوبة الأنواع يستطيع النموذج استدعاءها
بعد اجتياز فحوصات السياسة وقائمة السماح.

تتلقى مصانع الأدوات كائن سياق يوفّره وقت التشغيل. استخدم `ctx.activeModel`
عندما تحتاج أداة إلى تسجيل النموذج النشط للدورة الحالية أو عرضه أو التكيّف معه.
يمكن أن يتضمن الكائن `provider` و`modelId` و`modelRef`. تعامل معه على أنه
بيانات تعريفية معلوماتية لوقت التشغيل، وليس كحد أمني ضد المشغّل المحلي،
أو كود المكوّن الإضافي المثبّت، أو وقت تشغيل OpenClaw معدّل. يجب أن تظل الأدوات المحلية
الحساسة تتطلب موافقة صريحة من المكوّن الإضافي أو المشغّل، وأن تفشل مغلقة
عندما تكون بيانات تعريف النموذج النشط مفقودة أو غير مناسبة.

يصرّح البيان بالملكية والاكتشاف؛ وما يزال التنفيذ يستدعي تطبيق الأداة المسجّل
الحي. حافظ على اتساق `toolMetadata.<tool>.optional: true`
مع `api.registerTool(..., { optional: true })` حتى يتمكن OpenClaw من تجنب
تحميل وقت تشغيل ذلك المكوّن الإضافي حتى تُضاف الأداة صراحةً إلى قائمة السماح.

## اصطلاحات الاستيراد

استورد من مسارات SDK الفرعية المركزة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

لا تستورد من البرميل الجذري المهمل:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

داخل حزمة المكوّن الإضافي الخاصة بك، استخدم ملفات برميل محلية مثل `api.ts` و
`runtime-api.ts` للاستيرادات الداخلية. لا تستورد مكوّنك الإضافي نفسه عبر
مسار SDK. يجب أن تبقى المساعدات الخاصة بالمزوّد داخل حزمة المزوّد ما لم
يكن الحد الفاصل عامًا حقًا.

طرق Gateway RPC المخصصة هي نقطة دخول متقدمة. أبقها على بادئة
خاصة بالمكوّن الإضافي؛ تبقى مساحات أسماء إدارة النواة مثل `config.*`،
و`exec.approvals.*`، و`operator.admin.*`، و`wizard.*`، و`update.*` محجوزة
وتُحلّ إلى `operator.admin`. جسر
`openclaw/plugin-sdk/gateway-method-runtime` محجوز لمسارات HTTP الخاصة بالمكوّنات
الإضافية التي تصرّح بـ `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

لخريطة الاستيراد الكاملة، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## قائمة التحقق قبل الإرسال

<Check>تحتوي **package.json** على بيانات `openclaw` التعريفية الصحيحة</Check>
<Check>بيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم كل الاستيرادات مسارات `plugin-sdk/<subpath>` المركزة</Check>
<Check>تستخدم الاستيرادات الداخلية وحدات محلية، وليس استيرادات ذاتية من SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (للمكوّنات الإضافية داخل المستودع)</Check>

## الاختبار مقابل إصدارات بيتا

1. راقب وسوم إصدارات GitHub على [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم بيتا مثل `v2026.3.N-beta.1`. يمكنك أيضًا تفعيل الإشعارات لحساب OpenClaw الرسمي على X [@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر Plugin الخاص بك مقابل وسم بيتا بمجرد ظهوره. عادةً ما تكون النافذة قبل الإصدار المستقر بضع ساعات فقط.
3. انشر في سلسلة Plugin الخاصة بك في قناة Discord المسماة `plugin-forum` بعد الاختبار، إما بـ `all good` أو بما تعطل. إذا لم تكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطل شيء ما، فافتح مشكلة أو حدّث مشكلة بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق تسمية `beta-blocker`. ضع رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط المشكلة في كل من PR وسلسلة Discord الخاصة بك. لا يستطيع المساهمون تسمية PRs، لذلك يكون العنوان هو إشارة جهة PR للمشرفين والأتمتة. تُدمج العوائق التي لديها PR؛ أما العوائق التي لا تملك واحدًا فقد تُشحن رغم ذلك. يراقب المشرفون هذه السلاسل أثناء اختبار بيتا.
6. الصمت يعني أن كل شيء سليم. إذا فاتتك النافذة، فمن المرجح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ Plugin لقناة مراسلة
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ Plugin لمزوّد نماذج
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    سجّل خلفية CLI محلية للذكاء الاصطناعي
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وواجهة API للتسجيل
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS، والبحث، ووكيل فرعي عبر api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ar/plugins/sdk-testing">
    أدوات وأنماط الاختبار
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ar/plugins/manifest">
    مرجع مخطط البيان الكامل
  </Card>
</CardGroup>

## ذات صلة

- [خطافات Plugin](/ar/plugins/hooks)
- [بنية Plugin](/ar/plugins/architecture)
