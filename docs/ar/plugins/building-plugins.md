---
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تضيف قناة جديدة أو موفرًا أو أداة أو إمكانية أخرى إلى OpenClaw
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لك في دقائق
title: بناء Plugins
x-i18n:
    generated_at: "2026-04-30T08:12:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، ومزوّدي النماذج،
والكلام، والنسخ في الوقت الفعلي، والصوت في الوقت الفعلي، وفهم الوسائط، وتوليد
الصور، وتوليد الفيديو، وجلب الويب، وبحث الويب، وأدوات الوكيل، أو أي
مزيج منها.

لا تحتاج إلى إضافة Plugin الخاص بك إلى مستودع OpenClaw. انشره إلى
[ClawHub](/ar/tools/clawhub) ويثبّته المستخدمون باستخدام
`openclaw plugins install <package-name>`. يحاول OpenClaw استخدام ClawHub أولًا
ويعود تلقائيًا إلى npm للحزم التي لا تزال تستخدم توزيع npm.

## المتطلبات الأساسية

- Node >= 22 ومدير حزم (npm أو pnpm)
- الإلمام بـ TypeScript (ESM)
- بالنسبة إلى Plugins داخل المستودع: استنساخ المستودع وتنفيذ `pnpm install`

## ما نوع Plugin؟

<CardGroup cols={3}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    صِل OpenClaw بمنصة مراسلة (Discord، IRC، وما إلى ذلك)
  </Card>
  <Card title="Plugin مزوّد" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف مزوّد نماذج (LLM، أو وكيلًا وسيطًا، أو نقطة نهاية مخصصة)
  </Card>
  <Card title="Plugin أداة / خطاف" icon="wrench" href="/ar/plugins/hooks">
    سجّل أدوات الوكيل، أو خطافات الأحداث، أو الخدمات — تابع أدناه
  </Card>
</CardGroup>

بالنسبة إلى Plugin قناة لا يكون تثبيته مضمونًا عند تشغيل الإعداد الأولي/الإعداد،
استخدم `createOptionalChannelSetupSurface(...)` من
`openclaw/plugin-sdk/channel-setup`. ينتج ذلك زوجًا من محوّل إعداد + معالج
يوضح متطلب التثبيت ويفشل بإغلاق آمن عند عمليات كتابة الإعدادات الحقيقية
إلى أن يتم تثبيت Plugin.

## بدء سريع: Plugin أداة

ينشئ هذا الشرح Plugin بسيطًا يسجّل أداة وكيل. لدى Plugins القنوات
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

    يحتاج كل Plugin إلى بيان، حتى بدون إعدادات، وينبغي لكل Plugin أن
    يصرّح بـ `activation.onStartup` عن قصد. تحتاج الأدوات المسجّلة في وقت
    التشغيل إلى استيراد عند بدء التشغيل، لذلك يضبط هذا المثال القيمة على `true`. راجع
    [البيان](/ar/plugins/manifest) للاطلاع على المخطط الكامل. توجد مقتطفات نشر ClawHub
    المعيارية في `docs/snippets/plugin-publish/`.

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

    يفحص OpenClaw أيضًا ClawHub قبل npm لمواصفات الحزم المجرّدة مثل
    `@myorg/openclaw-my-plugin`؛ يظل npm خيارًا احتياطيًا للحزم التي لم
    تنتقل إلى ClawHub بعد.

    **Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugins المضمّنة — وسيتم اكتشافها تلقائيًا.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قدرات Plugins

يمكن لـ Plugin واحد تسجيل أي عدد من القدرات عبر كائن `api`:

