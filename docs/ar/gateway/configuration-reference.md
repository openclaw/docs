---
read_when:
    - تحتاج إلى دلالات التكوين الدقيقة على مستوى الحقول أو القيم الافتراضية
    - تتحقق من كتل تكوين القناة أو النموذج أو Gateway أو الأداة
summary: مرجع تكوين Gateway لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-05-05T06:17:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd0b6bf9a77d91bcc240088e4be92e44b6e70910efe00f7ed99534fb70983479
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع إعدادات النواة لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة للمهام، راجع [الإعدادات](/ar/gateway/configuration).

يغطي أسطح إعدادات OpenClaw الرئيسية ويربط بمراجع خارجية عندما يكون لنظام فرعي مرجعه الأعمق الخاص به. تعيش كتالوجات الأوامر المملوكة للقنوات وPlugin ومفاتيح الذاكرة العميقة/QMD في صفحاتها الخاصة بدلا من هذه الصفحة.

حقيقة الكود:

- يطبع `openclaw config schema` مخطط JSON Schema الحي المستخدم للتحقق وControl UI، مع دمج بيانات Plugin/القنوات/المضمنة الوصفية عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة المسار لأدوات التعمق
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس وثائق الإعدادات مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` المسمى `config.schema.lookup` للحصول على وثائق وقيود دقيقة على مستوى الحقل قبل التعديلات. استخدم [الإعدادات](/ar/gateway/configuration) للإرشاد الموجه للمهام، وهذه الصفحة لخريطة الحقول الأوسع، والقيم الافتراضية، وروابط مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر Slash](/ar/tools/slash-commands) لكتالوج الأوامر الحالي المدمج + المضمن
- صفحات القنوات/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق الإعدادات هو **JSON5** (يسمح بالتعليقات + الفواصل اللاحقة). كل الحقول اختيارية — يستخدم OpenClaw قيما افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح إعدادات كل قناة إلى صفحة مخصصة — راجع [الإعدادات — القنوات](/ar/gateway/config-channels) لـ `channels.*`، بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والقنوات المضمنة الأخرى (المصادقة، والتحكم في الوصول، وتعدد الحسابات، وبوابة الإشارات).

## افتراضيات الوكيل، تعدد الوكلاء، الجلسات، والرسائل

انتقلت إلى صفحة مخصصة — راجع [الإعدادات — الوكلاء](/ar/gateway/config-agents) لـ:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، sandbox)
- `multiAgent.*` (توجيه تعدد الوكلاء والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التقليم)
- `messages.*` (تسليم الرسائل، TTS، عرض markdown)
- `talk.*` (وضع Talk)
  - `talk.speechLocale`: معرف لغة BCP 47 اختياري للتعرف على الكلام في Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم تعيينه، يحتفظ Talk بنافذة التوقف الافتراضية للمنصة قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)

## الأدوات والمزودون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وإعدادات الأدوات المدعومة بالمزودين، وإعدادات المزودين المخصصين / عنوان URL الأساسي إلى صفحة مخصصة — راجع [الإعدادات — الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

توجد تعريفات المزودين، وقوائم السماح بالنماذج، وإعداد المزودين المخصصين في [الإعدادات — الأدوات والمزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls). يملك الجذر `models` أيضا سلوك كتالوج النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك كتالوج المزود (`merge` أو `replace`).
- `models.providers`: خريطة مزود مخصص مفهرسة بمعرف المزود.
- `models.pricing.enabled`: يتحكم في تمهيد التسعير في الخلفية الذي يبدأ بعد وصول العمليات الجانبية والقنوات إلى مسار جاهزية Gateway. عند `false`، يتخطى Gateway جلب كتالوجات تسعير OpenRouter وLiteLLM؛ وتظل قيم `models.providers.*.models[].cost` المهيأة تعمل لتقديرات التكلفة المحلية.

## MCP

توجد تعريفات خوادم MCP المدارة بواسطة OpenClaw ضمن `mcp.servers` وتستهلكها Pi المضمنة ومهايئات التشغيل الأخرى. تدير أوامر `openclaw mcp list` و`show` و`set` و`unset` هذه الكتلة دون الاتصال بالخادم الهدف أثناء تعديلات الإعدادات.

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

- `mcp.servers`: تعريفات خوادم MCP مسماة من نوع stdio أو بعيدة لبيئات التشغيل التي تعرض أدوات MCP المهيأة. تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛ ويعد `type: "http"` اسما مستعارا أصليا لـ CLI يقوم `openclaw mcp set` و`openclaw doctor --fix` بتطبيعه إلى الحقل القياسي `transport`.
- `mcp.sessionIdleTtlMs`: مدة TTL للخمول لبيئات تشغيل MCP المضمنة المحددة بنطاق الجلسة. تطلب التشغيلات المضمنة ذات المرة الواحدة التنظيف عند نهاية التشغيل؛ وتمثل مدة TTL هذه خط الرجوع للجلسات طويلة العمر والمستدعين المستقبليين.
- تطبق التغييرات ضمن `mcp.*` مباشرة بإتلاف بيئات تشغيل MCP المخزنة مؤقتا للجلسة. يعيد اكتشاف/استخدام الأداة التالي إنشاءها من الإعدادات الجديدة، لذلك تزال إدخالات `mcp.servers` المحذوفة فورا بدلا من انتظار مدة TTL للخمول.

راجع [MCP](/ar/cli/mcp#openclaw-as-an-mcp-client-registry) و[خلفيات CLI](/ar/gateway/cli-backends#bundle-mcp-overlays) لمعرفة سلوك التشغيل.

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

- `allowBundled`: قائمة سماح اختيارية للـ Skills المضمنة فقط (لا تتأثر Skills المدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أقل أولوية).
- `install.preferBrew`: عند true، فضل مثبتات Homebrew عندما يكون `brew` متاحا قبل الرجوع إلى أنواع مثبتات أخرى.
- `install.nodeManager`: تفضيل مثبت node لمواصفات `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` يعطل Skill حتى لو كان مضمنا/مثبتا.
- `entries.<skillKey>.apiKey`: تسهيل لـ Skills التي تعلن متغير بيئة أساسيا (سلسلة نصية صريحة أو كائن SecretRef).

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

- تحمل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins أصلية من OpenClaw بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي بلا manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل gateway.**
- `allow`: قائمة سماح اختيارية (لا تحمل إلا Plugins المدرجة). تتقدم `deny`.
- `bundledDiscovery`: القيمة الافتراضية هي `"allowlist"` للإعدادات الجديدة، لذلك فإن `plugins.allow` غير الفارغ يبوّب أيضا Plugins المزودين المضمنة، بما في ذلك مزودو تشغيل web-search. يكتب Doctor القيمة `"compat"` لإعدادات قوائم السماح القديمة المرحّلة للحفاظ على سلوك مزودي الحزم المضمنة الحالي حتى تختار الاشتراك.
- `plugins.entries.<id>.apiKey`: حقل تسهيل لمفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة محددة النطاق للـ Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عند `false`، تمنع النواة `before_prompt_build` وتتجاهل الحقول التي تعدل المطالبة من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق على خطافات Plugin الأصلية وأدلة الخطافات المدعومة التي توفرها الحزم.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عند `true`، يمكن لـ Plugins غير المضمنة الموثوقة قراءة محتوى المحادثة الخام من الخطافات ذات الأنواع مثل `llm_input` و`llm_output` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: ثق صراحة بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لتشغيلات الوكلاء الفرعيين في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات معرف بواسطة Plugin (يتحقق منه مخطط Plugin الأصلي في OpenClaw عند توفره).
- توجد إعدادات حساب/تشغيل Plugin القناة ضمن `channels.<id>` ويجب أن توصف بواسطة بيانات `channelConfigs` الوصفية في manifest الخاص بالـ Plugin المالك، وليس بواسطة سجل مركزي لخيارات OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزود جلب الويب Firecrawl.
  - `apiKey`: مفتاح API لـ Firecrawl (يقبل SecretRef). يرجع إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API الخاص بـ Firecrawl (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخرج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: أقصى عمر للتخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث Grok على الويب).
  - `enabled`: فعّل مزود X Search.
  - `model`: نموذج Grok المطلوب استخدامه للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة cron لكل مسح dreaming كامل (`"0 3 * * *"` افتراضيا).
  - `model`: تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه بـ `allowedModels` لتقييد الأهداف. تعاد محاولة أخطاء عدم توفر النموذج مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ أما إخفاقات الثقة أو قائمة السماح فلا ترجع بصمت.
  - سياسة المراحل والعتبات تفاصيل تنفيذية (ليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـ Plugins حزم Claude المفعلة أيضا المساهمة بافتراضيات Pi مضمنة من `settings.json`؛ يطبق OpenClaw تلك القيم كإعدادات وكيل منقاة، وليس كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرف Plugin محرك السياق النشط؛ القيمة الافتراضية `"legacy"` ما لم تثبت وتحدد محركا آخر.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يمكن لـ OpenClaw اكتشاف طلبات المتابعة من أدوار المحادثة وتسليمها عبر تشغيلات Heartbeat.

- `commitments.enabled`: فعّل استخراج LLM المخفي، والتخزين، وتسليم Heartbeat للالتزامات المستنتجة للمتابعة. الافتراضي: `false`.
- `commitments.maxPerDay`: الحد الأقصى للالتزامات المستنتجة للمتابعة التي تسلم لكل جلسة وكيل في يوم متجدد. الافتراضي: `3`.

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
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد وقت الخمول أو عندما تتجاوز
  الجلسة حدّها الأقصى. عيّن `idleMinutes: 0` أو `maxTabsPerSession: 0` من أجل
  تعطيل أوضاع التنظيف الفردية هذه.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا عند عدم ضبطه، لذلك يظل تنقّل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا بتنقّل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) لحظر الشبكة الخاصة نفسه أثناء فحوصات قابلية الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصصة للإرفاق فقط (التشغيل/الإيقاف/إعادة الضبط معطّلة).
- يقبل `profiles.*.cdpUrl` كلًا من `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك الموفّر بعنوان URL مباشر لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية الوصول إلى CDP البعيد و
  `attachOnly`، بالإضافة إلى طلبات فتح علامات التبويب. تحتفظ ملفات تعريف loopback
  المُدارة بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مُدارة خارجيًا ويمكن الوصول إليها عبر loopback، فاضبط
  `attachOnly: true` لذلك الملف التعريفي؛ وإلا فسيتعامل OpenClaw مع منفذ loopback كملف
  تعريف متصفح محلي مُدار وقد يبلّغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلًا من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف محدد
  لمتصفح قائم على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات معتمدة على اللقطات/المراجع بدلًا من استهداف محددات CSS، وخطافات رفع ملف واحد،
  ومن دون تجاوزات لمهلة مربعات الحوار، ومن دون `wait --load networkidle`، ومن دون
  `responsebody` أو تصدير PDF أو اعتراض التنزيل أو إجراءات الدُفعات.
