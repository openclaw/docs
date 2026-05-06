---
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تضيف قناة أو موفّرًا أو أداة أو إمكانية أخرى جديدة إلى OpenClaw
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لك في OpenClaw خلال دقائق
title: بناء الإضافات
x-i18n:
    generated_at: "2026-05-06T08:06:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9718f8226a3586db06eae6715502edbd7a286f448e24cbef0a08f19a921c3a
    source_path: plugins/building-plugins.md
    workflow: 16
---

تضيف Plugins إلى OpenClaw قدرات جديدة: القنوات، ومزوّدي النماذج،
والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور،
وتوليد الفيديو، وجلب الويب، وبحث الويب، وأدوات الوكيل، أو أي
توليفة منها.

لست بحاجة إلى إضافة Plugin الخاص بك إلى مستودع OpenClaw. انشره إلى
[ClawHub](/ar/tools/clawhub) ويثبّته المستخدمون باستخدام
`openclaw plugins install clawhub:<package-name>`. لا تزال مواصفات الحزم المجرّدة
تُثبَّت من npm أثناء انتقال الإطلاق.

## المتطلبات الأساسية

- Node >= 22 ومدير حزم (npm أو pnpm)
- الإلمام بـ TypeScript (ESM)
- بالنسبة إلى Plugins داخل المستودع: يجب استنساخ المستودع وتنفيذ `pnpm install`. تطوير
  Plugins من نسخة مصدرية محلية يدعم pnpm فقط، لأن OpenClaw يحمّل Plugins المضمّنة
  من حزم مساحة العمل `extensions/*`.

## ما نوع Plugin؟

<CardGroup cols={3}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    اربط OpenClaw بمنصة مراسلة (Discord، IRC، وما إلى ذلك)
  </Card>
  <Card title="Plugin مزوّد" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف مزوّد نموذج (LLM، أو وكيل، أو نقطة نهاية مخصّصة)
  </Card>
  <Card title="Plugin أداة / خطاف" icon="wrench" href="/ar/plugins/hooks">
    سجّل أدوات الوكيل أو خطافات الأحداث أو الخدمات - تابع أدناه
  </Card>
</CardGroup>

بالنسبة إلى Plugin قناة لا يُضمن تثبيته عند تشغيل الإعداد/التهيئة الأولية،
استخدم `createOptionalChannelSetupSurface(...)` من
`openclaw/plugin-sdk/channel-setup`. ينتج ذلك زوجًا من محوّل إعداد + معالج إرشادي
يعلن متطلب التثبيت ويفشل بإغلاق آمن عند عمليات كتابة الإعدادات الحقيقية
إلى أن يُثبَّت Plugin.

## البدء السريع: Plugin أداة

ينشئ هذا الشرح Plugin بسيطًا يسجّل أداة وكيل. تتوفر أدلة مخصّصة للقنوات
وPlugins المزوّدين في الروابط أعلاه.

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
    في `contracts.tools` حتى يتمكن OpenClaw من اكتشاف Plugin المالك
    من دون تحميل كل وقت تشغيل لكل Plugin. ينبغي أن تعلن Plugins أيضًا
    `activation.onStartup` بشكل مقصود. يضبطه هذا المثال على `true`. راجع
    [البيان](/ar/plugins/manifest) للاطلاع على المخطط الكامل. تعيش مقاطع النشر المرجعية في ClawHub
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

    `definePluginEntry` مخصّص لـ Plugins غير القنوات. بالنسبة إلى القنوات، استخدم
    `defineChannelPluginEntry` - راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).
    للاطلاع على خيارات نقطة الدخول الكاملة، راجع [نقاط الدخول](/ar/plugins/sdk-entrypoints).

  </Step>

  <Step title="اختبر وانشر">

    **Plugins الخارجية:** تحقّق منها وانشرها باستخدام ClawHub، ثم ثبّتها:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    تُثبَّت مواصفات الحزم المجرّدة مثل `@myorg/openclaw-my-plugin` من npm أثناء
    انتقال الإطلاق. استخدم `clawhub:` عندما تريد الاعتماد على حل ClawHub.

    **Plugins داخل المستودع:** ضعها تحت شجرة مساحة عمل Plugin المضمّنة - تُكتشف تلقائيًا.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قدرات Plugin

يمكن لـ Plugin واحد تسجيل أي عدد من القدرات عبر كائن `api`:

