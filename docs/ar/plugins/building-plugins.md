---
read_when:
    - تريد إنشاء Plugin جديد لـ OpenClaw
    - تحتاج إلى بداية سريعة لتطوير Plugin
    - أنت تضيف قناة أو موفّرًا أو أداة أو قدرة أخرى جديدة إلى OpenClaw
sidebarTitle: Getting Started
summary: أنشئ أول Plugin لـ OpenClaw في غضون دقائق
title: بناء Plugins
x-i18n:
    generated_at: "2026-04-22T07:17:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 67368be311537f984f14bea9239b88c3eccf72a76c9dd1347bb041e02697ae24
    source_path: plugins/building-plugins.md
    workflow: 15
---

# بناء Plugins

توسّع Plugins قدرات OpenClaw بإمكانات جديدة: القنوات، وموفّرو النماذج،
والكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور،
وتوليد الفيديو، وجلب الويب، والبحث على الويب، وأدوات الوكيل، أو أي
مزيج من ذلك.

لا تحتاج إلى إضافة Plugin الخاص بك إلى مستودع OpenClaw. انشره إلى
[ClawHub](/ar/tools/clawhub) أو npm وسيقوم المستخدمون بالتثبيت باستخدام
`openclaw plugins install <package-name>`. يحاول OpenClaw استخدام ClawHub أولًا
ثم يعود إلى npm تلقائيًا عند الحاجة.

## المتطلبات المسبقة

- Node >= 22 ومدير حزم (npm أو pnpm)
- إلمام بـ TypeScript ‏(ESM)
- بالنسبة إلى Plugins داخل المستودع: أن يكون المستودع مستنسخًا وتم تنفيذ `pnpm install`

## ما نوع Plugin الذي تريد إنشاءه؟

<CardGroup cols={3}>
  <Card title="Plugin قناة" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    اربط OpenClaw بمنصة مراسلة (Discord أو IRC أو غيرهما)
  </Card>
  <Card title="Plugin موفّر" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أضف موفّر نماذج (LLM أو وكيل أو نقطة نهاية مخصّصة)
  </Card>
  <Card title="Plugin أداة / hook" icon="wrench">
    سجّل أدوات الوكيل أو event hooks أو الخدمات — تابع أدناه
  </Card>
</CardGroup>

إذا كان Plugin القناة اختياريًا وقد لا يكون مُثبّتًا عند تشغيل الإعداد أو
التهيئة الأولية، فاستخدم `createOptionalChannelSetupSurface(...)` من
`openclaw/plugin-sdk/channel-setup`. فهو ينتج زوجًا من محوّل إعداد + معالج إعداد
يعرض متطلب التثبيت ويفشل بشكل آمن عند أي عمليات كتابة فعلية للإعدادات
إلى أن يتم تثبيت Plugin.

## بداية سريعة: Plugin أداة

ينشئ هذا الدليل العملي Plugin بسيطًا يسجّل أداة وكيل. لدى Plugins القنوات
والموفّرين أدلة مخصّصة مرتبطة أعلاه.

<Steps>
  <Step title="أنشئ الحزمة وملف manifest">
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

    يحتاج كل Plugin إلى ملف manifest، حتى إذا لم تكن لديه إعدادات. راجع
    [Manifest](/ar/plugins/manifest) للاطلاع على المخطط الكامل. توجد مقتطفات النشر
    القياسية إلى ClawHub في `docs/snippets/plugin-publish/`.

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

    يُستخدم `definePluginEntry` مع Plugins غير الخاصة بالقنوات. أما بالنسبة إلى القنوات، فاستخدم
    `defineChannelPluginEntry` — راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).
    وللاطلاع على الخيارات الكاملة لنقطة الإدخال، راجع [نقاط الإدخال](/ar/plugins/sdk-entrypoints).

  </Step>

  <Step title="اختبر وانشر">

    **Plugins الخارجية:** تحقّق منها وانشرها باستخدام ClawHub، ثم ثبّتها:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    يتحقق OpenClaw أيضًا من ClawHub قبل npm عند استخدام محددات الحزم المجردة مثل
    `@myorg/openclaw-my-plugin`.

    **Plugins داخل المستودع:** ضعها ضمن شجرة مساحة عمل Plugins المضمّنة — وسيتم اكتشافها تلقائيًا.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## قدرات Plugin

