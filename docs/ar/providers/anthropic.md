---
read_when:
    - تريد استخدام نماذج Anthropic في OpenClaw
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:19:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

تبني Anthropic عائلة نماذج **Claude**. يدعم OpenClaw مساري مصادقة:

- **مفتاح API** — وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام (نماذج `anthropic/*`)
- **Claude CLI** — إعادة استخدام تسجيل دخول Claude Code موجود على المضيف نفسه

<Warning>
تشغل واجهة Claude CLI الخلفية في OpenClaw واجهة Claude Code CLI المثبتة في
وضع الطباعة غير التفاعلي. تصف وثائق Claude Code الحالية من Anthropic
`claude -p` على أنه استخدام Agent SDK/برمجي. أوقف تحديث دعم Anthropic في 15 يونيو 2026
تغيير فوترة Agent SDK المعلن عنه مؤقتا. في الوقت الحالي، تقول Anthropic إن
استخدام Claude Agent SDK و`claude -p` وتطبيقات الجهات الخارجية ما زال يستهلك من
حدود استخدام الاشتراك. رصيد Agent SDK الشهري المعلن عنه سابقا
غير متاح بينما تراجع Anthropic تلك الخطة.

ما زال Claude Code التفاعلي يستهلك من حدود خطة Claude المسجل بها الدخول. تبقى
مصادقة مفتاح API فوترة API مباشرة بنظام الدفع حسب الاستخدام. لمضيفي Gateway
طويلي العمر، والأتمتة المشتركة، والإنفاق الإنتاجي المتوقع، استخدم مفتاح Anthropic API.

