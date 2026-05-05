---
read_when:
    - افزودن یا اصلاح مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'فرمان Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل ترمیم'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-05T01:47:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. این ابزار پیکربندی/وضعیت کهنه را اصلاح می‌کند، سلامت را بررسی می‌کند و گام‌های عملی برای تعمیر ارائه می‌دهد.

## شروع سریع

```bash
openclaw doctor
```

### حالت‌های بدون رابط تعاملی و خودکارسازی

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    پیش‌فرض‌ها را بدون درخواست تأیید بپذیر (از جمله گام‌های تعمیر راه‌اندازی دوباره/سرویس/sandbox در موارد قابل اعمال).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تعمیرهای پیشنهادی را بدون درخواست تأیید اعمال کن (تعمیرها + راه‌اندازی دوباره در موارد امن).

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

    بدون درخواست‌های تعاملی اجرا کن و فقط مهاجرت‌های امن را اعمال کن (نرمال‌سازی پیکربندی + جابه‌جایی وضعیت روی دیسک). اقدامات راه‌اندازی دوباره/سرویس/sandbox را که به تأیید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های اضافی gateway اسکن کن (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید تغییرات را پیش از نوشتن مرور کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## چه کاری انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، رابط کاربری، و به‌روزرسانی‌ها">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل رابط کاربری (وقتی schema پروتکل جدیدتر باشد، Control UI را دوباره می‌سازد).
    - بررسی سلامت + درخواست راه‌اندازی دوباره.
    - خلاصه وضعیت Skills (واجد شرایط/مفقود/مسدود) و وضعیت plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - نرمال‌سازی پیکربندی برای مقدارهای قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای override ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌اندازی OAuth در Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای TLS در OAuth برای پروفایل‌های OAuth متعلق به OpenAI Codex.
    - هشدارهای allowlist مربوط به Plugin/ابزار وقتی `plugins.allow` محدودکننده است اما سیاست ابزار همچنان wildcard یا ابزارهای متعلق به plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/احراز هویت WhatsApp).
    - مهاجرت کلید contract قدیمی manifest مربوط به plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت cron store قدیمی (`jobId`, `schedule.cron`, فیلدهای سطح‌بالای delivery/payload، `provider` در payload، کارهای fallback ساده webhook با `notify: true`).
    - مهاجرت runtime-policy قدیمی agent به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی کهنه plugin وقتی pluginها فعال هستند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های کهنه plugin به‌عنوان پیکربندی containment بی‌اثر در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل قفل session و پاک‌سازی قفل‌های کهنه.
    - تعمیر transcriptهای session برای شاخه‌های تکراری prompt-rewrite که توسط بیلدهای آسیب‌دیده 2026.4.24 ایجاد شده‌اند.
    - شناسایی tombstoneهای restart-recovery برای subagentهای گیرکرده، با پشتیبانی `--fix` برای پاک‌سازی پرچم‌های stale aborted recovery تا startup همچنان child را restart-aborted در نظر نگیرد.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (sessions، transcripts، state dir).
    - بررسی مجوزهای فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای در آستانه انقضا را refresh کند، و وضعیت‌های cooldown/disabled در auth-profile را گزارش می‌دهد.
    - شناسایی workspace dir اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و supervisorها">
    - تعمیر تصویر sandbox وقتی sandboxing فعال است.
    - مهاجرت سرویس قدیمی و شناسایی gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime در Gateway (سرویس نصب شده اما اجرا نمی‌شود؛ label ذخیره‌شده launchd).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا probe می‌شود).
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy تعبیه‌شده برای سرویس‌های Gateway که هنگام نصب یا به‌روزرسانی مقدارهای `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` پوسته را ثبت کرده‌اند.
    - بررسی‌های بهترین‌روش runtime در Gateway (Node در برابر Bun، مسیرهای version-manager).
    - تشخیص تداخل پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="احراز هویت، امنیت، و pairing">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی منبع token وجود ندارد، تولید token را پیشنهاد می‌دهد؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - شناسایی مشکل pairing دستگاه (درخواست‌های pending برای first-time pair، ارتقاهای pending نقش/scope، drift در cache محلی device-token کهنه، و drift احراز هویت paired-record).

  </Accordion>
  <Accordion title="Workspace و پوسته">
    - بررسی systemd linger در Linux.
    - بررسی اندازه فایل bootstrap مربوط به workspace (هشدارهای truncation/نزدیک به حد برای فایل‌های context).
    - بررسی آمادگی Skills برای agent پیش‌فرض؛ skillهای مجاز با bin، env، config، یا نیازمندی‌های OS مفقود را گزارش می‌دهد، و `--fix` می‌تواند skillهای در دسترس نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت shell completion و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding برای جست‌وجوی حافظه (مدل محلی، کلید remote API، یا binary مربوط به QMD).
    - بررسی‌های نصب از source (ناسازگاری pnpm workspace، assetهای UI مفقود، binary مفقود tsx).
    - پیکربندی به‌روزشده + metadata مربوط به wizard را می‌نویسد.

  </Accordion>
