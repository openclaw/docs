---
read_when:
    - تريد أن يحوّل الوكلاء التصحيحات أو الإجراءات القابلة لإعادة الاستخدام إلى Skills في مساحة العمل
    - أنت تُهيّئ ذاكرة المهارات الإجرائية
    - أنت تستكشف أخطاء سلوك أداة skill_workshop وتصلحها
    - أنت تقرر ما إذا كنت ستفعّل إنشاء Skills تلقائيًا
summary: التقاط تجريبي للإجراءات القابلة لإعادة الاستخدام بوصفها Skills في مساحة العمل مع المراجعة والموافقة والعزل وتحديث Skills أثناء التشغيل
title: Plugin ورشة المهارات
x-i18n:
    generated_at: "2026-05-07T13:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

ورشة المهارات **تجريبية**. تكون معطّلة افتراضيًا، وقد تتغير
استدلالات الالتقاط ومطالبات المراجع بين الإصدارات، ويجب استخدام الكتابات
التلقائية فقط في مساحات العمل الموثوقة بعد مراجعة مخرجات وضع الانتظار أولًا.

ورشة المهارات هي ذاكرة إجرائية لمهارات مساحة العمل. تتيح للوكيل تحويل
سير العمل القابل لإعادة الاستخدام، وتصحيحات المستخدم، والإصلاحات المكتسبة بصعوبة، والمزالق المتكررة
إلى ملفات `SKILL.md` ضمن:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

يختلف هذا عن الذاكرة طويلة الأمد:

- تخزّن **الذاكرة** الحقائق، والتفضيلات، والكيانات، والسياق السابق.
- تخزّن **Skills** الإجراءات القابلة لإعادة الاستخدام التي ينبغي للوكيل اتباعها في المهام المستقبلية.
- **ورشة المهارات** هي الجسر من جولة مفيدة إلى مهارة دائمة في مساحة العمل
  مع فحوصات أمان وموافقة اختيارية.

تكون ورشة المهارات مفيدة عندما يتعلم الوكيل إجراءً مثل:

- كيفية التحقق من أصول GIF المتحركة المستوردة من مصادر خارجية
- كيفية استبدال أصول لقطات الشاشة والتحقق من الأبعاد
- كيفية تشغيل سيناريو ضمان جودة خاص بالمستودع
- كيفية تصحيح فشل متكرر لمزوّد
- كيفية إصلاح ملاحظة سير عمل محلية قديمة

ليست مخصصة لما يلي:

- حقائق مثل "المستخدم يفضّل اللون الأزرق"
- ذاكرة ذاتية واسعة
- أرشفة نصوص المحادثات الخام
- الأسرار، أو بيانات الاعتماد، أو نص المطالبة المخفي
- تعليمات لمرة واحدة لن تتكرر

## الحالة الافتراضية

الـ Plugin المضمّن **تجريبي** و**معطّل افتراضيًا** ما لم يتم
تفعيله صراحةً في `plugins.entries.skill-workshop`.

لا يضبط بيان الـ Plugin القيمة `enabledByDefault: true`. ينطبق الإعداد الافتراضي `enabled: true`
داخل مخطط إعدادات الـ Plugin فقط بعد أن يكون إدخال الـ Plugin قد
اختير وحُمّل بالفعل.

تعني التجريبية ما يلي:

- الـ Plugin مدعوم بما يكفي للاختبار الاختياري والاستخدام الداخلي
- يمكن أن يتطور تخزين المقترحات، وعتبات المراجعة، واستدلالات الالتقاط
- الموافقة المعلّقة هي وضع البدء الموصى به
- التطبيق التلقائي مخصص لإعدادات شخصية/مساحات عمل موثوقة، وليس للبيئات المشتركة أو العدائية
  كثيفة الإدخال

## التفعيل

إعداد آمن بالحد الأدنى:

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

