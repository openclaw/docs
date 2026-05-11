---
read_when:
    - به یک مرجع راه‌اندازی مدل به تفکیک ارائه‌دهنده نیاز دارید
    - به پیکربندی‌های نمونه یا فرمان‌های راه‌اندازی اولیهٔ CLI برای ارائه‌دهندگان مدل نیاز دارید
sidebarTitle: Model providers
summary: مرور کلی ارائه‌دهندهٔ مدل با پیکربندی‌های نمونه + جریان‌های CLI
title: ارائه‌دهندگان مدل
x-i18n:
    generated_at: "2026-05-11T20:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a3cde106981c2601c0b127116c8b5968a9f95571245fc795e9a181243fc3b7e
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع برای **ارائه‌دهندگان LLM/model** (نه کانال‌های چت مانند WhatsApp/Telegram). برای قواعد انتخاب مدل، [مدل‌ها](/fa/concepts/models) را ببینید.

## قواعد سریع

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - ارجاع‌های مدل از `provider/model` استفاده می‌کنند (نمونه: `opencode/claude-opus-4-6`).
    - وقتی `agents.defaults.models` تنظیم شود، به‌عنوان فهرست مجاز عمل می‌کند.
    - کمک‌کننده‌های CLI: `openclaw onboard`، `openclaw models list`، `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` پیش‌فرض‌های سطح ارائه‌دهنده را تنظیم می‌کنند؛ `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` آن‌ها را برای هر مدل بازنویسی می‌کنند.
    - قواعد جایگزینی، پروب‌های دوره انتظار، و پایداری بازنویسی نشست: [جایگزینی مدل](/fa/concepts/model-failover).

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    `openclaw configure` هنگام افزودن یا احراز هویت دوباره یک ارائه‌دهنده، مقدار موجود `agents.defaults.model.primary` را حفظ می‌کند. `openclaw models auth login` نیز همین کار را انجام می‌دهد، مگر این‌که `--set-default` را پاس بدهید. Pluginهای ارائه‌دهنده همچنان ممکن است یک مدل پیش‌فرض پیشنهادی را در وصله پیکربندی احراز هویت خود برگردانند، اما وقتی از قبل یک مدل اصلی وجود داشته باشد، OpenClaw با آن به‌عنوان «این مدل را در دسترس قرار بده» رفتار می‌کند، نه «مدل اصلی فعلی را جایگزین کن».

    برای تغییر عمدی مدل پیش‌فرض، از `openclaw models set <provider/model>` یا `openclaw models auth login --provider <id> --set-default` استفاده کنید.

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    مسیرهای خانواده OpenAI وابسته به پیشوند هستند:

    - `openai/<model>` به‌صورت پیش‌فرض برای نوبت‌های عامل از harness بومی سرور برنامه Codex استفاده می‌کند. این چینش معمول اشتراک ChatGPT/Codex است.
    - `openai-codex/<model>` پیکربندی قدیمی است که doctor آن را به `openai/<model>` بازنویسی می‌کند.
    - `openai/<model>` به‌همراه `agentRuntime.id: "pi"` در سطح ارائه‌دهنده/مدل، از PI برای مسیرهای صریح کلید API یا سازگاری استفاده می‌کند.

    [OpenAI](/fa/providers/openai) و [harness کدکس](/fa/plugins/codex-harness) را ببینید. اگر جداسازی ارائه‌دهنده/runtime گیج‌کننده است، ابتدا [runtimeهای عامل](/fa/concepts/agent-runtimes) را بخوانید.

    فعال‌سازی خودکار Plugin از همین مرز پیروی می‌کند: ارجاع‌های عامل `openai/*`، Plugin کدکس را برای مسیر پیش‌فرض فعال می‌کنند، و `agentRuntime.id: "codex"` صریح در سطح ارائه‌دهنده/مدل یا ارجاع‌های قدیمی `codex/<model>` نیز به آن نیاز دارند.

    GPT-5.5 به‌صورت پیش‌فرض از طریق harness بومی سرور برنامه Codex روی `openai/gpt-5.5` در دسترس است، و فقط وقتی سیاست runtime ارائه‌دهنده/مدل صراحتا `pi` را انتخاب کند از طریق PI در دسترس است.

  </Accordion>
  <Accordion title="CLI runtimes">
    runtimeهای CLI از همین جداسازی استفاده می‌کنند: ارجاع‌های مدل canonical مانند `anthropic/claude-*`، `google/gemini-*`، یا `openai/gpt-*` را انتخاب کنید، سپس وقتی یک backend محلی CLI می‌خواهید، سیاست runtime ارائه‌دهنده/مدل را روی `claude-cli`، `google-gemini-cli`، یا `codex-cli` تنظیم کنید.

    ارجاع‌های قدیمی `claude-cli/*`، `google-gemini-cli/*`، و `codex-cli/*` دوباره به ارجاع‌های canonical ارائه‌دهنده مهاجرت می‌کنند و runtime جداگانه ثبت می‌شود.

  </Accordion>
