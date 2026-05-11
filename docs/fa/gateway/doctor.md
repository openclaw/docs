---
read_when:
    - افزودن یا تغییر مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل ترمیم'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-11T20:33:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
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

    پیش‌فرض‌ها را بدون پرسش بپذیرید (از جمله گام‌های تعمیر راه‌اندازی مجدد/سرویس/sandbox در صورت کاربرد).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تعمیرهای پیشنهادی را بدون پرسش اعمال کنید (تعمیرها + راه‌اندازی مجدد در موارد ایمن).

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

    بدون پرسش اجرا کنید و فقط مهاجرت‌های ایمن را اعمال کنید (عادی‌سازی پیکربندی + جابه‌جایی وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/sandbox را که به تأیید انسان نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های Gateway اضافی اسکن کنید (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید تغییرات را پیش از نوشتن بررسی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## کارهایی که انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل UI (وقتی شِمای پروتکل جدیدتر باشد Control UI را دوباره می‌سازد).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/مفقود/مسدود) و وضعیت plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - عادی‌سازی پیکربندی برای مقادیر قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای بازنویسی provider در OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌اندازی OAuth در Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OpenAI Codex OAuth.
    - هشدارهای فهرست مجاز plugin/tool وقتی `plugins.allow` محدودکننده است اما سیاست ابزار همچنان wildcard یا ابزارهای متعلق به plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/WhatsApp auth).
    - مهاجرت کلید قرارداد manifest قدیمی plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت ذخیره‌گاه cron قدیمی (`jobId`, `schedule.cron`, فیلدهای سطح بالای delivery/payload، payload `provider`، کارهای fallback ساده webhook با `notify: true`).
    - پاک‌سازی runtime-policy قدیمی در سطح کل عامل؛ سیاست runtime مربوط به provider/model انتخاب‌گر مسیر فعال است.
    - پاک‌سازی پیکربندی stale plugin وقتی pluginها فعال باشند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های stale plugin به‌عنوان پیکربندی مهار بی‌اثر در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="State and integrity">
    - بازرسی فایل قفل نشست و پاک‌سازی قفل stale.
    - تعمیر transcript نشست برای شاخه‌های prompt-rewrite تکراری که توسط بیلدهای آسیب‌دیده 2026.4.24 ایجاد شده‌اند.
    - تشخیص tombstone بازیابی از راه‌اندازی مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌سازی پرچم‌های بازیابی abort شده stale تا startup دیگر child را همچنان restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (sessions، transcripts، state dir).
    - بررسی مجوزهای فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای نزدیک به انقضا را refresh کند، و وضعیت‌های cooldown/disabled مربوط به auth-profile را گزارش می‌دهد.
    - تشخیص دایرکتوری workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - تعمیر تصویر sandbox وقتی sandboxing فعال باشد.
    - مهاجرت سرویس قدیمی و تشخیص Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime Gateway (سرویس نصب‌شده اما در حال اجرا نیست؛ label ذخیره‌شده launchd).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا probe می‌شود).
    - بررسی‌های مجوز مخصوص کانال زیر `openclaw channels capabilities` قرار دارد؛ برای مثال، مجوزهای کانال صوتی Discord با `openclaw channels capabilities --channel discord --target channel:<channel-id>` ممیزی می‌شوند.
    - بررسی‌های پاسخ‌گویی WhatsApp برای سلامت تنزل‌یافته event-loop در Gateway در حالی که کلاینت‌های محلی TUI هنوز در حال اجرا هستند؛ `--fix` فقط کلاینت‌های محلی TUI تأییدشده را متوقف می‌کند.
    - تعمیر مسیر Codex برای model refهای قدیمی `openai-codex/*` در مدل‌های اصلی، fallbackها، بازنویسی‌های heartbeat/subagent/compaction، hookها، بازنویسی‌های مدل کانال، و pinهای مسیر نشست؛ `--fix` آن‌ها را به `openai/*` بازنویسی می‌کند، pinهای runtime stale در سطح نشست/کل عامل را حذف می‌کند، و refهای canonical عامل OpenAI را روی harness پیش‌فرض Codex باقی می‌گذارد.
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy تعبیه‌شده برای سرویس‌های Gateway که هنگام نصب یا به‌روزرسانی مقادیر shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را ثبت کرده‌اند.
    - بررسی‌های بهترین‌رویه runtime در Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی تداخل پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی منبع token وجود ندارد، تولید token را پیشنهاد می‌کند؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - تشخیص مشکل pairing دستگاه (درخواست‌های pair اولیه در انتظار، ارتقاهای role/scope در انتظار، drift حافظه نهان token دستگاه محلی stale، و drift احراز هویت رکورد paired).

  </Accordion>
  <Accordion title="Workspace and shell">
    - بررسی systemd linger در Linux.
    - بررسی اندازه فایل bootstrap در workspace (هشدارهای truncation/نزدیک به حد برای فایل‌های context).
    - بررسی آمادگی Skills برای عامل پیش‌فرض؛ skillهای مجاز با bin، env، config، یا نیازمندی‌های OS مفقود را گزارش می‌دهد، و `--fix` می‌تواند skillهای در دسترس نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت completion در shell و نصب/ارتقای خودکار.
    - بررسی آمادگی provider مربوط به embedding جست‌وجوی حافظه (مدل محلی، کلید API راه دور، یا باینری QMD).
    - بررسی‌های نصب از سورس (ناسازگاری workspace در pnpm، assetهای UI مفقود، باینری tsx مفقود).
    - پیکربندی به‌روزشده + metadata مربوط به wizard را می‌نویسد.

  </Accordion>
