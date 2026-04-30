---
read_when:
    - تريد استخدام نماذج Amazon Bedrock مع OpenClaw
    - تحتاج إلى إعداد بيانات اعتماد AWS والمنطقة لاستدعاءات النماذج
summary: استخدم نماذج Amazon Bedrock (Converse API) مع OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-30T08:19:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام نماذج **Amazon Bedrock** عبر موفر البث **Bedrock Converse**
من pi-ai. تستخدم مصادقة Bedrock **سلسلة بيانات اعتماد AWS SDK الافتراضية**،
وليس مفتاح API.

| الخاصية | القيمة                                                       |
| -------- | ----------------------------------------------------------- |
| الموفر | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| المصادقة | بيانات اعتماد AWS (متغيرات بيئة، تكوين مشترك، أو دور نسخة) |
| المنطقة   | `AWS_REGION` أو `AWS_DEFAULT_REGION` (الافتراضي: `us-east-1`) |

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفاتيح الوصول / متغيرات البيئة">
    **الأفضل لـ:** أجهزة المطورين، وCI، أو المضيفين حيث تدير بيانات اعتماد AWS مباشرة.

    <Steps>
      <Step title="تعيين بيانات اعتماد AWS على مضيف Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="إضافة موفر Bedrock ونموذج إلى تكوينك">
        لا يلزم `apiKey`. كوّن الموفر باستخدام `auth: "aws-sdk"`:

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
    مع مصادقة علامات البيئة (`AWS_ACCESS_KEY_ID` أو `AWS_PROFILE` أو `AWS_BEARER_TOKEN_BEDROCK`)، يفعّل OpenClaw موفر Bedrock الضمني تلقائيًا لاكتشاف النماذج دون تكوين إضافي.
    </Tip>

  </Tab>

  <Tab title="أدوار نسخ EC2 (IMDS)">
    **الأفضل لـ:** نسخ EC2 المرتبط بها دور IAM، مع استخدام خدمة بيانات تعريف النسخة للمصادقة.

    <Steps>
      <Step title="تفعيل الاكتشاف صراحة">
        عند استخدام IMDS، لا يستطيع OpenClaw اكتشاف مصادقة AWS من علامات البيئة وحدها، لذلك يجب أن تختار الاشتراك:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="إضافة علامة بيئة اختياريًا للوضع التلقائي">
        إذا كنت تريد أيضًا أن يعمل مسار الاكتشاف التلقائي عبر علامات البيئة (على سبيل المثال، لأسطح `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        أنت **لا** تحتاج إلى مفتاح API وهمي.
      </Step>
      <Step title="التحقق من اكتشاف النماذج">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    يجب أن يمتلك دور IAM المرتبط بنسخة EC2 لديك الأذونات التالية:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (للاكتشاف التلقائي)
    - `bedrock:ListInferenceProfiles` (لاكتشاف ملفات تعريف الاستدلال)

    أو أرفق السياسة المُدارة `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    تحتاج إلى `AWS_PROFILE=default` فقط إذا كنت تريد تحديدًا علامة بيئة للوضع التلقائي أو أسطح الحالة. يستخدم مسار مصادقة وقت تشغيل Bedrock الفعلي سلسلة AWS SDK الافتراضية، لذلك تعمل مصادقة دور النسخة عبر IMDS حتى بدون علامات بيئة.
    </Note>

  </Tab>
</Tabs>

## اكتشاف النماذج التلقائي

يمكن لـ OpenClaw اكتشاف نماذج Bedrock تلقائيًا التي تدعم **البث**
و**إخراج النص**. يستخدم الاكتشاف `bedrock:ListFoundationModels` و
`bedrock:ListInferenceProfiles`، وتُخزّن النتائج مؤقتًا (الافتراضي: ساعة واحدة).

كيفية تفعيل الموفر الضمني:

- إذا كانت `plugins.entries.amazon-bedrock.config.discovery.enabled` هي `true`،
  فسيحاول OpenClaw الاكتشاف حتى عند عدم وجود علامة بيئة AWS.
- إذا لم تكن `plugins.entries.amazon-bedrock.config.discovery.enabled` معيّنة،
  يضيف OpenClaw تلقائيًا
  موفر Bedrock الضمني فقط عندما يرى إحدى علامات مصادقة AWS هذه:
  `AWS_BEARER_TOKEN_BEDROCK` أو `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` أو `AWS_PROFILE`.
- لا يزال مسار مصادقة وقت تشغيل Bedrock الفعلي يستخدم سلسلة AWS SDK الافتراضية، لذلك
  يمكن أن تعمل مصادقة التكوين المشترك وSSO ودور النسخة عبر IMDS حتى عندما
  احتاج الاكتشاف إلى `enabled: true` للاشتراك.

<Note>
بالنسبة إلى إدخالات `models.providers["amazon-bedrock"]` الصريحة، لا يزال بإمكان OpenClaw حل مصادقة Bedrock عبر علامات البيئة مبكرًا من علامات بيئة AWS مثل `AWS_BEARER_TOKEN_BEDROCK` دون فرض تحميل مصادقة وقت التشغيل كاملة. لا يزال مسار مصادقة استدعاء النموذج الفعلي يستخدم سلسلة AWS SDK الافتراضية.
</Note>

<AccordionGroup>
  <Accordion title="خيارات تكوين الاكتشاف">
    توجد خيارات التكوين ضمن `plugins.entries.amazon-bedrock.config.discovery`:

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
    | `enabled` | تلقائي | في الوضع التلقائي، يفعّل OpenClaw موفر Bedrock الضمني فقط عندما يرى علامة بيئة AWS مدعومة. عيّن `true` لفرض الاكتشاف. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | منطقة AWS المستخدمة لاستدعاءات API الخاصة بالاكتشاف. |
    | `providerFilter` | (الكل) | يطابق أسماء موفري Bedrock (على سبيل المثال `anthropic`، `amazon`). |
    | `refreshInterval` | `3600` | مدة التخزين المؤقت بالثواني. عيّنها إلى `0` لتعطيل التخزين المؤقت. |
    | `defaultContextWindow` | `32000` | نافذة السياق المستخدمة للنماذج المكتشفة (تجاوزها إذا كنت تعرف حدود نموذجك). |
    | `defaultMaxTokens` | `4096` | الحد الأقصى لرموز الإخراج المستخدمة للنماذج المكتشفة (تجاوزها إذا كنت تعرف حدود نموذجك). |

  </Accordion>
</AccordionGroup>

## الإعداد السريع (مسار AWS)

تنشئ هذه الجولة التفصيلية دور IAM، وتُرفق أذونات Bedrock، وتربط
ملف تعريف النسخة، وتفعّل اكتشاف OpenClaw على مضيف EC2.

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

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="ملفات تعريف الاستدلال">
    يكتشف OpenClaw **ملفات تعريف الاستدلال الإقليمية والعالمية** إلى جانب
    النماذج الأساسية. عندما يطابق ملف تعريف نموذجًا أساسيًا معروفًا، يرث
    ملف التعريف قدرات ذلك النموذج (نافذة السياق، والحد الأقصى للرموز،
    والاستدلال، والرؤية) وتُحقن منطقة طلب Bedrock الصحيحة
    تلقائيًا. يعني هذا أن ملفات تعريف Claude عبر المناطق تعمل دون
    تجاوزات يدوية للموفر.

    تبدو معرفات ملفات تعريف الاستدلال مثل `us.anthropic.claude-opus-4-6-v1:0` (إقليمية)
    أو `anthropic.claude-opus-4-6-v1:0` (عالمية). إذا كان النموذج الداعم موجودًا بالفعل
    في نتائج الاكتشاف، يرث ملف التعريف مجموعة قدراته الكاملة؛
    وإلا فتُطبق الافتراضات الآمنة.

    لا يلزم تكوين إضافي. طالما أن الاكتشاف مفعّل ولدى مبدأ IAM
    الإذن `bedrock:ListInferenceProfiles`، تظهر ملفات التعريف إلى جانب
    النماذج الأساسية في `openclaw models list`.

  </Accordion>

  <Accordion title="درجة حرارة Claude Opus 4.7">
    يرفض Bedrock معامل `temperature` لـ Claude Opus 4.7. يحذف OpenClaw
    `temperature` تلقائيًا لأي مرجع Bedrock خاص بـ Opus 4.7، بما في ذلك
    معرفات النماذج الأساسية، وملفات تعريف الاستدلال المسماة، وملفات تعريف الاستدلال
    الخاصة بالتطبيقات التي يُحل نموذجها الأساسي إلى Opus 4.7 عبر
    `bedrock:GetInferenceProfile`، ومتغيرات `opus-4.7` المنقطة مع
    بادئات مناطق اختيارية (`us.`، `eu.`، `ap.`، `apac.`، `au.`، `jp.`،
    `global.`). لا يلزم مفتاح تكوين، وينطبق الحذف على كل من
    كائن خيارات الطلب وحقل حمولة `inferenceConfig`.
  </Accordion>

  <Accordion title="الحواجز الوقائية">
    يمكنك تطبيق [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    على جميع استدعاءات نماذج Bedrock عن طريق إضافة كائن `guardrail` إلى
    تكوين Plugin `amazon-bedrock`. تتيح لك الحواجز الوقائية فرض تصفية المحتوى،
    ورفض الموضوعات، ومرشحات الكلمات، ومرشحات المعلومات الحساسة، وفحوصات
    التأصيل السياقي.

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
    | `guardrailIdentifier` | نعم | معرّف الحاجز الوقائي (مثل `abc123`) أو ARN كامل (مثل `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | نعم | رقم الإصدار المنشور، أو `"DRAFT"` لمسودة العمل. |
    | `streamProcessingMode` | لا | `"sync"` أو `"async"` لتقييم الحاجز الوقائي أثناء البث. إذا حُذف، يستخدم Bedrock قيمته الافتراضية. |
    | `trace` | لا | `"enabled"` أو `"enabled_full"` لتصحيح الأخطاء؛ احذفه أو عيّنه إلى `"disabled"` للإنتاج. |

    <Warning>
    يجب أن يمتلك مبدأ IAM الذي يستخدمه Gateway الإذن `bedrock:ApplyGuardrail` بالإضافة إلى أذونات الاستدعاء القياسية.
    </Warning>

  </Accordion>

  <Accordion title="التضمينات للبحث في الذاكرة">
    يمكن لـ Bedrock أيضًا أن يعمل كموفّر التضمينات لـ
    [البحث في الذاكرة](/ar/concepts/memory-search). يُضبط هذا بشكل منفصل عن
    موفّر الاستدلال -- عيّن `agents.defaults.memorySearch.provider` إلى `"bedrock"`:

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

    تستخدم تضمينات Bedrock سلسلة بيانات اعتماد AWS SDK نفسها المستخدمة في الاستدلال (أدوار المثيلات،
    وSSO، ومفاتيح الوصول، والتكوين المشترك، وهوية الويب). لا حاجة إلى مفتاح API.
    عندما يكون `provider` هو `"auto"`، يُكتشف Bedrock تلقائيًا إذا
    تم حل سلسلة بيانات الاعتماد هذه بنجاح.

    تشمل نماذج التضمين المدعومة Amazon Titan Embed (v1، v2)، وAmazon Nova
    Embed، وCohere Embed (v3، v4)، وTwelveLabs Marengo. راجع
    [مرجع تكوين الذاكرة -- Bedrock](/ar/reference/memory-config#bedrock-embedding-config)
    للحصول على قائمة النماذج الكاملة وخيارات الأبعاد.

  </Accordion>

  <Accordion title="ملاحظات وتنبيهات">
    - يتطلب Bedrock تفعيل **الوصول إلى النموذج** في حساب/منطقة AWS لديك.
    - يحتاج الاكتشاف التلقائي إلى صلاحيتي `bedrock:ListFoundationModels` و
      `bedrock:ListInferenceProfiles`.
    - إذا كنت تعتمد على الوضع التلقائي، فعيّن إحدى علامات بيئة مصادقة AWS المدعومة على
      مضيف gateway. إذا كنت تفضّل مصادقة IMDS/التكوين المشترك بدون علامات بيئة، فعيّن
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - يعرض OpenClaw مصدر بيانات الاعتماد بهذا الترتيب: `AWS_BEARER_TOKEN_BEDROCK`،
      ثم `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`، ثم `AWS_PROFILE`، ثم سلسلة
      AWS SDK الافتراضية.
    - يعتمد دعم الاستدلال على النموذج؛ راجع بطاقة نموذج Bedrock لمعرفة
      الإمكانات الحالية.
    - إذا كنت تفضّل تدفق مفاتيح مُدارًا، يمكنك أيضًا وضع وكيل متوافق مع OpenAI
      أمام Bedrock وتكوينه كموفّر OpenAI بدلًا من ذلك.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="البحث في الذاكرة" href="/ar/concepts/memory-search" icon="magnifying-glass">
    تضمينات Bedrock لتكوين البحث في الذاكرة.
  </Card>
  <Card title="مرجع تكوين الذاكرة" href="/ar/reference/memory-config#bedrock-embedding-config" icon="database">
    قائمة نماذج تضمين Bedrock الكاملة وخيارات الأبعاد.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها العام والأسئلة الشائعة.
  </Card>
</CardGroup>