- تصبح أداة `skill_workshop` متاحة
- تُضاف التصحيحات الصريحة القابلة لإعادة الاستخدام إلى قائمة انتظار كمقترحات معلّقة
- يمكن لتمريرات المراجع المعتمدة على العتبات اقتراح تحديثات للمهارات
- لا يُكتب أي ملف مهارة حتى يُطبّق مقترح معلّق

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

ما يزال `approvalPolicy: "auto"` يستخدم مسار الفحص والحجر نفسه.
ولا يطبّق المقترحات التي تحتوي على نتائج حرجة.

## التكوين

| المفتاح              | الافتراضي  | النطاق / القيم                              | المعنى                                                              |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | قيمة منطقية                                 | يفعّل الـ Plugin بعد تحميل إدخال الـ Plugin.                         |
| `autoCapture`        | `true`      | قيمة منطقية                                 | يفعّل الالتقاط/المراجعة بعد الجولة في جولات الوكيل الناجحة.          |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | يضع المقترحات في قائمة انتظار أو يكتب المقترحات الآمنة تلقائيًا.     |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | يختار التقاط التصحيحات الصريحة، أو مراجع LLM، أو كليهما، أو لا شيء. |
| `reviewInterval`     | `15`        | `1..200`                                    | يشغّل المراجع بعد هذا العدد من الجولات الناجحة.                     |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | يشغّل المراجع بعد هذا العدد من استدعاءات الأدوات المرصودة.           |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | مهلة تشغيل المراجع المضمّن.                                          |
| `maxPending`         | `50`        | `1..200`                                    | الحد الأقصى للمقترحات المعلّقة/المحجورة المحتفظ بها لكل مساحة عمل.  |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | الحد الأقصى لحجم ملف المهارة/الدعم المُنشأ.                          |

الملفات التعريفية الموصى بها:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## مسارات الالتقاط

لدى ورشة المهارات ثلاثة مسارات التقاط.

### اقتراحات الأداة

يمكن للنموذج استدعاء `skill_workshop` مباشرةً عندما يرى إجراءً قابلًا لإعادة الاستخدام
أو عندما يطلب المستخدم منه حفظ مهارة أو تحديثها.

هذا هو المسار الأكثر صراحة ويعمل حتى مع `autoCapture: false`.

### الالتقاط بالاستدلال

عند تفعيل `autoCapture` وكان `reviewMode` هو `heuristic` أو `hybrid`،
يفحص الـ Plugin الجولات الناجحة بحثًا عن عبارات تصحيح صريحة من المستخدم:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

ينشئ الاستدلال مقترحًا من أحدث تعليمة مستخدم مطابقة. ويستخدم
تلميحات الموضوع لاختيار أسماء المهارات لسير العمل الشائعة:

- مهام GIF المتحركة -> `animated-gif-workflow`
- مهام لقطات الشاشة أو الأصول -> `screenshot-asset-workflow`
- مهام ضمان الجودة أو السيناريوهات -> `qa-scenario-workflow`
- مهام PR في GitHub -> `github-pr-workflow`
- المسار الاحتياطي -> `learned-workflows`

الالتقاط بالاستدلال ضيق عمدًا. فهو مخصص للتصحيحات الواضحة
وملاحظات العمليات القابلة للتكرار، وليس لتلخيص نصوص المحادثات عمومًا.

### مراجع LLM

عند تفعيل `autoCapture` وكان `reviewMode` هو `llm` أو `hybrid`، يشغّل الـ Plugin
مراجعًا مضمّنًا مضغوطًا بعد الوصول إلى العتبات.

يتلقى المراجع:

- نص المحادثة الأخيرة، محدودًا بآخر 12,000 حرف
- ما يصل إلى 12 مهارة حالية في مساحة العمل
- ما يصل إلى 2,000 حرف من كل مهارة حالية
- تعليمات JSON فقط

لا يملك المراجع أي أدوات:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

