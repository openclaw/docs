---
read_when:
    - تحتاج إلى دلالات إعدادات دقيقة على مستوى الحقول أو القيم الافتراضية
    - أنت تتحقق من كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-07-02T00:57:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d15cc968bc89a7a490a5eaf571d5f38d052ad8783fcc7de5ca17d08ac04bfcc7
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع إعدادات النواة لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة للمهام، راجع [الإعدادات](/ar/gateway/configuration).

يغطي أسطح إعدادات OpenClaw الرئيسية، ويربط بمراجع خارجية عندما يكون لنظام فرعي مرجعه الأعمق الخاص. تعيش كتالوجات الأوامر المملوكة للقنوات وPlugins ومفاتيح الذاكرة العميقة/QMD في صفحاتها الخاصة بدلاً من هذه الصفحة.

حقيقة الكود:

- يطبع `openclaw config schema` مخطط JSON الحي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات metadata للحزم/Plugins/القنوات عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بالمسار لأدوات التعمق
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس توثيق الإعدادات مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` وهو `config.schema.lookup` للحصول على
توثيق وقيود دقيقة على مستوى الحقول قبل التعديلات. استخدم
[الإعدادات](/ar/gateway/configuration) للإرشاد الموجه للمهام، وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، وروابط مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر الحالي المدمج + المرفق
- صفحات القناة/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

صيغة الإعدادات هي **JSON5** (تُسمح التعليقات + الفواصل اللاحقة). كل الحقول اختيارية - يستخدم OpenClaw قيماً افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح الإعدادات لكل قناة إلى صفحة مخصصة - راجع
[الإعدادات - القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وقنوات
أخرى مرفقة (المصادقة، التحكم في الوصول، الحسابات المتعددة، بوابات الإشارة).

## الإعدادات الافتراضية للوكلاء، وتعدد الوكلاء، والجلسات، والرسائل

انتقلت إلى صفحة مخصصة - راجع
[الإعدادات - الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، الصندوق الرملي)
- `multiAgent.*` (توجيه تعدد الوكلاء والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التشذيب)
- `messages.*` (تسليم الرسائل، تحويل النص إلى كلام، عرض markdown)
- `talk.*` (وضع التحدث)
  - `talk.consultThinkingLevel`: تجاوز مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استشارات Control UI Talk الفورية
  - `talk.consultFastMode`: تجاوز وضع السرعة لمرة واحدة لاستشارات Control UI Talk الفورية
  - `talk.speechLocale`: معرف لغة BCP 47 اختياري للتعرف على كلام Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم ضبطه، يحافظ Talk على نافذة التوقف الافتراضية للمنصة قبل إرسال النص المفرغ (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: رجوع ترحيل Gateway لنصوص Talk الفورية النهائية التي تتخطى `openclaw_agent_consult`

## الأدوات والموفرون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وإعدادات الأدوات المدعومة بالموفرين، وإعداد
الموفر المخصص / عنوان URL الأساسي إلى صفحة مخصصة - راجع
[الإعدادات - الأدوات والموفرون المخصصون](/ar/gateway/config-tools).

## النماذج

توجد تعريفات الموفرين، وقوائم السماح للنماذج، وإعداد الموفر المخصص في
[الإعدادات - الأدوات والموفرون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
كما يملك جذر `models` سلوك كتالوج النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك كتالوج الموفر (`merge` أو `replace`).
- `models.providers`: خريطة الموفرين المخصصين مفهرسة بمعرف الموفر.
- `models.providers.*.localService`: مدير عمليات اختياري عند الطلب
  لخوادم النماذج المحلية. يفحص OpenClaw نقطة نهاية الصحة المضبوطة، ويبدأ
  `command` المطلق عند الحاجة، وينتظر الجاهزية، ثم يرسل طلب النموذج.
  راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- `models.pricing.enabled`: يتحكم في تهيئة التسعير الخلفية التي
  تبدأ بعد وصول الخدمات الجانبية والقنوات إلى مسار جاهزية Gateway. عندما تكون `false`،
  يتخطى Gateway جلب كتالوجات تسعير OpenRouter وLiteLLM؛ وتظل قيم
  `models.providers.*.models[].cost` المضبوطة تعمل لتقديرات التكلفة المحلية.

## MCP

تعيش تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` وتُستهلك
بواسطة OpenClaw المضمّن ومحوّلات التشغيل الأخرى. تدير أوامر `openclaw mcp list`
و`show` و`set` و`unset` هذه الكتلة دون الاتصال
بالخادم الهدف أثناء تعديلات الإعدادات.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: تعريفات خوادم MCP مسماة، من نوع stdio أو بعيدة، لبيئات التشغيل التي
  تعرض أدوات MCP المضبوطة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  و`type: "http"` هو اسم بديل أصلي في CLI يقوم `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى حقل `transport` القانوني.
- `mcp.servers.<name>.enabled`: اضبطه إلى `false` للاحتفاظ بتعريف خادم محفوظ
  مع استبعاده من اكتشاف MCP المضمّن في OpenClaw وإسقاط الأدوات.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: مهلة طلب MCP لكل خادم
  بالثواني أو بالميلي ثانية.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: مهلة الاتصال لكل خادم
  بالثواني أو بالميلي ثانية.
- `mcp.servers.<name>.supportsParallelToolCalls`: تلميح تزامن اختياري
  للمحوّلات التي يمكنها اختيار إصدار استدعاءات أدوات MCP متوازية.
- `mcp.servers.<name>.auth`: اضبطه إلى `"oauth"` لخوادم MCP عبر HTTP التي تتطلب
  OAuth. شغّل `openclaw mcp login <name>` لتخزين الرموز ضمن حالة OpenClaw.
- `mcp.servers.<name>.oauth`: تجاوزات اختيارية لنطاق OAuth، وعنوان URL لإعادة التوجيه، وعنوان URL لبيانات
  metadata الخاصة بالعميل.
- `mcp.servers.<name>.sslVerify` و`clientCert` و`clientKey`: عناصر تحكم HTTP TLS
  لنقاط النهاية الخاصة وTLS المتبادل.
- `mcp.servers.<name>.toolFilter`: اختيار أدوات اختياري لكل خادم. يحد `include`
  الأدوات المكتشفة من MCP إلى الأسماء المطابقة؛ ويخفي `exclude` الأسماء المطابقة.
  الإدخالات هي أسماء أدوات MCP دقيقة أو أنماط glob بسيطة باستخدام `*`. الخوادم ذات
  الموارد أو المطالبات تنشئ أيضاً أسماء أدوات مساعدة (`resources_list`
  و`resources_read` و`prompts_list` و`prompts_get`)، وتستخدم تلك الأسماء
  المرشح نفسه.
- `mcp.servers.<name>.codex`: عناصر تحكم اختيارية لإسقاط خادم تطبيق Codex.
  هذه الكتلة هي بيانات metadata من OpenClaw لسلاسل خادم تطبيق Codex فقط؛ ولا
  تؤثر على جلسات ACP، أو إعدادات حزمة Codex العامة، أو محوّلات التشغيل الأخرى.
  تحد `codex.agents` غير الفارغة الخادم إلى معرفات وكلاء OpenClaw المدرجة.
  ترفض عملية التحقق من الإعدادات قوائم الوكلاء المحددة النطاق الفارغة أو الخالية أو غير الصالحة
  ويحذفها مسار إسقاط وقت التشغيل بدلاً من أن تصبح عامة.
  يصدر `codex.defaultToolsApprovalMode` القيمة الأصلية في Codex وهي
  `default_tools_approval_mode` لذلك الخادم. يزيل OpenClaw كتلة `codex`
  قبل تمرير إعدادات `mcp_servers` الأصلية إلى Codex. احذف الكتلة
  لإبقاء الخادم مسقطاً لكل وكيل خادم تطبيق Codex مع سلوك موافقة MCP
  الافتراضي في Codex.
- `mcp.sessionIdleTtlMs`: مدة البقاء عند الخمول لبيئات تشغيل MCP المرفقة المحددة بنطاق الجلسة.
  تطلب التشغيلات المضمّنة لمرة واحدة التنظيف عند نهاية التشغيل؛ وتكون مدة البقاء هذه حاجز الأمان
  للجلسات طويلة العمر والمستدعين المستقبليين.
- تُطبق التغييرات ضمن `mcp.*` مباشرة عبر التخلص من بيئات تشغيل MCP للجلسات المخزنة مؤقتاً.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من الإعدادات الجديدة، لذلك تُحصد
  إدخالات `mcp.servers` المحذوفة فوراً بدلاً من انتظار مدة البقاء عند الخمول.
- يراعي اكتشاف وقت التشغيل أيضاً إشعارات تغيير قائمة أدوات MCP عبر إسقاط
  الكتالوج المخزن مؤقتاً لتلك الجلسة. تحصل الخوادم التي تعلن موارد أو
  مطالبات على أدوات مساعدة لسرد/قراءة الموارد وسرد/جلب
  المطالبات. تؤدي إخفاقات استدعاء الأدوات المتكررة إلى إيقاف الخادم المتأثر مؤقتاً لفترة وجيزة قبل
  محاولة استدعاء أخرى.

راجع [MCP](/ar/cli/mcp#openclaw-as-an-mcp-client-registry) و
[خلفيات CLI](/ar/gateway/cli-backends#bundle-mcp-overlays) لسلوك وقت التشغيل.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: قائمة سماح اختيارية للـ Skills المرفقة فقط (لا تتأثر Skills المُدارة/Skills مساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أولوية).
- `load.allowSymlinkTargets`: جذور أهداف حقيقية موثوقة يمكن لروابط Skills الرمزية
  أن تُحل إليها عندما يعيش الرابط خارج جذر المصدر المضبوط.
- `workshop.allowSymlinkTargetWrites`: يسمح لتطبيق Skill Workshop بالكتابة
  عبر أهداف الروابط الرمزية الموثوقة مسبقاً (الافتراضي: false).
- `install.preferBrew`: عندما تكون true، تفضّل مُثبّتات Homebrew عندما يكون `brew`
  متاحاً قبل الرجوع إلى أنواع المثبتات الأخرى.
- `install.nodeManager`: تفضيل مثبت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: يسمح لعملاء Gateway الموثوقين من نوع `operator.admin`
  بتثبيت أرشيفات zip خاصة مُحضّرة عبر `skills.upload.*`
  (الافتراضي: false). هذا يفعّل مسار الأرشيف المرفوع فقط؛ ولا تتطلب
  تثبيتات ClawHub العادية ذلك.
- يعطل `entries.<skillKey>.enabled: false` إحدى Skills حتى لو كانت مرفقة/مثبتة.
- `entries.<skillKey>.apiKey`: وسيلة مريحة لـ Skills التي تعلن متغير بيئة أساسياً (سلسلة نصية عادية أو كائن SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- تُحمَّل من أدلة الحزم أو الحزم المجمّعة ضمن `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، بالإضافة إلى الملفات أو الأدلة المدرجة في `plugins.load.paths`.
- ضع ملفات Plugin المستقلة في `plugins.load.paths`؛ تتجاهل جذور الامتدادات المكتشفة تلقائيًا ملفات `.js` و`.mjs` و`.ts` في المستوى الأعلى كي لا تمنع سكربتات المساعدة في تلك الجذور بدء التشغيل.
- يقبل الاكتشاف Plugins OpenClaw الأصلية بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي من دون بيان.
- **تتطلب تغييرات الإعدادات إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (تُحمَّل Plugins المدرجة فقط). تتغلب `deny`.
- `plugins.entries.<id>.apiKey`: حقل تسهيلي لمفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة مخصّصة لنطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يمنع النواة `before_prompt_build` ويتجاهل الحقول التي تعدّل المطالبة من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق ذلك على خطافات Plugin الأصلية وأدلة الخطافات المدعومة التي توفرها الحزم.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن لـ Plugins الموثوقة غير المجمّعة قراءة محتوى المحادثة الخام من الخطافات المعيّنة مثل `llm_input` و`llm_output` و`before_model_resolve` و`before_agent_reply` و`before_agent_run` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: الوثوق صراحةً بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل في تشغيلات الوكيل الفرعي الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القانونية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowModelOverride`: الوثوق صراحةً بهذا Plugin لطلب تجاوزات النموذج لـ `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القانونية لتجاوزات إكمال LLM الموثوقة الخاصة بـ Plugin. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: الوثوق صراحةً بهذا Plugin لتشغيل `api.runtime.llm.complete` على معرّف وكيل غير افتراضي.
- `plugins.entries.<id>.config`: كائن إعدادات يعرّفه Plugin (يُتحقق منه بواسطة مخطط Plugin OpenClaw الأصلي عند توفره).
- توجد إعدادات حساب/وقت تشغيل Plugin القناة ضمن `channels.<id>`، ويجب أن تصفها بيانات `channelConfigs` الوصفية في بيان Plugin المالك، لا سجل خيارات OpenClaw مركزي.

