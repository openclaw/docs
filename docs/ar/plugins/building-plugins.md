---
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى دليل بدء سريع لتطوير Plugin
    - أنت تضيف قناة أو مزودًا أو أداة أو إمكانية أخرى إلى OpenClaw
sidebarTitle: Getting Started
summary: أنشئ أول Plugin خاص بك لـ OpenClaw في دقائق
title: بناء Plugins
x-i18n:
    generated_at: "2026-05-07T13:25:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، وموفّري النماذج،
والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور،
وتوليد الفيديو، وجلب الويب، وبحث الويب، وأدوات الوكيل، أو أي
مزيج منها.

لا تحتاج إلى إضافة Plugin الخاص بك إلى مستودع OpenClaw. انشره إلى
[ClawHub](/ar/tools/clawhub) ويثبّته المستخدمون باستخدام
`openclaw plugins install clawhub:<package-name>`. لا تزال مواصفات الحزم المجردة
تُثبَّت من npm أثناء مرحلة الانتقال عند الإطلاق.

## المتطلبات الأساسية

- Node >= 22 ومدير حزم (npm أو pnpm)
- إلمام بـ TypeScript ‏(ESM)
- بالنسبة إلى Plugins داخل المستودع: استنساخ المستودع وتنفيذ `pnpm install`. تطوير
  Plugin من نسخة مصدرية محلية يقتصر على pnpm فقط لأن OpenClaw يحمّل Plugins
  المضمّنة من حزم مساحة العمل `extensions/*`.

## ما نوع Plugin؟

<CardGroup cols={3}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    اربط OpenClaw بمنصة مراسلة (Discord، وIRC، وما إلى ذلك)
  </Card>
  <Card title="Plugin موفّر" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف موفّر نموذج (LLM، أو وكيل، أو نقطة نهاية مخصصة)
  </Card>
  <Card title="Plugin خلفية CLI" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    عيّن CLI ذكاء اصطناعي محلي إلى مشغّل الرجوع النصي في OpenClaw
  </Card>
  <Card title="Plugin أداة / خطاف" icon="wrench" href="/ar/plugins/hooks">
    سجّل أدوات وكيل، أو خطافات أحداث، أو خدمات - تابع أدناه
  </Card>
</CardGroup>

بالنسبة إلى Plugin قناة لا يكون تثبيته مضمونًا عند تشغيل التهيئة/الإعداد،
استخدم `createOptionalChannelSetupSurface(...)` من
`openclaw/plugin-sdk/channel-setup`. ينتج ذلك زوج محوّل إعداد + معالج
يروج لمتطلب التثبيت ويفشل بإغلاق آمن عند عمليات كتابة الإعدادات الحقيقية
إلى أن يتم تثبيت Plugin.

## بداية سريعة: Plugin أداة

ينشئ هذا الشرح التفصيلي Plugin بسيطًا يسجّل أداة وكيل. لدى Plugins القنوات
والموفّرين أدلة مخصصة مرتبطة أعلاه.

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

    يحتاج كل Plugin إلى بيان، حتى دون إعدادات. يجب إدراج الأدوات المسجلة وقت التشغيل
    في `contracts.tools` كي يتمكن OpenClaw من اكتشاف Plugin المالك
    دون تحميل كل زمن تشغيل Plugin. ينبغي أن تصرّح Plugins أيضًا عن
    `activation.onStartup` بشكل مقصود. يضبط هذا المثال قيمته على `true`. راجع
    [البيان](/ar/plugins/manifest) للاطلاع على المخطط الكامل. توجد مقتطفات النشر الرسمية في ClawHub
    داخل `docs/snippets/plugin-publish/`.

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

    تُثبَّت مواصفات الحزم المجردة مثل `@myorg/openclaw-my-plugin` من npm أثناء
    مرحلة الانتقال عند الإطلاق. استخدم `clawhub:` عندما تريد حلّ الحزمة عبر ClawHub.

    **Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugins المضمّنة - وسيتم اكتشافها تلقائيًا.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قدرات Plugin

يمكن لـ Plugin واحد تسجيل أي عدد من القدرات عبر كائن `api`:

| القدرة                  | طريقة التسجيل                                     | الدليل التفصيلي                                                                 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| الاستدلال النصي (LLM)  | `api.registerProvider(...)`                      | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins)                              |
| خلفية استدلال CLI      | `api.registerCliBackend(...)`                    | [Plugins خلفية CLI](/ar/plugins/cli-backend-plugins)                               |
| القناة / المراسلة      | `api.registerChannel(...)`                       | [Plugins القنوات](/ar/plugins/sdk-channel-plugins)                                 |
| الكلام (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| النسخ الفوري           | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| الصوت الفوري           | `api.registerRealtimeVoiceProvider(...)`         | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| فهم الوسائط            | `api.registerMediaUnderstandingProvider(...)`    | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الصور            | `api.registerImageGenerationProvider(...)`       | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الموسيقى         | `api.registerMusicGenerationProvider(...)`       | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الفيديو          | `api.registerVideoGenerationProvider(...)`       | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جلب الويب              | `api.registerWebFetchProvider(...)`              | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| بحث الويب              | `api.registerWebSearchProvider(...)`             | [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| وسيط نتائج الأدوات     | `api.registerAgentToolResultMiddleware(...)`     | [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api)                     |
| أدوات الوكيل           | `api.registerTool(...)`                          | أدناه                                                                           |
| أوامر مخصصة            | `api.registerCommand(...)`                       | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |
| خطافات Plugin          | `api.on(...)`                                    | [خطافات Plugin](/ar/plugins/hooks)                                                 |
| خطافات أحداث داخلية    | `api.registerHook(...)`                          | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |
| مسارات HTTP            | `api.registerHttpRoute(...)`                     | [الداخليات](/ar/plugins/architecture-internals#gateway-http-routes)                |
| أوامر CLI فرعية        | `api.registerCli(...)`                           | [نقاط الدخول](/ar/plugins/sdk-entrypoints)                                         |

للاطلاع على API التسجيل الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api).

يمكن لـ Plugins المضمّنة استخدام `api.registerAgentToolResultMiddleware(...)` عندما
تحتاج إلى إعادة كتابة غير متزامنة لنتائج الأدوات قبل أن يرى النموذج المخرجات. صرّح عن
أزمنة التشغيل المستهدفة في `contracts.agentToolResultMiddleware`، على سبيل المثال
`["pi", "codex"]`. هذا منفذ موثوق خاص بـ Plugin مضمّن؛ ينبغي أن تفضّل
Plugins الخارجية خطافات OpenClaw Plugin العادية ما لم يطوّر OpenClaw
سياسة ثقة صريحة لهذه القدرة.

إذا كان Plugin الخاص بك يسجّل أساليب RPC مخصصة في Gateway، فأبقها ضمن
بادئة خاصة بـ Plugin. تبقى مساحات أسماء الإدارة الأساسية (`config.*`،
`exec.approvals.*`، و`wizard.*`، و`update.*`) محجوزة وتُحل دائمًا إلى
`operator.admin`، حتى إذا طلب Plugin نطاقًا أضيق.

دلالات حراسة الخطافات التي ينبغي تذكّرها:

- `before_tool_call`: تكون `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_tool_call`: تُعامل `{ block: false }` على أنها بلا قرار.
- `before_tool_call`: توقف `{ requireApproval: true }` تنفيذ الوكيل وتطلب من المستخدم الموافقة عبر طبقة موافقات التنفيذ، أو أزرار Telegram، أو تفاعلات Discord، أو أمر `/approve` على أي قناة.
- `before_install`: تكون `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `before_install`: تُعامل `{ block: false }` على أنها بلا قرار.
- `message_sending`: تكون `{ cancel: true }` نهائية وتوقف المعالجات ذات الأولوية الأدنى.
- `message_sending`: تُعامل `{ cancel: false }` على أنها بلا قرار.
- `message_received`: فضّل الحقل typed `threadId` عندما تحتاج إلى توجيه سلسلة/موضوع وارد. أبقِ `metadata` للإضافات الخاصة بالقناة.
- `message_sending`: فضّل حقول التوجيه typed `replyToId` / `threadId` على مفاتيح metadata الخاصة بالقناة.

يتعامل أمر `/approve` مع موافقات التنفيذ وPlugin معًا مع رجوع محدود: عندما لا يتم العثور على معرّف موافقة تنفيذ، يعيد OpenClaw تجربة المعرّف نفسه عبر موافقات Plugin. يمكن تهيئة تمرير موافقات Plugin بشكل مستقل عبر `approvals.plugin` في الإعدادات.

إذا احتاجت بنية الموافقات المخصصة إلى اكتشاف حالة الرجوع المحدودة نفسها،
فضّل `isApprovalNotFoundError` من `openclaw/plugin-sdk/error-runtime`
بدلًا من مطابقة سلاسل انتهاء صلاحية الموافقات يدويًا.

راجع [خطافات Plugin](/ar/plugins/hooks) للاطلاع على الأمثلة ومرجع الخطافات.

## تسجيل أدوات الوكيل

الأدوات هي دوال typed يستطيع LLM استدعاءها. يمكن أن تكون مطلوبة (متاحة دائمًا)
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

يجب أيضًا التصريح عن كل أداة مسجلة باستخدام `api.registerTool(...)` في
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

يلتقط OpenClaw الواصف المتحقَّق منه من الأداة المسجَّلة ويخزّنه مؤقتًا،
لذلك لا تكرّر Plugins بيانات `description` أو المخطط في البيان. يصرّح
عقد البيان بالملكية والاكتشاف فقط؛ ولا يزال التنفيذ يستدعي تطبيق الأداة
المسجَّلة الحي.

عيّن `toolMetadata.<tool>.optional: true` للأدوات المسجَّلة باستخدام
`api.registerTool(..., { optional: true })` حتى يتمكن OpenClaw من تجنّب تحميل
تشغيل ذلك Plugin إلى أن تُدرج الأداة صراحة في قائمة السماح.

يمكّن المستخدمون الأدوات الاختيارية في الإعدادات:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- يجب ألا تتعارض أسماء الأدوات مع أدوات النواة (يتم تخطي التعارضات)
- يتم تخطي الأدوات ذات كائنات التسجيل غير الصحيحة، بما في ذلك التي تفتقد `parameters`، ويتم الإبلاغ عنها في تشخيصات Plugin بدلًا من تعطيل تشغيل الوكلاء
- استخدم `optional: true` للأدوات ذات الآثار الجانبية أو متطلبات الملفات الثنائية الإضافية
- يمكن للمستخدمين تمكين كل الأدوات من Plugin بإضافة معرّف Plugin إلى `tools.allow`

## تسجيل أوامر CLI

يمكن أن تضيف Plugins مجموعات أوامر جذرية لـ `openclaw` باستخدام `api.registerCli`. وفّر
`descriptors` لكل جذر أمر من المستوى الأعلى حتى يتمكن OpenClaw من عرض
الأمر وتوجيهه دون تحميل تشغيل كل Plugin بشكل مسبق.

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

بعد التثبيت، تحقّق من تسجيل التشغيل ونفّذ الأمر:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## اصطلاحات الاستيراد

استورد دائمًا من مسارات `openclaw/plugin-sdk/<subpath>` المركّزة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

للمرجع الكامل للمسارات الفرعية، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview).

داخل Plugin الخاص بك، استخدم ملفات التجميع المحلية (`api.ts`، `runtime-api.ts`) للاستيرادات
الداخلية - لا تستورد Plugin الخاص بك أبدًا عبر مساره في SDK.

بالنسبة إلى Plugins المزوّد، أبقِ المساعدات الخاصة بالمزوّد في ملفات التجميع
الجذرية للحزمة ما لم تكن الوصلة عامة حقًا. الأمثلة المضمّنة الحالية:

- Anthropic: مغلّفات تدفق Claude ومساعدات `service_tier` / beta
- OpenAI: بُناة المزوّد، ومساعدات النموذج الافتراضي، ومزوّدو الوقت الحقيقي
- OpenRouter: باني المزوّد مع مساعدات الإعداد/التكوين

إذا كان المساعد مفيدًا فقط داخل حزمة مزوّد مضمّنة واحدة، فأبقِه على وصلة
جذر تلك الحزمة بدلًا من ترقيته إلى `openclaw/plugin-sdk/*`.

لا تزال بعض وصلات المساعدين المولّدة `openclaw/plugin-sdk/<bundled-id>` موجودة
لصيانة Plugins المضمّنة عندما يكون لها استخدام مالك متتبَّع. تعامل معها
كأسطح محجوزة، لا كنمط افتراضي لـ Plugins الطرف الثالث الجديدة.

## قائمة التحقق قبل الإرسال

<Check>يحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>بيان **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الدخول `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم كل الاستيرادات مسارات `plugin-sdk/<subpath>` المركّزة</Check>
<Check>تستخدم الاستيرادات الداخلية وحدات محلية، لا استيرادات ذاتية من SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (لـ Plugins داخل المستودع)</Check>

## اختبار إصدار beta

1. راقب وسوم إصدار GitHub على [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم beta مثل `v2026.3.N-beta.1`. يمكنك أيضًا تشغيل الإشعارات لحساب OpenClaw الرسمي على X ‏[@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر Plugin الخاص بك مقابل وسم beta فور ظهوره. عادةً ما تكون النافذة قبل الإصدار المستقر بضع ساعات فقط.
3. انشر في سلسلة Plugin الخاصة بك في قناة Discord المسماة `plugin-forum` بعد الاختبار إما `all good` أو ما تعطّل. إذا لم تكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطّل شيء، فافتح مشكلة أو حدّثها بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق وسم `beta-blocker`. ضع رابط المشكلة في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط المشكلة في كل من PR وسلسلة Discord الخاصة بك. لا يستطيع المساهمون وسم PRs، لذلك يكون العنوان هو الإشارة الخاصة بجانب PR للمشرفين والأتمتة. يتم دمج العوائق التي لديها PR؛ أما العوائق التي لا تملك واحدًا فقد تُشحن على أي حال. يراقب المشرفون هذه السلاسل أثناء اختبار beta.
6. الصمت يعني أن كل شيء سليم. إذا فاتتك النافذة، فمن المرجح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Plugins القنوات" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    ابنِ Plugin قناة مراسلة
  </Card>
  <Card title="Plugins المزوّد" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    ابنِ Plugin مزوّد نماذج
  </Card>
  <Card title="Plugins خلفية CLI" icon="terminal" href="/ar/plugins/cli-backend-plugins">
    سجّل خلفية CLI محلية للذكاء الاصطناعي
  </Card>
  <Card title="نظرة عامة على SDK" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وواجهة API للتسجيل
  </Card>
  <Card title="مساعدات التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
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

- [معمارية Plugin](/ar/plugins/architecture) - تعمّق في المعمارية الداخلية
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع SDK لـ Plugin
- [البيان](/ar/plugins/manifest) - تنسيق بيان Plugin
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - بناء Plugins القنوات
- [Plugins المزوّد](/ar/plugins/sdk-provider-plugins) - بناء Plugins المزوّد
