---
x-i18n:
    generated_at: "2026-04-08T06:02:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a9066b2a939c5a9ba69141d75405f0e8097997b523164340e2f0e9a0d5060dd
    source_path: refactor/qa.md
    workflow: 15
---

# إعادة هيكلة QA

الحالة: تم إرساء الترحيل التأسيسي.

## الهدف

نقل QA في OpenClaw من نموذج تعريف منقسم إلى مصدر حقيقة واحد:

- بيانات تعريف السيناريو
- المطالبات المرسلة إلى النموذج
- الإعداد والتنظيف
- منطق الـ harness
- التأكيدات ومعايير النجاح
- العناصر الناتجة وتلميحات التقرير

الحالة النهائية المطلوبة هي harness عام لـ QA يحمّل ملفات تعريف سيناريوهات قوية بدلًا من ترميز معظم السلوك بشكل ثابت في TypeScript.

## الحالة الحالية

يوجد مصدر الحقيقة الأساسي الآن في `qa/scenarios/index.md` بالإضافة إلى ملف واحد لكل
سيناريو ضمن `qa/scenarios/*.md`.

ما تم تنفيذه:

- `qa/scenarios/index.md`
  - بيانات تعريف حزمة QA القياسية
  - هوية المشغّل
  - مهمة الانطلاق
- `qa/scenarios/*.md`
  - ملف Markdown واحد لكل سيناريو
  - بيانات تعريف السيناريو
  - ربط المعالجات
  - إعدادات التنفيذ الخاصة بالسيناريو
