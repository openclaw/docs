---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-03T07:39:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdffcdf53d9b17a19450c2ce47103db116e54a71a8dd432d981f5ece81cc38b3
    source_path: providers/openai.md
    workflow: 16
---

توفر OpenAI واجهات API للمطورين لنماذج GPT، كما يتوفر Codex أيضًا بصفته عامل برمجة ضمن خطة ChatGPT عبر عملاء Codex من OpenAI. يبقي OpenClaw هذه الأسطح منفصلة حتى تظل الإعدادات قابلة للتنبؤ.

يدعم OpenClaw ثلاثة مسارات من عائلة OpenAI. ينبغي لمعظم مشتركي ChatGPT/Codex الذين يريدون سلوك Codex استخدام وقت تشغيل خادم تطبيق Codex الأصلي. تحدد بادئة النموذج اسم الموفر/النموذج؛ ويحدد إعداد وقت تشغيل منفصل من ينفذ حلقة العامل المضمنة:

- **مفتاح API** - وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (نماذج `openai/*`)
- **اشتراك Codex مع وقت تشغيل Codex الأصلي** - تسجيل دخول ChatGPT/Codex بالإضافة إلى تنفيذ خادم تطبيق Codex (نماذج `openai/*` بالإضافة إلى `agents.defaults.agentRuntime.id: "codex"`)
- **اشتراك Codex عبر PI** - تسجيل دخول ChatGPT/Codex مع مشغّل OpenClaw PI العادي (نماذج `openai-codex/*`)

تدعم OpenAI صراحة استخدام OAuth الخاص بالاشتراكات في الأدوات وسير العمل الخارجية مثل OpenClaw.

الموفر والنموذج ووقت التشغيل والقناة طبقات منفصلة. إذا كانت هذه التسميات تختلط معًا، فاقرأ [أوقات تشغيل العامل](/ar/concepts/agent-runtimes) قبل تغيير الإعدادات.

## الاختيار السريع

| الهدف                                                 | استخدم                                              | ملاحظات                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي | `openai/gpt-5.5` بالإضافة إلى `agentRuntime.id: "codex"` | إعداد Codex الموصى به لمعظم المستخدمين. سجّل الدخول بمصادقة `openai-codex`. |
| فوترة مباشرة بمفتاح API                               | `openai/gpt-5.5`                                 | عيّن `OPENAI_API_KEY` أو شغّل إعداد OpenAI بمفتاح API.                    |
| مصادقة اشتراك ChatGPT/Codex عبر PI           | `openai-codex/gpt-5.5`                           | استخدمه فقط عندما تريد عمدًا مشغّل PI العادي.                |
| توليد الصور أو تحريرها                          | `openai/gpt-image-2`                             | يعمل مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.                 |
| صور بخلفية شفافة                        | `openai/gpt-image-1.5`                           | استخدم `outputFormat=png` أو `webp` و`openai.background=transparent`.     |

## خريطة التسميات

الأسماء متشابهة لكنها غير قابلة للتبادل:

| الاسم الذي تراه                       | الطبقة             | المعنى                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | بادئة الموفر   | مسار API مباشر إلى OpenAI Platform.                                                                 |
| `openai-codex`                     | بادئة الموفر   | مسار OpenAI Codex OAuth/الاشتراك عبر مشغّل OpenClaw PI العادي.                      |
| `codex` plugin                     | Plugin            | Plugin مضمن في OpenClaw يوفر وقت تشغيل خادم تطبيق Codex الأصلي وعناصر تحكم المحادثة `/codex`. |
| `agentRuntime.id: codex`           | وقت تشغيل العامل     | فرض حاوية خادم تطبيق Codex الأصلية للدورات المضمنة.                                     |
| `/codex ...`                       | مجموعة أوامر المحادثة  | ربط/التحكم في سلاسل خادم تطبيق Codex من محادثة.                                        |
| `runtime: "acp", agentId: "codex"` | مسار جلسة ACP | مسار احتياطي صريح يشغّل Codex عبر ACP/acpx.                                          |

