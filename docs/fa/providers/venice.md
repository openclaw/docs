---
read_when:
    - می‌خواهید استنتاج متمرکز بر حریم خصوصی در OpenClaw داشته باشید
    - راهنمای راه‌اندازی Venice AI را می‌خواهید
summary: از مدل‌های متمرکز بر حریم خصوصی Venice AI در OpenClaw استفاده کنید
title: Venice AI
x-i18n:
    generated_at: "2026-04-29T23:29:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87db1595ba6d34459143e7d173cca9549ad21928eaaf00605b7487ce6d33fce
    source_path: providers/venice.md
    workflow: 16
---

Venice AI **استنتاج هوش مصنوعی متمرکز بر حریم خصوصی** را با پشتیبانی از مدل‌های بدون سانسور و دسترسی به مدل‌های اختصاصی بزرگ از طریق پروکسی ناشناس‌سازی‌شده خود ارائه می‌دهد. همه استنتاج‌ها به‌صورت پیش‌فرض خصوصی هستند — بدون آموزش روی داده‌های شما، بدون ثبت لاگ.

## چرا Venice در OpenClaw

- **استنتاج خصوصی** برای مدل‌های متن‌باز (بدون ثبت لاگ).
- **مدل‌های بدون سانسور** برای زمانی که به آن‌ها نیاز دارید.
- **دسترسی ناشناس‌سازی‌شده** به مدل‌های اختصاصی (Opus/GPT/Gemini) وقتی کیفیت اهمیت دارد.
- نقاط پایانی `/v1` سازگار با OpenAI.

## حالت‌های حریم خصوصی

Venice دو سطح حریم خصوصی ارائه می‌دهد — درک این موضوع برای انتخاب مدل شما کلیدی است:

| حالت           | توضیح                                                                                                                       | مدل‌ها                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **خصوصی**    | کاملاً خصوصی. پرامپت‌ها/پاسخ‌ها **هرگز ذخیره یا لاگ نمی‌شوند**. موقتی.                                                       | Llama، Qwen، DeepSeek، Kimi، MiniMax، Venice Uncensored و غیره. |
| **ناشناس‌سازی‌شده** | از طریق Venice با حذف فراداده‌ها پروکسی می‌شود. ارائه‌دهنده زیرین (OpenAI، Anthropic، Google، xAI) درخواست‌های ناشناس‌سازی‌شده را می‌بیند. | Claude، GPT، Gemini، Grok                                     |

<Warning>
مدل‌های ناشناس‌سازی‌شده **کاملاً** خصوصی نیستند. Venice پیش از ارسال، فراداده‌ها را حذف می‌کند، اما ارائه‌دهنده زیرین (OpenAI، Anthropic، Google، xAI) همچنان درخواست را پردازش می‌کند. وقتی حریم خصوصی کامل لازم است، مدل‌های **خصوصی** را انتخاب کنید.
</Warning>

## قابلیت‌ها

