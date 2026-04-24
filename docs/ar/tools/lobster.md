---
read_when:
    - تريد مسارات عمل حتمية متعددة الخطوات مع موافقات صريحة
    - تحتاج إلى استئناف مسار عمل من دون إعادة تشغيل الخطوات السابقة
summary: بيئة تشغيل TaskFlow typed في OpenClaw مع بوابات موافقة قابلة للاستئناف.
title: كركند
x-i18n:
    generated_at: "2026-04-24T08:09:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster هي shell لمسارات العمل تتيح لـ OpenClaw تشغيل تسلسلات أدوات متعددة الخطوات كعملية واحدة حتمية مع نقاط تحقق موافقة صريحة.

تقع Lobster في طبقة تأليف أعلى بدرجة واحدة من العمل الخلفي المنفصل. ولتنسيق التدفقات فوق المهام الفردية، راجع [TaskFlow](/ar/automation/taskflow) ‏(`openclaw tasks flow`). وبالنسبة إلى دفتر نشاط المهام، راجع [`openclaw tasks`](/ar/automation/tasks).

## الفكرة

يمكن لمساعدك بناء الأدوات التي تدير نفسه. اطلب مسار عمل، وبعد 30 دقيقة سيكون لديك CLI بالإضافة إلى خطوط أنابيب تعمل كاستدعاء واحد. Lobster هي القطعة المفقودة: خطوط أنابيب حتمية، وموافقات صريحة، وحالة قابلة للاستئناف.

## لماذا

اليوم، تتطلب مسارات العمل المعقدة الكثير من استدعاءات الأدوات ذهابًا وإيابًا. وكل استدعاء يكلّف رموزًا، ويجب على LLM تنسيق كل خطوة. وتنقل Lobster هذا التنسيق إلى بيئة تشغيل typed:

- **استدعاء واحد بدلًا من كثير**: يشغّل OpenClaw استدعاء أداة Lobster واحدًا ويحصل على نتيجة منظمة.
- **الموافقات مدمجة**: تؤدي الآثار الجانبية (إرسال بريد إلكتروني، نشر تعليق) إلى إيقاف مسار العمل حتى تتم الموافقة عليه صراحةً.
- **قابل للاستئناف**: تعيد مسارات العمل المتوقفة رمزًا؛ وافق ثم استأنف من دون إعادة تشغيل كل شيء.

## لماذا DSL بدلًا من البرامج العادية؟

صُممت Lobster لتكون صغيرة عمدًا. فالهدف ليس "لغة جديدة"، بل مواصفة خطوط أنابيب قابلة للتنبؤ وصديقة للذكاء الاصطناعي مع موافقات من الدرجة الأولى ورموز استئناف.

- **الموافقة/الاستئناف مدمجان**: يمكن لبرنامج عادي أن يطلب من إنسان، لكنه لا يستطيع _التوقف والاستئناف_ باستخدام رمز دائم من دون أن تخترع بنفسك بيئة التشغيل تلك.
- **الحتمية + القابلية للتدقيق**: خطوط الأنابيب هي بيانات، لذا يسهل تسجيلها، ومقارنتها، وإعادة تشغيلها، ومراجعتها.
- **سطح مقيّد للذكاء الاصطناعي**: تقلل قواعد صغيرة + تمرير JSON من مسارات التعليمات البرمجية "الإبداعية" وتجعل التحقق واقعيًا.
- **سياسة الأمان مدمجة**: تُفرض المهلات، وحدود الخرج، وفحوصات sandbox، وقوائم السماح بواسطة بيئة التشغيل، لا بواسطة كل script.
- **ما تزال قابلة للبرمجة**: يمكن لكل خطوة استدعاء أي CLI أو script. وإذا كنت تريد JS/TS، فأنشئ ملفات `.lobster` من التعليمات البرمجية.

## كيف يعمل

