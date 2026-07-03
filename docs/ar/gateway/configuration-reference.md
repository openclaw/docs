---
read_when:
    - تحتاج إلى دلالات تكوين أو قيم افتراضية دقيقة على مستوى الحقل
    - أنت تتحقق من كتل إعدادات القناة أو النموذج أو Gateway أو الأداة
summary: مرجع إعدادات Gateway لمفاتيح OpenClaw الأساسية والقيم الافتراضية والروابط إلى مراجع الأنظمة الفرعية المخصّصة
title: مرجع التكوين
x-i18n:
    generated_at: "2026-07-03T23:34:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

مرجع إعدادات النواة لـ `~/.openclaw/openclaw.json`. للحصول على نظرة عامة موجّهة بالمهام، راجع [التهيئة](/ar/gateway/configuration).

يغطي أسطح إعدادات OpenClaw الرئيسية ويربط إلى الخارج عندما يكون لدى نظام فرعي مرجعه الأعمق الخاص. توجد فهارس الأوامر المملوكة للقنوات وPlugins ومفاتيح الذاكرة العميقة/QMD في صفحاتها الخاصة بدلا من هذه الصفحة.

حقيقة الكود:

- يطبع `openclaw config schema` مخطط JSON الحي المستخدم للتحقق وControl UI، مع دمج بيانات التعريف المجمعة/الخاصة بـPlugin/القناة عند توفرها
- يعيد `config.schema.lookup` عقدة مخطط واحدة محددة النطاق بالمسار لأدوات التنقيب التفصيلي
- يتحقق `pnpm config:docs:check` / `pnpm config:docs:gen` من تجزئة خط أساس وثائق الإعدادات مقابل سطح المخطط الحالي

مسار بحث الوكيل: استخدم إجراء أداة `gateway` المسمى `config.schema.lookup` للحصول على
وثائق وقيود دقيقة على مستوى الحقل قبل التحرير. استخدم
[التهيئة](/ar/gateway/configuration) للإرشادات الموجهة بالمهام وهذه الصفحة
لخريطة الحقول الأوسع، والقيم الافتراضية، والروابط إلى مراجع الأنظمة الفرعية.

مراجع عميقة مخصصة:

- [مرجع تهيئة الذاكرة](/ar/reference/memory-config) لـ `agents.defaults.memorySearch.*` و`memory.qmd.*` و`memory.citations` وإعدادات dreaming ضمن `plugins.entries.memory-core.config.dreaming`
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) لفهرس الأوامر الحالي المدمج + المجمع
- صفحات القناة/Plugin المالكة لأسطح الأوامر الخاصة بالقنوات

تنسيق الإعدادات هو **JSON5** (يسمح بالتعليقات + الفواصل اللاحقة). كل الحقول اختيارية - يستخدم OpenClaw قيما افتراضية آمنة عند حذفها.

---

## القنوات

انتقلت مفاتيح إعدادات كل قناة إلى صفحة مخصصة - راجع
[التهيئة - القنوات](/ar/gateway/config-channels) لـ `channels.*`،
بما في ذلك Slack وDiscord وTelegram وWhatsApp وMatrix وiMessage وقنوات
مجمعة أخرى (المصادقة، التحكم في الوصول، تعدد الحسابات، بوابة الإشارات).

## افتراضيات الوكيل، وتعدد الوكلاء، والجلسات، والرسائل

انتقلت إلى صفحة مخصصة - راجع
[التهيئة - الوكلاء](/ar/gateway/config-agents) من أجل:

- `agents.defaults.*` (مساحة العمل، النموذج، التفكير، heartbeat، الذاكرة، الوسائط، Skills، sandbox)
- `multiAgent.*` (توجيه تعدد الوكلاء والارتباطات)
- `session.*` (دورة حياة الجلسة، Compaction، التشذيب)
- `messages.*` (تسليم الرسائل، TTS، عرض markdown)
- `talk.*` (وضع Talk)
  - `talk.consultThinkingLevel`: تجاوز مستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استشارات Control UI Talk الفورية
  - `talk.consultFastMode`: تجاوز لمرة واحدة لوضع السرعة لاستشارات Control UI Talk الفورية
  - `talk.speechLocale`: معرف لغة BCP 47 اختياري للتعرف على الكلام في Talk على iOS/macOS
  - `talk.silenceTimeoutMs`: عند عدم تعيينه، يحتفظ Talk بنافذة التوقف الافتراضية للمنصة قبل إرسال النص (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: مسار احتياطي لترحيل Gateway لنصوص Talk الفورية النهائية التي تتجاوز `openclaw_agent_consult`

## الأدوات والمزودون المخصصون

انتقلت سياسة الأدوات، والمفاتيح التجريبية، وإعدادات الأدوات المدعومة بالمزود، وإعداد
المزود المخصص / عنوان URL الأساسي إلى صفحة مخصصة - راجع
[التهيئة - الأدوات والمزودون المخصصون](/ar/gateway/config-tools).

## النماذج

توجد تعريفات المزودين، وقوائم السماح للنماذج، وإعداد المزود المخصص في
[التهيئة - الأدوات والمزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls).
يمتلك جذر `models` أيضا سلوك فهرس النماذج العام.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: سلوك فهرس المزود (`merge` أو `replace`).
- `models.providers`: خريطة المزودين المخصصين المفهرسة حسب معرف المزود.
- `models.providers.*.localService`: مدير عمليات اختياري عند الطلب
  لخوادم النماذج المحلية. يفحص OpenClaw نقطة نهاية الصحة المهيأة، ويبدأ
  `command` المطلق عند الحاجة، وينتظر الجاهزية، ثم يرسل طلب النموذج.
  راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services).
- `models.pricing.enabled`: يتحكم في تمهيد التسعير الخلفي الذي
  يبدأ بعد أن تصل العمليات الجانبية والقنوات إلى مسار جاهزية Gateway. عند `false`،
  يتجاوز Gateway جلب فهارس أسعار OpenRouter وLiteLLM؛ وتظل قيم
  `models.providers.*.models[].cost` المهيأة تعمل لتقديرات التكلفة المحلية.

## MCP

توجد تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` وتستهلكها
OpenClaw المضمنة ومحولات وقت التشغيل الأخرى. تدير أوامر `openclaw mcp list` و
`show` و`set` و`unset` هذه الكتلة دون الاتصال بالخادم
الهدف أثناء تحرير الإعدادات.

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
  تعرض أدوات MCP المهيأة.
  تستخدم الإدخالات البعيدة `transport: "streamable-http"` أو `transport: "sse"`؛
  أما `type: "http"` فهو اسم مستعار أصيل في CLI تقوم `openclaw mcp set` و
  `openclaw doctor --fix` بتطبيعه إلى حقل `transport` القياسي.
- `mcp.servers.<name>.enabled`: عيّنه إلى `false` للاحتفاظ بتعريف خادم محفوظ
  مع استبعاده من اكتشاف MCP المضمن في OpenClaw وإسقاط الأدوات.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: مهلة طلب MCP لكل خادم
  بالثواني أو المللي ثانية.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: مهلة الاتصال لكل خادم
  بالثواني أو المللي ثانية.
- `mcp.servers.<name>.supportsParallelToolCalls`: تلميح تزامن اختياري
  للمحولات التي يمكنها اختيار ما إذا كانت ستصدر استدعاءات أدوات MCP متوازية.
- `mcp.servers.<name>.auth`: عيّنه إلى `"oauth"` لخوادم MCP عبر HTTP التي تتطلب
  OAuth. شغّل `openclaw mcp login <name>` لتخزين الرموز ضمن حالة OpenClaw.
- `mcp.servers.<name>.oauth`: تجاوزات اختيارية لنطاق OAuth، وعنوان URL لإعادة التوجيه، وعنوان URL
  لبيانات تعريف العميل.
- `mcp.servers.<name>.sslVerify` و`clientCert` و`clientKey`: عناصر تحكم HTTP TLS
  للنقاط النهائية الخاصة وTLS المتبادل.
- `mcp.servers.<name>.toolFilter`: اختيار أدوات اختياري لكل خادم. يحد `include`
  أدوات MCP المكتشفة إلى الأسماء المطابقة؛ ويخفي `exclude` الأسماء المطابقة.
  الإدخالات هي أسماء أدوات MCP دقيقة أو أنماط `*` بسيطة. تولد الخوادم التي لديها
  موارد أو مطالبات أيضا أسماء أدوات مساعدة (`resources_list`،
  `resources_read`، `prompts_list`، `prompts_get`)، وتستخدم تلك الأسماء
  المرشح نفسه.
- `mcp.servers.<name>.codex`: عناصر تحكم اختيارية لإسقاط خادم تطبيق Codex.
  هذه الكتلة هي بيانات تعريف OpenClaw لسلاسل خادم تطبيق Codex فقط؛ ولا تؤثر
  في جلسات ACP، أو إعدادات حزمة Codex العامة، أو محولات وقت التشغيل الأخرى.
  يحد `codex.agents` غير الفارغ الخادم إلى معرفات وكلاء OpenClaw المدرجة.
  ترفض عملية التحقق من الإعدادات قوائم الوكلاء المحددة النطاق الفارغة أو الخالية أو غير الصالحة
  ويحذفها مسار إسقاط وقت التشغيل بدلا من أن تصبح عامة.
  يصدر `codex.defaultToolsApprovalMode` قيمة Codex الأصلية
  `default_tools_approval_mode` لذلك الخادم. يزيل OpenClaw كتلة `codex`
  قبل تمرير إعدادات `mcp_servers` الأصلية إلى Codex. احذف الكتلة
  لإبقاء الخادم مسقطا لكل وكيل خادم تطبيق Codex مع سلوك موافقة MCP
  الافتراضي في Codex.
- `mcp.sessionIdleTtlMs`: مدة TTL للخمول لأوقات تشغيل MCP المجمعة محددة النطاق بالجلسة.
  تطلب عمليات التشغيل المضمنة لمرة واحدة تنظيف نهاية التشغيل؛ وتمثل مدة TTL هذه خط الرجوع
  للجلسات طويلة العمر والمستدعين المستقبليين.
- تطبق التغييرات ضمن `mcp.*` فوريا عبر التخلص من أوقات تشغيل MCP المخزنة مؤقتا للجلسة.
  يعيد اكتشاف/استخدام الأداة التالي إنشاءها من الإعدادات الجديدة، لذلك تزال
  إدخالات `mcp.servers` المحذوفة فورا بدلا من انتظار مدة TTL للخمول.
- يراعي اكتشاف وقت التشغيل أيضا إشعارات تغيير قائمة أدوات MCP عبر إسقاط
  الفهرس المخزن مؤقتا لتلك الجلسة. تحصل الخوادم التي تعلن موارد أو
  مطالبات على أدوات مساعدة لسرد/قراءة الموارد وسرد/جلب
  المطالبات. توقف إخفاقات استدعاء الأدوات المتكررة الخادم المتأثر مؤقتا قبل
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

- `allowBundled`: قائمة سماح اختيارية لـ Skills المجمعة فقط (لا تتأثر Skills المدارة/الخاصة بمساحة العمل).
- `load.extraDirs`: جذور Skills مشتركة إضافية (أدنى أولوية).
- `load.allowSymlinkTargets`: جذور أهداف حقيقية موثوقة يمكن أن
  تحل إليها الروابط الرمزية الخاصة بـ Skills عندما يكون الرابط خارج جذر المصدر المهيأ.
- `workshop.allowSymlinkTargetWrites`: يسمح لتطبيق Skill Workshop بالكتابة
  عبر أهداف الروابط الرمزية الموثوقة مسبقا (الافتراضي: false).
- `install.preferBrew`: عند true، يفضل مثبتات Homebrew عندما يكون `brew`
  متاحا قبل الرجوع إلى أنواع مثبتات أخرى.
- `install.nodeManager`: تفضيل مثبت Node لمواصفات `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: السماح لعملاء Gateway الموثوقين من نوع `operator.admin`
  بتثبيت أرشيفات zip خاصة ممرحلة عبر `skills.upload.*`
  (الافتراضي: false). هذا لا يفعل إلا مسار الأرشيفات المرفوعة؛ ولا تتطلبه
  عمليات التثبيت العادية من ClawHub.
