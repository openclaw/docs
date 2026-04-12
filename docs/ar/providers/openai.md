---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-12T00:18:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7aa06fba9ac901e663685a6b26443a2f6aeb6ec3589d939522dc87cbb43497b4
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

توفّر OpenAI واجهات API للمطورين لنماذج GPT. يدعم Codex **تسجيل الدخول عبر ChatGPT** للوصول عبر الاشتراك أو **تسجيل الدخول عبر مفتاح API** للوصول القائم على الاستخدام. يتطلب Codex cloud تسجيل الدخول عبر ChatGPT.
تدعم OpenAI صراحةً استخدام OAuth للاشتراك في الأدوات/سير العمل الخارجية مثل OpenClaw.

## نمط التفاعل الافتراضي

يمكن لـ OpenClaw إضافة طبقة تراكب صغيرة خاصة بـ OpenAI إلى الموجّه لكل من تشغيلات `openai/*` و
`openai-codex/*`. افتراضيًا، تُبقي طبقة التراكب المساعد ودودًا،
ومتعاونًا، وموجزًا، ومباشرًا، وأكثر تعبيرًا عاطفيًا قليلًا
من دون استبدال موجّه نظام OpenClaw الأساسي. كما تسمح طبقة التراكب الودية
باستخدام الرمز التعبيري أحيانًا عندما يكون مناسبًا بشكل طبيعي، مع الإبقاء على
الإخراج العام موجزًا.

مفتاح الإعداد:

`plugins.entries.openai.config.personality`

القيم المسموح بها:

- `"friendly"`: الافتراضي؛ يفعّل طبقة التراكب الخاصة بـ OpenAI.
- `"on"`: اسم بديل لـ `"friendly"`.
- `"off"`: يعطّل طبقة التراكب ويستخدم موجّه OpenClaw الأساسي فقط.

النطاق:

- ينطبق على نماذج `openai/*`.
- ينطبق على نماذج `openai-codex/*`.
- لا يؤثر في مزوّدين آخرين.

هذا السلوك مفعّل افتراضيًا. أبقِ `"friendly"` مضبوطًا صراحةً إذا كنت تريد أن
يستمر هذا الإعداد رغم أي تغييرات محلية مستقبلية في الإعدادات:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### تعطيل طبقة موجّه OpenAI

إذا كنت تريد موجّه OpenClaw الأساسي غير المعدّل، فاضبط طبقة التراكب على `"off"`:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

يمكنك أيضًا ضبطه مباشرةً باستخدام CLI الخاص بالإعدادات:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

يُطبّع OpenClaw هذا الإعداد أثناء التشغيل بدون حساسية لحالة الأحرف، لذا فإن قيمًا مثل
`"Off"` ستعطّل أيضًا طبقة التراكب الودية.

## الخيار A: مفتاح OpenAI API ‏(OpenAI Platform)

**الأفضل لـ:** الوصول المباشر إلى API والفوترة القائمة على الاستخدام.
احصل على مفتاح API من لوحة تحكم OpenAI.

ملخص المسار:

- `openai/gpt-5.4` = مسار API مباشر إلى OpenAI Platform
- يتطلب `OPENAI_API_KEY` (أو إعداد مزوّد OpenAI مكافئ)
- في OpenClaw، يُوجَّه تسجيل الدخول عبر ChatGPT/Codex من خلال `openai-codex/*` وليس `openai/*`

### إعداد CLI

