---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

توفر OpenAI واجهات API للمطورين لنماذج GPT، كما يتوفر Codex أيضًا كوكيل برمجة ضمن خطة ChatGPT من خلال عملاء Codex التابعين لـ OpenAI. يحافظ OpenClaw على فصل هذه الواجهات حتى تبقى الإعدادات قابلة للتنبؤ.

يستخدم OpenClaw المسار `openai/*` باعتباره مسار نموذج OpenAI المعتمد. تعمل دورات الوكلاء المضمنة على نماذج OpenAI من خلال بيئة تشغيل خادم تطبيق Codex الأصلية افتراضيًا؛ وتظل مصادقة مفتاح OpenAI API المباشرة متاحة لواجهات OpenAI غير الخاصة بالوكلاء مثل الصور، والتضمينات، والكلام، والوقت الحقيقي.

- **نماذج الوكلاء** - نماذج `openai/*` من خلال بيئة تشغيل Codex؛ سجّل الدخول باستخدام مصادقة `openai-codex` لاستخدام اشتراك ChatGPT/Codex، أو اضبط ملف تعريف مفتاح API من نوع `openai-codex` عندما تريد عمدًا استخدام مصادقة مفتاح API.
- **واجهات OpenAI API غير الخاصة بالوكلاء** - وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام من خلال `OPENAI_API_KEY` أو إعداد مفتاح OpenAI API.
- **الإعدادات القديمة** - تتم إصلاح مراجع نماذج `openai-codex/*` بواسطة `openclaw doctor --fix` إلى `openai/*` بالإضافة إلى بيئة تشغيل Codex.

تدعم OpenAI صراحةً استخدام OAuth للاشتراكات في الأدوات وسير العمل الخارجية مثل OpenClaw.

الموفر، والنموذج، وبيئة التشغيل، والقناة طبقات منفصلة. إذا كانت هذه التسميات تختلط معًا، فاقرأ [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes) قبل تغيير الإعدادات.

## اختيار سريع

| الهدف                                                 | استخدم                                                   | ملاحظات                                                               |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| اشتراك ChatGPT/Codex مع بيئة تشغيل Codex الأصلية | `openai/gpt-5.5`                                        | إعداد وكيل OpenAI الافتراضي. سجّل الدخول باستخدام مصادقة `openai-codex`. |
| فوترة مفتاح API مباشرة لنماذج الوكلاء              | `openai/gpt-5.5` بالإضافة إلى ملف تعريف مفتاح API من نوع `openai-codex` | استخدم `auth.order.openai-codex` لتفضيل ذلك الملف الشخصي.             |
| فوترة مفتاح API مباشرة من خلال PI صريح           | `openai/gpt-5.5` بالإضافة إلى `agentRuntime.id: "pi"`   | اختر ملف تعريف مفتاح API عاديًا من نوع `openai`.                      |
| أحدث اسم بديل لـ ChatGPT Instant API              | `openai/chat-latest`                                    | مفتاح API مباشر فقط. اسم بديل متحرك للتجارب، وليس الافتراضي.          |
| مصادقة اشتراك ChatGPT/Codex من خلال PI صريح       | `openai/gpt-5.5` بالإضافة إلى `agentRuntime.id: "pi"`   | اختر ملف تعريف مصادقة `openai-codex` لمسار التوافق.                   |
| توليد الصور أو تحريرها                              | `openai/gpt-image-2`                                    | يعمل مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.                        |
| صور بخلفية شفافة                                    | `openai/gpt-image-1.5`                                  | استخدم `outputFormat=png` أو `webp` و`openai.background=transparent`. |

## خريطة التسمية

الأسماء متشابهة لكنها ليست قابلة للتبادل:

| الاسم الذي تراه                    | الطبقة              | المعنى                                                                                           |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | بادئة الموفر        | مسار نموذج OpenAI المعتمد؛ تستخدم دورات الوكيل بيئة تشغيل Codex.                                  |
| `openai-codex`                     | بادئة المصادقة/الملف الشخصي | موفر ملف تعريف مصادقة OpenAI Codex OAuth/الاشتراك.                                                |
| `codex` plugin                     | Plugin              | Plugin مضمن في OpenClaw يوفر بيئة تشغيل خادم تطبيق Codex الأصلية وعناصر تحكم محادثة `/codex`. |
| `agentRuntime.id: codex`           | بيئة تشغيل الوكيل   | يفرض أداة تشغيل خادم تطبيق Codex الأصلية للدورات المضمنة.                                        |
| `/codex ...`                       | مجموعة أوامر المحادثة | ربط/التحكم في سلاسل خادم تطبيق Codex من محادثة.                                                   |
| `runtime: "acp", agentId: "codex"` | مسار جلسة ACP       | مسار احتياطي صريح يشغّل Codex من خلال ACP/acpx.                                                   |

