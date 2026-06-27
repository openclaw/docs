---
read_when:
    - می‌خواهید از مدل‌های Amazon Bedrock با OpenClaw استفاده کنید
    - برای فراخوانی مدل‌ها به تنظیم اعتبارنامه‌ها/منطقهٔ AWS نیاز دارید
summary: از مدل‌های Amazon Bedrock (Converse API) با OpenClaw استفاده کنید
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:37:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw می‌تواند از مدل‌های **Amazon Bedrock** از طریق ارائه‌دهنده پخش جریانی **Bedrock Converse**
استفاده کند. احراز هویت Bedrock از **زنجیره اعتبارنامه پیش‌فرض AWS SDK** استفاده می‌کند،
نه از کلید API.

| ویژگی | مقدار                                                       |
| -------- | ----------------------------------------------------------- |
| ارائه‌دهنده | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| احراز هویت     | اعتبارنامه‌های AWS (متغیرهای محیطی، پیکربندی مشترک، یا نقش نمونه) |
| منطقه   | `AWS_REGION` یا `AWS_DEFAULT_REGION` (پیش‌فرض: `us-east-1`) |

## شروع به کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="Access keys / env vars">
    **بهترین گزینه برای:** ماشین‌های توسعه‌دهنده، CI، یا میزبان‌هایی که در آن‌ها اعتبارنامه‌های AWS را مستقیماً مدیریت می‌کنید.

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
    با احراز هویت مبتنی بر نشانگر محیطی (`AWS_ACCESS_KEY_ID`، `AWS_PROFILE`، یا `AWS_BEARER_TOKEN_BEDROCK`)، OpenClaw ارائه‌دهنده ضمنی Bedrock را برای کشف مدل بدون پیکربندی اضافی به‌صورت خودکار فعال می‌کند.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **بهترین گزینه برای:** نمونه‌های EC2 که یک نقش IAM به آن‌ها متصل است و برای احراز هویت از سرویس فراداده نمونه استفاده می‌کنند.

    <Steps>
      <Step title="Enable discovery explicitly">
        هنگام استفاده از IMDS، OpenClaw نمی‌تواند احراز هویت AWS را فقط از نشانگرهای محیطی تشخیص دهد، بنابراین باید صریحاً آن را فعال کنید:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        اگر می‌خواهید مسیر تشخیص خودکار نشانگر محیطی هم کار کند (برای مثال، برای سطوح `openclaw status`):

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
    نقش IAM متصل به نمونه EC2 شما باید مجوزهای زیر را داشته باشد:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (برای کشف خودکار)
    - `bedrock:ListInferenceProfiles` (برای کشف پروفایل استنتاج)

    یا خط‌مشی مدیریت‌شده `AmazonBedrockFullAccess` را متصل کنید.
    </Warning>

    <Note>
    فقط زمانی به `AWS_PROFILE=default` نیاز دارید که مشخصاً یک نشانگر محیطی برای حالت خودکار یا سطوح وضعیت بخواهید. مسیر واقعی احراز هویت زمان اجرای Bedrock از زنجیره پیش‌فرض AWS SDK استفاده می‌کند، بنابراین احراز هویت نقش نمونه IMDS حتی بدون نشانگرهای محیطی هم کار می‌کند.
    </Note>

  </Tab>
</Tabs>

## کشف خودکار مدل

OpenClaw می‌تواند مدل‌های Bedrock را که از **پخش جریانی**
و **خروجی متنی** پشتیبانی می‌کنند به‌صورت خودکار کشف کند. کشف از `bedrock:ListFoundationModels` و
`bedrock:ListInferenceProfiles` استفاده می‌کند، و نتایج در کش ذخیره می‌شوند (پیش‌فرض: ۱ ساعت).

نحوه فعال شدن ارائه‌دهنده ضمنی:

- اگر `plugins.entries.amazon-bedrock.config.discovery.enabled` برابر `true` باشد،
  OpenClaw حتی زمانی که هیچ نشانگر محیطی AWS وجود نداشته باشد، کشف را امتحان می‌کند.
- اگر `plugins.entries.amazon-bedrock.config.discovery.enabled` تنظیم نشده باشد،
  OpenClaw ارائه‌دهنده ضمنی Bedrock را فقط زمانی به‌صورت خودکار اضافه می‌کند
  که یکی از این نشانگرهای احراز هویت AWS را ببیند:
  `AWS_BEARER_TOKEN_BEDROCK`، `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`، یا `AWS_PROFILE`.
