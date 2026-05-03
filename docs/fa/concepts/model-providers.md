---
read_when:
    - به یک مرجع راه‌اندازی مدل برای هر ارائه‌دهنده نیاز دارید
    - شما پیکربندی‌های نمونه یا دستورهای راه‌اندازی CLI برای ارائه‌دهندگان مدل می‌خواهید
sidebarTitle: Model providers
summary: نمای کلی ارائه‌دهندهٔ مدل همراه با پیکربندی‌های نمونه + جریان‌های CLI
title: ارائه‌دهندگان مدل
x-i18n:
    generated_at: "2026-05-03T21:31:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2c94e8f0c8d70cd772990e4d9d41a5670855eef4aea5162e021f18d5ee6c899
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع **ارائه‌دهندگان LLM/مدل** (نه کانال‌های گفتگو مانند WhatsApp/Telegram). برای قواعد انتخاب مدل، [مدل‌ها](/fa/concepts/models) را ببینید.

## قواعد سریع

<AccordionGroup>
  <Accordion title="ارجاع‌های مدل و کمک‌کننده‌های CLI">
    - ارجاع‌های مدل از `provider/model` استفاده می‌کنند (مثال: `opencode/claude-opus-4-6`).
    - وقتی `agents.defaults.models` تنظیم شده باشد، مانند فهرست مجاز عمل می‌کند.
    - کمک‌کننده‌های CLI: `openclaw onboard`، `openclaw models list`، `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` پیش‌فرض‌های سطح ارائه‌دهنده را تنظیم می‌کنند؛ `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` آن‌ها را برای هر مدل بازنویسی می‌کنند.
    - قواعد fallback، پروب‌های cooldown، و پایداری بازنویسی نشست: [failover مدل](/fa/concepts/model-failover).

  </Accordion>
  <Accordion title="افزودن احراز هویت ارائه‌دهنده مدل اصلی شما را تغییر نمی‌دهد">
    `openclaw configure` هنگام افزودن یا احراز هویت دوباره یک ارائه‌دهنده، مقدار موجود `agents.defaults.model.primary` را حفظ می‌کند. Pluginهای ارائه‌دهنده همچنان ممکن است در وصله پیکربندی احراز هویت خود یک مدل پیش‌فرض پیشنهادی برگردانند، اما وقتی یک مدل اصلی از قبل وجود دارد، configure آن را به‌معنای «این مدل را در دسترس قرار بده» در نظر می‌گیرد، نه «مدل اصلی فعلی را جایگزین کن».

    برای تغییر عمدی مدل پیش‌فرض، از `openclaw models set <provider/model>` یا `openclaw models auth login --provider <id> --set-default` استفاده کنید.

  </Accordion>
  <Accordion title="تفکیک ارائه‌دهنده/زمان اجرای OpenAI">
    مسیرهای خانواده OpenAI مخصوص پیشوند هستند:

    - `openai/<model>` همراه با `agents.defaults.agentRuntime.id: "codex"` از harness بومی سرور برنامه Codex استفاده می‌کند. این راه‌اندازی معمول اشتراک ChatGPT/Codex است.
    - `openai-codex/<model>` از OAuth مربوط به Codex در PI استفاده می‌کند.
    - `openai/<model>` بدون بازنویسی زمان اجرای Codex از ارائه‌دهنده مستقیم کلید API OpenAI در PI استفاده می‌کند.

    [OpenAI](/fa/providers/openai) و [harness مربوط به Codex](/fa/plugins/codex-harness) را ببینید. اگر تفکیک ارائه‌دهنده/زمان اجرا گیج‌کننده است، ابتدا [زمان‌های اجرای Agent](/fa/concepts/agent-runtimes) را بخوانید.

    فعال‌سازی خودکار Plugin از همان مرز پیروی می‌کند: `openai-codex/<model>` متعلق به Plugin OpenAI است، در حالی که Plugin Codex با `agentRuntime.id: "codex"` یا ارجاع‌های legacy مانند `codex/<model>` فعال می‌شود.

    GPT-5.5 از طریق harness بومی سرور برنامه Codex وقتی `agentRuntime.id: "codex"` تنظیم شده باشد، از طریق `openai-codex/gpt-5.5` در PI برای OAuth مربوط به Codex، و از طریق `openai/gpt-5.5` در PI برای ترافیک مستقیم کلید API وقتی حساب شما آن را ارائه می‌کند، در دسترس است.

  </Accordion>
  <Accordion title="زمان‌های اجرای CLI">
    زمان‌های اجرای CLI از همان تفکیک استفاده می‌کنند: ارجاع‌های مدل canonical مانند `anthropic/claude-*`، `google/gemini-*` یا `openai/gpt-*` را انتخاب کنید، سپس وقتی یک backend محلی CLI می‌خواهید، `agents.defaults.agentRuntime.id` را روی `claude-cli`، `google-gemini-cli` یا `codex-cli` تنظیم کنید.

    ارجاع‌های legacy مانند `claude-cli/*`، `google-gemini-cli/*` و `codex-cli/*` به ارجاع‌های canonical ارائه‌دهنده برمی‌گردند و runtime جداگانه ثبت می‌شود.

  </Accordion>
