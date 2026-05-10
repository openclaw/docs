---
read_when:
    - تحتاج إلى دلالات الإعدادات الدقيقة على مستوى الحقل أو القيم الافتراضية
    - تتحقق من صحة كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع تهيئة Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية والروابط إلى مراجع الأنظمة الفرعية المخصّصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-05-10T19:38:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع إعدادات النواة لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة للمهام، راجع [الإعدادات](/ar/gateway/configuration).

يغطي أسطح إعدادات OpenClaw الرئيسية، ويربط إلى مراجع خارجية عندما يكون لنظام فرعي مرجعه الأعمق الخاص. تعيش كتالوجات أوامر القنوات والـ plugin، ومفاتيح الذاكرة العميقة/QMD، في صفحاتها الخاصة بدلا من هذه الصفحة.

حقيقة الكود:

- يطبع `openclaw config schema` مخطط JSON الحي المستخدم للتحقق وواجهة التحكم، مع دمج بيانات الحزم/الـ plugin/القنوات الوصفية عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بالنطاق المساري لأدوات الاستكشاف التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس وثائق الإعدادات مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` المسمى `config.schema.lookup` للحصول على
وثائق وقيود دقيقة على مستوى الحقول قبل التعديلات. استخدم
[الإعدادات](/ar/gateway/configuration) للإرشاد الموجه للمهام وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*`، و`memory.qmd.*`، و`memory.citations`، وإعدادات Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر الحالية المضمنة + المحزمة
- صفحات القنوات/الـ plugin المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق الإعدادات هو **JSON5** (تُسمح التعليقات والفواصل اللاحقة). كل الحقول اختيارية - يستخدم OpenClaw قيما افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح إعدادات كل قناة إلى صفحة مخصصة - راجع
[الإعدادات - القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack، وDiscord، وTelegram، وWhatsApp، وMatrix، وiMessage، وقنوات أخرى
محزمة (المصادقة، التحكم في الوصول، تعدد الحسابات، بوابة الإشارات).

## افتراضيات الوكيل، وتعدد الوكلاء، والجلسات، والرسائل

انتقلت إلى صفحة مخصصة - راجع
[الإعدادات - الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، sandbox)
- `multiAgent.*` (توجيه تعدد الوكلاء والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التقليم)
- `messages.*` (تسليم الرسائل، TTS، عرض markdown)
- `talk.*` (وضع Talk)
  - `talk.consultThinkingLevel`: تجاوز مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استشارات Talk الفورية في واجهة التحكم
  - `talk.consultFastMode`: تجاوز لمرة واحدة لوضع السرعة لاستشارات Talk الفورية في واجهة التحكم
  - `talk.speechLocale`: معرف محلي اختياري وفق BCP 47 للتعرف على كلام Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم تعيينه، يحتفظ Talk بنافذة التوقف الافتراضية للمنصة قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)

