---
read_when:
    - افزودن یا اصلاح مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'فرمان عیب‌یابی: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل ترمیم'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-02T20:44:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 504cf06e8457315eb1df4970a877b88fdc2e32f34974ce789875373e9e030234
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. پیکربندی/وضعیت قدیمی را اصلاح می‌کند، سلامت را بررسی می‌کند و مراحل تعمیر قابل اقدام ارائه می‌دهد.

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

    پیش‌فرض‌ها را بدون پرسش بپذیرید (از جمله مراحل تعمیر راه‌اندازی مجدد/سرویس/sandbox در صورت کاربرد).

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

    بدون پرسش اجرا کنید و فقط مهاجرت‌های امن را اعمال کنید (نرمال‌سازی پیکربندی + جابه‌جایی‌های وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/sandbox را که به تأیید انسانی نیاز دارند نادیده می‌گیرد. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌صورت خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های Gateway اضافی اسکن کنید (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید تغییرات را پیش از نوشتن بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## چه کاری انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، UI، و به‌روزرسانی‌ها">
    - به‌روزرسانی پیش‌پرواز اختیاری برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل UI (وقتی schema پروتکل جدیدتر باشد، Control UI را بازسازی می‌کند).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/ناموجود/مسدود) و وضعیت Plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - نرمال‌سازی پیکربندی برای مقادیر قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای مسطح قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای override ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌اندازی OAuth در Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OpenAI Codex OAuth.
    - هشدارهای allowlist Plugin/ابزار وقتی `plugins.allow` محدودکننده است اما سیاست ابزار همچنان wildcard یا ابزارهای متعلق به Plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/احراز هویت WhatsApp).
    - مهاجرت کلید contract manifest قدیمی Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت store قدیمی Cron (`jobId`, `schedule.cron`, فیلدهای سطح بالای delivery/payload، payload `provider`، کارهای fallback ساده Webhook با `notify: true`).
    - مهاجرت runtime-policy قدیمی عامل به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی قدیمی Plugin وقتی Pluginها فعال هستند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های قدیمی Plugin به‌عنوان پیکربندی containment غیرفعال در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بررسی فایل lock نشست و پاک‌سازی lockهای قدیمی.
    - تعمیر transcript نشست برای شاخه‌های تکراری بازنویسی prompt که توسط buildهای آسیب‌دیده 2026.4.24 ایجاد شده‌اند.
    - شناسایی tombstone بازیابی-راه‌اندازی مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک کردن پرچم‌های قدیمی بازیابی abort‌شده تا startup همچنان child را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (sessions، transcripts، state dir).
    - بررسی مجوزهای فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای در حال انقضا را refresh کند و وضعیت‌های cooldown/disabled برای auth-profile را گزارش می‌دهد.
    - شناسایی workspace dir اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و supervisorها">
    - تعمیر image مربوط به sandbox وقتی sandboxing فعال است.
    - مهاجرت سرویس قدیمی و شناسایی Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime Gateway (سرویس نصب شده اما در حال اجرا نیست؛ label ذخیره‌شده launchd).
    - هشدارهای وضعیت کانال (بررسی‌شده از Gateway در حال اجرا).
    - audit پیکربندی supervisor (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy تعبیه‌شده برای سرویس‌های Gateway که هنگام نصب یا به‌روزرسانی مقادیر shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را ثبت کرده‌اند.
    - بررسی‌های بهترین‌روش runtime برای Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی تداخل پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="احراز هویت، امنیت، و جفت‌سازی">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی هیچ منبع token وجود ندارد، تولید token را پیشنهاد می‌دهد؛ پیکربندی‌های SecretRef مربوط به token را بازنویسی نمی‌کند).
    - شناسایی مشکل جفت‌سازی دستگاه (درخواست‌های جفت‌سازی اولین‌بار در انتظار، ارتقاهای role/scope در انتظار، drift قدیمی cache محلی device-token، و drift احراز هویت رکورد جفت‌شده).

  </Accordion>
  <Accordion title="Workspace و shell">
    - بررسی linger مربوط به systemd در Linux.
    - بررسی اندازه فایل bootstrap workspace (هشدارهای truncate/نزدیک به حد برای فایل‌های context).
    - بررسی آمادگی Skills برای عامل پیش‌فرض؛ skillهای مجاز با bin، env، config، یا نیازمندی‌های OS ناموجود را گزارش می‌دهد، و `--fix` می‌تواند skillهای unavailable را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت shell completion و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding برای جست‌وجوی حافظه (مدل محلی، API key راه‌دور، یا binary مربوط به QMD).
    - بررسی‌های نصب از سورس (ناهماهنگی pnpm workspace، assets ناموجود UI، binary ناموجود tsx).
    - پیکربندی به‌روزشده + metadata مربوط به wizard را می‌نویسد.

  </Accordion>
