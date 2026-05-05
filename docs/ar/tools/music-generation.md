---
read_when:
    - توليد الموسيقى أو الصوت عبر الوكيل
    - تكوين موفّري ونماذج توليد الموسيقى
    - فهم معلمات أداة music_generate
sidebarTitle: Music generation
summary: إنشاء الموسيقى عبر music_generate ضمن سير عمل Google Lyria وMiniMax وComfyUI
title: توليد الموسيقى
x-i18n:
    generated_at: "2026-05-05T06:20:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

تتيح أداة `music_generate` للوكيل إنشاء موسيقى أو صوت من خلال
قدرة إنشاء الموسيقى المشتركة مع الموفرين المُكوَّنين، وهم اليوم Google
وMiniMax وComfyUI المُكوَّن عبر سير العمل.

بالنسبة لتشغيلات الوكيل المدعومة بالجلسات، يبدأ OpenClaw إنشاء الموسيقى
كمهمة في الخلفية، ويتتبعها في سجل المهام، ثم يوقظ الوكيل مرة أخرى
عندما يكون المقطع جاهزًا لكي يتمكن الوكيل من إخبار المستخدم وإرفاق
الصوت النهائي. في محادثات المجموعات/القنوات التي تستخدم تسليمًا مرئيًا
عبر أداة الرسائل فقط، يمرر الوكيل النتيجة عبر أداة الرسائل. إذا كتب
وكيل الإكمال ردًا نهائيًا خاصًا فقط، يرجع OpenClaw إلى إرسال مباشر عبر
القناة مع الوسائط المولدة. تنبيه الإكمال يحذر الوكيل صراحةً من أن
الردود النهائية العادية تكون خاصة في تلك المسارات.

<Note>
لا تظهر الأداة المشتركة المدمجة إلا عند توفر موفر واحد على الأقل لإنشاء
الموسيقى. إذا لم ترَ `music_generate` ضمن أدوات وكيلك، فقم بتكوين
`agents.defaults.musicGenerationModel` أو إعداد مفتاح API لموفر.
</Note>

## البدء السريع

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        عيّن مفتاح API لموفر واحد على الأقل، على سبيل المثال
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

        يستدعي الوكيل `music_generate` تلقائيًا. ليست هناك حاجة إلى
        قائمة سماح للأداة.
      </Step>
    </Steps>

    بالنسبة للسياقات المتزامنة المباشرة من دون تشغيل وكيل مدعوم بجلسة،
    تظل الأداة المدمجة ترجع إلى الإنشاء المضمن وتعيد مسار الوسائط
    النهائي في نتيجة الأداة.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        قم بتكوين `plugins.entries.comfy.config.music` باستخدام
        JSON لسير العمل وعُقد الموجه/الإخراج.
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

أمثلة على الموجهات:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## الموفرون المدعومون

| الموفر | النموذج الافتراضي          | المدخلات المرجعية | عناصر التحكم المدعومة                                        | المصادقة                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | حتى صورة واحدة    | موسيقى أو صوت يحدده سير العمل                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | حتى 10 صور  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | لا شيء             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` أو MiniMax OAuth     |

### مصفوفة القدرات

عقد الوضع الصريح الذي تستخدمه `music_generate` واختبارات العقد
والمسح الحي المشترك:

| الموفر | `generate` | `edit` | حد التحرير | مسارات الحي المشتركة                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | صورة واحدة    | ليس ضمن المسح المشترك؛ تغطيه `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 صور  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | لا شيء       | `generate`                                                                |

استخدم `action: "list"` لفحص الموفرين والنماذج المشتركة المتاحة في
وقت التشغيل:

```text
/tool music_generate action=list
```

استخدم `action: "status"` لفحص مهمة الموسيقى النشطة المدعومة بالجلسة:

```text
/tool music_generate action=status
```

مثال إنشاء مباشر:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## معاملات الأداة

<ParamField path="prompt" type="string" required>
  موجه إنشاء الموسيقى. مطلوب لـ `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  يعيد `"status"` مهمة الجلسة الحالية؛ ويفحص `"list"` الموفرين.
</ParamField>
<ParamField path="model" type="string">
  تجاوز الموفر/النموذج (مثل `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  كلمات اختيارية عندما يدعم الموفر إدخال كلمات صريحًا.
