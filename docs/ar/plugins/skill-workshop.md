---
read_when:
    - أنت تريد أن يحوّل الوكلاء التصحيحات أو الإجراءات القابلة لإعادة الاستخدام إلى Skills لمساحة العمل
    - أنت بصدد إعداد ذاكرة مهارية إجرائية
    - أنت بصدد تصحيح سلوك أداة `skill_workshop`
    - أنت تقرر ما إذا كنت ستفعّل إنشاء Skills تلقائيًا
summary: التقاط تجريبي للإجراءات القابلة لإعادة الاستخدام كـ Skills لمساحة العمل مع المراجعة، والموافقة، والحجر، والتحديث الفوري للـ Skills
title: Plugin ورشة Skills
x-i18n:
    generated_at: "2026-04-24T07:57:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

Skill Workshop **تجريبية**. وهي معطلة افتراضيًا، وقد تتغير
أساليب الالتقاط الخاصة بها ومطالبات المراجع بين الإصدارات، ويجب ألا تُستخدم
الكتابات التلقائية إلا في مساحات عمل موثوقة بعد مراجعة مخرجات وضع
pending أولًا.

Skill Workshop هي ذاكرة إجرائية لـ Skills مساحة العمل. فهي تتيح للوكيل
تحويل سير العمل القابل لإعادة الاستخدام، وتصحيحات المستخدم، والإصلاحات
التي جرى كسبها بصعوبة، والمزالق المتكررة إلى ملفات `SKILL.md` تحت:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

وهذا يختلف عن الذاكرة طويلة الأمد:

- **Memory** تخزّن الحقائق، والتفضيلات، والكيانات، والسياق السابق.
- **Skills** تخزّن الإجراءات القابلة لإعادة الاستخدام التي يجب أن يتبعها الوكيل في المهام المستقبلية.
- **Skill Workshop** هي الجسر من دور مفيد إلى Skill دائمة في مساحة العمل،
  مع فحوصات أمان وموافقة اختيارية.

تكون Skill Workshop مفيدة عندما يتعلم الوكيل إجراءً مثل:

- كيفية التحقق من أصول animated GIF المأخوذة من مصادر خارجية
- كيفية استبدال أصول لقطات الشاشة والتحقق من الأبعاد
- كيفية تشغيل سيناريو QA خاص بالمستودع
- كيفية تصحيح فشل مزوّد متكرر
- كيفية إصلاح ملاحظة محلية قديمة لسير العمل

وليست مخصصة من أجل:

- حقائق مثل “المستخدم يحب اللون الأزرق”
- ذاكرة سيرة ذاتية واسعة
- أرشفة transcript خام
- الأسرار، أو بيانات الاعتماد، أو نص المطالبة المخفي
- التعليمات لمرة واحدة التي لن تتكرر

## الحالة الافتراضية

إن Plugin المضمّنة **تجريبية** و**معطلة افتراضيًا** ما لم يتم
تفعيلها صراحةً في `plugins.entries.skill-workshop`.

لا يضبط manifest الخاص بالـ plugin القيمة `enabledByDefault: true`. وتنطبق القيمة
الافتراضية `enabled: true` داخل مخطط إعداد الـ plugin فقط بعد أن يكون إدخال الـ plugin
قد تم اختياره وتحميله بالفعل.

يعني "تجريبية" ما يلي:

- أن الـ plugin مدعومة بالقدر الكافي للاختبار الاختياري وdogfooding
- وأن تخزين المقترحات، وحدود المراجع، وأساليب الالتقاط يمكن أن تتطور
- وأن pending approval هي وضع البداية الموصى به
- وأن auto apply مخصصة لإعدادات شخصية/مساحة عمل موثوقة، وليس لبيئات مشتركة أو معادية كثيرة المدخلات

## التفعيل

إعداد أدنى آمن:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

مع هذا الإعداد:

- تكون أداة `skill_workshop` متاحة
- تُدرج التصحيحات القابلة لإعادة الاستخدام الصريحة في قائمة انتظار كمقترحات معلقة
- يمكن لتمريرات المراجع القائمة على الحدود اقتراح تحديثات للـ Skills
- لا يُكتب أي ملف Skill حتى يتم تطبيق مقترح معلق

