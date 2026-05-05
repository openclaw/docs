---
read_when:
    - تحتاج إلى دلالات الإعدادات الدقيقة على مستوى الحقل أو القيم الافتراضية
    - أنت تتحقق من صحة كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية والروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-05-05T01:46:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82164a3ea7592f667573b643ee9e0ec840b9b622c9d86c382a3feaf192e75684
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع إعدادات النواة لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة للمهام، راجع [الإعدادات](/ar/gateway/configuration).

يغطي أسطح إعدادات OpenClaw الرئيسية، ويربط إلى مراجع أخرى عندما يكون لدى نظام فرعي مرجعه الأعمق الخاص. تعيش كتالوجات الأوامر المملوكة للقنوات وPlugin، ومفاتيح الذاكرة العميقة/QMD، في صفحاتها الخاصة بدلًا من هذه الصفحة.

مصدر الحقيقة في الكود:

- يطبع `openclaw config schema` مخطط JSON المباشر المستخدم للتحقق وControl UI، مع دمج بيانات Plugin/القناة/المضمنة الوصفية عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بالمسار لأدوات التعمق
- تتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس مستندات الإعدادات مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` المسمى `config.schema.lookup` للحصول على
توثيق وقيود دقيقة على مستوى الحقول قبل التعديلات. استخدم
[الإعدادات](/ar/gateway/configuration) للإرشادات الموجهة للمهام وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، وروابط مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر المضمنة + المجمعة الحالي
- صفحات القناة/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق الإعدادات هو **JSON5** (تُسمح التعليقات + الفواصل اللاحقة). كل الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح الإعدادات لكل قناة إلى صفحة مخصصة — راجع
[الإعدادات — القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والقنوات
المجمعة الأخرى (المصادقة، التحكم في الوصول، الحسابات المتعددة، بوابة الإشارات).

## افتراضيات الوكيل، تعدد الوكلاء، الجلسات، والرسائل

انتقلت إلى صفحة مخصصة — راجع
[الإعدادات — الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، sandbox)
- `multiAgent.*` (توجيه تعدد الوكلاء والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التقليم)
- `messages.*` (تسليم الرسائل، TTS، عرض Markdown)
- `talk.*` (وضع Talk)
  - `talk.speechLocale`: معرّف لغة BCP 47 اختياري للتعرف على الكلام في Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم تعيينه، يحتفظ Talk بنافذة التوقف الافتراضية للمنصة قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)

## الأدوات والموفرون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وإعدادات الأدوات المدعومة بالموفرين، وإعداد
الموفر المخصص / عنوان URL الأساسي إلى صفحة مخصصة — راجع
[الإعدادات — الأدوات والموفرون المخصصون](/ar/gateway/config-tools).

## النماذج

توجد تعريفات الموفرين، وقوائم السماح للنماذج، وإعداد الموفر المخصص في
[الإعدادات — الأدوات والموفرون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
يملك جذر `models` أيضًا سلوك كتالوج النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك كتالوج الموفر (`merge` أو `replace`).
- `models.providers`: خريطة موفرين مخصصين مفهرسة بمعرّف الموفر.
- `models.pricing.enabled`: يتحكم في تمهيد التسعير في الخلفية الذي
  يبدأ بعد وصول العمليات الجانبية والقنوات إلى مسار جاهزية Gateway. عندما تكون `false`،
  يتخطى Gateway جلب كتالوجات تسعير OpenRouter وLiteLLM؛ وتستمر قيم
  `models.providers.*.models[].cost` المكوّنة في العمل لتقديرات التكلفة المحلية.

## MCP

توجد تعريفات خوادم MCP المدارة بواسطة OpenClaw ضمن `mcp.servers` وتُستهلك
بواسطة Pi المضمن ومحولات التشغيل الأخرى. تدير أوامر `openclaw mcp list` و
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

- `mcp.servers`: تعريفات خوادم MCP مسماة عبر stdio أو عن بُعد لبيئات التشغيل التي
  تعرض أدوات MCP المكوّنة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  ويُعد `type: "http"` اسمًا مستعارًا أصليًا في CLI تقوم `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى حقل `transport` القياسي.