### إعدادات Plugin حزام Codex

يمتلك Plugin `codex` المجمّع إعدادات حزام خادم تطبيق Codex الأصلية ضمن
`plugins.entries.codex.config`. راجع
[مرجع حزام Codex](/ar/plugins/codex-harness-reference) للاطلاع على سطح الإعدادات الكامل
و[حزام Codex](/ar/plugins/codex-harness) للاطلاع على نموذج وقت التشغيل.

ينطبق `codexPlugins` فقط على الجلسات التي تختار حزام Codex الأصلي.
ولا يفعّل Plugins Codex لتشغيلات موفر OpenClaw أو روابط محادثة ACP
أو أي حزام غير Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: يفعّل دعم
  Plugin/التطبيق الأصلي لحزام Codex. الافتراضي: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سياسة إجراء الإتلاف الافتراضية لاستدعاءات تطبيق Plugin المرحّلة.
  استخدم `true` لقبول مخططات موافقة Codex الآمنة من دون مطالبة، أو `false`
  لرفضها، أو `"auto"` لتوجيه موافقات Codex المطلوبة عبر موافقات Plugin في OpenClaw،
  أو `"ask"` للمطالبة بكل إجراء كتابة/إتلاف خاص بـ Plugin
  من دون موافقة دائمة. يمسح وضع `"ask"` تجاوزات موافقة Codex الدائمة
  لكل أداة للتطبيق المتأثر ويختار مراجع الموافقات البشري لذلك التطبيق قبل بدء سلسلة Codex.
  الافتراضي: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: يفعّل
  إدخال Plugin مرحّل عندما يكون `codexPlugins.enabled` العام صحيحًا أيضًا.
  الافتراضي: `true` للإدخالات الصريحة.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هوية سوق مستقرة. يدعم V1 فقط `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هوية
  Plugin Codex مستقرة من الترحيل، مثل `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  تجاوز إجراء الإتلاف لكل Plugin. عند حذفه، تُستخدم قيمة
  `allow_destructive_actions` العامة. تقبل القيمة الخاصة بكل Plugin
  السياسات نفسها: `true` أو `false` أو `"auto"` أو `"ask"`.

