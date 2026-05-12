---
read_when:
    - تريد سير عمل حتمية متعددة الخطوات مع موافقات صريحة
    - تحتاج إلى استئناف سير عمل دون إعادة تنفيذ الخطوات السابقة
summary: بيئة تشغيل سير عمل ذات أنواع لـ OpenClaw مع بوابات موافقة قابلة للاستئناف.
title: جراد البحر
x-i18n:
    generated_at: "2026-05-12T01:01:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
---

Lobster هو غلاف سير عمل يتيح لـ OpenClaw تشغيل تسلسلات أدوات متعددة الخطوات كعملية واحدة حتمية مع نقاط تحقق صريحة للموافقة.

Lobster هو طبقة تأليف فوق العمل المنفصل في الخلفية. لتنسيق التدفقات فوق المهام الفردية، راجع [TaskFlow](/ar/automation/taskflow) (`openclaw tasks flow`). ولسجل نشاط المهام، راجع [`openclaw tasks`](/ar/automation/tasks).

## Hook

يمكن لمساعدك بناء الأدوات التي تدير نفسه. اطلب سير عمل، وبعد 30 دقيقة سيكون لديك CLI بالإضافة إلى خطوط معالجة تعمل كاستدعاء واحد. Lobster هو الجزء المفقود: خطوط معالجة حتمية، وموافقات صريحة، وحالة قابلة للاستئناف.

## لماذا

اليوم، تتطلب سير العمل المعقدة الكثير من استدعاءات الأدوات ذهابًا وإيابًا. كل استدعاء يستهلك رموزًا، ويجب على LLM تنسيق كل خطوة. ينقل Lobster هذا التنسيق إلى وقت تشغيل ذي أنواع محددة:

- **استدعاء واحد بدلًا من عدة استدعاءات**: يشغل OpenClaw استدعاء أداة Lobster واحدًا ويحصل على نتيجة منظمة.
- **الموافقات مدمجة**: توقف الآثار الجانبية (إرسال بريد إلكتروني، نشر تعليق) سير العمل حتى تتم الموافقة عليها صراحة.
- **قابل للاستئناف**: تعيد سير العمل المتوقفة رمزًا؛ وافق واستأنف دون إعادة تشغيل كل شيء.

## لماذا DSL بدلًا من البرامج العادية؟

Lobster صغير عن قصد. الهدف ليس "لغة جديدة"، بل مواصفة خط معالجة متوقعة وملائمة للذكاء الاصطناعي مع موافقات ورموز استئناف من الدرجة الأولى.

- **الموافقة/الاستئناف مدمجان**: يمكن لبرنامج عادي مطالبة إنسان، لكنه لا يستطيع _الإيقاف المؤقت والاستئناف_ برمز دائم دون أن تخترع أنت وقت التشغيل هذا بنفسك.
- **الحتمية + قابلية التدقيق**: خطوط المعالجة بيانات، لذلك يسهل تسجيلها، ومقارنتها، وإعادة تشغيلها، ومراجعتها.
- **سطح مقيد للذكاء الاصطناعي**: قواعد صغيرة + تمرير JSON تقلل مسارات الكود "الإبداعية" وتجعل التحقق واقعيًا.
- **سياسة الأمان مدمجة**: حدود الوقت، وحدود الإخراج، وفحوصات وضع الحماية، وقوائم السماح يفرضها وقت التشغيل، لا كل سكربت.
- **ما يزال قابلًا للبرمجة**: يمكن لكل خطوة استدعاء أي CLI أو سكربت. إذا أردت JS/TS، فأنشئ ملفات `.lobster` من الكود.

## كيف يعمل

يشغل OpenClaw سير عمل Lobster **داخل العملية** باستخدام مشغل مدمج. لا يتم إنشاء عملية CLI فرعية خارجية؛ ينفذ محرك سير العمل داخل عملية Gateway ويعيد غلاف JSON مباشرة.
إذا توقف خط المعالجة مؤقتًا للموافقة، تعيد الأداة `resumeToken` حتى تتمكن من المتابعة لاحقًا.

## النمط: CLI صغير + قنوات JSON + موافقات

