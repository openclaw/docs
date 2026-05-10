---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد استخدام مصادقة اشتراك Codex بدلاً من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-10T19:58:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5022874c9517e670b70ba90fb400f99f850746c341cb6e967c2abc96d8255548
    source_path: providers/openai.md
    workflow: 16
---

OpenAI توفر واجهات API للمطورين لنماذج GPT، كما أن Codex متاح أيضا كوكيل برمجة ضمن خطة
ChatGPT من خلال عملاء Codex التابعين لـ OpenAI. تبقي OpenClaw هذه
الأسطح منفصلة حتى يظل التكوين قابلا للتنبؤ.

تستخدم OpenClaw المسار `openai/*` كمسار نموذج OpenAI القانوني. تعمل أدوار الوكيل
المضمنة على نماذج OpenAI عبر وقت تشغيل خادم تطبيق Codex الأصلي
افتراضيا؛ وتظل مصادقة مفتاح API المباشرة من OpenAI متاحة لأسطح OpenAI
غير الخاصة بالوكلاء مثل الصور، والتضمينات، والكلام، والوقت الحقيقي.

- **نماذج الوكيل** - نماذج `openai/*` عبر وقت تشغيل Codex؛ سجّل الدخول باستخدام
  مصادقة `openai-codex` لاستخدام اشتراك ChatGPT/Codex، أو اضبط
  ملف تعريف مفتاح API باسم `openai-codex` عندما تريد عمدا مصادقة مفتاح API.
- **واجهات OpenAI API غير الخاصة بالوكلاء** - وصول مباشر إلى OpenAI Platform مع فوترة
  حسب الاستخدام عبر `OPENAI_API_KEY` أو إعداد مفتاح API من OpenAI.
- **التكوين القديم** - تصلح `openclaw doctor --fix` مراجع النماذج
  `openai-codex/*` إلى `openai/*` مع وقت تشغيل Codex.

تدعم OpenAI صراحة استخدام OAuth للاشتراكات في الأدوات الخارجية وسير العمل مثل OpenClaw.

الموفر، والنموذج، ووقت التشغيل، والقناة طبقات منفصلة. إذا كانت هذه التسميات
تختلط معا، فاقرأ [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) قبل
تغيير التكوين.

## الاختيار السريع

| الهدف                                                 | الاستخدام                                                     | ملاحظات                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي | `openai/gpt-5.5`                                        | إعداد وكيل OpenAI الافتراضي. سجّل الدخول باستخدام مصادقة `openai-codex`.         |
| فوترة مباشرة بمفتاح API لنماذج الوكيل              | `openai/gpt-5.5` مع ملف تعريف مفتاح API باسم `openai-codex` | استخدم `auth.order.openai-codex` لتفضيل ذلك الملف التعريفي.                 |
| فوترة مباشرة بمفتاح API عبر PI صريح           | `openai/gpt-5.5` مع وقت تشغيل الموفر/النموذج `pi`       | اختر ملف تعريف مفتاح API عاديا باسم `openai`.                             |
| أحدث اسم مستعار لواجهة ChatGPT Instant API                     | `openai/chat-latest`                                    | مفتاح API مباشر فقط. اسم مستعار متحرك للتجارب، وليس الافتراضي.   |
| مصادقة اشتراك ChatGPT/Codex عبر PI صريح  | `openai/gpt-5.5` مع وقت تشغيل الموفر/النموذج `pi`       | اختر ملف تعريف مصادقة `openai-codex` لمسار التوافق.    |
| توليد الصور أو تحريرها                          | `openai/gpt-image-2`                                    | يعمل إما مع `OPENAI_API_KEY` أو OAuth الخاص بـ OpenAI Codex.             |
| صور بخلفية شفافة                        | `openai/gpt-image-1.5`                                  | استخدم `outputFormat=png` أو `webp` و `openai.background=transparent`. |

## خريطة الأسماء

الأسماء متشابهة لكنها غير قابلة للتبادل:

| الاسم الذي تراه                            | الطبقة               | المعنى                                                                                           |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | بادئة الموفر     | مسار نموذج OpenAI القانوني؛ تستخدم أدوار الوكيل وقت تشغيل Codex.                                  |
| `openai-codex`                          | بادئة المصادقة/ملف التعريف | موفر ملف تعريف مصادقة OpenAI Codex عبر OAuth/الاشتراك.                                            |
| Plugin `codex`                          | Plugin              | Plugin مضمّن في OpenClaw يوفر وقت تشغيل خادم تطبيق Codex الأصلي وعناصر تحكم محادثة `/codex`. |
| provider/model `agentRuntime.id: codex` | وقت تشغيل الوكيل       | يفرض حزمة خادم تطبيق Codex الأصلية للأدوار المضمنة المطابقة.                            |
| `/codex ...`                            | مجموعة أوامر المحادثة    | يربط/يتحكم في سلاسل خادم تطبيق Codex من محادثة.                                        |
| `runtime: "acp", agentId: "codex"`      | مسار جلسة ACP   | مسار احتياطي صريح يشغل Codex عبر ACP/acpx.                                          |

