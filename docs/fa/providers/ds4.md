---
read_when:
    - می‌خواهید OpenClaw را در برابر antirez/ds4 اجرا کنید
    - یک بک‌اند محلی DeepSeek V4 Flash با فراخوانی ابزارها می‌خواهید
    - شما به پیکربندی OpenClaw برای ds4-server نیاز دارید
summary: اجرای OpenClaw از طریق ds4، یک سرور محلی سازگار با OpenAI برای DeepSeek V4 Flash
title: ds4
x-i18n:
    generated_at: "2026-07-12T10:40:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4)، مدل DeepSeek V4 Flash را از طریق یک بک‌اند محلی
Metal با API سازگار با OpenAI در مسیر `/v1` ارائه می‌کند. OpenClaw از طریق خانوادهٔ
عمومی ارائه‌دهندگان `openai-completions` به ds4 متصل می‌شود.

ds4 یک Plugin ارائه‌دهندهٔ همراه OpenClaw نیست. آن را در
`models.providers.ds4` پیکربندی کنید، سپس `ds4/deepseek-v4-flash` را انتخاب کنید.

| ویژگی              | مقدار                                                     |
| ------------------ | --------------------------------------------------------- |
| شناسهٔ ارائه‌دهنده | `ds4`                                                     |
| Plugin             | ندارد (فقط پیکربندی)                                      |
| API                | Chat Completions سازگار با OpenAI (`openai-completions`) |
| نشانی پایه         | `http://127.0.0.1:18000/v1` (پیشنهادی)                   |
| شناسهٔ مدل         | `deepseek-v4-flash`                                       |
| فراخوانی ابزارها   | `tools` / `tool_calls` به سبک OpenAI                      |
| استدلال            | `thinking` و `reasoning_effort` به سبک DeepSeek           |

## الزامات

- macOS با پشتیبانی از Metal.
- یک نسخهٔ کاری از مخزن ds4 شامل `ds4-server` و فایل GGUF مدل DeepSeek V4 Flash.
- حافظهٔ کافی برای زمینه‌ای که انتخاب می‌کنید؛ مقادیر بزرگ‌تر `--ctx` هنگام راه‌اندازی
  سرور حافظهٔ KV بیشتری تخصیص می‌دهند.

<Warning>
نوبت‌های عامل OpenClaw شامل طرح‌واره‌های ابزار و زمینهٔ فضای کاری هستند. یک زمینهٔ
کوچک مانند `--ctx 4096` ممکن است آزمون‌های مستقیم curl را با موفقیت پشت سر بگذارد،
اما اجرای کامل عامل با خطای `500 prompt exceeds context` شکست بخورد. برای آزمون‌های
دود عامل و ابزار، دست‌کم از `--ctx 32768` استفاده کنید. فقط در صورت وجود حافظهٔ کافی
و برای فعال‌کردن Think Max در ds4 از `--ctx 393216` استفاده کنید.
</Warning>

## شروع سریع

