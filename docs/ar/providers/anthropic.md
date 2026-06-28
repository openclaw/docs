---
read_when:
    - تريد استخدام نماذج Anthropic في OpenClaw
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:45:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

تبني Anthropic عائلة نماذج **Claude**. يدعم OpenClaw مسارين للمصادقة:

- **مفتاح API** — وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام (نماذج `anthropic/*`)
- **Claude CLI** — إعادة استخدام تسجيل دخول Claude Code موجود على المضيف نفسه

<Warning>
يشغّل backend الخاص بـ Claude CLI في OpenClaw واجهة Claude Code CLI المثبتة في
وضع طباعة غير تفاعلي. تصف وثائق Claude Code الحالية من Anthropic الأمر
`claude -p` على أنه استخدام Agent SDK/برمجي. أوقف تحديث دعم Anthropic بتاريخ 15 يونيو 2026
تغيير فوترة Agent SDK المعلن عنه مؤقتًا. في الوقت الحالي، تقول Anthropic إن
استخدام Claude Agent SDK و`claude -p` وتطبيقات الجهات الخارجية لا يزال يُخصم من
حدود استخدام الاشتراك. رصيد Agent SDK الشهري المعلن عنه سابقًا
غير متاح بينما تراجع Anthropic تلك الخطة.