| القدرة             | طريقة التسجيل                              | الدليل التفصيلي                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| الاستدلال النصي (LLM)   | `api.registerProvider(...)`                      | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins)                               |
| خلفية استدلال CLI  | `api.registerCliBackend(...)`                    | [خلفيات CLI](/ar/gateway/cli-backends)                                           |
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
| أوامر مخصّصة        | `api.registerCommand(...)`                       | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |
| خطافات Plugin           | `api.on(...)`                                    | [خطافات Plugin](/ar/plugins/hooks)                                                  |
| خطافات أحداث داخلية   | `api.registerHook(...)`                          | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |
| مسارات HTTP            | `api.registerHttpRoute(...)`                     | [العناصر الداخلية](/ar/plugins/architecture-internals#gateway-http-routes)                |
| أوامر CLI الفرعية        | `api.registerCli(...)`                           | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |

للاطلاع على واجهة API التسجيل الكاملة، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api).

يمكن لـ Plugins المضمّنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما تحتاج
إلى إعادة كتابة غير متزامنة لنتائج الأدوات قبل أن يرى النموذج المخرجات. أعلن
أوقات التشغيل المستهدفة في `contracts.agentToolResultMiddleware`، على سبيل المثال
`["pi", "codex"]`. هذه وصلة موثوقة خاصة بـ Plugin مضمّن؛ ينبغي لـ
Plugins الخارجية تفضيل خطافات Plugin العادية في OpenClaw ما لم يطوّر OpenClaw
سياسة ثقة صريحة لهذه القدرة.

