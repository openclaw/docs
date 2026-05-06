---
read_when:
    - تريد من الوكلاء تحويل التصحيحات أو الإجراءات القابلة لإعادة الاستخدام إلى Skills في مساحة العمل
    - أنت تقوم بتكوين ذاكرة المهارات الإجرائية
    - أنت تعمل على تصحيح أخطاء سلوك أداة skill_workshop
    - أنت تقرر ما إذا كنت ستفعّل إنشاء المهارات تلقائيًا
summary: التقاط تجريبي للإجراءات القابلة لإعادة الاستخدام بوصفها Skills لمساحة العمل، مع المراجعة والموافقة والعزل والتحديث الفوري لـ Skills
title: Plugin ورشة المهارات
x-i18n:
    generated_at: "2026-05-06T08:08:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop **تجريبي**. وهو معطل افتراضيًا، وقد تتغير استدلالات الالتقاط ومطالبات المراجع بين الإصدارات، ويجب استخدام عمليات الكتابة التلقائية فقط في مساحات العمل الموثوقة بعد مراجعة مخرجات وضع الانتظار أولًا.

Skill Workshop هو ذاكرة إجرائية لمهارات مساحة العمل. يتيح للوكيل تحويل سير العمل القابل لإعادة الاستخدام، وتصحيحات المستخدم، والإصلاحات المكتسبة بصعوبة، والمزالق المتكررة، إلى ملفات `SKILL.md` ضمن:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

وهذا يختلف عن الذاكرة طويلة الأمد:

- تخزن **الذاكرة** الحقائق والتفضيلات والكيانات والسياق السابق.
- تخزن **Skills** الإجراءات القابلة لإعادة الاستخدام التي يجب على الوكيل اتباعها في المهام المستقبلية.
- **Skill Workshop** هو الجسر من دورة مفيدة إلى مهارة دائمة في مساحة العمل، مع فحوصات أمان وموافقة اختيارية.

يكون Skill Workshop مفيدًا عندما يتعلم الوكيل إجراءً مثل:

- كيفية التحقق من أصول GIF المتحركة المستمدة من مصادر خارجية
- كيفية استبدال أصول لقطات الشاشة والتحقق من الأبعاد
- كيفية تشغيل سيناريو ضمان جودة خاص بالمستودع
- كيفية تصحيح فشل متكرر لدى موفر
- كيفية إصلاح ملاحظة سير عمل محلية قديمة

وهو غير مخصص لـ:

- حقائق مثل "المستخدم يحب اللون الأزرق"
- ذاكرة ذاتية واسعة
- أرشفة النصوص الخام للمحادثة
- الأسرار أو بيانات الاعتماد أو نصوص المطالبات المخفية
- تعليمات لمرة واحدة لن تتكرر

## الحالة الافتراضية

الـ Plugin المضمن **تجريبي** و**معطل افتراضيًا** ما لم يتم تمكينه صراحة في `plugins.entries.skill-workshop`.

لا يضبط بيان الـ Plugin القيمة `enabledByDefault: true`. ينطبق الافتراض `enabled: true` داخل مخطط إعدادات الـ Plugin فقط بعد أن يكون إدخال الـ Plugin قد تم اختياره وتحميله بالفعل.

تعني التجريبية أن:

- الـ Plugin مدعوم بما يكفي للاختبار الاختياري والاستخدام الداخلي
- تخزين المقترحات، وعتبات المراجع، واستدلالات الالتقاط يمكن أن تتطور
- الموافقة المعلقة هي وضع البدء الموصى به
- التطبيق التلقائي مخصص لإعدادات شخصية أو مساحات عمل موثوقة، وليس للبيئات المشتركة أو العدائية كثيفة الإدخال

## التمكين

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

- تكون أداة `skill_workshop` متاحة
- يتم وضع التصحيحات الصريحة القابلة لإعادة الاستخدام في قائمة انتظار كمقترحات معلقة
- يمكن لتمريرات المراجع المعتمدة على العتبات اقتراح تحديثات للمهارات
- لا تتم كتابة أي ملف مهارة حتى يتم تطبيق مقترح معلق

استخدم عمليات الكتابة التلقائية فقط في مساحات العمل الموثوقة:

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

ما زال `approvalPolicy: "auto"` يستخدم المسار نفسه للماسح والحجر. ولا يطبق المقترحات ذات النتائج الحرجة.

## الإعدادات

