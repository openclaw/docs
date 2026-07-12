---
read_when:
    - تكوين سياسة `tools.*` أو قوائم السماح أو الميزات التجريبية
    - تسجيل موفّرين مخصّصين أو تجاوز عناوين URL الأساسية
    - إعداد نقاط نهاية مستضافة ذاتيًا ومتوافقة مع OpenAI
sidebarTitle: Tools and custom providers
summary: إعدادات الأدوات (السياسة، ومفاتيح التبديل التجريبية، والأدوات المدعومة من المزوّد) وإعداد المزوّد المخصّص/عنوان URL الأساسي
title: الإعداد — الأدوات والموفّرون المخصّصون
x-i18n:
    generated_at: "2026-07-12T05:50:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

مفاتيح الإعداد `tools.*` وإعداد المزوّد المخصّص / عنوان URL الأساسي. للوكلاء والقنوات ومفاتيح الإعداد الأخرى ذات المستوى الأعلى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## الأدوات

### ملفات تعريف الأدوات

يحدّد `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

<Note>
تضبط عملية الإعداد المحلية افتراضيًا الإعدادات المحلية الجديدة على `tools.profile: "coding"` عندما لا تكون محددة (مع الحفاظ على ملفات التعريف الصريحة الحالية).
</Note>

| ملف التعريف | يتضمن |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط |
| `coding`    | `group:fs`، `group:runtime`، `group:web`، `group:sessions`، `group:memory`، `cron`، `get_goal`، `create_goal`، `update_goal`، `update_plan`، `skill_workshop`، `image`، `image_generate`، `music_generate`، `video_generate` |
| `messaging` | `group:messaging`، `sessions_list`، `sessions_history`، `sessions_send`، `session_status` |
| `full`      | بلا قيود (كما لو لم يكن محددًا) |

يسمح `coding` و`messaging` أيضًا ضمنيًا بـ `bundle-mcp` (خوادم MCP التي تم إعدادها).

### مجموعات الأدوات

| المجموعة | الأدوات |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`، `process`، `code_execution` (يُقبل `bash` كاسم بديل لـ `exec`) |
| `group:fs`         | `read`، `write`، `edit`، `apply_patch` |
| `group:sessions`   | `sessions_list`، `sessions_history`، `sessions_send`، `sessions_spawn`، `sessions_yield`، `subagents`، `session_status`، `spawn_task`، `dismiss_task` |
| `group:memory`     | `memory_search`، `memory_get` |
| `group:web`        | `web_search`، `x_search`، `web_fetch` |
| `group:ui`         | `browser`، `canvas` |
| `group:automation` | `heartbeat_respond`، `cron`، `gateway` |
| `group:messaging`  | `message` |
| `group:nodes`      | `nodes`، `computer` |
| `group:agents`     | `agents_list`، `get_goal`، `create_goal`، `update_goal`، `update_plan`، `skill_workshop` |
| `group:media`      | `image`، `image_generate`، `music_generate`، `video_generate`، `tts` |
| `group:openclaw`   | جميع الأدوات المضمّنة أعلاه باستثناء `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (لا تشمل أدوات الإضافات) |
| `group:plugins`    | الأدوات المملوكة للإضافات المحمّلة، بما فيها خوادم MCP التي تم إعدادها والمكشوفة عبر `bundle-mcp` |

تتيح `spawn_task` لوكيل برمجة اقتراح عمل متابعة مؤكَّد من دون بدئه. تعرض واجهة التحكم العنوان والملخص على هيئة شارة قابلة للتنفيذ؛ وتعرض TUI مدعومة من Gateway مطالبة تفاعلية مكافئة. يؤدي قبول أيٍّ منهما إلى إنشاء جلسة جديدة في شجرة عمل مُدارة وإرسال المطالبة الكاملة إليها، بينما تستمر الجولة الحالية. تسحب `dismiss_task` اقتراحًا لا يزال معلّقًا باستخدام `task_id` المؤقت الذي أعادته `spawn_task`.

لا تُعرض الأدوات إلا عندما يكون سطح المشغّل الذي بدأ العملية قادرًا على استقبال أحداث اقتراح المهام من Gateway والتعامل معها. لا تتلقاها جلسات القنوات ولا جلسات TUI المحلية/المضمّنة؛ وتحتاج وسائل نقل القنوات إلى إجراء مهام نمطي قابل للنقل قبل أن تتمكن من إتاحة هذا التدفق بأمان. تكون الاقتراحات محلية للعملية وتختفي عند إعادة تشغيل Gateway. تظل الأداتان ضمن ملف التعريف `coding` والمجموعة `group:sessions`، ولذلك تضبطهما سياسة `tools.allow` و`tools.deny` العادية تلقائيًا عندما يدعمهما السطح.

### أدوات MCP والإضافات ضمن سياسة أدوات البيئة المعزولة

تُكشف خوادم MCP التي تم إعدادها بوصفها أدوات مملوكة للإضافات تحت معرّف الإضافة `bundle-mcp`. يمكن لملفات تعريف الأدوات العادية السماح بها، لكن `tools.sandbox.tools` تمثّل بوابة إضافية للجلسات المعزولة. إذا كان وضع البيئة المعزولة هو `"all"` أو `"non-main"`، فأدرج أحد الإدخالات التالية في قائمة سماح أدوات البيئة المعزولة عندما ينبغي أن تكون أدوات MCP/الإضافات مرئية:

- `bundle-mcp` لخوادم MCP المُدارة بواسطة OpenClaw من `mcp.servers`
- معرّف الإضافة لإضافة أصلية محددة
- `group:plugins` لجميع الأدوات المملوكة للإضافات المحمّلة
- أسماء أدوات خادم MCP الدقيقة أو أنماط الخوادم العامة مثل `outlook__send_mail` أو `outlook__*` عندما تريد خادمًا واحدًا فقط

تستخدم أنماط الخوادم العامة بادئة خادم MCP الآمنة للمزوّد، وليس بالضرورة مفتاح `mcp.servers` الخام. تتحول الأحرف غير التابعة للنطاق `[A-Za-z0-9_-]` إلى `-`، وتحصل الأسماء التي لا تبدأ بحرف على البادئة `mcp-`، وقد تُقتطع البادئات الطويلة أو المكررة أو تُلحق بها لاحقة؛ فعلى سبيل المثال، يستخدم `mcp.servers["Outlook Graph"]` نمطًا عامًا مثل `outlook-graph__*`.

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

من دون هذا الإدخال في طبقة البيئة المعزولة، قد يستمر تحميل خادم MCP بنجاح، بينما تُرشّح أدواته قبل طلب المزوّد. استخدم `openclaw doctor` لاكتشاف هذا النمط لخوادم MCP المُدارة بواسطة OpenClaw في `mcp.servers`. تستخدم خوادم MCP المحمّلة من بيانات الإضافات المضمّنة أو ملف Claude `.mcp.json` بوابة البيئة المعزولة نفسها، لكن هذا التشخيص لا يسرد هذه المصادر حتى الآن؛ استخدم إدخالات قائمة السماح نفسها إذا اختفت أدواتها في الجولات المعزولة.

### `tools.codeMode`

يفعّل `tools.codeMode` سطح وضع البرمجة العام في OpenClaw. عند تفعيله
لتشغيل يتضمن أدوات، تنتقل أدوات OpenClaw العادية خلف جسر كتالوج `tools.*`
داخل البيئة المعزولة، وتصبح أدوات MCP متاحة عبر نطاق الأسماء `MCP`
المُنشأ. يرى النموذج عادةً `exec` و`wait`؛ وتظل الأدوات مثل `computer`
التي لا يمكن لنتائجها المنظّمة عبور الجسر المقتصر على JSON مباشرةً.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

يُقبل الاختصار أيضًا:

```json5
{
  tools: { codeMode: true },
}
```

تُكشف تعريفات MCP عبر سطح ملفات API الافتراضي للقراءة فقط في
وضع البرمجة. يمكن لشفرة الضيف استدعاء `API.list("mcp")` و
`API.read("mcp/<server>.d.ts")` لفحص التواقيع المشابهة لـ TypeScript قبل
استدعاء `MCP.<server>.<tool>()`. راجع [وضع البرمجة](/ar/reference/code-mode) للاطلاع على
عقد وقت التشغيل والقيود وخطوات تصحيح الأخطاء.

### `tools.allow` / `tools.deny`

سياسة عامة للسماح بالأدوات أو منعها (المنع له الأولوية). لا تراعي حالة الأحرف، وتدعم أحرف البدل `*`. تُطبَّق حتى عندما يكون وضع الحماية Docker متوقفًا.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

يُعدّ `write` و`apply_patch` معرّفي أداتين منفصلتين. يؤدي `allow: ["write"]` أيضًا إلى تمكين `apply_patch` للنماذج المتوافقة، لكن `deny: ["write"]` لا يمنع `apply_patch`. لمنع جميع تعديلات الملفات، امنع `group:fs` أو أدرج كل أداة تعديل صراحةً:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
لا يمكن تعيين `allow` و`alsoAllow` معًا في النطاق نفسه (`tools` أو `tools.byProvider.<id>` أو `agents.list[].tools`) — إذ يرفض التحقق من صحة الإعداد ذلك. ادمج إدخالات `alsoAllow` في `allow`، أو احذف `allow` واستخدم `profile` مع `alsoAllow` بدلًا منه.
</Note>

### `tools.byProvider`

يفرض قيودًا إضافية على الأدوات لموفّرين أو نماذج محددة. الترتيب: ملف التعريف الأساسي ← ملف تعريف الموفّر ← السماح/المنع.

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

يفرض قيودًا على الأدوات لهوية طالب محددة. يمثّل ذلك طبقة دفاع إضافية فوق التحكم في الوصول إلى القناة؛ ويجب أن تأتي قيم المرسل من مهايئ القناة، لا من نص الرسالة.

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

تستخدم المفاتيح بادئات صريحة: `channel:<channelId>:<senderId>` أو `id:<senderId>` أو `e164:<phone>` أو `username:<handle>` أو `name:<displayName>` أو `"*"`. معرّفات القنوات هي معرّفات OpenClaw القياسية؛ وتُطبَّع الأسماء البديلة مثل `teams` إلى `msteams`. تُقبل المفاتيح القديمة التي لا تحتوي على بادئة بصفتها `id:` فقط. ترتيب المطابقة هو القناة+المعرّف، ثم المعرّف، ثم e164، ثم اسم المستخدم، ثم الاسم، وأخيرًا حرف البدل.

يتجاوز `agents.list[].tools.toolsBySender` الخاص بكل وكيل مطابقة المرسل العامة عند تطابقه، حتى مع سياسة فارغة `{}`.

### `tools.elevated`

يتحكم في الوصول المرتفع لتنفيذ الأوامر خارج وضع الحماية:

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

- لا يمكن للتجاوز الخاص بكل وكيل (`agents.list[].tools.elevated`) سوى فرض قيود إضافية.
- يخزّن `/elevated on|off|ask|full` الحالة لكل جلسة؛ وتنطبق التوجيهات المضمّنة على رسالة واحدة.
- يتجاوز `exec` المرتفع وضع الحماية ويستخدم مسار الخروج المُعدّ (`gateway` افتراضيًا، أو `node` عندما يكون هدف التنفيذ هو `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

