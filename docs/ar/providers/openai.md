---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد استخدام مصادقة اشتراك Codex بدلًا من مفاتيح API.
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T08:22:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: be0e2cd14990a53533c800cd8d305c9c50b0fa7131f6638e7b9d8dd9f2942fe8
    source_path: providers/openai.md
    workflow: 16
---

توفّر OpenAI واجهات API للمطورين لنماذج GPT، كما أن Codex متاح أيضًا كعامل برمجة ضمن خطط ChatGPT عبر عملاء Codex من OpenAI. يحافظ OpenClaw على فصل هذه الأسطح كي يبقى الضبط قابلاً للتوقع.

يدعم OpenClaw ثلاثة مسارات من عائلة OpenAI. تحدد بادئة النموذج مسار المزوّد/المصادقة؛ ويحدد إعداد تشغيل منفصل من ينفذ حلقة الوكيل المضمنة:

- **مفتاح API** — وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (`openai/*` models)
- **اشتراك Codex عبر PI** — تسجيل دخول ChatGPT/Codex مع وصول الاشتراك (`openai-codex/*` models)
- **حزام خادم تطبيق Codex** — تنفيذ أصلي عبر خادم تطبيق Codex (`openai/*` models plus `agents.defaults.agentRuntime.id: "codex"`)

تدعم OpenAI صراحةً استخدام OAuth الخاص بالاشتراكات في الأدوات الخارجية وسير العمل مثل OpenClaw.

المزوّد والنموذج ووقت التشغيل والقناة طبقات منفصلة. إذا كانت هذه التسميات تختلط معًا، فاقرأ [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes) قبل تغيير الضبط.

## اختيار سريع

| الهدف                                          | استخدم                                              | ملاحظات                                                                        |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| فوترة مباشرة بمفتاح API                        | `openai/gpt-5.5`                                 | عيّن `OPENAI_API_KEY` أو شغّل إعداد OpenAI لمفتاح API.                       |
| GPT-5.5 مع مصادقة اشتراك ChatGPT/Codex  | `openai-codex/gpt-5.5`                           | مسار PI الافتراضي لـ Codex OAuth. أفضل اختيار أول لإعدادات الاشتراك. |
| GPT-5.5 مع سلوك خادم تطبيق Codex الأصلي | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | يفرض حزام خادم تطبيق Codex لمرجع النموذج هذا.                      |
| توليد الصور أو تحريرها                   | `openai/gpt-image-2`                             | يعمل مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.                    |
| صور بخلفية شفافة                 | `openai/gpt-image-1.5`                           | استخدم `outputFormat=png` أو `webp` و`openai.background=transparent`.        |

## خريطة التسمية

الأسماء متشابهة لكنها ليست قابلة للتبادل:

| الاسم الذي تراه                       | الطبقة             | المعنى                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | بادئة المزوّد   | مسار API مباشر إلى OpenAI Platform.                                                                 |
| `openai-codex`                     | بادئة المزوّد   | مسار OpenAI Codex OAuth/الاشتراك عبر مشغّل PI العادي في OpenClaw.                      |
| `codex` plugin                     | Plugin            | Plugin مضمّن في OpenClaw يوفّر وقت تشغيل خادم تطبيق Codex الأصلي وعناصر تحكم محادثة `/codex`. |
| `agentRuntime.id: codex`           | وقت تشغيل الوكيل     | يفرض حزام خادم تطبيق Codex الأصلي للدورات المضمنة.                                     |
| `/codex ...`                       | مجموعة أوامر المحادثة  | يربط/يتحكم في سلاسل خادم تطبيق Codex من محادثة.                                        |
| `runtime: "acp", agentId: "codex"` | مسار جلسة ACP | مسار احتياطي صريح يشغّل Codex عبر ACP/acpx.                                          |

هذا يعني أن الضبط يمكن أن يحتوي عمدًا على كل من `openai-codex/*` وPlugin `codex`. يكون ذلك صالحًا عندما تريد Codex OAuth عبر PI وتريد أيضًا إتاحة عناصر تحكم محادثة `/codex` الأصلية. يحذّر `openclaw doctor` من ذلك الجمع حتى تتمكن من تأكيد أنه مقصود؛ ولا يعيد كتابته.

