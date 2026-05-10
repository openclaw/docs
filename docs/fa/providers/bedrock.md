---
read_when:
    - می‌خواهید از مدل‌های Amazon Bedrock با OpenClaw استفاده کنید
    - برای فراخوانی‌های مدل به پیکربندی اعتبارنامه‌ها و منطقهٔ AWS نیاز دارید
summary: از مدل‌های Amazon Bedrock (Converse API) با OpenClaw استفاده کنید
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-05-10T20:02:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb5a131a11b98dca68746cd6dfef8f36f1fdcbfbb985730176b334083574dc89
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw می‌تواند از مدل‌های **Amazon Bedrock** از طریق ارائه‌دهندهٔ جریانی **Bedrock Converse**
در pi-ai استفاده کند. احراز هویت Bedrock از **زنجیرهٔ پیش‌فرض اعتبارنامه AWS SDK**
استفاده می‌کند، نه کلید API.

| ویژگی | مقدار                                                       |
| -------- | ----------------------------------------------------------- |
| ارائه‌دهنده | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| احراز هویت     | اعتبارنامه‌های AWS (متغیرهای محیطی، پیکربندی مشترک، یا نقش نمونه) |
| ناحیه   | `AWS_REGION` یا `AWS_DEFAULT_REGION` (پیش‌فرض: `us-east-1`) |

