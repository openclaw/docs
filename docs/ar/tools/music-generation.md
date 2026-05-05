---
read_when:
    - توليد الموسيقى أو الصوت عبر الوكيل
    - تكوين مزوّدي ونماذج توليد الموسيقى
    - فهم معلمات أداة music_generate
sidebarTitle: Music generation
summary: توليد الموسيقى عبر music_generate ضمن سير عمل Google Lyria وMiniMax وComfyUI
title: توليد الموسيقى
x-i18n:
    generated_at: "2026-05-05T01:52:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e14a5a10dd485c2d3dbbd23a0fc2c12de500d9f7bfb7db471c27ed2a99ad650
    source_path: tools/music-generation.md
    workflow: 16
---

تتيح أداة `music_generate` للوكيل إنشاء موسيقى أو صوت عبر
إمكانات توليد الموسيقى المشتركة مع المزوّدين المهيئين — Google،
MiniMax، وComfyUI المهيأ بسير عمل حاليًا.

بالنسبة لتشغيلات الوكيل المدعومة بجلسة، يبدأ OpenClaw توليد الموسيقى
كمهمة في الخلفية، ويتتبعها في سجل المهام، ثم يوقظ الوكيل مرة أخرى
عندما يصبح المقطع جاهزًا حتى يتمكن الوكيل من إخبار المستخدم وإرفاق
الصوت المكتمل. في دردشات المجموعات/القنوات التي تستخدم التسليم المرئي
عبر أداة الرسائل فقط، ينقل الوكيل النتيجة عبر أداة الرسائل.

<Note>
لا تظهر الأداة المشتركة المدمجة إلا عند توفر مزوّد واحد على الأقل
لتوليد الموسيقى. إذا لم ترَ `music_generate` في أدوات وكيلك،
فهيّئ `agents.defaults.musicGenerationModel` أو أعدّ مفتاح API
لمزوّد.
</Note>

## البدء السريع

<Tabs>
  <Tab title="مدعوم بمزوّد مشترك">
    <Steps>
      <Step title="تهيئة المصادقة">
        عيّن مفتاح API لمزوّد واحد على الأقل — على سبيل المثال
        `GEMINI_API_KEY` أو `MINIMAX_API_KEY`.
      </Step>
      <Step title="اختيار نموذج افتراضي (اختياري)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="اسأل الوكيل">
        _"أنشئ مقطع synthpop مبهجًا عن قيادة ليلية عبر مدينة
        مضاءة بالنيون."_

        يستدعي الوكيل `music_generate` تلقائيًا. لا حاجة إلى
        قائمة سماح للأدوات.
      </Step>
    </Steps>

    بالنسبة للسياقات المتزامنة المباشرة التي لا تتضمن تشغيل وكيل مدعومًا
    بجلسة، تظل الأداة المدمجة ترجع إلى التوليد المضمن وتعيد
    مسار الوسائط النهائي في نتيجة الأداة.

  </Tab>
  <Tab title="سير عمل ComfyUI">
    <Steps>
      <Step title="تهيئة سير العمل">
        هيّئ `plugins.entries.comfy.config.music` باستخدام JSON
        لسير العمل وعقد المطالبة/الإخراج.
      </Step>
      <Step title="مصادقة السحابة (اختياري)">
        بالنسبة إلى Comfy Cloud، عيّن `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="استدعاء الأداة">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

أمثلة على المطالبات:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## المزوّدون المدعومون

| المزوّد | النموذج الافتراضي          | مدخلات مرجعية | عناصر التحكم المدعومة                                        | المصادقة                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | حتى صورة واحدة    | موسيقى أو صوت محددان بسير العمل                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | حتى 10 صور  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | لا شيء             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` أو MiniMax OAuth     |

### مصفوفة الإمكانات

عقد الوضع الصريح المستخدم بواسطة `music_generate`، واختبارات العقد، و
الفحص الحي المشترك:

| المزوّد | `generate` | `edit` | حد التعديل | مسارات الفحص الحي المشتركة                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | صورة واحدة    | غير موجود في الفحص المشترك؛ تغطيه `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 صور  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | لا شيء       | `generate`                                                                |

استخدم `action: "list"` لفحص المزوّدين والنماذج المشتركة المتاحة
أثناء التشغيل:

```text
/tool music_generate action=list
```

استخدم `action: "status"` لفحص مهمة الموسيقى النشطة المدعومة بجلسة:

```text
/tool music_generate action=status
```

مثال على التوليد المباشر:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## معاملات الأداة

<ParamField path="prompt" type="string" required>
  مطالبة توليد الموسيقى. مطلوبة من أجل `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  يعيد `"status"` مهمة الجلسة الحالية؛ ويفحص `"list"` المزوّدين.
