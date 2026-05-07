---
read_when:
    - افزودن یا تغییر مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل تعمیر'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-07T13:19:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار ترمیم + مهاجرت برای OpenClaw است. این ابزار پیکربندی/وضعیت قدیمی را اصلاح می‌کند، سلامت را بررسی می‌کند، و مراحل ترمیم قابل‌اجرا ارائه می‌دهد.

## شروع سریع

```bash
openclaw doctor
```

### حالت‌های بدون رابط و خودکارسازی

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    پیش‌فرض‌ها را بدون نمایش پرسش بپذیر (شامل مراحل ترمیم راه‌اندازی مجدد/سرویس/sandbox در صورت کاربرد).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ترمیم‌های پیشنهادی را بدون نمایش پرسش اعمال کن (ترمیم‌ها + راه‌اندازی‌های مجدد در موارد ایمن).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ترمیم‌های تهاجمی را هم اعمال کن (پیکربندی‌های supervisor سفارشی را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    بدون پرسش اجرا کن و فقط مهاجرت‌های ایمن را اعمال کن (نرمال‌سازی پیکربندی + انتقال‌های وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/sandbox را که به تأیید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌صورت خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های Gateway اضافی اسکن کن (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید تغییرات را پیش از نوشتن بررسی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## چه کاری انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، رابط کاربری، و به‌روزرسانی‌ها">
    - به‌روزرسانی پیش از اجرا به‌صورت اختیاری برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل رابط کاربری (وقتی schema پروتکل جدیدتر باشد، Control UI را دوباره می‌سازد).
    - بررسی سلامت + پرسش برای راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/موجود نیست/مسدود) و وضعیت Plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - نرمال‌سازی پیکربندی برای مقدارهای قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای مسطح قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی Chrome extension و آمادگی Chrome MCP.
    - هشدارهای override ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌انداختن OAuth مربوط به Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OAuth در OpenAI Codex.
    - هشدارهای فهرست مجاز Plugin/ابزار وقتی `plugins.allow` محدودکننده است اما سیاست ابزار همچنان wildcard یا ابزارهای متعلق به Plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/احراز هویت WhatsApp).
    - مهاجرت کلیدهای قدیمی قرارداد manifest مربوط به Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت store قدیمی Cron (`jobId`, `schedule.cron`, فیلدهای سطح بالای delivery/payload، payload `provider`، کارهای fallback ساده Webhook با `notify: true`).
    - مهاجرت قدیمی سیاست runtime عامل به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی کهنه Plugin وقتی Pluginها فعال باشند؛ وقتی `plugins.enabled=false`، ارجاع‌های کهنه Plugin به‌عنوان پیکربندی containment غیرفعال در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل قفل session و پاک‌سازی قفل‌های کهنه.
    - ترمیم transcriptهای session برای شاخه‌های تکراری prompt-rewrite که توسط buildهای متأثر 2026.4.24 ایجاد شده‌اند.
    - شناسایی tombstoneهای بازیابی از راه‌اندازی مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌سازی فلگ‌های کهنه بازیابی aborted تا هنگام startup همچنان child را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (sessions، transcripts، state dir).
    - بررسی مجوزهای فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای نزدیک به انقضا را تازه کند، و وضعیت‌های cooldown/disabled مربوط به auth-profile را گزارش می‌دهد.
    - شناسایی دایرکتوری workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و supervisorها">
    - ترمیم image مربوط به sandbox وقتی sandboxing فعال باشد.
    - مهاجرت سرویس قدیمی و شناسایی Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime مربوط به Gateway (سرویس نصب شده اما اجرا نمی‌شود؛ برچسب launchd کش‌شده).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا probe می‌شود).
    - بررسی‌های مجوز مخصوص کانال زیر `openclaw channels capabilities` قرار دارند؛ برای مثال، مجوزهای کانال voice در Discord با `openclaw channels capabilities --channel discord --target channel:<channel-id>` audit می‌شوند.
    - بررسی‌های پاسخ‌گویی WhatsApp برای سلامت تنزل‌یافته event-loop در Gateway در حالی که clientهای TUI محلی هنوز اجرا می‌شوند؛ `--fix` فقط clientهای TUI محلی تأییدشده را متوقف می‌کند.
    - ترمیم route مربوط به Codex برای model refهای قدیمی `openai-codex/*` در مدل‌های اصلی، fallbackها، overrideهای heartbeat/subagent/compaction، hookها، overrideهای مدل کانال، و pinهای route در session؛ `--fix` آنها را به `openai/*` بازنویسی می‌کند و فقط وقتی Plugin مربوط به Codex نصب و فعال باشد، harness با نام `codex` را فراهم کند، و OAuth قابل استفاده داشته باشد، `agentRuntime.id: "codex"` را انتخاب می‌کند. در غیر این صورت `agentRuntime.id: "pi"` را انتخاب می‌کند.
    - audit پیکربندی supervisor (launchd/systemd/schtasks) با ترمیم اختیاری.
    - پاک‌سازی محیط embedded proxy برای سرویس‌های Gateway که هنگام نصب یا به‌روزرسانی مقدارهای shell مربوط به `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را ثبت کرده‌اند.
    - بررسی‌های بهترین‌روش runtime مربوط به Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی برخورد port در Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="احراز هویت، امنیت، و pair کردن">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی هیچ منبع token وجود ندارد، ایجاد token را پیشنهاد می‌دهد؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - شناسایی مشکل pair کردن دستگاه (درخواست‌های pending برای pair نخستین بار، ارتقاهای pending نقش/scope، drift کش token دستگاه محلی کهنه، و drift احراز هویت paired-record).

  </Accordion>
  <Accordion title="Workspace و shell">
    - بررسی systemd linger روی Linux.
    - بررسی اندازه فایل bootstrap در workspace (هشدارهای کوتاه‌سازی/نزدیک به محدودیت برای فایل‌های context).
    - بررسی آمادگی Skills برای عامل پیش‌فرض؛ skills مجاز با نیازمندی‌های bin، env، config، یا OS مفقود را گزارش می‌دهد، و `--fix` می‌تواند skills در دسترس نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت shell completion و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding برای جست‌وجوی memory (مدل محلی، API key از راه دور، یا binary مربوط به QMD).
    - بررسی‌های نصب از source (ناسازگاری pnpm workspace، assetهای UI مفقود، binary مربوط به tsx مفقود).
    - پیکربندی به‌روز شده + metadata مربوط به wizard را می‌نویسد.

  </Accordion>
</AccordionGroup>

## Backfill و reset در رابط Dreams

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset**، و **Clear Grounded** برای workflow مربوط به dreaming grounded است. این اقدام‌ها از روش‌های RPC به سبک Gateway doctor استفاده می‌کنند، اما بخشی از ترمیم/مهاجرت CLI در `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر diary مربوط به REM grounded را اجرا می‌کند، و entryهای backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان entryهای علامت‌گذاری‌شده diary مربوط به backfill را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط entryهای کوتاه‌مدت staged و فقط-grounded را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه انباشته نکرده‌اند.

