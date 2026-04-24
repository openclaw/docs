---
read_when:
    - تحتاج إلى دلالات أو إعدادات افتراضية دقيقة على مستوى الحقول
    - أنت تتحقق من كتل تهيئة القناة أو النموذج أو Gateway أو الأداة
summary: مرجع تهيئة Gateway لمفاتيح OpenClaw الأساسية، والإعدادات الافتراضية، وروابط مراجع الأنظمة الفرعية المخصصة
title: مرجع التهيئة
x-i18n:
    generated_at: "2026-04-24T07:40:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc0d9feea2f2707f267d50ec83aa664ef503db8f9132762345cc80305f8bef73
    source_path: gateway/configuration-reference.md
    workflow: 15
---

مرجع التهيئة الأساسي لـ `~/.openclaw/openclaw.json`. وللحصول على نظرة عامة موجهة للمهام، راجع [التهيئة](/ar/gateway/configuration).

تغطي هذه الصفحة أسطح التهيئة الرئيسية في OpenClaw وتضع روابط خارجية عندما يكون لدى نظام فرعي ما مرجع أعمق خاص به. وهي **لا** تحاول إدراج كل كتالوج أوامر تملكه قناة/Plugin أو كل إعداد عميق للذاكرة/QMD في صفحة واحدة.

الحقيقة البرمجية:

- يطبع `openclaw config schema` مخطط JSON Schema الحي المستخدم للتحقق وواجهة Control UI، مع دمج بيانات التعريف الخاصة بالقنوات/Plugins المضمّنة عند توفرها
- يعيد `config.schema.lookup` عقدة schema محصورة بمسار واحد لأدوات التعمق
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من قيمة hash الأساسية لوثائق التهيئة مقابل سطح schema الحالي

المراجع العميقة المخصصة:

- [مرجع تهيئة الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وتهيئة Dreaming تحت `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر الحالي المضمّن + المرفق
- صفحات القنوات/Plugins المالكة لأسطح الأوامر الخاصة بالقنوات

صيغة التهيئة هي **JSON5** ‏(التعليقات والفواصل اللاحقة مسموح بها). جميع الحقول اختيارية — إذ يستخدم OpenClaw إعدادات افتراضية آمنة عند حذفها.

---

## القنوات

نُقلت مفاتيح التهيئة الخاصة بكل قناة إلى صفحة مخصصة — راجع
[التهيئة — القنوات](/ar/gateway/config-channels) من أجل `channels.*`,
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وغيرها من
القنوات المضمّنة (المصادقة، والتحكم في الوصول، وتعدد الحسابات، وتقييد الإشارات).

## الإعدادات الافتراضية للوكلاء، ومتعدد الوكلاء، والجلسات، والرسائل

نُقلت إلى صفحة مخصصة — راجع
[التهيئة — الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` ‏(workspace، والنموذج، والتفكير، وHeartbeat، والذاكرة، والوسائط، وSkills، وsandbox)
- `multiAgent.*` ‏(توجيه متعدد الوكلاء والروابط)
- `session.*` ‏(دورة حياة الجلسة، وCompaction، والتقليم)
- `messages.*` ‏(تسليم الرسائل، وTTS، وعرض Markdown)
- `talk.*` ‏(وضع Talk)
  - `talk.silenceTimeoutMs`: عند عدم ضبطه، يُبقي Talk نافذة التوقف الافتراضية للمنصة قبل إرسال النص المنسوخ (`700 ms على macOS وAndroid، و900 ms على iOS`)

## الأدوات والمزوّدون المخصصون

نُقلت سياسة الأدوات، والمفاتيح التجريبية، وتهيئة الأدوات المدعومة بالمزوّد، وإعداد
المزوّد/عنوان URL الأساسي المخصص إلى صفحة مخصصة — راجع
[التهيئة — الأدوات والمزوّدون المخصصون](/ar/gateway/config-tools).

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو سلسلة plaintext
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: قائمة سماح اختيارية لـ Skills المضمّنة فقط (لا تتأثر Skills المُدارة/الخاصة بـ workspace).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أولوية).
- `install.preferBrew`: عندما تكون true، فَضّل مثبّتات Homebrew عندما يكون `brew`
  متاحًا قبل الرجوع إلى أنواع مثبّتات أخرى.
- `install.nodeManager`: تفضيل مثبّت Node لمواصفات `metadata.openclaw.install`
  ‏(`npm` | `pnpm` | `yarn` | `bun`).
- يقوم `entries.<skillKey>.enabled: false` بتعطيل Skill حتى لو كانت مضمّنة/مثبّتة.
- `entries.<skillKey>.apiKey`: حقل راحة لمهارات تعلن متغير env أساسيًا (سلسلة plaintext أو كائن SecretRef).

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