إذا سجّل Plugin الخاص بك طرق RPC مخصّصة لـ Gateway، فاجعلها على
بادئة خاصة بـ Plugin. تبقى مساحات أسماء الإدارة الأساسية (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائمًا إلى
`operator.admin`، حتى إذا طلب Plugin نطاقًا أضيق.

دلالات حراسة الخطافات التي ينبغي مراعاتها:

- `before_tool_call`: تكون `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل `{ block: false }` كعدم اتخاذ قرار.
- `before_tool_call`: تؤدي `{ requireApproval: true }` إلى إيقاف تنفيذ الوكيل مؤقتًا وتطلب موافقة المستخدم عبر طبقة موافقات التنفيذ، أو أزرار Telegram، أو تفاعلات Discord، أو أمر `/approve` على أي قناة.
- `before_install`: تكون `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل `{ block: false }` كعدم اتخاذ قرار.
- `message_sending`: تكون `{ cancel: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل `{ cancel: false }` كعدم اتخاذ قرار.
- `message_received`: فضّل حقل `threadId` المطبوع عندما تحتاج إلى توجيه سلسلة/موضوع وارد. احتفظ بـ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: فضّل حقول التوجيه المطبوع `replyToId` / `threadId` على مفاتيح البيانات الوصفية الخاصة بالقنوات.

يتعامل أمر `/approve` مع موافقات التنفيذ وPlugin معًا من خلال رجوع احتياطي محدود: عندما لا يُعثر على معرّف موافقة تنفيذ، يعيد OpenClaw محاولة المعرّف نفسه عبر موافقات Plugin. يمكن ضبط تمرير موافقات Plugin بشكل مستقل عبر `approvals.plugin` في الإعدادات.

إذا كانت بنية الموافقة المخصّصة تحتاج إلى اكتشاف حالة الرجوع الاحتياطي المحدودة نفسها،
ففضّل `isApprovalNotFoundError` من `openclaw/plugin-sdk/error-runtime`
بدلًا من مطابقة سلاسل انتهاء صلاحية الموافقة يدويًا.

راجع [خطافات Plugin](/ar/plugins/hooks) للاطلاع على الأمثلة ومرجع الخطافات.

## تسجيل أدوات الوكيل

الأدوات هي دوال مطبوعة يمكن لـ LLM استدعاؤها. يمكن أن تكون مطلوبة (متاحة دائمًا)
أو اختيارية (يتطلب تفعيل المستخدم):

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

يجب أيضًا إعلان كل أداة مسجّلة باستخدام `api.registerTool(...)` في
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

تلتقط OpenClaw الواصف المتحقق منه من الأداة المسجلة وتخزنه مؤقتا،
لذلك لا تكرر Plugins بيانات `description` أو المخطط في البيان. لا يعلن
عقد البيان إلا الملكية والاكتشاف؛ أما التنفيذ فما زال يستدعي
تنفيذ الأداة الحي المسجل.
اضبط `toolMetadata.<tool>.optional: true` للأدوات المسجلة باستخدام
`api.registerTool(..., { optional: true })` حتى تتمكن OpenClaw من تجنب تحميل
وقت تشغيل ذلك Plugin إلى أن توضع الأداة صراحة في قائمة السماح.

يمكّن المستخدمون الأدوات الاختيارية في الإعدادات:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- يجب ألا تتعارض أسماء الأدوات مع أدوات النواة (يتم تخطي التعارضات)
- يتم تخطي الأدوات ذات كائنات التسجيل غير السليمة، بما في ذلك غياب `parameters`، والإبلاغ عنها في تشخيصات Plugin بدلا من تعطيل تشغيلات الوكيل
- استخدم `optional: true` للأدوات ذات الآثار الجانبية أو متطلبات ثنائية إضافية
- يمكن للمستخدمين تمكين كل الأدوات من Plugin بإضافة معرّف Plugin إلى `tools.allow`

## تسجيل أوامر CLI

يمكن لـ Plugins إضافة مجموعات أوامر جذرية لـ `openclaw` باستخدام `api.registerCli`. وفّر
`descriptors` لكل جذر أمر من المستوى الأعلى حتى تتمكن OpenClaw من عرض
الأمر وتوجيهه دون تحميل كل أوقات تشغيل Plugins بشغف.

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

استورد دائما من مسارات `openclaw/plugin-sdk/<subpath>` المركزة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

للاطلاع على مرجع المسارات الفرعية الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview).

داخل Plugin الخاص بك، استخدم ملفات البرميل المحلية (`api.ts`، `runtime-api.ts`) من أجل
الاستيرادات الداخلية - لا تستورد أبدا Plugin الخاص بك عبر مسار SDK الخاص به.

بالنسبة إلى Plugins المزوّدين، أبقِ المساعدات الخاصة بالمزوّد في براميل
جذر الحزمة تلك ما لم تكن الواجهة عامة حقا. أمثلة الحزمة الحالية:

- Anthropic: أغلفة تدفق Claude ومساعدات `service_tier` / beta
- OpenAI: منشئات المزوّد، ومساعدات النموذج الافتراضي، ومزوّدو الوقت الفعلي
- OpenRouter: منشئ المزوّد مع مساعدات الإعداد/التهيئة

إذا كان المساعد مفيدا فقط داخل حزمة مزوّد مضمّنة واحدة، فأبقِه على تلك
واجهة جذر الحزمة بدلا من ترقيته إلى `openclaw/plugin-sdk/*`.

ما زالت بعض واجهات المساعدة المولدة `openclaw/plugin-sdk/<bundled-id>` موجودة
لصيانة Plugins المضمنة عندما يكون لديها استخدام متتبع من المالك. تعامل مع هذه
كسطوح محجوزة، لا كنمط افتراضي لـ Plugins الجديدة التابعة لجهات خارجية.

## قائمة التحقق قبل الإرسال

<Check>يحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>بيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم كل الاستيرادات مسارات `plugin-sdk/<subpath>` المركزة</Check>
<Check>تستخدم الاستيرادات الداخلية وحدات محلية، لا استيرادات ذاتية من SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (Plugins داخل المستودع)</Check>

## اختبار إصدار بيتا

1. راقب وسوم إصدارات GitHub على [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم بيتا مثل `v2026.3.N-beta.1`. يمكنك أيضا تشغيل الإشعارات لحساب OpenClaw الرسمي على X ‏[@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر Plugin الخاص بك مقابل وسم بيتا فور ظهوره. عادة ما تكون النافذة قبل المستقر بضع ساعات فقط.
3. انشر في سلسلة Plugin الخاص بك في قناة Discord المسماة `plugin-forum` بعد الاختبار، إما بكتابة `all good` أو ما تعطل. إذا لم تكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطل شيء ما، فافتح مشكلة أو حدّثها بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق الوسم `beta-blocker`. ضع رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط المشكلة في كل من PR وسلسلة Discord الخاصة بك. لا يمكن للمساهمين وسم PRs، لذا يكون العنوان إشارة جهة PR للمشرفين والأتمتة. يتم دمج العوائق التي لديها PR؛ أما العوائق التي بلا PR فقد تشحن على أي حال. يراقب المشرفون هذه السلاسل أثناء اختبار بيتا.
6. الصمت يعني أن كل شيء أخضر. إذا فاتتك النافذة، فمن المرجح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Plugins القنوات" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ Plugin قناة مراسلة
  </Card>
  <Card title="Plugins المزوّدين" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ Plugin مزوّد نماذج
  </Card>
  <Card title="نظرة عامة على SDK" icon="book-open" href="/ar/plugins/sdk-overview">
    خريطة الاستيراد ومرجع API التسجيل
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

- [بنية Plugin](/ar/plugins/architecture) - تعمق في البنية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع SDK الخاص بـ Plugin
- [البيان](/ar/plugins/manifest) - تنسيق بيان Plugin
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - بناء Plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) - بناء Plugins المزوّدين
