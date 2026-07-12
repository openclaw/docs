---
read_when:
    - تريد استخدام نماذج OSS المستضافة على Bedrock Mantle مع OpenClaw
    - تحتاج إلى نقطة نهاية Mantle المتوافقة مع OpenAI لاستخدام GPT-OSS أو Qwen أو Kimi أو GLM
    - تريد استخدام Claude Sonnet 5 أو Mythos 5 عبر Amazon Bedrock Mantle
summary: استخدام نماذج Amazon Bedrock Mantle المتوافقة مع OpenAI ونماذج Claude Messages مع OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T06:27:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

يتضمن OpenClaw موفر **Amazon Bedrock Mantle** مضمّنًا يتصل بنقطة نهاية Mantle المتوافقة مع OpenAI. يستضيف Mantle نماذج مفتوحة المصدر ونماذج تابعة لجهات خارجية (GPT-OSS وQwen وKimi وGLM وما شابهها) من خلال واجهة قياسية
`/v1/chat/completions` مدعومة ببنية Bedrock التحتية. كما يتيح Mantle نماذج Anthropic Claude عبر مسار Anthropic Messages.

| الخاصية       | القيمة                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| معرّف الموفر    | `amazon-bedrock-mantle`                                                                |
| API            | `openai-completions` لنماذج OSS المكتشفة، و`anthropic-messages` لنماذج Claude |
| المصادقة           | `AWS_BEARER_TOKEN_BEDROCK` صريح أو إنشاء رمز حامل عبر سلسلة بيانات اعتماد IAM    |
| المنطقة الافتراضية | `us-east-1` (يمكن تجاوزها باستخدام `AWS_REGION` أو `AWS_DEFAULT_REGION`)                       |

## بدء الاستخدام

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="رمز حامل صريح">
    **الأنسب لـ:** البيئات التي يتوفر لديك فيها بالفعل رمز حامل لـMantle.

    <Steps>
      <Step title="تعيين الرمز الحامل على مضيف Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        يمكنك اختياريًا تعيين منطقة (الافتراضي هو `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="التحقق من اكتشاف النماذج">
        ```bash
        openclaw models list
        ```

        تظهر النماذج المكتشفة ضمن الموفر `amazon-bedrock-mantle`. لا يلزم
        أي إعداد إضافي ما لم ترغب في تجاوز القيم الافتراضية.
      </Step>
    </Steps>

  </Tab>

  <Tab title="بيانات اعتماد IAM">
    **الأنسب لـ:** استخدام بيانات اعتماد متوافقة مع AWS SDK (الإعداد المشترك وSSO وهوية الويب وأدوار المثيل أو المهمة).

    <Steps>
      <Step title="إعداد بيانات اعتماد AWS على مضيف Gateway">
        يمكن استخدام أي مصدر مصادقة متوافق مع AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="التحقق من اكتشاف النماذج">
        ```bash
        openclaw models list
        ```

        ينشئ OpenClaw تلقائيًا رمز حامل لـMantle من سلسلة بيانات الاعتماد.
      </Step>
    </Steps>

    <Tip>
    عندما لا يكون `AWS_BEARER_TOKEN_BEDROCK` معيّنًا، يُنشئ OpenClaw الرمز الحامل نيابةً عنك من سلسلة بيانات اعتماد AWS الافتراضية، بما يشمل ملفات تعريف بيانات الاعتماد والإعداد المشتركة وSSO وهوية الويب وأدوار المثيل أو المهمة.
    </Tip>

  </Tab>
</Tabs>

## الاكتشاف التلقائي للنماذج

عندما يكون `AWS_BEARER_TOKEN_BEDROCK` معيّنًا، يستخدمه OpenClaw مباشرةً. وإلا،
يحاول OpenClaw إنشاء رمز حامل لـMantle من سلسلة بيانات اعتماد AWS
الافتراضية. ثم يكتشف نماذج Mantle المتاحة من خلال الاستعلام عن نقطة النهاية
`/v1/models` الخاصة بالمنطقة.

| السلوك          | التفاصيل                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| ذاكرة الاكتشاف المؤقتة   | تُخزّن النتائج مؤقتًا لمدة ساعة واحدة لكل منطقة؛ وعند فشل الجلب تُعاد آخر نتيجة مخزنة مؤقتًا |
| تحديث رمز IAM | كل ساعتين، مع تخزينه مؤقتًا لكل منطقة                                                     |

لإبقاء Plugin الخاص بـMantle مفعّلًا مع منع الاكتشاف التلقائي وإنشاء
الرمز الحامل عبر IAM، عطّل مفتاح الاكتشاف الذي يملكه Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
الرمز الحامل هو `AWS_BEARER_TOKEN_BEDROCK` نفسه الذي يستخدمه موفر [Amazon Bedrock](/ar/providers/bedrock) القياسي.
</Note>

