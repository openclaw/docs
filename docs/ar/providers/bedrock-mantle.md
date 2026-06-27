---
read_when:
    - تريد استخدام نماذج OSS المستضافة على Bedrock Mantle مع OpenClaw
    - تحتاج إلى نقطة نهاية Mantle المتوافقة مع OpenAI لـ GPT-OSS أو Qwen أو Kimi أو GLM
summary: استخدم نماذج Amazon Bedrock Mantle (المتوافقة مع OpenAI) مع OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-27T18:22:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

يتضمن OpenClaw مزود **Amazon Bedrock Mantle** مضمنا يتصل
بنقطة نهاية Mantle المتوافقة مع OpenAI. يستضيف Mantle نماذج مفتوحة المصدر
ونماذج من جهات خارجية (GPT-OSS وQwen وKimi وGLM وما شابه) عبر سطح قياسي
`/v1/chat/completions` مدعوم ببنية Bedrock التحتية.

| الخاصية         | القيمة                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------- |
| معرف المزود     | `amazon-bedrock-mantle`                                                                     |
| API             | `openai-completions` (متوافق مع OpenAI) أو `anthropic-messages` (مسار Anthropic Messages) |
| المصادقة        | `AWS_BEARER_TOKEN_BEDROCK` صريح أو توليد رمز حامل عبر سلسلة بيانات اعتماد IAM             |
| المنطقة الافتراضية | `us-east-1` (تجاوزها باستخدام `AWS_REGION` أو `AWS_DEFAULT_REGION`)                     |

## بدء الاستخدام

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="رمز حامل صريح">
    **الأفضل لـ:** البيئات التي لديك فيها مسبقا رمز Mantle حامل.

    <Steps>
      <Step title="اضبط الرمز الحامل على مضيف Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        يمكنك اختياريا ضبط منطقة (الافتراضي هو `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="اشترك في مشاركة بيانات المزود لـ Claude Fable 5">
        تتطلب نماذج Claude Fable 5 ونماذج Bedrock من فئة Claude Mythos وضع Mantle Data Retention API ‏`provider_data_share` قبل الاستدعاء. يتيح هذا الاشتراك لـ Bedrock مشاركة المطالبات والإكمالات مع Anthropic والاحتفاظ بها لمدة تصل إلى 30 يوما لمراجعة الثقة والسلامة.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        استخدم نموذج Bedrock آخر في الإعدادات إذا لم تتمكن من قبول وضع الاحتفاظ هذا.
      </Step>
      <Step title="تحقق من اكتشاف النماذج">
        ```bash
        openclaw models list
        ```

        تظهر النماذج المكتشفة تحت مزود `amazon-bedrock-mantle`. لا يلزم أي
        إعداد إضافي ما لم تكن تريد تجاوز القيم الافتراضية.
      </Step>
    </Steps>

  </Tab>

  <Tab title="بيانات اعتماد IAM">
    **الأفضل لـ:** استخدام بيانات اعتماد متوافقة مع AWS SDK (إعداد مشترك، SSO، هوية ويب، أدوار مثيل أو مهمة).

    <Steps>
      <Step title="كوّن بيانات اعتماد AWS على مضيف Gateway">
        يعمل أي مصدر مصادقة متوافق مع AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="تحقق من اكتشاف النماذج">
        ```bash
        openclaw models list
        ```

        ينشئ OpenClaw رمز Mantle حاملا من سلسلة بيانات الاعتماد تلقائيا.
      </Step>
    </Steps>

    <Tip>
    عندما لا يكون `AWS_BEARER_TOKEN_BEDROCK` مضبوطا، يصدر OpenClaw الرمز الحامل لك من سلسلة بيانات اعتماد AWS الافتراضية، بما في ذلك بيانات الاعتماد المشتركة/ملفات الإعداد، وSSO، وهوية الويب، وأدوار المثيل أو المهمة.
    </Tip>

  </Tab>
</Tabs>

## الاكتشاف التلقائي للنماذج

عندما يكون `AWS_BEARER_TOKEN_BEDROCK` مضبوطا، يستخدمه OpenClaw مباشرة. وإلا،
يحاول OpenClaw إنشاء رمز Mantle حامل من سلسلة بيانات اعتماد AWS الافتراضية.
ثم يكتشف نماذج Mantle المتاحة عبر الاستعلام عن نقطة نهاية المنطقة
`/v1/models`.

| السلوك            | التفاصيل                  |
| ----------------- | ------------------------- |
| ذاكرة التخزين المؤقت للاكتشاف | يتم تخزين النتائج مؤقتا لمدة ساعة واحدة |
| تحديث رمز IAM     | كل ساعة                   |

لإبقاء Plugin الخاص بـ Mantle مفعلا مع منع الاكتشاف التلقائي وتوليد
الرمز الحامل عبر IAM، عطّل مفتاح الاكتشاف المملوك لـ Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
الرمز الحامل هو نفسه `AWS_BEARER_TOKEN_BEDROCK` المستخدم بواسطة مزود [Amazon Bedrock](/ar/providers/bedrock) القياسي.
</Note>

### المناطق المدعومة

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## الإعداد اليدوي

إذا كنت تفضل إعدادا صريحا بدلا من الاكتشاف التلقائي:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="دعم الاستدلال">
    يتم استنتاج دعم الاستدلال من معرفات النماذج التي تحتوي على أنماط مثل
    `thinking` أو `reasoner` أو `gpt-oss-120b`. يضبط OpenClaw ‏`reasoning: true`
    تلقائيا للنماذج المطابقة أثناء الاكتشاف.
  </Accordion>

  <Accordion title="عدم توفر نقطة النهاية">
    إذا لم تكن نقطة نهاية Mantle متاحة أو لم تُرجع أي نماذج، يتم تخطي المزود
    بصمت. لا يصدر OpenClaw خطأ؛ وتواصل المزودات الأخرى المكوّنة
    العمل بشكل طبيعي.
  </Accordion>

  <Accordion title="Claude Opus 4.7 عبر مسار Anthropic Messages">
    يعرّض Mantle أيضا مسارا لـ Anthropic Messages يحمل نماذج Claude عبر مسار البث نفسه ذي المصادقة بالرمز الحامل. يمكن استدعاء Claude Opus 4.7 ‏(`amazon-bedrock-mantle/claude-opus-4.7`) عبر هذا المسار ببث مملوك للمزود، لذلك لا تُعامل رموز AWS الحاملة مثل مفاتيح Anthropic API.

    عندما تثبت نموذج Anthropic Messages على مزود Mantle، يستخدم OpenClaw سطح API ‏`anthropic-messages` بدلا من `openai-completions` لذلك النموذج. لا تزال المصادقة تأتي من `AWS_BEARER_TOKEN_BEDROCK` (أو الرمز الحامل الصادر عبر IAM).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="العلاقة بمزود Amazon Bedrock">
    Bedrock Mantle هو مزود منفصل عن مزود
    [Amazon Bedrock](/ar/providers/bedrock) القياسي. يستخدم Mantle سطح
    `/v1` متوافقا مع OpenAI، بينما يستخدم مزود Bedrock القياسي
    Bedrock API الأصلي.

    يشترك كلا المزودين في بيانات الاعتماد نفسها `AWS_BEARER_TOKEN_BEDROCK` عند
    توفرها.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ar/providers/bedrock" icon="cloud">
    مزود Bedrock الأصلي لـ Anthropic Claude وTitan ونماذج أخرى.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودات، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وكيفية حلها.
  </Card>
</CardGroup>
