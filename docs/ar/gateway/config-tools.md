---
read_when:
    - تكوين سياسة `tools.*`، أو قوائم السماح، أو الميزات التجريبية
    - تسجيل المزوّدين المخصّصين أو تجاوز عناوين URL الأساسية
    - إعداد نقاط نهاية ذاتية الاستضافة متوافقة مع OpenAI
sidebarTitle: Tools and custom providers
summary: تكوين الأدوات (السياسة، ومفاتيح التبديل التجريبية، والأدوات المدعومة بمزوّد) وإعداد المزوّد المخصص/عنوان URL الأساسي
title: التكوين — الأدوات والمزوّدون المخصّصون
x-i18n:
    generated_at: "2026-05-10T19:38:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: c02dad1d895afe90baf99487b37d29968ebd944890075511e1cb057776b29ec6
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` مفاتيح الإعداد وإعدادات الموفّر المخصص / base-URL. للوكلاء والقنوات ومفاتيح الإعداد الأخرى على المستوى الأعلى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

<Note>
تجعل عملية الإعداد المحلية القيم الافتراضية للإعدادات المحلية الجديدة هي `tools.profile: "coding"` عندما لا تكون مضبوطة (تُحفَظ ملفات التعريف الصريحة الموجودة).
</Note>

| ملف التعريف | يتضمن                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | بلا قيود (مثل عدم الضبط)                                                                                                  |

### مجموعات الأدوات

| المجموعة              | الأدوات                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (يُقبل `bash` كاسم بديل لـ `exec`)                                         |
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
| `group:openclaw`   | جميع الأدوات المدمجة (تستثني Plugins الموفّرين)                                                                          |

### `tools.allow` / `tools.deny`

سياسة عامة للسماح/الرفض للأدوات (الرفض له الأسبقية). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. تُطبَّق حتى عندما يكون وضع Docker sandbox متوقفًا.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` و`apply_patch` معرّفا أداتين منفصلان. يؤدي `allow: ["write"]` أيضًا إلى تمكين `apply_patch` للنماذج المتوافقة، لكن `deny: ["write"]` لا يرفض `apply_patch`. لحظر كل عمليات تعديل الملفات، ارفض `group:fs` أو اذكر كل أداة تعديل صراحةً:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

تقييد الأدوات أكثر لموفّرين أو نماذج محددة. الترتيب: ملف التعريف الأساسي → ملف تعريف الموفّر → السماح/الرفض.

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

### `tools.elevated`

يتحكم في وصول `exec` المرتفع خارج sandbox:

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

