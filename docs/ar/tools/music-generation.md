---
read_when:
    - توليد الموسيقى أو الصوت عبر الوكيل
    - إعداد موفّري ونماذج توليد الموسيقى
    - فهم معلمات أداة music_generate
sidebarTitle: Music generation
summary: أنشئ الموسيقى عبر music_generate ضمن سير عمل Google Lyria وMiniMax وComfyUI
title: توليد الموسيقى
x-i18n:
    generated_at: "2026-05-02T21:04:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

تتيح أداة `music_generate` للوكيل إنشاء موسيقى أو صوت عبر قدرة إنشاء الموسيقى
المشتركة مع المزوّدين المهيّئين — Google،
MiniMax، وComfyUI المهيّأ عبر سير العمل حاليًا.

بالنسبة لتشغيلات الوكيل المدعومة بجلسة، يبدأ OpenClaw إنشاء الموسيقى كمهمة
خلفية، ويتتبعها في سجل المهام، ثم يوقظ الوكيل مرة أخرى
عندما يكون المسار جاهزًا لكي يتمكن الوكيل من نشر الصوت النهائي مرة أخرى في
القناة الأصلية.

<Note>
لا تظهر الأداة المشتركة المضمّنة إلا عند توفر مزوّد واحد على الأقل لإنشاء الموسيقى.
إذا لم ترَ `music_generate` ضمن أدوات وكيلك،
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
      <Step title="اطلب من الوكيل">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        يستدعي الوكيل `music_generate` تلقائيًا. لا حاجة إلى
        قائمة سماح للأداة.
      </Step>
    </Steps>

    بالنسبة للسياقات المتزامنة المباشرة من دون تشغيل وكيل مدعوم بجلسة،
    تظل الأداة المضمّنة تتراجع إلى الإنشاء المضمّن وتعيد
    مسار الوسائط النهائي في نتيجة الأداة.

  </Tab>
  <Tab title="سير عمل ComfyUI">
    <Steps>
      <Step title="تهيئة سير العمل">
        هيّئ `plugins.entries.comfy.config.music` باستخدام JSON
        لسير العمل وعُقد الموجهات/الإخراج.
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

أمثلة على الموجهات:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## المزوّدون المدعومون

| المزوّد | النموذج الافتراضي          | مدخلات مرجعية | عناصر التحكم المدعومة                                        | المصادقة                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | ما يصل إلى صورة واحدة    | موسيقى أو صوت محددان بسير العمل                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | ما يصل إلى 10 صور  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | لا شيء             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` أو MiniMax OAuth     |

### مصفوفة القدرات

عقد الوضع الصريح المستخدم بواسطة `music_generate`، واختبارات العقد، والمسح
الحي المشترك:

| المزوّد | `generate` | `edit` | حد التحرير | مسارات البث الحي المشتركة                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | صورة واحدة    | ليس ضمن المسح المشترك؛ تغطيه `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 صور  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | لا شيء       | `generate`                                                                |

استخدم `action: "list"` لفحص المزوّدين والنماذج المشتركة المتاحة في
وقت التشغيل:

```text
/tool music_generate action=list
```

استخدم `action: "status"` لفحص مهمة الموسيقى النشطة المدعومة بجلسة:

```text
/tool music_generate action=status
```

مثال إنشاء مباشر:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## معاملات الأداة

