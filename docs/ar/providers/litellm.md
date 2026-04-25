---
read_when:
    - أنت تريد توجيه OpenClaw عبر وكيل LiteLLM
    - أنت بحاجة إلى تتبع التكلفة أو التسجيل أو توجيه النماذج عبر LiteLLM
summary: شغّل OpenClaw عبر LiteLLM Proxy للوصول الموحّد إلى النماذج وتتبع التكلفة
title: LiteLLM
x-i18n:
    generated_at: "2026-04-25T18:21:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) هي Gateway مفتوحة المصدر لـ LLM توفّر API موحّدة لأكثر من 100 موفّر نماذج. وجّه OpenClaw عبر LiteLLM للحصول على تتبع مركزي للتكلفة، والتسجيل، ومرونة تبديل الواجهات الخلفية دون تغيير تهيئة OpenClaw الخاصة بك.

<Tip>
**لماذا تستخدم LiteLLM مع OpenClaw؟**

- **تتبع التكلفة** — اعرف بالضبط ما الذي ينفقه OpenClaw عبر جميع النماذج
- **توجيه النماذج** — بدّل بين Claude وGPT-4 وGemini وBedrock من دون تغييرات في التهيئة
- **المفاتيح الافتراضية** — أنشئ مفاتيح مع حدود إنفاق لـ OpenClaw
- **التسجيل** — سجلات كاملة للطلبات/الاستجابات لأغراض تصحيح الأخطاء
- **الرجوع الاحتياطي** — تبديل احتياطي تلقائي إذا كان موفّرك الأساسي متوقفًا

</Tip>

## البدء السريع

<Tabs>
  <Tab title="الإعداد الأولي (موصى به)">
    **الأفضل لـ:** أسرع طريق إلى إعداد LiteLLM يعمل.

    <Steps>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="إعداد يدوي">
    **الأفضل لـ:** تحكم كامل في التثبيت والتهيئة.

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

        هذا كل شيء. يمرّ OpenClaw الآن عبر LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## التهيئة

### متغيرات البيئة

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### ملف التهيئة

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

## التهيئة المتقدمة

### توليد الصور

يمكن لـ LiteLLM أيضًا تشغيل أداة `image_generate` عبر المسارات المتوافقة مع OpenAI
`/images/generations` و`/images/edits`. اضبط نموذج صور LiteLLM
ضمن `agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

تعمل عناوين URL الخاصة بـ LiteLLM على local loopback مثل `http://localhost:4000` دون
تجاوز عام للشبكة الخاصة. أما بالنسبة إلى وكيل مستضاف على LAN، فاضبط
`models.providers.litellm.request.allowPrivateNetwork: true` لأن مفتاح API
سيُرسَل إلى مضيف الوكيل المهيّأ.

<AccordionGroup>
  <Accordion title="المفاتيح الافتراضية">
    أنشئ مفتاحًا مخصصًا لـ OpenClaw مع حدود للإنفاق:

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

    استخدم المفتاح الذي تم إنشاؤه كقيمة لـ `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="توجيه النماذج">
    يمكن لـ LiteLLM توجيه طلبات النماذج إلى واجهات خلفية مختلفة. اضبط ذلك في `config.yaml` الخاص بـ LiteLLM:

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

    يواصل OpenClaw طلب `claude-opus-4-6` — بينما يتولى LiteLLM التوجيه.

  </Accordion>

  <Accordion title="عرض الاستخدام">
    تحقق من لوحة معلومات LiteLLM أو API الخاصة بها:

    ```bash
    # معلومات المفتاح
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # سجلات الإنفاق
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="ملاحظات حول سلوك الوكيل">
    - يعمل LiteLLM على `http://localhost:4000` افتراضيًا
    - يتصل OpenClaw عبر نقطة النهاية `/v1`
      المتوافقة مع OpenAI بأسلوب الوكيل في LiteLLM
    - لا ينطبق تشكيل الطلبات الخاص بـ OpenAI الأصلي فقط عبر LiteLLM:
      لا يوجد `service_tier`، ولا `store` الخاص بـ Responses، ولا تلميحات تخزين المطالبات مؤقتًا، ولا
      تشكيل حمولة متوافق مع OpenAI reasoning
    - لا يتم حقن رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`)
      على عناوين URL الأساسية المخصصة لـ LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
للاطلاع على تهيئة الموفّر العامة وسلوك التبديل الاحتياطي، راجع [موفرو النماذج](/ar/concepts/model-providers).
</Note>

## ذي صلة

<CardGroup cols={2}>
  <Card title="وثائق LiteLLM" href="https://docs.litellm.ai" icon="book">
    وثائق LiteLLM الرسمية ومرجع API.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="التهيئة" href="/ar/gateway/configuration" icon="gear">
    المرجع الكامل للتهيئة.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وتهيئتها.
  </Card>
</CardGroup>
