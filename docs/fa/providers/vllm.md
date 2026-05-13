---
read_when:
    - می‌خواهید OpenClaw را با یک سرور محلی vLLM اجرا کنید
    - شما نقاط پایانی /v1 سازگار با OpenAI را با مدل‌های خودتان می‌خواهید
summary: اجرای OpenClaw با vLLM (سرور محلی سازگار با OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-05-13T05:34:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b58fc0694fa9629ae87b6958d1ab39e484d468e6f92346f39f55316dbc09a04
    source_path: providers/vllm.md
    workflow: 16
---

vLLM می‌تواند مدل‌های متن‌باز (و برخی مدل‌های سفارشی) را از طریق یک API HTTP **سازگار با OpenAI** ارائه کند. OpenClaw با استفاده از API‏ `openai-completions` به vLLM متصل می‌شود.

OpenClaw همچنین می‌تواند وقتی با `VLLM_API_KEY` آن را فعال می‌کنید، مدل‌های در دسترس را از vLLM **به‌صورت خودکار کشف کند** (اگر سرور شما احراز هویت را اعمال نمی‌کند، هر مقداری کار می‌کند). وقتی یک URL پایهٔ سفارشی برای vLLM نیز پیکربندی می‌کنید، از `vllm/*` در `agents.defaults.models` استفاده کنید تا کشف مدل پویا بماند.

OpenClaw‏ `vllm` را به‌عنوان یک ارائه‌دهندهٔ محلی سازگار با OpenAI در نظر می‌گیرد که از
حسابداری مصرف در جریان پخش پشتیبانی می‌کند، بنابراین شمارش توکن‌های وضعیت/زمینه می‌تواند از
پاسخ‌های `stream_options.include_usage` به‌روزرسانی شود.

| ویژگی            | مقدار                                    |
| ---------------- | ---------------------------------------- |
| شناسهٔ ارائه‌دهنده | `vllm`                                   |
| API              | `openai-completions` (سازگار با OpenAI) |
| احراز هویت       | متغیر محیطی `VLLM_API_KEY`               |
| URL پایهٔ پیش‌فرض | `http://127.0.0.1:8000/v1`               |

## شروع کار

<Steps>
  <Step title="شروع vLLM با یک سرور سازگار با OpenAI">
    URL پایهٔ شما باید نقاط پایانی `/v1` را ارائه کند (مثلاً `/v1/models`، `/v1/chat/completions`). vLLM معمولاً روی این نشانی اجرا می‌شود:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="تنظیم متغیر محیطی کلید API">
    اگر سرور شما احراز هویت را اعمال نمی‌کند، هر مقداری کار می‌کند:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="انتخاب یک مدل">
    با یکی از شناسه‌های مدل vLLM خود جایگزین کنید:

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
  <Step title="بررسی در دسترس بودن مدل">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## کشف مدل (ارائه‌دهندهٔ ضمنی)

وقتی `VLLM_API_KEY` تنظیم شده باشد (یا یک نمایهٔ احراز هویت وجود داشته باشد) و شما `models.providers.vllm` را تعریف **نکرده باشید**، OpenClaw این نشانی را پرس‌وجو می‌کند:

```
GET http://127.0.0.1:8000/v1/models
```

و شناسه‌های برگشتی را به ورودی‌های مدل تبدیل می‌کند.

<Note>
اگر `models.providers.vllm` را صریحاً تنظیم کنید، OpenClaw به‌طور پیش‌فرض از مدل‌های اعلام‌شدهٔ شما استفاده می‌کند. وقتی می‌خواهید OpenClaw نقطهٔ پایانی `/models` همان ارائه‌دهندهٔ پیکربندی‌شده را پرس‌وجو کند و همهٔ مدل‌های اعلام‌شدهٔ vLLM را شامل کند، `"vllm/*": {}` را به `agents.defaults.models` اضافه کنید.
</Note>

## پیکربندی صریح (مدل‌های دستی)

از پیکربندی صریح استفاده کنید وقتی:

- vLLM روی میزبان یا درگاه متفاوتی اجرا می‌شود
- می‌خواهید مقادیر `contextWindow` یا `maxTokens` را ثابت کنید
- سرور شما به یک کلید API واقعی نیاز دارد (یا می‌خواهید سرآیندها را کنترل کنید)
- به یک نقطهٔ پایانی بازگشتی، LAN، یا Tailscale قابل اعتماد برای vLLM متصل می‌شوید

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

برای پویا نگه داشتن این ارائه‌دهنده بدون فهرست کردن دستی همهٔ مدل‌ها، یک
نویسهٔ عام ارائه‌دهنده به فهرست نمایان مدل اضافه کنید:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="رفتار سبک پراکسی">
    vLLM به‌عنوان یک پشتانهٔ `/v1` سبک پراکسی و سازگار با OpenAI در نظر گرفته می‌شود، نه یک نقطهٔ پایانی بومی
    OpenAI. یعنی:

    | رفتار | اعمال می‌شود؟ |
    |----------|----------|
    | شکل‌دهی درخواست بومی OpenAI | خیر |
    | `service_tier` | ارسال نمی‌شود |
    | `store` پاسخ‌ها | ارسال نمی‌شود |
    | راهنماهای کش اعلان | ارسال نمی‌شود |
    | شکل‌دهی بار دادهٔ سازگار با استدلال OpenAI | اعمال نمی‌شود |
    | سرآیندهای انتساب پنهان OpenClaw | روی URLهای پایهٔ سفارشی تزریق نمی‌شود |

  </Accordion>

  <Accordion title="کنترل‌های تفکر Qwen">
    برای مدل‌های Qwen که از طریق vLLM ارائه می‌شوند، وقتی سرور انتظار kwargs قالب گفت‌وگوی Qwen را دارد،
    `params.qwenThinkingFormat: "chat-template"` را روی ورودی مدل تنظیم کنید. OpenClaw‏ `/think off` را به این تبدیل می‌کند:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    سطح‌های تفکر غیر از `off` مقدار `enable_thinking: true` را ارسال می‌کنند. اگر نقطهٔ پایانی شما
    در عوض انتظار پرچم‌های سطح‌بالای سبک DashScope را دارد، از
    `params.qwenThinkingFormat: "top-level"` استفاده کنید تا `enable_thinking` در ریشهٔ
    درخواست ارسال شود. حالت snake-case یعنی `params.qwen_thinking_format` نیز پذیرفته می‌شود.

  </Accordion>

  <Accordion title="کنترل‌های تفکر Nemotron 3">
    vLLM/Nemotron 3 می‌تواند از kwargs قالب گفت‌وگو برای کنترل این‌که استدلال
    به‌صورت استدلال پنهان یا متن پاسخ نمایان برگردانده شود استفاده کند. وقتی یک نشست OpenClaw
    از `vllm/nemotron-3-*` با تفکر خاموش استفاده می‌کند، Plugin همراه vLLM این را ارسال می‌کند:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    برای سفارشی‌سازی این مقادیر، `chat_template_kwargs` را زیر پارامترهای مدل تنظیم کنید.
    اگر `params.extra_body.chat_template_kwargs` را نیز تنظیم کنید، آن مقدار
    تقدم نهایی را دارد، چون `extra_body` آخرین بازنویسی بدنهٔ درخواست است.

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
    ابتدا مطمئن شوید vLLM با تجزیه‌گر فراخوانی ابزار و قالب گفت‌وگوی درست
    برای مدل شروع شده است. برای مثال، مستندات vLLM‏ `hermes` را برای مدل‌های Qwen2.5
    و `qwen3_xml` را برای مدل‌های Qwen3-Coder ذکر می‌کند.

    نشانه‌ها:

    - Skills یا ابزارها هرگز اجرا نمی‌شوند
    - دستیار JSON/XML خامی مانند `{"name":"read","arguments":...}` چاپ می‌کند
    - وقتی OpenClaw مقدار `tool_choice: "auto"` را ارسال می‌کند، vLLM یک آرایهٔ `tool_calls` خالی برمی‌گرداند

    برخی ترکیب‌های Qwen/vLLM فقط زمانی فراخوانی‌های ابزار ساختاریافته برمی‌گردانند که
    درخواست از `tool_choice: "required"` استفاده کند. برای آن ورودی‌های مدل، فیلد درخواست
    سازگار با OpenAI را با `params.extra_body` اجباری کنید:

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

    `Qwen-Qwen2.5-Coder-32B-Instruct` را با شناسهٔ دقیقی که این دستور برمی‌گرداند جایگزین کنید:

    ```bash
    openclaw models list --provider vllm
    ```

    می‌توانید همین بازنویسی را از CLI اعمال کنید:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    این یک راهکار سازگاری اختیاری است. باعث می‌شود هر نوبت مدل با
    ابزارها به یک فراخوانی ابزار نیاز داشته باشد، بنابراین فقط برای یک ورودی مدل محلی اختصاصی
    که این رفتار در آن پذیرفتنی است از آن استفاده کنید. آن را به‌عنوان پیش‌فرض سراسری برای همهٔ
    مدل‌های vLLM به کار نبرید، و از پراکسی‌ای استفاده نکنید که کورکورانه متن دلخواه
    دستیار را به فراخوانی‌های ابزار اجرایی تبدیل می‌کند.

  </Accordion>

  <Accordion title="URL پایهٔ سفارشی">
    اگر سرور vLLM شما روی میزبان یا درگاه غیرپیش‌فرض اجرا می‌شود، `baseUrl` را در پیکربندی صریح ارائه‌دهنده تنظیم کنید:

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
  <Accordion title="کندی نخستین پاسخ یا پایان مهلت سرور دوردست">
    برای مدل‌های محلی بزرگ، میزبان‌های دوردست LAN، یا اتصال‌های Tailscale، یک
    مهلت درخواست در محدودهٔ ارائه‌دهنده تنظیم کنید:

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

    `timeoutSeconds` فقط برای درخواست‌های HTTP مدل vLLM اعمال می‌شود، از جمله
    برقراری اتصال، سرآیندهای پاسخ، پخش بدنه، و لغو کلی
    guarded-fetch. پیش از افزایش
    `agents.defaults.timeoutSeconds` که کل اجرای عامل را کنترل می‌کند، این گزینه را ترجیح دهید.

  </Accordion>

  <Accordion title="سرور قابل دسترسی نیست">
    بررسی کنید که سرور vLLM در حال اجرا و قابل دسترسی باشد:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    اگر خطای اتصال می‌بینید، میزبان، درگاه، و این‌که vLLM با حالت سرور سازگار با OpenAI شروع شده است را بررسی کنید.
    برای نقاط پایانی صریح بازگشتی، LAN، یا Tailscale، همچنین
    `models.providers.vllm.request.allowPrivateNetwork: true` را تنظیم کنید؛ درخواست‌های ارائه‌دهنده
    به‌طور پیش‌فرض URLهای شبکهٔ خصوصی را مسدود می‌کنند، مگر این‌که ارائه‌دهنده
    صریحاً قابل اعتماد اعلام شده باشد.

  </Accordion>

  <Accordion title="خطاهای احراز هویت در درخواست‌ها">
    اگر درخواست‌ها با خطاهای احراز هویت شکست می‌خورند، یک `VLLM_API_KEY` واقعی تنظیم کنید که با پیکربندی سرور شما مطابقت داشته باشد، یا ارائه‌دهنده را صریحاً زیر `models.providers.vllm` پیکربندی کنید.

    <Tip>
    اگر سرور vLLM شما احراز هویت را اعمال نمی‌کند، هر مقدار غیرخالی برای `VLLM_API_KEY` به‌عنوان سیگنال فعال‌سازی اختیاری برای OpenClaw کار می‌کند.
    </Tip>

  </Accordion>

  <Accordion title="هیچ مدلی کشف نشد">
    کشف خودکار نیاز دارد `VLLM_API_KEY` تنظیم شده باشد. اگر `models.providers.vllm` را تعریف کرده باشید، OpenClaw فقط از مدل‌های اعلام‌شدهٔ شما استفاده می‌کند، مگر این‌که `agents.defaults.models` شامل `"vllm/*": {}` باشد.
  </Accordion>

  <Accordion title="ابزارها به‌صورت متن خام نمایش داده می‌شوند">
    اگر یک مدل Qwen به‌جای اجرای Skills، نحو ابزار JSON/XML را چاپ می‌کند،
    راهنمای Qwen در بخش پیکربندی پیشرفتهٔ بالا را بررسی کنید. راه‌حل معمول این است:

    - vLLM را با تجزیه‌گر/قالب درست برای آن مدل شروع کنید
    - شناسهٔ دقیق مدل را با `openclaw models list --provider vllm` تأیید کنید
    - فقط اگر `tool_choice: "auto"` همچنان فراخوانی‌های ابزار خالی یا صرفاً متنی برمی‌گرداند،
      یک بازنویسی اختصاصی برای هر مدل با `params.extra_body.tool_choice: "required"`
      اضافه کنید

  </Accordion>
</AccordionGroup>

<Warning>
کمک بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="OpenAI" href="/fa/providers/openai" icon="bolt">
    ارائه‌دهندهٔ بومی OpenAI و رفتار مسیر سازگار با OpenAI.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفادهٔ دوباره از اعتبارنامه‌ها.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و روش رفع آن‌ها.
  </Card>
</CardGroup>
