---
read_when:
    - إنشاء الموسيقى أو الصوت عبر الوكيل
    - إعداد موفّري ونماذج توليد الموسيقى
    - فهم معاملات أداة music_generate
sidebarTitle: Music generation
summary: أنشئ موسيقى عبر `music_generate` ضمن تدفقات عمل ComfyUI وfal وGoogle Lyria وMiniMax وOpenRouter
title: توليد الموسيقى
x-i18n:
    generated_at: "2026-07-12T06:36:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

تنشئ أداة `music_generate` موسيقى أو صوتًا من خلال القدرة المشتركة
لتوليد الموسيقى، والمدعومة من ComfyUI وfal وGoogle وMiniMax و
OpenRouter.

<Note>
لا تظهر `music_generate` إلا عند توفر موفر واحد على الأقل لتوليد الموسيقى:
إما إعداد `agents.defaults.musicGenerationModel` صريح، أو موفر جرى تكوين
مصادقته (مثل تعيين مفتاح API).
</Note>

بالنسبة إلى عمليات تشغيل الوكيل المدعومة بجلسة، تبدأ `music_generate` كمهمة
في الخلفية، وتتتبّع التقدم في سجل المهام، ثم توقظ الوكيل عندما يصبح المقطع
جاهزًا كي يتمكن من إبلاغ المستخدم وإرفاق الصوت النهائي. يتبع وكيل الإكمال
عقد الرد المرئي للجلسة: رد نهائي تلقائي عند تكوينه، أو
`message(action="send")` عندما تتطلب الجلسة أداة الرسائل. إذا كانت جلسة
مقدم الطلب غير نشطة أو فشل إيقاظها، وظل الصوت المولّد غير مضمّن في الرد،
فيرسل OpenClaw إجراءً احتياطيًا مباشرًا متكرر التنفيذ بأمان يحتوي فقط على
الصوت المفقود.

## البدء السريع

<Tabs>
  <Tab title="مدعوم بموفر مشترك">
    <Steps>
      <Step title="تكوين المصادقة">
        عيّن مفتاح API لموفر واحد على الأقل — مثل
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
      <Step title="الطلب من الوكيل">
        _"أنشئ مقطع سينثبوب مبهجًا عن قيادة ليلية عبر مدينة
        مضاءة بالنيون."_

        يستدعي الوكيل `music_generate` تلقائيًا. لا حاجة إلى إدراج الأداة
        في قائمة السماح.
      </Step>
    </Steps>

    من دون عملية تشغيل وكيل مدعومة بجلسة (في السياقات المباشرة/المحلية)،
    تعمل الأداة ضمن السياق نفسه وتعيد مسار الوسائط النهائي في نتيجة الأداة
    ذاتها.

  </Tab>
  <Tab title="سير عمل ComfyUI">
    <Steps>
      <Step title="تكوين سير العمل">
        كوّن `plugins.entries.comfy.config.music` باستخدام ملف JSON لسير
        العمل وعقد المطالبة/الإخراج.
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

استخدم `action: "list"` لفحص الموفرين/النماذج المتاحة، و
`action: "status"` لفحص مهمة الموسيقى النشطة المدعومة بجلسة:

```text
/tool music_generate action=list
/tool music_generate action=status
```

مثال على التوليد المباشر:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## الموفرون المدعومون

| الموفر     | النموذج الافتراضي            | المدخلات المرجعية | عناصر التحكم المدعومة                                 | المصادقة                               |
| ---------- | ---------------------------- | ----------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | حتى صورة واحدة    | موسيقى أو صوت وفق تعريف سير العمل                     | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | لا يوجد           | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` أو `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | حتى 10 صور        | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | لا يوجد           | `lyrics`, `instrumental`, `format` (mp3 فقط)          | `MINIMAX_API_KEY` أو OAuth من MiniMax  |
| OpenRouter | `google/lyria-3-pro-preview` | حتى صورة واحدة    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

