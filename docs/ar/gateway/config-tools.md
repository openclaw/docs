---
read_when:
    - تكوين سياسة `tools.*` أو قوائم السماح أو الميزات التجريبية
    - تسجيل مزوّدين مخصصين أو تجاوز عناوين URL الأساسية
    - إعداد نقاط النهاية ذاتية الاستضافة المتوافقة مع OpenAI
sidebarTitle: Tools and custom providers
summary: تكوين الأدوات (السياسة، ومفاتيح التبديل التجريبية، والأدوات المدعومة من الموفّر) وإعداد الموفّر المخصص/عنوان URL الأساسي
title: التكوين — الأدوات والمزوّدون المخصصون
x-i18n:
    generated_at: "2026-05-01T07:39:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 97e6bd8c762f6f7a9985b99ec016dde22c8ea8adc925778b11c2ae5103b887a8
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` مفاتيح الإعدادات وإعداد المزوّد المخصّص / عنوان URL الأساسي. بالنسبة إلى `agents` و`channels` ومفاتيح الإعدادات الأخرى في المستوى الأعلى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

<Note>
تجعل التهيئة المحلية الأولية الإعدادات المحلية الجديدة افتراضيًا على `tools.profile: "coding"` عند عدم تعيينه (تُحفظ ملفات التعريف الصريحة الموجودة).
</Note>

| ملف التعريف | يتضمن                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | بلا قيود (مثل عدم تعيينه)                                                                                                  |

### مجموعات الأدوات

| المجموعة              | الأدوات                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (يُقبل `bash` كاسم بديل لـ `exec`)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | كل الأدوات المضمّنة (يستثني Plugins الخاصة بالمزوّدين)                                                                          |

### `tools.allow` / `tools.deny`

سياسة عامة للسماح/الرفض للأدوات (الرفض يتغلب). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. تُطبّق حتى عندما يكون صندوق Docker الرملي متوقفًا.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

تقييد الأدوات أكثر لمزوّدين أو نماذج محددة. الترتيب: ملف التعريف الأساسي ← ملف تعريف المزوّد ← السماح/الرفض.

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

يتحكم في وصول `exec` المرتفع خارج صندوق الرمل:

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
- يخزّن `/elevated on|off|ask|full` الحالة لكل جلسة؛ وتُطبّق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع العزل الرملي ويستخدم مسار الخروج المضبوط (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

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

فحوصات أمان حلقات الأدوات **معطّلة افتراضيًا**. اضبط `enabled: true` لتفعيل الاكتشاف. يمكن تعريف الإعدادات عالميًا في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.

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
        directSend: false, // opt-in: send finished async video directly to the channel
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
    **إدخال المزوّد** (`type: "provider"` أو محذوف):

    - `provider`: معرّف مزوّد API (`openai`، `anthropic`، `google`/`gemini`، `groq`، إلخ)
    - `model`: تجاوز معرّف النموذج
    - `profile` / `preferredProfile`: اختيار ملف التعريف في `auth-profiles.json`

    **إدخال CLI** (`type: "cli"`):

    - `command`: الملف التنفيذي المراد تشغيله
    - `args`: وسائط مقولبة (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}`، إلخ؛ يرحّل `openclaw doctor --fix` العناصر النائبة المهملة `{input}` إلى `{{MediaPath}}`)

    **الحقول المشتركة:**

    - `capabilities`: قائمة اختيارية (`image`، `audio`، `video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` ← صورة، `google` ← صورة+صوت+فيديو، `groq` ← صوت.
    - `prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`: تجاوزات لكل إدخال.
    - تنطبق أيضًا إدخالات `tools.media.image.timeoutSeconds` وإدخالات `timeoutSeconds` المطابقة لنموذج الصورة عندما يستدعي الوكيل أداة `image` الصريحة.
    - تعود حالات الفشل إلى الإدخال التالي.

    تتبع مصادقة المزوّد الترتيب القياسي: `auth-profiles.json` ← متغيرات البيئة ← `models.providers.*.apiKey`.

    **حقول الإكمال غير المتزامن:**

    - `asyncCompletion.directSend`: عند ضبطها على `true`، تحاول مهام الوسائط غير المتزامنة المكتملة التي تدعم تسليم الإكمال المباشر التسليم المباشر إلى القناة أولًا. القيمة الافتراضية: `false` (مسار إيقاظ جلسة الطالب/التسليم عبر النموذج). ينطبق هذا اليوم على `video_generate` غير المتزامن؛ وتبقى إكمالات `music_generate` غير المتزامنة متوسّطة عبر جلسة الطالب حتى عند تفعيل ذلك.

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

يتحكم في الجلسات التي يمكن استهدافها بواسطة أدوات الجلسات (`sessions_list` و`sessions_history` و`sessions_send`).

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
    - `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (قد يشمل مستخدمين آخرين إذا كنت تشغّل جلسات لكل مرسل ضمن معرّف الوكيل نفسه).
    - `all`: أي جلسة. لا يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
    - تقييد صندوق العزل: عندما تكون الجلسة الحالية معزولة ويكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض الرؤية على `tree` حتى إذا كان `tools.sessions.visibility="all"`.

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
    - لا تُدعم المرفقات إلا مع `runtime: "subagent"`. يرفضها وقت تشغيل ACP.
    - تُنشأ الملفات داخل مساحة عمل الابن في `.openclaw/attachments/<uuid>/` مع `.manifest.json`.
    - يُحجب محتوى المرفقات تلقائيًا من استمرارية النصوص.
    - تُتحقق مُدخلات Base64 بفحوصات صارمة للأبجدية/الحشو مع حارس حجم قبل فك الترميز.
    - أذونات الملفات هي `0700` للأدلة و`0600` للملفات.
    - يتبع التنظيف سياسة `cleanup`: يزيل `delete` المرفقات دائمًا؛ بينما يحتفظ بها `keep` فقط عندما تكون `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

أعلام الأدوات المدمجة التجريبية. تكون معطلة افتراضيًا ما لم تنطبق قاعدة تفعيل تلقائي صارمة لوكيل GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: يفعّل أداة `update_plan` المهيكلة لتتبع الأعمال متعددة الخطوات غير البسيطة.
- الافتراضي: `false` ما لم يتم تعيين `agents.defaults.embeddedPi.executionContract` (أو تجاوز على مستوى وكيل محدد) إلى `"strict-agentic"` لتشغيل من عائلة OpenAI أو OpenAI Codex GPT-5. عيّن `true` لفرض تشغيل الأداة خارج ذلك النطاق، أو `false` لإبقائها معطلة حتى لتشغيلات GPT-5 ذات `"strict-agentic"`.
- عند تفعيلها، يضيف موجّه النظام أيضًا إرشادات استخدام كي لا يستخدمها النموذج إلا للأعمال الكبيرة، مع إبقاء خطوة واحدة على الأكثر بحالة `in_progress`.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين المنشئين. إذا حُذف، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء الهدف لـ `sessions_spawn` عندما لا يعيّن الوكيل الطالب قيمة `subagents.allowAgents` الخاصة به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة `runTimeoutSeconds`. تعني `0` عدم وجود مهلة.
- سياسة أدوات كل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## الموفرون المخصصون وعناوين URL الأساسية

يستخدم OpenClaw كتالوج النماذج المدمج. أضف موفرين مخصصين عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.

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
    - تجاوز جذر إعدادات الوكيل باستخدام `OPENCLAW_AGENT_DIR` (أو `PI_CODING_AGENT_DIR`، وهو اسم بديل قديم لمتغير بيئة).
    - أسبقية الدمج لمعرّفات الموفرين المتطابقة:
      - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاص بالوكيل.
      - تفوز قيم `apiKey` غير الفارغة الخاصة بالوكيل فقط عندما لا يكون ذلك الموفر مدارًا بواسطة SecretRef في سياق الإعدادات/ملف تعريف المصادقة الحالي.
      - يتم تحديث قيم `apiKey` للموفر المُدار بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلًا من حفظ الأسرار المحلولة.
      - يتم تحديث قيم ترويسة الموفر المُدار بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
      - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة الخاصة بالوكيل إلى `models.providers` في الإعدادات.
      - تستخدم قيم `contextWindow`/`maxTokens` للنموذج المطابق القيمة الأعلى بين الإعدادات الصريحة وقيم الكتالوج الضمنية.
      - تحافظ قيمة `contextTokens` للنموذج المطابق على حد تشغيل صريح عند وجوده؛ استخدمها لتقييد السياق الفعّال دون تغيير بيانات تعريف النموذج الأصلية.
      - استخدم `models.mode: "replace"` عندما تريد أن تعيد الإعدادات كتابة `models.json` بالكامل.
      - حفظ العلامات يستند إلى المصدر بوصفه المرجع: تُكتب العلامات من لقطة إعدادات المصدر النشطة (قبل الحل)، وليس من قيم أسرار وقت التشغيل المحلولة.

  </Accordion>
</AccordionGroup>

### تفاصيل حقول الموفر

<AccordionGroup>
  <Accordion title="الكتالوج ذي المستوى الأعلى">
    - `models.mode`: سلوك كتالوج الموفرين (`merge` أو `replace`).
    - `models.providers`: خريطة موفرين مخصصين مفهرسة بمعرّف الموفر.
      - تعديلات آمنة: استخدم `openclaw config set models.providers.<id> '<json>' --strict-json --merge` أو `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` للتحديثات الإضافية. يرفض `config set` الاستبدالات المدمرة ما لم تمرر `--replace`.

  </Accordion>
  <Accordion title="اتصال الموفر والمصادقة">
    - `models.providers.*.api`: محول الطلبات (`openai-completions`، `openai-responses`، `anthropic-messages`، `google-generative-ai`، إلخ). للخلفيات ذاتية الاستضافة `/v1/chat/completions` مثل MLX وvLLM وSGLang ومعظم الخوادم المحلية المتوافقة مع OpenAI، استخدم `openai-completions`. الموفر المخصص الذي يحتوي على `baseUrl` دون `api` تكون قيمته الافتراضية `openai-completions`؛ عيّن `openai-responses` فقط عندما تدعم الخلفية `/v1/responses`.
    - `models.providers.*.apiKey`: اعتماد الموفر (يفضّل استبدال SecretRef/البيئة).
    - `models.providers.*.auth`: استراتيجية المصادقة (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: نافذة السياق الأصلية الافتراضية للنماذج ضمن هذا الموفر عندما لا يعيّن إدخال النموذج `contextWindow`.
    - `models.providers.*.contextTokens`: الحد الافتراضي الفعّال لسياق وقت التشغيل للنماذج ضمن هذا الموفر عندما لا يعيّن إدخال النموذج `contextTokens`.
    - `models.providers.*.maxTokens`: الحد الافتراضي لرموز الإخراج للنماذج ضمن هذا الموفر عندما لا يعيّن إدخال النموذج `maxTokens`.
    - `models.providers.*.timeoutSeconds`: مهلة اختيارية، بالثواني، لطلبات HTTP الخاصة بنموذج كل موفر، وتشمل الاتصال والترويسات والجسم ومعالجة إيقاف الطلب الكلي.
    - `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama + `openai-completions`، يحقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
    - `models.providers.*.authHeader`: يفرض نقل الاعتماد في ترويسة `Authorization` عند الحاجة.
    - `models.providers.*.baseUrl`: عنوان URL الأساسي لواجهة API upstream.
    - `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه الوكيل/المستأجر.

  </Accordion>
  <Accordion title="تجاوزات نقل الطلبات">
    `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بموفر النموذج.

    - `request.headers`: ترويسات إضافية (مدمجة مع افتراضيات الموفر). تقبل القيم SecretRef.
    - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` (استخدم المصادقة المدمجة الخاصة بالموفر)، `"authorization-bearer"` (مع `token`)، `"header"` (مع `headerName` و`value` و`prefix` اختياري).
    - `request.proxy`: تجاوز وكيل HTTP. الأوضاع: `"env-proxy"` (استخدم متغيرات بيئة `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (مع `url`). يقبل كلا الوضعين كائنًا فرعيًا اختياريًا `tls`.
    - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca`، `cert`، `key`، `passphrase` (كلها تقبل SecretRef)، و`serverName`، و`insecureSkipVerify`.
    - `request.allowPrivateNetwork`: عندما تكون `true`، تسمح لـ HTTPS إلى `baseUrl` عندما يتحلل DNS إلى نطاقات خاصة أو CGNAT أو نطاقات مشابهة، عبر حارس جلب HTTP الخاص بالموفر (اشتراك من المشغّل لنقاط نهاية موثوقة ذاتية الاستضافة ومتوافقة مع OpenAI). يُسمح تلقائيًا بعناوين URL لبث موفر النماذج عبر loopback مثل `localhost` و`127.0.0.1` و`[::1]` ما لم تُعيّن هذه القيمة صراحة إلى `false`؛ لا تزال مضيفات LAN وtailnet وDNS الخاصة تتطلب الاشتراك. يستخدم WebSocket قيمة `request` نفسها للترويسات/TLS لكن لا يستخدم بوابة fetch SSRF تلك. الافتراضي `false`.

  </Accordion>
  <Accordion title="إدخالات كتالوج النماذج">
    - `models.providers.*.models`: إدخالات كتالوج نماذج الموفر الصريحة.
    - `models.providers.*.models.*.input`: وسائط إدخال النموذج. استخدم `["text"]` للنماذج النصية فقط و`["text", "image"]` لنماذج الصور/الرؤية الأصلية. لا تُحقن مرفقات الصور في أدوار الوكيل إلا عندما يكون النموذج المحدد موسومًا بأنه يدعم الصور.
    - `models.providers.*.models.*.contextWindow`: بيانات تعريف نافذة السياق الأصلية للنموذج. يتجاوز هذا `contextWindow` على مستوى الموفر لذلك النموذج.
    - `models.providers.*.models.*.contextTokens`: حد اختياري لسياق وقت التشغيل. يتجاوز هذا `contextTokens` على مستوى الموفر؛ استخدمه عندما تريد ميزانية سياق فعّالة أصغر من `contextWindow` الأصلية للنموذج؛ يعرض `openclaw models list` القيمتين عندما تختلفان.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير فارغ وغير أصلي (المضيف ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة إلى `false` في وقت التشغيل. يحافظ `baseUrl` الفارغ/المحذوف على سلوك OpenAI الافتراضي.
    - `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية الدردشة المتوافقة مع OpenAI التي تقبل سلاسل فقط. عندما تكون `true`، يسطّح OpenClaw مصفوفات `messages[].content` ذات النص الخالص إلى سلاسل عادية قبل إرسال الطلب.

  </Accordion>
  <Accordion title="اكتشاف Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS للاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف الموفر من أجل اكتشاف موجه.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصل الاستقصاء لتحديث الاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الاحتياطي الأقصى لرموز الإخراج للنماذج المكتشفة.

  </Accordion>
</AccordionGroup>

يستنتج إعداد الموفر المخصص التفاعلي إدخال الصور لمعرّفات نماذج الرؤية الشائعة مثل GPT-4o وClaude وGemini وQwen-VL وLLaVA وPixtral وInternVL وMllama وMiniCPM-V وGLM-4V، ويتجاوز السؤال الإضافي للعائلات المعروفة بأنها نصية فقط. لا تزال معرّفات النماذج غير المعروفة تطلب تحديد دعم الصور. يستخدم الإعداد غير التفاعلي الاستنتاج نفسه؛ مرّر `--custom-image-input` لفرض بيانات تعريف تدعم الصور أو `--custom-text-input` لفرض بيانات تعريف نصية فقط.

### أمثلة الموفرين

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    يمكن لـ Plugin الموفر المرفق `cerebras` ضبط هذا عبر `openclaw onboard --auth-choice cerebras-api-key`. استخدم إعدادات موفر صريحة فقط عند تجاوز الافتراضيات.

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
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    متوافق مع Anthropic، وموفر مدمج. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="النماذج المحلية (LM Studio)">
    راجع [النماذج المحلية](/ar/gateway/local-models). باختصار: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ وأبقِ النماذج المستضافة مدمجة لاستخدامها كبديل احتياطي.
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

    اضبط `MINIMAX_API_KEY`. الاختصارات: `openclaw onboard --auth-choice minimax-global-api` أو `openclaw onboard --auth-choice minimax-cn-api`. يفترض كتالوج النماذج استخدام M2.7 فقط افتراضيًا. في مسار البث المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax افتراضيًا ما لم تضبط `thinking` بنفسك صراحةً. يعيد `/fast on` أو `params.fastMode: true` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

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

    بالنسبة إلى نقطة نهاية الصين: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

    تعلن نقاط نهاية Moonshot الأصلية عن توافق استخدام البث على ناقل `openai-completions` المشترك، ويحدد OpenClaw ذلك بناءً على قدرات نقطة النهاية بدلًا من معرّف المزوّد المدمج وحده.

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

    يجب أن يحذف عنوان URL الأساسي `/v1` (إذ يضيفه عميل Anthropic). الاختصار: `openclaw onboard --auth-choice synthetic-api-key`.

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

    اضبط `ZAI_API_KEY`. تُقبل `z.ai/*` و`z-ai/*` كأسماء بديلة. الاختصار: `openclaw onboard --auth-choice zai-api-key`.

    - نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
    - نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
    - بالنسبة إلى نقطة النهاية العامة، عرّف مزوّدًا مخصصًا مع تجاوز عنوان URL الأساسي.

  </Accordion>
</AccordionGroup>

---

## ذات صلة

- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [الإعدادات — القنوات](/ar/gateway/config-channels)
- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح عليا أخرى
- [الأدوات والـ plugins](/ar/tools)
