---
read_when:
    - افزودن یا اصلاح مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل تعمیر'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-12T08:46:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. این ابزار پیکربندی/وضعیت قدیمی را اصلاح می‌کند، سلامت را بررسی می‌کند، و گام‌های تعمیر قابل اقدام ارائه می‌دهد.

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

    پیش‌فرض‌ها را بدون پرسش بپذیرید (از جمله گام‌های تعمیر راه‌اندازی مجدد/سرویس/سندباکس، در صورت کاربرد).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تعمیرهای پیشنهادی را بدون پرسش اعمال کنید (تعمیرها + راه‌اندازی‌های مجدد در موارد امن).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    تعمیرهای تهاجمی را نیز اعمال کنید (پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    بدون پرسش اجرا کنید و فقط مهاجرت‌های امن را اعمال کنید (نرمال‌سازی پیکربندی + جابه‌جایی‌های وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/سندباکس را که نیازمند تأیید انسانی هستند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌صورت خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های Gateway اضافی اسکن کنید (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید پیش از نوشتن، تغییرات را بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## چه کاری انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، رابط کاربری، و به‌روزرسانی‌ها">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل رابط کاربری (وقتی schema پروتکل جدیدتر باشد، Control UI را بازسازی می‌کند).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/موجود نیست/مسدود) و وضعیت Plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - نرمال‌سازی پیکربندی برای مقدارهای قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای override ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌اندازی OAuth در Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OpenAI Codex OAuth.
    - هشدارهای allowlist برای Plugin/ابزار وقتی `plugins.allow` محدودکننده است اما سیاست ابزار همچنان wildcard یا ابزارهای متعلق به Plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/WhatsApp auth).
    - مهاجرت کلیدهای قرارداد manifest قدیمی Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت store قدیمی cron (`jobId`, `schedule.cron`, فیلدهای سطح‌بالای delivery/payload، payload `provider`، کارهای fallback ساده webhook با `notify: true`).
    - پاک‌سازی runtime-policy قدیمی کل agent؛ سیاست زمان اجرای ارائه‌دهنده/مدل، انتخابگر مسیر فعال است.
    - پاک‌سازی پیکربندی قدیمی Plugin وقتی Pluginها فعال هستند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های قدیمی Plugin به‌عنوان پیکربندی مهار بی‌اثر در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل lock نشست و پاک‌سازی lockهای قدیمی.
    - تعمیر transcript نشست برای شاخه‌های prompt-rewrite تکراری که توسط buildهای متأثر 2026.4.24 ایجاد شده‌اند.
    - شناسایی tombstone بازیابی پس از راه‌اندازی مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌کردن پرچم‌های بازیابی لغوشده قدیمی تا startup همچنان child را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (نشست‌ها، transcriptها، پوشه وضعیت).
    - بررسی‌های مجوز فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای در آستانه انقضا را تازه‌سازی کند، و وضعیت‌های cooldown/disabled پروفایل احراز هویت را گزارش می‌دهد.
    - شناسایی پوشه workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و supervisorها">
    - تعمیر تصویر سندباکس وقتی sandboxing فعال است.
    - مهاجرت سرویس قدیمی و شناسایی Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های زمان اجرای Gateway (سرویس نصب شده اما اجرا نمی‌شود؛ label ذخیره‌شده launchd).
    - هشدارهای وضعیت کانال (probeشده از Gateway در حال اجرا).
    - بررسی‌های مجوز ویژه کانال زیر `openclaw channels capabilities` قرار دارند؛ برای مثال، مجوزهای کانال صوتی Discord با `openclaw channels capabilities --channel discord --target channel:<channel-id>` ممیزی می‌شوند.
    - بررسی‌های پاسخ‌گویی WhatsApp برای سلامت افت‌کرده event-loop در Gateway در حالی که clientهای TUI محلی هنوز در حال اجرا هستند؛ `--fix` فقط clientهای TUI محلی تأییدشده را متوقف می‌کند.
    - تعمیر مسیر Codex برای refهای مدل قدیمی `openai-codex/*` در مدل‌های اصلی، fallbackها، overrideهای heartbeat/subagent/compaction، hookها، overrideهای مدل کانال، و pinهای مسیر نشست؛ `--fix` آن‌ها را به `openai/*` بازنویسی می‌کند، pinهای زمان اجرای نشست/کل agent قدیمی را حذف می‌کند، و refهای canonical agent OpenAI را روی Codex harness پیش‌فرض باقی می‌گذارد.
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy تعبیه‌شده برای سرویس‌های Gateway که مقدارهای shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را هنگام نصب یا به‌روزرسانی ثبت کرده‌اند.
    - بررسی‌های بهترین‌روش زمان اجرای Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی تداخل پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="احراز هویت، امنیت، و pair کردن">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی هیچ منبع token وجود ندارد تولید token را پیشنهاد می‌دهد؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - شناسایی مشکل pair کردن دستگاه (درخواست‌های pair اولین‌بار در انتظار، ارتقاهای role/scope در انتظار، drift cache قدیمی device-token محلی، و drift احراز هویت رکورد pairشده).

  </Accordion>
  <Accordion title="Workspace و shell">
    - بررسی systemd linger در Linux.
    - بررسی اندازه فایل bootstrap workspace (هشدارهای truncation/نزدیک به حد برای فایل‌های context).
    - بررسی آمادگی Skills برای agent پیش‌فرض؛ skillهای مجاز با bin، env، config، یا نیازمندی‌های OS مفقود را گزارش می‌دهد، و `--fix` می‌تواند skillهای ناموجود را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت تکمیل shell و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding جست‌وجوی حافظه (مدل محلی، کلید API راه‌دور، یا binary QMD).
    - بررسی‌های نصب از source (ناسازگاری pnpm workspace، assetهای UI مفقود، binary مفقود tsx).
    - پیکربندی به‌روزشده + metadata ویزارد را می‌نویسد.

  </Accordion>
</AccordionGroup>

## Backfill و reset رابط کاربری Dreams

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset**، و **Clear Grounded** برای workflow مربوط به grounded dreaming است. این اقدام‌ها از متدهای RPC به سبک Gateway doctor استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر grounded REM diary را اجرا می‌کند، و entryهای backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان entryهای diary مربوط به backfill علامت‌گذاری‌شده را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط entryهای کوتاه‌مدت staged و صرفاً grounded را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه انباشته نکرده‌اند.

کاری که به‌تنهایی انجام نمی‌دهند:

- `MEMORY.md` را ویرایش نمی‌کنند
- مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- نامزدهای grounded را به‌صورت خودکار در store زنده promotion کوتاه‌مدت stage نمی‌کنند، مگر اینکه ابتدا مسیر staged CLI را صراحتاً اجرا کنید

اگر می‌خواهید replay تاریخی grounded بر lane عادی promotion عمیق اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار نامزدهای بادوام grounded را در store کوتاه‌مدت dreaming stage می‌کند، در حالی که `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار دقیق و منطق

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیشنهاد می‌دهد پیش از اجرای doctor به‌روزرسانی انجام شود (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. نرمال‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override ویژه کانال)، doctor آن‌ها را به schema فعلی نرمال‌سازی می‌کند.

    این شامل فیلدهای تخت قدیمی Talk نیز می‌شود. پیکربندی عمومی فعلی گفتار Talk برابر است با `talk.provider` + `talk.providers.<provider>`، و پیکربندی صدای realtime برابر است با `talk.realtime.*`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را به map ارائه‌دهنده بازنویسی می‌کند، و selectorهای realtime سطح‌بالای قدیمی (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) را به `talk.realtime` بازنویسی می‌کند.

    Doctor همچنین زمانی هشدار می‌دهد که `plugins.allow` خالی نیست و سیاست ابزار از
    entryهای wildcard یا ابزارهای متعلق به Plugin استفاده می‌کند. `tools.allow: ["*"]` فقط با ابزارهای
    Pluginهایی match می‌شود که واقعاً load می‌شوند؛ این مورد allowlist انحصاری Plugin را دور نمی‌زند.
    Doctor برای پیکربندی‌های allowlist قدیمی مهاجرت‌داده‌شده، `plugins.bundledDiscovery: "compat"` را می‌نویسد تا رفتار موجود ارائه‌دهنده bundled حفظ شود، و
    سپس به تنظیم سخت‌گیرانه‌تر `"allowlist"` اشاره می‌کند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای deprecated باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شدند.
    - مهاجرت اعمال‌شده را نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با schema به‌روزشده بازنویسی می‌کند.

    راه‌اندازی Gateway فرمت‌های قدیمی پیکربندی را نمی‌پذیرد و از شما می‌خواهد `openclaw doctor --fix` را اجرا کنید؛ هنگام startup، `openclaw.json` را بازنویسی نمی‌کند. مهاجرت‌های store مربوط به کارهای Cron نیز توسط `openclaw doctor --fix` مدیریت می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - پیکربندی‌های کانال‌های پیکربندی‌شده که سیاست پاسخ قابل مشاهده را ندارند → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` سطح بالا
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` قدیمی → `talk.provider` + `talk.providers.<provider>`
    - گزینشگرهای realtime Talk سطح بالای قدیمی (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - برای کانال‌هایی با `accounts` نام‌گذاری‌شده اما مقادیر سطح بالای کانال تک‌حسابیِ باقی‌مانده، آن مقادیر با دامنه حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک هدف نام‌گذاری‌شده/پیش‌فرض منطبق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای مهلت‌های زمانی ارائه‌دهنده/مدل کند از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم relay افزونه قدیمی)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی Gateway همچنین ارائه‌دهندگانی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده باشد، به‌جای fail closed، رد می‌کند)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` را حذف کنید؛ app-server کدکس همیشه ابزارهای فضای کاری بومی کدکس را بومی نگه می‌دارد

    هشدارهای Doctor همچنین شامل راهنمایی پیش‌فرض حساب برای کانال‌های چندحسابی است:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که مسیریابی fallback می‌تواند حسابی غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی یک شناسه حساب ناشناخته تنظیم شده باشد، doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های ارائه‌دهنده OpenCode">
    اگر `models.providers.opencode`، `opencode-zen`، یا `opencode-go` را دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@earendil-works/pi-ai` را بازنویسی می‌کند. این می‌تواند مدل‌ها را مجبور کند روی API اشتباه قرار بگیرند یا هزینه‌ها را صفر کند. Doctor هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API + هزینه‌های مخصوص هر مدل را بازگردانید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر افزونه Chrome حذف‌شده اشاره می‌کند، doctor آن را به مدل اتصال Chrome MCP محلیِ میزبان فعلی نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    Doctor همچنین وقتی از `defaultProfile: "user"` یا یک نمایه `existing-session` پیکربندی‌شده استفاده می‌کنید، مسیر Chrome MCP محلیِ میزبان را ممیزی می‌کند:

    - بررسی می‌کند آیا Google Chrome برای نمایه‌های اتصال خودکار پیش‌فرض روی همان میزبان نصب شده است یا نه
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که remote debugging را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    Doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلیِ میزبان همچنان نیاز دارد به:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان Gateway/Node
    - اجرای محلی مرورگر
    - فعال بودن remote debugging در آن مرورگر
    - تأیید نخستین اعلان رضایت اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. Existing-session محدودیت‌های مسیر فعلی Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود، و اقدام‌های دسته‌ای همچنان به یک مرورگر مدیریت‌شده یا نمایه CDP خام نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser، یا دیگر جریان‌های headless اعمال **نمی‌شود**. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای OAuth TLS">
    وقتی یک نمایه OpenAI Codex OAuth پیکربندی شده باشد، doctor نقطه پایانی مجوزدهی OpenAI را کاوش می‌کند تا بررسی کند که پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر کاوش با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده، یا گواهی self-signed)، doctor راهنمای رفع مشکل مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، رفع مشکل معمولاً `brew postinstall ca-certificates` است. با `--deep`، کاوش حتی اگر Gateway سالم باشد اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های ارائه‌دهنده Codex OAuth">
    اگر قبلاً تنظیمات انتقال قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر ارائه‌دهنده داخلی Codex OAuth را که نسخه‌های جدیدتر به‌طور خودکار استفاده می‌کنند تحت‌الشعاع قرار دهند. Doctor وقتی آن تنظیمات انتقال قدیمی را در کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال کهنه را حذف یا بازنویسی کنید و رفتار مسیریابی/fallback داخلی را پس بگیرید. پراکسی‌های سفارشی و بازنویسی‌های فقط-هدر همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. تعمیر مسیر Codex">
    Doctor وجود ارجاع‌های مدل قدیمی `openai-codex/*` را بررسی می‌کند. مسیریابی هارنس بومی Codex از ارجاع‌های مدل canonical `openai/*` استفاده می‌کند؛ نوبت‌های عامل OpenAI به‌جای مسیر OpenClaw PI OpenAI از طریق هارنس app-server کدکس می‌گذرند.

    در حالت `--fix` / `--repair`، doctor ارجاع‌های عامل پیش‌فرض و هر عامل را بازنویسی می‌کند، از جمله مدل‌های اصلی، fallbackها، بازنویسی‌های heartbeat/subagent/compaction، hookها، بازنویسی‌های مدل کانال، و وضعیت مسیر نشست پایدارِ کهنه:

    - `openai-codex/gpt-*` به `openai/gpt-*` تبدیل می‌شود.
    - نیت Codex به ورودی‌های `agentRuntime.id: "codex"` با دامنه ارائه‌دهنده/مدل برای ارجاع‌های مدل عاملِ تعمیرشده منتقل می‌شود تا پس از تبدیل ارجاع مدل به `openai/*` همچنان بتوان نمایه‌های احراز هویت `openai-codex:...` را انتخاب کرد.
    - پیکربندی runtime کل عامل و پین‌های runtime نشست پایدارِ کهنه حذف می‌شوند، چون انتخاب runtime با دامنه ارائه‌دهنده/مدل انجام می‌شود.
    - سیاست runtime موجودِ ارائه‌دهنده/مدل حفظ می‌شود، مگر اینکه ارجاع مدل قدیمیِ تعمیرشده برای حفظ مسیر احراز هویت قدیمی به مسیریابی Codex نیاز داشته باشد.
    - فهرست‌های fallback مدل موجود با بازنویسی ورودی‌های قدیمی‌شان حفظ می‌شوند؛ تنظیمات مخصوص هر مدلِ کپی‌شده از کلید قدیمی به کلید canonical `openai/*` منتقل می‌شوند.
    - `modelProvider`/`providerOverride`، `model`/`modelOverride`، اعلان‌های fallback، و پین‌های نمایه احراز هویت نشست پایدار در همه مخزن‌های نشست عامل کشف‌شده تعمیر می‌شوند.
    - `/codex ...` یعنی «کنترل یا bind کردن یک گفت‌وگوی بومی Codex از چت.»
    - `/acp ...` یا `runtime: "acp"` یعنی «استفاده از adapter خارجی ACP/acpx.»

  </Accordion>
  <Accordion title="2g. پاک‌سازی مسیر نشست">
    Doctor همچنین مخزن‌های نشست عامل کشف‌شده را برای وضعیت مسیر خودکار ساخته‌شده کهنه پس از انتقال مدل‌های پیکربندی‌شده یا runtime از مسیر متعلق به Plugin مانند Codex اسکن می‌کند.

    `openclaw doctor --fix` می‌تواند وضعیت کهنه خودکار ساخته‌شده مانند پین‌های مدل `modelOverrideSource: "auto"`، فراداده مدل runtime، شناسه‌های هارنس پین‌شده، bindingهای نشست CLI، و بازنویسی‌های خودکار نمایه احراز هویت را وقتی مسیر مالک آن‌ها دیگر پیکربندی نشده است پاک کند. انتخاب‌های صریح کاربر یا مدل نشست قدیمی برای بازبینی دستی گزارش می‌شوند و دست‌نخورده باقی می‌مانند؛ وقتی آن مسیر دیگر مدنظر نیست، آن‌ها را با `/model ...`، `/new` تغییر دهید یا نشست را بازنشانی کنید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    Doctor می‌تواند چیدمان‌های قدیمی‌تر روی دیسک را به ساختار فعلی مهاجرت دهد:

    - ذخیره‌گاه نشست‌ها + transcriptها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری عامل:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها best-effort و idempotent هستند؛ doctor وقتی پوشه‌های قدیمی را به‌عنوان پشتیبان باقی بگذارد هشدارهایی منتشر می‌کند. Gateway/CLI همچنین دایرکتوری نشست‌ها + عامل قدیمی را هنگام راه‌اندازی به‌طور خودکار مهاجرت می‌دهد تا تاریخچه/احراز هویت/مدل‌ها بدون اجرای دستی doctor در مسیر مخصوص هر عامل قرار بگیرند. نرمال‌سازی ارائه‌دهنده/نقشه ارائه‌دهنده Talk اکنون بر اساس برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌هایی که فقط در ترتیب کلید هستند دیگر باعث تغییرات no-op تکراری `doctor --fix` نمی‌شوند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های manifest قدیمی Plugin">
    Doctor همه manifestهای Plugin نصب‌شده را برای کلیدهای قابلیت سطح بالای منسوخ (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به شیء `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقادیر را داشته باشد، کلید قدیمی بدون تکثیر داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های ذخیره‌گاه Cron قدیمی">
    Doctor همچنین ذخیره‌گاه کارهای Cron (`~/.openclaw/cron/jobs.json` به‌طور پیش‌فرض، یا `cron.store` وقتی بازنویسی شده باشد) را برای شکل‌های قدیمی job که scheduler هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی Cron شامل موارد زیر است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای سطح بالای payload (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای سطح بالای تحویل (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - نام‌های مستعار تحویل `provider` در payload → `delivery.channel` صریح
    - کارهای webhook جایگزین ساده و قدیمی `notify: true` → `delivery.mode="webhook"` صریح همراه با `delivery.to=cron.webhook`

    Doctor فقط زمانی کارهای `notify: true` را خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر کاری fallback قدیمی notify را با یک حالت تحویل غیر-webhook موجود ترکیب کند، doctor هشدار می‌دهد و آن کار را برای بازبینی دستی باقی می‌گذارد.

    در Linux، doctor همچنین زمانی هشدار می‌دهد که crontab کاربر همچنان `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را فراخوانی کند. این اسکریپت محلیِ میزبان توسط OpenClaw فعلی نگهداری نمی‌شود و وقتی cron نتواند به گذرگاه کاربر systemd دسترسی پیدا کند، ممکن است پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی کهنه crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor` و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    Doctor هر دایرکتوری نشست agent را برای فایل‌های write-lock کهنه اسکن می‌کند؛ فایل‌هایی که وقتی یک نشست به‌طور غیرعادی خارج شده، باقی مانده‌اند. برای هر فایل قفل یافت‌شده، این موارد را گزارش می‌کند: مسیر، PID، اینکه آیا PID هنوز زنده است، سن قفل، و اینکه آیا کهنه محسوب می‌شود یا نه (PID مرده، قدیمی‌تر از 30 دقیقه، یا PID زنده‌ای که بتوان اثبات کرد به یک فرایند غیر OpenClaw تعلق دارد). در حالت `--fix` / `--repair` فایل‌های قفل کهنه را خودکار حذف می‌کند؛ در غیر این صورت یادداشتی چاپ می‌کند و به شما دستور می‌دهد دوباره با `--fix` اجرا کنید.
  </Accordion>
  <Accordion title="3d. ترمیم شاخه transcript نشست">
    Doctor فایل‌های JSONL نشست agent را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی transcript پرامپت در 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با زمینه runtime داخلی OpenClaw به‌علاوه یک sibling فعال که همان پرامپت قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل تحت‌تأثیر در کنار فایل اصلی پشتیبان می‌گیرد و transcript را به شاخه فعال بازنویسی می‌کند تا تاریخچه Gateway و خواننده‌های memory دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی state (پایداری نشست، مسیریابی، و ایمنی)">
    دایرکتوری state ساقه عملیاتی سیستم است. اگر ناپدید شود، نشست‌ها، credentials، گزارش‌ها، و config را از دست می‌دهید (مگر اینکه جای دیگری پشتیبان داشته باشید).

    Doctor بررسی می‌کند:

    - **دایرکتوری state وجود ندارد**: درباره از دست رفتن فاجعه‌بار state هشدار می‌دهد، برای ایجاد دوباره دایرکتوری پرسش می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری state**: نوشتنی بودن را تأیید می‌کند؛ پیشنهاد ترمیم مجوزها را می‌دهد (و وقتی ناهماهنگی owner/group شناسایی شود، یک راهنمای `chown` منتشر می‌کند).
    - **دایرکتوری state همگام‌سازی‌شده با cloud در macOS**: وقتی state زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای پشتیبانی‌شده با همگام‌سازی می‌توانند باعث I/O کندتر و raceهای قفل/همگام‌سازی شوند.
    - **دایرکتوری state روی SD یا eMMC در Linux**: وقتی state به یک منبع mount از نوع `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی پشتیبانی‌شده با SD یا eMMC می‌تواند زیر نوشتن نشست و credential کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های نشست وجود ندارند**: `sessions/` و دایرکتوری ذخیره‌ساز نشست برای پایدارسازی تاریخچه و جلوگیری از crashهای `ENOENT` لازم هستند.
    - **ناهماهنگی transcript**: وقتی ورودی‌های نشست اخیر فایل transcript نداشته باشند هشدار می‌دهد.
    - **نشست اصلی "JSONL یک‌خطی"**: وقتی transcript اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه در حال انباشته شدن نیست).
    - **چند دایرکتوری state**: وقتی چند پوشه `~/.openclaw` در home directoryها وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآور حالت remote**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند آن را روی میزبان remote اجرا کنید (state آنجا قرار دارد).
    - **مجوزهای فایل config**: اگر `~/.openclaw/openclaw.json` برای group/world خواندنی باشد هشدار می‌دهد و پیشنهاد محدود کردن به `600` را می‌دهد.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در auth store بررسی می‌کند، وقتی tokenها در آستانه انقضا یا منقضی هستند هشدار می‌دهد، و وقتی ایمن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل OAuth/token مربوط به Anthropic کهنه باشد، یک کلید API از Anthropic یا مسیر setup-token در Anthropic را پیشنهاد می‌کند. promptهای refresh فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی refresh OAuth به‌طور دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا provider به شما بگوید دوباره وارد شوید)، doctor گزارش می‌دهد که احراز هویت دوباره لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های auth را گزارش می‌کند که موقتاً به این دلایل غیرقابل‌استفاده هستند:

    - cooldownهای کوتاه (rate limitها/timeoutها/شکست‌های auth)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های billing/credit)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor مرجع مدل را در برابر catalog و allowlist اعتبارسنجی می‌کند و وقتی resolve نشود یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. ترمیم image مربوط به sandbox">
    وقتی sandboxing فعال باشد، doctor imageهای Docker را بررسی می‌کند و اگر image فعلی وجود نداشته باشد، پیشنهاد build یا جابه‌جایی به نام‌های legacy را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    Doctor در حالت `openclaw doctor --fix` / `openclaw doctor --repair`، state مرحله‌بندی dependencyهای Plugin قدیمی تولیدشده توسط OpenClaw را حذف می‌کند. این شامل ریشه‌های dependency تولیدشده کهنه، دایرکتوری‌های install-stage قدیمی، بقایای محلی package از کد ترمیم dependency مربوط به Pluginهای bundled قدیمی‌تر، و کپی‌های managed npm یتیم یا بازیابی‌شده از Pluginهای bundled `@openclaw/*` است که می‌توانند manifest bundled فعلی را تحت‌الشعاع قرار دهند. Doctor همچنین package میزبان `openclaw` را به Pluginهای managed npm که `peerDependencies.openclaw` اعلام می‌کنند دوباره لینک می‌کند، تا importهای runtime محلی package مانند `openclaw/plugin-sdk/*` پس از updateها یا ترمیم‌های npm همچنان resolve شوند.

    Doctor همچنین می‌تواند Pluginهای downloadable گم‌شده را وقتی config به آن‌ها ارجاع می‌دهد اما registry محلی Plugin نمی‌تواند آن‌ها را پیدا کند، دوباره نصب کند. مثال‌ها شامل `plugins.entries` مادی، تنظیمات پیکربندی‌شده channel/provider/search، و runtimeهای agent پیکربندی‌شده هستند. هنگام updateهای package، doctor از اجرای ترمیم Plugin توسط package-manager در زمانی که package اصلی در حال تعویض است اجتناب می‌کند؛ اگر یک Plugin پیکربندی‌شده هنوز به بازیابی نیاز دارد، پس از update دوباره `openclaw doctor --fix` را اجرا کنید. startup Gateway و reload config، package managerها را اجرا نمی‌کنند؛ نصب‌های Plugin همچنان کار صریح doctor/install/update باقی می‌مانند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و نکته‌های پاک‌سازی">
    Doctor سرویس‌های Gateway قدیمی (launchd/systemd/schtasks) را شناسایی می‌کند و پیشنهاد می‌دهد آن‌ها را حذف کند و سرویس OpenClaw را با پورت فعلی Gateway نصب کند. همچنین می‌تواند برای سرویس‌های اضافه شبیه Gateway اسکن کند و نکته‌های پاک‌سازی چاپ کند. سرویس‌های Gateway مربوط به OpenClaw که با نام profile مشخص شده‌اند، first-class محسوب می‌شوند و به‌عنوان "اضافه" علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس Gateway سطح کاربر وجود نداشته باشد اما یک سرویس Gateway سطح سیستم برای OpenClaw وجود داشته باشد، doctor به‌طور خودکار سرویس سطح کاربر دوم نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس duplicate را حذف کنید یا وقتی یک supervisor سیستمی مالک چرخه عمر Gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت startup Matrix">
    وقتی یک حساب channel در Matrix مهاجرت state قدیمیِ pending یا actionable داشته باشد، doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس مراحل مهاجرت best-effort را اجرا می‌کند: مهاجرت state قدیمی Matrix و آماده‌سازی encrypted-state قدیمی. هر دو مرحله non-fatal هستند؛ خطاها log می‌شوند و startup ادامه پیدا می‌کند. در حالت read-only (`openclaw doctor` بدون `--fix`) این بررسی به‌طور کامل رد می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و drift در auth">
    Doctor اکنون state جفت‌سازی دستگاه را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌کند:

    - درخواست‌های pending برای جفت‌سازی بار اول
    - upgradeهای pending برای role دستگاه‌های از قبل paired
    - upgradeهای pending برای scope دستگاه‌های از قبل paired
    - ترمیم‌های ناهماهنگی public-key که در آن id دستگاه همچنان مطابق است اما identity دستگاه دیگر با رکورد approved مطابقت ندارد
    - رکوردهای paired که token فعال برای یک role approved ندارند
    - tokenهای paired که scopeهایشان از baseline جفت‌سازی approved منحرف شده است
    - ورودی‌های local cached device-token برای ماشین فعلی که پیش از چرخش token سمت Gateway بوده‌اند یا metadata مربوط به scope کهنه دارند

    Doctor درخواست‌های pair را خودکار approve نمی‌کند یا tokenهای دستگاه را خودکار rotate نمی‌کند. در عوض مراحل بعدی دقیق را چاپ می‌کند:

    - درخواست‌های pending را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` approve کنید
    - یک token تازه را با `openclaw devices rotate --device <deviceId> --role <role>` rotate کنید
    - یک رکورد کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره approve کنید

    این شکاف رایج "already paired but still getting pairing required" را می‌بندد: doctor اکنون جفت‌سازی بار اول را از upgradeهای pending role/scope و از drift کهنه token/device-identity متمایز می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی provider بدون allowlist برای DMها باز باشد، یا وقتی policy به شیوه‌ای خطرناک پیکربندی شده باشد، هشدار منتشر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، doctor اطمینان می‌دهد lingering فعال است تا Gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (Skills، Pluginها، و دایرکتوری‌های legacy)">
    Doctor خلاصه‌ای از state مربوط به workspace را برای agent پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: skillهای eligible، missing-requirements، و allowlist-blocked را می‌شمارد.
    - **دایرکتوری‌های workspace قدیمی**: وقتی `~/openclaw` یا دیگر دایرکتوری‌های workspace قدیمی در کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای enabled/disabled/errored را می‌شمارد؛ برای هر خطا، IDهای Plugin را فهرست می‌کند؛ قابلیت‌های Pluginهای bundle را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را که با runtime فعلی مشکل سازگاری دارند علامت‌گذاری می‌کند.
    - **diagnostics مربوط به Plugin**: هرگونه هشدار یا خطای load-time منتشرشده توسط registry مربوط به Plugin را نمایش می‌دهد.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    Doctor بررسی می‌کند آیا فایل‌های bootstrap مربوط به workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا دیگر فایل‌های context تزریق‌شده) نزدیک یا بالاتر از بودجه کاراکتر پیکربندی‌شده هستند یا نه. برای هر فایل، شمارش کاراکتر raw در برابر injected، درصد truncation، علت truncation (`max/file` یا `max/total`)، و مجموع کاراکترهای injected را به‌عنوان کسری از بودجه کل گزارش می‌کند. وقتی فایل‌ها truncated باشند یا نزدیک حد باشند، doctor نکته‌هایی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کهنه channel">
    وقتی `openclaw doctor --fix` یک Plugin مربوط به channel گم‌شده را حذف می‌کند، config آویزانِ scoped به channel را هم که به آن Plugin ارجاع داده بود حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های heartbeat که channel را نام‌گذاری کرده بودند، و overrideهای `agents.*.models["<channel>/*"]`. این کار از boot loopهای Gateway جلوگیری می‌کند که در آن runtime مربوط به channel از بین رفته اما config هنوز از Gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند آیا tab completion برای shell فعلی نصب شده است یا نه (zsh، bash، fish، یا PowerShell):

    - اگر پروفایل shell از الگوی completion پویا و کند (`source <(openclaw completion ...)`) استفاده کند، doctor آن را به گونه سریع‌ترِ فایل کش‌شده ارتقا می‌دهد.
    - اگر completion در پروفایل پیکربندی شده باشد اما فایل cache موجود نباشد، doctor به‌طور خودکار cache را بازتولید می‌کند.
    - اگر هیچ completionای اصلاً پیکربندی نشده باشد، doctor برای نصب آن درخواست می‌دهد (فقط در حالت تعاملی؛ با `--non-interactive` نادیده گرفته می‌شود).

    برای بازتولید دستی cache، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (توکن محلی)">
    Doctor آمادگی احراز هویت توکن محلی Gateway را بررسی می‌کند.

    - اگر حالت توکن به توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، doctor پیشنهاد می‌دهد یکی تولید کند.
    - اگر `gateway.auth.token` با SecretRef مدیریت شود اما در دسترس نباشد، doctor هشدار می‌دهد و آن را با متن ساده بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط زمانی تولید را اجبار می‌کند که هیچ SecretRef توکنی پیکربندی نشده باشد.

  </Accordion>
  <Accordion title="12b. تعمیرهای فقط‌خواندنیِ آگاه از SecretRef">
    برخی جریان‌های تعمیر باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار fail-fast زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` اکنون برای تعمیرهای هدفمند پیکربندی از همان مدل خلاصه فقط‌خواندنی SecretRef استفاده می‌کند که فرمان‌های خانواده status استفاده می‌کنند.
    - مثال: تعمیر `allowFrom` / `groupAllowFrom` `@username` در Telegram تلاش می‌کند در صورت موجود بودن، از اعتبارنامه‌های پیکربندی‌شده bot استفاده کند.
    - اگر توکن bot در Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، doctor گزارش می‌دهد که اعتبارنامه پیکربندی‌شده-اما-ناموجود است و به‌جای کرش کردن یا گزارش نادرستِ مفقود بودن توکن، auto-resolution را نادیده می‌گیرد.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی مجدد">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی مجدد آن را می‌دهد.
  </Accordion>
  <Accordion title="13b. آمادگی جستجوی حافظه">
    Doctor بررسی می‌کند که آیا ارائه‌دهنده embedding جستجوی حافظه پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و ارائه‌دهنده پیکربندی‌شده بستگی دارد:

    - **QMD backend**: بررسی می‌کند که آیا باینری `qmd` در دسترس و قابل شروع است یا نه. اگر نباشد، راهنمای رفع شامل بسته npm و گزینه مسیر دستی باینری را چاپ می‌کند.
    - **ارائه‌دهنده محلی صریح**: وجود فایل مدل محلی یا URL شناخته‌شده مدل remote/downloadable را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌کند به یک ارائه‌دهنده remote تغییر دهید.
    - **ارائه‌دهنده remote صریح** (`openai`، `voyage` و غیره): تأیید می‌کند که کلید API در محیط یا auth store وجود دارد. اگر موجود نباشد، راهنمایی‌های قابل اقدام برای رفع مشکل چاپ می‌کند.
    - **ارائه‌دهنده خودکار**: ابتدا دسترس‌پذیری مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهنده remote را به ترتیب auto-selection امتحان می‌کند.

    وقتی نتیجه probe کش‌شده Gateway در دسترس باشد (Gateway در زمان بررسی سالم بوده باشد)، doctor نتیجه آن را با پیکربندی قابل مشاهده برای CLI تطبیق می‌دهد و هر ناسازگاری را یادداشت می‌کند. Doctor در مسیر پیش‌فرض یک embedding ping تازه شروع نمی‌کند؛ وقتی بررسی زنده ارائه‌دهنده را می‌خواهید، از فرمان وضعیت عمیق حافظه استفاده کنید.

    برای تأیید آمادگی embedding در زمان اجرا، `openclaw memory status --deep` را استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک channel status probe اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. ممیزی پیکربندی supervisor + تعمیر">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های مفقود یا قدیمی بررسی می‌کند (برای نمونه، وابستگی‌های systemd network-online و تأخیر راه‌اندازی مجدد). وقتی ناسازگاری پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل service/task را با پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor درخواست تأیید می‌دهد.
    - `openclaw doctor --yes` درخواست‌های تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های توصیه‌شده را بدون درخواست اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های supervisor سفارشی را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` برای چرخه عمر سرویس Gateway، doctor را فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌دهد و تعمیرهای غیرسرویسی را اجرا می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس، بازنویسی‌های پیکربندی supervisor و پاک‌سازی سرویس legacy را نادیده می‌گیرد، چون یک supervisor خارجی مالک آن چرخه عمر است.
    - در Linux، doctor هنگامی که واحد systemd Gateway متناظر فعال است، metadata مربوط به command/entrypoint را بازنویسی نمی‌کند. همچنین هنگام اسکن duplicate-service، واحدهای اضافی غیرفعال و غیرlegacy شبیه Gateway را نادیده می‌گیرد تا فایل‌های سرویس همراه باعث ایجاد نویز پاک‌سازی نشوند.
    - اگر احراز هویت توکن به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/تعمیر سرویس doctor، SecretRef را اعتبارسنجی می‌کند اما مقادیر توکن متن ساده resolve‌شده را در metadata محیط سرویس supervisor پایدار نمی‌کند.
    - Doctor مقادیر محیط سرویس مدیریت‌شده با `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd یا Windows Scheduled Task به‌صورت inline جاسازی کرده‌اند تشخیص می‌دهد و metadata سرویس را بازنویسی می‌کند تا آن مقادیر به‌جای تعریف supervisor، از منبع runtime بارگذاری شوند.
    - Doctor تشخیص می‌دهد که فرمان سرویس هنوز پس از تغییر `gateway.port` یک `--port` قدیمی را pin کرده است و metadata سرویس را به port فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکن به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolve نشده باشد، doctor مسیر نصب/تعمیر را با راهنمایی قابل اقدام مسدود می‌کند.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/تعمیر را تا زمانی که mode به‌صراحت تنظیم شود مسدود می‌کند.
    - برای واحدهای Linux user-systemd، بررسی‌های drift توکن doctor اکنون هنگام مقایسه metadata احراز هویت سرویس، هم منابع `Environment=` و هم `EnvironmentFile=` را شامل می‌شود.
    - تعمیرهای سرویس doctor از بازنویسی، توقف، یا راه‌اندازی مجدد سرویس Gateway از یک باینری قدیمی‌تر OpenClaw خودداری می‌کنند، وقتی پیکربندی آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="16. تشخیص‌های runtime و port در Gateway">
    Doctor runtime سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما واقعاً در حال اجرا نیست هشدار می‌دهد. همچنین تداخل‌های port روی port Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل را گزارش می‌دهد (Gateway از قبل در حال اجراست، SSH tunnel).
  </Accordion>
  <Accordion title="17. بهترین رویه‌های runtime در Gateway">
    Doctor وقتی سرویس Gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای version-manager ممکن است پس از ارتقا خراب شوند چون سرویس shell init شما را بارگذاری نمی‌کند. Doctor پیشنهاد می‌دهد در صورت موجود بودن، به نصب Node سیستمی مهاجرت کند (Homebrew/apt/choco).

    LaunchAgentهای macOS که به‌تازگی نصب یا تعمیر شده‌اند، به‌جای کپی کردن PATH شل تعاملی، از یک PATH سیستمی canonical (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین باینری‌های سیستمی مدیریت‌شده با Homebrew همچنان در دسترس می‌مانند، در حالی که Volta، asdf، fnm، pnpm و دیگر دایرکتوری‌های version-manager تعیین نمی‌کنند child processهای Node به کدام مسیر resolve شوند. سرویس‌های Linux همچنان ریشه‌های محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های user-bin پایدار را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌شده version-manager فقط زمانی در PATH سرویس نوشته می‌شوند که آن دایرکتوری‌ها روی دیسک وجود داشته باشند.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + metadata ویزارد">
    Doctor هر تغییر پیکربندی را پایدار می‌کند و metadata ویزارد را مهر می‌زند تا اجرای doctor ثبت شود.
  </Accordion>
  <Accordion title="19. نکته‌های workspace (backup + سیستم حافظه)">
    Doctor وقتی سیستم حافظه workspace موجود نباشد آن را پیشنهاد می‌کند و اگر workspace از قبل زیر git نباشد، یک نکته backup چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و backup با git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
