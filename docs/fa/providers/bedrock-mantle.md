---
read_when:
    - می‌خواهید از مدل‌های متن‌باز میزبانی‌شده با Bedrock Mantle در OpenClaw استفاده کنید
    - برای GPT-OSS، Qwen، Kimi یا GLM به نقطهٔ پایانی سازگار با OpenAI در Mantle نیاز دارید
summary: از مدل‌های Amazon Bedrock Mantle (سازگار با OpenAI) با OpenClaw استفاده کنید
title: لایهٔ Amazon Bedrock
x-i18n:
    generated_at: "2026-05-10T20:02:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw شامل ارائه‌دهنده داخلی **Amazon Bedrock Mantle** است که به
نقطه پایانی سازگار با OpenAI مربوط به Mantle متصل می‌شود. Mantle مدل‌های متن‌باز و
شخص ثالث (GPT-OSS، Qwen، Kimi، GLM و موارد مشابه) را از طریق یک سطح استاندارد
`/v1/chat/completions` میزبانی می‌کند که بر زیرساخت Bedrock تکیه دارد.

| ویژگی       | مقدار                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| شناسه ارائه‌دهنده    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (سازگار با OpenAI) یا `anthropic-messages` (مسیر Anthropic Messages) |
| احراز هویت           | `AWS_BEARER_TOKEN_BEDROCK` صریح یا تولید توکن حامل زنجیره اعتبارنامه IAM         |
| منطقه پیش‌فرض | `us-east-1` (با `AWS_REGION` یا `AWS_DEFAULT_REGION` بازنویسی کنید)                            |

## شروع

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="Explicit bearer token">
    **بهترین برای:** محیط‌هایی که از قبل یک توکن حامل Mantle دارید.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        در صورت تمایل یک منطقه تنظیم کنید (پیش‌فرض `us-east-1` است):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        مدل‌های کشف‌شده زیر ارائه‌دهنده `amazon-bedrock-mantle` نمایش داده می‌شوند. هیچ
        پیکربندی اضافی لازم نیست مگر اینکه بخواهید پیش‌فرض‌ها را بازنویسی کنید.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **بهترین برای:** استفاده از اعتبارنامه‌های سازگار با AWS SDK (پیکربندی مشترک، SSO، هویت وب، نقش‌های نمونه یا وظیفه).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        هر منبع احراز هویت سازگار با AWS SDK کار می‌کند:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw به‌طور خودکار از زنجیره اعتبارنامه یک توکن حامل Mantle تولید می‌کند.
      </Step>
    </Steps>

    <Tip>
    وقتی `AWS_BEARER_TOKEN_BEDROCK` تنظیم نشده باشد، OpenClaw توکن حامل را برای شما از زنجیره اعتبارنامه پیش‌فرض AWS ایجاد می‌کند، از جمله اعتبارنامه‌ها/پروفایل‌های پیکربندی مشترک، SSO، هویت وب، و نقش‌های نمونه یا وظیفه.
    </Tip>

  </Tab>
</Tabs>

## کشف خودکار مدل

وقتی `AWS_BEARER_TOKEN_BEDROCK` تنظیم شده باشد، OpenClaw مستقیماً از آن استفاده می‌کند. در غیر این صورت،
OpenClaw تلاش می‌کند از زنجیره اعتبارنامه پیش‌فرض AWS یک توکن حامل Mantle
تولید کند. سپس با پرس‌وجو از نقطه پایانی `/v1/models` منطقه،
مدل‌های Mantle در دسترس را کشف می‌کند.

| رفتار          | جزئیات                    |
| ----------------- | ------------------------- |
| کش کشف   | نتایج برای ۱ ساعت کش می‌شوند |
| نوسازی توکن IAM | ساعتی                    |

برای فعال نگه داشتن Plugin مربوط به Mantle اما غیرفعال کردن کشف خودکار و تولید
توکن حامل IAM، گزینه کشف متعلق به Plugin را غیرفعال کنید:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
توکن حامل همان `AWS_BEARER_TOKEN_BEDROCK` است که ارائه‌دهنده استاندارد [Amazon Bedrock](/fa/providers/bedrock) از آن استفاده می‌کند.
</Note>

### مناطق پشتیبانی‌شده

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## پیکربندی دستی

اگر به‌جای کشف خودکار، پیکربندی صریح را ترجیح می‌دهید:

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
  <Accordion title="Reasoning support">
    پشتیبانی از استدلال از روی شناسه‌های مدل که شامل الگوهایی مانند
    `thinking`، `reasoner` یا `gpt-oss-120b` هستند استنباط می‌شود. OpenClaw هنگام کشف، برای
    مدل‌های منطبق به‌طور خودکار `reasoning: true`
    را تنظیم می‌کند.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    اگر نقطه پایانی Mantle در دسترس نباشد یا هیچ مدلی برنگرداند، ارائه‌دهنده
    بی‌صدا نادیده گرفته می‌شود. OpenClaw خطا نمی‌دهد؛ سایر ارائه‌دهندگان پیکربندی‌شده
    به‌طور عادی به کار خود ادامه می‌دهند.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle همچنین یک مسیر Anthropic Messages ارائه می‌کند که مدل‌های Claude را از همان مسیر پخش جریانی احراز هویت‌شده با توکن حامل عبور می‌دهد. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) از طریق این مسیر با پخش جریانی متعلق به ارائه‌دهنده قابل فراخوانی است، بنابراین توکن‌های حامل AWS مانند کلیدهای API Anthropic در نظر گرفته نمی‌شوند.

    وقتی یک مدل Anthropic Messages را روی ارائه‌دهنده Mantle پین می‌کنید، OpenClaw برای آن مدل به‌جای `openai-completions` از سطح API با نام `anthropic-messages` استفاده می‌کند. احراز هویت همچنان از `AWS_BEARER_TOKEN_BEDROCK` (یا توکن حامل IAM ایجادشده) می‌آید.

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

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle ارائه‌دهنده‌ای جدا از ارائه‌دهنده استاندارد
    [Amazon Bedrock](/fa/providers/bedrock) است. Mantle از یک سطح
    `/v1` سازگار با OpenAI استفاده می‌کند، در حالی که ارائه‌دهنده استاندارد Bedrock از
    API بومی Bedrock استفاده می‌کند.

    هر دو ارائه‌دهنده در صورت وجود، از اعتبارنامه `AWS_BEARER_TOKEN_BEDROCK` مشترک استفاده می‌کنند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/fa/providers/bedrock" icon="cloud">
    ارائه‌دهنده بومی Bedrock برای Anthropic Claude، Titan و مدل‌های دیگر.
  </Card>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار جایگزینی در زمان خرابی.
  </Card>
  <Card title="OAuth and auth" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده دوباره از اعتبارنامه.
  </Card>
  <Card title="Troubleshooting" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و روش رفع آن‌ها.
  </Card>
</CardGroup>
