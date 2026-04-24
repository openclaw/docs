---
read_when:
    - أنت تريد إنشاء Plugin جديدة لـ OpenClaw
    - أنت تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تضيف قناة جديدة، أو مزوّدًا جديدًا، أو أداة جديدة، أو قدرة أخرى إلى OpenClaw
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لـ OpenClaw في دقائق معدودة
title: Building plugins
x-i18n:
    generated_at: "2026-04-24T07:53:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

توسّع Plugins في OpenClaw بإمكانات جديدة: القنوات، ومزوّدو النماذج،
والنطق، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور،
وتوليد الفيديو، وجلب الويب، والبحث في الويب، وأدوات الوكيل، أو أي
تركيبة منها.

لا تحتاج إلى إضافة Plugin الخاصة بك إلى مستودع OpenClaw. انشرها على
[ClawHub](/ar/tools/clawhub) أو npm، ويقوم المستخدمون بتثبيتها باستخدام
`openclaw plugins install <package-name>`. يحاول OpenClaw استخدام ClawHub أولًا ثم
يعود تلقائيًا إلى npm.

## المتطلبات المسبقة

- Node >= 22 ومدير حزم (npm أو pnpm)
- الإلمام بـ TypeScript (ESM)
- بالنسبة إلى Plugins داخل المستودع: يجب استنساخ المستودع وتشغيل `pnpm install`

## ما نوع Plugin؟

<CardGroup cols={3}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    وصّل OpenClaw بمنصة مراسلة (Discord، IRC، إلخ.)
  </Card>
  <Card title="Plugin مزوّد" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف مزوّد نماذج (LLM، أو proxy، أو نقطة نهاية مخصصة)
  </Card>
  <Card title="Plugin أداة / hook" icon="wrench">
    سجّل أدوات الوكيل، أو event hooks، أو الخدمات — واصل أدناه
  </Card>
</CardGroup>

بالنسبة إلى Plugin قناة غير مضمونة التثبيت عند تشغيل
onboarding/setup، استخدم `createOptionalChannelSetupSurface(...)` من
`openclaw/plugin-sdk/channel-setup`. فهي تنتج زوج setup adapter + wizard
يعلن عن متطلب التثبيت ويفشل بشكل مغلق عند عمليات الكتابة الحقيقية على
الإعداد إلى أن يتم تثبيت Plugin.

## البدء السريع: Plugin أداة

تنشئ هذه الجولة Plugin بسيطة تسجّل أداة وكيل. أما Plugins القنوات
والمزوّدين فلها أدلة مخصصة مرتبطة أعلاه.

