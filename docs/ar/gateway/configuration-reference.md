---
read_when:
    - تحتاج إلى دلالات التكوين الدقيقة على مستوى الحقول أو القيم الافتراضية
    - أنت تتحقق من صحة كتل تكوين القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية والروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-05-02T22:19:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2963e01c73d1d3dbd218d76d0c0709f58f8b92e4b3d4606105cedd91571b5ed
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع الإعدادات الأساسية لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة للمهام، راجع [الإعدادات](/ar/gateway/configuration).

يغطي أسطح إعدادات OpenClaw الرئيسية، ويربط إلى مراجع خارجية عندما يكون لنظام فرعي مرجعه الأعمق الخاص. كتالوجات الأوامر المملوكة للقنوات وPlugin، ومفاتيح الذاكرة العميقة/QMD، موجودة في صفحاتها الخاصة بدلًا من هذه الصفحة.

حقيقة الكود:

- يطبع `openclaw config schema` مخطط JSON الحي المستخدم للتحقق وControl UI، مع دمج بيانات التعريف المضمنة/الخاصة بـPlugin/القناة عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بالمسار لأدوات التنقيب التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس مستندات الإعدادات مقابل سطح المخطط الحالي

مسار البحث عن الوكيل: استخدم إجراء أداة `gateway` باسم `config.schema.lookup` للحصول على
توثيق وقيود دقيقة على مستوى الحقول قبل التعديلات. استخدم
[الإعدادات](/ar/gateway/configuration) للإرشادات الموجهة للمهام، وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر المضمنة + المجمعة الحالي
- صفحات القنوات/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

صيغة الإعدادات هي **JSON5** (التعليقات + الفواصل اللاحقة مسموحة). كل الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

نُقلت مفاتيح إعدادات كل قناة إلى صفحة مخصصة — راجع
[الإعدادات — القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والقنوات
المجمعة الأخرى (المصادقة، التحكم في الوصول، الحسابات المتعددة، بوابة الإشارات).

## افتراضيات الوكلاء، الوكلاء المتعددون، الجلسات، والرسائل

نُقلت إلى صفحة مخصصة — راجع
[الإعدادات — الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، صندوق العزل)
- `multiAgent.*` (توجيه الوكلاء المتعددين والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التقليم)
- `messages.*` (تسليم الرسائل، TTS، عرض Markdown)
- `talk.*` (وضع Talk)
  - `talk.speechLocale`: معرّف لغة BCP 47 اختياري للتعرف على كلام Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم ضبطه، يحتفظ Talk بنافذة التوقف المؤقت الافتراضية للمنصة قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)

## الأدوات والمزودون المخصصون

