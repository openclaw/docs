---
read_when:
    - تريد مفتاحًا مُدارًا واحدًا لعدة مزوّدي نماذج
    - تحتاج إلى اكتشاف نماذج ClawRouter أو الإبلاغ عن الحصة في OpenClaw
summary: وجّه النماذج المقيّدة بنطاق بيانات الاعتماد عبر ClawRouter واعرض الحصص المُدارة
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T14:49:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

يوفّر ClawRouter لـ OpenClaw مفتاحًا واحدًا مقيّدًا بالسياسة لعدة موفّري نماذج
أوليين. لا يكتشف Plugin المضمّن `clawrouter` سوى النماذج المسموح بها
لذلك المفتاح، ويوجّه كل نموذج عبر البروتوكول المعلن له، ويعرض
ميزانية المفتاح وإجمالي استخدامه في واجهات استخدام OpenClaw.

تبقى بيانات اعتماد الجهات الأولية وإعادة التوجيه الخاصة بكل موفّر داخل ClawRouter، لذا
لن تحتاج أبدًا إلى تثبيت Plugin كل موفّر أولي أو مصادقته على
مضيف OpenClaw. يأتي Plugin مضمّنًا مع OpenClaw ‏(`enabledByDefault: true`)؛
ولا تحتاج سوى إلى بيانات اعتماد صادرة عن ClawRouter.

| الخاصية      | القيمة                                    |
| ------------- | ---------------------------------------- |
| الموفّر      | `clawrouter`                             |
| Plugin        | مضمّن (مشمول في OpenClaw)           |
| المصادقة          | `CLAWROUTER_API_KEY`                     |
| عنوان URL الافتراضي   | `https://clawrouter.openclaw.ai`         |
| كتالوج النماذج | مقيّد ببيانات الاعتماد عبر `/v1/catalog`      |
| الحصص        | الميزانية الشهرية والاستخدام عبر `/v1/usage` |

## بدء الاستخدام

<Steps>
  <Step title="الحصول على بيانات اعتماد مقيّدة">
    اطلب من مسؤول ClawRouter بيانات اعتماد تتضمن سياستها
    الموفّرين والنماذج والميزانية الشهرية التي ينبغي استخدامها. لا تظهر بيانات الاعتماد
    إلا مرة واحدة عند إصدارها.
  </Step>
  <Step title="إعداد OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    يأتي `clawrouter` مضمّنًا ومفعّلًا افتراضيًا. إذا كان إعدادك يضبط
    `plugins.allow`، فأضف `clawrouter` إلى تلك القائمة قبل تفعيله. ولعملية
    نشر مخصصة، اضبط `models.providers.clawrouter.baseUrl` على
    أصل ClawRouter؛ والقيمة الافتراضية هي `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="عرض النماذج الممنوحة">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    استخدم مراجع النماذج المُعادة كما تظهر تمامًا. فهي تحتفظ بنطاق الاسم
    الأولي، مثل `clawrouter/openai/gpt-5.5`،
    أو `clawrouter/anthropic/claude-sonnet-4-6`، أو
    `clawrouter/google/gemini-3.5-flash`. إذا كان `agents.defaults.models`
    قائمة سماح في إعدادك، فأضف إليها كل مرجع ClawRouter محدد.

  </Step>
  <Step title="اختيار نموذج">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    يمكن أيضًا اختيار نموذج مُعاد لتشغيل واحد باستخدام
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## النشر المُدار غير التفاعلي

احتفظ بمفتاح الوكيل ضمن آلية حقن الأسرار الخاصة بحِمل العمل، وخزّن
SecretRef فقط في `openclaw.json`. الحقول المُدارة المعتمدة هي:

| الغرض       | حقل الإعداد أو البيئة                                              |
| ------------- | ------------------------------------------------------------------------ |
| أصل الموجّه | `models.providers.clawrouter.baseUrl`                                    |
| بيانات الاعتماد    | `models.providers.clawrouter.apiKey` -> ‏SecretRef للبيئة                    |
| قيمة السر  | `CLAWROUTER_API_KEY` في بيئة عملية Gateway                  |
| النموذج الافتراضي | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| وسم حِمل العمل  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (اختياري) |

على سبيل المثال، يمكن لوحدة تحكم النشر امتلاك رقعة JSON5 التالية:

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

إذا كان النشر يضبط `plugins.allow`، فاحتفظ بإدخالاته الحالية وأضف
`clawrouter`. تحقّق وطبّق من دون معالج تفاعلي:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

يحلّ التشغيل التجريبي SecretRef لكنه لا يطبع قيمته أبدًا. لتدوير
بيانات الاعتماد، حدّث السر الخارجي الذي يوفّر `CLAWROUTER_API_KEY` ثم
أعد تشغيل حِمل عمل Gateway لتحميل بيئة العملية الجديدة. لا يتغير
ملف الإعداد ولا مرجع النموذج.

بالنسبة إلى Gateway مستقل مبني من المصدر ويعمل عبر Docker، يكون ClawRouter مضمنًا بالفعل في
بيئة التشغيل الجذرية. حدّد فقط Plugin القناة الذي يتطلب تحزيمًا منفصلًا،
مثل `OPENCLAW_EXTENSIONS=clickclack` أو `slack` أو `msteams`؛ راجع
[الصور المبنية من المصدر مع Plugins محددة](/ar/install/docker#source-built-images-with-selected-plugins).
يجب على عمليات نشر الأرشيف/الجهاز تحزيم المصدر نفسه الذي تم اعتماده عبر
مسار عناصرها البرمجية بدلًا من استخدام صورة OCI.

## الجاهزية والإثبات المباشر

تثبت هذه الفحوص حدودًا مختلفة؛ لا تستبدل أحدها بآخر:

```bash
# سلامة عملية ClawRouter فقط؛ لا تُختبر بيانات اعتماد أو نموذج أولي.
curl -fsS https://clawrouter.internal.example/v1/health

