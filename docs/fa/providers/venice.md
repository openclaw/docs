---
read_when:
    - می‌خواهید استنتاج متمرکز بر حریم خصوصی در OpenClaw داشته باشید
    - راهنمای راه‌اندازی Venice AI را می‌خواهید
summary: از مدل‌های حریم‌خصوصی‌محور Venice AI در OpenClaw استفاده کنید
title: Venice AI
x-i18n:
    generated_at: "2026-05-02T12:00:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9b3486dd319661ba27f952e1353fed4364064c2cfb1e5744c018ddbac9dae82
    source_path: providers/venice.md
    workflow: 16
---

Venice AI **استنتاج هوش مصنوعی متمرکز بر حریم خصوصی** را با پشتیبانی از مدل‌های بدون سانسور و دسترسی به مدل‌های اختصاصی اصلی از طریق پروکسی ناشناس‌ساز خود ارائه می‌کند. همهٔ استنتاج‌ها به‌صورت پیش‌فرض خصوصی هستند — نه آموزشی روی داده‌های شما انجام می‌شود، نه ثبت وقایع.

## چرا Venice در OpenClaw

- **استنتاج خصوصی** برای مدل‌های متن‌باز (بدون ثبت وقایع).
- **مدل‌های بدون سانسور** هنگامی که به آن‌ها نیاز دارید.
- **دسترسی ناشناس‌سازی‌شده** به مدل‌های اختصاصی (Opus/GPT/Gemini) هنگامی که کیفیت اهمیت دارد.
- نقاط پایانی سازگار با OpenAI در `/v1`.

## حالت‌های حریم خصوصی

Venice دو سطح حریم خصوصی ارائه می‌کند — درک این موضوع برای انتخاب مدل شما کلیدی است:

| حالت | توضیح | مدل‌ها |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **خصوصی** | کاملاً خصوصی. پرامپت‌ها/پاسخ‌ها **هرگز ذخیره یا ثبت نمی‌شوند**. موقتی. | Llama، Qwen، DeepSeek، Kimi، MiniMax، Venice Uncensored و غیره. |
| **ناشناس‌سازی‌شده** | از طریق Venice با حذف فراداده پروکسی می‌شود. ارائه‌دهندهٔ زیربنایی (OpenAI، Anthropic، Google، xAI) درخواست‌های ناشناس‌سازی‌شده را می‌بیند. | Claude، GPT، Gemini، Grok |

<Warning>
مدل‌های ناشناس‌سازی‌شده **کاملاً** خصوصی نیستند. Venice پیش از بازارسال، فراداده را حذف می‌کند، اما ارائه‌دهندهٔ زیربنایی (OpenAI، Anthropic، Google، xAI) همچنان درخواست را پردازش می‌کند. هنگامی که حریم خصوصی کامل لازم است، مدل‌های **خصوصی** را انتخاب کنید.
</Warning>

## قابلیت‌ها

- **متمرکز بر حریم خصوصی**: بین حالت‌های «خصوصی» (کاملاً خصوصی) و «ناشناس‌سازی‌شده» (پروکسی‌شده) انتخاب کنید
- **مدل‌های بدون سانسور**: دسترسی به مدل‌ها بدون محدودیت‌های محتوا
- **دسترسی به مدل‌های اصلی**: از Claude، GPT، Gemini و Grok از طریق پروکسی ناشناس‌ساز Venice استفاده کنید
- **API سازگار با OpenAI**: نقاط پایانی استاندارد `/v1` برای یکپارچه‌سازی آسان
- **استریمینگ**: روی همهٔ مدل‌ها پشتیبانی می‌شود
- **فراخوانی تابع**: روی مدل‌های منتخب پشتیبانی می‌شود (قابلیت‌های مدل را بررسی کنید)
- **بینایی**: روی مدل‌های دارای قابلیت بینایی پشتیبانی می‌شود
- **بدون محدودیت نرخ سخت‌گیرانه**: ممکن است برای استفادهٔ بسیار شدید، محدودسازی استفادهٔ منصفانه اعمال شود

## شروع به کار

