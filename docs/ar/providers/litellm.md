---
read_when:
    - تريد توجيه OpenClaw عبر وكيل LiteLLM
    - تحتاج إلى تتبّع التكاليف أو التسجيل أو توجيه النماذج عبر LiteLLM
summary: شغّل OpenClaw عبر LiteLLM Proxy للوصول الموحّد إلى النماذج وتتبع التكاليف
title: LiteLLM
x-i18n:
    generated_at: "2026-04-30T08:21:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) هي بوابة LLM مفتوحة المصدر توفر API موحدًا لأكثر من 100 موفر نماذج. مرّر OpenClaw عبر LiteLLM للحصول على تتبع مركزي للتكلفة، وتسجيل السجلات، ومرونة تبديل الخلفيات دون تغيير إعدادات OpenClaw.

<Tip>
**لماذا تستخدم LiteLLM مع OpenClaw؟**

- **تتبع التكلفة** — اعرف بدقة ما ينفقه OpenClaw عبر جميع النماذج
- **توجيه النماذج** — بدّل بين Claude وGPT-4 وGemini وBedrock دون تغييرات في الإعدادات
- **مفاتيح افتراضية** — أنشئ مفاتيح بحدود إنفاق لـ OpenClaw
- **تسجيل السجلات** — سجلات كاملة للطلبات/الاستجابات من أجل التصحيح
- **البدائل الاحتياطية** — تحويل تلقائي عند تعطل الموفر الأساسي

</Tip>

## البدء السريع

<Tabs>
  <Tab title="Onboarding (recommended)">
    **الأفضل لـ:** أسرع مسار إلى إعداد LiteLLM عامل.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        للإعداد غير التفاعلي مع وكيل بعيد، مرّر عنوان URL للوكيل صراحةً:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manual setup">
    **الأفضل لـ:** تحكم كامل في التثبيت والإعدادات.

    <Steps>
      <Step title="Start LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Point OpenClaw to LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        هذا كل شيء. يمرّر OpenClaw الآن عبر LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## الإعدادات

### متغيرات البيئة

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### ملف الإعدادات

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

## الإعدادات المتقدمة

### إنشاء الصور

يمكن لـ LiteLLM أيضًا دعم أداة `image_generate` من خلال مسارات متوافقة مع OpenAI
مثل `/images/generations` و`/images/edits`. اضبط نموذج صور LiteLLM
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

تعمل عناوين URL الخاصة بـ LiteLLM على حلقة الرجوع مثل `http://localhost:4000` دون تجاوز عام
للشبكة الخاصة. بالنسبة إلى وكيل مستضاف على شبكة LAN، اضبط
`models.providers.litellm.request.allowPrivateNetwork: true` لأن مفتاح API
سيُرسل إلى مضيف الوكيل المضبوط.

<AccordionGroup>
  <Accordion title="Virtual keys">
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

    استخدم المفتاح المُنشأ كـ `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Model routing">
    يمكن لـ LiteLLM توجيه طلبات النماذج إلى خلفيات مختلفة. اضبط ذلك في `config.yaml` الخاص بـ LiteLLM:

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

    يواصل OpenClaw طلب `claude-opus-4-6` — ويتولى LiteLLM التوجيه.

  </Accordion>

  <Accordion title="Viewing usage">
    تحقق من لوحة معلومات LiteLLM أو API:

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy behavior notes">
    - يعمل LiteLLM على `http://localhost:4000` افتراضيًا
    - يتصل OpenClaw عبر نقطة نهاية `/v1` المتوافقة مع OpenAI وبنمط الوكيل في LiteLLM
    - لا ينطبق تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط عبر LiteLLM:
      لا `service_tier`، ولا `store` في Responses، ولا تلميحات لذاكرة التخزين المؤقت للمطالبات، ولا
      تشكيل حمولات متوافق مع استدلال OpenAI
    - لا تُحقن ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`)
      على عناوين URL الأساسية المخصصة لـ LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
لإعدادات الموفر العامة وسلوك التحويل الاحتياطي، راجع [موفرو النماذج](/ar/concepts/model-providers).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    وثائق LiteLLM الرسمية ومرجع API.
  </Card>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفرين، ومراجع النماذج، وسلوك التحويل الاحتياطي.
  </Card>
  <Card title="Configuration" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعدادات الكامل.
  </Card>
  <Card title="Model selection" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وضبطها.
  </Card>
</CardGroup>