# جاهزية بدء تشغيل Gateway في OpenClaw فقط؛ لا يُجرى أي استدعاء لنموذج.
curl -fsS http://127.0.0.1:18789/readyz

# اكتشاف الكتالوج المقيّد ببيانات الاعتماد.
openclaw models list --all --provider clawrouter --json

# اختبار استدلال حقيقي أدنى عبر موفّر ClawRouter المُعد.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# اختبار كناري لحِمل العمل باستخدام مرجع دقيق لنموذج ممنوح.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "أجب تمامًا: CLAWROUTER_CANARY_OK" \
  --json
```

استخدم نموذجًا يعيده الكتالوج المقيّد بدلًا من نسخ نموذج المثال
دون تمحيص. تعني استجابة `/readyz` الناجحة أن Gateway يستطيع خدمة
الطلبات؛ ولا تعني أن ClawRouter أو بيانات اعتماده أو أحد الموفّرين
الأوليين جاهز. يُعد اختبار النموذج واختبار الكناري للوكيل إثباتَي الاستدلال.

للتشخيص المباشر، أرسل اختبار الكناري وافحص السجلات القياسية لـ Gateway.
تصدر تشخيصات نقل النماذج الحالية، التي تقتصر على البيانات الوصفية، أسطرًا بالشكل التالي:

```text
[model-fetch] بدء provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] استجابة provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