<Steps>
  <Step title="کلید API خود را دریافت کنید">
    1. در [venice.ai](https://venice.ai) ثبت‌نام کنید
    2. به **Settings > API Keys > Create new key** بروید
    3. کلید API خود را کپی کنید (قالب: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="OpenClaw را پیکربندی کنید">
    روش راه‌اندازی دلخواه خود را انتخاب کنید:

    <Tabs>
      <Tab title="تعاملی (پیشنهادی)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        این کار:
        1. کلید API شما را درخواست می‌کند (یا از `VENICE_API_KEY` موجود استفاده می‌کند)
        2. همهٔ مدل‌های Venice موجود را نشان می‌دهد
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
  <Step title="راه‌اندازی را تأیید کنید">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## انتخاب مدل

پس از راه‌اندازی، OpenClaw همهٔ مدل‌های Venice موجود را نشان می‌دهد. بر اساس نیازهایتان انتخاب کنید:

- **مدل پیش‌فرض**: `venice/kimi-k2-5` برای استدلال خصوصی قوی به‌همراه بینایی.
- **گزینهٔ با قابلیت بالا**: `venice/claude-opus-4-6` برای قوی‌ترین مسیر ناشناس‌سازی‌شدهٔ Venice.
- **حریم خصوصی**: برای استنتاج کاملاً خصوصی، مدل‌های «خصوصی» را انتخاب کنید.
- **قابلیت**: برای دسترسی به Claude، GPT، Gemini از طریق پروکسی Venice، مدل‌های «ناشناس‌سازی‌شده» را انتخاب کنید.

مدل پیش‌فرض خود را هر زمان تغییر دهید:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

همهٔ مدل‌های موجود را فهرست کنید:

```bash
openclaw models list --all --provider venice
```

همچنین می‌توانید `openclaw configure` را اجرا کنید، **Model/auth** را انتخاب کنید، و **Venice AI** را برگزینید.

<Tip>
از جدول زیر برای انتخاب مدل مناسب برای مورد استفادهٔ خود استفاده کنید.

| مورد استفاده | مدل پیشنهادی | دلیل |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **چت عمومی (پیش‌فرض)** | `kimi-k2-5` | استدلال خصوصی قوی به‌همراه بینایی |
| **بهترین کیفیت کلی** | `claude-opus-4-6` | قوی‌ترین گزینهٔ ناشناس‌سازی‌شدهٔ Venice |
| **حریم خصوصی + کدنویسی** | `qwen3-coder-480b-a35b-instruct` | مدل کدنویسی خصوصی با زمینهٔ بزرگ |
| **بینایی خصوصی** | `kimi-k2-5` | پشتیبانی از بینایی بدون خروج از حالت خصوصی |
| **سریع + ارزان** | `qwen3-4b` | مدل استدلال سبک |
| **کارهای خصوصی پیچیده** | `deepseek-v3.2` | استدلال قوی، اما بدون پشتیبانی ابزار Venice |
| **بدون سانسور** | `venice-uncensored` | بدون محدودیت محتوا |

</Tip>

## رفتار بازپخش DeepSeek V4

اگر Venice مدل‌های DeepSeek V4 مانند `venice/deepseek-v4-pro` یا
`venice/deepseek-v4-flash` را ارائه کند، OpenClaw جای‌نگهدار بازپخش
`reasoning_content` موردنیاز DeepSeek V4 را در پیام‌های دستیار، هنگامی که پروکسی
آن را حذف کند، پر می‌کند. Venice کنترل بومی سطح‌بالای `thinking` مربوط به DeepSeek را رد می‌کند، بنابراین
OpenClaw این اصلاح بازپخش ویژهٔ ارائه‌دهنده را جدا از کنترل‌های تفکر ارائه‌دهندهٔ بومی
DeepSeek نگه می‌دارد.

## کاتالوگ داخلی (مجموعاً ۴۱)

<AccordionGroup>
  <Accordion title="مدل‌های خصوصی (۲۶) — کاملاً خصوصی، بدون ثبت وقایع">
    | شناسهٔ مدل | نام | زمینه | قابلیت‌ها |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5` | Kimi K2.5 | 256k | پیش‌فرض، استدلال، بینایی |
    | `kimi-k2-thinking` | Kimi K2 Thinking | 256k | استدلال |
    | `llama-3.3-70b` | Llama 3.3 70B | 128k | عمومی |
    | `llama-3.2-3b` | Llama 3.2 3B | 128k | عمومی |
    | `hermes-3-llama-3.1-405b` | Hermes 3 Llama 3.1 405B | 128k | عمومی، ابزارها غیرفعال |
    | `qwen3-235b-a22b-thinking-2507` | Qwen3 235B Thinking | 128k | استدلال |
    | `qwen3-235b-a22b-instruct-2507` | Qwen3 235B Instruct | 128k | عمومی |
    | `qwen3-coder-480b-a35b-instruct` | Qwen3 Coder 480B | 256k | کدنویسی |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo | 256k | کدنویسی |
    | `qwen3-5-35b-a3b` | Qwen3.5 35B A3B | 256k | استدلال، بینایی |
    | `qwen3-next-80b` | Qwen3 Next 80B | 256k | عمومی |
    | `qwen3-vl-235b-a22b` | Qwen3 VL 235B (Vision) | 256k | بینایی |
    | `qwen3-4b` | Venice Small (Qwen3 4B) | 32k | سریع، استدلال |
    | `deepseek-v3.2` | DeepSeek V3.2 | 160k | استدلال، ابزارها غیرفعال |
    | `venice-uncensored` | Venice Uncensored (Dolphin-Mistral) | 32k | بدون سانسور، ابزارها غیرفعال |
    | `mistral-31-24b` | Venice Medium (Mistral) | 128k | بینایی |
    | `google-gemma-3-27b-it` | Google Gemma 3 27B Instruct | 198k | بینایی |
    | `openai-gpt-oss-120b` | OpenAI GPT OSS 120B | 128k | عمومی |
    | `nvidia-nemotron-3-nano-30b-a3b` | NVIDIA Nemotron 3 Nano 30B | 128k | عمومی |
    | `olafangensan-glm-4.7-flash-heretic` | GLM 4.7 Flash Heretic | 128k | استدلال |
    | `zai-org-glm-4.6` | GLM 4.6 | 198k | عمومی |
    | `zai-org-glm-4.7` | GLM 4.7 | 198k | استدلال |
    | `zai-org-glm-4.7-flash` | GLM 4.7 Flash | 128k | استدلال |
    | `zai-org-glm-5` | GLM 5 | 198k | استدلال |
    | `minimax-m21` | MiniMax M2.1 | 198k | استدلال |
    | `minimax-m25` | MiniMax M2.5 | 198k | استدلال |
  </Accordion>

  <Accordion title="مدل‌های ناشناس‌سازی‌شده (۱۵) — از طریق پروکسی Venice">
    | شناسهٔ مدل | نام | زمینه | قابلیت‌ها |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6` | Claude Opus 4.6 (از طریق Venice) | 1M | استدلال، بینایی |
    | `claude-opus-4-5` | Claude Opus 4.5 (از طریق Venice) | 198k | استدلال، بینایی |
    | `claude-sonnet-4-6` | Claude Sonnet 4.6 (از طریق Venice) | 1M | استدلال، بینایی |
    | `claude-sonnet-4-5` | Claude Sonnet 4.5 (از طریق Venice) | 198k | استدلال، بینایی |
    | `openai-gpt-54` | GPT-5.4 (از طریق Venice) | 1M | استدلال، بینایی |
    | `openai-gpt-53-codex` | GPT-5.3 Codex (از طریق Venice) | 400k | استدلال، بینایی، کدنویسی |
    | `openai-gpt-52` | GPT-5.2 (از طریق Venice) | 256k | استدلال |
    | `openai-gpt-52-codex` | GPT-5.2 Codex (از طریق Venice) | 256k | استدلال، بینایی، کدنویسی |
    | `openai-gpt-4o-2024-11-20` | GPT-4o (از طریق Venice) | 128k | بینایی |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (از طریق Venice) | 128k | بینایی |
    | `gemini-3-1-pro-preview` | Gemini 3.1 Pro (از طریق Venice) | 1M | استدلال، بینایی |
    | `gemini-3-pro-preview` | Gemini 3 Pro (از طریق Venice) | 198k | استدلال، بینایی |
    | `gemini-3-flash-preview` | Gemini 3 Flash (از طریق Venice) | 256k | استدلال، بینایی |
    | `grok-41-fast` | Grok 4.1 Fast (از طریق Venice) | 1M | استدلال، بینایی |
    | `grok-code-fast-1` | Grok Code Fast 1 (از طریق Venice) | 256k | استدلال، کدنویسی |
  </Accordion>
</AccordionGroup>

## کشف مدل

OpenClaw یک کاتالوگ seed برای Venice ارائه می‌کند که با manifest پشتیبانی می‌شود و برای فهرست‌کردن مدل‌ها به‌صورت فقط‌خواندنی است. تازه‌سازی زمان اجرا همچنان می‌تواند مدل‌ها را از API Venice کشف کند، و اگر API در دسترس نباشد به کاتالوگ manifest برمی‌گردد.

نقطهٔ پایانی `/models` عمومی است (برای فهرست‌کردن به احراز هویت نیاز نیست)، اما استنتاج به یک کلید API معتبر نیاز دارد.

## استریمینگ و پشتیبانی ابزار

| قابلیت              | پشتیبانی                                              |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | همه مدل‌ها                                           |
| **Function calling** | بیشتر مدل‌ها (در API، `supportsFunctionCalling` را بررسی کنید) |
| **Vision/Images**    | مدل‌هایی که با ویژگی «Vision» مشخص شده‌اند                  |
| **JSON mode**        | از طریق `response_format` پشتیبانی می‌شود                      |

## قیمت‌گذاری

Venice از یک سیستم مبتنی بر اعتبار استفاده می‌کند. برای نرخ‌های فعلی، [venice.ai/pricing](https://venice.ai/pricing) را بررسی کنید:

- **مدل‌های خصوصی**: عموما هزینه کمتر
- **مدل‌های ناشناس‌سازی‌شده**: مشابه قیمت‌گذاری مستقیم API + کارمزد کوچک Venice

### Venice (ناشناس‌سازی‌شده) در برابر API مستقیم

| جنبه       | Venice (ناشناس‌سازی‌شده)           | API مستقیم          |
| ------------ | ----------------------------- | ------------------- |
| **حریم خصوصی**  | فراداده حذف و ناشناس‌سازی می‌شود | حساب شما متصل است |
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
    کاتالوگ مدل Venice به‌صورت پویا به‌روزرسانی می‌شود. برای دیدن مدل‌های در دسترس فعلی، `openclaw models list` را اجرا کنید. برخی مدل‌ها ممکن است موقتا آفلاین باشند.
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
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار گذار در صورت خرابی.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    صفحه اصلی Venice AI و ثبت‌نام حساب.
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    مرجع API مربوط به Venice و مستندات توسعه‌دهندگان.
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    نرخ‌ها و طرح‌های فعلی اعتبار Venice.
  </Card>
</CardGroup>