- يعطل `entries.<skillKey>.enabled: false` Skill حتى إن كانت مجمعة/مثبتة.
- `entries.<skillKey>.apiKey`: تسهيل لـ Skills التي تعلن متغير env أساسيا (سلسلة نصية صريحة أو كائن SecretRef).

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

- تُحمَّل من أدلة الحزم أو الحِزم ضمن `~/.openclaw/extensions` و`<workspace>/.openclaw/extensions`، إضافةً إلى الملفات أو الأدلة المدرجة في `plugins.load.paths`.
- ضع ملفات Plugin المستقلة في `plugins.load.paths`؛ تتجاهل جذور الامتدادات المكتشفة تلقائيًا ملفات `.js` و`.mjs` و`.ts` ذات المستوى الأعلى حتى لا تمنع سكربتات المساعدة في تلك الجذور بدء التشغيل.
- يقبل الاكتشاف Plugins ‏OpenClaw الأصلية إضافةً إلى حِزم Codex وحِزم Claude المتوافقة، بما في ذلك حِزم Claude ذات التخطيط الافتراضي بلا بيان.
- **تتطلب تغييرات الإعدادات إعادة تشغيل Gateway.**
- `allow`: قائمة سماح اختيارية (لا تُحمَّل إلا Plugins المدرجة). تتغلب `deny`.
- `plugins.entries.<id>.apiKey`: حقل ملاءمة لمفتاح API على مستوى Plugin (عندما يدعمه Plugin).
- `plugins.entries.<id>.env`: خريطة متغيرات بيئة مقيّدة بنطاق Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: عندما تكون `false`، يحظر القلب `before_prompt_build` ويتجاهل الحقول التي تعدّل الموجّه من `before_agent_start` القديم، مع الحفاظ على `modelOverride` و`providerOverride` القديمين. ينطبق ذلك على خطّافات Plugin الأصلية وأدلة الخطّافات المدعومة التي توفرها الحِزم.
- `plugins.entries.<id>.hooks.allowConversationAccess`: عندما تكون `true`، يمكن لـ Plugins غير المضمّنة والموثوقة قراءة محتوى المحادثة الخام من الخطّافات الموصوفة نوعيًا مثل `llm_input` و`llm_output` و`before_model_resolve` و`before_agent_reply` و`before_agent_run` و`before_agent_finalize` و`agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: ثق صراحةً بهذا Plugin ليطلب تجاوزات `provider` و`model` لكل تشغيل في عمليات subagent الخلفية.
- `plugins.entries.<id>.subagent.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القانونية لتجاوزات subagent الموثوقة. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowModelOverride`: ثق صراحةً بهذا Plugin ليطلب تجاوزات النموذج لـ `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: قائمة سماح اختيارية لأهداف `provider/model` القانونية لتجاوزات إكمال LLM الخاصة بـ Plugin الموثوق. استخدم `"*"` فقط عندما تريد عمدًا السماح بأي نموذج.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: ثق صراحةً بهذا Plugin لتشغيل `api.runtime.llm.complete` مقابل معرّف وكيل غير افتراضي.
- `plugins.entries.<id>.config`: كائن إعدادات يعرّفه Plugin (يُتحقّق منه عبر مخطط Plugin ‏OpenClaw الأصلي عند توفره).
- توجد إعدادات حساب/تشغيل Plugin القناة ضمن `channels.<id>` ويجب أن تصفها بيانات `channelConfigs` الوصفية في بيان Plugin المالك، لا سجل خيارات مركزي في OpenClaw.

### إعدادات Plugin حاضنة Codex

يمتلك Plugin المضمّن `codex` إعدادات حاضنة خادم تطبيق Codex الأصلية ضمن
`plugins.entries.codex.config`. راجع
[مرجع حاضنة Codex](/ar/plugins/codex-harness-reference) للاطلاع على سطح الإعدادات الكامل
و[حاضنة Codex](/ar/plugins/codex-harness) للاطلاع على نموذج التشغيل.

ينطبق `codexPlugins` فقط على الجلسات التي تختار حاضنة Codex الأصلية.
ولا يفعّل Plugins ‏Codex لعمليات تشغيل مزود OpenClaw أو ارتباطات محادثة ACP
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

- `plugins.entries.codex.config.codexPlugins.enabled`: يفعّل دعم Plugin/التطبيق الأصلي لحاضنة Codex. الافتراضي: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  سياسة الإجراءات التدميرية الافتراضية لاستدعاءات تطبيق Plugin المُرحّلة.
  استخدم `true` لقبول مخططات موافقة Codex الآمنة دون مطالبة، و`false`
  لرفضها، و`"auto"` لتوجيه الموافقات التي يتطلبها Codex عبر موافقات Plugin
  في OpenClaw، أو `"ask"` للمطالبة بكل إجراء كتابة/تدمير خاص بـ Plugin
  دون موافقة دائمة. يمسح وضع `"ask"` تجاوزات موافقة Codex الدائمة لكل أداة
  للتطبيق المتأثر ويختار مراجع الموافقات البشري لذلك التطبيق قبل بدء سلسلة Codex.
  الافتراضي: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: يفعّل إدخال Plugin
  مُرحّلًا عندما يكون `codexPlugins.enabled` العام صحيحًا أيضًا.
  الافتراضي: `true` للإدخالات الصريحة.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  هوية سوق مستقرة. يدعم V1 فقط `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: هوية Plugin ‏Codex مستقرة
  من الترحيل، مثل `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  تجاوز الإجراءات التدميرية لكل Plugin. عند حذفه، تُستخدم قيمة
  `allow_destructive_actions` العامة. تقبل القيمة الخاصة بكل Plugin
  السياسات نفسها: `true` أو `false` أو `"auto"` أو `"ask"`.

كل تطبيق Plugin مُقبَل يستخدم `"ask"` يوجّه طلبات موافقة ذلك التطبيق
إلى المراجع البشري. تحتفظ التطبيقات الأخرى وموافقات السلسلة غير التطبيقية
بالمراجع المضبوط لها، لذلك لا ترث سياسات Plugin المختلطة سلوك `"ask"`.

`codexPlugins.enabled` هو توجيه التفعيل العام. إدخالات Plugin الصريحة
التي يكتبها الترحيل هي مجموعة التثبيت الدائم وأهلية الإصلاح.
`plugins["*"]` غير مدعوم، ولا يوجد مفتاح `install`، وقيم
`marketplacePath` المحلية ليست حقول إعدادات عمدًا لأنها خاصة بالمضيف.

