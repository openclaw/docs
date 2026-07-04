---
doc-schema-version: 1
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تختار بين توثيق القناة أو المزوّد أو واجهة CLI الخلفية أو الأداة أو الخطاف
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لك في دقائق
title: بناء Plugins
x-i18n:
    generated_at: "2026-07-04T08:46:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw دون تغيير النواة. يمكن لـ plugin أن يضيف قناة مراسلة، أو موفر نموذج، أو خلفية CLI محلية، أو أداة وكيل، أو hook، أو موفر وسائط، أو قدرة أخرى مملوكة لـ plugin.

لا تحتاج إلى إضافة plugin خارجي إلى مستودع OpenClaw. انشر الحزمة إلى [ClawHub](/ar/clawhub)، وسيثبتها المستخدمون باستخدام:

```bash
openclaw plugins install clawhub:<package-name>
```

ما زالت مواصفات الحزم المجرّدة تثبّت من npm أثناء انتقال الإطلاق. استخدم البادئة `clawhub:` عندما تريد حلّ ClawHub.

## المتطلبات

- استخدم Node 22.19+، أو Node 23.11+، أو Node 24+ ومدير حزم مثل `npm` أو `pnpm`.
- كن ملمًّا بوحدات TypeScript ESM.
- للعمل على plugin مضمّن داخل المستودع، استنسخ المستودع وشغّل `pnpm install`.
  تطوير Plugins من checkout للمصدر يقتصر على pnpm لأن OpenClaw يحمّل Plugins المضمّنة
  من حزم مساحة العمل `extensions/*`.

## اختر شكل plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    وصّل OpenClaw بمنصة مراسلة.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف نموذجًا، أو وسائط، أو بحثًا، أو جلبًا، أو كلامًا، أو موفرًا آنيًا.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    شغّل CLI ذكاء اصطناعيًا محليًا عبر احتياطي نموذج OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/ar/plugins/tool-plugins">
    سجّل أدوات الوكيل.
  </Card>
</CardGroup>

## البدء السريع

ابنِ tool plugin بسيطًا بتسجيل أداة وكيل واحدة مطلوبة. هذا هو أقصر شكل plugin مفيد، ويعرض الحزمة والبيان ونقطة الدخول والإثبات المحلي.

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

    يجب أن تشير Plugins الخارجية المنشورة بإدخالات وقت التشغيل إلى ملفات JavaScript المبنية. راجع [نقاط دخول SDK](/ar/plugins/sdk-entrypoints) لمعرفة عقد نقطة الدخول الكامل.

    يحتاج كل plugin إلى بيان، حتى عندما لا تكون لديه إعدادات. يجب أن تظهر أدوات وقت التشغيل في `contracts.tools` حتى يتمكن OpenClaw من اكتشاف الملكية دون تحميل وقت تشغيل كل plugin مسبقًا. عيّن `activation.onStartup` عمدًا. يبدأ هذا المثال عند بدء Gateway.

    أسطح plugin الموثوقة من المضيف تخضع أيضًا لحراسة البيان وتتطلب تمكينًا صريحًا لـ Plugins المثبّتة. إذا سجّل plugin مثبّت `api.registerAgentToolResultMiddleware(...)`، فأعلن كل وقت تشغيل مستهدف في `contracts.agentToolResultMiddleware`. وإذا سجّل `api.registerTrustedToolPolicy(...)`، فأعلن كل معرّف سياسة في `contracts.trustedToolPolicies`. تحافظ هذه التصريحات على اتساق فحص وقت التثبيت مع تسجيل وقت التشغيل.

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

    استخدم `definePluginEntry` لـ Plugins غير القنوات. تستخدم Channel plugins
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    بالنسبة إلى plugin مثبّت أو خارجي، افحص وقت التشغيل المحمّل:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    إذا كان plugin يسجّل أمر CLI، فشغّل ذلك الأمر أيضًا. على سبيل المثال،
    يجب أن يكون لأمر تجريبي إثبات تنفيذ مثل
    `openclaw demo-plugin ping`.

    بالنسبة إلى plugin مضمّن في هذا المستودع، يكتشف OpenClaw حزم Plugins من checkout للمصدر من مساحة العمل `extensions/*`. شغّل أقرب اختبار مستهدف:

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

    توجد مقتطفات ClawHub المعتمدة في `docs/snippets/plugin-publish/`.

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

يمكن أن تكون الأدوات مطلوبة أو اختيارية. الأدوات المطلوبة متاحة دائمًا عندما يكون plugin مفعّلًا. تتطلب الأدوات الاختيارية موافقة المستخدم المسبقة.

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

يجب أيضًا التصريح عن كل أداة مسجّلة باستخدام `api.registerTool(...)` في بيان plugin:

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

تتحكم الأدوات الاختيارية فيما إذا كانت الأداة تُعرض للنموذج. استخدم
[طلبات أذونات plugin](/ar/plugins/plugin-permission-requests) عندما ينبغي لأداة
أو hook أن يطلب الموافقة بعد أن يختاره النموذج وقبل تنفيذ الإجراء.

