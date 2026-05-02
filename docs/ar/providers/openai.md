---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلاً من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدام OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T07:40:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0caf43895c1bc8494b1a0d4aeef98e575bb31aca047430a63156875bed3bb112
    source_path: providers/openai.md
    workflow: 16
---

توفر OpenAI واجهات API للمطورين لنماذج GPT، كما يتوفر Codex أيضا كوكيل برمجة ضمن خطة
ChatGPT عبر عملاء Codex من OpenAI. يبقي OpenClaw هذه
الواجهات منفصلة حتى يبقى الإعداد قابلا للتنبؤ.

يدعم OpenClaw ثلاثة مسارات من عائلة OpenAI. ينبغي لمعظم مشتركي ChatGPT/Codex
الذين يريدون سلوك Codex استخدام وقت تشغيل خادم تطبيق Codex الأصلي. تحدد
بادئة النموذج اسم الموفر/النموذج؛ ويحدد إعداد وقت تشغيل منفصل
من ينفذ حلقة الوكيل المضمنة:

- **مفتاح API** - وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (نماذج `openai/*`)
- **اشتراك Codex مع وقت تشغيل Codex الأصلي** - تسجيل الدخول إلى ChatGPT/Codex بالإضافة إلى تنفيذ خادم تطبيق Codex (نماذج `openai/*` بالإضافة إلى `agents.defaults.agentRuntime.id: "codex"`)
- **اشتراك Codex عبر PI** - تسجيل الدخول إلى ChatGPT/Codex مع مشغل OpenClaw PI العادي (نماذج `openai-codex/*`)

تدعم OpenAI صراحة استخدام OAuth الخاص بالاشتراكات في الأدوات الخارجية وسير العمل مثل OpenClaw.

الموفر والنموذج ووقت التشغيل والقناة طبقات منفصلة. إذا كانت هذه التسميات
تختلط مع بعضها، فاقرأ [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) قبل
تغيير الإعداد.

## اختيار سريع

| الهدف                                                 | استخدم                                              | ملاحظات                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي | `openai/gpt-5.5` بالإضافة إلى `agentRuntime.id: "codex"` | إعداد Codex الموصى به لمعظم المستخدمين. سجّل الدخول باستخدام مصادقة `openai-codex`. |
| فوترة مباشرة بمفتاح API                               | `openai/gpt-5.5`                                 | عيّن `OPENAI_API_KEY` أو شغّل تهيئة مفتاح API من OpenAI.                    |
| مصادقة اشتراك ChatGPT/Codex عبر PI           | `openai-codex/gpt-5.5`                           | استخدم هذا فقط عندما تريد عمدا مشغل PI العادي.                |
| توليد الصور أو تحريرها                          | `openai/gpt-image-2`                             | يعمل مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.                 |
| صور بخلفية شفافة                        | `openai/gpt-image-1.5`                           | استخدم `outputFormat=png` أو `webp` و`openai.background=transparent`.     |

## خريطة التسمية

الأسماء متشابهة لكنها غير قابلة للتبادل:

| الاسم الذي تراه                       | الطبقة             | المعنى                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | بادئة الموفر   | مسار API مباشر إلى OpenAI Platform.                                                                 |
| `openai-codex`                     | بادئة الموفر   | مسار OpenAI Codex OAuth/الاشتراك عبر مشغل OpenClaw PI العادي.                      |
| `codex` plugin                     | Plugin            | Plugin مضمن في OpenClaw يوفر وقت تشغيل خادم تطبيق Codex الأصلي وعناصر تحكم الدردشة `/codex`. |
| `agentRuntime.id: codex`           | وقت تشغيل الوكيل     | فرض حزمة خادم تطبيق Codex الأصلية للجولات المضمنة.                                     |
| `/codex ...`                       | مجموعة أوامر الدردشة  | ربط/التحكم في سلاسل خادم تطبيق Codex من محادثة.                                        |
| `runtime: "acp", agentId: "codex"` | مسار جلسة ACP | مسار احتياطي صريح يشغل Codex عبر ACP/acpx.                                          |

