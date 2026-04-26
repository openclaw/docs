---
read_when:
    - تكوين سياسة `tools.*` وقوائم السماح أو الميزات التجريبية
    - تسجيل مزوّدين مخصصين أو تجاوز عناوين URL الأساسية
    - إعداد نقاط نهاية مستضافة ذاتيًا ومتوافقة مع OpenAI
sidebarTitle: Tools and custom providers
summary: تكوين الأدوات (السياسة، والمفاتيح التجريبية، والأدوات المدعومة من المزوّد) وإعداد مزوّد/عنوان URL أساسي مخصص
title: التكوين — الأدوات والمزوّدون المخصصون
x-i18n:
    generated_at: "2026-04-26T11:28:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef030940b155224e614675a85c7a81567fd3a493e5ec1c25c5956d49cbc11b86
    source_path: gateway/config-tools.md
    workflow: 15
---

مفاتيح التكوين `tools.*` وإعداد المزوّد المخصص / عنوان URL الأساسي. بالنسبة إلى الوكلاء، والقنوات، ومفاتيح التكوين الأخرى ذات المستوى الأعلى، راجع [مرجع التكوين](/ar/gateway/configuration-reference).

## الأدوات

### ملفات تعريف الأدوات

يضبط `tools.profile` قائمة سماح أساسية قبل `tools.allow`/`tools.deny`:

<Note>
يضبط الإعداد المحلي الأولي افتراضيًا التكوينات المحلية الجديدة على `tools.profile: "coding"` عندما تكون غير مضبوطة (ويتم الحفاظ على ملفات التعريف الصريحة الموجودة).
</Note>

| ملف التعريف | يتضمن |
| ----------- | ------- |
| `minimal`   | `session_status` فقط |
| `coding`    | `group:fs`، و`group:runtime`، و`group:web`، و`group:sessions`، و`group:memory`، و`cron`، و`image`، و`image_generate`، و`video_generate` |
| `messaging` | `group:messaging`، و`sessions_list`، و`sessions_history`، و`sessions_send`، و`session_status` |
| `full`      | بلا تقييد (يماثل عدم الضبط) |

### مجموعات الأدوات

