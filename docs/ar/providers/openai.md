---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلاً من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T16:30:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e113f2418f82a8859f208f85efb55114bda7bc17beeb28f012b19e861609dad
    source_path: providers/openai.md
    workflow: 16
---

توفر OpenAI واجهات API للمطورين لنماذج GPT، كما يتوفر Codex أيضا كوكيل برمجة ضمن خطة
ChatGPT من خلال عملاء Codex لدى OpenAI. تفصل OpenClaw هذه
الواجهات حتى تبقى الإعدادات قابلة للتنبؤ.

تدعم OpenClaw ثلاثة مسارات من عائلة OpenAI. تحدد بادئة النموذج
مسار الموفر/المصادقة؛ ويحدد إعداد تشغيل منفصل من ينفذ
حلقة الوكيل المضمنة:

- **مفتاح API** — وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (نماذج `openai/*`)
- **اشتراك Codex عبر PI** — تسجيل دخول ChatGPT/Codex مع وصول الاشتراك (نماذج `openai-codex/*`)
- **حاضنة خادم تطبيق Codex** — تنفيذ أصلي لخادم تطبيق Codex (نماذج `openai/*` بالإضافة إلى `agents.defaults.agentRuntime.id: "codex"`)

تدعم OpenAI صراحة استخدام OAuth للاشتراكات في الأدوات الخارجية وسير العمل مثل OpenClaw.

الموفر، والنموذج، وبيئة التشغيل، والقناة طبقات منفصلة. إذا كانت هذه التسميات
تختلط معا، فاقرأ [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes) قبل
تغيير الإعدادات.

## اختيار سريع

| الهدف                                          | استخدم                                              | ملاحظات                                                                        |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| فوترة مباشرة بمفتاح API                        | `openai/gpt-5.5`                                 | اضبط `OPENAI_API_KEY` أو شغّل تهيئة مفتاح API من OpenAI.                       |
| GPT-5.5 مع مصادقة اشتراك ChatGPT/Codex  | `openai-codex/gpt-5.5`                           | مسار PI الافتراضي لـ OAuth الخاص بـ Codex. الخيار الأول الأفضل لإعدادات الاشتراك. |
| GPT-5.5 مع سلوك خادم تطبيق Codex الأصلي | `openai/gpt-5.5` بالإضافة إلى `agentRuntime.id: "codex"` | يفرض حاضنة خادم تطبيق Codex لمرجع النموذج هذا.                      |
| إنشاء الصور أو تحريرها                   | `openai/gpt-image-2`                             | يعمل مع `OPENAI_API_KEY` أو OAuth الخاص بـ OpenAI Codex.                    |
| صور بخلفية شفافة                 | `openai/gpt-image-1.5`                           | استخدم `outputFormat=png` أو `webp` و`openai.background=transparent`.        |

## خريطة التسمية

الأسماء متشابهة لكنها غير قابلة للتبديل:

| الاسم الذي تراه                       | الطبقة             | المعنى                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | بادئة الموفر   | مسار API مباشر إلى OpenAI Platform.                                                                 |
| `openai-codex`                     | بادئة الموفر   | مسار OpenAI Codex OAuth/الاشتراك عبر مشغل PI العادي في OpenClaw.                      |
| `codex` plugin                     | Plugin            | Plugin مضمّن في OpenClaw يوفر بيئة تشغيل خادم تطبيق Codex الأصلية وعناصر التحكم بالدردشة `/codex`. |
| `agentRuntime.id: codex`           | بيئة تشغيل الوكيل     | فرض حاضنة خادم تطبيق Codex الأصلية للأدوار المضمنة.                                     |
| `/codex ...`                       | مجموعة أوامر الدردشة  | ربط/التحكم في خيوط خادم تطبيق Codex من محادثة.                                        |
| `runtime: "acp", agentId: "codex"` | مسار جلسة ACP | مسار احتياطي صريح يشغل Codex عبر ACP/acpx.                                          |

