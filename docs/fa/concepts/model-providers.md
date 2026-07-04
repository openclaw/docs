---
read_when:
    - به یک مرجع راه‌اندازی مدل به‌تفکیک ارائه‌دهنده نیاز دارید
    - می‌خواهید پیکربندی‌های نمونه یا فرمان‌های راه‌اندازی CLI برای ارائه‌دهندگان مدل را ببینید
sidebarTitle: Model providers
summary: نمای کلی ارائه‌دهندهٔ مدل با پیکربندی‌های نمونه + جریان‌های CLI
title: ارائه‌دهندگان مدل
x-i18n:
    generated_at: "2026-07-04T03:57:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع **ارائه‌دهندگان LLM/مدل** (نه کانال‌های چت مانند WhatsApp/Telegram). برای قواعد انتخاب مدل، [مدل‌ها](/fa/concepts/models) را ببینید.

## قواعد سریع

<AccordionGroup>
  <Accordion title="ارجاع‌های مدل و کمک‌کننده‌های CLI">
    - ارجاع‌های مدل از `provider/model` استفاده می‌کنند (مثال: `opencode/claude-opus-4-6`).
    - وقتی `agents.defaults.models` تنظیم شود، به‌عنوان allowlist عمل می‌کند.
    - کمک‌کننده‌های CLI: `openclaw onboard`، `openclaw models list`، `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` پیش‌فرض‌های سطح ارائه‌دهنده را تنظیم می‌کنند؛ `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` آن‌ها را برای هر مدل بازنویسی می‌کنند.
    - قواعد fallback، پروب‌های cooldown، و ماندگاری بازنویسی جلسه: [failover مدل](/fa/concepts/model-failover).

  </Accordion>
  <Accordion title="افزودن احراز هویت ارائه‌دهنده مدل اصلی شما را تغییر نمی‌دهد">
    `openclaw configure` هنگام افزودن یا احراز هویت دوبارهٔ یک ارائه‌دهنده، `agents.defaults.model.primary` موجود را حفظ می‌کند. `openclaw models auth login` نیز همین کار را می‌کند مگر اینکه `--set-default` را پاس بدهید. Pluginهای ارائه‌دهنده همچنان ممکن است در وصلهٔ پیکربندی احراز هویت خود یک مدل پیش‌فرض پیشنهادی برگردانند، اما وقتی از قبل مدل اصلی وجود داشته باشد، OpenClaw آن را به‌معنای «این مدل را در دسترس کن» در نظر می‌گیرد، نه «مدل اصلی فعلی را جایگزین کن.»

    برای تغییر عمدی مدل پیش‌فرض، از `openclaw models set <provider/model>` یا `openclaw models auth login --provider <id> --set-default` استفاده کنید.

  </Accordion>
  <Accordion title="تفکیک ارائه‌دهنده/زمان‌اجرای OpenAI">
    مسیرهای خانوادهٔ OpenAI مختص پیشوند هستند:

    - `openai/<model>` به‌طور پیش‌فرض برای نوبت‌های agent از harness بومی app-server مربوط به Codex استفاده می‌کند. این تنظیم معمول اشتراک ChatGPT/Codex است.
    - ارجاع‌های مدل Codex قدیمی پیکربندی legacy هستند که doctor آن‌ها را به `openai/<model>` بازنویسی می‌کند.
    - `openai/<model>` به‌همراه `agentRuntime.id: "openclaw"` در سطح ارائه‌دهنده/مدل، از زمان‌اجرای داخلی OpenClaw برای مسیرهای صریح کلید API یا سازگاری استفاده می‌کند.

    [OpenAI](/fa/providers/openai) و [harness Codex](/fa/plugins/codex-harness) را ببینید. اگر تفکیک ارائه‌دهنده/زمان‌اجرا گیج‌کننده است، ابتدا [زمان‌اجراهای agent](/fa/concepts/agent-runtimes) را بخوانید.

    فعال‌سازی خودکار Plugin از همان مرز پیروی می‌کند: ارجاع‌های agent با `openai/*`، Plugin مربوط به Codex را برای مسیر پیش‌فرض فعال می‌کنند، و `agentRuntime.id: "codex"` صریح در سطح ارائه‌دهنده/مدل یا ارجاع‌های legacy با `codex/<model>` نیز به آن نیاز دارند.

    GPT-5.5 به‌طور پیش‌فرض از طریق harness بومی app-server مربوط به Codex روی `openai/gpt-5.5` در دسترس است، و زمانی از طریق زمان‌اجرای OpenClaw در دسترس است که سیاست زمان‌اجرای ارائه‌دهنده/مدل به‌صراحت `openclaw` را انتخاب کند.

  </Accordion>
  <Accordion title="زمان‌اجراهای CLI">
    زمان‌اجراهای CLI از همان تفکیک استفاده می‌کنند: ارجاع‌های مدل canonical مانند `anthropic/claude-*` یا `google/gemini-*` را انتخاب کنید، سپس وقتی backend محلی CLI می‌خواهید، سیاست زمان‌اجرای ارائه‌دهنده/مدل را روی `claude-cli` یا `google-gemini-cli` تنظیم کنید.

    ارجاع‌های legacy با `claude-cli/*` و `google-gemini-cli/*` به ارجاع‌های canonical ارائه‌دهنده مهاجرت می‌کنند و زمان‌اجرا جداگانه ثبت می‌شود. ارجاع‌های legacy با `codex-cli/*` به `openai/*` مهاجرت می‌کنند و از مسیر app-server مربوط به Codex استفاده می‌کنند؛ OpenClaw دیگر backend بسته‌بندی‌شدهٔ Codex CLI را نگه نمی‌دارد.

  </Accordion>