يعيد المراجع إما `{ "action": "none" }` أو مقترحًا واحدًا. يكون حقل `action` هو `create` أو `append` أو `replace` - فضّل `append`/`replace` عندما توجد مهارة ذات صلة بالفعل؛ واستخدم `create` فقط عندما لا تناسب أي مهارة حالية.

مثال `create`:

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

يضيف `append` الحقلين `section` + `body`. يستبدل `replace` النص `oldText` بالنص `newText` في المهارة المسماة.

## دورة حياة المقترح

كل تحديث مُنشأ يصبح مقترحًا يحتوي على:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` اختياري
- `sessionId` اختياري
- `skillName`
- `title`
- `reason`
- `source`: `tool`، أو `agent_end`، أو `reviewer`
- `status`
- `change`
- `scanFindings` اختياري
- `quarantineReason` اختياري

حالات المقترح:

- `pending` - ينتظر الموافقة
- `applied` - كُتب إلى `<workspace>/skills`
- `rejected` - رُفض بواسطة المشغّل/النموذج
- `quarantined` - حُظر بسبب نتائج فحص حرجة

تُخزَّن الحالة لكل مساحة عمل ضمن دليل حالة Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

تُزال التكرارات من المقترحات المعلّقة والمعزولة حسب اسم المهارة وحمولة التغيير. يحتفظ المخزن بأحدث المقترحات المعلّقة/المعزولة حتى
`maxPending`.

## مرجع الأداة

يسجّل الـ Plugin أداة وكيل واحدة:

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

اعرض المقترحات المعلّقة.

```json
{ "action": "list_pending" }
```

لعرض حالة أخرى:

```json
{ "action": "list_pending", "status": "applied" }
```

قيم `status` الصالحة:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

اعرض المقترحات المعزولة.

```json
{ "action": "list_quarantine" }
```

استخدم هذا عندما يبدو أن الالتقاط التلقائي لا يفعل شيئًا وتذكر السجلات
`skill-workshop: quarantined <skill>`.

### `inspect`

اجلب مقترحًا حسب المعرّف.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

أنشئ مقترحًا. مع `approvalPolicy: "pending"` (الافتراضي)، يؤدي هذا إلى وضعه في الطابور بدلًا من الكتابة.

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
  <Accordion title="طلب كتابة فورية في الوضع التلقائي (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

مع `approvalPolicy: "pending"`، يظل `apply: true` يضع المقترح في الطابور. راجعه، ثم استخدم إجراء
`apply` بعد الموافقة.

  </Accordion>

  <Accordion title="فرض التعليق ضمن سياسة تلقائية (apply: false)">

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

  <Accordion title="استبدال النص المطابق تمامًا">

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

طبّق مقترحًا معلّقًا.

مع `approvalPolicy: "pending"`، يطلب هذا الإجراء موافقة المشغّل قبل كتابة مهارة مساحة العمل.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

يرفض `apply` المقترحات المعزولة:

```text
quarantined proposal cannot be applied
```

### `reject`

علّم مقترحًا بأنه مرفوض.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

اكتب ملفًا داعمًا داخل دليل مهارة موجود أو مقترح.

أدلة الدعم المسموح بها في المستوى الأعلى:

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

تكون ملفات الدعم محددة بنطاق مساحة العمل، ومتحققا من مساراتها، ومحدودة بالبايت بواسطة
`maxSkillBytes`، ومفحوصة، وتكتب ذريًا.

## كتابات Skill

يكتب Skill Workshop فقط ضمن:

```text
<workspace>/skills/<normalized-skill-name>/
```

تتم تسوية أسماء Skills:

- تحويلها إلى أحرف صغيرة
- تصبح تتابعات غير `[a-z0-9_-]` على شكل `-`
- تزال الأحرف غير الأبجدية الرقمية في البداية/النهاية
- الحد الأقصى للطول هو 80 حرفًا
- يجب أن يطابق الاسم النهائي `[a-z0-9][a-z0-9_-]{1,79}`

بالنسبة إلى `create`:

- إذا لم تكن Skill موجودة، يكتب Skill Workshop ملف `SKILL.md` جديدًا
- إذا كانت موجودة بالفعل، يضيف Skill Workshop المتن إلى `## Workflow`

