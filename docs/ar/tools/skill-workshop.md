---
read_when:
    - تريد من الوكيل إنشاء مهارة أو تحديثها من الدردشة
    - تحتاج إلى مراجعة مسودة Skills مُنشأة أو تطبيقها أو رفضها أو عزلها.
    - أنت تضبط إعدادات الموافقة أو الاستقلالية أو التخزين أو الحدود في ورشة Skills
sidebarTitle: Skill Workshop
summary: إنشاء مهارات مساحة العمل وتحديثها عبر مراجعة ورشة عمل Skills
title: ورشة عمل Skills
x-i18n:
    generated_at: "2026-07-12T06:44:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

ورشة Skills هي المسار الخاضع للحوكمة في OpenClaw لإنشاء Skills مساحة العمل وتحديثها. لا يكتب الوكلاء والمشغّلون ملف `SKILL.md` مباشرةً عبر هذا المسار مطلقًا — بل ينشئون **مقترحًا** (مسودة معلّقة تتضمن المحتوى، وارتباط الهدف، وحالة الماسح، والتجزئات، وبيانات التراجع الوصفية) لا يصبح Skill فعّالة إلا عند تطبيقه.

تكتب ورشة Skills في Skills مساحة العمل فقط. ولا تمس مطلقًا Skills المضمّنة، أو التابعة لـ Plugin، أو ClawHub، أو الموجودة في جذور إضافية، أو المُدارة، أو الخاصة بالوكيل الشخصي، أو الخاصة بالنظام.

## آلية العمل

- **المقترح أولًا:** يُخزَّن المحتوى المُنشأ باسم `PROPOSAL.md`، لا باسم
  `SKILL.md`.
- **التطبيق هو عملية الكتابة الفعلية الوحيدة:** لا تؤدي عمليات الإنشاء والتحديث والمراجعة مطلقًا إلى تغيير
  Skills النشطة.
- **مقيّدة بمساحة العمل:** تستهدف عمليات الإنشاء جذر `skills/` في مساحة العمل؛ ولا يُسمح
  بالتحديثات إلا لـ Skills مساحة العمل القابلة للكتابة.
- **لا استبدال قسري:** يفشل الإنشاء إذا كانت Skill المستهدفة موجودة بالفعل.
- **مرتبطة بالتجزئة:** ترتبط مقترحات التحديث بالتجزئة الحالية للهدف وتصبح
  `stale` إذا تغيّرت Skill الفعّالة قبل التطبيق.
- **مقيّدة بالماسح:** يعيد التطبيق تشغيل ماسح الأمان قبل الكتابة.
- **قابلة للاسترداد:** يكتب التطبيق بيانات التراجع الوصفية قبل لمس الملفات الفعّالة.
- **واجهات متسقة:** تستدعي الدردشة وCLI وGateway الخدمة نفسها.

## دورة الحياة

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

لا يمكن مراجعة المقترح أو تطبيقه أو رفضه أو عزله إلا إذا كان `pending`.

## تنظيم دورة الحياة

يتتبع Gateway الاستخدام الإجمالي لـ Skills في قاعدة بيانات الحالة المشتركة. ويراجع مرة
يوميًا Skills التي أنشأتها وطبّقتها ورشة Skills. تصبح Skills غير المستخدمة لأكثر من
30 يومًا `stale`؛ وبعد 90 يومًا تصبح `archived` وتُستبعد
من لقطات Skills الجديدة للوكلاء. تظل ملفات Skills المؤرشفة دون تغيير على
القرص. لا تخضع Skills المؤلفة يدويًا للتنظيم مطلقًا؛ وحدها Skills المنشأة بواسطة مقترحات ورشة
Skills تدخل في تنظيم دورة الحياة.

تتجاوز Skills المثبّتة انتقالات دورة الحياة. وتعود Skill ذات الحالة `stale` إلى `active`
بعد استخدامها وتشغيل عملية الفحص الدورية التالية. ولا تعود Skills المؤرشفة إلا من خلال
استعادة صريحة:

تنطبق انتقالات دورة الحياة وعمليات الاستعادة على الجلسات الجديدة؛ وتحتفظ الجلسات الجارية
بلقطة Skills الحالية لديها.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

تقبل جميع أوامر التنظيم `--json`. كما تعرض الحالة مرشحي التداخل الحتميين
على هيئة اقتراحات فقط؛ ولا تدمج Skills أو تستدعي نموذجًا مطلقًا.

## الدردشة

اطلب من الوكيل Skill التي تريدها؛ وسيستدعي `skill_workshop` ويعيد
معرّف مقترح.

