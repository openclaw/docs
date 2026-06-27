---
read_when:
    - تكوين سياسة `tools.*` أو قوائم السماح أو الميزات التجريبية
    - تسجيل مزودي خدمات مخصصين أو تجاوز عناوين URL الأساسية
    - إعداد نقاط نهاية مستضافة ذاتيًا ومتوافقة مع OpenAI
sidebarTitle: Tools and custom providers
summary: تكوين الأدوات (السياسة، ومفاتيح التبديل التجريبية، والأدوات المدعومة بمزوّد) وإعداد المزوّد المخصص/عنوان URL الأساسي
title: Configuration — الأدوات والموفّرون المخصصون
x-i18n:
    generated_at: "2026-06-27T17:35:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

مفاتيح إعداد `tools.*` وإعداد المزوّد المخصص / عنوان URL الأساسي. للوكلاء والقنوات ومفاتيح الإعداد العليا الأخرى، راجع [مرجع الإعداد](/ar/gateway/configuration-reference).

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

<Note>
يضبط الإعداد المحلي الأولي الإعدادات المحلية الجديدة افتراضيًا على `tools.profile: "coding"` عندما تكون غير مضبوطة (تُحفظ ملفات التعريف الصريحة الموجودة).
</Note>

| ملف التعريف | يتضمن                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط                                                                                                                              |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | بلا قيود (مثل عدم الضبط)                                                                                                                          |

### مجموعات الأدوات

| المجموعة           | الأدوات                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (يُقبل `bash` كاسم بديل لـ `exec`)                                                   |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | كل الأدوات المضمنة (يستثني Plugins المزوّدين)                                                                           |
| `group:plugins`    | الأدوات التي تملكها Plugins المحملة، بما في ذلك خوادم MCP المهيأة والمكشوفة عبر `bundle-mcp`                            |

### أدوات MCP وPlugin داخل سياسة أدوات صندوق العزل

تُكشف خوادم MCP المهيأة كأدوات مملوكة لـPlugin تحت معرّف Plugin `bundle-mcp`. يمكن لملفات تعريف الأدوات العادية السماح بها، لكن `tools.sandbox.tools` بوابة إضافية للجلسات المعزولة. إذا كان وضع صندوق العزل هو `"all"` أو `"non-main"`، فأدرج أحد هذه الإدخالات في قائمة سماح أدوات صندوق العزل عندما ينبغي أن تكون أدوات MCP/Plugin مرئية:

- `bundle-mcp` لخوادم MCP التي يديرها OpenClaw من `mcp.servers`
- معرّف Plugin لـPlugin أصلي محدد
- `group:plugins` لكل الأدوات المملوكة لـPlugins المحملة
- أسماء أدوات خادم MCP الدقيقة أو أنماط الخوادم مثل `outlook__send_mail` أو `outlook__*` عندما تريد خادمًا واحدًا فقط

