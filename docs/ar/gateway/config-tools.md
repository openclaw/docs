---
read_when:
    - تكوين سياسة `tools.*` أو قوائم السماح أو الميزات التجريبية
    - تسجيل موفّرين مخصّصين أو تجاوز عناوين URL الأساسية
    - إعداد نقاط نهاية مستضافة ذاتيًا متوافقة مع OpenAI
sidebarTitle: Tools and custom providers
summary: تكوين الأدوات (السياسة، مفاتيح التبديل التجريبية، الأدوات المدعومة من المزوّد) وإعداد المزوّد/عنوان URL الأساسي المخصّص
title: التكوين — الأدوات والمزوّدون المخصّصون
x-i18n:
    generated_at: "2026-05-06T07:53:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7230354339e14ce25ad1fc232528634d92ba86125d908450c1ee5e04b4434e9
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` مفاتيح إعدادات وإعداد مزود مخصص / عنوان URL أساسي. بالنسبة إلى الوكلاء والقنوات ومفاتيح الإعدادات العليا الأخرى، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference).

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

<Note>
تضبط تهيئة الإعداد المحلي الافتراضي الإعدادات المحلية الجديدة على `tools.profile: "coding"` عند عدم تعيينها (تُحفظ ملفات التعريف الصريحة الموجودة).
</Note>

| ملف التعريف | يتضمن                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | بلا قيود (مثل عدم التعيين)                                                                                                  |

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
| `group:openclaw`   | جميع الأدوات المضمنة (باستثناء Plugins المزود)                                                                          |

### `tools.allow` / `tools.deny`

سياسة السماح/الرفض العامة للأدوات (الرفض يتغلب). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. تُطبّق حتى عندما يكون عزل Docker متوقفًا.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` و`apply_patch` هما معرفا أداتين منفصلان. `allow: ["write"]` يفعّل أيضًا `apply_patch` للنماذج المتوافقة، لكن `deny: ["write"]` لا يرفض `apply_patch`. لحظر كل تعديلات الملفات، ارفض `group:fs` أو اذكر كل أداة تعدّل الملفات صراحة:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

يقيد الأدوات أكثر لمزودين أو نماذج محددة. الترتيب: ملف التعريف الأساسي ← ملف تعريف المزود ← السماح/الرفض.

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

يتحكم في وصول `exec` المرتفع خارج العزل:

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

