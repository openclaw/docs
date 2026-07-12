---
read_when:
    - تريد خيارًا احتياطيًا موثوقًا عند تعطل موفّري واجهات API
    - أنت تشغّل أدوات CLI للذكاء الاصطناعي محليًا وتريد إعادة استخدامها
    - تريد فهم جسر MCP ذي local loopback للوصول إلى أدوات الواجهة الخلفية لـ CLI
summary: 'واجهات CLI الخلفية: بديل احتياطي محلي لـ CLI للذكاء الاصطناعي مع جسر اختياري لأدوات MCP'
title: واجهات CLI الخلفية
x-i18n:
    generated_at: "2026-07-12T05:50:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل CLI محلي للذكاء الاصطناعي كخيار احتياطي نصي فقط عند تعطل موفّري API أو تقييد معدل طلباتهم أو سوء عملهم. وقد صُمم عمدًا بنهج متحفظ:

- لا تُحقن أدوات OpenClaw مباشرةً، لكن يمكن لواجهة خلفية تستخدم `bundleMcp: true` تلقّي أدوات Gateway عبر جسر MCP يعمل من خلال local loopback.
- بث JSONL لواجهات CLI التي تدعمه.
- الجلسات مدعومة، لذا تظل التفاعلات اللاحقة مترابطة.
- تمر الصور إذا كانت CLI تقبل مسارات الصور.

استخدمه كشبكة أمان للحصول على استجابات نصية «تعمل دائمًا»، وليس كمسار أساسي. ولتشغيل بيئة متكاملة تتضمن عناصر تحكم جلسات ACP والمهام الخلفية وربط سلاسل الرسائل/المحادثات وجلسات البرمجة الخارجية الدائمة، استخدم [وكلاء ACP](/ar/tools/acp-agents) بدلًا منه؛ فالواجهات الخلفية لـ CLI ليست ACP.

<Tip>
  هل تنشئ Plugin جديدًا للواجهة الخلفية؟ راجع [Plugins الواجهات الخلفية لـ CLI](/ar/plugins/cli-backend-plugins). تتناول هذه الصفحة تهيئة واجهة خلفية مسجلة مسبقًا وتشغيلها.
</Tip>

## البدء السريع

يسجّل Plugin المضمّن من Anthropic واجهة خلفية افتراضية باسم `claude-cli`، لذا تعمل دون أي تهيئة إضافية سوى تثبيت Claude Code وتسجيل الدخول إليه:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

يمثل `main` معرّف الوكيل الافتراضي عند عدم تهيئة قائمة صريحة للوكلاء؛ وإلا فاستبدله بمعرّف وكيلك.

إذا كان Gateway يعمل ضمن launchd/systemd باستخدام `PATH` محدود، فحدّد مسار الملف التنفيذي صراحةً:

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

إذا كنت تستخدم واجهة خلفية مضمّنة لـ CLI بوصفها موفّر الرسائل الأساسي على مضيف Gateway، فإن OpenClaw يحمّل تلقائيًا Plugin المضمّن المالك لها عندما تشير تهيئتك إلى تلك الواجهة الخلفية في مرجع نموذج أو ضمن `agents.defaults.cliBackends`.

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

إذا كنت تستخدم `agents.defaults.models` كقائمة سماح، فأدرج نماذج واجهة CLI الخلفية فيها أيضًا. عند فشل الموفّر الأساسي (بسبب المصادقة أو حدود المعدل أو انتهاء المهلة)، يجرّب OpenClaw واجهة CLI الخلفية بعده.

## التهيئة

توجد جميع واجهات CLI الخلفية ضمن `agents.defaults.cliBackends`، وتُفهرس حسب معرّف الموفّر (مثل `claude-cli` و`my-cli`). يصبح معرّف الموفّر الجانب الأيسر من مرجع النموذج: `<provider>/<model>`.

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
          // Dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style config-override flag instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed invalidated sessions from
          // bounded raw OpenClaw transcript history before compaction.
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
2. ينشئ موجّه نظام باستخدام موجّه OpenClaw نفسه وسياق مساحة العمل.
3. ينفّذ CLI باستخدام معرّف جلسة (إذا كان مدعومًا) للحفاظ على اتساق السجل. تُبقي واجهة `claude-cli` الخلفية المضمّنة عملية Claude عبر stdio نشطة لكل جلسة OpenClaw، وترسل التفاعلات اللاحقة عبر إدخال stream-json القياسي.
4. يحلّل المخرجات (JSON أو نصًا عاديًا) ويعيد النص النهائي.
5. يحفظ معرّفات الجلسات لكل واجهة خلفية كي تعيد التفاعلات اللاحقة استخدام جلسة CLI نفسها.

