---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T08:08:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

توفّر OpenAI واجهات API للمطوّرين لنماذج GPT، كما يتوفر Codex أيضًا كوكيل برمجة ضمن خطة
ChatGPT من خلال عملاء Codex لدى OpenAI. يستخدم OpenClaw
معرّف مزوّد واحدًا، `openai`، لكلا شكلي المصادقة.

يستخدم OpenClaw المسار `openai/*` بصفته مسار نموذج OpenAI القياسي. تعمل أدوار الوكيل
المضمّنة على نماذج OpenAI عبر وقت تشغيل خادم تطبيق Codex الأصلي
افتراضيًا؛ وتظل مصادقة مفتاح API المباشرة من OpenAI متاحة لأسطح OpenAI غير الوكيلة
مثل الصور، والتضمينات، والكلام، والزمن الحقيقي.

- **نماذج الوكيل** - نماذج `openai/*` عبر وقت تشغيل Codex؛ سجّل الدخول باستخدام
  مصادقة Codex لاستخدام اشتراك ChatGPT/Codex، أو اضبط ملفًا احتياطيًا متوافقًا مع Codex
  لمفتاح API من OpenAI عندما تريد عمدًا استخدام مصادقة مفتاح API.
- **واجهات API من OpenAI غير الوكيلة** - وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام
  عبر `OPENAI_API_KEY` أو إعداد مفتاح API من OpenAI.
- **الإعدادات القديمة** - تُصلَح مراجع نماذج Codex القديمة بواسطة
  `openclaw doctor --fix` إلى `openai/*` بالإضافة إلى وقت تشغيل Codex.

تدعم OpenAI صراحةً استخدام OAuth للاشتراكات في أدوات وسير عمل خارجية مثل OpenClaw.

المزوّد، والنموذج، ووقت التشغيل، والقناة طبقات منفصلة. إذا كانت هذه التسميات
تختلط معًا، فاقرأ [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes) قبل
تغيير الإعدادات.

## الاختيار السريع

| الهدف                                                 | استخدم                                                      | ملاحظات                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي | `openai/gpt-5.5`                                         | إعداد وكيل OpenAI الافتراضي. سجّل الدخول باستخدام مصادقة Codex.                  |
| معاينة محدودة لـ GPT-5.6                              | `openai/gpt-5.6-sol`, `-terra`, أو `-luna`               | تتطلب مؤسسة API معتمدة من OpenAI أو مساحة عمل Codex.      |
| فوترة مباشرة بمفتاح API لنماذج الوكيل              | `openai/gpt-5.5` بالإضافة إلى ملف مفتاح API متوافق مع Codex | استخدم `auth.order.openai` لوضع النسخة الاحتياطية بعد مصادقة الاشتراك.  |
| فوترة مباشرة بمفتاح API عبر OpenClaw صريح     | `openai/gpt-5.5` بالإضافة إلى وقت تشغيل المزوّد/النموذج `openclaw`  | اختر ملف مفتاح API عاديًا لـ `openai`.                             |
| أحدث اسم بديل لـ ChatGPT Instant API                     | `openai/chat-latest`                                     | مفتاح API مباشر فقط. اسم بديل متحرك للتجارب، وليس الإعداد الافتراضي.   |
| مصادقة اشتراك ChatGPT/Codex عبر OpenClaw     | `openai/gpt-5.5` بالإضافة إلى وقت تشغيل المزوّد/النموذج `openclaw`  | اختر ملف OAuth لـ `openai` لمسار التوافق.         |
| إنشاء الصور أو تعديلها                          | `openai/gpt-image-2`                                     | يعمل إما مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.             |
| صور بخلفية شفافة                        | `openai/gpt-image-1.5`                                   | استخدم `outputFormat=png` أو `webp` و`openai.background=transparent`. |

## خريطة التسمية

الأسماء متشابهة لكنها غير قابلة للتبادل:

| الاسم الذي تراه                            | الطبقة             | المعنى                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | بادئة المزوّد   | مسار نموذج OpenAI القياسي؛ تستخدم أدوار الوكيل وقت تشغيل Codex.                                  |
| بادئة OpenAI Codex القديمة              | بادئة قديمة     | مساحة أسماء أقدم للنموذج/الملف. ينقلها `openclaw doctor --fix` إلى `openai`.                   |
| `codex` plugin                          | Plugin            | Plugin مضمّن في OpenClaw يوفّر وقت تشغيل خادم تطبيق Codex الأصلي وعناصر تحكم الدردشة `/codex`. |
| `agentRuntime.id: codex` للمزوّد/النموذج | وقت تشغيل الوكيل     | يفرض حزمة خادم تطبيق Codex الأصلية للأدوار المضمّنة المطابقة.                            |
| `/codex ...`                            | مجموعة أوامر الدردشة  | ربط/التحكم في سلاسل خادم تطبيق Codex من محادثة.                                        |
| `runtime: "acp", agentId: "codex"`      | مسار جلسة ACP | مسار احتياطي صريح يشغّل Codex عبر ACP/acpx.                                          |

يعني هذا أن الإعدادات يمكن أن تحتوي عمدًا على مراجع نماذج `openai/*` بينما تشير ملفات
المصادقة إما إلى بيانات اعتماد مفتاح API أو بيانات اعتماد ChatGPT/Codex OAuth. استخدم
`auth.order.openai` للإعدادات؛ يعيد `openclaw doctor --fix` كتابة مراجع نماذج Codex القديمة،
ومعرّفات ملفات مصادقة Codex القديمة، وترتيب مصادقة Codex القديم
إلى مسار OpenAI القياسي.