ابنِ أوامر صغيرة تتحدث JSON، ثم اربطها في استدعاء Lobster واحد. (أسماء الأوامر أدناه أمثلة - استبدلها بأسمائك.)

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

إذا طلب خط المعالجة موافقة، فاستأنف بالرمز:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

يطلق الذكاء الاصطناعي سير العمل؛ وينفذ Lobster الخطوات. تبقي بوابات الموافقة الآثار الجانبية صريحة وقابلة للتدقيق.

مثال: تحويل عناصر الإدخال إلى استدعاءات أدوات:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## خطوات LLM المعتمدة على JSON فقط (llm-task)

لسير العمل التي تحتاج إلى **خطوة LLM منظمة**، فعّل أداة Plugin الاختيارية
`llm-task` واستدعها من Lobster. يحافظ هذا على حتمية سير العمل
مع السماح لك بالتصنيف/التلخيص/الصياغة باستخدام نموذج.

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
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### قيد مهم: Lobster المدمج مقابل `openclaw.invoke`

يشغل Plugin Lobster المضمن سير العمل **داخل العملية** داخل Gateway. في هذا الوضع المدمج، لا يرث `openclaw.invoke` تلقائيًا سياق عنوان URL/المصادقة الخاص بـ Gateway لاستدعاءات أدوات OpenClaw CLI المتداخلة.

هذا يعني أن هذا النمط **غير موثوق به حاليًا في المشغل المدمج**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

استخدم المثال أدناه فقط عند تشغيل **Lobster CLI المستقل** في بيئة يكون فيها `openclaw.invoke` مهيأً بالفعل بسياق Gateway/المصادقة الصحيح.

استخدمه في خط معالجة Lobster CLI مستقل:

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

إذا كنت تستخدم Plugin Lobster المدمج اليوم، ففضّل إما:

- استدعاء أداة `llm-task` مباشرًا خارج Lobster، أو
- خطوات غير `openclaw.invoke` داخل خط معالجة Lobster حتى تتم إضافة جسر مدمج مدعوم.

راجع [مهمة LLM](/ar/tools/llm-task) للتفاصيل وخيارات التهيئة.

## ملفات سير العمل (.lobster)

يمكن لـ Lobster تشغيل ملفات سير عمل YAML/JSON تحتوي على حقول `name`، و`args`، و`steps`، و`env`، و`condition`، و`approval`. في استدعاءات أدوات OpenClaw، اضبط `pipeline` على مسار الملف.

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

- يمرر `stdin: $step.stdout` و`stdin: $step.json` إخراج خطوة سابقة.
- يمكن لـ `condition` (أو `when`) حجب الخطوات بناءً على `$step.approved`.

## تثبيت Lobster

تعمل سير عمل Lobster المضمنة داخل العملية؛ ولا يلزم ملف ثنائي منفصل باسم `lobster`. يأتي المشغل المدمج مع Plugin Lobster.