</AccordionGroup>

## backfill و reset در UI مربوط به Dreams

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset**، و **Clear Grounded** برای گردش‌کار dreaming grounded است. این اقدام‌ها از روش‌های RPC به سبک doctor در Gateway استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر grounded REM diary را اجرا می‌کند، و entryهای backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان entryهای diary نشانه‌گذاری‌شده backfill را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط entryهای کوتاه‌مدت staged و فقط-grounded را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز live recall یا پشتیبانی روزانه انباشته نکرده‌اند.

کاری که خودشان انجام **نمی‌دهند**:

- `MEMORY.md` را ویرایش نمی‌کنند
- مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- کاندیداهای grounded را به‌صورت خودکار وارد store زنده promotion کوتاه‌مدت نمی‌کنند، مگر اینکه ابتدا مسیر staged CLI را صریحاً اجرا کنید

اگر می‌خواهید replay تاریخی grounded بر مسیر عادی deep promotion اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار کاندیداهای grounded durable را وارد store کوتاه‌مدت dreaming می‌کند، در حالی که `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار و منطق تفصیلی

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. نرمال‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override ویژه کانال)، doctor آن‌ها را به schema فعلی نرمال می‌کند.

    این شامل فیلدهای مسطح قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی Talk برابر است با `talk.provider` + `talk.providers.<provider>`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را در map ارائه‌دهنده بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` خالی نیست و سیاست ابزار از
    entryهای wildcard یا ابزارهای متعلق به Plugin استفاده می‌کند هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهای
    Pluginهایی match می‌شود که واقعاً load می‌شوند؛ از allowlist اختصاصی Plugin
    عبور نمی‌کند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای deprecated باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با schema به‌روزشده بازنویسی می‌کند.

    Gateway نیز وقتی هنگام startup قالب پیکربندی قدیمی را شناسایی کند، مهاجرت‌های doctor را به‌صورت خودکار اجرا می‌کند، بنابراین پیکربندی‌های قدیمی بدون مداخله دستی تعمیر می‌شوند. مهاجرت‌های store مربوط به jobهای Cron توسط `openclaw doctor --fix` انجام می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` در سطح بالا
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` میراثی → `talk.provider` + `talk.providers.<provider>`
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
    - برای کانال‌هایی که `accounts` نام‌دار دارند اما مقدارهای کانال تک‌حسابی در سطح بالا هنوز باقی مانده‌اند، آن مقدارهای محدود به حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک هدف نام‌دار/پیش‌فرض مطابقِ موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای مهلت‌های زمانی کندِ ارائه‌دهنده/مدل از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم میراثی رله افزونه)
    - `models.providers.*.api: "openai"` میراثی → `"openai-completions"` (هنگام راه‌اندازی Gateway نیز، به‌جای شکست محافظه‌کارانه، ارائه‌دهنده‌هایی که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده باشد نادیده گرفته می‌شوند)

    هشدارهای عیب‌یابی همچنین راهنمای حساب پیش‌فرض را برای کانال‌های چندحسابی شامل می‌شوند:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، عیب‌یاب هشدار می‌دهد که مسیریابی جایگزین می‌تواند حسابی غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی شناسه حساب ناشناخته تنظیم شده باشد، عیب‌یاب هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های ارائه‌دهنده OpenCode">
    اگر `models.providers.opencode`، `opencode-zen` یا `opencode-go` را دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این کار می‌تواند مدل‌ها را به API اشتباه مجبور کند یا هزینه‌ها را صفر کند. عیب‌یاب هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API و هزینه‌ها به‌ازای هر مدل را بازگردانید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر حذف‌شده افزونه Chrome اشاره می‌کند، عیب‌یاب آن را به مدل فعلی اتصال Chrome MCP محلیِ میزبان نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    عیب‌یاب همچنین وقتی از `defaultProfile: "user"` یا یک پروفایل `existing-session` پیکربندی‌شده استفاده می‌کنید، مسیر Chrome MCP محلیِ میزبان را بازبینی می‌کند:

    - بررسی می‌کند که آیا Google Chrome برای پروفایل‌های اتصال خودکار پیش‌فرض روی همان میزبان نصب شده است
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که اشکال‌زدایی راه‌دور را در صفحه بازرسی مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging` یا `edge://inspect/#remote-debugging`)

    عیب‌یاب نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلیِ میزبان همچنان به این موارد نیاز دارد:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان Gateway/Node
    - اجرای مرورگر به‌صورت محلی
    - فعال بودن اشکال‌زدایی راه‌دور در آن مرورگر
    - تأیید اولین اعلان رضایت برای اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. existing-session محدودیت‌های فعلی مسیر Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته‌ای مانند `responsebody`، خروجی PDF، رهگیری دانلود و اقدام‌های دسته‌ای همچنان به مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند.

    این بررسی روی Docker، سندباکس، مرورگر راه‌دور یا دیگر جریان‌های بی‌سر اعمال **نمی‌شود**. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای OAuth TLS">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، عیب‌یاب نقطه پایانی مجوزدهی OpenAI را آزمایش می‌کند تا بررسی کند که پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر آزمایش با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده یا گواهی خودامضاشده)، عیب‌یاب راهنمای رفع مشکل مختص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولاً `brew postinstall ca-certificates` است. با `--deep`، این آزمایش حتی اگر Gateway سالم باشد نیز اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های ارائه‌دهنده OAuth Codex">
    اگر قبلاً تنظیمات انتقال میراثی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، آن‌ها می‌توانند مسیر ارائه‌دهنده داخلی Codex OAuth را که نسخه‌های جدیدتر به‌طور خودکار استفاده می‌کنند پوشش دهند. عیب‌یاب وقتی آن تنظیمات انتقال قدیمی را در کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال کهنه را حذف یا بازنویسی کنید و رفتار داخلی مسیریابی/جایگزینی را برگردانید. پراکسی‌های سفارشی و بازنویسی‌هایی که فقط سربرگ را تغییر می‌دهند همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. هشدارهای مسیر Plugin Codex">
    وقتی Plugin همراه Codex فعال باشد، عیب‌یاب همچنین بررسی می‌کند که آیا ارجاع‌های مدل اصلی `openai-codex/*` هنوز از طریق اجراکننده پیش‌فرض PI حل می‌شوند یا نه. این ترکیب وقتی معتبر است که احراز هویت Codex OAuth/اشتراک را از طریق PI بخواهید، اما به‌راحتی با چارچوب native Codex app-server اشتباه گرفته می‌شود. عیب‌یاب هشدار می‌دهد و به شکل صریح app-server اشاره می‌کند: `openai/*` به‌همراه `agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex`.

    عیب‌یاب این مورد را خودکار ترمیم نمی‌کند، چون هر دو مسیر معتبر هستند:

    - `openai-codex/*` + PI یعنی «از احراز هویت Codex OAuth/اشتراک از طریق اجراکننده معمول OpenClaw استفاده کن.»
    - `openai/*` + `agentRuntime.id: "codex"` یعنی «نوبت تعبیه‌شده را از طریق native Codex app-server اجرا کن.»
    - `/codex ...` یعنی «یک گفت‌وگوی native Codex را از چت کنترل یا bind کن.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از آداپتور خارجی ACP/acpx استفاده کن.»

    اگر هشدار ظاهر شد، مسیری را که قصد داشتید انتخاب کنید و پیکربندی را دستی ویرایش کنید. وقتی PI Codex OAuth عمدی است، هشدار را همان‌طور نگه دارید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت میراثی (چیدمان دیسک)">
    عیب‌یاب می‌تواند چیدمان‌های قدیمی روی دیسک را به ساختار فعلی مهاجرت دهد:

    - ذخیره‌گاه نشست‌ها + رونوشت‌ها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری عامل:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` میراثی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها بر پایه بهترین تلاش و تکرارپذیر بی‌اثر هستند؛ عیب‌یاب وقتی هر پوشه میراثی را به‌عنوان پشتیبان باقی بگذارد هشدار صادر می‌کند. Gateway/CLI همچنین نشست‌های میراثی + دایرکتوری عامل را هنگام راه‌اندازی خودکار مهاجرت می‌دهد تا تاریخچه/احراز هویت/مدل‌ها بدون اجرای دستی عیب‌یاب در مسیر به‌ازای هر عامل قرار بگیرند. احراز هویت WhatsApp عمداً فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. نرمال‌سازی ارائه‌دهنده/نقشه ارائه‌دهنده گفتار اکنون با برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌هایی که فقط ناشی از ترتیب کلیدها هستند دیگر تغییرات تکراری بی‌اثر `doctor --fix` را فعال نمی‌کنند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های مانیفست Plugin میراثی">
    عیب‌یاب همه مانیفست‌های Plugin نصب‌شده را برای کلیدهای قابلیت منسوخ در سطح بالا (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به شیء `contracts` منتقل کند و فایل مانیفست را درجا بازنویسی کند. این مهاجرت تکرارپذیر بی‌اثر است؛ اگر کلید `contracts` از قبل همان مقدارها را داشته باشد، کلید میراثی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های ذخیره‌گاه Cron میراثی">
    عیب‌یاب همچنین ذخیره‌گاه کارهای Cron (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی بازنویسی شده باشد) را برای قالب‌های قدیمی کار که زمان‌بند هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی Cron شامل این موارد است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای محموله در سطح بالا (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای تحویل در سطح بالا (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - نام‌های مستعار تحویل `provider` در محموله → `delivery.channel` صریح
    - کارهای جایگزین Webhook ساده و میراثی با `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    عیب‌یاب فقط زمانی کارهای `notify: true` را خودکار مهاجرت می‌دهد که بتواند بدون تغییر رفتار این کار را انجام دهد. اگر کاری جایگزین میراثی notify را با یک حالت تحویل غیر Webhook موجود ترکیب کند، عیب‌یاب هشدار می‌دهد و آن کار را برای بازبینی دستی باقی می‌گذارد.

    در Linux، عیب‌یاب همچنین وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` میراثی را فراخوانی کند هشدار می‌دهد. این اسکریپت محلیِ میزبان در OpenClaw فعلی نگهداری نمی‌شود و وقتی Cron نمی‌تواند به باس کاربر systemd دسترسی پیدا کند، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی کهنه crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor` و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    پزشک، هر دایرکتوری نشست عامل را برای فایل‌های قفل نوشتن مانده اسکن می‌کند — فایل‌هایی که وقتی یک نشست به‌صورت غیرعادی خارج شده، باقی مانده‌اند. برای هر فایل قفل پیدا شده این موارد را گزارش می‌کند: مسیر، PID، اینکه PID هنوز زنده است یا نه، سن قفل، و اینکه کهنه محسوب می‌شود یا نه (PID مرده یا قدیمی‌تر از ۳۰ دقیقه). در حالت `--fix` / `--repair` فایل‌های قفل کهنه را به‌طور خودکار حذف می‌کند؛ در غیر این صورت یک یادداشت چاپ می‌کند و به شما می‌گوید دوباره با `--fix` اجرا کنید.
  </Accordion>
  <Accordion title="3d. ترمیم شاخه رونوشت نشست">
    پزشک، فایل‌های JSONL نشست عامل را برای شکل شاخه تکراری ایجادشده توسط اشکال بازنویسی رونوشت پرامپت 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با زمینه زمان‌اجرای داخلی OpenClaw به‌همراه یک همزاد فعال که همان پرامپت قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، پزشک از هر فایل متأثر در کنار نسخه اصلی پشتیبان می‌گیرد و رونوشت را به شاخه فعال بازنویسی می‌کند تا تاریخچه Gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (ماندگاری نشست، مسیریابی، و ایمنی)">
    دایرکتوری وضعیت، ساقه مغز عملیاتی است. اگر ناپدید شود، نشست‌ها، اعتبارنامه‌ها، گزارش‌ها، و پیکربندی را از دست می‌دهید (مگر اینکه جای دیگری پشتیبان داشته باشید).

    پزشک بررسی می‌کند:

    - **دایرکتوری وضعیت وجود ندارد**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای ایجاد دوباره دایرکتوری درخواست تأیید می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: قابلیت نوشتن را بررسی می‌کند؛ پیشنهاد ترمیم مجوزها را می‌دهد (و وقتی ناسازگاری مالک/گروه تشخیص داده شود، یک راهنمای `chown` صادر می‌کند).
    - **دایرکتوری وضعیت همگام‌شده با ابر در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` حل شود هشدار می‌دهد، چون مسیرهای متکی به همگام‌سازی می‌توانند باعث ورودی/خروجی کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت SD یا eMMC در Linux**: وقتی وضعیت به منبع mount از نوع `mmcblk*` حل شود هشدار می‌دهد، چون ورودی/خروجی تصادفی متکی به SD یا eMMC می‌تواند زیر نوشتن نشست و اعتبارنامه کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های نشست وجود ندارند**: `sessions/` و دایرکتوری ذخیره‌گاه نشست برای ماندگار کردن تاریخچه و جلوگیری از خرابی‌های `ENOENT` لازم هستند.
    - **ناسازگاری رونوشت**: وقتی ورودی‌های نشست اخیر فایل‌های رونوشت گمشده داشته باشند هشدار می‌دهد.
    - **نشست اصلی «JSONL یک‌خطی»**: وقتی رونوشت اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه در حال انباشته‌شدن نیست).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های خانه وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآور حالت راه‌دور**: اگر `gateway.mode=remote` باشد، پزشک یادآوری می‌کند آن را روی میزبان راه‌دور اجرا کنید (وضعیت آنجا قرار دارد).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/همه قابل خواندن باشد هشدار می‌دهد و پیشنهاد می‌کند آن را به `600` سخت‌گیرانه‌تر کند.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    پزشک پروفایل‌های OAuth را در ذخیره‌گاه احراز هویت بررسی می‌کند، وقتی توکن‌ها در حال انقضا/منقضی باشند هشدار می‌دهد، و وقتی ایمن باشد می‌تواند آن‌ها را تازه‌سازی کند. اگر پروفایل OAuth/توکن Anthropic کهنه باشد، یک کلید API Anthropic یا مسیر توکن راه‌اندازی Anthropic را پیشنهاد می‌کند. درخواست‌های تازه‌سازی فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های تازه‌سازی را رد می‌کند.

    وقتی تازه‌سازی OAuth به‌طور دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا ارائه‌دهنده‌ای که می‌گوید دوباره وارد شوید)، پزشک گزارش می‌دهد که احراز هویت دوباره لازم است و فرمان دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    پزشک همچنین پروفایل‌های احراز هویتی را گزارش می‌کند که موقتاً به این دلایل غیرقابل استفاده هستند:

    - دوره‌های انتظار کوتاه (محدودیت نرخ/مهلت زمانی/شکست احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های صورت‌حساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل قلاب‌ها">
    اگر `hooks.gmail.model` تنظیم شده باشد، پزشک مرجع مدل را در برابر کاتالوگ و فهرست مجاز اعتبارسنجی می‌کند و وقتی حل نمی‌شود یا مجاز نیست هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. ترمیم تصویر سندباکس">
    وقتی سندباکس‌سازی فعال باشد، پزشک تصاویر Docker را بررسی می‌کند و اگر تصویر فعلی وجود نداشته باشد پیشنهاد می‌دهد ساخته شود یا به نام‌های قدیمی تغییر کند.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    پزشک در حالت `openclaw doctor --fix` / `openclaw doctor --repair` وضعیت مرحله‌بندی وابستگی Plugin قدیمی تولیدشده توسط OpenClaw را حذف می‌کند. این شامل ریشه‌های وابستگی تولیدشده کهنه، دایرکتوری‌های مرحله نصب قدیمی، و بقایای محلی بسته از کد ترمیم وابستگی Pluginهای بسته‌بندی‌شده قبلی است.

    پزشک همچنین می‌تواند Pluginهای قابل دانلود پیکربندی‌شده را وقتی پیکربندی به آن‌ها ارجاع می‌دهد اما رجیستری Plugin محلی نمی‌تواند آن‌ها را پیدا کند، دوباره نصب کند. برای بیرونی‌سازی Plugin بسته‌بندی‌شده 2026.5.2، پزشک به‌طور خودکار Pluginهای قابل دانلودی را نصب می‌کند که پیکربندی موجود از قبل استفاده می‌کند و سپس به `meta.lastTouchedVersion` تکیه می‌کند تا آن گذر انتشار فقط یک بار اجرا شود. راه‌اندازی Gateway و بارگذاری دوباره پیکربندی، مدیرهای بسته را اجرا نمی‌کنند؛ نصب Pluginها همچنان کار صریح پزشک/نصب/به‌روزرسانی باقی می‌ماند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنماهای پاک‌سازی">
    پزشک سرویس‌های قدیمی Gateway (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد می‌کند آن‌ها را حذف کرده و سرویس OpenClaw را با پورت فعلی Gateway نصب کند. همچنین می‌تواند سرویس‌های اضافی شبیه Gateway را اسکن کند و راهنماهای پاک‌سازی چاپ کند. سرویس‌های Gateway OpenClaw با نام پروفایل، درجه‌اول محسوب می‌شوند و به‌عنوان «اضافی» علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس Gateway سطح کاربر وجود نداشته باشد اما یک سرویس Gateway سطح سیستم OpenClaw وجود داشته باشد، پزشک به‌طور خودکار سرویس سطح کاربر دوم نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس نسخه تکراری را حذف کنید یا وقتی یک ناظر سیستم چرخه عمر Gateway را مالک است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Matrix در راه‌اندازی">
    وقتی حساب کانال Matrix یک مهاجرت وضعیت قدیمی در انتظار یا قابل اقدام داشته باشد، پزشک (در حالت `--fix` / `--repair`) یک عکس‌برداری پیش از مهاجرت ایجاد می‌کند و سپس مراحل مهاجرت با بهترین تلاش را اجرا می‌کند: مهاجرت وضعیت Matrix قدیمی و آماده‌سازی وضعیت رمزنگاری‌شده قدیمی. هر دو مرحله غیرکشنده هستند؛ خطاها ثبت می‌شوند و راه‌اندازی ادامه می‌یابد. در حالت فقط‌خواندنی (`openclaw doctor` بدون `--fix`) این بررسی کاملاً رد می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و انحراف احراز هویت">
    پزشک اکنون وضعیت جفت‌سازی دستگاه را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌کند:

    - درخواست‌های جفت‌سازی بار اول در انتظار
    - ارتقاهای نقش در انتظار برای دستگاه‌هایی که قبلاً جفت شده‌اند
    - ارتقاهای دامنه در انتظار برای دستگاه‌هایی که قبلاً جفت شده‌اند
    - ترمیم‌های ناسازگاری کلید عمومی که شناسه دستگاه هنوز مطابقت دارد اما هویت دستگاه دیگر با رکورد تأییدشده مطابقت ندارد
    - رکوردهای جفت‌شده‌ای که برای یک نقش تأییدشده توکن فعال ندارند
    - توکن‌های جفت‌شده‌ای که دامنه‌هایشان از مبنای جفت‌سازی تأییدشده منحرف شده است
    - ورودی‌های محلی کش‌شده توکن دستگاه برای ماشین فعلی که پیش از چرخش توکن سمت Gateway بوده‌اند یا فراداده دامنه کهنه دارند

    پزشک درخواست‌های جفت‌سازی را به‌طور خودکار تأیید نمی‌کند یا توکن‌های دستگاه را به‌طور خودکار نمی‌چرخاند. در عوض مراحل بعدی دقیق را چاپ می‌کند:

    - درخواست‌های در انتظار را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک توکن تازه را با `openclaw devices rotate --device <deviceId> --role <role>` بچرخانید
    - یک رکورد کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این شکاف رایج «قبلاً جفت شده اما هنوز خطای نیاز به جفت‌سازی می‌گیرد» را می‌بندد: پزشک اکنون جفت‌سازی بار اول را از ارتقاهای نقش/دامنه در انتظار و از انحراف توکن/هویت دستگاه کهنه متمایز می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    پزشک وقتی یک ارائه‌دهنده بدون فهرست مجاز به پیام‌های مستقیم باز باشد، یا وقتی یک سیاست به شکل خطرناک پیکربندی شده باشد، هشدار صادر می‌کند.
  </Accordion>
  <Accordion title="10. ماندگاری systemd (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، پزشک مطمئن می‌شود lingering فعال است تا gateway پس از خروج از سیستم زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت فضای کاری (Skills، Pluginها، و دایرکتوری‌های قدیمی)">
    پزشک خلاصه‌ای از وضعیت فضای کاری را برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: مهارت‌های واجد شرایط، دارای نیازمندی‌های گمشده، و مسدودشده توسط فهرست مجاز را می‌شمارد.
    - **دایرکتوری‌های فضای کاری قدیمی**: وقتی `~/openclaw` یا دایرکتوری‌های فضای کاری قدیمی دیگر در کنار فضای کاری فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای فعال/غیرفعال/خطادار را می‌شمارد؛ شناسه‌های Plugin را برای هر خطا فهرست می‌کند؛ قابلیت‌های Plugin بسته را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را که با زمان‌اجرای فعلی مشکل سازگاری دارند علامت‌گذاری می‌کند.
    - **عیب‌یابی‌های Plugin**: هر هشدار یا خطای زمان بارگذاری صادرشده توسط رجیستری Plugin را نمایش می‌دهد.

  </Accordion>
  <Accordion title="11b. اندازه فایل راه‌انداز">
    پزشک بررسی می‌کند که آیا فایل‌های راه‌انداز فضای کاری (برای مثال `AGENTS.md`، `CLAUDE.md`، یا فایل‌های زمینه تزریق‌شده دیگر) نزدیک یا فراتر از بودجه نویسه پیکربندی‌شده هستند یا نه. برای هر فایل، شمارش نویسه خام در برابر تزریق‌شده، درصد کوتاه‌سازی، علت کوتاه‌سازی (`max/file` یا `max/total`)، و کل نویسه‌های تزریق‌شده را به‌عنوان کسری از کل بودجه گزارش می‌کند. وقتی فایل‌ها کوتاه شده باشند یا نزدیک حد باشند، پزشک نکاتی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کانال کهنه">
    وقتی `openclaw doctor --fix` یک Plugin کانال گمشده را حذف می‌کند، پیکربندی آویزانِ محدود به همان کانال را نیز حذف می‌کند که به آن Plugin ارجاع می‌داد: ورودی‌های `channels.<id>`، هدف‌های heartbeat که نام کانال را برده‌اند، و بازنویسی‌های `agents.*.models["<channel>/*"]`. این از حلقه‌های راه‌اندازی Gateway جلوگیری می‌کند که در آن زمان‌اجرای کانال از بین رفته اما پیکربندی هنوز از gateway می‌خواهد به آن متصل شود.
  </Accordion>
  <Accordion title="11c. تکمیل پوسته">
    پزشک بررسی می‌کند که آیا تکمیل با کلید Tab برای پوسته فعلی نصب شده است یا نه (zsh، bash، fish، یا PowerShell):

    - اگر پروفایل پوسته از الگوی تکمیل پویای کند (`source <(openclaw completion ...)`) استفاده کند، پزشک آن را به نوع فایل کش‌شده سریع‌تر ارتقا می‌دهد.
    - اگر تکمیل در پروفایل پیکربندی شده باشد اما فایل کش وجود نداشته باشد، پزشک کش را به‌طور خودکار دوباره تولید می‌کند.
    - اگر هیچ تکمیلی اصلاً پیکربندی نشده باشد، پزشک برای نصب آن درخواست تأیید می‌کند (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای تولید دوباره دستی کش، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (توکن محلی)">
    پزشک آمادگی احراز هویت توکن محلی Gateway را بررسی می‌کند.

    - اگر حالت توکن به توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، پزشک پیشنهاد می‌دهد یکی تولید کند.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما در دسترس نباشد، پزشک هشدار می‌دهد و آن را با متن ساده بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی هیچ SecretRef توکنی پیکربندی نشده باشد، تولید را اجباری می‌کند.

  </Accordion>
  <Accordion title="12b. ترمیم‌های فقط‌خواندنی آگاه از SecretRef">
    بعضی جریان‌های ترمیم باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار شکست سریع زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` اکنون برای ترمیم‌های هدفمند پیکربندی از همان مدل خلاصه فقط‌خواندنی SecretRef مانند فرمان‌های خانواده وضعیت استفاده می‌کند.
    - مثال: ترمیم `allowFrom` / `groupAllowFrom` `@username` در Telegram تلاش می‌کند وقتی اعتبارنامه‌های پیکربندی‌شده ربات در دسترس باشند از آن‌ها استفاده کند.
    - اگر توکن ربات Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر فرمان فعلی در دسترس نباشد، پزشک گزارش می‌دهد که اعتبارنامه پیکربندی‌شده-اما-دردسترس‌نیست و به‌جای خرابی یا گزارش نادرست توکن به‌عنوان گمشده، حل خودکار را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی مجدد">
    دکتر یک بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد می‌دهد آن را راه‌اندازی مجدد کند.
  </Accordion>
  <Accordion title="13b. آمادگی جستجوی حافظه">
    دکتر بررسی می‌کند که آیا ارائه‌دهنده embedding جستجوی حافظه پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و ارائه‌دهنده پیکربندی‌شده بستگی دارد:

    - **backend QMD**: بررسی می‌کند که آیا باینری `qmd` در دسترس و قابل شروع است یا نه. اگر نباشد، راهنمای رفع مشکل شامل بسته npm و یک گزینه مسیر دستی باینری را چاپ می‌کند.
    - **ارائه‌دهنده محلی صریح**: وجود یک فایل مدل محلی یا یک URL مدل راه‌دور/قابل دانلود شناخته‌شده را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌دهد به یک ارائه‌دهنده راه‌دور تغییر دهید.
    - **ارائه‌دهنده راه‌دور صریح** (`openai`، `voyage` و غیره): تأیید می‌کند که یک کلید API در محیط یا مخزن احراز هویت وجود دارد. اگر موجود نباشد، راهنمای رفع مشکل قابل اقدام چاپ می‌کند.
    - **ارائه‌دهنده خودکار**: ابتدا دسترس‌پذیری مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهنده راه‌دور را به ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی یک نتیجه probe ذخیره‌شده Gateway در دسترس باشد (Gateway هنگام بررسی سالم بوده است)، دکتر نتیجه آن را با پیکربندی قابل مشاهده برای CLI تطبیق می‌دهد و هرگونه مغایرت را یادآوری می‌کند. دکتر در مسیر پیش‌فرض یک ping تازه embedding شروع نمی‌کند؛ وقتی بررسی زنده ارائه‌دهنده را می‌خواهید، از فرمان وضعیت عمیق حافظه استفاده کنید.

    از `openclaw memory status --deep` برای تأیید آمادگی embedding در زمان اجرا استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، دکتر یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع مشکل‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. ممیزی + ترمیم پیکربندی Supervisor">
    دکتر پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های گم‌شده یا قدیمی (مثلاً وابستگی‌های network-online در systemd و تأخیر راه‌اندازی مجدد) بررسی می‌کند. وقتی ناسازگاری پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل سرویس/وظیفه را با پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` درخواست‌های ترمیم پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع مشکل‌های توصیه‌شده را بدون درخواست تأیید اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های supervisor سفارشی را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` دکتر را برای چرخه عمر سرویس Gateway فقط-خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌دهد و ترمیم‌های غیرسرویسی را اجرا می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس، بازنویسی‌های پیکربندی supervisor، و پاک‌سازی سرویس legacy را رد می‌کند، زیرا یک supervisor خارجی مالک آن چرخه عمر است.
    - در Linux، دکتر هنگام فعال بودن unit مطابق systemd Gateway، فراداده command/entrypoint را بازنویسی نمی‌کند. همچنین هنگام اسکن سرویس تکراری، unitهای اضافی غیرفعال غیر-legacy شبیه Gateway را نادیده می‌گیرد تا فایل‌های سرویس همراه نویز پاک‌سازی ایجاد نکنند.
    - اگر احراز هویت توکنی به یک توکن نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/ترمیم سرویس دکتر SecretRef را اعتبارسنجی می‌کند اما مقدارهای توکن plaintext حل‌شده را در فراداده محیط سرویس supervisor ماندگار نمی‌کند.
    - دکتر مقدارهای محیط سرویس مدیریت‌شده با `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd، یا Windows Scheduled Task به‌صورت inline جاسازی کرده‌اند تشخیص می‌دهد و فراداده سرویس را بازنویسی می‌کند تا آن مقدارها به‌جای تعریف supervisor از منبع زمان اجرا بار شوند.
    - دکتر تشخیص می‌دهد که فرمان سرویس پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را pin کرده است و فراداده سرویس را به پورت فعلی بازنویسی می‌کند.
    - اگر احراز هویت توکنی به یک توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، دکتر مسیر نصب/ترمیم را با راهنمای قابل اقدام مسدود می‌کند.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، دکتر نصب/ترمیم را تا زمانی که mode به‌صراحت تنظیم شود مسدود می‌کند.
    - برای unitهای user-systemd در Linux، بررسی‌های drift توکن دکتر اکنون هنگام مقایسه فراداده احراز هویت سرویس، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شود.
    - ترمیم‌های سرویس دکتر از بازنویسی، توقف، یا راه‌اندازی مجدد یک سرویس Gateway از باینری قدیمی‌تر OpenClaw خودداری می‌کنند، وقتی پیکربندی آخرین‌بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="16. تشخیص‌های زمان اجرای Gateway + پورت">
    دکتر زمان اجرای سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما واقعاً در حال اجرا نیست، هشدار می‌دهد. همچنین برخوردهای پورت روی پورت Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل (Gateway از قبل در حال اجراست، تونل SSH) را گزارش می‌دهد.
  </Accordion>
  <Accordion title="17. بهترین رویه‌های زمان اجرای Gateway">
    دکتر وقتی سرویس Gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای مدیر نسخه می‌توانند پس از ارتقاها خراب شوند، چون سرویس shell init شما را بار نمی‌کند. دکتر در صورت موجود بودن نصب Node سیستمی (Homebrew/apt/choco)، پیشنهاد می‌دهد به آن مهاجرت کنید.

    LaunchAgentهای macOS که به‌تازگی نصب یا ترمیم شده‌اند، به‌جای کپی کردن PATH شل تعاملی، از یک PATH سیستمی استاندارد (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند؛ بنابراین Volta، asdf، fnm، pnpm، و دیگر پوشه‌های مدیر نسخه، اینکه کدام فرایندهای فرزند Node resolve شوند را تغییر نمی‌دهند. سرویس‌های Linux همچنان ریشه‌های محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و پوشه‌های پایدار user-bin را نگه می‌دارند، اما پوشه‌های fallback حدس‌زده‌شده مدیر نسخه فقط وقتی آن پوشه‌ها روی دیسک وجود داشته باشند در PATH سرویس نوشته می‌شوند.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + فراداده wizard">
    دکتر هر تغییر پیکربندی را ماندگار می‌کند و فراداده wizard را برای ثبت اجرای دکتر مهر می‌کند.
  </Accordion>
  <Accordion title="19. نکته‌های workspace (پشتیبان‌گیری + سامانه حافظه)">
    دکتر وقتی سامانه حافظه workspace وجود نداشته باشد، آن را پیشنهاد می‌دهد و اگر workspace از قبل زیر git نباشد، یک نکته پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و پشتیبان‌گیری با git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