<Note>
يتوفر GPT-5.5 عبر كل من الوصول المباشر بمفتاح API إلى OpenAI Platform
ومسارات الاشتراك/OAuth. لاشتراك ChatGPT/Codex بالإضافة إلى تنفيذ Codex الأصلي،
استخدم `openai/gpt-5.5`؛ يختار إلغاء ضبط إعدادات وقت التشغيل الآن حزمة Codex
لأدوار وكيل OpenAI. استخدم ملفات مفتاح API من OpenAI فقط عندما تريد
مصادقة مباشرة بمفتاح API لنموذج وكيل OpenAI.
</Note>

## معاينة محدودة لـ GPT-5.6

يتعرّف OpenClaw على معرّفات نماذج GPT-5.6 العامة الثلاثة:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

تعرض النماذج الثلاثة جميعها استدلال `max` في كتالوج خادم تطبيق Codex الحالي. يصف
إعلان الإطلاق من OpenAI نموذج Sol بأنه المستوى الرائد، وTerra بأنه
المستوى المتوازن، وLuna بأنه المستوى السريع الأقل تكلفة. راجع
[إعلان إطلاق GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
و[دليل الوصول إلى المعاينة](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

يكون الوصول مدرجًا في قائمة سماح أثناء المعاينة، ويمكن منحه بشكل منفصل لكل من
API وCodex. لا تمنح خطة ChatGPT مدفوعة وحدها حق الوصول. يُبقي OpenClaw
`openai/gpt-5.5` كإعداد افتراضي؛ ويؤدي اختيار مرجع GPT-5.6 بدون وصول إلى إرجاع
خطأ الوصول من المصدر بدلًا من الرجوع بصمت.

<Note>
تتطلب أدوار نماذج وكيل OpenAI Plugin خادم تطبيق Codex المضمّن. تظل
إعدادات وقت تشغيل OpenClaw الصريحة متاحة كمسار توافق اختياري. عندما يتم
اختيار OpenClaw صراحةً مع ملف OAuth لـ `openai`، يُبقي OpenClaw
مرجع النموذج العام على هيئة `openai/*` ويوجّه داخليًا عبر نقل مصادقة Codex.
شغّل `openclaw doctor --fix` لإصلاح مراجع نماذج Codex القديمة الراكدة،
أو `codex-cli/*`، أو تثبيتات جلسات وقت التشغيل القديمة التي لا تأتي من
إعدادات وقت تشغيل صريحة.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI         | سطح OpenClaw                                                                              | الحالة                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| الدردشة / Responses          | مزوّد نموذج `openai/<model>`                                                               | نعم                                                                    |
| نماذج اشتراك Codex | `openai/<model>` مع OpenAI OAuth                                                            | نعم                                                                    |
| مراجع نماذج Codex القديمة   | مراجع نماذج Codex القديمة أو `codex-cli/<model>`                                                | يصلحها doctor إلى `openai/<model>`                                 |
| حزمة خادم تطبيق Codex  | `openai/<model>` مع حذف وقت التشغيل أو `agentRuntime.id: codex` للمزوّد/النموذج              | نعم                                                                    |
| بحث الويب من جانب الخادم    | أداة OpenAI Responses الأصلية                                                                  | نعم، عندما يكون بحث الويب مفعّلًا ولا يوجد مزوّد مثبت                 |
| الصور                    | `image_generate`                                                                              | نعم                                                                    |
| الفيديوهات                    | `video_generate`                                                                              | نعم                                                                    |
| تحويل النص إلى كلام            | `messages.tts.provider: "openai"` / `tts`                                                     | نعم                                                                    |
| تحويل الكلام إلى نص دفعي      | `tools.media.audio` / فهم الوسائط                                                     | نعم                                                                    |
| تحويل الكلام إلى نص بالتدفق  | Voice Call `streaming.provider: "openai"`                                                     | نعم                                                                    |
| الصوت بالزمن الحقيقي            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | نعم (يتطلب أرصدة OpenAI Platform، وليس اشتراك Codex/ChatGPT) |
| التضمينات                | مزوّد تضمينات الذاكرة                                                                     | نعم                                                                    |

<Note>
  يمر صوت OpenAI Realtime (المستخدم بواسطة `realtime.provider: "openai"` في Voice Call و
  Control UI Talk مع `talk.realtime.provider: "openai"`) عبر
  **OpenAI Platform Realtime API** العامة، التي تُفوْتَر على أرصدة OpenAI
  Platform بدلًا من حصة اشتراك Codex/ChatGPT. الحساب
  الذي يمتلك OpenAI OAuth سليمة وتشغّل نماذج دردشة مدعومة بـ Codex بدون مشكلة
  لا يزال يحتاج إلى ملف مصادقة بمفتاح API من OpenAI أو مفتاح API من Platform مع فوترة
  Platform ممولة للصوت بالزمن الحقيقي.

الإصلاح: أضف رصيدًا إلى أرصدة Platform في
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
للمؤسسة التي تدعم بيانات اعتمادك للزمن الحقيقي. يقبل الصوت بالزمن الحقيقي
ملف مصادقة مفتاح API لـ `openai` الذي أنشأه `openclaw onboard --auth-choice openai-api-key`،
أو `OPENAI_API_KEY` من Platform مضبوطًا عبر `talk.realtime.providers.openai.apiKey`
لـ Control UI Talk، أو `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
لـ Voice Call، أو متغير البيئة `OPENAI_API_KEY`. لا تزال ملفات OpenAI OAuth
قادرة على تشغيل نماذج دردشة `openai/*` المدعومة بـ Codex في تثبيت OpenClaw نفسه،
لكنها لا تضبط الصوت بالزمن الحقيقي.
</Note>

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

بالنسبة إلى نقاط النهاية المتوافقة مع OpenAI التي تتطلب تسميات تضمين غير متماثلة، اضبط
`queryInputType` و`documentInputType` ضمن `memorySearch`. يمرّر OpenClaw
هذه القيم كحقول طلب `input_type` خاصة بالمزوّد: تستخدم تضمينات الاستعلام
`queryInputType`؛ وتستخدم مقاطع الذاكرة المفهرسة والفهرسة الدُفعية
`documentInputType`. راجع [مرجع إعدادات الذاكرة](/ar/reference/memory-config#provider-specific-config) للاطلاع على المثال الكامل.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [لوحة معلومات OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرّر المفتاح مباشرة:

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
    | `openai/gpt-5.5`      | محذوف / مزود/نموذج `agentRuntime.id: "codex"` | حزمة تشغيل app-server الخاصة بـ Codex | ملف OpenAI متوافق مع Codex |
    | `openai/gpt-5.4-mini` | محذوف / مزود/نموذج `agentRuntime.id: "codex"` | حزمة تشغيل app-server الخاصة بـ Codex | ملف OpenAI متوافق مع Codex |
    | `openai/gpt-5.5`      | مزود/نموذج `agentRuntime.id: "openclaw"`              | وقت تشغيل OpenClaw المضمّن      | ملف `openai` المحدد |

    <Note>
    تستخدم نماذج الوكيل `openai/*` حزمة تشغيل app-server الخاصة بـ Codex. لاستخدام
    مصادقة مفتاح API لنموذج وكيل، أنشئ ملف مفتاح API متوافقا مع Codex ورتبه
    باستخدام `auth.order.openai`؛ يبقى `OPENAI_API_KEY` الاحتياطي المباشر لأسطح
    OpenAI API غير الخاصة بالوكلاء. شغل `openclaw doctor --fix` لترحيل إدخالات
    ترتيب مصادقة Codex القديمة.
    </Note>

    ### مثال إعداد

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    لتجربة نموذج Instant الحالي في ChatGPT من OpenAI API، اضبط النموذج
    على `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` اسم مستعار متحرك. توثقه OpenAI على أنه أحدث نموذج Instant
    مستخدم في ChatGPT وتوصي بـ `gpt-5.5` لاستخدام API في الإنتاج، لذلك
    أبق `openai/gpt-5.5` كإعداد افتراضي مستقر ما لم تكن تريد صراحة
    سلوك ذلك الاسم المستعار. يقبل الاسم المستعار حاليا إسهاب نص `medium` فقط، لذلك
    يطبع OpenClaw تجاوزات إسهاب نص OpenAI غير المتوافقة لهذا
    النموذج.

    <Warning>
    لا يعرّض OpenClaw **`gpt-5.3-codex-spark`** على مسار مفتاح OpenAI API المباشر. لا يتوفر إلا عبر إدخالات كتالوج اشتراك Codex عندما يعرّضه حسابك المسجل دخوله.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex لديك مع تنفيذ app-server الأصلي لـ Codex بدلا من مفتاح API منفصل. تتطلب سحابة Codex تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        أو شغل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai
        ```

        للإعدادات بلا واجهة أو التي لا تلائم الاستدعاء الراجع، أضف `--device-code` لتسجيل الدخول بتدفق رمز جهاز ChatGPT بدلا من استدعاء المتصفح الراجع على localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        لا يلزم إعداد وقت تشغيل للمسار الافتراضي. تختار دورات وكيل OpenAI
        وقت تشغيل app-server الأصلي لـ Codex تلقائيا، ويثبت OpenClaw
        Plugin Codex المضمن أو يصلحه عند اختيار هذا المسار.
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai
        ```

        بعد تشغيل Gateway، أرسل `/codex status` أو `/codex models`
        في الدردشة للتحقق من وقت تشغيل app-server الأصلي.
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | إعداد وقت التشغيل | المسار | المصادقة |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | محذوف / مزود/نموذج `agentRuntime.id: "codex"` | حزمة تشغيل app-server الأصلية لـ Codex | تسجيل دخول Codex أو ملف مصادقة `openai` مرتب |
    | `openai/gpt-5.5` | مزود/نموذج `agentRuntime.id: "openclaw"` | وقت تشغيل OpenClaw المضمن مع نقل مصادقة Codex داخلي | ملف OAuth `openai` المحدد |
    | مرجع Codex GPT-5.5 القديم | يصلحه doctor | يعاد كتابة المسار القديم إلى `openai/gpt-5.5` | ملف OAuth OpenAI مرحل |
    | `codex-cli/gpt-5.5` | يصلحه doctor | يعاد كتابة مسار CLI القديم إلى `openai/gpt-5.5` | مصادقة app-server الخاصة بـ Codex |

    <Warning>
    فضّل `openai/gpt-5.5` لإعداد وكيل جديد مدعوم باشتراك. مراجع
    Codex GPT القديمة هي مسارات OpenClaw قديمة، وليست مسار وقت تشغيل Codex الأصلي؛
    شغل `openclaw doctor --fix` عندما تريد ترحيلها إلى مراجع
    `openai/*` القياسية. يبقى `gpt-5.3-codex-spark` محدودا بالحسابات التي
    يعلن كتالوج اشتراك Codex فيها عن ذلك النموذج؛ وتظل مراجع مفتاح OpenAI API المباشر و
    Azure الخاصة به محجوبة.
    </Warning>

    <Note>
    بادئة نموذج Codex القديمة هي إعداد قديم يصلحه doctor. لإعداد
    الاشتراك الشائع مع وقت التشغيل الأصلي، سجّل الدخول بمصادقة Codex
    لكن أبق مرجع النموذج `openai/gpt-5.5`. ينبغي أن يضع الإعداد الجديد ترتيب
    مصادقة وكيل OpenAI تحت `auth.order.openai`؛ ويرحل doctor إدخالات
    ترتيب مصادقة Codex القديمة.
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

    مع نسخة احتياطية بمفتاح API، أبق النموذج على `openai/gpt-5.5` وضع
    ترتيب المصادقة تحت `openai`. سيجرب OpenClaw الاشتراك أولا، ثم
    مفتاح API، مع البقاء على حزمة تشغيل Codex:

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    لم يعد الإعداد الأولي يستورد مادة OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكيل الخاص به.
    </Note>

    ### فحص مسار Codex OAuth واستعادته

    استخدم هذه الأوامر لمعرفة النموذج ووقت التشغيل ومسار المصادقة التي يستخدمها وكيلك
    الافتراضي:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    لوكيل محدد، أضف `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    إذا كان إعداد أقدم لا يزال يحتوي على مراجع Codex GPT قديمة أو تثبيت جلسة وقت تشغيل
    OpenAI عتيق دون إعداد وقت تشغيل صريح، فأصلحه:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    إذا أظهر `models auth list --provider openai` عدم وجود ملف قابل للاستخدام، فسجّل
    الدخول مرة أخرى:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    استخدم `--profile-id` عندما تريد عدة تسجيلات دخول Codex OAuth في الوكيل نفسه
    وتريد لاحقا التحكم بها عبر ترتيب المصادقة أو `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` هو مسار النموذج لدورات وكيل OpenAI عبر Codex. شغل
    `openclaw doctor --fix` لترحيل معرفات ملفات بادئة OpenAI Codex القديمة
    وإدخالات الترتيب قبل الاعتماد على ترتيب الملفات.

    ### مؤشر الحالة

    تعرض دردشة `/status` وقت تشغيل النموذج النشط للجلسة الحالية.
    تظهر حزمة تشغيل app-server المضمنة لـ Codex باسم `Runtime: OpenAI Codex` في
    دورات نموذج وكيل OpenAI. تصلح تثبيتات جلسة وقت تشغيل OpenAI العتيقة إلى Codex ما لم
    يثبت الإعداد OpenClaw صراحة.

    ### تحذير doctor

    إذا بقيت مراجع نماذج Codex القديمة أو تثبيتات وقت تشغيل OpenAI العتيقة في الإعداد أو
    حالة الجلسة، يعيد `openclaw doctor --fix` كتابتها إلى `openai/*` مع
    وقت تشغيل Codex ما لم يكن OpenClaw معدا صراحة.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات النموذج الوصفية وحد سياق وقت التشغيل كقيم منفصلة.

    بالنسبة إلى `openai/gpt-5.5` عبر كتالوج Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - حد `contextTokens` الافتراضي لوقت التشغيل: `272000`

    للحد الافتراضي الأصغر خصائص أفضل في زمن الاستجابة والجودة عمليا. تجاوزه باستخدام `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    استخدم `contextWindow` للتصريح ببيانات النموذج الوصفية الأصلية. استخدم `contextTokens` لتحديد ميزانية سياق وقت التشغيل.
    </Note>

    ### استعادة الكتالوج

    يستخدم OpenClaw بيانات كتالوج Codex الوصفية من المصدر الأعلى لـ `gpt-5.5` عندما تكون
    موجودة. إذا أغفل اكتشاف Codex الحي صف `gpt-5.5` بينما
    الحساب موثق، ينشئ OpenClaw صف نموذج OAuth هذا لكي لا تفشل
    تشغيلات cron والوكيل الفرعي والنموذج الافتراضي المعدة برسالة
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة app-server الأصلية لـ Codex

تستخدم حزمة تشغيل app-server الأصلية لـ Codex مراجع نماذج `openai/*` مع إعداد
وقت تشغيل محذوف أو مزود/نموذج `agentRuntime.id: "codex"`، لكن مصادقتها
لا تزال مبنية على الحساب. يختار OpenClaw المصادقة بهذا الترتيب:

1. ملفات مصادقة OpenAI المرتبة للوكيل، ويفضل أن تكون تحت
   `auth.order.openai`. شغل `openclaw doctor --fix` لترحيل معرفات
   ملفات مصادقة Codex القديمة وترتيب مصادقة Codex القديم.
2. الحساب الموجود في app-server، مثل تسجيل دخول ChatGPT محلي عبر Codex CLI.
3. لإطلاقات app-server المحلية عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما يبلغ app-server عن عدم وجود حساب ولا يزال يتطلب
   مصادقة OpenAI.

يعني ذلك أن تسجيل دخول اشتراك ChatGPT/Codex المحلي لا يستبدل لمجرد
أن عملية Gateway لديها أيضا `OPENAI_API_KEY` لنماذج OpenAI المباشرة
أو التضمينات. احتياطي مفتاح API من البيئة هو فقط مسار stdio المحلي بلا حساب؛ ولا
يرسل إلى اتصالات app-server عبر WebSocket. عند تحديد ملف Codex
بنمط الاشتراك، يبقي OpenClaw أيضا `CODEX_API_KEY` و `OPENAI_API_KEY`
خارج عملية app-server الفرعية عبر stdio التي يتم تشغيلها، ويرسل بيانات الاعتماد المحددة
من خلال RPC تسجيل الدخول في app-server. عندما يحجب ملف الاشتراك ذلك بسبب
حد استخدام Codex، يستطيع OpenClaw التدوير إلى ملف مفتاح API التالي المرتب `openai:*`
دون تغيير النموذج المحدد أو الخروج من حزمة تشغيل Codex.
بعد مرور وقت إعادة ضبط الاشتراك، يصبح ملف الاشتراك مؤهلا مرة أخرى.

## توليد الصور

يسجل Plugin `openai` المضمن توليد الصور عبر أداة `image_generate`.
وهو يدعم توليد الصور بمفتاح OpenAI API وتوليد الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| القدرة                  | مفتاح OpenAI API                   | OAuth الخاص بـ Codex                 |
| ----------------------- | ---------------------------------- | ------------------------------------ |
| مرجع النموذج            | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| المصادقة                | `OPENAI_API_KEY`                   | تسجيل الدخول عبر OAuth الخاص بـ OpenAI Codex |
| النقل                   | OpenAI Images API                  | الواجهة الخلفية Codex Responses      |
| الحد الأقصى للصور لكل طلب | 4                                | 4                                    |
| وضع التحرير             | مفعّل (حتى 5 صور مرجعية)          | مفعّل (حتى 5 صور مرجعية)            |
| تجاوزات الحجم           | مدعومة، بما في ذلك أحجام 2K/4K    | مدعومة، بما في ذلك أحجام 2K/4K      |
| نسبة العرض إلى الارتفاع / الدقة | لا تُمرَّر إلى OpenAI Images API | تُطابَق مع حجم مدعوم عندما يكون ذلك آمناً |

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
راجع [توليد الصور](/ar/tools/image-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

`gpt-image-2` هو الإعداد الافتراضي لكل من توليد الصور من النص وتحرير الصور في OpenAI. تظل `gpt-image-1.5` و`gpt-image-1` و`gpt-image-1-mini` قابلة للاستخدام كتجاوزات صريحة للنموذج. استخدم `openai/gpt-image-1.5` لإخراج PNG/WebP بخلفية شفافة؛ إذ ترفض API الحالية لـ `gpt-image-2` الخيار
`background: "transparent"`.

لطلب بخلفية شفافة، ينبغي للوكلاء استدعاء `image_generate` مع
`model: "openai/gpt-image-1.5"` و`outputFormat: "png"` أو `"webp"` و
`background: "transparent"`؛ ولا يزال خيار المزوّد الأقدم `openai.background`
مقبولاً. يحمي OpenClaw أيضاً مسارات OpenAI العامة ومسارات OAuth الخاصة بـ
OpenAI Codex عبر إعادة كتابة طلبات الشفافية الافتراضية `openai/gpt-image-2`
إلى `gpt-image-1.5`؛ أما Azure ونقاط النهاية المخصصة المتوافقة مع OpenAI فتحتفظ
بأسماء النشر/النماذج المضبوطة لها.

يُعرَض الإعداد نفسه لتشغيلات CLI بلا واجهة:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

استخدم عَلَمَي `--output-format` و`--background` نفسيهما مع
`openclaw infer image edit` عند البدء من ملف إدخال.
يبقى `--openai-background` متاحاً كاسم بديل خاص بـ OpenAI.
استخدم `--quality low|medium|high|auto` عندما تحتاج إلى التحكم في جودة OpenAI Images
وتكلفتها. استخدم `--openai-moderation low|auto` لتمرير تلميح الإشراف الخاص
بالمزوّد في OpenAI من `image generate` أو `image edit`.

لتثبيتات ChatGPT/Codex OAuth، أبقِ مرجع `openai/gpt-image-2` نفسه. عندما يكون
ملف تعريف OAuth لـ `openai` مضبوطاً، يحل OpenClaw رمز وصول OAuth المخزّن ويرسل
طلبات الصور عبر الواجهة الخلفية Codex Responses. ولا يحاول أولاً استخدام
`OPENAI_API_KEY` أو الرجوع بصمت إلى مفتاح API لذلك الطلب. اضبط
`models.providers.openai` صراحةً باستخدام مفتاح API أو عنوان URL أساسي مخصص أو
نقطة نهاية Azure عندما تريد مسار OpenAI Images API المباشر بدلاً من ذلك.
إذا كانت نقطة نهاية الصور المخصصة هذه على عنوان LAN/خاص موثوق، فاضبط أيضاً
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ إذ يبقي OpenClaw
نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محظورة ما لم يكن هذا
الاشتراك الصريح موجوداً.

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
| الأوضاع          | من النص إلى الفيديو، ومن الصورة إلى الفيديو، وتحرير فيديو واحد                   |
| المُدخلات المرجعية | صورة واحدة أو فيديو واحد                                                         |
| تجاوزات الحجم    | مدعومة للنص إلى الفيديو والصورة إلى الفيديو                                      |
| تجاوزات أخرى     | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة |

تستخدم طلبات OpenAI من الصورة إلى الفيديو `POST /v1/videos` مع
`input_reference` لصورة. وتستخدم تحريرات الفيديو الواحد `POST /v1/videos/edits` مع
الفيديو المرفوع في الحقل `video`.

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
راجع [توليد الفيديو](/ar/tools/video-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## مساهمة مطالبة GPT-5

يضيف OpenClaw مساهمة مطالبة GPT-5 مشتركة لتشغيلات عائلة GPT-5 على أسطح المطالبات التي يجمّعها OpenClaw. تُطبَّق حسب معرّف النموذج، لذلك تتلقى مسارات OpenClaw/المزوّد مثل المراجع القديمة قبل الإصلاح (مرجع Codex GPT-5.5 القديم)، و`openrouter/openai/gpt-5.5`، و`opencode/gpt-5.5`، ومراجع GPT-5 المتوافقة الأخرى، الطبقة نفسها. ولا تحصل نماذج GPT-4.x الأقدم عليها.

لا يتلقى حزام Codex الأصلي المضمّن طبقة OpenClaw GPT-5 هذه عبر تعليمات المطوّر لخادم تطبيق Codex. يحتفظ Codex الأصلي بسلوك الأساس والنموذج ومستندات المشروع المملوك لـ Codex، بينما يعطّل OpenClaw الشخصية المدمجة في Codex للخيوط الأصلية بحيث تبقى ملفات شخصية مساحة عمل الوكيل هي المرجع الحاكم. لا يساهم OpenClaw إلا بسياق وقت التشغيل مثل تسليم القنوات، وأدوات OpenClaw الديناميكية، وتفويض ACP، وسياق مساحة العمل، وSkills في OpenClaw.

تضيف مساهمة GPT-5 عقد سلوك موسوماً لاستمرار الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل الإخراج، وفحوصات الاكتمال، والتحقق على مطالبات OpenClaw المجمّعة المطابقة. يبقى سلوك الرد الخاص بالقناة والرسائل الصامتة في مطالبة نظام OpenClaw المشتركة وسياسة التسليم الصادر. طبقة أسلوب التفاعل الودّي منفصلة وقابلة للضبط.

| القيمة                 | التأثير                                  |
| ---------------------- | ---------------------------------------- |
| `"friendly"` (افتراضي) | تمكين طبقة أسلوب التفاعل الودّي          |
| `"on"`                 | اسم بديل لـ `"friendly"`                 |
| `"off"`                | تعطيل طبقة الأسلوب الودّي فقط            |

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
القيم غير حساسة لحالة الأحرف في وقت التشغيل، لذا يعطّل كل من `"Off"` و`"off"` طبقة الأسلوب الودّي.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ كرجوع احتياطي للتوافق عندما لا يكون إعداد `agents.defaults.promptOverlays.gpt5.personality` المشترك مضبوطاً.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="تركيب الكلام (TTS)">
    يسجّل Plugin `openai` المضمّن تركيب الكلام لسطح `messages.tts`.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يرجع إلى `OPENAI_API_KEY` |
    | عنوان URL الأساسي | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | جسم إضافي | `messages.tts.providers.openai.extraBody` / `extra_body` | (غير مضبوط) |

    النماذج المتاحة: `gpt-4o-mini-tts`، `tts-1`، `tts-1-hd`. الأصوات المتاحة: `alloy`، `ash`، `ballad`، `cedar`، `coral`، `echo`، `fable`، `juniper`، `marin`، `onyx`، `nova`، `sage`، `shimmer`، `verse`.

    يُدمَج `extraBody` في JSON طلب `/audio/speech` بعد الحقول التي ينشئها OpenClaw، لذلك استخدمه لنقاط النهاية المتوافقة مع OpenAI التي تتطلب مفاتيح إضافية مثل `lang`. يتم تجاهل مفاتيح النماذج الأولية.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز عنوان URL الأساسي لـ TTS من دون التأثير في نقطة نهاية chat API. يُضبط كل من OpenAI TTS والصوت في Realtime عبر مفتاح OpenAI Platform API؛ ويمكن للتثبيتات التي تعتمد على OAuth فقط الاستمرار في استخدام نماذج المحادثة المدعومة من Codex، لكن ليس الرد الصوتي المباشر من OpenAI.
    </Note>

  </Accordion>

  <Accordion title="الكلام إلى نص">
    يسجّل Plugin `openai` المضمّن تحويل الكلام إلى نص على دفعات عبر
    سطح نسخ فهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم من OpenClaw حيثما يستخدم نسخ الصوت الوارد
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

    تُمرَّر تلميحات اللغة والمطالبة إلى OpenAI عند توفيرها من
    إعداد وسائط الصوت المشترك أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ في Realtime">
    يسجّل Plugin `openai` المضمّن النسخ في Realtime لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار الإعداد | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير مضبوط) |
    | المطالبة | `...openai.prompt` | (غير مضبوط) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | المصادقة | `...openai.apiKey` أو `OPENAI_API_KEY` أو OAuth لـ `openai` | تتصل مفاتيح API مباشرة؛ ويصدر OAuth سر عميل نسخ Realtime |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). عندما يكون OAuth لـ `openai` فقط مضبوطاً، يصدر Gateway سر عميل نسخ Realtime مؤقتاً قبل فتح WebSocket. هذا المزوّد المتدفق مخصص لمسار النسخ في Realtime الخاص بـ Voice Call؛ أما صوت Discord فيسجل حالياً مقاطع قصيرة ويستخدم بدلاً من ذلك مسار نسخ `tools.media.audio` الدفعي.
    </Note>

  </Accordion>

  <Accordion title="الصوت في Realtime">
    يسجّل Plugin `openai` المضمّن الصوت في Realtime لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار الإعدادات | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة (جسر نشر Azure) | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | حشو البادئة | `...openai.prefixPaddingMs` | `300` |
    | جهد الاستدلال | `...openai.reasoningEffort` | (غير معيّن) |
    | المصادقة | ملف تعريف مصادقة مفتاح API باسم `openai`، أو `...openai.apiKey`، أو `OPENAI_API_KEY` | مفتاح API لمنصة OpenAI مطلوب؛ لا يهيئ OpenAI OAuth الصوت في الوقت الحقيقي |

    الأصوات المضمنة المتاحة في الوقت الحقيقي لـ `gpt-realtime-2`: `alloy`، `ash`،
    `ballad`، `coral`، `echo`، `sage`، `shimmer`، `verse`، `marin`، `cedar`.
    توصي OpenAI باستخدام `marin` و`cedar` للحصول على أفضل جودة في الوقت الحقيقي. هذه
    مجموعة منفصلة عن أصوات تحويل النص إلى كلام أعلاه؛ لا تفترض أن صوت TTS
    مثل `fable` أو `nova` أو `onyx` صالح لجلسات الوقت الحقيقي.

    <Note>
    تستخدم جسور OpenAI الخلفية في الوقت الحقيقي شكل جلسة Realtime WebSocket العام، الذي لا يقبل `session.temperature`. تظل عمليات نشر Azure OpenAI متاحة عبر `azureEndpoint` و`azureDeployment` وتحافظ على شكل الجلسة المتوافق مع النشر. يدعم استدعاء الأدوات ثنائي الاتجاه وصوت G.711 u-law.
    </Note>

    <Note>
    يُحدد صوت الوقت الحقيقي عند إنشاء الجلسة. تسمح OpenAI بتغيير معظم
    حقول الجلسة لاحقًا، لكن لا يمكن تغيير الصوت بعد أن يكون
    النموذج قد أصدر صوتًا في تلك الجلسة. يعرض OpenClaw حاليًا
    معرّفات أصوات الوقت الحقيقي المضمنة كسلاسل نصية.
    </Note>

    <Note>
    تستخدم ميزة Talk في Control UI جلسات OpenAI للمتصفح في الوقت الحقيقي مع سر عميل
    مؤقت يصدره Gateway وتبادل WebRTC SDP مباشر من المتصفح مع
    OpenAI Realtime API. يصدر Gateway سر العميل هذا باستخدام
    ملف تعريف مصادقة مفتاح API المحدد باسم `openai` أو مفتاح API المهيأ لمنصة OpenAI. تستخدم جسور
    ترحيل Gateway وWebSocket الخلفية في الوقت الحقيقي لمكالمة الصوت مسار
    المصادقة القائم على مفتاح API فقط نفسه لنقاط نهاية OpenAI الأصلية. يتوفر تحقق مباشر
    للمشرفين باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    تتحقق مسارات OpenAI من كل من جسر WebSocket الخلفي وتبادل
    WebRTC SDP في المتصفح دون تسجيل الأسرار.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لموفر `openai` المضمن استهداف مورد Azure OpenAI لتوليد الصور
عن طريق تجاوز عنوان URL الأساسي. في مسار توليد الصور، يكتشف OpenClaw
أسماء مضيف Azure على `models.providers.openai.baseUrl` ويتحول إلى
شكل طلب Azure تلقائيًا.

<Note>
يستخدم صوت الوقت الحقيقي مسار إعدادات منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **صوت الوقت الحقيقي**
ضمن [الصوت والكلام](#voice-and-speech) لإعدادات Azure الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- تكون لديك بالفعل اشتراك Azure OpenAI أو حصة أو اتفاقية مؤسسية
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال توفرها Azure
- تريد إبقاء الحركة داخل مستأجر Azure موجود

### الإعدادات

لتوليد الصور عبر Azure من خلال موفر `openai` المضمن، وجّه
`models.providers.openai.baseUrl` إلى مورد Azure الخاص بك واضبط `apiKey` على
مفتاح Azure OpenAI (وليس مفتاح منصة OpenAI):

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

لطلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات محددة بنطاق النشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب
- يستخدم مهلة طلب افتراضية قدرها 600 ثانية لاستدعاءات توليد الصور في Azure.
  تظل قيم `timeoutMs` لكل استدعاء تتجاوز هذا الافتراضي.

تحتفظ عناوين URL الأساسية الأخرى (OpenAI العام، والوكلاء المتوافقون مع OpenAI) بشكل
طلب الصور القياسي في OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور في موفر `openai`
OpenClaw 2026.4.22 أو إصدارًا أحدث. تتعامل الإصدارات الأقدم مع أي
`openai.baseUrl` مخصص مثل نقطة نهاية OpenAI العامة وستفشل مع عمليات نشر
صور Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار Azure معاينة أو عام محدد
لمسار توليد الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

القيمة الافتراضية هي `2024-12-01-preview` عندما لا يكون المتغير معيّنًا.

### أسماء النماذج هي أسماء النشر

يربط Azure OpenAI النماذج بعمليات النشر. بالنسبة لطلبات توليد الصور في Azure
الموجهة عبر موفر `openai` المضمن، يجب أن يكون حقل `model` في OpenClaw
هو **اسم نشر Azure** الذي هيأته في بوابة Azure، وليس
معرّف نموذج OpenAI العام.

إذا أنشأت نشرًا باسم `gpt-image-2-prod` يقدم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجهة عبر
موفر `openai` المضمن.

### التوافر الإقليمي

يتوفر توليد الصور في Azure حاليًا في مجموعة فرعية فقط من المناطق
(على سبيل المثال `eastus2`، و`swedencentral`، و`polandcentral`، و`westus3`،
و`uaenorth`). تحقق من قائمة مناطق Microsoft الحالية قبل إنشاء
نشر، وتأكد من أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا يقبل Azure OpenAI وOpenAI العام دائمًا معلمات الصور نفسها.
قد يرفض Azure خيارات يسمح بها OpenAI العام (على سبيل المثال بعض
قيم `background` في `gpt-image-2`) أو لا يعرضها إلا في إصدارات نماذج
محددة. تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من
OpenClaw. إذا فشل طلب Azure بخطأ تحقق، فتحقق من
مجموعة المعلمات التي يدعمها النشر المحدد وإصدار API لديك في
بوابة Azure.

<Note>
يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق لكنه لا يتلقى
ترويسات الإسناد المخفية من OpenClaw — راجع أكورديون **المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI**
ضمن [الإعدادات المتقدمة](#advanced-configuration).

بالنسبة لحركة الدردشة أو Responses على Azure (خارج توليد الصور)، استخدم
تدفق الإعداد الأولي أو إعدادات موفر Azure مخصصة — لا يكفي `openai.baseUrl` وحده
لالتقاط شكل Azure API/المصادقة. يوجد موفر منفصل
`azure-openai-responses/*`؛ راجع
أكورديون Compaction من جانب الخادم أدناه.
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw نهج WebSocket أولًا مع الرجوع إلى SSE (`"auto"`) لـ `openai/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع إلى SSE
    - بعد الفشل، يضع علامة على WebSocket كمتدهور لمدة تقارب 60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات هوية ثابتة للجلسة والدورة لإعادة المحاولة وإعادة الاتصال
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
    - [استجابات Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="الوضع السريع">
    يعرض OpenClaw مفتاح تبديل مشتركًا للوضع السريع لـ `openai/*`:

    - **الدردشة/واجهة المستخدم:** `/fast status|auto|on|off`
    - **الإعدادات:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التمكين، يربط OpenClaw الوضع السريع بالمعالجة ذات الأولوية في OpenAI (`service_tier = "priority"`). تُحفظ قيم `service_tier` الموجودة، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`. يبدأ `fastMode: "auto"` استدعاءات النموذج الجديدة بسرعة حتى حد الإيقاف التلقائي، ثم يبدأ استدعاءات إعادة المحاولة أو الرجوع أو نتائج الأدوات أو المتابعة اللاحقة دون الوضع السريع. القيمة الافتراضية لحد الإيقاف هي 60 ثانية؛ اضبط `params.fastAutoOnSeconds` على النموذج النشط لتغييرها.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    تتغلب تجاوزات الجلسة على الإعدادات. يؤدي مسح تجاوز الجلسة في واجهة Sessions إلى إعادة الجلسة إلى الافتراضي المهيأ.
    </Note>

  </Accordion>

  <Accordion title="المعالجة ذات الأولوية (service_tier)">
    تعرض واجهة API الخاصة بـ OpenAI المعالجة ذات الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

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
    يُمرر `serviceTier` فقط إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجهت أيًا من الموفرين عبر وكيل، يترك OpenClaw `service_tier` دون تغيير.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جانب الخادم (Responses API)">
    بالنسبة لنماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل غلاف تدفق OpenClaw الخاص بـ OpenAI Plugin تلقائيًا Compaction من جانب الخادم:

    - يفرض `store: true` (ما لم يعيّن توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` الافتراضي: 70% من `contextWindow` (أو `80000` عندما لا يكون متاحًا)

    ينطبق هذا على مسار وقت تشغيل OpenClaw المضمن وعلى خطافات موفر OpenAI المستخدمة في عمليات التشغيل المضمنة. يدير حزام خادم تطبيق Codex الأصلي سياقه الخاص من خلال Codex وتتم تهيئته بواسطة مسار الوكيل الافتراضي في OpenAI أو سياسة وقت تشغيل الموفر/النموذج.

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
    يتحكم `responsesServerCompaction` فقط في حقن `context_management`. لا تزال نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم يعيّن التوافق `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT الوكيلي الصارم">
    بالنسبة إلى تشغيلات عائلة GPT-5 على `openai/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    مع `strict-agentic`، يقوم OpenClaw بما يلي:
    - يفعّل `update_plan` تلقائيًا للأعمال الكبيرة
    - يعيد محاولة الأدوار الفارغة بنيويًا أو التي تحتوي على استدلال فقط من خلال متابعة بإجابة مرئية
    - يستخدم أحداث خطة الحاضنة الصريحة عندما توفرها الحاضنة المحددة

    لا يصنّف OpenClaw نثر المساعد لتحديد ما إذا كان الدور خطة أو تحديث تقدم أو إجابة نهائية.

    <Note>
    يقتصر ذلك على تشغيلات عائلة OpenAI وCodex GPT-5 فقط. يحتفظ المزوّدون الآخرون وعائلات النماذج الأقدم بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI المباشرة وCodex وAzure OpenAI بطريقة مختلفة عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - يحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI `none`
    - يحذف الاستدلال المعطّل للنماذج أو الوكلاء الذين يرفضون `reasoning.effort: "none"`
    - يجعل مخططات الأدوات افتراضيًا في الوضع الصارم
    - يرفق رؤوس إسناد مخفية على المضيفين الأصليين المتحقق منهم فقط
    - يحتفظ بتشكيل الطلب الخاص بـ OpenAI فقط (`service_tier`، `store`، توافق الاستدلال، تلميحات ذاكرة التخزين المؤقت للمطالبات)

    **مسارات الوكيل/المتوافقة:**
    - يستخدم سلوك توافق أكثر مرونة
    - يزيل `store` الخاصة بالإكمالات من حمولات `openai-completions` غير الأصلية
    - يقبل تمرير JSON المتقدم عبر `params.extra_body`/`params.extraBody` لوكلاء الإكمالات المتوافقين مع OpenAI
    - يقبل `params.chat_template_kwargs` لوكلاء الإكمالات المتوافقين مع OpenAI مثل vLLM
    - لا يفرض مخططات أدوات صارمة أو رؤوسًا خاصة بالأصل فقط

    يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق، لكنه لا يتلقى رؤوس الإسناد المخفية.

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
