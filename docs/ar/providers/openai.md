---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد استخدام مصادقة اشتراك Codex بدلاً من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T09:03:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5606cafb8dfec888b922874202aa0fdcad8cbd4fec1a1e15a9074ad14bc5486
    source_path: providers/openai.md
    workflow: 16
---

توفر OpenAI واجهات API للمطورين لنماذج GPT، ويتوفر Codex أيضا كعامل برمجة ضمن خطة
ChatGPT عبر عملاء Codex من OpenAI. يحافظ OpenClaw على فصل هذه
الأسطح لكي يبقى الإعداد قابلا للتنبؤ.

يدعم OpenClaw ثلاثة مسارات من عائلة OpenAI. ينبغي لمعظم مشتركي ChatGPT/Codex
الذين يريدون سلوك Codex استخدام وقت تشغيل خادم تطبيق Codex الأصلي. تحدد
بادئة النموذج اسم المزود/النموذج؛ ويحدد إعداد وقت تشغيل منفصل
من ينفذ حلقة العامل المضمنة:

- **مفتاح API** - وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (نماذج `openai/*`)
- **اشتراك Codex مع وقت تشغيل Codex الأصلي** - تسجيل دخول ChatGPT/Codex بالإضافة إلى تنفيذ خادم تطبيق Codex (نماذج `openai/*` بالإضافة إلى `agents.defaults.agentRuntime.id: "codex"`)
- **اشتراك Codex عبر PI** - تسجيل دخول ChatGPT/Codex مع مشغل OpenClaw PI العادي (نماذج `openai-codex/*`)

تدعم OpenAI صراحة استخدام OAuth للاشتراكات في الأدوات الخارجية وسير العمل مثل OpenClaw.

المزود والنموذج ووقت التشغيل والقناة طبقات منفصلة. إذا كانت هذه التسميات
تختلط مع بعضها، فاقرأ [أوقات تشغيل العامل](/ar/concepts/agent-runtimes) قبل
تغيير الإعداد.

## اختيار سريع

| الهدف                                                 | الاستخدام                                              | الملاحظات                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي | `openai/gpt-5.5` بالإضافة إلى `agentRuntime.id: "codex"` | إعداد Codex الموصى به لمعظم المستخدمين. سجّل الدخول باستخدام مصادقة `openai-codex`. |
| فوترة مباشرة بمفتاح API                               | `openai/gpt-5.5`                                 | عيّن `OPENAI_API_KEY` أو شغّل تهيئة مفتاح API الخاص بـ OpenAI.                    |
| مصادقة اشتراك ChatGPT/Codex عبر PI           | `openai-codex/gpt-5.5`                           | استخدمه فقط عندما تريد عمدا مشغل PI العادي.                |
| إنشاء الصور أو تحريرها                          | `openai/gpt-image-2`                             | يعمل مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.                 |
| صور بخلفية شفافة                        | `openai/gpt-image-1.5`                           | استخدم `outputFormat=png` أو `webp` و`openai.background=transparent`.     |

## خريطة التسمية

الأسماء متشابهة لكنها غير قابلة للتبادل:

| الاسم الذي تراه                       | الطبقة             | المعنى                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | بادئة المزود   | مسار API مباشر إلى OpenAI Platform.                                                                 |
| `openai-codex`                     | بادئة المزود   | مسار OpenAI Codex OAuth/الاشتراك عبر مشغل OpenClaw PI العادي.                      |
| Plugin `codex`                     | Plugin            | Plugin مدمج في OpenClaw يوفر وقت تشغيل خادم تطبيق Codex الأصلي وعناصر تحكم دردشة `/codex`. |
| `agentRuntime.id: codex`           | وقت تشغيل العامل     | فرض حاضنة خادم تطبيق Codex الأصلية للدورات المضمنة.                                     |
| `/codex ...`                       | مجموعة أوامر الدردشة  | ربط/التحكم في سلاسل خادم تطبيق Codex من محادثة.                                        |
| `runtime: "acp", agentId: "codex"` | مسار جلسة ACP | مسار احتياطي صريح يشغّل Codex عبر ACP/acpx.                                          |

يعني هذا أن الإعداد يمكن أن يحتوي عمدا على كل من `openai-codex/*` وPlugin
`codex`. يكون ذلك صالحا عندما تريد Codex OAuth عبر PI وتريد أيضا
إتاحة عناصر تحكم دردشة `/codex` الأصلية. يحذر `openclaw doctor` من هذا
المزيج لكي تتمكن من تأكيد أنه مقصود؛ ولا يعيد كتابته.

