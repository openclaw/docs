---
read_when:
    - تريد استخدام نماذج OSS المستضافة عبر Bedrock Mantle مع OpenClaw
    - تحتاج إلى نقطة نهاية Mantle المتوافقة مع OpenAI لنماذج GPT-OSS أو Qwen أو Kimi أو GLM
summary: استخدام نماذج Amazon Bedrock Mantle (المتوافقة مع OpenAI) مع OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-24T07:58:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

يتضمن OpenClaw مزود **Amazon Bedrock Mantle** مجمّعًا يتصل
بنقطة نهاية Mantle المتوافقة مع OpenAI. تستضيف Mantle نماذج مفتوحة المصدر
ونماذج من أطراف ثالثة (GPT-OSS وQwen وKimi وGLM وما شابه) عبر سطح قياسي من نوع
`/v1/chat/completions` مدعوم ببنية Bedrock التحتية.

| الخاصية | القيمة |
| -------------- | ------------------------------------------------------------------------------------------- |
| معرّف المزوّد | `amazon-bedrock-mantle` |
| API | `openai-completions` (متوافق مع OpenAI) أو `anthropic-messages` (مسار Anthropic Messages) |
| المصادقة | `AWS_BEARER_TOKEN_BEDROCK` صريح أو توليد bearer token من سلسلة بيانات اعتماد IAM |
| المنطقة الافتراضية | `us-east-1` (يمكن تجاوزها عبر `AWS_REGION` أو `AWS_DEFAULT_REGION`) |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Bearer token صريح">
    **الأفضل لـ:** البيئات التي لديك فيها بالفعل Mantle bearer token.

    <Steps>
      <Step title="اضبط bearer token على مضيف gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        اضبط منطقة اختياريًا (الافتراضي `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="تحقّق من اكتشاف النماذج">
        ```bash
        openclaw models list
        ```

        تظهر النماذج المكتشفة تحت مزود `amazon-bedrock-mantle`. ولا
        يلزم إعداد إضافي إلا إذا كنت تريد تجاوز الإعدادات الافتراضية.
      </Step>
    </Steps>

  </Tab>

  <Tab title="بيانات اعتماد IAM">
    **الأفضل لـ:** استخدام بيانات اعتماد متوافقة مع AWS SDK (إعداد مشترك، أو SSO، أو web identity، أو أدوار instance أو task).

    <Steps>
      <Step title="اضبط بيانات اعتماد AWS على مضيف gateway">
        يعمل أي مصدر مصادقة متوافق مع AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="تحقّق من اكتشاف النماذج">
        ```bash
        openclaw models list
        ```

        يقوم OpenClaw بتوليد Mantle bearer token من سلسلة بيانات الاعتماد تلقائيًا.
      </Step>
    </Steps>

    <Tip>
    عندما لا يكون `AWS_BEARER_TOKEN_BEDROCK` مضبوطًا، يقوم OpenClaw بإنشاء bearer token لك من سلسلة بيانات الاعتماد الافتراضية في AWS، بما في ذلك shared credentials/config profiles، وSSO، وweb identity، وأدوار instance أو task.
    </Tip>

  </Tab>
</Tabs>

## الاكتشاف التلقائي للنموذج

عندما يكون `AWS_BEARER_TOKEN_BEDROCK` مضبوطًا، يستخدمه OpenClaw مباشرة. وبخلاف ذلك،
يحاول OpenClaw توليد Mantle bearer token من سلسلة بيانات اعتماد AWS
الافتراضية. ثم يكتشف نماذج Mantle المتاحة عبر الاستعلام عن
نقطة النهاية `/v1/models` الخاصة بالمنطقة.

| السلوك | التفاصيل |
| ----------------- | ------------------------- |
| ذاكرة مؤقتة للاكتشاف | يتم تخزين النتائج مؤقتًا لمدة ساعة واحدة |
| تحديث رمز IAM | كل ساعة |

<Note>
إن bearer token هو نفسه `AWS_BEARER_TOKEN_BEDROCK` المستخدم مع مزود [Amazon Bedrock](/ar/providers/bedrock) القياسي.
</Note>

### المناطق المدعومة

`us-east-1`، و`us-east-2`، و`us-west-2`، و`ap-northeast-1`،
و`ap-south-1`، و`ap-southeast-3`، و`eu-central-1`، و`eu-west-1`، و`eu-west-2`،
و`eu-south-1`، و`eu-north-1`، و`sa-east-1`.

## الإعداد اليدوي

إذا كنت تفضّل إعدادًا صريحًا بدلًا من الاكتشاف التلقائي:

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

## إعداد متقدم

<AccordionGroup>
  <Accordion title="دعم reasoning">
    يتم استنتاج دعم reasoning من معرّفات النماذج التي تحتوي على أنماط مثل
    `thinking` أو `reasoner` أو `gpt-oss-120b`. ويضبط OpenClaw القيمة `reasoning: true`
    تلقائيًا للنماذج المطابقة أثناء الاكتشاف.
  </Accordion>

  <Accordion title="عدم توفر نقطة النهاية">
    إذا كانت نقطة نهاية Mantle غير متاحة أو لم تُرجع أي نماذج، فسيتم
    تخطي المزوّد بصمت. ولا يصدر OpenClaw خطأً؛
    وتستمر المزوّدات المهيأة الأخرى في العمل بشكل طبيعي.
  </Accordion>

  <Accordion title="Claude Opus 4.7 عبر مسار Anthropic Messages">
    تعرض Mantle أيضًا مسار Anthropic Messages الذي ينقل نماذج Claude عبر نفس مسار البث المصادق عليه بواسطة bearer. ويمكن استدعاء Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) عبر هذا المسار مع بث مملوك للمزوّد، لذلك لا يتم التعامل مع AWS bearer tokens على أنها مفاتيح Anthropic API.

    عندما تثبّت نموذج Anthropic Messages على مزوّد Mantle، يستخدم OpenClaw سطح API من نوع `anthropic-messages` بدلًا من `openai-completions` لذلك النموذج. ولا تزال المصادقة تأتي من `AWS_BEARER_TOKEN_BEDROCK` (أو من IAM bearer token المُنشأ).

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

  <Accordion title="العلاقة مع مزود Amazon Bedrock">
    يُعد Bedrock Mantle مزودًا منفصلًا عن مزود
    [Amazon Bedrock](/ar/providers/bedrock) القياسي. يستخدم Mantle سطح
    `/v1` المتوافق مع OpenAI، بينما يستخدم مزود Bedrock القياسي
    Bedrock API الأصلية.

    يشترك كلا المزوّدين في بيانات الاعتماد `AWS_BEARER_TOKEN_BEDROCK` نفسها عندما
    تكون موجودة.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ar/providers/bedrock" icon="cloud">
    مزوّد Bedrock الأصلي لنماذج Anthropic Claude وTitan وغيرها.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وكيفية حلها.
  </Card>
</CardGroup>
