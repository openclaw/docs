---
read_when:
    - تحتاج إلى دلالات التكوين أو الإعدادات الافتراضية الدقيقة على مستوى الحقول
    - أنت تتحقق من كتل تكوين القناة أو النموذج أو Gateway أو الأداة
summary: مرجع تكوين Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية والروابط إلى مراجع الأنظمة الفرعية المخصصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-06-27T17:35:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb8ebf55fe7562f00dbd42eb5fd00a7bac95ac934bdb0b778d04bb6926f28102
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع إعدادات النواة لـ `~/.openclaw/openclaw.json`. للاطلاع على نظرة عامة موجهة حسب المهام، راجع [الإعدادات](/ar/gateway/configuration).

يغطي أسطح إعدادات OpenClaw الرئيسية، ويربط بمراجع أخرى عندما يكون لنظام فرعي مرجع أعمق خاص به. تعيش فهارس أوامر القنوات والمملوكة لـ plugin ومفاتيح الذاكرة العميقة/QMD في صفحاتها الخاصة بدلا من هذه الصفحة.

مصدر الحقيقة في الكود:

- يطبع `openclaw config schema` مخطط JSON الحي المستخدم للتحقق وControl UI، مع دمج بيانات metadata للحزم/plugin/القنوات عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة بنطاق المسار لأدوات التنقل التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس وثائق الإعدادات مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` المسمى `config.schema.lookup` للحصول على وثائق وقيود دقيقة على مستوى الحقول قبل التعديلات. استخدم [الإعدادات](/ar/gateway/configuration) للإرشاد الموجه حسب المهام، وهذه الصفحة لخريطة الحقول الأوسع، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع إعدادات الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر slash](/ar/tools/slash-commands) لفهرس الأوامر المدمجة + المحزمة الحالي
- صفحات القنوات/plugin المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق الإعدادات هو **JSON5** (يسمح بالتعليقات والفواصل اللاحقة). كل الحقول اختيارية - يستخدم OpenClaw قيما افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح الإعدادات لكل قناة إلى صفحة مخصصة - راجع
[الإعدادات - القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage والقنوات
المحزمة الأخرى (المصادقة، التحكم في الوصول، الحسابات المتعددة، حراسة الإشارات).

## افتراضيات الوكيل، وتعدد الوكلاء، والجلسات، والرسائل

انتقلت إلى صفحة مخصصة - راجع
[الإعدادات - الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، Heartbeat، الذاكرة، الوسائط، Skills، sandbox)
- `multiAgent.*` (توجيه تعدد الوكلاء والربط)
- `session.*` (دورة حياة الجلسة، Compaction، التقليم)
- `messages.*` (تسليم الرسائل، TTS، عرض markdown)
- `talk.*` (وضع Talk)
  - `talk.consultThinkingLevel`: تجاوز مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استشارات Control UI Talk الفورية
  - `talk.consultFastMode`: تجاوز وضع السرعة لمرة واحدة لاستشارات Control UI Talk الفورية
  - `talk.speechLocale`: معرف locale اختياري وفق BCP 47 للتعرف على كلام Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم تعيينه، يحافظ Talk على نافذة التوقف الافتراضية للمنصة قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: بديل ترحيل Gateway لنصوص Talk الفورية النهائية التي تتخطى `openclaw_agent_consult`

## الأدوات والمزودون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وإعدادات الأدوات المدعومة بمزود، وإعداد المزود المخصص / عنوان URL الأساسي إلى صفحة مخصصة - راجع
[الإعدادات - الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

تعيش تعريفات المزودين، وقوائم السماح للنماذج، وإعداد المزودين المخصصين في
[الإعدادات - الأدوات والمزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
يمتلك جذر `models` أيضا سلوك فهرس النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك فهرس المزودين (`merge` أو `replace`).
- `models.providers`: خريطة مزودين مخصصين مفهرسة بمعرف المزود.
- `models.providers.*.localService`: مدير عمليات اختياري عند الطلب لخوادم النماذج المحلية. يفحص OpenClaw نقطة صحة النهاية المضبوطة، ويبدأ `command` المطلق عند الحاجة، وينتظر الجاهزية، ثم يرسل طلب النموذج. راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- `models.pricing.enabled`: يتحكم في تمهيد التسعير الخلفي الذي يبدأ بعد أن تصل sidecars والقنوات إلى مسار جاهزية Gateway. عندما يكون `false`، يتخطى Gateway جلب فهارس تسعير OpenRouter وLiteLLM؛ وتبقى قيم `models.providers.*.models[].cost` المضبوطة عاملة لتقديرات التكلفة المحلية.

## MCP

تعيش تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` وتستهلكها OpenClaw المضمنة ومحوّلات وقت التشغيل الأخرى. تدير أوامر `openclaw mcp list` و`show` و`set` و`unset` هذه الكتلة من دون الاتصال بالخادم الهدف أثناء تعديلات الإعدادات.

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

