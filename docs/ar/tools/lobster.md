---
read_when:
    - تريد سير عمل حتمية متعددة الخطوات مع موافقات صريحة
    - تحتاج إلى استئناف سير عمل دون إعادة تشغيل الخطوات السابقة
summary: بيئة تشغيل سير عمل مُعرّفة الأنواع لـ OpenClaw مع بوابات موافقة قابلة للاستئناف.
title: كركند
x-i18n:
    generated_at: "2026-05-04T07:11:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

Lobster هو صدفة سير عمل تتيح لـ OpenClaw تشغيل تسلسلات أدوات متعددة الخطوات كعملية واحدة حتمية مع نقاط موافقة صريحة.

Lobster هو طبقة تأليف واحدة فوق العمل المنفصل في الخلفية. لتنسيق التدفقات فوق المهام الفردية، راجع [تدفق المهام](/ar/automation/taskflow) (`openclaw tasks flow`). ولقائمة نشاط المهام، راجع [`openclaw tasks`](/ar/automation/tasks).

## الخطاف

يمكن لمساعدك بناء الأدوات التي تدير نفسه. اطلب سير عمل، وبعد 30 دقيقة سيكون لديك CLI إضافة إلى خطوط أنابيب تعمل باستدعاء واحد. Lobster هو القطعة الناقصة: خطوط أنابيب حتمية، وموافقات صريحة، وحالة قابلة للاستئناف.

## لماذا

اليوم، تتطلب سيرات العمل المعقدة العديد من استدعاءات الأدوات ذهابًا وإيابًا. كل استدعاء يستهلك رموزًا، وعلى LLM تنسيق كل خطوة. ينقل Lobster هذا التنسيق إلى وقت تشغيل نمطي:

- **استدعاء واحد بدلًا من عدة استدعاءات**: يشغّل OpenClaw استدعاء أداة Lobster واحدًا ويحصل على نتيجة منظمة.
- **الموافقات مدمجة**: توقف الآثار الجانبية (إرسال بريد إلكتروني، نشر تعليق) سير العمل إلى أن تتم الموافقة عليها صراحة.
- **قابل للاستئناف**: تعيد سيرات العمل المتوقفة رمزًا؛ وافق واستأنف من دون إعادة تشغيل كل شيء.

## لماذا DSL بدلًا من البرامج العادية؟

Lobster صغير عمدًا. الهدف ليس "لغة جديدة"، بل مواصفة خط أنابيب قابلة للتنبؤ وصديقة للذكاء الاصطناعي، مع موافقات ورموز استئناف من الدرجة الأولى.

- **الموافقة/الاستئناف مدمجان**: يمكن لبرنامج عادي أن يطلب من إنسان إدخالًا، لكنه لا يستطيع _الإيقاف المؤقت ثم الاستئناف_ برمز دائم من دون أن تخترع وقت التشغيل هذا بنفسك.
- **الحتمية + قابلية التدقيق**: خطوط الأنابيب بيانات، لذلك يسهل تسجيلها ومقارنتها وإعادة تشغيلها ومراجعتها.
- **سطح مقيد للذكاء الاصطناعي**: تقلل قواعد صغيرة + تمرير JSON من مسارات التعليمات البرمجية "الإبداعية" وتجعل التحقق واقعيًا.
- **سياسة السلامة مدمجة**: تفرض بيئة التشغيل حدود الوقت، وحدود المخرجات، وفحوصات الصندوق الرملي، وقوائم السماح، وليس كل سكربت على حدة.
- **لا يزال قابلًا للبرمجة**: يمكن لكل خطوة استدعاء أي CLI أو سكربت. إذا كنت تريد JS/TS، فأنشئ ملفات `.lobster` من التعليمات البرمجية.

## كيف يعمل

يشغّل OpenClaw سيرات عمل Lobster **داخل العملية** باستخدام مشغّل مضمّن. لا تُنشأ عملية فرعية خارجية لـ CLI؛ ينفّذ محرك سير العمل داخل عملية Gateway ويعيد غلاف JSON مباشرة.
إذا توقف خط الأنابيب للموافقة، تعيد الأداة `resumeToken` حتى تتمكن من المتابعة لاحقًا.

## النمط: CLI صغير + أنابيب JSON + موافقات

ابنِ أوامر صغيرة تتحدث JSON، ثم اربطها في استدعاء Lobster واحد. (أسماء الأوامر أدناه أمثلة — استبدلها بأوامرك.)

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

يشغّل الذكاء الاصطناعي سير العمل؛ وينفّذ Lobster الخطوات. تحافظ بوابات الموافقة على أن تكون الآثار الجانبية صريحة وقابلة للتدقيق.

مثال: تحويل عناصر الإدخال إلى استدعاءات أدوات:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## خطوات LLM التي تستخدم JSON فقط (llm-task)

لسيرات العمل التي تحتاج إلى **خطوة LLM منظمة**، فعّل أداة Plugin الاختيارية
`llm-task` واستدعها من Lobster. يحافظ هذا على حتمية سير العمل
مع إتاحة التصنيف/التلخيص/الصياغة باستخدام نموذج.

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

راجع [مهمة LLM](/ar/tools/llm-task) للتفاصيل وخيارات التكوين.

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