- مسیر واقعی احراز هویت زمان اجرای Bedrock همچنان از زنجیره پیش‌فرض AWS SDK استفاده می‌کند، بنابراین
  پیکربندی مشترک، SSO، و احراز هویت نقش نمونه IMDS می‌توانند کار کنند حتی وقتی کشف
  برای انتخاب فعالانه به `enabled: true` نیاز داشته باشد.

<Note>
برای ورودی‌های صریح `models.providers["amazon-bedrock"]`، OpenClaw همچنان می‌تواند احراز هویت نشانگر محیطی Bedrock را زودتر از نشانگرهای محیطی AWS مانند `AWS_BEARER_TOKEN_BEDROCK` تشخیص دهد، بدون اینکه بارگذاری کامل احراز هویت زمان اجرا را اجبار کند. مسیر واقعی احراز هویت فراخوانی مدل همچنان از زنجیره پیش‌فرض AWS SDK استفاده می‌کند.
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
    | `enabled` | خودکار | در حالت خودکار، OpenClaw ارائه‌دهنده ضمنی Bedrock را فقط زمانی فعال می‌کند که یک نشانگر محیطی AWS پشتیبانی‌شده را ببیند. برای اجبار کشف، آن را روی `true` تنظیم کنید. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | ناحیه AWS که برای فراخوانی‌های API کشف استفاده می‌شود. |
    | `providerFilter` | (همه) | با نام‌های ارائه‌دهنده Bedrock مطابقت می‌دهد (برای مثال `anthropic`، `amazon`). |
    | `refreshInterval` | `3600` | مدت‌زمان کش در ثانیه. برای غیرفعال کردن کش، آن را روی `0` تنظیم کنید. |
    | `defaultContextWindow` | `32000` | پنجره زمینه‌ای که برای مدل‌های کشف‌شده استفاده می‌شود (اگر محدودیت‌های مدل خود را می‌دانید، بازنویسی کنید). |
    | `defaultMaxTokens` | `4096` | حداکثر توکن‌های خروجی که برای مدل‌های کشف‌شده استفاده می‌شود (اگر محدودیت‌های مدل خود را می‌دانید، بازنویسی کنید). |

  </Accordion>
</AccordionGroup>

## راه‌اندازی سریع (مسیر AWS)