| المجموعة | الأدوات |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`، و`process`، و`code_execution` ‏(`bash` مقبول كاسم بديل لـ `exec`) |
| `group:fs`         | `read`، و`write`، و`edit`، و`apply_patch` |
| `group:sessions`   | `sessions_list`، و`sessions_history`، و`sessions_send`، و`sessions_spawn`، و`sessions_yield`، و`subagents`، و`session_status` |
| `group:memory`     | `memory_search`، و`memory_get` |
| `group:web`        | `web_search`، و`x_search`، و`web_fetch` |
| `group:ui`         | `browser`، و`canvas` |
| `group:automation` | `cron`، و`gateway` |
| `group:messaging`  | `message` |
| `group:nodes`      | `nodes` |
| `group:agents`     | `agents_list` |
| `group:media`      | `image`، و`image_generate`، و`video_generate`، و`tts` |
| `group:openclaw`   | جميع الأدوات المضمنة (باستثناء Plugins الخاصة بالمزوّد) |

### `tools.allow` / `tools.deny`

سياسة السماح/المنع العامة للأدوات (المنع يفوز). غير حساسة لحالة الأحرف، وتدعم أحرف البدل `*`. وتُطبّق حتى عند إيقاف Docker sandbox.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

تقييد إضافي للأدوات لمزوّدين أو نماذج محددة. الترتيب: ملف التعريف الأساسي ← ملف تعريف المزوّد ← السماح/المنع.

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

- يمكن للتجاوز لكل وكيل (`agents.list[].tools.elevated`) أن يضيف تقييدًا إضافيًا فقط.
- يخزن `/elevated on|off|ask|full` الحالة لكل جلسة؛ وتُطبَّق التوجيهات المضمنة على رسالة واحدة.
- يتجاوز `exec` المرتفع آليات sandbox ويستخدم مسار الخروج المهيأ (`gateway` افتراضيًا، أو `node` عندما يكون هدف exec هو `node`).

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

فحوصات الأمان الخاصة بحلقات الأدوات **معطلة افتراضيًا**. اضبط `enabled: true` لتفعيل الاكتشاف. يمكن تعريف الإعدادات عمومًا في `tools.loopDetection` وتجاوزها لكل وكيل في `agents.list[].tools.loopDetection`.

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
  عتبة نمط التكرار بلا تقدم لإطلاق التحذيرات.
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
  التحذير/الحظر عند أدوات polling المعروفة (`process.poll`، و`command_status`، وما إلى ذلك).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  التحذير/الحظر عند أنماط الأزواج المتناوبة بلا تقدم.
</ParamField>

<Warning>
إذا كانت `warningThreshold >= criticalThreshold` أو `criticalThreshold >= globalCircuitBreakerThreshold`، يفشل التحقق.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // أو BRAVE_API_KEY env
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

يُكوّن فهم الوسائط الواردة (الصورة/الصوت/الفيديو):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // اختياري: أرسل مهمة الموسيقى/الفيديو غير المتزامنة المكتملة مباشرة إلى القناة
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

<AccordionGroup>
  <Accordion title="حقول إدخال نموذج الوسائط">
    **إدخال المزوّد** (`type: "provider"` أو عند حذفه):

    - `provider`: معرّف مزوّد API ‏(`openai` أو `anthropic` أو `google`/`gemini` أو `groq`، إلخ.)
    - `model`: تجاوز معرّف النموذج
    - `profile` / `preferredProfile`: تحديد ملف التعريف من `auth-profiles.json`

    **إدخال CLI** (`type: "cli"`):

    - `command`: الملف التنفيذي المطلوب تشغيله
    - `args`: وسائط قالبية (تدعم `{{MediaPath}}` و`{{Prompt}}` و`{{MaxChars}}`، إلخ.)

    **الحقول المشتركة:**

    - `capabilities`: قائمة اختيارية (`image` أو `audio` أو `video`). القيم الافتراضية: `openai`/`anthropic`/`minimax` → صورة، `google` → صورة+صوت+فيديو، `groq` → صوت.
    - `prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`: تجاوزات لكل إدخال.
    - عند الفشل، يتم الرجوع إلى الإدخال التالي.

    تتبع مصادقة المزوّد الترتيب القياسي: `auth-profiles.json` → متغيرات البيئة → `models.providers.*.apiKey`.

    **حقول الإكمال غير المتزامن:**

    - `asyncCompletion.directSend`: عندما تكون `true`، تحاول مهام `music_generate` و`video_generate` غير المتزامنة المكتملة أولًا التسليم المباشر إلى القناة. الافتراضي: `false` (مسار requester-session wake/model-delivery القديم).

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

<AccordionGroup>
  <Accordion title="نطاقات الرؤية">
    - `self`: مفتاح الجلسة الحالية فقط.
    - `tree`: الجلسة الحالية + الجلسات التي أنشأتها الجلسة الحالية (الوكلاء الفرعيون).
    - `agent`: أي جلسة تتبع معرّف الوكيل الحالي (وقد يشمل ذلك مستخدمين آخرين إذا كنت تشغّل جلسات لكل مرسل تحت معرّف الوكيل نفسه).
    - `all`: أي جلسة. ولا يزال الاستهداف عبر الوكلاء يتطلب `tools.agentToAgent`.
    - قيد sandbox: عندما تكون الجلسة الحالية ضمن sandbox ويكون `agents.defaults.sandbox.sessionToolsVisibility="spawned"`، تُفرَض الرؤية على `tree` حتى إذا كانت `tools.sessions.visibility="all"`.
  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

يتحكم في دعم المرفقات المضمنة لـ `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // اختياري: اضبطها على true للسماح بمرفقات ملفات مضمنة
        maxTotalBytes: 5242880, // 5 MB إجمالًا عبر جميع الملفات
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB لكل ملف
        retainOnSessionKeep: false, // الاحتفاظ بالمرفقات عندما يكون cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ملاحظات المرفقات">
    - المرفقات مدعومة فقط لـ `runtime: "subagent"`. ويرفض ACP runtime هذه المرفقات.
    - تُنشأ الملفات داخل مساحة عمل الابن في `.openclaw/attachments/<uuid>/` مع ملف `.manifest.json`.
    - يُحجب محتوى المرفقات تلقائيًا من استمرار transcript.
    - يتم التحقق من مدخلات Base64 باستخدام فحوصات صارمة للأبجدية/الحشو وحاجز لحجم ما قبل فك الترميز.
    - تكون أذونات الملفات `0700` للأدلة و`0600` للملفات.
    - تتبع عملية التنظيف سياسة `cleanup`: يقوم `delete` دائمًا بإزالة المرفقات؛ بينما يحتفظ `keep` بها فقط عندما تكون `retainOnSessionKeep: true`.
  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

