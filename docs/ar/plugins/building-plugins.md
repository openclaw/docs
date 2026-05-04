---
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تضيف قناة جديدة أو مزودًا جديدًا أو أداة جديدة أو قدرة أخرى إلى OpenClaw
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لك في OpenClaw خلال دقائق
title: بناء Plugins
x-i18n:
    generated_at: "2026-05-04T07:08:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins توسّع OpenClaw بقدرات جديدة: القنوات، ومزوّدو النماذج،
والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور،
وتوليد الفيديو، وجلب الويب، والبحث في الويب، وأدوات الوكلاء، أو أي
مزيج منها.

لا تحتاج إلى إضافة Plugin الخاص بك إلى مستودع OpenClaw. انشره إلى
[ClawHub](/ar/tools/clawhub) ويثبّته المستخدمون باستخدام
`openclaw plugins install clawhub:<package-name>`. مواصفات الحزم العارية لا تزال
تُثبّت من npm أثناء مرحلة الانتقال عند الإطلاق.

## المتطلبات الأساسية

- Node >= 22 ومدير حزم (npm أو pnpm)
- الإلمام بـ TypeScript (ESM)
- بالنسبة إلى Plugins داخل المستودع: يجب استنساخ المستودع وتنفيذ `pnpm install`. تطوير Plugin من نسخة
  مصدرية محلية يعتمد على pnpm فقط لأن OpenClaw يحمّل Plugins المضمّنة
  من حزم مساحة العمل `extensions/*`.

## ما نوع Plugin؟

<CardGroup cols={3}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    اربط OpenClaw بمنصة مراسلة (Discord، IRC، وغيرهما)
  </Card>
  <Card title="Plugin مزوّد" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف مزوّد نماذج (LLM، أو وكيل، أو نقطة نهاية مخصّصة)
  </Card>
  <Card title="Plugin أداة / خطّاف" icon="wrench" href="/ar/plugins/hooks">
    سجّل أدوات وكلاء أو خطافات أحداث أو خدمات — تابع أدناه
  </Card>
</CardGroup>

بالنسبة إلى Plugin قناة لا يكون مضمون التثبيت عند تشغيل الإعداد الأولي/التهيئة،
استخدم `createOptionalChannelSetupSurface(...)` من
`openclaw/plugin-sdk/channel-setup`. ينتج ذلك زوجًا من محوّل الإعداد + المعالج الإرشادي
يعلنان متطلب التثبيت ويفشلان بشكل مغلق عند عمليات كتابة الإعدادات الحقيقية
إلى أن يتم تثبيت Plugin.

## بدء سريع: Plugin أداة

ينشئ هذا الشرح Plugin بسيطًا يسجّل أداة وكيل. لدى Plugins القنوات
والمزوّدين أدلة مخصّصة مرتبطة أعلاه.

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
    في `contracts.tools` حتى يتمكّن OpenClaw من اكتشاف Plugin
    المالك من دون تحميل وقت تشغيل كل Plugin. يجب أيضًا على Plugins التصريح
    بـ `activation.onStartup` عن قصد. يعيّن هذا المثال القيمة إلى `true`. راجع
    [البيان](/ar/plugins/manifest) للاطلاع على المخطط الكامل. توجد مقتطفات النشر المعيارية إلى ClawHub
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

    `definePluginEntry` مخصّصة لـ Plugins غير القنوات. بالنسبة إلى القنوات، استخدم
    `defineChannelPluginEntry` — راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).
    للاطلاع على خيارات نقطة الدخول الكاملة، راجع [نقاط الدخول](/ar/plugins/sdk-entrypoints).

  </Step>

  <Step title="اختبر وانشر">

    **Plugins خارجية:** تحقّق وانشر باستخدام ClawHub، ثم ثبّت:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    مواصفات الحزم العارية مثل `@myorg/openclaw-my-plugin` تُثبّت من npm أثناء
    مرحلة الانتقال عند الإطلاق. استخدم `clawhub:` عندما تريد الاعتماد على تحليل ClawHub.

    **Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugins المضمّنة — وسيتم اكتشافها تلقائيًا.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قدرات Plugin

يمكن لـ Plugin واحد تسجيل أي عدد من القدرات عبر كائن `api`:

