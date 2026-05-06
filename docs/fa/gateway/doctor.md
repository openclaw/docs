---
read_when:
    - افزودن یا اصلاح مهاجرت‌های عیب‌یاب
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی و مراحل ترمیم'
title: عیب‌یابی
x-i18n:
    generated_at: "2026-05-06T09:17:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cee2793b1a0665a3a816586fcb597de1fd3133819d34480aa420346f4d7a78d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. این ابزار پیکربندی/وضعیت قدیمی را اصلاح می‌کند، سلامت را بررسی می‌کند، و مراحل تعمیر قابل اقدام ارائه می‌دهد.

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

    پیش‌فرض‌ها را بدون پرسش می‌پذیرد (از جمله مراحل تعمیر راه‌اندازی مجدد/سرویس/sandbox در صورت کاربرد).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تعمیرهای توصیه‌شده را بدون پرسش اعمال می‌کند (تعمیرها + راه‌اندازی مجدد در موارد امن).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    تعمیرهای تهاجمی را نیز اعمال می‌کند (پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    بدون اعلان اجرا می‌شود و فقط مهاجرت‌های امن را اعمال می‌کند (نرمال‌سازی پیکربندی + جابه‌جایی وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/sandbox را که به تایید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت legacy هنگام شناسایی به‌صورت خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های Gateway اضافی اسکن می‌کند (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید تغییرات را پیش از نوشتن مرور کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## کاری که انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل UI (وقتی شمای پروتکل جدیدتر باشد Control UI را دوباره می‌سازد).
    - بررسی سلامت + اعلان راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/ناموجود/مسدود) و وضعیت plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - نرمال‌سازی پیکربندی برای مقادیر legacy.
    - مهاجرت پیکربندی Talk از فیلدهای تخت legacy `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های legacy افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای override ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌اندازی OAuth مربوط به Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OAuth در OpenAI Codex.
    - هشدارهای فهرست مجاز Plugin/tool وقتی `plugins.allow` محدودکننده است اما خط‌مشی tool همچنان wildcard یا ابزارهای متعلق به plugin را درخواست می‌کند.
    - مهاجرت وضعیت legacy روی دیسک (sessions/agent dir/احراز هویت WhatsApp).
    - مهاجرت کلید قرارداد manifest مربوط به legacy plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت فروشگاه cron legacy (`jobId`, `schedule.cron`, فیلدهای سطح بالای delivery/payload، payload `provider`، jobهای fallback ساده webhook با `notify: true`).
    - مهاجرت خط‌مشی runtime مربوط به agent legacy به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی plugin مانده وقتی pluginها فعال هستند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های plugin مانده به‌عنوان پیکربندی containment غیرفعال در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="State and integrity">
    - بازرسی فایل lock نشست و پاک‌سازی lockهای مانده.
    - تعمیر transcript نشست برای شاخه‌های prompt-rewrite تکراری که توسط buildهای تحت تاثیر 2026.4.24 ایجاد شده‌اند.
    - شناسایی tombstone بازیابی راه‌اندازی مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌سازی پرچم‌های بازیابی aborted مانده تا startup همچنان child را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (sessions، transcripts، state dir).
    - بررسی‌های مجوز فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای نزدیک به انقضا را تازه‌سازی کند، و وضعیت‌های cooldown/disabled در auth-profile را گزارش می‌کند.
    - شناسایی dir workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - تعمیر تصویر sandbox وقتی sandboxing فعال است.
    - مهاجرت سرویس legacy و شناسایی Gateway اضافی.
    - مهاجرت وضعیت legacy کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime در Gateway (سرویس نصب شده اما اجرا نمی‌شود؛ label کش‌شده launchd).
    - هشدارهای وضعیت کانال (probe شده از Gateway در حال اجرا).
    - بررسی‌های پاسخ‌گویی WhatsApp برای سلامت event-loop تنزل‌یافته Gateway با کلاینت‌های TUI محلی که هنوز در حال اجرا هستند؛ `--fix` فقط کلاینت‌های TUI محلی تاییدشده را متوقف می‌کند.
    - تعمیر مسیر Codex برای ارجاع‌های مدل legacy `openai-codex/*` در مدل‌های اصلی، fallbackها، overrideهای heartbeat/subagent/compaction، hookها، overrideهای مدل کانال، و pinهای مسیر نشست؛ `--fix` آن‌ها را به `openai/*` بازنویسی می‌کند و فقط وقتی Plugin مربوط به Codex نصب و فعال باشد، harness با نام `codex` را ارائه کند، و OAuth قابل استفاده داشته باشد، `agentRuntime.id: "codex"` را انتخاب می‌کند. در غیر این صورت `agentRuntime.id: "pi"` را انتخاب می‌کند.
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy توکار برای سرویس‌های gateway که هنگام نصب یا به‌روزرسانی مقادیر shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را ثبت کرده‌اند.
    - بررسی‌های بهترین رویه runtime در Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی تداخل port در Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - هشدارهای امنیتی برای خط‌مشی‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی هیچ منبع token وجود ندارد، تولید token را پیشنهاد می‌دهد؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - شناسایی مشکل pair کردن دستگاه (درخواست‌های pair اولیه در انتظار، ارتقاهای role/scope در انتظار، drift کش device-token محلی مانده، و drift احراز هویت رکورد pair شده).

  </Accordion>
  <Accordion title="Workspace and shell">
    - بررسی systemd linger روی Linux.
    - بررسی اندازه فایل bootstrap workspace (هشدارهای truncation/نزدیک به حد برای فایل‌های context).
    - بررسی آمادگی Skills برای agent پیش‌فرض؛ skillهای مجاز با bin، env، config یا نیازمندی‌های OS ناموجود را گزارش می‌کند، و `--fix` می‌تواند skillهای در دسترس نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت تکمیل shell و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding برای جست‌وجوی حافظه (مدل محلی، کلید API راه دور، یا binary مربوط به QMD).
    - بررسی‌های نصب از source (ناسازگاری workspace در pnpm، assetهای UI ناموجود، binary مربوط به tsx ناموجود).
    - پیکربندی به‌روزشده + metadata مربوط به wizard را می‌نویسد.

  </Accordion>
</AccordionGroup>

## backfill و reset برای UI رویاها

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset**، و **Clear Grounded** برای گردش کار grounded dreaming است. این اقدام‌ها از متدهای RPC شبیه doctor در gateway استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` **نیستند**.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، عبور دفترچه REM مبتنی بر grounded را اجرا می‌کند، و مدخل‌های backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان مدخل‌های دفترچه backfill علامت‌گذاری‌شده را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط مدخل‌های staged کوتاه‌مدت از نوع grounded-only را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه جمع نکرده‌اند.

کاری که به‌تنهایی انجام **نمی‌دهند**:

- آن‌ها `MEMORY.md` را ویرایش نمی‌کنند
- آن‌ها مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- آن‌ها candidateهای grounded را به‌صورت خودکار در فروشگاه promotion کوتاه‌مدت زنده stage نمی‌کنند، مگر اینکه ابتدا مسیر CLI staged را صراحتا اجرا کنید

اگر می‌خواهید replay تاریخی grounded بر lane معمول promotion عمیق اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار candidateهای durable و grounded را در فروشگاه dreaming کوتاه‌مدت stage می‌کند و در عین حال `DREAMS.md` را به‌عنوان سطح مرور نگه می‌دارد.

## رفتار تفصیلی و منطق

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. Config normalization">
    اگر پیکربندی شامل شکل‌های مقدار legacy باشد (برای نمونه `messages.ackReaction` بدون override ویژه کانال)، doctor آن‌ها را به شمای فعلی نرمال می‌کند.

    این شامل فیلدهای تخت legacy در Talk نیز می‌شود. پیکربندی عمومی فعلی گفتار Talk برابر `talk.provider` + `talk.providers.<provider>` است، و پیکربندی voice بلادرنگ برابر `talk.realtime.*` است. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را در map ارائه‌دهنده بازنویسی می‌کند، و انتخابگرهای بلادرنگ سطح بالای legacy (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) را به `talk.realtime` بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` غیرخالی است و خط‌مشی tool از
    مدخل‌های tool به‌صورت wildcard یا متعلق به plugin استفاده می‌کند هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهای
    pluginهایی match می‌شود که واقعا load می‌شوند؛ این مقدار فهرست مجاز انحصاری plugin را دور نمی‌زند. Doctor برای پیکربندی‌های
    legacy allowlist مهاجرت‌داده‌شده، `plugins.bundledDiscovery: "compat"` را می‌نویسد تا رفتار موجود ارائه‌دهنده bundled حفظ شود، و
    سپس به تنظیم سخت‌گیرانه‌تر `"allowlist"` اشاره می‌کند.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، دستورهای دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای legacy پیدا شدند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با شمای به‌روزشده بازنویسی می‌کند.

    Gateway همچنین وقتی هنگام startup قالب پیکربندی legacy را شناسایی کند، مهاجرت‌های doctor را به‌صورت خودکار اجرا می‌کند، بنابراین پیکربندی‌های مانده بدون مداخله دستی تعمیر می‌شوند. مهاجرت‌های فروشگاه job در Cron توسط `openclaw doctor --fix` انجام می‌شوند.

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
    - انتخاب‌گرهای Talk بی‌درنگ قدیمی در سطح بالا (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - برای کانال‌هایی با `accounts` نام‌گذاری‌شده اما مقادیر قدیمی سطح بالای کانالِ تک‌حسابی که باقی مانده‌اند، آن مقادیر محدود به حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند هدف نام‌گذاری‌شده/پیش‌فرض مطابق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای زمان‌پایان‌های کند provider/model از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم قدیمی رله extension)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی Gateway همچنین providerهایی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده است، به‌جای شکست بسته، نادیده می‌گیرد)

    هشدارهای Doctor همچنین شامل راهنمایی حساب پیش‌فرض برای کانال‌های چندحسابی است:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، Doctor هشدار می‌دهد که مسیریابی بازگشتی می‌تواند حسابی غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی شناسه حساب ناشناخته تنظیم شده باشد، Doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های provider مربوط به OpenCode">
    اگر `models.providers.opencode`، `opencode-zen`، یا `opencode-go` را به‌صورت دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این کار می‌تواند مدل‌ها را وادار کند از API نادرست استفاده کنند یا هزینه‌ها را صفر کند. Doctor هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API + هزینه‌های هر مدل را بازیابی کنید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر حذف‌شده extension کروم اشاره می‌کند، Doctor آن را به مدل فعلی اتصال Chrome MCP محلیِ میزبان نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    Doctor همچنین وقتی از `defaultProfile: "user"` یا پروفایل پیکربندی‌شده `existing-session` استفاده می‌کنید، مسیر Chrome MCP محلیِ میزبان را بررسی می‌کند:

    - بررسی می‌کند که آیا Google Chrome روی همان میزبان برای پروفایل‌های اتصال خودکار پیش‌فرض نصب شده است
    - نسخه شناسایی‌شده Chrome را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که اشکال‌زدایی از راه دور را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    Doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلیِ میزبان همچنان نیاز دارد به:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان Gateway/Node
    - اجرای محلی مرورگر
    - فعال بودن اشکال‌زدایی از راه دور در آن مرورگر
    - تأیید اعلان رضایت نخستین اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. Existing-session محدودیت‌های فعلی مسیر Chrome MCP را نگه می‌دارد؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود، و اقدامات دسته‌ای همچنان به یک مرورگر مدیریت‌شده یا پروفایل خام CDP نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser، یا جریان‌های headless دیگر اعمال **نمی‌شود**. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای OAuth TLS">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، Doctor نقطه پایانی مجوزدهی OpenAI را بررسی می‌کند تا تأیید کند که پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر بررسی با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی، یا گواهی خودامضاشده)، Doctor راهنمای رفع مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولاً `brew postinstall ca-certificates` است. با `--deep`، این بررسی حتی اگر Gateway سالم باشد اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های provider مربوط به Codex OAuth">
    اگر قبلاً تنظیمات انتقال قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر provider داخلی Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند پنهان کنند. Doctor وقتی آن تنظیمات انتقال قدیمی را در کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال منسوخ را حذف یا بازنویسی کنید و رفتار داخلی مسیریابی/بازگشت را دوباره به دست آورید. پروکسی‌های سفارشی و بازنویسی‌های فقط هدر همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. تعمیر مسیر Codex">
    Doctor ارجاع‌های مدل قدیمی `openai-codex/*` را بررسی می‌کند. مسیریابی بومی Codex harness از ارجاع‌های مدل متعارف `openai/*` به‌همراه `agentRuntime.id: "codex"` استفاده می‌کند تا نوبت از مسیر app-server harness مربوط به Codex عبور کند، نه مسیر OpenClaw PI OpenAI.

    در حالت `--fix` / `--repair`، Doctor ارجاع‌های عامل پیش‌فرض و هر عامل را بازنویسی می‌کند، از جمله مدل‌های اصلی، بازگشت‌ها، بازنویسی‌های heartbeat/subagent/compaction، hooks، بازنویسی‌های مدل کانال، و وضعیت مسیر نشست پایدارشده و منسوخ:

    - `openai-codex/gpt-*` به `openai/gpt-*` تبدیل می‌شود.
    - runtime عامل مطابق فقط وقتی به `agentRuntime.id: "codex"` تبدیل می‌شود که Codex نصب، فعال، دارای harness با نام `codex`، و دارای OAuth قابل استفاده باشد.
    - در غیر این صورت runtime عامل مطابق به `agentRuntime.id: "pi"` تبدیل می‌شود.
    - فهرست‌های بازگشت مدل موجود با بازنویسی ورودی‌های قدیمی‌شان حفظ می‌شوند؛ تنظیمات هر مدل که کپی شده‌اند از کلید قدیمی به کلید متعارف `openai/*` منتقل می‌شوند.
    - `modelProvider`/`providerOverride`، `model`/`modelOverride`، اعلان‌های بازگشت، pinهای پروفایل احراز هویت، و pinهای Codex harness در نشست‌های پایدارشده، در همه ذخیره‌گاه‌های نشست عامل کشف‌شده تعمیر می‌شوند.
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از چت کنترل یا bind کنید.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از آداپتور خارجی ACP/acpx استفاده کنید.»

  </Accordion>
  <Accordion title="2g. پاک‌سازی مسیر نشست">
    Doctor همچنین ذخیره‌گاه‌های نشست عامل کشف‌شده را برای وضعیت مسیر خودکارساخته و منسوخ پس از انتقال مدل‌های پیکربندی‌شده یا runtime از یک مسیر متعلق به Plugin مانند Codex اسکن می‌کند.

    `openclaw doctor --fix` می‌تواند وضعیت منسوخ خودکارساخته مانند pinهای مدل `modelOverrideSource: "auto"`، فراداده مدل runtime، شناسه‌های harness پین‌شده، bindهای نشست CLI، و بازنویسی‌های خودکار پروفایل احراز هویت را وقتی مسیر مالک آن‌ها دیگر پیکربندی نشده است پاک کند. انتخاب‌های صریح کاربر یا مدل نشست قدیمی برای بازبینی دستی گزارش می‌شوند و دست‌نخورده باقی می‌مانند؛ وقتی آن مسیر دیگر مدنظر نیست، آن‌ها را با `/model ...`، `/new` تغییر دهید یا نشست را بازنشانی کنید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    Doctor می‌تواند چیدمان‌های قدیمی‌تر روی دیسک را به ساختار فعلی مهاجرت دهد:

    - ذخیره‌گاه نشست‌ها + رونوشت‌ها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - پوشه عامل:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها best-effort و idempotent هستند؛ Doctor وقتی هر پوشه قدیمی را به‌عنوان پشتیبان باقی بگذارد هشدار صادر می‌کند. Gateway/CLI همچنین در زمان راه‌اندازی، نشست‌های قدیمی + پوشه عامل را به‌صورت خودکار مهاجرت می‌کند تا تاریخچه/احراز هویت/مدل‌ها بدون اجرای دستی Doctor در مسیر هر عامل قرار بگیرند. احراز هویت WhatsApp عمداً فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. نرمال‌سازی provider/نقشه provider مربوط به Talk اکنون با برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌هایی که فقط مربوط به ترتیب کلیدها هستند دیگر تغییرات تکراری بی‌اثر `doctor --fix` را فعال نمی‌کنند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های manifest قدیمی Plugin">
    Doctor همه manifestهای Plugin نصب‌شده را برای کلیدهای capability سطح بالای منسوخ (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌کند آن‌ها را به شیء `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقادیر را داشته باشد، کلید قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های ذخیره‌گاه قدیمی Cron">
    Doctor همچنین ذخیره‌گاه jobهای Cron را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی بازنویسی شده باشد) برای شکل‌های قدیمی job که scheduler هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی Cron شامل این موارد است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload در سطح بالا (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای delivery در سطح بالا (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - نام‌های مستعار delivery مربوط به payload `provider` → `delivery.channel` صریح
    - jobهای fallback وبهوک ساده قدیمی `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    Doctor فقط زمانی jobهای `notify: true` را به‌طور خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر یک job، fallback قدیمی notify را با یک حالت تحویل غیر Webhook موجود ترکیب کند، doctor هشدار می‌دهد و آن job را برای بازبینی دستی باقی می‌گذارد.

    در Linux، doctor همچنین زمانی هشدار می‌دهد که crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را فراخوانی می‌کند. این اسکریپت host-local توسط OpenClaw فعلی نگهداری نمی‌شود و وقتی cron نتواند به systemd user bus برسد، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی منسوخ crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor` و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل session">
    Doctor همه دایرکتوری‌های session عامل را برای فایل‌های write-lock مانده بررسی می‌کند — فایل‌هایی که وقتی یک session به‌صورت غیرعادی خارج شده، باقی مانده‌اند. برای هر فایل lock پیدا‌شده، این موارد را گزارش می‌کند: مسیر، PID، اینکه آیا PID هنوز زنده است، سن lock، و اینکه آیا stale محسوب می‌شود یا نه (PID مرده یا قدیمی‌تر از ۳۰ دقیقه). در حالت `--fix` / `--repair` فایل‌های lock stale را به‌طور خودکار حذف می‌کند؛ در غیر این صورت یک یادداشت چاپ می‌کند و به شما می‌گوید دوباره با `--fix` اجرا کنید.
  </Accordion>
  <Accordion title="3d. تعمیر شاخه transcript در session">
    Doctor فایل‌های JSONL مربوط به session عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی transcript پرامپت در 2026.4.24 بررسی می‌کند: یک نوبت کاربر رهاشده با context داخلی runtime OpenClaw به‌همراه یک sibling فعال که همان پرامپت قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل متاثر کنار نسخه اصلی پشتیبان می‌گیرد و transcript را به شاخه فعال بازنویسی می‌کند تا history Gateway و memory readerها دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی state (ماندگاری session، routing، و ایمنی)">
    دایرکتوری state مرکز عملیاتی سیستم است. اگر ناپدید شود، sessionها، credentialها، logها و config را از دست می‌دهید (مگر اینکه جای دیگری backup داشته باشید).

    Doctor بررسی می‌کند:

    - **State dir missing**: درباره از دست‌رفتن فاجعه‌بار state هشدار می‌دهد، برای ایجاد دوباره دایرکتوری prompt می‌دهد، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **State dir permissions**: قابلیت نوشتن را بررسی می‌کند؛ پیشنهاد تعمیر permissions می‌دهد (و وقتی ناهماهنگی owner/group تشخیص داده شود، یک hint برای `chown` منتشر می‌کند).
    - **macOS cloud-synced state dir**: وقتی state زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای sync-backed می‌توانند باعث I/O کندتر و رقابت‌های lock/sync شوند.
    - **Linux SD or eMMC state dir**: وقتی state به یک mount source از نوع `mmcblk*` resolve شود هشدار می‌دهد، چون random I/O پشتیبانی‌شده با SD یا eMMC می‌تواند زیر نوشتن‌های session و credential کندتر شود و سریع‌تر فرسوده شود.
    - **Session dirs missing**: `sessions/` و دایرکتوری session store برای ماندگارکردن history و جلوگیری از crashهای `ENOENT` لازم هستند.
    - **Transcript mismatch**: وقتی entryهای اخیر session فایل‌های transcript گم‌شده داشته باشند هشدار می‌دهد.
    - **Main session "1-line JSONL"**: وقتی transcript اصلی فقط یک خط داشته باشد flag می‌کند (history در حال انباشته‌شدن نیست).
    - **Multiple state dirs**: وقتی چند پوشه `~/.openclaw` در home directoryهای مختلف وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (history می‌تواند بین نصب‌ها split شود).
    - **Remote mode reminder**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند که آن را روی host remote اجرا کنید (state آنجاست).
    - **Config file permissions**: اگر `~/.openclaw/openclaw.json` برای group/world قابل‌خواندن باشد هشدار می‌دهد و پیشنهاد می‌کند آن را به `600` محدود کند.

  </Accordion>
  <Accordion title="5. سلامت auth مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در auth store بررسی می‌کند، وقتی tokenها در حال انقضا/منقضی‌شده هستند هشدار می‌دهد، و وقتی امن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل OAuth/token مربوط به Anthropic stale باشد، یک Anthropic API key یا مسیر setup-token مربوط به Anthropic را پیشنهاد می‌کند. Promptهای refresh فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی refresh OAuth به‌صورت دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا وقتی provider به شما می‌گوید دوباره sign in کنید)، doctor گزارش می‌دهد که re-auth لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های auth را گزارش می‌کند که به‌طور موقت به این دلایل قابل‌استفاده نیستند:

    - cooldownهای کوتاه (rate limitها/timeoutها/شکست‌های auth)
    - disableهای طولانی‌تر (شکست‌های billing/credit)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor reference مدل را در برابر catalog و allowlist اعتبارسنجی می‌کند و وقتی resolve نشود یا disallow شده باشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. تعمیر image مربوط به sandbox">
    وقتی sandboxing فعال باشد، doctor imageهای Docker را بررسی می‌کند و اگر image فعلی گم‌شده باشد، پیشنهاد build کردن یا switch به نام‌های legacy را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    Doctor در حالت `openclaw doctor --fix` / `openclaw doctor --repair`، state مربوط به staging وابستگی Plugin تولیدشده قدیمی توسط OpenClaw را حذف می‌کند. این شامل rootهای dependency تولیدشده stale، دایرکتوری‌های install-stage قدیمی، debrisهای package-local از کد تعمیر dependency قبلی bundled-plugin، و کپی‌های npm مدیریت‌شده orphaned یا recovered از Pluginهای bundled `@openclaw/*` است که می‌توانند manifest bundled فعلی را shadow کنند.

    Doctor همچنین می‌تواند Pluginهای downloadable گم‌شده را وقتی config به آن‌ها reference می‌دهد اما registry محلی Plugin نمی‌تواند آن‌ها را پیدا کند، دوباره نصب کند. مثال‌ها شامل `plugins.entries` واقعی، تنظیمات channel/provider/search پیکربندی‌شده، و runtimeهای agent پیکربندی‌شده است. هنگام package updateها، doctor تا وقتی core package در حال swap شدن است از اجرای تعمیر package-manager Plugin خودداری می‌کند؛ اگر یک Plugin پیکربندی‌شده هنوز به recovery نیاز دارد، پس از update دوباره `openclaw doctor --fix` را اجرا کنید. startup Gateway و config reload، package managerها را اجرا نمی‌کنند؛ نصب‌های Plugin همچنان کار صریح doctor/install/update باقی می‌مانند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و hintهای پاک‌سازی">
    Doctor سرویس‌های gateway legacy (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد می‌کند آن‌ها را حذف کند و سرویس OpenClaw را با port فعلی gateway نصب کند. همچنین می‌تواند برای سرویس‌های اضافی gateway-like اسکن کند و hintهای پاک‌سازی چاپ کند. سرویس‌های OpenClaw gateway با نام profile، first-class محسوب می‌شوند و به‌عنوان "extra" flag نمی‌شوند.

    در Linux، اگر سرویس gateway در سطح کاربر گم‌شده باشد اما یک سرویس OpenClaw gateway در سطح system وجود داشته باشد، doctor به‌طور خودکار سرویس دوم در سطح کاربر نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس duplicate را حذف کنید یا وقتی یک system supervisor مالک lifecycle gateway است `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Startup Matrix">
    وقتی یک account کانال Matrix دارای یک مهاجرت legacy state در انتظار یا actionable باشد، doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس stepهای best-effort migration را اجرا می‌کند: مهاجرت legacy Matrix state و آماده‌سازی legacy encrypted-state. هر دو step non-fatal هستند؛ errorها log می‌شوند و startup ادامه پیدا می‌کند. در حالت read-only (`openclaw doctor` بدون `--fix`) این check کامل skip می‌شود.
  </Accordion>
  <Accordion title="8c. Pairing دستگاه و drift در auth">
    Doctor اکنون state مربوط به device-pairing را به‌عنوان بخشی از health pass عادی بررسی می‌کند.

    چیزهایی که گزارش می‌کند:

    - درخواست‌های first-time pairing در انتظار
    - role upgradeهای در انتظار برای دستگاه‌هایی که قبلا paired شده‌اند
    - scope upgradeهای در انتظار برای دستگاه‌هایی که قبلا paired شده‌اند
    - تعمیرهای public-key mismatch که device id هنوز match است اما identity دستگاه دیگر با record تاییدشده match نیست
    - recordهای paired که token فعال برای role تاییدشده ندارند
    - tokenهای paired که scopeهایشان خارج از baseline تاییدشده pairing drift کرده است
    - entryهای cache محلی device-token برای ماشین فعلی که قبل از rotation سمت Gateway ایجاد شده‌اند یا metadata scope stale دارند

    Doctor درخواست‌های pair را auto-approve نمی‌کند و tokenهای دستگاه را auto-rotate نمی‌کند. به‌جای آن next stepهای دقیق را چاپ می‌کند:

    - درخواست‌های pending را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` approve کنید
    - یک token تازه را با `openclaw devices rotate --device <deviceId> --role <role>` rotate کنید
    - یک record stale را با `openclaw devices remove <deviceId>` حذف و دوباره approve کنید

    این شکاف رایج "already paired but still getting pairing required" را می‌بندد: doctor اکنون first-time pairing را از role/scope upgradeهای pending و از stale token/device-identity drift جدا تشخیص می‌دهد.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک provider بدون allowlist برای DMها باز باشد، یا وقتی یک policy به شکل خطرناکی پیکربندی شده باشد، هشدار منتشر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، doctor مطمئن می‌شود lingering فعال است تا gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (Skills، Pluginها، و دایرکتوری‌های legacy)">
    Doctor خلاصه‌ای از state مربوط به workspace را برای agent پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: skillهای eligible، missing-requirements، و allowlist-blocked را می‌شمارد.
    - **Legacy workspace dirs**: وقتی `~/openclaw` یا دایرکتوری‌های legacy workspace دیگر در کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای enabled/disabled/errored را می‌شمارد؛ برای هر error، Plugin IDها را فهرست می‌کند؛ capabilityهای bundle plugin را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را flag می‌کند که با runtime فعلی مشکل سازگاری دارند.
    - **تشخیص‌های Plugin**: هرگونه warning یا error زمان load که توسط Plugin registry منتشر شده باشد را آشکار می‌کند.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap مربوط به workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا فایل‌های context inject شده دیگر) نزدیک یا بیشتر از بودجه character پیکربندی‌شده هستند یا نه. برای هر فایل، countهای character خام در برابر injected، درصد truncation، علت truncation (`max/file` یا `max/total`)، و کل characterهای injected را به‌عنوان کسری از کل بودجه گزارش می‌کند. وقتی فایل‌ها truncate شده باشند یا نزدیک limit باشند، doctor نکته‌هایی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کانال stale">
    وقتی `openclaw doctor --fix` یک Plugin کانال گم‌شده را حذف می‌کند، config dangling با scope همان کانال را هم که به آن Plugin reference می‌داد حذف می‌کند: entryهای `channels.<id>`، targetهای Heartbeat که channel را نام برده‌اند، و overrideهای `agents.*.models["<channel>/*"]`. این از boot loopهای Gateway جلوگیری می‌کند، جایی که runtime کانال حذف شده اما config هنوز از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند آیا tab completion برای shell فعلی (zsh، bash، fish، یا PowerShell) نصب شده است یا نه:

    - اگر profile shell از یک pattern کند dynamic completion استفاده کند (`source <(openclaw completion ...)`)، doctor آن را به variant سریع‌تر فایل cache شده upgrade می‌کند.
    - اگر completion در profile پیکربندی شده اما فایل cache گم‌شده باشد، doctor cache را به‌طور خودکار regenerate می‌کند.
    - اگر هیچ completionای اصلا پیکربندی نشده باشد، doctor برای نصب آن prompt می‌دهد (فقط حالت interactive؛ با `--non-interactive` skip می‌شود).

    برای regenerate دستی cache، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های auth Gateway (token محلی)">
    Doctor آمادگی auth با token محلی gateway را بررسی می‌کند.

    - اگر token mode به token نیاز داشته باشد و هیچ token sourceای وجود نداشته باشد، doctor پیشنهاد generate کردن یکی را می‌دهد.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما unavailable باشد، doctor هشدار می‌دهد و آن را با plaintext overwrite نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی هیچ token SecretRef پیکربندی نشده باشد generation را force می‌کند.

  </Accordion>
  <Accordion title="12b. تعمیرات آگاه از SecretRef به‌صورت فقط‌خواندنی">
    برخی جریان‌های تعمیر باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار fail-fast زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` اکنون برای تعمیرات هدفمند پیکربندی از همان مدل خلاصهٔ فقط‌خواندنی SecretRef استفاده می‌کند که فرمان‌های خانوادهٔ status استفاده می‌کنند.
    - مثال: تعمیر `allowFrom` / `groupAllowFrom` `@username` در Telegram تلاش می‌کند در صورت دسترس بودن از اعتبارنامه‌های بات پیکربندی‌شده استفاده کند.
    - اگر توکن بات Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، doctor گزارش می‌دهد که اعتبارنامه پیکربندی‌شده اما در دسترس نیست و به‌جای خراب شدن یا گزارش نادرست توکن به‌عنوان مفقود، رفع خودکار را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی مجدد">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی مجدد می‌دهد.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند که آیا ارائه‌دهندهٔ embedding جست‌وجوی حافظهٔ پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و ارائه‌دهندهٔ پیکربندی‌شده بستگی دارد:

    - **backend‏ QMD**: بررسی می‌کند که آیا باینری `qmd` در دسترس و قابل شروع است یا نه. اگر نباشد، راهنمای رفع شامل بستهٔ npm و گزینهٔ مسیر دستی باینری را چاپ می‌کند.
    - **ارائه‌دهندهٔ محلی صریح**: وجود فایل مدل محلی یا URL مدل راه‌دور/قابل‌دانلود شناخته‌شده را بررسی می‌کند. اگر وجود نداشته باشد، پیشنهاد می‌کند به ارائه‌دهندهٔ راه‌دور تغییر دهید.
    - **ارائه‌دهندهٔ راه‌دور صریح** (`openai`, `voyage`, etc.): تأیید می‌کند که یک کلید API در محیط یا مخزن احراز هویت وجود دارد. اگر نباشد، نکات رفع قابل اقدام چاپ می‌کند.
    - **ارائه‌دهندهٔ خودکار**: ابتدا در دسترس بودن مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهندهٔ راه‌دور را به ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی نتیجهٔ probe کش‌شدهٔ Gateway در دسترس باشد (Gateway در زمان بررسی سالم بوده است)، doctor نتیجهٔ آن را با پیکربندی قابل مشاهده برای CLI تطبیق می‌دهد و هرگونه اختلاف را یادداشت می‌کند. Doctor در مسیر پیش‌فرض ping تازهٔ embedding را شروع نمی‌کند؛ وقتی بررسی زندهٔ ارائه‌دهنده را می‌خواهید، از فرمان وضعیت عمیق حافظه استفاده کنید.

    از `openclaw memory status --deep` برای تأیید آمادگی embedding در زمان اجرا استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با راهکارهای پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. ممیزی + تعمیر پیکربندی supervisor">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های مفقود یا قدیمی بررسی می‌کند (مثلاً وابستگی‌های systemd network-online و تأخیر راه‌اندازی مجدد). وقتی عدم تطابقی پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل سرویس/وظیفه را با پیش‌فرض‌های فعلی بازنویسی کند.

    نکات:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` درخواست‌های تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های توصیه‌شده را بدون درخواست تأیید اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor را برای چرخهٔ حیات سرویس Gateway فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌دهد و تعمیرات غیرسرویسی را اجرا می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس، بازنویسی‌های پیکربندی supervisor و پاک‌سازی سرویس legacy را رد می‌کند، چون یک supervisor بیرونی مالک آن چرخهٔ حیات است.
    - در Linux، doctor هنگام فعال بودن واحد systemd Gateway منطبق، metadata فرمان/entrypoint را بازنویسی نمی‌کند. همچنین در اسکن سرویس تکراری، واحدهای اضافی غیرفعال غیر legacy شبیه Gateway را نادیده می‌گیرد تا فایل‌های سرویس همراه، نویز پاک‌سازی ایجاد نکنند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/تعمیر سرویس doctor، SecretRef را اعتبارسنجی می‌کند اما مقادیر متن سادهٔ توکن حل‌شده را در metadata محیط سرویس supervisor ذخیره نمی‌کند.
    - Doctor مقادیر محیط سرویس مدیریت‌شدهٔ مبتنی بر `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd یا Windows Scheduled Task به‌صورت inline جاسازی کرده‌اند تشخیص می‌دهد و metadata سرویس را بازنویسی می‌کند تا آن مقادیر به‌جای تعریف supervisor از منبع زمان اجرا بارگذاری شوند.
    - Doctor تشخیص می‌دهد که فرمان سرویس پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را pin کرده است و metadata سرویس را به پورت فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل نشده باشد، doctor مسیر نصب/تعمیر را با راهنمای قابل اقدام مسدود می‌کند.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/تعمیر را تا زمانی که mode به‌صورت صریح تنظیم شود مسدود می‌کند.
    - برای واحدهای user-systemd در Linux، بررسی‌های drift توکن doctor اکنون هنگام مقایسهٔ metadata احراز هویت سرویس، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شود.
    - تعمیرات سرویس Doctor از بازنویسی، توقف یا راه‌اندازی مجدد سرویس Gateway از یک باینری قدیمی‌تر OpenClaw خودداری می‌کند، وقتی پیکربندی آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را اجباری کنید.

  </Accordion>
  <Accordion title="16. تشخیص زمان اجرای Gateway + پورت">
    Doctor زمان اجرای سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما واقعاً در حال اجرا نیست هشدار می‌دهد. همچنین برخوردهای پورت روی پورت Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل (Gateway از قبل در حال اجراست، تونل SSH) را گزارش می‌دهد.
  </Accordion>
  <Accordion title="17. بهترین رویه‌های زمان اجرای Gateway">
    Doctor هشدار می‌دهد وقتی سرویس Gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه (`nvm`, `fnm`, `volta`, `asdf`, etc.) اجرا شود. کانال‌های WhatsApp + Telegram به Node نیاز دارند و مسیرهای مدیر نسخه ممکن است پس از ارتقا خراب شوند، چون سرویس init شِل شما را بارگذاری نمی‌کند. Doctor پیشنهاد می‌کند در صورت در دسترس بودن، به نصب سیستمی Node مهاجرت کنید (Homebrew/apt/choco).

    macOS LaunchAgentهای تازه نصب‌شده یا تعمیرشده به‌جای کپی کردن PATH شِل تعاملی، از PATH سیستمی canonical (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین دایرکتوری‌های Volta، asdf، fnm، pnpm و دیگر مدیران نسخه تعیین نمی‌کنند که پردازه‌های فرزند Node به کدام مورد resolve شوند. سرویس‌های Linux همچنان ریشه‌های محیطی صریح (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) و دایرکتوری‌های پایدار user-bin را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌شدهٔ مدیر نسخه فقط وقتی روی دیسک وجود داشته باشند در PATH سرویس نوشته می‌شوند.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + metadata ویزارد">
    Doctor هرگونه تغییر پیکربندی را ذخیره می‌کند و metadata ویزارد را برای ثبت اجرای doctor مهر می‌کند.
  </Accordion>
  <Accordion title="19. نکات workspace (پشتیبان‌گیری + سیستم حافظه)">
    Doctor وقتی سیستم حافظهٔ workspace وجود نداشته باشد آن را پیشنهاد می‌کند و اگر workspace از قبل زیر git نباشد، یک نکتهٔ پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و پشتیبان‌گیری git (GitHub یا GitLab خصوصی توصیه‌شده)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