تحقق من مقالات دعم Anthropic الحالية قبل الاعتماد على سلوك فوترة
الاشتراك:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [استخدام Claude Agent SDK مع خطة Claude الخاصة بك](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [استخدام Claude Code مع خطة Pro أو Max الخاصة بك](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [استخدام Claude Code مع خطة Team أو Enterprise الخاصة بك](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [إدارة تكاليف Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## البدء

<Tabs>
  <Tab title="مفتاح API">
    **الأفضل لـ:** وصول API القياسي والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API في [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="شغل الإعداد الأولي">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        أو مرر المفتاح مباشرة:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### مثال على الإعدادات

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Claude CLI موجود بدون مفتاح API منفصل.

    <Steps>
      <Step title="تأكد من تثبيت Claude CLI وتسجيل الدخول إليه">
        تحقق باستخدام:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="شغل الإعداد الأولي">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        يكتشف OpenClaw بيانات اعتماد Claude CLI الموجودة ويعيد استخدامها.
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    تفاصيل الإعداد ووقت التشغيل لواجهة Claude CLI الخلفية موجودة في [واجهات CLI الخلفية](/ar/gateway/cli-backends).
    </Note>

    <Warning>
    تتوقع إعادة استخدام Claude CLI أن تعمل عملية OpenClaw على المضيف نفسه الذي يوجد عليه
    تسجيل دخول Claude CLI. يمكن لتثبيتات Docker الاحتفاظ بمجلد رئيسي للحاوية وتسجيل الدخول إلى
    Claude Code هناك؛ راجع
    [واجهة Claude CLI الخلفية في Docker](/ar/install/docker#claude-cli-backend-in-docker).
    لا تقوم تثبيتات الحاويات الأخرى مثل [Podman](/ar/install/podman) بتركيب
    `~/.claude` الخاص بالمضيف في الإعداد أو وقت التشغيل؛ استخدم مفتاح Anthropic API هناك، أو اختر
    موفرا مع OAuth يديره OpenClaw مثل
    [OpenAI Codex](/ar/providers/openai).
    </Warning>

    ### مثال على الإعدادات

    فضل مرجع نموذج Anthropic القياسي مع تجاوز وقت تشغيل CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    ما زالت مراجع النماذج القديمة `claude-cli/claude-opus-4-7` تعمل من أجل
    التوافق، لكن يجب أن تحافظ الإعدادات الجديدة على اختيار الموفر/النموذج كـ
    `anthropic/*` وأن تضع واجهة التنفيذ الخلفية في سياسة وقت تشغيل الموفر/النموذج.

    ### الفوترة و`claude -p`

    يستخدم OpenClaw مسار `claude -p` غير التفاعلي في Claude Code لتشغيل Claude CLI.
    تتعامل Anthropic حاليا مع ذلك المسار على أنه استخدام Agent SDK/برمجي:

    - أوقف تحديث دعم Anthropic في 15 يونيو 2026 خطة رصيد Agent SDK المنفصلة
      المعلن عنها سابقا مؤقتا.
    - في الوقت الحالي، ما زال استخدام Claude Agent SDK و`claude -p` وتطبيقات
      الجهات الخارجية ضمن خطة الاشتراك يستهلك من حدود استخدام الاشتراك المسجل به الدخول.
    - رصيد Agent SDK الشهري المعلن عنه سابقا غير متاح بينما
      تراجع Anthropic تلك الخطة.
    - تستخدم تسجيلات دخول Console/مفتاح API فوترة API بنظام الدفع حسب الاستخدام ولا تحصل على
      رصيد Agent SDK الخاص بالاشتراك.

    راجع [مقال خطة Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    من Anthropic للاطلاع على إشعار الإيقاف المؤقت، ومقالات خطة Claude Code لسلوك اشتراكات
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    و
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    يمكن أن تغير Anthropic فوترة Claude Code وسلوك حدود المعدل بدون
    إصدار OpenClaw. تحقق من `claude auth status` و`/status` ووثائق
    Anthropic المرتبطة عندما تكون قابلية توقع الفوترة مهمة.

    <Tip>
    للأتمتة الإنتاجية المشتركة، استخدم مفتاح Anthropic API بدلا من
    Claude CLI. يدعم OpenClaw أيضا خيارات بنمط الاشتراك من
    [OpenAI Codex](/ar/providers/openai)، و[Qwen Cloud](/ar/providers/qwen)،
    و[MiniMax](/ar/providers/minimax)، و[Z.AI / GLM](/ar/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## افتراضيات التفكير (Claude Fable 5 و4.8 و4.6)

يستخدم `anthropic/claude-fable-5` دائما التفكير التكيفي ويفترض جهدا `high`.
نظرا لأن Anthropic لا تسمح بتعطيل التفكير لهذا النموذج،
يستخدم `/think off` و`/think minimal` جهدا `low`. يحذف OpenClaw أيضا قيم
درجة الحرارة المخصصة لطلبات Fable 5.

يبقي Claude Opus 4.8 التفكير معطلا افتراضيا في OpenClaw. عندما تفعّل التفكير التكيفي صراحة باستخدام `/think high|xhigh|max`، يرسل OpenClaw قيم جهد Opus 4.8 الخاصة بـ Anthropic؛ تفترض نماذج Claude 4.6 القيمة `adaptive`.

تجاوز ذلك لكل رسالة باستخدام `/think:<level>` أو في معلمات النموذج:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
وثائق Anthropic ذات الصلة:
- [التفكير التكيفي](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [التفكير الممتد](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## احتياطي رفض السلامة (Claude Fable 5)

<Warning>
استخدام Claude Fable 5 يعني أيضا استخدام Claude Opus 4.8. يشحن Fable 5 مع
مصنفات سلامة يمكن أن ترفض طلبا، والاسترداد المعتمد من Anthropic
هو أن يخدم `claude-opus-4-8` تلك الجولة. يفعّل OpenClaw هذا
تلقائيا لطلبات مفتاح API المباشرة، لذلك تتم الإجابة عن بعض جولات Fable
وتتم فوترتها على أنها Claude Opus 4.8. إذا كانت سياستك أو ميزانيتك لا تقبل
الجولات التي يخدمها Opus، فلا تختر `anthropic/claude-fable-5`.
</Warning>

### سبب وجود هذا

تعيد مصنفات Fable 5 القيمة `stop_reason: "refusal"` على الطلبات في المجالات
المقيدة، كما تعطي نتائج إيجابية كاذبة في الأعمال القريبة من الحميدة (أدوات
الأمان، وعلوم الحياة، أو حتى طلب إعادة إنتاج الاستدلال الخام من النموذج).
بدون احتياطي، تموت الجولة بخطأ رغم أن
نموذج Claude آخر كان سيخدمها بسلاسة — تخبر رسالة الرفض الخاصة بـ Anthropic
مكاملي API بتكوين نموذج احتياطي.

### كيف يعمل

1. لكل طلب مباشر بمفتاح API إلى `anthropic/claude-fable-5`، يرسل OpenClaw
   موافقة احتياطية من جانب خادم Anthropic: ترويسة beta
   `server-side-fallback-2026-06-01` مع
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 هو هدف
   الاحتياطي الوحيد الذي تسمح به Anthropic لـ Fable 5.
2. لا يشغل الاحتياطي إلا رفض مصنف السلامة. تتصرف حدود المعدل
   والتحميل الزائد وأخطاء الخادم تماما كما كانت من قبل وتمر عبر
   [تجاوز فشل النموذج](/ar/concepts/model-failover) العادي في OpenClaw.
3. يحدث الإنقاذ داخل الاستدعاء نفسه. يكون الرفض قبل أي مخرجات
   غير مرئي باستثناء زمن الانتظار؛ تأتي الإجابة كلها من Opus 4.8. عند حدوث
   رفض في منتصف البث، يُحتفظ بالنص الجزئي كبادئة يتابع منها نموذج
   الاحتياطي، بينما يتم تجاهل استدلال النموذج الرافض واستدعاءات الأدوات
   حسب قواعد إعادة التشغيل الخاصة بـ Anthropic (يجب ألا تُعاد أو
   تُنفذ).
4. إذا رفض Claude Opus 4.8 أيضا، تعرض الجولة الرفض كخطأ،
   تماما كما كان قبل هذه الميزة.

يحدث الاحتياطي على مستوى Anthropic API، لذلك لا يحتاج `claude-opus-4-8` إلى
أن يكون ضمن قائمة نماذجك المكونة أو سلسلة الاحتياطيات — يمكن لمفتاح API
القادر على Fable أن يخدم Opus دائما.

### القابلية للملاحظة والفوترة

- تسجل الجولة المخدومة بالاحتياطي تشخيص `provider_fallback` على
  رسالة المساعد مع تسمية `fromModel` و`toModel`، ويبلغ
  `responseModel` الخاص بالرسالة عن `claude-opus-4-8`.
- تفوتر Anthropic لكل محاولة: الرفض قبل المخرجات مجاني، والإنقاذ
  يفوتر بأسعار Claude Opus 4.8 (حاليا نصف أسعار Fable 5). يسعر تقدير
  تكلفة كل جولة في OpenClaw الجولات المخدومة بالاحتياطي بأسعار Opus للمطابقة.
- يضيف الرفض في منتصف البث فوترة للجزء الجزئي من Fable الذي تم بثه بالفعل
  من جانب Anthropic؛ يتم الإبلاغ عن ذلك الجزء في استخدام كل محاولة في API
  لكنه لا يدمج في تقدير كل جولة في OpenClaw.

### النطاق

ينطبق على `anthropic/claude-fable-5` مع مصادقة مفتاح API مقابل
`api.anthropic.com`. تبقى طلبات OAuth (إعادة استخدام اشتراك Claude CLI)، وعناوين URL الأساسية للوكيل،
وBedrock، وVertex، وFoundry دون تغيير وما زالت تعرض
الرفض كأخطاء هناك.

تم التحقق مباشرة: يتم رفض مطالبة حميدة تطلب من Fable 5 إعادة إنتاج سلسلة
التفكير الخام الخاصة به مع `category: "reasoning_extraction"` عند إرسالها بدون
احتياطيات، وتعيد المطالبة نفسها عبر OpenClaw إجابة عادية يخدمها Opus
مع تشخيص `provider_fallback` مرفق.

راجع [دليل الرفض والاحتياطي](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
من Anthropic للسلوك الأساسي.

## التخزين المؤقت للمطالبة

يدعم OpenClaw ميزة التخزين المؤقت للمطالبات من Anthropic لمصادقة مفتاح API.

| القيمة               | مدة التخزين المؤقت | الوصف                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (افتراضي) | 5 دقائق      | يطبق تلقائيا لمصادقة مفتاح API |
| `"long"`            | ساعة واحدة         | تخزين مؤقت ممتد                         |
| `"none"`            | بدون تخزين مؤقت     | تعطيل التخزين المؤقت للمطالبة                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="تجاوزات التخزين المؤقت لكل وكيل">
    استخدم معلمات مستوى النموذج كخط أساس، ثم تجاوز وكلاء محددين عبر `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    ترتيب دمج الإعدادات:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (مطابقة `id`، وتتجاوز حسب المفتاح)

    يتيح هذا لوكيل واحد الاحتفاظ بذاكرة تخزين مؤقت طويلة الأمد بينما يعطل وكيل آخر على النموذج نفسه التخزين المؤقت لحركة المرور المتدفقة أو قليلة إعادة الاستخدام.

  </Accordion>

  <Accordion title="ملاحظات Bedrock Claude">
    - تقبل نماذج Anthropic Claude على Bedrock ‏(`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند تكوينها.
    - تُجبر نماذج Bedrock غير التابعة لـ Anthropic على `cacheRetention: "none"` في وقت التشغيل.
    - تضع الإعدادات الافتراضية الذكية لمفاتيح API أيضًا `cacheRetention: "short"` لمراجع Claude-on-Bedrock عند عدم تعيين قيمة صريحة.

  </Accordion>
</AccordionGroup>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="الوضع السريع">
    يدعم مفتاح OpenClaw المشترك `/fast` حركة Anthropic المباشرة (مفتاح API وOAuth إلى `api.anthropic.com`).

    | الأمر | يُطابق |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - يُحقن فقط لطلبات `api.anthropic.com` المباشرة. تترك مسارات الوكيل `service_tier` دون تغيير.
    - تتجاوز معاملات `serviceTier` أو `service_tier` الصريحة `/fast` عند تعيينهما معًا.
    - في الحسابات التي لا تملك سعة Priority Tier، قد يتحول `service_tier: "auto"` إلى `standard`.

    </Note>

  </Accordion>

  <Accordion title="فهم الوسائط (الصور وPDF)">
    يسجل Plugin Anthropic المضمّن فهم الصور وPDF. يحل OpenClaw
    إمكانات الوسائط تلقائيًا من مصادقة Anthropic المكوّنة، ولا
    يلزم أي إعداد إضافي.

    | الخاصية        | القيمة                 |
    | --------------- | --------------------- |
    | النموذج الافتراضي   | `claude-opus-4-8`     |
    | الإدخال المدعوم | الصور، مستندات PDF |

    عند إرفاق صورة أو PDF بمحادثة، يوجهه OpenClaw تلقائيًا
    عبر مزود فهم الوسائط من Anthropic.

  </Accordion>

  <Accordion title="نافذة سياق 1M">
    تتوفر نافذة سياق Anthropic بحجم 1M على نماذج Claude 4.x القادرة على GA
    مثل Opus 4.8 وOpus 4.7 وOpus 4.6 وSonnet 4.6. يضبط OpenClaw حجم هذه النماذج على
    1M تلقائيًا:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    يمكن للإعدادات القديمة الاحتفاظ بـ `params.context1m: true`، لكن OpenClaw لم يعد يرسل
    ترويسة بيتا المتقاعدة `context-1m-2025-08-07`. يتم تجاهل إدخالات إعدادات `anthropicBeta`
    القديمة التي تحتوي على تلك القيمة أثناء حل ترويسات الطلب، وتبقى
    نماذج Claude القديمة غير المدعومة على نافذة السياق العادية الخاصة بها.

    ينطبق `params.context1m: true` أيضًا على خلفية Claude CLI
    (`claude-cli/*`) لنماذج Opus وSonnet المؤهلة والقادرة على GA، مع الحفاظ
    على نافذة سياق وقت التشغيل لجلسات CLI هذه لتطابق سلوك API المباشر.

    <Warning>
    يتطلب وصولًا إلى السياق الطويل على اعتماد Anthropic لديك. تحافظ مصادقة OAuth/رمز الاشتراك على ترويسات بيتا المطلوبة من Anthropic، لكن OpenClaw يزيل ترويسة بيتا 1M المتقاعدة إذا بقيت في إعدادات قديمة.
    </Warning>

  </Accordion>

  <Accordion title="سياق Claude Opus 4.8 بحجم 1M">
    يحتوي `anthropic/claude-opus-4-8` ومتغيره `claude-cli` على نافذة سياق 1M
    افتراضيًا، ولا حاجة إلى `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / الرمز أصبح غير صالح فجأة">
    تنتهي صلاحية مصادقة رمز Anthropic ويمكن إبطالها. للإعدادات الجديدة، استخدم مفتاح API من Anthropic بدلًا من ذلك.
  </Accordion>

  <Accordion title='لم يتم العثور على مفتاح API للمزود "anthropic"'>
    مصادقة Anthropic تكون **لكل وكيل**؛ لا ترث الوكلاء الجدد مفاتيح الوكيل الرئيسي. أعد تشغيل الإعداد الأولي لذلك الوكيل (أو كوّن مفتاح API على مضيف Gateway)، ثم تحقق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يتم العثور على بيانات اعتماد للملف الشخصي "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف المصادقة الشخصي النشط. أعد تشغيل الإعداد الأولي، أو كوّن مفتاح API لمسار الملف الشخصي هذا.
  </Accordion>

  <Accordion title="لا يوجد ملف مصادقة شخصي متاح (الكل في فترة تهدئة)">
    تحقق من `auth.unusableProfiles` عبر `openclaw models status --json`. قد تكون فترات تهدئة حدود معدل Anthropic خاصة بالنموذج، لذلك قد يظل نموذج Anthropic شقيق قابلًا للاستخدام. أضف ملف Anthropic شخصيًا آخر أو انتظر انتهاء فترة التهدئة.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="خلفيات CLI" href="/ar/gateway/cli-backends" icon="terminal">
    إعداد خلفية Claude CLI وتفاصيل وقت التشغيل.
  </Card>
  <Card title="تخزين المطالبات مؤقتًا" href="/ar/reference/prompt-caching" icon="database">
    كيفية عمل تخزين المطالبات مؤقتًا عبر المزودين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