القيم المعروضة هي القيم الافتراضية باستثناء `applyPatch.allowModels` (تكون فارغة/غير معيّنة افتراضيًا، ما يعني أنه يجوز لأي نموذج متوافق استخدام `apply_patch`). يصدر `approvalRunningNoticeMs` إشعارًا باستمرار التشغيل عندما يطول تنفيذ أمر مستند إلى موافقة؛ وتعطّله القيمة `0`.

### `tools.loopDetection`

تكون فحوصات أمان حلقات الأدوات **معطّلة افتراضيًا**. عيّن `enabled: true` لتفعيل الاكتشاف. يمكن تعريف الإعدادات عموميًا في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  الحد الأقصى لسجل استدعاءات الأدوات المحتفظ به لتحليل الحلقات.
</ParamField>
<ParamField path="warningThreshold" type="number">
  عتبة نمط التكرار دون تقدم لإصدار التحذيرات.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  يحظر الاستدعاءات المتكررة لاسم الأداة غير المتاحة أو غير المعروفة نفسه بعد هذا العدد من الإخفاقات.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  عتبة تكرار أعلى لحظر الحلقات الحرجة.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  عتبة إيقاف صارمة لأي تشغيل لا يحرز تقدمًا.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  يصدر تحذيرًا عند تكرار الاستدعاءات بالأداة نفسها والوسائط نفسها.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  يصدر تحذيرًا أو يحظر عند استخدام أدوات الاستطلاع المعروفة (`process.poll` و`command_status` وما إلى ذلك).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  يصدر تحذيرًا أو يحظر عند حدوث أنماط زوجية متناوبة لا تحرز تقدمًا.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  عدد المحاولات التي يظل خلالها الحارس مفعّلًا بعد Compaction التلقائي؛ ويُجهض التشغيل إذا كرر الوكيل المجموعة نفسها (الأداة، الوسائط، النتيجة) ضمن تلك النافذة.
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
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
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