### المناطق المدعومة

`us-east-1`، `us-east-2`، `us-west-2`، `ap-northeast-1`،
`ap-south-1`، `ap-southeast-3`، `eu-central-1`، `eu-west-1`، `eu-west-2`،
`eu-south-1`، `eu-north-1`، `sa-east-1`.

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

تكون قائمة `models` الصريحة وغير الفارغة هي المرجع المعتمد، وتستبدل كل
صف مكتشف، بما في ذلك صفوف Claude أدناه. احذف `models` للاحتفاظ بدليل
Mantle التلقائي، أو أدرج إدخالات نماذج Claude الكاملة التي تريد استخدامها.

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="دعم الاستدلال">
    يُستدل على دعم الاستدلال من معرّفات النماذج التي تحتوي على أنماط مثل
    `thinking` أو `reasoner` أو `reasoning` أو `deepseek.r` أو `gpt-oss-120b` أو
    `gpt-oss-safeguard-120b`. يعيّن OpenClaw القيمة `reasoning: true` تلقائيًا
    للنماذج المطابقة أثناء الاكتشاف.
  </Accordion>

  <Accordion title="عدم توفر نقطة النهاية">
    إذا كانت نقطة نهاية Mantle غير متاحة، أو لم تُرجع أي نماذج، أو فشل
    حل الرمز الحامل، فسيعيد الاكتشاف نتيجة فارغة ويُتخطى الموفر
    الضمني. لا يصدر OpenClaw خطأً؛ وتستمر الموفرات الأخرى المعدّة
    في العمل بصورة طبيعية.
  </Accordion>

  <Accordion title="Claude عبر مسار Anthropic Messages">
    عندما يتولى الاكتشاف التلقائي إدارة قائمة النماذج، يضيف OpenClaw أربعة
    نماذج Claude بعد نجاح البحث، بغض النظر عما تعيده `/v1/models`:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5)،
    و`amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7)، و
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5)، بالإضافة إلى
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos
    Preview). تستخدم هذه النماذج واجهة API ‏`anthropic-messages` وتبث عبر
    نقطة النهاية نفسها المتوافقة مع Anthropic والمصادق عليها بالرمز الحامل
    (`<mantle-base>/anthropic`)، ولذلك لا يُعامل رمز AWS الحامل كمفتاح
    API تابع لـAnthropic.

    يستخدم Claude Sonnet 5 دائمًا التفكير التكيّفي، ويكون مستوى الجهد الافتراضي `high`.
    يُعيّن `/think off` و`/think minimal` إلى `low` لأن مسار Mantle
    لا يمكنه تعطيل التفكير. كما يحذف OpenClaw درجة الحرارة المخصصة من
    طلبات Sonnet 5.

    يتوفر Claude Mythos 5 بوصول محدود. ويوفر نافذة سياق بسعة 1,000,000 رمز
    وحدًا أقصى للمخرجات يبلغ 128,000 رمز، ويستخدم دائمًا التفكير التكيّفي، ويعيّن
    `/think off` و`/think minimal` إلى `low`، ويحذف معاملات
    أخذ العينات التي يحددها المستدعي.

    يطلب Claude Mythos Preview الاستدلال دائمًا، ويكون مستوى الجهد الافتراضي `high`
    عند عدم تعيين مستوى `/think` (حيث تُخفّض `xhigh`/`max` إلى
    `high`، وتُرفع `minimal` إلى `low`). يبث Opus 4.7 على Mantle دون
    استدلال يوفره النموذج، ويحذف OpenClaw معامل `temperature`
    الخاص به لأن Opus 4.7 لا يقبل تجاوزات أخذ العينات عبر هذا المسار؛ بينما
    يقبل Mythos Preview تجاوز `temperature` بصورة طبيعية.

    تستبدل قائمة `models.providers["amazon-bedrock-mantle"].models`
    الصريحة وغير الفارغة دليل النماذج المكتشف بالكامل. احذف تلك القائمة عندما
    تريد صفوف Claude المضمّنة هذه.

  </Accordion>

  <Accordion title="العلاقة بموفر Amazon Bedrock">
    يُعد Bedrock Mantle موفرًا منفصلًا عن موفر
    [Amazon Bedrock](/ar/providers/bedrock) القياسي. يستخدم Mantle
    واجهة `/v1` متوافقة مع OpenAI لدليل OSS الخاص به، بينما يستخدم موفر
    Bedrock القياسي واجهة Bedrock Converse API الأصلية.

    يشترك كلا الموفرين في بيانات الاعتماد `AWS_BEARER_TOKEN_BEDROCK` نفسها عند
    توفرها.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/ar/providers/bedrock" icon="cloud">
    موفر Bedrock أصلي لنماذج Anthropic Claude وTitan وغيرها.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وكيفية حلها.
  </Card>
</CardGroup>