يعني هذا أن الإعدادات يمكن أن تحتوي عمدًا على مراجع نماذج `openai/*` وملفات تعريف مصادقة `openai-codex` معًا. يعيد `openclaw doctor --fix` كتابة مراجع نماذج `openai-codex/*` القديمة إلى مسار نموذج OpenAI المعتمد.

<Note>
يتوفر GPT-5.5 عبر وصول مباشر بمفتاح OpenAI Platform API وعبر مسارات الاشتراك/OAuth. لاستخدام اشتراك ChatGPT/Codex مع تنفيذ Codex الأصلي، استخدم `openai/gpt-5.5`؛ يؤدي ترك إعدادات بيئة التشغيل غير مضبوطة الآن إلى اختيار أداة Codex لدورات وكيل OpenAI. استخدم ملفات تعريف مفتاح OpenAI API فقط عندما تريد مصادقة مفتاح API مباشرة لنموذج وكيل OpenAI.
</Note>

<Note>
تتطلب دورات نماذج وكيل OpenAI Plugin خادم تطبيق Codex المضمن. تظل إعدادات بيئة تشغيل PI الصريحة متاحة كمسار توافق اختياري. عندما يتم اختيار PI صراحةً مع ملف تعريف مصادقة `openai-codex`، يحافظ OpenClaw على مرجع النموذج العام كـ `openai/*` ويوجه PI داخليًا عبر نقل مصادقة Codex القديم. شغّل `openclaw doctor --fix` لإصلاح مراجع نماذج `openai-codex/*` القديمة أو تثبيتات جلسات PI القديمة التي لا تأتي من إعدادات بيئة تشغيل صريحة.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI                | واجهة OpenClaw                                                    | الحالة                                                  |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| المحادثة / الاستجابات      | موفر نموذج `openai/<model>`                                      | نعم                                                    |
| نماذج اشتراك Codex        | `openai/<model>` مع `openai-codex` OAuth                          | نعم                                                    |
| مراجع نماذج Codex القديمة | `openai-codex/<model>`                                            | يتم إصلاحها بواسطة doctor إلى `openai/<model>`         |
| أداة خادم تطبيق Codex     | `openai/<model>` مع حذف بيئة التشغيل أو `agentRuntime.id: codex` | نعم                                                    |
| البحث الويب من جانب الخادم | أداة OpenAI Responses الأصلية                                    | نعم، عندما يكون البحث في الويب مفعّلًا ولا يوجد موفر مثبت |
| الصور                     | `image_generate`                                                  | نعم                                                    |
| الفيديوهات                | `video_generate`                                                  | نعم                                                    |
| تحويل النص إلى كلام        | `messages.tts.provider: "openai"` / `tts`                         | نعم                                                    |
| تحويل الكلام إلى نص دفعي   | `tools.media.audio` / فهم الوسائط                                 | نعم                                                    |
| تحويل الكلام إلى نص متدفق  | Voice Call `streaming.provider: "openai"`                         | نعم                                                    |
| الصوت في الوقت الحقيقي     | Voice Call `realtime.provider: "openai"` / Control UI Talk        | نعم                                                    |
| التضمينات                 | موفر تضمينات الذاكرة                                             | نعم                                                    |

## تضمينات الذاكرة

يمكن أن يستخدم OpenClaw OpenAI، أو نقطة نهاية تضمين متوافقة مع OpenAI، لفهرسة `memory_search` وتضمينات الاستعلام:

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