يوجه كل تطبيق Plugin مقبول يستخدم `"ask"` طلبات موافقة ذلك التطبيق
إلى المراجع البشري. تحتفظ التطبيقات الأخرى وموافقات السلاسل غير التطبيقية
بالمراجع المكوَّن لها، لذلك لا ترث سياسات Plugin المختلطة سلوك `"ask"`.

`codexPlugins.enabled` هو توجيه التفعيل العام. إدخالات Plugin الصريحة
التي يكتبها الترحيل هي مجموعة أهلية التثبيت والإصلاح الدائمة.
`plugins["*"]` غير مدعوم، ولا يوجد مفتاح `install`، وقيم
`marketplacePath` المحلية ليست حقول إعدادات عمدًا لأنها
خاصة بالمضيف.

تُخزَّن فحوصات جاهزية `app/list` مؤقتًا لمدة ساعة واحدة وتُحدَّث
بشكل غير متزامن عند تقادمها. تُحتسب إعدادات تطبيق سلسلة Codex عند إنشاء جلسة حزام Codex،
وليس في كل دور؛ استخدم `/new` أو `/reset` أو أعد تشغيل Gateway
بعد تغيير إعدادات Plugin الأصلية.

- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفر جلب الويب Firecrawl.
  - `apiKey`: مفتاح API اختياري لـ Firecrawl لحدود أعلى (يقبل SecretRef). يعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لواجهة Firecrawl API (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر التخزين المؤقت بالميلي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الاستخلاص بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث Grok على الويب).
  - `enabled`: تفعيل موفر X Search.
  - `model`: نموذج Grok المراد استخدامه للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: إيقاع Cron لكل مسح Dreaming كامل (`"0 3 * * *"` افتراضيًا).
  - `model`: تجاوز اختياري لنموذج وكيل Dream Diary الفرعي. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه بـ `allowedModels` لتقييد الأهداف. تُعاد محاولة أخطاء عدم توفر النموذج مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ ولا تُتجاوز إخفاقات الثقة أو قائمة السماح بصمت.
  - سياسة المراحل والعتبات هي تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـ Plugins حزم Claude المفعّلة أيضًا المساهمة بإعدادات OpenClaw افتراضية مضمّنة من `settings.json`؛ يطبّق OpenClaw هذه كإعدادات وكيل منقّاة، لا كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ يكون الافتراضي `"legacy"` ما لم تثبّت وتحدد محركًا آخر.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يمكن لـ OpenClaw اكتشاف عمليات التحقق من أدوار المحادثة وتسليمها عبر تشغيلات Heartbeat.

- `commitments.enabled`: تفعيل استخراج LLM المخفي والتخزين وتسليم Heartbeat للالتزامات المستنتجة الخاصة بالمتابعة. الافتراضي: `false`.
- `commitments.maxPerDay`: الحد الأقصى لالتزامات المتابعة المستنتجة التي تُسلَّم لكل جلسة وكيل خلال يوم متحرك. الافتراضي: `3`.

راجع [الالتزامات المستنتجة](/ar/concepts/commitments).

---

## المتصفح

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- يعطّل `evaluateEnabled: false` كلاً من `act:evaluate` و`wait --fn`.
- يستعيد `tabCleanup` تبويبات الوكيل الأساسي المتتبعة بعد وقت الخمول أو عندما
  تتجاوز الجلسة حدّها الأقصى. اضبط `idleMinutes: 0` أو `maxTabsPerSession: 0` من أجل
  تعطيل أوضاع التنظيف الفردية تلك.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلاً عند عدم ضبطه، لذلك يظل تنقّل المتصفح صارماً افتراضياً.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمداً بتنقّل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات CDP الشخصية البعيدة (`profiles.*.cdpUrl`) للحظر نفسه للشبكات الخاصة أثناء فحوصات قابلية الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعوماً كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة للإرفاق فقط (بدء/إيقاف/إعادة تعيين معطّلة).