تعمل سيرات عمل Lobster المضمّنة داخل العملية؛ ولا يلزم ملف تنفيذي منفصل باسم `lobster`. يأتي المشغّل المضمّن مع Plugin الخاص بـ Lobster.

إذا كنت تحتاج إلى CLI مستقل لـ Lobster للتطوير أو لخطوط الأنابيب الخارجية، فثبّته من [مستودع Lobster](https://github.com/openclaw/lobster) وتأكد من أن `lobster` موجود في `PATH`.

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
قوائم السماح اختيارية التفعيل للـ plugins الاختيارية. يفعّل `alsoAllow` أدوات Plugin الاختيارية المسماة فقط مع الحفاظ على مجموعة أدوات النواة العادية. لتقييد أدوات النواة، استخدم `tools.allow` مع أدوات أو مجموعات النواة التي تريدها.
</Note>

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

شغّل ملف سير عمل مع وسائط:

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

- `cwd`: دليل العمل النسبي لخط الأنابيب (يجب أن يبقى داخل دليل عمل Gateway).
- `timeoutMs`: إجهاض سير العمل إذا تجاوز هذه المدة (الافتراضي: 20000).
- `maxStdoutBytes`: إجهاض سير العمل إذا تجاوزت المخرجات هذا الحجم (الافتراضي: 512000).
- `argsJson`: سلسلة JSON تُمرر إلى `lobster run --args-json` (ملفات سير العمل فقط).

## غلاف الإخراج

يعيد Lobster غلاف JSON بإحدى ثلاث حالات:

- `ok` → انتهى بنجاح
- `needs_approval` → متوقف مؤقتًا؛ يلزم `requiresApproval.resumeToken` للاستئناف
- `cancelled` → رُفض أو أُلغي صراحة

تعرض الأداة الغلاف في كل من `content` (JSON منسق) و`details` (كائن خام).

## الموافقات

إذا كان `requiresApproval` موجودًا، فافحص الرسالة واتخذ القرار:

- `approve: true` → استئناف ومتابعة الآثار الجانبية
- `approve: false` → إلغاء وإنهاء سير العمل

استخدم `approve --preview-from-stdin --limit N` لإرفاق معاينة JSON بطلبات الموافقة من دون لاصق jq/heredoc مخصص. أصبحت رموز الاستئناف الآن مدمجة: يخزن Lobster حالة استئناف سير العمل ضمن دليل الحالة الخاص به ويعيد مفتاح رمز صغيرًا.

## OpenProse

يتكامل OpenProse جيدًا مع Lobster: استخدم `/prose` لتنسيق تحضير متعدد الوكلاء، ثم شغّل خط أنابيب Lobster للموافقات الحتمية. إذا احتاج برنامج Prose إلى Lobster، فاسمح بأداة `lobster` للوكلاء الفرعيين عبر `tools.subagents.tools`. راجع [OpenProse](/ar/prose).

## السلامة

- **محلي وداخل العملية فقط** — تُنفّذ سيرات العمل داخل عملية Gateway؛ لا توجد استدعاءات شبكة من الـ Plugin نفسه.
- **بلا أسرار** — لا يدير Lobster OAuth؛ بل يستدعي أدوات OpenClaw التي تفعل ذلك.
- **مدرك للصندوق الرملي** — يُعطل عندما يكون سياق الأداة ضمن صندوق رملي.
- **مقوّى** — يفرض المشغّل المضمّن حدود الوقت وحدود المخرجات.

## استكشاف الأخطاء وإصلاحها

- **`lobster timed out`** → زد `timeoutMs`، أو قسّم خط أنابيب طويلًا.
- **`lobster output exceeded maxStdoutBytes`** → ارفع `maxStdoutBytes` أو قلّل حجم المخرجات.
- **`lobster returned invalid JSON`** → تأكد من أن خط الأنابيب يعمل في وضع الأداة ويطبع JSON فقط.
- **`lobster failed`** → افحص سجلات Gateway للاطلاع على تفاصيل خطأ المشغّل المضمّن.

## تعلّم المزيد

- [Plugins](/ar/tools/plugin)
- [تأليف أدوات Plugin](/ar/plugins/building-plugins#registering-agent-tools)

## دراسة حالة: سيرات عمل المجتمع

مثال عام واحد: CLI "عقل ثانٍ" + خطوط أنابيب Lobster تدير ثلاث خزائن Markdown (شخصية، شريك، مشتركة). يصدر CLI بيانات JSON للإحصاءات، وقوائم صندوق الوارد، وعمليات فحص العناصر القديمة؛ ويربط Lobster هذه الأوامر في سيرات عمل مثل `weekly-review` و`inbox-triage` و`memory-consolidation` و`shared-task-sync`، ولكل منها بوابات موافقة. يتولى الذكاء الاصطناعي الحكم (التصنيف) عند توفره، ويعود إلى قواعد حتمية عند عدم توفره.

- سلسلة النقاش: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- المستودع: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ذات صلة

- [الأتمتة والمهام](/ar/automation) — جدولة سيرات عمل Lobster
- [نظرة عامة على الأتمتة](/ar/automation) — جميع آليات الأتمتة
- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
