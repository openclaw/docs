---
read_when:
    - تريد خيارًا احتياطيًا موثوقًا عند تعطل موفري واجهات API
    - أنت تشغّل أدوات CLI محلية للذكاء الاصطناعي وتريد إعادة استخدامها
    - تريد فهم جسر الاسترجاع الحلقي لـ MCP للوصول إلى أدوات الواجهة الخلفية لـ CLI
summary: 'واجهات CLI الخلفية: بديل احتياطي محلي لـ CLI للذكاء الاصطناعي مع جسر اختياري لأدوات MCP'
title: واجهات CLI الخلفية
x-i18n:
    generated_at: "2026-07-16T14:02:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل CLI محلي للذكاء الاصطناعي كخيار احتياطي نصي فقط عندما تكون موفّرات API متوقفة أو خاضعة لحدود المعدّل أو لا تعمل على النحو السليم. وقد صُمّم عمدًا ليكون متحفظًا:

- لا تُحقن أدوات OpenClaw مباشرةً، لكن يمكن لواجهة خلفية مزوّدة بـ `bundleMcp: true` تلقي أدوات Gateway عبر جسر MCP للاسترجاع الحلقي.
- بث JSONL لواجهات CLI التي تدعمه.
- الجلسات مدعومة، لذا تظل الجولات اللاحقة متسقة.
- تمر الصور إذا كانت CLI تقبل مسارات الصور.

استخدمه كشبكة أمان للاستجابات النصية التي «تعمل دائمًا»، وليس كمسار أساسي. وللحصول على بيئة تشغيل كاملة مزوّدة بعناصر تحكم جلسات ACP والمهام الخلفية وربط سلاسل المحادثات/المحادثات وجلسات البرمجة الخارجية الدائمة، استخدم [وكلاء ACP](/ar/tools/acp-agents) بدلًا منه؛ فالواجهات الخلفية لـ CLI ليست ACP.

<Tip>
  هل تنشئ Plugin جديدًا لواجهة خلفية؟ راجع [Plugins الواجهات الخلفية لـ CLI](/ar/plugins/cli-backend-plugins). تتناول هذه الصفحة تهيئة واجهة خلفية مسجّلة بالفعل وتشغيلها.
</Tip>

## البدء السريع

