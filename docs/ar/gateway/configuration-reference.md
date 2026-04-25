---
read_when:
    - أنت بحاجة إلى دلالات الإعدادات الدقيقة على مستوى الحقول أو إلى القيم الافتراضية
    - أنت تتحقق من كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، وروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع الإعدادات
x-i18n:
    generated_at: "2026-04-25T18:19:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b7e904455845a9559a0a8ed67b217597819f4a8abc38e6c8ecb69b6481528e8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

مرجع إعدادات OpenClaw الأساسية لملف `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجّهة حسب المهام، راجع [الإعدادات](/ar/gateway/configuration).

يغطي هذا المرجع أسطح إعداد OpenClaw الرئيسية ويضع روابط خارجية عندما يكون لنظام فرعي مرجع أعمق خاص به. توجد كتالوجات الأوامر المملوكة للقنوات وPlugin والإعدادات العميقة الخاصة بالذاكرة/QMD في صفحاتها الخاصة بدلًا من هذه الصفحة.

مرجع الشيفرة:

- يعرض `openclaw config schema` مخطط JSON Schema الفعلي المستخدم للتحقق وControl UI، مع دمج بيانات التعريف الخاصة بالحزم/Plugin/القنوات عند توفرها
- يعرض `config.schema.lookup` عقدة مخطط واحدة مقيّدة بالمسار لأدوات الاستكشاف التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من قيمة التجزئة الأساسية لوثائق الإعداد مقارنة بسطح المخطط الحالي

المراجع المتخصصة المتعمقة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات Dreaming تحت `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر المضمّن والمجمّع الحالي
- صفحات القنوات/Plugin المالكة لأسطح الأوامر الخاصة بكل قناة

تنسيق الإعداد هو **JSON5** (يُسمح بالتعليقات والفواصل اللاحقة). كل الحقول اختيارية — يستخدم OpenClaw قيمًا افتراضية آمنة عند حذفها.

---

## القنوات

