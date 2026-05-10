---
read_when:
    - تريد استخدام نماذج OSS المستضافة على Bedrock Mantle مع OpenClaw
    - تحتاج إلى نقطة نهاية Mantle المتوافقة مع OpenAI لاستخدام GPT-OSS أو Qwen أو Kimi أو GLM
summary: استخدم نماذج Amazon Bedrock Mantle (المتوافقة مع OpenAI) مع OpenClaw
title: طبقة Amazon Bedrock
x-i18n:
    generated_at: "2026-05-10T19:56:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

يتضمن OpenClaw موفر **Amazon Bedrock Mantle** المضمّن الذي يتصل
بنقطة نهاية Mantle المتوافقة مع OpenAI. يستضيف Mantle نماذج مفتوحة المصدر
ونماذج جهات خارجية (GPT-OSS وQwen وKimi وGLM وما شابهها) عبر سطح قياسي
`/v1/chat/completions` مدعوم ببنية Bedrock التحتية.

| الخاصية         | القيمة                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| معرف الموفر    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (متوافق مع OpenAI) أو `anthropic-messages` (مسار Anthropic Messages) |
| المصادقة       | `AWS_BEARER_TOKEN_BEDROCK` صريح أو إنشاء رمز حامل عبر سلسلة بيانات اعتماد IAM         |
| المنطقة الافتراضية | `us-east-1` (تجاوزها باستخدام `AWS_REGION` أو `AWS_DEFAULT_REGION`)                            |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Explicit bearer token">
    **الأفضل لـ:** البيئات التي لديك فيها بالفعل رمز حامل Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        يمكنك اختياريًا تعيين منطقة (الافتراضي هو `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        تظهر النماذج المكتشفة ضمن موفر `amazon-bedrock-mantle`. لا يلزم
        إعداد إضافي ما لم تكن تريد تجاوز الإعدادات الافتراضية.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **الأفضل لـ:** استخدام بيانات اعتماد متوافقة مع AWS SDK (إعداد مشترك، SSO، هوية ويب، أدوار مثيل أو مهمة).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        يعمل أي مصدر مصادقة متوافق مع AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        ينشئ OpenClaw رمز حامل Mantle من سلسلة بيانات الاعتماد تلقائيًا.
      </Step>
    </Steps>

    <Tip>
    عندما لا يتم تعيين `AWS_BEARER_TOKEN_BEDROCK`، يصدر OpenClaw رمز الحامل نيابة عنك من سلسلة بيانات اعتماد AWS الافتراضية، بما في ذلك بيانات الاعتماد المشتركة/ملفات تعريف الإعداد، وSSO، وهوية الويب، وأدوار المثيل أو المهمة.
    </Tip>

  </Tab>
</Tabs>

## الاكتشاف التلقائي للنماذج

عند تعيين `AWS_BEARER_TOKEN_BEDROCK`، يستخدمه OpenClaw مباشرة. بخلاف ذلك،
يحاول OpenClaw إنشاء رمز حامل Mantle من سلسلة بيانات اعتماد AWS الافتراضية.
ثم يكتشف نماذج Mantle المتاحة عبر الاستعلام عن نقطة نهاية
`/v1/models` الخاصة بالمنطقة.

| السلوك          | التفاصيل                    |
| ----------------- | ------------------------- |
| ذاكرة التخزين المؤقت للاكتشاف   | تُخزّن النتائج مؤقتًا لمدة ساعة واحدة |
| تحديث رمز IAM | كل ساعة                    |

لإبقاء Plugin Mantle مفعّلًا مع تعطيل الاكتشاف التلقائي وإنشاء رمز الحامل
عبر IAM، عطّل مفتاح الاكتشاف المملوك للـ Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
رمز الحامل هو نفس `AWS_BEARER_TOKEN_BEDROCK` الذي يستخدمه موفر [Amazon Bedrock](/ar/providers/bedrock) القياسي.
</Note>

### المناطق المدعومة

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## الإعداد اليدوي

إذا كنت تفضل إعدادًا صريحًا بدلًا من الاكتشاف التلقائي:

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
  <Accordion title="Reasoning support">
    يُستنتج دعم الاستدلال من معرفات النماذج التي تحتوي على أنماط مثل
    `thinking` أو `reasoner` أو `gpt-oss-120b`. يعيّن OpenClaw القيمة `reasoning: true`
    تلقائيًا للنماذج المطابقة أثناء الاكتشاف.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    إذا كانت نقطة نهاية Mantle غير متاحة أو لم تُرجع أي نماذج، فيتم
    تخطي الموفر بصمت. لا يُظهر OpenClaw خطأ؛ وتواصل الموفرات الأخرى
    المعدّة العمل بشكل طبيعي.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    يوفّر Mantle أيضًا مسار Anthropic Messages الذي ينقل نماذج Claude عبر مسار البث نفسه المصادق عليه برمز حامل. يمكن استدعاء Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) عبر هذا المسار باستخدام بث مملوك للموفر، لذلك لا تُعامل رموز AWS الحاملة مثل مفاتيح Anthropic API.

    عند تثبيت نموذج Anthropic Messages على موفر Mantle، يستخدم OpenClaw سطح API `anthropic-messages` بدلًا من `openai-completions` لذلك النموذج. لا تزال المصادقة تأتي من `AWS_BEARER_TOKEN_BEDROCK` (أو رمز حامل IAM المُصدر).

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

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle موفر منفصل عن موفر
    [Amazon Bedrock](/ar/providers/bedrock) القياسي. يستخدم Mantle سطح
    `/v1` متوافقًا مع OpenAI، بينما يستخدم موفر Bedrock القياسي
    Bedrock API الأصلي.

    يشترك كلا الموفرين في بيانات اعتماد `AWS_BEARER_TOKEN_BEDROCK` نفسها عند
    وجودها.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ar/providers/bedrock" icon="cloud">
    موفر Bedrock الأصلي لـ Anthropic Claude وTitan ونماذج أخرى.
  </Card>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="OAuth and auth" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
  <Card title="Troubleshooting" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وكيفية حلها.
  </Card>
</CardGroup>
