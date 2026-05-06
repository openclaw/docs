---
read_when:
    - تريد سير عمل حتمية متعددة الخطوات مع موافقات صريحة
    - تحتاج إلى استئناف سير عمل دون إعادة تنفيذ الخطوات السابقة
summary: بيئة تشغيل سير عمل محددة الأنواع لـ OpenClaw مع بوابات موافقة قابلة للاستئناف.
title: الكركند
x-i18n:
    generated_at: "2026-05-06T08:17:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster هو غلاف سير عمل يتيح لـ OpenClaw تشغيل تسلسلات أدوات متعددة الخطوات كعملية واحدة حتمية مع نقاط موافقة صريحة.

Lobster هو طبقة تأليف واحدة فوق العمل الخلفي المنفصل. لتنسيق التدفقات فوق المهام الفردية، راجع [تدفق المهام](/ar/automation/taskflow) (`openclaw tasks flow`). ولسجل نشاط المهام، راجع [`openclaw tasks`](/ar/automation/tasks).

## Hook

يمكن لمساعدك بناء الأدوات التي تدير نفسه. اطلب سير عمل، وبعد 30 دقيقة ستحصل على CLI إضافة إلى خطوط معالجة تعمل كاستدعاء واحد. Lobster هو الجزء الناقص: خطوط معالجة حتمية، وموافقات صريحة، وحالة قابلة للاستئناف.

## لماذا

اليوم، تتطلب سير العمل المعقدة الكثير من استدعاءات الأدوات ذهابًا وإيابًا. يستهلك كل استدعاء رموزًا، ويجب على LLM تنسيق كل خطوة. ينقل Lobster هذا التنسيق إلى وقت تشغيل مضبوط بالأنواع:

- **استدعاء واحد بدلًا من عدة استدعاءات**: يشغّل OpenClaw استدعاء أداة Lobster واحدًا ويحصل على نتيجة منظمة.
- **الموافقات مدمجة**: توقف الآثار الجانبية (إرسال بريد إلكتروني، نشر تعليق) سير العمل حتى تتم الموافقة عليها صراحة.
- **قابل للاستئناف**: تعيد سير العمل المتوقفة رمزًا؛ وافق واستأنف من دون إعادة تشغيل كل شيء.

## لماذا DSL بدلًا من برامج عادية؟

Lobster صغير عمدًا. الهدف ليس "لغة جديدة"، بل مواصفة خط معالجة متوقعة وملائمة للذكاء الاصطناعي مع موافقات ورموز استئناف من الدرجة الأولى.

- **الموافقة/الاستئناف مدمجان**: يمكن لبرنامج عادي مطالبة إنسان، لكنه لا يستطيع _الإيقاف المؤقت والاستئناف_ برمز دائم من دون أن تخترع وقت التشغيل ذلك بنفسك.
- **الحتمية + قابلية التدقيق**: خطوط المعالجة هي بيانات، لذا يسهل تسجيلها، ومقارنتها، وإعادة تشغيلها، ومراجعتها.
- **سطح مقيّد للذكاء الاصطناعي**: قواعد صغيرة + تمرير JSON يقللان مسارات الشيفرة "الإبداعية" ويجعلان التحقق واقعيًا.
- **سياسة الأمان مدمجة**: تفرض بيئة التشغيل مهلات التنفيذ، وحدود الإخراج، وفحوصات صندوق العزل، وقوائم السماح، لا كل سكربت على حدة.
- **ما زال قابلًا للبرمجة**: يمكن لكل خطوة استدعاء أي CLI أو سكربت. إذا كنت تريد JS/TS، فأنشئ ملفات `.lobster` من الشيفرة.

## كيف يعمل

يشغّل OpenClaw سير عمل Lobster **داخل العملية** باستخدام مشغّل مضمّن. لا تُنشأ عملية فرعية CLI خارجية؛ ينفّذ محرك سير العمل داخل عملية Gateway ويعيد غلاف JSON مباشرة.
إذا توقف خط المعالجة مؤقتًا لطلب الموافقة، تعيد الأداة `resumeToken` حتى تتمكن من المتابعة لاحقًا.

## النمط: CLI صغير + أنابيب JSON + موافقات

ابنِ أوامر صغيرة تتحدث JSON، ثم اربطها في استدعاء Lobster واحد. (أسماء الأوامر أدناه أمثلة - استبدلها بما يناسبك.)

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

إذا طلب خط المعالجة موافقة، فاستأنف باستخدام الرمز:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

يشغّل الذكاء الاصطناعي سير العمل؛ وينفّذ Lobster الخطوات. تُبقي بوابات الموافقة الآثار الجانبية صريحة وقابلة للتدقيق.

مثال: تعيين عناصر الإدخال إلى استدعاءات أدوات:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## خطوات LLM التي تعتمد JSON فقط (llm-task)

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

استخدمها في خط معالجة:

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