يعني هذا أن الإعداد يمكن أن يحتوي عمدًا على كل من `openai-codex/*` وPlugin
`codex`. هذا صالح عندما تريد Codex OAuth عبر PI وتريد أيضًا إتاحة عناصر تحكم المحادثة `/codex` الأصلية. يحذّر `openclaw doctor` من هذا
التركيب حتى تتمكن من تأكيد أنه مقصود؛ ولا يعيد كتابته.

<Note>
يتوفر GPT-5.5 عبر كل من الوصول المباشر بمفتاح API إلى OpenAI Platform
ومسارات الاشتراك/OAuth. لاشتراك ChatGPT/Codex بالإضافة إلى تنفيذ Codex
الأصلي، استخدم `openai/gpt-5.5` مع `agentRuntime.id: "codex"`. استخدم
`openai-codex/gpt-5.5` فقط من أجل Codex OAuth عبر PI، أو `openai/gpt-5.5`
من دون تجاوز وقت تشغيل Codex لحركة مرور `OPENAI_API_KEY` المباشرة.
</Note>

<Note>
تمكين Plugin OpenAI، أو اختيار نموذج `openai-codex/*`، لا يمكّن
Plugin خادم تطبيق Codex المضمن. يمكّن OpenClaw ذلك Plugin فقط
عندما تختار صراحة حاوية Codex الأصلية باستخدام
`agentRuntime.id: "codex"` أو تستخدم مرجع نموذج `codex/*` قديمًا.
إذا كان Plugin `codex` المضمن مفعّلًا لكن `openai-codex/*` ما زال يُحل
عبر PI، فإن `openclaw doctor` يحذّر ويترك المسار بلا تغيير.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI         | سطح OpenClaw                                           | الحالة                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| المحادثة / الاستجابات          | موفر النموذج `openai/<model>`                            | نعم                                                    |
| نماذج اشتراك Codex | `openai-codex/<model>` مع OAuth الخاص بـ`openai-codex`           | نعم                                                    |
| حاوية خادم تطبيق Codex  | `openai/<model>` مع `agentRuntime.id: codex`             | نعم                                                    |
| البحث على الويب من جانب الخادم    | أداة OpenAI Responses الأصلية                               | نعم، عندما يكون البحث على الويب مفعّلًا ولا يوجد موفر مثبت |
| الصور                    | `image_generate`                                           | نعم                                                    |
| الفيديوهات                    | `video_generate`                                           | نعم                                                    |
| تحويل النص إلى كلام            | `messages.tts.provider: "openai"` / `tts`                  | نعم                                                    |
| تحويل الكلام إلى نص على دفعات      | `tools.media.audio` / فهم الوسائط                  | نعم                                                    |
| تحويل الكلام إلى نص بالبث  | مكالمة صوتية `streaming.provider: "openai"`                  | نعم                                                    |
| الصوت في الوقت الحقيقي            | مكالمة صوتية `realtime.provider: "openai"` / حديث Control UI | نعم                                                    |
| التضمينات                | موفر تضمين الذاكرة                                  | نعم                                                    |

## تضمينات الذاكرة