</ParamField>
<ParamField path="instrumental" type="boolean">
  اطلب إخراجًا آليًا فقط عندما يدعم الموفر ذلك.
</ParamField>
<ParamField path="image" type="string">
  مسار أو URL لصورة مرجعية واحدة.
</ParamField>
<ParamField path="images" type="string[]">
  صور مرجعية متعددة (حتى 10 لدى الموفرين الداعمين).
</ParamField>
<ParamField path="durationSeconds" type="number">
  مدة مستهدفة بالثواني عندما يدعم الموفر تلميحات المدة.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  تلميح تنسيق الإخراج عندما يدعمه الموفر.
</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="timeoutMs" type="number">مهلة اختيارية لطلب الموفر بالمللي ثانية. القيم الأقل من 10000ms تُرفع إلى 10000ms ويُبلّغ عنها في نتيجة الأداة.</ParamField>

<Note>
لا يدعم كل الموفرين كل المعاملات. يظل OpenClaw يتحقق من الحدود الصارمة
مثل أعداد المدخلات قبل الإرسال. عندما يدعم موفر المدة لكنه يستخدم حدًا
أقصى أقصر من القيمة المطلوبة، يضبط OpenClaw القيمة إلى أقرب مدة
مدعومة. يتم تجاهل التلميحات الاختيارية غير المدعومة فعليًا مع تحذير
عندما لا يستطيع الموفر أو النموذج المحدد الالتزام بها. تبلغ نتائج
الأداة عن الإعدادات المطبقة؛ ويلتقط `details.normalization` أي ربط من
المطلوب إلى المطبق.
</Note>

## السلوك غير المتزامن

يعمل إنشاء الموسيقى المدعوم بالجلسة كمهمة في الخلفية:

- **مهمة في الخلفية:** تنشئ `music_generate` مهمة في الخلفية، وتعيد
  استجابة بدء/مهمة فورًا، وتنشر المقطع النهائي لاحقًا في رسالة متابعة
  من الوكيل.
- **منع التكرار:** بينما تكون المهمة `queued` أو `running`، تعيد
  استدعاءات `music_generate` اللاحقة في الجلسة نفسها حالة المهمة بدلًا من
  بدء إنشاء آخر. استخدم `action: "status"` للتحقق صراحةً.
- **البحث عن الحالة:** يفحص `openclaw tasks list` أو `openclaw tasks show <taskId>`
  الحالات في قائمة الانتظار والجارية والنهائية.
- **تنبيه الإكمال:** يحقن OpenClaw حدث إكمال داخليًا مرة أخرى في
  الجلسة نفسها حتى يتمكن النموذج من كتابة المتابعة الظاهرة للمستخدم
  بنفسه.
- **تلميح الموجه:** تحصل أدوار المستخدم/اليدوية اللاحقة في الجلسة نفسها
  على تلميح وقت تشغيل صغير عندما تكون مهمة موسيقى قيد التنفيذ بالفعل،
  حتى لا يستدعي النموذج `music_generate` مرة أخرى بلا تمييز.
- **الرجوع عند عدم وجود جلسة:** تعمل السياقات المباشرة/المحلية من دون
  جلسة وكيل حقيقية بشكل مضمن وتعيد نتيجة الصوت النهائية في الدور نفسه.

### دورة حياة المهمة

| الحالة       | المعنى                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | أُنشئت المهمة، وتنتظر أن يقبلها الموفر.                                           |
| `running`   | الموفر يعالج الطلب (عادةً من 30 ثانية إلى 3 دقائق حسب الموفر والمدة). |
| `succeeded` | المقطع جاهز؛ يستيقظ الوكيل وينشره في المحادثة.                                 |
| `failed`    | خطأ من الموفر أو انتهاء المهلة؛ يستيقظ الوكيل مع تفاصيل الخطأ.                                 |

تحقق من الحالة من CLI:

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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### ترتيب اختيار الموفر

يحاول OpenClaw استخدام الموفرين بهذا الترتيب:

1. معامل `model` من استدعاء الأداة (إذا حدده الوكيل).
2. `musicGenerationModel.primary` من التكوين.
3. `musicGenerationModel.fallbacks` بالترتيب.
4. الاكتشاف التلقائي باستخدام افتراضيات الموفر المدعومة بالمصادقة فقط:
   - الموفر الافتراضي الحالي أولًا؛
   - الموفرون المسجلون المتبقون لإنشاء الموسيقى بترتيب معرف الموفر.

