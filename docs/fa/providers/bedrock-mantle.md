---
read_when:
    - می‌خواهید از مدل‌های متن‌باز میزبانی‌شده در Bedrock Mantle با OpenClaw استفاده کنید
    - برای GPT-OSS، Qwen، Kimi یا GLM به نقطه پایانی سازگار با OpenAI در Mantle نیاز دارید
    - می‌خواهید از Claude Sonnet 5 یا Mythos 5 از طریق Amazon Bedrock Mantle استفاده کنید
summary: از مدل‌های سازگار با OpenAI و Claude Messages در Amazon Bedrock Mantle همراه با OpenClaw استفاده کنید
title: مانتل Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T10:39:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw شامل ارائه‌دهندهٔ همراه **Amazon Bedrock Mantle** است که به نقطهٔ پایانی سازگار با OpenAI در Mantle متصل می‌شود. Mantle مدل‌های متن‌باز و شخص ثالث (GPT-OSS، Qwen، Kimi، GLM و مدل‌های مشابه) را از طریق رابط استاندارد `/v1/chat/completions` مبتنی بر زیرساخت Bedrock میزبانی می‌کند. Mantle همچنین مدل‌های Anthropic Claude را از طریق مسیر Anthropic Messages ارائه می‌دهد.

| ویژگی          | مقدار                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| شناسهٔ ارائه‌دهنده | `amazon-bedrock-mantle`                                                                                  |
| API            | `openai-completions` برای مدل‌های OSS کشف‌شده، `anthropic-messages` برای مدل‌های Claude                  |
| احراز هویت     | `AWS_BEARER_TOKEN_BEDROCK` صریح یا تولید توکن حامل از زنجیرهٔ اعتبارنامهٔ IAM                            |
| منطقهٔ پیش‌فرض | `us-east-1` (با `AWS_REGION` یا `AWS_DEFAULT_REGION` بازنویسی کنید)                                      |

## شروع به کار

روش احراز هویت دلخواهتان را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="توکن حامل صریح">
    **مناسب برای:** محیط‌هایی که از قبل توکن حامل Mantle دارید.

    <Steps>
      <Step title="تنظیم توکن حامل روی میزبان Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        در صورت تمایل، منطقه‌ای تنظیم کنید (پیش‌فرض `us-east-1` است):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="بررسی کشف‌شدن مدل‌ها">
        ```bash
        openclaw models list
        ```

        مدل‌های کشف‌شده زیر ارائه‌دهندهٔ `amazon-bedrock-mantle` نمایش داده می‌شوند. مگر اینکه بخواهید مقادیر پیش‌فرض را بازنویسی کنید، پیکربندی دیگری لازم نیست.
      </Step>
    </Steps>

  </Tab>

  <Tab title="اعتبارنامه‌های IAM">
    **مناسب برای:** استفاده از اعتبارنامه‌های سازگار با AWS SDK (پیکربندی اشتراکی، SSO، هویت وب و نقش‌های نمونه یا وظیفه).

    <Steps>
      <Step title="پیکربندی اعتبارنامه‌های AWS روی میزبان Gateway">
        هر منبع احراز هویت سازگار با AWS SDK قابل استفاده است:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="بررسی کشف‌شدن مدل‌ها">
        ```bash
        openclaw models list
        ```

        OpenClaw به‌طور خودکار از زنجیرهٔ اعتبارنامه، توکن حامل Mantle تولید می‌کند.
      </Step>
    </Steps>

    <Tip>
    وقتی `AWS_BEARER_TOKEN_BEDROCK` تنظیم نشده باشد، OpenClaw با استفاده از زنجیرهٔ پیش‌فرض اعتبارنامهٔ AWS، شامل اعتبارنامه‌ها و نمایه‌های پیکربندی اشتراکی، SSO، هویت وب و نقش‌های نمونه یا وظیفه، توکن حامل را برایتان ایجاد می‌کند.
    </Tip>

  </Tab>
</Tabs>

## کشف خودکار مدل

وقتی `AWS_BEARER_TOKEN_BEDROCK` تنظیم شده باشد، OpenClaw مستقیماً از آن استفاده می‌کند. در غیر این صورت، OpenClaw تلاش می‌کند از زنجیرهٔ پیش‌فرض اعتبارنامهٔ AWS یک توکن حامل Mantle تولید کند. سپس با درخواست از نقطهٔ پایانی `/v1/models` منطقه، مدل‌های دردسترس Mantle را کشف می‌کند.

| رفتار             | جزئیات                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| حافظهٔ نهان کشف   | نتایج برای هر منطقه یک ساعت در حافظهٔ نهان می‌مانند؛ شکست دریافت، آخرین نتیجهٔ ذخیره‌شده را برمی‌گرداند |
| نوسازی توکن IAM   | هر ۲ ساعت، به‌صورت ذخیره‌شده برای هر منطقه                                                         |

برای فعال نگه‌داشتن Plugin مربوط به Mantle و در عین حال غیرفعال‌کردن کشف خودکار و تولید توکن حامل IAM، کلید کشف متعلق به Plugin را غیرفعال کنید:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
این توکن حامل همان `AWS_BEARER_TOKEN_BEDROCK` است که ارائه‌دهندهٔ استاندارد [Amazon Bedrock](/fa/providers/bedrock) استفاده می‌کند.
</Note>

### مناطق پشتیبانی‌شده

