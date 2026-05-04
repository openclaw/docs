---
read_when:
    - افزودن یا اصلاح مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'فرمان Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی و مراحل ترمیم'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-04T09:37:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار ترمیم + مهاجرت برای OpenClaw است. پیکربندی/وضعیت کهنه را اصلاح می‌کند، سلامت را بررسی می‌کند، و گام‌های ترمیمی قابل‌اقدام ارائه می‌دهد.

## شروع سریع

```bash
openclaw doctor
```

### حالت‌های بدون سر و خودکارسازی

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    پیش‌فرض‌ها را بدون پرسش بپذیر (از جمله گام‌های ترمیم راه‌اندازی مجدد/سرویس/سندباکس در صورت کاربرد).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ترمیم‌های پیشنهادی را بدون پرسش اعمال کن (ترمیم‌ها + راه‌اندازی‌های مجدد در موارد امن).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ترمیم‌های تهاجمی را هم اعمال کن (پیکربندی‌های سفارشی ناظر را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    بدون پرسش اجرا کن و فقط مهاجرت‌های امن را اعمال کن (عادی‌سازی پیکربندی + انتقال وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/سندباکس را که به تأیید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های Gateway اضافی اسکن کن (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید تغییرات را پیش از نوشتن بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## چه کاری انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، رابط کاربری، و به‌روزرسانی‌ها">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل رابط کاربری (وقتی شِمای پروتکل جدیدتر باشد Control UI را دوباره می‌سازد).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/ناموجود/مسدود) و وضعیت Plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - عادی‌سازی پیکربندی برای مقدارهای قدیمی.
    - مهاجرت پیکربندی گفت‌وگو از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای بازنویسی ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌افکنی OAuth کدکس (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OAuth کدکس OpenAI.
    - هشدارهای فهرست مجاز Plugin/ابزار وقتی `plugins.allow` محدودکننده است اما سیاست ابزار همچنان wildcard یا ابزارهای متعلق به Plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (نشست‌ها/دایرکتوری عامل/احراز هویت WhatsApp).
    - مهاجرت کلید قرارداد مانیفست Plugin قدیمی (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت ذخیره‌گاه Cron قدیمی (`jobId`, `schedule.cron`, فیلدهای سطح‌بالای تحویل/بارمفید، بارمفید `provider`، کارهای جایگزین ساده Webhook با `notify: true`).
    - مهاجرت سیاست زمان‌اجرای عامل قدیمی به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی کهنه Plugin وقتی Pluginها فعال هستند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های کهنه Plugin به‌عنوان پیکربندی مهار بی‌اثر در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل قفل نشست و پاک‌سازی قفل‌های کهنه.
    - ترمیم رونوشت نشست برای شاخه‌های تکراری بازنویسی پرامپت که توسط بیلدهای متأثر 2026.4.24 ایجاد شده‌اند.
    - شناسایی سنگ‌قبرهای بازیابی پس از راه‌اندازی مجدد زیرعامل گیرکرده، با پشتیبانی `--fix` برای پاک‌کردن پرچم‌های بازیابی لغوشده کهنه تا راه‌اندازی دیگر آن فرزند را همچنان لغوشده بر اثر راه‌اندازی مجدد تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (نشست‌ها، رونوشت‌ها، دایرکتوری وضعیت).
    - بررسی‌های مجوز فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند توکن‌های نزدیک به انقضا را نوسازی کند، و وضعیت‌های دوره انتظار/غیرفعال بودن پروفایل احراز هویت را گزارش می‌دهد.
    - شناسایی دایرکتوری فضای کار اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و ناظرها">
    - ترمیم تصویر سندباکس وقتی سندباکس‌کردن فعال است.
    - مهاجرت سرویس قدیمی و شناسایی Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های زمان‌اجرای Gateway (سرویس نصب شده اما اجرا نمی‌شود؛ برچسب launchd کش‌شده).
    - هشدارهای وضعیت کانال (کاوش‌شده از Gateway در حال اجرا).
    - ممیزی پیکربندی ناظر (launchd/systemd/schtasks) با ترمیم اختیاری.
    - پاک‌سازی محیط پراکسی تعبیه‌شده برای سرویس‌های Gateway که مقدارهای پوسته `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را هنگام نصب یا به‌روزرسانی گرفته‌اند.
    - بررسی‌های بهترین‌رویه زمان‌اجرای Gateway (Node در برابر Bun، مسیرهای مدیر نسخه).
    - عیب‌یابی برخورد پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="احراز هویت، امنیت، و جفت‌سازی">
    - هشدارهای امنیتی برای سیاست‌های پیام مستقیم باز.
    - بررسی‌های احراز هویت Gateway برای حالت توکن محلی (وقتی هیچ منبع توکنی وجود ندارد تولید توکن را پیشنهاد می‌کند؛ پیکربندی‌های SecretRef توکن را بازنویسی نمی‌کند).
    - شناسایی مشکل جفت‌سازی دستگاه (درخواست‌های جفت‌سازی نخستین‌بار در انتظار، ارتقاهای نقش/دامنه در انتظار، انحراف کش کهنه توکن دستگاه محلی، و انحراف احراز هویت رکورد جفت‌شده).

  </Accordion>
  <Accordion title="فضای کار و پوسته">
    - بررسی linger در systemd روی Linux.
    - بررسی اندازه فایل راه‌انداز فضای کار (هشدارهای برش/نزدیک‌بودن به حد برای فایل‌های زمینه).
    - بررسی آمادگی Skills برای عامل پیش‌فرض؛ مهارت‌های مجاز با نیازمندی‌های ناموجود bin، محیط، پیکربندی، یا سیستم‌عامل را گزارش می‌دهد، و `--fix` می‌تواند مهارت‌های در دسترس نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت تکمیل پوسته و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده تعبیه جست‌وجوی حافظه (مدل محلی، کلید API راه‌دور، یا باینری QMD).
    - بررسی‌های نصب از منبع (ناسازگاری فضای کار pnpm، دارایی‌های رابط کاربری ناموجود، باینری tsx ناموجود).
    - پیکربندی به‌روزشده + فراداده جادوگر را می‌نویسد.

  </Accordion>
</AccordionGroup>

## پس‌پرکردن و بازنشانی رابط کاربری رویاها

صحنه رویاها در Control UI شامل اقدام‌های **پس‌پرکردن**، **بازنشانی**، و **پاک‌کردن زمینه‌مند** برای جریان کاری Dreaming زمینه‌مند است. این اقدام‌ها از روش‌های RPC شبیه doctor در Gateway استفاده می‌کنند، اما بخشی از ترمیم/مهاجرت CLI در `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **پس‌پرکردن** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در فضای کار فعال اسکن می‌کند، گذر دفترچه REM زمینه‌مند را اجرا می‌کند، و ورودی‌های پس‌پرکردن برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **بازنشانی** فقط همان ورودی‌های دفترچه پس‌پرکردنِ علامت‌گذاری‌شده را از `DREAMS.md` حذف می‌کند.
- **پاک‌کردن زمینه‌مند** فقط ورودی‌های کوتاه‌مدتِ فقط-زمینه‌مندِ آماده‌سازی‌شده را حذف می‌کند که از بازپخش تاریخی آمده‌اند و هنوز یادآوری زنده یا پشتیبانی روزانه انباشته نکرده‌اند.

کاری که به‌تنهایی انجام **نمی‌دهند**:

- آن‌ها `MEMORY.md` را ویرایش نمی‌کنند
- آن‌ها مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- آن‌ها نامزدهای زمینه‌مند را به‌طور خودکار وارد ذخیره‌گاه ترویج کوتاه‌مدت زنده نمی‌کنند، مگر اینکه ابتدا مسیر CLI آماده‌سازی‌شده را صراحتاً اجرا کنید

اگر می‌خواهید بازپخش تاریخی زمینه‌مند روی مسیر عادی ترویج عمیق اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار نامزدهای پایدار زمینه‌مند را در ذخیره‌گاه Dreaming کوتاه‌مدت آماده می‌کند، در حالی که `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار دقیق و منطق

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. عادی‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون بازنویسی ویژه کانال)، doctor آن‌ها را در شِمای فعلی عادی‌سازی می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی Talk برابر است با `talk.provider` + `talk.providers.<provider>`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را در نقشه ارائه‌دهنده بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` غیرخالی است و سیاست ابزار از
    ورودی‌های wildcard یا ابزار متعلق به Plugin استفاده می‌کند، هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهایی
    از Pluginهایی که واقعاً بارگذاری می‌شوند تطبیق دارد؛ فهرست مجاز انحصاری Plugin را دور نمی‌زند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا سر باز می‌زنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با شِمای به‌روزشده بازنویسی می‌کند.

    Gateway نیز هنگام راه‌اندازی، وقتی قالب پیکربندی قدیمی را شناسایی کند، مهاجرت‌های doctor را به‌طور خودکار اجرا می‌کند، بنابراین پیکربندی‌های کهنه بدون مداخله دستی ترمیم می‌شوند. مهاجرت‌های ذخیره‌گاه کار Cron توسط `openclaw doctor --fix` مدیریت می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - پیکربندی‌های configured-channel که سیاست پاسخ قابل‌مشاهده ندارند → `messages.groupChat.visibleReplies: "message_tool"`
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
    - برای کانال‌هایی که `accounts` نام‌دار دارند اما هنوز مقدارهای سطح بالای کانال تک‌حسابی باقی مانده است، آن مقدارهای دارای محدوده حساب را به حساب ارتقایافته انتخاب‌شده برای آن کانال منتقل کنید (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک هدف نام‌دار/پیش‌فرض منطبق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای زمان‌انتظارهای طولانی provider/model از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم قدیمی رله extension)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی Gateway همچنین providerهایی را که `api` آن‌ها روی یک مقدار enum آینده یا ناشناخته تنظیم شده باشد، به‌جای شکست بسته، رد می‌کند)

    هشدارهای doctor همچنین شامل راهنمایی حساب پیش‌فرض برای کانال‌های چندحسابی است:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که مسیریابی fallback می‌تواند حسابی غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی شناسه حساب ناشناخته تنظیم شده باشد، doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های provider مربوط به OpenCode">
    اگر `models.providers.opencode`، `opencode-zen`، یا `opencode-go` را دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این می‌تواند مدل‌ها را وادار کند از API نادرست استفاده کنند یا هزینه‌ها را صفر کند. Doctor هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API به‌ازای هر مدل + هزینه‌ها را برگردانید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر حذف‌شده Chrome extension اشاره می‌کند، doctor آن را به مدل فعلی اتصال Chrome MCP محلی روی میزبان نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    Doctor همچنین وقتی از `defaultProfile: "user"` یا یک پروفایل `existing-session` پیکربندی‌شده استفاده می‌کنید، مسیر Chrome MCP محلی روی میزبان را بررسی می‌کند:

    - بررسی می‌کند آیا Google Chrome روی همان میزبان برای پروفایل‌های اتصال خودکار پیش‌فرض نصب شده است یا نه
    - نسخه شناسایی‌شده Chrome را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که اشکال‌زدایی از راه دور را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    Doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلی روی میزبان همچنان نیاز دارد به:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان gateway/node
    - اجرای محلی مرورگر
    - فعال بودن اشکال‌زدایی از راه دور در آن مرورگر
    - تأیید اولین درخواست رضایت اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. Existing-session محدودیت‌های مسیر فعلی Chrome MCP را نگه می‌دارد؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود، و عملیات دسته‌ای همچنان به مرورگر مدیریت‌شده یا پروفایل خام CDP نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser، یا جریان‌های headless دیگر اعمال **نمی‌شود**. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای OAuth TLS">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، doctor نقطه پایانی مجوزدهی OpenAI را بررسی می‌کند تا مطمئن شود پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر بررسی با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده، یا گواهی خودامضاشده)، doctor راهنمای رفع مشکل مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولا `brew postinstall ca-certificates` است. با `--deep`، این بررسی حتی اگر Gateway سالم باشد هم اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های provider مربوط به Codex OAuth">
    اگر قبلا تنظیمات انتقال قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر provider داخلی Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند تحت‌الشعاع قرار دهند. Doctor وقتی آن تنظیمات انتقال قدیمی را کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال کهنه را حذف یا بازنویسی کنید و رفتار داخلی مسیریابی/fallback را برگردانید. پراکسی‌های سفارشی و بازنویسی‌های فقط header همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. هشدارهای مسیر Plugin مربوط به Codex">
    وقتی Plugin بسته‌بندی‌شده Codex فعال باشد، doctor همچنین بررسی می‌کند آیا refهای مدل اصلی `openai-codex/*` هنوز از طریق runner پیش‌فرض PI resolve می‌شوند یا نه. این ترکیب وقتی می‌خواهید احراز هویت Codex OAuth/subscription از طریق PI انجام شود معتبر است، اما به‌راحتی با harness بومی app-server مربوط به Codex اشتباه گرفته می‌شود. Doctor هشدار می‌دهد و به شکل صریح app-server اشاره می‌کند: `openai/*` به‌همراه `agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor این را خودکار تعمیر نمی‌کند چون هر دو مسیر معتبر هستند:

    - `openai-codex/*` + PI یعنی «از احراز هویت Codex OAuth/subscription از طریق runner عادی OpenClaw استفاده کن.»
    - `openai/*` + `agentRuntime.id: "codex"` یعنی «turn تعبیه‌شده را از طریق app-server بومی Codex اجرا کن.»
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از chat کنترل یا bind کن.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از adapter خارجی ACP/acpx استفاده کن.»

    اگر هشدار ظاهر شد، مسیری را که مدنظر داشتید انتخاب کنید و config را دستی ویرایش کنید. وقتی PI Codex OAuth عمدی است، هشدار را همان‌طور نگه دارید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    Doctor می‌تواند چیدمان‌های قدیمی روی دیسک را به ساختار فعلی مهاجرت دهد:

    - ذخیره‌گاه نشست‌ها + transcriptها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری عامل:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها best-effort و idempotent هستند؛ doctor وقتی هر پوشه قدیمی را به‌عنوان نسخه پشتیبان باقی بگذارد هشدار صادر می‌کند. Gateway/CLI همچنین نشست‌های قدیمی + دایرکتوری عامل را در زمان راه‌اندازی به‌صورت خودکار مهاجرت می‌کند تا history/auth/models بدون اجرای دستی doctor در مسیر به‌ازای هر عامل قرار بگیرند. احراز هویت WhatsApp عمدا فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. نرمال‌سازی provider/provider-map مربوط به Talk اکنون با برابری ساختاری مقایسه می‌کند، بنابراین diffهایی که فقط مربوط به ترتیب کلیدها هستند دیگر باعث تغییرات تکراری بی‌اثر `doctor --fix` نمی‌شوند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های manifest قدیمی Plugin">
    Doctor همه manifestهای Plugin نصب‌شده را برای کلیدهای capability سطح بالای منسوخ (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به شیء `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقدارها را داشته باشد، کلید قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های ذخیره‌گاه Cron قدیمی">
    Doctor همچنین ذخیره‌گاه کارهای cron را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی بازنویسی شده باشد) برای شکل‌های قدیمی job که scheduler هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی cron شامل موارد زیر است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload سطح بالا (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای delivery سطح بالا (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - aliasهای delivery مربوط به `provider` در payload → `delivery.channel` صریح
    - jobهای fallback ساده webhook قدیمی با `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    Doctor فقط وقتی jobهای `notify: true` را خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر یک job، fallback notify قدیمی را با یک حالت delivery غیر-webhook موجود ترکیب کند، doctor هشدار می‌دهد و آن job را برای بازبینی دستی رها می‌کند.

    در Linux، doctor همچنین وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را فراخوانی کند هشدار می‌دهد. این اسکریپت محلی روی میزبان توسط OpenClaw فعلی نگهداری نمی‌شود و وقتی cron نتواند به گذرگاه کاربر systemd دسترسی پیدا کند می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی کهنه crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor`، و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    دکتر هر دایرکتوری نشست عامل را برای فایل‌های قفل نوشتن کهنه اسکن می‌کند — فایل‌هایی که وقتی یک نشست به‌طور غیرعادی خارج شده، باقی مانده‌اند. برای هر فایل قفل پیدا‌شده گزارش می‌دهد: مسیر، PID، اینکه آیا PID هنوز زنده است، سن قفل، و اینکه آیا کهنه در نظر گرفته می‌شود یا نه (PID مرده یا قدیمی‌تر از ۳۰ دقیقه). در حالت `--fix` / `--repair`، فایل‌های قفل کهنه را به‌طور خودکار حذف می‌کند؛ در غیر این صورت یادداشتی چاپ می‌کند و به شما دستور می‌دهد با `--fix` دوباره اجرا کنید.
  </Accordion>
  <Accordion title="3d. ترمیم شاخه رونوشت نشست">
    دکتر فایل‌های JSONL نشست عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی رونوشت پرامپت 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با زمینه زمان اجرای داخلی OpenClaw به‌همراه یک همزاد فعال که همان پرامپت قابل مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، دکتر از هر فایل آسیب‌دیده در کنار نسخه اصلی پشتیبان می‌گیرد و رونوشت را به شاخه فعال بازنویسی می‌کند تا تاریخچه gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری را نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (ماندگاری نشست، مسیریابی، و ایمنی)">
    دایرکتوری وضعیت، ساقه مغز عملیاتی است. اگر ناپدید شود، نشست‌ها، اعتبارنامه‌ها، لاگ‌ها، و پیکربندی را از دست می‌دهید (مگر اینکه در جای دیگری پشتیبان داشته باشید).

    دکتر بررسی می‌کند:

    - **دایرکتوری وضعیت موجود نیست**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای ایجاد دوباره دایرکتوری درخواست می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: قابلیت نوشتن را تأیید می‌کند؛ پیشنهاد ترمیم مجوزها را می‌دهد (و وقتی عدم تطابق مالک/گروه تشخیص داده شود، راهنمایی `chown` منتشر می‌کند).
    - **دایرکتوری وضعیت همگام‌شده با ابر در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` حل شود هشدار می‌دهد، چون مسیرهای متکی بر همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت SD یا eMMC در Linux**: وقتی وضعیت به یک منبع mount از نوع `mmcblk*` حل شود هشدار می‌دهد، چون I/O تصادفی متکی بر SD یا eMMC می‌تواند زیر نوشتن‌های نشست و اعتبارنامه کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های نشست موجود نیستند**: `sessions/` و دایرکتوری ذخیره نشست برای ماندگار کردن تاریخچه و جلوگیری از کرش‌های `ENOENT` لازم هستند.
    - **عدم تطابق رونوشت**: وقتی ورودی‌های نشست اخیر فایل‌های رونوشت گم‌شده داشته باشند هشدار می‌دهد.
    - **نشست اصلی "JSONL یک‌خطی"**: وقتی رونوشت اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه در حال انباشته شدن نیست).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های خانه وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآور حالت راه‌دور**: اگر `gateway.mode=remote` باشد، دکتر یادآوری می‌کند که آن را روی میزبان راه‌دور اجرا کنید (وضعیت آنجا قرار دارد).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/جهان قابل خواندن باشد هشدار می‌دهد و پیشنهاد سخت‌گیرانه‌تر کردن به `600` را می‌دهد.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    دکتر پروفایل‌های OAuth را در ذخیره احراز هویت بررسی می‌کند، وقتی توکن‌ها در حال انقضا/منقضی‌شده باشند هشدار می‌دهد، و وقتی امن باشد می‌تواند آن‌ها را تازه‌سازی کند. اگر پروفایل OAuth/توکن Anthropic کهنه باشد، یک کلید API Anthropic یا مسیر setup-token Anthropic را پیشنهاد می‌کند. درخواست‌های تازه‌سازی فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های تازه‌سازی را رد می‌کند.

    وقتی تازه‌سازی OAuth به‌طور دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا ارائه‌دهنده‌ای که از شما می‌خواهد دوباره وارد شوید)، دکتر گزارش می‌دهد که احراز هویت دوباره لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    دکتر همچنین پروفایل‌های احراز هویتی را گزارش می‌دهد که به‌طور موقت به دلایل زیر غیرقابل استفاده هستند:

    - cooldownهای کوتاه (محدودیت نرخ/timeoutها/شکست‌های احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های صورتحساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، دکتر مرجع مدل را در برابر کاتالوگ و allowlist اعتبارسنجی می‌کند و وقتی حل نشود یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. ترمیم تصویر sandbox">
    وقتی sandboxing فعال باشد، دکتر تصویرهای Docker را بررسی می‌کند و اگر تصویر فعلی موجود نباشد، پیشنهاد ساخت یا تغییر به نام‌های قدیمی را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    دکتر در حالت `openclaw doctor --fix` / `openclaw doctor --repair` وضعیت مرحله‌بندی وابستگی Plugin قدیمی تولیدشده توسط OpenClaw را حذف می‌کند. این شامل ریشه‌های وابستگی تولیدشده کهنه، دایرکتوری‌های install-stage قدیمی، پسماند محلی package از کد ترمیم وابستگی bundled-plugin قبلی، و کپی‌های npm مدیریت‌شده یتیم یا بازیابی‌شده از Pluginهای bundled `@openclaw/*` است که می‌توانند manifest bundled فعلی را تحت‌الشعاع قرار دهند.

    دکتر همچنین می‌تواند وقتی پیکربندی به Pluginهای قابل دانلود ارجاع می‌دهد اما رجیستری Plugin محلی نمی‌تواند آن‌ها را پیدا کند، Pluginهای قابل دانلود پیکربندی‌شده را دوباره نصب کند. برای externalization مربوط به bundled-plugin نسخه 2026.5.2، دکتر به‌طور خودکار Pluginهای قابل دانلودی را نصب می‌کند که پیکربندی موجود از قبل استفاده می‌کند و سپس به `meta.lastTouchedVersion` تکیه می‌کند تا آن گذر انتشار فقط یک‌بار اجرا شود. راه‌اندازی Gateway و بارگذاری دوباره پیکربندی package managerها را اجرا نمی‌کنند؛ نصب‌های Plugin همچنان کار صریح doctor/install/update باقی می‌مانند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنمایی‌های پاک‌سازی">
    دکتر سرویس‌های Gateway قدیمی (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد حذف آن‌ها و نصب سرویس OpenClaw با استفاده از پورت Gateway فعلی را می‌دهد. همچنین می‌تواند سرویس‌های اضافی شبیه Gateway را اسکن کند و راهنمایی‌های پاک‌سازی چاپ کند. سرویس‌های Gateway مربوط به OpenClaw با نام پروفایل، درجه‌یک در نظر گرفته می‌شوند و به‌عنوان "اضافی" علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس Gateway سطح کاربر موجود نباشد اما یک سرویس Gateway سطح سیستم OpenClaw وجود داشته باشد، دکتر به‌طور خودکار سرویس سطح کاربر دومی نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس نسخه تکراری را حذف کنید یا وقتی یک supervisor سیستم مالک چرخه عمر Gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Matrix هنگام شروع">
    وقتی یک حساب کانال Matrix مهاجرت وضعیت قدیمی در انتظار یا قابل اقدام داشته باشد، دکتر (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس مراحل مهاجرت best-effort را اجرا می‌کند: مهاجرت وضعیت Matrix قدیمی و آماده‌سازی وضعیت رمزگذاری‌شده قدیمی. هر دو مرحله غیرکشنده هستند؛ خطاها ثبت می‌شوند و شروع ادامه پیدا می‌کند. در حالت فقط خواندنی (`openclaw doctor` بدون `--fix`) این بررسی به‌طور کامل رد می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و انحراف احراز هویت">
    دکتر اکنون وضعیت جفت‌سازی دستگاه را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌دهد:

    - درخواست‌های جفت‌سازی بار اول در انتظار
    - ارتقاهای نقش در انتظار برای دستگاه‌هایی که از قبل جفت شده‌اند
    - ارتقاهای scope در انتظار برای دستگاه‌هایی که از قبل جفت شده‌اند
    - ترمیم‌های عدم تطابق کلید عمومی که در آن id دستگاه هنوز مطابقت دارد اما هویت دستگاه دیگر با رکورد تأییدشده مطابقت ندارد
    - رکوردهای جفت‌شده‌ای که برای یک نقش تأییدشده توکن فعال ندارند
    - توکن‌های جفت‌شده‌ای که scopeهایشان از baseline جفت‌سازی تأییدشده منحرف شده است
    - ورودی‌های cache محلی device-token برای ماشین فعلی که قبل از چرخش توکن سمت Gateway هستند یا metadata scope کهنه دارند

    دکتر درخواست‌های جفت‌سازی را به‌طور خودکار تأیید نمی‌کند و توکن‌های دستگاه را به‌طور خودکار نمی‌چرخاند. در عوض مراحل بعدی دقیق را چاپ می‌کند:

    - درخواست‌های در انتظار را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک توکن تازه را با `openclaw devices rotate --device <deviceId> --role <role>` بچرخانید
    - یک رکورد کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این شکاف رایج "از قبل جفت شده اما هنوز pairing required دریافت می‌کند" را می‌بندد: دکتر اکنون جفت‌سازی بار اول را از ارتقاهای نقش/scope در انتظار و از انحراف توکن/هویت دستگاه کهنه متمایز می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    دکتر وقتی یک ارائه‌دهنده بدون allowlist برای DMها باز باشد، یا وقتی یک policy به‌شکل خطرناک پیکربندی شده باشد، هشدار منتشر می‌کند.
  </Accordion>
  <Accordion title="10. linger در systemd (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، دکتر اطمینان می‌دهد lingering فعال باشد تا gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (skills، Pluginها، و دایرکتوری‌های قدیمی)">
    دکتر خلاصه‌ای از وضعیت workspace را برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: skills واجد شرایط، دارای نیازمندی‌های گم‌شده، و مسدودشده توسط allowlist را می‌شمارد.
    - **دایرکتوری‌های workspace قدیمی**: وقتی `~/openclaw` یا دایرکتوری‌های workspace قدیمی دیگر در کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای فعال/غیرفعال/دارای خطا را می‌شمارد؛ شناسه‌های Plugin را برای هر خطا فهرست می‌کند؛ قابلیت‌های Plugin بسته را گزارش می‌دهد.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را علامت‌گذاری می‌کند که با runtime فعلی مشکل سازگاری دارند.
    - **عیب‌یابی Plugin**: هر هشدار یا خطای زمان بارگذاری منتشرشده توسط رجیستری Plugin را نمایان می‌کند.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    دکتر بررسی می‌کند که آیا فایل‌های bootstrap workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا فایل‌های زمینه تزریق‌شده دیگر) نزدیک یا بالاتر از بودجه کاراکتر پیکربندی‌شده هستند یا نه. برای هر فایل شمار خام در برابر شمار کاراکترهای تزریق‌شده، درصد truncation، علت truncation (`max/file` یا `max/total`)، و کل کاراکترهای تزریق‌شده به‌عنوان کسری از بودجه کل را گزارش می‌دهد. وقتی فایل‌ها truncate شده باشند یا نزدیک حد باشند، دکتر نکته‌هایی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کانال کهنه">
    وقتی `openclaw doctor --fix` یک Plugin کانال گم‌شده را حذف می‌کند، پیکربندی آویزانِ محدود به کانال را که به آن Plugin ارجاع داده بود نیز حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های Heartbeat که نام کانال را برده‌اند، و overrideهای `agents.*.models["<channel>/*"]`. این از loopهای boot در Gateway جلوگیری می‌کند که در آن runtime کانال از بین رفته اما پیکربندی هنوز از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    دکتر بررسی می‌کند آیا تکمیل tab برای shell فعلی نصب شده است یا نه (zsh، bash، fish، یا PowerShell):

    - اگر پروفایل shell از الگوی تکمیل پویای کند (`source <(openclaw completion ...)`) استفاده کند، دکتر آن را به گونه سریع‌تر فایل cache‌شده ارتقا می‌دهد.
    - اگر تکمیل در پروفایل پیکربندی شده باشد اما فایل cache موجود نباشد، دکتر cache را به‌طور خودکار دوباره تولید می‌کند.
    - اگر هیچ تکمیلی اصلاً پیکربندی نشده باشد، دکتر درخواست نصب آن را می‌دهد (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای تولید دوباره cache به‌صورت دستی، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (توکن محلی)">
    دکتر آمادگی احراز هویت توکن Gateway محلی را بررسی می‌کند.

    - اگر حالت توکن به توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، دکتر پیشنهاد تولید یکی را می‌دهد.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما در دسترس نباشد، دکتر هشدار می‌دهد و آن را با plaintext بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی هیچ token SecretRef پیکربندی نشده باشد، تولید را اجباری می‌کند.

  </Accordion>
  <Accordion title="12b. ترمیم‌های فقط‌خواندنی آگاه از SecretRef">
    برخی جریان‌های ترمیم باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار fail-fast زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` اکنون از همان مدل خلاصه فقط‌خواندنی SecretRef مانند دستورهای خانواده status برای ترمیم‌های هدفمند پیکربندی استفاده می‌کند.
    - مثال: ترمیم `allowFrom` / `groupAllowFrom` `@username` در Telegram تلاش می‌کند وقتی اعتبارنامه‌های bot پیکربندی‌شده در دسترس باشند، از آن‌ها استفاده کند.
    - اگر توکن bot در Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر دستور فعلی در دسترس نباشد، دکتر گزارش می‌دهد که اعتبارنامه پیکربندی‌شده-اما-در‌دسترس‌نیست است و به‌جای کرش کردن یا گزارش اشتباه توکن به‌عنوان گم‌شده، auto-resolution را رد می‌کند.

  </Accordion>
  <Accordion title="۱۳. بررسی سلامت Gateway + راه‌اندازی مجدد">
    doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی مجدد آن را می‌دهد.
  </Accordion>
  <Accordion title="۱۳ب. آمادگی جستجوی حافظه">
    doctor بررسی می‌کند که آیا ارائه‌دهنده تعبیه‌سازی جستجوی حافظه پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به پشتیبان و ارائه‌دهنده پیکربندی‌شده بستگی دارد:

    - **پشتیبان QMD**: بررسی می‌کند که آیا باینری `qmd` در دسترس و قابل شروع است یا نه. اگر نباشد، راهنمای رفع مشکل را شامل بسته npm و گزینه مسیر دستی باینری چاپ می‌کند.
    - **ارائه‌دهنده محلی صریح**: وجود فایل مدل محلی یا URL مدل دوردست/قابل دانلود شناخته‌شده را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌کند به یک ارائه‌دهنده دوردست تغییر دهید.
    - **ارائه‌دهنده دوردست صریح** (`openai`، `voyage` و غیره): بررسی می‌کند که یک کلید API در محیط یا مخزن احراز هویت وجود داشته باشد. اگر موجود نباشد، راهنمایی‌های قابل اقدام برای رفع مشکل چاپ می‌کند.
    - **ارائه‌دهنده خودکار**: ابتدا دسترس‌پذیری مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهنده دوردست را به ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی نتیجه بررسی Gateway در حافظه نهان موجود باشد (Gateway هنگام بررسی سالم بوده است)، doctor نتیجه آن را با پیکربندی قابل مشاهده برای CLI تطبیق می‌دهد و هرگونه مغایرت را یادآوری می‌کند. doctor در مسیر پیش‌فرض یک ping تازه برای تعبیه‌سازی شروع نمی‌کند؛ وقتی بررسی زنده ارائه‌دهنده را می‌خواهید، از فرمان وضعیت عمیق حافظه استفاده کنید.

    از `openclaw memory status --deep` برای تأیید آمادگی تعبیه‌سازی در زمان اجرا استفاده کنید.

  </Accordion>
  <Accordion title="۱۴. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک بررسی وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="۱۵. ممیزی + تعمیر پیکربندی ناظر">
    doctor پیکربندی ناظر نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های جاافتاده یا قدیمی (برای مثال، وابستگی‌های systemd به network-online و تأخیر راه‌اندازی مجدد) بررسی می‌کند. وقتی ناهماهنگی پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل سرویس/وظیفه را با پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی ناظر درخواست تأیید می‌کند.
    - `openclaw doctor --yes` درخواست‌های تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های توصیه‌شده را بدون درخواست تأیید اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های سفارشی ناظر را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` برای چرخه عمر سرویس Gateway، doctor را فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌دهد و تعمیرهای غیرسرویسی را اجرا می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس، بازنویسی‌های پیکربندی ناظر، و پاک‌سازی سرویس قدیمی را رد می‌کند، چون یک ناظر خارجی مالک آن چرخه عمر است.
    - در Linux، doctor تا زمانی که واحد systemd Gateway مطابق فعال است، فراداده فرمان/نقطه ورود را بازنویسی نمی‌کند. همچنین هنگام اسکن سرویس تکراری، واحدهای اضافی غیرفعال و غیرقدیمیِ شبیه Gateway را نادیده می‌گیرد تا فایل‌های سرویس همراه نویز پاک‌سازی ایجاد نکنند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` توسط SecretRef مدیریت شود، نصب/تعمیر سرویس doctor، SecretRef را اعتبارسنجی می‌کند اما مقدارهای توکن متن ساده حل‌شده را در فراداده محیط سرویس ناظر ماندگار نمی‌کند.
    - doctor مقدارهای محیط سرویس مدیریت‌شده و مبتنی بر `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd، یا Windows Scheduled Task به‌صورت درون‌خطی جاسازی کرده‌اند شناسایی می‌کند و فراداده سرویس را بازنویسی می‌کند تا آن مقدارها به‌جای تعریف ناظر، از منبع زمان اجرا بارگذاری شوند.
    - doctor تشخیص می‌دهد چه زمانی فرمان سرویس پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را ثابت نگه داشته است و فراداده سرویس را به درگاه فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل نشده باشد، doctor مسیر نصب/تعمیر را با راهنمایی قابل اقدام مسدود می‌کند.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/تعمیر را تا زمانی که mode به‌صورت صریح تنظیم شود مسدود می‌کند.
    - برای واحدهای user-systemd در Linux، بررسی‌های انحراف توکن doctor اکنون هنگام مقایسه فراداده احراز هویت سرویس، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شود.
    - تعمیرهای سرویس doctor از بازنویسی، توقف، یا راه‌اندازی مجدد سرویس Gateway از یک باینری قدیمی‌تر OpenClaw خودداری می‌کنند وقتی پیکربندی آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید بازنویسی کامل را از طریق `openclaw gateway install --force` اجباری کنید.

  </Accordion>
  <Accordion title="۱۶. تشخیص‌های زمان اجرای Gateway + درگاه">
    doctor زمان اجرای سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما واقعاً در حال اجرا نیست هشدار می‌دهد. همچنین تداخل‌های درگاه روی درگاه Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل (Gateway از قبل در حال اجرا است، تونل SSH) را گزارش می‌دهد.
  </Accordion>
  <Accordion title="۱۷. بهترین رویه‌های زمان اجرای Gateway">
    doctor وقتی سرویس Gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا می‌شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای مدیر نسخه می‌توانند پس از ارتقا خراب شوند چون سرویس راه‌انداز shell شما را بارگذاری نمی‌کند. doctor پیشنهاد می‌کند در صورت دسترس بودن نصب Node سیستمی (Homebrew/apt/choco)، به آن مهاجرت کنید.

    LaunchAgentهای macOS که تازه نصب یا تعمیر شده‌اند به‌جای کپی کردن PATH تعاملی shell، از یک PATH سیستمی کانونی (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین Volta، asdf، fnm، pnpm و دیگر دایرکتوری‌های مدیر نسخه تغییر نمی‌دهند که فرایندهای فرزند Node به کدام مورد resolve شوند. سرویس‌های Linux همچنان ریشه‌های محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های پایدار user-bin را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌شده مدیر نسخه فقط وقتی آن دایرکتوری‌ها روی دیسک وجود داشته باشند در PATH سرویس نوشته می‌شوند.

  </Accordion>
  <Accordion title="۱۸. نوشتن پیکربندی + فراداده جادوگر">
    doctor هرگونه تغییر پیکربندی را ماندگار می‌کند و فراداده جادوگر را مهر می‌زند تا اجرای doctor ثبت شود.
  </Accordion>
  <Accordion title="۱۹. نکته‌های فضای کاری (پشتیبان‌گیری + سیستم حافظه)">
    doctor وقتی سیستم حافظه فضای کاری وجود ندارد آن را پیشنهاد می‌کند و اگر فضای کاری از قبل زیر git نباشد، یک نکته پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار فضای کاری و پشتیبان‌گیری git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [دفترچه اجرای Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
