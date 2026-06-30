---
read_when:
    - تحتاج إلى دلالات التكوين الدقيقة على مستوى الحقول أو الإعدادات الافتراضية
    - أنت تتحقق من صحة كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-06-30T22:17:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c95497f4f76fd124505ffb9d0173e7e2adeeed82ee12812b2eca9673d5520fc4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع التكوين الأساسي لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجهة للمهام، راجع [التكوين](/ar/gateway/configuration).

يغطي أسطح تكوين OpenClaw الرئيسية ويربط بمراجع أخرى عندما يكون للنظام الفرعي مرجع أعمق خاص به. تعيش كتالوجات الأوامر المملوكة للقنوات وPlugins ومفاتيح الذاكرة العميقة/QMD في صفحاتها الخاصة بدلاً من هذه الصفحة.

حقيقة الكود:

- يطبع `openclaw config schema` مخطط JSON الحي المستخدم للتحقق وControl UI، مع دمج بيانات bundled/plugin/channel الوصفية عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بالمسار لأدوات التنقيب التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس توثيق التكوين مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` باسم `config.schema.lookup` للحصول على
توثيق وقيود دقيقة على مستوى الحقول قبل التعديلات. استخدم
[التكوين](/ar/gateway/configuration) للإرشاد الموجه للمهام وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع تكوين الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وتكوين Dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لكتالوج الأوامر الحالي المدمج + bundled
- صفحات القنوات/Plugins المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق التكوين هو **JSON5** (يُسمح بالتعليقات والفواصل اللاحقة). كل الحقول اختيارية - يستخدم OpenClaw إعدادات افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح التكوين لكل قناة إلى صفحة مخصصة - راجع
[التكوين - القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وقنوات
bundled الأخرى (المصادقة، التحكم بالوصول، الحسابات المتعددة، بوابة الإشارات).

## افتراضيات الوكيل، وتعدد الوكلاء، والجلسات، والرسائل

انتقلت إلى صفحة مخصصة - راجع
[التكوين - الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، sandbox)
- `multiAgent.*` (توجيه تعدد الوكلاء والربط)
- `session.*` (دورة حياة الجلسة، Compaction، التقليم)
- `messages.*` (تسليم الرسائل، TTS، عرض markdown)
- `talk.*` (وضع Talk)
  - `talk.consultThinkingLevel`: تجاوز مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استشارات Control UI Talk الفورية
  - `talk.consultFastMode`: تجاوز لمرة واحدة لوضع السرعة لاستشارات Control UI Talk الفورية
  - `talk.speechLocale`: معرف لغة BCP 47 اختياري للتعرف على كلام Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم تعيينه، يحتفظ Talk بنافذة التوقف الافتراضية للمنصة قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: بديل ترحيل Gateway لنصوص Talk الفورية النهائية التي تتخطى `openclaw_agent_consult`

## الأدوات والمزودون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وتكوين الأدوات المدعومة بالمزودين،
وإعداد المزود المخصص / عنوان URL الأساسي إلى صفحة مخصصة - راجع
[التكوين - الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

توجد تعريفات المزودين، وقوائم السماح للنماذج، وإعداد المزود المخصص في
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

- `models.mode`: سلوك كتالوج المزود (`merge` أو `replace`).
- `models.providers`: خريطة مزودين مخصصة مفهرسة بمعرف المزود.
- `models.providers.*.localService`: مدير عمليات اختياري عند الطلب لخوادم النماذج
  المحلية. يفحص OpenClaw نقطة نهاية الصحة المكوّنة، ويبدأ
  `command` المطلق عند الحاجة، وينتظر الجاهزية، ثم يرسل طلب النموذج.
  راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- `models.pricing.enabled`: يتحكم في تمهيد التسعير في الخلفية الذي
  يبدأ بعد وصول الخدمات الجانبية والقنوات إلى مسار جاهزية Gateway. عندما تكون `false`،
  يتخطى Gateway جلب كتالوجات تسعير OpenRouter وLiteLLM؛ وتظل قيم
  `models.providers.*.models[].cost` المكوّنة تعمل لتقديرات التكلفة المحلية.

## MCP

تعيش تعريفات خوادم MCP المُدارة من OpenClaw ضمن `mcp.servers` وتستهلكها
OpenClaw المضمنة ومحولات وقت التشغيل الأخرى. تدير أوامر `openclaw mcp list` و
`show` و`set` و`unset` هذه الكتلة دون الاتصال بالخادم
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
  و`type: "http"` هو اسم مستعار أصلي للـ CLI يقوم `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى حقل `transport` القانوني.
- `mcp.servers.<name>.enabled`: عيّن `false` للاحتفاظ بتعريف خادم محفوظ
  مع استبعاده من اكتشاف MCP المضمن في OpenClaw وإسقاط الأدوات.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: مهلة طلب MCP لكل خادم
  بالثواني أو المللي ثانية.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: مهلة الاتصال لكل خادم
  بالثواني أو المللي ثانية.
- `mcp.servers.<name>.supportsParallelToolCalls`: تلميح تزامن اختياري للمحولات
  التي يمكنها اختيار ما إذا كانت ستصدر استدعاءات أدوات MCP متوازية.
- `mcp.servers.<name>.auth`: عيّن `"oauth"` لخوادم MCP عبر HTTP التي تتطلب
  OAuth. شغّل `openclaw mcp login <name>` لتخزين الرموز ضمن حالة OpenClaw.
- `mcp.servers.<name>.oauth`: تجاوزات اختيارية لنطاق OAuth، وعنوان URL لإعادة التوجيه،
  وعنوان URL لبيانات العميل الوصفية.
- `mcp.servers.<name>.sslVerify` و`clientCert` و`clientKey`: عناصر تحكم HTTP TLS
  لنقاط النهاية الخاصة وTLS المتبادل.