بالنسبة إلى `append`:

- إذا كانت Skill موجودة، يضيف Skill Workshop إلى القسم المطلوب
- إذا لم تكن موجودة، ينشئ Skill Workshop Skill دنيا ثم يضيف إليها

بالنسبة إلى `replace`:

- يجب أن تكون Skill موجودة بالفعل
- يجب أن يكون `oldText` موجودًا تمامًا
- يستبدل أول تطابق تام فقط

كل الكتابات ذرية وتحدّث لقطة Skills في الذاكرة فورًا، بحيث يمكن أن تصبح
Skill الجديدة أو المحدثة مرئية دون إعادة تشغيل Gateway.

## نموذج السلامة

يحتوي Skill Workshop على ماسح سلامة لمحتوى `SKILL.md` المنشأ وملفات الدعم.

النتائج الحرجة تعزل المقترحات:

| معرّف القاعدة                         | يحظر المحتوى الذي...                                                  |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | يخبر الوكيل بتجاهل التعليمات السابقة/الأعلى                          |
| `prompt-injection-system`              | يشير إلى مطالبات النظام أو رسائل المطور أو التعليمات المخفية          |
| `prompt-injection-tool`                | يشجع على تجاوز إذن/موافقة الأداة                                      |
| `shell-pipe-to-shell`                  | يتضمن `curl`/`wget` ممررة إلى `sh` أو `bash` أو `zsh`                 |
| `secret-exfiltration`                  | يبدو أنه يرسل بيانات البيئة/env الخاصة بالعملية عبر الشبكة            |

تحتفظ نتائج التحذير بها لكنها لا تحظر وحدها:

| معرّف القاعدة       | يحذر عند...                         |
| -------------------- | ----------------------------------- |
| `destructive-delete` | أوامر واسعة بأسلوب `rm -rf`         |
| `unsafe-permissions` | استخدام أذونات بأسلوب `chmod 777`   |

المقترحات المعزولة:

- تحتفظ بـ `scanFindings`
- تحتفظ بـ `quarantineReason`
- تظهر في `list_quarantine`
- لا يمكن تطبيقها عبر `apply`

للتعافي من مقترح معزول، أنشئ مقترحًا آمنًا جديدًا مع إزالة
المحتوى غير الآمن. لا تعدّل JSON المخزن يدويًا.

## إرشادات المطالبة

عند التفعيل، يحقن Skill Workshop قسم مطالبة قصيرًا يخبر الوكيل
باستخدام `skill_workshop` للذاكرة الإجرائية الدائمة.

تشدد الإرشادات على:

- الإجراءات، وليس الحقائق/التفضيلات
- تصحيحات المستخدم
- الإجراءات الناجحة غير البديهية
- العثرات المتكررة
- إصلاح Skills القديمة/الرقيقة/الخاطئة عبر الإضافة/الاستبدال
- حفظ الإجراء القابل لإعادة الاستخدام بعد حلقات أدوات طويلة أو إصلاحات صعبة
- نص Skill قصير بصيغة الأمر
- عدم تفريغ النصوص الحوارية

يتغير نص وضع الكتابة مع `approvalPolicy`:

- وضع الانتظار: ضع الاقتراحات في قائمة الانتظار؛ استخدم `apply` بعد موافقة صريحة
- الوضع التلقائي: طبّق تحديثات Skills الآمنة في مساحة العمل ما لم يجعل `apply: false` ذلك في قائمة الانتظار بدلًا من ذلك

## التكاليف وسلوك وقت التشغيل

لا يستدعي الالتقاط الاستدلالي نموذجًا.

