---
read_when:
    - می‌خواهید از مدل‌های OSS میزبانی‌شده در Bedrock Mantle با OpenClaw استفاده کنید
    - به نقطه پایانی سازگار با OpenAI در Mantle برای GPT-OSS، Qwen، Kimi یا GLM نیاز دارید
summary: از مدل‌های Amazon Bedrock Mantle (سازگار با OpenAI) با OpenClaw استفاده کنید
title: مانتل Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:37:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw شامل ارائه‌دهندهٔ بسته‌بندی‌شدهٔ **Amazon Bedrock Mantle** است که به
نقطهٔ پایانی سازگار با OpenAI در Mantle متصل می‌شود. Mantle مدل‌های متن‌باز و
شخص ثالث (GPT-OSS، Qwen، Kimi، GLM و موارد مشابه) را از طریق سطح استاندارد
`/v1/chat/completions` که با زیرساخت Bedrock پشتیبانی می‌شود، میزبانی می‌کند.

| ویژگی          | مقدار                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| شناسهٔ ارائه‌دهنده | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (سازگار با OpenAI) یا `anthropic-messages` (مسیر Anthropic Messages) |
| احراز هویت     | `AWS_BEARER_TOKEN_BEDROCK` صریح یا تولید توکن حامل از زنجیرهٔ اعتبارنامهٔ IAM         |
| منطقهٔ پیش‌فرض | `us-east-1` (با `AWS_REGION` یا `AWS_DEFAULT_REGION` بازنویسی کنید)                            |

## شروع به کار

روش احراز هویت دلخواه خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="Explicit bearer token">
    **بهترین گزینه برای:** محیط‌هایی که از قبل یک توکن حامل Mantle دارید.

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
      <Step title="Opt in to provider data sharing for Claude Fable 5">
        مدل‌های Claude Fable 5 و Bedrock در کلاس Claude Mythos پیش از فراخوانی به حالت `provider_data_share` در API نگهداشت دادهٔ Mantle نیاز دارند. این اعلام موافقت به Bedrock اجازه می‌دهد درخواست‌ها و تکمیل‌ها را با Anthropic به اشتراک بگذارد و آن‌ها را برای بازبینی اعتماد و ایمنی تا ۳۰ روز نگه دارد.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        اگر نمی‌توانید این حالت نگهداشت را بپذیرید، در پیکربندی از مدل Bedrock دیگری استفاده کنید.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        مدل‌های کشف‌شده زیر ارائه‌دهندهٔ `amazon-bedrock-mantle` ظاهر می‌شوند. هیچ
        پیکربندی اضافه‌ای لازم نیست، مگر اینکه بخواهید پیش‌فرض‌ها را بازنویسی کنید.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **بهترین گزینه برای:** استفاده از اعتبارنامه‌های سازگار با AWS SDK (پیکربندی مشترک، SSO، هویت وب، نقش‌های نمونه یا وظیفه).

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

        OpenClaw به‌طور خودکار از زنجیرهٔ اعتبارنامه، توکن حامل Mantle تولید می‌کند.
      </Step>
    </Steps>

    <Tip>
    وقتی `AWS_BEARER_TOKEN_BEDROCK` تنظیم نشده باشد، OpenClaw توکن حامل را از زنجیرهٔ پیش‌فرض اعتبارنامهٔ AWS برای شما صادر می‌کند؛ از جمله اعتبارنامه‌ها/نمایه‌های پیکربندی مشترک، SSO، هویت وب و نقش‌های نمونه یا وظیفه.
    </Tip>

  </Tab>
</Tabs>

## کشف خودکار مدل

وقتی `AWS_BEARER_TOKEN_BEDROCK` تنظیم شده باشد، OpenClaw مستقیماً از آن استفاده می‌کند. در غیر این صورت،
OpenClaw تلاش می‌کند از زنجیرهٔ پیش‌فرض اعتبارنامهٔ AWS یک توکن حامل Mantle
تولید کند. سپس با پرس‌وجوی نقطهٔ پایانی `/v1/models` منطقه،
مدل‌های Mantle در دسترس را کشف می‌کند.

| رفتار             | جزئیات                    |
| ----------------- | ------------------------- |
| کش کشف            | نتایج برای ۱ ساعت کش می‌شوند |
| نوسازی توکن IAM   | هر ساعت                    |

برای فعال نگه‌داشتن Plugin مربوط به Mantle و هم‌زمان جلوگیری از کشف خودکار و تولید
توکن حامل IAM، سوییچ کشف متعلق به Plugin را غیرفعال کنید:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
توکن حامل همان `AWS_BEARER_TOKEN_BEDROCK` است که ارائه‌دهندهٔ استاندارد [Amazon Bedrock](/fa/providers/bedrock) از آن استفاده می‌کند.
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
    پشتیبانی از reasoning از شناسه‌های مدل که شامل الگوهایی مانند
    `thinking`، `reasoner` یا `gpt-oss-120b` هستند استنباط می‌شود. OpenClaw هنگام کشف،
    برای مدل‌های مطابق به‌طور خودکار `reasoning: true`
    تنظیم می‌کند.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    اگر نقطهٔ پایانی Mantle در دسترس نباشد یا هیچ مدلی برنگرداند، ارائه‌دهنده
    بی‌صدا نادیده گرفته می‌شود. OpenClaw خطا نمی‌دهد؛ سایر ارائه‌دهنده‌های
    پیکربندی‌شده به‌صورت عادی به کار ادامه می‌دهند.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle همچنین یک مسیر Anthropic Messages ارائه می‌کند که مدل‌های Claude را از همان مسیر استریم احراز هویت‌شده با توکن حامل عبور می‌دهد. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) از طریق این مسیر با استریم متعلق به ارائه‌دهنده قابل فراخوانی است، بنابراین توکن‌های حامل AWS مانند کلیدهای API مربوط به Anthropic تلقی نمی‌شوند.

    وقتی یک مدل Anthropic Messages را روی ارائه‌دهندهٔ Mantle ثابت می‌کنید، OpenClaw برای آن مدل به‌جای `openai-completions` از سطح API `anthropic-messages` استفاده می‌کند. احراز هویت همچنان از `AWS_BEARER_TOKEN_BEDROCK` (یا توکن حامل IAM صادرشده) می‌آید.

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
    Bedrock Mantle ارائه‌دهنده‌ای جدا از ارائه‌دهندهٔ استاندارد
    [Amazon Bedrock](/fa/providers/bedrock) است. Mantle از یک سطح
    `/v1` سازگار با OpenAI استفاده می‌کند، در حالی که ارائه‌دهندهٔ استاندارد Bedrock از
    API بومی Bedrock استفاده می‌کند.

    هر دو ارائه‌دهنده در صورت وجود، از همان اعتبارنامهٔ `AWS_BEARER_TOKEN_BEDROCK`
    مشترک استفاده می‌کنند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/fa/providers/bedrock" icon="cloud">
    ارائه‌دهندهٔ بومی Bedrock برای Anthropic Claude، Titan و مدل‌های دیگر.
  </Card>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="OAuth and auth" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفادهٔ دوباره از اعتبارنامه.
  </Card>
  <Card title="Troubleshooting" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و روش حل آن‌ها.
  </Card>
</CardGroup>