</AccordionGroup>

## رفتار ارائه‌دهنده که مالکیت آن با Plugin است

بیشتر منطق اختصاصی ارائه‌دهنده در Pluginهای ارائه‌دهنده (`registerProvider(...)`) قرار دارد، درحالی‌که OpenClaw حلقهٔ inference عمومی را نگه می‌دارد. Pluginها مالک onboarding، کاتالوگ‌های مدل، نگاشت متغیرهای محیطی احراز هویت، نرمال‌سازی transport/config، پاک‌سازی schema ابزار، دسته‌بندی failover، تازه‌سازی OAuth، گزارش مصرف، پروفایل‌های thinking/reasoning، و موارد بیشتر هستند.

فهرست کامل hookهای provider-SDK و مثال‌های Pluginهای بسته‌بندی‌شده در [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) قرار دارد. ارائه‌دهنده‌ای که به یک اجراکنندهٔ درخواست کاملا سفارشی نیاز دارد، یک سطح افزونهٔ جداگانه و عمیق‌تر است.

<Note>
رفتار runner تحت مالکیت ارائه‌دهنده روی hookهای صریح ارائه‌دهنده مانند سیاست replay، نرمال‌سازی schema ابزار، پوشش stream، و کمک‌کننده‌های transport/request قرار دارد. بستهٔ ایستای legacy با نام `ProviderPlugin.capabilities` فقط برای سازگاری است و دیگر توسط منطق runner مشترک خوانده نمی‌شود.
</Note>

## چرخش کلید API