بالنسبة إلى نقاط النهاية المتوافقة مع OpenAI التي تتطلب تسميات تضمين غير متماثلة، اضبط `queryInputType` و`documentInputType` ضمن `memorySearch`. يمرر OpenClaw هذه القيم كحقول طلب `input_type` خاصة بالموفر: تستخدم تضمينات الاستعلام `queryInputType`؛ وتستخدم أجزاء الذاكرة المفهرسة والفهرسة الدفعية `documentInputType`. راجع [مرجع إعدادات الذاكرة](/ar/reference/memory-config#provider-specific-config) للاطلاع على المثال الكامل.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ أو انسخ مفتاح API من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرر المفتاح مباشرةً:

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

    | مرجع النموذج          | إعداد بيئة التشغيل        | المسار                     | المصادقة         |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | محذوف / `agentRuntime.id: "codex"` | أداة خادم تطبيق Codex | ملف تعريف `openai-codex` |
    | `openai/gpt-5.4-mini` | محذوف / `agentRuntime.id: "codex"` | أداة خادم تطبيق Codex | ملف تعريف `openai-codex` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | بيئة تشغيل PI المضمنة | ملف تعريف `openai` أو ملف تعريف `openai-codex` المختار |

    <Note>
    تستخدم نماذج وكلاء `openai/*` أداة خادم تطبيق Codex. لاستخدام مصادقة مفتاح API لنموذج وكيل، أنشئ ملف تعريف مفتاح API من نوع `openai-codex` ورتبه باستخدام `auth.order.openai-codex`؛ يظل `OPENAI_API_KEY` هو الاحتياطي المباشر لواجهات OpenAI API غير الخاصة بالوكلاء.
    </Note>

    ### مثال إعداد

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    لتجربة نموذج Instant الحالي في ChatGPT من OpenAI API، اضبط النموذج على `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` هو اسم بديل متحرك. توثقه OpenAI باعتباره أحدث نموذج Instant مستخدمًا في ChatGPT وتوصي بـ `gpt-5.5` لاستخدام API في الإنتاج، لذلك أبقِ `openai/gpt-5.5` كافتراضي مستقر ما لم تكن تريد صراحةً سلوك ذلك الاسم البديل. يقبل الاسم البديل حاليًا إسهاب النص `medium` فقط، لذلك يطبع OpenClaw تجاوزات إسهاب نص OpenAI غير المتوافقة لهذا النموذج.

    <Warning>
    لا يعرّض OpenClaw `openai/gpt-5.3-codex-spark`. ترفض طلبات OpenAI API الحية ذلك النموذج، كما أن كتالوج Codex الحالي لا يعرّضه أيضًا.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex الخاص بك مع تنفيذ خادم تطبيق Codex الأصلي بدلًا من مفتاح API منفصل. يتطلب Codex cloud تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرةً:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        بالنسبة إلى الإعدادات عديمة الواجهة أو غير الملائمة لردود الاستدعاء، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز جهاز ChatGPT بدلًا من رد استدعاء متصفح localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="استخدم مسار نموذج OpenAI المعتمد">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        لا يلزم أي إعداد لوقت التشغيل للمسار الافتراضي. تختار دورات وكيل OpenAI
        وقت تشغيل خادم تطبيق Codex الأصلي تلقائيًا، ويثبّت OpenClaw
        أو يصلح Plugin Codex المضمّن عند اختيار هذا المسار.
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
    | `openai/gpt-5.5` | محذوف / `agentRuntime.id: "codex"` | حاضنة خادم تطبيق Codex الأصلية | تسجيل الدخول إلى Codex أو ملف تعريف `openai-codex` المحدد |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | وقت تشغيل PI مضمّن مع نقل داخلي لمصادقة Codex | ملف تعريف `openai-codex` المحدد |
    | `openai-codex/gpt-5.5` | أُصلح بواسطة doctor | مسار قديم أُعيدت كتابته إلى `openai/gpt-5.5` | ملف تعريف `openai-codex` موجود |

    <Warning>
    لا تضبط مراجع نماذج `openai-codex/gpt-5.1*` أو `openai-codex/gpt-5.2*` أو
    `openai-codex/gpt-5.3*` الأقدم. ترفض حسابات ChatGPT/Codex OAuth الآن
    تلك النماذج. استخدم `openai/gpt-5.5`؛ تختار دورات وكيل OpenAI الآن وقت تشغيل Codex
    افتراضيًا.
    </Warning>

    <Note>
    استمر في استخدام معرّف موفّر `openai-codex` لأوامر المصادقة/ملف التعريف. بادئة النموذج
    `openai-codex/*` إعداد قديم يصلحه doctor. للإعداد الشائع الذي يجمع الاشتراك
    مع وقت التشغيل الأصلي، سجّل الدخول باستخدام `openai-codex`
    لكن أبقِ مرجع النموذج `openai/gpt-5.5`.
    </Note>

    ### مثال إعداد

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

    <Note>
    لم تعد تهيئة البدء تستورد مواد OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth في المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكيل الخاص به.
    </Note>

    ### التحقق من توجيه Codex OAuth واستعادته

    استخدم هذه الأوامر لمعرفة النموذج ووقت التشغيل ومسار المصادقة الذي يستخدمه
    وكيلك الافتراضي:

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

    إذا كان إعداد أقدم لا يزال يحتوي على `openai-codex/gpt-*` أو تثبيت جلسة OpenAI PI
    قديم من دون إعداد وقت تشغيل صريح، فأصلحه:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    إذا أظهر `models auth list --provider openai-codex` عدم وجود ملف تعريف صالح للاستخدام، فسجّل
    الدخول مرة أخرى:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    يبقى `openai-codex` معرّف موفّر المصادقة/ملف التعريف. `openai/*` هو
    مسار النموذج لدورات وكيل OpenAI عبر Codex.

    ### مؤشر الحالة

    تعرض دردشة `/status` وقت تشغيل النموذج النشط للجلسة الحالية.
    تظهر حاضنة خادم تطبيق Codex المضمّنة كـ `Runtime: OpenAI Codex` لدورات
    نموذج وكيل OpenAI. تُصلح تثبيتات جلسات PI القديمة إلى Codex ما لم
    يثبّت الإعداد PI صراحةً.

    ### تحذير Doctor

    إذا بقيت مسارات `openai-codex/*` أو تثبيتات OpenAI PI قديمة في الإعداد أو
    حالة الجلسة، فإن `openclaw doctor --fix` يعيد كتابتها إلى `openai/*` مع وقت
    تشغيل Codex ما لم يكن PI مضبوطًا صراحةً.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات تعريف النموذج وحد سياق وقت التشغيل كقيمتين منفصلتين.

    بالنسبة إلى `openai/gpt-5.5` عبر كتالوج Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - حد `contextTokens` الافتراضي لوقت التشغيل: `272000`

    يمنح الحد الافتراضي الأصغر خصائص أفضل عمليًا في زمن الاستجابة والجودة. تجاوزه باستخدام `contextTokens`:

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

    ### استعادة الكتالوج

    يستخدم OpenClaw بيانات تعريف كتالوج Codex upstream لـ `gpt-5.5` عندما تكون
    موجودة. إذا أغفل اكتشاف Codex المباشر صف `gpt-5.5` بينما
    الحساب مصادق عليه، ينشئ OpenClaw صف نموذج OAuth هذا بحيث
    لا تفشل تشغيلات cron والوكيل الفرعي والنموذج الافتراضي المضبوط بسبب
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة خادم تطبيق Codex الأصلية

تستخدم حاضنة خادم تطبيق Codex الأصلية مراجع نماذج `openai/*` مع إعداد
وقت تشغيل محذوف أو `agentRuntime.id: "codex"`، لكن مصادقتها لا تزال
قائمة على الحساب. يختار OpenClaw
المصادقة بهذا الترتيب:

1. ملف تعريف مصادقة `openai-codex` صريح في OpenClaw مربوط بالوكيل.
2. حساب خادم التطبيق الموجود، مثل تسجيل دخول ChatGPT المحلي في Codex CLI.
3. لعمليات تشغيل خادم التطبيق المحلية عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما يبلّغ خادم التطبيق عن عدم وجود حساب ولا يزال يتطلب
   مصادقة OpenAI.

يعني ذلك أن تسجيل دخول اشتراك ChatGPT/Codex المحلي لا يُستبدل لمجرد
أن عملية Gateway لديها أيضًا `OPENAI_API_KEY` لنماذج OpenAI المباشرة
أو embeddings. يكون الرجوع إلى مفتاح API من البيئة لمسار stdio المحلي بلا حساب فقط؛
ولا يُرسل إلى اتصالات خادم التطبيق عبر WebSocket. عند اختيار ملف تعريف Codex
بنمط اشتراك، يُبقي OpenClaw أيضًا `CODEX_API_KEY` و `OPENAI_API_KEY`
خارج العملية الفرعية لخادم التطبيق stdio التي يتم تشغيلها ويرسل بيانات الاعتماد المحددة
عبر RPC تسجيل دخول خادم التطبيق.

## إنشاء الصور

يسجّل Plugin `openai` المضمّن إنشاء الصور عبر أداة `image_generate`.
ويدعم إنشاء الصور بمفتاح API من OpenAI وإنشاء الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| القدرة                | مفتاح API من OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع النموذج                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| المصادقة                      | `OPENAI_API_KEY`                   | تسجيل دخول OpenAI Codex OAuth           |
| النقل                 | OpenAI Images API                  | الواجهة الخلفية Codex Responses              |
| الحد الأقصى للصور لكل طلب    | 4                                  | 4                                    |
| وضع التحرير                 | مفعّل (حتى 5 صور مرجعية) | مفعّل (حتى 5 صور مرجعية)   |
| تجاوزات الحجم            | مدعومة، بما في ذلك أحجام 2K/4K   | مدعومة، بما في ذلك أحجام 2K/4K     |
| نسبة العرض إلى الارتفاع / الدقة | لا تُمرَّر إلى OpenAI Images API | تُطابَق إلى حجم مدعوم عندما يكون ذلك آمنًا |

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
راجع [إنشاء الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار الموفّر، وسلوك تجاوز الفشل.
</Note>

`gpt-image-2` هو الإعداد الافتراضي لكل من إنشاء الصور من نص في OpenAI وتحرير الصور.
تظل `gpt-image-1.5` و `gpt-image-1` و `gpt-image-1-mini` قابلة للاستخدام
كتجاوزات نموذج صريحة. استخدم `openai/gpt-image-1.5` لمخرجات
PNG/WebP بخلفية شفافة؛ ترفض واجهة API الحالية لـ `gpt-image-2`
`background: "transparent"`.

لطلب خلفية شفافة، يجب أن تستدعي الوكلاء `image_generate` مع
`model: "openai/gpt-image-1.5"` و `outputFormat: "png"` أو `"webp"` و
`background: "transparent"`؛ ولا يزال خيار الموفّر الأقدم `openai.background`
مقبولًا. يحمي OpenClaw أيضًا مسارات OpenAI العامة و
OpenAI Codex OAuth عبر إعادة كتابة طلبات الشفافية الافتراضية `openai/gpt-image-2`
إلى `gpt-image-1.5`؛ وتحتفظ Azure ونقاط النهاية المخصصة المتوافقة مع OpenAI
بأسماء النشر/النموذج المضبوطة لديها.

يتوفر الإعداد نفسه لتشغيلات CLI بلا واجهة:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

استخدم علامتي `--output-format` و `--background` نفسيهما مع
`openclaw infer image edit` عند البدء من ملف إدخال.
يبقى `--openai-background` متاحًا كاسم بديل خاص بـ OpenAI.

بالنسبة إلى تثبيتات Codex OAuth، أبقِ مرجع `openai/gpt-image-2` نفسه. عند ضبط
ملف تعريف OAuth من `openai-codex`، يحل OpenClaw رمز وصول OAuth المخزّن هذا
ويرسل طلبات الصور عبر الواجهة الخلفية Codex Responses. ولا يحاول أولًا استخدام
`OPENAI_API_KEY` ولا يرجع بصمت إلى مفتاح API لذلك الطلب.
اضبط `models.providers.openai` صراحةً باستخدام مفتاح API
أو عنوان URL أساسي مخصص أو نقطة نهاية Azure عندما تريد مسار OpenAI Images API
المباشر بدلًا من ذلك.
إذا كانت نقطة نهاية الصور المخصصة تلك على عنوان LAN/خاص موثوق، فاضبط أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ يبقي OpenClaw
نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محظورة ما لم توجد هذه الموافقة الصريحة.

إنشاء:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

إنشاء PNG شفافة:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

تحرير:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## إنشاء الفيديو

يسجّل Plugin `openai` المضمّن إنشاء الفيديو عبر أداة `video_generate`.

| القدرة       | القيمة                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي    | `openai/sora-2`                                                                   |
| الأوضاع            | نص إلى فيديو، صورة إلى فيديو، تحرير فيديو واحد                                  |
| مدخلات مرجعية | صورة واحدة أو فيديو واحد                                                                |
| تجاوزات الحجم   | مدعومة                                                                         |
| تجاوزات أخرى  | يتم تجاهل `aspectRatio` و `resolution` و `audio` و `watermark` مع تحذير من الأداة |

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
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار الموفّر، وسلوك تجاوز الفشل.
</Note>

## مساهمة موجه GPT-5

يضيف OpenClaw مساهمة موجه GPT-5 مشتركة لتشغيلات عائلة GPT-5 عبر الموفّرين. تُطبّق حسب معرّف النموذج، لذلك تتلقى `openai/gpt-5.5` والمراجع القديمة قبل الإصلاح مثل `openai-codex/gpt-5.5` و `openrouter/openai/gpt-5.5` و `opencode/gpt-5.5` ومراجع GPT-5 المتوافقة الأخرى التراكب نفسه. ولا تتلقاه نماذج GPT-4.x الأقدم.

تستخدم حاضنة Codex الأصلية المضمّنة سلوك GPT-5 نفسه وتراكب Heartbeat عبر تعليمات مطوّر خادم تطبيق Codex، لذلك تحتفظ جلسات `openai/gpt-5.x` المفروضة عبر `agentRuntime.id: "codex"` بإرشادات المتابعة وHeartbeat الاستباقية نفسها حتى لو كان Codex يملك بقية موجه الحاضنة.

تضيف مساهمة GPT-5 عقد سلوك موسوما لاستمرار الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوصات الإكمال، والتحقق. يبقى سلوك الرد الخاص بكل قناة وسلوك الرسائل الصامتة في موجّه نظام OpenClaw المشترك وسياسة التسليم الصادر. تكون إرشادات GPT-5 مفعّلة دائما للنماذج المطابقة. طبقة أسلوب التفاعل الودّي منفصلة وقابلة للضبط.

| القيمة                 | التأثير                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (default) | تفعيل طبقة أسلوب التفاعل الودّي |
| `"on"`                 | اسم بديل لـ `"friendly"`                      |
| `"off"`                | تعطيل طبقة الأسلوب الودّي فقط       |

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
القيم غير حساسة لحالة الأحرف في وقت التشغيل، لذلك يعطّل كل من `"Off"` و`"off"` طبقة الأسلوب الودّي.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ كخيار توافق احتياطي عندما لا يكون إعداد `agents.defaults.promptOverlays.gpt5.personality` المشترك مضبوطا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    يسجّل plugin `openai` المضمّن توليف الكلام لسطح `messages.tts`.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يعود احتياطيا إلى `OPENAI_API_KEY` |
    | عنوان URL الأساسي | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | جسم إضافي | `messages.tts.providers.openai.extraBody` / `extra_body` | (غير مضبوط) |

    النماذج المتاحة: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. الأصوات المتاحة: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    يُدمج `extraBody` في JSON طلب `/audio/speech` بعد الحقول التي ينشئها OpenClaw، لذلك استخدمه لنقاط النهاية المتوافقة مع OpenAI التي تتطلب مفاتيح إضافية مثل `lang`. يتم تجاهل مفاتيح النماذج الأولية.

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
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز عنوان URL الأساسي لـ TTS من دون التأثير في نقطة نهاية API الدردشة.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    يسجّل plugin `openai` المضمّن تحويل الكلام إلى نص على دفعات عبر
    سطح النسخ لفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم بواسطة OpenClaw حيثما يستخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قنوات الصوت في Discord ومرفقات الصوت
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

    تُمرَّر تلميحات اللغة والموجّه إلى OpenAI عند توفيرها بواسطة
    إعداد وسائط الصوت المشترك أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="Realtime transcription">
    يسجّل plugin `openai` المضمّن النسخ الفوري لـ plugin Voice Call.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير مضبوط) |
    | الموجّه | `...openai.prompt` | (غير مضبوط) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يعود احتياطيا إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). موفّر البث هذا مخصص لمسار النسخ الفوري في Voice Call؛ يسجّل صوت Discord حاليا مقاطع قصيرة ويستخدم بدلا من ذلك مسار نسخ `tools.media.audio` الدفعي.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    يسجّل plugin `openai` المضمّن الصوت الفوري لـ plugin Voice Call.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | الصوت | `...openai.voice` | `alloy` |
    | الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يعود احتياطيا إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفتاحي الإعداد `azureEndpoint` و`azureDeployment` لجسور الواجهة الخلفية الفورية. يدعم استدعاء الأدوات ثنائي الاتجاه. يستخدم تنسيق صوت G.711 u-law.
    </Note>

    <Note>
    يستخدم Control UI Talk جلسات OpenAI الفورية في المتصفح مع سر عميل مؤقت
    يصدره Gateway وتبادل WebRTC SDP مباشر من المتصفح مقابل
    OpenAI Realtime API. يتوفر تحقق مباشر للمشرفين باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    حيث يصدر مسار OpenAI سر عميل في Node، وينشئ عرض SDP في المتصفح
    باستخدام وسائط ميكروفون وهمية، ويرسله إلى OpenAI، ثم يطبّق إجابة SDP
    من دون تسجيل الأسرار.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لموفّر `openai` المضمّن استهداف مورد Azure OpenAI لتوليد الصور