أعلام الأدوات المضمنة التجريبية. تكون معطلة افتراضيًا ما لم تُطبق قاعدة تمكين تلقائي صارمة خاصة بـ GPT-5 agentic.

```json5
{
  tools: {
    experimental: {
      planTool: true, // تمكين update_plan التجريبي
    },
  },
}
```

- `planTool`: يفعّل أداة `update_plan` المنظمة للعمل غير البسيط متعدد الخطوات.
- الافتراضي: `false` ما لم يكن `agents.defaults.embeddedPi.executionContract` ‏(أو تجاوز لكل وكيل) مضبوطًا على `"strict-agentic"` لتشغيل من عائلة GPT-5 لدى OpenAI أو OpenAI Codex. اضبطها على `true` لفرض تفعيل الأداة خارج هذا النطاق، أو على `false` للإبقاء عليها معطلة حتى في تشغيلات GPT-5 الصارمة agentic.
- عند التفعيل، تضيف مطالبة النظام أيضًا إرشادات استخدام بحيث لا يستخدمها النموذج إلا للعمل الجوهري ويحافظ على خطوة واحدة فقط كحد أقصى في حالة `in_progress`.

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

- `model`: النموذج الافتراضي للوكلاء الفرعيين الذين يتم إنشاؤهم. وإذا حُذف، يرث الوكلاء الفرعيون نموذج المستدعي.
- `allowAgents`: قائمة السماح الافتراضية لمعرّفات الوكلاء المستهدفة لـ `sessions_spawn` عندما لا يضبط الوكيل الطالب `subagents.allowAgents` الخاص به (`["*"]` = أي وكيل؛ والافتراضي: الوكيل نفسه فقط).
- `runTimeoutSeconds`: المهلة الافتراضية (بالثواني) لـ `sessions_spawn` عندما يحذف استدعاء الأداة `runTimeoutSeconds`. وتعني `0` عدم وجود مهلة.
- سياسة الأدوات لكل وكيل فرعي: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## المزوّدون المخصصون وعناوين URL الأساسية

يستخدم OpenClaw كتالوج النماذج المضمن. أضف مزوّدين مخصصين عبر `models.providers` في التكوين أو `~/.openclaw/agents/<agentId>/agent/models.json`.

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

<AccordionGroup>
  <Accordion title="أولوية المصادقة والدمج">
    - استخدم `authHeader: true` مع `headers` لاحتياجات المصادقة المخصصة.
    - تجاوز جذر تكوين الوكيل باستخدام `OPENCLAW_AGENT_DIR` ‏(أو `PI_CODING_AGENT_DIR`، وهو اسم بديل قديم لمتغير البيئة).
    - أولوية الدمج عند تطابق معرّفات المزوّد:
      - تفوز قيم `baseUrl` غير الفارغة في `models.json` الخاص بالوكيل.
      - تفوز قيم `apiKey` غير الفارغة في الوكيل فقط عندما لا يكون ذلك المزوّد مُدارًا بواسطة SecretRef في سياق التكوين/ملف تعريف المصادقة الحالي.
      - تُحدَّث قيم `apiKey` الخاصة بالمزوّدات المُدارة بواسطة SecretRef من علامات المصدر (`ENV_VAR_NAME` لإشارات env، و`secretref-managed` لإشارات file/exec) بدلًا من الاستمرار في حفظ الأسرار التي جرى حلها.
      - تُحدَّث قيم headers الخاصة بالمزوّدات المُدارة بواسطة SecretRef من علامات المصدر (`secretref-env:ENV_VAR_NAME` لإشارات env، و`secretref-managed` لإشارات file/exec).
      - تعود قيم `apiKey`/`baseUrl` الفارغة أو المفقودة في الوكيل إلى `models.providers` في التكوين.
      - تستخدم القيم المتطابقة في `contextWindow`/`maxTokens` الخاصة بالنموذج القيمة الأعلى بين التكوين الصريح وقيم الكتالوج الضمنية.
      - يحافظ `contextTokens` المتطابق في النموذج على حد وقت تشغيل صريح عند وجوده؛ استخدمه لتقييد السياق الفعلي من دون تغيير البيانات الوصفية الأصلية للنموذج.
      - استخدم `models.mode: "replace"` عندما تريد أن يعيد التكوين كتابة `models.json` بالكامل.
      - يكون استمرار العلامات خاضعًا لسلطة المصدر: إذ تُكتب العلامات من لقطة تكوين المصدر النشط (قبل الحل)، وليس من قيم الأسرار المحلولة وقت التشغيل.
  </Accordion>