يشغّل OpenClaw مسارات عمل Lobster **داخل العملية** باستخدام runner مضمن. ولا يتم إنشاء أي subprocess خارجي لـ CLI؛ بل ينفذ محرك مسار العمل داخل عملية gateway ويعيد مباشرةً JSON envelope.
إذا توقف خط الأنابيب انتظارًا للموافقة، تعيد الأداة `resumeToken` حتى تتمكن من المتابعة لاحقًا.

## النمط: CLI صغير + تمرير JSON + موافقات

ابنِ أوامر صغيرة تتحدث JSON، ثم اربطها في استدعاء Lobster واحد. (أسماء الأوامر أدناه مجرد أمثلة — استبدلها بأوامرك.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

إذا طلب خط الأنابيب موافقة، فاستأنف باستخدام الرمز:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

يقوم الذكاء الاصطناعي بتشغيل مسار العمل؛ وتنفذ Lobster الخطوات. وتحافظ بوابات الموافقة على كون الآثار الجانبية صريحة وقابلة للتدقيق.

مثال: حوّل عناصر الإدخال إلى استدعاءات أدوات:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## خطوات LLM المعتمدة على JSON فقط (`llm-task`)

بالنسبة إلى مسارات العمل التي تحتاج إلى **خطوة LLM منظمة**، فعّل
أداة Plugin الاختيارية `llm-task` واستدعها من Lobster. ويبقي هذا مسار العمل
حتميًا مع السماح في الوقت نفسه بالتصنيف/التلخيص/الصياغة باستخدام نموذج.

فعّل الأداة:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

استخدمها في خط أنابيب:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

راجع [LLM Task](/ar/tools/llm-task) للحصول على التفاصيل وخيارات الإعداد.

## ملفات مسارات العمل (`.lobster`)

يمكن لـ Lobster تشغيل ملفات مسارات عمل YAML/JSON تحتوي على الحقول `name` و`args` و`steps` و`env` و`condition` و`approval`. وفي استدعاءات أدوات OpenClaw، اضبط `pipeline` على مسار الملف.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

ملاحظات:

- يقوم `stdin: $step.stdout` و`stdin: $step.json` بتمرير خرج خطوة سابقة.
- يمكن لـ `condition` ‏(أو `when`) ضبط تنفيذ الخطوات بناءً على `$step.approved`.

## تثبيت Lobster

تعمل مسارات عمل Lobster المضمنة داخل العملية؛ ولا حاجة إلى ملف تنفيذي منفصل `lobster`. ويأتي runner المضمن مع Plugin الخاصة بـ Lobster.

إذا كنت تحتاج إلى Lobster CLI المستقل للتطوير أو خطوط الأنابيب الخارجية، فثبّته من [مستودع Lobster](https://github.com/openclaw/lobster) وتأكد من أن `lobster` موجود على `PATH`.

## فعّل الأداة

Lobster هي **أداة Plugin اختيارية** (غير مفعلة افتراضيًا).

الموصى به (إضافي وآمن):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

أو لكل وكيل:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

تجنب استخدام `tools.allow: ["lobster"]` ما لم تكن تنوي التشغيل في وضع قائمة السماح المقيد.

ملاحظة: قوائم السماح اختيارية بالنسبة إلى Plugins الاختيارية. وإذا كانت قائمة السماح لديك لا تذكر سوى
أدوات Plugin ‏(مثل `lobster`)، فإن OpenClaw يبقي الأدوات الأساسية مفعلة. ولتقييد الأدوات الأساسية،
ضمّن الأدوات أو المجموعات الأساسية التي تريدها في قائمة السماح أيضًا.

## مثال: فرز البريد الإلكتروني

من دون Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

مع Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

تعيد JSON envelope ‏(مقتطعة):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

يوافق المستخدم ← استئناف:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

مسار عمل واحد. حتمي. آمن.

## معلمات الأداة

### `run`

شغّل خط أنابيب في وضع الأداة.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

شغّل ملف مسار عمل مع معاملات:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

واصل مسار عمل متوقفًا بعد الموافقة.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### مدخلات اختيارية

- `cwd`: دليل عمل نسبي لخط الأنابيب (يجب أن يبقى ضمن دليل عمل gateway).
- `timeoutMs`: إيقاف مسار العمل إذا تجاوز هذه المدة (الافتراضي: 20000).
- `maxStdoutBytes`: إيقاف مسار العمل إذا تجاوز الخرج هذا الحجم (الافتراضي: 512000).
- `argsJson`: سلسلة JSON يتم تمريرها إلى `lobster run --args-json` ‏(لملفات مسارات العمل فقط).

## Output envelope

تعيد Lobster JSON envelope بإحدى ثلاث حالات:

- `ok` ← اكتمل بنجاح
- `needs_approval` ← متوقف مؤقتًا؛ يلزم `requiresApproval.resumeToken` للاستئناف
- `cancelled` ← تم رفضه أو إلغاؤه صراحةً

تكشف الأداة عن envelope في كل من `content` ‏(JSON منسق) و`details` ‏(الكائن الخام).

## الموافقات

إذا كانت `requiresApproval` موجودة، فافحص المطالبة وقرر:

- `approve: true` ← استأنف وواصل الآثار الجانبية
- `approve: false` ← ألغِ مسار العمل وأنهه

استخدم `approve --preview-from-stdin --limit N` لإرفاق معاينة JSON بطلبات الموافقة من دون glue مخصص من `jq`/heredoc. كما أصبحت رموز الاستئناف الآن مضغوطة: إذ تخزن Lobster حالة استئناف مسار العمل تحت state dir الخاص بها وتعيد مفتاح رمز صغيرًا.

## OpenProse

ينسجم OpenProse جيدًا مع Lobster: استخدم `/prose` لتنسيق التحضير متعدد الوكلاء، ثم شغّل خط أنابيب Lobster للحصول على موافقات حتمية. وإذا كان برنامج Prose يحتاج إلى Lobster، فاسمح بأداة `lobster` للوكلاء الفرعيين عبر `tools.subagents.tools`. راجع [OpenProse](/ar/prose).

## الأمان

- **محلي داخل العملية فقط** — تُنفذ مسارات العمل داخل عملية gateway؛ ولا توجد استدعاءات شبكة من Plugin نفسها.
- **لا أسرار** — لا تدير Lobster OAuth؛ بل تستدعي أدوات OpenClaw التي تقوم بذلك.
- **مدركة للـ Sandbox** — تكون معطلة عندما يكون سياق الأداة داخل sandbox.
- **مقواة** — يفرض runner المضمن المهلات وحدود الخرج.

## استكشاف الأخطاء وإصلاحها

- **`lobster timed out`** ← زد `timeoutMs`، أو قسّم خط أنابيب طويلًا.
- **`lobster output exceeded maxStdoutBytes`** ← ارفع `maxStdoutBytes` أو قلّل حجم الخرج.
- **`lobster returned invalid JSON`** ← تأكد من أن خط الأنابيب يعمل في وضع الأداة ويطبع JSON فقط.
- **`lobster failed`** ← تحقق من سجلات gateway لمعرفة تفاصيل خطأ runner المضمن.

## تعلّم المزيد

- [Plugins](/ar/tools/plugin)
- [تأليف أدوات Plugin](/ar/plugins/building-plugins#registering-agent-tools)

## دراسة حالة: مسارات عمل المجتمع

أحد الأمثلة العامة: CLI لـ “second brain” + خطوط أنابيب Lobster تدير ثلاثة خزائن Markdown ‏(شخصية، وشريك، ومشتركة). ويولد CLI بيانات JSON للإحصاءات، وقوائم inbox، وفحوصات التقادم؛ ثم تربط Lobster هذه الأوامر في مسارات عمل مثل `weekly-review` و`inbox-triage` و`memory-consolidation` و`shared-task-sync`، ولكل منها بوابات موافقة. ويتعامل الذكاء الاصطناعي مع الحكم (التصنيف) عند توفره ويعود إلى قواعد حتمية عندما لا يتوفر.

- الخيط: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- المستودع: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — جدولة مسارات عمل Lobster
- [نظرة عامة على الأتمتة](/ar/automation) — جميع آليات الأتمتة
- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
