---
read_when:
    - تريد سير عمل حتمية متعددة الخطوات مع موافقات صريحة
    - تحتاج إلى استئناف سير عمل دون إعادة تنفيذ الخطوات السابقة
summary: بيئة تشغيل سير عمل محددة الأنواع لـ OpenClaw مع بوابات موافقة قابلة للاستئناف.
title: كركند
x-i18n:
    generated_at: "2026-05-07T13:30:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster هو غلاف سير عمل يتيح لـ OpenClaw تشغيل تسلسلات أدوات متعددة الخطوات كعملية واحدة حتمية مع نقاط تحقق موافقة صريحة.

Lobster هو طبقة تأليف واحدة فوق العمل الخلفي المنفصل. لتنظيم التدفقات فوق المهام الفردية، راجع [Task Flow](/ar/automation/taskflow) (`openclaw tasks flow`). ولسجل نشاط المهام، راجع [`openclaw tasks`](/ar/automation/tasks).

## الخطاف

يمكن لمساعدك بناء الأدوات التي تدير نفسه. اطلب سير عمل، وبعد 30 دقيقة ستحصل على CLI بالإضافة إلى خطوط معالجة تعمل باستدعاء واحد. Lobster هو القطعة المفقودة: خطوط معالجة حتمية، وموافقات صريحة، وحالة قابلة للاستئناف.

## لماذا

اليوم، تتطلب سير العمل المعقدة الكثير من استدعاءات الأدوات ذهابًا وإيابًا. كل استدعاء يستهلك رموزًا، وعلى LLM تنظيم كل خطوة. ينقل Lobster ذلك التنظيم إلى وقت تشغيل مضبوط بالأنواع:

- **استدعاء واحد بدلًا من كثير**: يشغّل OpenClaw استدعاء أداة Lobster واحدًا ويحصل على نتيجة منظمة.
- **الموافقات مدمجة**: توقف الآثار الجانبية (إرسال بريد إلكتروني، نشر تعليق) سير العمل حتى تتم الموافقة عليها صراحة.
- **قابل للاستئناف**: تعيد سير العمل المتوقفة رمزًا؛ وافق واستأنف دون إعادة تشغيل كل شيء.

## لماذا DSL بدلًا من برامج عادية؟

Lobster صغير عن قصد. الهدف ليس "لغة جديدة"، بل مواصفة خط معالجة متوقعة وملائمة للذكاء الاصطناعي، مع موافقات ورموز استئناف من الدرجة الأولى.

- **الموافقة/الاستئناف مدمجان**: يمكن لبرنامج عادي أن يطلب من إنسان إدخالًا، لكنه لا يستطيع _الإيقاف المؤقت والاستئناف_ برمز دائم دون أن تخترع وقت التشغيل هذا بنفسك.
- **الحتمية + قابلية التدقيق**: خطوط المعالجة بيانات، لذلك يسهل تسجيلها، ومقارنتها، وإعادة تشغيلها، ومراجعتها.
- **سطح مقيّد للذكاء الاصطناعي**: قواعد صغيرة + تمرير JSON يقللان مسارات الشيفرة "الإبداعية" ويجعلان التحقق واقعيًا.
- **سياسة الأمان مدمجة**: يفرض وقت التشغيل حدود الوقت، وسقوف المخرجات، وفحوصات صندوق العزل، وقوائم السماح، وليس كل سكربت على حدة.
- **ما زال قابلًا للبرمجة**: يمكن لكل خطوة استدعاء أي CLI أو سكربت. إذا أردت JS/TS، أنشئ ملفات `.lobster` من الشيفرة.

## كيف يعمل

يشغّل OpenClaw سير عمل Lobster **داخل العملية** باستخدام مشغّل مضمّن. لا يتم إنشاء عملية CLI فرعية خارجية؛ ينفذ محرك سير العمل داخل عملية Gateway ويعيد غلاف JSON مباشرة.
إذا توقف خط المعالجة مؤقتًا طلبًا للموافقة، تعيد الأداة `resumeToken` حتى تتمكن من المتابعة لاحقًا.