تستخدم مراجعة LLM تشغيلًا مضمّنًا على نموذج الوكيل النشط/الافتراضي. وهي
مبنية على عتبات كي لا تعمل افتراضيًا في كل دورة.

المراجع:

- يستخدم سياق المزوّد/النموذج نفسه عند توفره
- يعود إلى افتراضيات وكيل وقت التشغيل
- لديه `reviewTimeoutMs`
- يستخدم سياق تمهيد خفيفًا
- لا يملك أدوات
- لا يكتب شيئًا مباشرة
- يمكنه فقط إصدار مقترح يمر عبر الماسح العادي ومسار
  الموافقة/العزل

إذا فشلت المراجعة أو انتهت مهلتها أو أعادت JSON غير صالح، يسجل Plugin
رسالة تحذير/تصحيح ويتخطى دورة المراجعة تلك.

## أنماط التشغيل

استخدم Skill Workshop عندما يقول المستخدم:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

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

- على شكل نص حواري
- ليست بصيغة الأمر
- تتضمن تفاصيل مزعجة لمرة واحدة
- لا تخبر الوكيل التالي بما يجب فعله

## تصحيح الأخطاء

تحقق مما إذا كان Plugin محملًا:

```bash
openclaw plugins list --enabled
```

تحقق من أعداد المقترحات من سياق وكيل/أداة:

```json
{ "action": "status" }
```

افحص المقترحات المعلقة:

```json
{ "action": "list_pending" }
```

افحص المقترحات المعزولة:

```json
{ "action": "list_quarantine" }
```

الأعراض الشائعة:

| العرض                                  | السبب المحتمل                                                                     | تحقق من                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| الأداة غير متاحة                       | إدخال Plugin غير مفعّل                                                            | `plugins.entries.skill-workshop.enabled` و `openclaw plugins list` |
| لا يظهر مقترح تلقائي                   | `autoCapture: false` أو `reviewMode: "off"` أو لم تتحقق العتبات                   | الإعدادات، حالة المقترح، سجلات Gateway                              |
| لم يلتقط الاستدلال                     | صياغة المستخدم لم تطابق أنماط التصحيح                                             | استخدم `skill_workshop.suggest` صراحة أو فعّل مراجع LLM              |
| لم ينشئ المراجع مقترحًا                | أعاد المراجع `none` أو JSON غير صالح أو انتهت مهلته                               | سجلات Gateway و `reviewTimeoutMs` والعتبات                          |
| لم يطبّق المقترح                       | `approvalPolicy: "pending"`                                                       | `list_pending`، ثم `apply`                                          |
| اختفى المقترح من المعلق                | أعيد استخدام مقترح مكرر، أو تقليم الحد الأقصى للمعلقات، أو طُبق/رُفض/عُزل        | `status` و `list_pending` مع مرشحات الحالة و `list_quarantine`      |
| ملف Skill موجود لكن النموذج لا يراه    | لم تحدّث لقطة Skill أو أن بوابات Skill تستبعدها                                   | حالة `openclaw skills` وأهلية Skill في مساحة العمل                  |

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
`reviewMode: "llm"` ويمرّن دورة المراجع المضمّن.

## متى لا تفعّل التطبيق التلقائي

تجنب `approvalPolicy: "auto"` عندما:

- تحتوي مساحة العمل على إجراءات حساسة
- يعمل الوكيل على إدخال غير موثوق
- تتم مشاركة Skills عبر فريق واسع
- ما زلت تضبط المطالبات أو قواعد الماسح
- يتعامل النموذج كثيرًا مع محتوى ويب/بريد إلكتروني عدائي

استخدم وضع الانتظار أولًا. انتقل إلى الوضع التلقائي فقط بعد مراجعة نوع
Skills التي يقترحها الوكيل في مساحة العمل تلك.

## المستندات ذات الصلة

- [Skills](/ar/tools/skills)
- [Plugins](/ar/tools/plugin)
- [الاختبار](/ar/reference/test)