هذا يعني أن الإعداد يمكن أن يحتوي عمدا على كل من `openai-codex/*` و
`codex` plugin. يكون ذلك صالحا عندما تريد Codex OAuth عبر PI وتريد أيضا
إتاحة عناصر تحكم الدردشة الأصلية `/codex`. يحذر `openclaw doctor` من هذا
المزيج حتى تتمكن من تأكيد أنه مقصود؛ ولا يعيد كتابته.

<Note>
يتوفر GPT-5.5 عبر الوصول المباشر بمفتاح API إلى OpenAI Platform وكذلك
عبر مسارات الاشتراك/OAuth. لاشتراك ChatGPT/Codex مع تنفيذ Codex
الأصلي، استخدم `openai/gpt-5.5` مع `agentRuntime.id: "codex"`. استخدم
`openai-codex/gpt-5.5` فقط من أجل Codex OAuth عبر PI، أو `openai/gpt-5.5`
دون تجاوز وقت تشغيل Codex لحركة مرور `OPENAI_API_KEY` المباشرة.
</Note>

<Note>
لا يؤدي تمكين OpenAI plugin، أو اختيار نموذج `openai-codex/*`، إلى
تمكين Plugin خادم تطبيق Codex المضمن. يمكّن OpenClaw ذلك Plugin فقط
عندما تختار صراحة حزمة Codex الأصلية باستخدام
`agentRuntime.id: "codex"` أو تستخدم مرجع نموذج قديم `codex/*`.
إذا كان `codex` plugin المضمن مفعلا لكن `openai-codex/*` ما زال يحل
عبر PI، فسيحذر `openclaw doctor` ويترك المسار دون تغيير.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI         | واجهة OpenClaw                                           | الحالة                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| الدردشة / الاستجابات          | موفر نموذج `openai/<model>`                            | نعم                                                    |
| نماذج اشتراك Codex | `openai-codex/<model>` مع `openai-codex` OAuth           | نعم                                                    |
| حزمة خادم تطبيق Codex  | `openai/<model>` مع `agentRuntime.id: codex`             | نعم                                                    |
| بحث الويب من جانب الخادم    | أداة OpenAI Responses الأصلية                               | نعم، عندما يكون بحث الويب مفعلا ولا يوجد موفر مثبت |
| الصور                    | `image_generate`                                           | نعم                                                    |
| الفيديوهات                    | `video_generate`                                           | نعم                                                    |
| تحويل النص إلى كلام            | `messages.tts.provider: "openai"` / `tts`                  | نعم                                                    |
| تحويل الكلام إلى نص بدفعات      | `tools.media.audio` / فهم الوسائط                  | نعم                                                    |
| تحويل الكلام إلى نص بالبث  | Voice Call `streaming.provider: "openai"`                  | نعم                                                    |
| الصوت الفوري            | Voice Call `realtime.provider: "openai"` / Control UI Talk | نعم                                                    |
| التضمينات                | موفر تضمينات الذاكرة                                  | نعم                                                    |

## تضمينات الذاكرة

يمكن لـ OpenClaw استخدام OpenAI، أو نقطة نهاية تضمينات متوافقة مع OpenAI، من أجل
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