| القدرة             | طريقة التسجيل                              | الدليل المفصّل                                                                  |
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
| البحث في الويب             | `api.registerWebSearchProvider(...)`             | [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| وسيط نتائج الأدوات | `api.registerAgentToolResultMiddleware(...)`     | [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api)                          |
| أدوات الوكلاء            | `api.registerTool(...)`                          | أدناه                                                                           |
| الأوامر المخصّصة        | `api.registerCommand(...)`                       | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |
| خطافات Plugin           | `api.on(...)`                                    | [خطافات Plugin](/ar/plugins/hooks)                                                  |
| خطافات الأحداث الداخلية   | `api.registerHook(...)`                          | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |
| مسارات HTTP            | `api.registerHttpRoute(...)`                     | [الداخليات](/ar/plugins/architecture-internals#gateway-http-routes)                |
| أوامر CLI الفرعية        | `api.registerCli(...)`                           | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                        |

للاطلاع على واجهة API التسجيل الكاملة، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api).

يمكن لـ Plugins المضمّنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
تحتاج إلى إعادة كتابة نتائج الأدوات بشكل غير متزامن قبل أن يرى النموذج المخرجات. صرّح عن
أوقات التشغيل المستهدفة في `contracts.agentToolResultMiddleware`، على سبيل المثال
`["pi", "codex"]`. هذا سطح موثوق لـ Plugin مضمّن؛ يجب على
Plugins الخارجية تفضيل خطافات Plugin العادية في OpenClaw ما لم يطوّر OpenClaw
سياسة ثقة صريحة لهذه القدرة.

إذا كان Plugin الخاص بك يسجّل طرق RPC مخصّصة في Gateway، فاجعلها على
بادئة خاصة بـ Plugin. تبقى مساحات أسماء الإدارة الأساسية (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائمًا إلى
`operator.admin`، حتى إذا طلب Plugin نطاقًا أضيق.

دلالات حارس الخطافات التي يجب وضعها في الاعتبار:

- `before_tool_call`: `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: `{ block: false }` تُعامل على أنها بلا قرار.
- `before_tool_call`: `{ requireApproval: true }` توقف تنفيذ الوكيل مؤقتًا وتطلب موافقة المستخدم عبر طبقة موافقات التنفيذ، أو أزرار Telegram، أو تفاعلات Discord، أو أمر `/approve` على أي قناة.
- `before_install`: `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_install`: `{ block: false }` تُعامل على أنها بلا قرار.
- `message_sending`: `{ cancel: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `message_sending`: `{ cancel: false }` تُعامل على أنها بلا قرار.
- `message_received`: فضّل حقل `threadId` المطبوع عندما تحتاج إلى توجيه سلسلة/موضوع وارد. أبقِ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: فضّل حقول التوجيه المطبوعة `replyToId` / `threadId` على مفاتيح البيانات الوصفية الخاصة بالقناة.

يعالج أمر `/approve` موافقات التنفيذ وPlugin معًا مع بديل محدود: عندما لا يتم العثور على معرّف موافقة تنفيذ، يعيد OpenClaw محاولة المعرّف نفسه عبر موافقات Plugin. يمكن إعداد تمرير موافقات Plugin بشكل مستقل عبر `approvals.plugin` في الإعدادات.

إذا احتاجت سباكة الموافقات المخصّصة إلى اكتشاف حالة البديل المحدود نفسها،
فافضّل `isApprovalNotFoundError` من `openclaw/plugin-sdk/error-runtime`
بدل مطابقة سلاسل انتهاء صلاحية الموافقة يدويًا.

راجع [خطافات Plugin](/ar/plugins/hooks) للاطلاع على أمثلة ومرجع الخطافات.

## تسجيل أدوات الوكلاء

الأدوات هي دوال مطبوعة يمكن أن يستدعيها LLM. يمكن أن تكون مطلوبة (متاحة دائمًا)
أو اختيارية (يشترك المستخدم فيها):

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

يجب أيضًا التصريح عن كل أداة مسجّلة باستخدام `api.registerTool(...)` في
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

يلتقط OpenClaw الواصف المتحقَّق منه من الأداة المسجلة ويخزّنه مؤقتًا،
لذلك لا تكرر Plugins بيانات `description` أو المخطط في البيان. لا يعلن
عقد البيان إلا الملكية والاكتشاف؛ أما التنفيذ فلا يزال يستدعي
تنفيذ الأداة المسجلة الحي.

عيّن `toolMetadata.<tool>.optional: true` للأدوات المسجلة باستخدام
`api.registerTool(..., { optional: true })` حتى يتمكن OpenClaw من تجنب تحميل
وقت تشغيل Plugin ذلك إلى أن تُدرج الأداة صراحةً في قائمة السماح.

يمكّن المستخدمون الأدوات الاختيارية في الإعدادات:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- يجب ألا تتعارض أسماء الأدوات مع أدوات النواة (يتم تخطي التعارضات)
- يتم تخطي الأدوات ذات كائنات التسجيل المشوهة، بما في ذلك غياب `parameters`، والإبلاغ عنها في تشخيصات Plugin بدلًا من تعطيل تشغيلات الوكيل
- استخدم `optional: true` للأدوات ذات الآثار الجانبية أو متطلبات الثنائيات الإضافية
- يمكن للمستخدمين تمكين جميع الأدوات من Plugin بإضافة معرّف Plugin إلى `tools.allow`

## تسجيل أوامر CLI

يمكن لـ Plugins إضافة مجموعات أوامر جذرية لـ `openclaw` باستخدام `api.registerCli`. وفّر
`descriptors` لكل جذر أمر على المستوى الأعلى حتى يتمكن OpenClaw من عرض
الأمر وتوجيهه دون تحميل وقت تشغيل كل Plugin مسبقًا.

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

## أعراف الاستيراد

استورد دائمًا من مسارات `openclaw/plugin-sdk/<subpath>` المركّزة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

للمرجع الكامل للمسارات الفرعية، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview).

داخل Plugin الخاص بك، استخدم ملفات التجميع المحلية (`api.ts`، `runtime-api.ts`) لعمليات
الاستيراد الداخلية — ولا تستورد Plugin الخاص بك أبدًا عبر مساره في SDK.

بالنسبة إلى Plugins الخاصة بالمزوّدين، أبقِ المساعدات الخاصة بالمزوّد في ملفات التجميع
الجذرية لتلك الحزمة ما لم تكن الوصلة عامة حقًا. أمثلة مضمّنة حالية:

- Anthropic: أغلفة تدفقات Claude ومساعدات `service_tier` / beta
- OpenAI: بناة المزوّدين، ومساعدات النموذج الافتراضي، ومزوّدو الزمن الحقيقي
- OpenRouter: باني المزوّد إضافةً إلى مساعدات التهيئة/الإعداد

إذا كان المساعد مفيدًا فقط داخل حزمة مزوّد مضمّنة واحدة، فأبقه على وصلة
جذر تلك الحزمة بدلًا من ترقيته إلى `openclaw/plugin-sdk/*`.

لا تزال بعض وصلات المساعدة المولّدة `openclaw/plugin-sdk/<bundled-id>` موجودة
لصيانة Plugins المضمّنة عندما يكون لديها استخدام مالك متتبع. تعامل معها كأسطح
محجوزة، لا كنمط افتراضي لـ Plugins الخارجية الجديدة.

## قائمة التحقق قبل الإرسال

<Check>تحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>بيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم جميع عمليات الاستيراد مسارات `plugin-sdk/<subpath>` المركّزة</Check>
<Check>تستخدم عمليات الاستيراد الداخلية وحدات محلية، لا استيرادات ذاتية من SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (لـ Plugins داخل المستودع)</Check>

## اختبار إصدار Beta

1. راقب وسوم إصدارات GitHub على [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم Beta مثل `v2026.3.N-beta.1`. يمكنك أيضًا تشغيل الإشعارات لحساب OpenClaw الرسمي على X‏ [@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر Plugin الخاص بك مقابل وسم Beta فور ظهوره. عادةً ما تكون النافذة قبل الإصدار المستقر بضع ساعات فقط.
3. انشر في سلسلة Plugin الخاصة بك في قناة Discord المسماة `plugin-forum` بعد الاختبار، إما بـ `all good` أو بما تعطل. إذا لم تكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطل شيء ما، فافتح مشكلة أو حدّث مشكلة بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق الوسم `beta-blocker`. ضع رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط المشكلة في كل من PR وسلسلة Discord الخاصة بك. لا يستطيع المساهمون وسم PRs، لذلك يكون العنوان هو إشارة PR للمشرفين والأتمتة. يتم دمج العوائق التي لديها PR؛ أما العوائق التي لا تملك واحدًا فقد تُشحن على أي حال. يراقب المشرفون هذه السلاسل أثناء اختبار Beta.
6. الصمت يعني أن كل شيء أخضر. إذا فاتتك النافذة، فمن المرجح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Plugins القنوات" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ Plugin لقناة مراسلة
  </Card>
  <Card title="Plugins المزوّدين" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ Plugin لمزوّد نموذج
  </Card>
  <Card title="نظرة عامة على SDK" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وواجهة تسجيل API
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
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع SDK الخاص بـ Plugin
- [البيان](/ar/plugins/manifest) — تنسيق بيان Plugin
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) — بناء Plugins المزوّدين
