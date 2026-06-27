---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلاً من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T18:26:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

توفّر OpenAI واجهات API للمطوّرين لنماذج GPT، كما يتوفر Codex أيضًا كوكيل برمجة ضمن خطة
ChatGPT من خلال عملاء Codex لدى OpenAI. يستخدم OpenClaw معرّف مزوّد واحدًا،
`openai`، لكلا شكلي المصادقة.

يستخدم OpenClaw المسار `openai/*` بصفته مسار نموذج OpenAI القياسي. تعمل أدوار الوكيل
المضمّنة على نماذج OpenAI عبر وقت تشغيل خادم تطبيق Codex الأصلي
افتراضيًا؛ وتظل مصادقة مفتاح API المباشرة من OpenAI متاحة لأسطح OpenAI غير الخاصة بالوكلاء
مثل الصور والتضمينات والكلام والوقت الحقيقي.

- **نماذج الوكيل** - نماذج `openai/*` عبر وقت تشغيل Codex؛ سجّل الدخول باستخدام
  مصادقة Codex لاستخدام اشتراك ChatGPT/Codex، أو اضبط ملفًا احتياطيًا متوافقًا مع Codex
  لمفتاح API من OpenAI عندما تريد عمدًا مصادقة مفتاح API.
- **واجهات API غير الخاصة بالوكلاء من OpenAI** - وصول مباشر إلى OpenAI Platform مع فوترة قائمة على الاستخدام
  عبر `OPENAI_API_KEY` أو إعداد مفتاح API من OpenAI.
- **الإعداد القديم** - تُصلَح مراجع نماذج Codex القديمة بواسطة
  `openclaw doctor --fix` إلى `openai/*` بالإضافة إلى وقت تشغيل Codex.

تدعم OpenAI صراحة استخدام OAuth الخاص بالاشتراكات في الأدوات الخارجية وسير العمل مثل OpenClaw.

المزوّد والنموذج ووقت التشغيل والقناة طبقات منفصلة. إذا كانت هذه التسميات
تختلط معًا، فاقرأ [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes) قبل
تغيير الإعداد.

## اختيار سريع

| الهدف                                                 | الاستخدام                                                      | ملاحظات                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| اشتراك ChatGPT/Codex مع وقت تشغيل Codex الأصلي | `openai/gpt-5.5`                                         | إعداد وكيل OpenAI الافتراضي. سجّل الدخول باستخدام مصادقة Codex.                  |
| فوترة مفتاح API مباشرة لنماذج الوكيل              | `openai/gpt-5.5` بالإضافة إلى ملف مفتاح API متوافق مع Codex | استخدم `auth.order.openai` لوضع النسخة الاحتياطية بعد مصادقة الاشتراك.  |
| فوترة مفتاح API مباشرة عبر OpenClaw صريح     | `openai/gpt-5.5` بالإضافة إلى وقت تشغيل المزوّد/النموذج `openclaw`  | اختر ملف مفتاح API عاديًا لـ `openai`.                             |
| أحدث اسم مستعار لواجهة ChatGPT Instant API                     | `openai/chat-latest`                                     | مفتاح API مباشر فقط. اسم مستعار متغيّر للتجارب، وليس الافتراضي.   |
| مصادقة اشتراك ChatGPT/Codex عبر OpenClaw     | `openai/gpt-5.5` بالإضافة إلى وقت تشغيل المزوّد/النموذج `openclaw`  | اختر ملف OAuth لـ `openai` لمسار التوافق.         |
| إنشاء الصور أو تحريرها                          | `openai/gpt-image-2`                                     | يعمل مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.             |
| صور بخلفية شفافة                        | `openai/gpt-image-1.5`                                   | استخدم `outputFormat=png` أو `webp` و`openai.background=transparent`. |

## خريطة التسمية

الأسماء متشابهة لكنها غير قابلة للتبادل:

| الاسم الذي تراه                            | الطبقة             | المعنى                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | بادئة المزوّد   | مسار نموذج OpenAI القياسي؛ تستخدم أدوار الوكيل وقت تشغيل Codex.                                  |
| بادئة OpenAI Codex القديمة              | بادئة قديمة     | مساحة أسماء أقدم للنموذج/الملف. ينقلها `openclaw doctor --fix` إلى `openai`.                   |
| Plugin `codex`                          | Plugin            | Plugin مضمّن في OpenClaw يوفّر وقت تشغيل خادم تطبيق Codex الأصلي وعناصر تحكم محادثة `/codex`. |
| المزوّد/النموذج `agentRuntime.id: codex` | وقت تشغيل الوكيل     | يفرض حزام خادم تطبيق Codex الأصلي للأدوار المضمّنة المطابقة.                            |
| `/codex ...`                            | مجموعة أوامر المحادثة  | ربط/التحكم في سلاسل خادم تطبيق Codex من محادثة.                                        |
| `runtime: "acp", agentId: "codex"`      | مسار جلسة ACP | مسار احتياطي صريح يشغّل Codex عبر ACP/acpx.                                          |

يعني هذا أن الإعداد يمكن أن يحتوي عمدًا على مراجع نماذج `openai/*` بينما تشير ملفات
المصادقة إلى بيانات اعتماد مفتاح API أو ChatGPT/Codex OAuth. استخدم
`auth.order.openai` للإعداد؛ يعيد `openclaw doctor --fix` كتابة مراجع
نماذج Codex القديمة ومعرّفات ملفات مصادقة Codex القديمة وترتيب مصادقة
Codex القديم إلى مسار OpenAI القياسي.

