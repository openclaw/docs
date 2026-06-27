---
read_when:
    - تريد استخدام نماذج Anthropic في OpenClaw
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:21:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

تبني Anthropic عائلة نماذج **Claude**. يدعم OpenClaw مسارين للمصادقة:

- **مفتاح API** — وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام (نماذج `anthropic/*`)
- **Claude CLI** — إعادة استخدام تسجيل دخول Claude Code موجود على المضيف نفسه

<Warning>
تشغّل واجهة Claude CLI الخلفية في OpenClaw واجهة Claude Code CLI المثبّتة في
وضع الطباعة غير التفاعلي. تصف وثائق Claude Code الحالية من Anthropic
`claude -p` بوصفه استخدام Agent SDK/برمجي. بدءًا من 15 يونيو 2026، تقول Anthropic
إن استخدام `claude -p` ضمن خطة الاشتراك لم يعد يُخصم من حدود خطة Claude
العادية؛ بل يُخصم أولًا من رصيد شهري منفصل لـ Agent SDK، ثم من
أرصدة الاستخدام بأسعار API القياسية عندما تكون تلك الأرصدة مفعّلة.

ما يزال Claude Code التفاعلي يُخصم من حدود خطة Claude المسجّل بها. وتظل مصادقة
مفتاح API فوترة API مباشرة بنظام الدفع حسب الاستخدام. بالنسبة إلى مضيفات Gateway
طويلة العمر، والأتمتة المشتركة، والإنفاق الإنتاجي المتوقع، استخدم مفتاح Anthropic API.

