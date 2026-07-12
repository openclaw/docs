---
read_when:
    - می‌خواهید OpenClaw را از طریق یک پروکسی LiteLLM مسیریابی کنید
    - شما به ردیابی هزینه، ثبت گزارش یا مسیریابی مدل از طریق LiteLLM نیاز دارید
summary: OpenClaw را از طریق LiteLLM Proxy اجرا کنید تا به دسترسی یکپارچه به مدل‌ها و ردیابی هزینه‌ها دست یابید
title: LiteLLM
x-i18n:
    generated_at: "2026-07-12T10:41:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797b7d02a80a4cd37b92553665e260532af49e011398202d3504a28c511cee2f
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) یک Gateway متن‌باز برای مدل‌های زبانی بزرگ است که API یکپارچه‌ای برای بیش از ۱۰۰ ارائه‌دهندهٔ مدل فراهم می‌کند. OpenClaw را از طریق LiteLLM مسیریابی کنید تا بدون تغییر پیکربندی OpenClaw، هزینه‌ها را به‌صورت متمرکز پایش کنید، رویدادها را ثبت کنید، کلیدهای مجازی با سقف هزینه بسازید و در صورت خرابی، میان سامانه‌های پشتیبان جابه‌جا شوید.

## شروع سریع

<Tabs>
  <Tab title="راه‌اندازی اولیه (توصیه‌شده)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    برای راه‌اندازی غیرتعاملی با یک پراکسی راه‌دور، نشانی پراکسی را صریحاً وارد کنید:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="راه‌اندازی دستی">
    <Steps>
      <Step title="راه‌اندازی پراکسی LiteLLM">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="اتصال OpenClaw به LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## پیکربندی

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

راه‌اندازی اولیه، مدل پیش‌فرض را با مقدار `litellm/claude-opus-4-6` ثبت می‌کند.

## تولید تصویر

LiteLLM می‌تواند ابزار `image_generate` را از طریق مسیرهای سازگار با OpenAI یعنی `/images/generations` و `/images/edits` پشتیبانی کند. مدل پیش‌فرض تصویر `gpt-image-2` است؛ برای انتخاب مدلی دیگر، آن را در `agents.defaults.imageGenerationModel` پیکربندی کنید:

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

نشانی‌های local loopback مربوط به LiteLLM (`http://localhost:4000`، `127.0.0.1`، `::1`، `host.docker.internal`) بدون لغو محدودیت سراسری شبکهٔ خصوصی کار می‌کنند. برای پراکسی میزبانی‌شده در شبکهٔ محلی، مقدار `models.providers.litellm.request.allowPrivateNetwork: true` را تنظیم کنید، زیرا کلید API به آن میزبان ارسال می‌شود.

## پیشرفته

<AccordionGroup>
  <Accordion title="کلیدهای مجازی">
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

    کلید تولیدشده را به‌عنوان `LITELLM_API_KEY` استفاده کنید.

  </Accordion>

  <Accordion title="مسیریابی مدل">
    LiteLLM می‌تواند درخواست‌های مدل را به سامانه‌های پشتیبان مختلف مسیریابی کند. این موارد را در فایل `config.yaml` مربوط به LiteLLM پیکربندی کنید:

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

    OpenClaw همچنان `claude-opus-4-6` را درخواست می‌کند و LiteLLM مسیریابی را انجام می‌دهد.

  </Accordion>

  <Accordion title="مشاهدهٔ میزان استفاده">
    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="نکات مربوط به رفتار پراکسی">
    - LiteLLM به‌طور پیش‌فرض روی `http://localhost:4000` اجرا می‌شود.
    - OpenClaw از طریق نقطهٔ پایانی `/v1` سازگار با OpenAI و به‌سبک پراکسی LiteLLM متصل می‌شود.
    - شکل‌دهی درخواست‌های مختص OpenAI بومی از طریق نشانی پایهٔ پیکربندی‌شدهٔ LiteLLM اعمال نمی‌شود:
      بدون `service_tier`، بدون `store` مربوط به Responses، بدون راهنمایی‌های حافظهٔ نهان پرامپت و بدون
      شکل‌دهی بدنهٔ درخواست برای میزان استدلال OpenAI.
    - سرآیندهای پنهان انتساب OpenClaw (`originator`، `version`، `User-Agent`) فقط به نقاط پایانی بومی و
      تأییدشدهٔ OpenAI ارسال می‌شوند؛ بنابراین به نشانی پایهٔ سفارشی LiteLLM تزریق نمی‌شوند.
  </Accordion>
</AccordionGroup>

<Note>
برای پیکربندی عمومی ارائه‌دهندگان و رفتار جابه‌جایی هنگام خرابی، به [ارائه‌دهندگان مدل](/fa/concepts/model-providers) مراجعه کنید.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="مستندات LiteLLM" href="https://docs.litellm.ai" icon="book">
    مستندات رسمی LiteLLM و مرجع API.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همهٔ ارائه‌دهندگان، ارجاع‌های مدل و رفتار جابه‌جایی هنگام خرابی.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی.
  </Card>
  <Card title="مدل‌ها" href="/fa/concepts/models" icon="brain">
    نحوهٔ انتخاب و پیکربندی مدل‌ها.
  </Card>
</CardGroup>
