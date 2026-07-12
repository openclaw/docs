---
read_when:
    - تريد توجيه OpenClaw عبر وكيل LiteLLM
    - تحتاج إلى تتبّع التكلفة أو التسجيل أو توجيه النماذج عبر LiteLLM
summary: شغّل OpenClaw عبر LiteLLM Proxy للوصول الموحّد إلى النماذج وتتبع التكاليف
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T06:29:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) هو Gateway مفتوح المصدر لنماذج LLM، ويوفّر واجهة API موحّدة لأكثر من 100 مزوّد
للنماذج. وجّه OpenClaw عبر LiteLLM لتتبّع التكاليف وتسجيل السجلات مركزيًا، واستخدام مفاتيح افتراضية ذات
حدود للإنفاق، والتبديل الاحتياطي بين الواجهات الخلفية دون تغيير إعدادات OpenClaw.

## البدء السريع

<Tabs>
  <Tab title="Onboarding (recommended)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    للإعداد غير التفاعلي باستخدام وكيل بعيد، مرّر عنوان URL للوكيل صراحةً:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Manual setup">
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
      </Step>
    </Steps>
  </Tab>
</Tabs>

## الإعداد

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

النموذج الافتراضي الذي تكتبه عملية الإعداد الأولي هو `litellm/claude-opus-4-6`.

## إنشاء الصور

يمكن لـ LiteLLM دعم أداة `image_generate` عبر مساري `/images/generations` و
`/images/edits` المتوافقين مع OpenAI. نموذج الصور الافتراضي هو `gpt-image-2`؛ ويمكن إعداد نموذج مختلف ضمن
`agents.defaults.imageGenerationModel`:

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

تعمل عناوين URL الخاصة بـ LiteLLM على local loopback (`http://localhost:4000` و`127.0.0.1` و`::1` و`host.docker.internal`)
من دون تجاوز عام لإعدادات الشبكة الخاصة. بالنسبة إلى وكيل مستضاف على شبكة LAN، عيّن
`models.providers.litellm.request.allowPrivateNetwork: true` لأن مفتاح API يُرسل إلى ذلك المضيف.

## خيارات متقدمة

<AccordionGroup>
  <Accordion title="Virtual keys">
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

    استخدم المفتاح الذي تم إنشاؤه بوصفه `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Model routing">
    يمكن لـ LiteLLM توجيه طلبات النماذج إلى واجهات خلفية مختلفة. أجرِ الإعداد في ملف `config.yaml` الخاص بـ LiteLLM:

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

    يستمر OpenClaw في طلب `claude-opus-4-6`، بينما يتولى LiteLLM عملية التوجيه.

  </Accordion>

  <Accordion title="Viewing usage">
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
    - يعمل LiteLLM افتراضيًا على `http://localhost:4000`.
    - يتصل OpenClaw عبر نقطة النهاية `/v1` المتوافقة مع OpenAI، بنمط الوكيل الخاص بـ LiteLLM.
    - لا تنطبق تهيئة الطلبات المخصصة لنقاط نهاية OpenAI الأصلية فقط عند استخدام عنوان URL أساسي مُعدّ لـ LiteLLM:
      فلا يُستخدم `service_tier`، ولا `store` في Responses، ولا تلميحات ذاكرة التخزين المؤقت للموجّهات، ولا
      تهيئة حمولة مستوى جهد الاستدلال في OpenAI.
    - لا تُرسل ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`) إلا إلى
      نقاط نهاية OpenAI الأصلية التي تم التحقق منها، ولذلك لا تُضاف إلى عنوان URL أساسي مخصص لـ LiteLLM.
  </Accordion>
</AccordionGroup>

<Note>
للتعرّف على الإعداد العام للمزوّد وسلوك التبديل الاحتياطي، راجع [مزوّدي النماذج](/ar/concepts/model-providers).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    الوثائق الرسمية لـ LiteLLM ومرجع API.
  </Card>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين ومراجع النماذج وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="Configuration" href="/ar/gateway/configuration" icon="gear">
    المرجع الكامل للإعداد.
  </Card>
  <Card title="Models" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وإعدادها.
  </Card>
</CardGroup>
