---
read_when:
    - تحتاج إلى دلالات دقيقة على مستوى حقول الإعدادات أو القيم الافتراضية
    - أنت تتحقق من كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية والروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:28:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c6e12c328cfc3de71e401ae48b44343769c4f6b063479c8ffa4d0e690a2433
    source_path: gateway/configuration-reference.md
    workflow: 15
---

مرجع الإعدادات الأساسي لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجّهة حسب المهام، راجع [الإعدادات](/ar/gateway/configuration).

يغطي هذا الأسطح الرئيسية لإعدادات OpenClaw ويضع روابط خارجية عندما يكون لنظام فرعي مرجع أعمق خاص به. وتوجد فهارس الأوامر المملوكة للقنوات وPlugins، وكذلك خيارات الذاكرة/QMD المتقدمة، في صفحاتها الخاصة بدلًا من هذه الصفحة.

الحقيقة في الشيفرة:

- يطبع `openclaw config schema` مخطط JSON الحي المستخدم للتحقق وControl UI، مع دمج بيانات التعريف المضمّنة/الخاصة بالـ Plugin/القناة عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة مقيّدة بالمسار لأدوات التعمق
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط الأساس لوثائق الإعدادات مقابل سطح المخطط الحالي

مسار البحث عن الوكيل: استخدم إجراء أداة `gateway` المسمى `config.schema.lookup` من أجل
الحصول على وثائق دقيقة وقيود على مستوى الحقول قبل التعديلات. واستخدم
[الإعدادات](/ar/gateway/configuration) للإرشادات الموجّهة حسب المهام وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية.

المراجع المتقدمة المخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) من أجل `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [الأوامر المائلة](/ar/tools/slash-commands) لفهرس الأوامر المضمّنة والمضمّنة عبر Plugins الحالي
- صفحات القناة/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

صيغة الإعدادات هي **JSON5** ‏(يُسمح بالتعليقات والفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

نُقلت مفاتيح الإعدادات الخاصة بكل قناة إلى صفحة مخصصة — راجع
[الإعدادات — القنوات](/ar/gateway/config-channels) من أجل `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والقنوات
المضمّنة الأخرى (المصادقة، والتحكم في الوصول، والحسابات المتعددة، وتقييد الإشارات).

## افتراضيات الوكيل، والوكلاء المتعددون، والجلسات، والرسائل

