---
read_when:
    - تحتاج إلى دلالات التكوين الدقيقة على مستوى الحقول أو قيمه الافتراضية
    - أنت تتحقق من كتل تهيئة القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية والروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-05-07T13:18:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b279c3e74fd6f7de01d63b642ab17aaaac65c39b855efc745eadc121adbf1fb
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع التكوين الأساسي لـ `~/.openclaw/openclaw.json`. للاطلاع على نظرة عامة موجهة للمهام، راجع [التكوين](/ar/gateway/configuration).

يغطي أسطح تكوين OpenClaw الرئيسية ويربط بالمراجع الأخرى عندما يكون لنظام فرعي مرجعه الأعمق الخاص. تعيش كتالوجات الأوامر المملوكة للقنوات وPlugin ومقابض الذاكرة العميقة/QMD في صفحاتها الخاصة بدلا من هذه الصفحة.

مصدر الحقيقة في الكود:

- يطبع `openclaw config schema` مخطط JSON Schema الحي المستخدم للتحقق وControl UI، مع دمج بيانات Plugin/القنوات/المجمعة الوصفية عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة المسار لأدوات التعمق
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس وثائق التكوين مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` المسمى `config.schema.lookup` للحصول على
وثائق وقيود دقيقة على مستوى الحقل قبل التعديلات. استخدم
[التكوين](/ar/gateway/configuration) للإرشادات الموجهة للمهام وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، وروابط مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع تكوين الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وتكوين Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر المضمنة + المجمعة الحالي
- صفحات القنوات/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق التكوين هو **JSON5** (يُسمح بالتعليقات والفواصل اللاحقة). كل الحقول اختيارية - يستخدم OpenClaw قيما افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح التكوين لكل قناة إلى صفحة مخصصة - راجع
[التكوين - القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والقنوات
المجمعة الأخرى (المصادقة، التحكم بالوصول، الحسابات المتعددة، بوابة الإشارة).

## افتراضيات الوكيل، تعدد الوكلاء، الجلسات، والرسائل

انتقلت إلى صفحة مخصصة - راجع
[التكوين - الوكلاء](/ar/gateway/config-agents) لـ:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، صندوق العزل)
- `multiAgent.*` (توجيه الوكلاء المتعددين والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التقليم)
- `messages.*` (تسليم الرسائل، TTS، عرض Markdown)
- `talk.*` (وضع Talk)
  - `talk.speechLocale`: معرف لغة BCP 47 اختياري للتعرف على كلام Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم تعيينه، يحافظ Talk على نافذة التوقف الافتراضية للنظام الأساسي قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)

## الأدوات والمزودون المخصصون

انتقلت سياسة الأدوات، ومفاتيح التبديل التجريبية، وتكوين الأدوات المدعوم بالمزودين،
وإعداد المزود المخصص / عنوان URL الأساسي إلى صفحة مخصصة - راجع
[التكوين - الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

توجد تعريفات المزودين، وقوائم السماح للنماذج، وإعداد المزود المخصص في
[التكوين - الأدوات والمزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
يمتلك جذر `models` أيضا سلوك كتالوج النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك كتالوج المزود (`merge` أو `replace`).
- `models.providers`: خريطة مزودين مخصصة مفهرسة بمعرف المزود.
- `models.pricing.enabled`: يتحكم في تمهيد التسعير في الخلفية الذي
  يبدأ بعد وصول العمليات الجانبية والقنوات إلى مسار جاهزية Gateway. عندما تكون `false`،
  يتخطى Gateway جلب كتالوجات تسعير OpenRouter وLiteLLM؛ وتظل قيم
  `models.providers.*.models[].cost` المكونة تعمل لتقديرات التكلفة المحلية.

## MCP

توجد تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` وتستهلكها
Pi المضمنة ومحولات وقت التشغيل الأخرى. تدير أوامر `openclaw mcp list` و
`show` و`set` و`unset` هذه الكتلة دون الاتصال بالخادم
المستهدف أثناء تعديلات التكوين.

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