</AccordionGroup>

## رفتار ارائه‌دهنده تحت مالکیت Plugin

بیشتر منطق اختصاصی هر ارائه‌دهنده در Pluginهای ارائه‌دهنده (`registerProvider(...)`) قرار دارد، در حالی که OpenClaw حلقه استنتاج عمومی را نگه می‌دارد. Pluginها مالک onboarding، کاتالوگ‌های مدل، نگاشت متغیرهای محیطی احراز هویت، نرمال‌سازی transport/config، پاک‌سازی طرح‌واره ابزار، دسته‌بندی failover، تازه‌سازی OAuth، گزارش مصرف، پروفایل‌های thinking/reasoning، و موارد دیگر هستند.

فهرست کامل hookهای provider-SDK و نمونه‌های Pluginهای همراه در [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) قرار دارد. ارائه‌دهنده‌ای که به یک اجراکننده درخواست کاملا سفارشی نیاز دارد، یک سطح افزونه جدا و عمیق‌تر است.

<Note>
رفتار runner تحت مالکیت ارائه‌دهنده روی hookهای صریح ارائه‌دهنده مانند سیاست replay، نرمال‌سازی طرح‌واره ابزار، پیچیدن stream، و کمک‌کننده‌های transport/request قرار دارد. کیسه ایستای قدیمی `ProviderPlugin.capabilities` فقط برای سازگاری است و دیگر توسط منطق runner مشترک خوانده نمی‌شود.
</Note>

## چرخش کلید API

<AccordionGroup>
  <Accordion title="Key sources and priority">
    چند کلید را از طریق موارد زیر پیکربندی کنید:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (بازنویسی زنده تکی، با بالاترین اولویت)
    - `<PROVIDER>_API_KEYS` (فهرست جداشده با کاما یا نقطه‌ویرگول)
    - `<PROVIDER>_API_KEY` (کلید اصلی)
    - `<PROVIDER>_API_KEY_*` (فهرست شماره‌گذاری‌شده، مثلا `<PROVIDER>_API_KEY_1`)

    برای ارائه‌دهندگان Google، `GOOGLE_API_KEY` نیز به‌عنوان fallback گنجانده می‌شود. ترتیب انتخاب کلید، اولویت را حفظ می‌کند و مقادیر تکراری را حذف می‌کند.

  </Accordion>
  <Accordion title="When rotation kicks in">
    - درخواست‌ها فقط در پاسخ‌های rate-limit با کلید بعدی دوباره امتحان می‌شوند (برای مثال `429`، `rate_limit`، `quota`، `resource exhausted`، `Too many concurrent requests`، `ThrottlingException`، `concurrency limit reached`، `workers_ai ... quota limit exceeded`، یا پیام‌های دوره‌ای usage-limit).
    - شکست‌های غیر rate-limit بلافاصله شکست می‌خورند؛ هیچ چرخش کلیدی امتحان نمی‌شود.
    - وقتی همه کلیدهای نامزد شکست بخورند، خطای نهایی از آخرین تلاش برگردانده می‌شود.

  </Accordion>
</AccordionGroup>

## ارائه‌دهندگان داخلی (کاتالوگ pi-ai)

OpenClaw با کاتالوگ pi-ai عرضه می‌شود. این ارائه‌دهندگان به **هیچ** پیکربندی `models.providers` نیاز ندارند؛ فقط احراز هویت را تنظیم کنید و یک مدل انتخاب کنید.

### OpenAI

