---
read_when:
    - إعادة هيكلة تعريفات سيناريوهات QA أو شيفرة harness الخاصة بـ qa-lab
    - نقل سلوك QA بين سيناريوهات Markdown ومنطق harness في TypeScript
summary: خطة إعادة هيكلة QA لتوحيد كتالوج السيناريوهات وharness
title: إعادة هيكلة QA
x-i18n:
    generated_at: "2026-04-24T08:02:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

الحالة: تم تنفيذ الترحيل التأسيسي.

## الهدف

نقل QA في OpenClaw من نموذج تعريف منقسم إلى مصدر حقيقة واحد:

- بيانات تعريف السيناريو
- prompts المُرسلة إلى النموذج
- الإعداد والتنظيف
- منطق harness
- التأكيدات ومعايير النجاح
- العناصر الناتجة وتلميحات التقرير

الحالة النهائية المطلوبة هي harness QA عامة تحمّل ملفات تعريف سيناريو قوية بدلًا من ترميز معظم السلوك في TypeScript.

## الحالة الحالية

يعيش المصدر الأساسي للحقيقة الآن في `qa/scenarios/index.md` بالإضافة إلى ملف واحد لكل
سيناريو تحت `qa/scenarios/<theme>/*.md`.

تم تنفيذ ما يلي:

- `qa/scenarios/index.md`
  - بيانات تعريف حزمة QA القانونية
  - هوية المشغّل
  - مهمة الانطلاق
- `qa/scenarios/<theme>/*.md`
  - ملف markdown واحد لكل سيناريو
  - بيانات تعريف السيناريو
  - روابط handler
  - تهيئة التنفيذ الخاصة بالسيناريو
