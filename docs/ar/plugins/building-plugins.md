---
doc-schema-version: 1
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تختار بين وثائق القناة أو المزوّد أو الواجهة الخلفية لـ CLI أو الأداة أو الخطاف.
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لك في OpenClaw خلال دقائق
title: بناء plugins
x-i18n:
    generated_at: "2026-06-27T18:00:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

توسّع Plugins إمكانات OpenClaw من دون تغيير النواة. يمكن لـ Plugin إضافة قناة مراسلة،
أو مزوّد نماذج، أو واجهة CLI محلية خلفية، أو أداة وكيل، أو hook، أو مزوّد وسائط،
أو قدرة أخرى مملوكة لـ Plugin.

لا تحتاج إلى إضافة Plugin خارجي إلى مستودع OpenClaw. انشر
الحزمة إلى [ClawHub](/ar/clawhub) ويثبّتها المستخدمون باستخدام:

```bash
openclaw plugins install clawhub:<package-name>
```

تظل مواصفات الحزم المجردة تُثبَّت من npm أثناء انتقال الإطلاق. استخدم
البادئة `clawhub:` عندما تريد حلّ الحزمة عبر ClawHub.

## المتطلبات

- استخدم Node 22.19 أو أحدث ومدير حزم مثل `npm` أو `pnpm`.
- كن ملمًّا بوحدات TypeScript ESM.
- للعمل على Plugin مضمّن داخل المستودع، انسخ المستودع وشغّل `pnpm install`.
  تطوير Plugins من نسخة مصدرية مخصّص لـ pnpm فقط لأن OpenClaw يحمّل Plugins
  المضمّنة من حزم مساحة العمل `extensions/*`.

## اختر شكل Plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    وصّل OpenClaw بمنصة مراسلة.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف مزوّد نماذج أو وسائط أو بحث أو جلب أو كلام أو مزوّدًا لحظيًا.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    شغّل واجهة CLI محلية للذكاء الاصطناعي عبر احتياطي نماذج OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/ar/plugins/tool-plugins">
    سجّل أدوات الوكيل.
  </Card>
</CardGroup>

## البدء السريع

ابنِ Plugin أداة بسيطًا بتسجيل أداة وكيل مطلوبة واحدة. هذا هو أقصر
شكل Plugin مفيد، ويعرض الحزمة والبيان ونقطة الدخول والإثبات المحلي.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
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

    يجب أن تشير Plugins الخارجية المنشورة في إدخالات وقت التشغيل إلى ملفات JavaScript
    المبنية. راجع [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) للاطلاع على عقد نقطة
    الدخول الكامل.

    يحتاج كل Plugin إلى بيان، حتى عندما لا يحتوي على إعدادات. يجب أن تظهر أدوات
    وقت التشغيل في `contracts.tools` حتى يتمكن OpenClaw من اكتشاف الملكية من دون
    تحميل كل وقت تشغيل Plugin بشكل مبكر. اضبط `activation.onStartup`
    عمدًا. يبدأ هذا المثال عند بدء Gateway.

    أسطح Plugin الموثوقة من المضيف محكومة أيضًا بالبيان وتتطلب تمكينًا صريحًا
    لـ Plugins المثبّتة. إذا سجّل Plugin مثبّت
    `api.registerAgentToolResultMiddleware(...)`، فأعلن كل وقت تشغيل مستهدف في
    `contracts.agentToolResultMiddleware`. وإذا سجّل
    `api.registerTrustedToolPolicy(...)`، فأعلن كل معرّف سياسة في
    `contracts.trustedToolPolicies`. تُبقي هذه التصريحات فحص وقت التثبيت
    وتسجيل وقت التشغيل متوافقين.

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

    استخدم `definePluginEntry` لـ Plugins غير القنوات. تستخدم Plugins القنوات
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    بالنسبة إلى Plugin مثبّت أو خارجي، افحص وقت التشغيل المحمّل:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    إذا سجّل Plugin أمر CLI، فشغّل ذلك الأمر أيضًا. على سبيل المثال،
    يجب أن يكون لأمر تجريبي إثبات تنفيذ مثل
    `openclaw demo-plugin ping`.

    بالنسبة إلى Plugin مضمّن في هذا المستودع، يكتشف OpenClaw حزم Plugins
    من نسخة مصدرية من مساحة العمل `extensions/*`. شغّل أقرب اختبار موجّه:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    تحقّق من الحزمة قبل النشر:

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
Plugin مفعّلًا. تتطلب الأدوات الاختيارية موافقة المستخدم.

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

يجب أيضًا التصريح عن كل أداة مسجلة باستخدام `api.registerTool(...)` في
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

