---
read_when:
    - می‌خواهید از مدل‌های Amazon Bedrock با OpenClaw استفاده کنید
    - برای فراخوانی‌های مدل، باید اعتبارنامه و ناحیهٔ AWS را تنظیم کرده باشید
summary: استفاده از مدل‌های Amazon Bedrock (Converse API) با OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-29T23:23:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw می‌تواند از مدل‌های **Amazon Bedrock** از طریق ارائه‌دهندهٔ جریانی **Bedrock Converse**
در pi-ai استفاده کند. احراز هویت Bedrock از **زنجیرهٔ پیش‌فرض اعتبارنامهٔ AWS SDK**
استفاده می‌کند، نه کلید API.

| ویژگی | مقدار                                                       |
| -------- | ----------------------------------------------------------- |
| ارائه‌دهنده | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| احراز هویت     | اعتبارنامه‌های AWS (متغیرهای محیطی، پیکربندی مشترک، یا نقش نمونه) |
| منطقه   | `AWS_REGION` یا `AWS_DEFAULT_REGION` (پیش‌فرض: `us-east-1`) |

## شروع به کار

روش احراز هویت دلخواهتان را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلیدهای دسترسی / متغیرهای محیطی">
    **بهترین گزینه برای:** ماشین‌های توسعه‌دهنده، CI، یا میزبان‌هایی که اعتبارنامه‌های AWS را مستقیماً مدیریت می‌کنید.

    <Steps>
      <Step title="تنظیم اعتبارنامه‌های AWS روی میزبان Gateway">
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
      <Step title="افزودن ارائه‌دهنده و مدل Bedrock به پیکربندی">
        هیچ `apiKey` لازم نیست. ارائه‌دهنده را با `auth: "aws-sdk"` پیکربندی کنید:

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
      <Step title="بررسی در دسترس بودن مدل‌ها">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    با احراز هویت مبتنی بر نشانگر محیطی (`AWS_ACCESS_KEY_ID`، `AWS_PROFILE`، یا `AWS_BEARER_TOKEN_BEDROCK`)، OpenClaw ارائه‌دهندهٔ ضمنی Bedrock را برای کشف مدل بدون پیکربندی اضافی به‌صورت خودکار فعال می‌کند.
    </Tip>

  </Tab>

  <Tab title="نقش‌های نمونهٔ EC2 (IMDS)">
    **بهترین گزینه برای:** نمونه‌های EC2 که یک نقش IAM به آن‌ها متصل است و از سرویس فرادادهٔ نمونه برای احراز هویت استفاده می‌کنند.

    <Steps>
      <Step title="فعال‌سازی صریح کشف">
        هنگام استفاده از IMDS، OpenClaw نمی‌تواند احراز هویت AWS را فقط از نشانگرهای محیطی تشخیص دهد، بنابراین باید صریحاً انتخاب کنید:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="افزودن اختیاری نشانگر محیطی برای حالت خودکار">
        اگر می‌خواهید مسیر تشخیص خودکار نشانگر محیطی هم کار کند (برای نمونه، برای سطوح `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        به کلید API جعلی نیاز **ندارید**.
      </Step>
      <Step title="بررسی کشف شدن مدل‌ها">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    نقش IAM متصل به نمونهٔ EC2 شما باید مجوزهای زیر را داشته باشد:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (برای کشف خودکار)
    - `bedrock:ListInferenceProfiles` (برای کشف پروفایل استنتاج)

    یا سیاست مدیریت‌شدهٔ `AmazonBedrockFullAccess` را متصل کنید.
    </Warning>

    <Note>
    فقط زمانی به `AWS_PROFILE=default` نیاز دارید که مشخصاً یک نشانگر محیطی برای حالت خودکار یا سطوح وضعیت بخواهید. مسیر واقعی احراز هویت زمان اجرای Bedrock از زنجیرهٔ پیش‌فرض AWS SDK استفاده می‌کند، بنابراین احراز هویت نقش نمونهٔ IMDS حتی بدون نشانگرهای محیطی هم کار می‌کند.
    </Note>

  </Tab>
</Tabs>

## کشف خودکار مدل

OpenClaw می‌تواند مدل‌های Bedrock را که از **جریان‌دهی**
و **خروجی متنی** پشتیبانی می‌کنند، به‌صورت خودکار کشف کند. کشف از `bedrock:ListFoundationModels` و
`bedrock:ListInferenceProfiles` استفاده می‌کند و نتایج کش می‌شوند (پیش‌فرض: ۱ ساعت).

نحوهٔ فعال شدن ارائه‌دهندهٔ ضمنی:

- اگر `plugins.entries.amazon-bedrock.config.discovery.enabled` برابر `true` باشد،
  OpenClaw حتی وقتی هیچ نشانگر محیطی AWS وجود نداشته باشد، کشف را امتحان می‌کند.
- اگر `plugins.entries.amazon-bedrock.config.discovery.enabled` تنظیم نشده باشد،
  OpenClaw فقط زمانی ارائه‌دهندهٔ ضمنی Bedrock را به‌صورت خودکار اضافه می‌کند
  که یکی از این نشانگرهای احراز هویت AWS را ببیند:
  `AWS_BEARER_TOKEN_BEDROCK`، `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`، یا `AWS_PROFILE`.
- مسیر واقعی احراز هویت زمان اجرای Bedrock همچنان از زنجیرهٔ پیش‌فرض AWS SDK استفاده می‌کند، بنابراین
  پیکربندی مشترک، SSO، و احراز هویت نقش نمونهٔ IMDS می‌توانند حتی وقتی کشف برای انتخاب نیازمند
  `enabled: true` بوده است هم کار کنند.

<Note>
برای ورودی‌های صریح `models.providers["amazon-bedrock"]`، OpenClaw همچنان می‌تواند احراز هویت نشانگر محیطی Bedrock را زودهنگام از نشانگرهای محیطی AWS مانند `AWS_BEARER_TOKEN_BEDROCK` بدون اجبار به بارگذاری کامل احراز هویت زمان اجرا حل کند. مسیر واقعی احراز هویت فراخوانی مدل همچنان از زنجیرهٔ پیش‌فرض AWS SDK استفاده می‌کند.
</Note>

<AccordionGroup>
  <Accordion title="گزینه‌های پیکربندی کشف">
    گزینه‌های پیکربندی زیر `plugins.entries.amazon-bedrock.config.discovery` قرار دارند:

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

    | گزینه | پیش‌فرض | توضیح |
    | ------ | ------- | ----------- |
    | `enabled` | خودکار | در حالت خودکار، OpenClaw فقط وقتی ارائه‌دهندهٔ ضمنی Bedrock را فعال می‌کند که یک نشانگر محیطی AWS پشتیبانی‌شده را ببیند. برای اجبار کشف، روی `true` تنظیم کنید. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | منطقهٔ AWS مورد استفاده برای فراخوانی‌های API کشف. |
    | `providerFilter` | (همه) | با نام‌های ارائه‌دهندهٔ Bedrock مطابقت می‌دهد (برای نمونه `anthropic`، `amazon`). |
    | `refreshInterval` | `3600` | مدت کش بر حسب ثانیه. برای غیرفعال کردن کش، روی `0` تنظیم کنید. |
    | `defaultContextWindow` | `32000` | پنجرهٔ زمینهٔ مورد استفاده برای مدل‌های کشف‌شده (اگر محدودیت‌های مدل خود را می‌دانید، بازنویسی کنید). |
    | `defaultMaxTokens` | `4096` | حداکثر توکن‌های خروجی مورد استفاده برای مدل‌های کشف‌شده (اگر محدودیت‌های مدل خود را می‌دانید، بازنویسی کنید). |

  </Accordion>
</AccordionGroup>

## راه‌اندازی سریع (مسیر AWS)

این راهنما یک نقش IAM ایجاد می‌کند، مجوزهای Bedrock را متصل می‌کند، پروفایل نمونه را مرتبط می‌کند
و کشف OpenClaw را روی میزبان EC2 فعال می‌کند.

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

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="پروفایل‌های استنتاج">
    OpenClaw **پروفایل‌های استنتاج منطقه‌ای و سراسری** را در کنار
    مدل‌های پایه کشف می‌کند. وقتی یک پروفایل به یک مدل پایهٔ شناخته‌شده نگاشت شود، آن
    پروفایل قابلیت‌های آن مدل (پنجرهٔ زمینه، حداکثر توکن‌ها،
    استدلال، بینایی) را به ارث می‌برد و منطقهٔ درست درخواست Bedrock به‌صورت
    خودکار تزریق می‌شود. این یعنی پروفایل‌های Claude میان‌منطقه‌ای بدون بازنویسی دستی
    ارائه‌دهنده کار می‌کنند.

    شناسه‌های پروفایل استنتاج شبیه `us.anthropic.claude-opus-4-6-v1:0` (منطقه‌ای)
    یا `anthropic.claude-opus-4-6-v1:0` (سراسری) هستند. اگر مدل پشتیبان از قبل
    در نتایج کشف باشد، پروفایل مجموعهٔ کامل قابلیت‌های آن را به ارث می‌برد؛
    در غیر این صورت پیش‌فرض‌های امن اعمال می‌شوند.

    هیچ پیکربندی اضافی لازم نیست. تا زمانی که کشف فعال باشد و اصل IAM
    دارای `bedrock:ListInferenceProfiles` باشد، پروفایل‌ها در کنار
    مدل‌های پایه در `openclaw models list` ظاهر می‌شوند.

  </Accordion>

  <Accordion title="دمای Claude Opus 4.7">
    Bedrock پارامتر `temperature` را برای Claude Opus 4.7 رد می‌کند. OpenClaw
    به‌صورت خودکار `temperature` را برای هر ارجاع Bedrock به Opus 4.7 حذف می‌کند، از جمله
    شناسه‌های مدل پایه، پروفایل‌های استنتاج نام‌گذاری‌شده، پروفایل‌های استنتاج برنامه
    که مدل زیربنایی‌شان از طریق `bedrock:GetInferenceProfile` به Opus 4.7
    حل می‌شود، و گونه‌های نقطه‌دار `opus-4.7` با پیشوندهای منطقه‌ای
    اختیاری (`us.`، `eu.`، `ap.`، `apac.`، `au.`، `jp.`،
    `global.`). هیچ گزینهٔ پیکربندی لازم نیست، و این حذف هم روی
    شیء گزینه‌های درخواست و هم روی فیلد بار `inferenceConfig` اعمال می‌شود.
  </Accordion>

  <Accordion title="گاردریل‌ها">
    می‌توانید [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    را با افزودن یک شیء `guardrail` به پیکربندی Plugin
    `amazon-bedrock` روی همهٔ فراخوانی‌های مدل Bedrock اعمال کنید. گاردریل‌ها به شما امکان می‌دهند فیلتر کردن محتوا،
    رد موضوعات، فیلترهای واژه، فیلترهای اطلاعات حساس، و بررسی‌های زمینه‌سازی
    متنی را اعمال کنید.

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

    | گزینه | الزامی | توضیح |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | بله | شناسهٔ گاردریل (مثلاً `abc123`) یا ARN کامل (مثلاً `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | بله | شمارهٔ نسخهٔ منتشرشده، یا `"DRAFT"` برای پیش‌نویس کاری. |
    | `streamProcessingMode` | خیر | `"sync"` یا `"async"` برای ارزیابی گاردریل هنگام جریان‌دهی. اگر حذف شود، Bedrock از پیش‌فرض خود استفاده می‌کند. |
    | `trace` | خیر | `"enabled"` یا `"enabled_full"` برای اشکال‌زدایی؛ برای تولید حذف کنید یا روی `"disabled"` تنظیم کنید. |

    <Warning>
    اصل IAM مورد استفادهٔ Gateway باید علاوه بر مجوزهای استاندارد فراخوانی، مجوز `bedrock:ApplyGuardrail` را داشته باشد.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock همچنین می‌تواند به‌عنوان ارائه‌دهندهٔ embedding برای
    [جست‌وجوی حافظه](/fa/concepts/memory-search) عمل کند. این جدا از ارائه‌دهندهٔ
    استنتاج پیکربندی می‌شود -- `agents.defaults.memorySearch.provider` را روی `"bedrock"` تنظیم کنید:

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

    embeddingهای Bedrock از همان زنجیرهٔ اعتبارنامهٔ AWS SDK مانند استنتاج استفاده می‌کنند (نقش‌های instance،
    SSO، کلیدهای دسترسی، پیکربندی مشترک، و web identity). هیچ کلید API
    لازم نیست. وقتی `provider` برابر `"auto"` باشد، اگر آن
    زنجیرهٔ اعتبارنامه با موفقیت resolve شود، Bedrock به‌صورت خودکار شناسایی می‌شود.

    مدل‌های embedding پشتیبانی‌شده شامل Amazon Titan Embed (v1, v2)، Amazon Nova
    Embed، Cohere Embed (v3, v4)، و TwelveLabs Marengo هستند. برای
    فهرست کامل مدل‌ها و گزینه‌های ابعاد، به
    [مرجع پیکربندی حافظه -- Bedrock](/fa/reference/memory-config#bedrock-embedding-config)
    مراجعه کنید.

  </Accordion>

  <Accordion title="Notes and caveats">
    - Bedrock نیاز دارد **دسترسی به مدل** در حساب/ناحیهٔ AWS شما فعال باشد.
    - کشف خودکار به مجوزهای `bedrock:ListFoundationModels` و
      `bedrock:ListInferenceProfiles` نیاز دارد.
    - اگر به حالت خودکار متکی هستید، یکی از نشانگرهای env احراز هویت AWS پشتیبانی‌شده را روی
      میزبان gateway تنظیم کنید. اگر احراز هویت IMDS/shared-config بدون نشانگرهای env را ترجیح می‌دهید، مقدار
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` را تنظیم کنید.
    - OpenClaw منبع اعتبارنامه را به این ترتیب نمایش می‌دهد: `AWS_BEARER_TOKEN_BEDROCK`,
      سپس `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`، سپس `AWS_PROFILE`، سپس
      زنجیرهٔ پیش‌فرض AWS SDK.
    - پشتیبانی از reasoning به مدل بستگی دارد؛ برای قابلیت‌های فعلی، کارت مدل Bedrock را بررسی کنید.
    - اگر یک جریان کلید مدیریت‌شده را ترجیح می‌دهید، همچنین می‌توانید یک پراکسی سازگار با OpenAI
      را جلوی Bedrock قرار دهید و به‌جای آن به‌عنوان یک ارائه‌دهندهٔ OpenAI پیکربندی کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Memory search" href="/fa/concepts/memory-search" icon="magnifying-glass">
    embeddingهای Bedrock برای پیکربندی جست‌وجوی حافظه.
  </Card>
  <Card title="Memory config reference" href="/fa/reference/memory-config#bedrock-embedding-config" icon="database">
    فهرست کامل مدل‌های embedding Bedrock و گزینه‌های ابعاد.
  </Card>
  <Card title="Troubleshooting" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
