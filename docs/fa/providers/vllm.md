---
read_when:
    - می‌خواهید OpenClaw را در برابر یک سرور محلی vLLM اجرا کنید
    - شما نقاط پایانی سازگار با OpenAI در ‎/v1‎ را با مدل‌های خودتان می‌خواهید
summary: OpenClaw را با vLLM اجرا کنید (سرور محلی سازگار با OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:45:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM می‌تواند مدل‌های متن‌باز (و برخی مدل‌های سفارشی) را از طریق یک API HTTP **سازگار با OpenAI** ارائه کند. OpenClaw با استفاده از API ‏`openai-completions` به vLLM متصل می‌شود.

OpenClaw همچنین می‌تواند مدل‌های در دسترس را از vLLM به‌صورت **خودکار کشف** کند، وقتی با `VLLM_API_KEY` آن را فعال کنید (اگر سرور شما احراز هویت را اعمال نمی‌کند، هر مقداری کار می‌کند). وقتی یک نشانی پایه سفارشی برای vLLM هم پیکربندی می‌کنید، از `vllm/*` در `agents.defaults.models` استفاده کنید تا کشف مدل پویا بماند.

OpenClaw ‏`vllm` را به‌عنوان یک ارائه‌دهنده محلی سازگار با OpenAI در نظر می‌گیرد که از
حسابداری مصرف در حالت جریانی پشتیبانی می‌کند، بنابراین شمارش توکن‌های وضعیت/زمینه می‌تواند از
پاسخ‌های `stream_options.include_usage` به‌روزرسانی شود.

| ویژگی           | مقدار                                      |
| ---------------- | ------------------------------------------ |
| شناسه ارائه‌دهنده | `vllm`                                     |
| API              | `openai-completions` (سازگار با OpenAI)    |
| احراز هویت       | متغیر محیطی `VLLM_API_KEY`                 |
| نشانی پایه پیش‌فرض | `http://127.0.0.1:8000/v1`                 |

## شروع به کار

<Steps>
  <Step title="vLLM را با یک سرور سازگار با OpenAI راه‌اندازی کنید">
    نشانی پایه شما باید endpointهای `/v1` را در دسترس قرار دهد (برای مثال `/v1/models` و `/v1/chat/completions`). vLLM معمولا روی این نشانی اجرا می‌شود:

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
  <Step title="در دسترس بودن مدل را بررسی کنید">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## کشف مدل (ارائه‌دهنده ضمنی)

وقتی `VLLM_API_KEY` تنظیم شده باشد (یا یک نمایه احراز هویت وجود داشته باشد) و شما `models.providers.vllm` را تعریف **نکرده باشید**، OpenClaw این نشانی را پرس‌وجو می‌کند:

```
GET http://127.0.0.1:8000/v1/models
```

و شناسه‌های برگشتی را به ورودی‌های مدل تبدیل می‌کند.

<Note>
اگر `models.providers.vllm` را صریحا تنظیم کنید، OpenClaw به‌صورت پیش‌فرض از مدل‌های اعلام‌شده شما استفاده می‌کند. وقتی می‌خواهید OpenClaw endpoint ‏`/models` آن ارائه‌دهنده پیکربندی‌شده را پرس‌وجو کند و همه مدل‌های اعلام‌شده vLLM را شامل شود، `"vllm/*": {}` را به `agents.defaults.models` اضافه کنید.
</Note>

## پیکربندی صریح (مدل‌های دستی)

وقتی از پیکربندی صریح استفاده کنید که:

- vLLM روی میزبان یا پورت دیگری اجرا می‌شود
- می‌خواهید مقادیر `contextWindow` یا `maxTokens` را ثابت کنید
- سرور شما به یک کلید API واقعی نیاز دارد (یا می‌خواهید headerها را کنترل کنید)
- به یک endpoint مطمئن local loopback، شبکه LAN، یا Tailscale برای vLLM متصل می‌شوید

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
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

برای پویا نگه داشتن این ارائه‌دهنده بدون فهرست‌کردن دستی همه مدل‌ها، یک wildcard
ارائه‌دهنده به کاتالوگ مدل‌های قابل مشاهده اضافه کنید:

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
  <Accordion title="رفتار به سبک پراکسی">
    vLLM به‌عنوان یک backend ‏`/v1` سازگار با OpenAI به سبک پراکسی در نظر گرفته می‌شود، نه یک endpoint بومی
    OpenAI. یعنی:

    | رفتار | اعمال می‌شود؟ |
    |----------|----------|
    | شکل‌دهی درخواست بومی OpenAI | خیر |
    | `service_tier` | ارسال نمی‌شود |
    | `store` پاسخ‌ها | ارسال نمی‌شود |
    | راهنمایی‌های کش پرامپت | ارسال نمی‌شود |
    | شکل‌دهی payload سازگار با reasoning در OpenAI | اعمال نمی‌شود |
    | headerهای پنهان انتساب OpenClaw | روی نشانی‌های پایه سفارشی تزریق نمی‌شود |

  </Accordion>

  <Accordion title="کنترل‌های تفکر Qwen">
    برای مدل‌های Qwen که از طریق vLLM ارائه می‌شوند، وقتی سرور انتظار kwargs مربوط به chat-template در Qwen را دارد،
    روی ردیف مدل ارائه‌دهنده پیکربندی‌شده
    `compat.thinkingFormat: "qwen-chat-template"` را تنظیم کنید. مدل‌هایی که
    به این شکل پیکربندی شده‌اند یک نمایه دودویی `/think` (`off`، `on`) ارائه می‌کنند، چون
    تفکر template در Qwen یک پرچم روشن/خاموش درخواست است، نه یک نردبان effort به سبک OpenAI.

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

    OpenClaw ‏`/think off` را به این نگاشت می‌کند:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    سطح‌های تفکر غیر از `off` مقدار `enable_thinking: true` را ارسال می‌کنند. اگر endpoint شما
    در عوض انتظار پرچم‌های سطح بالای به سبک DashScope را دارد، از
    `compat.thinkingFormat: "qwen"` استفاده کنید تا `enable_thinking` در ریشه درخواست
    ارسال شود.

  </Accordion>

  <Accordion title="کنترل‌های تفکر Nemotron 3">
    vLLM/Nemotron 3 می‌تواند از kwargs مربوط به chat-template استفاده کند تا کنترل کند reasoning
    به‌صورت reasoning پنهان برگردانده شود یا متن پاسخ قابل مشاهده. وقتی یک نشست OpenClaw
    از `vllm/nemotron-3-*` با تفکر خاموش استفاده می‌کند، Plugin داخلی vLLM این را ارسال می‌کند:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    برای سفارشی‌سازی این مقادیر، `chat_template_kwargs` را زیر params مدل تنظیم کنید.
    اگر `params.extra_body.chat_template_kwargs` را هم تنظیم کنید، آن مقدار
    اولویت نهایی دارد چون `extra_body` آخرین بازنویسی بدنه درخواست است.

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

  <Accordion title="فراخوانی ابزارهای Qwen به‌صورت متن ظاهر می‌شوند">
    ابتدا مطمئن شوید vLLM با parser فراخوانی ابزار و chat template درست برای مدل راه‌اندازی شده است.
    برای مثال، مستندات vLLM برای مدل‌های Qwen2.5 مقدار `hermes`
    و برای مدل‌های Qwen3-Coder مقدار `qwen3_xml` را ذکر می‌کند.

    نشانه‌ها:

    - skillها یا ابزارها هرگز اجرا نمی‌شوند
    - دستیار JSON/XML خامی مانند `{"name":"read","arguments":...}` را چاپ می‌کند
    - وقتی OpenClaw مقدار `tool_choice: "auto"` را ارسال می‌کند، vLLM یک آرایه خالی `tool_calls` برمی‌گرداند

    برخی ترکیب‌های Qwen/vLLM فقط وقتی درخواست از
    `tool_choice: "required"` استفاده کند، فراخوانی ابزار ساخت‌یافته برمی‌گردانند. برای آن ورودی‌های مدل، فیلد
    درخواست سازگار با OpenAI را با `params.extra_body` اجباری کنید:

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

    مقدار `Qwen-Qwen2.5-Coder-32B-Instruct` را با شناسه دقیقی که این دستور برمی‌گرداند جایگزین کنید:

    ```bash
    openclaw models list --provider vllm
    ```

    می‌توانید همین بازنویسی را از CLI اعمال کنید:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    این یک راهکار سازگاری opt-in است. باعث می‌شود هر turn مدل همراه با
    ابزارها به یک فراخوانی ابزار نیاز داشته باشد، بنابراین فقط برای یک ورودی مدل محلی اختصاصی
    که این رفتار در آن پذیرفتنی است از آن استفاده کنید. آن را به‌عنوان پیش‌فرض سراسری برای همه
    مدل‌های vLLM به کار نبرید، و از پراکسی‌ای که کورکورانه متن دلخواه
    دستیار را به فراخوانی ابزار قابل اجرا تبدیل می‌کند استفاده نکنید.

  </Accordion>

  <Accordion title="نشانی پایه سفارشی">
    اگر سرور vLLM شما روی میزبان یا پورت غیرپیش‌فرض اجرا می‌شود، `baseUrl` را در پیکربندی صریح ارائه‌دهنده تنظیم کنید:

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
  <Accordion title="پاسخ اول کند است یا سرور راه دور timeout می‌شود">
    برای مدل‌های محلی بزرگ، میزبان‌های راه دور در LAN، یا پیوندهای tailnet، یک
    timeout درخواست در محدوده ارائه‌دهنده تنظیم کنید:

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

    `timeoutSeconds` فقط روی درخواست‌های HTTP مدل vLLM اعمال می‌شود، از جمله
    راه‌اندازی اتصال، headerهای پاسخ، جریان‌دهی بدنه، و کل
    abort مربوط به guarded-fetch. پیش از افزایش
    `agents.defaults.timeoutSeconds` که کل اجرای agent را کنترل می‌کند، این روش را ترجیح دهید.

  </Accordion>

  <Accordion title="سرور قابل دسترسی نیست">
    بررسی کنید سرور vLLM در حال اجرا و قابل دسترسی باشد:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    اگر خطای اتصال می‌بینید، میزبان، پورت، و اینکه vLLM با حالت سرور سازگار با OpenAI شروع شده است را بررسی کنید.
    برای endpointهای صریح local loopback، LAN، یا Tailscale، OpenClaw برای درخواست‌های guarded مدل به
    origin دقیق پیکربندی‌شده `models.providers.vllm.baseUrl` اعتماد می‌کند.
    originهای metadata/link-local بدون opt-in صریح همچنان مسدود می‌مانند.
    فقط وقتی درخواست‌های vLLM باید به یک origin خصوصی دیگر برسند
    `models.providers.vllm.request.allowPrivateNetwork: true` را تنظیم کنید، و برای انصراف از اعتماد به exact-origin آن را روی `false`
    قرار دهید.

  </Accordion>

  <Accordion title="خطاهای احراز هویت در درخواست‌ها">
    اگر درخواست‌ها با خطاهای احراز هویت شکست می‌خورند، یک `VLLM_API_KEY` واقعی تنظیم کنید که با پیکربندی سرور شما مطابقت داشته باشد، یا ارائه‌دهنده را به‌صورت صریح زیر `models.providers.vllm` پیکربندی کنید.

    <Tip>
    اگر سرور vLLM شما احراز هویت را اعمال نمی‌کند، هر مقدار غیرخالی برای `VLLM_API_KEY` به‌عنوان سیگنال opt-in برای OpenClaw کار می‌کند.
    </Tip>

  </Accordion>

  <Accordion title="هیچ مدلی کشف نشد">
    کشف خودکار مستلزم تنظیم بودن `VLLM_API_KEY` است. اگر `models.providers.vllm` را تعریف کرده‌اید، OpenClaw فقط از مدل‌های اعلام‌شده شما استفاده می‌کند مگر اینکه `agents.defaults.models` شامل `"vllm/*": {}` باشد.
  </Accordion>

  <Accordion title="ابزارها به‌صورت متن خام نمایش داده می‌شوند">
    اگر یک مدل Qwen به‌جای اجرای skill، نحو ابزار JSON/XML را چاپ می‌کند،
    راهنمای Qwen در بخش پیکربندی پیشرفته بالا را بررسی کنید. راه‌حل معمول این است:

    - vLLM را با parser/template درست برای آن مدل راه‌اندازی کنید
    - شناسه دقیق مدل را با `openclaw models list --provider vllm` تایید کنید
    - فقط اگر `tool_choice: "auto"` همچنان فراخوانی ابزار خالی یا فقط متنی برمی‌گرداند، یک بازنویسی اختصاصی
      برای هر مدل با `params.extra_body.tool_choice: "required"`
      اضافه کنید

  </Accordion>
</AccordionGroup>

<Warning>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [سوالات متداول](/fa/help/faq).
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="OpenAI" href="/fa/providers/openai" icon="bolt">
    ارائه‌دهنده بومی OpenAI و رفتار مسیر سازگار با OpenAI.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده مجدد از اعتبارنامه‌ها.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و روش رفع آن‌ها.
  </Card>
</CardGroup>
