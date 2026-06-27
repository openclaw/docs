---
read_when:
    - توليد الموسيقى أو الصوت عبر الوكيل
    - إعداد موفّري ونماذج توليد الموسيقى
    - فهم معاملات أداة music_generate
sidebarTitle: Music generation
summary: أنشئ الموسيقى عبر music_generate ضمن تدفقات عمل ComfyUI وfal وGoogle Lyria وMiniMax وOpenRouter
title: توليد الموسيقى
x-i18n:
    generated_at: "2026-06-27T18:43:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

تتيح أداة `music_generate` للوكيل إنشاء موسيقى أو صوت عبر
إمكانات إنشاء الموسيقى المشتركة مع المزوّدين المُهيّئين — ComfyUI،
fal، Google، MiniMax، وOpenRouter حاليًا.

بالنسبة إلى تشغيلات الوكيل المدعومة بجلسة، يبدأ OpenClaw إنشاء الموسيقى
كمهمة في الخلفية، ويتتبعها في سجل المهام، ثم يوقظ الوكيل مرة أخرى
عندما يصبح المقطع جاهزًا حتى يتمكن الوكيل من إخبار المستخدم وإرفاق
الصوت النهائي. يتبع وكيل الإكمال وضع الرد المرئي العادي للجلسة:
تسليم الرد النهائي تلقائيًا عند تهيئته، أو `message(action="send")`
عندما تتطلب الجلسة أداة الرسائل. إذا كانت جلسة الطالب غير نشطة
أو فشلت إفاقتها النشطة، وكان بعض الصوت المُنشأ لا يزال مفقودًا
من رد الإكمال، يرسل OpenClaw احتياطًا مباشرًا قابلًا للتكرار بأمان
يتضمن الصوت المفقود فقط.

<Note>
لا تظهر الأداة المشتركة المضمّنة إلا عند توفر مزوّد واحد على الأقل لإنشاء الموسيقى.
إذا لم ترَ `music_generate` ضمن أدوات وكيلك، فقم بتهيئة
`agents.defaults.musicGenerationModel` أو إعداد مفتاح API لأحد المزوّدين.
</Note>

## البدء السريع

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        عيّن مفتاح API لمزوّد واحد على الأقل — مثلًا
        `GEMINI_API_KEY` أو `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pick a default model (optional)">
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
      <Step title="Ask the agent">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        يستدعي الوكيل `music_generate` تلقائيًا. لا حاجة إلى
        قائمة سماح للأداة.
      </Step>
    </Steps>

    بالنسبة إلى السياقات المتزامنة المباشرة من دون تشغيل وكيل مدعوم بجلسة،
    تظل الأداة المضمّنة ترجع إلى الإنشاء المضمّن وتعيد
    مسار الوسائط النهائي في نتيجة الأداة.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        قم بتهيئة `plugins.entries.comfy.config.music` باستخدام سير عمل
        JSON وعُقد المطالبة/الإخراج.
      </Step>
      <Step title="Cloud auth (optional)">
        بالنسبة إلى Comfy Cloud، عيّن `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Call the tool">
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

| المزوّد   | النموذج الافتراضي                | مُدخلات مرجعية | عناصر التحكم المدعومة                                    | المصادقة                                   |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | حتى صورة واحدة    | موسيقى أو صوت حسب تعريف سير العمل                       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | لا شيء             | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` أو `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | حتى 10 صور  | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | لا شيء             | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` أو MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | حتى صورة واحدة    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### مصفوفة الإمكانات

عقد الوضع الصريح الذي تستخدمه `music_generate`، واختبارات العقد، والمسح
المباشر المشترك:

| المزوّد   | `generate` | `edit` | حد التعديل | المسارات المباشرة المشتركة                                                         |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | صورة واحدة    | غير موجود في المسح المشترك؛ تغطيه `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | لا شيء       | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 صور  | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | لا شيء       | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | صورة واحدة    | `generate`, `edit`                                                        |

استخدم `action: "list"` لفحص المزوّدين والنماذج المشتركة المتاحة في
وقت التشغيل:

```text
/tool music_generate action=list
```

استخدم `action: "status"` لفحص مهمة الموسيقى النشطة المدعومة بجلسة:

```text
/tool music_generate action=status
```

مثال على الإنشاء المباشر:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## معاملات الأداة

<ParamField path="prompt" type="string" required>
  مطالبة إنشاء الموسيقى. مطلوبة من أجل `action: "generate"`.
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
  اطلب إخراجًا آليًا فقط عندما يدعمه المزوّد.