هذا يعني أن الإعدادات يمكن أن تحتوي عمدا على كل من `openai-codex/*` و
Plugin ‏`codex`. هذا صالح عندما تريد OAuth الخاص بـ Codex عبر PI وتريد أيضا
إتاحة عناصر التحكم بالدردشة `/codex` الأصلية. يحذر `openclaw doctor` من ذلك
الدمج حتى تتمكن من تأكيد أنه مقصود؛ ولا يعيد كتابته.

<Note>
يتوفر GPT-5.5 عبر الوصول المباشر بمفتاح API إلى OpenAI Platform وكذلك عبر
مسارات الاشتراك/OAuth. استخدم `openai/gpt-5.5` لحركة المرور المباشرة عبر `OPENAI_API_KEY`،
و`openai-codex/gpt-5.5` لـ OAuth الخاص بـ Codex عبر PI، أو
`openai/gpt-5.5` مع `agentRuntime.id: "codex"` لحاضنة خادم تطبيق Codex
الأصلية.
</Note>

<Note>
تمكين Plugin الخاص بـ OpenAI، أو اختيار نموذج `openai-codex/*`، لا
يمكّن Plugin خادم تطبيق Codex المضمن. تمكّن OpenClaw ذلك Plugin فقط
عندما تختار صراحة حاضنة Codex الأصلية باستخدام
`agentRuntime.id: "codex"` أو تستخدم مرجع نموذج `codex/*` قديما.
إذا كان Plugin ‏`codex` المضمن مفعلا لكن `openai-codex/*` لا يزال يُحل
عبر PI، فسيحذر `openclaw doctor` ويترك المسار دون تغيير.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI         | واجهة OpenClaw                                           | الحالة                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| الدردشة / Responses          | موفر نموذج `openai/<model>`                            | نعم                                                    |
| نماذج اشتراك Codex | `openai-codex/<model>` مع OAuth الخاص بـ `openai-codex`           | نعم                                                    |
| حاضنة خادم تطبيق Codex  | `openai/<model>` مع `agentRuntime.id: codex`             | نعم                                                    |
| البحث على الويب من جهة الخادم    | أداة OpenAI Responses الأصلية                               | نعم، عند تمكين البحث على الويب وعدم تثبيت موفر |
| الصور                    | `image_generate`                                           | نعم                                                    |
| الفيديوهات                    | `video_generate`                                           | نعم                                                    |
| تحويل النص إلى كلام            | `messages.tts.provider: "openai"` / `tts`                  | نعم                                                    |
| تحويل الكلام إلى نص على دفعات      | `tools.media.audio` / فهم الوسائط                  | نعم                                                    |
| تحويل الكلام إلى نص بالبث  | مكالمة صوتية `streaming.provider: "openai"`                  | نعم                                                    |
| الصوت الفوري            | مكالمة صوتية `realtime.provider: "openai"` / Control UI Talk | نعم                                                    |
| التضمينات                | موفر تضمين الذاكرة                                  | نعم                                                    |

## تضمينات الذاكرة

يمكن أن تستخدم OpenClaw OpenAI، أو نقطة نهاية تضمين متوافقة مع OpenAI، من أجل
فهرسة `memory_search` وتضمينات الاستعلام:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

