---
read_when:
    - تريد مسارات عمل حتمية متعددة الخطوات مع موافقات صريحة
    - تحتاج إلى استئناف سير عمل دون إعادة تنفيذ الخطوات السابقة
summary: بيئة تشغيل سير عمل مكتوبة الأنواع لـ OpenClaw مع بوابات موافقة قابلة للاستئناف.
title: كركند
x-i18n:
    generated_at: "2026-04-30T08:31:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 16
---

Lobster هو غلاف سير عمل يتيح لـ OpenClaw تشغيل تسلسلات أدوات متعددة الخطوات كعملية واحدة وحتمية مع نقاط تحقق صريحة للموافقة.

Lobster هو طبقة تأليف واحدة فوق العمل الخلفي المنفصل. لتنسيق التدفقات فوق المهام الفردية، راجع [تدفق المهام](/ar/automation/taskflow) (`openclaw tasks flow`). ولدفتر نشاط المهام، راجع [`openclaw tasks`](/ar/automation/tasks).

## الخطّاف

يمكن لمساعدك بناء الأدوات التي تدير نفسه. اطلب سير عمل، وبعد 30 دقيقة تحصل على CLI إضافة إلى مسارات تعمل باستدعاء واحد. Lobster هو القطعة الناقصة: مسارات حتمية، وموافقات صريحة، وحالة قابلة للاستئناف.

## لماذا

اليوم، تتطلب سير العمل المعقدة الكثير من استدعاءات الأدوات المتبادلة. كل استدعاء يستهلك رموزًا، وعلى LLM تنسيق كل خطوة. ينقل Lobster هذا التنسيق إلى وقت تشغيل ذي أنواع محددة:

- **استدعاء واحد بدلًا من العديد**: يشغّل OpenClaw استدعاء أداة Lobster واحدًا ويحصل على نتيجة منظّمة.
- **الموافقات مدمجة**: توقف الآثار الجانبية (إرسال بريد إلكتروني، نشر تعليق) سير العمل حتى تتم الموافقة عليها صراحة.
- **قابل للاستئناف**: تعيد سير العمل المتوقفة رمزًا؛ وافق واستأنف دون إعادة تشغيل كل شيء.

## لماذا DSL بدلًا من البرامج العادية؟

Lobster صغير عمدًا. الهدف ليس "لغة جديدة"، بل مواصفة مسارات قابلة للتنبؤ وملائمة للذكاء الاصطناعي مع موافقات ورموز استئناف من الدرجة الأولى.

- **الموافقة/الاستئناف مدمجان**: يمكن لبرنامج عادي أن يطلب من إنسان إدخالًا، لكنه لا يستطيع _الإيقاف المؤقت والاستئناف_ باستخدام رمز دائم دون أن تخترع وقت التشغيل هذا بنفسك.
- **الحتمية + قابلية التدقيق**: المسارات بيانات، لذا يسهل تسجيلها ومقارنتها وإعادة تشغيلها ومراجعتها.
- **سطح مقيّد للذكاء الاصطناعي**: قواعد صغيرة + تمرير JSON يقللان مسارات الشيفرة "الإبداعية" ويجعلان التحقق واقعيًا.
- **سياسة السلامة مدمجة**: المهلات، وحدود المخرجات، وفحوصات صندوق الرمل، وقوائم السماح يفرضها وقت التشغيل، لا كل سكربت.
- **ما زال قابلًا للبرمجة**: يمكن لكل خطوة استدعاء أي CLI أو سكربت. إذا أردت JS/TS، فأنشئ ملفات `.lobster` من الشيفرة.

## كيف يعمل

يشغّل OpenClaw سير عمل Lobster **داخل العملية** باستخدام مشغّل مضمّن. لا يتم إنشاء عملية فرعية خارجية لـ CLI؛ ينفّذ محرك سير العمل داخل عملية Gateway ويعيد ظرف JSON مباشرة.
إذا توقف المسار مؤقتًا للموافقة، تعيد الأداة `resumeToken` لكي تتمكن من المتابعة لاحقًا.

## النمط: CLI صغير + أنابيب JSON + موافقات

ابنِ أوامر صغيرة تتحدث JSON، ثم اربطها في استدعاء Lobster واحد. (أسماء الأوامر أدناه أمثلة — استبدلها بأوامرك الخاصة.)

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

إذا طلب المسار موافقة، فاستأنف باستخدام الرمز:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

يطلق الذكاء الاصطناعي سير العمل؛ وينفّذ Lobster الخطوات. تبقي بوابات الموافقة الآثار الجانبية صريحة وقابلة للتدقيق.

مثال: تحويل عناصر الإدخال إلى استدعاءات أدوات:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## خطوات LLM التي تعتمد JSON فقط (llm-task)

لسير العمل التي تحتاج إلى **خطوة LLM منظّمة**، فعّل أداة Plugin الاختيارية
`llm-task` واستدعها من Lobster. يبقي هذا سير العمل
حتميًا مع السماح لك بالتصنيف/التلخيص/الصياغة باستخدام نموذج.

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

استخدمها في مسار:

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

راجع [مهمة LLM](/ar/tools/llm-task) للتفاصيل وخيارات التهيئة.

## ملفات سير العمل (.lobster)

يمكن لـ Lobster تشغيل ملفات سير عمل YAML/JSON تحتوي على حقول `name` و`args` و`steps` و`env` و`condition` و`approval`. في استدعاءات أدوات OpenClaw، اضبط `pipeline` على مسار الملف.

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

- يمرر `stdin: $step.stdout` و`stdin: $step.json` مخرجات خطوة سابقة.
- يمكن لـ `condition` (أو `when`) حجب الخطوات بناءً على `$step.approved`.

## تثبيت Lobster