</ParamField>
<ParamField path="image" type="string">
  مسار صورة مرجعية واحدة أو URL.
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

<Note>
لا يدعم كل المزوّدين كل المعاملات. لا يزال OpenClaw يتحقق من الحدود
الصارمة مثل أعداد المُدخلات قبل الإرسال. عندما يدعم مزوّد المدة لكنه
يستخدم حدًا أقصى أقصر من القيمة المطلوبة، يقيّد OpenClaw القيمة إلى
أقرب مدة مدعومة. يتم تجاهل التلميحات الاختيارية غير المدعومة فعلًا
مع تحذير عندما يتعذر على المزوّد أو النموذج المحدد احترامها.
تبلغ نتائج الأداة عن الإعدادات المطبّقة؛ ويلتقط `details.normalization`
أي ربط من المطلوب إلى المطبّق.
</Note>

مهلات طلبات المزوّد هي تهيئة للمشغّل فقط. يستخدم OpenClaw
`agents.defaults.musicGenerationModel.timeoutMs` عند تهيئته، ويرفع القيم
الأقل من 120000ms إلى 120000ms، وإلا فيجعل مهلات طلبات المزوّد افتراضيًا
300000ms.

## السلوك غير المتزامن

يعمل إنشاء الموسيقى المدعوم بجلسة كمهمة في الخلفية:

- **مهمة في الخلفية:** تنشئ `music_generate` مهمة في الخلفية، وتعيد
  استجابة بدء/مهمة فورًا، وتنشر المقطع النهائي لاحقًا في
  رسالة وكيل لاحقة.
- **منع التكرار:** بينما تكون المهمة `queued` أو `running`، تعيد استدعاءات
  `music_generate` اللاحقة في الجلسة نفسها حالة المهمة بدلًا من
  بدء إنشاء آخر. استخدم `action: "status"` للتحقق صراحةً.
- **البحث عن الحالة:** يفحص `openclaw tasks list` أو `openclaw tasks show <taskId>`
  الحالات المنتظرة والجارية والنهائية.
- **إفاقة الإكمال:** يحقن OpenClaw حدث إكمال داخليًا مرة أخرى
  في الجلسة نفسها حتى يتمكن النموذج من كتابة المتابعة الموجّهة للمستخدم
  بنفسه.
- **تلميح المطالبة:** تحصل أدوار المستخدم/اليدوية اللاحقة في الجلسة نفسها
  على تلميح تشغيل صغير عندما تكون مهمة موسيقى قيد التنفيذ بالفعل، حتى لا
  يستدعي النموذج `music_generate` مرة أخرى دون تمييز.
- **احتياطي بلا جلسة:** تعمل السياقات المباشرة/المحلية من دون
  جلسة وكيل حقيقية بشكل مضمّن وتعيد نتيجة الصوت النهائية في الدور نفسه.

### دورة حياة المهمة

| الحالة       | المعنى                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | تم إنشاء المهمة، وهي تنتظر أن يقبلها المزوّد.                                           |
| `running`   | يعالج المزوّد الطلب (عادةً من 30 ثانية إلى 3 دقائق حسب المزوّد والمدة). |
| `succeeded` | المقطع جاهز؛ يستيقظ الوكيل وينشره في المحادثة.                                 |
| `failed`    | خطأ من المزوّد أو انتهاء المهلة؛ يستيقظ الوكيل مع تفاصيل الخطأ.                                 |

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
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
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
   - بقية مزوّدي إنشاء الموسيقى المسجلين بترتيب معرّف المزوّد.

إذا فشل مزوّد، تتم تجربة المرشح التالي تلقائيًا. إذا فشل الجميع،
يتضمن الخطأ تفاصيل من كل محاولة.