<ParamField path="prompt" type="string" required>
  موجّه إنشاء الموسيقى. مطلوب من أجل `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  يعيد `"status"` مهمة الجلسة الحالية؛ ويفحص `"list"` المزوّدين.
</ParamField>
<ParamField path="model" type="string">
  تجاوز المزوّد/النموذج (مثل `google/lyria-3-pro-preview`،
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  كلمات اختيارية عندما يدعم المزوّد إدخال كلمات صريحًا.
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
<ParamField path="timeoutMs" type="number">مهلة اختيارية لطلب المزوّد بالميلي ثانية. تُرفع القيم الأقل من 10000ms إلى 10000ms ويُبلَّغ عنها في نتيجة الأداة.</ParamField>

<Note>
لا يدعم جميع المزوّدين جميع المعاملات. لا يزال OpenClaw يتحقق من الحدود
الصارمة مثل أعداد المدخلات قبل الإرسال. عندما يدعم مزوّد
المدة لكنه يستخدم حدًا أقصى أقصر من القيمة المطلوبة، يضبط OpenClaw
القيمة إلى أقرب مدة مدعومة. تُتجاهل التلميحات الاختيارية غير المدعومة فعليًا
مع تحذير عندما لا يستطيع المزوّد أو النموذج المحدد تنفيذها.
تبلّغ نتائج الأداة عن الإعدادات المطبّقة؛ ويلتقط `details.normalization`
أي ربط من المطلوب إلى المطبّق.
</Note>

## السلوك غير المتزامن

يعمل إنشاء الموسيقى المدعوم بجلسة كمهمة خلفية:

- **مهمة خلفية:** ينشئ `music_generate` مهمة خلفية، ويعيد استجابة
  بدء/مهمة فورًا، وينشر المسار النهائي لاحقًا في
  رسالة متابعة من الوكيل.
- **منع التكرار:** أثناء كون مهمة في حالة `queued` أو `running`، تعيد استدعاءات
  `music_generate` اللاحقة في الجلسة نفسها حالة المهمة بدلًا من
  بدء إنشاء آخر. استخدم `action: "status"` للتحقق صراحةً.
- **البحث عن الحالة:** يفحص `openclaw tasks list` أو `openclaw tasks show <taskId>`
  حالات الانتظار والتشغيل والحالات النهائية.
- **إيقاظ عند الاكتمال:** يحقن OpenClaw حدث اكتمال داخليًا مرة أخرى
  في الجلسة نفسها لكي يتمكن النموذج من كتابة المتابعة الموجهة للمستخدم
  بنفسه.
- **تلميح الموجّه:** تحصل أدوار المستخدم/اليدوية اللاحقة في الجلسة نفسها على
  تلميح تشغيل صغير عندما تكون مهمة موسيقى قيد التنفيذ بالفعل، بحيث لا يستدعي النموذج
  `music_generate` مرة أخرى بشكل أعمى.
- **تراجع بلا جلسة:** تعمل السياقات المباشرة/المحلية من دون جلسة وكيل
  حقيقية بشكل مضمّن وتعيد نتيجة الصوت النهائية في الدور نفسه.

### دورة حياة المهمة

| الحالة       | المعنى                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | أُنشئت المهمة، وهي تنتظر أن يقبلها المزوّد.                                           |
| `running`   | يعالج المزوّد الطلب (عادةً من 30 ثانية إلى 3 دقائق حسب المزوّد والمدة). |
| `succeeded` | المسار جاهز؛ يستيقظ الوكيل وينشره في المحادثة.                                 |
| `failed`    | خطأ من المزوّد أو انتهاء مهلة؛ يستيقظ الوكيل مع تفاصيل الخطأ.                                 |

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

### ترتيب اختيار المزوّد

يجرب OpenClaw المزوّدين بهذا الترتيب:

1. معامل `model` من استدعاء الأداة (إذا حدده الوكيل).
2. `musicGenerationModel.primary` من التهيئة.
3. `musicGenerationModel.fallbacks` بالترتيب.
4. الاكتشاف التلقائي باستخدام افتراضيات المزوّد المدعومة بالمصادقة فقط:
   - المزوّد الافتراضي الحالي أولًا؛
   - بقية مزوّدي إنشاء الموسيقى المسجلين بترتيب provider-id.

إذا فشل مزوّد، تُجرَّب المرشّح التالي تلقائيًا. إذا فشل الجميع،
يتضمن الخطأ تفاصيل من كل محاولة.

عيّن `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.