- `extensions/qa-lab/src/scenario-catalog.ts`
  - محلل حزمة Markdown + تحقق `zod`
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - تصيير الخطة من حزمة Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - يهيئ ملفات توافق مولدة بالإضافة إلى `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - يحدد السيناريوهات القابلة للتنفيذ عبر روابط معالجات معرّفة في Markdown
- بروتوكول حافلة QA + واجهة المستخدم
  - مرفقات مضمنة عامة لعرض الصور/الفيديو/الصوت/الملفات

الأسطح المنقسمة المتبقية:

- `extensions/qa-lab/src/suite.ts`
  - لا يزال يملك معظم منطق المعالجات المخصصة القابلة للتنفيذ
- `extensions/qa-lab/src/report.ts`
  - لا يزال يستمد بنية التقرير من مخرجات وقت التشغيل

لذا تم إصلاح انقسام مصدر الحقيقة، لكن التنفيذ لا يزال في الغالب معتمدًا على المعالجات بدلًا من أن يكون تصريحيًا بالكامل.

## كيف يبدو سطح السيناريو الحقيقي

تُظهر قراءة الحزمة الحالية عدة فئات مميزة من السيناريوهات.

### تفاعل بسيط

- خط أساس القناة
- خط أساس الرسائل الخاصة
- متابعة ضمن خيط
- تبديل النموذج
- استكمال الموافقة
- التفاعل/التعديل/الحذف

### تعديل الإعدادات ووقت التشغيل

- تعطيل skill عبر ترقيع الإعدادات
- إيقاظ إعادة تشغيل تطبيق الإعدادات
- قلب قدرة إعادة تشغيل الإعدادات
- فحص انجراف مخزون وقت التشغيل

### تأكيدات نظام الملفات والمستودع

- تقرير اكتشاف المصدر/الوثائق
- بناء Lobster Invaders
- البحث عن عنصر صورة مولد

### تنسيق الذاكرة

- استدعاء الذاكرة
- أدوات الذاكرة في سياق القناة
- احتياط فشل الذاكرة
- ترتيب ذاكرة الجلسة
- عزل ذاكرة الخيط
- اجتياح حلم الذاكرة

### تكامل الأدوات والـ plugin

- استدعاء MCP plugin-tools
- ظهور Skills
- التثبيت السريع للـ skill
- توليد الصور الأصلي
- رحلة الصورة الكاملة
- فهم الصورة من مرفق

### تعدد الأدوار وتعدد الأدوار الفاعلة

- تسليم العمل إلى وكيل فرعي
- تركيب التوزيع المتوازي لوكلاء فرعيين
- تدفقات بأسلوب التعافي بعد إعادة التشغيل

هذه الفئات مهمة لأنها تحدد متطلبات DSL. فقائمة مسطحة من المطالبات + النص المتوقع ليست كافية.

## الاتجاه

### مصدر حقيقة واحد

استخدم `qa/scenarios/index.md` بالإضافة إلى `qa/scenarios/*.md` كمصدر
الحقيقة المؤلف.

يجب أن تظل الحزمة:

- قابلة للقراءة البشرية أثناء المراجعة
- قابلة للتحليل آليًا
- غنية بما يكفي لتشغيل:
  - تنفيذ الحزمة
  - تهيئة مساحة عمل QA
  - بيانات تعريف واجهة مستخدم QA Lab
  - مطالبات الوثائق/الاكتشاف
  - توليد التقارير

### تنسيق التأليف المفضل

استخدم Markdown كتنسيق علوي، مع YAML منظّم بداخله.

الشكل الموصى به:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - تجاوزات النموذج/الموفر
  - prerequisites
- أقسام نثرية
  - objective
  - notes
  - debugging hints
- كتل YAML مسيجة
  - setup
  - steps
  - assertions
  - cleanup

وهذا يوفّر:

- قابلية قراءة أفضل في طلبات السحب من JSON ضخم
- سياقًا أغنى من YAML الخالص
- تحليلًا صارمًا وتحقق `zod`

يُقبل JSON الخام فقط كصيغة وسيطة مولدة.

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

تحقق من إعادة إرفاق الوسائط المولدة في الدور اللاحق.

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

# التوقع

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

## قدرات المشغّل التي يجب أن يغطيها DSL

استنادًا إلى الحزمة الحالية، يحتاج المشغّل العام إلى أكثر من مجرد تنفيذ المطالبات.

### إجراءات البيئة والإعداد

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### إجراءات دور الوكيل

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### إجراءات الإعداد ووقت التشغيل

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

### إجراءات الذاكرة وcron

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

يجب أن يدعم DSL المخرجات المحفوظة والمراجع اللاحقة إليها.

أمثلة من الحزمة الحالية:

- إنشاء خيط، ثم إعادة استخدام `threadId`
- إنشاء جلسة، ثم إعادة استخدام `sessionKey`
- توليد صورة، ثم إرفاق الملف في الدور التالي
- توليد سلسلة وسم إيقاظ، ثم التأكد من ظهورها لاحقًا

القدرات المطلوبة:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- مراجع typed للمسارات، ومفاتيح الجلسات، ومعرّفات الخيوط، والواسمات، ومخرجات الأدوات

من دون دعم المتغيرات، سيستمر الـ harness في تسريب منطق السيناريو مرة أخرى إلى TypeScript.

## ما الذي يجب أن يبقى كمخارج طوارئ

المشغّل التصريحي الخالص بالكامل غير واقعي في المرحلة 1.

بعض السيناريوهات بطبيعتها كثيفة التنسيق:

- اجتياح حلم الذاكرة
- إيقاظ إعادة تشغيل تطبيق الإعدادات
- قلب قدرة إعادة تشغيل الإعدادات
- حل عنصر الصورة المولد حسب الطابع الزمني/المسار
- تقييم تقرير الاكتشاف

ينبغي أن تستخدم هذه السيناريوهات معالجات مخصصة صريحة في الوقت الحالي.

القاعدة الموصى بها:

- 85-90% تصريحي
- خطوات `customHandler` صريحة للباقي الصعب
- معالجات مخصصة مسماة وموثقة فقط
- لا يوجد كود مضمن مجهول داخل ملف السيناريو

يحافظ ذلك على نظافة المحرك العام مع السماح بإحراز التقدم.

## التغيير المعماري

### الحالي

أصبح Markdown الخاص بالسيناريو الآن مصدر الحقيقة لكل من:

- تنفيذ الحزمة
- ملفات تهيئة مساحة العمل
- فهرس سيناريوهات واجهة مستخدم QA Lab
- بيانات تعريف التقرير
- مطالبات الاكتشاف

التوافق المولد:

- لا تزال مساحة العمل المهيأة تتضمن `QA_KICKOFF_TASK.md`
- لا تزال مساحة العمل المهيأة تتضمن `QA_SCENARIO_PLAN.md`
- تتضمن مساحة العمل المهيأة الآن أيضًا `QA_SCENARIOS.md`

## خطة إعادة الهيكلة

### المرحلة 1: المُحمّل والمخطط

تمت.

- تمت إضافة `qa/scenarios/index.md`
- تم تقسيم السيناريوهات إلى `qa/scenarios/*.md`
- تمت إضافة محلل لمحتوى حزمة YAML المسمى في Markdown
- تم التحقق باستخدام `zod`
- تم تحويل المستهلكين إلى الحزمة المحللة
- تمت إزالة `qa/seed-scenarios.json` و`qa/QA_KICKOFF_TASK.md` على مستوى المستودع

### المرحلة 2: المحرك العام

- تقسيم `extensions/qa-lab/src/suite.ts` إلى:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- الإبقاء على دوال المساعدة الحالية كعمليات للمحرك

الناتج القابل للتسليم:

- ينفذ المحرك سيناريوهات تصريحية بسيطة

ابدأ بالسيناريوهات التي تكون في الغالب مطالبة + انتظار + تأكيد:

- متابعة ضمن خيط
- فهم الصورة من مرفق
- ظهور الـ skill واستدعاؤه
- خط أساس القناة

الناتج القابل للتسليم:

- أول سيناريوهات حقيقية معرّفة في Markdown تُشحن عبر المحرك العام

### المرحلة 4: ترحيل السيناريوهات المتوسطة

- رحلة توليد الصورة الكاملة
- أدوات الذاكرة في سياق القناة
- ترتيب ذاكرة الجلسة
- تسليم العمل إلى وكيل فرعي
- تركيب التوزيع المتوازي لوكلاء فرعيين

الناتج القابل للتسليم:

- إثبات المتغيرات والعناصر الناتجة وتأكيدات الأدوات وتأكيدات سجل الطلبات

### المرحلة 5: إبقاء السيناريوهات الصعبة على المعالجات المخصصة

- اجتياح حلم الذاكرة
- إيقاظ إعادة تشغيل تطبيق الإعدادات
- قلب قدرة إعادة تشغيل الإعدادات
- انجراف مخزون وقت التشغيل

الناتج القابل للتسليم:

- نفس تنسيق التأليف، ولكن مع كتل خطوات مخصصة صريحة عند الحاجة

### المرحلة 6: حذف خريطة السيناريوهات المرمزة بشكل ثابت

بمجرد أن تصبح تغطية الحزمة جيدة بما يكفي:

- أزل معظم التفرعات الخاصة بالسيناريو في TypeScript من `extensions/qa-lab/src/suite.ts`

## دعم Slack المزيف / الوسائط الغنية

حافلة QA الحالية تعتمد النص أولًا.

الملفات ذات الصلة:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

اليوم تدعم حافلة QA:

- النص
- التفاعلات
- الخيوط

وهي لا تصمم بعد مرفقات وسائط مضمنة.

### عقد النقل المطلوب

أضف نموذج مرفقات عام لحافلة QA:

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

### لماذا البدء بشكل عام أولًا

لا تبنِ نموذج وسائط خاصًا بـ Slack فقط.

بدلًا من ذلك:

- نموذج نقل QA عام واحد
- عدة مصيّرات فوقه
  - دردشة QA Lab الحالية
  - واجهة Slack ويب مزيفة مستقبلية
  - أي عروض نقل مزيفة أخرى

هذا يمنع تكرار المنطق ويجعل سيناريوهات الوسائط غير مرتبطة بوسيلة نقل محددة.

### أعمال واجهة المستخدم المطلوبة

حدّث واجهة مستخدم QA لتصيير:

- معاينة صورة مضمنة
- مشغل صوت مضمن
- مشغل فيديو مضمن
- شارة مرفق ملف

يمكن لواجهة المستخدم الحالية بالفعل تصيير الخيوط والتفاعلات، لذا يجب أن يُضاف تصيير المرفقات فوق نموذج بطاقة الرسالة نفسه.

### أعمال السيناريو التي يتيحها نقل الوسائط

بمجرد أن تمر المرفقات عبر حافلة QA، يمكننا إضافة سيناريوهات دردشة مزيفة أكثر غنى:

- رد بصورة مضمنة في Slack المزيف
- فهم مرفق صوتي
- فهم مرفق فيديو
- ترتيب مختلط للمرفقات
- رد ضمن خيط مع الاحتفاظ بالوسائط

## التوصية

يجب أن تكون الدفعة التالية من التنفيذ كما يلي:

1. إضافة مُحمّل سيناريو Markdown + مخطط `zod`
2. توليد الفهرس الحالي من Markdown
3. ترحيل بعض السيناريوهات البسيطة أولًا
4. إضافة دعم مرفقات حافلة QA العامة
5. تصيير صورة مضمنة في واجهة مستخدم QA
6. ثم التوسع إلى الصوت والفيديو

هذا هو أصغر مسار يثبت كلا الهدفين:

- QA عام معرّف عبر Markdown
- أسطح مراسلة مزيفة أكثر غنى

## أسئلة مفتوحة

- ما إذا كان ينبغي أن تسمح ملفات السيناريو بقوالب مطالبات Markdown مضمنة مع استيفاء المتغيرات
- ما إذا كان ينبغي أن يكون الإعداد/التنظيف أقسامًا مسماة أو مجرد قوائم إجراءات مرتبة
- ما إذا كان ينبغي أن تكون مراجع العناصر الناتجة typed بقوة في المخطط أو معتمدة على السلاسل
- ما إذا كان ينبغي أن تعيش المعالجات المخصصة في سجل واحد أو في سجلات حسب السطح
- ما إذا كان ينبغي أن يظل ملف التوافق JSON المولد محفوظًا في git أثناء الترحيل
