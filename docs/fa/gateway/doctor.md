---
read_when:
    - افزودن یا اصلاح مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی و مراحل تعمیر'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-05T08:25:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. این ابزار پیکربندی/وضعیت کهنه را اصلاح می‌کند، سلامت را بررسی می‌کند، و گام‌های تعمیر قابل اقدام ارائه می‌دهد.

## شروع سریع

```bash
openclaw doctor
```

### حالت‌های بی‌سر و خودکارسازی

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    پذیرش پیش‌فرض‌ها بدون پرسش (از جمله گام‌های تعمیر راه‌اندازی مجدد/سرویس/sandbox در صورت کاربرد).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    اعمال تعمیرهای پیشنهادی بدون پرسش (تعمیرها + راه‌اندازی‌های مجدد در موارد امن).

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

    بدون پرسش اجرا می‌شود و فقط مهاجرت‌های امن را اعمال می‌کند (عادی‌سازی پیکربندی + جابه‌جایی وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/sandbox را که نیازمند تأیید انسانی هستند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام تشخیص به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن می‌کند (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید پیش از نوشتن، تغییرات را بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## کاری که انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، رابط کاربری، و به‌روزرسانی‌ها">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل رابط کاربری (وقتی طرح‌واره پروتکل جدیدتر باشد Control UI را دوباره می‌سازد).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/ناقص/مسدود) و وضعیت Plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - عادی‌سازی پیکربندی برای مقدارهای قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای override ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌اندازی OAuth مربوط به Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OpenAI Codex OAuth.
    - هشدارهای فهرست مجاز Plugin/ابزار وقتی `plugins.allow` محدودکننده است اما سیاست ابزار همچنان wildcard یا ابزارهای متعلق به Plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/احراز هویت WhatsApp).
    - مهاجرت کلید قرارداد manifest قدیمی Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت فروشگاه cron قدیمی (`jobId`, `schedule.cron`, فیلدهای سطح بالای delivery/payload، payload `provider`، jobهای fallback ساده webhook با `notify: true`).
    - مهاجرت runtime-policy قدیمی عامل به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی کهنه Plugin وقتی Pluginها فعال باشند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های کهنه Plugin به‌عنوان پیکربندی containment غیرفعال تلقی می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل قفل نشست و پاک‌سازی قفل‌های کهنه.
    - تعمیر رونوشت نشست برای شاخه‌های تکراری بازنویسی پرامپت که توسط buildهای آسیب‌دیده 2026.4.24 ایجاد شده‌اند.
    - تشخیص tombstone بازیابی-راه‌اندازی‌مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌کردن پرچم‌های کهنه بازیابی abort شده تا startup همچنان child را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (نشست‌ها، رونوشت‌ها، پوشه وضعیت).
    - بررسی‌های مجوز فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای نزدیک به انقضا را refresh کند، و وضعیت‌های cooldown/غیرفعال auth-profile را گزارش می‌دهد.
    - تشخیص پوشه workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و supervisorها">
    - تعمیر تصویر sandbox وقتی sandboxing فعال باشد.
    - مهاجرت سرویس قدیمی و تشخیص Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime مربوط به Gateway (سرویس نصب شده اما اجرا نیست؛ برچسب launchd کش‌شده).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا probed می‌شوند).
    - بررسی‌های پاسخ‌گویی WhatsApp برای سلامت تنزل‌یافته event-loop در Gateway در حالی که کلاینت‌های محلی TUI هنوز اجرا هستند؛ `--fix` فقط کلاینت‌های محلی TUI تأییدشده را متوقف می‌کند.
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy تعبیه‌شده برای سرویس‌های Gateway که هنگام نصب یا به‌روزرسانی مقدارهای shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را ثبت کرده‌اند.
    - بررسی‌های بهترین رویه runtime برای Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی برخورد پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="احراز هویت، امنیت، و جفت‌سازی">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی هیچ منبع token وجود ندارد، تولید token را پیشنهاد می‌دهد؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - تشخیص مشکل جفت‌سازی دستگاه (درخواست‌های جفت‌سازی نخستین معلق، ارتقاهای معلق role/scope، drift کهنه cache محلی device-token، و drift احراز هویت رکورد جفت‌شده).

  </Accordion>
  <Accordion title="Workspace و shell">
    - بررسی systemd linger در Linux.
    - بررسی اندازه فایل bootstrap workspace (هشدارهای truncation/نزدیک به حد برای فایل‌های context).
    - بررسی آمادگی Skills برای عامل پیش‌فرض؛ Skills مجاز با نیازمندی‌های bin، env، config، یا OS مفقود را گزارش می‌دهد، و `--fix` می‌تواند Skills در دسترس نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت تکمیل shell و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding جست‌وجوی حافظه (مدل محلی، کلید API راه‌دور، یا باینری QMD).
    - بررسی‌های نصب از source (ناسازگاری pnpm workspace، assetهای مفقود رابط کاربری، باینری tsx مفقود).
    - پیکربندی به‌روزشده + فراداده wizard را می‌نویسد.

  </Accordion>