- يمكن للتجاوز على مستوى كل وكيل (`agents.list[].tools.elevated`) أن يقيّد أكثر فقط.
- يخزن `/elevated on|off|ask|full` الحالة لكل جلسة؛ وتُطبّق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع العزل ويستخدم مسار الهروب المضبوط (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

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

تكون فحوصات سلامة حلقات الأدوات **معطلة افتراضيًا**. اضبط `enabled: true` لتفعيل الاكتشاف. يمكن تعريف الإعدادات عموميًا في `tools.loopDetection` وتجاوزها لكل وكيل عند `agents.list[].tools.loopDetection`.

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
  عتبة الإيقاف الصارم لأي تشغيل بلا تقدم.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  التحذير عند تكرار استدعاءات الأداة نفسها/الوسائط نفسها.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  التحذير/الحظر عند أدوات الاستطلاع المعروفة (`process.poll`, `command_status`, إلخ).
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

    - `provider`: معرّف مزوّد API ‏(`openai`، `anthropic`، `google`/`gemini`، `groq`، إلخ)
    - `model`: تجاوز معرّف النموذج
    - `profile` / `preferredProfile`: اختيار ملف تعريف `auth-profiles.json`

    **إدخال CLI** (`type: "cli"`):

    - `command`: الملف التنفيذي المراد تشغيله
    - `args`: وسائط مقولبة (تدعم `{{MediaPath}}`، `{{Prompt}}`، `{{MaxChars}}`، إلخ؛ يرحّل `openclaw doctor --fix` عناصر `{input}` النائبة المهملة إلى `{{MediaPath}}`)

    **الحقول المشتركة:**

    - `capabilities`: قائمة اختيارية (`image`، `audio`، `video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` ← صورة، `google` ← صورة+صوت+فيديو، `groq` ← صوت.
    - `prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`: تجاوزات لكل إدخال.
    - تنطبق أيضًا إدخالات `tools.media.image.timeoutSeconds` وإدخالات `timeoutSeconds` المطابقة لنموذج الصورة عندما يستدعي الوكيل أداة `image` الصريحة.
    - تعود حالات الفشل إلى الإدخال التالي.

    يتبع توثيق المزوّد الترتيب القياسي: `auth-profiles.json` ← متغيرات البيئة ← `models.providers.*.apiKey`.

    **حقول الإكمال غير المتزامن:**

    - `asyncCompletion.directSend`: علامة توافق مهملة. تبقى مهام الوسائط غير المتزامنة المكتملة وسيطة عبر جلسة الطالب، بحيث يتلقى الوكيل النتيجة ويقرر كيفية إخبار المستخدم ويستخدم أداة الرسائل عندما يتطلب تسليم المصدر ذلك.

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
  <Accordion title="Visibility scopes">
    - `self`: مفتاح الجلسة الحالية فقط.
    - `tree`: الجلسة الحالية + الجلسات التي أنشأتها الجلسة الحالية (الوكلاء الفرعيون).
    - `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (قد تشمل مستخدمين آخرين إذا شغّلت جلسات لكل مرسل ضمن معرّف الوكيل نفسه).
    - `all`: أي جلسة. لا يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
    - تقييد صندوق العزل: عندما تكون الجلسة الحالية داخل صندوق عزل و`agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض الرؤية على `tree` حتى إذا كان `tools.sessions.visibility="all"`.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمنة لـ `sessions_spawn`.

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
  <Accordion title="Attachment notes">
    - المرفقات مدعومة فقط لـ `runtime: "subagent"`. يرفض وقت تشغيل ACP استخدامها.
    - تُنشأ الملفات فعليًا في مساحة العمل الفرعية عند `.openclaw/attachments/<uuid>/` مع `.manifest.json`.
    - يُنقّح محتوى المرفقات تلقائيًا من حفظ النصوص المنسوخة.
    - تُتحقق مدخلات Base64 بفحوصات صارمة للأبجدية/الحشو وحارس حجم قبل فك الترميز.
    - أذونات الملفات هي `0700` للأدلة و`0600` للملفات.
    - يتبع التنظيف سياسة `cleanup`: يزيل `delete` المرفقات دائمًا؛ ويحتفظ بها `keep` فقط عندما تكون `retainOnSessionKeep: true`.

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

- `planTool`: يفعّل أداة `update_plan` المهيكلة لتتبع العمل متعدد الخطوات غير البسيط.
- الافتراضي: `false` ما لم يُضبط `agents.defaults.embeddedPi.executionContract` (أو تجاوز خاص بكل وكيل) على `"strict-agentic"` لتشغيل عائلة GPT-5 من OpenAI أو OpenAI Codex. اضبطه على `true` لفرض تشغيل الأداة خارج هذا النطاق، أو `false` لإبقائها معطلة حتى في تشغيلات GPT-5 ذات `strict-agentic`.
- عند التفعيل، يضيف موجه النظام أيضًا إرشادات استخدام بحيث لا يستخدمها النموذج إلا للعمل الكبير، ويحافظ على خطوة واحدة على الأكثر بالحالة `in_progress`.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين المُنشأين. إذا حُذف، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرفات الوكلاء المستهدفين لـ `sessions_spawn` عندما لا يضبط الوكيل الطالب `subagents.allowAgents` الخاص به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة `runTimeoutSeconds`. تعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## المزوّدون المخصصون وعناوين URL الأساسية

يستخدم OpenClaw كتالوج النماذج المدمج. أضف مزودين مخصصين عبر `models.providers` في الإعدادات أو `~/.openclaw/agents/<agentId>/agent/models.json`.

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
  <Accordion title="Auth and merge precedence">
    - استخدم `authHeader: true` + `headers` لاحتياجات المصادقة المخصصة.
    - تجاوز جذر إعدادات الوكيل باستخدام `OPENCLAW_AGENT_DIR` (أو `PI_CODING_AGENT_DIR`، وهو اسم بديل قديم لمتغير بيئة).
    - أسبقية الدمج لمعرفات المزودين المتطابقة:
      - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاص بالوكيل.
      - تفوز قيم `apiKey` غير الفارغة في الوكيل فقط عندما لا يكون ذلك المزود مُدارًا بواسطة SecretRef في سياق الإعدادات/ملف تعريف المصادقة الحالي.
      - تُحدّث قيم `apiKey` للمزود المُدار بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لمراجع متغيرات البيئة، و`secretref-managed` لمراجع الملف/التنفيذ) بدلًا من حفظ الأسرار المحلولة.
      - تُحدّث قيم ترويسة المزود المُدار بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لمراجع متغيرات البيئة، و`secretref-managed` لمراجع الملف/التنفيذ).
      - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة في الوكيل إلى `models.providers` في الإعدادات.
      - تستخدم `contextWindow`/`maxTokens` للنموذج المطابق القيمة الأعلى بين الإعدادات الصريحة وقيم الكتالوج الضمنية.
      - تحافظ `contextTokens` للنموذج المطابق على حد وقت التشغيل الصريح عند وجوده؛ استخدمها للحد من السياق الفعال من دون تغيير بيانات تعريف النموذج الأصلية.
      - استخدم `models.mode: "replace"` عندما تريد من الإعدادات إعادة كتابة `models.json` بالكامل.
      - حفظ العلامات مرجعيته المصدر: تُكتب العلامات من لقطة إعدادات المصدر النشطة (قبل الحل)، وليس من قيم أسرار وقت التشغيل المحلولة.

  </Accordion>