`us-east-1`، `us-east-2`، `us-west-2`، `ap-northeast-1`،
`ap-south-1`، `ap-southeast-3`، `eu-central-1`، `eu-west-1`، `eu-west-2`،
`eu-south-1`، `eu-north-1`، `sa-east-1`.

## پیکربندی دستی

اگر پیکربندی صریح را به کشف خودکار ترجیح می‌دهید:

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

یک فهرست صریح و غیرخالی `models` مرجع نهایی است و همهٔ ردیف‌های کشف‌شده، از جمله ردیف‌های Claude در ادامه، را جایگزین می‌کند. برای حفظ فهرست خودکار Mantle، `models` را حذف کنید؛ یا ورودی‌های کامل مدل‌های Claude موردنظرتان را در آن بگنجانید.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="پشتیبانی از استدلال">
    پشتیبانی از استدلال از روی شناسهٔ مدل‌هایی تشخیص داده می‌شود که شامل الگوهایی مانند `thinking`، `reasoner`، `reasoning`، `deepseek.r`، `gpt-oss-120b` یا `gpt-oss-safeguard-120b` هستند. OpenClaw هنگام کشف، برای مدل‌های مطابق به‌طور خودکار `reasoning: true` را تنظیم می‌کند.
  </Accordion>

  <Accordion title="دردسترس‌نبودن نقطهٔ پایانی">
    اگر نقطهٔ پایانی Mantle دردسترس نباشد، هیچ مدلی برنگرداند یا حل توکن حامل ناموفق باشد، کشف نتیجه‌ای خالی برمی‌گرداند و ارائه‌دهندهٔ ضمنی نادیده گرفته می‌شود. OpenClaw خطا نمی‌دهد و سایر ارائه‌دهندگان پیکربندی‌شده به‌طور عادی به کار ادامه می‌دهند.
  </Accordion>

  <Accordion title="Claude از طریق مسیر Anthropic Messages">
    وقتی کشف خودکار مالک فهرست مدل‌ها باشد، OpenClaw پس از جست‌وجوی موفق و صرف‌نظر از نتیجهٔ `/v1/models`، چهار مدل Claude را اضافه می‌کند:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5)،
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) و
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5)، به‌علاوهٔ
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (پیش‌نمایش Claude Mythos).
    آن‌ها از رابط API با نام `anthropic-messages` استفاده می‌کنند و از طریق همان نقطهٔ پایانی سازگار با Anthropic و دارای احراز هویت توکن حامل (`<mantle-base>/anthropic`) جریان می‌یابند؛ بنابراین توکن حامل AWS مانند کلید API مربوط به Anthropic در نظر گرفته نمی‌شود.

    Claude Sonnet 5 همیشه از تفکر تطبیقی استفاده می‌کند و مقدار پیش‌فرض تلاش آن `high` است. `/think off` و `/think minimal` به `low` نگاشت می‌شوند، زیرا مسیر Mantle نمی‌تواند تفکر را غیرفعال کند. OpenClaw همچنین دمای سفارشی را از درخواست‌های Sonnet 5 حذف می‌کند.

    دسترسی به Claude Mythos 5 محدود است. این مدل پنجرهٔ زمینهٔ ۱٬۰۰۰٬۰۰۰ توکنی و محدودیت خروجی ۱۲۸٬۰۰۰ توکنی ارائه می‌دهد، همیشه از تفکر تطبیقی استفاده می‌کند، `/think off` و `/think minimal` را به `low` نگاشت می‌کند و پارامترهای نمونه‌گیری انتخاب‌شده توسط فراخوان را حذف می‌کند.

    پیش‌نمایش Claude Mythos همیشه استدلال را درخواست می‌کند و وقتی سطحی برای `/think` تنظیم نشده باشد، تلاش پیش‌فرض آن `high` است (`xhigh`/`max` به `high` کاهش می‌یابد و `minimal` به `low` افزایش می‌یابد). Opus 4.7 در Mantle بدون استدلال ارائه‌شده توسط مدل جریان می‌یابد و OpenClaw پارامتر `temperature` آن را حذف می‌کند، زیرا Opus 4.7 در این مسیر بازنویسی‌های نمونه‌گیری را نمی‌پذیرد؛ پیش‌نمایش Mythos بازنویسی `temperature` را به‌طور عادی می‌پذیرد.

    یک فهرست صریح و غیرخالی `models.providers["amazon-bedrock-mantle"].models` کل فهرست کشف‌شده را جایگزین می‌کند. اگر این ردیف‌های داخلی Claude را می‌خواهید، آن فهرست را حذف کنید.

  </Accordion>

  <Accordion title="ارتباط با ارائه‌دهندهٔ Amazon Bedrock">
    Bedrock Mantle ارائه‌دهنده‌ای جدا از ارائه‌دهندهٔ استاندارد [Amazon Bedrock](/fa/providers/bedrock) است. Mantle برای فهرست OSS خود از رابط سازگار با OpenAI در `/v1` استفاده می‌کند، درحالی‌که ارائه‌دهندهٔ استاندارد Bedrock از API بومی Bedrock Converse بهره می‌برد.

    در صورت وجود `AWS_BEARER_TOKEN_BEDROCK`، هر دو ارائه‌دهنده از همان اعتبارنامه استفاده می‌کنند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/fa/providers/bedrock" icon="cloud">
    ارائه‌دهندهٔ بومی Bedrock برای Anthropic Claude، Titan و مدل‌های دیگر.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفادهٔ مجدد از اعتبارنامه‌ها.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و روش رفع آن‌ها.
  </Card>
</CardGroup>
