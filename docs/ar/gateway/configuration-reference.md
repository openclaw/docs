---
read_when:
    - تحتاج إلى دلالات دقيقة للإعدادات على مستوى الحقول أو القيم الافتراضية
    - أنت تتحقق من صحة كتل تكوين القناة أو النموذج أو Gateway أو الأداة
summary: مرجع تكوين Gateway لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، وروابط إلى مراجع مخصصة للأنظمة الفرعية
title: مرجع التكوين
x-i18n:
    generated_at: "2026-05-02T07:26:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a5820cac79161975cb4ab4ba8171df3d29366cbee2913d093374e2aa8b604a1
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع التكوين الأساسي لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة نحو المهام، راجع [التكوين](/ar/gateway/configuration).

يغطي أسطح تكوين OpenClaw الرئيسية ويربط بمراجع أخرى عندما يكون لدى نظام فرعي مرجعه الأعمق الخاص. تعيش كتالوجات الأوامر المملوكة للقنوات وPlugin ومفاتيح الذاكرة العميقة/QMD في صفحاتها الخاصة بدلا من هذه الصفحة.

مصدر الحقيقة في الكود:

- يطبع `openclaw config schema` مخطط JSON الحي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات metadata المجمعة/Plugin/القنوات عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بالمسار لأدوات التعمق
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس توثيق التكوين مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` المسمى `config.schema.lookup` للحصول على
توثيق وقيود دقيقة على مستوى الحقل قبل التعديلات. استخدم
[التكوين](/ar/gateway/configuration) للإرشادات الموجهة نحو المهام وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع تكوين الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وتكوين Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر الحالي المدمج + المجمع
- صفحات القناة/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق التكوين هو **JSON5** (تسمح بالتعليقات + الفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيما افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح التكوين لكل قناة إلى صفحة مخصصة — راجع
[التكوين — القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وقنوات
أخرى مجمعة (المصادقة، التحكم في الوصول، الحسابات المتعددة، بوابة الإشارة).

## القيم الافتراضية للوكيل، والوكلاء المتعددون، والجلسات، والرسائل

انتقلت إلى صفحة مخصصة — راجع
[التكوين — الوكلاء](/ar/gateway/config-agents) لـ:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، sandbox)
- `multiAgent.*` (توجيه الوكلاء المتعددين والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التشذيب)
- `messages.*` (تسليم الرسائل، TTS، عرض markdown)
- `talk.*` (وضع Talk)
  - `talk.speechLocale`: معرف لغة BCP 47 اختياري للتعرف على الكلام في Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم تعيينه، يحتفظ Talk بنافذة التوقف الافتراضية للمنصة قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)

## الأدوات والموفرون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وتكوين الأدوات المدعوم بالموفرين،
وإعداد الموفر المخصص / عنوان URL الأساسي إلى صفحة مخصصة — راجع
[التكوين — الأدوات والموفرون المخصصون](/ar/gateway/config-tools).

## النماذج

توجد تعريفات الموفرين، وقوائم السماح للنماذج، وإعداد الموفر المخصص في
[التكوين — الأدوات والموفرون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
يمتلك جذر `models` أيضا سلوك كتالوج النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك كتالوج الموفرين (`merge` أو `replace`).
- `models.providers`: خريطة الموفرين المخصصة مفهرسة بمعرف الموفر.
- `models.pricing.enabled`: يتحكم في تمهيد التسعير في الخلفية. عندما تكون
  `false`، يتخطى بدء تشغيل Gateway جلب كتالوج تسعير OpenRouter وLiteLLM؛
  تظل قيم `models.providers.*.models[].cost` المكونة تعمل لتقديرات التكلفة
  المحلية.

## MCP

تعيش تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` وتستهلكها
Pi المضمنة ومحولات التشغيل الأخرى. تدير أوامر `openclaw mcp list` و
`show` و`set` و`unset` هذه الكتلة دون الاتصال بالخادم الهدف أثناء تعديلات التكوين.

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

- `mcp.servers`: تعريفات خوادم MCP المسماة بنمط stdio أو البعيدة لبيئات التشغيل التي
  تعرض أدوات MCP المكونة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  `type: "http"` هو اسم مستعار أصلي لـ CLI يطبعه `openclaw mcp set` و
  `openclaw doctor --fix` في حقل `transport` القياسي.