استخدم الكتابات التلقائية فقط في مساحات العمل الموثوقة:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

ما تزال `approvalPolicy: "auto"` تستخدم المسار نفسه الخاص بالماسح scanner والحجر quarantine. وهي
لا تطبق المقترحات التي تحتوي على نتائج حرجة.

## الإعداد

| المفتاح             | الافتراضي   | النطاق / القيم                                | المعنى                                                                |
| ------------------- | ----------- | --------------------------------------------- | --------------------------------------------------------------------- |
| `enabled`           | `true`      | boolean                                       | يفعّل الـ plugin بعد تحميل إدخال الـ plugin.                         |
| `autoCapture`       | `true`      | boolean                                       | يفعّل الالتقاط/المراجعة بعد الدور في أدوار الوكيل الناجحة.           |
| `approvalPolicy`    | `"pending"` | `"pending"`, `"auto"`                         | إدراج المقترحات في الانتظار أو كتابة المقترحات الآمنة تلقائيًا.      |
| `reviewMode`        | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"`   | يختار الالتقاط الصريح للتصحيح، أو مراجع LLM، أو كليهما، أو لا شيء.  |
| `reviewInterval`    | `15`        | `1..200`                                      | تشغيل المراجع بعد هذا العدد من الأدوار الناجحة.                      |
| `reviewMinToolCalls`| `8`         | `1..500`                                      | تشغيل المراجع بعد هذا العدد من استدعاءات الأدوات المرصودة.          |
| `reviewTimeoutMs`   | `45000`     | `5000..180000`                                | المهلة الخاصة بتشغيل المراجع المضمّن.                                |
| `maxPending`        | `50`        | `1..200`                                      | الحد الأقصى للمقترحات المعلقة/المحجورة المحتفَظ بها لكل مساحة عمل.   |
| `maxSkillBytes`     | `40000`     | `1024..200000`                                | الحد الأقصى لحجم ملف Skill/الملف المساعد المولد.                     |

ملفات تعريف موصى بها:

```json5
// محافظ: استخدام أداة صريح فقط، بلا التقاط تلقائي.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// المراجعة أولًا: التقط تلقائيًا، لكن اطلب الموافقة.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// أتمتة موثوقة: اكتب المقترحات الآمنة فورًا.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// منخفض التكلفة: لا استدعاء LLM للمراجع، فقط عبارات التصحيح الصريحة.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## مسارات الالتقاط

لدى Skill Workshop ثلاثة مسارات للالتقاط.

### اقتراحات الأدوات

يمكن للنموذج استدعاء `skill_workshop` مباشرة عندما يرى إجراءً قابلًا لإعادة الاستخدام
أو عندما يطلب منه المستخدم حفظ/تحديث Skill.

وهذا هو المسار الأكثر صراحة ويعمل حتى عندما تكون `autoCapture: false`.

### الالتقاط الاستدلالي

عندما تكون `autoCapture` مفعّلة وتكون قيمة `reviewMode` هي `heuristic` أو `hybrid`، تقوم
الـ plugin بفحص الأدوار الناجحة بحثًا عن عبارات تصحيح صريحة من المستخدم:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

ينشئ heuristic مقترحًا من أحدث تعليمات مستخدم مطابقة. وهو
يستخدم تلميحات موضوع لاختيار أسماء Skills الخاصة بسير العمل الشائع:

- مهام animated GIF -> `animated-gif-workflow`
- مهام لقطات الشاشة أو الأصول -> `screenshot-asset-workflow`
- مهام QA أو السيناريوهات -> `qa-scenario-workflow`
- مهام GitHub PR -> `github-pr-workflow`
- بديل احتياطي -> `learned-workflows`

الالتقاط heuristic ضيق عمدًا. فهو مخصص للتصحيحات الواضحة وملاحظات
العمليات القابلة للتكرار، وليس لتلخيص transcript بشكل عام.

### مراجع LLM

عندما تكون `autoCapture` مفعّلة وتكون قيمة `reviewMode` هي `llm` أو `hybrid`، تقوم
الـ plugin بتشغيل مراجع مضمّن مضغوط بعد بلوغ الحدود.

يتلقى المراجع:

- نص transcript الأخير، مع حد أقصى يبلغ آخر 12,000 محرف
- حتى 12 من Skills مساحة العمل الموجودة
- حتى 2,000 محرف من كل Skill موجودة
- تعليمات JSON-only

لا يملك المراجع أدوات:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

يعيد المراجع إما `{ "action": "none" }` أو مقترحًا واحدًا. يمكن أن يكون الحقل `action` هو `create` أو `append` أو `replace` — ويفضل استخدام `append`/`replace` عندما توجد Skill ذات صلة بالفعل؛ واستخدم `create` فقط عندما لا تكون هناك Skill موجودة مناسبة.

مثال على `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

