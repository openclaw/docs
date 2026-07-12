---
read_when:
    - تريد مفتاحًا مُدارًا واحدًا لعدة مزوّدي نماذج
    - تحتاج إلى اكتشاف نماذج ClawRouter أو الإبلاغ عن الحصة في OpenClaw
summary: وجّه النماذج المقيّدة بنطاق بيانات الاعتماد عبر ClawRouter واعرض الحصص المُدارة
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T06:21:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

يمنح ClawRouter ‏OpenClaw مفتاحًا واحدًا مقيّدًا بالسياسة لعدة موفّري نماذج
في المنبع. لا يكتشف Plugin ‏`clawrouter` المضمّن إلا النماذج المسموح بها
لذلك المفتاح، ويوجّه كل نموذج عبر البروتوكول المعلن له، ويعرض
ميزانية المفتاح والاستخدام الإجمالي في واجهات استخدام OpenClaw.

تظل بيانات الاعتماد في المنبع وإعادة التوجيه الخاصة بكل موفّر داخل ClawRouter، لذا
لن تحتاج أبدًا إلى تثبيت Plugin كل موفّر في المنبع أو مصادقته على
مضيف OpenClaw. يأتي Plugin مضمّنًا مع OpenClaw (`enabledByDefault: true`)؛
ولا تحتاج إلا إلى بيانات اعتماد صادرة عن ClawRouter.

| الخاصية      | القيمة                                    |
| ------------- | ---------------------------------------- |
| الموفّر      | `clawrouter`                             |
| Plugin        | مضمّن (مشمول في OpenClaw)           |
| المصادقة          | `CLAWROUTER_API_KEY`                     |
| عنوان URL الافتراضي   | `https://clawrouter.openclaw.ai`         |
| كتالوج النماذج | مقيّد ببيانات الاعتماد عبر `/v1/catalog`      |
| الحصص        | الميزانية الشهرية والاستخدام عبر `/v1/usage` |

## البدء

<Steps>
  <Step title="الحصول على بيانات اعتماد مقيّدة">
    اطلب من مسؤول ClawRouter بيانات اعتماد تتضمن سياستها
    الموفّرين والنماذج والميزانية الشهرية التي ينبغي لك استخدامها. لا تُعرض بيانات الاعتماد
    إلا مرة واحدة عند إصدارها.
  </Step>
  <Step title="تهيئة OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    يأتي `clawrouter` مضمّنًا ومفعّلًا افتراضيًا. إذا كانت تهيئتك تضبط
    `plugins.allow`، فأضف `clawrouter` إلى تلك القائمة قبل تفعيله. ولعملية
    نشر مخصّصة، اضبط `models.providers.clawrouter.baseUrl` على
    أصل ClawRouter؛ والقيمة الافتراضية هي `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="عرض النماذج الممنوحة">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    استخدم مراجع النماذج المُعادة تمامًا كما تظهر. فهي تحتفظ بنطاق أسماء
    المنبع، مثل `clawrouter/openai/gpt-5.5`،
    أو `clawrouter/anthropic/claude-sonnet-4-6`، أو
    `clawrouter/google/gemini-3.5-flash`. إذا كانت `agents.defaults.models`
    قائمة سماح في تهيئتك، فأضف إليها كل مرجع ClawRouter محدد.

  </Step>
  <Step title="اختيار نموذج">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    يمكنك أيضًا اختيار نموذج مُعاد لتشغيل واحد باستخدام
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## النشر المُدار غير التفاعلي

احتفظ بمفتاح الوكيل ضمن آلية حقن الأسرار الخاصة بعبء العمل، ولا تخزّن في
`openclaw.json` إلا SecretRef. الحقول المُدارة القياسية هي:

| الغرض       | حقل التهيئة أو البيئة                                              |
| ------------- | ------------------------------------------------------------------------ |
| أصل الموجّه | `models.providers.clawrouter.baseUrl`                                    |
| بيانات الاعتماد    | `models.providers.clawrouter.apiKey` -> ‏SecretRef بيئي                    |
| قيمة السر  | `CLAWROUTER_API_KEY` في بيئة عملية Gateway                  |
| النموذج الافتراضي | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| وسم عبء العمل  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (اختياري) |

على سبيل المثال، يمكن لوحدة تحكم النشر امتلاك رقعة JSON5 هذه:

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
`clawrouter`. تحقّق من الرقعة وطبّقها دون معالج تفاعلي:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

يحل التشغيل التجريبي SecretRef، لكنه لا يطبع قيمته أبدًا. لتدوير
بيانات الاعتماد، حدّث السر الخارجي الذي يوفّر `CLAWROUTER_API_KEY` ثم
أعد تشغيل عبء عمل Gateway لكي تُحمّل بيئة العملية الجديدة. لا يتغير
ملف التهيئة ولا مرجع النموذج.

بالنسبة إلى Gateway مستقل مبني من المصدر باستخدام Docker، يكون ClawRouter مشمولًا بالفعل في
بيئة التشغيل الجذرية. اختر فقط Plugin القناة الذي يحتاج إلى حزم منفصل،
مثل `OPENCLAW_EXTENSIONS=clickclack`، أو `slack`، أو `msteams`؛ راجع
[الصور المبنية من المصدر مع Plugins محددة](/ar/install/docker#source-built-images-with-selected-plugins).
يجب أن تحزم عمليات نشر الأرشيف/الجهاز المصدر المُدمج نفسه عبر
مسار التحف الخاص بها بدلًا من استهلاك صورة OCI.

## الجاهزية والإثبات الفعلي

تثبت عمليات التحقق هذه حدودًا مختلفة؛ لا تستبدل إحداها بالأخرى:

```bash
# سلامة عملية ClawRouter فقط؛ لا تُختبر بيانات اعتماد ولا نموذج في المنبع.
curl -fsS https://clawrouter.internal.example/v1/health