يرسل Plugin ترويسات `X-ClawRouter-Client` و`X-ClawRouter-Agent-Id` و
`X-ClawRouter-Session-Id` مقيّدة الطول عند توفر تلك المعرّفات. كما أنه
يربط `callId` التشخيصي لاستدعاء النموذج (`<run-id>:model:<n>`) بـ
`X-Request-ID`، وبذلك يمكن ربط حدث استدعاء نموذج في OpenClaw بمسار
تدقيق ClawRouter الذي يقتصر على البيانات الوصفية. تكون القيم ضمن ميزانية معرّف الطلب
البالغة 128 حرفًا متطابقة. تحتفظ القيم الأطول بلاحقة `:model:<n>`
وتجزئة حتمية لكي تظل الاستدعاءات المختلفة مقيّدة الطول وقابلة للربط. يمكن ضبط
البيانات الوصفية الثابتة للنشر مثل `X-ClawRouter-Project-Id` في خريطة `headers`
الخاصة بالموفّر. تحتفظ ترويسات إسناد الوكيل والجلسة بحدّها المنفصل البالغ
256 حرفًا. تستخدم معرّفات الطلب التلقائية التي تحتوي على محارف خارج مجموعة
معرّفات ASCII في ClawRouter الصيغة الحتمية المقيّدة نفسها.
تتغلب الترويسات الصريحة المُعدّة، بما فيها أي صيغة مختلفة لحالة أحرف `X-Request-ID`،
على القيم التلقائية. يسجّل تشخيص النقل بيانات التوجيه الوصفية وبيانات
الاستجابة؛ ولا يسجّل بيانات الاعتماد أو معرّفات الطلبات أو المطالبات أو الإكمالات.
يوفّر حدث التدقيق الخاص بـ ClawRouter الموفّر الأولي المحدد
وحالة الاحتفاظ بالمحتوى.

## اكتشاف النماذج

يعيد `GET /v1/catalog` القيمة `{ providers: [...] }`، حيث يسرد كل إدخال موفّر
`models[]` الخاص به (مع المعرّف الأولي والإمكانات والتسعير) ومسارات
الطلبات المدعومة لديه. لا يأتي OpenClaw بقائمة ثانية ثابتة من
نماذج ClawRouter. يُعلن عن نموذج في الكتالوج كنموذج OpenClaw عندما:

- تمنح سياسة بيانات الاعتماد موفّره؛
- يعلن نموذج الكتالوج عن إمكانية LLM مدعومة (`llm.responses`،
  أو `llm.chat`، أو `llm.messages`، أو `llm.stream` مع مسار بث
  مطابق)؛ و
- يتيح الموفّر مسارًا مطابقًا لأحد وسائل النقل أدناه.

لا تتطلب إضافة نموذج إلى موفّر ClawRouter مدعوم إصدارًا جديدًا من OpenClaw:
يكتشفه تحديث الكتالوج التالي (يُخزّن مؤقتًا لمدة 60 ثانية لكل نطاق بيانات اعتماد).
أما النموذج الذي يحتاج إلى بروتوكول نقل جديد فيتطلب دعم Plugin أولًا.

## Plugins البروتوكولات والموفّرين

يمتلك ClawRouter بيانات الاعتماد الأولية؛ ويُخبر كتالوجه OpenClaw بوسيلة
النقل الواجب استخدامها، لذلك لن تثبّت أبدًا Plugin المصادقة لكل شركة أولية.

