---
read_when:
    - توليد الموسيقى أو الصوت عبر الوكيل
    - تهيئة مزوّدي ونماذج توليد الموسيقى
    - فهم معاملات الأداة `music_generate`
sidebarTitle: Music generation
summary: ولّد الموسيقى عبر `music_generate` باستخدام Google Lyria وMiniMax وسير عمل ComfyUI
title: توليد الموسيقى
x-i18n:
    generated_at: "2026-04-26T11:42:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

تتيح الأداة `music_generate` للوكيل إنشاء الموسيقى أو الصوت عبر
قدرة توليد الموسيقى المشتركة باستخدام المزوّدين المهيئين — Google،
وMiniMax، وComfyUI المهيأة عبر سير العمل حاليًا.

بالنسبة إلى تشغيلات الوكيل المدعومة بالجلسات، يبدأ OpenClaw توليد الموسيقى
كمهمة في الخلفية، ويتتبعها في دفتر المهام، ثم يوقظ الوكيل مرة أخرى
عندما يصبح المقطع جاهزًا حتى يتمكن الوكيل من نشر الصوت النهائي مرة أخرى
في القناة الأصلية.

<Note>
لا تظهر الأداة المشتركة المضمّنة إلا عندما يتوفر مزوّد واحد على الأقل
لتوليد الموسيقى. وإذا كنت لا ترى `music_generate` ضمن أدوات الوكيل لديك،
فقم بتهيئة `agents.defaults.musicGenerationModel` أو اضبط
مفتاح API للمزوّد.
</Note>

## البدء السريع

<Tabs>
  <Tab title="مدعومة بمزوّد مشترك">
    <Steps>
      <Step title="هيّئ المصادقة">
        اضبط مفتاح API لمزوّد واحد على الأقل — مثلًا
        `GEMINI_API_KEY` أو `MINIMAX_API_KEY`.
      </Step>
      <Step title="اختر نموذجًا افتراضيًا (اختياري)">
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
        _"أنشئ مقطع synthpop حيويًا عن قيادة ليلية عبر
        مدينة نيون."_

        يستدعي الوكيل `music_generate` تلقائيًا. ولا
        حاجة إلى قائمة سماح للأداة.
      </Step>
    </Steps>

    أما بالنسبة إلى السياقات المتزامنة المباشرة من دون تشغيل وكيل مدعوم بجلسة،
    فلا تزال الأداة المضمّنة تعود إلى التوليد inline وتعيد
    مسار الوسائط النهائي في نتيجة الأداة.

  </Tab>
  <Tab title="سير عمل ComfyUI">
    <Steps>
      <Step title="هيّئ سير العمل">
        هيّئ `plugins.entries.comfy.config.music` باستخدام ملف JSON
        لسير العمل وعُقد prompt/output.
      </Step>
      <Step title="مصادقة Cloud (اختياري)">
        بالنسبة إلى Comfy Cloud، اضبط `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="استدعِ الأداة">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

أمثلة على prompts:

```text
أنشئ مقطع بيانو سينمائيًا مع أوتار ناعمة ودون غناء.
```

```text
أنشئ حلقة chiptune حيوية عن إطلاق صاروخ عند شروق الشمس.
```

## المزوّدون المدعومون

| المزوّد | النموذج الافتراضي       | المدخلات المرجعية | عناصر التحكم المدعومة                                 | المصادقة                               |
| ------- | ------------------------ | ----------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI | `workflow`               | حتى صورة واحدة    | موسيقى أو صوت يحددهما سير العمل                       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google  | `lyria-3-clip-preview`   | حتى 10 صور        | `lyrics`، `instrumental`، `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax | `music-2.6`              | لا شيء            | `lyrics`، `instrumental`، `durationSeconds`، `format=mp3` | `MINIMAX_API_KEY` أو MiniMax OAuth     |

### مصفوفة القدرات

عقد الأوضاع الصريحة المستخدمة بواسطة `music_generate` واختبارات العقد والمسح الحي المشترك:

| المزوّد | `generate` | `edit` | حد التعديل | المسارات الحية المشتركة                                                     |
| ------- | :--------: | :----: | ---------- | --------------------------------------------------------------------------- |
| ComfyUI |     ✓      |   ✓    | صورة واحدة | ليس ضمن المسح المشترك؛ وتغطيه `extensions/comfy/comfy.live.test.ts`        |
| Google  |     ✓      |   ✓    | 10 صور     | `generate`، `edit`                                                          |
| MiniMax |     ✓      |   —    | لا شيء     | `generate`                                                                  |

استخدم `action: "list"` لفحص المزوّدين والنماذج المشتركة المتاحة أثناء runtime:

```text
/tool music_generate action=list
```

استخدم `action: "status"` لفحص مهمة الموسيقى النشطة المدعومة بالجلسة:

```text
/tool music_generate action=status
```

مثال على توليد مباشر:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## معاملات الأداة

<ParamField path="prompt" type="string" required>
  موجه توليد الموسيقى. مطلوب لـ `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  تعيد `"status"` المهمة الحالية الخاصة بالجلسة؛ بينما تفحص `"list"` المزوّدين.
</ParamField>
<ParamField path="model" type="string">
  تجاوز provider/model (مثل `google/lyria-3-pro-preview` أو
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  كلمات اختيارية عندما يدعم المزوّد إدخال كلمات صريحًا.
</ParamField>
<ParamField path="instrumental" type="boolean">
  طلب خرج آلي فقط عندما يدعم المزوّد ذلك.
</ParamField>
<ParamField path="image" type="string">
  مسار صورة مرجعية واحدة أو URL لها.
</ParamField>
<ParamField path="images" type="string[]">
  عدة صور مرجعية (حتى 10 لدى المزوّدين الداعمين).
</ParamField>
<ParamField path="durationSeconds" type="number">
  المدة المستهدفة بالثواني عندما يدعم المزوّد تلميحات المدة.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  تلميح تنسيق الإخراج عندما يدعم المزوّد ذلك.
</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="timeoutMs" type="number">مهلة اختيارية لطلب المزوّد بالمللي ثانية.</ParamField>

<Note>
لا تدعم جميع المزوّدات كل المعاملات. ولا يزال OpenClaw يتحقق من
الحدود الصلبة مثل عدد المدخلات قبل الإرسال. وعندما يدعم مزوّد
المدة لكنه يستخدم حدًا أقصى أقصر من القيمة المطلوبة، فإن OpenClaw
يقيّدها إلى أقرب مدة مدعومة. أما التلميحات الاختيارية غير المدعومة حقًا
فتُتجاهل مع تحذير عندما لا يستطيع المزوّد أو النموذج المحدد احترامها.
وتُبلغ نتائج الأداة عن الإعدادات المطبقة؛ بينما تلتقط `details.normalization`
أي ربط من المطلوب إلى المطبق.
</Note>

## السلوك غير المتزامن

يعمل توليد الموسيقى المدعوم بالجلسة كمهمة في الخلفية:

- **مهمة خلفية:** تنشئ `music_generate` مهمة في الخلفية، وتعيد
  استجابة بدأ/مهمة فورًا، ثم تنشر المقطع النهائي لاحقًا
  في رسالة متابعة من الوكيل.
- **منع التكرار:** طالما أن المهمة في حالة `queued` أو `running`، فإن
  الاستدعاءات اللاحقة لـ `music_generate` في الجلسة نفسها تعيد حالة المهمة بدل
  بدء عملية توليد أخرى. استخدم `action: "status"` للتحقق صراحةً.
- **البحث عن الحالة:** يفحص `openclaw tasks list` أو `openclaw tasks show <taskId>`
  الحالات المنتظرة والجارية والنهائية.
- **إيقاظ الإكمال:** يحقن OpenClaw حدث إكمال داخليًا مرة أخرى
  في الجلسة نفسها حتى يتمكن النموذج من كتابة رسالة المتابعة الموجهة للمستخدم
  بنفسه.
- **تلميح prompt:** تحصل الدورات اللاحقة للمستخدم/اليدوية في الجلسة نفسها على تلميح
  runtime صغير عندما تكون مهمة موسيقى قيد التنفيذ بالفعل، حتى لا
  يستدعي النموذج `music_generate` مرة أخرى بشكل أعمى.
- **fallback بلا جلسة:** تعمل السياقات المباشرة/المحلية من دون جلسة
  وكيل حقيقية بشكل inline وتعيد نتيجة الصوت النهائية في الدورة نفسها.

### دورة حياة المهمة

| الحالة       | المعنى                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------- |
| `queued`     | تم إنشاء المهمة، وهي تنتظر أن يقبلها المزوّد.                                               |
| `running`    | يعالج المزوّد الطلب (عادةً من 30 ثانية إلى 3 دقائق بحسب المزوّد والمدة).                   |
| `succeeded`  | أصبح المقطع جاهزًا؛ فيستيقظ الوكيل وينشره في المحادثة.                                      |
| `failed`     | حدث خطأ من المزوّد أو انتهت المهلة؛ فيستيقظ الوكيل مع تفاصيل الخطأ.                        |

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
2. ‏`musicGenerationModel.primary` من الإعدادات.
3. ‏`musicGenerationModel.fallbacks` بالترتيب.
4. الاكتشاف التلقائي باستخدام الإعدادات الافتراضية للمزوّد المدعومة بالمصادقة فقط:
   - المزوّد الافتراضي الحالي أولًا؛
   - ثم بقية مزوّدي توليد الموسيقى المسجلين بترتيب معرّفات المزوّدين.

إذا فشل مزوّد، تتم تجربة المرشح التالي تلقائيًا. وإذا
فشل الجميع، فسيتضمن الخطأ تفاصيل من كل محاولة.

اضبط `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.

