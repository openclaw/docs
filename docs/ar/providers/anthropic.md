---
read_when:
    - تريد استخدام نماذج Anthropic في OpenClaw
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-24T07:57:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db63fd33dce27b18f5807c995d9ce71b9d14fde55064f745bace31d7991b985
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic ‏(Claude)

تبني Anthropic عائلة نماذج **Claude**. ويدعم OpenClaw مسارين للمصادقة:

- **مفتاح API** — وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام ‏(نماذج `anthropic/*`)
- **Claude CLI** — إعادة استخدام تسجيل دخول Claude CLI موجود على المضيف نفسه

<Warning>
أخبرنا موظفو Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مجددًا، لذلك
يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما
مصرَّح بهما ما لم تنشر Anthropic سياسة جديدة.

وبالنسبة إلى مضيفات Gateway طويلة العمر، فما تزال مفاتيح API الخاصة بـ Anthropic هي المسار الإنتاجي الأوضح
والأكثر قابلية للتنبؤ.

وثائق Anthropic العامة الحالية:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [نظرة عامة على Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [استخدام Claude Code مع خطة Pro أو Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [استخدام Claude Code مع خطة Team أو Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## البدء

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
        # اختر: Anthropic API key
        ```

        أو مرّر المفتاح مباشرةً:

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

    ### مثال على التهيئة

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
      <Step title="تأكد من أن Claude CLI مثبتة ومسجّل الدخول فيها">
        تحقق باستخدام:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard
        # اختر: Claude CLI
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
    توجد تفاصيل الإعداد ووقت التشغيل الخاصة بالواجهة الخلفية لـ Claude CLI في [CLI Backends](/ar/gateway/cli-backends).
    </Note>

    <Tip>
    إذا كنت تريد مسار فوترة أوضح، فاستخدم مفتاح API من Anthropic بدلًا من ذلك. ويدعم OpenClaw أيضًا خيارات بنمط الاشتراك من [OpenAI Codex](/ar/providers/openai), و[Qwen Cloud](/ar/providers/qwen), و[MiniMax](/ar/providers/minimax), و[Z.AI / GLM](/ar/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## الإعدادات الافتراضية للتفكير (Claude 4.6)

تستخدم نماذج Claude 4.6 افتراضيًا نمط التفكير `adaptive` في OpenClaw عندما لا يكون هناك مستوى تفكير صريح مضبوط.

يمكنك التجاوز لكل رسالة باستخدام `/think:<level>` أو داخل معلمات النموذج:

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

## Prompt caching

يدعم OpenClaw ميزة prompt caching الخاصة بـ Anthropic في حالة المصادقة عبر مفتاح API.

| القيمة               | مدة cache      | الوصف                                 |
| ------------------- | -------------- | ------------------------------------- |
| `"short"` (افتراضي) | 5 دقائق        | تُطبّق تلقائيًا لمصادقة مفتاح API     |
| `"long"`            | 1 ساعة         | cache ممتدة                           |
| `"none"`            | بلا تخزين مؤقت | تعطيل prompt caching                  |

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
  <Accordion title="تجاوزات cache لكل وكيل">
    استخدم معلمات على مستوى النموذج كخط أساس، ثم تجاوز الوكلاء المحددين عبر `agents.list[].params`:

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

    ترتيب دمج التهيئة:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` ‏(عند تطابق `id`, تتجاوز حسب المفتاح)

    وهذا يسمح لوكيل واحد بالاحتفاظ بـ cache طويلة العمر بينما يعطّل وكيل آخر على النموذج نفسه التخزين المؤقت لحركة المرور الاندفاعية/منخفضة إعادة الاستخدام.

  </Accordion>

  <Accordion title="ملاحظات Bedrock Claude">
    - تقبل نماذج Anthropic Claude على Bedrock ‏(`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند تهيئتها.
    - تُفرض على نماذج Bedrock غير التابعة لـ Anthropic القيمة `cacheRetention: "none"` في وقت التشغيل.
    - كما تملأ الإعدادات الافتراضية الذكية لمفتاح API القيمة `cacheRetention: "short"` لمراجع Claude-on-Bedrock عندما لا تكون هناك قيمة صريحة مضبوطة.
  </Accordion>
</AccordionGroup>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="الوضع السريع">
    يدعم مفتاح `/fast` المشترك في OpenClaw حركة Anthropic المباشرة (مفتاح API وOAuth إلى `api.anthropic.com`).

    | الأمر | يُربط إلى |
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
    - يُحقن فقط في الطلبات المباشرة إلى `api.anthropic.com`. وتترك مسارات proxy قيمة `service_tier` كما هي.
    - تتجاوز معلمات `serviceTier` أو `service_tier` الصريحة قيمة `/fast` عند ضبطهما معًا.
    - في الحسابات التي لا تمتلك سعة Priority Tier, قد تُحل القيمة `service_tier: "auto"` إلى `standard`.
    </Note>

  </Accordion>

  <Accordion title="فهم الوسائط (الصورة وPDF)">
    تسجّل Plugin Anthropic المضمّنة فهم الصور وPDF. ويقوم OpenClaw
    بحل قدرات الوسائط تلقائيًا من مصادقة Anthropic المهيأة — ولا
    حاجة إلى أي تهيئة إضافية.

    | الخاصية        | القيمة               |
    | -------------- | -------------------- |
    | النموذج الافتراضي | `claude-opus-4-6`   |
    | المدخلات المدعومة | الصور، ومستندات PDF |

    عند إرفاق صورة أو PDF بمحادثة، يقوم OpenClaw تلقائيًا
    بتوجيهها عبر مزوّد فهم الوسائط الخاص بـ Anthropic.

  </Accordion>

  <Accordion title="نافذة سياق 1M (تجريبية)">
    نافذة السياق 1M الخاصة بـ Anthropic مقيّدة بنسخة تجريبية. فعّلها لكل نموذج:

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

    يربط OpenClaw هذا إلى `anthropic-beta: context-1m-2025-08-07` في الطلبات.

    <Warning>
    يتطلب ذلك وصول long-context على بيانات اعتماد Anthropic الخاصة بك. ويُرفض token auth القديمة (`sk-ant-oat-*`) لطلبات سياق 1M — إذ يسجل OpenClaw تحذيرًا ويعود إلى نافذة السياق القياسية.
    </Warning>

  </Accordion>

  <Accordion title="سياق 1M في Claude Opus 4.7">
    يمتلك `anthropic/claude-opus-4.7` ومتغير `claude-cli` الخاص به سياقًا بحجم 1M
    افتراضيًا — ولا حاجة إلى `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / أصبح token غير صالح فجأة">
    تنتهي صلاحية token auth الخاصة بـ Anthropic ويمكن إلغاؤها. بالنسبة إلى الإعدادات الجديدة، استخدم مفتاح API من Anthropic بدلًا من ذلك.
  </Accordion>

  <Accordion title='لم يتم العثور على مفتاح API للمزوّد "anthropic"'>
    مصادقة Anthropic تكون **لكل وكيل** — لا ترث الوكلاء الجدد مفاتيح الوكيل الرئيسي. أعد تشغيل الإعداد الأولي لذلك الوكيل (أو هيّئ مفتاح API على مضيف gateway)، ثم تحقق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يتم العثور على بيانات اعتماد لملف التعريف "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف تعريف المصادقة النشط. أعد تشغيل الإعداد الأولي، أو هيّئ مفتاح API لذلك المسار الخاص بملف التعريف.
  </Accordion>

  <Accordion title="لا يوجد ملف تعريف مصادقة متاح (الجميع في فترة تهدئة)">
    تحقق من `openclaw models status --json` لمعرفة `auth.unusableProfiles`. إذ يمكن أن تكون فترات تهدئة Anthropic الخاصة بمعدل الطلبات مرتبطة بالنموذج، لذا قد يظل نموذج Anthropic شقيق قابلًا للاستخدام. أضف ملف تعريف Anthropic آخر أو انتظر انتهاء فترة التهدئة.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="CLI backends" href="/ar/gateway/cli-backends" icon="terminal">
    إعداد الواجهة الخلفية لـ Claude CLI وتفاصيل وقت التشغيل.
  </Card>
  <Card title="Prompt caching" href="/ar/reference/prompt-caching" icon="database">
    كيف يعمل prompt caching عبر المزوّدين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