نُقلت إلى صفحة مخصصة — راجع
[الإعدادات — الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` ‏(مساحة العمل، والنموذج، والتفكير، وHeartbeat، والذاكرة، والوسائط، وSkills، وsandbox)
- `multiAgent.*` ‏(توجيه الوكلاء المتعددين والربط)
- `session.*` ‏(دورة حياة الجلسة، وCompaction، والتقليم)
- `messages.*` ‏(تسليم الرسائل، وTTS، وعرض Markdown)
- `talk.*` ‏(وضع Talk)
  - `talk.speechLocale`: معرّف لغة اختياري من BCP 47 للتعرّف على الكلام في Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم تعيينه، يحتفظ Talk بنافذة التوقف الافتراضية للمنصة قبل إرسال النص المفرغ (`700 ms على macOS وAndroid، و900 ms على iOS`)

## الأدوات والمزوّدون المخصصون

نُقل نهج الأدوات، والمفاتيح التجريبية، وإعدادات الأدوات المدعومة بالمزوّد، وإعداد المزوّد المخصص / `base-URL` إلى صفحة مخصصة — راجع
[الإعدادات — الأدوات والمزوّدون المخصصون](/ar/gateway/config-tools).

## MCP

توجد تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` وتُستخدم بواسطة
Pi المضمّن ووحدات تكييف وقت التشغيل الأخرى. وتدير الأوامر `openclaw mcp list`
و`show` و`set` و`unset` هذه الكتلة من دون الاتصال بالخادم
المستهدف أثناء تعديلات الإعدادات.

```json5
{
  mcp: {
    // اختياري. الافتراضي: 600000 ms (10 دقائق). اضبطه على 0 لتعطيل الإخلاء عند الخمول.
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

- `mcp.servers`: تعريفات خوادم MCP مسماة من نوع stdio أو بعيدة لبيئات التشغيل التي
  تكشف أدوات MCP المُهيأة.
- `mcp.sessionIdleTtlMs`: مهلة الخمول لـ runtimes MCP المضمّنة ذات نطاق الجلسة.
  تطلب التشغيلات المضمّنة أحادية الاستخدام تنظيفًا عند نهاية التشغيل؛ وتشكّل هذه المهلة
  صمام الأمان للجلسات طويلة العمر والمستدعين المستقبليين.
- تُطبَّق التغييرات تحت `mcp.*` بسرعة عبر التخلص من runtimes MCP المخزنة مؤقتًا للجلسة.
  ويؤدي اكتشاف الأداة/استخدامها التالي إلى إعادة إنشائها من الإعدادات الجديدة، بحيث تُزال
  إدخالات `mcp.servers` المحذوفة فورًا بدلًا من انتظار مهلة الخمول.

راجع [MCP](/ar/cli/mcp#openclaw-as-an-mcp-client-registry) و
[واجهات CLI الخلفية](/ar/gateway/cli-backends#bundle-mcp-overlays) لسلوك وقت التشغيل.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو سلسلة نصية عادية
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: قائمة سماح اختيارية للـ Skills المضمّنة فقط (لا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أولوية).
- `install.preferBrew`: عندما تكون قيمته true، فضّل برامج التثبيت عبر Homebrew عندما يكون `brew`
  متاحًا قبل الرجوع إلى أنواع مثبتات أخرى.
- `install.nodeManager`: تفضيل مثبت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` يعطّل Skill حتى لو كانت مضمّنة/مثبتة.
- `entries.<skillKey>.apiKey`: حقل ملاءمة لمفتاح API للـ Skills التي تعلن متغير env أساسيًا (سلسلة نصية عادية أو كائن SecretRef).

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

- تُحمَّل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions` بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins OpenClaw الأصلية بالإضافة إلى حِزم Codex المتوافقة وحِزم Claude، بما في ذلك حِزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (لا تُحمَّل إلا Plugins المدرجة). وتفوز `deny`.
- `plugins.entries.<id>.apiKey`: حقل ملاءمة على مستوى Plugin لمفتاح API (عندما تدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات env ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، تمنع النواة `before_prompt_build` وتتجاهل الحقول المعدِّلة للمطالبات من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على hooks الخاصة بالـ Plugin الأصلية وعلى أدلة hooks التي توفّرها الحِزم المدعومة.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن للـ Plugins غير المضمّنة والموثوقة قراءة محتوى المحادثة الخام من hooks ذات الأنواع مثل `llm_input` و`llm_output` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: يثق صراحةً بهذه Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لعمليات الوكيل الفرعي في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية للأهداف القياسية `provider/model` الخاصة بتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات معرّف بواسطة Plugin (ويُتحقق منه بواسطة مخطط Plugin الأصلي لـ OpenClaw عند توفره).
- توجد إعدادات الحساب/وقت التشغيل الخاصة بPlugins القنوات ضمن `channels.<id>` ويجب أن توصف بواسطة بيانات تعريف `channelConfigs` في manifest الخاص بالـ Plugin المالكة، وليس بواسطة سجل خيارات OpenClaw مركزي.
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزوّد Firecrawl لجلب الويب.
  - `apiKey`: مفتاح API لـ Firecrawl ‏(يقبل SecretRef). ويرجع إلى `plugins.entries.firecrawl.config.webSearch.apiKey`، أو `tools.web.fetch.firecrawl.apiKey` القديم، أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان API الأساسي لـ Firecrawl ‏(الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر الذاكرة المؤقتة بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search ‏(بحث الويب Grok).
  - `enabled`: تمكين مزوّد X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل جولة Dreaming كاملة (`"0 3 * * *"` افتراضيًا).
  - نهج المراحل والعتبات هي تفاصيل تنفيذ (وليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضًا لحِزم Claude المفعّلة أن تسهم بافتراضيات Pi مضمنة من `settings.json`؛ ويطبّقها OpenClaw كإعدادات وكيل معقمة، وليس كرقع إعدادات خام لـ OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشطة، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ والافتراضي `"legacy"` ما لم تثبّت وتحدد محركًا آخر.

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
      // dangerouslyAllowPrivateNetwork: true, // اشترك فقط للوصول إلى شبكة خاصة موثوقة
      // allowPrivateNetwork: true, // اسم بديل قديم
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

- يؤدي `evaluateEnabled: false` إلى تعطيل `act:evaluate` و`wait --fn`.
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد مدة الخمول أو عندما تتجاوز
  الجلسة الحد الأقصى الخاص بها. اضبط `idleMinutes: 0` أو `maxTabsPerSession: 0` إلى
  تعطيل أوضاع التنظيف الفردية تلك.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلًا عند عدم تعيينه، لذلك تبقى ملاحة المتصفح صارمة افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا في ملاحة المتصفح داخل الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه الخاص بالشبكة الخاصة أثناء فحوصات قابلية الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم بديل قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- تكون ملفات التعريف البعيدة بنمط attach-only ‏(بدء/إيقاف/إعادة تعيين معطلة).
- تقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك المزوّد بعنوان DevTools WebSocket مباشر.
- تنطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية الوصول إلى CDP للملفات البعيدة وملفات
  `attachOnly` بالإضافة إلى طلبات فتح علامات التبويب. وتحافظ ملفات
  loopback المُدارة على القيم الافتراضية المحلية لـ CDP.
- إذا كانت خدمة CDP المُدارة خارجيًا قابلة للوصول عبر loopback، فاضبط
  `attachOnly: true` لذلك الملف؛ وإلا فسيتعامل OpenClaw مع منفذ loopback
  على أنه ملف متصفح محلي مُدار وقد يبلّغ عن أخطاء ملكية المنافذ المحلية.
- تستخدم ملفات `existing-session` Chrome MCP بدلًا من CDP ويمكنها الاتصال
  بالمضيف المحدد أو عبر Node متصفح متصل.
- يمكن لملفات `existing-session` تعيين `userDataDir` لاستهداف ملف تعريف
  محدد لمتصفح مبني على Chromium مثل Brave أو Edge.
- تحتفظ ملفات `existing-session` بحدود المسار الحالية لـ Chrome MCP:
  إجراءات معتمدة على snapshot/ref بدلًا من الاستهداف بمحددات CSS، وخطافات رفع ملف واحد،
  وعدم وجود تجاوزات لمهلة مربعات الحوار، وعدم وجود `wait --load networkidle`، وعدم وجود
  `responsebody` أو تصدير PDF أو اعتراض التنزيلات أو الإجراءات المجمعة.
- تقوم ملفات `openclaw` المحلية المُدارة بتعيين `cdpPort` و`cdpUrl` تلقائيًا؛ لا تضبط
  `cdpUrl` صراحةً إلا لـ CDP البعيد.
- يمكن لملفات التعريف المحلية المُدارة تعيين `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف. استخدم هذا لتشغيل ملف تعريف في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية و`browser.localCdpReadyTimeoutMs` من أجل
  جاهزية CDP websocket بعد التشغيل. ارفعهما على المضيفين الأبطأ حيث يبدأ Chrome
  بنجاح لكن فحوصات الجاهزية تتسابق مع بدء التشغيل. ويجب أن تكون كلتا القيمتين
  أعدادًا صحيحة موجبة حتى `120000` ms؛ وتُرفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنيًا على Chromium ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  القيم `~` و`~/...` لدليل المنزل في نظام التشغيل قبل تشغيل Chromium.
  كما يتم توسيع علامة التلدة في `userDataDir` لكل ملف تعريف ضمن `existing-session`.
- خدمة Control: loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- تضيف `extraArgs` أعلام تشغيل إضافية إلى بدء Chromium المحلي (مثل
  `--disable-gpu` أو تحديد حجم النافذة أو أعلام التصحيح).

---

## واجهة المستخدم

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji أو نص قصير أو URL لصورة أو data URI
    },
  },
}
```

- `seamColor`: لون التمييز لواجهة التطبيق الأصلية (مثل صبغة فقاعة وضع Talk وغيرها).
- `assistant`: تجاوز هوية Control UI. ويرجع إلى هوية الوكيل النشط.

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
      // password: "your-password", // أو OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // لـ mode=trusted-proxy؛ راجع /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // خطير: السماح بعناوين embed خارجية مطلقة من نوع http(s)
      // allowedOrigins: ["https://control.example.com"], // مطلوب لـ Control UI غير المعتمدة على loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // وضع خطير للرجوع إلى الأصل عبر ترويسة Host
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
    // اختياري. الافتراضي false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // اختياري. الافتراضي غير معيّن/معطّل.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // عمليات منع HTTP إضافية لـ /tools/invoke
      deny: ["browser"],
      // إزالة أدوات من قائمة المنع الافتراضية لـ HTTP
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

- `mode`: ‏`local` ‏(تشغيل Gateway) أو `remote` ‏(الاتصال بـ Gateway بعيد). ويرفض Gateway البدء ما لم يكن `local`.
- `port`: منفذ متعدد الإرسال واحد لكل من WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` ‏(الافتراضي) أو `lan` ‏(`0.0.0.0`) أو `tailnet` ‏(عنوان Tailscale IP فقط) أو `custom`.
- **أسماء bind البديلة القديمة**: استخدم قيم وضع bind في `gateway.bind` ‏(`auto` و`loopback` و`lan` و`tailnet` و`custom`)، وليس الأسماء البديلة للمضيف (`0.0.0.0` و`127.0.0.1` و`localhost` و`::` و`::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. ومع Docker bridge networking ‏(`-p 18789:18789`) تصل الحركة على `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو اضبط `bind: "lan"` ‏(أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. وتتطلب bindات غير loopback مصادقة Gateway. وعمليًا يعني ذلك رمزًا/كلمة مرور مشتركة أو reverse proxy مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`. ويولّد معالج الإعداد الأولي رمزًا افتراضيًا.
- إذا جرى ضبط كل من `gateway.auth.token` و`gateway.auth.password` ‏(بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً إلى `token` أو `password`. وتفشل عمليات البدء وتثبيت/إصلاح الخدمة عند ضبط الاثنين مع ترك الوضع غير معيّن.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات loopback المحلية الموثوقة؛ ولا يُعرض هذا عمدًا في مطالبات الإعداد الأولي.
- `gateway.auth.mode: "trusted-proxy"`: فوّض المصادقة إلى reverse proxy مدرك للهوية واثقًا بترويسات الهوية من `gateway.trustedProxies` ‏(راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع **مصدر proxy غير loopback**؛ ولا تلبّي reverse proxies الخاصة بالمضيف نفسه عبر loopback متطلبات مصادقة trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve تلبية مصادقة Control UI/WebSocket ‏(بعد التحقق عبر `tailscale whois`). ولا تستخدم نقاط نهاية HTTP API تلك المصادقة عبر ترويسات Tailscale؛ بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway بدلًا من ذلك. ويفترض هذا التدفق من دون رمز أن مضيف Gateway موثوق. والقيمة الافتراضية هي `true` عندما يكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدِّد اختياري لمحاولات المصادقة الفاشلة. ويُطبَّق لكل IP عميل ولكل نطاق مصادقة (يُتتبّع كل من السر المشترك ورمز الجهاز بشكل مستقل). وتُرجع المحاولات المحظورة `429` + `Retry-After`.
  - على مسار Control UI غير المتزامن عبر Tailscale Serve، تُسلسل المحاولات الفاشلة الخاصة بنفس `{scope, clientIp}` قبل كتابة الإخفاق. ولذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تُفعّل المحدِّد عند الطلب الثاني بدلًا من مرور الاثنين كعدم تطابق عادي.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها إلى `false` عندما تريد عمدًا أيضًا تقييد حركة localhost بالمعدل (لإعدادات الاختبار أو deployments الوكيلة الصارمة).
- تُخنق دائمًا محاولات مصادقة WS ذات أصل المتصفح مع تعطيل إعفاء loopback (كإجراء دفاعي إضافي ضد هجمات brute force المحلية من المتصفح).
- على loopback، تُعزل عمليات القفل ذات أصل المتصفح تلك لكل قيمة
  `Origin` مطبّعة، بحيث لا تؤدي الإخفاقات المتكررة من أصل localhost واحد
  تلقائيًا إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` ‏(tailnet فقط، مع bind loopback) أو `funnel` ‏(عام، ويتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. وهي مطلوبة عندما يُتوقع عملاء متصفح من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع إلى أصل Host-header في deployments التي تعتمد عمدًا على سياسة الأصل عبر Host-header.
- `remote.transport`: ‏`ssh` ‏(الافتراضي) أو `direct` ‏(ws/wss). وبالنسبة إلى `direct`، يجب أن يكون `remote.url` هو `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ على مستوى بيئة عملية العميل
  يتيح استخدام `ws://` غير المشفر إلى عناوين IP للشبكات الخاصة الموثوقة؛
  ويظل الافتراضي مقصورًا على loopback فقط للاتصالات النصية غير المشفرة. ولا يوجد
  ما يقابله في `openclaw.json`، كما أن إعدادات الشبكات الخاصة الخاصة بالمتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` لا تؤثر في عملاء
  Gateway WebSocket.
- `gateway.remote.token` / `.password` هما حقلا بيانات اعتماد للعميل البعيد. ولا يضبطان مصادقة Gateway بمفردهما.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي للـ APNs relay الخارجي المستخدم بواسطة إصدارات iOS الرسمية/TestFlight بعد أن تنشر عمليات التسجيل المدعومة بالـ relay إلى Gateway. ويجب أن يطابق هذا العنوان عنوان relay المضمّن في إصدار iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى relay بالمللي ثانية. والقيمة الافتراضية `10000`.
- تُفوَّض التسجيلات المدعومة بالـ relay إلى هوية Gateway محددة. ويجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل relay، ويمرر تفويض إرسال ضمن نطاق التسجيل إلى Gateway. ولا يمكن لـ Gateway أخرى إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات مؤقتة عبر env لإعداد relay أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: مخرج طوارئ مخصص للتطوير فقط لعناوين relay من نوع loopback HTTP. ويجب أن تبقى عناوين relay الإنتاجية على HTTPS.
- `gateway.channelHealthCheckMinutes`: فترة مراقبة صحة القناة بالدقائق. اضبطها على `0` لتعطيل عمليات إعادة التشغيل الخاصة بمراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة socket القديمة بالدقائق. حافظ على هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لعمليات إعادة التشغيل من مراقب الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل على مستوى القناة لإعادات تشغيل مراقب الصحة مع الإبقاء على المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز على مستوى الحساب للقنوات متعددة الحسابات. وعند تعيينه، فإنه يأخذ الأولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كرجوع احتياطي فقط عندما لا تكون `gateway.auth.*` مضبوطة.
- إذا جرى ضبط `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وتعذر حلهما، فإن الحل يفشل بشكل مغلق (من دون إخفاء ذلك عبر رجوع احتياطي بعيد).
- `trustedProxies`: عناوين IP للـ reverse proxy التي تنهي TLS أو تضيف ترويسات العميل المُمرَّر. أدرج فقط الوكلاء الذين تتحكم بهم. ولا تزال إدخالات loopback صالحة لإعدادات proxy الخاصة بالمضيف نفسه/اكتشافه المحلي (مثل Tailscale Serve أو reverse proxy محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل Gateway قيمة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. الافتراضي `false` لسلوك فشل مغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح CIDR/IP اختيارية للموافقة التلقائية على اقتران أجهزة Node لأول مرة من دون أي نطاقات مطلوبة. وتكون معطلة عندما لا تُضبط. ولا يوافق هذا تلقائيًا على اقتران operator/browser/Control UI/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل عالمي للسماح/المنع للأوامر المعلنة في Node بعد الاقتران وتقييم قائمة السماح.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` ‏(توسّع قائمة المنع الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة المنع الافتراضية لـ HTTP.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطلة افتراضيًا. فعّلها عبر `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامَل قوائم السماح الفارغة على أنها غير معيّنة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة تقوية استجابة اختيارية:
  - `gateway.http.securityHeaders.strictTransportSecurity` ‏(اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد باستخدام منافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام الملاءمة: `--dev` ‏(يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` ‏(يستخدم `~/.openclaw-<name>`).

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

- `enabled`: يفعّل إنهاء TLS عند مستمع Gateway ‏(HTTPS/WSS) ‏(الافتراضي: `false`).
- `autoGenerate`: يولد تلقائيًا زوج cert/key محليًا موقّعًا ذاتيًا عندما لا تكون الملفات الصريحة مُهيأة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ ويجب إبقاء أذوناته مقيّدة.
- `caPath`: مسار اختياري لحزمة CA من أجل التحقق من العميل أو سلاسل الثقة المخصصة.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات أثناء وقت التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ وتتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` ‏(الافتراضي): جرّب أولًا إعادة التحميل السريع؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة debounce بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: حد أقصى اختياري بالمللي ثانية لانتظار العمليات قيد التنفيذ قبل فرض إعادة تشغيل. احذفه أو اضبطه على `0` للانتظار إلى أجل غير مسمى مع تسجيل تحذيرات دورية بشأن العمليات التي لا تزال معلقة.

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

- يتطلب `hooks.enabled=true` قيمة غير فارغة لـ `hooks.token`.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ ويُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كانت `hooks.allowRequestSessionKey=true`، فقيد `hooks.allowedSessionKeyPrefixes` ‏(مثلًا `["hook:"]`).
- إذا كان mapping أو preset يستخدم `sessionKey` مُصاغًا بقالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. ولا تتطلب مفاتيح mapping الثابتة هذا الاشتراك.

**نقاط النهاية:**

- `POST /hooks/wake` → ‏`{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → ‏`{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` ‏(الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في الـ mapping الناتجة عن القوالب على أنها مزوّدة خارجيًا، وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل الـ Mapping">

- يطابق `match.path` المسار الفرعي بعد `/hooks` ‏(مثلًا `/hooks/gmail` → ‏`gmail`).
- يطابق `match.source` حقلًا من الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا وأن يبقى ضمن `hooks.transformsDir` ‏(تُرفض المسارات المطلقة واجتياز المجلدات).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، `[]` = المنع للجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات hook agent من دون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لمستدعي `/hooks/agent` ولمفاتيح جلسة الـ mapping المدفوعة بالقوالب بتعيين `sessionKey` ‏(الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + الـ mapping)، مثل `["hook:"]`. وتصبح مطلوبة عندما يستخدم أي mapping أو preset قيمة `sessionKey` مُصاغة بقالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ وتكون القيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` قيمة LLM لهذا التشغيل الخاص بالـ hook ‏(ويجب السماح به إذا كان فهرس النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم preset Gmail المضمّن القيمة `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت على هذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لتطابق مساحة أسماء Gmail، مثل `["hook:", "hook:gmail:"]`.
- إذا كنت تحتاج إلى `hooks.allowRequestSessionKey: false`، فتجاوز preset باستخدام `sessionKey` ثابت بدلًا من القيمة الافتراضية المصاغة بالقالب.

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

- يشغّل Gateway تلقائيًا `gog gmail watch serve` عند الإقلاع عندما يكون مُهيأً. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` لتعطيله.
- لا تشغّل `gog gmail watch serve` منفصلًا إلى جانب Gateway.

---

## مضيف Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // أو OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- يقدّم HTML/CSS/JS القابلة للتحرير بواسطة الوكيل وA2UI عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` ‏(الافتراضي).
- في bindات غير loopback: تتطلب مسارات canvas مصادقة Gateway ‏(token/password/trusted-proxy)، مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل Node WebViews عادةً ترويسات المصادقة؛ وبعد اقتران Node واتصالها، يعلن Gateway عن عناوين capability ضمن نطاق Node للوصول إلى canvas/A2UI.
- ترتبط عناوين capability URL بجلسة WS النشطة الخاصة بـ Node وتنتهي صلاحيتها بسرعة. ولا يُستخدم رجوع احتياطي قائم على IP.
- يحقن عميل live reload في HTML المقدّم.
- ينشئ تلقائيًا `index.html` ابتدائيًا عندما يكون المجلد فارغًا.
- يقدّم أيضًا A2UI على `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
- عطّل live reload للأدلة الكبيرة أو عند ظهور أخطاء `EMFILE`.

---

## الاكتشاف

### ‏mDNS ‏(Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` ‏(الافتراضي): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` + `sshPort`.
- يكون اسم المضيف افتراضيًا `openclaw`. ويمكن تجاوزه عبر `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق ‏(DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة unicast DNS-SD ضمن `~/.openclaw/dns/`. ولاكتشاف عبر الشبكات، قرنه بخادم DNS ‏(يُوصى بـ CoreDNS) + Tailscale split DNS.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` ‏(متغيرات env مضمّنة)

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

- لا تُطبَّق متغيرات env المضمّنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ‏`.env` في CWD + ‏`~/.openclaw/.env` ‏(ولا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف login shell الخاص بك.
- راجع [البيئة](/ar/help/environment) للاطلاع على ترتيب الأولوية الكامل.

### استبدال متغيرات env

أشِر إلى متغيرات env داخل أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تُطابق الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للهروب والحصول على `${VAR}` حرفيًا.
- يعمل ذلك مع `$include`.

---

## الأسرار

مراجع الأسرار إضافية: لا تزال القيم النصية العادية تعمل.

### `SecretRef`

استخدم شكل كائن واحد:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط المعرّف لـ `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ‏`id`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط المعرّف لـ `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار مفصولة بشرطات مائلة من نوع `.` أو `..` ‏(مثلًا `a/../b` مرفوض)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القياسية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُدرج مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### إعدادات مزوّدي الأسرار

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // مزوّد env صريح اختياري
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

- يدعم مزوّد `file` الوضعين `mode: "json"` و`mode: "singleValue"` ‏(ويجب أن يكون `id` هو `"value"` في وضع singleValue).
- تفشل مسارات مزوّدي file وexec بشكل مغلق عندما لا يكون التحقق من Windows ACL متاحًا. اضبط `allowInsecurePath: true` فقط للمسارات الموثوقة التي يتعذر التحقق منها.
- يتطلب مزوّد `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول على stdin/stdout.
- تُرفض مسارات الأوامر المرتبطة رمزيًا افتراضيًا. اضبط `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من المسار الهدف المحلول.
- إذا جرى تهيئة `trustedDirs`، فيُطبَّق فحص الدليل الموثوق على المسار الهدف المحلول.
- تكون بيئة الابن في `exec` محدودة افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار عند وقت التفعيل إلى لقطة في الذاكرة، ثم تقرأ مسارات الطلب هذه اللقطة فقط.
- يُطبَّق ترشيح الأسطح النشطة أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح المفعّلة إلى فشل البدء/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع تشخيصات.

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
- يدعم `auth-profiles.json` المراجع على مستوى القيم (`keyRef` لـ `api_key` و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- لا تدعم ملفات التعريف بوضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملفات تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- تتم عمليات استيراد OAuth القديمة من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك وقت تشغيل الأسرار وأدوات `audit/configure/apply`: ‏[إدارة الأسرار](/ar/gateway/secrets).

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

- `billingBackoffHours`: التراجع الأساسي بالساعات عندما يفشل ملف تعريف بسبب أخطاء
  الفوترة الحقيقية/عدم كفاية الرصيد (الافتراضي: `5`). ويمكن أن يصل نص فوترة صريح
  إلى هذا المسار حتى على استجابات `401`/`403`، لكن مطابقات النصوص الخاصة بالمزوّد
  تبقى ضمن نطاق المزوّد الذي يملكها (مثل OpenRouter
  ‏`Key limit exceeded`). أما رسائل `402` القابلة لإعادة المحاولة الخاصة بنافذة الاستخدام
  أو حد الإنفاق للمؤسسة/مساحة العمل فتبقى في مسار `rate_limit`
  بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأعلى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: التراجع الأساسي بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأعلى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: النافذة المتحركة بالساعات المستخدمة لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدويرات ملف تعريف المصادقة ضمن المزوّد نفسه لأخطاء التحميل الزائد قبل التبديل إلى البديل الاحتياطي للنموذج (الافتراضي: `1`). وتصل أشكال انشغال المزوّد مثل `ModelNotReadyException` إلى هذا المسار.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير المزوّد/ملف التعريف المحمّل فوق طاقته (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدويرات ملف تعريف المصادقة ضمن المزوّد نفسه لأخطاء تحديد المعدل قبل التبديل إلى البديل الاحتياطي للنموذج (الافتراضي: `1`). ويتضمن هذا المسار الخاص بتحديد المعدل نصوصًا ذات شكل مزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- ترتفع قيمة `consoleLevel` إلى `debug` عند استخدام `--verbose`.
- `maxFileBytes`: الحجم الأقصى لملف السجل النشط بالبايتات قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 MB). ويحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقمة بجوار الملف النشط.

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

- `enabled`: مفتاح رئيسي لمخرجات القياس/التتبّع (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل الأعلام لتفعيل مخرجات سجل موجهة (تدعم wildcards مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة العمر بالمللي ثانية لإصدار تحذيرات الجلسات العالقة بينما تبقى الجلسة في حالة المعالجة.
- `otel.enabled`: يفعّل مسار التصدير الخاص بـ OpenTelemetry (الافتراضي: `false`). وللاطلاع على الإعدادات الكاملة، وفهرس الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع لتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية اختيارية خاصة بكل إشارة من نوع OTLP. وعند تعيينها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: ‏`"http/protobuf"` ‏(الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تمكين تصدير التتبعات أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات التتبعات من `0` إلى `1`.
- `otel.flushIntervalMs`: فترة تفريغ telemetry الدورية بالمللي ثانية.
- `otel.captureContent`: اشتراك صريح لالتقاط المحتوى الخام في سمات OTEL span. وهو معطل افتراضيًا. والقيمة المنطقية `true` تلتقط محتوى الرسائل/الأدوات غير النظامية؛ أما صيغة الكائن فتمكّنك من تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحةً.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لسمات مزوّد span الخاصة بـ GenAI التجريبية الأحدث. وتحافظ spans افتراضيًا على السمة القديمة `gen_ai.system` للتوافق؛ بينما تستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفين الذين سجلوا بالفعل OpenTelemetry SDK عامًا. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بكل إشارة تُستخدم عندما يكون مفتاح الإعدادات المطابق غير معيّن.
- `cacheTrace.enabled`: يسجّل لقطات تتبع الذاكرة المؤقتة للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لملف JSONL الخاص بـ cache trace ‏(الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم في ما يُضمَّن في مخرجات cache trace ‏(وجميعها افتراضيًا: `true`).

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

- `channel`: قناة الإصدار لتثبيتات npm/git — ‏`"stable"` أو `"beta"` أو `"dev"`.
- `checkOnStart`: التحقق من تحديثات npm عند بدء Gateway ‏(الافتراضي: `true`).
- `auto.enabled`: تمكين التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي على قناة stable ‏(الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية بالساعات لطرح stable ‏(الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد الساعات بين عمليات التحقق في قناة beta ‏(الافتراضي: `1`؛ الحد الأقصى: `24`).

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

- `enabled`: مفتاح الميزة الرئيسي لـ ACP ‏(الافتراضي: `true`؛ اضبطه على `false` لإخفاء إمكانات إرسال ACP والإنشاء).
- `dispatch.enabled`: مفتاح مستقل لإرسال أدوار جلسة ACP ‏(الافتراضي: `true`). اضبطه على `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضية لوقت تشغيل ACP ‏(ويجب أن يطابق Plugin وقت تشغيل ACP مسجلة).
  إذا تم تعيين `plugins.allow`، فأدرج معرّف Plugin الخلفية (مثل `acpx`) وإلا فلن يتم تحميل Plugin الافتراضية المضمّنة.
- `defaultAgent`: معرّف الوكيل الهدف الاحتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ وتعني القيمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة المتزامنة.
- `stream.coalesceIdleMs`: نافذة التفريغ عند الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم القطعة قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: يمنع تكرار أسطر الحالة/الأداة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: ‏`"live"` يبث بشكل تدريجي؛ و`"final_only"` يخزن مؤقتًا حتى أحداث النهاية للدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى لأحرف أسطر حالة/تحديث ACP المعروضة.
- `stream.tagVisibility`: سجل من أسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL عند الخمول بالدقائق لعاملات جلسة ACP قبل أن تصبح مؤهلة للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري يُشغَّل عند تهيئة بيئة وقت تشغيل ACP.

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

- يتحكم `cli.banner.taglineMode` في نمط الشعار الفرعي للشريط:
  - `"random"` ‏(الافتراضي): شعارات فرعية طريفة/موسمية متناوبة.
  - `"default"`: شعار فرعي محايد ثابت (`All your chats, one OpenClaw.`).
  - `"off"`: بدون نص شعار فرعي (مع استمرار إظهار عنوان الشريط/الإصدار).
- لإخفاء الشريط بالكامل (وليس فقط الشعارات الفرعية)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

بيانات وصفية تكتبها تدفقات الإعداد الموجه عبر CLI ‏(`onboard` و`configure` و`doctor`):

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

راجع حقول الهوية في `agents.list` ضمن [افتراضيات الوكيل](/ar/gateway/config-agents#agent-defaults).

---

## Bridge ‏(قديم، أزيل)

لم تعد الإصدارات الحالية تتضمن TCP bridge. وتتصل Nodes عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءًا من مخطط الإعدادات (ويفشل التحقق حتى تُزال؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

<Accordion title="إعدادات bridge القديمة (مرجع تاريخي)">

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
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // بديل قديم مهمل للوظائف المخزنة ذات notify:true
    webhookToken: "replace-with-dedicated-token", // bearer token اختياري لمصادقة Webhook الصادرة
    sessionRetention: "24h", // سلسلة مدة أو false
    runLog: {
      maxBytes: "2mb", // الافتراضي 2_000_000 بايت
      keepLines: 2000, // الافتراضي 2000
    },
  },
}
```

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. وتتحكم أيضًا في تنظيف نصوص Cron المحذوفة المؤرشفة. الافتراضي: `24h`؛ اضبطه على `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى لحجم ملف سجل كل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر التي يجري الاحتفاظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: bearer token يُستخدم لتسليم POST الخاص بـ Cron Webhook ‏(`delivery.mode = "webhook"`)، وإذا حُذف فلا يُرسل أي ترويسة مصادقة.
- `webhook`: عنوان URL قديم مهمل لبديل webhook ‏(http/https) يُستخدم فقط للوظائف المخزنة التي لا تزال تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لعمليات إعادة المحاولة للوظائف أحادية التشغيل عند الأخطاء العابرة (الافتراضي: `3`؛ النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تفعّل إعادة المحاولة — ‏`"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفه لإعادة المحاولة مع جميع الأنواع العابرة.

ينطبق ذلك فقط على وظائف Cron أحادية التشغيل. أما الوظائف المتكررة فلها معالجة إخفاق مستقلة.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: تمكين تنبيهات الإخفاق لوظائف Cron ‏(الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى للمللي ثانية بين التنبيهات المتكررة للوظيفة نفسها (عدد صحيح غير سالب).
- `mode`: وضع التسليم — ‏`"announce"` يرسل عبر رسالة قناة؛ و`"webhook"` ينشر إلى Webhook المهيأة.
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

- الوجهة الافتراضية لإشعارات إخفاق Cron عبر جميع الوظائف.
- `mode`: ‏`"announce"` أو `"webhook"`؛ وتكون القيمة الافتراضية `"announce"` عندما توجد بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم announce. وتعني `"last"` إعادة استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان Webhook URL. وهو مطلوب لوضع webhook.
- `accountId`: تجاوز اختياري للحساب من أجل التسليم.
- تتجاوز `delivery.failureDestination` لكل وظيفة هذا الافتراضي العام.
- عندما لا تكون الوجهة العامة ولا الوجهة الخاصة بكل وظيفة معيّنة، فإن الوظائف التي تسلّم أصلًا عبر `announce` ترجع عند الإخفاق إلى ذلك الهدف الأساسي لـ announce.
- لا تكون `delivery.failureDestination` مدعومة إلا للوظائف ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للوظيفة هو `"webhook"`.

راجع [وظائف Cron](/ar/automation/cron-jobs). وتُتتبّع تنفيذات Cron المعزولة على أنها [مهام في الخلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

عناصر نائبة في القوالب تُوسَّع في `tools.media.models[].args`:

| المتغير            | الوصف                                              |
| ------------------ | -------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                           |
| `{{RawBody}}`      | النص الخام (من دون أغلفة السجل/المرسِل)            |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعات                    |
| `{{From}}`         | معرّف المرسِل                                       |
| `{{To}}`           | معرّف الوجهة                                        |
| `{{MessageSid}}`   | معرّف رسالة القناة                                  |
| `{{SessionId}}`    | UUID الجلسة الحالية                                 |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                      |
| `{{MediaUrl}}`     | pseudo-URL للوسائط الواردة                          |
| `{{MediaPath}}`    | مسار الوسائط المحلي                                 |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)                     |
| `{{Transcript}}`   | النص المفرغ للصوت                                   |
| `{{Prompt}}`       | prompt الوسائط المحلول لإدخالات CLI                |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف المخرجات لإدخالات CLI     |
| `{{ChatType}}`     | `"direct"` أو `"group"`                            |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                         |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)                  |
| `{{SenderName}}`   | اسم عرض المرسِل (بأفضل جهد)                        |
| `{{SenderE164}}`   | رقم هاتف المرسِل (بأفضل جهد)                       |
| `{{Provider}}`     | تلميح المزوّد (whatsapp أو telegram أو discord، إلخ) |

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
- مصفوفة ملفات: تُدمج عميقًا بالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (فتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبةً إلى الملف المُضمِّن، لكن يجب أن تبقى داخل دليل الإعدادات الأعلى مستوى (`dirname` لـ `openclaw.json`). وتُسمح الصيغ المطلقة/`../` فقط عندما تظل تُحل داخل هذا الحد.
- تكتب عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى ومدعومًا بتضمين ملف واحد مباشرةً إلى ذلك الملف المضمَّن. على سبيل المثال، يحدّث `plugins install` القيمة `plugins: { $include: "./plugins.json5" }` داخل `plugins.json5` ويترك `openclaw.json` كما هو.
- تكون تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط بالنسبة إلى عمليات الكتابة المملوكة لـ OpenClaw؛ وتفشل تلك العمليات بشكل مغلق بدلًا من تسطيح الإعدادات.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [الإعدادات](/ar/gateway/configuration)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