- `mcp.sessionIdleTtlMs`: مدة TTL للخمول لبيئات تشغيل MCP المجمعة والمحددة بنطاق الجلسة.
  تطلب عمليات التشغيل المضمنة لمرة واحدة التنظيف عند نهاية التشغيل؛ وتمثل مدة TTL هذه حاجز الأمان
  للجلسات طويلة العمر والمستدعين المستقبليين.
- تُطبّق التغييرات ضمن `mcp.*` مباشرة عبر التخلص من بيئات تشغيل MCP المخزنة مؤقتًا للجلسة.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من الإعدادات الجديدة، لذلك تُحصد
  إدخالات `mcp.servers` المحذوفة فورًا بدلًا من انتظار مدة TTL للخمول.

راجع [MCP](/ar/cli/mcp#openclaw-as-an-mcp-client-registry) و
[واجهات CLI الخلفية](/ar/gateway/cli-backends#bundle-mcp-overlays) لمعرفة سلوك التشغيل.

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

- `allowBundled`: قائمة سماح اختيارية للـ Skills المجمعة فقط (لا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أولوية).
- `install.preferBrew`: عندما تكون true، فضّل مثبتات Homebrew عندما يكون `brew` متاحًا
  قبل الرجوع إلى أنواع مثبتات أخرى.
- `install.nodeManager`: تفضيل مثبت node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- يعطل `entries.<skillKey>.enabled: false` إحدى Skills حتى لو كانت مجمعة/مثبتة.
- `entries.<skillKey>.apiKey`: وسيلة ملائمة لـ Skills التي تعلن متغير بيئة أساسيًا (سلسلة نصية عادية أو كائن SecretRef).

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

- تُحمّل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins أصلية من OpenClaw بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي بلا manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل gateway.**
- `allow`: قائمة سماح اختيارية (تُحمّل Plugins المدرجة فقط). تتغلب `deny`.
- `bundledDiscovery`: تكون افتراضيًا `"allowlist"` للإعدادات الجديدة، لذلك فإن
  `plugins.allow` غير الفارغة تتحكم أيضًا في Plugins الموفرين المجمعة، بما في ذلك موفرو تشغيل بحث الويب.
  يكتب Doctor القيمة `"compat"` لإعدادات قوائم السماح القديمة المُرحّلة
  للحفاظ على سلوك موفري الحزم المجمعة الحالي إلى أن تختار الاشتراك.
- `plugins.entries.<id>.apiKey`: حقل ملائم لمفتاح API على مستوى Plugin (عند دعمه بواسطة Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة محددة النطاق لـ Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، تمنع النواة `before_prompt_build` وتتجاهل الحقول التي تعدّل prompt من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق ذلك على hooks Plugins الأصلية وأدلة hooks التي توفرها الحزم المدعومة.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن لـ Plugins غير المجمعة والموثوقة قراءة محتوى المحادثة الخام من hooks المكتوبة مثل `llm_input` و`llm_output` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: ثق صراحةً بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لعمليات subagent الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات subagent الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات معرف بواسطة Plugin (يُتحقق منه بواسطة مخطط Plugin الأصلي من OpenClaw عند توفره).
- تعيش إعدادات حساب/تشغيل Plugin القناة ضمن `channels.<id>` ويجب وصفها بواسطة بيانات `channelConfigs` الوصفية في manifest الخاص بـ Plugin المالك، وليس بواسطة سجل خيارات مركزي في OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفر جلب الويب Firecrawl.
  - `apiKey`: مفتاح API لـ Firecrawl (يقبل SecretRef). يرجع إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API الخاص بـ Firecrawl (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف التجاوزات ذاتية الاستضافة نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: أقصى عمر لذاكرة التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث Grok على الويب).
  - `enabled`: تمكين موفر X Search.
  - `model`: نموذج Grok الذي سيُستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) لمعرفة المراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل عملية مسح Dreaming كاملة (`"0 3 * * *"` افتراضيًا).
  - `model`: تجاوز اختياري لنموذج subagent الخاص بـ Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه بـ `allowedModels` لتقييد الأهداف. تعيد أخطاء عدم توفر النموذج المحاولة مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ ولا تتراجع إخفاقات الثقة أو قائمة السماح بصمت.
  - سياسة المراحل والعتبات تفاصيل تنفيذية (ليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـ Plugins حزم Claude الممكّنة أيضًا المساهمة بافتراضات Pi المضمنة من `settings.json`؛ يطبق OpenClaw هذه الإعدادات كإعدادات وكيل منظفة، وليس كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ تكون القيمة الافتراضية `"legacy"` ما لم تثبت محركًا آخر وتحدده.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يمكن لـ OpenClaw اكتشاف تسجيلات المتابعة من أدوار المحادثة وتسليمها عبر عمليات Heartbeat.

- `commitments.enabled`: تمكين استخراج LLM المخفي والتخزين وتسليم Heartbeat للالتزامات المستنتجة للمتابعة. الافتراضي: `false`.
- `commitments.maxPerDay`: الحد الأقصى للالتزامات المستنتجة للمتابعة التي تُسلّم لكل جلسة وكيل في يوم متحرك. الافتراضي: `3`.

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
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد وقت الخمول أو عندما تتجاوز الجلسة حدها الأقصى. عيّن `idleMinutes: 0` أو `maxTabsPerSession: 0` لتعطيل أوضاع التنظيف الفردية هذه.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا عندما لا يكون مضبوطًا، لذلك يبقى تنقل المتصفح صارمًا افتراضيًا.
- عيّن `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا بتنقل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه للشبكة الخاصة أثناء فحوصات قابلية الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصصة للإرفاق فقط (بدء/إيقاف/إعادة ضبط معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك الموفّر بعنوان URL مباشر لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية وصول CDP البعيدة و`attachOnly`، إضافة إلى طلبات فتح علامات التبويب. تحتفظ ملفات التعريف المدارة عبر الرجوع المحلي بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مُدارة خارجيًا ويمكن الوصول إليها عبر الرجوع المحلي، فعيّن
  `attachOnly: true` لذلك الملف التعريفي؛ وإلا فسيعامل OpenClaw منفذ الرجوع المحلي كملف تعريف متصفح محلي مُدار وقد يبلّغ عن أخطاء ملكية منفذ محلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلًا من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف متصفح
  محدد مبني على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات تعتمد على snapshot/ref بدلًا من الاستهداف بمحددات CSS، وخطافات تحميل ملف واحد،
  ولا توجد تجاوزات لمهلة مربعات الحوار، ولا `wait --load networkidle`، ولا
  `responsebody`، أو تصدير PDF، أو اعتراض التنزيلات، أو إجراءات الدفعات.
- تعيّن ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائيًا؛ ولا
  تضبط `cdpUrl` صراحةً إلا لـ CDP البعيد.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف التعريفي. استخدم هذا لتشغيل ملف تعريف في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية، و`browser.localCdpReadyTimeoutMs` لجاهزية websocket لـ CDP
  بعد التشغيل. ارفع هذه القيم على المضيفين الأبطأ حيث يبدأ Chrome بنجاح لكن فحوصات الجاهزية تتسابق مع بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعدادًا صحيحة موجبة حتى `120000` مللي ثانية؛ وتُرفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنيًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  القيمتين `~` و`~/...` لدليل المنزل الخاص بنظام التشغيل قبل تشغيل Chromium.
  كما يتم توسيع علامة التلدة لكل ملف تعريف في `userDataDir` على ملفات تعريف `existing-session`.
- خدمة التحكم: الرجوع المحلي فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء Chromium المحلي (مثل
  `--disable-gpu`، أو تحديد حجم النافذة، أو أعلام التصحيح).

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

- `seamColor`: لون تمييز لزخرفة واجهة المستخدم في التطبيق الأصلي (صبغة فقاعة وضع التحدث، وما إلى ذلك).
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

<Accordion title="Gateway field details">

- `mode`: ‏`local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway البدء ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الاستخدامات لـ WS + HTTP. ترتيب الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` (الافتراضي)، أو `lan` (`0.0.0.0`)، أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط)، أو `custom`.
- **أسماء ربط قديمة بديلة**: استخدم قيم وضع الربط في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء المضيف البديلة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع ربط `loopback` الافتراضي على `127.0.0.1` داخل الحاوية. مع شبكة Docker الجسرية (`-p 18789:18789`)، تصل الحركة على `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات الربط غير الخاصة بـ loopback مصادقة Gateway. عمليًا، يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلاً عكسيًا مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد الأولي رمزًا افتراضيًا.
- إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. تفشل تدفقات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مكوّنًا ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ لا يُعرض هذا عمدًا ضمن مطالبات الإعداد الأولي.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي مدرك للهوية وثق بترويسات الهوية من `gateway.trustedProxies` (انظر [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر وكيل **غير loopback** افتراضيًا؛ تتطلب الوكلاء العكسيون من loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`. يمكن للمنادين الداخليين من المضيف نفسه استخدام `gateway.auth.password` كمسار احتياطي محلي مباشر؛ يظل `gateway.auth.token` متنافيًا مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve تلبية مصادقة واجهة التحكم/WebSocket (يُتحقق منها عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway بدلًا من ذلك. يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. القيمة الافتراضية هي `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدِّد اختياري لمحاولات المصادقة الفاشلة. يطبق لكل عنوان IP للعميل ولكل نطاق مصادقة (تُتبع shared-secret وdevice-token بشكل مستقل). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار واجهة التحكم غير المتزامن عبر Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تُفعّل المحدِّد عند الطلب الثاني بدلًا من أن تتسابق كلها كعدم تطابق عادي.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمدًا تقييد معدل حركة localhost أيضًا (لإعدادات الاختبار أو عمليات نشر الوكيل الصارمة).
- تُقيّد دائمًا محاولات مصادقة WS الصادرة من أصل المتصفح مع تعطيل استثناء loopback (دفاعًا معمقًا ضد هجمات التخمين على localhost عبر المتصفح).
- على loopback، تُعزل عمليات القفل الصادرة من أصل المتصفح لكل قيمة `Origin`
  مطبّعة، لذلك لا تؤدي حالات الفشل المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` (داخل tailnet فقط، ربط loopback) أو `funnel` (عام، يتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات WebSocket الخاصة بـ Gateway. مطلوبة عندما يُتوقع عملاء المتصفح من أصول غير loopback.
- `controlUi.chatMessageMaxWidth`: حد أقصى اختياري للعرض لرسائل دردشة واجهة التحكم المجمعة. يقبل قيم عرض CSS مقيدة مثل `960px` و`82%` و`min(1280px, 82%)` و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يمكّن الرجوع إلى أصل ترويسة Host لعمليات النشر التي تعتمد عمدًا على سياسة أصل ترويسة Host.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن يكون `remote.url` هو `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ في بيئة عملية العميل
  يسمح بـ `ws://` نصي عادي إلى عناوين IP موثوقة في شبكة خاصة؛ يظل الافتراضي
  هو loopback فقط للنص العادي. لا يوجد مكافئ في `openclaw.json`،
  ولا يؤثر تكوين الشبكة الخاصة في المتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` في عملاء WebSocket
  الخاصين بـ Gateway.
- `gateway.remote.token` / `.password` هي حقول اعتماد للعميل البعيد. لا تقوم بتكوين مصادقة Gateway بمفردها.
- `gateway.push.apns.relay.baseUrl`: عنوان URL أساسي عبر HTTPS للمرحل الخارجي لـ APNs المستخدم بواسطة إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بالمرحل إلى Gateway. يجب أن يطابق هذا العنوان عنوان URL للمرحل المضمّن في بنية iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالمللي ثانية. القيمة الافتراضية `10000`.
- تُفوّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال محددة بنطاق التسجيل إلى Gateway. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئة مؤقتة لتكوين المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب مخصص للتطوير فقط لعناوين URL الخاصة بمرحل HTTP عبر loopback. ينبغي أن تبقى عناوين URL الخاصة بمرحل الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة WebSocket قبل المصادقة في Gateway بالمللي ثانية. الافتراضي: `15000`. تكون الأولوية لـ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` عند ضبطه. زد هذه القيمة على المضيفين المحمّلين أو منخفضي الطاقة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال تمهيد بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القناة بالدقائق. اضبطه على `0` لتعطيل عمليات إعادة التشغيل الخاصة بمراقبة الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس القديم بالدقائق. أبقِ هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لعمليات إعادة التشغيل من مراقبة الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: إلغاء اشتراك لكل قناة في عمليات إعادة التشغيل الخاصة بمراقبة الصحة مع إبقاء المراقبة العامة مفعّلة.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند ضبطه، تكون له الأولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كمسار احتياطي فقط عندما يكون `gateway.auth.*` غير مضبوط.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يتم حله، يفشل الحل مغلقًا (بلا إخفاء عبر مسار احتياطي بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين التي تنهي TLS أو تحقن ترويسات العميل الممررة. أدرج فقط الوكلاء الذين تتحكم بهم. تظل إدخالات loopback صالحة لإعدادات الوكيل/الاكتشاف المحلي على المضيف نفسه (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل Gateway ترويسة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. الافتراضي `false` لسلوك الفشل المغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح اختيارية بنطاقات CIDR/IP للموافقة التلقائية على إقران جهاز عقدة لأول مرة بلا نطاقات مطلوبة. تكون معطّلة عندما لا تُضبط. لا يوافق هذا تلقائيًا على إقران المشغّل/المتصفح/واجهة التحكم/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/حظر عام لأوامر العقد المعلنة بعد الإقران وتقييم قائمة سماح المنصة. استخدم `allowCommands` للاشتراك في أوامر العقد الخطيرة مثل `camera.snap` و`camera.clip` و`screen.record`؛ يزيل `denyCommands` أمرًا حتى إذا كان افتراضي المنصة أو سماح صريح سيشمله بخلاف ذلك. بعد أن تغيّر عقدة قائمة أوامرها المعلنة، ارفض إقران ذلك الجهاز وأعد الموافقة عليه لكي يخزن Gateway لقطة الأوامر المحدثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (يمدد قائمة الحظر الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة حظر HTTP الافتراضية.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطّلة افتراضيًا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة كأنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة تقوية اختيارية للاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لأصول HTTPS التي تتحكم بها؛ انظر [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد بمنافذ ومجلدات حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام مريحة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، `--profile <name>` (يستخدم `~/.openclaw-<name>`).

انظر [Gateways متعددة](/ar/gateway/multiple-gateways).

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

- `enabled`: يمكّن إنهاء TLS عند مستمع Gateway (HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محلي ذاتي التوقيع عندما لا تكون الملفات الصريحة مكونة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ أبقِ الأذونات مقيّدة.
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

- `mode`: يتحكم في كيفية تطبيق تعديلات التكوين أثناء التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير التكوين.
  - `"hot"`: طبّق التغييرات داخل العملية دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخنة أولًا؛ ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة تهدئة بالمللي ثانية قبل تطبيق تغييرات التكوين (عدد صحيح غير سالب).
- `deferralTimeoutMs`: أقصى وقت اختياري بالمللي ثانية للانتظار حتى تكتمل العمليات الجارية قبل فرض إعادة التشغيل. احذفها لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ اضبطها على `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية عن العمليات التي ما زالت معلقة.

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
تُرفض رموز hook المرسلة عبر سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` قيمة `hooks.token` غير فارغة.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ يُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (مثلًا `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` بقالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` الخاصة بالتعيين والمولّدة من قالب على أنها مقدمة خارجيًا، وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تُرجع إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا وأن يبقى داخل `hooks.transformsDir` (تُرفض المسارات المطلقة والتنقل خارج المسار).
  - أبقِ `hooks.transformsDir` ضمن `~/.openclaw/hooks/transforms`؛ تُرفض أدلة Skills في مساحة العمل. إذا أبلغ `openclaw doctor` أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات hooks أو أزل `hooks.transformsDir`.
- يوجّه `agentId` إلى وكيل محدد؛ تعود المعرفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيل وكيل hook بدون `sessionKey` صريح.
- `allowRequestSessionKey`: يسمح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية بالبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` بقالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ القيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` نموذج LLM لهذا تشغيل hook (يجب أن يكون مسموحًا إذا كان كتالوج النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المدمج `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت ذلك التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` ليطابق نطاق أسماء Gmail، مثلًا `["hook:", "hook:gmail:"]`.
- إذا احتجت إلى `hooks.allowRequestSessionKey: false`، فتجاوز الإعداد المسبق باستخدام `sessionKey` ثابت بدلًا من القيمة الافتراضية ذات القالب.

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

- يبدأ Gateway تلقائيًا تشغيل `gog gmail watch serve` عند الإقلاع عندما يكون مضبوطًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلًا إلى جانب Gateway.

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

- يقدم HTML/CSS/JS القابلة للتحرير بواسطة الوكيل وA2UI عبر HTTP ضمن منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الربط غير loopback: تتطلب مسارات Canvas مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- عادةً لا ترسل Node WebViews ترويسات المصادقة؛ بعد إقران node واتصاله، يعلن Gateway عن عناوين URL لقدرات مقيّدة بنطاق node للوصول إلى Canvas/A2UI.
- ترتبط عناوين URL الخاصة بالقدرات بجلسة node WS النشطة وتنتهي صلاحيتها بسرعة. لا يُستخدم البديل المستند إلى IP.
- يحقن عميل إعادة التحميل الحي في HTML المقدّم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون فارغًا.
- يقدم A2UI أيضًا على `/__openclaw__/a2ui/`.
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

- `minimal` (الافتراضي عندما يكون Plugin `bonjour` المدمج مفعّلًا): حذف `cliPath` و`sshPort` من سجلات TXT.
- `full`: تضمين `cliPath` و`sshPort`؛ لا يزال إعلان البث المتعدد عبر LAN يتطلب تفعيل Plugin `bonjour` المدمج.
- `off`: منع إعلان البث المتعدد عبر LAN بدون تغيير تفعيل Plugin.
- يبدأ Plugin `bonjour` المدمج تلقائيًا على مضيفي macOS، وهو اختياري على Linux وWindows وعمليات نشر Gateway داخل الحاويات.
- يتم تعيين اسم المضيف افتراضيًا إلى اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية البث ضمن `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، استخدم خادم DNS (يوصى بـ CoreDNS) مع DNS مقسّم عبر Tailscale.

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
- ملفات `.env`: ملف `.env` في دليل العمل الحالي + `~/.openclaw/.env` (لا يتجاوز أيٌّ منهما المتغيرات الموجودة).
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

- تُطابَق الأسماء ذات الأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- المتغيرات المفقودة/الفارغة تطرح خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للإفلات والحصول على `${VAR}` حرفية.
- يعمل مع `$include`.

---

## الأسرار

مراجع الأسرار إضافية: لا تزال قيم النص الصريح تعمل.

### `SecretRef`

استخدم شكل كائن واحدًا:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- نمط معرّف `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- معرّف `source: "file"`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط معرّف `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار مفصولة بشرطات مائلة تكون `.` أو `..` (على سبيل المثال يُرفَض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة الرسمية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- مراجع `auth-profiles.json` مضمنة في حلّ وقت التشغيل وتغطية التدقيق.

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

- يدعم موفر `file` الوضع `mode: "json"` والوضع `mode: "singleValue"` (يجب أن يكون `id` هو `"value"` في وضع singleValue).
- تفشل مسارات موفري الملفات وexec بإغلاق آمن عندما لا يتوفر التحقق من ACL في Windows. اضبط `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب موفر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيًا، تُرفَض مسارات أوامر الروابط الرمزية. اضبط `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف الذي تم حله.
- إذا ضُبط `trustedDirs`، فإن فحص الدليل الموثوق ينطبق على مسار الهدف الذي تم حله.
- بيئة ابن `exec` تكون في حدها الأدنى افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار في وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلبات اللقطة فقط.
- يُطبَّق ترشيح السطح النشط أثناء التفعيل: تفشل المراجع غير المحلولة على الأسطح الممكّنة في بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع التشخيصات.

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

- تُخزَّن الملفات الشخصية لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست صيغة وقت تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات شخصية رسمية بمفاتيح API بصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- ملفات الوضع OAuth الشخصية (`auth.profiles.<id>.mode = "oauth"`) لا تدعم بيانات اعتماد ملفات المصادقة الشخصية المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- تُستورَد بيانات OAuth القديمة من `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). يمكن أن يندرج نص الفوترة الصريح هنا حتى مع استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزوّد تبقى محصورة بالمزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). تبقى رسائل نافذة الاستخدام القابلة لإعادة المحاولة عبر HTTP `402` أو رسائل حد إنفاق المؤسسة/مساحة العمل في مسار `rate_limit` بدلاً من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لفشل `auth_permanent` عالي الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدّادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدوير ملفات تعريف المصادقة لدى المزوّد نفسه لأخطاء التحميل الزائد قبل الانتقال إلى بديل النموذج (الافتراضي: `1`). تندرج هنا أشكال انشغال المزوّد مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة مزوّد/ملف تعريف محمّل زائدًا (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدوير ملفات تعريف المصادقة لدى المزوّد نفسه لأخطاء حد المعدل قبل الانتقال إلى بديل النموذج (الافتراضي: `1`). يتضمن دلو حد المعدل هذا نصًا بصياغة المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- عيّن `logging.file` لمسار ثابت.
- يرتفع `consoleLevel` إلى `debug` عند استخدام `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل النشط بالبايت قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 MB). يحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقّمة بجانب الملف النشط.
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونصوص محاضر الجلسات المحفوظة. يعطّل `redactSensitive: "off"` سياسة السجل/المحضر العامة هذه فقط؛ أما أسطح أمان الواجهة/الأدوات/التشخيص فستظل تحجب الأسرار قبل الإصدار.

---

## التشخيصات

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

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
- `flags`: مصفوفة من سلاسل الأعلام التي تفعّل مخرجات سجل مستهدفة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة العمر دون تقدّم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل كـ `session.long_running` أو `session.stalled` أو `session.stuck`. تؤدي الردود، والأدوات، والحالة، والكتل، وتقدّم ACP إلى إعادة ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت بلا تغيير.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`). للاطلاع على التكوين الكامل، وفهرس الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع الخاص بتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بكل إشارة. عند تعيينها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير الآثار، أو المقاييس، أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات الآثار `0`-`1`.
- `otel.flushIntervalMs`: الفاصل الدوري لتفريغ القياسات بالمللي ثانية.
- `otel.captureContent`: التقاط محتوى خام باشتراك صريح لسمات امتداد OTEL. يكون متوقفًا افتراضيًا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامي؛ ويتيح لك شكل الكائن تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحةً.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لسمات مزوّد امتداد GenAI التجريبية الأحدث. افتراضيًا تحتفظ الامتدادات بسمة `gen_ai.system` القديمة للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفات التي سجّلت مسبقًا SDK عالميًا لـ OpenTelemetry. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بالإشارة تُستخدم عندما لا يكون مفتاح التكوين المطابق معيّنًا.
- `cacheTrace.enabled`: تسجيل لقطات تتبع الذاكرة المخبئية للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار إخراج JSONL لتتبع الذاكرة المخبئية (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: التحكم فيما يُدرج في مخرجات تتبع الذاكرة المخبئية (كلها افتراضيًا: `true`).

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

- `channel`: قناة الإصدار لتثبيتات npm/git — `"stable"` أو `"beta"` أو `"dev"`.
- `checkOnStart`: التحقق من تحديثات npm عند بدء Gateway (الافتراضي: `true`).
- `auto.enabled`: تفعيل التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable (الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة انتشار إضافية بالساعات لطرح قناة stable (الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: مدى تكرار تشغيل فحوصات قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ عيّن `false` لإخفاء إرسال ACP وإمكانات التفريع).
- `dispatch.enabled`: بوابة مستقلة لإرسال دور جلسة ACP (الافتراضي: `true`). عيّن `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضي لوقت تشغيل ACP (يجب أن يطابق Plugin وقت تشغيل ACP مسجلًا).
  ثبّت Plugin الواجهة الخلفية أولًا، وإذا كان `plugins.allow` معيّنًا، فأدرج معرّف Plugin الواجهة الخلفية (مثل `acpx`) وإلا فلن يتم تحميل واجهة ACP الخلفية.
- `defaultAgent`: معرّف الوكيل الهدف الاحتياطي لـ ACP عندما لا تحدد عمليات التفريع هدفًا صريحًا.
- `allowedAgents`: قائمة سماح بمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ تعني القيمة الفارغة عدم وجود قيود إضافية.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة التفريغ عند الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: كبح أسطر الحالة/الأداة المتكررة في كل دور (الافتراضي: `true`).
- `stream.deliveryMode`: تبث `"live"` تدريجيًا؛ وتخزّن `"final_only"` مؤقتًا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف في أسطر حالة/تحديث ACP المعروضة.
- `stream.tagVisibility`: سجل بأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة البقاء عند الخمول بالدقائق لعمّال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري يُشغّل عند تهيئة بيئة وقت تشغيل ACP.

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
  - `"random"` (الافتراضي): عبارات فرعية مضحكة/موسمية متناوبة.
  - `"default"`: عبارة فرعية حيادية ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: دون نص عبارة فرعية (يبقى عنوان/إصدار الشعار ظاهرًا).
- لإخفاء الشعار كاملًا (وليس العبارات الفرعية فقط)، عيّن متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

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

راجع حقول هوية `agents.list` ضمن [إعدادات الوكيل الافتراضية](/ar/gateway/config-agents#agent-defaults).

---

## الجسر (قديم، مُزال)

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل Nodes عبر WebSocket الخاص بـ Gateway. لم تعد مفاتيح `bridge.*` جزءًا من مخطط التكوين (يفشل التحقق حتى تُزال؛ يمكن لـ `openclaw doctor --fix` تجريد المفاتيح غير المعروفة).

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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. يتحكم أيضًا في تنظيف محاضر Cron المؤرشفة المحذوفة. الافتراضي: `24h`؛ عيّن `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى للحجم لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر التي تُحتفظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز حامل يُستخدم لتسليم POST عبر Webhook الخاص بـ Cron (`delivery.mode = "webhook"`)، وإذا حُذف فلن تُرسل ترويسة مصادقة.
- `webhook`: عنوان URL احتياطي قديم ومهمل للـ Webhook (http/https) يُستخدم فقط للمهام المخزنة التي ما زال لديها `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادة المحاولة للمهام أحادية التنفيذ عند الأخطاء العابرة (الافتراضي: `3`؛ النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. احذفها لإعادة محاولة جميع الأنواع العابرة.

ينطبق هذا فقط على مهام Cron أحادية التنفيذ. تستخدم المهام المتكررة معالجة منفصلة للإخفاقات.

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

- `enabled`: تمكين تنبيهات الإخفاق لمهام Cron (الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للمهمة نفسها (عدد صحيح غير سالب).
- `includeSkipped`: احتساب عمليات التشغيل المتخطاة المتتالية ضمن عتبة التنبيه (الافتراضي: `false`). تُتتبَّع عمليات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
- `mode`: وضع التسليم — يرسل `"announce"` عبر رسالة قناة؛ وينشر `"webhook"` إلى Webhook المكوّن.
- `accountId`: معرّف حساب أو قناة اختياري لتقييد نطاق تسليم التنبيه.

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

- الوجهة الافتراضية لإشعارات إخفاق Cron عبر جميع المهام.
- `mode`: `"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلان. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب لوضع Webhook.
- `accountId`: تجاوز حساب اختياري للتسليم.
- يتجاوز `delivery.failureDestination` الخاص بكل مهمة هذا الافتراضي العام.
- عندما لا تكون هناك وجهة إخفاق عامة أو خاصة بالمهمة، تعود المهام التي تسلّم أصلًا عبر `announce` إلى هدف الإعلان الأساسي ذلك عند الإخفاق.
- يُدعَم `delivery.failureDestination` فقط للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتتبَّع عمليات تنفيذ Cron المعزولة كـ [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

العناصر النائبة للقوالب التي تُوسَّع في `tools.media.models[].args`:

| المتغير            | الوصف                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (دون أغلفة السجل/المرسل)              |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعة                   |
| `{{From}}`         | معرّف المرسل                                      |
| `{{To}}`           | معرّف الوجهة                                      |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID الجلسة الحالية                               |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                     |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                   |
| `{{MediaPath}}`    | مسار الوسائط المحلي                               |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)                   |
| `{{Transcript}}`   | نص تفريغ الصوت                                    |
| `{{Prompt}}`       | موجّه الوسائط المحلول لإدخالات CLI                |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI    |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
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

- ملف واحد: يستبدل الكائن الحاوي.
- مصفوفة ملفات: تُدمَج بعمق وبالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمَج بعد التضمينات (تتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى عمق 10 مستويات.
- المسارات: تُحلّ نسبةً إلى الملف الذي يحتوي التضمين، لكن يجب أن تبقى داخل دليل الإعدادات ذي المستوى الأعلى (`dirname` الخاص بـ `openclaw.json`). يُسمح بالأشكال المطلقة/`../` فقط عندما تظل تُحلّ داخل ذلك الحد.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى ومدعومًا بتضمين ملف واحد تكتب عبر ذلك الملف المضمّن. على سبيل المثال، يحدّث `plugins install` قيمة `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة تكون للقراءة فقط لعمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بإغلاق آمن بدل تسطيح الإعدادات.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [الإعدادات](/ar/gateway/configuration)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
