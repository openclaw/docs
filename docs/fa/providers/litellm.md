---
read_when:
    - می‌خواهید OpenClaw را از طریق یک پروکسی LiteLLM مسیریابی کنید
    - به رهگیری هزینه، ثبت لاگ یا مسیریابی مدل از طریق LiteLLM نیاز دارید
summary: OpenClaw را از طریق LiteLLM Proxy برای دسترسی یکپارچه به مدل‌ها و ردیابی هزینه اجرا کنید
title: LiteLLM
x-i18n:
    generated_at: "2026-04-29T23:26:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) یک Gateway متن‌باز برای LLM است که یک API یکپارچه برای بیش از ۱۰۰ ارائه‌دهندهٔ مدل فراهم می‌کند. OpenClaw را از طریق LiteLLM مسیریابی کنید تا ردیابی هزینهٔ متمرکز، ثبت گزارش، و انعطاف‌پذیری برای جابه‌جایی backendها بدون تغییر config OpenClaw را داشته باشید.

<Tip>
**چرا از LiteLLM با OpenClaw استفاده کنیم؟**

- **ردیابی هزینه** — دقیقاً ببینید OpenClaw در همهٔ مدل‌ها چقدر هزینه می‌کند
- **مسیریابی مدل** — بدون تغییر config بین Claude، GPT-4، Gemini و Bedrock جابه‌جا شوید
- **کلیدهای مجازی** — برای OpenClaw کلیدهایی با سقف هزینه بسازید
- **ثبت گزارش** — گزارش کامل درخواست/پاسخ برای اشکال‌زدایی
- **جایگزین‌ها** — failover خودکار اگر ارائه‌دهندهٔ اصلی شما از دسترس خارج شود

</Tip>

## شروع سریع

<Tabs>
  <Tab title="Onboarding (recommended)">
    **بهترین برای:** سریع‌ترین مسیر برای راه‌اندازی عملی LiteLLM.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        برای راه‌اندازی غیرتعاملی در برابر یک proxy راه‌دور، URL مربوط به proxy را صریحاً پاس دهید:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manual setup">
    **بهترین برای:** کنترل کامل روی نصب و config.

    <Steps>
      <Step title="Start LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Point OpenClaw to LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        همین است. OpenClaw اکنون از طریق LiteLLM مسیریابی می‌شود.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## پیکربندی

### متغیرهای محیطی

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### فایل config

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## پیکربندی پیشرفته

### تولید تصویر

LiteLLM می‌تواند از ابزار `image_generate` نیز از طریق مسیرهای سازگار با OpenAI یعنی
`/images/generations` و `/images/edits` پشتیبانی کند. یک مدل تصویر LiteLLM را زیر
`agents.defaults.imageGenerationModel` پیکربندی کنید:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

URLهای LiteLLM از نوع loopback مانند `http://localhost:4000` بدون override سراسری
شبکهٔ خصوصی کار می‌کنند. برای proxy میزبانی‌شده روی LAN،
`models.providers.litellm.request.allowPrivateNetwork: true` را تنظیم کنید، چون API key
به میزبان proxy پیکربندی‌شده ارسال خواهد شد.

<AccordionGroup>
  <Accordion title="Virtual keys">
    برای OpenClaw یک کلید اختصاصی با سقف هزینه بسازید:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    از کلید تولیدشده به‌عنوان `LITELLM_API_KEY` استفاده کنید.

  </Accordion>

  <Accordion title="Model routing">
    LiteLLM می‌تواند درخواست‌های مدل را به backendهای مختلف مسیریابی کند. در `config.yaml` مربوط به LiteLLM پیکربندی کنید:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw همچنان `claude-opus-4-6` را درخواست می‌کند — LiteLLM مسیریابی را انجام می‌دهد.

  </Accordion>

  <Accordion title="Viewing usage">
    داشبورد یا API مربوط به LiteLLM را بررسی کنید:

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy behavior notes">
    - LiteLLM به‌طور پیش‌فرض روی `http://localhost:4000` اجرا می‌شود
    - OpenClaw از طریق endpoint سازگار با OpenAI و proxy-style مربوط به LiteLLM یعنی `/v1`
      وصل می‌شود
    - شکل‌دهی درخواست مخصوص OpenAI بومی از طریق LiteLLM اعمال نمی‌شود:
      نه `service_tier`، نه Responses `store`، نه راهنمایی‌های prompt-cache، و نه
      شکل‌دهی payload سازگاری reasoning مربوط به OpenAI
    - هدرهای attribution پنهان OpenClaw (`originator`، `version`، `User-Agent`)
      روی URLهای پایهٔ سفارشی LiteLLM تزریق نمی‌شوند
  </Accordion>
</AccordionGroup>

<Note>
برای پیکربندی عمومی ارائه‌دهنده و رفتار failover، [ارائه‌دهندگان مدل](/fa/concepts/model-providers) را ببینید.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    مستندات رسمی LiteLLM و مرجع API.
  </Card>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همهٔ ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل config.
  </Card>
  <Card title="Model selection" href="/fa/concepts/models" icon="brain">
    نحوهٔ انتخاب و پیکربندی مدل‌ها.
  </Card>
</CardGroup>
