---
read_when:
    - إعداد سياسة `tools.*` أو allowlists أو الميزات التجريبية
    - تسجيل موفّرين مخصصين أو تجاوز Base URLs
    - إعداد نقاط نهاية مستضافة ذاتيًا ومتوافقة مع OpenAI
summary: إعدادات الأدوات (السياسة، وعمليات التبديل التجريبية، والأدوات المدعومة من الموفّر) وإعداد موفّر/‏Base URL مخصصين
title: الإعدادات — الأدوات والموفّرون المخصصون
x-i18n:
    generated_at: "2026-04-24T07:40:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92535fb937f688c7cd39dcf5fc55f4663c8d234388a46611527efad4b7ee85eb
    source_path: gateway/config-tools.md
    workflow: 15
---

مفاتيح الإعدادات `tools.*` وإعداد الموفّر المخصص / ‏Base URL. وبالنسبة إلى الوكلاء،
والقنوات، ومفاتيح الإعدادات الأخرى ذات المستوى الأعلى، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference).

## الأدوات

### ملفات تعريف الأدوات

تضبط `tools.profile` ‏allowlist أساسية قبل `tools.allow`/`tools.deny`:

يقوم onboarding المحلي افتراضيًا بضبط الإعدادات المحلية الجديدة على `tools.profile: "coding"` عند عدم تعيينها (وتُحفَظ ملفات التعريف الصريحة الموجودة).

| ملف التعريف | يتضمن                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` فقط                                                                                                            |
| `coding`    | `group:fs` و`group:runtime` و`group:web` و`group:sessions` و`group:memory` و`cron` و`image` و`image_generate` و`video_generate` |
| `messaging` | `group:messaging` و`sessions_list` و`sessions_history` و`sessions_send` و`session_status`                                       |
| `full`      | بلا قيود (مثل الحالة غير المعيّنة)                                                                                              |

### مجموعات الأدوات

| المجموعة           | الأدوات                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec` و`process` و`code_execution` ‏(`bash` مقبول كاسم مستعار لـ `exec`)                                                |
| `group:fs`         | `read` و`write` و`edit` و`apply_patch`                                                                                   |
| `group:sessions`   | `sessions_list` و`sessions_history` و`sessions_send` و`sessions_spawn` و`sessions_yield` و`subagents` و`session_status` |
| `group:memory`     | `memory_search` و`memory_get`                                                                                            |
| `group:web`        | `web_search` و`x_search` و`web_fetch`                                                                                    |
| `group:ui`         | `browser` و`canvas`                                                                                                      |
| `group:automation` | `cron` و`gateway`                                                                                                        |
| `group:messaging`  | `message`                                                                                                                |
| `group:nodes`      | `nodes`                                                                                                                  |
| `group:agents`     | `agents_list`                                                                                                            |
| `group:media`      | `image` و`image_generate` و`video_generate` و`tts`                                                                       |
| `group:openclaw`   | جميع الأدوات المدمجة (باستثناء Plugins المزوّد)                                                                         |

### `tools.allow` / `tools.deny`

سياسة السماح/المنع العامة للأدوات (المنع يفوز). غير حساسة لحالة الأحرف، وتدعم wildcard ‏`*`. وتُطبَّق حتى عندما يكون Docker sandbox معطّلًا.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

تقيّد الأدوات بشكل إضافي لموفّرين أو نماذج محددة. الترتيب: ملف التعريف الأساسي ← ملف تعريف الموفّر ← السماح/المنع.

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

يتحكم في وصول exec المرتفع خارج sandbox:

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

