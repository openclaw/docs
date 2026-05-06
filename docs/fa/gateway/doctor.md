---
read_when:
    - افزودن یا تغییر مهاجرت‌های عیب‌یاب
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل ترمیم'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-06T17:57:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. این ابزار پیکربندی/وضعیت کهنه را اصلاح می‌کند، سلامت را بررسی می‌کند، و گام‌های تعمیر قابل اجرا ارائه می‌دهد.

## شروع سریع

```bash
openclaw doctor
```

### حالت‌های بی‌سربرگ و خودکارسازی

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    پذیرش پیش‌فرض‌ها بدون درخواست تأیید (از جمله گام‌های تعمیر راه‌اندازی مجدد/سرویس/sandbox در صورت کاربرد).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    اعمال تعمیرهای پیشنهادی بدون درخواست تأیید (تعمیرها + راه‌اندازی‌های مجدد در موارد ایمن).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    تعمیرهای تهاجمی را هم اعمال می‌کند (پیکربندی‌های supervisor سفارشی را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    اجرا بدون درخواست تأیید و فقط اعمال مهاجرت‌های ایمن (نرمال‌سازی پیکربندی + جابه‌جایی وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/sandbox را که به تأیید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های Gateway اضافه اسکن می‌کند (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید تغییرات را پیش از نوشتن بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## کاری که انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل UI (وقتی شِمای پروتکل جدیدتر باشد، Control UI را دوباره می‌سازد).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/مفقود/مسدود) و وضعیت Plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - نرمال‌سازی پیکربندی برای مقدارهای قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای override ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌انداختن OAuth در Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای TLS مربوط به OAuth برای پروفایل‌های OpenAI Codex OAuth.
    - هشدارهای allowlist مربوط به Plugin/ابزار وقتی `plugins.allow` محدودکننده است اما سیاست ابزار همچنان wildcard یا ابزارهای متعلق به Plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/احراز هویت WhatsApp).
    - مهاجرت کلید قرارداد manifest قدیمی Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت store قدیمی cron (`jobId`, `schedule.cron`, فیلدهای سطح‌بالای delivery/payload، payload `provider`، jobهای ساده fallback برای webhook با `notify: true`).
    - مهاجرت قدیمی سیاست زمان اجرای agent به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی کهنه Plugin وقتی plugins فعال هستند؛ وقتی `plugins.enabled=false`، ارجاع‌های کهنه Plugin به‌عنوان پیکربندی محصورسازی غیرفعال در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="State and integrity">
    - بازرسی فایل قفل session و پاک‌سازی قفل‌های کهنه.
    - تعمیر transcript مربوط به session برای شاخه‌های تکراری prompt-rewrite که توسط buildهای متأثر 2026.4.24 ایجاد شده‌اند.
    - شناسایی tombstone بازیابی-راه‌اندازی‌مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌کردن flagهای کهنه بازیابی abort‌شده تا startup همچنان child را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (sessions، transcripts، state dir).
    - بررسی‌های مجوز فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای نزدیک به انقضا را refresh کند، و وضعیت‌های cooldown/disabled مربوط به auth-profile را گزارش می‌دهد.
    - شناسایی workspace dir اضافه (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - تعمیر image مربوط به sandbox وقتی sandboxing فعال است.
    - مهاجرت سرویس قدیمی و شناسایی Gateway اضافه.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های زمان اجرای Gateway (سرویس نصب شده اما در حال اجرا نیست؛ label کش‌شده launchd).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا probe می‌شود).
    - بررسی‌های پاسخ‌گویی WhatsApp برای سلامت تضعیف‌شده event-loop در Gateway با clientهای TUI محلی که هنوز در حال اجرا هستند؛ `--fix` فقط clientهای TUI محلی تأییدشده را متوقف می‌کند.
    - تعمیر مسیر Codex برای ارجاع‌های مدل قدیمی `openai-codex/*` در مدل‌های اصلی، fallbackها، overrideهای heartbeat/subagent/compaction، hookها، overrideهای مدل کانال، و pinهای مسیر session؛ `--fix` آن‌ها را به `openai/*` بازنویسی می‌کند و فقط وقتی Plugin مربوط به Codex نصب، فعال، دارای harness با نام `codex`، و دارای OAuth قابل استفاده باشد، `agentRuntime.id: "codex"` را انتخاب می‌کند. در غیر این صورت `agentRuntime.id: "pi"` را انتخاب می‌کند.
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy تعبیه‌شده برای سرویس‌های Gateway که مقدارهای shell مربوط به `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را هنگام نصب یا به‌روزرسانی ثبت کرده‌اند.
    - بررسی‌های بهترین‌روش زمان اجرای Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی تداخل port مربوط به Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی هیچ منبع token وجود ندارد، تولید token را پیشنهاد می‌دهد؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - شناسایی مشکلات device pairing (درخواست‌های pair بار اول در انتظار، ارتقاهای role/scope در انتظار، drift کش کهنه local device-token، و drift احراز هویت paired-record).

  </Accordion>
  <Accordion title="Workspace and shell">
    - بررسی systemd linger در Linux.
    - بررسی اندازه فایل bootstrap مربوط به workspace (هشدارهای truncation/نزدیک‌بودن به limit برای فایل‌های context).
    - بررسی آمادگی Skills برای agent پیش‌فرض؛ skillهای مجاز با نیازمندی‌های bin، env، config، یا OS مفقود را گزارش می‌دهد، و `--fix` می‌تواند skillهای در دسترس نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت shell completion و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding برای جست‌وجوی memory (مدل محلی، API key ریموت، یا binary مربوط به QMD).
    - بررسی‌های نصب از source (ناهماهنگی pnpm workspace، assetهای UI مفقود، binary مفقود tsx).
    - پیکربندی به‌روزشده + metadata مربوط به wizard را می‌نویسد.

  </Accordion>
</AccordionGroup>

## backfill و reset مربوط به Dreams UI

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset**، و **Clear Grounded** برای گردش کار dreaming مبتنی بر grounded است. این اقدام‌ها از متدهای RPC به سبک doctor در Gateway استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI در `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر grounded REM diary را اجرا می‌کند، و entryهای backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان entryهای diary نشانه‌گذاری‌شده برای backfill را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط entryهای کوتاه‌مدت staged و فقط-grounded را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه انباشته نکرده‌اند.

کاری که خودشان انجام **نمی‌دهند**:

- آن‌ها `MEMORY.md` را ویرایش نمی‌کنند
- آن‌ها مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- آن‌ها به‌طور خودکار candidateهای grounded را در store زنده ارتقای کوتاه‌مدت stage نمی‌کنند، مگر اینکه ابتدا مسیر staged CLI را صریحاً اجرا کنید

اگر می‌خواهید replay تاریخی grounded بر lane معمول deep promotion اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار candidateهای durable و grounded را در store کوتاه‌مدت dreaming stage می‌کند، در حالی که `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار و منطق تفصیلی

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. Config normalization">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override مخصوص کانال)، doctor آن‌ها را به شِمای فعلی نرمال می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی گفتار عمومی فعلی Talk برابر است با `talk.provider` + `talk.providers.<provider>`، و پیکربندی صدای realtime برابر است با `talk.realtime.*`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را به map ارائه‌دهنده بازنویسی می‌کند، و selectorهای realtime سطح‌بالای قدیمی (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) را به `talk.realtime` بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` خالی نیست و سیاست ابزار از
    entryهای wildcard یا ابزارهای متعلق به Plugin استفاده می‌کند هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهایی
    از pluginهایی match می‌شود که واقعاً load می‌شوند؛ از allowlist انحصاری Plugin
    عبور نمی‌کند. Doctor برای پیکربندی‌های allowlist قدیمی مهاجرت‌کرده
    `plugins.bundledDiscovery: "compat"` را می‌نویسد تا رفتار موجود providerهای bundled حفظ شود، و
    سپس به تنظیم سخت‌گیرانه‌تر `"allowlist"` اشاره می‌کند.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با شِمای به‌روزشده بازنویسی می‌کند.

    startup مربوط به Gateway قالب‌های پیکربندی قدیمی را رد می‌کند و از شما می‌خواهد `openclaw doctor --fix` را اجرا کنید؛ در startup فایل `openclaw.json` را بازنویسی نمی‌کند. مهاجرت‌های store مربوط به Cron job نیز توسط `openclaw doctor --fix` انجام می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - پیکربندی‌های کانال پیکربندی‌شده که سیاست پاسخ قابل‌مشاهده ندارند → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` در سطح بالایی
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` قدیمی → `talk.provider` + `talk.providers.<provider>`
    - انتخاب‌گرهای realtime Talk قدیمی در سطح بالایی (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - برای کانال‌هایی که `accounts` نام‌دار دارند اما هنوز مقدارهای کانال تک‌حسابی در سطح بالایی باقی مانده است، آن مقدارهای محدود به حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند هدف نام‌دار/پیش‌فرض مطابق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای timeoutهای کند provider/model از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم relay افزونه قدیمی)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی Gateway همچنین providerهایی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده است، به‌جای شکست بسته نادیده می‌گیرد)

    هشدارهای Doctor همچنین راهنمایی account-default را برای کانال‌های چندحسابی شامل می‌شوند:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که مسیریابی fallback می‌تواند حساب غیرمنتظره‌ای را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی شناسه حساب ناشناخته‌ای تنظیم شده باشد، doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. لغوهای provider در OpenCode">
    اگر `models.providers.opencode`، `opencode-zen`، یا `opencode-go` را به‌صورت دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را override می‌کند. این می‌تواند مدل‌ها را به API اشتباه وادار کند یا هزینه‌ها را صفر کند. Doctor هشدار می‌دهد تا بتوانید override را حذف کنید و مسیریابی API + هزینه‌های هر مدل را بازیابی کنید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر افزونه Chrome حذف‌شده اشاره می‌کند، doctor آن را به مدل attach فعلی Chrome MCP محلیِ میزبان نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    Doctor همچنین مسیر Chrome MCP محلیِ میزبان را وقتی از `defaultProfile: "user"` یا یک پروفایل `existing-session` پیکربندی‌شده استفاده می‌کنید بررسی می‌کند:

    - بررسی می‌کند آیا Google Chrome برای پروفایل‌های auto-connect پیش‌فرض روی همان میزبان نصب شده است
    - نسخه شناسایی‌شده Chrome را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند remote debugging را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    Doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلیِ میزبان همچنان نیاز دارد به:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان gateway/node
    - مرورگری که به‌صورت محلی در حال اجرا باشد
    - remote debugging فعال در آن مرورگر
    - تأیید نخستین درخواست consent برای attach در مرورگر

    آمادگی در اینجا فقط مربوط به پیش‌نیازهای attach محلی است. Existing-session محدودیت‌های فعلی مسیر Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود، و کنش‌های batch همچنان به مرورگر مدیریت‌شده یا پروفایل raw CDP نیاز دارند.

    این بررسی به Docker، sandbox، remote-browser، یا جریان‌های headless دیگر اعمال نمی‌شود. آن‌ها همچنان از raw CDP استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای OAuth TLS">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، doctor endpoint مجوزدهی OpenAI را probe می‌کند تا تأیید کند stack محلی Node/OpenSSL TLS می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر probe با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده، یا گواهی self-signed)، doctor راهنمای رفع مشکل ویژه پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، رفع مشکل معمولاً `brew postinstall ca-certificates` است. با `--deep`، probe حتی اگر Gateway سالم باشد اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. لغوهای provider در Codex OAuth">
    اگر قبلاً تنظیمات transport قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر provider داخلی Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند تحت‌الشعاع قرار دهند. Doctor وقتی آن تنظیمات transport قدیمی را در کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید override منسوخ transport را حذف یا بازنویسی کنید و رفتار داخلی routing/fallback را بازگردانید. پروکسی‌های سفارشی و overrideهای فقط-header همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. تعمیر مسیر Codex">
    Doctor وجود refs مدل قدیمی `openai-codex/*` را بررسی می‌کند. مسیریابی harness بومی Codex از refs مدل canonical `openai/*` به‌همراه `agentRuntime.id: "codex"` استفاده می‌کند تا نوبت از harness app-server مربوط به Codex عبور کند، نه مسیر OpenClaw PI OpenAI.

    در حالت `--fix` / `--repair`، doctor refs مربوط به default-agent و هر agent را بازنویسی می‌کند، از جمله مدل‌های اصلی، fallbacks، overrideهای heartbeat/subagent/compaction، hooks، overrideهای مدل کانال، و وضعیت مسیر session پایدار قدیمی:

    - `openai-codex/gpt-*` به `openai/gpt-*` تبدیل می‌شود.
    - runtime agent مطابق فقط وقتی Codex نصب، فعال، دارای harness `codex`، و دارای OAuth قابل‌استفاده باشد به `agentRuntime.id: "codex"` تبدیل می‌شود.
    - در غیر این صورت runtime agent مطابق به `agentRuntime.id: "pi"` تبدیل می‌شود.
    - فهرست‌های fallback مدل موجود با بازنویسی ورودی‌های قدیمی‌شان حفظ می‌شوند؛ تنظیمات کپی‌شده هر مدل از کلید قدیمی به کلید canonical `openai/*` منتقل می‌شوند.
    - `modelProvider`/`providerOverride`، `model`/`modelOverride`، اعلان‌های fallback، pinهای auth-profile، و pinهای harness مربوط به Codex در session پایدار، در تمام storeهای session agent کشف‌شده تعمیر می‌شوند.
    - `/codex ...` یعنی «کنترل یا bind کردن یک گفت‌وگوی بومی Codex از chat.»
    - `/acp ...` یا `runtime: "acp"` یعنی «استفاده از adapter خارجی ACP/acpx.»

  </Accordion>
  <Accordion title="2g. پاک‌سازی مسیر session">
    Doctor همچنین storeهای session agent کشف‌شده را برای وضعیت مسیر auto-created منسوخ پس از جابه‌جایی مدل‌های پیکربندی‌شده یا runtime از یک مسیر متعلق به Plugin مانند Codex اسکن می‌کند.

    `openclaw doctor --fix` می‌تواند وضعیت منسوخ auto-created مانند pinهای مدل `modelOverrideSource: "auto"`، metadata مدل runtime، شناسه‌های harness پین‌شده، bindingهای session در CLI، و overrideهای auto auth-profile را وقتی مسیر مالک آن‌ها دیگر پیکربندی نشده است پاک کند. انتخاب‌های صریح کاربر یا مدل session قدیمی برای بازبینی دستی گزارش می‌شوند و دست‌نخورده باقی می‌مانند؛ وقتی آن مسیر دیگر مدنظر نیست، آن‌ها را با `/model ...`، `/new`، یا reset کردن session تغییر دهید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    Doctor می‌تواند چیدمان‌های قدیمی‌تر روی دیسک را به ساختار فعلی مهاجرت دهد:

    - Sessions store + transcripts:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری Agent:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت auth در WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها best-effort و idempotent هستند؛ doctor وقتی هر پوشه قدیمی را به‌عنوان backup باقی بگذارد هشدار منتشر می‌کند. Gateway/CLI همچنین sessions + agent dir قدیمی را هنگام راه‌اندازی به‌صورت خودکار مهاجرت می‌دهد تا history/auth/models بدون اجرای دستی doctor در مسیر هر agent قرار بگیرند. احراز هویت WhatsApp عمداً فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. نرمال‌سازی Talk provider/provider-map اکنون بر پایه برابری ساختاری مقایسه می‌کند، بنابراین diffهایی که فقط از ترتیب کلیدها ناشی می‌شوند دیگر باعث تغییرات تکراری و بی‌اثر `doctor --fix` نمی‌شوند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های manifest قدیمی Plugin">
    Doctor همه manifestهای Plugin نصب‌شده را برای کلیدهای capability منسوخ در سطح بالایی (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌کند آن‌ها را به object `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقدارها را داشته باشد، کلید قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های cron store قدیمی">
    Doctor همچنین cron job store را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی override شده باشد) برای شکل‌های job قدیمی که scheduler همچنان برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی cron شامل موارد زیر است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload در سطح بالایی (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای delivery در سطح بالایی (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - aliasهای delivery مربوط به payload `provider` → `delivery.channel` صریح
    - jobهای fallback webhook قدیمی ساده با `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    Doctor فقط jobهای `notify: true` را زمانی به‌طور خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر یک job fallback قدیمی notify را با یک حالت تحویل غیرWebhook موجود ترکیب کند، doctor هشدار می‌دهد و آن job را برای بازبینی دستی باقی می‌گذارد.

    در Linux، doctor همچنین زمانی هشدار می‌دهد که crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را فراخوانی کند. آن اسکریپت محلی میزبان توسط نسخه فعلی OpenClaw نگهداری نمی‌شود و وقتی cron نتواند به systemd user bus دسترسی پیدا کند، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی قدیمی crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor`، و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    Doctor هر دایرکتوری نشست عامل را برای فایل‌های write-lock مانده اسکن می‌کند — فایل‌هایی که وقتی یک نشست به‌صورت غیرعادی خارج شده باقی مانده‌اند. برای هر فایل قفل پیدا‌شده، این موارد را گزارش می‌کند: مسیر، PID، اینکه PID هنوز زنده است یا نه، سن قفل، و اینکه آیا مانده محسوب می‌شود یا نه (PID مرده یا قدیمی‌تر از ۳۰ دقیقه). در حالت `--fix` / `--repair` فایل‌های قفل مانده را به‌طور خودکار حذف می‌کند؛ در غیر این صورت یادداشتی چاپ می‌کند و از شما می‌خواهد دوباره با `--fix` اجرا کنید.
  </Accordion>
  <Accordion title="3d. ترمیم شاخه transcript نشست">
    Doctor فایل‌های JSONL نشست عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی transcript پرامپت 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با context داخلی runtime OpenClaw به‌علاوه یک sibling فعال که همان پرامپت قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل آسیب‌دیده کنار نسخه اصلی پشتیبان می‌گیرد و transcript را به شاخه فعال بازنویسی می‌کند تا تاریخچه Gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی state (ماندگاری نشست، مسیریابی، و ایمنی)">
    دایرکتوری state مرکز عملیاتی حیاتی است. اگر ناپدید شود، نشست‌ها، credentialها، لاگ‌ها، و config را از دست می‌دهید (مگر اینکه جای دیگری پشتیبان داشته باشید).

    Doctor بررسی می‌کند:

    - **نبود دایرکتوری state**: درباره از دست رفتن فاجعه‌بار state هشدار می‌دهد، برای ایجاد دوباره دایرکتوری درخواست تأیید می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری state**: قابلیت نوشتن را تأیید می‌کند؛ پیشنهاد ترمیم مجوزها را می‌دهد (و وقتی ناهماهنگی owner/group تشخیص داده شود، یک راهنمای `chown` منتشر می‌کند).
    - **دایرکتوری state همگام‌شده با cloud در macOS**: وقتی state زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای پشتوانه‌دار با همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های lock/sync شوند.
    - **دایرکتوری state روی SD یا eMMC در Linux**: وقتی state به یک منبع mount از نوع `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی مبتنی بر SD یا eMMC می‌تواند زیر نوشتن نشست و credential کندتر باشد و سریع‌تر فرسوده شود.
    - **نبود دایرکتوری‌های نشست**: `sessions/` و دایرکتوری ذخیره نشست برای ماندگار کردن تاریخچه و جلوگیری از کرش‌های `ENOENT` لازم هستند.
    - **ناهماهنگی transcript**: وقتی ورودی‌های نشست اخیر فایل‌های transcript گمشده داشته باشند هشدار می‌دهد.
    - **نشست اصلی "JSONL تک‌خطی"**: وقتی transcript اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه انباشته نمی‌شود).
    - **چند دایرکتوری state**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های home وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآور حالت remote**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند که آن را روی میزبان remote اجرا کنید (state آنجا قرار دارد).
    - **مجوزهای فایل config**: اگر `~/.openclaw/openclaw.json` برای group/world قابل خواندن باشد هشدار می‌دهد و پیشنهاد محدود کردن آن به `600` را می‌دهد.

  </Accordion>
  <Accordion title="5. سلامت auth مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در ذخیره‌گاه auth بررسی می‌کند، وقتی tokenها در حال انقضا/منقضی‌شده هستند هشدار می‌دهد، و وقتی ایمن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل OAuth/token مربوط به Anthropic کهنه باشد، یک کلید API Anthropic یا مسیر setup-token Anthropic را پیشنهاد می‌کند. promptهای refresh فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی refresh OAuth به‌طور دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا اینکه یک provider به شما بگوید دوباره وارد شوید)، doctor گزارش می‌دهد که auth دوباره لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های auth را گزارش می‌کند که به‌طور موقت به این دلایل غیرقابل استفاده هستند:

    - cooldownهای کوتاه (rate limitها/timeoutها/شکست‌های auth)
    - disableهای طولانی‌تر (شکست‌های billing/credit)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor reference مدل را در برابر catalog و allowlist اعتبارسنجی می‌کند و وقتی resolve نشود یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. ترمیم image sandbox">
    وقتی sandboxing فعال باشد، doctor imageهای Docker را بررسی می‌کند و در صورت نبود image فعلی، پیشنهاد build یا تغییر به نام‌های قدیمی را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    Doctor در حالت `openclaw doctor --fix` / `openclaw doctor --repair` state staging وابستگی Plugin تولیدشده قدیمی OpenClaw را حذف می‌کند. این شامل ریشه‌های وابستگی تولیدشده مانده، دایرکتوری‌های قدیمی install-stage، بقایای محلی package از کد ترمیم وابستگی bundled-plugin قدیمی، و کپی‌های npm مدیریت‌شده orphaned یا recovered از Pluginهای bundled `@openclaw/*` است که می‌توانند manifest bundled فعلی را shadow کنند.

    Doctor همچنین می‌تواند Pluginهای دانلودشدنی گمشده را وقتی config به آن‌ها reference می‌دهد اما registry محلی Plugin نمی‌تواند آن‌ها را پیدا کند، دوباره نصب کند. نمونه‌ها شامل `plugins.entries` مادی، تنظیمات channel/provider/search پیکربندی‌شده، و runtimeهای عامل پیکربندی‌شده هستند. هنگام به‌روزرسانی package، doctor از اجرای ترمیم Plugin با package-manager در زمانی که package اصلی در حال جایگزینی است اجتناب می‌کند؛ اگر پس از به‌روزرسانی یک Plugin پیکربندی‌شده هنوز به بازیابی نیاز دارد، دوباره `openclaw doctor --fix` را اجرا کنید. startup Gateway و reload config package managerها را اجرا نمی‌کنند؛ نصب Pluginها همچنان کار صریح doctor/install/update باقی می‌ماند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنمایی‌های پاک‌سازی">
    Doctor سرویس‌های قدیمی gateway (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد حذف آن‌ها و نصب سرویس OpenClaw با پورت Gateway فعلی را می‌دهد. همچنین می‌تواند سرویس‌های اضافی شبیه gateway را اسکن کند و راهنمایی‌های پاک‌سازی چاپ کند. سرویس‌های Gateway OpenClaw با نام profile، first-class محسوب می‌شوند و به‌عنوان "اضافی" علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس gateway سطح کاربر گمشده باشد اما یک سرویس Gateway OpenClaw سطح سیستم وجود داشته باشد، doctor به‌طور خودکار سرویس سطح کاربر دوم نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس duplicate را حذف کنید یا وقتی یک supervisor سیستمی lifecycle gateway را در اختیار دارد، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Startup Matrix">
    وقتی یک حساب channel در Matrix یک مهاجرت state قدیمی pending یا actionable داشته باشد، doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس مراحل مهاجرت best-effort را اجرا می‌کند: مهاجرت state قدیمی Matrix و آماده‌سازی encrypted-state قدیمی. هر دو مرحله غیرکشنده هستند؛ خطاها لاگ می‌شوند و startup ادامه پیدا می‌کند. در حالت read-only (`openclaw doctor` بدون `--fix`) این بررسی کاملاً رد می‌شود.
  </Accordion>
  <Accordion title="8c. Pairing دستگاه و drift auth">
    Doctor اکنون state مربوط به device-pairing را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌کند:

    - درخواست‌های pending برای pairing نخستین‌بار
    - upgradeهای pending نقش برای دستگاه‌هایی که قبلاً paired شده‌اند
    - upgradeهای pending scope برای دستگاه‌هایی که قبلاً paired شده‌اند
    - ترمیم‌های ناهماهنگی public-key که در آن id دستگاه هنوز مطابقت دارد اما identity دستگاه دیگر با رکورد تأییدشده مطابقت ندارد
    - رکوردهای paired که برای یک نقش تأییدشده token فعال ندارند
    - tokenهای paired که scopeهایشان از baseline pairing تأییدشده drift کرده‌اند
    - ورودی‌های cached محلی device-token برای ماشین فعلی که پیش از rotation token سمت gateway هستند یا metadata scope کهنه دارند

    Doctor درخواست‌های pair را auto-approve نمی‌کند و device tokenها را auto-rotate نمی‌کند. در عوض گام‌های بعدی دقیق را چاپ می‌کند:

    - درخواست‌های pending را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک token تازه را با `openclaw devices rotate --device <deviceId> --role <role>` rotate کنید
    - یک رکورد کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره approve کنید

    این حفره رایج "قبلاً paired شده اما هنوز pairing required دریافت می‌شود" را می‌بندد: doctor اکنون pairing نخستین‌بار را از upgradeهای pending نقش/scope و از drift کهنه token/device-identity متمایز می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک provider بدون allowlist برای DMها باز باشد، یا وقتی یک policy به شکلی خطرناک پیکربندی شده باشد، هشدار منتشر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، doctor اطمینان می‌دهد lingering فعال است تا gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (Skills، Pluginها، و دایرکتوری‌های قدیمی)">
    Doctor خلاصه‌ای از state workspace را برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: skillsهای eligible، missing-requirements، و allowlist-blocked را می‌شمارد.
    - **دایرکتوری‌های workspace قدیمی**: وقتی `~/openclaw` یا دایرکتوری‌های workspace قدیمی دیگر کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای enabled/disabled/errored را می‌شمارد؛ برای هر خطا Plugin IDها را فهرست می‌کند؛ قابلیت‌های bundle plugin را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را علامت‌گذاری می‌کند که با runtime فعلی مشکل سازگاری دارند.
    - **Diagnostics Plugin**: هر warning یا error زمان load منتشرشده توسط registry Plugin را آشکار می‌کند.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا فایل‌های context تزریق‌شده دیگر) نزدیک یا بالاتر از بودجه کاراکتر پیکربندی‌شده هستند یا نه. برای هر فایل شمار کاراکتر raw در برابر injected، درصد truncation، علت truncation (`max/file` یا `max/total`)، و مجموع کاراکترهای injected را به‌عنوان کسری از کل بودجه گزارش می‌کند. وقتی فایل‌ها truncate شده باشند یا نزدیک حد باشند، doctor نکته‌هایی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کانال مانده">
    وقتی `openclaw doctor --fix` یک Plugin کانال گمشده را حذف می‌کند، config آویزان scoped به کانال را هم که به آن Plugin reference می‌داد حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های Heartbeat که نام کانال را داشتند، و overrideهای `agents.*.models["<channel>/*"]`. این از boot loopهای Gateway جلوگیری می‌کند، جایی که runtime کانال حذف شده اما config هنوز از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند که آیا tab completion برای shell فعلی نصب شده است یا نه (zsh، bash، fish، یا PowerShell):

    - اگر profile shell از الگوی completion پویا و کند (`source <(openclaw completion ...)`) استفاده کند، doctor آن را به variant سریع‌تر فایل cached ارتقا می‌دهد.
    - اگر completion در profile پیکربندی شده باشد اما فایل cache گمشده باشد، doctor cache را به‌طور خودکار دوباره تولید می‌کند.
    - اگر هیچ completionای اصلاً پیکربندی نشده باشد، doctor برای نصب آن prompt می‌دهد (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای تولید دوباره cache به‌صورت دستی، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های auth Gateway (token محلی)">
    Doctor آمادگی auth token محلی gateway را بررسی می‌کند.

    - اگر حالت token به token نیاز داشته باشد و هیچ منبع token وجود نداشته باشد، doctor پیشنهاد تولید یکی را می‌دهد.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما در دسترس نباشد، doctor هشدار می‌دهد و آن را با plaintext overwrite نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط زمانی generation را اجبار می‌کند که هیچ token SecretRef پیکربندی نشده باشد.

  </Accordion>
  <Accordion title="12b. ترمیم‌های فقط‌خواندنی آگاه از SecretRef">
    برخی جریان‌های ترمیم باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار شکست سریع زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` اکنون از همان مدل خلاصه فقط‌خواندنی SecretRef مانند فرمان‌های خانواده وضعیت برای ترمیم‌های هدفمند پیکربندی استفاده می‌کند.
    - مثال: ترمیم Telegram `allowFrom` / `groupAllowFrom` `@username` تلاش می‌کند در صورت موجود بودن، از اعتبارنامه‌های ربات پیکربندی‌شده استفاده کند.
    - اگر توکن ربات Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، doctor گزارش می‌دهد که اعتبارنامه پیکربندی شده اما در دسترس نیست و به‌جای خراب شدن یا گزارش نادرست توکن به‌عنوان مفقود، رفع خودکار را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی مجدد">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی مجدد آن را می‌دهد.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند که آیا ارائه‌دهنده embedding جست‌وجوی حافظه پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و ارائه‌دهنده پیکربندی‌شده بستگی دارد:

    - **backend QMD**: بررسی می‌کند که آیا باینری `qmd` موجود و قابل راه‌اندازی است یا نه. اگر نباشد، راهنمای رفع شامل بسته npm و گزینه مسیر دستی باینری را چاپ می‌کند.
    - **ارائه‌دهنده محلی صریح**: وجود فایل مدل محلی یا URL مدل راه‌دور/قابل‌دانلود شناخته‌شده را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌کند به یک ارائه‌دهنده راه‌دور تغییر دهید.
    - **ارائه‌دهنده راه‌دور صریح** (`openai`، `voyage` و غیره): تأیید می‌کند که یک کلید API در محیط یا مخزن احراز هویت وجود دارد. اگر موجود نباشد، راهنمای رفع قابل‌اقدام چاپ می‌کند.
    - **ارائه‌دهنده خودکار**: ابتدا دسترس‌پذیری مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهنده راه‌دور را به‌ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی نتیجه probe کش‌شده Gateway موجود باشد (Gateway در زمان بررسی سالم بوده است)، doctor نتیجه آن را با پیکربندی قابل‌مشاهده برای CLI تطبیق می‌دهد و هر ناسازگاری را یادآوری می‌کند. Doctor در مسیر پیش‌فرض یک embedding ping تازه شروع نمی‌کند؛ وقتی بررسی زنده ارائه‌دهنده می‌خواهید، از فرمان وضعیت عمیق حافظه استفاده کنید.

    برای تأیید آمادگی embedding در زمان اجرا از `openclaw memory status --deep` استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را با رفع‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. ممیزی + ترمیم پیکربندی supervisor">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های مفقود یا قدیمی بررسی می‌کند (مثلاً وابستگی‌های systemd به network-online و تأخیر راه‌اندازی مجدد). وقتی ناسازگاری پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل service/task را به پیش‌فرض‌های فعلی بازنویسی کند.

    نکات:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` درخواست‌های پیش‌فرض ترمیم را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های توصیه‌شده را بدون درخواست تأیید اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor را برای چرخه عمر service مربوط به Gateway فقط‌خواندنی نگه می‌دارد. همچنان سلامت service را گزارش می‌دهد و ترمیم‌های غیر-service را اجرا می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap service، بازنویسی پیکربندی supervisor، و پاک‌سازی service قدیمی را رد می‌کند چون یک supervisor خارجی مالک آن چرخه عمر است.
    - در Linux، وقتی unit منطبق systemd مربوط به Gateway فعال است، doctor metadata فرمان/entrypoint را بازنویسی نمی‌کند. همچنین هنگام اسکن service تکراری، unitهای اضافی غیرفعال غیرقدیمی شبیه Gateway را نادیده می‌گیرد تا فایل‌های service همراه باعث نویز پاک‌سازی نشوند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/ترمیم service توسط doctor، SecretRef را اعتبارسنجی می‌کند اما مقدار توکن plaintext حل‌شده را در metadata محیط service مربوط به supervisor ذخیره نمی‌کند.
    - Doctor مقادیر محیط service مدیریت‌شده مبتنی بر `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd یا Windows Scheduled Task به‌صورت درون‌خطی embed کرده‌اند تشخیص می‌دهد و metadata service را بازنویسی می‌کند تا آن مقادیر به‌جای تعریف supervisor از منبع زمان اجرا بارگذاری شوند.
    - Doctor تشخیص می‌دهد که چه زمانی فرمان service پس از تغییر `gateway.port` همچنان یک `--port` قدیمی را pin کرده است و metadata service را به پورت فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل نشده باشد، doctor مسیر نصب/ترمیم را با راهنمایی قابل‌اقدام مسدود می‌کند.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/ترمیم را تا زمانی که mode صریحاً تنظیم شود مسدود می‌کند.
    - برای unitهای user-systemd در Linux، بررسی‌های drift توکن doctor اکنون هنگام مقایسه metadata احراز هویت service، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شوند.
    - ترمیم‌های service توسط Doctor از بازنویسی، توقف یا راه‌اندازی مجدد یک service مربوط به Gateway از یک باینری قدیمی‌تر OpenClaw خودداری می‌کنند وقتی پیکربندی آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="16. عیب‌یابی زمان اجرای Gateway + پورت">
    Doctor زمان اجرای service را بررسی می‌کند (PID، آخرین وضعیت خروج) و وقتی service نصب شده اما واقعاً در حال اجرا نیست، هشدار می‌دهد. همچنین collision پورت را روی پورت Gateway (پیش‌فرض `18789`) بررسی می‌کند و علت‌های محتمل را گزارش می‌دهد (Gateway از قبل در حال اجرا است، تونل SSH).
  </Accordion>
  <Accordion title="17. بهترین روش‌های زمان اجرای Gateway">
    Doctor وقتی service مربوط به Gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای مدیر نسخه می‌توانند پس از ارتقا خراب شوند چون service init پوسته شما را بارگذاری نمی‌کند. Doctor پیشنهاد می‌دهد وقتی نصب system Node موجود باشد (Homebrew/apt/choco)، به آن مهاجرت کنید.

    LaunchAgentهای macOS که تازه نصب یا ترمیم شده‌اند به‌جای کپی کردن PATH پوسته تعاملی، از یک PATH متعارف سیستم (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین Volta، asdf، fnm، pnpm و سایر دایرکتوری‌های مدیر نسخه، این‌که فرایندهای فرزند کدام Node را resolve کنند تغییر نمی‌دهند. سرویس‌های Linux همچنان ریشه‌های محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های پایدار user-bin را نگه می‌دارند، اما دایرکتوری‌های fallback حدسی مدیر نسخه فقط وقتی در PATH سرویس نوشته می‌شوند که آن دایرکتوری‌ها روی دیسک وجود داشته باشند.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + metadata جادوگر">
    Doctor هر تغییر پیکربندی را ذخیره می‌کند و metadata جادوگر را برای ثبت اجرای doctor مهر می‌زند.
  </Accordion>
  <Accordion title="19. نکته‌های فضای کاری (پشتیبان‌گیری + سیستم حافظه)">
    Doctor وقتی سیستم حافظه فضای کاری وجود نداشته باشد آن را پیشنهاد می‌کند و اگر فضای کاری از قبل زیر git نباشد، یک نکته پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار فضای کاری و پشتیبان‌گیری git (GitHub یا GitLab خصوصی توصیه‌شده)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook مربوط به Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