تستخدم أنماط الخوادم بادئة خادم MCP الآمنة للمزوّد، وليس بالضرورة مفتاح `mcp.servers` الخام. تصبح الأحرف غير ` [A-Za-z0-9_-]` `-`، وتحصل الأسماء التي لا تبدأ بحرف على بادئة `mcp-`، وقد تُقتطع البادئات الطويلة أو المكررة أو تُلحق بلواحق؛ على سبيل المثال، يستخدم `mcp.servers["Outlook Graph"]` نمطًا مثل `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

من دون إدخال طبقة صندوق العزل هذا، يمكن أن يظل خادم MCP محمّلًا بنجاح بينما تُرشّح أدواته قبل طلب المزوّد. استخدم `openclaw doctor` لاكتشاف هذا الشكل للخوادم التي يديرها OpenClaw في `mcp.servers`. تستخدم خوادم MCP المحملة من بيانات Plugins المضمنة أو Claude `.mcp.json` بوابة صندوق العزل نفسها، لكن هذا التشخيص لا يحصي تلك المصادر بعد؛ استخدم إدخالات قائمة السماح نفسها إذا اختفت أدواتها في الجولات المعزولة.

### `tools.codeMode`

يفعّل `tools.codeMode` سطح وضع الكود العام في OpenClaw. عند تفعيله
لتشغيل يحتوي على أدوات، لا يرى النموذج إلا `exec` و`wait`؛ تنتقل أدوات OpenClaw
العادية خلف جسر كتالوج `tools.*` داخل صندوق العزل، وتصبح أدوات MCP
متاحة عبر مساحة الأسماء `MCP` المولدة.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

ويُقبل الاختصار أيضًا:

```json5
{
  tools: { codeMode: true },
}
```

تُكشف تصريحات MCP عبر سطح ملف API افتراضي للقراءة فقط في
وضع الكود. يمكن لكود الضيف استدعاء `API.list("mcp")` و
`API.read("mcp/<server>.d.ts")` لفحص التواقيع بنمط TypeScript قبل
استدعاء `MCP.<server>.<tool>()`. راجع [وضع الكود](/ar/reference/code-mode) للاطلاع على
عقد وقت التشغيل والحدود وخطوات التصحيح.

### `tools.allow` / `tools.deny`

سياسة السماح/الرفض العامة للأدوات (الرفض يغلب). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. تُطبّق حتى عندما يكون صندوق عزل Docker متوقفًا.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` و`apply_patch` معرّفا أداتين منفصلان. يفعّل `allow: ["write"]` أيضًا `apply_patch` للنماذج المتوافقة، لكن `deny: ["write"]` لا يرفض `apply_patch`. لحظر كل تعديلات الملفات، ارفض `group:fs` أو اذكر كل أداة تعديل صراحة:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

يقيّد الأدوات أكثر لمزوّدين أو نماذج محددة. الترتيب: ملف التعريف الأساسي ← ملف تعريف المزوّد ← السماح/الرفض.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

يقيّد الأدوات لهوية طالب محددة. هذا دفاع متعمق فوق تحكم وصول القناة؛ يجب أن تأتي قيم المرسل من موائم القناة، وليس من نص الرسالة.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

تستخدم المفاتيح بادئات صريحة: `channel:<channelId>:<senderId>` أو `id:<senderId>` أو `e164:<phone>` أو `username:<handle>` أو `name:<displayName>` أو `"*"`. معرّفات القنوات هي معرّفات OpenClaw القانونية؛ تُطبّع الأسماء البديلة مثل `teams` إلى `msteams`. تُقبل المفاتيح القديمة غير المسبوقة كـ`id:` فقط. ترتيب المطابقة هو القناة+المعرّف، ثم المعرّف، ثم e164، ثم اسم المستخدم، ثم الاسم، ثم حرف البدل.

يتجاوز `agents.list[].tools.toolsBySender` لكل وكيل مطابقة المرسل العامة عندما يطابق، حتى مع سياسة فارغة `{}`.

### `tools.elevated`