يسجّل Plugin المضمّن من Anthropic واجهة خلفية افتراضية باسم `claude-cli`، لذا تعمل دون أي تهيئة بخلاف تثبيت Claude Code وتسجيل الدخول فيه:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` هو معرّف الوكيل الافتراضي عند عدم تهيئة قائمة صريحة بالوكلاء؛ وإلا فاستبدله بمعرّف وكيلك.

إذا كان Gateway يعمل ضمن launchd/systemd باستخدام `PATH` محدود، فأشر إلى الملف الثنائي صراحةً:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

إذا استخدمت واجهة خلفية مضمّنة لـ CLI باعتبارها موفّر الرسائل الأساسي على مضيف Gateway، فسيحمّل OpenClaw تلقائيًا Plugin المضمّن المالك لها عندما تشير تهيئتك إلى تلك الواجهة الخلفية ضمن مرجع نموذج أو تحت `agents.defaults.cliBackends`.

## استخدامها كخيار احتياطي

أضف واجهة CLI الخلفية إلى قائمة الخيارات الاحتياطية كي لا تعمل إلا عند فشل النماذج الأساسية:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

إذا استخدمت `agents.defaults.models` كقائمة سماح، فأدرج فيها أيضًا نماذج واجهة CLI الخلفية. عندما يفشل الموفّر الأساسي (المصادقة أو حدود المعدّل أو انتهاء المهلة)، يجرّب OpenClaw واجهة CLI الخلفية بعده.

## التهيئة

توجد جميع واجهات CLI الخلفية تحت `agents.defaults.cliBackends`، وتُفهرس حسب معرّف الموفّر (مثل `claude-cli` و`my-cli`). يصبح معرّف الموفّر الجانب الأيسر من مرجع النموذج: `<provider>/<model>`.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // علامة مخصصة لملف المطالبة:
          // systemPromptFileArg: "--system-file",
          // أو علامة تجاوز تهيئة بأسلوب Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // فعّل هذا فقط إذا كان مسموحًا لهذه الواجهة الخلفية أن تعيد تزويد الجلسات
          // المُبطلة من سجل نص OpenClaw الخام المحدود قبل Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## آلية العمل

1. يختار واجهة خلفية حسب بادئة الموفّر (`claude-cli/...`).
2. ينشئ مطالبة نظام باستخدام مطالبة OpenClaw نفسها وسياق مساحة العمل.
3. ينفّذ CLI باستخدام معرّف جلسة (إذا كان مدعومًا) لكي يظل السجل متسقًا. تُبقي واجهة `claude-cli` الخلفية المضمّنة عملية Claude stdio نشطة لكل جلسة OpenClaw، وترسل الجولات اللاحقة عبر مدخلات stream-json القياسية.
4. يحلّل المخرجات (JSON أو نصًا عاديًا) ويعيد النص النهائي.
5. يحفظ معرّفات الجلسات لكل واجهة خلفية كي تعيد الجولات اللاحقة استخدام جلسة CLI نفسها.

### تفاصيل Claude CLI

تفضّل واجهة `claude-cli` الخلفية المضمّنة محلّل Skills الأصلي في Claude Code. عندما تتضمن لقطة Skills الحالية Skill محددة واحدة على الأقل ذات مسار متحقق، يمرر OpenClaw Plugin مؤقتًا لـ Claude Code عبر `--plugin-dir` ويحذف فهرس Skills المكرر في OpenClaw من مطالبة النظام الملحقة. عند عدم وجود Skill لـ Plugin متحققة، يُبقي OpenClaw فهرس المطالبة كخيار احتياطي. وتظل تجاوزات بيئة Skill/مفتاح API مطبقة على بيئة العملية الفرعية أثناء التشغيل.

لدى Claude CLI وضع أذونات غير تفاعلي خاص بها؛ يربط OpenClaw ذلك بسياسة التنفيذ الحالية بدلًا من إضافة تهيئة خاصة بـ Claude. بالنسبة إلى جلسات Claude المباشرة التي يديرها OpenClaw، تكون سياسة التنفيذ الفعلية هي المرجع الحاسم: يشغّل YOLO (`tools.exec.security: "full"` و`tools.exec.ask: "off"`) عادةً Claude مع `--permission-mode bypassPermissions`، بينما تشغّله السياسة المقيّدة مع `--permission-mode default`. تستخدم بوابات Gateway التي تعمل بصلاحيات الجذر أيضًا `default` لأن Claude Code يرفض وضع التجاوز للجذر؛ ومع ذلك يظل OpenClaw يجيب عن طلبات التحكم بأدوات stdio الواردة من Claude وفق سياسة التنفيذ المهيأة. تتجاوز إعدادات `agents.list[].tools.exec` الخاصة بكل وكيل إعداد `tools.exec` العام لذلك الوكيل. قد تظل وسائط الواجهة الخلفية الخام تتضمن `--permission-mode`، لكن عمليات تشغيل Claude المباشرة تطبّع هذه العلامة لتطابق السياسة الفعلية وقيود المضيف.

تربط الواجهة الخلفية أيضًا مستويات `/think` في OpenClaw بعلامة `--effort` الأصلية في Claude Code: ‏`minimal`/`low` -> `low`، و`medium` -> `medium`، بينما تمر `high`/`xhigh`/`max` مباشرةً. يحافظ ذلك على تطابق مستويات الجهد الخمسة المدعومة في Fable 5 بين Claude CLI المدعوم باشتراك ومسارات مفاتيح API. يزيل `adaptive` علامات `--effort` المهيأة ولا يقدّم بديلًا، لذا يحدّد Claude Code الجهد الفعلي من بيئته وإعداداته والقيم الافتراضية للنموذج. تحتاج واجهات CLI الخلفية الأخرى إلى أن يصرّح Plugin المالك لها بمخطط مكافئ لوسائط argv قبل أن يؤثر `/think` في CLI التي تُشغَّل.

قبل أن يتمكن OpenClaw من استخدام `claude-cli`، يجب تسجيل الدخول في Claude Code نفسه على المضيف ذاته:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

تتطلب عمليات تثبيت Docker تثبيت Claude Code وتسجيل الدخول فيه داخل مجلد المنزل الدائم للحاوية، وليس على المضيف فقط؛ راجع [واجهة Claude CLI الخلفية في Docker](/ar/install/docker#claude-cli-backend-in-docker).

عيّن `agents.defaults.cliBackends.claude-cli.command` فقط عندما لا يكون الملف الثنائي `claude` موجودًا بالفعل على `PATH`.

## الجلسات

- إذا كانت CLI تدعم الجلسات، فعيّن `sessionArg` (مثل `--session-id`) أو `sessionArgs` (العنصر النائب `{sessionId}`) عندما يلزم وضع المعرّف في عدة علامات.
- إذا كانت CLI تستخدم أمرًا فرعيًا للاستئناف بعلامات مختلفة، فعيّن `resumeArgs` (يحل محل `args` عند الاستئناف)، ويمكن اختياريًا تعيين `resumeOutput` لعمليات الاستئناف غير المستندة إلى JSON.
- `sessionMode`:
  - `always`: أرسل دائمًا معرّف جلسة (UUID جديدًا إذا لم يكن هناك معرّف مخزّن).
  - `existing`: لا ترسل معرّف جلسة إلا إذا كان قد خُزّن من قبل.
  - `none`: لا ترسل معرّف جلسة مطلقًا.
- تكون القيم الافتراضية لـ `claude-cli` هي `liveSession: "claude-stdio"` و`output: "jsonl"` و`input: "stdin"`، لذا تعيد الجولات اللاحقة استخدام عملية Claude المباشرة ما دامت نشطة، بما في ذلك التهيئات المخصصة التي تحذف حقول النقل. إذا أُعيد تشغيل Gateway أو خرجت العملية الخاملة، يستأنف OpenClaw العمل من معرّف جلسة Claude المخزّن. تُتحقق معرّفات الجلسات المخزّنة مقابل سجل مشروع قابل للقراءة قبل الاستئناف؛ وإذا كان السجل مفقودًا، يُمسح الربط (ويُسجّل باسم `reason=transcript-missing`) بدلًا من بدء جلسة جديدة بصمت تحت `--resume`.
- تحتفظ جلسات Claude المباشرة بحدود وقائية لمخرجات JSONL: ‏8 MiB و20,000 سطر JSONL خام لكل جولة افتراضيًا. ارفعها لكل واجهة خلفية باستخدام `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` و`maxTurnLines`؛ ويقيّد OpenClaw هذه الإعدادات إلى 64 MiB و100,000 سطر.
- جلسات CLI المخزّنة هي استمرارية يملكها الموفّر. لا يقطعها إعادة ضبط الجلسة اليومية الضمنية؛ لكن سياسات `/reset` و`session.reset` الصريحة تفعل ذلك.
- عادةً لا تعيد جلسات CLI الجديدة التزويد إلا من ملخص Compaction في OpenClaw والذيل اللاحق لـ Compaction. لاستعادة الجلسات القصيرة التي أُبطلت قبل Compaction، يمكن لواجهة خلفية تفعيل ذلك باستخدام `reseedFromRawTranscriptWhenUncompacted: true`. يظل إعادة التزويد من السجل الخام محدودًا ومقتصرًا على حالات الإبطال الآمنة، مثل فقدان سجل CLI، أو ذيل استخدام أدوات يتيم، أو تغييرات سياسة الرسائل/مطالبة النظام/دليل العمل/MCP، أو إعادة المحاولة بعد انتهاء صلاحية الجلسة؛ ولا تؤدي تغييرات ملف تعريف المصادقة أو حقبة بيانات الاعتماد مطلقًا إلى إعادة التزويد من سجل المحادثة الخام.

التسلسل: يحافظ `serialize: true` على ترتيب عمليات التشغيل في المسار نفسه (تُسلسل معظم واجهات CLI على مسار موفّر واحد). كما يتوقف OpenClaw عن إعادة استخدام جلسة CLI المخزّنة عند تغيّر هوية المصادقة المحددة، بما في ذلك تغيّر معرّف ملف تعريف المصادقة أو مفتاح API ثابت أو رمز ثابت أو هوية حساب OAuth عندما تعرض CLI واحدة؛ أما تدوير رمز الوصول/التحديث لـ OAuth وحده فلا يقطع الجلسة. إذا لم يكن لدى CLI معرّف حساب OAuth ثابت، يترك OpenClaw لتلك CLI فرض أذونات الاستئناف الخاصة بها.

## مقدمة الخيار الاحتياطي من جلسات claude-cli

عندما تنتقل محاولة `claude-cli` بعد فشلها إلى مرشح غير تابع لـ CLI ضمن [`agents.defaults.model.fallbacks`](/ar/concepts/model-failover)، يزوّد OpenClaw المحاولة التالية بمقدمة سياق مأخوذة من سجل JSONL المحلي في Claude Code (تحت `~/.claude/projects/`، ومفهرسة لكل مساحة عمل). من دون هذا التزويد، يبدأ الموفّر الاحتياطي بلا سياق، لأن سجل جلسة OpenClaw نفسه يكون فارغًا لعمليات تشغيل `claude-cli`.

- تفضّل المقدمة أحدث ملخص `/compact` أو علامة `compact_boundary`، ثم تلحق أحدث الجولات التالية للحد حتى ميزانية محارف محددة. تُحذف الجولات السابقة للحد لأن الملخص يمثلها بالفعل.
- تُدمج كتل الأدوات في تلميحات `(tool call: name)` و`(tool result: …)` موجزة للحفاظ على دقة ميزانية المطالبة؛ ويُقتطع الملخص المتجاوز للحجم ويُوسم بـ `(truncated)`.
- تعتمد عمليات الانتقال الاحتياطي من `claude-cli` إلى `claude-cli` ضمن الموفّر نفسه على `--resume` الخاص بـ Claude وتتجاوز المقدمة.
- يعيد التزويد استخدام التحقق الحالي من مسار ملف جلسة Claude، لذا لا يمكن قراءة مسارات عشوائية.

## الصور

إذا كانت CLI تقبل مسارات الصور، فعيّن `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

