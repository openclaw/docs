---
read_when:
    - تريد استخدام نماذج Anthropic في OpenClaw
summary: استخدم Anthropic Claude عبر مفاتيح API أو Claude CLI في OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-26T11:38:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f26f117cb4f98790c323e056d39267c18f1278b0a7a8d3d43a7cbaddbb4523c1
    source_path: providers/anthropic.md
    workflow: 15
---

تبني Anthropic عائلة نماذج **Claude**. ويدعم OpenClaw مسارَي مصادقة:

- **مفتاح API** — وصول مباشر إلى Anthropic API مع فوترة حسب الاستخدام (نماذج `anthropic/*`)
- **Claude CLI** — إعادة استخدام تسجيل دخول Claude CLI موجود على المضيف نفسه

<Warning>
أخبرنا موظفو Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مرة أخرى، لذلك
يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان ما لم
تنشر Anthropic سياسة جديدة.

أما بالنسبة إلى مضيفات gateway طويلة العمر، فما تزال مفاتيح Anthropic API هي
المسار الإنتاجي الأوضح والأكثر قابلية للتنبؤ.

الوثائق العامة الحالية لـ Anthropic:

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
      <Step title="تحقق من توفر النموذج">
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
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Claude CLI موجود من دون مفتاح API منفصل.

    <Steps>
      <Step title="تأكد من تثبيت Claude CLI وتسجيل الدخول فيها">
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
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    توجد تفاصيل الإعداد وruntime الخاصة بواجهة Claude CLI الخلفية في [CLI Backends](/ar/gateway/cli-backends).
    </Note>

    ### مثال على الإعدادات

    فضّل مرجع نموذج Anthropic القياسي بالإضافة إلى تجاوز runtime خاص بـ CLI:

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

    لا تزال مراجع النماذج القديمة `claude-cli/claude-opus-4-7` تعمل من أجل
    التوافق، لكن الإعدادات الجديدة يجب أن تُبقي اختيار provider/model على
    `anthropic/*` وتضع الواجهة الخلفية للتنفيذ في `agentRuntime.id`.

    <Tip>
    إذا كنت تريد أوضح مسار للفوترة، فاستخدم مفتاح Anthropic API بدلًا من ذلك. كما يدعم OpenClaw أيضًا خيارات بنمط الاشتراك من [OpenAI Codex](/ar/providers/openai) و[Qwen Cloud](/ar/providers/qwen) و[MiniMax](/ar/providers/minimax) و[Z.AI / GLM](/ar/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## الإعدادات الافتراضية للتفكير (Claude 4.6)

تستخدم نماذج Claude 4.6 افتراضيًا نمط التفكير `adaptive` في OpenClaw عندما لا يتم تعيين مستوى تفكير صريح.

يمكنك التجاوز لكل رسالة باستخدام `/think:<level>` أو في معاملات النموذج:

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
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## تخزين الموجهات مؤقتًا

يدعم OpenClaw ميزة تخزين الموجهات مؤقتًا الخاصة بـ Anthropic بالنسبة إلى مصادقة مفتاح API.

| القيمة              | مدة التخزين المؤقت | الوصف                                 |
| ------------------- | ------------------ | ------------------------------------- |
| `"short"` (الافتراضي) | 5 دقائق          | تُطبّق تلقائيًا لمصادقة مفتاح API     |
| `"long"`            | ساعة واحدة         | تخزين مؤقت ممتد                       |
| `"none"`            | بدون تخزين مؤقت    | تعطيل تخزين الموجهات مؤقتًا           |

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
    استخدم معاملات النموذج كخط أساس، ثم تجاوز وكلاء محددين عبر `agents.list[].params`:

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

    1. ‏`agents.defaults.models["provider/model"].params`
    2. ‏`agents.list[].params` (مطابقة حسب `id`، وتتجاوز حسب المفتاح)

    وهذا يتيح لوكيل واحد الاحتفاظ بذاكرة تخزين مؤقت طويلة العمر بينما يعطّل وكيل آخر على النموذج نفسه التخزين المؤقت لحركة المرور المتقطعة/منخفضة إعادة الاستخدام.

  </Accordion>

  <Accordion title="ملاحظات Claude على Bedrock">
    - تقبل نماذج Anthropic Claude على Bedrock ‏(`amazon-bedrock/*anthropic.claude*`) تمرير `cacheRetention` عند تهيئتها.
    - تُفرض القيمة `cacheRetention: "none"` أثناء runtime على نماذج Bedrock غير التابعة لـ Anthropic.
    - تقوم الإعدادات الذكية الافتراضية لمفتاح API أيضًا ببذر `cacheRetention: "short"` لمراجع Claude-on-Bedrock عندما لا تكون هناك قيمة صريحة مضبوطة.

  </Accordion>
</AccordionGroup>

## تهيئة متقدمة

<AccordionGroup>
  <Accordion title="الوضع السريع">
    يدعم مفتاح التبديل المشترك `/fast` في OpenClaw حركة Anthropic المباشرة (مفتاح API وOAuth إلى `api.anthropic.com`).

    | الأمر | يقابله |
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
    - لا يتم حقنه إلا في الطلبات المباشرة إلى `api.anthropic.com`. وتترك مسارات proxy قيمة `service_tier` دون تغيير.
    - تتجاوز معاملات `serviceTier` أو `service_tier` الصريحة قيمة `/fast` عندما يتم تعيينهما معًا.
    - في الحسابات التي لا تملك سعة Priority Tier، قد تُحل `service_tier: "auto"` إلى `standard`.

    </Note>

  </Accordion>

  <Accordion title="فهم الوسائط (الصور وPDF)">
    تسجل Plugin Anthropic المضمّنة إمكانات فهم الصور وPDF. ويقوم OpenClaw
    بحل قدرات الوسائط تلقائيًا من مصادقة Anthropic المهيأة — ولا
    حاجة إلى إعدادات إضافية.

    | الخاصية         | القيمة               |
    | --------------- | -------------------- |
    | النموذج الافتراضي | `claude-opus-4-6`   |
    | الإدخال المدعوم   | الصور، ومستندات PDF |

    عندما تُرفق صورة أو PDF بمحادثة، يقوم OpenClaw تلقائيًا
    بتوجيهها عبر مزوّد فهم الوسائط الخاص بـ Anthropic.

  </Accordion>

  <Accordion title="نافذة سياق 1M (beta)">
    نافذة السياق 1M الخاصة بـ Anthropic محمية ببوابة beta. قم بتمكينها لكل نموذج:

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

    يربط OpenClaw هذا بالقيمة `anthropic-beta: context-1m-2025-08-07` في الطلبات.

    كما تنطبق `params.context1m: true` أيضًا على الواجهة الخلفية Claude CLI
    (`claude-cli/*`) بالنسبة إلى نماذج Opus وSonnet المؤهلة، مما يوسّع نافذة
    السياق أثناء runtime لتلك الجلسات في CLI لتطابق سلوك API المباشر.

    <Warning>
    يتطلب هذا وصولًا إلى السياق الطويل في بيانات اعتماد Anthropic لديك. ويتم رفض مصادقة token القديمة (`sk-ant-oat-*`) لطلبات السياق 1M — ويسجّل OpenClaw تحذيرًا ويعود إلى نافذة السياق القياسية.
    </Warning>

  </Accordion>

  <Accordion title="سياق 1M في Claude Opus 4.7">
    يملك كل من `anthropic/claude-opus-4.7` والنسخة `claude-cli` الخاصة به نافذة
    سياق 1M افتراضيًا — ولا حاجة إلى `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء 401 / أصبحت token غير صالحة فجأة">
    تنتهي صلاحية مصادقة token الخاصة بـ Anthropic ويمكن إبطالها. وبالنسبة إلى الإعدادات الجديدة، استخدم مفتاح Anthropic API بدلًا من ذلك.
  </Accordion>

  <Accordion title='لم يتم العثور على API key للمزوّد "anthropic"'>
    تكون مصادقة Anthropic **لكل وكيل** — فالوكلاء الجدد لا يرثون مفاتيح الوكيل الرئيسي. أعد تشغيل الإعداد الأولي لذلك الوكيل (أو هيّئ مفتاح API على مضيف gateway)، ثم تحقّق باستخدام `openclaw models status`.
  </Accordion>

  <Accordion title='لم يتم العثور على بيانات اعتماد للملف التعريفي "anthropic:default"'>
    شغّل `openclaw models status` لمعرفة ملف المصادقة النشط. وأعد تشغيل الإعداد الأولي، أو هيّئ مفتاح API لذلك المسار الخاص بالملف التعريفي.
  </Accordion>

  <Accordion title="لا يوجد ملف مصادقة متاح (الكل في فترة تهدئة)">
    تحقّق من `openclaw models status --json` لمعرفة `auth.unusableProfiles`. وقد تكون فترات تهدئة rate-limit في Anthropic خاصة بالنموذج، لذلك قد يظل نموذج Anthropic شقيق قابلًا للاستخدام. أضف ملف Anthropic تعريفيًا آخر أو انتظر انتهاء فترة التهدئة.
  </Accordion>
</AccordionGroup>

<Note>
للمزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك failover.
  </Card>
  <Card title="CLI Backends" href="/ar/gateway/cli-backends" icon="terminal">
    إعداد الواجهة الخلفية Claude CLI وتفاصيل runtime الخاصة بها.
  </Card>
  <Card title="تخزين الموجهات مؤقتًا" href="/ar/reference/prompt-caching" icon="database">
    كيف يعمل تخزين الموجهات مؤقتًا عبر المزوّدين.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
