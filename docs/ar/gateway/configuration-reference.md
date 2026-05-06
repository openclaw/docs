---
read_when:
    - تحتاج إلى دلالات التكوين الدقيقة على مستوى الحقول أو القيم الافتراضية
    - أنت تتحقق من صحة كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية والروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-05-06T07:53:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119194a7e041a7ca35b9dd1575c4f4c4d5c67f412cd3002e65bf5b706b210a90
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع إعدادات النواة لـ `~/.openclaw/openclaw.json`. للاطلاع على نظرة عامة موجهة للمهام، راجع [الإعدادات](/ar/gateway/configuration).

يغطي أسطح إعدادات OpenClaw الرئيسية ويوفر روابط خارجية عندما يملك نظام فرعي مرجعه الأعمق الخاص. تعيش كتالوجات الأوامر المملوكة للقنوات وPlugin ومقابض الذاكرة العميقة/QMD في صفحاتها الخاصة بدلا من هذه الصفحة.

حقيقة الكود:

- يطبع `openclaw config schema` مخطط JSON الحي المستخدم للتحقق وControl UI، مع دمج بيانات التعريف المجمعة/Plugin/القناة عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بالمسار لأدوات التعمق
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس وثائق الإعدادات مقابل سطح المخطط الحالي

مسار البحث عن الوكيل: استخدم إجراء أداة `gateway` وهو `config.schema.lookup` للحصول على
وثائق وقيود دقيقة على مستوى الحقل قبل التعديلات. استخدم
[الإعدادات](/ar/gateway/configuration) للإرشاد الموجه للمهام، وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر Slash](/ar/tools/slash-commands) لكتالوج الأوامر المضمنة + المجمعة الحالي
- صفحات القنوات/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

صيغة الإعدادات هي **JSON5** (تسمح بالتعليقات والفواصل اللاحقة). كل الحقول اختيارية - يستخدم OpenClaw قيما افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح الإعدادات الخاصة بكل قناة إلى صفحة مخصصة - راجع
[الإعدادات - القنوات](/ar/gateway/config-channels) من أجل `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وقنوات
مجمعة أخرى (المصادقة، التحكم في الوصول، الحسابات المتعددة، بوابة الإشارات).

## إعدادات الوكيل الافتراضية، وتعدد الوكلاء، والجلسات، والرسائل

انتقلت إلى صفحة مخصصة - راجع
[الإعدادات - الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، sandbox)
- `multiAgent.*` (توجيه تعدد الوكلاء والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التقليم)
- `messages.*` (تسليم الرسائل، TTS، عرض markdown)
- `talk.*` (وضع Talk)
  - `talk.speechLocale`: معرف لغة BCP 47 اختياري للتعرف على كلام Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم تعيينه، يحافظ Talk على نافذة التوقف الافتراضية للمنصة قبل إرسال النص المفرغ (`700 ms on macOS and Android, 900 ms on iOS`)

## الأدوات والمزودون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وإعدادات الأدوات المدعومة بالمزودين، وإعداد
المزود المخصص / عنوان URL الأساسي إلى صفحة مخصصة - راجع
[الإعدادات - الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

تعيش تعريفات المزودين، وقوائم السماح للنماذج، وإعداد المزود المخصص في
[الإعدادات - الأدوات والمزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
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
- `models.providers`: خريطة المزودين المخصصين المفهرسة بمعرف المزود.
- `models.pricing.enabled`: يتحكم في تمهيد التسعير في الخلفية الذي
  يبدأ بعد وصول العمليات الجانبية والقنوات إلى مسار جاهزية Gateway. عندما يكون `false`،
  يتخطى Gateway عمليات جلب كتالوج التسعير من OpenRouter وLiteLLM؛ وتظل
  قيم `models.providers.*.models[].cost` المهيأة تعمل لتقديرات التكلفة المحلية.

## MCP

تعيش تعريفات خوادم MCP المدارة من OpenClaw ضمن `mcp.servers` وتستهلكها
Pi المضمنة ومهايئات وقت التشغيل الأخرى. تدير أوامر `openclaw mcp list` و
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

- `mcp.servers`: تعريفات خوادم MCP مسماة من نوع stdio أو بعيدة لأوقات التشغيل التي
  تعرض أدوات MCP المهيأة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  ويعد `type: "http"` اسما مستعارا أصليا لـ CLI يقوم `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى الحقل القانوني `transport`.