| المفتاح              | الافتراضي    | النطاق / القيم                              | المعنى                                                              |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | قيمة منطقية                                 | يمكّن الـ Plugin بعد تحميل إدخال الـ Plugin.                         |
| `autoCapture`        | `true`      | قيمة منطقية                                 | يمكّن الالتقاط/المراجعة بعد الدورة عند نجاح دورات الوكيل.            |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | يضع المقترحات في قائمة انتظار أو يكتب المقترحات الآمنة تلقائيًا.      |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | يختار التقاط التصحيحات الصريحة، أو مراجع LLM، أو كليهما، أو لا شيء. |
| `reviewInterval`     | `15`        | `1..200`                                    | يشغّل المراجع بعد هذا العدد من الدورات الناجحة.                      |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | يشغّل المراجع بعد هذا العدد من استدعاءات الأدوات المرصودة.           |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | مهلة تشغيل المراجع المضمن.                                           |
| `maxPending`         | `50`        | `1..200`                                    | الحد الأقصى للمقترحات المعلقة/المحجورة المحتفظ بها لكل مساحة عمل.    |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | الحد الأقصى لحجم ملف المهارة/الدعم المنشأ.                           |

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

لدى Skill Workshop ثلاثة مسارات التقاط.

### اقتراحات الأدوات

يمكن للنموذج استدعاء `skill_workshop` مباشرة عندما يرى إجراءً قابلًا لإعادة الاستخدام أو عندما يطلب منه المستخدم حفظ مهارة أو تحديثها.

هذا هو المسار الأكثر صراحة ويعمل حتى مع `autoCapture: false`.

### الالتقاط الاستدلالي

عند تمكين `autoCapture` وكان `reviewMode` هو `heuristic` أو `hybrid`، يفحص الـ Plugin الدورات الناجحة بحثًا عن عبارات تصحيح صريحة من المستخدم:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

ينشئ الاستدلال مقترحًا من أحدث تعليمة مستخدم مطابقة. ويستخدم تلميحات الموضوع لاختيار أسماء المهارات لسير العمل الشائع:

- مهام GIF المتحركة -> `animated-gif-workflow`
- مهام لقطة الشاشة أو الأصول -> `screenshot-asset-workflow`
- مهام ضمان الجودة أو السيناريوهات -> `qa-scenario-workflow`
- مهام GitHub PR -> `github-pr-workflow`
- المسار الاحتياطي -> `learned-workflows`

الالتقاط الاستدلالي ضيق عن قصد. فهو مخصص للتصحيحات الواضحة وملاحظات العمليات القابلة للتكرار، وليس لتلخيص المحادثات عمومًا.

### مراجع LLM

عند تمكين `autoCapture` وكان `reviewMode` هو `llm` أو `hybrid`، يشغّل الـ Plugin مراجعًا مضمنًا مضغوطًا بعد الوصول إلى العتبات.

يتلقى المراجع:

- نص المحادثة الأخير، محدودًا بآخر 12,000 حرف
- ما يصل إلى 12 مهارة موجودة في مساحة العمل
- ما يصل إلى 2,000 حرف من كل مهارة موجودة
- تعليمات JSON فقط

لا يمتلك المراجع أي أدوات:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

يعيد المراجع إما `{ "action": "none" }` أو مقترحًا واحدًا. يكون حقل `action` هو `create` أو `append` أو `replace` - فضّل `append`/`replace` عندما توجد مهارة ذات صلة بالفعل؛ واستخدم `create` فقط عندما لا تلائم أي مهارة موجودة.

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

يضيف `append` الحقلين `section` + `body`. ويستبدل `replace` النص `oldText` بالنص `newText` في المهارة المسماة.

## دورة حياة المقترح