</AccordionGroup>

### تفاصيل حقول المزوّد

<AccordionGroup>
  <Accordion title="الكتالوج ذو المستوى الأعلى">
    - `models.mode`: سلوك كتالوج المزوّد (`merge` أو `replace`).
    - `models.providers`: خريطة مزوّدين مخصصين مفهرسة حسب معرّف المزوّد.
      - تعديلات آمنة: استخدم `openclaw config set models.providers.<id> '<json>' --strict-json --merge` أو `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` للتحديثات الإضافية. يرفض `config set` الاستبدالات المدمّرة ما لم تمرر `--replace`.
  </Accordion>
  <Accordion title="اتصال المزوّد والمصادقة">
    - `models.providers.*.api`: مهايئ الطلب (`openai-completions` أو `openai-responses` أو `anthropic-messages` أو `google-generative-ai`، إلخ).
    - `models.providers.*.apiKey`: بيانات اعتماد المزوّد (يُفضّل SecretRef/الاستبدال من env).
    - `models.providers.*.auth`: استراتيجية المصادقة (`api-key` أو `token` أو `oauth` أو `aws-sdk`).
    - `models.providers.*.injectNumCtxForOpenAICompat`: بالنسبة إلى Ollama مع `openai-completions`، يتم حقن `options.num_ctx` داخل الطلبات (الافتراضي: `true`).
    - `models.providers.*.authHeader`: فرض نقل بيانات الاعتماد داخل ترويسة `Authorization` عند الحاجة.
    - `models.providers.*.baseUrl`: عنوان URL الأساسي لـ API upstream.
    - `models.providers.*.headers`: ترويسات ثابتة إضافية لتوجيه proxy/tenant.
  </Accordion>
  <Accordion title="تجاوزات نقل الطلب">
    `models.providers.*.request`: تجاوزات النقل لطلبات HTTP الخاصة بمزوّد النموذج.

    - `request.headers`: ترويسات إضافية (تُدمج مع إعدادات المزوّد الافتراضية). تقبل القيم SecretRef.
    - `request.auth`: تجاوز لاستراتيجية المصادقة. الأوضاع: `"provider-default"` ‏(استخدام المصادقة المضمنة في المزوّد)، و`"authorization-bearer"` ‏(مع `token`)، و`"header"` ‏(مع `headerName` و`value` و`prefix` الاختياري).
    - `request.proxy`: تجاوز HTTP proxy. الأوضاع: `"env-proxy"` ‏(استخدام متغيرات البيئة `HTTP_PROXY`/`HTTPS_PROXY`) و`"explicit-proxy"` ‏(مع `url`). يقبل كلا الوضعين كائنًا فرعيًا اختياريًا `tls`.
    - `request.tls`: تجاوز TLS للاتصالات المباشرة. الحقول: `ca` و`cert` و`key` و`passphrase` ‏(كلها تقبل SecretRef)، و`serverName`، و`insecureSkipVerify`.
    - `request.allowPrivateNetwork`: عندما تكون `true`، تسمح باتصال HTTPS إلى `baseUrl` عندما يُحل DNS إلى نطاقات خاصة أو CGNAT أو ما شابه، عبر حارس جلب HTTP الخاص بالمزوّد (اشتراك اختياري من المشغّل لنقاط نهاية OpenAI-compatible موثوقة ومستضافة ذاتيًا). يستخدم WebSocket نفس `request` للترويسات/TLS ولكن ليس بوابة SSRF الخاصة بالجلب. الافتراضي `false`.

  </Accordion>
  <Accordion title="إدخالات كتالوج النموذج">
    - `models.providers.*.models`: إدخالات كتالوج نماذج صريحة للمزوّد.
    - `models.providers.*.models.*.contextWindow`: بيانات وصفية أصلية لنافذة سياق النموذج.
    - `models.providers.*.models.*.contextTokens`: حد سياق اختياري لوقت التشغيل. استخدمه عندما تريد ميزانية سياق فعلية أصغر من `contextWindow` الأصلية للنموذج؛ ويعرض `openclaw models list` القيمتين كلتيهما عندما تختلفان.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: تلميح توافق اختياري. بالنسبة إلى `api: "openai-completions"` مع `baseUrl` غير فارغ وغير أصلي (مضيف ليس `api.openai.com`)، يفرض OpenClaw هذه القيمة إلى `false` وقت التشغيل. أما `baseUrl` الفارغ/المحذوف فيُبقي سلوك OpenAI الافتراضي.
    - `models.providers.*.models.*.compat.requiresStringContent`: تلميح توافق اختياري لنقاط نهاية الدردشة OpenAI-compatible التي تدعم النصوص فقط. عندما تكون `true`، يقوم OpenClaw بتسطيح مصفوفات `messages[].content` النصية البحتة إلى سلاسل نصية عادية قبل إرسال الطلب.
  </Accordion>
  <Accordion title="اكتشاف Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: جذر إعدادات الاكتشاف التلقائي لـ Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: تشغيل/إيقاف الاكتشاف الضمني.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: منطقة AWS للاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: مرشح اختياري لمعرّف المزوّد من أجل اكتشاف موجّه.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: فترة polling لتحديث الاكتشاف.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: نافذة السياق الاحتياطية للنماذج المكتشفة.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: الحد الاحتياطي الأقصى لرموز الإخراج للنماذج المكتشفة.
  </Accordion>