<Steps>
  <Step title="أنشئ الحزمة وmanifest">
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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    تحتاج كل Plugin إلى manifest، حتى من دون أي إعداد. راجع
    [Manifest](/ar/plugins/manifest) للاطلاع على المخطط الكامل. وتوجد مقتطفات
    النشر الرسمية على ClawHub في `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="اكتب نقطة الإدخال">

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

    إن `definePluginEntry` مخصص للـ Plugins غير الخاصة بالقنوات. أما للقنوات، فاستخدم
    `defineChannelPluginEntry` — راجع [Channel Plugins](/ar/plugins/sdk-channel-plugins).
    وللاطلاع على الخيارات الكاملة لنقطة الإدخال، راجع [Entry Points](/ar/plugins/sdk-entrypoints).

  </Step>

  <Step title="اختبر وانشر">

    **Plugins الخارجية:** تحقّق وانشر باستخدام ClawHub، ثم ثبّت:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    كما يتحقق OpenClaw أيضًا من ClawHub قبل npm عند استخدام
    مواصفات الحزم العارية مثل `@myorg/openclaw-my-plugin`.

    **Plugins داخل المستودع:** ضعها تحت شجرة مساحة عمل Plugins المضمّنة — وسيتم اكتشافها تلقائيًا.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## إمكانات Plugin

يمكن لـ Plugin واحدة تسجيل أي عدد من الإمكانات عبر الكائن `api`:

| الإمكانية               | طريقة التسجيل                                   | الدليل التفصيلي                                                                 |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| استدلال نصي (LLM)       | `api.registerProvider(...)`                      | [Provider Plugins](/ar/plugins/sdk-provider-plugins)                              |
| واجهة CLI خلفية للاستدلال | `api.registerCliBackend(...)`                    | [CLI Backends](/ar/gateway/cli-backends)                                          |
| قناة / مراسلة           | `api.registerChannel(...)`                       | [Channel Plugins](/ar/plugins/sdk-channel-plugins)                                |
| نطق (TTS/STT)           | `api.registerSpeechProvider(...)`                | [Provider Plugins](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| نسخ فوري                | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| صوت فوري                | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| فهم الوسائط             | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الصور             | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الموسيقى          | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الفيديو           | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جلب الويب               | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| البحث في الويب          | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| امتداد Pi مضمّن         | `api.registerEmbeddedExtensionFactory(...)`      | [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api)                    |
| أدوات الوكيل            | `api.registerTool(...)`                          | أدناه                                                                          |
| أوامر مخصصة             | `api.registerCommand(...)`                       | [Entry Points](/ar/plugins/sdk-entrypoints)                                       |
| Event hooks             | `api.registerHook(...)`                          | [Entry Points](/ar/plugins/sdk-entrypoints)                                       |
| مسارات HTTP             | `api.registerHttpRoute(...)`                     | [Internals](/ar/plugins/architecture-internals#gateway-http-routes)               |
| أوامر CLI فرعية         | `api.registerCli(...)`                           | [Entry Points](/ar/plugins/sdk-entrypoints)                                       |

للاطلاع على واجهة API الكاملة للتسجيل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api).

استخدم `api.registerEmbeddedExtensionFactory(...)` عندما تحتاج Plugin إلى
hooks خاصة بـ Pi embedded-runner مثل إعادة كتابة `tool_result`
بشكل غير متزامن قبل إصدار رسالة نتيجة الأداة النهائية. وفضّل hooks
العادية الخاصة بـ OpenClaw عندما لا يحتاج العمل إلى توقيت امتداد Pi.

إذا كانت Plugin الخاصة بك تسجّل طرق Gateway RPC مخصصة، فأبقها على
بادئة خاصة بالـ Plugin. وتظل مساحات أسماء الإدارة الأساسية (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتحل دائمًا إلى
`operator.admin`، حتى لو طلبت Plugin نطاقًا أضيق.

دلالات حراس hooks التي يجب أخذها في الاعتبار:

- `before_tool_call`: القيمة `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: القيمة `{ block: false }` تُعامل على أنها بلا قرار.
- `before_tool_call`: القيمة `{ requireApproval: true }` توقف تنفيذ الوكيل مؤقتًا وتطلب موافقة المستخدم عبر تراكب موافقات exec، أو أزرار Telegram، أو تفاعلات Discord، أو الأمر `/approve` على أي قناة.
- `before_install`: القيمة `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_install`: القيمة `{ block: false }` تُعامل على أنها بلا قرار.
- `message_sending`: القيمة `{ cancel: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `message_sending`: القيمة `{ cancel: false }` تُعامل على أنها بلا قرار.
- `message_received`: فضّل الحقل typed `threadId` عندما تحتاج إلى توجيه الخيط/الموضوع الوارد. واحتفظ بـ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: فضّل حقول التوجيه typed `replyToId` / `threadId` على مفاتيح metadata الخاصة بالقناة.

يتعامل الأمر `/approve` مع موافقات exec وPlugin مع بديل احتياطي محدود: فعندما لا يتم العثور على معرّف موافقة exec، يعيد OpenClaw محاولة المعرّف نفسه عبر موافقات Plugin. ويمكن إعداد تمرير موافقات Plugin بشكل مستقل عبر `approvals.plugin` في الإعداد.

إذا احتاجت آلية الموافقات المخصصة إلى اكتشاف حالة البديل الاحتياطي المحدود نفسها،
ففضّل `isApprovalNotFoundError` من `openclaw/plugin-sdk/error-runtime`
بدل مطابقة سلاسل انتهاء صلاحية الموافقة يدويًا.

راجع [دلالات قرارات hooks في نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics) لمعرفة التفاصيل.

## تسجيل أدوات الوكيل

الأدوات هي دوال typed يمكن لـ LLM استدعاؤها. ويمكن أن تكون مطلوبة (متاحة
دائمًا) أو اختيارية (اشتراك من المستخدم):

```typescript
register(api) {
  // أداة مطلوبة — متاحة دائمًا
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // أداة اختيارية — يجب على المستخدم إضافتها إلى قائمة السماح
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

يفعّل المستخدمون الأدوات الاختيارية في الإعداد:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- يجب ألا تتعارض أسماء الأدوات مع الأدوات الأساسية (يتم تخطي التعارضات)
- استخدم `optional: true` للأدوات التي لها آثار جانبية أو متطلبات ملفات تنفيذية إضافية
- يمكن للمستخدمين تفعيل جميع الأدوات من Plugin بإضافة معرّف Plugin إلى `tools.allow`

## اصطلاحات الاستيراد

استورد دائمًا من مسارات فرعية مركزة بالشكل `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// خطأ: الجذر الأحادي (مهمل وسيُزال)
import { ... } from "openclaw/plugin-sdk";
```

للاطلاع على المرجع الكامل للمسارات الفرعية، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview).