<Note>
يتوفر GPT-5.5 عبر وصول مفتاح API المباشر إلى OpenAI Platform وكذلك عبر
مسارات الاشتراك/OAuth. لاشتراك ChatGPT/Codex مع تنفيذ Codex الأصلي،
استخدم `openai/gpt-5.5`؛ اختيار عدم ضبط إعداد وقت التشغيل يحدد الآن حزام Codex
لأدوار وكيل OpenAI. استخدم ملفات مفتاح API من OpenAI فقط عندما تريد
مصادقة مفتاح API مباشرة لنموذج وكيل من OpenAI.
</Note>

<Note>
تتطلب أدوار نماذج وكيل OpenAI Plugin خادم تطبيق Codex المضمّن. يظل
إعداد وقت تشغيل OpenClaw الصريح متاحًا كمسار توافق اختياري. عندما يتم
اختيار OpenClaw صراحةً مع ملف OAuth لـ `openai`، يحتفظ OpenClaw
بمرجع النموذج العام كـ `openai/*` ويوجّه داخليًا عبر نقل مصادقة Codex.
شغّل `openclaw doctor --fix` لإصلاح مراجع نماذج Codex القديمة
أو `codex-cli/*` أو تثبيتات جلسة وقت التشغيل القديمة التي لا تأتي من
إعداد وقت تشغيل صريح.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI         | سطح OpenClaw                                                                              | الحالة                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| المحادثة / Responses          | مزوّد نموذج `openai/<model>`                                                               | نعم                                                                    |
| نماذج اشتراك Codex | `openai/<model>` مع OpenAI OAuth                                                            | نعم                                                                    |
| مراجع نماذج Codex القديمة   | مراجع نماذج Codex القديمة أو `codex-cli/<model>`                                                | يصلحها doctor إلى `openai/<model>`                                 |
| حزام خادم تطبيق Codex  | `openai/<model>` مع وقت تشغيل محذوف أو المزوّد/النموذج `agentRuntime.id: codex`              | نعم                                                                    |
| بحث الويب من جهة الخادم    | أداة OpenAI Responses الأصلية                                                                  | نعم، عندما يكون بحث الويب مفعّلًا ولا يوجد مزوّد مثبت                 |
| الصور                    | `image_generate`                                                                              | نعم                                                                    |
| الفيديوهات                    | `video_generate`                                                                              | نعم                                                                    |
| تحويل النص إلى كلام            | `messages.tts.provider: "openai"` / `tts`                                                     | نعم                                                                    |
| تحويل الكلام إلى نص دفعي      | `tools.media.audio` / فهم الوسائط                                                     | نعم                                                                    |
| تحويل الكلام إلى نص بالتدفق  | Voice Call `streaming.provider: "openai"`                                                     | نعم                                                                    |
| الصوت في الوقت الحقيقي            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | نعم (يتطلب أرصدة OpenAI Platform، وليس اشتراك Codex/ChatGPT) |
| التضمينات                | مزوّد تضمينات الذاكرة                                                                     | نعم                                                                    |

<Note>
  يمر صوت OpenAI Realtime (المستخدم بواسطة `realtime.provider: "openai"` في Voice Call و
  Control UI Talk مع `talk.realtime.provider: "openai"`) عبر
  **OpenAI Platform Realtime API** العامة، التي تُفوتر مقابل أرصدة OpenAI
  Platform بدلًا من حصة اشتراك Codex/ChatGPT. الحساب الذي يملك
  OpenAI OAuth سليمًا ويشغّل نماذج محادثة مدعومة بـ Codex دون مشكلة
  لا يزال يحتاج إلى ملف مصادقة مفتاح API من OpenAI أو مفتاح API من Platform مع فوترة
  Platform ممولة لصوت Realtime.