| إمكانية/مسار الكتالوج                               | وسيلة نقل OpenClaw     |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses` (موفّر متوافق مع OpenAI)             | `openai-responses`     |
| `llm.chat` (موفّر متوافق مع OpenAI)                  | `openai-completions`   |
| `llm.messages` + مسار `anthropic.messages`              | `anthropic-messages`   |
| `llm.stream` + مسار `google.generate_content` للبث | `google-generative-ai` |

يطبّق Plugin أيضًا سياسات إعادة التشغيل ومخطط الأدوات المطابقة لتلك
العائلات (توافق مخطط أدوات OpenAI/DeepSeek/Gemini/Perplexity؛ وسياسات
إعادة التشغيل الأصلية في Anthropic وGoogle Gemini). تحصل نماذج Perplexity على إعادة
كتابة صارمة للمخطط: تُزال `patternProperties` و`additionalProperties`،
ويعلن كل مخطط كائن عن `properties`، لأن Perplexity يرفض مخططات
الأدوات التي لا تتضمنها. لا يُعلن عمدًا عن موفّر كتالوج لا يتيح سوى
تنسيق طلب غير مدعوم بوصفه نموذجًا نصيًا في OpenClaw. طبّع هؤلاء الموفّرين
إلى أحد العقود المدعومة في ClawRouter بدلًا من إرسال حمولة غير متوافقة.

## الحصص والاستخدام

تغذّي استجابة `/v1/usage` من ClawRouter واجهات استخدام الموفّر المعتادة في
OpenClaw: إجماليات الطلبات والرموز والإنفاق، إضافة إلى نافذة ميزانية شهرية عندما
يكون للمفتاح حد. وتظل المفاتيح غير المقيدة بالقياس تعرض الاستخدام الإجمالي دون
نافذة نسبة مئوية.

يستخدم البحث عن الحصة المفتاح المقيّد نفسه المستخدم لاكتشاف النماذج. لا يؤدي فشل
البحث عن الحصة إلى حظر تنفيذ النموذج.

تحقّق من اللقطة المباشرة باستخدام:

```bash
openclaw status --usage
openclaw models status
```

تتوفر لقطة الموفّر نفسها لـ `/status` في الدردشة وفي
واجهة استخدام OpenClaw. تشمل الميزانية السياسة بأكملها، لذلك يمكن أن تغيّر
الطلبات التي يجريها عميل آخر باستخدام سياسة ClawRouter نفسها النسبة المتبقية.

## استكشاف الأخطاء وإصلاحها

| العَرَض                                  | الفحص                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| لا توجد نماذج ClawRouter                     | تأكد من تفعيل Plugin والسماح به عبر `plugins.allow`، ثم تحقّق من أن بيانات الاعتماد نشطة وتمنح موفّرًا جاهزًا واحدًا على الأقل. |
| نموذج ClawRouter مُعد غير موجود | افحص إمكانية `/v1/catalog` ودعم المسارات لديه. تُصفّى عقود النقل غير المدعومة عمدًا.                            |
| `Unknown model: clawrouter/...`          | أضف مرجع الكتالوج الدقيق إلى `agents.defaults.models` عندما تُستخدم خريطة الإعداد تلك بوصفها قائمة سماح.                               |
| `401` أو `403` من الكتالوج أو الاستخدام     | أعد إصدار بيانات اعتماد ClawRouter أو غيّر نطاقها؛ لا يرجع OpenClaw إلى مفاتيح الموفّرين الأوليين كخيار بديل.                                          |
| يفشل استدعاء النموذج بعد اكتشافه         | تحقّق من اتصال الموفّر وسلامة الجهة الأولية في ClawRouter، ثم أعد المحاولة بعد استعادة حالة جاهزيتها.                                |
| يتضمن الاستخدام إجماليات لكن بلا نسبة مئوية       | السياسة غير مقيدة بالقياس؛ أضف ميزانية شهرية في ClawRouter لإظهار نافذة نسبة مئوية.                                                     |

## سلوك الأمان

- يقتصر اكتشاف الكتالوج على مفتاح الوكيل المُهيأ، ويُخزَّن مؤقتًا لكل نطاق من نطاقات بيانات الاعتماد (دليل الوكيل، ودليل مساحة العمل، ومعرّف ملف تعريف المصادقة، وعنوان URL الأساسي).
- لا يُرفق مفتاح الوكيل إلا عند إرسال الطلب، ولا يُخزَّن في البيانات الوصفية للنموذج.
- تُقتطع قيم الإسناد التلقائي وربط الطلبات، وتُرفض إذا احتوت على محارف تحكم قبل الإرسال. تقتصر قيم الإسناد على 256 محرفًا، وتقتصر معرّفات الطلبات على 128 محرفًا.
- لا تحتوي بيانات تشخيص نقل النموذج إلا على بيانات وصفية، ولا تتضمن مطلقًا مفتاح الوكيل أو محتوى النموذج.
- لا تُعاد كتابة معرّفات نماذج Anthropic وGemini الأصلية إلى معرّفاتها لدى المزوّد الأعلى إلا عند الإرسال.
- تُرفض صفوف الكتالوج غير المدعومة أو غير الممنوحة رفضًا مغلقًا، ولا يمكن تحديدها.

## ذو صلة

<CardGroup cols={2}>
  <Card title="موفّرو النماذج" href="/ar/concepts/model-providers" icon="layers">
    تهيئة الموفّر واختيار النموذج.
  </Card>
  <Card title="تتبّع الاستخدام" href="/ar/concepts/usage-tracking" icon="chart-line">
    واجهات الاستخدام والحالة في OpenClaw.
  </Card>
</CardGroup>
