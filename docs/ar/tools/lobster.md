---
read_when:
    - تريد تدفقات عمل حتمية متعددة الخطوات بموافقات صريحة
    - تحتاج إلى استئناف سير عمل من دون إعادة تنفيذ الخطوات السابقة
summary: بيئة تشغيل لسير عمل ذي أنواع محددة لـ OpenClaw مع بوابات موافقة قابلة للاستئناف.
title: الكركند
x-i18n:
    generated_at: "2026-07-12T06:43:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

يشغّل Lobster مسارات أدوات متعددة الخطوات بوصفها استدعاء أداة واحدًا حتميًا، مع
نقاط تحقق صريحة للموافقة ورموز استئناف. ويعمل في طبقة أعلى من
العمل المنفصل في الخلفية: لتنسيق التدفقات عبر العديد من المهام المنفصلة،
راجع [تدفق المهام](/ar/automation/taskflow) (`openclaw tasks flow`)؛ ولسجل
نشاط المهام، راجع [مهام الخلفية](/ar/automation/tasks).

## لماذا

من دون Lobster، تتطلب المهمة متعددة الخطوات العديد من استدعاءات الأدوات ذهابًا وإيابًا،
مع تولّي النموذج تنسيق كل خطوة. ينقل Lobster هذا التنسيق إلى بيئة تشغيل
محددة الأنواع:

- **استدعاء واحد بدلًا من عدة استدعاءات**: يعيد استدعاء أداة Lobster واحد نتيجة
  منظّمة للمسار بأكمله.
- **الموافقات مضمّنة**: توقف الآثار الجانبية (الإرسال، النشر، الحذف) سير العمل
  حتى تتم الموافقة عليها صراحةً.
- **قابل للاستئناف**: يعيد سير العمل المتوقف رمزًا؛ وافق واستأنف من دون
  إعادة تشغيل الخطوات السابقة.

Lobster لغة DSL صغيرة ومقيّدة وليست لغة برمجة نصية عامة:
الموافقة/الاستئناف آلية أساسية دائمة ومدمجة؛ والمسارات بيانات (يسهل
تسجيلها، ومقارنة اختلافاتها، وإعادة تشغيلها، ومراجعتها)؛ وتحد القواعد النحوية الصغيرة مسارات الشيفرة
«الإبداعية» كي يظل التحقق واقعيًا؛ وتفرض بيئة التشغيل المهل الزمنية، وحدود المخرجات،
وفحوصات صندوق العزل، وقوائم السماح، بدلًا من أن يفرضها كل برنامج نصي. ومع ذلك، يمكن لكل خطوة
استدعاء أي CLI أو برنامج نصي — أنشئ ملفات `.lobster` من أدوات أخرى إذا كنت
تريد لغة تأليف أكثر ثراءً.

من دون Lobster، تبدو عملية الفرز المتكررة للبريد الإلكتروني كما يلي:

```text
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

باستخدام Lobster، تصبح المهمة نفسها استدعاءً واحدًا يتوقف للموافقة ثم يُستأنف:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

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

## كيفية عمله

يشغّل OpenClaw مسارات عمل Lobster **داخل العملية** باستخدام حزمة
`@clawdbot/lobster` المضمّنة بوصفها مشغّلًا مضمّنًا. لا تُنشأ عملية فرعية خارجية لـ `lobster`؛
بل يعيد استدعاء الأداة غلاف JSON مباشرةً. إذا توقف المسار للموافقة،
يحمل الغلاف رمز استئناف (أو معرّف موافقة قصيرًا) حتى تتمكن من المتابعة لاحقًا.

## التفعيل

Lobster أداة Plugin **اختيارية**، ولا تكون مفعّلة افتراضيًا. وهي تأتي
مضمّنة، لذلك لا يلزم إجراء تثبيت منفصل — ما عليك سوى السماح بالأداة:

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

<Note>
تضيف `alsoAllow` الأداة `lobster` فوق ملف تعريف الأدوات النشط من دون
تقييد أدوات النواة الأخرى. استخدم `tools.allow` فقط إذا كنت تريد وضع
قائمة سماح مقيّدة بدلًا من ذلك.
</Note>

تُعطّل الأداة بالكامل في سياقات الأدوات المعزولة.

إذا كنت تحتاج إلى CLI المستقل لـ Lobster لأغراض التطوير أو المسارات الخارجية
(خارج مشغّل Gateway المضمّن)، فثبّته من
[مستودع Lobster](https://github.com/openclaw/lobster) وضع `lobster` ضمن
`PATH`.

## النمط: CLI صغير + أنابيب JSON + موافقات

أنشئ أوامر صغيرة تتعامل باستخدام JSON، ثم اربطها في استدعاء Lobster واحد.
(أسماء الأوامر أدناه أمثلة — استبدلها بأوامرك.)

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

إذا طلب المسار موافقة، فاستأنفه باستخدام الرمز:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

مثال: تحويل عناصر الإدخال إلى استدعاءات أدوات:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## خطوات LLM باستخدام JSON فقط (llm-task)

لإضافة **خطوة LLM منظّمة** داخل سير عمل، فعّل أداة Plugin الاختيارية
`llm-task` واستدعها من Lobster:

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

يشغّل Plugin المضمّن لـ Lobster مسارات العمل **داخل العملية** ضمن Gateway.
في هذا الوضع المضمّن، لا يرث `openclaw.invoke` تلقائيًا
سياق عنوان URL لـ Gateway/المصادقة لاستدعاءات أدوات CLI المتداخلة في OpenClaw.

يعني ذلك أن هذا النمط **غير موثوق حاليًا في المشغّل المضمّن**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

استخدم المثال أدناه فقط عند تشغيل **CLI المستقل لـ Lobster** في
بيئة يكون فيها `openclaw.invoke` مهيّأ بالفعل باستخدام سياق
Gateway/المصادقة الصحيح.

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

إذا كنت تستخدم Plugin المضمّن لـ Lobster حاليًا، ففضّل أحد الخيارين:

- استدعاء أداة `llm-task` مباشرةً خارج Lobster، أو
- استخدام خطوات لا تعتمد على `openclaw.invoke` داخل مسار Lobster حتى تُضاف
  وصلة مضمّنة مدعومة.

راجع [مهمة LLM](/ar/tools/llm-task) للاطلاع على التفاصيل وخيارات الإعداد.

## ملفات سير العمل (.lobster)

يمكن لـ Lobster تشغيل ملفات سير عمل YAML/JSON تحتوي على الحقول `name` و`args` و`steps` و`env`
و`condition` و`approval`. اضبط `pipeline` على مسار الملف في استدعاء
الأداة.

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

- يمرّر `stdin: $step.stdout` و`stdin: $step.json` مخرجات خطوة سابقة.
- يمكن لـ `condition` (أو `when`) التحكم في تشغيل الخطوات استنادًا إلى `$step.approved`.

## معاملات الأداة

### `run`

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

| الحقل            | القيمة الافتراضية     | ملاحظات                                                                                                        |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | مطلوب    | سلسلة مسار مضمّنة، أو مسار ينتهي بـ `.lobster`/`.yaml`/`.yml`/`.json` لملف سير عمل.           |
| `cwd`            | دليل عمل Gateway | دليل عمل نسبي؛ يجب أن يُحل داخل دليل عمل Gateway (تُرفض المسارات المطلقة). |
| `timeoutMs`      | `20000`     | يُجهض التشغيل إذا تجاوز هذه المدة.                                                                                  |
| `maxStdoutBytes` | `512000`    | يُجهض التشغيل إذا تجاوزت مخرجات stdout أو stderr الملتقطة هذا الحجم.                                               |
| `argsJson`       | -           | سلسلة JSON للوسائط الخاصة بملف سير العمل (تُتجاهل في المسارات المضمّنة).                                      |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

يقبل `resume` إما `token` (رمز الاستئناف الكامل من `requiresApproval`)
أو `approvalId` (المعرّف القصير من الكائن نفسه) — استخدم ما أعاده
التشغيل المتوقف. المعامل `approve` مطلوب.

### وضع تدفق المهام المُدار

يؤدي تمرير `flowControllerId` و`flowGoal` مع `run` (أو `flowId` و
`flowExpectedRevision` مع `resume`) إلى توجيه الاستدعاء عبر واجهة API المُدارة لـ
[تدفق المهام](/ar/automation/taskflow) في بيئة تشغيل Plugin بدلًا من إعادة
غلاف مجرد: ينشئ OpenClaw سجل تدفق دائمًا أو يستأنفه، ويطبّق
غلاف Lobster عليه (`waiting` عند انتظار الموافقة، و`succeeded`/`failed` عند
الاكتمال)، ويعيد `{ ok, envelope, flow, mutation }`. يتطلب هذا الوضع
بيئة تشغيل مرتبطة لتدفق المهام، وهو مخصص لشيفرة Plugin/وحدة التحكم التي تحتاج
إلى حالة تدفق دائمة عبر عمليات إعادة تشغيل Gateway، وليس للاستخدام العرضي المعتاد من الوكلاء.

## غلاف المخرجات

يعيد Lobster غلاف JSON بإحدى ثلاث حالات:

- `ok` — اكتمل بنجاح
- `needs_approval` — متوقف مؤقتًا؛ يحمل `requiresApproval` رمز `resumeToken` و
  معرّف `approvalId` قصيرًا، ويمكن استخدام أي منهما لاستئناف التشغيل
- `cancelled` — رُفض أو أُلغي صراحةً

تعرض الأداة الغلاف في كل من `content` (JSON منسّق) و`details`
(الكائن الخام).

## الموافقات

إذا كان `requiresApproval` موجودًا، فافحص الموجّه وقرّر:

- `approve: true` — الاستئناف ومتابعة الآثار الجانبية
- `approve: false` — الإلغاء وإنهاء سير العمل

استخدم `approve --preview-from-stdin --limit N` لإرفاق معاينة JSON
بطلبات الموافقة من دون شيفرة jq/heredoc مخصصة. تُخزّن حالة الاستئناف في
ملفات JSON صغيرة ضمن دليل حالة Lobster (`~/.lobster/state` افتراضيًا،
ويمكن تجاوزه باستخدام `LOBSTER_STATE_DIR`)؛ ولا يشفّر الرمز نفسه سوى
مؤشر إلى تلك الحالة، وليس حالة المسار كاملةً.

## OpenProse

يتكامل OpenProse جيدًا مع Lobster: استخدم `/prose` لتنسيق التحضير متعدد الوكلاء،
ثم شغّل مسار Lobster للحصول على موافقات حتمية. إذا احتاج برنامج Prose
إلى Lobster، فاسمح بأداة `lobster` للوكلاء الفرعيين عبر
`tools.subagents.tools`. راجع [OpenProse](/ar/prose).

## السلامة

- **محلي وداخل العملية فقط** — تُنفّذ مسارات العمل داخل عملية Gateway؛ ولا يُجري
  Plugin نفسه أي استدعاءات شبكة.
- **من دون أسرار** — لا يدير Lobster بروتوكول OAuth؛ بل يستدعي أدوات OpenClaw التي
  تتولى ذلك.
- **مدرك لصندوق العزل** — يُعطّل عندما يكون سياق الأداة معزولًا.
- **محصّن** — يفرض المشغّل المضمّن المهل الزمنية وحدود المخرجات.

## استكشاف الأخطاء وإصلاحها

| الخطأ                                                         | السبب / الإصلاح                                                                      |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | تجاوز المسار `timeoutMs`. زد القيمة أو قسّم المسار.                |
| `lobster stdout exceeded maxStdoutBytes` (أو `stderr`)        | تجاوزت المخرجات الملتقطة الحد. زد `maxStdoutBytes` أو قلّل المخرجات.       |
| `run --args-json must be valid JSON`                          | تعذّر تحليل `argsJson` (عند تشغيل ملفات سير العمل). أصلح سلسلة JSON.            |
| `lobster runtime failed` (أو رسالة `runtime_error` أخرى) | أعادت بيئة التشغيل المضمّنة غلاف خطأ. راجع سجلات Gateway للحصول على التفاصيل. |

## معرفة المزيد

- [Plugins](/ar/tools/plugin)
- [تأليف أدوات Plugin](/ar/plugins/building-plugins#registering-agent-tools)

## دراسة حالة: مسارات عمل المجتمع

مثال عام: CLI لـ«دماغ ثانٍ» مع مسارات Lobster تدير ثلاثة مستودعات Markdown (شخصي، وللشريك، ومشترك). يُخرج CLI بيانات JSON للإحصاءات، وقوائم صندوق الوارد، وعمليات البحث عن العناصر القديمة؛ ويربط Lobster هذه الأوامر في تدفقات عمل مثل `weekly-review` و`inbox-triage` و`memory-consolidation` و`shared-task-sync`، ولكل منها بوابات موافقة. يتولى الذكاء الاصطناعي اتخاذ القرارات (التصنيف) عند توفره، ويعود إلى قواعد حتمية عند عدم توفره.

- سلسلة المنشورات: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- المستودع: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## ذو صلة

- [الأتمتة](/ar/automation) - جميع آليات الأتمتة
- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكيل المتاحة
