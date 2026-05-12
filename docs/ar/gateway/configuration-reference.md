---
read_when:
    - تحتاج إلى دلالات دقيقة للإعدادات على مستوى الحقول أو القيم الافتراضية
    - أنت تتحقق من صحة كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-05-12T00:59:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b8e31f7a6ed82faf3b5a50daa286bb6fce0c2e4452ae81a8e792a437004ad54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع إعدادات النواة لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة للمهام، راجع [التكوين](/ar/gateway/configuration).

يغطي أسطح إعدادات OpenClaw الرئيسية، ويربط إلى مراجع أعمق عندما يكون للنظام الفرعي مرجعه الخاص. توجد كتالوجات الأوامر المملوكة للقنوات والـ plugin ومفاتيح الذاكرة العميقة/QMD في صفحاتها الخاصة بدلًا من هذه الصفحة.

حقيقة الكود:

- يطبع `openclaw config schema` مخطط JSON Schema الحي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات الحزم/الـ plugin/القنوات الوصفية عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بالمسار لأدوات التعمق
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس وثائق الإعدادات مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` وهو `config.schema.lookup` للحصول على
وثائق وقيود دقيقة على مستوى الحقل قبل التعديلات. استخدم
[التكوين](/ar/gateway/configuration) للإرشادات الموجهة للمهام، وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، وروابط مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع تكوين الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وتكوين dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر Slash](/ar/tools/slash-commands) لكتالوج الأوامر الحالي المدمج + المحزم
- صفحات القنوات/الـ plugin المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق الإعدادات هو **JSON5** (يسمح بالتعليقات والفواصل اللاحقة). كل الحقول اختيارية - يستخدم OpenClaw قيماً افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح الإعدادات الخاصة بكل قناة إلى صفحة مخصصة - راجع
[التكوين - القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وقنوات أخرى
محزمة (المصادقة، والتحكم في الوصول، وتعدد الحسابات، وبوابة الإشارات).

## القيم الافتراضية للوكلاء، وتعدد الوكلاء، والجلسات، والرسائل

انتقلت إلى صفحة مخصصة - راجع
[التكوين - الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، heartbeat، الذاكرة، الوسائط، Skills، صندوق العزل)
- `multiAgent.*` (توجيه تعدد الوكلاء والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التشذيب)
- `messages.*` (تسليم الرسائل، TTS، عرض markdown)
- `talk.*` (وضع Talk)
  - `talk.consultThinkingLevel`: تجاوز مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استشارات Control UI Talk الفورية
  - `talk.consultFastMode`: تجاوز لمرة واحدة لوضع السرعة لاستشارات Control UI Talk الفورية
  - `talk.speechLocale`: معرف لغة اختياري وفق BCP 47 للتعرف على كلام Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم تعيينه، يحتفظ Talk بنافذة التوقف الافتراضية للمنصة قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)

## الأدوات والمزودون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وإعدادات الأدوات المدعومة بالمزودين، وإعداد
المزود المخصص / عنوان URL الأساسي إلى صفحة مخصصة - راجع
[التكوين - الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

توجد تعريفات المزودين، وقوائم السماح للنماذج، وإعداد المزود المخصص في
[التكوين - الأدوات والمزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
كما يملك جذر `models` سلوك كتالوج النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك كتالوج المزودين (`merge` أو `replace`).
- `models.providers`: خريطة مزودين مخصصة مفهرسة بمعرف المزود.
- `models.providers.*.localService`: مدير عمليات اختياري عند الطلب لخوادم
  النماذج المحلية. يفحص OpenClaw نقطة نهاية الصحة المكوّنة، ويبدأ
  `command` المطلق عند الحاجة، وينتظر الجاهزية، ثم يرسل طلب النموذج.
  راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- `models.pricing.enabled`: يتحكم في تمهيد التسعير في الخلفية الذي
  يبدأ بعد وصول العمليات الجانبية والقنوات إلى مسار جاهزية Gateway. عندما تكون `false`،
  يتخطى Gateway جلب كتالوجات تسعير OpenRouter وLiteLLM؛ وتظل قيم
  `models.providers.*.models[].cost` المكوّنة تعمل لتقديرات التكلفة المحلية.

## MCP

توجد تعريفات خوادم MCP المُدارة بواسطة OpenClaw ضمن `mcp.servers` وتستهلكها
Pi المضمنة ومهايئات تشغيل أخرى. تدير أوامر `openclaw mcp list` و
`show` و`set` و`unset` هذه الكتلة دون الاتصال بالخادم
الهدف أثناء تعديلات الإعدادات.

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
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: تعريفات خوادم MCP مسماة بنمط stdio أو بعيدة لبيئات التشغيل التي
  تعرض أدوات MCP المكوّنة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  و`type: "http"` اسم مستعار أصلي للـ CLI يقوم `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى حقل `transport` القياسي.
- `mcp.sessionIdleTtlMs`: مدة TTL للخمول لبيئات تشغيل MCP المحزمة المحددة بنطاق الجلسة.
  تطلب التشغيلات المضمنة لمرة واحدة التنظيف عند نهاية التشغيل؛ وتكون مدة TTL هذه هي حد الأمان
  للجلسات طويلة العمر والمستدعين المستقبليين.
