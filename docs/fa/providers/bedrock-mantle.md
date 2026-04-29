---
read_when:
    - می‌خواهید از مدل‌های OSS میزبانی‌شده در Bedrock Mantle با OpenClaw استفاده کنید
    - برای GPT-OSS، Qwen، Kimi یا GLM به نقطهٔ پایانی سازگار با OpenAI در Mantle نیاز دارید
summary: استفاده از مدل‌های Amazon Bedrock Mantle (سازگار با OpenAI) با OpenClaw
title: پوستهٔ Amazon Bedrock
x-i18n:
    generated_at: "2026-04-29T23:23:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw شامل ارائه‌دهندهٔ همراه **Amazon Bedrock Mantle** است که به
نقطهٔ پایانی سازگار با OpenAI مربوط به Mantle وصل می‌شود. Mantle مدل‌های متن‌باز و
شخص ثالث (GPT-OSS، Qwen، Kimi، GLM و موارد مشابه) را از طریق سطح استاندارد
`/v1/chat/completions` که با زیرساخت Bedrock پشتیبانی می‌شود، میزبانی می‌کند.

| ویژگی          | مقدار                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| شناسهٔ ارائه‌دهنده | `amazon-bedrock-mantle`                                                                     |
| رابط API       | `openai-completions` (سازگار با OpenAI) یا `anthropic-messages` (مسیر Anthropic Messages) |
| احراز هویت     | `AWS_BEARER_TOKEN_BEDROCK` صریح یا تولید توکن حامل با زنجیرهٔ اعتبارنامهٔ IAM         |
| منطقهٔ پیش‌فرض | `us-east-1` (بازنویسی با `AWS_REGION` یا `AWS_DEFAULT_REGION`)                            |

## شروع به کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="توکن حامل صریح">
    **بهترین گزینه برای:** محیط‌هایی که از قبل یک توکن حامل Mantle دارید.

    <Steps>
      <Step title="تنظیم توکن حامل روی میزبان Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        در صورت تمایل یک منطقه تنظیم کنید (پیش‌فرض `us-east-1` است):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="بررسی کشف مدل‌ها">
        ```bash
        openclaw models list
        ```

        مدل‌های کشف‌شده زیر ارائه‌دهندهٔ `amazon-bedrock-mantle` نمایش داده می‌شوند. هیچ
        پیکربندی اضافه‌ای لازم نیست، مگر اینکه بخواهید پیش‌فرض‌ها را بازنویسی کنید.
      </Step>
    </Steps>

  </Tab>

  <Tab title="اعتبارنامه‌های IAM">
    **بهترین گزینه برای:** استفاده از اعتبارنامه‌های سازگار با AWS SDK (پیکربندی مشترک، SSO، هویت وب، نقش‌های نمونه یا تسک).

    <Steps>
      <Step title="پیکربندی اعتبارنامه‌های AWS روی میزبان Gateway">
        هر منبع احراز هویت سازگار با AWS SDK کار می‌کند:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="بررسی کشف مدل‌ها">
        ```bash
        openclaw models list
        ```

        OpenClaw به‌طور خودکار از زنجیرهٔ اعتبارنامه، یک توکن حامل Mantle تولید می‌کند.
      </Step>
    </Steps>

    <Tip>
    وقتی `AWS_BEARER_TOKEN_BEDROCK` تنظیم نشده باشد، OpenClaw توکن حامل را از زنجیرهٔ اعتبارنامهٔ پیش‌فرض AWS برای شما صادر می‌کند؛ از جمله اعتبارنامه‌ها/پروفایل‌های پیکربندی مشترک، SSO، هویت وب، و نقش‌های نمونه یا تسک.
    </Tip>

  </Tab>
</Tabs>

## کشف خودکار مدل

وقتی `AWS_BEARER_TOKEN_BEDROCK` تنظیم شده باشد، OpenClaw مستقیما از آن استفاده می‌کند. در غیر این صورت،
OpenClaw تلاش می‌کند از زنجیرهٔ اعتبارنامهٔ پیش‌فرض AWS یک توکن حامل Mantle
تولید کند. سپس با پرس‌وجو از نقطهٔ پایانی `/v1/models` منطقه،
مدل‌های Mantle در دسترس را کشف می‌کند.

| رفتار            | جزئیات                    |
| ---------------- | ------------------------- |
| کش کشف           | نتایج برای ۱ ساعت کش می‌شوند |
| تازه‌سازی توکن IAM | ساعتی                    |

<Note>
توکن حامل همان `AWS_BEARER_TOKEN_BEDROCK` است که ارائه‌دهندهٔ استاندارد [Amazon Bedrock](/fa/providers/bedrock) از آن استفاده می‌کند.
</Note>

### مناطق پشتیبانی‌شده

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## پیکربندی دستی

اگر پیکربندی صریح را به‌جای کشف خودکار ترجیح می‌دهید:

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

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="پشتیبانی از استدلال">
    پشتیبانی از استدلال از شناسه‌های مدل که شامل الگوهایی مانند
    `thinking`، `reasoner` یا `gpt-oss-120b` هستند استنباط می‌شود. OpenClaw هنگام کشف،
    برای مدل‌های منطبق به‌طور خودکار `reasoning: true` را تنظیم می‌کند.
  </Accordion>

  <Accordion title="در دسترس نبودن نقطهٔ پایانی">
    اگر نقطهٔ پایانی Mantle در دسترس نباشد یا هیچ مدلی برنگرداند، ارائه‌دهنده
    بی‌صدا نادیده گرفته می‌شود. OpenClaw خطا نمی‌دهد؛ سایر ارائه‌دهندگان پیکربندی‌شده
    به‌طور عادی به کار ادامه می‌دهند.
  </Accordion>

  <Accordion title="Claude Opus 4.7 از طریق مسیر Anthropic Messages">
    Mantle همچنین یک مسیر Anthropic Messages ارائه می‌کند که مدل‌های Claude را از همان مسیر جریان‌سازیِ احراز هویت‌شده با توکن حامل عبور می‌دهد. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) از طریق این مسیر با جریان‌سازی متعلق به ارائه‌دهنده قابل فراخوانی است، بنابراین توکن‌های حامل AWS مانند کلیدهای Anthropic API در نظر گرفته نمی‌شوند.

    وقتی یک مدل Anthropic Messages را روی ارائه‌دهندهٔ Mantle پین می‌کنید، OpenClaw برای آن مدل به‌جای `openai-completions` از سطح API مربوط به `anthropic-messages` استفاده می‌کند. احراز هویت همچنان از `AWS_BEARER_TOKEN_BEDROCK` (یا توکن حامل IAM صادرشده) می‌آید.

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ارتباط با ارائه‌دهندهٔ Amazon Bedrock">
    Bedrock Mantle ارائه‌دهنده‌ای جدا از ارائه‌دهندهٔ استاندارد
    [Amazon Bedrock](/fa/providers/bedrock) است. Mantle از یک سطح `/v1`
    سازگار با OpenAI استفاده می‌کند، در حالی که ارائه‌دهندهٔ استاندارد Bedrock از
    API بومی Bedrock استفاده می‌کند.

    هر دو ارائه‌دهنده در صورت وجود، از همان اعتبارنامهٔ `AWS_BEARER_TOKEN_BEDROCK` مشترک استفاده می‌کنند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/fa/providers/bedrock" icon="cloud">
    ارائه‌دهندهٔ بومی Bedrock برای Anthropic Claude، Titan و مدل‌های دیگر.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفادهٔ مجدد از اعتبارنامه.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و نحوهٔ رفع آن‌ها.
  </Card>
</CardGroup>