يسجّل MiniMax معرّفي موفر يشتركان في النماذج نفسها: `minimax` للمصادقة
بمفتاح API و`minimax-portal` لـ OAuth. تتبع مراجع النماذج مسار المصادقة
(`minimax/music-2.6` مقابل `minimax-portal/music-2.6`)؛ راجع
[MiniMax](/ar/providers/minimax#music-generation).

يتيح fal أيضًا `fal-ai/ace-step/prompt-to-audio` (بتنسيق wav، من دون كلمات،
ومن دون مفتاح تبديل للآلات الموسيقية فقط) و
`fal-ai/stable-audio-25/text-to-audio` (بتنسيق wav، وبمطالبة فقط) إلى جانب
نموذجه الافتراضي المدعوم من MiniMax. لا يُخرج نموذج Google الافتراضي
`lyria-3-clip-preview` إلا mp3؛ ويدعم `lyria-3-pro-preview` أيضًا wav.
يتيح MiniMax أيضًا `music-2.6-free` و`music-cover` و
`music-cover-free`. ويتيح OpenRouter أيضًا `google/lyria-3-clip-preview`.

### مصفوفة القدرات

عقد الأوضاع الصريح الذي تستخدمه `music_generate` واختبارات العقود والمسح
المباشر المشترك:

| الموفر     | `generate` | `edit` | حد التحرير | مسارات الاختبار المباشر المشتركة                                      |
| ---------- | :--------: | :----: | ---------- | ---------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | صورة واحدة | غير مشمول في المسح المشترك؛ يغطيه `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | لا يوجد    | `generate`                                                             |
| Google     |     ✓      |   ✓    | 10 صور     | `generate`, `edit`                                                     |
| MiniMax    |     ✓      |   —    | لا يوجد    | `generate`                                                             |
| OpenRouter |     ✓      |   ✓    | صورة واحدة | `generate`, `edit`                                                     |

## معاملات الأداة

<ParamField path="prompt" type="string" required>
  مطالبة توليد الموسيقى. مطلوبة لـ `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  يعيد `"status"` مهمة الجلسة الحالية؛ ويفحص `"list"` الموفرين.
</ParamField>
<ParamField path="model" type="string">
  تجاوز الموفر/النموذج (مثل `google/lyria-3-pro-preview`،
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  كلمات اختيارية عندما يدعم الموفر إدخال الكلمات صراحةً.
</ParamField>
<ParamField path="instrumental" type="boolean">
  طلب إخراج بالآلات الموسيقية فقط عندما يدعم الموفر ذلك.
</ParamField>
<ParamField path="image" type="string">
  مسار صورة مرجعية واحدة أو عنوان URL لها.
</ParamField>
<ParamField path="images" type="string[]">
  صور مرجعية متعددة (حتى 10 لدى الموفرين الداعمين).
</ParamField>
<ParamField path="durationSeconds" type="number">
  المدة المستهدفة بالثواني عندما يدعم الموفر تلميحات المدة.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  تلميح تنسيق الإخراج عندما يدعمه الموفر.
</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>

<Note>
لا يدعم جميع الموفرين كل المعاملات. مع ذلك، يتحقق OpenClaw من الحدود
القطعية، مثل أعداد المدخلات، قبل الإرسال. عندما يدعم موفر المدة لكنه يستخدم
حدًا أقصى أقصر من القيمة المطلوبة، يضبط OpenClaw القيمة إلى أقرب مدة
مدعومة. تُتجاهل التلميحات الاختيارية غير المدعومة فعليًا مع تحذير عندما
يتعذر على الموفر أو النموذج المحدد تطبيقها. تعرض نتائج الأداة الإعدادات
المطبقة؛ ويسجل `details.normalization` أي تحويل من القيمة المطلوبة إلى
القيمة المطبقة.
</Note>

المهل الزمنية لطلبات الموفر هي إعداد للمشغّل فقط. يستخدم OpenClaw
`agents.defaults.musicGenerationModel.timeoutMs` عند تكوينه، ويرفع القيم
الأقل من 120000ms إلى 120000ms، وإلا يعيّن مهلة طلبات الموفر افتراضيًا إلى
300000ms.

## السلوك غير المتزامن

يعمل توليد الموسيقى المدعوم بجلسة كمهمة في الخلفية:

- **مهمة في الخلفية:** تنشئ `music_generate` مهمة في الخلفية، وتعيد فورًا
  استجابة بدء/مهمة، ثم تنشر المقطع النهائي لاحقًا في رسالة متابعة من
  الوكيل.
- **منع التكرار:** ما دامت المهمة في حالة `queued` أو `running`، تعيد
  استدعاءات `music_generate` اللاحقة في الجلسة نفسها حالة المهمة بدلًا من
  بدء عملية توليد أخرى. استخدم `action: "status"` للتحقق صراحةً. كما يُزال
  تكرار الطلب المطابق المكتمل حديثًا لمدة دقيقتين.
- **البحث عن الحالة:** يفحص `openclaw tasks list` أو
  `openclaw tasks show <taskId>` حالات الانتظار والتشغيل والحالات النهائية.
- **إيقاظ الإكمال:** يحقن OpenClaw حدث إكمال داخليًا مرة أخرى في الجلسة
  نفسها كي يتمكن النموذج من كتابة المتابعة الموجهة إلى المستخدم بنفسه.
- **تلميح المطالبة:** تتلقى دورات المستخدم/الدورات اليدوية اللاحقة في
  الجلسة نفسها تلميحًا صغيرًا أثناء التشغيل عندما تكون مهمة موسيقى قيد
  التنفيذ بالفعل، كي لا يستدعي النموذج `music_generate` مرة أخرى دون
  تمييز.
- **الإجراء الاحتياطي عند غياب الجلسة:** تعمل السياقات المباشرة/المحلية
  التي لا تحتوي على جلسة وكيل فعلية ضمن السياق نفسه، وتعيد نتيجة الصوت
  النهائية في الدورة ذاتها.

### دورة حياة المهمة

تعرض مهمة الموسيقى الحالات نفسها التي يعرضها سجل المهام العام (راجع
[المهام في الخلفية](/ar/automation/tasks#task-lifecycle) للاطلاع على آلة
الحالات الكاملة، بما في ذلك `timed_out` و`cancelled` و`lost`). تمر معظم
عمليات تشغيل الموسيقى عبر:

| الحالة      | المعنى                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------- |
| `queued`    | أُنشئت المهمة، وهي تنتظر أن يقبلها الموفر.                                                  |
| `running`   | يعالج الموفر الطلب (عادةً من 30 ثانية إلى 3 دقائق حسب الموفر والمدة).                       |
| `succeeded` | المقطع جاهز؛ يستيقظ الوكيل وينشره في المحادثة.                                              |
| `failed`    | خطأ من الموفر أو انتهاء المهلة؛ يستيقظ الوكيل ومعه تفاصيل الخطأ.                            |

تحقق من الحالة عبر CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## التكوين

### اختيار النموذج

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### ترتيب اختيار الموفر

يجرّب OpenClaw الموفرين بالترتيب التالي:

1. معامل `model` من استدعاء الأداة (إذا حدّد الوكيل واحدًا).
2. `musicGenerationModel.primary` من التكوين.
3. إدخالات `musicGenerationModel.fallbacks` بالترتيب.
4. الاكتشاف التلقائي باستخدام الإعدادات الافتراضية للموفرين المدعومين
   بالمصادقة فقط:
   - موفر نموذج النص الافتراضي الحالي أولًا، إذا كان يتيح أيضًا توليد
     الموسيقى؛
   - بقية موفري توليد الموسيقى المسجلين، مرتبين أبجديًا حسب معرّف الموفر.

إذا فشل موفر، تُجرّب الجهة المرشحة التالية تلقائيًا. وإذا فشلت جميعها،
يتضمن الخطأ تفاصيل كل محاولة.

عيّن `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.

## ملاحظات الموفرين

<AccordionGroup>
  <Accordion title="ComfyUI">
    يعتمد على سير العمل، ويتوقف على الرسم البياني المُهيأ إلى جانب تعيين العُقد
    لحقول الموجّه/الإخراج. يتكامل Plugin ‏`comfy` المضمّن مع أداة
    `music_generate` المشتركة عبر سجل موفّري توليد الموسيقى.
  </Accordion>
  <Accordion title="fal">
    يستخدم نقاط نهاية نماذج fal عبر مسار مصادقة الموفّر المشترك. يستخدم
    الموفّر المضمّن `fal-ai/minimax-music/v2.6` افتراضيًا، ويتيح أيضًا
    `fal-ai/ace-step/prompt-to-audio` و
    `fal-ai/stable-audio-25/text-to-audio` لطلبات تحويل الموجّه إلى صوت.
    تقتصر الكلمات ووضع الموسيقى الآلية على نموذج MiniMax؛ أما النموذجان
    الآخران فيعتمدان على الموجّه فقط.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    يستخدم التوليد الدفعي عبر Lyria 3. يدعم المسار المضمّن الحالي
    الموجّه ونص كلمات اختياريًا وصورًا مرجعية اختياريًا. يُخرج نموذج
    `lyria-3-clip-preview` الافتراضي تنسيق mp3 فقط؛ كما يدعم نموذج
    `lyria-3-pro-preview` تنسيق wav.
  </Accordion>
  <Accordion title="MiniMax">
    يستخدم نقطة النهاية الدفعية `music_generation`. يدعم الموجّه والكلمات
    الاختيارية ووضع الموسيقى الآلية وإخراج mp3، إما عبر مصادقة مفتاح API
    ‏`minimax` أو OAuth ‏`minimax-portal`. ويتيح أيضًا نماذج
    `music-2.6-free` و`music-cover` و`music-cover-free`.
  </Accordion>
  <Accordion title="OpenRouter">
    يستخدم إخراج الصوت من إكمالات محادثة OpenRouter مع تفعيل البث. يستخدم
    الموفّر المضمّن `google/lyria-3-pro-preview` افتراضيًا، ويتيح أيضًا
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## اختيار المسار المناسب

- **المسار المشترك المدعوم بموفّر** عندما تريد اختيار النموذج، والتبديل
  الاحتياطي بين الموفّرين، وتدفق المهام/الحالة غير المتزامن المضمّن.
- **مسار Plugin ‏(ComfyUI)** عندما تحتاج إلى رسم بياني مخصص لسير العمل أو
  موفّر ليس جزءًا من قدرة الموسيقى المشتركة المضمّنة.

إذا كنت تصحح سلوكًا خاصًا بـ ComfyUI، فراجع
[ComfyUI](/ar/providers/comfy). وإذا كنت تصحح سلوك الموفّر المشترك،
فابدأ بـ [fal](/ar/providers/fal) أو [Google (Gemini)](/ar/providers/google) أو
[MiniMax](/ar/providers/minimax) أو [OpenRouter](/ar/providers/openrouter).

## أوضاع قدرات الموفّر

يدعم عقد توليد الموسيقى المشترك إعلانات صريحة للأوضاع:

- `generate` للتوليد باستخدام الموجّه فقط.
- `edit` عندما يتضمن الطلب صورة مرجعية واحدة أو أكثر.

ينبغي أن تفضّل تطبيقات الموفّرين الجديدة كتل الأوضاع الصريحة:

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

الحقول المسطحة القديمة مثل `maxInputImages` و`supportsLyrics` و
`supportsFormat` **ليست** كافية للإعلان عن دعم التحرير. ينبغي للموفّرين
إعلان `generate` و`edit` صراحةً كي تتمكن الاختبارات الحية واختبارات
العقد وأداة `music_generate` المشتركة من التحقق من دعم الأوضاع بصورة
حتمية.

## الاختبارات الحية

تغطية حية اختيارية للموفّرين المشتركين المضمّنين (fal وGoogle وMiniMax
وOpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

غلاف المستودع المكافئ، الذي يشغّل ملف الاختبار نفسه:

```bash
pnpm test:live:media:music
```

يستخدم ملف الاختبارات الحية هذا متغيرات بيئة الموفّر المُصدَّرة مسبقًا
قبل ملفات تعريف المصادقة المخزّنة افتراضيًا، ويشغّل تغطية كل من `generate`
و`edit` المُعلن عنها عندما يفعّل الموفّر وضع التحرير. التغطية الحالية:

- `google`: ‏`generate` بالإضافة إلى `edit`
- `fal`: ‏`generate` فقط
- `minimax`: ‏`generate` فقط
- `openrouter`: ‏`generate` بالإضافة إلى `edit`
- `comfy`: تغطية حية منفصلة لـ Comfy، وليست ضمن الفحص الشامل للموفّرين المشتركين

تغطية حية اختيارية لمسار موسيقى ComfyUI المضمّن:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

يغطي ملف Comfy الحي أيضًا مسارات عمل الصور والفيديو في comfy عند تهيئة
تلك الأقسام.

## ذو صلة

- [المهام الخلفية](/ar/automation/tasks) — تتبّع المهام لعمليات `music_generate` المنفصلة
- [ComfyUI](/ar/providers/comfy)
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — إعداد `musicGenerationModel`
- [Google (Gemini)](/ar/providers/google)
- [MiniMax](/ar/providers/minimax)
- [النماذج](/ar/concepts/models) — إعداد النماذج والتبديل الاحتياطي
- [نظرة عامة على الأدوات](/ar/tools)