الإصلاح: اشحن أرصدة Platform في
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
للمؤسسة الداعمة لبيانات اعتماد الوقت الحقيقي لديك. يقبل صوت Realtime
ملف مصادقة مفتاح API لـ `openai` الذي أنشأه `openclaw onboard --auth-choice openai-api-key`،
أو `OPENAI_API_KEY` من Platform مضبوطًا عبر `talk.realtime.providers.openai.apiKey`
لـ Control UI Talk، أو `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
لـ Voice Call، أو متغير البيئة `OPENAI_API_KEY`. لا تزال ملفات OpenAI OAuth
قادرة على تشغيل نماذج محادثة `openai/*` المدعومة بـ Codex في تثبيت
OpenClaw نفسه، لكنها لا تضبط صوت Realtime.
</Note>

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

بالنسبة إلى نقاط النهاية المتوافقة مع OpenAI التي تتطلب تسميات تضمين غير متناظرة، اضبط
`queryInputType` و`documentInputType` ضمن `memorySearch`. يمرّر OpenClaw
هذه القيم كحقول طلب `input_type` خاصة بالمزوّد: تستخدم تضمينات الاستعلام
`queryInputType`؛ وتستخدم أجزاء الذاكرة المفهرسة والفهرسة الدفعية
`documentInputType`. راجع [مرجع إعداد الذاكرة](/ar/reference/memory-config#provider-specific-config) للاطلاع على المثال الكامل.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة القائمة على الاستخدام.

    <Steps>
      <Step title="Get your API key">
        أنشئ مفتاح API أو انسخه من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Run onboarding">
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
    | `openai/gpt-5.5`      | محذوف / المزوّد/النموذج `agentRuntime.id: "codex"` | حزام خادم تطبيق Codex | ملف OpenAI متوافق مع Codex |
    | `openai/gpt-5.4-mini` | محذوف / المزوّد/النموذج `agentRuntime.id: "codex"` | حزام خادم تطبيق Codex | ملف OpenAI متوافق مع Codex |
    | `openai/gpt-5.5`      | المزوّد/النموذج `agentRuntime.id: "openclaw"`              | وقت تشغيل OpenClaw المضمّن      | ملف `openai` المحدد |

    <Note>
    تستخدم نماذج الوكلاء `openai/*` حزمة تشغيل خادم تطبيق Codex. لاستخدام مصادقة مفتاح API
    لنموذج وكيل، أنشئ ملفًا تعريفيًا لمفتاح API متوافقًا مع Codex ورتّبه
    باستخدام `auth.order.openai`؛ يظل `OPENAI_API_KEY` مسار الرجوع المباشر
    لأسطح OpenAI API غير الخاصة بالوكلاء. شغّل `openclaw doctor --fix` لترحيل
    إدخالات ترتيب مصادقة Codex القديمة.
    </Note>

    ### مثال الإعدادات

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
    مستخدم في ChatGPT وتوصي بـ `gpt-5.5` لاستخدام API في الإنتاج، لذا
    أبقِ `openai/gpt-5.5` كافتراضي مستقر ما لم تكن تريد صراحةً سلوك ذلك
    الاسم المستعار. لا يقبل الاسم المستعار حاليًا إلا إسهاب نص `medium`، لذلك
    يطبّع OpenClaw تجاوزات إسهاب نص OpenAI غير المتوافقة لهذا
    النموذج.

    <Warning>
    لا يعرّض OpenClaw **النموذج** `gpt-5.3-codex-spark` عبر مسار مفتاح OpenAI API المباشر. لا يتوفر إلا عبر إدخالات كتالوج اشتراك Codex عندما يعرّضه حسابك المسجّل دخوله.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex لديك مع تنفيذ خادم تطبيق Codex الأصلي بدلًا من مفتاح API منفصل. يتطلب Codex السحابي تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        أو شغّل OAuth مباشرةً:

        ```bash
        openclaw models auth login --provider openai
        ```

        للإعدادات عديمة الواجهة أو التي لا تناسبها ردود النداء، أضف `--device-code` لتسجيل الدخول بتدفق رمز جهاز ChatGPT بدلًا من رد نداء متصفح localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        لا يلزم إعداد تشغيل للمسار الافتراضي. تختار دورات وكيل OpenAI
        بيئة تشغيل خادم تطبيق Codex الأصلية تلقائيًا، ويثبّت OpenClaw
        Plugin Codex المضمّن أو يصلحه عند اختيار هذا المسار.
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai
        ```

        بعد تشغيل Gateway، أرسل `/codex status` أو `/codex models`
        في الدردشة للتحقق من بيئة تشغيل خادم التطبيق الأصلية.
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | إعدادات التشغيل | المسار | المصادقة |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | محذوف / موفر/نموذج `agentRuntime.id: "codex"` | حزمة تشغيل خادم تطبيق Codex الأصلية | تسجيل دخول Codex أو ملف مصادقة `openai` مرتب |
    | `openai/gpt-5.5` | موفر/نموذج `agentRuntime.id: "openclaw"` | بيئة تشغيل OpenClaw المضمّنة مع نقل مصادقة Codex داخلي | ملف OAuth `openai` المحدد |
    | مرجع Codex GPT-5.5 قديم | يُصلَح بواسطة doctor | يُعاد كتابة المسار القديم إلى `openai/gpt-5.5` | ملف OAuth OpenAI مرحّل |
    | `codex-cli/gpt-5.5` | يُصلَح بواسطة doctor | يُعاد كتابة مسار CLI القديم إلى `openai/gpt-5.5` | مصادقة خادم تطبيق Codex |

    <Warning>
    فضّل `openai/gpt-5.5` لإعداد وكيل جديد مدعوم باشتراك. مراجع Codex GPT
    القديمة الأقدم هي مسارات OpenClaw قديمة، وليست مسار بيئة تشغيل Codex
    الأصلي؛ شغّل `openclaw doctor --fix` عندما تريد ترحيلها إلى مراجع
    `openai/*` القانونية. يظل `gpt-5.3-codex-spark` مقصورًا على الحسابات التي
    يعلن كتالوج اشتراك Codex لديها عن ذلك النموذج؛ وتظل مراجع مفتاح OpenAI API
    المباشر ومراجع Azure الخاصة به محجوبة.
    </Warning>

    <Note>
    بادئة نموذج Codex القديمة هي إعدادات قديمة يصلحها doctor. لإعداد
    الاشتراك الشائع مع بيئة التشغيل الأصلية، سجّل الدخول بمصادقة Codex
    لكن أبقِ مرجع النموذج على `openai/gpt-5.5`. ينبغي أن تضع الإعدادات الجديدة
    ترتيب مصادقة وكيل OpenAI تحت `auth.order.openai`؛ ويرحّل doctor إدخالات
    ترتيب مصادقة Codex القديمة الأقدم.
    </Note>

    ### مثال الإعدادات

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
    ترتيب المصادقة تحت `openai`. سيجرب OpenClaw الاشتراك أولًا، ثم
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
    لم يعد الإعداد الأولي يستورد مادة OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth في المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة في مخزن مصادقة الوكلاء الخاص به.
    </Note>

    ### فحص مسار Codex OAuth واستعادته

    استخدم هذه الأوامر لمعرفة النموذج وبيئة التشغيل ومسار المصادقة الذي يستخدمه
    وكيلك الافتراضي:

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

    إذا كانت إعدادات أقدم ما زالت تحتوي على مراجع Codex GPT قديمة أو تثبيت
    جلسة بيئة تشغيل OpenAI متقادمًا بلا إعداد تشغيل صريح، فأصلحها:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    إذا أظهر `models auth list --provider openai` عدم وجود ملف تعريف صالح للاستخدام، فسجّل
    الدخول مرة أخرى:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    استخدم `--profile-id` عندما تريد عدة عمليات تسجيل دخول Codex OAuth في الوكيل
    نفسه وتريد لاحقًا التحكم بها عبر ترتيب المصادقة أو `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` هو مسار النموذج لدورات وكيل OpenAI عبر Codex. شغّل
    `openclaw doctor --fix` لترحيل معرّفات ملفات تعريف بادئة OpenAI Codex القديمة الأقدم
    وإدخالات الترتيب قبل الاعتماد على ترتيب ملفات التعريف.

    ### مؤشر الحالة

    تعرض دردشة `/status` بيئة تشغيل النموذج النشطة للجلسة الحالية.
    تظهر حزمة تشغيل خادم تطبيق Codex المضمّنة كـ `Runtime: OpenAI Codex` عند
    دورات نماذج وكيل OpenAI. تُصلَح تثبيتات جلسات بيئة تشغيل OpenAI المتقادمة إلى Codex ما لم
    تثبّت الإعدادات OpenClaw صراحةً.

    ### تحذير doctor

    إذا بقيت مراجع نماذج Codex القديمة أو تثبيتات بيئة تشغيل OpenAI المتقادمة في الإعدادات أو
    حالة الجلسة، فإن `openclaw doctor --fix` يعيد كتابتها إلى `openai/*` مع
    بيئة تشغيل Codex ما لم يكن OpenClaw معدًا صراحةً.

    ### حد نافذة السياق

    يعامل OpenClaw بيانات تعريف النموذج وحد سياق بيئة التشغيل كقيمتين منفصلتين.

    بالنسبة إلى `openai/gpt-5.5` عبر كتالوج Codex OAuth:

    - `contextWindow` الأصلي: `1000000`
    - حد `contextTokens` الافتراضي لبيئة التشغيل: `272000`

    يملك الحد الافتراضي الأصغر خصائص كمون وجودة أفضل عمليًا. تجاوزه باستخدام `contextTokens`:

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
    استخدم `contextWindow` للتصريح ببيانات تعريف النموذج الأصلية. استخدم `contextTokens` لتحديد ميزانية سياق بيئة التشغيل.
    </Note>

    ### استعادة الكتالوج

    يستخدم OpenClaw بيانات تعريف كتالوج Codex upstream لـ `gpt-5.5` عندما تكون
    موجودة. إذا أغفل اكتشاف Codex المباشر صف `gpt-5.5` بينما
    الحساب مصادق عليه، ينشئ OpenClaw صف نموذج OAuth هذا حتى
    لا تفشل عمليات cron والوكيل الفرعي وعمليات النموذج الافتراضي المعدّة بسبب
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة خادم تطبيق Codex الأصلية

تستخدم حزمة تشغيل خادم تطبيق Codex الأصلية مراجع نماذج `openai/*` مع حذف
إعدادات التشغيل أو موفر/نموذج `agentRuntime.id: "codex"`، لكن مصادقتها
ما زالت قائمة على الحساب. يختار OpenClaw المصادقة بهذا الترتيب:

1. ملفات مصادقة OpenAI المرتبة للوكيل، ويفضل أن تكون تحت
   `auth.order.openai`. شغّل `openclaw doctor --fix` لترحيل معرّفات
   ملفات مصادقة Codex القديمة الأقدم وترتيب مصادقة Codex القديم.
2. الحساب الحالي لخادم التطبيق، مثل تسجيل دخول ChatGPT محلي في Codex CLI.
3. لإطلاقات خادم التطبيق المحلية عبر stdio فقط، `CODEX_API_KEY`، ثم
   `OPENAI_API_KEY`، عندما يبلّغ خادم التطبيق عن عدم وجود حساب وما يزال يتطلب
   مصادقة OpenAI.

هذا يعني أن تسجيل دخول اشتراك ChatGPT/Codex المحلي لا يُستبدل لمجرد
أن عملية Gateway لديها أيضًا `OPENAI_API_KEY` لنماذج OpenAI المباشرة
أو التضمينات. رجوع مفتاح API عبر البيئة هو مسار عدم وجود حساب stdio المحلي فقط؛ ولا
يُرسل إلى اتصالات خادم التطبيق عبر WebSocket. عند تحديد ملف تعريف Codex
بنمط الاشتراك، يبقي OpenClaw أيضًا `CODEX_API_KEY` و`OPENAI_API_KEY`
خارج ابن خادم التطبيق stdio المُنشأ ويرسل بيانات الاعتماد المحددة
عبر RPC تسجيل دخول خادم التطبيق. عندما يُحظر ملف تعريف الاشتراك هذا بسبب
حد استخدام Codex، يمكن لـ OpenClaw الدوران إلى ملف تعريف مفتاح API
`openai:*` المرتب التالي دون تغيير النموذج المحدد أو الخروج من حزمة تشغيل
Codex. بمجرد مرور وقت إعادة تعيين الاشتراك، يصبح ملف تعريف الاشتراك
مؤهلًا مرة أخرى.

## إنشاء الصور

يسجل Plugin `openai` المضمّن إنشاء الصور عبر أداة `image_generate`.
يدعم إنشاء صور OpenAI بمفتاح API وإنشاء صور Codex OAuth
عبر مرجع النموذج نفسه `openai/gpt-image-2`.

| القدرة                | مفتاح OpenAI API                     | Codex OAuth                          |
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
راجع [إنشاء الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار الموفر، وسلوك تجاوز الفشل.
</Note>

`gpt-image-2` هو الافتراضي لكل من إنشاء الصور من نص OpenAI وتحرير الصور.
تظل `gpt-image-1.5` و`gpt-image-1` و`gpt-image-1-mini` قابلة للاستخدام كتجاوزات
نموذج صريحة. استخدم `openai/gpt-image-1.5` لإخراج PNG/WebP
بخلفية شفافة؛ إذ ترفض API الحالية لـ `gpt-image-2`
`background: "transparent"`.

لطلب خلفية شفافة، يجب على الوكلاء استدعاء `image_generate` مع
`model: "openai/gpt-image-1.5"` و`outputFormat: "png"` أو `"webp"` و
`background: "transparent"`؛ ولا يزال خيار المزوّد الأقدم `openai.background`
مقبولًا. يحمي OpenClaw أيضًا مسارات OAuth العامة الخاصة بـ OpenAI و
OpenAI Codex عبر إعادة كتابة طلبات الشفافية الافتراضية `openai/gpt-image-2`
إلى `gpt-image-1.5`؛ أما Azure ونقاط النهاية المخصصة المتوافقة مع OpenAI
فتحتفظ بأسماء النشر/النماذج المكوّنة لها.

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
يبقى `--openai-background` متاحًا كاسم بديل خاص بـ OpenAI.
استخدم `--quality low|medium|high|auto` عندما تحتاج إلى التحكم في جودة
صور OpenAI وتكلفتها. استخدم `--openai-moderation low|auto` لتمرير تلميح
الإشراف الخاص بالمزوّد في OpenAI من `image generate` أو `image edit`.

لتثبيتات OAuth الخاصة بـ ChatGPT/Codex، احتفظ بمرجع `openai/gpt-image-2`
نفسه. عند تكوين ملف تعريف OAuth باسم `openai`، يحل OpenClaw رمز وصول OAuth
المخزن ويرسل طلبات الصور عبر واجهة Codex Responses الخلفية. ولا يجرّب أولًا
`OPENAI_API_KEY` ولا يعود بصمت إلى مفتاح API لذلك الطلب. كوّن
`models.providers.openai` صراحةً باستخدام مفتاح API أو عنوان URL أساسي مخصص
أو نقطة نهاية Azure عندما تريد مسار API المباشر لصور OpenAI بدلًا من ذلك.
إذا كانت نقطة نهاية الصور المخصصة هذه على عنوان LAN/خاص موثوق، فعيّن أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ إذ يبقي OpenClaw
نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محظورة ما لم يكن هذا
الاشتراك الصريح موجودًا.

التوليد:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

توليد PNG شفاف:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

التحرير:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## توليد الفيديو

يسجل Plugin المضمّن `openai` توليد الفيديو عبر أداة `video_generate`.

| القدرة | القيمة |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2` |
| الأوضاع | نص إلى فيديو، صورة إلى فيديو، تحرير فيديو واحد |
| مدخلات مرجعية | صورة واحدة أو فيديو واحد |
| تجاوزات الحجم | مدعومة للنص إلى فيديو والصورة إلى فيديو |
| تجاوزات أخرى | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة |

تستخدم طلبات الصورة إلى فيديو في OpenAI المسار `POST /v1/videos` مع صورة
`input_reference`. تستخدم تحريرات الفيديو الواحد المسار `POST /v1/videos/edits`
مع الفيديو المرفوع في الحقل `video`.

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
راجع [توليد الفيديو](/ar/tools/video-generation) لمعرفة معاملات الأداة المشتركة واختيار المزوّد وسلوك تجاوز الفشل.
</Note>

## مساهمة موجه GPT-5

يضيف OpenClaw مساهمة موجه GPT-5 مشتركة لتشغيلات عائلة GPT-5 على أسطح الموجهات التي يجمّعها OpenClaw. تنطبق حسب معرّف النموذج، لذلك تتلقى مسارات OpenClaw/المزوّد مثل المراجع القديمة قبل الإصلاح (مرجع Codex GPT-5.5 القديم)، و`openrouter/openai/gpt-5.5`، و`opencode/gpt-5.5`، ومراجع GPT-5 المتوافقة الأخرى الطبقة نفسها. لا تنطبق على نماذج GPT-4.x الأقدم.

لا يتلقى حزام Codex الأصلي المضمّن طبقة OpenClaw GPT-5 هذه عبر تعليمات المطور في خادم تطبيق Codex. يحتفظ Codex الأصلي بسلوك الأساس والنموذج ووثائق المشروع المملوك لـ Codex، بينما يعطل OpenClaw الشخصية المدمجة في Codex للسلاسل الأصلية حتى تبقى ملفات شخصية مساحة عمل الوكيل هي المرجع المعتمد. يساهم OpenClaw فقط بسياق وقت التشغيل مثل تسليم القناة وأدوات OpenClaw الديناميكية وتفويض ACP وسياق مساحة العمل وSkills الخاصة بـ OpenClaw.

تضيف مساهمة GPT-5 عقد سلوك موسومًا لاستمرارية الشخصية وسلامة التنفيذ وانضباط الأدوات وشكل المخرجات وفحوصات الإكمال والتحقق على موجهات OpenClaw المجمعة المطابقة. يبقى سلوك الرد الخاص بالقناة والرسائل الصامتة في موجه نظام OpenClaw المشترك وسياسة التسليم الصادر. طبقة أسلوب التفاعل الودود منفصلة وقابلة للتكوين.

| القيمة | التأثير |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (افتراضي) | تمكين طبقة أسلوب التفاعل الودود |
| `"on"` | اسم بديل لـ `"friendly"` |
| `"off"` | تعطيل طبقة الأسلوب الودود فقط |

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
القيم غير حساسة لحالة الأحرف في وقت التشغيل، لذلك يعطل كل من `"Off"` و`"off"` طبقة الأسلوب الودود.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم يُقرأ كبديل توافق عندما لا يكون الإعداد المشترك `agents.defaults.promptOverlays.gpt5.personality` معينًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="اصطناع الكلام (TTS)">
    يسجل Plugin المضمّن `openai` اصطناع الكلام لسطح `messages.tts`.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير معين) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير معين، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يعود إلى `OPENAI_API_KEY` |
    | عنوان URL الأساسي | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | جسم إضافي | `messages.tts.providers.openai.extraBody` / `extra_body` | (غير معين) |

    النماذج المتاحة: `gpt-4o-mini-tts` و`tts-1` و`tts-1-hd`. الأصوات المتاحة: `alloy` و`ash` و`ballad` و`cedar` و`coral` و`echo` و`fable` و`juniper` و`marin` و`onyx` و`nova` و`sage` و`shimmer` و`verse`.

    يتم دمج `extraBody` في JSON طلب `/audio/speech` بعد الحقول التي يولدها OpenClaw، لذلك استخدمه لنقاط النهاية المتوافقة مع OpenAI التي تتطلب مفاتيح إضافية مثل `lang`. يتم تجاهل مفاتيح النموذج الأولي.

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
    عيّن `OPENAI_TTS_BASE_URL` لتجاوز عنوان URL الأساسي لـ TTS دون التأثير في نقطة نهاية API الدردشة. يتم تكوين كل من OpenAI TTS والصوت الفوري عبر مفتاح API لمنصة OpenAI؛ يمكن لتثبيتات OAuth فقط أن تظل تستخدم نماذج الدردشة المدعومة من Codex، ولكن ليس التحدث الحي العكسي من OpenAI.
    </Note>

  </Accordion>

  <Accordion title="الكلام إلى نص">
    يسجل Plugin المضمّن `openai` تحويل الكلام إلى نص دفعيًا عبر
    سطح النسخ لفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST `/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم من OpenClaw أينما يستخدم نسخ الصوت الوارد
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

    يتم تمرير تلميحات اللغة والموجه إلى OpenAI عند توفيرها بواسطة
    تكوين الوسائط الصوتية المشترك أو طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ الفوري">
    يسجل Plugin المضمّن `openai` النسخ الفوري لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير معين) |
    | الموجه | `...openai.prompt` | (غير معين) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | المصادقة | `...openai.apiKey` أو `OPENAI_API_KEY` أو OAuth باسم `openai` | تتصل مفاتيح API مباشرة؛ ويصدر OAuth سر عميل نسخ فوري |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law (`g711_ulaw` / `audio/pcmu`). عندما يكون OAuth باسم `openai` فقط مكونًا، يصدر Gateway سر عميل نسخ فوري مؤقت قبل فتح WebSocket. هذا المزوّد المتدفق مخصص لمسار النسخ الفوري في المكالمات الصوتية؛ أما صوت Discord فيسجل حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار نسخ `tools.media.audio` الدفعي.
    </Note>

  </Accordion>

  <Accordion title="الصوت الفوري">
    يسجل Plugin المضمّن `openai` الصوت الفوري لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة (جسر نشر Azure) | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | حشو البادئة | `...openai.prefixPaddingMs` | `300` |
    | جهد الاستدلال | `...openai.reasoningEffort` | (غير معين) |
    | المصادقة | ملف تعريف مصادقة مفتاح API باسم `openai`، أو `...openai.apiKey`، أو `OPENAI_API_KEY` | مفتاح API لمنصة OpenAI مطلوب؛ لا يكوّن OAuth الخاص بـ OpenAI الصوت الفوري |

    الأصوات الفورية المدمجة المتاحة لـ `gpt-realtime-2`: `alloy` و`ash`،
    و`ballad` و`coral` و`echo` و`sage` و`shimmer` و`verse` و`marin` و`cedar`.
    توصي OpenAI بـ `marin` و`cedar` للحصول على أفضل جودة فورية. هذه
    مجموعة منفصلة عن أصوات تحويل النص إلى كلام أعلاه؛ لا تفترض أن صوت TTS
    مثل `fable` أو `nova` أو `onyx` صالح لجلسات الصوت الفوري.

    <Note>
    تستخدم جسور OpenAI الفورية الخلفية شكل جلسة WebSocket الفورية GA، والذي لا يقبل `session.temperature`. تظل عمليات نشر Azure OpenAI متاحة عبر `azureEndpoint` و`azureDeployment` وتحتفظ بشكل الجلسة المتوافق مع النشر. يدعم استدعاء الأدوات ثنائي الاتجاه وصوت G.711 u-law.
    </Note>

    <Note>
    يتم اختيار الصوت الفوري عند إنشاء الجلسة. تسمح OpenAI بتغيير معظم
    حقول الجلسة لاحقًا، لكن لا يمكن تغيير الصوت بعد أن يصدر النموذج صوتًا
    في تلك الجلسة. يعرض OpenClaw حاليًا معرّفات الأصوات الفورية المدمجة كسلاسل.
    </Note>

    <Note>
    تستخدم Control UI Talk جلسات OpenAI في المتصفح بالوقت الحقيقي مع سر عميل
    مؤقت يصدره Gateway وتبادل WebRTC SDP مباشر في المتصفح مع
    OpenAI Realtime API. يصدر Gateway سر العميل هذا باستخدام ملف تعريف مصادقة مفتاح API المحدد
    لـ `openai` أو مفتاح OpenAI Platform API المكوّن. تستخدم جسور Gateway
    relay وجسور WebSocket بالوقت الحقيقي في خلفية Voice Call مسار مصادقة مفتاح API فقط نفسه
    لنقاط نهاية OpenAI الأصلية. يتوفر التحقق المباشر للمشرفين باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`؛
    تتحقق مسارات OpenAI من كل من جسر WebSocket الخلفي وتبادل
    WebRTC SDP في المتصفح دون تسجيل الأسرار.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لموفر `openai` المضمّن استهداف مورد Azure OpenAI لتوليد الصور
عبر تجاوز عنوان URL الأساسي. في مسار توليد الصور، يكتشف OpenClaw
أسماء مضيفي Azure على `models.providers.openai.baseUrl` ويتحوّل إلى
شكل طلب Azure تلقائياً.

<Note>
يستخدم الصوت بالوقت الحقيقي مسار إعدادات منفصلاً
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **الصوت بالوقت الحقيقي**
ضمن [الصوت والكلام](#voice-and-speech) لإعدادات Azure الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- يكون لديك بالفعل اشتراك Azure OpenAI أو حصة استخدام أو اتفاقية مؤسسة
- تحتاج إلى إقامة بيانات إقليمية أو ضوابط امتثال توفرها Azure
- تريد إبقاء حركة المرور داخل مستأجر Azure قائم

### الإعدادات

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

يتعرّف OpenClaw على لواحق مضيف Azure هذه لمسار توليد الصور في Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

لطلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل ترويسة `api-key` بدلاً من `Authorization: Bearer`
- يستخدم مسارات محددة النطاق بالنشر (`/openai/deployments/{deployment}/...`)
- يضيف `?api-version=...` إلى كل طلب
- يستخدم مهلة طلب افتراضية مقدارها 600 ثانية لاستدعاءات توليد الصور في Azure.
  لا تزال قيم `timeoutMs` لكل استدعاء تتجاوز هذا الإعداد الافتراضي.

تحافظ عناوين URL الأساسية الأخرى (OpenAI العام، والوكلاء المتوافقون مع OpenAI)
على شكل طلب الصور القياسي في OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور الخاص بموفر `openai`
OpenClaw 2026.4.22 أو أحدث. تتعامل الإصدارات الأقدم مع أي
`openai.baseUrl` مخصص مثل نقطة نهاية OpenAI العامة وستفشل مع عمليات نشر الصور في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار Azure preview أو GA محدد
لمسار توليد الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

الإعداد الافتراضي هو `2024-12-01-preview` عندما لا يكون المتغير مضبوطاً.

### أسماء النماذج هي أسماء عمليات النشر

يربط Azure OpenAI النماذج بعمليات النشر. بالنسبة إلى طلبات توليد الصور في Azure
الموجّهة عبر موفر `openai` المضمّن، يجب أن يكون حقل `model` في OpenClaw
هو **اسم نشر Azure** الذي أعددته في بوابة Azure، وليس معرّف نموذج OpenAI العام.

إذا أنشأت عملية نشر باسم `gpt-image-2-prod` تخدم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجّهة عبر
موفر `openai` المضمّن.

### التوفر الإقليمي

يتوفر توليد الصور في Azure حالياً في مجموعة فرعية فقط من المناطق
(على سبيل المثال `eastus2`، و`swedencentral`، و`polandcentral`، و`westus3`،
و`uaenorth`). تحقق من قائمة مناطق Microsoft الحالية قبل إنشاء
عملية نشر، وتأكد من أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا يقبل Azure OpenAI وOpenAI العام دائماً معلمات الصور نفسها.
قد ترفض Azure خيارات يسمح بها OpenAI العام (مثل بعض قيم
`background` على `gpt-image-2`) أو تعرضها فقط في إصدارات نماذج محددة.
تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من OpenClaw.
إذا فشل طلب Azure بخطأ تحقق، فتحقق من مجموعة المعلمات التي تدعمها
عملية النشر وإصدار API المحددان لديك في بوابة Azure.

<Note>
يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق، لكنه لا يتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع أكورديون **المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI**
ضمن [الإعدادات المتقدمة](#advanced-configuration).

بالنسبة إلى حركة مرور الدردشة أو Responses على Azure (خارج توليد الصور)، استخدم
تدفق الإعداد الأولي أو إعداد موفر Azure مخصصاً — لا يكفي `openai.baseUrl` وحده
لالتقاط شكل Azure API/المصادقة. يوجد موفر منفصل
`azure-openai-responses/*`؛ راجع أكورديون Compaction من جهة الخادم أدناه.
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw نهج WebSocket أولاً مع رجوع احتياطي إلى SSE (`"auto"`) لـ `openai/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع احتياطياً إلى SSE
    - بعد الفشل، يعلّم WebSocket كمتدهور لمدة تقارب 60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات ثابتة لهوية الجلسة والدورة لإعادة المحاولات وإعادة الاتصال
    - يطبّع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (افتراضي) | WebSocket أولاً، مع رجوع احتياطي إلى SSE |
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

  <Accordion title="الوضع السريع">
    يعرّض OpenClaw مفتاح تبديل مشتركاً للوضع السريع لـ `openai/*`:

    - **الدردشة/واجهة المستخدم:** `/fast status|auto|on|off`
    - **الإعدادات:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند تفعيله، يربط OpenClaw الوضع السريع بمعالجة الأولوية في OpenAI (`service_tier = "priority"`). يتم الحفاظ على قيم `service_tier` الحالية، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`. يبدأ `fastMode: "auto"` استدعاءات النماذج الجديدة بسرعة حتى حد القطع التلقائي، ثم يبدأ استدعاءات إعادة المحاولة أو الرجوع الاحتياطي أو نتيجة الأداة أو المتابعة اللاحقة دون وضع سريع. القيمة الافتراضية لحد القطع هي 60 ثانية؛ اضبط `params.fastAutoOnSeconds` على النموذج النشط لتغييرها.

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
    تتغلب تجاوزات الجلسة على الإعدادات. يؤدي مسح تجاوز الجلسة في واجهة Sessions إلى إعادة الجلسة إلى الإعداد الافتراضي المكوّن.
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

    القيم المدعومة: `auto`، و`default`، و`flex`، و`priority`.

    <Warning>
    يتم تمرير `serviceTier` فقط إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجّهت أيّاً من الموفرين عبر وكيل، يترك OpenClaw `service_tier` كما هو.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جهة الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل مغلّف تدفق OpenClaw في Plugin OpenAI ميزة Compaction من جهة الخادم تلقائياً:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` الافتراضي: 70% من `contextWindow` (أو `80000` عند عدم توفره)

    ينطبق هذا على مسار تشغيل OpenClaw المدمج وعلى خطاطيف موفر OpenAI المستخدمة في عمليات التشغيل المضمّنة. يدير حزام خادم تطبيق Codex الأصلي سياقه الخاص عبر Codex ويتم إعداده بواسطة مسار الوكيل الافتراضي في OpenAI أو سياسة تشغيل الموفر/النموذج.

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

  <Accordion title="وضع GPT الوكيلي الصارم">
    بالنسبة إلى عمليات تشغيل عائلة GPT-5 على `openai/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

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
    - يفعّل `update_plan` تلقائياً للأعمال الجوهرية
    - يعيد محاولة الدورات الفارغة بنيوياً أو المقتصرة على الاستدلال مع متابعة لإجابة مرئية
    - يستخدم أحداث خطة الحزام الصريحة عندما يوفرها الحزام المحدد

    لا يصنّف OpenClaw نثر المساعد ليقرر ما إذا كانت الدورة خطة أو تحديث تقدم أو إجابة نهائية.

    <Note>
    يقتصر ذلك على عمليات OpenAI وCodex لعائلة GPT-5 فقط. يحتفظ الموفرون الآخرون وعائلات النماذج الأقدم بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI وCodex وAzure OpenAI المباشرة بشكل مختلف عن وكلاء `/v1` العامين المتوافقين مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - يحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم جهد OpenAI `none`
    - يحذف الاستدلال المعطّل للنماذج أو الوكلاء الذين يرفضون `reasoning.effort: "none"`
    - يضبط مخططات الأدوات افتراضياً على الوضع الصارم
    - يرفق ترويسات الإسناد المخفية على المضيفين الأصليين المتحقق منهم فقط
    - يحافظ على تشكيل طلبات OpenAI فقط (`service_tier`، و`store`، وتوافق الاستدلال، وتلميحات ذاكرة التخزين المؤقت للمطالبات)

    **مسارات الوكيل/المتوافقة:**
    - استخدم سلوك توافق أكثر مرونة
    - أزِل `store` الخاص بـ Completions من حمولات `openai-completions` غير الأصلية
    - اقبل تمرير JSON المتقدم عبر `params.extra_body`/`params.extraBody` لوكلاء Completions المتوافقين مع OpenAI
    - اقبل `params.chat_template_kwargs` لوكلاء Completions المتوافقين مع OpenAI مثل vLLM
    - لا تفرض مخططات أدوات صارمة أو ترويسات خاصة بالأصلية فقط

    يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق، لكنه لا يتلقى ترويسات الإسناد المخفية.

  </Accordion>
</AccordionGroup>

## ذات صلة

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
