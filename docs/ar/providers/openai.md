---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد استخدام مصادقة اشتراك Codex بدلاً من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:39:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

توفر OpenAI واجهات API للمطورين لنماذج GPT، ويتوفر Codex أيضًا كوكيل برمجة ضمن خطة
ChatGPT عبر عملاء Codex من OpenAI. يبقي OpenClaw هذه
الأسطح منفصلة حتى يظل الإعداد قابلاً للتنبؤ.

يستخدم OpenClaw المسار `openai/*` باعتباره مسار نموذج OpenAI القياسي. تعمل
دورات الوكيل المضمّنة على نماذج OpenAI عبر وقت تشغيل خادم تطبيق Codex الأصلي
افتراضيًا؛ وتظل مصادقة مفتاح API المباشرة من OpenAI متاحة لأسطح OpenAI غير الوكيلة
مثل الصور والتضمينات والكلام والوقت الفعلي.

- **نماذج الوكلاء** - نماذج `openai/*` عبر وقت تشغيل Codex؛ سجّل الدخول باستخدام
  مصادقة Codex لاستخدام اشتراك ChatGPT/Codex، أو اضبط نسخة احتياطية متوافقة مع Codex
  لمفتاح API من OpenAI عندما تريد عمدًا مصادقة مفتاح API.
- **واجهات API غير الوكيلة من OpenAI** - وصول مباشر إلى OpenAI Platform مع فوترة حسب
  الاستخدام عبر `OPENAI_API_KEY` أو إعداد مفتاح API من OpenAI.
- **الإعداد القديم** - يتم إصلاح مراجع نماذج `openai-codex/*` بواسطة
  `openclaw doctor --fix` إلى `openai/*` بالإضافة إلى وقت تشغيل Codex.

تدعم OpenAI صراحةً استخدام OAuth للاشتراك في الأدوات الخارجية وسير العمل مثل OpenClaw.

الموفر والنموذج ووقت التشغيل والقناة طبقات منفصلة. إذا كانت هذه التسميات
تختلط معًا، فاقرأ [أزمنة تشغيل الوكلاء](/ar/concepts/agent-runtimes) قبل
تغيير الإعداد.

## الاختيار السريع

| الهدف                                                 | استخدم                                                      | ملاحظات                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي | `openai/gpt-5.5`                                         | إعداد وكيل OpenAI الافتراضي. سجّل الدخول باستخدام مصادقة Codex.                  |
| فوترة مفتاح API مباشرة لنماذج الوكلاء              | `openai/gpt-5.5` بالإضافة إلى ملف تعريف مفتاح API متوافق مع Codex | استخدم `auth.order.openai` لوضع النسخة الاحتياطية بعد مصادقة الاشتراك.  |
| فوترة مفتاح API مباشرة عبر PI صريح           | `openai/gpt-5.5` بالإضافة إلى وقت تشغيل الموفر/النموذج `pi`        | اختر ملف تعريف مفتاح API عاديًا لـ `openai`.                             |
| أحدث اسم مستعار لواجهة API لنموذج Instant في ChatGPT                     | `openai/chat-latest`                                     | مفتاح API مباشر فقط. اسم مستعار متحرك للتجارب، وليس الافتراضي.   |
| مصادقة اشتراك ChatGPT/Codex عبر PI صريح  | `openai/gpt-5.5` بالإضافة إلى وقت تشغيل الموفر/النموذج `pi`        | اختر ملف تعريف مصادقة `openai-codex` لمسار التوافق.    |
| توليد الصور أو تحريرها                          | `openai/gpt-image-2`                                     | يعمل مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.             |
| صور بخلفية شفافة                        | `openai/gpt-image-1.5`                                   | استخدم `outputFormat=png` أو `webp` و`openai.background=transparent`. |

## خريطة التسمية

الأسماء متشابهة لكنها ليست قابلة للتبادل:

| الاسم الذي تراه                            | الطبقة                      | المعنى                                                                                                              |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | بادئة الموفر            | مسار نموذج OpenAI القياسي؛ تستخدم دورات الوكيل وقت تشغيل Codex.                                                     |
| `openai-codex`                          | بادئة المصادقة/ملف التعريف القديمة | مساحة أسماء أقدم لملف تعريف OpenAI Codex OAuth/الاشتراك. لا تزال ملفات التعريف الحالية و`auth.order.openai-codex` تعمل. |
| Plugin `codex`                          | Plugin                     | Plugin مضمّن في OpenClaw يوفر وقت تشغيل خادم تطبيق Codex الأصلي وعناصر تحكم محادثة `/codex`.                    |
| provider/model `agentRuntime.id: codex` | وقت تشغيل الوكيل              | يفرض حزمة خادم تطبيق Codex الأصلية للدورات المضمّنة المطابقة.                                               |
| `/codex ...`                            | مجموعة أوامر المحادثة           | ربط/التحكم في سلاسل خادم تطبيق Codex من محادثة.                                                           |
| `runtime: "acp", agentId: "codex"`      | مسار جلسة ACP          | مسار احتياطي صريح يشغّل Codex عبر ACP/acpx.                                                             |