- يمكن لتجاوز كل وكيل (`agents.list[].tools.elevated`) أن يزيد التقييد فقط.
- يخزن `/elevated on|off|ask|full` الحالة لكل جلسة؛ وتُطبَّق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع العزل sandboxing ويستخدم مسار الهروب المهيأ (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

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

تكون فحوصات أمان حلقات الأدوات **معطّلة افتراضيًا**. اضبط `enabled: true` لتفعيل الاكتشاف.
يمكن تعريف الإعدادات عالميًا في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.

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

- `historySize`: الحد الأقصى لسجل استدعاءات الأدوات المحتفَظ به لتحليل الحلقات.
- `warningThreshold`: حد نمط التكرار غير المتقدم لإطلاق التحذيرات.
- `criticalThreshold`: حد تكرار أعلى لحظر الحلقات الحرجة.
- `globalCircuitBreakerThreshold`: حد إيقاف صارم لأي تشغيل بلا تقدم.
- `detectors.genericRepeat`: التحذير عند تكرار استدعاءات الأداة نفسها/الوسائط نفسها.
- `detectors.knownPollNoProgress`: التحذير/الحظر على أدوات polling المعروفة (`process.poll` و`command_status` وما شابه).
- `detectors.pingPong`: التحذير/الحظر على أنماط الأزواج المتناوبة بلا تقدم.
- إذا كانت `warningThreshold >= criticalThreshold` أو `criticalThreshold >= globalCircuitBreakerThreshold`، يفشل التحقق.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // أو env ‏BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // اختياري؛ احذفه للاكتشاف التلقائي
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
        directSend: false, // اشتراك اختياري: أرسل الموسيقى/الفيديو غير المتزامن المكتمل مباشرةً إلى القناة
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
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="حقول إدخال نموذج الوسائط">

**إدخال الموفّر** (`type: "provider"` أو عند حذفه):

- `provider`: معرّف موفّر API ‏(`openai` و`anthropic` و`google`/`gemini` و`groq` وما إلى ذلك)
- `model`: تجاوز معرّف النموذج
- `profile` / `preferredProfile`: اختيار ملف تعريف `auth-profiles.json`

**إدخال CLI** (`type: "cli"`):

- `command`: الملف التنفيذي المطلوب تشغيله
- `args`: وسائط ذات قوالب (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}` وما إلى ذلك)

**الحقول المشتركة:**

- `capabilities`: قائمة اختيارية (`image` و`audio` و`video`). القيم الافتراضية: ‏`openai`/`anthropic`/`minimax` ← صورة، و`google` ← صورة+صوت+فيديو، و`groq` ← صوت.
- `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
- تعود الأعطال احتياطيًا إلى الإدخال التالي.

تتبع مصادقة الموفّر الترتيب القياسي: ‏`auth-profiles.json` ← متغيرات البيئة ← `models.providers.*.apiKey`.

**حقول الإكمال غير المتزامن:**

- `asyncCompletion.directSend`: عندما تكون `true`، تحاول مهام
  `music_generate` و`video_generate` غير المتزامنة المكتملة التسليم المباشر إلى القناة أولًا. الافتراضي: `false`
  (مسار legacy الخاص بإيقاظ جلسة الطالب/تسليم النموذج).

</Accordion>

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

الافتراضي: `tree` ‏(الجلسة الحالية + الجلسات التي أنشأتها، مثل الوكلاء الفرعيين).

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

ملاحظات:

- `self`: مفتاح الجلسة الحالية فقط.
- `tree`: الجلسة الحالية + الجلسات التي أنشأتها الجلسة الحالية (الوكلاء الفرعيون).
- `agent`: أي جلسة تنتمي إلى معرّف الوكيل الحالي (وقد يتضمن ذلك مستخدمين آخرين إذا كنت تشغّل جلسات لكل مرسل تحت معرّف الوكيل نفسه).
- `all`: أي جلسة. ولا يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
- تقييد sandbox: عندما تكون الجلسة الحالية داخل sandbox ويكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرض الرؤية إلى `tree` حتى إذا كانت `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمنة لـ `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // اشتراك اختياري: اضبطها على true للسماح بمرفقات الملفات المضمنة
        maxTotalBytes: 5242880, // 5 MB إجمالًا عبر جميع الملفات
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB لكل ملف
        retainOnSessionKeep: false, // الاحتفاظ بالمرفقات عندما يكون cleanup="keep"
      },
    },
  },
}
```

ملاحظات:

- لا تُدعم المرفقات إلا مع `runtime: "subagent"`. أما وقت تشغيل ACP فيرفضها.
- تُحوَّل الملفات إلى مساحة عمل الطفل ضمن `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
- يتم تنقيح محتوى المرفقات تلقائيًا من استمرار transcript.
- يتم التحقق من مدخلات base64 بفحوص صارمة للأبجدية/الحشو وحارس حجم قبل فك الترميز.
- أذونات الملفات هي `0700` للأدلة و`0600` للملفات.
- يتبع التنظيف سياسة `cleanup`: يقوم `delete` دائمًا بإزالة المرفقات؛ بينما يحتفظ `keep` بها فقط عندما تكون `retainOnSessionKeep: true`.

<a id="toolsexperimental"></a>

### `tools.experimental`

علامات الأدوات المدمجة التجريبية. تكون معطلة افتراضيًا ما لم تنطبق قاعدة تمكين تلقائي صارمة لـ GPT-5 agentic.

```json5
{
  tools: {
    experimental: {
      planTool: true, // تمكين update_plan التجريبية
    },
  },
}
```

ملاحظات:

- `planTool`: يفعّل أداة `update_plan` المنظّمة لتتبع الأعمال غير التافهة متعددة الخطوات.
- الافتراضي: `false` ما لم يتم تعيين `agents.defaults.embeddedPi.executionContract` (أو تجاوز لكل وكيل) إلى `"strict-agentic"` لتشغيل من عائلة GPT-5 الخاصة بـ OpenAI أو OpenAI Codex. اضبطه إلى `true` لفرض تشغيل الأداة خارج هذا النطاق، أو إلى `false` لإبقائها معطلة حتى لتشغيلات GPT-5 ذات strict-agentic.
- عند التمكين، تضيف مطالبة النظام أيضًا إرشادات استخدام بحيث لا يستخدمها النموذج إلا للأعمال الجوهرية ويُبقي خطوة واحدة فقط على الأكثر في حالة `in_progress`.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين الذين يتم إنشاؤهم. وإذا تم حذفه، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: allowlist افتراضية لمعرّفات الوكلاء المستهدفة لـ `sessions_spawn` عندما لا يعيّن الوكيل الطالب القيمة `subagents.allowAgents` الخاصة به (`["*"]` = أي وكيل؛ الافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة قيمة `runTimeoutSeconds`. وتعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## الموفّرون المخصصون وBase URLs

يستخدم OpenClaw فهرس النماذج المدمج. أضف موفّرين مخصصين عبر `models.providers` في الإعدادات أو في `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (الافتراضي) | replace
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

- استخدم `authHeader: true` + `headers` لاحتياجات المصادقة المخصصة.
- تجاوز جذر إعدادات الوكيل عبر `OPENCLAW_AGENT_DIR` ‏(أو `PI_CODING_AGENT_DIR`، وهو اسم مستعار قديم لمتغير بيئة).
- أولوية الدمج لمعرّفات الموفّرين المتطابقة:
  - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاصة بالوكيل.
  - تفوز قيم `apiKey` غير الفارغة الخاصة بالوكيل فقط عندما لا يكون ذلك الموفّر مُدارًا عبر SecretRef في سياق الإعداد/ملف تعريف المصادقة الحالي.
  - يتم تحديث قيم `apiKey` الخاصة بالموفّرين المُدارين عبر SecretRef من علامات المصدر (`ENV_VAR_NAME` لإشارات env، و`secretref-managed` لإشارات file/exec) بدلًا من حفظ الأسرار المحلولة.
  - يتم تحديث قيم ترويسات الموفّرين المُدارة عبر SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لإشارات env، و`secretref-managed` لإشارات file/exec).
  - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة في الوكيل إلى `models.providers` في الإعدادات.
  - تستخدم القيمتان `contextWindow`/`maxTokens` للنموذج المتطابق القيمة الأعلى بين الإعداد الصريح وقيم الفهرس الضمنية.
  - تحافظ `contextTokens` للنموذج المتطابق على حد وقت تشغيل صريح عند وجوده؛ استخدمها لتقييد السياق الفعلي من دون تغيير بيانات النموذج الأصلية.
  - استخدم `models.mode: "replace"` عندما تريد من الإعدادات إعادة كتابة `models.json` بالكامل.
  - يكون حفظ العلامات معتمدًا على المصدر: تُكتب العلامات من لقطة إعدادات المصدر النشطة (قبل الحل)، وليس من قيم الأسرار المحلولة في وقت التشغيل.

### تفاصيل حقول الموفّر

- `models.mode`: سلوك فهرس الموفّر (`merge` أو `replace`).
- `models.providers`: خريطة الموفّرين المخصصين مفاتيحها معرّف الموفّر.
  - تعديلات آمنة: استخدم `openclaw config set models.providers.<id> '<json>' --strict-json --merge` أو `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` للتحديثات الإضافية. يرفض `config set` عمليات الاستبدال المدمّرة ما لم تمرر `--replace`.
- `models.providers.*.api`: محوّل الطلبات (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai` وما إلى ذلك).
- `models.providers.*.apiKey`: بيانات اعتماد الموفّر (يُفضّل SecretRef/استبدال env).
- `models.providers.*.auth`: استراتيجية المصادقة (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama + `openai-completions`، يحقن `options.num_ctx` داخل الطلبات (الافتراضي: `true`).
- `models.providers.*.authHeader`: فرض نقل بيانات الاعتماد في ترويسة `Authorization` عند الحاجة.
- `models.providers.*.baseUrl`: Base URL للـ API في المنبع.
- `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه الوكيل/المستأجر.
- `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بموفّر النموذج.
  - `request.headers`: ترويسات إضافية (تُدمج مع افتراضيات الموفّر). تقبل القيم SecretRef.
  - `request.auth`: تجاوز استراتيجية المصادقة. الأوضاع: `"provider-default"` ‏(استخدام المصادقة المدمجة للموفّر)، و`"authorization-bearer"` ‏(مع `token`)، و`"header"` ‏(مع `headerName` و`value` و`prefix` اختياري).
  - `request.proxy`: تجاوز HTTP proxy. الأوضاع: `"env-proxy"` ‏(استخدام متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`) و`"explicit-proxy"` ‏(مع `url`). ويقبل كلا الوضعين كائنًا فرعيًا اختياريًا `tls`.
  - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` ‏(كلها تقبل SecretRef) و`serverName` و`insecureSkipVerify`.
  - `request.allowPrivateNetwork`: عندما تكون `true`، السماح باستخدام HTTPS إلى `baseUrl` عندما يُحل DNS إلى نطاقات خاصة أو CGNAT أو ما شابه، عبر حاجز جلب HTTP الخاص بالموفّر (اشتراك من المشغّل لنقاط نهاية موثوقة ومستضافة ذاتيًا ومتوافقة مع OpenAI). يستخدم WebSocket القيمة `request` نفسها للترويسات/TLS ولكن ليس لحاجز SSRF الخاص بالجلب. الافتراضي `false`.
- `models.providers.*.models`: إدخالات فهرس نماذج صريحة للموفّر.
- `models.providers.*.models.*.contextWindow`: بيانات وصفية أصلية لنافذة سياق النموذج.
- `models.providers.*.models.*.contextTokens`: حد سياق اختياري لوقت التشغيل. استخدم هذا عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير فارغ وغير أصلي (المضيف ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة إلى `false` في وقت التشغيل. أما `baseUrl` الفارغة/المحذوفة فتبقي سلوك OpenAI الافتراضي.
- `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية الدردشة المتوافقة مع OpenAI والتي تدعم النصوص فقط. عندما تكون `true`، يقوم OpenClaw بتسطيح مصفوفات `messages[].content` النصية الخالصة إلى سلاسل عادية قبل إرسال الطلب.
- `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
- `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS الخاصة بالاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف الموفّر من أجل اكتشاف مستهدف.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: الفاصل الزمني للاستطلاع من أجل تحديث الاكتشاف.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الافتراضية الاحتياطية للنماذج المكتشفة.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الأقصى الافتراضي الاحتياطي لرموز المخرجات للنماذج المكتشفة.

### أمثلة على الموفّرين

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
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
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

استخدم `cerebras/zai-glm-4.7` من أجل Cerebras؛ واستخدم `zai/glm-4.7` من أجل Z.AI المباشر.

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

اضبط `OPENCODE_API_KEY` ‏(أو `OPENCODE_ZEN_API_KEY`). استخدم مراجع `opencode/...` لفهرس Zen أو مراجع `opencode-go/...` لفهرس Go. اختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

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

اضبط `ZAI_API_KEY`. وتُقبل `z.ai/*` و`z-ai/*` كأسماء مستعارة. اختصار: `openclaw onboard --auth-choice zai-api-key`.

- نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
- نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
- بالنسبة إلى نقطة النهاية العامة، عرّف موفّرًا مخصصًا مع تجاوز Base URL.

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

تعلن نقاط نهاية Moonshot الأصلية عن توافق استخدام البث على نقل
`openai-completions` المشترك، ويعتمد OpenClaw في ذلك على قدرات نقطة النهاية
وليس على معرّف الموفّر المدمج وحده.

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

موفّر مدمج ومتوافق مع Anthropic. اختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

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

يجب أن يحذف Base URL اللاحقة `/v1` ‏(عميل Anthropic يضيفها). اختصار: `openclaw onboard --auth-choice synthetic-api-key`.

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
            input: ["text", "image"],
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

اضبط `MINIMAX_API_KEY`. الاختصارات:
`openclaw onboard --auth-choice minimax-global-api` أو
`openclaw onboard --auth-choice minimax-cn-api`.
يستخدم فهرس النماذج M2.7 فقط افتراضيًا.
على مسار البث المتوافق مع Anthropic، يقوم OpenClaw بتعطيل التفكير في MiniMax
افتراضيًا ما لم تقم بتعيين `thinking` بنفسك صراحةً. وتقوم `/fast on` أو
`params.fastMode: true` بإعادة كتابة `MiniMax-M2.7` إلى
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="النماذج المحلية (LM Studio)">

راجع [النماذج المحلية](/ar/gateway/local-models). الخلاصة: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ واحتفظ بالنماذج المستضافة مدمجة من أجل الرجوع الاحتياطي.

</Accordion>

---

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference) — مفاتيح المستوى الأعلى الأخرى
- [الإعدادات — الوكلاء](/ar/gateway/config-agents)
- [الإعدادات — القنوات](/ar/gateway/config-channels)
- [الأدوات وPlugins](/ar/tools)