- `mcp.sessionIdleTtlMs`: مدة TTL للخمول لأوقات تشغيل MCP المجمعة محددة الجلسة.
  تطلب التشغيلات المضمنة لمرة واحدة تنظيف نهاية التشغيل؛ ومدة TTL هذه هي خط الدفاع الخلفي
  للجلسات طويلة العمر والمستدعين المستقبليين.
- تطبق التغييرات ضمن `mcp.*` بشكل ساخن عبر التخلص من أوقات تشغيل MCP المخزنة مؤقتا للجلسة.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من الإعدادات الجديدة، لذلك تزال
  إدخالات `mcp.servers` المحذوفة فورا بدلا من انتظار مدة TTL للخمول.

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

- `allowBundled`: قائمة سماح اختيارية للـ Skills المجمعة فقط (لا تتأثر Skills المدارة/مساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أسبقية).
- `install.preferBrew`: عندما تكون true، فضل مثبتي Homebrew عندما يكون `brew` متاحا
  قبل الرجوع إلى أنواع المثبتات الأخرى.
- `install.nodeManager`: تفضيل مثبت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- يعطل `entries.<skillKey>.enabled: false` Skill حتى لو كانت مجمعة/مثبتة.
- `entries.<skillKey>.apiKey`: وسيلة ملائمة لـ Skills التي تعلن متغير بيئة أساسيا (نص عادي أو كائن SecretRef).

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
- يقبل الاكتشاف Plugins أصلية لـ OpenClaw إضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude بتخطيط افتراضي بلا manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل gateway.**
- `allow`: قائمة سماح اختيارية (لا تحمل إلا Plugins المدرجة). `deny` لها الأولوية.
- القيمة الافتراضية لـ `bundledDiscovery` هي `"allowlist"` للإعدادات الجديدة، لذا فإن
  `plugins.allow` غير الفارغة تضبط أيضا Plugins المزود المجمعة، بما في ذلك مزودو وقت تشغيل
  بحث الويب. يكتب Doctor القيمة `"compat"` لإعدادات قائمة السماح القديمة المهاجرة
  للحفاظ على سلوك مزود الحزمة الحالي إلى أن تختار التفعيل.
- `plugins.entries.<id>.apiKey`: حقل ملائم لمفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة محددة بنطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما يكون `false`، تمنع النواة `before_prompt_build` وتتجاهل الحقول التي تعدل الموجه من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق ذلك على hooks الخاصة بـ Plugin الأصلي ومجلدات hooks المقدمة من الحزم المدعومة.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما يكون `true`، قد تقرأ Plugins الموثوقة غير المجمعة محتوى المحادثة الخام من hooks typed مثل `llm_input` و`llm_output` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: ثق صراحة بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل من أجل تشغيلات الوكيل الفرعي في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القانونية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعدادات يعرفه Plugin (يتم التحقق منه بواسطة مخطط Plugin الأصلي لـ OpenClaw عند توفره).
- تعيش إعدادات حساب/وقت تشغيل Plugin القناة ضمن `channels.<id>` ويجب أن تصفها بيانات `channelConfigs` الوصفية في manifest الخاصة بـ Plugin المالك، لا سجل خيارات مركزي لـ OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزود جلب الويب Firecrawl.
  - `apiKey`: مفتاح API لـ Firecrawl (يقبل SecretRef). يرجع إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API الخاصة بـ Firecrawl (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخرج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: أقصى عمر للتخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث الويب Grok).
  - `enabled`: فعّل مزود X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات memory dreaming. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل مسح dreaming كامل (`"0 3 * * *"` افتراضيا).
  - `model`: تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه بـ `allowedModels` لتقييد الأهداف. تعاد محاولة أخطاء عدم توفر النموذج مرة واحدة بنموذج الجلسة الافتراضي؛ ولا تتراجع إخفاقات الثقة أو قائمة السماح بصمت.
  - سياسة المراحل والعتبات تفاصيل تنفيذية (ليست مفاتيح إعدادات موجهة للمستخدم).