هذا يعني أن الإعداد يمكن أن يحتوي عمدًا على مراجع نماذج `openai/*` بينما لا تزال ملفات
تعريف المصادقة تشير إلى بيانات اعتماد متوافقة مع Codex. فضّل `auth.order.openai`
للإعداد الجديد؛ وتظل ملفات تعريف `openai-codex:*` الحالية و`auth.order.openai-codex`
مدعومة. يعيد `openclaw doctor --fix` كتابة مراجع نماذج `openai-codex/*` القديمة
إلى مسار نموذج OpenAI القياسي.

<Note>
يتوفر GPT-5.5 عبر الوصول المباشر بمفتاح API إلى OpenAI Platform وعبر
مسارات الاشتراك/OAuth. لاشتراك ChatGPT/Codex مع تنفيذ Codex الأصلي،
استخدم `openai/gpt-5.5`؛ يؤدي غياب إعداد وقت التشغيل الآن إلى اختيار حزمة Codex
لدورات وكيل OpenAI. استخدم ملفات تعريف مفتاح API من OpenAI فقط عندما تريد
مصادقة مفتاح API مباشرة لنموذج وكيل OpenAI.
</Note>

<Note>
تتطلب دورات نماذج وكيل OpenAI Plugin خادم تطبيق Codex المضمّن. يظل إعداد وقت تشغيل
PI الصريح متاحًا كمسار توافق اختياري. عندما يتم اختيار PI صراحةً مع ملف تعريف مصادقة
`openai-codex`، يبقي OpenClaw مرجع النموذج العام كـ `openai/*` ويوجّه PI داخليًا عبر
نقل مصادقة Codex القديم. شغّل `openclaw doctor --fix` لإصلاح مراجع نماذج
`openai-codex/*` القديمة أو تثبيتات جلسة PI القديمة التي لا تأتي من
إعداد وقت تشغيل صريح.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI         | سطح OpenClaw                                                                 | الحالة                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| المحادثة / Responses          | موفر نموذج `openai/<model>`                                                  | نعم                                                    |
| نماذج اشتراك Codex | `openai/<model>` مع `openai-codex` OAuth                                       | نعم                                                    |
| مراجع نماذج Codex القديمة   | `openai-codex/<model>`                                                           | يتم إصلاحها بواسطة doctor إلى `openai/<model>`                 |
| حزمة خادم تطبيق Codex  | `openai/<model>` مع وقت تشغيل محذوف أو `agentRuntime.id: codex` للموفر/النموذج | نعم                                                    |
| البحث في الويب من جهة الخادم    | أداة OpenAI Responses الأصلية                                                     | نعم، عندما يكون البحث في الويب مفعلاً ولا يكون أي موفر مثبتًا |
| الصور                    | `image_generate`                                                                 | نعم                                                    |
| الفيديوهات                    | `video_generate`                                                                 | نعم                                                    |
| تحويل النص إلى كلام            | `messages.tts.provider: "openai"` / `tts`                                        | نعم                                                    |
| تحويل الكلام إلى نص على دفعات      | `tools.media.audio` / فهم الوسائط                                        | نعم                                                    |
| تحويل الكلام إلى نص بالتدفق  | Voice Call `streaming.provider: "openai"`                                        | نعم                                                    |
| صوت الوقت الفعلي            | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | نعم                                                    |
| التضمينات                | موفر تضمين الذاكرة                                                        | نعم                                                    |

## تضمينات الذاكرة

