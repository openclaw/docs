---
read_when:
    - افزودن یا اصلاح مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل تعمیر'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-04-30T16:29:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. این ابزار پیکربندی/وضعیت کهنه را اصلاح می‌کند، سلامت را بررسی می‌کند، و گام‌های تعمیر قابل اقدام ارائه می‌دهد.

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

    پذیرش پیش‌فرض‌ها بدون پرسش (از جمله گام‌های تعمیر راه‌اندازی مجدد/سرویس/سندباکس در صورت کاربرد).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    اعمال تعمیرهای توصیه‌شده بدون پرسش (تعمیرها + راه‌اندازی‌های مجدد در موارد امن).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    تعمیرهای تهاجمی را هم اعمال می‌کند (پیکربندی‌های سفارشی سرپرست را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    بدون اعلان اجرا می‌شود و فقط مهاجرت‌های امن را اعمال می‌کند (نرمال‌سازی پیکربندی + جابه‌جایی وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/سندباکس را که نیاز به تأیید انسانی دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های Gateway اضافی اسکن می‌کند (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید تغییرات را پیش از نوشتن بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## چه کار می‌کند (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، UI، و به‌روزرسانی‌ها">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل UI (وقتی شِمای پروتکل جدیدتر باشد، Control UI را دوباره می‌سازد).
    - بررسی سلامت + اعلان راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/موجود نیست/مسدود) و وضعیت plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - نرمال‌سازی پیکربندی برای مقدارهای قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای بازنویسی ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌انداختن OAuth در Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OpenAI Codex OAuth.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/WhatsApp auth).
    - مهاجرت کلید قرارداد manifest قدیمی plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت فروشگاه cron قدیمی (`jobId`, `schedule.cron`, فیلدهای سطح بالای delivery/payload، payload `provider`، کارهای fallback ساده `notify: true` webhook).
    - مهاجرت سیاست runtime عامل قدیمی به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی کهنه plugin وقتی pluginها فعال هستند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های کهنه plugin به‌عنوان پیکربندی containment بی‌اثر تلقی می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل قفل نشست و پاک‌سازی قفل‌های کهنه.
    - تعمیر رونوشت نشست برای شاخه‌های تکراری بازنویسی اعلان که توسط buildهای آسیب‌دیده 2026.4.24 ایجاد شده‌اند.
    - شناسایی tombstone بازیابی-راه‌اندازی مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌سازی پرچم‌های کهنه بازیابی لغوشده تا startup همچنان فرزند را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (sessions، transcripts، state dir).
    - بررسی مجوزهای فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای در آستانه انقضا را تازه‌سازی کند، و وضعیت‌های cooldown/disabled در auth-profile را گزارش می‌دهد.
    - شناسایی دایرکتوری workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و سرپرست‌ها">
    - تعمیر تصویر سندباکس وقتی سندباکس فعال است.
    - مهاجرت سرویس قدیمی و شناسایی Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime مربوط به Gateway (سرویس نصب شده اما اجرا نمی‌شود؛ برچسب launchd کش‌شده).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا probe شده).
    - ممیزی پیکربندی سرپرست (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy تعبیه‌شده برای سرویس‌های Gateway که هنگام نصب یا به‌روزرسانی مقدارهای shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را گرفته‌اند.
    - بررسی بهترین‌رویه‌های runtime مربوط به Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی برخورد پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="احراز هویت، امنیت، و جفت‌سازی">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی منبع token وجود ندارد، تولید token را پیشنهاد می‌دهد؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - شناسایی مشکلات جفت‌سازی دستگاه (درخواست‌های جفت‌سازی نخستین‌بار معلق، ارتقاهای role/scope معلق، drift کش token دستگاه محلی کهنه، و drift احراز هویت رکورد جفت‌شده).

  </Accordion>
  <Accordion title="Workspace و shell">
    - بررسی systemd linger در Linux.
    - بررسی اندازه فایل bootstrap در workspace (هشدارهای کوتاه‌شدن/نزدیک‌بودن به حد برای فایل‌های context).
    - بررسی وضعیت تکمیل shell و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding جست‌وجوی حافظه (مدل محلی، کلید API راه‌دور، یا باینری QMD).
    - بررسی‌های نصب از source (ناهماهنگی pnpm workspace، دارایی‌های UI موجود نیست، باینری tsx موجود نیست).
    - پیکربندی به‌روزشده + فراداده wizard را می‌نویسد.

  </Accordion>
</AccordionGroup>

## پس‌پر کردن و بازنشانی UI رویاها

صحنه Dreams در Control UI شامل اقدام‌های **پس‌پر کردن**، **بازنشانی**، و **پاک‌سازی Grounded** برای گردش‌کار dreaming grounded است. این اقدام‌ها از روش‌های RPC به سبک doctor در Gateway استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **پس‌پر کردن** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر دفترچه REM grounded را اجرا می‌کند، و ورودی‌های پس‌پر کردن برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **بازنشانی** فقط همان ورودی‌های دفترچه پس‌پر کردن علامت‌گذاری‌شده را از `DREAMS.md` حذف می‌کند.
- **پاک‌سازی Grounded** فقط ورودی‌های کوتاه‌مدت staged و فقط grounded را که از بازپخش تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه جمع نکرده‌اند حذف می‌کند.

کاری که خودشان انجام **نمی‌دهند**:

- آن‌ها `MEMORY.md` را ویرایش نمی‌کنند
- آن‌ها مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- آن‌ها نامزدهای grounded را به‌طور خودکار در فروشگاه promotion کوتاه‌مدت زنده stage نمی‌کنند، مگر اینکه ابتدا مسیر CLI مربوط به staged را صراحتاً اجرا کنید

اگر می‌خواهید بازپخش تاریخی grounded روی lane معمول deep promotion اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار نامزدهای پایدار grounded را در فروشگاه dreaming کوتاه‌مدت stage می‌کند، در حالی که `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار تفصیلی و دلیل طراحی

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. نرمال‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون بازنویسی مخصوص کانال)، doctor آن‌ها را به شِمای فعلی نرمال‌سازی می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی Talk برابر است با `talk.provider` + `talk.providers.<provider>`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را به نقشه ارائه‌دهنده بازنویسی می‌کند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با شِمای به‌روزشده بازنویسی می‌کند.

    Gateway نیز هنگام startup، وقتی قالب پیکربندی قدیمی را شناسایی کند، مهاجرت‌های doctor را خودکار اجرا می‌کند تا پیکربندی‌های کهنه بدون مداخله دستی تعمیر شوند. مهاجرت‌های فروشگاه کار Cron توسط `openclaw doctor --fix` انجام می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
    - برای کانال‌هایی که `accounts` نام‌دار دارند اما مقدارهای سطح بالای کانالِ تک‌حسابی همچنان باقی مانده‌اند، آن مقدارهای account-scoped را به حساب promote‌شده‌ای منتقل می‌کند که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند هدف نام‌دار/پیش‌فرض منطبق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - حذف `agents.defaults.llm`؛ برای timeoutهای کند ارائه‌دهنده/مدل از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - حذف `browser.relayBindHost` (تنظیم قدیمی relay افزونه)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (startup مربوط به Gateway همچنین ارائه‌دهندگانی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده باشد به‌جای fail closed رد می‌کند)

    هشدارهای Doctor همچنین شامل راهنمایی account-default برای کانال‌های چندحسابی است:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، دکتر هشدار می‌دهد که مسیریابی جایگزین ممکن است یک حساب غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی یک شناسه حساب ناشناخته تنظیم شده باشد، دکتر هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های ارائه‌دهنده OpenCode">
    اگر `models.providers.opencode`، `opencode-zen`، یا `opencode-go` را به‌صورت دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این می‌تواند مدل‌ها را مجبور کند از API اشتباه استفاده کنند یا هزینه‌ها را صفر کند. دکتر هشدار می‌دهد تا بتوانید این بازنویسی را حذف کنید و مسیریابی API و هزینه‌های مخصوص هر مدل را بازیابی کنید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر افزونه حذف‌شده Chrome اشاره کند، دکتر آن را به مدل اتصال Chrome MCP میزبان-محلی فعلی عادی‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    دکتر همچنین زمانی که از `defaultProfile: "user"` یا یک پروفایل پیکربندی‌شده `existing-session` استفاده می‌کنید، مسیر Chrome MCP میزبان-محلی را بررسی می‌کند:

    - بررسی می‌کند که آیا Google Chrome روی همان میزبان برای پروفایل‌های اتصال خودکار پیش‌فرض نصب شده است
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که اشکال‌زدایی راه‌دور را در صفحه بازرسی مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    دکتر نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP میزبان-محلی همچنان نیاز دارد به:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان Gateway/Node
    - مرورگری که به‌صورت محلی در حال اجرا باشد
    - اشکال‌زدایی راه‌دور که در آن مرورگر فعال شده باشد
    - تایید نخستین درخواست رضایت اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. Existing-session محدودیت‌های مسیر فعلی Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود، و کنش‌های دسته‌ای همچنان به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser، یا جریان‌های headless دیگر اعمال **نمی‌شود**. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای OAuth TLS">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، دکتر نقطه پایانی مجوزدهی OpenAI را بررسی می‌کند تا تایید کند پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر بررسی با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده، یا گواهی خودامضاشده)، دکتر راهنمای رفع مشکل مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولا `brew postinstall ca-certificates` است. با `--deep`، بررسی حتی اگر gateway سالم باشد نیز اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های ارائه‌دهنده Codex OAuth">
    اگر قبلا تنظیمات انتقال قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر ارائه‌دهنده داخلی Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند تحت‌الشعاع قرار دهند. دکتر وقتی این تنظیمات انتقال قدیمی را کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال کهنه را حذف یا بازنویسی کنید و رفتار مسیریابی/جایگزینی داخلی را برگردانید. پراکسی‌های سفارشی و بازنویسی‌های فقط-هدر همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. هشدارهای مسیر Plugin مربوط به Codex">
    وقتی Plugin بسته‌بندی‌شده Codex فعال باشد، دکتر همچنین بررسی می‌کند که آیا ارجاع‌های مدل اصلی `openai-codex/*` همچنان از طریق اجراکننده پیش‌فرض PI resolve می‌شوند یا نه. این ترکیب زمانی معتبر است که احراز هویت Codex OAuth/اشتراک را از طریق PI بخواهید، اما به‌راحتی ممکن است با هارنس بومی app-server مربوط به Codex اشتباه گرفته شود. دکتر هشدار می‌دهد و به شکل صریح app-server اشاره می‌کند: `openai/*` به‌همراه `agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex`.

    دکتر این را به‌صورت خودکار تعمیر نمی‌کند، چون هر دو مسیر معتبر هستند:

    - `openai-codex/*` + PI یعنی «از احراز هویت Codex OAuth/اشتراک از طریق اجراکننده عادی OpenClaw استفاده کن.»
    - `openai/*` + `runtime: "codex"` یعنی «نوبت تعبیه‌شده را از طریق app-server بومی Codex اجرا کن.»
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از چت کنترل یا bind کن.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از آداپتور خارجی ACP/acpx استفاده کن.»

    اگر هشدار ظاهر شد، مسیری را که قصد داشتید انتخاب کنید و پیکربندی را دستی ویرایش کنید. وقتی PI Codex OAuth عمدی است، هشدار را همان‌طور نگه دارید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    دکتر می‌تواند چیدمان‌های قدیمی روی دیسک را به ساختار فعلی مهاجرت دهد:

    - ذخیره‌ساز نشست‌ها + رونوشت‌ها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری عامل:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از مسیر قدیمی `~/.openclaw/credentials/*.json` (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها به‌صورت best-effort و idempotent هستند؛ دکتر وقتی هر پوشه قدیمی را به‌عنوان پشتیبان باقی بگذارد هشدار منتشر می‌کند. Gateway/CLI همچنین نشست‌های قدیمی + دایرکتوری عامل را هنگام راه‌اندازی به‌صورت خودکار مهاجرت می‌دهد تا تاریخچه/احراز هویت/مدل‌ها بدون اجرای دستی دکتر در مسیر مخصوص هر عامل قرار بگیرند. احراز هویت WhatsApp عمدا فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. عادی‌سازی ارائه‌دهنده Talk/نگاشت ارائه‌دهنده اکنون بر اساس برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌هایی که فقط مربوط به ترتیب کلیدها هستند دیگر باعث تغییرات تکراری بی‌اثر `doctor --fix` نمی‌شوند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های manifest قدیمی Plugin">
    دکتر همه manifestهای Plugin نصب‌شده را برای کلیدهای قابلیت سطح بالای منسوخ (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به شیء `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقادیر را داشته باشد، کلید قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های ذخیره‌ساز Cron قدیمی">
    دکتر همچنین ذخیره‌ساز کارهای cron را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی بازنویسی شده باشد) برای شکل‌های قدیمی کار که زمان‌بند هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی cron شامل موارد زیر است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload سطح بالا (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای delivery سطح بالا (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - نام‌های مستعار delivery مربوط به payload `provider` → `delivery.channel` صریح
    - کارهای fallback ساده قدیمی webhook با `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    دکتر فقط زمانی کارهای `notify: true` را به‌صورت خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر یک کار fallback قدیمی notify را با یک حالت delivery غیر-webhook موجود ترکیب کند، دکتر هشدار می‌دهد و آن کار را برای بازبینی دستی باقی می‌گذارد.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    دکتر هر دایرکتوری نشست عامل را برای فایل‌های write-lock مانده اسکن می‌کند — فایل‌هایی که وقتی یک نشست به‌صورت غیرعادی خارج شده باقی مانده‌اند. برای هر فایل قفل پیدا‌شده گزارش می‌دهد: مسیر، PID، اینکه PID هنوز زنده است یا نه، سن قفل، و اینکه stale در نظر گرفته می‌شود یا نه (PID مرده یا قدیمی‌تر از 30 دقیقه). در حالت `--fix` / `--repair` فایل‌های قفل stale را به‌صورت خودکار حذف می‌کند؛ در غیر این صورت یک یادداشت چاپ می‌کند و به شما دستور می‌دهد با `--fix` دوباره اجرا کنید.
  </Accordion>
  <Accordion title="3d. تعمیر شاخه رونوشت نشست">
    دکتر فایل‌های JSONL نشست عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی رونوشت prompt در 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با زمینه اجرای داخلی OpenClaw به‌همراه یک sibling فعال که همان prompt قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، دکتر از هر فایل متاثر کنار نسخه اصلی پشتیبان می‌گیرد و رونوشت را به شاخه فعال بازنویسی می‌کند تا خواننده‌های تاریخچه و حافظه gateway دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (پایداری نشست، مسیریابی، و ایمنی)">
    دایرکتوری وضعیت brainstem عملیاتی است. اگر ناپدید شود، نشست‌ها، اطلاعات ورود، گزارش‌ها، و پیکربندی را از دست می‌دهید (مگر اینکه در جای دیگری پشتیبان داشته باشید).

    دکتر بررسی می‌کند:

    - **دایرکتوری وضعیت وجود ندارد**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، درخواست می‌کند دایرکتوری را دوباره ایجاد کنید، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: قابلیت نوشتن را تایید می‌کند؛ پیشنهاد می‌دهد مجوزها را تعمیر کند (و وقتی ناسازگاری مالک/گروه شناسایی شود، یک راهنمای `chown` منتشر می‌کند).
    - **دایرکتوری وضعیت همگام‌شده با ابر در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای متکی بر همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت SD یا eMMC در Linux**: وقتی وضعیت به یک منبع mount با `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی متکی بر SD یا eMMC می‌تواند زیر نوشتن‌های نشست و اطلاعات ورود کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های نشست وجود ندارند**: `sessions/` و دایرکتوری ذخیره‌ساز نشست برای پایدارسازی تاریخچه و جلوگیری از crashهای `ENOENT` لازم هستند.
    - **ناسازگاری رونوشت**: وقتی ورودی‌های نشست اخیر فایل‌های رونوشت گم‌شده داشته باشند هشدار می‌دهد.
    - **نشست اصلی "JSONL تک‌خطی"**: وقتی رونوشت اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه در حال انباشته شدن نیست).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های home وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآوری حالت راه‌دور**: اگر `gateway.mode=remote` باشد، دکتر یادآوری می‌کند آن را روی میزبان راه‌دور اجرا کنید (وضعیت آنجا قرار دارد).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/جهان قابل خواندن باشد هشدار می‌دهد و پیشنهاد می‌دهد آن را به `600` محدود کند.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    دکتر پروفایل‌های OAuth را در ذخیره‌ساز احراز هویت بررسی می‌کند، وقتی توکن‌ها در حال انقضا/منقضی‌شده باشند هشدار می‌دهد، و وقتی ایمن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل OAuth/token مربوط به Anthropic کهنه باشد، یک کلید API Anthropic یا مسیر setup-token مربوط به Anthropic را پیشنهاد می‌دهد. درخواست‌های refresh فقط وقتی به‌صورت تعاملی (TTY) اجرا شود ظاهر می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی refresh مربوط به OAuth به‌صورت دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا ارائه‌دهنده‌ای که به شما می‌گوید دوباره وارد شوید)، دکتر گزارش می‌دهد که احراز هویت دوباره لازم است و فرمان دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    دکتر همچنین پروفایل‌های احراز هویتی را گزارش می‌دهد که به‌طور موقت به دلایل زیر غیرقابل استفاده هستند:

    - cooldownهای کوتاه (محدودیت نرخ/timeoutها/شکست‌های احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های صورتحساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل Hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor ارجاع مدل را در برابر کاتالوگ و allowlist اعتبارسنجی می‌کند و وقتی قابل resolve نباشد یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. ترمیم تصویر Sandbox">
    وقتی sandboxing فعال باشد، doctor تصاویر Docker را بررسی می‌کند و اگر تصویر فعلی وجود نداشته باشد، پیشنهاد ساختن آن یا تغییر به نام‌های legacy را می‌دهد.
  </Accordion>
  <Accordion title="7b. وابستگی‌های runtime برای Pluginهای همراه">
    Doctor وابستگی‌های runtime را فقط برای Pluginهای همراهی تأیید می‌کند که در پیکربندی فعلی فعال هستند یا با پیش‌فرض manifest همراهشان فعال شده‌اند، برای مثال `plugins.entries.discord.enabled: true`، مقدار legacy یعنی `channels.discord.enabled: true`، ارجاع‌های پیکربندی‌شده‌ی `models.providers.*` / مدل agent، یا یک Plugin همراهِ فعال به‌صورت پیش‌فرض بدون مالکیت provider. اگر موردی وجود نداشته باشد، doctor بسته‌ها را گزارش می‌کند و آن‌ها را در حالت `openclaw doctor --fix` / `openclaw doctor --repair` نصب می‌کند. Pluginهای خارجی همچنان از `openclaw plugins install` / `openclaw plugins update` استفاده می‌کنند؛ doctor وابستگی‌ها را برای مسیرهای دلخواه Plugin نصب نمی‌کند.

    در طول ترمیم doctor، نصب‌های npm مربوط به وابستگی‌های runtime همراه، در نشست‌های TTY پیشرفت spinner و در خروجی piped/headless پیشرفت خطی دوره‌ای را گزارش می‌کنند. Gateway و CLI محلی نیز می‌توانند وابستگی‌های runtime مربوط به Pluginهای همراهِ فعال را پیش از import کردن یک Plugin همراه، در صورت نیاز ترمیم کنند. این نصب‌ها به ریشه‌ی نصب runtime Plugin محدود هستند، با scriptهای غیرفعال اجرا می‌شوند، package lock نمی‌نویسند، و با یک lock مربوط به install-root محافظت می‌شوند تا شروع‌های هم‌زمان CLI یا Gateway درخت یکسان `node_modules` را هم‌زمان تغییر ندهند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و نکته‌های پاک‌سازی">
    Doctor سرویس‌های legacy gateway را تشخیص می‌دهد (launchd/systemd/schtasks) و پیشنهاد می‌دهد آن‌ها را حذف کند و سرویس OpenClaw را با پورت Gateway فعلی نصب کند. همچنین می‌تواند سرویس‌های اضافی شبیه gateway را اسکن کند و نکته‌های پاک‌سازی چاپ کند. سرویس‌های OpenClaw gateway با نام profile، first-class در نظر گرفته می‌شوند و به‌عنوان «اضافی» علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس Gateway سطح کاربر وجود نداشته باشد اما یک سرویس OpenClaw Gateway سطح سیستم وجود داشته باشد، doctor به‌صورت خودکار سرویس سطح کاربر دومی نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس duplicate را حذف کنید یا وقتی یک supervisor سیستمی مالک چرخه‌ی عمر Gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Startup Matrix">
    وقتی یک حساب کانال Matrix یک مهاجرت وضعیت legacy در حالت pending یا actionable داشته باشد، doctor در حالت `--fix` / `--repair` یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس مراحل مهاجرت best-effort را اجرا می‌کند: مهاجرت وضعیت legacy Matrix و آماده‌سازی وضعیت رمزگذاری‌شده‌ی legacy. هر دو مرحله non-fatal هستند؛ خطاها ثبت می‌شوند و startup ادامه پیدا می‌کند. در حالت read-only (`openclaw doctor` بدون `--fix`) این بررسی به‌طور کامل نادیده گرفته می‌شود.
  </Accordion>
  <Accordion title="8c. Pairing دستگاه و drift احراز هویت">
    Doctor اکنون وضعیت pairing دستگاه را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌کند:

    - درخواست‌های pending برای pairing اولین‌بار
    - ارتقاهای role در حالت pending برای دستگاه‌هایی که از قبل paired شده‌اند
    - ارتقاهای scope در حالت pending برای دستگاه‌هایی که از قبل paired شده‌اند
    - ترمیم‌های عدم تطابق public-key که در آن id دستگاه همچنان مطابق است اما identity دستگاه دیگر با رکورد تأییدشده مطابق نیست
    - رکوردهای paired که برای یک role تأییدشده token فعال ندارند
    - tokenهای paired که scopeهایشان از baseline تأییدشده‌ی pairing خارج شده است
    - ورودی‌های token دستگاه cacheشده‌ی محلی برای ماشین فعلی که پیش از چرخش token در سمت Gateway هستند یا metadata مربوط به scope منسوخ دارند

    Doctor درخواست‌های pair را خودکار تأیید نمی‌کند و tokenهای دستگاه را خودکار rotate نمی‌کند. در عوض مراحل دقیق بعدی را چاپ می‌کند:

    - درخواست‌های pending را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک token تازه را با `openclaw devices rotate --device <deviceId> --role <role>` rotate کنید
    - یک رکورد منسوخ را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این کار حفره‌ی رایج «از قبل paired شده اما هنوز pairing required دریافت می‌کند» را می‌بندد: doctor اکنون pairing اولین‌بار را از ارتقاهای pending مربوط به role/scope و از drift منسوخ token/identity دستگاه تفکیک می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک provider بدون allowlist برای DMها باز باشد، یا وقتی یک policy به‌شکل خطرناک پیکربندی شده باشد، هشدار صادر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان یک سرویس کاربر systemd اجرا شود، doctor مطمئن می‌شود lingering فعال است تا Gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (Skills، Pluginها، و دایرکتوری‌های legacy)">
    Doctor خلاصه‌ای از وضعیت workspace برای agent پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: تعداد Skills واجد شرایط، دارای نیازمندی‌های گم‌شده، و مسدودشده توسط allowlist.
    - **دایرکتوری‌های workspace legacy**: وقتی `~/openclaw` یا دایرکتوری‌های workspace legacy دیگر در کنار workspace فعلی وجود داشته باشند، هشدار می‌دهد.
    - **وضعیت Plugin**: تعداد Pluginهای فعال/غیرفعال/دارای خطا را می‌شمارد؛ IDهای Plugin را برای هر خطا فهرست می‌کند؛ قابلیت‌های Pluginهای bundle را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را که با runtime فعلی مشکل سازگاری دارند علامت‌گذاری می‌کند.
    - **عیب‌یابی Plugin**: هرگونه هشدار یا خطای زمان load صادرشده توسط registry Plugin را نمایش می‌دهد.

  </Accordion>
  <Accordion title="11b. اندازه‌ی فایل Bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap مربوط به workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا فایل‌های context تزریق‌شده‌ی دیگر) نزدیک به بودجه‌ی کاراکتر پیکربندی‌شده هستند یا از آن عبور کرده‌اند. برای هر فایل، تعداد کاراکترهای raw در برابر injected، درصد truncation، علت truncation (`max/file` یا `max/total`)، و مجموع کاراکترهای injected را به‌عنوان کسری از بودجه‌ی کل گزارش می‌کند. وقتی فایل‌ها trunc شده‌اند یا نزدیک به limit هستند، doctor نکته‌هایی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کانال منسوخ">
    وقتی `openclaw doctor --fix` یک Plugin کانال گم‌شده را حذف می‌کند، پیکربندی آویزانِ scoped به کانال را نیز که به آن Plugin ارجاع داده بود حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های Heartbeat که نام کانال را آورده بودند، و overrideهای `agents.*.models["<channel>/*"]`. این از boot loopهای Gateway جلوگیری می‌کند که در آن runtime کانال از بین رفته اما پیکربندی هنوز از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل Shell">
    Doctor بررسی می‌کند که آیا تکمیل tab برای shell فعلی نصب شده است یا نه (zsh، bash، fish، یا PowerShell):

    - اگر profile shell از الگوی تکمیل dynamic کند (`source <(openclaw completion ...)`) استفاده کند، doctor آن را به variant سریع‌ترِ فایل cacheشده ارتقا می‌دهد.
    - اگر تکمیل در profile پیکربندی شده باشد اما فایل cache وجود نداشته باشد، doctor به‌صورت خودکار cache را دوباره تولید می‌کند.
    - اگر هیچ تکمیلی اصلاً پیکربندی نشده باشد، doctor برای نصب آن prompt می‌دهد (فقط حالت interactive؛ با `--non-interactive` نادیده گرفته می‌شود).

    برای تولید دوباره‌ی cache به‌صورت دستی، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (token محلی)">
    Doctor آمادگی احراز هویت token محلی Gateway را بررسی می‌کند.

    - اگر حالت token به token نیاز داشته باشد و هیچ منبع token وجود نداشته باشد، doctor پیشنهاد می‌دهد یکی تولید کند.
    - اگر `gateway.auth.token` با SecretRef مدیریت شود اما در دسترس نباشد، doctor هشدار می‌دهد و آن را با plaintext بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی هیچ SecretRef مربوط به token پیکربندی نشده باشد، تولید را اجبار می‌کند.

  </Accordion>
  <Accordion title="12b. ترمیم‌های read-only آگاه از SecretRef">
    برخی جریان‌های ترمیم باید credentials پیکربندی‌شده را بدون تضعیف رفتار fail-fast در runtime بررسی کنند.

    - `openclaw doctor --fix` اکنون برای ترمیم‌های هدفمند پیکربندی، از همان مدل خلاصه‌ی read-only SecretRef مانند فرمان‌های خانواده‌ی status استفاده می‌کند.
    - مثال: ترمیم `allowFrom` / `groupAllowFrom` مربوط به Telegram `@username` تلاش می‌کند در صورت دسترس بودن، از credentials پیکربندی‌شده‌ی bot استفاده کند.
    - اگر token bot در Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، doctor گزارش می‌کند که credential پیکربندی‌شده اما در دسترس نیست و به‌جای crash کردن یا گزارش نادرست token به‌عنوان missing، auto-resolution را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی مجدد">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی مجدد آن را می‌دهد.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی Memory">
    Doctor بررسی می‌کند که آیا provider مربوط به embedding جست‌وجوی memory پیکربندی‌شده برای agent پیش‌فرض آماده است یا نه. رفتار به backend و provider پیکربندی‌شده بستگی دارد:

    - **QMD backend**: بررسی می‌کند که آیا binary مربوط به `qmd` در دسترس و قابل شروع است یا نه. اگر نباشد، راهنمایی رفع شامل بسته‌ی npm و گزینه‌ی مسیر binary دستی را چاپ می‌کند.
    - **provider محلی صریح**: وجود یک فایل مدل محلی یا URL مدل remote/downloadable شناخته‌شده را بررسی می‌کند. اگر وجود نداشته باشد، پیشنهاد تغییر به یک provider remote را می‌دهد.
    - **provider remote صریح** (`openai`، `voyage`، و غیره): تأیید می‌کند که یک API key در محیط یا auth store وجود دارد. اگر گم شده باشد، hintهای رفع قابل اقدام چاپ می‌کند.
    - **provider خودکار**: ابتدا دسترس‌پذیری مدل محلی را بررسی می‌کند، سپس هر provider remote را به‌ترتیب auto-selection امتحان می‌کند.

    وقتی نتیجه‌ی cached مربوط به probe در Gateway در دسترس باشد (Gateway در زمان بررسی سالم بوده است)، doctor نتیجه‌ی آن را با پیکربندی قابل مشاهده برای CLI تطبیق می‌دهد و هر discrepancy را یادداشت می‌کند. Doctor در مسیر پیش‌فرض یک embedding ping تازه شروع نمی‌کند؛ وقتی بررسی زنده‌ی provider می‌خواهید، از فرمان deep memory status استفاده کنید.

    برای تأیید آمادگی embedding در runtime، `openclaw memory status --deep` را استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌کند.
  </Accordion>
  <Accordion title="15. audit و ترمیم پیکربندی Supervisor">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های گم‌شده یا قدیمی بررسی می‌کند (مثلاً وابستگی‌های systemd network-online و تأخیر restart). وقتی mismatch پیدا کند، یک update را توصیه می‌کند و می‌تواند فایل service/task را با پیش‌فرض‌های فعلی دوباره بنویسد.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی سرپرست درخواست تأیید می‌کند.
    - `openclaw doctor --yes` درخواست‌های تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` اصلاحات پیشنهادی را بدون درخواست تأیید اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های سفارشی سرپرست را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` دستور doctor را برای چرخهٔ عمر سرویس Gateway فقط-خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌کند و تعمیرهای غیرسرویسی را اجرا می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس، بازنویسی‌های پیکربندی سرپرست، و پاک‌سازی سرویس‌های قدیمی را رد می‌کند، چون یک سرپرست خارجی مالک آن چرخهٔ عمر است.
    - در Linux، دستور doctor تا وقتی واحد systemd منطبقِ Gateway فعال است، فرادادهٔ فرمان/نقطهٔ ورود را بازنویسی نمی‌کند. همچنین هنگام پویش سرویس‌های تکراری، واحدهای اضافیِ غیرفعال و غیرقدیمیِ شبیه Gateway را نادیده می‌گیرد تا فایل‌های سرویس همراه باعث نویز پاک‌سازی نشوند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/تعمیر سرویس doctor، SecretRef را اعتبارسنجی می‌کند اما مقادیر متن سادهٔ توکنِ حل‌شده را در فرادادهٔ محیط سرویس سرپرست ذخیره نمی‌کند.
    - دستور doctor مقادیر محیط سرویسِ مدیریت‌شده و مبتنی بر `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd، یا Windows Scheduled Task به‌صورت درون‌خطی جاسازی کرده‌اند شناسایی می‌کند و فرادادهٔ سرویس را بازنویسی می‌کند تا آن مقادیر به‌جای تعریف سرپرست، از منبع زمان اجرا بارگذاری شوند.
    - دستور doctor تشخیص می‌دهد چه زمانی فرمان سرویس پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را ثابت نگه داشته است و فرادادهٔ سرویس را به پورت فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکنِ پیکربندی‌شده حل‌نشده باشد، دستور doctor مسیر نصب/تعمیر را با راهنمایی قابل اقدام مسدود می‌کند.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، دستور doctor نصب/تعمیر را تا زمانی که حالت به‌صورت صریح تنظیم شود مسدود می‌کند.
    - برای واحدهای user-systemd در Linux، بررسی‌های drift توکن در doctor اکنون هنگام مقایسهٔ فرادادهٔ احراز هویت سرویس، هم منابع `Environment=` و هم `EnvironmentFile=` را شامل می‌شود.
    - تعمیرهای سرویس doctor از بازنویسی، توقف، یا راه‌اندازی مجدد یک سرویس Gateway از یک باینری قدیمی‌تر OpenClaw خودداری می‌کنند، وقتی پیکربندی آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="16. زمان اجرای Gateway + عیب‌یابی پورت">
    دستور doctor زمان اجرای سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما واقعاً در حال اجرا نیست هشدار می‌دهد. همچنین تداخل‌های پورت را روی پورت Gateway (پیش‌فرض `18789`) بررسی می‌کند و علت‌های محتمل را گزارش می‌دهد (Gateway از قبل در حال اجرا است، تونل SSH).
  </Accordion>
  <Accordion title="17. بهترین شیوه‌های زمان اجرای Gateway">
    دستور doctor وقتی سرویس Gateway روی Bun یا یک مسیر Node مدیریت‌شده با نسخه‌مدیر (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا می‌شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای نسخه‌مدیر می‌توانند پس از ارتقا خراب شوند، چون سرویس init شل شما را بارگذاری نمی‌کند. دستور doctor پیشنهاد می‌دهد در صورت موجود بودن، به نصب سیستمی Node مهاجرت کنید (Homebrew/apt/choco).

    سرویس‌های تازه نصب‌شده یا تعمیرشده ریشه‌های محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های پایدار user-bin را نگه می‌دارند، اما دایرکتوری‌های fallback حدسیِ نسخه‌مدیر فقط وقتی در PATH سرویس نوشته می‌شوند که آن دایرکتوری‌ها روی دیسک وجود داشته باشند. این کار PATH سرپرست تولیدشده را با همان ممیزی حداقلی PATH که doctor بعداً اجرا می‌کند هم‌راستا نگه می‌دارد.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + فرادادهٔ ویزارد">
    دستور doctor هرگونه تغییر پیکربندی را ذخیره می‌کند و برای ثبت اجرای doctor، فرادادهٔ ویزارد را مهر می‌کند.
  </Accordion>
  <Accordion title="19. نکته‌های فضای کاری (پشتیبان‌گیری + سامانهٔ حافظه)">
    دستور doctor وقتی سامانهٔ حافظهٔ فضای کاری وجود ندارد آن را پیشنهاد می‌دهد و اگر فضای کاری از قبل زیر git نباشد، یک نکتهٔ پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار فضای کاری و پشتیبان‌گیری با git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