| القدرة                 | طريقة التسجيل                                    | الدليل التفصيلي                                                                 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| استدلال نصي (LLM)      | `api.registerProvider(...)`                      | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins)                              |
| خلفية استدلال CLI      | `api.registerCliBackend(...)`                    | [خلفيات CLI](/ar/gateway/cli-backends)                                             |
| قناة / مراسلة          | `api.registerChannel(...)`                       | [Plugins القنوات](/ar/plugins/sdk-channel-plugins)                                 |
| الكلام (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| النسخ في الوقت الفعلي  | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| الصوت في الوقت الفعلي  | `api.registerRealtimeVoiceProvider(...)`         | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| فهم الوسائط            | `api.registerMediaUnderstandingProvider(...)`    | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الصور            | `api.registerImageGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الموسيقى         | `api.registerMusicGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الفيديو          | `api.registerVideoGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جلب الويب              | `api.registerWebFetchProvider(...)`              | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| بحث الويب              | `api.registerWebSearchProvider(...)`             | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| برمجية وسيطة لنتائج الأدوات | `api.registerAgentToolResultMiddleware(...)`     | [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api)                     |
| أدوات الوكيل           | `api.registerTool(...)`                          | أدناه                                                                           |
| أوامر مخصصة            | `api.registerCommand(...)`                       | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |
| خطافات Plugin          | `api.on(...)`                                    | [خطافات Plugin](/ar/plugins/hooks)                                                 |
| خطافات أحداث داخلية    | `api.registerHook(...)`                          | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |
| مسارات HTTP            | `api.registerHttpRoute(...)`                     | [التفاصيل الداخلية](/ar/plugins/architecture-internals#gateway-http-routes)        |
| أوامر CLI فرعية        | `api.registerCli(...)`                           | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |

للاطلاع على API التسجيل الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api).

يمكن لـ Plugins المضمّنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
تحتاج إلى إعادة كتابة غير متزامنة لنتائج الأدوات قبل أن يرى النموذج المخرجات. صرّح
ببيئات التشغيل المستهدفة في `contracts.agentToolResultMiddleware`، على سبيل المثال
`["pi", "codex"]`. هذه وصلة موثوقة خاصة بـ Plugin مضمّن؛ ينبغي لـ Plugins الخارجية
تفضيل خطافات Plugin المعتادة في OpenClaw ما لم يطوّر OpenClaw سياسة ثقة
صريحة لهذه القدرة.

إذا كان Plugin الخاص بك يسجّل طرق Gateway RPC مخصصة، فأبقها على بادئة
خاصة بـ Plugin. تبقى مساحات أسماء الإدارة الأساسية (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائمًا إلى
`operator.admin`، حتى إذا طلب Plugin نطاقًا أضيق.

دلالات حراسة الخطافات التي يجب تذكّرها:

- `before_tool_call`: تكون `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل `{ block: false }` على أنها عدم وجود قرار.
- `before_tool_call`: تؤدي `{ requireApproval: true }` إلى إيقاف تنفيذ الوكيل مؤقتًا وتطلب من المستخدم الموافقة عبر تراكب موافقة التنفيذ، أو أزرار Telegram، أو تفاعلات Discord، أو الأمر `/approve` على أي قناة.
- `before_install`: تكون `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل `{ block: false }` على أنها عدم وجود قرار.
- `message_sending`: تكون `{ cancel: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل `{ cancel: false }` على أنها عدم وجود قرار.
- `message_received`: فضّل الحقل المكتوب `threadId` عندما تحتاج إلى توجيه سلسلة/موضوع وارد. أبقِ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: فضّل حقول التوجيه المكتوبة `replyToId` / `threadId` على مفاتيح البيانات الوصفية الخاصة بالقناة.

يتعامل الأمر `/approve` مع كلٍ من موافقات التنفيذ وPlugin مع رجوع احتياطي محدود: عندما لا يتم العثور على معرّف موافقة تنفيذ، يعيد OpenClaw المحاولة بالمعرّف نفسه عبر موافقات Plugin. يمكن ضبط توجيه موافقات Plugin بشكل مستقل عبر `approvals.plugin` في الإعدادات.

إذا احتاجت سباكة الموافقات المخصصة إلى اكتشاف حالة الرجوع الاحتياطي المحدودة نفسها،
فضّل `isApprovalNotFoundError` من `openclaw/plugin-sdk/error-runtime`
بدلًا من مطابقة سلاسل انتهاء صلاحية الموافقة يدويًا.

راجع [خطافات Plugin](/ar/plugins/hooks) للاطلاع على أمثلة ومرجع الخطافات.

## تسجيل أدوات الوكيل

الأدوات هي دوال مكتوبة يمكن لـ LLM استدعاؤها. يمكن أن تكون مطلوبة (متاحة دائمًا)
أو اختيارية (اشتراك اختياري من المستخدم):

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

يمكّن المستخدمون الأدوات الاختيارية في الإعدادات:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- يجب ألا تتعارض أسماء الأدوات مع الأدوات الأساسية (يتم تخطي التعارضات)
- يتم تخطي الأدوات ذات كائنات التسجيل المشوهة، بما في ذلك غياب `parameters`، والإبلاغ عنها في تشخيصات Plugin بدلًا من كسر تشغيلات الوكيل
- استخدم `optional: true` للأدوات ذات الآثار الجانبية أو المتطلبات الثنائية الإضافية
- يمكن للمستخدمين تمكين كل الأدوات من Plugin عبر إضافة معرّف Plugin إلى `tools.allow`

## اصطلاحات الاستيراد

استورد دائمًا من مسارات `openclaw/plugin-sdk/<subpath>` المركّزة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

للاطلاع على مرجع المسار الفرعي الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview).

داخل Plugin الخاص بك، استخدم ملفات البرميل المحلية (`api.ts`، `runtime-api.ts`) من أجل
الاستيرادات الداخلية — لا تستورد Plugin الخاص بك مطلقًا عبر مساره في SDK.

بالنسبة إلى Plugins الخاصة بالمزوّدين، أبقِ المساعدات الخاصة بالمزوّد في
ملفات البرميل بجذر الحزمة ما لم يكن الحدّ الفاصل عامًا حقًا. أمثلة الحزم الحالية:

- Anthropic: مغلّفات تدفق Claude ومساعدات `service_tier` / beta
- OpenAI: بناة المزوّد، ومساعدات النموذج الافتراضي، ومزوّدو الوقت الفعلي
- OpenRouter: باني المزوّد بالإضافة إلى مساعدات الإعداد الأولي/التكوين

إذا كان المساعد مفيدًا فقط داخل حزمة مزوّد مضمّنة واحدة، فأبقِه على ذلك
الحدّ الفاصل في جذر الحزمة بدلًا من ترقيته إلى `openclaw/plugin-sdk/*`.

لا تزال بعض حدود المساعدة المولّدة `openclaw/plugin-sdk/<bundled-id>` موجودة من أجل
صيانة Plugin المضمّن عندما يكون لديها استخدام مالك متتبّع. تعامل معها على أنها
أسطح محجوزة، لا كنمط افتراضي لـ Plugins الجهات الخارجية الجديدة.

## قائمة تحقق ما قبل الإرسال

<Check>تحتوي **package.json** على بيانات تعريف `openclaw` الصحيحة</Check>
<Check>بيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الإدخال `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم جميع الاستيرادات مسارات مركّزة `plugin-sdk/<subpath>`</Check>
<Check>تستخدم الاستيرادات الداخلية وحدات محلية، لا استيرادات ذاتية من SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` ‏(Plugins داخل المستودع)</Check>

## اختبار إصدار Beta

1. راقب وسوم إصدارات GitHub على [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم Beta مثل `v2026.3.N-beta.1`. يمكنك أيضًا تفعيل الإشعارات لحساب OpenClaw الرسمي على X ‏[@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر Plugin الخاص بك مقابل وسم Beta بمجرد ظهوره. تكون النافذة قبل الإصدار المستقر عادة بضع ساعات فقط.
3. انشر في سلسلة Plugin الخاص بك في قناة Discord المسماة `plugin-forum` بعد الاختبار، إما بكتابة `all good` أو ما تعطل. إذا لم تكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطل شيء ما، فافتح مشكلة أو حدّثها بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق وسم `beta-blocker`. ضع رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط المشكلة في كل من PR وسلسلة Discord الخاصة بك. لا يستطيع المساهمون وسم PRs، لذلك يكون العنوان هو إشارة جانب PR للمشرفين والأتمتة. تُدمج العوائق التي لديها PR؛ وقد تُشحن العوائق التي لا تملك واحدًا على أي حال. يراقب المشرفون هذه السلاسل أثناء اختبار Beta.
6. الصمت يعني أن الأمور سليمة. إذا فاتتك النافذة، فمن المرجح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ Plugin لقناة مراسلة
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ Plugin لمزوّد نماذج
  </Card>
  <Card title="نظرة عامة على SDK" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وAPI التسجيل
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

- [معمارية Plugin](/ar/plugins/architecture) — تعمق في المعمارية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع Plugin SDK
- [البيان](/ar/plugins/manifest) — تنسيق بيان Plugin
- [Channel Plugins](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Provider Plugins](/ar/plugins/sdk-provider-plugins) — بناء Plugins المزوّدين