- يمرر `stdin: $step.stdout` و`stdin: $step.json` إخراج خطوة سابقة.
- يمكن لـ `condition` (أو `when`) أن تجعل الخطوات مشروطة بـ `$step.approved`.

## تثبيت Lobster

تعمل سير عمل Lobster المضمّنة داخل العملية؛ ولا يلزم ملف تنفيذي `lobster` منفصل. يأتي المشغّل المضمّن مع Plugin الخاص بـ Lobster.

إذا كنت تحتاج إلى CLI المستقل لـ Lobster للتطوير أو خطوط المعالجة الخارجية، فثبّته من [مستودع Lobster](https://github.com/openclaw/lobster) وتأكد من أن `lobster` موجود في `PATH`.

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

تجنب استخدام `tools.allow: ["lobster"]` إلا إذا كنت تنوي العمل في وضع قائمة السماح المقيّدة.

<Note>
قوائم السماح اختيارية للتطبيقات الاختيارية. يفعّل `alsoAllow` أدوات Plugin الاختيارية المسماة فقط مع الحفاظ على مجموعة أدوات النواة العادية. لتقييد أدوات النواة، استخدم `tools.allow` مع أدوات النواة أو المجموعات التي تريدها.
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

## معلمات الأداة

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
- `argsJson`: سلسلة JSON تُمرر إلى `lobster run --args-json` (ملفات سير العمل فقط).

## غلاف الإخراج

يعيد Lobster غلاف JSON بإحدى ثلاث حالات:

- `ok` → انتهى بنجاح
- `needs_approval` → متوقف مؤقتًا؛ يلزم `requiresApproval.resumeToken` للاستئناف
- `cancelled` → رُفض أو أُلغي صراحة

تعرض الأداة الغلاف في كل من `content` (JSON منسق) و`details` (كائن خام).

## الموافقات

إذا كان `requiresApproval` موجودًا، فافحص المطلب وقرر:

- `approve: true` → استئناف ومتابعة الآثار الجانبية
- `approve: false` → إلغاء وإنهاء سير العمل

استخدم `approve --preview-from-stdin --limit N` لإرفاق معاينة JSON بطلبات الموافقة من دون ربط jq/heredoc مخصص. أصبحت رموز الاستئناف مضغوطة الآن: يخزن Lobster حالة استئناف سير العمل تحت دليل الحالة الخاص به ويعيد مفتاح رمز صغيرًا.

## OpenProse

يتكامل OpenProse جيدًا مع Lobster: استخدم `/prose` لتنسيق التحضير متعدد الوكلاء، ثم شغّل خط معالجة Lobster لموافقات حتمية. إذا احتاج برنامج Prose إلى Lobster، فاسمح بأداة `lobster` للوكلاء الفرعيين عبر `tools.subagents.tools`. راجع [OpenProse](/ar/prose).

## الأمان

- **محلي داخل العملية فقط** - تُنفّذ سير العمل داخل عملية Gateway؛ ولا يجري Plugin نفسه أي استدعاءات شبكية.
- **لا أسرار** - لا يدير Lobster OAuth؛ بل يستدعي أدوات OpenClaw التي تفعل ذلك.
- **واعٍ بصندوق العزل** - يُعطّل عندما يكون سياق الأداة داخل صندوق عزل.
- **مقوّى** - يفرض المشغّل المضمّن مهلات التنفيذ وحدود الإخراج.

## استكشاف الأخطاء وإصلاحها

- **`lobster timed out`** → زد `timeoutMs`، أو قسّم خط المعالجة الطويل.
- **`lobster output exceeded maxStdoutBytes`** → ارفع `maxStdoutBytes` أو قلّل حجم الإخراج.
- **`lobster returned invalid JSON`** → تأكد من أن خط المعالجة يعمل في وضع الأداة ولا يطبع إلا JSON.
- **`lobster failed`** → افحص سجلات Gateway لمعرفة تفاصيل خطأ المشغّل المضمّن.

## تعلّم المزيد

- [Plugins](/ar/tools/plugin)
- [تأليف أدوات Plugin](/ar/plugins/building-plugins#registering-agent-tools)

## دراسة حالة: سير عمل المجتمع

مثال عام واحد: CLI "دماغ ثانٍ" + خطوط معالجة Lobster تدير ثلاثة مخازن Markdown (شخصي، شريك، مشترك). يُخرج CLI بيانات JSON للإحصاءات، وقوائم صندوق الوارد، وفحوصات العناصر الراكدة؛ ويربط Lobster تلك الأوامر في سير عمل مثل `weekly-review` و`inbox-triage` و`memory-consolidation` و`shared-task-sync`، ولكل منها بوابات موافقة. يتولى الذكاء الاصطناعي الحكم (التصنيف) عند توفره، ويعود إلى قواعد حتمية عندما لا يتوفر.

- السلسلة: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- المستودع: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ذو صلة

- [الأتمتة والمهام](/ar/automation) - جدولة سير عمل Lobster
- [نظرة عامة على الأتمتة](/ar/automation) - جميع آليات الأتمتة
- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكلاء المتاحة
