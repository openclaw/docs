---
read_when:
    - تحتاج إلى دلالات إعدادات دقيقة على مستوى الحقول أو القيم الافتراضية
    - أنت تتحقق من صحة كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع تكوين Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية والروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-07-02T08:19:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع تكوين النواة لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة بالمهام، راجع [التكوين](/ar/gateway/configuration).

يغطي أسطح تكوين OpenClaw الرئيسية ويضع روابط خارجية عندما يكون لدى نظام فرعي مرجع أعمق خاص به. تعيش كتالوجات الأوامر المملوكة للقنوات وPlugin ومفاتيح الذاكرة العميقة/QMD في صفحاتها الخاصة بدلًا من هذه الصفحة.

حقيقة الكود:

- يطبع `openclaw config schema` مخطط JSON الحي المستخدم للتحقق وControl UI، مع دمج بيانات التعريف المضمنة/Plugin/القناة عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة النطاق بالمسار لأدوات التعمق
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس مستندات التكوين مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` المسمى `config.schema.lookup` للحصول على
مستندات وقيود دقيقة على مستوى الحقل قبل التعديلات. استخدم
[التكوين](/ar/gateway/configuration) للإرشاد الموجه بالمهام وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع تكوين الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وتكوين dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر الحالي المدمج + المضمن
- صفحات القناة/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق التكوين هو **JSON5** (يُسمح بالتعليقات والفواصل اللاحقة). جميع الحقول اختيارية - يستخدم OpenClaw قيماً افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح التكوين الخاصة بكل قناة إلى صفحة مخصصة - راجع
[التكوين - القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والقنوات
المضمنة الأخرى (المصادقة، والتحكم في الوصول، والحسابات المتعددة، وبوابة الإشارات).

## القيم الافتراضية للوكيل، وتعدد الوكلاء، والجلسات، والرسائل

انتقلت إلى صفحة مخصصة - راجع
[التكوين - الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، والنموذج، والتفكير، وheartbeat، والذاكرة، والوسائط، وSkills، وsandbox)
- `multiAgent.*` (توجيه تعدد الوكلاء والارتباطات)
- `session.*` (دورة حياة الجلسة، وcompaction، والتقليم)
- `messages.*` (تسليم الرسائل، وTTS، وعرض markdown)
- `talk.*` (وضع Talk)
  - `talk.consultThinkingLevel`: تجاوز مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استشارات Control UI Talk الفورية
  - `talk.consultFastMode`: تجاوز وضع سريع لمرة واحدة لاستشارات Control UI Talk الفورية
  - `talk.speechLocale`: معرف لغة BCP 47 اختياري للتعرف على كلام Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم ضبطه، يحتفظ Talk بنافذة التوقف الافتراضية للمنصة قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: رجوع ترحيل Gateway لنصوص Talk الفورية النهائية التي تتخطى `openclaw_agent_consult`

## الأدوات والمزودون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وتكوين الأدوات المدعوم بالمزودين،
وإعداد المزود المخصص / عنوان URL الأساسي إلى صفحة مخصصة - راجع
[التكوين - الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

توجد تعريفات المزودين، وقوائم السماح للنماذج، وإعداد المزودين المخصصين في
[التكوين - الأدوات والمزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
يمتلك جذر `models` أيضاً سلوك كتالوج النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك كتالوج المزودين (`merge` أو `replace`).
- `models.providers`: خريطة مزودين مخصصة مفهرسة بمعرف المزود.
- `models.providers.*.localService`: مدير عمليات اختياري عند الطلب
  لخوادم النماذج المحلية. يفحص OpenClaw نقطة نهاية الصحة المكوّنة، ويبدأ
  `command` المطلق عند الحاجة، وينتظر الجاهزية، ثم يرسل طلب النموذج.
  راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- `models.pricing.enabled`: يتحكم في تمهيد التسعير في الخلفية الذي
  يبدأ بعد وصول sidecars والقنوات إلى مسار جاهزية Gateway. عند `false`،
  يتخطى Gateway عمليات جلب كتالوج تسعير OpenRouter وLiteLLM؛ وتظل قيم
  `models.providers.*.models[].cost` المكوّنة تعمل لتقديرات التكلفة المحلية.

## MCP

تعيش تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` ويتم
استهلاكها بواسطة OpenClaw المضمن ومحولات وقت التشغيل الأخرى. تدير أوامر `openclaw mcp list`
و`show` و`set` و`unset` هذه الكتلة دون الاتصال بالخادم
الهدف أثناء تعديلات التكوين.

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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: تعريفات خوادم MCP مسماة من نوع stdio أو بعيدة لأوقات التشغيل التي
  تعرض أدوات MCP المكوّنة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  أما `type: "http"` فهو اسم بديل أصلي لـ CLI يقوم `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى الحقل القانوني `transport`.
- `mcp.servers.<name>.enabled`: اضبطه على `false` للاحتفاظ بتعريف خادم محفوظ
  مع استبعاده من اكتشاف MCP المضمن في OpenClaw وإسقاط الأدوات.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: مهلة طلب MCP لكل خادم
  بالثواني أو بالمللي ثانية.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: مهلة الاتصال لكل خادم
  بالثواني أو بالمللي ثانية.
- `mcp.servers.<name>.supportsParallelToolCalls`: تلميح تزامن اختياري
  للمحولات التي يمكنها اختيار ما إذا كانت ستصدر استدعاءات أدوات MCP متوازية.
- `mcp.servers.<name>.auth`: اضبطه على `"oauth"` لخوادم HTTP MCP التي تتطلب
  OAuth. شغّل `openclaw mcp login <name>` لتخزين الرموز ضمن حالة OpenClaw.
- `mcp.servers.<name>.oauth`: نطاق OAuth اختياري، وعنوان URL لإعادة التوجيه، وتجاوزات
  عنوان URL لبيانات تعريف العميل.
- `mcp.servers.<name>.sslVerify` و`clientCert` و`clientKey`: عناصر تحكم HTTP TLS
  لنقاط النهاية الخاصة وTLS المتبادل.
- `mcp.servers.<name>.toolFilter`: اختيار أدوات اختياري لكل خادم. يحد `include`
  أدوات MCP المكتشفة إلى الأسماء المطابقة؛ ويخفي `exclude` الأسماء المطابقة.
  تكون الإدخالات أسماء أدوات MCP دقيقة أو أنماط `*` بسيطة. الخوادم التي تحتوي على
  موارد أو prompts تنشئ أيضاً أسماء أدوات مساعدة (`resources_list`،
  `resources_read`، `prompts_list`، `prompts_get`)، وتستخدم تلك الأسماء
  المرشح نفسه.
- `mcp.servers.<name>.codex`: عناصر تحكم إسقاط اختيارية لخادم تطبيق Codex.
  هذه الكتلة هي بيانات تعريف OpenClaw لسلاسل خادم تطبيق Codex فقط؛ ولا تؤثر
  في جلسات ACP، أو تكوين حاضنة Codex العامة، أو محولات وقت التشغيل الأخرى.
  يحد `codex.agents` غير الفارغ الخادم إلى معرفات وكلاء OpenClaw المدرجة.
  ترفض عملية التحقق من التكوين قوائم الوكلاء المحددة النطاق الفارغة أو الخالية أو غير الصالحة
  ويحذفها مسار إسقاط وقت التشغيل بدل أن تصبح عامة.
  يصدر `codex.defaultToolsApprovalMode` القيمة الأصلية لـ Codex
  `default_tools_approval_mode` لذلك الخادم. يزيل OpenClaw كتلة `codex`
  قبل تمرير تكوين `mcp_servers` الأصلي إلى Codex. احذف الكتلة
  لإبقاء الخادم مسقطاً لكل وكيل خادم تطبيق Codex مع سلوك موافقة MCP
  الافتراضي في Codex.
- `mcp.sessionIdleTtlMs`: TTL الخمول لأوقات تشغيل MCP المضمنة المحددة النطاق بالجلسة.
  تطلب عمليات التشغيل المضمنة لمرة واحدة تنظيف نهاية التشغيل؛ وتكون قيمة TTL هذه دعامة أخيرة
  للجلسات طويلة العمر والجهات المستدعية المستقبلية.
- تُطبق التغييرات ضمن `mcp.*` فورياً عبر التخلص من أوقات تشغيل MCP للجلسات المخزنة مؤقتاً.
  يعيد الاكتشاف/الاستخدام التالي للأداة إنشاءها من التكوين الجديد، لذلك تُزال
  إدخالات `mcp.servers` المحذوفة فوراً بدل انتظار TTL الخمول.
- يراعي اكتشاف وقت التشغيل أيضاً إشعارات تغيير قائمة أدوات MCP عبر إسقاط
  الكتالوج المخزن مؤقتاً لتلك الجلسة. تحصل الخوادم التي تعلن عن موارد أو
  prompts على أدوات مساعدة لسرد/قراءة الموارد وسرد/جلب
  prompts. توقف إخفاقات استدعاء الأدوات المتكررة الخادم المتأثر مؤقتاً قبل
  محاولة استدعاء أخرى.

راجع [MCP](/ar/cli/mcp#openclaw-as-an-mcp-client-registry) و
[واجهات CLI الخلفية](/ar/gateway/cli-backends#bundle-mcp-overlays) لسلوك وقت التشغيل.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`: قائمة سماح اختيارية للـ skills المضمنة فقط (لا تتأثر Skills المُدارة/مساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (الأدنى أسبقية).
- `load.allowSymlinkTargets`: جذور أهداف حقيقية موثوقة قد تُحل إليها روابط Skills الرمزية
  عندما يعيش الرابط خارج جذر المصدر المكوّن له.
- `workshop.allowSymlinkTargetWrites`: يسمح لتطبيق Skill Workshop بالكتابة
  عبر أهداف الروابط الرمزية الموثوقة مسبقاً (الافتراضي: false).
- `install.preferBrew`: عند true، تفضَّل مثبّتات Homebrew عندما يكون `brew`
  متاحاً قبل الرجوع إلى أنواع مثبّتات أخرى.
- `install.nodeManager`: تفضيل مثبت node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: اسمح لعملاء Gateway الموثوقين `operator.admin`
  بتثبيت أرشيفات zip خاصة مهيأة عبر `skills.upload.*`
  (الافتراضي: false). يفعّل هذا مسار الأرشيفات المرفوعة فقط؛ ولا تتطلب
  تثبيتات ClawHub العادية ذلك.
- `entries.<skillKey>.enabled: false` يعطل skill حتى لو كانت مضمنة/مثبتة.
- `entries.<skillKey>.apiKey`: وسيلة ملائمة للـ skills التي تعلن متغير بيئة أساسياً (سلسلة نصية صريحة أو كائن SecretRef).

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

- تُحمَّل من أدلة الحزم أو الحزم المجمعة ضمن `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، بالإضافة إلى الملفات أو الأدلة المدرجة في `plugins.load.paths`.
- ضع ملفات Plugin المستقلة في `plugins.load.paths`؛ جذور الإضافات المكتشفة تلقائيًا تتجاهل ملفات `.js` و`.mjs` و`.ts` في المستوى الأعلى حتى لا تمنع سكربتات المساعدة في تلك الجذور بدء التشغيل.
- يقبل الاكتشاف Plugins OpenClaw الأصلية بالإضافة إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude الافتراضية التخطيط من دون ملف manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (لا تُحمَّل إلا Plugins المدرجة). تتغلب `deny` عليها.
- `plugins.entries.<id>.apiKey`: حقل ملاءمة لمفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة بنطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يحظر النواة `before_prompt_build` ويتجاهل الحقول التي تعدّل الموجه من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق على خطافات Plugin الأصلية وأدلة الخطافات المقدمة من الحزم المدعومة.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن للـ Plugins الموثوقة غير المجمعة قراءة محتوى المحادثة الخام من خطافات مكتوبة مثل `llm_input` و`llm_output` و`before_model_resolve` و`before_agent_reply` و`before_agent_run` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: الثقة صراحةً بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل في تشغيلات الوكيل الفرعي الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` المعيارية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowModelOverride`: الثقة صراحةً بهذا Plugin لطلب تجاوزات النموذج لـ `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` المعيارية لتجاوزات إكمال LLM من Plugin موثوق. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: الثقة صراحةً بهذا Plugin لتشغيل `api.runtime.llm.complete` مقابل معرّف وكيل غير افتراضي.
- `plugins.entries.<id>.config`: كائن إعدادات يعرّفه Plugin (تتحقق منه بنية Plugin OpenClaw الأصلية عند توفرها).
- توجد إعدادات حساب/وقت تشغيل Plugin القناة ضمن `channels.<id>` ويجب أن تصفها بيانات `channelConfigs` الوصفية في manifest الخاص بالـ Plugin المالك، لا سجل خيارات OpenClaw مركزي.

### إعدادات Plugin حاضنة Codex

يمتلك Plugin `codex` المجمّع إعدادات حاضنة خادم تطبيقات Codex الأصلية ضمن
`plugins.entries.codex.config`. راجع
[مرجع حاضنة Codex](/ar/plugins/codex-harness-reference) للاطلاع على سطح الإعدادات الكامل
و[حاضنة Codex](/ar/plugins/codex-harness) لنموذج وقت التشغيل.

ينطبق `codexPlugins` فقط على الجلسات التي تختار حاضنة Codex الأصلية.
ولا يفعّل Plugins Codex لتشغيلات موفر OpenClaw، أو ارتباطات محادثات ACP،
أو أي حاضنة غير Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: يفعّل دعم Plugin/التطبيق الأصلي في Codex
  لحاضنة Codex. الافتراضي: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سياسة الإجراءات المدمرة الافتراضية لطلبات Plugin التطبيق المرحّلة.
  استخدم `true` لقبول مخططات موافقة Codex الآمنة من دون مطالبة، و`false`
  لرفضها، و`"auto"` لتوجيه الموافقات التي يتطلبها Codex عبر موافقات Plugin في OpenClaw،
  أو `"ask"` للمطالبة بكل إجراء كتابة/تدمير من Plugin من دون موافقة دائمة.
  يمسح وضع `"ask"` تجاوزات موافقة Codex الدائمة لكل أداة للتطبيق المتأثر
  ويحدد مراجع الموافقات البشري لذلك التطبيق قبل بدء سلسلة Codex.
  الافتراضي: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: يفعّل إدخال
  Plugin مرحّلًا عندما يكون `codexPlugins.enabled` العام صحيحًا أيضًا.
  الافتراضي: `true` للإدخالات الصريحة.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هوية سوق مستقرة. يدعم V1 فقط `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هوية
  Plugin Codex مستقرة من الترحيل، مثل `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  تجاوز إجراءات مدمرة لكل Plugin. عند حذفه، تُستخدم قيمة
  `allow_destructive_actions` العامة. تقبل القيمة لكل Plugin السياسات نفسها:
  `true` أو `false` أو `"auto"` أو `"ask"`.

كل تطبيق Plugin مقبول يستخدم `"ask"` يوجه طلبات موافقة ذلك التطبيق
إلى المراجع البشري. تحتفظ التطبيقات الأخرى وموافقات السلاسل غير التطبيقية
بالمراجع المكوّن لها، لذلك لا ترث سياسات Plugins المختلطة سلوك `"ask"`.

`codexPlugins.enabled` هو توجيه التفعيل العام. إدخالات Plugin الصريحة
التي يكتبها الترحيل هي مجموعة التثبيت الدائمة وأهلية الإصلاح.
`plugins["*"]` غير مدعوم، ولا يوجد مفتاح `install`، وقيم
`marketplacePath` المحلية ليست حقول إعدادات عمدًا لأنها خاصة بالمضيف.

تُخزَّن فحوصات جاهزية `app/list` مؤقتًا لمدة ساعة واحدة وتُحدَّث
بشكل غير متزامن عند تقادمها. تُحتسب إعدادات تطبيق سلسلة Codex عند إنشاء
جلسة حاضنة Codex، وليس في كل دورة؛ استخدم `/new` أو `/reset` أو أعد تشغيل Gateway
بعد تغيير إعدادات Plugin الأصلية.

- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفر جلب الويب Firecrawl.
  - `apiKey`: مفتاح API اختياري لـ Firecrawl للحصول على حدود أعلى (يقبل SecretRef). يعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API من Firecrawl (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الاستخراج بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث الويب Grok).
  - `enabled`: تفعيل موفر X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات dreaming الذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: إيقاع Cron لكل مسح dreaming كامل (`"0 3 * * *"` افتراضيًا).
  - `model`: تجاوز اختياري لنموذج الوكيل الفرعي Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه مع `allowedModels` لتقييد الأهداف. أخطاء عدم توفر النموذج تعيد المحاولة مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ إخفاقات الثقة أو قائمة السماح لا تعود بصمت.
  - سياسة المرحلة والعتبات تفاصيل تنفيذية (ليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـ Plugins حزم Claude المفعّلة أيضًا المساهمة بافتراضات OpenClaw مضمنة من `settings.json`؛ يطبق OpenClaw هذه كإعدادات وكيل منقّاة، وليس كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ يكون الافتراضي `"legacy"` ما لم تثبّت وتحدد محركًا آخر.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يمكن لـ OpenClaw اكتشاف المتابعات من دورات المحادثة وتسليمها عبر تشغيلات Heartbeat.

- `commitments.enabled`: تفعيل استخراج LLM المخفي والتخزين وتسليم Heartbeat للالتزامات المتابعة المستنتجة. الافتراضي: `false`.
- `commitments.maxPerDay`: الحد الأقصى لالتزامات المتابعة المستنتجة التي تُسلَّم لكل جلسة وكيل في يوم متدرج. الافتراضي: `3`.

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
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد وقت الخمول أو عندما
  تتجاوز الجلسة حدها الأقصى. عيّن `idleMinutes: 0` أو `maxTabsPerSession: 0` من أجل
  تعطيل أوضاع التنظيف الفردية هذه.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلاً عند عدم ضبطه، لذلك يبقى تنقل المتصفح صارماً افتراضياً.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمداً بتنقل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه على الشبكات الخاصة أثناء فحوصات قابلية الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعوماً كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصصة للإرفاق فقط (التشغيل/الإيقاف/إعادة الضبط معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك موفرك بعنوان URL مباشر لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية الوصول إلى CDP البعيد و
  `attachOnly` إضافة إلى طلبات فتح علامات التبويب. تحتفظ ملفات تعريف loopback
  المُدارة بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مُدارة خارجياً ويمكن الوصول إليها عبر loopback، فاضبط
  `attachOnly: true` لذلك الملف التعريفي؛ وإلا فسيتعامل OpenClaw مع منفذ loopback على أنه
  ملف تعريف متصفح محلي مُدار وقد يبلّغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلاً من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف متصفح محدد
  مبني على Chromium مثل Brave أو Edge.
- يمكن لملفات تعريف `existing-session` ضبط `cdpUrl` عندما يكون Chrome قيد التشغيل بالفعل
  خلف نقطة نهاية اكتشاف DevTools HTTP(S) أو نقطة نهاية WS(S) مباشرة. في ذلك
  الوضع يمرر OpenClaw نقطة النهاية إلى Chrome MCP بدلاً من استخدام الاتصال التلقائي؛
  يتم تجاهل `userDataDir` لوسائط تشغيل Chrome MCP.
- تحافظ ملفات تعريف `existing-session` على حدود مسار Chrome MCP الحالية:
  إجراءات مدفوعة باللقطات/المراجع بدلاً من الاستهداف بمحددات CSS، وخطافات رفع ملف واحد،
  ولا توجد تجاوزات لمهلة مربعات الحوار، ولا `wait --load networkidle`، ولا
  `responsebody`، أو تصدير PDF، أو اعتراض التنزيل، أو الإجراءات الدفعية.
- تعيّن ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائياً؛ اضبط
  `cdpUrl` صراحةً فقط لملفات تعريف CDP البعيدة أو إرفاق نقطة نهاية existing-session.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف التعريفي. استخدم هذا لتشغيل ملف تعريف واحد في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية و`browser.localCdpReadyTimeoutMs` لجاهزية CDP websocket
  بعد التشغيل. ارفع هذه القيم على المضيفين الأبطأ حيث يبدأ Chrome بنجاح
  لكن فحوصات الجاهزية تتسابق مع بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعداداً صحيحة موجبة حتى `120000` مللي ثانية؛ يتم رفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنياً على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  `~` و`~/...` لدليل المنزل في نظام التشغيل لديك قبل تشغيل Chromium.
  يتم أيضاً توسيع التلدة في `userDataDir` لكل ملف تعريف على ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، الافتراضي `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء تشغيل Chromium المحلي (على سبيل المثال
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

- `seamColor`: لون تمييز لواجهة تطبيق النظام الأصلية (تلوين فقاعة وضع التحدث، وما إلى ذلك).
- `assistant`: تجاوز هوية Control UI. يعود إلى هوية الوكيل النشط عند عدم الضبط.

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
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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

- `mode`: `local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway بدء التشغيل ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الاستخدامات لـ WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، أو `loopback` (الافتراضي)، أو `lan` (`0.0.0.0`)، أو `tailnet` (عنوان IP من Tailscale فقط)، أو `custom`.
- **الأسماء البديلة القديمة للربط**: استخدم قيم وضع الربط في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس الأسماء البديلة للمضيف (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع ربط `loopback` الافتراضي على `127.0.0.1` داخل الحاوية. مع شبكة جسر Docker (`-p 18789:18789`)، تصل الحركة على `eth0`، لذلك يتعذر الوصول إلى Gateway. استخدم `--network host`، أو عيّن `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على كل الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات الربط غير المحلية مصادقة Gateway. عمليًا يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلاً عكسيًا واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد رمزًا افتراضيًا.
- إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فعيّن `gateway.auth.mode` صراحةً إلى `token` أو `password`. تفشل تدفقات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مكوّنًا ويكون الوضع غير معيّن.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ وهذا لا يُعرض عمدًا ضمن مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: تفويض مصادقة المتصفح/المستخدم إلى وكيل عكسي واعٍ بالهوية والثقة برؤوس الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر وكيل **غير محلي** افتراضيًا؛ وتتطلب الوكلاء العكسية على المضيف نفسه عبر loopback ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`. يمكن للمتصلين الداخليين على المضيف نفسه استخدام `gateway.auth.password` كبديل محلي مباشر؛ ويظل `gateway.auth.token` متنافيًا مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عند `true`، يمكن لرؤوس هوية Tailscale Serve تلبية مصادقة واجهة التحكم/WebSocket (يتم التحقق عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة رؤوس Tailscale تلك؛ بل تتبع وضع مصادقة HTTP العادي في Gateway بدلًا من ذلك. يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. تكون القيمة الافتراضية `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدِّد اختياري لمحاولات المصادقة الفاشلة. يُطبّق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع shared-secret وdevice-token بشكل مستقل). تُرجع المحاولات المحظورة `429` + `Retry-After`.
  - في مسار واجهة التحكم غير المتزامن عبر Tailscale Serve، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تفعّل المحدِّد عند الطلب الثاني بدلًا من أن تمر كلتاهما كتطابقات فاشلة عادية.
  - تكون القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ عيّنها إلى `false` عندما تريد عمدًا إخضاع حركة localhost أيضًا لتحديد المعدل (لإعدادات الاختبار أو نشر الوكلاء الصارم).
- تُخنق دائمًا محاولات مصادقة WS ذات أصل المتصفح مع تعطيل استثناء loopback (دفاعًا متعمقًا ضد القوة الغاشمة المستندة إلى المتصفح على localhost).
- على loopback، تُعزل عمليات القفل ذات أصل المتصفح هذه لكل قيمة `Origin`
  مطبّعة، بحيث لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: `serve` (شبكة Tailscale الخاصة فقط، ربط loopback) أو `funnel` (عام، يتطلب المصادقة).
- `tailscale.serviceName`: اسم خدمة Tailscale اختياري لوضع Serve، مثل
  `svc:openclaw`. عند ضبطه، يمرره OpenClaw إلى `tailscale serve
--service` حتى يمكن تعريض واجهة التحكم عبر خدمة مسماة بدلًا من
  اسم مضيف الجهاز. يجب أن تستخدم القيمة تنسيق اسم خدمة Tailscale
  `svc:<dns-label>`؛ ويبلّغ بدء التشغيل عن عنوان URL المشتق للخدمة.
- `tailscale.preserveFunnel`: عند `true` و`tailscale.mode = "serve"`، يتحقق OpenClaw
  من `tailscale funnel status` قبل إعادة تطبيق Serve عند بدء التشغيل ويتجاوزه
  إذا كان مسار Funnel مكوّن خارجيًا يغطي منفذ Gateway بالفعل.
  الافتراضي `false`.
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. مطلوبة لأصول المتصفح العامة غير المحلية. تُقبل تحميلات واجهة المستخدم الخاصة ذات الأصل نفسه على LAN/شبكة Tailscale الخاصة من loopback أو RFC1918/link-local أو `.local` أو `.ts.net` أو مضيفي Tailscale CGNAT بدون تمكين بديل رأس Host.
- `controlUi.chatMessageMaxWidth`: عرض أقصى اختياري لرسائل محادثة واجهة التحكم المجمّعة. يقبل قيم عرض CSS مقيدة مثل `960px` و`82%` و`min(1280px, 82%)` و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يفعّل بديل أصل رأس Host لعمليات النشر التي تعتمد عمدًا على سياسة أصل رأس Host.
- `remote.transport`: `ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` هي `wss://` للمضيفين العامين؛ ولا يُقبل نص عادي `ws://` إلا لـ loopback وLAN وlink-local و`.local` و`.ts.net` ومضيفي Tailscale CGNAT.
- `remote.remotePort`: منفذ Gateway على مضيف SSH البعيد. الافتراضي `18789`؛ استخدم هذا عندما يختلف منفذ النفق المحلي عن منفذ Gateway البعيد.
- `gateway.remote.token` / `.password` هي حقول اعتماد العميل البعيد. لا تكوّن مصادقة Gateway بذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS أساسي للمرحل الخارجي لـ APNs المستخدم بعد أن تنشر إصدارات iOS المدعومة بالمرحل التسجيلات إلى Gateway. تستخدم إصدارات App Store العامة مرحل OpenClaw المستضاف. يجب أن تطابق عناوين URL للمرحل المخصص مسار بناء/نشر iOS منفصلًا عمدًا يشير عنوان URL للمرحل فيه إلى ذلك المرحل.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالمللي ثانية. الافتراضي `10000`.
- تُفوّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال محددة بنطاق التسجيل إلى Gateway. لا يستطيع Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات بيئية مؤقتة لتكوين المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب للتطوير فقط لعناوين URL لمرحلات HTTP على loopback. يجب أن تبقى عناوين URL لمرحلات الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة Gateway WebSocket قبل المصادقة بالمللي ثانية. الافتراضي: `15000`. تكون لـ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأولوية عند ضبطها. زد هذه القيمة على المضيفين المحمّلين أو منخفضي القدرة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال إحماء بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القناة بالدقائق. عيّن `0` لتعطيل إعادة تشغيل مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: حد مأخذ الاتصال الخامل بالدقائق. أبقِ هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقب الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات تشغيل مراقب الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند ضبطه، تكون له الأولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كبديل فقط عندما يكون `gateway.auth.*` غير معيّن.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وكان غير محلول، يفشل الحل بإغلاق آمن (بلا إخفاء عبر بديل بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين التي تنهي TLS أو تضخ رؤوس العميل المُمررة. لا تدرج إلا الوكلاء الذين تتحكم بهم. لا تزال إدخالات loopback صالحة لإعدادات الوكيل على المضيف نفسه/الاكتشاف المحلي (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها لا تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عند `true`، يقبل Gateway `X-Real-IP` إذا كان `X-Forwarded-For` مفقودًا. الافتراضي `false` لسلوك الفشل المغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح CIDR/IP اختيارية للموافقة التلقائية على إقران جهاز عقدة لأول مرة بدون نطاقات مطلوبة. تكون معطلة عند عدم ضبطها. لا يوافق هذا تلقائيًا على إقران المشغّل/المتصفح/واجهة التحكم/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/رفض عام لأوامر العقد المعلنة بعد الإقران وتقييم قائمة السماح للمنصة. استخدم `allowCommands` للاشتراك في أوامر عقد خطيرة مثل `camera.snap` و`camera.clip` و`screen.record`؛ ويزيل `denyCommands` أمرًا حتى إذا كان افتراضي منصة أو سماح صريح سيضمّنه بخلاف ذلك. بعد أن تغيّر عقدة قائمة أوامرها المعلنة، ارفض إقران ذلك الجهاز وأعد الموافقة عليه حتى يخزن Gateway لقطة الأوامر المحدّثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (تمدد قائمة الرفض الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة رفض HTTP الافتراضية
  للمتصلين من المالك/المسؤول. لا يرفع هذا المتصلين الحاملين للهوية `operator.write`
  إلى وصول المالك/المسؤول؛ وتظل `cron` و`gateway` و`nodes`
  غير متاحة للمتصلين غير المالكين حتى عند إدراجها في قائمة السماح.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- HTTP RPC للمسؤول: معطّل افتراضيًا باعتباره Plugin `admin-http-rpc`. فعّل Plugin لتسجيل `POST /api/v1/admin/rpc`. راجع [HTTP RPC للمسؤول](/ar/plugins/admin-http-rpc).
- إكمالات المحادثة: معطّلة افتراضيًا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة على أنها غير معيّنة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب عناوين URL.
- رأس تقوية استجابة اختياري:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطه فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد بمنافذ ومجلدات حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام تسهيلية: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

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

- `enabled`: يفعّل إنهاء TLS عند مستمع Gateway (HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محليًا موقّعًا ذاتيًا عندما لا تكون الملفات الصريحة مكوّنة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ أبقه مقيّد الأذونات.
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

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات في وقت التشغيل.
  - `"off"`: تجاهل التعديلات المباشرة؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخنة أولًا؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: أقصى وقت اختياري بالمللي ثانية للانتظار حتى تكتمل العمليات الجارية قبل فرض إعادة تشغيل أو إعادة تحميل ساخنة للقناة. احذفه لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ اضبطه على `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية عن العناصر التي لا تزال معلّقة.

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
- يجب أن يكون `hooks.token` مختلفًا عن مصادقة السر المشترك النشطة في Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)؛ تسجل عملية بدء التشغيل تحذيرًا أمنيًا غير قاتل عندما تكتشف إعادة الاستخدام.
- يعلّم `openclaw security audit` إعادة استخدام مصادقة الخطاف/Gateway كنتيجة حرجة، بما في ذلك مصادقة كلمة مرور Gateway المقدمة فقط وقت التدقيق (`--auth password --password <password>`). شغّل `openclaw doctor --fix` لتدوير `hooks.token` مُعاد استخدامه ومخزن، ثم حدّث مرسلي الخطافات الخارجيين لاستخدام رمز الخطاف الجديد.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (على سبيل المثال `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` قالبية، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك الصريح.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في التعيين المعروضة من القوالب كقيم مقدمة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقل حمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء خطاف.
  - يجب أن يكون `transform.module` مسارًا نسبيًا وأن يبقى داخل `hooks.transformsDir` (تُرفض المسارات المطلقة واجتياز المسارات).
  - أبقِ `hooks.transformsDir` تحت `~/.openclaw/hooks/transforms`؛ تُرفض أدلة Skills في مساحة العمل. إذا أبلغ `openclaw doctor` أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات الخطافات أو أزل `hooks.transformsDir`.
- يوجّه `agentId` إلى وكيل محدد؛ تعود المعرّفات غير المعروفة إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد توجيه الوكيل الفعّال، بما في ذلك مسار الوكيل الافتراضي عند حذف `agentId` (`*` أو الحذف = السماح للكل، `[]` = رفض الكل).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل الخطاف دون `sessionKey` صريح.
- `allowRequestSessionKey`: اسمح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية للبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` قالبية.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ تكون القيمة الافتراضية لـ `channel` هي `last`.
- يتجاوز `model` نموذج LLM لهذا تشغيل الخطاف (يجب أن يكون مسموحًا به إذا تم تعيين كتالوج النماذج).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المضمّن `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت ذلك التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لمطابقة نطاق أسماء Gmail، مثل `["hook:", "hook:gmail:"]`.
- إذا كنت تحتاج إلى `hooks.allowRequestSessionKey: false`، فتجاوز الإعداد المسبق باستخدام `sessionKey` ثابتة بدلًا من القيمة الافتراضية القالبية.

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
- لا تشغّل `gog gmail watch serve` منفصلًا بجانب Gateway.

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

- يقدّم HTML/CSS/JS وA2UI القابلة للتحرير بواسطة الوكيل عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- ارتباطات غير loopback: تتطلب مسارات Canvas مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل WebViews في Node عادةً ترويسات المصادقة؛ بعد إقران عقدة واتصالها، يعلن Gateway عن عناوين URL للقدرات بنطاق العقدة للوصول إلى Canvas/A2UI.
- ترتبط عناوين URL للقدرات بجلسة WS النشطة للعقدة وتنتهي صلاحيتها بسرعة. لا يُستخدم الرجوع المستند إلى IP.
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
- `full`: ضمّن `cliPath` + `sshPort`؛ لا يزال إعلان البث المتعدد على LAN يتطلب تفعيل Plugin `bonjour` المضمّن.
- `off`: امنع إعلان البث المتعدد على LAN دون تغيير تفعيل Plugin.
- يبدأ Plugin `bonjour` المضمّن تلقائيًا على مضيفي macOS ويكون اختياريًا على Linux وWindows وعمليات نشر Gateway داخل الحاويات.
- يكون اسم المضيف افتراضيًا هو اسم مضيف النظام عندما يكون تسمية DNS صالحة، وإلا يرجع إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### نطاق واسع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية البث تحت `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، استخدمه مع خادم DNS (يوصى بـ CoreDNS) + DNS مقسم عبر Tailscale.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` (متغيرات بيئة مضمنة)

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
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول.
- راجع [البيئة](/ar/help/environment) لمعرفة أسبقية القيم الكاملة.

### استبدال متغيرات البيئة

أشر إلى متغيرات البيئة في أي سلسلة إعداد باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- لا تطابق إلا الأسماء المكتوبة بالأحرف الكبيرة: `[A-Z_][A-Z0-9_]*`.
- المتغيرات المفقودة/الفارغة تطرح خطأ عند تحميل الإعداد.
- اهرب باستخدام `$${VAR}` للحصول على `${VAR}` حرفية.
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
- معرف `source: "file"`: مؤشر JSON مطلق (مثلًا `"/providers/openai/apiKey"`)
- نمط معرف `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (يدعم محددات بنمط AWS مثل `secret#json_key`)
- يجب ألا تحتوي معرفات `source: "exec"` على مقاطع مسار مفصولة بشرطة مائلة `.` أو `..` (مثلًا يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة المرجعية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات اعتماد `openclaw.json` المدعومة.
- تُضمَّن مراجع `auth-profiles.json` في حلّ وقت التشغيل وتغطية التدقيق.

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

- يدعم موفر `file` الوضعين `mode: "json"` و`mode: "singleValue"` (يجب أن يكون `id` هو `"value"` في وضع singleValue).
- تفشل مسارات موفري الملفات والتنفيذ بإغلاق آمن عندما لا يكون التحقق من Windows ACL متاحًا. عيّن `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب موفر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيًا، تُرفض مسارات أوامر الروابط الرمزية. عيّن `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف الذي تم حله.
- إذا ضُبط `trustedDirs`، فسيُطبق فحص الدليل الموثوق على مسار الهدف الذي تم حله.
- بيئة العملية الفرعية لـ `exec` تكون محدودة افتراضيًا؛ مرر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار في وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلبات اللقطة فقط.
- يُطبق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح الممكّنة إلى فشل بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع تشخيصات.

---

## تخزين المصادقة

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- تُخزَّن ملفات تعريف كل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست تنسيق تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات تعريف مفاتيح API معيارية بصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- لا تدعم ملفات تعريف وضع OAuth (`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملف تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات اعتماد التشغيل الثابتة من لقطات محلولة داخل الذاكرة؛ وتُزال إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- تُستورد إدخالات OAuth القديمة من `~/.openclaw/credentials/oauth.json`.
- راجع [OAuth](/ar/concepts/oauth).
- سلوك تشغيل الأسرار وأدوات `audit/configure/apply`: [إدارة الأسرار](/ar/gateway/secrets).

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

- `billingBackoffHours`: التراجع الأساسي بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). يمكن أن يصل نص الفوترة الصريح إلى هنا حتى في استجابات `401`/`403`، لكن مطابِقات النص الخاصة بالموفّر تبقى محصورة في الموفّر الذي يملكها (مثل OpenRouter `Key limit exceeded`). أما رسائل HTTP `402` القابلة لإعادة المحاولة الخاصة بنافذة الاستخدام أو حدود إنفاق المؤسسة/مساحة العمل فتبقى في مسار `rate_limit` بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل موفّر لعدد ساعات تراجع الفوترة.
- `billingMaxHours`: حد أقصى بالساعات لنمو تراجع الفوترة الأسي (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: التراجع الأساسي بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: حد أقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدوير ملفات تعريف المصادقة ضمن الموفّر نفسه عند أخطاء التحميل الزائد قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). تصل هنا أشكال انشغال الموفّر مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير موفّر/ملف تعريف محمّل بشكل زائد (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدوير ملفات تعريف المصادقة ضمن الموفّر نفسه عند أخطاء حد المعدل قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). تشمل حاوية حد المعدل هذه نصوصًا مصاغة من الموفّر مثل `Too many concurrent requests`، و`ThrottlingException`، و`concurrency limit reached`، و`workers_ai ... quota limit exceeded`، و`resource exhausted`.

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
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل النشط بالبايت قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 ميغابايت). يحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقمة بجانب الملف النشط.
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات الطرفية، وسجلات الملفات، وسجلات OTLP، ونصوص محاضر الجلسات المحفوظة. `redactSensitive: "off"` يعطّل فقط سياسة السجل/المحضر العامة هذه؛ أما أسطح أمان الواجهة/الأدوات/التشخيص فتبقى تحجب الأسرار قبل الإرسال.

---

## التشخيصات

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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

- `enabled`: مفتاح التشغيل الرئيسي لمخرجات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات التي تفعّل مخرجات سجل مستهدفة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر عدم التقدم بالميلي ثانية لتصنيف جلسات المعالجة طويلة التشغيل كـ `session.long_running` أو `session.stalled` أو `session.stuck`. تؤدي الردود والأدوات والحالة والكتل وتقدم ACP إلى إعادة ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة أثناء عدم تغيّرها.
- `stuckSessionAbortMs`: عتبة عمر عدم التقدم بالميلي ثانية قبل أن يصبح العمل النشط المتوقف المؤهل قابلًا للتفريغ بالإجهاض من أجل التعافي. عند عدم ضبطها، يستخدم OpenClaw نافذة التشغيل المضمّن الممتدة الأكثر أمانًا، بحد أدنى 5 دقائق و3 أضعاف `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: تلتقط لقطة استقرار منقحة قبل نفاد الذاكرة عندما يصل ضغط الذاكرة إلى `critical` (الافتراضي: `false`). اضبطها على `true` لإضافة فحص/كتابة ملف حزمة الاستقرار مع إبقاء أحداث ضغط الذاكرة العادية.
- `otel.enabled`: يفعّل مسار تصدير OpenTelemetry (الافتراضي: `false`). للتكوين الكامل، وكتالوج الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع من أجل تصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بالإشارة. عند ضبطها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبعات أو المقاييس أو السجلات.
- `otel.logsExporter`: وجهة تصدير السجلات: `"otlp"` (الافتراضي)، أو `"stdout"` لكائن JSON واحد لكل سطر stdout، أو `"both"`.
- `otel.sampleRate`: معدل أخذ عينات التتبع `0`-`1`.
- `otel.flushIntervalMs`: الفاصل الدوري لتفريغ القياسات بالميلي ثانية.
- `otel.captureContent`: التقاط محتوى خام اختياري لسمات نطاقات OTEL. يكون معطلًا افتراضيًا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامي؛ ويتيح شكل الكائن تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` و`toolDefinitions` صراحةً.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئي لأحدث شكل نطاق استدلال GenAI تجريبي، بما في ذلك أسماء نطاقات `{gen_ai.operation.name} {gen_ai.request.model}`، ونوع النطاق `CLIENT`، و`gen_ai.provider.name` بدلًا من `gen_ai.system` القديم. افتراضيًا، تحتفظ النطاقات بـ `openclaw.model.call` و`gen_ai.system` للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئي للمضيفين الذين سجلوا مسبقًا SDK عالميًا لـ OpenTelemetry. عندها يتجاوز OpenClaw بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بالإشارة تُستخدم عندما لا يكون مفتاح التكوين المطابق مضبوطًا.
- `cacheTrace.enabled`: تسجيل لقطات تتبع الذاكرة المؤقتة للتشغيلات المضمّنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار إخراج JSONL لتتبع الذاكرة المؤقتة (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: تتحكم فيما يُضمّن في مخرجات تتبع الذاكرة المؤقتة (كلها افتراضيًا: `true`).

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
- `auto.enabled`: تفعيل التحديث التلقائي في الخلفية لتثبيتات الحزمة (الافتراضي: `false`).
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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ اضبطها على `false` لإخفاء إمكانات إرسال ACP والتفريع).
- `dispatch.enabled`: بوابة مستقلة لإرسال دور جلسة ACP (الافتراضي: `true`). اضبطها على `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف واجهة تشغيل ACP الخلفية الافتراضي (يجب أن يطابق Plugin تشغيل ACP مسجلًا).
  ثبّت Plugin الواجهة الخلفية أولًا، وإذا كان `plugins.allow` مضبوطًا، فأدرج معرّف Plugin الواجهة الخلفية (مثل `acpx`) وإلا فلن تُحمّل واجهة ACP الخلفية.
- `defaultAgent`: معرّف وكيل ACP الهدف الاحتياطي عندما لا تحدد التفريعات هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات تشغيل ACP؛ تعني القائمة الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة في الوقت نفسه.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالميلي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم المقطع قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: قمع أسطر الحالة/الأداة المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: يبث `"live"` تدريجيًا؛ بينما يخزن `"final_only"` مؤقتًا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: فاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف في أسطر حالة/تحديث ACP المعروضة.
- `stream.tagVisibility`: سجل أسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة بقاء الخمول بالدقائق لعمال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
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

- يتحكم `cli.banner.taglineMode` في نمط العبارة التعريفية للشعار:
  - `"random"` (الافتراضي): عبارات تعريفية طريفة/موسمية متناوبة.
  - `"default"`: عبارة تعريفية حيادية ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: بلا نص عبارة تعريفية (يظل عنوان الشعار/الإصدار معروضين).
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
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## الهوية

راجع حقول هوية `agents.list` ضمن [افتراضيات الوكيل](/ar/gateway/config-agents#agent-defaults).

---

## الجسر (قديم، تمت إزالته)

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل Nodes عبر Gateway WebSocket. لم تعد مفاتيح `bridge.*` جزءًا من مخطط التهيئة (يفشل التحقق حتى تتم إزالتها؛ يمكن لـ `openclaw doctor --fix` حذف المفاتيح غير المعروفة).

<Accordion title="تهيئة الجسر القديمة (مرجع تاريخي)">

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل cron المعزولة المكتملة قبل تنقيحها من `sessions.json`. يتحكم أيضًا في تنظيف نصوص cron المؤرشفة المحذوفة. الافتراضي: `24h`؛ اضبطه على `false` للتعطيل.
- `runLog.maxBytes`: مقبول للتوافق مع سجلات تشغيل cron القديمة المدعومة بالملفات. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث صفوف سجل التشغيل في SQLite المحتفظ بها لكل مهمة. الافتراضي: `2000`.
- `webhookToken`: رمز حامل يُستخدم لتسليم POST عبر Webhook في cron (`delivery.mode = "webhook"`)، وإذا حُذف فلن يُرسل ترويس مصادقة.
- `webhook`: عنوان URL قديم مهمل كخيار احتياطي لـ Webhook ‏(http/https) يستخدمه `openclaw doctor --fix` لترحيل المهام المخزنة التي لا تزال تحتوي على `notify: true`؛ يستخدم تسليم وقت التشغيل `delivery.mode="webhook"` لكل مهمة مع `delivery.to`، أو `delivery.completionDestination` عند الحفاظ على تسليم الإعلان.

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

- `maxAttempts`: الحد الأقصى لإعادة محاولة مهام cron عند الأخطاء العابرة (الافتراضي: `3`؛ النطاق: `0`-`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. احذفها لإعادة محاولة كل الأنواع العابرة.

تظل المهام ذات التنفيذ الواحد مفعلة حتى تُستنفد محاولات الإعادة، ثم تُعطّل مع الاحتفاظ بحالة الخطأ النهائية. تستخدم المهام المتكررة سياسة إعادة المحاولة العابرة نفسها للتشغيل مرة أخرى بعد التراجع قبل الموعد المجدول التالي؛ وتعود الأخطاء الدائمة أو محاولات الإعادة العابرة المستنفدة إلى الجدول المتكرر العادي مع تراجع الخطأ.

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

- `enabled`: تفعيل تنبيهات الفشل لمهام cron (الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق تنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للمهمة نفسها (عدد صحيح غير سالب).
- `includeSkipped`: احتساب عمليات التشغيل المتخطاة المتتالية ضمن حد التنبيه (الافتراضي: `false`). تُتتبع عمليات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
- `mode`: وضع التسليم - يرسل `"announce"` عبر رسالة قناة؛ وينشر `"webhook"` إلى Webhook المهيأ.
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

- الوجهة الافتراضية لإشعارات فشل cron عبر جميع المهام.
- `mode`: `"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلان. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب في وضع Webhook.
- `accountId`: تجاوز اختياري للحساب من أجل التسليم.
- يتجاوز `delivery.failureDestination` الخاص بكل مهمة هذا الافتراضي العام.
- عندما لا تُضبط وجهة فشل عامة ولا خاصة بالمهمة، تعود المهام التي تسلّم بالفعل عبر `announce` إلى هدف الإعلان الأساسي ذاك عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتتبع عمليات تنفيذ cron المعزولة بوصفها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

العناصر النائبة للقوالب التي تُوسّع في `tools.media.models[].args`:

| المتغير            | الوصف                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (بلا أغلفة السجل/المرسل)               |
| `{{BodyStripped}}` | النص مع إزالة إشارات المجموعة                     |
| `{{From}}`         | معرّف المرسل                                      |
| `{{To}}`           | معرّف الوجهة                                      |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID الجلسة الحالية                               |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                     |
| `{{MediaUrl}}`     | عنوان URL صوري للوسائط الواردة                    |
| `{{MediaPath}}`    | مسار الوسائط المحلي                               |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)                   |
| `{{Transcript}}`   | نص تفريغ الصوت                                    |
| `{{Prompt}}`       | مطالبة الوسائط المحلولة لإدخالات CLI              |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI    |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (بأقصى جهد ممكن)                  |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأقصى جهد ممكن)           |
| `{{SenderName}}`   | اسم عرض المرسل (بأقصى جهد ممكن)                  |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأقصى جهد ممكن)                 |
| `{{Provider}}`     | تلميح المزوّد (whatsapp، telegram، discord، إلخ.) |

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
- مصفوفة ملفات: تُدمج بعمق بالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (وتتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى 10 مستويات عمقًا.
- المسارات: تُحل نسبةً إلى الملف الذي يتضمنها، لكن يجب أن تبقى داخل دليل التهيئة الأعلى (`dirname` الخاص بـ `openclaw.json`). يُسمح بالصيغ المطلقة/`../` فقط عندما تظل تُحل داخل ذلك الحد. يجب ألا تحتوي المسارات على بايتات null وأن تكون أقصر بصرامة من 4096 حرفًا قبل الحل وبعده.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط في المستوى الأعلى مدعومًا بتضمين ملف واحد تكتب عبر ذلك الملف المضمّن. على سبيل المثال، يحدّث `plugins install` ‏`plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط بالنسبة إلى عمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بإغلاق آمن بدل تسطيح التهيئة.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية، وتنسيق المسار غير الصالح، والطول المفرط.

---

_ذات صلة: [التهيئة](/ar/gateway/configuration) · [أمثلة التهيئة](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذات صلة

- [التهيئة](/ar/gateway/configuration)
- [أمثلة التهيئة](/ar/gateway/configuration-examples)
