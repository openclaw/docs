---
read_when:
    - می‌خواهید OpenClaw را با یک سرور محلی vLLM اجرا کنید
    - شما نقاط پایانی /v1 سازگار با OpenAI را با مدل‌های خودتان می‌خواهید
summary: اجرای OpenClaw با vLLM (سرور محلی سازگار با OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-29T23:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM می‌تواند مدل‌های متن‌باز (و برخی مدل‌های سفارشی) را از طریق یک API HTTP **سازگار با OpenAI** سرو کند. OpenClaw با استفاده از API `openai-completions` به vLLM متصل می‌شود.

OpenClaw همچنین وقتی با `VLLM_API_KEY` فعال کنید (اگر سرور شما احراز هویت را اعمال نمی‌کند هر مقداری کار می‌کند) و ورودی صریح `models.providers.vllm` تعریف نکرده باشید، می‌تواند مدل‌های موجود را به‌صورت **خودکار کشف** کند.

OpenClaw با `vllm` به‌عنوان یک ارائه‌دهنده محلی سازگار با OpenAI رفتار می‌کند که از حسابداری مصرف جریانی پشتیبانی می‌کند، بنابراین شمارش توکن‌های وضعیت/زمینه می‌تواند از پاسخ‌های `stream_options.include_usage` به‌روزرسانی شود.

| ویژگی | مقدار |
| ---------------- | ---------------------------------------- |
| شناسه ارائه‌دهنده | `vllm` |
| API | `openai-completions` (سازگار با OpenAI) |
| احراز هویت | متغیر محیطی `VLLM_API_KEY` |
| نشانی پایه پیش‌فرض | `http://127.0.0.1:8000/v1` |

## شروع به کار

<Steps>
  <Step title="vLLM را با یک سرور سازگار با OpenAI راه‌اندازی کنید">
    نشانی پایه شما باید endpointهای `/v1` را ارائه کند (برای مثال `/v1/models`، `/v1/chat/completions`). vLLM معمولا روی این نشانی اجرا می‌شود:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="متغیر محیطی کلید API را تنظیم کنید">
    اگر سرور شما احراز هویت را اعمال نمی‌کند، هر مقداری کار می‌کند:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="یک مدل انتخاب کنید">
    با یکی از شناسه‌های مدل vLLM خودتان جایگزین کنید:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="در دسترس بودن مدل را بررسی کنید">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## کشف مدل (ارائه‌دهنده ضمنی)

وقتی `VLLM_API_KEY` تنظیم شده باشد (یا یک پروفایل احراز هویت وجود داشته باشد) و `models.providers.vllm` را تعریف **نکرده باشید**، OpenClaw این درخواست را می‌فرستد:

```
GET http://127.0.0.1:8000/v1/models
```

و شناسه‌های برگشتی را به ورودی‌های مدل تبدیل می‌کند.

<Note>
اگر `models.providers.vllm` را به‌صورت صریح تنظیم کنید، کشف خودکار نادیده گرفته می‌شود و باید مدل‌ها را دستی تعریف کنید.
</Note>

## پیکربندی صریح (مدل‌های دستی)

از پیکربندی صریح استفاده کنید وقتی:

- vLLM روی میزبان یا درگاه دیگری اجرا می‌شود
- می‌خواهید مقادیر `contextWindow` یا `maxTokens` را ثابت کنید
- سرور شما به یک کلید API واقعی نیاز دارد (یا می‌خواهید headerها را کنترل کنید)
- به یک endpoint قابل اعتماد loopback، LAN، یا Tailscale برای vLLM متصل می‌شوید

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="رفتار به سبک پروکسی">
    با vLLM به‌عنوان یک backend سازگار با OpenAI و به سبک پروکسی برای `/v1` رفتار می‌شود، نه یک endpoint بومی OpenAI. یعنی:

    | رفتار | اعمال می‌شود؟ |
    |----------|----------|
    | شکل‌دهی درخواست بومی OpenAI | خیر |
    | `service_tier` | ارسال نمی‌شود |
    | `store` در Responses | ارسال نمی‌شود |
    | راهنمایی‌های prompt-cache | ارسال نمی‌شود |
    | شکل‌دهی payload سازگاری reasoning در OpenAI | اعمال نمی‌شود |
    | headerهای پنهان انتساب OpenClaw | روی نشانی‌های پایه سفارشی تزریق نمی‌شود |

  </Accordion>

  <Accordion title="کنترل‌های تفکر Qwen">
    برای مدل‌های Qwen که از طریق vLLM سرو می‌شوند، وقتی سرور kwargs قالب گفت‌وگوی Qwen را انتظار دارد، روی ورودی مدل `params.qwenThinkingFormat: "chat-template"` را تنظیم کنید. OpenClaw مقدار `/think off` را به این تبدیل می‌کند:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    سطح‌های تفکر غیر از `off` مقدار `enable_thinking: true` را ارسال می‌کنند. اگر endpoint شما در عوض flagهای سطح بالای سبک DashScope را انتظار دارد، از `params.qwenThinkingFormat: "top-level"` استفاده کنید تا `enable_thinking` در ریشه درخواست ارسال شود. شکل snake-case یعنی `params.qwen_thinking_format` نیز پذیرفته می‌شود.

  </Accordion>

  <Accordion title="کنترل‌های تفکر Nemotron 3">
    vLLM/Nemotron 3 می‌تواند از kwargs قالب گفت‌وگو استفاده کند تا کنترل کند reasoning به‌صورت reasoning پنهان برگردانده شود یا متن پاسخ قابل مشاهده. وقتی یک نشست OpenClaw از `vllm/nemotron-3-*` با تفکر خاموش استفاده می‌کند، Plugin همراه vLLM این را ارسال می‌کند:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    برای سفارشی‌سازی این مقادیر، `chat_template_kwargs` را زیر پارامترهای مدل تنظیم کنید. اگر `params.extra_body.chat_template_kwargs` را نیز تنظیم کنید، آن مقدار اولویت نهایی دارد چون `extra_body` آخرین override بدنه درخواست است.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="فراخوانی‌های ابزار Qwen به‌صورت متن ظاهر می‌شوند">
    ابتدا مطمئن شوید vLLM با parser فراخوانی ابزار و قالب گفت‌وگوی درست برای مدل راه‌اندازی شده است. برای مثال، مستندات vLLM برای مدل‌های Qwen2.5 از `hermes` و برای مدل‌های Qwen3-Coder از `qwen3_xml` نام می‌برد.

    نشانه‌ها:

    - skills یا ابزارها هرگز اجرا نمی‌شوند
    - دستیار JSON/XML خامی مانند `{"name":"read","arguments":...}` را چاپ می‌کند
    - وقتی OpenClaw مقدار `tool_choice: "auto"` را می‌فرستد، vLLM یک آرایه خالی `tool_calls` برمی‌گرداند

    برخی ترکیب‌های Qwen/vLLM فقط وقتی فراخوانی ابزار ساخت‌یافته برمی‌گردانند که درخواست از `tool_choice: "required"` استفاده کند. برای آن ورودی‌های مدل، فیلد درخواست سازگار با OpenAI را با `params.extra_body` اجباری کنید:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    `Qwen-Qwen2.5-Coder-32B-Instruct` را با شناسه دقیقی که این دستور برمی‌گرداند جایگزین کنید:

    ```bash
    openclaw models list --provider vllm
    ```

    می‌توانید همین override را از CLI اعمال کنید:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    این یک راهکار سازگاری اختیاری است. باعث می‌شود هر نوبت مدل همراه با ابزارها به یک فراخوانی ابزار نیاز داشته باشد، بنابراین فقط برای یک ورودی مدل محلی اختصاصی که این رفتار در آن قابل قبول است از آن استفاده کنید. از آن به‌عنوان پیش‌فرض سراسری برای همه مدل‌های vLLM استفاده نکنید، و از پروکسی‌ای استفاده نکنید که متن دلخواه دستیار را کورکورانه به فراخوانی‌های ابزار قابل اجرا تبدیل می‌کند.

  </Accordion>

  <Accordion title="نشانی پایه سفارشی">
    اگر سرور vLLM شما روی میزبان یا درگاه غیرپیش‌فرض اجرا می‌شود، `baseUrl` را در پیکربندی ارائه‌دهنده صریح تنظیم کنید:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="کندی اولین پاسخ یا timeout سرور راه دور">
    برای مدل‌های محلی بزرگ، میزبان‌های LAN راه دور، یا لینک‌های tailnet، یک timeout درخواست در محدوده ارائه‌دهنده تنظیم کنید:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` فقط برای درخواست‌های HTTP مدل vLLM اعمال می‌شود، از جمله برپایی اتصال، headerهای پاسخ، streaming بدنه، و abort کلی guarded-fetch. این را پیش از افزایش `agents.defaults.timeoutSeconds` ترجیح دهید؛ گزینه اخیر کل اجرای عامل را کنترل می‌کند.

  </Accordion>

  <Accordion title="سرور قابل دسترسی نیست">
    بررسی کنید سرور vLLM در حال اجرا و قابل دسترسی باشد:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    اگر خطای اتصال می‌بینید، میزبان، درگاه، و اینکه vLLM با حالت سرور سازگار با OpenAI شروع شده است را بررسی کنید.
    برای endpointهای صریح loopback، LAN، یا Tailscale، همچنین `models.providers.vllm.request.allowPrivateNetwork: true` را تنظیم کنید؛ درخواست‌های ارائه‌دهنده به‌صورت پیش‌فرض URLهای شبکه خصوصی را مسدود می‌کنند مگر اینکه ارائه‌دهنده به‌صورت صریح مورد اعتماد باشد.

  </Accordion>

  <Accordion title="خطاهای احراز هویت در درخواست‌ها">
    اگر درخواست‌ها با خطاهای احراز هویت شکست می‌خورند، یک `VLLM_API_KEY` واقعی تنظیم کنید که با پیکربندی سرور شما مطابقت داشته باشد، یا ارائه‌دهنده را به‌صورت صریح زیر `models.providers.vllm` پیکربندی کنید.

    <Tip>
    اگر سرور vLLM شما احراز هویت را اعمال نمی‌کند، هر مقدار غیرخالی برای `VLLM_API_KEY` به‌عنوان سیگنال فعال‌سازی اختیاری برای OpenClaw کار می‌کند.
    </Tip>

  </Accordion>

  <Accordion title="هیچ مدلی کشف نشد">
    کشف خودکار نیاز دارد `VLLM_API_KEY` تنظیم شده باشد **و** هیچ ورودی پیکربندی صریح `models.providers.vllm` وجود نداشته باشد. اگر ارائه‌دهنده را دستی تعریف کرده باشید، OpenClaw کشف را نادیده می‌گیرد و فقط از مدل‌های اعلام‌شده شما استفاده می‌کند.
  </Accordion>

  <Accordion title="ابزارها به‌صورت متن خام رندر می‌شوند">
    اگر یک مدل Qwen به‌جای اجرای یک skill، نحو ابزار JSON/XML را چاپ می‌کند، راهنمای Qwen در پیکربندی پیشرفته بالا را بررسی کنید. راه‌حل معمول این است:

    - vLLM را با parser/قالب درست برای آن مدل راه‌اندازی کنید
    - شناسه دقیق مدل را با `openclaw models list --provider vllm` تایید کنید
    - فقط اگر `tool_choice: "auto"` همچنان فراخوانی‌های ابزار خالی یا فقط متنی برمی‌گرداند، یک override اختصاصی برای هر مدل با `params.extra_body.tool_choice: "required"` اضافه کنید

  </Accordion>
</AccordionGroup>

<Warning>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [سوالات متداول](/fa/help/faq).
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="OpenAI" href="/fa/providers/openai" icon="bolt">
    ارائه‌دهنده بومی OpenAI و رفتار مسیر سازگار با OpenAI.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده دوباره از اعتبارنامه‌ها.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و روش حل آن‌ها.
  </Card>
</CardGroup>
