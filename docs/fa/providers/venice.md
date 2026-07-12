---
read_when:
    - شما در OpenClaw استنتاجی با تمرکز بر حریم خصوصی می‌خواهید
    - شما راهنمای راه‌اندازی Venice AI را می‌خواهید
summary: از مدل‌های متمرکز بر حریم خصوصی Venice AI در OpenClaw استفاده کنید
title: Venice AI
x-i18n:
    generated_at: "2026-07-12T10:47:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) استنتاج متمرکز بر حریم خصوصی ارائه می‌دهد: مدل‌های باز
بدون ثبت گزارش اجرا می‌شوند و همچنین دسترسی پراکسی ناشناس‌شده به Claude، GPT، Gemini و Grok فراهم است.
همه نقاط پایانی با OpenAI سازگارند (`/v1`).

## حالت‌های حریم خصوصی

| حالت           | رفتار                                                         | مدل‌ها                                                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **خصوصی**    | پرامپت‌ها/پاسخ‌ها هرگز ذخیره یا ثبت نمی‌شوند. موقتی هستند.         | Llama، Qwen، DeepSeek، Kimi، MiniMax، Venice Uncensored و غیره |
| **ناشناس‌شده** | پیش از ارسال، از طریق Venice پراکسی شده و فراداده‌ها حذف می‌شوند. | Claude، GPT، Gemini، Grok                                     |

<Warning>
مدل‌های ناشناس‌شده کاملاً خصوصی نیستند. Venice پیش از ارسال، فراداده‌ها را حذف می‌کند، اما ارائه‌دهنده زیربنایی (OpenAI، Anthropic، Google، xAI) همچنان درخواست را پردازش می‌کند. هنگامی که حریم خصوصی کامل لازم است، از مدل‌های خصوصی استفاده کنید.
</Warning>

## شروع به کار