يصبح كل تحديث منشأ مقترحًا يتضمن:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` اختياريًا
- `sessionId` اختياريًا
- `skillName`
- `title`
- `reason`
- `source`: `tool` أو `agent_end` أو `reviewer`
- `status`
- `change`
- `scanFindings` اختياريًا
- `quarantineReason` اختياريًا

حالات المقترح:

- `pending` - في انتظار الموافقة
- `applied` - كُتبت إلى `<workspace>/skills`
- `rejected` - رُفضت بواسطة المشغّل/النموذج
- `quarantined` - حُظرت بسبب نتائج ماسح حرجة

تُخزَّن الحالة لكل مساحة عمل ضمن دليل حالة Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

تُزال التكرارات من المقترحات المعلّقة والمحجورة حسب اسم skill وحمولة
التغيير. يحتفظ المخزن بأحدث المقترحات المعلّقة/المحجورة حتى
`maxPending`.

## مرجع الأداة

يسجّل Plugin أداة وكيل واحدة:

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

اسرد المقترحات المعلّقة.

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

اسرد المقترحات المحجورة.

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

أنشئ مقترحًا. مع `approvalPolicy: "pending"` (الافتراضي)، يؤدي هذا إلى وضعه في قائمة الانتظار بدلًا من الكتابة.

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
  <Accordion title="Force a safe write (apply: true)">

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

  <Accordion title="Force pending under auto policy (apply: false)">

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

  <Accordion title="Append to a named section">

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

  <Accordion title="Replace exact text">

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

علّم مقترحًا بأنه مرفوض.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

اكتب ملفًا داعمًا داخل دليل skill موجود أو مقترح.

أدلة الدعم ذات المستوى الأعلى المسموح بها:

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

تكون ملفات الدعم مقيدة بنطاق مساحة العمل، ومتحققًا من مساراتها، ومحدودة بالبايت بواسطة
`maxSkillBytes`، ومفحوصة، وتُكتب ذريًا.

## عمليات كتابة Skill

يكتب Skill Workshop فقط ضمن:

```text
<workspace>/skills/<normalized-skill-name>/
```

تُطبَّع أسماء المهارات:

- تُحوَّل إلى أحرف صغيرة
- تتحول سلاسل غير `[a-z0-9_-]` إلى `-`
- تُزال المحارف غير الأبجدية الرقمية من البداية والنهاية
- الحد الأقصى للطول هو 80 حرفًا
- يجب أن يطابق الاسم النهائي `[a-z0-9][a-z0-9_-]{1,79}`

بالنسبة إلى `create`:

- إذا لم تكن المهارة موجودة، يكتب Skill Workshop ملف `SKILL.md` جديدًا
- إذا كانت موجودة بالفعل، يضيف Skill Workshop المتن إلى `## Workflow`

بالنسبة إلى `append`:

- إذا كانت المهارة موجودة، يضيف Skill Workshop إلى القسم المطلوب
- إذا لم تكن موجودة، ينشئ Skill Workshop مهارة بالحد الأدنى ثم يضيف إليها

بالنسبة إلى `replace`:

- يجب أن تكون المهارة موجودة بالفعل
- يجب أن يكون `oldText` موجودًا حرفيًا
- يُستبدل أول تطابق حرفي فقط

كل عمليات الكتابة ذرية وتحدّث لقطة Skills الموجودة في الذاكرة فورًا، لذلك
يمكن أن تصبح المهارة الجديدة أو المحدّثة مرئية دون إعادة تشغيل Gateway.

## نموذج السلامة

يحتوي Skill Workshop على ماسح سلامة لمحتوى `SKILL.md` المُنشأ وملفات الدعم.

النتائج الحرجة تعزل المقترحات:

| معرّف القاعدة                          | يحظر المحتوى الذي...                                                    |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | يطلب من الوكيل تجاهل التعليمات السابقة/الأعلى                           |
| `prompt-injection-system`              | يشير إلى مطالبات النظام أو رسائل المطور أو التعليمات المخفية             |
| `prompt-injection-tool`                | يشجع على تجاوز إذن/موافقة الأداة                                         |
| `shell-pipe-to-shell`                  | يتضمن تمرير `curl`/`wget` إلى `sh` أو `bash` أو `zsh`                   |
| `secret-exfiltration`                  | يبدو أنه يرسل بيانات env/بيئة العملية عبر الشبكة                        |

تُحتفظ بنتائج التحذير لكنها لا تحظر بمفردها:

| معرّف القاعدة        | يحذر عند...                         |
| -------------------- | ----------------------------------- |
| `destructive-delete` | أوامر واسعة بنمط `rm -rf`           |
| `unsafe-permissions` | استخدام أذونات بنمط `chmod 777`     |

المقترحات المعزولة:

- تحتفظ بـ `scanFindings`
- تحتفظ بـ `quarantineReason`
- تظهر في `list_quarantine`
- لا يمكن تطبيقها عبر `apply`

للتعافي من مقترح معزول، أنشئ مقترحًا آمنًا جديدًا بعد إزالة المحتوى
غير الآمن. لا تعدّل JSON المخزن يدويًا.

## إرشادات المطالبات

عند التفعيل، يحقن Skill Workshop قسم مطالبة قصيرًا يخبر الوكيل
باستخدام `skill_workshop` للذاكرة الإجرائية الدائمة.

تركز الإرشادات على:

- الإجراءات، وليس الحقائق/التفضيلات
- تصحيحات المستخدم
- الإجراءات الناجحة غير البديهية
- العثرات المتكررة
- إصلاح المهارات القديمة/الضعيفة/الخاطئة عبر الإضافة/الاستبدال
- حفظ إجراء قابل لإعادة الاستخدام بعد حلقات أدوات طويلة أو إصلاحات صعبة
- نص مهارة قصير بصيغة الأمر
- عدم تفريغ النصوص الكاملة للمحادثات