- `mcp.servers`: تعريفات خوادم MCP مسماة من نوع stdio أو بعيدة لأوقات التشغيل التي تعرض أدوات MCP المضبوطة. تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛ ويعد `type: "http"` اسما بديلا أصليا للـ CLI يطبعه `openclaw mcp set` و`openclaw doctor --fix` في حقل `transport` القياسي.
- `mcp.servers.<name>.enabled`: اضبطه على `false` للاحتفاظ بتعريف خادم محفوظ مع استبعاده من اكتشاف MCP المضمن في OpenClaw وإسقاط الأدوات.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: مهلة طلب MCP لكل خادم بالثواني أو بالمللي ثانية.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: مهلة الاتصال لكل خادم بالثواني أو بالمللي ثانية.
- `mcp.servers.<name>.supportsParallelToolCalls`: تلميح تزامن اختياري للمحوّلات التي يمكنها اختيار ما إذا كانت ستصدر استدعاءات أدوات MCP متوازية.
- `mcp.servers.<name>.auth`: اضبطه على `"oauth"` لخوادم HTTP MCP التي تتطلب OAuth. شغّل `openclaw mcp login <name>` لتخزين الرموز ضمن حالة OpenClaw.
- `mcp.servers.<name>.oauth`: تجاوزات اختيارية للنطاق OAuth، وعنوان URL لإعادة التوجيه، وعنوان URL لبيانات metadata الخاصة بالعميل.
- `mcp.servers.<name>.sslVerify` و`clientCert` و`clientKey`: عناصر تحكم HTTP TLS لنقاط النهاية الخاصة وTLS المتبادل.
- `mcp.servers.<name>.toolFilter`: اختيار أدوات اختياري لكل خادم. يحد `include` أدوات MCP المكتشفة إلى الأسماء المطابقة؛ ويخفي `exclude` الأسماء المطابقة. الإدخالات هي أسماء أدوات MCP دقيقة أو globs بسيطة باستخدام `*`. تولد الخوادم التي تحتوي على موارد أو مطالبات أيضا أسماء أدوات مساعدة (`resources_list` و`resources_read` و`prompts_list` و`prompts_get`)، وتستخدم تلك الأسماء المرشح نفسه.
- `mcp.servers.<name>.codex`: عناصر تحكم اختيارية في إسقاط خادم تطبيق Codex. هذه الكتلة هي metadata خاصة بـ OpenClaw لخيوط خادم تطبيق Codex فقط؛ ولا تؤثر في جلسات ACP، أو إعدادات حزمة Codex العامة، أو محوّلات وقت التشغيل الأخرى. يحد `codex.agents` غير الفارغ الخادم إلى معرفات وكلاء OpenClaw المدرجة. ترفض عملية التحقق من الإعدادات قوائم الوكلاء المحددة النطاق الفارغة أو الخالية أو غير الصالحة، ويحذفها مسار إسقاط وقت التشغيل بدلا من أن تصبح عامة. يصدر `codex.defaultToolsApprovalMode` القيمة الأصلية لـ Codex وهي `default_tools_approval_mode` لذلك الخادم. يزيل OpenClaw كتلة `codex` قبل تمرير إعدادات `mcp_servers` الأصلية إلى Codex. احذف الكتلة لإبقاء الخادم مسقطا لكل وكيل خادم تطبيق Codex مع سلوك موافقة MCP الافتراضي في Codex.
- `mcp.sessionIdleTtlMs`: TTL الخمول لأوقات تشغيل MCP المحزمة والمحددة بنطاق الجلسة. تطلب التشغيلات المضمنة لمرة واحدة تنظيف نهاية التشغيل؛ هذا TTL هو الحاجز الخلفي للجلسات طويلة العمر والمستدعين المستقبليين.
- تطبق التغييرات ضمن `mcp.*` فوريا عبر التخلص من أوقات تشغيل MCP المخزنة مؤقتا للجلسة. تعيد عملية اكتشاف/استخدام الأداة التالية إنشاءها من الإعدادات الجديدة، لذلك تزال إدخالات `mcp.servers` المحذوفة فورا بدلا من انتظار TTL الخمول.
- يراعي اكتشاف وقت التشغيل أيضا إشعارات تغيّر قائمة أدوات MCP عبر إسقاط الفهرس المخزن مؤقتا لتلك الجلسة. تحصل الخوادم التي تعلن عن موارد أو مطالبات على أدوات مساعدة لسرد/قراءة الموارد وسرد/جلب المطالبات. توقف إخفاقات استدعاء الأداة المتكررة الخادم المتأثر مؤقتا قبل محاولة استدعاء أخرى.

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