- `mcp.servers`: تعريفات خوادم MCP المسماة من نوع stdio أو البعيدة لأوقات التشغيل التي
  تعرض أدوات MCP المكونة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  أما `type: "http"` فهو اسم مستعار أصلي لـ CLI تقوم أوامر `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى حقل `transport` القياسي.
- `mcp.sessionIdleTtlMs`: مدة TTL للخمول لأوقات تشغيل MCP المجمعة ذات نطاق الجلسة.
  تطلب التشغيلات المضمنة لمرة واحدة تنظيف نهاية التشغيل؛ وتمثل مدة TTL هذه شبكة الأمان
  للجلسات طويلة العمر والمستدعين المستقبليين.
- تطبق التغييرات ضمن `mcp.*` فوريا عبر التخلص من أوقات تشغيل MCP المخزنة مؤقتا للجلسة.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من التكوين الجديد، لذلك تتم إزالة إدخالات
  `mcp.servers` المحذوفة فورا بدلا من انتظار مدة TTL للخمول.

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

- `allowBundled`: قائمة سماح اختيارية لـ Skills المجمعة فقط (لا تتأثر Skills المدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أسبقية).
- `install.preferBrew`: عند true، تفضل مثبتات Homebrew عندما يكون `brew` متاحا
  قبل الرجوع إلى أنواع المثبتات الأخرى.
- `install.nodeManager`: تفضيل مثبت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- يعطل `entries.<skillKey>.enabled: false` Skill حتى لو كانت مجمعة/مثبتة.
- `entries.<skillKey>.apiKey`: وسيلة مريحة لـ Skills التي تعلن عن متغير بيئة أساسي (سلسلة نصية صريحة أو كائن SecretRef).

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

- يتم التحميل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins OpenClaw الأصلية بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي بلا manifest.
- **تتطلب تغييرات التكوين إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (لا يتم تحميل إلا Plugins المدرجة). يتغلب `deny`.
- `bundledDiscovery`: القيمة الافتراضية هي `"allowlist"` للتكوينات الجديدة، لذلك فإن
  `plugins.allow` غير الفارغة تقيد أيضا Plugins المزودين المجمعة، بما في ذلك مزودي
  وقت تشغيل بحث الويب. يكتب Doctor القيمة `"compat"` لتكوينات قوائم السماح القديمة
  المرحَّلة للحفاظ على سلوك مزود المجموعات الحالي حتى تختار الاشتراك.
- `plugins.entries.<id>.apiKey`: حقل مريح لمفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يحظر القلب `before_prompt_build` ويتجاهل الحقول التي تعدل الموجه من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق على خطاطيف Plugin الأصلية وأدلة الخطاطيف المدعومة التي توفرها الحزم.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن لـ Plugins غير المجمعة الموثوقة قراءة محتوى المحادثة الخام من الخطاطيف المطبوعة مثل `llm_input` و`llm_output` و`before_model_resolve` و`before_agent_reply` و`before_agent_run` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: ثق صراحة بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لتشغيلات الوكيل الفرعي في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن تكوين معرف من Plugin (يتم التحقق منه بواسطة مخطط Plugin OpenClaw الأصلي عند توفره).
- توجد إعدادات حساب/وقت تشغيل Plugin القناة ضمن `channels.<id>` ويجب أن تصفها بيانات `channelConfigs` الوصفية في manifest الخاص بـ Plugin المالك، لا سجل خيارات OpenClaw مركزي.
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزود جلب الويب Firecrawl.
  - `apiKey`: مفتاح API لـ Firecrawl (يقبل SecretRef). يرجع إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API في Firecrawl (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف التجاوزات ذاتية الاستضافة نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخرج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث الويب Grok).
  - `enabled`: تمكين مزود X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming الذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: إيقاع Cron لكل مسح Dreaming كامل (`"0 3 * * *"` افتراضيا).
  - `model`: تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقترنه بـ `allowedModels` لتقييد الأهداف. تعيد أخطاء عدم توفر النموذج المحاولة مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ ولا تتراجع أخطاء الثقة أو قائمة السماح بصمت.
  - سياسة المراحل والعتبات تفاصيل تنفيذية (ليست مفاتيح تكوين موجهة للمستخدم).
- يوجد تكوين الذاكرة الكامل في [مرجع تكوين الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـ Plugins حزم Claude المفعلة أيضا المساهمة بافتراضات Pi المضمنة من `settings.json`؛ يطبق OpenClaw هذه كإعدادات وكيل منظفة، لا كتصحيحات تكوين OpenClaw خام.
- `plugins.slots.memory`: اختر معرف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرف Plugin محرك السياق النشط؛ القيمة الافتراضية هي `"legacy"` ما لم تثبت محركا آخر وتختاره.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يمكن لـ OpenClaw اكتشاف عمليات التحقق من أدوار المحادثة وتسليمها عبر تشغيلات Heartbeat.

- `commitments.enabled`: تمكين استخراج LLM المخفي، والتخزين، وتسليم Heartbeat للالتزامات المستنتجة للمتابعة. الافتراضي: `false`.
- `commitments.maxPerDay`: الحد الأقصى لالتزامات المتابعة المستنتجة المسلمة لكل جلسة وكيل في يوم متحرك. الافتراضي: `3`.

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

- يؤدي `evaluateEnabled: false` إلى تعطيل `act:evaluate` و`wait --fn`.
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد مدة الخمول أو عندما تتجاوز الجلسة حدها الأقصى. عيّن `idleMinutes: 0` أو `maxTabsPerSession: 0` لتعطيل أوضاع التنظيف الفردية هذه.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلاً عندما لا يكون معيّناً، لذلك يبقى تنقل المتصفح صارماً افتراضياً.
- عيّن `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمداً بتنقل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) لحظر الشبكة الخاصة نفسه أثناء فحوصات إمكانية الوصول/الاكتشاف.
- يبقى `ssrfPolicy.allowPrivateNetwork` مدعوماً كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصصة للإرفاق فقط (بدء/إيقاف/إعادة تعيين معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك موفّرك بعنوان URL مباشر لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على إمكانية الوصول إلى CDP البعيد و`attachOnly` إضافةً إلى طلبات فتح علامات التبويب. تحتفظ ملفات تعريف loopback المُدارة
  بالإعدادات الافتراضية المحلية لـ CDP.
- إذا كانت خدمة CDP مُدارة خارجياً ويمكن الوصول إليها عبر loopback، فعيّن
  `attachOnly: true` لذلك الملف التعريفي؛ وإلا فسيعامل OpenClaw منفذ loopback كملف تعريف متصفح محلي مُدار وقد يبلّغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلاً من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` تعيين `userDataDir` لاستهداف ملف تعريف متصفح محدد
  قائم على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات مدفوعة باللقطة/المرجع بدلاً من استهداف محددات CSS، وخطافات رفع ملف واحد،
  ودون تجاوزات لمهلة الحوارات، ودون `wait --load networkidle`، ودون
  `responsebody` أو تصدير PDF أو اعتراض التنزيلات أو الإجراءات الدفعية.
- تعيّن ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائياً؛ عيّن
  `cdpUrl` صراحةً فقط لـ CDP البعيد.
- يمكن لملفات التعريف المحلية المُدارة تعيين `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف التعريفي. استخدم هذا لتشغيل ملف تعريف
  في Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية، و`browser.localCdpReadyTimeoutMs` لجاهزية websocket الخاصة بـ CDP بعد
  الإطلاق. ارفع القيمتين على المضيفين الأبطأ حيث يبدأ Chrome بنجاح لكن فحوصات الجاهزية تسبق بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعداداً صحيحة موجبة حتى `120000` مللي ثانية؛ وترفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائماً على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  `~` و`~/...` لدليل المنزل في نظام التشغيل لديك قبل تشغيل Chromium.
  كما يتم توسيع التلدة في `userDataDir` لكل ملف تعريف على ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، الافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء تشغيل Chromium المحلي (مثل
  `--disable-gpu` أو ضبط حجم النافذة أو أعلام التصحيح).

---

## UI

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

- `seamColor`: لون تمييز لإطار UI التطبيق الأصلي (تلوين فقاعة وضع التحدث، وما إلى ذلك).
- `assistant`: تجاوز هوية Control UI. يعود إلى هوية الوكيل النشط عند عدم التعيين.

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
- `port`: منفذ مفرد متعدد الاستخدامات لـ WS + HTTP. ترتيب الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto` أو `loopback` (افتراضي) أو `lan` (`0.0.0.0`) أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط) أو `custom`.
- **أسماء الربط المستعارة القديمة**: استخدم قيم وضع الربط في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء المضيف المستعارة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع ربط `loopback` الافتراضي على `127.0.0.1` داخل الحاوية. مع شبكة جسر Docker (`-p 18789:18789`)، تصل الحركة على `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على كل الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب الروابط غير loopback مصادقة Gateway. عمليًا يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلًا عكسيًا واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد رمزًا افتراضيًا.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنًا (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. تفشل تدفقات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مكوّنًا ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ هذا لا يُعرض عمدًا في مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي واعٍ بالهوية وثِق بترويسات الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر وكيل **غير loopback** افتراضيًا؛ تتطلب الوكلاء العكسيون من نفس المضيف عبر loopback ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`. يمكن للمتصلين الداخليين من نفس المضيف استخدام `gateway.auth.password` كبديل مباشر محلي؛ يظل `gateway.auth.token` متنافيًا مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve استيفاء مصادقة Control UI/WebSocket (يتم التحقق عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway بدلًا من ذلك. يفترض هذا التدفق بلا رموز أن مضيف Gateway موثوق. القيمة الافتراضية هي `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات المصادقة الفاشلة. يطبّق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع shared-secret وdevice-token بشكل مستقل). ترجع المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Control UI غير المتزامن عبر Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تُفعّل المحدد في الطلب الثاني بدلًا من أن تمر كلتاهما كعدم تطابق عادي.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمدًا تحديد معدل حركة localhost أيضًا (لإعدادات الاختبار أو نشر الوكلاء الصارم).
- تتم دائمًا خنق محاولات مصادقة WS ذات أصل المتصفح مع تعطيل إعفاء loopback (دفاع معمّق ضد التخمين القسري المحلي عبر المتصفح).
- على loopback، تُعزل حالات القفل ذات أصل المتصفح هذه لكل قيمة `Origin`
  مطبّعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: `serve` (tailnet فقط، ربط loopback) أو `funnel` (عام، يتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. مطلوبة عندما يُتوقع وجود عملاء متصفح من أصول غير loopback.
- `controlUi.chatMessageMaxWidth`: عرض أقصى اختياري لرسائل دردشة Control UI المجمعة. يقبل قيم عرض CSS مقيّدة مثل `960px` و`82%` و`min(1280px, 82%)` و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع إلى أصل ترويسة Host لعمليات النشر التي تعتمد عمدًا على سياسة أصل ترويسة Host.
- `remote.transport`: `ssh` (افتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` هي `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ في بيئة عملية العميل
  يسمح باستخدام `ws://` بنص صريح إلى عناوين IP موثوقة في الشبكة الخاصة؛
  يظل الافتراضي مقصورًا على loopback فقط للنص الصريح. لا يوجد مكافئ في `openclaw.json`،
  ولا تؤثر إعدادات الشبكة الخاصة في المتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` على عملاء Gateway
  WebSocket.
- `gateway.remote.token` / `.password` هي حقول بيانات اعتماد للعميل البعيد. لا تقوم بتهيئة مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان URL أساسي عبر HTTPS للمرحل الخارجي لـ APNs الذي تستخدمه إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بالمرحل إلى Gateway. يجب أن يطابق عنوان URL هذا عنوان URL للمرحل المضمّن في بناء iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة إرسال Gateway إلى المرحل بالمللي ثانية. القيمة الافتراضية `10000`.
- تُفوّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويدرِج تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال محددة بنطاق التسجيل إلى Gateway. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات env مؤقتة لإعداد المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ خروج للتطوير فقط لعناوين URL الخاصة بمرحل HTTP عبر loopback. يجب أن تبقى عناوين URL لمرحلات الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة Gateway WebSocket قبل المصادقة بالمللي ثانية. الافتراضي: `15000`. تكون لـ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأولوية عند ضبطها. زد هذه القيمة على المضيفين المحمّلين أو منخفضي القدرة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال تمهيد بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القناة بالدقائق. اضبط `0` لتعطيل عمليات إعادة تشغيل مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: حد تقادم المقبس بالدقائق. أبقه أكبر من أو مساويًا لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقب الصحة لكل قناة/حساب في ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات تشغيل مراقب الصحة مع إبقاء المراقب العالمي مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند ضبطه، تكون له الأولوية على تجاوز مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كبديل فقط عندما يكون `gateway.auth.*` غير مضبوط.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يتم حله، يفشل الحل بإغلاق آمن (من دون إخفاء بفعل بديل بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين التي تنهي TLS أو تضخ ترويسات العميل الممررة. أدرج فقط الوكلاء الذين تتحكم بهم. تظل إدخالات loopback صالحة لإعدادات الوكيل/الاكتشاف المحلي على نفس المضيف (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل Gateway `X-Real-IP` إذا كان `X-Forwarded-For` مفقودًا. الافتراضي `false` لسلوك الفشل المغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح اختيارية بصيغة CIDR/IP للموافقة التلقائية على اقتران جهاز node لأول مرة بلا نطاقات مطلوبة. تكون معطلة عند عدم ضبطها. لا يوافق هذا تلقائيًا على اقتران المشغل/المتصفح/Control UI/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل عام للسماح/الرفض لأوامر node المعلنة بعد الاقتران وتقييم قائمة السماح الخاصة بالمنصة. استخدم `allowCommands` للاشتراك في أوامر node الخطيرة مثل `camera.snap` و`camera.clip` و`screen.record`؛ يزيل `denyCommands` أمرًا حتى لو كان افتراض المنصة أو السماح الصريح سيشمله بخلاف ذلك. بعد أن يغيّر node قائمة أوامره المعلنة، ارفض اقتران ذلك الجهاز وأعد الموافقة عليه حتى يخزن Gateway لقطة الأوامر المحدثة.
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
    تُعامل قوائم السماح الفارغة كأنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة اختيارية لتقوية الاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل النسخ المتعددة

شغّل عدة Gateway على مضيف واحد بمنافذ ومجلدات حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام ملائمة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، `--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [عدة Gateway](/ar/gateway/multiple-gateways).

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

- `enabled`: يفعّل إنهاء TLS عند مستمع Gateway (HTTPS/WSS) (افتراضي: `false`).
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محليًا ذاتي التوقيع عندما لا تكون الملفات الصريحة مكوّنة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف مفتاح TLS الخاص؛ أبقِ الأذونات مقيّدة.
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

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات وقت التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية دون إعادة تشغيل.
  - `"hybrid"` (افتراضي): جرّب إعادة التحميل الساخنة أولًا؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: أقصى وقت اختياري بالمللي ثانية للانتظار حتى تنتهي العمليات الجارية قبل فرض إعادة تشغيل أو إعادة تحميل ساخنة للقناة. احذفه لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ اضبطه على `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية بأن العمليات لا تزال معلقة.

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
يتم رفض رموز hook في سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` قيمة غير فارغة في `hooks.token`.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ تتمّ إعادة استخدام رمز Gateway مرفوضة.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (مثلًا `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` بقالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك الصريح.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يتم حلّه عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` الخاصة بالتعيين التي تم عرضها عبر القالب كقيم مقدمة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى داخل `hooks.transformsDir` (تُرفض المسارات المطلقة والتنقل عبر المسارات).
  - أبقِ `hooks.transformsDir` ضمن `~/.openclaw/hooks/transforms`؛ تُرفض أدلة Skills في مساحة العمل. إذا أبلغ `openclaw doctor` أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات hooks أو أزِل `hooks.transformsDir`.
- يوجّه `agentId` إلى وكيل محدد؛ تعود المعرفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيل وكيل hook بدون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المعتمدة على القوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` بقالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ تكون قيمة `channel` الافتراضية هي `last`.
- يتجاوز `model` نموذج LLM لهذا تشغيل hook (يجب أن يكون مسموحًا إذا كان كتالوج النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم الإعداد المسبق المضمّن لـ Gmail القيمة `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا احتفظت بهذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لتطابق مساحة أسماء Gmail، مثل `["hook:", "hook:gmail:"]`.
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

- يبدأ Gateway تلقائيًا تشغيل `gog gmail watch serve` عند الإقلاع عندما يكون مكوّنًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلًا بالتوازي مع Gateway.

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

- يقدّم HTML/CSS/JS قابلة للتحرير بواسطة الوكيل وA2UI عبر HTTP ضمن منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الارتباطات غير loopback: تتطلب مسارات Canvas مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل Node WebViews عادةً ترويسات المصادقة؛ بعد إقران node واتصاله، يعلن Gateway عن عناوين URL ذات صلاحية بنطاق node للوصول إلى Canvas/A2UI.
- ترتبط عناوين URL ذات الصلاحية بجلسة WS النشطة لـ node وتنتهي سريعًا. لا يُستخدم الرجوع الاحتياطي المستند إلى IP.
- يحقن عميل إعادة التحميل الحية في HTML المقدّم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون فارغًا.
- يقدّم أيضًا A2UI عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
- عطّل إعادة التحميل الحية للأدلة الكبيرة أو أخطاء `EMFILE`.

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

- `minimal` (الافتراضي عندما يكون Plugin `bonjour` المضمّن مفعّلًا): احذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: ضمّن `cliPath` + `sshPort`؛ ما زال إعلان البث المتعدد على LAN يتطلب تفعيل Plugin `bonjour` المضمّن.
- `off`: يمنع إعلان البث المتعدد على LAN دون تغيير تفعيل Plugin.
- يبدأ Plugin `bonjour` المضمّن تلقائيًا على مضيفي macOS ويكون اختياريًا على Linux وWindows وعمليات نشر Gateway ضمن الحاويات.
- يكون اسم المضيف افتراضيًا هو اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوز ذلك باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### النطاق الواسع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية البث ضمن `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، اقرنه بخادم DNS (يوصى بـ CoreDNS) + DNS مقسّم عبر Tailscale.

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

- تُطبَّق متغيرات البيئة المضمنة فقط إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في دليل العمل الحالي + `~/.openclaw/.env` (لا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول لديك.
- راجع [البيئة](/ar/help/environment) لمعرفة الأسبقية الكاملة.

### استبدال متغيرات البيئة

أشِر إلى متغيرات البيئة في أي سلسلة إعداد باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تُطابَق الأسماء المكتوبة بالأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى طرح خطأ عند تحميل الإعداد.
- استخدم `$${VAR}` للإفلات والحصول على `${VAR}` حرفيًا.
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
- معرّف `source: "file"`: مؤشر JSON مطلق (مثلًا `"/providers/openai/apiKey"`)
- نمط معرّف `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار مفصولة بشرطة مائلة هي `.` أو `..` (مثلًا يُرفَض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القياسية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- يستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُضمَّن مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### إعداد موفّري الأسرار

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

- يدعم موفّر `file` الوضع `mode: "json"` والوضع `mode: "singleValue"` (يجب أن يكون `id` هو `"value"` في وضع singleValue).
- تفشل مسارات موفّرَي الملفات والتنفيذ بإغلاق آمن عندما لا يتوفر تحقق Windows ACL. عيّن `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب موفّر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيًا، تُرفَض مسارات الأوامر التي تكون روابط رمزية. عيّن `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا تم إعداد `trustedDirs`، ينطبق فحص الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة العملية الفرعية لـ `exec` في حدها الأدنى افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار في وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب اللقطة فقط.
- ينطبق ترشيح السطح النشط أثناء التفعيل: تفشل المراجع غير المحلولة على الأسطح الممكّنة في بدء التشغيل/إعادة التحميل، بينما تُتخطّى الأسطح غير النشطة مع تشخيصات.

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
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست صيغة وقت تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات تعريف مفاتيح API قياسية بصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- لا تدعم الملفات التعريفية بوضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملف تعريف مصادقة مدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ وتُزال إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
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

- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/عدم كفاية رصيد حقيقية (الافتراضي: `5`). يمكن أن يندرج نص الفوترة الصريح هنا حتى في استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزود تبقى محصورة في المزود الذي يملكها (مثل OpenRouter `Key limit exceeded`). أما رسائل HTTP `402` القابلة لإعادة المحاولة المتعلقة بنافذة الاستخدام أو حد إنفاق المؤسسة/مساحة العمل، فتبقى في مسار `rate_limit` بدلا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزود لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات لنمو تراجع الفوترة الأسي (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات مستخدمة لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتبديلات ملفات تعريف المصادقة ضمن المزود نفسه لأخطاء التحميل الزائد قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). تندرج هنا الأشكال التي تشير إلى انشغال المزود مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تبديل مزود/ملف تعريف محمل بشكل زائد (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتبديلات ملفات تعريف المصادقة ضمن المزود نفسه لأخطاء حد المعدل قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). تشمل حاوية حد المعدل هذه نصوصا بصياغة المزود مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل النشط بالبايت قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 MB). يحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقمة بجانب الملف النشط.
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونصوص محاضر الجلسات المحفوظة. يعطل `redactSensitive: "off"` سياسة السجلات/المحاضر العامة هذه فقط؛ أما أسطح أمان الواجهة/الأدوات/التشخيصات فما زالت تحجب الأسرار قبل الإرسال.

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
- `flags`: مصفوفة من سلاسل العلامات لتمكين مخرجات سجلات مستهدفة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر عدم التقدم بالميلي ثانية لتصنيف جلسات المعالجة طويلة التشغيل كـ `session.long_running` أو `session.stalled` أو `session.stuck`. تعيد الردود والأدوات والحالة والكتل وتقدم ACP ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت بلا تغيير.
- `stuckSessionAbortMs`: عتبة عمر عدم التقدم بالميلي ثانية قبل أن يصبح العمل النشط المتوقف المؤهل قابلا للإجهاض والتفريغ للاسترداد. عند عدم تعيينها، يستخدم OpenClaw نافذة تشغيل مضمنة ممتدة أكثر أمانا لا تقل عن 10 دقائق و5 أضعاف `stuckSessionWarnMs`.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`). للاطلاع على الإعداد الكامل، وفهرس الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع الخاص بتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بكل إشارة. عند تعيينها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC ترسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تمكين تصدير الآثار أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات الآثار من `0` إلى `1`.
- `otel.flushIntervalMs`: فاصل تفريغ القياسات الدورية بالميلي ثانية.
- `otel.captureContent`: التقاط محتوى خام اختياري لسمات امتداد OTEL. يكون معطلا افتراضيا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامي؛ ويتيح شكل الكائن تمكين `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحة.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لسمات مزود امتدادات GenAI التجريبية الأحدث. افتراضيا، تحتفظ الامتدادات بسمة `gen_ai.system` القديمة للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفين الذين سجلوا مسبقا OpenTelemetry SDK عاما. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بكل إشارة تستخدم عند عدم تعيين مفتاح الإعداد المطابق.
- `cacheTrace.enabled`: تسجيل لقطات تتبع الذاكرة المخبئية للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار إخراج JSONL لتتبع الذاكرة المخبئية (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم فيما يدرج في مخرجات تتبع الذاكرة المخبئية (كلها افتراضيا: `true`).

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
- `auto.enabled`: تمكين التحديث التلقائي في الخلفية لتثبيتات الحزمة (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل تطبيق التحديث التلقائي لقناة stable (الافتراضي: `6`؛ الحد الأقصى: `168`).
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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ عيّن `false` لإخفاء إرسال ACP وإمكانات الإنشاء).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسات ACP (الافتراضي: `true`). عيّن `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف واجهة تشغيل ACP الافتراضية (يجب أن يطابق Plugin تشغيل ACP مسجلا).
  ثبّت Plugin الواجهة أولا، وإذا كان `plugins.allow` معينا، فأدرج معرّف Plugin الواجهة (مثل `acpx`) وإلا فلن يتم تحميل واجهة ACP.
- `defaultAgent`: معرّف وكيل ACP الاحتياطي عندما لا تحدد عمليات الإنشاء هدفا صريحا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات تشغيل ACP؛ الفارغة تعني عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالميلي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم القطعة قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: كتم أسطر الحالة/الأداة المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: يبث `"live"` تدريجيا؛ وتخزن `"final_only"` مؤقتا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف لأسطر حالة/تحديث ACP المسقطة.
- `stream.tagVisibility`: سجل لأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعمال جلسات ACP قبل أن تصبح مؤهلة للتنظيف.
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

- يتحكم `cli.banner.taglineMode` في نمط عبارة اللافتة:
  - `"random"` (الافتراضي): عبارات متناوبة طريفة/موسمية.
  - `"default"`: عبارة حيادية ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: لا يوجد نص عبارة (يبقى عنوان/إصدار اللافتة معروضا).
- لإخفاء اللافتة بالكامل (وليس العبارات فقط)، عيّن متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية يكتبها CLI لتدفقات الإعداد الموجهة (`onboard` و`configure` و`doctor`):

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

راجع حقول الهوية `agents.list` ضمن [افتراضيات الوكيل](/ar/gateway/config-agents#agent-defaults).

---

## الجسر (قديم، أزيل)

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل Nodes عبر WebSocket الخاص بـ Gateway. لم تعد مفاتيح `bridge.*` جزءا من مخطط الإعداد (يفشل التحقق حتى تزال؛ يمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

<Accordion title="إعداد الجسر القديم (مرجع تاريخي)">

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
- `webhookToken`: رمز الحامل المستخدم لتسليم طلبات POST عبر Webhook الخاصة بـ Cron (`delivery.mode = "webhook"`)، وإذا حُذف فلن يُرسَل أي ترويسة مصادقة.
- `webhook`: عنوان URL احتياطي قديم ومهمل لـ Webhook ‏(http/https) يُستخدم فقط للمهام المخزنة التي ما زالت تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادات المحاولة للمهام أحادية التشغيل عند حدوث أخطاء عابرة (الافتراضي: `3`؛ النطاق: `0`-`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 مدخلات).
- `retryOn`: أنواع الأخطاء التي تشغل إعادات المحاولة - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. احذفها لإعادة محاولة كل الأنواع العابرة.

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

- `enabled`: تمكين تنبيهات الفشل لمهام Cron (الافتراضي: `false`).
- `after`: عدد حالات الفشل المتتالية قبل إطلاق تنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للوظيفة نفسها (عدد صحيح غير سالب).
- `includeSkipped`: احتساب عمليات التشغيل المتخطاة المتتالية ضمن عتبة التنبيه (الافتراضي: `false`). تُتبع عمليات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
- `mode`: وضع التسليم - `"announce"` يرسل عبر رسالة قناة؛ `"webhook"` ينشر إلى Webhook المكون.
- `accountId`: حساب اختياري أو معرف قناة اختياري لتقييد نطاق تسليم التنبيه.

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
- `accountId`: تجاوز اختياري للحساب من أجل التسليم.
- يتجاوز `delivery.failureDestination` الخاص بكل مهمة هذا الافتراضي العام.
- عندما لا تُضبط وجهة فشل عامة ولا وجهة خاصة بالمهمة، تعود المهام التي تسلم بالفعل عبر `announce` إلى هدف الإعلان الأساسي ذلك عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتتبع عمليات تنفيذ Cron المعزولة بوصفها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

تُوسَّع عناصر نائبة القالب في `tools.media.models[].args`:

| المتغير           | الوصف                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (بلا مغلفات السجل/المرسل)             |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعة                 |
| `{{From}}`         | معرف المرسل                                 |
| `{{To}}`           | معرف الوجهة                            |
| `{{MessageSid}}`   | معرف رسالة القناة                                |
| `{{SessionId}}`    | UUID للجلسة الحالية                              |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                 |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                          |
| `{{MediaPath}}`    | مسار الوسائط المحلي                                  |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)               |
| `{{Transcript}}`   | نص تفريغ الصوت                                  |
| `{{Prompt}}`       | موجّه الوسائط المحلول لمدخلات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لمدخلات CLI         |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)               |
| `{{SenderName}}`   | اسم عرض المرسل (بأفضل جهد)                 |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                 |
| `{{Provider}}`     | تلميح المزود (WhatsApp، Telegram، Discord، إلخ) |

---

## تضمينات التكوين (`$include`)

قسّم التكوين إلى ملفات متعددة:

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
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبة إلى الملف الذي يتضمنها، لكن يجب أن تبقى داخل دليل التكوين الأعلى مستوى (`dirname` من `openclaw.json`). يُسمح بالصيغ المطلقة/`../` فقط عندما تظل تُحل داخل ذلك الحد.
- الكتابات المملوكة لـ OpenClaw التي تغير قسما واحدا فقط من المستوى الأعلى ومدعوما بتضمين ملف واحد تكتب عبر ذلك الملف المضمن. على سبيل المثال، يحدّث `plugins install` قيمة `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` سليما.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط للكتابات المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بشكل مغلق بدلا من تسطيح التكوين.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [التكوين](/ar/gateway/configuration) · [أمثلة التكوين](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [التكوين](/ar/gateway/configuration)
- [أمثلة التكوين](/ar/gateway/configuration-examples)
