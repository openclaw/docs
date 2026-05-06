---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلاً من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T19:35:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fda2acdb0e249f0481ab1aa20bb5ff317709bc9536f60c45be9e2d63c44702e
    source_path: providers/openai.md
    workflow: 16
---

توفر OpenAI واجهات API للمطورين لنماذج GPT، كما يتوفر Codex أيضًا كوكيل برمجة ضمن خطة ChatGPT من خلال عملاء Codex لدى OpenAI. يُبقي OpenClaw هذه الأسطح منفصلة حتى يظل الإعداد قابلاً للتوقع.

يدعم OpenClaw ثلاثة مسارات من عائلة OpenAI. يجب على معظم مشتركي ChatGPT/Codex الذين يريدون سلوك Codex استخدام بيئة تشغيل خادم تطبيق Codex الأصلية. تحدد بادئة النموذج اسم المزوّد/النموذج؛ بينما يحدد إعداد بيئة تشغيل منفصل الجهة التي تنفذ حلقة الوكيل المضمّنة:

- **مفتاح API** - وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (نماذج `openai/*`)
- **اشتراك Codex مع بيئة تشغيل Codex أصلية** - تسجيل دخول ChatGPT/Codex بالإضافة إلى تنفيذ خادم تطبيق Codex (نماذج `openai/*` بالإضافة إلى `agents.defaults.agentRuntime.id: "codex"`)
- **اشتراك Codex عبر PI** - تسجيل دخول ChatGPT/Codex مع مشغّل OpenClaw PI العادي (نماذج `openai-codex/*`)

تدعم OpenAI صراحةً استخدام OAuth الخاص بالاشتراك في الأدوات الخارجية وتدفقات العمل مثل OpenClaw.

المزوّد والنموذج وبيئة التشغيل والقناة طبقات منفصلة. إذا بدأت هذه التسميات تختلط معًا، فاقرأ [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes) قبل تغيير الإعداد.

## اختيار سريع

| الهدف                                                 | استخدم                                              | ملاحظات                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| اشتراك ChatGPT/Codex مع بيئة تشغيل Codex الأصلية | `openai/gpt-5.5` بالإضافة إلى `agentRuntime.id: "codex"` | إعداد Codex الموصى به لمعظم المستخدمين. سجّل الدخول بمصادقة `openai-codex`. |
| فوترة مباشرة بمفتاح API                               | `openai/gpt-5.5`                                 | عيّن `OPENAI_API_KEY` أو شغّل تهيئة مفتاح API لـ OpenAI.                    |
| مصادقة اشتراك ChatGPT/Codex عبر PI           | `openai-codex/gpt-5.5`                           | استخدمه فقط عندما تريد عمدًا مشغّل PI العادي.                |
| إنشاء الصور أو تحريرها                          | `openai/gpt-image-2`                             | يعمل إما مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.                 |
| صور بخلفية شفافة                        | `openai/gpt-image-1.5`                           | استخدم `outputFormat=png` أو `webp` و`openai.background=transparent`.     |

## خريطة التسمية

الأسماء متشابهة لكنها غير قابلة للتبديل:

| الاسم الذي تراه                       | الطبقة             | المعنى                                                                                           |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | بادئة المزوّد   | مسار API مباشر إلى OpenAI Platform.                                                                 |
| `openai-codex`                     | بادئة المزوّد   | مسار OpenAI Codex OAuth/الاشتراك عبر مشغّل OpenClaw PI العادي.                      |
| Plugin `codex`                     | Plugin            | Plugin مضمّن في OpenClaw يوفر بيئة تشغيل خادم تطبيق Codex الأصلية وعناصر تحكم محادثة `/codex`. |
| `agentRuntime.id: codex`           | بيئة تشغيل الوكيل     | يفرض حاوية خادم تطبيق Codex الأصلية للمنعطفات المضمّنة.                                     |
| `/codex ...`                       | مجموعة أوامر المحادثة  | يربط/يتحكم في سلاسل خادم تطبيق Codex من محادثة.                                        |
| `runtime: "acp", agentId: "codex"` | مسار جلسة ACP | مسار احتياطي صريح يشغّل Codex عبر ACP/acpx.                                          |