<AccordionGroup>
  <Accordion title="منابع کلید و اولویت">
    چند کلید را از طریق موارد زیر پیکربندی کنید:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (بازنویسی live تکی، بالاترین اولویت)
    - `<PROVIDER>_API_KEYS` (فهرست جداشده با ویرگول یا نقطه‌ویرگول)
    - `<PROVIDER>_API_KEY` (کلید اصلی)
    - `<PROVIDER>_API_KEY_*` (فهرست شماره‌دار، مثلا `<PROVIDER>_API_KEY_1`)

    برای ارائه‌دهندگان Google، `GOOGLE_API_KEY` نیز به‌عنوان fallback گنجانده می‌شود. ترتیب انتخاب کلید، اولویت را حفظ می‌کند و مقدارهای تکراری را حذف می‌کند.

  </Accordion>
  <Accordion title="چرخش چه زمانی فعال می‌شود">
    - درخواست‌ها فقط در پاسخ‌های rate-limit با کلید بعدی دوباره امتحان می‌شوند (برای مثال `429`، `rate_limit`، `quota`، `resource exhausted`، `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، یا پیام‌های دوره‌ای usage-limit).
    - خطاهای غیر rate-limit بلافاصله fail می‌شوند؛ هیچ چرخش کلیدی انجام نمی‌شود.
    - وقتی همهٔ کلیدهای نامزد fail شوند، خطای نهایی از آخرین تلاش برگردانده می‌شود.

  </Accordion>
</AccordionGroup>

## Pluginهای رسمی ارائه‌دهنده

Pluginهای رسمی ارائه‌دهنده، ردیف‌های کاتالوگ مدل خودشان را منتشر می‌کنند. این ارائه‌دهندگان به هیچ ورودی مدل در `models.providers` نیاز ندارند؛ Plugin ارائه‌دهنده را فعال کنید، احراز هویت را تنظیم کنید، و یک مدل انتخاب کنید. از `models.providers` فقط برای ارائه‌دهندگان سفارشی صریح یا تنظیمات محدود درخواست مانند timeoutها استفاده کنید.

### OpenAI

- ارائه‌دهنده: `openai`
- احراز هویت: `OPENAI_API_KEY`
- چرخش اختیاری: `OPENAI_API_KEYS`، `OPENAI_API_KEY_1`، `OPENAI_API_KEY_2`، به‌علاوهٔ `OPENCLAW_LIVE_OPENAI_KEY` (بازنویسی تکی)
- مدل‌های نمونه: `openai/gpt-5.5`، `openai/gpt-5.4-mini`
- اگر یک نصب خاص یا کلید API رفتار متفاوتی دارد، دسترسی حساب/مدل را با `openclaw models list --provider openai` تأیید کنید.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport پیش‌فرض `auto` است؛ OpenClaw انتخاب transport را به زمان‌اجرای مدل مشترک پاس می‌دهد.
- بازنویسی برای هر مدل از طریق `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`، `"websocket"`، یا `"auto"`)
- پردازش اولویت‌دار OpenAI می‌تواند از طریق `agents.defaults.models["openai/<model>"].params.serviceTier` فعال شود
- `/fast` و `params.fastMode` درخواست‌های مستقیم Responses با `openai/*` را روی `api.openai.com` به `service_tier=priority` نگاشت می‌کنند
- وقتی به‌جای toggle مشترک `/fast` یک tier صریح می‌خواهید، از `params.serviceTier` استفاده کنید
- headerهای پنهان attribution در OpenClaw (`originator`، `version`، `User-Agent`) فقط روی ترافیک بومی OpenAI به `api.openai.com` اعمال می‌شوند، نه proxyهای عمومی سازگار با OpenAI
- مسیرهای بومی OpenAI همچنین شکل‌دهی payload مربوط به Responses `store`، راهنمایی‌های prompt-cache، و سازگاری reasoning در OpenAI را حفظ می‌کنند؛ مسیرهای proxy این کار را نمی‌کنند
- `openai/gpt-5.3-codex-spark` از طریق احراز هویت اشتراک OAuth مربوط به ChatGPT/Codex در دسترس است وقتی حساب واردشدهٔ شما آن را ارائه کند؛ OpenClaw همچنان مسیرهای کلید API مستقیم OpenAI و کلید API مربوط به Azure را برای این مدل سرکوب می‌کند، زیرا آن transportها آن را رد می‌کنند

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ارائه‌دهنده: `anthropic`
- احراز هویت: `ANTHROPIC_API_KEY`
- چرخش اختیاری: `ANTHROPIC_API_KEYS`، `ANTHROPIC_API_KEY_1`، `ANTHROPIC_API_KEY_2`، به‌علاوهٔ `OPENCLAW_LIVE_ANTHROPIC_KEY` (بازنویسی تکی)
- مدل نمونه: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- درخواست‌های عمومی مستقیم Anthropic از toggle مشترک `/fast` و `params.fastMode` پشتیبانی می‌کنند، شامل ترافیک احراز هویت‌شده با کلید API و OAuth که به `api.anthropic.com` فرستاده می‌شود؛ OpenClaw آن را به `service_tier` مربوط به Anthropic (`auto` در برابر `standard_only`) نگاشت می‌کند
- پیکربندی ترجیحی Claude CLI ارجاع مدل را canonical نگه می‌دارد و
  backend مربوط به CLI را جداگانه انتخاب می‌کند: `anthropic/claude-opus-4-8` با
  `agentRuntime.id: "claude-cli"` در محدودهٔ مدل. ارجاع‌های legacy با
  `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند.

<Note>
کارکنان Anthropic به ما گفته‌اند که استفادهٔ Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفادهٔ دوباره از Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند مگر اینکه Anthropic سیاست جدیدی منتشر کند. setup-token مربوط به Anthropic همچنان به‌عنوان مسیر token پشتیبانی‌شدهٔ OpenClaw در دسترس است، اما OpenClaw اکنون در صورت امکان استفادهٔ دوباره از Claude CLI و `claude -p` را ترجیح می‌دهد.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth مربوط به OpenAI ChatGPT/Codex

- ارائه‌دهنده: `openai`
- احراز هویت: OAuth (ChatGPT)
- ارجاع مدل legacy مربوط به OpenAI Codex: `openai/gpt-5.5`
- ارجاع harness بومی app-server مربوط به Codex: `openai/gpt-5.5`
- مستندات harness بومی app-server مربوط به Codex: [harness Codex](/fa/plugins/codex-harness)
- ارجاع‌های مدل legacy: `codex/gpt-*`
- مرز Plugin: `openai/*`، Plugin مربوط به OpenAI را بارگذاری می‌کند؛ Plugin بومی app-server مربوط به Codex توسط زمان‌اجرای harness Codex انتخاب می‌شود.
- CLI: `openclaw onboard --auth-choice openai` یا `openclaw models auth login --provider openai`
- transport پیش‌فرض `auto` است (ابتدا WebSocket، سپس SSE fallback)
- بازنویسی برای هر مدل OpenAI Codex از طریق `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`، `"websocket"`، یا `"auto"`)
- `params.serviceTier` همچنین روی درخواست‌های بومی Codex Responses (`chatgpt.com/backend-api`) forward می‌شود
- headerهای پنهان attribution در OpenClaw (`originator`، `version`، `User-Agent`) فقط روی ترافیک بومی Codex به `chatgpt.com/backend-api` پیوست می‌شوند، نه proxyهای عمومی سازگار با OpenAI
- همان پیکربندی toggle مشترک `/fast` و `params.fastMode` را مانند `openai/*` مستقیم به‌اشتراک می‌گذارد؛ OpenClaw آن را به `service_tier=priority` نگاشت می‌کند
- `openai/gpt-5.5` از `contextWindow = 400000` بومی کاتالوگ Codex و زمان‌اجرای پیش‌فرض `contextTokens = 272000` استفاده می‌کند؛ سقف زمان‌اجرا را با `models.providers.openai.models[].contextTokens` بازنویسی کنید
- یادداشت سیاست: OpenAI Codex OAuth به‌صراحت برای ابزارها/گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌شود.
- برای مسیر رایج اشتراک به‌همراه زمان‌اجرای بومی Codex، با احراز هویت `openai` وارد شوید و `openai/gpt-5.5` را پیکربندی کنید؛ نوبت‌های agent مربوط به OpenAI به‌طور پیش‌فرض Codex را انتخاب می‌کنند.
- فقط زمانی از `agentRuntime.id: "openclaw"` در سطح ارائه‌دهنده/مدل استفاده کنید که مسیر داخلی OpenClaw را می‌خواهید؛ در غیر این صورت `openai/gpt-5.5` را روی harness پیش‌فرض Codex نگه دارید.
- ارجاع‌های legacy مربوط به Codex GPT وضعیت legacy هستند، نه مسیر ارائه‌دهندهٔ live. برای پیکربندی جدید agent از `openai/gpt-5.5` روی زمان‌اجرای بومی Codex استفاده کنید، و `openclaw doctor --fix` را اجرا کنید تا ارجاع‌های قدیمی مدل legacy Codex به ارجاع‌های canonical با `openai/*` مهاجرت کنند.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### گزینه‌های میزبانی‌شدهٔ دیگر به سبک اشتراک

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/fa/providers/zai">
    طرح کدنویسی Z.AI یا endpointهای عمومی API.
  </Card>
  <Card title="MiniMax" href="/fa/providers/minimax">
    OAuth طرح کدنویسی MiniMax یا دسترسی با کلید API.
  </Card>
  <Card title="Qwen Cloud" href="/fa/providers/qwen">
    سطح ارائه‌دهندهٔ Qwen Cloud به‌همراه نگاشت endpointهای Alibaba DashScope و طرح کدنویسی.
  </Card>
</CardGroup>

### OpenCode

- احراز هویت: `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`)
- ارائه‌دهندهٔ زمان‌اجرای Zen: `opencode`
- ارائه‌دهندهٔ زمان‌اجرای Go: `opencode-go`
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
- نام مستعار: `google/gemini-3.1-pro` پذیرفته می‌شود و به شناسه زنده API Gemini گوگل، یعنی `google/gemini-3.1-pro-preview`، نرمال‌سازی می‌شود
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- تفکر: `/think adaptive` از تفکر پویای گوگل استفاده می‌کند. Gemini 3/3.1 یک `thinkingLevel` ثابت را حذف می‌کنند؛ Gemini 2.5 مقدار `thinkingBudget: -1` را ارسال می‌کند.
- اجراهای مستقیم Gemini همچنین `agents.defaults.models["google/<model>"].params.cachedContent` (یا `cached_content` قدیمی) را می‌پذیرند تا یک دسته بومی ارائه‌دهنده از نوع `cachedContents/...` را ارسال کنند؛ برخوردهای حافظه نهان Gemini به‌صورت `cacheRead` در OpenClaw نمایش داده می‌شوند

### Google Vertex و Gemini CLI

- ارائه‌دهندگان: `google-vertex`، `google-gemini-cli`
- احراز هویت: Vertex از gcloud ADC استفاده می‌کند؛ Gemini CLI از جریان OAuth خود استفاده می‌کند

<Warning>
OAuth مربوط به Gemini CLI در OpenClaw یک یکپارچه‌سازی غیررسمی است. برخی کاربران پس از استفاده از کلاینت‌های شخص ثالث، محدودیت‌هایی روی حساب گوگل خود گزارش کرده‌اند. شرایط گوگل را بررسی کنید و اگر تصمیم به ادامه دارید از یک حساب غیرحیاتی استفاده کنید.
</Warning>

OAuth مربوط به Gemini CLI به‌عنوان بخشی از Plugin همراه `google` عرضه می‌شود.

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

    مدل پیش‌فرض: `google-gemini-cli/gemini-3-flash-preview`. شما شناسه کلاینت یا راز را در `openclaw.json` جای‌گذاری **نمی‌کنید**. جریان ورود CLI توکن‌ها را در پروفایل‌های احراز هویت روی میزبان Gateway ذخیره می‌کند.

  </Step>
  <Step title="تنظیم پروژه (در صورت نیاز)">
    اگر درخواست‌ها پس از ورود ناموفق شدند، `GOOGLE_CLOUD_PROJECT` یا `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید.
  </Step>
</Steps>

Gemini CLI به‌صورت پیش‌فرض از `stream-json` استفاده می‌کند. OpenClaw پیام‌های جریان دستیار را می‌خواند و `stats.cached` را به `cacheRead` نرمال‌سازی می‌کند؛ بازنویسی‌های قدیمی `--output-format json` همچنان متن پاسخ را از `response` می‌خوانند.

### Z.AI (GLM)

- ارائه‌دهنده: `zai`
- احراز هویت: `ZAI_API_KEY`
- مدل نمونه: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - ارجاع‌های مدل از شناسه ارائه‌دهنده کانونی `zai/*` استفاده می‌کنند.
  - `zai-api-key` نقطه پایانی متناظر Z.AI را به‌صورت خودکار تشخیص می‌دهد؛ `zai-coding-global`، `zai-coding-cn`، `zai-global`، و `zai-cn` یک سطح مشخص را اجباری می‌کنند

### Vercel AI Gateway

- ارائه‌دهنده: `vercel-ai-gateway`
- احراز هویت: `AI_GATEWAY_API_KEY`
- مدل‌های نمونه: `vercel-ai-gateway/anthropic/claude-opus-4.6`، `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Pluginهای ارائه‌دهنده همراه دیگر

| ارائه‌دهنده                            | شناسه                            | env احراز هویت                                      | مدل نمونه                                                  |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` یا `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/fa/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth یا `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| [Qwen OAuth](/fa/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth یا `XAI_API_KEY`           | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### نکات خاصی که دانستنشان مفید است

<AccordionGroup>
  <Accordion title="OpenRouter">
    سرآیندهای انتساب برنامه و نشانگرهای Anthropic `cache_control` را فقط روی مسیرهای تاییدشده `openrouter.ai` اعمال می‌کند. ارجاع‌های DeepSeek، Moonshot، و ZAI برای حافظه نهان prompt مدیریت‌شده توسط OpenRouter واجد شرایط cache-TTL هستند، اما نشانگرهای حافظه نهان Anthropic را دریافت نمی‌کنند. به‌عنوان یک مسیر سازگار با OpenAI از نوع پروکسی، شکل‌دهی‌های مختص OpenAI بومی (`serviceTier`، `store` در Responses، راهنمایی‌های prompt-cache، سازگاری استدلال OpenAI) را رد می‌کند. ارجاع‌های مبتنی بر Gemini فقط پاک‌سازی امضای فکر proxy-Gemini را نگه می‌دارند.
  </Accordion>
  <Accordion title="Kilo Gateway">
    ارجاع‌های مبتنی بر Gemini همان مسیر پاک‌سازی proxy-Gemini را دنبال می‌کنند؛ `kilocode/kilo/auto` و سایر ارجاع‌هایی که از استدلال پروکسی پشتیبانی نمی‌کنند، تزریق استدلال پروکسی را رد می‌کنند.
  </Accordion>
  <Accordion title="MiniMax">
    راه‌اندازی با کلید API تعریف‌های صریح مدل گفت‌وگوی M3 و M2.7 را می‌نویسد؛ درک تصویر روی ارائه‌دهنده رسانه‌ای `MiniMax-VL-01` که مالکیت آن با Plugin است باقی می‌ماند.
  </Accordion>
  <Accordion title="NVIDIA">
    شناسه‌های مدل از فضای نام `nvidia/<vendor>/<model>` استفاده می‌کنند (برای مثال `nvidia/nvidia/nemotron-...` در کنار `nvidia/moonshotai/kimi-k2.5`)؛ انتخاب‌گرها ترکیب تحت‌اللفظی `<provider>/<model-id>` را حفظ می‌کنند، در حالی که کلید کانونی ارسال‌شده به API تک‌پیشوندی باقی می‌ماند.
  </Accordion>
  <Accordion title="xAI">
    از مسیر Responses مربوط به xAI استفاده می‌کند. مسیر پیشنهادی SuperGrok/X Premium OAuth است؛ کلیدهای API همچنان از طریق `XAI_API_KEY` یا پیکربندی Plugin کار می‌کنند، و `web_search` در Grok پیش از جایگزینی با کلید API، از همان پروفایل احراز هویت دوباره استفاده می‌کند. `grok-4.3` مدل گفت‌وگوی پیش‌فرض همراه است، و `grok-build-0.1` برای کارهای متمرکز بر build/کدنویسی قابل انتخاب است. `/fast` یا `params.fastMode: true` مقدارهای `grok-3`، `grok-3-mini`، `grok-4`، و `grok-4-0709` را به گونه‌های `*-fast` آنها بازنویسی می‌کند. `tool_stream` به‌صورت پیش‌فرض فعال است؛ آن را از طریق `agents.defaults.models["xai/<model>"].params.tool_stream=false` غیرفعال کنید.
  </Accordion>
</AccordionGroup>

## ارائه‌دهندگان از طریق `models.providers` (URL سفارشی/پایه)

از `models.providers` (یا `models.json`) برای افزودن ارائه‌دهندگان **سفارشی** یا پروکسی‌های سازگار با OpenAI/Anthropic استفاده کنید.

بسیاری از افزونه‌های ارائه‌دهنده‌ی همراه در پایین، از قبل یک کاتالوگ پیش‌فرض منتشر می‌کنند. فقط زمانی از ورودی‌های صریح `models.providers.<id>` استفاده کنید که می‌خواهید URL پایه، سرآیندها، یا فهرست مدل پیش‌فرض را بازنویسی کنید.

بررسی‌های قابلیت مدل در Gateway، فراداده‌ی صریح `models.providers.<id>.models[]` را نیز می‌خوانند. اگر یک مدل سفارشی یا پروکسی تصویر می‌پذیرد، روی آن مدل `input: ["text", "image"]` را تنظیم کنید تا WebChat و مسیرهای پیوست با مبدأ node، تصاویر را به‌جای ارجاع‌های رسانه‌ای فقط‌متنی، به‌عنوان ورودی‌های بومی مدل ارسال کنند.

`agents.defaults.models["provider/model"]` فقط نمایانی مدل، نام‌های مستعار، و فراداده‌ی هر مدل را برای عامل‌ها کنترل می‌کند. این گزینه به‌تنهایی یک مدل زمان اجرا جدید ثبت نمی‌کند. برای مدل‌های ارائه‌دهنده‌ی سفارشی، `models.providers.<provider>.models[]` را نیز با حداقل `id` مطابق اضافه کنید.

### Moonshot AI (Kimi)

پیش از راه‌اندازی اولیه، `@openclaw/moonshot-provider` را نصب کنید. فقط زمانی یک ورودی صریح `models.providers.moonshot` اضافه کنید که لازم است URL پایه یا فراداده‌ی مدل را بازنویسی کنید:

- ارائه‌دهنده: `moonshot`
- احراز هویت: `MOONSHOT_API_KEY`
- مدل نمونه: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` یا `openclaw onboard --auth-choice moonshot-api-key-cn`

شناسه‌های مدل Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

Kimi Coding از نقطه‌ی پایانی سازگار با Anthropic در Moonshot AI استفاده می‌کند:

- ارائه‌دهنده: `kimi`
- احراز هویت: `KIMI_API_KEY`
- مدل نمونه: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

`kimi/kimi-code` و `kimi/k2p5` قدیمی همچنان به‌عنوان شناسه‌های مدل سازگارپذیری پذیرفته می‌شوند و به شناسه‌ی مدل API پایدار Kimi نرمال‌سازی می‌شوند.

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

پذیرش اولیه به‌صورت پیش‌فرض روی سطح کدنویسی قرار دارد، اما کاتالوگ عمومی `volcengine/*` هم‌زمان ثبت می‌شود.

در انتخابگرهای مدلِ پذیرش اولیه/پیکربندی، گزینه احراز هویت Volcengine هر دو ردیف `volcengine/*` و `volcengine-plan/*` را ترجیح می‌دهد. اگر این مدل‌ها هنوز بارگذاری نشده باشند، OpenClaw به‌جای نمایش یک انتخابگر خالیِ محدود به ارائه‌دهنده، به کاتالوگ فیلترنشده برمی‌گردد.

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
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

پذیرش اولیه به‌صورت پیش‌فرض روی سطح کدنویسی قرار دارد، اما کاتالوگ عمومی `byteplus/*` هم‌زمان ثبت می‌شود.

در انتخابگرهای مدلِ پذیرش اولیه/پیکربندی، گزینه احراز هویت BytePlus هر دو ردیف `byteplus/*` و `byteplus-plan/*` را ترجیح می‌دهد. اگر این مدل‌ها هنوز بارگذاری نشده باشند، OpenClaw به‌جای نمایش یک انتخابگر خالیِ محدود به ارائه‌دهنده، به کاتالوگ فیلترنشده برمی‌گردد.

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

MiniMax از طریق `models.providers` پیکربندی می‌شود، چون از نقطه‌های پایانی سفارشی استفاده می‌کند:

- MiniMax OAuth (جهانی): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (چین): `--auth-choice minimax-cn-oauth`
- کلید API MiniMax (جهانی): `--auth-choice minimax-global-api`
- کلید API MiniMax (چین): `--auth-choice minimax-cn-api`
- احراز هویت: `MINIMAX_API_KEY` برای `minimax`؛ `MINIMAX_OAUTH_TOKEN` یا `MINIMAX_API_KEY` برای `minimax-portal`

برای جزئیات راه‌اندازی، گزینه‌های مدل، و قطعه‌کدهای پیکربندی، [/providers/minimax](/fa/providers/minimax) را ببینید.

<Note>
در مسیر استریمِ سازگار با Anthropic در MiniMax، OpenClaw برای خانواده M2.x به‌صورت پیش‌فرض thinking را غیرفعال می‌کند، مگر اینکه آن را صراحتاً تنظیم کنید؛ MiniMax-M3 (و M3.x) به‌صورت پیش‌فرض روی مسیر thinking حذف‌شده/تطبیقیِ ارائه‌دهنده باقی می‌ماند. `/fast on` مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.
</Note>

تفکیک قابلیتِ تحت مالکیت Plugin:

- پیش‌فرض‌های متن/چت روی `minimax/MiniMax-M3` باقی می‌مانند
- تولید تصویر `minimax/image-01` یا `minimax-portal/image-01` است
- درک تصویر، `MiniMax-VL-01` تحت مالکیت Plugin در هر دو مسیر احراز هویت MiniMax است
- جست‌وجوی وب روی شناسه ارائه‌دهنده `minimax` باقی می‌ماند

### LM Studio

LM Studio به‌عنوان یک Plugin ارائه‌دهنده همراه عرضه می‌شود که از API بومی استفاده می‌کند:

- ارائه‌دهنده: `lmstudio`
- احراز هویت: `LM_API_TOKEN`
- URL پایه پیش‌فرض برای استنتاج: `http://localhost:1234/v1`

سپس یک مدل تنظیم کنید (با یکی از شناسه‌های برگشتی از `http://localhost:1234/api/v1/models` جایگزین کنید):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw برای کشف + بارگذاری خودکار از `/api/v1/models` و `/api/v1/models/load` بومی LM Studio استفاده می‌کند، و به‌صورت پیش‌فرض برای استنتاج از `/v1/chat/completions` استفاده می‌شود. اگر می‌خواهید بارگذاری JIT، TTL، و حذف خودکار LM Studio مالک چرخه عمر مدل باشند، `models.providers.lmstudio.params.preload: false` را تنظیم کنید. برای راه‌اندازی و عیب‌یابی، [/providers/lmstudio](/fa/providers/lmstudio) را ببینید.

### Ollama

Ollama به‌عنوان یک Plugin ارائه‌دهنده همراه عرضه می‌شود و از API بومی Ollama استفاده می‌کند:

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

وقتی با `OLLAMA_API_KEY` فعال‌سازی را انتخاب کنید، Ollama به‌صورت محلی در `http://127.0.0.1:11434` شناسایی می‌شود، و Plugin ارائه‌دهنده همراه، Ollama را مستقیماً به `openclaw onboard` و انتخابگر مدل اضافه می‌کند. برای پذیرش اولیه، حالت ابری/محلی، و پیکربندی سفارشی، [/providers/ollama](/fa/providers/ollama) را ببینید.

### vLLM

vLLM به‌عنوان یک Plugin ارائه‌دهنده همراه برای سرورهای محلی/خودمیزبانِ سازگار با OpenAI عرضه می‌شود:

- ارائه‌دهنده: `vllm`
- احراز هویت: اختیاری (به سرور شما بستگی دارد)
- URL پایه پیش‌فرض: `http://127.0.0.1:8000/v1`

برای فعال‌سازی کشف خودکار به‌صورت محلی (اگر سرور شما احراز هویت را اعمال نکند، هر مقداری کار می‌کند):

```bash
export VLLM_API_KEY="vllm-local"
```

سپس یک مدل تنظیم کنید (با یکی از شناسه‌های برگشتی از `/v1/models` جایگزین کنید):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

برای جزئیات، [/providers/vllm](/fa/providers/vllm) را ببینید.

### SGLang

SGLang به‌عنوان یک Plugin ارائه‌دهنده همراه برای سرورهای سریعِ خودمیزبانِ سازگار با OpenAI عرضه می‌شود:

- ارائه‌دهنده: `sglang`
- احراز هویت: اختیاری (به سرور شما بستگی دارد)
- URL پایه پیش‌فرض: `http://127.0.0.1:30000/v1`

برای فعال‌سازی کشف خودکار به‌صورت محلی (اگر سرور شما احراز هویت را اعمال نکند، هر مقداری کار می‌کند):

```bash
export SGLANG_API_KEY="sglang-local"
```

سپس یک مدل تنظیم کنید (با یکی از شناسه‌های برگشتی از `/v1/models` جایگزین کنید):

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
    برای ارائه‌دهنده‌های سفارشی، `reasoning`، `input`، `cost`، `contextWindow`، و `maxTokens` اختیاری هستند. وقتی حذف شوند، OpenClaw به‌صورت پیش‌فرض از این مقادیر استفاده می‌کند:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    توصیه می‌شود: مقادیر صریحی تنظیم کنید که با محدودیت‌های پراکسی/مدل شما مطابقت داشته باشند.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - برای `api: "openai-completions"` روی نقطه‌های پایانی غیر بومی (هر `baseUrl` غیرخالی که میزبان آن `api.openai.com` نیست)، OpenClaw مقدار `compat.supportsDeveloperRole: false` را اجباری می‌کند تا از خطاهای 400 ارائه‌دهنده برای نقش‌های پشتیبانی‌نشده `developer` جلوگیری شود.
    - مسیرهای سازگار با OpenAI به سبک پراکسی همچنین شکل‌دهی درخواست مخصوص OpenAI بومی را رد می‌کنند: بدون `service_tier`، بدون `store` در Responses، بدون `store` در Completions، بدون راهنمایی‌های prompt-cache، بدون شکل‌دهی payload سازگار با reasoning در OpenAI، و بدون سرآیندهای پنهان انتساب OpenClaw.
    - برای پراکسی‌های Completions سازگار با OpenAI که به فیلدهای خاص فروشنده نیاز دارند، `agents.defaults.models["provider/model"].params.extra_body` (یا `extraBody`) را تنظیم کنید تا JSON اضافی در بدنه درخواست خروجی ادغام شود.
    - برای کنترل‌های chat-template در vLLM، `agents.defaults.models["provider/model"].params.chat_template_kwargs` را تنظیم کنید. Plugin همراه vLLM وقتی سطح thinking نشست خاموش باشد، برای `vllm/nemotron-3-*` به‌صورت خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند.
    - برای مدل‌های محلی کند یا میزبان‌های LAN/tailnet راه دور، `models.providers.<id>.timeoutSeconds` را تنظیم کنید. این کار رسیدگی به درخواست HTTP مدل ارائه‌دهنده، شامل اتصال، سرآیندها، استریم بدنه، و کل قطع guarded-fetch را بدون افزایش کل زمان انتظار اجرای عامل تمدید می‌کند. اگر `agents.defaults.timeoutSeconds` یا زمان انتظار مخصوص اجرا کمتر است، آن سقف را هم افزایش دهید؛ زمان‌های انتظار ارائه‌دهنده نمی‌توانند کل اجرا را تمدید کنند.
    - فراخوانی‌های HTTP ارائه‌دهنده مدل، پاسخ‌های DNS fake-IP مربوط به Surge، Clash، و sing-box را در `198.18.0.0/15` و `fc00::/7` فقط برای نام میزبان `baseUrl` پیکربندی‌شده ارائه‌دهنده مجاز می‌کنند. نقطه‌های پایانی ارائه‌دهنده سفارشی/محلی همچنین برای درخواست‌های مدل محافظت‌شده، دقیقاً به همان مبدأ پیکربندی‌شده `scheme://host:port` اعتماد می‌کنند، شامل loopback، LAN، و میزبان‌های tailnet. این گزینه پیکربندی جدیدی نیست؛ `baseUrl` که پیکربندی می‌کنید سیاست درخواست را فقط برای همان مبدأ گسترش می‌دهد. مجوز نام میزبان fake-IP و اعتماد به مبدأ دقیق، سازوکارهای مستقلی هستند. سایر مقصدهای خصوصی، loopback، link-local، metadata، و پورت‌های متفاوت همچنان به فعال‌سازی صریح `models.providers.<id>.request.allowPrivateNetwork: true` نیاز دارند. برای انصراف از اعتماد به مبدأ دقیق، `models.providers.<id>.request.allowPrivateNetwork: false` را تنظیم کنید.
    - اگر `baseUrl` خالی/حذف شده باشد، OpenClaw رفتار پیش‌فرض OpenAI را حفظ می‌کند (که به `api.openai.com` resolve می‌شود).
    - برای ایمنی، مقدار صریح `compat.supportsDeveloperRole: true` همچنان روی نقطه‌های پایانی غیر بومی `openai-completions` override می‌شود.
    - برای `api: "anthropic-messages"` روی نقطه‌های پایانی غیرمستقیم (هر ارائه‌دهنده‌ای غیر از `anthropic` متعارف، یا یک `models.providers.anthropic.baseUrl` سفارشی که میزبان آن یک نقطه پایانی عمومی `api.anthropic.com` نیست)، OpenClaw سرآیندهای بتای ضمنی Anthropic مانند `claude-code-20250219`، `interleaved-thinking-2025-05-14`، و نشانگرهای OAuth را سرکوب می‌کند، تا پراکسی‌های سفارشیِ سازگار با Anthropic پرچم‌های بتای پشتیبانی‌نشده را رد نکنند. اگر پراکسی شما به قابلیت‌های بتای مشخصی نیاز دارد، `models.providers.<id>.headers["anthropic-beta"]` را صراحتاً تنظیم کنید.

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

- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) - کلیدهای پیکربندی مدل
- [جایگزینی مدل هنگام خرابی](/fa/concepts/model-failover) - زنجیره‌های جایگزین و رفتار تلاش مجدد
- [مدل‌ها](/fa/concepts/models) - پیکربندی مدل و نام‌های مستعار
- [ارائه‌دهنده‌ها](/fa/providers) - راهنماهای راه‌اندازی برای هر ارائه‌دهنده