- `allowBundled`: قائمة سماح اختيارية لـ Skills المحزمة فقط (لا تتأثر Skills المدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (الأولوية الأدنى).
- `load.allowSymlinkTargets`: جذور أهداف حقيقية موثوقة يمكن لروابط Skills الرمزية أن تشير إليها عندما يعيش الرابط خارج جذر المصدر المضبوط له.
- `workshop.allowSymlinkTargetWrites`: يسمح لتطبيق Skill Workshop بالكتابة عبر أهداف الروابط الرمزية الموثوقة مسبقا (الافتراضي: false).
- `install.preferBrew`: عند true، يفضل مثبتات Homebrew عندما يكون `brew` متاحا قبل الرجوع إلى أنواع مثبتات أخرى.
- `install.nodeManager`: تفضيل مثبت node لمواصفات `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: يسمح لعملاء Gateway الموثوقين من نوع `operator.admin` بتثبيت أرشيفات zip خاصة مجهزة عبر `skills.upload.*` (الافتراضي: false). هذا يمكّن مسار الأرشيف المرفوع فقط؛ ولا تتطلب تثبيتات ClawHub العادية ذلك.
- `entries.<skillKey>.enabled: false` يعطل Skill حتى إذا كانت محزمة/مثبتة.
- `entries.<skillKey>.apiKey`: اختصار ملائم لـ Skills التي تعلن عن متغير بيئة أساسي (سلسلة نص عادي أو كائن SecretRef).

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

- تُحمَّل من أدلة الحزم أو الحِزم المجمّعة ضمن `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، إضافةً إلى الملفات أو الأدلة المدرجة في `plugins.load.paths`.
- ضع ملفات Plugin المستقلة في `plugins.load.paths`؛ تتجاهل جذور الإضافات المكتشفة تلقائيًا ملفات `.js` و`.mjs` و`.ts` في المستوى الأعلى حتى لا تمنع سكربتات المساعدة في تلك الجذور بدء التشغيل.
- يقبل الاكتشاف Plugins OpenClaw الأصلية، إضافةً إلى حِزم Codex المتوافقة وحِزم Claude، بما في ذلك حِزم Claude ذات التخطيط الافتراضي من دون ملف manifest.
- **تتطلب تغييرات الإعدادات إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (لا تُحمَّل إلا Plugins المدرجة). يتغلّب `deny`.
- `plugins.entries.<id>.apiKey`: حقل ملاءمة لمفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة ضمن نطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يحظر النواة `before_prompt_build` ويتجاهل الحقول التي تعدّل الموجه من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق على خطافات Plugin الأصلية وأدلة الخطافات المقدمة من الحِزم المدعومة.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن لـ Plugins الموثوقة غير المجمّعة قراءة محتوى المحادثة الخام من الخطافات المهيكلة مثل `llm_input` و`llm_output` و`before_model_resolve` و`before_agent_reply` و`before_agent_run` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: يثق صراحةً بهذا Plugin لطلب تجاوزات `provider` و`model` لكل تشغيل في تشغيلات الوكيل الفرعي بالخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات الوكيل الفرعي الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowModelOverride`: يثق صراحةً بهذا Plugin لطلب تجاوزات النموذج من أجل `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القياسية لتجاوزات إكمال LLM الموثوقة في Plugin. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: يثق صراحةً بهذا Plugin لتشغيل `api.runtime.llm.complete` مقابل معرّف وكيل غير افتراضي.
- `plugins.entries.<id>.config`: كائن إعدادات معرّف من Plugin (تتحقق منه مخططات Plugin الأصلية في OpenClaw عند توفرها).
- توجد إعدادات حساب/تشغيل Plugin القناة ضمن `channels.<id>`، وينبغي أن تصفها بيانات `channelConfigs` الوصفية في manifest الخاصة بـ Plugin المالك، لا سجل خيارات OpenClaw مركزي.

### إعدادات Plugin لحزمة تشغيل Codex

يمتلك Plugin المجمّع `codex` إعدادات حزمة تشغيل خادم تطبيق Codex الأصلية ضمن
`plugins.entries.codex.config`. راجع
[مرجع حزمة تشغيل Codex](/ar/plugins/codex-harness-reference) للاطلاع على سطح الإعدادات الكامل
و[حزمة تشغيل Codex](/ar/plugins/codex-harness) لنموذج وقت التشغيل.

ينطبق `codexPlugins` فقط على الجلسات التي تختار حزمة تشغيل Codex الأصلية.
ولا يفعّل Codex Plugins لتشغيلات موفر OpenClaw، أو روابط محادثات ACP،
أو أي حزمة تشغيل غير Codex.

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
  Plugin/التطبيق الأصلي لحزمة تشغيل Codex. الافتراضي: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سياسة الإجراءات التدميرية الافتراضية لاستدعاءات تطبيق Plugin المرحّلة.
  استخدم `true` لقبول مخططات موافقة Codex الآمنة من دون طلب تأكيد، و`false`
  لرفضها، و`"auto"` لتوجيه الموافقات التي يتطلبها Codex عبر موافقات
  OpenClaw Plugin، أو `"always"` لطلب الموافقة على كل إجراء كتابة/تدميري في Plugin
  من دون موافقة دائمة. يمسح وضع `"always"` تجاوزات موافقة Codex الدائمة
  لكل أداة للتطبيق المتأثر قبل بدء سلسلة المحادثة.
  الافتراضي: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: يفعّل إدخال
  Plugin مرحّلًا عندما يكون `codexPlugins.enabled` العام مفعّلًا أيضًا.
  الافتراضي: `true` للإدخالات الصريحة.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هوية السوق المستقرة. يدعم V1 فقط `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هوية
  Codex Plugin مستقرة من الترحيل، مثل `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  تجاوز الإجراءات التدميرية لكل Plugin. عند حذفه، تُستخدم قيمة
  `allow_destructive_actions` العامة. تقبل قيمة كل Plugin السياسات نفسها:
  `true` أو `false` أو `"auto"` أو `"always"`.

`codexPlugins.enabled` هو توجيه التفعيل العام. إدخالات Plugin الصريحة
التي يكتبها الترحيل هي مجموعة التثبيت الدائم وأهلية الإصلاح.
`plugins["*"]` غير مدعوم، ولا يوجد مفتاح `install`، وقيم
`marketplacePath` المحلية ليست حقول إعدادات عمدًا لأنها خاصة بالمضيف.

تُخزَّن فحوصات جاهزية `app/list` مؤقتًا لمدة ساعة واحدة وتُحدَّث
بشكل غير متزامن عند تقادمها. تُحسب إعدادات تطبيق سلسلة Codex عند إنشاء
جلسة حزمة تشغيل Codex، وليس في كل دورة؛ استخدم `/new` أو `/reset` أو إعادة تشغيل
Gateway بعد تغيير إعدادات Plugin الأصلية.

- `plugins.entries.firecrawl.config.webFetch`: إعدادات موفر جلب الويب Firecrawl.
  - `apiKey`: مفتاح API اختياري لـ Firecrawl لحدود أعلى (يقبل SecretRef). يرجع إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ Firecrawl API (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخراج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: الحد الأقصى لعمر التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الاستخراج بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث Grok على الويب).
  - `enabled`: تفعيل موفر X Search.
  - `model`: نموذج Grok المستخدم للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للاطلاع على المراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل مسح Dreaming كامل (`"0 3 * * *"` افتراضيًا).
  - `model`: تجاوز اختياري لنموذج الوكيل الفرعي لمفكرة الأحلام. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ استخدمه مع `allowedModels` لتقييد الأهداف. تُعاد محاولة أخطاء عدم توفر النموذج مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ أما إخفاقات الثقة أو قائمة السماح فلا تعود صامتةً إلى قيمة بديلة.
  - سياسة المراحل والعتبات تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـ Plugins حِزم Claude المفعّلة أيضًا المساهمة بإعدادات OpenClaw افتراضية مضمّنة من `settings.json`؛ يطبق OpenClaw هذه الإعدادات كإعدادات وكيل منقّحة، لا كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ تكون القيمة الافتراضية `"legacy"` ما لم تثبّت محركًا آخر وتختاره.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يستطيع OpenClaw اكتشاف طلبات الاطمئنان من أدوار المحادثة وتسليمها عبر تشغيلات Heartbeat.

- `commitments.enabled`: تفعيل استخراج LLM المخفي والتخزين وتسليم Heartbeat للالتزامات المتابعة المستنتجة. الافتراضي: `false`.
- `commitments.maxPerDay`: الحد الأقصى للالتزامات المتابعة المستنتجة التي تُسلَّم لكل جلسة وكيل خلال يوم متحرك. الافتراضي: `3`.

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
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتعقّبة بعد وقت الخمول أو عندما
  تتجاوز جلسة حدّها الأقصى. اضبط `idleMinutes: 0` أو `maxTabsPerSession: 0` من أجل
  تعطيل أوضاع التنظيف الفردية هذه.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا عند عدم ضبطه، لذلك يبقى تنقّل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا بتنقّل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) لنفس حظر الشبكة الخاصة أثناء فحوصات قابلية الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصّصة للإرفاق فقط (تعطيل البدء/الإيقاف/إعادة التعيين).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك موفّر الخدمة بعنوان URL مباشر لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية وصول CDP البعيد
  و`attachOnly` إضافةً إلى طلبات فتح علامات التبويب. تحتفظ ملفات تعريف loopback المُدارة
  بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP مُدارة خارجيًا ويمكن الوصول إليها عبر loopback، فاضبط
  `attachOnly: true` لذلك الملف الشخصي؛ وإلا سيعامل OpenClaw منفذ loopback كملف تعريف
  متصفح مُدار محليًا وقد يبلّغ عن أخطاء ملكية منفذ محلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلًا من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف متصفح
  محدد مبني على Chromium مثل Brave أو Edge.