## ملاحظات المزوّدين

<AccordionGroup>
  <Accordion title="ComfyUI">
    يعتمد على سير العمل وعلى الرسم البياني المهيّأ بالإضافة إلى ربط العُقد
    لحقول الموجّه/الإخراج. يتصل Plugin `comfy` المضمّن
    بأداة `music_generate` المشتركة من خلال سجل مزوّدي
    إنشاء الموسيقى.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    يستخدم إنشاء Lyria 3 الدفعي. يدعم التدفق المضمّن الحالي
    الموجّه، ونص كلمات اختياريًا، وصورًا مرجعية اختيارية.
  </Accordion>
  <Accordion title="MiniMax">
    يستخدم نقطة نهاية `music_generation` الدُفعية. يدعم الموجّه، والكلمات الاختيارية،
    والوضع الآلي، وتوجيه المدة، وإخراج mp3 عبر
    مصادقة مفتاح API لـ `minimax` أو OAuth لـ `minimax-portal`.
  </Accordion>
</AccordionGroup>

## اختيار المسار المناسب

- **مدعوم بمزوّد مشترك** عندما تريد اختيار النموذج، وتجاوز فشل المزوّد،
  وتدفق المهمة/الحالة غير المتزامن المضمّن.
- **مسار Plugin (ComfyUI)** عندما تحتاج إلى رسم بياني مخصص لسير العمل أو إلى
  مزوّد ليس جزءًا من قدرة الموسيقى المضمّنة المشتركة.

إذا كنت تصحح سلوكًا خاصًا بـ ComfyUI، فراجع
[ComfyUI](/ar/providers/comfy). إذا كنت تصحح سلوك المزوّدين المشترك،
فابدأ بـ [Google (Gemini)](/ar/providers/google) أو
[MiniMax](/ar/providers/minimax).

## أوضاع قدرات المزوّد

يدعم عقد إنشاء الموسيقى المشترك إعلانات أوضاع صريحة:

- `generate` للإنشاء باستخدام موجّه فقط.
- `edit` عندما يتضمن الطلب صورة مرجعية واحدة أو أكثر.

ينبغي لتطبيقات المزوّد الجديدة تفضيل كتل الأوضاع الصريحة:

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
`supportsFormat` كافية **لإعلان** دعم التحرير. يجب على المزوّدين
إعلان `generate` و`edit` صراحةً لكي تتمكن الاختبارات الحية، واختبارات العقد،
وأداة `music_generate` المشتركة من التحقق من دعم الوضع
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

يحمّل هذا الملف الحي متغيرات بيئة المزوّد المفقودة من `~/.profile`، ويفضّل
مفاتيح API الحية/من البيئة على ملفات تعريف المصادقة المخزنة افتراضيًا، ويشغّل كلاً من
تغطية `generate` وتغطية `edit` المعلنة عندما يفعّل المزوّد وضع
التحرير. التغطية اليوم:

- `google`: `generate` بالإضافة إلى `edit`
- `minimax`: `generate` فقط
- `comfy`: تغطية Comfy حية منفصلة، وليست مسح المزوّدين المشترك

تغطية حية اختيارية لمسار موسيقى ComfyUI المضمّن:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

يغطي ملف Comfy المباشر أيضًا سير عمل الصور والفيديو في Comfy عند تهيئة تلك
الأقسام.

## ذات صلة

- [مهام الخلفية](/ar/automation/tasks) — تتبّع المهام لتشغيلات `music_generate` المنفصلة
- [ComfyUI](/ar/providers/comfy)
- [مرجع التهيئة](/ar/gateway/config-agents#agent-defaults) — تهيئة `musicGenerationModel`
- [Google (Gemini)](/ar/providers/google)
- [MiniMax](/ar/providers/minimax)
- [النماذج](/ar/concepts/models) — تهيئة النماذج والتجاوز عند الفشل
- [نظرة عامة على الأدوات](/ar/tools)
