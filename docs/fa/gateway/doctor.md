---
read_when:
    - افزودن یا اصلاح مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل ترمیم'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-03T11:35:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. پیکربندی/وضعیت کهنه را اصلاح می‌کند، سلامت را بررسی می‌کند، و گام‌های عملی برای تعمیر ارائه می‌دهد.

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

    تعمیرهای پیشنهادی را بدون پرسش اعمال کنید (تعمیرها + راه‌اندازی‌های مجدد در موارد امن).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    تعمیرهای تهاجمی را هم اعمال کنید (پیکربندی‌های supervisor سفارشی را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    بدون prompt اجرا کنید و فقط مهاجرت‌های امن را اعمال کنید (عادی‌سازی پیکربندی + جابه‌جایی‌های وضعیت روی دیسک). اقدامات راه‌اندازی مجدد/سرویس/sandbox را که به تأیید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام تشخیص به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های Gateway اضافی اسکن کنید (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید پیش از نوشتن تغییرات را بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## چه کاری انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، UI، و به‌روزرسانی‌ها">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل UI (وقتی شِمای پروتکل جدیدتر باشد Control UI را دوباره می‌سازد).
    - بررسی سلامت + prompt راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/مفقود/مسدود) و وضعیت plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - عادی‌سازی پیکربندی برای مقدارهای قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای override ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌انداختن OAuth در Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای TLS برای پروفایل‌های OpenAI Codex OAuth.
    - هشدارهای allowlist مربوط به plugin/tool وقتی `plugins.allow` محدودکننده است اما سیاست ابزار هنوز wildcard یا ابزارهای متعلق به plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/WhatsApp auth).
    - مهاجرت کلید قرارداد manifest قدیمی plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت store قدیمی cron (`jobId`, `schedule.cron`, فیلدهای سطح‌بالای delivery/payload، payload `provider`، jobهای fallback ساده webhook با `notify: true`).
    - مهاجرت سیاست runtime عامل قدیمی به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی کهنه plugin وقتی pluginها فعال‌اند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های کهنه plugin به‌عنوان پیکربندی containment بی‌اثر در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل lock نشست و پاک‌سازی lock کهنه.
    - تعمیر transcript نشست برای شاخه‌های تکراری بازنویسی prompt که توسط buildهای تحت‌تأثیر 2026.4.24 ایجاد شده‌اند.
    - تشخیص tombstone بازیابی-راه‌اندازی مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌کردن flagهای بازیابی لغوشده کهنه تا startup همچنان child را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (sessions, transcripts, state dir).
    - بررسی‌های مجوز فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت auth مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای نزدیک به انقضا را refresh کند، و وضعیت‌های cooldown/disabled مربوط به auth-profile را گزارش می‌دهد.
    - تشخیص دایرکتوری workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و supervisorها">
    - تعمیر image مربوط به sandbox وقتی sandboxing فعال است.
    - مهاجرت سرویس قدیمی و تشخیص Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime مربوط به Gateway (سرویس نصب شده اما اجرا نمی‌شود؛ برچسب launchd cache شده).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا probe می‌شود).
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) همراه با تعمیر اختیاری.
    - پاک‌سازی محیط proxy تعبیه‌شده برای سرویس‌های Gateway که هنگام نصب یا به‌روزرسانی مقدارهای shell مربوط به `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را ثبت کرده‌اند.
    - بررسی‌های بهترین‌رویه runtime مربوط به Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی برخورد port Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="Auth، امنیت، و pair کردن">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های auth مربوط به Gateway برای حالت token محلی (وقتی منبع token وجود ندارد تولید token را پیشنهاد می‌دهد؛ پیکربندی‌های SecretRef مربوط به token را بازنویسی نمی‌کند).
    - تشخیص مشکل در pair کردن دستگاه (درخواست‌های pair اولیه در انتظار، ارتقاهای role/scope در انتظار، drift کهنه cache محلی device-token، و drift auth رکورد pair شده).

  </Accordion>
  <Accordion title="Workspace و shell">
    - بررسی systemd linger در Linux.
    - بررسی اندازه فایل bootstrap workspace (هشدارهای کوتاه‌شدن/نزدیک‌به‌حد برای فایل‌های context).
    - بررسی آمادگی Skills برای عامل پیش‌فرض؛ skills مجاز با bin، env، config، یا نیازمندی‌های OS مفقود را گزارش می‌دهد، و `--fix` می‌تواند skills دردسترس‌نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت shell completion و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding جست‌وجوی memory (مدل محلی، کلید API راه دور، یا binary مربوط به QMD).
    - بررسی‌های نصب از source (عدم تطابق pnpm workspace، assetهای UI مفقود، binary مفقود tsx).
    - پیکربندی به‌روزشده + فراداده wizard را می‌نویسد.

  </Accordion>
</AccordionGroup>

## backfill و reset در UI مربوط به Dreams

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset**، و **Clear Grounded** برای workflow مربوط به grounded dreaming است. این اقدام‌ها از متدهای RPC به سبک gateway doctor استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر grounded REM diary را اجرا می‌کند، و entryهای backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان entryهای diary علامت‌گذاری‌شده backfill را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط entryهای کوتاه‌مدت staged و فقط grounded را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه جمع نکرده‌اند.

کاری که به‌تنهایی انجام **نمی‌دهند**:

- `MEMORY.md` را ویرایش نمی‌کنند
- مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- کاندیداهای grounded را به‌طور خودکار در store زنده promotion کوتاه‌مدت stage نمی‌کنند، مگر اینکه ابتدا مسیر CLI مربوط به staged را صراحتاً اجرا کنید

اگر می‌خواهید replay تاریخی grounded بر lane عادی deep promotion اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار کاندیداهای پایدار grounded را در store کوتاه‌مدت dreaming stage می‌کند، در حالی که `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار تفصیلی و منطق

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک checkout مربوط به git باشد و doctor به‌صورت تعاملی اجرا شود، پیشنهاد می‌دهد پیش از اجرای doctor به‌روزرسانی انجام شود (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. عادی‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override اختصاصی کانال)، doctor آن‌ها را به شِمای فعلی عادی‌سازی می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی Talk برابر است با `talk.provider` + `talk.providers.<provider>`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را به map ارائه‌دهنده بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` غیرخالی است و سیاست ابزار از
    entryهای wildcard یا ابزار متعلق به plugin استفاده می‌کند، هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهای
    pluginهایی match می‌شود که واقعاً load می‌شوند؛ این allowlist انحصاری plugin را
    دور نمی‌زند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با شِمای به‌روزشده بازنویسی می‌کند.

    Gateway نیز هنگام startup وقتی یک قالب پیکربندی قدیمی را تشخیص می‌دهد، مهاجرت‌های doctor را به‌طور خودکار اجرا می‌کند، بنابراین پیکربندی‌های کهنه بدون مداخله دستی تعمیر می‌شوند. مهاجرت‌های store مربوط به Cron job توسط `openclaw doctor --fix` انجام می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - پیکربندی‌های کانال پیکربندی‌شده که سیاست پاسخ مرئی ندارند → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` سطح بالا
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` قدیمی → `talk.provider` + `talk.providers.<provider>`
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
    - برای کانال‌هایی که `accounts` نام‌گذاری‌شده دارند اما هنوز مقدارهای کانال تک‌حسابی در سطح بالای کانال باقی مانده‌اند، آن مقدارهای محدود به حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک مقصد نام‌گذاری‌شده/پیش‌فرض منطبق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای مهلت‌های زمانی ارائه‌دهنده/مدل کند از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم قدیمی رله افزونه)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی Gateway همچنین ارائه‌دهندگانی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده است، به‌جای شکست بسته، نادیده می‌گیرد)

    هشدارهای Doctor همچنین راهنمای حساب پیش‌فرض را برای کانال‌های چندحسابی شامل می‌شوند:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، Doctor هشدار می‌دهد که مسیریابی جایگزین می‌تواند یک حساب غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی شناسه حساب ناشناخته‌ای تنظیم شده باشد، Doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های ارائه‌دهنده OpenCode">
    اگر `models.providers.opencode`، `opencode-zen` یا `opencode-go` را به‌صورت دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این می‌تواند مدل‌ها را مجبور کند از API اشتباه استفاده کنند یا هزینه‌ها را صفر کند. Doctor هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API و هزینه‌های هر مدل را بازیابی کنید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر افزونه حذف‌شده Chrome اشاره می‌کند، Doctor آن را به مدل فعلی اتصال Chrome MCP محلی میزبان عادی‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    وقتی از `defaultProfile: "user"` یا یک پروفایل `existing-session` پیکربندی‌شده استفاده می‌کنید، Doctor مسیر Chrome MCP محلی میزبان را نیز بررسی می‌کند:

    - بررسی می‌کند که آیا Google Chrome برای پروفایل‌های اتصال خودکار پیش‌فرض روی همان میزبان نصب است یا نه
    - نسخه شناسایی‌شده Chrome را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که اشکال‌زدایی از راه دور را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging` یا `edge://inspect/#remote-debugging`)

    Doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلی میزبان همچنان به این موارد نیاز دارد:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان gateway/node
    - اجرای محلی مرورگر
    - فعال بودن اشکال‌زدایی از راه دور در آن مرورگر
    - تأیید نخستین درخواست رضایت اتصال در مرورگر

    آمادگی در اینجا فقط به پیش‌نیازهای اتصال محلی مربوط است. Existing-session محدودیت‌های فعلی مسیر Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود و عملیات دسته‌ای همچنان به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser یا جریان‌های headless دیگر اعمال نمی‌شود. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای TLS برای OAuth">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، Doctor نقطه پایانی مجوزدهی OpenAI را بررسی می‌کند تا تأیید کند که پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر بررسی با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده یا گواهی خودامضا)، Doctor راهنمای رفع مشکل مختص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولاً `brew postinstall ca-certificates` است. با `--deep`، بررسی حتی اگر Gateway سالم باشد هم اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های ارائه‌دهنده Codex OAuth">
    اگر قبلاً تنظیمات انتقال قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر ارائه‌دهنده داخلی Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند تحت‌الشعاع قرار دهند. Doctor وقتی آن تنظیمات انتقال قدیمی را کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال کهنه را حذف یا بازنویسی کنید و رفتار مسیریابی/جایگزینی داخلی را برگردانید. پراکسی‌های سفارشی و بازنویسی‌های فقط-هدر همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. هشدارهای مسیر Plugin Codex">
    وقتی Plugin همراه Codex فعال باشد، Doctor همچنین بررسی می‌کند که آیا ارجاع‌های مدل اصلی `openai-codex/*` همچنان از طریق اجراکننده پیش‌فرض PI resolve می‌شوند یا نه. این ترکیب وقتی معتبر است که احراز هویت Codex OAuth/اشتراک را از طریق PI بخواهید، اما به‌راحتی با چارچوب app-server بومی Codex اشتباه گرفته می‌شود. Doctor هشدار می‌دهد و به شکل صریح app-server اشاره می‌کند: `openai/*` به‌همراه `agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor این مورد را به‌صورت خودکار تعمیر نمی‌کند، چون هر دو مسیر معتبر هستند:

    - `openai-codex/*` + PI یعنی «از احراز هویت Codex OAuth/اشتراک از طریق اجراکننده عادی OpenClaw استفاده کن.»
    - `openai/*` + `agentRuntime.id: "codex"` یعنی «نوبت تعبیه‌شده را از طریق app-server بومی Codex اجرا کن.»
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از چت کنترل یا bind کن.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از آداپتور خارجی ACP/acpx استفاده کن.»

    اگر هشدار ظاهر شد، مسیری را که قصد داشتید انتخاب کنید و پیکربندی را دستی ویرایش کنید. وقتی PI Codex OAuth عمدی است، هشدار را همان‌طور نگه دارید.

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

    این مهاجرت‌ها best-effort و idempotent هستند؛ Doctor وقتی هر پوشه قدیمی را به‌عنوان پشتیبان باقی بگذارد، هشدار صادر می‌کند. Gateway/CLI همچنین نشست‌های قدیمی + پوشه عامل را در زمان راه‌اندازی به‌صورت خودکار مهاجرت می‌دهد تا تاریخچه/احراز هویت/مدل‌ها بدون اجرای دستی Doctor در مسیر هر عامل قرار بگیرند. احراز هویت WhatsApp عمداً فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. عادی‌سازی ارائه‌دهنده/نقشه ارائه‌دهنده Talk اکنون با برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌های صرفاً ترتیب کلید دیگر باعث تغییرات تکراری بی‌اثر `doctor --fix` نمی‌شوند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های مانیفست Plugin قدیمی">
    Doctor همه مانیفست‌های Plugin نصب‌شده را برای کلیدهای قابلیت سطح بالای منسوخ (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به شیء `contracts` منتقل کند و فایل مانیفست را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقدارها را داشته باشد، کلید قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های ذخیره‌گاه Cron قدیمی">
    Doctor همچنین ذخیره‌گاه کار Cron را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` هنگام بازنویسی) برای شکل‌های قدیمی کار که زمان‌بند هنوز برای سازگاری می‌پذیرد، بررسی می‌کند.

    پاک‌سازی‌های فعلی Cron شامل این موارد است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload سطح بالا (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای delivery سطح بالا (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - نام‌های مستعار delivery برای payload `provider` → `delivery.channel` صریح
    - کارهای fallback ساده webhook قدیمی با `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    Doctor فقط کارهای `notify: true` را زمانی به‌صورت خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر یک کار، fallback اطلاع‌رسانی قدیمی را با یک حالت delivery غیر-webhook موجود ترکیب کند، Doctor هشدار می‌دهد و آن کار را برای بازبینی دستی باقی می‌گذارد.

    در Linux، Doctor همچنین وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را فراخوانی می‌کند، هشدار می‌دهد. این اسکریپت محلی میزبان توسط OpenClaw فعلی نگهداری نمی‌شود و وقتی cron نتواند به گذرگاه کاربر systemd دسترسی پیدا کند، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی کهنه crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor` و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    Doctor هر دایرکتوری نشست عامل را برای فایل‌های قفل نوشتن مانده اسکن می‌کند؛ فایل‌هایی که وقتی یک نشست به‌صورت غیرعادی خارج شده، باقی مانده‌اند. برای هر فایل قفل پیدا شده گزارش می‌دهد: مسیر، PID، اینکه آیا PID هنوز زنده است، سن قفل، و اینکه آیا مانده محسوب می‌شود یا نه (PID مرده یا قدیمی‌تر از ۳۰ دقیقه). در حالت `--fix` / `--repair` فایل‌های قفل مانده را به‌صورت خودکار حذف می‌کند؛ در غیر این صورت یک یادداشت چاپ می‌کند و به شما می‌گوید با `--fix` دوباره اجرا کنید.
  </Accordion>
  <Accordion title="3d. تعمیر شاخه رونوشت نشست">
    Doctor فایل‌های JSONL نشست عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی رونوشت prompt در 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با زمینه runtime داخلی OpenClaw به‌همراه یک خواهر فعال که همان prompt قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل آسیب‌دیده در کنار نسخه اصلی پشتیبان می‌گیرد و رونوشت را به شاخه فعال بازنویسی می‌کند تا تاریخچه gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (ماندگاری نشست، مسیریابی، و ایمنی)">
    دایرکتوری وضعیت ساقه مغز عملیاتی است. اگر ناپدید شود، نشست‌ها، اعتبارنامه‌ها، لاگ‌ها، و پیکربندی را از دست می‌دهید (مگر اینکه جای دیگری پشتیبان داشته باشید).

    Doctor بررسی می‌کند:

    - **دایرکتوری وضعیت موجود نیست**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای ساخت دوباره دایرکتوری درخواست می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: نوشتنی بودن را بررسی می‌کند؛ پیشنهاد تعمیر مجوزها را می‌دهد (و وقتی ناهماهنگی مالک/گروه تشخیص داده شود، یک راهنمایی `chown` منتشر می‌کند).
    - **دایرکتوری وضعیت همگام‌سازی‌شده ابری در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای متکی به همگام‌سازی می‌توانند I/O کندتر و رقابت‌های قفل/همگام‌سازی ایجاد کنند.
    - **دایرکتوری وضعیت روی SD یا eMMC در Linux**: وقتی وضعیت به یک منبع mount از نوع `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی متکی به SD یا eMMC می‌تواند هنگام نوشتن نشست و اعتبارنامه کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های نشست موجود نیستند**: `sessions/` و دایرکتوری ذخیره نشست برای ماندگار کردن تاریخچه و جلوگیری از کرش‌های `ENOENT` لازم هستند.
    - **عدم تطابق رونوشت**: وقتی ورودی‌های نشست اخیر فایل‌های رونوشت گمشده داشته باشند هشدار می‌دهد.
    - **نشست اصلی "JSONL تک‌خطی"**: وقتی رونوشت اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه انباشته نمی‌شود).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های home وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` جای دیگری را نشان دهد هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآوری حالت راه دور**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند که آن را روی میزبان راه دور اجرا کنید (وضعیت آنجا زندگی می‌کند).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/جهان خواندنی باشد هشدار می‌دهد و پیشنهاد سخت‌تر کردن به `600` را می‌دهد.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در ذخیره‌گاه احراز هویت بررسی می‌کند، وقتی توکن‌ها در حال انقضا/منقضی‌شده‌اند هشدار می‌دهد، و وقتی ایمن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل OAuth/توکن Anthropic مانده باشد، یک کلید API برای Anthropic یا مسیر setup-token Anthropic را پیشنهاد می‌کند. promptهای refresh فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی یک refresh OAuth به‌صورت دائمی شکست بخورد (برای نمونه `refresh_token_reused`، `invalid_grant`، یا ارائه‌دهنده‌ای که می‌گوید دوباره وارد شوید)، doctor گزارش می‌دهد که احراز هویت دوباره لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های احراز هویتی را گزارش می‌دهد که موقتاً به این دلایل قابل استفاده نیستند:

    - دوره‌های cooldown کوتاه (محدودیت نرخ/timeout/شکست‌های احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های صورت‌حساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hookها">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor مرجع مدل را در برابر کاتالوگ و allowlist اعتبارسنجی می‌کند و وقتی resolve نمی‌شود یا مجاز نیست هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. تعمیر image sandbox">
    وقتی sandboxing فعال باشد، doctor imageهای Docker را بررسی می‌کند و اگر image فعلی موجود نباشد پیشنهاد build یا جابه‌جایی به نام‌های legacy را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    Doctor وضعیت staging وابستگی Plugin تولیدشده legacy توسط OpenClaw را در حالت `openclaw doctor --fix` / `openclaw doctor --repair` حذف می‌کند. این شامل ریشه‌های وابستگی تولیدشده مانده، دایرکتوری‌های قدیمی install-stage، و بقایای package-local از کد تعمیر وابستگی bundled-plugin قبلی است.

    Doctor همچنین می‌تواند Pluginهای قابل دانلود پیکربندی‌شده را وقتی پیکربندی به آن‌ها ارجاع می‌دهد اما رجیستری Plugin محلی نمی‌تواند آن‌ها را پیدا کند، دوباره نصب کند. برای externalization bundled-plugin در 2026.5.2، doctor به‌صورت خودکار Pluginهای قابل دانلودی را نصب می‌کند که پیکربندی موجود از قبل استفاده می‌کند و سپس به `meta.lastTouchedVersion` تکیه می‌کند تا آن گذر انتشار را فقط یک بار اجرا کند. راه‌اندازی Gateway و بارگذاری دوباره پیکربندی package managerها را اجرا نمی‌کنند؛ نصب‌های Plugin همچنان کار صریح doctor/install/update باقی می‌مانند.

  </Accordion>
  <Accordion title="8. migrationهای سرویس Gateway و راهنمایی‌های پاک‌سازی">
    Doctor سرویس‌های Gateway legacy را تشخیص می‌دهد (launchd/systemd/schtasks) و پیشنهاد حذف آن‌ها و نصب سرویس OpenClaw با پورت فعلی gateway را می‌دهد. همچنین می‌تواند برای سرویس‌های اضافی شبیه gateway اسکن کند و راهنمایی‌های پاک‌سازی چاپ کند. سرویس‌های OpenClaw gateway دارای نام پروفایل first-class محسوب می‌شوند و به‌عنوان "اضافی" علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس gateway سطح کاربر موجود نباشد اما یک سرویس OpenClaw gateway سطح سیستم وجود داشته باشد، doctor به‌صورت خودکار یک سرویس سطح کاربر دوم نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس duplicate را حذف کنید یا وقتی یک supervisor سیستمی مالک چرخه عمر gateway است `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. migration راه‌اندازی Matrix">
    وقتی یک حساب کانال Matrix یک migration وضعیت legacy معلق یا قابل اقدام دارد، doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از migration ایجاد می‌کند و سپس گام‌های migration best-effort را اجرا می‌کند: migration وضعیت legacy Matrix و آماده‌سازی encrypted-state legacy. هر دو گام غیرکشنده هستند؛ خطاها لاگ می‌شوند و راه‌اندازی ادامه پیدا می‌کند. در حالت فقط خواندنی (`openclaw doctor` بدون `--fix`) این بررسی کاملاً رد می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و drift احراز هویت">
    Doctor اکنون وضعیت device-pairing را به‌عنوان بخشی از گذر سلامت معمول بررسی می‌کند.

    آنچه گزارش می‌دهد:

    - درخواست‌های معلق جفت‌سازی بار اول
    - ارتقاهای نقش معلق برای دستگاه‌هایی که قبلاً جفت شده‌اند
    - ارتقاهای دامنه معلق برای دستگاه‌هایی که قبلاً جفت شده‌اند
    - تعمیرهای عدم تطابق کلید عمومی که در آن id دستگاه هنوز مطابقت دارد اما هویت دستگاه دیگر با رکورد تأییدشده مطابقت ندارد
    - رکوردهای جفت‌شده‌ای که برای یک نقش تأییدشده توکن فعال ندارند
    - توکن‌های جفت‌شده‌ای که دامنه‌هایشان از baseline جفت‌سازی تأییدشده drift کرده است
    - ورودی‌های device-token کش‌شده محلی برای ماشین فعلی که پیش از چرخش توکن سمت gateway هستند یا metadata دامنه مانده دارند

    Doctor درخواست‌های جفت‌سازی را به‌صورت خودکار تأیید نمی‌کند و توکن‌های دستگاه را به‌صورت خودکار نمی‌چرخاند. به‌جای آن گام‌های بعدی دقیق را چاپ می‌کند:

    - درخواست‌های معلق را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک توکن تازه را با `openclaw devices rotate --device <deviceId> --role <role>` بچرخانید
    - یک رکورد مانده را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این حفره رایج "قبلاً جفت شده اما هنوز pairing required دریافت می‌کند" را می‌بندد: doctor اکنون جفت‌سازی بار اول را از ارتقاهای نقش/دامنه معلق و از drift توکن/هویت دستگاه مانده تفکیک می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک ارائه‌دهنده بدون allowlist به DMها باز باشد، یا وقتی یک policy به‌شکل خطرناک پیکربندی شده باشد، هشدار منتشر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، doctor مطمئن می‌شود lingering فعال است تا gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (skills، plugins، و دایرکتوری‌های legacy)">
    Doctor خلاصه‌ای از وضعیت workspace را برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: skills واجد شرایط، دارای نیازمندی‌های گمشده، و مسدودشده توسط allowlist را می‌شمارد.
    - **دایرکتوری‌های workspace legacy**: وقتی `~/openclaw` یا سایر دایرکتوری‌های workspace legacy کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای فعال/غیرفعال/خطادار را می‌شمارد؛ برای هر خطا، IDهای Plugin را فهرست می‌کند؛ قابلیت‌های bundle plugin را گزارش می‌دهد.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را که با runtime فعلی مشکل سازگاری دارند علامت‌گذاری می‌کند.
    - **تشخیص‌های Plugin**: هر هشدار یا خطای زمان load منتشرشده توسط رجیستری Plugin را نمایان می‌کند.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap workspace (برای نمونه `AGENTS.md`، `CLAUDE.md`، یا سایر فایل‌های زمینه تزریق‌شده) نزدیک یا بیش از بودجه کاراکتر پیکربندی‌شده هستند یا نه. برای هر فایل شمار کاراکتر خام در برابر تزریق‌شده، درصد truncation، علت truncation (`max/file` یا `max/total`)، و کل کاراکترهای تزریق‌شده را به‌عنوان کسری از بودجه کل گزارش می‌دهد. وقتی فایل‌ها truncate شده باشند یا نزدیک حد باشند، doctor نکته‌هایی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کانال مانده">
    وقتی `openclaw doctor --fix` یک Plugin کانال گمشده را حذف می‌کند، پیکربندی dangling با دامنه کانال را هم که به آن Plugin ارجاع داده بود حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های Heartbeat که نام کانال را آورده بودند، و overrideهای `agents.*.models["<channel>/*"]`. این از loopهای boot Gateway جلوگیری می‌کند، جایی که runtime کانال از بین رفته اما پیکربندی هنوز از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند که آیا تکمیل tab برای shell فعلی نصب شده است یا نه (zsh، bash، fish، یا PowerShell):

    - اگر پروفایل shell از یک الگوی تکمیل dynamic کند استفاده کند (`source <(openclaw completion ...)`)، doctor آن را به گونه فایل کش‌شده سریع‌تر ارتقا می‌دهد.
    - اگر تکمیل در پروفایل پیکربندی شده باشد اما فایل cache موجود نباشد، doctor cache را به‌صورت خودکار دوباره تولید می‌کند.
    - اگر هیچ تکمیلی اصلاً پیکربندی نشده باشد، doctor برای نصب آن درخواست می‌کند (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای تولید دستی دوباره cache، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (توکن محلی)">
    Doctor آمادگی احراز هویت توکن gateway محلی را بررسی می‌کند.

    - اگر حالت توکن به توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، doctor پیشنهاد تولید یکی را می‌دهد.
    - اگر `gateway.auth.token` با SecretRef مدیریت شود اما در دسترس نباشد، doctor هشدار می‌دهد و آن را با plaintext بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی هیچ SecretRef توکنی پیکربندی نشده باشد تولید را اجبار می‌کند.

  </Accordion>
  <Accordion title="12b. تعمیرهای فقط خواندنی آگاه از SecretRef">
    برخی جریان‌های تعمیر باید اعتبارنامه‌های پیکربندی‌شده را بدون ضعیف کردن رفتار fail-fast زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` اکنون از همان مدل خلاصه فقط خواندنی SecretRef مانند دستورهای خانواده status برای تعمیرهای پیکربندی هدفمند استفاده می‌کند.
    - نمونه: تعمیر `allowFrom` / `groupAllowFrom` `@username` در Telegram تلاش می‌کند در صورت موجود بودن از اعتبارنامه‌های bot پیکربندی‌شده استفاده کند.
    - اگر توکن bot در Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر دستور فعلی در دسترس نباشد، doctor گزارش می‌دهد که اعتبارنامه پیکربندی‌شده-اما-غیرقابل‌دسترسی است و به‌جای کرش کردن یا گزارش اشتباه توکن به‌عنوان گمشده، auto-resolution را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی دوباره">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد می‌دهد آن را دوباره راه‌اندازی کند.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند که آیا ارائه‌دهنده embedding جست‌وجوی حافظه پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و ارائه‌دهنده پیکربندی‌شده بستگی دارد:

    - **QMD backend**: بررسی می‌کند که آیا باینری `qmd` در دسترس و قابل شروع هست یا نه. اگر نباشد، راهنمای رفع مشکل را شامل بسته npm و یک گزینه مسیر دستی باینری چاپ می‌کند.
    - **ارائه‌دهنده محلی صریح**: وجود یک فایل مدل محلی یا یک URL مدل راه‌دور/قابل‌دانلود شناخته‌شده را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌دهد به یک ارائه‌دهنده راه‌دور تغییر دهید.
    - **ارائه‌دهنده راه‌دور صریح** (`openai`، `voyage` و غیره): بررسی می‌کند که یک کلید API در محیط یا auth store وجود داشته باشد. اگر موجود نباشد، راهنمایی‌های قابل‌اقدام برای رفع مشکل چاپ می‌کند.
    - **ارائه‌دهنده خودکار**: ابتدا موجود بودن مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهنده راه‌دور را به ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی نتیجه probe کش‌شده Gateway موجود باشد (Gateway هنگام بررسی سالم بوده است)، doctor نتیجه آن را با پیکربندی قابل‌مشاهده برای CLI تطبیق می‌دهد و هر ناهماهنگی را یادآوری می‌کند. Doctor در مسیر پیش‌فرض یک ping تازه embedding شروع نمی‌کند؛ وقتی بررسی زنده ارائه‌دهنده را می‌خواهید، از فرمان وضعیت عمیق حافظه استفاده کنید.

    برای تأیید آمادگی embedding در زمان اجرا، از `openclaw memory status --deep` استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. ممیزی + تعمیر پیکربندی supervisor">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های مفقود یا قدیمی بررسی می‌کند (مثلاً وابستگی‌های systemd network-online و تأخیر راه‌اندازی دوباره). وقتی ناهماهنگی پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل service/task را با پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` درخواست‌های تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های توصیه‌شده را بدون درخواست تأیید اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های supervisor سفارشی را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` باعث می‌شود doctor برای چرخه عمر service مربوط به Gateway فقط‌خواندنی بماند. همچنان سلامت service را گزارش می‌دهد و تعمیرهای غیر-service را اجرا می‌کند، اما نصب/شروع/راه‌اندازی دوباره/bootstrap service، بازنویسی‌های پیکربندی supervisor، و پاک‌سازی service قدیمی را رد می‌کند چون یک supervisor خارجی مالک آن چرخه عمر است.
    - در Linux، وقتی unit مطابق systemd Gateway فعال است، doctor فراداده command/entrypoint را بازنویسی نمی‌کند. همچنین هنگام اسکن service تکراری، unitهای اضافی غیرفعال و غیرقدیمی شبیه Gateway را نادیده می‌گیرد تا فایل‌های service همراه، نویز پاک‌سازی ایجاد نکنند.
    - اگر token auth به token نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/تعمیر service توسط doctor، SecretRef را اعتبارسنجی می‌کند اما مقدارهای plaintext token حل‌شده را در فراداده محیط service مربوط به supervisor ذخیره نمی‌کند.
    - Doctor مقدارهای محیط service مدیریت‌شده مبتنی بر `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd، یا Windows Scheduled Task به‌صورت inline جاسازی کرده‌اند تشخیص می‌دهد و فراداده service را بازنویسی می‌کند تا آن مقدارها به‌جای تعریف supervisor از منبع runtime بارگذاری شوند.
    - Doctor تشخیص می‌دهد که فرمان service پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را ثابت نگه داشته است و فراداده service را به پورت فعلی بازنویسی می‌کند.
    - اگر token auth به token نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، doctor مسیر نصب/تعمیر را با راهنمایی قابل‌اقدام مسدود می‌کند.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/تعمیر را تا زمانی که mode به‌صراحت تنظیم شود مسدود می‌کند.
    - برای unitهای user-systemd در Linux، بررسی‌های drift توکن doctor اکنون هنگام مقایسه فراداده auth مربوط به service، هم منبع‌های `Environment=` و هم `EnvironmentFile=` را شامل می‌شود.
    - تعمیرهای service توسط Doctor از بازنویسی، توقف، یا راه‌اندازی دوباره service مربوط به Gateway از یک باینری OpenClaw قدیمی‌تر خودداری می‌کنند، وقتی پیکربندی آخرین‌بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="16. عیب‌یابی runtime و پورت Gateway">
    Doctor runtime مربوط به service را بررسی می‌کند (PID، آخرین وضعیت خروج) و وقتی service نصب شده اما عملاً اجرا نمی‌شود هشدار می‌دهد. همچنین تداخل‌های پورت را روی پورت Gateway (پیش‌فرض `18789`) بررسی می‌کند و علت‌های محتمل را گزارش می‌دهد (Gateway از قبل در حال اجراست، تونل SSH).
  </Accordion>
  <Accordion title="17. بهترین روش‌های runtime مربوط به Gateway">
    Doctor وقتی service مربوط به Gateway روی Bun یا یک مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای مدیر نسخه می‌توانند پس از ارتقاها خراب شوند چون service راه‌انداز shell شما را بارگذاری نمی‌کند. Doctor وقتی نصب Node سیستمی در دسترس باشد (Homebrew/apt/choco)، پیشنهاد می‌دهد به آن مهاجرت کنید.

    LaunchAgentهای macOS که تازه نصب یا تعمیر شده‌اند، به‌جای کپی کردن PATH شل تعاملی، از یک PATH سیستمی متعارف (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند؛ بنابراین Volta، asdf، fnm، pnpm، و دیگر دایرکتوری‌های مدیر نسخه تغییر نمی‌دهند که پردازه‌های فرزند Node به کدام مسیر resolve شوند. serviceهای Linux همچنان rootهای محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های user-bin پایدار را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌شده برای مدیر نسخه فقط وقتی روی دیسک وجود داشته باشند در PATH مربوط به service نوشته می‌شوند.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + فراداده wizard">
    Doctor هر تغییر پیکربندی را ذخیره می‌کند و فراداده wizard را مهر می‌زند تا اجرای doctor ثبت شود.
  </Accordion>
  <Accordion title="19. نکته‌های workspace (پشتیبان‌گیری + سامانه حافظه)">
    Doctor وقتی سامانه حافظه workspace وجود نداشته باشد آن را پیشنهاد می‌دهد و اگر workspace از قبل زیر git نباشد، یک نکته پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و پشتیبان‌گیری git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook مربوط به Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