کاری که به‌تنهایی انجام **نمی‌دهند**:

- آنها `MEMORY.md` را ویرایش نمی‌کنند
- آنها مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- آنها candidateهای grounded را به‌صورت خودکار وارد store زنده promotion کوتاه‌مدت نمی‌کنند، مگر اینکه ابتدا مسیر CLI مربوط به staged را صراحتاً اجرا کنید

اگر می‌خواهید replay تاریخی grounded روی lane عادی promotion عمیق اثر بگذارد، به‌جای آن از flow مربوط به CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار candidateهای durable و grounded را وارد store کوتاه‌مدت Dreaming می‌کند و در عین حال `DREAMS.md` را به‌عنوان سطح review نگه می‌دارد.

## رفتار دقیق و دلیل طراحی

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. نرمال‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override مخصوص کانال)، doctor آنها را به schema فعلی نرمال‌سازی می‌کند.

    این شامل فیلدهای مسطح قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی speech در Talk برابر است با `talk.provider` + `talk.providers.<provider>`، و پیکربندی صدای بی‌درنگ برابر است با `talk.realtime.*`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را به map ارائه‌دهنده بازنویسی می‌کند، و selectorهای قدیمی بی‌درنگ در سطح بالا (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) را به `talk.realtime` بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` خالی نباشد و سیاست ابزار از entryهای
    wildcard یا ابزارهای متعلق به Plugin استفاده کند هشدار می‌دهد. `tools.allow: ["*"]` فقط ابزارهایی را match می‌کند
    که از Pluginهایی می‌آیند که واقعاً load می‌شوند؛ این exclusive plugin
    allowlist را دور نمی‌زند. Doctor برای پیکربندی‌های allowlist قدیمی مهاجرت‌شده
    `plugins.bundledDiscovery: "compat"` را می‌نویسد تا رفتار فعلی ارائه‌دهنده bundled حفظ شود، و
    سپس به تنظیم سخت‌گیرانه‌تر `"allowlist"` اشاره می‌کند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با schema به‌روز شده بازنویسی می‌کند.

    startup مربوط به Gateway قالب‌های پیکربندی قدیمی را رد می‌کند و از شما می‌خواهد `openclaw doctor --fix` را اجرا کنید؛ هنگام startup، `openclaw.json` را بازنویسی نمی‌کند. مهاجرت‌های store مربوط به jobهای Cron نیز توسط `openclaw doctor --fix` انجام می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - پیکربندی‌های کانال پیکربندی‌شده که سیاست پاسخ قابل مشاهده ندارند → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` در سطح بالا
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` قدیمی → `talk.provider` + `talk.providers.<provider>`
    - گزینشگرهای realtime Talk قدیمی در سطح بالا (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` و `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` و `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` و `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` و `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - برای کانال‌هایی که `accounts` نام‌دار دارند اما هنوز مقادیر کانال تک‌حسابی در سطح بالای کانال باقی مانده است، آن مقادیر محدود به حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک مقصد نام‌دار/پیش‌فرض مطابق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای timeoutهای کند provider/model از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم قدیمی relay افزونه)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی Gateway همچنین به‌جای خطای بسته، providerهایی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده باشد نادیده می‌گیرد)

    هشدارهای Doctor همچنین شامل راهنمای حساب پیش‌فرض برای کانال‌های چندحسابی است:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، Doctor هشدار می‌دهد که مسیریابی fallback می‌تواند حسابی غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی شناسه حساب ناشناخته‌ای تنظیم شده باشد، Doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    اگر `models.providers.opencode`،‏ `opencode-zen` یا `opencode-go` را به‌صورت دستی افزوده باشید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این کار می‌تواند مدل‌ها را به API اشتباه مجبور کند یا هزینه‌ها را صفر کند. Doctor هشدار می‌دهد تا بتوانید override را حذف کنید و مسیریابی API و هزینه‌های هر مدل را برگردانید.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    اگر پیکربندی مرورگر شما هنوز به مسیر حذف‌شده افزونه Chrome اشاره می‌کند، Doctor آن را به مدل اتصال Chrome MCP فعلی روی میزبان محلی عادی‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    Doctor همچنین مسیر Chrome MCP میزبان محلی را هنگام استفاده از `defaultProfile: "user"` یا یک پروفایل `existing-session` پیکربندی‌شده بررسی می‌کند:

    - بررسی می‌کند که آیا Google Chrome برای پروفایل‌های اتصال خودکار پیش‌فرض روی همان میزبان نصب شده است
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که remote debugging را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`،‏ `brave://inspect/#remote-debugging` یا `edge://inspect/#remote-debugging`)

    Doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP میزبان محلی همچنان نیاز دارد به:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان gateway/node
    - مرورگری که به‌صورت محلی در حال اجرا باشد
    - remote debugging فعال در همان مرورگر
    - تأیید نخستین درخواست consent اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. Existing-session محدودیت‌های مسیر فعلی Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته‌ای مانند `responsebody`، خروجی PDF، رهگیری دانلود و کنش‌های دسته‌ای همچنان به مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser یا جریان‌های headless دیگر اعمال **نمی‌شود**. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، Doctor endpoint مجوزدهی OpenAI را کاوش می‌کند تا تأیید کند که پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر کاوش با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده یا گواهی self-signed)، Doctor راهنمای رفع مشکل مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولاً `brew postinstall ca-certificates` است. با `--deep`، کاوش حتی اگر Gateway سالم باشد هم اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    اگر قبلاً تنظیمات transport قدیمی OpenAI را زیر `models.providers.openai-codex` افزوده باشید، می‌توانند مسیر داخلی provider مربوط به Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند تحت‌الشعاع قرار دهند. Doctor وقتی آن تنظیمات transport قدیمی را کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید override کهنه transport را حذف یا بازنویسی کنید و رفتار داخلی مسیریابی/fallback را برگردانید. proxyهای سفارشی و overrideهای فقط header همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor وجود ارجاع‌های مدل قدیمی `openai-codex/*` را بررسی می‌کند. مسیریابی بومی harness مربوط به Codex از ارجاع‌های مدل canonical `openai/*` استفاده می‌کند؛ نوبت‌های agent مربوط به OpenAI به‌جای مسیر OpenClaw PI OpenAI از طریق harness app-server مربوط به Codex عبور می‌کنند.

    در حالت `--fix` / `--repair`، Doctor ارجاع‌های agent پیش‌فرض و هر agent را بازنویسی می‌کند، از جمله مدل‌های اصلی، fallbackها، overrideهای heartbeat/subagent/compaction، hookها، overrideهای مدل کانال، و وضعیت مسیر session ذخیره‌شده کهنه:

    - `openai-codex/gpt-*` به `openai/gpt-*` تبدیل می‌شود.
    - runtime مربوط به agent منطبق فقط وقتی به `agentRuntime.id: "codex"` تبدیل می‌شود که Codex نصب و فعال باشد، harness مربوط به `codex` را ارائه کند، و OAuth قابل استفاده داشته باشد.
    - در غیر این صورت runtime مربوط به agent منطبق به `agentRuntime.id: "pi"` تبدیل می‌شود.
    - فهرست‌های fallback مدل موجود با بازنویسی ورودی‌های قدیمی‌شان حفظ می‌شوند؛ تنظیمات کپی‌شده هر مدل از کلید قدیمی به کلید canonical `openai/*` منتقل می‌شوند.
    - `modelProvider`/`providerOverride`،‏ `model`/`modelOverride`، اعلان‌های fallback، pinهای auth-profile، و pinهای harness مربوط به Codex در sessionهای ذخیره‌شده در همه storeهای session مربوط به agent کشف‌شده تعمیر می‌شوند.
    - `/codex ...` یعنی «کنترل یا bind کردن یک گفت‌وگوی بومی Codex از چت.»
    - `/acp ...` یا `runtime: "acp"` یعنی «استفاده از adapter خارجی ACP/acpx.»

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor همچنین storeهای session کشف‌شده مربوط به agent را برای وضعیت مسیر خودکار ساخته‌شده و کهنه، پس از اینکه مدل‌های پیکربندی‌شده یا runtime را از مسیری متعلق به Plugin مانند Codex منتقل می‌کنید، اسکن می‌کند.

    `openclaw doctor --fix` می‌تواند وضعیت کهنه خودکار ساخته‌شده را پاک کند، مانند pinهای مدل `modelOverrideSource: "auto"`، فراداده مدل runtime، شناسه‌های harness pin‌شده، bindingهای session مربوط به CLI، و overrideهای خودکار auth-profile وقتی مسیر مالک آن‌ها دیگر پیکربندی نشده است. انتخاب‌های صریح کاربر یا مدل session قدیمی برای بازبینی دستی گزارش می‌شوند و دست‌نخورده می‌مانند؛ وقتی آن مسیر دیگر مدنظر نیست، آن‌ها را با `/model ...`،‏ `/new` تغییر دهید یا session را reset کنید.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor می‌تواند layoutهای قدیمی‌تر روی دیسک را به ساختار فعلی migrate کند:

    - store مربوط به sessionها + transcriptها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری agent:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این migrationها best-effort و idempotent هستند؛ وقتی Doctor هر پوشه قدیمی را به‌عنوان backup باقی بگذارد، هشدار منتشر می‌کند. Gateway/CLI همچنین sessionهای قدیمی + دایرکتوری agent را هنگام راه‌اندازی به‌صورت خودکار migrate می‌کند تا history/auth/models بدون اجرای دستی Doctor در مسیر هر agent قرار گیرند. احراز هویت WhatsApp عمداً فقط از طریق `openclaw doctor` migrate می‌شود. عادی‌سازی provider/provider-map مربوط به Talk اکنون بر اساس برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌هایی که فقط مربوط به ترتیب کلیدها هستند دیگر باعث تغییرات تکراری no-op با `doctor --fix` نمی‌شوند.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor همه manifestهای Plugin نصب‌شده را برای کلیدهای capability قدیمی در سطح بالا (`speechProviders`،‏ `realtimeTranscriptionProviders`،‏ `realtimeVoiceProviders`،‏ `mediaUnderstandingProviders`،‏ `imageGenerationProviders`،‏ `videoGenerationProviders`،‏ `webFetchProviders`،‏ `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌کند آن‌ها را به شیء `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این migration idempotent است؛ اگر کلید `contracts` از قبل همان مقادیر را داشته باشد، کلید قدیمی بدون تکثیر داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor همچنین store مربوط به jobهای cron را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی override شده باشد) برای shapeهای قدیمی job بررسی می‌کند که scheduler همچنان برای سازگاری می‌پذیرد.

    پاک‌سازی‌های فعلی cron شامل موارد زیر است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload در سطح بالا (`message`،‏ `model`،‏ `thinking`، ...) → `payload`
    - فیلدهای delivery در سطح بالا (`deliver`،‏ `channel`،‏ `to`،‏ `provider`، ...) → `delivery`
    - aliasهای delivery مربوط به `provider` در payload → `delivery.channel` صریح
    - jobهای fallback ساده webhook قدیمی با `notify: true` → `delivery.mode="webhook"` صریح همراه با `delivery.to=cron.webhook`

    Doctor فقط زمانی کارهای `notify: true` را به‌صورت خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر کاری fallback اعلان قدیمی را با یک حالت تحویل غیر Webhook موجود ترکیب کند، doctor هشدار می‌دهد و آن کار را برای بازبینی دستی باقی می‌گذارد.

    در Linux، doctor همچنین زمانی هشدار می‌دهد که crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را فراخوانی می‌کند. آن اسکریپت محلی میزبان توسط OpenClaw فعلی نگه‌داری نمی‌شود و وقتی cron نتواند به گذرگاه کاربر systemd دسترسی پیدا کند، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی قدیمی crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor` و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    Doctor همهٔ دایرکتوری‌های نشست عامل را برای فایل‌های write-lock کهنه بررسی می‌کند — فایل‌هایی که وقتی یک نشست به‌صورت غیرعادی خارج شده باقی مانده‌اند. برای هر فایل قفل پیدا‌شده، این موارد را گزارش می‌کند: مسیر، PID، اینکه PID هنوز زنده است یا نه، سن قفل، و اینکه کهنه محسوب می‌شود یا نه (PID مرده یا قدیمی‌تر از ۳۰ دقیقه). در حالت `--fix` / `--repair` فایل‌های قفل کهنه را به‌صورت خودکار حذف می‌کند؛ در غیر این صورت یک یادداشت چاپ می‌کند و به شما می‌گوید دوباره با `--fix` اجرا کنید.
  </Accordion>
  <Accordion title="3d. ترمیم شاخهٔ رونوشت نشست">
    Doctor فایل‌های JSONL نشست عامل را برای شکل شاخهٔ تکراری ایجادشده توسط باگ بازنویسی رونوشت prompt در 2026.4.24 بررسی می‌کند: یک نوبت کاربر رهاشده با زمینهٔ runtime داخلی OpenClaw به‌همراه یک هم‌ردهٔ فعال که همان prompt قابل مشاهدهٔ کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل تحت‌تأثیر کنار فایل اصلی نسخهٔ پشتیبان می‌گیرد و رونوشت را به شاخهٔ فعال بازنویسی می‌کند تا تاریخچهٔ Gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (پایداری نشست، مسیریابی، و ایمنی)">
    دایرکتوری وضعیت، ساقهٔ مغز عملیاتی است. اگر ناپدید شود، نشست‌ها، اعتبارنامه‌ها، لاگ‌ها و پیکربندی را از دست می‌دهید (مگر اینکه جای دیگری نسخهٔ پشتیبان داشته باشید).

    Doctor بررسی می‌کند:

    - **دایرکتوری وضعیت وجود ندارد**: دربارهٔ از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای بازآفرینی دایرکتوری درخواست تأیید می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: قابلیت نوشتن را تأیید می‌کند؛ پیشنهاد ترمیم مجوزها را می‌دهد (و وقتی ناسازگاری مالک/گروه تشخیص داده شود یک راهنمایی `chown` منتشر می‌کند).
    - **دایرکتوری وضعیت همگام‌شده با ابر در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای پشتیبانی‌شده با همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت SD یا eMMC در Linux**: وقتی وضعیت به یک منبع mount از نوع `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی مبتنی بر SD یا eMMC می‌تواند در نوشتن نشست و اعتبارنامه کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های نشست وجود ندارند**: `sessions/` و دایرکتوری ذخیره‌گاه نشست برای پایدارسازی تاریخچه و جلوگیری از کرش‌های `ENOENT` لازم هستند.
    - **ناسازگاری رونوشت**: وقتی ورودی‌های نشست اخیر فایل‌های رونوشت گم‌شده داشته باشند هشدار می‌دهد.
    - **نشست اصلی «JSONL تک‌خطی»**: وقتی رونوشت اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه در حال انباشته شدن نیست).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشهٔ `~/.openclaw` در دایرکتوری‌های خانه وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآوری حالت دوردست**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند آن را روی میزبان دوردست اجرا کنید (وضعیت آنجا زندگی می‌کند).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/جهان قابل خواندن باشد هشدار می‌دهد و پیشنهاد سخت‌گیرتر کردن به `600` را می‌دهد.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در ذخیره‌گاه احراز هویت بررسی می‌کند، وقتی tokenها در حال انقضا/منقضی‌شده باشند هشدار می‌دهد، و وقتی امن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل OAuth/token مربوط به Anthropic کهنه باشد، یک کلید API برای Anthropic یا مسیر setup-token مربوط به Anthropic را پیشنهاد می‌کند. Promptهای refresh فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی یک refresh مربوط به OAuth به‌صورت دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا اینکه provider به شما بگوید دوباره وارد شوید)، doctor گزارش می‌کند که احراز هویت مجدد لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های احراز هویتی را گزارش می‌کند که به این دلایل به‌صورت موقت قابل استفاده نیستند:

    - cooldownهای کوتاه (محدودیت نرخ/timeoutها/شکست‌های احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های صورتحساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor ارجاع مدل را با catalog و allowlist اعتبارسنجی می‌کند و وقتی resolve نشود یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. ترمیم تصویر sandbox">
    وقتی sandboxing فعال باشد، doctor تصویرهای Docker را بررسی می‌کند و اگر تصویر فعلی وجود نداشته باشد پیشنهاد build یا تغییر به نام‌های قدیمی را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    Doctor وضعیت staging وابستگی Plugin قدیمی تولیدشده توسط OpenClaw را در حالت `openclaw doctor --fix` / `openclaw doctor --repair` حذف می‌کند. این شامل ریشه‌های وابستگی تولیدشدهٔ کهنه، دایرکتوری‌های install-stage قدیمی، زباله‌های محلی package از کد ترمیم وابستگی bundled-plugin قبلی، و نسخه‌های npm مدیریت‌شدهٔ یتیم یا بازیابی‌شده از Pluginهای بسته‌بندی‌شدهٔ `@openclaw/*` است که می‌توانند manifest بسته‌بندی‌شدهٔ فعلی را تحت‌الشعاع قرار دهند.

    Doctor همچنین می‌تواند Pluginهای قابل دانلودِ گم‌شده را وقتی پیکربندی به آن‌ها ارجاع می‌دهد اما registry محلی Plugin نمی‌تواند آن‌ها را پیدا کند، دوباره نصب کند. مثال‌ها شامل `plugins.entries` مادی، تنظیمات پیکربندی‌شدهٔ channel/provider/search، و runtimeهای عامل پیکربندی‌شده هستند. در زمان به‌روزرسانی packageها، doctor از اجرای ترمیم Plugin توسط package-manager در حالی که package اصلی در حال تعویض است خودداری می‌کند؛ اگر پس از به‌روزرسانی یک Plugin پیکربندی‌شده هنوز به بازیابی نیاز دارد، دوباره `openclaw doctor --fix` را اجرا کنید. راه‌اندازی Gateway و بارگذاری دوبارهٔ پیکربندی package managerها را اجرا نمی‌کنند؛ نصب‌های Plugin همچنان کار صریح doctor/install/update باقی می‌مانند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنمایی‌های پاک‌سازی">
    Doctor سرویس‌های Gateway قدیمی (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد حذف آن‌ها و نصب سرویس OpenClaw با استفاده از پورت فعلی Gateway را می‌دهد. همچنین می‌تواند برای سرویس‌های اضافهٔ شبیه Gateway اسکن کند و راهنمایی‌های پاک‌سازی چاپ کند. سرویس‌های Gateway OpenClaw با نام پروفایل، درجه‌یک محسوب می‌شوند و به‌عنوان «اضافی» علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس Gateway سطح کاربر وجود نداشته باشد اما یک سرویس Gateway سطح سیستم OpenClaw وجود داشته باشد، doctor به‌صورت خودکار سرویس سطح کاربر دومی نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس نسخهٔ تکراری را حذف کنید یا وقتی یک supervisor سیستمی مالک lifecycle مربوط به Gateway است `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Startup Matrix">
    وقتی یک حساب channel مربوط به Matrix مهاجرت وضعیت قدیمی در انتظار یا قابل اقدام داشته باشد، doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس گام‌های مهاجرت best-effort را اجرا می‌کند: مهاجرت وضعیت قدیمی Matrix و آماده‌سازی وضعیت رمزگذاری‌شدهٔ قدیمی. هر دو گام غیرکشنده هستند؛ خطاها log می‌شوند و راه‌اندازی ادامه می‌یابد. در حالت فقط‌خواندنی (`openclaw doctor` بدون `--fix`) این بررسی به‌طور کامل رد می‌شود.
  </Accordion>
  <Accordion title="8c. Pairing دستگاه و drift احراز هویت">
    Doctor اکنون وضعیت device-pairing را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌کند:

    - درخواست‌های pairing بار اول در انتظار
    - ارتقاهای نقش در انتظار برای دستگاه‌هایی که از قبل paired شده‌اند
    - ارتقاهای scope در انتظار برای دستگاه‌هایی که از قبل paired شده‌اند
    - ترمیم‌های ناسازگاری کلید عمومی که در آن شناسهٔ دستگاه هنوز match است اما هویت دستگاه دیگر با رکورد تأییدشده match نیست
    - رکوردهای paired که token فعال برای یک نقش تأییدشده ندارند
    - tokenهای paired که scopeهایشان از baseline تأییدشدهٔ pairing خارج شده است
    - ورودی‌های device-token cacheشدهٔ محلی برای ماشین فعلی که قدیمی‌تر از چرخش token سمت Gateway هستند یا metadata scope کهنه دارند

    Doctor درخواست‌های pair را خودکار تأیید نمی‌کند و tokenهای دستگاه را خودکار rotate نمی‌کند. در عوض گام‌های بعدی دقیق را چاپ می‌کند:

    - درخواست‌های در انتظار را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک token تازه را با `openclaw devices rotate --device <deviceId> --role <role>` rotate کنید
    - یک رکورد کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این حفرهٔ رایج «از قبل paired شده اما هنوز pairing required می‌گیرد» را می‌بندد: doctor اکنون pairing بار اول را از ارتقاهای نقش/scope در انتظار و از drift کهنهٔ token/هویت دستگاه تفکیک می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک provider بدون allowlist به DMها باز باشد، یا وقتی یک policy به‌شکلی خطرناک پیکربندی شده باشد، هشدار منتشر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، doctor مطمئن می‌شود lingering فعال است تا Gateway پس از خروج از سیستم زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (Skills، Pluginها، و دایرکتوری‌های قدیمی)">
    Doctor خلاصه‌ای از وضعیت workspace را برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: skills واجد شرایط، دارای requirementهای گم‌شده، و مسدودشده توسط allowlist را می‌شمارد.
    - **دایرکتوری‌های workspace قدیمی**: وقتی `~/openclaw` یا دایرکتوری‌های workspace قدیمی دیگر کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای فعال/غیرفعال/دارای خطا را می‌شمارد؛ شناسه‌های Plugin را برای هر خطا فهرست می‌کند؛ قابلیت‌های Plugin بسته را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را که با runtime فعلی مشکل سازگاری دارند علامت‌گذاری می‌کند.
    - **عیب‌یابی Plugin**: هر هشدار یا خطای زمان بارگذاری را که registry مربوط به Plugin منتشر کرده باشد آشکار می‌کند.

  </Accordion>
  <Accordion title="11b. اندازهٔ فایل bootstrap">
    Doctor بررسی می‌کند آیا فایل‌های bootstrap مربوط به workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا فایل‌های زمینهٔ تزریق‌شدهٔ دیگر) نزدیک یا فراتر از بودجهٔ کاراکتری پیکربندی‌شده هستند یا نه. برای هر فایل شمارش کاراکتر خام در برابر تزریق‌شده، درصد کوتاه‌سازی، علت کوتاه‌سازی (`max/file` یا `max/total`)، و کل کاراکترهای تزریق‌شده به‌عنوان کسری از بودجهٔ کل را گزارش می‌کند. وقتی فایل‌ها کوتاه‌سازی شده باشند یا نزدیک حد باشند، doctor نکاتی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin channel کهنه">
    وقتی `openclaw doctor --fix` یک Plugin channel گم‌شده را حذف می‌کند، پیکربندی dangling با scope همان channel را که به آن Plugin ارجاع می‌داد نیز حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های Heartbeat که نام channel را برده بودند، و overrideهای `agents.*.models["<channel>/*"]`. این کار از حلقه‌های boot مربوط به Gateway جلوگیری می‌کند که در آن runtime مربوط به channel از بین رفته اما پیکربندی هنوز از Gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند آیا tab completion برای shell فعلی (zsh، bash، fish، یا PowerShell) نصب شده است یا نه:

    - اگر پروفایل shell از یک الگوی تکمیل پویا و کند استفاده کند (`source <(openclaw completion ...)`)، doctor آن را به گونهٔ سریع‌تر مبتنی بر فایل cache ارتقا می‌دهد.
    - اگر completion در پروفایل پیکربندی شده باشد اما فایل cache وجود نداشته باشد، doctor cache را به‌صورت خودکار بازتولید می‌کند.
    - اگر اصلاً completion پیکربندی نشده باشد، doctor درخواست نصب آن را مطرح می‌کند (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای بازتولید دستی cache، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (token محلی)">
    Doctor آمادگی احراز هویت token محلی Gateway را بررسی می‌کند.

    - اگر حالت token به token نیاز داشته باشد و هیچ منبع token وجود نداشته باشد، doctor پیشنهاد تولید یکی را می‌دهد.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما در دسترس نباشد، doctor هشدار می‌دهد و آن را با plaintext بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی هیچ token SecretRef پیکربندی نشده باشد تولید را اجباری می‌کند.

  </Accordion>
  <Accordion title="12b. تعمیرهای فقط‌خواندنیِ آگاه از SecretRef">
    برخی جریان‌های تعمیر باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار fail-fast زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` اکنون برای تعمیرهای هدفمند پیکربندی از همان مدل خلاصه‌ی فقط‌خواندنی SecretRef استفاده می‌کند که فرمان‌های خانواده‌ی status استفاده می‌کنند.
    - مثال: تعمیر `allowFrom` / `groupAllowFrom` `@username` در Telegram تلاش می‌کند در صورت موجود بودن، از اعتبارنامه‌های بات پیکربندی‌شده استفاده کند.
    - اگر توکن بات Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، doctor گزارش می‌دهد که اعتبارنامه پیکربندی‌شده اما ناموجود است و به‌جای خراب شدن یا گزارش اشتباهِ نبودن توکن، حل خودکار را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی دوباره">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی دوباره‌ی آن را می‌دهد.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند که آیا ارائه‌دهنده‌ی embedding جست‌وجوی حافظه‌ی پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و ارائه‌دهنده‌ی پیکربندی‌شده بستگی دارد:

    - **backend QMD**: بررسی می‌کند که آیا باینری `qmd` موجود و قابل راه‌اندازی است یا نه. اگر نباشد، راهنمای رفع شامل بسته‌ی npm و گزینه‌ی مسیر دستی باینری را چاپ می‌کند.
    - **ارائه‌دهنده‌ی محلی صریح**: وجود فایل مدل محلی یا URL مدل راه‌دور/قابل‌دانلودِ شناخته‌شده را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌کند به ارائه‌دهنده‌ی راه‌دور تغییر دهید.
    - **ارائه‌دهنده‌ی راه‌دور صریح** (`openai`، `voyage` و غیره): تأیید می‌کند که کلید API در محیط یا مخزن احراز هویت وجود دارد. اگر نباشد، نکته‌های قابل‌اقدام برای رفع را چاپ می‌کند.
    - **ارائه‌دهنده‌ی خودکار**: ابتدا موجود بودن مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهنده‌ی راه‌دور را به ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی نتیجه‌ی probe کش‌شده‌ی Gateway موجود باشد (Gateway هنگام بررسی سالم بوده است)، doctor نتیجه‌ی آن را با پیکربندی قابل‌مشاهده برای CLI تطبیق می‌دهد و هر ناهمخوانی را یادآوری می‌کند. Doctor در مسیر پیش‌فرض ping embedding تازه‌ای را شروع نمی‌کند؛ وقتی بررسی زنده‌ی ارائه‌دهنده می‌خواهید، از فرمان وضعیت عمیق حافظه استفاده کنید.

    برای تأیید آمادگی embedding در زمان اجرا از `openclaw memory status --deep` استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. ممیزی + تعمیر پیکربندی supervisor">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های ازقلم‌افتاده یا قدیمی بررسی می‌کند (برای مثال وابستگی‌های systemd به network-online و تأخیر راه‌اندازی دوباره). وقتی ناهمخوانی پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل service/task را با پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` promptهای تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های توصیه‌شده را بدون prompt اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor را برای چرخه‌ی عمر service مربوط به Gateway در حالت فقط‌خواندنی نگه می‌دارد. همچنان سلامت service را گزارش می‌دهد و تعمیرهای غیر-service را اجرا می‌کند، اما install/start/restart/bootstrap برای service، بازنویسی‌های پیکربندی supervisor و پاک‌سازی service قدیمی را رد می‌کند، چون یک supervisor خارجی مالک آن چرخه‌ی عمر است.
    - در Linux، doctor هنگام فعال بودن unit مطابق systemd مربوط به Gateway، metadata فرمان/entrypoint را بازنویسی نمی‌کند. همچنین هنگام scan برای duplicate-service، unitهای اضافی غیرفعال و غیرقدیمیِ شبیه Gateway را نادیده می‌گیرد تا فایل‌های service همراه، نویز پاک‌سازی ایجاد نکنند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، install/repair مربوط به service در doctor، SecretRef را اعتبارسنجی می‌کند اما مقدارهای توکن متن ساده‌ی حل‌شده را در metadata محیط service مربوط به supervisor ذخیره نمی‌کند.
    - Doctor مقدارهای محیط service مدیریت‌شده‌ی مبتنی بر `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd یا Windows Scheduled Task به‌صورت inline جاسازی کرده بودند شناسایی می‌کند و metadata service را بازنویسی می‌کند تا آن مقدارها به‌جای تعریف supervisor، از منبع زمان اجرا بارگذاری شوند.
    - Doctor تشخیص می‌دهد چه زمانی فرمان service پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را ثابت نگه داشته است و metadata service را به پورت فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، doctor مسیر install/repair را با راهنمای قابل‌اقدام مسدود می‌کند.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor تا زمانی که mode صریحاً تنظیم شود، install/repair را مسدود می‌کند.
    - برای unitهای user-systemd در Linux، بررسی‌های drift توکن در doctor اکنون هنگام مقایسه‌ی metadata احراز هویت service، هم منبع‌های `Environment=` و هم `EnvironmentFile=` را شامل می‌شود.
    - تعمیرهای service در Doctor از بازنویسی، توقف یا راه‌اندازی دوباره‌ی یک service مربوط به Gateway از باینری قدیمی‌تر OpenClaw خودداری می‌کنند، وقتی پیکربندی آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="16. تشخیص‌های زمان اجرای Gateway + پورت">
    Doctor زمان اجرای service را بررسی می‌کند (PID، آخرین وضعیت خروج) و وقتی service نصب شده اما واقعاً در حال اجرا نیست، هشدار می‌دهد. همچنین collision پورت روی پورت Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل را گزارش می‌دهد (Gateway از قبل در حال اجراست، تونل SSH).
  </Accordion>
  <Accordion title="17. بهترین روش‌های زمان اجرای Gateway">
    Doctor وقتی service مربوط به Gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای version-manager ممکن است پس از upgradeها خراب شوند، چون service مقداردهی اولیه‌ی shell شما را بارگذاری نمی‌کند. Doctor در صورت موجود بودن نصب Node سیستمی (Homebrew/apt/choco)، پیشنهاد مهاجرت به آن را می‌دهد.

    LaunchAgentهای macOS که تازه نصب یا تعمیر می‌شوند، به‌جای کپی کردن PATH پوسته‌ی تعاملی، از یک PATH سیستمی canonical (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین Volta، asdf، fnm، pnpm و دیگر دایرکتوری‌های version-manager تعیین نمی‌کنند که فرایندهای فرزند Node به کدام مسیر resolve شوند. serviceهای Linux همچنان ریشه‌های محیط صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های پایدار user-bin را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌شده‌ی version-manager فقط زمانی در PATH مربوط به service نوشته می‌شوند که آن دایرکتوری‌ها روی دیسک وجود داشته باشند.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + metadata جادوگر">
    Doctor هر تغییر پیکربندی را پایدار می‌کند و metadata جادوگر را مهر می‌زند تا اجرای doctor ثبت شود.
  </Accordion>
  <Accordion title="19. نکته‌های workspace (پشتیبان‌گیری + سیستم حافظه)">
    Doctor وقتی سیستم حافظه‌ی workspace وجود نداشته باشد آن را پیشنهاد می‌کند و اگر workspace از قبل زیر git نباشد، یک نکته‌ی پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و پشتیبان‌گیری git (GitHub یا GitLab خصوصیِ توصیه‌شده)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
