---
read_when:
    - تريد استخدام نماذج Amazon Bedrock مع OpenClaw
    - تحتاج إلى إعداد بيانات اعتماد AWS والمنطقة لإجراء استدعاءات النموذج
summary: استخدام نماذج Amazon Bedrock ‏(واجهة Converse API) مع OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T06:26:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام نماذج **Amazon Bedrock** عبر موفّر البث
**Bedrock Converse** الخاص به. تستخدم مصادقة Bedrock **سلسلة بيانات الاعتماد الافتراضية لـ AWS SDK**،
وليس مفتاح API.

| الخاصية | القيمة                                                       |
| -------- | ----------------------------------------------------------- |
| الموفّر | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| المصادقة | بيانات اعتماد AWS (متغيرات البيئة أو الإعداد المشترك أو دور المثيل) |
| المنطقة   | `AWS_REGION` أو `AWS_DEFAULT_REGION` (الافتراضي: `us-east-1`) |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفاتيح الوصول / متغيرات البيئة">
    **الأنسب لـ:** أجهزة المطورين وCI والمضيفين الذين تدير بيانات اعتماد AWS عليهم مباشرةً.

    <Steps>
      <Step title="تعيين بيانات اعتماد AWS على مضيف Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # اختياري:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # اختياري (مفتاح API لـ Bedrock/رمز حامل):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="إضافة موفّر Bedrock ونموذج إلى إعدادك">
        لا يلزم `apiKey`. اضبط الموفّر باستخدام `auth: "aws-sdk"`:

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
      <Step title="التحقق من توفر النماذج">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    عند استخدام مصادقة مؤشرات البيئة (`AWS_ACCESS_KEY_ID` أو `AWS_PROFILE` أو `AWS_BEARER_TOKEN_BEDROCK`)، يفعّل OpenClaw موفّر Bedrock الضمني تلقائيًا لاكتشاف النماذج من دون إعداد إضافي.
    </Tip>

  </Tab>

  <Tab title="أدوار مثيلات EC2 ‏(IMDS)">
    **الأنسب لـ:** مثيلات EC2 المرتبط بها دور IAM، مع استخدام خدمة بيانات تعريف المثيل للمصادقة.

    <Steps>
      <Step title="تفعيل الاكتشاف صراحةً">
        عند استخدام IMDS، لا يستطيع OpenClaw اكتشاف مصادقة AWS من مؤشرات البيئة وحدها، لذا يجب الاشتراك صراحةً:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="إضافة مؤشر بيئة اختياري للوضع التلقائي">
        إذا أردت أيضًا أن يعمل مسار الاكتشاف التلقائي لمؤشرات البيئة (على سبيل المثال، لواجهات `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        لا تحتاج إلى مفتاح API وهمي.
      </Step>
      <Step title="التحقق من اكتشاف النماذج">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    يجب أن يمتلك دور IAM المرتبط بمثيل EC2 الأذونات التالية:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (للاكتشاف التلقائي)
    - `bedrock:ListInferenceProfiles` (لاكتشاف ملفات تعريف الاستدلال)

    أو أرفق السياسة المُدارة `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    لا تحتاج إلى `AWS_PROFILE=default` إلا إذا كنت تريد تحديدًا مؤشر بيئة للوضع التلقائي أو واجهات الحالة. يستخدم مسار مصادقة تشغيل Bedrock الفعلي سلسلة AWS SDK الافتراضية، لذلك تعمل مصادقة دور المثيل عبر IMDS حتى من دون مؤشرات بيئة.
    </Note>

  </Tab>
</Tabs>

## الاكتشاف التلقائي للنماذج

يمكن لـ OpenClaw اكتشاف نماذج Bedrock التي تدعم **البث**
و**الإخراج النصي** تلقائيًا. يستخدم الاكتشاف `bedrock:ListFoundationModels`
و`bedrock:ListInferenceProfiles`، وتُخزّن النتائج مؤقتًا (الافتراضي: ساعة واحدة).

كيفية تفعيل الموفّر الضمني:

- إذا كانت `plugins.entries.amazon-bedrock.config.discovery.enabled` تساوي `true`،
  فسيحاول OpenClaw الاكتشاف حتى عند عدم وجود مؤشر بيئة لـ AWS.
- إذا لم تكن `plugins.entries.amazon-bedrock.config.discovery.enabled` معيّنة،
  فلن يضيف OpenClaw موفّر Bedrock الضمني تلقائيًا إلا عندما يرى أحد مؤشرات مصادقة AWS التالية:
  `AWS_BEARER_TOKEN_BEDROCK`، أو `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`، أو `AWS_PROFILE`.
- يظل مسار مصادقة تشغيل Bedrock الفعلي يستخدم سلسلة AWS SDK الافتراضية، لذلك
  يمكن أن تعمل مصادقة الإعداد المشترك وSSO ودور المثيل عبر IMDS حتى عندما
  يتطلب الاكتشاف `enabled: true` للاشتراك.

<Note>
بالنسبة إلى إدخالات `models.providers["amazon-bedrock"]` الصريحة، لا يزال بإمكان OpenClaw حل مصادقة مؤشرات بيئة Bedrock مبكرًا من مؤشرات بيئة AWS مثل `AWS_BEARER_TOKEN_BEDROCK` من دون فرض تحميل مصادقة التشغيل بالكامل. يظل مسار مصادقة استدعاء النموذج الفعلي يستخدم سلسلة AWS SDK الافتراضية.
</Note>

<AccordionGroup>
  <Accordion title="خيارات إعداد الاكتشاف">
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
    | `enabled` | تلقائي | في الوضع التلقائي، لا يفعّل OpenClaw موفّر Bedrock الضمني إلا عندما يرى مؤشر بيئة AWS مدعومًا. عيّنه إلى `true` لفرض الاكتشاف. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | منطقة AWS المستخدمة لاستدعاءات API الخاصة بالاكتشاف. |
    | `providerFilter` | (الكل) | يطابق أسماء موفّري Bedrock (مثل `anthropic` و`amazon`). |
    | `refreshInterval` | `3600` | مدة التخزين المؤقت بالثواني. عيّنه إلى `0` لتعطيل التخزين المؤقت. |
    | `defaultContextWindow` | `32000` | نافذة السياق المستخدمة للنماذج المكتشفة التي لا تُعرف حدود الرموز الخاصة بها (تجاوزها إذا كنت تعرف حدود نموذجك). |
    | `defaultMaxTokens` | `4096` | الحد الأقصى لرموز الإخراج المستخدمة للنماذج المكتشفة التي لا تُعرف حدود الرموز الخاصة بها (تجاوزه إذا كنت تعرف حدود نموذجك). |

  </Accordion>

  <Accordion title="نافذة السياق وحدود الحد الأقصى للرموز">
    لا تعيد واجهتا API ‏`ListFoundationModels` و`GetFoundationModel` في Bedrock
    بيانات وصفية لحدود الرموز، بل تعيدان فقط معرّف النموذج واسمه ووسائطه وحالة
    دورة حياته. يوفّر OpenClaw جدول بحث لنوافذ السياق وحدود الإخراج المعروفة
    لنماذج Bedrock الشائعة (Claude وNova وLlama وMistral وDeepSeek
    وغيرها)، لكي تعمل إدارة الجلسات وحدود Compaction واكتشاف
    تجاوز السياق على نحو صحيح لهذه النماذج.

    تعود النماذج المكتشفة غير الموجودة في الجدول إلى `defaultContextWindow`
    و`defaultMaxTokens`. إذا كان أحد النماذج التي تستخدمها يفتقر إلى حدود دقيقة،
    فتجاوزها بإدخال صريح في
    `models.providers["amazon-bedrock"].models`.

  </Accordion>
</AccordionGroup>

## الإعداد السريع (مسار AWS)

ينشئ هذا الشرح التفصيلي دور IAM، ويرفق أذونات Bedrock، ويربط
ملف تعريف المثيل، ويفعّل اكتشاف OpenClaw على مضيف EC2.

```bash
# 1. إنشاء دور IAM وملف تعريف المثيل
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

# 2. إرفاقه بمثيل EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. تفعيل الاكتشاف صراحةً على مثيل EC2
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. اختياري: إضافة مؤشر بيئة إذا كنت تريد الوضع التلقائي من دون تفعيل صريح
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. التحقق من اكتشاف النماذج
openclaw models list
```

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="ملفات تعريف الاستدلال">
    يكتشف OpenClaw **ملفات تعريف الاستدلال الإقليمية والعالمية** إلى جانب
    النماذج الأساسية. عندما يرتبط ملف تعريف بنموذج أساسي معروف، يرث
    ملف التعريف إمكانات ذلك النموذج (نافذة السياق والحد الأقصى للرموز
    والاستدلال والرؤية)، وتُحقن منطقة طلب Bedrock الصحيحة
    تلقائيًا. وهذا يعني أن ملفات تعريف Claude العابرة للمناطق تعمل من دون
    تجاوزات يدوية للموفّر. تُدرج ملفات التعريف العالمية العابرة للمناطق (`global.*`)
    أولًا في `openclaw models list` لأنها توفر عمومًا سعة أفضل
    وتبديلًا تلقائيًا عند الفشل.

    تبدو معرّفات ملفات تعريف الاستدلال مثل `us.anthropic.claude-opus-4-6-v1:0` (إقليمي)
    أو `anthropic.claude-opus-4-6-v1:0` (عالمي). إذا كان النموذج الأساسي موجودًا بالفعل
    في نتائج الاكتشاف، فسيرث ملف التعريف مجموعة إمكاناته الكاملة؛
    وإلا فستُطبّق الإعدادات الافتراضية الآمنة.

    لا يلزم إعداد إضافي. ما دام الاكتشاف مفعّلًا ويمتلك كيان IAM
    الإذن `bedrock:ListInferenceProfiles`، فستظهر ملفات التعريف إلى جانب
    النماذج الأساسية في `openclaw models list`.

  </Accordion>

  <Accordion title="فئة الخدمة">
    تدعم بعض نماذج Bedrock المعلمة `service_tier` لتحسين التكلفة
    أو زمن الاستجابة. تتوفر الفئات التالية:

    | الفئة | الوصف |
    |------|-------------|
    | `default` | فئة Bedrock القياسية |
    | `flex` | معالجة مخفّضة التكلفة لأحمال العمل التي يمكنها تحمّل زمن استجابة أطول |
    | `priority` | معالجة ذات أولوية لأحمال العمل الحساسة لزمن الاستجابة |
    | `reserved` | سعة محجوزة لأحمال العمل ذات الحالة المستقرة |

    عيّن `serviceTier` (أو `service_tier`) عبر `agents.defaults.params` لطلبات
    نماذج Bedrock، أو لكل نموذج في
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // ينطبق على جميع النماذج
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // تجاوز خاص بالنموذج
              },
            },
          },
        },
      },
    }
    ```

    القيم الصالحة هي `default` و`flex` و`priority` و`reserved`. لا يدعم Claude
    Fable 5 وSonnet 5 سوى المستوى `default`؛ ويصدر OpenClaw تحذيرًا
    ويتجاهل `flex` أو `priority` أو `reserved` عند طلبها لهذه النماذج. أما
    بالنسبة إلى النماذج الأخرى، فلا يدعم كل نموذج جميع المستويات؛ إذ يؤدي
    المستوى غير المدعوم إلى خطأ تحقق من Bedrock، وقد تكون رسالة الخطأ
    مضللة (مثل "معرّف النموذج المقدَّم غير صالح" بدلًا من تحديد المستوى
    بوصفه سبب المشكلة). إذا ظهر لك هذا الخطأ، فتحقق مما إذا كان النموذج
    يدعم المستوى المطلوب.

  </Accordion>

  <Accordion title="Claude Opus 4.7 and 4.8 temperature">
    يرفض Bedrock المعلمة `temperature` في Claude Opus 4.7 وOpus
    4.8. يحذف OpenClaw المعلمة `temperature` تلقائيًا لأي مرجع Bedrock
    مطابق، بما في ذلك معرّفات النماذج الأساسية، وملفات تعريف الاستدلال
    المسماة، وملفات تعريف استدلال التطبيقات التي يُحل نموذجها الأساسي إلى
    Opus 4.7/4.8 عبر `bedrock:GetInferenceProfile`، ومتغيرات
    `opus-4.7`/`opus-4.8` المنقوطة ذات بادئات المناطق الاختيارية
    (`us.` و`eu.` و`ap.` و`apac.` و`au.` و`jp.` و`global.`).
    لا يلزم أي خيار ضبط، وينطبق الحذف على كل من كائن خيارات الطلب وحقل
    الحمولة `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    استخدم `amazon-bedrock/anthropic.claude-fable-5` في `us-east-1`، أو
    معرّفات الاستدلال الإقليمية مثل `us.anthropic.claude-fable-5`.
    يطبّق OpenClaw نافذة السياق البالغة مليون رمز في Fable، وحد الإخراج
    البالغ 128 ألف رمز، والتفكير التكيفي الدائم، وتعيين مستويات الجهد
    المدعومة. يُعيَّن `/think off` و`/think minimal` إلى `low`؛ وتُحذف
    عناصر التحكم في درجة الحرارة والاختيار الإجباري للأدوات، بما يتوافق
    مع مسار Opus 4.7/4.8. يُحتجز الإخراج المتدفق حتى يعيد Bedrock حالة
    نهائية، كي لا تكشف حالات الرفض في منتصف التدفق نصًا جزئيًا.

    تتطلب AWS اشتراكًا صريحًا في الاحتفاظ بالبيانات عبر `provider_data_share`
    قبل إتاحة Fable. تُشارك المطالبات والإجابات المكتملة مع Anthropic
    ويُحتفظ بها لمدة تصل إلى 30 يومًا لأغراض الثقة والسلامة. راجع واضبط
    [الاحتفاظ بالبيانات في Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    قبل تمكين النموذج.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    لا يتوفر Claude Mythos 5 عبر Bedrock إلا للحسابات الحاصلة على
    موافقة الوصول المحدود المطلوبة. يتعرف OpenClaw على النموذج الأساسي
    `anthropic.claude-mythos-5` وملفات تعريف الاستدلال الإقليمية أو
    العالمية مثل `us.anthropic.claude-mythos-5`.

    يطبّق OpenClaw نافذة سياق بسعة 1,000,000 رمز، وحد إخراج قدره
    128,000 رمز، وإدخال الصور، والتخزين المؤقت للمطالبات، والبث الآمن
    عند الرفض، ومستويات الجهد الأصلية. يكون التفكير التكيفي ممكّنًا دائمًا:
    يُعيَّن `/think off` و`/think minimal` إلى `low`، بينما يظل `xhigh`
    و`max` متاحين. تُحذف قيم أخذ العينات المخصصة والاختيار الإجباري
    للأدوات.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    توثق AWS استخدام Sonnet 5 مع كل من نقطتي النهاية
    [`bedrock-runtime` و`bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    يتعرف OpenClaw على نموذج Bedrock الأساسي
    `anthropic.claude-sonnet-5` وملفات تعريف الاستدلال الإقليمية أو
    العالمية مثل `us.anthropic.claude-sonnet-5`. ويطبّق نافذة سياق
    بسعة 1,000,000 رمز، وحد إخراج قدره 128,000 رمز، وإدخال الصور،
    ومستويات الجهد الأصلية، والتخزين المؤقت للمطالبات، والبث الآمن عند
    الرفض.

    يُبقي Bedrock التفكير التكيفي ممكّنًا في Sonnet 5. يستخدم OpenClaw
    القيمة `high` افتراضيًا؛ ويُعيَّن `/think off` و`/think minimal` إلى
    `low` لأن هذا المسار لا يستطيع تعطيل التفكير. تُحذف قيم درجة الحرارة
    المخصصة والاختيار الإجباري للأدوات ما دام التفكير التكيفي نشطًا.

  </Accordion>

  <Accordion title="Guardrails">
    يمكنك تطبيق [ضوابط Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    على جميع استدعاءات نماذج Bedrock عن طريق إضافة كائن `guardrail` إلى
    ضبط Plugin ‏`amazon-bedrock`. تتيح لك الضوابط فرض تصفية المحتوى،
    ورفض الموضوعات، ومرشحات الكلمات، ومرشحات المعلومات الحساسة،
    وفحوصات التأصيل السياقي.

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

    الحقلان `guardrailIdentifier` و`guardrailVersion` مطلوبان.

    | الخيار | الوصف |
    | ------ | ----------- |
    | `guardrailIdentifier` | معرّف الضابط (مثل `abc123`) أو ARN الكامل (مثل `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | رقم الإصدار المنشور، أو `"DRAFT"` لمسودة العمل. |
    | `streamProcessingMode` | القيمة `"sync"` أو `"async"` لتقييم الضابط أثناء البث. إذا حُذف، يستخدم Bedrock قيمته الافتراضية. |
    | `trace` | القيمة `"enabled"` أو `"enabled_full"` لتصحيح الأخطاء؛ احذفها أو عيّنها إلى `"disabled"` في بيئة الإنتاج. |

    <Warning>
    يجب أن يمتلك كيان IAM الرئيسي الذي يستخدمه Gateway إذن `bedrock:ApplyGuardrail` بالإضافة إلى أذونات الاستدعاء القياسية.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    يمكن أن يعمل Bedrock أيضًا بوصفه موفّر التضمينات في
    [البحث في الذاكرة](/ar/concepts/memory-search). يُضبط هذا بصورة منفصلة عن
    موفّر الاستدلال؛ عيّن `agents.defaults.memorySearch.provider` إلى `"bedrock"`:

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

    تستخدم تضمينات Bedrock سلسلة بيانات اعتماد AWS SDK نفسها المستخدمة
    للاستدلال (أدوار المثيلات، وSSO، ومفاتيح الوصول، والضبط المشترك،
    وهوية الويب). لا يلزم مفتاح API.

    تشمل نماذج التضمين المدعومة Amazon Titan Embed ‏(v1 وv2)، وAmazon Nova
    Embed، وCohere Embed ‏(v3 وv4)، وTwelveLabs Marengo. راجع
    [مرجع ضبط الذاكرة — Bedrock](/ar/reference/memory-config#bedrock-embedding-config)
    للاطلاع على القائمة الكاملة للنماذج وخيارات الأبعاد.

  </Accordion>

  <Accordion title="Notes and caveats">
    - يتطلب Bedrock تمكين **الوصول إلى النموذج** في حساب AWS/المنطقة لديك.
    - يتطلب الاكتشاف التلقائي الإذنين `bedrock:ListFoundationModels` و
      `bedrock:ListInferenceProfiles`.
    - إذا كنت تعتمد على الوضع التلقائي، فعيّن إحدى علامات بيئة مصادقة AWS
      المدعومة على مضيف Gateway. وإذا كنت تفضّل مصادقة IMDS/الضبط المشترك
      من دون علامات بيئة، فعيّن
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - يعرض OpenClaw مصدر بيانات الاعتماد بالترتيب التالي: `AWS_BEARER_TOKEN_BEDROCK`،
      ثم `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`، ثم `AWS_PROFILE`،
      ثم سلسلة AWS SDK الافتراضية.
    - يعتمد دعم الاستدلال على النموذج؛ راجع بطاقة نموذج Bedrock لمعرفة
      الإمكانات الحالية.
    - إذا كنت تفضّل تدفق مفاتيح مُدارًا، فيمكنك أيضًا وضع وكيل متوافق مع
      OpenAI أمام Bedrock وضبطه بوصفه موفّر OpenAI بدلًا من ذلك.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="Memory search" href="/ar/concepts/memory-search" icon="magnifying-glass">
    تضمينات Bedrock لضبط البحث في الذاكرة.
  </Card>
  <Card title="Memory config reference" href="/ar/reference/memory-config#bedrock-embedding-config" icon="database">
    القائمة الكاملة لنماذج تضمين Bedrock وخيارات الأبعاد.
  </Card>
  <Card title="Troubleshooting" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها عمومًا والأسئلة الشائعة.
  </Card>
</CardGroup>