### تفاصيل Claude CLI

تفضّل واجهة `claude-cli` الخلفية المضمّنة محلّل Skills الأصلي في Claude Code. عندما تحتوي اللقطة الحالية لـ Skills على Skill محددة واحدة على الأقل لها مسار فعلي، يمرّر OpenClaw Plugin مؤقتًا لـ Claude Code عبر `--plugin-dir` ويحذف كتالوج Skills المكرر الخاص بـ OpenClaw من موجّه النظام الملحق. وفي غياب Skill فعلية داخل Plugin، يُبقي OpenClaw كتالوج الموجّه كخيار احتياطي. تظل تجاوزات متغيرات البيئة/مفاتيح API الخاصة بـ Skill مطبقة على بيئة العملية الفرعية أثناء التشغيل.

لدى Claude CLI وضع أذونات غير تفاعلي خاص بها؛ ويربطه OpenClaw بسياسة التنفيذ الحالية بدلًا من إضافة تهيئة خاصة بـ Claude. وبالنسبة إلى جلسات Claude المباشرة التي يديرها OpenClaw، تكون سياسة التنفيذ الفعلية هي المرجع الحاكم: يشغّل وضع YOLO (`tools.exec.security: "full"` و`tools.exec.ask: "off"`) Claude باستخدام `--permission-mode bypassPermissions`، بينما تشغّله السياسة المقيّدة باستخدام `--permission-mode default`. تتجاوز إعدادات `agents.list[].tools.exec` الخاصة بكل وكيل إعداد `tools.exec` العام لذلك الوكيل. قد تظل وسيطات الواجهة الخلفية الخام تتضمن `--permission-mode`، لكن عمليات تشغيل Claude المباشرة توحّد تلك العلامة لتطابق السياسة الفعلية.

تربط الواجهة الخلفية أيضًا مستويات `/think` في OpenClaw بعلامة `--effort` الأصلية في Claude Code: ‏`minimal`/`low` -> `low`، و`medium` -> `medium`، بينما تمر قيم `high`/`xhigh`/`max` مباشرةً دون تغيير. تزيل القيمة `adaptive` علامات `--effort` المهيأة ولا توفر بديلًا، ما يتيح لـ Claude Code تحديد مستوى الجهد الفعلي من بيئته وإعداداته والقيم الافتراضية للنموذج. تحتاج واجهات CLI الخلفية الأخرى إلى أن يعلن Plugin المالك لها عن مخطط مكافئ لوسيطات سطر الأوامر قبل أن يؤثر `/think` في CLI التي يجري تشغيلها.

قبل أن يتمكن OpenClaw من استخدام `claude-cli`، يجب تسجيل الدخول إلى Claude Code نفسه على المضيف ذاته:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