- `mcp.servers.<name>.toolFilter`: اختيار أدوات اختياري لكل خادم. يحد `include`
  أدوات MCP المكتشفة إلى الأسماء المطابقة؛ ويخفي `exclude` الأسماء المطابقة.
  الإدخالات هي أسماء أدوات MCP دقيقة أو أنماط `*` بسيطة. تنشئ الخوادم التي
  تحتوي موارد أو مطالبات أيضاً أسماء أدوات مساعدة (`resources_list` و
  `resources_read` و`prompts_list` و`prompts_get`)، وتستخدم تلك الأسماء
  المرشح نفسه.
- `mcp.servers.<name>.codex`: عناصر تحكم اختيارية لإسقاط خادم تطبيق Codex.
  هذه الكتلة هي بيانات OpenClaw وصفية لخيوط خادم تطبيق Codex فقط؛ ولا تؤثر
  في جلسات ACP، أو تكوين Codex harness العام، أو محولات وقت التشغيل الأخرى.
  تحد `codex.agents` غير الفارغة الخادم إلى معرفات وكلاء OpenClaw المدرجة.
  يتم رفض قوائم الوكلاء المحددة النطاق الفارغة، أو الخالية، أو غير الصالحة بواسطة التحقق من التكوين
  ويحذفها مسار إسقاط وقت التشغيل بدلاً من أن تصبح عامة.
  يصدر `codex.defaultToolsApprovalMode` قيمة Codex الأصلية
  `default_tools_approval_mode` لذلك الخادم. يزيل OpenClaw كتلة `codex`
  قبل تمرير تكوين `mcp_servers` الأصلي إلى Codex. احذف الكتلة
  لإبقاء الخادم مسقطاً لكل وكيل خادم تطبيق Codex مع سلوك موافقة MCP الافتراضي في Codex.
- `mcp.sessionIdleTtlMs`: TTL خمول لأوقات تشغيل MCP bundled ذات نطاق الجلسة.
  تطلب التشغيلات المضمنة لمرة واحدة تنظيفاً عند نهاية التشغيل؛ ويمثل TTL هذا شبكة الأمان
  للجلسات طويلة العمر والمتصلين المستقبليين.
- تطبق التغييرات ضمن `mcp.*` مباشرةً من خلال التخلص من أوقات تشغيل MCP الخاصة بالجلسة والمخزنة مؤقتاً.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من التكوين الجديد، لذلك تُزال
  إدخالات `mcp.servers` المحذوفة فوراً بدلاً من انتظار TTL الخمول.
- يراعي اكتشاف وقت التشغيل أيضاً إشعارات تغير قائمة أدوات MCP من خلال إسقاط
  الكتالوج المخزن مؤقتاً لتلك الجلسة. تحصل الخوادم التي تعلن عن موارد أو
  مطالبات على أدوات مساعدة لسرد/قراءة الموارد وسرد/جلب
  المطالبات. توقف إخفاقات استدعاء الأدوات المتكررة الخادم المتأثر مؤقتاً قبل
  محاولة استدعاء آخر.

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

- `allowBundled`: قائمة سماح اختيارية لـ Skills المضمنة فقط (لا تتأثر Skills المُدارة/مساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أولوية).
- `load.allowSymlinkTargets`: جذور أهداف حقيقية موثوقة قد تحل إليها روابط Skills الرمزية
  عندما يكون الرابط خارج جذر المصدر المكوّن له.
- `workshop.allowSymlinkTargetWrites`: يسمح لـ Skill Workshop apply بالكتابة
  عبر أهداف الروابط الرمزية الموثوقة مسبقاً (الافتراضي: false).
- `install.preferBrew`: عند true، يفضل مثبتات Homebrew عندما يكون `brew`
  متاحاً قبل الرجوع إلى أنواع المثبتات الأخرى.
- `install.nodeManager`: تفضيل مثبت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: يسمح لعملاء Gateway الموثوقين من نوع `operator.admin`
  بتثبيت أرشيفات zip خاصة مجهزة عبر `skills.upload.*`
  (الافتراضي: false). يفعّل هذا مسار الأرشيفات المرفوعة فقط؛ ولا تتطلب تثبيتات ClawHub
  العادية ذلك.
- `entries.<skillKey>.enabled: false` يعطل Skill حتى إذا كانت bundled/مثبتة.
- `entries.<skillKey>.apiKey`: تسهيل لـ Skills التي تعلن متغير بيئة أساسياً (سلسلة نصية صريحة أو كائن SecretRef).

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