<Note>
يتوفر GPT-5.5 من خلال الوصول المباشر بمفتاح API إلى OpenAI Platform
ومن خلال مسارات الاشتراك/OAuth أيضا. لاشتراك ChatGPT/Codex بالإضافة إلى تنفيذ Codex
الأصلي، استخدم `openai/gpt-5.5` مع `agentRuntime.id: "codex"`. استخدم
`openai-codex/gpt-5.5` فقط لـ Codex OAuth عبر PI، أو `openai/gpt-5.5`
من دون تجاوز وقت تشغيل Codex لحركة `OPENAI_API_KEY` المباشرة.
</Note>

<Note>
تمكين Plugin الخاص بـ OpenAI، أو اختيار نموذج `openai-codex/*`، لا
يمكّن Plugin خادم تطبيق Codex المدمج. يمكّن OpenClaw ذلك Plugin فقط
عندما تختار صراحة حاضنة Codex الأصلية باستخدام
`agentRuntime.id: "codex"` أو تستخدم مرجع نموذج قديم `codex/*`.
إذا كان Plugin `codex` المدمج مفعلا لكن `openai-codex/*` لا يزال يحل
عبر PI، يحذر `openclaw doctor` ويترك المسار دون تغيير.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI         | سطح OpenClaw                                           | الحالة                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| الدردشة / الاستجابات          | مزود نموذج `openai/<model>`                            | نعم                                                    |
| نماذج اشتراك Codex | `openai-codex/<model>` مع `openai-codex` OAuth           | نعم                                                    |
| حاضنة خادم تطبيق Codex  | `openai/<model>` مع `agentRuntime.id: codex`             | نعم                                                    |
| البحث في الويب من جانب الخادم    | أداة OpenAI Responses الأصلية                               | نعم، عند تمكين البحث في الويب وعدم تثبيت مزود |
| الصور                    | `image_generate`                                           | نعم                                                    |
| مقاطع الفيديو                    | `video_generate`                                           | نعم                                                    |
| تحويل النص إلى كلام            | `messages.tts.provider: "openai"` / `tts`                  | نعم                                                    |
| تحويل الكلام إلى نص بالدفعات      | `tools.media.audio` / فهم الوسائط                  | نعم                                                    |
| تحويل الكلام إلى نص بالتدفق  | Voice Call `streaming.provider: "openai"`                  | نعم                                                    |
| الصوت في الوقت الفعلي            | Voice Call `realtime.provider: "openai"` / Control UI Talk | نعم                                                    |
| Embeddings                | مزود embedding للذاكرة                                  | نعم                                                    |

## Embeddings الذاكرة

يمكن لـ OpenClaw استخدام OpenAI، أو نقطة نهاية embedding متوافقة مع OpenAI، من أجل
فهرسة `memory_search` وembeddings الاستعلام:

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