<Note>
يتوفر GPT-5.5 عبر الوصول المباشر بمفتاح API إلى OpenAI Platform وكذلك عبر مسارات الاشتراك/OAuth. استخدم `openai/gpt-5.5` لحركة `OPENAI_API_KEY` المباشرة، و`openai-codex/gpt-5.5` لـ Codex OAuth عبر PI، أو `openai/gpt-5.5` مع `agentRuntime.id: "codex"` لحزام خادم تطبيق Codex الأصلي.
</Note>

<Note>
لا يؤدي تمكين OpenAI plugin، أو اختيار نموذج `openai-codex/*`، إلى تمكين Plugin خادم تطبيق Codex المضمّن. يفعّل OpenClaw ذلك Plugin فقط عندما تختار صراحةً حزام Codex الأصلي باستخدام `agentRuntime.id: "codex"` أو تستخدم مرجع نموذج `codex/*` قديمًا.
إذا كان Plugin `codex` المضمّن ممكّنًا لكن `openai-codex/*` ما زال يُحل عبر PI، فإن `openclaw doctor` يحذّر ويترك المسار دون تغيير.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI         | سطح OpenClaw                                           | الحالة                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| المحادثة / الاستجابات          | مزوّد نموذج `openai/<model>`                            | نعم                                                    |
| نماذج اشتراك Codex | `openai-codex/<model>` مع `openai-codex` OAuth           | نعم                                                    |
| حزام خادم تطبيق Codex  | `openai/<model>` مع `agentRuntime.id: codex`             | نعم                                                    |
| بحث الويب من جهة الخادم    | أداة OpenAI Responses الأصلية                               | نعم، عندما يكون بحث الويب ممكّنًا ولا يوجد مزوّد مثبت |
| الصور                    | `image_generate`                                           | نعم                                                    |
| الفيديوهات                    | `video_generate`                                           | نعم                                                    |
| تحويل النص إلى كلام            | `messages.tts.provider: "openai"` / `tts`                  | نعم                                                    |
| تحويل الكلام إلى نص دفعي      | `tools.media.audio` / فهم الوسائط                  | نعم                                                    |
| تحويل الكلام إلى نص بالبث  | Voice Call `streaming.provider: "openai"`                  | نعم                                                    |
| الصوت الفوري            | Voice Call `realtime.provider: "openai"` / Control UI Talk | نعم                                                    |
| التضمينات                | مزوّد تضمينات الذاكرة                                  | نعم                                                    |

## تضمينات الذاكرة

يمكن لـ OpenClaw استخدام OpenAI، أو نقطة نهاية تضمين متوافقة مع OpenAI، لفهرسة `memory_search` وتضمينات الاستعلام:

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