- تُحمّل من `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions` بالإضافة إلى `plugins.load.paths`.
- يقبل الاكتشاف Plugins OpenClaw الأصلية بالإضافة إلى حِزم Codex المتوافقة وحِزم Claude، بما في ذلك حِزم Claude ذات التخطيط الافتراضي من دون manifest.
- **تتطلب تغييرات التهيئة إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (لا تُحمَّل إلا Plugins المدرجة). وتكون `deny` هي الغالبة.
- `plugins.entries.<id>.apiKey`: حقل راحة لمفتاح API على مستوى Plugin ‏(عند دعمه من Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يمنع core استخدام `before_prompt_build` ويتجاهل الحقول المعدّلة لـ prompt من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. وينطبق ذلك على hooks الخاصة بـ Plugin الأصلية وعلى دلائل hooks التي توفرها الحِزم المدعومة.
- `plugins.entries.<id>.subagent.allowModelOverride`: امنح الثقة صراحةً لهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لعمليات الوكيل الفرعي في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لهدف `provider/model` القانوني لتجاوزات الوكيل الفرعي الموثوق بها. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.config`: كائن تهيئة يحدده Plugin ‏(يُتحقق منه عبر schema الخاصة بـ Plugin الأصلية في OpenClaw عند توفرها).
- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزوّد web-fetch الخاص بـ Firecrawl.
  - `apiKey`: مفتاح API الخاص بـ Firecrawl ‏(يقبل SecretRef). ويعود احتياطيًا إلى `plugins.entries.firecrawl.config.webSearch.apiKey`، أو `tools.web.fetch.firecrawl.apiKey` القديم، أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لواجهة API الخاصة بـ Firecrawl ‏(الافتراضي: `https://api.firecrawl.dev`).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر cache بالميلي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب scrape بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search ‏(بحث Grok على الويب).
  - `enabled`: تفعيل مزوّد X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming) لمراحل وآليات العتبة.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل عملية Dreaming كاملة (`"0 3 * * *"` افتراضيًا).
  - تُعد سياسة المراحل والعتبات تفاصيل تنفيذية (وليست مفاتيح تهيئة موجهة للمستخدم).