<Steps>
  <Step title="Start ds4-server">
    `<DS4_DIR>` را با مسیر نسخهٔ مخزن ds4 خود جایگزین کنید.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verify the OpenAI-compatible endpoint">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    پاسخ باید شامل `deepseek-v4-flash` باشد.

  </Step>
  <Step title="Add the OpenClaw provider config">
    پیکربندی بخش [پیکربندی کامل](#full-config) را اضافه کنید، سپس یک بررسی یک‌بارهٔ
    مدل اجرا کنید:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## پیکربندی کامل

هنگامی که ds4 از قبل روی `127.0.0.1:18000` در حال اجرا است، از این پیکربندی استفاده کنید.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`contextWindow` را با `ds4-server --ctx` هماهنگ نگه دارید. `maxTokens` را نیز با
`--tokens` هماهنگ نگه دارید، مگر اینکه عمداً بخواهید OpenClaw خروجی کمتری از مقدار
پیش‌فرض سرور درخواست کند.

## راه‌اندازی هنگام نیاز

OpenClaw می‌تواند ds4 را فقط زمانی راه‌اندازی کند که مدلی از `ds4/...` انتخاب شده باشد.
`localService` را به همان ورودی ارائه‌دهنده اضافه کنید:

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` باید مسیر مطلق یک فایل اجرایی باشد. جست‌وجوی پوسته و بسط `~` استفاده
نمی‌شوند. برای مشاهدهٔ همهٔ فیلدهای `localService` به
[سرویس‌های مدل محلی](/fa/gateway/local-model-services) مراجعه کنید.

## Think Max

ds4 فقط زمانی Think Max را اعمال می‌کند که هر دو شرط زیر برقرار باشند:

- `ds4-server` با `--ctx 393216` یا مقداری بیشتر راه‌اندازی شود.
- درخواست از `reasoning_effort: "max"` (یا فیلد تلاش معادل آن در ds4) استفاده کند.

اگر چنین زمینهٔ بزرگی را اجرا می‌کنید، هم پرچم‌های سرور و هم فرادادهٔ مدل OpenClaw
را به‌روزرسانی کنید:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## آزمون

بررسی مستقیم HTTP با دورزدن OpenClaw:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

مسیریابی مدل OpenClaw (همان بررسی بخش شروع سریع):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

آزمون دود کامل عامل و فراخوانی ابزار، با زمینه‌ای دست‌کم برابر با 32768:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

نتیجهٔ مورد انتظار:

- `executionTrace.winnerProvider` برابر با `ds4` است
- `executionTrace.winnerModel` برابر با `deepseek-v4-flash` است
- `toolSummary.calls` دست‌کم `1` است
- `finalAssistantVisibleText` با `tool-ok` آغاز می‌شود

## عیب‌یابی

<AccordionGroup>
  <Accordion title="curl /v1/models cannot connect">
    ds4 در حال اجرا نیست یا به میزبان/درگاه مشخص‌شده در `baseUrl` متصل نشده است.
    `ds4-server` را راه‌اندازی کنید، سپس دوباره تلاش کنید:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    مقدار پیکربندی‌شدهٔ `--ctx` برای نوبت OpenClaw بیش از حد کوچک است.
    `ds4-server --ctx` را افزایش دهید، سپس
    `models.providers.ds4.models[].contextWindow` را مطابق آن به‌روزرسانی کنید.
    نوبت‌های کامل عامل همراه با ابزارها نسبت به یک درخواست مستقیم curl با یک پیام،
    به زمینهٔ بسیار بیشتری نیاز دارند.
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 فقط زمانی از Think Max استفاده می‌کند که `--ctx` دست‌کم `393216` باشد و
    درخواست `reasoning_effort: "max"` را بخواهد. زمینه‌های کوچک‌تر به استدلال سطح
    بالا بازمی‌گردند.
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 دارای مرحلهٔ استقرار سرد در Metal و گرم‌سازی مدل است. هنگامی که OpenClaw
    سرور را هنگام نیاز راه‌اندازی می‌کند، `localService.readyTimeoutMs: 300000`
    را تنظیم کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Local model services" href="/fa/gateway/local-model-services" icon="play">
    سرورهای مدل محلی را پیش از درخواست‌های مدل و هنگام نیاز راه‌اندازی کنید.
  </Card>
  <Card title="Local models" href="/fa/gateway/local-models" icon="server">
    بک‌اندهای مدل محلی را انتخاب و مدیریت کنید.
  </Card>
  <Card title="Model providers" href="/fa/concepts/model-providers" icon="layers">
    ارجاع‌های ارائه‌دهنده، احراز هویت و جایگزینی هنگام خرابی را پیکربندی کنید.
  </Card>
  <Card title="DeepSeek" href="/fa/providers/deepseek" icon="brain">
    رفتار بومی ارائه‌دهندهٔ DeepSeek و کنترل‌های تفکر.
  </Card>
</CardGroup>