يمكن لـ OpenClaw استخدام OpenAI، أو نقطة نهاية تضمين متوافقة مع OpenAI، لفهرسة
`memory_search` وتضمينات الاستعلام:

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
هذه كحقول طلب `input_type` خاصة بالموفر: تستخدم تضمينات الاستعلام
`queryInputType`؛ وتستخدم مقاطع الذاكرة المفهرسة والفهرسة الدفعية
`documentInputType`. راجع [مرجع إعداد الذاكرة](/ar/reference/memory-config#provider-specific-config) للاطلاع على المثال الكامل.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل من أجل:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ أو انسخ مفتاح API من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرّر المفتاح مباشرة:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
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
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | حاوية خادم تطبيق Codex    | خادم تطبيق Codex |

    <Note>
    `openai/*` هو مسار OpenAI بمفتاح API مباشر ما لم تفرض صراحة
    حاوية خادم تطبيق Codex. استخدم `openai-codex/*` من أجل Codex OAuth عبر
    مشغّل PI الافتراضي، أو استخدم `openai/gpt-5.5` مع
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
    لا يعرّض OpenClaw النموذج `openai/gpt-5.3-codex-spark`. ترفض طلبات OpenAI API الحية ذلك النموذج، كما أن كتالوج Codex الحالي لا يعرّضه أيضًا.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل من أجل:** استخدام اشتراك ChatGPT/Codex الخاص بك مع تنفيذ خادم تطبيق Codex الأصلي بدلًا من مفتاح API منفصل. تتطلب سحابة Codex تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        بالنسبة إلى الإعدادات بلا واجهة أو التي لا تناسبها ردود الاستدعاء، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز جهاز ChatGPT بدلًا من رد استدعاء متصفح localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="استخدم وقت تشغيل Codex الأصلي">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="تحقق من توفر مصادقة Codex">
        ```bash
        openclaw models list --provider openai-codex
        ```

        بعد تشغيل Gateway، أرسل `/codex status` أو `/codex models`
        في المحادثة للتحقق من وقت تشغيل خادم التطبيق الأصلي.
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | إعداد وقت التشغيل | المسار | المصادقة |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | حاوية خادم تطبيق Codex الأصلية | تسجيل دخول Codex أو ملف تعريف `openai-codex` المحدد |
    | `openai-codex/gpt-5.5` | محذوف / `runtime: "pi"` | OAuth الخاص بـChatGPT/Codex عبر PI | تسجيل دخول Codex |
    | `openai-codex/gpt-5.4-mini` | محذوف / `runtime: "pi"` | OAuth الخاص بـChatGPT/Codex عبر PI | تسجيل دخول Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | يظل PI ما لم يطالب Plugin صراحة بـ`openai-codex` | تسجيل دخول Codex |

    <Note>
    واصل استخدام معرّف مزوّد `openai-codex` لأوامر المصادقة/الملف الشخصي. بادئة
    نموذج `openai-codex/*` هي أيضًا مسار PI الصريح لـ Codex OAuth.
    ولا تحدد أو تفعّل تلقائيًا حزمة مشغّل خادم تطبيق Codex المضمنة. بالنسبة إلى
    إعداد الاشتراك الشائع مع بيئة التشغيل الأصلية، سجّل الدخول باستخدام
    `openai-codex` لكن أبقِ مرجع النموذج كـ `openai/gpt-5.5` واضبط
    `agentRuntime.id: "codex"`.
    </Note>

    ### مثال الإعداد

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    لإبقاء Codex OAuth على مشغّل PI العادي بدلًا من ذلك، استخدم
    `openai-codex/gpt-5.5` واحذف تجاوز بيئة تشغيل Codex.

    <Note>
    لم يعد الإعداد الأولي يستورد مواد OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكيل الخاص به.
    </Note>

    ### مؤشر الحالة

    تعرض دردشة `/status` بيئة تشغيل النموذج النشطة للجلسة الحالية.
    يظهر مشغّل PI الافتراضي كـ `Runtime: OpenClaw Pi Default`. عندما يتم تحديد
    مشغّل خادم تطبيق Codex المضمن، تعرض `/status`
    `Runtime: OpenAI Codex`. تحتفظ الجلسات الحالية بمعرّف المشغّل المسجل لديها، لذا استخدم
    `/new` أو `/reset` بعد تغيير `agentRuntime` إذا أردت أن تعكس `/status`
    اختيار PI/Codex جديدًا.

    ### تحذير الطبيب

    إذا كان Plugin `codex` المضمن مفعّلًا أثناء تحديد مسار `openai-codex/*`،
    يحذّر `openclaw doctor` من أن النموذج لا يزال يُحل عبر PI.
    أبقِ الإعداد دون تغيير فقط عندما يكون مسار مصادقة الاشتراك عبر PI
    مقصودًا. انتقل إلى `openai/<model>` مع `agentRuntime.id: "codex"` عندما
    تريد تنفيذ خادم تطبيق Codex الأصلي.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات تعريف النموذج وحد سياق بيئة التشغيل كقيم منفصلة.

    بالنسبة إلى `openai-codex/gpt-5.5` عبر Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - حد `contextTokens` الافتراضي لبيئة التشغيل: `272000`

    يملك الحد الافتراضي الأصغر خصائص زمن استجابة وجودة أفضل عمليًا. تجاوزه باستخدام `contextTokens`:

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
    استخدم `contextWindow` للإعلان عن بيانات تعريف النموذج الأصلية. استخدم `contextTokens` للحد من ميزانية سياق بيئة التشغيل.
    </Note>

    ### استرداد الكتالوج

    يستخدم OpenClaw بيانات تعريف كتالوج Codex الأصلية لـ `gpt-5.5` عند
    وجودها. إذا أغفل اكتشاف Codex المباشر صف `openai-codex/gpt-5.5` بينما
    يكون الحساب مصادقًا، ينشئ OpenClaw ذلك صف نموذج OAuth حتى
    لا تفشل عمليات cron والوكيل الفرعي والنموذج الافتراضي المضبوط بسبب
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة خادم تطبيق Codex الأصلي

يستخدم مشغّل خادم تطبيق Codex الأصلي مراجع نماذج `openai/*` مع
`agentRuntime.id: "codex"`، لكن مصادقته لا تزال قائمة على الحساب. يختار OpenClaw
المصادقة بهذا الترتيب:

1. ملف مصادقة OpenClaw صريح من نوع `openai-codex` مرتبط بالوكيل.
2. الحساب الموجود لدى خادم التطبيق، مثل تسجيل دخول ChatGPT محلي عبر Codex CLI.
3. لعمليات تشغيل خادم التطبيق المحلي عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما يبلّغ خادم التطبيق عن عدم وجود حساب ولا يزال يتطلب
   مصادقة OpenAI.

هذا يعني أن تسجيل دخول اشتراك ChatGPT/Codex محلي لا يُستبدل لمجرد
أن عملية Gateway لديها أيضًا `OPENAI_API_KEY` لنماذج OpenAI المباشرة
أو التضمينات. الرجوع الاحتياطي إلى مفتاح API من البيئة هو فقط لمسار stdio المحلي بلا حساب؛ ولا
يُرسل إلى اتصالات خادم التطبيق عبر WebSocket. عندما يتم تحديد ملف Codex
بنمط الاشتراك، يُبقي OpenClaw أيضًا `CODEX_API_KEY` و`OPENAI_API_KEY`
خارج عملية خادم التطبيق الفرعية عبر stdio ويرسل بيانات الاعتماد المحددة
من خلال app-server login RPC.

## إنشاء الصور

يسجّل Plugin `openai` المضمن إنشاء الصور عبر أداة `image_generate`.
وهو يدعم إنشاء الصور باستخدام مفتاح API من OpenAI وإنشاء الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| القدرة | مفتاح API من OpenAI | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع النموذج | `openai/gpt-image-2` | `openai/gpt-image-2` |
| المصادقة | `OPENAI_API_KEY` | تسجيل دخول OpenAI Codex OAuth |
| النقل | OpenAI Images API | واجهة Codex Responses الخلفية |
| الحد الأقصى للصور في الطلب | 4 | 4 |
| وضع التحرير | مفعّل (حتى 5 صور مرجعية) | مفعّل (حتى 5 صور مرجعية) |
| تجاوزات الحجم | مدعومة، بما في ذلك أحجام 2K/4K | مدعومة، بما في ذلك أحجام 2K/4K |
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
راجع [إنشاء الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

`gpt-image-2` هو الافتراضي لكل من إنشاء النص إلى صورة في OpenAI وتحرير الصور.
وتبقى `gpt-image-1.5` و`gpt-image-1` و`gpt-image-1-mini` قابلة للاستخدام
كتجاوزات نموذج صريحة. استخدم `openai/gpt-image-1.5` لمخرجات
PNG/WebP بخلفية شفافة؛ إذ ترفض واجهة API الحالية لـ `gpt-image-2`
`background: "transparent"`.

لطلب خلفية شفافة، يجب أن تستدعي الوكلاء `image_generate` مع
`model: "openai/gpt-image-1.5"` و`outputFormat: "png"` أو `"webp"` و
`background: "transparent"`؛ ولا يزال خيار المزوّد الأقدم `openai.background`
مقبولًا. يحمي OpenClaw أيضًا مسارات OpenAI العامة و
OpenAI Codex OAuth من خلال إعادة كتابة طلبات الشفافية الافتراضية
`openai/gpt-image-2` إلى `gpt-image-1.5`؛ بينما تحتفظ نقاط نهاية Azure
ونقاط النهاية المخصصة المتوافقة مع OpenAI بأسماء النشر/النماذج المضبوطة لديها.

يتوفر الإعداد نفسه لتشغيل CLI دون واجهة:

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
تظل `--openai-background` متاحة كاسم بديل خاص بـ OpenAI.

بالنسبة إلى تثبيتات Codex OAuth، أبقِ المرجع نفسه `openai/gpt-image-2`. عند
ضبط ملف OAuth من نوع `openai-codex`، يحل OpenClaw رمز وصول OAuth
المخزن ويرسل طلبات الصور عبر واجهة Codex Responses الخلفية. وهو
لا يحاول أولًا استخدام `OPENAI_API_KEY` ولا يرجع بصمت إلى مفتاح API لذلك
الطلب. اضبط `models.providers.openai` صراحةً باستخدام مفتاح API،
أو عنوان URL أساسي مخصص، أو نقطة نهاية Azure عندما تريد مسار OpenAI Images API
المباشر بدلًا من ذلك.
إذا كانت نقطة نهاية الصور المخصصة تلك على شبكة LAN/عنوان خاص موثوق، فاضبط أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ إذ يبقي OpenClaw
نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محظورة ما لم يكن هذا الاشتراك
موجودًا.

إنشاء:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

إنشاء PNG شفاف:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

تحرير:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## إنشاء الفيديو

يسجّل Plugin `openai` المضمن إنشاء الفيديو عبر أداة `video_generate`.

| القدرة | القيمة |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2` |
| الأوضاع | نص إلى فيديو، صورة إلى فيديو، تحرير فيديو واحد |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد |
| تجاوزات الحجم | مدعومة |
| تجاوزات أخرى | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة |

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
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## مساهمة موجّه GPT-5

يضيف OpenClaw مساهمة موجّه GPT-5 مشتركة لتشغيلات عائلة GPT-5 عبر المزوّدين. تُطبق حسب معرّف النموذج، لذا تتلقى `openai-codex/gpt-5.5` و`openai/gpt-5.5` و`openrouter/openai/gpt-5.5` و`opencode/gpt-5.5` ومراجع GPT-5 المتوافقة الأخرى التراكب نفسه. لا تنطبق على نماذج GPT-4.x الأقدم.

يستخدم مشغّل Codex الأصلي المضمن سلوك GPT-5 نفسه وتراكب Heartbeat عبر تعليمات مطوّر خادم تطبيق Codex، لذا تحافظ جلسات `openai/gpt-5.x` المفروضة عبر `agentRuntime.id: "codex"` على إرشادات المتابعة وHeartbeat الاستباقية نفسها رغم أن Codex يملك بقية موجّه المشغّل.

تضيف مساهمة GPT-5 عقد سلوك موسومًا لاستمرارية الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوص الإكمال، والتحقق. يبقى سلوك الرد الخاص بالقناة والرسائل الصامتة في موجّه نظام OpenClaw المشترك وسياسة التسليم الصادر. تكون إرشادات GPT-5 مفعّلة دائمًا للنماذج المطابقة. طبقة أسلوب التفاعل الودود منفصلة وقابلة للضبط.

| القيمة | التأثير |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (افتراضي) | تفعيل طبقة أسلوب التفاعل الودود |
| `"on"` | اسم بديل لـ `"friendly"` |
| `"off"` | تعطيل طبقة الأسلوب الودود فقط |

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
القيم غير حساسة لحالة الأحرف وقت التشغيل، لذا فإن `"Off"` و`"off"` كلتيهما تعطلان طبقة الأسلوب الودود.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ كرجوع احتياطي للتوافق عندما لا يكون إعداد `agents.defaults.promptOverlays.gpt5.personality` المشترك مضبوطًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    يسجّل Plugin `openai` المضمن تركيب الكلام لسطح `messages.tts`.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير معيّن) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير معيّن، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يعود إلى `OPENAI_API_KEY` |
    | عنوان URL الأساسي | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | متن إضافي | `messages.tts.providers.openai.extraBody` / `extra_body` | (غير معيّن) |

    النماذج المتاحة: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. الأصوات المتاحة: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    يتم دمج `extraBody` في JSON طلب `/audio/speech` بعد الحقول التي يولدها OpenClaw، لذا استخدمه لنقاط النهاية المتوافقة مع OpenAI التي تتطلب مفاتيح إضافية مثل `lang`. يتم تجاهل مفاتيح النماذج الأولية.

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
    عيّن `OPENAI_TTS_BASE_URL` لتجاوز عنوان URL الأساسي لـ TTS من دون التأثير في نقطة نهاية API الخاصة بالدردشة.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجل Plugin `openai` المضمن تحويل الكلام إلى نص بالدفعات عبر
    سطح نسخ فهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: تحميل ملف صوتي متعدد الأجزاء
    - مدعوم من OpenClaw حيثما يستخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع القنوات الصوتية في Discord ومرفقات
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

    تُمرر تلميحات اللغة والموجه إلى OpenAI عند توفيرها من خلال
    إعداد وسائط الصوت المشترك أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ في الوقت الفعلي">
    يسجل Plugin `openai` المضمن النسخ في الوقت الفعلي لـ Plugin Voice Call.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير معيّن) |
    | الموجه | `...openai.prompt` | (غير معيّن) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket بـ `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). موفر البث هذا مخصص لمسار النسخ في الوقت الفعلي في Voice Call؛ يسجل Discord voice حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار نسخ الدفعات `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت في الوقت الفعلي">
    يسجل Plugin `openai` المضمن الصوت في الوقت الفعلي لـ Plugin Voice Call.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفتاحي الإعداد `azureEndpoint` و`azureDeployment` لجسور الوقت الفعلي في الخلفية. يدعم استدعاء الأدوات ثنائي الاتجاه. يستخدم تنسيق صوت G.711 u-law.
    </Note>

    <Note>
    يستخدم Control UI Talk جلسات OpenAI في الوقت الفعلي عبر المتصفح مع سر عميل مؤقت
    يصدره Gateway وتبادل WebRTC SDP مباشر من المتصفح مقابل
    OpenAI Realtime API. يتوفر التحقق الحي للمشرفين باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`؛
    ينشئ جزء OpenAI سر عميل في Node، وينشئ عرض SDP من المتصفح
    مع وسائط ميكروفون مزيفة، وينشره إلى OpenAI، ويطبق إجابة SDP
    من دون تسجيل الأسرار.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لموفر `openai` المضمن استهداف مورد Azure OpenAI لتوليد الصور
عن طريق تجاوز عنوان URL الأساسي. في مسار توليد الصور، يكتشف OpenClaw
أسماء مضيفي Azure على `models.providers.openai.baseUrl` ويتحول إلى
شكل طلب Azure تلقائيًا.

<Note>
يستخدم الصوت في الوقت الفعلي مسار إعداد منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **الصوت في الوقت الفعلي**
ضمن [الصوت والكلام](#voice-and-speech) لمعرفة إعدادات Azure الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- يكون لديك بالفعل اشتراك Azure OpenAI أو حصة استخدام أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال يوفرها Azure
- تريد إبقاء الحركة داخل مستأجر Azure موجود

### الإعداد

لتوليد الصور عبر Azure من خلال موفر `openai` المضمن، وجّه
`models.providers.openai.baseUrl` إلى مورد Azure الخاص بك وعيّن `apiKey` إلى
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

يتعرف OpenClaw على لواحق مضيف Azure التالية لمسار توليد الصور
في Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

بالنسبة إلى طلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات محصورة بالنشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب
- يستخدم مهلة طلب افتراضية قدرها 600 ثانية لاستدعاءات توليد الصور في Azure.
  تظل قيم `timeoutMs` لكل استدعاء تتجاوز هذا الافتراضي.

تحتفظ عناوين URL الأساسية الأخرى (OpenAI العام، والوكلاء المتوافقون مع OpenAI) بشكل
طلب الصور القياسي في OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور في موفر `openai`
OpenClaw 2026.4.22 أو أحدث. تتعامل الإصدارات الأقدم مع أي
`openai.baseUrl` مخصص مثل نقطة نهاية OpenAI العامة وستفشل أمام عمليات نشر
الصور في Azure.
</Note>

### إصدار API

عيّن `AZURE_OPENAI_API_VERSION` لتثبيت إصدار Azure preview أو GA محدد
لمسار توليد الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

الافتراضي هو `2024-12-01-preview` عندما يكون المتغير غير معيّن.

### أسماء النماذج هي أسماء النشر

يربط Azure OpenAI النماذج بعمليات النشر. بالنسبة إلى طلبات توليد الصور في Azure
الموجهة عبر موفر `openai` المضمن، يجب أن يكون حقل `model` في OpenClaw
هو **اسم نشر Azure** الذي أعددته في بوابة Azure، وليس
معرّف نموذج OpenAI العام.

إذا أنشأت نشرًا باسم `gpt-image-2-prod` يخدم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجهة عبر
موفر `openai` المضمن.

### التوفر الإقليمي

يتوفر توليد الصور في Azure حاليًا في مجموعة فرعية فقط من المناطق
(على سبيل المثال `eastus2`، و`swedencentral`، و`polandcentral`، و`westus3`،
و`uaenorth`). تحقق من قائمة المناطق الحالية من Microsoft قبل إنشاء
نشر، وأكد أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا يقبل Azure OpenAI وOpenAI العام دائمًا معلمات الصور نفسها.
قد يرفض Azure خيارات يسمح بها OpenAI العام (على سبيل المثال قيم
`background` معينة في `gpt-image-2`) أو يكشفها فقط في إصدارات نماذج
محددة. تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من
OpenClaw. إذا فشل طلب Azure مع خطأ تحقق، فتحقق من
مجموعة المعلمات التي يدعمها النشر وإصدار API المحددان لديك في
بوابة Azure.

<Note>
يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق لكنه لا يتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع أكورديون **المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI**
ضمن [الإعداد المتقدم](#advanced-configuration).

بالنسبة إلى حركة الدردشة أو Responses على Azure (إلى جانب توليد الصور)، استخدم
تدفق الإعداد الأولي أو إعداد موفر Azure مخصصًا — لا يكفي `openai.baseUrl` وحده
لاستخدام شكل API/المصادقة الخاص بـ Azure. يوجد موفر منفصل
`azure-openai-responses/*`؛ راجع
أكورديون الضغط من جهة الخادم أدناه.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw أسلوب WebSocket أولًا مع الرجوع الاحتياطي إلى SSE (`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع إلى SSE
    - بعد الفشل، يضع علامة على WebSocket باعتباره متدهورًا لمدة تقارب 60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات ثابتة لهوية الجلسة والدور لإعادة المحاولات وإعادة الاتصال
    - يطبع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (افتراضي) | WebSocket أولًا، مع الرجوع الاحتياطي إلى SSE |
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
    - [Realtime API باستخدام WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [استجابات API المتدفقة (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="إحماء WebSocket">
    يفعّل OpenClaw إحماء WebSocket افتراضيًا لـ `openai/*` و`openai-codex/*` لتقليل زمن الاستجابة في الدور الأول.

    ```json5
    // تعطيل الإحماء
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

    - **الدردشة/واجهة المستخدم:** `/fast status|on|off`
    - **الإعداد:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند تفعيله، يربط OpenClaw الوضع السريع بمعالجة الأولوية في OpenAI (`service_tier = "priority"`). يتم الحفاظ على قيم `service_tier` الموجودة، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

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
    تتغلب تجاوزات الجلسة على الإعداد. يؤدي مسح تجاوز الجلسة في واجهة جلسات المستخدم إلى إعادة الجلسة إلى الافتراضي المكوّن.
    </Note>

  </Accordion>

  <Accordion title="معالجة الأولوية (service_tier)">
    تكشف API الخاصة بـ OpenAI عن معالجة الأولوية عبر `service_tier`. عيّنها لكل نموذج في OpenClaw:

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
    لا يُمرَّر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجّهت أيًّا من المزوّدين عبر وكيل، يترك OpenClaw `service_tier` كما هو دون تغيير.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جهة الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل غلاف تدفق Pi-harness الخاص بـ Plugin OpenAI ميزة Compaction من جهة الخادم تلقائيًا:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - قيمة `compact_threshold` الافتراضية: 70% من `contextWindow` (أو `80000` عند عدم توفرها)

    ينطبق هذا على مسار Pi harness المضمّن وعلى خطافات مزوّد OpenAI المستخدمة في عمليات التشغيل المضمّنة. يدير harness خادم تطبيق Codex الأصلي سياقه الخاص عبر Codex ويُضبط بشكل منفصل باستخدام `agents.defaults.agentRuntime.id`.

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
      <Tab title="عتبة مخصّصة">
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
    - لم يعد يتعامل مع دور يقتصر على الخطة فقط على أنه تقدّم ناجح عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدور بتوجيه للتصرّف الآن
    - يفعّل `update_plan` تلقائيًا للأعمال الكبيرة
    - يعرض حالة حظر صريحة إذا استمر النموذج في التخطيط دون تنفيذ

    <Note>
    يقتصر ذلك على عمليات تشغيل عائلة GPT-5 في OpenAI وCodex فقط. يحتفظ المزوّدون الآخرون وعائلات النماذج الأقدم بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI المباشرة وCodex وAzure OpenAI بشكل مختلف عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - تحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI `none`
    - تحذف التعليل المعطّل للنماذج أو الوكلاء الذين يرفضون `reasoning.effort: "none"`
    - تضبط مخططات الأدوات افتراضيًا على الوضع الصارم
    - ترفق ترويسات إسناد مخفية على المضيفين الأصليين المتحقق منهم فقط
    - تحتفظ بتشكيل طلبات OpenAI فقط (`service_tier`، `store`، توافق التعليل، تلميحات ذاكرة التخزين المؤقت للمطالبات)

    **مسارات الوكيل/المتوافقة:**
    - تستخدم سلوك توافق أكثر مرونة
    - تزيل Completions `store` من حمولات `openai-completions` غير الأصلية
    - تقبل تمرير JSON المتقدم عبر `params.extra_body`/`params.extraBody` لوكلاء Completions المتوافقين مع OpenAI
    - تقبل `params.chat_template_kwargs` لوكلاء Completions المتوافقين مع OpenAI مثل vLLM
    - لا تفرض مخططات أدوات صارمة أو ترويسات مخصّصة للمسارات الأصلية فقط

    يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق، لكنه لا يتلقى ترويسات الإسناد المخفية.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
