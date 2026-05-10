---
read_when:
    - تريد استخدام نماذج Anthropic في OpenClaw
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-10T19:56:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c36764f1adb7585389d241303e9c61c1fe2fa49fefdfb28c314abbafa646b273
    source_path: providers/anthropic.md
    workflow: 16
---

تُطوّر Anthropic عائلة نماذج **Claude**. يدعم OpenClaw مساري مصادقة:

- **مفتاح API** — وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام (نماذج `anthropic/*`)
- **Claude CLI** — إعادة استخدام تسجيل دخول Claude CLI موجود على المضيف نفسه

<Warning>
أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك
يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مصرّح بهما ما لم
تنشر Anthropic سياسة جديدة.

بالنسبة إلى مضيفي Gateway طويلة الأمد، لا تزال مفاتيح Anthropic API هي مسار الإنتاج الأوضح
والأكثر قابلية للتنبؤ.

مستندات Anthropic العامة الحالية:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [نظرة عامة على Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [استخدام Claude Code مع خطة Pro أو Max لديك](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [استخدام Claude Code مع خطة Team أو Enterprise لديك](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## البدء

<Tabs>
  <Tab title="مفتاح API">
    **الأفضل لـ:** وصول API القياسي والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API في [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        أو مرّر المفتاح مباشرةً:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="تحقّق من أن النموذج متاح">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### مثال على الإعدادات

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Claude CLI موجود بدون مفتاح API منفصل.

    <Steps>
      <Step title="تأكّد من تثبيت Claude CLI وتسجيل الدخول إليه">
        تحقّق باستخدام:

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
      <Step title="تحقّق من أن النموذج متاح">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    توجد تفاصيل الإعداد والتشغيل لخلفية Claude CLI في [خلفيات CLI](/ar/gateway/cli-backends).
    </Note>

    ### مثال على الإعدادات

    فضّل مرجع نموذج Anthropic القياسي مع تجاوز تشغيل CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          models: {
            "anthropic/claude-opus-4-7": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    لا تزال مراجع نماذج `claude-cli/claude-opus-4-7` القديمة تعمل من أجل
    التوافق، لكن يجب أن تبقي الإعدادات الجديدة اختيار المزوّد/النموذج بصيغة
    `anthropic/*` وأن تضع خلفية التنفيذ في سياسة تشغيل المزوّد/النموذج.

    <Tip>
    إذا أردت مسار الفوترة الأوضح، فاستخدم مفتاح Anthropic API بدلاً من ذلك. يدعم OpenClaw أيضاً خيارات بنمط الاشتراك من [OpenAI Codex](/ar/providers/openai)، و[Qwen Cloud](/ar/providers/qwen)، و[MiniMax](/ar/providers/minimax)، و[Z.AI / GLM](/ar/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## افتراضيات التفكير (Claude 4.6)

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
- [التفكير التكيّفي](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [التفكير الممتد](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## تخزين المطالبات مؤقتاً

يدعم OpenClaw ميزة تخزين المطالبات مؤقتاً من Anthropic لمصادقة مفتاح API.

| القيمة              | مدة التخزين المؤقت | الوصف                                  |
| ------------------- | ------------------ | -------------------------------------- |
| `"short"` (افتراضي) | 5 دقائق            | يُطبّق تلقائياً لمصادقة مفتاح API      |
| `"long"`            | ساعة واحدة         | تخزين مؤقت ممتد                        |
| `"none"`            | بدون تخزين مؤقت    | تعطيل تخزين المطالبات مؤقتاً           |

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

    ترتيب دمج الإعدادات:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (المطابقة لـ `id`، وتتجاوز حسب المفتاح)

    يتيح هذا لوكيل واحد الاحتفاظ بذاكرة تخزين مؤقت طويلة الأمد بينما يعطّل وكيل آخر على النموذج نفسه التخزين المؤقت لحركة المرور المتقطعة/منخفضة إعادة الاستخدام.

  </Accordion>

  <Accordion title="ملاحظات Bedrock Claude">
    - تقبل نماذج Anthropic Claude على Bedrock (`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند تكوينها.
    - تُجبَر نماذج Bedrock غير التابعة لـ Anthropic على `cacheRetention: "none"` وقت التشغيل.
    - كما تضع الافتراضيات الذكية لمفتاح API القيمة `cacheRetention: "short"` لمراجع Claude-on-Bedrock عندما لا تكون هناك قيمة صريحة معيّنة.

  </Accordion>
</AccordionGroup>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="الوضع السريع">
    يدعم مفتاح التبديل المشترك `/fast` في OpenClaw حركة Anthropic المباشرة (مفتاح API وOAuth إلى `api.anthropic.com`).

    | الأمر | يُطابَق مع |
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
    - يُحقن فقط لطلبات `api.anthropic.com` المباشرة. تترك مسارات الوكيل `service_tier` بدون تغيير.
    - معاملات `serviceTier` أو `service_tier` الصريحة تتجاوز `/fast` عند تعيينهما معاً.
    - في الحسابات التي لا تملك سعة Priority Tier، قد تُحلّ `service_tier: "auto"` إلى `standard`.

    </Note>

  </Accordion>

  <Accordion title="فهم الوسائط (الصور وPDF)">
    يسجّل Plugin Anthropic المضمّن فهم الصور وPDF. يحلّ OpenClaw
    إمكانات الوسائط تلقائياً من مصادقة Anthropic المكوّنة — لا حاجة إلى
    إعدادات إضافية.

    | الخاصية        | القيمة                |
    | --------------- | --------------------- |
    | النموذج الافتراضي | `claude-opus-4-7`     |
    | الإدخال المدعوم | الصور، مستندات PDF |

    عند إرفاق صورة أو PDF بمحادثة، يوجّهها OpenClaw تلقائياً
    عبر مزوّد فهم وسائط Anthropic.

  </Accordion>

  <Accordion title="نافذة سياق 1M (تجريبية)">
    نافذة السياق 1M من Anthropic محكومة ببوابة تجريبية. فعّلها لكل نموذج:

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

    ينطبق `params.context1m: true` أيضاً على خلفية Claude CLI
    (`claude-cli/*`) لنماذج Opus وSonnet المؤهلة، مما يوسّع نافذة سياق
    التشغيل لتلك جلسات CLI لتطابق سلوك API المباشر.

    <Warning>
    يتطلب وصولاً طويل السياق على بيانات اعتماد Anthropic لديك. تُرفض مصادقة الرمز القديمة (`sk-ant-oat-*`) لطلبات سياق 1M — يسجّل OpenClaw تحذيراً ويعود إلى نافذة السياق القياسية.
    </Warning>

  </Accordion>

  <Accordion title="سياق 1M في Claude Opus 4.7">
    يملك `anthropic/claude-opus-4.7` ومتغيره `claude-cli` نافذة سياق 1M
    افتراضياً — لا حاجة إلى `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / الرمز أصبح غير صالح فجأة">
    تنتهي صلاحية مصادقة رمز Anthropic ويمكن إبطالها. للإعدادات الجديدة، استخدم مفتاح Anthropic API بدلاً من ذلك.
  </Accordion>

  <Accordion title='لم يتم العثور على مفتاح API للمزوّد "anthropic"'>
    مصادقة Anthropic هي **لكل وكيل** — لا ترث الوكلاء الجدد مفاتيح الوكيل الرئيسي. أعد تشغيل الإعداد الأولي لذلك الوكيل (أو كوّن مفتاح API على مضيف Gateway)، ثم تحقّق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يتم العثور على بيانات اعتماد للملف الشخصي "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف المصادقة الشخصي النشط. أعد تشغيل الإعداد الأولي، أو كوّن مفتاح API لمسار ذلك الملف الشخصي.
  </Accordion>

  <Accordion title="لا يوجد ملف مصادقة شخصي متاح (الكل في فترة تهدئة)">
    افحص `openclaw models status --json` بحثاً عن `auth.unusableProfiles`. يمكن أن تكون فترات تهدئة حدود المعدل في Anthropic مقيّدة بنموذج معيّن، لذلك قد يظل نموذج Anthropic شقيق قابلاً للاستخدام. أضف ملف Anthropic شخصياً آخر أو انتظر انتهاء فترة التهدئة.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="خلفيات CLI" href="/ar/gateway/cli-backends" icon="terminal">
    إعداد خلفية Claude CLI وتفاصيل التشغيل.
  </Card>
  <Card title="تخزين المطالبات مؤقتاً" href="/ar/reference/prompt-caching" icon="database">
    كيفية عمل تخزين المطالبات مؤقتاً عبر المزوّدين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
