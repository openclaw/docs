---
read_when:
    - می‌خواهید OpenClaw را با یک سرور محلی vLLM اجرا کنید
    - شما نقاط پایانی سازگار با OpenAI در مسیر /v1 را با مدل‌های خودتان می‌خواهید
summary: اجرای OpenClaw با vLLM (سرور محلی سازگار با OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T10:44:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM مدل‌های متن‌باز (و برخی مدل‌های سفارشی) را از طریق یک API مبتنی بر HTTP و **سازگار با OpenAI** ارائه می‌کند. OpenClaw با استفاده از API‏ `openai-completions` متصل می‌شود و هنگامی که با `VLLM_API_KEY` این قابلیت را فعال کنید، می‌تواند مدل‌ها را **به‌طور خودکار کشف** کند.

| ویژگی             | مقدار                                      |
| ---------------- | ------------------------------------------ |
| شناسه ارائه‌دهنده | `vllm`                                     |
| API              | `openai-completions` (سازگار با OpenAI)   |
| احراز هویت        | متغیر محیطی `VLLM_API_KEY`                 |
| نشانی پایه پیش‌فرض | `http://127.0.0.1:8000/v1`                 |
| مصرف در جریان‌سازی | پشتیبانی می‌شود (`stream_options.include_usage`) |

## شروع کار

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    نشانی پایه شما باید نقاط پایانی `/v1` را ارائه کند (`/v1/models` و `/v1/chat/completions`). vLLM معمولاً روی نشانی زیر اجرا می‌شود:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    اگر سرور شما احراز هویت را الزامی نمی‌کند، هر مقدار غیرخالی قابل استفاده است:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    آن را با یکی از شناسه‌های مدل vLLM خود جایگزین کنید:

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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

<Tip>
برای راه‌اندازی غیرتعاملی (CI یا اسکریپت‌نویسی)، نشانی پایه، کلید و مدل را مستقیماً وارد کنید:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## کشف مدل (ارائه‌دهنده ضمنی)

هنگامی که `VLLM_API_KEY` تنظیم شده باشد (یا یک نمایه احراز هویت وجود داشته باشد) و `models.providers.vllm` تعریف **نشده** باشد، OpenClaw نشانی `GET http://127.0.0.1:8000/v1/models` را فراخوانی می‌کند و شناسه‌های بازگردانده‌شده را به ورودی‌های مدل تبدیل می‌کند.

<Note>
اگر `models.providers.vllm` را صریحاً تنظیم کنید، OpenClaw فقط از مدل‌هایی استفاده می‌کند که اعلام کرده‌اید. برای اینکه OpenClaw نقطه پایانی `/models` ارائه‌دهنده پیکربندی‌شده را نیز فراخوانی و همه مدل‌های اعلام‌شده vLLM را اضافه کند، `"vllm/*": {}` را به `agents.defaults.models` بیفزایید.
</Note>

## پیکربندی صریح

اگر vLLM روی میزبان یا درگاه دیگری اجرا می‌شود، می‌خواهید `contextWindow` یا `maxTokens` را ثابت کنید، سرور شما به یک کلید واقعی API نیاز دارد، یا به یک نقطه پایانی مورداعتماد در لوپ‌بک، LAN یا Tailscale متصل می‌شوید، آن را صریحاً پیکربندی کنید:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

برای پویا نگه‌داشتن ارائه‌دهنده بدون فهرست‌کردن همه مدل‌ها، یک نویسه عام به فهرست مدل‌های قابل‌مشاهده اضافه کنید:

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
  <Accordion title="Proxy-style behavior">
    با vLLM به‌عنوان یک بخش پشتی سازگار با OpenAI و مبتنی بر پراکسی در مسیر `/v1` رفتار می‌شود، نه یک نقطه پایانی بومی OpenAI:

    | رفتار                                    | اعمال می‌شود؟                         |
    | --------------------------------------- | -------------------------------- |
    | شکل‌دهی بومی درخواست OpenAI             | خیر                               |
    | `service_tier`                          | ارسال نمی‌شود                     |
    | `store` در Responses                    | ارسال نمی‌شود                     |
    | راهنمایی‌های حافظه نهان پرامپت           | ارسال نمی‌شود                     |
    | شکل‌دهی بار سازگاری استدلال OpenAI       | اعمال نمی‌شود                     |
    | سرآیندهای انتساب پنهان OpenClaw          | در نشانی‌های پایه سفارشی تزریق نمی‌شوند |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    برای مدل‌های Qwen، هنگامی که سرور آرگومان‌های کلیدی الگوی گفت‌وگوی Qwen را انتظار دارد، `compat.thinkingFormat: "qwen-chat-template"` را در ردیف مدل تنظیم کنید. این مدل‌ها یک نمایه دودویی `/think` با مقادیر (`off` و `on`) ارائه می‌کنند، زیرا تفکر در الگوی گفت‌وگوی Qwen یک پرچم روشن/خاموش است، نه طیفی از میزان تلاش به سبک OpenAI.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw دستور `/think off` را به ساختار زیر نگاشت می‌کند:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    سطوح تفکر به‌جز `off` مقدار `enable_thinking: true` را ارسال می‌کنند. اگر نقطه پایانی شما در عوض پرچم‌های سطح بالای سبک DashScope را انتظار دارد، برای ارسال `enable_thinking` در ریشه درخواست از `compat.thinkingFormat: "qwen"` استفاده کنید.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    برای مدل‌های `vllm/nemotron-3-*` با تفکر خاموش، Plugin همراه مقادیر زیر را ارسال می‌کند:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    برای سفارشی‌سازی این مقادیر، `chat_template_kwargs` را زیر پارامترهای مدل تنظیم کنید. اگر `params.extra_body.chat_template_kwargs` را نیز تنظیم کنید، آن مقدار اولویت دارد، زیرا `extra_body` آخرین بازنویسی بدنه درخواست است.

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

  <Accordion title="Qwen tool calls appear as text">
    ابتدا تأیید کنید که vLLM با تجزیه‌گر فراخوانی ابزار و الگوی گفت‌وگوی مناسب مدل راه‌اندازی شده است. مستندات vLLM استفاده از `hermes` را برای مدل‌های Qwen2.5 و `qwen3_xml` را برای مدل‌های Qwen3-Coder مشخص می‌کنند.

    نشانه‌ها: Skills یا ابزارها هرگز اجرا نمی‌شوند، دستیار JSON یا XML خامی مانند `{"name":"read","arguments":...}` را چاپ می‌کند، یا هنگامی که OpenClaw مقدار `tool_choice: "auto"` را ارسال می‌کند، vLLM یک آرایه خالی `tool_calls` برمی‌گرداند.

    برخی ترکیب‌های Qwen و vLLM تنها هنگامی فراخوانی‌های ساخت‌یافته ابزار را برمی‌گردانند که درخواست از `tool_choice: "required"` استفاده کند. با `params.extra_body` آن را برای هر مدل اجباری کنید:

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

    شناسه مدل را با شناسه دقیق خروجی `openclaw models list --provider vllm` جایگزین کنید، یا همان بازنویسی را از CLI اعمال کنید:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    این یک راه‌حل موقت اختیاری است: هر نوبت دارای ابزار را مجبور به فراخوانی یک ابزار می‌کند؛ بنابراین فقط برای یک ورودی اختصاصی مدل که این رفتار در آن پذیرفتنی است از آن استفاده کنید. آن را به‌عنوان پیش‌فرض سراسری همه مدل‌های vLLM تنظیم نکنید و با پراکسی‌ای که متن دلخواه دستیار را به فراخوانی‌های اجرایی ابزار تبدیل می‌کند همراه نسازید.

  </Accordion>

  <Accordion title="Custom base URL">
    اگر سرور vLLM شما روی میزبان یا درگاهی غیرپیش‌فرض اجرا می‌شود، `baseUrl` را در پیکربندی صریح ارائه‌دهنده تنظیم کنید:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
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
  <Accordion title="Slow first response or remote server timeout">
    برای مدل‌های محلی بزرگ، میزبان‌های راه‌دور LAN یا پیوندهای تیل‌نت، یک مهلت درخواست در سطح ارائه‌دهنده تنظیم کنید:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` فقط بر درخواست‌های HTTP مدل vLLM اعمال می‌شود: برقراری اتصال، سرآیندهای پاسخ، جریان‌سازی بدنه و لغو کلی واکشی محافظت‌شده. همچنین سقف زمان‌سنج نظارت بر بیکاری یا جریان LLM را از مقدار پیش‌فرض ضمنی حدود ۱۲۰ ثانیه برای این ارائه‌دهنده بالاتر می‌برد. این روش را به افزایش `agents.defaults.timeoutSeconds` ترجیح دهید، زیرا آن گزینه کل اجرای عامل را کنترل می‌کند.

  </Accordion>

  <Accordion title="Server not reachable">
    بررسی کنید که سرور vLLM در حال اجرا و قابل‌دسترسی باشد:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    اگر خطای اتصال مشاهده کردید، میزبان، درگاه و راه‌اندازی‌شدن vLLM در حالت سرور سازگار با OpenAI را بررسی کنید. OpenClaw برای درخواست‌های محافظت‌شده مدل در نقاط پایانی لوپ‌بک، LAN و Tailscale، مبدأ دقیق `models.providers.vllm.baseUrl` پیکربندی‌شده را مورداعتماد می‌داند. مبدأهای فراداده یا پیوند-محلی بدون فعال‌سازی صریح همچنان مسدود می‌مانند. فقط هنگامی `models.providers.vllm.request.allowPrivateNetwork: true` را تنظیم کنید که درخواست‌های vLLM باید به مبدأ خصوصی دیگری دسترسی پیدا کنند؛ برای انصراف از اعتماد به مبدأ دقیق، مقدار آن را `false` قرار دهید.

  </Accordion>

  <Accordion title="Auth errors on requests">
    اگر درخواست‌ها با خطاهای احراز هویت شکست می‌خورند، یک `VLLM_API_KEY` واقعی مطابق با پیکربندی سرور خود تنظیم کنید، یا ارائه‌دهنده را به‌طور صریح زیر `models.providers.vllm` پیکربندی کنید.

    <Tip>
    اگر سرور vLLM شما احراز هویت را الزامی نمی‌کند، هر مقدار غیرخالی برای `VLLM_API_KEY` به‌عنوان نشانه فعال‌سازی اختیاری OpenClaw قابل استفاده است.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    کشف خودکار مستلزم تنظیم‌بودن `VLLM_API_KEY` است. اگر `models.providers.vllm` را تعریف کرده باشید، OpenClaw فقط از مدل‌های اعلام‌شده شما استفاده می‌کند، مگر اینکه `agents.defaults.models` شامل `"vllm/*": {}` باشد.
  </Accordion>

  <Accordion title="Tools render as raw text">
    اگر یک مدل Qwen به‌جای اجرای یک Skill، نحو ابزار را به‌صورت JSON یا XML چاپ می‌کند:

    - vLLM را با تجزیه‌گر یا الگوی صحیح آن مدل راه‌اندازی کنید.
    - شناسه دقیق مدل را با `openclaw models list --provider vllm` تأیید کنید.
    - فقط اگر `tool_choice: "auto"` همچنان فراخوانی ابزار خالی یا صرفاً متنی برمی‌گرداند، یک بازنویسی اختصاصی `params.extra_body.tool_choice: "required"` برای همان مدل اضافه کنید.

  </Accordion>
</AccordionGroup>

<Warning>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Warning>

## مطالب مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جابه‌جایی هنگام خرابی.
  </Card>
  <Card title="OpenAI" href="/fa/providers/openai" icon="bolt">
    ارائه‌دهنده بومی OpenAI و رفتار مسیر سازگار با OpenAI.
  </Card>
  <Card title="OAuth and auth" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده مجدد از اعتبارنامه‌ها.
  </Card>
  <Card title="Troubleshooting" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و روش برطرف‌کردن آن‌ها.
  </Card>
</CardGroup>
