---
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تضيف قناة أو مزوّدًا أو أداة أو إمكانية أخرى جديدة إلى OpenClaw
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لك في OpenClaw خلال دقائق
title: بناء Plugins
x-i18n:
    generated_at: "2026-05-02T07:35:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

توسّع Plugins إمكانات OpenClaw بإضافة قدرات جديدة: القنوات، ومزوّدي النماذج،
والكلام، والتفريغ النصي الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور،
وتوليد الفيديو، وجلب الويب، وبحث الويب، وأدوات الوكلاء، أو أي
مزيج منها.

لا تحتاج إلى إضافة Plugin الخاص بك إلى مستودع OpenClaw. انشره على
[ClawHub](/ar/tools/clawhub) ويثبّته المستخدمون باستخدام
`openclaw plugins install <package-name>`. يجرّب OpenClaw ClawHub أولًا ثم
ينتقل تلقائيًا إلى npm للحزم التي لا تزال تستخدم توزيع npm.

## المتطلبات الأساسية

- Node >= 22 ومدير حزم (npm أو pnpm)
- الإلمام بـ TypeScript (ESM)
- بالنسبة إلى Plugins داخل المستودع: استنساخ المستودع وتنفيذ `pnpm install`. تطوير Plugins
  من نسخة مصدرية محلية يقتصر على pnpm لأن OpenClaw يحمّل Plugins المضمّنة
  من حزم مساحة العمل `extensions/*`.

## ما نوع Plugin؟

<CardGroup cols={3}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    وصّل OpenClaw بمنصة مراسلة (Discord، IRC، إلخ.)
  </Card>
  <Card title="Plugin مزوّد" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف مزوّد نماذج (LLM، أو proxy، أو نقطة نهاية مخصصة)
  </Card>
  <Card title="Plugin أداة / hook" icon="wrench" href="/ar/plugins/hooks">
    سجّل أدوات وكلاء، أو hooks أحداث، أو خدمات — تابع أدناه
  </Card>
</CardGroup>

بالنسبة إلى Plugin قناة غير مضمون تثبيته عند تشغيل الإعداد/التهيئة الأولية،
استخدم `createOptionalChannelSetupSurface(...)` من
`openclaw/plugin-sdk/channel-setup`. فهو ينتج زوجًا من محوّل إعداد + معالج إرشادي
يعلن عن متطلب التثبيت ويفشل بشكل مغلق عند عمليات كتابة الإعداد الفعلية
إلى أن يتم تثبيت Plugin.

## بداية سريعة: Plugin أداة

ينشئ هذا الدليل التفصيلي Plugin بسيطًا يسجّل أداة وكيل. لدى Plugins القنوات
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
    في `contracts.tools` كي يتمكّن OpenClaw من اكتشاف Plugin المالك
    من دون تحميل بيئة تشغيل كل Plugin. ينبغي أن تعلن Plugins أيضًا
    `activation.onStartup` عن قصد. يضبطها هذا المثال على `true`. راجع
    [البيان](/ar/plugins/manifest) للاطلاع على المخطط الكامل. توجد مقاطع النشر الرسمية الخاصة بـ ClawHub
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
    `defineChannelPluginEntry` — راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).
    للاطلاع على خيارات نقطة الدخول الكاملة، راجع [نقاط الدخول](/ar/plugins/sdk-entrypoints).

  </Step>

  <Step title="اختبر وانشر">

    **Plugins الخارجية:** تحقّق وانشر باستخدام ClawHub، ثم ثبّت:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    يتحقق OpenClaw أيضًا من ClawHub قبل npm لمواصفات الحزم المجردة مثل
    `@myorg/openclaw-my-plugin`؛ ويظل npm خيارًا احتياطيًا للحزم التي
    لم تنتقل بعد إلى ClawHub.

    **Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugins المضمّنة — وسيتم اكتشافها تلقائيًا.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قدرات Plugin

يمكن لـ Plugin واحد تسجيل أي عدد من القدرات عبر كائن `api`:

| القدرة                 | طريقة التسجيل                                     | الدليل المفصل                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| استدلال النصوص (LLM)   | `api.registerProvider(...)`                      | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins)                               |
| خلفية استدلال CLI      | `api.registerCliBackend(...)`                    | [خلفيات CLI](/ar/gateway/cli-backends)                                           |
| القناة / المراسلة      | `api.registerChannel(...)`                       | [Plugins القنوات](/ar/plugins/sdk-channel-plugins)                                 |
| الكلام (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| التفريغ النصي الفوري   | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| الصوت الفوري           | `api.registerRealtimeVoiceProvider(...)`         | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| فهم الوسائط            | `api.registerMediaUnderstandingProvider(...)`    | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الصور            | `api.registerImageGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الموسيقى         | `api.registerMusicGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الفيديو          | `api.registerVideoGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جلب الويب              | `api.registerWebFetchProvider(...)`              | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| بحث الويب              | `api.registerWebSearchProvider(...)`             | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| وسيط نتائج الأدوات     | `api.registerAgentToolResultMiddleware(...)`     | [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api)                          |
| أدوات الوكلاء          | `api.registerTool(...)`                          | أدناه                                                                           |
| أوامر مخصصة            | `api.registerCommand(...)`                       | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |
| hooks Plugin           | `api.on(...)`                                    | [hooks Plugin](/ar/plugins/hooks)                                                  |
| hooks أحداث داخلية     | `api.registerHook(...)`                          | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |
| مسارات HTTP            | `api.registerHttpRoute(...)`                     | [العناصر الداخلية](/ar/plugins/architecture-internals#gateway-http-routes)                |
| أوامر CLI فرعية        | `api.registerCli(...)`                           | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |

للاطلاع على واجهة API التسجيل الكاملة، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api).

يمكن لـ Plugins المضمّنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
تحتاج إلى إعادة كتابة غير متزامنة لنتائج الأدوات قبل أن يرى النموذج المخرجات. أعلن عن
بيئات التشغيل المستهدفة في `contracts.agentToolResultMiddleware`، مثلًا
`["pi", "codex"]`. هذا seam موثوق لـ Plugin مضمّن؛ وينبغي لـ Plugins الخارجية
تفضيل hooks OpenClaw Plugin العادية ما لم يطوّر OpenClaw
سياسة ثقة صريحة لهذه القدرة.

إذا سجّل Plugin الخاص بك طرق RPC مخصصة لـ Gateway، فاجعلها ضمن
بادئة خاصة بـ Plugin. تبقى مساحات أسماء الإدارة الأساسية (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائمًا إلى
`operator.admin`، حتى إذا طلب Plugin نطاقًا أضيق.

دلالات حراسة hooks التي ينبغي الانتباه إليها:

- `before_tool_call`: يكون `{ block: true }` نهائيًا ويوقف المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل `{ block: false }` على أنها بلا قرار.
- `before_tool_call`: يؤدي `{ requireApproval: true }` إلى إيقاف تنفيذ الوكيل مؤقتًا ويطلب موافقة المستخدم عبر طبقة موافقة التنفيذ، أو أزرار Telegram، أو تفاعلات Discord، أو أمر `/approve` على أي قناة.
- `before_install`: يكون `{ block: true }` نهائيًا ويوقف المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل `{ block: false }` على أنها بلا قرار.
- `message_sending`: يكون `{ cancel: true }` نهائيًا ويوقف المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل `{ cancel: false }` على أنها بلا قرار.
- `message_received`: فضّل الحقل المطبوع `threadId` عندما تحتاج إلى توجيه السلاسل/الموضوعات الواردة. احتفظ بـ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: فضّل حقول التوجيه المطبوعة `replyToId` / `threadId` على مفاتيح البيانات الوصفية الخاصة بالقناة.

يتعامل أمر `/approve` مع كل من موافقات التنفيذ وموافقات Plugin مع fallback محدود: عندما لا يُعثر على معرّف موافقة تنفيذ، يعيد OpenClaw محاولة المعرّف نفسه عبر موافقات Plugin. يمكن تكوين تمرير موافقات Plugin بشكل مستقل عبر `approvals.plugin` في الإعدادات.

إذا احتاجت آلية الموافقة المخصصة إلى اكتشاف حالة fallback المحدودة نفسها،
فضّل `isApprovalNotFoundError` من `openclaw/plugin-sdk/error-runtime`
بدلًا من مطابقة سلاسل انتهاء صلاحية الموافقة يدويًا.

راجع [hooks Plugin](/ar/plugins/hooks) للاطلاع على أمثلة ومرجع hooks.

## تسجيل أدوات الوكلاء

الأدوات هي دوال مطبوعة يمكن لـ LLM استدعاؤها. يمكن أن تكون مطلوبة (متاحة دائمًا)
أو اختيارية (باشتراك المستخدم):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
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
بيان Plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

يفعّل المستخدمون الأدوات الاختيارية في الإعدادات:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- يجب ألا تتعارض أسماء الأدوات مع أدوات النواة (يتم تخطي التعارضات)
- يتم تخطي الأدوات ذات كائنات التسجيل غير الصحيحة، بما في ذلك التي تفتقد `parameters`، والإبلاغ عنها في تشخيصات Plugin بدلاً من تعطيل تشغيل الوكيل
- استخدم `optional: true` للأدوات ذات الآثار الجانبية أو متطلبات الملفات الثنائية الإضافية
- يمكن للمستخدمين تفعيل كل الأدوات من Plugin عن طريق إضافة معرّف Plugin إلى `tools.allow`

## تسجيل أوامر CLI

يمكن لـ Plugins إضافة مجموعات أوامر `openclaw` جذرية باستخدام `api.registerCli`. وفّر
`descriptors` لكل جذر أمر من المستوى الأعلى حتى يتمكن OpenClaw من عرض الأمر وتوجيهه
دون تحميل وقت تشغيل كل Plugin مسبقاً.

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

بعد التثبيت، تحقق من تسجيل وقت التشغيل ونفّذ الأمر:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## اصطلاحات الاستيراد

استورد دائماً من مسارات `openclaw/plugin-sdk/<subpath>` المركزة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

للاطلاع على مرجع المسارات الفرعية الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview).

داخل Plugin الخاص بك، استخدم ملفات barrel المحلية (`api.ts`، `runtime-api.ts`) من أجل
عمليات الاستيراد الداخلية — لا تستورد Plugin الخاص بك عبر مسار SDK الخاص به أبداً.

بالنسبة إلى Plugins المزوّدين، أبقِ المساعدات الخاصة بالمزوّدين في ملفات barrel
الموجودة في جذر الحزمة تلك، ما لم يكن الحدّ الفاصل عاماً حقاً. الأمثلة المضمّنة الحالية:

- Anthropic: أغلفة بث Claude ومساعدات `service_tier` / beta
- OpenAI: بناة المزوّد، ومساعدات النموذج الافتراضي، ومزوّدو الوقت الفعلي
- OpenRouter: باني المزوّد بالإضافة إلى مساعدات الإعداد/التهيئة

إذا كان أحد المساعدات مفيداً فقط داخل حزمة مزوّد مضمّنة واحدة، فأبقِه على حدّ
جذر الحزمة ذلك بدلاً من ترقيته إلى `openclaw/plugin-sdk/*`.

لا تزال بعض حدود المساعدة المولّدة `openclaw/plugin-sdk/<bundled-id>` موجودة من أجل
صيانة Plugins المضمّنة عندما يكون لديها استخدام مالك متتبَّع. تعامل معها كأسطح
محجوزة، لا كنمط افتراضي لـ Plugins خارجية جديدة.

## قائمة التحقق قبل الإرسال

<Check>يحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>ملف البيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم كل عمليات الاستيراد مسارات `plugin-sdk/<subpath>` المركزة</Check>
<Check>تستخدم عمليات الاستيراد الداخلية وحدات محلية، وليس استيراداً ذاتياً من SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (لـ Plugins داخل المستودع)</Check>

## اختبار إصدار beta

1. راقب وسوم إصدارات GitHub على [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم beta مثل `v2026.3.N-beta.1`. يمكنك أيضاً تفعيل الإشعارات لحساب OpenClaw الرسمي على X [@openclaw](https://x.com/openclaw) من أجل إعلانات الإصدارات.
2. اختبر Plugin الخاص بك مقابل وسم beta فور ظهوره. تكون النافذة قبل الإصدار المستقر عادةً بضع ساعات فقط.
3. انشر في سلسلة Plugin الخاصة بك في قناة Discord `plugin-forum` بعد الاختبار، إما بـ `all good` أو بما تعطل. إذا لم تكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطل شيء ما، فافتح مشكلة أو حدّث مشكلة بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق وسم `beta-blocker`. ضع رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط المشكلة في كل من PR وسلسلة Discord الخاصة بك. لا يستطيع المساهمون وسم PRs، لذلك يكون العنوان هو إشارة جانب PR للمشرفين والأتمتة. يتم دمج العوائق التي لديها PR؛ أما العوائق التي لا تملك واحداً فقد تُشحن على أي حال. يراقب المشرفون هذه السلاسل أثناء اختبار beta.
6. الصمت يعني أن كل شيء أخضر. إذا فاتتك النافذة، فمن المرجح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Plugins القنوات" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ Plugin لقناة مراسلة
  </Card>
  <Card title="Plugins المزوّدين" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ Plugin لمزوّد نماذج
  </Card>
  <Card title="نظرة عامة على SDK" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وواجهة API للتسجيل
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS والبحث والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="الاختبار" icon="test-tubes" href="/ar/plugins/sdk-testing">
    أدوات وأنماط الاختبار
  </Card>
  <Card title="بيان Plugin" icon="file-json" href="/ar/plugins/manifest">
    مرجع مخطط البيان الكامل
  </Card>
</CardGroup>

## ذو صلة

- [بنية Plugin](/ar/plugins/architecture) — تعمق في البنية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع SDK الخاص بـ Plugin
- [البيان](/ar/plugins/manifest) — تنسيق بيان Plugin
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) — بناء Plugins المزوّدين