- تضبط ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائيًا؛ ولا
  تضبط `cdpUrl` صراحةً إلا لـ CDP البعيد.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف التعريفي. استخدم ذلك لتشغيل ملف تعريف في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية و`browser.localCdpReadyTimeoutMs` لاستعداد websocket الخاص بـ CDP
  بعد الإطلاق. ارفع هذه القيم على المضيفين الأبطأ حيث يبدأ Chrome بنجاح
  لكن فحوصات الاستعداد تتسابق مع بدء التشغيل. يجب أن تكون كلتا القيمتين
  عددين صحيحين موجبين حتى `120000` مللي ثانية؛ ويتم رفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائمًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  الصيغتين `~` و`~/...` لدليل المنزل في نظام التشغيل لديك قبل إطلاق Chromium.
  كما يتم توسيع علامة التلدة في `userDataDir` الخاص بكل ملف تعريف على ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، الافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء تشغيل Chromium المحلي (مثل
  `--disable-gpu` أو تحجيم النافذة أو أعلام التصحيح).

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

- `seamColor`: لون تمييز لواجهة التطبيق الأصلية (تلوين فقاعة وضع المحادثة، وما إلى ذلك).
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
- `port`: منفذ واحد متعدد الإرسال لـ WS + HTTP. الأسبقية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto`، أو `loopback` (الافتراضي)، أو `lan` (`0.0.0.0`)، أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط)، أو `custom`.
- **أسماء bind المستعارة القديمة**: استخدم قيم وضع bind في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء المضيف المستعارة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع ربط `loopback` الافتراضي على `127.0.0.1` داخل الحاوية. مع شبكات الجسر في Docker (`-p 18789:18789`)، تصل الحركة عبر `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على كل الواجهات.
- **المصادقة**: مطلوبة افتراضياً. تتطلب عمليات الربط غير حلقة الرجوع مصادقة Gateway. عملياً، يعني ذلك رمزاً/كلمة مرور مشتركة أو وكيلاً عكسياً مدركاً للهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد الأولي رمزاً افتراضياً.
- إذا ضُبط كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. تفشل تدفقات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون الاثنان مضبوطين والوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ لا يُعرض هذا عمداً في مطالبات الإعداد الأولي.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي مدرك للهوية وثق برؤوس الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع افتراضياً مصدر وكيل **غير حلقة الرجوع**؛ تتطلب الوكلاء العكسية على حلقة الرجوع للمضيف نفسه ضبط `gateway.auth.trustedProxy.allowLoopback = true` صراحةً. يمكن للمنادين الداخليين على المضيف نفسه استخدام `gateway.auth.password` كخيار احتياطي مباشر محلي؛ يظل `gateway.auth.token` متبادل الاستبعاد مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لرؤوس هوية Tailscale Serve أن تفي بمصادقة واجهة التحكم/WebSocket (يُتحقق منها عبر `tailscale whois`). لا تستخدم نقاط نهاية واجهة برمجة تطبيقات HTTP مصادقة رؤوس Tailscale تلك؛ بل تتبع وضع مصادقة HTTP العادي في Gateway بدلاً من ذلك. يفترض هذا التدفق بلا رموز أن مضيف Gateway موثوق. القيمة الافتراضية هي `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات المصادقة الفاشلة. ينطبق لكل عنوان IP عميل ولكل نطاق مصادقة (يُتتبّع shared-secret وdevice-token بشكل مستقل). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار واجهة التحكم غير المتزامن في Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تفعّل المحدِّد عند الطلب الثاني بدلاً من أن تتسابق كلتاهما كعدم تطابق عادي.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمداً تحديد معدل حركة localhost أيضاً (لإعدادات الاختبار أو نشرات الوكيل الصارمة).
- تُخنق محاولات مصادقة WS ذات منشأ المتصفح دائماً مع تعطيل إعفاء حلقة الرجوع (دفاعاً معمقاً ضد هجمات القوة الغاشمة القائمة على المتصفح على localhost).
- على حلقة الرجوع، تُعزل عمليات القفل تلك ذات منشأ المتصفح لكل قيمة `Origin`
  مطبّعة، لذلك لا تؤدي الإخفاقات المتكررة من منشأ localhost واحد تلقائياً إلى
  قفل منشأ مختلف.
- `tailscale.mode`: ‏`serve` (tailnet فقط، ربط حلقة الرجوع) أو `funnel` (عام، يتطلب المصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لمنشأ المتصفح لاتصالات Gateway WebSocket. مطلوبة عندما يُتوقع عملاء متصفح من منشآت غير حلقة الرجوع.
- `controlUi.chatMessageMaxWidth`: حد أقصى اختياري للعرض لرسائل دردشة واجهة التحكم المجمّعة. يقبل قيم عرض CSS مقيّدة مثل `960px`، و`82%`، و`min(1280px, 82%)`، و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطر يمكّن آلية الاحتياط لمنشأ رأس Host للنشرات التي تعتمد عمداً على سياسة منشأ رأس Host.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` إما `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ في بيئة عملية جانب العميل
  يسمح بـ `ws://` بنص صريح إلى عناوين IP موثوقة على شبكة خاصة؛ يبقى الافتراضي
  مقتصراً على حلقة الرجوع للنص الصريح. لا يوجد مكافئ في `openclaw.json`،
  ولا تؤثر إعدادات الشبكة الخاصة في المتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` على عملاء Gateway
  WebSocket.
- `gateway.remote.token` / `.password` حقول اعتماد للعميل البعيد. لا تضبط مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي للمرحّل الخارجي لـ APNs الذي تستخدمه إصدارات iOS الرسمية/TestFlight بعد نشرها تسجيلات مدعومة بالمرحّل إلى Gateway. يجب أن يطابق هذا العنوان عنوان المرحّل المضمّن في إصدار iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحّل بالمللي ثانية. القيمة الافتراضية `10000`.
- تُفوَّض التسجيلات المدعومة بالمرحّل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحّل، ويمرر منحة إرسال مقيدة بنطاق التسجيل إلى Gateway. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزّن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئة مؤقتة لإعداد المرحّل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب للتطوير فقط لعناوين مرحّل HTTP على حلقة الرجوع. يجب أن تبقى عناوين مرحّل الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة WebSocket لـ Gateway قبل المصادقة بالمللي ثانية. الافتراضي: `15000`. يأخذ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأسبقية عند ضبطه. زد هذه القيمة على المضيفين المحمّلين أو محدودي القدرة حيث يمكن للعملاء المحليين الاتصال بينما لا تزال تهيئة بدء التشغيل تستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقب صحة القناة بالدقائق. اضبط `0` لتعطيل عمليات إعادة التشغيل الخاصة بمراقب الصحة عالمياً. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس القديم بالدقائق. أبقِ هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لعمليات إعادة التشغيل بواسطة مراقب الصحة لكل قناة/حساب في ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: إلغاء اشتراك لكل قناة من عمليات إعادة التشغيل بواسطة مراقب الصحة مع إبقاء المراقب العام مفعلاً.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند ضبطه، يأخذ الأسبقية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما تكون `gateway.auth.*` غير مضبوطة.
- إذا ضُبط `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وكان غير محلول، يفشل الحل بإغلاق آمن (من دون أن يخفيه احتياطي بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين التي تنهي TLS أو تحقن رؤوس العميل المعاد توجيهه. أدرج فقط الوكلاء التي تتحكم بها. تظل إدخالات حلقة الرجوع صالحة لإعدادات الوكيل/الكشف المحلي على المضيف نفسه (على سبيل المثال Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات حلقة الرجوع مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل Gateway ‏`X-Real-IP` إذا كان `X-Forwarded-For` مفقوداً. الافتراضي `false` لسلوك الفشل بالإغلاق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح CIDR/IP اختيارية للموافقة التلقائية على إقران جهاز Node لأول مرة من دون نطاقات مطلوبة. تكون معطلة عندما لا تكون مضبوطة. لا يوافق هذا تلقائياً على إقران المشغّل/المتصفح/واجهة التحكم/دردشة الويب، ولا يوافق تلقائياً على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تحكم عام بالسماح/الرفض لأوامر Node المعلنة بعد الإقران وتقييم قائمة سماح المنصة. استخدم `allowCommands` لاختيار أوامر Node الخطرة مثل `camera.snap`، و`camera.clip`، و`screen.record`؛ يزيل `denyCommands` أمراً حتى إذا كان افتراض المنصة أو سماح صريح سيشمله لولا ذلك. بعد أن يغيّر Node قائمة أوامره المعلنة، ارفض إقران ذلك الجهاز وأعد الموافقة عليه حتى يخزن Gateway لقطة الأوامر المحدّثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP ‏`POST /tools/invoke` (توسّع قائمة الرفض الافتراضية).
- `gateway.tools.allow`: إزالة أسماء الأدوات من قائمة رفض HTTP الافتراضية.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- إكمالات المحادثة: معطلة افتراضياً. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- واجهة برمجة تطبيقات Responses: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال عناوين URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة على أنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب عناوين URL.
- رأس اختياري لتقوية الاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطه فقط لمنشآت HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل متعدد النسخ

شغّل أكثر من مثيل Gateway واحد على مضيف واحد بمنافذ ومجلدات حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

علامات ملائمة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [مثيلات Gateway متعددة](/ar/gateway/multiple-gateways).

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
- `autoGenerate`: ينشئ تلقائياً زوج شهادة/مفتاح موقّعاً ذاتياً محلياً عندما لا تكون الملفات الصريحة مضبوطة؛ للاستخدام المحلي/التطويري فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ أبقه مقيّد الصلاحيات.
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

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات أثناء وقت التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائماً عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة التشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخن أولاً؛ وارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة التهدئة بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى الاختياري للوقت بالمللي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل. احذفه لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ اضبطه على `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية بأنها لا تزال معلقة.

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
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ يُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (مثلًا `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` مستندًا إلى قالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` الخاصة بالتعيين والمعروضة من القالب على أنها مقدمة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقل حمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء خطاف.
  - يجب أن يكون `transform.module` مسارًا نسبيًا وأن يبقى ضمن `hooks.transformsDir` (تُرفض المسارات المطلقة والتنقل عبر المسارات).
  - أبقِ `hooks.transformsDir` ضمن `~/.openclaw/hooks/transforms`؛ تُرفض أدلة مهارات مساحة العمل. إذا أبلغ `openclaw doctor` أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات الخطافات أو أزِل `hooks.transformsDir`.
- يوجه `agentId` إلى وكيل محدد؛ تعود المعرّفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، `[]` = منع الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل الخطاف دون `sessionKey` صريح.
- `allowRequestSessionKey`: السماح للمتصلين بـ `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` مستندًا إلى قالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ يكون `channel` افتراضيًا `last`.
- يتجاوز `model` نموذج LLM لتشغيل هذا الخطاف (يجب أن يكون مسموحًا به إذا كان كتالوج النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المدمج `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت ذلك التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لمطابقة نطاق أسماء Gmail، مثلًا `["hook:", "hook:gmail:"]`.
- إذا كنت تحتاج إلى `hooks.allowRequestSessionKey: false`، فتجاوز الإعداد المسبق باستخدام `sessionKey` ثابت بدلًا من الافتراضي المستند إلى قالب.

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

- يشغّل Gateway تلقائيًا `gog gmail watch serve` عند الإقلاع عندما يكون مهيأً. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
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

- يقدّم HTML/CSS/JS القابل للتحرير بواسطة الوكيل وA2UI عبر HTTP ضمن منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الارتباطات غير loopback: تتطلب مسارات Canvas مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل WebViews الخاصة بـ Node عادةً ترويسات المصادقة؛ بعد إقران عقدة واتصالها، يعلن Gateway عن عناوين URL ذات صلاحية مرتبطة بالعقدة للوصول إلى Canvas/A2UI.
- ترتبط عناوين URL ذات الصلاحية بجلسة WS النشطة للعقدة وتنتهي صلاحيتها بسرعة. لا يُستخدم بديل قائم على IP.
- يحقن عميل إعادة التحميل الحي في HTML المقدّم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون فارغًا.
- يقدّم أيضًا A2UI عند `/__openclaw__/a2ui/`.
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

- `minimal` (الافتراضي عندما يكون Plugin `bonjour` المضمّن مفعّلًا): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` + `sshPort`؛ لا يزال إعلان البث المتعدد على LAN يتطلب تفعيل Plugin `bonjour` المضمّن.
- `off`: يمنع إعلان البث المتعدد على LAN دون تغيير تفعيل Plugin.
- يبدأ Plugin `bonjour` المضمّن تلقائيًا على مضيفات macOS ويكون اختياريًا على Linux وWindows وعمليات نشر Gateway داخل الحاويات.
- يكون اسم المضيف افتراضيًا هو اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية البث ضمن `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، اقرنها بخادم DNS (يوصى بـ CoreDNS) + DNS مقسم عبر Tailscale.

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

أشر إلى متغيرات البيئة في أي سلسلة إعداد باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تتم مطابقة الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- المتغيرات المفقودة/الفارغة ترمي خطأ عند تحميل الإعداد.
- استخدم `$${VAR}` للهروب للحصول على `${VAR}` حرفية.
- يعمل مع `$include`.

---

## الأسرار

مراجع الأسرار إضافية: لا تزال قيم النص الصريح تعمل.

### `SecretRef`

استخدم شكلاً واحداً للكائن:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- نمط معرف `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- معرف `source: "file"`: مؤشر JSON مطلق (مثلاً `"/providers/openai/apiKey"`)
- نمط معرف `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرفات `source: "exec"` على مقاطع مسار محددة بشرطات مائلة تساوي `.` أو `..` (مثلاً يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة المرجعية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُضمَّن مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

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
- تفشل مسارات موفرَي الملفات والتنفيذ بإغلاق آمن عندما لا يكون التحقق من Windows ACL متاحاً. عيّن `allowInsecurePath: true` للمسارات الموثوقة التي لا يمكن التحقق منها فقط.
- يتطلب موفر `exec` مسار `command` مطلقاً ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضياً، تُرفض مسارات الأوامر التي تكون روابط رمزية. عيّن `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف الذي حُلّ.
- إذا تم إعداد `trustedDirs`، يُطبَّق فحص الدليل الموثوق على مسار الهدف الذي حُلّ.
- تكون بيئة الابن في `exec` بالحد الأدنى افتراضياً؛ مرّر المتغيرات المطلوبة صراحة باستخدام `passEnv`.
- تُحل مراجع الأسرار عند وقت التفعيل في لقطة داخل الذاكرة، ثم تقرأ مسارات الطلبات اللقطة فقط.
- يُطبَّق ترشيح السطح النشط أثناء التفعيل: تفشل المراجع غير المحلولة على الأسطح الممكّنة في بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع تشخيصات.

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
- يدعم `auth-profiles.json` المراجع على مستوى القيمة (`keyRef` لـ `api_key` و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست تنسيق وقت تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات شخصية API-key مرجعية `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- لا تدعم الملفات الشخصية في وضع OAuth (`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- تأتي استيرادات OAuth القديمة من `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: المهلة الأساسية بالساعات عند فشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). قد يصل نص فوترة صريح إلى هنا حتى في استجابات `401`/`403`، لكن مطابِقات النص الخاصة بالموفّر تبقى محصورة بالموفّر الذي يملكها (مثل OpenRouter `Key limit exceeded`). تبقى رسائل نافذة استخدام HTTP `402` القابلة لإعادة المحاولة أو رسائل حد إنفاق المؤسسة/مساحة العمل في مسار `rate_limit` بدلاً من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل موفّر لساعات مهلة الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأُسّي لمهلة الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: المهلة الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو مهلة `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدّادات المهلة (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتبديلات ملفات تعريف المصادقة لدى الموفّر نفسه لأخطاء التحميل الزائد قبل الانتقال إلى الرجوع الاحتياطي للنموذج (الافتراضي: `1`). تندرج هنا أشكال انشغال الموفّر مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير موفّر/ملف تعريف محمّل زائدًا (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتبديلات ملفات تعريف المصادقة لدى الموفّر نفسه لأخطاء حد المعدل قبل الانتقال إلى الرجوع الاحتياطي للنموذج (الافتراضي: `1`). تتضمن خانة حد المعدل تلك نصوصًا بصيغة الموفّر مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- `maxFileBytes`: الحجم الأقصى لملف السجل النشط بالبايت قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 ميغابايت). يحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقّمة بجانب الملف النشط.
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونص سجل جلسة المحادثة المستمر. لا يؤدي `redactSensitive: "off"` إلا إلى تعطيل سياسة السجلات/سجل المحادثة العامة هذه؛ تظل أسطح سلامة الواجهة/الأدوات/التشخيصات تحجب الأسرار قبل الإرسال.

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

- `enabled`: مفتاح تفعيل رئيسي لمخرجات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات التي تفعّل إخراج سجلات موجّهًا (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: حد عمر عدم التقدم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل على أنها `session.long_running` أو `session.stalled` أو `session.stuck`. يعيد الرد أو الأداة أو الحالة أو الكتلة أو تقدم ACP ضبط المؤقّت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت غير متغيرة.
- `stuckSessionAbortMs`: حد عمر عدم التقدم بالمللي ثانية قبل أن يصبح العمل النشط المتوقف والمؤهل قابلًا للإجهاض والتصفية من أجل الاسترداد. عند عدم ضبطه، يستخدم OpenClaw نافذة تشغيل مضمنة ممتدة أكثر أمانًا لا تقل عن 10 دقائق و5 أضعاف `stuckSessionWarnMs`.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`). للاطلاع على التكوين الكامل، وفهرس الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع من أجل تصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بالإشارة. عند ضبطها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير الآثار أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات الآثار `0`-`1`.
- `otel.flushIntervalMs`: الفاصل الدوري لتفريغ القياس بالمللي ثانية.
- `otel.captureContent`: التقاط اختياري للمحتوى الخام لسمات مقطع OTEL. يكون معطلًا افتراضيًا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامي؛ ويتيح لك شكل الكائن تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحةً.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لسمات موفّر مقاطع GenAI التجريبية الأحدث. افتراضيًا تحتفظ المقاطع بسمة `gen_ai.system` القديمة للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفين الذين سجّلوا مسبقًا OpenTelemetry SDK عموميًا. يتخطى OpenClaw حينها بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بالإشارة تُستخدم عندما لا يكون مفتاح التكوين المطابق مضبوطًا.
- `cacheTrace.enabled`: تسجيل لقطات أثر الذاكرة المخبأة للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لـ JSONL أثر الذاكرة المخبأة (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: التحكم في ما يُضمَّن في مخرجات أثر الذاكرة المخبأة (كلها افتراضيًا: `true`).

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
- `auto.stableJitterHours`: نافذة توزيع طرح إضافية لقناة stable بالساعات (الافتراضي: `12`؛ الحد الأقصى: `168`).
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

- `enabled`: بوابة ميزة ACP العمومية (الافتراضي: `true`؛ اضبطها على `false` لإخفاء إتاحة إرسال ACP والتفريخ).
- `dispatch.enabled`: بوابة مستقلة لإرسال دور جلسة ACP (الافتراضي: `true`). اضبطها على `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف واجهة تشغيل ACP الافتراضي (يجب أن يطابق Plugin تشغيل ACP مسجّلًا).
  ثبّت Plugin الواجهة أولًا، وإذا كان `plugins.allow` مضبوطًا، فأدرج معرّف Plugin الواجهة (مثل `acpx`) وإلا فلن تُحمّل واجهة ACP.
- `defaultAgent`: معرّف وكيل ACP الاحتياطي الهدف عندما لا تحدد عمليات التفريخ هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات تشغيل ACP؛ الفراغ يعني عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة بالتوازي.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: كبح أسطر الحالة/الأداة المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: يبث `"live"` تدريجيًا؛ ويخزّن `"final_only"` مؤقتًا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: فاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف خرج المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف لأسطر حالة/تحديث ACP المعروضة.
- `stream.tagVisibility`: سجل من أسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعمال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
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

- يتحكم `cli.banner.taglineMode` في نمط العبارة التعريفية للشعار:
  - `"random"` (الافتراضي): عبارات تعريفية مضحكة/موسمية متناوبة.
  - `"default"`: عبارة تعريفية حيادية ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: لا يوجد نص عبارة تعريفية (يظل عنوان الشعار/الإصدار معروضًا).
- لإخفاء الشعار بالكامل (وليس العبارات التعريفية فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية تكتبها تدفقات الإعداد الموجّه في CLI (`onboard` و`configure` و`doctor`):

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

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل العقد عبر WebSocket الخاص بـ Gateway. لم تعد مفاتيح `bridge.*` جزءًا من مخطط التكوين (يفشل التحقق حتى تُزال؛ يمكن لـ `openclaw doctor --fix` حذف المفاتيح غير المعروفة).

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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. يتحكم أيضا في تنظيف نصوص Cron المحذوفة المؤرشفة. الافتراضي: `24h`؛ اضبطه على `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى للحجم لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر المحتفظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز الحامل المستخدم لتسليم POST الخاص بـ Webhook لـ Cron (`delivery.mode = "webhook"`)، إذا حُذف فلن يُرسل ترويسة مصادقة.
- `webhook`: عنوان URL قديم احتياطي مهمل لـ Webhook (http/https) يُستخدم فقط للمهام المخزنة التي لا تزال تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادة المحاولة للمهام ذات التنفيذ الواحد عند حدوث أخطاء عابرة (الافتراضي: `3`؛ النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — `"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة المحاولة لكل الأنواع العابرة.

ينطبق فقط على مهام Cron ذات التنفيذ الواحد. تستخدم المهام المتكررة معالجة فشل منفصلة.

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
- `mode`: وضع التسليم — يرسل `"announce"` عبر رسالة قناة؛ وينشر `"webhook"` إلى Webhook المُعد.
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
- `mode`: `"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلان. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب في وضع Webhook.
- `accountId`: تجاوز حساب اختياري للتسليم.
- يتجاوز `delivery.failureDestination` لكل مهمة هذا الإعداد الافتراضي العام.
- عندما لا تُضبط وجهة فشل عامة ولا وجهة فشل لكل مهمة، تعود المهام التي تُسلّم بالفعل عبر `announce` إلى هدف الإعلان الأساسي ذلك عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتبع عمليات تنفيذ Cron المعزولة باعتبارها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

تُوسَّع عناصر القالب النائبة في `tools.media.models[].args`:

| المتغير           | الوصف                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (بلا مغلفات السجل/المرسل)             |
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
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الخرج لإدخالات CLI         |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (أفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (أفضل جهد)               |
| `{{SenderName}}`   | اسم عرض المرسل (أفضل جهد)                 |
| `{{SenderE164}}`   | رقم هاتف المرسل (أفضل جهد)                 |
| `{{Provider}}`     | تلميح المزوّد (whatsapp وtelegram وdiscord وما إلى ذلك) |

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
- مصفوفة ملفات: تُدمج بعمق بالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (تتجاوز القيم المضمنة).
- التضمينات المتداخلة: حتى 10 مستويات عمقا.
- المسارات: تُحل نسبة إلى الملف الذي يتضمنها، ولكن يجب أن تبقى داخل دليل الإعداد ذي المستوى الأعلى (`dirname` الخاص بـ `openclaw.json`). تُسمح الصيغ المطلقة/`../` فقط عندما لا تزال تُحل داخل ذلك الحد.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسما واحدا فقط من المستوى الأعلى مدعوما بتضمين ملف واحد تكتب عبر ذلك الملف المضمّن. على سبيل المثال، يحدّث `plugins install` الإعداد `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات مع تجاوزات شقيقة للقراءة فقط في عمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بشكل مغلق بدلا من تسطيح الإعداد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعداد](/ar/gateway/configuration) · [أمثلة الإعداد](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [الإعداد](/ar/gateway/configuration)
- [أمثلة الإعداد](/ar/gateway/configuration-examples)