<Steps>
  <Step title="نصب Plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="دریافت کلید API">
    1. در [venice.ai](https://venice.ai) ثبت‌نام کنید
    2. به **Settings > API Keys > Create new key** بروید
    3. کلید API خود را کپی کنید (قالب: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="پیکربندی OpenClaw">
    <Tabs>
      <Tab title="تعاملی (توصیه‌شده)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        کلید API را درخواست می‌کند (یا از `VENICE_API_KEY` موجود استفاده می‌کند)، مدل‌های Venice در دسترس را فهرست می‌کند و مدل پیش‌فرض شما را تنظیم می‌کند.
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

- **پیش‌فرض**: `venice/kimi-k2-5` (خصوصی، استدلال، بینایی).
- **قوی‌ترین گزینه ناشناس‌شده**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

همچنین می‌توانید `openclaw configure` را اجرا کرده و **ارائه‌دهنده مدل/احراز هویت > Venice AI** را انتخاب کنید.

<Tip>
| مورد استفاده                 | مدل                             | دلیل                                       |
| ------------------------- | ---------------------------------- | ------------------------------------------ |
| گفت‌وگوی عمومی (پیش‌فرض)    | `kimi-k2-5`                        | استدلال خصوصی قدرتمند همراه با بینایی       |
| بهترین کیفیت کلی      | `claude-opus-4-6`                  | قوی‌ترین گزینه ناشناس‌شده Venice         |
| حریم خصوصی + کدنویسی          | `qwen3-coder-480b-a35b-instruct`   | مدل خصوصی کدنویسی با زمینه بزرگ    |
| سریع + ارزان              | `qwen3-4b`                         | مدل استدلال سبک                |
| وظایف خصوصی پیچیده     | `deepseek-v3.2`                    | استدلال قدرتمند؛ فراخوانی ابزار غیرفعال است    |
| بدون سانسور                | `venice-uncensored`                | بدون محدودیت محتوایی                    |
</Tip>

## کاتالوگ داخلی (۳۸ مدل)

<AccordionGroup>
  <Accordion title="مدل‌های خصوصی (۲۶) — کاملاً خصوصی، بدون ثبت گزارش">
    | شناسه مدل                               | نام                                 | زمینه | یادداشت‌ها                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | پیش‌فرض، استدلال، بینایی  |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k    | استدلال                   |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | عمومی                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | عمومی                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | عمومی، ابزارها غیرفعال‌اند     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | استدلال                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | عمومی                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k    | کدنویسی                      |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | کدنویسی                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | استدلال، بینایی           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | عمومی                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)                | 256k    | بینایی                      |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k     | سریع، استدلال              |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | استدلال، ابزارها غیرفعال‌اند    |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k     | بدون سانسور، ابزارها غیرفعال‌اند   |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k    | بینایی                       |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | بینایی                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | عمومی                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | عمومی                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | استدلال                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | عمومی                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | استدلال                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | استدلال                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | استدلال                    |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k    | استدلال                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | استدلال                    |
  </Accordion>

  <Accordion title="مدل‌های ناشناس‌شده (۱۲) — از طریق پراکسی Venice">
    | شناسه مدل                        | نام                           | زمینه | یادداشت‌ها                      |
    | -------------------------------- | -------------------------------- | ------- | ---------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (از طریق Venice)    | 1M      | استدلال، بینایی            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (از طریق Venice)  | 1M      | استدلال، بینایی            |
    | `openai-gpt-54`                 | GPT-5.4 (از طریق Venice)            | 1M      | استدلال، بینایی            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (از طریق Venice)      | 400k    | استدلال، بینایی، کدنویسی     |
    | `openai-gpt-52`                 | GPT-5.2 (از طریق Venice)            | 256k    | استدلال                    |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (از طریق Venice)      | 256k    | استدلال، بینایی، کدنویسی     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (از طریق Venice)             | 128k    | بینایی                        |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (از طریق Venice)        | 128k    | بینایی                        |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (از طریق Venice)     | 1M      | استدلال، بینایی             |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (از طریق Venice)       | 198k    | استدلال، بینایی             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (از طریق Venice)     | 256k    | استدلال، بینایی             |
    | `grok-41-fast`                  | Grok 4.1 Fast (از طریق Venice)      | 1M      | استدلال، بینایی             |
  </Accordion>
</AccordionGroup>

مدل‌های Venice مبتنی بر Grok (`grok-41-fast` و موارد مشابه) همان وصله سازگاری
طرح‌واره ابزار را مانند ارائه‌دهنده بومی xAI دریافت می‌کنند، زیرا قالب بالادستی
فراخوانی ابزار یکسانی دارند.

## کشف مدل

کاتالوگ همراه بالا، فهرست اولیه‌ای با پشتوانه مانیفست است. OpenClaw هنگام اجرا
آن را از API ‏`/models` در Venice به‌روزرسانی می‌کند و اگر
API در دسترس نباشد، به فهرست اولیه بازمی‌گردد. نقطه پایانی `/models` عمومی است (برای
فهرست‌کردن نیازی به احراز هویت نیست)، اما استنتاج به یک کلید API معتبر نیاز دارد.

## رفتار بازپخش DeepSeek V4

اگر Venice مدل‌های DeepSeek V4 مانند `deepseek-v4-pro` یا
`deepseek-v4-flash` را ارائه کند، OpenClaw هنگامی که Venice آن را حذف کرده باشد،
فیلد الزامی بازپخش `reasoning_content` را در پیام‌های دستیار تکمیل می‌کند و
`thinking`/`reasoning`/`reasoning_effort` را از محموله درخواست حذف می‌کند (Venice
کنترل بومی `thinking` در DeepSeek را برای این مدل‌ها رد می‌کند). این اصلاح بازپخش
از کنترل‌های تفکر متعلق به ارائه‌دهنده بومی DeepSeek جدا است.

## پشتیبانی از جریان‌دهی و ابزار

| قابلیت          | پشتیبانی                                           |
| ---------------- | ------------------------------------------------- |
| جریان‌دهی        | همه مدل‌ها                                        |
| فراخوانی تابع | بیشتر مدل‌ها؛ برای هر مدل در موارد ذکرشده در بالا غیرفعال است |
| بینایی/تصاویر    | مدل‌هایی که در بالا با «بینایی» مشخص شده‌اند                      |
| حالت JSON        | از طریق `response_format`                             |

## قیمت‌گذاری

Venice از سامانه‌ای مبتنی بر اعتبار استفاده می‌کند. هزینه مدل‌های ناشناس‌شده تقریباً برابر با
قیمت‌گذاری مستقیم API به‌علاوه کارمزد اندک Venice است. برای نرخ‌های فعلی،
[venice.ai/pricing](https://venice.ai/pricing) را ببینید.

## نمونه‌های استفاده

```bash
# مدل خصوصی پیش‌فرض
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Claude Opus از طریق Venice (ناشناس‌شده)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# مدل بدون سانسور
openclaw agent --model venice/venice-uncensored --message "Draft options"

# مدل بینایی با تصویر
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# مدل کدنویسی
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="کلید API شناسایی نمی‌شود">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    تأیید کنید که کلید با `vapi_` شروع می‌شود.

  </Accordion>

  <Accordion title="مدل در دسترس نیست">
    برای مشاهده مدل‌های در دسترس کنونی، `openclaw models list --all --provider venice` را اجرا کنید؛
    کاتالوگ با افزودن یا بازنشسته‌کردن مدل‌ها توسط Venice تغییر می‌کند.
  </Accordion>

  <Accordion title="مشکلات اتصال">
    API ‏Venice در `https://api.venice.ai/api/v1` قرار دارد. تأیید کنید شبکه شما اتصال HTTPS به آن میزبان را مجاز می‌داند.
  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="نمونه فایل پیکربندی">
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
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار انتقال در زمان خرابی.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    صفحه اصلی Venice AI و ثبت‌نام حساب.
  </Card>
  <Card title="مستندات API" href="https://docs.venice.ai" icon="book">
    مرجع API و مستندات توسعه‌دهندگان Venice.
  </Card>
  <Card title="قیمت‌گذاری" href="https://venice.ai/pricing" icon="credit-card">
    نرخ‌های فعلی اعتبار و طرح‌های Venice.
  </Card>
</CardGroup>