- يمكن للتجاوز لكل وكيل (`agents.list[].tools.elevated`) أن يزيد التقييد فقط.
- يخزّن `/elevated on|off|ask|full` الحالة لكل جلسة؛ تنطبق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع آليات sandboxing ويستخدم مسار الإفلات المضبوط (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

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
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

فحوصات السلامة من حلقات الأدوات **معطّلة افتراضيًا**. اضبط `enabled: true` لتفعيل الاكتشاف. يمكن تعريف الإعدادات عامًا في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.

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
  الحد الأقصى لسجل استدعاءات الأدوات المحتفَظ به لتحليل الحلقات.
</ParamField>
<ParamField path="warningThreshold" type="number">
  عتبة نمط التكرار بلا تقدم لإصدار التحذيرات.
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
  التحذير/الحظر عند أدوات الاستقصاء المعروفة (`process.poll`, `command_status`, إلخ).
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
  <Accordion title="Media model entry fields">
    **إدخال المزوّد** (`type: "provider"` أو محذوف):

    - `provider`: معرّف مزوّد API (`openai`، `anthropic`، `google`/`gemini`، `groq`، إلخ.)
    - `model`: تجاوز معرّف النموذج
    - `profile` / `preferredProfile`: اختيار ملف تعريف `auth-profiles.json`

    **إدخال CLI** (`type: "cli"`):

    - `command`: الملف التنفيذي المراد تشغيله
    - `args`: وسائط ذات قوالب (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}`، إلخ؛ ينقل `openclaw doctor --fix` عناصر `{input}` النائبة المهملة إلى `{{MediaPath}}`)

    **الحقول المشتركة:**

    - `capabilities`: قائمة اختيارية (`image`، `audio`، `video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` ← صورة، `google` ← صورة+صوت+فيديو، `groq` ← صوت.
    - `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
    - تنطبق أيضًا إدخالات `tools.media.image.timeoutSeconds` وإدخالات `timeoutSeconds` المطابقة لنموذج الصور عندما يستدعي الوكيل أداة `image` الصريحة.
    - عند الإخفاق، يتم الرجوع إلى الإدخال التالي.

    تتبع مصادقة المزوّد الترتيب القياسي: `auth-profiles.json` ← متغيرات البيئة ← `models.providers.*.apiKey`.

    **حقول الإكمال غير المتزامن:**

    - `asyncCompletion.directSend`: علامة توافق مهملة. تبقى مهام الوسائط غير المتزامنة المكتملة بوساطة جلسة الطالب بحيث يتلقى الوكيل النتيجة، ويقرر كيفية إبلاغ المستخدم، ويستخدم أداة الرسائل عندما يتطلب تسليم المصدر ذلك.

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

يتحكم في الجلسات التي يمكن استهدافها بواسطة أدوات الجلسات (`sessions_list`، `sessions_history`، `sessions_send`).

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
  <Accordion title="Visibility scopes">
    - `self`: مفتاح الجلسة الحالية فقط.
    - `tree`: الجلسة الحالية + الجلسات التي أنشأتها الجلسة الحالية (الوكلاء الفرعيون).
    - `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (قد تشمل مستخدمين آخرين إذا كنت تشغّل جلسات لكل مرسل تحت معرّف الوكيل نفسه).
    - `all`: أي جلسة. لا يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
    - تقييد صندوق الحماية: عندما تكون الجلسة الحالية داخل صندوق حماية وكان `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض الرؤية على `tree` حتى إذا كان `tools.sessions.visibility="all"`.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمّنة لـ `sessions_spawn`.

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
    - لا تُدعم المرفقات إلا مع `runtime: "subagent"`. يرفضها وقت تشغيل ACP.
    - تُجسَّد الملفات في مساحة عمل الطفل عند `.openclaw/attachments/<uuid>/` مع `.manifest.json`.
    - يُنقَّح محتوى المرفقات تلقائيًا من استمرارية السجل النصي.
    - تُتحقق مُدخلات Base64 بفحوصات صارمة للأبجدية/الحشو وحارس حجم قبل فك الترميز.
    - أذونات الملفات هي `0700` للأدلة و`0600` للملفات.
    - يتبع التنظيف سياسة `cleanup`: يزيل `delete` المرفقات دائمًا؛ ويحتفظ بها `keep` فقط عندما تكون `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

علامات الأدوات المضمنة التجريبية. تكون معطلة افتراضيًا ما لم تنطبق قاعدة تمكين تلقائي صارمة عاملة لـ GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: يفعّل أداة `update_plan` المهيكلة لتتبع الأعمال غير البسيطة متعددة الخطوات.
- الافتراضي: `false` ما لم يُضبط `agents.defaults.embeddedPi.executionContract` (أو تجاوز لكل وكيل) على `"strict-agentic"` لتشغيل من عائلة OpenAI أو OpenAI Codex GPT-5. اضبطه على `true` لفرض تشغيل الأداة خارج ذلك النطاق، أو `false` لإبقائها معطلة حتى لتشغيلات GPT-5 الصارمة العاملة.
- عند التمكين، يضيف موجّه النظام أيضًا إرشادات استخدام كي لا يستخدمها النموذج إلا للأعمال الجوهرية ويبقي خطوة واحدة على الأكثر `in_progress`.

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: النموذج الافتراضي للوكلاء الفرعيين المنشأين. إذا أُغفل، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء الهدف لـ `sessions_spawn` عندما لا يضبط الوكيل الطالب `subagents.allowAgents` الخاص به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما تُغفل استدعاء الأداة `runTimeoutSeconds`. تعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## المزوّدون المخصصون وعناوين URL الأساسية

يستخدم OpenClaw كتالوج النماذج المضمن. أضف مزوّدين مخصصين عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.

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
    - تجاوز جذر إعداد الوكيل باستخدام `OPENCLAW_AGENT_DIR` (أو `PI_CODING_AGENT_DIR`، وهو اسم بديل قديم لمتغير بيئة).
    - أسبقية الدمج لمعرّفات المزوّدين المتطابقة:
      - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاص بالوكيل.
      - تفوز قيم `apiKey` غير الفارغة في الوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا بـ SecretRef في سياق الإعداد/ملف تعريف المصادقة الحالي.
      - تُحدَّث قيم `apiKey` الخاصة بالمزوّد المُدار بـ SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملفات/التنفيذ) بدلًا من الاحتفاظ بالأسرار المحلولة.
      - تُحدَّث قيم ترويسة المزوّد المُدار بـ SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملفات/التنفيذ).
      - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة في الوكيل إلى `models.providers` في الإعدادات.
      - تستخدم قيم `contextWindow`/`maxTokens` للنموذج المتطابق القيمة الأعلى بين الإعداد الصريح وقيم الكتالوج الضمنية.
      - تحافظ قيمة `contextTokens` للنموذج المتطابق على حد وقت التشغيل الصريح عند وجوده؛ استخدمها للحد من السياق الفعّال دون تغيير بيانات تعريف النموذج الأصلية.
      - استخدم `models.mode: "replace"` عندما تريد أن تعيد الإعدادات كتابة `models.json` بالكامل.
      - استمرارية العلامات ذات مرجعية مصدرية: تُكتب العلامات من لقطة إعداد المصدر النشط (قبل الحل)، وليس من قيم أسرار وقت التشغيل المحلولة.

  </Accordion>
</AccordionGroup>

### تفاصيل حقول المزوّد

<AccordionGroup>
  <Accordion title="الكتالوج عالي المستوى">
    - `models.mode`: سلوك كتالوج المزوّد (`merge` أو `replace`).
    - `models.providers`: خريطة المزوّدين المخصصين مفهرسة بمعرّف المزوّد.
      - تعديلات آمنة: استخدم `openclaw config set models.providers.<id> '<json>' --strict-json --merge` أو `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` للتحديثات الإضافية. يرفض `config set` الاستبدالات الهدامة ما لم تمرر `--replace`.

  </Accordion>
  <Accordion title="اتصال المزوّد والمصادقة">
    - `models.providers.*.api`: مهايئ الطلب (`openai-completions`، `openai-responses`، `anthropic-messages`، `google-generative-ai`، إلخ). للواجهات الخلفية ذاتية الاستضافة `/v1/chat/completions` مثل MLX وvLLM وSGLang ومعظم الخوادم المحلية المتوافقة مع OpenAI، استخدم `openai-completions`. إذا كان لدى مزوّد مخصص `baseUrl` دون `api`، يكون الافتراضي `openai-completions`؛ اضبط `openai-responses` فقط عندما تدعم الواجهة الخلفية `/v1/responses`.
    - `models.providers.*.apiKey`: اعتماد المزوّد (فضّل SecretRef/استبدال البيئة).
    - `models.providers.*.auth`: استراتيجية المصادقة (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: نافذة السياق الأصلية الافتراضية للنماذج ضمن هذا المزوّد عندما لا يضبط إدخال النموذج `contextWindow`.
    - `models.providers.*.contextTokens`: حد سياق وقت التشغيل الفعّال الافتراضي للنماذج ضمن هذا المزوّد عندما لا يضبط إدخال النموذج `contextTokens`.
    - `models.providers.*.maxTokens`: حد رموز الإخراج الافتراضي للنماذج ضمن هذا المزوّد عندما لا يضبط إدخال النموذج `maxTokens`.
    - `models.providers.*.timeoutSeconds`: مهلة اختيارية لكل مزوّد لطلب HTTP للنموذج بالثواني، بما يشمل الاتصال والترويسات والجسم ومعالجة إجهاض الطلب الكلي.
    - `models.providers.*.injectNumCtxForOpenAICompat`: لـ Ollama + `openai-completions`، يحقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
    - `models.providers.*.authHeader`: يفرض نقل الاعتماد في ترويسة `Authorization` عند الحاجة.
    - `models.providers.*.baseUrl`: عنوان URL الأساسي لواجهة API الصاعدة.
    - `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه الوكيل/المستأجر.

  </Accordion>
  <Accordion title="تجاوزات نقل الطلبات">
    `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بمزوّد النموذج.

    - `request.headers`: ترويسات إضافية (تُدمج مع افتراضيات المزوّد). تقبل القيم SecretRef.
    - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` (استخدام المصادقة المضمنة لدى المزوّد)، `"authorization-bearer"` (مع `token`)، `"header"` (مع `headerName` و`value` و`prefix` اختياري).
    - `request.proxy`: تجاوز وكيل HTTP. الأوضاع: `"env-proxy"` (استخدام متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (مع `url`). يقبل كلا الوضعين كائنًا فرعيًا اختياريًا `tls`.
    - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca`، `cert`، `key`، `passphrase` (كلها تقبل SecretRef)، `serverName`، `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: عندما تكون `true`، اسمح لـ HTTPS إلى `baseUrl` عندما يحل DNS إلى نطاقات خاصة أو CGNAT أو نطاقات مشابهة، عبر حارس الجلب HTTP الخاص بالمزوّد (اشتراك صريح من المشغل لنقاط نهاية موثوقة ذاتية الاستضافة ومتوافقة مع OpenAI). يُسمح تلقائيًا بعناوين URL لتدفق مزوّد النموذج عبر local loopback مثل `localhost` و`127.0.0.1` و`[::1]` ما لم يُضبط هذا صراحةً على `false`؛ ولا تزال مضيفات LAN وtailnet وDNS الخاصة تتطلب اشتراكًا صريحًا. يستخدم WebSocket نفس `request` للترويسات/TLS لكن ليس بوابة SSRF الخاصة بالجلب تلك. الافتراضي `false`.

  </Accordion>
  <Accordion title="إدخالات كتالوج النماذج">
    - `models.providers.*.models`: إدخالات كتالوج نماذج المزوّد الصريحة.
    - `models.providers.*.models.*.input`: أنماط إدخال النموذج. استخدم `["text"]` للنماذج النصية فقط و`["text", "image"]` لنماذج الصور/الرؤية الأصلية. لا تُحقن مرفقات الصور في أدوار الوكيل إلا عندما يُعلّم النموذج المحدد بأنه قادر على الصور.
    - `models.providers.*.models.*.contextWindow`: بيانات تعريف نافذة السياق الأصلية للنموذج. يتجاوز هذا `contextWindow` على مستوى المزوّد لذلك النموذج.
    - `models.providers.*.models.*.contextTokens`: حد سياق اختياري لوقت التشغيل. يتجاوز هذا `contextTokens` على مستوى المزوّد؛ استخدمه عندما تريد ميزانية سياق فعّالة أصغر من `contextWindow` الأصلية للنموذج؛ يعرض `openclaw models list` كلتا القيمتين عندما تختلفان.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير أصلي وغير فارغ (مضيف ليس `api.openai.com`)، يفرض OpenClaw هذا إلى `false` في وقت التشغيل. يحافظ `baseUrl` الفارغ/المُغفل على سلوك OpenAI الافتراضي.
    - `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية الدردشة المتوافقة مع OpenAI التي تقبل السلاسل فقط. عندما تكون `true`، يسطّح OpenClaw مصفوفات `messages[].content` النصية الخالصة إلى سلاسل عادية قبل إرسال الطلب.
    - `models.providers.*.models.*.compat.strictMessageKeys`: تلميح توافق اختياري لنقاط نهاية الدردشة المتوافقة مع OpenAI الصارمة. عندما تكون `true`، يختزل OpenClaw كائنات رسائل Chat Completions الصادرة إلى `role` و`content` قبل إرسال الطلب.
    - `models.providers.*.models.*.compat.thinkingFormat`: تلميح اختياري لحمولة التفكير. استخدم `"qwen"` لـ `enable_thinking` عالي المستوى، أو `"qwen-chat-template"` لـ `chat_template_kwargs.enable_thinking` على خوادم عائلة Qwen المتوافقة مع OpenAI التي تدعم وسائط قالب الدردشة على مستوى الطلب، مثل vLLM.

  </Accordion>
  <Accordion title="اكتشاف Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS للاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف المزوّد للاكتشاف المستهدف.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصل الاستقصاء لتحديث الاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الاحتياطي الأقصى لرموز الإخراج للنماذج المكتشفة.

  </Accordion>
</AccordionGroup>

يستنتج إعداد المزوّد المخصص التفاعلي إدخال الصور لمعرّفات نماذج الرؤية الشائعة مثل GPT-4o وClaude وGemini وQwen-VL وLLaVA وPixtral وInternVL وMllama وMiniCPM-V وGLM-4V، ويتخطى السؤال الإضافي للعائلات النصية فقط المعروفة. لا تزال معرّفات النماذج غير المعروفة تطلب دعم الصور. يستخدم الإعداد غير التفاعلي الاستنتاج نفسه؛ مرر `--custom-image-input` لفرض بيانات تعريف قادرة على الصور أو `--custom-text-input` لفرض بيانات تعريف نصية فقط.

### أمثلة المزوّدين

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    يمكن لـ Plugin المزوّد المضمّن `cerebras` تكوين هذا عبر `openclaw onboard --auth-choice cerebras-api-key`. استخدم إعداد المزوّد الصريح فقط عند تجاوز الافتراضيات.

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

    استخدم `cerebras/zai-glm-4.7` لـ Cerebras؛ و`zai/glm-4.7` لـ Z.AI مباشرة.

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

    موفّر مدمج ومتوافق مع Anthropic. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="النماذج المحلية (LM Studio)">
    راجع [النماذج المحلية](/ar/gateway/local-models). باختصار: شغّل نموذجا محليا كبيرا عبر LM Studio Responses API على عتاد جاد؛ وأبق النماذج المستضافة مدمجة للرجوع الاحتياطي.
  </Accordion>
  <Accordion title="MiniMax M2.7 (مباشر)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
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
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    عيّن `MINIMAX_API_KEY`. الاختصارات: `openclaw onboard --auth-choice minimax-global-api` أو `openclaw onboard --auth-choice minimax-cn-api`. يقتصر كتالوج النماذج افتراضيا على M2.7. في مسار البث المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax افتراضيا ما لم تضبط `thinking` بنفسك صراحة. يعيد `/fast on` أو `params.fastMode: true` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

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

    لنقطة نهاية الصين: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

    تعلن نقاط نهاية Moonshot الأصلية عن توافق استخدام البث على نقل `openai-completions` المشترك، ويعتمد OpenClaw في ذلك على قدرات نقطة النهاية بدلا من معرف الموفّر المدمج وحده.

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

    ينبغي أن يحذف عنوان URL الأساسي `/v1` (يضيفه عميل Anthropic). الاختصار: `openclaw onboard --auth-choice synthetic-api-key`.

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

    عيّن `ZAI_API_KEY`. تقبل `z.ai/*` و`z-ai/*` كأسماء مستعارة. الاختصار: `openclaw onboard --auth-choice zai-api-key`.

    - نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
    - نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
    - لنقطة النهاية العامة، عرّف موفّرا مخصصا مع تجاوز عنوان URL الأساسي.

  </Accordion>
</AccordionGroup>

---

## ذات صلة

- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [الإعدادات — القنوات](/ar/gateway/config-channels)
- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح أخرى في المستوى الأعلى
- [الأدوات وplugins](/ar/tools)