نُقلت سياسة الأدوات، والمفاتيح التجريبية، وإعدادات الأدوات المدعومة بالمزودين، وإعداد
المزود المخصص / عنوان URL الأساسي إلى صفحة مخصصة — راجع
[الإعدادات — الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

تعريفات المزودين، وقوائم السماح للنماذج، وإعداد المزودين المخصصين موجودة في
[الإعدادات — الأدوات والمزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
يمتلك الجذر `models` أيضًا سلوك كتالوج النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك كتالوج المزود (`merge` أو `replace`).
- `models.providers`: خريطة مزودين مخصصة مفهرسة بمعرّف المزود.
- `models.pricing.enabled`: يتحكم في تمهيد التسعير في الخلفية الذي
  يبدأ بعد وصول البرامج الجانبية والقنوات إلى مسار جاهزية Gateway. عندما يكون `false`،
  يتخطى Gateway جلب كتالوجات تسعير OpenRouter وLiteLLM؛ وتظل قيم
  `models.providers.*.models[].cost` المضبوطة تعمل لتقديرات التكلفة المحلية.

## MCP

توجد تعريفات خوادم MCP المُدارة بواسطة OpenClaw تحت `mcp.servers` وتُستهلك
بواسطة Pi المضمن ومحولات وقت التشغيل الأخرى. تدير أوامر `openclaw mcp list`
و`show` و`set` و`unset` هذه الكتلة بدون الاتصال
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
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: تعريفات خوادم MCP مسماة، stdio أو بعيدة، لأزمنة التشغيل التي
  تعرض أدوات MCP المضبوطة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  و`type: "http"` اسم مستعار أصلي لـCLI يقوم `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى حقل `transport` القانوني.
- `mcp.sessionIdleTtlMs`: مدة TTL للخمول لأزمنة تشغيل MCP المجمعة والمحددة بنطاق الجلسة.
  تطلب عمليات التشغيل المضمنة لمرة واحدة تنظيفًا عند نهاية التشغيل؛ مدة TTL هذه هي خط الدعم
  للجلسات طويلة العمر والمتصلين المستقبليين.
- تُطبَّق التغييرات تحت `mcp.*` فورًا عبر التخلص من أزمنة تشغيل MCP المخزنة مؤقتًا للجلسة.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من الإعدادات الجديدة، لذا تُزال إدخالات
  `mcp.servers` المحذوفة فورًا بدلًا من انتظار مدة TTL للخمول.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: قائمة سماح اختيارية للـSkills المجمعة فقط (لا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (الأولوية الأدنى).
- `install.preferBrew`: عندما تكون true، فضّل مثبتات Homebrew عندما يكون `brew`
  متاحًا قبل الرجوع إلى أنواع المثبتات الأخرى.
- `install.nodeManager`: تفضيل مثبت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` يعطل Skill حتى لو كان مجمعًا/مثبتًا.
- `entries.<skillKey>.apiKey`: تسهيل للـSkills التي تعلن متغير بيئة أساسيًا (سلسلة نصية صريحة أو كائن SecretRef).

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

- تُحمَّل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، إضافةً إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins أصلية لـOpenClaw إضافةً إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي بلا manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل gateway.**
- `allow`: قائمة سماح اختيارية (تُحمَّل Plugins المدرجة فقط). يتغلب `deny`.
- `plugins.entries.<id>.apiKey`: حقل تسهيل لمفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة بنطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما يكون `false`، يحظر core `before_prompt_build` ويتجاهل الحقول المعدِّلة للموجه من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق على خطافات Plugin الأصلية وأدلة الخطافات المدعومة التي توفرها الحزم.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما يكون `true`، يمكن لـPlugins غير المجمعة والموثوقة قراءة محتوى المحادثة الخام من الخطافات typed مثل `llm_input` و`llm_output` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: وثّق هذا Plugin صراحةً ليطلب تجاوزات `provider` و`model` لكل تشغيل لعمليات الوكيل الفرعي الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القانونية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات معرّف بواسطة Plugin (يتم التحقق منه بواسطة مخطط Plugin الأصلي لـOpenClaw عند توفره).
- تعيش إعدادات حساب/وقت تشغيل Plugin القناة تحت `channels.<id>` ويجب وصفها بواسطة بيانات تعريف `channelConfigs` في manifest الخاص بـPlugin المالك، وليس بواسطة سجل خيارات مركزي لـOpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزود جلب الويب Firecrawl.
  - `apiKey`: مفتاح API لـFirecrawl (يقبل SecretRef). يرجع إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـAPI الخاص بـFirecrawl (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف التجاوزات ذاتية الاستضافة نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخرج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر ذاكرة التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث Grok على الويب).
  - `enabled`: تمكين مزود X Search.
  - `model`: نموذج Grok لاستخدامه في البحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: إيقاع cron لكل مسح Dreaming كامل (`"0 3 * * *"` افتراضيًا).
  - `model`: تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه بـ`allowedModels` لتقييد الأهداف. أخطاء عدم توفر النموذج تعيد المحاولة مرة واحدة بنموذج الجلسة الافتراضي؛ لا تتراجع إخفاقات الثقة أو قائمة السماح بصمت.
  - سياسة المراحل والعتبات تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- تعيش إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـPlugins حزم Claude الممكّنة أيضًا المساهمة بافتراضات Pi مضمنة من `settings.json`؛ يطبق OpenClaw هذه كإعدادات وكيل منقّحة، وليس كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ تكون القيمة الافتراضية `"legacy"` ما لم تثبت محركًا آخر وتحدده.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يستطيع OpenClaw اكتشاف تسجيلات المتابعة من أدوار المحادثة وتسليمها عبر عمليات Heartbeat.

- `commitments.enabled`: تمكين استخراج LLM المخفي، والتخزين، وتسليم Heartbeat للالتزامات المستنتجة للمتابعة. الافتراضي: `false`.
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
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد وقت الخمول أو عندما تتجاوز
  الجلسة حدها الأقصى. عيّن `idleMinutes: 0` أو `maxTabsPerSession: 0` من أجل
  تعطيل أوضاع التنظيف الفردية هذه.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا عند عدم ضبطه، لذا يبقى تنقل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا بتنقل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه للشبكة الخاصة أثناء فحوصات إمكانية الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصصة للإرفاق فقط (التشغيل/الإيقاف/إعادة الضبط معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك المزوّد بعنوان URL مباشر لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على إمكانية الوصول إلى CDP البعيد و
  `attachOnly` بالإضافة إلى طلبات فتح علامات التبويب. تحتفظ ملفات تعريف loopback المُدارة
  بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مُدارة خارجيًا ويمكن الوصول إليها عبر loopback، فاضبط
  `attachOnly: true` لذلك الملف الشخصي؛ وإلا فسيتعامل OpenClaw مع منفذ loopback كملف
  تعريف متصفح محلي مُدار وقد يبلّغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلًا من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف متصفح محدد
  مبني على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات مدفوعة باللقطات/المراجع بدلًا من استهداف محددات CSS، وخطافات رفع ملف واحد،
  ولا توجد تجاوزات لمهلة مربعات الحوار، ولا `wait --load networkidle`، ولا
  `responsebody`، أو تصدير PDF، أو اعتراض التنزيل، أو إجراءات الدُفعات.
- تعيّن ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائيًا؛ ولا
  تضبط `cdpUrl` صراحةً إلا لـ CDP البعيد.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف الشخصي. استخدم هذا لتشغيل ملف تعريف في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية و`browser.localCdpReadyTimeoutMs` لجاهزية CDP websocket
  بعد التشغيل. ارفعها على المضيفات الأبطأ حيث يبدأ Chrome بنجاح
  لكن فحوصات الجاهزية تتسابق مع بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعدادًا صحيحة موجبة حتى `120000` مللي ثانية؛ وتُرفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنيًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  القيمتين `~` و`~/...` لدليل المنزل في نظام التشغيل قبل تشغيل Chromium.
  كما يتم توسيع علامة التلدة في `userDataDir` لكل ملف تعريف على ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، الافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء Chromium المحلي (على سبيل المثال
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

- `seamColor`: لون تمييز لزخرفة واجهة مستخدم التطبيق الأصلية (صبغة فقاعة وضع التحدث، وما إلى ذلك).
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

<Accordion title="Gateway field details">

- `mode`: ‏`local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway البدء ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الاستخدامات لـ WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto`، أو `loopback` (الافتراضي)، أو `lan` (`0.0.0.0`)، أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط)، أو `custom`.
- **أسماء bind المستعارة القديمة**: استخدم قيم وضع bind في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء المضيف المستعارة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. مع شبكة جسر Docker (`-p 18789:18789`)، تصل حركة المرور على `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو عيّن `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على كل الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات bind غير loopback مصادقة Gateway. عمليًا، يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلًا عكسيًا واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد رمزًا افتراضيًا.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين (بما في ذلك SecretRefs)، فعيّن `gateway.auth.mode` صراحةً إلى `token` أو `password`. تفشل تدفقات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مهيأً والوضع غير معيّن.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات trusted local loopback؛ وهذا لا يُعرض عمدًا في مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي واعٍ بالهوية وثِق بترويسات الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر وكيل **غير loopback** افتراضيًا؛ وتتطلب الوكلاء العكسيون عبر loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`. يمكن للمتصلين الداخليين على المضيف نفسه استخدام `gateway.auth.password` كخيار احتياطي محلي مباشر؛ يظل `gateway.auth.token` حصريًا بالتبادل مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عند `true`، يمكن لترويسات هوية Tailscale Serve استيفاء مصادقة واجهة التحكم/WebSocket (يُتحقق منها عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway بدلًا من ذلك. يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. القيمة الافتراضية هي `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات المصادقة الفاشلة. يُطبق لكل عنوان IP للعميل ولكل نطاق مصادقة (تُتتبع shared-secret وdevice-token بشكل مستقل). تُرجع المحاولات المحظورة `429` + `Retry-After`.
  - في مسار واجهة التحكم غير المتزامن الخاص بـ Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تُفعّل المحدد في الطلب الثاني بدلًا من مرور كليهما كتطابقات فاشلة عادية.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ عيّنها إلى `false` عندما تريد عمدًا تحديد معدل حركة مرور localhost أيضًا (لإعدادات الاختبار أو نشرات الوكيل الصارمة).
- تُخنق محاولات مصادقة WS ذات أصل المتصفح دائمًا مع تعطيل إعفاء loopback (دفاع متعمق ضد التخمين القسري عبر المتصفح على localhost).
- على loopback، تُعزل عمليات القفل ذات أصل المتصفح هذه لكل قيمة `Origin`
  مُطبّعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` (tailnet فقط، bind عبر loopback) أو `funnel` (عام، يتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. مطلوبة عندما يُتوقع وصول عملاء المتصفح من أصول غير loopback.
- `controlUi.chatMessageMaxWidth`: حد أقصى اختياري للعرض لرسائل دردشة واجهة التحكم المجمعة. يقبل قيم عرض CSS مقيدة مثل `960px`، و`82%`، و`min(1280px, 82%)`، و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع إلى أصل ترويسة Host للنشرات التي تعتمد عمدًا على سياسة أصل ترويسة Host.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` هي `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ في بيئة عملية جهة العميل
  يسمح بـ `ws://` النصي العادي إلى عناوين IP موثوقة على الشبكة الخاصة؛ يظل الافتراضي
  مقتصرًا على loopback فقط للنص العادي. لا يوجد مكافئ في `openclaw.json`،
  ولا تؤثر إعدادات الشبكة الخاصة للمتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` في عملاء Gateway
  WebSocket.
- `gateway.remote.token` / `.password` هي حقول بيانات اعتماد للعميل البعيد. لا تهيئ مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان URL الأساسي عبر HTTPS لمرحل APNs الخارجي الذي تستخدمه إصدارات iOS الرسمية/TestFlight بعد نشر تسجيلات مدعومة بالمرحل إلى Gateway. يجب أن يطابق عنوان URL هذا عنوان المرحل المضمّن في بناء iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالميلي ثانية. القيمة الافتراضية هي `10000`.
- تُفوّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويتضمن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال مخصصة لنطاق التسجيل إلى Gateway. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات env مؤقتة لإعداد المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب للتطوير فقط لعناوين URL الخاصة بمرحل HTTP عبر loopback. يجب أن تبقى عناوين URL الخاصة بمرحل الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة Gateway WebSocket قبل المصادقة بالميلي ثانية. الافتراضي: `15000`. تكون لـ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأولوية عند تعيينها. زِد هذه القيمة على المضيفين المحملين أو منخفضي القدرة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال إحماء بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقب سلامة القناة بالدقائق. عيّن `0` لتعطيل إعادة تشغيل مراقب السلامة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: حد المقبس المتقادم بالدقائق. أبقِ هذه القيمة أكبر من أو تساوي `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقب السلامة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات تشغيل مراقب السلامة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند تعيينه، تكون له الأولوية على تجاوز مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما تكون `gateway.auth.*` غير معيّنة.
- إذا كان `gateway.auth.token` / `gateway.auth.password` مهيأً صراحةً عبر SecretRef ولم يُحل، يفشل الحل بإغلاق آمن (من دون إخفاء بخيار احتياطي بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين التي تنهي TLS أو تحقن ترويسات العميل المعاد توجيهها. أدرج فقط الوكلاء الذين تتحكم بهم. تظل إدخالات loopback صالحة لإعدادات الوكيل/الاكتشاف المحلي على المضيف نفسه (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عند `true`، يقبل Gateway‏ `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. القيمة الافتراضية `false` لسلوك الفشل المغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح CIDR/IP اختيارية للموافقة التلقائية على إقران جهاز Node لأول مرة من دون نطاقات مطلوبة. تكون معطلة عندما لا تُعيّن. لا يوافق هذا تلقائيًا على إقران المشغل/المتصفح/واجهة التحكم/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/رفض عام لأوامر Node المعلنة بعد الإقران وتقييم قائمة السماح للمنصة. استخدم `allowCommands` للاشتراك في أوامر Node الخطيرة مثل `camera.snap`، و`camera.clip`، و`screen.record`؛ يزيل `denyCommands` أمرًا حتى لو كان افتراضي منصة أو سماح صريح سيتضمنه بخلاف ذلك. بعد أن يغير Node قائمة الأوامر المعلنة، ارفض إقران ذلك الجهاز وأعد الموافقة عليه كي يخزن Gateway لقطة الأوامر المحدثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (توسّع قائمة الرفض الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة رفض HTTP الافتراضية.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطلة افتراضيًا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة على أنها غير معيّنة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة اختيارية لتقوية الاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (عيّنها فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد بمنافذ وأدلة حالة فريدة:

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
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محليًا ذاتي التوقيع عندما لا تكون الملفات الصريحة مهيأة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ أبقِ صلاحياته مقيدة.
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
  - `"off"`: تجاهل التعديلات الحية؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة التشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخنة أولًا؛ وارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة debounce بالميلي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: حد أقصى اختياري بالميلي ثانية للانتظار حتى تنتهي العمليات الجارية قبل فرض إعادة التشغيل. احذفه لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ عيّنه إلى `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية عن العمليات التي ما زالت معلقة.

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

- يتطلب `hooks.enabled=true` قيمة غير فارغة في `hooks.token`.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ تُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (مثلًا `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` بقالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك الصريح.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في التعيين المعروضة من قالب كقيم موردة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثل `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تُرجع إجراء خطاف.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى داخل `hooks.transformsDir` (تُرفض المسارات المطلقة واجتياز المسارات).
  - أبقِ `hooks.transformsDir` تحت `~/.openclaw/hooks/transforms`؛ تُرفض أدلة Skills في مساحة العمل. إذا أبلغ `openclaw doctor` أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات الخطافات أو أزل `hooks.transformsDir`.
- يوجّه `agentId` إلى وكيل محدد؛ تعود المعرّفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيل وكيل الخطاف دون `sessionKey` صريح.
- `allowRequestSessionKey`: يسمح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` بقالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ يكون `channel` افتراضيًا `last`.
- يتجاوز `model` نموذج LLM لتشغيل الخطاف هذا (يجب أن يكون مسموحًا به إذا كان كتالوج النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المدمج `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لتطابق مساحة أسماء Gmail، مثل `["hook:", "hook:gmail:"]`.
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

- يشغّل Gateway تلقائيًا `gog gmail watch serve` عند الإقلاع عندما يكون مضبوطًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
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

- يقدّم HTML/CSS/JS القابل للتحرير بواسطة الوكيل وA2UI عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- ارتباطات غير loopback: تتطلب مسارات Canvas مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- عادة لا ترسل Node WebViews ترويسات المصادقة؛ بعد إقران Node واتصاله، يعلن Gateway عناوين URL لقدرات محددة النطاق للـ Node للوصول إلى Canvas/A2UI.
- ترتبط عناوين URL للقدرات بجلسة WS النشطة للـ Node وتنتهي سريعًا. لا يُستخدم البديل المعتمد على IP.
- يحقن عميل إعادة التحميل المباشر في HTML المُقدَّم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون فارغًا.
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

- `minimal` (الافتراضي): احذف `cliPath` و`sshPort` من سجلات TXT.
- `full`: أدرج `cliPath` و`sshPort`.
- يكون اسم المضيف افتراضيًا هو اسم مضيف النظام عندما يكون تسمية DNS صالحة، وإلا يعود إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### النطاق الواسع (DNS-SD)

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

- لا تُطبّق متغيرات البيئة المضمنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` (لا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول.
- راجع [البيئة](/ar/help/environment) للأسبقية الكاملة.

### استبدال متغيرات البيئة

أشِر إلى متغيرات البيئة في أي سلسلة ضبط باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تطابق الأسماء الكبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- المتغيرات المفقودة/الفارغة تطرح خطأ عند تحميل الضبط.
- اهرب باستخدام `$${VAR}` للحصول على `${VAR}` حرفيًا.
- يعمل مع `$include`.

---

## الأسرار

مراجع الأسرار إضافية: لا تزال قيم النص الصريح تعمل.

### `SecretRef`

استخدم شكل كائن واحد:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- نمط معرف `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- معرف `source: "file"`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط معرف `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرفات `source: "exec"` على مقاطع مسار محددة بشرطات مائلة هي `.` أو `..` (مثلًا يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القانونية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات اعتماد `openclaw.json` المدعومة.
- تُضمَّن مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### ضبط موفري الأسرار

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

- يدعم موفر `file` الوضعين `mode: "json"` و`mode: "singleValue"` (يجب أن يكون `id` هو `"value"` في وضع singleValue).
- تفشل مسارات موفري file وexec بإغلاق آمن عندما لا يكون التحقق من Windows ACL متاحًا. اضبط `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب موفر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول على stdin/stdout.
- افتراضيًا، تُرفض مسارات أوامر الروابط الرمزية. اضبط `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا كان `trustedDirs` مضبوطًا، فتنطبق عملية فحص الدليل الموثوق على مسار الهدف المحلول.
- بيئة ابن `exec` تكون محدودة افتراضيًا؛ مرّر المتغيرات المطلوبة صراحة باستخدام `passEnv`.
- تُحل مراجع الأسرار عند وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب اللقطة فقط.
- يُطبَّق ترشيح السطح النشط أثناء التفعيل: تفشل المراجع غير المحلولة على الأسطح المفعلة في بدء التشغيل/إعادة التحميل، بينما تُتجاوز الأسطح غير النشطة مع تشخيصات.

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

- تُخزَّن الملفات الشخصية لكل وكيل عند `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست تنسيقًا لوقت التشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات شخصية معيارية لمفاتيح API بصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- لا تدعم الملفات الشخصية في وضع OAuth (`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد auth-profile المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ تُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
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

- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كاف حقيقية (الافتراضي: `5`). يمكن أن يصل نص الفوترة الصريح إلى هنا حتى في استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزوّد تبقى محصورة في المزوّد الذي يملكها (على سبيل المثال OpenRouter `Key limit exceeded`). تبقى رسائل نافذة استخدام HTTP `402` القابلة لإعادة المحاولة أو رسائل حد إنفاق المؤسسة/مساحة العمل في مسار `rate_limit` بدلا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات لنمو تراجع الفوترة الأسي (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لدورات تدوير ملفات تعريف المصادقة لدى المزوّد نفسه لأخطاء التحميل الزائد قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). تُصنّف هنا أشكال انشغال المزوّد مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف مثقل بالتحميل (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لدورات تدوير ملفات تعريف المصادقة لدى المزوّد نفسه لأخطاء حدود المعدل قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). يتضمن هذا التصنيف الخاص بحدود المعدل نصوصا على هيئة المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- `redactSensitive` / `redactPatterns`: إخفاء على أساس أفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونصوص سجلات جلسات العمل المحفوظة. يعطّل `redactSensitive: "off"` سياسة السجلات/النصوص العامة هذه فقط؛ أما أسطح أمان الواجهة/الأدوات/التشخيصات فتظل تحجب الأسرار قبل الإرسال.

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
- `flags`: مصفوفة من سلاسل العلامات لتمكين مخرجات سجل مستهدفة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر عدم التقدم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل كـ `session.long_running` أو `session.stalled` أو `session.stuck`. تعيد أحداث الرد والأداة والحالة والكتلة وتقدم ACP ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت بلا تغيير.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`). للاطلاع على الإعداد الكامل، وفهرس الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL الخاص بالمجمّع لتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بكل إشارة. عند ضبطها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تمكين تصدير التتبعات أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات التتبع `0`–`1`.
- `otel.flushIntervalMs`: الفاصل الدوري لتفريغ القياسات بالمللي ثانية.
- `otel.captureContent`: التقاط محتوى خام اختياري لسمات امتدادات OTEL. يكون معطلا افتراضيا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامية؛ ويتيح لك شكل الكائن تمكين `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحة.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لسمات مزوّد امتدادات GenAI التجريبية الأحدث. افتراضيا، تحتفظ الامتدادات بسمة `gen_ai.system` القديمة للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفين الذين سجّلوا مسبقا OpenTelemetry SDK عاما. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بكل إشارة تُستخدم عندما يكون مفتاح الإعداد المطابق غير مضبوط.
- `cacheTrace.enabled`: تسجيل لقطات تتبع ذاكرة التخزين المؤقت للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لـ JSONL الخاص بتتبع ذاكرة التخزين المؤقت (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم فيما يُضمّن في مخرجات تتبع ذاكرة التخزين المؤقت (كلها افتراضيا: `true`).

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
- `auto.enabled`: تمكين التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable (الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة انتشار إضافية بالساعات لطرح قناة stable (الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: معدل تكرار فحوصات قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ اضبطها على `false` لإخفاء إمكانات إرسال ACP والتفريخ).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسة ACP (الافتراضي: `true`). اضبطها على `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف واجهة تشغيل ACP الافتراضية (يجب أن يطابق Plugin تشغيل ACP مسجلا).
  ثبّت Plugin الواجهة الخلفية أولا، وإذا كان `plugins.allow` مضبوطا، فأدرج معرّف Plugin الواجهة الخلفية (على سبيل المثال `acpx`) وإلا فلن يتم تحميل واجهة ACP الخلفية.
- `defaultAgent`: معرّف وكيل ACP الاحتياطي عندما لا تحدد عمليات التفريخ هدفا صريحا.
- `allowedAgents`: قائمة سماح بمعرفات الوكلاء المسموح لهم بجلسات تشغيل ACP؛ والقيمة الفارغة تعني عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة في الوقت نفسه.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: منع تكرار أسطر الحالة/الأداة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: تبث `"live"` بشكل تدريجي؛ وتؤجل `"final_only"` حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: فاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى لأحرف أسطر حالة/تحديث ACP المعروضة.
- `stream.tagVisibility`: سجل أسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
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

- يتحكم `cli.banner.taglineMode` في نمط العبارة التعريفية للشعار:
  - `"random"` (الافتراضي): عبارات تعريفية مرحة/موسمية متناوبة.
  - `"default"`: عبارة تعريفية حيادية ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: بلا نص عبارة تعريفية (لا يزال عنوان/إصدار الشعار ظاهرا).
- لإخفاء الشعار بالكامل (وليس العبارات التعريفية فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

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

## الجسر (قديم، تمت إزالته)

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل العُقد عبر Gateway WebSocket. لم تعد مفاتيح `bridge.*` جزءا من مخطط الإعدادات (يفشل التحقق حتى إزالتها؛ يمكن لـ `openclaw doctor --fix` حذف المفاتيح غير المعروفة).

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
- `runLog.maxBytes`: الحد الأقصى لحجم كل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر التي تُحتفظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز حامل يُستخدم لتسليم POST الخاص بـ Cron Webhook (`delivery.mode = "webhook"`)، وإذا حُذف فلن تُرسل ترويسة مصادقة.
- `webhook`: عنوان URL احتياطي قديم ومهمل لـ Webhook (http/https) يُستخدم فقط للمهام المخزنة التي لا تزال تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لإعادات المحاولة للمهام ذات التنفيذ الواحد عند حدوث أخطاء عابرة (الافتراضي: `3`؛ النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. احذفها لإعادة المحاولة لكل الأنواع العابرة.

ينطبق فقط على مهام Cron ذات التنفيذ الواحد. تستخدم المهام المتكررة معالجة منفصلة للفشل.

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
- `includeSkipped`: احتساب مرات التشغيل المتخطاة المتتالية ضمن عتبة التنبيه (الافتراضي: `false`). تُتتبّع مرات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
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

- الوجهة الافتراضية لإشعارات فشل Cron عبر كل المهام.
- `mode`: `"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم announce. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان URL للـ Webhook. مطلوب في وضع webhook.
- `accountId`: تجاوز اختياري للحساب المستخدم في التسليم.
- يتجاوز `delivery.failureDestination` الخاص بكل مهمة هذا الإعداد الافتراضي العام.
- عندما لا تكون وجهة الفشل العامة ولا الخاصة بالمهمة مضبوطة، تعود المهام التي تسلّم بالفعل عبر `announce` إلى هدف announce الأساسي ذلك عند الفشل.
- يُدعم `delivery.failureDestination` فقط للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتتبّع تنفيذات Cron المعزولة كـ [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

يتم توسيع العناصر النائبة للقالب في `tools.media.models[].args`:

| المتغير           | الوصف                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (من دون أغلفة السجل/المرسل)             |
| `{{BodyStripped}}` | النص مع إزالة إشارات المجموعة                 |
| `{{From}}`         | معرّف المرسل                                 |
| `{{To}}`           | معرّف الوجهة                            |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID للجلسة الحالية                              |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                 |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                          |
| `{{MediaPath}}`    | مسار الوسائط المحلي                                  |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)               |
| `{{Transcript}}`   | نص تفريغ الصوت                                  |
| `{{Prompt}}`       | موجّه الوسائط المحلول لإدخالات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول لعدد أحرف الإخراج لإدخالات CLI         |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (حسب أفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (حسب أفضل جهد)               |
| `{{SenderName}}`   | اسم عرض المرسل (حسب أفضل جهد)                 |
| `{{SenderE164}}`   | رقم هاتف المرسل (حسب أفضل جهد)                 |
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
- المفاتيح الشقيقة: تُدمج بعد التضمينات (تتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل بالنسبة إلى الملف الذي يحتوي التضمين، لكن يجب أن تبقى داخل دليل الإعدادات ذي المستوى الأعلى (`dirname` الخاص بـ `openclaw.json`). يُسمح بالصيغ المطلقة/`../` فقط عندما تظل تُحل داخل ذلك الحد.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى مدعومًا بتضمين ملف واحد تكتب مباشرةً إلى ذلك الملف المضمّن. على سبيل المثال، يحدّث `plugins install` القيمة `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات التي تحتوي تجاوزات شقيقة تكون للقراءة فقط بالنسبة إلى عمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بإغلاق آمن بدلًا من تسطيح الإعدادات.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [الإعدادات](/ar/gateway/configuration)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