يعني ذلك أن التكوين يمكن أن يحتوي عمدا على كل من مراجع نماذج `openai/*`
وملفات تعريف مصادقة `openai-codex`. تعيد `openclaw doctor --fix` كتابة
مراجع النماذج القديمة `openai-codex/*` إلى مسار نموذج OpenAI القانوني.

<Note>
يتوفر GPT-5.5 عبر الوصول المباشر إلى OpenAI Platform بمفتاح API
وعبر مسارات الاشتراك/OAuth. لاشتراك ChatGPT/Codex مع تنفيذ Codex
الأصلي، استخدم `openai/gpt-5.5`؛ اختيار تكوين وقت التشغيل غير المضبوط الآن يحدد حزمة Codex
لأدوار وكيل OpenAI. استخدم ملفات تعريف مفتاح API من OpenAI فقط عندما تريد
مصادقة مباشرة بمفتاح API لنموذج وكيل OpenAI.
</Note>

<Note>
تتطلب أدوار نماذج وكيل OpenAI Plugin خادم تطبيق Codex المضمّن. يظل تكوين
وقت تشغيل PI الصريح متاحا كمسار توافق اختياري. عندما يتم اختيار PI
صراحة مع ملف تعريف مصادقة `openai-codex`، تبقي OpenClaw مرجع النموذج
العام كـ `openai/*` وتوجه PI داخليا عبر نقل
مصادقة Codex القديم. شغّل `openclaw doctor --fix` لإصلاح مراجع النماذج
`openai-codex/*` القديمة أو تثبيتات جلسات PI القديمة التي لا تأتي من
تكوين وقت تشغيل صريح.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI         | سطح OpenClaw                                                                 | الحالة                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| المحادثة / الردود          | موفر نموذج `openai/<model>`                                                  | نعم                                                    |
| نماذج اشتراك Codex | `openai/<model>` مع OAuth باسم `openai-codex`                                       | نعم                                                    |
| مراجع نماذج Codex القديمة   | `openai-codex/<model>`                                                           | يصلحها doctor إلى `openai/<model>`                 |
| حزمة خادم تطبيق Codex  | `openai/<model>` مع وقت تشغيل محذوف أو provider/model `agentRuntime.id: codex` | نعم                                                    |
| البحث على الويب من جهة الخادم    | أداة OpenAI Responses الأصلية                                                     | نعم، عندما يكون البحث على الويب مفعلا ولا يوجد موفر مثبت |
| الصور                    | `image_generate`                                                                 | نعم                                                    |
| الفيديوهات                    | `video_generate`                                                                 | نعم                                                    |
| تحويل النص إلى كلام            | `messages.tts.provider: "openai"` / `tts`                                        | نعم                                                    |
| تحويل الكلام إلى نص دفعي      | `tools.media.audio` / فهم الوسائط                                        | نعم                                                    |
| تحويل الكلام إلى نص متدفق  | مكالمة صوتية `streaming.provider: "openai"`                                        | نعم                                                    |
| الصوت في الوقت الحقيقي            | مكالمة صوتية `realtime.provider: "openai"` / Talk في واجهة التحكم                       | نعم                                                    |
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