- يمكن لملفات تعريف `existing-session` ضبط `cdpUrl` عندما يكون Chrome قيد التشغيل مسبقًا
  خلف نقطة نهاية اكتشاف HTTP(S) لـ DevTools أو نقطة نهاية WS(S) مباشرة. في ذلك
  الوضع يمرّر OpenClaw نقطة النهاية إلى Chrome MCP بدلًا من استخدام الاتصال التلقائي؛
  ويتم تجاهل `userDataDir` في وسائط تشغيل Chrome MCP.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات تعتمد على اللقطة/المرجع بدلًا من استهداف محددات CSS، وخطافات رفع ملف واحد،
  ولا توجد تجاوزات لمهلة الحوارات، ولا `wait --load networkidle`، ولا
  `responsebody`، أو تصدير PDF، أو اعتراض التنزيلات، أو الإجراءات الدفعية.
- تضبط ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائيًا؛ اضبط
  `cdpUrl` صراحةً فقط لملفات تعريف CDP البعيدة أو إرفاق نقطة نهاية existing-session.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف الشخصي. استخدم هذا لتشغيل ملف تعريف في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية، وتستخدم `browser.localCdpReadyTimeoutMs` لجاهزية websocket الخاصة بـ CDP
  بعد التشغيل. ارفع هذه القيم على المضيفات الأبطأ حيث يبدأ Chrome بنجاح لكن فحوصات
  الجاهزية تتسابق مع بدء التشغيل. يجب أن تكون القيمتان عددين صحيحين موجبين حتى
  `120000` مللي ثانية؛ ويتم رفض قيم الإعداد غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان مبنيًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  القيمتين `~` و`~/...` لدليل المنزل في نظام التشغيل قبل تشغيل Chromium.
  كما يتم توسيع علامة التلدة في `userDataDir` لكل ملف تعريف ضمن ملفات تعريف `existing-session`.
- خدمة التحكم: loopback فقط (يُشتق المنفذ من `gateway.port`، والافتراضي `18791`).
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

- `seamColor`: لون تمييز لواجهة تطبيق النظام الأصلية (تلوين فقاعة وضع التحدث، وما إلى ذلك).
- `assistant`: تجاوز هوية واجهة التحكم. تعود إلى هوية الوكيل النشط عند عدم ضبطها.

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