بالنسبة إلى نقاط النهاية المتوافقة مع OpenAI التي تتطلب تسميات تضمين غير متماثلة، عيّن
`queryInputType` و`documentInputType` ضمن `memorySearch`. يمرر OpenClaw
هذه القيم كحقول طلب `input_type` خاصة بالموفر: تستخدم تضمينات الاستعلام
`queryInputType`؛ وتستخدم أجزاء الذاكرة المفهرسة والفهرسة بالدفعات
`documentInputType`. راجع [مرجع إعداد الذاكرة](/ar/reference/memory-config#provider-specific-config) للاطلاع على المثال الكامل.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [لوحة معلومات OpenAI Platform](https://platform.openai.com/api-keys).
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

    | مرجع النموذج              | إعداد وقت التشغيل             | المسار                       | المصادقة             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | محذوف / `agentRuntime.id: "pi"`    | API مباشر إلى OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | محذوف / `agentRuntime.id: "pi"`    | API مباشر إلى OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | حزمة خادم تطبيق Codex    | خادم تطبيق Codex |

    <Note>
    `openai/*` هو مسار مفتاح API المباشر من OpenAI إلا إذا فرضت صراحة
    حزمة خادم تطبيق Codex. استخدم `openai-codex/*` من أجل Codex OAuth عبر
    مشغل PI الافتراضي، أو استخدم `openai/gpt-5.5` مع
    `agentRuntime.id: "codex"` لتنفيذ خادم تطبيق Codex الأصلي.
    </Note>

    ### مثال إعداد

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    لا يعرض OpenClaw النموذج `openai/gpt-5.3-codex-spark`. ترفض طلبات OpenAI API الحية هذا النموذج، كما أن كتالوج Codex الحالي لا يعرضه أيضا.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex الخاص بك مع تنفيذ خادم تطبيق Codex الأصلي بدلا من مفتاح API منفصل. يتطلب Codex cloud تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        بالنسبة إلى الإعدادات دون واجهة أو التي لا تلائم الاستدعاء الراجع، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز جهاز ChatGPT بدلا من استدعاء متصفح localhost الراجع:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="استخدم وقت تشغيل Codex الأصلي">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex","fallback":"none"}' --strict-json
        ```
      </Step>
      <Step title="تحقق من توفر مصادقة Codex">
        ```bash
        openclaw models list --provider openai-codex
        ```

        بعد تشغيل Gateway، أرسل `/codex status` أو `/codex models`
        في الدردشة للتحقق من وقت تشغيل خادم التطبيق الأصلي.
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | إعداد وقت التشغيل | المسار | المصادقة |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | حزمة خادم تطبيق Codex الأصلية | تسجيل الدخول إلى Codex أو ملف تعريف `openai-codex` المحدد |
    | `openai-codex/gpt-5.5` | محذوف / `runtime: "pi"` | ChatGPT/Codex OAuth عبر PI | تسجيل الدخول إلى Codex |
    | `openai-codex/gpt-5.4-mini` | محذوف / `runtime: "pi"` | ChatGPT/Codex OAuth عبر PI | تسجيل الدخول إلى Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | لا يزال PI إلا إذا ادعى Plugin صراحة `openai-codex` | تسجيل الدخول إلى Codex |

    <Note>
    واصل استخدام معرّف المزوّد `openai-codex` لأوامر المصادقة/الملف الشخصي. بادئة
    النموذج `openai-codex/*` هي أيضًا مسار PI الصريح لمصادقة Codex OAuth.
    لا تحدد حزمة تشغيل خادم تطبيق Codex المضمّنة ولا تفعّلها تلقائيًا. بالنسبة إلى
    إعداد الاشتراك الشائع مع وقت التشغيل الأصلي، سجّل الدخول باستخدام
    `openai-codex` لكن أبقِ مرجع النموذج على `openai/gpt-5.5` واضبط
    `agentRuntime.id: "codex"`.
    </Note>

    ### مثال الإعدادات

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    لإبقاء Codex OAuth على مشغّل PI العادي بدلًا من ذلك، استخدم
    `openai-codex/gpt-5.5` واحذف تجاوز وقت تشغيل Codex.

    <Note>
    لم تعد عملية التهيئة تستورد مواد OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (افتراضيًا) أو تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكلاء الخاص به.
    </Note>

    ### مؤشر الحالة

    يعرض دردشة `/status` وقت تشغيل النموذج النشط للجلسة الحالية.
    تظهر حزمة تشغيل PI الافتراضية باسم `Runtime: OpenClaw Pi Default`. عند تحديد
    حزمة تشغيل خادم تطبيق Codex المضمّنة، يعرض `/status`
    `Runtime: OpenAI Codex`. تحتفظ الجلسات الحالية بمعرّف حزمة التشغيل المسجّل لها، لذلك استخدم
    `/new` أو `/reset` بعد تغيير `agentRuntime` إذا أردت أن يعكس `/status`
    اختيار PI/Codex جديدًا.

    ### تحذير الطبيب

    إذا كان Plugin `codex` المضمّن مفعّلًا أثناء تحديد مسار `openai-codex/*`،
    يحذّر `openclaw doctor` من أن النموذج لا يزال يُحلّ عبر PI.
    أبقِ الإعدادات دون تغيير فقط عندما يكون مسار مصادقة الاشتراك عبر PI
    مقصودًا. بدّل إلى `openai/<model>` مع `agentRuntime.id: "codex"` عندما
    تريد تنفيذًا أصليًا عبر خادم تطبيق Codex.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات النموذج الوصفية وحد سياق وقت التشغيل كقيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.5` عبر Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - حد `contextTokens` الافتراضي لوقت التشغيل: `272000`

    يوفّر الحد الافتراضي الأصغر زمن استجابة وخصائص جودة أفضل عمليًا. تجاوزه باستخدام `contextTokens`:

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
    استخدم `contextWindow` للتصريح ببيانات النموذج الأصلية الوصفية. استخدم `contextTokens` للحد من ميزانية سياق وقت التشغيل.
    </Note>

    ### استرداد الكتالوج

    يستخدم OpenClaw بيانات كتالوج Codex الوصفية من المصدر الأعلى لـ `gpt-5.5` عندما تكون
    موجودة. إذا أغفل اكتشاف Codex المباشر صف `openai-codex/gpt-5.5` بينما
    يكون الحساب موثقًا، ينشئ OpenClaw صف نموذج OAuth هذا بحيث
    لا تفشل عمليات cron والوكلاء الفرعيين والنموذج الافتراضي المكوّن مع
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة خادم تطبيق Codex الأصلي

تستخدم حزمة تشغيل خادم تطبيق Codex الأصلية مراجع نماذج `openai/*` مع
`agentRuntime.id: "codex"`، لكن مصادقتها لا تزال قائمة على الحساب. يختار OpenClaw
المصادقة بهذا الترتيب:

1. ملف مصادقة OpenClaw `openai-codex` صريح مرتبط بالوكيل.
2. حساب خادم التطبيق الحالي، مثل تسجيل دخول ChatGPT المحلي عبر Codex CLI.
3. لتشغيلات خادم تطبيق stdio المحلية فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما يبلّغ خادم التطبيق عن عدم وجود حساب ولا يزال يتطلب
   مصادقة OpenAI.

يعني ذلك أن تسجيل الدخول باشتراك ChatGPT/Codex المحلي لا يُستبدل لمجرد
أن عملية Gateway تحتوي أيضًا على `OPENAI_API_KEY` لنماذج OpenAI المباشرة
أو التضمينات. الرجوع الاحتياطي إلى مفتاح API من البيئة هو فقط لمسار stdio المحلي بلا حساب؛ ولا
يُرسل إلى اتصالات خادم التطبيق عبر WebSocket. عندما يُحدد ملف Codex
بنمط الاشتراك، يبقي OpenClaw أيضًا `CODEX_API_KEY` و`OPENAI_API_KEY`
خارج عملية خادم تطبيق stdio الفرعية التي يتم تشغيلها ويرسل بيانات الاعتماد المحددة
عبر RPC تسجيل الدخول إلى خادم التطبيق.

## توليد الصور

يسجل Plugin `openai` المضمّن توليد الصور عبر أداة `image_generate`.
وهو يدعم توليد الصور باستخدام مفتاح OpenAI API وتوليد الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| الإمكانية                 | مفتاح OpenAI API                   | Codex OAuth                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع النموذج              | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| المصادقة                  | `OPENAI_API_KEY`                   | تسجيل الدخول إلى OpenAI Codex OAuth |
| النقل                     | OpenAI Images API                  | الواجهة الخلفية Codex Responses     |
| الحد الأقصى للصور لكل طلب | 4                                  | 4                                    |
| وضع التحرير               | مفعّل (حتى 5 صور مرجعية)           | مفعّل (حتى 5 صور مرجعية)            |
| تجاوزات الحجم             | مدعومة، بما في ذلك أحجام 2K/4K     | مدعومة، بما في ذلك أحجام 2K/4K      |
| نسبة العرض إلى الارتفاع / الدقة | لا تُمرر إلى OpenAI Images API | تُطابق إلى حجم مدعوم عندما يكون ذلك آمنًا |

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

`gpt-image-2` هو الخيار الافتراضي لكل من توليد النص إلى صورة في OpenAI
وتحرير الصور. تظل `gpt-image-1.5` و`gpt-image-1` و`gpt-image-1-mini` قابلة للاستخدام
كتجاوزات نموذج صريحة. استخدم `openai/gpt-image-1.5` لإخراج PNG/WebP
بخلفية شفافة؛ ترفض واجهة API الحالية لـ `gpt-image-2`
`background: "transparent"`.

لطلب خلفية شفافة، يجب أن يستدعي الوكلاء `image_generate` مع
`model: "openai/gpt-image-1.5"`، و`outputFormat: "png"` أو `"webp"`، و
`background: "transparent"`؛ ولا يزال خيار المزوّد الأقدم `openai.background`
مقبولًا. يحمي OpenClaw أيضًا مسارات OpenAI العامة و
OpenAI Codex OAuth عبر إعادة كتابة طلبات الشفافية الافتراضية `openai/gpt-image-2`
إلى `gpt-image-1.5`؛ وتحتفظ Azure ونقاط النهاية المخصصة المتوافقة مع OpenAI
بأسماء النشر/النماذج المكوّنة لها.

يُعرض الإعداد نفسه لتشغيلات CLI بلا واجهة:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

استخدم علامتي `--output-format` و`--background` نفسيهما مع
`openclaw infer image edit` عند البدء من ملف إدخال.
يبقى `--openai-background` متاحًا كاسم مستعار خاص بـ OpenAI.

بالنسبة إلى تثبيتات Codex OAuth، أبقِ المرجع نفسه `openai/gpt-image-2`. عند تكوين
ملف OAuth `openai-codex`، يحل OpenClaw رمز وصول OAuth المخزّن هذا
ويرسل طلبات الصور عبر الواجهة الخلفية Codex Responses. ولا يحاول أولًا
`OPENAI_API_KEY` أو يرجع بصمت إلى مفتاح API لذلك
الطلب. كوّن `models.providers.openai` صراحةً باستخدام مفتاح API،
أو عنوان URL أساسي مخصص، أو نقطة نهاية Azure عندما تريد مسار OpenAI Images API
المباشر بدلًا من ذلك.
إذا كانت نقطة نهاية الصور المخصصة هذه على LAN/عنوان خاص موثوق، فاضبط أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ يبقي OpenClaw
نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محظورة ما لم يكن هذا الاشتراك
موجودًا.

ولّد:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

ولّد PNG بخلفية شفافة:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

حرّر:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## توليد الفيديو

يسجل Plugin `openai` المضمّن توليد الفيديو عبر أداة `video_generate`.

| الإمكانية       | القيمة                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2`                                                                   |
| الأوضاع          | نص إلى فيديو، صورة إلى فيديو، تحرير فيديو واحد                                    |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد                                                         |
| تجاوزات الحجم    | مدعومة                                                                           |
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

يضيف OpenClaw مساهمة موجّه GPT-5 مشتركة لتشغيلات عائلة GPT-5 عبر المزوّدين. تُطبق حسب معرّف النموذج، لذلك تتلقى `openai-codex/gpt-5.5` و`openai/gpt-5.5` و`openrouter/openai/gpt-5.5` و`opencode/gpt-5.5` ومراجع GPT-5 المتوافقة الأخرى الطبقة نفسها. أما نماذج GPT-4.x الأقدم فلا تتلقاها.

تستخدم حزمة Codex الأصلية المضمّنة سلوك GPT-5 نفسه وطبقة Heartbeat عبر تعليمات مطوّر خادم تطبيق Codex، لذلك تحافظ جلسات `openai/gpt-5.x` المفروضة عبر `agentRuntime.id: "codex"` على إرشادات المتابعة وHeartbeat الاستباقية نفسها رغم أن Codex يملك بقية موجّه حزمة التشغيل.

تضيف مساهمة GPT-5 عقد سلوك موسومًا لاستمرارية الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوص الإكمال، والتحقق. يبقى سلوك الرد الخاص بالقنوات والرسائل الصامتة في موجّه نظام OpenClaw المشترك وسياسة التسليم الصادر. تكون إرشادات GPT-5 مفعّلة دائمًا للنماذج المطابقة. طبقة أسلوب التفاعل الودية منفصلة وقابلة للتكوين.

| القيمة                 | التأثير                                 |
| ---------------------- | ---------------------------------------- |
| `"friendly"` (افتراضي) | تفعيل طبقة أسلوب التفاعل الودية          |
| `"on"`                 | اسم مستعار لـ `"friendly"`               |
| `"off"`                | تعطيل طبقة الأسلوب الودية فقط            |

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
القيم غير حساسة لحالة الأحرف في وقت التشغيل، لذلك يعطّل كل من `"Off"` و`"off"` طبقة الأسلوب الودية.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ كرجوع احتياطي للتوافق عندما لا يكون إعداد `agents.defaults.promptOverlays.gpt5.personality` المشترك مضبوطًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    يسجل Plugin `openai` المضمّن توليف الكلام لسطح `messages.tts`.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير معيّن) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير معيّن، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يعود احتياطيًا إلى `OPENAI_API_KEY` |
    | عنوان URL الأساسي | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | جسم إضافي | `messages.tts.providers.openai.extraBody` / `extra_body` | (غير معيّن) |

    النماذج المتاحة: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. الأصوات المتاحة: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    يتم دمج `extraBody` في JSON طلب `/audio/speech` بعد الحقول التي ينشئها OpenClaw، لذا استخدمه لنقاط النهاية المتوافقة مع OpenAI التي تتطلب مفاتيح إضافية مثل `lang`. يتم تجاهل مفاتيح النماذج الأولية.

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
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز عنوان URL الأساسي لـ TTS دون التأثير في نقطة نهاية API الدردشة.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجل Plugin `openai` المضمّن تحويل الكلام إلى نص بالدفعات من خلال
    سطح النسخ لفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: تحميل ملف صوتي متعدد الأجزاء
    - مدعوم بواسطة OpenClaw في كل موضع يستخدم فيه نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قناة الصوت في Discord ومرفقات
      الصوت في القنوات

    لفرض استخدام OpenAI لنسخ الصوت الوارد:

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

    يتم تمرير تلميحات اللغة والمطالبة إلى OpenAI عند توفيرها بواسطة
    تكوين وسائط الصوت المشترك أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ في الوقت الفعلي">
    يسجل Plugin `openai` المضمّن النسخ في الوقت الفعلي لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير معيّن) |
    | المطالبة | `...openai.prompt` | (غير معيّن) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يعود احتياطيًا إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). موفر البث هذا مخصص لمسار النسخ في الوقت الفعلي الخاص بالمكالمات الصوتية؛ يسجل صوت Discord حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار نسخ الدفعات `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت في الوقت الفعلي">
    يسجل Plugin `openai` المضمّن الصوت في الوقت الفعلي لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يعود احتياطيًا إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفاتيح التكوين `azureEndpoint` و`azureDeployment` لجسور الوقت الفعلي الخلفية. يدعم استدعاء الأدوات ثنائي الاتجاه. يستخدم تنسيق صوت G.711 u-law.
    </Note>

    <Note>
    يستخدم Control UI Talk جلسات OpenAI في الوقت الفعلي في المتصفح مع سر عميل مؤقت
    مسكوك بواسطة Gateway وتبادل WebRTC SDP مباشر من المتصفح مقابل
    OpenAI Realtime API. يتوفر التحقق المباشر للمشرفين باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ينشئ طرف OpenAI سر عميل في Node، وينشئ عرض SDP للمتصفح
    مع وسائط ميكروفون وهمية، وينشره إلى OpenAI، ويطبق إجابة SDP
    دون تسجيل الأسرار.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لموفر `openai` المضمّن استهداف مورد Azure OpenAI لتوليد الصور
من خلال تجاوز عنوان URL الأساسي. في مسار توليد الصور، يكتشف OpenClaw
أسماء مضيفي Azure على `models.providers.openai.baseUrl` وينتقل إلى
شكل طلب Azure تلقائيًا.

<Note>
يستخدم الصوت في الوقت الفعلي مسار تكوين منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **الصوت في الوقت الفعلي**
ضمن [الصوت والكلام](#voice-and-speech) لإعدادات Azure الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- تكون لديك بالفعل اشتراك Azure OpenAI أو حصة أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال يوفرها Azure
- تريد إبقاء حركة المرور داخل مستأجر Azure موجود

### التكوين

لتوليد الصور عبر Azure من خلال موفر `openai` المضمّن، وجّه
`models.providers.openai.baseUrl` إلى مورد Azure الخاص بك واضبط `apiKey` على
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

بالنسبة إلى طلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات محددة بنطاق النشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب
- يستخدم مهلة طلب افتراضية قدرها 600 ثانية لاستدعاءات توليد الصور في Azure.
  ما تزال قيم `timeoutMs` لكل استدعاء تتجاوز هذا الافتراضي.

تحتفظ عناوين URL الأساسية الأخرى (OpenAI العام، والوكلاء المتوافقون مع OpenAI) بشكل
طلب صور OpenAI القياسي.

<Note>
يتطلب توجيه Azure لمسار توليد الصور في موفر `openai`
OpenClaw 2026.4.22 أو أحدث. تتعامل الإصدارات الأقدم مع أي
`openai.baseUrl` مخصص مثل نقطة نهاية OpenAI العامة وستفشل مقابل
عمليات نشر الصور في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار Azure معاينة أو GA محدد
لمسار توليد الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

الافتراضي هو `2024-12-01-preview` عندما لا يكون المتغير معيّنًا.

### أسماء النماذج هي أسماء النشر

يربط Azure OpenAI النماذج بعمليات النشر. بالنسبة إلى طلبات توليد الصور في Azure
الموجهة من خلال موفر `openai` المضمّن، يجب أن يكون حقل `model` في OpenClaw
هو **اسم نشر Azure** الذي كوّنته في بوابة Azure، وليس
معرّف نموذج OpenAI العام.

إذا أنشأت نشرًا باسم `gpt-image-2-prod` يخدم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجهة عبر
موفر `openai` المضمّن.

### التوفر الإقليمي

توليد الصور في Azure متاح حاليًا فقط في مجموعة فرعية من المناطق
(مثل `eastus2`، `swedencentral`، `polandcentral`، `westus3`،
`uaenorth`). تحقق من قائمة مناطق Microsoft الحالية قبل إنشاء
نشر، وتأكد من أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا يقبل Azure OpenAI وOpenAI العام دائمًا معلمات الصور نفسها.
قد يرفض Azure خيارات يسمح بها OpenAI العام (على سبيل المثال بعض
قيم `background` على `gpt-image-2`) أو يكشفها فقط على إصدارات نموذج
محددة. تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من
OpenClaw. إذا فشل طلب Azure بخطأ تحقق، فتحقق من
مجموعة المعلمات المدعومة بواسطة نشرك المحدد وإصدار API في
بوابة Azure.

<Note>
يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق لكنه لا يتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع أكورديون **المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI**
ضمن [التكوين المتقدم](#advanced-configuration).

بالنسبة إلى حركة الدردشة أو Responses على Azure (خارج توليد الصور)، استخدم
تدفق الإعداد الأولي أو تكوين موفر Azure مخصصًا — لا يؤدي `openai.baseUrl` وحده
إلى التقاط شكل Azure API/المصادقة. يوجد موفر منفصل
`azure-openai-responses/*`؛ راجع أكورديون الضغط من جانب الخادم أدناه.
</Note>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw نهج WebSocket أولًا مع رجوع احتياطي إلى SSE (`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر مرة واحدة قبل الرجوع احتياطيًا إلى SSE
    - بعد الفشل، يضع علامة على WebSocket باعتباره متدهورًا لمدة تقارب 60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات هوية جلسة ودورة ثابتة لإعادة المحاولات وإعادة الاتصال
    - يوحّد عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (الافتراضي) | WebSocket أولًا، مع رجوع احتياطي إلى SSE |
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

  <Accordion title="إحماء WebSocket">
    يمكّن OpenClaw إحماء WebSocket افتراضيًا لـ `openai/*` و`openai-codex/*` لتقليل زمن استجابة الدورة الأولى.

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
    يكشف OpenClaw عن مفتاح تبديل مشترك للوضع السريع لـ `openai/*` و`openai-codex/*`:

    - **الدردشة/UI:** `/fast status|on|off`
    - **التكوين:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند تمكينه، يربط OpenClaw الوضع السريع بمعالجة الأولوية في OpenAI (`service_tier = "priority"`). يتم الاحتفاظ بقيم `service_tier` الحالية، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

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
    تتفوق تجاوزات الجلسة على التكوين. يؤدي مسح تجاوز الجلسة في واجهة Sessions إلى إعادة الجلسة إلى الافتراضي المكوّن.
    </Note>

  </Accordion>

  <Accordion title="معالجة الأولوية (service_tier)">
    يكشف API الخاص بـ OpenAI معالجة الأولوية عبر `service_tier`. اضبطه لكل نموذج في OpenClaw:

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
    لا يُمرَّر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجّهت أيًّا من المزوّدين عبر وكيل، يترك OpenClaw قيمة `service_tier` دون تغيير.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جانب الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل مغلّف تدفق Pi-harness الخاص بـ OpenAI plugin ميزة Compaction من جانب الخادم تلقائيًا:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - قيمة `compact_threshold` الافتراضية: 70% من `contextWindow` (أو `80000` عند عدم توفرها)

    ينطبق هذا على مسار Pi harness المدمج وعلى خطافات مزوّد OpenAI المستخدمة في عمليات التشغيل المضمّنة. يدير مسار Codex app-server harness الأصلي سياقه الخاص عبر Codex، ويُضبط بشكل منفصل باستخدام `agents.defaults.agentRuntime.id`.

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
      <Tab title="التعطيل">
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
    - لم يعد يعدّ دورة التخطيط فقط تقدمًا ناجحًا عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدورة مع توجيه للتنفيذ الآن
    - يفعّل `update_plan` تلقائيًا للأعمال الكبيرة
    - يعرض حالة حظر صريحة إذا استمر النموذج في التخطيط دون تنفيذ

    <Note>
    يقتصر ذلك على عمليات تشغيل عائلة GPT-5 الخاصة بـ OpenAI وCodex فقط. تحتفظ المزوّدات الأخرى وعائلات النماذج الأقدم بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI وCodex وAzure OpenAI المباشرة بشكل مختلف عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - يحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI `none`
    - يحذف الاستدلال المعطّل للنماذج أو الوكلاء الذين يرفضون `reasoning.effort: "none"`
    - يضبط مخططات الأدوات افتراضيًا على الوضع الصارم
    - يرفق ترويسات نسبة مخفية على المضيفين الأصليين المتحقق منهم فقط
    - يحتفظ بتشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier`، `store`، توافق الاستدلال، تلميحات ذاكرة التخزين المؤقت للمطالبات)

    **مسارات الوكيل/المتوافقة:**
    - تستخدم سلوك توافق أكثر مرونة
    - تزيل `store` الخاصة بالإكمالات من حمولات `openai-completions` غير الأصلية
    - تقبل تمرير JSON المتقدم عبر `params.extra_body`/`params.extraBody` لوكلاء الإكمالات المتوافقين مع OpenAI
    - تقبل `params.chat_template_kwargs` لوكلاء الإكمالات المتوافقين مع OpenAI مثل vLLM
    - لا تفرض مخططات أدوات صارمة أو ترويسات أصلية فقط

    يستخدم Azure OpenAI نقلًا أصليًا وسلوك توافق، لكنه لا يتلقى ترويسات النسبة المخفية.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