</ParamField>
<ParamField path="model" type="string">
  تجاوز المزوّد/النموذج (مثل `google/lyria-3-pro-preview`،
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  كلمات اختيارية عندما يدعم المزوّد إدخال الكلمات الصريح.
</ParamField>
<ParamField path="instrumental" type="boolean">
  اطلب إخراجًا آليًا فقط عندما يدعم المزوّد ذلك.
</ParamField>
<ParamField path="image" type="string">
  مسار صورة مرجعية واحد أو URL.
</ParamField>
<ParamField path="images" type="string[]">
  صور مرجعية متعددة (حتى 10 لدى المزوّدين الداعمين).
</ParamField>
<ParamField path="durationSeconds" type="number">
  المدة المستهدفة بالثواني عندما يدعم المزوّد تلميحات المدة.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  تلميح تنسيق الإخراج عندما يدعمه المزوّد.
</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="timeoutMs" type="number">مهلة طلب المزوّد الاختيارية بالميلي ثانية. تُرفع القيم الأقل من 10000ms إلى 10000ms ويُبلّغ عنها في نتيجة الأداة.</ParamField>

<Note>
لا يدعم كل المزوّدين جميع المعاملات. لا يزال OpenClaw يتحقق من
الحدود الصارمة مثل عدد المدخلات قبل الإرسال. عندما يدعم مزوّد
المدة لكنه يستخدم حدًا أقصى أقصر من القيمة المطلوبة، يضبط OpenClaw
القيمة إلى أقرب مدة مدعومة. تُتجاهل التلميحات الاختيارية غير المدعومة
فعليًا مع تحذير عندما يتعذر على المزوّد أو النموذج المحدد احترامها.
تبلغ نتائج الأداة عن الإعدادات المطبقة؛ ويلتقط `details.normalization`
أي ربط من المطلوب إلى المطبق.
</Note>

## السلوك غير المتزامن

يعمل توليد الموسيقى المدعوم بجلسة كمهمة في الخلفية:

- **مهمة في الخلفية:** ينشئ `music_generate` مهمة في الخلفية، ويعيد
  استجابة بدء/مهمة فورًا، وينشر المقطع المكتمل لاحقًا في
  رسالة متابعة من الوكيل.
- **منع التكرار:** بينما تكون المهمة `queued` أو `running`، تعيد
  استدعاءات `music_generate` اللاحقة في الجلسة نفسها حالة المهمة بدلًا من
  بدء توليد آخر. استخدم `action: "status"` للتحقق صراحة.
- **البحث عن الحالة:** يفحص `openclaw tasks list` أو `openclaw tasks show <taskId>`
  الحالة في قائمة الانتظار، والقيد التشغيل، والنهائية.
- **إيقاظ الإكمال:** يحقن OpenClaw حدث إكمال داخليًا مرة أخرى
  في الجلسة نفسها حتى يتمكن النموذج من كتابة المتابعة الموجهة للمستخدم
  بنفسه.
- **تلميح المطالبة:** تحصل أدوار المستخدم/اليدوية اللاحقة في الجلسة نفسها على تلميح
  تشغيل صغير عندما تكون مهمة موسيقى قيد التنفيذ بالفعل، حتى لا يستدعي النموذج
  `music_generate` عشوائيًا مرة أخرى.
- **رجوع بلا جلسة:** تعمل السياقات المباشرة/المحلية التي لا تحتوي على جلسة وكيل
  حقيقية بشكل مضمن وتعيد نتيجة الصوت النهائية في الدور نفسه.

### دورة حياة المهمة

| الحالة       | المعنى                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | أُنشئت المهمة، وتنتظر قبول المزوّد لها.                                           |
| `running`   | المزوّد يعالج الطلب (عادةً من 30 ثانية إلى 3 دقائق حسب المزوّد والمدة). |
| `succeeded` | المقطع جاهز؛ يستيقظ الوكيل وينشره في المحادثة.                                 |
| `failed`    | خطأ أو انتهاء مهلة من المزوّد؛ يستيقظ الوكيل مع تفاصيل الخطأ.                                 |

تحقق من الحالة من CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## التهيئة

### اختيار النموذج

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### ترتيب اختيار المزوّدين

يجرب OpenClaw المزوّدين بهذا الترتيب:

1. معامل `model` من استدعاء الأداة (إذا حدده الوكيل).
2. `musicGenerationModel.primary` من التهيئة.
3. `musicGenerationModel.fallbacks` بالترتيب.
4. الاكتشاف التلقائي باستخدام افتراضيات المزوّد المدعومة بالمصادقة فقط:
   - المزوّد الافتراضي الحالي أولًا؛
   - بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرّف المزوّد.

إذا فشل مزوّد، تُجرّب المرشّح التالي تلقائيًا. إذا فشل الجميع،
يتضمن الخطأ تفاصيل من كل محاولة.

عيّن `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.

## ملاحظات المزوّدين

<AccordionGroup>
  <Accordion title="ComfyUI">
    يعتمد على سير العمل وعلى الرسم البياني المهيأ وربط العقد
    لحقول المطالبة/الإخراج. يتكامل Plugin `comfy` المضمّن مع
    أداة `music_generate` المشتركة عبر سجل مزوّدي توليد الموسيقى.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    يستخدم توليد Lyria 3 بالدفعات. يدعم التدفق المضمّن الحالي
    المطالبة، ونص الكلمات الاختياري، والصور المرجعية الاختيارية.
  </Accordion>
  <Accordion title="MiniMax">
    يستخدم نقطة نهاية الدفعات `music_generation`. يدعم المطالبة،
    والكلمات الاختيارية، والوضع الآلي، وتوجيه المدة، وإخراج mp3 عبر
    مصادقة مفتاح API لـ `minimax` أو OAuth لـ `minimax-portal`.
  </Accordion>
</AccordionGroup>

## اختيار المسار المناسب

- **مدعوم بمزوّد مشترك** عندما تريد اختيار النموذج، وتجاوز فشل المزوّدين،
  وتدفق المهمة/الحالة غير المتزامن المدمج.
- **مسار Plugin (ComfyUI)** عندما تحتاج إلى رسم بياني مخصص لسير العمل أو إلى
  مزوّد ليس جزءًا من إمكانات الموسيقى المضمّنة المشتركة.

إذا كنت تصحح سلوكًا خاصًا بـ ComfyUI، فراجع
[ComfyUI](/ar/providers/comfy). إذا كنت تصحح سلوك المزوّدين المشتركين،
فابدأ بـ [Google (Gemini)](/ar/providers/google) أو
[MiniMax](/ar/providers/minimax).

## أوضاع إمكانات المزوّد

يدعم عقد توليد الموسيقى المشترك تصريحات وضع صريحة:

- `generate` للتوليد من مطالبة فقط.
- `edit` عندما يتضمن الطلب صورة مرجعية واحدة أو أكثر.

ينبغي لتنفيذات المزوّدين الجديدة تفضيل كتل الوضع الصريحة:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

ليست الحقول المسطحة القديمة مثل `maxInputImages` و`supportsLyrics` و
`supportsFormat` كافية **للإعلان** عن دعم التعديل. ينبغي للمزوّدين
التصريح بـ `generate` و`edit` صراحة حتى تتمكن الاختبارات الحية،
واختبارات العقد، وأداة `music_generate` المشتركة من التحقق من دعم الوضع
بشكل حتمي.

## الاختبارات الحية

تغطية حية اختيارية للمزوّدين المضمّنين المشتركين:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

مغلّف المستودع:

```bash
pnpm test:live:media music
```

يحمّل هذا الملف الحي متغيرات بيئة المزوّد الناقصة من `~/.profile`،
ويفضّل مفاتيح API الحية/من البيئة على ملفات تعريف المصادقة المخزنة
افتراضيًا، ويشغّل تغطية `generate` وتغطية `edit` المصرّح بها عندما
يمكّن المزوّد وضع التعديل. التغطية اليوم:

- `google`: `generate` بالإضافة إلى `edit`
- `minimax`: `generate` فقط
- `comfy`: تغطية Comfy الحية منفصلة، وليست ضمن فحص المزوّدين المشتركين

تغطية حية اختيارية لمسار موسيقى ComfyUI المضمّن:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

يغطي ملف الاختبار الحي الخاص بـ Comfy أيضًا سير عمل الصور والفيديو في Comfy عندما تكون تلك
الأقسام مكوّنة.

## ذات صلة

- [المهام الخلفية](/ar/automation/tasks) — تتبّع المهام لعمليات تشغيل `music_generate` المنفصلة
- [ComfyUI](/ar/providers/comfy)
- [مرجع التكوين](/ar/gateway/config-agents#agent-defaults) — تكوين `musicGenerationModel`
- [Google (Gemini)](/ar/providers/google)
- [MiniMax](/ar/providers/minimax)
- [النماذج](/ar/concepts/models) — تكوين النماذج والتحول عند الفشل
- [نظرة عامة على الأدوات](/ar/tools)
