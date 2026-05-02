---
read_when:
    - تحتاج إلى الدلالات الدقيقة للإعدادات على مستوى الحقول أو إلى قيمها الافتراضية
    - أنت تتحقق من كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع تكوين Gateway لمفاتيح OpenClaw الأساسية والافتراضيات والروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-05-02T20:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559a52c9ea7428aa0a33b9699eaf144aa114638acf57f813217642319ce77987
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع إعدادات Core لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة للمهام، راجع [الإعدادات](/ar/gateway/configuration).

يغطي أسطح إعدادات OpenClaw الرئيسية، ويربط إلى مراجع خارجية عندما يكون للنظام الفرعي مرجع أعمق خاص به. تعيش كتالوجات أوامر القنوات وما تملكه الـ Plugin، ومفاتيح الذاكرة العميقة/QMD على صفحاتها الخاصة بدلا من هذه الصفحة.

مصدر الحقيقة في الكود:

- يطبع `openclaw config schema` مخطط JSON Schema الحي المستخدم للتحقق وControl UI، مع دمج بيانات التعريف المرفقة/الخاصة بالـ Plugin/القنوات عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة النطاق بالمسار لأدوات التنقل التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس توثيق الإعدادات مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` باسم `config.schema.lookup` للحصول على
توثيق وقيود دقيقة على مستوى الحقل قبل التعديلات. استخدم
[الإعدادات](/ar/gateway/configuration) للإرشاد الموجه للمهام وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر الحالي المدمج + المرفق
- صفحات القنوات/الـ Plugin المالكة لأسطح الأوامر الخاصة بالقناة

تنسيق الإعدادات هو **JSON5** (يسمح بالتعليقات والفواصل اللاحقة). جميع الحقول اختيارية — يستخدم OpenClaw قيما افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح إعدادات كل قناة إلى صفحة مخصصة — راجع
[الإعدادات — القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والقنوات
المرفقة الأخرى (المصادقة، التحكم في الوصول، تعدد الحسابات، بوابة الإشارات).

## افتراضيات الوكيل، تعدد الوكلاء، الجلسات، والرسائل

انتقلت إلى صفحة مخصصة — راجع
[الإعدادات — الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، sandbox)
- `multiAgent.*` (توجيه تعدد الوكلاء والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التقليم)
- `messages.*` (تسليم الرسائل، TTS، عرض markdown)
- `talk.*` (وضع Talk)
  - `talk.speechLocale`: معرف لغة BCP 47 اختياري للتعرف على كلام Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم ضبطه، يحافظ Talk على نافذة التوقف الافتراضية للمنصة قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)

## الأدوات والمزودون المخصصون

انتقلت سياسة الأدوات، ومفاتيح التبديل التجريبية، وإعدادات الأدوات المدعومة بالمزودين، وإعداد
المزود المخصص / عنوان URL الأساسي إلى صفحة مخصصة — راجع
[الإعدادات — الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

تعيش تعريفات المزودين، وقوائم السماح بالنماذج، وإعداد المزودين المخصصين في
[الإعدادات — الأدوات والمزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
يملك جذر `models` أيضا سلوك كتالوج النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك كتالوج المزود (`merge` أو `replace`).
- `models.providers`: خريطة المزودين المخصصين مفهرسة بمعرف المزود.
- `models.pricing.enabled`: يتحكم في تمهيد التسعير في الخلفية الذي
  يبدأ بعد وصول العمليات الجانبية والقنوات إلى مسار جاهزية Gateway. عندما يكون `false`،
  يتجاوز Gateway عمليات جلب كتالوجات أسعار OpenRouter وLiteLLM؛ وتظل قيم
  `models.providers.*.models[].cost` المضبوطة تعمل لتقديرات التكلفة المحلية.

## MCP

تعيش تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` وتستهلكها
Pi المضمنة ومحولات التشغيل الأخرى. تدير أوامر `openclaw mcp list`
و`show` و`set` و`unset` هذه الكتلة من دون الاتصال بالخادم
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