بالنسبة إلى نقاط النهاية المتوافقة مع OpenAI التي تتطلب تسميات embedding غير متناظرة، عيّن
`queryInputType` و`documentInputType` ضمن `memorySearch`. يمرر OpenClaw
هذه القيم كحقول طلب `input_type` خاصة بالمزود: تستخدم embeddings الاستعلام
`queryInputType`؛ وتستخدم مقاطع الذاكرة المفهرسة والفهرسة الدفعية
`documentInputType`. راجع [مرجع إعداد الذاكرة](/ar/reference/memory-config#provider-specific-config) للاطلاع على المثال الكامل.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="Get your API key">
        أنشئ أو انسخ مفتاح API من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرر المفتاح مباشرة:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
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
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | حاضنة خادم تطبيق Codex    | خادم تطبيق Codex |

    <Note>
    `openai/*` هو مسار مفتاح API المباشر الخاص بـ OpenAI ما لم تفرض صراحة
    حاضنة خادم تطبيق Codex. استخدم `openai-codex/*` لـ Codex OAuth عبر
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
    لا يعرّض OpenClaw النموذج `openai/gpt-5.3-codex-spark`. ترفض طلبات OpenAI API المباشرة ذلك النموذج، ولا يعرّضه كتالوج Codex الحالي أيضا.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex مع تنفيذ خادم تطبيق Codex الأصلي بدلا من مفتاح API منفصل. تتطلب سحابة Codex تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        للإعدادات دون واجهة أو التي لا تناسبها callbacks، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز جهاز ChatGPT بدلا من callback متصفح localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the native Codex runtime">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Verify Codex auth is available">
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
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | حاضنة خادم تطبيق Codex الأصلية | تسجيل دخول Codex أو ملف تعريف `openai-codex` المحدد |
    | `openai-codex/gpt-5.5` | محذوف / `runtime: "pi"` | ChatGPT/Codex OAuth عبر PI | تسجيل دخول Codex |
    | `openai-codex/gpt-5.4-mini` | محذوف / `runtime: "pi"` | ChatGPT/Codex OAuth عبر PI | تسجيل دخول Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | يبقى PI ما لم يطالب Plugin صراحة بـ `openai-codex` | تسجيل دخول Codex |

    <Warning>
    لا تضبط مراجع نماذج `openai-codex/gpt-5.1*` أو `openai-codex/gpt-5.2*` أو
    `openai-codex/gpt-5.3*` الأقدم. ترفض حسابات ChatGPT/Codex OAuth الآن
    تلك النماذج. استخدم `openai-codex/gpt-5.5` لمسار PI OAuth، أو
    `openai/gpt-5.5` مع `agentRuntime.id: "codex"` لتنفيذ وقت تشغيل Codex
    الأصلي.
    </Warning>

    <Note>
    استمر في استخدام معرّف المزوّد `openai-codex` لأوامر المصادقة/الملف الشخصي. بادئة
    النموذج `openai-codex/*` هي أيضًا مسار PI الصريح لـ Codex OAuth.
    إنها لا تختار أو تفعّل تلقائيًا حزمة تشغيل خادم التطبيق Codex المضمّنة. لإعداد
    الاشتراك الشائع مع وقت التشغيل الأصلي، سجّل الدخول باستخدام
    `openai-codex` لكن أبقِ مرجع النموذج `openai/gpt-5.5` وعيّن
    `agentRuntime.id: "codex"`.
    </Note>

    ### مثال إعدادات

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
    `openai-codex/gpt-5.5` واحذف تجاوز وقت تشغيل Codex.

    <Note>
    لم تعد عملية التهيئة تستورد مواد OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكلاء الخاص به.
    </Note>

    ### مؤشر الحالة

    يعرض دردشة `/status` وقت تشغيل النموذج النشط للجلسة الحالية.
    تظهر حزمة PI الافتراضية كـ `Runtime: OpenClaw Pi Default`. عند اختيار
    حزمة تشغيل خادم التطبيق Codex المضمّنة، يعرض `/status`
    `Runtime: OpenAI Codex`. تحتفظ الجلسات الموجودة بمعرّف الحزمة المسجّل لديها، لذا استخدم
    `/new` أو `/reset` بعد تغيير `agentRuntime` إذا أردت أن يعكس `/status`
    اختيار PI/Codex جديدًا.

    ### تحذير Doctor

    إذا كان Plugin `codex` المضمّن مفعّلًا بينما يكون مسار `openai-codex/*`
    محددًا، فسيحذّر `openclaw doctor` من أن النموذج ما زال يُحل عبر PI.
    أبقِ الإعدادات دون تغيير فقط عندما يكون مسار مصادقة الاشتراك عبر PI هذا
    مقصودًا. انتقل إلى `openai/<model>` مع `agentRuntime.id: "codex"` عندما
    تريد تنفيذ خادم تطبيق Codex الأصلي.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات تعريف النموذج وحد سياق وقت التشغيل كقيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.5` عبر Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - حد `contextTokens` الافتراضي لوقت التشغيل: `272000`

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
    استخدم `contextWindow` للإعلان عن بيانات تعريف النموذج الأصلية. استخدم `contextTokens` لتقييد ميزانية سياق وقت التشغيل.
    </Note>

    ### استرداد الكتالوج

    يستخدم OpenClaw بيانات تعريف كتالوج Codex من المصدر الأعلى لـ `gpt-5.5` عندما تكون
    موجودة. إذا أغفل اكتشاف Codex المباشر صف `openai-codex/gpt-5.5` بينما
    يكون الحساب مصادقًا، ينشئ OpenClaw صف نموذج OAuth هذا حتى لا تفشل
    عمليات cron والوكيل الفرعي والنموذج الافتراضي المكوّن مع
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة خادم تطبيق Codex الأصلي

تستخدم حزمة خادم تطبيق Codex الأصلية مراجع نماذج `openai/*` مع
`agentRuntime.id: "codex"`، لكن مصادقتها ما زالت قائمة على الحساب. يختار OpenClaw
المصادقة بهذا الترتيب:

1. ملف مصادقة OpenClaw `openai-codex` صريح مرتبط بالوكيل.
2. حساب خادم التطبيق الموجود، مثل تسجيل دخول ChatGPT محلي عبر Codex CLI.
3. لعمليات تشغيل خادم التطبيق المحلي عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما يبلّغ خادم التطبيق عن عدم وجود حساب وما زال يتطلب
   مصادقة OpenAI.

يعني ذلك أن تسجيل دخول اشتراك ChatGPT/Codex المحلي لا يُستبدل لمجرد أن
عملية Gateway لديها أيضًا `OPENAI_API_KEY` لنماذج OpenAI المباشرة
أو التضمينات. الرجوع الاحتياطي إلى مفتاح API من البيئة هو فقط لمسار stdio المحلي بلا حساب؛ ولا
يُرسل إلى اتصالات خادم التطبيق عبر WebSocket. عند اختيار ملف Codex
بنمط الاشتراك، يُبقي OpenClaw أيضًا `CODEX_API_KEY` و`OPENAI_API_KEY`
خارج العملية الفرعية لخادم تطبيق stdio المُنشأة، ويرسل بيانات الاعتماد المحددة
عبر RPC تسجيل دخول خادم التطبيق.

## توليد الصور

يسجّل Plugin `openai` المضمّن توليد الصور عبر أداة `image_generate`.
وهو يدعم توليد الصور بمفتاح OpenAI API وتوليد الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| الإمكانية                | مفتاح OpenAI API                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع النموذج              | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| المصادقة                  | `OPENAI_API_KEY`                   | تسجيل دخول OpenAI Codex OAuth        |
| النقل                     | OpenAI Images API                  | خلفية Codex Responses                |
| الحد الأقصى للصور في الطلب | 4                                  | 4                                    |
| وضع التحرير               | مفعّل (حتى 5 صور مرجعية)           | مفعّل (حتى 5 صور مرجعية)             |
| تجاوزات الحجم             | مدعومة، بما في ذلك أحجام 2K/4K      | مدعومة، بما في ذلك أحجام 2K/4K        |
| نسبة العرض إلى الارتفاع / الدقة | لا تُمرّر إلى OpenAI Images API | تُطابق مع حجم مدعوم عندما يكون ذلك آمنًا |

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

`gpt-image-2` هو الافتراضي لكل من توليد الصور من النص في OpenAI وتحرير الصور.
تبقى `gpt-image-1.5` و`gpt-image-1` و`gpt-image-1-mini` قابلة للاستخدام
كتجاوزات نموذج صريحة. استخدم `openai/gpt-image-1.5` لمخرجات
PNG/WebP بخلفية شفافة؛ ترفض API الحالية لـ `gpt-image-2`
`background: "transparent"`.

لطلب بخلفية شفافة، يجب أن يستدعي الوكلاء `image_generate` مع
`model: "openai/gpt-image-1.5"` و`outputFormat: "png"` أو `"webp"` و
`background: "transparent"`؛ وما زال خيار المزوّد الأقدم `openai.background`
مقبولًا. يحمي OpenClaw أيضًا مسارات OpenAI العامة و
OpenAI Codex OAuth بإعادة كتابة طلبات الشفافية الافتراضية `openai/gpt-image-2`
إلى `gpt-image-1.5`؛ بينما تحتفظ نقاط نهاية Azure ونقاط النهاية المخصصة المتوافقة مع OpenAI
بأسماء النشر/النموذج المكوّنة لديها.

يتوفر الإعداد نفسه لعمليات CLI بلا واجهة:

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
تبقى `--openai-background` متاحة كاسم مستعار خاص بـ OpenAI.

بالنسبة إلى تثبيتات Codex OAuth، أبقِ مرجع `openai/gpt-image-2` نفسه. عند
تكوين ملف OAuth `openai-codex`، يحل OpenClaw رمز وصول OAuth المخزّن
ويرسل طلبات الصور عبر خلفية Codex Responses. ولا يحاول أولًا استخدام
`OPENAI_API_KEY` أو الرجوع بصمت إلى مفتاح API لذلك
الطلب. كوّن `models.providers.openai` صراحةً بمفتاح API،
أو عنوان URL أساسي مخصص، أو نقطة نهاية Azure عندما تريد مسار OpenAI Images API
المباشر بدلًا من ذلك.
إذا كانت نقطة نهاية الصور المخصصة هذه على LAN/عنوان خاص موثوق، فعيّن أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ يبقي OpenClaw
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

| الإمكانية       | القيمة                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2`                                                                   |
| الأوضاع          | من نص إلى فيديو، من صورة إلى فيديو، تحرير فيديو واحد                              |
| مدخلات مرجعية    | صورة واحدة أو فيديو واحد                                                          |
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

## مساهمة موجه GPT-5

يضيف OpenClaw مساهمة موجه GPT-5 مشتركة لعمليات عائلة GPT-5 عبر المزوّدين. تنطبق حسب معرّف النموذج، لذا تتلقى `openai-codex/gpt-5.5` و`openai/gpt-5.5` و`openrouter/openai/gpt-5.5` و`opencode/gpt-5.5` ومراجع GPT-5 المتوافقة الأخرى الطبقة نفسها. لا تنطبق على نماذج GPT-4.x الأقدم.

تستخدم حزمة Codex الأصلية المضمّنة سلوك GPT-5 نفسه وطبقة Heartbeat عبر تعليمات مطوّر خادم تطبيق Codex، لذا تحتفظ جلسات `openai/gpt-5.x` المفروضة عبر `agentRuntime.id: "codex"` بالإرشادات نفسها الخاصة بالمتابعة وHeartbeat الاستباقي، رغم أن Codex يملك بقية موجه الحزمة.

تضيف مساهمة GPT-5 عقد سلوك موسومًا لثبات الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوصات الإكمال، والتحقق. يبقى سلوك الرد حسب القناة والرسائل الصامتة في موجه نظام OpenClaw المشترك وسياسة التسليم الصادر. تكون إرشادات GPT-5 مفعّلة دائمًا للنماذج المطابقة. طبقة أسلوب التفاعل الودية منفصلة وقابلة للتكوين.

| القيمة                 | التأثير                                  |
| ---------------------- | ---------------------------------------- |
| `"friendly"` (افتراضي) | تفعيل طبقة أسلوب التفاعل الودية          |
| `"on"`                 | اسم مستعار لـ `"friendly"`               |
| `"off"`                | تعطيل طبقة الأسلوب الودية فقط            |

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
القيم غير حساسة لحالة الأحرف في وقت التشغيل، لذا يعطّل كل من `"Off"` و`"off"` طبقة الأسلوب الودية.
</Tip>

<Note>
ما زال `plugins.entries.openai.config.personality` القديم يُقرأ كرجوع احتياطي للتوافق عندما لا يكون إعداد `agents.defaults.promptOverlays.gpt5.personality` المشترك معيّنًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="توليف الكلام (TTS)">
    يسجّل Plugin `openai` المضمّن توليف الكلام لسطح `messages.tts`.

    | الإعداد | مسار التهيئة | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يعود إلى `OPENAI_API_KEY` |
    | عنوان URL الأساسي | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | النص الإضافي للطلب | `messages.tts.providers.openai.extraBody` / `extra_body` | (غير مضبوط) |

    النماذج المتاحة: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. الأصوات المتاحة: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    يتم دمج `extraBody` في JSON طلب `/audio/speech` بعد الحقول التي أنشأها OpenClaw، لذا استخدمه لنقاط النهاية المتوافقة مع OpenAI التي تتطلب مفاتيح إضافية مثل `lang`. يتم تجاهل مفاتيح النماذج الأولية.

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

  <Accordion title="تحويل الكلام إلى نص">
    يسجل Plugin `openai` المضمن تحويل الكلام إلى نص على دفعات من خلال
    سطح نسخ فهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: تحميل ملف صوتي متعدد الأجزاء
    - مدعوم بواسطة OpenClaw في كل موضع يستخدم فيه نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قناة الصوت في Discord ومرفقات الصوت
      في القنوات

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

    تتم إعادة توجيه تلميحات اللغة والمطالبة إلى OpenAI عند توفيرها من خلال
    تهيئة وسائط الصوت المشتركة أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ في الوقت الفعلي">
    يسجل Plugin `openai` المضمن النسخ في الوقت الفعلي لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار التهيئة | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير مضبوط) |
    | المطالبة | `...openai.prompt` | (غير مضبوط) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket مع `wss://api.openai.com/v1/realtime` بصوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). موفر البث هذا مخصص لمسار النسخ في الوقت الفعلي لـ Voice Call؛ يسجل صوت Discord حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار النسخ الدفعي `tools.media.audio`.
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
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفتاحي التهيئة `azureEndpoint` و`azureDeployment` لجسور الخلفية في الوقت الفعلي. يدعم استدعاء الأدوات ثنائي الاتجاه. يستخدم تنسيق صوت G.711 u-law.
    </Note>

    <Note>
    يستخدم حديث واجهة التحكم جلسات OpenAI في الوقت الفعلي داخل المتصفح مع سر عميل مؤقت
    صادر عن Gateway وتبادل WebRTC SDP مباشر من المتصفح مع
    OpenAI Realtime API. يتوفر التحقق الحي للمشرفين باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ينشئ طرف OpenAI سر عميل في Node، وينشئ عرض SDP في المتصفح
    باستخدام وسائط ميكروفون وهمية، وينشره إلى OpenAI، ويطبق إجابة SDP
    دون تسجيل الأسرار.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لموفر `openai` المضمن استهداف مورد Azure OpenAI لتوليد الصور
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

- لديك بالفعل اشتراك Azure OpenAI أو حصة أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال توفرها Azure
- تريد إبقاء حركة البيانات داخل مستأجر Azure موجود

### التهيئة

لتوليد الصور عبر Azure من خلال موفر `openai` المضمن، وجّه
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

يتعرف OpenClaw على لواحق مضيف Azure التالية لمسار توليد الصور في Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

بالنسبة لطلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات محددة بنطاق النشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب
- يستخدم مهلة طلب افتراضية قدرها 600 ثانية لاستدعاءات توليد الصور في Azure.
  لا تزال قيم `timeoutMs` لكل استدعاء تتجاوز هذا الافتراضي.

تحافظ عناوين URL الأساسية الأخرى (OpenAI العام، والوكلاء المتوافقون مع OpenAI) على
شكل طلب الصور القياسي في OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور في موفر `openai`
OpenClaw 2026.4.22 أو أحدث. تتعامل الإصدارات السابقة مع أي
`openai.baseUrl` مخصص مثل نقطة نهاية OpenAI العامة وستفشل مع عمليات نشر الصور
في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار Azure معاينة أو GA محدد
لمسار توليد الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

القيمة الافتراضية هي `2024-12-01-preview` عندما لا يكون المتغير مضبوطًا.

### أسماء النماذج هي أسماء النشر

يربط Azure OpenAI النماذج بعمليات النشر. بالنسبة لطلبات توليد الصور في Azure
الموجهة عبر موفر `openai` المضمن، يجب أن يكون حقل `model` في OpenClaw
هو **اسم نشر Azure** الذي هيأته في بوابة Azure، وليس معرف نموذج OpenAI العام.

إذا أنشأت نشرًا باسم `gpt-image-2-prod` يخدم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجهة عبر
موفر `openai` المضمن.

### التوفر الإقليمي

يتوفر توليد الصور في Azure حاليًا في مجموعة فرعية فقط من المناطق
(على سبيل المثال `eastus2`، و`swedencentral`، و`polandcentral`، و`westus3`،
و`uaenorth`). تحقق من قائمة المناطق الحالية لدى Microsoft قبل إنشاء
نشر، وتأكد من أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا يقبل Azure OpenAI وOpenAI العام دائمًا معلمات الصور نفسها.
قد يرفض Azure خيارات يسمح بها OpenAI العام (على سبيل المثال بعض قيم
`background` على `gpt-image-2`) أو يتيحها فقط في إصدارات نماذج محددة.
تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من OpenClaw.
إذا فشل طلب Azure بخطأ تحقق، فتحقق من مجموعة المعلمات التي يدعمها
النشر وإصدار API المحددان لديك في بوابة Azure.

<Note>
يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق ولكنه لا يتلقى
ترويسات النسبة المخفية الخاصة بـ OpenClaw — راجع أكورديون **المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI**
ضمن [التهيئة المتقدمة](#advanced-configuration).

بالنسبة لحركة المحادثة أو Responses على Azure (بخلاف توليد الصور)، استخدم
تدفق الإعداد أو تهيئة موفر Azure مخصصة — لا يكفي `openai.baseUrl` وحده
لالتقاط شكل API/المصادقة في Azure. يوجد موفر منفصل
`azure-openai-responses/*`؛ راجع أكورديون Compaction من جانب الخادم أدناه.
</Note>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw نهج WebSocket أولًا مع رجوع احتياطي إلى SSE (`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع إلى SSE
    - بعد الفشل، يوسم WebSocket بأنه متدهور لمدة تقارب 60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات مستقرة لهوية الجلسة والدوران لعمليات إعادة المحاولة وإعادة الاتصال
    - يطبع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

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

    وثائق OpenAI ذات الصلة:
    - [Realtime API مع WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [استجابات Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="إحماء WebSocket">
    يفعّل OpenClaw إحماء WebSocket افتراضيًا لـ `openai/*` و`openai-codex/*` لتقليل زمن استجابة الدوران الأول.

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
    يعرض OpenClaw مفتاح تبديل مشترك للوضع السريع لـ `openai/*` و`openai-codex/*`:

    - **المحادثة/واجهة المستخدم:** `/fast status|on|off`
    - **التهيئة:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التفعيل، يربط OpenClaw الوضع السريع بمعالجة الأولوية في OpenAI (`service_tier = "priority"`). يتم الحفاظ على قيم `service_tier` الموجودة، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

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
    تتغلب تجاوزات الجلسة على التهيئة. يؤدي مسح تجاوز الجلسة في واجهة جلسات المستخدم إلى إعادة الجلسة إلى الافتراضي المهيأ.
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
    لا يُمرَّر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجّهت أيًّا من المزوّدين عبر وسيط، يترك OpenClaw قيمة `service_tier` كما هي.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جانب الخادم (Responses API)">
    لنماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل غلاف تدفق Pi-harness الخاص بـ Plugin OpenAI ميزة Compaction من جانب الخادم تلقائيًا:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - قيمة `compact_threshold` الافتراضية: 70% من `contextWindow` (أو `80000` عند عدم توفرها)

    ينطبق هذا على مسار Pi harness المضمّن وعلى خطافات مزوّد OpenAI المستخدمة بواسطة عمليات التشغيل المضمنة. يدير مسار Codex app-server harness الأصلي سياقه الخاص عبر Codex ويتم تكوينه بشكل منفصل باستخدام `agents.defaults.agentRuntime.id`.

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
      <Tab title="حد مخصص">
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

  <Accordion title="وضع GPT الصارم الوكيل">
    لعمليات تشغيل عائلة GPT-5 على `openai/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

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
    - لم يعد يتعامل مع دورة تقتصر على الخطة فقط كتقدم ناجح عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدورة بتوجيه للتصرف الآن
    - يفعّل `update_plan` تلقائيًا للأعمال الكبيرة
    - يعرض حالة حظر صريحة إذا استمر النموذج في التخطيط دون تنفيذ

    <Note>
    يقتصر النطاق على عمليات تشغيل عائلة GPT-5 الخاصة بـ OpenAI وCodex فقط. يحتفظ المزوّدون الآخرون وعائلات النماذج الأقدم بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI المباشرة وCodex وAzure OpenAI بشكل مختلف عن وسطاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - يحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI `none`
    - يحذف الاستدلال المعطّل للنماذج أو الوسطاء الذين يرفضون `reasoning.effort: "none"`
    - يضبط مخططات الأدوات افتراضيًا على الوضع الصارم
    - يرفق ترويسات إسناد مخفية على المضيفين الأصليين المتحقق منهم فقط
    - يحتفظ بتشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier`، `store`، توافق الاستدلال، تلميحات ذاكرة التخزين المؤقت للموجه)

    **مسارات الوسيط/المتوافقة:**
    - تستخدم سلوك توافق أكثر مرونة
    - تزيل `store` الخاصة بـ Completions من حمولات `openai-completions` غير الأصلية
    - تقبل تمرير JSON المتقدم `params.extra_body`/`params.extraBody` لوسطاء Completions المتوافقين مع OpenAI
    - تقبل `params.chat_template_kwargs` لوسطاء Completions المتوافقين مع OpenAI مثل vLLM
    - لا تفرض مخططات الأدوات الصارمة أو الترويسات الأصلية فقط

    يستخدم Azure OpenAI نقلًا أصليًا وسلوك توافق، لكنه لا يتلقى ترويسات الإسناد المخفية.

  </Accordion>
</AccordionGroup>

## ذات صلة

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