</AccordionGroup>

## پرکردن گذشته و reset رابط Dreams

صحنه Dreams در Control UI شامل اقدام‌های **پرکردن گذشته**، **Reset**، و **پاک‌سازی Grounded** برای workflow مربوط به grounded dreaming است. این اقدام‌ها از روش‌های RPC به سبک doctor در Gateway استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **پرکردن گذشته** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر grounded REM diary را اجرا می‌کند، و ورودی‌های برگشت‌پذیر backfill را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان ورودی‌های backfill diary نشان‌گذاری‌شده را از `DREAMS.md` حذف می‌کند.
- **پاک‌سازی Grounded** فقط ورودی‌های کوتاه‌مدت staged شده و فقط-grounded را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه انباشته نکرده‌اند.

کاری که خودشان **انجام نمی‌دهند**:

- آن‌ها `MEMORY.md` را ویرایش نمی‌کنند
- آن‌ها مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- آن‌ها candidateهای grounded را به‌طور خودکار وارد فروشگاه promotion کوتاه‌مدت زنده نمی‌کنند مگر اینکه ابتدا مسیر staged CLI را صراحتاً اجرا کنید

اگر می‌خواهید replay تاریخی grounded روی lane معمول deep promotion اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار candidateهای durable و grounded را در فروشگاه dreaming کوتاه‌مدت staged می‌کند، در حالی که `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار تفصیلی و منطق

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. عادی‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override مخصوص کانال)، doctor آن‌ها را به طرح‌واره فعلی عادی‌سازی می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی Talk برابر است با `talk.provider` + `talk.providers.<provider>`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را به map ارائه‌دهنده بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` خالی نیست و سیاست ابزار از
    ورودی‌های wildcard یا ابزار متعلق به Plugin استفاده می‌کند هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهایی
    از Pluginهایی که واقعاً load می‌شوند match می‌شود؛ این گزینه فهرست مجاز انحصاری Plugin را دور نمی‌زند. Doctor برای پیکربندی‌های
    فهرست مجاز قدیمی مهاجرت‌یافته `plugins.bundledDiscovery: "compat"` را می‌نویسد تا رفتار ارائه‌دهنده bundled موجود حفظ شود، و
    سپس به تنظیم سخت‌گیرانه‌تر `"allowlist"` اشاره می‌کند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا امتناع می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده است نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با طرح‌واره به‌روزشده بازنویسی می‌کند.

    Gateway نیز وقتی هنگام startup یک قالب پیکربندی قدیمی را تشخیص دهد، مهاجرت‌های doctor را به‌طور خودکار اجرا می‌کند، بنابراین پیکربندی‌های کهنه بدون مداخله دستی تعمیر می‌شوند. مهاجرت‌های فروشگاه job مربوط به Cron توسط `openclaw doctor --fix` انجام می‌شوند.

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
    - برای کانال‌هایی که `accounts` نام‌گذاری‌شده دارند اما همچنان مقادیر کانال سطح بالای تک‌حسابی باقی مانده است، آن مقادیر در محدوده حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک هدف نام‌گذاری‌شده/پیش‌فرض مطابق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای timeoutهای کند ارائه‌دهنده/مدل از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم قدیمی رله extension)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی Gateway همچنین ارائه‌دهندگانی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده باشد، به‌جای fail closed شدن، رد می‌کند)

    هشدارهای Doctor همچنین شامل راهنمایی حساب پیش‌فرض برای کانال‌های چندحسابی است:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، Doctor هشدار می‌دهد که مسیریابی fallback می‌تواند حساب غیرمنتظره‌ای را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی شناسه حساب ناشناخته‌ای تنظیم شده باشد، Doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های ارائه‌دهنده OpenCode">
    اگر `models.providers.opencode`،‏ `opencode-zen`، یا `opencode-go` را به‌صورت دستی اضافه کرده‌اید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این کار می‌تواند مدل‌ها را مجبور کند از API اشتباه استفاده کنند یا هزینه‌ها را صفر کند. Doctor هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API و هزینه‌های مخصوص هر مدل را برگردانید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر extension حذف‌شده Chrome اشاره می‌کند، Doctor آن را به مدل اتصال Chrome MCP محلیِ میزبان فعلی نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    Doctor همچنین وقتی از `defaultProfile: "user"` یا یک پروفایل `existing-session` پیکربندی‌شده استفاده می‌کنید، مسیر Chrome MCP محلیِ میزبان را بررسی می‌کند:

    - بررسی می‌کند که آیا Google Chrome برای پروفایل‌های اتصال خودکار پیش‌فرض روی همان میزبان نصب شده است یا نه
    - نسخه شناسایی‌شده Chrome را بررسی می‌کند و اگر کمتر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که remote debugging را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`،‏ `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    Doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلیِ میزبان همچنان نیاز دارد به:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان Gateway/Node
    - اجرای محلی مرورگر
    - فعال بودن remote debugging در آن مرورگر
    - تأیید نخستین پیام consent اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. existing-session محدودیت‌های فعلی مسیر Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته‌ای مثل `responsebody`، خروجی PDF، رهگیری دانلود، و اقدام‌های دسته‌ای همچنان به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser، یا جریان‌های headless دیگر اعمال نمی‌شود. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای TLS برای OAuth">
    وقتی یک پروفایل OAuth مربوط به OpenAI Codex پیکربندی شده باشد، Doctor نقطه پایانی authorization OpenAI را بررسی می‌کند تا تأیید کند پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر بررسی با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده، یا گواهی self-signed)، Doctor راهنمای رفع مشکل مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، رفع مشکل معمولاً `brew postinstall ca-certificates` است. با `--deep`، این بررسی حتی اگر Gateway سالم باشد هم اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های ارائه‌دهنده OAuth برای Codex">
    اگر قبلاً تنظیمات انتقال قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، آن‌ها می‌توانند مسیر ارائه‌دهنده داخلی Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند تحت‌الشعاع قرار دهند. Doctor وقتی آن تنظیمات انتقال قدیمی را کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال منسوخ را حذف یا بازنویسی کنید و رفتار داخلی مسیریابی/fallback را برگردانید. پراکسی‌های سفارشی و بازنویسی‌های فقط header همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. هشدارهای مسیر Plugin مربوط به Codex">
    وقتی Plugin بسته‌بندی‌شده Codex فعال باشد، Doctor همچنین بررسی می‌کند که آیا ارجاع‌های مدل اصلی `openai-codex/*` هنوز از طریق runner پیش‌فرض PI resolve می‌شوند یا نه. این ترکیب وقتی می‌خواهید احراز هویت OAuth/اشتراک Codex را از طریق PI داشته باشید معتبر است، اما به‌راحتی با harness بومی app-server مربوط به Codex اشتباه گرفته می‌شود. Doctor هشدار می‌دهد و به شکل صریح app-server اشاره می‌کند: `openai/*` به‌همراه `agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor این مورد را به‌صورت خودکار تعمیر نمی‌کند، چون هر دو مسیر معتبرند:

    - `openai-codex/*` + PI یعنی «از احراز هویت OAuth/اشتراک Codex از طریق runner عادی OpenClaw استفاده کن.»
    - `openai/*` + `agentRuntime.id: "codex"` یعنی «turn تعبیه‌شده را از طریق app-server بومی Codex اجرا کن.»
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از chat کنترل یا bind کن.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از adapter خارجی ACP/acpx استفاده کن.»

    اگر هشدار ظاهر شد، مسیری را که مدنظرتان بوده انتخاب کنید و پیکربندی را دستی ویرایش کنید. وقتی PI Codex OAuth عمدی است، هشدار را همان‌طور نگه دارید.

  </Accordion>
  <Accordion title="2g. پاک‌سازی مسیر session">
    Doctor همچنین بعد از اینکه مدل یا runtime پیش‌فرض/fallback پیکربندی‌شده را از مسیری متعلق به Plugin مثل Codex دور می‌کنید، فروشگاه sessionهای فعال را برای وضعیت مسیر کهنه و خودکارساخته‌شده اسکن می‌کند.

    `openclaw doctor --fix` می‌تواند وضعیت کهنه خودکارساخته‌شده‌ای مثل pinهای مدل `modelOverrideSource: "auto"`، فراداده مدل runtime، شناسه‌های harness پین‌شده، bindingهای session در CLI، و بازنویسی‌های خودکار auth-profile را وقتی مسیر مالک آن‌ها دیگر پیکربندی نشده است پاک کند. انتخاب‌های صریح کاربر یا مدل session قدیمی برای بازبینی دستی گزارش می‌شوند و دست‌نخورده باقی می‌مانند؛ وقتی آن مسیر دیگر مدنظر نیست، آن‌ها را با `/model ...`،‏ `/new`، یا reset کردن session تغییر دهید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    Doctor می‌تواند چیدمان‌های قدیمی‌تر روی دیسک را به ساختار فعلی مهاجرت دهد:

    - فروشگاه sessionها + transcriptها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - پوشه agent:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها best-effort و idempotent هستند؛ Doctor وقتی هر پوشه قدیمی را به‌عنوان پشتیبان باقی بگذارد، هشدار صادر می‌کند. Gateway/CLI همچنین فروشگاه sessionهای قدیمی + پوشه agent را هنگام راه‌اندازی به‌صورت خودکار مهاجرت می‌کند تا history/auth/models بدون اجرای دستی Doctor در مسیر مخصوص هر agent قرار بگیرند. احراز هویت WhatsApp عمداً فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. نرمال‌سازی ارائه‌دهنده/نقشه ارائه‌دهنده Talk اکنون بر اساس برابری ساختاری مقایسه می‌کند، بنابراین diffهایی که فقط مربوط به ترتیب keyها هستند دیگر باعث تغییرات تکراری بی‌اثر `doctor --fix` نمی‌شوند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های manifest قدیمی Plugin">
    Doctor همه manifestهای Plugin نصب‌شده را برای کلیدهای capability سطح بالای منسوخ (`speechProviders`،‏ `realtimeTranscriptionProviders`،‏ `realtimeVoiceProviders`،‏ `mediaUnderstandingProviders`،‏ `imageGenerationProviders`،‏ `videoGenerationProviders`،‏ `webFetchProviders`،‏ `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌کند آن‌ها را به شیء `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقادیر را داشته باشد، کلید قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های فروشگاه Cron قدیمی">
    Doctor همچنین فروشگاه کارهای cron را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا وقتی بازنویسی شده باشد `cron.store`) برای شکل‌های قدیمی job که scheduler هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی cron شامل موارد زیر است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload سطح بالا (`message`،‏ `model`،‏ `thinking`، ...) → `payload`
    - فیلدهای delivery سطح بالا (`deliver`،‏ `channel`،‏ `to`،‏ `provider`، ...) → `delivery`
    - aliasهای delivery برای `provider` در payload → `delivery.channel` صریح
    - jobهای fallback ساده Webhook قدیمی با `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    Doctor فقط وقتی jobهای `notify: true` را به‌صورت خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر یک job، fallback قدیمی notify را با یک حالت delivery غیر Webhook موجود ترکیب کند، Doctor هشدار می‌دهد و آن job را برای بازبینی دستی باقی می‌گذارد.

    در Linux، doctor همچنین زمانی هشدار می‌دهد که crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا می‌کند. این اسکریپت محلی میزبان توسط OpenClaw فعلی نگهداری نمی‌شود و وقتی Cron نتواند به گذرگاه کاربر systemd دسترسی پیدا کند، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی قدیمی crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor`، و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="۳ج. پاک‌سازی قفل جلسه">
    Doctor همه دایرکتوری‌های جلسه عامل را برای فایل‌های قفل نوشتن مانده بررسی می‌کند — فایل‌هایی که هنگام خروج غیرعادی یک جلسه باقی مانده‌اند. برای هر فایل قفل پیدا شده این موارد را گزارش می‌کند: مسیر، PID، اینکه PID هنوز زنده است یا نه، سن قفل، و اینکه آیا مانده محسوب می‌شود یا نه (PID مرده یا قدیمی‌تر از ۳۰ دقیقه). در حالت `--fix` / `--repair`، فایل‌های قفل مانده را به‌طور خودکار حذف می‌کند؛ در غیر این صورت، یادداشتی چاپ می‌کند و از شما می‌خواهد دوباره با `--fix` اجرا کنید.
  </Accordion>
  <Accordion title="۳د. تعمیر شاخه رونوشت جلسه">
    Doctor فایل‌های JSONL جلسه عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی رونوشت prompt در 2026.4.24 بررسی می‌کند: یک نوبت کاربر رهاشده با زمینه runtime داخلی OpenClaw به‌همراه یک هم‌زاد فعال که همان prompt قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل آسیب‌دیده کنار نسخه اصلی پشتیبان می‌گیرد و رونوشت را به شاخه فعال بازنویسی می‌کند تا تاریخچه Gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری را نبینند.
  </Accordion>
  <Accordion title="۴. بررسی‌های یکپارچگی وضعیت (ماندگاری جلسه، مسیریابی، و ایمنی)">
    دایرکتوری وضعیت، ساقه مغز عملیاتی است. اگر ناپدید شود، جلسه‌ها، اعتبارنامه‌ها، گزارش‌ها، و پیکربندی را از دست می‌دهید (مگر اینکه جای دیگری پشتیبان داشته باشید).

    Doctor بررسی می‌کند:

    - **دایرکتوری وضعیت وجود ندارد**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای ایجاد دوباره دایرکتوری درخواست می‌دهد، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: قابلیت نوشتن را تأیید می‌کند؛ پیشنهاد تعمیر مجوزها را می‌دهد (و وقتی ناهماهنگی مالک/گروه تشخیص داده شود، راهنمایی `chown` صادر می‌کند).
    - **دایرکتوری وضعیت همگام‌شده با ابر در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای مبتنی بر همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت روی SD یا eMMC در Linux**: وقتی وضعیت به منبع mount از نوع `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی مبتنی بر SD یا eMMC می‌تواند زیر نوشتن‌های جلسه و اعتبارنامه کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های جلسه وجود ندارند**: `sessions/` و دایرکتوری ذخیره جلسه برای ماندگار کردن تاریخچه و جلوگیری از crashهای `ENOENT` لازم‌اند.
    - **ناهماهنگی رونوشت**: وقتی ورودی‌های جلسه اخیر فایل‌های رونوشت گم‌شده داشته باشند هشدار می‌دهد.
    - **جلسه اصلی «JSONL تک‌خطی»**: وقتی رونوشت اصلی فقط یک خط دارد پرچم‌گذاری می‌کند (تاریخچه در حال انباشته شدن نیست).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های home وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآور حالت remote**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند آن را روی میزبان remote اجرا کنید (وضعیت آنجا قرار دارد).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/همه قابل خواندن باشد هشدار می‌دهد و پیشنهاد می‌کند آن را به `600` محدود کنید.

  </Accordion>
  <Accordion title="۵. سلامت احراز هویت مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در ذخیره احراز هویت بررسی می‌کند، وقتی توکن‌ها در حال انقضا/منقضی‌شده هستند هشدار می‌دهد، و وقتی امن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل OAuth/token مربوط به Anthropic مانده باشد، یک کلید API Anthropic یا مسیر setup-token Anthropic را پیشنهاد می‌کند. درخواست‌های refresh فقط هنگام اجرای تعاملی (TTY) نمایش داده می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی refresh OAuth به‌طور دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا اینکه provider از شما بخواهد دوباره وارد شوید)، doctor گزارش می‌کند که احراز هویت دوباره لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های احراز هویتی را گزارش می‌کند که به این دلایل موقتاً غیرقابل‌استفاده‌اند:

    - cooldownهای کوتاه (محدودیت نرخ/timeout/شکست‌های احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های billing/credit)

  </Accordion>
  <Accordion title="۶. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor ارجاع مدل را در برابر catalog و allowlist اعتبارسنجی می‌کند و وقتی resolve نمی‌شود یا مجاز نیست هشدار می‌دهد.
  </Accordion>
  <Accordion title="۷. تعمیر تصویر sandbox">
    وقتی sandboxing فعال باشد، doctor تصاویر Docker را بررسی می‌کند و اگر تصویر فعلی وجود نداشته باشد پیشنهاد build یا جابه‌جایی به نام‌های قدیمی را می‌دهد.
  </Accordion>
  <Accordion title="۷ب. پاک‌سازی نصب Plugin">
    Doctor در حالت `openclaw doctor --fix` / `openclaw doctor --repair` وضعیت staging وابستگی Plugin قدیمی تولیدشده توسط OpenClaw را حذف می‌کند. این شامل ریشه‌های وابستگی تولیدشده مانده، دایرکتوری‌های install-stage قدیمی، زباله‌های محلی package از کد تعمیر وابستگی bundled-plugin قبلی، و نسخه‌های npm مدیریت‌شده orphan یا بازیابی‌شده از Pluginهای bundled `@openclaw/*` است که می‌توانند manifest bundled فعلی را تحت‌الشعاع قرار دهند.

    Doctor همچنین می‌تواند Pluginهای دانلودشدنی گم‌شده را وقتی پیکربندی به آن‌ها ارجاع می‌دهد اما registry محلی Plugin نمی‌تواند آن‌ها را پیدا کند، دوباره نصب کند. نمونه‌ها شامل `plugins.entries` مادی، تنظیمات پیکربندی‌شده channel/provider/search، و runtimeهای عامل پیکربندی‌شده هستند. هنگام به‌روزرسانی‌های package، doctor از اجرای تعمیر Plugin با package-manager در زمانی که package هسته در حال تعویض است خودداری می‌کند؛ اگر پس از به‌روزرسانی یک Plugin پیکربندی‌شده هنوز به بازیابی نیاز دارد، دوباره `openclaw doctor --fix` را اجرا کنید. راه‌اندازی Gateway و بارگذاری دوباره پیکربندی package managerها را اجرا نمی‌کنند؛ نصب Pluginها همچنان کار صریح doctor/install/update باقی می‌ماند.

  </Accordion>
  <Accordion title="۸. مهاجرت‌های سرویس Gateway و راهنمایی‌های پاک‌سازی">
    Doctor سرویس‌های Gateway قدیمی (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد می‌کند آن‌ها را حذف کند و سرویس OpenClaw را با port فعلی Gateway نصب کند. همچنین می‌تواند سرویس‌های اضافی شبیه Gateway را scan کند و راهنمایی‌های پاک‌سازی چاپ کند. سرویس‌های Gateway متعلق به OpenClaw که با نام پروفایل هستند، درجه‌یک در نظر گرفته می‌شوند و به‌عنوان «اضافی» پرچم‌گذاری نمی‌شوند.

    در Linux، اگر سرویس Gateway سطح کاربر وجود نداشته باشد اما یک سرویس Gateway سطح سیستم OpenClaw وجود داشته باشد، doctor به‌طور خودکار سرویس سطح کاربر دوم نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس نسخه تکراری را حذف کنید یا وقتی یک supervisor سیستمی مالک چرخه عمر Gateway است `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="۸ب. مهاجرت Startup Matrix">
    وقتی یک حساب channel مربوط به Matrix مهاجرت وضعیت قدیمی معلق یا قابل اقدام داشته باشد، doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس گام‌های مهاجرت best-effort را اجرا می‌کند: مهاجرت وضعیت قدیمی Matrix و آماده‌سازی encrypted-state قدیمی. هر دو گام non-fatal هستند؛ خطاها log می‌شوند و startup ادامه پیدا می‌کند. در حالت فقط‌خواندنی (`openclaw doctor` بدون `--fix`) این بررسی کاملاً رد می‌شود.
  </Accordion>
  <Accordion title="۸ج. pair کردن دستگاه و drift احراز هویت">
    Doctor اکنون وضعیت pair کردن دستگاه را به‌عنوان بخشی از گذر سلامت معمول بررسی می‌کند.

    آنچه گزارش می‌کند:

    - درخواست‌های pair نخستین‌بار معلق
    - ارتقاهای نقش معلق برای دستگاه‌هایی که قبلاً pair شده‌اند
    - ارتقاهای scope معلق برای دستگاه‌هایی که قبلاً pair شده‌اند
    - تعمیرهای ناهماهنگی کلید عمومی که در آن id دستگاه هنوز منطبق است اما هویت دستگاه دیگر با record تأییدشده منطبق نیست
    - recordهای pair شده که برای یک نقش تأییدشده token فعال ندارند
    - tokenهای pair شده‌ای که scopeهایشان خارج از baseline تأییدشده pair شدن drift کرده‌اند
    - ورودی‌های cached محلی device-token برای ماشین فعلی که قدیمی‌تر از یک چرخش token سمت Gateway هستند یا metadata scope مانده دارند

    Doctor درخواست‌های pair را auto-approve نمی‌کند و device tokenها را auto-rotate نمی‌کند. در عوض گام‌های بعدی دقیق را چاپ می‌کند:

    - درخواست‌های معلق را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک token تازه را با `openclaw devices rotate --device <deviceId> --role <role>` rotate کنید
    - یک record مانده را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این حفره رایج «قبلاً pair شده اما هنوز pairing required دریافت می‌شود» را می‌بندد: doctor اکنون pair شدن نخستین‌بار را از ارتقاهای نقش/scope معلق و از drift مانده token/هویت دستگاه متمایز می‌کند.

  </Accordion>
  <Accordion title="۹. هشدارهای امنیتی">
    Doctor وقتی یک provider بدون allowlist برای DMها باز است، یا وقتی یک policy به‌شکلی خطرناک پیکربندی شده باشد، هشدار صادر می‌کند.
  </Accordion>
  <Accordion title="۱۰. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، doctor اطمینان می‌دهد lingering فعال است تا Gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="۱۱. وضعیت workspace (Skills، Pluginها، و دایرکتوری‌های قدیمی)">
    Doctor خلاصه‌ای از وضعیت workspace را برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: Skills واجد شرایط، missing-requirements، و allowlist-blocked را می‌شمارد.
    - **دایرکتوری‌های workspace قدیمی**: وقتی `~/openclaw` یا دایرکتوری‌های workspace قدیمی دیگر کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای فعال/غیرفعال/خطادار را می‌شمارد؛ شناسه‌های Plugin را برای هر خطا فهرست می‌کند؛ قابلیت‌های bundle Plugin را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را که با runtime فعلی مشکل سازگاری دارند پرچم‌گذاری می‌کند.
    - **عیب‌یابی Plugin**: هر هشدار یا خطای زمان load صادرشده توسط registry مربوط به Plugin را نمایان می‌کند.

  </Accordion>
  <Accordion title="۱۱ب. اندازه فایل bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا فایل‌های context تزریق‌شده دیگر) نزدیک به بودجه کاراکتر پیکربندی‌شده هستند یا از آن گذشته‌اند. برای هر فایل تعداد کاراکتر خام در برابر تزریق‌شده، درصد کوتاه‌سازی، علت کوتاه‌سازی (`max/file` یا `max/total`)، و مجموع کاراکترهای تزریق‌شده را به‌عنوان کسری از بودجه کل گزارش می‌کند. وقتی فایل‌ها کوتاه شده باشند یا نزدیک حد باشند، doctor نکاتی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="۱۱د. پاک‌سازی Plugin channel مانده">
    وقتی `openclaw doctor --fix` یک Plugin channel گم‌شده را حذف می‌کند، پیکربندی dangling در scope همان channel را هم که به آن Plugin ارجاع داده بود حذف می‌کند: ورودی‌های `channels.<id>`، targetهای Heartbeat که channel را نام برده بودند، و overrideهای `agents.*.models["<channel>/*"]`. این از boot loopهای Gateway جلوگیری می‌کند که در آن runtime مربوط به channel از بین رفته اما پیکربندی هنوز از Gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="۱۱ج. تکمیل shell">
    Doctor بررسی می‌کند که آیا tab completion برای shell فعلی (zsh، bash، fish، یا PowerShell) نصب شده است:

    - اگر پروفایل shell از الگوی dynamic completion کند (`source <(openclaw completion ...)`) استفاده کند، doctor آن را به variant سریع‌تر فایل cached ارتقا می‌دهد.
    - اگر completion در پروفایل پیکربندی شده باشد اما فایل cache وجود نداشته باشد، doctor cache را به‌طور خودکار دوباره تولید می‌کند.
    - اگر هیچ completionای اصلاً پیکربندی نشده باشد، doctor درخواست نصب آن را می‌دهد (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای تولید دوباره cache به‌صورت دستی، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="۱۲. بررسی‌های احراز هویت Gateway (token محلی)">
    Doctor آمادگی احراز هویت token محلی Gateway را بررسی می‌کند.

    - اگر حالت token به token نیاز داشته باشد و هیچ منبع token وجود نداشته باشد، doctor پیشنهاد تولید یکی را می‌دهد.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما در دسترس نباشد، doctor هشدار می‌دهد و آن را با plaintext بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط زمانی تولید را اجبار می‌کند که هیچ SecretRef مربوط به token پیکربندی نشده باشد.

  </Accordion>
  <Accordion title="۱۲ب. تعمیرهای فقط‌خواندنی آگاه از SecretRef">
    برخی جریان‌های تعمیر باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار fail-fast در runtime بررسی کنند.

    - `openclaw doctor --fix` اکنون برای تعمیرات هدفمند پیکربندی از همان مدل خلاصه‌ی فقط‌خواندنی SecretRef استفاده می‌کند که فرمان‌های خانواده‌ی وضعیت استفاده می‌کنند.
    - مثال: تعمیر `allowFrom` / `groupAllowFrom` با `@username` در Telegram تلاش می‌کند در صورت موجود بودن، از اعتبارنامه‌های پیکربندی‌شده‌ی بات استفاده کند.
    - اگر توکن بات Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، doctor گزارش می‌دهد که اعتبارنامه پیکربندی‌شده-اما-ناموجود است و به‌جای خراب شدن یا گزارش نادرستِ نبودن توکن، حل‌وفصل خودکار را رد می‌کند.

  </Accordion>
  <Accordion title="13. Gateway health check + restart">
    doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی دوباره‌ی آن را می‌دهد.
  </Accordion>
  <Accordion title="13b. Memory search readiness">
    doctor بررسی می‌کند که آیا ارائه‌دهنده‌ی embedding جست‌وجوی حافظه‌ی پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و ارائه‌دهنده‌ی پیکربندی‌شده بستگی دارد:

    - **backend QMD**: بررسی می‌کند که آیا باینری `qmd` موجود و قابل شروع است یا نه. اگر نباشد، راهنمای رفع شامل بسته‌ی npm و گزینه‌ی مسیر دستی باینری را چاپ می‌کند.
    - **ارائه‌دهنده‌ی محلی صریح**: وجود یک فایل مدل محلی یا یک URL مدل راه‌دور/قابل‌دانلود شناخته‌شده را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌کند به یک ارائه‌دهنده‌ی راه‌دور تغییر دهید.
    - **ارائه‌دهنده‌ی راه‌دور صریح** (`openai`، `voyage` و غیره): بررسی می‌کند که یک کلید API در محیط یا ذخیره‌گاه احراز هویت وجود دارد. اگر نباشد، راهنمایی‌های قابل‌اقدام برای رفع مشکل چاپ می‌کند.
    - **ارائه‌دهنده‌ی خودکار**: ابتدا دسترس‌پذیری مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهنده‌ی راه‌دور را به ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی نتیجه‌ی probe ذخیره‌شده‌ی Gateway موجود باشد (Gateway در زمان بررسی سالم بوده باشد)، doctor نتیجه‌ی آن را با پیکربندی قابل‌مشاهده برای CLI تطبیق می‌دهد و هر ناهمخوانی را یادآوری می‌کند. doctor در مسیر پیش‌فرض یک ping تازه‌ی embedding شروع نمی‌کند؛ وقتی بررسی زنده‌ی ارائه‌دهنده می‌خواهید، از فرمان وضعیت عمیق حافظه استفاده کنید.

    برای تأیید آمادگی embedding در زمان اجرا از `openclaw memory status --deep` استفاده کنید.

  </Accordion>
  <Accordion title="14. Channel status warnings">
    اگر Gateway سالم باشد، doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. Supervisor config audit + repair">
    doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های جاافتاده یا قدیمی (برای نمونه وابستگی‌های network-online در systemd و تأخیر راه‌اندازی دوباره) بررسی می‌کند. وقتی ناهمخوانی پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل سرویس/وظیفه را به پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` درخواست‌های تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های توصیه‌شده را بدون درخواست تأیید اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`، doctor را برای چرخه‌ی حیات سرویس Gateway فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌دهد و تعمیرات غیرسرویسی را اجرا می‌کند، اما نصب/شروع/راه‌اندازی دوباره/bootstrap سرویس، بازنویسی‌های پیکربندی supervisor، و پاک‌سازی سرویس قدیمی را رد می‌کند، چون یک supervisor خارجی مالک آن چرخه‌ی حیات است.
    - در Linux، doctor تا وقتی واحد systemd متناظر Gateway فعال است، metadata فرمان/نقطه‌ی ورود را بازنویسی نمی‌کند. همچنین هنگام اسکن سرویس تکراری، واحدهای اضافی غیرفعالِ غیرقدیمی و شبیه Gateway را نادیده می‌گیرد تا فایل‌های سرویس همراه نویز پاک‌سازی ایجاد نکنند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/تعمیر سرویس doctor، SecretRef را اعتبارسنجی می‌کند اما مقدارهای توکن متن ساده‌ی حل‌شده را در metadata محیط سرویس supervisor پایدار نمی‌کند.
    - doctor مقدارهای محیط سرویس مدیریت‌شده‌ی مبتنی بر `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd، یا Windows Scheduled Task به‌صورت درون‌خطی جاسازی کرده‌اند تشخیص می‌دهد و metadata سرویس را بازنویسی می‌کند تا آن مقدارها به‌جای تعریف supervisor از منبع runtime بارگذاری شوند.
    - doctor تشخیص می‌دهد که فرمان سرویس بعد از تغییر `gateway.port` هنوز یک `--port` قدیمی را pin کرده است و metadata سرویس را به پورت فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل نشده باشد، doctor مسیر نصب/تعمیر را با راهنمایی قابل‌اقدام مسدود می‌کند.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/تعمیر را تا زمانی که mode صریح تنظیم شود مسدود می‌کند.
    - برای واحدهای user-systemd در Linux، بررسی‌های انحراف توکن doctor اکنون هنگام مقایسه‌ی metadata احراز هویت سرویس، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شود.
    - تعمیرات سرویس doctor از بازنویسی، توقف، یا راه‌اندازی دوباره‌ی سرویس Gateway از یک باینری قدیمی‌تر OpenClaw خودداری می‌کند، وقتی پیکربندی آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید با `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="16. Gateway runtime + port diagnostics">
    doctor runtime سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما عملاً در حال اجرا نیست هشدار می‌دهد. همچنین برخوردهای پورت روی پورت Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل (Gateway از قبل در حال اجرا، تونل SSH) را گزارش می‌دهد.
  </Accordion>
  <Accordion title="17. Gateway runtime best practices">
    doctor وقتی سرویس Gateway روی Bun یا یک مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای مدیر نسخه می‌توانند بعد از ارتقاها خراب شوند، چون سرویس init شل شما را بارگذاری نمی‌کند. doctor پیشنهاد می‌دهد در صورت موجود بودن، به نصب سیستمی Node مهاجرت کنید (Homebrew/apt/choco).

    LaunchAgentهای macOS که به‌تازگی نصب یا تعمیر شده‌اند به‌جای کپی کردن PATH شل تعاملی، از یک PATH سیستمی canonical (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین Volta، asdf، fnm، pnpm، و دیگر دایرکتوری‌های مدیر نسخه تغییر نمی‌دهند که فرایندهای فرزند Node به کدام مسیر resolve شوند. سرویس‌های Linux همچنان ریشه‌های محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های پایدار user-bin را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌ی مدیر نسخه فقط وقتی در PATH سرویس نوشته می‌شوند که آن دایرکتوری‌ها روی دیسک وجود داشته باشند.

  </Accordion>
  <Accordion title="18. Config write + wizard metadata">
    doctor هر تغییر پیکربندی را پایدار می‌کند و metadata ویزارد را برای ثبت اجرای doctor مهر می‌زند.
  </Accordion>
  <Accordion title="19. Workspace tips (backup + memory system)">
    doctor وقتی سیستم حافظه‌ی workspace وجود نداشته باشد آن را پیشنهاد می‌کند و اگر workspace از قبل زیر git نباشد، یک نکته‌ی پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و پشتیبان‌گیری git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