تتطلب عمليات التثبيت عبر Docker تثبيت Claude Code وتسجيل الدخول إليه داخل المجلد الرئيسي الدائم للحاوية، وليس على المضيف فقط؛ راجع [واجهة Claude CLI الخلفية في Docker](/ar/install/docker#claude-cli-backend-in-docker).

لا تضبط `agents.defaults.cliBackends.claude-cli.command` إلا عندما لا يكون الملف التنفيذي `claude` موجودًا بالفعل ضمن `PATH`.

## الجلسات

- إذا كانت CLI تدعم الجلسات، فاضبط `sessionArg` (مثل `--session-id`)، أو `sessionArgs` (مع العنصر النائب `{sessionId}`) عندما يلزم وضع المعرّف في عدة علامات.
- إذا كانت CLI تستخدم أمرًا فرعيًا للاستئناف بعلامات مختلفة، فاضبط `resumeArgs` (يحل محل `args` عند الاستئناف)، ويمكنك اختياريًا ضبط `resumeOutput` لعمليات الاستئناف التي لا تستخدم JSON.
- `sessionMode`:
  - `always`: أرسل دائمًا معرّف جلسة (UUID جديدًا إذا لم يكن هناك معرّف مخزّن).
  - `existing`: لا ترسل معرّف جلسة إلا إذا سبق تخزينه.
  - `none`: لا ترسل معرّف جلسة مطلقًا.
- يستخدم `claude-cli` افتراضيًا `liveSession: "claude-stdio"` و`output: "jsonl"` و`input: "stdin"`، لذا تعيد التفاعلات اللاحقة استخدام عملية Claude المباشرة ما دامت نشطة، بما في ذلك التهيئات المخصصة التي تحذف حقول النقل. إذا أُعيد تشغيل Gateway أو انتهت عملية الخمول، يستأنف OpenClaw من معرّف جلسة Claude المخزّن. يُتحقق من معرّفات الجلسات المخزّنة مقابل سجل مشروع قابل للقراءة قبل الاستئناف؛ ويؤدي غياب السجل إلى إزالة الربط (ويُسجّل ذلك باسم `reason=transcript-missing`) بدلًا من بدء جلسة جديدة بصمت ضمن `--resume`.
- تحتفظ جلسات Claude المباشرة بقيود محدودة لمخرجات JSONL: ‏8 ميبيبايت و20,000 سطر JSONL خام لكل تفاعل افتراضيًا. ارفعها لكل واجهة خلفية باستخدام `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` و`maxTurnLines`؛ ويقيّد OpenClaw هذه الإعدادات بحد أقصى قدره 64 ميبيبايت و100,000 سطر.
- تمثل جلسات CLI المخزّنة استمرارية يملكها الموفّر. لا يقطعها إعادة ضبط الجلسة اليومية الضمنية؛ بينما يظل `/reset` وسياسات `session.reset` الصريحة يقطعانها.
- لا تعيد جلسات CLI الجديدة عادةً التأسيس إلا من ملخص Compaction في OpenClaw بالإضافة إلى الجزء اللاحق لـ Compaction. ولاستعادة الجلسات القصيرة التي أُبطلت قبل Compaction، يمكن للواجهة الخلفية الاشتراك باستخدام `reseedFromRawTranscriptWhenUncompacted: true`. تظل إعادة التأسيس من السجل الخام محدودة ومقصورة على حالات الإبطال الآمنة، مثل فقدان سجل CLI أو وجود ذيل يتيم لاستخدام أداة أو تغييرات في سياسة الرسائل/موجّه النظام/دليل العمل/MCP أو إعادة محاولة بعد انتهاء صلاحية الجلسة؛ أما تغييرات ملف تعريف المصادقة أو حقبة بيانات الاعتماد فلا تعيد مطلقًا التأسيس من سجل المحادثة الخام.

التسلسل: يحافظ `serialize: true` على ترتيب عمليات التشغيل في المسار نفسه (تُسلسل معظم واجهات CLI العمليات في مسار موفّر واحد). يتوقف OpenClaw أيضًا عن إعادة استخدام جلسة CLI المخزّنة عند تغير هوية المصادقة المحددة، بما في ذلك تغير معرّف ملف تعريف المصادقة أو مفتاح API الثابت أو الرمز الثابت أو هوية حساب OAuth عندما تعرض CLI واحدة منها؛ ولا يؤدي تدوير رمز وصول/تحديث OAuth وحده إلى قطع الجلسة. إذا لم يكن لدى CLI معرّف ثابت لحساب OAuth، يترك OpenClaw لتلك CLI فرض أذونات الاستئناف الخاصة بها.

## تمهيد الخيار الاحتياطي من جلسات claude-cli

عندما تفشل محاولة `claude-cli` وتنتقل إلى مرشح ليس من نوع CLI ضمن [`agents.defaults.model.fallbacks`](/ar/concepts/model-failover)، يزوّد OpenClaw المحاولة التالية بتمهيد سياقي مستخرج من سجل JSONL المحلي لـ Claude Code (ضمن `~/.claude/projects/`، ومفهرس لكل مساحة عمل). من دون هذا التمهيد يبدأ الموفّر الاحتياطي دون سياق، لأن سجل جلسة OpenClaw نفسه يكون فارغًا في عمليات تشغيل `claude-cli`.

- يفضّل التمهيد أحدث ملخص `/compact` أو علامة `compact_boundary`، ثم يلحق أحدث التفاعلات التالية للحد حتى بلوغ ميزانية الأحرف. تُحذف التفاعلات السابقة للحد لأن الملخص يمثلها بالفعل.
- تُدمج كتل الأدوات في تلميحات موجزة بصيغة `(tool call: name)` و`(tool result: …)` للحفاظ على دقة ميزانية الموجّه؛ ويُقتطع الملخص المفرط في الحجم ويُوسم بـ`(truncated)`.
- تعتمد الخيارات الاحتياطية من `claude-cli` إلى `claude-cli` لدى الموفّر نفسه على `--resume` الخاص بـ Claude وتتجاوز التمهيد.
- تعيد البذرة استخدام التحقق الحالي من مسار ملف جلسة Claude، لذلك لا يمكن قراءة مسارات عشوائية.

## الصور

إذا كانت CLI تقبل مسارات الصور، فاضبط `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

يكتب OpenClaw صور base64 في ملفات مؤقتة. إذا ضُبط `imageArg`، تُمرر تلك المسارات كوسيطات CLI؛ وإذا لم يُضبط، يُلحق OpenClaw مسارات الملفات بالموجّه (حقن المسار)، وهو ما يعمل مع واجهات CLI التي تحمّل الملفات المحلية تلقائيًا من المسارات النصية العادية.

## المدخلات والمخرجات

- يتعامل `output: "text"` (الافتراضي) مع المخرجات القياسية بوصفها الاستجابة النهائية.
- يحاول `output: "json"` تحليل JSON واستخراج النص بالإضافة إلى معرّف الجلسة.
- يحلّل `output: "jsonl"` بث JSONL ويستخرج رسالة الوكيل النهائية ومعرّفات الجلسة عند وجودها.
- بالنسبة إلى مخرجات JSON من Gemini CLI، يقرأ OpenClaw نص الرد من `response` وبيانات الاستخدام من `stats` عندما تكون `usage` مفقودة أو فارغة. يستخدم الإعداد الافتراضي المضمّن لـ Gemini CLI القيمة `stream-json`؛ وتظل تجاوزات `--output-format json` القديمة تستخدم محلّل JSON.

أوضاع الإدخال:

- يمرّر `input: "arg"` (الافتراضي) الموجّه باعتباره وسيطة CLI الأخيرة.
- يرسل `input: "stdin"` الموجّه عبر الإدخال القياسي.
- إذا كان الموجّه طويلًا جدًا وكان `maxPromptArgChars` مضبوطًا، يُستخدم الإدخال القياسي بدلًا من ذلك.

## القيم الافتراضية المملوكة لـ Plugin

تُعد القيم الافتراضية لواجهات CLI الخلفية جزءًا من سطح Plugin:

- تسجّلها Plugins باستخدام `api.registerCliBackend(...)`.
- يصبح `id` الخاص بالواجهة الخلفية بادئة الموفّر في مراجع النماذج.
- تظل تهيئة المستخدم في `agents.defaults.cliBackends.<id>` تتجاوز القيمة الافتراضية لـ Plugin.
- تبقى عملية تنظيف التهيئة الخاصة بالواجهة الخلفية مملوكة لـ Plugin من خلال خطاف `normalizeConfig` الاختياري.

تمتلك Anthropic الواجهة `claude-cli`، وتمتلك Google الواجهة `google-gemini-cli`. تستخدم عمليات وكيل OpenAI Codex بيئة خادم تطبيق Codex عبر `openai/*`؛ ولم يعد OpenClaw يسجّل واجهة خلفية مضمّنة باسم `codex-cli`.

يسجّل Plugin المضمّن من Anthropic القيم التالية لـ `claude-cli`:

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

يسجّل Plugin المضمّن من Google نفسه لـ `google-gemini-cli`:

| المفتاح                    | القيمة                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `command`                  | `gemini`                                                                               |
| `args`                     | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`               | نفسها، مع `--resume {sessionId}`                                                       |
| `output` / `resumeOutput`  | `jsonl`                                                                                |
| `jsonlDialect`             | `gemini-stream-json`                                                                   |
| `imageArg`                 | `@`                                                                                    |
| `imagePathScope`           | `workspace`                                                                            |
| `modelArg`                 | `--model`                                                                              |
| `sessionMode`              | `existing`                                                                             |
| `sessionIdFields`          | `["session_id", "sessionId"]`                                                          |

المتطلب الأساسي: يجب تثبيت Gemini CLI محليًا وإتاحته في `PATH` باسم `gemini` (`brew install gemini-cli` أو `npm install -g @google/gemini-cli`).

ملاحظات حول مخرجات Gemini CLI:

- يقرأ محلّل `stream-json` الافتراضي أحداث `message` الخاصة بالمساعد، وأحداث الأدوات، واستخدام `result` النهائي، وأحداث أخطاء Gemini الفادحة.
- إذا تجاوزت معاملات Gemini إلى `--output-format json`، فسيعيد OpenClaw تسوية تلك الواجهة الخلفية إلى `output: "json"` ويقرأ نص الرد من حقل `response` في JSON.
- يعود الاستخدام إلى `stats` عند غياب `usage` أو كونه فارغًا؛ وتُسوّى `stats.cached` إلى `cacheRead` في OpenClaw، وإذا كانت `stats.input` مفقودة، فتُشتق رموز الإدخال من `stats.input_tokens - stats.cached`.

لا تتجاوز القيم الافتراضية إلا عند الحاجة (والأشيع هو استخدام مسار `command` مطلق).

## طبقات تحويل النص

يمكن للـ Plugins التي تحتاج إلى تعديلات توافق صغيرة على المطالبات أو الرسائل أن تعلن تحويلات نصية ثنائية الاتجاه من دون استبدال مزوّد أو واجهة خلفية لـ CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

يعيد `input` كتابة مطالبة النظام ومطالبة المستخدم الممررتين إلى CLI. ويعيد `output` كتابة نص المساعد المتدفق والنص النهائي المحلّل قبل أن يعالج OpenClaw علامات التحكم الخاصة به وتسليم القناة؛ وبالنسبة إلى استدعاءات النماذج المدعومة بمزوّد، فإنه يستعيد أيضًا القيم النصية داخل معاملات استدعاء الأدوات المنظّمة بعد إصلاح التدفق وقبل تنفيذ الأداة. تُترك أجزاء JSON الخام من المزوّد من دون تغيير؛ وينبغي للمستهلكين استخدام الحمولة المنظّمة الجزئية أو النهائية أو الناتجة.

بالنسبة إلى واجهات CLI التي تصدر أحداث JSONL خاصة بالمزوّد، عيّن `jsonlDialect` في إعدادات تلك الواجهة الخلفية: استخدم `claude-stream-json` للتدفقات المتوافقة مع Claude Code، و`gemini-stream-json` لأحداث `stream-json` في Gemini CLI.

## ملكية Compaction الأصلية

تشغّل بعض واجهات CLI الخلفية وكيلًا يضغط نص محادثته بنفسه، لذا يجب ألا يشغّل OpenClaw ملخّص الحماية الخاص به عليها — إذ يؤدي ذلك إلى التعارض مع Compaction الخاص بالواجهة الخلفية وقد يتسبب في فشل كامل للدورة.

لا يملك `claude-cli` نقطة نهاية لحاضنة التشغيل (إذ ينفّذ Claude Code عملية Compaction داخليًا)، لذلك يعلن `ownsNativeCompaction: true` ويعيد مسار Compaction في OpenClaw إدخال الجلسة من دون تغيير. أما جلسات حاضنة التشغيل الأصلية مثل Codex فتستمر في التوجيه إلى نقطة نهاية Compaction الخاصة بحاضنتها.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

لا تعلن `ownsNativeCompaction` إلا لواجهة خلفية تملك Compaction فعلًا: يجب أن تضبط نص محادثتها بشكل موثوق بالقرب من نافذة السياق وأن تحفظ جلسة قابلة للاستئناف (مثل `--resume` / `--session-id`)، وإلا فقد تظل الجلسة المؤجلة متجاوزة للميزانية.

## طبقات MCP للحزمة

لا تتلقى واجهات CLI الخلفية استدعاءات أدوات OpenClaw مباشرة، لكن يمكن للواجهة الخلفية الاشتراك في طبقة إعداد MCP مولّدة باستخدام `bundleMcp: true`. السلوك المضمّن الحالي:

- `claude-cli`: ملف إعداد MCP صارم ومولّد.
- `google-gemini-cli`: ملف إعدادات نظام Gemini مولّد.

عند تمكين MCP للحزمة، يقوم OpenClaw بما يلي:

- ينشئ خادم MCP عبر HTTP على local loopback، ويعرض أدوات Gateway لعملية CLI، مع مصادقة بمنحة سياق خاصة بكل تشغيل (`OPENCLAW_MCP_TOKEN`) لا تكون نشطة إلا لمحاولة التنفيذ الحالية؛
- يربط الوصول إلى الأدوات بسياق الجلسة والحساب والقناة الذي حدده Gateway بدلًا من الوثوق بترويسات العملية الفرعية؛
- يحمّل خوادم MCP الممكّنة للحزمة لمساحة العمل الحالية ويدمجها مع أي بنية إعدادات MCP موجودة للواجهة الخلفية؛
- يعيد كتابة إعداد التشغيل باستخدام نمط التكامل المملوك للواجهة الخلفية من الـ Plugin المالك.

إذا لم تكن أي خوادم MCP ممكّنة، فسيظل OpenClaw يحقن إعدادًا صارمًا عندما تشترك واجهة خلفية في MCP للحزمة، بحيث تظل عمليات التشغيل في الخلفية معزولة.

تُخزّن أوقات تشغيل MCP المضمّنة والنطاقية حسب الجلسة مؤقتًا لإعادة استخدامها ضمن الجلسة، ثم تُنهى بعد `mcp.sessionIdleTtlMs` ميلي ثانية من الخمول (الافتراضي 10 دقائق؛ عيّن `0` للتعطيل). تطلب عمليات التشغيل المضمّنة أحادية الاستخدام، مثل اختبارات المصادقة وإنشاء المعرّفات النصية واسترجاع Active Memory، التنظيف عند انتهاء التشغيل كي لا تستمر العمليات الفرعية عبر stdio وتدفقات HTTP/SSE القابلة للبث بعد انتهاء التشغيل.

## حد سجل إعادة التهيئة

عندما تُهيّأ جلسة CLI جديدة من نص محادثة سابق في OpenClaw (على سبيل المثال بعد إعادة محاولة بسبب `session_expired`)، يُحدّ حجم كتلة `<conversation_history>` المعروضة لمنع تضخم مطالبات إعادة التهيئة. القيمة الافتراضية هي 12,288 حرفًا (نحو 3,000 رمز).

تضبط واجهات Claude CLI الخلفية هذا الحد وفق نافذة سياق Claude المحسومة بدلًا من ذلك: تحصل نوافذ السياق الأكبر على جزء أكبر من السجل السابق، حتى سقف ثابت؛ بينما تحتفظ واجهات CLI الخلفية الأخرى بالقيمة الافتراضية المتحفظة. لا يتحكم هذا الحد إلا في كتلة السجل السابق ضمن مطالبة إعادة التهيئة — أما حدود مخرجات الجلسة الحية فتُضبط بصورة منفصلة ضمن `reliability.outputLimits` (راجع [الجلسات](#sessions)).

## القيود

- لا توجد استدعاءات مباشرة لأدوات OpenClaw: لا يحقن OpenClaw استدعاءات الأدوات في بروتوكول واجهة CLI الخلفية. لا ترى الواجهات الخلفية أدوات Gateway إلا عندما تشترك في `bundleMcp: true`.
- يعتمد التدفق على الواجهة الخلفية: تبث بعض الواجهات الخلفية JSONL، بينما تخزّن أخرى المخرجات مؤقتًا حتى الخروج.
- تعتمد المخرجات المنظّمة على تنسيق JSON الخاص بواجهة CLI نفسها.

## استكشاف الأخطاء وإصلاحها

| العَرَض                    | الحل                                                                          |
| -------------------------- | ---------------------------------------------------------------------------- |
| تعذر العثور على CLI       | عيّن `command` إلى مسار كامل.                                                 |
| اسم النموذج غير صحيح      | استخدم `modelAliases` لربط `provider/model` بمعرّف النموذج في CLI.           |
| لا استمرارية للجلسة       | تأكد من تعيين `sessionArg` وأن `sessionMode` ليست `none`.                    |
| يتم تجاهل الصور           | عيّن `imageArg` وتحقق من أن CLI يدعم مسارات الملفات.                         |

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [النماذج المحلية](/ar/gateway/local-models)