يعني هذا أن الإعداد يمكن أن يحتوي عمدًا على كلٍّ من `openai-codex/*` وPlugin `codex`. يكون ذلك صالحًا عندما تريد Codex OAuth عبر PI وتريد أيضًا توفر عناصر تحكم محادثة `/codex` الأصلية. يحذر `openclaw doctor` من ذلك المزيج حتى تتمكن من تأكيد أنه مقصود؛ ولا يعيد كتابته.

<Note>
يتوفر GPT-5.5 عبر الوصول المباشر بمفتاح API إلى OpenAI Platform وعبر مسارات الاشتراك/OAuth. لاشتراك ChatGPT/Codex بالإضافة إلى تنفيذ Codex الأصلي، استخدم `openai/gpt-5.5` مع `agentRuntime.id: "codex"`. استخدم `openai-codex/gpt-5.5` فقط لـ Codex OAuth عبر PI، أو `openai/gpt-5.5` دون تجاوز بيئة تشغيل Codex لحركة مرور `OPENAI_API_KEY` المباشرة.
</Note>

<Note>
تمكين Plugin الخاصة بـ OpenAI، أو اختيار نموذج `openai-codex/*`، لا يمكّن Plugin خادم تطبيق Codex المضمّنة. يمكّن OpenClaw ذلك Plugin فقط عندما تختار صراحةً حاوية Codex الأصلية باستخدام `agentRuntime.id: "codex"` أو تستخدم مرجع نموذج `codex/*` قديمًا.
إذا كانت Plugin `codex` المضمّنة ممكّنة لكن `openai-codex/*` لا يزال يُحل عبر PI، يحذر `openclaw doctor` ويترك المسار دون تغيير.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI         | سطح OpenClaw                                           | الحالة                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| المحادثة / الاستجابات          | مزوّد نموذج `openai/<model>`                            | نعم                                                    |
| نماذج اشتراك Codex | `openai-codex/<model>` مع `openai-codex` OAuth           | نعم                                                    |
| حاوية خادم تطبيق Codex  | `openai/<model>` مع `agentRuntime.id: codex`             | نعم                                                    |
| البحث على الويب من جهة الخادم    | أداة OpenAI Responses الأصلية                               | نعم، عندما يكون البحث على الويب ممكّنًا ولا يكون أي مزوّد مثبتًا |
| الصور                    | `image_generate`                                           | نعم                                                    |
| الفيديوهات                    | `video_generate`                                           | نعم                                                    |
| تحويل النص إلى كلام            | `messages.tts.provider: "openai"` / `tts`                  | نعم                                                    |
| تحويل الكلام إلى نص بالدفعات      | `tools.media.audio` / فهم الوسائط                  | نعم                                                    |
| تحويل الكلام إلى نص بالبث  | Voice Call `streaming.provider: "openai"`                  | نعم                                                    |
| الصوت الفوري            | Voice Call `realtime.provider: "openai"` / Control UI Talk | نعم                                                    |
| التضمينات                | مزوّد تضمين الذاكرة                                  | نعم                                                    |

## تضمينات الذاكرة

يمكن لـ OpenClaw استخدام OpenAI، أو نقطة نهاية تضمين متوافقة مع OpenAI، لفهرسة `memory_search` وتضمينات الاستعلامات:

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

