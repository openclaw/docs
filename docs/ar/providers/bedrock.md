---
read_when:
    - تريد استخدام نماذج Amazon Bedrock مع OpenClaw
    - تحتاج إلى إعداد بيانات اعتماد AWS والمنطقة لاستدعاءات النموذج.
summary: استخدم نماذج Amazon Bedrock (Converse API) مع OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:22:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام نماذج **Amazon Bedrock** عبر مزوّد البث **Bedrock Converse**. تستخدم مصادقة Bedrock **سلسلة بيانات اعتماد AWS SDK الافتراضية**، وليس مفتاح API.

| الخاصية | القيمة                                                       |
| -------- | ----------------------------------------------------------- |
| المزوّد | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| المصادقة     | بيانات اعتماد AWS (متغيرات البيئة، أو الإعدادات المشتركة، أو دور المثيل) |
| المنطقة   | `AWS_REGION` أو `AWS_DEFAULT_REGION` (الافتراضي: `us-east-1`) |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Access keys / env vars">
    **الأفضل لـ:** أجهزة المطورين، وCI، أو المضيفين الذين تدير عليهم بيانات اعتماد AWS مباشرة.

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Add a Bedrock provider and model to your config">
        لا يلزم أي `apiKey`. اضبط المزوّد باستخدام `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    مع مصادقة علامة البيئة (`AWS_ACCESS_KEY_ID` أو `AWS_PROFILE` أو `AWS_BEARER_TOKEN_BEDROCK`)، يفعّل OpenClaw مزوّد Bedrock الضمني تلقائياً لاكتشاف النماذج من دون إعدادات إضافية.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **الأفضل لـ:** مثيلات EC2 التي لديها دور IAM مرفق، وتستخدم خدمة بيانات تعريف المثيل للمصادقة.

    <Steps>
      <Step title="Enable discovery explicitly">
        عند استخدام IMDS، لا يستطيع OpenClaw اكتشاف مصادقة AWS من علامات البيئة وحدها، لذلك يجب أن تختار التفعيل صراحة:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        إذا كنت تريد أيضاً أن يعمل مسار الاكتشاف التلقائي عبر علامة البيئة (مثلاً لواجهات `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        لا تحتاج **إلى** مفتاح API وهمي.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    يجب أن يمتلك دور IAM المرفق بمثيل EC2 لديك الأذونات التالية:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (للاكتشاف التلقائي)
    - `bedrock:ListInferenceProfiles` (لاكتشاف ملفات تعريف الاستدلال)

    أو أرفق السياسة المُدارة `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    لا تحتاج إلى `AWS_PROFILE=default` إلا إذا كنت تريد تحديداً علامة بيئة للوضع التلقائي أو واجهات الحالة. يستخدم مسار مصادقة تشغيل Bedrock الفعلي سلسلة AWS SDK الافتراضية، لذلك تعمل مصادقة دور المثيل عبر IMDS حتى من دون علامات بيئة.
    </Note>

  </Tab>
</Tabs>

## الاكتشاف التلقائي للنماذج

يمكن لـ OpenClaw اكتشاف نماذج Bedrock التي تدعم **البث**
و**إخراج النص** تلقائياً. يستخدم الاكتشاف `bedrock:ListFoundationModels` و
`bedrock:ListInferenceProfiles`، ويتم تخزين النتائج مؤقتاً (الافتراضي: ساعة واحدة).

كيفية تفعيل المزوّد الضمني:

- إذا كانت `plugins.entries.amazon-bedrock.config.discovery.enabled` تساوي `true`،
  فسيحاول OpenClaw الاكتشاف حتى عند عدم وجود علامة بيئة لـ AWS.
- إذا كانت `plugins.entries.amazon-bedrock.config.discovery.enabled` غير مضبوطة،
  فإن OpenClaw يضيف تلقائياً مزوّد Bedrock الضمني فقط عندما يرى إحدى علامات مصادقة AWS هذه:
  `AWS_BEARER_TOKEN_BEDROCK`، أو `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`، أو `AWS_PROFILE`.
- لا يزال مسار مصادقة تشغيل Bedrock الفعلي يستخدم سلسلة AWS SDK الافتراضية، لذلك
  يمكن للإعدادات المشتركة، وSSO، ومصادقة دور المثيل عبر IMDS أن تعمل حتى عندما احتاج الاكتشاف
  إلى `enabled: true` للاشتراك.

<Note>
بالنسبة إلى إدخالات `models.providers["amazon-bedrock"]` الصريحة، ما يزال بإمكان OpenClaw حل مصادقة علامة بيئة Bedrock مبكراً من علامات بيئة AWS مثل `AWS_BEARER_TOKEN_BEDROCK` من دون فرض تحميل مصادقة التشغيل الكاملة. لا يزال مسار مصادقة استدعاء النموذج الفعلي يستخدم سلسلة AWS SDK الافتراضية.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
    توجد خيارات الإعداد ضمن `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | الخيار | الافتراضي | الوصف |
    | ------ | ------- | ----------- |
    | `enabled` | auto | في الوضع التلقائي، يفعّل OpenClaw مزوّد Bedrock الضمني فقط عندما يرى علامة بيئة AWS مدعومة. اضبطه على `true` لفرض الاكتشاف. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | منطقة AWS المستخدمة لاستدعاءات API الخاصة بالاكتشاف. |
    | `providerFilter` | (الكل) | يطابق أسماء مزوّدي Bedrock (مثلاً `anthropic` و`amazon`). |
    | `refreshInterval` | `3600` | مدة التخزين المؤقت بالثواني. اضبطه على `0` لتعطيل التخزين المؤقت. |
    | `defaultContextWindow` | `32000` | نافذة السياق المستخدمة للنماذج المكتشفة (تجاوزها إذا كنت تعرف حدود نموذجك). |
    | `defaultMaxTokens` | `4096` | الحد الأقصى لرموز الإخراج المستخدمة للنماذج المكتشفة (تجاوزها إذا كنت تعرف حدود نموذجك). |

  </Accordion>