</AccordionGroup>

### تفاصيل حقول المزود

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: سلوك كتالوج المزودين (`merge` أو `replace`).
    - `models.providers`: خريطة مزودين مخصصة مفهرسة بمعرف المزود.
      - التعديلات الآمنة: استخدم `openclaw config set models.providers.<id> '<json>' --strict-json --merge` أو `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` للتحديثات الإضافية. يرفض `config set` الاستبدالات المدمرة ما لم تمرر `--replace`.

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: محوّل الطلبات (`openai-completions`، `openai-responses`، `anthropic-messages`، `google-generative-ai`، إلخ). للواجهات الخلفية ذاتية الاستضافة `/v1/chat/completions` مثل MLX وvLLM وSGLang ومعظم الخوادم المحلية المتوافقة مع OpenAI، استخدم `openai-completions`. مزود مخصص لديه `baseUrl` من دون `api` يستخدم افتراضيًا `openai-completions`؛ اضبط `openai-responses` فقط عندما تدعم الواجهة الخلفية `/v1/responses`.
    - `models.providers.*.apiKey`: اعتماد المزود (يفضل استبدال SecretRef/متغيرات البيئة).
    - `models.providers.*.auth`: استراتيجية المصادقة (`api-key`، `token`، `oauth`، `aws-sdk`).
    - `models.providers.*.contextWindow`: نافذة السياق الأصلية الافتراضية للنماذج تحت هذا المزود عندما لا يضبط إدخال النموذج `contextWindow`.
    - `models.providers.*.contextTokens`: حد سياق وقت التشغيل الفعال الافتراضي للنماذج تحت هذا المزود عندما لا يضبط إدخال النموذج `contextTokens`.
    - `models.providers.*.maxTokens`: حد رموز الإخراج الافتراضي للنماذج تحت هذا المزود عندما لا يضبط إدخال النموذج `maxTokens`.
    - `models.providers.*.timeoutSeconds`: مهلة اختيارية لطلبات HTTP الخاصة بنموذج كل مزود بالثواني، وتشمل الاتصال والترويسات والجسم ومعالجة إلغاء الطلب الكلي.
    - `models.providers.*.injectNumCtxForOpenAICompat`: لـ Ollama + `openai-completions`، احقن `options.num_ctx` في الطلبات (الافتراضي: `true`).
    - `models.providers.*.authHeader`: فرض نقل الاعتماد في ترويسة `Authorization` عند الحاجة.
    - `models.providers.*.baseUrl`: عنوان URL الأساسي لواجهة API الصاعدة.
    - `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه الوكيل/المستأجر.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بمزود النموذج.

    - `request.headers`: ترويسات إضافية (تُدمج مع افتراضيات المزود). تقبل القيم SecretRef.
    - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` (استخدم المصادقة المدمجة للمزود)، `"authorization-bearer"` (مع `token`)، `"header"` (مع `headerName` و`value` و`prefix` الاختياري).
    - `request.proxy`: تجاوز وكيل HTTP. الأوضاع: `"env-proxy"` (استخدم متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`)، `"explicit-proxy"` (مع `url`). يقبل كلا الوضعين كائنًا فرعيًا اختياريًا `tls`.
    - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` (كلها تقبل SecretRef)، و`serverName` و`insecureSkipVerify`.
    - `request.allowPrivateNetwork`: عند `true`، اسمح لـ HTTPS إلى `baseUrl` عندما يحل DNS إلى نطاقات خاصة أو CGNAT أو نطاقات مشابهة، عبر حارس جلب HTTP الخاص بالمزود (اشتراك صريح من المشغّل لنقاط النهاية ذاتية الاستضافة الموثوقة المتوافقة مع OpenAI). يُسمح تلقائيًا بعناوين URL لتدفق مزود النموذج على local loopback مثل `localhost` و`127.0.0.1` و`[::1]` ما لم يُضبط هذا صراحةً على `false`؛ ولا تزال مضيفات LAN وtailnet وDNS الخاص تتطلب اشتراكًا صريحًا. يستخدم WebSocket نفس `request` للترويسات/TLS ولكن لا يستخدم بوابة SSRF الخاصة بالجلب تلك. الافتراضي `false`.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: إدخالات كتالوج نماذج المزود الصريحة.
    - `models.providers.*.models.*.input`: وسائط إدخال النموذج. استخدم `["text"]` للنماذج النصية فقط و`["text", "image"]` لنماذج الصور/الرؤية الأصلية. لا تُحقن مرفقات الصور في دورات الوكيل إلا عندما يكون النموذج المحدد معلّمًا كقادر على الصور.
    - `models.providers.*.models.*.contextWindow`: بيانات تعريف نافذة سياق النموذج الأصلية. يتجاوز هذا `contextWindow` على مستوى المزود لذلك النموذج.
    - `models.providers.*.models.*.contextTokens`: حد سياق وقت تشغيل اختياري. يتجاوز هذا `contextTokens` على مستوى المزود؛ استخدمه عندما تريد ميزانية سياق فعالة أصغر من `contextWindow` الأصلية للنموذج؛ يعرض `openclaw models list` كلتا القيمتين عندما تختلفان.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير أصلي وغير فارغ (مضيف ليس `api.openai.com`)، يفرض OpenClaw هذا إلى `false` في وقت التشغيل. يحافظ `baseUrl` الفارغ/المحذوف على سلوك OpenAI الافتراضي.
    - `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية الدردشة المتوافقة مع OpenAI والمخصصة للسلاسل النصية فقط. عند `true`، يسطّح OpenClaw مصفوفات `messages[].content` النصية الخالصة إلى سلاسل نصية عادية قبل إرسال الطلب.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي في Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS للاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرف المزود للاكتشاف الموجه.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فاصل الاستطلاع لتحديث الاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة سياق احتياطية للنماذج المكتشفة.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: حد أقصى احتياطي لرموز الإخراج للنماذج المكتشفة.

  </Accordion>
</AccordionGroup>

يستنتج إعداد المزود المخصص التفاعلي إدخال الصور لمعرفات نماذج الرؤية الشائعة مثل GPT-4o وClaude وGemini وQwen-VL وLLaVA وPixtral وInternVL وMllama وMiniCPM-V وGLM-4V، ويتجاوز السؤال الإضافي للعائلات المعروفة بأنها نصية فقط. لا تزال معرفات النماذج غير المعروفة تطلب دعم الصور. يستخدم الإعداد غير التفاعلي الاستنتاج نفسه؛ مرر `--custom-image-input` لفرض بيانات تعريف قادرة على الصور أو `--custom-text-input` لفرض بيانات تعريف نصية فقط.

### أمثلة المزودين

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    يمكن لـ Plugin المزود المضمن `cerebras` تكوين هذا عبر `openclaw onboard --auth-choice cerebras-api-key`. استخدم إعدادات مزود صريحة فقط عند تجاوز الافتراضيات.

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

    استخدم `cerebras/zai-glm-4.7` مع Cerebras؛ و`zai/glm-4.7` مع Z.AI المباشر.

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

    مزوّد مضمّن ومتوافق مع Anthropic. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    راجع [النماذج المحلية](/ar/gateway/local-models). باختصار: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ وأبقِ النماذج المستضافة مدمجة للرجوع الاحتياطي.
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
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

    اضبط `MINIMAX_API_KEY`. الاختصارات: `openclaw onboard --auth-choice minimax-global-api` أو `openclaw onboard --auth-choice minimax-cn-api`. تقتصر الإعدادات الافتراضية لفهرس النماذج على M2.7 فقط. على مسار البث المتوافق مع Anthropic، يعطّل OpenClaw تفكير MiniMax افتراضيًا ما لم تضبط `thinking` بنفسك صراحة. يعيد `/fast on` أو `params.fastMode: true` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

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

    لنقطة النهاية في الصين: `baseUrl: "https://api.moonshot.cn/v1"` أو `openclaw onboard --auth-choice moonshot-api-key-cn`.

    تعلن نقاط نهاية Moonshot الأصلية عن توافق استخدام البث على ناقل `openai-completions` المشترك، ويحدد OpenClaw ذلك بناءً على قدرات نقطة النهاية بدلًا من معرّف المزوّد المضمّن وحده.

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

    اضبط `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`). استخدم مراجع `opencode/...` لفهرس Zen أو مراجع `opencode-go/...` لفهرس Go. الاختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
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

    يجب أن يحذف عنوان URL الأساسي ‎`/v1`‎ (يضيفه عميل Anthropic). الاختصار: `openclaw onboard --auth-choice synthetic-api-key`.

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
    - لنقطة النهاية العامة، عرّف مزوّدًا مخصصًا مع تجاوز عنوان URL الأساسي.

  </Accordion>
</AccordionGroup>

---

## ذات صلة

- [التكوين — الوكلاء](/ar/gateway/config-agents)
- [التكوين — القنوات](/ar/gateway/config-channels)
- [مرجع التكوين](/ar/gateway/configuration-reference) — مفاتيح أخرى في المستوى الأعلى
- [الأدوات وPluginات](/ar/tools)