يمكن لـ OpenClaw استخدام OpenAI، أو نقطة نهاية تضمين متوافقة مع OpenAI، من أجل
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
هذه الحقول كحقول طلب `input_type` خاصة بالموفر: تستخدم تضمينات الاستعلام
`queryInputType`؛ وتستخدم مقاطع الذاكرة المفهرسة والفهرسة الدفعية
`documentInputType`. راجع [مرجع إعداد الذاكرة](/ar/reference/memory-config#provider-specific-config) للاطلاع على المثال الكامل.

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

        أو مرّر المفتاح مباشرةً:

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
    | `openai/gpt-5.5`      | محذوف / `agentRuntime.id: "codex"` للموفر/النموذج | حزمة خادم تطبيق Codex | ملف تعريف OpenAI متوافق مع Codex |
    | `openai/gpt-5.4-mini` | محذوف / `agentRuntime.id: "codex"` للموفر/النموذج | حزمة خادم تطبيق Codex | ملف تعريف OpenAI متوافق مع Codex |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"` للموفر/النموذج              | وقت تشغيل PI المضمّن      | ملف تعريف `openai` أو ملف تعريف `openai-codex` محدد |

    <Note>
    تستخدم نماذج وكلاء `openai/*` حزمة خادم تطبيق Codex. لاستخدام مصادقة مفتاح API
    لنموذج وكيل، أنشئ ملف تعريف مفتاح API متوافقًا مع Codex ورتبه
    باستخدام `auth.order.openai`؛ يظل `OPENAI_API_KEY` هو الاحتياطي المباشر لأسطح
    OpenAI API غير الوكيلة. لا تزال إدخالات `auth.order.openai-codex` الأقدم
    تعمل.
    </Note>

    ### مثال إعداد

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    لتجربة نموذج Instant الحالي في ChatGPT من OpenAI API، عيّن النموذج
    إلى `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` اسم مستعار متحرك. توثقه OpenAI بوصفه أحدث نموذج Instant
    مستخدمًا في ChatGPT وتوصي بـ `gpt-5.5` لاستخدام API في الإنتاج، لذا
    أبقِ `openai/gpt-5.5` كافتراضي مستقر ما لم تكن تريد صراحةً
    سلوك هذا الاسم المستعار. يقبل الاسم المستعار حاليًا إسهاب نص `medium` فقط، لذلك
    يطبع OpenClaw تجاوزات إسهاب نص OpenAI غير المتوافقة لهذا
    النموذج إلى صيغة متوافقة.

    <Warning>
    لا يعرّض OpenClaw **`openai/gpt-5.3-codex-spark`**. ترفض طلبات OpenAI API الحية ذلك النموذج، ولا يعرّضه كتالوج Codex الحالي أيضًا.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **الأنسب لـ:** استخدام اشتراك ChatGPT/Codex الخاص بك مع تنفيذ خادم تطبيق Codex الأصلي بدلًا من مفتاح API منفصل. يتطلب Codex السحابي تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        للإعدادات عديمة الواجهة أو غير المناسبة لاستدعاءات العودة، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز جهاز ChatGPT بدلًا من استدعاء عودة متصفح localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        لا يلزم أي تكوين وقت تشغيل للمسار الافتراضي. تختار دورات وكيل OpenAI
        وقت تشغيل خادم تطبيق Codex الأصلي تلقائيًا، ويثبّت OpenClaw
        أو يصلح Plugin المضمّن الخاص بـ Codex عند اختيار هذا المسار.
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

    | مرجع النموذج | تكوين وقت التشغيل | المسار | المصادقة |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | محذوف / موفر/نموذج `agentRuntime.id: "codex"` | حاضنة خادم تطبيق Codex الأصلية | تسجيل دخول Codex أو ملف تعريف مصادقة `openai` مرتب |
    | `openai/gpt-5.5` | موفر/نموذج `agentRuntime.id: "pi"` | وقت تشغيل PI المضمّن مع نقل Codex-auth الداخلي | ملف تعريف `openai-codex` المحدد |
    | `openai-codex/gpt-5.5` | أصلحه doctor | مسار قديم أُعيدت كتابته إلى `openai/gpt-5.5` | ملف تعريف `openai-codex` موجود |

    <Warning>
    لا تكوّن مراجع نماذج أقدم مثل `openai-codex/gpt-5.1*` أو `openai-codex/gpt-5.2*` أو
    `openai-codex/gpt-5.3*`. ترفض حسابات ChatGPT/Codex OAuth الآن
    تلك النماذج. استخدم `openai/gpt-5.5`؛ تختار دورات وكيل OpenAI الآن وقت تشغيل Codex
    افتراضيًا.
    </Warning>

    <Note>
    بادئة النموذج `openai-codex/*` هي تكوين قديم يصلحه doctor. لإعداد
    الاشتراك الشائع مع وقت التشغيل الأصلي، سجّل الدخول بمصادقة Codex
    لكن أبقِ مرجع النموذج على `openai/gpt-5.5`. يجب أن يضع التكوين الجديد ترتيب مصادقة
    وكيل OpenAI تحت `auth.order.openai`؛ وتظل إدخالات `auth.order.openai-codex`
    الأقدم صالحة.
    </Note>

    ### مثال تكوين

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    مع نسخة احتياطية بمفتاح API، أبقِ النموذج على `openai/gpt-5.5` وضع
    ترتيب المصادقة تحت `openai`. سيحاول OpenClaw استخدام الاشتراك أولًا، ثم
    مفتاح API، مع البقاء على حاضنة Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    لم تعد عملية الإعداد تستورد مادة OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكيل الخاص به.
    </Note>

    ### فحص توجيه Codex OAuth واستعادته

    استخدم هذه الأوامر لمعرفة النموذج ووقت التشغيل ومسار المصادقة التي يستخدمها
    وكيلك الافتراضي:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    لوكيل محدد، أضف `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    إذا كان تكوين أقدم لا يزال يحتوي على `openai-codex/gpt-*` أو تثبيت جلسة OpenAI PI
    قديمًا بدون تكوين وقت تشغيل صريح، فأصلحه:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    إذا أظهر `models auth list --provider openai-codex` عدم وجود ملف تعريف قابل للاستخدام، فسجّل
    الدخول مرة أخرى:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*` هو مسار النموذج لدورات وكيل OpenAI عبر Codex. يظل
    معرف موفر المصادقة/ملف التعريف `openai-codex` مقبولًا لملفات التعريف
    والقوائم في CLI الحالية.

    ### مؤشر الحالة

    تعرض دردشة `/status` وقت تشغيل النموذج النشط للجلسة الحالية.
    تظهر حاضنة خادم تطبيق Codex المضمّنة كـ `Runtime: OpenAI Codex` لدورات نماذج وكيل
    OpenAI. تُصلح تثبيتات جلسات PI القديمة إلى Codex ما لم
    يثبّت التكوين PI صراحة.

    ### تحذير doctor

    إذا بقيت مسارات `openai-codex/*` أو تثبيتات OpenAI PI القديمة في التكوين أو
    حالة الجلسة، فإن `openclaw doctor --fix` يعيد كتابتها إلى `openai/*` مع وقت تشغيل
    Codex ما لم يكن PI مكوّنًا صراحة.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات تعريف النموذج وحد سياق وقت التشغيل كقيمتين منفصلتين.

    بالنسبة إلى `openai/gpt-5.5` عبر كتالوج Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - حد `contextTokens` الافتراضي لوقت التشغيل: `272000`

    الحد الافتراضي الأصغر يوفر عمليًا خصائص زمن استجابة وجودة أفضل. تجاوزه باستخدام `contextTokens`:

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

    يستخدم OpenClaw بيانات تعريف كتالوج Codex من المصدر الأعلى لـ `gpt-5.5` عندما تكون
    موجودة. إذا أغفل اكتشاف Codex المباشر صف `gpt-5.5` بينما
    الحساب مصادق عليه، ينشئ OpenClaw صف نموذج OAuth هذا بحيث
    لا تفشل عمليات cron والوكيل الفرعي وعمليات نموذج الافتراضي المكوّن برسالة
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة خادم تطبيق Codex الأصلي

تستخدم حاضنة خادم تطبيق Codex الأصلية مراجع نماذج `openai/*` مع تكوين وقت تشغيل
محذوف أو موفر/نموذج `agentRuntime.id: "codex"`، لكن مصادقتها
لا تزال قائمة على الحساب. يختار OpenClaw المصادقة بهذا الترتيب:

1. ملفات تعريف مصادقة OpenAI المرتبة للوكيل، ويفضل أن تكون تحت
   `auth.order.openai`. تظل ملفات تعريف `openai-codex:*` الحالية و
   `auth.order.openai-codex` صالحة للتثبيتات الأقدم.
2. حساب خادم التطبيق الحالي، مثل تسجيل دخول ChatGPT محلي عبر Codex CLI.
3. لعمليات تشغيل خادم التطبيق المحلي عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما يبلّغ خادم التطبيق عن عدم وجود حساب ولا يزال يتطلب
   مصادقة OpenAI.

هذا يعني أن تسجيل دخول اشتراك ChatGPT/Codex محلي لا يُستبدل لمجرد
أن عملية Gateway لديها أيضًا `OPENAI_API_KEY` لنماذج OpenAI المباشرة
أو التضمينات. تراجع مفتاح API عبر البيئة هو فقط مسار stdio المحلي بلا حساب؛ ولا
يُرسل إلى اتصالات خادم التطبيق عبر WebSocket. عند اختيار ملف تعريف Codex
بنمط الاشتراك، يحافظ OpenClaw أيضًا على `CODEX_API_KEY` و `OPENAI_API_KEY`
خارج ابن خادم التطبيق stdio المُنشأ ويرسل بيانات الاعتماد المحددة
عبر RPC تسجيل الدخول إلى خادم التطبيق. عندما يُحظر ملف تعريف الاشتراك هذا بسبب
حد استخدام Codex، يمكن لـ OpenClaw التدوير إلى ملف تعريف مفتاح API التالي المرتب `openai:*`
دون تغيير النموذج المحدد أو الخروج من حاضنة Codex. بعد مرور وقت
إعادة تعيين الاشتراك، يصبح ملف تعريف الاشتراك مؤهلًا مرة أخرى.

## توليد الصور

يسجل Plugin `openai` المضمّن توليد الصور عبر أداة `image_generate`.
يدعم توليد الصور بمفتاح API الخاص بـ OpenAI وتوليد الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| القدرة                | مفتاح API لـ OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع النموذج                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| المصادقة                      | `OPENAI_API_KEY`                   | تسجيل دخول OpenAI Codex OAuth           |
| النقل                 | OpenAI Images API                  | خلفية Codex Responses              |
| الحد الأقصى للصور لكل طلب    | 4                                  | 4                                    |
| وضع التحرير                 | مفعّل (حتى 5 صور مرجعية) | مفعّل (حتى 5 صور مرجعية)   |
| تجاوزات الحجم            | مدعومة، بما في ذلك أحجام 2K/4K   | مدعومة، بما في ذلك أحجام 2K/4K     |
| نسبة العرض إلى الارتفاع / الدقة | لا تُمرر إلى OpenAI Images API | تُعيّن إلى حجم مدعوم عندما يكون ذلك آمنًا |

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
راجع [توليد الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار الموفر، وسلوك تجاوز الفشل.
</Note>

`gpt-image-2` هو الافتراضي لكل من توليد OpenAI من النص إلى الصورة وتحرير الصور.
تظل `gpt-image-1.5` و `gpt-image-1` و `gpt-image-1-mini` قابلة للاستخدام كتجاوزات
صريحة للنموذج. استخدم `openai/gpt-image-1.5` لمخرجات PNG/WebP
بخلفية شفافة؛ ترفض واجهة API الحالية لـ `gpt-image-2`
`background: "transparent"`.

لطلب بخلفية شفافة، يجب أن يستدعي الوكلاء `image_generate` مع
`model: "openai/gpt-image-1.5"` و `outputFormat: "png"` أو `"webp"` و
`background: "transparent"`؛ ولا يزال خيار الموفر الأقدم `openai.background`
مقبولًا. يحمي OpenClaw أيضًا مسارات OpenAI العامة و
OpenAI Codex OAuth بإعادة كتابة طلبات الشفافية الافتراضية لـ `openai/gpt-image-2`
إلى `gpt-image-1.5`؛ وتحتفظ نقاط نهاية Azure ونقاط النهاية المخصصة المتوافقة مع OpenAI
بأسماء النشر/النموذج المكوّنة لديها.

يُعرض الإعداد نفسه لعمليات CLI عديمة الواجهة:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

استخدم علامتَي `--output-format` و `--background` نفسيهما مع
`openclaw infer image edit` عند البدء من ملف إدخال.
تظل `--openai-background` متاحة كاسم مستعار خاص بـ OpenAI.

بالنسبة إلى تثبيتات Codex OAuth، أبقِ المرجع نفسه `openai/gpt-image-2`. عند تكوين
ملف تعريف OAuth باسم `openai-codex`، يحل OpenClaw رمز وصول OAuth المخزن ذاك
ويرسل طلبات الصور عبر خلفية Codex Responses. لا يحاول
أولًا استخدام `OPENAI_API_KEY` ولا يتراجع بصمت إلى مفتاح API لذلك
الطلب. كوّن `models.providers.openai` صراحة بمفتاح API أو
عنوان URL أساسي مخصص أو نقطة نهاية Azure عندما تريد مسار OpenAI Images API
المباشر بدلًا من ذلك.
إذا كانت نقطة نهاية الصور المخصصة هذه على عنوان LAN/خاص موثوق، فاضبط أيضًا
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

يسجّل Plugin `openai` المضمّن توليد الفيديو من خلال أداة `video_generate`.

| الإمكانية | القيمة |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2` |
| الأوضاع | تحويل النص إلى فيديو، تحويل الصورة إلى فيديو، تحرير فيديو واحد |
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
راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## مساهمة مطالبة GPT-5

يضيف OpenClaw مساهمة مطالبة GPT-5 مشتركة لتشغيلات عائلة GPT-5 عبر المزوّدين. تُطبَّق حسب معرّف النموذج، لذلك تتلقى `openai/gpt-5.5`، ومراجع ما قبل الإصلاح القديمة مثل `openai-codex/gpt-5.5`، و`openrouter/openai/gpt-5.5`، و`opencode/gpt-5.5`، ومراجع GPT-5 المتوافقة الأخرى الطبقة نفسها. ولا تتلقاها نماذج GPT-4.x الأقدم.

يستخدم حزام Codex الأصلي المضمّن سلوك GPT-5 نفسه وطبقة Heartbeat عبر تعليمات المطوّر لخادم تطبيق Codex، لذلك تحتفظ جلسات `openai/gpt-5.x` الموجّهة عبر Codex بتوجيهات المتابعة الاستباقية وHeartbeat نفسها، رغم أن Codex يملك بقية مطالبة الحزام.

تضيف مساهمة GPT-5 عقد سلوك موسومًا لاستمرارية الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوصات الاكتمال، والتحقق. يبقى سلوك الرد الخاص بالقناة والرسائل الصامتة في مطالبة نظام OpenClaw المشتركة وسياسة التسليم الصادر. تكون إرشادات GPT-5 مفعّلة دائمًا للنماذج المطابقة. طبقة أسلوب التفاعل الودّي منفصلة وقابلة للتهيئة.

| القيمة | التأثير |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (الافتراضي) | تفعيل طبقة أسلوب التفاعل الودّي |
| `"on"` | اسم بديل لـ `"friendly"` |
| `"off"` | تعطيل طبقة الأسلوب الودّي فقط |

<Tabs>
  <Tab title="التهيئة">
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
القيم غير حساسة لحالة الأحرف وقت التشغيل، لذا يعطّل كل من `"Off"` و`"off"` طبقة الأسلوب الودّي.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ كمسار احتياطي للتوافق عندما لا يكون إعداد `agents.defaults.promptOverlays.gpt5.personality` المشترك مضبوطًا.
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
    | الجسم الإضافي | `messages.tts.providers.openai.extraBody` / `extra_body` | (غير مضبوط) |

    النماذج المتاحة: `gpt-4o-mini-tts`، و`tts-1`، و`tts-1-hd`. الأصوات المتاحة: `alloy`، و`ash`، و`ballad`، و`cedar`، و`coral`، و`echo`، و`fable`، و`juniper`، و`marin`، و`onyx`، و`nova`، و`sage`، و`shimmer`، و`verse`.

    يتم دمج `extraBody` في JSON طلب `/audio/speech` بعد الحقول التي يولّدها OpenClaw، لذا استخدمه لنقاط النهاية المتوافقة مع OpenAI التي تتطلب مفاتيح إضافية مثل `lang`. يتم تجاهل مفاتيح النموذج الأولي.

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
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز عنوان URL الأساسي لـ TTS دون التأثير في نقطة نهاية API المحادثة. لا يزال OpenAI TTS يُهيّأ من خلال مفتاح API؛ وللتحدث الراجع المباشر المستند إلى OAuth فقط، استخدم مسار صوت Realtime بدلًا من كلام STT -> TTS في وضع الوكيل.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجّل Plugin `openai` المضمّن تحويل الكلام إلى نص على دفعات من خلال
    سطح النسخ لفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم في OpenClaw حيثما يستخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية ومرفقات
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

    تُمرَّر تلميحات اللغة والمطالبة إلى OpenAI عند توفيرها بواسطة
    تهيئة وسائط الصوت المشتركة أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ في الوقت الفعلي">
    يسجل Plugin `openai` المضمّن النسخ في الوقت الفعلي لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير معيّن) |
    | الموجه | `...openai.prompt` | (غير معيّن) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | المصادقة | `...openai.apiKey` أو `OPENAI_API_KEY` أو OAuth لـ `openai-codex` | تتصل مفاتيح API مباشرة؛ ويُصدر OAuth سر عميل نسخ في الوقت الفعلي |

    <Note>
    يستخدم اتصال WebSocket مع `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law ‏(`g711_ulaw` / `audio/pcmu`). عند تكوين OAuth لـ `openai-codex` فقط، يصدر Gateway سر عميل نسخ مؤقتا في الوقت الفعلي قبل فتح WebSocket. موفر البث هذا مخصص لمسار النسخ في الوقت الفعلي في المكالمات الصوتية؛ أما صوت Discord فيسجل حاليا مقاطع قصيرة ويستخدم بدلا من ذلك مسار النسخ الدفعي `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت في الوقت الفعلي">
    يسجل Plugin `openai` المضمّن الصوت في الوقت الفعلي لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | الصوت | `...openai.voice` | `alloy` |
    | الحرارة (جسر نشر Azure) | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | حشو البادئة | `...openai.prefixPaddingMs` | `300` |
    | جهد الاستدلال | `...openai.reasoningEffort` | (غير معيّن) |
    | المصادقة | `...openai.apiKey` أو `OPENAI_API_KEY` أو OAuth لـ `openai-codex` | يمكن لـ Browser Talk وجسور الخلفية غير التابعة لـ Azure استخدام OAuth لـ Codex |

    الأصوات المدمجة المتاحة في الوقت الفعلي لـ `gpt-realtime-2`: `alloy`، `ash`،
    `ballad`، `coral`، `echo`، `sage`، `shimmer`، `verse`، `marin`، `cedar`.
    توصي OpenAI بـ `marin` و`cedar` للحصول على أفضل جودة في الوقت الفعلي. هذه
    مجموعة منفصلة عن أصوات تحويل النص إلى كلام أعلاه؛ لا تفترض أن صوت TTS
    مثل `fable` أو `nova` أو `onyx` صالح لجلسات الوقت الفعلي.

    <Note>
    تستخدم جسور OpenAI الخلفية في الوقت الفعلي شكل جلسة GA Realtime WebSocket، الذي لا يقبل `session.temperature`. تظل عمليات نشر Azure OpenAI متاحة عبر `azureEndpoint` و`azureDeployment` وتحتفظ بشكل الجلسة المتوافق مع النشر. يدعم استدعاء الأدوات ثنائي الاتجاه وصوت G.711 u-law.
    </Note>

    <Note>
    يتم اختيار الصوت في الوقت الفعلي عند إنشاء الجلسة. تسمح OpenAI بتغيير معظم
    حقول الجلسة لاحقا، لكن لا يمكن تغيير الصوت بعد أن يصدر النموذج صوتا في تلك
    الجلسة. تعرض OpenClaw حاليا معرّفات الأصوات المدمجة في الوقت الفعلي كسلاسل.
    </Note>

    <Note>
    يستخدم Control UI Talk جلسات OpenAI في المتصفح في الوقت الفعلي مع سر عميل
    مؤقت يصدره Gateway وتبادل WebRTC SDP مباشر من المتصفح مقابل
    OpenAI Realtime API. عند عدم تكوين مفتاح OpenAI API مباشر، يمكن لـ
    Gateway إصدار سر العميل هذا باستخدام ملف تعريف OAuth المحدد لـ `openai-codex`.
    تستخدم جسور ترحيل Gateway والخلفية في الوقت الفعلي لـ Voice Call
    آلية OAuth الاحتياطية نفسها لنقاط نهاية OpenAI الأصلية. يتوفر التحقق الحي
    للمشرفين باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`؛
    تتحقق مسارات OpenAI من جسر WebSocket الخلفي وتبادل WebRTC SDP في المتصفح
    دون تسجيل الأسرار.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لموفر `openai` المضمّن استهداف مورد Azure OpenAI لتوليد الصور
عن طريق تجاوز عنوان URL الأساسي. في مسار توليد الصور، يكتشف OpenClaw
أسماء مضيفي Azure في `models.providers.openai.baseUrl` ويتحول تلقائيا إلى
شكل طلبات Azure.

<Note>
يستخدم الصوت في الوقت الفعلي مسار إعداد منفصلا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **الصوت في الوقت
الفعلي** ضمن [الصوت والكلام](#voice-and-speech) لمعرفة إعدادات Azure الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- تكون لديك بالفعل اشتراك Azure OpenAI أو حصة أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال توفرها Azure
- تريد إبقاء حركة المرور داخل مستأجر Azure موجود

### الإعداد

لتوليد صور Azure عبر موفر `openai` المضمّن، وجّه
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

يتعرف OpenClaw على لواحق مضيف Azure هذه لمسار توليد صور Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

بالنسبة إلى طلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلا من `Authorization: Bearer`
- يستخدم مسارات محددة النشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب
- يستخدم مهلة طلب افتراضية قدرها 600 ثانية لاستدعاءات توليد الصور في Azure.
  تظل قيم `timeoutMs` لكل استدعاء تتجاوز هذا الافتراضي.

تحافظ عناوين URL الأساسية الأخرى (OpenAI العام، والوكلاء المتوافقون مع OpenAI) على
شكل طلب الصور القياسي في OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور في موفر `openai`
OpenClaw 2026.4.22 أو أحدث. تتعامل الإصدارات الأقدم مع أي
`openai.baseUrl` مخصص مثل نقطة نهاية OpenAI العامة وستفشل مع عمليات نشر صور Azure.
</Note>

### إصدار واجهة برمجة التطبيقات

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار معاينة Azure محدد أو إصدار GA
لمسار إنشاء الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

القيمة الافتراضية هي `2024-12-01-preview` عندما لا يكون المتغير مضبوطًا.

### أسماء النماذج هي أسماء النشر

يربط Azure OpenAI النماذج بعمليات النشر. بالنسبة إلى طلبات إنشاء الصور في Azure
الموجّهة عبر المزوّد المضمّن `openai`، يجب أن يكون حقل `model` في OpenClaw
هو **اسم نشر Azure** الذي أعددته في بوابة Azure، وليس معرّف نموذج OpenAI
العام.

إذا أنشأت نشرًا باسم `gpt-image-2-prod` يقدّم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات إنشاء الصور الموجّهة عبر
المزوّد المضمّن `openai`.

### التوفر الإقليمي

يتوفر إنشاء الصور في Azure حاليًا في مجموعة فرعية فقط من المناطق
(على سبيل المثال `eastus2` و`swedencentral` و`polandcentral` و`westus3`
و`uaenorth`). تحقق من قائمة مناطق Microsoft الحالية قبل إنشاء
نشر، وأكّد أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا يقبل Azure OpenAI وOpenAI العام دائمًا معلمات الصور نفسها.
قد يرفض Azure خيارات يسمح بها OpenAI العام (على سبيل المثال بعض قيم
`background` على `gpt-image-2`) أو يتيحها فقط على إصدارات نماذج محددة.
تأتي هذه الاختلافات من Azure ومن النموذج الأساسي، وليس من OpenClaw.
إذا فشل طلب Azure بخطأ تحقق، فتحقق من مجموعة المعلمات المدعومة بواسطة
النشر وإصدار واجهة برمجة التطبيقات المحددين لديك في بوابة Azure.

<Note>
يستخدم Azure OpenAI نقلًا أصليًا وسلوك توافق، لكنه لا يتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع أكورديون **المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI**
ضمن [الإعدادات المتقدمة](#advanced-configuration).

بالنسبة إلى حركة chat أو Responses على Azure (إلى جانب إنشاء الصور)، استخدم
تدفق الإعداد الأولي أو إعداد مزوّد Azure مخصصًا — لا يكفي `openai.baseUrl` وحده
لالتقاط شكل واجهة برمجة تطبيقات/مصادقة Azure. يوجد مزوّد منفصل
`azure-openai-responses/*`؛ راجع أكورديون Compaction من جهة الخادم أدناه.
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw نهج WebSocket أولًا مع الرجوع إلى SSE (`"auto"`) لـ `openai/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر مرة واحدة قبل الرجوع إلى SSE
    - بعد الفشل، يضع علامة على WebSocket باعتباره متدهورًا لمدة نحو 60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات ثابتة لهوية الجلسة والدورة لإعادة المحاولة وإعادة الاتصال
    - يطبّع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (الافتراضي) | WebSocket أولًا، ثم الرجوع إلى SSE |
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
    - [واجهة Realtime API باستخدام WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [استجابات واجهة برمجة التطبيقات المتدفقة (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="الوضع السريع">
    يتيح OpenClaw مفتاح تبديل مشتركًا للوضع السريع لـ `openai/*`:

    - **Chat/واجهة المستخدم:** `/fast status|on|off`
    - **الإعداد:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند تفعيله، يربط OpenClaw الوضع السريع بمعالجة OpenAI ذات الأولوية (`service_tier = "priority"`). يتم الحفاظ على قيم `service_tier` الموجودة، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

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
    تتغلب تجاوزات الجلسة على الإعداد. تؤدي إزالة تجاوز الجلسة في واجهة الجلسات إلى إعادة الجلسة إلى القيمة الافتراضية المضبوطة.
    </Note>

  </Accordion>

  <Accordion title="المعالجة ذات الأولوية (service_tier)">
    تتيح واجهة برمجة تطبيقات OpenAI المعالجة ذات الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

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

    القيم المدعومة: `auto` و`default` و`flex` و`priority`.

    <Warning>
    لا يتم تمرير `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجّهت أيًا من المزوّدين عبر وكيل، يترك OpenClaw `service_tier` كما هو.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جهة الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل مغلّف تدفق Pi-harness في Plugin OpenAI تلقائيًا Compaction من جهة الخادم:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` الافتراضي: 70% من `contextWindow` (أو `80000` عندما لا يكون متاحًا)

    ينطبق هذا على مسار Pi harness المضمّن وعلى hooks مزوّد OpenAI المستخدمة بواسطة عمليات التشغيل المضمّنة. يدير harness خادم تطبيق Codex الأصلي سياقه الخاص عبر Codex ويتم ضبطه بواسطة مسار وكيل OpenAI الافتراضي أو سياسة وقت تشغيل المزوّد/النموذج.

    <Tabs>
      <Tab title="التفعيل صراحة">
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
    - لم يعد يعامل دورة تحتوي على خطة فقط على أنها تقدم ناجح عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدورة بتوجيه للتصرف الآن
    - يفعّل `update_plan` تلقائيًا للأعمال الكبيرة
    - يعرض حالة حظر صريحة إذا استمر النموذج في التخطيط دون تنفيذ

    <Note>
    يقتصر ذلك على عمليات تشغيل OpenAI وCodex من عائلة GPT-5 فقط. تحتفظ المزوّدات الأخرى وعائلات النماذج الأقدم بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI وCodex وAzure OpenAI المباشرة بشكل مختلف عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - تحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI `none`
    - تحذف reasoning المعطّل للنماذج أو الوكلاء الذين يرفضون `reasoning.effort: "none"`
    - تضبط مخططات الأدوات افتراضيًا على الوضع الصارم
    - ترفق ترويسات الإسناد المخفية على المضيفين الأصليين الذين تم التحقق منهم فقط
    - تحافظ على تشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier` و`store` وتوافق reasoning وتلميحات prompt-cache)

    **مسارات الوكيل/المسارات المتوافقة:**
    - تستخدم سلوك توافق أكثر مرونة
    - تزيل `store` الخاصة بـ Completions من حمولات `openai-completions` غير الأصلية
    - تقبل تمرير JSON المتقدم `params.extra_body`/`params.extraBody` لوكلاء Completions المتوافقين مع OpenAI
    - تقبل `params.chat_template_kwargs` لوكلاء Completions المتوافقين مع OpenAI مثل vLLM
    - لا تفرض مخططات أدوات صارمة أو ترويسات أصلية فقط

    يستخدم Azure OpenAI نقلًا أصليًا وسلوك توافق، لكنه لا يتلقى ترويسات الإسناد المخفية.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
