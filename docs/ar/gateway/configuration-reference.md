---
read_when:
    - تحتاج إلى الدلالات الدقيقة للتكوين على مستوى الحقل أو القيم الافتراضية
    - أنت تتحقق من صحة كتل تهيئة القناة أو النموذج أو Gateway أو الأداة
summary: مرجع تكوين Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-05-06T17:57:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e5f7c2246b28f801d527437ae6242686998f1e8b75fd3977723d240a760d859
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع إعدادات النواة لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة للمهام، راجع [الإعدادات](/ar/gateway/configuration).

يغطي أسطح إعدادات OpenClaw الرئيسية ويربط إلى مراجع أخرى عندما يكون لدى نظام فرعي مرجع أعمق خاص به. توجد فهارس الأوامر المملوكة للقنوات وPlugins، ومفاتيح الذاكرة العميقة/QMD، في صفحاتها الخاصة بدلا من هذه الصفحة.

مصدر الحقيقة في الشيفرة:

- يطبع `openclaw config schema` مخطط JSON الحي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات التعريف المجمعة/الخاصة بـPlugin/القناة عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بنطاق مسار لأدوات التعمق
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط الأساس لوثائق الإعدادات مقابل سطح المخطط الحالي

مسار البحث الخاص بالوكيل: استخدم إجراء أداة `gateway` باسم `config.schema.lookup` للحصول على
وثائق وقيود دقيقة على مستوى الحقول قبل التعديلات. استخدم
[الإعدادات](/ar/gateway/configuration) للإرشاد الموجه للمهام وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، وروابط مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لفهرس الأوامر المدمجة + المجمعة الحالي
- صفحات القنوات/Plugins المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق الإعدادات هو **JSON5** (يسمح بالتعليقات والفواصل اللاحقة). كل الحقول اختيارية - يستخدم OpenClaw قيما افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح الإعدادات لكل قناة إلى صفحة مخصصة - راجع
[الإعدادات - القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والقنوات
المجمعة الأخرى (المصادقة، التحكم في الوصول، الحسابات المتعددة، وبوابة الإشارات).

## افتراضيات الوكيل، وتعدد الوكلاء، والجلسات، والرسائل

انتقلت إلى صفحة مخصصة - راجع
[الإعدادات - الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، الصندوق الرملي)
- `multiAgent.*` (توجيه تعدد الوكلاء والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التشذيب)
- `messages.*` (تسليم الرسائل، تحويل النص إلى كلام، عرض markdown)
- `talk.*` (وضع Talk)
  - `talk.speechLocale`: معرّف لغة BCP 47 اختياري للتعرف على كلام Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم ضبطه، يحتفظ Talk بنافذة التوقف الافتراضية للمنصة قبل إرسال النص المفرغ (`700 ms on macOS and Android, 900 ms on iOS`)

## الأدوات والمزودون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وإعدادات الأدوات المدعومة بالمزودين،
وإعداد المزود المخصص / عنوان URL الأساسي إلى صفحة مخصصة - راجع
[الإعدادات - الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

توجد تعريفات المزودين، وقوائم السماح للنماذج، وإعداد المزود المخصص في
[الإعدادات - الأدوات والمزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
يمتلك جذر `models` أيضا سلوك فهرس النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك فهرس المزود (`merge` أو `replace`).
- `models.providers`: خريطة مزودين مخصصين مفهرسة حسب معرّف المزود.
- `models.pricing.enabled`: يتحكم في تمهيد التسعير في الخلفية الذي
  يبدأ بعد وصول العمليات الجانبية والقنوات إلى مسار جاهزية Gateway. عندما تكون `false`،
  يتخطى Gateway عمليات جلب فهارس تسعير OpenRouter وLiteLLM؛ وتظل قيم
  `models.providers.*.models[].cost` المهيأة تعمل لتقديرات التكلفة المحلية.

## MCP

توجد تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` وتستهلكها
Pi المضمنة ومحولات تشغيل أخرى. تدير أوامر `openclaw mcp list` و
`show` و`set` و`unset` هذه الكتلة من دون الاتصال بالخادم
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

- `mcp.servers`: تعريفات مسماة لخوادم MCP عبر stdio أو عن بعد لبيئات التشغيل التي
  تعرض أدوات MCP المهيأة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  ويعد `type: "http"` اسما مستعارا أصليا في CLI يقوم `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى حقل `transport` القياسي.
- `mcp.sessionIdleTtlMs`: مدة TTL للخمول لبيئات تشغيل MCP المجمعة محددة الجلسة.
  تطلب التشغيلات المضمنة لمرة واحدة تنظيف نهاية التشغيل؛ وتعد مدة TTL هذه خط الدفاع الأخير
  للجلسات طويلة العمر والمستدعين المستقبليين.
- تطبق التغييرات ضمن `mcp.*` فورا عن طريق التخلص من بيئات تشغيل MCP المخزنة مؤقتا للجلسة.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من الإعدادات الجديدة، ولذلك تزال إدخالات
  `mcp.servers` المحذوفة فورا بدلا من انتظار مدة TTL للخمول.

راجع [MCP](/ar/cli/mcp#openclaw-as-an-mcp-client-registry) و
[خلفيات CLI](/ar/gateway/cli-backends#bundle-mcp-overlays) لمعرفة سلوك التشغيل.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
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

- `allowBundled`: قائمة سماح اختيارية لـSkills المجمعة فقط (لا تتأثر Skills المدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (بأدنى أسبقية).
- `install.preferBrew`: عندما تكون true، تفضل مثبتات Homebrew عندما يكون `brew` متاحا
  قبل الرجوع إلى أنواع المثبتات الأخرى.
- `install.nodeManager`: تفضيل مثبت node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- يعطل `entries.<skillKey>.enabled: false` مهارة حتى لو كانت مجمعة/مثبتة.
- `entries.<skillKey>.apiKey`: تسهيل لـSkills التي تعلن عن متغير بيئة أساسي (سلسلة نصية صريحة أو كائن SecretRef).

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

- يتم التحميل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، إضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins الأصلية لـOpenClaw إضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي من دون بيان.
- **تتطلب تغييرات الإعدادات إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (لا يتم تحميل إلا Plugins المدرجة). تتغلب `deny`.
- `bundledDiscovery`: القيمة الافتراضية هي `"allowlist"` للإعدادات الجديدة، ولذلك فإن قيمة
  `plugins.allow` غير الفارغة تقيّد أيضا Plugins مزودي الخدمة المجمعة، بما في ذلك مزودي
  تشغيل البحث في الويب. يكتب Doctor القيمة `"compat"` لإعدادات قوائم السماح القديمة
  المرحّلة للحفاظ على سلوك مزودي الخدمة المجمعة الحالي إلى أن تختار الانضمام.
- `plugins.entries.<id>.apiKey`: حقل تسهيل مفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة محددة بنطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، تمنع النواة `before_prompt_build` وتتجاهل الحقول المعدّلة للمطالبة من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق ذلك على خطافات Plugin الأصلية ومجلدات الخطافات المقدمة من الحزم المدعومة.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن لـPlugins الموثوقة غير المجمعة قراءة محتوى المحادثة الخام من خطافات typed مثل `llm_input` و`llm_output` و`before_model_resolve` و`before_agent_reply` و`before_agent_run` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: ثق صراحة بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لتشغيلات الوكلاء الفرعيين في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات يعرّفه Plugin (يتم التحقق منه بواسطة مخطط Plugin الأصلي لـOpenClaw عند توفره).
- توجد إعدادات حساب/تشغيل Plugin القناة ضمن `channels.<id>` ويجب أن تصفها بيانات تعريف `channelConfigs` في بيان Plugin المالك، لا سجل خيارات مركزي في OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزود جلب الويب Firecrawl.
  - `apiKey`: مفتاح API لـFirecrawl (يقبل SecretRef). يعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـAPI الخاص بـFirecrawl (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخرج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر ذاكرة التخزين المؤقت بالميلي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث Grok في الويب).
  - `enabled`: تفعيل مزود X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل مسح Dreaming كامل (`"0 3 * * *"` افتراضيا).
  - `model`: تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه بـ`allowedModels` لتقييد الأهداف. تعيد أخطاء عدم توفر النموذج المحاولة مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ ولا تتراجع إخفاقات الثقة أو قائمة السماح بصمت.
  - سياسة المراحل والعتبات هي تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـPlugins حزم Claude المفعلة أيضا المساهمة بافتراضيات Pi مضمنة من `settings.json`؛ يطبق OpenClaw هذه كإعدادات وكيل منقاة، لا كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ القيمة الافتراضية هي `"legacy"` ما لم تثبت محركا آخر وتحدده.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يستطيع OpenClaw اكتشاف طلبات التحقق اللاحقة من أدوار المحادثة وتسليمها عبر تشغيلات Heartbeat.

- `commitments.enabled`: تفعيل الاستخراج الخفي بواسطة LLM، والتخزين، وتسليم Heartbeat للالتزامات المستنتجة للمتابعة. الافتراضي: `false`.
- `commitments.maxPerDay`: الحد الأقصى للالتزامات المستنتجة للمتابعة التي يتم تسليمها لكل جلسة وكيل في يوم متحرك. الافتراضي: `3`.

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
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد وقت الخمول أو عندما
  تتجاوز جلسة حدها الأقصى. عيّن `idleMinutes: 0` أو `maxTabsPerSession: 0`
  لتعطيل أوضاع التنظيف الفردية هذه.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلًا عند عدم ضبطه، لذلك يبقى تنقل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا في تنقل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) لنفس حظر الشبكة الخاصة أثناء فحوصات قابلية الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصصة للإرفاق فقط (بدء/إيقاف/إعادة تعيين معطلة).
- يقبل `profiles.*.cdpUrl` كلًا من `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك موفرك بعنوان URL مباشر لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية الوصول إلى CDP البعيد و
  `attachOnly` إضافةً إلى طلبات فتح علامات التبويب. تحتفظ ملفات تعريف loopback
  المُدارة بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مُدارة خارجيًا ويمكن الوصول إليها عبر loopback، فاضبط
  `attachOnly: true` لذلك الملف التعريفي؛ وإلا فسيعامل OpenClaw منفذ loopback كملف
  تعريف متصفح محلي مُدار وقد يبلّغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلًا من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف
  متصفح محدد مستند إلى Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات مدفوعة باللقطات/المراجع بدلًا من الاستهداف بمحددات CSS، وخطافات رفع
  ملف واحد، وعدم وجود تجاوزات لمهلة الحوارات، وعدم وجود `wait --load networkidle`، وعدم وجود
  `responsebody` أو تصدير PDF أو اعتراض التنزيل أو إجراءات الدُفعات.
- تعيّن ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائيًا؛ اضبط
  `cdpUrl` صراحةً فقط لـ CDP البعيد.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف التعريفي. استخدم هذا لتشغيل ملف تعريف واحد في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية و`browser.localCdpReadyTimeoutMs` لجاهزية websocket الخاصة بـ CDP
  بعد الإطلاق. ارفع القيم على المضيفين الأبطأ حيث يبدأ Chrome بنجاح
  لكن فحوصات الجاهزية تتسابق مع بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعدادًا صحيحة موجبة حتى `120000` مللي ثانية؛ تُرفض قيم الإعداد غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مستندًا إلى Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  `~` و`~/...` لدليل المنزل في نظام التشغيل لديك قبل تشغيل Chromium.
  يتم أيضًا توسيع التلدة في `userDataDir` لكل ملف تعريف على ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء Chromium المحلي (مثل
  `--disable-gpu`، أو ضبط حجم النافذة، أو أعلام التصحيح).

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

- `seamColor`: لون تمييز لهيكل واجهة المستخدم في التطبيق الأصلي (تلوين فقاعة وضع التحدث، إلخ).
- `assistant`: تجاوز هوية واجهة التحكم. يعود إلى هوية الوكيل النشط عند عدم الضبط.

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

- `mode`: ‏`local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway البدء إلا إذا كانت القيمة `local`.
- `port`: منفذ واحد متعدد الإرسال لـ WS + HTTP. ترتيب الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto`، أو `loopback` (الافتراضي)، أو `lan` (`0.0.0.0`)، أو `tailnet` (عنوان Tailscale IP فقط)، أو `custom`.
- **أسماء bind القديمة البديلة**: استخدم قيم وضع bind في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء host البديلة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يرتبط `loopback` الافتراضي بـ `127.0.0.1` داخل الحاوية. مع شبكة Docker bridge (`-p 18789:18789`)، تصل حركة المرور على `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على كل الواجهات.
- **المصادقة**: مطلوبة افتراضيا. تتطلب ارتباطات غير loopback مصادقة Gateway. عمليا يعني ذلك رمزا/كلمة مرور مشتركة أو وكيلا عكسيا واعيا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد الأولي رمزا افتراضيا.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحة على `token` أو `password`. تفشل تدفقات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مهيأ ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback موثوقة؛ ولا يتم عرضه عمدا في مطالبات الإعداد الأولي.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي واع بالهوية وثق بترويسات الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع افتراضيا مصدر وكيل **غير loopback**؛ وتتطلب الوكلاء العكسية عبر loopback على المضيف نفسه ضبط `gateway.auth.trustedProxy.allowLoopback = true` صراحة. يمكن للمتصلين الداخليين على المضيف نفسه استخدام `gateway.auth.password` كبديل محلي مباشر؛ ويبقى `gateway.auth.token` متنافيا مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve استيفاء مصادقة واجهة التحكم/WebSocket (يتم التحقق عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي في Gateway بدلا من ذلك. يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. تكون القيمة الافتراضية `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات المصادقة الفاشلة. يطبق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع shared-secret وdevice-token بشكل مستقل). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار واجهة التحكم غير المتزامن عبر Tailscale Serve، تتم تسلسلة المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه تفعيل المحدد عند الطلب الثاني بدلا من أن تمر كلتاهما كعدم تطابق عادي.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمدا تحديد معدل حركة localhost أيضا (لإعدادات الاختبار أو عمليات نشر الوكيل الصارمة).
- تتم دائما خنق محاولات مصادقة WS ذات أصل المتصفح مع تعطيل استثناء loopback (دفاعا بالعمق ضد القوة الغاشمة من المتصفح على localhost).
- على loopback، تكون عمليات القفل ذات أصل المتصفح هذه معزولة لكل قيمة `Origin`
  مطبعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيا
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` (tailnet فقط، ارتباط loopback) أو `funnel` (عام، يتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصل المتصفح لاتصالات WebSocket مع Gateway. مطلوبة عندما يتوقع وجود عملاء متصفح من أصول غير loopback.
- `controlUi.chatMessageMaxWidth`: حد أقصى اختياري للعرض لرسائل دردشة واجهة التحكم المجمعة. يقبل قيم عرض CSS مقيدة مثل `960px`، و`82%`، و`min(1280px, 82%)`، و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يتيح الرجوع إلى أصل ترويسة Host لعمليات النشر التي تعتمد عمدا على سياسة أصل ترويسة Host.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` (ws/wss). عند استخدام `direct`، يجب أن تكون `remote.url` هي `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ في بيئة عملية العميل
  يسمح باستخدام `ws://` بنص صريح إلى عناوين IP موثوقة على الشبكة الخاصة؛
  ويبقى الافتراضي هو loopback فقط للنص الصريح. لا يوجد مكافئ في `openclaw.json`،
  ولا تؤثر إعدادات الشبكة الخاصة للمتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` على عملاء WebSocket
  الخاصين بـ Gateway.
- `gateway.remote.token` / `.password` هي حقول اعتماد للعميل البعيد. لا تهيئ مصادقة Gateway بذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان URL أساسي عبر HTTPS للمرحل الخارجي لـ APNs الذي تستخدمه إصدارات iOS الرسمية/TestFlight بعد نشر تسجيلات مدعومة بالمرحل إلى Gateway. يجب أن يطابق هذا العنوان عنوان URL للمرحل المضمن في بناء iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالمللي ثانية. القيمة الافتراضية `10000`.
- يتم تفويض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويتضمن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال محددة بنطاق التسجيل إلى Gateway. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئة مؤقتة لإعداد المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: مخرج تطوير فقط لعناوين URL الخاصة بمرحل HTTP عبر loopback. يجب أن تبقى عناوين URL الخاصة بمرحلات الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة WebSocket قبل المصادقة في Gateway بالمللي ثانية. الافتراضي: `15000`. تكون لـ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأولوية عند ضبطها. زد هذه القيمة على المضيفين المحملين أو منخفضي القدرة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال تسخين بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقب صحة القناة بالدقائق. اضبطه على `0` لتعطيل إعادات تشغيل مراقب الصحة عالميا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس المتقادم بالدقائق. اجعلها أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقب الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: إلغاء اشتراك لكل قناة في إعادات تشغيل مراقب الصحة مع إبقاء المراقب العالمي مفعلا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند ضبطه، تكون له الأولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلي استخدام `gateway.remote.*` كبديل فقط عندما تكون `gateway.auth.*` غير مضبوطة.
- إذا تم تهيئة `gateway.auth.token` / `gateway.auth.password` صراحة عبر SecretRef وتعذر حلها، يفشل الحل بشكل مغلق (لا يوجد إخفاء عبر بديل بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين التي تنهي TLS أو تحقن ترويسات العميل المعاد توجيهها. أدرج فقط الوكلاء الذين تتحكم فيهم. تظل إدخالات loopback صالحة لإعدادات الوكيل/الاكتشاف المحلي على المضيف نفسه (على سبيل المثال Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل Gateway ‏`X-Real-IP` إذا كان `X-Forwarded-For` مفقودا. الافتراضي `false` لسلوك الفشل المغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح اختيارية بصيغة CIDR/IP للموافقة التلقائية على اقتران جهاز Node لأول مرة من دون نطاقات مطلوبة. تكون معطلة عند عدم ضبطها. لا يؤدي ذلك إلى الموافقة التلقائية على اقتران المشغل/المتصفح/واجهة التحكم/WebChat، ولا يوافق تلقائيا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/منع عالمي لأوامر Node المعلنة بعد الاقتران وتقييم قائمة سماح المنصة. استخدم `allowCommands` للاشتراك في أوامر Node الخطرة مثل `camera.snap`، و`camera.clip`، و`screen.record`؛ يزيل `denyCommands` أمرا حتى لو كان افتراضي منصة أو سماح صريح سيشمله بخلاف ذلك. بعد أن يغير Node قائمة أوامره المعلنة، ارفض اقتران ذلك الجهاز وأعد الموافقة عليه كي يخزن Gateway لقطة الأوامر المحدثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (توسع قائمة المنع الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة منع HTTP الافتراضية.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطلة افتراضيا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تعامل قوائم السماح الفارغة كأنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة تقوية استجابة اختيارية:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لأصول HTTPS التي تتحكم فيها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد بمنافذ ومجلدات حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام ملائمة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

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
- `autoGenerate`: ينشئ تلقائيا زوج شهادة/مفتاح محلي ذاتي التوقيع عندما لا تكون الملفات الصريحة مهيأة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف مفتاح TLS الخاص؛ اجعل أذوناته مقيدة.
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

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات أثناء التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائما عند تغيير الإعدادات.
  - `"hot"`: طبق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخنة أولا؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى الاختياري للوقت بالمللي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل. احذفه لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ اضبطه على `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية عن العمليات التي ما زالت معلقة.

---

## Hooks

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
يتم رفض رموز الخطافات في سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` قيمة غير فارغة في `hooks.token`.
- يجب أن يكون `hooks.token` **مختلفا** عن `gateway.auth.token`؛ تتم إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارا فرعيا مخصصا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (مثلا `["hook:"]`).
- إذا استخدم تعيين أو إعداد مسبق قيمة `sessionKey` قائمة على قالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يتم قبول `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يتم حله عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` الخاصة بالتعيين المعروض من القالب على أنها مقدمة خارجيا، وتتطلب أيضا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلا `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء خطاف.
  - يجب أن يكون `transform.module` مسارا نسبيا وأن يبقى ضمن `hooks.transformsDir` (يتم رفض المسارات المطلقة والتنقل خارج المسار).
  - أبق `hooks.transformsDir` ضمن `~/.openclaw/hooks/transforms`؛ يتم رفض أدلة Skills الخاصة بمساحة العمل. إذا أبلغ `openclaw doctor` عن أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات الخطافات أو أزل `hooks.transformsDir`.
- يوجه `agentId` إلى وكيل محدد؛ تعود المعرّفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للكل، `[]` = الرفض للكل).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل الخطاف بدون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق قيمة `sessionKey` قائمة على قالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ يكون `channel` افتراضيا `last`.
- يتجاوز `model` نموذج LLM لتشغيل الخطاف هذا (يجب أن يكون مسموحا إذا تم تعيين كتالوج النماذج).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المدمج `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت ذلك التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` ليتطابق مع مساحة أسماء Gmail، مثلا `["hook:", "hook:gmail:"]`.
- إذا كنت تحتاج إلى `hooks.allowRequestSessionKey: false`، فتجاوز الإعداد المسبق باستخدام `sessionKey` ثابت بدلا من الافتراضي القائم على القالب.

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

- يبدأ Gateway تشغيل `gog gmail watch serve` تلقائيا عند الإقلاع عند تكوينه. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلا إلى جانب Gateway.

---

## مضيف Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- يخدم HTML/CSS/JS وA2UI القابلة للتحرير بواسطة الوكيل عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبق `gateway.bind: "loopback"` (الافتراضي).
- الربط بغير loopback: تتطلب مسارات Canvas مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل Node WebViews عادة ترويسات المصادقة؛ بعد إقران عقدة واتصالها، يعلن Gateway عن عناوين URL للقدرات محددة النطاق بالعقدة للوصول إلى Canvas/A2UI.
- ترتبط عناوين URL للقدرات بجلسة WS النشطة للعقدة وتنتهي صلاحيتها بسرعة. لا يتم استخدام الرجوع القائم على IP.
- يحقن عميل إعادة التحميل الحي في HTML المخدوم.
- ينشئ تلقائيا ملف `index.html` بادئا عندما يكون فارغا.
- يخدم أيضا A2UI عند `/__openclaw__/a2ui/`.
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

- `minimal` (الافتراضي عند تمكين Plugin `bonjour` المدمج): حذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: تضمين `cliPath` + `sshPort`؛ لا يزال إعلان البث المتعدد على LAN يتطلب تمكين Plugin `bonjour` المدمج.
- `off`: كبت إعلان البث المتعدد على LAN دون تغيير تمكين Plugin.
- يبدأ Plugin `bonjour` المدمج تلقائيا على مضيفي macOS، ويكون اختياريا على Linux وWindows وعمليات نشر Gateway ضمن الحاويات.
- يكون اسم المضيف افتراضيا هو اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية البث تحت `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، اقرنه بخادم DNS (يوصى بـ CoreDNS) + Tailscale split DNS.

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
- `shellEnv`: يستورد المفاتيح المتوقعة الناقصة من ملف تعريف صدفة تسجيل الدخول.
- راجع [البيئة](/ar/help/environment) لمعرفة أسبقية الإعدادات كاملة.

### استبدال متغيرات البيئة

أشر إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- لا تُطابق إلا الأسماء المكتوبة بأحرف كبيرة: `[A-Z_][A-Z0-9_]*`.
- المتغيرات الناقصة/الفارغة ترمي خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للتهريب إلى القيمة الحرفية `${VAR}`.
- يعمل مع `$include`.

---

## الأسرار

مراجع الأسرار إضافية: ما زالت القيم النصية الصريحة تعمل.

### `SecretRef`

استخدم شكلا واحدا للكائن:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- نمط معرف `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- معرف `source: "file"`: مؤشر JSON مطلق (على سبيل المثال `"/providers/openai/apiKey"`)
- نمط معرف `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرفات `source: "exec"` على مقاطع مسار مفصولة بشرطات مائلة هي `.` أو `..` (على سبيل المثال يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القياسية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُضمَّن مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### إعداد مزودي الأسرار

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
- تفشل مسارات مزودي الملفات وexec بإغلاق آمن عندما لا يكون التحقق من Windows ACL متاحا. اضبط `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب مزود `exec` مسار `command` مطلقا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيا، تُرفض مسارات الأوامر التي هي روابط رمزية. اضبط `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا تم إعداد `trustedDirs`، فسيُطبَّق فحص الدليل الموثوق على مسار الهدف المحلول.
- بيئة ابن `exec` تكون بالحد الأدنى افتراضيا؛ مرر المتغيرات المطلوبة صراحة باستخدام `passEnv`.
- تُحل مراجع الأسرار عند وقت التفعيل إلى لقطة داخل الذاكرة، ثم لا تقرأ مسارات الطلبات إلا اللقطة.
- يُطبَّق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح الممكّنة إلى فشل بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع التشخيصات.

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

- تُخزَّن ملفات التعريف الخاصة بكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` المراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست تنسيق وقت تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات تعريف مفاتيح API القياسية بصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- لا تدعم ملفات التعريف بوضع OAuth (`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملف تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ وتُمسح إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- تُستورد OAuth القديمة من `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: التراجع الأساسي بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كاف حقيقية (الافتراضي: `5`). يمكن أن يظل نص الفوترة الصريح يصل إلى هنا حتى في استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزوّد تبقى محصورة في المزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). تبقى رسائل HTTP `402` القابلة لإعادة المحاولة الخاصة بنافذة الاستخدام أو حد إنفاق المؤسسة/مساحة العمل في مسار `rate_limit` بدلا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: التراجع الأساسي بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدوير ملفات تعريف المصادقة لدى المزوّد نفسه لأخطاء التحميل الزائد قبل الانتقال إلى الرجوع الاحتياطي للنموذج (الافتراضي: `1`). تقع أشكال انشغال المزوّد مثل `ModelNotReadyException` هنا.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف محمّل زائد (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدوير ملفات تعريف المصادقة لدى المزوّد نفسه لأخطاء حد المعدل قبل الانتقال إلى الرجوع الاحتياطي للنموذج (الافتراضي: `1`). يتضمن ذلك دلو حد المعدل نصوصا مشكلة بحسب المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونصوص محاضر الجلسات المحفوظة. يعطل `redactSensitive: "off"` سياسة السجل/المحضر العامة هذه فقط؛ تظل أسطح أمان الواجهة/الأدوات/التشخيصات تحجب الأسرار قبل الإرسال.

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

- `enabled`: مفتاح التحكم الرئيسي لمخرجات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات التي تفعّل مخرجات سجل مستهدفة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر عدم التقدم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل كـ `session.long_running` أو `session.stalled` أو `session.stuck`. تعيد الردود والأدوات والحالة والكتل وتقدم ACP ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة عندما لا تتغير الحالة.
- `stuckSessionAbortMs`: عتبة عمر عدم التقدم بالمللي ثانية قبل أن يصبح العمل النشط المتوقف المؤهل قابلا للتصريف بالإيقاف من أجل التعافي. عند عدم ضبطها، يستخدم OpenClaw نافذة التشغيل المضمنة الممتدة الأكثر أمانا، بما لا يقل عن 10 دقائق و5 أضعاف `stuckSessionWarnMs`.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`). للتكوين الكامل، وفهرس الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع لتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بكل إشارة. عند ضبطها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC ترسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبعات أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات التتبع `0`-`1`.
- `otel.flushIntervalMs`: فترة تفريغ القياسات الدورية بالمللي ثانية.
- `otel.captureContent`: التقاط محتوى خام اختياري لسمات نطاق OTEL. يكون معطلا افتراضيا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامي؛ ويتيح لك شكل الكائن تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحة.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئي لسمات مزوّد نطاق GenAI التجريبية الأحدث. افتراضيا، تحتفظ النطاقات بسمة `gen_ai.system` القديمة للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئي للمضيفين الذين سجّلوا مسبقا SDK عالميا لـ OpenTelemetry. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بالإشارة تستخدم عندما لا يكون مفتاح التكوين المطابق مضبوطا.
- `cacheTrace.enabled`: تسجيل لقطات تتبع التخزين المؤقت للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لـ JSONL الخاص بتتبع التخزين المؤقت (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: التحكم فيما يضمّن في مخرجات تتبع التخزين المؤقت (كلها افتراضيا: `true`).

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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ اضبط `false` لإخفاء إرسال ACP وإمكانات الإنشاء).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسة ACP (الافتراضي: `true`). اضبط `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف خلفية وقت تشغيل ACP الافتراضي (يجب أن يطابق Plugin وقت تشغيل ACP مسجلا).
  ثبّت Plugin الخلفية أولا، وإذا كان `plugins.allow` مضبوطا، فأدرج معرّف Plugin الخلفية (مثلا `acpx`) وإلا فلن يتم تحميل خلفية ACP.
- `defaultAgent`: معرّف الوكيل الهدف الاحتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفا صريحا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ تعني القيمة الفارغة عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة بالتوازي.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم القطعة قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: كبت أسطر الحالة/الأدوات المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: تبث `"live"` تدريجيا؛ وتخزن `"final_only"` مؤقتا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف لأسطر حالة/تحديث ACP المسقطة.
- `stream.tagVisibility`: سجل بأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL الخاملة بالدقائق لعمّال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري لتشغيله عند تمهيد بيئة وقت تشغيل ACP.

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
  - `"random"` (الافتراضي): عبارات متناوبة مضحكة/موسمية.
  - `"default"`: عبارة محايدة ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: لا يوجد نص عبارة (يظل عنوان/إصدار الشعار معروضا).
- لإخفاء الشعار بالكامل (وليس العبارات فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية تكتبها تدفقات الإعداد الموجهة في CLI (`onboard`، `configure`، `doctor`):

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

راجع حقول هوية `agents.list` ضمن [إعدادات الوكيل الافتراضية](/ar/gateway/config-agents#agent-defaults).

---

## الجسر (قديم، تمت إزالته)

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل Nodes عبر WebSocket الخاص بـ Gateway. لم تعد مفاتيح `bridge.*` جزءا من مخطط التكوين (يفشل التحقق حتى تزال؛ يمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تشذيبها من `sessions.json`. يتحكم أيضًا في تنظيف نصوص جلسات Cron المحذوفة المؤرشفة. الافتراضي: `24h`؛ اضبطه على `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى للحجم لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التشذيب. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر التي يُحتفظ بها عند تشغيل تشذيب سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز حامل يُستخدم لتسليم POST عبر Webhook الخاص بـ Cron ‏(`delivery.mode = "webhook"`)، وإذا حُذف فلن تُرسل ترويسة مصادقة.
- `webhook`: عنوان URL احتياطي قديم ومهمل لـ Webhook ‏(http/https) يُستخدم فقط للمهام المخزنة التي لا تزال تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادة المحاولة للمهام التي تُنفّذ مرة واحدة عند حدوث أخطاء عابرة (الافتراضي: `3`؛ النطاق: `0`-`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. احذفها لإعادة المحاولة لكل الأنواع العابرة.

ينطبق فقط على مهام Cron التي تُنفّذ مرة واحدة. تستخدم المهام المتكررة معالجة فشل منفصلة.

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
- `after`: عدد حالات الفشل المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للمهمة نفسها (عدد صحيح غير سالب).
- `includeSkipped`: احتساب مرات التشغيل المتخطاة المتتالية ضمن عتبة التنبيه (الافتراضي: `false`). تُتبع مرات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
- `mode`: وضع التسليم - يرسل `"announce"` عبر رسالة قناة؛ وينشر `"webhook"` إلى Webhook المكوّن.
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
- `mode`: ‏`"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلان. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب في وضع Webhook.
- `accountId`: تجاوز اختياري للحساب من أجل التسليم.
- يتجاوز `delivery.failureDestination` لكل مهمة هذا الافتراضي العام.
- عندما لا تُعيّن وجهة فشل عامة ولا وجهة فشل لكل مهمة، تعود المهام التي تُسلّم أصلًا عبر `announce` إلى هدف الإعلان الأساسي ذاك عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا للمهام ذات `sessionTarget="isolated"` إلا إذا كان `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتبع عمليات تنفيذ Cron المعزولة بوصفها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

تُوسّع العناصر النائبة للقالب في `tools.media.models[].args`:

| المتغير           | الوصف                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (بلا مغلفات السجل/المرسل)             |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعات                 |
| `{{From}}`         | معرّف المرسل                                 |
| `{{To}}`           | معرّف الوجهة                            |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID للجلسة الحالية                              |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                 |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                          |
| `{{MediaPath}}`    | مسار الوسائط المحلي                                  |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)               |
| `{{Transcript}}`   | التفريغ النصي للصوت                                  |
| `{{Prompt}}`       | مطالبة الوسائط المحلولة لإدخالات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI         |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (أفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (أفضل جهد)               |
| `{{SenderName}}`   | اسم عرض المرسل (أفضل جهد)                 |
| `{{SenderE164}}`   | رقم هاتف المرسل (أفضل جهد)                 |
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
- مصفوفة ملفات: تُدمج بعمق بالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (وتتجاوز القيم المضمنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحلّ نسبة إلى الملف الذي يجري التضمين منه، لكن يجب أن تبقى داخل دليل الإعدادات ذي المستوى الأعلى (`dirname` الخاص بـ `openclaw.json`). تُسمح صيغ absolute/`../` فقط عندما تظل تُحلّ داخل ذلك الحد.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى مدعومًا بتضمين ملف واحد تكتب مباشرة إلى ذلك الملف المضمن. على سبيل المثال، يحدّث `plugins install` ‏`plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط بالنسبة إلى عمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بإغلاق آمن بدلًا من تسطيح الإعدادات.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذات صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذات صلة

- [الإعدادات](/ar/gateway/configuration)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