يكتب OpenClaw صور base64 في ملفات مؤقتة. إذا عُيّن `imageArg`، تُمرر هذه المسارات كوسائط CLI؛ وإن لم يُعيّن، يلحق OpenClaw مسارات الملفات بالمطالبة (حقن المسار)، وهو ما يعمل مع واجهات CLI التي تحمّل الملفات المحلية تلقائيًا من المسارات العادية.

## المدخلات والمخرجات

- يعامل `output: "text"` (الافتراضي) stdout باعتباره الاستجابة النهائية.
- يحاول `output: "json"` تحليل JSON واستخراج النص بالإضافة إلى معرّف جلسة.
- يحلّل `output: "jsonl"` تدفق JSONL ويستخرج رسالة الوكيل النهائية بالإضافة إلى معرّفات الجلسات عند وجودها.
- بالنسبة إلى مخرجات JSON من Gemini CLI، يقرأ OpenClaw نص الرد من `response` والاستخدام من `stats` عندما يكون `usage` مفقودًا أو فارغًا. يستخدم الإعداد الافتراضي المضمّن لـ Gemini CLI القيمة `stream-json`؛ أما تجاوزات `--output-format json` القديمة فما زالت تستخدم محلّل JSON.

أوضاع الإدخال:

- `input: "arg"` (الافتراضي) يمرّر المطالبة بوصفها آخر وسيطة في CLI.
- `input: "stdin"` يرسل المطالبة عبر stdin.
- إذا كانت المطالبة طويلة جدًا وكان `maxPromptArgChars` مضبوطًا، فسيُستخدم stdin بدلًا من ذلك.