يضيف `append` القيمة `section` + `body`. أما `replace` فيستبدل `oldText` بـ `newText` في Skill المسماة.

## دورة حياة المقترح

يصبح كل تحديث مولَّد مقترحًا يتضمن:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` اختياري
- `sessionId` اختياري
- `skillName`
- `title`
- `reason`
- `source`: `tool` أو `agent_end` أو `reviewer`
- `status`
- `change`
- `scanFindings` اختياري
- `quarantineReason` اختياري

حالات المقترحات:

- `pending` - في انتظار الموافقة
- `applied` - كُتب إلى `<workspace>/skills`
- `rejected` - رُفض من قِبل المشغّل/النموذج
- `quarantined` - حُظر بسبب نتائج حرجة من الماسح

تُخزَّن الحالة لكل مساحة عمل تحت دليل حالة Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

تتم إزالة التكرار من المقترحات المعلقة والمحجورة حسب اسم Skill
وحمولة التغيير. ويحتفظ المخزن بأحدث المقترحات المعلقة/المحجورة حتى
`maxPending`.

## مرجع الأداة

تسجل الـ plugin أداة وكيل واحدة:

```text
skill_workshop
```

### `status`

عدّ المقترحات حسب الحالة لمساحة العمل النشطة.

```json
{ "action": "status" }
```

شكل النتيجة:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

سرد المقترحات المعلقة.

```json
{ "action": "list_pending" }
```

لسرد حالة أخرى:

```json
{ "action": "list_pending", "status": "applied" }
```

قيم `status` الصالحة:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

سرد المقترحات المحجورة.

```json
{ "action": "list_quarantine" }
```

استخدم هذا عندما يبدو أن الالتقاط التلقائي لا يفعل شيئًا وتذكر السجلات
`skill-workshop: quarantined <skill>`.

### `inspect`

جلب مقترح حسب المعرّف.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

أنشئ مقترحًا. ومع `approvalPolicy: "pending"` (الافتراضي)، سيُدرج هذا في قائمة الانتظار بدلًا من الكتابة.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="فرض كتابة آمنة (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="فرض وضع pending ضمن سياسة auto (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="الإلحاق بقسم مسمّى">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="استبدال نص مطابق تمامًا">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

طبّق مقترحًا معلقًا.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

يرفض `apply` المقترحات المحجورة:

```text
quarantined proposal cannot be applied
```

### `reject`

ضع علامة على المقترح بأنه مرفوض.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

اكتب ملفًا مساعدًا داخل دليل Skill موجود أو مقترح.

الأدلة المساعدة المسموح بها على المستوى الأعلى:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

مثال:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

تكون الملفات المساعدة ضمن نطاق مساحة العمل، ويُتحقق من مساراتها، وتُحدّ بالبايتات وفق
`maxSkillBytes`، وتُفحص، وتُكتب بطريقة ذرية.

## كتابات Skills

تكتب Skill Workshop فقط تحت:

```text
<workspace>/skills/<normalized-skill-name>/
```

تُسوّى أسماء Skills على النحو التالي:

- تتحول إلى أحرف صغيرة
- تتحول المقاطع غير `[a-z0-9_-]` إلى `-`
- تُزال الرموز غير الأبجدية الرقمية في البداية/النهاية
- الحد الأقصى للطول هو 80 محرفًا
- يجب أن يطابق الاسم النهائي النمط `[a-z0-9][a-z0-9_-]{1,79}`

في حالة `create`:

- إذا لم تكن Skill موجودة، تكتب Skill Workshop ملف `SKILL.md` جديدًا
- إذا كانت موجودة بالفعل، تُلحق Skill Workshop المتن إلى `## Workflow`

