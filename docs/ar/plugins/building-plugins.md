---
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تضيف قناة أو مزوّدًا أو أداة أو إمكانية أخرى جديدة إلى OpenClaw
sidebarTitle: Getting Started
summary: أنشئ أول Plugin خاص بك لـ OpenClaw خلال دقائق
title: إنشاء Plugins
x-i18n:
    generated_at: "2026-05-02T20:49:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، ومزوّدي النماذج،
والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور،
وتوليد الفيديو، وجلب الويب، وبحث الويب، وأدوات الوكيل، أو أي
مزيج منها.

لست بحاجة إلى إضافة Plugin الخاص بك إلى مستودع OpenClaw. انشره إلى
[ClawHub](/ar/tools/clawhub) ويثبّته المستخدمون باستخدام
`openclaw plugins install clawhub:<package-name>`. لا تزال مواصفات الحزم المجرّدة
تُثبَّت من npm أثناء مرحلة انتقال الإطلاق.

## المتطلبات الأساسية

- Node >= 22 ومدير حزم (npm أو pnpm)
- الإلمام بـ TypeScript (ESM)
- بالنسبة إلى Plugins داخل المستودع: يجب أن يكون المستودع مستنسخًا وأن يكون `pnpm install` قد أُنجز. تطوير Plugins من نسخة مصدرية
  محلية مخصص لـ pnpm فقط لأن OpenClaw يحمّل Plugins المضمّنة
  من حزم مساحة العمل `extensions/*`.

## ما نوع Plugin؟

<CardGroup cols={3}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    اربط OpenClaw بمنصة مراسلة (Discord وIRC وما إلى ذلك)
  </Card>
  <Card title="Plugin مزوّد" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف مزوّد نماذج (LLM أو وسيطًا أو نقطة نهاية مخصصة)
  </Card>
  <Card title="Plugin أداة / خطّاف" icon="wrench" href="/ar/plugins/hooks">
    سجّل أدوات الوكيل أو خطاطيف الأحداث أو الخدمات — تابع أدناه
  </Card>
</CardGroup>

بالنسبة إلى Plugin قناة لا يمكن ضمان تثبيته عند تشغيل الإعداد/التهيئة،
استخدم `createOptionalChannelSetupSurface(...)` من
`openclaw/plugin-sdk/channel-setup`. يُنتج ذلك محوّل إعداد + زوج معالج
يروجان لمتطلب التثبيت ويفشلان بإغلاق عند عمليات كتابة الإعداد الفعلية
إلى أن يتم تثبيت Plugin.

## بداية سريعة: Plugin أداة

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

    يحتاج كل Plugin إلى بيان، حتى بدون إعدادات. يجب إدراج الأدوات
    المسجّلة وقت التشغيل في `contracts.tools` حتى يستطيع OpenClaw اكتشاف Plugin المالك
    بدون تحميل وقت تشغيل كل Plugin. ينبغي لـ Plugins أيضًا التصريح عن
    `activation.onStartup` بقصد واضح. يضبطه هذا المثال على `true`. راجع
    [البيان](/ar/plugins/manifest) للاطلاع على المخطط الكامل. توجد مقتطفات النشر
    الرسمية في ClawHub داخل `docs/snippets/plugin-publish/`.

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

    **Plugins خارجية:** تحقّق منها وانشرها باستخدام ClawHub، ثم ثبّتها:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    تُثبَّت مواصفات الحزم المجرّدة مثل `@myorg/openclaw-my-plugin` من npm أثناء
    مرحلة انتقال الإطلاق. استخدم `clawhub:` عندما تريد حلّ الحزم عبر ClawHub.

    **Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugins المضمّنة — تُكتشف تلقائيًا.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قدرات Plugin

يمكن لـ Plugin واحد تسجيل أي عدد من القدرات عبر كائن `api`:

| القدرة                 | طريقة التسجيل                                    | الدليل التفصيلي                                                                 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| استدلال النص (LLM)     | `api.registerProvider(...)`                      | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins)                              |
| خلفية استدلال CLI      | `api.registerCliBackend(...)`                    | [خلفيات CLI](/ar/gateway/cli-backends)                                             |
| القناة / المراسلة      | `api.registerChannel(...)`                       | [Plugins القنوات](/ar/plugins/sdk-channel-plugins)                                 |
| الكلام (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| النسخ الفوري           | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| الصوت الفوري           | `api.registerRealtimeVoiceProvider(...)`         | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| فهم الوسائط            | `api.registerMediaUnderstandingProvider(...)`    | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الصور            | `api.registerImageGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الموسيقى         | `api.registerMusicGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الفيديو          | `api.registerVideoGenerationProvider(...)`       | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جلب الويب              | `api.registerWebFetchProvider(...)`              | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| بحث الويب              | `api.registerWebSearchProvider(...)`             | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| وسيط نتائج الأدوات     | `api.registerAgentToolResultMiddleware(...)`     | [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api)                     |
| أدوات الوكيل           | `api.registerTool(...)`                          | أدناه                                                                           |
| أوامر مخصصة            | `api.registerCommand(...)`                       | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |
| خطاطيف Plugin          | `api.on(...)`                                    | [خطاطيف Plugin](/ar/plugins/hooks)                                                 |
| خطاطيف أحداث داخلية    | `api.registerHook(...)`                          | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |
| مسارات HTTP            | `api.registerHttpRoute(...)`                     | [الداخليات](/ar/plugins/architecture-internals#gateway-http-routes)                |
| أوامر CLI فرعية        | `api.registerCli(...)`                           | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |

للاطلاع على API التسجيل الكاملة، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api).

يمكن لـ Plugins المضمّنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
تحتاج إلى إعادة كتابة غير متزامنة لنتائج الأدوات قبل أن يرى النموذج المخرجات. صرّح عن
أوقات التشغيل المستهدفة في `contracts.agentToolResultMiddleware`، على سبيل المثال
`["pi", "codex"]`. هذا حدّ موثوق لـ Plugin مضمّن؛ ينبغي لـ Plugins الخارجية
تفضيل خطاطيف OpenClaw Plugin العادية ما لم يطوّر OpenClaw سياسة ثقة
صريحة لهذه القدرة.

إذا سجّل Plugin الخاص بك طرق Gateway RPC مخصصة، فأبقها ضمن بادئة
خاصة بـ Plugin. تبقى مساحات أسماء الإدارة الأساسية (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحلّ دائمًا إلى
`operator.admin`، حتى إذا طلب Plugin نطاقًا أضيق.

دلالات حراسة الخطّاف التي ينبغي تذكّرها:

- `before_tool_call`: تكون `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل `{ block: false }` على أنها بلا قرار.
- `before_tool_call`: تؤدي `{ requireApproval: true }` إلى إيقاف تنفيذ الوكيل مؤقتًا وتطلب من المستخدم الموافقة عبر طبقة موافقات التنفيذ، أو أزرار Telegram، أو تفاعلات Discord، أو الأمر `/approve` على أي قناة.
- `before_install`: تكون `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل `{ block: false }` على أنها بلا قرار.
- `message_sending`: تكون `{ cancel: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل `{ cancel: false }` على أنها بلا قرار.
- `message_received`: فضّل حقل `threadId` المطبوع عندما تحتاج إلى توجيه السلاسل/المواضيع الواردة. أبقِ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: فضّل حقول التوجيه المطبوعة `replyToId` / `threadId` على مفاتيح البيانات الوصفية الخاصة بالقنوات.

يتعامل الأمر `/approve` مع موافقات التنفيذ وPlugin معًا باستخدام رجوع محدود: عندما لا يُعثر على معرّف موافقة تنفيذ، يعيد OpenClaw محاولة المعرّف نفسه عبر موافقات Plugin. يمكن إعداد تمرير موافقات Plugin بشكل مستقل عبر `approvals.plugin` في الإعداد.

إذا احتاجت آلية موافقة مخصصة إلى اكتشاف حالة الرجوع المحدود نفسها،
فضّل `isApprovalNotFoundError` من `openclaw/plugin-sdk/error-runtime`
بدلًا من مطابقة سلاسل انتهاء صلاحية الموافقة يدويًا.

راجع [خطاطيف Plugin](/ar/plugins/hooks) للاطلاع على أمثلة ومرجع الخطاطيف.

## تسجيل أدوات الوكيل

الأدوات هي دوال مطبوعة يمكن لـ LLM استدعاؤها. يمكن أن تكون مطلوبة (متاحة دائمًا)
أو اختيارية (اشتراك من المستخدم):

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

يجب التصريح عن كل أداة مسجّلة باستخدام `api.registerTool(...)` أيضًا في
بيان Plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

يلتقط OpenClaw الوصف المتحقق منه من الأداة المسجّلة ويخزّنه مؤقتًا،
لذلك لا تكرّر Plugins بيانات `description` أو المخطط في البيان. يصرّح
عقد البيان بالملكية والاكتشاف فقط؛ وما يزال التنفيذ يستدعي
تطبيق الأداة المسجّلة الحي.

يمكّن المستخدمون الأدوات الاختيارية في الإعداد:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- يجب ألا تتعارض أسماء الأدوات مع الأدوات الأساسية (يتم تخطي التعارضات)
- يتم تخطي الأدوات ذات كائنات التسجيل المشوهة، بما في ذلك `parameters` المفقودة، والإبلاغ عنها في تشخيصات plugin بدلاً من تعطيل تشغيل الوكلاء
- استخدم `optional: true` للأدوات ذات الآثار الجانبية أو متطلبات الملفات الثنائية الإضافية
- يمكن للمستخدمين تمكين جميع الأدوات من plugin بإضافة معرف plugin إلى `tools.allow`

## تسجيل أوامر CLI

يمكن أن تضيف Plugins مجموعات أوامر `openclaw` جذرية باستخدام `api.registerCli`. وفّر
`descriptors` لكل جذر أمر عالي المستوى حتى يتمكن OpenClaw من عرض الأمر وتوجيهه
دون تحميل وقت تشغيل كل plugin بشكل استباقي.

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

استورد دائمًا من مسارات `openclaw/plugin-sdk/<subpath>` المركزة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

للمرجع الكامل للمسارات الفرعية، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview).

داخل plugin الخاص بك، استخدم ملفات barrel محلية (`api.ts`، `runtime-api.ts`) من أجل
عمليات الاستيراد الداخلية — لا تستورد plugin الخاص بك أبدًا عبر مسار SDK الخاص به.

بالنسبة إلى Plugins المزوّدين، احتفظ بالمساعدات الخاصة بالمزوّد في ملفات barrel
الخاصة بجذر الحزمة ما لم يكن seam عامًا حقًا. الأمثلة المضمّنة الحالية:

- Anthropic: أغلفة تدفق Claude ومساعدات `service_tier` / beta
- OpenAI: بناة المزوّد، ومساعدات النماذج الافتراضية، ومزوّدو الوقت الحقيقي
- OpenRouter: باني المزوّد بالإضافة إلى مساعدات الإعداد/التكوين الأولي

إذا كان المساعد مفيدًا فقط داخل حزمة مزوّد مضمّنة واحدة، فأبقِه على seam
جذر الحزمة ذلك بدلاً من ترقيته إلى `openclaw/plugin-sdk/*`.

لا تزال بعض seams المولّدة من نوع `openclaw/plugin-sdk/<bundled-id>` موجودة من أجل
صيانة bundled-plugin عندما يكون لديها استخدام مالك متتبع. تعامل معها كأسطح
محجوزة، وليس كنمط افتراضي لـ Plugins الجهات الخارجية الجديدة.

## قائمة التحقق قبل الإرسال

<Check>يتضمن **package.json** بيانات تعريف `openclaw` الصحيحة</Check>
<Check>بيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم جميع عمليات الاستيراد مسارات `plugin-sdk/<subpath>` المركزة</Check>
<Check>تستخدم عمليات الاستيراد الداخلية وحدات محلية، لا عمليات استيراد ذاتية من SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (Plugins داخل المستودع)</Check>

## اختبار إصدار beta

1. راقب وسوم إصدارات GitHub على [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم beta مثل `v2026.3.N-beta.1`. يمكنك أيضًا تفعيل الإشعارات لحساب OpenClaw الرسمي على X [@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر plugin الخاص بك مقابل وسم beta بمجرد ظهوره. تكون النافذة قبل الإصدار المستقر عادةً بضع ساعات فقط.
3. انشر في سلسلة plugin الخاصة بك في قناة Discord المسماة `plugin-forum` بعد الاختبار، إما بـ `all good` أو بما تعطل. إذا لم تكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطل شيء ما، فافتح مشكلة أو حدّث مشكلة بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق التصنيف `beta-blocker`. ضع رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط المشكلة في كل من PR وسلسلة Discord الخاصة بك. لا يستطيع المساهمون تسمية PRs، لذا يكون العنوان هو إشارة جانب PR للمشرفين والأتمتة. يتم دمج العوائق التي لديها PR؛ وقد يتم شحن العوائق التي لا تملك واحدًا على أي حال. يراقب المشرفون هذه السلاسل أثناء اختبار beta.
6. الصمت يعني أن كل شيء أخضر. إذا فاتتك النافذة، فمن المرجح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Plugins القنوات" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ plugin لقناة مراسلة
  </Card>
  <Card title="Plugins المزوّدين" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ plugin لمزوّد نماذج
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

## ذات صلة

- [بنية Plugin](/ar/plugins/architecture) — شرح عميق للبنية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع Plugin SDK
- [البيان](/ar/plugins/manifest) — تنسيق بيان plugin
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) — بناء Plugins المزوّدين
