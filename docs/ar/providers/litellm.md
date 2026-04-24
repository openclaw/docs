---
read_when:
    - أنت تريد توجيه OpenClaw عبر LiteLLM proxy
    - أنت تحتاج إلى تتبع التكلفة، أو التسجيل، أو توجيه النماذج عبر LiteLLM
summary: شغّل OpenClaw عبر LiteLLM Proxy للوصول الموحّد إلى النماذج وتتبع التكلفة
title: LiteLLM
x-i18n:
    generated_at: "2026-04-24T07:59:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9da14e6ded4c9e0b54989898a982987c0a60f6f6170d10b6cd2eddcd5106630f
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) هي بوابة LLM مفتوحة المصدر توفّر واجهة API موحدة لأكثر من 100 مزوّد نماذج. وجّه OpenClaw عبر LiteLLM للحصول على تتبع مركزي للتكلفة، والتسجيل، ومرونة تبديل الواجهات الخلفية من دون تغيير إعداد OpenClaw لديك.

<Tip>
**لماذا تستخدم LiteLLM مع OpenClaw؟**

- **تتبع التكلفة** — اعرف بالضبط ما الذي ينفقه OpenClaw عبر جميع النماذج
- **توجيه النماذج** — بدّل بين Claude وGPT-4 وGemini وBedrock من دون تغييرات في الإعداد
- **المفاتيح الافتراضية** — أنشئ مفاتيح بحدود إنفاق لـ OpenClaw
- **التسجيل** — سجلات كاملة للطلبات/الردود من أجل تصحيح الأخطاء
- **البدائل الاحتياطية** — Failover تلقائي إذا كان المزوّد الأساسي معطلًا

</Tip>

## البدء السريع

<Tabs>
  <Tab title="Onboarding (موصى به)">
    **الأفضل لـ:** أسرع طريق إلى إعداد LiteLLM عامل.

    <Steps>
      <Step title="شغّل onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="إعداد يدوي">
    **الأفضل لـ:** تحكم كامل في التثبيت والإعداد.

    <Steps>
      <Step title="ابدأ LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="وجّه OpenClaw إلى LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        هذا كل شيء. يمر OpenClaw الآن عبر LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## الإعداد

### متغيرات البيئة

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### ملف الإعداد

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## إعداد متقدم

<AccordionGroup>
  <Accordion title="المفاتيح الافتراضية">
    أنشئ مفتاحًا مخصصًا لـ OpenClaw مع حدود إنفاق:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    استخدم المفتاح المُولد كقيمة لـ `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="توجيه النماذج">
    يمكن لـ LiteLLM توجيه طلبات النماذج إلى واجهات خلفية مختلفة. اضبط ذلك في `config.yaml` الخاصة بـ LiteLLM:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    يستمر OpenClaw في طلب `claude-opus-4-6` — بينما تتولى LiteLLM عملية التوجيه.

  </Accordion>

  <Accordion title="عرض الاستخدام">
    تحقق من لوحة LiteLLM أو من واجهة API الخاصة بها:

    ```bash
    # معلومات المفتاح
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # سجلات الإنفاق
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="ملاحظات حول سلوك الـ Proxy">
    - تعمل LiteLLM افتراضيًا على `http://localhost:4000`
    - يتصل OpenClaw عبر نقطة النهاية المتوافقة مع OpenAI من نوع proxy في LiteLLM عند `/v1`
    - لا ينطبق تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط عبر LiteLLM:
      فلا يوجد `service_tier`، ولا `store` الخاصة بـ Responses، ولا تلميحات prompt-cache، ولا
      تشكيل payload للتوافق مع reasoning الخاصة بـ OpenAI
    - لا يتم حقن رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator`, `version`, `User-Agent`)
      على عناوين LiteLLM الأساسية المخصصة
  </Accordion>
</AccordionGroup>

<Note>
بالنسبة إلى إعداد المزوّد العام وسلوك failover، راجع [موفرو النماذج](/ar/concepts/model-providers).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="وثائق LiteLLM" href="https://docs.litellm.ai" icon="book">
    وثائق LiteLLM الرسمية ومرجع API.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وإعدادها.
  </Card>
</CardGroup>