</AccordionGroup>

## رفتار ارائه‌دهنده تحت مالکیت Plugin

بیشتر منطق اختصاصی ارائه‌دهنده در Pluginهای ارائه‌دهنده (`registerProvider(...)`) قرار دارد، در حالی که OpenClaw حلقه استنتاج عمومی را نگه می‌دارد. Pluginها مالک onboarding، کاتالوگ‌های مدل، نگاشت متغیرهای محیطی احراز هویت، عادی‌سازی transport/config، پاک‌سازی tool-schema، طبقه‌بندی failover، تازه‌سازی OAuth، گزارش استفاده، پروفایل‌های thinking/reasoning، و موارد بیشتر هستند.

فهرست کامل hookهای provider-SDK و نمونه‌های Pluginهای bundled در [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) قرار دارد. ارائه‌دهنده‌ای که به مجری درخواست کاملا سفارشی نیاز دارد، سطح توسعه جداگانه و عمیق‌تری است.

<Note>
رفتار runner تحت مالکیت ارائه‌دهنده روی hookهای صریح ارائه‌دهنده مانند سیاست replay، عادی‌سازی tool-schema، stream wrapping، و کمک‌کننده‌های transport/request قرار دارد. کیف static legacy مربوط به `ProviderPlugin.capabilities` فقط برای سازگاری است و دیگر توسط منطق runner مشترک خوانده نمی‌شود.
</Note>

## چرخش کلید API