يمكن لـ Plugin واحد تسجيل أي عدد من القدرات عبر الكائن `api`:

| القدرة                 | طريقة التسجيل                                   | الدليل المفصل                                                                  |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| الاستدلال النصي (LLM)  | `api.registerProvider(...)`                     | [Plugins الموفّر](/ar/plugins/sdk-provider-plugins)                               |
| واجهة خلفية للاستدلال عبر CLI | `api.registerCliBackend(...)`            | [واجهات CLI الخلفية](/ar/gateway/cli-backends)                                    |
| القناة / المراسلة      | `api.registerChannel(...)`                      | [Plugins القنوات](/ar/plugins/sdk-channel-plugins)                                |
| الكلام (TTS/STT)       | `api.registerSpeechProvider(...)`               | [Plugins الموفّر](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| النسخ الفوري           | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins الموفّر](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| الصوت الفوري           | `api.registerRealtimeVoiceProvider(...)`        | [Plugins الموفّر](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| فهم الوسائط            | `api.registerMediaUnderstandingProvider(...)`   | [Plugins الموفّر](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الصور            | `api.registerImageGenerationProvider(...)`      | [Plugins الموفّر](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الموسيقى         | `api.registerMusicGenerationProvider(...)`      | [Plugins الموفّر](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| توليد الفيديو          | `api.registerVideoGenerationProvider(...)`      | [Plugins الموفّر](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| جلب الويب              | `api.registerWebFetchProvider(...)`             | [Plugins الموفّر](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| البحث على الويب        | `api.registerWebSearchProvider(...)`            | [Plugins الموفّر](/ar/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| امتداد Pi مضمّن        | `api.registerEmbeddedExtensionFactory(...)`     | [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api)                    |
| أدوات الوكيل           | `api.registerTool(...)`                         | أدناه                                                                          |
| أوامر مخصّصة           | `api.registerCommand(...)`                      | [نقاط الإدخال](/ar/plugins/sdk-entrypoints)                                       |
| event hooks            | `api.registerHook(...)`                         | [نقاط الإدخال](/ar/plugins/sdk-entrypoints)                                       |
| مسارات HTTP            | `api.registerHttpRoute(...)`                    | [الداخليات](/ar/plugins/architecture#gateway-http-routes)                         |
| أوامر CLI فرعية        | `api.registerCli(...)`                          | [نقاط الإدخال](/ar/plugins/sdk-entrypoints)                                       |

للاطلاع على API التسجيل الكامل، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview#registration-api).

استخدم `api.registerEmbeddedExtensionFactory(...)` عندما يحتاج Plugin إلى
hooks خاصة بالمشغّل المضمّن الأصلية في Pi مثل إعادة كتابة `tool_result`
غير المتزامنة قبل إصدار رسالة نتيجة الأداة النهائية. ويفضَّل استخدام hooks
Plugin العادية في OpenClaw عندما لا يتطلب العمل توقيت امتداد Pi.

إذا كان Plugin الخاص بك يسجّل أساليب RPC مخصّصة لـ Gateway، فاحتفظ بها ضمن
بادئة خاصة بالـ Plugin. تظل مساحات الأسماء الإدارية الأساسية (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة ويجري حلّها دائمًا إلى
`operator.admin`، حتى إذا طلب Plugin نطاقًا أضيق.

دلالات حارس hook التي ينبغي أخذها في الاعتبار:

- `before_tool_call`: القيمة `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأقل.
- `before_tool_call`: القيمة `{ block: false }` تُعامل على أنها بلا قرار.
- `before_tool_call`: القيمة `{ requireApproval: true }` توقف تنفيذ الوكيل مؤقتًا وتطلب موافقة المستخدم عبر طبقة موافقات التنفيذ، أو أزرار Telegram، أو تفاعلات Discord، أو الأمر `/approve` على أي قناة.
- `before_install`: القيمة `{ block: true }` نهائية وتوقف المعالجات ذات الأولوية الأقل.
- `before_install`: القيمة `{ block: false }` تُعامل على أنها بلا قرار.
- `message_sending`: القيمة `{ cancel: true }` نهائية وتوقف المعالجات ذات الأولوية الأقل.
- `message_sending`: القيمة `{ cancel: false }` تُعامل على أنها بلا قرار.

يتعامل الأمر `/approve` مع كلٍّ من موافقات التنفيذ وموافقات Plugin مع بديل
احتياطي مقيّد: عندما لا يتم العثور على معرّف موافقة تنفيذ، يعيد OpenClaw
محاولة استخدام المعرّف نفسه عبر موافقات Plugin. ويمكن تهيئة إعادة توجيه
موافقات Plugin بشكل مستقل عبر `approvals.plugin` في الإعدادات.

إذا كانت بنية الموافقات المخصّصة تحتاج إلى اكتشاف حالة البديل الاحتياطي
المقيّد نفسها، فافضّل استخدام `isApprovalNotFoundError` من
`openclaw/plugin-sdk/error-runtime` بدلًا من مطابقة سلاسل انتهاء صلاحية
الموافقة يدويًا.

راجع [دلالات قرارات hook في نظرة عامة على SDK](/ar/plugins/sdk-overview#hook-decision-semantics) لمزيد من التفاصيل.

## تسجيل أدوات الوكيل

الأدوات هي دوال typed يمكن لـ LLM استدعاؤها. ويمكن أن تكون مطلوبة (متاحة
دائمًا) أو اختيارية (يختار المستخدم تفعيلها):

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

يفعّل المستخدمون الأدوات الاختيارية في الإعدادات:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- يجب ألا تتعارض أسماء الأدوات مع أدوات النواة الأساسية (سيتم تخطي التعارضات)
- استخدم `optional: true` للأدوات ذات الآثار الجانبية أو التي تتطلب ملفات تنفيذية إضافية
- يمكن للمستخدمين تفعيل جميع الأدوات من Plugin عبر إضافة معرّف Plugin إلى `tools.allow`

## اصطلاحات الاستيراد

استورد دائمًا من مسارات `openclaw/plugin-sdk/<subpath>` المركّزة:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

للاطلاع على المرجع الكامل للمسارات الفرعية، راجع [نظرة عامة على SDK](/ar/plugins/sdk-overview).

داخل Plugin الخاص بك، استخدم ملفات barrel المحلية (`api.ts`, `runtime-api.ts`) في
عمليات الاستيراد الداخلية — ولا تستورد Plugin الخاص بك مطلقًا عبر مسار SDK الخاص به.

بالنسبة إلى Plugins الموفّر، احتفظ بالمساعدات الخاصة بالموفّر في ملفات
barrel الموجودة في جذر الحزمة ما لم يكن الحد الفاصل عامًا فعلًا. أمثلة
الحزم المضمّنة الحالية:

- Anthropic: أغلفة Claude للبث ومساعدات `service_tier` و beta
- OpenAI: بُنّاة الموفّرين، ومساعدات النماذج الافتراضية، وموفّرو الزمن الحقيقي
- OpenRouter: باني الموفّر بالإضافة إلى مساعدات الإعداد الأولي والتهيئة

إذا كان المساعد مفيدًا فقط داخل حزمة موفّر مضمّنة واحدة، فأبقِه ضمن هذا
الحد الفاصل في جذر الحزمة بدلًا من ترقيته إلى `openclaw/plugin-sdk/*`.

لا تزال بعض حدود المساعدات المُولَّدة `openclaw/plugin-sdk/<bundled-id>`
موجودة لصيانة Plugins المضمّنة والتوافق، على سبيل المثال
`plugin-sdk/feishu-setup` أو `plugin-sdk/zalo-setup`. تعامل مع هذه الأسطح على
أنها أسطح محجوزة، لا على أنها النمط الافتراضي لـ Plugins الخارجية الجديدة.

## قائمة التحقق قبل الإرسال

<Check>يحتوي **package.json** على بيانات `openclaw` الوصفية الصحيحة</Check>
<Check>ملف manifest **openclaw.plugin.json** موجود وصالح</Check>
<Check>تستخدم نقطة الإدخال `defineChannelPluginEntry` أو `definePluginEntry`</Check>
<Check>تستخدم جميع عمليات الاستيراد مسارات `plugin-sdk/<subpath>` المركّزة</Check>
<Check>تستخدم عمليات الاستيراد الداخلية وحدات محلية، وليس عمليات استيراد ذاتية عبر SDK</Check>
<Check>تنجح الاختبارات (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>ينجح `pnpm check` (Plugins داخل المستودع)</Check>

## اختبار الإصدار التجريبي

1. راقب وسوم إصدارات GitHub في [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) واشترك عبر `Watch` > `Releases`. تبدو وسوم الإصدارات التجريبية مثل `v2026.3.N-beta.1`. يمكنك أيضًا تفعيل الإشعارات لحساب OpenClaw الرسمي على X ‏[@openclaw](https://x.com/openclaw) لإعلانات الإصدارات.
2. اختبر Plugin الخاص بك مع الوسم التجريبي فور ظهوره. تكون المهلة قبل الإصدار المستقر عادة بضع ساعات فقط.
3. انشر في سلسلة Plugin الخاص بك في قناة Discord ‏`plugin-forum` بعد الاختبار بإحدى العبارتين: `all good` أو ما الذي تعطّل. إذا لم تكن لديك سلسلة بعد، فأنشئ واحدة.
4. إذا تعطّل شيء ما، فافتح Issue أو حدّث واحدة بعنوان `Beta blocker: <plugin-name> - <summary>` وطبّق التصنيف `beta-blocker`. ضع رابط الـ Issue في سلسلتك.
5. افتح PR إلى `main` بعنوان `fix(<plugin-id>): beta blocker - <summary>` واربط الـ Issue في كلٍّ من PR وسلسلة Discord الخاصة بك. لا يمكن للمساهمين وضع تصنيفات على PRs، لذا يُعد العنوان الإشارة في جهة PR للمشرفين والأتمتة. يتم دمج العناصر المانعة مع PR؛ أما العناصر المانعة من دون PR فقد تُشحن على أي حال. يراقب المشرفون هذه السلاسل أثناء اختبار الإصدارات التجريبية.
6. عدم وجود ردود يعني أن كل شيء جيد. إذا فاتتك المهلة، فمن المرجّح أن يصل إصلاحك في الدورة التالية.

## الخطوات التالية

<CardGroup cols={2}>
  <Card title="Plugins القنوات" icon="messages-square" href="/ar/plugins/sdk-channel-plugins">
    أنشئ Plugin لقناة مراسلة
  </Card>
  <Card title="Plugins الموفّر" icon="cpu" href="/ar/plugins/sdk-provider-plugins">
    أنشئ Plugin لموفّر نماذج
  </Card>
  <Card title="نظرة عامة على SDK" icon="book-open" href="/ar/plugins/sdk-overview">
    مرجع خريطة الاستيراد وAPI التسجيل
  </Card>
  <Card title="مساعدات Runtime" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS والبحث وsubagent عبر api.runtime
  </Card>
  <Card title="الاختبار" icon="test-tubes" href="/ar/plugins/sdk-testing">
    أدوات وأنماط الاختبار
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ar/plugins/manifest">
    المرجع الكامل لمخطط manifest
  </Card>
</CardGroup>

## ذو صلة

- [معمارية Plugin](/ar/plugins/architecture) — شرح معماري داخلي متعمّق
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع Plugin SDK
- [Manifest](/ar/plugins/manifest) — تنسيق manifest الخاص بالـ plugin
- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — بناء Plugins القنوات
- [Plugins الموفّر](/ar/plugins/sdk-provider-plugins) — بناء Plugins الموفّر