## النمط: CLI صغير + أنابيب JSON + موافقات

ابنِ أوامر صغيرة تتحدث JSON، ثم اربطها في استدعاء Lobster واحد. (أسماء الأوامر في المثال أدناه - استبدل بها أسماءك.)

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

إذا طلب خط المعالجة الموافقة، فاستأنف بالرمز:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

يشغّل الذكاء الاصطناعي سير العمل؛ وينفذ Lobster الخطوات. تجعل بوابات الموافقة الآثار الجانبية صريحة وقابلة للتدقيق.

مثال: تحويل عناصر الإدخال إلى استدعاءات أدوات:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## خطوات LLM المعتمدة على JSON فقط (llm-task)

لسير العمل التي تحتاج إلى **خطوة LLM منظمة**، فعّل أداة Plugin الاختيارية
`llm-task` واستدعها من Lobster. يحافظ هذا على حتمية سير العمل
مع السماح لك في الوقت نفسه بالتصنيف/التلخيص/الصياغة باستخدام نموذج.

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

### قيد مهم: Lobster المضمّن مقابل `openclaw.invoke`

يشغّل Plugin Lobster المرفق سير العمل **داخل العملية** داخل Gateway. في ذلك الوضع المضمّن، لا يرث `openclaw.invoke` تلقائيًا سياق عنوان URL/المصادقة الخاص بـ Gateway لاستدعاءات أدوات OpenClaw CLI المتداخلة.

يعني ذلك أن هذا النمط **غير موثوق حاليًا في المشغّل المضمّن**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

استخدم المثال أدناه فقط عند تشغيل **Lobster CLI المستقل** في بيئة يكون فيها `openclaw.invoke` مضبوطًا مسبقًا بسياق Gateway/المصادقة الصحيح.

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

إذا كنت تستخدم Plugin Lobster المضمّن اليوم، ففضّل أحد الخيارين:

- استدعاء أداة `llm-task` مباشر خارج Lobster، أو
- خطوات غير `openclaw.invoke` داخل خط معالجة Lobster حتى تتم إضافة جسر مضمّن مدعوم.

راجع [مهمة LLM](/ar/tools/llm-task) للحصول على التفاصيل وخيارات الإعداد.

## ملفات سير العمل (.lobster)

يمكن لـ Lobster تشغيل ملفات سير عمل YAML/JSON تتضمن حقول `name`، و`args`، و`steps`، و`env`، و`condition`، و`approval`. في استدعاءات أدوات OpenClaw، عيّن `pipeline` إلى مسار الملف.

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
- يمكن لـ `condition` (أو `when`) تقييد الخطوات بناءً على `$step.approved`.

## تثبيت Lobster

تعمل سير عمل Lobster المرفقة داخل العملية؛ ولا يلزم ملف ثنائي `lobster` منفصل. يأتي المشغّل المضمّن مع Plugin Lobster.