- تُطبّق التغييرات ضمن `mcp.*` فورًا عبر التخلص من بيئات تشغيل MCP المخزنة للجلسات.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من الإعدادات الجديدة، لذلك تُزال
  إدخالات `mcp.servers` المحذوفة فورًا بدلًا من انتظار مدة TTL للخمول.

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

- `allowBundled`: قائمة سماح اختيارية للـ skills المحزمة فقط (لا تتأثر skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور skills مشتركة إضافية (أدنى أولوية).
- `load.allowSymlinkTargets`: جذور أهداف حقيقية موثوقة يمكن أن تتحلل إليها روابط skills الرمزية
  عندما يكون الرابط خارج جذر المصدر المكوّن له.
- `install.preferBrew`: عند true، يفضل مثبّتات Homebrew عندما يكون `brew` متاحًا
  قبل الرجوع إلى أنواع مثبّتات أخرى.
- `install.nodeManager`: تفضيل مثبّت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: يسمح لعملاء Gateway الموثوقين `operator.admin`
  بتثبيت أرشيفات zip خاصة مُحضّرة عبر `skills.upload.*`
  (القيمة الافتراضية: false). يمكّن هذا مسار الأرشيفات المرفوعة فقط؛ ولا تتطلب
  تثبيتات ClawHub العادية ذلك.
- `entries.<skillKey>.enabled: false` يعطل skill حتى لو كانت محزمة/مثبتة.
- `entries.<skillKey>.apiKey`: تسهيل للـ skills التي تعلن متغير بيئة أساسيًا (سلسلة نصية صريحة أو كائن SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
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

- تُحمّل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، إضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف plugins OpenClaw الأصلية إضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي بلا manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل gateway.**
- `allow`: قائمة سماح اختيارية (تُحمّل plugins المدرجة فقط). تكون أولوية `deny` أعلى.
- `bundledDiscovery`: القيمة الافتراضية هي `"allowlist"` للإعدادات الجديدة، بحيث إن وجود
  `plugins.allow` غير فارغة يقيّد أيضًا plugins المزودين المحزمة، بما في ذلك مزودي تشغيل
  بحث الويب. يكتب Doctor القيمة `"compat"` لإعدادات قوائم السماح القديمة المرحّلة
  للحفاظ على سلوك مزودي الحزم الحالي حتى تختار الاشتراك.
- `plugins.entries.<id>.apiKey`: حقل تسهيل لمفتاح API على مستوى plugin (عندما يدعمه plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة محددة بنطاق plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما يكون `false`، تمنع النواة `before_prompt_build` وتتجاهل الحقول التي تغيّر الموجه من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق على خطافات plugin الأصلية وأدلة الخطافات المدعومة المقدمة من الحزم.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما يكون `true`، يمكن للـ plugins غير المحزمة الموثوقة قراءة محتوى المحادثة الخام من خطافات نوعية مثل `llm_input` و`llm_output` و`before_model_resolve` و`before_agent_reply` و`before_agent_run` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: ثق صراحة بهذا plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لتشغيلات الوكلاء الفرعيين في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowModelOverride`: ثق صراحة بهذا plugin لطلب تجاوزات النموذج لـ `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات إكمال LLM من plugin الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: ثق صراحة بهذا plugin لتشغيل `api.runtime.llm.complete` مقابل معرف وكيل غير افتراضي.
- `plugins.entries.<id>.config`: كائن إعدادات يعرّفه plugin (يتم التحقق منه بواسطة مخطط plugin OpenClaw الأصلي عند توفره).
- تعيش إعدادات حساب/تشغيل Plugin القناة ضمن `channels.<id>` وينبغي أن تصفها بيانات `channelConfigs` الوصفية في manifest الخاصة بالـ plugin المالك، لا سجل خيارات OpenClaw مركزي.

### إعدادات Codex harness plugin

يمتلك Plugin `codex` المحزم إعدادات harness لخادم تطبيق Codex الأصلي ضمن
`plugins.entries.codex.config`. راجع
[مرجع Codex harness](/ar/plugins/codex-harness-reference) لسطح الإعدادات الكامل
و[Codex harness](/ar/plugins/codex-harness) لنموذج وقت التشغيل.

ينطبق `codexPlugins` فقط على الجلسات التي تختار Codex harness الأصلي.
لا يفعّل plugins Codex لـ Pi أو تشغيلات مزود OpenAI العادية أو ارتباطات محادثة ACP
أو أي harness غير Codex.

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
  plugin/app الأصلي لحزمة Codex. الافتراضي: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سياسة إجراءات التدمير الافتراضية لاستدعاءات تطبيقات Plugin المرحّلة.
  الافتراضي: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: يفعّل إدخال
  Plugin مرحّلاً عندما يكون `codexPlugins.enabled` العام مضبوطاً أيضاً على true.
  الافتراضي: `true` للإدخالات الصريحة.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هوية سوق ثابتة. يدعم V1 فقط `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هوية
  Codex Plugin ثابتة من الترحيل، مثل `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  تجاوز إجراءات التدمير لكل Plugin. عند حذفه، تُستخدم قيمة
  `allow_destructive_actions` العامة.

`codexPlugins.enabled` هو توجيه التفعيل العام. إدخالات Plugin الصريحة
التي يكتبها الترحيل هي مجموعة التثبيت الدائمة والأهلية للإصلاح.
`plugins["*"]` غير مدعوم، ولا يوجد مفتاح `install`، وقيم
`marketplacePath` المحلية ليست حقول إعدادات عمداً لأنها خاصة بالمضيف.

تُخزَّن فحوص جاهزية `app/list` مؤقتاً لمدة ساعة واحدة وتُحدَّث
بشكل غير متزامن عندما تصبح قديمة. تُحسب إعدادات تطبيق سلسلة Codex عند إنشاء
جلسة حزمة Codex، وليس في كل دورة؛ استخدم `/new` أو `/reset` أو إعادة تشغيل
Gateway بعد تغيير إعدادات Plugin الأصلية.

- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفر جلب الويب Firecrawl.
  - `apiKey`: مفتاح Firecrawl API (يقبل SecretRef). يعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ Firecrawl API (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخرج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث Grok على الويب).
  - `enabled`: فعّل موفر X Search.
  - `model`: نموذج Grok المراد استخدامه للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) لمعرفة المراحل والعتبات.
  - `enabled`: مفتاح dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة cron لكل مسح dreaming كامل (`"0 3 * * *"` افتراضياً).
  - `model`: تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه مع `allowedModels` لتقييد الأهداف. تُعاد محاولة أخطاء عدم توفر النموذج مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ إخفاقات الثقة أو قائمة السماح لا تعود احتياطياً بصمت.
  - سياسة المراحل والعتبات هي تفاصيل تنفيذية (وليست مفاتيح إعدادات ظاهرة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضاً لـ plugins حزمة Claude المفعّلة المساهمة بإعدادات Pi افتراضية مضمّنة من `settings.json`؛ يطبق OpenClaw هذه كإعدادات وكيل منقّاة، وليس كتصحيحات إعدادات OpenClaw خام.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ تكون القيمة الافتراضية `"legacy"` ما لم تثبّت وتحدد محركاً آخر.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يمكن لـ OpenClaw اكتشاف طلبات التحقق من دورات المحادثة وتسليمها عبر تشغيلات Heartbeat.

- `commitments.enabled`: فعّل استخراج LLM المخفي والتخزين وتسليم Heartbeat لالتزامات المتابعة المستنتجة. الافتراضي: `false`.
- `commitments.maxPerDay`: الحد الأقصى لالتزامات المتابعة المستنتجة التي تُسلَّم لكل جلسة وكيل في يوم متحرك. الافتراضي: `3`.

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

- `evaluateEnabled: false` يعطّل `act:evaluate` و`wait --fn`.
- يستعيد `tabCleanup` ألسنة الوكيل الأساسي المتتبعة بعد وقت الخمول أو عندما
  تتجاوز جلسة حدها الأقصى. اضبط `idleMinutes: 0` أو `maxTabsPerSession: 0`
  لتعطيل أوضاع التنظيف الفردية هذه.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلاً عند عدم ضبطه، لذا يبقى تنقل المتصفح صارماً افتراضياً.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمداً بتنقل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) لنفس حظر الشبكة الخاصة أثناء فحوص الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعوماً كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة هي للاتصال فقط (التشغيل/الإيقاف/إعادة الضبط معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد أن يكتشف OpenClaw المسار `/json/version`؛ واستخدم WS(S)
  عندما يوفر لك موفرك عنوان URL مباشراً لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية الوصول إلى CDP البعيد و
  `attachOnly` بالإضافة إلى طلبات فتح الألسنة. تحتفظ ملفات تعريف loopback
  المُدارة بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مُدارة خارجياً وقابلة للوصول عبر loopback، فاضبط
  `attachOnly: true` لذلك الملف الشخصي؛ وإلا يعامل OpenClaw منفذ loopback كملف
  تعريف متصفح محلي مُدار وقد يبلغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلاً من CDP ويمكنها الاتصال على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف
  متصفح محدد قائم على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات مدفوعة باللقطات/المراجع بدلاً من استهداف محددات CSS، وخطافات تحميل ملف واحد،
  ولا توجد تجاوزات مهلة للحوار، ولا `wait --load networkidle`، ولا
  `responsebody`، أو تصدير PDF، أو اعتراض التنزيل، أو إجراءات دفعية.
- تُعيّن ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائياً؛ اضبط
  `cdpUrl` صراحةً فقط لـ CDP البعيد.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف الشخصي. استخدم هذا لتشغيل ملف تعريف في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف HTTP الخاص بـ Chrome CDP
  بعد بدء العملية و`browser.localCdpReadyTimeoutMs` لجاهزية websocket الخاصة بـ CDP
  بعد الإطلاق. ارفعها على المضيفات الأبطأ حيث يبدأ Chrome بنجاح
  لكن فحوص الجاهزية تتسابق مع بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعداداً صحيحة موجبة حتى `120000` مللي ثانية؛ تُرفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائماً على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  `~` و`~/...` لدليل المنزل في نظام التشغيل لديك قبل تشغيل Chromium.
  يتم أيضاً توسيع التلدة في `userDataDir` لكل ملف تعريف على ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، الافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء Chromium المحلي (مثل
  `--disable-gpu`، أو تحجيم النافذة، أو أعلام التصحيح).

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

- `seamColor`: لون تمييز لإطار واجهة مستخدم التطبيق الأصلي (تدرج فقاعة Talk Mode، إلخ).
- `assistant`: تجاوز هوية واجهة التحكم. يعود إلى هوية الوكيل النشط.

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
      url: "ws://gateway.tailnet:18789",
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
      // Remove tools from the default HTTP deny list
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

<Accordion title="تفاصيل حقول Gateway">

- `mode`: `local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway البدء ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الإرسال لـ WS + HTTP. ترتيب الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto` أو `loopback` (الافتراضي) أو `lan` (`0.0.0.0`) أو `tailnet` (عنوان IP لـ Tailscale فقط) أو `custom`.
- **أسماء الربط القديمة البديلة**: استخدم قيم وضع الربط في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء المضيف البديلة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع ربط `loopback` الافتراضي على `127.0.0.1` داخل الحاوية. مع شبكات Docker الجسرية (`-p 18789:18789`)، تصل حركة المرور على `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو عيّن `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات الربط غير `loopback` مصادقة Gateway. عمليًا، يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلاً عكسيًا واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد رمزًا افتراضيًا.
- إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فعيّن `gateway.auth.mode` صراحةً إلى `token` أو `password`. تفشل تدفقات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مكوّنًا ويكون الوضع غير معيّن.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ وهذا غير معروض عمدًا في مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي واعٍ بالهوية وثق بترويسات الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر وكيل **غير loopback** افتراضيًا؛ تتطلب الوكلاء العكسية على `loopback` على المضيف نفسه تعيينًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`. يمكن للمنادين الداخليين على المضيف نفسه استخدام `gateway.auth.password` كخيار احتياطي محلي مباشر؛ يظل `gateway.auth.token` متعارضًا تبادليًا مع وضع الوكيل الموثوق.
- `gateway.auth.allowTailscale`: عند `true`، يمكن لترويسات هوية Tailscale Serve تلبية مصادقة واجهة التحكم/WebSocket (مع التحقق عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale هذه؛ بل تتبع بدلًا من ذلك وضع مصادقة HTTP العادي لـ Gateway. يفترض هذا التدفق بلا رموز أن مضيف Gateway موثوق. تكون القيمة الافتراضية `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات المصادقة الفاشلة. يُطبّق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع السر المشترك ورمز الجهاز بشكل مستقل). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار واجهة التحكم غير المتزامن لـ Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تفعّل المحدد عند الطلب الثاني بدلًا من أن تمر كلتاهما كعدم تطابق عادي.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ عيّنها إلى `false` عندما تريد عمدًا تقييد حركة localhost أيضًا (لإعدادات الاختبار أو نشر الوكيل الصارم).
- تُقيَّد دائمًا محاولات مصادقة WS الصادرة من أصل متصفح مع تعطيل إعفاء `loopback` (دفاع متعمق ضد القوة الغاشمة على localhost من المتصفح).
- على `loopback`، تُعزل عمليات القفل الصادرة من المتصفح لكل قيمة `Origin`
  مُطبَّعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: `serve` (tailnet فقط، ربط loopback) أو `funnel` (عام، يتطلب مصادقة).
- `tailscale.preserveFunnel`: عند `true` ومع `tailscale.mode = "serve"`، يتحقق OpenClaw
  من `tailscale funnel status` قبل إعادة تطبيق Serve عند بدء التشغيل ويتخطاه
  إذا كان مسار Funnel مكوّنًا خارجيًا يغطي بالفعل منفذ Gateway.
  القيمة الافتراضية `false`.
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات WebSocket مع Gateway. مطلوبة عندما يُتوقع وجود عملاء متصفح من أصول غير `loopback`.
- `controlUi.chatMessageMaxWidth`: عرض أقصى اختياري لرسائل دردشة واجهة التحكم المجمّعة. يقبل قيم عرض CSS مقيّدة مثل `960px` و`82%` و`min(1280px, 82%)` و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع إلى أصل ترويسة Host للنشرات التي تعتمد عمدًا على سياسة أصل ترويسة Host.
- `remote.transport`: `ssh` (الافتراضي) أو `direct` (ws/wss). عند `direct`، يجب أن تكون `remote.url` هي `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ في بيئة عملية العميل
  يسمح بـ `ws://` بنص عادي إلى عناوين IP موثوقة على شبكة خاصة؛ يظل الافتراضي
  هو loopback فقط للنص العادي. لا يوجد مكافئ في `openclaw.json`،
  ولا تؤثر إعدادات الشبكة الخاصة للمتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` في عملاء WebSocket
  لـ Gateway.
- `gateway.remote.token` / `.password` هي حقول اعتماد للعميل البعيد. لا تكوّن مصادقة Gateway بذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان URL أساسي عبر HTTPS للمرحل الخارجي لـ APNs المستخدم بواسطة إصدارات iOS الرسمية/TestFlight بعد نشرها التسجيلات المدعومة بالمرحل إلى Gateway. يجب أن يطابق هذا العنوان عنوان المرحل المضمّن في بنية iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة إرسال Gateway إلى المرحل بالمللي ثانية. القيمة الافتراضية `10000`.
- تُفوَّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال بنطاق التسجيل إلى Gateway. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئية مؤقتة لإعداد المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب للتطوير فقط لعناوين مرحل HTTP على loopback. يجب أن تبقى عناوين مرحل الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة WebSocket قبل المصادقة لـ Gateway بالمللي ثانية. الافتراضي: `15000`. تكون لـ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` أولوية عند تعيينها. زد هذه القيمة على المضيفات المحملة أو منخفضة الطاقة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال إحماء بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القناة بالدقائق. عيّن `0` لتعطيل إعادات تشغيل مراقبة الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس الخامل بالدقائق. أبقِها أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقبة الصحة لكل قناة/حساب خلال ساعة متدحرجة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: إلغاء اشتراك لكل قناة في إعادات تشغيل مراقبة الصحة مع إبقاء المراقب العالمي مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند تعيينه، تكون له أولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما تكون `gateway.auth.*` غير معيّنة.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يتم حلّه، يفشل الحل مغلقًا (بلا إخفاء عبر رجوع بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين التي تنهي TLS أو تحقن ترويسات العميل المُمرَّرة. أدرج فقط الوكلاء الذين تتحكم بهم. تظل إدخالات loopback صالحة لإعدادات الوكيل على المضيف نفسه/الكشف المحلي (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عند `true`، يقبل Gateway ترويسة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. الافتراضي `false` لسلوك يفشل مغلقًا.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح CIDR/IP اختيارية للموافقة التلقائية على إقران جهاز عقدة لأول مرة بلا نطاقات مطلوبة. تكون معطلة عند عدم تعيينها. لا يوافق هذا تلقائيًا على إقران المشغل/المتصفح/واجهة التحكم/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/منع عام لأوامر العقدة المعلنة بعد الإقران وتقييم قائمة سماح المنصة. استخدم `allowCommands` للاشتراك في أوامر عقدة خطيرة مثل `camera.snap` و`camera.clip` و`screen.record`؛ يزيل `denyCommands` أمرًا حتى لو كان افتراض منصة أو سماح صريح سيتضمنه بخلاف ذلك. بعد أن تغيّر عقدة قائمة أوامرها المعلنة، ارفض إقران ذلك الجهاز وأعد الموافقة عليه حتى يخزن Gateway لقطة الأوامر المحدّثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (يوسّع قائمة المنع الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة منع HTTP الافتراضية.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- إكمالات الدردشة: معطلة افتراضيًا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- واجهة Responses API: `gateway.http.endpoints.responses.enabled`.
- تقوية إدخال عناوين URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامَل قوائم السماح الفارغة كأنها غير معيّنة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب عناوين URL.
- ترويسة تقوية استجابة اختيارية:
  - `gateway.http.securityHeaders.strictTransportSecurity` (عيّنها فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد بمنافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام تسهيلية: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [بوابات متعددة](/ar/gateway/multiple-gateways).

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
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محلي موقّع ذاتيًا عندما لا تكون الملفات الصريحة مكوّنة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف مفتاح TLS الخاص؛ أبقه مقيّد الأذونات.
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
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية بدون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخنة أولًا؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: مدة قصوى اختيارية بالمللي ثانية للانتظار حتى تكتمل العمليات الجارية قبل فرض إعادة تشغيل أو إعادة تحميل ساخنة للقناة. احذفها لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ عيّنها إلى `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية بأن العمليات ما زالت معلقة.

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
تُرفض رموز hook الممررة عبر سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` قيمة غير فارغة في `hooks.token`.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ تُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (على سبيل المثال `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` بقالب، فعيّن `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في التعيين المعروضة من قالب على أنها مقدمة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثال: `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تُرجع إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا وأن يبقى ضمن `hooks.transformsDir` (تُرفض المسارات المطلقة واجتياز المسارات).
  - أبقِ `hooks.transformsDir` ضمن `~/.openclaw/hooks/transforms`؛ تُرفض أدلة Skills في مساحة العمل. إذا أبلغ `openclaw doctor` أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات hooks أو أزل `hooks.transformsDir`.
- يوجه `agentId` إلى وكيل محدد؛ تعود المعرفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو محذوف = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook دون `sessionKey` صريح.
- `allowRequestSessionKey`: يسمح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` بقالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ القيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` نموذج LLM لتشغيل hook هذا (يجب السماح به إذا تم تعيين كتالوج النماذج).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المضمن `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فعيّن `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لتطابق مساحة أسماء Gmail، على سبيل المثال `["hook:", "hook:gmail:"]`.
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

- يبدأ Gateway تلقائيًا `gog gmail watch serve` عند الإقلاع عند تكوينه. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغل `gog gmail watch serve` منفصلًا بجانب Gateway.

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

- يقدم HTML/CSS/JS القابلة للتحرير بواسطة الوكيل وA2UI عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الارتباطات غير loopback: تتطلب مسارات اللوحة مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل Node WebViews عادةً رؤوس المصادقة؛ بعد إقران node واتصالها، يعلن Gateway عن عناوين URL للقدرات محددة النطاق للـ node للوصول إلى اللوحة/A2UI.
- ترتبط عناوين URL للقدرات بجلسة WS النشطة الخاصة بـ node وتنتهي صلاحيتها بسرعة. لا يُستخدم الرجوع المستند إلى IP.
- يحقن عميل إعادة التحميل الحي في HTML المقدّم.
- ينشئ تلقائيًا ملف `index.html` بادئًا عندما يكون فارغًا.
- يقدم أيضًا A2UI عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
- عطّل إعادة التحميل الحي للأدلة الكبيرة أو أخطاء `EMFILE`.

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

- `minimal` (الافتراضي عندما يكون Plugin `bonjour` المضمن ممكّنًا): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` + `sshPort`؛ ما زال إعلان البث المتعدد عبر LAN يتطلب تمكين Plugin `bonjour` المضمن.
- `off`: يمنع إعلان البث المتعدد عبر LAN دون تغيير تمكين Plugin.
- يبدأ Plugin `bonjour` المضمن تلقائيًا على مضيفي macOS ويكون اختياريًا على Linux وWindows ونشرات Gateway المعبأة في حاويات.
- يكون اسم المضيف افتراضيًا هو اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### النطاق الواسع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية البث تحت `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، اقرنها بخادم DNS (يوصى بـ CoreDNS) + Tailscale split DNS.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` (متغيرات بيئة مضمنة)

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

- لا تُطبّق متغيرات البيئة المضمنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` (لا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول لديك.
- راجع [البيئة](/ar/help/environment) لمعرفة أسبقية الإعدادات الكاملة.

### استبدال متغيرات البيئة

أشِر إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تتم مطابقة الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى طرح خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للهروب للحصول على القيمة الحرفية `${VAR}`.
- يعمل مع `$include`.

---

## الأسرار

مراجع الأسرار إضافية: تظل قيم النص الصريح تعمل.

### `SecretRef`

استخدم شكل كائن واحد:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- نمط معرّف `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- معرّف `source: "file"`: مؤشر JSON مطلق (على سبيل المثال `"/providers/openai/apiKey"`)
- نمط معرّف `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار مفصولة بشرطة مائلة هي `.` أو `..` (على سبيل المثال يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة الرسمية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُضمّن مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### إعداد موفري الأسرار

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

- يدعم موفر `file` الوضع `mode: "json"` والوضع `mode: "singleValue"` (يجب أن يكون `id` هو `"value"` في وضع singleValue).
- تفشل مسارات موفرَي file وexec بإغلاق آمن عندما لا يتوفر التحقق من Windows ACL. عيّن `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب موفر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيًا، تُرفض مسارات أوامر symlink. عيّن `allowSymlinkCommand: true` للسماح بمسارات symlink مع التحقق من مسار الهدف بعد الحل.
- إذا تم إعداد `trustedDirs`، ينطبق فحص الدليل الموثوق على مسار الهدف بعد الحل.
- تكون بيئة العملية الفرعية لـ `exec` بالحد الأدنى افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار عند وقت التنشيط إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب اللقطة فقط.
- ينطبق ترشيح السطح النشط أثناء التنشيط: تفشل المراجع غير المحلولة على الأسطح الممكّنة في بدء التشغيل/إعادة التحميل، بينما يتم تخطي الأسطح غير النشطة مع تشخيصات.

---

## تخزين المصادقة

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- تُخزّن ملفات التعريف الخاصة بكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` المراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست تنسيق وقت تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات تعريف مفاتيح API رسمية بصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- لا تدعم ملفات التعريف بوضع OAuth (`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملف تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ وتُمسح إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- تُستورد بيانات OAuth القديمة من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك وقت تشغيل الأسرار وأدوات `audit/configure/apply`: [إدارة الأسرار](/ar/gateway/secrets).

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

- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). قد يظل نص الفوترة الصريح يصل إلى هنا حتى في استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزوّد تبقى محصورة في نطاق المزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). تبقى رسائل نافذة استخدام HTTP `402` القابلة لإعادة المحاولة أو رسائل حد إنفاق المؤسسة/مساحة العمل في مسار `rate_limit` بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات لنمو تراجع الفوترة الأسي (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لدورات تبديل ملفات تعريف المصادقة لدى المزوّد نفسه لأخطاء فرط التحميل قبل الانتقال إلى بديل النموذج (الافتراضي: `1`). تصل أشكال انشغال المزوّد مثل `ModelNotReadyException` إلى هنا.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف محمّل فوق طاقته (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لدورات تبديل ملفات تعريف المصادقة لدى المزوّد نفسه لأخطاء حد المعدل قبل الانتقال إلى بديل النموذج (الافتراضي: `1`). يتضمن دلو حد المعدل هذا نصوصًا بصياغة المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

---

## تسجيل السجلات

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
- عيّن `logging.file` لاستخدام مسار ثابت.
- يرتفع `consoleLevel` إلى `debug` عند استخدام `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل النشط بالبايت قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 ميغابايت). يحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقمة بجانب الملف النشط.
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونصوص محاضر الجلسات المحفوظة. يعطّل `redactSensitive: "off"` سياسة السجلات/المحاضر العامة هذه فقط؛ أما أسطح أمان الواجهة/الأدوات/التشخيصات فلا تزال تحجب الأسرار قبل الإرسال.

---

## التشخيصات

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

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
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
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

- `enabled`: مفتاح التبديل الرئيسي لمخرجات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات التي تفعّل مخرجات سجلات موجهة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر انعدام التقدم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل على أنها `session.long_running` أو `session.stalled` أو `session.stuck`. تؤدي الردود والأدوات والحالة والكتل وتقدم ACP إلى إعادة ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت بلا تغيير.
- `stuckSessionAbortMs`: عتبة عمر انعدام التقدم بالمللي ثانية قبل أن يصبح العمل النشط المتوقف مؤهلًا للتفريغ بالإيقاف من أجل الاسترداد. عند عدم تعيينها، يستخدم OpenClaw نافذة تشغيل مضمّن ممتدة أكثر أمانًا لا تقل عن 10 دقائق و5 أضعاف `stuckSessionWarnMs`.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`). للاطلاع على التكوين الكامل وفهرس الإشارات ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع المستخدم في تصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بكل إشارة. عند تعيينها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: رؤوس بيانات تعريف HTTP/gRPC إضافية تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبعات أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات التتبع `0`-`1`.
- `otel.flushIntervalMs`: فاصل تفريغ القياسات الدورية بالمللي ثانية.
- `otel.captureContent`: التقاط اختياري للمحتوى الخام لسمات امتداد OTEL. يكون معطلًا افتراضيًا. يلتقط Boolean `true` محتوى الرسائل/الأدوات غير النظامي؛ أما صيغة الكائن فتتيح لك تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحةً.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح تبديل بيئة لسمات مزوّد امتدادات GenAI التجريبية الأحدث. تحتفظ الامتدادات افتراضيًا بسمة `gen_ai.system` القديمة للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح تبديل بيئة للمضيفين الذين سجّلوا مسبقًا SDK عامًّا لـ OpenTelemetry. يتخطى OpenClaw عندها بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بكل إشارة تُستخدم عندما يكون مفتاح التكوين المطابق غير معيّن.
- `cacheTrace.enabled`: تسجيل لقطات تتبع الذاكرة المؤقتة للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار إخراج JSONL لتتبع الذاكرة المؤقتة (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم فيما يُضمّن في مخرجات تتبع الذاكرة المؤقتة (كلها افتراضيًا: `true`).

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
- `auto.stableJitterHours`: نافذة توزيع إضافية بالساعات لطرح قناة stable (الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد مرات تشغيل فحوصات قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ عيّن `false` لإخفاء إمكانات إرسال ACP والإنشاء).
- `dispatch.enabled`: بوابة مستقلة لإرسال دور جلسة ACP (الافتراضي: `true`). عيّن `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف خلفية تشغيل ACP الافتراضي (يجب أن يطابق Plugin تشغيل ACP مسجلًا).
  ثبّت Plugin الخلفية أولًا، وإذا كان `plugins.allow` معيّنًا، فأدرج معرّف Plugin الخلفية (مثل `acpx`) وإلا فلن تُحمّل خلفية ACP.
- `defaultAgent`: معرّف الوكيل الهدف الاحتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح بمعرّفات الوكلاء المسموح بها لجلسات تشغيل ACP؛ تعني القائمة الفارغة عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: حجب أسطر الحالة/الأداة المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: يبث `"live"` تدريجيًا؛ أما `"final_only"` فيخزن مؤقتًا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف لأسطر حالة/تحديث ACP المسقطة.
- `stream.tagVisibility`: سجل بأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعمّال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري لتشغيله عند تهيئة بيئة تشغيل ACP.

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

- يتحكم `cli.banner.taglineMode` في نمط عبارة الشعار:
  - `"random"` (الافتراضي): عبارات متناوبة مرحة/موسمية.
  - `"default"`: عبارة ثابتة محايدة (`All your chats, one OpenClaw.`).
  - `"off"`: بلا نص عبارة (مع استمرار عرض عنوان/إصدار اللافتة).
- لإخفاء اللافتة بالكامل (وليس العبارات فقط)، عيّن متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية تكتبها تدفقات الإعداد الموجّهة عبر CLI (`onboard` و`configure` و`doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## الهوية

راجع حقول هوية `agents.list` ضمن [افتراضيات الوكيل](/ar/gateway/config-agents#agent-defaults).

---

## الجسر (قديم، مُزال)

لم تعد البُنى الحالية تتضمن جسر TCP. تتصل Nodes عبر WebSocket الخاص بالـ Gateway. لم تعد مفاتيح `bridge.*` جزءًا من مخطط التكوين (يفشل التحقق إلى أن تُزال؛ يمكن لـ `openclaw doctor --fix` حذف المفاتيح غير المعروفة).

<Accordion title="تكوين الجسر القديم (مرجع تاريخي)">

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
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. يتحكم أيضًا في تنظيف نصوص Cron المحذوفة المؤرشفة. الافتراضي: `24h`؛ اضبطه على `false` للتعطيل.
- `runLog.maxBytes`: الحجم الأقصى لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر المحتفَظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز الحامل المستخدم لتسليم POST الخاص بـ Cron Webhook (`delivery.mode = "webhook"`)، وإذا أُغفل فلن يُرسل ترويس مصادقة.
- `webhook`: عنوان URL قديم ومهمل لـ Webhook احتياطي (http/https) يُستخدم فقط للمهام المخزنة التي لا تزال تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادة المحاولة لمهام التشغيل لمرة واحدة عند حدوث أخطاء عابرة (الافتراضي: `3`؛ النطاق: `0`-`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة - `"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة المحاولة لكل الأنواع العابرة.

ينطبق فقط على مهام Cron ذات التشغيل لمرة واحدة. تستخدم المهام المتكررة معالجة فشل منفصلة.

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

- `enabled`: تفعيل تنبيهات الفشل لمهام Cron (الافتراضي: `false`).
- `after`: عدد حالات الفشل المتتالية قبل إطلاق تنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للمهمة نفسها (عدد صحيح غير سالب).
- `includeSkipped`: احتساب عمليات التشغيل المتخطاة المتتالية ضمن عتبة التنبيه (الافتراضي: `false`). تُتتبَّع عمليات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
- `mode`: وضع التسليم - يرسل `"announce"` عبر رسالة قناة؛ وينشر `"webhook"` إلى Webhook المُهيّأ.
- `accountId`: معرّف حساب أو قناة اختياري لتحديد نطاق تسليم التنبيه.

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

- الوجهة الافتراضية لإشعارات فشل Cron عبر كل المهام.
- `mode`: `"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلان. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب لوضع Webhook.
- `accountId`: تجاوز حساب اختياري للتسليم.
- يتجاوز `delivery.failureDestination` لكل مهمة هذا الافتراضي العام.
- عندما لا تُعيَّن وجهة فشل عامة ولا وجهة فشل لكل مهمة، تعود المهام التي تُسلّم بالفعل عبر `announce` إلى هدف الإعلان الأساسي ذاك عند الفشل.
- `delivery.failureDestination` مدعوم فقط للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتتبَّع تنفيذات Cron المعزولة بوصفها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

عناصر نائبة للقالب تُوسَّع في `tools.media.models[].args`:

| المتغير            | الوصف                                            |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (بلا أغلفة السجل/المرسل)               |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعة                    |
| `{{From}}`         | معرّف المرسل                                      |
| `{{To}}`           | معرّف الوجهة                                      |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID للجلسة الحالية                               |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                     |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                    |
| `{{MediaPath}}`    | مسار الوسائط المحلي                               |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)                   |
| `{{Transcript}}`   | نص التفريغ الصوتي                                 |
| `{{Prompt}}`       | مطالبة الوسائط المحلولة لإدخالات CLI              |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI    |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                        |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)                 |
| `{{SenderName}}`   | اسم عرض المرسل (بأفضل جهد)                        |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                       |
| `{{Provider}}`     | تلميح المزوّد (whatsapp، telegram، discord، وما إلى ذلك) |

---

## تضمينات الإعداد (`$include`)

قسّم الإعداد إلى ملفات متعددة:

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

- ملف واحد: يستبدل الكائن الحاوي.
- مصفوفة ملفات: تُدمج دمجًا عميقًا بالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (تتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبةً إلى الملف الذي يجري التضمين، لكن يجب أن تبقى داخل دليل الإعداد ذي المستوى الأعلى (`dirname` لـ `openclaw.json`). لا تُسمح صيغ المسارات المطلقة/`../` إلا عندما تظل تُحل داخل ذلك الحد.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى مدعومًا بتضمين ملف واحد تكتب عبره إلى ذلك الملف المضمّن. على سبيل المثال، يحدّث `plugins install` القسم `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` دون تغيير.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة تكون للقراءة فقط لعمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بإغلاق آمن بدل تسطيح الإعداد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعداد](/ar/gateway/configuration) · [أمثلة الإعداد](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [الإعداد](/ar/gateway/configuration)
- [أمثلة الإعداد](/ar/gateway/configuration-examples)