### التعلّم من العمل الحديث

استخدم `/learn` لتحويل المحادثة الحالية أو المصادر المسماة إلى مقترح Skill واحد
موجّه بالمعايير:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

عند عدم وجود طلب، يطلب `/learn` من الوكيل استخلاص سير العمل القابل لإعادة الاستخدام من
المحادثة الحالية. وعند وجود طلب، يتعامل الوكيل مع المسارات وعناوين URL والملاحظات الملصقة
ومراجع المحادثة كمصادر، مع الالتزام بمتطلبات التركيز والنطاق
والتسمية. ويجمع المصادر باستخدام أدواته الحالية، ثم يستدعي
`skill_workshop` مع `action: "create"`.

يبقى المقترح الناتج `pending`؛ ولا يطبّقه `/learn` مطلقًا. راجعه
وطبّقه من خلال مسار الموافقة المعتاد أو باستخدام `openclaw skills workshop`.

الإنشاء:

```text
أنشئ Skill باسم morning-catchup لتشغيل روتين بريدي الوارد يوم الاثنين.
```

تحديث Skill موجودة في مساحة العمل:

```text
حدّث trip-planning ليتحقق أيضًا من خرائط المقاعد قبل الحجز.
```

التكرار على مقترح معلّق:

```text
اعرض لي مقترح morning-catchup.
راجعه ليضع أيضًا علامة على أي شيء موسوم بأنه عاجل.
طبّق مقترح morning-catchup.
```

تعرض عمليات `apply` و`reject` و`quarantine` التي يبدأها الوكيل مطالبة موافقة
افتراضيًا. اضبط `skills.workshop.approvalPolicy` على `"auto"` لتجاوزها في
البيئات الموثوقة.

تحدد المطالبة معرّف المقترح وSkill المستهدفة، وتعرض وصف المقترح
وعدد ملفات الدعم وحجم المتن. تُقيَّد طلبات الموافقة
كي تنتهي قبل مهلة مراقب أداة الوكيل. إذا لم يصل قرار قبل
انتهاء صلاحية المطالبة، فلن يُنفَّذ إجراء دورة الحياة: يبقى المقترح معلّقًا
ودون تغيير. اتخذ القرار لاحقًا في واجهة ورشة Skills أو شغّل
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. ينبغي للوكلاء
ألا يعيدوا محاولة إجراء دورة حياة منتهي الصلاحية ضمن حلقة.

## CLI