- `extensions/qa-lab/src/scenario-catalog.ts`
  - محلّل حزمة markdown + تحقق zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - عرض plan من حزمة markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - يبذر ملفات توافق مولّدة بالإضافة إلى `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - يختار السيناريوهات القابلة للتنفيذ عبر روابط handler المعرّفة في markdown
- بروتوكول QA bus + الواجهة
  - مرفقات inline عامة لعرض الصور/الفيديو/الصوت/الملفات

الأسطح المنقسمة المتبقية:

- `extensions/qa-lab/src/suite.ts`
  - ما تزال تملك معظم منطق handler المخصص القابل للتنفيذ
- `extensions/qa-lab/src/report.ts`
  - ما تزال تشتق بنية التقرير من مخرجات وقت التشغيل

إذًا تم إصلاح انقسام مصدر الحقيقة، لكن التنفيذ ما يزال في الغالب معتمدًا على handlers بدلًا من أن يكون تصريحيًا بالكامل.

## كيف يبدو سطح السيناريو الحقيقي

تُظهر قراءة suite الحالية عدة فئات متميزة من السيناريوهات.

### تفاعل بسيط

- خط أساس القناة
- خط أساس الرسائل المباشرة
- متابعة مترابطة
- تبديل النموذج
- متابعة الموافقة
- reaction/edit/delete

### تهيئة وتغيير وقت التشغيل

- تعطيل Skill عبر تصحيح التهيئة
- config apply restart wake-up
- قلب القدرة بعد إعادة تشغيل التهيئة
- فحص انحراف inventory في وقت التشغيل

### تأكيدات نظام الملفات والمستودع

- تقرير اكتشاف source/docs
- build Lobster Invaders
- البحث عن عنصر ناتج لصورة مولدة

### تنسيق الذاكرة

- استدعاء الذاكرة
- أدوات الذاكرة في سياق القناة
- الرجوع الاحتياطي عند فشل الذاكرة
- ترتيب ذاكرة الجلسة
- عزل ذاكرة الخيط
- memory dreaming sweep

### تكامل الأدوات وPlugin

- استدعاء MCP plugin-tools
- رؤية Skill
- التثبيت السريع لـ Skill
- توليد الصور الأصلي
- image roundtrip
- فهم الصورة من مرفق

### تعدد الدورات وتعدد الأطراف

- تسليم الوكيل الفرعي
- subagent fanout synthesis
- تدفقات بنمط التعافي بعد إعادة التشغيل

تهم هذه الفئات لأنها تدفع متطلبات DSL. فقائمة مسطحة من prompt + نص متوقع لا تكفي.

## الاتجاه

### مصدر حقيقة واحد

استخدم `qa/scenarios/index.md` بالإضافة إلى `qa/scenarios/<theme>/*.md` بوصفها
مصدر الحقيقة المؤلَّف.

يجب أن تبقى الحزمة:

- قابلة للقراءة البشرية في المراجعة
- قابلة للتحليل آليًا
- غنية بما يكفي لدفع:
  - تنفيذ suite
  - bootstrap الخاصة بـ QA workspace
  - بيانات تعريف QA Lab UI
  - prompts الوثائق/الاكتشاف
  - توليد التقارير

### تنسيق التأليف المفضل

استخدم markdown بوصفها التنسيق الأعلى مستوى، مع YAML منظّمة داخلها.

الشكل الموصى به:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - تجاوزات النموذج/المزوّد
  - المتطلبات المسبقة
- أقسام prose
  - objective
  - notes
  - debugging hints
- كتل YAML مسيجة
  - setup
  - steps
  - assertions
  - cleanup

وهذا يمنح:

- قابلية قراءة أفضل في PR من JSON ضخمة
- سياقًا أغنى من YAML خالصة
- تحليلًا صارمًا وتحققًا عبر zod

ويُقبل JSON الخام فقط بوصفه صيغة وسيطة مولدة.

## الشكل المقترح لملف السيناريو

مثال:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# الهدف

تحقق من إعادة إرفاق الوسائط المولدة في دورة المتابعة.

# الإعداد

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# الخطوات

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# المتوقع

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## القدرات التي يجب أن تغطيها DSL الخاصة بالعدّاء

استنادًا إلى suite الحالية، يحتاج العدّاء العام إلى أكثر من مجرد تنفيذ prompts.

### إجراءات البيئة والإعداد

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### إجراءات دورة الوكيل

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### إجراءات التهيئة ووقت التشغيل

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### إجراءات الملفات والعناصر الناتجة

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### إجراءات الذاكرة وCron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### إجراءات MCP

- `mcp.callTool`

### التأكيدات

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## المتغيرات ومراجع العناصر الناتجة

يجب أن تدعم DSL المخرجات المحفوظة والمراجع اللاحقة.

أمثلة من suite الحالية:

- إنشاء خيط، ثم إعادة استخدام `threadId`
- إنشاء جلسة، ثم إعادة استخدام `sessionKey`
- توليد صورة، ثم إرفاق الملف في الدورة التالية
- توليد سلسلة wake marker, ثم تأكيد ظهورها لاحقًا

القدرات المطلوبة:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- مراجع مطبّعة للمسارات، ومفاتيح الجلسات، ومعرّفات الخيوط، والعلامات، ومخرجات الأدوات

من دون دعم المتغيرات، سيستمر harness في تسريب منطق السيناريو مرة أخرى إلى TypeScript.

## ما الذي يجب أن يبقى كمنافذ هروب

العدّاء التصريحي الخالص بالكامل ليس واقعيًا في المرحلة 1.

بعض السيناريوهات بطبيعتها ثقيلة orchestration:

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- حل عنصر صورة مولدة عبر الطابع الزمني/المسار
- تقييم تقرير الاكتشاف

يجب أن تستخدم هذه handlers مخصصة صريحة في الوقت الحالي.

القاعدة الموصى بها:

- 85-90% تصريحية
- خطوات `customHandler` صريحة للباقي الصعب
- custom handlers مسماة وموثقة فقط
- لا توجد شيفرة inline مجهولة داخل ملف السيناريو

وهذا يبقي المحرك العام نظيفًا مع السماح بإحراز تقدم.

## التغيير المعماري

### الحالي

أصبحت markdown الخاصة بالسيناريو الآن مصدر الحقيقة من أجل:

- تنفيذ suite
- ملفات bootstrap الخاصة بـ workspace
- كتالوج سيناريوهات QA Lab UI
- بيانات تعريف التقرير
- prompts الاكتشاف

التوافق المولّد:

- لا تزال workspace المزروعة تتضمن `QA_KICKOFF_TASK.md`
- لا تزال workspace المزروعة تتضمن `QA_SCENARIO_PLAN.md`
- كما تتضمن الآن أيضًا `QA_SCENARIOS.md`

## خطة إعادة الهيكلة

### المرحلة 1: المُحمّل وschema

تمت.

- أُضيف `qa/scenarios/index.md`
- قُسّمت السيناريوهات إلى `qa/scenarios/<theme>/*.md`
- أُضيف محلّل لمحتوى حزمة markdown YAML المُسمّى
- تم التحقق عبر zod
- تم تحويل المستهلكين إلى الحزمة المحللة
- أُزيل `qa/seed-scenarios.json` و`qa/QA_KICKOFF_TASK.md` من مستوى المستودع

### المرحلة 2: المحرك العام

- قسّم `extensions/qa-lab/src/suite.ts` إلى:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- أبقِ الدوال المساعدة الموجودة كعمليات للمحرك

الناتج:

- ينفذ المحرك سيناريوهات تصريحية بسيطة

ابدأ بالسيناريوهات التي هي في الغالب prompt + wait + assert:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

الناتج:

- أول سيناريوهات حقيقية معرّفة عبر markdown وتشحن عبر المحرك العام

### المرحلة 4: ترحيل السيناريوهات المتوسطة

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

الناتج:

- إثبات variables، وartifacts، وtool assertions، وrequest-log assertions

### المرحلة 5: إبقاء السيناريوهات الصعبة على handlers مخصصة

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

الناتج:

- تنسيق تأليف مماثل، لكن مع كتل custom-step صريحة عند الحاجة

### المرحلة 6: حذف خريطة السيناريوهات المشفرة

بمجرد أن تصبح تغطية الحزمة جيدة بما يكفي:

- أزل معظم التفرعات الخاصة بالسيناريو في TypeScript من `extensions/qa-lab/src/suite.ts`

## Fake Slack / دعم الوسائط الغنية

تُعد QA bus الحالية متمحورة حول النص أولًا.

الملفات ذات الصلة:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

اليوم تدعم QA bus ما يلي:

- النص
- reactions
- الخيوط

وهي لا تمثل بعدُ مرفقات الوسائط inline.

### عقدة النقل المطلوبة

أضف نموذج مرفقات عام لـ QA bus:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

ثم أضف `attachments?: QaBusAttachment[]` إلى:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### لماذا العامة أولًا

لا تبنِ نموذج وسائط خاصًا بـ Slack فقط.

بل بدلًا من ذلك:

- نموذج نقل QA عام واحد
- عدة renderers فوقه
  - دردشة QA Lab الحالية
  - fake Slack web مستقبلية
  - أي عروض نقل وهمية أخرى

وهذا يمنع تكرار المنطق ويجعل سيناريوهات الوسائط محايدة لوسيلة النقل.

### العمل المطلوب على الواجهة

حدّث واجهة QA لتعرض:

- معاينة صورة inline
- مشغل صوت inline
- مشغل فيديو inline
- شارة مرفق ملف

تستطيع الواجهة الحالية بالفعل عرض الخيوط وreactions, لذلك يجب أن تُطبّق مكونات عرض المرفقات فوق نموذج بطاقة الرسالة نفسه.

### العمل على السيناريوهات الذي يتيحه نقل الوسائط

بمجرد أن تتدفق المرفقات عبر QA bus, يمكننا إضافة سيناريوهات دردشة وهمية أغنى:

- رد صورة inline في fake Slack
- فهم المرفقات الصوتية
- فهم مرفقات الفيديو
- ترتيب المرفقات المختلطة
- رد خيط مع الاحتفاظ بالوسائط

## التوصية

يجب أن تكون القطعة التالية من التنفيذ هي:

1. إضافة markdown scenario loader + zod schema
2. توليد الكتالوج الحالي من markdown
3. ترحيل بعض السيناريوهات البسيطة أولًا
4. إضافة دعم مرفقات QA bus العامة
5. عرض الصور inline في واجهة QA
6. ثم التوسع إلى الصوت والفيديو

وهذا أصغر مسار يثبت الهدفين معًا:

- QA عامة معرّفة عبر markdown
- أسطح مراسلة وهمية أغنى

## أسئلة مفتوحة

- ما إذا كان يجب أن تسمح ملفات السيناريو بقوالب prompt مضمّنة في markdown مع إقحام المتغيرات
- ما إذا كان يجب أن يكون setup/cleanup على شكل أقسام مسماة أو مجرد قوائم إجراءات مرتبة
- ما إذا كان يجب أن تكون مراجع العناصر الناتجة مطبّعة بقوة في schema أو معتمدة على السلاسل النصية
- ما إذا كان يجب أن تعيش custom handlers في سجل واحد أو في سجلات لكل سطح
- ما إذا كان يجب أن يبقى ملف JSON التوافقي المولّد محفوظًا في المستودع أثناء الترحيل

## ذو صلة

- [أتمتة QA E2E](/ar/concepts/qa-e2e-automation)