- `mcp.servers`: تعريفات خوادم MCP المسماة من نوع stdio أو البعيدة لبيئات التشغيل التي
  تعرض أدوات MCP المضبوطة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  و`type: "http"` اسم بديل أصلي في CLI يقوم `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى حقل `transport` القانوني.
- `mcp.sessionIdleTtlMs`: مدة TTL للخمول لبيئات تشغيل MCP المرفقة ومحددة نطاق الجلسة.
  تطلب عمليات التشغيل المضمنة لمرة واحدة تنظيف نهاية التشغيل؛ هذه الـ TTL هي صمام الأمان
  للجلسات طويلة العمر والمستدعين المستقبليين.
- تطبق التغييرات ضمن `mcp.*` فورا عبر التخلص من بيئات تشغيل MCP المخزنة مؤقتا للجلسات.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من الإعدادات الجديدة، لذلك يتم
  حصد إدخالات `mcp.servers` المحذوفة فورا بدلا من انتظار TTL الخمول.

راجع [MCP](/ar/cli/mcp#openclaw-as-an-mcp-client-registry) و
[خلفيات CLI](/ar/gateway/cli-backends#bundle-mcp-overlays) لسلوك وقت التشغيل.

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

- `allowBundled`: قائمة سماح اختيارية للـ Skills المرفقة فقط (لا تتأثر Skills المدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أسبقية).
- `install.preferBrew`: عندما تكون true، فضّل مثبتات Homebrew عندما يكون `brew`
  متاحا قبل الرجوع إلى أنواع المثبتات الأخرى.
- `install.nodeManager`: تفضيل مثبت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- يعطل `entries.<skillKey>.enabled: false` إحدى Skills حتى لو كانت مرفقة/مثبتة.
- `entries.<skillKey>.apiKey`: تسهيل للـ Skills التي تعلن متغير بيئة أساسيا (سلسلة نصية صريحة أو كائن SecretRef).

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
- يقبل الاكتشاف Plugins OpenClaw الأصلية بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي بلا manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل gateway.**
- `allow`: قائمة سماح اختيارية (لا يتم تحميل إلا Plugins المدرجة). تتغلب `deny`.
- `plugins.entries.<id>.apiKey`: حقل تسهيل لمفتاح API على مستوى الـ Plugin (عندما يدعمه الـ Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة محددة النطاق بالـ Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يحظر Core `before_prompt_build` ويتجاهل الحقول التي تغير الموجه من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق على خطافات Plugin الأصلية وأدلة الخطافات المقدمة من الحزم المدعومة.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن للـ Plugins الموثوقة وغير المرفقة قراءة محتوى المحادثة الخام من الخطافات النمطية مثل `llm_input` و`llm_output` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: ثق صراحة بهذا الـ Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لعمليات الوكيل الفرعي في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القانونية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات معرف من الـ Plugin (يتم التحقق منه بمخطط Plugin OpenClaw الأصلي عند توفره).
- تعيش إعدادات حساب/وقت تشغيل Plugin القناة ضمن `channels.<id>` ويجب وصفها بواسطة بيانات تعريف `channelConfigs` في manifest الخاص بالـ Plugin المالك، لا بواسطة سجل خيارات OpenClaw مركزي.
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزود جلب الويب Firecrawl.
  - `apiKey`: مفتاح API لـ Firecrawl (يقبل SecretRef). يرجع إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API Firecrawl (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخرج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر التخزين المؤقت بالميلي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الاستخراج بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث الويب Grok).
  - `enabled`: فعّل مزود X Search.
  - `model`: نموذج Grok المراد استخدامه للبحث (مثلا `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل مسح Dreaming كامل (`"0 3 * * *"` افتراضيا).
  - `model`: تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه مع `allowedModels` لتقييد الأهداف. تعاد محاولة أخطاء عدم توفر النموذج مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ ولا يتم الرجوع بصمت عند فشل الثقة أو قائمة السماح.
  - سياسة المراحل والعتبات تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- تعيش إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـ Plugins حزم Claude المفعلة أيضا المساهمة بافتراضيات Pi مضمنة من `settings.json`؛ يطبق OpenClaw هذه كإعدادات وكيل منقحة، وليس كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرف Plugin محرك السياق النشط؛ تكون القيمة الافتراضية `"legacy"` ما لم تثبت وتحدد محركا آخر.

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