لنقاط النهاية المتوافقة مع OpenAI التي تتطلب تسميات تضمين غير متماثلة، عيّن `queryInputType` و`documentInputType` ضمن `memorySearch`. يمرر OpenClaw هذين الحقلين كحقول طلب `input_type` خاصة بالمزوّد: تستخدم تضمينات الاستعلام `queryInputType`؛ وتستخدم مقاطع الذاكرة المفهرسة والفهرسة بالدفعات `documentInputType`. راجع [مرجع إعداد الذاكرة](/ar/reference/memory-config#provider-specific-config) للاطلاع على المثال الكامل.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل التهيئة">
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

    | مرجع النموذج              | إعداد بيئة التشغيل             | المسار                       | المصادقة             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | محذوف / `agentRuntime.id: "pi"`    | API مباشر إلى OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | محذوف / `agentRuntime.id: "pi"`    | API مباشر إلى OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | حاوية خادم تطبيق Codex    | خادم تطبيق Codex |

    <Note>
    `openai/*` هو مسار مفتاح API المباشر لـ OpenAI ما لم تفرض صراحةً حاوية خادم تطبيق Codex. استخدم `openai-codex/*` لـ Codex OAuth عبر مشغّل PI الافتراضي، أو استخدم `openai/gpt-5.5` مع `agentRuntime.id: "codex"` لتنفيذ خادم تطبيق Codex الأصلي.
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
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex الخاص بك مع تنفيذ خادم تطبيق Codex الأصلي بدلًا من مفتاح API منفصل. تتطلب سحابة Codex تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرةً:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        للإعدادات عديمة الواجهة أو المعادية لردود الاتصال، أضف `--device-code` لتسجيل الدخول بتدفق رمز جهاز ChatGPT بدلًا من رد اتصال متصفح localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="استخدم بيئة تشغيل Codex الأصلية">
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
        في المحادثة للتحقق من بيئة تشغيل خادم التطبيق الأصلية.
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | إعداد بيئة التشغيل | المسار | المصادقة |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | حاوية خادم تطبيق Codex الأصلية | تسجيل دخول Codex أو ملف تعريف `openai-codex` المحدد |
    | `openai-codex/gpt-5.5` | محذوف / `runtime: "pi"` | ChatGPT/Codex OAuth عبر PI | تسجيل دخول Codex |
    | `openai-codex/gpt-5.4-mini` | محذوف / `runtime: "pi"` | ChatGPT/Codex OAuth عبر PI | تسجيل دخول Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | يظل PI ما لم يطالب Plugin صراحةً بـ `openai-codex` | تسجيل دخول Codex |

    <Warning>
    لا تضبط مراجع نماذج `openai-codex/gpt-5.1*` أو `openai-codex/gpt-5.2*` أو
    `openai-codex/gpt-5.3*` الأقدم. ترفض حسابات ChatGPT/Codex OAuth الآن
    تلك النماذج. استخدم `openai-codex/gpt-5.5` لمسار PI OAuth، أو
    `openai/gpt-5.5` مع `agentRuntime.id: "codex"` لتنفيذ بيئة تشغيل Codex الأصلية.
    </Warning>

    <Note>
    استمر في استخدام معرّف المزوّد `openai-codex` لأوامر المصادقة/الملف الشخصي. بادئة
    النموذج `openai-codex/*` هي أيضًا مسار PI الصريح لـ Codex OAuth.
    إنها لا تختار أو تفعّل تلقائيًا حزمة تسخير خادم التطبيق المضمّنة في Codex. بالنسبة إلى
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
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    لإبقاء Codex OAuth على مشغّل PI العادي بدلًا من ذلك، استخدم
    `openai-codex/gpt-5.5` واحذف تجاوز وقت تشغيل Codex.

    <Note>
    لم يعد الإعداد الأولي يستورد مواد OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكلاء الخاص به.
    </Note>

    ### التحقق من توجيه Codex OAuth واستعادته

    استخدم هذه الأوامر لمعرفة النموذج ووقت التشغيل ومسار المصادقة التي يستخدمها
    الوكيل الافتراضي لديك:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    لوكيل محدد، أضف `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    إذا غيّر تشغيل `doctor --fix` في 2026.5.5 إعداد اشتراك GPT-5.5 من
    `openai-codex/gpt-5.5` إلى `openai/gpt-5.5`، فأعد الوكيل الافتراضي
    إلى مسار Codex OAuth عبر PI:

    ```bash
    openclaw models set openai-codex/gpt-5.5
    openclaw config validate
    ```

    إذا لم يُظهر `models auth list --provider openai-codex` أي ملف شخصي قابل للاستخدام، فسجّل
    الدخول مجددًا:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    يعني `openai-codex/*` استخدام ChatGPT/Codex OAuth عبر PI. ويعني `openai/*` مع
    `agentRuntime.id: "codex"` تنفيذ خادم تطبيق Codex الأصلي.

    ### مؤشر الحالة

    يعرض Chat `/status` وقت تشغيل النموذج النشط للجلسة الحالية.
    يظهر تسخير PI الافتراضي على أنه `Runtime: OpenClaw Pi Default`. عند اختيار
    تسخير خادم تطبيق Codex المضمّن، يعرض `/status`
    `Runtime: OpenAI Codex`. تحتفظ الجلسات الحالية بمعرّف التسخير المسجّل لديها، لذلك استخدم
    `/new` أو `/reset` بعد تغيير `agentRuntime` إذا أردت أن يعكس `/status`
    اختيار PI/Codex جديدًا.

    ### تحذير Doctor

    إذا كان Plugin المضمّن `codex` مفعّلًا بينما يكون مسار `openai-codex/*`
    محددًا، فسيحذّر `openclaw doctor` من أن النموذج لا يزال يُحل عبر PI.
    أبقِ الإعدادات دون تغيير فقط عندما يكون مسار مصادقة الاشتراك عبر PI
    مقصودًا. انتقل إلى `openai/<model>` مع `agentRuntime.id: "codex"` عندما
    تريد تنفيذ خادم تطبيق Codex الأصلي.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات تعريف النموذج وحد سياق وقت التشغيل كقيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.5` عبر Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - حد `contextTokens` الافتراضي لوقت التشغيل: `272000`

    يوفر الحد الافتراضي الأصغر خصائص أفضل لزمن الاستجابة والجودة عمليًا. تجاوزه باستخدام `contextTokens`:

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
    استخدم `contextWindow` للتصريح ببيانات تعريف النموذج الأصلية. واستخدم `contextTokens` لتقييد ميزانية سياق وقت التشغيل.
    </Note>

    ### استرداد الكتالوج

    يستخدم OpenClaw بيانات تعريف كتالوج Codex الصاعدة لـ `gpt-5.5` عندما تكون
    موجودة. إذا أغفل اكتشاف Codex المباشر صف `openai-codex/gpt-5.5` بينما
    يكون الحساب مصادقًا، ينشئ OpenClaw صف نموذج OAuth هذا حتى لا تفشل عمليات
    cron والوكيل الفرعي والنموذج الافتراضي المضبوط برسالة
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة خادم تطبيق Codex الأصلي

يستخدم تسخير خادم تطبيق Codex الأصلي مراجع نماذج `openai/*` مع
`agentRuntime.id: "codex"`، لكن مصادقته لا تزال مستندة إلى الحساب. يختار OpenClaw
المصادقة بهذا الترتيب:

1. ملف مصادقة OpenClaw `openai-codex` صريح مربوط بالوكيل.
2. الحساب الحالي لخادم التطبيق، مثل تسجيل دخول ChatGPT محلي عبر Codex CLI.
3. بالنسبة إلى عمليات تشغيل خادم التطبيق المحلي عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما يبلّغ خادم التطبيق بعدم وجود حساب ولا يزال يتطلب
   مصادقة OpenAI.

يعني ذلك أن تسجيل الدخول المحلي لاشتراك ChatGPT/Codex لا يُستبدل لمجرد
أن عملية Gateway تحتوي أيضًا على `OPENAI_API_KEY` لنماذج OpenAI المباشرة
أو embeddings. لا يُستخدم الرجوع الاحتياطي لمفتاح API عبر البيئة إلا في مسار stdio المحلي بلا حساب؛
ولا يُرسل إلى اتصالات خادم التطبيق عبر WebSocket. عند اختيار ملف Codex
بأسلوب الاشتراك، يبقي OpenClaw أيضًا `CODEX_API_KEY` و`OPENAI_API_KEY`
خارج عملية خادم التطبيق الفرعية المنشأة عبر stdio ويرسل بيانات الاعتماد المحددة
من خلال RPC تسجيل الدخول إلى خادم التطبيق.

## إنشاء الصور

يسجّل Plugin المضمّن `openai` إنشاء الصور من خلال الأداة `image_generate`.
وهو يدعم إنشاء الصور باستخدام مفتاح OpenAI API وإنشاء الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| القدرة | مفتاح OpenAI API | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع النموذج | `openai/gpt-image-2` | `openai/gpt-image-2` |
| المصادقة | `OPENAI_API_KEY` | تسجيل دخول OpenAI Codex OAuth |
| النقل | OpenAI Images API | خلفية Codex Responses |
| الحد الأقصى للصور لكل طلب | 4 | 4 |
| وضع التحرير | مفعّل (حتى 5 صور مرجعية) | مفعّل (حتى 5 صور مرجعية) |
| تجاوزات الحجم | مدعومة، بما في ذلك أحجام 2K/4K | مدعومة، بما في ذلك أحجام 2K/4K |
| نسبة العرض إلى الارتفاع / الدقة | لا تُمرّر إلى OpenAI Images API | تُعيّن إلى حجم مدعوم عندما يكون ذلك آمنًا |

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

`gpt-image-2` هو الخيار الافتراضي لكل من إنشاء النص إلى صورة في OpenAI وتحرير الصور.
تظل `gpt-image-1.5` و`gpt-image-1` و`gpt-image-1-mini` قابلة للاستخدام
كتجاوزات نموذج صريحة. استخدم `openai/gpt-image-1.5` لمخرجات PNG/WebP
بخلفية شفافة؛ إذ ترفض API الحالية لـ `gpt-image-2`
`background: "transparent"`.

بالنسبة إلى طلب بخلفية شفافة، ينبغي للوكلاء استدعاء `image_generate` مع
`model: "openai/gpt-image-1.5"` و`outputFormat: "png"` أو `"webp"` و
`background: "transparent"`؛ ولا يزال خيار المزوّد الأقدم `openai.background`
مقبولًا. يحمي OpenClaw أيضًا مسارات OpenAI العامة و
OpenAI Codex OAuth بإعادة كتابة طلبات الشفافية الافتراضية `openai/gpt-image-2`
إلى `gpt-image-1.5`؛ وتحتفظ Azure ونقاط النهاية المخصصة المتوافقة مع OpenAI
بأسماء النشر/النماذج المضبوطة لديها.

الإعداد نفسه متاح لتشغيلات CLI بلا واجهة:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

استخدم علامتَي `--output-format` و`--background` نفسيهما مع
`openclaw infer image edit` عند البدء من ملف إدخال.
تظل `--openai-background` متاحة كاسم مستعار خاص بـ OpenAI.

بالنسبة إلى تثبيتات Codex OAuth، أبقِ مرجع `openai/gpt-image-2` نفسه. عندما يكون
ملف OAuth `openai-codex` مضبوطًا، يحل OpenClaw رمز وصول OAuth المخزن
ويرسل طلبات الصور عبر خلفية Codex Responses. ولا يحاول أولًا استخدام
`OPENAI_API_KEY` أو الرجوع بصمت إلى مفتاح API لذلك
الطلب. اضبط `models.providers.openai` صراحةً باستخدام مفتاح API،
أو عنوان URL أساسي مخصص، أو نقطة نهاية Azure عندما تريد مسار OpenAI Images API
المباشر بدلًا من ذلك.
إذا كانت نقطة نهاية الصور المخصصة هذه على شبكة LAN/عنوان خاص موثوق، فاضبط أيضًا
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

يسجّل Plugin المضمّن `openai` إنشاء الفيديو من خلال الأداة `video_generate`.

| القدرة | القيمة |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2` |
| الأوضاع | النص إلى فيديو، الصورة إلى فيديو، تحرير فيديو واحد |
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

## مساهمة موجه GPT-5

يضيف OpenClaw مساهمة موجه GPT-5 مشتركة لتشغيلات عائلة GPT-5 عبر المزوّدين. تُطبّق حسب معرّف النموذج، لذلك تتلقى `openai-codex/gpt-5.5` و`openai/gpt-5.5` و`openrouter/openai/gpt-5.5` و`opencode/gpt-5.5` ومراجع GPT-5 المتوافقة الأخرى التراكب نفسه. أما نماذج GPT-4.x الأقدم فلا تتلقاه.

يستخدم تسخير Codex الأصلي المضمّن سلوك GPT-5 نفسه وتراكب Heartbeat من خلال تعليمات مطور خادم تطبيق Codex، لذلك تحتفظ جلسات `openai/gpt-5.x` المفروضة عبر `agentRuntime.id: "codex"` بالإرشادات نفسها الخاصة بالمتابعة وHeartbeat الاستباقي، رغم أن Codex يملك بقية موجه التسخير.

تضيف مساهمة GPT-5 عقد سلوك موسومًا لاستمرارية الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوصات الإكمال، والتحقق. يظل سلوك الرد الخاص بالقناة والرسائل الصامتة في موجه نظام OpenClaw المشترك وسياسة التسليم الصادر. تكون إرشادات GPT-5 مفعّلة دائمًا للنماذج المطابقة. طبقة أسلوب التفاعل الودّي منفصلة وقابلة للضبط.

| القيمة | التأثير |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (افتراضي) | تفعيل طبقة أسلوب التفاعل الودّي |
| `"on"` | اسم مستعار لـ `"friendly"` |
| `"off"` | تعطيل طبقة الأسلوب الودّي فقط |

<Tabs>
  <Tab title="الإعداد">
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
القيم غير حساسة لحالة الأحرف في وقت التشغيل، لذلك يعطّل كل من `"Off"` و`"off"` طبقة النمط الودود.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ كخيار توافق احتياطي عندما لا يكون إعداد `agents.defaults.promptOverlays.gpt5.personality` المشترك معيّنًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="توليف الكلام (TTS)">
    يسجّل Plugin `openai` المضمّن توليف الكلام لسطح `messages.tts`.

    | الإعداد | مسار الإعداد | القيمة الافتراضية |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير معيّن) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير معيّن، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يستخدم `OPENAI_API_KEY` كخيار احتياطي |
    | عنوان URL الأساسي | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | المتن الإضافي | `messages.tts.providers.openai.extraBody` / `extra_body` | (غير معيّن) |

    النماذج المتاحة: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. الأصوات المتاحة: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    يتم دمج `extraBody` في JSON طلب `/audio/speech` بعد الحقول التي يولّدها OpenClaw، لذلك استخدمه لنقاط النهاية المتوافقة مع OpenAI التي تتطلب مفاتيح إضافية مثل `lang`. يتم تجاهل مفاتيح النموذج الأولي.

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
    يسجّل Plugin `openai` المضمّن تحويل الكلام إلى نص دفعيًا عبر
    سطح النسخ الخاص بفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: تحميل ملف صوتي متعدد الأجزاء
    - مدعوم بواسطة OpenClaw في كل موضع يستخدم فيه نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قنوات الصوت في Discord ومرفقات
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

    يتم تمرير تلميحات اللغة والموجّه إلى OpenAI عند توفيرها من خلال
    إعداد وسائط الصوت المشترك أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ الفوري">
    يسجّل Plugin `openai` المضمّن النسخ الفوري لـ Plugin Voice Call.

    | الإعداد | مسار الإعداد | القيمة الافتراضية |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير معيّن) |
    | الموجّه | `...openai.prompt` | (غير معيّن) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يستخدم `OPENAI_API_KEY` كخيار احتياطي |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). موفّر البث هذا مخصص لمسار النسخ الفوري في Voice Call؛ يسجّل صوت Discord حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار النسخ الدفعي `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت الفوري">
    يسجّل Plugin `openai` المضمّن الصوت الفوري لـ Plugin Voice Call.

    | الإعداد | مسار الإعداد | القيمة الافتراضية |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يستخدم `OPENAI_API_KEY` كخيار احتياطي |

    <Note>
    يدعم Azure OpenAI عبر مفاتيح الإعداد `azureEndpoint` و`azureDeployment` لجسور الوقت الفعلي الخلفية. يدعم استدعاء الأدوات ثنائي الاتجاه. يستخدم تنسيق صوت G.711 u-law.
    </Note>

    <Note>
    تستخدم ميزة Talk في واجهة التحكم جلسات OpenAI الفورية في المتصفح مع سر عميل
    مؤقت صادر من Gateway وتبادل WebRTC SDP مباشر من المتصفح مع
    OpenAI Realtime API. يتوفر التحقق المباشر للمشرف باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`؛
    ينشئ جزء OpenAI سر عميل في Node، وينشئ عرض SDP في المتصفح
    باستخدام وسائط ميكروفون وهمية، ويرسله إلى OpenAI، ويطبّق إجابة SDP
    دون تسجيل الأسرار.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لموفّر `openai` المضمّن استهداف مورد Azure OpenAI لتوليد الصور
عن طريق تجاوز عنوان URL الأساسي. في مسار توليد الصور، يكتشف OpenClaw
أسماء مضيفي Azure في `models.providers.openai.baseUrl` ويتحوّل تلقائيًا إلى
صيغة طلب Azure.

<Note>
يستخدم الصوت الفوري مسار إعداد منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع قسم **الصوت الفوري**
القابل للطي ضمن [الصوت والكلام](#voice-and-speech) لإعدادات Azure الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- تكون لديك بالفعل اشتراك Azure OpenAI أو حصة أو اتفاقية مؤسسة
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال توفرها Azure
- تريد إبقاء حركة المرور داخل مستأجر Azure قائم

### الإعداد

لتوليد الصور عبر Azure من خلال موفّر `openai` المضمّن، وجّه
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

يتعرّف OpenClaw على لاحقات مضيف Azure هذه لمسار توليد الصور في Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

بالنسبة إلى طلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات محددة النطاق بالنشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب
- يستخدم مهلة طلب افتراضية قدرها 600 ثانية لاستدعاءات توليد الصور في Azure.
  لا تزال قيم `timeoutMs` لكل استدعاء تتجاوز هذه القيمة الافتراضية.

تحافظ عناوين URL الأساسية الأخرى (OpenAI العام، والوكلاء المتوافقون مع OpenAI) على
صيغة طلب الصور القياسية في OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور الخاص بموفّر `openai`
OpenClaw 2026.4.22 أو أحدث. تتعامل الإصدارات الأقدم مع أي
`openai.baseUrl` مخصص مثل نقطة نهاية OpenAI العامة وستفشل مع عمليات نشر الصور
في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار معاينة أو إصدار GA محدد من Azure
لمسار توليد الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

القيمة الافتراضية هي `2024-12-01-preview` عندما يكون المتغير غير معيّن.

### أسماء النماذج هي أسماء النشر

يربط Azure OpenAI النماذج بعمليات النشر. بالنسبة إلى طلبات توليد الصور في Azure
الموجّهة عبر موفّر `openai` المضمّن، يجب أن يكون حقل `model` في OpenClaw
هو **اسم نشر Azure** الذي أعددته في بوابة Azure، وليس
معرّف نموذج OpenAI العام.

إذا أنشأت نشرًا باسم `gpt-image-2-prod` يقدّم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجّهة عبر
موفّر `openai` المضمّن.

### الإتاحة الإقليمية

تتوفر ميزة توليد الصور في Azure حاليًا في مجموعة فرعية من المناطق فقط
(على سبيل المثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`،
`uaenorth`). تحقق من قائمة المناطق الحالية لدى Microsoft قبل إنشاء
نشر، وتأكد من أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا يقبل Azure OpenAI وOpenAI العام دائمًا معلمات الصور نفسها.
قد ترفض Azure خيارات يسمح بها OpenAI العام (على سبيل المثال بعض
قيم `background` على `gpt-image-2`) أو تتيحها فقط على إصدارات نماذج محددة.
تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من
OpenClaw. إذا فشل طلب Azure بسبب خطأ تحقق، فتحقق من
مجموعة المعلمات التي يدعمها النشر المحدد وإصدار API في
بوابة Azure.

<Note>
يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق لكنه لا يتلقى
ترويسات النسبة المخفية في OpenClaw — راجع قسم **المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI**
القابل للطي ضمن [الإعداد المتقدم](#advanced-configuration).

بالنسبة إلى حركة الدردشة أو Responses على Azure (خارج توليد الصور)، استخدم
تدفق الإعداد الأولي أو إعداد موفّر Azure مخصصًا — لا يلتقط `openai.baseUrl` وحده
صيغة API/المصادقة في Azure. يوجد موفّر منفصل
`azure-openai-responses/*`؛ راجع
القسم القابل للطي الخاص بـ Compaction من جهة الخادم أدناه.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw أسلوب WebSocket أولًا مع رجوع احتياطي إلى SSE (`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع احتياطيًا إلى SSE
    - بعد الفشل، يضع علامة على WebSocket بأنه متدهور لمدة ~60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات ثابتة لهوية الجلسة والدور لعمليات إعادة المحاولة وإعادة الاتصال
    - يوحّد عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (افتراضي) | WebSocket أولًا، ثم رجوع احتياطي إلى SSE |
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
    - [واجهة API الفورية باستخدام WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [استجابات API المتدفقة (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="التهيئة المسبقة لـ WebSocket">
    يمكّن OpenClaw التهيئة المسبقة لـ WebSocket افتراضيًا لـ `openai/*` و`openai-codex/*` لتقليل زمن استجابة الدور الأول.

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
    يوفر OpenClaw مفتاح تبديل مشتركًا للوضع السريع لـ `openai/*` و`openai-codex/*`:

    - **الدردشة/واجهة المستخدم:** `/fast status|on|off`
    - **الإعدادات:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التفعيل، يربط OpenClaw الوضع السريع بمعالجة الأولوية في OpenAI (`service_tier = "priority"`). تُحفَظ قيم `service_tier` الحالية، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

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
    تتغلب تجاوزات الجلسة على الإعدادات. يؤدي مسح تجاوز الجلسة في واجهة جلسات المستخدم إلى إعادة الجلسة إلى الإعداد الافتراضي المضبوط.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    تتيح API الخاصة بـ OpenAI معالجة الأولوية عبر `service_tier`. عيّنها لكل نموذج في OpenClaw:

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
    لا يُمرَّر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجّهت أيًّا من المزوّدين عبر وكيل، يترك OpenClaw قيمة `service_tier` كما هي.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل غلاف بث Pi-harness الخاص بـ Plugin OpenAI الضغط من جهة الخادم تلقائيًا:

    - يفرض `store: true` (ما لم يعيّن توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - القيمة الافتراضية لـ `compact_threshold`: 70% من `contextWindow` (أو `80000` عندما لا تكون متاحة)

    ينطبق هذا على مسار Pi harness المدمج وعلى خطاطيف مزوّد OpenAI المستخدمة بواسطة التشغيلات المضمّنة. يدير مسار native Codex app-server harness سياقه الخاص عبر Codex ويُضبط بشكل منفصل باستخدام `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Enable explicitly">
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
    لا يتحكم `responsesServerCompaction` إلا في حقن `context_management`. تظل نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم يعيّن التوافق `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    بالنسبة إلى تشغيلات عائلة GPT-5 على `openai/*`، يستطيع OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

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
    - لم يعد يتعامل مع دور التخطيط فقط كتقدّم ناجح عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدور بتوجيه للتنفيذ الآن
    - يفعّل `update_plan` تلقائيًا للأعمال الكبيرة
    - يعرض حالة حظر صريحة إذا استمر النموذج في التخطيط دون تنفيذ

    <Note>
    يقتصر ذلك على تشغيلات عائلة GPT-5 في OpenAI وCodex فقط. يحتفظ المزوّدون الآخرون وعائلات النماذج الأقدم بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    يتعامل OpenClaw مع نقاط نهاية OpenAI وCodex وAzure OpenAI المباشرة بشكل مختلف عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - تحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI `none`
    - تحذف التعليل المعطّل للنماذج أو الوكلاء الذين يرفضون `reasoning.effort: "none"`
    - تضبط مخططات الأدوات افتراضيًا على الوضع الصارم
    - ترفق ترويسات نسب مخفية على المضيفين الأصليين الموثّقين فقط
    - تحتفظ بتشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier`، `store`، توافق التعليل، تلميحات ذاكرة التخزين المؤقت للمطالبات)

    **مسارات الوكيل/المتوافقة:**
    - تستخدم سلوك توافق أكثر تساهلًا
    - تزيل `store` الخاصة بـ Completions من حمولات `openai-completions` غير الأصلية
    - تقبل تمرير JSON المتقدم عبر `params.extra_body`/`params.extraBody` لوكلاء Completions المتوافقين مع OpenAI
    - تقبل `params.chat_template_kwargs` لوكلاء Completions المتوافقين مع OpenAI مثل vLLM
    - لا تفرض مخططات الأدوات الصارمة أو الترويسات الخاصة بالمسارات الأصلية فقط

    يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق، لكنه لا يتلقى ترويسات النسب المخفية.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Image generation" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="Video generation" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="OAuth and auth" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