يتغير نص وضع الكتابة مع `approvalPolicy`:

- وضع الانتظار: ضع الاقتراحات في قائمة الانتظار؛ ولا تطبقها إلا بعد موافقة صريحة
- الوضع التلقائي: طبّق تحديثات مهارات مساحة العمل الآمنة عندما تكون قابلة لإعادة الاستخدام بوضوح

## التكاليف وسلوك وقت التشغيل

لا يستدعي الالتقاط الاستدلالي نموذجًا.

تستخدم مراجعة LLM تشغيلًا مضمنًا على نموذج الوكيل النشط/الافتراضي. وهي
قائمة على العتبات لذلك لا تعمل في كل دور افتراضيًا.

المراجع:

- يستخدم سياق المزوّد/النموذج نفسه عند توفره
- يعود إلى الإعدادات الافتراضية لوكيل وقت التشغيل
- لديه `reviewTimeoutMs`
- يستخدم سياق تمهيد خفيف
- لا يملك أدوات
- لا يكتب شيئًا مباشرة
- يمكنه فقط إصدار مقترح يمر عبر مسار الماسح العادي
  والموافقة/العزل

إذا فشل المراجع أو انتهت مهلته أو أعاد JSON غير صالح، يسجل Plugin
رسالة تحذير/تصحيح ويتخطى مرور المراجعة ذلك.

## أنماط التشغيل

استخدم Skill Workshop عندما يقول المستخدم:

- "في المرة القادمة، افعل X"
- "من الآن فصاعدًا، فضّل Y"
- "تأكد من التحقق من Z"
- "احفظ هذا كسير عمل"
- "استغرق هذا وقتًا؛ تذكّر العملية"
- "حدّث المهارة المحلية لهذا"

نص مهارة جيد:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

نص مهارة ضعيف:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

أسباب عدم حفظ النسخة الضعيفة:

- على هيئة نص محادثة
- ليست بصيغة الأمر
- تتضمن تفاصيل صاخبة لمرة واحدة
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

| العرض                                  | السبب المحتمل                                                                       | التحقق                                                               |
| -------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| الأداة غير متاحة                       | إدخال Plugin غير مفعّل                                                              | `plugins.entries.skill-workshop.enabled` و `openclaw plugins list`   |
| لا يظهر مقترح تلقائي                   | `autoCapture: false` أو `reviewMode: "off"` أو لم تتحقق العتبات                     | الإعدادات، حالة المقترحات، سجلات Gateway                            |
| لم يلتقط الاستدلال                     | صياغة المستخدم لم تطابق أنماط التصحيح                                               | استخدم `skill_workshop.suggest` صراحة أو فعّل مراجع LLM              |
| لم ينشئ المراجع مقترحًا                | أعاد المراجع `none` أو JSON غير صالح أو انتهت مهلته                                 | سجلات Gateway، و `reviewTimeoutMs`، والعتبات                         |
| لم يُطبَّق المقترح                     | `approvalPolicy: "pending"`                                                         | `list_pending`، ثم `apply`                                           |
| اختفى المقترح من المعلّقات             | أُعيد استخدام مقترح مكرر، أو تقليم الحد الأقصى للمعلّقات، أو طُبّق/رُفض/عُزل       | `status`، و `list_pending` مع مرشحات الحالة، و `list_quarantine`     |
| ملف المهارة موجود لكن النموذج يفوته    | لم تُحدّث لقطة المهارات أو أن بوابة المهارات تستبعده                                | حالة `openclaw skills` وأهلية مهارات مساحة العمل                    |

السجلات ذات الصلة:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## سيناريوهات QA

سيناريوهات QA المدعومة من المستودع:

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
`reviewMode: "llm"` ويمرّن مرور المراجع المضمن.

## متى لا تفعّل التطبيق التلقائي

تجنب `approvalPolicy: "auto"` عندما:

- تحتوي مساحة العمل على إجراءات حساسة
- يعمل الوكيل على مدخلات غير موثوقة
- تُشارك Skills عبر فريق واسع
- ما زلت تضبط المطالبات أو قواعد الماسح
- يتعامل النموذج كثيرًا مع محتوى ويب/بريد إلكتروني عدائي

استخدم وضع الانتظار أولًا. انتقل إلى الوضع التلقائي فقط بعد مراجعة نوع
Skills التي يقترحها الوكيل في مساحة العمل تلك.

## مستندات ذات صلة

- [Skills](/ar/tools/skills)
- [Plugins](/ar/tools/plugin)
- [الاختبار](/ar/reference/test)