يتحكم في وصول `exec` المرتفع خارج صندوق العزل:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- لا يمكن لتجاوز كل وكيل (`agents.list[].tools.elevated`) إلا أن يزيد التقييد.
- يخزن `/elevated on|off|ask|full` الحالة لكل جلسة؛ تنطبق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع العزل ويستخدم مسار الهروب المهيأ (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

فحوص سلامة حلقات الأدوات **معطلة افتراضيًا**. اضبط `enabled: true` لتفعيل الاكتشاف. يمكن تعريف الإعدادات عالميًا في `tools.loopDetection` وتجاوزها لكل وكيل عند `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  الحد الأقصى لسجل استدعاءات الأدوات المحتفظ به لتحليل الحلقات.
</ParamField>
<ParamField path="warningThreshold" type="number">
  عتبة نمط التكرار بلا تقدم للتحذيرات.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  عتبة تكرار أعلى لحظر الحلقات الحرجة.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  عتبة إيقاف صارمة لأي تشغيل بلا تقدم.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  التحذير عند تكرار استدعاءات الأداة نفسها/الوسائط نفسها.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  التحذير/الحظر عند أدوات الاستطلاع المعروفة (`process.poll`، `command_status`، إلخ).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  التحذير/الحظر عند أنماط الأزواج المتناوبة بلا تقدم.
</ParamField>

<Warning>
إذا كان `warningThreshold >= criticalThreshold` أو `criticalThreshold >= globalCircuitBreakerThreshold`، يفشل التحقق.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

يضبط فهم الوسائط الواردة (الصور/الصوت/الفيديو):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="حقول إدخال نموذج الوسائط">
    **إدخال الموفّر** (`type: "provider"` أو محذوف):

    - `provider`: معرّف موفّر API (`openai`، `anthropic`، `google`/`gemini`، `groq`، إلخ.)
    - `model`: تجاوز معرّف النموذج
    - `profile` / `preferredProfile`: اختيار ملف تعريف `auth-profiles.json`

    **إدخال CLI** (`type: "cli"`):

    - `command`: الملف التنفيذي المراد تشغيله
    - `args`: وسائط بنمط القوالب (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}`، إلخ؛ ينقل `openclaw doctor --fix` العناصر النائبة المهملة `{input}` إلى `{{MediaPath}}`)

    **الحقول المشتركة:**

    - `capabilities`: قائمة اختيارية (`image`، `audio`، `video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` ← صورة، `google` ← صورة+صوت+فيديو، `groq` ← صوت.
    - `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
    - تنطبق أيضًا إدخالات `tools.media.image.timeoutSeconds` وإدخالات نموذج الصورة المطابقة `timeoutSeconds` عندما يستدعي الوكيل أداة `image` الصريحة. لفهم الصور، تنطبق هذه المهلة على الطلب نفسه ولا تُخفّض بسبب أعمال التحضير السابقة.
    - تعود الإخفاقات إلى الإدخال التالي.

    تتبع مصادقة الموفّر الترتيب القياسي: `auth-profiles.json` ← متغيرات البيئة ← `models.providers.*.apiKey`.

    **حقول الإكمال غير المتزامن:**

    - `asyncCompletion.directSend`: علم توافق مهمل. تبقى مهام الوسائط غير المتزامنة المكتملة متوسطة عبر جلسة الطالب بحيث يتلقى الوكيل النتيجة، ويقرر كيفية إخبار المستخدم، ويستخدم أداة الرسائل عندما يتطلب التسليم من المصدر ذلك.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

يتحكم في الجلسات التي يمكن استهدافها بأدوات الجلسات (`sessions_list` و`sessions_history` و`sessions_send`).

الافتراضي: `tree` (الجلسة الحالية + الجلسات التي أنشأتها، مثل الوكلاء الفرعيين).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="نطاقات الرؤية">
    - `self`: مفتاح الجلسة الحالية فقط.
    - `tree`: الجلسة الحالية + الجلسات التي أنشأتها الجلسة الحالية (الوكلاء الفرعيون).
    - `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (يمكن أن تشمل مستخدمين آخرين إذا شغّلت جلسات لكل مُرسِل تحت معرّف الوكيل نفسه).
    - `all`: أي جلسة. لا يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
    - تقييد Sandbox: عندما تكون الجلسة الحالية داخل Sandbox ويكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض الرؤية على `tree` حتى إذا كان `tools.sessions.visibility="all"`.
    - عندما لا تكون `all`، يتضمن `sessions_list` حقل `visibility` مضغوطًا
      يصف الوضع الفعّال وتحذيرًا بأن بعض الجلسات قد تكون
      محذوفة خارج النطاق الحالي.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمنة لـ`sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ملاحظات المرفقات">
    - تتطلب المرفقات `enabled: true`.
    - تُجسّد مرفقات الوكلاء الفرعيين داخل مساحة عمل الابن في `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
    - مرفقات ACP مخصصة للصور فقط وتُمرّر مضمنة إلى وقت تشغيل ACP بعد اجتياز حدود عدد الملفات نفسها، والبايتات لكل ملف، وإجمالي البايتات.
    - يُنقّح محتوى المرفقات تلقائيًا من استمرارية النسخ النصية.
    - تُتحقق مدخلات Base64 بفحوصات صارمة للأبجدية/الحشو وحارس حجم قبل فك الترميز.
    - أذونات ملفات مرفقات الوكلاء الفرعيين هي `0700` للأدلة و`0600` للملفات.
    - يتبع تنظيف الوكيل الفرعي سياسة `cleanup`: يزيل `delete` المرفقات دائمًا؛ ويحتفظ بها `keep` فقط عندما يكون `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

أعلام الأدوات المضمنة التجريبية. تكون معطلة افتراضيًا ما لم تنطبق قاعدة تفعيل تلقائي صارمة لوكيل GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: يفعّل أداة `update_plan` المنظمة لتتبع الأعمال غير البسيطة متعددة الخطوات.
- الافتراضي: `false` ما لم يُضبط `agents.defaults.embeddedAgent.executionContract` (أو تجاوز لكل وكيل) على `"strict-agentic"` لتشغيل من عائلة GPT-5 عبر OpenAI أو OpenAI Codex. اضبطه على `true` لفرض تشغيل الأداة خارج ذلك النطاق، أو `false` لإبقائها متوقفة حتى لتشغيلات GPT-5 ذات الوكالة الصارمة.
- عند التفعيل، تضيف مطالبة النظام أيضًا إرشادات استخدام بحيث لا يستخدمها النموذج إلا للعمل الجوهري ويحافظ على خطوة واحدة على الأكثر بحالة `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: النموذج الافتراضي للوكلاء الفرعيين المنشأين. إذا حُذف، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء الهدف المكوّنة لـ`sessions_spawn` عندما لا يضبط الوكيل الطالب `subagents.allowAgents` الخاصة به (`["*"]` = أي هدف مكوّن؛ الافتراضي: الوكيل نفسه فقط). يرفض `sessions_spawn` الإدخالات القديمة التي حُذف تكوين وكيلها وتُحذف من `agents_list`؛ شغّل `openclaw doctor --fix` لتنظيفها.
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ`sessions_spawn`. تعني `0` عدم وجود مهلة.
- `announceTimeoutMs`: مهلة كل استدعاء (بالميلي ثانية) لمحاولات تسليم إعلان Gateway `agent`. الافتراضي: `120000`. قد تجعل إعادة المحاولة العابرة إجمالي انتظار الإعلان أطول من مهلة واحدة مكوّنة.
- سياسة أدوات كل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## الموفّرون المخصصون وعناوين URL الأساسية

تنشر Plugins الموفّرين صفوف كتالوج النماذج الخاصة بها. أضف الموفّرين المخصصين عبر `models.providers` في التكوين أو `~/.openclaw/agents/<agentId>/agent/models.json`.

يُعد تكوين `baseUrl` لموفّر مخصص/محلي أيضًا قرار ثقة الشبكة الضيق لطلبات HTTP الخاصة بالنموذج: يسمح OpenClaw بذلك الأصل الدقيق `scheme://host:port` عبر مسار الجلب المحروس، من دون إضافة خيار تكوين منفصل أو الوثوق بأصول خاصة أخرى.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="المصادقة وأسبقية الدمج">
    - استخدم `authHeader: true` + `headers` لاحتياجات المصادقة المخصصة.
    - تجاوز جذر تكوين الوكيل باستخدام `OPENCLAW_AGENT_DIR`.
    - أسبقية الدمج لمعرّفات الموفّرين المطابقة:
      - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاص بالوكيل.
      - تفوز قيم `apiKey` غير الفارغة في الوكيل فقط عندما لا يكون ذلك الموفّر مُدارًا عبر SecretRef في سياق التكوين/ملف تعريف المصادقة الحالي.
      - تُحدّث قيم `apiKey` للموفّر المُدار عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلًا من استمرار الأسرار المحلولة.
      - تُحدّث قيم ترويسة الموفّر المُدار عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
      - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة في الوكيل إلى `models.providers` في التكوين.
      - يستخدم `contextWindow`/`maxTokens` للنموذج المطابق القيمة الأعلى بين قيم التكوين الصريحة وقيم الكتالوج الضمنية.
      - يحافظ `contextTokens` للنموذج المطابق على سقف وقت تشغيل صريح عند وجوده؛ استخدمه لتقييد السياق الفعّال دون تغيير بيانات تعريف النموذج الأصلية.
      - تُخزن كتالوجات Plugin الموفّر كأجزاء كتالوج مولّدة ومملوكة لـPlugin تحت حالة Plugin الخاصة بالوكيل.
      - استخدم `models.mode: "replace"` عندما تريد أن يعيد التكوين كتابة `models.json` وأجزاء كتالوج Plugin النشطة بالكامل.
      - استمرار العلامات مصدره موثوق: تُكتب العلامات من لقطة تكوين المصدر النشطة (قبل الحل)، وليس من قيم أسرار وقت التشغيل المحلولة.

  </Accordion>
</AccordionGroup>

### تفاصيل حقول الموفّر

<AccordionGroup>
  <Accordion title="الكتالوج عالي المستوى">
    - `models.mode`: سلوك كتالوج الموفّرين (`merge` أو `replace`).
    - `models.providers`: خريطة الموفّرين المخصصين مفهرسة بمعرّف الموفّر.
      - تعديلات آمنة: استخدم `openclaw config set models.providers.<id> '<json>' --strict-json --merge` أو `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` للتحديثات الإضافية. يرفض `config set` الاستبدالات المدمرة ما لم تمرر `--replace`.

  </Accordion>
  <Accordion title="اتصال المزوّد والمصادقة">
    - `models.providers.*.api`: محوّل الطلبات (`openai-completions`، `openai-responses`، `anthropic-messages`، `google-generative-ai`، إلخ). للواجهات الخلفية ذاتية الاستضافة `/v1/chat/completions` مثل MLX وvLLM وSGLang ومعظم الخوادم المحلية المتوافقة مع OpenAI، استخدم `openai-completions`. المزوّد المخصص الذي يحتوي على `baseUrl` لكن لا يحتوي على `api` يستخدم افتراضيًا `openai-completions`؛ اضبط `openai-responses` فقط عندما تدعم الواجهة الخلفية `/v1/responses`.
    - `models.providers.*.apiKey`: بيانات اعتماد المزوّد (يفضّل استخدام SecretRef/استبدال env).
    - `models.providers.*.auth`: استراتيجية المصادقة (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: نافذة السياق الأصلية الافتراضية للنماذج ضمن هذا المزوّد عندما لا يعيّن إدخال النموذج `contextWindow`.
    - `models.providers.*.contextTokens`: الحد الافتراضي الفعلي لسياق وقت التشغيل للنماذج ضمن هذا المزوّد عندما لا يعيّن إدخال النموذج `contextTokens`.
    - `models.providers.*.maxTokens`: الحد الافتراضي لرموز الإخراج للنماذج ضمن هذا المزوّد عندما لا يعيّن إدخال النموذج `maxTokens`.
    - `models.providers.*.timeoutSeconds`: مهلة اختيارية لكل مزوّد لطلبات HTTP الخاصة بالنموذج بالثواني، وتشمل الاتصال والرؤوس والجسم ومعالجة إلغاء الطلب بالكامل.
    - `models.providers.*.injectNumCtxForOpenAICompat`: من أجل Ollama + `openai-completions`، يحقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
    - `models.providers.*.authHeader`: فرض نقل بيانات الاعتماد في رأس `Authorization` عند الحاجة.
    - `models.providers.*.baseUrl`: عنوان URL الأساسي لواجهة API الصاعدة.
    - `models.providers.*.headers`: رؤوس ثابتة إضافية لتوجيه الوكيل/المستأجر.

  </Accordion>
  <Accordion title="تجاوزات نقل الطلبات">
    `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بمزوّد النموذج.

    - `request.headers`: رؤوس إضافية (تُدمج مع افتراضيات المزوّد). تقبل القيم SecretRef.
    - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` (استخدام مصادقة المزوّد المدمجة)، `"authorization-bearer"` (مع `token`)، `"header"` (مع `headerName` و`value` و`prefix` اختياري).
    - `request.proxy`: تجاوز وكيل HTTP. الأوضاع: `"env-proxy"` (استخدام متغيرات env `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (مع `url`). يقبل كلا الوضعين كائنًا فرعيًا اختياريًا `tls`.
    - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca`، `cert`، `key`، `passphrase` (كلها تقبل SecretRef)، `serverName`، `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: عندما تكون `true`، يسمح بطلبات HTTP الخاصة بمزوّد النموذج إلى النطاقات الخاصة أو CGNAT أو النطاقات المشابهة عبر حارس جلب HTTP للمزوّد. عناوين URL الأساسية للمزوّد المخصص/المحلي تثق مسبقًا بالأصل المضبوط بدقة، باستثناء أصول البيانات الوصفية/الرابط المحلي، التي تبقى محظورة دون تفعيل صريح. اضبط هذا على `false` لإلغاء الثقة بالأصل الدقيق. يستخدم WebSocket نفس `request` للرؤوس/TLS ولكن ليس بوابة SSRF الخاصة بذلك الجلب. الافتراضي `false`.

  </Accordion>
  <Accordion title="إدخالات كتالوج النماذج">
    - `models.providers.*.models`: إدخالات كتالوج نماذج المزوّد الصريحة.
    - `models.providers.*.models.*.input`: وسائط إدخال النموذج. استخدم `["text"]` للنماذج النصية فقط و`["text", "image"]` لنماذج الصور/الرؤية الأصلية. لا تُحقن مرفقات الصور في دورات الوكيل إلا عندما يكون النموذج المحدد معلّمًا بأنه يدعم الصور.
    - `models.providers.*.models.*.contextWindow`: بيانات وصفية لنافذة سياق النموذج الأصلية. يتجاوز هذا `contextWindow` على مستوى المزوّد لذلك النموذج.
    - `models.providers.*.models.*.contextTokens`: حد اختياري لسياق وقت التشغيل. يتجاوز هذا `contextTokens` على مستوى المزوّد؛ استخدمه عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج؛ يعرض `openclaw models list` كلتا القيمتين عندما تختلفان.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير أصلي وغير فارغ (مضيف ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة على `false` في وقت التشغيل. يحافظ `baseUrl` الفارغ/المحذوف على سلوك OpenAI الافتراضي.
    - `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية الدردشة المتوافقة مع OpenAI التي تقبل السلاسل فقط. عندما تكون `true`، يسطّح OpenClaw مصفوفات النص الخالص `messages[].content` إلى سلاسل عادية قبل إرسال الطلب.
    - `models.providers.*.models.*.compat.strictMessageKeys`: تلميح توافق اختياري لنقاط نهاية الدردشة المتوافقة مع OpenAI والصارمة. عندما تكون `true`، يجرّد OpenClaw كائنات رسائل Chat Completions الصادرة إلى `role` و`content` قبل إرسال الطلب.
    - `models.providers.*.models.*.compat.thinkingFormat`: تلميح اختياري لحمولة التفكير. استخدم `"together"` من أجل `reasoning.enabled` بأسلوب Together، أو `"qwen"` من أجل `enable_thinking` في المستوى الأعلى، أو `"qwen-chat-template"` من أجل `chat_template_kwargs.enable_thinking` على خوادم عائلة Qwen المتوافقة مع OpenAI التي تدعم kwargs لقالب الدردشة على مستوى الطلب، مثل vLLM. تعرض نماذج vLLM Qwen المضبوطة خيارات `/think` ثنائية (`off`، `on`) لهذه التنسيقات.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: تلميح توافق اختياري للواجهات الخلفية Chat Completions بأسلوب DeepSeek التي تتطلب من رسائل المساعد السابقة الاحتفاظ بـ `reasoning_content` عند إعادة التشغيل. عندما تكون `true`، يحافظ OpenClaw على ذلك الحقل في رسائل المساعد الصادرة. استخدم هذا عند توصيل وكيل مخصص متوافق مع DeepSeek يرفض الطلبات بعد تجريد التفكير. الافتراضي `false`.

  </Accordion>
  <Accordion title="اكتشاف Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي في Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS للاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف المزوّد من أجل الاكتشاف المستهدف.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصل الاستقصاء لتحديث الاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة سياق احتياطية للنماذج المكتشفة.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الأقصى الاحتياطي لرموز الإخراج للنماذج المكتشفة.

  </Accordion>
</AccordionGroup>

يستنتج إعداد المزوّد المخصص التفاعلي إدخال الصور لمعرّفات نماذج الرؤية الشائعة مثل GPT-4o وClaude وGemini وQwen-VL وLLaVA وPixtral وInternVL وMllama وMiniCPM-V وGLM-4V، ويتخطى السؤال الإضافي للعائلات المعروفة بأنها نصية فقط. ما زالت معرّفات النماذج غير المعروفة تطلب دعم الصور. يستخدم الإعداد غير التفاعلي الاستنتاج نفسه؛ مرّر `--custom-image-input` لفرض بيانات وصفية تدعم الصور أو `--custom-text-input` لفرض بيانات وصفية نصية فقط.

### أمثلة المزوّدين

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    يمكن لـ Plugin المزوّد الخارجي الرسمي `cerebras` ضبط هذا عبر `openclaw onboard --auth-choice cerebras-api-key`. استخدم إعدادات مزوّد صريحة فقط عند تجاوز الافتراضيات.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    استخدم `cerebras/zai-glm-4.7` من أجل Cerebras؛ و`zai/glm-4.7` للوصول المباشر إلى Z.AI.

  </Accordion>
  <Accordion title="ترميز Kimi">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    متوافق مع Anthropic ومزوّد مدمج. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="النماذج المحلية (LM Studio)">
    راجع [النماذج المحلية](/ar/gateway/local-models). الخلاصة: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ وأبقِ النماذج المستضافة مدمجة كاحتياط.
  </Accordion>
  <Accordion title="MiniMax M3 (مباشر)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    اضبط `MINIMAX_API_KEY`. الاختصارات: `openclaw onboard --auth-choice minimax-global-api` أو `openclaw onboard --auth-choice minimax-cn-api`. يستخدم كتالوج النماذج M3 افتراضيًا ويتضمن أيضًا متغيرات M2.7. على مسار البث المتوافق مع Anthropic، يعطّل OpenClaw التفكير في MiniMax M2.x افتراضيًا ما لم تضبط `thinking` بنفسك صراحة؛ أما MiniMax-M3 (وM3.x) فيبقى افتراضيًا على مسار التفكير المحذوف/التكيفي الخاص بالمزوّد. يعيد `/fast on` أو `params.fastMode: true` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    بالنسبة إلى نقطة النهاية في الصين: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

    تعلن نقاط نهاية Moonshot الأصلية توافق استخدام البث على نقل `openai-completions` المشترك، ويربط OpenClaw ذلك بقدرات نقطة النهاية بدلًا من معرّف المزوّد المدمج وحده.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    اضبط `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`). استخدم مراجع `opencode/...` لكتالوج Zen أو مراجع `opencode-go/...` لكتالوج Go. الاختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (متوافق مع Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    يجب أن يحذف عنوان URL الأساسي الجزء `/v1` (يضيفه عميل Anthropic). اختصار: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    عيّن `ZAI_API_KEY`. تستخدم مراجع النماذج معرّف المزوّد القياسي `zai/*`. اختصار: `openclaw onboard --auth-choice zai-api-key`.

    - نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
    - نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
    - بالنسبة إلى نقطة النهاية العامة، عرّف مزوّدًا مخصصًا مع تجاوز عنوان URL الأساسي.

  </Accordion>
</AccordionGroup>

---

## ذو صلة

- [الإعداد — الوكلاء](/ar/gateway/config-agents)
- [الإعداد — القنوات](/ar/gateway/config-channels)
- [مرجع الإعداد](/ar/gateway/configuration-reference) — مفاتيح أخرى في المستوى الأعلى
- [الأدوات وPlugin](/ar/tools)