القيم المعروضة هي القيم الافتراضية باستثناء `provider` و`userAgent`. تُقيَّد قيمة `maxResponseBytes` بالنطاق 32000–10000000؛ وتُقيَّد قيمة `maxChars` بقيمة `maxCharsCap` (ارفع `maxCharsCap` للسماح باستجابات أكبر).

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

تُعرض `concurrency` (القيمة الافتراضية `2`) و`audio.maxBytes` (القيمة الافتراضية 20 ميغابايت) و`video.maxBytes` (القيمة الافتراضية 50 ميغابايت) بقيمها الافتراضية؛ وتبلغ القيمة الافتراضية لـ`image.maxBytes` مقدار 10 ميغابايت. القيم الافتراضية لمهلة الطلب لكل قدرة: `60` ثانية للصور/الصوت، و`120` ثانية للفيديو.

<AccordionGroup>
  <Accordion title="حقول إدخال نموذج الوسائط">
    **إدخال المزوّد** (`type: "provider"` أو محذوف):

    - `provider`: معرّف مزوّد API (`openai` و`anthropic` و`google`/`gemini` و`groq` وما إلى ذلك)
    - `model`: تجاوز معرّف النموذج
    - `profile` / `preferredProfile`: اختيار ملف التعريف من `auth-profiles.json`

    **إدخال CLI** (`type: "cli"`):

    - `command`: الملف التنفيذي المراد تشغيله
    - `args`: وسائط قالبية (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}` وما إلى ذلك؛ ينقل `openclaw doctor --fix` العناصر النائبة المهملة `{input}` إلى `{{MediaPath}}`)

    **الحقول المشتركة:**

    - `capabilities`: قائمة اختيارية (`image` و`audio` و`video`). يعلن كل Plugin مزوّد عن مجموعة قدراته الافتراضية؛ فعلى سبيل المثال، تكون القيم الافتراضية لمزوّد `openai` المضمّن هي الصور+الصوت، ولمزوّدي `anthropic`/`minimax` الصور، ولمزوّد `google` الصور+الصوت+الفيديو، ولمزوّد `groq` الصوت.
    - `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات خاصة بكل إدخال.
    - تنطبق أيضًا إدخالات `tools.media.image.timeoutSeconds` وإدخالات `timeoutSeconds` المطابقة لنموذج الصور عندما يستدعي الوكيل أداة `image` الصريحة. بالنسبة إلى فهم الصور، تنطبق هذه المهلة على الطلب نفسه ولا تُخفَّض بسبب أعمال التحضير السابقة.
    - تنتقل الإخفاقات إلى الإدخال التالي.

    تتبع مصادقة المزوّد الترتيب القياسي: `auth-profiles.json` ← متغيرات البيئة ← `models.providers.*.apiKey`.

    **حقول الإكمال غير المتزامن:**

    - `asyncCompletion.directSend`: علامة توافق مهملة. تظل مهام الوسائط غير المتزامنة المكتملة بوساطة جلسة مقدم الطلب، لكي يتلقى الوكيل النتيجة ويقرر كيفية إبلاغ المستخدم ويستخدم أداة الرسائل عندما يتطلب تسليم المصدر ذلك.

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