تُخزَّن فحوص جاهزية `app/list` مؤقتًا لمدة ساعة واحدة وتُحدَّث
بشكل غير متزامن عند التقادم. تُحتسب إعدادات تطبيق سلسلة Codex عند إنشاء
جلسة حاضنة Codex، لا في كل دور؛ استخدم `/new` أو `/reset` أو إعادة تشغيل
Gateway بعد تغيير إعدادات Plugin الأصلية.

- `plugins.entries.firecrawl.config.webFetch`: إعدادات مزود جلب الويب Firecrawl.
  - `apiKey`: مفتاح API اختياري لـ Firecrawl لحدود أعلى (يقبل SecretRef). يعود إلى `plugins.entries.firecrawl.config.webSearch.apiKey` أو `tools.web.fetch.firecrawl.apiKey` القديم أو متغير البيئة `FIRECRAWL_API_KEY`.
  - `baseUrl`: عنوان URL الأساسي لـ API ‏Firecrawl (الافتراضي: `https://api.firecrawl.dev`؛ يجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة/داخلية).
  - `onlyMainContent`: استخرج المحتوى الرئيسي فقط من الصفحات (الافتراضي: `true`).
  - `maxAgeMs`: أقصى عمر لذاكرة التخزين المؤقت بالمللي ثانية (الافتراضي: `172800000` / يومان).
  - `timeoutSeconds`: مهلة طلب الكشط بالثواني (الافتراضي: `60`).
- `plugins.entries.xai.config.xSearch`: إعدادات xAI X Search (بحث Grok على الويب).
  - `enabled`: فعّل مزود X Search.
  - `model`: نموذج Grok المراد استخدامه للبحث (مثل `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: إعدادات Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming) للمراحل والعتبات.
  - `enabled`: مفتاح Dreaming الرئيسي (الافتراضي `false`).
  - `frequency`: وتيرة Cron لكل مسح Dreaming كامل (`"0 3 * * *"` افتراضيًا).
  - `model`: تجاوز اختياري لنموذج subagent الخاص بـ Dream Diary. يتطلب `plugins.entries.memory-core.subagent.allowModelOverride: true`؛ اقرنه بـ `allowedModels` لتقييد الأهداف. أخطاء عدم توفر النموذج تعيد المحاولة مرة واحدة باستخدام نموذج الجلسة الافتراضي؛ ولا تعود إخفاقات الثقة أو قائمة السماح بصمت.
  - سياسة المراحل والعتبات تفاصيل تنفيذية (وليست مفاتيح إعدادات موجهة للمستخدم).
- توجد إعدادات الذاكرة الكاملة في [مرجع إعدادات الذاكرة](/ar/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- يمكن لـ Plugins حِزم Claude المفعّلة أيضًا المساهمة بإعدادات OpenClaw الافتراضية المضمّنة من `settings.json`؛ يطبق OpenClaw هذه كإعدادات وكيل منقّاة، لا كتصحيحات خام لإعدادات OpenClaw.
- `plugins.slots.memory`: اختر معرّف Plugin الذاكرة النشط، أو `"none"` لتعطيل Plugins الذاكرة.
- `plugins.slots.contextEngine`: اختر معرّف Plugin محرك السياق النشط؛ يكون الافتراضي `"legacy"` ما لم تثبّت محركًا آخر وتختاره.

راجع [Plugins](/ar/tools/plugin).

---

## الالتزامات

يتحكم `commitments` في ذاكرة المتابعة المستنتجة: يستطيع OpenClaw اكتشاف عمليات التحقق من أدوار المحادثة وتسليمها عبر عمليات Heartbeat.

- `commitments.enabled`: فعّل استخراج LLM المخفي والتخزين وتسليم Heartbeat لالتزامات المتابعة المستنتجة. الافتراضي: `false`.
- `commitments.maxPerDay`: الحد الأقصى لالتزامات المتابعة المستنتجة المُسلّمة لكل جلسة وكيل خلال يوم متحرك. الافتراضي: `3`.

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
- يستعيد `tabCleanup` علامات تبويب الوكيل الأساسي المتتبعة بعد مدة الخمول أو عندما
  تتجاوز الجلسة حدّها الأقصى. اضبط `idleMinutes: 0` أو `maxTabsPerSession: 0` من أجل
  تعطيل أوضاع التنظيف الفردية هذه.
- يكون `ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا عند عدم ضبطه، لذلك يظل تنقّل المتصفح صارمًا افتراضيًا.
- اضبط `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` فقط عندما تثق عمدًا بتنقّل المتصفح عبر الشبكة الخاصة.
- في الوضع الصارم، تخضع نقاط نهاية ملفات تعريف CDP البعيدة (`profiles.*.cdpUrl`) لحظر الشبكة الخاصة نفسه أثناء فحوصات قابلية الوصول/الاكتشاف.
- يظل `ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم بديل قديم.
- في الوضع الصارم، استخدم `ssrfPolicy.hostnameAllowlist` و`ssrfPolicy.allowedHostnames` للاستثناءات الصريحة.
- ملفات التعريف البعيدة مخصصة للإرفاق فقط (التشغيل/الإيقاف/إعادة الضبط معطلة).
- يقبل `profiles.*.cdpUrl` القيم `http://` و`https://` و`ws://` و`wss://`.
  استخدم HTTP(S) عندما تريد من OpenClaw اكتشاف `/json/version`؛ واستخدم WS(S)
  عندما يزوّدك الموفّر بعنوان URL مباشر لـ DevTools WebSocket.
- ينطبق `remoteCdpTimeoutMs` و`remoteCdpHandshakeTimeoutMs` على قابلية الوصول إلى CDP البعيد و
  `attachOnly`، إضافة إلى طلبات فتح علامات التبويب. تحتفظ ملفات تعريف الاسترجاع
  المُدارة بإعدادات CDP المحلية الافتراضية.
- إذا كانت خدمة CDP المُدارة خارجيًا قابلة للوصول عبر الاسترجاع، فاضبط
  `attachOnly: true` لذلك الملف التعريفي؛ وإلا فسيعامل OpenClaw منفذ الاسترجاع كملف
  تعريف متصفح محلي مُدار وقد يبلّغ عن أخطاء ملكية المنفذ المحلي.
- تستخدم ملفات تعريف `existing-session` Chrome MCP بدلًا من CDP ويمكنها الإرفاق على
  المضيف المحدد أو عبر عقدة متصفح متصلة.
- يمكن لملفات تعريف `existing-session` ضبط `userDataDir` لاستهداف ملف تعريف متصفح
  محدد قائم على Chromium مثل Brave أو Edge.
- يمكن لملفات تعريف `existing-session` ضبط `cdpUrl` عندما يكون Chrome قيد التشغيل بالفعل
  خلف نقطة نهاية اكتشاف DevTools HTTP(S) أو نقطة نهاية WS(S) مباشرة. في ذلك
  الوضع يمرّر OpenClaw نقطة النهاية إلى Chrome MCP بدلًا من استخدام الاتصال التلقائي؛
  يتم تجاهل `userDataDir` لوسائط تشغيل Chrome MCP.
- تحتفظ ملفات تعريف `existing-session` بحدود مسار Chrome MCP الحالية:
  إجراءات مدفوعة باللقطات/المراجع بدلًا من الاستهداف بمحددات CSS، وخطافات رفع ملف واحد،
  بلا تجاوزات لمهلة الحوارات، وبلا `wait --load networkidle`، وبلا
  `responsebody` أو تصدير PDF أو اعتراض التنزيلات أو إجراءات الدُفعات.
- تعيّن ملفات تعريف `openclaw` المحلية المُدارة `cdpPort` و`cdpUrl` تلقائيًا؛ اضبط
  `cdpUrl` صراحةً فقط لملفات تعريف CDP البعيدة أو إرفاق نقطة نهاية existing-session.
- يمكن لملفات التعريف المحلية المُدارة ضبط `executablePath` لتجاوز
  `browser.executablePath` العام لذلك الملف التعريفي. استخدم هذا لتشغيل ملف تعريف واحد في
  Chrome وآخر في Brave.
- تستخدم ملفات التعريف المحلية المُدارة `browser.localLaunchTimeoutMs` لاكتشاف Chrome CDP HTTP
  بعد بدء العملية و`browser.localCdpReadyTimeoutMs` لجاهزية websocket الخاص بـCDP
  بعد التشغيل. ارفع هذه القيم على المضيفين الأبطأ حيث يبدأ Chrome
  بنجاح لكن فحوصات الجاهزية تتسابق مع بدء التشغيل. يجب أن تكون كلتا القيمتين
  أعدادًا صحيحة موجبة حتى `120000` مللي ثانية؛ تُرفض قيم الإعدادات غير الصالحة.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي إذا كان قائمًا على Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- يقبل كل من `browser.executablePath` و`browser.profiles.<name>.executablePath`
  القيمتين `~` و`~/...` لدليل المنزل في نظام التشغيل لديك قبل تشغيل Chromium.
  يتم أيضًا توسيع علامة التلدة في `userDataDir` لكل ملف تعريف في ملفات تعريف `existing-session`.
- خدمة التحكم: الاسترجاع فقط (المنفذ مشتق من `gateway.port`، الافتراضي `18791`).
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

- `seamColor`: لون تمييز لزخرفة واجهة مستخدم التطبيق الأصلية (تلوين فقاعة Talk Mode، وما إلى ذلك).
- `assistant`: تجاوز هوية Control UI. يعود إلى هوية الوكيل النشط عند عدم ضبطه.

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

- `mode`: `local` (تشغيل Gateway) أو `remote` (الاتصال بـ Gateway بعيد). يرفض Gateway البدء ما لم تكن القيمة `local`.
- `port`: منفذ واحد متعدد الاستخدامات لـ WS + HTTP. الأولوية: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`، أو `loopback` (الافتراضي)، أو `lan` (`0.0.0.0`)، أو `tailnet` (عنوان IP الخاص بـ Tailscale فقط)، أو `custom`.
- **أسماء bind المستعارة القديمة**: استخدم قيم وضع bind في `gateway.bind` (`auto`، `loopback`، `lan`، `tailnet`، `custom`)، وليس أسماء المضيف المستعارة (`0.0.0.0`، `127.0.0.1`، `localhost`، `::`، `::1`).
- **ملاحظة Docker**: يستمع bind الافتراضي `loopback` على `127.0.0.1` داخل الحاوية. مع شبكة Docker الجسرية (`-p 18789:18789`)، تصل الحركة عبر `eth0`، لذلك لا يمكن الوصول إلى Gateway. استخدم `--network host`، أو اضبط `bind: "lan"` (أو `bind: "custom"` مع `customBindHost: "0.0.0.0"`) للاستماع على كل الواجهات.
- **المصادقة**: مطلوبة افتراضيا. تتطلب عمليات bind غير loopback مصادقة Gateway. عمليا، يعني ذلك رمزا/كلمة مرور مشتركة أو وكيلا عكسيا مدركا للهوية مع `gateway.auth.mode: "trusted-proxy"`. ينشئ معالج الإعداد الأولي رمزا افتراضيا.
- إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` (بما في ذلك SecretRefs)، فاضبط `gateway.auth.mode` صراحة على `token` أو `password`. تفشل تدفقات بدء التشغيل وتثبيت/إصلاح الخدمة عندما يكون كلاهما مكوّنا ويكون الوضع غير مضبوط.
- `gateway.auth.mode: "none"`: وضع صريح بلا مصادقة. استخدمه فقط لإعدادات local loopback موثوقة؛ وهذا غير معروض عمدا في مطالبات الإعداد الأولي.
- `gateway.auth.mode: "trusted-proxy"`: فوّض مصادقة المتصفح/المستخدم إلى وكيل عكسي مدرك للهوية، وثق بترويسات الهوية من `gateway.trustedProxies` (راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)). يتوقع هذا الوضع افتراضيا مصدر وكيل **غير loopback**؛ وتتطلب الوكلاء العكسيون عبر loopback على المضيف نفسه ضبطا صريحا لـ `gateway.auth.trustedProxy.allowLoopback = true`. يمكن للمتصلين الداخليين على المضيف نفسه استخدام `gateway.auth.password` كبديل محلي مباشر؛ ويظل `gateway.auth.token` متنافيا مع وضع trusted-proxy.
- `gateway.auth.allowTailscale`: عندما تكون `true`، يمكن لترويسات هوية Tailscale Serve استيفاء مصادقة واجهة التحكم/WebSocket (يتم التحقق عبر `tailscale whois`). لا تستخدم نقاط نهاية HTTP API مصادقة ترويسة Tailscale تلك؛ بل تتبع وضع مصادقة HTTP المعتاد في Gateway بدلا من ذلك. يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. القيمة الافتراضية هي `true` عندما تكون `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: محدد اختياري لمحاولات المصادقة الفاشلة. يطبّق لكل عنوان IP عميل ولكل نطاق مصادقة (يتم تتبع shared-secret وdevice-token بشكل مستقل). تعيد المحاولات المحظورة `429` + `Retry-After`.
  - على مسار واجهة التحكم غير المتزامن في Tailscale Serve، تتم تسلسلة المحاولات الفاشلة لنفس `{scope, clientIp}` قبل كتابة الفشل. لذلك يمكن للمحاولات السيئة المتزامنة من العميل نفسه أن تفعّل المحدد في الطلب الثاني بدلا من أن تمر كلتاهما كتعارضات عادية.
  - القيمة الافتراضية لـ `gateway.auth.rateLimit.exemptLoopback` هي `true`؛ اضبطها على `false` عندما تريد عمدا تقييد حركة localhost أيضا (لإعدادات الاختبار أو نشر الوكيل الصارم).
- تتم دائما خنق محاولات مصادقة WS من مصدر المتصفح مع تعطيل إعفاء loopback (دفاع معمق ضد هجمات القوة الغاشمة على localhost من المتصفح).
- على loopback، تُعزل عمليات القفل هذه الصادرة من المتصفح لكل قيمة `Origin`
  مطبّعة، لذلك لا تؤدي الإخفاقات المتكررة من مصدر localhost واحد تلقائيا
  إلى قفل مصدر مختلف.
- `tailscale.mode`: `serve` (tailnet فقط، bind عبر loopback) أو `funnel` (عام، يتطلب المصادقة).
- `tailscale.serviceName`: اسم خدمة Tailscale اختياري لوضع Serve، مثل
  `svc:openclaw`. عند ضبطه، يمرره OpenClaw إلى `tailscale serve
