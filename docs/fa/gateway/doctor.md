---
read_when:
    - افزودن یا تغییر مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و گام‌های تعمیر'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-10T19:41:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. این ابزار پیکربندی/وضعیت کهنه را اصلاح می‌کند، سلامت را بررسی می‌کند، و گام‌های تعمیر قابل‌اقدام ارائه می‌دهد.

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

    پیش‌فرض‌ها را بدون درخواست تأیید بپذیر (از جمله گام‌های تعمیر راه‌اندازی مجدد/سرویس/sandbox در موارد قابل‌اعمال).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تعمیرهای پیشنهادی را بدون درخواست تأیید اعمال کن (تعمیرها + راه‌اندازی مجدد در موارد امن).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    تعمیرهای تهاجمی را هم اعمال کن (پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    بدون درخواست تأیید اجرا کن و فقط مهاجرت‌های امن را اعمال کن (نرمال‌سازی پیکربندی + جابه‌جایی‌های وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/sandbox را که به تأیید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌صورت خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های اضافی gateway اسکن کن (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید پیش از نوشتن، تغییرات را بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## چه کاری انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل UI (وقتی schema پروتکل جدیدتر باشد، Control UI را دوباره می‌سازد).
    - بررسی سلامت + درخواست تأیید برای راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجدشرایط/مفقود/مسدود) و وضعیت plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - نرمال‌سازی پیکربندی برای مقدارهای قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای override ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌اندازی OAuth مربوط به Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OAuth مربوط به OpenAI Codex.
    - هشدارهای allowlist برای plugin/tool وقتی `plugins.allow` محدودکننده است اما سیاست ابزار همچنان wildcard یا ابزارهای متعلق به plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/شاخه agent/احراز هویت WhatsApp).
    - مهاجرت کلید قرارداد manifest قدیمی plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت store قدیمی cron (`jobId`, `schedule.cron`, فیلدهای سطح‌بالای delivery/payload، payload `provider`، jobهای fallback ساده webhook با `notify: true`).
    - پاک‌سازی runtime-policy قدیمی در سطح کل agent؛ runtime policy ارائه‌دهنده/مدل انتخاب‌کننده مسیر فعال است.
    - پاک‌سازی پیکربندی کهنه plugin وقتی pluginها فعال هستند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های کهنه plugin به‌عنوان پیکربندی مهار بی‌اثر در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="State and integrity">
    - بازرسی فایل قفل session و پاک‌سازی قفل‌های کهنه.
    - تعمیر transcriptهای session برای شاخه‌های تکراری prompt-rewrite که توسط buildهای متأثر 2026.4.24 ایجاد شده‌اند.
    - شناسایی tombstone بازیابی-راه‌اندازی‌مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌سازی flagهای کهنه بازیابی لغوشده تا startup همچنان child را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (sessions، transcripts، شاخه state).
    - بررسی‌های مجوز فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای نزدیک به انقضا را refresh کند، و وضعیت‌های cooldown/disabled مربوط به auth-profile را گزارش می‌دهد.
    - شناسایی شاخه workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - تعمیر image مربوط به sandbox وقتی sandboxing فعال باشد.
    - مهاجرت سرویس قدیمی و شناسایی gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime مربوط به Gateway (سرویس نصب شده اما در حال اجرا نیست؛ label کش‌شده launchd).
    - هشدارهای وضعیت کانال (از gateway در حال اجرا probe می‌شود).
    - بررسی‌های مجوز ویژه کانال زیر `openclaw channels capabilities` قرار دارند؛ برای مثال، مجوزهای کانال صوتی Discord با `openclaw channels capabilities --channel discord --target channel:<channel-id>` بررسی می‌شوند.
    - بررسی‌های پاسخ‌گویی WhatsApp برای سلامت تنزل‌یافته event-loop در Gateway در حالی که کلاینت‌های محلی TUI هنوز در حال اجرا هستند؛ `--fix` فقط کلاینت‌های محلی TUI تأییدشده را متوقف می‌کند.
    - تعمیر مسیر Codex برای refهای قدیمی مدل `openai-codex/*` در مدل‌های اصلی، fallbackها، overrideهای heartbeat/subagent/compaction، hookها، overrideهای مدل کانال، و pinهای مسیر session؛ `--fix` آن‌ها را به `openai/*` بازنویسی می‌کند، pinهای runtime کهنه session/کل agent را حذف می‌کند، و refهای canonical عامل OpenAI را روی harness پیش‌فرض Codex باقی می‌گذارد.
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy تعبیه‌شده برای سرویس‌های gateway که مقدارهای shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را هنگام نصب یا به‌روزرسانی گرفته‌اند.
    - بررسی‌های بهترین روش runtime مربوط به Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی تداخل پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی هیچ منبع token وجود ندارد، تولید token را پیشنهاد می‌دهد؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - شناسایی مشکل جفت‌سازی دستگاه (درخواست‌های جفت‌سازی بار اول در انتظار، ارتقاهای role/scope در انتظار، drift کش token دستگاه محلی کهنه، و drift احراز هویت رکورد جفت‌شده).

  </Accordion>
  <Accordion title="Workspace and shell">
    - بررسی systemd linger روی Linux.
    - بررسی اندازه فایل bootstrap در workspace (هشدارهای کوتاه‌سازی/نزدیک به محدودیت برای فایل‌های context).
    - بررسی آمادگی Skills برای agent پیش‌فرض؛ skillهای مجاز را که bin، env، config، یا الزامات OS آن‌ها مفقود است گزارش می‌کند، و `--fix` می‌تواند skillهای در دسترس نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت تکمیل shell و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding جست‌وجوی حافظه (مدل محلی، کلید API راه دور، یا باینری QMD).
    - بررسی‌های نصب از source (عدم‌تطابق workspace در pnpm، assetهای UI مفقود، باینری tsx مفقود).
    - پیکربندی به‌روزشده + metadata جادوگر را می‌نویسد.

  </Accordion>
</AccordionGroup>

## تکمیل و بازنشانی UI مربوط به Dreams

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset**، و **Clear Grounded** برای workflow مربوط به dreaming مبتنی بر زمینه است. این اقدام‌ها از متدهای RPC به سبک gateway doctor استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر دفترچه grounded REM را اجرا می‌کند، و entryهای backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان entryهای دفترچه backfill علامت‌گذاری‌شده را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط entryهای کوتاه‌مدت staged و فقط grounded را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه جمع نکرده‌اند.

کاری که به‌تنهایی انجام **نمی‌دهند**:

- آن‌ها `MEMORY.md` را ویرایش نمی‌کنند
- آن‌ها مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- آن‌ها candidateهای grounded را به‌صورت خودکار در store ارتقای کوتاه‌مدت زنده stage نمی‌کنند، مگر اینکه ابتدا مسیر staged CLI را صراحتاً اجرا کنید

اگر می‌خواهید replay تاریخی grounded بر lane عادی ارتقای عمیق اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار candidateهای durable و grounded را در store کوتاه‌مدت dreaming stage می‌کند، در حالی که `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار تفصیلی و دلیل

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیشنهاد می‌دهد پیش از اجرای doctor به‌روزرسانی انجام شود (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Config normalization">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override ویژه کانال)، doctor آن‌ها را به schema فعلی نرمال می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی speech در Talk برابر `talk.provider` + `talk.providers.<provider>` است، و پیکربندی realtime voice برابر `talk.realtime.*` است. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را در map ارائه‌دهنده بازنویسی می‌کند، و selectorهای realtime سطح‌بالای قدیمی (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) را به `talk.realtime` بازنویسی می‌کند.

    همچنین وقتی `plugins.allow` خالی نیست و سیاست ابزار از entryهای
    wildcard یا ابزارهای متعلق به plugin استفاده می‌کند، doctor هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهایی
    از pluginهایی match می‌شود که واقعاً بارگذاری می‌شوند؛ allowlist انحصاری plugin را دور نمی‌زند.
    Doctor برای پیکربندی‌های allowlist قدیمیِ مهاجرت‌شده، `plugins.bundledDiscovery: "compat"` را می‌نویسد
    تا رفتار موجود ارائه‌دهنده bundled حفظ شود، و سپس به تنظیم سخت‌گیرانه‌تر `"allowlist"` اشاره می‌کند.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شدند.
    - مهاجرت اعمال‌شده را نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با schema به‌روزشده بازنویسی می‌کند.

    startup مربوط به Gateway قالب‌های پیکربندی قدیمی را رد می‌کند و از شما می‌خواهد `openclaw doctor --fix` را اجرا کنید؛ هنگام startup، `openclaw.json` را بازنویسی نمی‌کند. مهاجرت‌های store مربوط به jobهای Cron نیز توسط `openclaw doctor --fix` مدیریت می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - پیکربندی‌های کانال پیکربندی‌شده که سیاست پاسخ قابل‌مشاهده ندارند → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` در سطح بالا
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` قدیمی → `talk.provider` + `talk.providers.<provider>`
    - انتخابگرهای Talk بلادرنگ قدیمی در سطح بالا (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - برای کانال‌هایی با `accounts` نام‌گذاری‌شده اما مقادیر کانال تک‌حساب قدیمی در سطح بالای کانال، آن مقادیر محدود به حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک هدف نام‌گذاری‌شده/پیش‌فرض موجود و مطابق را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای مهلت‌های زمانی کند provider/model از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم قدیمی رله افزونه)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی Gateway همچنین providerهایی را که `api` آن‌ها روی یک مقدار enum آینده یا ناشناخته تنظیم شده است، به‌جای شکست بسته، رد می‌کند)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` را حذف کنید؛ سرور برنامه Codex همیشه ابزارهای فضای کاری بومی Codex را بومی نگه می‌دارد

    هشدارهای doctor همچنین راهنمای حساب پیش‌فرض را برای کانال‌های چندحسابی شامل می‌شوند:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که مسیریابی پشتیبان می‌تواند یک حساب غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی یک شناسه حساب ناشناخته تنظیم شده باشد، doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    اگر `models.providers.opencode`، `opencode-zen` یا `opencode-go` را به‌صورت دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این می‌تواند مدل‌ها را به API اشتباه تحمیل کند یا هزینه‌ها را صفر کند. doctor هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API و هزینه‌های مختص هر مدل را بازگردانید.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    اگر پیکربندی مرورگر شما هنوز به مسیر افزونه حذف‌شده Chrome اشاره می‌کند، doctor آن را به مدل اتصال Chrome MCP میزبان-محلی فعلی نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    doctor همچنین مسیر Chrome MCP میزبان-محلی را وقتی از `defaultProfile: "user"` یا یک پروفایل `existing-session` پیکربندی‌شده استفاده می‌کنید، بررسی می‌کند:

    - بررسی می‌کند آیا Google Chrome روی همان میزبان برای پروفایل‌های اتصال خودکار پیش‌فرض نصب است یا نه
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که اشکال‌زدایی راه‌دور را در صفحه بازرسی مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging` یا `edge://inspect/#remote-debugging`)

    doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP میزبان-محلی همچنان به موارد زیر نیاز دارد:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان gateway/node
    - مرورگری که به‌صورت محلی در حال اجرا باشد
    - اشکال‌زدایی راه‌دور در آن مرورگر فعال باشد
    - تأیید اعلان رضایت اتصال نخستین در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. existing-session محدودیت‌های مسیر Chrome MCP فعلی را حفظ می‌کند؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود و کنش‌های دسته‌ای همچنان به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser یا دیگر جریان‌های headless اعمال نمی‌شود. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    وقتی یک پروفایل OAuth برای OpenAI Codex پیکربندی شده باشد، doctor نقطه پایانی مجوزدهی OpenAI را کاوش می‌کند تا تأیید کند پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر کاوش با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده یا گواهی خودامضاشده)، doctor راهنمای رفع مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولاً `brew postinstall ca-certificates` است. با `--deep`، کاوش حتی اگر Gateway سالم باشد هم اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    اگر قبلاً تنظیمات انتقال قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر provider داخلی Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند، پنهان کنند. وقتی doctor این تنظیمات انتقال قدیمی را کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال کهنه را حذف یا بازنویسی کنید و رفتار مسیریابی/پشتیبان داخلی را برگردانید. پراکسی‌های سفارشی و بازنویسی‌های فقط-هدر همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    doctor وجود ارجاع‌های مدل قدیمی `openai-codex/*` را بررسی می‌کند. مسیریابی بومی ابزار اجرایی Codex از ارجاع‌های مدل canonical `openai/*` استفاده می‌کند؛ نوبت‌های عامل OpenAI از طریق ابزار اجرایی سرور برنامه Codex انجام می‌شوند، نه مسیر OpenClaw PI OpenAI.

    در حالت `--fix` / `--repair`، doctor ارجاع‌های عامل پیش‌فرض و هر عامل را بازنویسی می‌کند، از جمله مدل‌های اصلی، پشتیبان‌ها، بازنویسی‌های heartbeat/subagent/compaction، hookها، بازنویسی‌های مدل کانال و وضعیت مسیر نشست پایدار قدیمی:

    - `openai-codex/gpt-*` به `openai/gpt-*` تبدیل می‌شود.
    - قصد Codex برای ارجاع‌های مدل عامل تعمیرشده به ورودی‌های `agentRuntime.id: "codex"` محدود به provider/model منتقل می‌شود تا پروفایل‌های احراز هویت `openai-codex:...` پس از تبدیل ارجاع مدل به `openai/*` همچنان قابل انتخاب باشند.
    - پیکربندی runtime کل عاملِ کهنه و pinهای runtime نشست پایدار حذف می‌شوند، چون انتخاب runtime محدود به provider/model است.
    - سیاست runtime موجود provider/model حفظ می‌شود، مگر اینکه ارجاع مدل قدیمیِ تعمیرشده برای حفظ مسیر احراز هویت قدیمی به مسیریابی Codex نیاز داشته باشد.
    - فهرست‌های پشتیبان مدل موجود با بازنویسی ورودی‌های قدیمی‌شان حفظ می‌شوند؛ تنظیمات هر مدلِ کپی‌شده از کلید قدیمی به کلید canonical `openai/*` منتقل می‌شوند.
    - `modelProvider`/`providerOverride`، `model`/`modelOverride`، اعلان‌های پشتیبان و pinهای پروفایل احراز هویت نشست پایدار در تمام مخزن‌های نشست عامل کشف‌شده تعمیر می‌شوند.
    - `/codex ...` یعنی «کنترل یا اتصال یک گفت‌وگوی بومی Codex از چت.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از آداپتر خارجی ACP/acpx استفاده کن.»

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    doctor همچنین مخزن‌های نشست عامل کشف‌شده را برای وضعیت مسیر خودکارِ کهنه پس از انتقال مدل‌های پیکربندی‌شده یا runtime از یک مسیر متعلق به Plugin مانند Codex اسکن می‌کند.

    `openclaw doctor --fix` می‌تواند وضعیت کهنه خودکار را پاک کند، مانند pinهای مدل `modelOverrideSource: "auto"`، فراداده مدل runtime، شناسه‌های pinشده ابزار اجرایی، اتصال‌های نشست CLI و بازنویسی‌های خودکار پروفایل احراز هویت، وقتی مسیر مالک آن‌ها دیگر پیکربندی نشده باشد. انتخاب‌های صریح کاربر یا نشست قدیمی برای مدل جهت بازبینی دستی گزارش می‌شوند و دست‌نخورده می‌مانند؛ وقتی آن مسیر دیگر مدنظر نیست، آن‌ها را با `/model ...`، `/new` یا بازنشانی نشست عوض کنید.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    doctor می‌تواند چیدمان‌های قدیمی‌تر روی دیسک را به ساختار فعلی مهاجرت دهد:

    - مخزن نشست‌ها + transcriptها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - پوشه عامل:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها بر پایه بهترین تلاش و idempotent هستند؛ doctor وقتی پوشه‌های قدیمی را به‌عنوان پشتیبان باقی بگذارد، هشدار صادر می‌کند. Gateway/CLI نیز پوشه نشست‌های قدیمی + پوشه عامل را هنگام راه‌اندازی به‌صورت خودکار مهاجرت می‌دهد تا تاریخچه/احراز هویت/مدل‌ها بدون اجرای دستی doctor در مسیر هر عامل قرار بگیرند. احراز هویت WhatsApp عمداً فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. نرمال‌سازی provider/نقشه provider در Talk اکنون با برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌های صرفاً ناشی از ترتیب کلیدها دیگر تغییرات تکراری و بی‌اثر `doctor --fix` را فعال نمی‌کنند.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    doctor همه manifestهای Plugin نصب‌شده را برای کلیدهای capability منسوخ در سطح بالا (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به شیء `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقادیر را داشته باشد، کلید قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    doctor همچنین مخزن کارهای cron (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی بازنویسی شده باشد) را برای شکل‌های قدیمی کارها که زمان‌بند همچنان برای سازگاری می‌پذیرد، بررسی می‌کند.

    پاک‌سازی‌های cron فعلی شامل این موارد است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای سطح بالای payload (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای سطح بالای delivery (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - نام‌های مستعار delivery برای payload `provider` → `delivery.channel` صریح
    - کارهای fallback ساده و قدیمی webhook با `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    Doctor فقط وقتی کارهای `notify: true` را به‌صورت خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر کاری fallback قدیمی notify را با یک حالت delivery غیر webhook موجود ترکیب کند، doctor هشدار می‌دهد و آن کار را برای بازبینی دستی باقی می‌گذارد.

    در Linux، اگر crontab کاربر همچنان `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را فراخوانی کند، doctor نیز هشدار می‌دهد. این اسکریپت محلی میزبان توسط OpenClaw فعلی نگهداری نمی‌شود و وقتی cron نتواند به باس کاربر systemd دسترسی پیدا کند، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی قدیمی crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor` و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل session">
    Doctor هر دایرکتوری session عامل را برای فایل‌های write-lock کهنه اسکن می‌کند — فایل‌هایی که وقتی یک session به‌صورت غیرعادی خارج شده باقی مانده‌اند. برای هر فایل قفل پیدا‌شده، این موارد را گزارش می‌کند: مسیر، PID، اینکه آیا PID هنوز زنده است یا نه، سن قفل، و اینکه آیا کهنه محسوب می‌شود یا نه (PID مرده، قدیمی‌تر از ۳۰ دقیقه، یا PID زنده‌ای که بتوان ثابت کرد متعلق به یک فرایند غیر OpenClaw است). در حالت `--fix` / `--repair` فایل‌های قفل کهنه را به‌صورت خودکار حذف می‌کند؛ در غیر این صورت یادداشتی چاپ می‌کند و به شما دستور می‌دهد با `--fix` دوباره اجرا کنید.
  </Accordion>
  <Accordion title="3d. تعمیر شاخه transcript session">
    Doctor فایل‌های JSONL مربوط به session عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی transcript پرامپت 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با زمینه runtime داخلی OpenClaw به‌علاوه یک همزاد فعال که همان پرامپت قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل آسیب‌دیده در کنار نسخه اصلی نسخه پشتیبان می‌گیرد و transcript را به شاخه فعال بازنویسی می‌کند تا تاریخچه Gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (ماندگاری session، مسیریابی، و ایمنی)">
    دایرکتوری وضعیت، ساقه مغز عملیاتی است. اگر ناپدید شود، sessionها، credentials، لاگ‌ها، و config را از دست می‌دهید (مگر اینکه در جای دیگری نسخه پشتیبان داشته باشید).

    Doctor بررسی می‌کند:

    - **دایرکتوری وضعیت وجود ندارد**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای بازسازی دایرکتوری درخواست تأیید می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: قابلیت نوشتن را بررسی می‌کند؛ پیشنهاد تعمیر مجوزها را می‌دهد (و وقتی ناهماهنگی owner/group تشخیص داده شود، راهنمایی `chown` صادر می‌کند).
    - **دایرکتوری وضعیت همگام‌شده با cloud در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای مبتنی بر sync می‌توانند باعث I/O کندتر و رقابت‌های lock/sync شوند.
    - **دایرکتوری وضعیت SD یا eMMC در Linux**: وقتی وضعیت به منبع mount با `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی مبتنی بر SD یا eMMC می‌تواند هنگام نوشتن session و credential کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های session وجود ندارند**: `sessions/` و دایرکتوری ذخیره session برای ماندگار کردن history و جلوگیری از کرش‌های `ENOENT` لازم هستند.
    - **عدم تطابق transcript**: وقتی ورودی‌های جدید session فایل transcript ندارند هشدار می‌دهد.
    - **session اصلی "JSONL تک‌خطی"**: وقتی transcript اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (history در حال انباشته شدن نیست).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در home directoryهای مختلف وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (history می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآوری حالت remote**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند که آن را روی میزبان remote اجرا کنید (وضعیت آنجا قرار دارد).
    - **مجوزهای فایل config**: اگر `~/.openclaw/openclaw.json` برای group/world قابل خواندن باشد هشدار می‌دهد و پیشنهاد می‌کند به `600` محدود شود.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در auth store بررسی می‌کند، وقتی tokenها در حال انقضا/منقضی‌شده‌اند هشدار می‌دهد، و وقتی ایمن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل OAuth/token مربوط به Anthropic کهنه باشد، یک کلید API Anthropic یا مسیر setup-token مربوط به Anthropic را پیشنهاد می‌کند. درخواست‌های refresh فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی refresh مربوط به OAuth به‌طور دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا provider از شما بخواهد دوباره وارد شوید)، doctor گزارش می‌دهد که re-auth لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های auth را گزارش می‌کند که به این دلایل موقتاً غیرقابل استفاده‌اند:

    - cooldownهای کوتاه (rate limitها/timeoutها/شکست‌های auth)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های billing/credit)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor ارجاع مدل را در برابر catalog و allowlist اعتبارسنجی می‌کند و وقتی resolve نشود یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. تعمیر image sandbox">
    وقتی sandboxing فعال باشد، doctor imageهای Docker را بررسی می‌کند و اگر image فعلی وجود نداشته باشد، پیشنهاد build یا تغییر به نام‌های قدیمی را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    Doctor در حالت `openclaw doctor --fix` / `openclaw doctor --repair` وضعیت staging وابستگی Plugin قدیمی تولیدشده توسط OpenClaw را حذف می‌کند. این شامل ریشه‌های وابستگی تولیدشده کهنه، دایرکتوری‌های install-stage قدیمی، باقی‌مانده‌های package-local از کد تعمیر وابستگی bundled-plugin قدیمی‌تر، و کپی‌های npm managed یتیم یا بازیابی‌شده از Pluginهای bundled `@openclaw/*` می‌شود که می‌توانند manifest bundled فعلی را تحت‌الشعاع قرار دهند.

    Doctor همچنین وقتی config به Pluginهای downloadable اشاره کند اما registry محلی Plugin نتواند آن‌ها را پیدا کند، می‌تواند آن Pluginهای گم‌شده را دوباره نصب کند. نمونه‌ها شامل `plugins.entries` مادی، تنظیمات channel/provider/search پیکربندی‌شده، و runtimeهای عامل پیکربندی‌شده هستند. هنگام به‌روزرسانی package، doctor از اجرای تعمیر Plugin توسط package-manager در زمانی که package اصلی در حال تعویض است خودداری می‌کند؛ اگر بعد از به‌روزرسانی هنوز یک Plugin پیکربندی‌شده نیاز به بازیابی دارد، دوباره `openclaw doctor --fix` را اجرا کنید. راه‌اندازی Gateway و reload کردن config، package managerها را اجرا نمی‌کنند؛ نصب Pluginها همچنان کار صریح doctor/install/update باقی می‌ماند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنمایی‌های پاک‌سازی">
    Doctor سرویس‌های gateway قدیمی (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد می‌کند آن‌ها را حذف کرده و سرویس OpenClaw را با پورت gateway فعلی نصب کند. همچنین می‌تواند سرویس‌های اضافی شبیه gateway را اسکن کند و راهنمایی‌های پاک‌سازی چاپ کند. سرویس‌های gateway مربوط به OpenClaw با نام profile، first-class محسوب می‌شوند و به‌عنوان "اضافی" علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس gateway سطح کاربر وجود نداشته باشد اما یک سرویس gateway مربوط به OpenClaw در سطح سیستم وجود داشته باشد، doctor به‌طور خودکار سرویس دوم سطح کاربر نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس duplicate را حذف کنید یا وقتی یک supervisor سیستمی مالک چرخه عمر gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Matrix راه‌اندازی">
    وقتی یک حساب channel مربوط به Matrix مهاجرت وضعیت قدیمیِ در انتظار یا قابل اقدام داشته باشد، doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس مراحل مهاجرت best-effort را اجرا می‌کند: مهاجرت وضعیت قدیمی Matrix و آماده‌سازی encrypted-state قدیمی. هر دو مرحله non-fatal هستند؛ خطاها log می‌شوند و راه‌اندازی ادامه پیدا می‌کند. در حالت read-only (`openclaw doctor` بدون `--fix`) این بررسی به‌طور کامل رد می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و drift احراز هویت">
    Doctor اکنون وضعیت جفت‌سازی دستگاه را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌کند:

    - درخواست‌های جفت‌سازی بار اول در انتظار
    - ارتقاهای نقش در انتظار برای دستگاه‌هایی که از قبل pair شده‌اند
    - ارتقاهای scope در انتظار برای دستگاه‌هایی که از قبل pair شده‌اند
    - تعمیرهای عدم تطابق کلید عمومی که در آن id دستگاه هنوز match است اما هویت دستگاه دیگر با رکورد تأییدشده match نیست
    - رکوردهای pair‌شده که برای یک نقش تأییدشده token فعال ندارند
    - tokenهای pair‌شده‌ای که scopeهایشان خارج از baseline جفت‌سازی تأییدشده drift کرده است
    - ورودی‌های cached محلی device-token برای ماشین فعلی که پیش از rotation token سمت gateway هستند یا metadata مربوط به scope کهنه دارند

    Doctor درخواست‌های pair را auto-approve نمی‌کند یا device tokenها را auto-rotate نمی‌کند. در عوض مراحل بعدی دقیق را چاپ می‌کند:

    - درخواست‌های در انتظار را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک token تازه را با `openclaw devices rotate --device <deviceId> --role <role>` rotate کنید
    - یک رکورد کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این حفره رایج "از قبل pair شده اما هنوز pairing required دریافت می‌شود" را می‌بندد: doctor اکنون جفت‌سازی بار اول را از ارتقاهای نقش/scope در انتظار و از drift مربوط به token/device-identity کهنه تفکیک می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک provider برای DMها بدون allowlist باز باشد، یا وقتی یک policy به شکل خطرناکی پیکربندی شده باشد، هشدار صادر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، doctor مطمئن می‌شود lingering فعال است تا gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (Skills، Pluginها، و دایرکتوری‌های قدیمی)">
    Doctor خلاصه‌ای از وضعیت workspace برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: skills واجد شرایط، دارای requirements گم‌شده، و مسدودشده توسط allowlist را می‌شمارد.
    - **دایرکتوری‌های workspace قدیمی**: وقتی `~/openclaw` یا دایرکتوری‌های workspace قدیمی دیگر در کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای enabled/disabled/errored را می‌شمارد؛ شناسه‌های Plugin را برای هر خطا فهرست می‌کند؛ قابلیت‌های Plugin بسته را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را که با runtime فعلی مشکل سازگاری دارند علامت‌گذاری می‌کند.
    - **تشخیص‌های Plugin**: هر هشدار یا خطای زمان load را که registry مربوط به Plugin صادر کرده باشد آشکار می‌کند.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap مربوط به workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا سایر فایل‌های زمینه تزریق‌شده) نزدیک یا بیش از بودجه کاراکتر پیکربندی‌شده هستند یا نه. تعداد کاراکتر خام در برابر تزریق‌شده را برای هر فایل، درصد truncation، علت truncation (`max/file` یا `max/total`)، و کل کاراکترهای تزریق‌شده را به‌عنوان کسری از کل بودجه گزارش می‌کند. وقتی فایل‌ها truncate شده باشند یا نزدیک محدودیت باشند، doctor نکاتی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin channel کهنه">
    وقتی `openclaw doctor --fix` یک Plugin channel گم‌شده را حذف می‌کند، config آویزان با scope همان channel را هم که به آن Plugin اشاره کرده بود حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های heartbeat که نام channel را آورده بودند، و overrideهای `agents.*.models["<channel>/*"]`. این از حلقه‌های boot در Gateway جلوگیری می‌کند، جایی که runtime مربوط به channel از بین رفته اما config هنوز از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند که آیا tab completion برای shell فعلی (zsh، bash، fish، یا PowerShell) نصب شده است یا نه:

    - اگر پروفایل shell از الگوی کند dynamic completion استفاده کند (`source <(openclaw completion ...)`)، doctor آن را به variant سریع‌ترِ فایل cached ارتقا می‌دهد.
    - اگر completion در profile پیکربندی شده باشد اما فایل cache وجود نداشته باشد، doctor cache را به‌صورت خودکار دوباره تولید می‌کند.
    - اگر اصلاً completion پیکربندی نشده باشد، doctor برای نصب آن درخواست تأیید می‌کند (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای بازتولید دستی cache، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="۱۲. بررسی‌های احراز هویت Gateway (توکن محلی)">
    Doctor آمادگی احراز هویت توکنی Gateway محلی را بررسی می‌کند.

    - اگر حالت توکن به توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، Doctor پیشنهاد می‌کند یکی تولید کند.
    - اگر `gateway.auth.token` با SecretRef مدیریت شود اما در دسترس نباشد، Doctor هشدار می‌دهد و آن را با متن ساده بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط زمانی تولید را اجباری می‌کند که هیچ SecretRef توکنی پیکربندی نشده باشد.

  </Accordion>
  <Accordion title="۱۲ب. تعمیرات آگاه از SecretRef و فقط‌خواندنی">
    برخی جریان‌های تعمیر باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار fail-fast زمان اجرا بازرسی کنند.

    - `openclaw doctor --fix` اکنون برای تعمیرات هدفمند پیکربندی از همان مدل خلاصه SecretRef فقط‌خواندنی استفاده می‌کند که فرمان‌های خانواده وضعیت استفاده می‌کنند.
    - مثال: تعمیر `allowFrom` / `groupAllowFrom` `@username` در Telegram تلاش می‌کند در صورت در دسترس بودن، از اعتبارنامه‌های ربات پیکربندی‌شده استفاده کند.
    - اگر توکن ربات Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، Doctor گزارش می‌دهد که اعتبارنامه پیکربندی‌شده اما در دسترس نیست و به‌جای از کار افتادن یا گزارش نادرست توکن به‌عنوان مفقود، حل خودکار را رد می‌کند.

  </Accordion>
  <Accordion title="۱۳. بررسی سلامت Gateway + راه‌اندازی مجدد">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی مجدد آن را می‌دهد.
  </Accordion>
  <Accordion title="۱۳ب. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند که آیا ارائه‌دهنده embedding جست‌وجوی حافظه پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و ارائه‌دهنده پیکربندی‌شده بستگی دارد:

    - **backend QMD**: بررسی می‌کند که آیا باینری `qmd` در دسترس و قابل شروع است یا نه. اگر نباشد، راهنمای رفع شامل بسته npm و یک گزینه مسیر دستی باینری را چاپ می‌کند.
    - **ارائه‌دهنده محلی صریح**: وجود یک فایل مدل محلی یا یک URL مدل راه‌دور/قابل دانلود شناخته‌شده را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌کند به یک ارائه‌دهنده راه‌دور تغییر دهید.
    - **ارائه‌دهنده راه‌دور صریح** (`openai`, `voyage`, و غیره): تأیید می‌کند که یک کلید API در محیط یا ذخیره‌گاه احراز هویت وجود دارد. اگر موجود نباشد، نکته‌های رفع قابل اقدام را چاپ می‌کند.
    - **ارائه‌دهنده خودکار**: ابتدا در دسترس بودن مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهنده راه‌دور را به‌ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی نتیجه probe کش‌شده Gateway در دسترس باشد (Gateway در زمان بررسی سالم بوده است)، Doctor نتیجه آن را با پیکربندی قابل مشاهده برای CLI تطبیق می‌دهد و هر اختلافی را یادآوری می‌کند. Doctor در مسیر پیش‌فرض یک ping تازه embedding شروع نمی‌کند؛ وقتی بررسی زنده ارائه‌دهنده می‌خواهید، از فرمان وضعیت عمیق حافظه استفاده کنید.

    برای تأیید آمادگی embedding در زمان اجرا از `openclaw memory status --deep` استفاده کنید.

  </Accordion>
  <Accordion title="۱۴. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، Doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="۱۵. ممیزی + تعمیر پیکربندی supervisor">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های مفقود یا قدیمی (برای نمونه، وابستگی‌های network-online در systemd و تأخیر راه‌اندازی مجدد) بررسی می‌کند. وقتی ناهماهنگی پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل/وظیفه service را با پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` قبل از بازنویسی پیکربندی supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` promptهای تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های توصیه‌شده را بدون prompt اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`، Doctor را برای چرخه عمر service مربوط به Gateway فقط‌خواندنی نگه می‌دارد. همچنان سلامت service را گزارش می‌دهد و تعمیرات غیر service را اجرا می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap کردن service، بازنویسی‌های پیکربندی supervisor و پاک‌سازی service قدیمی را رد می‌کند، زیرا یک supervisor خارجی مالک آن چرخه عمر است.
    - در Linux، وقتی واحد systemd Gateway متناظر فعال است، Doctor فراداده فرمان/entrypoint را بازنویسی نمی‌کند. همچنین هنگام اسکن service تکراری، واحدهای اضافی غیرفعال شبیه Gateway و غیرقدیمی را نادیده می‌گیرد تا فایل‌های service همراه، نویز پاک‌سازی ایجاد نکنند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/تعمیر service توسط Doctor، SecretRef را اعتبارسنجی می‌کند اما مقدارهای توکن متن ساده حل‌شده را در فراداده محیط service مربوط به supervisor پایدار نمی‌کند.
    - Doctor مقدارهای محیط service مدیریت‌شده و پشتیبانی‌شده با `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd یا Windows Scheduled Task به‌صورت inline جاسازی کرده بودند شناسایی می‌کند و فراداده service را بازنویسی می‌کند تا آن مقدارها به‌جای تعریف supervisor، از منبع زمان اجرا بارگذاری شوند.
    - Doctor تشخیص می‌دهد که فرمان service پس از تغییر `gateway.port` همچنان یک `--port` قدیمی را pin کرده است و فراداده service را به پورت فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، Doctor مسیر نصب/تعمیر را با راهنمایی قابل اقدام مسدود می‌کند.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، Doctor نصب/تعمیر را تا زمانی که mode به‌طور صریح تنظیم شود مسدود می‌کند.
    - برای واحدهای user-systemd در Linux، بررسی‌های drift توکن توسط Doctor اکنون هنگام مقایسه فراداده احراز هویت service، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شود.
    - تعمیرات service توسط Doctor از بازنویسی، توقف یا راه‌اندازی مجدد service مربوط به Gateway از یک باینری قدیمی‌تر OpenClaw خودداری می‌کند، وقتی پیکربندی آخرین‌بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را اجباری کنید.

  </Accordion>
  <Accordion title="۱۶. تشخیص‌های زمان اجرای Gateway + پورت">
    Doctor زمان اجرای service (PID، آخرین وضعیت خروج) را بازرسی می‌کند و وقتی service نصب شده اما واقعاً اجرا نمی‌شود هشدار می‌دهد. همچنین برخوردهای پورت روی پورت Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل (Gateway از قبل در حال اجرا است، تونل SSH) را گزارش می‌دهد.
  </Accordion>
  <Accordion title="۱۷. بهترین رویه‌های زمان اجرای Gateway">
    Doctor وقتی service مربوط به Gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه (`nvm`, `fnm`, `volta`, `asdf`, و غیره) اجرا شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای version-manager می‌توانند پس از ارتقا خراب شوند، زیرا service مقداردهی اولیه shell شما را بارگذاری نمی‌کند. Doctor پیشنهاد می‌کند در صورت در دسترس بودن (Homebrew/apt/choco)، به نصب system Node مهاجرت کنید.

    LaunchAgentهای تازه نصب‌شده یا تعمیرشده macOS به‌جای کپی کردن PATH مربوط به shell تعاملی، از یک system PATH کانونی (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین باینری‌های system مدیریت‌شده با Homebrew در دسترس می‌مانند، در حالی که Volta، asdf، fnm، pnpm و دایرکتوری‌های دیگر version-manager تغییری نمی‌دهند که فرایندهای فرزند Node به کدام مسیر resolve شوند. serviceهای Linux همچنان ریشه‌های محیط صریح (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) و دایرکتوری‌های user-bin پایدار را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌شده version-manager فقط وقتی آن دایرکتوری‌ها روی دیسک وجود داشته باشند در PATH مربوط به service نوشته می‌شوند.

  </Accordion>
  <Accordion title="۱۸. نوشتن پیکربندی + فراداده wizard">
    Doctor هر تغییر پیکربندی را پایدار می‌کند و برای ثبت اجرای Doctor، فراداده wizard را مهر می‌زند.
  </Accordion>
  <Accordion title="۱۹. نکته‌های workspace (پشتیبان‌گیری + سیستم حافظه)">
    Doctor وقتی سیستم حافظه workspace موجود نباشد آن را پیشنهاد می‌کند و اگر workspace از قبل تحت git نباشد، یک نکته پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و پشتیبان‌گیری git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook مربوط به Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