## شروع به کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="Access keys / env vars">
    **بهترین گزینه برای:** ماشین‌های توسعه‌دهنده، CI، یا میزبان‌هایی که در آن‌ها اعتبارنامه‌های AWS را مستقیماً مدیریت می‌کنید.

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
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
      <Step title="Add a Bedrock provider and model to your config">
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
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    با احراز هویت مبتنی بر نشانگر محیط (`AWS_ACCESS_KEY_ID`، `AWS_PROFILE`، یا `AWS_BEARER_TOKEN_BEDROCK`)، OpenClaw ارائه‌دهندهٔ ضمنی Bedrock را برای کشف مدل بدون پیکربندی اضافی به‌صورت خودکار فعال می‌کند.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **بهترین گزینه برای:** نمونه‌های EC2 که یک نقش IAM به آن‌ها متصل است و از سرویس فرادادهٔ نمونه برای احراز هویت استفاده می‌کنند.

    <Steps>
      <Step title="Enable discovery explicitly">
        هنگام استفاده از IMDS، OpenClaw نمی‌تواند احراز هویت AWS را فقط از نشانگرهای محیط تشخیص دهد، بنابراین باید صراحتاً آن را فعال کنید:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        اگر می‌خواهید مسیر تشخیص خودکار نشانگر محیط نیز کار کند (برای مثال، برای سطوح `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        به کلید API جعلی نیاز **ندارید**.
      </Step>
      <Step title="Verify models are discovered">
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
    - `bedrock:ListInferenceProfiles` (برای کشف نمایهٔ استنتاج)

    یا سیاست مدیریت‌شدهٔ `AmazonBedrockFullAccess` را متصل کنید.
    </Warning>

    <Note>
    فقط زمانی به `AWS_PROFILE=default` نیاز دارید که مشخصاً یک نشانگر محیط برای حالت خودکار یا سطوح وضعیت بخواهید. مسیر واقعی احراز هویت زمان اجرای Bedrock از زنجیرهٔ پیش‌فرض AWS SDK استفاده می‌کند، بنابراین احراز هویت نقش نمونهٔ IMDS حتی بدون نشانگرهای محیط نیز کار می‌کند.
    </Note>

  </Tab>
</Tabs>

## کشف خودکار مدل

OpenClaw می‌تواند مدل‌های Bedrock را که از **جریان‌دهی**
و **خروجی متنی** پشتیبانی می‌کنند، به‌صورت خودکار کشف کند. کشف از `bedrock:ListFoundationModels` و
`bedrock:ListInferenceProfiles` استفاده می‌کند، و نتایج در کش ذخیره می‌شوند (پیش‌فرض: ۱ ساعت).

نحوه فعال شدن ارائه‌دهنده ضمنی:

- اگر `plugins.entries.amazon-bedrock.config.discovery.enabled` برابر `true` باشد،
  OpenClaw حتی وقتی هیچ نشانگر محیطی AWS وجود نداشته باشد، کشف را امتحان می‌کند.
- اگر `plugins.entries.amazon-bedrock.config.discovery.enabled` تنظیم نشده باشد،
  OpenClaw فقط زمانی ارائه‌دهنده ضمنی Bedrock را به‌صورت خودکار اضافه می‌کند
  که یکی از این نشانگرهای احراز هویت AWS را ببیند:
  `AWS_BEARER_TOKEN_BEDROCK`، `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`، یا `AWS_PROFILE`.
- مسیر واقعی احراز هویت زمان اجرای Bedrock همچنان از زنجیره پیش‌فرض AWS SDK استفاده می‌کند، بنابراین
  پیکربندی مشترک، SSO، و احراز هویت نقش نمونه IMDS می‌توانند کار کنند حتی وقتی کشف
  برای اعلام موافقت به `enabled: true` نیاز داشته باشد.

<Note>
برای ورودی‌های صریح `models.providers["amazon-bedrock"]`، OpenClaw همچنان می‌تواند احراز هویت نشانگر محیطی Bedrock را زودهنگام از نشانگرهای محیطی AWS مانند `AWS_BEARER_TOKEN_BEDROCK` حل کند، بدون اینکه بارگذاری کامل احراز هویت زمان اجرا را اجباری کند. مسیر واقعی احراز هویت فراخوانی مدل همچنان از زنجیره پیش‌فرض AWS SDK استفاده می‌کند.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
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
    | `enabled` | خودکار | در حالت خودکار، OpenClaw فقط زمانی ارائه‌دهنده ضمنی Bedrock را فعال می‌کند که یک نشانگر محیطی AWS پشتیبانی‌شده را ببیند. برای اجبار کشف، آن را روی `true` تنظیم کنید. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | منطقه AWS که برای فراخوانی‌های API کشف استفاده می‌شود. |
    | `providerFilter` | (همه) | با نام‌های ارائه‌دهنده Bedrock مطابقت می‌دهد (برای مثال `anthropic`، `amazon`). |
    | `refreshInterval` | `3600` | مدت زمان کش در ثانیه. برای غیرفعال کردن کش، روی `0` تنظیم کنید. |
    | `defaultContextWindow` | `32000` | پنجره زمینه مورد استفاده برای مدل‌های کشف‌شده (اگر محدودیت‌های مدل خود را می‌دانید، بازنویسی کنید). |
    | `defaultMaxTokens` | `4096` | حداکثر توکن‌های خروجی مورد استفاده برای مدل‌های کشف‌شده (اگر محدودیت‌های مدل خود را می‌دانید، بازنویسی کنید). |

  </Accordion>
</AccordionGroup>

## راه‌اندازی سریع (مسیر AWS)

این راهنما یک نقش IAM ایجاد می‌کند، مجوزهای Bedrock را پیوست می‌کند، نمایه نمونه را مرتبط می‌کند
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
    مدل‌های پایه کشف می‌کند. وقتی یک پروفایل به یک مدل پایهٔ شناخته‌شده نگاشت می‌شود،
    پروفایل قابلیت‌های آن مدل را به ارث می‌برد (پنجرهٔ زمینه، حداکثر توکن‌ها،
    استدلال، بینایی) و منطقهٔ درست درخواست Bedrock به‌صورت
    خودکار تزریق می‌شود. این یعنی پروفایل‌های Claude بین‌منطقه‌ای بدون
    بازنویسی‌های دستی ارائه‌دهنده کار می‌کنند.

    شناسه‌های پروفایل استنتاج شبیه `us.anthropic.claude-opus-4-6-v1:0` (منطقه‌ای)
    یا `anthropic.claude-opus-4-6-v1:0` (سراسری) هستند. اگر مدل پشتیبان از قبل
    در نتایج کشف باشد، پروفایل مجموعهٔ کامل قابلیت‌های آن را به ارث می‌برد؛
    در غیر این صورت پیش‌فرض‌های ایمن اعمال می‌شوند.

    پیکربندی اضافه‌ای لازم نیست. تا وقتی کشف فعال باشد و اصل IAM
    مجوز `bedrock:ListInferenceProfiles` را داشته باشد، پروفایل‌ها در کنار
    مدل‌های پایه در `openclaw models list` ظاهر می‌شوند.

  </Accordion>

  <Accordion title="سطح سرویس">
    برخی مدل‌های Bedrock از پارامتر `service_tier` برای بهینه‌سازی هزینه
    یا تأخیر پشتیبانی می‌کنند. سطح‌های زیر در دسترس هستند:

    | سطح | توضیح |
    |------|-------------|
    | `default` | سطح استاندارد Bedrock |
    | `flex` | پردازش تخفیف‌دار برای بارهای کاری‌ای که می‌توانند تأخیر بیشتر را تحمل کنند |
    | `priority` | پردازش اولویت‌دار برای بارهای کاری حساس به تأخیر |
    | `reserved` | ظرفیت رزروشده برای بارهای کاری پایدار |

    مقدار `serviceTier` (یا `service_tier`) را از طریق `agents.defaults.params` برای
    درخواست‌های مدل Bedrock، یا برای هر مدل در
    `agents.defaults.models["<model-key>"].params` تنظیم کنید:

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

    مقادیر معتبر `default`، `flex`، `priority` و `reserved` هستند. همهٔ
    مدل‌ها از همهٔ سطح‌ها پشتیبانی نمی‌کنند — اگر سطحی پشتیبانی‌نشده درخواست شود، Bedrock
    یک خطای اعتبارسنجی برمی‌گرداند. توجه: پیام خطا تا حدی گمراه‌کننده است؛
    ممکن است به‌جای اشاره به سطح سرویس پشتیبانی‌نشده، بگوید «The provided model identifier is invalid».
    اگر این خطا را دیدید، بررسی کنید که آیا مدل از سطح درخواستی
    پشتیبانی می‌کند یا نه.

  </Accordion>

  <Accordion title="temperature در Claude Opus 4.7">
    Bedrock پارامتر `temperature` را برای Claude Opus 4.7 رد می‌کند. OpenClaw
    برای هر ارجاع Bedrock مربوط به Opus 4.7، شامل
    شناسه‌های مدل پایه، پروفایل‌های استنتاج نام‌دار، پروفایل‌های استنتاج برنامه
    که مدل زیربنایی آن‌ها از طریق `bedrock:GetInferenceProfile` به Opus 4.7
    resolve می‌شود، و گونه‌های نقطه‌دار `opus-4.7` با
    پیشوندهای منطقه‌ای اختیاری (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`)، به‌صورت خودکار `temperature` را حذف می‌کند. هیچ گزینهٔ پیکربندی‌ای لازم نیست،
    و این حذف هم روی شیء گزینه‌های درخواست و هم روی فیلد payload به نام `inferenceConfig` اعمال می‌شود.
  </Accordion>

  <Accordion title="Guardrails">
    می‌توانید [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    را با افزودن یک شیء `guardrail` به پیکربندی Plugin
    `amazon-bedrock` روی همه فراخوانی‌های مدل Bedrock اعمال کنید. گاردریل‌ها به شما امکان می‌دهند پالایش محتوا،
    رد موضوعات، فیلترهای واژه، فیلترهای اطلاعات حساس، و بررسی‌های زمینه‌سازی متنی را اعمال کنید.

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
    | `guardrailIdentifier` | بله | شناسه گاردریل (مانند `abc123`) یا ARN کامل (مانند `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | بله | شماره نسخه منتشرشده، یا `"DRAFT"` برای پیش‌نویس در حال کار. |
    | `streamProcessingMode` | خیر | `"sync"` یا `"async"` برای ارزیابی گاردریل هنگام استریم. اگر حذف شود، Bedrock از مقدار پیش‌فرض خود استفاده می‌کند. |
    | `trace` | خیر | `"enabled"` یا `"enabled_full"` برای اشکال‌زدایی؛ برای محیط عملیاتی حذف کنید یا روی `"disabled"` تنظیم کنید. |

    <Warning>
    اصل IAM استفاده‌شده توسط Gateway باید علاوه بر مجوزهای استاندارد فراخوانی، مجوز `bedrock:ApplyGuardrail` را هم داشته باشد.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock همچنین می‌تواند به‌عنوان ارائه‌دهنده امبدینگ برای
    [جست‌وجوی حافظه](/fa/concepts/memory-search) عمل کند. این مورد جدا از ارائه‌دهنده
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

    امبدینگ‌های Bedrock از همان زنجیره اعتبارنامه AWS SDK استفاده می‌کنند که استنتاج استفاده می‌کند (نقش‌های نمونه،
    SSO، کلیدهای دسترسی، پیکربندی مشترک، و هویت وب). هیچ کلید API لازم نیست.
    وقتی `provider` برابر `"auto"` باشد، اگر آن زنجیره اعتبارنامه با موفقیت حل شود،
    Bedrock به‌صورت خودکار شناسایی می‌شود.

    مدل‌های امبدینگ پشتیبانی‌شده شامل Amazon Titan Embed (v1، v2)، Amazon Nova
    Embed، Cohere Embed (v3، v4)، و TwelveLabs Marengo هستند. برای فهرست کامل مدل‌ها و گزینه‌های ابعاد، به
    [مرجع پیکربندی حافظه -- Bedrock](/fa/reference/memory-config#bedrock-embedding-config)
    مراجعه کنید.

  </Accordion>

  <Accordion title="Notes and caveats">
    - Bedrock نیاز دارد **دسترسی به مدل** در حساب/منطقه AWS شما فعال باشد.
    - کشف خودکار به مجوزهای `bedrock:ListFoundationModels` و
      `bedrock:ListInferenceProfiles` نیاز دارد.
    - اگر به حالت خودکار تکیه می‌کنید، یکی از نشانگرهای env احراز هویت AWS پشتیبانی‌شده را روی
      میزبان Gateway تنظیم کنید. اگر احراز هویت IMDS/پیکربندی مشترک را بدون نشانگرهای env ترجیح می‌دهید،
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` را تنظیم کنید.
    - OpenClaw منبع اعتبارنامه را به این ترتیب نمایش می‌دهد: `AWS_BEARER_TOKEN_BEDROCK`,
      سپس `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`، سپس `AWS_PROFILE`، سپس زنجیره
      پیش‌فرض AWS SDK.
    - پشتیبانی از استدلال به مدل بستگی دارد؛ کارت مدل Bedrock را برای
      قابلیت‌های فعلی بررسی کنید.
    - اگر جریان کلید مدیریت‌شده را ترجیح می‌دهید، همچنین می‌توانید یک پروکسی سازگار با OpenAI
      را جلوی Bedrock قرار دهید و آن را در عوض به‌عنوان ارائه‌دهنده OpenAI پیکربندی کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Memory search" href="/fa/concepts/memory-search" icon="magnifying-glass">
    امبدینگ‌های Bedrock برای پیکربندی جست‌وجوی حافظه.
  </Card>
  <Card title="Memory config reference" href="/fa/reference/memory-config#bedrock-embedding-config" icon="database">
    فهرست کامل مدل‌های امبدینگ Bedrock و گزینه‌های ابعاد.
  </Card>
  <Card title="Troubleshooting" href="/fa/help/troubleshooting" icon="wrench">
    اشکال‌زدایی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