این راهنما یک نقش IAM ایجاد می‌کند، مجوزهای Bedrock را پیوست می‌کند، نمایه نمونه
را مرتبط می‌کند، و کشف OpenClaw را روی میزبان EC2 فعال می‌کند.

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
    OpenClaw **پروفایل‌های استنتاج منطقه‌ای و جهانی** را در کنار
    مدل‌های پایه کشف می‌کند. وقتی یک پروفایل به یک مدل پایه شناخته‌شده نگاشت می‌شود،
    آن پروفایل قابلیت‌های همان مدل را به ارث می‌برد (پنجره زمینه، حداکثر توکن‌ها،
    استدلال، بینایی) و منطقه درست درخواست Bedrock به‌طور خودکار تزریق می‌شود.
    این یعنی پروفایل‌های Claude میان‌منطقه‌ای بدون بازنویسی دستی
    ارائه‌دهنده کار می‌کنند.

    شناسه‌های پروفایل استنتاج شبیه `us.anthropic.claude-opus-4-6-v1:0` (منطقه‌ای)
    یا `anthropic.claude-opus-4-6-v1:0` (جهانی) هستند. اگر مدل پشتیبان از قبل
    در نتایج کشف وجود داشته باشد، پروفایل مجموعه کامل قابلیت‌های آن را به ارث می‌برد؛
    در غیر این صورت پیش‌فرض‌های امن اعمال می‌شوند.

    به پیکربندی اضافه‌ای نیاز نیست. تا زمانی که کشف فعال باشد و موجودیت اصلی IAM
    مجوز `bedrock:ListInferenceProfiles` داشته باشد، پروفایل‌ها در کنار
    مدل‌های پایه در `openclaw models list` ظاهر می‌شوند.

  </Accordion>

  <Accordion title="سطح سرویس">
    برخی مدل‌های Bedrock از پارامتر `service_tier` برای بهینه‌سازی هزینه
    یا تأخیر پشتیبانی می‌کنند. سطح‌های زیر در دسترس هستند:

    | سطح | توضیح |
    |------|-------------|
    | `default` | سطح استاندارد Bedrock |
    | `flex` | پردازش با تخفیف برای بارهای کاری‌ای که می‌توانند تأخیر طولانی‌تر را تحمل کنند |
    | `priority` | پردازش اولویت‌دار برای بارهای کاری حساس به تأخیر |
    | `reserved` | ظرفیت رزروشده برای بارهای کاری پایدار |

    برای درخواست‌های مدل Bedrock، `serviceTier` (یا `service_tier`) را از طریق
    `agents.defaults.params` تنظیم کنید، یا برای هر مدل در
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

    مقدارهای معتبر `default`، `flex`، `priority` و `reserved` هستند. همه
    مدل‌ها از همه سطح‌ها پشتیبانی نمی‌کنند — اگر سطح پشتیبانی‌نشده‌ای درخواست شود،
    Bedrock یک خطای اعتبارسنجی برمی‌گرداند. نکته: پیام خطا تا حدی گمراه‌کننده است؛
    ممکن است به‌جای اشاره به سطح سرویس پشتیبانی‌نشده، بگوید
    «شناسه مدل ارائه‌شده نامعتبر است». اگر این خطا را دیدید، بررسی کنید که آیا مدل
    از سطح درخواست‌شده پشتیبانی می‌کند یا نه.

  </Accordion>

  <Accordion title="دمای Claude Opus 4.7">
    Bedrock پارامتر `temperature` را برای Claude Opus 4.7 رد می‌کند. OpenClaw
    برای هر ارجاع Bedrock مربوط به Opus 4.7، از جمله شناسه‌های مدل پایه،
    پروفایل‌های استنتاج نام‌گذاری‌شده، پروفایل‌های استنتاج برنامه که مدل زیربنایی آن‌ها
    از طریق `bedrock:GetInferenceProfile` به Opus 4.7 حل می‌شود، و گونه‌های نقطه‌دار
    `opus-4.7` با پیشوندهای منطقه اختیاری (`us.`، `eu.`، `ap.`، `apac.`، `au.`، `jp.`،
    `global.`)، به‌طور خودکار `temperature` را حذف می‌کند. هیچ گزینه پیکربندی لازم نیست،
    و این حذف هم روی شیء گزینه‌های درخواست و هم روی فیلد بار داده `inferenceConfig`
    اعمال می‌شود.
  </Accordion>

  <Accordion title="Claude Fable 5">
    از `amazon-bedrock/anthropic.claude-fable-5` در `us-east-1`، یا
    شناسه‌های استنتاج منطقه‌ای مانند `us.anthropic.claude-fable-5` استفاده کنید.
    OpenClaw پنجره زمینه 1M، حد خروجی 128K، تفکر تطبیقی همیشه‌فعال،
    و نگاشت تلاش پشتیبانی‌شده Fable را اعمال می‌کند. `/think off` و
    `/think minimal` به `low` نگاشت می‌شوند؛ کنترل‌های پشتیبانی‌نشده دما و انتخاب اجباری ابزار
    حذف می‌شوند. خروجی جریانی تا زمانی نگه داشته می‌شود که Bedrock
    یک وضعیت پایانی برگرداند تا رد درخواست در میانه جریان، متن ناقص را آشکار نکند.
    Fable فقط رده سرویس استاندارد را پشتیبانی می‌کند؛ OpenClaw رده‌های پیکربندی‌شده
    `flex`، `priority` و `reserved` را برای این مدل نادیده می‌گیرد.

    AWS پیش از آنکه Fable در دسترس باشد، به یک رضایت‌نامه صریح `provider_data_share` برای نگهداری داده نیاز دارد.
    Promptها و تکمیل‌ها با Anthropic به اشتراک گذاشته می‌شوند و
    تا 30 روز برای اعتماد و ایمنی نگهداری می‌شوند. پیش از فعال‌سازی مدل،
    [نگهداری داده Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    را بررسی و پیکربندی کنید.

  </Accordion>

  <Accordion title="محافظ‌ها">
    می‌توانید [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    را با افزودن یک شیء `guardrail` به پیکربندی Plugin
    `amazon-bedrock` روی همه فراخوانی‌های مدل Bedrock اعمال کنید. محافظ‌ها به شما امکان می‌دهند فیلتر کردن محتوا،
    رد موضوع، فیلترهای واژه، فیلترهای اطلاعات حساس، و بررسی‌های
    زمینه‌مندسازی بافتی را اعمال کنید.

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
    | `guardrailIdentifier` | بله | شناسه Guardrail (مانند `abc123`) یا ARN کامل (مانند `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | بله | شماره نسخه منتشرشده، یا `"DRAFT"` برای پیش‌نویس در حال کار. |
    | `streamProcessingMode` | خیر | `"sync"` یا `"async"` برای ارزیابی guardrail هنگام جریان‌دهی. اگر حذف شود، Bedrock از پیش‌فرض خود استفاده می‌کند. |
    | `trace` | خیر | `"enabled"` یا `"enabled_full"` برای اشکال‌زدایی؛ برای تولید حذف کنید یا روی `"disabled"` بگذارید. |

    <Warning>
    اصل IAM مورد استفاده Gateway باید علاوه بر مجوزهای استاندارد فراخوانی، مجوز `bedrock:ApplyGuardrail` را داشته باشد.
    </Warning>

  </Accordion>

  <Accordion title="Embeddingها برای جست‌وجوی حافظه">
    Bedrock همچنین می‌تواند به‌عنوان ارائه‌دهنده embedding برای
    [جست‌وجوی حافظه](/fa/concepts/memory-search) عمل کند. این جدا از ارائه‌دهنده
    استنتاج پیکربندی می‌شود -- `agents.defaults.memorySearch.provider` را روی `"bedrock"` بگذارید:

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

    Embeddingهای Bedrock از همان زنجیره اعتبارنامه AWS SDK مانند استنتاج استفاده می‌کنند (نقش‌های نمونه،
    SSO، کلیدهای دسترسی، پیکربندی مشترک، و هویت وب). هیچ کلید API
    لازم نیست. برای استفاده از embeddingهای Bedrock، `memorySearch.provider: "bedrock"` را صریحاً تنظیم کنید.

    مدل‌های embedding پشتیبانی‌شده شامل Amazon Titan Embed (v1, v2)، Amazon Nova
    Embed، Cohere Embed (v3, v4)، و TwelveLabs Marengo هستند. برای
    فهرست کامل مدل‌ها و گزینه‌های ابعاد، به
    [مرجع پیکربندی حافظه -- Bedrock](/fa/reference/memory-config#bedrock-embedding-config)
    مراجعه کنید.

  </Accordion>

  <Accordion title="نکات و هشدارها">
    - Bedrock نیاز دارد **دسترسی مدل** در حساب/منطقه AWS شما فعال باشد.
    - کشف خودکار به مجوزهای `bedrock:ListFoundationModels` و
      `bedrock:ListInferenceProfiles` نیاز دارد.
    - اگر به حالت خودکار متکی هستید، یکی از نشانگرهای env احراز هویت AWS پشتیبانی‌شده را روی
      میزبان Gateway تنظیم کنید. اگر احراز هویت IMDS/پیکربندی مشترک را بدون نشانگرهای env ترجیح می‌دهید،
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` را تنظیم کنید.
    - OpenClaw منبع اعتبارنامه را به این ترتیب نمایش می‌دهد: `AWS_BEARER_TOKEN_BEDROCK`،
      سپس `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`، سپس `AWS_PROFILE`، و سپس
      زنجیره پیش‌فرض AWS SDK.
    - پشتیبانی از استدلال به مدل بستگی دارد؛ برای قابلیت‌های
      فعلی، کارت مدل Bedrock را بررسی کنید.
    - اگر یک جریان کلید مدیریت‌شده را ترجیح می‌دهید، همچنین می‌توانید یک پراکسی سازگار با OpenAI
      را جلوی Bedrock قرار دهید و آن را به‌جای آن به‌عنوان ارائه‌دهنده OpenAI پیکربندی کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="جست‌وجوی حافظه" href="/fa/concepts/memory-search" icon="magnifying-glass">
    Embeddingهای Bedrock برای پیکربندی جست‌وجوی حافظه.
  </Card>
  <Card title="مرجع پیکربندی حافظه" href="/fa/reference/memory-config#bedrock-embedding-config" icon="database">
    فهرست کامل مدل‌های embedding Bedrock و گزینه‌های ابعاد.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