## الإعدادات الافتراضية المملوكة للـ Plugin

تُعد الإعدادات الافتراضية للواجهة الخلفية لـ CLI جزءًا من سطح الـ Plugin:

- تسجّلها Plugins باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالواجهة الخلفية بادئة المزوّد في مراجع النماذج.
- يظل إعداد المستخدم في `agents.defaults.cliBackends.<id>` متجاوزًا الإعداد الافتراضي للـ Plugin.
- تظل تهيئة إعدادات الواجهة الخلفية الخاصة مملوكة للـ Plugin من خلال الخطاف الاختياري `normalizeConfig`.

تمتلك Anthropic ‏`claude-cli` وتمتلك Google ‏`google-gemini-cli`. تستخدم عمليات وكيل OpenAI Codex حزمة app-server الخاصة بـ Codex من خلال `openai/*`؛ ولم يعد OpenClaw يسجّل واجهة خلفية مضمّنة باسم `codex-cli`.

يسجّل Anthropic Plugin المضمّن لـ `claude-cli`:

| المفتاح               | القيمة                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

يسجّل Google Plugin المضمّن لـ `google-gemini-cli`:

| المفتاح                   | القيمة                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | نفسه، مع `--resume {sessionId}`                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

المتطلب الأساسي: يجب تثبيت Gemini CLI محليًا وأن يكون متاحًا في `PATH` باسم `gemini` ‏(`brew install gemini-cli` أو `npm install -g @google/gemini-cli`).