- توجد تهيئة الذاكرة الكاملة في [مرجع تهيئة الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن أيضًا لـ Plugins حِزم Claude المفعّلة أن تسهم بقيم Pi مضمّنة افتراضية من `settings.json`; ويطبق OpenClaw هذه كإعدادات وكيل منقّحة، وليس كتصحيحات خام لتهيئة OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ والقيمة الافتراضية `"legacy"` ما لم تثبّت محركًا آخر وتختاره.
- `plugins.installs`: بيانات تعريف التثبيت المُدارة عبر CLI والمستخدمة من `openclaw plugins update`.
  - تتضمن `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - تعامل مع `plugins.installs.*` على أنها حالة مُدارة؛ وفضّل أوامر CLI على التعديلات اليدوية.

راجع [Plugins](/ar/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // اشترك فقط للوصول الموثوق إلى الشبكة الخاصة
      // allowPrivateNetwork: true, // اسم مستعار قديم
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا عند عدم ضبطه، لذلك يبقى التنقل في browser صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا في التنقل داخل الشبكة الخاصة عبر browser.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) لنفس حظر الشبكة الخاصة أثناء فحوصات reachability/discovery.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- تكون ملفات التعريف البعيدة في وضع attach-only ‏(البدء/الإيقاف/إعادة التعيين معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`; واستخدم WS(S)
  عندما يمنحك مزوّدك عنوان DevTools WebSocket مباشرًا.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلًا من CDP ويمكنها الاتصال
  على المضيف المحدد أو عبر browser Node متصل.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف
  ملف تعريف Chromium-based browser محدد مثل Brave أو Edge.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات تعتمد على snapshot/ref بدلًا من استهداف CSS-selector، وhooks لرفع ملف واحد،
  وعدم وجود تجاوزات لمهلة dialog، وعدم وجود `wait --load networkidle`، ولا
  `responsebody` أو تصدير PDF أو اعتراض التنزيل أو إجراءات الدفعية.
- تعيّن ملفات تعريف `openclaw` المحلية المُدارة تلقائيًا كلًا من `cdpPort` و`cdpUrl`; ولا
  تضبط `cdpUrl` صراحةً إلا من أجل CDP البعيد.
- ترتيب الاكتشاف التلقائي: browser الافتراضي إذا كان قائمًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- خدمة Control: loopback فقط (المنفذ مشتق من `gateway.port`، والافتراضي `18791`).
- يضيف `extraArgs` علامات تشغيل إضافية إلى بدء تشغيل Chromium المحلي (مثل
  `--disable-gpu` أو ضبط حجم النافذة أو علامات التصحيح).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji أو نص قصير أو image URL أو data URI
    },
  },
}
```

- `seamColor`: لون التمييز لواجهة التطبيق الأصلية (لون فقاعة Talk Mode، إلخ).
- `assistant`: تجاوز هوية واجهة Control UI. ويعود إلى هوية الوكيل النشط.

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
      // trustedProxy: { userHeader: "x-forwarded-user" }, // للوضع trusted-proxy؛ راجع /gateway/trusted-proxy-auth
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
      // allowedOrigins: ["https://control.example.com"], // مطلوب لواجهة Control UI غير المستندة إلى loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // وضع احتياطي خطير لأصل Host-header
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
    tools: {
      // حالات رفض HTTP إضافية لـ /tools/invoke
      deny: ["browser"],
      // إزالة أدوات من قائمة الرفض الافتراضية لـ HTTP
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

- `mode`: ‏`local` ‏(تشغيل Gateway) أو `remote` ‏(الاتصال بـ Gateway بعيدة). وترفض Gateway البدء ما لم تكن القيمة `local`.
- `port`: منفذ متعدد الاستخدامات واحد لكل من WS + HTTP. الأسبقية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto` أو `loopback` ‏(الافتراضي) أو `lan` ‏(`0.0.0.0`) أو `tailnet` ‏(عنوان Tailscale IP فقط) أو `custom`.
- **أسماء bind المستعارة القديمة**: استخدم قيم وضع bind في `gateway.bind` ‏(`auto`, `loopback`, `lan`, `tailnet`, `custom`)، وليس الأسماء المستعارة للمضيف (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. ومع شبكات Docker bridge ‏(`-p 18789:18789`)، تصل الحركة على `eth0`، وبالتالي تصبح Gateway غير قابلة للوصول. استخدم `--network host`، أو اضبط `bind: "lan"` ‏(أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. وتتطلب bindات غير loopback مصادقة Gateway. وهذا يعني عمليًا استخدام token/password مشترك أو reverse proxy مدرك للهوية مع `gateway.auth.mode: "trusted-proxy"`. ويولّد معالج الإعداد الأولي token افتراضيًا.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً على `token` أو `password`. وتفشل عمليات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون الاثنان مهيأين والوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ وهذا غير معروض عمدًا في مطالبات الإعداد الأولي.
- `gateway.auth.mode: "trusted-proxy"`: فوّض المصادقة إلى reverse proxy مدرك للهوية واثق بترويسات الهوية القادمة من `gateway.trustedProxies` ‏(راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth)). ويتوقع هذا الوضع مصدر proxy **غير loopback**؛ ولا تستوفي reverse proxies المحلية على المضيف نفسه مصادقة trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve أن تفي بمصادقة Control UI/WebSocket ‏(يُتحقق منها عبر `tailscale whois`). أما نقاط نهاية HTTP API فلا تستخدم مصادقة ترويسة Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway بدلًا من ذلك. ويفترض هذا التدفق الخالي من token أن مضيف Gateway موثوق. والقيمة الافتراضية `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدِّد اختياري لمحاولات المصادقة الفاشلة. يُطبَّق لكل IP عميل ولكل نطاق مصادقة (يُتتبّع السر المشترك وdevice-token بشكل مستقل). وتعطي المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Control UI غير المتزامن الخاص بـ Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. ولذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تُفعّل المحدِّد في الطلب الثاني بدلًا من مرور كليهما كعدم تطابق عادي.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`; واضبطها على `false` عندما تريد عمدًا فرض تحديد المعدل على حركة localhost أيضًا (لإعدادات الاختبار أو نشرات proxy الصارمة).
- تُحدَّد دائمًا محاولات مصادقة WS ذات أصل browser مع تعطيل إعفاء loopback (كدفاع إضافي ضد هجمات القوة الغاشمة على localhost المعتمدة على browser).
- على loopback، تكون عمليات القفل هذه ذات أصل browser معزولة لكل قيمة `Origin`
  مُطبَّعة، بحيث لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` ‏(tailnet فقط، مع loopback bind) أو `funnel` ‏(عام، ويتطلب مصادقة).
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول browser لاتصالات Gateway WebSocket. وهي مطلوبة عندما يُتوقع وجود عملاء browser من أصول غير loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل الرجوع الاحتياطي لأصل Host-header للنشرات التي تعتمد عمدًا على سياسة الأصل الخاصة بـ Host-header.
- `remote.transport`: ‏`ssh` ‏(الافتراضي) أو `direct` ‏(ws/wss). بالنسبة إلى `direct`، يجب أن يكون `remote.url` من نوع `ws://` أو `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: تجاوز طوارئ على مستوى
  بيئة عملية العميل يسمح باستخدام `ws://` غير المشفر إلى
  عناوين IP موثوقة ضمن الشبكة الخاصة؛ ويظل الافتراضي مقصورًا على loopback فقط للاتصالات غير المشفرة. ولا يوجد له مكافئ في `openclaw.json`,
  كما أن تهيئة الشبكة الخاصة الخاصة بـ browser مثل
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` لا تؤثر في عملاء
  Gateway WebSocket.
- يُعد `gateway.remote.token` / `.password` حقول بيانات اعتماد للعميل البعيد. وهي لا تهيئ مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي لـ APNs relay الخارجي المستخدم بواسطة إصدارات iOS الرسمية/TestFlight بعد أن تنشر registrations مدعومة بالـ relay إلى Gateway. ويجب أن يطابق هذا العنوان عنوان relay المضمّن في إصدار iOS.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من gateway إلى relay بالميلي ثانية. والافتراضي `10000`.
- تُفوَّض registrations المدعومة بـ relay إلى هوية Gateway محددة. ويجلب تطبيق iOS المقترن `gateway.identity.get`, ويضمّن تلك الهوية في relay registration، ويمرر إذن إرسال مخصصًا لنطاق registration إلى Gateway. ولا تستطيع Gateway أخرى إعادة استخدام ذلك registration المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات env مؤقتة لتهيئة relay أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب للتطوير فقط لعناوين relay المحلية loopback باستخدام HTTP. ويجب أن تبقى عناوين relay الخاصة بالإنتاج على HTTPS.
- `gateway.channelHealthCheckMinutes`: فترة مراقبة سلامة القناة بالدقائق. اضبطها على `0` لتعطيل عمليات إعادة التشغيل الخاصة بمراقبة السلامة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة socket الراكد بالدقائق. ويجب أن تبقى هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لعمليات إعادة التشغيل بواسطة مراقبة السلامة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل على مستوى القناة لعمليات إعادة تشغيل مراقبة السلامة مع إبقاء المراقبة العالمية مفعّلة.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز على مستوى الحساب للقنوات متعددة الحسابات. وعند ضبطه، تكون له الأسبقية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كرجوع احتياطي فقط عندما لا تكون `gateway.auth.*` مضبوطة.
- إذا كان `gateway.auth.token` / `gateway.auth.password` مهيأً صراحةً عبر SecretRef وتعذر حله، فإن الحل يفشل بشكل مغلق (من دون إخفاء عبر رجوع احتياطي بعيد).
- `trustedProxies`: عناوين IP الخاصة بـ reverse proxies التي تنهي TLS أو تحقن ترويسات forwarded-client. أدرج فقط proxies التي تتحكم بها. ولا تزال إدخالات loopback صالحة لإعدادات الاكتشاف المحلي/الوكيل على المضيف نفسه (مثل Tailscale Serve أو reverse proxy محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، تقبل Gateway الترويسة `X-Real-IP` إذا كانت `X-Forwarded-For` مفقودة. والافتراضي `false` لسلوك fail-closed.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` ‏(توسّع قائمة الرفض الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة الرفض الافتراضية لـ HTTP.

</Accordion>

### نقاط نهاية متوافقة مع OpenAI

- Chat Completions: معطّلة افتراضيًا. فعّلها عبر `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة على أنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة تقوية اختيارية للاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` ‏(اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### العزل متعدد النسخ

شغّل عدة Gateways على مضيف واحد بمنافذ فريدة ودلائل حالة مختلفة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

علامات تسهيلية: `--dev` ‏(تستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` ‏(تستخدم `~/.openclaw-<name>`).

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
- `autoGenerate`: يولّد تلقائيًا زوج cert/key محليًا موقّعًا ذاتيًا عندما لا تكون ملفات صريحة مهيأة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص بـ TLS؛ وحافظ على تقييد أذوناته.
- `caPath`: مسار اختياري إلى حزمة CA للتحقق من العميل أو سلاسل الثقة المخصصة.

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

- `mode`: يتحكم في كيفية تطبيق تعديلات التهيئة أثناء وقت التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ وتتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير التهيئة.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة تشغيل.
  - `"hybrid"` ‏(الافتراضي): جرّب إعادة التحميل الحي أولًا؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة debounce بالميلي ثانية قبل تطبيق تغييرات التهيئة (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى للوقت بالميلي ثانية لانتظار العمليات الجارية قبل فرض إعادة التشغيل (الافتراضي: `300000` = 5 دقائق).

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

- يتطلب `hooks.enabled=true` قيمة `hooks.token` غير فارغة.
- يجب أن تكون `hooks.token` **مختلفة** عن `gateway.auth.token`; ويُرفض إعادة استخدام رمز Gateway.
- لا يمكن أن تكون `hooks.path` مساوية لـ `/`; استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كانت `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` ‏(مثلًا `["hook:"]`).
- إذا كانت mapping أو preset تستخدم `sessionKey` قائمًا على قالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. ولا تتطلب مفاتيح mapping الثابتة هذا الاشتراك.

**نقاط النهاية:**

- `POST /hooks/wake` → ‏`{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → ‏`{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا تُقبل `sessionKey` من حمولة الطلب إلا عندما تكون `hooks.allowRequestSessionKey=true` ‏(الافتراضي: `false`).
- `POST /hooks/<name>` → يتم حلها عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` الخاصة بـ mapping المولدة بالقوالب على أنها مورّدة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل mapping">

- يطابق `match.path` المسار الفرعي بعد `/hooks` ‏(مثلًا `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء hook.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى ضمن `hooks.transformsDir` ‏(تُرفض المسارات المطلقة والتنقلات traversal).
- يوجه `agentId` إلى وكيل محدد؛ وتعود المعرفات غير المعروفة إلى الافتراضي.
- `allowedAgentIds`: يقيّد التوجيه الصريح (`*` أو الحذف = السماح للجميع، `[]` = منع الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل hook من دون `sessionKey` صريحة.
- `allowRequestSessionKey`: السماح لمستدعي `/hooks/agent` ولمفاتيح جلسات mapping المعتمدة على القوالب بضبط `sessionKey` ‏(الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية ببادئات لقيم `sessionKey` الصريحة (الطلب + mapping)، مثل `["hook:"]`. وتصبح مطلوبة عندما تستخدم أي mapping أو preset قيمة `sessionKey` قائمة على قالب.
- يؤدي `deliver: true` إلى إرسال الرد النهائي إلى قناة؛ وتكون `channel` افتراضيًا `last`.
- يتجاوز `model` قيمة LLM لهذا التشغيل الخاص بـ hook ‏(ويجب أن يكون مسموحًا به إذا كان كتالوج النماذج مضبوطًا).

</Accordion>

### تكامل Gmail

- يستخدم Gmail preset المضمّن القيمة `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` ليتطابق مع مساحة اسم Gmail، مثل `["hook:", "hook:gmail:"]`.
- إذا كنت تحتاج إلى `hooks.allowRequestSessionKey: false`، فتجاوز preset باستخدام `sessionKey` ثابتة بدلًا من القيمة الافتراضية القائمة على القالب.

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

- تبدأ Gateway تلقائيًا `gog gmail watch serve` عند الإقلاع عندما تكون مهيأة. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلًا إلى جانب Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // أو OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- يقدّم HTML/CSS/JS وA2UI القابلة للتحرير بواسطة الوكيل عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` ‏(الافتراضي).
- في bindات غير loopback: تتطلب مسارات canvas مصادقة Gateway ‏(token/password/trusted-proxy)، مثل أسطح HTTP الأخرى الخاصة بـ Gateway.
- لا ترسل Node WebViews عادةً ترويسات المصادقة؛ وبعد اقتران node واتصاله، تعلن Gateway عن capability URLs خاصة بالنطاق الخاص بالعقدة للوصول إلى canvas/A2UI.
- ترتبط Capability URLs بجلسة WS النشطة الخاصة بالعقدة وتنتهي صلاحيتها سريعًا. ولا يُستخدم الرجوع الاحتياطي المعتمد على IP.
- يحقن عميل live-reload في HTML المقدَّم.
- ينشئ تلقائيًا ملف `index.html` أوليًا عند الفراغ.
- يقدّم أيضًا A2UI على `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
- عطّل live reload للدلائل الكبيرة أو عند ظهور أخطاء `EMFILE`.

---

## Discovery

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

- `minimal` ‏(الافتراضي): يحذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: يتضمن `cliPath` + `sshPort`.
- يكون اسم المضيف افتراضيًا `openclaw`. ويمكن تجاوزه عبر `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area ‏(DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية الإرسال تحت `~/.openclaw/dns/`. وللاكتشاف عبر الشبكات، اربطها بخادم DNS ‏(يوصى بـ CoreDNS) + Tailscale split DNS.

الإعداد: `openclaw dns setup --apply`.

---

## Environment

### `env` ‏(متغيرات env المضمنة)

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

- لا تُطبَّق متغيرات env المضمنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` ‏(ولا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف profile الخاص بـ login shell لديك.
- راجع [Environment](/ar/help/environment) لمعرفة الأسبقية الكاملة.

### استبدال متغيرات env

أشر إلى متغيرات env في أي سلسلة تهيئة باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- لا تُطابق إلا الأسماء المكتوبة بأحرف كبيرة: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند تحميل التهيئة.
- استخدم `$${VAR}` للحصول على `${VAR}` حرفية.
- يعمل ذلك مع `$include`.

---

## Secrets

مراجع SecretRef إضافية: لا تزال قيم plaintext تعمل.

### `SecretRef`

استخدم شكل كائن واحد:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

التحقق:

- نمط `provider`: ‏`^[a-z][a-z0-9_-]{0,63}$`
- نمط `source: "env"` لـ id: ‏`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط `source: "exec"` لـ id: ‏`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار `.` أو `..` مفصولة بشرطة مائلة (مثل `a/../b` مرفوض)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القانونية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُدرج مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### تهيئة مزوّدي الأسرار

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

- يدعم مزوّد `file` الوضعين `mode: "json"` و`mode: "singleValue"` ‏(ويجب أن تكون `id` مساوية لـ `"value"` في وضع singleValue).
- تفشل مسارات مزوّدات file وexec بشكل مغلق عندما لا يتوفر التحقق من Windows ACL. اضبط `allowInsecurePath: true` فقط للمسارات الموثوقة التي يتعذر التحقق منها.
- يتطلب مزوّد `exec` مسار `command` مطلقًا ويستخدم حمولات بروتوكول على stdin/stdout.
- تُرفض مسارات الأوامر المرتبطة بروابط رمزية افتراضيًا. اضبط `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من المسار الهدف المحلول.
- إذا جرى ضبط `trustedDirs`، فإن فحص trusted-dir يُطبّق على المسار الهدف المحلول.
- تكون بيئة التنفيذ الفرعي لـ `exec` ضئيلة افتراضيًا؛ ومرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع SecretRef في وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب تلك اللقطة فقط.
- يُطبَّق ترشيح الأسطح النشطة أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح المفعلة إلى فشل بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع تشخيصات.

---

## تخزين auth

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

- تُخزَّن ملفات التعريف لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`, و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- لا تدعم ملفات تعريف وضع OAuth ‏(`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد auth-profile المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- تأتي واردات OAuth القديمة من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك وقت تشغيل Secrets وأدوات `audit/configure/apply`: ‏[إدارة Secrets](/ar/gateway/secrets).

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

- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). ولا يزال من الممكن أن تقع نصوص الفوترة الصريحة هنا حتى عند استجابات `401`/`403`، لكن مطابِقات النص الخاصة بالمزوّد تبقى محصورة بالمزوّد الذي يملكها (مثل OpenRouter ‏`Key limit exceeded`). أما رسائل `402` الخاصة بنافذة الاستخدام القابلة لإعادة المحاولة أو حدود إنفاق المؤسسة/مساحة العمل فتبقى ضمن مسار `rate_limit` بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات للنمو الأسي لتراجع الفوترة (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لعمليات تدوير auth-profile ضمن المزود نفسه لأخطاء التحميل الزائد قبل التبديل إلى الرجوع الاحتياطي للنموذج (الافتراضي: `1`). وتقع أشكال انشغال المزوّد مثل `ModelNotReadyException` هنا.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف محمّل فوق طاقته (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لعمليات تدوير auth-profile ضمن المزود نفسه لأخطاء rate-limit قبل التبديل إلى الرجوع الاحتياطي للنموذج (الافتراضي: `1`). ويتضمن دلو rate-limit هذا نصوصًا مشكَّلة بحسب المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

---

## Logging

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
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل بالبايت قبل كبت الكتابات (عدد صحيح موجب؛ الافتراضي: `524288000` = 500 MB). استخدم تدوير سجلات خارجيًا في بيئات الإنتاج.

---

## Diagnostics

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

- `enabled`: مفتاح رئيسي لمخرجات instrumentation ‏(الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات لتمكين مخرجات سجل مستهدفة (تدعم الرموز الشاملة مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر بالميلي ثانية لإصدار تحذيرات الجلسات العالقة بينما تظل الجلسة في حالة معالجة.
- `otel.enabled`: يفعّل خط تصدير OpenTelemetry ‏(الافتراضي: `false`).
- `otel.endpoint`: عنوان URL الخاص بالمجمّع لتصدير OTel.
- `otel.protocol`: ‏`"http/protobuf"` ‏(الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تمكين تصدير trace أو metrics أو logs.
- `otel.sampleRate`: معدل أخذ العينات للـ trace بين `0` و`1`.
- `otel.flushIntervalMs`: فترة flush دورية للقياس عن بُعد بالميلي ثانية.
- `cacheTrace.enabled`: تسجيل لقطات تتبع cache للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لـ cache trace JSONL ‏(الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم فيما يتم تضمينه في مخرجات cache trace ‏(وجميعها افتراضيًا: `true`).

---

## Update

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
- `auto.enabled`: تفعيل التحديث التلقائي في الخلفية لتثبيتات الحزم (الافتراضي: `false`).
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل التطبيق التلقائي لقناة stable ‏(الافتراضي: `6`; الحد الأقصى: `168`).
- `auto.stableJitterHours`: نافذة توزيع إضافية لقناة stable بالساعات (الافتراضي: `12`; الحد الأقصى: `168`).
- `auto.betaCheckIntervalHours`: عدد مرات تشغيل فحوصات قناة beta بالساعات (الافتراضي: `1`; الحد الأقصى: `24`).

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

- `enabled`: مفتاح ميزة ACP العالمي (الافتراضي: `false`).
- `dispatch.enabled`: مفتاح مستقل لتوزيع دورات جلسات ACP ‏(الافتراضي: `true`). اضبطه على `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضية لوقت تشغيل ACP ‏(ويجب أن يطابق Plugin وقت تشغيل ACP مسجلًا).
- `defaultAgent`: معرّف الوكيل الهدف الاحتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح بمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ وتعني القائمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لعدد جلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة flush عند الخمول بالميلي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: كبت سطور الحالة/الأدوات المتكررة لكل دورة (الافتراضي: `true`).
- `stream.deliveryMode`: ‏`"live"` يتدفق تدريجيًا؛ و`"final_only"` يحتجز حتى أحداث نهاية الدورة.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لمحارف مخرجات المساعد المسقطة لكل دورة ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للمحارف الخاصة بسطور حالة/تحديث ACP المسقطة.
- `stream.tagVisibility`: سجل من أسماء العلامات إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL بالخمول بالدقائق للعاملين في جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري لتشغيله عند تهيئة بيئة وقت تشغيل ACP.

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

- يتحكم `cli.banner.taglineMode` في نمط الشعار النصي:
  - `"random"` ‏(الافتراضي): شعارات نصية متداولة طريفة/موسمية.
  - `"default"`: شعار نصي حيادي ثابت (`All your chats, one OpenClaw.`).
  - `"off"`: بدون نص شعار (مع استمرار عرض عنوان الشعار/الإصدار).
- لإخفاء الشعار بالكامل (وليس فقط الشعارات النصية)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

بيانات وصفية يكتبها إعداد CLI الموجّه (`onboard`, `configure`, `doctor`):

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

## Identity

راجع حقول الهوية في `agents.list` تحت [الإعدادات الافتراضية للوكلاء](/ar/gateway/config-agents#agent-defaults).

---

## Bridge ‏(قديم، أُزيل)

لم تعد الإصدارات الحالية تتضمن TCP bridge. وتتصل Nodes عبر Gateway WebSocket. ولم تعد مفاتيح `bridge.*` جزءًا من schema التهيئة (وسيفشل التحقق حتى تتم إزالتها؛ ويمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

<Accordion title="تهيئة bridge القديمة (مرجع تاريخي)">

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
    webhook: "https://example.invalid/legacy", // رجوع احتياطي قديم للوظائف المخزنة التي تحتوي على notify:true
    webhookToken: "replace-with-dedicated-token", // bearer token اختياري لمصادقة Webhook الصادرة
    sessionRetention: "24h", // سلسلة مدة أو false
    runLog: {
      maxBytes: "2mb", // الافتراضي 2_000_000 بايت
      keepLines: 2000, // الافتراضي 2000
    },
  },
}
```

- `sessionRetention`: المدة التي يجب الاحتفاظ خلالها بجلسات تشغيل Cron المعزولة المكتملة قبل إزالتها من `sessions.json`. كما تتحكم أيضًا في تنظيف transcripts Cron المحذوفة والمؤرشفة. الافتراضي: `24h`; اضبطها على `false` لتعطيلها.
- `runLog.maxBytes`: الحد الأقصى لحجم كل ملف سجل تشغيل (`cron/runs/<jobId>.jsonl`) قبل التقليص. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث الأسطر التي يجري الاحتفاظ بها عند تشغيل تقليص سجل التشغيل. الافتراضي: `2000`.
- `webhookToken`: bearer token المستخدم في تسليم POST الخاص بـ Cron webhook ‏(`delivery.mode = "webhook"`)، وإذا لم يُضبط فلن تُرسل أي ترويسة مصادقة.
- `webhook`: عنوان URL قديم ومهمل لـ webhook ‏(http/https) يُستخدم فقط للوظائف المخزنة التي ما زالت تحتوي على `notify: true`.

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

- `maxAttempts`: الحد الأقصى لعمليات إعادة المحاولة للوظائف ذات التشغيل الواحد عند الأخطاء العابرة (الافتراضي: `3`; النطاق: `0`–`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالميلي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`; من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة — ‏`"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة محاولة جميع الأنواع العابرة.

ينطبق هذا فقط على وظائف Cron ذات التشغيل الواحد. أما الوظائف المتكررة فلها معالجة فشل منفصلة.

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

- `enabled`: تفعيل تنبيهات الفشل لوظائف Cron ‏(الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالميلي ثانية بين التنبيهات المتكررة للوظيفة نفسها (عدد صحيح غير سالب).
- `mode`: وضع التسليم — ترسل `"announce"` عبر رسالة قناة؛ بينما ينشر `"webhook"` إلى Webhook المهيأ.
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

- الوجهة الافتراضية لإشعارات فشل Cron عبر جميع الوظائف.
- `mode`: ‏`"announce"` أو `"webhook"`؛ والقيمة الافتراضية `"announce"` عندما تتوفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم announce. تعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف announce صريح أو عنوان URL لـ webhook. ومطلوب في وضع webhook.
- `accountId`: تجاوز اختياري للحساب عند التسليم.
- تتجاوز `delivery.failureDestination` لكل وظيفة هذا الافتراضي العام.
- عندما لا تكون هناك وجهة فشل عامة ولا وجهة خاصة بالوظيفة، فإن الوظائف التي تسلّم أصلًا عبر `announce` تعود عند الفشل إلى ذلك الهدف الأساسي نفسه الخاص بـ announce.
- لا تُدعَم `delivery.failureDestination` إلا للوظائف ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للوظيفة هو `"webhook"`.

راجع [وظائف Cron](/ar/automation/cron-jobs). وتُتتبّع تنفيذات Cron المعزولة بوصفها [مهام في الخلفية](/ar/automation/tasks).

---

## متغيرات قالب نماذج الوسائط

عناصر نائبة للقالب يجري توسيعها في `tools.media.models[].args`:

| المتغير            | الوصف                                           |
| ------------------ | ----------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                        |
| `{{RawBody}}`      | النص الخام (من دون أغلفة السجل/المرسل)           |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعات                 |
| `{{From}}`         | معرّف المرسل                                     |
| `{{To}}`           | معرّف الوجهة                                     |
| `{{MessageSid}}`   | معرّف رسالة القناة                               |
| `{{SessionId}}`    | UUID الجلسة الحالية                              |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                    |
| `{{MediaUrl}}`     | pseudo-URL للوسائط الواردة                       |
| `{{MediaPath}}`    | المسار المحلي للوسائط                            |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)                  |
| `{{Transcript}}`   | النص المنسوخ للصوت                               |
| `{{Prompt}}`       | media prompt المحلول لإدخالات CLI               |
| `{{MaxChars}}`     | الحد الأقصى لمحارف المخرجات المحلول لإدخالات CLI |
| `{{ChatType}}`     | `"direct"` أو `"group"`                          |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)                |
| `{{SenderName}}`   | اسم عرض المرسل (بأفضل جهد)                       |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                      |
| `{{Provider}}`     | تلميح المزوّد (whatsapp أو telegram أو discord، إلخ) |

---

## تضمينات التهيئة (`$include`)

قسّم التهيئة إلى ملفات متعددة:

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
- المفاتيح الشقيقة: تُدمج بعد التضمينات (فتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبةً إلى الملف المضمِّن، لكن يجب أن تبقى داخل دليل التهيئة الأعلى مستوى (`dirname` الخاص بـ `openclaw.json`). وتُسمح الأشكال المطلقة/`../` فقط عندما تُحل داخل ذلك الحد.
- تكتب عمليات OpenClaw المملوكة التي تغيّر قسمًا علويًا واحدًا فقط مدعومًا بتضمين ملف واحد مباشرةً إلى ذلك الملف المضمَّن. مثلًا، يقوم `plugins install` بتحديث `plugins: { $include: "./plugins.json5" }` داخل `plugins.json5` ويترك `openclaw.json` كما هو.
- تكون التضمينات الجذرية، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط بالنسبة إلى عمليات الكتابة المملوكة لـ OpenClaw؛ وتفشل تلك الكتابات بشكل مغلق بدلًا من تسطيح التهيئة.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية.

---

_ذو صلة: [التهيئة](/ar/gateway/configuration) · [أمثلة التهيئة](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [التهيئة](/ar/gateway/configuration)
- [أمثلة التهيئة](/ar/gateway/configuration-examples)