يتحكم في الجلسات التي يمكن لأدوات الجلسات (`sessions_list` و`sessions_history` و`sessions_send`) استهدافها.

القيمة الافتراضية: `tree` (الجلسة الحالية + الجلسات التي أنشأتها، مثل الوكلاء الفرعيين).

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
    - `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (قد تشمل مستخدمين آخرين إذا شغّلت جلسات منفصلة لكل مرسل تحت معرّف الوكيل نفسه).
    - `all`: أي جلسة. لا يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
    - تقييد صندوق العزل: عندما تكون الجلسة الحالية معزولة وتكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (القيمة الافتراضية)، تُفرض الرؤية على `tree` حتى إذا كانت `tools.sessions.visibility="all"`.
    - عندما لا تكون القيمة `all`، يتضمن `sessions_list` حقل `visibility` موجزًا
      يصف الوضع الفعلي وتحذيرًا بأن بعض الجلسات قد تكون
      محذوفة إذا كانت خارج النطاق الحالي.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمّنة لـ`sessions_spawn`.

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
    - تُنشأ مرفقات الوكلاء الفرعيين فعليًا في مساحة عمل الجلسة التابعة ضمن `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
    - تقتصر مرفقات ACP على الصور، وتُمرر مضمّنة إلى وقت تشغيل ACP بعد استيفاء حدود عدد الملفات وحجم كل ملف وإجمالي الحجم نفسها.
    - تُحجب محتويات المرفقات تلقائيًا من التخزين الدائم للنصوص المنسوخة.
    - يُتحقق من مدخلات Base64 باستخدام فحوص صارمة للأبجدية والحشو، مع حارس للحجم قبل فك الترميز.
    - تكون أذونات ملفات مرفقات الوكلاء الفرعيين `0700` للمجلدات و`0600` للملفات.
    - تتبع إزالة مرفقات الوكلاء الفرعيين سياسة `cleanup`: تزيل `delete` المرفقات دائمًا؛ ولا تحتفظ بها `keep` إلا عندما تكون `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

علامات الأدوات التجريبية المضمّنة. تكون معطّلة افتراضيًا ما لم تنطبق قاعدة التفعيل التلقائي لنماذج GPT-5 ذات النمط الوكيلي الصارم.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: يفعّل أداة `update_plan` المنظَّمة لتتبّع الأعمال غير البسيطة متعددة الخطوات.
- القيمة الافتراضية: `false` ما لم تُضبط `agents.defaults.embeddedAgent.executionContract` (أو تجاوز خاص بكل وكيل) على `"strict-agentic"` لتشغيل مزوّد `openai` باستخدام معرّف نموذج من عائلة GPT-5 (يشمل ذلك أيضًا عمليات تشغيل OpenAI Codex CLI، لأن توجيه المصادقة والنماذج في Codex يقع ضمن مزوّد `openai`). اضبطها على `true` لفرض تشغيل الأداة خارج هذا النطاق، أو على `false` لإبقائها معطّلة حتى لعمليات GPT-5 ذات النمط الوكيلي الصارم.
- عند تفعيلها، تضيف مطالبة النظام أيضًا إرشادات استخدام لكي لا يستخدمها النموذج إلا للأعمال المهمة، وألا يحتفظ بأكثر من خطوة واحدة بالحالة `in_progress`.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين المُنشَئين. إذا حُذف، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء المستهدفين المضبوطة لـ`sessions_spawn` عندما لا يضبط الوكيل مقدم الطلب قيمة `subagents.allowAgents` الخاصة به (`["*"]` = أي هدف مضبوط؛ القيمة الافتراضية: الوكيل نفسه فقط). يرفض `sessions_spawn` الإدخالات القديمة التي حُذف إعداد وكيلها، ويحذفها `agents_list`؛ شغّل `openclaw doctor --fix` لتنظيفها.
- `maxConcurrent`: الحد الأقصى لعمليات تشغيل الوكلاء الفرعيين المتزامنة. القيمة الافتراضية: `8`.
- `runTimeoutSeconds`: المهلة (بالثواني) لـ`sessions_spawn` عندما لا يمرر المستدعي تجاوزه الخاص. القيمة الافتراضية: `0` (دون مهلة)؛ أما القيمة `900` المعروضة أعلاه فهي قيمة اختيارية شائعة وليست القيمة الافتراضية المضمّنة.
- `announceTimeoutMs`: مهلة كل استدعاء (بالمللي ثانية) لمحاولات تسليم إعلان `agent` عبر Gateway. القيمة الافتراضية: `120000`. قد تجعل إعادات المحاولة العابرة إجمالي انتظار الإعلان أطول من مهلة واحدة مضبوطة.
- `archiveAfterMinutes`: عدد الدقائق بعد اكتمال جلسة وكيل فرعي قبل أرشفتها تلقائيًا. القيمة الافتراضية: `60`؛ وتعطّل `0` الأرشفة التلقائية.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## المزوّدون المخصصون وعناوين URL الأساسية

تنشر Plugins المزوّدين صفوف كتالوج النماذج الخاصة بها. أضف مزوّدين مخصصين عبر `models.providers` في الإعداد أو `~/.openclaw/agents/<agentId>/agent/models.json`.

يمثّل ضبط `baseUrl` لمزوّد مخصص/محلي أيضًا قرار الثقة الشبكية المحدود لطلبات HTTP الخاصة بالنماذج: يسمح OpenClaw لذلك الأصل المحدد المطابق لـ`scheme://host:port` بالمرور عبر مسار الجلب المحمي، دون إضافة خيار إعداد منفصل أو الوثوق بأصول خاصة أخرى.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
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
    - استخدم `authHeader: true` مع `headers` لتلبية احتياجات المصادقة المخصصة.
    - تجاوز جذر إعدادات الوكيل باستخدام `OPENCLAW_AGENT_DIR`.
    - أسبقية الدمج لمعرّفات المزوّدين المتطابقة:
      - تكون الأولوية لقيم `baseUrl` غير الفارغة في `models.json` الخاص بالوكيل.
      - تكون الأولوية لقيم `apiKey` غير الفارغة الخاصة بالوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا بواسطة SecretRef في سياق الإعدادات/ملف تعريف المصادقة الحالي.
      - تُحدَّث قيم `apiKey` للمزوّد المُدار بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع متغيرات البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلًا من تخزين الأسرار المحلولة بصورة دائمة.
      - تُحدَّث قيم ترويسات المزوّد المُدار بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع متغيرات البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
      - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة الخاصة بالوكيل إلى `models.providers` في الإعدادات.
      - عند تطابق `contextWindow`/`maxTokens` للنموذج: تكون الأولوية لقيمة الإعداد الصريحة عند وجودها وصلاحيتها (عدد موجب ومحدود)؛ وإلا فتُستخدم قيمة الكتالوج الضمنية/المولَّدة.
      - يتبع `contextTokens` للنموذج المتطابق القاعدة نفسها: الأولوية للقيمة الصريحة وإلا فالقيمة الضمنية؛ استخدمه لتقييد السياق الفعلي دون تغيير البيانات الوصفية الأصلية للنموذج.
      - تُخزَّن كتالوجات Plugin المزوّد على هيئة أجزاء كتالوج مولَّدة ومملوكة للـPlugin ضمن حالة Plugins الخاصة بالوكيل.
      - استخدم `models.mode: "replace"` عندما تريد من الإعدادات إعادة كتابة `models.json` بالكامل وتخطي دمج أجزاء الكتالوج المملوكة للـPlugin.
      - تخزين العلامات خاضع لمرجعية المصدر: تُكتب العلامات من لقطة إعداد المصدر النشط (قبل الحل)، لا من قيم أسرار وقت التشغيل المحلولة.

  </Accordion>