ملاحظات حول مخرجات Gemini CLI:

- يقرأ محلّل `stream-json` الافتراضي أحداث `message` الخاصة بالمساعد، وأحداث الأدوات، واستخدام `result` النهائي، وأحداث أخطاء Gemini الفادحة.
- إذا تجاوزت وسائط Gemini إلى `--output-format json`، فسيعيد OpenClaw تسوية تلك الواجهة الخلفية إلى `output: "json"` ويقرأ نص الرد من الحقل `response` في JSON.
- يعود الاستخدام إلى `stats` عند غياب `usage` أو كونه فارغًا؛ وتُسوّى `stats.cached` إلى `cacheRead` في OpenClaw، وإذا كان `stats.input` مفقودًا، فتُشتق رموز الإدخال من `stats.input_tokens - stats.cached`.

لا تتجاوز الإعدادات الافتراضية إلا عند الحاجة (وغالبًا ما يكون ذلك لمسار `command` مطلق).

## طبقات تحويل النص

يمكن لـ Plugins التي تحتاج إلى حشوات توافق صغيرة للمطالبات/الرسائل أن تعلن تحويلات نصية ثنائية الاتجاه دون استبدال مزوّد أو واجهة خلفية لـ CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

يعيد `input` كتابة مطالبة النظام ومطالبة المستخدم المُمرّرتين إلى CLI. ويعيد `output` كتابة نص المساعد المتدفق والنص النهائي المحلّل قبل أن يعالج OpenClaw علامات التحكم الخاصة به وتسليم القناة؛ وبالنسبة إلى استدعاءات النماذج المدعومة بمزوّد، فإنه يستعيد أيضًا القيم النصية داخل وسيطات استدعاء الأدوات المنظّمة بعد إصلاح التدفق وقبل تنفيذ الأداة. تُترك أجزاء JSON الخام من المزوّد دون تغيير؛ وينبغي للمستهلكين استخدام الحمولة الجزئية المنظّمة أو حمولة النهاية أو النتيجة.

بالنسبة إلى واجهات CLI التي تصدر أحداث JSONL خاصة بالمزوّد، اضبط `jsonlDialect` في إعداد تلك الواجهة الخلفية: ‏`claude-stream-json` للتدفقات المتوافقة مع Claude Code، و`gemini-stream-json` لأحداث Gemini CLI ‏`stream-json`.

## ملكية Compaction الأصلية

تشغّل بعض واجهات CLI الخلفية وكيلًا يطبّق Compaction على سجله النصي بنفسه، ولذلك يجب ألا يشغّل OpenClaw ملخّص الحماية الخاص به عليها — إذ يؤدي ذلك إلى التعارض مع Compaction الخاص بالواجهة الخلفية وقد يتسبب في فشل الدور بالكامل.

لا يحتوي `claude-cli` على نقطة نهاية للحزمة (يطبّق Claude Code ‏Compaction داخليًا)، ولذلك يعلن `ownsNativeCompaction: true` ويعيد مسار Compaction في OpenClaw إدخال الجلسة دون تغيير. يمرّر OpenClaw ميزانية السياق الفعلية للعملية عبر [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) الموثّق في Claude Code، ما يحافظ على توافق Compaction التلقائي الأصلي مع حدود Anthropic ‏`contextTokens` المضبوطة. أما جلسات الحزم الأصلية مثل Codex فتظل موجّهة إلى نقطة نهاية Compaction الخاصة بحزمتها.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

لا تعلن `ownsNativeCompaction` إلا لواجهة خلفية تمتلك Compaction بالفعل: يجب أن تحدّ سجلها النصي بنفسها بشكل موثوق بالقرب من نافذة السياق وأن تحفظ جلسة قابلة للاستئناف (مثل `--resume` / `--session-id`)؛ وإلا فقد تظل الجلسة المؤجلة متجاوزة للميزانية.

## طبقات MCP المضمّنة

لا تتلقى واجهات CLI الخلفية استدعاءات أدوات OpenClaw مباشرة، لكن يمكن للواجهة الخلفية الاشتراك في طبقة إعداد MCP مولّدة باستخدام `bundleMcp: true`. السلوك المضمّن الحالي:

- `claude-cli`: ملف إعداد MCP صارم مولّد.
- `google-gemini-cli`: ملف إعدادات نظام Gemini مولّد.

عند تمكين MCP المضمّن، يقوم OpenClaw بما يلي:

- يشغّل خادم MCP عبر HTTP على الواجهة المحلية، ويعرض أدوات Gateway لعملية CLI، مع مصادقة بمنحة سياق لكل تشغيل (`OPENCLAW_MCP_TOKEN`) لا تكون نشطة إلا لمحاولة التنفيذ الحالية؛
- يربط الوصول إلى الأدوات بسياق الجلسة والحساب والقناة الذي حدده Gateway بدلًا من الوثوق بترويسات العملية الفرعية؛
- يحمّل خوادم MCP المضمّنة الممكّنة لمساحة العمل الحالية ويدمجها مع أي بنية إعداد/إعدادات MCP موجودة للواجهة الخلفية؛
- يعيد كتابة إعداد التشغيل باستخدام وضع التكامل المملوك للواجهة الخلفية من الـ Plugin المالك.

إذا لم تكن أي خوادم MCP ممكّنة، فسيظل OpenClaw يحقن إعدادًا صارمًا عندما تشترك واجهة خلفية في MCP المضمّن، بحيث تظل عمليات الخلفية معزولة.

تُخزّن بيئات تشغيل MCP المضمّنة ذات نطاق الجلسة مؤقتًا لإعادة استخدامها داخل الجلسة، ثم تُزال بعد `mcp.sessionIdleTtlMs` مللي ثانية من الخمول (الافتراضي 10 دقائق؛ اضبط `0` للتعطيل). تطلب عمليات التشغيل المضمّنة لمرة واحدة، مثل فحوصات المصادقة وتوليد المعرّفات النصية واستدعاء active-memory، التنظيف عند نهاية التشغيل كي لا تستمر العمليات الفرعية عبر stdio وتدفقات HTTP/SSE القابلة للبث بعد انتهاء التشغيل.

## حد سجل إعادة التهيئة

عند تهيئة جلسة CLI جديدة من سجل نصي سابق لـ OpenClaw (على سبيل المثال بعد إعادة محاولة `session_expired`)، تُفرض حدود على كتلة `<conversation_history>` المعروضة لمنع تضخم مطالبات إعادة التهيئة. الحد الافتراضي هو 12,288 حرفًا (نحو 3,000 رمز).

تضبط واجهات Claude CLI الخلفية هذا الحد وفق نافذة سياق Claude المحلولة بدلًا من ذلك: تحصل نوافذ السياق الأكبر على شريحة أكبر من السجل السابق، حتى سقف ثابت؛ بينما تحتفظ واجهات CLI الخلفية الأخرى بالحد الافتراضي المحافظ. لا يتحكم هذا الحد إلا في كتلة السجل السابق ضمن مطالبة إعادة التهيئة — وتُضبط حدود مخرجات الجلسة الحية بصورة منفصلة ضمن `reliability.outputLimits` (راجع [الجلسات](#sessions)).

## القيود

- لا توجد استدعاءات مباشرة لأدوات OpenClaw: لا يحقن OpenClaw استدعاءات الأدوات في بروتوكول الواجهة الخلفية لـ CLI. ولا ترى الواجهات الخلفية أدوات Gateway إلا عندما تشترك في `bundleMcp: true`.
- يعتمد التدفق على الواجهة الخلفية: تبث بعض الواجهات الخلفية JSONL، بينما تخزّن أخرى البيانات مؤقتًا حتى الخروج.
- تعتمد المخرجات المنظّمة على تنسيق JSON الخاص بواجهة CLI نفسها.

## استكشاف الأخطاء وإصلاحها

| العَرَض               | الحل                                                               |
| --------------------- | ----------------------------------------------------------------- |
| لم يُعثر على CLI         | اضبط `command` على مسار كامل.                                     |
| اسم النموذج غير صحيح      | استخدم `modelAliases` لربط `provider/model` بمعرّف النموذج الخاص بواجهة CLI. |
| لا توجد استمرارية للجلسة | تأكد من ضبط `sessionArg` ومن أن `sessionMode` ليس `none`.       |
| يتم تجاهل الصور        | اضبط `imageArg` وتحقق من أن CLI يدعم مسارات الملفات.            |

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [النماذج المحلية](/ar/gateway/local-models)