داخل Plugin الخاصة بك، استخدم ملفات barrel محلية (`api.ts`, `runtime-api.ts`) من أجل
الاستيرادات الداخلية — ولا تستورد Plugin الخاصة بك أبدًا عبر مسار SDK الخاص بها.

بالنسبة إلى Provider Plugins، أبقِ المساعدات الخاصة بكل مزوّد داخل
ملفات barrel الموجودة في جذر تلك الحزمة ما لم يكن الحد الفاصل عامًا فعلًا. الأمثلة المضمّنة الحالية:

- Anthropic: مغلفات Claude stream والمساعدات الخاصة بـ `service_tier` / beta
- OpenAI: بُناة المزوّد، ومساعدات النماذج الافتراضية، ومزوّدو realtime
- OpenRouter: باني المزوّد بالإضافة إلى مساعدات onboarding/config

إذا كان المساعد مفيدًا فقط داخل حزمة مزوّد مضمّنة واحدة، فأبقِه على ذلك
الحد الفاصل في جذر الحزمة بدل ترقيته إلى `openclaw/plugin-sdk/*`.

لا تزال بعض حدود المساعدة المولدة في `openclaw/plugin-sdk/<bundled-id>` موجودة من أجل
صيانة bundled-plugin والتوافق، مثل
`plugin-sdk/feishu-setup` أو `plugin-sdk/zalo-setup`. تعامل مع هذه على أنها
أسطح محجوزة، لا على أنها النمط الافتراضي لـ Plugins الجديدة التابعة لجهات خارجية.

## قائمة التحقق قبل الإرسال

<Check>يحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>ملف manifest **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الإدخال `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم جميع الاستيرادات مسارات مركزة من نوع `plugin-sdk/<subpath>`</Check>
<Check>تستخدم الاستيرادات الداخلية وحدات محلية، وليس استيرادات ذاتية من SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (بالنسبة إلى Plugins داخل المستودع)</Check>

## اختبار الإصدار التجريبي Beta

1. راقب وسوم GitHub release على [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم Beta مثل `v2026.3.N-beta.1`. ويمكنك أيضًا تفعيل الإشعارات لحساب OpenClaw الرسمي على X [@openclaw](https://x.com/openclaw) من أجل إعلانات الإصدارات.
2. اختبر Plugin الخاصة بك على وسم Beta بمجرد ظهوره. فالنافذة قبل الإصدار المستقر عادة لا تتجاوز بضع ساعات.
3. انشر في سلسلة Plugin الخاصة بك ضمن قناة Discord المسماة `plugin-forum` بعد الاختبار برسالة `all good` أو بما الذي تعطل. وإذا لم يكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطل شيء ما، فافتح issue أو حدّث واحدة بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق وسم `beta-blocker`. ثم ضع رابط issue في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط issue في كل من PR وسلسلة Discord الخاصة بك. لا يستطيع المساهمون وسم PRs، لذا يكون العنوان هو الإشارة الخاصة بجانب PR للمشرفين وللأتمتة. يتم دمج العوائق التي لها PR؛ أما العوائق التي لا تملك PR فقد تُشحن رغم ذلك. ويراقب المشرفون هذه السلاسل أثناء اختبار Beta.
6. الصمت يعني أن كل شيء بخير. وإذا فاتتك النافذة، فغالبًا سيهبط إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ Plugin قناة مراسلة
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ Plugin مزوّد نماذج
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
    المرجع الكامل لمخطط manifest
  </Card>
</CardGroup>

## ذو صلة

- [Plugin Architecture](/ar/plugins/architecture) — تعمق في البنية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع Plugin SDK
- [Manifest](/ar/plugins/manifest) — تنسيق manifest الخاصة بـ plugin
- [Channel Plugins](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Provider Plugins](/ar/plugins/sdk-provider-plugins) — بناء Plugins المزوّدين
