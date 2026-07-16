---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلاً من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدام OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T14:51:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw يستخدم معرّف مزوّد واحدًا، `openai`، لكلٍّ من المصادقة المباشرة بمفتاح API ومصادقة اشتراك
ChatGPT/Codex. ويُعدّ `openai/*` مسار النموذج القياسي.
بالنسبة إلى دورات الوكيل المضمّنة التي لم تُضبط فيها سياسة وقت التشغيل أو ضُبطت على `auto`، تحدد
حقائق مسار OpenAI ما إذا كان يجوز لـ OpenClaw اختيار وقت تشغيل خادم تطبيق Codex المضمّن
ضمنيًا. ولا تحدد البادئة `openai/*` وحدها وقت تشغيل.

- **نماذج الوكيل** - `openai/*` عبر وقت التشغيل الذي تحدده تهيئة
  `agentRuntime` الصريحة أو سياسة المسار الضمنية لـ OpenAI. سجّل الدخول باستخدام مصادقة Codex
  لاستخدام اشتراك ChatGPT/Codex، أو هيّئ ملف تعريف مصادقة بمفتاح API
  عندما تريد فوترة قائمة على المفتاح.
- **واجهات OpenAI API غير الخاصة بالوكيل** - وصول مباشر إلى منصة OpenAI، مع فوترة حسب الاستخدام،
  عبر `OPENAI_API_KEY` أو ملف تعريف مصادقة بمفتاح API من نوع `openai`.
- **التهيئة القديمة** - تُصلَح مراجع `codex/*` و`openai-codex/*` إلى
  `openai/*` بالإضافة إلى `agentRuntime.id: "codex"` على مستوى النموذج بواسطة
  `openclaw doctor --fix`.

تدعم OpenAI صراحةً استخدام OAuth الخاص بالاشتراك في الأدوات الخارجية
وسير العمل مثل OpenClaw.

## تتبّع الاستخدام والتكلفة

يفصل OpenClaw بين حصة الاشتراك وفوترة Platform API:

- يعرض OAuth الخاص بـ ChatGPT/Codex خطة الاشتراك ونوافذ الحصة ورصيد الاعتمادات.
- يعرض `OPENAI_ADMIN_KEY` مدة 30 يومًا من تكلفة المؤسسة واستخدام الإكمالات اللذين أبلغ عنهما المزوّد في **الاستخدام** ضمن واجهة التحكم، بما في ذلك الإنفاق اليومي وإجماليات الطلبات/الرموز المميزة وأبرز النماذج وفئات التكلفة.
- يقيّد `OPENAI_PROJECT_ID` اختياريًا سجل Admin API بمشروع واحد.
- لا يرسل OpenClaw مطلقًا `OPENAI_API_KEY` أو ملف تعريف استدلال `openai` إلى واجهات API الخاصة بالمؤسسة؛ فقد تخص بيانات الاعتماد هذه نقاط نهاية مخصصة أو Azure أو نقاط نهاية محلية للوكيل.

يكون لمفتاح Admin الصريح أسبقية على OAuth. ولا يُدمج السجل الذي أبلغ عنه المزوّد مع التكلفة التقديرية المستمدة من جلسات OpenClaw؛ وقد يتضمن نشاط API من عملاء آخرين وتعديلات فوترة من جانب المزوّد.