عبر تجاوز عنوان URL الأساسي. في مسار توليد الصور، يكتشف OpenClaw
أسماء مضيف Azure على `models.providers.openai.baseUrl` ويتحوّل إلى
شكل طلب Azure تلقائيا.

<Note>
يستخدم الصوت الفوري مسار إعداد منفصلا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **Realtime
voice** ضمن [الصوت والكلام](#voice-and-speech) لإعداداته الخاصة بـ Azure.
</Note>

استخدم Azure OpenAI عندما:

- تكون لديك بالفعل اشتراك Azure OpenAI أو حصة أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال يوفرها Azure
- تريد إبقاء حركة المرور داخل مستأجر Azure قائم

### الإعداد

لتوليد صور Azure عبر موفّر `openai` المضمّن، وجّه
`models.providers.openai.baseUrl` إلى مورد Azure واضبط `apiKey` على
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

بالنسبة إلى طلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلا من `Authorization: Bearer`
- يستخدم مسارات محددة بنطاق النشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب
- يستخدم مهلة طلب افتراضية قدرها 600 ثانية لاستدعاءات توليد الصور في Azure.
  لا تزال قيم `timeoutMs` لكل استدعاء تتجاوز هذا الافتراضي.

تحافظ عناوين URL الأساسية الأخرى (OpenAI العام، والوكلاء المتوافقون مع OpenAI) على
شكل طلب الصور القياسي في OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور في موفّر `openai`
OpenClaw 2026.4.22 أو أحدث. تتعامل الإصدارات الأقدم مع أي
`openai.baseUrl` مخصص كما لو كان نقطة نهاية OpenAI العامة وستفشل مقابل عمليات نشر الصور في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار معاينة Azure محدد أو إصدار GA
لمسار توليد الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

القيمة الافتراضية هي `2024-12-01-preview` عندما يكون المتغير غير مضبوط.

### أسماء النماذج هي أسماء عمليات النشر

يربط Azure OpenAI النماذج بعمليات النشر. بالنسبة إلى طلبات توليد الصور في Azure
الموجّهة عبر موفّر `openai` المضمّن، يجب أن يكون حقل `model` في OpenClaw
هو **اسم نشر Azure** الذي ضبطته في بوابة Azure، وليس
معرّف نموذج OpenAI العام.

إذا أنشأت عملية نشر باسم `gpt-image-2-prod` تخدّم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجّهة عبر
موفّر `openai` المضمّن.

### التوفر الإقليمي

يتوفر توليد الصور في Azure حاليا فقط في مجموعة فرعية من المناطق
(على سبيل المثال `eastus2`، `swedencentral`، `polandcentral`، `westus3`،
`uaenorth`). تحقق من قائمة مناطق Microsoft الحالية قبل إنشاء
عملية نشر، وتأكد من أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا يقبل Azure OpenAI وOpenAI العام دائما معلمات الصور نفسها.
قد يرفض Azure خيارات يسمح بها OpenAI العام (مثل بعض
قيم `background` على `gpt-image-2`) أو يتيحها فقط في إصدارات نماذج
محددة. تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من
OpenClaw. إذا فشل طلب Azure مع خطأ تحقق، فتحقق من
مجموعة المعلمات المدعومة بواسطة عملية النشر وإصدار API المحددين في
بوابة Azure.

<Note>
يستخدم Azure OpenAI نقلا أصليا وسلوك توافق، لكنه لا يتلقى
ترويسات الإسناد المخفية في OpenClaw — راجع أكورديون **Native vs OpenAI-compatible
routes** ضمن [الإعداد المتقدم](#advanced-configuration).

بالنسبة إلى حركة الدردشة أو Responses على Azure (خارج توليد الصور)، استخدم
تدفق الإعداد الأولي أو إعداد موفّر Azure مخصص — لا يكفي `openai.baseUrl` وحده
لاختيار شكل API/المصادقة في Azure. يوجد موفّر منفصل
`azure-openai-responses/*`؛ راجع
أكورديون Compaction من جهة الخادم أدناه.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    يستخدم OpenClaw WebSocket أولا مع رجوع احتياطي إلى SSE (`"auto"`) لـ `openai/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع احتياطيا إلى SSE
    - بعد حدوث فشل، يعلّم WebSocket كمتدهور لمدة تقارب 60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات مستقرة لهوية الجلسة والدورة للمحاولات وإعادة الاتصال
    - يطبّع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (default) | WebSocket أولا، ثم رجوع احتياطي إلى SSE |
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
    يفعّل OpenClaw إحماء WebSocket افتراضياً لـ `openai/*` لتقليل زمن استجابة أول دورة.

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
    يوفّر OpenClaw مفتاح تبديل مشتركاً للوضع السريع لـ `openai/*`:

    - **الدردشة/واجهة المستخدم:** `/fast status|on|off`
    - **الإعدادات:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند تفعيله، يربط OpenClaw الوضع السريع بمعالجة الأولوية في OpenAI (`service_tier = "priority"`). تُحفَظ قيم `service_tier` الحالية، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

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
    تتقدّم تجاوزات الجلسة على الإعدادات. يؤدي مسح تجاوز الجلسة في واجهة جلسات العمل إلى إرجاع الجلسة إلى الإعداد الافتراضي المضبوط.
    </Note>

  </Accordion>

  <Accordion title="معالجة الأولوية (service_tier)">
    توفّر واجهة API الخاصة بـ OpenAI معالجة الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

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
    لا يُمرَّر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجّهت أياً من المزوّدين عبر وسيط، يترك OpenClaw قيمة `service_tier` كما هي.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جهة الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل مغلّف تدفق Pi-harness في Plugin الخاص بـ OpenAI ميزة Compaction من جهة الخادم تلقائياً:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - قيمة `compact_threshold` الافتراضية: 70% من `contextWindow` (أو `80000` عند عدم توفرها)

    ينطبق هذا على مسار Pi harness المدمج وعلى خطاطيف مزوّد OpenAI المستخدمة بواسطة التشغيلات المضمّنة. يدير حزام خادم تطبيق Codex الأصلي سياقه الخاص عبر Codex ويُضبط بشكل منفصل باستخدام `agents.defaults.agentRuntime.id`.

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

  <Accordion title="وضع GPT الوكيل الصارم">
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
    - لم يعد يعتبر دورة الخطة فقط تقدماً ناجحاً عندما يكون إجراء أداة متاحاً
    - يعيد محاولة الدورة بتوجيه للتصرف الآن
    - يفعّل `update_plan` تلقائياً للأعمال الكبيرة
    - يعرض حالة حظر صريحة إذا استمر النموذج في التخطيط دون تنفيذ

    <Note>
    يقتصر النطاق على تشغيلات عائلة GPT-5 الخاصة بـ OpenAI وCodex فقط. يحتفظ المزوّدون الآخرون وعائلات النماذج الأقدم بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI وCodex وAzure OpenAI المباشرة بطريقة مختلفة عن وسطاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - يحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI بالقيمة `none`
    - يحذف التعليل المعطّل للنماذج أو الوسطاء الذين يرفضون `reasoning.effort: "none"`
    - يضبط مخططات الأدوات افتراضياً على الوضع الصارم
    - يرفق ترويسات إسناد مخفية على المضيفين الأصليين المتحقق منهم فقط
    - يحتفظ بتشكيل طلبات OpenAI فقط (`service_tier`، `store`، توافق التعليل، تلميحات ذاكرة التخزين المؤقت للمطالبات)

    **مسارات الوسيط/المتوافقة:**
    - تستخدم سلوك توافق أكثر مرونة
    - تزيل `store` الخاص بـ Completions من حمولات `openai-completions` غير الأصلية
    - تقبل تمرير JSON المتقدم عبر `params.extra_body`/`params.extraBody` لوسطاء Completions المتوافقين مع OpenAI
    - تقبل `params.chat_template_kwargs` لوسطاء Completions المتوافقين مع OpenAI مثل vLLM
    - لا تفرض مخططات الأدوات الصارمة أو الترويسات الأصلية فقط

    يستخدم Azure OpenAI نقلاً أصلياً وسلوك توافق، لكنه لا يتلقى ترويسات الإسناد المخفية.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
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