--service` حتى يمكن عرض واجهة التحكم عبر خدمة مسماة بدلا
  من اسم مضيف الجهاز. يجب أن تستخدم القيمة تنسيق اسم خدمة Tailscale
  `svc:<dns-label>`؛ ويبلغ بدء التشغيل عن عنوان URL المشتق للخدمة.
- `tailscale.preserveFunnel`: عندما تكون `true` و`tailscale.mode = "serve"`، يتحقق OpenClaw
  من `tailscale funnel status` قبل إعادة تطبيق Serve عند بدء التشغيل ويتخطاه
  إذا كان مسار Funnel مكوّنا خارجيا يغطي منفذ Gateway بالفعل.
  الافتراضي `false`.
- `controlUi.allowedOrigins`: قائمة سماح صريحة لمصدر المتصفح لاتصالات Gateway WebSocket. مطلوبة لمصادر المتصفح العامة غير loopback. يتم قبول تحميلات واجهة المستخدم الخاصة من نفس المصدر عبر LAN/Tailnet من loopback أو RFC1918/link-local أو `.local` أو `.ts.net` أو مضيفي Tailscale CGNAT من دون تمكين بديل ترويسة Host.
- `controlUi.chatMessageMaxWidth`: عرض أقصى اختياري لرسائل دردشة واجهة التحكم المجمعة. يقبل قيم عرض CSS مقيّدة مثل `960px` و`82%` و`min(1280px, 82%)` و`calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: وضع خطر يفعّل بديل مصدر ترويسة Host لعمليات النشر التي تعتمد عمدا على سياسة مصدر ترويسة Host.
- `remote.transport`: `ssh` (الافتراضي) أو `direct` (ws/wss). بالنسبة إلى `direct`، يجب أن تكون `remote.url` هي `wss://` للمضيفين العامين؛ ولا يُقبل النص الصريح `ws://` إلا لـ loopback وLAN وlink-local و`.local` و`.ts.net` ومضيفي Tailscale CGNAT.
- `remote.remotePort`: منفذ Gateway على مضيف SSH البعيد. الافتراضي `18789`؛ استخدم هذا عندما يختلف منفذ النفق المحلي عن منفذ Gateway البعيد.
- `remote.sshHostKeyPolicy`: سياسة مفتاح مضيف نفق SSH على macOS. `strict` هي القيمة الافتراضية وتتطلب مفتاحا موثوقا مسبقا. `openssh` هو قبول صريح لاستخدام تكوين OpenSSH الفعّال للأسماء المستعارة المُدارة؛ راجع إعدادات SSH المطابقة للمستخدم والنظام قبل استخدامه. يعيد تطبيق macOS و`configure-remote` ضبط هذه السياسة إلى `strict` عند تغيير الأهداف ما لم يتم قبولها صراحة مرة أخرى.
- `gateway.remote.token` / `.password` هي حقول بيانات اعتماد العميل البعيد. لا تكوّن مصادقة Gateway بحد ذاتها.
- `gateway.push.apns.relay.baseUrl`: عنوان URL أساسي عبر HTTPS لمرحل APNs الخارجي المستخدم بعد أن تنشر إصدارات iOS المدعومة بالمرحل التسجيلات إلى Gateway. تستخدم إصدارات App Store العامة مرحل OpenClaw المستضاف. يجب أن تطابق عناوين URL للمرحل المخصص مسار بناء/نشر iOS منفصلا عمدا يشير عنوان URL للمرحل فيه إلى ذلك المرحل.
- `gateway.push.apns.relay.timeoutMs`: مهلة إرسال Gateway إلى المرحل بالمللي ثانية. الافتراضي `10000`.
- تُفوّض التسجيلات المدعومة بالمرحل إلى هوية Gateway محددة. يجلب تطبيق iOS المقترن `gateway.identity.get`، ويدرج تلك الهوية في تسجيل المرحل، ويمرر منحة إرسال محددة بنطاق التسجيل إلى Gateway. لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: تجاوزات env مؤقتة لتكوين المرحل أعلاه.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: منفذ هروب للتطوير فقط لعناوين URL لمرحل HTTP عبر loopback. يجب أن تبقى عناوين URL لمرحل الإنتاج على HTTPS.
- `gateway.handshakeTimeoutMs`: مهلة مصافحة Gateway WebSocket قبل المصادقة بالمللي ثانية. الافتراضي: `15000`. يأخذ `OPENCLAW_HANDSHAKE_TIMEOUT_MS` الأولوية عند ضبطه. زِد هذه القيمة على المضيفين المحمّلين أو ضعيفي الطاقة حيث يمكن للعملاء المحليين الاتصال بينما لا يزال إحماء بدء التشغيل يستقر.
- `gateway.channelHealthCheckMinutes`: الفاصل الزمني لمراقب صحة القناة بالدقائق. اضبط `0` لتعطيل عمليات إعادة تشغيل مراقب الصحة عالميا. الافتراضي: `5`.
- `gateway.channelStaleEventThresholdMinutes`: حد المقبس القديم بالدقائق. أبقِ هذه القيمة أكبر من أو مساوية لـ `gateway.channelHealthCheckMinutes`. الافتراضي: `30`.
- `gateway.channelMaxRestartsPerHour`: الحد الأقصى لعمليات إعادة تشغيل مراقب الصحة لكل قناة/حساب في ساعة متحركة. الافتراضي: `10`.
- `channels.<provider>.healthMonitor.enabled`: تعطيل اختياري لكل قناة لعمليات إعادة تشغيل مراقب الصحة مع إبقاء المراقب العالمي مفعلا.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: تجاوز لكل حساب للقنوات متعددة الحسابات. عند ضبطه، يأخذ الأولوية على تجاوز مستوى القناة.
- يمكن لمسارات استدعاء Gateway المحلية استخدام `gateway.remote.*` كبديل فقط عندما تكون `gateway.auth.*` غير مضبوطة.
- إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحة عبر SecretRef ولم يتم حلها، يفشل الحل بإغلاق آمن (من دون إخفاء ببديل بعيد).
- `trustedProxies`: عناوين IP للوكلاء العكسيين الذين ينهون TLS أو يحقنون ترويسات العميل المُمررة. أدرج فقط الوكلاء الذين تتحكم بهم. تظل إدخالات loopback صالحة لإعدادات الوكيل على المضيف نفسه/الاكتشاف المحلي (مثل Tailscale Serve أو وكيل عكسي محلي)، لكنها **لا** تجعل طلبات loopback مؤهلة لـ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: عندما تكون `true`، يقبل Gateway `X-Real-IP` إذا كان `X-Forwarded-For` مفقودا. الافتراضي `false` لسلوك الفشل المغلق.
- `gateway.nodes.pairing.autoApproveCidrs`: قائمة سماح CIDR/IP اختيارية للموافقة التلقائية على إقران جهاز عقدة لأول مرة من دون نطاقات مطلوبة. تكون معطلة عند عدم ضبطها. لا يوافق هذا تلقائيا على إقران المشغل/المتصفح/واجهة التحكم/دردشة الويب، ولا يوافق تلقائيا على ترقيات الدور أو النطاق أو البيانات الوصفية أو المفتاح العام.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: تشكيل سماح/منع عالمي لأوامر العقد المعلنة بعد الإقران وتقييم قائمة سماح المنصة. استخدم `allowCommands` لقبول أوامر العقد الخطرة مثل `camera.snap` و`camera.clip` و`screen.record`؛ يزيل `denyCommands` أمرا حتى لو كان افتراض المنصة أو سماح صريح سيتضمنه بخلاف ذلك. بعد أن تغير عقدة قائمة أوامرها المعلنة، ارفض إقران ذلك الجهاز وأعد الموافقة عليه حتى يخزن Gateway لقطة الأوامر المحدثة.
- `gateway.tools.deny`: أسماء أدوات إضافية محظورة لـ HTTP `POST /tools/invoke` (توسع قائمة المنع الافتراضية).
- `gateway.tools.allow`: إزالة أسماء أدوات من قائمة منع HTTP الافتراضية
  للمتصلين المالكين/المسؤولين. لا يرفع هذا المتصلين الحاملين لهوية `operator.write`
  إلى وصول مالك/مسؤول؛ تظل `cron` و`gateway` و`nodes`
  غير متاحة للمتصلين غير المالكين حتى عند إدراجها في قائمة السماح.