إذا كنت تحتاج إلى Lobster CLI المستقل للتطوير أو لخطوط معالجة خارجية، فثبته من [مستودع Lobster](https://github.com/openclaw/lobster) وتأكد من أن `lobster` موجود في `PATH`.

## تفعيل الأداة

Lobster هو أداة Plugin **اختيارية** (غير مفعلة افتراضيًا).

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

تجنب استخدام `tools.allow: ["lobster"]` إلا إذا كنت تنوي التشغيل في وضع قائمة سماح مقيدة.

<Note>
قوائم السماح اختيارية للـ Plugins الاختيارية. يفعّل `alsoAllow` أدوات Plugin الاختيارية المسماة فقط مع الحفاظ على مجموعة أدوات النواة العادية. لتقييد أدوات النواة، استخدم `tools.allow` مع أدوات النواة أو المجموعات التي تريدها.
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

يعيد غلاف JSON (مختصرًا):

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

سير عمل واحد. حتمي. آمن.

## معاملات الأداة

### `run`

تشغيل خط معالجة في وضع الأداة.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

تشغيل ملف سير عمل مع وسائط:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

متابعة سير عمل متوقف بعد الموافقة.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### مدخلات اختيارية

- `cwd`: دليل العمل النسبي لخط المعالجة (يجب أن يبقى داخل دليل عمل Gateway).
- `timeoutMs`: إيقاف سير العمل إذا تجاوز هذه المدة (الافتراضي: 20000).
- `maxStdoutBytes`: إيقاف سير العمل إذا تجاوز الإخراج هذا الحجم (الافتراضي: 512000).
- `argsJson`: سلسلة JSON تمرر إلى `lobster run --args-json` (ملفات سير العمل فقط).

## غلاف الإخراج

يعيد Lobster غلاف JSON بإحدى ثلاث حالات:

- `ok` → انتهى بنجاح
- `needs_approval` → متوقف مؤقتًا؛ مطلوب `requiresApproval.resumeToken` للاستئناف
- `cancelled` → رُفض أو أُلغي صراحة

تعرض الأداة الغلاف في كل من `content` (JSON منسق) و`details` (كائن خام).

## الموافقات

إذا كان `requiresApproval` موجودًا، فافحص المطالبة وقرر:

- `approve: true` → استئناف ومتابعة الآثار الجانبية
- `approve: false` → إلغاء وإنهاء سير العمل

استخدم `approve --preview-from-stdin --limit N` لإرفاق معاينة JSON بطلبات الموافقة دون ربط مخصص بـ jq/heredoc. أصبحت رموز الاستئناف الآن مدمجة: يخزن Lobster حالة استئناف سير العمل ضمن دليل حالته ويعيد مفتاح رمز صغيرًا.

## OpenProse

يتكامل OpenProse جيدًا مع Lobster: استخدم `/prose` لتنسيق تحضير متعدد الوكلاء، ثم شغّل خط معالجة Lobster للموافقات الحتمية. إذا احتاج برنامج Prose إلى Lobster، فاسمح بأداة `lobster` للوكلاء الفرعيين عبر `tools.subagents.tools`. راجع [OpenProse](/ar/prose).

## السلامة

- **محلي داخل العملية فقط** - تنفذ سير العمل داخل عملية Gateway؛ لا يجري Plugin نفسه أي اتصالات شبكية.
- **لا أسرار** - لا يدير Lobster OAuth؛ بل يستدعي أدوات OpenClaw التي تفعل ذلك.
- **واعٍ بوضع الحماية** - معطل عندما يكون سياق الأداة داخل وضع حماية.
- **معزز** - يفرض المشغل المدمج حدود الوقت وحدود الإخراج.

## استكشاف الأخطاء وإصلاحها

- **`lobster timed out`** → زد `timeoutMs`، أو قسّم خط معالجة طويلًا.
- **`lobster output exceeded maxStdoutBytes`** → ارفع `maxStdoutBytes` أو قلل حجم الإخراج.
- **`lobster returned invalid JSON`** → تأكد من أن خط المعالجة يعمل في وضع الأداة ويطبع JSON فقط.
- **`lobster failed`** → تحقق من سجلات Gateway لمعرفة تفاصيل خطأ المشغل المدمج.

## تعلّم المزيد

- [Plugins](/ar/tools/plugin)
- [تأليف أدوات Plugin](/ar/plugins/building-plugins#registering-agent-tools)

## دراسة حالة: سير عمل مجتمعية

مثال عام واحد: CLI لـ "دماغ ثانٍ" + خطوط معالجة Lobster تدير ثلاث خزائن Markdown (شخصية، وشريك، ومشتركة). يصدر CLI ملفات JSON للإحصاءات، وقوائم صندوق الوارد، وعمليات فحص العناصر القديمة؛ ويربط Lobster تلك الأوامر في سير عمل مثل `weekly-review`، و`inbox-triage`، و`memory-consolidation`، و`shared-task-sync`، وكل منها يحتوي على بوابات موافقة. يتولى الذكاء الاصطناعي الحكم (التصنيف) عندما يكون متاحًا، ويعود إلى قواعد حتمية عندما لا يكون كذلك.

- النقاش: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- المستودع: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ذو صلة

- [الأتمتة](/ar/automation) - جدولة سير عمل Lobster
- [نظرة عامة على الأتمتة](/ar/automation) - جميع آليات الأتمتة
- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكيل المتاحة