- `mode`: `local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway البدء إلا إذا كان `local`.
- `port`: منفذ واحد متعدد الاستخدامات لـ WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، أو `loopback` (الافتراضي)، أو `lan` (`0.0.0.0`)، أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط)، أو `custom`.
- **أسماء bind القديمة البديلة**: استخدم قيم وضع bind في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء المضيف البديلة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. مع شبكة Docker الجسرية (`-p 18789:18789`)، تصل حركة المرور على `eth0`، لذلك لا يمكن الوصول إلى Gateway. استخدم `--network host`، أو عيّن `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على جميع الواجهات.
- **المصادقة**: مطلوبة افتراضيًا. تتطلب عمليات bind غير `loopback` مصادقة Gateway. عمليًا، يعني ذلك رمزًا/كلمة مرور مشتركة أو وكيلاً عكسيًا مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد الأولي رمزًا افتراضيًا.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين (بما في ذلك SecretRefs)، فعيّن `gateway.auth.mode` صراحةً إلى `token` أو `password`. تفشل تدفقات البدء وتثبيت/إصلاح الخدمة عندما يكون كلاهما مهيأين ويكون mode غير معيّن.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback الموثوقة؛ ولا يُعرض هذا عمدًا ضمن مطالبات الإعداد الأولي.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي مدرك للهوية وثق بترويسات الهوية من `gateway.trustedProxies` (انظر [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع مصدر وكيل **غير loopback** افتراضيًا؛ وتتطلب الوكلاء العكسيون عبر `loopback` على المضيف نفسه تعيين `gateway.auth.trustedProxy.allowLoopback = true` صراحةً. يمكن للمتصلين الداخليين على المضيف نفسه استخدام `gateway.auth.password` كخيار احتياطي محلي مباشر؛ ويظل `gateway.auth.token` متنافيًا مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عند `true`، يمكن لترويسات هوية Tailscale Serve تلبية مصادقة Control UI/WebSocket (مع التحقق عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale هذه؛ بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway بدلًا من ذلك. يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. القيمة الافتراضية هي `true` عندما يكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات المصادقة الفاشلة. يطبق لكل عنوان IP عميل ولكل نطاق مصادقة (يُتتبع shared-secret وdevice-token بشكل مستقل). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - في مسار Tailscale Serve Control UI غير المتزامن، تُسلسل المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تشغّل المحدد عند الطلب الثاني بدلًا من أن يمر كلاهما كعدم تطابق عادي.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ عيّنها إلى `false` عندما تريد عمدًا إخضاع حركة مرور localhost للتحديد أيضًا (لإعدادات الاختبار أو عمليات نشر الوكيل الصارمة).
- تُخنق محاولات مصادقة WS ذات أصل المتصفح دائمًا مع تعطيل إعفاء loopback (دفاع متعدد الطبقات ضد التخمين القسري على localhost من المتصفح).
- على loopback، تُعزل عمليات القفل ذات أصل المتصفح هذه لكل قيمة `Origin`
  مطبّعة، لذلك لا تؤدي الإخفاقات المتكررة من أصل localhost واحد تلقائيًا
  إلى قفل أصل مختلف.
- `tailscale.mode`: `serve` (tailnet فقط، bind عبر loopback) أو `funnel` (عام، يتطلب مصادقة).
- `tailscale.serviceName`: اسم Tailscale Service اختياري لوضع Serve، مثل
  `svc:openclaw`. عند تعيينه، يمرره OpenClaw إلى `tailscale serve
--service` حتى يمكن كشف Control UI عبر Service مسماة بدلًا
  من اسم مضيف الجهاز. يجب أن تستخدم القيمة صيغة اسم Service في Tailscale وهي `svc:<dns-label>`؛ ويبلغ البدء عن عنوان URL الخاص بـ Service المشتق.
- `tailscale.preserveFunnel`: عند `true` و`tailscale.mode = "serve"`، يتحقق OpenClaw
  من `tailscale funnel status` قبل إعادة تطبيق Serve عند البدء ويتخطاه
  إذا كان مسار Funnel مهيأ خارجيًا يغطي منفذ Gateway بالفعل.
  القيمة الافتراضية `false`.
- `controlUi.allowedOrigins`: قائمة سماح صريحة لأصول المتصفح لاتصالات Gateway WebSocket. مطلوبة لأصول المتصفح العامة غير loopback. تُقبل تحميلات UI الخاصة بـ LAN/Tailnet الخاصة من نفس الأصل من مضيفات loopback أو RFC1918/link-local أو `.local` أو `.ts.net` أو Tailscale CGNAT دون تمكين خيار Host-header fallback.
- `controlUi.chatMessageMaxWidth`: حد أقصى اختياري للعرض لرسائل دردشة Control UI المجمّعة. يقبل قيم عرض CSS مقيدة مثل `960px` و`82%` و`min(1280px, 82%)` و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطر يمكّن Host-header origin fallback لعمليات النشر التي تعتمد عمدًا على سياسة أصل Host-header.
- `remote.transport`: `ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن يكون `remote.url` هو `wss://` للمضيفات العامة؛ ولا يُقبل النص الصريح `ws://` إلا لـ loopback وLAN وlink-local و`.local` و`.ts.net` ومضيفات Tailscale CGNAT.
- `remote.remotePort`: منفذ Gateway على مضيف SSH البعيد. القيمة الافتراضية `18789`؛ استخدم هذا عندما يختلف منفذ النفق المحلي عن منفذ Gateway البعيد.
- `gateway.remote.token` / `.password` هي حقول اعتماد للعميل البعيد. وهي لا تهيئ مصادقة Gateway بمفردها.
- `gateway.push.apns.relay.baseUrl`: عنوان URL أساسي عبر HTTPS للمرحل الخارجي APNs المستخدم بعد أن تنشر إصدارات iOS المدعومة بالمرحل التسجيلات إلى Gateway. تستخدم إصدارات App Store/TestFlight العامة مرحل OpenClaw المستضاف. يجب أن تتطابق عناوين URL للمرحل المخصص مع مسار بناء/نشر iOS منفصل عمدًا يشير عنوان URL للمرحل فيه إلى ذلك المرحل.
- `gateway.push.apns.relay.timeoutMs`: مهلة الإرسال من Gateway إلى المرحل بالمللي ثانية. القيمة الافتراضية `10000`.
- تُفوّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويضمّن تلك الهوية في تسجيل المرحل، ويمرر إلى Gateway منحة إرسال محددة النطاق بالتسجيل. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات env مؤقتة لتهيئة المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ خروج مخصص للتطوير فقط لعناوين URL الخاصة بمرحل HTTP عبر loopback. يجب أن تبقى عناوين URL لمرحل الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة Gateway WebSocket قبل المصادقة بالمللي ثانية. الافتراضي: `15000`. يأخذ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأولوية عند تعيينه. زد هذه القيمة على المضيفات المحمّلة أو منخفضة القدرة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: فاصل مراقبة صحة القناة بالدقائق. عيّن `0` لتعطيل إعادات تشغيل مراقب الصحة عالميًا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: عتبة المقبس المتقادم بالدقائق. أبقِ هذه القيمة أكبر من أو تساوي `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لإعادات تشغيل مراقب الصحة لكل قناة/حساب في ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لإعادات تشغيل مراقب الصحة مع إبقاء المراقب العام ممكّنًا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند تعيينه، يأخذ الأولوية على تجاوز مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما يكون `gateway.auth.*` غير معيّن.
- إذا كان `gateway.auth.token` / `gateway.auth.password` مهيأ صراحةً عبر SecretRef وغير محلول، يفشل الحل بطريقة مغلقة (دون إخفاء ذلك بخيار احتياطي بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين التي تنهي TLS أو تحقن ترويسات العميل المعاد توجيهه. أدرج فقط الوكلاء الذين تتحكم بهم. تظل إدخالات loopback صالحة لإعدادات الوكيل على المضيف نفسه/الكشف المحلي (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عند `true`، يقبل Gateway `X-Real-IP` إذا كان `X-Forwarded-For` مفقودًا. الافتراضي `false` لسلوك يفشل بطريقة مغلقة.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح CIDR/IP اختيارية للموافقة التلقائية على إقران جهاز عقدة لأول مرة دون نطاقات مطلوبة. تكون معطلة عندما لا تُعيّن. لا يوافق هذا تلقائيًا على إقران المشغّل/المتصفح/Control UI/WebChat، ولا يوافق تلقائيًا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/رفض عام لأوامر العقد المعلنة بعد الإقران وتقييم قائمة سماح المنصة. استخدم `allowCommands` للاشتراك في أوامر العقد الخطرة مثل `camera.snap` و`camera.clip` و`screen.record`؛ ويزيل `denyCommands` أمرًا حتى لو كان افتراض المنصة أو السماح الصريح سيُدرجه بخلاف ذلك. بعد أن تغيّر عقدة قائمة أوامرها المعلنة، ارفض وأعد الموافقة على إقران ذلك الجهاز حتى يخزن Gateway لقطة الأوامر المحدّثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (توسّع قائمة الرفض الافتراضية).
- `gateway.tools.allow`: أزِل أسماء الأدوات من قائمة رفض HTTP الافتراضية
  للمتصلين المالكين/المسؤولين. لا يرقّي هذا المتصلين الحاملين للهوية `operator.write`
  إلى وصول مالك/مسؤول؛ وتظل `cron` و`gateway` و`nodes`
  غير متاحة للمتصلين غير المالكين حتى عند إدراجها في قائمة السماح.

</Accordion>

### نقاط النهاية المتوافقة مع OpenAI

- Admin HTTP RPC: معطلة افتراضيًا باعتبارها Plugin `admin-http-rpc`. فعّل Plugin لتسجيل `POST /api/v1/admin/rpc`. انظر [Admin HTTP RPC](/ar/plugins/admin-http-rpc).
- Chat Completions: معطلة افتراضيًا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة كأنها غير معيّنة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة تقوية اختيارية للاستجابة:
  - `gateway.http.securityHeaders.strictTransportSecurity` (عيّنها فقط لأصول HTTPS التي تتحكم بها؛ انظر [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل المثيلات المتعددة

شغّل عدة Gateways على مضيف واحد مع منافذ ومجلدات حالة فريدة:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

أعلام تسهيلية: `--dev` (يستخدم `~/.openclaw-dev` + المنفذ `19001`)، و`--profile <name>` (يستخدم `~/.openclaw-<name>`).

انظر [عدة Gateways](/ar/gateway/multiple-gateways).

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
- `autoGenerate`: ينشئ تلقائيًا زوج شهادة/مفتاح محليًا وموقّعًا ذاتيًا عندما لا تكون الملفات الصريحة مهيأة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف مفتاح TLS الخاص؛ أبقه مقيّد الأذونات.
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

- `mode`: يتحكم في كيفية تطبيق تعديلات الإعدادات أثناء التشغيل.
  - `"off"`: تجاهل التعديلات الحية؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية دون إعادة تشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخنة أولًا؛ وارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة إزالة الارتداد بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: أقصى مدة اختيارية بالمللي ثانية للانتظار حتى تكتمل العمليات الجارية قبل فرض إعادة تشغيل أو إعادة تحميل ساخنة للقناة. احذفها لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ اضبطها على `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية عن العمليات التي ما زالت معلقة.

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
يتم رفض رموز الخطافات في سلسلة الاستعلام.

ملاحظات التحقق والسلامة:

- يتطلب `hooks.enabled=true` قيمة غير فارغة في `hooks.token`.
- يجب أن يكون `hooks.token` مختلفًا عن مصادقة السر المشترك النشطة في Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)؛ تسجل عملية بدء التشغيل تحذيرًا أمنيًا غير فادح عند اكتشاف إعادة الاستخدام.
- يضع `openclaw security audit` علامة على إعادة استخدام مصادقة الخطاف/Gateway كاكتشاف حرج، بما في ذلك مصادقة كلمة مرور Gateway المقدمة وقت التدقيق فقط (`--auth password --password <password>`). شغّل `openclaw doctor --fix` لتدوير `hooks.token` مُعاد الاستخدام والمحفوظ، ثم حدّث مرسلي الخطافات الخارجيين لاستخدام رمز الخطاف الجديد.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (مثلًا `["hook:"]`).
- إذا كان أي تعيين أو إعداد مسبق يستخدم `sessionKey` بقالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك الصريح.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يتم قبول `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يتم حله عبر `hooks.mappings`
  - تُعامل قيم `sessionKey` في التعيين المعروضة من القوالب كقيم مقدمة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقل حمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تعيد إجراء خطاف.
  - يجب أن يكون `transform.module` مسارًا نسبيًا وأن يبقى داخل `hooks.transformsDir` (يتم رفض المسارات المطلقة والتنقل عبر المسارات).
  - أبقِ `hooks.transformsDir` تحت `~/.openclaw/hooks/transforms`؛ يتم رفض أدلة Skills الخاصة بمساحة العمل. إذا أبلغ `openclaw doctor` عن أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات الخطافات أو أزل `hooks.transformsDir`.
- يوجّه `agentId` إلى وكيل محدد؛ تعود المعرّفات غير المعروفة إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد توجيه الوكيل الفعّال، بما في ذلك مسار الوكيل الافتراضي عند حذف `agentId` (`*` أو الحذف = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل الخطاف دون `sessionKey` صريح.
- `allowRequestSessionKey`: يسمح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بضبط `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية بالبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` بقالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ تكون قيمة `channel` الافتراضية `last`.
- يتجاوز `model` نموذج LLM لتشغيل الخطاف هذا (يجب أن يكون مسموحًا به إذا تم ضبط كتالوج النماذج).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المدمج `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت توجيه كل رسالة على حدة هذا، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لمطابقة مساحة أسماء Gmail، مثلًا `["hook:", "hook:gmail:"]`.
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

- يبدأ Gateway تلقائيًا تشغيل `gog gmail watch serve` عند الإقلاع عندما يكون مضبوطًا. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلًا إلى جانب Gateway.

---

## مضيف Canvas Plugin

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

- يقدّم HTML/CSS/JS وA2UI قابلة للتحرير بواسطة الوكيل عبر HTTP ضمن منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- الارتباطات غير loopback: تتطلب مسارات canvas مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل Node WebViews عادةً ترويسات المصادقة؛ بعد إقران node واتصاله، يعلن Gateway عن عناوين URL لقدرات محددة النطاق بـ node للوصول إلى canvas/A2UI.
- ترتبط عناوين URL للقدرات بجلسة WS النشطة الخاصة بـ node وتنتهي صلاحيتها بسرعة. لا يُستخدم احتياطي قائم على IP.
- يحقن عميل إعادة التحميل الحية في HTML المقدّم.
- ينشئ تلقائيًا ملف `index.html` ابتدائيًا عندما يكون فارغًا.
- يقدّم A2UI أيضًا عند `/__openclaw__/a2ui/`.
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

- `minimal` (الافتراضي عندما يكون Plugin `bonjour` المدمج مفعّلًا): احذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: تضمين `cliPath` + `sshPort`؛ لا يزال إعلان البث المتعدد على LAN يتطلب تفعيل Plugin `bonjour` المدمج.
- `off`: يكبت إعلان البث المتعدد على LAN دون تغيير تفعيل Plugin.
- يبدأ Plugin `bonjour` المدمج تلقائيًا على مضيفي macOS ويكون اشتراكًا اختياريًا على Linux وWindows وعمليات نشر Gateway داخل الحاويات.
- يكون اسم المضيف افتراضيًا هو اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب نطاق DNS-SD أحادي البث تحت `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، اقرنه بخادم DNS (يوصى بـ CoreDNS) + Tailscale split DNS.

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
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` (لا يتجاوز أيٌّ منهما المتغيرات الموجودة).
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

- تُطابق الأسماء المكتوبة بالأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`.
- المتغيرات المفقودة/الفارغة تُطلق خطأ عند تحميل الإعداد.
- استخدم `$${VAR}` لتهريب `${VAR}` حرفيًا.
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

- نمط `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- نمط معرّف `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- معرّف `source: "file"`: مؤشر JSON مطلق (على سبيل المثال `"/providers/openai/apiKey"`)
- نمط معرّف `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (يدعم محددات بنمط AWS مثل `secret#json_key`)
- يجب ألا تحتوي معرّفات `source: "exec"` على مقاطع مسار محددة بشرطة مائلة هي `.` أو `..` (على سبيل المثال يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القانونية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
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
- تفشل مسارات موفري الملفات والتنفيذ بإغلاق آمن عندما لا يكون التحقق من ACL في Windows متاحًا. عيّن `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب موفر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيًا، تُرفض مسارات أوامر الروابط الرمزية. عيّن `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية مع التحقق من مسار الهدف المحلول.
- إذا تم إعداد `trustedDirs`، ينطبق فحص الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة العملية الفرعية لـ `exec` في حدها الأدنى افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار عند وقت التفعيل إلى لقطة في الذاكرة، ثم تقرأ مسارات الطلب اللقطة فقط.
- ينطبق ترشيح السطح النشط أثناء التفعيل: تؤدي المراجع غير المحلولة على الأسطح الممكّنة إلى فشل بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع تشخيصات.

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
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست تنسيق تشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات تعريف مفاتيح API القانونية `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- لا تدعم ملفات تعريف وضع OAuth (`auth.profiles.<id>.mode = "oauth"`) بيانات اعتماد ملف تعريف المصادقة المستندة إلى SecretRef.
- تأتي بيانات اعتماد التشغيل الثابتة من لقطات محلولة في الذاكرة؛ وتُنظَّف إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- يستورد OAuth القديم من `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: مهلة التراجع الأساسية بالساعات عندما يفشل ملف تعريف بسبب أخطاء
  فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). قد يصل نص الفوترة الصريح
  إلى هنا حتى في استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزوّد
  تبقى محصورة في المزوّد الذي يملكها (مثل OpenRouter
  `Key limit exceeded`). تبقى رسائل HTTP `402` القابلة لإعادة المحاولة الخاصة بنافذة الاستخدام أو
  حدود إنفاق المؤسسة/مساحة العمل في مسار `rate_limit`
  بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لعدد ساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات لنمو تراجع الفوترة الأُسّي (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: تراجع أساسي بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدويرات ملفات تعريف المصادقة ضمن المزوّد نفسه لأخطاء التحميل الزائد قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). تصل أشكال انشغال المزوّد مثل `ModelNotReadyException` إلى هنا.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف محمّل زائدًا (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدويرات ملفات تعريف المصادقة ضمن المزوّد نفسه لأخطاء حدود المعدل قبل الانتقال إلى احتياطي النموذج (الافتراضي: `1`). تتضمن حاوية حدود المعدل هذه نصوصًا بصيغ المزوّد مثل `Too many concurrent requests`، و`ThrottlingException`، و`concurrency limit reached`، و`workers_ai ... quota limit exceeded`، و`resource exhausted`.

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
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونصوص محاضر الجلسات المحفوظة. `redactSensitive: "off"` يعطل سياسة السجل/المحضر العامة هذه فقط؛ ولا تزال أسطح أمان الواجهة/الأداة/التشخيص تحجب الأسرار قبل الإرسال.

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
- `flags`: مصفوفة من سلاسل الأعلام لتفعيل مخرجات سجل موجهة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: حد عمر انعدام التقدم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل كـ `session.long_running` أو `session.stalled` أو `session.stuck`. تعيد الردود والأدوات والحالة والكتل وتقدم ACP ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت بلا تغيير.
- `stuckSessionAbortMs`: حد عمر انعدام التقدم بالمللي ثانية قبل أن يصبح العمل النشط المتوقف مؤهلًا للتصريف بالإجهاض بغرض الاسترداد. عند عدم ضبطه، يستخدم OpenClaw نافذة تشغيل مضمنة ممتدة أكثر أمانًا لا تقل عن 5 دقائق و3 أضعاف `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: يلتقط لقطة استقرار منقحة قبل نفاد الذاكرة عندما يبلغ ضغط الذاكرة `critical` (الافتراضي: `false`). اضبطه إلى `true` لإضافة فحص/كتابة ملف حزمة الاستقرار مع إبقاء أحداث ضغط الذاكرة العادية.
- `otel.enabled`: يفعّل خط تصدير OpenTelemetry (الافتراضي: `false`). للاطلاع على الإعداد الكامل، وكتالوج الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع لتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بكل إشارة. عند ضبطها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات الموارد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبعات أو المقاييس أو السجلات.
- `otel.logsExporter`: وجهة تصدير السجل: `"otlp"` (الافتراضي)، أو `"stdout"` لكائن JSON واحد في كل سطر stdout، أو `"both"`.
- `otel.sampleRate`: معدل أخذ عينات التتبع من `0` إلى `1`.
- `otel.flushIntervalMs`: فاصل تفريغ القياسات الدوري بالمللي ثانية.
- `otel.captureContent`: التقاط اختياري للمحتوى الخام لسمات امتدادات OTEL. يكون معطلًا افتراضيًا. القيمة المنطقية `true` تلتقط محتوى الرسائل/الأدوات غير النظامي؛ ويتيح شكل الكائن تفعيل `inputMessages`، و`outputMessages`، و`toolInputs`، و`toolOutputs`، و`systemPrompt`، و`toolDefinitions` صراحةً.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: مفتاح بيئة لأحدث شكل تجريبي لامتدادات استدلال GenAI، بما يشمل أسماء الامتدادات `{gen_ai.operation.name} {gen_ai.request.model}`، ونوع امتداد `CLIENT`، و`gen_ai.provider.name` بدلًا من `gen_ai.system` القديم. افتراضيًا، تحتفظ الامتدادات بـ `openclaw.model.call` و`gen_ai.system` للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: مفتاح بيئة للمضيفين الذين سجّلوا SDK عامًّا لـ OpenTelemetry مسبقًا. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`، و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`، و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بالإشارة تُستخدم عند عدم ضبط مفتاح الإعداد المطابق.
- `cacheTrace.enabled`: تسجيل لقطات تتبع التخزين المؤقت للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار الإخراج لـ JSONL الخاص بتتبع التخزين المؤقت (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
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
- `auto.stableDelayHours`: الحد الأدنى للتأخير بالساعات قبل تطبيق التحديث التلقائي لقناة stable (الافتراضي: `6`؛ الحد الأقصى: `168`).
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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ اضبطها إلى `false` لإخفاء إمكانات إرسال ACP والإنشاء).
- `dispatch.enabled`: بوابة مستقلة لإرسال دور جلسة ACP (الافتراضي: `true`). اضبطها إلى `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرف خلفية تشغيل ACP الافتراضي (يجب أن يطابق Plugin تشغيل ACP مسجلًا).
  ثبّت Plugin الخلفية أولًا، وإذا كان `plugins.allow` مضبوطًا، فأدرج معرف Plugin الخلفية (مثل `acpx`) وإلا فلن تُحمّل خلفية ACP.
- `defaultAgent`: معرف وكيل ACP الاحتياطي عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرفات الوكلاء المسموح بها لجلسات تشغيل ACP؛ وتعني الفارغة عدم وجود تقييد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة بالتزامن.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم الجزء قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: قمع سطور الحالة/الأداة المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: يبث `"live"` تدريجيًا؛ ويخزن `"final_only"` مؤقتًا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: فاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المعروضة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف في سطور حالة/تحديث ACP المعروضة.
- `stream.tagVisibility`: سجل بأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعمّال جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
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

- يتحكم `cli.banner.taglineMode` في نمط عبارة اللافتة:
  - `"random"` (الافتراضي): عبارات مضحكة/موسمية متناوبة.
  - `"default"`: عبارة محايدة ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: بلا نص عبارة (يبقى عنوان اللافتة/الإصدار معروضًا).
- لإخفاء اللافتة بالكامل (وليس العبارات فقط)، عيّن env `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

البيانات الوصفية التي تكتبها تدفقات الإعداد الموجّه في CLI (`onboard` و`configure` و`doctor`):

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

راجع حقول الهوية في `agents.list` ضمن [إعدادات الوكيل الافتراضية](/ar/gateway/config-agents#agent-defaults).

---

## الجسر (قديم، تمت إزالته)

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل Nodes عبر Gateway WebSocket. لم تعد مفاتيح `bridge.*` جزءًا من مخطط الإعدادات (يفشل التحقق إلى أن تُزال؛ يمكن لـ `openclaw doctor --fix` إزالة المفاتيح غير المعروفة).

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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل cron المعزولة المكتملة قبل تنقيتها من `sessions.json`. يتحكم أيضًا في تنظيف نصوص cron المؤرشفة المحذوفة. الافتراضي: `24h`؛ عيّن `false` للتعطيل.
- `runLog.maxBytes`: مقبول للتوافق مع سجلات تشغيل cron الأقدم المدعومة بالملفات. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث صفوف سجل التشغيل في SQLite التي تُحتفظ بها لكل مهمة. الافتراضي: `2000`.
- `webhookToken`: رمز حامل يُستخدم لتسليم POST عبر Cron Webhook (`delivery.mode = "webhook"`)، وإذا حُذف فلن يُرسل رأس مصادقة.
- `webhook`: عنوان URL قديم مهمل لردّ Webhook الاحتياطي (http/https) يستخدمه `openclaw doctor --fix` لترحيل المهام المخزنة التي لا تزال تحتوي على `notify: true`؛ يستخدم تسليم وقت التشغيل `delivery.mode="webhook"` لكل مهمة مع `delivery.to`، أو `delivery.completionDestination` عند الحفاظ على تسليم الإعلان.

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

- `maxAttempts`: الحد الأقصى لإعادة محاولات مهام cron عند الأخطاء العابرة (الافتراضي: `3`؛ النطاق: `0`-`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 إدخالات).
- `retryOn`: أنواع الأخطاء التي تؤدي إلى إعادة المحاولة - `"rate_limit"` و`"overloaded"` و`"network"` و`"timeout"` و`"server_error"`. احذفها لإعادة محاولة كل الأنواع العابرة.

تبقى المهام أحادية التشغيل مفعّلة إلى أن تُستنفد محاولات الإعادة، ثم تُعطَّل مع الاحتفاظ بحالة الخطأ النهائية. تستخدم المهام المتكررة سياسة إعادة المحاولة العابرة نفسها للتشغيل مرة أخرى بعد التراجع قبل خانتها المجدولة التالية؛ أما الأخطاء الدائمة أو محاولات الإعادة العابرة المستنفدة فتعود إلى الجدول المتكرر العادي مع تراجع الأخطاء.

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

- `enabled`: تمكين تنبيهات الفشل لمهام cron (الافتراضي: `false`).
- `after`: عدد الإخفاقات المتتالية قبل إطلاق التنبيه (عدد صحيح موجب، الحد الأدنى: `1`).
- `cooldownMs`: الحد الأدنى بالمللي ثانية بين التنبيهات المتكررة للمهمة نفسها (عدد صحيح غير سالب).
- `includeSkipped`: احتساب عمليات التشغيل المتخطاة المتتالية ضمن عتبة التنبيه (الافتراضي: `false`). تُتتبّع عمليات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
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

- الوجهة الافتراضية لإشعارات فشل cron عبر كل المهام.
- `mode`: `"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلان. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب في وضع Webhook.
- `accountId`: تجاوز حساب اختياري للتسليم.
- يتجاوز `delivery.failureDestination` لكل مهمة هذا الإعداد الافتراضي العام.
- عند عدم تعيين وجهة فشل عامة ولا خاصة بالمهمة، تعود المهام التي تسلّم أصلًا عبر `announce` إلى هدف الإعلان الأساسي ذلك عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا للمهام ذات `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتتبّع تنفيذات cron المعزولة بوصفها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

عناصر نائبة للقالب تُوسَّع في `tools.media.models[].args`:

| المتغير            | الوصف                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (بلا مغلّفات السجل/المرسل)             |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعة                    |
| `{{From}}`         | معرّف المرسل                                      |
| `{{To}}`           | معرّف الوجهة                                      |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID للجلسة الحالية                               |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                     |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                    |
| `{{MediaPath}}`    | مسار الوسائط المحلي                               |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)                   |
| `{{Transcript}}`   | نص تفريغ الصوت                                    |
| `{{Prompt}}`       | مطالبة الوسائط المحلولة لإدخالات CLI              |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI    |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                        |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)                 |
| `{{SenderName}}`   | اسم عرض المرسل (بأفضل جهد)                        |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                       |
| `{{Provider}}`     | تلميح المزوّد (whatsapp، telegram، discord، إلخ)  |

---

## تضمينات الإعدادات (`$include`)

قسّم الإعدادات إلى عدة ملفات:

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
- مفاتيح شقيقة: تُدمج بعد التضمينات (تتجاوز القيم المضمّنة).
- تضمينات متداخلة: حتى 10 مستويات عمق.
- المسارات: تُحلّ نسبةً إلى الملف الذي يتضمنها، لكن يجب أن تبقى داخل دليل الإعدادات الأعلى (`dirname` الخاص بـ `openclaw.json`). لا يُسمح بالصيغ المطلقة/`../` إلا عندما تظل تُحلّ داخل ذلك الحد. يجب ألا تحتوي المسارات على بايتات null ويجب أن تكون أقصر بدقة من 4096 حرفًا قبل الحل وبعده.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى مدعومًا بتضمين ملف واحد تكتب عبر ذلك الملف المضمّن. على سبيل المثال، يحدّث `plugins install` القيمة `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- التضمينات الجذرية، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط في عمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بشكل مغلق بدل تسطيح الإعدادات.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية، وتنسيق المسار غير الصالح، والطول المفرط.

---

_ذو صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [الإعدادات](/ar/gateway/configuration)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