```bash
openclaw onboard --auth-choice openai-api-key
# أو بشكل غير تفاعلي
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### مقتطف إعداد

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

تسرد مستندات نماذج API الحالية من OpenAI النموذجين `gpt-5.4` و `gpt-5.4-pro` للاستخدام المباشر عبر
OpenAI API. يمرّر OpenClaw كليهما عبر مسار `openai/*` Responses.
ويتعمد OpenClaw إخفاء الصف القديم `openai/gpt-5.3-codex-spark`،
لأن استدعاءات OpenAI API المباشرة ترفضه في الحركة الحية.

لا يوفّر OpenClaw النموذج `openai/gpt-5.3-codex-spark` على مسار OpenAI
API المباشر. لا يزال `pi-ai` يوفّر صفًا مدمجًا لهذا النموذج، لكن طلبات OpenAI API الحية
ترفضه حاليًا. ويُعامل Spark على أنه خاص بـ Codex فقط في OpenClaw.

## إنشاء الصور

يسجّل المكوّن الإضافي المضمّن `openai` أيضًا إنشاء الصور عبر الأداة المشتركة
`image_generate`.

- نموذج الصور الافتراضي: `openai/gpt-image-1`
- الإنشاء: حتى 4 صور لكل طلب
- وضع التحرير: مفعّل، حتى 5 صور مرجعية
- يدعم `size`
- الملاحظة الحالية الخاصة بـ OpenAI: لا يمرّر OpenClaw حاليًا تجاوزات `aspectRatio` أو
  `resolution` إلى OpenAI Images API

لاستخدام OpenAI كمزوّد الصور الافتراضي:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

راجع [إنشاء الصور](/ar/tools/image-generation) لمعلمات
الأداة المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.

## إنشاء الفيديو

يسجّل المكوّن الإضافي المضمّن `openai` أيضًا إنشاء الفيديو عبر الأداة المشتركة
`video_generate`.

- نموذج الفيديو الافتراضي: `openai/sora-2`
- الأوضاع: نص إلى فيديو، وصورة إلى فيديو، وتدفّقات مرجعية/تحرير لفيديو واحد
- الحدود الحالية: صورة واحدة أو إدخال مرجعي لفيديو واحد
- الملاحظة الحالية الخاصة بـ OpenAI: يمرّر OpenClaw حاليًا فقط تجاوزات `size`
  لإنشاء الفيديو الأصلي من OpenAI. أمّا التجاوزات الاختيارية غير المدعومة
  مثل `aspectRatio` و `resolution` و `audio` و `watermark` فيتم تجاهلها
  ويُبلّغ عنها كتحذير من الأداة.

لاستخدام OpenAI كمزوّد الفيديو الافتراضي:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات
الأداة المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.

## الخيار B: اشتراك OpenAI Code ‏(Codex)

**الأفضل لـ:** استخدام وصول اشتراك ChatGPT/Codex بدلًا من مفتاح API.
يتطلب Codex cloud تسجيل الدخول عبر ChatGPT، بينما يدعم Codex CLI تسجيل الدخول عبر ChatGPT أو مفتاح API.

ملخص المسار:

- `openai-codex/gpt-5.4` = مسار OAuth لـ ChatGPT/Codex
- يستخدم تسجيل الدخول عبر ChatGPT/Codex، وليس مفتاح OpenAI Platform API مباشرًا
- قد تختلف الحدود على جهة المزوّد لـ `openai-codex/*` عن تجربة ChatGPT على الويب/التطبيق

### إعداد CLI ‏(Codex OAuth)

```bash
# شغّل Codex OAuth في المعالج
openclaw onboard --auth-choice openai-codex

# أو شغّل OAuth مباشرةً
openclaw models auth login --provider openai-codex
```

### مقتطف إعداد (اشتراك Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

تسرد مستندات Codex الحالية من OpenAI النموذج `gpt-5.4` على أنه نموذج Codex الحالي. ويقوم OpenClaw
بربطه مع `openai-codex/gpt-5.4` لاستخدام OAuth عبر ChatGPT/Codex.

هذا المسار منفصل عمدًا عن `openai/gpt-5.4`. إذا كنت تريد
المسار المباشر لـ OpenAI Platform API، فاستخدم `openai/*` مع مفتاح API. وإذا كنت تريد
تسجيل الدخول عبر ChatGPT/Codex، فاستخدم `openai-codex/*`.

إذا أعادت عملية الإعداد الأولى استخدام تسجيل دخول موجود إلى Codex CLI، فستظل بيانات الاعتماد
تُدار بواسطة Codex CLI. وعند انتهاء صلاحيتها، يعيد OpenClaw قراءة مصدر Codex الخارجي
أولًا، وعندما يستطيع المزوّد تحديثها، يكتب بيانات الاعتماد المحدّثة
من جديد إلى تخزين Codex بدلًا من تولّي إدارتها في نسخة منفصلة خاصة بـ OpenClaw فقط.

إذا كان حساب Codex الخاص بك مخوّلًا لاستخدام Codex Spark، فإن OpenClaw يدعم أيضًا:

- `openai-codex/gpt-5.3-codex-spark`

يعامل OpenClaw Codex Spark على أنه خاص بـ Codex فقط. ولا يوفّر مسار
`openai/gpt-5.3-codex-spark` مباشرًا يعتمد على مفتاح API.

كما يحافظ OpenClaw على `openai-codex/gpt-5.3-codex-spark` عندما
يكتشفه `pi-ai`. ويجب التعامل معه على أنه يعتمد على الأهلية وتجريبي: إذ إن Codex Spark
منفصل عن GPT-5.4 `/fast`، ويعتمد توفره على حساب Codex / ChatGPT
المسجّل الدخول به.

### حد نافذة السياق في Codex

يعامل OpenClaw بيانات نموذج Codex الوصفية وحد وقت التشغيل للسياق على أنهما
قيمتان منفصلتان.

بالنسبة إلى `openai-codex/gpt-5.4`:

- `contextWindow` الأصلي: `1050000`
- حد `contextTokens` الافتراضي في وقت التشغيل: `272000`

يحافظ ذلك على صحة بيانات النموذج الوصفية مع الإبقاء على نافذة التشغيل الافتراضية الأصغر
التي تتمتع عمليًا بخصائص أفضل من حيث زمن الاستجابة والجودة.

إذا كنت تريد حدًا فعليًا مختلفًا، فاضبط `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

استخدم `contextWindow` فقط عندما تعلن أو تتجاوز بيانات النموذج
الوصفية الأصلية. واستخدم `contextTokens` عندما تريد تقييد ميزانية السياق في وقت التشغيل.

### النقل الافتراضي

يستخدم OpenClaw ‏`pi-ai` لبث النماذج. ولكل من `openai/*` و
`openai-codex/*`، يكون النقل الافتراضي هو `"auto"` ‏(WebSocket أولًا، ثم الرجوع إلى SSE).

في وضع `"auto"`، يعيد OpenClaw أيضًا المحاولة مرة واحدة عند حدوث فشل مبكر قابل لإعادة المحاولة في WebSocket
قبل أن يرجع إلى SSE. أمّا الوضع الإجباري `"websocket"` فيُظهر أخطاء النقل مباشرةً بدلًا من إخفائها خلف الرجوع الاحتياطي.

بعد فشل WebSocket عند الاتصال أو في بداية الدور ضمن وضع `"auto"`، يضع OpenClaw
مسار WebSocket الخاص بتلك الجلسة في حالة متدهورة لمدة تقارب 60 ثانية ويرسل
الأدوار اللاحقة عبر SSE أثناء فترة التهدئة بدلًا من التقلّب بين
أنماط النقل.

وبالنسبة إلى نقاط النهاية الأصلية من عائلة OpenAI ‏(`openai/*` و `openai-codex/*` و Azure
OpenAI Responses)، يرفق OpenClaw أيضًا حالة هوية مستقرة للجلسة والدور
بالطلبات بحيث تظل إعادة المحاولة، وإعادة الاتصال، والرجوع إلى SSE متسقة مع
هوية المحادثة نفسها. وعلى مسارات عائلة OpenAI الأصلية، يتضمن ذلك رؤوس هوية مستقرة لطلب الجلسة/الدور بالإضافة إلى بيانات نقل وصفية مطابقة.

كما يطبّع OpenClaw عدّادات استخدام OpenAI عبر تنويعات النقل قبل
أن تصل إلى واجهات الجلسة/الحالة. فقد تُبلّغ حركة OpenAI/Codex Responses الأصلية عن الاستخدام بصيغتي
`input_tokens` / `output_tokens` أو
`prompt_tokens` / `completion_tokens`؛ ويعامل OpenClaw هذه الصيغ على أنها عدّادات الإدخال
والإخراج نفسها بالنسبة إلى `/status` و `/usage` وسجلات الجلسات. وعندما تُسقط حركة
WebSocket الأصلية `total_tokens` (أو تُبلّغ عنه على أنه `0`)، يعتمد OpenClaw على إجمالي الإدخال + الإخراج المطبع حتى تبقى عروض الجلسة/الحالة مملوءة.

يمكنك ضبط `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: فرض SSE
- `"websocket"`: فرض WebSocket
- `"auto"`: جرّب WebSocket ثم ارجع إلى SSE

وبالنسبة إلى `openai/*` ‏(Responses API)، يفعّل OpenClaw أيضًا الإحماء عبر WebSocket افتراضيًا
(`openaiWsWarmup: true`) عند استخدام نقل WebSocket.

مستندات OpenAI ذات الصلة:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### إحماء WebSocket في OpenAI

تصف مستندات OpenAI الإحماء على أنه اختياري. ويقوم OpenClaw بتفعيله افتراضيًا لـ
`openai/*` لتقليل زمن الاستجابة في أول دور عند استخدام نقل WebSocket.

### تعطيل الإحماء

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### تفعيل الإحماء صراحةً

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### المعالجة ذات الأولوية في OpenAI وCodex

يكشف API الخاص بـ OpenAI عن المعالجة ذات الأولوية عبر `service_tier=priority`. في
OpenClaw، اضبط `agents.defaults.models["<provider>/<model>"].params.serviceTier`
لتمرير هذا الحقل في نقاط النهاية الأصلية لـ OpenAI/Codex Responses.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

القيم المدعومة هي `auto` و `default` و `flex` و `priority`.

يمرّر OpenClaw ‏`params.serviceTier` إلى كل من طلبات `openai/*` المباشرة عبر Responses
وطلبات `openai-codex/*` عبر Codex Responses عندما تشير تلك النماذج
إلى نقاط النهاية الأصلية لـ OpenAI/Codex.

سلوك مهم:

- يجب أن يستهدف `openai/*` المباشر `api.openai.com`
- يجب أن يستهدف `openai-codex/*` ‏`chatgpt.com/backend-api`
- إذا وجّهت أيًا من المزوّدين عبر عنوان URL أساسي آخر أو وكيل، يترك OpenClaw قيمة `service_tier` كما هي

### الوضع السريع في OpenAI

يوفّر OpenClaw مفتاح تبديل مشتركًا للوضع السريع لكل من جلسات `openai/*` و
`openai-codex/*`:

- المحادثة/واجهة المستخدم: `/fast status|on|off`
- الإعداد: `agents.defaults.models["<provider>/<model>"].params.fastMode`

عند تفعيل الوضع السريع، يربطه OpenClaw بالمعالجة ذات الأولوية في OpenAI:

- ترسل استدعاءات `openai/*` المباشرة عبر Responses إلى `api.openai.com` القيمة `service_tier = "priority"`
- كما ترسل استدعاءات `openai-codex/*` عبر Responses إلى `chatgpt.com/backend-api` القيمة `service_tier = "priority"`
- يتم الحفاظ على قيم `service_tier` الموجودة أصلًا في الحمولة
- لا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`

بالنسبة إلى GPT 5.4 تحديدًا، فإن الإعداد الأكثر شيوعًا هو:

- إرسال `/fast on` داخل جلسة تستخدم `openai/gpt-5.4` أو `openai-codex/gpt-5.4`
- أو ضبط `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- وإذا كنت تستخدم أيضًا Codex OAuth، فاضبط `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true` أيضًا

مثال:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

تتغلب تجاوزات الجلسة على الإعدادات. ويؤدي مسح تجاوز الجلسة في واجهة Sessions
إلى إعادة الجلسة إلى الإعداد الافتراضي المضبوط.

### مسارات OpenAI الأصلية مقابل المسارات المتوافقة مع OpenAI

يعامل OpenClaw نقاط النهاية المباشرة لـ OpenAI وCodex وAzure OpenAI بشكل مختلف
عن وكلاء `/v1` العامة المتوافقة مع OpenAI:

- تحتفظ المسارات الأصلية `openai/*` و`openai-codex/*` ومسارات Azure OpenAI بالقيمة
  `reasoning: { effort: "none" }` كما هي عندما تعطل الاستدلال صراحةً
- تضبط مسارات عائلة OpenAI الأصلية مخططات الأدوات على الوضع الصارم افتراضيًا
- لا تُرفق رؤوس إسناد OpenClaw المخفية (`originator` و`version` و
  `User-Agent`) إلا على مضيفات OpenAI الأصلية المتحقق منها
  (`api.openai.com`) ومضيفات Codex الأصلية (`chatgpt.com/backend-api`)
- تحتفظ مسارات OpenAI/Codex الأصلية بتشكيل الطلبات الخاص بـ OpenAI مثل
  `service_tier` و`store` في Responses وحمولات توافق الاستدلال الخاصة بـ OpenAI و
  تلميحات cache الموجّه
- تحتفظ المسارات المتوافقة مع OpenAI على نمط الوكيل بسلوك التوافق الأكثر مرونة ولا
  تفرض مخططات أدوات صارمة أو تشكيل طلبات خاصًا بالمسارات الأصلية أو رؤوس
  إسناد OpenAI/Codex المخفية

يبقى Azure OpenAI ضمن فئة المسارات الأصلية من حيث سلوك النقل والتوافق،
لكنه لا يتلقى رؤوس إسناد OpenAI/Codex المخفية.

يحافظ هذا على السلوك الحالي الأصلي لـ OpenAI Responses من دون فرض
طبقات التوافق الأقدم الخاصة بـ OpenAI-compatible على الواجهات الخلفية الخارجية `/v1`.

### وضع GPT الصارم الوكيلي

بالنسبة إلى تشغيلات GPT-5-family عبر `openai/*` و`openai-codex/*`، يمكن لـ OpenClaw استخدام
عقد تنفيذ Pi مضمّن أكثر صرامة:

```json5
{
  agents: {
    defaults: {
      embeddedPi: {
        executionContract: "strict-agentic",
      },
    },
  },
}
```

مع `strict-agentic`، لم يعد OpenClaw يتعامل مع دور مساعد يقتصر على الخطة
على أنه تقدم ناجح عندما يكون هناك إجراء أداة ملموس متاح. بل يعيد محاولة
الدور مع توجيه للتنفيذ الفوري، ويفعّل تلقائيًا أداة `update_plan` المنظمة للأعمال
الجوهرية، ويعرض حالة تعطّل صريحة إذا واصل النموذج
التخطيط من دون تنفيذ.

هذا الوضع محصور في تشغيلات GPT-5-family عبر OpenAI وOpenAI Codex. أما المزوّدون الآخرون
وعائلات النماذج الأقدم فيحتفظون بسلوك Pi المضمّن الافتراضي ما لم تختر
تفعيل إعدادات تشغيل أخرى لهم.

### الضغط من جهة الخادم في OpenAI Responses

بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` باستخدام `api: "openai-responses"` مع
`baseUrl` على `api.openai.com`)، يفعّل OpenClaw الآن تلقائيًا تلميحات حمولة
الضغط من جهة خادم OpenAI:

- يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
- يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`

افتراضيًا، تكون قيمة `compact_threshold` مساوية لـ `70%` من `contextWindow` الخاص بالنموذج (أو `80000`
عند عدم توفره).

### تفعيل الضغط من جهة الخادم صراحةً

استخدم هذا عندما تريد فرض حقن `context_management` في نماذج
Responses المتوافقة (مثل Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### التفعيل مع حد مخصص

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
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

### تعطيل الضغط من جهة الخادم

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

يتحكم `responsesServerCompaction` فقط في حقن `context_management`.
ولا تزال نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم يضبط التوافق
`supportsStore: false`.

## ملاحظات

- تستخدم مراجع النماذج دائمًا الصيغة `provider/model` (راجع [/concepts/models](/ar/concepts/models)).
- توجد تفاصيل المصادقة + قواعد إعادة الاستخدام في [/concepts/oauth](/ar/concepts/oauth).
