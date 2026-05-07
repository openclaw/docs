---
read_when:
    - افزودن یا تغییر مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل ترمیم'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-07T01:53:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. این ابزار پیکربندی/وضعیت قدیمی را اصلاح می‌کند، سلامت را بررسی می‌کند و گام‌های تعمیر قابل‌اقدام ارائه می‌دهد.

## شروع سریع

```bash
openclaw doctor
```

### حالت‌های بدون‌واسطه و خودکارسازی

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    پیش‌فرض‌ها را بدون نمایش درخواست تأیید بپذیرید (از جمله گام‌های تعمیر راه‌اندازی مجدد/سرویس/sandbox در صورت کاربرد).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تعمیرهای پیشنهادی را بدون نمایش درخواست تأیید اعمال کنید (تعمیرها + راه‌اندازی‌های مجدد در موارد امن).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    تعمیرهای تهاجمی را هم اعمال کنید (پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    بدون درخواست تأیید اجرا شود و فقط مهاجرت‌های امن اعمال شوند (نرمال‌سازی پیکربندی + جابه‌جایی وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/sandbox را که نیازمند تأیید انسانی هستند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن کنید (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید پیش از نوشتن تغییرات را بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## چه کاری انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل UI (وقتی طرح‌واره پروتکل جدیدتر باشد، Control UI را دوباره می‌سازد).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجدشرایط/مفقود/مسدود) و وضعیت Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - نرمال‌سازی پیکربندی برای مقادیر قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای بازنویسی ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌اندازی OAuth در Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OpenAI Codex OAuth.
    - هشدارهای فهرست مجاز Plugin/ابزار وقتی `plugins.allow` محدودکننده است اما سیاست ابزار همچنان wildcard یا ابزارهای متعلق به Plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (نشست‌ها/دایرکتوری عامل/احراز هویت WhatsApp).
    - مهاجرت کلید قرارداد manifest قدیمی Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت ذخیره‌گاه Cron قدیمی (`jobId`, `schedule.cron`, فیلدهای سطح‌بالای delivery/payload، payload `provider`، کارهای fallback ساده Webhook با `notify: true`).
    - مهاجرت runtime-policy قدیمی عامل به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی قدیمی Plugin وقتی Pluginها فعال هستند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های قدیمی Plugin به‌عنوان پیکربندی مهار بی‌اثر در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="State and integrity">
    - بازرسی فایل قفل نشست و پاک‌سازی قفل‌های قدیمی.
    - تعمیر رونوشت نشست برای شاخه‌های تکراری بازنویسی prompt که توسط بیلدهای آسیب‌دیده 2026.4.24 ایجاد شده‌اند.
    - شناسایی tombstone بازیابی راه‌اندازی مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌سازی پرچم‌های بازیابی لغوشده قدیمی تا startup همچنان child را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (نشست‌ها، رونوشت‌ها، دایرکتوری وضعیت).
    - بررسی‌های مجوز فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند توکن‌های نزدیک به انقضا را refresh کند، و وضعیت‌های cooldown/disabled پروفایل احراز هویت را گزارش می‌دهد.
    - شناسایی دایرکتوری workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - تعمیر تصویر sandbox وقتی sandboxing فعال است.
    - مهاجرت سرویس قدیمی و شناسایی Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime در Gateway (سرویس نصب شده اما اجرا نمی‌شود؛ برچسب launchd کش‌شده).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا probe می‌شود).
    - بررسی‌های پاسخ‌گویی WhatsApp برای سلامت event-loop تنزل‌یافته Gateway در حالی که کلاینت‌های TUI محلی همچنان در حال اجرا هستند؛ `--fix` فقط کلاینت‌های TUI محلی تأییدشده را متوقف می‌کند.
    - تعمیر مسیر Codex برای refs مدل قدیمی `openai-codex/*` در مدل‌های اصلی، fallbackها، بازنویسی‌های Heartbeat/subagent/Compaction، hookها، بازنویسی‌های مدل کانال، و pinهای مسیر نشست؛ `--fix` آن‌ها را به `openai/*` بازنویسی می‌کند و فقط وقتی Plugin مربوط به Codex نصب و فعال باشد، harness مربوط به `codex` را ارائه کند، و OAuth قابل‌استفاده داشته باشد، `agentRuntime.id: "codex"` را انتخاب می‌کند. در غیر این صورت `agentRuntime.id: "pi"` را انتخاب می‌کند.
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy توکار برای سرویس‌های Gateway که هنگام نصب یا به‌روزرسانی مقادیر shell مربوط به `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را گرفته‌اند.
    - بررسی‌های بهترین‌روش runtime برای Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی تداخل پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت توکن محلی (وقتی هیچ منبع توکنی وجود ندارد، تولید توکن را پیشنهاد می‌دهد؛ پیکربندی‌های SecretRef توکن را بازنویسی نمی‌کند).
    - شناسایی مشکل pairing دستگاه (درخواست‌های نخستین pair معلق، ارتقاهای نقش/دامنه معلق، drift کش قدیمی device-token محلی، و drift احراز هویت رکورد paired).

  </Accordion>
  <Accordion title="Workspace and shell">
    - بررسی linger در systemd روی Linux.
    - بررسی اندازه فایل bootstrap workspace (هشدارهای truncation/نزدیک به حد برای فایل‌های زمینه).
    - بررسی آمادگی Skills برای عامل پیش‌فرض؛ skillهای مجاز با bin، env، config، یا نیازمندی‌های OS مفقود را گزارش می‌کند، و `--fix` می‌تواند skillهای در دسترس نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت تکمیل shell و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding جست‌وجوی حافظه (مدل محلی، کلید API راه‌دور، یا binary مربوط به QMD).
    - بررسی‌های نصب از source (ناهماهنگی pnpm workspace، assets مفقود UI، binary مفقود tsx).
    - پیکربندی به‌روزشده + metadata مربوط به wizard را می‌نویسد.

  </Accordion>
</AccordionGroup>

## backfill و reset در Dreams UI

صحنه Dreams در Control UI شامل کنش‌های **Backfill**، **Reset**، و **Clear Grounded** برای گردش‌کار grounded dreaming است. این کنش‌ها از روش‌های RPC به سبک Gateway doctor استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI در `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر دفترچه REM grounded را اجرا می‌کند، و ورودی‌های backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان ورودی‌های دفترچه backfill علامت‌گذاری‌شده را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط ورودی‌های کوتاه‌مدت staged و فقط grounded را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه انباشته نکرده‌اند.

کاری که خودشان انجام **نمی‌دهند**:

- `MEMORY.md` را ویرایش نمی‌کنند
- مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- نامزدهای grounded را به‌طور خودکار وارد ذخیره‌گاه promotion کوتاه‌مدت زنده نمی‌کنند، مگر اینکه ابتدا مسیر staged CLI را صراحتاً اجرا کنید

اگر می‌خواهید replay تاریخی grounded بر مسیر عادی promotion عمیق اثر بگذارد، به‌جای آن از گردش CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار نامزدهای پایدار grounded را وارد ذخیره‌گاه Dreaming کوتاه‌مدت می‌کند و هم‌زمان `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار دقیق و منطق

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. Config normalization">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون بازنویسی مخصوص کانال)، doctor آن‌ها را به طرح‌واره فعلی نرمال می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی speech در Talk برابر است با `talk.provider` + `talk.providers.<provider>`، و پیکربندی realtime voice برابر است با `talk.realtime.*`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را در نقشه provider بازنویسی می‌کند، و selectorهای realtime سطح‌بالای قدیمی (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) را به `talk.realtime` بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` خالی نیست و سیاست ابزار از
    wildcard یا ورودی‌های ابزار متعلق به Plugin استفاده می‌کند هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهایی
    از Pluginهایی مطابقت دارد که واقعاً بارگذاری می‌شوند؛ این کار فهرست مجاز انحصاری Plugin را دور نمی‌زند.
    Doctor برای پیکربندی‌های فهرست مجاز قدیمی مهاجرت‌یافته، `plugins.bundledDiscovery: "compat"` را می‌نویسد تا رفتار موجود providerهای bundled حفظ شود، و
    سپس به تنظیم سخت‌گیرانه‌تر `"allowlist"` اشاره می‌کند.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor موارد زیر را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با طرح‌واره به‌روزشده بازنویسی می‌کند.

    راه‌اندازی Gateway قالب‌های پیکربندی قدیمی را نمی‌پذیرد و از شما می‌خواهد `openclaw doctor --fix` را اجرا کنید؛ هنگام startup، `openclaw.json` را بازنویسی نمی‌کند. مهاجرت‌های ذخیره‌گاه کار Cron نیز توسط `openclaw doctor --fix` انجام می‌شوند.

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
    - گزینشگرهای قدیمی realtime Talk در سطح بالا (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - برای کانال‌هایی که `accounts` نام‌گذاری‌شده دارند اما هنوز مقدارهای کانال تک‌حسابی در سطح بالای آن‌ها باقی مانده است، آن مقدارهای محدود به حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک مقصد نام‌گذاری‌شده/پیش‌فرض مطابق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای زمان‌انتظارهای طولانی provider/model از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم قدیمی رله extension)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی Gateway همچنین از providerهایی که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده است عبور می‌کند، به‌جای اینکه بسته و ناموفق شود)

    هشدارهای doctor همچنین راهنمایی حساب پیش‌فرض را برای کانال‌های چندحسابی شامل می‌شوند:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که مسیریابی fallback ممکن است حساب غیرمنتظره‌ای را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی یک شناسه حساب ناشناخته تنظیم شده باشد، doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های provider مربوط به OpenCode">
    اگر `models.providers.opencode`، `opencode-zen`، یا `opencode-go` را دستی اضافه کرده باشید، catalog داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این می‌تواند مدل‌ها را مجبور کند روی API نادرست قرار بگیرند یا هزینه‌ها را صفر کند. doctor هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API و هزینه‌های مخصوص هر مدل را بازیابی کنید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر حذف‌شده extension Chrome اشاره می‌کند، doctor آن را به مدل فعلی اتصال Chrome MCP محلیِ میزبان عادی‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    doctor همچنین هنگام استفاده از `defaultProfile: "user"` یا یک پروفایل `existing-session` پیکربندی‌شده، مسیر Chrome MCP محلیِ میزبان را بررسی می‌کند:

    - بررسی می‌کند که آیا Google Chrome برای پروفایل‌های اتصال خودکار پیش‌فرض روی همان میزبان نصب شده است
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی کمتر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که remote debugging را در صفحه inspect مرورگر فعال کنید (برای نمونه `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلیِ میزبان همچنان نیاز دارد به:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان gateway/node
    - اجرای محلی مرورگر
    - فعال بودن remote debugging در آن مرورگر
    - تایید نخستین درخواست رضایت اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. Existing-session محدودیت‌های مسیر فعلی Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود، و کنش‌های دسته‌ای همچنان به مرورگر مدیریت‌شده یا پروفایل خام CDP نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser، یا جریان‌های headless دیگر اعمال **نمی‌شود**. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای TLS برای OAuth">
    وقتی یک پروفایل OAuth مربوط به OpenAI Codex پیکربندی شده باشد، doctor نقطه پایانی مجوزدهی OpenAI را کاوش می‌کند تا تایید کند پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر کاوش با خطای گواهی ناموفق شود (برای نمونه `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده، یا گواهی خودامضاشده)، doctor راهنمای رفع مشکل مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، رفع مشکل معمولا `brew postinstall ca-certificates` است. با `--deep`، کاوش حتی اگر Gateway سالم باشد اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های provider مربوط به Codex OAuth">
    اگر قبلا تنظیمات انتقال قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر داخلی provider مربوط به Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند تحت‌الشعاع قرار دهند. doctor وقتی آن تنظیمات انتقال قدیمی را کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال منسوخ را حذف یا بازنویسی کنید و رفتار داخلی مسیریابی/fallback را برگردانید. پروکسی‌های سفارشی و بازنویسی‌های فقط-سرآیند همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. ترمیم مسیر Codex">
    doctor ارجاع‌های مدل قدیمی `openai-codex/*` را بررسی می‌کند. مسیریابی بومی harness مربوط به Codex از ارجاع‌های مدل canonical `openai/*` به‌همراه `agentRuntime.id: "codex"` استفاده می‌کند تا نوبت از مسیر harness برنامه-سرور Codex عبور کند، نه مسیر OpenClaw PI OpenAI.

    در حالت `--fix` / `--repair`، doctor ارجاع‌های عامل پیش‌فرض و هر عامل را بازنویسی می‌کند، از جمله مدل‌های اصلی، fallbackها، بازنویسی‌های Heartbeat/subagent/Compaction، hookها، بازنویسی‌های مدل کانال، و وضعیت مسیر session ماندگارِ منسوخ:

    - `openai-codex/gpt-*` به `openai/gpt-*` تبدیل می‌شود.
    - runtime عامل مطابق فقط وقتی به `agentRuntime.id: "codex"` تبدیل می‌شود که Codex نصب، فعال و دارای harness مربوط به `codex` باشد و OAuth قابل استفاده داشته باشد.
    - در غیر این صورت runtime عامل مطابق به `agentRuntime.id: "pi"` تبدیل می‌شود.
    - فهرست‌های fallback مدل موجود با بازنویسی ورودی‌های قدیمی‌شان حفظ می‌شوند؛ تنظیمات مخصوص هر مدلِ کپی‌شده از کلید قدیمی به کلید canonical `openai/*` منتقل می‌شوند.
    - `modelProvider`/`providerOverride`، `model`/`modelOverride`، اعلان‌های fallback، سنجاق‌های auth-profile، و سنجاق‌های harness مربوط به Codex در تمام مخزن‌های session عامل کشف‌شده ترمیم می‌شوند.
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از چت کنترل یا bind کنید.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از adapter خارجی ACP/acpx استفاده کنید.»

  </Accordion>
  <Accordion title="2g. پاک‌سازی مسیر session">
    doctor همچنین مخزن‌های session عامل کشف‌شده را برای وضعیت مسیر منسوخ و خودکار ساخته‌شده پس از انتقال مدل‌های پیکربندی‌شده یا runtime از مسیری متعلق به Plugin، مانند Codex، اسکن می‌کند.

    `openclaw doctor --fix` می‌تواند وضعیت منسوخِ خودکار ساخته‌شده مانند سنجاق‌های مدل `modelOverrideSource: "auto"`، فراداده مدل runtime، شناسه‌های harness سنجاق‌شده، bindهای session مربوط به CLI، و بازنویسی‌های خودکار auth-profile را وقتی مسیر مالک آن‌ها دیگر پیکربندی نشده پاک کند. انتخاب‌های صریح کاربر یا مدل session قدیمی برای بازبینی دستی گزارش می‌شوند و دست‌نخورده باقی می‌مانند؛ وقتی آن مسیر دیگر مدنظر نیست، آن‌ها را با `/model ...`، `/new`، یا بازنشانی session عوض کنید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    doctor می‌تواند چیدمان‌های قدیمی روی دیسک را به ساختار فعلی مهاجرت دهد:

    - مخزن sessionها + transcripts:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری عامل:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها best-effort و idempotent هستند؛ doctor وقتی هر پوشه قدیمی را به‌عنوان پشتیبان باقی بگذارد هشدار صادر می‌کند. Gateway/CLI همچنین sessionهای قدیمی + دایرکتوری عامل را هنگام راه‌اندازی به‌صورت خودکار مهاجرت می‌کند تا history/auth/models بدون اجرای دستی doctor در مسیر مخصوص هر عامل قرار بگیرند. احراز هویت WhatsApp عمدا فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. عادی‌سازی provider/نقشه-provider مربوط به Talk اکنون با برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌های صرفا ناشی از ترتیب کلید دیگر تغییرات تکراری و بی‌اثر `doctor --fix` را فعال نمی‌کنند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های manifest قدیمی Plugin">
    doctor تمام manifestهای Plugin نصب‌شده را برای کلیدهای capability منسوخ در سطح بالا (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌کند آن‌ها را به شیء `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقدارها را داشته باشد، کلید قدیمی بدون تکثیر داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های مخزن Cron قدیمی">
    doctor همچنین مخزن کارهای cron (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی بازنویسی شده باشد) را برای شکل‌های قدیمی job که scheduler هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی cron شامل موارد زیر است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload در سطح بالا (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای delivery در سطح بالا (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - aliasهای delivery مربوط به `provider` در payload → `delivery.channel` صریح
    - sentinelهای نامعتبر ماندگارشده cron در `payload.model` (`"default"`، `"null"`، رشته‌های خالی، JSON `null`) → بازنویسی مدل حذف‌شده
    - کارهای fallback قدیمی webhook ساده با `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    عیب‌یاب فقط زمانی کارهای `notify: true` را به‌صورت خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر کاری fallback اعلان قدیمی را با یک حالت تحویل غیر Webhook موجود ترکیب کند، عیب‌یاب هشدار می‌دهد و آن کار را برای بازبینی دستی دست‌نخورده باقی می‌گذارد.

    در Linux، عیب‌یاب همچنین زمانی هشدار می‌دهد که crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را فراخوانی می‌کند. آن اسکریپت محلیِ میزبان توسط OpenClaw فعلی نگهداری نمی‌شود و وقتی cron نتواند به گذرگاه کاربر systemd دسترسی پیدا کند، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی قدیمی crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor` و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    عیب‌یاب هر دایرکتوری نشست عامل را برای فایل‌های write-lock مانده اسکن می‌کند — فایل‌هایی که وقتی یک نشست به‌صورت غیرعادی خارج شده، باقی مانده‌اند. برای هر فایل قفلی که پیدا شود، این موارد را گزارش می‌کند: مسیر، PID، اینکه آیا PID هنوز زنده است، عمر قفل، و اینکه آیا مانده محسوب می‌شود یا نه (PID مرده یا قدیمی‌تر از ۳۰ دقیقه). در حالت `--fix` / `--repair`، فایل‌های قفل مانده را به‌صورت خودکار حذف می‌کند؛ در غیر این صورت یادداشتی چاپ می‌کند و به شما دستور می‌دهد دوباره با `--fix` اجرا کنید.
  </Accordion>
  <Accordion title="3d. ترمیم شاخه رونوشت نشست">
    عیب‌یاب فایل‌های JSONL نشست عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی رونوشت prompt در 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با زمینه اجرای داخلی OpenClaw به‌علاوه یک هم‌زاد فعال که همان prompt قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، عیب‌یاب از هر فایل تحت‌تأثیر کنار نسخه اصلی پشتیبان می‌گیرد و رونوشت را به شاخه فعال بازنویسی می‌کند تا تاریخچه Gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (ماندگاری نشست، مسیریابی، و ایمنی)">
    دایرکتوری وضعیت، ساقه مغز عملیاتی است. اگر ناپدید شود، نشست‌ها، اعتبارنامه‌ها، لاگ‌ها و پیکربندی را از دست می‌دهید (مگر اینکه جای دیگری پشتیبان داشته باشید).

    عیب‌یاب بررسی می‌کند:

    - **دایرکتوری وضعیت وجود ندارد**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، درخواست بازایجاد دایرکتوری را مطرح می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: نوشتنی بودن را تأیید می‌کند؛ پیشنهاد ترمیم مجوزها را می‌دهد (و وقتی ناسازگاری مالک/گروه شناسایی شود، راهنمای `chown` منتشر می‌کند).
    - **دایرکتوری وضعیت همگام‌سازی‌شده با ابر در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای مبتنی بر همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت روی SD یا eMMC در Linux**: وقتی وضعیت به یک منبع mount از نوع `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی مبتنی بر SD یا eMMC می‌تواند زیر نوشتن‌های نشست و اعتبارنامه کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های نشست وجود ندارند**: `sessions/` و دایرکتوری ذخیره نشست برای ماندگار کردن تاریخچه و جلوگیری از کرش‌های `ENOENT` لازم هستند.
    - **ناسازگاری رونوشت**: وقتی ورودی‌های نشست اخیر فایل‌های رونوشت ندارند هشدار می‌دهد.
    - **نشست اصلی "JSONL تک‌خطی"**: وقتی رونوشت اصلی فقط یک خط دارد علامت‌گذاری می‌کند (تاریخچه انباشته نمی‌شود).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های home مختلف وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآور حالت راه‌دور**: اگر `gateway.mode=remote` باشد، عیب‌یاب یادآوری می‌کند آن را روی میزبان راه‌دور اجرا کنید (وضعیت آنجا قرار دارد).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/همه قابل‌خواندن باشد هشدار می‌دهد و پیشنهاد می‌کند آن را به `600` محدود کند.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    عیب‌یاب پروفایل‌های OAuth را در مخزن احراز هویت بررسی می‌کند، وقتی توکن‌ها در حال انقضا/منقضی‌شده باشند هشدار می‌دهد، و وقتی ایمن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل OAuth/token مربوط به Anthropic مانده باشد، یک کلید API برای Anthropic یا مسیر setup-token مربوط به Anthropic را پیشنهاد می‌کند. درخواست‌های refresh فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی تازه‌سازی OAuth به‌طور دائمی شکست می‌خورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا وقتی یک ارائه‌دهنده از شما می‌خواهد دوباره وارد شوید)، doctor گزارش می‌دهد که احراز هویت دوباره لازم است و فرمان دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های احراز هویتی را گزارش می‌کند که به این دلایل موقتاً قابل استفاده نیستند:

    - دوره‌های انتظار کوتاه (محدودیت نرخ/مهلت‌های زمانی/شکست‌های احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های صورت‌حساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل Hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor ارجاع مدل را در برابر کاتالوگ و فهرست مجاز اعتبارسنجی می‌کند و وقتی قابل حل نباشد یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. ترمیم تصویر Sandbox">
    وقتی sandboxing فعال باشد، doctor تصویرهای Docker را بررسی می‌کند و اگر تصویر فعلی وجود نداشته باشد، پیشنهاد ساختن یا تغییر به نام‌های قدیمی را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    Doctor در حالت `openclaw doctor --fix` / `openclaw doctor --repair` وضعیت مرحله‌بندی وابستگی Plugin قدیمی تولیدشده توسط OpenClaw را حذف می‌کند. این شامل ریشه‌های وابستگی تولیدشده و منسوخ، دایرکتوری‌های قدیمی مرحله نصب، بقایای محلی بسته از کدهای قدیمی‌تر ترمیم وابستگی Pluginهای همراه، و نسخه‌های npm مدیریت‌شده یتیم یا بازیابی‌شده از Pluginهای همراه `@openclaw/*` است که می‌توانند manifest همراه فعلی را تحت‌الشعاع قرار دهند.

    Doctor همچنین می‌تواند Pluginهای قابل دانلودِ گمشده را وقتی پیکربندی به آن‌ها ارجاع می‌دهد اما رجیستری Plugin محلی نمی‌تواند آن‌ها را پیدا کند، دوباره نصب کند. نمونه‌ها شامل `plugins.entries` مادی، تنظیمات پیکربندی‌شده کانال/ارائه‌دهنده/جست‌وجو، و runtimeهای عامل پیکربندی‌شده است. هنگام به‌روزرسانی بسته‌ها، doctor از اجرای ترمیم Plugin توسط مدیر بسته در زمانی که بسته هسته در حال جایگزین شدن است خودداری می‌کند؛ اگر پس از به‌روزرسانی یک Plugin پیکربندی‌شده هنوز به بازیابی نیاز داشت، دوباره `openclaw doctor --fix` را اجرا کنید. راه‌اندازی Gateway و بارگذاری دوباره پیکربندی مدیرهای بسته را اجرا نمی‌کنند؛ نصب Pluginها همچنان کار صریح doctor/install/update باقی می‌ماند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و نکته‌های پاک‌سازی">
    Doctor سرویس‌های Gateway قدیمی (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد می‌کند آن‌ها را حذف کند و سرویس OpenClaw را با استفاده از پورت Gateway فعلی نصب کند. همچنین می‌تواند سرویس‌های اضافی شبیه Gateway را اسکن کند و نکته‌های پاک‌سازی چاپ کند. سرویس‌های Gateway متعلق به OpenClaw که با نام پروفایل نام‌گذاری شده‌اند، درجه‌یک محسوب می‌شوند و به‌عنوان «اضافی» علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس Gateway در سطح کاربر وجود نداشته باشد اما یک سرویس Gateway متعلق به OpenClaw در سطح سیستم وجود داشته باشد، doctor به‌طور خودکار سرویس دوم در سطح کاربر نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس نسخه تکراری را حذف کنید یا وقتی یک ناظر سیستم چرخه عمر Gateway را مالکیت می‌کند، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Matrix هنگام راه‌اندازی">
    وقتی یک حساب کانال Matrix یک مهاجرت وضعیت قدیمیِ در انتظار یا قابل اقدام داشته باشد، دکتر (در حالت `--fix` / `--repair`) یک نماگرفت پیش از مهاجرت ایجاد می‌کند و سپس مراحل مهاجرتِ مبتنی بر بهترین تلاش را اجرا می‌کند: مهاجرت وضعیت قدیمی Matrix و آماده‌سازی وضعیت رمزنگاری‌شده قدیمی. هر دو مرحله غیرکشنده هستند؛ خطاها ثبت می‌شوند و راه‌اندازی ادامه پیدا می‌کند. در حالت فقط خواندنی (`openclaw doctor` بدون `--fix`) این بررسی به‌طور کامل رد می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و انحراف احراز هویت">
    دکتر اکنون وضعیت جفت‌سازی دستگاه را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌کند:

    - درخواست‌های جفت‌سازی بار اولِ در انتظار
    - ارتقاهای نقش در انتظار برای دستگاه‌هایی که قبلا جفت شده‌اند
    - ارتقاهای دامنه در انتظار برای دستگاه‌هایی که قبلا جفت شده‌اند
    - تعمیرهای ناسازگاری کلید عمومی در جایی که شناسه دستگاه هنوز مطابقت دارد اما هویت دستگاه دیگر با رکورد تاییدشده مطابقت ندارد
    - رکوردهای جفت‌شده‌ای که برای یک نقش تاییدشده توکن فعال ندارند
    - توکن‌های جفت‌شده‌ای که دامنه‌هایشان از خط مبنای جفت‌سازی تاییدشده منحرف شده است
    - ورودی‌های محلیِ کش‌شده توکن دستگاه برای دستگاه فعلی که قدیمی‌تر از چرخش توکن سمت Gateway هستند یا فراداده دامنه کهنه دارند

    دکتر درخواست‌های جفت‌سازی را خودکار تایید نمی‌کند و توکن‌های دستگاه را خودکار نمی‌چرخاند. در عوض مراحل بعدی دقیق را چاپ می‌کند:

    - درخواست‌های در انتظار را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تایید کنید
    - یک توکن تازه را با `openclaw devices rotate --device <deviceId> --role <role>` بچرخانید
    - یک رکورد کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره تایید کنید

    این شکاف رایج «قبلا جفت شده اما هنوز نیاز به جفت‌سازی می‌گیرد» را می‌بندد: دکتر اکنون جفت‌سازی بار اول را از ارتقاهای نقش/دامنه در انتظار و از انحراف توکن/هویت دستگاهِ کهنه تشخیص می‌دهد.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    وقتی یک ارائه‌دهنده بدون فهرست مجاز برای پیام‌های مستقیم باز باشد، یا وقتی یک سیاست به‌شکلی خطرناک پیکربندی شده باشد، دکتر هشدار صادر می‌کند.
  </Accordion>
  <Accordion title="10. linger در systemd (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، دکتر مطمئن می‌شود lingering فعال است تا gateway پس از خروج از سیستم زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت فضای کاری (skills، plugins و دایرکتوری‌های قدیمی)">
    دکتر خلاصه‌ای از وضعیت فضای کاری را برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: تعداد مهارت‌های واجد شرایط، دارای نیازمندی‌های مفقود و مسدودشده توسط فهرست مجاز را می‌شمارد.
    - **دایرکتوری‌های فضای کاری قدیمی**: وقتی `~/openclaw` یا دایرکتوری‌های فضای کاری قدیمی دیگر در کنار فضای کاری فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: تعداد plugins فعال/غیرفعال/خطادار را می‌شمارد؛ شناسه‌های plugin را برای هر خطا فهرست می‌کند؛ قابلیت‌های bundle plugin را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: plugins دارای مشکلات سازگاری با زمان اجرای فعلی را علامت‌گذاری می‌کند.
    - **عیب‌یابی Plugin**: هر هشدار یا خطای زمان بارگذاری صادرشده توسط رجیستری plugin را نمایان می‌کند.

  </Accordion>
  <Accordion title="11b. اندازه فایل راه‌انداز اولیه">
    دکتر بررسی می‌کند که آیا فایل‌های راه‌انداز اولیه فضای کاری (برای مثال `AGENTS.md`، `CLAUDE.md` یا فایل‌های زمینه تزریق‌شده دیگر) نزدیک به بودجه کاراکتر پیکربندی‌شده هستند یا از آن عبور کرده‌اند. شمارش کاراکتر خام در برابر تزریق‌شده برای هر فایل، درصد برش، علت برش (`max/file` یا `max/total`) و مجموع کاراکترهای تزریق‌شده را به‌عنوان کسری از بودجه کل گزارش می‌کند. وقتی فایل‌ها بریده شده باشند یا نزدیک حد باشند، دکتر نکاتی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی plugin کانال کهنه">
    وقتی `openclaw doctor --fix` یک plugin کانال مفقود را حذف می‌کند، پیکربندی آویزانِ محدود به کانال را که به آن plugin ارجاع می‌داد نیز حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های heartbeat که نام کانال را آورده‌اند، و overrideهای `agents.*.models["<channel>/*"]`. این کار از حلقه‌های بوت Gateway جلوگیری می‌کند، جایی که زمان اجرای کانال حذف شده اما پیکربندی هنوز از gateway می‌خواهد به آن متصل شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    دکتر بررسی می‌کند که آیا تکمیل با tab برای shell فعلی نصب شده است یا نه (zsh، bash، fish یا PowerShell):

    - اگر پروفایل shell از الگوی تکمیل پویا و کند (`source <(openclaw completion ...)`) استفاده کند، دکتر آن را به گونه سریع‌ترِ فایل کش‌شده ارتقا می‌دهد.
    - اگر تکمیل در پروفایل پیکربندی شده باشد اما فایل کش وجود نداشته باشد، دکتر کش را به‌طور خودکار بازتولید می‌کند.
    - اگر هیچ تکمیلی اصلا پیکربندی نشده باشد، دکتر برای نصب آن درخواست می‌دهد (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای بازتولید دستی کش، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (توکن محلی)">
    دکتر آمادگی احراز هویت توکن محلی gateway را بررسی می‌کند.

    - اگر حالت توکن به توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، دکتر پیشنهاد می‌دهد یکی تولید کند.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما در دسترس نباشد، دکتر هشدار می‌دهد و آن را با متن ساده بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط زمانی تولید را اجبار می‌کند که هیچ SecretRef توکنی پیکربندی نشده باشد.

  </Accordion>
  <Accordion title="12b. ترمیم‌های فقط‌خواندنیِ آگاه از SecretRef">
    برخی جریان‌های ترمیم باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار زمان اجرا در حالت شکست سریع بررسی کنند.

    - `openclaw doctor --fix` اکنون برای ترمیم‌های هدفمند پیکربندی از همان مدل خلاصه فقط‌خواندنی SecretRef استفاده می‌کند که فرمان‌های خانواده وضعیت استفاده می‌کنند.
    - مثال: ترمیم `@username` در Telegram برای `allowFrom` / `groupAllowFrom` تلاش می‌کند در صورت موجود بودن، از اعتبارنامه‌های پیکربندی‌شده ربات استفاده کند.
    - اگر توکن ربات Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، doctor گزارش می‌دهد که اعتبارنامه پیکربندی شده اما در دسترس نیست و به‌جای خرابی یا گزارش نادرستِ نبودن توکن، رفع خودکار را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی مجدد">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی مجدد آن را می‌دهد.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند که آیا ارائه‌دهنده embedding جست‌وجوی حافظه پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و ارائه‌دهنده پیکربندی‌شده بستگی دارد:

    - **backend QMD**: بررسی می‌کند که آیا باینری `qmd` موجود و قابل شروع است یا نه. اگر نباشد، راهنمای رفع شامل بسته npm و گزینه مسیر دستی باینری را چاپ می‌کند.
    - **ارائه‌دهنده محلی صریح**: وجود فایل مدل محلی یا URL مدل از راه دور/قابل دانلودِ شناخته‌شده را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌کند به یک ارائه‌دهنده از راه دور تغییر دهید.
    - **ارائه‌دهنده از راه دور صریح** (`openai`، `voyage` و غیره): تأیید می‌کند که کلید API در محیط یا مخزن احراز هویت وجود دارد. اگر وجود نداشته باشد، راهنمایی‌های قابل اقدام برای رفع مشکل چاپ می‌کند.
    - **ارائه‌دهنده خودکار**: ابتدا موجود بودن مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهنده از راه دور را به ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی نتیجه probe ذخیره‌شده Gateway موجود باشد (Gateway در زمان بررسی سالم بوده باشد)، doctor نتیجه آن را با پیکربندی قابل مشاهده برای CLI تطبیق می‌دهد و هر مغایرتی را یادداشت می‌کند. Doctor در مسیر پیش‌فرض یک embedding ping تازه شروع نمی‌کند؛ وقتی بررسی زنده ارائه‌دهنده را می‌خواهید، از فرمان وضعیت عمیق حافظه استفاده کنید.

    برای تأیید آمادگی embedding در زمان اجرا از `openclaw memory status --deep` استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. ممیزی + ترمیم پیکربندی supervisor">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های جاافتاده یا قدیمی بررسی می‌کند (برای مثال، وابستگی‌های systemd به network-online و تأخیر راه‌اندازی مجدد). وقتی ناسازگاری پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل سرویس/وظیفه را با پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` درخواست‌های پیش‌فرض ترمیم را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های توصیه‌شده را بدون درخواست تأیید اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor را برای چرخه عمر سرویس Gateway فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌دهد و ترمیم‌های غیرسرویسی را اجرا می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس، بازنویسی پیکربندی supervisor و پاک‌سازی سرویس قدیمی را رد می‌کند، چون یک supervisor خارجی مالک آن چرخه عمر است.
    - در Linux، تا وقتی unit متناظر systemd برای Gateway فعال است، doctor فراداده فرمان/نقطه ورود را بازنویسی نمی‌کند. همچنین هنگام اسکن سرویس تکراری، unitهای اضافی غیرفعال و غیرقدیمیِ شبیه Gateway را نادیده می‌گیرد تا فایل‌های سرویس همراه باعث نویز پاک‌سازی نشوند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/ترمیم سرویس doctor، SecretRef را اعتبارسنجی می‌کند اما مقدار توکن متن ساده حل‌شده را در فراداده محیط سرویس supervisor ذخیره نمی‌کند.
    - Doctor مقدارهای محیط سرویس مدیریت‌شده مبتنی بر `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd یا Windows Scheduled Task به‌صورت inline جاسازی کرده‌اند تشخیص می‌دهد و فراداده سرویس را بازنویسی می‌کند تا آن مقدارها به‌جای تعریف supervisor از منبع زمان اجرا بارگیری شوند.
    - Doctor تشخیص می‌دهد که فرمان سرویس پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را ثابت نگه داشته است و فراداده سرویس را به پورت فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل نشده باشد، doctor مسیر نصب/ترمیم را با راهنمایی قابل اقدام مسدود می‌کند.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/ترمیم را تا زمانی که mode صریحاً تنظیم شود مسدود می‌کند.
    - برای unitهای user-systemd در Linux، بررسی‌های drift توکن doctor اکنون هنگام مقایسه فراداده احراز هویت سرویس، هم منابع `Environment=` و هم منابع `EnvironmentFile=` را شامل می‌شود.
    - ترمیم‌های سرویس Doctor از بازنویسی، توقف یا راه‌اندازی مجدد یک سرویس Gateway از باینری قدیمی‌تر OpenClaw خودداری می‌کنند، وقتی پیکربندی آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید با `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="16. تشخیص‌های زمان اجرای Gateway + پورت">
    Doctor زمان اجرای سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما واقعاً در حال اجرا نیست هشدار می‌دهد. همچنین برخوردهای پورت روی پورت Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل (Gateway از قبل در حال اجرا، تونل SSH) را گزارش می‌دهد.
  </Accordion>
  <Accordion title="17. بهترین شیوه‌های زمان اجرای Gateway">
    Doctor وقتی سرویس Gateway روی Bun یا یک مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای مدیر نسخه می‌توانند پس از ارتقا خراب شوند چون سرویس init پوسته شما را بارگیری نمی‌کند. Doctor پیشنهاد می‌کند در صورت موجود بودن نصب Node سیستمی (Homebrew/apt/choco) به آن مهاجرت شود.

    LaunchAgentهای macOS که تازه نصب یا ترمیم شده‌اند، به‌جای کپی کردن PATH پوسته تعاملی، از یک PATH سیستمی canonical (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین Volta، asdf، fnm، pnpm و سایر دایرکتوری‌های مدیر نسخه تعیین نمی‌کنند که فرایندهای فرزند Node به چه چیزی resolve شوند. سرویس‌های Linux همچنان rootهای محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های user-bin پایدار را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌شده مدیر نسخه فقط وقتی در PATH سرویس نوشته می‌شوند که آن دایرکتوری‌ها روی دیسک وجود داشته باشند.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + فراداده wizard">
    Doctor هر تغییر پیکربندی را ذخیره می‌کند و برای ثبت اجرای doctor، فراداده wizard را مهر می‌کند.
  </Accordion>
  <Accordion title="19. نکته‌های workspace (پشتیبان‌گیری + سیستم حافظه)">
    Doctor وقتی سیستم حافظه workspace وجود نداشته باشد آن را پیشنهاد می‌کند و اگر workspace از قبل زیر git نباشد، نکته‌ای برای پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و پشتیبان‌گیری git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