- تعيش إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضا لـ Plugins حزم Claude المفعلة أن تساهم بإعدادات Pi افتراضية مضمنة من `settings.json`؛ يطبق OpenClaw هذه كإعدادات وكيل منقاة، لا كتصحيحات إعدادات OpenClaw خام.
- `plugins.slots.memory`: اختر معرف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرف Plugin محرك السياق النشط؛ القيمة الافتراضية هي `"legacy"` ما لم تثبت وتحدد محركا آخر.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يستطيع OpenClaw اكتشاف عمليات التحقق من أدوار المحادثة وتسليمها عبر تشغيلات Heartbeat.

- `commitments.enabled`: فعّل استخراج LLM المخفي، والتخزين، وتسليم Heartbeat للالتزامات المستنتجة للمتابعة. الافتراضي: `false`.
- `commitments.maxPerDay`: أقصى عدد من التزامات المتابعة المستنتجة التي يتم تسليمها لكل جلسة وكيل في يوم متحرك. الافتراضي: `3`.

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

- يعطّل `evaluateEnabled: false` كلاً من `act:evaluate` و`wait --fn`.
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد وقت الخمول أو عندما تتجاوز
  الجلسة حدها الأقصى. اضبط `idleMinutes: 0` أو `maxTabsPerSession: 0` من أجل
  تعطيل أوضاع التنظيف الفردية تلك.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلاً عند عدم ضبطه، لذلك يبقى تنقل المتصفح صارماً افتراضياً.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمداً بتنقل المتصفح في الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) لنفس حظر الشبكة الخاصة أثناء فحوصات قابلية الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعوماً كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصصة للإرفاق فقط (بدء/إيقاف/إعادة ضبط معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك موفرك بعنوان URL مباشر لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية الوصول إلى CDP البعيد و`attachOnly`
  إضافة إلى طلبات فتح علامات التبويب. تحتفظ ملفات تعريف loopback
  المُدارة بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مُدارة خارجياً ويمكن الوصول إليها عبر loopback، فاضبط
  `attachOnly: true` لذلك الملف التعريفي؛ وإلا فسيتعامل OpenClaw مع منفذ loopback كملف
  تعريف متصفح مُدار محلياً وقد يبلغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلاً من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف متصفح
  محدد مبني على Chromium مثل Brave أو Edge.
- تحافظ ملفات تعريف `existing-session` على حدود مسار Chrome MCP الحالية:
  إجراءات مدفوعة باللقطات/المراجع بدلاً من استهداف محددات CSS، وخطافات رفع ملف واحد،
  ولا توجد تجاوزات لمهلة الحوارات، ولا `wait --load networkidle`، ولا
  `responsebody` أو تصدير PDF أو اعتراض التنزيلات أو إجراءات الدُفعات.
- تُعيّن ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائياً؛ لا
  تضبط `cdpUrl` صراحةً إلا لـ CDP البعيد.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف التعريفي. استخدم هذا لتشغيل ملف تعريف واحد في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف HTTP لـ Chrome CDP
  بعد بدء العملية و`browser.localCdpReadyTimeoutMs` لجاهزية websocket الخاصة بـ CDP
  بعد التشغيل. ارفعها على المضيفين الأبطأ حيث يبدأ Chrome بنجاح
  لكن فحوصات الجاهزية تتسابق مع بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعداداً صحيحة موجبة حتى `120000` مللي ثانية؛ ويتم رفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنياً على Chromium ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  القيمتين `~` و`~/...` لدليل المنزل في نظام التشغيل قبل تشغيل Chromium.
  ويتم أيضاً توسيع التلدة في `userDataDir` لكل ملف تعريف على ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء تشغيل Chromium المحلي (على سبيل المثال
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

- `seamColor`: لون تمييز لواجهة المستخدم الأصلية للتطبيق (صبغة فقاعة وضع التحدث، وما إلى ذلك).
- `assistant`: تجاوز هوية Control UI. يعود احتياطياً إلى هوية الوكيل النشط.

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

- `mode`: ‏`local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway بدء التشغيل ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الإرسال لـ WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto`، أو `loopback` (الافتراضي)، أو `lan` (`0.0.0.0`)، أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط)، أو `custom`.
- **أسماء bind البديلة القديمة**: استخدم قيم وضع bind في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء host البديلة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. مع شبكة Docker bridge ‏(`-p 18789:18789`)، تصل حركة المرور على `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو عيّن `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات bind غير loopback مصادقة Gateway. عمليًا، يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلًا عكسيًا مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد رمزًا افتراضيًا.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين (بما في ذلك SecretRefs)، فعيّن `gateway.auth.mode` صراحةً إلى `token` أو `password`. تفشل مسارات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مهيأين ويكون mode غير معين.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ وهذا غير معروض عمدًا في مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي مدرك للهوية، واثق برؤوس الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع افتراضيًا مصدر وكيل **غير loopback**؛ تتطلب الوكلاء العكسيون على loopback من المضيف نفسه تعيينًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`. يمكن للمتصلين الداخليين من المضيف نفسه استخدام `gateway.auth.password` كبديل مباشر محلي؛ ويظل `gateway.auth.token` متنافيًا مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عند `true`، يمكن لرؤوس هوية Tailscale Serve تلبية مصادقة Control UI/WebSocket (مع التحقق عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة رؤوس Tailscale تلك؛ بل تتبع بدلًا من ذلك وضع مصادقة HTTP العادي في Gateway. يفترض هذا التدفق بلا رموز أن مضيف Gateway موثوق. القيمة الافتراضية هي `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لفشل المصادقة. ينطبق لكل عنوان IP عميل ولكل نطاق مصادقة (تُتتبَّع shared-secret وdevice-token بشكل مستقل). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Control UI غير المتزامن عبر Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تُفعّل المحدد في الطلب الثاني بدلًا من مرور كليهما كعدم تطابق عادي.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ عيّنها إلى `false` عندما تريد عمدًا تطبيق حد المعدل على حركة localhost أيضًا (لإعدادات الاختبار أو عمليات نشر الوكيل الصارمة).
- تُخنق دائمًا محاولات مصادقة WS من أصل المتصفح مع تعطيل إعفاء loopback (كدفاع متعمق ضد التخمين بالقوة الغاشمة عبر المتصفح على localhost).
- على loopback، تُعزل عمليات القفل هذه القادمة من أصل المتصفح لكل قيمة `Origin`
  مطبّعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` (tailnet فقط، bind على loopback) أو `funnel` (عام، يتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. مطلوبة عندما يُتوقع وجود عملاء متصفح من أصول غير loopback.
- `controlUi.chatMessageMaxWidth`: حد أقصى اختياري للعرض لرسائل دردشة Control UI المجمعة. يقبل قيم عرض CSS مقيدة مثل `960px`، و`82%`، و`min(1280px, 82%)`، و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع إلى أصل رأس Host لعمليات النشر التي تعتمد عمدًا على سياسة أصل رأس Host.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` هي `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ على مستوى بيئة عملية العميل
  يسمح بـ `ws://` نصي صريح إلى عناوين IP موثوقة على الشبكة الخاصة؛ يظل الافتراضي مقتصرًا على loopback فقط للنص الصريح. لا يوجد مكافئ في `openclaw.json`،
  كما أن تهيئة الشبكة الخاصة للمتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` لا تؤثر على عملاء Gateway
  WebSocket.
- `gateway.remote.token` / `.password` هي حقول بيانات اعتماد للعميل البعيد. لا تهيئ مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان URL أساسي عبر HTTPS للمرحل الخارجي APNs الذي تستخدمه إصدارات iOS الرسمية/TestFlight بعد أن تنشر التسجيلات المدعومة بالمرحل إلى Gateway. يجب أن يطابق هذا العنوان عنوان URL للمرحل المضمّن في بناء iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالمللي ثانية. القيمة الافتراضية `10000`.
- تُفوَّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر إلى Gateway منحة إرسال ذات نطاق التسجيل. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات env مؤقتة لتهيئة المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: مخرج تطوير فقط لعناوين URL الخاصة بمرحل HTTP على loopback. يجب أن تبقى عناوين URL الخاصة بمرحل الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة Gateway WebSocket قبل المصادقة بالمللي ثانية. الافتراضي: `15000`. تكون الأولوية لـ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` عند تعيينه. زِد هذه القيمة على المضيفين المحمّلين أو منخفضي القدرة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال إحماء بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: الفاصل الزمني لمراقب صحة القناة بالدقائق. عيّن `0` لتعطيل عمليات إعادة تشغيل مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس الراكد بالدقائق. أبقِ هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لعمليات إعادة تشغيل مراقب الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: إلغاء اشتراك لكل قناة في عمليات إعادة تشغيل مراقب الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند تعيينه، تكون له الأولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلي استخدام `gateway.remote.*` كبديل فقط عندما يكون `gateway.auth.*` غير معين.
- إذا تم تهيئة `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وبقي غير محلول، يفشل الحل بشكل مغلق (دون إخفاء عبر بديل بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين الذين ينهون TLS أو يحقنون رؤوس العميل المُمرَّر. أدرج فقط الوكلاء الذين تتحكم بهم. تظل إدخالات loopback صالحة لإعدادات الوكيل/الاكتشاف المحلي على المضيف نفسه (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عند `true`، يقبل Gateway ‏`X-Real-IP` إذا كان `X-Forwarded-For` مفقودًا. الافتراضي `false` لسلوك الفشل المغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح اختيارية بنطاقات CIDR/IP للموافقة التلقائية على إقران أجهزة Node لأول مرة دون نطاقات مطلوبة. تكون معطلة عندما لا تُعين. لا يوافق هذا تلقائيًا على إقران المشغل/المتصفح/Control UI/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/رفض عام لأوامر Node المعلنة بعد الإقران وتقييم قائمة سماح المنصة. استخدم `allowCommands` للاشتراك في أوامر Node الخطيرة مثل `camera.snap`، و`camera.clip`، و`screen.record`؛ ويزيل `denyCommands` أمرًا حتى لو كان الإعداد الافتراضي للمنصة أو السماح الصريح سيشمله بخلاف ذلك. بعد أن يغير Node قائمة أوامره المعلنة، ارفض إقران ذلك الجهاز وأعد الموافقة عليه حتى يخزن Gateway لقطة الأوامر المحدثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (توسّع قائمة الرفض الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة رفض HTTP الافتراضية.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطلة افتراضيًا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تعزيز أمان إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة كأنها غير معينة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- رأس اختياري لتعزيز أمان الاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (عيّنه فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد بمنافذ ومجلدات حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام تسهيلية: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [Gateways المتعددة](/ar/gateway/multiple-gateways).

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

- `enabled`: يفعّل إنهاء TLS عند مستمع Gateway ‏(HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح ذاتي التوقيع محليًا عندما لا تكون الملفات الصريحة مهيأة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ أبقِ أذوناته مقيدة.
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

- `mode`: يتحكم في كيفية تطبيق تعديلات التهيئة في وقت التشغيل.
  - `"off"`: تجاهل التعديلات المباشرة؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير التهيئة.
  - `"hot"`: طبّق التغييرات داخل العملية دون إعادة التشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخن أولًا؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات التهيئة (عدد صحيح غير سالب).
- `deferralTimeoutMs`: أقصى وقت اختياري بالمللي ثانية للانتظار حتى تنتهي العمليات الجارية قبل فرض إعادة التشغيل. احذفه لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ عيّنه إلى `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية لما لا يزال معلقًا.

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
تُرفض رموز الخطافات في سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` قيمة غير فارغة في `hooks.token`.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ تُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (مثلًا `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` ذا قالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` الخاصة بالتعيين والمرسومة عبر القوالب كقيم مقدمة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تُرجع إجراء خطاف.
  - يجب أن يكون `transform.module` مسارًا نسبيًا وأن يبقى ضمن `hooks.transformsDir` (تُرفض المسارات المطلقة والتنقل عبر المسارات).
  - أبقِ `hooks.transformsDir` تحت `~/.openclaw/hooks/transforms`؛ تُرفض أدلة Skills الخاصة بمساحة العمل. إذا أبلغ `openclaw doctor` أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات الخطافات أو أزل `hooks.transformsDir`.
- يوجّه `agentId` إلى وكيل محدد؛ تعود المعرّفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو المحذوف = السماح للكل، `[]` = رفض الكل).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل الخطاف بدون `sessionKey` صريح.
- `allowRequestSessionKey`: يسمح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات الخاصة بقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` ذا قالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ تكون قيمة `channel` الافتراضية هي `last`.
- يتجاوز `model` نموذج اللغة الكبير لتشغيل الخطاف هذا (يجب أن يكون مسموحًا به إذا كان كتالوج النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المدمج `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لمطابقة نطاق أسماء Gmail، مثلًا `["hook:", "hook:gmail:"]`.
- إذا احتجت إلى `hooks.allowRequestSessionKey: false`، فتجاوز الإعداد المسبق باستخدام `sessionKey` ثابت بدلًا من الافتراضي ذي القالب.

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