## ملاحظات حول المزوّدين

<AccordionGroup>
  <Accordion title="ComfyUI">
    يعتمد على سير العمل ويعتمد على الرسم البياني المهيأ إضافةً إلى ربط العُقد
    لحقول prompt/output. وتتصل Plugin `comfy` المضمّنة بأداة
    `music_generate` المشتركة عبر سجل مزوّد توليد الموسيقى.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    يستخدم التوليد الدفعي Lyria 3. ويدعم التدفق المضمّن الحالي
    prompt، ونص كلمات اختياري، وصورًا مرجعية اختيارية.
  </Accordion>
  <Accordion title="MiniMax">
    يستخدم نقطة النهاية الدفعيّة `music_generation`. ويدعم prompt، وكلمات
    اختيارية، ووضعًا آليًا، وتوجيه المدة، وإخراج mp3 عبر
    مصادقة مفتاح API من `minimax` أو عبر OAuth من `minimax-portal`.
  </Accordion>
</AccordionGroup>

## اختيار المسار الصحيح

- **مدعومة بمزوّد مشترك** عندما تريد اختيار النموذج، وfailover بين المزوّدين،
  وتدفق المهام/الحالة غير المتزامن المضمّن.
- **مسار Plugin ‏(ComfyUI)** عندما تحتاج إلى رسم بياني مخصص لسير العمل أو
  إلى مزوّد ليس جزءًا من قدرة الموسيقى المشتركة المضمّنة.

إذا كنت تصحح سلوكًا خاصًا بـ ComfyUI، فراجع
[ComfyUI](/ar/providers/comfy). وإذا كنت تصحح سلوكًا مشتركًا بين المزوّدين،
فابدأ بـ [Google (Gemini)](/ar/providers/google) أو
[MiniMax](/ar/providers/minimax).

## أوضاع قدرات المزوّد

تدعم عقدة توليد الموسيقى المشتركة تعريفات صريحة للأوضاع:

- `generate` للتوليد المعتمد على prompt فقط.
- `edit` عندما يتضمن الطلب صورة مرجعية واحدة أو أكثر.

يجب أن تفضّل تنفيذات المزوّدين الجديدة كتل الأوضاع الصريحة:

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
`supportsFormat` **لا تكفي** للإعلان عن دعم التعديل. ويجب على المزوّدين
تعريف `generate` و`edit` صراحةً حتى تتمكن الاختبارات الحية واختبارات العقد
وأداة `music_generate` المشتركة من التحقق من دعم الأوضاع
بشكل حتمي.

## الاختبارات الحية

تغطية حية اختيارية للمزوّدين المضمّنين المشتركين:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

غلاف المستودع:

```bash
pnpm test:live:media music
```

يحمّل هذا الملف الحي متغيرات البيئة المفقودة الخاصة بالمزوّد من `~/.profile`، ويفضّل
مفاتيح API الحية/البيئية على ملفات auth التعريفية المخزنة افتراضيًا، ويشغّل
تغطية `generate` و`edit` المصرّح بها عندما يفعّل المزوّد وضع التعديل.
والتغطية الحالية:

- `google`: ‏`generate` بالإضافة إلى `edit`
- `minimax`: ‏`generate` فقط
- `comfy`: تغطية حية منفصلة لـ Comfy، وليست ضمن المسح المشترك للمزوّدين

تغطية حية اختيارية لمسار الموسيقى المضمّن في ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

كما يغطي ملف Comfy الحي أيضًا سير عمل الصور والفيديو في comfy عندما تكون
هذه الأقسام مهيأة.

## ذو صلة

- [مهام الخلفية](/ar/automation/tasks) — تتبع المهام لتشغيلات `music_generate` المنفصلة
- [ComfyUI](/ar/providers/comfy)
- [مرجع التهيئة](/ar/gateway/config-agents#agent-defaults) — إعدادات `musicGenerationModel`
- [Google (Gemini)](/ar/providers/google)
- [MiniMax](/ar/providers/minimax)
- [النماذج](/ar/concepts/models) — تهيئة النماذج وfailover
- [نظرة عامة على الأدوات](/ar/tools)