- `mcp.sessionIdleTtlMs`: TTL الخمول لبيئات تشغيل MCP المجمعة المحددة بنطاق الجلسة.
  تطلب عمليات التشغيل المضمنة لمرة واحدة التنظيف عند انتهاء التشغيل؛ هذا TTL هو خط الحماية الأخير
  للجلسات طويلة العمر والمتصلين المستقبليين.
- تطبق التغييرات ضمن `mcp.*` مباشرة عبر التخلص من بيئات تشغيل MCP للجلسات المخزنة مؤقتا.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من التكوين الجديد، لذلك تزال إدخالات
  `mcp.servers` المحذوفة فورا بدلا من انتظار TTL الخمول.

راجع [MCP](/ar/cli/mcp#openclaw-as-an-mcp-client-registry) و
[خلفيات CLI](/ar/gateway/cli-backends#bundle-mcp-overlays) لمعرفة سلوك وقت التشغيل.

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

- `allowBundled`: قائمة سماح اختيارية لـ Skills المجمعة فقط (لا تتأثر Skills المدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (الأولوية الأدنى).
- `install.preferBrew`: عند `true`، تفضل مثبتات Homebrew عندما يكون `brew` متاحا
  قبل الرجوع إلى أنواع المثبتات الأخرى.
- `install.nodeManager`: تفضيل مثبت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- يعطل `entries.<skillKey>.enabled: false` Skill حتى لو كانت مجمعة/مثبتة.
- `entries.<skillKey>.apiKey`: تسهيل لـ Skills التي تعلن متغير env أساسيا (سلسلة نصية صريحة أو كائن SecretRef).

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

- يتم التحميل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins OpenClaw الأصلية بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي بدون manifest.
- **تتطلب تغييرات التكوين إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (لا يتم تحميل إلا Plugins المدرجة). يتغلب `deny`.
- `plugins.entries.<id>.apiKey`: حقل تسهيل لمفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات env محددة بنطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يحظر core `before_prompt_build` ويتجاهل الحقول التي تغير الموجه من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق على خطافات Plugin الأصلية وأدلة الخطافات المقدمة من الحزم المدعومة.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن لـ Plugins غير المجمعة الموثوقة قراءة محتوى المحادثة الخام من الخطافات المطبعة مثل `llm_input` و`llm_output` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: ثق صراحة بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لتشغيلات الوكلاء الفرعيين في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات الوكلاء الفرعيين الموثوقة. استخدم `"*"` فقط عندما تريد عمدا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن تكوين معرف بواسطة Plugin (يتم التحقق منه بواسطة مخطط Plugin OpenClaw الأصلي عند توفره).
- تعيش إعدادات حساب/وقت تشغيل Plugin القناة ضمن `channels.<id>` ويجب وصفها بواسطة metadata الخاصة بـ `channelConfigs` في manifest الخاص بـ Plugin المالك، وليس بواسطة سجل خيارات OpenClaw مركزي.
- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفر جلب الويب Firecrawl.
  - `apiKey`: مفتاح API لـ Firecrawl (يقبل SecretRef). يرجع إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير env `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API الخاص بـ Firecrawl (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: أقصى عمر للتخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الاستخلاص بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث الويب Grok).
  - `enabled`: تمكين موفر X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل مسح Dreaming كامل (`"0 3 * * *"` افتراضيا).
  - `model`: تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ استخدمه مع `allowedModels` لتقييد الأهداف. تعاد محاولة أخطاء عدم توفر النموذج مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ لا ترجع إخفاقات الثقة أو قائمة السماح بصمت.
  - سياسة المراحل والعتبات تفاصيل تنفيذية (ليست مفاتيح تكوين موجهة للمستخدم).
- يعيش تكوين الذاكرة الكامل في [مرجع تكوين الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـ Plugins حزم Claude المفعلة أيضا المساهمة بقيم Pi الافتراضية المضمنة من `settings.json`؛ يطبق OpenClaw تلك كإعدادات وكيل منقحة، وليس كتصحيحات تكوين OpenClaw خام.
- `plugins.slots.memory`: اختر معرف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرف Plugin محرك السياق النشط؛ القيمة الافتراضية هي `"legacy"` ما لم تثبت محركا آخر وتحدده.

راجع [Plugins](/ar/tools/plugin).

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

- يعطّل `evaluateEnabled: false` الأمرين `act:evaluate` و`wait --fn`.
- يستعيد `tabCleanup` علامات تبويب العامل الأساسي المتتبعة بعد مدة الخمول أو عندما
  تتجاوز الجلسة حدها الأقصى. اضبط `idleMinutes: 0` أو `maxTabsPerSession: 0` من أجل
  تعطيل أوضاع التنظيف الفردية تلك.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلا عند عدم ضبطه، لذلك يبقى تنقل المتصفح صارما بشكل افتراضي.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدا بتنقل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه للشبكة الخاصة أثناء فحوصات قابلية الوصول/الاكتشاف.
- يبقى `ssrfPolicy.allowPrivateNetwork` مدعوما كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصصة للإرفاق فقط (بدء/إيقاف/إعادة تعيين معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد أن يكتشف OpenClaw المسار `/json/version`؛ واستخدم WS(S)
  عندما يمنحك مزودك عنوان URL مباشرا لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية الوصول إلى CDP البعيد
  و`attachOnly` بالإضافة إلى طلبات فتح علامات التبويب. تحتفظ ملفات تعريف loopback المدارة
  بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مدارة خارجيا وقابلة للوصول عبر loopback، فاضبط
  `attachOnly: true` لذلك الملف التعريفي؛ وإلا فسيعامل OpenClaw منفذ loopback على أنه
  ملف تعريف متصفح محلي مدار وقد يبلغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلا من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف متصفح
  محدد مبني على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات مدفوعة باللقطات/المراجع بدلا من استهداف محددات CSS، وخطافات تحميل ملف واحد،
  وعدم وجود تجاوزات لمهلة مربعات الحوار، وعدم وجود `wait --load networkidle`، وعدم وجود
  `responsebody` أو تصدير PDF أو اعتراض التنزيلات أو إجراءات الدُفعات.
- تعين ملفات تعريف `openclaw` المحلية المدارة `cdpPort` و`cdpUrl` تلقائيا؛ لا
  تضبط `cdpUrl` صراحة إلا لـ CDP البعيد.
- يمكن لملفات التعريف المحلية المدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العمومي لذلك الملف التعريفي. استخدم هذا لتشغيل ملف تعريف واحد في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية، و`browser.localCdpReadyTimeoutMs` لجاهزية websocket الخاصة بـ CDP
  بعد التشغيل. ارفعها على المضيفين الأبطأ حيث يبدأ Chrome بنجاح
  لكن فحوصات الجاهزية تسبق بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعدادا صحيحة موجبة حتى `120000` مللي ثانية؛ وتُرفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنيا على Chromium ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  القيمتين `~` و`~/...` لدليل المنزل في نظام التشغيل قبل تشغيل Chromium.
  كما يتم توسيع علامة التلدة في `userDataDir` لكل ملف تعريف ضمن ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، الافتراضي `18791`).
- يضيف `extraArgs` علامات تشغيل إضافية إلى بدء تشغيل Chromium المحلي (مثل
  `--disable-gpu` أو ضبط حجم النافذة أو علامات التصحيح).

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

- `seamColor`: لون تمييز لكروم واجهة المستخدم في التطبيق الأصلي (درجة فقاعة وضع التحدث، إلخ).
- `assistant`: تجاوز هوية واجهة التحكم. تعود إلى هوية العامل النشط عند عدم ضبطها.

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

- `mode`: `local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway البدء ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الاستخدام لـ WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto` أو `loopback` (الافتراضي) أو `lan` (`0.0.0.0`) أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط) أو `custom`.
- **أسماء الربط القديمة البديلة**: استخدم قيم وضع الربط في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء المضيف البديلة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع ربط `loopback` الافتراضي على `127.0.0.1` داخل الحاوية. مع شبكة جسر Docker (`-p 18789:18789`)، تصل حركة المرور على `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو عيّن `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على كل الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات الربط خارج loopback مصادقة Gateway. عمليًا يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلاً عكسيًا واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد رمزًا افتراضيًا.
- إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فعيّن `gateway.auth.mode` صراحةً إلى `token` أو `password`. تفشل تدفقات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مكوّنًا ويكون الوضع غير معيّن.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ وهذا لا يُعرض عمدًا في مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي واعٍ بالهوية وثق برؤوس الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر وكيل **خارج loopback** افتراضيًا؛ وتتطلب الوكلاء العكسية عبر loopback على المضيف نفسه ضبط `gateway.auth.trustedProxy.allowLoopback = true` صراحةً. يمكن للمتصلين الداخليين من المضيف نفسه استخدام `gateway.auth.password` كخيار احتياطي مباشر محلي؛ ويظل `gateway.auth.token` متنافيًا مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عند ضبطها على `true`، يمكن لرؤوس هوية Tailscale Serve إيفاء مصادقة واجهة التحكم/WebSocket (يتم التحقق عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة رؤوس Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي لـ Gateway بدلًا من ذلك. يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. تكون القيمة الافتراضية `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات المصادقة الفاشلة. يُطبق لكل عنوان IP للعميل ولكل نطاق مصادقة (تُتبع shared-secret وdevice-token بشكل مستقل). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار واجهة التحكم غير المتزامن عبر Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تفعل المحدد عند الطلب الثاني بدلًا من عبور كلتيهما كمطابقات فاشلة عادية.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ عيّنها إلى `false` عندما تريد عمدًا أن تخضع حركة مرور localhost لتحديد المعدل أيضًا (لإعدادات الاختبار أو نشر الوكيل الصارم).
- تُخضع محاولات مصادقة WS الصادرة من أصل متصفح دائمًا للتقييد مع تعطيل إعفاء loopback (دفاعًا متعمقًا ضد التخمين القسري عبر المتصفح على localhost).
- على loopback، تُعزل عمليات القفل الصادرة من أصل متصفح لكل قيمة `Origin`
  مطبّعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: `serve` (tailnet فقط، ربط loopback) أو `funnel` (عام، يتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات WebSocket بـ Gateway. مطلوبة عندما يُتوقع وجود عملاء متصفح من أصول خارج loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع إلى أصل رأس Host لعمليات النشر التي تعتمد عمدًا على سياسة أصل رأس Host.
- `remote.transport`: `ssh` (افتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` إما `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ في بيئة عملية العميل
  يسمح باستخدام `ws://` بنص صريح إلى عناوين IP موثوقة على الشبكة الخاصة؛
  ويظل الافتراضي مقتصرًا على loopback فقط للنص الصريح. لا يوجد مكافئ في `openclaw.json`،
  كما أن إعدادات الشبكة الخاصة في المتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` لا تؤثر في عملاء WebSocket
  الخاصين بـ Gateway.
- `gateway.remote.token` / `.password` هي حقول بيانات اعتماد للعميل البعيد. لا تهيئ مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان URL أساسي HTTPS للمرحل الخارجي APNs الذي تستخدمه إصدارات iOS الرسمية/TestFlight بعد نشر التسجيلات المدعومة بالمرحل إلى Gateway. يجب أن يطابق هذا العنوان عنوان المرحل المضمّن في بناء iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالمللي ثانية. القيمة الافتراضية `10000`.
- تُفوّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال محددة بنطاق التسجيل إلى Gateway. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئة مؤقتة لتكوين المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: مخرج مخصص للتطوير فقط لعناوين مرحل HTTP عبر loopback. يجب أن تبقى عناوين مرحل الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة WebSocket قبل المصادقة في Gateway بالمللي ثانية. الافتراضي: `15000`. تأخذ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأولوية عند ضبطها. زد هذه القيمة على المضيفات المحملة أو منخفضة القدرة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال تسخين بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القناة بالدقائق. عيّن `0` لتعطيل عمليات إعادة التشغيل من مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس المتقادم بالدقائق. أبقها أكبر من أو تساوي `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات التشغيل من مراقب الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: استثناء لكل قناة من عمليات إعادة التشغيل الخاصة بمراقب الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند ضبطه، يأخذ الأولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما تكون `gateway.auth.*` غير معيّنة.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يتم حله، يفشل الحل مغلقًا (لا يوجد إخفاء عبر خيار احتياطي بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين الذين ينهون TLS أو يحقنون رؤوس العميل المُمررة. أدرج فقط الوكلاء الذين تتحكم بهم. تظل إدخالات loopback صالحة لإعدادات الوكيل على المضيف نفسه/الاكتشاف المحلي (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عند `true`، يقبل Gateway رأس `X-Real-IP` إذا كان `X-Forwarded-For` مفقودًا. الافتراضي `false` لسلوك الفشل المغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح اختيارية بصيغة CIDR/IP للموافقة التلقائية على اقتران جهاز عقدة لأول مرة دون نطاقات مطلوبة. تكون معطلة عند عدم ضبطها. لا يوافق ذلك تلقائيًا على اقتران المشغل/المتصفح/واجهة التحكم/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/رفض عام لأوامر العقد المعلنة بعد الاقتران وتقييم قائمة السماح للمنصة. استخدم `allowCommands` للاشتراك في أوامر العقد الخطيرة مثل `camera.snap` و`camera.clip` و`screen.record`؛ ويزيل `denyCommands` أمرًا حتى لو كان افتراض المنصة أو السماح الصريح سيشمله بخلاف ذلك. بعد أن تغير عقدة قائمة الأوامر المعلنة لديها، ارفض اقتران ذلك الجهاز وأعد الموافقة عليه حتى يخزن Gateway لقطة الأوامر المحدثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (توسّع قائمة الرفض الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة رفض HTTP الافتراضية.

</Accordion>

### نقاط نهاية متوافقة مع OpenAI

- Chat Completions: معطلة افتراضيًا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة كأنها غير معيّنة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- رأس تقوية استجابة اختياري:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطه فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد باستخدام منافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام مريحة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

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
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محليًا موقّعًا ذاتيًا عند عدم تكوين ملفات صريحة؛ للاستخدام المحلي/التطوير فقط.
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

- `mode`: يتحكم في كيفية تطبيق تعديلات التكوين وقت التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير التكوين.
  - `"hot"`: طبّق التغييرات داخل العملية دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخنة أولًا؛ وارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات التكوين (عدد صحيح غير سالب).
- `deferralTimeoutMs`: حد أقصى اختياري بالمللي ثانية للانتظار حتى تنتهي العمليات الجارية قبل فرض إعادة التشغيل. احذفه لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ عيّنه إلى `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية عن العمليات التي لا تزال معلقة.

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
تُرفض رموز hook في سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` قيمة غير فارغة في `hooks.token`.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ يُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (على سبيل المثال `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` ذا قالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. مفاتيح التعيين الثابتة لا تتطلب هذا الاشتراك.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في التعيين المعروض بالقوالب كقيم مقدمة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلاً `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تُرجع إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى داخل `hooks.transformsDir` (تُرفض المسارات المطلقة واجتياز المسارات).
- يوجه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، `[]` = الرفض للجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook دون `sessionKey` صريح.
- `allowRequestSessionKey`: يسمح لمستدعي `/hooks/agent` ومفاتيح جلسة التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` ذا قالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ ويكون `channel` افتراضيًا `last`.
- يتجاوز `model` نموذج LLM لتشغيل hook هذا (يجب أن يكون مسموحًا إذا تم تعيين كتالوج النماذج).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المدمج `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لمطابقة مساحة أسماء Gmail، على سبيل المثال `["hook:", "hook:gmail:"]`.
- إذا كنت بحاجة إلى `hooks.allowRequestSessionKey: false`، فتجاوز الإعداد المسبق باستخدام `sessionKey` ثابت بدلًا من الافتراضي ذي القالب.

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

- يبدأ Gateway تلقائيًا تشغيل `gog gmail watch serve` عند الإقلاع عندما يكون مهيأً. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تُشغّل `gog gmail watch serve` منفصلًا إلى جانب Gateway.

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

- يقدّم HTML/CSS/JS القابلة للتحرير من الوكيل وA2UI عبر HTTP ضمن منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الارتباطات غير loopback: تتطلب مسارات canvas مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- عادةً لا ترسل Node WebViews ترويسات المصادقة؛ بعد إقران Node واتصالها، يعلن Gateway عن عناوين URL للقدرات محددة النطاق للـ Node للوصول إلى canvas/A2UI.
- ترتبط عناوين URL للقدرات بجلسة WS النشطة للـ Node وتنتهي سريعًا. لا يُستخدم بديل قائم على IP.
- يحقن عميل إعادة التحميل المباشر في HTML المقدّم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون فارغًا.
- يقدّم أيضًا A2UI عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
- عطّل إعادة التحميل المباشر للمجلدات الكبيرة أو أخطاء `EMFILE`.

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

- `minimal` (الافتراضي): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` + `sshPort`.
- يكون اسم المضيف افتراضيًا اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة unicast DNS-SD ضمن `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، اقرنه بخادم DNS (يوصى بـ CoreDNS) + Tailscale split DNS.

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

- لا تُطبّق متغيرات البيئة المضمنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` (لا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول لديك.
- راجع [البيئة](/ar/help/environment) لمعرفة أسبقية التطبيق الكاملة.

### استبدال متغيرات البيئة

أشر إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تُطابق الأسماء المكتوبة بالأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- المتغيرات المفقودة/الفارغة تؤدي إلى خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للتهريب إلى القيمة الحرفية `${VAR}`.
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

- نمط `provider`:‏ `^[a-z][a-z0-9_-]{0,63}$`
- نمط معرّف `source: "env"`:‏ `^[A-Z][A-Z0-9_]{0,127}$`
- معرّف `source: "file"`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط معرّف `source: "exec"`:‏ `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار محددة بشرطة مائلة هي `.` أو `..` (مثلًا يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة المرجعية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- مراجع `auth-profiles.json` مضمنة في الحلّ أثناء وقت التشغيل وتغطية التدقيق.

### إعدادات مزوّدي الأسرار

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

- يدعم مزوّد `file` الوضع `mode: "json"` والوضع `mode: "singleValue"` (يجب أن يكون `id` هو `"value"` في وضع singleValue).
- تفشل مسارات مزوّدَي الملفات والتنفيذ بشكل مغلق عندما لا يتوفر التحقق من Windows ACL. عيّن `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب مزوّد `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيًا، تُرفض مسارات أوامر الروابط الرمزية. عيّن `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا ضُبطت `trustedDirs`، فسيُطبّق فحص الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة الابن لـ `exec` محدودة افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار عند وقت التنشيط إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلبات اللقطة فقط.
- تُطبّق تصفية الأسطح النشطة أثناء التنشيط: تؤدي المراجع غير المحلولة على الأسطح المفعّلة إلى فشل بدء التشغيل/إعادة التحميل، بينما تُتخطّى الأسطح غير النشطة مع تشخيصات.

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

- تُخزّن ملفات التعريف لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست تنسيقًا لوقت التشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات تعريف مفتاح API مرجعية بصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- ملفات التعريف بوضع OAuth (`auth.profiles.<id>.mode = "oauth"`) لا تدعم بيانات اعتماد ملفات تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ وتُنظّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
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

- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عندما يفشل ملف تعريف بسبب أخطاء
  فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). قد يظل نص الفوترة الصريح
  ينتهي هنا حتى في استجابات `401`/`403`، لكن مطابِقات النص الخاصة بالمزوّد
  تبقى محصورة بالمزوّد الذي يملكها (مثل OpenRouter
  `Key limit exceeded`). تبقى رسائل نافذة استخدام HTTP `402` القابلة لإعادة المحاولة أو
  حدود إنفاق المؤسسة/مساحة العمل في مسار `rate_limit`
  بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدويرات ملف تعريف المصادقة ضمن المزوّد نفسه لأخطاء التحميل الزائد قبل التحويل إلى بديل النموذج (الافتراضي: `1`). تصل الأشكال التي تشير إلى انشغال المزوّد مثل `ModelNotReadyException` إلى هنا.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف محمّل زيادةً عن طاقته (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدويرات ملف تعريف المصادقة ضمن المزوّد نفسه لأخطاء حدود المعدل قبل التحويل إلى بديل النموذج (الافتراضي: `1`). يشمل مجمّع حدود المعدل هذا نصوصًا ذات شكل خاص بالمزوّد مثل `Too many concurrent requests`، و`ThrottlingException`، و`concurrency limit reached`، و`workers_ai ... quota limit exceeded`، و`resource exhausted`.

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
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل النشط بالبايت قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 ميغابايت). يحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقمة بجانب الملف النشط.
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونصوص نسخ جلسات العمل المحفوظة. `redactSensitive: "off"` يعطّل سياسة السجل/النسخ العامة هذه فقط؛ وتظل واجهات أمان واجهة المستخدم/الأدوات/التشخيص تحجب الأسرار قبل الإرسال.

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

- `enabled`: مفتاح التفعيل الرئيسي لمخرجات القياس والتتبّع (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل الأعلام التي تفعّل مخرجات سجل موجّهة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: حد عمر عدم التقدم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل على أنها `session.long_running` أو `session.stalled` أو `session.stuck`. تعيد الردود والأدوات والحالة والكتل وتقدم ACP ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت بلا تغيير.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`). للاطلاع على التكوين الكامل، وفهرس الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع لتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بكل إشارة. عند تعيينها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبّع أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات التتبّع `0`-`1`.
- `otel.flushIntervalMs`: فاصل التفريغ الدوري للقياسات بالمللي ثانية.
- `otel.captureContent`: التقاط محتوى خام اختياري لسمات نطاق OTEL. يكون معطلاً افتراضياً. القيمة المنطقية `true` تلتقط محتوى الرسائل/الأدوات غير النظامي؛ وتتيح صيغة الكائن تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحةً.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لسمات موفر نطاق GenAI التجريبية الأحدث. افتراضياً، تحتفظ النطاقات بسمة `gen_ai.system` القديمة للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفين الذين سجّلوا بالفعل SDK عاماً لـ OpenTelemetry. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بالإشارات تُستخدم عندما لا يكون مفتاح التكوين المطابق معيناً.
- `cacheTrace.enabled`: تسجيل لقطات تتبع الذاكرة المؤقتة للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار إخراج JSONL لتتبع الذاكرة المؤقتة (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم في ما يُضمَّن في مخرجات تتبع الذاكرة المؤقتة (كلها افتراضياً: `true`).

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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ عيّنها إلى `false` لإخفاء إمكانات إرسال ACP والإنشاء).
- `dispatch.enabled`: بوابة مستقلة لإرسال دور جلسة ACP (الافتراضي: `true`). عيّنها إلى `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف خلفية تشغيل ACP الافتراضي (يجب أن يطابق Plugin تشغيل ACP مسجلاً).
  إذا تم تعيين `plugins.allow`، فأضف معرّف Plugin الخلفية (مثل `acpx`) وإلا فلن يتم تحميل Plugin الافتراضي المضمّن.
- `defaultAgent`: معرّف الوكيل الهدف الاحتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفاً صريحاً.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات تشغيل ACP؛ تعني القيمة الفارغة عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة في الوقت نفسه.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: كبح أسطر الحالة/الأدوات المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: `"live"` يبث تدريجياً؛ أما `"final_only"` فيخزّن مؤقتاً حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف لأسطر حالة/تحديث ACP المعروضة.
- `stream.tagVisibility`: سجل بأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعمال جلسات ACP قبل أن تصبح مؤهلة للتنظيف.
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

- يتحكم `cli.banner.taglineMode` في نمط عبارة الشعار:
  - `"random"` (الافتراضي): عبارات طريفة/موسمية متناوبة.
  - `"default"`: عبارة حيادية ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: لا توجد عبارة نصية (مع استمرار عرض عنوان/إصدار الشعار).
- لإخفاء الشعار بالكامل (وليس العبارات فقط)، عيّن متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية تكتبها تدفقات الإعداد الموجّه عبر CLI (`onboard` و`configure` و`doctor`):

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

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل العقد عبر WebSocket الخاص بـ Gateway. لم تعد مفاتيح `bridge.*` جزءاً من مخطط التكوين (يفشل التحقق حتى تتم إزالتها؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

<Accordion title="Legacy bridge config (historical reference)">

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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. يتحكم أيضاً في تنظيف نسخ Cron المحذوفة المؤرشفة. الافتراضي: `24h`؛ عيّنه إلى `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى للحجم لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر المحتفظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز حامل يُستخدم لتسليم POST الخاص بـ Webhook في Cron (`delivery.mode = "webhook"`)، وإذا حُذف فلن تُرسل ترويسة مصادقة.
- `webhook`: عنوان URL احتياطي قديم ومهمل لـ Webhook (http/https) يُستخدم فقط للمهام المخزنة التي ما زالت تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادة المحاولة للمهام أحادية التشغيل عند الأخطاء العابرة (الافتراضي: `3`؛ النطاق: `0`-`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تطلق إعادة المحاولة — `"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة المحاولة لكل الأنواع العابرة.

ينطبق فقط على مهام Cron أحادية التشغيل. تستخدم المهام المتكررة معالجة فشل منفصلة.

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
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة لنفس المهمة (عدد صحيح غير سالب).
- `includeSkipped`: احتساب التشغيلات المتخطاة المتتالية ضمن حد التنبيه (الافتراضي: `false`). تُتتبع التشغيلات المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
- `mode`: وضع التسليم — يرسل `"announce"` عبر رسالة قناة؛ وينشر `"webhook"` إلى Webhook المكوّن.
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

- الوجهة الافتراضية لإشعارات فشل Cron عبر جميع المهام.
- `mode`:‏ `"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عند توفر بيانات كافية عن الهدف.
- `channel`: تجاوز القناة لتسليم الإعلانات. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب في وضع Webhook.
- `accountId`: تجاوز اختياري للحساب المستخدم في التسليم.
- يتجاوز `delivery.failureDestination` لكل مهمة هذا الإعداد الافتراضي العام.
- عندما لا تُعيَّن وجهة فشل عامة أو خاصة بالمهمة، فإن المهام التي تُسلِّم بالفعل عبر `announce` تعود عند الفشل إلى هدف الإعلان الأساسي ذاك.
- لا يُدعم `delivery.failureDestination` إلا للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتتبَّع عمليات تنفيذ Cron المعزولة بصفتها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

تُوسَّع عناصر القالب النائبة في `tools.media.models[].args`:

| المتغير            | الوصف                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة بالكامل                        |
| `{{RawBody}}`      | النص الخام (بلا أغلفة السجل/المرسل)               |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعات                   |
| `{{From}}`         | معرّف المرسل                                      |
| `{{To}}`           | معرّف الوجهة                                      |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID للجلسة الحالية                               |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                     |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                    |
| `{{MediaPath}}`    | مسار الوسائط المحلي                               |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)                   |
| `{{Transcript}}`   | نص التفريغ الصوتي                                 |
| `{{Prompt}}`       | موجّه الوسائط المحلول لإدخالات CLI                |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الخرج لإدخالات CLI      |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                        |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)                 |
| `{{SenderName}}`   | اسم عرض المرسل (بأفضل جهد)                        |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                       |
| `{{Provider}}`     | تلميح المزوّد (WhatsApp وTelegram وDiscord، إلخ)  |

---

## تضمينات الإعدادات (`$include`)

قسّم الإعدادات إلى عدة ملفات:

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
- مصفوفة ملفات: تُدمج بعمق وفق الترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (وتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبةً إلى الملف الذي يحتوي التضمين، لكن يجب أن تبقى داخل دليل الإعدادات الأعلى مستوى (`dirname` لـ `openclaw.json`). لا يُسمح بالصيغ المطلقة/`../` إلا عندما تظل تُحل داخل ذلك الحد.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسماً واحداً فقط من المستوى الأعلى مدعوماً بتضمين ملف واحد تكتب مباشرة إلى ذلك الملف المضمّن. على سبيل المثال، يحدّث `plugins install` القيمة `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة تكون للقراءة فقط بالنسبة إلى عمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بإغلاق آمن بدلاً من تسطيح الإعدادات.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [الإعدادات](/ar/gateway/configuration)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