إذا فشل موفر، تتم تجربة المرشح التالي تلقائيًا. إذا فشل الجميع، يتضمن
الخطأ تفاصيل كل محاولة.

عيّن `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.

## ملاحظات الموفرين

<AccordionGroup>
  <Accordion title="ComfyUI">
    يعتمد على سير العمل ويتوقف على المخطط المُكوَّن إضافة إلى ربط العقد
    لحقول الموجه/الإخراج. يتصل Plugin `comfy` المضمن بأداة
    `music_generate` المشتركة من خلال سجل موفري إنشاء الموسيقى.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    يستخدم إنشاء الدُفعات في Lyria 3. يدعم التدفق المضمن الحالي
    الموجه ونص الكلمات الاختياري والصور المرجعية الاختيارية.
  </Accordion>
  <Accordion title="MiniMax">
    يستخدم نقطة النهاية الدُفعية `music_generation`. يدعم الموجه
    والكلمات الاختيارية ووضع الموسيقى الآلية وتوجيه المدة وإخراج mp3
    عبر مصادقة مفتاح API إما `minimax` أو OAuth لـ `minimax-portal`.
  </Accordion>
</AccordionGroup>

## اختيار المسار المناسب

- **مدعوم بموفر مشترك** عندما تريد اختيار النموذج، والتبديل عند فشل
  الموفر، وتدفق المهمة/الحالة غير المتزامن المدمج.
- **مسار Plugin (ComfyUI)** عندما تحتاج إلى مخطط سير عمل مخصص أو إلى
  موفر ليس جزءًا من قدرة الموسيقى المشتركة المضمنة.

إذا كنت تصحح سلوكًا خاصًا بـ ComfyUI، فراجع
[ComfyUI](/ar/providers/comfy). وإذا كنت تصحح سلوك موفر مشترك، فابدأ بـ
[Google (Gemini)](/ar/providers/google) أو
[MiniMax](/ar/providers/minimax).

## أوضاع قدرات الموفر

يدعم عقد إنشاء الموسيقى المشترك إعلانات أوضاع صريحة:

- `generate` للإنشاء باستخدام الموجه فقط.
- `edit` عندما يتضمن الطلب صورة مرجعية واحدة أو أكثر.

ينبغي لتطبيقات الموفرين الجديدة تفضيل كتل الأوضاع الصريحة:

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
`supportsFormat` ليست **كافية** للإعلان عن دعم التحرير. ينبغي للموفرين
إعلان `generate` و`edit` صراحةً حتى تتمكن الاختبارات الحية، واختبارات
العقد، وأداة `music_generate` المشتركة من التحقق من دعم الأوضاع بشكل
حتمي.

## الاختبارات الحية

تغطية حية اختيارية للموفرين المشتركين المضمنين:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

غلاف المستودع:

```bash
pnpm test:live:media music
```

يحمّل هذا الملف الحي متغيرات بيئة الموفر المفقودة من `~/.profile`،
ويفضل مفاتيح API الحية/البيئية على ملفات تعريف المصادقة المخزنة
افتراضيًا، ويشغّل تغطية كل من `generate` و`edit` المعلنة عندما يفعّل
الموفر وضع التحرير. التغطية اليوم:

- `google`: `generate` بالإضافة إلى `edit`
- `minimax`: `generate` فقط
- `comfy`: تغطية حية منفصلة لـ Comfy، وليست فحص المزوّدين المشترك

تغطية حية اختيارية لمسار موسيقى ComfyUI المضمّن:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

يغطي ملف Comfy الحي أيضًا سير عمل الصور والفيديو في comfy عند تكوين تلك
الأقسام.

## ذات صلة

- [المهام الخلفية](/ar/automation/tasks) — تتبّع المهام لتشغيلات `music_generate` المنفصلة
- [ComfyUI](/ar/providers/comfy)
- [مرجع التكوين](/ar/gateway/config-agents#agent-defaults) — تكوين `musicGenerationModel`
- [Google (Gemini)](/ar/providers/google)
- [MiniMax](/ar/providers/minimax)
- [النماذج](/ar/concepts/models) — تكوين النماذج وتجاوز الفشل
- [نظرة عامة على الأدوات](/ar/tools)