# جاهزية بدء تشغيل Gateway في OpenClaw فقط؛ لا يُجرى استدعاء نموذج.
curl -fsS http://127.0.0.1:18789/readyz

# اكتشاف الكتالوج المقيّد ببيانات الاعتماد.
openclaw models list --all --provider clawrouter --json

# اختبار استدلال حقيقي بالحد الأدنى عبر موفّر ClawRouter المهيأ.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# اختبار كناري لعبء العمل باستخدام مرجع دقيق لنموذج ممنوح.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Reply exactly: CLAWROUTER_CANARY_OK" \
  --json
```

استخدم نموذجًا يعيده الكتالوج المقيّد بدلًا من نسخ نموذج المثال
دون تحقق. تعني الاستجابة الناجحة من `/readyz` أن Gateway يستطيع خدمة
الطلبات؛ ولا تعني أن ClawRouter أو بيانات اعتماده أو أحد موفّري
المنبع جاهز. يُعد اختبار النموذج واختبار الكناري للوكيل دليلي الاستدلال.

للتشخيص الفعلي، نفّذ اختبار الكناري وافحص سجلات Gateway القياسية.
تصدر تشخيصات نقل النماذج الحالية، التي تقتصر على البيانات الوصفية، أسطرًا بالشكل التالي:

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

يرسل Plugin ترويسات `X-ClawRouter-Client` و`X-ClawRouter-Agent-Id`
و`X-ClawRouter-Session-Id` محدودة الطول عند توفر تلك المعرّفات. كما
يربط `callId` التشخيصي لاستدعاء النموذج (`<run-id>:model:<n>`) مع
`X-Request-ID`، بحيث يمكن ربط حدث استدعاء نموذج في OpenClaw
بسجل تدقيق ClawRouter الذي يقتصر على البيانات الوصفية. تكون القيم الواقعة ضمن
ميزانية معرّف الطلب البالغة 128 محرفًا متطابقة. وتحتفظ القيم الأطول باللاحقة
`:model:<n>` وبصمة حتمية، بحيث تظل الاستدعاءات المختلفة محدودة الطول وقابلة
للربط. يمكن ضبط البيانات الوصفية الثابتة للنشر، مثل
`X-ClawRouter-Project-Id`، في خريطة `headers` الخاصة بالموفّر.
تحتفظ ترويسات إسناد الوكيل والجلسة بحدها المنفصل البالغ 256 محرفًا.
تستخدم معرّفات الطلب التلقائية التي تحتوي على محارف خارج مجموعة معرّفات ASCII
الخاصة بـ ClawRouter الصيغة الحتمية محدودة الطول نفسها.
تتغلب الترويسات المهيأة صراحةً، بما فيها أي صيغة حالة أحرف من `X-Request-ID`،
على القيم التلقائية. يسجّل تشخيص النقل البيانات الوصفية للتوجيه والاستجابة؛
ولا يسجّل بيانات الاعتماد أو معرّفات الطلب أو المطالبات أو الإكمالات.
يوفّر حدث التدقيق الخاص بـ ClawRouter موفّر المنبع المحدد
وحالة الاحتفاظ بالمحتوى.

## اكتشاف النماذج

يعيد `GET /v1/catalog` البنية `{ providers: [...] }`، حيث يسرد كل إدخال موفّر
مصفوفة `models[]` الخاصة به (مع معرّف المنبع والإمكانات والأسعار) ومسارات
الطلبات المدعومة لديه. لا يوفّر OpenClaw قائمة ثانية ثابتة من
نماذج ClawRouter. يُعلن نموذج الكتالوج كنموذج OpenClaw عندما:

- تمنح سياسة بيانات الاعتماد موفّره؛
- يعلن نموذج الكتالوج عن إمكانية LLM مدعومة (`llm.responses`،
  أو `llm.chat`، أو `llm.messages`، أو `llm.stream` مع مسار بث
  مطابق)؛ و
- يوفّر الموفّر مسارًا مطابقًا لإحدى وسائل النقل أدناه.

لا تتطلب إضافة نموذج إلى موفّر ClawRouter مدعوم إصدارًا جديدًا من OpenClaw:
سيكتشفه تحديث الكتالوج التالي (المخزّن مؤقتًا لمدة 60 ثانية لكل نطاق
بيانات اعتماد). أما النموذج الذي يحتاج إلى بروتوكول سلكي جديد فيتطلب
دعم Plugin أولًا.

## البروتوكول وPlugins الموفّرين

يمتلك ClawRouter بيانات اعتماد المنبع؛ ويخبر كتالوجه OpenClaw بوسيلة
النقل التي يجب استخدامها، لذا لن تحتاج أبدًا إلى تثبيت Plugin المصادقة لكل شركة في المنبع.

| إمكانية/مسار الكتالوج                               | وسيلة نقل OpenClaw     |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses` (موفّر متوافق مع OpenAI)             | `openai-responses`     |
| `llm.chat` (موفّر متوافق مع OpenAI)                  | `openai-completions`   |
| `llm.messages` + مسار `anthropic.messages`              | `anthropic-messages`   |
| `llm.stream` + مسار بث `google.generate_content` | `google-generative-ai` |