- **متمرکز بر حریم خصوصی**: بین حالت‌های "خصوصی" (کاملاً خصوصی) و "ناشناس‌سازی‌شده" (پروکسی‌شده) انتخاب کنید
- **مدل‌های بدون سانسور**: دسترسی به مدل‌ها بدون محدودیت‌های محتوا
- **دسترسی به مدل‌های بزرگ**: استفاده از Claude، GPT، Gemini و Grok از طریق پروکسی ناشناس‌سازی‌شده Venice
- **API سازگار با OpenAI**: نقاط پایانی استاندارد `/v1` برای یکپارچه‌سازی آسان
- **جریان‌دهی**: روی همه مدل‌ها پشتیبانی می‌شود
- **فراخوانی تابع**: روی مدل‌های منتخب پشتیبانی می‌شود (قابلیت‌های مدل را بررسی کنید)
- **بینایی**: روی مدل‌هایی با قابلیت بینایی پشتیبانی می‌شود
- **بدون محدودیت نرخ سخت‌گیرانه**: برای استفاده بسیار شدید ممکن است محدودسازی بر پایه استفاده منصفانه اعمال شود

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    1. در [venice.ai](https://venice.ai) ثبت‌نام کنید
    2. به **تنظیمات > کلیدهای API > ایجاد کلید جدید** بروید
    3. کلید API خود را کپی کنید (قالب: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="پیکربندی OpenClaw">
    روش راه‌اندازی ترجیحی خود را انتخاب کنید:

    <Tabs>
      <Tab title="تعاملی (توصیه‌شده)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        این کار:
        1. کلید API شما را درخواست می‌کند (یا از `VENICE_API_KEY` موجود استفاده می‌کند)
        2. همه مدل‌های در دسترس Venice را نمایش می‌دهد
        3. اجازه می‌دهد مدل پیش‌فرض خود را انتخاب کنید
        4. ارائه‌دهنده را به‌صورت خودکار پیکربندی می‌کند
      </Tab>
      <Tab title="متغیر محیطی">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="غیرتعاملی">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="تأیید راه‌اندازی">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## انتخاب مدل

پس از راه‌اندازی، OpenClaw همه مدل‌های در دسترس Venice را نشان می‌دهد. بر اساس نیازهای خود انتخاب کنید:

- **مدل پیش‌فرض**: `venice/kimi-k2-5` برای استدلال خصوصی قدرتمند همراه با بینایی.
- **گزینه با قابلیت بالا**: `venice/claude-opus-4-6` برای قوی‌ترین مسیر ناشناس‌سازی‌شده Venice.
- **حریم خصوصی**: مدل‌های "خصوصی" را برای استنتاج کاملاً خصوصی انتخاب کنید.
- **قابلیت**: مدل‌های "ناشناس‌سازی‌شده" را برای دسترسی به Claude، GPT، Gemini از طریق پروکسی Venice انتخاب کنید.

مدل پیش‌فرض خود را هر زمان تغییر دهید:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

فهرست همه مدل‌های در دسترس:

```bash
openclaw models list | grep venice
```

همچنین می‌توانید `openclaw configure` را اجرا کنید، **مدل/احراز هویت** را انتخاب کنید، و **Venice AI** را برگزینید.

<Tip>
برای انتخاب مدل مناسب برای مورد استفاده خود، از جدول زیر استفاده کنید.

| مورد استفاده                   | مدل توصیه‌شده                | دلیل                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **گفت‌وگوی عمومی (پیش‌فرض)** | `kimi-k2-5`                      | استدلال خصوصی قدرتمند همراه با بینایی         |
| **بهترین کیفیت کلی**   | `claude-opus-4-6`                | قوی‌ترین گزینه ناشناس‌سازی‌شده Venice           |
| **حریم خصوصی + کدنویسی**       | `qwen3-coder-480b-a35b-instruct` | مدل کدنویسی خصوصی با زمینه بزرگ      |
| **بینایی خصوصی**         | `kimi-k2-5`                      | پشتیبانی بینایی بدون خروج از حالت خصوصی  |
| **سریع + ارزان**           | `qwen3-4b`                       | مدل استدلال سبک                  |
| **کارهای خصوصی پیچیده**  | `deepseek-v3.2`                  | استدلال قدرتمند، اما بدون پشتیبانی ابزار Venice |
| **بدون سانسور**             | `venice-uncensored`              | بدون محدودیت محتوا                      |

</Tip>

## رفتار بازپخش DeepSeek V4

اگر Venice مدل‌های DeepSeek V4 مانند `venice/deepseek-v4-pro` یا
`venice/deepseek-v4-flash` را ارائه کند، OpenClaw جای‌نگهدار بازپخش
`reasoning_content` موردنیاز DeepSeek V4 را روی پیام‌های دستیار زمانی پر می‌کند
که پروکسی آن را حذف کرده باشد. Venice کنترل بومی سطح‌بالای `thinking` متعلق به DeepSeek را رد می‌کند، بنابراین
OpenClaw این اصلاح بازپخش ویژه ارائه‌دهنده را از کنترل‌های thinking ارائه‌دهنده بومی
DeepSeek جدا نگه می‌دارد.

## کاتالوگ داخلی (در مجموع 41)

<AccordionGroup>
  <Accordion title="مدل‌های خصوصی (26) — کاملاً خصوصی، بدون ثبت لاگ">
    | شناسه مدل                               | نام                                | زمینه | قابلیت‌ها                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | پیش‌فرض، استدلال، بینایی |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | استدلال                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | عمومی                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | عمومی                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | عمومی، ابزارها غیرفعال    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | استدلال                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | عمومی                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | کدنویسی                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | کدنویسی                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | استدلال، بینایی          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | عمومی                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | بینایی                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | سریع، استدلال            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | استدلال، ابزارها غیرفعال  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | بدون سانسور، ابزارها غیرفعال |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | بینایی                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | بینایی                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | عمومی                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | عمومی                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | استدلال                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | عمومی                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | استدلال                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | استدلال                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | استدلال                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | استدلال                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | استدلال                  |
  </Accordion>

  <Accordion title="مدل‌های ناشناس‌سازی‌شده (15) — از طریق پروکسی Venice">
    | شناسه مدل                        | نام                           | زمینه | قابلیت‌ها                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | استدلال، بینایی         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | استدلال، بینایی         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | استدلال، بینایی         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | استدلال، بینایی         |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | استدلال، بینایی         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | استدلال، بینایی، کدنویسی |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | استدلال                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | استدلال، بینایی، کدنویسی |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | بینایی                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | بینایی                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | استدلال، بینایی         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | استدلال، بینایی         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | استدلال، بینایی         |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | استدلال، بینایی         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | استدلال، کدنویسی         |
  </Accordion>
</AccordionGroup>

## کشف مدل

وقتی `VENICE_API_KEY` تنظیم شده باشد، OpenClaw مدل‌ها را به‌صورت خودکار از API Venice کشف می‌کند. اگر API در دسترس نباشد، به کاتالوگ ایستا بازمی‌گردد.

نقطه پایانی `/models` عمومی است (برای فهرست‌کردن نیازی به احراز هویت نیست)، اما استنتاج به یک کلید API معتبر نیاز دارد.

## جریان‌دهی و پشتیبانی ابزار

| قابلیت              | پشتیبانی                                              |
| -------------------- | ---------------------------------------------------- |
| **استریمینگ**        | همه مدل‌ها                                           |
| **فراخوانی تابع** | بیشتر مدل‌ها (`supportsFunctionCalling` را در API بررسی کنید) |
| **بینایی/تصاویر**    | مدل‌هایی که با ویژگی «بینایی» مشخص شده‌اند                  |
| **حالت JSON**        | از طریق `response_format` پشتیبانی می‌شود                      |

## قیمت‌گذاری

Venice از یک سامانه مبتنی بر اعتبار استفاده می‌کند. برای نرخ‌های فعلی، [venice.ai/pricing](https://venice.ai/pricing) را بررسی کنید:

- **مدل‌های خصوصی**: عموما هزینه کمتری دارند
- **مدل‌های ناشناس‌سازی‌شده**: مشابه قیمت‌گذاری مستقیم API + کارمزد اندک Venice

### Venice (ناشناس‌سازی‌شده) در برابر API مستقیم

| جنبه       | Venice (ناشناس‌سازی‌شده)           | API مستقیم          |
| ------------ | ----------------------------- | ------------------- |
| **حریم خصوصی**  | فراداده حذف و ناشناس‌سازی می‌شود | حساب شما پیوند داده می‌شود |
| **تاخیر**  | +10-50ms (پراکسی)              | مستقیم              |
| **ویژگی‌ها** | بیشتر ویژگی‌ها پشتیبانی می‌شوند       | همه ویژگی‌ها       |
| **صورت‌حساب**  | اعتبارهای Venice                | صورت‌حساب ارائه‌دهنده    |

## نمونه‌های استفاده

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="API key not recognized">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    مطمئن شوید کلید با `vapi_` شروع می‌شود.

  </Accordion>

  <Accordion title="Model not available">
    کاتالوگ مدل Venice به‌صورت پویا به‌روزرسانی می‌شود. برای دیدن مدل‌های فعلی در دسترس، `openclaw models list` را اجرا کنید. برخی مدل‌ها ممکن است موقتا آفلاین باشند.
  </Accordion>

  <Accordion title="Connection issues">
    API مربوط به Venice در `https://api.venice.ai/api/v1` قرار دارد. مطمئن شوید شبکه شما اتصال‌های HTTPS را مجاز می‌داند.
  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Config file example">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    صفحه اصلی Venice AI و ثبت‌نام حساب.
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    مرجع API مربوط به Venice و مستندات توسعه‌دهنده.
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    نرخ‌ها و طرح‌های فعلی اعتبار Venice.
  </Card>
</CardGroup>
