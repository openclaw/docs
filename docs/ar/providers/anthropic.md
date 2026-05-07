---
read_when:
    - تريد استخدام نماذج Anthropic في OpenClaw
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

تطوّر Anthropic عائلة نماذج **Claude**. يدعم OpenClaw مساري مصادقة:

- **مفتاح API** — وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام (نماذج `anthropic/*`)
- **Claude CLI** — إعادة استخدام تسجيل دخول Claude CLI موجود على المضيف نفسه

<Warning>
أبلغنا موظفو Anthropic بأن استخدام Claude CLI على نمط OpenClaw مسموح به مجدداً، لذلك
يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مصرّح بهما ما لم
تنشر Anthropic سياسة جديدة.

بالنسبة إلى مضيفي Gateway طويلي العمر، تظل مفاتيح Anthropic API أوضح مسار إنتاجي
وأكثر قابلية للتنبؤ.

مستندات Anthropic العامة الحالية:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [نظرة عامة على Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [استخدام Claude Code مع خطة Pro أو Max الخاصة بك](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [استخدام Claude Code مع خطة Team أو Enterprise الخاصة بك](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## بدء الاستخدام

<Tabs>
  <Tab title="مفتاح API">
    **الأفضل لـ:** الوصول القياسي إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API في [Anthropic Console](https://console.anthropic.com/).
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

    ### مثال على التكوين

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Claude CLI موجود دون مفتاح API منفصل.

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
    توجد تفاصيل الإعداد ووقت التشغيل للواجهة الخلفية لـ Claude CLI في [واجهات CLI الخلفية](/ar/gateway/cli-backends).
    </Note>

    ### مثال على التكوين

    فضّل مرجع نموذج Anthropic القياسي مع تجاوز وقت تشغيل CLI:

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

    ما زالت مراجع النماذج القديمة `claude-cli/claude-opus-4-7` تعمل من أجل
    التوافق، لكن ينبغي للتكوين الجديد أن يبقي اختيار الموفر/النموذج بصيغة
    `anthropic/*` وأن يضع واجهة التنفيذ الخلفية في `agentRuntime.id`.

    <Tip>
    إذا كنت تريد أوضح مسار للفوترة، فاستخدم مفتاح Anthropic API بدلاً من ذلك. يدعم OpenClaw أيضاً خيارات بنمط الاشتراك من [OpenAI Codex](/ar/providers/openai)، و[Qwen Cloud](/ar/providers/qwen)، و[MiniMax](/ar/providers/minimax)، و[Z.AI / GLM](/ar/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## إعدادات التفكير الافتراضية (Claude 4.6)

تستخدم نماذج Claude 4.6 التفكير `adaptive` افتراضياً في OpenClaw عند عدم تعيين مستوى تفكير صريح.

تجاوز ذلك لكل رسالة باستخدام `/think:<level>` أو ضمن معاملات النموذج:

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
مستندات Anthropic ذات الصلة:
- [التفكير التكيفي](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [التفكير الممتد](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## تخزين الموجهات مؤقتاً

يدعم OpenClaw ميزة تخزين الموجهات مؤقتاً في Anthropic لمصادقة مفتاح API.

| القيمة               | مدة التخزين المؤقت | الوصف                                  |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (الافتراضي) | 5 دقائق        | يطبّق تلقائياً لمصادقة مفتاح API |
| `"long"`            | ساعة واحدة     | تخزين مؤقت ممتد                        |
| `"none"`            | بلا تخزين مؤقت | تعطيل تخزين الموجهات مؤقتاً            |

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
    استخدم معاملات مستوى النموذج كخط أساس، ثم تجاوز وكلاء محددين عبر `agents.list[].params`:

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

    ترتيب دمج التكوين:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (مطابقة `id`، وتتجاوز حسب المفتاح)

    يتيح ذلك لوكيل واحد الاحتفاظ بتخزين مؤقت طويل العمر بينما يعطّل وكيل آخر على النموذج نفسه التخزين المؤقت لحركة مرور متقطعة/قليلة إعادة الاستخدام.

  </Accordion>

  <Accordion title="ملاحظات Bedrock Claude">
    - تقبل نماذج Anthropic Claude على Bedrock (`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند تكوينها.
    - تُفرض قيمة `cacheRetention: "none"` على نماذج Bedrock غير التابعة لـ Anthropic في وقت التشغيل.
    - تضبط الإعدادات الافتراضية الذكية لمفتاح API أيضاً قيمة `cacheRetention: "short"` لمراجع Claude-on-Bedrock عند عدم تعيين قيمة صريحة.

  </Accordion>
</AccordionGroup>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="الوضع السريع">
    يدعم مفتاح التبديل المشترك `/fast` في OpenClaw حركة Anthropic المباشرة (مفتاح API وOAuth إلى `api.anthropic.com`).

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
    - تتجاوز معاملات `serviceTier` أو `service_tier` الصريحة `/fast` عند تعيينهما معاً.
    - في الحسابات التي لا تملك سعة Priority Tier، قد تُحل `service_tier: "auto"` إلى `standard`.

    </Note>

  </Accordion>

  <Accordion title="فهم الوسائط (الصور وPDF)">
    يسجّل Plugin Anthropic المضمّن فهم الصور وPDF. يحل OpenClaw
    إمكانات الوسائط تلقائياً من مصادقة Anthropic المكوّنة — ولا حاجة إلى
    تكوين إضافي.

    | الخاصية        | القيمة                 |
    | --------------- | --------------------- |
    | النموذج الافتراضي   | `claude-opus-4-7`     |
    | الإدخال المدعوم | الصور، مستندات PDF |

    عند إرفاق صورة أو PDF بمحادثة، يوجّه OpenClaw ذلك تلقائياً عبر موفر فهم الوسائط من Anthropic.

  </Accordion>

  <Accordion title="نافذة سياق 1M (تجريبية)">
    نافذة السياق 1M في Anthropic مقيّدة بإصدار تجريبي. مكّنها لكل نموذج:

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

    يعيّن OpenClaw هذا إلى `anthropic-beta: context-1m-2025-08-07` في الطلبات.

    ينطبق `params.context1m: true` أيضاً على الواجهة الخلفية Claude CLI
    (`claude-cli/*`) لنماذج Opus وSonnet المؤهلة، مما يوسّع نافذة سياق وقت التشغيل
    لتلك جلسات CLI كي تطابق سلوك API المباشر.

    <Warning>
    يتطلب وصولاً إلى السياق الطويل على بيانات اعتماد Anthropic الخاصة بك. تُرفض مصادقة الرمز القديمة (`sk-ant-oat-*`) لطلبات سياق 1M — ويسجل OpenClaw تحذيراً ثم يعود إلى نافذة السياق القياسية.
    </Warning>

  </Accordion>

  <Accordion title="سياق 1M في Claude Opus 4.7">
    لدى `anthropic/claude-opus-4.7` ومتغيره `claude-cli` نافذة سياق 1M
    افتراضياً — ولا حاجة إلى `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / أصبح الرمز غير صالح فجأة">
    تنتهي صلاحية مصادقة رمز Anthropic ويمكن إبطالها. بالنسبة إلى الإعدادات الجديدة، استخدم مفتاح Anthropic API بدلاً من ذلك.
  </Accordion>

  <Accordion title='لم يُعثر على مفتاح API للموفر "anthropic"'>
    مصادقة Anthropic تكون **لكل وكيل** — لا ترث الوكلاء الجديدة مفاتيح الوكيل الرئيسي. أعد تشغيل الإعداد الأولي لذلك الوكيل (أو كوّن مفتاح API على مضيف Gateway)، ثم تحقق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يُعثر على بيانات اعتماد لملف التعريف "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف تعريف المصادقة النشط. أعد تشغيل الإعداد الأولي، أو كوّن مفتاح API لمسار ملف التعريف ذلك.
  </Accordion>

  <Accordion title="لا يوجد ملف تعريف مصادقة متاح (كلها في فترة تهدئة)">
    تحقق من `openclaw models status --json` للاطلاع على `auth.unusableProfiles`. يمكن أن تكون فترات تهدئة حدود المعدل في Anthropic مقيّدة بنموذج معين، لذلك قد يظل نموذج Anthropic شقيق قابلاً للاستخدام. أضف ملف تعريف Anthropic آخر أو انتظر انتهاء فترة التهدئة.
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
    إعداد الواجهة الخلفية Claude CLI وتفاصيل وقت التشغيل.
  </Card>
  <Card title="تخزين الموجهات مؤقتاً" href="/ar/reference/prompt-caching" icon="database">
    كيفية عمل تخزين الموجهات مؤقتاً عبر الموفرين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