يطبّق Plugin أيضًا سياسات إعادة التشغيل ومخطط الأدوات المطابقة لتلك
العائلات (توافق مخطط أدوات OpenAI/DeepSeek/Gemini؛ وسياسات إعادة التشغيل الأصلية في Anthropic
وGoogle Gemini). لا يُعلن عمدًا موفّر كتالوج لا يقدّم إلا
تنسيق طلب غير مدعوم كنموذج نصي في OpenClaw. طبّع هؤلاء الموفّرين
وفق أحد العقود المدعومة في ClawRouter بدلًا من إرسال حمولة غير متوافقة.

## الحصص والاستخدام

تغذّي استجابة `/v1/usage` من ClawRouter واجهات استخدام الموفّر المعتادة
في OpenClaw: إجماليات الطلبات والرموز والإنفاق، بالإضافة إلى نافذة ميزانية شهرية عندما
يكون للمفتاح حد. تظل المفاتيح غير المقاسة تعرض الاستخدام الإجمالي دون
نافذة نسبة مئوية.

يستخدم البحث عن الحصة المفتاح المقيّد نفسه المستخدم لاكتشاف النماذج. لا يؤدي فشل
البحث عن الحصة إلى حظر تنفيذ النموذج.

تحقق من اللقطة الفعلية باستخدام:

```bash
openclaw status --usage
openclaw models status
```

تتوفر لقطة الموفّر نفسها للأمر `/status` في الدردشة وواجهة استخدام
OpenClaw. تكون الميزانية على مستوى السياسة، لذا قد تغير الطلبات التي ينفذها
عميل آخر يستخدم سياسة ClawRouter نفسها النسبة المتبقية.

## استكشاف الأخطاء وإصلاحها

| العَرَض                                  | التحقق                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| لا توجد نماذج ClawRouter                     | تأكد من أن Plugin مفعّل ومسموح به في `plugins.allow`، ثم تحقق من أن بيانات الاعتماد نشطة وتمنح موفّرًا جاهزًا واحدًا على الأقل. |
| نموذج ClawRouter مهيأ مفقود | افحص إمكانية `/v1/catalog` ودعم المسار الخاصين به. تُرشّح عقود النقل غير المدعومة عمدًا.                            |
| `Unknown model: clawrouter/...`          | أضف مرجع الكتالوج الدقيق إلى `agents.defaults.models` عندما تُستخدم خريطة التهيئة هذه كقائمة سماح.                               |
| `401` أو `403` من الكتالوج أو الاستخدام     | أعد إصدار بيانات اعتماد ClawRouter أو عدّل نطاقها؛ لا يرجع OpenClaw إلى مفاتيح موفّري المنبع كحل احتياطي.                                          |
| يفشل استدعاء النموذج بعد اكتشافه         | تحقق من اتصال الموفّر وسلامة المنبع في ClawRouter، ثم أعد المحاولة بعد استعادة حالة جاهزيته.                                |
| يعرض الاستخدام إجماليات دون نسبة مئوية       | السياسة غير مقاسة؛ أضف ميزانية شهرية في ClawRouter لإظهار نافذة نسبة مئوية.                                                     |

## سلوك الأمان

- يقتصر اكتشاف الكتالوج على مفتاح الوكيل المُهيّأ، ويُخزَّن مؤقتًا لكل نطاق من نطاقات بيانات الاعتماد (دليل الوكيل، ودليل مساحة العمل، ومعرّف ملف تعريف المصادقة، وعنوان URL الأساسي).
- لا يُرفق مفتاح الوكيل إلا عند إرسال الطلب؛ ولا يُخزَّن في البيانات الوصفية للنموذج.
- تُزال المسافات الزائدة من قيم الإسناد التلقائي وربط الطلبات، وتُرفض محارف التحكم فيها قبل الإرسال. ويقتصر طول قيم الإسناد على 256 محرفًا، ومعرّفات الطلبات على 128 محرفًا.
- لا تحتوي تشخيصات نقل النموذج إلا على البيانات الوصفية، ولا تتضمن مطلقًا مفتاح الوكيل أو محتوى النموذج.
- لا تُعاد كتابة معرّفات نماذج Anthropic وGemini الأصلية إلى معرّفاتها لدى المصدر إلا عند الإرسال.
- تُرفض صفوف الكتالوج غير المدعومة أو غير الممنوحة تلقائيًا، ولا يمكن تحديدها.

## ذو صلة

<CardGroup cols={2}>
  <Card title="موفّرو النماذج" href="/ar/concepts/model-providers" icon="layers">
    تهيئة الموفّر وتحديد النموذج.
  </Card>
  <Card title="تتبّع الاستخدام" href="/ar/concepts/usage-tracking" icon="chart-line">
    واجهات استخدام OpenClaw وحالته.
  </Card>
</CardGroup>