</Accordion>

### نقاط نهاية متوافقة مع OpenAI

- RPC إداري عبر HTTP: معطل افتراضيا باعتباره Plugin `admin-http-rpc`. فعّل Plugin لتسجيل `POST /api/v1/admin/rpc`. راجع [RPC إداري عبر HTTP](/ar/plugins/admin-http-rpc).
- Chat Completions: معطلة افتراضيا. فعّلها باستخدام `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- تقوية إدخال URL في Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    تُعامل قوائم السماح الفارغة كأنها غير مضبوطة؛ استخدم `gateway.http.endpoints.responses.files.allowUrl=false`
    و/أو `gateway.http.endpoints.responses.images.allowUrl=false` لتعطيل جلب URL.
- ترويسة تقوية استجابة اختيارية:
  - `gateway.http.securityHeaders.strictTransportSecurity` (اضبطها فقط لمصادر HTTPS التي تتحكم بها؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### عزل متعدد المثيلات

شغّل عدة Gateways على مضيف واحد بمنافذ ومجلدات حالة فريدة:

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

- `enabled`: يفعّل إنهاء TLS عند مستمع Gateway (HTTPS/WSS) (الافتراضي: `false`).
- `autoGenerate`: ينشئ تلقائيا زوج شهادة/مفتاح موقّعا ذاتيا محليا عندما لا يتم تكوين ملفات صريحة؛ للاستخدام المحلي/التطوير فقط.
- `certPath`: مسار نظام الملفات إلى ملف شهادة TLS.
- `keyPath`: مسار نظام الملفات إلى ملف المفتاح الخاص لـ TLS؛ أبقه مقيّدا بالأذونات.
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
  - `"off"`: تجاهل التعديلات المباشرة؛ تتطلب التغييرات إعادة تشغيل صريحة.
  - `"restart"`: أعد تشغيل عملية Gateway دائمًا عند تغيير الإعدادات.
  - `"hot"`: طبّق التغييرات داخل العملية من دون إعادة التشغيل.
  - `"hybrid"` (الافتراضي): جرّب إعادة التحميل الساخنة أولًا؛ وارجع إلى إعادة التشغيل إذا لزم الأمر.
- `debounceMs`: نافذة منع التكرار بالمللي ثانية قبل تطبيق تغييرات الإعدادات (عدد صحيح غير سالب).
- `deferralTimeoutMs`: الحد الأقصى الاختياري للوقت بالمللي ثانية لانتظار العمليات الجارية قبل فرض إعادة تشغيل أو إعادة تحميل ساخنة للقناة. احذفه لاستخدام الانتظار المحدود الافتراضي (`300000`)؛ واضبطه على `0` للانتظار إلى أجل غير مسمى وتسجيل تحذيرات دورية عن العناصر التي لا تزال معلّقة.

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
- يجب أن يكون `hooks.token` مختلفًا عن مصادقة السر المشترك النشطة في Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)؛ تسجّل عملية بدء التشغيل تحذيرًا أمنيًا غير قاتل عندما تكتشف إعادة الاستخدام.
- يضع `openclaw security audit` علامة على إعادة استخدام مصادقة الخطاف/Gateway باعتبارها نتيجة حرجة، بما في ذلك مصادقة كلمة مرور Gateway المقدمة فقط وقت التدقيق (`--auth password --password <password>`). شغّل `openclaw doctor --fix` لتدوير `hooks.token` مُعاد استخدامه ومخزّن، ثم حدّث مرسلي الخطافات الخارجيين لاستخدام رمز الخطاف الجديد.
- لا يمكن أن يكون `hooks.path` هو `/`؛ استخدم مسارًا فرعيًا مخصصًا مثل `/hooks`.
- إذا كان `hooks.allowRequestSessionKey=true`، فقيّد `hooks.allowedSessionKeyPrefixes` (على سبيل المثال `["hook:"]`).
- إذا كان تعيين أو إعداد مسبق يستخدم `sessionKey` مُمَوْضَعًا بقالب، فاضبط `hooks.allowedSessionKeyPrefixes` و`hooks.allowRequestSessionKey=true`. لا تتطلب مفاتيح التعيين الثابتة هذا الاشتراك الصريح.

**نقاط النهاية:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - لا يُقبل `sessionKey` من حمولة الطلب إلا عندما يكون `hooks.allowRequestSessionKey=true` (الافتراضي: `false`).
- `POST /hooks/<name>` → يُحل عبر `hooks.mappings`
  - تُعامَل قيم `sessionKey` في التعيين المعروضة من القوالب كقيم مقدمة خارجيًا وتتطلب أيضًا `hooks.allowRequestSessionKey=true`.

<Accordion title="تفاصيل التعيين">

- يطابق `match.path` المسار الفرعي بعد `/hooks` (مثلًا `/hooks/gmail` → `gmail`).
- يطابق `match.source` حقل حمولة للمسارات العامة.
- تقرأ القوالب مثل `{{messages[0].subject}}` من الحمولة.
- يمكن أن يشير `transform` إلى وحدة JS/TS تُرجع إجراء خطاف.
  - يجب أن يكون `transform.module` مسارًا نسبيًا ويبقى داخل `hooks.transformsDir` (تُرفض المسارات المطلقة والتنقل خارج المسار).
  - أبقِ `hooks.transformsDir` ضمن `~/.openclaw/hooks/transforms`؛ تُرفض أدلة Skills في مساحة العمل. إذا أبلغ `openclaw doctor` أن هذا المسار غير صالح، فانقل وحدة التحويل إلى دليل تحويلات الخطافات أو أزل `hooks.transformsDir`.
- يوجّه `agentId` إلى وكيل محدد؛ تعود المعرّفات غير المعروفة إلى الوكيل الافتراضي.
- `allowedAgentIds`: يقيّد توجيه الوكيل الفعّال، بما في ذلك مسار الوكيل الافتراضي عند حذف `agentId` (`*` أو الحذف = السماح للجميع، `[]` = رفض الجميع).
- `defaultSessionKey`: مفتاح جلسة ثابت اختياري لتشغيلات وكيل الخطاف دون `sessionKey` صريح.
- `allowRequestSessionKey`: اسمح لمستدعي `/hooks/agent` ومفاتيح جلسات التعيين المدفوعة بالقوالب بتعيين `sessionKey` (الافتراضي: `false`).
- `allowedSessionKeyPrefixes`: قائمة سماح اختيارية بالبادئات لقيم `sessionKey` الصريحة (الطلب + التعيين)، مثل `["hook:"]`. تصبح مطلوبة عندما يستخدم أي تعيين أو إعداد مسبق `sessionKey` مُمَوْضَعًا بقالب.
- يرسل `deliver: true` الرد النهائي إلى قناة؛ وتكون قيمة `channel` الافتراضية هي `last`.
- يتجاوز `model` نموذج LLM لتشغيل هذا الخطاف (يجب أن يكون مسموحًا به إذا تم تعيين كتالوج النماذج).

</Accordion>

### تكامل Gmail

- يستخدم إعداد Gmail المسبق المضمّن `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- إذا أبقيت ذلك التوجيه لكل رسالة، فاضبط `hooks.allowRequestSessionKey: true` وقيّد `hooks.allowedSessionKeyPrefixes` لتطابق مساحة أسماء Gmail، على سبيل المثال `["hook:", "hook:gmail:"]`.
- إذا كنت تحتاج إلى `hooks.allowRequestSessionKey: false`، فتجاوز الإعداد المسبق باستخدام `sessionKey` ثابت بدلًا من الافتراضي المُمَوْضَع بقالب.

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