إذا احتجت إلى Lobster CLI المستقل للتطوير أو لخطوط معالجة خارجية، فثبته من [مستودع Lobster](https://github.com/openclaw/lobster) وتأكد من وجود `lobster` على `PATH`.

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

تجنب استخدام `tools.allow: ["lobster"]` ما لم تكن تنوي التشغيل في وضع قائمة سماح تقييدية.

<Note>
قوائم السماح اختيارية التفعيل للـ Plugins الاختيارية. يفعّل `alsoAllow` أدوات Plugin الاختيارية المسماة فقط مع الحفاظ على مجموعة أدوات النواة العادية. لتقييد أدوات النواة، استخدم `tools.allow` مع أدوات النواة أو المجموعات التي تريدها.
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

يوافق المستخدم ← الاستئناف:

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

شغّل خط معالجة في وضع الأداة.

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

- `cwd`: دليل العمل النسبي لخط المعالجة (يجب أن يبقى داخل دليل عمل Gateway).
- `timeoutMs`: أوقف سير العمل إذا تجاوز هذه المدة (الافتراضي: 20000).
- `maxStdoutBytes`: أوقف سير العمل إذا تجاوزت المخرجات هذا الحجم (الافتراضي: 512000).
- `argsJson`: سلسلة JSON تُمرر إلى `lobster run --args-json` (ملفات سير العمل فقط).

## غلاف المخرجات

يعيد Lobster غلاف JSON بإحدى ثلاث حالات:

- `ok` → اكتمل بنجاح
- `needs_approval` → متوقف مؤقتًا؛ يلزم `requiresApproval.resumeToken` للاستئناف
- `cancelled` → مرفوض أو ملغى صراحة

تعرض الأداة الغلاف في كل من `content` (JSON منسق) و`details` (كائن خام).

## الموافقات

إذا كان `requiresApproval` موجودًا، فافحص المطالبة وقرر:

- `approve: true` → الاستئناف ومتابعة الآثار الجانبية
- `approve: false` → الإلغاء وإنهاء سير العمل

استخدم `approve --preview-from-stdin --limit N` لإرفاق معاينة JSON بطلبات الموافقة دون ربط jq/heredoc مخصص. أصبحت رموز الاستئناف مضغوطة الآن: يخزّن Lobster حالة استئناف سير العمل ضمن دليل حالته ويعيد مفتاح رمز صغيرًا.

## OpenProse

يتكامل OpenProse جيدًا مع Lobster: استخدم `/prose` لتنظيم التحضير متعدد الوكلاء، ثم شغّل خط معالجة Lobster للحصول على موافقات حتمية. إذا احتاج برنامج Prose إلى Lobster، فاسمح بأداة `lobster` للوكلاء الفرعيين عبر `tools.subagents.tools`. راجع [OpenProse](/ar/prose).

## السلامة

- **محلي وداخل العملية فقط** - تنفذ سير العمل داخل عملية Gateway؛ ولا يجري Plugin نفسه أي استدعاءات شبكة.
- **لا أسرار** - لا يدير Lobster OAuth؛ بل يستدعي أدوات OpenClaw التي تفعل ذلك.
- **واعٍ بصندوق العزل** - يعطّل عندما يكون سياق الأداة داخل صندوق عزل.
- **مقوّى** - يفرض المشغّل المضمّن حدود الوقت وسقوف المخرجات.

## استكشاف الأخطاء وإصلاحها

- **`lobster timed out`** → زد `timeoutMs`، أو قسّم خط معالجة طويلًا.
- **`lobster output exceeded maxStdoutBytes`** → ارفع `maxStdoutBytes` أو قلل حجم المخرجات.
- **`lobster returned invalid JSON`** → تأكد من أن خط المعالجة يعمل في وضع الأداة ولا يطبع إلا JSON.
- **`lobster failed`** → تحقق من سجلات Gateway للحصول على تفاصيل خطأ المشغّل المضمّن.

## تعلّم المزيد

- [Plugins](/ar/tools/plugin)
- [تأليف أدوات Plugin](/ar/plugins/building-plugins#registering-agent-tools)

## دراسة حالة: سير عمل المجتمع

مثال عام واحد: CLI "عقل ثانٍ" + خطوط معالجة Lobster تدير ثلاثة مخازن Markdown (شخصي، وشريك، ومشترك). يصدر CLI بيانات JSON للإحصاءات، وقوائم صندوق الوارد، وعمليات فحص العناصر القديمة؛ ويربط Lobster تلك الأوامر في سير عمل مثل `weekly-review`، و`inbox-triage`، و`memory-consolidation`، و`shared-task-sync`، وكل منها يتضمن بوابات موافقة. يتولى الذكاء الاصطناعي الحكم (التصنيف) عند توفره، ويعود إلى قواعد حتمية عند عدم توفره.

- الموضوع: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- المستودع: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ذات صلة

- [الأتمتة والمهام](/ar/automation) - جدولة سير عمل Lobster
- [نظرة عامة على الأتمتة](/ar/automation) - جميع آليات الأتمتة
- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكيل المتاحة
