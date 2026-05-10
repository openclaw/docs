---
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تضيف قناة جديدة أو موفّرًا جديدًا أو أداة جديدة أو إمكانية أخرى إلى OpenClaw
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لك في OpenClaw خلال دقائق
title: بناء Plugins
x-i18n:
    generated_at: "2026-05-10T19:47:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 320ea03395cd702e62831e3b6bb3e44443b4a00701f3e6d35d7c9e556e3bb258
    source_path: plugins/building-plugins.md
    workflow: 16
---

توسّع Plugins إمكانات OpenClaw بإضافة قدرات جديدة: القنوات، ومزوّدي النماذج،
والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور،
وتوليد الفيديو، وجلب الويب، وبحث الويب، وأدوات الوكيل، أو أي
مزيج منها.

لست بحاجة إلى إضافة Plugin الخاص بك إلى مستودع OpenClaw. انشره إلى
[ClawHub](/ar/clawhub) ويثبّته المستخدمون باستخدام
`openclaw plugins install clawhub:<package-name>`. ما زالت مواصفات الحزم المجرّدة
تُثبَّت من npm أثناء مرحلة الانتقال عند الإطلاق.

## المتطلبات الأساسية

- Node >= 22 ومدير حزم (npm أو pnpm)
- الإلمام بـ TypeScript (ESM)
- بالنسبة إلى Plugins داخل المستودع: يجب أن يكون المستودع مستنسخًا وأن يكون `pnpm install` قد نُفّذ. تطوير Plugin من نسخة مصدر
  checkout مخصص لـ pnpm فقط لأن OpenClaw يحمّل Plugins المضمّنة
  من حزم مساحة العمل `extensions/*`.

## ما نوع Plugin؟

<CardGroup cols={3}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    وصّل OpenClaw بمنصة مراسلة (Discord، IRC، وما إلى ذلك)
  </Card>
  <Card title="Plugin مزوّد" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف مزوّد نماذج (LLM، أو وكيل، أو نقطة نهاية مخصصة)
  </Card>
  <Card title="Plugin واجهة خلفية لـ CLI" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    اربط CLI ذكاء اصطناعي محليًا بمشغّل الرجوع النصي في OpenClaw
  </Card>
  <Card title="Plugin أداة / خطّاف" icon="wrench" href="/ar/plugins/hooks">
    سجّل أدوات وكيل أو خطافات أحداث أو خدمات - تابع أدناه
  </Card>
</CardGroup>

بالنسبة إلى Plugin قناة غير مضمون تثبيته عند تشغيل الإعداد/التهيئة الأولية،
استخدم `createOptionalChannelSetupSurface(...)` من
`openclaw/plugin-sdk/channel-setup`. ينتج ذلك زوجًا من محوّل الإعداد + المعالج الإرشادي
يعلن عن متطلب التثبيت ويفشل بإغلاق آمن عند عمليات كتابة الإعدادات الفعلية
إلى أن يتم تثبيت Plugin.

## البدء السريع: Plugin أداة

ينشئ هذا الدليل العملي Plugin بسيطًا يسجّل أداة وكيل. لدى Plugins القنوات
والمزوّدين أدلة مخصصة مرتبطة أعلاه.

<Steps>
  <Step title="أنشئ الحزمة والبيان">
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

    يحتاج كل Plugin إلى بيان، حتى من دون إعدادات. يجب إدراج الأدوات المسجّلة وقت التشغيل
    في `contracts.tools` لكي يتمكن OpenClaw من اكتشاف
    Plugin المالك من دون تحميل وقت تشغيل كل Plugin. يجب أن تصرّح Plugins أيضًا
    عن `activation.onStartup` بقصد واضح. يعيّن هذا المثال قيمته إلى `true`. راجع
    [البيان](/ar/plugins/manifest) للاطلاع على المخطط الكامل. توجد مقتطفات النشر القانونية في ClawHub
    في `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="اكتب نقطة الدخول">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` مخصص لـ Plugins غير القنوات. بالنسبة إلى القنوات، استخدم
    `defineChannelPluginEntry` - راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).
    للاطلاع على خيارات نقطة الدخول الكاملة، راجع [نقاط الدخول](/ar/plugins/sdk-entrypoints).

  </Step>

  <Step title="اختبر وانشر">

    **Plugins الخارجية:** تحقّق وانشر باستخدام ClawHub، ثم ثبّت:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    تُثبَّت مواصفات الحزم المجرّدة مثل `@myorg/openclaw-my-plugin` من npm أثناء
    مرحلة الانتقال عند الإطلاق. استخدم `clawhub:` عندما تريد الحل عبر ClawHub.

    **Plugins داخل المستودع:** ضعها تحت شجرة مساحة عمل Plugins المضمّنة - وسيتم اكتشافها تلقائيًا.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## إمكانات Plugin

