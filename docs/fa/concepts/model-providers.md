---
read_when:
    - به یک مرجع راه‌اندازی مدل به تفکیک ارائه‌دهنده نیاز دارید
    - شما پیکربندی‌های نمونه یا دستورهای راه‌اندازی اولیه CLI را برای ارائه‌دهندگان مدل می‌خواهید
sidebarTitle: Model providers
summary: نمای کلی ارائه‌دهندهٔ مدل با پیکربندی‌های نمونه + جریان‌های CLI
title: ارائه‌دهندگان مدل
x-i18n:
    generated_at: "2026-04-29T22:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3902194674d6d4e17a8477c28addb39b8e04c3b498eb6a0305e82c2f1b5d737e
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع برای **ارائه‌دهندگان LLM/مدل** (نه کانال‌های چت مانند WhatsApp/Telegram). برای قواعد انتخاب مدل، [مدل‌ها](/fa/concepts/models) را ببینید.

## قواعد سریع

<AccordionGroup>
  <Accordion title="ارجاع‌های مدل و ابزارهای کمکی CLI">
    - ارجاع‌های مدل از `provider/model` استفاده می‌کنند (مثال: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` وقتی تنظیم شود، مانند فهرست مجاز عمل می‌کند.
    - ابزارهای کمکی CLI: `openclaw onboard`، `openclaw models list`، `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` پیش‌فرض‌های سطح ارائه‌دهنده را تنظیم می‌کنند؛ `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` آن‌ها را برای هر مدل بازنویسی می‌کنند.
    - قواعد جایگزینی، کاوش‌های دوره انتظار، و ماندگاری بازنویسی نشست: [جایگزینی مدل](/fa/concepts/model-failover).

  </Accordion>
  <Accordion title="تفکیک ارائه‌دهنده/زمان‌اجرای OpenAI">
    مسیرهای خانواده OpenAI وابسته به پیشوند هستند:

    - `openai/<model>` از ارائه‌دهنده مستقیم کلید API OpenAI در PI استفاده می‌کند.
    - `openai-codex/<model>` از Codex OAuth در PI استفاده می‌کند.
    - `openai/<model>` به‌همراه `agents.defaults.agentRuntime.id: "codex"` از مهار بومی سرور برنامه Codex استفاده می‌کند.

    [OpenAI](/fa/providers/openai) و [مهار Codex](/fa/plugins/codex-harness) را ببینید. اگر تفکیک ارائه‌دهنده/زمان‌اجرا گیج‌کننده است، ابتدا [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) را بخوانید.

    فعال‌سازی خودکار Plugin از همین مرز پیروی می‌کند: `openai-codex/<model>` متعلق به Plugin OpenAI است، در حالی که Plugin Codex با `agentRuntime.id: "codex"` یا ارجاع‌های قدیمی `codex/<model>` فعال می‌شود.

    GPT-5.5 از طریق `openai/gpt-5.5` برای ترافیک مستقیم کلید API، از طریق `openai-codex/gpt-5.5` در PI برای Codex OAuth، و از طریق مهار بومی سرور برنامه Codex وقتی `agentRuntime.id: "codex"` تنظیم شده باشد در دسترس است.

  </Accordion>
  <Accordion title="زمان‌اجراهای CLI">
    زمان‌اجراهای CLI از همین تفکیک استفاده می‌کنند: ارجاع‌های مدل متعارف مانند `anthropic/claude-*`، `google/gemini-*`، یا `openai/gpt-*` را انتخاب کنید، سپس وقتی یک پشتانه CLI محلی می‌خواهید، `agents.defaults.agentRuntime.id` را روی `claude-cli`، `google-gemini-cli`، یا `codex-cli` تنظیم کنید.

    ارجاع‌های قدیمی `claude-cli/*`، `google-gemini-cli/*`، و `codex-cli/*` به ارجاع‌های متعارف ارائه‌دهنده مهاجرت می‌کنند و زمان‌اجرا جداگانه ثبت می‌شود.

  </Accordion>
</AccordionGroup>

## رفتار ارائه‌دهنده متعلق به Plugin

بیشتر منطق ویژه ارائه‌دهنده در Pluginهای ارائه‌دهنده (`registerProvider(...)`) قرار دارد، در حالی که OpenClaw حلقه استنتاج عمومی را نگه می‌دارد. Pluginها مالک راه‌اندازی اولیه، کاتالوگ‌های مدل، نگاشت متغیرهای محیطی احراز هویت، عادی‌سازی انتقال/پیکربندی، پاک‌سازی شمای ابزار، دسته‌بندی جایگزینی، نوسازی OAuth، گزارش مصرف، پروفایل‌های تفکر/استدلال، و موارد بیشتر هستند.

فهرست کامل hookهای provider-SDK و نمونه‌های Pluginهای بسته‌بندی‌شده در [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) قرار دارد. ارائه‌دهنده‌ای که به اجراکننده درخواست کاملا سفارشی نیاز دارد، یک سطح توسعه جداگانه و عمیق‌تر است.

<Note>
رفتار runner متعلق به ارائه‌دهنده روی hookهای صریح ارائه‌دهنده مانند سیاست بازپخش، عادی‌سازی شمای ابزار، پوشش‌دهی جریان، و ابزارهای کمکی انتقال/درخواست قرار دارد. بسته ایستای قدیمی `ProviderPlugin.capabilities` فقط برای سازگاری است و دیگر توسط منطق runner مشترک خوانده نمی‌شود.
</Note>

## چرخش کلید API

<AccordionGroup>
  <Accordion title="منابع کلید و اولویت">
    چندین کلید را از این راه‌ها پیکربندی کنید:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (بازنویسی زنده تکی، بالاترین اولویت)
    - `<PROVIDER>_API_KEYS` (فهرست جداشده با ویرگول یا نقطه‌ویرگول)
    - `<PROVIDER>_API_KEY` (کلید اصلی)
    - `<PROVIDER>_API_KEY_*` (فهرست شماره‌دار، مثلا `<PROVIDER>_API_KEY_1`)

    برای ارائه‌دهندگان Google، `GOOGLE_API_KEY` نیز به‌عنوان جایگزین گنجانده می‌شود. ترتیب انتخاب کلید اولویت را حفظ می‌کند و مقادیر تکراری را حذف می‌کند.

  </Accordion>
  <Accordion title="چرخش چه زمانی فعال می‌شود">
    - درخواست‌ها فقط در پاسخ‌های محدودیت نرخ با کلید بعدی دوباره تلاش می‌شوند (برای مثال `429`، `rate_limit`، `quota`، `resource exhausted`، `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، یا پیام‌های دوره‌ای محدودیت مصرف).
    - خطاهای غیر از محدودیت نرخ بلافاصله شکست می‌خورند؛ هیچ چرخش کلیدی تلاش نمی‌شود.
    - وقتی همه کلیدهای نامزد شکست بخورند، خطای نهایی از آخرین تلاش برگردانده می‌شود.

  </Accordion>
</AccordionGroup>

## ارائه‌دهندگان داخلی (کاتالوگ pi-ai)

OpenClaw با کاتالوگ pi‑ai عرضه می‌شود. این ارائه‌دهندگان به پیکربندی `models.providers` **نیازی ندارند**؛ فقط احراز هویت را تنظیم کنید و یک مدل انتخاب کنید.

### OpenAI

- ارائه‌دهنده: `openai`
- احراز هویت: `OPENAI_API_KEY`
- چرخش اختیاری: `OPENAI_API_KEYS`، `OPENAI_API_KEY_1`، `OPENAI_API_KEY_2`، به‌علاوه `OPENCLAW_LIVE_OPENAI_KEY` (بازنویسی تکی)
- مدل‌های نمونه: `openai/gpt-5.5`، `openai/gpt-5.4-mini`
- اگر یک نصب خاص یا کلید API رفتار متفاوتی دارد، دسترس‌پذیری حساب/مدل را با `openclaw models list --provider openai` بررسی کنید.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- انتقال پیش‌فرض `auto` است (ابتدا WebSocket، با بازگشت به SSE)
- برای هر مدل از طریق `agents.defaults.models["openai/<model>"].params.transport` بازنویسی کنید (`"sse"`، `"websocket"`، یا `"auto"`)
- گرم‌سازی WebSocket برای OpenAI Responses به‌طور پیش‌فرض از طریق `params.openaiWsWarmup` فعال است (`true`/`false`)
- پردازش اولویت‌دار OpenAI را می‌توان از طریق `agents.defaults.models["openai/<model>"].params.serviceTier` فعال کرد
- `/fast` و `params.fastMode` درخواست‌های مستقیم `openai/*` Responses را در `api.openai.com` به `service_tier=priority` نگاشت می‌کنند
- وقتی به‌جای کلید مشترک `/fast` یک سطح صریح می‌خواهید، از `params.serviceTier` استفاده کنید
- سرآیندهای انتساب پنهان OpenClaw (`originator`، `version`، `User-Agent`) فقط روی ترافیک بومی OpenAI به `api.openai.com` اعمال می‌شوند، نه پراکسی‌های عمومی سازگار با OpenAI
- مسیرهای بومی OpenAI همچنین `store` مربوط به Responses، راهنمایی‌های prompt-cache و شکل‌دهی payload سازگار با reasoning در OpenAI را نگه می‌دارند؛ مسیرهای پراکسی این کار را نمی‌کنند
- `openai/gpt-5.3-codex-spark` عمدا در OpenClaw سرکوب شده است، چون درخواست‌های زنده OpenAI API آن را رد می‌کنند و کاتالوگ فعلی Codex آن را ارائه نمی‌کند

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ارائه‌دهنده: `anthropic`
- احراز هویت: `ANTHROPIC_API_KEY`
- چرخش اختیاری: `ANTHROPIC_API_KEYS`، `ANTHROPIC_API_KEY_1`، `ANTHROPIC_API_KEY_2`، به‌علاوه `OPENCLAW_LIVE_ANTHROPIC_KEY` (بازنویسی تکی)
- مدل نمونه: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- درخواست‌های عمومی مستقیم Anthropic از کلید مشترک `/fast` و `params.fastMode` پشتیبانی می‌کنند، از جمله ترافیک احراز هویت‌شده با کلید API و OAuth که به `api.anthropic.com` ارسال می‌شود؛ OpenClaw آن را به `service_tier` در Anthropic نگاشت می‌کند (`auto` در برابر `standard_only`)
- پیکربندی ترجیحی Claude CLI ارجاع مدل را canonical نگه می‌دارد و backend مربوط به CLI را جداگانه انتخاب می‌کند: `anthropic/claude-opus-4-7` همراه با `agents.defaults.agentRuntime.id: "claude-cli"`. ارجاع‌های قدیمی `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند.

<Note>
کارکنان Anthropic به ما گفته‌اند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفادهٔ دوباره از Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند. setup-token مربوط به Anthropic همچنان به‌عنوان یک مسیر توکن پشتیبانی‌شده در OpenClaw در دسترس است، اما OpenClaw اکنون در صورت دسترس‌پذیری، استفادهٔ دوباره از Claude CLI و `claude -p` را ترجیح می‌دهد.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth مربوط به OpenAI Codex

- ارائه‌دهنده: `openai-codex`
- احراز هویت: OAuth (ChatGPT)
- ارجاع مدل PI: `openai-codex/gpt-5.5`
- ارجاع harness بومی app-server مربوط به Codex: `openai/gpt-5.5` همراه با `agents.defaults.agentRuntime.id: "codex"`
- مستندات harness بومی app-server مربوط به Codex: [harness مربوط به Codex](/fa/plugins/codex-harness)
- ارجاع‌های قدیمی مدل: `codex/gpt-*`
- مرز Plugin: `openai-codex/*`، Plugin مربوط به OpenAI را بارگذاری می‌کند؛ Plugin بومی app-server مربوط به Codex فقط توسط runtime مربوط به harness Codex یا ارجاع‌های قدیمی `codex/*` انتخاب می‌شود.
- CLI: `openclaw onboard --auth-choice openai-codex` یا `openclaw models auth login --provider openai-codex`
- انتقال پیش‌فرض `auto` است (ابتدا WebSocket، با بازگشت به SSE)
- برای هر مدل PI از طریق `agents.defaults.models["openai-codex/<model>"].params.transport` بازنویسی کنید (`"sse"`، `"websocket"`، یا `"auto"`)
- `params.serviceTier` همچنین روی درخواست‌های بومی Codex Responses (`chatgpt.com/backend-api`) ارسال می‌شود
- سرآیندهای انتساب پنهان OpenClaw (`originator`، `version`، `User-Agent`) فقط روی ترافیک بومی Codex به `chatgpt.com/backend-api` پیوست می‌شوند، نه پراکسی‌های عمومی سازگار با OpenAI
- همان کلید `/fast` و پیکربندی `params.fastMode` را با `openai/*` مستقیم به اشتراک می‌گذارد؛ OpenClaw آن را به `service_tier=priority` نگاشت می‌کند
- `openai-codex/gpt-5.5` از `contextWindow = 400000` بومی کاتالوگ Codex و `contextTokens = 272000` پیش‌فرض runtime استفاده می‌کند؛ سقف runtime را با `models.providers.openai-codex.models[].contextTokens` بازنویسی کنید
- یادداشت سیاست: OAuth مربوط به OpenAI Codex به‌صراحت برای ابزارها/گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌شود.
- وقتی مسیر OAuth/اشتراک Codex را می‌خواهید از `openai-codex/gpt-5.5` استفاده کنید؛ وقتی تنظیمات کلید API و کاتالوگ محلی شما مسیر API عمومی را ارائه می‌کنند، از `openai/gpt-5.5` استفاده کنید.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### گزینه‌های میزبانی‌شدهٔ دیگر با سبک اشتراکی

<CardGroup cols={3}>
  <Card title="GLM models" href="/fa/providers/glm">
    طرح کدنویسی Z.AI یا endpointهای عمومی API.
  </Card>
  <Card title="MiniMax" href="/fa/providers/minimax">
    دسترسی با OAuth مربوط به طرح کدنویسی MiniMax یا کلید API.
  </Card>
  <Card title="Qwen Cloud" href="/fa/providers/qwen">
    سطح ارائه‌دهنده Qwen Cloud به‌علاوه نگاشت endpoint مربوط به Alibaba DashScope و طرح کدنویسی.
  </Card>
</CardGroup>

### OpenCode

- احراز هویت: `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`)
- ارائه‌دهنده runtime مربوط به Zen: `opencode`
- ارائه‌دهنده runtime مربوط به Go: `opencode-go`
- مدل‌های نمونه: `opencode/claude-opus-4-6`، `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` یا `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (کلید API)

- ارائه‌دهنده: `google`
- احراز هویت: `GEMINI_API_KEY`
- چرخش اختیاری: `GEMINI_API_KEYS`، `GEMINI_API_KEY_1`، `GEMINI_API_KEY_2`، بازگشت به `GOOGLE_API_KEY`، و `OPENCLAW_LIVE_GEMINI_KEY` (بازنویسی تکی)
- مدل‌های نمونه: `google/gemini-3.1-pro-preview`، `google/gemini-3-flash-preview`
- سازگاری: پیکربندی قدیمی OpenClaw که از `google/gemini-3.1-flash-preview` استفاده می‌کند به `google/gemini-3-flash-preview` نرمال‌سازی می‌شود
- نام مستعار: `google/gemini-3.1-pro` پذیرفته می‌شود و به شناسه زنده Gemini API در Google یعنی `google/gemini-3.1-pro-preview` نرمال‌سازی می‌شود
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` از thinking پویا در Google استفاده می‌کند. Gemini 3/3.1 یک `thinkingLevel` ثابت را حذف می‌کنند؛ Gemini 2.5 مقدار `thinkingBudget: -1` را ارسال می‌کند.
- اجراهای مستقیم Gemini همچنین `agents.defaults.models["google/<model>"].params.cachedContent` (یا `cached_content` قدیمی) را می‌پذیرند تا یک handle بومی ارائه‌دهنده با قالب `cachedContents/...` را ارسال کنند؛ برخوردهای cache در Gemini به‌صورت `cacheRead` در OpenClaw ظاهر می‌شوند

### Google Vertex و Gemini CLI

- ارائه‌دهنده‌ها: `google-vertex`، `google-gemini-cli`
- احراز هویت: Vertex از gcloud ADC استفاده می‌کند؛ Gemini CLI از جریان OAuth خودش استفاده می‌کند

<Warning>
OAuth مربوط به Gemini CLI در OpenClaw یک یکپارچه‌سازی غیررسمی است. برخی کاربران پس از استفاده از کلاینت‌های شخص ثالث، محدودیت‌های حساب Google را گزارش کرده‌اند. اگر ادامه می‌دهید، شرایط Google را مرور کنید و از یک حساب غیرحیاتی استفاده کنید.
</Warning>

OAuth مربوط به Gemini CLI به‌عنوان بخشی از Plugin بسته‌بندی‌شدهٔ `google` عرضه می‌شود.

<Steps>
  <Step title="Install Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    مدل پیش‌فرض: `google-gemini-cli/gemini-3-flash-preview`. شما شناسه یا secret کلاینت را در `openclaw.json` جای‌گذاری **نمی‌کنید**. جریان ورود CLI توکن‌ها را در پروفایل‌های احراز هویت روی میزبان Gateway ذخیره می‌کند.

  </Step>
  <Step title="تنظیم پروژه (در صورت نیاز)">
    اگر درخواست‌ها پس از ورود ناموفق بودند، `GOOGLE_CLOUD_PROJECT` یا `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید.
  </Step>
</Steps>

پاسخ‌های JSON در Gemini CLI از `response` تجزیه می‌شوند؛ میزان مصرف به `stats` بازمی‌گردد، و `stats.cached` به OpenClaw `cacheRead` نرمال‌سازی می‌شود.

### Z.AI (GLM)

- ارائه‌دهنده: `zai`
- احراز هویت: `ZAI_API_KEY`
- مدل نمونه: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - نام‌های مستعار: `z.ai/*` و `z-ai/*` به `zai/*` نرمال‌سازی می‌شوند
  - `zai-api-key` نقطه پایانی مطابق Z.AI را به‌صورت خودکار تشخیص می‌دهد؛ `zai-coding-global`، `zai-coding-cn`، `zai-global`، و `zai-cn` یک سطح مشخص را اجبار می‌کنند

### Vercel AI Gateway

- ارائه‌دهنده: `vercel-ai-gateway`
- احراز هویت: `AI_GATEWAY_API_KEY`
- مدل‌های نمونه: `vercel-ai-gateway/anthropic/claude-opus-4.6`، `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- ارائه‌دهنده: `kilocode`
- احراز هویت: `KILOCODE_API_KEY`
- مدل نمونه: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- نشانی پایه: `https://api.kilo.ai/api/gateway/`
- کاتالوگ fallback ثابت همراه با `kilocode/kilo/auto` ارائه می‌شود؛ کشف زنده از `https://api.kilo.ai/api/gateway/models` می‌تواند کاتالوگ زمان اجرا را بیشتر گسترش دهد.
- مسیریابی دقیق بالادستی پشت `kilocode/kilo/auto` متعلق به Kilo Gateway است و در OpenClaw hard-code نشده است.

برای جزئیات راه‌اندازی، [/providers/kilocode](/fa/providers/kilocode) را ببینید.

### سایر Pluginهای ارائه‌دهنده همراه

| ارائه‌دهنده            | شناسه                            | متغیر محیطی احراز هویت                                      | مدل نمونه                                    |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` یا `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` یا `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                  |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### نکات خاصی که دانستنشان مفید است

<AccordionGroup>
  <Accordion title="OpenRouter">
    سرآیندهای انتساب اپ و نشانگرهای Anthropic `cache_control` را فقط روی مسیرهای تأییدشده `openrouter.ai` اعمال می‌کند. ارجاع‌های DeepSeek، Moonshot و ZAI برای کش کردن پرامپت مدیریت‌شده توسط OpenRouter با cache-TTL واجد شرایط هستند، اما نشانگرهای کش Anthropic را دریافت نمی‌کنند. به‌عنوان یک مسیر سازگار با OpenAI به سبک پروکسی، شکل‌دهی‌های فقط مخصوص OpenAI بومی (`serviceTier`، Responses `store`، نکته‌های prompt-cache، سازگاری reasoning در OpenAI) را رد می‌کند. ارجاع‌های مبتنی بر Gemini فقط پاک‌سازی thought-signature پروکسی-Gemini را حفظ می‌کنند.
  </Accordion>
  <Accordion title="Kilo Gateway">
    ارجاع‌های مبتنی بر Gemini همان مسیر پاک‌سازی پروکسی-Gemini را دنبال می‌کنند؛ `kilocode/kilo/auto` و سایر ارجاع‌های پروکسی که از reasoning پشتیبانی نمی‌کنند، تزریق reasoning پروکسی را رد می‌کنند.
  </Accordion>
  <Accordion title="MiniMax">
    راه‌اندازی با API-key تعاریف صریح مدل چت M2.7 فقط متنی را می‌نویسد؛ درک تصویر روی ارائه‌دهنده رسانه `MiniMax-VL-01` متعلق به Plugin باقی می‌ماند.
  </Accordion>
  <Accordion title="NVIDIA">
    شناسه‌های مدل از فضای نام `nvidia/<vendor>/<model>` استفاده می‌کنند (برای مثال `nvidia/nvidia/nemotron-...` در کنار `nvidia/moonshotai/kimi-k2.5`)؛ انتخاب‌گرها ترکیب لفظی `<provider>/<model-id>` را حفظ می‌کنند، در حالی که کلید canonical ارسال‌شده به API تک‌پیشوندی باقی می‌ماند.
  </Accordion>
  <Accordion title="xAI">
    از مسیر xAI Responses استفاده می‌کند. `/fast` یا `params.fastMode: true`، مدل‌های `grok-3`، `grok-3-mini`، `grok-4` و `grok-4-0709` را به گونه‌های `*-fast` آن‌ها بازنویسی می‌کند. `tool_stream` به‌صورت پیش‌فرض روشن است؛ از طریق `agents.defaults.models["xai/<model>"].params.tool_stream=false` غیرفعالش کنید.
  </Accordion>
  <Accordion title="Cerebras">
    به‌صورت Plugin ارائه‌دهنده همراه `cerebras` عرضه می‌شود. GLM از `zai-glm-4.7` استفاده می‌کند؛ نشانی پایه سازگار با OpenAI برابر است با `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## ارائه‌دهندگان از طریق `models.providers` (custom/base URL)

از `models.providers` (یا `models.json`) برای افزودن ارائه‌دهندگان **custom** یا پروکسی‌های سازگار با OpenAI/Anthropic استفاده کنید.

بسیاری از Pluginهای ارائه‌دهنده همراه زیر از قبل یک کاتالوگ پیش‌فرض منتشر می‌کنند. فقط زمانی از ورودی‌های صریح `models.providers.<id>` استفاده کنید که می‌خواهید نشانی پایه پیش‌فرض، سرآیندها، یا فهرست مدل را override کنید.

بررسی‌های قابلیت مدل در Gateway همچنین metadata صریح `models.providers.<id>.models[]` را می‌خوانند. اگر یک مدل custom یا پروکسی تصویر می‌پذیرد، روی آن مدل `input: ["text", "image"]` را تنظیم کنید تا WebChat و مسیرهای پیوست با مبدأ node تصاویر را به‌جای ارجاع‌های رسانه فقط متنی، به‌عنوان ورودی‌های بومی مدل عبور دهند.

### Moonshot AI (Kimi)

Moonshot به‌صورت Plugin ارائه‌دهنده همراه عرضه می‌شود. به‌صورت پیش‌فرض از ارائه‌دهنده داخلی استفاده کنید، و فقط زمانی یک ورودی صریح `models.providers.moonshot` اضافه کنید که لازم است نشانی پایه یا metadata مدل را override کنید:

- ارائه‌دهنده: `moonshot`
- احراز هویت: `MOONSHOT_API_KEY`
- مدل نمونه: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` یا `openclaw onboard --auth-choice moonshot-api-key-cn`

شناسه‌های مدل Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### کدنویسی Kimi

Kimi Coding از نقطهٔ پایانی سازگار با Anthropic متعلق به Moonshot AI استفاده می‌کند:

- ارائه‌دهنده: `kimi`
- احراز هویت: `KIMI_API_KEY`
- مدل نمونه: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

`kimi/k2p5` قدیمی همچنان به‌عنوان شناسهٔ مدل سازگاری پذیرفته می‌شود.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) دسترسی به Doubao و مدل‌های دیگر در چین را فراهم می‌کند.

- ارائه‌دهنده: `volcengine` (کدنویسی: `volcengine-plan`)
- احراز هویت: `VOLCANO_ENGINE_API_KEY`
- مدل نمونه: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

راه‌اندازی اولیه به‌طور پیش‌فرض از سطح کدنویسی استفاده می‌کند، اما کاتالوگ عمومی `volcengine/*` نیز هم‌زمان ثبت می‌شود.

در انتخابگرهای مدلِ راه‌اندازی اولیه/پیکربندی، گزینهٔ احراز هویت Volcengine هر دو ردیف `volcengine/*` و `volcengine-plan/*` را ترجیح می‌دهد. اگر آن مدل‌ها هنوز بارگذاری نشده باشند، OpenClaw به‌جای نمایش یک انتخابگر خالیِ محدود به ارائه‌دهنده، به کاتالوگ بدون فیلتر برمی‌گردد.

<Tabs>
  <Tab title="مدل‌های استاندارد">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="مدل‌های کدنویسی (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (بین‌المللی)

BytePlus ARK برای کاربران بین‌المللی دسترسی به همان مدل‌های Volcano Engine را فراهم می‌کند.

- ارائه‌دهنده: `byteplus` (کدنویسی: `byteplus-plan`)
- احراز هویت: `BYTEPLUS_API_KEY`
- مدل نمونه: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

راه‌اندازی اولیه به‌طور پیش‌فرض از سطح کدنویسی استفاده می‌کند، اما کاتالوگ عمومی `byteplus/*` نیز هم‌زمان ثبت می‌شود.

در انتخابگرهای مدلِ راه‌اندازی اولیه/پیکربندی، گزینه احراز هویت BytePlus هر دو ردیف `byteplus/*` و `byteplus-plan/*` را ترجیح می‌دهد. اگر آن مدل‌ها هنوز بارگذاری نشده باشند، OpenClaw به‌جای نمایش یک انتخابگر خالی محدود به ارائه‌دهنده، به کاتالوگ فیلترنشده بازمی‌گردد.

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic مدل‌های سازگار با Anthropic را پشت ارائه‌دهنده `synthetic` فراهم می‌کند:

- ارائه‌دهنده: `synthetic`
- احراز هویت: `SYNTHETIC_API_KEY`
- مدل نمونه: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax از طریق `models.providers` پیکربندی می‌شود، چون از نقاط پایانی سفارشی استفاده می‌کند:

- MiniMax OAuth (جهانی): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (چین): `--auth-choice minimax-cn-oauth`
- کلید API MiniMax (جهانی): `--auth-choice minimax-global-api`
- کلید API MiniMax (چین): `--auth-choice minimax-cn-api`
- احراز هویت: `MINIMAX_API_KEY` برای `minimax`؛ `MINIMAX_OAUTH_TOKEN` یا `MINIMAX_API_KEY` برای `minimax-portal`

برای جزئیات راه‌اندازی، گزینه‌های مدل، و قطعه‌کدهای پیکربندی، [/providers/minimax](/fa/providers/minimax) را ببینید.

<Note>
در مسیر استریمینگ سازگار با Anthropic در MiniMax، OpenClaw به‌صورت پیش‌فرض thinking را غیرفعال می‌کند مگر اینکه آن را صریحاً تنظیم کنید، و `/fast on` مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.
</Note>

تفکیک قابلیت‌های متعلق به Plugin:

- پیش‌فرض‌های متن/گفت‌وگو روی `minimax/MiniMax-M2.7` می‌مانند
- تولید تصویر `minimax/image-01` یا `minimax-portal/image-01` است
- درک تصویر، `MiniMax-VL-01` متعلق به Plugin در هر دو مسیر احراز هویت MiniMax است
- جست‌وجوی وب روی شناسه ارائه‌دهنده `minimax` می‌ماند

### LM Studio

LM Studio به‌صورت یک Plugin ارائه‌دهنده همراه عرضه می‌شود که از API بومی استفاده می‌کند:

- ارائه‌دهنده: `lmstudio`
- احراز هویت: `LM_API_TOKEN`
- نشانی پایه پیش‌فرض برای استنتاج: `http://localhost:1234/v1`

سپس یک مدل تنظیم کنید (با یکی از شناسه‌هایی که `http://localhost:1234/api/v1/models` برمی‌گرداند جایگزین کنید):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw از `/api/v1/models` و `/api/v1/models/load` بومی LM Studio برای کشف + بارگذاری خودکار استفاده می‌کند، و به‌صورت پیش‌فرض از `/v1/chat/completions` برای استنتاج استفاده می‌کند. برای راه‌اندازی و عیب‌یابی، [/providers/lmstudio](/fa/providers/lmstudio) را ببینید.

### Ollama

Ollama به‌صورت یک Plugin ارائه‌دهنده همراه عرضه می‌شود و از API بومی Ollama استفاده می‌کند:

- ارائه‌دهنده: `ollama`
- احراز هویت: لازم نیست (سرور محلی)
- مدل نمونه: `ollama/llama3.3`
- نصب: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

وقتی با `OLLAMA_API_KEY` وارد شوید، Ollama به‌صورت محلی در `http://127.0.0.1:11434` شناسایی می‌شود، و Plugin ارائه‌دهنده همراه، Ollama را مستقیماً به `openclaw onboard` و انتخابگر مدل اضافه می‌کند. برای راه‌اندازی اولیه، حالت ابری/محلی، و پیکربندی سفارشی، [/providers/ollama](/fa/providers/ollama) را ببینید.

### vLLM

vLLM به‌صورت یک Plugin ارائه‌دهنده همراه برای سرورهای محلی/خودمیزبان سازگار با OpenAI عرضه می‌شود:

- ارائه‌دهنده: `vllm`
- احراز هویت: اختیاری (به سرور شما بستگی دارد)
- نشانی پایه پیش‌فرض: `http://127.0.0.1:8000/v1`

برای ورود به کشف خودکار محلی (اگر سرور شما احراز هویت را اجبار نکند، هر مقداری کار می‌کند):

```bash
export VLLM_API_KEY="vllm-local"
```

سپس یک مدل تنظیم کنید (با یکی از شناسه‌هایی که `/v1/models` برمی‌گرداند جایگزین کنید):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

برای جزئیات، [/providers/vllm](/fa/providers/vllm) را ببینید.

### SGLang

SGLang به‌صورت یک Plugin ارائه‌دهنده همراه برای سرورهای سریع خودمیزبان سازگار با OpenAI عرضه می‌شود:

- ارائه‌دهنده: `sglang`
- احراز هویت: اختیاری (به سرور شما بستگی دارد)
- نشانی پایه پیش‌فرض: `http://127.0.0.1:30000/v1`

برای ورود به کشف خودکار محلی (اگر سرور شما احراز هویت را اجبار نکند، هر مقداری کار می‌کند):

```bash
export SGLANG_API_KEY="sglang-local"
```

سپس یک مدل تنظیم کنید (با یکی از شناسه‌هایی که `/v1/models` برمی‌گرداند جایگزین کنید):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

برای جزئیات، [/providers/sglang](/fa/providers/sglang) را ببینید.

### پراکسی‌های محلی (LM Studio، vLLM، LiteLLM، و غیره)

نمونه (سازگار با OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Default optional fields">
    برای ارائه‌دهندگان سفارشی، `reasoning`، `input`، `cost`، `contextWindow`، و `maxTokens` اختیاری هستند. وقتی حذف شوند، OpenClaw به‌صورت پیش‌فرض این مقادیر را استفاده می‌کند:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    توصیه‌شده: مقادیر صریحی تنظیم کنید که با محدودیت‌های پراکسی/مدل شما مطابقت داشته باشند.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - برای `api: "openai-completions"` روی نقاط پایانی غیربومی (هر `baseUrl` غیرخالی که میزبان آن `api.openai.com` نباشد)، OpenClaw مقدار `compat.supportsDeveloperRole: false` را اجبار می‌کند تا از خطاهای 400 ارائه‌دهنده برای نقش‌های پشتیبانی‌نشده `developer` جلوگیری کند.
    - مسیرهای سازگار با OpenAI به سبک پراکسی، شکل‌دهی درخواست مخصوص OpenAI بومی را نیز رد می‌کنند: بدون `service_tier`، بدون Responses `store`، بدون Completions `store`، بدون راهنمایی‌های prompt-cache، بدون شکل‌دهی payload سازگاری reasoning در OpenAI، و بدون هدرهای انتساب مخفی OpenClaw.
    - برای پراکسی‌های Completions سازگار با OpenAI که به فیلدهای مخصوص فروشنده نیاز دارند، `agents.defaults.models["provider/model"].params.extra_body` (یا `extraBody`) را تنظیم کنید تا JSON اضافی در بدنه درخواست خروجی ادغام شود.
    - برای کنترل‌های chat-template در vLLM، `agents.defaults.models["provider/model"].params.chat_template_kwargs` را تنظیم کنید. Plugin همراه vLLM وقتی سطح thinking نشست خاموش باشد، برای `vllm/nemotron-3-*` به‌صورت خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند.
    - برای مدل‌های محلی کند یا میزبان‌های LAN/tailnet راه‌دور، `models.providers.<id>.timeoutSeconds` را تنظیم کنید. این کار رسیدگی به درخواست HTTP مدل ارائه‌دهنده را، شامل اتصال، هدرها، استریم بدنه، و توقف guarded-fetch کلی، بدون افزایش timeout کل زمان اجرای agent گسترش می‌دهد.
    - اگر `baseUrl` خالی/حذف شده باشد، OpenClaw رفتار پیش‌فرض OpenAI را حفظ می‌کند (که به `api.openai.com` resolve می‌شود).
    - برای ایمنی، مقدار صریح `compat.supportsDeveloperRole: true` همچنان روی نقاط پایانی غیربومی `openai-completions` override می‌شود.
    - برای `api: "anthropic-messages"` روی نقاط پایانی غیرمستقیم (هر ارائه‌دهنده‌ای غیر از `anthropic` متعارف، یا یک `models.providers.anthropic.baseUrl` سفارشی که میزبان آن یک نقطه پایانی عمومی `api.anthropic.com` نباشد)، OpenClaw هدرهای beta ضمنی Anthropic مانند `claude-code-20250219`، `interleaved-thinking-2025-05-14`، و نشانگرهای OAuth را سرکوب می‌کند، تا پراکسی‌های سفارشی سازگار با Anthropic پرچم‌های beta پشتیبانی‌نشده را رد نکنند. اگر پراکسی شما به قابلیت‌های beta خاصی نیاز دارد، `models.providers.<id>.headers["anthropic-beta"]` را صریحاً تنظیم کنید.

  </Accordion>
</AccordionGroup>

## نمونه‌های CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

همچنین ببینید: [پیکربندی](/fa/gateway/configuration) برای نمونه‌های کامل پیکربندی.

## مرتبط

- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) — کلیدهای پیکربندی مدل
- [failover مدل](/fa/concepts/model-failover) — زنجیره‌های fallback و رفتار retry
- [مدل‌ها](/fa/concepts/models) — پیکربندی مدل و aliasها
- [ارائه‌دهندگان](/fa/providers) — راهنماهای راه‌اندازی برای هر ارائه‌دهنده