بالنسبة إلى نقاط النهاية المتوافقة مع OpenAI التي تتطلب تسميات تضمين غير متماثلة، اضبط
`queryInputType` و`documentInputType` ضمن `memorySearch`. تمرر OpenClaw
هذه كحقول طلب `input_type` خاصة بالموفر: تستخدم تضمينات الاستعلام
`queryInputType`؛ وتستخدم أجزاء الذاكرة المفهرسة والفهرسة الدفعية
`documentInputType`. راجع [مرجع إعدادات الذاكرة](/ar/reference/memory-config#provider-specific-config) للاطلاع على المثال الكامل.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ أو انسخ مفتاح API من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل التهيئة">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرر المفتاح مباشرة:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج              | إعداد بيئة التشغيل             | المسار                       | المصادقة             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | محذوف / `agentRuntime.id: "pi"`    | API مباشر إلى OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | محذوف / `agentRuntime.id: "pi"`    | API مباشر إلى OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | حاضنة خادم تطبيق Codex    | خادم تطبيق Codex |

    <Note>
    `openai/*` هو مسار مفتاح API المباشر لـ OpenAI ما لم تفرض صراحة
    حاضنة خادم تطبيق Codex. استخدم `openai-codex/*` لـ OAuth الخاص بـ Codex عبر
    مشغل PI الافتراضي، أو استخدم `openai/gpt-5.5` مع
    `agentRuntime.id: "codex"` للتنفيذ الأصلي لخادم تطبيق Codex.
    </Note>

    ### مثال إعدادات

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    لا تعرض OpenClaw ‏`openai/gpt-5.3-codex-spark`. ترفض طلبات OpenAI API الحية ذلك النموذج، كما أن كتالوج Codex الحالي لا يعرضه أيضا.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex بدلا من مفتاح API منفصل. تتطلب سحابة Codex تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل OAuth الخاص بـ Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        لإعدادات بلا واجهة أو غير ملائمة لاستدعاء callback، أضف `--device-code` لتسجيل الدخول بتدفق رمز جهاز ChatGPT بدلا من callback المتصفح على localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="اضبط النموذج الافتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | إعداد بيئة التشغيل | المسار | المصادقة |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | محذوف / `runtime: "pi"` | OAuth الخاص بـ ChatGPT/Codex عبر PI | تسجيل دخول Codex |
    | `openai-codex/gpt-5.4-mini` | محذوف / `runtime: "pi"` | OAuth الخاص بـ ChatGPT/Codex عبر PI | تسجيل دخول Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | يظل PI ما لم يعلن Plugin صراحة امتلاك `openai-codex` | تسجيل دخول Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | حاضنة خادم تطبيق Codex | مصادقة خادم تطبيق Codex |

    <Note>
    واصل استخدام معرّف الموفر `openai-codex` لأوامر المصادقة/الملف الشخصي. كما أن
    بادئة النموذج `openai-codex/*` هي المسار الصريح لـ PI من أجل OAuth الخاص بـ Codex.
    ولا تختار حاضنة خادم تطبيق Codex المضمنة أو تمكّنها تلقائيا.
    </Note>

    ### مثال إعدادات

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    لم تعد التهيئة تستورد مواد OAuth من `~/.codex`. سجّل الدخول عبر OAuth في المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — تدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكلاء الخاص بها.
    </Note>

    ### مؤشر الحالة

    تعرض محادثة `/status` وقت تشغيل النموذج النشط للجلسة الحالية.
    يظهر إطار PI الافتراضي باسم `Runtime: OpenClaw Pi Default`. عند تحديد
    إطار خادم التطبيق Codex المضمّن، تعرض `/status`
    `Runtime: OpenAI Codex`. تحتفظ الجلسات الحالية بمعرّف الإطار المسجّل لديها، لذا استخدم
    `/new` أو `/reset` بعد تغيير `agentRuntime` إذا أردت أن تعكس `/status`
    اختيار PI/Codex جديدًا.

    ### تحذير Doctor

    إذا كان Plugin `codex` المضمّن مفعّلًا أثناء تحديد مسار
    `openai-codex/*` في هذا التبويب، فإن `openclaw doctor` يحذّر من أن النموذج
    ما زال يُحلّ عبر PI. أبقِ الإعدادات دون تغيير عندما يكون ذلك هو مسار
    مصادقة الاشتراك المقصود. انتقل إلى `openai/<model>` مع
    `agentRuntime.id: "codex"` فقط عندما تريد تنفيذ خادم التطبيق Codex
    الأصلي.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات تعريف النموذج وحد سياق وقت التشغيل كقيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.5` عبر Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - الحد الافتراضي لوقت التشغيل `contextTokens`: `272000`

    يوفّر الحد الافتراضي الأصغر خصائص أفضل من حيث زمن الاستجابة والجودة عمليًا. تجاوزه باستخدام `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    استخدم `contextWindow` للتصريح ببيانات تعريف النموذج الأصلية. استخدم `contextTokens` للحد من ميزانية سياق وقت التشغيل.
    </Note>

    ### استرداد الكتالوج

    يستخدم OpenClaw بيانات تعريف كتالوج Codex الصاعد لـ `gpt-5.5` عندما تكون
    موجودة. إذا حذف اكتشاف Codex المباشر صف `openai-codex/gpt-5.5` بينما
    الحساب مصادَق عليه، فإن OpenClaw ينشئ صف نموذج OAuth هذا حتى لا تفشل
    عمليات Cron والوكيل الفرعي والنموذج الافتراضي المضبوط مع
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة خادم التطبيق Codex الأصلي

يستخدم إطار خادم التطبيق Codex الأصلي مراجع نماذج `openai/*` مع
`agentRuntime.id: "codex"`، لكن المصادقة الخاصة به لا تزال قائمة على الحساب. يحدد OpenClaw
المصادقة بهذا الترتيب:

1. ملف مصادقة OpenClaw `openai-codex` صريح مرتبط بالوكيل.
2. الحساب الحالي لخادم التطبيق، مثل تسجيل دخول محلي إلى ChatGPT عبر Codex CLI.
3. بالنسبة إلى تشغيلات خادم التطبيق المحلية عبر stdio فقط، `CODEX_API_KEY` ثم
   `OPENAI_API_KEY`، عندما يبلّغ خادم التطبيق عن عدم وجود حساب ومع ذلك يتطلب
   مصادقة OpenAI.

هذا يعني أن تسجيل دخول اشتراك ChatGPT/Codex محلي لا يُستبدل لمجرد أن
عملية Gateway لديها أيضًا `OPENAI_API_KEY` لنماذج OpenAI المباشرة
أو التضمينات. الرجوع الاحتياطي إلى مفتاح API من البيئة يقتصر على مسار stdio المحلي بلا حساب؛ ولا
يُرسل إلى اتصالات خادم التطبيق WebSocket. عند تحديد ملف Codex
بنمط اشتراك، يبقي OpenClaw أيضًا `CODEX_API_KEY` و`OPENAI_API_KEY`
خارج عملية خادم التطبيق الفرعية stdio المنشأة ويرسل بيانات الاعتماد المحددة
عبر RPC تسجيل الدخول إلى خادم التطبيق.

## توليد الصور

يسجّل Plugin `openai` المضمّن توليد الصور عبر أداة `image_generate`.
وهو يدعم توليد الصور بمفتاح API من OpenAI وتوليد الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| القدرة                   | مفتاح API من OpenAI               | Codex OAuth                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع النموذج              | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| المصادقة                  | `OPENAI_API_KEY`                   | تسجيل دخول OpenAI Codex OAuth       |
| النقل                     | OpenAI Images API                  | واجهة Codex Responses الخلفية        |
| الحد الأقصى للصور لكل طلب | 4                                  | 4                                    |
| وضع التحرير               | مفعّل (حتى 5 صور مرجعية)          | مفعّل (حتى 5 صور مرجعية)            |
| تجاوزات الحجم             | مدعومة، بما في ذلك أحجام 2K/4K    | مدعومة، بما في ذلك أحجام 2K/4K      |
| نسبة العرض إلى الارتفاع / الدقة | لا تُمرر إلى OpenAI Images API | تُطابق بحجم مدعوم عندما يكون ذلك آمنًا |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
راجع [توليد الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

`gpt-image-2` هو الافتراضي لكل من توليد النص إلى صورة في OpenAI وتحرير الصور. تظل
`gpt-image-1.5` و`gpt-image-1` و`gpt-image-1-mini` قابلة للاستخدام
كتجاوزات نموذج صريحة. استخدم `openai/gpt-image-1.5` لإخراج
PNG/WebP بخلفية شفافة؛ إذ ترفض API الحالية لـ `gpt-image-2`
`background: "transparent"`.

لطلب خلفية شفافة، ينبغي للوكلاء استدعاء `image_generate` مع
`model: "openai/gpt-image-1.5"`، و`outputFormat: "png"` أو `"webp"`، و
`background: "transparent"`؛ ولا يزال خيار المزوّد الأقدم `openai.background`
مقبولًا. يحمي OpenClaw أيضًا مسارات OpenAI العامة و
OpenAI Codex OAuth عبر إعادة كتابة طلبات الشفافية الافتراضية لـ `openai/gpt-image-2`
إلى `gpt-image-1.5`؛ بينما تحتفظ Azure ونقاط النهاية المخصصة المتوافقة مع OpenAI
بأسماء النشر/النماذج المضبوطة لديها.

يتوفر الإعداد نفسه لتشغيلات CLI بلا واجهة:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

استخدم العلمين نفسيهما `--output-format` و`--background` مع
`openclaw infer image edit` عند البدء من ملف إدخال.
يبقى `--openai-background` متاحًا كاسم بديل خاص بـ OpenAI.

بالنسبة إلى تثبيتات Codex OAuth، احتفظ بالمرجع نفسه `openai/gpt-image-2`. عند ضبط
ملف OAuth باسم `openai-codex`، يحل OpenClaw رمز وصول OAuth المخزن ذلك
ويرسل طلبات الصور عبر واجهة Codex Responses الخلفية. وهو
لا يحاول أولًا استخدام `OPENAI_API_KEY` ولا يرجع بصمت إلى مفتاح API لذلك
الطلب. اضبط `models.providers.openai` صراحةً بمفتاح API،
أو عنوان URL أساسي مخصص، أو نقطة نهاية Azure عندما تريد مسار OpenAI Images API
المباشر بدلًا من ذلك.
إذا كانت نقطة نهاية الصور المخصصة هذه على عنوان LAN/خاص موثوق، فاضبط أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ إذ يبقي OpenClaw
نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محظورة ما لم يكن هذا الاشتراك
موجودًا.

توليد:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

توليد PNG شفاف:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

تحرير:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## توليد الفيديو

يسجّل Plugin `openai` المضمّن توليد الفيديو عبر أداة `video_generate`.

| القدرة           | القيمة                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2`                                                                   |
| الأوضاع          | نص إلى فيديو، صورة إلى فيديو، تحرير فيديو واحد                                   |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد                                                          |
| تجاوزات الحجم    | مدعومة                                                                            |
| تجاوزات أخرى     | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## مساهمة موجّه GPT-5

يضيف OpenClaw مساهمة موجّه GPT-5 مشتركة لتشغيلات عائلة GPT-5 عبر المزوّدين. تُطبق حسب معرّف النموذج، لذا تتلقى `openai-codex/gpt-5.5` و`openai/gpt-5.5` و`openrouter/openai/gpt-5.5` و`opencode/gpt-5.5` ومراجع GPT-5 المتوافقة الأخرى الطبقة نفسها. ولا تنطبق على نماذج GPT-4.x الأقدم.

يستخدم إطار Codex الأصلي المضمّن سلوك GPT-5 نفسه وطبقة Heartbeat عبر تعليمات مطوّر خادم التطبيق Codex، لذا تحتفظ جلسات `openai/gpt-5.x` المفروضة عبر `agentRuntime.id: "codex"` بإرشادات المتابعة وHeartbeat الاستباقية نفسها رغم أن Codex يملك بقية موجّه الإطار.

تضيف مساهمة GPT-5 عقد سلوك موسومًا لاستمرارية الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوص الإكمال، والتحقق. يبقى سلوك الرد الخاص بالقنوات والرسائل الصامتة في موجّه نظام OpenClaw المشترك وسياسة التسليم الصادر. تكون إرشادات GPT-5 مفعّلة دائمًا للنماذج المطابقة. طبقة أسلوب التفاعل الودود منفصلة وقابلة للضبط.

| القيمة                 | التأثير                               |
| ---------------------- | ------------------------------------- |
| `"friendly"` (افتراضي) | تفعيل طبقة أسلوب التفاعل الودود       |
| `"on"`                 | اسم بديل لـ `"friendly"`              |
| `"off"`                | تعطيل طبقة الأسلوب الودود فقط         |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
القيم غير حساسة لحالة الأحرف وقت التشغيل، لذا يعطل كل من `"Off"` و`"off"` طبقة الأسلوب الودود.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ كرجوع احتياطي للتوافق عندما لا يكون إعداد `agents.defaults.promptOverlays.gpt5.personality` المشترك مضبوطًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    يسجّل Plugin `openai` المضمّن توليف الكلام لسطح `messages.tts`.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يرجع احتياطيًا إلى `OPENAI_API_KEY` |
    | عنوان URL الأساسي | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    النماذج المتاحة: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. الأصوات المتاحة: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز عنوان URL الأساسي لـ TTS دون التأثير في نقطة نهاية API المحادثة.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    يسجّل Plugin `openai` المضمّن تحويل الكلام إلى نص دفعيًا عبر
    سطح التفريغ النصي لفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: تحميل ملف صوتي متعدد الأجزاء
    - مدعوم من OpenClaw أينما يستخدم تفريغ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قناة الصوت في Discord ومرفقات
      صوت القناة

    لفرض OpenAI لنسخ الصوت الوارد:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    تُمرَّر تلميحات اللغة والموجه إلى OpenAI عند توفيرها عبر
    تهيئة وسائط الصوت المشتركة أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ في الوقت الفعلي">
    يسجل Plugin `openai` المضمن النسخ في الوقت الفعلي لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار التهيئة | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير معيّن) |
    | الموجه | `...openai.prompt` | (غير معيّن) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يعود احتياطيًا إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law ‏(`g711_ulaw` / `audio/pcmu`). مزود البث هذا مخصص لمسار النسخ في الوقت الفعلي في Voice Call؛ أما صوت Discord فيسجل حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار النسخ الدفعي `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت في الوقت الفعلي">
    يسجل Plugin `openai` المضمن الصوت في الوقت الفعلي لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار التهيئة | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يعود احتياطيًا إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفاتيح التهيئة `azureEndpoint` و`azureDeployment` لجسور الوقت الفعلي الخلفية. يدعم استدعاء الأدوات ثنائي الاتجاه. يستخدم تنسيق صوت G.711 u-law.
    </Note>

    <Note>
    يستخدم Control UI Talk جلسات OpenAI في الوقت الفعلي داخل المتصفح مع سر عميل مؤقت
    يصدره Gateway وتبادل WebRTC SDP مباشر من المتصفح مع
    OpenAI Realtime API. يتوفر التحقق المباشر للمشرف باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ينشئ جزء OpenAI سر عميل في Node، ويولد عرض SDP من المتصفح
    باستخدام وسائط ميكروفون وهمية، ويرسله إلى OpenAI، ويطبق إجابة SDP
    دون تسجيل الأسرار.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لمزود `openai` المضمن استهداف مورد Azure OpenAI لتوليد الصور
عبر تجاوز عنوان URL الأساسي. في مسار توليد الصور، يكتشف OpenClaw
أسماء مضيفي Azure على `models.providers.openai.baseUrl` ويتحول إلى
شكل طلب Azure تلقائيًا.

<Note>
يستخدم الصوت في الوقت الفعلي مسار تهيئة منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **الصوت في الوقت الفعلي**
ضمن [الصوت والكلام](#voice-and-speech) لإعدادات Azure الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- تكون لديك بالفعل اشتراك Azure OpenAI أو حصة أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال توفرها Azure
- تريد إبقاء حركة المرور داخل مستأجر Azure موجود

### التهيئة

لتوليد الصور عبر Azure من خلال مزود `openai` المضمن، وجّه
`models.providers.openai.baseUrl` إلى مورد Azure لديك واضبط `apiKey` على
مفتاح Azure OpenAI (وليس مفتاح OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

يتعرف OpenClaw على لواحق مضيف Azure هذه لمسار توليد الصور في Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

بالنسبة لطلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات بنطاق النشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب
- يستخدم مهلة طلب افتراضية قدرها 600 ثانية لاستدعاءات توليد الصور في Azure.
  لا تزال قيم `timeoutMs` لكل استدعاء تتجاوز هذا الافتراضي.

تحتفظ عناوين URL الأساسية الأخرى (OpenAI العام، والوكلاء المتوافقون مع OpenAI) بشكل
طلب الصور القياسي في OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور في مزود `openai`
OpenClaw 2026.4.22 أو أحدث. تتعامل الإصدارات الأقدم مع أي
`openai.baseUrl` مخصص مثل نقطة نهاية OpenAI العامة وستفشل مع عمليات نشر
الصور في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار Azure preview أو GA محدد
لمسار توليد الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

الافتراضي هو `2024-12-01-preview` عندما لا يكون المتغير معيّنًا.

### أسماء النماذج هي أسماء النشر

يربط Azure OpenAI النماذج بعمليات النشر. بالنسبة لطلبات توليد الصور في Azure
الموجهة عبر مزود `openai` المضمن، يجب أن يكون الحقل `model` في OpenClaw
هو **اسم نشر Azure** الذي هيأته في مدخل Azure، وليس
معرف نموذج OpenAI العام.

إذا أنشأت نشرًا باسم `gpt-image-2-prod` يخدم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجهة عبر
مزود `openai` المضمن.

### التوفر الإقليمي

توليد الصور في Azure متاح حاليًا فقط في مجموعة فرعية من المناطق
(على سبيل المثال `eastus2`، و`swedencentral`، و`polandcentral`، و`westus3`،
و`uaenorth`). تحقق من قائمة المناطق الحالية لدى Microsoft قبل إنشاء
نشر، وتأكد من أن النموذج المحدد معروض في منطقتك.

### اختلافات المعلمات

لا يقبل Azure OpenAI وOpenAI العام دائمًا معلمات الصور نفسها.
قد يرفض Azure خيارات يسمح بها OpenAI العام (مثل بعض
قيم `background` على `gpt-image-2`) أو يتيحها فقط في إصدارات نماذج محددة.
تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من OpenClaw.
إذا فشل طلب Azure بسبب خطأ تحقق، فتحقق من مجموعة
المعلمات التي يدعمها النشر المحدد وإصدار API في
مدخل Azure.

<Note>
يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق لكنه لا يتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع أكورديون **المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI**
ضمن [التهيئة المتقدمة](#advanced-configuration).

بالنسبة لحركة الدردشة أو Responses على Azure (بخلاف توليد الصور)، استخدم
تدفق الإعداد الأولي أو تهيئة مزود Azure مخصصة — `openai.baseUrl` وحده
لا يعتمد شكل Azure API/المصادقة. يوجد مزود منفصل
`azure-openai-responses/*`؛ راجع
أكورديون Compaction من جانب الخادم أدناه.
</Note>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw أسلوب WebSocket أولًا مع رجوع احتياطي إلى SSE ‏(`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع احتياطيًا إلى SSE
    - بعد الفشل، يعلّم WebSocket كمتدهور لمدة نحو 60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات هوية جلسة ودورة مستقرة لإعادة المحاولات وإعادة الاتصال
    - يوحد عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (افتراضي) | WebSocket أولًا، مع رجوع احتياطي إلى SSE |
    | `"sse"` | فرض SSE فقط |
    | `"websocket"` | فرض WebSocket فقط |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    مستندات OpenAI ذات الصلة:
    - [Realtime API مع WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [استجابات Streaming API ‏(SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="تهيئة WebSocket المسبقة">
    يمكّن OpenClaw تهيئة WebSocket المسبقة افتراضيًا لـ `openai/*` و`openai-codex/*` لتقليل زمن استجابة الدورة الأولى.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="الوضع السريع">
    يتيح OpenClaw مفتاح تبديل مشترك للوضع السريع لـ `openai/*` و`openai-codex/*`:

    - **الدردشة/UI:** `/fast status|on|off`
    - **التهيئة:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند تمكينه، يربط OpenClaw الوضع السريع بمعالجة الأولوية في OpenAI ‏(`service_tier = "priority"`). تُحفظ قيم `service_tier` الحالية، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    تتغلب تجاوزات الجلسة على التهيئة. يؤدي مسح تجاوز الجلسة في واجهة Sessions UI إلى إعادة الجلسة إلى الافتراضي المهيأ.
    </Note>

  </Accordion>

  <Accordion title="معالجة الأولوية (service_tier)">
    تتيح API الخاصة بـ OpenAI معالجة الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    القيم المدعومة: `auto`، `default`، `flex`، `priority`.

    <Warning>
    لا يُمرر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجهت أيًا من المزودين عبر وكيل، يترك OpenClaw `service_tier` دون تغيير.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جانب الخادم (Responses API)">
    بالنسبة لنماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يمكّن غلاف بث Pi-harness في OpenAI plugin ‏Compaction من جانب الخادم تلقائيًا:

    - يفرض `store: true` (ما لم تضبط توافقية النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - القيمة الافتراضية لـ `compact_threshold`:‏ 70% من `contextWindow` (أو `80000` عندما لا يكون متاحًا)

    ينطبق هذا على مسار Pi harness المضمن وعلى خطافات مزود OpenAI المستخدمة بواسطة عمليات التشغيل المضمنة. يدير حزام خادم تطبيق Codex الأصلي سياقه الخاص عبر Codex وتتم تهيئته بشكل منفصل باستخدام `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="التمكين صراحةً">
        مفيد لنقاط النهاية المتوافقة مثل Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="عتبة مخصصة">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="تعطيل">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    يتحكم `responsesServerCompaction` فقط في حقن `context_management`. لا تزال نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم يضبط التوافق `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT الوكيلي الصارم">
    بالنسبة إلى تشغيلات عائلة GPT-5 على `openai/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    مع `strict-agentic`، يقوم OpenClaw بما يلي:
    - لم يعد يتعامل مع دورة تحتوي على خطة فقط على أنها تقدم ناجح عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدورة بتوجيه للتصرف الآن
    - يفعّل `update_plan` تلقائيًا للعمل الجوهري
    - يعرض حالة حظر صريحة إذا استمر النموذج في التخطيط من دون تنفيذ

    <Note>
    يقتصر ذلك على تشغيلات عائلة OpenAI وCodex GPT-5 فقط. يحتفظ الموفرون الآخرون وعائلات النماذج الأقدم بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI المباشرة وCodex وAzure OpenAI بشكل مختلف عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - تبقي `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI `none`
    - تحذف الاستدلال المعطّل للنماذج أو الوكلاء التي ترفض `reasoning.effort: "none"`
    - تجعل مخططات الأدوات افتراضيًا في الوضع الصارم
    - ترفق ترويسات إسناد مخفية على المضيفين الأصليين المتحقق منهم فقط
    - تبقي تشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier`، `store`، توافق الاستدلال، تلميحات ذاكرة التخزين المؤقت للمطالبات)

    **مسارات الوكيل/التوافق:**
    - تستخدم سلوك توافق أكثر مرونة
    - تزيل `store` الخاص بـ Completions من حمولات `openai-completions` غير الأصلية
    - تقبل تمرير JSON المتقدم عبر `params.extra_body`/`params.extraBody` لوكلاء Completions المتوافقين مع OpenAI
    - تقبل `params.chat_template_kwargs` لوكلاء Completions المتوافقين مع OpenAI مثل vLLM
    - لا تفرض مخططات أدوات صارمة أو ترويسات مخصصة للمسارات الأصلية فقط

    يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق لكنه لا يتلقى ترويسات الإسناد المخفية.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار الموفر.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفر.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