- يعطّل `evaluateEnabled: false` كلًا من `act:evaluate` و`wait --fn`.
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد مدة الخمول أو عندما تتجاوز جلسة حدها الأقصى. عيّن `idleMinutes: 0` أو `maxTabsPerSession: 0` لتعطيل أوضاع التنظيف الفردية تلك.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلًا عند عدم ضبطه، لذلك يبقى تنقّل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا بتنقّل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه للشبكة الخاصة أثناء فحوصات قابلية الوصول/الاكتشاف.
- يبقى `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصصة للإرفاق فقط (التشغيل/الإيقاف/إعادة الضبط معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك موفّرك بعنوان URL مباشر لـ DevTools WebSocket.
- تنطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية وصول CDP البعيدة
  و`attachOnly` إضافةً إلى طلبات فتح علامات التبويب. تحتفظ ملفات تعريف loopback
  المُدارة بالإعدادات الافتراضية المحلية لـ CDP.
- إذا كانت خدمة CDP مُدارة خارجيًا ويمكن الوصول إليها عبر loopback، فاضبط
  `attachOnly: true` لذلك الملف التعريفي؛ وإلا فسيتعامل OpenClaw مع منفذ loopback كملف
  تعريف متصفح محلي مُدار وقد يبلّغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلًا من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف متصفح محدد
  مستند إلى Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات مدفوعة باللقطات/المراجع بدلًا من الاستهداف بمحددات CSS، وخطافات رفع ملف واحد،
  ولا توجد تجاوزات لمهلة مربعات الحوار، ولا `wait --load networkidle`، ولا
  `responsebody` أو تصدير PDF أو اعتراض التنزيل أو الإجراءات الدفعية.
- تعيّن ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائيًا؛ ولا
  تضبط `cdpUrl` صراحةً إلا لـ CDP البعيد.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف التعريفي. استخدم هذا لتشغيل ملف تعريف في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف HTTP الخاص
  بـ Chrome CDP بعد بدء العملية، و`browser.localCdpReadyTimeoutMs` لجاهزية websocket الخاصة
  بـ CDP بعد التشغيل. ارفع هذه القيم على المضيفين الأبطأ حيث يبدأ Chrome بنجاح لكن
  فحوصات الجاهزية تتسابق مع بدء التشغيل. يجب أن تكون القيمتان أعدادًا صحيحة موجبة حتى
  `120000` مللي ثانية؛ وتُرفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مستندًا إلى Chromium ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  القيمتين `~` و`~/...` لدليل المنزل في نظام التشغيل لديك قبل تشغيل Chromium.
  كما يجري توسيع التلدة في `userDataDir` لكل ملف تعريف على ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء تشغيل Chromium المحلي (مثل
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

- `seamColor`: لون تمييز كروم واجهة مستخدم التطبيق الأصلي (صبغة فقاعة وضع المحادثة، إلخ).
- `assistant`: تجاوز هوية واجهة مستخدم التحكم. يعود إلى هوية الوكيل النشط عند عدم ضبطه.

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
- `port`: منفذ واحد متعدد الإرسال لـ WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto` أو `loopback` (الافتراضي) أو `lan` (`0.0.0.0`) أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط) أو `custom`.
- **أسماء ربط بديلة قديمة**: استخدم قيم وضع الربط في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء المضيف البديلة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع ربط `loopback` الافتراضي على `127.0.0.1` داخل الحاوية. مع شبكة جسر Docker (`-p 18789:18789`)، تصل الحركة على `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على كل الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات الربط غير loopback مصادقة Gateway. عمليًا يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلاً عكسيًا مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد رمزًا افتراضيًا.
- إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. تفشل مسارات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مكوّنًا والوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ ولا يُعرض ذلك عمدًا في مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي مدرك للهوية واثق بترويسات الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر وكيل **غير loopback** افتراضيًا؛ وتتطلب الوكلاء العكسية عبر loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`. يمكن للمتصلين الداخليين على المضيف نفسه استخدام `gateway.auth.password` كخيار محلي مباشر احتياطي؛ ويبقى `gateway.auth.token` متنافيًا مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve استيفاء مصادقة واجهة التحكم/WebSocket (متحقق منها عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale هذه؛ بل تتبع بدلًا من ذلك وضع مصادقة HTTP العادي في Gateway. يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. القيمة الافتراضية هي `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدِّد اختياري لفشل المصادقة. يطبق لكل عنوان IP عميل ولكل نطاق مصادقة (تُتتبع shared-secret وdevice-token بشكل مستقل). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار واجهة التحكم غير المتزامن عبر Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تفعل المحدِّد في الطلب الثاني بدل أن تتسابق كلها كحالات عدم تطابق عادية.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمدًا تقييد حركة localhost أيضًا (لإعدادات الاختبار أو نشر الوكيل الصارم).
- تُقيّد دائمًا محاولات مصادقة WS الصادرة من أصل متصفح مع تعطيل إعفاء loopback (دفاع متعمق ضد القوة الغاشمة على localhost المعتمدة على المتصفح).
- على loopback، تُعزل حالات القفل هذه الصادرة من أصل متصفح حسب قيمة `Origin`
  المعيارية، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: `serve` (tailnet فقط، ربط loopback) أو `funnel` (عام، يتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. مطلوبة عندما يُتوقع وصول عملاء المتصفح من أصول غير loopback.
- `controlUi.chatMessageMaxWidth`: حد أقصى اختياري للعرض لرسائل محادثة واجهة التحكم المجمعة. يقبل قيم عرض CSS مقيّدة مثل `960px` و`82%` و`min(1280px, 82%)` و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطر يمكّن الرجوع إلى أصل ترويسة Host لعمليات النشر التي تعتمد عمدًا على سياسة أصل ترويسة Host.
- `remote.transport`: `ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` إما `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز إسعافي في بيئة عملية العميل
  يسمح بـ `ws://` بنص صريح إلى عناوين IP موثوقة على شبكة خاصة؛ يظل الافتراضي
  مقتصرًا على loopback فقط للنص الصريح. لا يوجد مكافئ في `openclaw.json`،
  كما أن تكوين الشبكة الخاصة للمتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` لا يؤثر في عملاء
  Gateway WebSocket.
- `gateway.remote.token` / `.password` حقول اعتماد للعميل البعيد. لا تهيئ مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS أساسي لمرحل APNs الخارجي المستخدم من إصدارات iOS الرسمية/TestFlight بعد نشرها تسجيلات مدعومة بالمرحل إلى Gateway. يجب أن يطابق هذا العنوان عنوان المرحل المضمّن في بناء iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالمللي ثانية. القيمة الافتراضية `10000`.
- تُفوَّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويُضمّن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال محددة بنطاق التسجيل إلى Gateway. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئة مؤقتة لتكوين المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: مخرج للتطوير فقط لعناوين مرحل HTTP عبر loopback. يجب أن تبقى عناوين مرحل الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة Gateway WebSocket قبل المصادقة بالمللي ثانية. الافتراضي: `15000`. تكون لـ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأولوية عند ضبطها. زد هذه القيمة على المضيفات المحملة أو منخفضة القدرة حيث يستطيع العملاء المحليون الاتصال بينما لا يزال تمهيد بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القنوات بالدقائق. اضبطه على `0` لتعطيل إعادات تشغيل مراقبة الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس المتقادم بالدقائق. اجعلها أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقبة الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: إلغاء اشتراك لكل قناة في إعادات تشغيل مراقبة الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند ضبطه، تكون له الأولوية على تجاوز مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما تكون `gateway.auth.*` غير مضبوطة.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وتعذر حلّه، يفشل الحل بإغلاق آمن (من دون إخفاء ذلك برجوع احتياطي بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين الذين ينهون TLS أو يحقنون ترويسات العميل الممرَّرة. أدرج فقط الوكلاء الذين تتحكم بهم. تظل إدخالات loopback صالحة لإعدادات الوكيل على المضيف نفسه/الاكتشاف المحلي (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل Gateway `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. الافتراضي `false` لسلوك الفشل المغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح CIDR/IP اختيارية للموافقة التلقائية على اقتران جهاز node لأول مرة من دون نطاقات مطلوبة. تكون معطلة عند عدم ضبطها. لا يوافق هذا تلقائيًا على اقتران المشغل/المتصفح/واجهة التحكم/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/رفض عام لأوامر node المعلنة بعد الاقتران وتقييم قائمة سماح المنصة. استخدم `allowCommands` للاشتراك في أوامر node الخطرة مثل `camera.snap` و`camera.clip` و`screen.record`؛ ويزيل `denyCommands` أمرًا حتى لو كان افتراضي منصة أو سماح صريح سيشمله خلاف ذلك. بعد أن يغيّر node قائمة أوامره المعلنة، ارفض اقتران ذلك الجهاز وأعد الموافقة عليه حتى يخزن Gateway لقطة الأوامر المحدّثة.
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
    تُعامل قوائم السماح الفارغة على أنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة تقوية اختيارية للاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد بمنافذ ومجلدات حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام تسهيلية: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، `--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [بوابات Gateway متعددة](/ar/gateway/multiple-gateways).

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
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محليًا وموقعًا ذاتيًا عندما لا تكون الملفات الصريحة مكوّنة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ أبقه مقيّد الأذونات.
- `caPath`: مسار حزمة CA اختياري للتحقق من العميل أو سلاسل الثقة المخصصة.

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
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخنة أولًا؛ وارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة تأخير بالمللي ثانية قبل تطبيق تغييرات التكوين (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى الاختياري بالمللي ثانية للانتظار حتى تنتهي العمليات الجارية قبل فرض إعادة تشغيل. اتركه لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ واضبطه على `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية بأن هناك عمليات لا تزال معلقة.

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

- يتطلب `hooks.enabled=true` قيمة `hooks.token` غير فارغة.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ تُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (على سبيل المثال `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` بقالب، فعيّن `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` الخاصة بالتعيين المعروضة من القوالب كقيم مقدمة خارجيًا، وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تُرجع إجراء خطاف.
  - يجب أن يكون `transform.module` مسارًا نسبيًا وأن يبقى داخل `hooks.transformsDir` (تُرفض المسارات المطلقة والتنقل خارج المسار).
  - أبقِ `hooks.transformsDir` ضمن `~/.openclaw/hooks/transforms`؛ تُرفض دلائل Skills الخاصة بمساحة العمل. إذا أبلغ `openclaw doctor` أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات الخطافات أو أزل `hooks.transformsDir`.
- يوجّه `agentId` إلى وكيل محدد؛ تعود المعرفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيل وكيل الخطاف دون `sessionKey` صريح.
- `allowRequestSessionKey`: يسمح لمستدعي `/hooks/agent` ومفاتيح جلسة التعيين المعتمدة على القوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية بالبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` بقالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ القيمة الافتراضية لـ`channel` هي `last`.
- يتجاوز `model` نموذج LLM لهذا تشغيل الخطاف (يجب أن يكون مسموحًا به إذا كان كتالوج النماذج معينًا).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المدمج المسبق `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فعيّن `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لتطابق مساحة أسماء Gmail، مثل `["hook:", "hook:gmail:"]`.
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

- يبدأ Gateway تشغيل `gog gmail watch serve` تلقائيًا عند الإقلاع عندما يكون مهيأً. عيّن `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلًا بجانب Gateway.

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

- يخدم HTML/CSS/JS القابلة للتحرير بواسطة الوكيل وA2UI عبر HTTP ضمن منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الارتباطات غير loopback: تتطلب مسارات Canvas مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل Node WebViews عادةً ترويسات المصادقة؛ بعد إقران Node واتصالها، يعلن Gateway عناوين URL بإمكانات مقيّدة بنطاق Node للوصول إلى Canvas/A2UI.
- ترتبط عناوين URL الخاصة بالإمكانات بجلسة WS النشطة لـNode وتنتهي صلاحيتها بسرعة. لا يُستخدم احتياطي قائم على عنوان IP.
- يحقن عميل إعادة التحميل المباشر في HTML المخدوم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون فارغًا.
- يخدم أيضًا A2UI عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
- عطّل إعادة التحميل المباشر للدلائل الكبيرة أو أخطاء `EMFILE`.

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

- `minimal` (الافتراضي): حذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: تضمين `cliPath` + `sshPort`.
- يكون اسم المضيف افتراضيًا هو اسم مضيف النظام عندما يكون وسم DNS صالحًا، مع الرجوع إلى `openclaw`. تجاوز ذلك باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### النطاق الواسع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية البث ضمن `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، اقرنه بخادم DNS (يُوصى بـCoreDNS) + Tailscale split DNS.

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
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول.
- راجع [البيئة](/ar/help/environment) لمعرفة ترتيب الأولوية الكامل.

### استبدال متغيرات البيئة

أشر إلى متغيرات البيئة في أي سلسلة إعداد باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تطابق الأسماء ذات الأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- المتغيرات المفقودة/الفارغة تُلقي خطأ عند تحميل الإعداد.
- استخدم `$${VAR}` للهروب من `${VAR}` حرفيًا.
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
- نمط معرف `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- معرف `source: "file"`: مؤشر JSON مطلق (على سبيل المثال `"/providers/openai/apiKey"`)
- نمط معرف `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرفات `source: "exec"` على مقاطع مسار محددة بشرطة مائلة هي `.` أو `..` (مثلًا يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القانونية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُضمّن مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

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
- تفشل مسارات موفري الملفات وexec بشكل مغلق عندما لا يكون تحقق Windows ACL متاحًا. عيّن `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب موفر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيًا، تُرفض مسارات أوامر الروابط الرمزية. عيّن `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا كان `trustedDirs` مهيأً، ينطبق فحص الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة ابن `exec` صغيرة افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب اللقطة فقط.
- ينطبق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح الممكّنة إلى فشل بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع تشخيصات.

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

- تُخزن ملفات التعريف لكل وكيل عند `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ`api_key`، و`tokenRef` لـ`token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست تنسيق وقت تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات تعريف مفاتيح API القانونية `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- لا تدعم ملفات تعريف وضع OAuth (`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملفات تعريف المصادقة المدعومة بـSecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ تُنظف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
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

- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كاف حقيقية (الافتراضي: `5`). يمكن أن يقع نص الفوترة الصريح هنا حتى في استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزوّد تبقى محصورة في المزوّد الذي يملكها (على سبيل المثال OpenRouter `Key limit exceeded`). تبقى رسائل HTTP `402` القابلة لإعادة المحاولة والخاصة بنافذة الاستخدام أو حد إنفاق المؤسسة/مساحة العمل في مسار `rate_limit` بدلا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات لنمو تراجع الفوترة الأسي (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لدورات ملفات تعريف المصادقة من المزوّد نفسه لأخطاء التحميل الزائد قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). تقع أشكال انشغال المزوّد مثل `ModelNotReadyException` هنا.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف محمّل فوق طاقته (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لدورات ملفات تعريف المصادقة من المزوّد نفسه لأخطاء حد المعدل قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). يتضمن وعاء حد المعدل هذا نصوصا مشكلة من المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونصوص نسخ الجلسات المحفوظة. لا يعطل `redactSensitive: "off"` إلا سياسة السجل/النسخ العامة هذه؛ أما أسطح أمان الواجهة/الأدوات/التشخيص فما زالت تحجب الأسرار قبل الإرسال.

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

- `enabled`: مفتاح التبديل الرئيسي لمخرجات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات التي تفعّل مخرجات سجل مستهدفة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر عدم التقدم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل كـ `session.long_running` أو `session.stalled` أو `session.stuck`. تعيد الردود والأدوات والحالة والكتل وتقدم ACP ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت بلا تغيير.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`). للتكوين الكامل، وفهرس الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع لتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بكل إشارة. عند ضبطها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير الآثار أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات الآثار `0`–`1`.
- `otel.flushIntervalMs`: فترة دفع القياس الدورية بالمللي ثانية.
- `otel.captureContent`: التقاط محتوى خام بموافقة صريحة لسمات امتدادات OTEL. يكون معطلا افتراضيا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامي؛ ويتيح شكل الكائن تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحة.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لسمات مزوّد امتدادات GenAI التجريبية الأحدث. افتراضيا تحتفظ الامتدادات بسمة `gen_ai.system` القديمة للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفين الذين سجلوا مسبقا OpenTelemetry SDK عاما. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بكل إشارة تُستخدم عندما لا يكون مفتاح التكوين المطابق مضبوطا.
- `cacheTrace.enabled`: تسجيل لقطات تتبع الذاكرة المخبئية للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار مخرجات JSONL لتتبع الذاكرة المخبئية (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم بما يُدرج في مخرجات تتبع الذاكرة المخبئية (كلها افتراضيا: `true`).

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
- `auto.stableJitterHours`: نافذة انتشار طرح إضافية بالساعات لقناة stable (الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: مدى تكرار تشغيل فحوص قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ اضبط `false` لإخفاء إمكانات إرسال ACP والإنشاء).
- `dispatch.enabled`: بوابة مستقلة لإرسال دور جلسة ACP (الافتراضي: `true`). اضبط `false` لإبقاء أوامر ACP متاحة مع منع التنفيذ.
- `backend`: معرّف خلفية تشغيل ACP الافتراضية (يجب أن يطابق Plugin تشغيل ACP مسجلا).
  ثبّت Plugin الخلفية أولا، وإذا كان `plugins.allow` مضبوطا، فأدرج معرّف Plugin الخلفية (على سبيل المثال `acpx`) وإلا فلن تُحمّل خلفية ACP.
- `defaultAgent`: معرّف وكيل ACP الاحتياطي عندما لا تحدد عمليات الإنشاء هدفا صريحا.
- `allowedAgents`: قائمة سماح بمعرّفات الوكلاء المسموح بها لجلسات تشغيل ACP؛ تعني القيمة الفارغة عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة في الوقت نفسه.
- `stream.coalesceIdleMs`: نافذة دفع الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: كبت أسطر الحالة/الأدوات المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: يبث `"live"` تدريجيا؛ بينما يخزن `"final_only"` مؤقتا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: فاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف لأسطر حالة/تحديث ACP المسقطة.
- `stream.tagVisibility`: سجل لأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعمال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري لتشغيله عند تمهيد بيئة تشغيل ACP.

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

- يتحكم `cli.banner.taglineMode` في نمط العبارة التعريفية للشعار:
  - `"random"` (الافتراضي): عبارات تعريفية مضحكة/موسمية متناوبة.
  - `"default"`: عبارة تعريفية حيادية ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: لا يوجد نص عبارة تعريفية (يبقى عنوان/إصدار الشعار ظاهرا).
- لإخفاء الشعار بالكامل (وليس العبارات التعريفية فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية يكتبها CLI عبر تدفقات الإعداد الموجهة (`onboard`، `configure`، `doctor`):

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

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل عقد Node عبر Gateway WebSocket. لم تعد مفاتيح `bridge.*` جزءا من مخطط التكوين (يفشل التحقق حتى إزالتها؛ يمكن لـ `openclaw doctor --fix` حذف المفاتيح غير المعروفة).

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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل cron المعزولة المكتملة قبل تقليمها من `sessions.json`. يتحكم أيضا في تنظيف نسخ cron المحذوفة المؤرشفة. الافتراضي: `24h`؛ اضبط `false` للتعطيل.
- `runLog.maxBytes`: الحجم الأقصى لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر المحتفظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز bearer مميز يُستخدم لتسليم POST عبر Cron Webhook (`delivery.mode = "webhook"`)، وإذا حُذف فلن تُرسل ترويسة مصادقة.
- `webhook`: عنوان URL احتياطي قديم ومهمل لـ webhook (http/https) يُستخدم فقط للمهام المخزنة التي ما زال لديها `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادة المحاولة للمهام لمرة واحدة عند حدوث أخطاء عابرة (الافتراضي: `3`؛ النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 مدخلات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — `"rate_limit"`، و`"overloaded"`، و`"network"`، و`"timeout"`، و`"server_error"`. احذفها لإعادة محاولة كل الأنواع العابرة.

ينطبق فقط على وظائف cron لمرة واحدة. تستخدم الوظائف المتكررة معالجة فشل منفصلة.

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

- `enabled`: تفعيل تنبيهات الفشل لوظائف cron (الافتراضي: `false`).
- `after`: عدد حالات الفشل المتتالية قبل تشغيل تنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للوظيفة نفسها (عدد صحيح غير سالب).
- `includeSkipped`: احتساب عمليات التشغيل المتخطاة المتتالية ضمن عتبة التنبيه (الافتراضي: `false`). تُتتبّع عمليات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
- `mode`: وضع التسليم — يرسل `"announce"` عبر رسالة قناة؛ وينشر `"webhook"` إلى Webhook المكوّن.
- `accountId`: معرّف حساب أو قناة اختياري لتقييد نطاق تسليم التنبيهات.

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

- الوجهة الافتراضية لإشعارات فشل cron عبر كل الوظائف.
- `mode`: `"announce"` أو `"webhook"`؛ يكون افتراضيًا `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلان. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب لوضع Webhook.
- `accountId`: تجاوز اختياري للحساب عند التسليم.
- يتجاوز `delivery.failureDestination` الخاص بكل وظيفة هذا الافتراضي العام.
- عندما لا تكون وجهة الفشل العامة ولا الخاصة بالوظيفة مضبوطة، تعود الوظائف التي تسلّم بالفعل عبر `announce` إلى هدف الإعلان الأساسي ذاك عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا للوظائف ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للوظيفة هو `"webhook"`.

راجع [وظائف Cron](/ar/automation/cron-jobs). تُتتبّع عمليات تنفيذ cron المعزولة باعتبارها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

تُوسّع عناصر نائبة للقالب في `tools.media.models[].args`:

| المتغير           | الوصف                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (من دون أغلفة السجل/المرسل)             |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعة                 |
| `{{From}}`         | معرّف المرسل                                 |
| `{{To}}`           | معرّف الوجهة                            |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID للجلسة الحالية                              |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                 |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                          |
| `{{MediaPath}}`    | مسار الوسائط المحلي                                  |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)               |
| `{{Transcript}}`   | تفريغ الصوت                                  |
| `{{Prompt}}`       | موجّه الوسائط المحلول لإدخالات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI         |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (حسب الإمكان)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (حسب الإمكان)               |
| `{{SenderName}}`   | اسم عرض المرسل (حسب الإمكان)                 |
| `{{SenderE164}}`   | رقم هاتف المرسل (حسب الإمكان)                 |
| `{{Provider}}`     | تلميح المزوّد (whatsapp، telegram، discord، إلخ) |

---

## تضمينات التكوين (`$include`)

قسّم التكوين إلى عدة ملفات:

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
- التضمينات المتداخلة: حتى 10 مستويات عمقًا.
- المسارات: تُحلّ نسبةً إلى الملف الذي يحتوي التضمين، لكن يجب أن تبقى داخل دليل التكوين الأعلى (`dirname` الخاص بـ `openclaw.json`). تُسمح الصيغ المطلقة/`../` فقط عندما تظل تُحلّ داخل ذلك الحد.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا من المستوى الأعلى فقط ومدعومًا بتضمين ملف واحد تكتب عبر ذلك الملف المضمّن. على سبيل المثال، يحدّث `plugins install` القيمة `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة تكون للقراءة فقط لعمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بإغلاق آمن بدلًا من تسطيح التكوين.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [التكوين](/ar/gateway/configuration) · [أمثلة التكوين](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [التكوين](/ar/gateway/configuration)
- [أمثلة التكوين](/ar/gateway/configuration-examples)