استخدم الأدوات الاختيارية للآثار الجانبية، أو الثنائيات غير المعتادة، أو القدرات التي لا ينبغي عرضها افتراضيًا. يجب ألا تتعارض أسماء الأدوات مع أدوات النواة؛ يتم تخطي التعارضات والإبلاغ عنها في تشخيصات plugin. يتم تخطي التسجيلات غير الصحيحة، بما في ذلك واصفات الأدوات التي لا تحتوي على `parameters`، والإبلاغ عنها بالطريقة نفسها. الأدوات المسجّلة هي دوال ذات أنواع يمكن للنموذج استدعاؤها بعد اجتياز فحوص السياسة وقائمة السماح.

تتلقى مصانع الأدوات كائن سياق يوفّره وقت التشغيل. استخدم `ctx.activeModel` عندما تحتاج أداة إلى تسجيل النموذج النشط أو عرضه أو التكيّف معه للدورة الحالية. يمكن أن يتضمن الكائن `provider` و`modelId` و`modelRef`. عامله باعتباره بيانات وصفية معلوماتية لوقت التشغيل، لا باعتباره حدًا أمنيًا أمام المشغّل المحلي، أو كود plugin المثبّت، أو وقت تشغيل OpenClaw معدّل. يجب أن تظل الأدوات المحلية الحساسة تتطلب موافقة صريحة من plugin أو المشغّل وأن تفشل بإغلاق عندما تكون بيانات النموذج النشط الوصفية مفقودة أو غير مناسبة.

يعلن البيان الملكية والاكتشاف؛ أما التنفيذ فلا يزال يستدعي تنفيذ الأداة الحية المسجّلة. أبقِ `toolMetadata.<tool>.optional: true` متوافقًا مع `api.registerTool(..., { optional: true })` حتى يتمكن OpenClaw من تجنّب تحميل وقت تشغيل ذلك plugin إلى أن تُضاف الأداة صراحةً إلى قائمة السماح.

## اصطلاحات الاستيراد

استورد من المسارات الفرعية المركّزة في SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

لا تستورد من الجذر المجمّع المهجور:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

داخل حزمة plugin الخاصة بك، استخدم ملفات تجميع محلية مثل `api.ts` و
`runtime-api.ts` للاستيرادات الداخلية. لا تستورد plugin الخاص بك عبر مسار
SDK. يجب أن تبقى المساعدات الخاصة بالموفر داخل حزمة الموفر ما لم تكن نقطة الربط عامة حقًا.

طرق Gateway RPC المخصصة هي نقطة دخول متقدمة. أبقِها على بادئة خاصة بـ plugin؛ تظل مساحات أسماء الإدارة الأساسية مثل `config.*` و
`exec.approvals.*` و`operator.admin.*` و`wizard.*` و`update.*` محجوزة
وتُحلّ إلى `operator.admin`. جسر
`openclaw/plugin-sdk/gateway-method-runtime` محجوز لمسارات HTTP الخاصة بـ plugin التي تعلن `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

لخريطة الاستيراد الكاملة، راجع [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview).

## قائمة التحقق قبل الإرسال

<Check>تحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>بيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم كل الاستيرادات مسارات `plugin-sdk/<subpath>` مركّزة</Check>
<Check>تستخدم الاستيرادات الداخلية وحدات محلية، لا استيرادات ذاتية من SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (لـ Plugins داخل المستودع)</Check>

## الاختبار مقابل إصدارات بيتا

1. راقب وسوم إصدارات GitHub على [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم بيتا مثل `v2026.3.N-beta.1`. يمكنك أيضًا تشغيل الإشعارات لحساب OpenClaw الرسمي على X ‏[@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر plugin الخاص بك مقابل وسم بيتا فور ظهوره. عادةً ما تكون النافذة قبل الإصدار المستقر بضع ساعات فقط.
3. انشر في سلسلة plugin الخاصة بك في قناة Discord `plugin-forum` بعد الاختبار إما باستخدام `all good` أو بما تعطل. إذا لم تكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطل شيء ما، فافتح issue أو حدّث واحدة بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق وسم `beta-blocker`. ضع رابط issue في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط issue في كل من PR وسلسلة Discord الخاصة بك. لا يمكن للمساهمين وسم PRs، لذلك يكون العنوان هو إشارة جهة PR للمشرفين والأتمتة. تُدمج العوائق التي لديها PR؛ وقد تُشحن العوائق التي لا تملك واحدًا على أي حال. يراقب المشرفون هذه السلاسل أثناء اختبار بيتا.
6. الصمت يعني أن الحالة سليمة. إذا فاتتك النافذة، فمن المرجح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ messaging channel plugin
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ model provider plugin
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    سجّل خلفية CLI محلية للذكاء الاصطناعي
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ar/plugins/sdk-overview">
    خريطة الاستيراد ومرجع API التسجيل
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS، والبحث، والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ar/plugins/sdk-testing">
    أدوات وأنماط الاختبار
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ar/plugins/manifest">
    مرجع مخطط البيان الكامل
  </Card>
</CardGroup>

## ذات صلة

- [Plugin hooks](/ar/plugins/hooks)
- [معمارية Plugin](/ar/plugins/architecture)