بالنسبة إلى نقاط النهاية المتوافقة مع OpenAI التي تتطلب تسميات تضمين غير متماثلة، عيّن `queryInputType` و`documentInputType` ضمن `memorySearch`. يمرر OpenClaw هذه كحقول طلب `input_type` خاصة بالمزوّد: تستخدم تضمينات الاستعلام `queryInputType`؛ وتستخدم مقاطع الذاكرة المفهرسة والفهرسة الدفعية `documentInputType`. راجع [مرجع ضبط الذاكرة](/ar/reference/memory-config#provider-specific-config) للمثال الكامل.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** وصول API مباشر وفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API">
        أنشئ أو انسخ مفتاح API من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرّر المفتاح مباشرةً:

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

    | مرجع النموذج              | ضبط وقت التشغيل             | المسار                       | المصادقة             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | API مباشر إلى OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | API مباشر إلى OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | حزام خادم تطبيق Codex    | خادم تطبيق Codex |

    <Note>
    `openai/*` هو مسار مفتاح API المباشر إلى OpenAI ما لم تفرض صراحةً حزام خادم تطبيق Codex. استخدم `openai-codex/*` لـ Codex OAuth عبر مشغّل PI الافتراضي، أو استخدم `openai/gpt-5.5` مع `agentRuntime.id: "codex"` لتنفيذ خادم تطبيق Codex الأصلي.
    </Note>

    ### مثال ضبط

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    لا يعرّض OpenClaw `openai/gpt-5.3-codex-spark`. ترفض طلبات OpenAI API الحية ذلك النموذج، كما أن كتالوج Codex الحالي لا يعرّضه أيضًا.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex بدلًا من مفتاح API منفصل. يتطلب Codex cloud تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرةً:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        للإعدادات بلا واجهة أو التي لا تناسبها callbacks، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز جهاز ChatGPT بدلًا من callback متصفح localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="عيّن النموذج الافتراضي">
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

    | مرجع النموذج | ضبط وقت التشغيل | المسار | المصادقة |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | ChatGPT/Codex OAuth عبر PI | تسجيل دخول Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | يظل PI ما لم يطالب Plugin صراحةً بـ `openai-codex` | تسجيل دخول Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | حزام خادم تطبيق Codex | مصادقة خادم تطبيق Codex |

    <Note>
    استمر في استخدام معرّف المزوّد `openai-codex` لأوامر المصادقة/الملف الشخصي. بادئة النموذج `openai-codex/*` هي أيضًا مسار PI الصريح لـ Codex OAuth. وهي لا تختار أو تفعّل تلقائيًا حزام خادم تطبيق Codex المضمّن.
    </Note>

    <Warning>
    `openai-codex/gpt-5.4-mini` ليس مسار Codex OAuth مدعومًا. استخدم `openai/gpt-5.4-mini` مع مفتاح OpenAI API، أو استخدم `openai-codex/gpt-5.5` مع Codex OAuth.
    </Warning>

    ### مثال ضبط

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    لم يعد الإعداد يستورد مواد OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (افتراضيًا) أو تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكيل الخاص به.
    </Note>

    ### مؤشر الحالة

    تعرض دردشة `/status` وقت تشغيل النموذج النشط للجلسة الحالية.
    يظهر مشغّل PI الافتراضي كـ `Runtime: OpenClaw Pi Default`. عند تحديد
    مشغّل خادم تطبيق Codex المضمّن، تعرض `/status`
    `Runtime: OpenAI Codex`. تحتفظ الجلسات الحالية بمعرّف المشغّل المسجّل لديها، لذا استخدم
    `/new` أو `/reset` بعد تغيير `agentRuntime` إذا أردت أن تعكس `/status`
    اختيار PI/Codex جديدًا.

    ### تحذير الطبيب

    إذا كان Plugin `codex` المضمّن مفعّلًا بينما يكون مسار
    `openai-codex/*` الخاص بعلامة التبويب هذه محددًا، يحذّر `openclaw doctor` من أن النموذج
    لا يزال يُحل عبر PI. أبقِ الإعدادات بدون تغيير عندما يكون ذلك هو مسار
    مصادقة الاشتراك المقصود. انتقل إلى `openai/<model>` مع
    `agentRuntime.id: "codex"` فقط عندما تريد تنفيذًا أصليًا عبر خادم تطبيق Codex.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات النموذج الوصفية وحد سياق وقت التشغيل كقيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.5` عبر Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - حد `contextTokens` الافتراضي لوقت التشغيل: `272000`

    الحد الافتراضي الأصغر يوفّر عمليًا خصائص أفضل في زمن الاستجابة والجودة. تجاوزه باستخدام `contextTokens`:

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
    استخدم `contextWindow` للتصريح ببيانات النموذج الأصلية الوصفية. استخدم `contextTokens` لتقييد ميزانية سياق وقت التشغيل.
    </Note>

    ### استرداد الكتالوج

    يستخدم OpenClaw بيانات كتالوج Codex الوصفية upstream لـ `gpt-5.5` عندما تكون
    موجودة. إذا أغفل اكتشاف Codex المباشر صف `openai-codex/gpt-5.5` بينما
    يكون الحساب مصادقًا، ينشئ OpenClaw صف نموذج OAuth هذا بحيث
    لا تفشل تشغيلات Cron والوكيل الفرعي والنموذج الافتراضي المكوّن بسبب
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة خادم تطبيق Codex الأصلية

يستخدم مشغّل خادم تطبيق Codex الأصلي مراجع نماذج `openai/*` مع
`agentRuntime.id: "codex"`، لكن مصادقته لا تزال قائمة على الحساب. يحدد OpenClaw
المصادقة بهذا الترتيب:

1. ملف تعريف مصادقة OpenClaw `openai-codex` صريح مرتبط بالوكيل.
2. الحساب الحالي لخادم التطبيق، مثل تسجيل دخول ChatGPT محلي عبر Codex CLI.
3. بالنسبة إلى عمليات تشغيل خادم التطبيق المحلي عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما يبلّغ خادم التطبيق بعدم وجود حساب ومع ذلك يتطلب
   مصادقة OpenAI.

يعني ذلك أن تسجيل الدخول المحلي باشتراك ChatGPT/Codex لا يُستبدل لمجرد
أن عملية Gateway لديها أيضًا `OPENAI_API_KEY` للنماذج المباشرة من OpenAI
أو للتضمينات. الرجوع إلى مفتاح API من البيئة هو فقط لمسار stdio المحلي بلا حساب؛ ولا
يُرسل إلى اتصالات خادم التطبيق عبر WebSocket. عند تحديد ملف تعريف Codex
بنمط الاشتراك، يبقي OpenClaw أيضًا `CODEX_API_KEY` و`OPENAI_API_KEY`
خارج عملية خادم التطبيق الفرعية المنشأة عبر stdio ويرسل بيانات الاعتماد المحددة
عبر RPC تسجيل الدخول في خادم التطبيق.

## توليد الصور

يسجل Plugin `openai` المضمّن توليد الصور عبر أداة `image_generate`.
وهو يدعم كلًا من توليد الصور بمفتاح API من OpenAI وتوليد الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| القدرة                    | مفتاح API من OpenAI                  | Codex OAuth                         |
| ------------------------- | ------------------------------------ | ----------------------------------- |
| مرجع النموذج              | `openai/gpt-image-2`                 | `openai/gpt-image-2`                |
| المصادقة                  | `OPENAI_API_KEY`                     | تسجيل دخول OpenAI Codex OAuth       |
| النقل                     | OpenAI Images API                    | واجهة Codex Responses الخلفية       |
| الحد الأقصى للصور لكل طلب | 4                                    | 4                                   |
| وضع التحرير               | مفعّل (حتى 5 صور مرجعية)            | مفعّل (حتى 5 صور مرجعية)           |
| تجاوزات الحجم             | مدعومة، بما في ذلك أحجام 2K/4K       | مدعومة، بما في ذلك أحجام 2K/4K      |
| نسبة العرض إلى الارتفاع / الدقة | لا تُمرر إلى OpenAI Images API | تُطابق مع حجم مدعوم عندما يكون ذلك آمنًا |

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

`gpt-image-2` هو الإعداد الافتراضي لكل من توليد النص إلى صورة وتحرير الصور في OpenAI.
وتظل `gpt-image-1.5` و`gpt-image-1` و`gpt-image-1-mini` قابلة للاستخدام كتجاوزات
صريحة للنموذج. استخدم `openai/gpt-image-1.5` لمخرجات PNG/WebP ذات خلفية شفافة؛
إذ ترفض واجهة API الحالية لـ `gpt-image-2`
`background: "transparent"`.

بالنسبة إلى طلب خلفية شفافة، ينبغي للوكلاء استدعاء `image_generate` مع
`model: "openai/gpt-image-1.5"`، و`outputFormat: "png"` أو `"webp"`، و
`background: "transparent"`؛ ولا يزال خيار المزوّد الأقدم `openai.background`
مقبولًا. يحمي OpenClaw أيضًا مسارات OpenAI العامة ومسارات
OpenAI Codex OAuth عن طريق إعادة كتابة طلبات الشفافية الافتراضية
`openai/gpt-image-2` إلى `gpt-image-1.5`؛ أما نقاط نهاية Azure ونقاط النهاية المخصصة
المتوافقة مع OpenAI فتحتفظ بأسماء النشر/النموذج المكوّنة لديها.

الإعداد نفسه مكشوف لتشغيلات CLI دون واجهة:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

استخدم علمي `--output-format` و`--background` نفسيهما مع
`openclaw infer image edit` عند البدء من ملف إدخال.
ويظل `--openai-background` متاحًا كاسم بديل خاص بـ OpenAI.

بالنسبة إلى تثبيتات Codex OAuth، أبقِ مرجع `openai/gpt-image-2` نفسه. عند تكوين
ملف تعريف OAuth من نوع `openai-codex`، يحل OpenClaw رمز وصول OAuth المخزن ذاك
ويرسل طلبات الصور عبر واجهة Codex Responses الخلفية. وهو لا يجرّب أولًا
`OPENAI_API_KEY` ولا يرجع صامتًا إلى مفتاح API لذلك الطلب.
كوّن `models.providers.openai` صراحةً بمفتاح API،
أو عنوان URL أساسي مخصص، أو نقطة نهاية Azure عندما تريد مسار OpenAI Images API
المباشر بدلًا من ذلك.
إذا كانت نقطة نهاية الصور المخصصة هذه على شبكة LAN/عنوان خاص موثوق، فعيّن أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ إذ يبقي OpenClaw
نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محظورة ما لم يوجد هذا الاشتراك الصريح.

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

يسجل Plugin `openai` المضمّن توليد الفيديو عبر أداة `video_generate`.

| القدرة            | القيمة                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2`                                                                  |
| الأوضاع           | نص إلى فيديو، صورة إلى فيديو، تحرير فيديو واحد                                  |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد                                                        |
| تجاوزات الحجم     | مدعومة                                                                           |
| تجاوزات أخرى      | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة |

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

## مساهمة موجه GPT-5

يضيف OpenClaw مساهمة موجه GPT-5 مشتركة لتشغيلات عائلة GPT-5 عبر المزوّدين. وهي تُطبق حسب معرّف النموذج، لذلك تتلقى `openai-codex/gpt-5.5` و`openai/gpt-5.5` و`openrouter/openai/gpt-5.5` و`opencode/gpt-5.5` ومراجع GPT-5 المتوافقة الأخرى التراكب نفسه. ولا تحصل نماذج GPT-4.x الأقدم على ذلك.

يستخدم مشغّل Codex الأصلي المضمّن سلوك GPT-5 نفسه وتراكب Heartbeat نفسه عبر تعليمات مطوّر خادم تطبيق Codex، لذلك تحتفظ جلسات `openai/gpt-5.x` المفروضة عبر `agentRuntime.id: "codex"` بإرشادات المتابعة وHeartbeat الاستباقية نفسها حتى لو كان Codex يملك بقية موجه المشغّل.

تضيف مساهمة GPT-5 عقد سلوك موسومًا لاستمرارية الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوص الإكمال، والتحقق. يبقى سلوك الردود الخاصة بالقنوات والرسائل الصامتة في موجه نظام OpenClaw المشترك وسياسة التسليم الصادرة. تُفعّل إرشادات GPT-5 دائمًا للنماذج المطابقة. أما طبقة نمط التفاعل الودّي فهي منفصلة وقابلة للتكوين.

| القيمة                 | التأثير                            |
| ---------------------- | ---------------------------------- |
| `"friendly"` (افتراضي) | تفعيل طبقة نمط التفاعل الودّي      |
| `"on"`                 | اسم بديل لـ `"friendly"`           |
| `"off"`                | تعطيل طبقة النمط الودّي فقط        |

<Tabs>
  <Tab title="الإعدادات">
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
القيم غير حساسة لحالة الأحرف أثناء التشغيل، لذلك يعطل كل من `"Off"` و`"off"` طبقة النمط الودّي.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ كرجوع احتياطي للتوافق عندما لا يكون إعداد `agents.defaults.promptOverlays.gpt5.personality` المشترك مضبوطًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="توليف الكلام (TTS)">
    يسجل Plugin `openai` المضمّن توليف الكلام لسطح `messages.tts`.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، `gpt-4o-mini-tts` فقط) |
    | الصيغة | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يرجع إلى `OPENAI_API_KEY` |
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
    عيّن `OPENAI_TTS_BASE_URL` لتجاوز عنوان URL الأساسي لـ TTS دون التأثير في نقطة نهاية واجهة API للدردشة.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجل Plugin `openai` المضمّن تحويل الكلام إلى نص بالدفعات عبر
    سطح النسخ لفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم بواسطة OpenClaw أينما يستخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية ومرفقات
      الصوت في القنوات

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

    تُمرَّر تلميحات اللغة والموجّه إلى OpenAI عند توفيرها من خلال
    إعداد وسائط الصوت المشتركة أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ الفوري">
    يسجّل Plugin `openai` المضمّن النسخ الفوري لـ Plugin Voice Call.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير معيّن) |
    | الموجّه | `...openai.prompt` | (غير معيّن) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | حد VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يعود احتياطيًا إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). موفر البث هذا مخصّص لمسار النسخ الفوري في Voice Call؛ أما صوت Discord فيسجّل حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار النسخ الدفعي `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت الفوري">
    يسجّل Plugin `openai` المضمّن الصوت الفوري لـ Plugin Voice Call.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة | `...openai.temperature` | `0.8` |
    | حد VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يعود احتياطيًا إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفاتيح الإعداد `azureEndpoint` و`azureDeployment` للجسور الفورية الخلفية. يدعم استدعاء الأدوات ثنائي الاتجاه. يستخدم تنسيق صوت G.711 u-law.
    </Note>

    <Note>
    يستخدم Control UI Talk جلسات OpenAI الفورية في المتصفح مع سر عميل مؤقت
    صادر من Gateway وتبادل WebRTC SDP مباشر في المتصفح مقابل
    OpenAI Realtime API. التحقق المباشر للمشرفين متاح باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ينشئ طرف OpenAI سر عميل في Node، ويولّد عرض SDP في المتصفح
    بوسائط ميكروفون وهمية، ويرسله إلى OpenAI، ويطبّق إجابة SDP
    بدون تسجيل الأسرار.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لموفر `openai` المضمّن استهداف مورد Azure OpenAI لتوليد الصور
عن طريق تجاوز عنوان URL الأساسي. في مسار توليد الصور، يكتشف OpenClaw
أسماء مضيفي Azure على `models.providers.openai.baseUrl` ويتحول إلى
شكل طلب Azure تلقائيًا.

<Note>
يستخدم الصوت الفوري مسار إعداد منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **الصوت
الفوري** ضمن [الصوت والكلام](#voice-and-speech) لإعدادات Azure الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- تكون لديك بالفعل اشتراك Azure OpenAI أو حصة استخدام أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال يوفرها Azure
- تريد إبقاء حركة المرور داخل مستأجر Azure موجود

### الإعداد

لتوليد الصور عبر Azure من خلال موفر `openai` المضمّن، وجّه
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

يتعرّف OpenClaw على لواحق مضيف Azure هذه لمسار توليد الصور في Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

بالنسبة لطلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات محددة النشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب
- يستخدم مهلة طلب افتراضية قدرها 600 ثانية لاستدعاءات توليد الصور في Azure.
  لا تزال قيم `timeoutMs` لكل استدعاء تتجاوز هذا الافتراضي.

تحافظ عناوين URL الأساسية الأخرى (OpenAI العامة، والوكلاء المتوافقون مع OpenAI)
على شكل طلب الصور القياسي الخاص بـ OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور في موفر `openai`
OpenClaw 2026.4.22 أو أحدث. تتعامل الإصدارات الأقدم مع أي
`openai.baseUrl` مخصّص كنقطة نهاية OpenAI العامة، وستفشل مع
عمليات نشر الصور في Azure.
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
الموجّهة عبر موفر `openai` المضمّن، يجب أن يكون حقل `model` في OpenClaw
هو **اسم نشر Azure** الذي أعددته في بوابة Azure، وليس معرّف نموذج OpenAI العام.

إذا أنشأت نشرًا باسم `gpt-image-2-prod` يقدّم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجّهة عبر
موفر `openai` المضمّن.

### التوفر الإقليمي

يتوفر توليد الصور في Azure حاليًا في مجموعة فرعية فقط من المناطق
(على سبيل المثال `eastus2` و`swedencentral` و`polandcentral` و`westus3`
و`uaenorth`). تحقق من قائمة المناطق الحالية لدى Microsoft قبل إنشاء
نشر، وتأكد من أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا يقبل Azure OpenAI وOpenAI العام دائمًا معلمات الصور نفسها.
قد يرفض Azure خيارات يسمح بها OpenAI العام (مثل بعض قيم
`background` على `gpt-image-2`) أو يتيحها فقط في إصدارات نماذج
محددة. تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من
OpenClaw. إذا فشل طلب Azure مع خطأ تحقق، فتحقق من مجموعة
المعلمات المدعومة بواسطة النشر وإصدار API المحددين لديك في
بوابة Azure.

<Note>
يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق، لكنه لا يتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع أكورديون **المسارات
الأصلية مقابل المسارات المتوافقة مع OpenAI** ضمن [الإعداد المتقدم](#advanced-configuration).

بالنسبة لحركة المحادثة أو Responses على Azure (خارج توليد الصور)، استخدم
مسار الإعداد الأولي أو إعداد موفر Azure مخصصًا — لا يكفي `openai.baseUrl` وحده
لاختيار شكل Azure API/المصادقة. يوجد موفر منفصل باسم
`azure-openai-responses/*`؛ راجع أكورديون Compaction من جانب الخادم أدناه.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw نهج WebSocket أولًا مع الرجوع إلى SSE (`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع إلى SSE
    - بعد الفشل، يعلّم WebSocket كمتدهور لمدة نحو 60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات ثابتة لهوية الجلسة والدوران لعمليات إعادة المحاولة وإعادة الاتصال
    - يطبّع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (الافتراضي) | WebSocket أولًا، مع الرجوع إلى SSE |
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
    - [استجابات API المتدفقة (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="تسخين WebSocket">
    يفعّل OpenClaw تسخين WebSocket افتراضيًا لـ `openai/*` و`openai-codex/*` لتقليل زمن الاستجابة في أول دورة.

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
    يعرّض OpenClaw مفتاح تبديل مشتركًا للوضع السريع لـ `openai/*` و`openai-codex/*`:

    - **المحادثة/UI:** `/fast status|on|off`
    - **الإعداد:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التفعيل، يربط OpenClaw الوضع السريع بمعالجة الأولوية في OpenAI (`service_tier = "priority"`). تُحفظ قيم `service_tier` الموجودة، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

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
    تتغلب تجاوزات الجلسة على الإعداد. يؤدي مسح تجاوز الجلسة في واجهة Sessions UI إلى إعادة الجلسة إلى الافتراضي المكوّن.
    </Note>

  </Accordion>

  <Accordion title="معالجة الأولوية (service_tier)">
    تعرض API الخاصة بـ OpenAI معالجة الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

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
    لا يُمرَّر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجّهت أيًا من الموفرين عبر وكيل، يترك OpenClaw `service_tier` دون تغيير.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جانب الخادم (Responses API)">
    بالنسبة لنماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل مغلّف بث Pi-harness في Plugin OpenAI تلقائيًا Compaction من جانب الخادم:

    - يفرض `store: true` (إلا إذا عيّن توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` الافتراضي: 70% من `contextWindow` (أو `80000` عند عدم توفره)

    ينطبق هذا على مسار Pi harness المضمّن وعلى خطافات موفر OpenAI المستخدمة بواسطة عمليات التشغيل المضمّنة. يدير حزام خادم تطبيق Codex الأصلي سياقه الخاص عبر Codex ويتم إعداده بشكل منفصل باستخدام `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="التفعيل صراحةً">
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
      <Tab title="Custom threshold">
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
      <Tab title="Disable">
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
    يتحكم `responsesServerCompaction` فقط في حقن `context_management`. لا تزال نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم تضبط طبقة التوافق `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT الصارم العامل ذاتيًا">
    بالنسبة إلى عمليات تشغيل عائلة GPT-5 على `openai/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

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
    - لم يعد يتعامل مع دور يقتصر على الخطة فقط على أنه تقدم ناجح عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدور بتوجيه للتصرف الآن
    - يفعّل `update_plan` تلقائيًا للعمل الكبير
    - يعرض حالة محظورة صريحة إذا استمر النموذج في التخطيط دون تنفيذ

    <Note>
    يقتصر ذلك على عمليات تشغيل OpenAI وCodex من عائلة GPT-5 فقط. يحتفظ المزوّدون الآخرون وعائلات النماذج الأقدم بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI المباشرة وCodex وAzure OpenAI بشكل مختلف عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - تحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI بقيمة `none`
    - تحذف التعليل المعطّل للنماذج أو الوكلاء التي ترفض `reasoning.effort: "none"`
    - تضبط مخططات الأدوات افتراضيًا على الوضع الصارم
    - ترفق رؤوس إحالة مخفية على المضيفين الأصليين المتحقق منهم فقط
    - تحتفظ بتشكيل الطلب الخاص بـ OpenAI فقط (`service_tier`، و`store`، وتوافق التعليل، وتلميحات ذاكرة التخزين المؤقت للمطالبات)

    **مسارات الوكيل/المتوافقة:**
    - تستخدم سلوك توافق أكثر مرونة
    - تزيل `store` الخاص بـ Completions من حمولات `openai-completions` غير الأصلية
    - تقبل تمرير JSON المتقدم عبر `params.extra_body`/`params.extraBody` لوكلاء Completions المتوافقين مع OpenAI
    - تقبل `params.chat_template_kwargs` لوكلاء Completions المتوافقين مع OpenAI مثل vLLM
    - لا تفرض مخططات أدوات صارمة أو رؤوسًا خاصة بالمسارات الأصلية فقط

    يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق، لكنه لا يتلقى رؤوس الإحالة المخفية.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