- ارائه‌دهنده: `openai`
- احراز هویت: `OPENAI_API_KEY`
- چرخش اختیاری: `OPENAI_API_KEYS`، `OPENAI_API_KEY_1`، `OPENAI_API_KEY_2`، به‌علاوه `OPENCLAW_LIVE_OPENAI_KEY` (بازنویسی تکی)
- مدل‌های نمونه: `openai/gpt-5.5`، `openai/gpt-5.4-mini`
- اگر یک نصب خاص یا کلید API متفاوت رفتار می‌کند، دسترس‌پذیری حساب/مدل را با `openclaw models list --provider openai` بررسی کنید.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport پیش‌فرض `auto` است؛ OpenClaw انتخاب transport را به pi-ai پاس می‌دهد.
- بازنویسی برای هر مدل از طریق `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`، `"websocket"`، یا `"auto"`)
- پردازش اولویت OpenAI را می‌توان از طریق `agents.defaults.models["openai/<model>"].params.serviceTier` فعال کرد
- `/fast` و `params.fastMode` درخواست‌های مستقیم Responses متعلق به `openai/*` را روی `api.openai.com` به `service_tier=priority` نگاشت می‌کنند
- وقتی به‌جای سوییچ مشترک `/fast` یک tier صریح می‌خواهید، از `params.serviceTier` استفاده کنید
- سرآیندهای مخفی انتساب OpenClaw (`originator`، `version`، `User-Agent`) فقط روی ترافیک بومی OpenAI به `api.openai.com` اعمال می‌شوند، نه پراکسی‌های عمومی سازگار با OpenAI
- مسیرهای بومی OpenAI همچنین شکل‌دهی payload مربوط به Responses `store`، اشاره‌های prompt-cache، و سازگاری reasoning OpenAI را نگه می‌دارند؛ مسیرهای پراکسی این کار را نمی‌کنند
- `openai/gpt-5.3-codex-spark` عمدا در OpenClaw پنهان شده است، چون درخواست‌های زنده API OpenAI آن را رد می‌کنند و کاتالوگ فعلی Codex آن را عرضه نمی‌کند

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
- درخواست‌های مستقیم عمومی Anthropic از سوییچ مشترک `/fast` و `params.fastMode` پشتیبانی می‌کنند، شامل ترافیک احراز هویت‌شده با کلید API و OAuth که به `api.anthropic.com` فرستاده می‌شود؛ OpenClaw آن را به `service_tier` در Anthropic نگاشت می‌کند (`auto` در برابر `standard_only`)
- پیکربندی ترجیحی Claude CLI ارجاع مدل را canonical نگه می‌دارد و CLI
  backend را جداگانه انتخاب می‌کند: `anthropic/claude-opus-4-7` با
  `agentRuntime.id: "claude-cli"` در محدوده مدل. ارجاع‌های قدیمی
  `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند.

<Note>
کارکنان Anthropic به ما گفته‌اند استفاده OpenClaw-سبک از Claude CLI دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر این‌که Anthropic سیاست جدیدی منتشر کند. setup-token مربوط به Anthropic همچنان به‌عنوان مسیر توکن پشتیبانی‌شده OpenClaw در دسترس است، اما OpenClaw اکنون وقتی Claude CLI و `claude -p` در دسترس باشند، استفاده مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth کدکس OpenAI

- ارائه‌دهنده: `openai-codex`
- احراز هویت: OAuth (ChatGPT)
- ارجاع مدل قدیمی PI: `openai-codex/gpt-5.5`
- ارجاع harness بومی سرور برنامه Codex: `openai/gpt-5.5`
- مستندات harness بومی سرور برنامه Codex: [harness کدکس](/fa/plugins/codex-harness)
- ارجاع‌های مدل قدیمی: `codex/gpt-*`
- مرز Plugin: `openai-codex/*`، Plugin OpenAI را بارگذاری می‌کند؛ Plugin بومی سرور برنامه Codex فقط توسط runtime harness کدکس یا ارجاع‌های قدیمی `codex/*` انتخاب می‌شود.
- CLI: `openclaw onboard --auth-choice openai-codex` یا `openclaw models auth login --provider openai-codex`
- transport پیش‌فرض `auto` است (اول WebSocket، fallback به SSE)
- بازنویسی برای هر مدل PI از طریق `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`، `"websocket"`، یا `"auto"`)
- `params.serviceTier` همچنین روی درخواست‌های بومی Codex Responses (`chatgpt.com/backend-api`) forward می‌شود
- سرآیندهای مخفی انتساب OpenClaw (`originator`، `version`، `User-Agent`) فقط روی ترافیک بومی Codex به `chatgpt.com/backend-api` پیوست می‌شوند، نه پراکسی‌های عمومی سازگار با OpenAI
- همان سوییچ `/fast` و پیکربندی `params.fastMode` را مانند `openai/*` مستقیم به اشتراک می‌گذارد؛ OpenClaw آن را به `service_tier=priority` نگاشت می‌کند
- `openai-codex/gpt-5.5` از `contextWindow = 400000` بومی کاتالوگ Codex و runtime پیش‌فرض `contextTokens = 272000` استفاده می‌کند؛ سقف runtime را با `models.providers.openai-codex.models[].contextTokens` بازنویسی کنید
- نکته سیاست: OAuth کدکس OpenAI صراحتا برای ابزارها/گردش‌کارهای خارجی مانند OpenClaw پشتیبانی می‌شود.
- برای مسیر رایج اشتراک به‌علاوه runtime بومی Codex، با احراز هویت `openai-codex` وارد شوید اما `openai/gpt-5.5` را پیکربندی کنید؛ نوبت‌های عامل OpenAI به‌صورت پیش‌فرض Codex را انتخاب می‌کنند.
- فقط وقتی می‌خواهید یک مسیر سازگاری از طریق PI داشته باشید، از `agentRuntime.id: "pi"` در سطح ارائه‌دهنده/مدل استفاده کنید؛ در غیر این صورت `openai/gpt-5.5` را روی harness پیش‌فرض Codex نگه دارید.
- ارجاع‌های قدیمی‌تر `openai-codex/gpt-5.1*`، `openai-codex/gpt-5.2*`، و `openai-codex/gpt-5.3*` پنهان شده‌اند، چون حساب‌های OAuth متعلق به ChatGPT/Codex آن‌ها را رد می‌کنند؛ به‌جای آن از `openai-codex/gpt-5.5` یا مسیر runtime بومی Codex استفاده کنید.

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
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### گزینه‌های میزبانی‌شده دیگر به سبک اشتراک

<CardGroup cols={3}>
  <Card title="GLM models" href="/fa/providers/glm">
    Coding Plan متعلق به Z.AI یا endpointهای عمومی API.
  </Card>
  <Card title="MiniMax" href="/fa/providers/minimax">
    OAuth مربوط به MiniMax Coding Plan یا دسترسی با کلید API.
  </Card>
  <Card title="Qwen Cloud" href="/fa/providers/qwen">
    سطح ارائه‌دهنده Qwen Cloud به‌علاوه نگاشت endpointهای Alibaba DashScope و Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- احراز هویت: `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`)
- ارائه‌دهنده runtime Zen: `opencode`
- ارائه‌دهنده runtime Go: `opencode-go`
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
- سازگاری: پیکربندی قدیمی OpenClaw که از `google/gemini-3.1-flash-preview` استفاده می‌کند، به `google/gemini-3-flash-preview` نرمال‌سازی می‌شود
- نام مستعار: `google/gemini-3.1-pro` پذیرفته می‌شود و به شناسه زنده API شرکت Google برای Gemini، یعنی `google/gemini-3.1-pro-preview` نرمال‌سازی می‌شود
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- تفکر: `/think adaptive` از تفکر پویای Google استفاده می‌کند. Gemini 3/3.1 مقدار ثابت `thinkingLevel` را حذف می‌کنند؛ Gemini 2.5 مقدار `thinkingBudget: -1` را می‌فرستد.
- اجرای مستقیم Gemini همچنین `agents.defaults.models["google/<model>"].params.cachedContent` (یا نسخه قدیمی `cached_content`) را می‌پذیرد تا یک هندل بومی ارائه‌دهنده با قالب `cachedContents/...` را ارسال کند؛ برخوردهای کش Gemini به‌صورت `cacheRead` در OpenClaw نمایش داده می‌شوند

### Google Vertex و Gemini CLI

- ارائه‌دهندگان: `google-vertex`، `google-gemini-cli`
- احراز هویت: Vertex از gcloud ADC استفاده می‌کند؛ Gemini CLI از جریان OAuth خودش استفاده می‌کند

<Warning>
OAuth مربوط به Gemini CLI در OpenClaw یک یکپارچه‌سازی غیررسمی است. برخی کاربران پس از استفاده از کلاینت‌های شخص ثالث، محدودیت‌هایی روی حساب Google خود گزارش کرده‌اند. اگر تصمیم به ادامه دارید، شرایط Google را بررسی کنید و از یک حساب غیرحیاتی استفاده کنید.
</Warning>

OAuth مربوط به Gemini CLI به‌عنوان بخشی از Plugin بسته‌بندی‌شده `google` ارائه می‌شود.

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

    مدل پیش‌فرض: `google-gemini-cli/gemini-3-flash-preview`. شما شناسه کلاینت یا secret را در `openclaw.json` وارد نمی‌کنید. جریان ورود CLI توکن‌ها را در پروفایل‌های احراز هویت روی میزبان Gateway ذخیره می‌کند.

  </Step>
  <Step title="Set project (if needed)">
    اگر درخواست‌ها پس از ورود ناموفق بودند، `GOOGLE_CLOUD_PROJECT` یا `GOOGLE_CLOUD_PROJECT_ID` را روی میزبان Gateway تنظیم کنید.
  </Step>
</Steps>

پاسخ‌های JSON مربوط به Gemini CLI از `response` پارس می‌شوند؛ usage به `stats` بازمی‌گردد و `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.

### Z.AI (GLM)

- ارائه‌دهنده: `zai`
- احراز هویت: `ZAI_API_KEY`
- مدل نمونه: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - نام‌های مستعار: `z.ai/*` و `z-ai/*` به `zai/*` نرمال‌سازی می‌شوند
  - `zai-api-key` نقطه پایانی متناظر Z.AI را به‌صورت خودکار شناسایی می‌کند؛ `zai-coding-global`، `zai-coding-cn`، `zai-global`، و `zai-cn` یک سطح مشخص را اجباری می‌کنند

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
- کاتالوگ جایگزین ایستا `kilocode/kilo/auto` را ارائه می‌کند؛ کشف زنده از `https://api.kilo.ai/api/gateway/models` می‌تواند کاتالوگ زمان اجرا را بیشتر گسترش دهد.
- مسیریابی دقیق بالادستی پشت `kilocode/kilo/auto` متعلق به Kilo Gateway است و در OpenClaw به‌صورت سخت‌کدشده قرار ندارد.

برای جزئیات راه‌اندازی، [/providers/kilocode](/fa/providers/kilocode) را ببینید.

### سایر Pluginهای ارائه‌دهنده بسته‌بندی‌شده

| ارائه‌دهنده                | شناسه                               | متغیر محیطی احراز هویت                                                     | مدل نمونه                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` یا `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` یا `KIMICODE_API_KEY`                         | `kimi/kimi-for-coding`                        |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### نکات خاصی که دانستنشان مفید است

<AccordionGroup>
  <Accordion title="OpenRouter">
    سرآیندهای انتساب برنامه و نشانگرهای `cache_control` متعلق به Anthropic را فقط روی مسیرهای تأییدشده‌ی `openrouter.ai` اعمال می‌کند. ارجاع‌های DeepSeek، Moonshot و ZAI برای کش‌کردن پرامپت مدیریت‌شده توسط OpenRouter، واجد شرایط cache-TTL هستند، اما نشانگرهای کش Anthropic را دریافت نمی‌کنند. به‌عنوان یک مسیر سازگار با OpenAI به سبک پراکسی، شکل‌دهی‌های فقط ویژه‌ی OpenAI بومی را نادیده می‌گیرد (`serviceTier`، `store` در Responses، راهنمایی‌های prompt-cache، سازگاری reasoning با OpenAI). ارجاع‌های مبتنی بر Gemini فقط پاک‌سازی امضای تفکر proxy-Gemini را نگه می‌دارند.
  </Accordion>
  <Accordion title="Kilo Gateway">
    ارجاع‌های مبتنی بر Gemini همان مسیر پاک‌سازی proxy-Gemini را دنبال می‌کنند؛ `kilocode/kilo/auto` و دیگر ارجاع‌هایی که از reasoning پراکسی پشتیبانی نمی‌کنند، تزریق reasoning پراکسی را نادیده می‌گیرند.
  </Accordion>
  <Accordion title="MiniMax">
    راه‌اندازی با کلید API تعریف‌های صریح مدل چت M2.7 فقط متنی را می‌نویسد؛ درک تصویر روی ارائه‌دهنده‌ی رسانه‌ی `MiniMax-VL-01` که مالکیت آن با Plugin است باقی می‌ماند.
  </Accordion>
  <Accordion title="NVIDIA">
    شناسه‌های مدل از فضای نام `nvidia/<vendor>/<model>` استفاده می‌کنند (برای مثال `nvidia/nvidia/nemotron-...` در کنار `nvidia/moonshotai/kimi-k2.5`)؛ انتخاب‌گرها ترکیب لفظی `<provider>/<model-id>` را حفظ می‌کنند، درحالی‌که کلید canonical ارسال‌شده به API تک‌پیشوندی می‌ماند.
  </Accordion>
  <Accordion title="xAI">
    از مسیر Responses متعلق به xAI استفاده می‌کند. `grok-4.3` مدل چت پیش‌فرض باندل‌شده است. `/fast` یا `params.fastMode: true`، `grok-3`، `grok-3-mini`، `grok-4` و `grok-4-0709` را به گونه‌های `*-fast` آن‌ها بازنویسی می‌کند. `tool_stream` به‌طور پیش‌فرض روشن است؛ از طریق `agents.defaults.models["xai/<model>"].params.tool_stream=false` غیرفعالش کنید.
  </Accordion>
  <Accordion title="Cerebras">
    به‌عنوان Plugin ارائه‌دهنده‌ی باندل‌شده‌ی `cerebras` عرضه می‌شود. GLM از `zai-glm-4.7` استفاده می‌کند؛ URL پایه‌ی سازگار با OpenAI برابر است با `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## ارائه‌دهندگان از طریق `models.providers` (سفارشی/URL پایه)

از `models.providers` (یا `models.json`) برای افزودن ارائه‌دهندگان **سفارشی** یا پراکسی‌های سازگار با OpenAI/Anthropic استفاده کنید.

بسیاری از Pluginهای ارائه‌دهنده‌ی باندل‌شده در زیر از قبل یک کاتالوگ پیش‌فرض منتشر می‌کنند. فقط زمانی از ورودی‌های صریح `models.providers.<id>` استفاده کنید که بخواهید URL پایه، سرآیندها یا فهرست مدل پیش‌فرض را بازنویسی کنید.

بررسی‌های قابلیت مدل Gateway همچنین فراداده‌ی صریح `models.providers.<id>.models[]` را می‌خوانند. اگر یک مدل سفارشی یا پراکسی تصاویر را می‌پذیرد، روی آن مدل `input: ["text", "image"]` را تنظیم کنید تا WebChat و مسیرهای پیوست با منشأ نود، تصاویر را به‌جای ارجاع‌های رسانه‌ای فقط متنی، به‌عنوان ورودی‌های بومی مدل ارسال کنند.

`agents.defaults.models["provider/model"]` فقط نمایانی مدل، نام‌های مستعار و فراداده‌ی هر مدل برای agentها را کنترل می‌کند. این مورد به‌تنهایی یک مدل runtime جدید ثبت نمی‌کند. برای مدل‌های ارائه‌دهنده‌ی سفارشی، همچنین `models.providers.<provider>.models[]` را با حداقل `id` منطبق اضافه کنید.

### Moonshot AI (Kimi)

Moonshot به‌عنوان یک Plugin ارائه‌دهنده‌ی باندل‌شده عرضه می‌شود. به‌طور پیش‌فرض از ارائه‌دهنده‌ی داخلی استفاده کنید، و فقط زمانی یک ورودی صریح `models.providers.moonshot` اضافه کنید که لازم است URL پایه یا فراداده‌ی مدل را بازنویسی کنید:

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

Kimi Coding از endpoint سازگار با Anthropic متعلق به Moonshot AI استفاده می‌کند:

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

شناسه‌های مدل قدیمی `kimi/kimi-code` و `kimi/k2p5` همچنان برای سازگاری پذیرفته می‌شوند و به شناسه مدل API پایدار Kimi نرمال‌سازی می‌شوند.

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

راه‌اندازی اولیه به‌صورت پیش‌فرض از سطح کدنویسی استفاده می‌کند، اما کاتالوگ عمومی `volcengine/*` نیز هم‌زمان ثبت می‌شود.

در انتخاب‌گرهای مدلِ راه‌اندازی اولیه/پیکربندی، گزینه احراز هویت Volcengine هر دو ردیف `volcengine/*` و `volcengine-plan/*` را ترجیح می‌دهد. اگر آن مدل‌ها هنوز بارگذاری نشده باشند، OpenClaw به‌جای نمایش یک انتخاب‌گر خالی محدود به ارائه‌دهنده، به کاتالوگ فیلترنشده برمی‌گردد.

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

راه‌اندازی اولیه به‌صورت پیش‌فرض از سطح کدنویسی استفاده می‌کند، اما کاتالوگ عمومی `byteplus/*` نیز هم‌زمان ثبت می‌شود.

در انتخاب‌گرهای مدلِ راه‌اندازی اولیه/پیکربندی، گزینه احراز هویت BytePlus هر دو ردیف `byteplus/*` و `byteplus-plan/*` را ترجیح می‌دهد. اگر آن مدل‌ها هنوز بارگذاری نشده باشند، OpenClaw به‌جای نمایش یک انتخاب‌گر خالی محدود به ارائه‌دهنده، به کاتالوگ فیلترنشده برمی‌گردد.

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

برای جزئیات راه‌اندازی، گزینه‌های مدل و قطعه‌کدهای پیکربندی، [/providers/minimax](/fa/providers/minimax) را ببینید.

<Note>
در مسیر استریم سازگار با Anthropic در MiniMax، OpenClaw به‌صورت پیش‌فرض thinking را غیرفعال می‌کند مگر اینکه آن را صراحتا تنظیم کنید، و `/fast on` مقدار `MiniMax-M2.7` را به `MiniMax-M2.7-highspeed` بازنویسی می‌کند.
</Note>

تفکیک قابلیت‌های تحت مالکیت Plugin:

- پیش‌فرض‌های متن/گفت‌وگو روی `minimax/MiniMax-M2.7` باقی می‌مانند
- تولید تصویر `minimax/image-01` یا `minimax-portal/image-01` است
- درک تصویر، `MiniMax-VL-01` تحت مالکیت Plugin در هر دو مسیر احراز هویت MiniMax است
- جست‌وجوی وب روی شناسه ارائه‌دهنده `minimax` باقی می‌ماند

### LM Studio

LM Studio به‌عنوان یک Plugin ارائه‌دهنده بسته‌بندی‌شده عرضه می‌شود که از API بومی استفاده می‌کند:

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

OpenClaw برای کشف و بارگذاری خودکار از `/api/v1/models` و `/api/v1/models/load` بومی LM Studio استفاده می‌کند، و به‌صورت پیش‌فرض برای استنتاج از `/v1/chat/completions` استفاده می‌کند. اگر می‌خواهید بارگذاری JIT، TTL و auto-evict در LM Studio چرخه عمر مدل را مدیریت کنند، `models.providers.lmstudio.params.preload: false` را تنظیم کنید. برای راه‌اندازی و عیب‌یابی، [/providers/lmstudio](/fa/providers/lmstudio) را ببینید.

### Ollama

Ollama به‌عنوان یک Plugin ارائه‌دهنده بسته‌بندی‌شده عرضه می‌شود و از API بومی Ollama استفاده می‌کند:

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

وقتی با `OLLAMA_API_KEY` آن را فعال کنید، Ollama به‌صورت محلی در `http://127.0.0.1:11434` شناسایی می‌شود، و Plugin ارائه‌دهنده بسته‌بندی‌شده Ollama را مستقیما به `openclaw onboard` و انتخاب‌گر مدل اضافه می‌کند. برای راه‌اندازی اولیه، حالت ابری/محلی و پیکربندی سفارشی، [/providers/ollama](/fa/providers/ollama) را ببینید.

### vLLM

vLLM به‌عنوان یک Plugin ارائه‌دهنده بسته‌بندی‌شده برای سرورهای محلی/خودمیزبان سازگار با OpenAI عرضه می‌شود:

- ارائه‌دهنده: `vllm`
- احراز هویت: اختیاری (به سرور شما بستگی دارد)
- URL پایه پیش‌فرض: `http://127.0.0.1:8000/v1`

برای فعال کردن کشف خودکار به‌صورت محلی (اگر سرور شما احراز هویت را اعمال نکند، هر مقداری کار می‌کند):

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

SGLang به‌عنوان یک Plugin ارائه‌دهنده بسته‌بندی‌شده برای سرورهای خودمیزبان سریعِ سازگار با OpenAI عرضه می‌شود:

- ارائه‌دهنده: `sglang`
- احراز هویت: اختیاری (به سرور شما بستگی دارد)
- URL پایه پیش‌فرض: `http://127.0.0.1:30000/v1`

برای فعال کردن کشف خودکار به‌صورت محلی (اگر سرور شما احراز هویت را اعمال نکند، هر مقداری کار می‌کند):

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
  <Accordion title="فیلدهای اختیاری پیش‌فرض">
    برای ارائه‌دهندگان سفارشی، `reasoning`، `input`، `cost`، `contextWindow` و `maxTokens` اختیاری هستند. اگر حذف شوند، OpenClaw به این مقادیر پیش‌فرض برمی‌گردد:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    توصیه می‌شود: مقادیر صریحی تنظیم کنید که با محدودیت‌های پراکسی/مدل شما مطابقت داشته باشند.

  </Accordion>
  <Accordion title="قواعد شکل‌دهی مسیر پراکسی">
    - برای `api: "openai-completions"` روی endpointهای غیربومی (هر `baseUrl` غیرخالی که میزبان آن `api.openai.com` نباشد)، OpenClaw مقدار `compat.supportsDeveloperRole: false` را اجباری می‌کند تا از خطاهای 400 ارائه‌دهنده برای نقش‌های پشتیبانی‌نشده `developer` جلوگیری شود.
    - مسیرهای سازگار با OpenAI به سبک پراکسی، شکل‌دهی درخواست مختص OpenAI بومی را نیز نادیده می‌گیرند: بدون `service_tier`، بدون `store` در Responses، بدون `store` در Completions، بدون راهنمایی‌های prompt-cache، بدون شکل‌دهی payload سازگاری reasoning در OpenAI، و بدون هدرهای انتساب پنهان OpenClaw.
    - برای پراکسی‌های Completions سازگار با OpenAI که به فیلدهای خاص فروشنده نیاز دارند، `agents.defaults.models["provider/model"].params.extra_body` (یا `extraBody`) را تنظیم کنید تا JSON اضافی در بدنه درخواست خروجی ادغام شود.
    - برای کنترل‌های chat-template در vLLM، `agents.defaults.models["provider/model"].params.chat_template_kwargs` را تنظیم کنید. Plugin بسته‌بندی‌شده vLLM وقتی سطح thinking نشست خاموش باشد، برای `vllm/nemotron-3-*` به‌صورت خودکار `enable_thinking: false` و `force_nonempty_content: true` را ارسال می‌کند.
    - برای مدل‌های محلی کند یا میزبان‌های LAN/tailnet راه دور، `models.providers.<id>.timeoutSeconds` را تنظیم کنید. این کار رسیدگی به درخواست HTTP مدل ارائه‌دهنده، از جمله اتصال، هدرها، استریم بدنه و توقف کلی guarded-fetch را افزایش می‌دهد، بدون اینکه timeout کل runtime عامل افزایش پیدا کند.
    - فراخوانی‌های HTTP ارائه‌دهنده مدل، پاسخ‌های DNS fake-IP مربوط به Surge، Clash و sing-box را در `198.18.0.0/15` و `fc00::/7` فقط برای نام میزبان `baseUrl` ارائه‌دهنده پیکربندی‌شده مجاز می‌دانند. سایر مقصدهای خصوصی، loopback، link-local و metadata همچنان به فعال‌سازی صریح `models.providers.<id>.request.allowPrivateNetwork: true` نیاز دارند.
    - اگر `baseUrl` خالی باشد/حذف شود، OpenClaw رفتار پیش‌فرض OpenAI را نگه می‌دارد (که به `api.openai.com` resolve می‌شود).
    - برای ایمنی، مقدار صریح `compat.supportsDeveloperRole: true` همچنان روی endpointهای غیربومی `openai-completions` override می‌شود.
    - برای `api: "anthropic-messages"` روی endpointهای غیرمستقیم (هر ارائه‌دهنده‌ای غیر از `anthropic` متعارف، یا `models.providers.anthropic.baseUrl` سفارشی که میزبان آن یک endpoint عمومی `api.anthropic.com` نباشد)، OpenClaw هدرهای بتای ضمنی Anthropic مانند `claude-code-20250219`، `interleaved-thinking-2025-05-14` و نشانگرهای OAuth را سرکوب می‌کند تا پراکسی‌های سفارشی سازگار با Anthropic، پرچم‌های بتای پشتیبانی‌نشده را رد نکنند. اگر پراکسی شما به قابلیت‌های بتای خاصی نیاز دارد، `models.providers.<id>.headers["anthropic-beta"]` را صراحتا تنظیم کنید.

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
- [failover مدل](/fa/concepts/model-failover) - زنجیره‌های fallback و رفتار تلاش مجدد
- [مدل‌ها](/fa/concepts/models) - پیکربندی مدل و aliasها
- [ارائه‌دهندگان](/fa/providers) - راهنماهای راه‌اندازی برای هر ارائه‌دهنده