```bash
# Create
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md

# Update an existing workspace skill
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# List and inspect
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revise before approval
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Close out
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

يقبل كل أمر فرعي `--agent <id>` (مساحة العمل المستهدفة؛ وتكون افتراضيًا
المستنتجة من دليل العمل الحالي، ثم الوكيل الافتراضي) و`--json` (إخراج منظم).
كما تقبل `propose-create` و`propose-update` و`revise` الخيارين `--goal <text>` و
`--evidence <text>` لتسجيل سياق المقترح إلى جانب `--proposal`.

## محتوى المقترح

أثناء التعليق، يُخزَّن المقترح باسم `PROPOSAL.md` مع بيانات أمامية خاصة
بالمقترح فقط:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

عند التطبيق، تكتب ورشة Skills ملف `SKILL.md` الفعّال وتزيل
الحقول الخاصة بالمقترح فقط: `status` و`version` الخاصة بالمقترح و`date` الخاصة بالمقترح.

## ملفات الدعم

استخدم `--proposal-dir` عندما تحتاج Skill المقترحة إلى ملفات بجانب
`PROPOSAL.md`:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

يجب أن يحتوي الدليل على `PROPOSAL.md`. ويجب أن توجد ملفات الدعم ضمن
`assets/` أو `examples/` أو `references/` أو `scripts/` أو `templates/`. تفحص ورشة
Skills هذه الملفات وتحسب تجزئاتها وتخزنها مع المقترح، ثم تكتبها
بجوار ملف `SKILL.md` الفعّال عند التطبيق فقط.

مسارات ملفات الدعم المرفوضة: المسارات المطلقة، ومقاطع المسار المخفية، واجتياز
المسارات، والمسارات المتداخلة، والملفات القابلة للتنفيذ، والنصوص غير المشفرة بـ UTF-8، والبايتات الفارغة،
والمسارات الواقعة خارج مجلدات الدعم القياسية.

## أداة الوكيل

يستخدم النموذج `skill_workshop` مع `action` واحد مطلوب:
`create | update | revise | list | inspect | apply | reject | quarantine`.
تنطبق المعلمات الأخرى بحسب الإجراء:

| المعلمة                    | تستخدمها                                              | ملاحظات                                                                |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | مطلوبة لـ `create`؛ وفي غير ذلك تحل مقترحًا معلّقًا حسب الاسم |
| `description`              | `create`, `update`, `revise`                         | 160 بايت كحد أقصى                                                        |
| `skill_name`               | `update`                                             | اسم Skill موجودة أو مفتاحها                                           |
| `proposal_content`         | `create`, `update`, `revise`                         | يُخزَّن باسم `PROPOSAL.md`؛ ويحدّه `skills.workshop.maxSkillBytes`   |
| `support_files`            | `create`, `update`, `revise`                         | مصفوفة من `{ path, content }`                                         |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | سياق نصي حر                                                    |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | المقترح المستهدف                                                      |
| `reason`                   | `apply`, `reject`, `quarantine`                      | اختياري                                                             |
| `query`, `status`, `limit` | `list`                                               | التصفية/التقسيم إلى صفحات؛ الحد الأقصى لـ `limit` هو 50، والافتراضي 20                          |

يجب على الوكلاء استخدام `skill_workshop` لأعمال Skills المُنشأة. ويجب ألا
ينشئوا ملفات المقترحات أو يغيروها عبر `write` أو `edit` أو `exec` أو أوامر
الصدفة أو عمليات نظام الملفات المباشرة.

<Note>
`skill_workshop` أداة وكيل مضمّنة، وهي مشمولة في
`tools.profile: "coding"`. إذا أخفتها سياسة أكثر صرامة، فأضف
`skill_workshop` إلى قائمة `tools.allow` النشطة، أو استخدم
`tools.alsoAllow: ["skill_workshop"]` عندما يستخدم النطاق ملفًا تعريفيًا دون
`tools.allow` صريحة. لا تنشئ عمليات التشغيل المعزولة أداة ورشة
Skills من جانب المضيف، لذا شغّل إجراءات مراجعة المقترحات من جلسة وكيل عادية
على جانب المضيف أو من خلال CLI.
</Note>

## Skills المقترحة

يكتشف OpenClaw التعليمات الدائمة مثل «في المرة القادمة» و«تذكّر أن»، والتصحيحات التفاعلية
عند انتهاء دور تفاعلي، بما في ذلك الأدوار الفاشلة. في الدور التالي، يعرض الوكيل حفظ
أحدث سير عمل مكتشف عبر `skill_workshop`؛ ويقرر المستخدم ما إذا كان سينشئ
مقترحًا. لا ينشئ هذا الاقتراح المضمّن Skill أو يغيرها من تلقاء نفسه. فعّل
`skills.workshop.autonomous.enabled` لإنشاء مقترحات معلّقة مباشرةً بدلًا من ذلك.

## الموافقة والاستقلالية

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| الإعداد                    | القيمة الافتراضية     | التأثير                                                                                                                                                                 |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | ينشئ مقترحات معلّقة مباشرةً بدلًا من عرض أحدث سير عمل مكتشف في الدور التالي.                                                             |
| `allowSymlinkTargetWrites` | `false`     | يسمح للتطبيق بالكتابة عبر الروابط الرمزية لـ Skills مساحة العمل التي يكون هدفها الحقيقي مدرجًا في `skills.load.allowSymlinkTargets`.                                                    |
| `approvalPolicy`           | `"pending"` | تتطلب `"pending"` مطالبة موافقة قبل عمليات `apply` أو `reject` أو `quarantine` التي يبدأها الوكيل. وتتجاوز `"auto"` المطالبة (مع بقاء ضرورة أن يستدعي الوكيل الإجراء). |
| `maxPending`               | `50`        | يحدّ المقترحات المعلّقة والمعزولة لكل مساحة عمل (1-200).                                                                                                          |
| `maxSkillBytes`            | `40000`     | يحدّ حجم متن المقترح بالبايت (1024-200000).                                                                                                                        |

يتعرف الالتقاط المستقل على القواعد المستقبلية (مثل «من الآن فصاعدًا») والتصحيحات
التفاعلية (مثل «هذا ليس ما طلبته»). ويجمع التعليمات الجديدة حسب الموضوع في ما يصل
إلى ثلاثة مقترحات لكل دور، ويوجّه مطابقات المفردات إلى Skills مساحة العمل الحالية القابلة للكتابة، كما
يراجع مقترحه المعلّق عندما يستهدف تصحيح آخر Skill نفسها.

تظل أوصاف المقترحات محدودة دائمًا بـ160 بايت، بصرف النظر عن
`maxSkillBytes`.

## أساليب Gateway

| الطريقة                            | النطاق           |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

يتوفر `requestRevision` عبر Gateway فقط (ولا يوجد مكافئ له في CLI أو أداة الوكيل): إذ
يمرّر تعليمات المراجعة ذات النص الحر إلى جلسة دردشة الوكيل المالك
بدلاً من استبدال `PROPOSAL.md` مباشرةً، وذلك لواجهات المستخدم التي تطلب من الوكيل
إجراء مراجعة بدلاً من إرسال محتوى جديد حرفيًا.

## التخزين

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

دليل الحالة الافتراضي: `~/.openclaw`.

- `proposal.json`: سجل الاقتراح المعتمد.
- `proposals.json`: فهرس سريع لعرض القائمة، ويمكن إعادة إنشائه من مجلدات الاقتراحات.
- `PROPOSAL.md`: اقتراح Skill معلّق.
- `rollback.json`: بيانات وصفية للاسترداد تُكتب قبل أن تطبّق التغييرات على الملفات الفعلية.

## الحدود

| الحد                             | القيمة                                                                      |
| ------------------------------- | --------------------------------------------------------------------------- |
| الوصف                           | 160 بايت                                                                    |
| نص الاقتراح                     | `skills.workshop.maxSkillBytes` (الافتراضي 40,000؛ الحد الأقصى الثابت 1 MiB) |
| الملفات الداعمة                 | 64 لكل اقتراح                                                               |
| حجم الملف الداعم                | 256 KiB لكل ملف، و2 MiB إجمالاً                                              |
| الاقتراحات المعلّقة + المعزولة | `skills.workshop.maxPending` لكل مساحة عمل (الافتراضي 50)                    |

## استكشاف الأخطاء وإصلاحها

| المشكلة                                       | الحل                                                                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`     | اختصر `description` إلى 160 بايت أو أقل.                                                                                                                                                                                  |
| `Skill proposal content is too large`         | اختصر نص الاقتراح أو ارفع قيمة `skills.workshop.maxSkillBytes`.                                                                                                                                                           |
| `Target skill changed after proposal creation` | راجع الاقتراح وفقًا للهدف الحالي، أو أنشئ اقتراحًا جديدًا.                                                                                                                                                                |
| `Proposal scan failed`                        | افحص نتائج الماسح، ثم راجع الاقتراح أو اعزله.                                                                                                                                                                             |
| `untrusted symlink target`                    | اضبط `skills.load.allowSymlinkTargets` وفعّل `skills.workshop.allowSymlinkTargetWrites` فقط لجذور Skills المشتركة المقصودة.                                                                                                |
| `Support file paths must be under one of...`  | انقل الملفات الداعمة إلى أحد الأدلة: `assets/` أو `examples/` أو `references/` أو `scripts/` أو `templates/`.                                                                                                             |
| لا يظهر الاقتراح في القائمة                   | تحقّق من مساحة العمل المحددة بواسطة `--agent` ومن `OPENCLAW_STATE_DIR`.                                                                                                                                                    |
| لا يستطيع الوكيل استدعاء `skill_workshop`     | تحقّق من سياسة الأدوات النشطة ووضع التشغيل. يتضمن `coding` الأداة؛ ويجب أن تدرجها سياسات `tools.allow` المقيّدة صراحةً، كما يجب أن تستخدم عمليات التشغيل المعزولة جلسة وكيل عادية من جانب المضيف أو CLI. |

### تشخيص سياسة الأدوات

عند تمكين الالتقاط المستقل، يشغّل `openclaw doctor` فحص
`core/doctor/skill-workshop-tool-policy` للوكيل الافتراضي. إذا كانت السياسة
تخفي `skill_workshop`، فإن التحذير يسمّي أول طبقة إعدادات تستبعدها ويحدّد
التغيير الدقيق المطلوب في `allow` أو `alsoAllow`. قد تظل أدلة التشغيل الأقدم تستخدم
`openclaw plugins inspect skill-workshop`؛ ويوضّح هذا الأمر الآن أن ورشة Skills
مدمجة، ويطبع تلميح السياسة نفسه عند انطباقه.

## ذو صلة

- [Skills](/ar/tools/skills) لمعرفة ترتيب التحميل والأسبقية وإمكانية الظهور
- [إنشاء Skills](/ar/tools/creating-skills) للتعرّف على أساسيات كتابة `SKILL.md`
  يدويًا
- [إعدادات Skills](/ar/tools/skills-config) للمخطط الكامل لـ `skills.workshop`
- [CLI الخاص بـ Skills](/ar/cli/skills) لأوامر `openclaw skills`