يمكن لـ Plugin واحد تسجيل أي عدد من الإمكانات عبر كائن `api`:

| الإمكانية             | طريقة التسجيل                              | الدليل التفصيلي                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| الاستدلال النصي (LLM)   | `api.registerProvider(...)`                      | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins)                               |
| واجهة خلفية للاستدلال عبر CLI  | `api.registerCliBackend(...)`                    | [Plugins الواجهة الخلفية لـ CLI](/ar/plugins/cli-backend-plugins)                             |
| القناة / المراسلة    | `api.registerChannel(...)`                       | [Plugins القنوات](/ar/plugins/sdk-channel-plugins)                                 |
| الكلام (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| النسخ الفوري | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| الصوت الفوري         | `api.registerRealtimeVoiceProvider(...)`         | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| فهم الوسائط    | `api.registerMediaUnderstandingProvider(...)`    | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الصور       | `api.registerImageGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الموسيقى       | `api.registerMusicGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الفيديو       | `api.registerVideoGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جلب الويب              | `api.registerWebFetchProvider(...)`              | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| بحث الويب             | `api.registerWebSearchProvider(...)`             | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| وسيط نتائج الأدوات | `api.registerAgentToolResultMiddleware(...)`     | [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api)                          |
| أدوات الوكيل            | `api.registerTool(...)`                          | أدناه                                                                           |
| أوامر مخصصة        | `api.registerCommand(...)`                       | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |
| خطافات Plugin           | `api.on(...)`                                    | [خطافات Plugin](/ar/plugins/hooks)                                                  |
| خطافات أحداث داخلية   | `api.registerHook(...)`                          | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |
| مسارات HTTP            | `api.registerHttpRoute(...)`                     | [العناصر الداخلية](/ar/plugins/architecture-internals#gateway-http-routes)                |
| أوامر فرعية لـ CLI        | `api.registerCli(...)`                           | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |

للاطلاع على API التسجيل الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api).

يمكن لـ Plugins المضمّنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
تحتاج إلى إعادة كتابة نتائج الأدوات بصورة غير متزامنة قبل أن يرى النموذج المخرجات. صرّح عن
أوقات التشغيل المستهدفة في `contracts.agentToolResultMiddleware`، على سبيل المثال
`["pi", "codex"]`. هذه وصلة موثوقة خاصة بـ Plugin مضمّن؛ وينبغي لـ
Plugins الخارجية تفضيل خطافات OpenClaw Plugin العادية ما لم يطوّر OpenClaw
سياسة ثقة صريحة لهذه الإمكانية.

إذا كان Plugin الخاص بك يسجّل طرق RPC مخصصة في Gateway، فاحتفظ بها تحت
بادئة خاصة بـ Plugin. تظل مساحات أسماء الإدارة الأساسية (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائمًا إلى
`operator.admin`، حتى إذا طلب Plugin نطاقًا أضيق.

دلالات حارس الخطافات التي يجب وضعها في الاعتبار:

- `before_tool_call`: يكون `{ block: true }` نهائيًا ويوقف المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: يُعامَل `{ block: false }` على أنه لا قرار.
- `before_tool_call`: يوقف `{ requireApproval: true }` تنفيذ الوكيل مؤقتًا ويطلب موافقة المستخدم عبر طبقة موافقات التنفيذ، أو أزرار Telegram، أو تفاعلات Discord، أو أمر `/approve` على أي قناة.
- `before_install`: يكون `{ block: true }` نهائيًا ويوقف المعالجات ذات الأولوية الأدنى.
- `before_install`: يُعامَل `{ block: false }` على أنه لا قرار.
- `message_sending`: يكون `{ cancel: true }` نهائيًا ويوقف المعالجات ذات الأولوية الأدنى.
- `message_sending`: يُعامَل `{ cancel: false }` على أنه لا قرار.
- `message_received`: فضّل حقل `threadId` المطبوع عندما تحتاج إلى توجيه سلسلة/موضوع وارد. احتفظ بـ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: فضّل حقول التوجيه المطبوعة `replyToId` / `threadId` على مفاتيح metadata الخاصة بالقناة.

يتعامل أمر `/approve` مع موافقات التنفيذ وPlugin معًا باستخدام رجوع محدود: عندما لا يُعثر على معرّف موافقة تنفيذ، يعيد OpenClaw تجربة المعرّف نفسه عبر موافقات Plugin. يمكن تكوين إعادة توجيه موافقات Plugin بشكل مستقل عبر `approvals.plugin` في الإعدادات.

إذا احتاجت سباكة الموافقات المخصصة إلى اكتشاف حالة الرجوع المحدود نفسها،
فضّل `isApprovalNotFoundError` من `openclaw/plugin-sdk/error-runtime`
بدلًا من مطابقة سلاسل انتهاء صلاحية الموافقات يدويًا.

راجع [خطافات Plugin](/ar/plugins/hooks) للاطلاع على أمثلة ومرجع الخطافات.

## تسجيل أدوات الوكيل

الأدوات هي دوال مطبوعة يمكن لـ LLM استدعاؤها. يمكن أن تكون مطلوبة (متاحة دائمًا)
أو اختيارية (يشترك فيها المستخدم):

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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

تتلقى مصانع الأدوات كائن سياق يوفّره وقت التشغيل. استخدم
`ctx.activeModel` عندما تحتاج الأداة إلى تسجيل النموذج النشط للدورة الحالية
أو عرضه أو التكيّف معه. يمكن أن يتضمن الكائن `provider` و`modelId` و
`modelRef`. تعامل معه باعتباره بيانات وصفية معلوماتية لوقت التشغيل، وليس
حدا أمنيا ضد المشغّل المحلي أو كود Plugin المثبت أو وقت تشغيل OpenClaw معدل.
بالنسبة إلى الأدوات المحلية الحساسة، أبق اشتراكا صريحا من Plugin أو المشغّل
وافشل بإغلاق آمن عندما تكون بيانات النموذج النشط الوصفية مفقودة أو غير مناسبة.

يجب أيضا التصريح عن كل أداة مسجلة باستخدام `api.registerTool(...)` في
بيان Plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

يلتقط OpenClaw الوصف المتحقق منه من الأداة المسجلة ويخزّنه مؤقتا،
لذلك لا تكرر Plugins بيانات `description` أو المخطط في البيان. يصرح
عقد البيان بالملكية والاكتشاف فقط؛ أما التنفيذ فيستدعي تنفيذ الأداة
المسجلة الحية.
عيّن `toolMetadata.<tool>.optional: true` للأدوات المسجلة باستخدام
`api.registerTool(..., { optional: true })` كي يستطيع OpenClaw تجنب تحميل
وقت تشغيل ذلك Plugin إلى أن تُدرج الأداة صراحة في قائمة السماح.

يمكّن المستخدمون الأدوات الاختيارية في الإعدادات:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- يجب ألا تتعارض أسماء الأدوات مع أدوات النواة (يتم تخطي التعارضات)
- يتم تخطي الأدوات ذات كائنات التسجيل غير السليمة، بما في ذلك غياب `parameters`، والإبلاغ عنها في تشخيصات Plugin بدلا من كسر تشغيلات الوكيل
- استخدم `optional: true` للأدوات ذات الآثار الجانبية أو متطلبات الملفات الثنائية الإضافية
- يمكن للمستخدمين تمكين كل أدوات Plugin بإضافة معرّف Plugin إلى `tools.allow`

## تسجيل أوامر CLI

يمكن أن تضيف Plugins مجموعات أوامر جذرية إلى `openclaw` باستخدام `api.registerCli`. وفّر
`descriptors` لكل جذر أمر من المستوى الأعلى كي يستطيع OpenClaw عرض الأمر وتوجيهه
دون تحميل كل وقت تشغيل Plugin بلهفة.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

بعد التثبيت، تحقق من تسجيل وقت التشغيل ونفذ الأمر:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## اصطلاحات الاستيراد

استورد دائما من مسارات `openclaw/plugin-sdk/<subpath>` المركزة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

للمرجع الكامل للمسارات الفرعية، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview).

داخل Plugin الخاص بك، استخدم ملفات البرميل المحلية (`api.ts` و`runtime-api.ts`) لعمليات
الاستيراد الداخلية - ولا تستورد Plugin الخاص بك أبدا عبر مساره في SDK.

بالنسبة إلى Plugins المزوّد، أبق المساعدات الخاصة بالمزوّد في براميل جذر الحزمة
تلك ما لم يكن الحد الفاصل عاما بحق. الأمثلة المضمنة الحالية:

- Anthropic: مغلفات بث Claude ومساعدات `service_tier` / beta
- OpenAI: بُناة المزوّد، ومساعدات النموذج الافتراضي، ومزوّدو الوقت الفعلي
- OpenRouter: باني المزوّد مع مساعدات الإعداد الأولي/التكوين

إذا كان المساعد مفيدا فقط داخل حزمة مزوّد مضمنة واحدة، فأبقه على ذلك الحد الفاصل
في جذر الحزمة بدلا من ترقيته إلى `openclaw/plugin-sdk/*`.

ما زالت بعض حدود المساعدات المولدة `openclaw/plugin-sdk/<bundled-id>` موجودة
لصيانة Plugins المضمنة عندما يكون لها استخدام مالك متتبع. تعامل معها كأسطح
محجوزة، لا كنمط افتراضي لـ Plugins الطرف الثالث الجديدة.

## قائمة تحقق ما قبل الإرسال

<Check>تحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>بيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم كل عمليات الاستيراد مسارات `plugin-sdk/<subpath>` المركزة</Check>
<Check>تستخدم عمليات الاستيراد الداخلية وحدات محلية، وليس استيرادات ذاتية من SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (لـ Plugins داخل المستودع)</Check>

## اختبار إصدار beta

1. راقب وسوم إصدارات GitHub على [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم beta مثل `v2026.3.N-beta.1`. يمكنك أيضا تفعيل الإشعارات لحساب OpenClaw الرسمي على X [@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر Plugin الخاص بك مقابل وسم beta فور ظهوره. تكون النافذة قبل الإصدار المستقر عادة بضع ساعات فقط.
3. انشر في سلسلة Plugin الخاصة بك في قناة Discord المسماة `plugin-forum` بعد الاختبار، إما بعبارة `all good` أو بما تعطل. إذا لم تكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطل شيء ما، فافتح مشكلة أو حدّثها بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق وسم `beta-blocker`. ضع رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط المشكلة في كل من PR وسلسلة Discord الخاصة بك. لا يستطيع المساهمون وسم PRs، لذلك يكون العنوان هو إشارة جهة PR للمشرفين والأتمتة. يتم دمج العوائق التي لديها PR؛ أما العوائق التي لا تملك واحدا فقد تُشحن على أي حال. يراقب المشرفون هذه السلاسل أثناء اختبار beta.
6. الصمت يعني أن كل شيء أخضر. إذا فاتتك النافذة، فمن المرجح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Plugins القنوات" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابن Plugin لقناة مراسلة
  </Card>
  <Card title="Plugins المزوّدين" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابن Plugin لمزوّد نموذج
  </Card>
  <Card title="Plugins خلفية CLI" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    سجّل خلفية CLI ذكاء اصطناعي محلية
  </Card>
  <Card title="نظرة عامة على SDK" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وواجهة API للتسجيل
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS، والبحث، والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="الاختبار" icon="test-tubes" href="/ar/plugins/sdk-testing">
    أدوات وأنماط الاختبار
  </Card>
  <Card title="بيان Plugin" icon="file-json" href="/ar/plugins/manifest">
    مرجع مخطط البيان الكامل
  </Card>
</CardGroup>

## ذو صلة

- [معمارية Plugin](/ar/plugins/architecture) - تعمق في المعمارية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع SDK الخاص بـ Plugin
- [البيان](/ar/plugins/manifest) - تنسيق بيان Plugin
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - بناء Plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) - بناء Plugins المزوّدين