</AccordionGroup>

## backfill و reset در Dreams UI

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset** و **Clear Grounded** برای گردش‌کار dreaming grounded است. این اقدام‌ها از متدهای RPC به سبک doctor در Gateway استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کارهایی که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر grounded REM diary را اجرا می‌کند، و ورودی‌های backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان ورودی‌های diary علامت‌گذاری‌شده backfill را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط ورودی‌های کوتاه‌مدت staged grounded-only را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز live recall یا پشتیبانی روزانه جمع نکرده‌اند.

کارهایی که به‌تنهایی انجام **نمی‌دهند**:

- `MEMORY.md` را ویرایش نمی‌کنند
- مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- مگر اینکه ابتدا مسیر staged CLI را صراحتاً اجرا کنید، candidateهای grounded را به‌طور خودکار در live short-term promotion store stage نمی‌کنند

اگر می‌خواهید replay تاریخی grounded روی lane عادی deep promotion اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار candidateهای durable و grounded را در short-term dreaming store stage می‌کند و در عین حال `DREAMS.md` را به‌عنوان سطح review نگه می‌دارد.

## رفتار و منطق دقیق

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    اگر این یک git checkout باشد و doctor به‌صورت تعاملی در حال اجرا باشد، پیشنهاد می‌دهد پیش از اجرای doctor به‌روزرسانی انجام شود (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. Config normalization">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون بازنویسی مخصوص کانال)، doctor آن‌ها را به شِمای فعلی عادی‌سازی می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی گفتار Talk برابر است با `talk.provider` + `talk.providers.<provider>`، و پیکربندی صدای realtime برابر است با `talk.realtime.*`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را در map مربوط به provider بازنویسی می‌کند، و انتخاب‌گرهای realtime سطح بالای قدیمی (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) را به `talk.realtime` بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` خالی نباشد و سیاست ابزار از
    ورودی‌های wildcard یا ابزارهای متعلق به plugin استفاده کند هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهایی
    از pluginهایی match می‌شود که واقعاً load می‌شوند؛ این فهرست مجاز انحصاری plugin را دور نمی‌زند.
    Doctor مقدار `plugins.bundledDiscovery: "compat"` را برای پیکربندی‌های فهرست مجاز قدیمی migrated می‌نویسد
    تا رفتار provider bundled موجود حفظ شود، و
    سپس به تنظیم سخت‌گیرانه‌تر `"allowlist"` اشاره می‌کند.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شدند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با شِمای به‌روزشده بازنویسی می‌کند.

    startup مربوط به Gateway قالب‌های پیکربندی قدیمی را رد می‌کند و از شما می‌خواهد `openclaw doctor --fix` را اجرا کنید؛ هنگام startup، `openclaw.json` را بازنویسی نمی‌کند. مهاجرت‌های store مربوط به Cron job هم توسط `openclaw doctor --fix` انجام می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - پیکربندی‌های کانال پیکربندی‌شده که سیاست پاسخ مرئی ندارند → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` در سطح بالا
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` قدیمی → `talk.provider` + `talk.providers.<provider>`
    - گزینشگرهای Talk بلادرنگ قدیمی در سطح بالا (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - برای کانال‌هایی با `accounts` نام‌دار اما با مقادیر کانال تک‌حساب قدیمی در سطح بالای کانال، آن مقادیر محدود به حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک مقصد نام‌دار/پیش‌فرض منطبق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای زمان‌انتظارهای طولانی provider/model از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم قدیمی رله افزونه)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی Gateway همچنین به‌جای بسته‌شدن با خطا، providerهایی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده است نادیده می‌گیرد)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` را حذف کنید؛ app-server مربوط به Codex همیشه ابزارهای بومی فضای کاری Codex را بومی نگه می‌دارد

    هشدارهای Doctor همچنین راهنمایی حساب پیش‌فرض را برای کانال‌های چندحسابی شامل می‌شوند:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که مسیریابی fallback می‌تواند حسابی غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی یک شناسه حساب ناشناخته تنظیم شده باشد، doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های provider در OpenCode">
    اگر `models.providers.opencode`، `opencode-zen`، یا `opencode-go` را به‌صورت دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@earendil-works/pi-ai` را بازنویسی می‌کند. این می‌تواند مدل‌ها را روی API اشتباه مجبور کند یا هزینه‌ها را صفر کند. Doctor هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API و هزینه‌های مختص هر مدل را بازیابی کنید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر افزونه Chrome حذف‌شده اشاره می‌کند، doctor آن را به مدل اتصال Chrome MCP محلی روی میزبان فعلی نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    Doctor همچنین مسیر Chrome MCP محلی روی میزبان را وقتی از `defaultProfile: "user"` یا یک پروفایل پیکربندی‌شده `existing-session` استفاده می‌کنید بررسی می‌کند:

    - بررسی می‌کند که آیا Google Chrome برای پروفایل‌های اتصال خودکار پیش‌فرض روی همان میزبان نصب شده است
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - به شما یادآوری می‌کند که اشکال‌زدایی راه‌دور را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    Doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلی روی میزبان همچنان به این موارد نیاز دارد:

    - مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان gateway/node
    - مرورگر به‌صورت محلی در حال اجرا باشد
    - اشکال‌زدایی راه‌دور در آن مرورگر فعال باشد
    - تأیید نخستین درخواست رضایت اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. Existing-session محدودیت‌های فعلی مسیر Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود، و عملیات دسته‌ای همچنان به مرورگر مدیریت‌شده یا پروفایل خام CDP نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser، یا دیگر جریان‌های headless اعمال **نمی‌شود**. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای OAuth TLS">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، doctor نقطه پایانی مجوزدهی OpenAI را کاوش می‌کند تا تأیید کند پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر کاوش با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده، یا گواهی خودامضاشده)، doctor راهنمای رفع مشکل مختص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولاً `brew postinstall ca-certificates` است. با `--deep`، کاوش حتی وقتی gateway سالم است اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های provider برای Codex OAuth">
    اگر قبلاً تنظیمات انتقال قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر provider داخلی Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند پنهان کنند. Doctor وقتی آن تنظیمات انتقال قدیمی را در کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال کهنه را حذف یا بازنویسی کنید و رفتار داخلی مسیریابی/fallback را برگردانید. پراکسی‌های سفارشی و بازنویسی‌های فقط-header همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. تعمیر مسیر Codex">
    Doctor ارجاع‌های مدل قدیمی `openai-codex/*` را بررسی می‌کند. مسیریابی بومی harness مربوط به Codex از ارجاع‌های مدل متعارف `openai/*` استفاده می‌کند؛ نوبت‌های عامل OpenAI به‌جای مسیر OpenClaw PI OpenAI از طریق harness app-server مربوط به Codex عبور می‌کنند.

    در حالت `--fix` / `--repair`، doctor ارجاع‌های عامل پیش‌فرض و هر عامل را بازنویسی می‌کند، از جمله مدل‌های اصلی، fallbackها، بازنویسی‌های heartbeat/subagent/compaction، hookها، بازنویسی‌های مدل کانال، و وضعیت مسیر نشست پایدارشده کهنه:

    - `openai-codex/gpt-*` به `openai/gpt-*` تبدیل می‌شود.
    - intent مربوط به Codex برای ارجاع‌های مدل عامل تعمیرشده به ورودی‌های `agentRuntime.id: "codex"` محدود به provider/model منتقل می‌شود تا پس از تبدیل ارجاع مدل به `openai/*` همچنان بتوان پروفایل‌های auth با `openai-codex:...` را انتخاب کرد.
    - پیکربندی runtime کل عامل و pinهای runtime نشست پایدارشده کهنه حذف می‌شوند، چون انتخاب runtime محدود به provider/model است.
    - سیاست runtime موجود provider/model حفظ می‌شود مگر اینکه ارجاع مدل قدیمی تعمیرشده برای حفظ مسیر auth قدیمی به مسیریابی Codex نیاز داشته باشد.
    - فهرست‌های fallback مدل موجود با بازنویسی ورودی‌های قدیمی‌شان حفظ می‌شوند؛ تنظیمات هر مدلِ کپی‌شده از کلید قدیمی به کلید متعارف `openai/*` منتقل می‌شوند.
    - `modelProvider`/`providerOverride`، `model`/`modelOverride`، اعلان‌های fallback، و pinهای پروفایل auth نشست پایدارشده در همه storeهای نشست عامل کشف‌شده تعمیر می‌شوند.
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از چت کنترل یا bind کن.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از adapter خارجی ACP/acpx استفاده کن.»

  </Accordion>
  <Accordion title="2g. پاک‌سازی مسیر نشست">
    Doctor همچنین storeهای نشست عامل کشف‌شده را برای وضعیت مسیر خودکارساخته و کهنه پس از انتقال مدل‌های پیکربندی‌شده یا runtime از مسیری متعلق به Plugin مانند Codex اسکن می‌کند.

    `openclaw doctor --fix` می‌تواند وضعیت کهنه خودکارساخته مانند pinهای مدل `modelOverrideSource: "auto"`، فراداده مدل runtime، شناسه‌های harness پین‌شده، bindingهای نشست CLI، و بازنویسی‌های خودکار پروفایل auth را وقتی مسیر مالک آن‌ها دیگر پیکربندی نشده است پاک کند. انتخاب‌های صریح کاربر یا نشست قدیمی برای مدل، برای بازبینی دستی گزارش می‌شوند و دست‌نخورده می‌مانند؛ وقتی آن مسیر دیگر مدنظر نیست، آن‌ها را با `/model ...`، `/new`، یا بازنشانی نشست تغییر دهید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    Doctor می‌تواند چیدمان‌های قدیمی‌تر روی دیسک را به ساختار فعلی مهاجرت دهد:

    - store نشست‌ها + transcriptها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - پوشه عامل:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت auth برای WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها best-effort و idempotent هستند؛ doctor وقتی هر پوشه قدیمی را به‌عنوان پشتیبان باقی بگذارد هشدار منتشر می‌کند. Gateway/CLI نیز هنگام راه‌اندازی store نشست‌های قدیمی + پوشه عامل را به‌صورت خودکار مهاجرت می‌کند تا تاریخچه/auth/مدل‌ها بدون اجرای دستی doctor در مسیر هر عامل قرار بگیرند. نرمال‌سازی provider/provider-map برای Talk اکنون با برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌هایی که فقط مربوط به ترتیب کلید هستند دیگر تغییرات بی‌اثر تکراری `doctor --fix` را فعال نمی‌کنند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های manifest قدیمی Plugin">
    Doctor همه manifestهای Plugin نصب‌شده را برای کلیدهای capability قدیمی در سطح بالا (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به شیء `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقادیر را داشته باشد، کلید قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های store قدیمی cron">
    Doctor همچنین store کار cron را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی بازنویسی شده باشد) برای شکل‌های قدیمی job که scheduler همچنان برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی cron شامل این موارد است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای سطح بالای بار (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای سطح بالای تحویل (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - نام‌های مستعار تحویل `provider` در بار → `delivery.channel` صریح
    - کارهای جایگزین Webhook ساده قدیمی با `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    Doctor فقط زمانی کارهای `notify: true` را خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر کاری جایگزین notify قدیمی را با یک حالت تحویل غیر-Webhook موجود ترکیب کند، Doctor هشدار می‌دهد و آن کار را برای بازبینی دستی باقی می‌گذارد.

    در Linux، Doctor همچنین زمانی هشدار می‌دهد که crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را فراخوانی می‌کند. آن اسکریپت محلی میزبان توسط OpenClaw فعلی نگهداری نمی‌شود و وقتی Cron نتواند به گذرگاه کاربر systemd برسد، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی کهنه crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor` و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    Doctor هر دایرکتوری نشست عامل را برای فایل‌های قفل نوشتن کهنه اسکن می‌کند — فایل‌هایی که وقتی یک نشست به‌طور غیرعادی خارج شده باقی مانده‌اند. برای هر فایل قفل پیدا شده، این موارد را گزارش می‌کند: مسیر، PID، اینکه آیا PID هنوز زنده است، سن قفل، و اینکه آیا کهنه محسوب می‌شود یا نه (PID مرده، قدیمی‌تر از ۳۰ دقیقه، یا PID زنده‌ای که بتوان ثابت کرد به فرایندی غیر از OpenClaw تعلق دارد). در حالت `--fix` / `--repair`، فایل‌های قفل کهنه را خودکار حذف می‌کند؛ در غیر این صورت یادداشتی چاپ می‌کند و از شما می‌خواهد دوباره با `--fix` اجرا کنید.
  </Accordion>
  <Accordion title="3d. تعمیر شاخه رونوشت نشست">
    Doctor فایل‌های JSONL نشست عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی رونوشت پرامپت 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با زمینه runtime داخلی OpenClaw به‌علاوه یک هم‌نیا فعال که همان پرامپت قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، Doctor از هر فایل آسیب‌دیده کنار فایل اصلی پشتیبان می‌گیرد و رونوشت را به شاخه فعال بازنویسی می‌کند تا تاریخچه Gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (پایداری نشست، مسیریابی و ایمنی)">
    دایرکتوری وضعیت ساقه مغز عملیاتی است. اگر ناپدید شود، نشست‌ها، اعتبارنامه‌ها، گزارش‌ها و پیکربندی را از دست می‌دهید (مگر اینکه در جای دیگری پشتیبان داشته باشید).

    Doctor بررسی می‌کند:

    - **دایرکتوری وضعیت وجود ندارد**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، درخواست بازایجاد دایرکتوری را نشان می‌دهد، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: نوشتنی بودن را بررسی می‌کند؛ پیشنهاد تعمیر مجوزها را می‌دهد (و وقتی عدم تطابق مالک/گروه تشخیص داده شود، راهنمایی `chown` صادر می‌کند).
    - **دایرکتوری وضعیت همگام‌شده با ابر در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای مبتنی بر همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت روی SD یا eMMC در Linux**: وقتی وضعیت به منبع mount از نوع `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی مبتنی بر SD یا eMMC می‌تواند تحت نوشتن نشست و اعتبارنامه کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های نشست وجود ندارند**: `sessions/` و دایرکتوری ذخیره نشست برای پایدارسازی تاریخچه و جلوگیری از crashهای `ENOENT` لازم هستند.
    - **عدم تطابق رونوشت**: وقتی ورودی‌های نشست اخیر فایل‌های رونوشت گمشده داشته باشند هشدار می‌دهد.
    - **نشست اصلی "JSONL یک‌خطی"**: وقتی رونوشت اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه انباشته نمی‌شود).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های home وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآور حالت راه‌دور**: اگر `gateway.mode=remote` باشد، Doctor یادآوری می‌کند که آن را روی میزبان راه‌دور اجرا کنید (وضعیت آنجا قرار دارد).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/جهان خواندنی باشد هشدار می‌دهد و پیشنهاد سخت‌گیرانه کردن به `600` را می‌دهد.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در محل ذخیره احراز هویت بررسی می‌کند، وقتی توکن‌ها در حال انقضا/منقضی‌شده هستند هشدار می‌دهد، و وقتی امن باشد می‌تواند آن‌ها را تازه‌سازی کند. اگر پروفایل OAuth/توکن Anthropic کهنه باشد، یک کلید API Anthropic یا مسیر setup-token Anthropic را پیشنهاد می‌کند. درخواست‌های تازه‌سازی فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های تازه‌سازی را رد می‌کند.

    وقتی تازه‌سازی OAuth به‌طور دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا ارائه‌دهنده‌ای که از شما می‌خواهد دوباره وارد شوید)، Doctor گزارش می‌دهد که احراز هویت دوباره لازم است و فرمان دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های احراز هویتی را گزارش می‌کند که به‌طور موقت به این دلایل غیرقابل استفاده هستند:

    - cooldownهای کوتاه (محدودیت نرخ/مهلت زمانی/خرابی‌های احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (خرابی‌های صورتحساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hookها">
    اگر `hooks.gmail.model` تنظیم شده باشد، Doctor مرجع مدل را در برابر کاتالوگ و allowlist اعتبارسنجی می‌کند و وقتی resolve نشود یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. تعمیر تصویر sandbox">
    وقتی sandboxing فعال باشد، Doctor تصویرهای Docker را بررسی می‌کند و اگر تصویر فعلی وجود نداشته باشد پیشنهاد ساخت یا تغییر به نام‌های قدیمی را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    Doctor در حالت `openclaw doctor --fix` / `openclaw doctor --repair` وضعیت staging وابستگی Plugin تولیدشده قدیمی OpenClaw را حذف می‌کند. این شامل ریشه‌های وابستگی تولیدشده کهنه، دایرکتوری‌های مرحله نصب قدیمی، آوار محلی بسته از کد تعمیر وابستگی bundled-plugin قبلی، و کپی‌های npm مدیریت‌شده یتیم یا بازیابی‌شده از Pluginهای bundled `@openclaw/*` است که می‌توانند manifest bundled فعلی را سایه کنند.

    Doctor همچنین می‌تواند وقتی پیکربندی به Pluginهای قابل دانلود اشاره می‌کند اما registry محلی Plugin نمی‌تواند آن‌ها را پیدا کند، Pluginهای قابل دانلود گمشده را دوباره نصب کند. مثال‌ها شامل `plugins.entries` مادی، تنظیمات پیکربندی‌شده channel/provider/search، و runtimeهای عامل پیکربندی‌شده هستند. هنگام به‌روزرسانی بسته، Doctor از اجرای تعمیر Plugin توسط package manager در زمانی که بسته هسته در حال تعویض است خودداری می‌کند؛ اگر یک Plugin پیکربندی‌شده هنوز به بازیابی نیاز دارد، پس از به‌روزرسانی دوباره `openclaw doctor --fix` را اجرا کنید. راه‌اندازی Gateway و بارگذاری دوباره پیکربندی package managerها را اجرا نمی‌کنند؛ نصب Pluginها همچنان کار صریح doctor/install/update باقی می‌ماند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنمایی‌های پاک‌سازی">
    Doctor سرویس‌های Gateway قدیمی (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد حذف آن‌ها و نصب سرویس OpenClaw با پورت Gateway فعلی را می‌دهد. همچنین می‌تواند برای سرویس‌های اضافی شبیه Gateway اسکن کند و راهنمایی‌های پاک‌سازی چاپ کند. سرویس‌های Gateway OpenClaw با نام پروفایل درجه‌اول محسوب می‌شوند و به‌عنوان "اضافی" علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس Gateway سطح کاربر وجود نداشته باشد اما یک سرویس Gateway OpenClaw سطح سیستم وجود داشته باشد، Doctor به‌طور خودکار یک سرویس سطح کاربر دوم نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس مورد تکراری را حذف کنید یا وقتی supervisor سیستم مالک lifecycle Gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Startup Matrix">
    وقتی یک حساب channel Matrix یک مهاجرت وضعیت قدیمی معلق یا قابل اقدام داشته باشد، Doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس گام‌های مهاجرت best-effort را اجرا می‌کند: مهاجرت وضعیت Matrix قدیمی و آماده‌سازی وضعیت رمزنگاری‌شده قدیمی. هر دو گام غیرکشنده هستند؛ خطاها ثبت می‌شوند و راه‌اندازی ادامه می‌یابد. در حالت فقط‌خواندنی (`openclaw doctor` بدون `--fix`) این بررسی کاملا رد می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و رانش احراز هویت">
    Doctor اکنون وضعیت جفت‌سازی دستگاه را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌کند:

    - درخواست‌های جفت‌سازی بار اول معلق
    - ارتقاهای نقش معلق برای دستگاه‌هایی که قبلا جفت شده‌اند
    - ارتقاهای scope معلق برای دستگاه‌هایی که قبلا جفت شده‌اند
    - تعمیرهای عدم تطابق کلید عمومی که در آن id دستگاه هنوز مطابق است اما هویت دستگاه دیگر با رکورد تاییدشده مطابق نیست
    - رکوردهای جفت‌شده‌ای که برای یک نقش تاییدشده توکن فعال ندارند
    - توکن‌های جفت‌شده‌ای که scopeهایشان از baseline جفت‌سازی تاییدشده خارج شده است
    - ورودی‌های کش‌شده محلی device-token برای ماشین فعلی که قدیمی‌تر از چرخش توکن سمت Gateway هستند یا metadata scope کهنه دارند

    Doctor درخواست‌های جفت‌سازی را خودکار تایید نمی‌کند یا توکن‌های دستگاه را خودکار نمی‌چرخاند. در عوض گام‌های بعدی دقیق را چاپ می‌کند:

    - درخواست‌های معلق را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تایید کنید
    - یک توکن تازه را با `openclaw devices rotate --device <deviceId> --role <role>` بچرخانید
    - یک رکورد کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره تایید کنید

    این رخنه رایج "قبلا جفت شده اما هنوز خطای نیاز به جفت‌سازی می‌گیرد" را می‌بندد: Doctor اکنون جفت‌سازی بار اول را از ارتقاهای نقش/scope معلق و از رانش توکن/هویت دستگاه کهنه متمایز می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک ارائه‌دهنده بدون allowlist برای DMها باز باشد، یا وقتی یک policy به شکلی خطرناک پیکربندی شده باشد، هشدار صادر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، Doctor مطمئن می‌شود lingering فعال است تا Gateway پس از خروج از سیستم زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (Skills، Pluginها و دایرکتوری‌های قدیمی)">
    Doctor خلاصه‌ای از وضعیت workspace را برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: Skills واجد شرایط، دارای requirements گمشده، و مسدودشده توسط allowlist را می‌شمارد.
    - **دایرکتوری‌های workspace قدیمی**: وقتی `~/openclaw` یا دایرکتوری‌های workspace قدیمی دیگر در کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای فعال/غیرفعال/خطادار را می‌شمارد؛ برای هر خطا IDهای Plugin را فهرست می‌کند؛ قابلیت‌های bundle plugin را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را علامت‌گذاری می‌کند که با runtime فعلی مشکل سازگاری دارند.
    - **عیب‌یابی‌های Plugin**: هر هشدار یا خطای زمان بارگذاری صادرشده توسط registry Plugin را نمایان می‌کند.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا فایل‌های زمینه تزریق‌شده دیگر) نزدیک یا فراتر از بودجه کاراکتر پیکربندی‌شده هستند یا نه. برای هر فایل، تعداد کاراکتر خام در برابر تزریق‌شده، درصد truncation، علت truncation (`max/file` یا `max/total`)، و کل کاراکترهای تزریق‌شده را به‌عنوان کسری از بودجه کل گزارش می‌کند. وقتی فایل‌ها کوتاه شده باشند یا نزدیک حد باشند، Doctor نکاتی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin channel کهنه">
    وقتی `openclaw doctor --fix` یک Plugin channel گمشده را حذف می‌کند، پیکربندی dangling با scope channel را هم که به آن Plugin اشاره می‌کرد حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های Heartbeat که نام channel را آورده بودند، و overrideهای `agents.*.models["<channel>/*"]`. این از حلقه‌های بوت Gateway جلوگیری می‌کند که در آن runtime channel از بین رفته اما پیکربندی هنوز از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند که آیا تکمیل tab برای shell فعلی (zsh، bash، fish، یا PowerShell) نصب شده است یا نه:

    - اگر پروفایل shell از الگوی تکمیل پویای کند (`source <(openclaw completion ...)`) استفاده کند، Doctor آن را به نوع فایل کش‌شده سریع‌تر ارتقا می‌دهد.
    - اگر تکمیل در پروفایل پیکربندی شده باشد اما فایل کش وجود نداشته باشد، Doctor کش را خودکار دوباره تولید می‌کند.
    - اگر هیچ تکمیلی اصلا پیکربندی نشده باشد، Doctor درخواست نصب آن را نشان می‌دهد (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای بازتولید دستی کش، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (توکن محلی)">
    Doctor آمادگی احراز هویت با توکن Gateway محلی را بررسی می‌کند.

    - اگر حالت توکن به توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، Doctor پیشنهاد می‌دهد یکی تولید کند.
    - اگر `gateway.auth.token` با SecretRef مدیریت شود اما در دسترس نباشد، Doctor هشدار می‌دهد و آن را با متن ساده بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط زمانی تولید را اجبار می‌کند که هیچ SecretRef توکنی پیکربندی نشده باشد.

  </Accordion>
  <Accordion title="12b. ترمیم‌های فقط‌خواندنی آگاه از SecretRef">
    بعضی جریان‌های ترمیم باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار fail-fast در زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` اکنون برای ترمیم‌های هدفمند پیکربندی از همان مدل خلاصه فقط‌خواندنی SecretRef استفاده می‌کند که فرمان‌های خانواده وضعیت استفاده می‌کنند.
    - مثال: ترمیم `@username` در Telegram `allowFrom` / `groupAllowFrom` تلاش می‌کند در صورت در دسترس بودن از اعتبارنامه‌های ربات پیکربندی‌شده استفاده کند.
    - اگر توکن ربات Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، Doctor گزارش می‌دهد که اعتبارنامه پیکربندی‌شده اما در دسترس نیست و به‌جای خراب شدن یا گزارش نادرستِ گم‌شدن توکن، حل خودکار را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی مجدد">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی مجدد آن را می‌دهد.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند که آیا ارائه‌دهنده embedding جست‌وجوی حافظه پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و ارائه‌دهنده پیکربندی‌شده بستگی دارد:

    - **backend ‏QMD**: بررسی می‌کند که آیا باینری `qmd` در دسترس و قابل شروع است یا نه. اگر نباشد، راهنمای رفع مشکل شامل بسته npm و گزینه مسیر دستی باینری را چاپ می‌کند.
    - **ارائه‌دهنده محلی صریح**: وجود فایل مدل محلی یا URL مدل راه‌دور/قابل‌دانلود شناخته‌شده را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌دهد به یک ارائه‌دهنده راه‌دور تغییر دهید.
    - **ارائه‌دهنده راه‌دور صریح** (`openai`، `voyage` و غیره): تأیید می‌کند که یک کلید API در محیط یا مخزن احراز هویت وجود دارد. اگر گم شده باشد، راهنمایی‌های قابل‌اقدام برای رفع مشکل چاپ می‌کند.
    - **ارائه‌دهنده خودکار**: ابتدا در دسترس بودن مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهنده راه‌دور را به ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی نتیجه probe کش‌شده Gateway در دسترس باشد (Gateway در زمان بررسی سالم بوده باشد)، Doctor نتیجه آن را با پیکربندی قابل‌مشاهده برای CLI تطبیق می‌دهد و هر ناسازگاری را یادداشت می‌کند. Doctor در مسیر پیش‌فرض یک ping تازه embedding شروع نمی‌کند؛ وقتی بررسی زنده ارائه‌دهنده را می‌خواهید، از فرمان وضعیت حافظه عمیق استفاده کنید.

    از `openclaw memory status --deep` برای تأیید آمادگی embedding در زمان اجرا استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، Doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با اصلاحات پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. ممیزی + ترمیم پیکربندی supervisor">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های گم‌شده یا قدیمی (مانند وابستگی‌های network-online در systemd و تأخیر راه‌اندازی مجدد) بررسی می‌کند. وقتی ناهماهنگی پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل سرویس/وظیفه را با پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` promptهای ترمیم پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` اصلاحات توصیه‌شده را بدون prompt اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های supervisor سفارشی را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` دکتر را برای چرخه عمر سرویس Gateway فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌دهد و ترمیم‌های غیرسرویسی را اجرا می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس، بازنویسی‌های پیکربندی supervisor، و پاک‌سازی سرویس قدیمی را رد می‌کند، چون یک supervisor خارجی مالک آن چرخه عمر است.
    - در Linux، وقتی واحد systemd متناظر Gateway فعال است، Doctor فراداده فرمان/entrypoint را بازنویسی نمی‌کند. همچنین در زمان اسکن سرویس تکراری، واحدهای اضافی غیرفعال و غیرقدیمیِ شبیه Gateway را نادیده می‌گیرد تا فایل‌های سرویس همراه نویز پاک‌سازی ایجاد نکنند.
    - اگر احراز هویت توکن به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/ترمیم سرویس Doctor اعتبار SecretRef را بررسی می‌کند اما مقادیر توکن متن ساده حل‌شده را در فراداده محیط سرویس supervisor ذخیره نمی‌کند.
    - Doctor مقادیر محیط سرویس مدیریت‌شده مبتنی بر `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd، یا Windows Scheduled Task به‌صورت درون‌خطی تعبیه کرده‌اند شناسایی می‌کند و فراداده سرویس را بازنویسی می‌کند تا آن مقادیر به‌جای تعریف supervisor از منبع زمان اجرای خود بارگیری شوند.
    - Doctor تشخیص می‌دهد که فرمان سرویس بعد از تغییر `gateway.port` هنوز یک `--port` قدیمی را ثابت نگه داشته است و فراداده سرویس را به پورت فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکن به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، Doctor مسیر نصب/ترمیم را با راهنمایی قابل‌اقدام مسدود می‌کند.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، Doctor نصب/ترمیم را تا زمانی که حالت به‌صورت صریح تنظیم شود مسدود می‌کند.
    - برای واحدهای user-systemd در Linux، بررسی‌های انحراف توکن Doctor اکنون هنگام مقایسه فراداده احراز هویت سرویس، هم منابع `Environment=` و هم `EnvironmentFile=` را شامل می‌شود.
    - ترمیم‌های سرویس Doctor وقتی پیکربندی آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد، از بازنویسی، توقف، یا راه‌اندازی مجدد یک سرویس Gateway از باینری قدیمی‌تر OpenClaw خودداری می‌کنند. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید بازنویسی کامل را از طریق `openclaw gateway install --force` اجبار کنید.

  </Accordion>
  <Accordion title="16. تشخیص‌های زمان اجرای Gateway + پورت">
    Doctor زمان اجرای سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما واقعاً در حال اجرا نیست هشدار می‌دهد. همچنین تداخل‌های پورت روی پورت Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل را گزارش می‌دهد (Gateway از قبل در حال اجراست، تونل SSH).
  </Accordion>
  <Accordion title="17. بهترین روش‌های زمان اجرای Gateway">
    Doctor وقتی سرویس Gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای مدیر نسخه می‌توانند بعد از ارتقا خراب شوند چون سرویس init پوسته شما را بارگیری نمی‌کند. Doctor در صورت در دسترس بودن، پیشنهاد مهاجرت به نصب Node سیستمی را می‌دهد (Homebrew/apt/choco).

    LaunchAgentهای macOS تازه نصب‌شده یا ترمیم‌شده به‌جای کپی کردن PATH پوسته تعاملی، از یک PATH سیستمی canonical (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین باینری‌های سیستمی مدیریت‌شده با Homebrew همچنان در دسترس می‌مانند، در حالی که Volta، asdf، fnm، pnpm، و دیگر دایرکتوری‌های مدیر نسخه تعیین نمی‌کنند پردازه‌های فرزند Node به کدام مورد resolve شوند. سرویس‌های Linux همچنان ریشه‌های محیط صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های user-bin پایدار را نگه می‌دارند، اما دایرکتوری‌های fallback حدسی مدیر نسخه فقط زمانی در PATH سرویس نوشته می‌شوند که آن دایرکتوری‌ها روی دیسک وجود داشته باشند.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + فراداده wizard">
    Doctor هر تغییر پیکربندی را ذخیره می‌کند و فراداده wizard را مهر می‌زند تا اجرای Doctor ثبت شود.
  </Accordion>
  <Accordion title="19. نکته‌های workspace (پشتیبان‌گیری + سیستم حافظه)">
    Doctor وقتی سیستم حافظه workspace موجود نباشد آن را پیشنهاد می‌دهد و اگر workspace از قبل زیر git نباشد، یک نکته پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و پشتیبان‌گیری git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook ‏Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