</AccordionGroup>

### أمثلة على المزوّدين

<AccordionGroup>
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

    متوافق مع Anthropic، وهو مزوّد مضمن. الاختصار: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="النماذج المحلية (LM Studio)">
    راجع [النماذج المحلية](/ar/gateway/local-models). باختصار: شغّل نموذجًا محليًا كبيرًا عبر LM Studio Responses API على عتاد قوي؛ واحتفظ بالنماذج المستضافة مدمجةً من أجل الرجوع الاحتياطي.
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

    اضبط `MINIMAX_API_KEY`. الاختصارات: `openclaw onboard --auth-choice minimax-global-api` أو `openclaw onboard --auth-choice minimax-cn-api`. يفترض كتالوج النموذج القيمة M2.7 فقط. وعلى مسار البث المتوافق مع Anthropic، يعطّل OpenClaw التفكير في MiniMax افتراضيًا ما لم تضبط `thinking` بنفسك صراحةً. يقوم `/fast on` أو `params.fastMode: true` بإعادة كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

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

    تعلن نقاط نهاية Moonshot الأصلية عن توافق استخدام البث على مسار النقل المشترك `openai-completions`، ويعتمد OpenClaw في ذلك على قدرات نقطة النهاية بدلًا من معرّف المزوّد المضمن وحده.

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

    اضبط `OPENCODE_API_KEY` ‏(أو `OPENCODE_ZEN_API_KEY`). استخدم المراجع `opencode/...` لكتالوج Zen أو المراجع `opencode-go/...` لكتالوج Go. الاختصار: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`.

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

    يجب أن يحذف عنوان URL الأساسي `/v1` ‏(عميل Anthropic يضيفه). الاختصار: `openclaw onboard --auth-choice synthetic-api-key`.

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

    اضبط `ZAI_API_KEY`. تُقبل الأسماء البديلة `z.ai/*` و`z-ai/*`. الاختصار: `openclaw onboard --auth-choice zai-api-key`.

    - نقطة النهاية العامة: `https://api.z.ai/api/paas/v4`
    - نقطة نهاية البرمجة (الافتراضية): `https://api.z.ai/api/coding/paas/v4`
    - بالنسبة إلى نقطة النهاية العامة، عرّف مزوّدًا مخصصًا مع تجاوز عنوان URL الأساسي.

  </Accordion>
</AccordionGroup>

---

## ذو صلة

- [التكوين — الوكلاء](/ar/gateway/config-agents)
- [التكوين — القنوات](/ar/gateway/config-channels)
- [مرجع التكوين](/ar/gateway/configuration-reference) — مفاتيح أخرى ذات مستوى أعلى
- [الأدوات وPlugins](/ar/tools)