توضح وثائق [لوحة معلومات استخدام API](https://help.openai.com/en/articles/10478918) من OpenAI متطلبات مالك المؤسسة والإذن الصريح للوحة معلومات الاستخدام اللازمة لبيانات الاستخدام.

المزوّد والنموذج ووقت التشغيل والقناة طبقات منفصلة. إذا كانت هذه التسميات
تختلط معًا، فاقرأ [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes) قبل
تغيير التهيئة.

## اختيار سريع

| الهدف                                              | الاستخدام                                                                | ملاحظات                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| اشتراك ChatGPT/Codex، وقت تشغيل Codex الأصلي  | `openai/gpt-5.6-sol`                                               | إعداد اشتراك جديد؛ سجّل الدخول باستخدام مصادقة Codex.                  |
| فوترة مباشرة بمفتاح API لدورات الوكيل            | `openai/gpt-5.6` بالإضافة إلى ملف تعريف مصادقة بمفتاح API مرتب              | إعداد جديد بمفتاح API؛ يُحل معرّف API المباشر المجرّد إلى Sol.        |
| اختيار فئة GPT-5.6 محددة                      | `openai/gpt-5.6-sol` أو `-terra` أو `-luna`                         | تحقّق من `models list` لمعرفة الفئات المتاحة لهذا الحساب.        |
| حساب بلا وصول إلى GPT-5.6                    | `openai/gpt-5.5`                                                   | خيار استرداد صريح؛ لا يخفض OpenClaw الإصدار ضمنيًا.     |
| فوترة مباشرة بمفتاح API، وقت تشغيل OpenClaw صريح | `openai/gpt-5.6` بالإضافة إلى المزوّد/النموذج `agentRuntime.id: "openclaw"` | حدد ملف تعريف عاديًا بمفتاح API من نوع `openai`.                           |
| أحدث اسم مستعار لنموذج ChatGPT Instant                | `openai/chat-latest`                                               | مفتاح API مباشر فقط؛ اسم مستعار متغير، وليس القيمة الافتراضية المستقرة.          |
| إنشاء الصور أو تحريرها                       | `openai/gpt-image-2`                                               | يعمل مع `OPENAI_API_KEY` أو OAuth الخاص بـ Codex.                         |
| صور ذات خلفية شفافة                     | `openai/gpt-image-1.5`                                             | اضبط `outputFormat` على `png` أو `webp` و`background=transparent`. |

## خريطة التسمية

| الاسم الذي تراه                            | الطبقة             | المعنى                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | بادئة المزوّد   | مسار نموذج OpenAI القياسي؛ تحدد حقائق المسار وقت التشغيل الضمني.                |
| Plugin ‏`codex`                          | Plugin            | Plugin مضمّن يوفر وقت تشغيل خادم تطبيق Codex الأصلي وعناصر تحكم الدردشة `/codex`. |
| المزوّد/النموذج `agentRuntime.id: codex` | وقت تشغيل الوكيل     | يفرض بيئة خادم تطبيق Codex الأصلية للدورات المضمّنة المطابقة.                   |
| `/codex ...`                            | مجموعة أوامر الدردشة  | تربط سلاسل خادم تطبيق Codex من محادثة وتتحكم فيها.                               |
| `runtime: "acp", agentId: "codex"`      | مسار جلسة ACP | مسار احتياطي صريح يشغّل Codex عبر ACP/acpx.                                 |

## وقت تشغيل الوكيل الضمني

عندما تكون سياسة المزوّد/النموذج `agentRuntime` غير مضبوطة أو مضبوطة على `auto`، تختار
سياسة المسار المملوكة لـ OpenAI وقت التشغيل الضمني من نقطة النهاية
والمهايئ الفعليين:

| حقائق المسار الفعلية                                                                                                                                                  | وقت التشغيل الضمني      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| نقطة نهاية HTTPS الرسمية الدقيقة لـ Platform مع `openai-responses`، أو نقطة نهاية HTTPS الرسمية الدقيقة لـ ChatGPT مع `openai-chatgpt-responses`؛ بلا تجاوز طلب مُنشأ | يمكن اختيار Codex |
| مهايئ `openai-completions` مُنشأ                                                                                                                                  | OpenClaw              |
| نقطة نهاية مخصصة                                                                                                                                                        | OpenClaw              |
| نقطة نهاية رسمية دقيقة وصريحة تستخدم HTTP                                                                                                                            | مرفوضة              |
| مسار يتضمن تجاوزًا مُنشأ لطلب المزوّد/النموذج                                                                                                                 | OpenClaw              |

يظل إعداد المزوّد/النموذج `agentRuntime.id` الصريح وغير الافتراضي هو المرجع الحاكم.
على سبيل المثال، يُبقي `agentRuntime.id: "openclaw"` مسارًا مؤهلًا لولا ذلك لاستخدام Codex
على OpenClaw، بينما يتطلب `agentRuntime.id: "codex"` استخدام Codex ويفشل
بصورة مغلقة عندما لا يُعلَن أن المسار الفعلي متوافق مع Codex.
لا يغيّر اختيار وقت التشغيل نوع بيانات الاعتماد أو الفوترة: تظل مصادقة
Platform بمفتاح API ومصادقة اشتراك ChatGPT/Codex منفصلتين.

ينقل `openclaw doctor --fix` مراجع نماذج `codex/*` و`openai-codex/*`
القديمة، ومعرّفات ملفات تعريف مصادقة Codex القديمة، وإدخالات ترتيب مصادقة Codex القديمة إلى
مسار `openai` القياسي. وتتلقى مراجع النماذج المنقولة
`agentRuntime.id: "codex"` على مستوى النموذج؛ استخدم `auth.order.openai` لتهيئة ترتيب المصادقة الجديدة.

<Note>
يطبّق إعداد OpenAI الجديد نموذج GPT-5.6 أساسيًا فقط عندما لا يكون هناك نموذج أساسي
مهيأ. وتحافظ إضافة مصادقة OpenAI أو تحديثها على أي اختيار صريح موجود،
بما في ذلك `openai/gpt-5.5`، ما لم تستخدم صراحةً
`models auth login --set-default` أو `models set`. استخدم ملف تعريف مصادقة بمفتاح API
فقط عندما تريد مصادقة بمفتاح API لنموذج وكيل.
</Note>

## المعاينة المحدودة لـ GPT-5.6

يتعرف OpenClaw على معرّفات النماذج الدقيقة `openai/gpt-5.6-sol`
و`openai/gpt-5.6-terra` و`openai/gpt-5.6-luna`. وتتيح النماذج الثلاثة
استدلال `xhigh` و`max` في الكتالوج الحالي. تصف OpenAI نموذج Sol بأنه
الفئة الرائدة، وTerra بأنه الفئة المتوازنة، وLuna بأنه الفئة السريعة
والأقل تكلفة. راجع
[إعلان إطلاق GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
و[دليل الوصول](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

عند استخدام مصادقة OpenAI المباشرة بمفتاح API، يكون المعرّف المجرّد `openai/gpt-5.6` اسمًا مستعارًا لـ
Sol والقيمة الافتراضية للإعداد الجديد. ولا يطبق كتالوج Codex الأصلي
هذا الاسم المستعار لـ API المباشر من جانب العميل؛ وبحسب صلاحية وصول مساحة العمل، يمكنه عرض
معرّفات Sol وTerra وLuna الدقيقة. لذلك يستخدم إعداد OAuth الجديد لـ ChatGPT/Codex
‏`openai/gpt-5.6-sol`. تحقّق من الحساب الحالي باستخدام:

```bash
openclaw models list --provider openai
```

قد تختلف صلاحية وصول مؤسسة API عن صلاحية وصول مساحة عمل Codex. إذا لم يكن GPT-5.6
متاحًا، فحدد GPT-5.5 صراحةً:

```bash
openclaw models set openai/gpt-5.5
```

يعرض OpenClaw خطأ الوصول الصادر من المصدر ولا يستبدل ضمنيًا
اختيار GPT-5.6 بـ GPT-5.5.

<Note>
قد تختار مسارات HTTPS الرسمية الدقيقة والمؤهلة Plugin خادم تطبيق Codex
المضمّن عندما تكون سياسة وقت التشغيل غير مضبوطة أو مضبوطة على `auto`؛ وتظل مسارات Completions المُنشأة
ونقاط النهاية المخصصة وتجاوزات نقل الطلبات على OpenClaw. تُرفض
نقاط نهاية HTTP الرسمية ذات النص الصريح. وتظل تهيئة وقت التشغيل الصريحة للمزوّد/النموذج
هي المرجع الحاكم. شغّل `openclaw doctor --fix` لإصلاح مراجع نماذج Codex القديمة
المتبقية، أو مراجع `codex-cli/*`، أو عمليات تثبيت جلسات وقت التشغيل القديمة التي لم تضبطها
تهيئة وقت تشغيل صريحة.
</Note>

## تغطية ميزات OpenClaw

| قدرة OpenAI             | سطح OpenClaw                                                                                 | الحالة                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| الدردشة / الاستجابات      | موفّر النموذج `openai/<model>`                                                              | نعم                                                                       |
| نماذج اشتراك Codex        | `openai/<model>` مع OpenAI OAuth                                                            | نعم                                                                       |
| مراجع نماذج Codex القديمة | مراجع نماذج Codex القديمة، `codex-cli/<model>`                                                 | يُصلحها doctor إلى `openai/<model>`                                     |
| بيئة تشغيل خادم تطبيق Codex | مسار HTTPS متوافق مع Codex مع عدم تعيين وقت التشغيل/`auto`، أو `agentRuntime.id: codex` صريح | نعم                                                                       |
| البحث على الويب من جانب الخادم | أداة OpenAI Responses الأصلية                                                               | نعم، عند تمكين البحث على الويب وعدم تثبيت موفّر آخر                       |
| الصور                     | `image_generate`                                                                            | نعم                                                                       |
| مقاطع الفيديو             | `video_generate`                                                                            | نعم                                                                       |
| تحويل النص إلى كلام       | `messages.tts.provider: "openai"` / `tts`                                                       | نعم                                                                       |
| تحويل الكلام إلى نص على دفعات | `tools.media.audio` / فهم الوسائط                                                          | نعم                                                                       |
| تحويل الكلام إلى نص بالبث | Voice Call `streaming.provider: "openai"`                                                                 | نعم                                                                       |
| الصوت في الوقت الفعلي     | Voice Call `realtime.provider: "openai"` / حديث Control UI `talk.realtime.provider: "openai"`                            | نعم (مفتاح OpenAI Platform API)                                           |
| التضمينات                 | موفّر تضمينات الذاكرة                                                                        | نعم                                                                       |

<Note>
يمر صوت OpenAI في الوقت الفعلي عبر **OpenAI Platform Realtime
API** العام ويتطلب مفتاح Platform API. أما رموز Codex OAuth فتصادق على
واجهة ChatGPT Codex الخلفية بدلًا من ذلك؛ ولا يمكن استخدامها بالتبادل مع مفاتيح Platform API
لنقاط نهاية Realtime العامة.

إذا أبلغت المصادقة بمفتاح API عن عدم وجود رصيد فوترة، فأضف رصيدًا إلى Platform عبر
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
للمؤسسة التي تدعم بيانات اعتماد الوقت الفعلي عند استخدام المصادقة بمفتاح API.
يقبل الصوت في الوقت الفعلي ملف تعريف المصادقة بمفتاح API ‏`openai` الذي أنشأه
`openclaw onboard --auth-choice openai-api-key`، أو مفتاح Platform API المعيّن عبر
`talk.realtime.providers.openai.apiKey` لحديث Control UI، أو
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` لـ Voice
Call، أو متغير البيئة `OPENAI_API_KEY`.
</Note>

## تضمينات الذاكرة

يمكن لـ OpenClaw استخدام OpenAI، أو نقطة نهاية تضمين متوافقة مع OpenAI، من أجل
فهرسة `memory_search` وتضمينات الاستعلامات:

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
`queryInputType` و`documentInputType` ضمن `memorySearch`. يمرّر OpenClaw
هذه القيم كحقول طلب `input_type` خاصة بالموفّر: تستخدم تضمينات
الاستعلام `queryInputType`؛ وتستخدم مقاطع الذاكرة المفهرسة والفهرسة على دفعات
`documentInputType`. راجع
[مرجع إعداد الذاكرة](/ar/reference/memory-config#provider-specific-config)
للاطلاع على المثال الكامل.

## بدء الاستخدام

<Tabs>
  <Tab title="مفتاح API ‏(OpenAI Platform)">
    **الأنسب لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API">
        أنشئ مفتاح API أو انسخه من [لوحة معلومات OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
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

    ### ملخص المسارات

    | مرجع النموذج       | سياسة وقت التشغيل أو حقائق المسار                                | المسار                    | المصادقة                              |
    | ------------------ | ----------------------------------------------------------------- | ------------------------- | ------------------------------------- |
    | `openai/gpt-5.6` | غير معيّن/`auto`، مسار أصلي رسمي مطابق تمامًا عبر HTTPS، دون تجاوز للطلب | قد يُحدّد Codex           | ملف تعريف مصادقة بمفتاح API مرتّب     |
    | `openai/gpt-5.6` | الموفّر/النموذج `agentRuntime.id: "openclaw"`                                | وقت تشغيل OpenClaw المضمّن | ملف تعريف مفتاح API ‏`openai` المحدد |
    | `openai/gpt-5.5` | الموفّر/النموذج الصريح `agentRuntime.id`                         | وقت تشغيل الوكيل المحدد   | ملف تعريف مفتاح OpenAI API المحدد     |
    | `openai/*` | Completions منشأة، أو مخصصة، أو تجاوز للطلب                       | وقت تشغيل OpenClaw المضمّن | يظل نوع بيانات الاعتماد دون تغيير     |
    | `openai/*` | نقطة نهاية HTTP رسمية بنص صريح                                    | مرفوض                     | لا تُرسل بيانات الاعتماد              |

    <Note>
    عند عدم تعيين وقت التشغيل أو استخدام `auto`، لا يمكن إلا لمسار أصلي رسمي
    مؤهل ومطابق تمامًا عبر HTTPS أن يحدد ضمنيًا بيئة تشغيل خادم تطبيق Codex. للمصادقة
    بمفتاح API على نموذج وكيل، أنشئ ملف تعريف مصادقة بمفتاح API ‏`openai` ورتّبه باستخدام
    `auth.order.openai`؛ ويظل `OPENAI_API_KEY` الخيار الاحتياطي المباشر لأسطح
    OpenAI API غير الخاصة بالوكلاء. شغّل `openclaw doctor --fix` لترحيل
    إدخالات ترتيب مصادقة Codex القديمة.
    </Note>

    ### مثال على الإعداد

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    يُحل معرّف API المباشر المجرّد `gpt-5.6` إلى فئة Sol. إذا كانت مؤسسة API هذه
    لا تتيح GPT-5.6، فعيّن النموذج الأساسي صراحةً إلى
    `openai/gpt-5.5`.

    لتجربة نموذج Instant الحالي في ChatGPT من OpenAI API، عيّن النموذج
    إلى `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    يمثل `chat-latest` اسمًا مستعارًا متغيرًا. يستخدم إعداد مفتاح OpenAI API الجديد بدلًا منه
    `openai/gpt-5.6`، الذي يُحل معرّفه المجرّد لـ API المباشر إلى Sol. تظل
    النماذج الأساسية الصريحة الحالية، بما فيها `openai/gpt-5.5`، دون تغيير. لا يقبل
    الاسم المستعار `chat-latest` إلا إسهاب النص `medium`؛ ويفرض OpenClaw
    أي إسهاب آخر مطلوب على `medium` لهذا النموذج.

    <Warning>
    لا يتيح OpenClaw ‏`gpt-5.3-codex-spark` عبر مسار مفتاح OpenAI
    API المباشر. ولا يتوفر إلا من خلال إدخالات كتالوج اشتراك Codex
    عندما يتيحه حسابك المسجّل دخوله.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأنسب لـ:** استخدام اشتراك ChatGPT/Codex مع تنفيذ خادم تطبيق Codex
    الأصلي بدلًا من مفتاح API منفصل. تتطلب سحابة Codex
    تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        أو شغّل OAuth مباشرةً:

        ```bash
        openclaw models auth login --provider openai
        ```

        في عمليات الإعداد عديمة الواجهة أو التي لا تدعم رد الاتصال، أضف `--device-code` لتسجيل
        الدخول باستخدام تدفق رمز جهاز ChatGPT بدلًا من رد اتصال متصفح
        المضيف المحلي:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="استخدم مسار نموذج OpenAI القياسي">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        لا يلزم إعداد لوقت التشغيل لهذا المسار الأصلي الرسمي المطابق تمامًا عبر HTTPS.
        وقد يحدد وقت تشغيل خادم تطبيق Codex تلقائيًا، كما يثبّت
        OpenClaw‏ Plugin ‏Codex المضمّن أو يصلحه عند اختيار وقت التشغيل هذا.
      </Step>
      <Step title="تحقق من توفر مصادقة Codex">
        ```bash
        openclaw models list --provider openai
        ```

        بعد تشغيل Gateway، أرسل `/codex status` أو `/codex models`
        في الدردشة للتحقق من وقت تشغيل خادم التطبيق الأصلي.
      </Step>
    </Steps>

    ### ملخص المسارات

    | مرجع النموذج               | سياسة وقت التشغيل أو حقائق المسار                                | المسار                                                   | المصادقة                                              |
    | -------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------- |
    | `openai/gpt-5.6-sol`         | غير معيّن/`auto`، مسار أصلي رسمي مطابق تمامًا عبر HTTPS، دون تجاوز للطلب | قد يُحدّد Codex                                          | تسجيل الدخول إلى Codex، أو ملف تعريف مصادقة `openai` مرتّب |
    | `openai/gpt-5.6-terra`         | غير معيّن/`auto`، مسار أصلي رسمي مطابق تمامًا عبر HTTPS، دون تجاوز للطلب | قد يُحدّد Codex                                          | تسجيل الدخول إلى Codex عندما يتيح الكتالوج Terra     |
    | `openai/gpt-5.6-luna`         | غير معيّن/`auto`، مسار أصلي رسمي مطابق تمامًا عبر HTTPS، دون تجاوز للطلب | قد يُحدّد Codex                                          | تسجيل الدخول إلى Codex عندما يتيح الكتالوج Luna      |
    | `openai/gpt-5.6-sol`         | الموفّر/النموذج `agentRuntime.id: "openclaw"`                                | وقت تشغيل OpenClaw المضمّن، ونقل داخلي لمصادقة Codex     | ملف تعريف OAuth ‏`openai` المحدد           |
    | `openai/gpt-5.5`         | الموفّر/النموذج الصريح `agentRuntime.id`                         | وقت تشغيل الوكيل المحدد                                  | ملف تعريف مصادقة OpenAI المحدد                        |
    | `openai/*`         | Completions منشأة، أو مخصصة، أو تجاوز للطلب                       | وقت تشغيل OpenClaw المضمّن                               | يظل متطلب بيانات الاعتماد خاصًا بالمسار               |
    | `openai/*`         | نقطة نهاية HTTP رسمية بنص صريح                                    | مرفوض                                                    | لا تُرسل بيانات الاعتماد                               |
    | مرجع Codex GPT-5.5 القديم  | يُصلحه doctor                                                     | يُعاد كتابته إلى `openai/gpt-5.5`                      | ملف تعريف OpenAI OAuth مُرحّل                         |
    | `codex-cli/gpt-5.5`         | يُصلحه doctor                                                     | يُعاد كتابته إلى `openai/gpt-5.5`                      | مصادقة خادم تطبيق Codex                               |

    <Warning>
    يستخدم الإعداد الجديد المدعوم باشتراك القيمة الدقيقة `openai/gpt-5.6-sol`؛ وقد
    يعرض كتالوج Codex الأصلي أيضًا مراجع Terra أو Luna الدقيقة. إذا كان
    الحساب لا يتيح GPT-5.6، فحدّد `openai/gpt-5.5` صراحةً. مراجع
    Codex GPT الأقدم هي مسارات OpenClaw قديمة، وليست مسار وقت تشغيل Codex
    الأصلي؛ شغّل `openclaw doctor --fix` لترحيلها من دون ترقية
    تحديد GPT-5.5 صريح موجود. يظل `gpt-5.3-codex-spark` مقتصرًا
    على الحسابات التي يعلن كتالوج اشتراك Codex فيها عن إتاحته؛ وتظل مراجع
    مفتاح API المباشر لـ OpenAI وAzure الخاصة به محجوبة.
    </Warning>

    <Note>
    ينبغي أن يضع الإعداد الجديد ترتيب مصادقة وكيل OpenAI ضمن `auth.order.openai`؛
    ويرحّل doctor إدخالات ترتيب مصادقة Codex القديمة.
    </Note>

    ### مثال على الإعداد

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    عند استخدام مفتاح API احتياطي، أبقِ النموذج المحدد ضمن `openai/*` وضع
    ترتيب المصادقة ضمن `openai`. يحاول OpenClaw استخدام الاشتراك أولًا، ثم
    مفتاح API، مع البقاء على منظومة Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
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
    لم تعد عملية الإعداد الأولي تستورد مواد OAuth من `~/.codex`. سجّل الدخول
    باستخدام OAuth عبر المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه؛ يدير OpenClaw
    بيانات الاعتماد الناتجة في مخزن مصادقة الوكيل الخاص به.
    </Note>

    ### فحص مسارات OAuth في Codex واستعادتها

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

    إذا كان إعداد أقدم لا يزال يحتوي على مراجع Codex GPT قديمة، أو تثبيتًا قديمًا
    لجلسة وقت تشغيل OpenAI من دون إعداد صريح لوقت التشغيل، فأصلحه:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    إذا لم يعرض `models auth list --provider openai` أي ملف تعريف صالح للاستخدام، فسجّل الدخول
    مجددًا:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    استخدم `--profile-id` لعمليات تسجيل دخول OAuth متعددة إلى Codex في الوكيل نفسه، ثم
    تحكّم فيها عبر ترتيب المصادقة أو `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    شغّل `openclaw doctor --fix` لترحيل معرّفات ملفات التعريف وإدخالات الترتيب
    ذات بادئة OpenAI Codex القديمة قبل الاعتماد على ترتيب ملفات التعريف.

    ### مؤشر الحالة

    يعرض `/status` في المحادثة وقت تشغيل النموذج النشط للجلسة الحالية.
    تظهر منظومة خادم تطبيق Codex المضمّنة باسم
    `Runtime: OpenAI Codex` عندما يحددها مسار ضمني مؤهل أو
    نهج صريح لوقت تشغيل المزوّد/النموذج.

    ### تحذير doctor

    إذا بقيت مراجع نماذج Codex القديمة أو تثبيتات وقت تشغيل OpenAI القديمة في الإعداد
    أو حالة الجلسة، فإن `openclaw doctor --fix` يعيد كتابتها إلى `openai/*` باستخدام
    وقت تشغيل Codex ما لم يكن OpenClaw معدًّا صراحةً.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات النموذج الوصفية وحد سياق وقت التشغيل بوصفهما
    قيمتين منفصلتين. بالنسبة إلى `openai/gpt-5.5` عبر كتالوج OAuth في Codex:

    - `contextWindow` الأصلي: `400000`
    - حد `contextTokens` الافتراضي لوقت التشغيل: `272000`

    يوفر الحد الافتراضي الأصغر خصائص أفضل لزمن الاستجابة والجودة
    عمليًا. تجاوزه باستخدام `contextTokens`:

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
    استخدم `contextWindow` لتعريف بيانات النموذج الأصلية الوصفية. استخدم `contextTokens`
    للحد من ميزانية سياق وقت التشغيل. يبلغ مسار مفتاح API المباشر لـ OpenAI
    عن `contextWindow` أصلي أكبر (`1000000`) لـ `gpt-5.5`؛ ويجري
    تتبع المسارين بصورة منفصلة لأن الكتالوجات المصدرية تختلف.
    </Note>

    ### استعادة الكتالوج

    يستخدم OpenClaw بيانات كتالوج Codex المصدرية الوصفية لـ `gpt-5.5` عند
    وجودها. إذا أغفل اكتشاف Codex المباشر صف `gpt-5.5` مع كون الحساب
    مصادقًا عليه، ينشئ OpenClaw صف نموذج OAuth هذا كي لا تفشل عمليات Cron
    والوكيل الفرعي وعمليات النموذج الافتراضي المعدّ مع
    `Unknown model`.

  </Tab>
</Tabs>

## مصادقة خادم تطبيق Codex الأصلي

تستخدم منظومة خادم تطبيق Codex الأصلية مراجع نماذج `openai/*` عندما يحددها ضمنيًا
مسار HTTPS رسمي دقيق ومؤهل، أو عندما يحددها صراحةً
`agentRuntime.id: "codex"` الخاص بالمزوّد/النموذج. تظل مصادقتها
معتمدة على الحساب. يحدد OpenClaw المصادقة بهذا الترتيب:

1. ملفات تعريف مصادقة OpenAI المرتبة للوكيل، ويُفضّل أن تكون ضمن
   `auth.order.openai`. شغّل `openclaw doctor --fix` لترحيل معرّفات ملفات تعريف
   مصادقة Codex القديمة وترتيب المصادقة.
2. الحساب الموجود في خادم التطبيق، مثل تسجيل دخول ChatGPT
   محلي عبر Codex CLI. بالنسبة إلى مجلد الوكيل المعزول الافتراضي، يصل OpenClaw حساب
   CLI الأصلي هذا بخادم التطبيق عبر RPC لتسجيل الدخول؛ ولا يشارك
   إعدادات CLI أو plugins الخاصة به أو مخزن سلاسل المحادثات.
3. لتشغيل خادم التطبيق محليًا عبر stdio فقط، وفقط عندما يبلغ خادم التطبيق
   عن عدم وجود حساب: `CODEX_API_KEY`، ثم `OPENAI_API_KEY`.

لا يُستبدل تسجيل دخول محلي باشتراك ChatGPT/Codex لمجرد أن
عملية Gateway تحتوي أيضًا على `OPENAI_API_KEY` لنماذج OpenAI المباشرة أو
التضمينات. ينطبق الرجوع الاحتياطي إلى مفتاح API من البيئة فقط على مسار stdio المحلي
الذي لا يحتوي على حساب؛ ولا يُرسل أبدًا عبر اتصالات خادم التطبيق باستخدام WebSocket. عند
تحديد ملف تعريف Codex بنمط الاشتراك، يمنع OpenClaw أيضًا
`CODEX_API_KEY` و`OPENAI_API_KEY` من الوصول إلى عملية خادم التطبيق الفرعية المشغّلة عبر stdio،
ويرسل بيانات الاعتماد المحددة عبر RPC لتسجيل الدخول إلى خادم التطبيق بدلًا من ذلك.

عندما يُحظر ملف تعريف الاشتراك هذا بسبب حد استخدام Codex، يضع OpenClaw
علامة الحظر على ملف التعريف حتى وقت إعادة الضبط الذي يعلنه Codex، ويسمح لترتيب المصادقة
بالانتقال إلى ملف تعريف `openai:*` التالي، من دون تغيير النموذج المحدد
أو الخروج من منظومة Codex. بعد انقضاء وقت إعادة الضبط، يصبح
ملف تعريف الاشتراك مؤهلًا مجددًا.

## توليد الصور

يسجّل plugin المضمّن `openai` توليد الصور عبر
أداة `image_generate`. وهو يدعم توليد الصور باستخدام مفتاح API لـ OpenAI وOAuth في Codex
عبر مرجع النموذج `openai/gpt-image-2` نفسه.

| الإمكانية                 | مفتاح API لـ OpenAI               | OAuth في Codex                       |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| مرجع النموذج              | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| المصادقة                  | `OPENAI_API_KEY`                   | تسجيل الدخول عبر OAuth إلى OpenAI Codex |
| النقل                     | OpenAI Images API                  | واجهة Codex Responses الخلفية        |
| الحد الأقصى للصور في الطلب | 4                                  | 4                                    |
| وضع التحرير               | مفعّل (حتى 5 صور مرجعية)           | مفعّل (حتى 5 صور مرجعية)             |
| تجاوزات الحجم             | مدعومة، بما في ذلك أحجام 2K/4K     | مدعومة، بما في ذلك أحجام 2K/4K       |
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
راجع [توليد الصور](/ar/tools/image-generation) للاطلاع على معاملات الأداة المشتركة
وتحديد المزوّد وسلوك تجاوز الفشل.
</Note>

`gpt-image-2` هو الخيار الافتراضي لتوليد الصور من النص وتحرير الصور عبر OpenAI.
تظل `gpt-image-1.5` و`gpt-image-1` و`gpt-image-1-mini` قابلة للاستخدام
كتجاوزات صريحة للنموذج. استخدم `openai/gpt-image-1.5` لإخراج PNG/WebP
بخلفية شفافة؛ ترفض واجهة `gpt-image-2` الحالية
`background: "transparent"`.

لطلب بخلفية شفافة، استدعِ `image_generate` باستخدام
`model: "openai/gpt-image-1.5"` أو `outputFormat: "png"` أو `"webp"`، و
`background: "transparent"`؛ لا يزال خيار المزوّد الأقدم `openai.background`
مقبولًا. يحمي OpenClaw أيضًا مساري OpenAI العام وOAuth في OpenAI Codex
من خلال إعادة كتابة طلبات `openai/gpt-image-2` الشفافة الافتراضية إلى
`gpt-image-1.5`؛ وتحتفظ Azure ونقاط النهاية المخصصة المتوافقة مع OpenAI
بأسماء عمليات النشر/النماذج المعدّة لديها.

يتوفر الإعداد نفسه لعمليات CLI من دون واجهة رسومية:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "ملصق دائرة حمراء بسيط على خلفية شفافة" \
  --json
```

استخدم علامتي `--output-format` و`--background` نفسيهما مع
`openclaw infer image edit` عند البدء من ملف إدخال.
يظل `--openai-background` متاحًا كاسم بديل خاص بـ OpenAI. استخدم
`--quality low|medium|high|auto` للتحكم في جودة OpenAI Images وتكلفتها.
استخدم `--openai-moderation low|auto` لتمرير تلميح الإشراف الخاص بـ OpenAI من
`image generate` أو `image edit`.

بالنسبة إلى عمليات تثبيت OAuth عبر ChatGPT/Codex، أبقِ مرجع `openai/gpt-image-2` نفسه. عند
إعداد ملف تعريف OAuth من نوع `openai`، يحل OpenClaw رمز وصول OAuth
المخزّن ويرسل طلبات الصور عبر واجهة Codex Responses الخلفية؛ ولا
يحاول أولًا استخدام `OPENAI_API_KEY` ولا يرجع بصمت إلى مفتاح API.
اضبط `models.providers.openai` صراحةً باستخدام مفتاح API أو عنوان URL أساسي مخصص
أو نقطة نهاية Azure عندما تريد استخدام مسار OpenAI Images API المباشر
بدلًا من ذلك. إذا كانت نقطة نهاية الصور المخصصة هذه على شبكة LAN موثوقة أو عنوان خاص،
فاضبط أيضًا `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ إذ
يبقي OpenClaw نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محظورة ما لم
يكن هذا الاشتراك الصريح موجودًا.

التوليد:

```
/tool image_generate model=openai/gpt-image-2 prompt="ملصق إطلاق مصقول لـ OpenClaw على macOS" size=3840x2160 count=1
```

توليد صورة PNG شفافة:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="ملصق دائرة حمراء بسيط على خلفية شفافة" outputFormat=png background=transparent
```

التحرير:

```
/tool image_generate model=openai/gpt-image-2 prompt="حافظ على شكل العنصر، وغيّر مادته إلى زجاج شفاف جزئيًا" image=/path/to/reference.png size=1024x1536
```

## توليد الفيديو

يسجّل plugin المضمّن `openai` توليد الفيديو عبر
أداة `video_generate`.

| الإمكانية        | القيمة                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2`                                                                    |
| الأوضاع          | تحويل النص إلى فيديو، وتحويل الصورة إلى فيديو، وتحرير فيديو واحد                 |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد                                                          |
| تجاوزات الحجم    | مدعومة لتحويل النص إلى فيديو وتحويل الصورة إلى فيديو                             |
| نسبة العرض إلى الارتفاع | تُحوّل إلى أقرب حجم مدعوم، ولا تُمرر بصورتها الخام                          |
| التجاوزات الأخرى | `resolution` و`audio` و`watermark` غير مدعومة وتُسقط مع تحذير من الأداة |

تستخدم طلبات تحويل الصور إلى فيديو في OpenAI ‏`POST /v1/videos` مع صورة
`input_reference`. وتستخدم تعديلات الفيديو الواحد `POST /v1/videos/edits` مع
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
راجع [إنشاء الفيديو](/ar/tools/video-generation) للاطلاع على معلمات الأداة المشتركة،
واختيار المزوّد، وسلوك تجاوز الفشل.

يصرّح مزوّد OpenAI عن `supportsSize`، لكن ليس عن `supportsAspectRatio` أو
`supportsResolution`. تحوّل طبقة التسوية المشتركة في OpenClaw قيمة
`aspectRatio` المطلوبة إلى أقرب قيمة `size` مطابقة في OpenAI قبل أن
يصل الطلب إلى المزوّد، لذلك تظل طلبات نسبة العرض إلى الارتفاع تعمل عمومًا.
ليس لدى `resolution` بديل للحجم، لذا تُسقط وتُعرض للمستدعي على أنها
`Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## مساهمة موجّه GPT-5

يضيف OpenClaw مساهمة مشتركة في موجّه GPT-5 لنماذج عائلة GPT-5 لدى
المزوّد `openai` (بما في ذلك مراجع Codex القديمة السابقة للإصلاح التي تُسوّى
إلى `openai/*`). لا تتلقى المزوّدات الأخرى التي توفر أيضًا معرّفات نماذج عائلة GPT-5،
مثل مسارات OpenRouter أو opencode، هذه الطبقة؛ إذ تعتمد بوابتها على
معرّف المزوّد `openai`، لا على معرّف النموذج وحده. ولا تتلقاها نماذج GPT-4.x
الأقدم مطلقًا.

لا يتلقى إطار خادم التطبيق الأصلي في Codex عقد سلوك الشخصية والانضباط
في استخدام الأدوات، ولا طبقة أسلوب التفاعل الودّي، عبر تعليمات المطوّر؛
إذ يحتفظ Codex الأصلي بسلوك الأساس والنموذج ووثائق المشروع الذي يملكه Codex،
ويعطّل OpenClaw الشخصية المضمّنة في Codex لسلاسل المحادثات الأصلية كي تظل
ملفات شخصية مساحة عمل الوكيل هي المرجع المعتمد. ولا يضيف OpenClaw إلى سلاسل
Codex الأصلية سوى سياق وقت التشغيل: تسليم القنوات، وأدوات OpenClaw الديناميكية،
وتفويض ACP، وسياق مساحة العمل، وSkills في OpenClaw. ويُعد نص إرشادات Heartbeat
من هذه المساهمة نفسها الاستثناء الوحيد: إذ تتلقى دورات Heartbeat الأصلية في Codex
هذا النص، ويُحقن بوصفه تعليمات تعاون مخصصة بدلًا من حقنه عبر
خطاف مساهمة الموجّه المشتركة.

تضيف مساهمة GPT-5 عقد سلوك موسومًا لاستمرار الشخصية، وسلامة التنفيذ،
والانضباط في استخدام الأدوات، وشكل المخرجات، وفحوصات الإكمال، والتحقق في
الموجّهات المطابقة التي يجمعها OpenClaw. يظل سلوك الرد الخاص بالقنوات والرسائل
الصامتة ضمن موجّه نظام OpenClaw المشترك وسياسة التسليم الصادر. أما طبقة
أسلوب التفاعل الودّي فهي منفصلة وقابلة للتهيئة.

| القيمة                  | التأثير                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (الافتراضي) | تفعيل طبقة أسلوب التفاعل الودّي |
| `"on"`                 | اسم مستعار لـ `"friendly"`                      |
| `"off"`                | تعطيل طبقة الأسلوب الودّي فقط       |

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
لا تتأثر القيم بحالة الأحرف في وقت التشغيل، لذا يعطّل كل من `"Off"` و`"off"`
طبقة الأسلوب الودّي.
</Tip>

<Note>
لا تزال قيمة `plugins.entries.openai.config.personality` القديمة تُقرأ
بوصفها بديل توافق عندما لا يكون إعداد
`agents.defaults.promptOverlays.gpt5.personality` المشترك معيّنًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="تركيب الكلام (TTS)">
    يسجّل Plugin المضمّن `openai` تركيب الكلام لواجهة
    `messages.tts`.

    | الإعداد      | مسار التهيئة                                            | القيمة الافتراضية                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | النموذج        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | الصوت        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | السرعة        | `messages.tts.providers.openai.speed`                  | (غير معيّن)                          |
    | التعليمات | `messages.tts.providers.openai.instructions`           | (غير معيّن، لـ `gpt-4o-mini-tts` فقط)  |
    | التنسيق       | `messages.tts.providers.openai.responseFormat`         | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API      | `messages.tts.providers.openai.apiKey`                 | يعود إلى `OPENAI_API_KEY` عند التعذر   |
    | عنوان URL الأساسي     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | محتوى إضافي   | `messages.tts.providers.openai.extraBody` / `extra_body` | (غير معيّن)                        |

    النماذج المتاحة: `gpt-4o-mini-tts`، و`tts-1`، و`tts-1-hd`. الأصوات المتاحة:
    `alloy`، و`ash`، و`ballad`، و`cedar`، و`coral`، و`echo`، و`fable`، و`juniper`،
    و`marin`، و`onyx`، و`nova`، و`sage`، و`shimmer`، و`verse`.

    يُدمج `extraBody` في JSON طلب `/audio/speech` بعد الحقول التي
    ينشئها OpenClaw، لذا استخدمه مع نقاط النهاية المتوافقة مع OpenAI التي تتطلب
    مفاتيح إضافية مثل `lang`. تُتجاهل مفاتيح النموذج الأولي.

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
    عيّن `OPENAI_TTS_BASE_URL` لتجاوز عنوان URL الأساسي لـ TTS من دون التأثير في
    نقطة نهاية API للدردشة. يُهيّأ كل من TTS في OpenAI والصوت في الوقت الفعلي
    باستخدام مفتاح API لمنصة OpenAI؛ ولا يزال بإمكان التثبيتات التي تستخدم OAuth فقط
    استخدام نماذج الدردشة المدعومة بـ Codex، لكن ليس المحادثة الصوتية المباشرة عبر OpenAI.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجّل Plugin المضمّن `openai` تحويل الكلام إلى نص على دفعات عبر
    واجهة النسخ الخاصة بفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST ‏`/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - يُستخدم حيثما تقرأ عملية نسخ الصوت الوارد `tools.media.audio`،
      بما في ذلك مقاطع القنوات الصوتية في Discord ومرفقات الصوت في القنوات

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

    تُمرّر تلميحات اللغة والموجّه إلى OpenAI عند توفيرها من خلال
    تهيئة وسائط الصوت المشتركة أو طلب النسخ الخاص بكل استدعاء.

  </Accordion>

  <Accordion title="النسخ في الوقت الفعلي">
    يسجّل Plugin المضمّن `openai` النسخ في الوقت الفعلي لـ
    Plugin المكالمات الصوتية.

    | الإعداد          | مسار التهيئة                                                          | القيمة الافتراضية |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | النموذج            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة         | `...openai.language`                                                 | (غير معيّن) |
    | الموجّه           | `...openai.prompt`                                                   | (غير معيّن) |
    | مدة الصمت | `...openai.silenceDurationMs`                                        | `800`   |
    | عتبة VAD    | `...openai.vadThreshold`                                             | `0.5`   |
    | المصادقة             | `...openai.apiKey`، أو `OPENAI_API_KEY`، أو ملف تعريف مفتاح API ‏`openai`    | يلزم مفتاح API للمنصة |

    <Note>
    يستخدم اتصال WebSocket بـ `wss://api.openai.com/v1/realtime` مع صوت
    G.711 u-law ‏(`g711_ulaw` / `audio/pcmu`). بالنسبة إلى ملف تعريف مفتاح API ‏`openai`،
    ينشئ Gateway سر عميل مؤقتًا للنسخ في الوقت الفعلي قبل فتح اتصال WebSocket.
    هذا المزوّد المتدفق مخصص لمسار النسخ في الوقت الفعلي في المكالمات الصوتية؛
    يسجّل Discord الصوتي حاليًا مقاطع قصيرة ويستخدم مسار النسخ على دفعات
    `tools.media.audio` بدلًا من ذلك.
    </Note>

  </Accordion>

  <Accordion title="الصوت في الوقت الفعلي">
    يسجّل Plugin المضمّن `openai` الصوت في الوقت الفعلي لـ Plugin
    المكالمات الصوتية.

    | الإعداد                               | مسار التهيئة                                                              | القيمة الافتراضية             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | النموذج                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | الصوت                                  | `...openai.voice`                                                       | `alloy`             |
    | درجة الحرارة (جسر نشر Azure)  | `...openai.temperature`                                                 | `0.8`               |
    | عتبة VAD                          | `...openai.vadThreshold`                                                | `0.5`                |
    | مدة الصمت                       | `...openai.silenceDurationMs`                                           | `500`                |
    | حشو البادئة                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | جهد الاستدلال                       | `...openai.reasoningEffort`                                             | (غير معيّن)              |
    | المصادقة                                   | ملف تعريف مفتاح API ‏`openai`، أو `...openai.apiKey`، أو `OPENAI_API_KEY` | يلزم مفتاح API لمنصة OpenAI |

    أصوات الوقت الفعلي المضمّنة المتاحة لـ `gpt-realtime-2.1`: ‏`alloy`، و`ash`،
    و`ballad`، و`coral`، و`echo`، و`sage`، و`shimmer`، و`verse`، و`marin`، و`cedar`.
    توصي OpenAI باستخدام `marin` و`cedar` للحصول على أفضل جودة في الوقت الفعلي. وهذه
    مجموعة منفصلة عن أصوات تحويل النص إلى كلام المذكورة أعلاه؛ فالصوت المخصص لـ TTS فقط،
    مثل `fable` أو `nova` أو `onyx`، غير صالح لجلسات الوقت الفعلي.
    عيّن النموذج صراحةً إلى `gpt-realtime-2.1-mini` إذا كنت تفضّل
    إصدار Realtime 2.1 الأصغر والأقل تكلفة.

    <Note>
    **GPT-Live (قريبًا).** حلّ نموذجا OpenAI مزدوجا الاتجاه بالكامل `gpt-live-1`
    و`gpt-live-1-mini` محل الوضع الصوتي في ChatGPT في يوليو 2026؛ ويجري طرح
    API المطوّرين للمؤسسات التي تتمتع بوصول مبكر. يتعرّف OpenClaw
    على عائلة النماذج، لكنه لا يشغّلها بعد: فجلسات GPT-Live
    تستخدم WebRTC فقط، وتدير تناوب الأدوار بنفسها (من دون VAD)، وتفوّض عمل الوكيل
    عبر بروتوكول أحداث تسليم لا تنفّذه وسائل النقل في الوقت الفعلي لدى OpenClaw
    حتى الآن. تفشل تهيئة نموذج `gpt-live-*` بشكل مغلق، مع
    إرشادات لكل من جسر WebSocket وجلسات Talk في المتصفح، بدلًا من
    توصيل الصوت بصمت من دون وصول إلى الوكيل. كما يُقيّد الوصول إلى API
    لكل مؤسسة OpenAI خلال مرحلة الوصول المبكر. احتفظ بـ `gpt-realtime-2.1` (وهو
    الافتراضي) حتى يتوفر دعم GPT-Live.
    </Note>

    <Note>
    تستخدم جسور OpenAI الخلفية للوقت الفعلي بنية جلسة WebSocket العامة المتاحة
    للوقت الفعلي، والتي لا تقبل `session.temperature`. تظل عمليات نشر Azure OpenAI
    متاحة عبر `azureEndpoint` و`azureDeployment`، وتحتفظ
    ببنية الجلسة المتوافقة مع النشر (بما في ذلك `temperature`).
    تدعم استدعاء الأدوات ثنائي الاتجاه وصوت G.711 u-law.
    </Note>

    <Note>
    يُحدَّد الصوت في الوقت الفعلي عند إنشاء الجلسة. تسمح OpenAI بتغيير معظم
    حقول الجلسة لاحقًا، لكن لا يمكن تغيير الصوت بعد أن يُصدر
    النموذج صوتًا في تلك الجلسة. تعرض OpenClaw حاليًا
    معرّفات الأصوات المضمّنة في الوقت الفعلي كسلاسل نصية.
    </Note>

    <Note>
    تستخدم ميزة Talk في واجهة التحكم جلسات OpenAI في الوقت الفعلي عبر المتصفح، مع سر عميل
    مؤقت يصدره Gateway وتبادل مباشر لـ WebRTC SDP من المتصفح
    مع OpenAI Realtime API. يصدر Gateway سر العميل هذا باستخدام
    بيانات اعتماد `openai` المحددة. تكون للمفاتيح المضبوطة وملفات تعريف مفاتيح API
    و`OPENAI_API_KEY` الأولوية؛ ويُستخدم ملف تعريف OAuth من نوع `openai` أو تسجيل
    دخول Codex خارجي كخيار احتياطي. تستخدم جسور WebSocket في الوقت الفعلي الخاصة بترحيل Gateway
    والواجهة الخلفية للمكالمات الصوتية ترتيب بيانات الاعتماد نفسه لنقاط نهاية OpenAI الأصلية.
    يتوفر التحقق المباشر للمشرفين باستخدام
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`؛
    وتتحقق مراحل OpenAI من جسر WebSocket للواجهة الخلفية ومن تبادل
    WebRTC SDP في المتصفح، من دون تسجيل الأسرار.
    مرّر `--openai-only` لتشغيل هاتين المرحلتين دون بيانات اعتماد Google.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لمزوّد `openai` المضمّن استهداف مورد Azure OpenAI لتوليد
الصور من خلال تجاوز عنوان URL الأساسي. في مسار توليد الصور، تكتشف OpenClaw
أسماء مضيفي Azure في `models.providers.openai.baseUrl` وتنتقل تلقائيًا إلى
بنية طلب Azure.

<Note>
يستخدم الصوت في الوقت الفعلي مسار إعداد منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **الصوت في الوقت الفعلي**
ضمن [الصوت والكلام](#voice-and-speech) للاطلاع على إعدادات Azure الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- يكون لديك بالفعل اشتراك أو حصة أو اتفاقية مؤسسية في Azure OpenAI
- تحتاج إلى إقامة إقليمية للبيانات أو ضوابط امتثال توفرها Azure
- تريد إبقاء حركة البيانات داخل مستأجر Azure حالي

### الإعداد

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

تتعرّف OpenClaw على لواحق مضيفي Azure التالية لمسار توليد الصور عبر Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

بالنسبة إلى طلبات توليد الصور على مضيف Azure معروف، تقوم OpenClaw بما يلي:

- ترسل ترويسة `api-key` بدلًا من `Authorization: Bearer`
- تستخدم مسارات على نطاق النشر (`/openai/deployments/{deployment}/...`)
- تلحق `?api-version=...` بكل طلب
- تستخدم مهلة طلب افتراضية قدرها 600s لاستدعاءات توليد الصور عبر Azure.
  وتظل قيم `timeoutMs` لكل استدعاء تتجاوز هذه القيمة الافتراضية.

تحتفظ عناوين URL الأساسية الأخرى (OpenAI العامة والوكلاء المتوافقون مع OpenAI)
ببنية طلب الصور القياسية من OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور الخاص بمزوّد `openai`
إصدار OpenClaw 2026.4.22 أو أحدث. تتعامل الإصدارات الأقدم مع أي
`openai.baseUrl` مخصص على أنه نقطة نهاية OpenAI العامة، وتفشل مع عمليات
نشر الصور في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار معاينة أو إصدار GA محدد من Azure
لمسار توليد الصور عبر Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

القيمة الافتراضية هي `2024-12-01-preview` عندما لا يكون المتغير مضبوطًا.

### أسماء النماذج هي أسماء عمليات النشر

تربط Azure OpenAI النماذج بعمليات النشر. بالنسبة إلى طلبات توليد الصور عبر Azure
الموجّهة من خلال مزوّد `openai` المضمّن، يجب أن يكون حقل `model` في OpenClaw
هو **اسم نشر Azure** الذي ضبطته في بوابة Azure، وليس
معرّف نموذج OpenAI العام.

إذا أنشأت عملية نشر باسم `gpt-image-2-prod` تشغّل `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="ملصق أنيق" size=1024x1024 count=1
```

تنطبق قاعدة اسم النشر نفسها على أي استدعاء لتوليد الصور يُوجّه
من خلال مزوّد `openai` المضمّن.

### التوفر الإقليمي

يتوفر توليد الصور عبر Azure حاليًا في مجموعة فرعية فقط من المناطق
(على سبيل المثال `eastus2` و`swedencentral` و`polandcentral` و`westus3`
و`uaenorth`). تحقّق من قائمة المناطق الحالية لدى Microsoft قبل إنشاء
عملية نشر، وتأكد من أن النموذج المحدد متاح في منطقتك.

### اختلافات المعلمات

لا تقبل Azure OpenAI وOpenAI العامة دائمًا معلمات الصور نفسها.
قد ترفض Azure خيارات تسمح بها OpenAI العامة (على سبيل المثال بعض
قيم `background` في `gpt-image-2`) أو تتيحها فقط في إصدارات محددة من
النموذج. تأتي هذه الاختلافات من Azure والنموذج الأساسي، وليس من
OpenClaw. إذا فشل طلب Azure بسبب خطأ في التحقق، فتحقّق من
مجموعة المعلمات التي تدعمها عملية النشر وإصدار API المحددان في
بوابة Azure.

<Note>
تستخدم Azure OpenAI النقل الأصلي وسلوك التوافق، لكنها لا تتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع أكورديون **المسارات الأصلية مقابل المسارات
المتوافقة مع OpenAI** ضمن [الإعداد المتقدم](#advanced-configuration).

بالنسبة إلى حركة المحادثات أو Responses على Azure (بخلاف توليد الصور)، استخدم
مسار الإعداد الأولي أو إعداد مزوّد Azure مخصصًا؛ إذ إن `openai.baseUrl` وحده
لا يعتمد بنية API/المصادقة الخاصة بـ Azure. يوجد مزوّد
`azure-openai-responses/*` منفصل؛ راجع أكورديون Compaction من جانب الخادم
أدناه.
</Note>

## الإعداد المتقدم

تحدد أمثلة `params` لكل نموذج أدناه بنية طلب المزوّد المضمّن في OpenClaw.
يُعد ضبطها سلوكًا مؤلفًا للطلب، ولذلك يظل مسار `auto` المؤهل
بطريقة أخرى على OpenClaw بدلًا من اختيار Codex ضمنيًا. يدير مسخّر خادم تطبيق
Codex الأصلي إعدادات النقل والطلب الخاصة به؛ ويفشل `agentRuntime.id: "codex"`
الصريح بصورة مغلقة عندما لا يكون المسار الفعلي معلنًا على أنه متوافق مع Codex.

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    تستخدم OpenClaw نهج WebSocket أولًا مع الرجوع إلى SSE (`"auto"`) لـ `openai/*`.

    في وضع `"auto"`، تقوم OpenClaw بما يلي:
    - تعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع إلى SSE
    - بعد حدوث فشل، تضع علامة على WebSocket بأنه متدهور لمدة 60 ثانية وتستخدم SSE
      خلال فترة التهدئة
    - تُرفق ترويسات ثابتة لهوية الجلسة والدور من أجل عمليات إعادة المحاولة
      وإعادة الاتصال
    - توحّد عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر
      متغيرات النقل

    | القيمة                | السلوك                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (الافتراضي)   | WebSocket أولًا، مع الرجوع إلى SSE     |
    | `"sse"`              | فرض SSE فقط                    |
    | `"websocket"`        | فرض WebSocket فقط              |

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
    - [Realtime API باستخدام WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [استجابات API المتدفقة (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="الوضع السريع">
    تعرض OpenClaw مفتاح تبديل مشتركًا للوضع السريع لـ `openai/*`:

    - **المحادثة/واجهة المستخدم:** `/fast status|auto|on|off`
    - **الإعداد:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند تمكينه، تربط OpenClaw الوضع السريع بالمعالجة ذات الأولوية في OpenAI
    (`service_tier = "priority"`). تُحفظ قيم `service_tier` الحالية،
    ولا يعيد الوضع السريع كتابة `reasoning` أو
    `text.verbosity`. يبدأ `fastMode: "auto"` استدعاءات النموذج الجديدة في الوضع السريع حتى
    حد الإيقاف التلقائي، ثم يبدأ استدعاءات إعادة المحاولة أو الرجوع أو نتائج الأدوات أو
    المتابعة اللاحقة من دون الوضع السريع. يبلغ حد الإيقاف افتراضيًا 60 ثانية؛
    اضبط `params.fastAutoOnSeconds` في النموذج النشط لتغييره.

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
    تتغلب تجاوزات الجلسة على الإعداد. تؤدي إزالة تجاوز الجلسة في
    واجهة Sessions إلى إعادة الجلسة إلى القيمة الافتراضية المضبوطة.
    </Note>

  </Accordion>

  <Accordion title="المعالجة ذات الأولوية (service_tier)">
    تتيح API الخاصة بـ OpenAI المعالجة ذات الأولوية عبر `service_tier`. اضبطها لكل
    نموذج في OpenClaw:

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
    لا يُمرَّر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية
    (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`).
    إذا وجّهت أيًا من المزوّدين عبر وكيل، فستترك OpenClaw
    `service_tier` دون تغيير.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جانب الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` في `api.openai.com`)، يفعّل
    غلاف تدفق OpenClaw الخاص بـ Plugin ‏OpenAI تلقائيًا
    Compaction من جانب الخادم:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - القيمة الافتراضية لـ `compact_threshold`: ‏70% من `contextWindow` (أو `80000` عند
      عدم توفره)

    ينطبق هذا على مسار وقت تشغيل OpenClaw المضمّن وعلى خطافات مزوّد OpenAI
    التي تستخدمها عمليات التشغيل المضمّنة. يدير مسخّر خادم تطبيق Codex الأصلي
    سياقه الخاص عبر Codex ولا يتأثر بهذا الإعداد.

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
    لا يتحكم `responsesServerCompaction` إلا في حقن `context_management`.
    وتظل نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم يضبط التوافق
    `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT الوكيلي الصارم">
    بالنسبة إلى نماذج عائلة GPT-5 التابعة لمزوّد `openai` والتي تعمل من خلال وقت التشغيل
    المضمّن في OpenClaw، تستخدم OpenClaw افتراضيًا بالفعل عقد تنفيذ أكثر صرامة يسمى
    `strict-agentic`. ويُفعّل تلقائيًا كلما كان المزوّد المحسوم هو
    `openai` وكان معرّف النموذج يطابق عائلة GPT-5، ما لم يختر الإعداد
    صراحةً إلغاء ذلك:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    يُعد تعيين `"strict-agentic"` صراحةً إجراءً بلا تأثير في مسار مدعوم (إذ
    إنه الإعداد الافتراضي بالفعل)، ولا يكون له أي تأثير في أزواج المزوّد/النموذج غير المدعومة.

    عند تفعيل `strict-agentic`، يقوم OpenClaw بما يلي:
    - يفعّل `update_plan` تلقائيًا للأعمال الجوهرية
    - يعيد محاولة الأدوار الفارغة بنيويًا أو التي تحتوي على الاستدلال فقط، مع متابعة
      تتضمن إجابة ظاهرة
    - يستخدم أحداث الخطة الصريحة الخاصة بإطار التشغيل عندما يوفّرها إطار التشغيل
      المحدد

    لا يصنّف OpenClaw نص المساعد لتحديد ما إذا كان الدور
    خطةً أو تحديثًا للتقدم أو إجابةً نهائية.

    <Note>
    يوجد هذا العقد بالكامل داخل مشغّل الوكيل المضمّن في OpenClaw. ولا
    ينطبق على إطار تشغيل خادم تطبيق Codex الأصلي، الذي يدير سلوك
    الأدوار والخطط الخاص به؛ إذ يكون اختيار إطار التشغيل أهم من
    إعداد عقد التنفيذ لعمليات تشغيل Codex الأصلية.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI المباشرة وCodex وAzure OpenAI
    بصورة مختلفة عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

    **المسارات الأصلية** (`openai/*`، Azure OpenAI):
    - يحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم
      مستوى جهد `none` في OpenAI
    - يحذف الاستدلال المعطّل للنماذج أو الوكلاء الذين يرفضون
      `reasoning.effort: "none"`
    - يضبط مخططات الأدوات افتراضيًا على الوضع الصارم
    - يرفق ترويسات إسناد مخفية على المضيفين الأصليين المتحقق منهم فقط (لا
      يتلقى Azure OpenAI هذه الترويسات، رغم أنه مسار أصلي)
    - يحتفظ بتشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier`، `store`،
      توافق الاستدلال، وتلميحات ذاكرة التخزين المؤقت للمطالبات)

    **مسارات الوكيل/المسارات المتوافقة:**
    - يستخدم سلوك توافق أكثر مرونة
    - يزيل `store` الخاص بـ Completions من حمولات `openai-completions` غير الأصلية
    - يقبل JSON المتقدم الممرّر كما هو لـ `params.extra_body`/`params.extraBody`
      لوكلاء Completions المتوافقة مع OpenAI
    - يقبل `params.chat_template_kwargs` لوكلاء Completions المتوافقة مع OpenAI
      مثل vLLM
    - لا يفرض مخططات أدوات صارمة أو ترويسات خاصة بالمسارات الأصلية

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
