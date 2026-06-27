---
read_when:
    - به یک مرجع راه‌اندازی مدل بر اساس هر ارائه‌دهنده نیاز دارید
    - شما پیکربندی‌های نمونه یا فرمان‌های راه‌اندازی اولیه CLI برای ارائه‌دهندگان مدل می‌خواهید
sidebarTitle: Model providers
summary: مرور کلی ارائه‌دهندهٔ مدل همراه با پیکربندی‌های نمونه + جریان‌های CLI
title: ارائه‌دهندگان مدل
x-i18n:
    generated_at: "2026-06-27T17:34:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع **ارائه‌دهندگان LLM/مدل** (نه کانال‌های چت مانند WhatsApp/Telegram). برای قواعد انتخاب مدل، [مدل‌ها](/fa/concepts/models) را ببینید.

## قواعد سریع

<AccordionGroup>
  <Accordion title="ارجاع‌های مدل و کمک‌کننده‌های CLI">
    - ارجاع‌های مدل از `provider/model` استفاده می‌کنند (مثال: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` وقتی تنظیم شود، به‌عنوان فهرست مجاز عمل می‌کند.
    - کمک‌کننده‌های CLI: `openclaw onboard`، `openclaw models list`، `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` پیش‌فرض‌های سطح ارائه‌دهنده را تنظیم می‌کنند؛ `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` آن‌ها را برای هر مدل بازنویسی می‌کنند.
    - قواعد جایگزینی، کاوش‌های cooldown، و پایداری بازنویسی نشست: [جایگزینی مدل](/fa/concepts/model-failover).

  </Accordion>
  <Accordion title="افزودن احراز هویت ارائه‌دهنده مدل اصلی شما را تغییر نمی‌دهد">
    `openclaw configure` وقتی یک ارائه‌دهنده را اضافه یا دوباره احراز هویت می‌کنید، مقدار موجود `agents.defaults.model.primary` را حفظ می‌کند. `openclaw models auth login` هم همین کار را می‌کند مگر اینکه `--set-default` را پاس بدهید. Pluginهای ارائه‌دهنده همچنان ممکن است در وصله پیکربندی احراز هویت خود یک مدل پیش‌فرض پیشنهادی برگردانند، اما وقتی یک مدل اصلی از قبل وجود داشته باشد، OpenClaw آن را به‌معنای «این مدل را در دسترس قرار بده» در نظر می‌گیرد، نه «مدل اصلی فعلی را جایگزین کن.»

    برای تغییر عمدی مدل پیش‌فرض، از `openclaw models set <provider/model>` یا `openclaw models auth login --provider <id> --set-default` استفاده کنید.

  </Accordion>
  <Accordion title="تفکیک ارائه‌دهنده/زمان‌اجرای OpenAI">
    مسیرهای خانواده OpenAI به پیشوند مشخص وابسته‌اند:

    - `openai/<model>` به‌طور پیش‌فرض برای نوبت‌های عامل از هارنس app-server بومی Codex استفاده می‌کند. این همان راه‌اندازی معمول اشتراک ChatGPT/Codex است.
    - ارجاع‌های مدل Codex قدیمی پیکربندی قدیمی هستند که doctor آن‌ها را به `openai/<model>` بازنویسی می‌کند.
    - `openai/<model>` همراه با `agentRuntime.id: "openclaw"` در سطح ارائه‌دهنده/مدل، از زمان‌اجرای داخلی OpenClaw برای مسیرهای API-key صریح یا سازگاری استفاده می‌کند.

    [OpenAI](/fa/providers/openai) و [هارنس Codex](/fa/plugins/codex-harness) را ببینید. اگر تفکیک ارائه‌دهنده/زمان‌اجرا گیج‌کننده است، ابتدا [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) را بخوانید.

    فعال‌سازی خودکار Plugin از همان مرز پیروی می‌کند: ارجاع‌های عامل `openai/*` برای مسیر پیش‌فرض Plugin Codex را فعال می‌کنند، و `agentRuntime.id: "codex"` صریح در سطح ارائه‌دهنده/مدل یا ارجاع‌های قدیمی `codex/<model>` هم به آن نیاز دارند.

    GPT-5.5 به‌طور پیش‌فرض از طریق هارنس app-server بومی Codex روی `openai/gpt-5.5` در دسترس است، و وقتی سیاست زمان‌اجرای ارائه‌دهنده/مدل به‌صراحت `openclaw` را انتخاب کند، از طریق زمان‌اجرای OpenClaw نیز در دسترس است.

  </Accordion>
  <Accordion title="زمان‌اجراهای CLI">
    زمان‌اجراهای CLI از همان تفکیک استفاده می‌کنند: ارجاع‌های مدل کانونی مانند `anthropic/claude-*` یا `google/gemini-*` را انتخاب کنید، سپس وقتی یک بک‌اند CLI محلی می‌خواهید، سیاست زمان‌اجرای ارائه‌دهنده/مدل را روی `claude-cli` یا `google-gemini-cli` تنظیم کنید.

    ارجاع‌های قدیمی `claude-cli/*` و `google-gemini-cli/*` با ثبت جداگانه زمان‌اجرا، دوباره به ارجاع‌های ارائه‌دهنده کانونی مهاجرت می‌کنند. ارجاع‌های قدیمی `codex-cli/*` به `openai/*` مهاجرت می‌کنند و از مسیر app-server Codex استفاده می‌کنند؛ OpenClaw دیگر بک‌اند CLI Codex بسته‌بندی‌شده نگه نمی‌دارد.

  </Accordion>
</AccordionGroup>

## رفتار ارائه‌دهنده که مالکیت آن با Plugin است

بیشتر منطق ویژه ارائه‌دهنده در Pluginهای ارائه‌دهنده (`registerProvider(...)`) قرار دارد، درحالی‌که OpenClaw حلقه استنتاج عمومی را نگه می‌دارد. Pluginها مالک onboarding، کاتالوگ‌های مدل، نگاشت env-var احراز هویت، عادی‌سازی انتقال/پیکربندی، پاک‌سازی طرح‌واره ابزار، طبقه‌بندی failover، نوسازی OAuth، گزارش استفاده، پروفایل‌های thinking/reasoning، و موارد بیشتر هستند.

فهرست کامل hookهای SDK ارائه‌دهنده و نمونه‌های Pluginهای بسته‌بندی‌شده در [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) قرار دارد. ارائه‌دهنده‌ای که به اجراکننده درخواست کاملا سفارشی نیاز دارد، یک سطح افزونه جداگانه و عمیق‌تر است.

<Note>
رفتار runner متعلق به ارائه‌دهنده روی hookهای صریح ارائه‌دهنده مانند سیاست replay، عادی‌سازی طرح‌واره ابزار، پیچیدن stream، و کمک‌کننده‌های انتقال/درخواست قرار دارد. بسته ایستای قدیمی `ProviderPlugin.capabilities` فقط برای سازگاری است و دیگر توسط منطق runner مشترک خوانده نمی‌شود.
</Note>

## چرخش API key

<AccordionGroup>
  <Accordion title="منابع کلید و اولویت">
    چند کلید را از این راه‌ها پیکربندی کنید:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (بازنویسی زنده تکی، بالاترین اولویت)
    - `<PROVIDER>_API_KEYS` (فهرست جداشده با ویرگول یا سمی‌کالن)
    - `<PROVIDER>_API_KEY` (کلید اصلی)
    - `<PROVIDER>_API_KEY_*` (فهرست شماره‌دار، مثلا `<PROVIDER>_API_KEY_1`)

    برای ارائه‌دهندگان Google، `GOOGLE_API_KEY` نیز به‌عنوان fallback گنجانده می‌شود. ترتیب انتخاب کلید اولویت را حفظ می‌کند و مقدارهای تکراری را حذف می‌کند.

  </Accordion>
  <Accordion title="چرخش چه زمانی فعال می‌شود">
    - درخواست‌ها فقط در پاسخ‌های rate-limit با کلید بعدی دوباره تلاش می‌شوند (برای مثال `429`، `rate_limit`، `quota`، `resource exhausted`، `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، یا پیام‌های دوره‌ای usage-limit).
    - خطاهای غیر rate-limit بلافاصله شکست می‌خورند؛ هیچ چرخش کلیدی تلاش نمی‌شود.
    - وقتی همه کلیدهای نامزد شکست بخورند، خطای نهایی از آخرین تلاش برگردانده می‌شود.

  </Accordion>
</AccordionGroup>

## Pluginهای رسمی ارائه‌دهنده

Pluginهای رسمی ارائه‌دهنده ردیف‌های کاتالوگ مدل خودشان را منتشر می‌کنند. این ارائه‌دهندگان به هیچ ورودی مدل `models.providers` نیاز ندارند؛ Plugin ارائه‌دهنده را فعال کنید، احراز هویت را تنظیم کنید، و یک مدل انتخاب کنید. از `models.providers` فقط برای ارائه‌دهندگان سفارشی صریح یا تنظیمات محدود درخواست مانند timeoutها استفاده کنید.

### OpenAI

- ارائه‌دهنده: `openai`
- احراز هویت: `OPENAI_API_KEY`
- چرخش اختیاری: `OPENAI_API_KEYS`، `OPENAI_API_KEY_1`، `OPENAI_API_KEY_2`، به‌علاوه `OPENCLAW_LIVE_OPENAI_KEY` (بازنویسی تکی)
- مدل‌های نمونه: `openai/gpt-5.5`، `openai/gpt-5.4-mini`
- اگر یک نصب یا API key مشخص متفاوت رفتار می‌کند، دسترسی حساب/مدل را با `openclaw models list --provider openai` بررسی کنید.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- انتقال پیش‌فرض `auto` است؛ OpenClaw انتخاب انتقال را به زمان‌اجرای مدل مشترک پاس می‌دهد.
- بازنویسی برای هر مدل از طریق `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`، `"websocket"`، یا `"auto"`)
- پردازش اولویت OpenAI را می‌توان از طریق `agents.defaults.models["openai/<model>"].params.serviceTier` فعال کرد
- `/fast` و `params.fastMode` درخواست‌های مستقیم Responses در `openai/*` را روی `api.openai.com` به `service_tier=priority` نگاشت می‌کنند
- وقتی به‌جای toggle مشترک `/fast` یک tier صریح می‌خواهید، از `params.serviceTier` استفاده کنید
- هدرهای انتساب پنهان OpenClaw (`originator`، `version`، `User-Agent`) فقط روی ترافیک بومی OpenAI به `api.openai.com` اعمال می‌شوند، نه روی پراکسی‌های عمومی سازگار با OpenAI
- مسیرهای بومی OpenAI همچنین شکل‌دهی payload مربوط به Responses `store`، راهنمایی‌های prompt-cache، و سازگاری reasoning OpenAI را نگه می‌دارند؛ مسیرهای پراکسی این کار را نمی‌کنند
- `openai/gpt-5.3-codex-spark` از طریق احراز هویت اشتراک OAuth در ChatGPT/Codex وقتی حساب واردشده شما آن را ارائه کند در دسترس است؛ OpenClaw همچنان مسیرهای مستقیم API-key OpenAI و API-key Azure را برای این مدل سرکوب می‌کند، چون آن انتقال‌ها آن را رد می‌کنند

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
- درخواست‌های عمومی مستقیم Anthropic از toggle مشترک `/fast` و `params.fastMode` پشتیبانی می‌کنند، از جمله ترافیک احراز هویت‌شده با API-key و OAuth که به `api.anthropic.com` فرستاده می‌شود؛ OpenClaw آن را به `service_tier` در Anthropic نگاشت می‌کند (`auto` در برابر `standard_only`)
- پیکربندی ترجیحی Claude CLI ارجاع مدل را کانونی نگه می‌دارد و بک‌اند CLI را جداگانه انتخاب می‌کند: `anthropic/claude-opus-4-8` با `agentRuntime.id: "claude-cli"` در محدوده مدل. ارجاع‌های قدیمی `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند.

<Note>
کارکنان Anthropic به ما گفتند استفاده Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای این ادغام مجاز در نظر می‌گیرد، مگر اینکه Anthropic سیاست تازه‌ای منتشر کند. setup-token در Anthropic همچنان به‌عنوان یک مسیر توکن پشتیبانی‌شده OpenClaw در دسترس است، اما OpenClaw اکنون وقتی در دسترس باشند، استفاده مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- ارائه‌دهنده: `openai`
- احراز هویت: OAuth (ChatGPT)
- ارجاع مدل OpenAI Codex قدیمی: `openai/gpt-5.5`
- ارجاع هارنس app-server بومی Codex: `openai/gpt-5.5`
- مستندات هارنس app-server بومی Codex: [هارنس Codex](/fa/plugins/codex-harness)
- ارجاع‌های مدل قدیمی: `codex/gpt-*`
- مرز Plugin: `openai/*` Plugin OpenAI را بارگذاری می‌کند؛ Plugin بومی app-server Codex توسط زمان‌اجرای هارنس Codex انتخاب می‌شود.
- CLI: `openclaw onboard --auth-choice openai` یا `openclaw models auth login --provider openai`
- انتقال پیش‌فرض `auto` است (ابتدا WebSocket، fallback به SSE)
- بازنویسی برای هر مدل OpenAI Codex از طریق `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`، `"websocket"`، یا `"auto"`)
- `params.serviceTier` همچنین روی درخواست‌های Responses بومی Codex (`chatgpt.com/backend-api`) فوروارد می‌شود
- هدرهای انتساب پنهان OpenClaw (`originator`، `version`، `User-Agent`) فقط روی ترافیک بومی Codex به `chatgpt.com/backend-api` پیوست می‌شوند، نه روی پراکسی‌های عمومی سازگار با OpenAI
- همان پیکربندی toggle مشترک `/fast` و `params.fastMode` را مانند `openai/*` مستقیم به اشتراک می‌گذارد؛ OpenClaw آن را به `service_tier=priority` نگاشت می‌کند
- `openai/gpt-5.5` از `contextWindow = 400000` بومی کاتالوگ Codex و زمان‌اجرای پیش‌فرض `contextTokens = 272000` استفاده می‌کند؛ سقف زمان‌اجرا را با `models.providers.openai.models[].contextTokens` بازنویسی کنید
- نکته سیاست: OpenAI Codex OAuth به‌صراحت برای ابزارها/گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌شود.
- برای مسیر رایج اشتراک به‌علاوه زمان‌اجرای بومی Codex، با احراز هویت `openai` وارد شوید و `openai/gpt-5.5` را پیکربندی کنید؛ نوبت‌های عامل OpenAI به‌طور پیش‌فرض Codex را انتخاب می‌کنند.
- فقط وقتی مسیر داخلی OpenClaw را می‌خواهید، از `agentRuntime.id: "openclaw"` در سطح ارائه‌دهنده/مدل استفاده کنید؛ در غیر این صورت `openai/gpt-5.5` را روی هارنس پیش‌فرض Codex نگه دارید.
- ارجاع‌های GPT قدیمی Codex وضعیت قدیمی هستند، نه یک مسیر ارائه‌دهنده زنده. برای پیکربندی عامل جدید، از `openai/gpt-5.5` روی زمان‌اجرای بومی Codex استفاده کنید و `openclaw doctor --fix` را اجرا کنید تا ارجاع‌های مدل Codex قدیمی به ارجاع‌های کانونی `openai/*` مهاجرت کنند.

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

### گزینه‌های میزبانی‌شده دیگر به سبک اشتراک

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/fa/providers/zai">
    Coding Plan در Z.AI یا endpointهای عمومی API.
  </Card>
  <Card title="MiniMax" href="/fa/providers/minimax">
    OAuth در MiniMax Coding Plan یا دسترسی با API key.
  </Card>
  <Card title="Qwen Cloud" href="/fa/providers/qwen">
    سطح ارائه‌دهنده Qwen Cloud به‌علاوه Alibaba DashScope و نگاشت endpoint در Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- احراز هویت: `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`)
- ارائه‌دهنده زمان‌اجرای Zen: `opencode`
- ارائه‌دهنده زمان‌اجرای Go: `opencode-go`
- مدل‌های نمونه: `opencode/claude-opus-4-6`، `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` یا `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- ارائه‌دهنده: `google`
- احراز هویت: `GEMINI_API_KEY`
- چرخش اختیاری: `GEMINI_API_KEYS`، `GEMINI_API_KEY_1`، `GEMINI_API_KEY_2`، جایگزین `GOOGLE_API_KEY`، و `OPENCLAW_LIVE_GEMINI_KEY` (بازنویسی تکی)
- مدل‌های نمونه: `google/gemini-3.1-pro-preview`، `google/gemini-3-flash-preview`
- سازگاری: پیکربندی قدیمی OpenClaw که از `google/gemini-3.1-flash-preview` استفاده می‌کند به `google/gemini-3-flash-preview` نرمال‌سازی می‌شود
- نام مستعار: `google/gemini-3.1-pro` پذیرفته می‌شود و به شناسه زنده Gemini API متعلق به Google، یعنی `google/gemini-3.1-pro-preview`، نرمال‌سازی می‌شود
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- تفکر: `/think adaptive` از تفکر پویا Google استفاده می‌کند. Gemini 3/3.1 یک `thinkingLevel` ثابت را حذف می‌کنند؛ Gemini 2.5 مقدار `thinkingBudget: -1` را می‌فرستد.
- اجراهای مستقیم Gemini همچنین `agents.defaults.models["google/<model>"].params.cachedContent` (یا `cached_content` قدیمی) را می‌پذیرند تا یک هندل بومی ارائه‌دهنده از نوع `cachedContents/...` ارسال شود؛ برخوردهای کش Gemini به‌صورت `cacheRead` در OpenClaw ظاهر می‌شوند

### Google Vertex و Gemini CLI

- ارائه‌دهندگان: `google-vertex`، `google-gemini-cli`
- احراز هویت: Vertex از gcloud ADC استفاده می‌کند؛ Gemini CLI از جریان OAuth خودش استفاده می‌کند

<Warning>
Gemini CLI OAuth در OpenClaw یک یکپارچه‌سازی غیررسمی است. برخی کاربران پس از استفاده از کلاینت‌های شخص ثالث، محدودیت‌هایی روی حساب Google خود گزارش کرده‌اند. شرایط Google را بررسی کنید و اگر ادامه دادن را انتخاب می‌کنید، از یک حساب غیرحساس استفاده کنید.
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

    مدل پیش‌فرض: `google-gemini-cli/gemini-3-flash-preview`. شما شناسه کلاینت یا راز را در `openclaw.json` جای‌گذاری **نمی‌کنید**. جریان ورود CLI توکن‌ها را در پروفایل‌های احراز هویت روی میزبان Gateway ذخیره می‌کند.

  </Step>
  <Step title="تنظیم پروژه (در صورت نیاز)">
    اگر درخواست‌ها پس از ورود ناموفق شدند، `GOOGLE_CLOUD_PROJECT` یا `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید.
  </Step>
</Steps>

Gemini CLI به‌طور پیش‌فرض از `stream-json` استفاده می‌کند. OpenClaw پیام‌های جریان دستیار را می‌خواند
و `stats.cached` را به `cacheRead` نرمال‌سازی می‌کند؛ بازنویسی‌های قدیمی
`--output-format json` همچنان متن پاسخ را از `response` می‌خوانند.

### Z.AI (GLM)

- ارائه‌دهنده: `zai`
- احراز هویت: `ZAI_API_KEY`
- مدل نمونه: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - ارجاع‌های مدل از شناسه ارائه‌دهنده کانونی `zai/*` استفاده می‌کنند.
  - `zai-api-key` نقطه پایانی منطبق Z.AI را به‌طور خودکار تشخیص می‌دهد؛ `zai-coding-global`، `zai-coding-cn`، `zai-global`، و `zai-cn` یک سطح مشخص را اجباری می‌کنند

### Vercel AI Gateway

- ارائه‌دهنده: `vercel-ai-gateway`
- احراز هویت: `AI_GATEWAY_API_KEY`
- مدل‌های نمونه: `vercel-ai-gateway/anthropic/claude-opus-4.6`، `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### سایر Pluginهای ارائه‌دهنده بسته‌بندی‌شده

| ارائه‌دهنده                             | شناسه                            | env احراز هویت                                      | مدل نمونه                                                  |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
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
    سرآیندهای انتساب برنامه و نشانگرهای `cache_control` متعلق به Anthropic را فقط روی مسیرهای تأییدشده `openrouter.ai` اعمال می‌کند. ارجاع‌های DeepSeek، Moonshot و ZAI برای کش‌کردن پرامپت مدیریت‌شده توسط OpenRouter واجد شرایط cache-TTL هستند، اما نشانگرهای کش Anthropic را دریافت نمی‌کنند. به‌عنوان یک مسیر سازگار با OpenAI به سبک پراکسی، شکل‌دهی‌های فقط بومی OpenAI (`serviceTier`، `store` در Responses، راهنماهای کش پرامپت، سازگاری استدلال OpenAI) را رد می‌کند. ارجاع‌های پشتیبانی‌شده با Gemini فقط پاک‌سازی امضای فکر proxy-Gemini را نگه می‌دارند.
  </Accordion>
  <Accordion title="Kilo Gateway">
    ارجاع‌های پشتیبانی‌شده با Gemini همان مسیر پاک‌سازی proxy-Gemini را دنبال می‌کنند؛ `kilocode/kilo/auto` و سایر ارجاع‌هایی که از استدلال پراکسی پشتیبانی نمی‌کنند، تزریق استدلال پراکسی را رد می‌کنند.
  </Accordion>
  <Accordion title="MiniMax">
    راه‌اندازی با کلید API تعریف‌های صریح مدل چت M3 و M2.7 را می‌نویسد؛ درک تصویر روی ارائه‌دهنده رسانه `MiniMax-VL-01` متعلق به Plugin باقی می‌ماند.
  </Accordion>
  <Accordion title="NVIDIA">
    شناسه‌های مدل از فضای نام `nvidia/<vendor>/<model>` استفاده می‌کنند (برای مثال `nvidia/nvidia/nemotron-...` در کنار `nvidia/moonshotai/kimi-k2.5`)؛ انتخاب‌گرها ترکیب لفظی `<provider>/<model-id>` را حفظ می‌کنند، درحالی‌که کلید کانونی ارسال‌شده به API تک‌پیشوندی می‌ماند.
  </Accordion>
  <Accordion title="xAI">
    از مسیر Responses مربوط به xAI استفاده می‌کند. مسیر پیشنهادی SuperGrok/X Premium OAuth است؛ کلیدهای API همچنان از طریق `XAI_API_KEY` یا پیکربندی Plugin کار می‌کنند، و `web_search` در Grok پیش از جایگزینی با کلید API از همان پروفایل احراز هویت استفاده می‌کند. `grok-4.3` مدل چت پیش‌فرض بسته‌بندی‌شده است، و `grok-build-0.1` برای کارهای متمرکز بر ساخت/کدنویسی قابل انتخاب است. `/fast` یا `params.fastMode: true` مقدارهای `grok-3`، `grok-3-mini`، `grok-4` و `grok-4-0709` را به گونه‌های `*-fast` آن‌ها بازنویسی می‌کند. `tool_stream` به‌طور پیش‌فرض روشن است؛ از طریق `agents.defaults.models["xai/<model>"].params.tool_stream=false` غیرفعالش کنید.
  </Accordion>
</AccordionGroup>

## ارائه‌دهندگان از طریق `models.providers` (URL سفارشی/پایه)

از `models.providers` (یا `models.json`) برای افزودن ارائه‌دهندگان **سفارشی** یا پراکسی‌های سازگار با OpenAI/Anthropic استفاده کنید.

بسیاری از Pluginهای ارائه‌دهنده بسته‌بندی‌شده زیر از قبل یک کاتالوگ پیش‌فرض منتشر می‌کنند. ورودی‌های صریح `models.providers.<id>` را فقط زمانی استفاده کنید که می‌خواهید URL پایه، سرآیندها یا فهرست مدل پیش‌فرض را بازنویسی کنید.

بررسی‌های قابلیت مدل در Gateway همچنین فرادادهٔ صریح `models.providers.<id>.models[]` را می‌خوانند. اگر یک مدل سفارشی یا پراکسی تصاویر را می‌پذیرد، روی آن مدل `input: ["text", "image"]` را تنظیم کنید تا WebChat و مسیرهای پیوست با مبدأ Node، تصاویر را به‌جای ارجاع‌های رسانه‌ای فقط-متن، به‌عنوان ورودی‌های بومی مدل عبور دهند.

`agents.defaults.models["provider/model"]` فقط نمایانی مدل، نام‌های مستعار و فرادادهٔ هر مدل را برای عامل‌ها کنترل می‌کند. این مورد به‌تنهایی یک مدل runtime جدید ثبت نمی‌کند. برای مدل‌های provider سفارشی، `models.providers.<provider>.models[]` را نیز با دست‌کم `id` مطابق اضافه کنید.

### Moonshot AI (Kimi)

پیش از راه‌اندازی، `@openclaw/moonshot-provider` را نصب کنید. فقط زمانی یک ورودی صریح `models.providers.moonshot` اضافه کنید که لازم است URL پایه یا فرادادهٔ مدل را بازنویسی کنید:

- Provider: `moonshot`
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

Kimi Coding از endpoint سازگار با Anthropic متعلق به Moonshot AI استفاده می‌کند:

- Provider: `kimi`
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

`kimi/kimi-code` و `kimi/k2p5` قدیمی همچنان به‌عنوان شناسه‌های مدل سازگارپذیری پذیرفته می‌شوند و به شناسهٔ مدل API پایدار Kimi نرمال‌سازی می‌شوند.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) دسترسی به Doubao و مدل‌های دیگر در چین را فراهم می‌کند.

- Provider: `volcengine` (کدنویسی: `volcengine-plan`)
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

راه‌اندازی به‌صورت پیش‌فرض از سطح کدنویسی استفاده می‌کند، اما کاتالوگ عمومی `volcengine/*` نیز هم‌زمان ثبت می‌شود.

در انتخاب‌گرهای مدل onboarding/configure، گزینهٔ احراز هویت Volcengine هر دو ردیف `volcengine/*` و `volcengine-plan/*` را ترجیح می‌دهد. اگر آن مدل‌ها هنوز بارگذاری نشده باشند، OpenClaw به‌جای نمایش یک انتخاب‌گر خالیِ محدود به ارائه‌دهنده، به کاتالوگ بدون فیلتر بازمی‌گردد.

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

BytePlus ARK برای کاربران بین‌المللی به همان مدل‌های Volcano Engine دسترسی می‌دهد.

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

Onboarding به‌طور پیش‌فرض از سطح کدنویسی استفاده می‌کند، اما کاتالوگ عمومی `byteplus/*` نیز هم‌زمان ثبت می‌شود.

در انتخاب‌گرهای مدل onboarding/configure، گزینهٔ احراز هویت BytePlus هر دو ردیف `byteplus/*` و `byteplus-plan/*` را ترجیح می‌دهد. اگر آن مدل‌ها هنوز بارگذاری نشده باشند، OpenClaw به‌جای نمایش یک انتخاب‌گر خالیِ محدود به ارائه‌دهنده، به کاتالوگ بدون فیلتر بازمی‌گردد.

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

Synthetic مدل‌های سازگار با Anthropic را پشت ارائه‌دهندهٔ `synthetic` فراهم می‌کند:

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

MiniMax از طریق `models.providers` پیکربندی می‌شود، زیرا از endpointهای سفارشی استفاده می‌کند:

- MiniMax OAuth (جهانی): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (چین): `--auth-choice minimax-cn-oauth`
- کلید API MiniMax (جهانی): `--auth-choice minimax-global-api`
- کلید API MiniMax (چین): `--auth-choice minimax-cn-api`
- احراز هویت: `MINIMAX_API_KEY` برای `minimax`؛ `MINIMAX_OAUTH_TOKEN` یا `MINIMAX_API_KEY` برای `minimax-portal`

برای جزئیات راه‌اندازی، گزینه‌های مدل و قطعه‌کدهای پیکربندی، [/providers/minimax](/fa/providers/minimax) را ببینید.

<Note>
در مسیر streaming سازگار با Anthropic در MiniMax، OpenClaw برای خانوادهٔ M2.x به‌طور پیش‌فرض thinking را غیرفعال می‌کند، مگر اینکه آن را صراحتاً تنظیم کنید؛ MiniMax-M3 (و M3.x) به‌طور پیش‌فرض روی مسیر thinking حذف‌شده/تطبیقیِ ارائه‌دهنده باقی می‌ماند. `/fast on` مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.
</Note>

تفکیک قابلیت‌های متعلق به Plugin:

- پیش‌فرض‌های متن/چت روی `minimax/MiniMax-M3` می‌مانند
- تولید تصویر `minimax/image-01` یا `minimax-portal/image-01` است
- درک تصویر در هر دو مسیر احراز هویت MiniMax، `MiniMax-VL-01` متعلق به Plugin است
- جست‌وجوی وب روی شناسهٔ ارائه‌دهندهٔ `minimax` می‌ماند

### LM Studio

LM Studio به‌صورت یک Plugin ارائه‌دهندهٔ همراه عرضه می‌شود که از API بومی استفاده می‌کند:

- ارائه‌دهنده: `lmstudio`
- احراز هویت: `LM_API_TOKEN`
- نشانی پایهٔ پیش‌فرض inference: `http://localhost:1234/v1`

سپس یک مدل تنظیم کنید (با یکی از شناسه‌های برگشتی از `http://localhost:1234/api/v1/models` جایگزین کنید):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw برای کشف و بارگذاری خودکار از `/api/v1/models` و `/api/v1/models/load` بومی LM Studio استفاده می‌کند و به‌طور پیش‌فرض برای inference از `/v1/chat/completions` استفاده می‌کند. اگر می‌خواهید بارگذاری JIT، TTL و auto-evict در LM Studio مالک چرخهٔ عمر مدل باشند، `models.providers.lmstudio.params.preload: false` را تنظیم کنید. برای راه‌اندازی و عیب‌یابی، [/providers/lmstudio](/fa/providers/lmstudio) را ببینید.

### Ollama

Ollama به‌صورت یک Plugin ارائه‌دهندهٔ همراه عرضه می‌شود و از API بومی Ollama استفاده می‌کند:

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

وقتی با `OLLAMA_API_KEY` آن را فعال کنید، Ollama به‌صورت محلی در `http://127.0.0.1:11434` شناسایی می‌شود و Plugin ارائه‌دهندهٔ همراه، Ollama را مستقیماً به `openclaw onboard` و انتخاب‌گر مدل اضافه می‌کند. برای onboarding، حالت ابری/محلی و پیکربندی سفارشی، [/providers/ollama](/fa/providers/ollama) را ببینید.

### vLLM

vLLM به‌صورت یک Plugin ارائه‌دهندهٔ همراه برای سرورهای محلی/خودمیزبانِ سازگار با OpenAI عرضه می‌شود:

- ارائه‌دهنده: `vllm`
- احراز هویت: اختیاری (به سرور شما بستگی دارد)
- نشانی پایهٔ پیش‌فرض: `http://127.0.0.1:8000/v1`

برای فعال‌کردن کشف خودکار به‌صورت محلی (اگر سرور شما احراز هویت را اعمال نمی‌کند، هر مقداری کار می‌کند):

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

SGLang به‌صورت یک Plugin ارائه‌دهندهٔ همراه برای سرورهای سریعِ خودمیزبانِ سازگار با OpenAI عرضه می‌شود:

- ارائه‌دهنده: `sglang`
- احراز هویت: اختیاری (به سرور شما بستگی دارد)
- نشانی پایهٔ پیش‌فرض: `http://127.0.0.1:30000/v1`

برای فعال‌کردن کشف خودکار به‌صورت محلی (اگر سرور شما احراز هویت را اعمال نمی‌کند، هر مقداری کار می‌کند):

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

### پروکسی‌های محلی (LM Studio، vLLM، LiteLLM، و غیره)

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
    برای ارائه‌دهنده‌های سفارشی، `reasoning`، `input`، `cost`، `contextWindow` و `maxTokens` اختیاری هستند. وقتی حذف شوند، OpenClaw به‌طور پیش‌فرض از این مقادیر استفاده می‌کند:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    توصیه‌شده: مقادیر صریحی تنظیم کنید که با محدودیت‌های پروکسی/مدل شما مطابقت داشته باشند.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - برای `api: "openai-completions"` روی endpointهای غیربومی (هر `baseUrl` غیرخالی که میزبان آن `api.openai.com` نیست)، OpenClaw مقدار `compat.supportsDeveloperRole: false` را اجباری می‌کند تا از خطاهای 400 ارائه‌دهنده برای نقش‌های پشتیبانی‌نشدهٔ `developer` جلوگیری شود.
    - مسیرهای پروکسی‌سبکِ سازگار با OpenAI همچنین شکل‌دهی درخواست‌های فقط بومی OpenAI را رد می‌کنند: بدون `service_tier`، بدون Responses `store`، بدون Completions `store`، بدون راهنمایی‌های prompt-cache، بدون شکل‌دهی payload سازگاری reasoning در OpenAI، و بدون headerهای پنهان انتساب OpenClaw.
    - برای پروکسی‌های Completions سازگار با OpenAI که به فیلدهای اختصاصی فروشنده نیاز دارند، `agents.defaults.models["provider/model"].params.extra_body` (یا `extraBody`) را تنظیم کنید تا JSON اضافی در بدنهٔ درخواست خروجی ادغام شود.
    - برای کنترل‌های chat-template در vLLM، `agents.defaults.models["provider/model"].params.chat_template_kwargs` را تنظیم کنید. Plugin همراه vLLM وقتی سطح thinking نشست خاموش باشد، برای `vllm/nemotron-3-*` به‌طور خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند.
    - برای مدل‌های محلی کند یا میزبان‌های LAN/tailnet از راه دور، `models.providers.<id>.timeoutSeconds` را تنظیم کنید. این کار پردازش درخواست HTTP مدل ارائه‌دهنده، شامل اتصال، headerها، streaming بدنه و لغو guarded-fetch کلی را افزایش می‌دهد، بدون اینکه timeout کل runtime عامل را افزایش دهد. اگر `agents.defaults.timeoutSeconds` یا timeout اختصاصی اجرا کمتر است، آن سقف را هم افزایش دهید؛ timeoutهای ارائه‌دهنده نمی‌توانند کل اجرا را طولانی‌تر کنند.
    - فراخوانی‌های HTTP ارائه‌دهندهٔ مدل، پاسخ‌های DNS جعلی-IP از Surge، Clash و sing-box را در `198.18.0.0/15` و `fc00::/7` فقط برای نام میزبان `baseUrl` پیکربندی‌شدهٔ ارائه‌دهنده مجاز می‌کنند. endpointهای سفارشی/محلی ارائه‌دهنده نیز برای درخواست‌های مدل guarded، به همان مبدأ دقیق پیکربندی‌شدهٔ `scheme://host:port` اعتماد می‌کنند، شامل میزبان‌های loopback، LAN و tailnet. این گزینهٔ پیکربندی جدیدی نیست؛ `baseUrl` که پیکربندی می‌کنید، سیاست درخواست را فقط برای همان مبدأ گسترش می‌دهد. مجوز نام میزبان fake-IP و اعتماد exact-origin سازوکارهای مستقلی هستند. مقصدهای خصوصی، loopback، link-local، metadata دیگر و پورت‌های متفاوت همچنان به فعال‌سازی صریح `models.providers.<id>.request.allowPrivateNetwork: true` نیاز دارند. برای خروج از اعتماد exact-origin، `models.providers.<id>.request.allowPrivateNetwork: false` را تنظیم کنید.
    - اگر `baseUrl` خالی/حذف‌شده باشد، OpenClaw رفتار پیش‌فرض OpenAI را نگه می‌دارد (که به `api.openai.com` resolve می‌شود).
    - برای ایمنی، `compat.supportsDeveloperRole: true` صریح همچنان روی endpointهای غیربومی `openai-completions` بازنویسی می‌شود.
    - برای `api: "anthropic-messages"` روی endpointهای غیرمستقیم (هر ارائه‌دهنده‌ای غیر از `anthropic` canonical، یا یک `models.providers.anthropic.baseUrl` سفارشی که میزبان آن endpoint عمومی `api.anthropic.com` نیست)، OpenClaw headerهای beta ضمنی Anthropic مانند `claude-code-20250219`، `interleaved-thinking-2025-05-14` و نشانگرهای OAuth را سرکوب می‌کند تا پروکسی‌های سفارشیِ سازگار با Anthropic پرچم‌های beta پشتیبانی‌نشده را رد نکنند. اگر پروکسی شما به ویژگی‌های beta مشخصی نیاز دارد، `models.providers.<id>.headers["anthropic-beta"]` را صراحتاً تنظیم کنید.

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
- [failover مدل](/fa/concepts/model-failover) - زنجیره‌های fallback و رفتار retry
- [مدل‌ها](/fa/concepts/models) - پیکربندی مدل و aliasها
- [ارائه‌دهنده‌ها](/fa/providers) - راهنماهای راه‌اندازی برای هر ارائه‌دهنده