- تُحمَّل من أدلة الحزم أو الحزم المجمّعة ضمن `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، إضافةً إلى الملفات أو الأدلة المدرجة في `plugins.load.paths`.
- ضع ملفات Plugin المستقلة في `plugins.load.paths`؛ تتجاهل جذور الامتدادات المكتشفة تلقائيًا ملفات `.js` و`.mjs` و`.ts` في المستوى الأعلى حتى لا تمنع السكربتات المساعدة في تلك الجذور بدء التشغيل.
- يقبل الاكتشاف Plugins OpenClaw الأصلية إضافةً إلى حزم Codex المتوافقة وحزم Claude، بما في ذلك حزم Claude ذات التخطيط الافتراضي بلا manifest.
- **تتطلب تغييرات الإعداد إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (تُحمَّل Plugins المدرجة فقط). تتغلب `deny`.
- `plugins.entries.<id>.apiKey`: حقل تسهيل لمفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة محصورة في Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يحظر اللب `before_prompt_build` ويتجاهل الحقول التي تعدّل الموجه من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق ذلك على خطافات Plugin الأصلية وأدلة الخطافات المقدمة من الحزم المدعومة.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن للـ Plugins الموثوقة غير المجمّعة قراءة محتوى المحادثة الخام من الخطافات المعيّنة مثل `llm_input` و`llm_output` و`before_model_resolve` و`before_agent_reply` و`before_agent_run` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: يثق صراحةً بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل لتشغيلات الوكيل الفرعي في الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القانونية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowModelOverride`: يثق صراحةً بهذا Plugin لطلب تجاوزات النموذج لـ `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القانونية لتجاوزات إكمال LLM الموثوقة من Plugin. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: يثق صراحةً بهذا Plugin لتشغيل `api.runtime.llm.complete` مقابل معرّف وكيل غير افتراضي.
- `plugins.entries.<id>.config`: كائن إعدادات يعرّفه Plugin (يتحقق منه مخطط Plugin OpenClaw الأصلي عند توفره).
- توجد إعدادات حساب/تشغيل Channel Plugin ضمن `channels.<id>` وينبغي وصفها بواسطة بيانات `channelConfigs` في manifest الخاص بالـ Plugin المالك، لا بواسطة سجل خيارات مركزي في OpenClaw.

### إعداد Plugin مسخّر Codex

يمتلك Plugin `codex` المجمّع إعدادات مسخّر خادم تطبيق Codex الأصلية ضمن
`plugins.entries.codex.config`. راجع
[مرجع مسخّر Codex](/ar/plugins/codex-harness-reference) للاطلاع على سطح الإعداد الكامل
و[مسخّر Codex](/ar/plugins/codex-harness) لنموذج وقت التشغيل.

ينطبق `codexPlugins` فقط على الجلسات التي تختار مسخّر Codex الأصلي.
ولا يفعّل Plugins Codex لتشغيلات موفر OpenClaw، أو ارتباطات محادثة ACP،
أو أي مسخّر غير Codex.

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

- `plugins.entries.codex.config.codexPlugins.enabled`: يفعّل دعم
  Plugin/التطبيق الأصلي لمسخّر Codex. الافتراضي: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سياسة الإجراءات التدميرية الافتراضية لاستدعاءات تطبيقات Plugin المرحّلة.
  استخدم `true` لقبول مخططات موافقة Codex الآمنة دون مطالبة، و`false`
  لرفضها، و`"auto"` لتوجيه الموافقات المطلوبة من Codex عبر موافقات
  Plugin في OpenClaw، أو `"always"` لطلب كل إجراء كتابة/تدميري من Plugin
  دون موافقة دائمة. يمسح وضع `"always"` تجاوزات موافقة Codex الدائمة
  لكل أداة للتطبيق المتأثر قبل بدء السلسلة.
  الافتراضي: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: يفعّل
  إدخال Plugin مرحّلًا عندما يكون `codexPlugins.enabled` العام صحيحًا أيضًا.
  الافتراضي: `true` للإدخالات الصريحة.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هوية سوق مستقرة. يدعم V1 فقط `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هوية
  Plugin Codex مستقرة من الترحيل، مثل `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  تجاوز الإجراءات التدميرية لكل Plugin. عند حذفه، تُستخدم قيمة
  `allow_destructive_actions` العامة. تقبل قيمة كل Plugin السياسات نفسها
  `true` أو `false` أو `"auto"` أو `"always"`.

`codexPlugins.enabled` هو توجيه التفعيل العام. إدخالات Plugin الصريحة
التي يكتبها الترحيل هي مجموعة التثبيت الدائمة والأهلية للإصلاح.
`plugins["*"]` غير مدعوم، ولا يوجد مفتاح `install`، وقيم
`marketplacePath` المحلية ليست حقول إعدادات عمدًا لأنها خاصة بالمضيف.

تُخزَّن فحوصات جاهزية `app/list` مؤقتًا لمدة ساعة واحدة وتُحدَّث
بشكل غير متزامن عندما تصبح قديمة. تُحتسب إعدادات تطبيق سلسلة Codex عند
إنشاء جلسة مسخّر Codex، وليس عند كل دورة؛ استخدم `/new` أو `/reset` أو
إعادة تشغيل Gateway بعد تغيير إعدادات Plugin الأصلية.

- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفر جلب الويب Firecrawl.
  - `apiKey`: مفتاح API اختياري لـ Firecrawl للحصول على حدود أعلى (يقبل SecretRef). يعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API الخاص بـ Firecrawl (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخرج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث Grok على الويب).
  - `enabled`: فعّل موفر X Search.
  - `model`: نموذج Grok المراد استخدامه للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: إيقاع Cron لكل مسح Dreaming كامل (`"0 3 * * *"` افتراضيًا).
  - `model`: تجاوز اختياري لنموذج وكيل Dream Diary الفرعي. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه بـ `allowedModels` لتقييد الأهداف. تعاد محاولة أخطاء عدم توفر النموذج مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ ولا يحدث رجوع صامت عند فشل الثقة أو قائمة السماح.
  - سياسة المراحل والعتبات تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعداد الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـ Plugins حزم Claude المفعّلة أيضًا المساهمة بإعدادات OpenClaw الافتراضية المضمّنة من `settings.json`؛ يطبق OpenClaw هذه الإعدادات كإعدادات وكيل منقّاة، لا كرقع إعدادات OpenClaw خام.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ يكون الافتراضي `"legacy"` ما لم تثبّت محركًا آخر وتختاره.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يمكن لـ OpenClaw اكتشاف تسجيلات المتابعة من دورات المحادثة وتسليمها عبر تشغيلات Heartbeat.

- `commitments.enabled`: فعّل استخراج LLM المخفي والتخزين والتسليم عبر Heartbeat للالتزامات المستنتجة للمتابعة. الافتراضي: `false`.
- `commitments.maxPerDay`: الحد الأقصى لالتزامات المتابعة المستنتجة التي تُسلَّم لكل جلسة وكيل خلال يوم متحرك. الافتراضي: `3`.

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
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد مدة الخمول أو عندما
  تتجاوز الجلسة حدها الأقصى. اضبط `idleMinutes: 0` أو `maxTabsPerSession: 0` لكي
  تعطل أوضاع التنظيف الفردية هذه.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلاً عند عدم ضبطه، لذلك يبقى تنقل المتصفح صارماً افتراضياً.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمداً بتنقل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) للحظر نفسه للشبكات الخاصة أثناء فحوص قابلية الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعوماً كاسم بديل قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصصة للإرفاق فقط (التشغيل/الإيقاف/إعادة الضبط معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يمنحك مزودك عنوان URL مباشراً لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية وصول CDP البعيدة و
  `attachOnly` إضافة إلى طلبات فتح علامات التبويب. تحتفظ ملفات تعريف loopback
  المُدارة بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مُدارة خارجياً ويمكن الوصول إليها عبر loopback، فاضبط
  `attachOnly: true` في ملف التعريف ذلك؛ وإلا فسيتعامل OpenClaw مع منفذ loopback على أنه
  ملف تعريف متصفح محلي مُدار، وقد يبلغ عن أخطاء ملكية منفذ محلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلاً من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف متصفح
  محدد قائم على Chromium مثل Brave أو Edge.
- يمكن لملفات تعريف `existing-session` ضبط `cdpUrl` عندما يكون Chrome قيد التشغيل بالفعل
  خلف نقطة نهاية اكتشاف HTTP(S) لـ DevTools أو نقطة نهاية WS(S) مباشرة. في ذلك
  الوضع يمرر OpenClaw نقطة النهاية إلى Chrome MCP بدلاً من استخدام الاتصال التلقائي؛
  ويتم تجاهل `userDataDir` في وسائط تشغيل Chrome MCP.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات مدفوعة باللقطات/المراجع بدلاً من الاستهداف بمحددات CSS، وخطافات رفع ملف واحد،
  ولا توجد تجاوزات لمهلة مربعات الحوار، ولا `wait --load networkidle`، ولا
  `responsebody` أو تصدير PDF أو اعتراض التنزيلات أو إجراءات مجمعة.
- تعين ملفات تعريف `openclaw` المحلية المُدارة كلاً من `cdpPort` و`cdpUrl` تلقائياً؛ اضبط
  `cdpUrl` صراحة فقط لملفات تعريف CDP البعيدة أو لإرفاق نقطة نهاية existing-session.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف التعريفي. استخدم هذا لتشغيل ملف تعريف واحد في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية و`browser.localCdpReadyTimeoutMs` لجاهزية WebSocket الخاصة بـ CDP
  بعد التشغيل. ارفع هذه القيم على المضيفين الأبطأ حيث يبدأ Chrome بنجاح
  لكن فحوص الجاهزية تتسابق مع بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعداداً صحيحة موجبة حتى `120000` مللي ثانية؛ وتُرفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائماً على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  القيمتين `~` و`~/...` لدليل المنزل في نظام التشغيل قبل تشغيل Chromium.
  كما يتم توسيع علامة التلدة في `userDataDir` لكل ملف تعريف على ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (المنفذ مشتق من `gateway.port`، والقيمة الافتراضية `18791`).
- يضيف `extraArgs` أعلام تشغيل إضافية إلى بدء تشغيل Chromium المحلي (مثل
  `--disable-gpu` أو تحديد حجم النافذة أو أعلام التصحيح).

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

- `seamColor`: لون تمييز لإطار واجهة مستخدم التطبيق الأصلي (تلوين فقاعة وضع التحدث، إلخ).
- `assistant`: تجاوز هوية واجهة التحكم. يعود إلى هوية الوكيل النشط عند عدم ضبطه.

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

<Accordion title="Gateway field details">

- `mode`: ‏`local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway البدء ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الإرسال لـ WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: ‏`auto`، أو `loopback` (الافتراضي)، أو `lan` (`0.0.0.0`)، أو `tailnet` (عنوان IP من Tailscale فقط)، أو `custom`.
- **أسماء الربط القديمة البديلة**: استخدم قيم وضع الربط في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء المضيف البديلة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: ربط `loopback` الافتراضي يستمع على `127.0.0.1` داخل الحاوية. مع شبكة جسر Docker (`-p 18789:18789`)، تصل حركة المرور على `eth0`، لذلك لا يمكن الوصول إلى Gateway. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على كل الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات الربط غير الخاصة بـ local loopback مصادقة Gateway. عمليًا، يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلًا عكسيًا واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد رمزًا افتراضيًا.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحةً إلى `token` أو `password`. تفشل تدفقات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مكوّنًا ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ هذا لا يُعرض عمدًا في مطالبات الإعداد.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي واعٍ بالهوية وثِق بترويسات الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر وكيل **غير local loopback** افتراضيًا؛ تتطلب الوكلاء العكسيون عبر loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`. يمكن للمتصلين الداخليين من المضيف نفسه استخدام `gateway.auth.password` كاحتياطي محلي مباشر؛ يبقى `gateway.auth.token` متنافيًا مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عند `true`، يمكن لترويسات هوية Tailscale Serve تلبية مصادقة Control UI/WebSocket (متحقق منها عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale تلك؛ بل تتبع وضع مصادقة HTTP العادي في Gateway بدلًا من ذلك. يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. القيمة الافتراضية `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لفشل المصادقة. يطبق لكل عنوان IP للعميل ولكل نطاق مصادقة (يتم تتبع shared-secret وdevice-token بشكل مستقل). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Control UI غير المتزامن عبر Tailscale Serve، تتم تسلسلة المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه تفعيل المحدد عند الطلب الثاني بدلًا من أن تتسابق كلتاهما كعدم تطابق عادي.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها إلى `false` عندما تريد عمدًا تحديد معدل حركة localhost أيضًا (لإعدادات الاختبار أو نشر الوكلاء الصارم).
- تتم دائمًا خنق محاولات مصادقة WS القادمة من أصل المتصفح مع تعطيل إعفاء loopback (دفاع متعدد الطبقات ضد التخمين القسري عبر localhost من المتصفح).
- على loopback، تُعزل حالات القفل تلك القادمة من أصل المتصفح لكل قيمة `Origin`
  مطبّعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: ‏`serve` (tailnet فقط، ربط loopback) أو `funnel` (عام، يتطلب مصادقة).