- يبدأ Gateway تلقائيًا تشغيل `gog gmail watch serve` عند الإقلاع عند تكوينه. اضبط `OPENCLAW_SKIP_GMAIL_WATCHER=1` للتعطيل.
- لا تشغّل `gog gmail watch serve` منفصلًا إلى جانب Gateway.

---

## مضيف Plugin اللوحة

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

- يقدّم HTML/CSS/JS قابلة لتحرير الوكيل وA2UI عبر HTTP تحت منفذ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- محلي فقط: أبقِ `gateway.bind: "loopback"` (الافتراضي).
- ربط غير local loopback: تتطلب مسارات اللوحة مصادقة Gateway (رمز/كلمة مرور/وكيل موثوق)، مثل أسطح HTTP الأخرى في Gateway.
- لا ترسل WebViews في Node عادةً ترويسات المصادقة؛ بعد إقران عقدة واتصالها، يعلن Gateway عناوين URL للقدرات ضمن نطاق العقدة للوصول إلى اللوحة/A2UI.
- ترتبط عناوين URL للقدرات بجلسة WS النشطة للعقدة وتنتهي صلاحيتها بسرعة. لا يُستخدم fallback المستند إلى IP.
- يحقن عميل إعادة التحميل المباشر في HTML المقدّم.
- ينشئ تلقائيًا ملف `index.html` مبدئيًا عندما يكون فارغًا.
- يقدّم A2UI أيضًا عند `/__openclaw__/a2ui/`.
- تتطلب التغييرات إعادة تشغيل Gateway.
- عطّل إعادة التحميل المباشرة للأدلة الكبيرة أو أخطاء `EMFILE`.

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

- `minimal` (الافتراضي عند تمكين Plugin `bonjour` المضمّن): احذف `cliPath` + `sshPort` من سجلات TXT.
- `full`: ضمّن `cliPath` + `sshPort`؛ لا يزال إعلان البث المتعدد على LAN يتطلب تمكين Plugin `bonjour` المضمّن.
- `off`: امنع إعلان البث المتعدد على LAN دون تغيير تمكين Plugin.
- يبدأ Plugin `bonjour` المضمّن تلقائيًا على مضيفي macOS ويكون اختياريًا على Linux وWindows ونشرات Gateway ضمن الحاويات.
- يكون اسم المضيف افتراضيًا اسم مضيف النظام عندما يكون تسمية DNS صالحة، مع الرجوع إلى `openclaw`. تجاوزه باستخدام `OPENCLAW_MDNS_HOSTNAME`.

### واسع النطاق (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

يكتب منطقة DNS-SD أحادية البث ضمن `~/.openclaw/dns/`. للاكتشاف عبر الشبكات، اقرنه بخادم DNS (يوصى بـ CoreDNS) + Tailscale split DNS.

الإعداد: `openclaw dns setup --apply`.

---

## البيئة

### `env` (متغيرات البيئة المضمّنة)

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

- لا تُطبَّق متغيرات البيئة المضمّنة إلا إذا كانت بيئة العملية تفتقد المفتاح.
- ملفات `.env`: ملف `.env` في CWD + `~/.openclaw/.env` (لا يتجاوز أي منهما المتغيرات الموجودة).
- `shellEnv`: يستورد المفاتيح المتوقعة المفقودة من ملف تعريف صدفة تسجيل الدخول.
- راجع [البيئة](/ar/help/environment) لمعرفة أسبقية كاملة.

### استبدال متغيرات البيئة

ارجع إلى متغيرات البيئة في أي سلسلة إعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- الأسماء ذات الأحرف الكبيرة فقط مطابقة: `[A-Z_][A-Z0-9_]*`.
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند تحميل الإعدادات.
- اخرجها باستخدام `$${VAR}` للحصول على `${VAR}` حرفية.
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
- معرف `source: "file"`: مؤشر JSON مطلق (على سبيل المثال `"/providers/openai/apiKey"`)
- نمط معرف `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (يدعم محددات على نمط AWS مثل `secret#json_key`)
- يجب ألا تحتوي معرفات `source: "exec"` على مقاطع مسار مفصولة بشرطة مائلة `.` أو `..` (على سبيل المثال يُرفض `a/../b`)

### سطح بيانات الاعتماد المدعوم

- المصفوفة القانونية: [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface)
- تستهدف `secrets apply` مسارات بيانات اعتماد `openclaw.json` المدعومة.
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