وثائق Anthropic العامة الحالية:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [استخدام Claude Agent SDK مع خطة Claude الخاصة بك](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [استخدام Claude Code مع خطة Pro أو Max الخاصة بك](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [استخدام Claude Code مع خطة Team أو Enterprise الخاصة بك](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [إدارة تكاليف Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## بدء الاستخدام

<Tabs>
  <Tab title="مفتاح API">
    **الأفضل لـ:** وصول API القياسي والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API في [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="شغّل التهيئة">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        أو مرّر المفتاح مباشرة:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### مثال إعدادات

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
      <Step title="شغّل التهيئة">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        يكتشف OpenClaw بيانات اعتماد Claude CLI الحالية ويعيد استخدامها.
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    توجد تفاصيل الإعداد ووقت التشغيل لواجهة Claude CLI الخلفية في [واجهات CLI الخلفية](/ar/gateway/cli-backends).
    </Note>

    <Warning>
    تتوقع إعادة استخدام Claude CLI أن تعمل عملية OpenClaw على المضيف نفسه الذي
    سجّل دخول Claude CLI. يمكن لتثبيتات Docker حفظ منزل الحاوية وتسجيل الدخول إلى
    Claude Code هناك؛ راجع
    [واجهة Claude CLI الخلفية في Docker](/ar/install/docker#claude-cli-backend-in-docker).
    تثبيتات الحاويات الأخرى مثل [Podman](/ar/install/podman) لا تثبّت
    `~/.claude` من المضيف في الإعداد أو وقت التشغيل؛ استخدم مفتاح Anthropic API هناك، أو اختر
    مزودًا مع OAuth مُدار من OpenClaw مثل
    [OpenAI Codex](/ar/providers/openai).
    </Warning>

    ### مثال إعدادات

    فضّل مرجع نموذج Anthropic القياسي مع تجاوز وقت تشغيل CLI:

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

    ما تزال مراجع نماذج `claude-cli/claude-opus-4-7` القديمة تعمل من أجل
    التوافق، لكن يجب أن تبقي الإعدادات الجديدة اختيار المزود/النموذج بصيغة
    `anthropic/*` وأن تضع واجهة التنفيذ الخلفية في سياسة وقت تشغيل المزود/النموذج.

    ### الفوترة و`claude -p`

    يستخدم OpenClaw مسار `claude -p` غير التفاعلي الخاص بـ Claude Code لتشغيلات Claude CLI.
    تتعامل Anthropic حاليًا مع هذا المسار بوصفه استخدام Agent SDK/برمجيًا:

    - حتى 15 يونيو 2026، تتبع معالجة خطة الاشتراك قواعد Claude Code النشطة من Anthropic
      للحساب المسجّل دخوله.
    - بدءًا من 15 يونيو 2026، يُخصم استخدام `claude -p` ضمن خطة الاشتراك من
      رصيد Agent SDK الشهري للمستخدم أولًا، ثم من أرصدة الاستخدام بأسعار
      API القياسية إذا كانت أرصدة الاستخدام مفعّلة.
    - تستخدم تسجيلات دخول Console/مفتاح API فوترة API بنظام الدفع حسب الاستخدام ولا تحصل
      على رصيد Agent SDK الخاص بالاشتراك.

    يمكن لـ Anthropic تغيير فوترة Claude Code وسلوك حدود المعدل بدون إصدار
    OpenClaw. تحقق من `claude auth status` و`/status` ووثائق Anthropic المرتبطة عندما تكون
    قابلية توقع الفوترة مهمة.

    <Tip>
    للأتمتة الإنتاجية المشتركة، استخدم مفتاح Anthropic API بدلًا من
    Claude CLI. يدعم OpenClaw أيضًا خيارات بنمط الاشتراك من
    [OpenAI Codex](/ar/providers/openai)، و[Qwen Cloud](/ar/providers/qwen)،
    و[MiniMax](/ar/providers/minimax)، و[Z.AI / GLM](/ar/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## افتراضيات التفكير (Claude Fable 5 و4.8 و4.6)

يستخدم `anthropic/claude-fable-5` دائمًا التفكير التكيفي ويفترض جهد `high`
افتراضيًا. لأن Anthropic لا تسمح بتعطيل التفكير لهذا النموذج،
يستخدم `/think off` و`/think minimal` جهد `low`. كما يحذف OpenClaw قيم
درجة الحرارة المخصصة لطلبات Fable 5.

يبقي Claude Opus 4.8 التفكير معطّلًا افتراضيًا في OpenClaw. عندما تفعّل التفكير التكيفي صراحة باستخدام `/think high|xhigh|max`، يرسل OpenClaw قيم جهد Opus 4.8 من Anthropic؛ وتفترض نماذج Claude 4.6 القيمة `adaptive`.

تجاوز لكل رسالة باستخدام `/think:<level>` أو في معلمات النموذج:

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

## التخزين المؤقت للمطالبات

يدعم OpenClaw ميزة التخزين المؤقت للمطالبات من Anthropic لمصادقة مفتاح API.

| القيمة              | مدة التخزين المؤقت | الوصف                                  |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (افتراضي) | 5 دقائق        | يُطبّق تلقائيًا لمصادقة مفتاح API |
| `"long"`            | ساعة واحدة     | تخزين مؤقت ممتد                       |
| `"none"`            | بلا تخزين مؤقت | تعطيل التخزين المؤقت للمطالبات       |

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
    2. `agents.list[].params` (مطابقة `id`، تتجاوز حسب المفتاح)

    يتيح هذا لوكيل واحد الاحتفاظ بتخزين مؤقت طويل العمر بينما يعطّل وكيل آخر على النموذج نفسه التخزين المؤقت لحركة مرور اندفاعية/منخفضة إعادة الاستخدام.

  </Accordion>

  <Accordion title="ملاحظات Bedrock Claude">
    - تقبل نماذج Anthropic Claude على Bedrock (`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند تكوينها.
    - تُجبر نماذج Bedrock غير التابعة لـ Anthropic على `cacheRetention: "none"` في وقت التشغيل.
    - كما تهيئ الافتراضات الذكية لمفتاح API القيمة `cacheRetention: "short"` لمراجع Claude-on-Bedrock عندما لا تُعيّن قيمة صريحة.

  </Accordion>
</AccordionGroup>

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="الوضع السريع">
    يدعم مفتاح التبديل المشترك `/fast` في OpenClaw حركة Anthropic المباشرة (مفتاح API وOAuth إلى `api.anthropic.com`).

    | الأمر | يطابق |
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
    - يُحقن فقط لطلبات `api.anthropic.com` المباشرة. تترك مسارات الوكيل `service_tier` كما هو.
    - تتجاوز معلمات `serviceTier` أو `service_tier` الصريحة `/fast` عندما يُعيّن كلاهما.
    - في الحسابات التي لا تملك سعة Priority Tier، قد تُحل `service_tier: "auto"` إلى `standard`.

    </Note>

  </Accordion>

  <Accordion title="فهم الوسائط (الصور وPDF)">
    يسجل Plugin Anthropic المضمّن فهم الصور وPDF. يحل OpenClaw
    إمكانات الوسائط تلقائيًا من مصادقة Anthropic المكوّنة — لا حاجة
    إلى إعدادات إضافية.

    | الخاصية        | القيمة                |
    | --------------- | --------------------- |
    | النموذج الافتراضي | `claude-opus-4-8`     |
    | الإدخال المدعوم | الصور، مستندات PDF |

    عند إرفاق صورة أو PDF بمحادثة، يوجهها OpenClaw تلقائيًا
    عبر مزود فهم وسائط Anthropic.

  </Accordion>

  <Accordion title="نافذة سياق 1M">
    تتوفر نافذة سياق 1M من Anthropic على نماذج Claude 4.x القادرة على GA
    مثل Opus 4.8 وOpus 4.7 وOpus 4.6 وSonnet 4.6. يضبط OpenClaw حجم هذه النماذج عند
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

    يمكن للإعدادات الأقدم إبقاء `params.context1m: true`، لكن OpenClaw لم يعد يرسل
    ترويسة beta المتقاعدة `context-1m-2025-08-07`. تُتجاهل إدخالات إعدادات `anthropicBeta`
    الأقدم التي تحتوي على تلك القيمة أثناء حل ترويسات الطلب، وتبقى
    نماذج Claude الأقدم غير المدعومة على نافذة سياقها العادية.

    ينطبق `params.context1m: true` أيضًا على واجهة Claude CLI الخلفية
    (`claude-cli/*`) لنماذج Opus وSonnet المؤهلة والقادرة على GA، مع الحفاظ على
    نافذة سياق وقت التشغيل لتلك جلسات CLI لتطابق سلوك API المباشر.

    <Warning>
    يتطلب وصول سياق طويل على بيانات اعتماد Anthropic الخاصة بك. تحتفظ مصادقة رمز OAuth/الاشتراك بترويسات beta المطلوبة من Anthropic، لكن OpenClaw يزيل ترويسة beta المتقاعدة 1M إذا بقيت في الإعدادات الأقدم.
    </Warning>

  </Accordion>

  <Accordion title="سياق Claude Opus 4.8 بحجم 1M">
    يملك `anthropic/claude-opus-4-8` ومتغيره `claude-cli` نافذة سياق 1M
    افتراضيًا — لا حاجة إلى `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / أصبح الرمز غير صالح فجأة">
    تنتهي صلاحية مصادقة رمز Anthropic ويمكن إبطالها. للإعدادات الجديدة، استخدم مفتاح Anthropic API بدلًا من ذلك.
  </Accordion>

  <Accordion title='لم يتم العثور على مفتاح API للمزوّد "anthropic"'>
    مصادقة Anthropic تكون **لكل وكيل** — لا ترث الوكلاء الجدد مفاتيح الوكيل الرئيسي. أعد تشغيل التهيئة لذلك الوكيل (أو اضبط مفتاح API على مضيف Gateway)، ثم تحقّق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يتم العثور على بيانات اعتماد للملف الشخصي "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف المصادقة الشخصي النشط. أعد تشغيل التهيئة، أو اضبط مفتاح API لمسار ذلك الملف الشخصي.
  </Accordion>

  <Accordion title="لا يوجد ملف مصادقة شخصي متاح (الكل في فترة تهدئة)">
    تحقّق من `auth.unusableProfiles` في `openclaw models status --json`. يمكن أن تكون فترات تهدئة حدود المعدل في Anthropic خاصة بالنموذج، لذلك قد يظل نموذج Anthropic شقيق قابلاً للاستخدام. أضف ملف Anthropic شخصيًا آخر أو انتظر انتهاء فترة التهدئة.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="خلفيات CLI" href="/ar/gateway/cli-backends" icon="terminal">
    إعداد خلفية Claude CLI وتفاصيل وقت التشغيل.
  </Card>
  <Card title="التخزين المؤقت للمطالبات" href="/ar/reference/prompt-caching" icon="database">
    كيف يعمل التخزين المؤقت للمطالبات عبر المزوّدين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