- يقبل `profiles.*.cdpUrl` كلاً من `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد أن يكتشف OpenClaw المسار `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك الموفّر بعنوان URL مباشر لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية وصول CDP البعيد و
  `attachOnly` إضافة إلى طلبات فتح التبويبات. تحتفظ ملفات تعريف local loopback المُدارة
  بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مُدارة خارجياً ويمكن الوصول إليها عبر loopback، فاضبط
  `attachOnly: true` لذلك الملف الشخصي؛ وإلا فسيعامل OpenClaw منفذ loopback كملف
  تعريف متصفح محلي مُدار وقد يبلّغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلاً من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف متصفح
  محدد مبني على Chromium مثل Brave أو Edge.
- يمكن لملفات تعريف `existing-session` ضبط `cdpUrl` عندما يكون Chrome قيد التشغيل بالفعل
  خلف نقطة نهاية اكتشاف DevTools HTTP(S) أو نقطة نهاية WS(S) مباشرة. في ذلك
  الوضع يمرّر OpenClaw نقطة النهاية إلى Chrome MCP بدلاً من استخدام الاتصال التلقائي؛
  ويتم تجاهل `userDataDir` في وسائط تشغيل Chrome MCP.
- تحافظ ملفات تعريف `existing-session` على حدود مسار Chrome MCP الحالية:
  إجراءات مبنية على اللقطات/المراجع بدلاً من استهداف محددات CSS، وخطافات رفع ملف واحد،
  وعدم وجود تجاوزات لمهلة مربعات الحوار، وعدم وجود `wait --load networkidle`، وعدم وجود
  `responsebody` أو تصدير PDF أو اعتراض تنزيلات أو إجراءات دفعية.
- تعيّن ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائياً؛ اضبط
  `cdpUrl` صراحة فقط لملفات تعريف CDP البعيدة أو إرفاق نقطة نهاية existing-session.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف الشخصي. استخدم هذا لتشغيل ملف تعريف واحد في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف HTTP الخاص بـ Chrome CDP
  بعد بدء العملية و`browser.localCdpReadyTimeoutMs` لجاهزية websocket الخاصة بـ CDP
  بعد التشغيل. ارفعها على المضيفين الأبطأ حيث يبدأ Chrome بنجاح لكن
  فحوصات الجاهزية تسبق اكتمال بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعداداً صحيحة موجبة حتى `120000` مللي ثانية؛ ويتم رفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنياً على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  الرمز `~` و`~/...` لدليل المنزل في نظام التشغيل قبل تشغيل Chromium.
  ويتم أيضاً توسيع التلدة في `userDataDir` لكل ملف تعريف على ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، الافتراضي `18791`).
- يضيف `extraArgs` علامات تشغيل إضافية إلى بدء تشغيل Chromium المحلي (على سبيل المثال
  `--disable-gpu` أو تحجيم النافذة أو علامات التصحيح).

---

## واجهة المستخدم

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: لون تمييز لزخرفة واجهة التطبيق الأصلية (تدرج فقاعة وضع التحدث، وما إلى ذلك).
- `assistant`: تجاوز هوية واجهة التحكم. يعود احتياطياً إلى هوية الوكيل النشط.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list for owner/admin callers
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway field details">

- `mode`: `local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway البدء ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الاستخدامات لـ WS + HTTP. الأسبقية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto` أو `loopback` (الافتراضي) أو `lan` (`0.0.0.0`) أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط) أو `custom`.
- **أسماء bind البديلة القديمة**: استخدم قيم وضع bind في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء المضيف البديلة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. مع شبكة Docker الجسرية (`-p 18789:18789`)، تصل الحركة عبر `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات bind غير `loopback` مصادقة Gateway. عمليًا، يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلًا عكسيًا واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج التهيئة رمزًا افتراضيًا.
- إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. تفشل مسارات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مكوّنًا والوضع غير محدد.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ لا يُعرض هذا عمدًا في مطالبات التهيئة.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي واعٍ بالهوية، وثق بترويسات الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر وكيل **غير loopback** افتراضيًا؛ تتطلب الوكلاء العكسيون عبر loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`. يمكن للمتصلين الداخليين على المضيف نفسه استخدام `gateway.auth.password` كخيار احتياطي محلي مباشر؛ يظل `gateway.auth.token` متنافيًا مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عند `true`، يمكن لترويسات هوية Tailscale Serve تلبية مصادقة Control UI/WebSocket (يتم التحقق عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale هذه؛ بل تتبع بدلًا من ذلك وضع مصادقة HTTP العادي في Gateway. يفترض هذا التدفق بلا رموز أن مضيف Gateway موثوق. القيمة الافتراضية `true` عندما يكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدِّد اختياري لفشل المصادقة. يُطبّق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع السر المشترك ورمز الجهاز بشكل مستقل). تُرجع المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Control UI غير المتزامن عبر Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تُفعّل المحدِّد عند الطلب الثاني بدلًا من أن تتسابق كلها كعدم تطابق عادي.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمدًا تحديد معدل حركة localhost أيضًا (لإعدادات الاختبار أو عمليات نشر الوكيل الصارمة).
- تُقيّد محاولات مصادقة WS الصادرة من أصل متصفح دائمًا مع تعطيل إعفاء loopback (دفاع متعمق ضد القوة الغاشمة المستندة إلى المتصفح على localhost).
- على loopback، تُعزل عمليات القفل تلك الصادرة من أصل متصفح لكل قيمة `Origin`
  موحّدة، لذلك لا تؤدي حالات الفشل المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: `serve` (tailnet فقط، bind عبر loopback) أو `funnel` (عام، يتطلب مصادقة).
- `tailscale.serviceName`: اسم خدمة Tailscale اختياري لوضع Serve، مثل
  `svc:openclaw`. عند ضبطه، يمرره OpenClaw إلى `tailscale serve
--service` حتى يمكن كشف Control UI عبر خدمة مسماة بدلًا
  من اسم مضيف الجهاز. يجب أن تستخدم القيمة صيغة اسم خدمة Tailscale
  `svc:<dns-label>`؛ ويبلغ بدء التشغيل عن عنوان URL للخدمة المشتقة.