- يدعم موفر `file` الوضعين `mode: "json"` و`mode: "singleValue"` (يجب أن يكون `id` هو `"value"` في وضع singleValue).
- تفشل مسارات موفرَي الملفات والتنفيذ بشكل مغلق عندما لا يكون التحقق من Windows ACL متاحًا. اضبط `allowInsecurePath: true` فقط للمسارات الموثوقة التي لا يمكن التحقق منها.
- يتطلب موفر `exec` مسار `command` مطلقًا ويستخدم حمولات البروتوكول عبر stdin/stdout.
- افتراضيًا، تُرفض مسارات أوامر الروابط الرمزية. اضبط `allowSymlinkCommand: true` للسماح بمسارات الروابط الرمزية أثناء التحقق من مسار الهدف المحلول.
- إذا تم تكوين `trustedDirs`، فتنطبق عملية التحقق من الدليل الموثوق على مسار الهدف المحلول.
- تكون بيئة ابن `exec` في حدّها الأدنى افتراضيًا؛ مرّر المتغيرات المطلوبة صراحةً باستخدام `passEnv`.
- تُحل مراجع الأسرار وقت التفعيل إلى لقطة داخل الذاكرة، ثم تقرأ مسارات الطلب اللقطة فقط.
- ينطبق ترشيح السطح النشط أثناء التفعيل: تتسبب المراجع غير المحلولة على الأسطح الممكّنة في فشل بدء التشغيل/إعادة التحميل، بينما تُتخطى الأسطح غير النشطة مع تشخيصات.

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
- خرائط `auth-profiles.json` المسطحة القديمة مثل `{ "provider": { "apiKey": "..." } }` ليست تنسيقًا لوقت التشغيل؛ يعيد `openclaw doctor --fix` كتابتها إلى ملفات تعريف مفاتيح API قياسية بصيغة `provider:default` مع نسخة احتياطية `.legacy-flat.*.bak`.
- ملفات التعريف بوضع OAuth (`auth.profiles.<id>.mode = "oauth"`) لا تدعم بيانات اعتماد ملف تعريف المصادقة المدعومة بـ SecretRef.
- تأتي بيانات اعتماد وقت التشغيل الثابتة من لقطات محلولة في الذاكرة؛ وتُزال إدخالات `auth.json` الثابتة القديمة عند اكتشافها.
- يستورد OAuth القديم من `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: مدة التراجع الأساسية بالساعات عندما يفشل ملف تعريف بسبب أخطاء فوترة/رصيد غير كافٍ حقيقية (الافتراضي: `5`). قد يظل نص الفوترة الصريح يصل إلى هنا حتى في استجابات `401`/`403`، لكن مطابقات النص الخاصة بالمزوّد تبقى محددة النطاق بالمزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). تبقى رسائل HTTP `402` القابلة لإعادة المحاولة الخاصة بنافذة الاستخدام أو حد إنفاق المؤسسة/مساحة العمل ضمن مسار `rate_limit` بدلًا من ذلك.
- `billingBackoffHoursByProvider`: تجاوزات اختيارية لكل مزوّد لساعات تراجع الفوترة.
- `billingMaxHours`: الحد الأقصى بالساعات لنمو تراجع الفوترة الأُسّي (الافتراضي: `24`).
- `authPermanentBackoffMinutes`: مدة التراجع الأساسية بالدقائق لإخفاقات `auth_permanent` عالية الثقة (الافتراضي: `10`).
- `authPermanentMaxMinutes`: الحد الأقصى بالدقائق لنمو تراجع `auth_permanent` (الافتراضي: `60`).
- `failureWindowHours`: نافذة متحركة بالساعات تُستخدم لعدادات التراجع (الافتراضي: `24`).
- `overloadedProfileRotations`: الحد الأقصى لتدويرات ملف تعريف المصادقة لدى المزوّد نفسه عند أخطاء التحميل الزائد قبل الانتقال إلى بديل النموذج (الافتراضي: `1`). تقع هنا أشكال انشغال المزوّد مثل `ModelNotReadyException`.
- `overloadedBackoffMs`: تأخير ثابت قبل إعادة محاولة تدوير مزوّد/ملف تعريف محمّل زائدًا (الافتراضي: `0`).
- `rateLimitedProfileRotations`: الحد الأقصى لتدويرات ملف تعريف المصادقة لدى المزوّد نفسه عند أخطاء حد المعدل قبل الانتقال إلى بديل النموذج (الافتراضي: `1`). تشمل حاوية حد المعدل هذه نصوصًا مشكلة بحسب المزوّد مثل `Too many concurrent requests` و`ThrottlingException` و`concurrency limit reached` و`workers_ai ... quota limit exceeded` و`resource exhausted`.

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
- `maxFileBytes`: أقصى حجم لملف السجل النشط بالبايت قبل التدوير (عدد صحيح موجب؛ الافتراضي: `104857600` = 100 ميغابايت). يحتفظ OpenClaw بما يصل إلى خمسة أرشيفات مرقمة بجانب الملف النشط.
- `redactSensitive` / `redactPatterns`: إخفاء بأفضل جهد لمخرجات وحدة التحكم، وسجلات الملفات، وسجلات OTLP، ونصوص نسخ جلسات العمل المحفوظة. يعطّل `redactSensitive: "off"` سياسة السجل/النص العامة هذه فقط؛ ما زالت أسطح أمان الواجهة/الأدوات/التشخيصات تحجب الأسرار قبل الإرسال.

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

- `enabled`: مفتاح عام لمخرجات القياس والتتبّع (الافتراضي: `true`).
- `flags`: مصفوفة من سلاسل العلامات التي تفعّل مخرجات سجل موجّهة (تدعم أحرف البدل مثل `"telegram.*"` أو `"*"`).
- `stuckSessionWarnMs`: عتبة عمر عدم التقدم بالمللي ثانية لتصنيف جلسات المعالجة طويلة التشغيل على أنها `session.long_running` أو `session.stalled` أو `session.stuck`. تعيد الردود والأدوات والحالة والكتل وتقدم ACP ضبط المؤقت؛ وتتراجع تشخيصات `session.stuck` المتكررة ما دامت بلا تغيير.
- `stuckSessionAbortMs`: عتبة عمر عدم التقدم بالمللي ثانية قبل أن يصبح العمل النشط المتعثر مؤهلًا للتصريف بالإيقاف من أجل التعافي. عند عدم ضبطها، يستخدم OpenClaw نافذة التشغيل المضمنة الموسعة الأكثر أمانًا، وهي 5 دقائق على الأقل و3 أضعاف `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: تلتقط لقطة استقرار منقحة قبل نفاد الذاكرة عندما يصل ضغط الذاكرة إلى `critical` (الافتراضي: `false`). اضبطها على `true` لإضافة فحص/كتابة ملف حزمة الاستقرار مع إبقاء أحداث ضغط الذاكرة العادية.
- `otel.enabled`: يفعّل خط أنابيب تصدير OpenTelemetry (الافتراضي: `false`). للتكوين الكامل، وفهرس الإشارات، ونموذج الخصوصية، راجع [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
- `otel.endpoint`: عنوان URL للمجمّع لتصدير OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: نقاط نهاية OTLP اختيارية خاصة بالإشارة. عند ضبطها، تتجاوز `otel.endpoint` لتلك الإشارة فقط.
- `otel.protocol`: `"http/protobuf"` (الافتراضي) أو `"grpc"`.
- `otel.headers`: ترويسات بيانات وصفية إضافية لـ HTTP/gRPC تُرسل مع طلبات تصدير OTel.
- `otel.serviceName`: اسم الخدمة لسمات المورد.
- `otel.traces` / `otel.metrics` / `otel.logs`: تفعيل تصدير التتبّع أو المقاييس أو السجلات.
- `otel.logsExporter`: وجهة تصدير السجلات: `"otlp"` (الافتراضي)، أو `"stdout"` لكائن JSON واحد لكل سطر stdout، أو `"both"`.
- `otel.sampleRate`: معدل أخذ عينات التتبّع `0`-`1`.
- `otel.flushIntervalMs`: فاصل تفريغ القياسات الدورية بالمللي ثانية.
- `otel.captureContent`: التقاط اختياري للمحتوى الخام لسمات مقطع OTEL. يكون معطلًا افتراضيًا. تلتقط القيمة المنطقية `true` محتوى الرسائل/الأدوات غير النظامي؛ ويتيح لك شكل الكائن تفعيل `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`systemPrompt` و`toolDefinitions` صراحةً.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: متغير بيئة لتفعيل أحدث شكل تجريبي لمقاطع استدلال GenAI، بما في ذلك أسماء المقاطع `{gen_ai.operation.name} {gen_ai.request.model}`، ونوع المقطع `CLIENT`، و`gen_ai.provider.name` بدلًا من `gen_ai.system` القديم. افتراضيًا تحتفظ المقاطع بـ `openclaw.model.call` و`gen_ai.system` للتوافق؛ وتستخدم مقاييس GenAI سمات دلالية محدودة.
- `OPENCLAW_OTEL_PRELOADED=1`: متغير بيئة للمضيفين الذين سجّلوا مسبقًا SDK OpenTelemetry عامًا. عندها يتخطى OpenClaw بدء/إيقاف SDK المملوك للـ Plugin مع إبقاء مستمعي التشخيص نشطين.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` و`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` و`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: متغيرات بيئة لنقاط نهاية خاصة بالإشارة تُستخدم عندما يكون مفتاح التكوين المطابق غير مضبوط.
- `cacheTrace.enabled`: تسجيل لقطات تتبّع الذاكرة المخبئية للتشغيلات المضمنة (الافتراضي: `false`).
- `cacheTrace.filePath`: مسار إخراج JSONL لتتبّع الذاكرة المخبئية (الافتراضي: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: التحكم فيما يُضمَّن في مخرجات تتبّع الذاكرة المخبئية (كلها افتراضيًا: `true`).

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

- `enabled`: بوابة ميزة ACP العامة (الافتراضي: `true`؛ اضبطها على `false` لإخفاء إمكانات إرسال ACP والإنشاء).
- `dispatch.enabled`: بوابة مستقلة لإرسال دور جلسة ACP (الافتراضي: `true`). اضبطها على `false` لإبقاء أوامر ACP متاحة مع حظر التنفيذ.
- `backend`: معرّف الواجهة الخلفية الافتراضي لوقت تشغيل ACP (يجب أن يطابق Plugin وقت تشغيل ACP مسجلًا).
  ثبّت Plugin الواجهة الخلفية أولًا، وإذا كان `plugins.allow` مضبوطًا، فأدرج معرّف Plugin الواجهة الخلفية (مثل `acpx`) وإلا فلن تُحمَّل واجهة ACP الخلفية.
- `defaultAgent`: معرّف الوكيل الهدف الاحتياطي لـ ACP عندما لا تحدد عمليات الإنشاء هدفًا صريحًا.
- `allowedAgents`: قائمة سماح لمعرّفات الوكلاء المسموح بها لجلسات وقت تشغيل ACP؛ تعني القيمة الفارغة عدم وجود قيد إضافي.
- `maxConcurrentSessions`: الحد الأقصى لجلسات ACP النشطة في الوقت نفسه.
- `stream.coalesceIdleMs`: نافذة تفريغ الخمول بالمللي ثانية للنص المتدفق.
- `stream.maxChunkChars`: الحد الأقصى لحجم المقطع قبل تقسيم إسقاط الكتلة المتدفقة.
- `stream.repeatSuppression`: كتم أسطر الحالة/الأداة المتكررة لكل دور (الافتراضي: `true`).
- `stream.deliveryMode`: يبث `"live"` تدريجيًا؛ ويخزّن `"final_only"` مؤقتًا حتى أحداث نهاية الدور.
- `stream.hiddenBoundarySeparator`: الفاصل قبل النص المرئي بعد أحداث الأدوات المخفية (الافتراضي: `"paragraph"`).
- `stream.maxOutputChars`: الحد الأقصى لأحرف مخرجات المساعد المسقطة لكل دور ACP.
- `stream.maxSessionUpdateChars`: الحد الأقصى للأحرف لأسطر حالة/تحديث ACP المسقطة.
- `stream.tagVisibility`: سجل لأسماء الوسوم إلى تجاوزات رؤية منطقية للأحداث المتدفقة.
- `runtime.ttlMinutes`: مدة TTL للخمول بالدقائق لعاملَي جلسات ACP قبل أن يصبحوا مؤهلين للتنظيف.
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

- يتحكم `cli.banner.taglineMode` في نمط العبارة التعريفية للشعار:
  - `"random"` (الافتراضي): عبارات طريفة/موسمية متناوبة.
  - `"default"`: عبارة محايدة ثابتة (`All your chats, one OpenClaw.`).
  - `"off"`: بلا نص عبارة تعريفية (يبقى عنوان الشعار/الإصدار ظاهرًا).
- لإخفاء الشعار بالكامل (وليس العبارات التعريفية فقط)، اضبط env `OPENCLAW_HIDE_BANNER=1`.

---

## المعالج

بيانات وصفية تكتبها تدفقات الإعداد الموجّهة في CLI (`onboard`، `configure`، `doctor`):

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

## الجسر (قديم، تمت إزالته)

لم تعد الإصدارات الحالية تتضمن جسر TCP. تتصل العُقد عبر Gateway WebSocket. لم تعد مفاتيح `bridge.*` جزءًا من مخطط الإعدادات (يفشل التحقق حتى تُزال؛ يمكن لـ `openclaw doctor --fix` حذف المفاتيح غير المعروفة).

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

- `sessionRetention`: مدة الاحتفاظ بجلسات تشغيل Cron المعزولة المكتملة قبل تنقيتها من `sessions.json`. يتحكم أيضًا في تنظيف نصوص Cron المؤرشفة المحذوفة. الافتراضي: `24h`؛ اضبطه على `false` للتعطيل.
- `runLog.maxBytes`: مقبول للتوافق مع سجلات تشغيل Cron القديمة المدعومة بالملفات. الافتراضي: `2_000_000` بايت.
- `runLog.keepLines`: أحدث صفوف سجل التشغيل في SQLite المحتفظ بها لكل مهمة. الافتراضي: `2000`.
- `webhookToken`: رمز حامل يُستخدم لتسليم POST عبر Cron Webhook (`delivery.mode = "webhook"`)، وإذا حُذف فلن يُرسل ترويس مصادقة.
- `webhook`: عنوان URL احتياطي قديم ومهمل لـ Webhook (http/https) يستخدمه `openclaw doctor --fix` لترحيل المهام المخزنة التي لا تزال تحتوي على `notify: true`؛ يستخدم تسليم وقت التشغيل `delivery.mode="webhook"` لكل مهمة مع `delivery.to`، أو `delivery.completionDestination` عند الحفاظ على تسليم الإعلان.

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

- `maxAttempts`: الحد الأقصى لإعادات محاولة مهام Cron عند الأخطاء العابرة (الافتراضي: `3`؛ النطاق: `0`-`10`).
- `backoffMs`: مصفوفة تأخيرات التراجع بالمللي ثانية لكل محاولة إعادة (الافتراضي: `[30000, 60000, 300000]`؛ من 1 إلى 10 مُدخلات).
- `retryOn`: أنواع الأخطاء التي تطلق إعادة المحاولة - `"rate_limit"`، `"overloaded"`، `"network"`، `"timeout"`، `"server_error"`. احذفها لإعادة محاولة جميع الأنواع العابرة.

تبقى المهام أحادية التنفيذ مفعّلة حتى تُستنفد محاولات الإعادة، ثم تُعطّل مع الاحتفاظ بحالة الخطأ النهائية. تستخدم المهام المتكررة سياسة إعادة المحاولة نفسها للأخطاء العابرة للتشغيل مجددًا بعد التراجع قبل خانتها المجدولة التالية؛ أما الأخطاء الدائمة أو استنفاد إعادات المحاولة العابرة فتعود إلى الجدول المتكرر العادي مع تراجع الخطأ.

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
- `includeSkipped`: احتساب عمليات التشغيل المتخطاة المتتالية ضمن عتبة التنبيه (الافتراضي: `false`). تُتتبّع عمليات التشغيل المتخطاة بشكل منفصل ولا تؤثر في تراجع أخطاء التنفيذ.
- `mode`: وضع التسليم - يرسل `"announce"` عبر رسالة قناة؛ وينشر `"webhook"` إلى Webhook المُعد.
- `accountId`: حساب اختياري أو معرف قناة اختياري لتحديد نطاق تسليم التنبيه.

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

- الوجهة الافتراضية لإشعارات فشل Cron عبر جميع المهام.
- `mode`: `"announce"` أو `"webhook"`؛ يكون الافتراضي `"announce"` عند توفر بيانات هدف كافية.
- `channel`: تجاوز القناة لتسليم الإعلان. يعيد `"last"` استخدام آخر قناة تسليم معروفة.
- `to`: هدف إعلان صريح أو عنوان URL لـ Webhook. مطلوب لوضع Webhook.
- `accountId`: تجاوز حساب اختياري للتسليم.
- يتجاوز `delivery.failureDestination` لكل مهمة هذا الافتراضي العام.
- عندما لا تُعيَّن وجهة فشل عامة ولا لكل مهمة، تعود المهام التي تُسلَّم بالفعل عبر `announce` إلى هدف الإعلان الأساسي ذلك عند الفشل.
- لا يُدعم `delivery.failureDestination` إلا لمهام `sessionTarget="isolated"` ما لم يكن `delivery.mode` الأساسي للمهمة هو `"webhook"`.

راجع [مهام Cron](/ar/automation/cron-jobs). تُتتبّع تنفيذات Cron المعزولة بوصفها [مهام خلفية](/ar/automation/tasks).

---

## متغيرات قالب نموذج الوسائط

عناصر نائبة للقالب تُوسَّع في `tools.media.models[].args`:

| المتغير            | الوصف                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | نص الرسالة الواردة الكامل                         |
| `{{RawBody}}`      | النص الخام (بلا أغلفة السجل/المرسل)               |
| `{{BodyStripped}}` | النص بعد إزالة إشارات المجموعات                  |
| `{{From}}`         | معرّف المرسل                                      |
| `{{To}}`           | معرّف الوجهة                                      |
| `{{MessageSid}}`   | معرّف رسالة القناة                                |
| `{{SessionId}}`    | UUID الجلسة الحالية                               |
| `{{IsNewSession}}` | `"true"` عند إنشاء جلسة جديدة                     |
| `{{MediaUrl}}`     | عنوان URL زائف للوسائط الواردة                   |
| `{{MediaPath}}`    | مسار الوسائط المحلي                               |
| `{{MediaType}}`    | نوع الوسائط (صورة/صوت/مستند/…)                  |
| `{{Transcript}}`   | نص تفريغ الصوت                                    |
| `{{Prompt}}`       | مطالبة الوسائط المحلولة لإدخالات CLI             |
| `{{MaxChars}}`     | الحد الأقصى المحلول لأحرف الإخراج لإدخالات CLI   |
| `{{ChatType}}`     | `"direct"` أو `"group"`                           |
| `{{GroupSubject}}` | موضوع المجموعة (بأفضل جهد)                       |
| `{{GroupMembers}}` | معاينة أعضاء المجموعة (بأفضل جهد)                |
| `{{SenderName}}`   | اسم عرض المرسل (بأفضل جهد)                       |
| `{{SenderE164}}`   | رقم هاتف المرسل (بأفضل جهد)                      |
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

- ملف واحد: يستبدل الكائن الحاوي.
- مصفوفة ملفات: تُدمج بعمق بالترتيب (اللاحق يتجاوز السابق).
- المفاتيح الشقيقة: تُدمج بعد التضمينات (تتجاوز القيم المضمنة).
- التضمينات المتداخلة: حتى 10 مستويات عمق.
- المسارات: تُحل نسبةً إلى الملف الذي يضمّنها، لكن يجب أن تبقى داخل دليل الإعدادات الأعلى (`dirname` لـ `openclaw.json`). يُسمح بالصيغ المطلقة/`../` فقط عندما تظل تُحل داخل ذلك الحد. يجب ألا تحتوي المسارات على بايتات null ويجب أن تكون أقصر بصرامة من 4096 حرفًا قبل الحل وبعده.
- عمليات الكتابة المملوكة لـ OpenClaw التي تغيّر قسمًا واحدًا فقط من المستوى الأعلى ومدعومًا بتضمين ملف واحد تكتب عبر ذلك الملف المضمن. على سبيل المثال، يحدّث `plugins install` القيمة `plugins: { $include: "./plugins.json5" }` في `plugins.json5` ويترك `openclaw.json` كما هو.
- تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة للقراءة فقط بالنسبة إلى عمليات الكتابة المملوكة لـ OpenClaw؛ تفشل تلك الكتابات بإغلاق محكم بدل تسطيح الإعدادات.
- الأخطاء: رسائل واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية، وتنسيق المسار غير الصالح، والطول الزائد.

---

_ذات صلة: [الإعدادات](/ar/gateway/configuration) · [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [Doctor](/ar/gateway/doctor)_

## ذات صلة

- [الإعدادات](/ar/gateway/configuration)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