</AccordionGroup>

## بازپرکنی و بازنشانی Dreams UI

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset**، و **Clear Grounded** برای گردش‌کار grounded dreaming است. این اقدام‌ها از روش‌های RPC به سبک gateway doctor استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر grounded REM diary را اجرا می‌کند، و ورودی‌های backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان ورودی‌های diary علامت‌گذاری‌شده backfill را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط ورودی‌های کوتاه‌مدت staged و فقط grounded را حذف می‌کند که از بازپخش تاریخی آمده‌اند و هنوز live recall یا daily support انباشته نکرده‌اند.

کاری که به‌خودی‌خود انجام **نمی‌دهند**:

- `MEMORY.md` را ویرایش نمی‌کنند
- مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- candidateهای grounded را به‌طور خودکار در live short-term promotion store stage نمی‌کنند، مگر اینکه ابتدا مسیر staged CLI را صریحاً اجرا کنید

اگر می‌خواهید بازپخش تاریخی grounded بر مسیر عادی deep promotion اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار candidateهای durable و grounded را در short-term dreaming store stage می‌کند، در حالی که `DREAMS.md` را به‌عنوان سطح مرور نگه می‌دارد.

## رفتار دقیق و منطق

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک git checkout باشد و doctor به‌صورت تعاملی اجرا شود، پیشنهاد می‌دهد پیش از اجرای doctor به‌روزرسانی انجام شود (fetch/rebase/build).
  </Accordion>
  <Accordion title="1. نرمال‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override ویژه کانال)، doctor آن‌ها را به schema فعلی نرمال می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی Talk برابر است با `talk.provider` + `talk.providers.<provider>`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را به نقشه ارائه‌دهنده بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` خالی نیست و سیاست ابزار از ورودی‌های
    wildcard یا ابزارهای متعلق به plugin استفاده می‌کند هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهایی
    از pluginهایی match می‌شود که واقعاً load می‌شوند؛ از allowlist انحصاری plugin
    عبور نمی‌کند. Doctor برای پیکربندی‌های allowlist قدیمی مهاجرت‌داده‌شده
    `plugins.bundledDiscovery: "compat"` را می‌نویسد تا رفتار موجود ارائه‌دهنده bundled حفظ شود، و
    سپس به تنظیم سخت‌گیرانه‌تر `"allowlist"` اشاره می‌کند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با schema به‌روزشده بازنویسی می‌کند.

    Gateway نیز هنگام startup، اگر فرمت پیکربندی قدیمی را شناسایی کند، مهاجرت‌های doctor را به‌طور خودکار اجرا می‌کند، بنابراین پیکربندی‌های کهنه بدون دخالت دستی تعمیر می‌شوند. مهاجرت‌های cron job store توسط `openclaw doctor --fix` انجام می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - پیکربندی‌های کانال پیکربندی‌شده که سیاست پاسخ قابل‌مشاهده ندارند → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` سطح بالا
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - میراثی `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - برای کانال‌هایی که `accounts` نام‌دار دارند اما هنوز مقدارهای سطح بالای کانال تک‌حسابی باقی مانده است، آن مقدارهای در محدوده حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند هدف نام‌دار/پیش‌فرض مطابق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای زمان‌انقضای کند provider/model از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم میراثی رله افزونه)
    - میراثی `models.providers.*.api: "openai"` → `"openai-completions"` (هنگام راه‌اندازی Gateway همچنین providerهایی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده است، به‌جای شکست بسته، نادیده می‌گیرد)

    هشدارهای Doctor همچنین شامل راهنمایی پیش‌فرض حساب برای کانال‌های چندحسابی است:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که مسیریابی fallback می‌تواند حساب غیرمنتظره‌ای را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی شناسه حساب ناشناخته تنظیم شده باشد، doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="۲ب. بازنویسی‌های provider در OpenCode">
    اگر `models.providers.opencode`، `opencode-zen` یا `opencode-go` را دستی اضافه کرده باشید، catalog داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این کار می‌تواند مدل‌ها را به API اشتباه اجبار کند یا هزینه‌ها را صفر کند. Doctor هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API به‌ازای هر مدل + هزینه‌ها را بازیابی کنید.
  </Accordion>
  <Accordion title="۲ج. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر افزونه حذف‌شده Chrome اشاره می‌کند، doctor آن را به مدل اتصال Chrome MCP میزبان-محلی فعلی نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    Doctor همچنین هنگام استفاده از `defaultProfile: "user"` یا پروفایل پیکربندی‌شده `existing-session`، مسیر Chrome MCP میزبان-محلی را بررسی می‌کند:

    - بررسی می‌کند که آیا Google Chrome روی همان میزبان برای پروفایل‌های اتصال خودکار پیش‌فرض نصب شده است یا نه
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی کمتر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که اشکال‌زدایی راه‌دور را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging` یا `edge://inspect/#remote-debugging`)

    Doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP میزبان-محلی همچنان به این موارد نیاز دارد:

    - یک مرورگر مبتنی بر Chromium نسخه ۱۴۴+ روی میزبان gateway/node
    - اجرای مرورگر به‌صورت محلی
    - فعال بودن اشکال‌زدایی راه‌دور در آن مرورگر
    - تأیید نخستین درخواست رضایت اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. Existing-session محدودیت‌های مسیر Chrome MCP فعلی را نگه می‌دارد؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود و اقدامات دسته‌ای همچنان به مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser یا دیگر جریان‌های headless اعمال نمی‌شود. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="۲د. پیش‌نیازهای OAuth TLS">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، doctor endpoint مجوزدهی OpenAI را بررسی می‌کند تا تأیید کند پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر بررسی با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده یا گواهی خودامضاشده)، doctor راهنمای رفع مشکل مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولاً `brew postinstall ca-certificates` است. با `--deep`، بررسی حتی اگر gateway سالم باشد اجرا می‌شود.
  </Accordion>
  <Accordion title="۲ه. بازنویسی‌های provider در Codex OAuth">
    اگر قبلاً تنظیمات انتقال میراثی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر داخلی provider در Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند پنهان کنند. Doctor وقتی آن تنظیمات انتقال قدیمی را در کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال کهنه را حذف یا بازنویسی کنید و رفتار مسیریابی/fallback داخلی را برگردانید. پراکسی‌های سفارشی و بازنویسی‌های فقط‌header همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="۲و. هشدارهای مسیر Plugin در Codex">
    وقتی Plugin بسته‌بندی‌شده Codex فعال باشد، doctor همچنین بررسی می‌کند که آیا ارجاع‌های مدل اصلی `openai-codex/*` هنوز از طریق runner پیش‌فرض PI resolve می‌شوند یا نه. وقتی احراز هویت Codex OAuth/subscription را از طریق PI می‌خواهید، این ترکیب معتبر است، اما به‌راحتی با harness بومی app-server در Codex اشتباه گرفته می‌شود. Doctor هشدار می‌دهد و به شکل صریح app-server اشاره می‌کند: `openai/*` به‌علاوه `agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor این مورد را خودکار تعمیر نمی‌کند، چون هر دو مسیر معتبر هستند:

    - `openai-codex/*` + PI یعنی «از احراز هویت Codex OAuth/subscription از طریق runner عادی OpenClaw استفاده کن.»
    - `openai/*` + `agentRuntime.id: "codex"` یعنی «نوبت جاسازی‌شده را از طریق app-server بومی Codex اجرا کن.»
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از chat کنترل یا bind کن.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از adapter خارجی ACP/acpx استفاده کن.»

    اگر هشدار ظاهر شد، مسیری را که قصد داشتید انتخاب کنید و پیکربندی را دستی ویرایش کنید. وقتی PI Codex OAuth عمدی است، هشدار را همان‌طور نگه دارید.

  </Accordion>
  <Accordion title="۲ز. پاک‌سازی مسیر session">
    Doctor همچنین پس از اینکه مدل یا runtime پیش‌فرض/fallback پیکربندی‌شده را از مسیری متعلق به Plugin مانند Codex دور می‌کنید، active sessions store را برای وضعیت مسیر کهنه‌ای که خودکار ساخته شده است اسکن می‌کند.

    `openclaw doctor --fix` می‌تواند وضعیت کهنه خودکارساخته‌شده مانند pinهای مدل `modelOverrideSource: "auto"`، metadata مدل runtime، شناسه‌های pinشده harness، bindingهای session در CLI و بازنویسی‌های خودکار auth-profile را وقتی مسیر مالک آن‌ها دیگر پیکربندی نشده است پاک کند. انتخاب‌های صریح کاربر یا مدل session میراثی برای بازبینی دستی گزارش می‌شوند و دست‌نخورده باقی می‌مانند؛ وقتی آن مسیر دیگر مدنظر نیست، آن‌ها را با `/model ...`، `/new` تغییر دهید یا session را reset کنید.

  </Accordion>
  <Accordion title="۳. مهاجرت‌های وضعیت میراثی (چیدمان دیسک)">
    Doctor می‌تواند چیدمان‌های قدیمی‌تر روی دیسک را به ساختار فعلی مهاجرت دهد:

    - Sessions store + transcriptها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری agent:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از میراثی `~/.openclaw/credentials/*.json` (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها با بهترین تلاش و idempotent هستند؛ وقتی doctor هر پوشه میراثی را به‌عنوان پشتیبان باقی بگذارد، هشدار منتشر می‌کند. Gateway/CLI همچنین در زمان راه‌اندازی، sessions + دایرکتوری agent میراثی را خودکار مهاجرت می‌دهد تا history/auth/models بدون اجرای دستی doctor در مسیر به‌ازای هر agent قرار گیرند. احراز هویت WhatsApp عمداً فقط از طریق `openclaw doctor` مهاجرت می‌شود. نرمال‌سازی provider/provider-map در Talk اکنون با برابری ساختاری مقایسه می‌کند، بنابراین diffهایی که فقط مربوط به ترتیب کلید هستند دیگر تغییرات تکراری بی‌اثر `doctor --fix` را فعال نمی‌کنند.

  </Accordion>
  <Accordion title="۳الف. مهاجرت‌های manifest میراثی Plugin">
    Doctor همه manifestهای Plugin نصب‌شده را برای کلیدهای capability سطح بالای منسوخ (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به شیء `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقدارها را داشته باشد، کلید میراثی بدون تکثیر داده حذف می‌شود.
  </Accordion>
  <Accordion title="۳ب. مهاجرت‌های cron store میراثی">
    Doctor همچنین cron job store را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی بازنویسی شده باشد) برای شکل‌های قدیمی job که scheduler هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی Cron شامل این موارد است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload سطح بالا (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای delivery سطح بالا (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - aliasهای delivery در payload `provider` → `delivery.channel` صریح
    - jobهای fallback webhook میراثی ساده `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    Doctor فقط jobهای `notify: true` را زمانی خودکار مهاجرت می‌دهد که بتواند بدون تغییر رفتار این کار را انجام دهد. اگر یک job، fallback notify میراثی را با حالت delivery غیر-webhook موجود ترکیب کند، doctor هشدار می‌دهد و آن job را برای بازبینی دستی باقی می‌گذارد.

    در Linux، Doctor همچنین زمانی هشدار می‌دهد که crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا می‌کند. این اسکریپت محلی میزبان توسط OpenClaw فعلی نگهداری نمی‌شود و وقتی cron نتواند به گذرگاه کاربر systemd دسترسی پیدا کند، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی قدیمی crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor` و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    Doctor همهٔ دایرکتوری‌های نشست عامل را برای فایل‌های write-lock مانده بررسی می‌کند — فایل‌هایی که وقتی یک نشست به‌صورت غیرعادی خارج شده باقی مانده‌اند. برای هر فایل قفل پیدا‌شده گزارش می‌دهد: مسیر، PID، اینکه PID هنوز زنده است یا نه، سن قفل، و اینکه آیا قدیمی محسوب می‌شود یا نه (PID مرده یا قدیمی‌تر از ۳۰ دقیقه). در حالت `--fix` / `--repair` فایل‌های قفل قدیمی را خودکار حذف می‌کند؛ در غیر این صورت یک یادداشت چاپ می‌کند و از شما می‌خواهد با `--fix` دوباره اجرا کنید.
  </Accordion>
  <Accordion title="3d. ترمیم شاخهٔ رونوشت نشست">
    Doctor فایل‌های JSONL نشست عامل را برای شکل شاخهٔ تکراری ایجادشده توسط باگ بازنویسی رونوشت پرامپت 2026.4.24 بررسی می‌کند: یک نوبت کاربر رهاشده با زمینهٔ runtime داخلی OpenClaw به‌همراه یک همتای فعال که همان پرامپت قابل‌مشاهدهٔ کاربر را دارد. در حالت `--fix` / `--repair`، Doctor از هر فایل آسیب‌دیده کنار فایل اصلی نسخهٔ پشتیبان می‌گیرد و رونوشت را به شاخهٔ فعال بازنویسی می‌کند تا تاریخچهٔ Gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (ماندگاری نشست، مسیریابی، و ایمنی)">
    دایرکتوری وضعیت ساقهٔ مغز عملیاتی است. اگر ناپدید شود، نشست‌ها، اعتبارنامه‌ها، گزارش‌ها، و پیکربندی را از دست می‌دهید (مگر اینکه در جای دیگری نسخهٔ پشتیبان داشته باشید).

    Doctor بررسی می‌کند:

    - **دایرکتوری وضعیت موجود نیست**: دربارهٔ از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای ایجاد دوبارهٔ دایرکتوری درخواست می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: قابلیت نوشتن را بررسی می‌کند؛ پیشنهاد ترمیم مجوزها را می‌دهد (و وقتی ناهماهنگی مالک/گروه شناسایی شود، راهنمایی `chown` صادر می‌کند).
    - **دایرکتوری وضعیت همگام‌شده با ابر در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای مبتنی بر همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت SD یا eMMC در Linux**: وقتی وضعیت به منبع mount از نوع `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی مبتنی بر SD یا eMMC می‌تواند زیر نوشتن‌های نشست و اعتبارنامه کندتر شود و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های نشست موجود نیستند**: `sessions/` و دایرکتوری ذخیره‌گاه نشست برای ماندگار کردن تاریخچه و جلوگیری از crashهای `ENOENT` لازم هستند.
    - **ناهماهنگی رونوشت**: وقتی ورودی‌های نشست اخیر فایل‌های رونوشت مفقود داشته باشند هشدار می‌دهد.
    - **نشست اصلی "JSONL تک‌خطی"**: وقتی رونوشت اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه انباشته نمی‌شود).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشهٔ `~/.openclaw` در دایرکتوری‌های home وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآوری حالت راه دور**: اگر `gateway.mode=remote` باشد، Doctor یادآوری می‌کند که آن را روی میزبان راه دور اجرا کنید (وضعیت آنجا زندگی می‌کند).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/همه قابل خواندن باشد هشدار می‌دهد و پیشنهاد سخت‌کردن آن به `600` را می‌دهد.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در ذخیره‌گاه احراز هویت بررسی می‌کند، وقتی توکن‌ها در حال انقضا/منقضی هستند هشدار می‌دهد، و وقتی امن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل OAuth/token مربوط به Anthropic قدیمی باشد، یک کلید API Anthropic یا مسیر setup-token Anthropic را پیشنهاد می‌کند. درخواست‌های refresh فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی refresh مربوط به OAuth به‌طور دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا ارائه‌دهنده‌ای که به شما می‌گوید دوباره وارد شوید)، Doctor گزارش می‌دهد که احراز هویت دوباره لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های احراز هویتی را گزارش می‌دهد که به‌طور موقت به این دلایل قابل استفاده نیستند:

    - cooldownهای کوتاه (محدودیت نرخ/timeout/شکست‌های احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های صورت‌حساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، Doctor مرجع مدل را در برابر catalog و allowlist اعتبارسنجی می‌کند و وقتی resolve نشود یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. ترمیم تصویر sandbox">
    وقتی sandboxing فعال باشد، Doctor تصویرهای Docker را بررسی می‌کند و اگر تصویر فعلی موجود نباشد پیشنهاد build کردن یا تغییر به نام‌های قدیمی را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    Doctor وضعیت staging وابستگی Plugin تولیدشدهٔ قدیمی OpenClaw را در حالت `openclaw doctor --fix` / `openclaw doctor --repair` حذف می‌کند. این شامل ریشه‌های وابستگی تولیدشدهٔ قدیمی، دایرکتوری‌های مرحلهٔ نصب قدیمی، بقایای محلی package از کد ترمیم وابستگی bundled-plugin قبلی، و کپی‌های npm مدیریت‌شدهٔ orphan یا بازیابی‌شده از Pluginهای bundled `@openclaw/*` است که می‌توانند manifest bundled فعلی را پنهان کنند.

    Doctor همچنین می‌تواند Pluginهای قابل دانلود مفقود را وقتی پیکربندی به آن‌ها ارجاع می‌دهد اما رجیستری Plugin محلی نمی‌تواند آن‌ها را پیدا کند، دوباره نصب کند. نمونه‌ها شامل `plugins.entries` مادی، تنظیمات پیکربندی‌شدهٔ کانال/ارائه‌دهنده/جست‌وجو، و runtimeهای عامل پیکربندی‌شده هستند. هنگام به‌روزرسانی package، Doctor از اجرای ترمیم Plugin توسط package-manager در حالی که package هسته جابه‌جا می‌شود خودداری می‌کند؛ اگر یک Plugin پیکربندی‌شده هنوز به بازیابی نیاز دارد، پس از به‌روزرسانی دوباره `openclaw doctor --fix` را اجرا کنید. راه‌اندازی Gateway و بارگذاری دوبارهٔ پیکربندی package managerها را اجرا نمی‌کنند؛ نصب‌های Plugin همچنان کار صریح doctor/install/update باقی می‌مانند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنمایی‌های پاک‌سازی">
    Doctor سرویس‌های gateway قدیمی (launchd/systemd/schtasks) را شناسایی می‌کند و پیشنهاد حذف آن‌ها و نصب سرویس OpenClaw با پورت gateway فعلی را می‌دهد. همچنین می‌تواند سرویس‌های اضافهٔ شبیه gateway را اسکن کند و راهنمایی‌های پاک‌سازی چاپ کند. سرویس‌های gateway مربوط به OpenClaw که با نام پروفایل هستند، درجه‌یک محسوب می‌شوند و به‌عنوان "اضافی" علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس gateway سطح کاربر موجود نباشد اما یک سرویس gateway سطح سیستم OpenClaw وجود داشته باشد، Doctor سرویس سطح کاربر دومی را به‌صورت خودکار نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس مورد تکراری را حذف کنید یا وقتی یک سرپرست سیستم چرخهٔ عمر gateway را مالک است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Matrix هنگام راه‌اندازی">
    وقتی حساب کانال Matrix یک مهاجرت وضعیت قدیمی در انتظار یا قابل اقدام داشته باشد، Doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس گام‌های مهاجرت best-effort را اجرا می‌کند: مهاجرت وضعیت قدیمی Matrix و آماده‌سازی وضعیت رمزگذاری‌شدهٔ قدیمی. هر دو گام غیرکشنده هستند؛ خطاها ثبت می‌شوند و راه‌اندازی ادامه پیدا می‌کند. در حالت read-only (`openclaw doctor` بدون `--fix`) این بررسی کاملاً رد می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و drift احراز هویت">
    Doctor اکنون وضعیت جفت‌سازی دستگاه را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌دهد:

    - درخواست‌های جفت‌سازی بار اول در انتظار
    - ارتقاهای نقش در انتظار برای دستگاه‌های از قبل جفت‌شده
    - ارتقاهای scope در انتظار برای دستگاه‌های از قبل جفت‌شده
    - ترمیم‌های ناهماهنگی کلید عمومی که در آن‌ها id دستگاه هنوز مطابقت دارد اما هویت دستگاه دیگر با رکورد تأییدشده مطابقت ندارد
    - رکوردهای جفت‌شده‌ای که برای یک نقش تأییدشده توکن فعال ندارند
    - توکن‌های جفت‌شده‌ای که scopeهایشان از baseline جفت‌سازی تأییدشده منحرف شده است
    - ورودی‌های cache محلی device-token برای ماشین فعلی که پیش از چرخش توکن سمت gateway هستند یا metadata scope قدیمی دارند

    Doctor درخواست‌های جفت‌سازی را خودکار تأیید نمی‌کند و توکن‌های دستگاه را خودکار rotate نمی‌کند. در عوض گام‌های بعدی دقیق را چاپ می‌کند:

    - درخواست‌های در انتظار را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک توکن تازه را با `openclaw devices rotate --device <deviceId> --role <role>` rotate کنید
    - یک رکورد قدیمی را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این حفرهٔ رایج "از قبل جفت شده اما هنوز pairing required می‌گیرد" را می‌بندد: Doctor اکنون جفت‌سازی بار اول را از ارتقاهای نقش/scope در انتظار و از drift قدیمی توکن/هویت دستگاه متمایز می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک ارائه‌دهنده بدون allowlist به روی DMها باز باشد، یا وقتی یک policy به روشی خطرناک پیکربندی شده باشد، هشدار صادر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، Doctor اطمینان می‌دهد lingering فعال است تا gateway پس از خروج از سیستم زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (Skills، Pluginها، و دایرکتوری‌های قدیمی)">
    Doctor خلاصه‌ای از وضعیت workspace برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: Skills واجد شرایط، با الزامات مفقود، و مسدودشده توسط allowlist را می‌شمارد.
    - **دایرکتوری‌های workspace قدیمی**: وقتی `~/openclaw` یا دایرکتوری‌های workspace قدیمی دیگر کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای فعال/غیرفعال/خطادار را می‌شمارد؛ برای هر خطا idهای Plugin را فهرست می‌کند؛ قابلیت‌های bundle plugin را گزارش می‌دهد.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را علامت‌گذاری می‌کند که با runtime فعلی مشکل سازگاری دارند.
    - **تشخیص‌های Plugin**: هر هشدار یا خطای زمان بارگذاری صادرشده توسط رجیستری Plugin را نمایان می‌کند.

  </Accordion>
  <Accordion title="11b. اندازهٔ فایل bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا دیگر فایل‌های زمینهٔ تزریق‌شده) نزدیک یا فراتر از بودجهٔ کاراکتر پیکربندی‌شده هستند یا نه. شمارش کاراکتر خام در برابر تزریق‌شده، درصد truncation، علت truncation (`max/file` یا `max/total`)، و مجموع کاراکترهای تزریق‌شده به‌عنوان کسری از بودجهٔ کل را برای هر فایل گزارش می‌دهد. وقتی فایل‌ها truncate شده باشند یا نزدیک حد باشند، Doctor نکته‌هایی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کانال قدیمی">
    وقتی `openclaw doctor --fix` یک Plugin کانال مفقود را حذف می‌کند، پیکربندی dangling محدود به کانال را هم که به آن Plugin ارجاع می‌داد حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های Heartbeat که کانال را نام برده بودند، و overrideهای `agents.*.models["<channel>/*"]`. این کار از حلقه‌های boot Gateway جلوگیری می‌کند که در آن runtime کانال رفته اما پیکربندی هنوز از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند که آیا تکمیل tab برای shell فعلی (zsh، bash، fish، یا PowerShell) نصب شده است یا نه:

    - اگر پروفایل shell از الگوی تکمیل دینامیک کند (`source <(openclaw completion ...)`) استفاده کند، Doctor آن را به گونهٔ فایل cache‌شدهٔ سریع‌تر ارتقا می‌دهد.
    - اگر تکمیل در پروفایل پیکربندی شده باشد اما فایل cache موجود نباشد، Doctor cache را خودکار دوباره تولید می‌کند.
    - اگر هیچ تکمیلی اصلاً پیکربندی نشده باشد، Doctor درخواست نصب آن را می‌دهد (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای تولید دوبارهٔ دستی cache، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (توکن محلی)">
    Doctor آمادگی احراز هویت توکن محلی gateway را بررسی می‌کند.

    - اگر حالت توکن به توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، Doctor پیشنهاد تولید یکی را می‌دهد.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما در دسترس نباشد، Doctor هشدار می‌دهد و آن را با plaintext بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی هیچ SecretRef توکنی پیکربندی نشده باشد، تولید را اجباری می‌کند.

  </Accordion>
  <Accordion title="12b. ترمیم‌های read-only آگاه از SecretRef">
    برخی جریان‌های ترمیم باید اعتبارنامه‌های پیکربندی‌شده را بدون ضعیف کردن رفتار fail-fast زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` اکنون برای تعمیرهای هدفمند پیکربندی از همان مدل خلاصهٔ SecretRef فقط-خواندنی استفاده می‌کند که دستورهای خانوادهٔ status استفاده می‌کنند.
    - مثال: تعمیر Telegram `allowFrom` / `groupAllowFrom` `@username` در صورت وجود، تلاش می‌کند از اعتبارنامه‌های بات پیکربندی‌شده استفاده کند.
    - اگر توکن بات Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر دستور فعلی در دسترس نباشد، doctor گزارش می‌دهد که اعتبارنامه پیکربندی‌شده-اما-ناموجود است و به‌جای خرابی یا گزارش نادرستِ نبودن توکن، حل خودکار را رد می‌کند.

  </Accordion>
  <Accordion title="۱۳. بررسی سلامت Gateway + راه‌اندازی مجدد">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد راه‌اندازی مجدد آن را می‌دهد.
  </Accordion>
  <Accordion title="۱۳ب. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند که آیا ارائه‌دهندهٔ embedding جست‌وجوی حافظهٔ پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و ارائه‌دهندهٔ پیکربندی‌شده بستگی دارد:

    - **backend QMD**: بررسی می‌کند که آیا باینری `qmd` موجود و قابل شروع است یا نه. اگر نباشد، راهنمایی رفع مشکل شامل بستهٔ npm و گزینهٔ مسیر دستی باینری را چاپ می‌کند.
    - **ارائه‌دهندهٔ محلی صریح**: وجود یک فایل مدل محلی یا یک URL مدل راه‌دور/قابل‌دانلودِ شناخته‌شده را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌کند به یک ارائه‌دهندهٔ راه‌دور تغییر دهید.
    - **ارائه‌دهندهٔ راه‌دور صریح** (`openai`، `voyage` و غیره): وجود کلید API در محیط یا ذخیره‌گاه احراز هویت را تأیید می‌کند. اگر موجود نباشد، راهنمایی‌های عملی برای رفع مشکل چاپ می‌کند.
    - **ارائه‌دهندهٔ خودکار**: ابتدا موجود بودن مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهندهٔ راه‌دور را به‌ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی نتیجهٔ probe کش‌شدهٔ Gateway موجود باشد (Gateway در زمان بررسی سالم بوده)، doctor نتیجهٔ آن را با پیکربندی قابل‌مشاهده برای CLI تطبیق می‌دهد و هرگونه ناهمخوانی را یادآوری می‌کند. Doctor در مسیر پیش‌فرض ping تازهٔ embedding را شروع نمی‌کند؛ وقتی بررسی زندهٔ ارائه‌دهنده می‌خواهید، از دستور وضعیت عمیق حافظه استفاده کنید.

    از `openclaw memory status --deep` برای تأیید آمادگی embedding در زمان اجرا استفاده کنید.

  </Accordion>
  <Accordion title="۱۴. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="۱۵. بازرسی + تعمیر پیکربندی supervisor">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های جاافتاده یا قدیمی (برای مثال وابستگی‌های network-online در systemd و تأخیر راه‌اندازی مجدد) بررسی می‌کند. وقتی ناهمخوانی پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل service/task را مطابق پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` promptهای تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های پیشنهادی را بدون prompt اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` برای چرخهٔ حیات سرویس Gateway، doctor را فقط-خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌دهد و تعمیرهای غیرسرویسی را اجرا می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس، بازنویسی پیکربندی supervisor، و پاک‌سازی سرویس قدیمی را رد می‌کند، چون یک supervisor خارجی مالک آن چرخهٔ حیات است.
    - در Linux، تا وقتی unit مطابق Gateway در systemd فعال است، doctor فرادادهٔ command/entrypoint را بازنویسی نمی‌کند. همچنین هنگام اسکن سرویس تکراری، unitهای اضافی غیرفعالِ شبیه Gateway و غیرقدیمی را نادیده می‌گیرد تا فایل‌های سرویس همراه باعث نویز پاک‌سازی نشوند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/تعمیر سرویس doctor، SecretRef را اعتبارسنجی می‌کند اما مقدارهای plaintext توکنِ حل‌شده را در فرادادهٔ محیط سرویس supervisor پایدار نمی‌کند.
    - Doctor مقدارهای محیط سرویس مدیریت‌شدهٔ مبتنی بر `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd، یا Windows Scheduled Task به‌صورت inline جاسازی کرده‌اند شناسایی می‌کند و فرادادهٔ سرویس را بازنویسی می‌کند تا آن مقدارها به‌جای تعریف supervisor از منبع زمان اجرا بارگیری شوند.
    - Doctor تشخیص می‌دهد که دستور سرویس هنوز پس از تغییر `gateway.port` یک `--port` قدیمی را pin کرده است و فرادادهٔ سرویس را به port فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، doctor مسیر نصب/تعمیر را با راهنمایی عملی مسدود می‌کند.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/تعمیر را تا زمانی که mode صریحاً تنظیم شود مسدود می‌کند.
    - برای unitهای user-systemd در Linux، بررسی‌های drift توکن در doctor اکنون هنگام مقایسهٔ فرادادهٔ احراز هویت سرویس، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شود.
    - تعمیرهای سرویس doctor از بازنویسی، توقف، یا راه‌اندازی مجدد سرویس Gateway از یک باینری قدیمی‌تر OpenClaw خودداری می‌کنند، وقتی پیکربندی آخرین بار با نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="۱۶. تشخیص‌های زمان اجرای Gateway + پورت">
    Doctor زمان اجرای سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما واقعاً در حال اجرا نیست، هشدار می‌دهد. همچنین برخوردهای port روی port مربوط به Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل (Gateway از قبل در حال اجراست، SSH tunnel) را گزارش می‌دهد.
  </Accordion>
  <Accordion title="۱۷. بهترین رویه‌های زمان اجرای Gateway">
    Doctor وقتی سرویس Gateway روی Bun یا یک مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای version-manager می‌توانند پس از ارتقا خراب شوند چون سرویس init شل شما را بارگیری نمی‌کند. Doctor پیشنهاد می‌کند در صورت موجود بودن، به نصب سیستمی Node مهاجرت کنید (Homebrew/apt/choco).

    LaunchAgentهای macOS که تازه نصب یا تعمیر شده‌اند، به‌جای کپی کردن PATH شل تعاملی، از یک PATH سیستمی canonical (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین دایرکتوری‌های Volta، asdf، fnm، pnpm و سایر version-managerها اینکه کدام فرایندهای فرزند Node resolve شوند را تغییر نمی‌دهند. سرویس‌های Linux همچنان ریشه‌های محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های user-bin پایدار را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌شدهٔ version-manager فقط وقتی روی دیسک وجود داشته باشند در PATH سرویس نوشته می‌شوند.

  </Accordion>
  <Accordion title="۱۸. نوشتن پیکربندی + فرادادهٔ wizard">
    Doctor هر تغییر پیکربندی را پایدار می‌کند و فرادادهٔ wizard را برای ثبت اجرای doctor مهر می‌زند.
  </Accordion>
  <Accordion title="۱۹. نکته‌های workspace (پشتیبان‌گیری + سامانهٔ حافظه)">
    Doctor وقتی سامانهٔ حافظهٔ workspace موجود نباشد آن را پیشنهاد می‌کند و اگر workspace از قبل زیر git نباشد، یک نکتهٔ پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و پشتیبان‌گیری git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook مربوط به Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