عيّن `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.

## ملاحظات المزوّدين

<AccordionGroup>
  <Accordion title="ComfyUI">
    يعتمد على سير العمل وعلى الرسم البياني المُهيأ مع ربط العُقد
    لحقول المطالبة/الإخراج. يتصل Plugin `comfy` المضمّن
    بأداة `music_generate` المشتركة عبر سجل مزوّدي إنشاء الموسيقى.
  </Accordion>
  <Accordion title="fal">
    يستخدم نقاط نهاية نموذج fal عبر مسار مصادقة المزوّد المشترك. يجعل
    المزوّد المضمّن `fal-ai/minimax-music/v2.6` افتراضيًا ويعرض أيضًا
    `fal-ai/ace-step/prompt-to-audio` و
    `fal-ai/stable-audio-25/text-to-audio` لطلبات تحويل المطالبة إلى صوت.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    يستخدم إنشاء الدُفعات في Lyria 3. يدعم التدفق المضمّن الحالي
    المطالبة، ونص الكلمات الاختياري، والصور المرجعية الاختيارية.
  </Accordion>
  <Accordion title="MiniMax">
    يستخدم نقطة نهاية الدُفعات `music_generation`. يدعم المطالبة والكلمات
    الاختيارية والوضع الآلي وإخراج mp3 عبر مصادقة مفتاح API لـ `minimax`
    أو OAuth لـ `minimax-portal`.
  </Accordion>
  <Accordion title="OpenRouter">
    يستخدم إخراج صوت إكمالات دردشة OpenRouter مع تفعيل البث. يجعل
    المزوّد المضمّن `google/lyria-3-pro-preview` افتراضيًا ويعرض أيضًا
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## اختيار المسار المناسب

- **مدعوم بمزوّد مشترك** عندما تريد اختيار النموذج، وتجاوز فشل المزوّد،
  وتدفق المهمة/الحالة غير المتزامن المضمّن.
- **مسار Plugin ‏(ComfyUI)** عندما تحتاج إلى رسم بياني مخصص لسير العمل أو
  مزوّد ليس جزءًا من إمكانات الموسيقى المشتركة المضمّنة.

إذا كنت تصحّح سلوكًا خاصًا بـ ComfyUI، فراجع
[ComfyUI](/ar/providers/comfy). وإذا كنت تصحّح سلوك المزوّدات المشتركة،
فابدأ بـ [fal](/ar/providers/fal)، أو [Google (Gemini)](/ar/providers/google)،
أو [MiniMax](/ar/providers/minimax)، أو [OpenRouter](/ar/providers/openrouter).

## أوضاع إمكانات المزوّد

يدعم عقد إنشاء الموسيقى المشترك تصريحات أوضاع صريحة:

- `generate` للإنشاء بالاعتماد على المطالبة فقط.
- `edit` عندما يتضمن الطلب صورة مرجعية واحدة أو أكثر.

ينبغي لتطبيقات المزوّدات الجديدة تفضيل كتل الأوضاع الصريحة:

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

الحقول المسطّحة القديمة مثل `maxInputImages` و`supportsLyrics` و
`supportsFormat` **ليست** كافية للإعلان عن دعم التحرير. ينبغي للمزوّدات
التصريح بـ `generate` و`edit` صراحةً حتى تتمكن الاختبارات المباشرة،
واختبارات العقد، وأداة `music_generate` المشتركة من التحقق من دعم الأوضاع
بشكل حتمي.

## الاختبارات المباشرة

تغطية مباشرة اختيارية للمزوّدات المشتركة المضمّنة:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

مغلّف المستودع:

```bash
pnpm test:live:media music
```

يستخدم ملف الاختبار المباشر هذا متغيرات بيئة المزوّد المصدّرة مسبقًا قبل
ملفات تعريف المصادقة المخزّنة افتراضيًا، ويشغّل تغطية `generate` وتغطية
`edit` المصرّح بها عندما يفعّل المزوّد وضع التحرير. التغطية اليوم:

- `google`: `generate` بالإضافة إلى `edit`
- `fal`: `generate` فقط
- `minimax`: `generate` فقط
- `openrouter`: `generate` بالإضافة إلى `edit`
- `comfy`: تغطية Comfy مباشرة منفصلة، وليست جزءًا من فحص المزوّدات المشترك

تغطية مباشرة اختيارية لمسار موسيقى ComfyUI المضمّن:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

يغطي ملف Comfy المباشر أيضًا سير عمل الصور والفيديو في comfy عندما تكون تلك
الأقسام مهيّأة.

## ذات صلة

- [المهام الخلفية](/ar/automation/tasks) — تتبّع المهام لتشغيلات `music_generate` المنفصلة
- [ComfyUI](/ar/providers/comfy)
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — إعداد `musicGenerationModel`
- [Google (Gemini)](/ar/providers/google)
- [MiniMax](/ar/providers/minimax)
- [النماذج](/ar/concepts/models) — إعداد النماذج وتجاوز الأعطال
- [نظرة عامة على الأدوات](/ar/tools)