- `tailscale.preserveFunnel`: عند `true` و`tailscale.mode = "serve"`، يتحقق OpenClaw
  من `tailscale funnel status` قبل إعادة تطبيق Serve عند بدء التشغيل ويتجاوزه
  إذا كان مسار Funnel مكوّن خارجيًا يغطي منفذ Gateway بالفعل.
  القيمة الافتراضية `false`.
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. مطلوبة لأصول المتصفح العامة غير loopback. تُقبل تحميلات واجهة مستخدم LAN/Tailnet الخاصة من نفس الأصل من loopback أو RFC1918/link-local أو `.local` أو `.ts.net` أو مضيفي Tailscale CGNAT من دون تمكين خيار الرجوع إلى ترويسة Host.
- `controlUi.chatMessageMaxWidth`: حد أقصى اختياري للعرض لرسائل دردشة Control UI المجمّعة. يقبل قيم عرض CSS مقيّدة مثل `960px` و`82%` و`min(1280px, 82%)` و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يمكّن الرجوع إلى أصل ترويسة Host لعمليات النشر التي تعتمد عمدًا على سياسة أصل ترويسة Host.
- `remote.transport`: `ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` هي `wss://` للمضيفين العامين؛ ويُقبل النص الصريح `ws://` فقط لـ loopback وLAN وlink-local و`.local` و`.ts.net` ومضيفي Tailscale CGNAT.
- `remote.remotePort`: منفذ Gateway على مضيف SSH البعيد. القيمة الافتراضية `18789`؛ استخدم هذا عندما يختلف منفذ النفق المحلي عن منفذ Gateway البعيد.
- `gateway.remote.token` / `.password` هي حقول اعتماد للعميل البعيد. لا تكوّن مصادقة Gateway بذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS أساسي لمرحل APNs الخارجي المستخدم بعد أن تنشر إصدارات iOS المدعومة بالمرحل التسجيلات إلى Gateway. تستخدم إصدارات App Store/TestFlight العامة مرحل OpenClaw المستضاف. يجب أن تتطابق عناوين URL للمرحل المخصص مع مسار بناء/نشر iOS منفصل عمدًا يشير عنوان URL للمرحل فيه إلى ذلك المرحل.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالميلي ثانية. القيمة الافتراضية `10000`.
- تُفوّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال محددة النطاق بالتسجيل إلى Gateway. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات مؤقتة عبر env لتكوين المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: مخرج مخصص للتطوير فقط لعناوين URL الخاصة بمرحل HTTP عبر loopback. يجب أن تبقى عناوين URL الخاصة بمرحل الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة Gateway WebSocket قبل المصادقة بالميلي ثانية. الافتراضي: `15000`. يأخذ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأسبقية عند ضبطه. زد هذه القيمة على المضيفين المحمّلين أو منخفضي القدرة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال إحماء بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: الفاصل الزمني لمراقب صحة القناة بالدقائق. اضبط `0` لتعطيل إعادات تشغيل مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس القديم بالدقائق. اجعل هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقب الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات تشغيل مراقب الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند ضبطه، يأخذ الأسبقية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما تكون `gateway.auth.*` غير مضبوطة.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يتم حلّه، يفشل الحل بإغلاق آمن (لا يوجد رجوع بعيد يخفي ذلك).
- `trustedProxies`: عناوين IP للوكلاء العكسيين التي تنهي TLS أو تحقن ترويسات العميل المُمرّرة. أدرج فقط الوكلاء الذين تتحكم بهم. تظل إدخالات loopback صالحة لإعدادات الوكيل/الاكتشاف المحلي على المضيف نفسه (على سبيل المثال Tailscale Serve أو وكيل عكسي محلي)، لكنها لا تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عند `true`، يقبل Gateway ترويسة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. القيمة الافتراضية `false` لسلوك الفشل المغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح CIDR/IP اختيارية للموافقة التلقائية على اقتران جهاز عقدة لأول مرة من دون نطاقات مطلوبة. تكون معطلة عند عدم ضبطها. لا يوافق هذا تلقائيًا على اقتران المشغّل/المتصفح/Control UI/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/رفض عام لأوامر العقد المعلنة بعد الاقتران وتقييم قائمة سماح المنصة. استخدم `allowCommands` للاشتراك في أوامر عقد خطيرة مثل `camera.snap` و`camera.clip` و`screen.record`؛ يزيل `denyCommands` أمرًا حتى إذا كان افتراض المنصة أو السماح الصريح سيضمّنه بخلاف ذلك. بعد أن تغيّر عقدة قائمة الأوامر المعلنة، ارفض اقتران ذلك الجهاز وأعد الموافقة عليه حتى يخزن Gateway لقطة الأوامر المحدّثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (توسّع قائمة الرفض الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة رفض HTTP الافتراضية
  للمتصلين المالكين/المسؤولين. لا يرقّي هذا المتصلين الحاملين لهوية `operator.write`
  إلى وصول مالك/مسؤول؛ تظل `cron` و`gateway` و`nodes`
  غير متاحة للمتصلين غير المالكين حتى عند إدراجها في قائمة السماح.

</Accordion>

### نقاط نهاية متوافقة مع OpenAI

- Admin HTTP RPC: معطّل افتراضيًا كـ Plugin `admin-http-rpc`. فعّل Plugin لتسجيل `POST /api/v1/admin/rpc`. راجع [Admin HTTP RPC](/ar/plugins/admin-http-rpc).
- Chat Completions: معطّل افتراضيًا. فعّله باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة كأنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة اختيارية لتقوية الاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل النسخ المتعددة

شغّل عدة Gateways على مضيف واحد بمنافذ ومجلدات حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام تسهيلية: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [عدة Gateways](/ar/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: يفعّل إنهاء TLS عند مستمع Gateway (HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محلي موقّع ذاتيًا عندما لا تكون الملفات الصريحة مكوّنة؛ للاستخدام المحلي/التطويري فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ أبقه مقيّد الأذونات.
- `caPath`: مسار اختياري لحزمة CA للتحقق من العملاء أو سلاسل الثقة المخصصة.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات في وقت التشغيل.
  - `"off"`: تجاهل التعديلات المباشرة؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيّر الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخنة أولًا؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: أقصى وقت اختياري بالمللي ثانية للانتظار حتى تكتمل العمليات الجارية قبل فرض إعادة تشغيل أو إعادة تحميل ساخنة للقناة. اتركه لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ اضبطه على `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية بأن هناك عمليات ما زالت معلّقة.

---

## الخطافات

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

المصادقة: `Authorization: Bearer <token>` أو `x-openclaw-token: <token>`.
تُرفض رموز الخطافات في سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` وجود `hooks.token` غير فارغ.
- يجب أن يكون `hooks.token` مختلفًا عن مصادقة السر المشترك النشطة في Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)؛ تسجّل عملية بدء التشغيل تحذيرًا أمنيًا غير قاتل عندما تكتشف إعادة استخدامه.
- يضع `openclaw security audit` علامة على إعادة استخدام مصادقة الخطاف/Gateway كنتيجة حرجة، بما في ذلك مصادقة كلمة مرور Gateway المقدمة فقط وقت التدقيق (`--auth password --password <password>`). شغّل `openclaw doctor --fix` لتدوير `hooks.token` محفوظ مُعاد استخدامه، ثم حدّث مرسلي الخطافات الخارجيين لاستخدام رمز الخطاف الجديد.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (مثلًا `["hook:"]`).
- إذا استخدم تعيين أو إعداد مسبق `sessionKey` بقالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك الصريح.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في التعيين المولدة بالقوالب كقيم مقدمة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء خطاف.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى ضمن `hooks.transformsDir` (تُرفض المسارات المطلقة واجتياز المسارات).
  - أبقِ `hooks.transformsDir` ضمن `~/.openclaw/hooks/transforms`؛ تُرفض أدلة Skills في مساحة العمل. إذا أبلغ `openclaw doctor` أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات الخطافات أو أزل `hooks.transformsDir`.
- يوجّه `agentId` إلى وكيل محدد؛ تعود المعرّفات غير المعروفة إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد توجيه الوكيل الفعّال، بما في ذلك مسار الوكيل الافتراضي عند حذف `agentId` (`*` أو محذوف = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل الخطاف دون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` بقالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ القيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` نموذج LLM لتشغيل هذا الخطاف (يجب أن يكون مسموحًا به إذا كان كتالوج النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المدمج `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت ذلك التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` ليطابق مساحة أسماء Gmail، مثل `["hook:", "hook:gmail:"]`.
- إذا كنت تحتاج إلى `hooks.allowRequestSessionKey: false`، فتجاوز الإعداد المسبق باستخدام `sessionKey` ثابت بدلًا من الافتراضي ذي القالب.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- يبدأ Gateway تلقائيًا `gog gmail watch serve` عند الإقلاع عندما يكون مضبوطًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلًا بجانب Gateway.

---

## مضيف Plugin اللوحة

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- يقدّم HTML/CSS/JS وA2UI القابلة لتحرير الوكيل عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الارتباطات غير `loopback`: تتطلب مسارات اللوحة مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل Node WebViews عادةً ترويسات المصادقة؛ بعد إقران عقدة واتصالها، يعلن Gateway عن عناوين URL ذات إمكانات محددة النطاق بالعقدة للوصول إلى اللوحة/A2UI.
- ترتبط عناوين URL للإمكانات بجلسة WS النشطة للعقدة وتنتهي صلاحيتها سريعًا. لا يُستخدم الرجوع المستند إلى IP.
- يحقن عميل إعادة التحميل المباشر في HTML المقدّم.
- ينشئ تلقائيًا `index.html` بادئًا عندما يكون فارغًا.
- يقدّم أيضًا A2UI عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
- عطّل إعادة التحميل المباشر للأدلة الكبيرة أو أخطاء `EMFILE`.

---

## الاكتشاف

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (الافتراضي عند تمكين Plugin `bonjour` المدمج): احذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: تضمين `cliPath` + `sshPort`؛ ما زال الإعلان متعدد البث على LAN يتطلب تمكين Plugin `bonjour` المدمج.
- `off`: كبت الإعلان متعدد البث على LAN دون تغيير تمكين Plugin.
- يبدأ Plugin `bonjour` المدمج تلقائيًا على مضيفي macOS، ويكون اختياريًا على Linux وWindows وعمليات نشر Gateway داخل الحاويات.
- يكون اسم المضيف افتراضيًا هو اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوز ذلك باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية البث ضمن `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، اقرنه بخادم DNS (يوصى بـ CoreDNS) + Tailscale split DNS.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` (متغيرات البيئة المضمنة)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- لا تُطبَّق متغيرات البيئة المضمنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` (لا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول لديك.
- راجع [البيئة](/ar/help/environment) لمعرفة ترتيب الأولوية الكامل.

### استبدال متغيرات البيئة

أشر إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- لا تُطابق إلا الأسماء المكتوبة بالأحرف الكبيرة: `[A-Z_][A-Z0-9_]*`.
- المتغيرات المفقودة/الفارغة تؤدي إلى طرح خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للهروب والحصول على `${VAR}` حرفيًا.
- يعمل مع `$include`.

---

## الأسرار

مراجع الأسرار إضافية: لا تزال القيم النصية الصريحة تعمل.

### `SecretRef`

استخدم شكل كائن واحدًا:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط معرّف `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- معرّف `source: "file"`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط معرّف `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (يدعم محددات بأسلوب AWS مثل `secret#json_key`)
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار مفصولة بشرطة مائلة `.` أو `..` (مثلًا يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة الأساسية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُدرج مراجع `auth-profiles.json` في حلّ وقت التشغيل وتغطية التدقيق.

### إعدادات مزودي الأسرار

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

ملاحظات:

- يدعم مزود `file` الوضعين `mode: "json"` و`mode: "singleValue"` (يجب أن يكون `id` هو `"value"` في وضع singleValue).
- تفشل مسارات مزودي الملفات والتنفيذ بإغلاق آمن عندما لا يتوفر التحقق من Windows ACL. عيّن `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب مزود `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول على stdin/stdout.
- افتراضيًا، تُرفض مسارات أوامر الروابط الرمزية. عيّن `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف الذي تم حله.
- إذا تم إعداد `trustedDirs`، ينطبق فحص الدليل الموثوق على مسار الهدف الذي تم حله.
- بيئة عملية `exec` الفرعية تكون بالحد الأدنى افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار وقت التفعيل إلى لقطة في الذاكرة، ثم تقرأ مسارات الطلبات اللقطة فقط.
- ينطبق ترشيح السطح النشط أثناء التفعيل: المراجع غير المحلولة على الأسطح الممكّنة تفشل بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع التشخيصات.

---

## تخزين المصادقة

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- تُخزَّن ملفات التعريف لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست تنسيق تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات تعريف مفاتيح API قانونية بصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- ملفات التعريف بوضع OAuth (`auth.profiles.<id>.mode = "oauth"`) لا تدعم بيانات اعتماد ملف تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات اعتماد التشغيل الثابتة من لقطات محلولة في الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- تُستورد OAuth القديمة من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك تشغيل الأسرار وأدوات `audit/configure/apply`: [إدارة الأسرار](/ar/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: التراجع الأساسي بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). قد يظل نص الفوترة الصريح يصل إلى هنا حتى في استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزوّد تبقى محصورة في المزوّد الذي يملكها (على سبيل المثال OpenRouter `Key limit exceeded`). تبقى رسائل استخدام نافذة HTTP `402` القابلة لإعادة المحاولة أو رسائل حد إنفاق المؤسسة/مساحة العمل في مسار `rate_limit` بدلاً من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات لنمو تراجع الفوترة الأُسّي (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: التراجع الأساسي بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لدورات تبديل ملفات تعريف المصادقة ضمن المزوّد نفسه لأخطاء التحميل الزائد قبل التحويل إلى بديل النموذج (الافتراضي: `1`). تصل هنا أشكال انشغال المزوّد مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف محمّل زائدًا (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لدورات تبديل ملفات تعريف المصادقة ضمن المزوّد نفسه لأخطاء حد المعدل قبل التحويل إلى بديل النموذج (الافتراضي: `1`). يشمل حاوي حد المعدل ذلك نصوصًا مشكلة من المزوّد مثل `Too many concurrent requests`، و`ThrottlingException`، و`concurrency limit reached`، و`workers_ai ... quota limit exceeded`، و`resource exhausted`.

---

## التسجيل

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- ملف السجل الافتراضي: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- اضبط `logging.file` لمسار ثابت.
- يرتفع `consoleLevel` إلى `debug` عند استخدام `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل النشط بالبايت قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 MB). يحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقمة بجانب الملف النشط.
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونصوص محاضر الجلسات المستمرة. لا يعطّل `redactSensitive: "off"` إلا سياسة السجل/المحضر العامة هذه؛ ولا تزال أسطح أمان الواجهة/الأدوات/التشخيصات تحجب الأسرار قبل الإرسال.

---

## التشخيصات

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: مفتاح التفعيل الرئيسي لمخرجات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات التي تفعّل مخرجات سجل موجهة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: حد عمر عدم التقدم بالميلي ثانية لتصنيف جلسات المعالجة طويلة التشغيل كـ `session.long_running` أو `session.stalled` أو `session.stuck`. تعيد الردود والأدوات والحالة والكتل وتقدم ACP ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة عندما لا تتغير الحالة.
- `stuckSessionAbortMs`: حد عمر عدم التقدم بالميلي ثانية قبل أن يصبح العمل النشط المتعثر المؤهل قابلاً للتفريغ بالإجهاض للتعافي. عند عدم الضبط، يستخدم OpenClaw نافذة التشغيل المضمنة الممتدة الأكثر أمانًا، التي لا تقل عن 5 دقائق و3 أضعاف `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: يلتقط لقطة استقرار منقحة قبل نفاد الذاكرة عندما يصل ضغط الذاكرة إلى `critical` (الافتراضي: `false`). اضبطه إلى `true` لإضافة فحص/كتابة ملف حزمة الاستقرار مع إبقاء أحداث ضغط الذاكرة العادية.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`). للاطلاع على التكوين الكامل وكتالوج الإشارات ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع لتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية مخصصة للإشارات. عند ضبطها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبعات أو المقاييس أو السجلات.
- `otel.logsExporter`: وجهة تصدير السجلات: `"otlp"` (الافتراضي)، أو `"stdout"` لكائن JSON واحد لكل سطر stdout، أو `"both"`.
- `otel.sampleRate`: معدل أخذ عينات التتبع `0`-`1`.
- `otel.flushIntervalMs`: فاصل التفريغ الدوري للقياسات بالميلي ثانية.
- `otel.captureContent`: التقاط اختياري للمحتوى الخام لسمات امتداد OTEL. يكون معطلاً افتراضيًا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامي؛ ويتيح لك شكل الكائن تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` و`toolDefinitions` صراحةً.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لشكل امتداد استدلال GenAI التجريبي الأحدث، بما في ذلك أسماء الامتدادات `{gen_ai.operation.name} {gen_ai.request.model}` ونوع الامتداد `CLIENT` و`gen_ai.provider.name` بدلاً من `gen_ai.system` القديم. افتراضيًا تحتفظ الامتدادات بـ `openclaw.model.call` و`gen_ai.system` للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفين الذين سجلوا مسبقًا SDK عام لـ OpenTelemetry. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية مخصصة للإشارات تُستخدم عندما لا يكون مفتاح التكوين المطابق مضبوطًا.
- `cacheTrace.enabled`: تسجيل لقطات تتبع الذاكرة المؤقتة للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار إخراج JSONL لتتبع الذاكرة المؤقتة (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم بما يُضمَّن في مخرجات تتبع الذاكرة المؤقتة (كلها افتراضيًا: `true`).

---

## التحديث

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: قناة الإصدار لتثبيتات npm/git - `"stable"` أو `"beta"` أو `"dev"`.
- `checkOnStart`: التحقق من تحديثات npm عند بدء Gateway (الافتراضي: `true`).
- `auto.enabled`: تفعيل التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable (الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة انتشار إضافية بالساعة لطرح قناة stable (الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: معدل تشغيل فحوصات قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ اضبط `false` لإخفاء إتاحة إرسال ACP وإنشاء الجلسات).
- `dispatch.enabled`: بوابة مستقلة لإرسال دور جلسة ACP (الافتراضي: `true`). اضبط `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف واجهة تشغيل ACP الخلفية الافتراضي (يجب أن يطابق Plugin تشغيل ACP مسجلاً).
  ثبّت Plugin الواجهة الخلفية أولاً، وإذا كان `plugins.allow` مضبوطًا، فأدرج معرّف Plugin الواجهة الخلفية (على سبيل المثال `acpx`) وإلا فلن تُحمَّل واجهة ACP الخلفية.
- `defaultAgent`: معرّف الوكيل الهدف الاحتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح بمعرّفات الوكلاء المسموح بها لجلسات تشغيل ACP؛ تعني القيمة الفارغة عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة في الوقت نفسه.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالميلي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: قمع أسطر الحالة/الأدوات المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: يدفّق `"live"` بشكل تزايدي؛ ويخزّن `"final_only"` مؤقتًا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى لعدد أحرف أسطر حالة/تحديث ACP المعروضة.
- `stream.tagVisibility`: سجل لأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: TTL الخمول بالدقائق لعمّال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري للتشغيل عند تهيئة بيئة تشغيل ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- يتحكم `cli.banner.taglineMode` في نمط عبارة اللافتة:
  - `"random"` (الافتراضي): عبارات طريفة/موسمية متناوبة.
  - `"default"`: عبارة محايدة ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: بلا نص عبارة (لا يزال عنوان اللافتة/الإصدار ظاهرًا).
- لإخفاء اللافتة بالكامل (وليس العبارات فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

البيانات الوصفية التي تكتبها تدفقات الإعداد الموجّه في CLI (`onboard`، `configure`، `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## الهوية

راجع حقول هوية `agents.list` ضمن [افتراضيات الوكيل](/ar/gateway/config-agents#agent-defaults).

---

## الجسر (قديم، أُزيل)

لم تعد البُنى الحالية تتضمن جسر TCP. تتصل العقد عبر Gateway WebSocket. لم تعد مفاتيح `bridge.*` جزءًا من مخطط الإعدادات (يفشل التحقق إلى أن تُزال؛ يمكن لـ `openclaw doctor --fix` حذف المفاتيح غير المعروفة).

<Accordion title="إعدادات الجسر القديمة (مرجع تاريخي)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل إزالتها من `sessions.json`. يتحكم أيضًا في تنظيف نصوص Cron المحذوفة المؤرشفة. الافتراضي: `24h`؛ اضبطه على `false` للتعطيل.
- `runLog.maxBytes`: مقبول للتوافق مع سجلات تشغيل Cron الأقدم المدعومة بالملفات. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث صفوف سجل التشغيل في SQLite المحتفظ بها لكل مهمة. الافتراضي: `2000`.
- `webhookToken`: رمز حامل يُستخدم لتسليم POST عبر Webhook لـ Cron (`delivery.mode = "webhook"`)، وإذا أُهمل فلن يُرسل ترويس تفويض.
- `webhook`: عنوان URL احتياطي قديم ومهمل لـ Webhook (http/https) يستخدمه `openclaw doctor --fix` لترحيل المهام المخزنة التي لا تزال تحتوي على `notify: true`؛ يستخدم تسليم وقت التشغيل `delivery.mode="webhook"` لكل مهمة مع `delivery.to`، أو `delivery.completionDestination` عند الحفاظ على تسليم الإعلان.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: الحد الأقصى لإعادة محاولات مهام Cron عند الأخطاء العابرة (الافتراضي: `3`؛ النطاق: `0`-`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. احذفها لإعادة محاولة جميع الأنواع العابرة.

تظل المهام لمرة واحدة ممكّنة إلى أن تستنفد محاولات الإعادة، ثم تُعطَّل مع الاحتفاظ بحالة الخطأ النهائية. تستخدم المهام المتكررة سياسة إعادة المحاولة العابرة نفسها للتشغيل مجددًا بعد التراجع قبل خانتها المجدولة التالية؛ تعود الأخطاء الدائمة أو استنفاد محاولات الإعادة العابرة إلى الجدول المتكرر العادي مع تراجع الأخطاء.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: تمكين تنبيهات الفشل لمهام Cron (الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق تنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للمهمة نفسها (عدد صحيح غير سالب).
- `includeSkipped`: احتساب مرات التشغيل المتخطاة المتتالية ضمن عتبة التنبيه (الافتراضي: `false`). تُتتبّع مرات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
- `mode`: وضع التسليم - يرسل `"announce"` عبر رسالة قناة؛ وينشر `"webhook"` إلى Webhook المُعد.
- `accountId`: حساب اختياري أو معرّف قناة اختياري لتقييد نطاق تسليم التنبيه.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- الوجهة الافتراضية لإشعارات فشل Cron عبر جميع المهام.
- `mode`: `"announce"` أو `"webhook"`؛ الافتراضي هو `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلان. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب في وضع Webhook.
- `accountId`: تجاوز حساب اختياري للتسليم.
- يتجاوز `delivery.failureDestination` لكل مهمة هذا الافتراضي العام.
- عندما لا تُعيّن وجهة فشل عامة ولا خاصة بالمهمة، تعود المهام التي تُسلّم أصلًا عبر `announce` إلى هدف الإعلان الأساسي ذلك عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتتبّع عمليات تنفيذ Cron المعزولة كـ [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

العناصر النائبة للقالب التي تُوسَّع في `tools.media.models[].args`:

| المتغير            | الوصف                                            |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | نص الرسالة الواردة بالكامل                       |
| `{{RawBody}}`      | النص الخام (بلا مغلفات السجل/المرسل)             |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعة                   |
| `{{From}}`         | معرّف المرسل                                      |
| `{{To}}`           | معرّف الوجهة                                      |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID للجلسة الحالية                              |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                    |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                   |
| `{{MediaPath}}`    | مسار الوسائط المحلي                              |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/...)                |
| `{{Transcript}}`   | نص تفريغ الصوت                                   |
| `{{Prompt}}`       | مطالبة الوسائط المحلولة لإدخالات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI   |
| `{{ChatType}}`     | `"direct"` أو `"group"`                          |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)                |
| `{{SenderName}}`   | اسم عرض المرسل (بأفضل جهد)                       |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                      |
| `{{Provider}}`     | تلميح المزوّد (whatsapp، telegram، discord، إلخ) |

---

## تضمينات الإعدادات (`$include`)

قسّم الإعدادات إلى ملفات متعددة:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**سلوك الدمج:**

- ملف واحد: يستبدل الكائن المحتوي.
- مصفوفة ملفات: تُدمج دمجًا عميقًا بالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (تتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل بالنسبة إلى الملف المُضمِّن، لكن يجب أن تبقى داخل دليل الإعدادات ذي المستوى الأعلى (`dirname` لـ `openclaw.json`). يُسمح بالأشكال المطلقة/`../` فقط عندما تظل تُحل داخل ذلك الحد. يجب ألا تحتوي المسارات على بايتات null ويجب أن تكون أقصر من 4096 حرفًا بصرامة قبل الحل وبعده.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى ومدعومًا بتضمين ملف واحد تكتب عبر ذلك الملف المضمّن. على سبيل المثال، يحدّث `plugins install` الإعداد `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط في عمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك العمليات بإغلاق آمن بدلًا من تسطيح الإعدادات.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية، وتنسيق المسار غير الصالح، والطول المفرط.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [الإعدادات](/ar/gateway/configuration)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