لنقاط النهاية المتوافقة مع OpenAI التي تتطلب تسميات تضمين غير متماثلة، عيّن
`queryInputType` و `documentInputType` ضمن `memorySearch`. تمرر OpenClaw
هذه القيم كحقول طلب `input_type` خاصة بالموفر: تستخدم تضمينات الاستعلام
`queryInputType`؛ وتستخدم مقاطع الذاكرة المفهرسة والفهرسة الدفعية
`documentInputType`. راجع [مرجع تكوين الذاكرة](/ar/reference/memory-config#provider-specific-config) للاطلاع على المثال الكامل.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [لوحة OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
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

    | مرجع النموذج              | تكوين وقت التشغيل             | المسار                       | المصادقة             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | محذوف / provider/model `agentRuntime.id: "codex"` | حزمة خادم تطبيق Codex | ملف تعريف `openai-codex` |
    | `openai/gpt-5.4-mini` | محذوف / provider/model `agentRuntime.id: "codex"` | حزمة خادم تطبيق Codex | ملف تعريف `openai-codex` |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "pi"`              | وقت تشغيل PI المضمن      | ملف تعريف `openai` أو ملف تعريف `openai-codex` محدد |

    <Note>
    تستخدم نماذج الوكيل `openai/*` حزمة خادم تطبيق Codex. لاستخدام مصادقة مفتاح API
    لنموذج وكيل، أنشئ ملف تعريف مفتاح API باسم `openai-codex` ورتبه
    باستخدام `auth.order.openai-codex`؛ يظل `OPENAI_API_KEY` هو البديل المباشر
    لأسطح OpenAI API غير الخاصة بالوكلاء.
    </Note>

    ### مثال تكوين

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

    `chat-latest` اسم مستعار متحرك. توثقه OpenAI باعتباره أحدث نموذج Instant
    مستخدم في ChatGPT وتوصي بـ `gpt-5.5` لاستخدام API في الإنتاج، لذلك
    أبق `openai/gpt-5.5` كإعداد افتراضي مستقر ما لم تكن تريد صراحة
    سلوك ذلك الاسم المستعار. لا يقبل الاسم المستعار حاليا إلا إسهاب النص `medium`، لذلك
    تطبع OpenClaw تجاوزات إسهاب النص غير المتوافقة من OpenAI لهذا
    النموذج.

    <Warning>
    لا تعرض OpenClaw النموذج `openai/gpt-5.3-codex-spark`. ترفض طلبات OpenAI API الحية ذلك النموذج، كما أن كتالوج Codex الحالي لا يعرضه أيضا.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex الخاص بك مع تنفيذ خادم تطبيق Codex الأصلي بدلا من مفتاح API منفصل. تتطلب سحابة Codex تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل OAuth الخاص بـ Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        للإعدادات عديمة الواجهة أو التي لا تلائم ردود الاستدعاء، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز جهاز ChatGPT بدلا من رد استدعاء متصفح المضيف المحلي:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        لا يلزم أي إعداد تشغيل للمسار الافتراضي. تختار أدوار وكيل OpenAI
        تشغيل خادم تطبيق Codex الأصلي تلقائيًا، ويثبّت OpenClaw
        أو يصلح Plugin Codex المضمّن عند اختيار هذا المسار.
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai-codex
        ```

        بعد تشغيل Gateway، أرسل `/codex status` أو `/codex models`
        في الدردشة للتحقق من تشغيل خادم التطبيق الأصلي.
      </Step>
    </Steps>

    ### ملخص المسارات

    | مرجع النموذج | إعداد التشغيل | المسار | المصادقة |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | محذوف / المزوّد/النموذج `agentRuntime.id: "codex"` | حزمة خادم تطبيق Codex الأصلية | تسجيل الدخول إلى Codex أو ملف تعريف `openai-codex` المحدد |
    | `openai/gpt-5.5` | المزوّد/النموذج `agentRuntime.id: "pi"` | تشغيل PI المضمّن مع نقل مصادقة Codex داخلي | ملف تعريف `openai-codex` المحدد |
    | `openai-codex/gpt-5.5` | يتم إصلاحه بواسطة doctor | مسار قديم يُعاد كتابته إلى `openai/gpt-5.5` | ملف تعريف `openai-codex` الحالي |

    <Warning>
    لا تضبط مراجع نماذج `openai-codex/gpt-5.1*` أو `openai-codex/gpt-5.2*` أو
    `openai-codex/gpt-5.3*` الأقدم. ترفض حسابات OAuth في ChatGPT/Codex الآن
    تلك النماذج. استخدم `openai/gpt-5.5`؛ تختار أدوار وكيل OpenAI الآن تشغيل Codex
    افتراضيًا.
    </Warning>

    <Note>
    استمر في استخدام معرّف المزوّد `openai-codex` لأوامر المصادقة/ملفات التعريف. بادئة
    النموذج `openai-codex/*` هي إعداد قديم يصلحه doctor. للإعداد الشائع الذي يجمع بين
    الاشتراك والتشغيل الأصلي، سجّل الدخول باستخدام `openai-codex`
    لكن أبقِ مرجع النموذج `openai/gpt-5.5`.
    </Note>

    ### مثال إعداد

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

    <Note>
    لم يعد الإعداد الأولي يستورد مواد OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكلاء الخاص به.
    </Note>

    ### فحص توجيه OAuth في Codex واستعادته

    استخدم هذه الأوامر لمعرفة النموذج والتشغيل ومسار المصادقة الذي يستخدمه وكيلك
    الافتراضي:

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

    إذا كان إعداد أقدم لا يزال يحتوي على `openai-codex/gpt-*` أو تثبيت جلسة OpenAI PI
    قديم من دون إعداد تشغيل صريح، فأصلحه:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    إذا لم يعرض `models auth list --provider openai-codex` أي ملف تعريف قابل للاستخدام، فسجّل
    الدخول مرة أخرى:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    يظل `openai-codex` معرّف مزوّد المصادقة/ملف التعريف. أما `openai/*` فهو
    مسار النموذج لأدوار وكيل OpenAI عبر Codex.

    ### مؤشر الحالة

    تعرض دردشة `/status` تشغيل النموذج النشط للجلسة الحالية.
    تظهر حزمة خادم تطبيق Codex المضمّنة كـ `Runtime: OpenAI Codex` لأدوار
    نماذج وكيل OpenAI. تُصلح تثبيتات جلسات PI القديمة إلى Codex ما لم
    يثبّت الإعداد PI صراحةً.

    ### تحذير doctor

    إذا بقيت مسارات `openai-codex/*` أو تثبيتات OpenAI PI القديمة في الإعداد أو
    حالة الجلسة، فإن `openclaw doctor --fix` يعيد كتابتها إلى `openai/*` مع
    تشغيل Codex ما لم يتم إعداد PI صراحةً.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات النموذج الوصفية وحد سياق التشغيل كقيمتين منفصلتين.

    بالنسبة إلى `openai/gpt-5.5` عبر كتالوج OAuth في Codex:

    - `contextWindow` الأصلي: `1000000`
    - حد `contextTokens` الافتراضي للتشغيل: `272000`

    يوفر الحد الافتراضي الأصغر خصائص أفضل من ناحية زمن الاستجابة والجودة عمليًا. تجاوزه باستخدام `contextTokens`:

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
    استخدم `contextWindow` للتصريح ببيانات النموذج الأصلية الوصفية. استخدم `contextTokens` للحد من ميزانية سياق التشغيل.
    </Note>

    ### استعادة الكتالوج

    يستخدم OpenClaw بيانات كتالوج Codex الوصفية من المصدر الأعلى لـ `gpt-5.5` عندما تكون
    موجودة. إذا أغفل الاكتشاف المباشر في Codex صف `gpt-5.5` بينما
    يكون الحساب مصادقًا عليه، فإن OpenClaw ينشئ صف نموذج OAuth هذا بحيث
    لا تفشل عمليات Cron والوكيل الفرعي والنموذج الافتراضي المضبوط مع
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة خادم تطبيق Codex الأصلية

تستخدم حزمة خادم تطبيق Codex الأصلية مراجع نماذج `openai/*` مع إعداد تشغيل محذوف
أو مع المزوّد/النموذج `agentRuntime.id: "codex"`، لكن مصادقتها لا تزال
قائمة على الحساب. يختار OpenClaw
المصادقة بهذا الترتيب:

1. ملف تعريف مصادقة `openai-codex` صريح في OpenClaw مرتبط بالوكيل.
2. حساب خادم التطبيق الحالي، مثل تسجيل دخول ChatGPT محلي عبر Codex CLI.
3. لإطلاقات خادم التطبيق المحلية عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما يبلغ خادم التطبيق عن عدم وجود حساب وما يزال يتطلب
   مصادقة OpenAI.

هذا يعني أن تسجيل دخول اشتراك ChatGPT/Codex المحلي لا يُستبدل فقط
لأن عملية Gateway لديها أيضًا `OPENAI_API_KEY` لنماذج OpenAI المباشرة
أو التضمينات. احتياطي مفتاح API عبر البيئة هو فقط لمسار stdio المحلي بلا حساب؛
ولا يُرسل إلى اتصالات خادم التطبيق عبر WebSocket. عند تحديد ملف تعريف Codex
بنمط الاشتراك، يُبقي OpenClaw أيضًا `CODEX_API_KEY` و`OPENAI_API_KEY`
خارج عملية خادم التطبيق الفرعية عبر stdio ويرسل بيانات الاعتماد المحددة
عبر RPC تسجيل دخول خادم التطبيق.

## توليد الصور

يسجّل Plugin `openai` المضمّن توليد الصور عبر أداة `image_generate`.
وهو يدعم توليد الصور باستخدام مفتاح API من OpenAI وتوليد الصور عبر OAuth في Codex
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| القدرة                | مفتاح API من OpenAI                     | OAuth في Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع النموذج                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| المصادقة                      | `OPENAI_API_KEY`                   | تسجيل دخول OpenAI Codex OAuth           |
| النقل                 | OpenAI Images API                  | خلفية Codex Responses              |
| الحد الأقصى للصور لكل طلب    | 4                                  | 4                                    |
| وضع التحرير                 | مفعّل (حتى 5 صور مرجعية) | مفعّل (حتى 5 صور مرجعية)   |
| تجاوزات الحجم            | مدعومة، بما في ذلك أحجام 2K/4K   | مدعومة، بما في ذلك أحجام 2K/4K     |
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

`gpt-image-2` هو الافتراضي لكل من توليد الصور من النص في OpenAI
وتحرير الصور. تظل `gpt-image-1.5` و`gpt-image-1` و`gpt-image-1-mini` قابلة للاستخدام
كتجاوزات صريحة للنموذج. استخدم `openai/gpt-image-1.5` لمخرجات
PNG/WebP بخلفية شفافة؛ ترفض API الحالية لـ `gpt-image-2`
`background: "transparent"`.

لطلب خلفية شفافة، ينبغي للوكلاء استدعاء `image_generate` مع
`model: "openai/gpt-image-1.5"` و`outputFormat: "png"` أو `"webp"` و
`background: "transparent"`؛ لا يزال خيار المزوّد الأقدم `openai.background`
مقبولًا. يحمي OpenClaw أيضًا مسارات OpenAI العامة و
OpenAI Codex OAuth بإعادة كتابة طلبات الشفافية الافتراضية `openai/gpt-image-2`
إلى `gpt-image-1.5`؛ تحتفظ نقاط النهاية المتوافقة مع OpenAI المخصصة وAzure
بأسماء النشر/النموذج المضبوطة لديها.

الإعداد نفسه متاح لعمليات CLI دون واجهة:

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
يظل `--openai-background` متاحًا كاسم بديل خاص بـ OpenAI.

لتثبيتات OAuth في Codex، أبقِ المرجع نفسه `openai/gpt-image-2`. عند إعداد
ملف تعريف OAuth باسم `openai-codex`، يحل OpenClaw رمز وصول OAuth المخزن ذلك
ويرسل طلبات الصور عبر خلفية Codex Responses. وهو
لا يحاول أولًا استخدام `OPENAI_API_KEY` ولا يعود بصمت إلى مفتاح API لذلك
الطلب. اضبط `models.providers.openai` صراحةً باستخدام مفتاح API،
أو عنوان URL أساسي مخصص، أو نقطة نهاية Azure عندما تريد مسار OpenAI Images API
المباشر بدلًا من ذلك.
إذا كانت نقطة نهاية الصور المخصصة هذه على عنوان LAN/خاص موثوق، فاضبط أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ يبقي OpenClaw
نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محظورة ما لم يكن هذا الاشتراك
موجودًا.

أنشئ:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

أنشئ PNG شفافًا:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

حرّر:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## توليد الفيديو

يسجّل Plugin `openai` المضمّن توليد الفيديو عبر أداة `video_generate`.

| القدرة       | القيمة                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي    | `openai/sora-2`                                                                   |
| الأوضاع            | من نص إلى فيديو، من صورة إلى فيديو، تحرير فيديو واحد                                  |
| مدخلات مرجعية | صورة واحدة أو فيديو واحد                                                                |
| تجاوزات الحجم   | مدعومة                                                                         |
| تجاوزات أخرى  | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة |

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

يضيف OpenClaw مساهمة موجه GPT-5 مشتركة لعمليات عائلة GPT-5 عبر المزوّدين. وهي تُطبّق حسب معرّف النموذج، لذلك تتلقى `openai/gpt-5.5`، والمراجع القديمة قبل الإصلاح مثل `openai-codex/gpt-5.5`، و`openrouter/openai/gpt-5.5`، و`opencode/gpt-5.5`، ومراجع GPT-5 المتوافقة الأخرى التراكب نفسه. لا ينطبق ذلك على نماذج GPT-4.x الأقدم.

تستخدم حزمة Codex الأصلية المضمّنة سلوك GPT-5 نفسه وتراكب Heartbeat عبر تعليمات مطور خادم تطبيق Codex، لذا تحافظ جلسات `openai/gpt-5.x` الموجهة عبر Codex على إرشادات المتابعة الاستباقية وHeartbeat نفسها، حتى وإن كان Codex يملك بقية موجه الحزمة.

تضيف مساهمة GPT-5 عقد سلوك موسوما لاستمرارية الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوصات الإكمال، والتحقق. يبقى سلوك الردود الخاصة بالقناة والرسائل الصامتة في مطالبة النظام المشتركة في OpenClaw وسياسة التسليم الصادر. إرشادات GPT-5 مفعّلة دائما للنماذج المطابقة. طبقة أسلوب التفاعل الودّي منفصلة وقابلة للتكوين.

| القيمة                 | التأثير                                    |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (الافتراضي) | تفعيل طبقة أسلوب التفاعل الودّي |
| `"on"`                 | اسم بديل لـ `"friendly"`                      |
| `"off"`                | تعطيل طبقة الأسلوب الودّي فقط       |

<Tabs>
  <Tab title="التكوين">
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
لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ كمسار توافق احتياطي عندما لا يكون إعداد `agents.defaults.promptOverlays.gpt5.personality` المشترك مضبوطا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="توليف الكلام (TTS)">
    يسجّل Plugin `openai` المضمّن توليف الكلام لسطح `messages.tts`.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير معيّن) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير معيّن، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يعود احتياطيا إلى `OPENAI_API_KEY` |
    | عنوان URL الأساسي | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | جسم الطلب الإضافي | `messages.tts.providers.openai.extraBody` / `extra_body` | (غير معيّن) |

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
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز عنوان URL الأساسي لـ TTS دون التأثير في نقطة نهاية واجهة API للدردشة. لا يزال OpenAI TTS مكوّنا عبر مفتاح API؛ وللرد الصوتي المباشر المعتمد على OAuth فقط، استخدم مسار الصوت Realtime بدلا من كلام STT -> TTS في وضع الوكيل.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجّل Plugin `openai` المضمّن تحويل الكلام إلى نص على دفعات عبر
    سطح نسخ فهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم في OpenClaw أينما يستخدم نسخ الصوت الوارد
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

    تُمرّر تلميحات اللغة والمطالبة إلى OpenAI عند توفيرها من خلال
    تكوين وسائط الصوت المشترك أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ في الوقت الفعلي">
    يسجّل Plugin `openai` المضمّن النسخ في الوقت الفعلي لـ Plugin Voice Call.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير معيّن) |
    | المطالبة | `...openai.prompt` | (غير معيّن) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | المصادقة | `...openai.apiKey` أو `OPENAI_API_KEY` أو OAuth `openai-codex` | تتصل مفاتيح API مباشرة؛ ويصدر OAuth سرا لعميل نسخ Realtime |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). عند تكوين OAuth `openai-codex` فقط، يصدر Gateway سرا مؤقتا لعميل نسخ Realtime قبل فتح WebSocket. مزوّد البث هذا مخصص لمسار النسخ في الوقت الفعلي في Voice Call؛ يسجّل صوت Discord حاليا مقاطع قصيرة ويستخدم بدلا من ذلك مسار نسخ الدفعات `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت في الوقت الفعلي">
    يسجّل Plugin `openai` المضمّن الصوت في الوقت الفعلي لـ Plugin Voice Call.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة (جسر نشر Azure) | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | حشو البادئة | `...openai.prefixPaddingMs` | `300` |
    | جهد الاستدلال | `...openai.reasoningEffort` | (غير معيّن) |
    | المصادقة | `...openai.apiKey` أو `OPENAI_API_KEY` أو OAuth `openai-codex` | يمكن لـ Browser Talk وجسور الخلفية غير التابعة لـ Azure استخدام OAuth الخاص بـ Codex |

    أصوات Realtime المضمّنة المتاحة لـ `gpt-realtime-2`: `alloy`، `ash`،
    `ballad`، `coral`، `echo`، `sage`، `shimmer`، `verse`، `marin`، `cedar`.
    توصي OpenAI بـ `marin` و`cedar` للحصول على أفضل جودة Realtime. هذه
    مجموعة منفصلة عن أصوات تحويل النص إلى كلام أعلاه؛ لا تفترض أن صوت TTS
    مثل `fable` أو `nova` أو `onyx` صالح لجلسات Realtime.

    <Note>
    تستخدم جسور OpenAI Realtime الخلفية شكل جلسة WebSocket Realtime العام، والذي لا يقبل `session.temperature`. تظل عمليات نشر Azure OpenAI متاحة عبر `azureEndpoint` و`azureDeployment` وتحتفظ بشكل الجلسة المتوافق مع النشر. يدعم ذلك استدعاء الأدوات ثنائي الاتجاه وصوت G.711 u-law.
    </Note>

    <Note>
    يتم اختيار صوت Realtime عند إنشاء الجلسة. تسمح OpenAI بتغيير معظم
    حقول الجلسة لاحقا، لكن لا يمكن تغيير الصوت بعد أن يصدر النموذج صوتا في
    تلك الجلسة. يعرّض OpenClaw حاليا معرّفات أصوات Realtime المضمّنة كسلاسل.
    </Note>

    <Note>
    يستخدم Control UI Talk جلسات Realtime في المتصفح من OpenAI مع سر عميل
    مؤقت يصدره Gateway وتبادل WebRTC SDP مباشرا من المتصفح مقابل
    OpenAI Realtime API. عندما لا يكون هناك مفتاح OpenAI API مباشر مكوّن، يمكن لـ
    Gateway إصدار سر العميل هذا باستخدام ملف تعريف OAuth `openai-codex`
    المحدد. تستخدم جسور WebSocket Realtime الخلفية في Gateway relay وVoice Call
    مسار OAuth الاحتياطي نفسه لنقاط نهاية OpenAI الأصلية. يتوفر التحقق المباشر
    للمشرفين باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    تتحقق أرجل OpenAI من كل من جسر WebSocket الخلفي وتبادل
    WebRTC SDP في المتصفح دون تسجيل الأسرار.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لمزوّد `openai` المضمّن استهداف مورد Azure OpenAI لتوليد الصور
عن طريق تجاوز عنوان URL الأساسي. في مسار توليد الصور، يكتشف OpenClaw
أسماء مضيفي Azure في `models.providers.openai.baseUrl` ويتحول إلى
شكل طلب Azure تلقائيا.

<Note>
يستخدم الصوت في الوقت الفعلي مسار تكوين منفصلا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **الصوت في
الوقت الفعلي** ضمن [الصوت والكلام](#voice-and-speech) لإعدادات Azure
الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- يكون لديك بالفعل اشتراك Azure OpenAI أو حصة أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال توفرها Azure
- تريد إبقاء حركة المرور داخل مستأجر Azure قائم

### التكوين

لتوليد الصور عبر Azure باستخدام مزوّد `openai` المضمّن، وجّه
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

يتعرف OpenClaw على لاحقات مضيف Azure هذه لمسار توليد الصور في Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

لطلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلا من `Authorization: Bearer`
- يستخدم مسارات محددة بالنشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب
- يستخدم مهلة طلب افتراضية قدرها 600 ثانية لاستدعاءات توليد الصور في Azure.
  ولا تزال قيم `timeoutMs` لكل استدعاء تتجاوز هذا الافتراضي.

تحتفظ عناوين URL الأساسية الأخرى (OpenAI العام، والوكلاء المتوافقون مع OpenAI)
بشكل طلب صور OpenAI القياسي.

<Note>
يتطلب توجيه Azure لمسار توليد الصور في مزوّد `openai`
إصدار OpenClaw 2026.4.22 أو أحدث. تتعامل الإصدارات الأقدم مع أي
`openai.baseUrl` مخصص مثل نقطة نهاية OpenAI العامة وستفشل مع عمليات نشر
الصور في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار معاينة Azure محدد أو إصدار GA
لمسار توليد الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

الافتراضي هو `2024-12-01-preview` عندما لا يكون المتغير معيّنا.

### أسماء النماذج هي أسماء النشر

تربط Azure OpenAI النماذج بعمليات النشر. بالنسبة لطلبات توليد الصور في Azure
الموجّهة عبر مزوّد `openai` المضمّن، يجب أن يكون حقل `model` في OpenClaw
هو **اسم نشر Azure** الذي كوّنته في بوابة Azure، وليس معرّف نموذج OpenAI
العام.

إذا أنشأت نشرا باسم `gpt-image-2-prod` يقدّم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجّهة عبر
مزوّد `openai` المضمّن.

### التوفر الإقليمي

توليد الصور في Azure متاح حاليا في مجموعة فرعية فقط من المناطق
(على سبيل المثال `eastus2` و`swedencentral` و`polandcentral` و`westus3`
و`uaenorth`). تحقق من قائمة مناطق Microsoft الحالية قبل إنشاء
نشر، وتأكد من توفر النموذج المحدد في منطقتك.

### اختلافات المعلمات

لا تقبل Azure OpenAI وOpenAI العامة دائما معلمات الصور نفسها.
قد ترفض Azure خيارات تسمح بها OpenAI العامة (على سبيل المثال بعض قيم
`background` في `gpt-image-2`) أو تعرضها فقط على إصدارات نماذج محددة.
تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من OpenClaw.
إذا فشل طلب Azure بخطأ تحقق، فتحقق من مجموعة المعلمات التي يدعمها
نشرك المحدد وإصدار API في بوابة Azure.

<Note>
يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق لكنه لا يتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع أكورديون **المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI**
ضمن [التكوين المتقدم](#advanced-configuration).

لحركة المحادثات أو Responses على Azure (بخلاف توليد الصور)، استخدم
تدفق التهيئة الأولية أو تكوين مزود Azure مخصصًا — لا يلتقط `openai.baseUrl` وحده
شكل واجهة Azure API أو المصادقة. يوجد مزود منفصل
`azure-openai-responses/*`؛ راجع أكورديون Compaction من جهة الخادم أدناه.
</Note>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw أسلوب WebSocket أولًا مع الرجوع إلى SSE (`"auto"`) لـ `openai/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع إلى SSE
    - بعد حدوث فشل، يضع علامة على WebSocket بأنه متدهور لمدة ~60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات ثابتة لهوية الجلسة والدور لإعادة المحاولة وإعادة الاتصال
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
          },
        },
      },
    }
    ```

    مستندات OpenAI ذات الصلة:
    - [Realtime API مع WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [استجابات Streaming API ‏(SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="الوضع السريع">
    يوفّر OpenClaw مفتاح تبديل مشتركًا للوضع السريع لـ `openai/*`:

    - **المحادثة/واجهة المستخدم:** `/fast status|on|off`
    - **التكوين:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند تمكينه، يربط OpenClaw الوضع السريع بمعالجة الأولوية في OpenAI (`service_tier = "priority"`). تُحفظ قيم `service_tier` الموجودة، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

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
    تتغلب تجاوزات الجلسة على التكوين. تؤدي إزالة تجاوز الجلسة في واجهة Sessions إلى إعادة الجلسة إلى الافتراضي المكوّن.
    </Note>

  </Accordion>

  <Accordion title="معالجة الأولوية (service_tier)">
    توفّر واجهة OpenAI API معالجة الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

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
    لا يُمرَّر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجّهت أيًا من المزودين عبر وكيل، يترك OpenClaw `service_tier` دون تغيير.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جهة الخادم (Responses API)">
    بالنسبة لنماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل غلاف تدفق Pi-harness الخاص بـ Plugin OpenAI تلقائيًا Compaction من جهة الخادم:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` الافتراضية: 70% من `contextWindow` (أو `80000` عند عدم توفرها)

    ينطبق هذا على مسار Pi harness المدمج وعلى خطافات مزود OpenAI المستخدمة بواسطة عمليات التشغيل المضمّنة. يدير مشغّل خادم تطبيق Codex الأصلي سياقه الخاص عبر Codex ويُكوَّن بواسطة مسار وكيل OpenAI الافتراضي أو سياسة تشغيل المزود/النموذج.

    <Tabs>
      <Tab title="التمكين صراحة">
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
    بالنسبة لعمليات تشغيل عائلة GPT-5 على `openai/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

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
    - لم يعد يتعامل مع دور يقتصر على الخطة على أنه تقدم ناجح عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدور بتوجيه للتصرف الآن
    - يفعّل `update_plan` تلقائيًا للأعمال الكبيرة
    - يعرض حالة حظر صريحة إذا استمر النموذج في التخطيط دون تنفيذ

    <Note>
    يقتصر ذلك على عمليات تشغيل عائلة GPT-5 الخاصة بـ OpenAI وCodex فقط. يحتفظ المزودون الآخرون وعائلات النماذج الأقدم بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI وCodex وAzure OpenAI المباشرة بشكل مختلف عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - تحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI `none`
    - تحذف التعليل المعطل للنماذج أو الوكلاء الذين يرفضون `reasoning.effort: "none"`
    - تضبط مخططات الأدوات افتراضيًا على الوضع الصارم
    - ترفق ترويسات الإسناد المخفية على المضيفين الأصليين الموثقين فقط
    - تحتفظ بتشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier`، `store`، توافق التعليل، تلميحات ذاكرة التخزين المؤقت للموجهات)

    **مسارات الوكيل/المسارات المتوافقة:**
    - تستخدم سلوك توافق أكثر مرونة
    - تزيل `store` الخاصة بـ Completions من حمولات `openai-completions` غير الأصلية
    - تقبل تمرير JSON المتقدم عبر `params.extra_body`/`params.extraBody` لوكلاء Completions المتوافقين مع OpenAI
    - تقبل `params.chat_template_kwargs` لوكلاء Completions المتوافقين مع OpenAI مثل vLLM
    - لا تفرض مخططات الأدوات الصارمة أو الترويسات الأصلية فقط

    يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق لكنه لا يتلقى ترويسات الإسناد المخفية.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزود.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزود.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