تعمل سير عمل Lobster المضمّنة داخل العملية؛ ولا يلزم ملف تنفيذي `lobster` منفصل. يأتي المشغّل المضمّن مع Lobster Plugin.

إذا احتجت إلى CLI المستقل الخاص بـ Lobster للتطوير أو المسارات الخارجية، فثبّته من [مستودع Lobster](https://github.com/openclaw/lobster) وتأكد من أن `lobster` موجود على `PATH`.

## تفعيل الأداة

Lobster أداة Plugin **اختيارية** (غير مفعّلة افتراضيًا).

موصى به (إضافي وآمن):

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

تجنب استخدام `tools.allow: ["lobster"]` إلا إذا كنت تنوي التشغيل في وضع قائمة سماح مقيّدة.

<Note>
قوائم السماح اختيارية للـ Plugins الاختيارية. إذا كانت قائمة السماح لديك تسمي أدوات Plugin فقط (مثل `lobster`)، يبقي OpenClaw أدوات النواة مفعّلة. لتقييد أدوات النواة، أدرج أدوات النواة أو المجموعات التي تريدها في قائمة السماح أيضًا.
</Note>

## مثال: فرز البريد الإلكتروني

بدون Lobster:

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

يعيد ظرف JSON (مختصرًا):

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

يوافق المستخدم → الاستئناف:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

سير عمل واحد. حتمي. آمن.

## معاملات الأداة

### `run`

شغّل مسارًا في وضع الأداة.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

شغّل ملف سير عمل مع وسيطات:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

تابع سير عمل متوقفًا بعد الموافقة.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### مدخلات اختيارية

- `cwd`: دليل العمل النسبي للمسار (يجب أن يبقى ضمن دليل عمل Gateway).
- `timeoutMs`: إيقاف سير العمل إذا تجاوز هذه المدة (الافتراضي: 20000).
- `maxStdoutBytes`: إيقاف سير العمل إذا تجاوزت المخرجات هذا الحجم (الافتراضي: 512000).
- `argsJson`: سلسلة JSON تُمرر إلى `lobster run --args-json` (ملفات سير العمل فقط).

## ظرف المخرجات

يعيد Lobster ظرف JSON بإحدى ثلاث حالات:

- `ok` → اكتمل بنجاح
- `needs_approval` → متوقف مؤقتًا؛ يلزم `requiresApproval.resumeToken` للاستئناف
- `cancelled` → رُفض أو أُلغي صراحة

تعرض الأداة الظرف في كل من `content` (JSON منسق) و`details` (الكائن الخام).

## الموافقات

إذا كان `requiresApproval` موجودًا، فافحص المطالبة وقرر:

- `approve: true` → الاستئناف ومتابعة الآثار الجانبية
- `approve: false` → الإلغاء وإنهاء سير العمل

استخدم `approve --preview-from-stdin --limit N` لإرفاق معاينة JSON بطلبات الموافقة دون غراء jq/heredoc مخصص. أصبحت رموز الاستئناف الآن مضغوطة: يخزّن Lobster حالة استئناف سير العمل ضمن دليل حالته ويعيد مفتاح رمز صغيرًا.

## OpenProse

يتوافق OpenProse جيدًا مع Lobster: استخدم `/prose` لتنسيق تحضير متعدد الوكلاء، ثم شغّل مسار Lobster للموافقات الحتمية. إذا احتاج برنامج Prose إلى Lobster، فاسمح بأداة `lobster` للوكلاء الفرعيين عبر `tools.subagents.tools`. راجع [OpenProse](/ar/prose).

## السلامة

- **محلي داخل العملية فقط** — تنفّذ سير العمل داخل عملية Gateway؛ لا توجد استدعاءات شبكة من Plugin نفسه.
- **لا أسرار** — لا يدير Lobster OAuth؛ بل يستدعي أدوات OpenClaw التي تفعل ذلك.
- **مدرك لصندوق الرمل** — يُعطّل عندما يكون سياق الأداة ضمن صندوق رمل.
- **مقوّى** — يفرض المشغّل المضمّن المهلات وحدود المخرجات.

## استكشاف الأخطاء وإصلاحها

- **`lobster timed out`** → زد `timeoutMs`، أو قسّم المسار الطويل.
- **`lobster output exceeded maxStdoutBytes`** → ارفع `maxStdoutBytes` أو قلّل حجم المخرجات.
- **`lobster returned invalid JSON`** → تأكد من أن المسار يعمل في وضع الأداة ويطبع JSON فقط.
- **`lobster failed`** → تحقق من سجلات Gateway للحصول على تفاصيل خطأ المشغّل المضمّن.

## معرفة المزيد

- [Plugins](/ar/tools/plugin)
- [تأليف أدوات Plugin](/ar/plugins/building-plugins#registering-agent-tools)

## دراسة حالة: سير عمل المجتمع

مثال عام واحد: CLI لـ “دماغ ثانٍ” + مسارات Lobster تدير ثلاث خزائن Markdown (شخصية، شريك، مشتركة). يخرج CLI بيانات JSON للإحصاءات، وقوائم صندوق الوارد، وفحوصات العناصر الراكدة؛ ويربط Lobster هذه الأوامر في سير عمل مثل `weekly-review` و`inbox-triage` و`memory-consolidation` و`shared-task-sync`، لكل منها بوابات موافقة. يتولى الذكاء الاصطناعي الحكم (التصنيف) عند توفره، ويعود إلى قواعد حتمية عند عدم توفره.

- السلسلة: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- المستودع: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ذو صلة

- [الأتمتة والمهام](/ar/automation) — جدولة سير عمل Lobster
- [نظرة عامة على الأتمتة](/ar/automation) — جميع آليات الأتمتة
- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
