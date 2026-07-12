---
read_when:
    - می‌خواهید از مدل‌های Amazon Bedrock با OpenClaw استفاده کنید
    - برای فراخوانی مدل، باید اطلاعات احراز هویت و منطقهٔ AWS را پیکربندی کنید
summary: استفاده از مدل‌های Amazon Bedrock ‏(Converse API) با OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T10:42:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw می‌تواند از مدل‌های **Amazon Bedrock** از طریق ارائه‌دهندهٔ جریانی **Bedrock Converse**
استفاده کند. احراز هویت Bedrock از **زنجیرهٔ پیش‌فرض اعتبارنامه‌های AWS SDK**
استفاده می‌کند، نه از کلید API.

| ویژگی | مقدار                                                       |
| -------- | ----------------------------------------------------------- |
| ارائه‌دهنده | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| احراز هویت     | اعتبارنامه‌های AWS (متغیرهای محیطی، پیکربندی مشترک یا نقش نمونه) |
| منطقه   | `AWS_REGION` یا `AWS_DEFAULT_REGION` (پیش‌فرض: `us-east-1`) |

## شروع به کار

روش احراز هویت ترجیحی خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="کلیدهای دسترسی / متغیرهای محیطی">
    **مناسب برای:** دستگاه‌های توسعه‌دهندگان، CI یا میزبان‌هایی که اعتبارنامه‌های AWS را مستقیماً در آن‌ها مدیریت می‌کنید.

    <Steps>
      <Step title="تنظیم اعتبارنامه‌های AWS روی میزبان Gateway">
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
      <Step title="افزودن ارائه‌دهنده و مدل Bedrock به پیکربندی">
        نیازی به `apiKey` نیست. ارائه‌دهنده را با `auth: "aws-sdk"` پیکربندی کنید:

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
    با احراز هویت مبتنی بر نشانگر محیطی (`AWS_ACCESS_KEY_ID`، `AWS_PROFILE` یا `AWS_BEARER_TOKEN_BEDROCK`)، OpenClaw ارائه‌دهندهٔ ضمنی Bedrock را بدون نیاز به پیکربندی اضافی برای کشف مدل‌ها به‌طور خودکار فعال می‌کند.
    </Tip>

  </Tab>

  <Tab title="نقش‌های نمونهٔ EC2 ‏(IMDS)">
    **مناسب برای:** نمونه‌های EC2 دارای نقش IAM متصل که از سرویس فرادادهٔ نمونه برای احراز هویت استفاده می‌کنند.

    <Steps>
      <Step title="فعال‌سازی صریح کشف">
        هنگام استفاده از IMDS، ‏OpenClaw نمی‌تواند احراز هویت AWS را صرفاً از نشانگرهای محیطی تشخیص دهد؛ بنابراین باید صریحاً آن را فعال کنید:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="افزودن اختیاری نشانگر محیطی برای حالت خودکار">
        اگر می‌خواهید مسیر تشخیص خودکار نشانگر محیطی نیز کار کند (برای مثال، در نماهای `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        به کلید API جعلی **نیازی ندارید**.
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
    - `bedrock:ListInferenceProfiles` (برای کشف نمایه‌های استنتاج)

    یا خط‌مشی مدیریت‌شدهٔ `AmazonBedrockFullAccess` را متصل کنید.
    </Warning>

    <Note>
    فقط زمانی به `AWS_PROFILE=default` نیاز دارید که مشخصاً یک نشانگر محیطی برای حالت خودکار یا نماهای وضعیت بخواهید. مسیر واقعی احراز هویت زمان اجرای Bedrock از زنجیرهٔ پیش‌فرض AWS SDK استفاده می‌کند؛ بنابراین احراز هویت نقش نمونه از طریق IMDS حتی بدون نشانگرهای محیطی نیز کار می‌کند.
    </Note>

  </Tab>
</Tabs>

## کشف خودکار مدل‌ها

OpenClaw می‌تواند مدل‌های Bedrock را که از **جریان‌دهی**
و **خروجی متنی** پشتیبانی می‌کنند، به‌طور خودکار کشف کند. کشف از `bedrock:ListFoundationModels` و
`bedrock:ListInferenceProfiles` استفاده می‌کند و نتایج در حافظهٔ نهان ذخیره می‌شوند (پیش‌فرض: ۱ ساعت).

نحوهٔ فعال شدن ارائه‌دهندهٔ ضمنی:

- اگر `plugins.entries.amazon-bedrock.config.discovery.enabled` برابر `true` باشد،
  OpenClaw حتی در نبود نشانگر محیطی AWS نیز کشف را امتحان می‌کند.
- اگر `plugins.entries.amazon-bedrock.config.discovery.enabled` تنظیم نشده باشد،
  OpenClaw فقط زمانی ارائه‌دهندهٔ ضمنی Bedrock را
  به‌طور خودکار اضافه می‌کند که یکی از این نشانگرهای احراز هویت AWS را ببیند:
  `AWS_BEARER_TOKEN_BEDROCK`، ترکیب `AWS_ACCESS_KEY_ID` و
  `AWS_SECRET_ACCESS_KEY`، یا `AWS_PROFILE`.
- مسیر واقعی احراز هویت زمان اجرای Bedrock همچنان از زنجیرهٔ پیش‌فرض AWS SDK استفاده می‌کند؛ بنابراین
  پیکربندی مشترک، SSO و احراز هویت نقش نمونه از طریق IMDS می‌توانند حتی زمانی کار کنند که برای فعال‌سازی
  کشف، تنظیم `enabled: true` لازم بوده است.

<Note>
برای ورودی‌های صریح `models.providers["amazon-bedrock"]`، ‏OpenClaw همچنان می‌تواند احراز هویت مبتنی بر نشانگر محیطی Bedrock را از نشانگرهای محیطی AWS مانند `AWS_BEARER_TOKEN_BEDROCK` در مرحله‌ای زودهنگام و بدون اجبار به بارگذاری کامل احراز هویت زمان اجرا تشخیص دهد. مسیر واقعی احراز هویت فراخوانی مدل همچنان از زنجیرهٔ پیش‌فرض AWS SDK استفاده می‌کند.
</Note>

<AccordionGroup>
  <Accordion title="گزینه‌های پیکربندی کشف">
    گزینه‌های پیکربندی در `plugins.entries.amazon-bedrock.config.discovery` قرار دارند:

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
    | `enabled` | خودکار | در حالت خودکار، OpenClaw فقط زمانی ارائه‌دهندهٔ ضمنی Bedrock را فعال می‌کند که یک نشانگر محیطی پشتیبانی‌شدهٔ AWS را ببیند. برای اجبار به کشف، آن را روی `true` تنظیم کنید. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | منطقهٔ AWS مورداستفاده برای فراخوانی‌های API کشف. |
    | `providerFilter` | (همه) | با نام ارائه‌دهندگان Bedrock مطابقت می‌دهد (برای مثال `anthropic` و `amazon`). |
    | `refreshInterval` | `3600` | مدت نگهداری حافظهٔ نهان برحسب ثانیه. برای غیرفعال کردن ذخیره‌سازی در حافظهٔ نهان، روی `0` تنظیم کنید. |
    | `defaultContextWindow` | `32000` | پنجرهٔ زمینهٔ مورداستفاده برای مدل‌های کشف‌شده‌ای که محدودیت توکن شناخته‌شده‌ای ندارند (اگر محدودیت‌های مدل خود را می‌دانید، آن را بازنویسی کنید). |
    | `defaultMaxTokens` | `4096` | حداکثر توکن‌های خروجی مورداستفاده برای مدل‌های کشف‌شده‌ای که محدودیت توکن شناخته‌شده‌ای ندارند (اگر محدودیت‌های مدل خود را می‌دانید، آن را بازنویسی کنید). |

  </Accordion>

  <Accordion title="محدودیت‌های پنجرهٔ زمینه و حداکثر توکن">
    APIهای `ListFoundationModels` و `GetFoundationModel` در Bedrock هیچ
    فراداده‌ای دربارهٔ محدودیت توکن برنمی‌گردانند و فقط شناسهٔ مدل، نام، شیوه‌ها و وضعیت
    چرخهٔ عمر را ارائه می‌کنند. OpenClaw همراه با یک جدول جست‌وجو برای پنجره‌های زمینه و محدودیت‌های
    خروجی شناخته‌شدهٔ مدل‌های محبوب Bedrock ‏(Claude، Nova، Llama، Mistral، DeepSeek
    و مدل‌های دیگر) عرضه می‌شود تا مدیریت نشست، آستانه‌های Compaction و
    تشخیص سرریز زمینه برای این مدل‌ها به‌درستی کار کنند.

    مدل‌های کشف‌شده‌ای که در جدول نیستند، از `defaultContextWindow`
    و `defaultMaxTokens` استفاده می‌کنند. اگر مدل مورداستفادهٔ شما محدودیت‌های دقیقی ندارد،
    آن را با یک ورودی صریح در
    `models.providers["amazon-bedrock"].models` بازنویسی کنید.

  </Accordion>
</AccordionGroup>

## راه‌اندازی سریع (مسیر AWS)

این راهنما یک نقش IAM ایجاد می‌کند، مجوزهای Bedrock را به آن متصل می‌کند، نمایهٔ
نمونه را مرتبط می‌سازد و کشف OpenClaw را روی میزبان EC2 فعال می‌کند.

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
  <Accordion title="نمایه‌های استنتاج">
    OpenClaw در کنار مدل‌های پایه، **نمایه‌های استنتاج منطقه‌ای و سراسری** را نیز
    کشف می‌کند. هنگامی که یک نمایه به مدل پایه‌ای شناخته‌شده نگاشت شود،
    قابلیت‌های آن مدل (پنجرهٔ زمینه، حداکثر توکن‌ها، استدلال و بینایی) را به ارث می‌برد
    و منطقهٔ صحیح درخواست Bedrock به‌طور خودکار
    اعمال می‌شود. این یعنی نمایه‌های میان‌منطقه‌ای Claude بدون بازنویسی دستی
    ارائه‌دهنده کار می‌کنند. نمایه‌های میان‌منطقه‌ای سراسری (`global.*`) در
    `openclaw models list` ابتدا نمایش داده می‌شوند، زیرا معمولاً ظرفیت بهتر
    و جایگزینی خودکار هنگام خرابی را فراهم می‌کنند.

    شناسه‌های نمایهٔ استنتاج به‌شکل `us.anthropic.claude-opus-4-6-v1:0` (منطقه‌ای)
    یا `anthropic.claude-opus-4-6-v1:0` (سراسری) هستند. اگر مدل زیربنایی از قبل
    در نتایج کشف موجود باشد، نمایه مجموعهٔ کامل قابلیت‌های آن را به ارث می‌برد؛
    در غیر این صورت، پیش‌فرض‌های امن اعمال می‌شوند.

    به پیکربندی اضافی نیازی نیست. تا زمانی که کشف فعال باشد و هویت IAM
    دارای مجوز `bedrock:ListInferenceProfiles` باشد، نمایه‌ها در کنار
    مدل‌های پایه در `openclaw models list` ظاهر می‌شوند.

  </Accordion>

  <Accordion title="ردهٔ سرویس">
    برخی مدل‌های Bedrock از پارامتر `service_tier` برای بهینه‌سازی هزینه
    یا تأخیر پشتیبانی می‌کنند. رده‌های زیر در دسترس هستند:

    | رده | توضیح |
    |------|-------------|
    | `default` | ردهٔ استاندارد Bedrock |
    | `flex` | پردازش با تخفیف برای بارهای کاری که می‌توانند تأخیر بیشتر را تحمل کنند |
    | `priority` | پردازش اولویت‌دار برای بارهای کاری حساس به تأخیر |
    | `reserved` | ظرفیت رزروشده برای بارهای کاری پایدار |

    برای درخواست‌های مدل Bedrock، ‏`serviceTier` (یا `service_tier`) را از طریق
    `agents.defaults.params` یا برای هر مدل در
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

    مقادیر معتبر عبارت‌اند از `default`، `flex`، `priority` و `reserved`. Claude
    Fable 5 و Sonnet 5 فقط از سطح `default` پشتیبانی می‌کنند؛ OpenClaw در صورت
    درخواست `flex`، `priority` یا `reserved` برای این مدل‌ها هشدار می‌دهد و
    آن را نادیده می‌گیرد. برای مدل‌های دیگر نیز همهٔ مدل‌ها از همهٔ سطوح
    پشتیبانی نمی‌کنند -- یک سطح پشتیبانی‌نشده خطای اعتبارسنجی Bedrock برمی‌گرداند
    و پیام خطا ممکن است گمراه‌کننده باشد (برای مثال، به‌جای اشاره به سطح به‌عنوان
    مشکل، می‌گوید «شناسهٔ مدل ارائه‌شده نامعتبر است»). اگر این خطا را مشاهده
    کردید، بررسی کنید که آیا مدل از سطح درخواستی پشتیبانی می‌کند.

  </Accordion>

  <Accordion title="دمای Claude Opus 4.7 و 4.8">
    Bedrock پارامتر `temperature` را برای Claude Opus 4.7 و Opus 4.8 رد
    می‌کند. OpenClaw برای هر ارجاع منطبق Bedrock، `temperature` را به‌طور
    خودکار حذف می‌کند؛ از جمله شناسه‌های مدل پایه، پروفایل‌های استنتاج نام‌گذاری‌شده،
    پروفایل‌های استنتاج برنامه که مدل زیربنایی آن‌ها از طریق
    `bedrock:GetInferenceProfile` به Opus 4.7/4.8 تفکیک می‌شود، و گونه‌های
    نقطه‌دار `opus-4.7`/`opus-4.8` با پیشوندهای اختیاری منطقه (`us.`، `eu.`،
    `ap.`، `apac.`، `au.`، `jp.`، `global.`). هیچ گزینهٔ پیکربندی‌ای لازم نیست
    و این حذف هم روی شیء گزینه‌های درخواست و هم روی فیلد بارِ `inferenceConfig`
    اعمال می‌شود.
  </Accordion>

  <Accordion title="Claude Fable 5">
    از `amazon-bedrock/anthropic.claude-fable-5` در `us-east-1` یا شناسه‌های
    استنتاج منطقه‌ای مانند `us.anthropic.claude-fable-5` استفاده کنید.
    OpenClaw پنجرهٔ زمینهٔ ۱ میلیونی Fable، محدودیت خروجی ۱۲۸ هزار توکنی،
    تفکر تطبیقی همواره‌فعال و نگاشت تلاش پشتیبانی‌شدهٔ آن را اعمال می‌کند.
    `/think off` و `/think minimal` به `low` نگاشت می‌شوند؛ کنترل‌های دما و
    انتخاب اجباری ابزار نیز، مطابق مسیر Opus 4.7/4.8، حذف می‌شوند. خروجی
    جریانی تا زمانی که Bedrock یک وضعیت پایانی برگرداند نگه داشته می‌شود تا
    رد درخواست در میانهٔ جریان، متن ناقص را آشکار نکند.

    پیش از در دسترس قرار گرفتن Fable، AWS به اعلام رضایت صریح
    `provider_data_share` برای نگهداری داده نیاز دارد. درخواست‌ها و پاسخ‌های
    تکمیل‌شده با Anthropic به اشتراک گذاشته می‌شوند و برای اعتماد و ایمنی تا
    ۳۰ روز نگهداری می‌شوند. پیش از فعال‌سازی مدل، [نگهداری داده در Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    را بررسی و پیکربندی کنید.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 از طریق Bedrock فقط برای حساب‌هایی در دسترس است که تأییدیهٔ
    دسترسی محدود لازم را دارند. OpenClaw مدل پایهٔ `anthropic.claude-mythos-5`
    و پروفایل‌های استنتاج منطقه‌ای یا سراسری مانند
    `us.anthropic.claude-mythos-5` را شناسایی می‌کند.

    OpenClaw پنجرهٔ زمینهٔ ۱٬۰۰۰٬۰۰۰ توکنی، محدودیت خروجی ۱۲۸٬۰۰۰ توکنی،
    ورودی تصویر، ذخیره‌سازی موقت درخواست، جریان ایمن در برابر رد درخواست و
    سطوح تلاش بومی را اعمال می‌کند. تفکر تطبیقی همیشه فعال است: `/think off`
    و `/think minimal` به `low` نگاشت می‌شوند، درحالی‌که `xhigh` و `max`
    همچنان در دسترس‌اند. مقادیر نمونه‌برداری سفارشی و انتخاب اجباری ابزار حذف
    می‌شوند.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS استفاده از Sonnet 5 را برای هر دو نقطهٔ پایانی
    [`bedrock-runtime` و `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html)
    مستند کرده است. OpenClaw مدل پایهٔ Bedrock با شناسهٔ
    `anthropic.claude-sonnet-5` و پروفایل‌های استنتاج منطقه‌ای یا سراسری مانند
    `us.anthropic.claude-sonnet-5` را شناسایی می‌کند. این سامانه پنجرهٔ زمینهٔ
    ۱٬۰۰۰٬۰۰۰ توکنی، محدودیت خروجی ۱۲۸٬۰۰۰ توکنی، ورودی تصویر، سطوح تلاش
    بومی، ذخیره‌سازی موقت درخواست و جریان ایمن در برابر رد درخواست را اعمال
    می‌کند.

    Bedrock تفکر تطبیقی را برای Sonnet 5 فعال نگه می‌دارد. مقدار پیش‌فرض
    OpenClaw برابر `high` است؛ `/think off` و `/think minimal` به `low` نگاشت
    می‌شوند، زیرا این مسیر نمی‌تواند تفکر را غیرفعال کند. هنگام فعال بودن
    تفکر تطبیقی، مقادیر دمای سفارشی و انتخاب اجباری ابزار حذف می‌شوند.

  </Accordion>

  <Accordion title="محافظ‌ها">
    می‌توانید با افزودن یک شیء `guardrail` به پیکربندی Plugin مربوط به
    `amazon-bedrock`، [محافظ‌های Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    را روی همهٔ فراخوانی‌های مدل Bedrock اعمال کنید. محافظ‌ها به شما امکان
    می‌دهند پالایش محتوا، رد موضوع، پالایش واژه‌ها، پالایش اطلاعات حساس و
    بررسی‌های اتکای زمینه‌ای را اعمال کنید.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // شناسهٔ محافظ یا ARN کامل
                guardrailVersion: "1", // شمارهٔ نسخه یا "DRAFT"
                streamProcessingMode: "sync", // اختیاری: "sync" یا "async"
                trace: "enabled", // اختیاری: "enabled"، "disabled" یا "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    `guardrailIdentifier` و `guardrailVersion` الزامی هستند.

    | گزینه | توضیح |
    | ------ | ----------- |
    | `guardrailIdentifier` | شناسهٔ محافظ (برای مثال `abc123`) یا ARN کامل (برای مثال `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | شمارهٔ نسخهٔ منتشرشده یا `"DRAFT"` برای پیش‌نویس در حال کار. |
    | `streamProcessingMode` | `"sync"` یا `"async"` برای ارزیابی محافظ هنگام جریان. اگر حذف شود، Bedrock از مقدار پیش‌فرض خود استفاده می‌کند. |
    | `trace` | `"enabled"` یا `"enabled_full"` برای اشکال‌زدایی؛ برای محیط عملیاتی آن را حذف کنید یا روی `"disabled"` تنظیم کنید. |

    <Warning>
    هویت IAM مورداستفادهٔ Gateway باید علاوه بر مجوزهای استاندارد فراخوانی، مجوز `bedrock:ApplyGuardrail` را نیز داشته باشد.
    </Warning>

  </Accordion>

  <Accordion title="تعبیه‌ها برای جست‌وجوی حافظه">
    Bedrock همچنین می‌تواند به‌عنوان ارائه‌دهندهٔ تعبیه برای
    [جست‌وجوی حافظه](/fa/concepts/memory-search) استفاده شود. این مورد جدا از
    ارائه‌دهندهٔ استنتاج پیکربندی می‌شود -- مقدار
    `agents.defaults.memorySearch.provider` را روی `"bedrock"` تنظیم کنید:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // پیش‌فرض
          },
        },
      },
    }
    ```

    تعبیه‌های Bedrock از همان زنجیرهٔ اعتبارنامهٔ AWS SDK مورداستفاده برای
    استنتاج بهره می‌برند (نقش‌های نمونه، SSO، کلیدهای دسترسی، پیکربندی مشترک
    و هویت وب). به کلید API نیازی نیست.

    مدل‌های تعبیهٔ پشتیبانی‌شده شامل Amazon Titan Embed (نسخه‌های ۱ و ۲)،
    Amazon Nova Embed، Cohere Embed (نسخه‌های ۳ و ۴) و TwelveLabs Marengo
    هستند. برای فهرست کامل مدل‌ها و گزینه‌های ابعاد، به
    [مرجع پیکربندی حافظه -- Bedrock](/fa/reference/memory-config#bedrock-embedding-config)
    مراجعه کنید.

  </Accordion>

  <Accordion title="نکته‌ها و ملاحظات">
    - Bedrock به فعال بودن **دسترسی مدل** در حساب/منطقهٔ AWS شما نیاز دارد.
    - کشف خودکار به مجوزهای `bedrock:ListFoundationModels` و
      `bedrock:ListInferenceProfiles` نیاز دارد.
    - اگر به حالت خودکار متکی هستید، یکی از نشانگرهای محیطی پشتیبانی‌شدهٔ
      احراز هویت AWS را روی میزبان Gateway تنظیم کنید. اگر احراز هویت
      IMDS/پیکربندی مشترک را بدون نشانگرهای محیطی ترجیح می‌دهید، مقدار
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` را تنظیم کنید.
    - OpenClaw منبع اعتبارنامه را به این ترتیب نمایش می‌دهد:
      `AWS_BEARER_TOKEN_BEDROCK`، سپس `AWS_ACCESS_KEY_ID` +
      `AWS_SECRET_ACCESS_KEY`، سپس `AWS_PROFILE` و در پایان زنجیرهٔ پیش‌فرض
      AWS SDK.
    - پشتیبانی از استدلال به مدل بستگی دارد؛ برای قابلیت‌های فعلی، کارت مدل
      Bedrock را بررسی کنید.
    - اگر جریان کلید مدیریت‌شده را ترجیح می‌دهید، می‌توانید یک پروکسی سازگار
      با OpenAI را نیز جلوی Bedrock قرار دهید و آن را به‌جای Bedrock به‌عنوان
      ارائه‌دهندهٔ OpenAI پیکربندی کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="جست‌وجوی حافظه" href="/fa/concepts/memory-search" icon="magnifying-glass">
    تعبیه‌های Bedrock برای پیکربندی جست‌وجوی حافظه.
  </Card>
  <Card title="مرجع پیکربندی حافظه" href="/fa/reference/memory-config#bedrock-embedding-config" icon="database">
    فهرست کامل مدل‌های تعبیهٔ Bedrock و گزینه‌های ابعاد.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