- يشغّل Gateway تلقائيًا `gog gmail watch serve` عند الإقلاع عندما يكون مكوّنًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
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

- يقدّم HTML/CSS/JS القابلة لتحرير الوكيل وA2UI عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الارتباطات غير loopback: تتطلب مسارات Canvas مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- عادةً لا ترسل WebViews الخاصة بـ Node ترويسات المصادقة؛ بعد إقران node واتصاله، يعلن Gateway عن عناوين URL للقدرات محددة النطاق على node للوصول إلى Canvas/A2UI.
- ترتبط عناوين URL للقدرات بجلسة WS النشطة الخاصة بـ node وتنتهي صلاحيتها سريعًا. لا يُستخدم الرجوع المستند إلى IP.
- يحقن عميل إعادة التحميل المباشر في HTML المقدّم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون فارغًا.
- يقدّم A2UI أيضًا على `/__openclaw__/a2ui/`.
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

- `minimal` (الافتراضي عندما يكون Plugin المدمج `bonjour` مفعّلًا): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` + `sshPort`؛ لا يزال إعلان البث المتعدد على شبكة LAN يتطلب تفعيل Plugin المدمج `bonjour`.
- `off`: يمنع إعلان البث المتعدد على شبكة LAN بدون تغيير تفعيل Plugin.
- يبدأ Plugin المدمج `bonjour` تلقائيًا على مضيفات macOS ويكون اختياريًا على Linux وWindows وعمليات نشر Gateway داخل الحاويات.
- يكون اسم المضيف افتراضيًا هو اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

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

- لا تُطبَّق متغيرات البيئة المضمنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` (لا يطغى أيٌّ منهما على المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول لديك.
- راجع [البيئة](/ar/help/environment) للاطلاع على ترتيب الأولوية الكامل.

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
- استخدم `$${VAR}` للهروب والحصول على `${VAR}` حرفية.
- يعمل مع `$include`.

---

## الأسرار

مراجع الأسرار إضافية: ما زالت القيم النصية الصريحة تعمل.

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
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار مفصولة بشرطة مائلة تساوي `.` أو `..` (مثلًا يتم رفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة المعيارية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُضمَّن مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

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

- يدعم موفر `file` الوضعين `mode: "json"` و`mode: "singleValue"` (يجب أن يكون `id` هو `"value"` في وضع singleValue).
- تفشل مسارات موفري الملفات والتنفيذ بإغلاق آمن عندما يكون التحقق من Windows ACL غير متاح. عيّن `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب موفر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيًا، تُرفَض مسارات أوامر الروابط الرمزية. عيّن `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا تم إعداد `trustedDirs`، ينطبق فحص الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة العملية الفرعية لـ `exec` في حدها الأدنى افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار عند وقت التفعيل إلى لقطة في الذاكرة، ثم تقرأ مسارات الطلب اللقطة فقط.
- يُطبَّق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح الممكّنة إلى فشل بدء التشغيل/إعادة التحميل، بينما يتم تخطي الأسطح غير النشطة مع تشخيصات.

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
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست صيغة وقت تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات شخصية معيارية لمفتاح API بصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- الملفات الشخصية بوضع OAuth (`auth.profiles.<id>.mode = "oauth"`) لا تدعم بيانات اعتماد ملف المصادقة الشخصي المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من اللقطات المحلولة في الذاكرة؛ وتُزال إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
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

- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عندما يفشل ملف تعريف بسبب أخطاء
  الفوترة/عدم كفاية الرصيد الحقيقية (الافتراضي: `5`). يمكن أن يصل نص الفوترة الصريح
  إلى هنا حتى في استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزوّد
  تبقى محصورة في المزوّد الذي يملكها (مثل OpenRouter
  `Key limit exceeded`). تبقى رسائل نافذة استخدام HTTP `402` القابلة لإعادة المحاولة أو
  حد إنفاق المؤسسة/مساحة العمل ضمن مسار `rate_limit`
  بدلاً من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدوير ملفات تعريف المصادقة ضمن المزوّد نفسه لأخطاء التحميل الزائد قبل التحول إلى بديل النموذج (الافتراضي: `1`). تندرج هنا أشكال انشغال المزوّد مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف محمّل زائدًا (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدوير ملفات تعريف المصادقة ضمن المزوّد نفسه لأخطاء حد المعدّل قبل التحول إلى بديل النموذج (الافتراضي: `1`). تتضمن حاوية حد المعدّل هذه نصوصًا بصياغة المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- عيّن `logging.file` لاستخدام مسار ثابت.
- يرتفع `consoleLevel` إلى `debug` عند استخدام `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل النشط بالبايت قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 MB). يحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقمة بجانب الملف النشط.
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم وسجلات الملفات وسجلات OTLP ونصوص محاضر الجلسات المحفوظة. يعطّل `redactSensitive: "off"` سياسة السجل/المحضر العامة هذه فقط؛ ما زالت أسطح أمان الواجهة/الأدوات/التشخيصات تحجب الأسرار قبل الإرسال.

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
- `flags`: مصفوفة من سلاسل العلامات التي تفعّل مخرجات سجل مستهدفة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر عدم التقدم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل كـ `session.long_running` أو `session.stalled` أو `session.stuck`. تعيد الردود والأدوات والحالات والكتل وتقدم ACP ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت بلا تغيير.
- `stuckSessionAbortMs`: عتبة عمر عدم التقدم بالمللي ثانية قبل أن يصبح العمل النشط المتوقف مؤهلًا للتفريغ بالإلغاء من أجل الاسترداد. عند عدم التعيين، يستخدم OpenClaw نافذة التشغيل المضمّن الممتدة الأكثر أمانًا، وهي لا تقل عن 10 دقائق و5 أضعاف `stuckSessionWarnMs`.
- `otel.enabled`: يفعّل خط تصدير OpenTelemetry (الافتراضي: `false`). للاطلاع على التكوين الكامل وكتالوج الإشارات ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع لتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بكل إشارة. عند تعيينها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية HTTP/gRPC إضافية تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبعات أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات التتبع `0`-`1`.
- `otel.flushIntervalMs`: فاصل تفريغ القياسات الدوري بالمللي ثانية.
- `otel.captureContent`: التقاط اختياري للمحتوى الخام لسمات نطاقات OTEL. يكون معطلًا افتراضيًا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامي؛ ويتيح شكل الكائن تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحةً.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لسمات مزوّد نطاق GenAI التجريبية الأحدث. افتراضيًا تحتفظ النطاقات بسمة `gen_ai.system` القديمة للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفين الذين سجّلوا مسبقًا OpenTelemetry SDK عامًا. يتجاوز OpenClaw عندئذٍ بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بالإشارات تُستخدم عندما لا يكون مفتاح التكوين المطابق معينًا.
- `cacheTrace.enabled`: تسجيل لقطات تتبع التخزين المؤقت للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لـ JSONL تتبع التخزين المؤقت (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم فيما يُضمّن في مخرجات تتبع التخزين المؤقت (كلها افتراضيًا: `true`).

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
- `auto.betaCheckIntervalHours`: وتيرة تشغيل فحوصات قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ عيّن `false` لإخفاء إرسال ACP ووسائل الإنشاء).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسات ACP (الافتراضي: `true`). عيّن `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف خلفية تشغيل ACP الافتراضية (يجب أن يطابق Plugin تشغيل ACP مسجلًا).
  ثبّت Plugin الخلفية أولًا، وإذا كان `plugins.allow` معينًا، فأضف معرّف Plugin الخلفية (مثل `acpx`) وإلا فلن تُحمّل خلفية ACP.
- `defaultAgent`: معرّف الوكيل الهدف الاحتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح بمعرّفات الوكلاء المسموح بها لجلسات تشغيل ACP؛ تعني القائمة الفارغة عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم المقطع قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: منع تكرار أسطر الحالة/الأداة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: تبث `"live"` تدريجيًا؛ وتخزن `"final_only"` مؤقتًا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: فاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف في أسطر حالة/تحديث ACP المسقطة.
- `stream.tagVisibility`: سجل بأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
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

- يتحكم `cli.banner.taglineMode` في نمط الشعار النصي للّافتة:
  - `"random"` (الافتراضي): شعارات متناوبة طريفة/موسمية.
  - `"default"`: شعار حيادي ثابت (`All your chats, one OpenClaw.`).
  - `"off"`: بلا نص شعار (يبقى عنوان/إصدار اللافتة ظاهرًا).
- لإخفاء اللافتة بالكامل (وليس الشعارات فقط)، عيّن متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية تكتبها تدفقات الإعداد الموجهة من CLI (`onboard` و`configure` و`doctor`):

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

## الجسر (قديم، تمت إزالته)

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل عُقد Node عبر WebSocket الخاص بـ Gateway. لم تعد مفاتيح `bridge.*` جزءًا من مخطط التكوين (يفشل التحقق إلى أن تُزال؛ يستطيع `openclaw doctor --fix` حذف المفاتيح غير المعروفة).

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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل حذفها من `sessions.json`. يتحكم أيضا في تنظيف نصوص Cron المحذوفة المؤرشفة. الافتراضي: `24h`؛ اضبطه على `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى لحجم كل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل الحذف. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر التي يتم الاحتفاظ بها عند تشغيل حذف سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز الحامل المستخدم لتسليم POST عبر Webhook في Cron (`delivery.mode = "webhook"`)، وإذا تم حذفه فلن يتم إرسال ترويسة مصادقة.
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

- `maxAttempts`: الحد الأقصى لإعادة المحاولة للمهام أحادية التشغيل عند حدوث أخطاء عابرة (الافتراضي: `3`؛ النطاق: `0`-`10`).
- `backoffMs`: مصفوفة بتأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. احذفها لإعادة المحاولة لكل الأنواع العابرة.

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
- `after`: عدد الإخفاقات المتتالية قبل إطلاق تنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للوظيفة نفسها (عدد صحيح غير سالب).
- `includeSkipped`: احتساب عمليات التشغيل المتخطاة المتتالية ضمن عتبة التنبيه (الافتراضي: `false`). يتم تتبع عمليات التشغيل المتخطاة بشكل منفصل ولا تؤثر في التراجع عند أخطاء التنفيذ.
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
- `mode`: `"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلانات. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب لوضع Webhook.
- `accountId`: تجاوز اختياري للحساب من أجل التسليم.
- يتجاوز `delivery.failureDestination` الخاص بكل مهمة هذا الافتراضي العام.
- عند عدم تعيين وجهة فشل عامة أو خاصة بالمهمة، تعود المهام التي تسلّم مسبقا عبر `announce` إلى هدف الإعلان الأساسي ذلك عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا للمهام التي يكون `sessionTarget="isolated"` فيها، ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). يتم تتبع تنفيذات Cron المعزولة بوصفها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

يتم توسيع عناصر القالب النائبة في `tools.media.models[].args`:

| المتغير           | الوصف                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة بالكامل                         |
| `{{RawBody}}`      | النص الخام (بلا مغلفات السجل/المرسل)             |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعة                 |
| `{{From}}`         | معرّف المرسل                                 |
| `{{To}}`           | معرّف الوجهة                            |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID الجلسة الحالية                              |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                 |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                          |
| `{{MediaPath}}`    | مسار الوسائط المحلي                                  |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)               |
| `{{Transcript}}`   | نص تفريغ الصوت                                  |
| `{{Prompt}}`       | موجه الوسائط المحلول لإدخالات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول لمحارف الإخراج لإدخالات CLI         |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)               |
| `{{SenderName}}`   | اسم عرض المرسل (بأفضل جهد)                 |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                 |
| `{{Provider}}`     | تلميح المزوّد (whatsapp، telegram، discord، إلخ) |

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
- المفاتيح الشقيقة: تُدمج بعد التضمينات (تتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى عمق 10 مستويات.
- المسارات: تُحل نسبة إلى الملف الذي يتضمنها، لكن يجب أن تبقى داخل دليل الإعداد ذي المستوى الأعلى (`dirname` من `openclaw.json`). لا يُسمح بالصيغ المطلقة/`../` إلا عندما تظل تُحل داخل ذلك الحد.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسما واحدا فقط من المستوى الأعلى ومدعوما بتضمين ملف واحد تكتب إلى ذلك الملف المضمّن. على سبيل المثال، يحدّث `plugins install` القيمة `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` سليما.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط بالنسبة لعمليات الكتابة المملوكة لـ OpenClaw؛ تفشل هذه الكتابات بشكل مغلق بدلا من تسطيح الإعداد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذات صلة: [الإعداد](/ar/gateway/configuration) · [أمثلة الإعداد](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذات صلة

- [الإعداد](/ar/gateway/configuration)
- [أمثلة الإعداد](/ar/gateway/configuration-examples)