يوافق المستخدمون عبر `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

تتحكم الأدوات الاختيارية فيما إذا كانت الأداة مكشوفة للنموذج. استخدم
[طلبات أذونات Plugin](/ar/plugins/plugin-permission-requests) عندما ينبغي لأداة
أو hook طلب الموافقة بعد أن يختارها النموذج وقبل تشغيل الإجراء.

استخدم الأدوات الاختيارية للآثار الجانبية أو الثنائيات غير المعتادة أو القدرات التي
لا ينبغي كشفها افتراضيًا. يجب ألا تتعارض أسماء الأدوات مع أدوات النواة؛
تُتخطى التعارضات ويُبلّغ عنها في تشخيصات Plugin. تُتخطى التسجيلات
غير الصحيحة، بما في ذلك أوصاف الأدوات التي لا تحتوي على `parameters`، ويُبلّغ
عنها بالطريقة نفسها. الأدوات المسجلة هي دوال مكتوبة الأنواع يمكن للنموذج استدعاؤها
بعد اجتياز فحوصات السياسة وقائمة السماح.

تتلقى مصانع الأدوات كائن سياق يوفّره وقت التشغيل. استخدم `ctx.activeModel`
عندما تحتاج أداة إلى التسجيل أو العرض أو التكيّف مع النموذج النشط للدورة الحالية.
يمكن أن يتضمن الكائن `provider` و`modelId` و`modelRef`. تعامل معه على أنه
بيانات وصفية معلوماتية لوقت التشغيل، وليس حدًا أمنيًا ضد المشغّل المحلي
أو كود Plugin المثبّت أو وقت تشغيل OpenClaw معدّل. يجب أن تظل الأدوات المحلية
الحساسة تتطلب موافقة صريحة من Plugin أو المشغّل، وأن تفشل مغلقة عندما تكون
بيانات النموذج النشط الوصفية مفقودة أو غير مناسبة.

يعلن البيان الملكية والاكتشاف؛ لا يزال التنفيذ يستدعي تطبيق الأداة المسجلة الحي.
أبقِ `toolMetadata.<tool>.optional: true` متوافقًا مع
`api.registerTool(..., { optional: true })` حتى يتمكن OpenClaw من تجنب
تحميل وقت تشغيل ذلك Plugin إلى أن تُدرج الأداة صراحة في قائمة السماح.

## اصطلاحات الاستيراد

استورد من مسارات SDK فرعية مركّزة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

لا تستورد من البرميل الجذري المهمل:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

داخل حزمة Plugin الخاصة بك، استخدم ملفات برميل محلية مثل `api.ts` و
`runtime-api.ts` للاستيرادات الداخلية. لا تستورد Plugin الخاص بك عبر
مسار SDK. يجب أن تبقى المساعدات الخاصة بالمزوّد داخل حزمة المزوّد ما لم تكن
الوصلة عامة فعلًا.

طرق RPC المخصصة لـ Gateway هي نقطة دخول متقدمة. أبقِها على بادئة خاصة
بـ Plugin؛ تبقى مساحات أسماء الإدارة في النواة مثل `config.*`،
و`exec.approvals.*`، و`operator.admin.*`، و`wizard.*`، و`update.*` محجوزة
وتُحل إلى `operator.admin`. جسر
`openclaw/plugin-sdk/gateway-method-runtime` محجوز لمسارات HTTP الخاصة بـ Plugin
التي تعلن `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

لخريطة الاستيراد الكاملة، راجع [نظرة عامة على SDK الخاص بـ Plugin](/ar/plugins/sdk-overview).

## قائمة التحقق قبل الإرسال

<Check>تحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>بيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم كل الاستيرادات مسارات `plugin-sdk/<subpath>` مركّزة</Check>
<Check>تستخدم الاستيرادات الداخلية وحدات محلية، وليس استيرادات ذاتية من SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (لـ Plugins داخل المستودع)</Check>

## الاختبار مقابل إصدارات بيتا

1. راقب وسوم إصدارات GitHub على [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم بيتا مثل `v2026.3.N-beta.1`. يمكنك أيضًا تفعيل الإشعارات لحساب OpenClaw الرسمي على X ‏[@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر Plugin الخاص بك مقابل وسم بيتا فور ظهوره. تكون النافذة قبل الإصدار المستقر عادة بضع ساعات فقط.
3. انشر في سلسلة Plugin الخاصة بك في قناة Discord باسم `plugin-forum` بعد الاختبار باستخدام إما `all good` أو ما تعطل. إذا لم تكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطل شيء، فافتح مشكلة أو حدّثها بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق وسم `beta-blocker`. ضع رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط المشكلة في كل من PR وسلسلة Discord الخاصة بك. لا يستطيع المساهمون وسم PRs، لذلك يكون العنوان إشارة جانب PR للمشرفين والأتمتة. تُدمج العوائق التي لديها PR؛ أما العوائق التي لا تملك واحدًا فقد تُشحن على أي حال. يراقب المشرفون هذه السلاسل أثناء اختبار بيتا.
6. الصمت يعني أن كل شيء أخضر. إذا فاتتك النافذة، فمن المرجح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ Plugin قناة مراسلة
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ Plugin مزوّد نماذج
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    سجّل واجهة CLI محلية خلفية للذكاء الاصطناعي
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وواجهة API للتسجيل
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS والبحث والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ar/plugins/sdk-testing">
    أدوات وأنماط الاختبار
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ar/plugins/manifest">
    مرجع مخطط البيان الكامل
  </Card>
</CardGroup>

## ذات صلة

- [Hooks الخاصة بـ Plugin](/ar/plugins/hooks)
- [معمارية Plugin](/ar/plugins/architecture)