في حالة `append`:

- إذا كانت Skill موجودة، تُلحق Skill Workshop بالقسم المطلوب
- إذا لم تكن موجودة، تُنشئ Skill Workshop Skill دنيا ثم تُلحق

في حالة `replace`:

- يجب أن تكون Skill موجودة بالفعل
- يجب أن يكون `oldText` موجودًا مطابقًا تمامًا
- يتم استبدال أول تطابق مطابق فقط

جميع الكتابات ذرية وتُحدّث لقطة Skills داخل الذاكرة فورًا، بحيث
يمكن أن تصبح Skill الجديدة أو المحدّثة مرئية من دون إعادة تشغيل Gateway.

## نموذج الأمان

تحتوي Skill Workshop على ماسح أمان لمحتوى `SKILL.md` المولَّد والملفات المساعدة.

تؤدي النتائج الحرجة إلى حجر المقترحات:

| معرّف القاعدة                           | يحظر محتوى يقوم بـ...                                                  |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions`  | إخبار الوكيل بتجاهل التعليمات السابقة/الأعلى                           |
| `prompt-injection-system`               | الإشارة إلى مطالبات النظام، أو رسائل المطور، أو التعليمات المخفية      |
| `prompt-injection-tool`                 | تشجيع تجاوز صلاحيات/موافقات الأدوات                                    |
| `shell-pipe-to-shell`                   | تضمين `curl`/`wget` موصولة إلى `sh` أو `bash` أو `zsh`                 |
| `secret-exfiltration`                   | ما يبدو أنه يرسل بيانات env/process env عبر الشبكة                     |

أما نتائج التحذير فيتم الاحتفاظ بها لكنها لا تؤدي إلى الحظر بمفردها:

| معرّف القاعدة        | يحذر من...                         |
| -------------------- | ---------------------------------- |
| `destructive-delete` | أوامر واسعة من نمط `rm -rf`        |
| `unsafe-permissions` | استخدام أذونات من نمط `chmod 777` |

المقترحات المحجورة:

- تحتفظ بـ `scanFindings`
- تحتفظ بـ `quarantineReason`
- تظهر في `list_quarantine`
- لا يمكن تطبيقها عبر `apply`

للتعافي من مقترح محجور، أنشئ مقترحًا آمنًا جديدًا بعد إزالة المحتوى
غير الآمن. لا تعدّل JSON الخاصة بالمخزن يدويًا.

## إرشادات المطالبة

عند التفعيل، تقوم Skill Workshop بحقن قسم مطالبة قصير يخبر الوكيل
باستخدام `skill_workshop` من أجل الذاكرة الإجرائية الدائمة.

تركز الإرشادات على:

- الإجراءات، لا الحقائق/التفضيلات
- تصحيحات المستخدم
- الإجراءات الناجحة غير الواضحة
- المزالق المتكررة
- إصلاح الـ Skills القديمة/الضعيفة/الخاطئة عبر append/replace
- حفظ الإجراءات القابلة لإعادة الاستخدام بعد حلقات أدوات طويلة أو إصلاحات صعبة
- نص Skill قصير بصيغة الأمر
- عدم تفريغ transcripts

يتغير نص وضع الكتابة مع `approvalPolicy`:

- وضع pending: إدراج الاقتراحات في قائمة الانتظار؛ والتطبيق فقط بعد موافقة صريحة
- وضع auto: تطبيق تحديثات Skills الآمنة الخاصة بمساحة العمل عندما تكون قابلة لإعادة الاستخدام بوضوح

## التكلفة وسلوك وقت التشغيل

لا يستدعي الالتقاط heuristic أي نموذج.

تستخدم مراجعة LLM تشغيلًا مضمّنًا على نموذج الوكيل النشط/الافتراضي. وهي
قائمة على حدود threshold بحيث لا تعمل افتراضيًا في كل دور.

المراجع:

- يستخدم سياق المزوّد/النموذج المهيأ نفسه عند توفره
- يعود احتياطيًا إلى القيم الافتراضية لوكيل وقت التشغيل
- لديه `reviewTimeoutMs`
- يستخدم سياق bootstrap خفيفًا
- لا يملك أدوات
- لا يكتب شيئًا مباشرة
- لا يستطيع إلا إصدار مقترح يمر عبر المسار العادي للماسح
  والموافقة/الحجر

إذا فشل المراجع، أو انتهت مهلته، أو أعاد JSON غير صالح، فإن الـ plugin تسجل
رسالة تحذير/debug وتتخطى تمريرة المراجعة تلك.

## أنماط التشغيل

استخدم Skill Workshop عندما يقول المستخدم:

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

نص Skill جيد:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

نص Skill ضعيف:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

أسباب عدم حفظ النسخة الضعيفة:

- تشبه transcript
- ليست بصيغة الأمر
- تتضمن تفاصيل مزعجة لمرة واحدة
- لا تخبر الوكيل التالي بما يجب فعله

## تصحيح الأخطاء

تحقق مما إذا كانت الـ plugin محمّلة:

```bash
openclaw plugins list --enabled
```

تحقق من عدد المقترحات من سياق وكيل/أداة:

```json
{ "action": "status" }
```

افحص المقترحات المعلقة:

```json
{ "action": "list_pending" }
```

افحص المقترحات المحجورة:

```json
{ "action": "list_quarantine" }
```

الأعراض الشائعة:

| العرض                                 | السبب المرجح                                                                      | ما الذي يجب فحصه                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| الأداة غير متاحة                      | إدخال الـ plugin غير مفعّل                                                        | `plugins.entries.skill-workshop.enabled` و`openclaw plugins list`    |
| لا يظهر أي مقترح تلقائي               | `autoCapture: false`، أو `reviewMode: "off"`، أو لم تتحقق الحدود                  | الإعداد، وحالة المقترحات، وسجلات Gateway                            |
| لم يلتقط heuristic شيئًا              | لم تطابق صياغة المستخدم أنماط التصحيح                                            | استخدم `skill_workshop.suggest` صراحةً أو فعّل مراجع LLM           |
| لم ينشئ المراجع مقترحًا               | أعاد المراجع `none`، أو JSON غير صالح، أو انتهت المهلة                            | سجلات Gateway، و`reviewTimeoutMs`، والحدود                          |
| لم يتم تطبيق المقترح                  | `approvalPolicy: "pending"`                                                        | `list_pending`، ثم `apply`                                          |
| اختفى المقترح من pending              | تمت إعادة استخدام مقترح مكرر، أو pruning بسبب max pending، أو تم تطبيقه/رفضه/حجره | `status`، و`list_pending` مع مرشحات الحالة، و`list_quarantine`      |
| ملف Skill موجود لكن النموذج يفوته     | لم يتم تحديث لقطة Skill أو أن ضبط Skills يستبعده                                  | حالة `openclaw skills` وأهلية Skills مساحة العمل                    |

السجلات ذات الصلة:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## سيناريوهات QA

سيناريوهات QA المدعومة بالمستودع:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

شغّل التغطية الحتمية:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

شغّل تغطية المراجع:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

سيناريو المراجع منفصل عمدًا لأنه يفعّل
`reviewMode: "llm"` ويمارس تمريرة المراجع المضمّنة.

## متى يجب عدم تفعيل auto apply

تجنب `approvalPolicy: "auto"` عندما:

- تحتوي مساحة العمل على إجراءات حساسة
- يعمل الوكيل على مدخلات غير موثوقة
- تُشارك Skills عبر فريق واسع
- ما زلت تضبط المطالبات أو قواعد الماسح
- يتعامل النموذج كثيرًا مع محتوى ويب/بريد إلكتروني معادٍ

استخدم وضع pending أولًا. ثم انتقل إلى وضع auto فقط بعد مراجعة نوع
الـ Skills التي يقترحها الوكيل في تلك المساحة.

## مستندات ذات صلة

- [Skills](/ar/tools/skills)
- [Plugins](/ar/tools/plugin)
- [الاختبار](/ar/reference/test)