- `tailscale.serviceName`: اسم خدمة Tailscale اختياري لوضع Serve، مثل
  `svc:openclaw`. عند ضبطه، يمرره OpenClaw إلى `tailscale serve
--service` بحيث يمكن عرض Control UI عبر خدمة مسماة بدلًا
  من اسم مضيف الجهاز. يجب أن تستخدم القيمة تنسيق اسم الخدمة في Tailscale وهو `svc:<dns-label>`؛ يبلّغ بدء التشغيل عن عنوان URL للخدمة المشتق.
- `tailscale.preserveFunnel`: عندما تكون `true` و`tailscale.mode = "serve"`، يتحقق OpenClaw
  من `tailscale funnel status` قبل إعادة تطبيق Serve عند بدء التشغيل ويتخطاه
  إذا كان مسار Funnel مكوّنًا خارجيًا يغطي منفذ Gateway بالفعل.
  الافتراضي `false`.
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. مطلوبة لأصول المتصفح العامة غير الخاصة بـ loopback. يتم قبول تحميلات واجهة LAN/Tailnet الخاصة ذات الأصل نفسه من loopback، أو RFC1918/link-local، أو `.local`، أو `.ts.net`، أو مضيفي Tailscale CGNAT دون تمكين احتياطي ترويسة Host.
- `controlUi.chatMessageMaxWidth`: حد أقصى اختياري للعرض لرسائل دردشة Control UI المجمعة. يقبل قيم عرض CSS مقيّدة مثل `960px`، و`82%`، و`min(1280px, 82%)`، و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطير يمكّن احتياطي أصل ترويسة Host لعمليات النشر التي تعتمد عمدًا على سياسة أصل ترويسة Host.
- `remote.transport`: ‏`ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` هي `wss://` للمضيفين العامين؛ يُقبل النص الصريح `ws://` فقط لـ loopback، وLAN، وlink-local، و`.local`، و`.ts.net`، ومضيفي Tailscale CGNAT.
- `remote.remotePort`: منفذ Gateway على مضيف SSH البعيد. القيمة الافتراضية `18789`؛ استخدم هذا عندما يختلف منفذ النفق المحلي عن منفذ Gateway البعيد.
- `gateway.remote.token` / `.password` هي حقول اعتماد للعميل البعيد. لا تهيئ مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان HTTPS الأساسي للمرحل الخارجي APNs المستخدم بعد أن تنشر إصدارات iOS المدعومة بالمرحل التسجيلات إلى Gateway. تستخدم إصدارات App Store/TestFlight العامة مرحل OpenClaw المستضاف. يجب أن تطابق عناوين URL للمرحل المخصص مسار بناء/نشر iOS منفصلًا عمدًا يشير عنوان URL للمرحل فيه إلى ذلك المرحل.
- `gateway.push.apns.relay.timeoutMs`: مهلة إرسال Gateway إلى المرحل بالميلي ثانية. القيمة الافتراضية `10000`.
- تُفوّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال محددة بنطاق التسجيل إلى Gateway. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات مؤقتة لمتغيرات البيئة لإعدادات المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب للتطوير فقط لعناوين URL لمرحل HTTP عبر loopback. يجب أن تبقى عناوين URL لمرحل الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة Gateway WebSocket قبل المصادقة بالميلي ثانية. الافتراضي: `15000`. تكون لـ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأولوية عند ضبطها. زد هذه القيمة على المضيفين المحمّلين أو منخفضي القدرة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال تمهيد بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القناة بالدقائق. اضبط `0` لتعطيل عمليات إعادة تشغيل مراقبة الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس القديم بالدقائق. أبقِ هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقبة الصحة لكل قناة/حساب خلال ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات تشغيل مراقبة الصحة مع إبقاء المراقب العام مفعّلًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند ضبطه، تكون له الأولوية على التجاوز على مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كاحتياطي فقط عندما يكون `gateway.auth.*` غير مضبوط.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يتم حله، يفشل الحل بإغلاق آمن (دون احتياطي بعيد يخفي الفشل).
- `trustedProxies`: عناوين IP للوكلاء العكسيين التي تنهي TLS أو تضخ ترويسات العميل الممررة. أدرج فقط الوكلاء الذين تتحكم بهم. لا تزال إدخالات loopback صالحة لإعدادات الوكيل/الاكتشاف المحلي على المضيف نفسه (على سبيل المثال Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عند `true`، يقبل Gateway ‏`X-Real-IP` إذا كان `X-Forwarded-For` مفقودًا. الافتراضي `false` لسلوك الفشل بإغلاق آمن.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح اختيارية لـ CIDR/IP للموافقة التلقائية على إقران جهاز عقدة لأول مرة دون نطاقات مطلوبة. تكون معطلة عندما لا تُضبط. لا يوافق هذا تلقائيًا على إقران المشغّل/المتصفح/Control UI/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/منع عام لأوامر العقد المعلنة بعد الإقران وتقييم قائمة سماح المنصة. استخدم `allowCommands` للاشتراك في أوامر العقد الخطيرة مثل `camera.snap`، و`camera.clip`، و`screen.record`؛ يزيل `denyCommands` أمرًا حتى إذا كان افتراضي المنصة أو السماح الصريح سيضمنه بخلاف ذلك. بعد أن تغيّر عقدة قائمة أوامرها المعلنة، ارفض إقران ذلك الجهاز وأعد الموافقة عليه بحيث يخزن Gateway لقطة الأوامر المحدثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (توسّع قائمة المنع الافتراضية).
- `gateway.tools.allow`: إزالة أسماء الأدوات من قائمة منع HTTP الافتراضية
  للمتصلين المالكين/المسؤولين. لا يرقّي هذا المتصلين الحاملين لهوية `operator.write`
  إلى وصول مالك/مسؤول؛ تبقى `cron`، و`gateway`، و`nodes`
  غير متاحة للمتصلين غير المالكين حتى عند إدراجها في قائمة السماح.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Admin HTTP RPC: معطل افتراضيًا كـ Plugin ‏`admin-http-rpc`. فعّل Plugin لتسجيل `POST /api/v1/admin/rpc`. راجع [Admin HTTP RPC](/ar/plugins/admin-http-rpc).
- Chat Completions: معطل افتراضيًا. فعّله باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: ‏`gateway.http.endpoints.responses.enabled`.
- تقوية إدخال عنوان URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة كأنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب عناوين URL.
- ترويسة تقوية اختيارية للاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لأصول HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل مثيلات متعددة

شغّل عدة Gateways على مضيف واحد باستخدام منافذ ومجلدات حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام ملائمة: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

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

- `enabled`: يمكّن إنهاء TLS عند مستمع Gateway ‏(HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محليًا موقّعًا ذاتيًا عندما لا تكون الملفات الصريحة مكوّنة؛ للاستخدام المحلي/التطوير فقط.
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
  - `"off"`: تجاهل التعديلات المباشرة؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية دون إعادة التشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخنة أولًا؛ ثم ارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة تأخير بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: حد أقصى اختياري للوقت بالمللي ثانية للانتظار حتى تكتمل العمليات الجارية قبل فرض إعادة تشغيل أو إعادة تحميل ساخنة للقناة. احذفه لاستخدام الانتظار الافتراضي المحدود (`300000`)؛ واضبطه على `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية بأن العمليات ما زالت معلقة.

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

- يتطلب `hooks.enabled=true` قيمة غير فارغة لـ `hooks.token`.
- يجب أن يكون `hooks.token` مختلفًا عن مصادقة السر المشترك النشطة في Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)؛ تسجل عملية البدء تحذيرًا أمنيًا غير قاتل عندما تكتشف إعادة استخدامه.
- يضع `openclaw security audit` علامة على إعادة استخدام مصادقة الخطاف/Gateway كنتيجة حرجة، بما في ذلك مصادقة كلمة مرور Gateway المقدمة فقط وقت التدقيق (`--auth password --password <password>`). شغّل `openclaw doctor --fix` لتدوير `hooks.token` المُعاد استخدامه والمحفوظ، ثم حدّث مرسلي الخطافات الخارجيين لاستخدام رمز الخطاف الجديد.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (مثلًا `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` بقالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في التعيين المولدة من القوالب كقيم مقدمة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثال: `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقلًا في الحمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تُرجع إجراء خطاف.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى داخل `hooks.transformsDir` (تُرفض المسارات المطلقة والتنقل خارج المسار).
  - أبقِ `hooks.transformsDir` تحت `~/.openclaw/hooks/transforms`؛ تُرفض أدلة Skills في مساحة العمل. إذا أبلغ `openclaw doctor` عن هذا المسار على أنه غير صالح، فانقل وحدة التحويل إلى دليل تحويلات الخطافات أو أزل `hooks.transformsDir`.
- يوجّه `agentId` إلى وكيل محدد؛ تعود المعرّفات غير المعروفة إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد توجيه الوكيل الفعّال، بما في ذلك مسار الوكيل الافتراضي عند حذف `agentId` (`*` أو الحذف = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل الخطاف دون `sessionKey` صريح.
- `allowRequestSessionKey`: يسمح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية بالبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` بقالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ الافتراضي لـ `channel` هو `last`.
- يتجاوز `model` نموذج LLM لتشغيل هذا الخطاف (يجب أن يكون مسموحًا به إذا تم تعيين كتالوج النماذج).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المدمج `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت هذا التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` ليتطابق مع مساحة أسماء Gmail، مثل `["hook:", "hook:gmail:"]`.
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

- يبدأ Gateway تشغيل `gog gmail watch serve` تلقائيًا عند الإقلاع عندما يكون مهيأ. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلًا إلى جانب Gateway.

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

- يخدم HTML/CSS/JS القابلة للتحرير بواسطة الوكيل وA2UI عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الارتباطات غير loopback: تتطلب مسارات canvas مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل Node WebViews عادةً ترويسات المصادقة؛ بعد إقران عقدة واتصالها، يعلن Gateway عن عناوين URL لقدرات محددة النطاق للعقدة للوصول إلى canvas/A2UI.
- ترتبط عناوين URL للقدرات بجلسة WS النشطة للعقدة وتنتهي صلاحيتها بسرعة. لا يُستخدم الرجوع المستند إلى IP.
- يحقن عميل إعادة التحميل المباشر في HTML المخدوم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون فارغًا.
- يخدم أيضًا A2UI عند `/__openclaw__/a2ui/`.
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

- `minimal` (الافتراضي عند تمكين Plugin `bonjour` المدمج): احذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: ضمّن `cliPath` + `sshPort`؛ ما زال إعلان البث المتعدد على LAN يتطلب تمكين Plugin `bonjour` المدمج.
- `off`: امنع إعلان البث المتعدد على LAN دون تغيير تمكين Plugin.
- يبدأ Plugin `bonjour` المدمج تلقائيًا على مضيفي macOS وهو اختياري على Linux وWindows وعمليات نشر Gateway داخل الحاويات.
- يعود اسم المضيف افتراضيًا إلى اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### النطاق الواسع (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية البث ضمن `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، استخدمه مع خادم DNS (يوصى بـ CoreDNS) + Tailscale split DNS.

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
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` (ولا يتجاوز أي منهما المتغيرات الموجودة).
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

- لا تُطابق إلا الأسماء بالأحرف الكبيرة: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند تحميل الإعدادات.
- استخدم `$${VAR}` للهروب والحصول على `${VAR}` حرفيًا.
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
- معرف `source: "file"`: مؤشر JSON مطلق (مثل `"/providers/openai/apiKey"`)
- نمط معرف `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (يدعم محددات بنمط AWS مثل `secret#json_key`)
- يجب ألا تحتوي معرفات `source: "exec"` على مقاطع مسار مفصولة بشرطة مائلة هي `.` أو `..` (مثلًا يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القياسية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات الاعتماد المدعومة في `openclaw.json`.
- تُضمّن مراجع `auth-profiles.json` في حل وقت التشغيل وتغطية التدقيق.

### إعدادات مزودي الأسرار

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

- يدعم مزود `file` الوضعين `mode: "json"` و`mode: "singleValue"` (يجب أن يكون `id` هو `"value"` في وضع singleValue).
- تفشل مسارات مزودي file وexec بشكل مغلق عندما يتعذر التحقق من Windows ACL. عيّن `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب مزود `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيًا، تُرفض مسارات أوامر الروابط الرمزية. عيّن `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا تم تكوين `trustedDirs`، فسيُطبّق فحص الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة الابن في `exec` محدودة افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب اللقطة فقط.
- يُطبّق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح الممكّنة إلى فشل بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع رسائل تشخيصية.

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

- تُخزَّن ملفات التعريف لكل وكيل في `<agentDir>/auth-profiles.json`.
- يدعم `auth-profiles.json` مراجع على مستوى القيمة (`keyRef` لـ `api_key`، و`tokenRef` لـ `token`) لأوضاع بيانات الاعتماد الثابتة.
- خرائط `auth-profiles.json` المسطّحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست صيغة تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات تعريف مفاتيح API قياسية بصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- ملفات التعريف بوضع OAuth (`auth.profiles.<id>.mode = "oauth"`) لا تدعم بيانات اعتماد ملف تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات اعتماد التشغيل الثابتة من لقطات محلولة في الذاكرة؛ وتُزال إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- تُستورد OAuth القديمة من `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). قد تظل نصوص الفوترة الصريحة تقع هنا حتى في استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزوّد تبقى محصورة في المزوّد الذي يملكها (على سبيل المثال OpenRouter `Key limit exceeded`). تبقى رسائل HTTP `402` القابلة لإعادة المحاولة الخاصة بنافذة الاستخدام أو حد إنفاق المؤسسة/مساحة العمل في مسار `rate_limit` بدلاً من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات لنمو تراجع الفوترة الأسي (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدويرات ملف تعريف المصادقة ضمن المزوّد نفسه لأخطاء التحميل الزائد قبل التحول إلى احتياط النموذج (الافتراضي: `1`). تقع هنا أشكال انشغال المزوّد مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف محمّل زائدًا (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدويرات ملف تعريف المصادقة ضمن المزوّد نفسه لأخطاء حد المعدل قبل التحول إلى احتياط النموذج (الافتراضي: `1`). تتضمن حاوية حد المعدل هذه نصوصًا مصاغة من المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- `maxFileBytes`: الحد الأقصى لحجم ملف السجل النشط بالبايت قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 ميغابايت). يحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقّمة بجانب الملف النشط.
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونصوص محاضر الجلسات المحفوظة. يعطّل `redactSensitive: "off"` سياسة السجل/المحضر العامة هذه فقط؛ لا تزال أسطح أمان الواجهة/الأدوات/التشخيصات تحجب الأسرار قبل الإرسال.

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

- `enabled`: مفتاح التفعيل الرئيسي لمخرجات القياس (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات التي تفعّل مخرجات سجل مستهدفة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر عدم التقدم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل كـ `session.long_running` أو `session.stalled` أو `session.stuck`. تعيد الردود والأدوات والحالة والكتل وتقدم ACP ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت بلا تغيير.
- `stuckSessionAbortMs`: عتبة عمر عدم التقدم بالمللي ثانية قبل أن يصبح العمل النشط المتعثر المؤهل قابلاً للتصفية بالإيقاف من أجل الاسترداد. عند عدم ضبطها، يستخدم OpenClaw نافذة تشغيل مضمنة ممتدة أكثر أمانًا لا تقل عن 5 دقائق و3 أضعاف `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: يلتقط لقطة استقرار منقّحة قبل نفاد الذاكرة عندما يصل ضغط الذاكرة إلى `critical` (الافتراضي: `false`). اضبطه على `true` لإضافة فحص/كتابة ملف حزمة الاستقرار مع الإبقاء على أحداث ضغط الذاكرة العادية.
- `otel.enabled`: يفعّل خط أنابيب تصدير OpenTelemetry (الافتراضي: `false`). للاطلاع على التهيئة الكاملة، وكتالوج الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع لتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بالإشارة. عند ضبطها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبعات أو المقاييس أو السجلات.
- `otel.logsExporter`: وجهة تصدير السجل: `"otlp"` (الافتراضي)، أو `"stdout"` لكائن JSON واحد في كل سطر stdout، أو `"both"`.
- `otel.sampleRate`: معدل أخذ عينات التتبع `0`-`1`.
- `otel.flushIntervalMs`: الفاصل الدوري لتفريغ القياسات بالمللي ثانية.
- `otel.captureContent`: التقاط اختياري للمحتوى الخام لسمات مقاطع OTEL. يكون متوقفًا افتراضيًا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامي؛ ويتيح شكل الكائن تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` و`toolDefinitions` صراحة.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لأحدث شكل تجريبي لمقطع استدلال GenAI، بما في ذلك أسماء المقاطع `{gen_ai.operation.name} {gen_ai.request.model}`، ونوع المقطع `CLIENT`، و`gen_ai.provider.name` بدلاً من `gen_ai.system` القديم. افتراضيًا، تحتفظ المقاطع بـ `openclaw.model.call` و`gen_ai.system` للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفين الذين سجّلوا مسبقًا OpenTelemetry SDK عامًا. يتخطى OpenClaw عندها بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بالإشارة تُستخدم عندما لا يكون مفتاح التهيئة المطابق مضبوطًا.
- `cacheTrace.enabled`: تسجيل لقطات تتبع التخزين المؤقت للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار إخراج JSONL لتتبع التخزين المؤقت (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: التحكم فيما يُضمَّن في مخرجات تتبع التخزين المؤقت (كلها افتراضيًا: `true`).

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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ اضبط `false` لإخفاء إمكانات إرسال ACP والإنشاء).
- `dispatch.enabled`: بوابة مستقلة لإرسال دور جلسة ACP (الافتراضي: `true`). اضبط `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف واجهة تشغيل ACP الافتراضية (يجب أن يطابق Plugin تشغيل ACP مسجلاً).
  ثبّت Plugin الواجهة أولاً، وإذا كان `plugins.allow` مضبوطًا، فأدرج معرّف Plugin الواجهة (على سبيل المثال `acpx`) وإلا فلن تُحمّل واجهة ACP.
- `defaultAgent`: معرّف وكيل ACP الاحتياطي عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات تشغيل ACP؛ يعني الفراغ عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: كتم أسطر الحالة/الأداة المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: تبث `"live"` تدريجيًا؛ وتخزن `"final_only"` مؤقتًا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف لأسطر حالة/تحديث ACP المعروضة.
- `stream.tagVisibility`: سجل لأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعمال جلسات ACP قبل أن تصبح مؤهلة للتنظيف.
- `runtime.installCommand`: أمر تثبيت اختياري يُشغّل عند تمهيد بيئة تشغيل ACP.

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

- يتحكم `cli.banner.taglineMode` في نمط عبارة الشعار في اللافتة:
  - `"random"` (الافتراضي): عبارات شعار مضحكة/موسمية متناوبة.
  - `"default"`: عبارة شعار حيادية ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: لا يوجد نص لعبارة الشعار (يبقى عنوان/إصدار اللافتة ظاهرًا).
- لإخفاء اللافتة بالكامل (وليس عبارات الشعار فقط)، اضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات التعريف التي تكتبها تدفقات الإعداد الموجّهة في CLI (`onboard`، `configure`، `doctor`):

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

راجع حقول هوية `agents.list` ضمن [إعدادات الوكيل الافتراضية](/ar/gateway/config-agents#agent-defaults).

---

## الجسر (قديم، مُزال)

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل العُقد عبر Gateway WebSocket. لم تعد مفاتيح `bridge.*` جزءًا من مخطط الإعدادات (يفشل التحقق إلى أن تُزال؛ يمكن لـ `openclaw doctor --fix` حذف المفاتيح غير المعروفة).

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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل حذفها من `sessions.json`. يتحكم أيضًا في تنظيف النصوص المؤرشفة المحذوفة لـ Cron. الافتراضي: `24h`؛ اضبطه على `false` للتعطيل.
- `runLog.maxBytes`: مقبول للتوافق مع سجلات تشغيل Cron القديمة المدعومة بملفات. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث صفوف سجل التشغيل في SQLite المحتفَظ بها لكل مهمة. الافتراضي: `2000`.
- `webhookToken`: رمز bearer يُستخدم لتسليم طلبات POST الخاصة بـ Cron Webhook (`delivery.mode = "webhook"`)، وإذا حُذف فلن يُرسل ترويس تفويض.
- `webhook`: عنوان URL قديم ومهمل لـ Webhook احتياطي (http/https) يستخدمه `openclaw doctor --fix` لترحيل المهام المخزنة التي لا تزال تحتوي على `notify: true`؛ يستخدم التسليم وقت التشغيل `delivery.mode="webhook"` لكل مهمة مع `delivery.to`، أو `delivery.completionDestination` عند الحفاظ على تسليم الإعلان.

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

- `maxAttempts`: الحد الأقصى لإعادة محاولات مهام Cron عند الأخطاء العابرة (الافتراضي: `3`؛ النطاق: `0`-`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. احذفها لإعادة محاولة كل الأنواع العابرة.

تبقى المهام أحادية التنفيذ مفعّلة إلى أن تُستنفد محاولات الإعادة، ثم تُعطَّل مع الاحتفاظ بحالة الخطأ النهائية. تستخدم المهام المتكررة سياسة إعادة المحاولة نفسها للأخطاء العابرة لتعمل مرة أخرى بعد التراجع قبل موعدها المجدول التالي؛ أما الأخطاء الدائمة أو محاولات الإعادة العابرة المستنفدة فتعود إلى الجدول المتكرر العادي مع تراجع الخطأ.

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
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للمهمة نفسها (عدد صحيح غير سالب).
- `includeSkipped`: احتساب عمليات التشغيل المتخطاة المتتالية ضمن عتبة التنبيه (الافتراضي: `false`). تُتتبَّع عمليات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
- `mode`: وضع التسليم - يرسل `"announce"` عبر رسالة قناة؛ وينشر `"webhook"` إلى Webhook المُعدّ.
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
- `mode`:‏ `"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلان. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب لوضع Webhook.
- `accountId`: تجاوز حساب اختياري للتسليم.
- يتجاوز `delivery.failureDestination` لكل مهمة هذا الإعداد العام الافتراضي.
- عندما لا تكون وجهة فشل عامة أو لكل مهمة مضبوطة، تعود المهام التي تسلّم بالفعل عبر `announce` إلى هدف الإعلان الأساسي ذاك عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتتبَّع عمليات تنفيذ Cron المعزولة بوصفها [مهامًا في الخلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

عناصر نائب القالب الموسَّعة في `tools.media.models[].args`:

| المتغير            | الوصف                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (دون أغلفة السجل/المرسل)               |
| `{{BodyStripped}}` | النص مع إزالة إشارات المجموعة                    |
| `{{From}}`         | معرّف المرسل                                      |
| `{{To}}`           | معرّف الوجهة                                      |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID الجلسة الحالية                               |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                     |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                    |
| `{{MediaPath}}`    | مسار الوسائط المحلي                               |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)                   |
| `{{Transcript}}`   | نص تفريغ الصوت                                    |
| `{{Prompt}}`       | مطالبة الوسائط المحلولة لإدخالات CLI              |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI    |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)                |
| `{{SenderName}}`   | اسم عرض المرسل (بأفضل جهد)                       |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                      |
| `{{Provider}}`     | تلميح المزوّد (WhatsApp، Telegram، Discord، إلخ) |

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
- مصفوفة ملفات: تُدمج دمجًا عميقًا بالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (تتجاوز القيم المضمّنة).
- التضمينات المتداخلة: حتى عمق 10 مستويات.
- المسارات: تُحلّ نسبةً إلى الملف الذي يجري التضمين، لكن يجب أن تبقى داخل دليل الإعدادات الأعلى (`dirname` الخاص بـ `openclaw.json`). لا يُسمح بالصيغ المطلقة/`../` إلا عندما تظل تُحلّ داخل ذلك الحد. يجب ألا تحتوي المسارات على بايتات null ويجب أن تكون أقصر من 4096 حرفًا بصرامة قبل الحل وبعده.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى مدعومًا بتضمين ملف واحد تكتب مباشرةً إلى ذلك الملف المضمَّن. على سبيل المثال، يحدّث `plugins install`‏ `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط بالنسبة إلى عمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بإغلاق آمن بدلًا من تسطيح الإعدادات.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية، وتنسيق المسار غير الصالح، والطول المفرط.

---

_ذات صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذات صلة

- [الإعدادات](/ar/gateway/configuration)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