لا يزال Claude Code التفاعلي يُخصم من حدود خطة Claude المسجّل الدخول إليها. وتظل مصادقة
مفتاح API فوترة API مباشرة بنظام الدفع حسب الاستخدام. بالنسبة إلى مضيفات Gateway طويلة العمر،
والأتمتة المشتركة، والإنفاق الإنتاجي المتوقع، استخدم مفتاح Anthropic API.

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
  <Tab title="API key">
    **الأفضل لـ:** وصول API القياسي والفوترة حسب الاستخدام.

    <Steps>
      <Step title="Get your API key">
        أنشئ مفتاح API في [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        أو مرّر المفتاح مباشرة:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### مثال إعداد

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
      <Step title="Ensure Claude CLI is installed and logged in">
        تحقق باستخدام:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        يكتشف OpenClaw بيانات اعتماد Claude CLI الموجودة ويعيد استخدامها.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    توجد تفاصيل الإعداد ووقت التشغيل الخاصة بـ backend لـ Claude CLI في [Backends الخاصة بـ CLI](/ar/gateway/cli-backends).
    </Note>

    <Warning>
    تتوقع إعادة استخدام Claude CLI أن تعمل عملية OpenClaw على المضيف نفسه الذي توجد عليه
    جلسة تسجيل دخول Claude CLI. يمكن لتثبيتات Docker الاحتفاظ بموطن الحاوية وتسجيل الدخول إلى
    Claude Code هناك؛ راجع
    [backend لـ Claude CLI في Docker](/ar/install/docker#claude-cli-backend-in-docker).
    لا تقوم تثبيتات الحاويات الأخرى مثل [Podman](/ar/install/podman) بتركيب
    `~/.claude` الخاص بالمضيف في الإعداد أو وقت التشغيل؛ استخدم مفتاح Anthropic API هناك، أو اختر
    موفّرًا مع OAuth مُدار من OpenClaw مثل
    [OpenAI Codex](/ar/providers/openai).
    </Warning>

    ### مثال إعداد

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

    لا تزال مراجع النماذج القديمة `claude-cli/claude-opus-4-7` تعمل من أجل
    التوافق، لكن يجب أن تُبقي الإعدادات الجديدة اختيار الموفّر/النموذج بصيغة
    `anthropic/*` وأن تضع backend التنفيذ في سياسة وقت تشغيل الموفّر/النموذج.

    ### الفوترة و`claude -p`

    يستخدم OpenClaw مسار `claude -p` غير التفاعلي الخاص بـ Claude Code لتشغيلات Claude CLI.
    تتعامل Anthropic حاليًا مع هذا المسار على أنه استخدام Agent SDK/برمجي:

    - أوقف تحديث دعم Anthropic بتاريخ 15 يونيو 2026 الخطة المعلنة سابقًا
      لرصيد Agent SDK منفصل.
    - في الوقت الحالي، لا يزال استخدام Claude Agent SDK و`claude -p` وتطبيقات
      الجهات الخارجية ضمن خطة الاشتراك يُخصم من حدود استخدام الاشتراك المسجّل الدخول إليه.
    - رصيد Agent SDK الشهري المعلن عنه سابقًا غير متاح بينما
      تراجع Anthropic تلك الخطة.
    - تستخدم تسجيلات دخول Console/مفتاح API فوترة API بنظام الدفع حسب الاستخدام ولا تحصل على
      رصيد Agent SDK الخاص بالاشتراك.

    راجع [مقالة خطة Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    من Anthropic لإشعار الإيقاف المؤقت، ومقالات خطة Claude Code لسلوك اشتراكات
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    و
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    يمكن أن تغيّر Anthropic فوترة Claude Code وسلوك حدود المعدل بدون
    إصدار OpenClaw. تحقق من `claude auth status` و`/status` ووثائق Anthropic المرتبطة
    عندما تكون قابلية توقع الفوترة مهمة.

    <Tip>
    للأتمتة الإنتاجية المشتركة، استخدم مفتاح Anthropic API بدلًا من
    Claude CLI. يدعم OpenClaw أيضًا خيارات بنمط الاشتراك من
    [OpenAI Codex](/ar/providers/openai)، و[Qwen Cloud](/ar/providers/qwen)،
    و[MiniMax](/ar/providers/minimax)، و[Z.AI / GLM](/ar/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## افتراضيات التفكير (Claude Fable 5 و4.8 و4.6)

يستخدم `anthropic/claude-fable-5` دائمًا التفكير التكيّفي ويضبط الافتراضي على جهد `high`.
لأن Anthropic لا تسمح بتعطيل التفكير لهذا النموذج،
يستخدم `/think off` و`/think minimal` جهد `low`. يحذف OpenClaw أيضًا قيم
الحرارة المخصصة لطلبات Fable 5.

يبقي Claude Opus 4.8 التفكير متوقفًا افتراضيًا في OpenClaw. عندما تفعّل التفكير التكيّفي صراحةً باستخدام `/think high|xhigh|max`، يرسل OpenClaw قيم جهد Opus 4.8 الخاصة بـ Anthropic؛ وتكون نماذج Claude 4.6 افتراضيًا على `adaptive`.

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
- [التفكير التكيّفي](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [التفكير الموسّع](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## تخزين المطالبات مؤقتًا

يدعم OpenClaw ميزة تخزين المطالبات مؤقتًا من Anthropic لمصادقة مفتاح API.

| القيمة              | مدة التخزين المؤقت | الوصف                                  |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (افتراضي) | 5 دقائق        | يُطبّق تلقائيًا لمصادقة مفتاح API      |
| `"long"`            | ساعة واحدة     | تخزين مؤقت ممتد                        |
| `"none"`            | بلا تخزين مؤقت | تعطيل تخزين المطالبات مؤقتًا           |

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
  <Accordion title="Per-agent cache overrides">
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
    2. `agents.list[].params` (مطابقة `id`، يتجاوز حسب المفتاح)

    يتيح هذا لوكيل واحد الاحتفاظ بتخزين مؤقت طويل العمر بينما يعطّل وكيل آخر على النموذج نفسه التخزين المؤقت لحركة المرور المتدفقة/منخفضة إعادة الاستخدام.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - تقبل نماذج Anthropic Claude على Bedrock (`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند إعدادها.
    - تُجبر نماذج Bedrock غير التابعة لـ Anthropic على `cacheRetention: "none"` في وقت التشغيل.
    - تزرع الافتراضيات الذكية لمفتاح API أيضًا `cacheRetention: "short"` لمراجع Claude-on-Bedrock عند عدم تعيين قيمة صريحة.

  </Accordion>
</AccordionGroup>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="Fast mode">
    يدعم مفتاح تبديل `/fast` المشترك في OpenClaw حركة Anthropic المباشرة (مفتاح API وOAuth إلى `api.anthropic.com`).

    | الأمر | يُعيّن إلى |
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
    - تتجاوز معلمات `serviceTier` أو `service_tier` الصريحة `/fast` عند تعيين كليهما.
    - في الحسابات التي لا تملك سعة Priority Tier، قد يتحول `service_tier: "auto"` إلى `standard`.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    يسجّل Plugin Anthropic المضمّن فهم الصور وPDF. يحل OpenClaw
    قدرات الوسائط تلقائيًا من مصادقة Anthropic المعدّة — لا حاجة إلى
    إعداد إضافي.

    | الخاصية        | القيمة                |
    | --------------- | --------------------- |
    | النموذج الافتراضي | `claude-opus-4-8`     |
    | الإدخال المدعوم | الصور، مستندات PDF |

    عند إرفاق صورة أو PDF بمحادثة، يوجّه OpenClaw ذلك تلقائيًا
    عبر موفّر فهم الوسائط من Anthropic.

  </Accordion>

  <Accordion title="1M context window">
    نافذة السياق 1M من Anthropic متاحة على نماذج Claude 4.x القادرة على GA
    مثل Opus 4.8 وOpus 4.7 وOpus 4.6 وSonnet 4.6. يضبط OpenClaw حجم تلك النماذج على
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

    يمكن للإعدادات الأقدم الاحتفاظ بـ `params.context1m: true`، لكن OpenClaw لم يعد يرسل
    ترويسة beta المتقاعدة `context-1m-2025-08-07`. يتم تجاهل إدخالات إعداد
    `anthropicBeta` الأقدم التي تحتوي على تلك القيمة أثناء حل ترويسات الطلب،
    وتبقى نماذج Claude الأقدم غير المدعومة على نافذة سياقها العادية.

    ينطبق `params.context1m: true` أيضًا على backend الخاص بـ Claude CLI
    (`claude-cli/*`) لنماذج Opus وSonnet المؤهلة والقادرة على GA، مع الحفاظ
    على نافذة سياق وقت التشغيل لتلك جلسات CLI لتطابق سلوك API المباشر.

    <Warning>
    يتطلب وصول السياق الطويل على بيانات اعتماد Anthropic الخاصة بك. تحتفظ مصادقة رمز OAuth/الاشتراك بترويسات beta المطلوبة من Anthropic، لكن OpenClaw يزيل ترويسة 1M beta المتقاعدة إذا بقيت في إعداد أقدم.
    </Warning>

  </Accordion>

  <Accordion title="سياق Claude Opus 4.8 بسعة 1M">
    يحتوي `anthropic/claude-opus-4-8` ونسخته `claude-cli` على نافذة سياق بسعة 1M
    افتراضيًا — لا حاجة إلى `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / أصبح الرمز غير صالح فجأة">
    تنتهي صلاحية مصادقة رمز Anthropic ويمكن إبطالها. للإعدادات الجديدة، استخدم مفتاح API من Anthropic بدلًا من ذلك.
  </Accordion>

  <Accordion title='لم يتم العثور على مفتاح API للموفّر "anthropic"'>
    مصادقة Anthropic تكون **لكل وكيل** — لا ترث الوكلاء الجدد مفاتيح الوكيل الرئيسي. أعد تشغيل التهيئة لذلك الوكيل (أو اضبط مفتاح API على مضيف Gateway)، ثم تحقق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يتم العثور على بيانات اعتماد للملف الشخصي "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف المصادقة الشخصي النشط. أعد تشغيل التهيئة، أو اضبط مفتاح API لمسار ذلك الملف الشخصي.
  </Accordion>

  <Accordion title="لا يوجد ملف مصادقة شخصي متاح (الكل في فترة تهدئة)">
    تحقق من `auth.unusableProfiles` عبر `openclaw models status --json`. يمكن أن تكون فترات تهدئة حدود المعدل في Anthropic مقيّدة بالنموذج، لذلك قد يظل نموذج Anthropic شقيق قابلًا للاستخدام. أضف ملف Anthropic شخصيًا آخر أو انتظر انتهاء فترة التهدئة.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="واجهات CLI الخلفية" href="/ar/gateway/cli-backends" icon="terminal">
    إعداد واجهة Claude CLI الخلفية وتفاصيل وقت التشغيل.
  </Card>
  <Card title="تخزين المطالبات مؤقتًا" href="/ar/reference/prompt-caching" icon="database">
    كيفية عمل تخزين المطالبات مؤقتًا عبر الموفّرين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
