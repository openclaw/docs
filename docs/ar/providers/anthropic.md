---
read_when:
    - تريد استخدام نماذج Anthropic في OpenClaw
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-30T08:19:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

تُنشئ Anthropic عائلة نماذج **Claude**. يدعم OpenClaw مساري مصادقة:

- **مفتاح API** — وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام (نماذج `anthropic/*`)
- **Claude CLI** — إعادة استخدام تسجيل دخول Claude CLI موجود على المضيف نفسه

<Warning>
أبلغنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك
يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مصرّح بهما ما لم
تنشر Anthropic سياسة جديدة.

بالنسبة إلى مضيفي Gateway طويلِي الأمد، تظل مفاتيح Anthropic API هي مسار الإنتاج الأوضح
والأكثر قابلية للتنبؤ.

وثائق Anthropic العامة الحالية:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [نظرة عامة على Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [استخدام Claude Code مع خطة Pro أو Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [استخدام Claude Code مع خطة Team أو Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## بدء الاستخدام

<Tabs>
  <Tab title="مفتاح API">
    **الأفضل لـ:** الوصول القياسي إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API في [وحدة تحكم Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="شغّل الإعداد الأولي">
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

    ### مثال إعداد

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Claude CLI موجود من دون مفتاح API منفصل.

    <Steps>
      <Step title="تأكد من تثبيت Claude CLI وتسجيل الدخول إليه">
        تحقق باستخدام:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        يكتشف OpenClaw بيانات اعتماد Claude CLI الموجودة ويعيد استخدامها.
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    توجد تفاصيل الإعداد والتشغيل لواجهة Claude CLI الخلفية في [واجهات CLI الخلفية](/ar/gateway/cli-backends).
    </Note>

    ### مثال إعداد

    فضّل مرجع نموذج Anthropic القياسي مع تجاوز تشغيل CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    لا تزال مراجع نماذج `claude-cli/claude-opus-4-7` القديمة تعمل من أجل
    التوافق، لكن يجب أن تبقي الإعدادات الجديدة اختيار الموفر/النموذج على شكل
    `anthropic/*` وأن تضع واجهة التنفيذ الخلفية في `agentRuntime.id`.

    <Tip>
    إذا كنت تريد أوضح مسار فوترة، فاستخدم مفتاح Anthropic API بدلا من ذلك. يدعم OpenClaw أيضا خيارات بأسلوب الاشتراك من [OpenAI Codex](/ar/providers/openai) و[Qwen Cloud](/ar/providers/qwen) و[MiniMax](/ar/providers/minimax) و[Z.AI / GLM](/ar/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## افتراضيات التفكير (Claude 4.6)

تستخدم نماذج Claude 4.6 افتراضيا التفكير `adaptive` في OpenClaw عند عدم تعيين مستوى تفكير صريح.

تجاوَز لكل رسالة باستخدام `/think:<level>` أو في معلمات النموذج:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
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

## تخزين المطالبات مؤقتا

يدعم OpenClaw ميزة تخزين المطالبات مؤقتا من Anthropic لمصادقة مفتاح API.

| القيمة              | مدة التخزين المؤقت | الوصف                                  |
| ------------------- | ------------------ | -------------------------------------- |
| `"short"` (افتراضي) | 5 دقائق            | يُطبّق تلقائيا لمصادقة مفتاح API       |
| `"long"`            | ساعة واحدة         | تخزين مؤقت ممتد                        |
| `"none"`            | لا تخزين مؤقت      | تعطيل تخزين المطالبات مؤقتا            |

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
    استخدم معلمات مستوى النموذج كأساس، ثم تجاوز وكلاء محددين عبر `agents.list[].params`:

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
    2. `agents.list[].params` (مطابق لـ `id`، يتجاوز حسب المفتاح)

    يتيح هذا لوكيل واحد الاحتفاظ بتخزين مؤقت طويل الأمد بينما يوقف وكيل آخر على النموذج نفسه التخزين المؤقت لحركة المرور المتقطعة/قليلة إعادة الاستخدام.

  </Accordion>

  <Accordion title="ملاحظات Bedrock Claude">
    - تقبل نماذج Anthropic Claude على Bedrock (`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند تكوينها.
    - تُجبَر نماذج Bedrock غير التابعة لـ Anthropic على `cacheRetention: "none"` أثناء التشغيل.
    - تزرع الافتراضيات الذكية لمفتاح API أيضا `cacheRetention: "short"` لمراجع Claude على Bedrock عند عدم تعيين قيمة صريحة.

  </Accordion>
</AccordionGroup>

## إعداد متقدم

<AccordionGroup>
  <Accordion title="الوضع السريع">
    يدعم تبديل OpenClaw المشترك `/fast` حركة Anthropic المباشرة (مفتاح API وOAuth إلى `api.anthropic.com`).

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
    - يُحقن فقط لطلبات `api.anthropic.com` المباشرة. تترك مسارات الوكيل `service_tier` كما هي.
    - تتجاوز معلمات `serviceTier` أو `service_tier` الصريحة `/fast` عند تعيين كليهما.
    - في الحسابات التي لا تملك سعة Priority Tier، قد يتحول `service_tier: "auto"` إلى `standard`.

    </Note>

  </Accordion>

  <Accordion title="فهم الوسائط (الصور وPDF)">
    يسجل Plugin Anthropic المضمّن فهم الصور وPDF. يحل OpenClaw
    إمكانات الوسائط تلقائيا من مصادقة Anthropic المكوّنة — ولا حاجة إلى
    إعداد إضافي.

    | الخاصية       | القيمة               |
    | -------------- | -------------------- |
    | النموذج الافتراضي | `claude-opus-4-6` |
    | الإدخال المدعوم | الصور، مستندات PDF  |

    عند إرفاق صورة أو PDF بمحادثة، يوجهه OpenClaw تلقائيا عبر موفر فهم الوسائط في Anthropic.

  </Accordion>

  <Accordion title="نافذة سياق 1M (تجريبية)">
    نافذة السياق 1M من Anthropic محكومة بميزة تجريبية. فعّلها لكل نموذج:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    يطابق OpenClaw هذا مع `anthropic-beta: context-1m-2025-08-07` في الطلبات.

    ينطبق `params.context1m: true` أيضا على واجهة Claude CLI الخلفية
    (`claude-cli/*`) لنماذج Opus وSonnet المؤهلة، مما يوسع نافذة سياق التشغيل
    لتلك جلسات CLI لتطابق سلوك API المباشر.

    <Warning>
    يتطلب وصولا إلى السياق الطويل على بيانات اعتماد Anthropic الخاصة بك. تُرفض مصادقة الرموز القديمة (`sk-ant-oat-*`) لطلبات سياق 1M — يسجل OpenClaw تحذيرا ويعود إلى نافذة السياق القياسية.
    </Warning>

  </Accordion>

  <Accordion title="سياق 1M في Claude Opus 4.7">
    يملك `anthropic/claude-opus-4.7` ومتغيره `claude-cli` نافذة سياق 1M
    افتراضيا — لا حاجة إلى `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / أصبح الرمز غير صالح فجأة">
    تنتهي صلاحية مصادقة رموز Anthropic ويمكن إبطالها. للإعدادات الجديدة، استخدم مفتاح Anthropic API بدلا من ذلك.
  </Accordion>

  <Accordion title='لم يتم العثور على مفتاح API للموفر "anthropic"'>
    مصادقة Anthropic هي **لكل وكيل** — لا ترث الوكلاء الجدد مفاتيح الوكيل الرئيسي. أعد تشغيل الإعداد الأولي لذلك الوكيل (أو كوّن مفتاح API على مضيف Gateway)، ثم تحقق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يتم العثور على بيانات اعتماد للملف الشخصي "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف المصادقة الشخصي النشط. أعد تشغيل الإعداد الأولي، أو كوّن مفتاح API لمسار ذلك الملف الشخصي.
  </Accordion>

  <Accordion title="لا يوجد ملف مصادقة شخصي متاح (الكل في فترة تهدئة)">
    تحقق من `openclaw models status --json` بحثا عن `auth.unusableProfiles`. يمكن أن تكون فترات تهدئة حدود المعدل في Anthropic محددة بنموذج، لذلك قد يظل نموذج Anthropic شقيق قابلا للاستخدام. أضف ملف Anthropic شخصيا آخر أو انتظر انتهاء فترة التهدئة.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="واجهات CLI الخلفية" href="/ar/gateway/cli-backends" icon="terminal">
    إعداد واجهة Claude CLI الخلفية وتفاصيل التشغيل.
  </Card>
  <Card title="تخزين المطالبات مؤقتا" href="/ar/reference/prompt-caching" icon="database">
    كيفية عمل تخزين المطالبات مؤقتا عبر الموفرين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