## الأدوات والمزودون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وإعدادات الأدوات المدعومة بالمزودين، وإعداد
المزود المخصص / عنوان URL الأساسي إلى صفحة مخصصة - راجع
[الإعدادات - الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

توجد تعريفات المزودين، وقوائم السماح للنماذج، وإعداد المزود المخصص في
[الإعدادات - الأدوات والمزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
كما يملك جذر `models` سلوك كتالوج النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك كتالوج المزود (`merge` أو `replace`).
- `models.providers`: خريطة مزودين مخصصين مفهرسة بمعرف المزود.
- `models.providers.*.localService`: مدير عمليات اختياري عند الطلب من أجل
  خوادم النماذج المحلية. يفحص OpenClaw نقطة فحص الصحة المضبوطة، ويبدأ
  `command` المطلق عند الحاجة، وينتظر الجاهزية، ثم يرسل طلب النموذج.
  راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- `models.pricing.enabled`: يتحكم في تمهيد الأسعار الخلفي الذي
  يبدأ بعد وصول العمليات الجانبية والقنوات إلى مسار جاهزية Gateway. عندما يكون `false`،
  يتخطى Gateway جلب كتالوجات أسعار OpenRouter وLiteLLM؛ وتظل قيم
  `models.providers.*.models[].cost` المضبوطة تعمل لتقديرات التكلفة المحلية.

## MCP

توجد تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` وتستهلكها
Pi المضمنة ومحولات وقت التشغيل الأخرى. تدير أوامر `openclaw mcp list`،
و`show`، و`set`، و`unset` هذه الكتلة دون الاتصال بالخادم
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

- `mcp.servers`: تعريفات خوادم MCP المسماة، سواء stdio أو بعيدة، لبيئات وقت التشغيل التي
  تعرض أدوات MCP المضبوطة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  و`type: "http"` اسم بديل أصلي في CLI يقوم `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى حقل `transport` القياسي.
- `mcp.sessionIdleTtlMs`: مدة TTL للخمول لبيئات MCP المحزمة المحددة بنطاق الجلسة.
  تطلب عمليات التشغيل المضمنة لمرة واحدة تنظيف نهاية التشغيل؛ وهذه TTL هي خط الدفاع الأخير
  للجلسات طويلة العمر والمستدعين المستقبليين.
- تطبق التغييرات ضمن `mcp.*` فوريا عبر التخلص من بيئات MCP المؤقتة المخزنة للجلسات.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من الإعدادات الجديدة، ولذلك تُزال
  إدخالات `mcp.servers` المحذوفة فورا بدلا من انتظار TTL الخمول.

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

- `allowBundled`: قائمة سماح اختيارية للـ skills المحزمة فقط (لا تتأثر skills المدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور skills مشتركة إضافية (الأولوية الأدنى).
- `load.allowSymlinkTargets`: جذور أهداف حقيقية موثوقة يمكن أن
  تُحل روابط skills الرمزية إليها عندما يكون الرابط خارج جذر مصدره المضبوط.
- `install.preferBrew`: عند true، تفضيل مثبتات Homebrew عندما يكون `brew`
  متاحا قبل الرجوع إلى أنواع المثبتات الأخرى.
- `install.nodeManager`: تفضيل مثبت node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: السماح لعملاء Gateway الموثوقين `operator.admin`
  بتثبيت أرشيفات zip خاصة معدة عبر `skills.upload.*`
  (الافتراضي: false). هذا يفعّل مسار الأرشيفات المرفوعة فقط؛ ولا تتطلب
  تثبيتات ClawHub العادية ذلك.
- يعطل `entries.<skillKey>.enabled: false` skill حتى لو كانت محزمة/مثبتة.
- `entries.<skillKey>.apiKey`: اختصار لـ skills التي تعلن متغير بيئة رئيسيا (سلسلة نصية صريحة أو كائن SecretRef).

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

- تُحمّل من `~/.openclaw/extensions`، و`<workspace>/.openclaw/extensions`، بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف plugins أصلية لـ OpenClaw بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي بلا manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل gateway.**
- `allow`: قائمة سماح اختيارية (تُحمّل plugins المدرجة فقط). تتقدم `deny`.
- `bundledDiscovery`: تكون افتراضيا `"allowlist"` للإعدادات الجديدة، بحيث إن وجود
  `plugins.allow` غير فارغة يقيّد أيضا plugins المزودين المحزمة، بما في ذلك مزودو وقت تشغيل
  بحث الويب. يكتب Doctor القيمة `"compat"` لإعدادات قوائم السماح القديمة
  المهاجرة للحفاظ على سلوك مزودي الحزم الحالي إلى أن تختار الاشتراك.
- `plugins.entries.<id>.apiKey`: حقل اختصار لمفتاح API على مستوى plugin (عندما يدعمه plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة محددة بنطاق plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما يكون `false`، يمنع core `before_prompt_build` ويتجاهل الحقول التي تعدل prompt من `before_agent_start` القديمة، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق على hooks الخاصة بـ plugin الأصلية ودلائل hooks المقدمة من الحزم المدعومة.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما يكون `true`، يمكن لـ plugins غير المحزمة والموثوقة قراءة محتوى المحادثة الخام من hooks typed مثل `llm_input`، و`llm_output`، و`before_model_resolve`، و`before_agent_reply`، و`before_agent_run`، و`before_agent_finalize`، و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: الوثوق صراحة بهذا plugin لطلب تجاوزات `provider` و`model` لكل تشغيل من أجل تشغيلات subagent الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات subagent الموثوقة. استخدم `"*"` فقط عندما تريد عمدا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowModelOverride`: الوثوق صراحة بهذا plugin لطلب تجاوزات النماذج لـ `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات إكمال LLM الخاصة بـ plugin الموثوقة. استخدم `"*"` فقط عندما تريد عمدا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: الوثوق صراحة بهذا plugin لتشغيل `api.runtime.llm.complete` مقابل معرف وكيل غير افتراضي.
- `plugins.entries.<id>.config`: كائن إعدادات يحدده plugin (يتحقق منه مخطط plugin OpenClaw الأصلي عند توفره).
- تعيش إعدادات حساب/وقت تشغيل plugin القناة ضمن `channels.<id>` وينبغي أن تصفها بيانات `channelConfigs` الوصفية في manifest الخاص بالـ plugin المالك، لا سجل خيارات مركزي لـ OpenClaw.

### إعدادات plugin مشغل Codex

يملك plugin `codex` المحزم إعدادات مشغل خادم تطبيق Codex الأصلية ضمن
`plugins.entries.codex.config`. راجع
[مرجع مشغل Codex](/ar/plugins/codex-harness-reference) لسطح الإعدادات الكامل
و[مشغل Codex](/ar/plugins/codex-harness) لنموذج وقت التشغيل.

ينطبق `codexPlugins` فقط على الجلسات التي تختار مشغل Codex الأصلي.
ولا يفعّل plugins Codex لـ Pi، أو تشغيلات مزود OpenAI العادية، أو
ارتباطات محادثة ACP، أو أي مشغل غير Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

- `plugins.entries.codex.config.codexPlugins.enabled`: يمكّن دعم Plugin/app الأصلي
  لحزمة Codex harness. الافتراضي: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سياسة إجراءات التدمير الافتراضية لاستدعاءات تطبيقات Plugin المرحّلة.
  الافتراضي: `false`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: يمكّن إدخال Plugin
  مرحّلًا عندما يكون `codexPlugins.enabled` العام مفعّلًا أيضًا.
  الافتراضي: `true` للإدخالات الصريحة.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هوية marketplace ثابتة. يدعم V1 فقط `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هوية Plugin ثابتة
  من Codex ناتجة عن الترحيل، مثل `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  تجاوز سياسة إجراءات التدمير لكل Plugin. عند حذفه، تُستخدم قيمة
  `allow_destructive_actions` العامة.

`codexPlugins.enabled` هو توجيه التمكين العام. إدخالات Plugin الصريحة
التي يكتبها الترحيل هي مجموعة التثبيت وإصلاح الأهلية الدائمة.
`plugins["*"]` غير مدعوم، ولا يوجد مفتاح `install`، وقيم
`marketplacePath` المحلية ليست حقول إعدادات عمدًا لأنها
خاصة بالمضيف.

تُخزّن فحوص جاهزية `app/list` مؤقتًا لمدة ساعة واحدة وتُحدّث
بشكل غير متزامن عندما تصبح قديمة. تُحتسب إعدادات تطبيقات سلسلة Codex عند
إنشاء جلسة Codex harness، وليس في كل دورة؛ استخدم `/new` أو `/reset` أو إعادة تشغيل
Gateway بعد تغيير إعدادات Plugin الأصلية.

- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزوّد جلب الويب Firecrawl.
  - `apiKey`: مفتاح Firecrawl API (يقبل SecretRef). يرجع إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ Firecrawl API (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخرج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: أقصى عمر للتخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الاستخراج بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث Grok على الويب).
  - `enabled`: فعّل مزوّد X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) لمعرفة المراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: إيقاع Cron لكل مسح Dreaming كامل (`"0 3 * * *"` افتراضيًا).
  - `model`: تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه بـ `allowedModels` لتقييد الأهداف. أخطاء عدم توفر النموذج تعيد المحاولة مرة واحدة باستخدام النموذج الافتراضي للجلسة؛ ولا ترجع إخفاقات الثقة أو قائمة السماح بصمت.
  - سياسة المراحل والعتبات هي تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أن تساهم Plugins حزمة Claude المفعّلة أيضًا بافتراضيات Pi مضمّنة من `settings.json`؛ يطبّق OpenClaw هذه كإعدادات وكيل منظّفة، وليس كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرف Plugin محرك السياق النشط؛ الافتراضي هو `"legacy"` ما لم تثبّت محركًا آخر وتحدده.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يستطيع OpenClaw اكتشاف طلبات المتابعة من أدوار المحادثة وتسليمها عبر تشغيلات Heartbeat.

- `commitments.enabled`: فعّل الاستخراج المخفي بواسطة LLM والتخزين وتسليم Heartbeat لالتزامات المتابعة المستنتجة. الافتراضي: `false`.
- `commitments.maxPerDay`: الحد الأقصى لالتزامات المتابعة المستنتجة التي تُسلّم لكل جلسة وكيل في يوم متحرك. الافتراضي: `3`.

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

- يعطّل `evaluateEnabled: false` كلًا من `act:evaluate` و`wait --fn`.
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد مدة الخمول أو عندما
  تتجاوز الجلسة حدها الأقصى. اضبط `idleMinutes: 0` أو `maxTabsPerSession: 0` من أجل
  تعطيل أوضاع التنظيف الفردية هذه.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا عند عدم تعيينه، لذلك يبقى تنقل المتصفح صارمًا افتراضيًا.
- عيّن `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا بتنقل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات CDP الشخصية البعيدة (`profiles.*.cdpUrl`) للحظر نفسه للشبكة الخاصة أثناء فحوص إمكانية الوصول/الاكتشاف.
- يبقى `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم بديل قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- الملفات الشخصية البعيدة مخصصة للإرفاق فقط (بدء/إيقاف/إعادة تعيين معطّلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يوفر لك مزودك عنوان URL مباشرًا لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على إمكانية الوصول إلى CDP البعيد و
  `attachOnly` بالإضافة إلى طلبات فتح علامات التبويب. تحتفظ ملفات local loopback
  المُدارة بافتراضيات CDP المحلية.
- إذا كانت خدمة CDP مُدارة خارجيًا ويمكن الوصول إليها عبر loopback، فعيّن
  `attachOnly: true` لذلك الملف الشخصي؛ وإلا فسيتعامل OpenClaw مع منفذ loopback كملف
  متصفح محلي مُدار وقد يبلغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات `existing-session` الشخصية Chrome MCP بدلًا من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات `existing-session` الشخصية تعيين `userDataDir` لاستهداف ملف شخصي معين
  لمتصفح مبني على Chromium مثل Brave أو Edge.
- تحتفظ ملفات `existing-session` الشخصية بحدود توجيه Chrome MCP الحالية:
  إجراءات مدفوعة بلقطات/مراجع بدلًا من الاستهداف بمحددات CSS، وخطافات رفع ملف واحد،
  وعدم وجود تجاوزات لمهلة الحوارات، وعدم وجود `wait --load networkidle`، وعدم وجود
  `responsebody` أو تصدير PDF أو اعتراض تنزيلات أو إجراءات دفعية.
- تعيّن ملفات `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائيًا؛ لا
  تعيّن `cdpUrl` صراحةً إلا لـ CDP البعيد.
- يمكن للملفات الشخصية المحلية المُدارة تعيين `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف الشخصي. استخدم هذا لتشغيل ملف شخصي
  في Chrome وآخر في Brave.
- تستخدم الملفات الشخصية المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية، و`browser.localCdpReadyTimeoutMs` لجاهزية websocket الخاصة بـ CDP
  بعد الإطلاق. ارفع القيمتين على المضيفات الأبطأ حيث يبدأ Chrome بنجاح
  لكن فحوص الجاهزية تتسابق مع بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعدادًا صحيحة موجبة حتى `120000` مللي ثانية؛ تُرفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنيًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  الرمز `~` و`~/...` لدليل المنزل في نظام التشغيل قبل إطلاق Chromium.
  كما يوسّع `userDataDir` لكل ملف شخصي في ملفات `existing-session` الشخصية عند استخدام التلدة.
- خدمة التحكم: loopback فقط (منفذ مشتق من `gateway.port`، الافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء Chromium المحلي (مثل
  `--disable-gpu` أو ضبط حجم النافذة أو أعلام التصحيح).

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

- `seamColor`: لون التمييز لواجهة تطبيق native app UI chrome (تلوين فقاعة Talk Mode، وما شابه).
- `assistant`: تجاوز هوية واجهة التحكم. يرجع إلى هوية الوكيل النشط.

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

- `mode`: `local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway بدء التشغيل ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الإرسال لـ WS + HTTP. ترتيب الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto` أو `loopback` (الافتراضي) أو `lan` (`0.0.0.0`) أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط) أو `custom`.
- **أسماء bind المستعارة القديمة**: استخدم قيم وضع bind في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`) وليس أسماء المضيف المستعارة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. مع شبكة جسر Docker (`-p 18789:18789`)، تصل الزيارات على `eth0`، لذلك لا يمكن الوصول إلى Gateway. استخدم `--network host`، أو عيّن `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات bind غير `loopback` مصادقة Gateway. عمليًا، يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلًا عكسيًا مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد رمزًا افتراضيًا.
- إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. تفشل مسارات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مكوّنًا والوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ هذا غير معروض عمدًا في مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي مدرك للهوية وثِق بترويسات الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع افتراضيًا مصدر وكيل **غير `loopback`**؛ تتطلب الوكلاء العكسية `loopback` على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`. يمكن للمتصلين الداخليين من المضيف نفسه استخدام `gateway.auth.password` كخيار محلي مباشر احتياطي؛ يظل `gateway.auth.token` متعارضًا مع وضع `trusted-proxy`.
- `gateway.auth.allowTailscale`: عند `true`، يمكن لترويسات هوية Tailscale Serve أن تفي بمصادقة واجهة التحكم/WebSocket (بعد التحقق عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway بدلًا من ذلك. يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. تكون القيمة الافتراضية `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدِّد اختياري لمحاولات المصادقة الفاشلة. يُطبّق لكل عنوان IP عميل ولكل نطاق مصادقة (يُتتبع السر المشترك ورمز الجهاز بشكل مستقل). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار واجهة التحكم غير المتزامن عبر Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تُفعّل المحدِّد في الطلب الثاني بدلًا من أن يمر كلاهما كتطابقين فاشلين عاديين.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمدًا تحديد معدل زيارات localhost أيضًا (لإعدادات الاختبار أو نشر الوكلاء الصارم).
- تُقيَّد دائمًا محاولات مصادقة WS ذات أصل المتصفح مع تعطيل إعفاء `loopback` (دفاعًا متعمقًا ضد محاولات القوة الغاشمة المستندة إلى المتصفح على localhost).
- على `loopback`، تُعزل عمليات القفل هذه ذات أصل المتصفح لكل قيمة `Origin`
  مطبّعة، لذا لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: `serve` (داخل tailnet فقط، مع bind على `loopback`) أو `funnel` (عام، ويتطلب مصادقة).
- `tailscale.preserveFunnel`: عند `true` ومع `tailscale.mode = "serve"`، يتحقق OpenClaw
  من `tailscale funnel status` قبل إعادة تطبيق Serve عند بدء التشغيل ويتخطى
  ذلك إذا كان مسار Funnel مكوّن خارجيًا يغطي منفذ Gateway بالفعل.
  القيمة الافتراضية `false`.
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. مطلوبة عندما يُتوقع وجود عملاء متصفح من أصول غير `loopback`.
- `controlUi.chatMessageMaxWidth`: حد أقصى اختياري للعرض لرسائل دردشة واجهة التحكم المجمّعة. يقبل قيم عرض CSS مقيدة مثل `960px` و`82%` و`min(1280px, 82%)` و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يمكّن الرجوع إلى أصل ترويسة Host لعمليات النشر التي تعتمد عمدًا على سياسة أصل ترويسة Host.
- `remote.transport`: `ssh` (الافتراضي) أو `direct` (ws/wss). عند استخدام `direct`، يجب أن تكون `remote.url` إما `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ في بيئة عملية العميل
  يسمح بـ `ws://` غير المشفر إلى عناوين IP موثوقة ضمن الشبكة الخاصة؛ يظل الافتراضي
  مقصورًا على `loopback` للنص الصريح. لا يوجد مكافئ في `openclaw.json`،
  كما أن تكوين الشبكة الخاصة للمتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` لا يؤثر في عملاء Gateway
  WebSocket.
- `gateway.remote.token` / `.password` حقول اعتماد للعميل البعيد. لا تقوم بتكوين مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان URL أساسي عبر HTTPS لمرحل APNs الخارجي الذي تستخدمه إصدارات iOS الرسمية/TestFlight بعد نشرها تسجيلات مدعومة بالمرحل إلى Gateway. يجب أن يطابق عنوان URL هذا عنوان المرحل المضمّن في بناء iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالمللي ثانية. القيمة الافتراضية `10000`.
- تُفوَّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر إلى Gateway منحة إرسال محددة بنطاق التسجيل. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئة مؤقتة لتكوين المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: مخرج مخصص للتطوير فقط لعناوين URL الخاصة بمرحلات HTTP على `loopback`. يجب أن تبقى عناوين URL الخاصة بمرحلات الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة Gateway WebSocket قبل المصادقة بالمللي ثانية. الافتراضي: `15000`. يأخذ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأولوية عند ضبطه. زد هذه القيمة على المضيفين المحمّلين أو منخفضي القدرة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال تمهيد بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القناة بالدقائق. اضبطه على `0` لتعطيل إعادة تشغيل مراقبة الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس المتقادم بالدقائق. أبقِ هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لعمليات إعادة تشغيل مراقبة الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات تشغيل مراقبة الصحة مع إبقاء المراقب العالمي مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند ضبطه، تكون له الأولوية على تجاوز مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلي استخدام `gateway.remote.*` كاحتياطي فقط عندما تكون `gateway.auth.*` غير مضبوطة.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يُحل، يفشل الحل بإغلاق آمن (من دون أن يخفيه احتياطي بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين الذين ينهون TLS أو يحقنون ترويسات العميل المعاد توجيهها. أدرج فقط الوكلاء الذين تتحكم بهم. تظل إدخالات `loopback` صالحة لإعدادات الوكيل/الاكتشاف المحلي على المضيف نفسه (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات `loopback` مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عند `true`، يقبل Gateway ترويسة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. الافتراضي `false` لسلوك الإغلاق الآمن عند الفشل.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح اختيارية بنطاقات CIDR/IP للموافقة التلقائية على اقتران جهاز Node لأول مرة من دون نطاقات مطلوبة. تكون معطلة عندما لا تُضبط. لا يوافق هذا تلقائيًا على اقتران المشغل/المتصفح/واجهة التحكم/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل عام للسماح/الرفض لأوامر Node المعلنة بعد الاقتران وتقييم قائمة سماح المنصة. استخدم `allowCommands` للاشتراك في أوامر Node الخطرة مثل `camera.snap` و`camera.clip` و`screen.record`؛ يزيل `denyCommands` أمرًا حتى لو كان افتراضي المنصة أو السماح الصريح سيشمله بخلاف ذلك. بعد أن يغيّر Node قائمة أوامره المعلنة، ارفض اقتران ذلك الجهاز وأعد الموافقة عليه ليخزن Gateway لقطة الأوامر المحدّثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لطلب HTTP `POST /tools/invoke` (توسّع قائمة الرفض الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة رفض HTTP الافتراضية.

</Accordion>

### نقاط نهاية متوافقة مع OpenAI

- Chat Completions: معطلة افتراضيًا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- تقوية إدخال عناوين URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة كما لو أنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب عناوين URL.
- ترويسة اختيارية لتقوية الاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد بمنافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام مريحة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، `--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [Gateways متعددة](/ar/gateway/multiple-gateways).

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
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محليًا موقّعًا ذاتيًا عندما لا تكون الملفات الصريحة مكوّنة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص TLS؛ أبقِ الأذونات مقيّدة.
- `caPath`: مسار اختياري لحزمة CA للتحقق من العميل أو سلاسل الثقة المخصصة.

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

- `mode`: يتحكم في كيفية تطبيق تعديلات التكوين أثناء وقت التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد دائمًا تشغيل عملية Gateway عند تغيير التكوين.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة التشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخن أولًا؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات التكوين (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى الاختياري للوقت بالمللي ثانية لانتظار العمليات قيد التنفيذ قبل فرض إعادة تشغيل أو إعادة تحميل ساخنة للقناة. احذفه لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ اضبطه على `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية لما لا يزال معلقًا.

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
يتم رفض رموز hook المميزة في سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` قيمة غير فارغة لـ `hooks.token`.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ ويُرفض إعادة استخدام رمز Gateway المميز.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (على سبيل المثال `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` بقالب، فعيّن `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك.

**نقاط النهاية:**

- `POST /hooks/wake` ← `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` ← `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` ← يتم حله عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في التعيين المعروضة من القالب كقيم مقدمة خارجيًا، وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` ← `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تُرجع إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا وأن يبقى داخل `hooks.transformsDir` (تُرفض المسارات المطلقة والتنقل خارج المسار).
  - أبقِ `hooks.transformsDir` تحت `~/.openclaw/hooks/transforms`؛ تُرفض أدلة Skills في مساحة العمل. إذا أبلغ `openclaw doctor` أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات hooks أو أزل `hooks.transformsDir`.
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الإغفال = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook بدون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` بقالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ وتكون قيمة `channel` الافتراضية `last`.
- يتجاوز `model` نموذج LLM لتشغيل hook هذا (يجب أن يكون مسموحًا به إذا تم تعيين كتالوج النماذج).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المدمج `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فعيّن `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` ليتطابق مع مساحة أسماء Gmail، على سبيل المثال `["hook:", "hook:gmail:"]`.
- إذا كنت تحتاج إلى `hooks.allowRequestSessionKey: false`، فتجاوز الإعداد المسبق باستخدام `sessionKey` ثابت بدلًا من الافتراضي القائم على القالب.

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

- يبدأ Gateway تلقائيًا تشغيل `gog gmail watch serve` عند الإقلاع عند تكوينه. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلًا بجانب Gateway.

---

## مضيف Plugin Canvas

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

- يقدّم HTML/CSS/JS وA2UI القابلة للتحرير بواسطة الوكيل عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الارتباطات غير loopback: تتطلب مسارات canvas مصادقة Gateway (رمز مميز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- عادةً لا ترسل WebViews في Node ترويسات مصادقة؛ بعد إقران عقدة واتصالها، يعلن Gateway عن عناوين URL للإمكانات محددة النطاق للعقدة للوصول إلى canvas/A2UI.
- ترتبط عناوين URL للإمكانات بجلسة WS للعقدة النشطة وتنتهي صلاحيتها بسرعة. لا يُستخدم الرجوع المستند إلى عنوان IP.
- يحقن عميل إعادة التحميل المباشر في HTML المقدّم.
- ينشئ تلقائيًا ملف `index.html` أوليًا عند الفراغ.
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

- `minimal` (الافتراضي عند تمكين Plugin `bonjour` المدمج): حذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: تضمين `cliPath` + `sshPort`؛ ولا يزال الإعلان متعدد البث على LAN يتطلب تمكين Plugin `bonjour` المدمج.
- `off`: منع الإعلان متعدد البث على LAN دون تغيير تمكين Plugin.
- يبدأ Plugin `bonjour` المدمج تلقائيًا على مضيفي macOS، ويكون اختياريًا على Linux وWindows ونشرات Gateway الحاوية.
- يكون اسم المضيف افتراضيًا هو اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية البث تحت `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، اقرنه بخادم DNS (يوصى بـ CoreDNS) + DNS مقسم عبر Tailscale.

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
- ملفات `.env`: ملف `.env` في CWD + ‏`~/.openclaw/.env` (لا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول لديك.
- راجع [البيئة](/ar/help/environment) لمعرفة أسبقية القيم كاملة.

### استبدال متغيرات البيئة

أشر إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تتم مطابقة الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- المتغيرات المفقودة/الفارغة تؤدي إلى طرح خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للهروب للحصول على القيمة الحرفية `${VAR}`.
- يعمل مع `$include`.

---

## الأسرار

مراجع الأسرار إضافية: لا تزال قيم النص العادي تعمل.

### `SecretRef`

استخدم شكل كائن واحدًا:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `source: "env"` لمعرّف `id`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` لمعرّف `id`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط `source: "exec"` لمعرّف `id`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار مفصولة بشرطات مائلة تساوي `.` أو `..` (مثلًا يتم رفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة المرجعية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- يتم تضمين مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### إعدادات موفري الأسرار

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

- يدعم موفر `file` الوضعين `mode: "json"` و`mode: "singleValue"` (يجب أن يكون `id` مساويًا لـ `"value"` في وضع singleValue).
- تفشل مسارات موفري الملفات والتنفيذ بإغلاق آمن عندما لا يكون التحقق من ACL في Windows متاحًا. اضبط `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب موفر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول على stdin/stdout.
- افتراضيًا، تُرفض مسارات أوامر الروابط الرمزية. اضبط `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف الذي تم حله.
- إذا تم ضبط `trustedDirs`، فسيُطبَّق فحص الدليل الموثوق على مسار الهدف الذي تم حله.
- تكون بيئة عملية `exec` الفرعية محدودة افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار عند وقت التنشيط إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب اللقطة فقط.
- ينطبق ترشيح السطح النشط أثناء التنشيط: تؤدي المراجع غير المحلولة على الأسطح المفعّلة إلى فشل بدء التشغيل/إعادة التحميل، بينما يتم تخطي الأسطح غير النشطة مع تشخيصات.

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

- تُخزَّن الملفات التعريفية لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` المراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست صيغة وقت تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات تعريف API-key مرجعية بالصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- لا تدعم الملفات التعريفية بوضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملف تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ وتُزال إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
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

- `billingBackoffHours`: التراجع الأساسي بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). قد يصل نص الفوترة الصريح إلى هنا حتى مع استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزوّد تبقى محصورة في نطاق المزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). تبقى رسائل نافذة استخدام HTTP `402` القابلة لإعادة المحاولة أو رسائل حد إنفاق المؤسسة/مساحة العمل في مسار `rate_limit` بدلاً من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات لنمو تراجع الفوترة الأسي (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: التراجع الأساسي بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتبديلات ملف تعريف المصادقة لدى المزوّد نفسه لأخطاء التحميل الزائد قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). الأشكال التي تشير إلى انشغال المزوّد مثل `ModelNotReadyException` تصل إلى هنا.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تبديل مزوّد/ملف تعريف محمّل زائدًا (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتبديلات ملف تعريف المصادقة لدى المزوّد نفسه لأخطاء حد المعدل قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). يشمل ذلك حاوية حد المعدل نصوصًا ذات شكل خاص بالمزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل النشط بالبايت قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 MB). يحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقّمة بجانب الملف النشط.
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات الطرفية، وسجلات الملفات، وسجلات OTLP، ونصوص محاضر الجلسات المحفوظة. يؤدي `redactSensitive: "off"` فقط إلى تعطيل سياسة السجل/المحضر العامة هذه؛ أما أسطح أمان الواجهة/الأدوات/التشخيصات فما زالت تنقح الأسرار قبل الإرسال.

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

- `enabled`: مفتاح التفعيل الرئيسي لمخرجات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات التي تفعّل مخرجات سجل موجّهة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر عدم التقدم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل بوصفها `session.long_running` أو `session.stalled` أو `session.stuck`. تعيد الردود والأدوات والحالة والكتل وتقدم ACP ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت بلا تغيير.
- `stuckSessionAbortMs`: عتبة عمر عدم التقدم بالمللي ثانية قبل أن يصبح العمل النشط المتوقف المؤهل قابلاً للإيقاف والتصريف للتعافي. عند عدم ضبطها، يستخدم OpenClaw نافذة تشغيل مضمنة موسعة أكثر أمانًا لا تقل عن 10 دقائق و5 أضعاف `stuckSessionWarnMs`.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`). للاطلاع على التكوين الكامل، وكتالوج الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع من أجل تصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بكل إشارة. عند ضبطها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية HTTP/gRPC إضافية تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير الآثار أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات الآثار `0`-`1`.
- `otel.flushIntervalMs`: فاصل تفريغ القياسات الدورية بالمللي ثانية.
- `otel.captureContent`: التقاط محتوى خام اختياري لسمات امتداد OTEL. يكون معطلاً افتراضيًا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامي؛ ويتيح شكل الكائن تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحةً.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لسمات مزوّد امتداد GenAI التجريبية الأحدث. افتراضيًا، تحتفظ الامتدادات بسمة `gen_ai.system` القديمة للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفين الذين سجّلوا مسبقًا OpenTelemetry SDK عالميًا. يتخطى OpenClaw عندها بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة نقاط نهاية خاصة بالإشارة تُستخدم عندما يكون مفتاح التكوين المطابق غير مضبوط.
- `cacheTrace.enabled`: تسجيل لقطات تتبع التخزين المؤقت للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لملف JSONL لتتبع التخزين المؤقت (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم بما يُضمّن في مخرجات تتبع التخزين المؤقت (كلها افتراضيًا: `true`).

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
- `auto.stableJitterHours`: نافذة انتشار إضافية بالساعات لطرح قناة stable (الافتراضي: `12`؛ الحد الأقصى: `168`).
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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ اضبط `false` لإخفاء إمكانات إرسال ACP والتفريع).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسات ACP (الافتراضي: `true`). اضبط `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضي لتشغيل ACP (يجب أن يطابق Plugin تشغيل ACP مسجلاً).
  ثبّت Plugin الواجهة الخلفية أولاً، وإذا كان `plugins.allow` مضبوطًا، فأدرج معرّف Plugin الواجهة الخلفية (مثل `acpx`) وإلا فلن تُحمّل واجهة ACP الخلفية.
- `defaultAgent`: معرّف الوكيل الهدف الاحتياطي لـ ACP عندما لا تحدد التفريعات هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات تشغيل ACP؛ وتعني القائمة الفارغة عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: كبت أسطر الحالة/الأداة المتكررة في كل دور (الافتراضي: `true`).
- `stream.deliveryMode`: `"live"` يبث تدريجيًا؛ أما `"final_only"` فيخزن مؤقتًا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المُسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف في أسطر حالة/تحديث ACP المُسقطة.
- `stream.tagVisibility`: سجل من أسماء الوسوم إلى تجاوزات الرؤية المنطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة بقاء الخمول بالدقائق لعمّال جلسات ACP قبل أهلية التنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري للتشغيل عند تمهيد بيئة تشغيل ACP.

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

- يتحكم `cli.banner.taglineMode` في نمط العبارة الفرعية للشعار:
  - `"random"` (الافتراضي): عبارات فرعية مضحكة/موسمية بالتناوب.
  - `"default"`: عبارة فرعية محايدة ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: لا يوجد نص عبارة فرعية (ما زال عنوان/إصدار الشعار يظهران).
- لإخفاء الشعار بالكامل (وليس العبارات الفرعية فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية تكتبها تدفقات الإعداد الموجّه في CLI (`onboard`، `configure`، `doctor`):

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

راجع حقول الهوية `agents.list` ضمن [إعدادات الوكيل الافتراضية](/ar/gateway/config-agents#agent-defaults).

---

## الجسر (قديم، أُزيل)

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل Nodes عبر WebSocket الخاص بـ Gateway. لم تعد مفاتيح `bridge.*` جزءًا من مخطط التكوين (يفشل التحقق حتى تُزال؛ يمكن لـ `openclaw doctor --fix` حذف المفاتيح غير المعروفة).

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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. يتحكم أيضا في تنظيف نصوص Cron المؤرشفة المحذوفة. الافتراضي: `24h`؛ اضبطه على `false` للتعطيل.
- `runLog.maxBytes`: الحجم الأقصى لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر المحتفظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز حامل مستخدم لتسليم POST عبر Webhook الخاص بـ Cron (`delivery.mode = "webhook"`)، وإذا حُذف فلن تُرسل ترويسة مصادقة.
- `webhook`: عنوان URL احتياطي قديم مهمل لـ Webhook (http/https) يُستخدم فقط للمهام المخزنة التي لا تزال تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادة المحاولة للمهام لمرة واحدة عند حدوث أخطاء عابرة (الافتراضي: `3`؛ النطاق: `0`-`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة - `"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة المحاولة مع كل الأنواع العابرة.

ينطبق فقط على مهام Cron لمرة واحدة. تستخدم المهام المتكررة معالجة فشل منفصلة.

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
- `after`: عدد حالات الفشل المتتالية قبل إطلاق تنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للمهمة نفسها (عدد صحيح غير سالب).
- `includeSkipped`: احتساب عمليات التشغيل المتخطاة المتتالية ضمن حد التنبيه (الافتراضي: `false`). تُتتبع عمليات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
- `mode`: وضع التسليم - يرسل `"announce"` عبر رسالة قناة؛ وينشر `"webhook"` إلى Webhook المُعد.
- `accountId`: معرف حساب أو قناة اختياري لتقييد نطاق تسليم التنبيه.

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
- `mode`: `"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عندما تتوفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلان. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب لوضع Webhook.
- `accountId`: تجاوز حساب اختياري للتسليم.
- يتجاوز `delivery.failureDestination` لكل مهمة هذا الإعداد الافتراضي العام.
- عندما لا تُضبط وجهة فشل عامة ولا خاصة بالمهمة، تعود المهام التي تسلم بالفعل عبر `announce` إلى هدف الإعلان الأساسي ذاك عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتتبع عمليات تنفيذ Cron المعزولة كـ [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

العناصر النائبة للقالب الموسعة في `tools.media.models[].args`:

| المتغير           | الوصف                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (دون أغلفة السجل/المرسل)             |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعة                 |
| `{{From}}`         | معرف المرسل                                 |
| `{{To}}`           | معرف الوجهة                            |
| `{{MessageSid}}`   | معرف رسالة القناة                                |
| `{{SessionId}}`    | UUID الجلسة الحالية                              |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                 |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                          |
| `{{MediaPath}}`    | مسار الوسائط المحلي                                  |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)               |
| `{{Transcript}}`   | نص تفريغ الصوت                                  |
| `{{Prompt}}`       | مطالبة الوسائط المحلولة لإدخالات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI         |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (حسب أفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (حسب أفضل جهد)               |
| `{{SenderName}}`   | اسم عرض المرسل (حسب أفضل جهد)                 |
| `{{SenderE164}}`   | رقم هاتف المرسل (حسب أفضل جهد)                 |
| `{{Provider}}`     | تلميح الموفر (whatsapp، telegram، discord، إلخ) |

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
- مصفوفة ملفات: تُدمج بعمق بالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (تتجاوز القيم المضمنة).
- التضمينات المتداخلة: حتى عمق 10 مستويات.
- المسارات: تُحل نسبة إلى الملف الذي يتضمنها، ولكن يجب أن تبقى داخل دليل الإعدادات ذي المستوى الأعلى (`dirname` الخاص بـ `openclaw.json`). يُسمح بالصيغ المطلقة/`../` فقط عندما تظل تُحل داخل ذلك الحد.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغير قسما واحدا فقط من المستوى الأعلى مدعوما بتضمين ملف واحد تكتب مباشرة إلى ذلك الملف المضمن. على سبيل المثال، يحدث `plugins install` الإعداد `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` سليما.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط بالنسبة إلى عمليات الكتابة المملوكة لـ OpenClaw؛ تفشل هذه الكتابات بشكل مغلق بدلا من تسطيح الإعدادات.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذات صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذات صلة

- [الإعدادات](/ar/gateway/configuration)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
