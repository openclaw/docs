---
read_when:
    - تريد استخدام نماذج Amazon Bedrock مع OpenClaw
    - تحتاج إلى إعداد بيانات اعتماد/منطقة AWS لاستدعاءات النماذج
summary: استخدم نماذج Amazon Bedrock ‏(Converse API) مع OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-24T07:58:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e37aaead5c9bd730b4dd1f2878ff63bebf5537d75ff9df786813c58b1ac2fc0
    source_path: providers/bedrock.md
    workflow: 15
---

يمكن لـ OpenClaw استخدام نماذج **Amazon Bedrock** عبر مزوّد **Bedrock Converse**
المتدفق في pi-ai. تستخدم مصادقة Bedrock **سلسلة بيانات الاعتماد الافتراضية في AWS SDK**،
وليس مفتاح API.

| الخاصية | القيمة                                                      |
| ------- | ----------------------------------------------------------- |
| المزوّد | `amazon-bedrock`                                            |
| API     | `bedrock-converse-stream`                                   |
| المصادقة | بيانات اعتماد AWS ‏(متغيرات البيئة، أو الإعدادات المشتركة، أو دور المثيل) |
| المنطقة | `AWS_REGION` أو `AWS_DEFAULT_REGION` ‏(الافتراضي: `us-east-1`) |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفاتيح الوصول / متغيرات البيئة">
    **الأفضل لـ:** أجهزة المطورين، وCI، أو المضيفات التي تدير فيها بيانات اعتماد AWS مباشرةً.

    <Steps>
      <Step title="اضبط بيانات اعتماد AWS على مضيف gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # اختياري:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # اختياري (مفتاح API/رمز bearer لـ Bedrock):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="أضف مزوّد Bedrock ونموذجًا إلى إعداداتك">
        لا حاجة إلى `apiKey`. اضبط المزوّد باستخدام `auth: "aws-sdk"`:

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
      <Step title="تحقق من أن النماذج متاحة">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    مع مصادقة علامة البيئة (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, أو `AWS_BEARER_TOKEN_BEDROCK`)، يفعّل OpenClaw تلقائيًا مزوّد Bedrock الضمني لاكتشاف النماذج من دون إعدادات إضافية.
    </Tip>

  </Tab>

  <Tab title="أدوار مثيل EC2 ‏(IMDS)">
    **الأفضل لـ:** مثيلات EC2 المرفق بها دور IAM، باستخدام خدمة بيانات التعريف الخاصة بالمثيل للمصادقة.

    <Steps>
      <Step title="فعّل الاكتشاف صراحةً">
        عند استخدام IMDS، لا يستطيع OpenClaw اكتشاف مصادقة AWS من علامات البيئة وحدها، لذا يجب عليك الاشتراك يدويًا:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="أضف علامة بيئة اختياريًا للوضع التلقائي">
        إذا كنت تريد أيضًا أن يعمل مسار الاكتشاف التلقائي لعلامة البيئة (على سبيل المثال لأسطح `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        أنت **لا** تحتاج إلى مفتاح API وهمي.
      </Step>
      <Step title="تحقق من اكتشاف النماذج">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    يجب أن يمتلك دور IAM المرفق بمثيل EC2 الخاص بك الأذونات التالية:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` ‏(للاكتشاف التلقائي)
    - `bedrock:ListInferenceProfiles` ‏(لاكتشاف inference profiles)

    أو قم بإرفاق السياسة المُدارة `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    تحتاج إلى `AWS_PROFILE=default` فقط إذا كنت تريد تحديدًا علامة بيئة للوضع التلقائي أو لأسطح الحالة. أما مسار المصادقة الفعلي لوقت تشغيل Bedrock فيستخدم سلسلة AWS SDK الافتراضية، لذا فإن مصادقة دور المثيل عبر IMDS تعمل حتى من دون علامات بيئة.
    </Note>

  </Tab>
</Tabs>

## الاكتشاف التلقائي للنماذج

يمكن لـ OpenClaw اكتشاف نماذج Bedrock تلقائيًا التي تدعم **البث**
و**المخرجات النصية**. ويستخدم الاكتشاف `bedrock:ListFoundationModels` و
`bedrock:ListInferenceProfiles`، وتُخزَّن النتائج مؤقتًا (الافتراضي: ساعة واحدة).

كيفية تفعيل المزوّد الضمني:

- إذا كانت `plugins.entries.amazon-bedrock.config.discovery.enabled` تساوي `true`,
  فسيحاول OpenClaw الاكتشاف حتى عندما لا توجد علامة بيئة AWS.
- إذا كانت `plugins.entries.amazon-bedrock.config.discovery.enabled` غير مضبوطة،
  فلن يضيف OpenClaw
  مزوّد Bedrock الضمني تلقائيًا إلا عندما يرى إحدى علامات مصادقة AWS التالية:
  `AWS_BEARER_TOKEN_BEDROCK`, أو `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, أو `AWS_PROFILE`.
- ما يزال مسار المصادقة الفعلي لوقت تشغيل Bedrock يستخدم سلسلة AWS SDK الافتراضية، لذلك
  يمكن أن تعمل الإعدادات المشتركة، وSSO، ومصادقة دور المثيل عبر IMDS حتى عندما احتاج الاكتشاف
  إلى `enabled: true` للاشتراك.

<Note>
بالنسبة إلى الإدخالات الصريحة في `models.providers["amazon-bedrock"]`، يمكن لـ OpenClaw أيضًا تحليل مصادقة علامة البيئة الخاصة بـ Bedrock مبكرًا من علامات بيئة AWS مثل `AWS_BEARER_TOKEN_BEDROCK` من دون فرض تحميل مصادقة وقت التشغيل بالكامل. أما مسار المصادقة الفعلي لاستدعاءات النماذج فما يزال يستخدم سلسلة AWS SDK الافتراضية.
</Note>

<AccordionGroup>
  <Accordion title="خيارات إعداد الاكتشاف">
    توجد خيارات الإعداد تحت `plugins.entries.amazon-bedrock.config.discovery`:

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
    | ------ | --------- | ----- |
    | `enabled` | auto | في الوضع التلقائي، لا يفعّل OpenClaw مزوّد Bedrock الضمني إلا عندما يرى علامة بيئة AWS مدعومة. اضبطه على `true` لفرض الاكتشاف. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | منطقة AWS المستخدمة لاستدعاءات API الخاصة بالاكتشاف. |
    | `providerFilter` | (الكل) | يطابق أسماء مزوّدي Bedrock ‏(مثل `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | مدة التخزين المؤقت بالثواني. اضبطها على `0` لتعطيل التخزين المؤقت. |
    | `defaultContextWindow` | `32000` | نافذة السياق المستخدمة للنماذج المكتشفة (تجاوزها إذا كنت تعرف حدود نموذجك). |
    | `defaultMaxTokens` | `4096` | الحد الأقصى لرموز المخرجات المستخدمة للنماذج المكتشفة (تجاوزها إذا كنت تعرف حدود نموذجك). |

  </Accordion>
</AccordionGroup>

## إعداد سريع (مسار AWS)

ينشئ هذا الشرح دور IAM، ويرفق أذونات Bedrock، ويربط
instance profile، ويفعّل اكتشاف OpenClaw على مضيف EC2.

```bash
# 1. أنشئ دور IAM وinstance profile
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

# 2. اربطه بمثيل EC2 الخاص بك
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. على مثيل EC2، فعّل الاكتشاف صراحةً
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. اختياري: أضف علامة بيئة إذا كنت تريد الوضع التلقائي من دون تفعيل صريح
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. تحقّق من اكتشاف النماذج
openclaw models list
```

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="Inference profiles">
    يكتشف OpenClaw **inference profiles الإقليمية والعالمية** إلى جانب
    foundation models. وعندما يطابق profile نموذج foundation معروفًا، فإن
    profile يرث إمكانات ذلك النموذج (نافذة السياق، والحد الأقصى للرموز،
    والاستدلال، والرؤية) ويتم حقن منطقة طلب Bedrock الصحيحة
    تلقائيًا. وهذا يعني أن ملفات Claude الشخصية العابرة للمناطق تعمل من دون تجاوزات مزوّد يدوية.

    تبدو معرّفات inference profile مثل `us.anthropic.claude-opus-4-6-v1:0` ‏(إقليمي)
    أو `anthropic.claude-opus-4-6-v1:0` ‏(عالمي). وإذا كان النموذج الداعم موجودًا بالفعل
    في نتائج الاكتشاف، فإن profile يرث مجموعة إمكاناته الكاملة؛
    وإلا تُطبَّق قيم افتراضية آمنة.

    لا حاجة إلى أي إعدادات إضافية. ما دام الاكتشاف مفعّلًا وكان principal الخاص بـ IAM
    يملك `bedrock:ListInferenceProfiles`، فستظهر profiles إلى جانب
    foundation models في `openclaw models list`.

  </Accordion>

  <Accordion title="Guardrails">
    يمكنك تطبيق [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    على جميع استدعاءات نماذج Bedrock عبر إضافة كائن `guardrail` إلى
    إعداد Plugin ‏`amazon-bedrock`. وتتيح لك Guardrails فرض تصفية المحتوى،
    وحظر الموضوعات، وفلاتر الكلمات، وفلاتر المعلومات الحساسة، وفحوصات
    التأريض السياقي.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // معرّف guardrail أو ARN كامل
                guardrailVersion: "1", // رقم الإصدار أو "DRAFT"
                streamProcessingMode: "sync", // اختياري: "sync" أو "async"
                trace: "enabled", // اختياري: "enabled", "disabled", أو "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | الخيار | مطلوب | الوصف |
    | ------ | ----- | ----- |
    | `guardrailIdentifier` | نعم | معرّف Guardrail ‏(مثل `abc123`) أو ARN كامل (مثل `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | نعم | رقم إصدار منشور، أو `"DRAFT"` للمسودة العاملة. |
    | `streamProcessingMode` | لا | `"sync"` أو `"async"` لتقييم guardrail أثناء البث. وإذا حُذف، تستخدم Bedrock القيمة الافتراضية الخاصة بها. |
    | `trace` | لا | `"enabled"` أو `"enabled_full"` لأغراض التصحيح؛ احذفه أو اضبطه على `"disabled"` للإنتاج. |

    <Warning>
    يجب أن يمتلك principal الخاص بـ IAM الذي تستخدمه gateway الإذن `bedrock:ApplyGuardrail` بالإضافة إلى أذونات الاستدعاء القياسية.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings للبحث في الذاكرة">
    يمكن لـ Bedrock أيضًا أن يعمل كمزوّد embeddings من أجل
    [البحث في الذاكرة](/ar/concepts/memory-search). ويتم إعداد ذلك بشكل منفصل عن
    مزوّد الاستدلال -- اضبط `agents.defaults.memorySearch.provider` على `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // الافتراضي
          },
        },
      },
    }
    ```

    تستخدم embeddings الخاصة بـ Bedrock سلسلة بيانات الاعتماد نفسها في AWS SDK مثل الاستدلال (أدوار
    المثيل، وSSO، ومفاتيح الوصول، والإعدادات المشتركة، وweb identity). ولا حاجة إلى مفتاح API.
    وعندما تكون `provider` هي `"auto"`، يتم اكتشاف Bedrock تلقائيًا إذا تم تحليل
    سلسلة بيانات الاعتماد هذه بنجاح.

    تشمل نماذج embeddings المدعومة Amazon Titan Embed ‏(الإصداران v1 وv2)، وAmazon Nova
    Embed، وCohere Embed ‏(v3 وv4)، وTwelveLabs Marengo. راجع
    [مرجع إعدادات الذاكرة -- Bedrock](/ar/reference/memory-config#bedrock-embedding-config)
    للحصول على قائمة النماذج الكاملة وخيارات الأبعاد.

  </Accordion>

  <Accordion title="ملاحظات ومحاذير">
    - يتطلب Bedrock تفعيل **الوصول إلى النموذج** في حساب/منطقة AWS الخاصة بك.
    - يحتاج الاكتشاف التلقائي إلى الأذونات `bedrock:ListFoundationModels` و
      `bedrock:ListInferenceProfiles`.
    - إذا كنت تعتمد على الوضع التلقائي، فاضبط إحدى علامات بيئة مصادقة AWS المدعومة على
      مضيف gateway. وإذا كنت تفضّل مصادقة IMDS/الإعدادات المشتركة من دون علامات بيئة، فاضبط
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - يكشف OpenClaw مصدر بيانات الاعتماد بهذا الترتيب: `AWS_BEARER_TOKEN_BEDROCK`,
      ثم `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, ثم `AWS_PROFILE`, ثم
      سلسلة AWS SDK الافتراضية.
    - يعتمد دعم الاستدلال على النموذج؛ راجع بطاقة نموذج Bedrock للاطلاع على
      الإمكانات الحالية.
    - إذا كنت تفضّل تدفق مفاتيح مُدارًا، فيمكنك أيضًا وضع وكيل
      متوافق مع OpenAI أمام Bedrock وإعداده كمزوّد OpenAI بدلًا من ذلك.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع عند الفشل.
  </Card>
  <Card title="البحث في الذاكرة" href="/ar/concepts/memory-search" icon="magnifying-glass">
    إعداد Bedrock embeddings للبحث في الذاكرة.
  </Card>
  <Card title="مرجع إعدادات الذاكرة" href="/ar/reference/memory-config#bedrock-embedding-config" icon="database">
    قائمة نماذج Bedrock embeddings الكاملة وخيارات الأبعاد.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء الشائع والأسئلة الشائعة.
  </Card>
</CardGroup>