</AccordionGroup>

### تفاصيل حقول المزوّد

<AccordionGroup>
  <Accordion title="الكتالوج عالي المستوى">
    - `models.mode`: سلوك كتالوج المزوّد (`merge` أو `replace`).
    - `models.providers`: خريطة مزوّدين مخصصة مفهرسة بمعرّف المزوّد.
      - التعديلات الآمنة: استخدم `openclaw config set models.providers.<id> '<json>' --strict-json --merge` أو `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` لإجراء تحديثات إضافية. يرفض `config set` عمليات الاستبدال المتلفة ما لم تمرّر `--replace`.

  </Accordion>
  <Accordion title="اتصال المزوّد والمصادقة">
    - `models.providers.*.api`: محوّل الطلبات (`openai-completions`، أو `openai-responses`، أو `openai-chatgpt-responses`، أو `anthropic-messages`، أو `google-generative-ai`، أو `google-vertex`، أو `github-copilot`، أو `bedrock-converse-stream`، أو `ollama`، أو `azure-openai-responses`). بالنسبة إلى الواجهات الخلفية ذاتية الاستضافة التي تستخدم `/v1/chat/completions` مثل MLX وvLLM وSGLang ومعظم الخوادم المحلية المتوافقة مع OpenAI، استخدم `openai-completions`. يستخدم المزوّد المخصص الذي يحتوي على `baseUrl` من دون `api` القيمة الافتراضية `openai-completions`؛ لا تضبط `openai-responses` إلا عندما تدعم الواجهة الخلفية `/v1/responses`.
    - `models.providers.*.apiKey`: بيانات اعتماد المزوّد (يُفضّل استبدال SecretRef/متغير البيئة).
    - `models.providers.*.auth`: استراتيجية المصادقة (`api-key`، أو `token`، أو `oauth`، أو `aws-sdk`).
    - `models.providers.*.contextWindow`: نافذة السياق الأصلية الافتراضية للنماذج التابعة لهذا المزوّد عندما لا يضبط إدخال النموذج `contextWindow`.
    - `models.providers.*.contextTokens`: الحد الافتراضي الفعلي لسياق وقت التشغيل للنماذج التابعة لهذا المزوّد عندما لا يضبط إدخال النموذج `contextTokens`.
    - `models.providers.*.maxTokens`: الحد الافتراضي لرموز الإخراج للنماذج التابعة لهذا المزوّد عندما لا يضبط إدخال النموذج `maxTokens`.
    - `models.providers.*.timeoutSeconds`: مهلة اختيارية، بالثواني ولكل مزوّد، لطلب HTTP الخاص بالنموذج، وتشمل الاتصال والترويسات والنص ومعالجة إلغاء الطلب بالكامل.
    - `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama مع `openai-completions`، يحقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
    - `models.providers.*.authHeader`: يفرض نقل بيانات الاعتماد في ترويسة `Authorization` عند الحاجة.
    - `models.providers.*.baseUrl`: عنوان URL الأساسي لواجهة API في المنبع.
    - `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه الوكيل/المستأجر.

  </Accordion>
  <Accordion title="تجاوزات نقل الطلبات">
    `models.providers.*.request`: تجاوزات النقل لطلبات HTTP بين النموذج والمزوّد.

    - `request.headers`: ترويسات إضافية (تُدمج مع إعدادات المزوّد الافتراضية). تقبل القيم SecretRef.
    - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` (استخدام المصادقة المضمّنة للمزوّد)، و`"authorization-bearer"` (مع `token`)، و`"header"` (مع `headerName` و`value` و`prefix` اختياري).
    - `request.proxy`: تجاوز وكيل HTTP. الأوضاع: `"env-proxy"` (استخدام متغيري البيئة `HTTP_PROXY`/`HTTPS_PROXY`) و`"explicit-proxy"` (مع `url`). يقبل كلا الوضعين كائن `tls` فرعيًا اختياريًا.
    - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` (تقبل جميعها SecretRef)، و`serverName`، و`insecureSkipVerify`.
    - `request.allowPrivateNetwork`: عندما تكون القيمة `true`، يسمح لطلبات HTTP بين النموذج والمزوّد بالوصول إلى النطاقات الخاصة أو CGNAT أو النطاقات المشابهة عبر حاجز جلب HTTP الخاص بالمزوّد. تثق عناوين URL الأساسية للمزوّد المخصص/المحلي مسبقًا في الأصل المضبوط نفسه تمامًا، باستثناء أصول البيانات الوصفية/الارتباط المحلي التي تظل محظورة من دون اشتراك صريح. اضبط هذا على `false` لإلغاء الثقة بالأصل المطابق تمامًا. يستخدم WebSocket إعداد `request` نفسه للترويسات/TLS، لكن ليس بوابة SSRF الخاصة بالجلب. القيمة الافتراضية `false`.

  </Accordion>
  <Accordion title="إدخالات كتالوج النماذج">
    - `models.providers.*.models`: إدخالات كتالوج نماذج المزوّد الصريحة.
    - `models.providers.*.models.*.input`: أنماط إدخال النموذج. استخدم `["text"]` للنماذج النصية فقط و`["text", "image"]` للنماذج الأصلية للصور/الرؤية. لا تُحقن مرفقات الصور في دورات الوكيل إلا عندما يُعلَّم النموذج المحدد بأنه قادر على معالجة الصور.
    - `models.providers.*.models.*.contextWindow`: البيانات الوصفية لنافذة السياق الأصلية للنموذج. يتجاوز هذا `contextWindow` على مستوى المزوّد لذلك النموذج.
    - `models.providers.*.models.*.contextTokens`: حد اختياري لسياق وقت التشغيل. يتجاوز هذا `contextTokens` على مستوى المزوّد؛ استخدمه عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج؛ يعرض `openclaw models list` القيمتين عندما تختلفان.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. عند استخدام `api: "openai-completions"` مع `baseUrl` غير فارغ وغير أصلي (المضيف ليس `api.openai.com`)، يفرض OpenClaw القيمة `false` في وقت التشغيل. يحافظ `baseUrl` الفارغ/المحذوف على سلوك OpenAI الافتراضي.
    - `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية الدردشة المتوافقة مع OpenAI التي تقبل السلاسل فقط. عندما تكون القيمة `true`، يحوّل OpenClaw مصفوفات `messages[].content` النصية البحتة إلى سلاسل عادية قبل إرسال الطلب.
    - `models.providers.*.models.*.compat.strictMessageKeys`: تلميح توافق اختياري لنقاط نهاية الدردشة الصارمة المتوافقة مع OpenAI. عندما تكون القيمة `true`، يختزل OpenClaw كائنات رسائل Chat Completions الصادرة إلى `role` و`content` قبل إرسال الطلب.
    - `models.providers.*.models.*.compat.thinkingFormat`: تلميح اختياري لحمولة التفكير. استخدم `"together"` مع `reasoning.enabled` بأسلوب Together، أو `"qwen"` مع `enable_thinking` عالي المستوى، أو `"qwen-chat-template"` مع `chat_template_kwargs.enable_thinking` على خوادم عائلة Qwen المتوافقة مع OpenAI التي تدعم معاملات قالب الدردشة على مستوى الطلب، مثل vLLM. تعرض نماذج Qwen المضبوطة في vLLM خيارات `/think` ثنائية (`off` و`on`) لهذه التنسيقات.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: تلميح توافق اختياري لواجهات Chat Completions الخلفية بأسلوب DeepSeek التي تتطلب احتفاظ رسائل المساعد السابقة بـ`reasoning_content` عند إعادة التشغيل. عندما تكون القيمة `true`، يحافظ OpenClaw على هذا الحقل في رسائل المساعد الصادرة. استخدم هذا عند توصيل وكيل مخصص متوافق مع DeepSeek يرفض الطلبات بعد إزالة الاستدلال. القيمة الافتراضية `false`.

  </Accordion>
  <Accordion title="اكتشاف Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـBedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS للاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف المزوّد للاكتشاف المستهدف.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: الفاصل الزمني للاستقصاء لتحديث الاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الأقصى الاحتياطي لرموز الإخراج للنماذج المكتشفة.

  </Accordion>
</AccordionGroup>

يستنتج الإعداد التفاعلي للمزوّد المخصص إدخال الصور لأنماط معرّفات نماذج الرؤية المعروفة، بما فيها GPT-4o/GPT-4.1/GPT-5+ وعائلات الاستدلال `o1`/`o3`/`o4` وClaude وGemini وأي معرّف ينتهي بـ`-vl` ‏(Qwen-VL وما شابه) والعائلات المسماة مثل LLaVA وPixtral وInternVL وMllama وMiniCPM-V وGLM-4V؛ ويتخطى السؤال الإضافي لعائلات النماذج النصية فقط المعروفة (Llama وDeepSeek وMistral/Mixtral وKimi/Moonshot وCodestral وDevstral وPhi وQwQ وCodeLlama ومعرّفات Qwen المجردة التي لا تحتوي على لاحقة vl/vision). تظل معرّفات النماذج غير المعروفة تطلب تحديد دعم الصور. يستخدم الإعداد غير التفاعلي الاستنتاج نفسه؛ مرّر `--custom-image-input` لفرض بيانات وصفية تدعم الصور أو `--custom-text-input` لفرض بيانات وصفية نصية فقط.

### أمثلة المزوّدين

<AccordionGroup>
  <Accordion title="Cerebras ‏(GLM 4.7 / GPT OSS)">
    يمكن لـPlugin المزوّد الخارجي الرسمي `cerebras` ضبط ذلك عبر `openclaw onboard --auth-choice cerebras-api-key`. استخدم إعداد المزوّد الصريح فقط عند تجاوز الإعدادات الافتراضية.

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

    استخدم `cerebras/zai-glm-4.7` مع Cerebras؛ و`zai/glm-4.7` للاتصال المباشر بـZ.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
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

    مزوّد مضمّن ومتوافق مع Anthropic. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="النماذج المحلية (LM Studio)">
    راجع [النماذج المحلية](/ar/gateway/local-models). الخلاصة: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ وأبقِ النماذج المستضافة مدمجة لاستخدامها كخيار احتياطي.
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

    عيّن `MINIMAX_API_KEY`. الاختصارات: `openclaw onboard --auth-choice minimax-global-api` أو `openclaw onboard --auth-choice minimax-cn-api`. يستخدم كتالوج النماذج M3 افتراضيًا، ويتضمن أيضًا متغيرات M2.7. في مسار البث المتوافق مع Anthropic، يعطّل OpenClaw التفكير في MiniMax M2.x افتراضيًا ما لم تعيّن `thinking` بنفسك صراحةً؛ بينما يظل MiniMax-M3 (وM3.x) افتراضيًا على مسار التفكير المحذوف/التكيفي الخاص بموفّر الخدمة. يعيد `/fast on` أو `params.fastMode: true` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

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

    لنقطة النهاية الخاصة بالصين: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

    تعلن نقاط نهاية Moonshot الأصلية توافق استخدام البث عبر وسيلة النقل المشتركة `openai-completions`، ويحدد OpenClaw ذلك استنادًا إلى إمكانات نقطة النهاية بدلًا من الاعتماد على معرّف موفّر الخدمة المدمج وحده.

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

    عيّن `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`). استخدم مراجع `opencode/...` لكتالوج Zen أو مراجع `opencode-go/...` لكتالوج Go. الاختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

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

    يجب ألا يتضمن عنوان URL الأساسي اللاحقة `/v1` (إذ يضيفها عميل Anthropic). الاختصار: `openclaw onboard --auth-choice synthetic-api-key`.

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

    عيّن `ZAI_API_KEY`. تستخدم مراجع النماذج معرّف موفّر الخدمة القياسي `zai/*`. الاختصار: `openclaw onboard --auth-choice zai-api-key`.

    - نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
    - نقطة نهاية البرمجة: `https://api.z.ai/api/coding/paas/v4`
    - يفحص خيار المصادقة الافتراضي `zai-api-key` مفتاحك ويكتشف تلقائيًا نقطة النهاية التي ينتمي إليها (وينتقل إلى مطالبة عند تعذّر الوصول إلى نتيجة حاسمة، مع اعتماد Global افتراضيًا). تتوفر أيضًا خيارات مصادقة مخصصة للصين وخطة البرمجة للاختيار الصريح.
    - لنقطة النهاية العامة، عرّف موفّر خدمة مخصصًا مع تجاوز عنوان URL الأساسي.

  </Accordion>
</AccordionGroup>

---

## ذو صلة

- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [الإعدادات — القنوات](/ar/gateway/config-channels)
- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح أخرى من المستوى الأعلى
- [الأدوات والإضافات](/ar/tools)