</AccordionGroup>

## الإعداد السريع (مسار AWS)

ينشئ هذا الدليل دور IAM، ويرفق أذونات Bedrock، ويربط
ملف تعريف المثيل، ويفعّل اكتشاف OpenClaw على مضيف EC2.

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="Inference profiles">
    يكتشف OpenClaw **ملفات تعريف الاستدلال الإقليمية والعالمية** إلى جانب
    النماذج الأساسية. عندما يرتبط ملف تعريف بنموذج أساسي معروف، يرث
    ملف التعريف قدرات ذلك النموذج (نافذة السياق، والحد الأقصى للرموز،
    والاستدلال، والرؤية) ويتم حقن منطقة طلب Bedrock الصحيحة
    تلقائياً. يعني ذلك أن ملفات تعريف Claude العابرة للمناطق تعمل من دون
    تجاوزات يدوية للمزوّد.

    تبدو معرّفات ملفات تعريف الاستدلال مثل `us.anthropic.claude-opus-4-6-v1:0` (إقليمي)
    أو `anthropic.claude-opus-4-6-v1:0` (عالمي). إذا كان النموذج الداعم موجوداً بالفعل
    في نتائج الاكتشاف، يرث ملف التعريف مجموعة قدراته كاملة؛
    وإلا فتُطبّق افتراضات آمنة.

    لا يلزم أي إعداد إضافي. طالما أن الاكتشاف مفعّل وأن أصل IAM
    يمتلك `bedrock:ListInferenceProfiles`، تظهر ملفات التعريف إلى جانب
    النماذج الأساسية في `openclaw models list`.

  </Accordion>

  <Accordion title="Service tier">
    تدعم بعض نماذج Bedrock وسيط `service_tier` لتحسين التكلفة
    أو زمن الاستجابة. تتوفر المستويات التالية:

    | المستوى | الوصف |
    |------|-------------|
    | `default` | مستوى Bedrock القياسي |
    | `flex` | معالجة مخفضة التكلفة لأعباء العمل التي يمكنها تحمل زمن استجابة أطول |
    | `priority` | معالجة ذات أولوية لأعباء العمل الحساسة لزمن الاستجابة |
    | `reserved` | سعة محجوزة لأعباء العمل المستقرة |

    اضبط `serviceTier` (أو `service_tier`) عبر `agents.defaults.params` لطلبات
    نماذج Bedrock، أو لكل نموذج في
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    القيم الصالحة هي `default` و`flex` و`priority` و`reserved`. لا تدعم كل
    النماذج جميع المستويات؛ إذا طُلب مستوى غير مدعوم، فسيعيد Bedrock
    خطأ تحقق. ملاحظة: رسالة الخطأ مضللة إلى حد ما؛
    قد تقول "The provided model identifier is invalid" بدلاً من الإشارة
    إلى مستوى خدمة غير مدعوم. إذا رأيت هذا الخطأ، فتحقق مما إذا كان النموذج
    يدعم المستوى المطلوب.

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    يرفض Bedrock وسيط `temperature` لـ Claude Opus 4.7. يحذف OpenClaw
    `temperature` تلقائياً لأي مرجع Bedrock من Opus 4.7، بما في ذلك
    معرّفات النماذج الأساسية، وملفات تعريف الاستدلال المسماة، وملفات تعريف استدلال التطبيقات
    التي يُحل نموذجها الأساسي إلى Opus 4.7 عبر
    `bedrock:GetInferenceProfile`، ومتغيرات `opus-4.7` المنقوطة ذات
    بادئات المناطق الاختيارية (`us.` و`eu.` و`ap.` و`apac.` و`au.` و`jp.` و
    `global.`). لا يلزم أي خيار إعداد، وينطبق الحذف على كل من
    كائن خيارات الطلب وحقل حمولة `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    استخدم `amazon-bedrock/anthropic.claude-fable-5` في `us-east-1`، أو
    معرّفات الاستدلال الإقليمية مثل `us.anthropic.claude-fable-5`.
    يطبّق OpenClaw نافذة سياق Fable البالغة 1M، وحد إخراج 128K، والتفكير
    التكيّفي الدائم التشغيل، وتعيين الجهد المدعوم. يتم تعيين `/think off` و
    `/think minimal` إلى `low`؛ ويتم حذف عناصر التحكم غير المدعومة في درجة الحرارة
    واختيار الأداة القسري. يُحتفظ بالإخراج المتدفق حتى يعيد Bedrock حالة نهائية
    كي لا تكشف حالات الرفض في منتصف التدفق نصا جزئيا.
    يدعم Fable فئة الخدمة القياسية فقط؛ يتجاهل OpenClaw فئات
    `flex` و`priority` و`reserved` المكوّنة لهذا النموذج.

    تتطلب AWS اشتراكا صريحا في الاحتفاظ بالبيانات عبر `provider_data_share` قبل
    إتاحة Fable. تتم مشاركة المطالبات والإكمالات مع Anthropic والاحتفاظ بها
    لمدة تصل إلى 30 يوما لأغراض الثقة والسلامة. راجع واضبط
    [الاحتفاظ ببيانات Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    قبل تمكين النموذج.

  </Accordion>

  <Accordion title="Guardrails">
    يمكنك تطبيق [حواجز حماية Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    على جميع استدعاءات نماذج Bedrock بإضافة كائن `guardrail` إلى إعدادات
    Plugin `amazon-bedrock`. تتيح لك حواجز الحماية فرض تصفية المحتوى،
    ورفض الموضوعات، ومرشحات الكلمات، ومرشحات المعلومات الحساسة، وفحوصات
    الإسناد السياقي.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | الخيار | مطلوب | الوصف |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | نعم | معرّف حاجز الحماية (مثل `abc123`) أو ARN كامل (مثل `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | نعم | رقم الإصدار المنشور، أو `"DRAFT"` للمسودة قيد العمل. |
    | `streamProcessingMode` | لا | `"sync"` أو `"async"` لتقييم حاجز الحماية أثناء البث. إذا حُذف، يستخدم Bedrock القيمة الافتراضية لديه. |
    | `trace` | لا | `"enabled"` أو `"enabled_full"` لتصحيح الأخطاء؛ احذفه أو عيّنه إلى `"disabled"` للإنتاج. |

    <Warning>
    يجب أن يمتلك كيان IAM الأساسي الذي يستخدمه Gateway إذن `bedrock:ApplyGuardrail` بالإضافة إلى أذونات الاستدعاء القياسية.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    يمكن أن يعمل Bedrock أيضا مزودا للتضمينات من أجل
    [بحث الذاكرة](/ar/concepts/memory-search). يتم تكوين هذا بشكل منفصل عن
    مزود الاستدلال -- عيّن `agents.defaults.memorySearch.provider` إلى `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    تستخدم تضمينات Bedrock سلسلة بيانات اعتماد AWS SDK نفسها المستخدمة للاستدلال
    (أدوار المثيلات، وSSO، ومفاتيح الوصول، والإعدادات المشتركة، وهوية الويب). لا
    يلزم مفتاح API. عيّن `memorySearch.provider: "bedrock"` صراحة لاستخدام
    تضمينات Bedrock.

    تشمل نماذج التضمين المدعومة Amazon Titan Embed (v1، v2)، وAmazon Nova
    Embed، وCohere Embed (v3، v4)، وTwelveLabs Marengo. راجع
    [مرجع إعدادات الذاكرة -- Bedrock](/ar/reference/memory-config#bedrock-embedding-config)
    للحصول على قائمة النماذج الكاملة وخيارات الأبعاد.

  </Accordion>

  <Accordion title="Notes and caveats">
    - يتطلب Bedrock تمكين **الوصول إلى النماذج** في حسابك/منطقتك على AWS.
    - يحتاج الاكتشاف التلقائي إلى إذني `bedrock:ListFoundationModels` و
      `bedrock:ListInferenceProfiles`.
    - إذا كنت تعتمد على الوضع التلقائي، فعيّن إحدى علامات بيئة مصادقة AWS المدعومة على
      مضيف Gateway. إذا كنت تفضل مصادقة IMDS/الإعدادات المشتركة دون علامات بيئة، فعيّن
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - يعرض OpenClaw مصدر بيانات الاعتماد بهذا الترتيب: `AWS_BEARER_TOKEN_BEDROCK`،
      ثم `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`، ثم `AWS_PROFILE`، ثم
      سلسلة AWS SDK الافتراضية.
    - يعتمد دعم الاستدلال على النموذج؛ تحقق من بطاقة نموذج Bedrock لمعرفة
      القدرات الحالية.
    - إذا كنت تفضل تدفق مفاتيح مُدارا، يمكنك أيضا وضع وكيل متوافق مع OpenAI
      أمام Bedrock وتكوينه بدلا من ذلك كمزود OpenAI.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="Memory search" href="/ar/concepts/memory-search" icon="magnifying-glass">
    تضمينات Bedrock لإعداد بحث الذاكرة.
  </Card>
  <Card title="Memory config reference" href="/ar/reference/memory-config#bedrock-embedding-config" icon="database">
    قائمة نماذج تضمين Bedrock الكاملة وخيارات الأبعاد.
  </Card>
  <Card title="Troubleshooting" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها العام والأسئلة الشائعة.
  </Card>
</CardGroup>