نُقلت مفاتيح الإعداد الخاصة بكل قناة إلى صفحة مخصصة — راجع
[الإعدادات — القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وقنوات
مجمّعة أخرى (المصادقة، والتحكم في الوصول، وتعدد الحسابات، وتقييد الإشارات).

## افتراضيات الوكيل، وتعدد الوكلاء، والجلسات، والرسائل

نُقلت إلى صفحة مخصصة — راجع
[الإعدادات — الوكلاء](/ar/gateway/config-agents) لما يلي:

- `agents.defaults.*` (مساحة العمل، والنموذج، والتفكير، وHeartbeat، والذاكرة، والوسائط، وSkills، وsandbox)
- `multiAgent.*` (توجيه وربط تعدد الوكلاء)
- `session.*` (دورة حياة الجلسة، وCompaction، والتقليم)
- `messages.*` (تسليم الرسائل، وTTS، وتصوير markdown)
- `talk.*` (وضع Talk)
  - `talk.silenceTimeoutMs`: عند عدم ضبطه، يحتفظ Talk بنافذة التوقف المؤقت الافتراضية للمنصة قبل إرسال النص المفرغ (`700 ms` على macOS وAndroid، و`900 ms` على iOS)

## الأدوات والمزوّدون المخصصون

نُقلت سياسة الأدوات، وعمليات التبديل التجريبية، وإعدادات الأدوات المدعومة من المزوّد، وإعدادات
المزوّد المخصص / عنوان URL الأساسي إلى صفحة مخصصة — راجع
[الإعدادات — الأدوات والمزوّدون المخصصون](/ar/gateway/config-tools).

## MCP

توجد تعريفات خوادم MCP المُدارة من OpenClaw تحت `mcp.servers` وتُستخدم
بواسطة Pi المضمّن ومحولات وقت التشغيل الأخرى. تدير أوامر `openclaw mcp list`،
و`show`، و`set`، و`unset` هذه الكتلة من دون الاتصال
بالخادم المستهدف أثناء تعديل الإعداد.

```json5
{
  mcp: {
    // اختياري. الافتراضي: 600000 ms (10 دقائق). اضبط 0 لتعطيل الإزالة عند الخمول.
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
  تعرض أدوات MCP المكوّنة.
- `mcp.sessionIdleTtlMs`: مدة الخمول قبل الانتهاء لبيئات تشغيل MCP المجمّعة المرتبطة بالجلسة.
  تطلب عمليات التشغيل المضمّنة أحادية الاستخدام تنظيفًا عند نهاية التشغيل؛ وهذه المدة هي
  آلية الأمان الاحتياطية للجلسات طويلة العمر والمستدعين المستقبليين.
- تُطبَّق التغييرات تحت `mcp.*` فورًا عبر التخلص من بيئات تشغيل MCP المخزنة مؤقتًا للجلسات.
  ويُعاد إنشاؤها عند الاكتشاف/الاستخدام التالي للأداة من الإعداد الجديد، بحيث تتم إزالة
  إدخالات `mcp.servers` المحذوفة فورًا بدلًا من انتظار مدة الخمول.

راجع [MCP](/ar/cli/mcp#openclaw-as-an-mcp-client-registry) و
[واجهات CLI الخلفية](/ar/gateway/cli-backends#bundle-mcp-overlays) لمعرفة سلوك وقت التشغيل.

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

- `allowBundled`: قائمة سماح اختيارية لـ Skills المجمّعة فقط (لا تتأثر Skills المُدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أولوية).
- `install.preferBrew`: عند ضبطه على true، يُفضَّل استخدام مثبّتات Homebrew عندما يكون `brew`
  متاحًا قبل الرجوع إلى أنواع المثبّتات الأخرى.
- `install.nodeManager`: تفضيل مثبّت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` يعطّل Skill حتى لو كان مجمّعًا/مثبّتًا.
- `entries.<skillKey>.apiKey`: حقل تسهيلي لمفتاح API خاص بـ Skills التي تعلن متغير بيئة أساسيًا (سلسلة نصية عادية أو كائن SecretRef).

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

- تُحمَّل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions` و`plugins.load.paths`.
- يقبل الاكتشاف Plugins الأصلية المتوافقة مع OpenClaw بالإضافة إلى الحزم المتوافقة مع Codex وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات الإعداد إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (يُحمَّل فقط ما هو مدرج فيها). ويتغلب `deny`.
- `plugins.entries.<id>.apiKey`: حقل تسهيلي على مستوى Plugin لمفتاح API (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، تمنع النواة `before_prompt_build` وتتجاهل الحقول المعدِّلة للموجّه من `before_agent_start` القديم، مع الإبقاء على `modelOverride` و`providerOverride` القديمين. ينطبق ذلك على hooks الخاصة بـ Plugin الأصلية وأدلة hooks التي توفرها الحزم المدعومة.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن لـ Plugins الموثوقة غير المجمّعة قراءة محتوى المحادثة الخام من hooks المكتوبة نوعيًا مثل `llm_input` و`llm_output` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: يمنح الثقة صراحةً لهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لعمليات subagent الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` المعيارية لتجاوزات subagent الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن إعداد يعرّفه Plugin (ويُتحقق منه بمخطط Plugin الأصلي في OpenClaw عند توفره).
- توجد إعدادات الحساب/وقت التشغيل الخاصة بـ Plugin الخاصة بالقنوات تحت `channels.<id>` ويجب وصفها بواسطة بيانات `channelConfigs` في manifest الخاص بـ Plugin المالك، لا بواسطة سجل خيارات OpenClaw مركزي.
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزوّد الجلب الشبكي Firecrawl.
  - `apiKey`: مفتاح API الخاص بـ Firecrawl (يقبل SecretRef). يرجع احتياطيًا إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لواجهة Firecrawl API (الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر الذاكرة المؤقتة بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الاستخراج بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث الويب Grok).
  - `enabled`: تمكين مزوّد X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming) لمعرفة المراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: تكرار Cron لكل عملية Dreaming كاملة (`"0 3 * * *"` افتراضيًا).
  - سياسة المراحل والعتبات هي تفاصيل تنفيذ داخلية (وليست مفاتيح إعداد موجّهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضًا لـ Plugins حزم Claude المفعّلة أن تضيف افتراضيات Pi مضمّنة من `settings.json`؛ ويطبق OpenClaw هذه الافتراضيات كإعدادات وكيل منقّاة، لا كتصحيحات خام لإعداد OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ والافتراضي هو `"legacy"` ما لم تثبّت وتحدد محركًا آخر.
- `plugins.installs`: بيانات تعريف تثبيت مُدارة بواسطة CLI ويستخدمها `openclaw plugins update`.
  - تتضمن `source` و`spec` و`sourcePath` و`installPath` و`version` و`resolvedName` و`resolvedVersion` و`resolvedSpec` و`integrity` و`shasum` و`resolvedAt` و`installedAt`.
  - تعامل مع `plugins.installs.*` على أنها حالة مُدارة؛ وفضّل أوامر CLI على التعديلات اليدوية.

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
      // dangerouslyAllowPrivateNetwork: true, // فعّل هذا فقط للوصول الموثوق إلى الشبكات الخاصة
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
- يقوم `tabCleanup` باستعادة علامات التبويب الأساسية الخاصة بالوكيل بعد وقت
  الخمول أو عندما تتجاوز الجلسة الحد الأقصى لها. اضبط `idleMinutes: 0` أو
  `maxTabsPerSession: 0` لتعطيل أوضاع التنظيف الفردية تلك.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا عند عدم ضبطه، لذا
  يظل تنقل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تكون تثق
  عمدًا في تنقل المتصفح داخل الشبكات الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه الخاص بالشبكات الخاصة أثناء فحوصات الوصول/الاكتشاف.
- لا يزال `ssrfPolicy.allowPrivateNetwork` مدعومًا باعتباره اسمًا بديلًا قديمًا.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة هي للاتصال فقط (البدء/الإيقاف/إعادة التعيين معطّلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك مزوّدك بعنوان URL مباشر لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على الوصول إلى CDP البعيد
  وCDP من نوع `attachOnly` بالإضافة إلى طلبات فتح علامات التبويب. أما
  ملفات تعريف loopback المُدارة فتبقي على قيم CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مُدارة خارجيًا قابلة للوصول عبر local loopback، فاضبط
  `attachOnly: true` لذلك الملف التعريفي؛ وإلا فسيعامل OpenClaw منفذ loopback
  على أنه ملف تعريف متصفح محلي مُدار وقد يبلّغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` بروتوكول Chrome MCP بدلًا من CDP ويمكنها
  الاتصال على المضيف المحدد أو عبر Node متصفح متصل.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف محدد
  لمتصفح قائم على Chromium مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات قائمة على اللقطة/المرجع بدلًا من الاستهداف بمحددات CSS، وhooks
  لرفع ملف واحد، ومن دون تجاوزات مهلة مربعات الحوار، ومن دون
  `wait --load networkidle`، ومن دون
  `responsebody` أو تصدير PDF أو اعتراض التنزيل أو الإجراءات الدفعية.
- تقوم ملفات تعريف `openclaw` المحلية المُدارة بتعيين `cdpPort` و`cdpUrl` تلقائيًا؛ لا
  تضبط `cdpUrl` صراحةً إلا لـ CDP البعيد.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف التعريفي. استخدم هذا لتشغيل ملف تعريف
  واحد في Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP عبر HTTP
  بعد بدء العملية و`browser.localCdpReadyTimeoutMs` لجهوزية CDP websocket
  بعد الإطلاق. ارفع هذه القيم على الأجهزة الأبطأ حيث يبدأ Chrome بنجاح
  لكن فحوصات الجهوزية تتسابق مع بدء التشغيل.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائمًا على Chromium ← Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يقبل `browser.executablePath` الرمز `~` لدليل المنزل في نظام التشغيل لديك.
- خدمة التحكم: local loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` علامات تشغيل إضافية إلى بدء Chromium المحلي (على سبيل المثال
  `--disable-gpu` أو تحديد حجم النافذة أو علامات التصحيح).

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

- `seamColor`: لون التمييز لهيكل واجهة التطبيق الأصلية (مثل تلوين فقاعة وضع Talk).
- `assistant`: تجاوز هوية Control UI. ويعود افتراضيًا إلى هوية الوكيل النشط.

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

<Accordion title="تفاصيل حقول Gateway">

- `mode`: ‏`local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway البدء ما لم يكن `local`.
- `port`: منفذ واحد متعدد الإرسال لـ WS + HTTP. ترتيب الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` (الافتراضي) أو `lan` (`0.0.0.0`) أو `tailnet` (عنوان IP خاص بـ Tailscale فقط) أو `custom`.
- **أسماء bind البديلة القديمة**: استخدم قيم وضع bind في `gateway.bind` (`auto` و`loopback` و`lan` و`tailnet` و`custom`)، وليس الأسماء البديلة للمضيف (`0.0.0.0` و`127.0.0.1` و`localhost` و`::` و`::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. ومع شبكات Docker bridge (`-p 18789:18789`) تصل الحركة على `eth0`، لذلك يصبح Gateway غير قابل للوصول. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على كل الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات bind غير loopback مصادقة Gateway. وعمليًا يعني هذا رمزًا مميزًا/كلمة مرور مشتركة أو reverse proxy مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد الأولي رمزًا مميزًا افتراضيًا.
- إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. تفشل عمليات البدء والتثبيت/الإصلاح الخاصة بالخدمة عندما يكون كلاهما مكوّنًا ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط مع إعدادات local loopback موثوقة؛ وهذا غير معروض عمدًا في مطالبات الإعداد الأولي.
- `gateway.auth.mode: "trusted-proxy"`: فوّض المصادقة إلى reverse proxy مدرك للهوية واثقًا بعناوين الهوية من `gateway.trustedProxies` (راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع **مصدر proxy غير loopback**؛ ولا تفي reverse proxies ذات loopback على نفس المضيف بمتطلبات مصادقة trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لعناوين هوية Tailscale Serve تلبية مصادقة Control UI/WebSocket (بعد التحقق عبر `tailscale whois`). أما نقاط نهاية HTTP API فلا تستخدم مصادقة ترويسات Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway بدلًا من ذلك. يفترض هذا التدفق من دون رمز مميز أن مضيف Gateway موثوق. والقيمة الافتراضية هي `true` عندما يكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: مقيِّد اختياري لمحاولات المصادقة الفاشلة. يُطبّق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع السر المشترك ورمز الجهاز كلٌّ على حدة). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Control UI غير المتزامن عبر Tailscale Serve، تُسلسَل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك قد تؤدي المحاولات السيئة المتزامنة من العميل نفسه إلى تشغيل المقيِّد في الطلب الثاني بدلًا من مرور الطلبين كحالتَي عدم تطابق عاديتين.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها إلى `false` عندما تريد عمدًا أن تخضع حركة localhost لتقييد المعدل أيضًا (لإعدادات الاختبار أو نشر proxy صارم).
- تخضع محاولات مصادقة WS ذات منشأ المتصفح دائمًا للتقييد مع تعطيل إعفاء loopback (دفاعًا إضافيًا ضد محاولات القوة الغاشمة من المتصفح على localhost).
- على loopback، تُعزَل حالات القفل تلك ذات منشأ المتصفح لكل قيمة `Origin`
  مُطبَّعة، بحيث لا تؤدي الإخفاقات المتكررة من منشأ localhost واحد تلقائيًا
  إلى قفل منشأ مختلف.
- `tailscale.mode`: ‏`serve` (Tailnet فقط، مع bind على loopback) أو `funnel` (عام، ويتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لمنشأات المتصفح لاتصالات Gateway WebSocket. مطلوبة عندما يُتوقع وجود عملاء متصفح من منشأات غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطِر يفعّل الرجوع إلى منشأ Host header لعمليات النشر التي تعتمد عمدًا على سياسة منشأ Host header.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` بصيغة `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طارئ من متغيرات بيئة العملية
  على جانب العميل يسمح باستخدام `ws://` النصي الصريح مع عناوين IP موثوقة ضمن الشبكة الخاصة؛
  ويظل الافتراضي مقتصرًا على loopback فقط لاتصالات النص الصريح. لا يوجد مكافئ له في
  `openclaw.json`، كما أن إعدادات الشبكة الخاصة في المتصفح مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` لا تؤثر في
  عملاء Gateway WebSocket.
- `gateway.remote.token` / `.password` هما حقلا بيانات اعتماد للعميل البعيد. وهما لا يكوّنان مصادقة Gateway بحد ذاتهما.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي لمرحل APNs الخارجي المستخدم بواسطة إصدارات iOS الرسمية/TestFlight بعد أن تنشر تسجيلات مدعومة بالمرحل إلى Gateway. يجب أن يطابق عنوان URL هذا عنوان المرحل المضمَّن في إصدار iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالمللي ثانية. القيمة الافتراضية: `10000`.
- تُفوَّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يستدعي تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال مقيّدة بالتسجيل إلى Gateway. ولا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزَّن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات مؤقتة عبر البيئة لإعداد المرحل المذكور أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب للتطوير فقط لعناوين URL الخاصة بمرحل HTTP على loopback. يجب أن تظل عناوين URL الخاصة بمرحل الإنتاج على HTTPS.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القنوات بالدقائق. اضبط `0` لتعطيل إعادة التشغيل عبر مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس القديم بالدقائق. احرص على أن تكون هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات التشغيل عبر مراقب الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: إلغاء اشتراك على مستوى القناة لإعادات تشغيل مراقب الصحة مع الإبقاء على المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز على مستوى الحساب للقنوات متعددة الحسابات. وعند ضبطه، تكون له الأسبقية على تجاوز مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما يكون `gateway.auth.*` غير مضبوط.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وتعذر حلهما، يفشل الحل بطريقة مغلقة (من دون إخفاء عبر fallback بعيد).
- `trustedProxies`: عناوين IP الخاصة بـ reverse proxy التي تنهي TLS أو تضيف ترويسات العميل المُمرَّر. أدرج فقط proxies التي تتحكم بها. ولا تزال إدخالات loopback صالحة لإعدادات proxy على نفس المضيف/اكتشاف محلي (مثل Tailscale Serve أو reverse proxy محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل Gateway قيمة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. الافتراضي `false` لسلوك فشل مغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح CIDR/IP اختيارية للموافقة التلقائية على اقتران أجهزة Node لأول مرة من دون نطاقات مطلوبة. تكون معطلة عند عدم ضبطها. ولا يوافق هذا تلقائيًا على اقتران operator/browser/Control UI/WebChat، كما لا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل عام لقوائم السماح/المنع للأوامر المعلنة الخاصة بـ Node بعد الاقتران وتقييم قائمة السماح.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لطلب HTTP `POST /tools/invoke` (توسّع قائمة المنع الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة المنع الافتراضية الخاصة بـ HTTP.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Chat Completions: معطلة افتراضيًا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- واجهة Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامَل قوائم السماح الفارغة على أنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة اختيارية لتقوية الاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لمنشأات HTTPS التي تتحكم بها؛ راجع [مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### العزل بين المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد بمنافذ وأدلة حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

الرايات الملائمة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

راجع [Gateways متعددة](/ar/gateway/multiple-gateways).

### ‏`gateway.tls`

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
- `autoGenerate`: يُنشئ تلقائيًا زوج cert/key محليًا موقّعًا ذاتيًا عندما لا تكون الملفات الصريحة مكوّنة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات لملف شهادة TLS.
- `keyPath`: مسار نظام الملفات لملف المفتاح الخاص بـ TLS؛ أبقه مقيد الأذونات.
- `caPath`: مسار اختياري لحزمة CA للتحقق من العميل أو سلاسل الثقة المخصصة.

### ‏`gateway.reload`

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

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعداد في وقت التشغيل.
  - `"off"`: تجاهل التعديلات المباشرة؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير الإعداد.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل السريع أولًا؛ وارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات الإعداد (عدد صحيح غير سالب).
- `deferralTimeoutMs`: أقصى وقت اختياري بالمللي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل. احذفه أو اضبطه على `0` للانتظار إلى أجل غير مسمى مع تسجيل تحذيرات دورية بوجود عمليات ما تزال معلّقة.

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

المصادقة: ‏`Authorization: Bearer <token>` أو `x-openclaw-token: <token>`.
تُرفض رموز hook المميزة الموجودة في سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` قيمة `hooks.token` غير فارغة.
- يجب أن يكون `hooks.token` **مختلفًا** عن `gateway.auth.token`؛ ويُرفض إعادة استخدام رمز Gateway المميز.
- لا يمكن أن تكون `hooks.path` مساوية لـ `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كانت `hooks.allowRequestSessionKey=true`، فقَيِّد `hooks.allowedSessionKeyPrefixes` (على سبيل المثال `["hook:"]`).
- إذا كان mapping أو preset يستخدم `sessionKey` مبنيًا على قالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. أما مفاتيح mapping الثابتة فلا تتطلب هذا التفعيل.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا تُقبل `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → تُحل عبر `hooks.mappings`
  - تُعامَل قيم `sessionKey` الناتجة عن القوالب في mapping على أنها مورَّدة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل mapping">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` ← `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى ضمن `hooks.transformsDir` (تُرفض المسارات المطلقة وعمليات الانتقال بين الأدلة).
- يوجّه `agentId` إلى وكيل محدد؛ وتعود المعرّفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو عند الحذف = السماح للجميع، `[]` = منع الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook التي لا تحتوي على `sessionKey` صريحة.
- `allowRequestSessionKey`: السماح لمستدعي `/hooks/agent` ومفاتيح الجلسة في mapping المعتمدة على القوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية بالبادئات لقيم `sessionKey` الصريحة (الطلب + mapping)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي mapping أو preset قيمة `sessionKey` مبنية على قالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ ويكون `channel` افتراضيًا `last`.
- يقوم `model` بتجاوز LLM لهذا التشغيل الخاص بـ hook (ويجب أن يكون مسموحًا به إذا كان كتالوج النموذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم preset المضمّن لـ Gmail القيمة `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` بحيث تطابق نطاق Gmail، مثل `["hook:", "hook:gmail:"]`.
- إذا كنت بحاجة إلى `hooks.allowRequestSessionKey: false`، فتجاوز preset باستخدام `sessionKey` ثابتة بدلًا من القيمة الافتراضية المبنية على قالب.

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

- يبدأ Gateway تلقائيًا `gog gmail watch serve` عند الإقلاع عندما يكون مضبوطًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلًا إلى جانب Gateway.

---

## مستضيف Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- يقدّم ملفات HTML/CSS/JS وA2UI القابلة للتعديل بواسطة الوكيل عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- في حالات bind غير loopback: تتطلب مسارات canvas مصادقة Gateway (token/password/trusted-proxy)، مثل أسطح HTTP الأخرى الخاصة بـ Gateway.
- لا ترسل Node WebViews عادةً ترويسات المصادقة؛ وبعد اقتران Node واتصاله، يعلن Gateway عن عناوين URL لقدرات ضمن نطاق Node للوصول إلى canvas/A2UI.
- ترتبط عناوين URL الخاصة بالقدرات بجلسة WS النشطة الخاصة بـ Node وتنتهي سريعًا. ولا يُستخدم fallback قائم على IP.
- يحقن عميل live reload في HTML المقدَّم.
- يُنشئ تلقائيًا `index.html` ابتدائيًا عندما يكون المجلد فارغًا.
- يقدّم أيضًا A2UI عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
- عطّل live reload للأدلة الكبيرة أو عند أخطاء `EMFILE`.

---

## الاكتشاف

### mDNS ‏(Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (الافتراضي): يحذف `cliPath` و`sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` و`sshPort`.
- يكون اسم المضيف افتراضيًا `openclaw`. ويمكن تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### النطاق الواسع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية الإرسال تحت `~/.openclaw/dns/`. ولاكتشاف عبر الشبكات، قم بالإقران مع خادم DNS (يُوصى بـ CoreDNS) + DNS مقسّم عبر Tailscale.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### ‏`env` (متغيرات البيئة المضمنة)

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
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` (ولا يقوم أي منهما بتجاوز المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف shell لتسجيل الدخول.
- راجع [البيئة](/ar/help/environment) لمعرفة ترتيب الأولوية الكامل.

### استبدال متغيرات البيئة

يمكنك الإشارة إلى متغيرات البيئة في أي سلسلة إعداد باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- تُطابق الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى طرح خطأ عند تحميل الإعداد.
- استخدم `$${VAR}` للهروب إلى `${VAR}` الحرفية.
- يعمل مع `$include`.

---

## الأسرار

مراجع الأسرار إضافية: لا تزال القيم النصية الصريحة تعمل.

### ‏`SecretRef`

استخدم شكل كائن واحد:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `id` لـ `source: "env"`: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `id` لـ `source: "file"`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط `id` لـ `source: "exec"`: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار `.` أو `..` مفصولة بشرطة مائلة (على سبيل المثال، يتم رفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة المعيارية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
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

- يدعم المزوّد `file` كلًا من `mode: "json"` و`mode: "singleValue"` (يجب أن تكون `id` مساوية لـ `"value"` في وضع singleValue).
- تفشل مسارات مزوّدَي file وexec بطريقة مغلقة عندما لا يكون التحقق من Windows ACL متاحًا. اضبط `allowInsecurePath: true` فقط للمسارات الموثوقة التي يتعذر التحقق منها.
- يتطلب المزوّد `exec` مسار `command` مطلقًا ويستخدم حمولات بروتوكول عبر stdin/stdout.
- تُرفض مسارات الأوامر الرمزية افتراضيًا. اضبط `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا كان `trustedDirs` مضبوطًا، فينطبق فحص الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة العملية الابنة لـ `exec` محدودة افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار عند وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب من اللقطة فقط.
- يُطبَّق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح المفعّلة إلى فشل البدء/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع تشخيصات.

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
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأنماط بيانات الاعتماد الثابتة.
- لا تدعم الملفات التعريفية في وضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملفات تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات الاعتماد الثابتة في وقت التشغيل من لقطات محلولة داخل الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- عمليات استيراد OAuth القديمة تأتي من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك وقت تشغيل الأسرار وأدوات `audit/configure/apply`: ‏[إدارة الأسرار](/ar/gateway/secrets).

### ‏`auth.cooldowns`

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

- `billingBackoffHours`: التراجع الأساسي بالساعات عندما يفشل ملف تعريفي بسبب
  أخطاء فوترة حقيقية/عدم كفاية الرصيد (الافتراضي: `5`). يمكن أن ينتهي
  نص الفوترة الصريح هنا حتى في استجابات `401`/`403`، لكن أدوات
  مطابقة النص الخاصة بالمزوّد تبقى مقيّدة بالمزوّد الذي يملكها (مثل OpenRouter
  `Key limit exceeded`). أما رسائل HTTP `402` القابلة لإعادة المحاولة الخاصة
  بنافذة الاستخدام أو حدود إنفاق المؤسسة/مساحة العمل فتبقى ضمن مسار `rate_limit`
  بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: التراجع الأساسي بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدوير ملفات تعريف المصادقة ضمن المزوّد نفسه لأخطاء الحمل الزائد قبل الانتقال إلى التنفيذ الاحتياطي للنموذج (الافتراضي: `1`). تندرج أشكال انشغال المزوّد مثل `ModelNotReadyException` هنا.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف محمّل بشكل زائد (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدوير ملفات تعريف المصادقة ضمن المزوّد نفسه لأخطاء حدود المعدّل قبل الانتقال إلى التنفيذ الاحتياطي للنموذج (الافتراضي: `1`). تتضمن سلة حدود المعدّل هذه نصوصًا ذات شكل خاص بالمزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- اضبط `logging.file` للحصول على مسار ثابت.
- يرتفع `consoleLevel` إلى `debug` عند استخدام `--verbose`.
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل كبت عمليات الكتابة (عدد صحيح موجب؛ الافتراضي: `524288000` = 500 MB). استخدم تدوير السجلات الخارجي لعمليات النشر الإنتاجية.

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

- `enabled`: مفتاح التبديل الرئيسي لمخرجات أدوات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات التي تفعّل مخرجات سجل موجهة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: حدّ العمر بالمللي ثانية لإصدار تحذيرات الجلسات العالقة بينما تظل الجلسة في حالة معالجة.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`).
- `otel.endpoint`: عنوان URL للمجمّع الخاص بتصدير OTel.
- `otel.protocol`: ‏`"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسَل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبعات أو المقاييس أو السجلات.
- `otel.sampleRate`: معدل أخذ عينات التتبع من `0` إلى `1`.
- `otel.flushIntervalMs`: الفاصل الدوري بالمللي ثانية لتفريغ بيانات القياس عن بعد.
- `otel.captureContent`: تفعيل اختياري لالتقاط المحتوى الخام في سمات span الخاصة بـ OTEL. يكون معطّلًا افتراضيًا. تؤدي القيمة المنطقية `true` إلى التقاط محتوى الرسائل/الأدوات غير النظامية؛ ويتيح شكل الكائن تمكين `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` صراحةً.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح تبديل بيئة للمضيفين الذين سجّلوا بالفعل SDK عامة لـ OpenTelemetry. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوكة لـ Plugin مع الإبقاء على مستمعي التشخيصات نشطين.
- `cacheTrace.enabled`: تسجيل لقطات تتبع الذاكرة المؤقتة لعمليات التشغيل المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لـ JSONL الخاص بتتبع الذاكرة المؤقتة (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم في ما يُدرج ضمن مخرجات تتبع الذاكرة المؤقتة (جميعها افتراضيًا: `true`).

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

- `channel`: قناة الإصدار الخاصة بتثبيتات npm/git — ‏`"stable"` أو `"beta"` أو `"dev"`.
- `checkOnStart`: التحقق من تحديثات npm عند بدء Gateway (الافتراضي: `true`).
- `auto.enabled`: تفعيل التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable (الافتراضي: `6`؛ الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية بالساعات لطرح قناة stable (الافتراضي: `12`؛ الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد مرات تشغيل فحوصات قناة beta بالساعات (الافتراضي: `1`؛ الحد الأقصى: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
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

- `enabled`: بوابة الميزة العامة لـ ACP (الافتراضي: `false`).
- `dispatch.enabled`: بوابة مستقلة لإرسال أدوار جلسة ACP (الافتراضي: `true`). اضبطها على `false` للإبقاء على أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضية لوقت تشغيل ACP (يجب أن يطابق Plugin وقت تشغيل ACP مسجلة).
- `defaultAgent`: معرّف الوكيل المستهدف الاحتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ وتعني القائمة الفارغة عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة بالتوازي.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: يمنع تكرار أسطر الحالة/الأداة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: ‏`"live"` يبث تدريجيًا؛ و`"final_only"` يخزن مؤقتًا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأداة المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف لأسطر حالة/تحديث ACP المعروضة.
- `stream.tagVisibility`: سجل من أسماء العلامات إلى تجاوزات الرؤية المنطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة الخمول بالدقائق لعُمّال جلسات ACP قبل أن يصبح تنظيفهم ممكنًا.
- `runtime.installCommand`: أمر تثبيت اختياري للتشغيل عند تهيئة بيئة وقت تشغيل ACP.

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

- يتحكم `cli.banner.taglineMode` في نمط الشعار الفرعي في اللافتة:
  - `"random"` (الافتراضي): شعارات فرعية متناوبة ومضحكة/موسمية.
  - `"default"`: شعار فرعي محايد ثابت (`All your chats, one OpenClaw.`).
  - `"off"`: بدون نص شعار فرعي (يبقى عنوان اللافتة/الإصدار ظاهرًا).
- لإخفاء اللافتة كاملةً (وليس فقط الشعارات الفرعية)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية تكتبها تدفقات الإعداد الموجّهة في CLI ‏(`onboard` و`configure` و`doctor`):

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

لم تعد الإصدارات الحالية تتضمن TCP bridge. تتصل Nodes عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءًا من مخطط الإعداد (وسيفشل التحقق إلى أن تُزال؛ ويمكن للأمر `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

<Accordion title="إعداد bridge القديم (مرجع تاريخي)">

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
    webhook: "https://example.invalid/legacy", // مسار احتياطي قديم ومهجور للوظائف المخزنة notify:true
    webhookToken: "replace-with-dedicated-token", // رمز حامل اختياري لمصادقة Webhook الصادرة
    sessionRetention: "24h", // سلسلة مدة أو false
    runLog: {
      maxBytes: "2mb", // الافتراضي 2_000_000 بايت
      keepLines: 2000, // الافتراضي 2000
    },
  },
}
```

- `sessionRetention`: المدة التي تُحفظ خلالها جلسات تشغيل Cron المعزولة المكتملة قبل تقليمها من `sessions.json`. كما تتحكم أيضًا في تنظيف نصوص Cron المؤرشفة والمحذوفة. الافتراضي: `24h`؛ اضبطها على `false` للتعطيل.
- `runLog.maxBytes`: الحد الأقصى للحجم لكل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليم. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر التي تُحتفظ بها عند تشغيل تقليم سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: رمز حامل يُستخدم لتسليم `POST` الخاص بـ Cron Webhook ‏(`delivery.mode = "webhook"`)، وإذا حُذف فلن يُرسَل أي ترويسة مصادقة.
- `webhook`: عنوان URL قديم ومهجور احتياطي لـ Webhook ‏(http/https) يُستخدم فقط للوظائف المخزنة التي لا تزال تحتوي على `notify: true`.

### ‏`cron.retry`

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

- `maxAttempts`: الحد الأقصى لإعادات المحاولة للوظائف أحادية التشغيل عند الأخطاء المؤقتة (الافتراضي: `3`؛ النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — ‏`"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفه لإعادة المحاولة على كل الأنواع المؤقتة.

ينطبق هذا فقط على وظائف Cron أحادية التشغيل. أما الوظائف المتكررة فلها معالجة فشل منفصلة.

### ‏`cron.failureAlert`

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

- `enabled`: تفعيل تنبيهات الفشل لوظائف Cron (الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة لنفس الوظيفة (عدد صحيح غير سالب).
- `mode`: وضع التسليم — ‏`"announce"` يرسل عبر رسالة قناة؛ و`"webhook"` ينشر إلى Webhook المكوّنة.
- `accountId`: معرّف حساب أو قناة اختياري لتقييد تسليم التنبيه.

### ‏`cron.failureDestination`

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

- الوجهة الافتراضية لإشعارات فشل Cron عبر كل الوظائف.
- `mode`: ‏`"announce"` أو `"webhook"`؛ وتكون افتراضيًا `"announce"` عندما تتوفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم announce. تعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان URL لـ Webhook. مطلوب لوضع webhook.
- `accountId`: تجاوز اختياري للحساب من أجل التسليم.
- يتجاوز `delivery.failureDestination` لكل وظيفة هذا الافتراضي العام.
- عندما لا تُضبط وجهة فشل عامة ولا خاصة بكل وظيفة، فإن الوظائف التي تسلّم أصلًا عبر `announce` ترجع احتياطيًا إلى هدف announce الأساسي عند الفشل.
- لا يُدعَم `delivery.failureDestination` إلا للوظائف ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للوظيفة هو `"webhook"`.

راجع [وظائف Cron](/ar/automation/cron-jobs). ويتم تتبع عمليات Cron المعزولة باعتبارها [مهام في الخلفية](/ar/automation/tasks).

---

## متغيرات قوالب نموذج الوسائط

عناصر نائبة للقوالب تُوسَّع في `tools.media.models[].args`:

| المتغير | الوصف |
| ------------------ | ------------------------------------------------- |
| `{{Body}}` | نص الرسالة الواردة بالكامل |
| `{{RawBody}}` | النص الخام (من دون أغلفة السجل/المرسل) |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعات |
| `{{From}}` | معرّف المرسل |
| `{{To}}` | معرّف الوجهة |
| `{{MessageSid}}` | معرّف رسالة القناة |
| `{{SessionId}}` | UUID الجلسة الحالية |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة |
| `{{MediaUrl}}` | عنوان URL زائف للوسائط الواردة |
| `{{MediaPath}}` | مسار الوسائط المحلي |
| `{{MediaType}}` | نوع الوسائط (صورة/صوت/مستند/…) |
| `{{Transcript}}` | النص المفرغ للصوت |
| `{{Prompt}}` | موجه الوسائط المحلول لإدخالات CLI |
| `{{MaxChars}}` | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI |
| `{{ChatType}}` | `"direct"` أو `"group"` |
| `{{GroupSubject}}` | موضوع المجموعة (أفضل جهد) |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (أفضل جهد) |
| `{{SenderName}}` | الاسم المعروض للمرسل (أفضل جهد) |
| `{{SenderE164}}` | رقم هاتف المرسل (أفضل جهد) |
| `{{Provider}}` | تلميح المزوّد (whatsapp أو telegram أو discord، إلخ) |

---

## تضمينات الإعداد (`$include`)

قسّم الإعداد إلى عدة ملفات:

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
- مصفوفة ملفات: تُدمج بعمق حسب الترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (وتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبةً إلى الملف المتضمّن، لكن يجب أن تبقى داخل دليل الإعداد الأعلى مستوى (`dirname` الخاص بـ `openclaw.json`). يُسمح بالأشكال المطلقة/`../` فقط عندما تظل تُحل داخل ذلك الحد.
- تكتب عمليات OpenClaw المملوكة التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى والمدعوم بتضمين ملف واحد مباشرةً إلى ذلك الملف المضمّن. على سبيل المثال، يقوم `plugins install` بتحديث `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- تكون تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات تجاوزات المفاتيح الشقيقة للقراءة فقط بالنسبة إلى عمليات OpenClaw المملوكة؛ إذ تفشل هذه العمليات بطريقة مغلقة بدلًا من تسطيح الإعداد.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [الإعدادات](/ar/gateway/configuration)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