<AccordionGroup>
  <Accordion title="منابع کلید و اولویت">
    چندین کلید را از این راه‌ها پیکربندی کنید:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (بازنویسی زنده تکی، بالاترین اولویت)
    - `<PROVIDER>_API_KEYS` (فهرست جداشده با کاما یا سمی‌کالن)
    - `<PROVIDER>_API_KEY` (کلید اصلی)
    - `<PROVIDER>_API_KEY_*` (فهرست شماره‌گذاری‌شده، مثلا `<PROVIDER>_API_KEY_1`)

    برای ارائه‌دهندگان Google، `GOOGLE_API_KEY` نیز به‌عنوان fallback گنجانده می‌شود. ترتیب انتخاب کلید اولویت را حفظ می‌کند و مقادیر تکراری را حذف می‌کند.

  </Accordion>
  <Accordion title="زمان شروع چرخش">
    - درخواست‌ها فقط در پاسخ‌های rate-limit با کلید بعدی دوباره تلاش می‌شوند (برای مثال `429`، `rate_limit`، `quota`، `resource exhausted`، `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، یا پیام‌های دوره‌ای usage-limit).
    - خطاهای غیر rate-limit بلافاصله شکست می‌خورند؛ هیچ چرخش کلیدی انجام نمی‌شود.
    - وقتی همه کلیدهای نامزد شکست بخورند، خطای نهایی از آخرین تلاش برگردانده می‌شود.

  </Accordion>
</AccordionGroup>

## ارائه‌دهندگان داخلی (کاتالوگ pi-ai)

OpenClaw همراه با کاتالوگ pi‑ai عرضه می‌شود. این ارائه‌دهندگان به هیچ پیکربندی `models.providers` نیاز ندارند؛ فقط احراز هویت را تنظیم کنید و یک مدل انتخاب کنید.

### OpenAI

- ارائه‌دهنده: `openai`
- احراز هویت: `OPENAI_API_KEY`
- چرخش اختیاری: `OPENAI_API_KEYS`، `OPENAI_API_KEY_1`، `OPENAI_API_KEY_2`، به‌علاوه `OPENCLAW_LIVE_OPENAI_KEY` (بازنویسی تکی)
- مدل‌های نمونه: `openai/gpt-5.5`، `openai/gpt-5.4-mini`
- اگر یک نصب مشخص یا کلید API رفتاری متفاوت دارد، دسترس‌پذیری حساب/مدل را با `openclaw models list --provider openai` بررسی کنید.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport پیش‌فرض `auto` است (ابتدا WebSocket، با fallback به SSE)
- برای هر مدل از طریق `agents.defaults.models["openai/<model>"].params.transport` بازنویسی کنید (`"sse"`، `"websocket"`، یا `"auto"`)
- warm-up مربوط به OpenAI Responses WebSocket به‌طور پیش‌فرض از طریق `params.openaiWsWarmup` فعال است (`true`/`false`)
- پردازش اولویت‌دار OpenAI از طریق `agents.defaults.models["openai/<model>"].params.serviceTier` قابل فعال‌سازی است
- `/fast` و `params.fastMode` درخواست‌های مستقیم `openai/*` Responses را روی `api.openai.com` به `service_tier=priority` نگاشت می‌کنند
- وقتی به‌جای toggle مشترک `/fast` یک tier صریح می‌خواهید، از `params.serviceTier` استفاده کنید
- headerهای پنهان attribution مربوط به OpenClaw (`originator`، `version`، `User-Agent`) فقط روی ترافیک بومی OpenAI به `api.openai.com` اعمال می‌شوند، نه proxyهای عمومی سازگار با OpenAI
- مسیرهای بومی OpenAI همچنین `store` مربوط به Responses، hintهای prompt-cache، و شکل‌دهی payload سازگار با reasoning در OpenAI را حفظ می‌کنند؛ مسیرهای proxy این کار را نمی‌کنند
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
- درخواست‌های عمومی مستقیم Anthropic از toggle مشترک `/fast` و `params.fastMode` پشتیبانی می‌کنند، از جمله ترافیک احراز هویت‌شده با کلید API و OAuth که به `api.anthropic.com` ارسال می‌شود؛ OpenClaw آن را به `service_tier` مربوط به Anthropic نگاشت می‌کند (`auto` در برابر `standard_only`)
- پیکربندی ترجیحی Claude CLI ارجاع مدل را canonical نگه می‌دارد و backend مربوط به CLI را جداگانه انتخاب می‌کند: `anthropic/claude-opus-4-7` با `agents.defaults.agentRuntime.id: "claude-cli"`. ارجاع‌های legacy مانند `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند.

<Note>
کارکنان Anthropic به ما گفته‌اند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفاده دوباره از Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند. setup-token مربوط به Anthropic همچنان به‌عنوان مسیر token پشتیبانی‌شده OpenClaw در دسترس است، اما OpenClaw اکنون در صورت دسترس‌پذیری، استفاده دوباره از Claude CLI و `claude -p` را ترجیح می‌دهد.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- ارائه‌دهنده: `openai-codex`
- احراز هویت: OAuth (ChatGPT)
- ارجاع مدل PI: `openai-codex/gpt-5.5`
- ارجاع harness بومی سرور برنامه Codex: `openai/gpt-5.5` با `agents.defaults.agentRuntime.id: "codex"`
- مستندات harness بومی سرور برنامه Codex: [harness مربوط به Codex](/fa/plugins/codex-harness)
- ارجاع‌های legacy مدل: `codex/gpt-*`
- مرز Plugin: `openai-codex/*` Plugin OpenAI را بارگذاری می‌کند؛ Plugin بومی سرور برنامه Codex فقط با runtime مربوط به Codex harness یا ارجاع‌های legacy مانند `codex/*` انتخاب می‌شود.
- CLI: `openclaw onboard --auth-choice openai-codex` یا `openclaw models auth login --provider openai-codex`
- transport پیش‌فرض `auto` است (ابتدا WebSocket، با fallback به SSE)
- برای هر مدل PI از طریق `agents.defaults.models["openai-codex/<model>"].params.transport` بازنویسی کنید (`"sse"`، `"websocket"`، یا `"auto"`)
- `params.serviceTier` همچنین روی درخواست‌های بومی Codex Responses (`chatgpt.com/backend-api`) ارسال می‌شود
- headerهای پنهان attribution مربوط به OpenClaw (`originator`، `version`، `User-Agent`) فقط روی ترافیک بومی Codex به `chatgpt.com/backend-api` متصل می‌شوند، نه proxyهای عمومی سازگار با OpenAI
- همان پیکربندی toggle مربوط به `/fast` و `params.fastMode` را مانند `openai/*` مستقیم به اشتراک می‌گذارد؛ OpenClaw آن را به `service_tier=priority` نگاشت می‌کند
- `openai-codex/gpt-5.5` از `contextWindow = 400000` بومی کاتالوگ Codex و runtime پیش‌فرض `contextTokens = 272000` استفاده می‌کند؛ سقف runtime را با `models.providers.openai-codex.models[].contextTokens` بازنویسی کنید
- یادداشت سیاست: OpenAI Codex OAuth صراحتا برای ابزارها/workflowهای خارجی مانند OpenClaw پشتیبانی می‌شود.
- برای مسیر رایج اشتراک به‌علاوه runtime بومی Codex، با احراز هویت `openai-codex` وارد شوید اما `openai/gpt-5.5` به‌علاوه `agents.defaults.agentRuntime.id: "codex"` را پیکربندی کنید.
- فقط وقتی از `openai-codex/gpt-5.5` استفاده کنید که مسیر OAuth/اشتراک Codex از طریق PI را می‌خواهید؛ وقتی setup کلید API شما و کاتالوگ محلی مسیر API عمومی را ارائه می‌کنند، از `openai/gpt-5.5` بدون بازنویسی runtime مربوط به Codex استفاده کنید.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex" },
    },
  },
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

### گزینه‌های hosted دیگر به سبک اشتراک

<CardGroup cols={3}>
  <Card title="مدل‌های GLM" href="/fa/providers/glm">
    Z.AI Coding Plan یا endpointهای عمومی API.
  </Card>
  <Card title="MiniMax" href="/fa/providers/minimax">
    دسترسی MiniMax Coding Plan OAuth یا کلید API.
  </Card>
  <Card title="Qwen Cloud" href="/fa/providers/qwen">
    سطح ارائه‌دهنده Qwen Cloud به‌علاوه نگاشت endpoint مربوط به Alibaba DashScope و Coding Plan.
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
- چرخش اختیاری: `GEMINI_API_KEYS`، `GEMINI_API_KEY_1`، `GEMINI_API_KEY_2`، جایگزین `GOOGLE_API_KEY`، و `OPENCLAW_LIVE_GEMINI_KEY` (بازنویسی تکی)
- مدل‌های نمونه: `google/gemini-3.1-pro-preview`، `google/gemini-3-flash-preview`
- سازگاری: پیکربندی قدیمی OpenClaw که از `google/gemini-3.1-flash-preview` استفاده می‌کند به `google/gemini-3-flash-preview` نرمال‌سازی می‌شود
- نام مستعار: `google/gemini-3.1-pro` پذیرفته می‌شود و به شناسه Gemini API زنده Google، یعنی `google/gemini-3.1-pro-preview`، نرمال‌سازی می‌شود
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- تفکر: `/think adaptive` از تفکر پویای Google استفاده می‌کند. Gemini 3/3.1 یک `thinkingLevel` ثابت را حذف می‌کنند؛ Gemini 2.5 مقدار `thinkingBudget: -1` را می‌فرستد.
- اجراهای مستقیم Gemini همچنین `agents.defaults.models["google/<model>"].params.cachedContent` (یا `cached_content` قدیمی) را می‌پذیرند تا یک هندل بومیِ ارائه‌دهنده با قالب `cachedContents/...` را ارسال کنند؛ برخوردهای کش Gemini به‌صورت `cacheRead` در OpenClaw نمایش داده می‌شوند

### Google Vertex و Gemini CLI

- ارائه‌دهنده‌ها: `google-vertex`، `google-gemini-cli`
- احراز هویت: Vertex از gcloud ADC استفاده می‌کند؛ Gemini CLI از جریان OAuth خودش استفاده می‌کند

<Warning>
Gemini CLI OAuth در OpenClaw یک یکپارچه‌سازی غیررسمی است. برخی کاربران پس از استفاده از کلاینت‌های شخص ثالث، محدودیت‌هایی را روی حساب Google خود گزارش کرده‌اند. شرایط Google را بررسی کنید و اگر تصمیم به ادامه دارید، از یک حساب غیرحیاتی استفاده کنید.
</Warning>

Gemini CLI OAuth به‌عنوان بخشی از Plugin بسته‌بندی‌شده `google` عرضه می‌شود.

<Steps>
  <Step title="نصب Gemini CLI">
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
  <Step title="فعال‌سازی Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="ورود">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    مدل پیش‌فرض: `google-gemini-cli/gemini-3-flash-preview`. شما **نباید** شناسه کلاینت یا secret را در `openclaw.json` جای‌گذاری کنید. جریان ورود CLI توکن‌ها را در پروفایل‌های احراز هویت روی میزبان Gateway ذخیره می‌کند.

  </Step>
  <Step title="تنظیم پروژه (در صورت نیاز)">
    اگر درخواست‌ها پس از ورود ناموفق بودند، `GOOGLE_CLOUD_PROJECT` یا `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید.
  </Step>
</Steps>

پاسخ‌های JSON مربوط به Gemini CLI از `response` پارس می‌شوند؛ میزان مصرف به `stats` برمی‌گردد، و `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.

### Z.AI (GLM)

- ارائه‌دهنده: `zai`
- احراز هویت: `ZAI_API_KEY`
- مدل نمونه: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - نام‌های مستعار: `z.ai/*` و `z-ai/*` به `zai/*` نرمال‌سازی می‌شوند
  - `zai-api-key` نقطه پایانی متناظر Z.AI را به‌صورت خودکار تشخیص می‌دهد؛ `zai-coding-global`، `zai-coding-cn`، `zai-global` و `zai-cn` یک سطح مشخص را اجباری می‌کنند

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
- URL پایه: `https://api.kilo.ai/api/gateway/`
- کاتالوگ جایگزین ایستا `kilocode/kilo/auto` را عرضه می‌کند؛ کشف زنده `https://api.kilo.ai/api/gateway/models` می‌تواند کاتالوگ زمان اجرا را بیشتر گسترش دهد.
- مسیریابی دقیق بالادستی پشت `kilocode/kilo/auto` در مالکیت Kilo Gateway است و در OpenClaw سخت‌کد نشده است.

برای جزئیات راه‌اندازی، [/providers/kilocode](/fa/providers/kilocode) را ببینید.

### سایر Pluginهای ارائه‌دهنده بسته‌بندی‌شده

| ارائه‌دهنده             | شناسه                            | متغیر محیطی احراز هویت                                      | مدل نمونه                                      |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
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
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### نکات خاصی که دانستنشان مفید است

<AccordionGroup>
  <Accordion title="OpenRouter">
    سرآیندهای انتساب برنامه و نشانگرهای Anthropic `cache_control` را فقط روی مسیرهای تاییدشده‌ی `openrouter.ai` اعمال می‌کند. ارجاع‌های DeepSeek، Moonshot و ZAI برای کش پرامپت مدیریت‌شده توسط OpenRouter واجد شرایط cache-TTL هستند، اما نشانگرهای کش Anthropic را دریافت نمی‌کنند. به‌عنوان یک مسیر سازگار با OpenAI به سبک پروکسی، شکل‌دهی‌های فقط مخصوص OpenAI بومی را رد می‌کند (`serviceTier`، Responses `store`، راهنمایی‌های prompt-cache، سازگاری reasoning با OpenAI). ارجاع‌های مبتنی بر Gemini فقط پاک‌سازی امضای تفکر proxy-Gemini را نگه می‌دارند.
  </Accordion>
  <Accordion title="Kilo Gateway">
    ارجاع‌های مبتنی بر Gemini همان مسیر پاک‌سازی proxy-Gemini را دنبال می‌کنند؛ `kilocode/kilo/auto` و سایر ارجاع‌هایی که reasoning پروکسی را پشتیبانی نمی‌کنند، تزریق reasoning پروکسی را رد می‌کنند.
  </Accordion>
  <Accordion title="MiniMax">
    راه‌اندازی با کلید API، تعریف‌های صریح مدل گفت‌وگوی فقط متنی M2.7 را می‌نویسد؛ درک تصویر روی ارائه‌دهنده‌ی رسانه‌ی `MiniMax-VL-01` که در مالکیت Plugin است باقی می‌ماند.
  </Accordion>
  <Accordion title="NVIDIA">
    شناسه‌های مدل از فضای نام `nvidia/<vendor>/<model>` استفاده می‌کنند (برای مثال `nvidia/nvidia/nemotron-...` در کنار `nvidia/moonshotai/kimi-k2.5`)؛ انتخابگرها ترکیب لفظی `<provider>/<model-id>` را حفظ می‌کنند، درحالی‌که کلید canonical ارسالی به API تک‌پیشوندی باقی می‌ماند.
  </Accordion>
  <Accordion title="xAI">
    از مسیر xAI Responses استفاده می‌کند. `grok-4.3` مدل گفت‌وگوی پیش‌فرض بسته‌بندی‌شده است. `/fast` یا `params.fastMode: true`، مدل‌های `grok-3`، `grok-3-mini`، `grok-4` و `grok-4-0709` را به گونه‌های `*-fast` آن‌ها بازنویسی می‌کند. `tool_stream` به‌طور پیش‌فرض روشن است؛ با `agents.defaults.models["xai/<model>"].params.tool_stream=false` غیرفعالش کنید.
  </Accordion>
  <Accordion title="Cerebras">
    به‌عنوان Plugin ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی `cerebras` عرضه می‌شود. GLM از `zai-glm-4.7` استفاده می‌کند؛ URL پایه‌ی سازگار با OpenAI برابر است با `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## ارائه‌دهندگان از طریق `models.providers` (URL سفارشی/پایه)

از `models.providers` (یا `models.json`) برای افزودن ارائه‌دهندگان **سفارشی** یا پروکسی‌های سازگار با OpenAI/Anthropic استفاده کنید.

بسیاری از Pluginهای ارائه‌دهنده‌ی بسته‌بندی‌شده در ادامه، از قبل یک کاتالوگ پیش‌فرض منتشر می‌کنند. فقط زمانی از ورودی‌های صریح `models.providers.<id>` استفاده کنید که می‌خواهید URL پایه، سرآیندها یا فهرست مدل پیش‌فرض را بازنویسی کنید.

بررسی‌های قابلیت مدل در Gateway همچنین فراداده‌ی صریح `models.providers.<id>.models[]` را می‌خوانند. اگر یک مدل سفارشی یا پروکسی تصویر می‌پذیرد، روی آن مدل `input: ["text", "image"]` را تنظیم کنید تا WebChat و مسیرهای پیوست با مبدا Node، تصاویر را به‌جای ارجاع‌های رسانه‌ای فقط متنی، به‌عنوان ورودی‌های بومی مدل ارسال کنند.

### Moonshot AI (Kimi)

Moonshot به‌عنوان یک Plugin ارائه‌دهنده‌ی بسته‌بندی‌شده عرضه می‌شود. به‌طور پیش‌فرض از ارائه‌دهنده‌ی داخلی استفاده کنید، و فقط زمانی یک ورودی صریح `models.providers.moonshot` اضافه کنید که لازم است URL پایه یا فراداده‌ی مدل را بازنویسی کنید:

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

Kimi Coding از نقطه‌ی پایانی سازگار با Anthropic متعلق به Moonshot AI استفاده می‌کند:

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

شناسه مدل قدیمی `kimi/k2p5` همچنان برای سازگاری پذیرفته می‌شود.

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

آنبوردینگ به‌صورت پیش‌فرض از سطح کدنویسی استفاده می‌کند، اما کاتالوگ عمومی `volcengine/*` هم‌زمان ثبت می‌شود.

در انتخابگرهای مدلِ آنبوردینگ/پیکربندی، گزینه احراز هویت Volcengine هر دو ردیف `volcengine/*` و `volcengine-plan/*` را ترجیح می‌دهد. اگر این مدل‌ها هنوز بارگذاری نشده باشند، OpenClaw به‌جای نمایش یک انتخابگر خالیِ محدود به ارائه‌دهنده، به کاتالوگ بدون فیلتر بازمی‌گردد.

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

آنبوردینگ به‌صورت پیش‌فرض از سطح کدنویسی استفاده می‌کند، اما کاتالوگ عمومی `byteplus/*` هم‌زمان ثبت می‌شود.

در انتخابگرهای مدلِ آنبوردینگ/پیکربندی، گزینه احراز هویت BytePlus هر دو ردیف `byteplus/*` و `byteplus-plan/*` را ترجیح می‌دهد. اگر این مدل‌ها هنوز بارگذاری نشده باشند، OpenClaw به‌جای نمایش یک انتخابگر خالیِ محدود به ارائه‌دهنده، به کاتالوگ بدون فیلتر بازمی‌گردد.

<Tabs>
  <Tab title="مدل‌های استاندارد">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="مدل‌های کدنویسی (byteplus-plan)">
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

MiniMax از طریق `models.providers` پیکربندی می‌شود، چون از endpointهای سفارشی استفاده می‌کند:

- MiniMax OAuth (جهانی): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (چین): `--auth-choice minimax-cn-oauth`
- کلید API MiniMax (جهانی): `--auth-choice minimax-global-api`
- کلید API MiniMax (چین): `--auth-choice minimax-cn-api`
- احراز هویت: `MINIMAX_API_KEY` برای `minimax`؛ `MINIMAX_OAUTH_TOKEN` یا `MINIMAX_API_KEY` برای `minimax-portal`

برای جزئیات راه‌اندازی، گزینه‌های مدل، و قطعه‌کدهای پیکربندی، [/providers/minimax](/fa/providers/minimax) را ببینید.

<Note>
در مسیر استریم سازگار با Anthropic مربوط به MiniMax، OpenClaw به‌صورت پیش‌فرض thinking را غیرفعال می‌کند مگر اینکه آن را صراحتا تنظیم کنید، و `/fast on` مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.
</Note>

تفکیک قابلیت‌های تحت مالکیت Plugin:

- پیش‌فرض‌های متن/چت روی `minimax/MiniMax-M2.7` باقی می‌مانند
- تولید تصویر `minimax/image-01` یا `minimax-portal/image-01` است
- درک تصویر قابلیت تحت مالکیت Plugin با نام `MiniMax-VL-01` در هر دو مسیر احراز هویت MiniMax است
- جست‌وجوی وب روی شناسه ارائه‌دهنده `minimax` باقی می‌ماند

### LM Studio

LM Studio به‌صورت یک Plugin ارائه‌دهنده همراه عرضه می‌شود که از API بومی استفاده می‌کند:

- ارائه‌دهنده: `lmstudio`
- احراز هویت: `LM_API_TOKEN`
- URL پایه پیش‌فرض برای استنتاج: `http://localhost:1234/v1`

سپس یک مدل تنظیم کنید (با یکی از شناسه‌هایی که `http://localhost:1234/api/v1/models` برمی‌گرداند جایگزین کنید):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw به‌طور پیش‌فرض از `/api/v1/models` و `/api/v1/models/load` بومی LM Studio برای کشف + بارگذاری خودکار، و از `/v1/chat/completions` برای استنتاج استفاده می‌کند. اگر می‌خواهید بارگذاری JIT، TTL و حذف خودکار LM Studio چرخه عمر مدل را مدیریت کنند، `models.providers.lmstudio.params.preload: false` را تنظیم کنید. برای راه‌اندازی و عیب‌یابی، [/providers/lmstudio](/fa/providers/lmstudio) را ببینید.

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

Ollama وقتی با `OLLAMA_API_KEY` آن را فعال کنید، به‌صورت محلی در `http://127.0.0.1:11434` شناسایی می‌شود، و Plugin ارائه‌دهنده همراه، Ollama را مستقیما به `openclaw onboard` و انتخابگر مدل اضافه می‌کند. برای آماده‌سازی اولیه، حالت ابری/محلی، و پیکربندی سفارشی، [/providers/ollama](/fa/providers/ollama) را ببینید.

### vLLM

vLLM به‌صورت یک Plugin ارائه‌دهنده همراه برای سرورهای محلی/خودمیزبان سازگار با OpenAI عرضه می‌شود:

- ارائه‌دهنده: `vllm`
- احراز هویت: اختیاری (به سرور شما بستگی دارد)
- نشانی پایه پیش‌فرض: `http://127.0.0.1:8000/v1`

برای فعال‌سازی کشف خودکار به‌صورت محلی (اگر سرور شما احراز هویت را اجباری نکند، هر مقداری کار می‌کند):

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

برای فعال‌سازی کشف خودکار به‌صورت محلی (اگر سرور شما احراز هویت را اجباری نکند، هر مقداری کار می‌کند):

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

### پراکسی‌های محلی (LM Studio، vLLM، LiteLLM و غیره)

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
    برای ارائه‌دهندگان سفارشی، `reasoning`، `input`، `cost`، `contextWindow` و `maxTokens` اختیاری هستند. وقتی حذف شوند، OpenClaw به‌طور پیش‌فرض از این‌ها استفاده می‌کند:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    توصیه می‌شود: مقدارهای صریحی تنظیم کنید که با محدودیت‌های پراکسی/مدل شما سازگار باشند.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - برای `api: "openai-completions"` روی نقاط پایانی غیربومی (هر `baseUrl` غیرخالی که میزبان آن `api.openai.com` نباشد)، OpenClaw مقدار `compat.supportsDeveloperRole: false` را اجباری می‌کند تا از خطاهای 400 ارائه‌دهنده برای نقش‌های پشتیبانی‌نشده `developer` جلوگیری شود.
    - مسیرهای سازگار با OpenAI به سبک پراکسی، شکل‌دهی درخواست مختص OpenAI بومی را نیز رد می‌کنند: بدون `service_tier`، بدون `store` مربوط به Responses، بدون `store` مربوط به Completions، بدون راهنمایی‌های prompt-cache، بدون شکل‌دهی payload سازگاری استدلال OpenAI، و بدون سرآیندهای انتساب پنهان OpenClaw.
    - برای پراکسی‌های Completions سازگار با OpenAI که به فیلدهای ویژه فروشنده نیاز دارند، `agents.defaults.models["provider/model"].params.extra_body` (یا `extraBody`) را تنظیم کنید تا JSON اضافی با بدنه درخواست خروجی ادغام شود.
    - برای کنترل‌های chat-template در vLLM، `agents.defaults.models["provider/model"].params.chat_template_kwargs` را تنظیم کنید. وقتی سطح تفکر نشست خاموش باشد، Plugin همراه vLLM به‌طور خودکار برای `vllm/nemotron-3-*` مقدارهای `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند.
    - برای مدل‌های محلی کند یا میزبان‌های LAN/tailnet راه‌دور، `models.providers.<id>.timeoutSeconds` را تنظیم کنید. این مقدار رسیدگی به درخواست HTTP مدل ارائه‌دهنده را، شامل اتصال، سرآیندها، جریان‌دهی بدنه، و لغو کل guarded-fetch، بدون افزایش زمان انقضای کل زمان اجرای agent افزایش می‌دهد.
    - فراخوانی‌های HTTP ارائه‌دهنده مدل، پاسخ‌های DNS از نوع fake-IP مربوط به Surge، Clash و sing-box را در `198.18.0.0/15` و `fc00::/7` فقط برای نام میزبان `baseUrl` ارائه‌دهنده پیکربندی‌شده مجاز می‌دانند. مقصدهای خصوصی، loopback، link-local و metadata دیگر همچنان به فعال‌سازی صریح `models.providers.<id>.request.allowPrivateNetwork: true` نیاز دارند.
    - اگر `baseUrl` خالی/حذف‌شده باشد، OpenClaw رفتار پیش‌فرض OpenAI را حفظ می‌کند (که به `api.openai.com` resolve می‌شود).
    - برای ایمنی، مقدار صریح `compat.supportsDeveloperRole: true` همچنان در نقاط پایانی غیربومی `openai-completions` بازنویسی می‌شود.
    - برای `api: "anthropic-messages"` روی نقاط پایانی غیرمستقیم (هر ارائه‌دهنده‌ای جز `anthropic` canonical، یا یک `models.providers.anthropic.baseUrl` سفارشی که میزبان آن یک نقطه پایانی عمومی `api.anthropic.com` نباشد)، OpenClaw سرآیندهای بتای ضمنی Anthropic مانند `claude-code-20250219`، `interleaved-thinking-2025-05-14`، و نشانگرهای OAuth را سرکوب می‌کند، تا پراکسی‌های سفارشی سازگار با Anthropic پرچم‌های بتای پشتیبانی‌نشده را رد نکنند. اگر پراکسی شما به قابلیت‌های بتای خاصی نیاز دارد، `models.providers.<id>.headers["anthropic-beta"]` را صریحا تنظیم کنید.

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
- [Failover مدل](/fa/concepts/model-failover) — زنجیره‌های fallback و رفتار تلاش دوباره
- [مدل‌ها](/fa/concepts/models) — پیکربندی مدل و نام‌های مستعار
- [ارائه‌دهندگان](/fa/providers) — راهنماهای راه‌اندازی برای هر ارائه‌دهنده
