---
read_when:
    - افزودن یا اصلاح مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل ترمیم'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-04-29T22:51:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347ce9a2f87632292319aa740389dca8763bd26dd398fb0edeb5b70cc16b949a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار ترمیم + مهاجرت برای OpenClaw است. پیکربندی/وضعیت قدیمی را اصلاح می‌کند، سلامت را بررسی می‌کند، و مراحل ترمیم قابل‌اقدام ارائه می‌دهد.

## شروع سریع

```bash
openclaw doctor
```

### حالت‌های بدون واسط و خودکارسازی

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    پذیرش پیش‌فرض‌ها بدون درخواست تأیید (از جمله مراحل راه‌اندازی مجدد/سرویس/ترمیم سندباکس، در صورت کاربرد).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    اعمال ترمیم‌های پیشنهادی بدون درخواست تأیید (ترمیم‌ها + راه‌اندازی‌های مجدد در موارد امن).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    اعمال ترمیم‌های تهاجمی نیز (پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    اجرا بدون درخواست تأیید و فقط اعمال مهاجرت‌های امن (عادی‌سازی پیکربندی + جابه‌جایی وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/سندباکس را که به تأیید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌صورت خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    اسکن سرویس‌های سیستم برای نصب‌های Gateway اضافی (launchd/systemd/schtasks).

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
    - بررسی تازگی پروتکل UI (وقتی schema پروتکل جدیدتر باشد Control UI را بازسازی می‌کند).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/ناموجود/مسدود) و وضعیت plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - عادی‌سازی پیکربندی برای مقادیر قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای بازنویسی ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌اندازی OAuth در Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای TLS برای پروفایل‌های OpenAI Codex OAuth.
    - مهاجرت وضعیت قدیمی روی دیسک (نشست‌ها/دایرکتوری agent/احراز هویت WhatsApp).
    - مهاجرت کلید قرارداد manifest قدیمی plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت store قدیمی cron (`jobId`, `schedule.cron`, فیلدهای سطح‌بالای delivery/payload، payload `provider`، jobهای fallback ساده Webhook با `notify: true`).
    - مهاجرت policy زمان‌اجرای agent قدیمی به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی plugin کهنه وقتی plugins فعال هستند؛ وقتی `plugins.enabled=false`، ارجاع‌های plugin کهنه به‌عنوان پیکربندی containment بی‌اثر در نظر گرفته و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل قفل نشست و پاک‌سازی قفل‌های کهنه.
    - ترمیم transcript نشست برای شاخه‌های تکراری بازنویسی prompt که توسط بیلدهای آسیب‌دیده 2026.4.24 ایجاد شده‌اند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (نشست‌ها، transcriptها، دایرکتوری وضعیت).
    - بررسی مجوزهای فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای در حال انقضا را refresh کند، و وضعیت‌های cooldown/غیرفعال auth-profile را گزارش می‌دهد.
    - شناسایی دایرکتوری workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و supervisorها">
    - ترمیم image سندباکس وقتی سندباکس‌سازی فعال باشد.
    - مهاجرت سرویس قدیمی و شناسایی Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های زمان‌اجرای Gateway (سرویس نصب شده اما در حال اجرا نیست؛ label ذخیره‌شده launchd).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا probe می‌شود).
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) با ترمیم اختیاری.
    - پاک‌سازی محیط proxy تعبیه‌شده برای سرویس‌های Gateway که هنگام نصب یا به‌روزرسانی مقادیر shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را ثبت کرده‌اند.
    - بررسی‌های بهترین‌رویه زمان‌اجرای Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی تداخل پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="احراز هویت، امنیت، و pairing">
    - هشدارهای امنیتی برای policyهای DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی منبع token وجود ندارد تولید token پیشنهاد می‌دهد؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - شناسایی مشکلات pairing دستگاه (درخواست‌های pairing نخستین‌بار در انتظار، ارتقاهای role/scope در انتظار، drift کش token دستگاه محلی کهنه، و drift احراز هویت رکورد paired).

  </Accordion>
  <Accordion title="Workspace و shell">
    - بررسی linger مربوط به systemd روی Linux.
    - بررسی اندازه فایل bootstrap workspace (هشدارهای کوتاه‌شدن/نزدیک‌بودن به حد برای فایل‌های context).
    - بررسی وضعیت تکمیل shell و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding جست‌وجوی حافظه (مدل محلی، کلید API راه‌دور، یا binary مربوط به QMD).
    - بررسی‌های نصب از source (ناهماهنگی workspace مربوط به pnpm، assetهای UI ناموجود، binary مربوط به tsx ناموجود).
    - نوشتن پیکربندی به‌روزشده + metadata مربوط به wizard.

  </Accordion>
</AccordionGroup>

## backfill و reset در UI مربوط به Dreams

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset**، و **Clear Grounded** برای گردش‌کار grounded dreaming است. این اقدام‌ها از متدهای RPC به سبک doctor در Gateway استفاده می‌کنند، اما بخشی از ترمیم/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر grounded REM diary را اجرا می‌کند، و ورودی‌های backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان ورودی‌های diary مربوط به backfill علامت‌گذاری‌شده را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط ورودی‌های کوتاه‌مدت staged و فقط-grounded را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه انباشته نکرده‌اند.

کاری که به‌تنهایی انجام **نمی‌دهند**:

- `MEMORY.md` را ویرایش نمی‌کنند
- مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- نامزدهای grounded را به‌صورت خودکار وارد store مربوط به promotion کوتاه‌مدت زنده نمی‌کنند، مگر اینکه ابتدا مسیر CLI مربوط به staged را صریحاً اجرا کنید

اگر می‌خواهید replay تاریخی grounded روی lane معمول promotion عمیق اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار نامزدهای پایدار grounded را وارد store مربوط به dreaming کوتاه‌مدت می‌کند و در عین حال `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار تفصیلی و منطق

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. عادی‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override اختصاصی کانال)، doctor آن‌ها را به schema فعلی عادی‌سازی می‌کند.

    این شامل فیلدهای تخت Talk قدیمی نیز می‌شود. پیکربندی عمومی فعلی Talk برابر است با `talk.provider` + `talk.providers.<provider>`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را به map ارائه‌دهنده بازنویسی می‌کند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، commandهای دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرت اعمال‌شده را نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با schema به‌روزشده بازنویسی می‌کند.

    Gateway نیز وقتی هنگام startup قالب پیکربندی قدیمی را تشخیص دهد، مهاجرت‌های doctor را به‌صورت خودکار اجرا می‌کند، بنابراین پیکربندی‌های کهنه بدون مداخله دستی ترمیم می‌شوند. مهاجرت‌های store مربوط به jobهای Cron توسط `openclaw doctor --fix` مدیریت می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → top-level `bindings`
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
    - برای کانال‌هایی با `accounts` نام‌دار اما مقادیر کانال سطح‌بالای تک‌حسابی باقی‌مانده، آن مقادیر account-scoped را به حساب promoted انتخاب‌شده برای آن کانال منتقل می‌کند (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک هدف نام‌دار/پیش‌فرض منطبق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - حذف `agents.defaults.llm`؛ برای timeoutهای کند provider/model از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - حذف `browser.relayBindHost` (تنظیم relay قدیمی extension)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (startup مربوط به Gateway همچنین providerهایی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده است، به‌جای شکست بسته رد می‌کند)

    هشدارهای Doctor همچنین شامل راهنمای account-default برای کانال‌های چندحسابی است:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که fallback routing می‌تواند یک حساب غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی یک account ID ناشناخته تنظیم شده باشد، doctor هشدار می‌دهد و account IDهای پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های ارائه‌دهنده OpenCode">
    اگر `models.providers.opencode`، `opencode-zen` یا `opencode-go` را به‌صورت دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این کار می‌تواند مدل‌ها را به API اشتباه وادار کند یا هزینه‌ها را صفر کند. doctor هشدار می‌دهد تا بتوانید این بازنویسی را حذف کنید و مسیریابی API و هزینه‌های مخصوص هر مدل را بازیابی کنید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر حذف‌شده افزونه Chrome اشاره می‌کند، doctor آن را به مدل فعلی اتصال Chrome MCP محلیِ میزبان نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    doctor همچنین هنگام استفاده از `defaultProfile: "user"` یا یک پروفایل پیکربندی‌شده `existing-session`، مسیر Chrome MCP محلیِ میزبان را ممیزی می‌کند:

    - بررسی می‌کند که آیا Google Chrome برای پروفایل‌های پیش‌فرض اتصال خودکار روی همان میزبان نصب شده است یا نه
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و اگر پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که اشکال‌زدایی از راه دور را در صفحه بازرسی مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging` یا `edge://inspect/#remote-debugging`)

    doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلیِ میزبان همچنان به این موارد نیاز دارد:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان gateway/node
    - مرورگر به‌صورت محلی در حال اجرا باشد
    - اشکال‌زدایی از راه دور در آن مرورگر فعال باشد
    - تأیید نخستین درخواست رضایت اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. Existing-session محدودیت‌های فعلی مسیر Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود و اقدامات دسته‌ای همچنان به یک مرورگر مدیریت‌شده یا پروفایل خام CDP نیاز دارند.

    این بررسی برای جریان‌های Docker، sandbox، remote-browser یا دیگر جریان‌های headless اعمال نمی‌شود. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای OAuth TLS">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، doctor نقطه پایانی مجوزدهی OpenAI را بررسی می‌کند تا تأیید کند پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر این بررسی با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده یا گواهی خودامضا)، doctor راهنمای رفع مشکل مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولاً `brew postinstall ca-certificates` است. با `--deep`، حتی اگر Gateway سالم باشد نیز این بررسی اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های ارائه‌دهنده Codex OAuth">
    اگر قبلاً تنظیمات قدیمی انتقال OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر ارائه‌دهنده داخلی Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند پنهان کنند. doctor وقتی آن تنظیمات قدیمی انتقال را در کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال منسوخ را حذف یا بازنویسی کنید و رفتار داخلی مسیریابی/بازگشت را برگردانید. پروکسی‌های سفارشی و بازنویسی‌های فقط هدر همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. هشدارهای مسیر Plugin مربوط به Codex">
    وقتی Plugin بسته‌بندی‌شده Codex فعال باشد، doctor همچنین بررسی می‌کند که آیا ارجاع‌های مدل اصلی `openai-codex/*` هنوز از طریق اجراکننده پیش‌فرض PI حل می‌شوند یا نه. این ترکیب زمانی معتبر است که بخواهید احراز هویت Codex OAuth/اشتراکی را از طریق PI داشته باشید، اما به‌راحتی ممکن است با harness بومی app-server در Codex اشتباه گرفته شود. doctor هشدار می‌دهد و به شکل صریح app-server اشاره می‌کند: `openai/*` به‌همراه `agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex`.

    doctor این مورد را به‌صورت خودکار ترمیم نمی‌کند، چون هر دو مسیر معتبر هستند:

    - `openai-codex/*` + PI یعنی «از احراز هویت Codex OAuth/اشتراکی از طریق اجراکننده معمول OpenClaw استفاده کن.»
    - `openai/*` + `runtime: "codex"` یعنی «turn جاسازی‌شده را از طریق app-server بومی Codex اجرا کن.»
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از چت کنترل یا متصل کن.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از آداپتور خارجی ACP/acpx استفاده کن.»

    اگر هشدار ظاهر شد، مسیری را که مدنظر داشتید انتخاب کنید و پیکربندی را دستی ویرایش کنید. وقتی PI Codex OAuth عمدی است، هشدار را همان‌طور نگه دارید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    doctor می‌تواند چیدمان‌های قدیمی‌تر روی دیسک را به ساختار فعلی مهاجرت دهد:

    - ذخیره‌گاه نشست‌ها + رونوشت‌ها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - پوشه عامل:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از مسیر قدیمی `~/.openclaw/credentials/*.json` (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها بر پایه بهترین تلاش و هم‌توان هستند؛ doctor وقتی هر پوشه قدیمی‌ای را به‌عنوان پشتیبان باقی بگذارد، هشدار صادر می‌کند. Gateway/CLI همچنین هنگام راه‌اندازی، نشست‌های قدیمی + پوشه عامل را به‌طور خودکار مهاجرت می‌دهد تا تاریخچه/احراز هویت/مدل‌ها بدون اجرای دستی doctor در مسیر مختص هر عامل قرار بگیرند. احراز هویت WhatsApp عمدا فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. عادی‌سازی نگاشت ارائه‌دهنده/ارائه‌دهنده گفت‌وگو اکنون با برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌هایی که فقط مربوط به ترتیب کلیدها هستند دیگر باعث تغییرات تکراری و بی‌اثر `doctor --fix` نمی‌شوند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های مانیفست Plugin قدیمی">
    Doctor همه مانیفست‌های Plugin نصب‌شده را برای کلیدهای توانمندی سطح‌بالای منسوخ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) اسکن می‌کند. وقتی چنین کلیدهایی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به شیء `contracts` منتقل کند و فایل مانیفست را درجا بازنویسی کند. این مهاجرت هم‌توان است؛ اگر کلید `contracts` از قبل همان مقادیر را داشته باشد، کلید قدیمی بدون تکثیر داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های ذخیره‌گاه Cron قدیمی">
    Doctor همچنین ذخیره‌گاه کار Cron را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی بازنویسی شده باشد) برای شکل‌های قدیمی کار که زمان‌بند هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی Cron شامل این موارد است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای بار مفید سطح‌بالا (`message`, `model`, `thinking`, ...) → `payload`
    - فیلدهای تحویل سطح‌بالا (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - نام‌های مستعار تحویل `provider` در بار مفید → `delivery.channel` صریح
    - کارهای Webhook fallback قدیمی و ساده `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    Doctor فقط وقتی کارهای `notify: true` را به‌طور خودکار مهاجرت می‌دهد که بتواند بدون تغییر رفتار این کار را انجام دهد. اگر یک کار، notify fallback قدیمی را با یک حالت تحویل غیر Webhook موجود ترکیب کند، doctor هشدار می‌دهد و آن کار را برای بازبینی دستی باقی می‌گذارد.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    Doctor هر پوشه نشست عامل را برای فایل‌های قفل نوشتن کهنه اسکن می‌کند — فایل‌هایی که وقتی یک نشست به‌طور غیرعادی خارج شده باقی مانده‌اند. برای هر فایل قفل پیدا شده، این موارد را گزارش می‌کند: مسیر، PID، اینکه PID هنوز زنده است یا نه، سن قفل، و اینکه کهنه در نظر گرفته می‌شود یا نه (PID مرده یا قدیمی‌تر از ۳۰ دقیقه). در حالت `--fix` / `--repair` فایل‌های قفل کهنه را به‌طور خودکار حذف می‌کند؛ در غیر این صورت یک یادداشت چاپ می‌کند و از شما می‌خواهد با `--fix` دوباره اجرا کنید.
  </Accordion>
  <Accordion title="3d. ترمیم شاخه رونوشت نشست">
    Doctor فایل‌های JSONL نشست عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی رونوشت پرامپت 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با زمینه زمان اجرای داخلی OpenClaw به‌همراه یک هم‌نیا فعال که همان پرامپت قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل متاثر کنار فایل اصلی پشتیبان می‌گیرد و رونوشت را به شاخه فعال بازنویسی می‌کند تا تاریخچه Gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (ماندگاری نشست، مسیریابی، و ایمنی)">
    پوشه وضعیت، ساقه مغز عملیاتی است. اگر ناپدید شود، نشست‌ها، اعتبارنامه‌ها، لاگ‌ها، و پیکربندی را از دست می‌دهید (مگر اینکه جای دیگری پشتیبان داشته باشید).

    Doctor بررسی می‌کند:

    - **پوشه وضعیت وجود ندارد**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای ایجاد دوباره پوشه درخواست تایید می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای پوشه وضعیت**: نوشتنی بودن را بررسی می‌کند؛ پیشنهاد ترمیم مجوزها را می‌دهد (و وقتی ناهماهنگی مالک/گروه تشخیص داده شود، راهنمایی `chown` صادر می‌کند).
    - **پوشه وضعیت همگام‌شده با فضای ابری در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` قرار بگیرد هشدار می‌دهد، چون مسیرهای پشتیبانی‌شده با همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **پوشه وضعیت Linux روی SD یا eMMC**: وقتی وضعیت به یک منبع mount از نوع `mmcblk*` نگاشت شود هشدار می‌دهد، چون I/O تصادفی مبتنی بر SD یا eMMC می‌تواند کندتر باشد و زیر بار نوشتن نشست و اعتبارنامه سریع‌تر فرسوده شود.
    - **پوشه‌های نشست وجود ندارند**: `sessions/` و پوشه ذخیره‌گاه نشست برای ماندگار کردن تاریخچه و جلوگیری از کرش‌های `ENOENT` لازم هستند.
    - **ناهمخوانی رونوشت**: وقتی ورودی‌های اخیر نشست فایل‌های رونوشت گمشده داشته باشند هشدار می‌دهد.
    - **نشست اصلی «JSONL تک‌خطی»**: وقتی رونوشت اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه در حال انباشته شدن نیست).
    - **چند پوشه وضعیت**: وقتی چند پوشه `~/.openclaw` در پوشه‌های home مختلف وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآور حالت remote**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند آن را روی میزبان remote اجرا کنید (وضعیت آنجا قرار دارد).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/عموم خواندنی باشد هشدار می‌دهد و پیشنهاد می‌دهد آن را به `600` محدود کند.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در ذخیره‌گاه احراز هویت بررسی می‌کند، وقتی توکن‌ها در حال انقضا/منقضی هستند هشدار می‌دهد، و وقتی امن باشد می‌تواند آن‌ها را تازه‌سازی کند. اگر پروفایل OAuth/توکن Anthropic کهنه باشد، یک کلید API Anthropic یا مسیر setup-token Anthropic را پیشنهاد می‌کند. درخواست‌های تازه‌سازی فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های تازه‌سازی را رد می‌کند.

    وقتی تازه‌سازی OAuth به‌صورت دائمی شکست بخورد (برای مثال `refresh_token_reused`, `invalid_grant`، یا وقتی یک ارائه‌دهنده از شما بخواهد دوباره وارد شوید)، doctor گزارش می‌دهد که احراز هویت دوباره لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های احراز هویتی را گزارش می‌کند که به‌طور موقت به این دلایل قابل استفاده نیستند:

    - cooldownهای کوتاه (محدودیت نرخ/timeoutها/شکست‌های احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های صورتحساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor مرجع مدل را در برابر کاتالوگ و allowlist اعتبارسنجی می‌کند و وقتی قابل resolve نباشد یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. ترمیم تصویر sandbox">
    وقتی sandboxing فعال باشد، doctor تصویرهای Docker را بررسی می‌کند و اگر تصویر فعلی وجود نداشته باشد پیشنهاد می‌دهد آن را بسازد یا به نام‌های قدیمی تغییر دهد.
  </Accordion>
  <Accordion title="7b. وابستگی‌های زمان اجرای Pluginهای همراه">
    Doctor وابستگی‌های زمان اجرا را فقط برای Pluginهای همراهی بررسی می‌کند که در پیکربندی فعلی فعال هستند یا توسط پیش‌فرض مانیفست همراه خود فعال شده‌اند، برای مثال `plugins.entries.discord.enabled: true`، `channels.discord.enabled: true` قدیمی، یا یک ارائه‌دهنده همراه که به‌صورت پیش‌فرض فعال است. اگر چیزی کم باشد، doctor بسته‌ها را گزارش می‌کند و در حالت `openclaw doctor --fix` / `openclaw doctor --repair` آن‌ها را نصب می‌کند. Pluginهای خارجی همچنان از `openclaw plugins install` / `openclaw plugins update` استفاده می‌کنند؛ doctor وابستگی‌های مسیرهای دلخواه Plugin را نصب نمی‌کند.

    During تعمیر doctor، نصب‌های npm وابستگی‌های زمان اجرای همراه، در نشست‌های TTY پیشرفت spinner و در خروجی لوله‌شده/بدون‌سر، پیشرفت خطی دوره‌ای گزارش می‌کنند. Gateway و CLI محلی نیز می‌توانند وابستگی‌های زمان اجرای Pluginهای همراه فعال را پیش از import کردن یک Plugin همراه، بر اساس تقاضا تعمیر کنند. دامنه این نصب‌ها به ریشه نصب زمان اجرای Plugin محدود است، با scripts غیرفعال اجرا می‌شوند، package lock نمی‌نویسند، و با یک قفل ریشه نصب محافظت می‌شوند تا شروع‌های هم‌زمان CLI یا Gateway در یک زمان درخت `node_modules` یکسانی را تغییر ندهند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنمایی‌های پاک‌سازی">
    Doctor سرویس‌های gateway قدیمی (launchd/systemd/schtasks) را شناسایی می‌کند و پیشنهاد می‌دهد آن‌ها را حذف کند و سرویس OpenClaw را با پورت gateway فعلی نصب کند. همچنین می‌تواند سرویس‌های اضافه‌ای را که شبیه gateway هستند اسکن کند و راهنمایی‌های پاک‌سازی چاپ کند. سرویس‌های gateway OpenClaw که با نام پروفایل هستند، درجه‌یک محسوب می‌شوند و به‌عنوان «اضافه» علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس gateway سطح کاربر وجود نداشته باشد اما یک سرویس gateway OpenClaw سطح سیستم وجود داشته باشد، doctor به‌طور خودکار سرویس سطح کاربر دومی نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس مورد تکراری را حذف کنید یا وقتی یک supervisor سیستمی مالک چرخه عمر gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Startup Matrix">
    وقتی یک حساب کانال Matrix مهاجرت وضعیت قدیمیِ در انتظار یا قابل اقدام دارد، doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس گام‌های مهاجرت best-effort را اجرا می‌کند: مهاجرت وضعیت قدیمی Matrix و آماده‌سازی وضعیت رمزگذاری‌شده قدیمی. هر دو گام غیرکشنده هستند؛ خطاها log می‌شوند و startup ادامه پیدا می‌کند. در حالت فقط‌خواندنی (`openclaw doctor` بدون `--fix`) این بررسی به‌طور کامل رد می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و انحراف احراز هویت">
    Doctor اکنون وضعیت جفت‌سازی دستگاه را به‌عنوان بخشی از گذر سلامت معمول بررسی می‌کند.

    آنچه گزارش می‌کند:

    - درخواست‌های جفت‌سازی بار اولِ در انتظار
    - ارتقاهای نقش در انتظار برای دستگاه‌هایی که از قبل جفت شده‌اند
    - ارتقاهای scope در انتظار برای دستگاه‌هایی که از قبل جفت شده‌اند
    - تعمیرهای عدم تطابق کلید عمومی، وقتی id دستگاه هنوز تطابق دارد اما هویت دستگاه دیگر با رکورد تأییدشده تطابق ندارد
    - رکوردهای جفت‌شده‌ای که برای یک نقش تأییدشده token فعال ندارند
    - tokenهای جفت‌شده‌ای که scopeهایشان از baseline جفت‌سازی تأییدشده منحرف شده است
    - ورودی‌های cache محلی device-token برای ماشین فعلی که از چرخش token سمت gateway قدیمی‌تر هستند یا metadata scope کهنه دارند

    Doctor درخواست‌های جفت‌سازی را خودکار تأیید نمی‌کند و tokenهای دستگاه را خودکار نمی‌چرخاند. در عوض، گام‌های بعدی دقیق را چاپ می‌کند:

    - درخواست‌های در انتظار را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک token تازه را با `openclaw devices rotate --device <deviceId> --role <role>` بچرخانید
    - یک رکورد کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این شکاف رایج «از قبل جفت شده اما هنوز pairing required می‌گیرد» را می‌بندد: doctor اکنون جفت‌سازی بار اول را از ارتقاهای نقش/scope در انتظار و از انحراف token/هویت دستگاهِ کهنه تفکیک می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک provider بدون allowlist برای DMها باز است، یا وقتی یک policy به شکل خطرناک پیکربندی شده است، هشدار صادر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، doctor اطمینان می‌دهد lingering فعال است تا gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (Skills، Pluginها، و دایرکتوری‌های قدیمی)">
    Doctor خلاصه‌ای از وضعیت workspace را برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: تعداد skillهای واجد شرایط، دارای نیازمندی‌های مفقود، و مسدودشده با allowlist را می‌شمارد.
    - **دایرکتوری‌های workspace قدیمی**: وقتی `~/openclaw` یا دایرکتوری‌های workspace قدیمی دیگر در کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: تعداد Pluginهای فعال/غیرفعال/خطادار را می‌شمارد؛ برای هر خطا idهای Plugin را فهرست می‌کند؛ قابلیت‌های Plugin بسته را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را که با runtime فعلی مشکل سازگاری دارند علامت‌گذاری می‌کند.
    - **تشخیص‌های Plugin**: هر هشدار یا خطای زمان بارگذاری را که registry Plugin صادر کرده باشد نمایش می‌دهد.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا فایل‌های context تزریق‌شده دیگر) نزدیک یا فراتر از بودجه کاراکتری پیکربندی‌شده هستند. برای هر فایل، تعداد کاراکترهای خام در برابر تزریق‌شده، درصد کوتاه‌سازی، علت کوتاه‌سازی (`max/file` یا `max/total`)، و کل کاراکترهای تزریق‌شده را به‌عنوان کسری از کل بودجه گزارش می‌کند. وقتی فایل‌ها کوتاه شده باشند یا نزدیک حد باشند، doctor نکته‌هایی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کانال کهنه">
    وقتی `openclaw doctor --fix` یک Plugin کانال مفقود را حذف می‌کند، config آویزانِ محدود به کانال را که به آن Plugin اشاره می‌کرد نیز حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های Heartbeat که نام کانال را داشتند، و overrideهای `agents.*.models["<channel>/*"]`. این کار از چرخه‌های boot Gateway جلوگیری می‌کند که در آن‌ها runtime کانال حذف شده اما config هنوز از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند که آیا tab completion برای shell فعلی نصب شده است یا نه (zsh، bash، fish، یا PowerShell):

    - اگر profile shell از الگوی completion پویا و کند استفاده کند (`source <(openclaw completion ...)`)، doctor آن را به نوع فایل cache‌شده سریع‌تر ارتقا می‌دهد.
    - اگر completion در profile پیکربندی شده باشد اما فایل cache وجود نداشته باشد، doctor cache را به‌طور خودکار دوباره تولید می‌کند.
    - اگر هیچ completionی اصلاً پیکربندی نشده باشد، doctor درخواست نصب آن را مطرح می‌کند (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای تولید دوباره cache به‌صورت دستی، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (token محلی)">
    Doctor آمادگی احراز هویت token gateway محلی را بررسی می‌کند.

    - اگر حالت token به token نیاز داشته باشد و هیچ منبع token وجود نداشته باشد، doctor پیشنهاد می‌دهد یکی تولید کند.
    - اگر `gateway.auth.token` با SecretRef مدیریت شده باشد اما در دسترس نباشد، doctor هشدار می‌دهد و آن را با متن ساده overwrite نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی هیچ SecretRef برای token پیکربندی نشده باشد تولید را اجبار می‌کند.

  </Accordion>
  <Accordion title="12b. تعمیرهای فقط‌خواندنیِ آگاه از SecretRef">
    برخی جریان‌های تعمیر باید credentialهای پیکربندی‌شده را بدون تضعیف رفتار fail-fast زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` اکنون برای تعمیرهای هدفمند config از همان مدل خلاصه SecretRef فقط‌خواندنی استفاده می‌کند که commandهای خانواده status استفاده می‌کنند.
    - مثال: تعمیر `allowFrom` / `groupAllowFrom` `@username` در Telegram تلاش می‌کند در صورت دسترس بودن از credentialهای bot پیکربندی‌شده استفاده کند.
    - اگر token bot در Telegram از طریق SecretRef پیکربندی شده باشد اما در مسیر command فعلی در دسترس نباشد، doctor گزارش می‌کند که credential پیکربندی‌شده اما در دسترس نیست و به‌جای crash کردن یا گزارش اشتباه token به‌عنوان مفقود، auto-resolution را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + restart">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی gateway ناسالم به نظر برسد، پیشنهاد restart آن را می‌دهد.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند که آیا provider embedding جست‌وجوی حافظه پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و provider پیکربندی‌شده بستگی دارد:

    - **backend QMD**: بررسی می‌کند که آیا باینری `qmd` در دسترس و قابل start است یا نه. اگر نباشد، راهنمای رفع مشکل شامل package npm و گزینه مسیر دستی باینری را چاپ می‌کند.
    - **provider محلی صریح**: وجود یک فایل model محلی یا URL model شناخته‌شده remote/downloadable را بررسی می‌کند. اگر مفقود باشد، پیشنهاد می‌دهد به یک provider remote تغییر دهید.
    - **provider remote صریح** (`openai`، `voyage`، و غیره): تأیید می‌کند که یک API key در environment یا auth store وجود دارد. اگر مفقود باشد، راهنمایی‌های رفع مشکل قابل اقدام چاپ می‌کند.
    - **provider خودکار**: ابتدا در دسترس بودن model محلی را بررسی می‌کند، سپس هر provider remote را به ترتیب auto-selection امتحان می‌کند.

    وقتی نتیجه probe cache‌شده gateway در دسترس باشد (gateway در زمان بررسی سالم بوده)، doctor نتیجه آن را با config قابل مشاهده برای CLI cross-reference می‌کند و هر ناسازگاری را یادداشت می‌کند. Doctor در مسیر پیش‌فرض ping embedding تازه‌ای شروع نمی‌کند؛ وقتی بررسی live provider می‌خواهید، از command وضعیت حافظه عمیق استفاده کنید.

    برای تأیید آمادگی embedding در runtime، `openclaw memory status --deep` را استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر gateway سالم باشد، doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌کند.
  </Accordion>
  <Accordion title="15. ممیزی config supervisor + تعمیر">
    Doctor config نصب‌شده supervisor (launchd/systemd/schtasks) را برای defaultهای مفقود یا قدیمی (مثلاً وابستگی‌های systemd network-online و تأخیر restart) بررسی می‌کند. وقتی mismatch پیدا کند، update را توصیه می‌کند و می‌تواند فایل service/task را به defaultهای فعلی بازنویسی کند.

    یادداشت‌ها:

    - `openclaw doctor` پیش از بازنویسی config supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` promptهای تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های توصیه‌شده را بدون prompt اعمال می‌کند.
    - `openclaw doctor --repair --force` configهای supervisor سفارشی را overwrite می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor را برای چرخه عمر سرویس gateway فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌کند و تعمیرهای غیرسرویسی را اجرا می‌کند، اما نصب/start/restart/bootstrap سرویس، بازنویسی‌های config supervisor، و پاک‌سازی سرویس قدیمی را رد می‌کند، چون یک supervisor خارجی مالک آن چرخه عمر است.
    - در Linux، doctor تا وقتی unit gateway systemd منطبق فعال است، metadata command/entrypoint را بازنویسی نمی‌کند. همچنین هنگام اسکن سرویس تکراری، unitهای اضافه غیرفعالِ غیرقدیمی و شبیه gateway را نادیده می‌گیرد تا فایل‌های سرویس companion نویز پاک‌سازی ایجاد نکنند.
    - اگر احراز هویت token به token نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شده باشد، نصب/تعمیر سرویس doctor، SecretRef را اعتبارسنجی می‌کند اما مقدارهای token متن ساده resolve‌شده را در metadata محیط سرویس supervisor پایدار نمی‌کند.
    - Doctor مقدارهای محیط سرویسِ پشتیبانی‌شده با `.env`/SecretRef مدیریت‌شده را که نصب‌های قدیمی‌تر LaunchAgent، systemd، یا Windows Scheduled Task به‌صورت inline جاسازی کرده‌اند شناسایی می‌کند و metadata سرویس را بازنویسی می‌کند تا آن مقدارها به‌جای تعریف supervisor از منبع runtime بارگذاری شوند.
    - Doctor تشخیص می‌دهد وقتی command سرویس پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را pin کرده است و metadata سرویس را به پورت فعلی بازنویسی می‌کند.
    - اگر احراز هویت token به token نیاز داشته باشد و SecretRef token پیکربندی‌شده resolve نشده باشد، doctor مسیر نصب/تعمیر را با راهنمایی قابل اقدام block می‌کند.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/تعمیر را تا وقتی mode به‌صراحت تنظیم شود block می‌کند.
    - برای unitهای user-systemd در Linux، بررسی‌های انحراف token توسط doctor اکنون هنگام مقایسه metadata احراز هویت سرویس، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شود.
    - تعمیرهای سرویس doctor از بازنویسی، stop، یا restart کردن سرویس gateway از یک باینری قدیمی‌تر OpenClaw خودداری می‌کنند، وقتی config آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید بازنویسی کامل را از طریق `openclaw gateway install --force` اجبار کنید.

  </Accordion>
  <Accordion title="16. زمان اجرای Gateway + تشخیص پورت">
    دکتر زمان اجرای سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما عملاً در حال اجرا نیست هشدار می‌دهد. همچنین برخوردهای پورت روی پورت Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل (Gateway از قبل در حال اجرا است، تونل SSH) را گزارش می‌دهد.
  </Accordion>
  <Accordion title="17. بهترین روش‌های زمان اجرای Gateway">
    دکتر وقتی سرویس Gateway روی Bun یا یک مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا می‌شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای مدیر نسخه ممکن است پس از ارتقاها خراب شوند چون سرویس راه‌انداز پوستهٔ شما را بارگذاری نمی‌کند. دکتر پیشنهاد می‌دهد در صورت موجود بودن یک نصب سیستمی Node (Homebrew/apt/choco) به آن مهاجرت کنید.

    سرویس‌های تازه نصب‌شده یا تعمیرشده ریشه‌های محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های پایدار bin کاربر را نگه می‌دارند، اما دایرکتوری‌های جایگزین حدس‌زده‌شدهٔ مدیر نسخه فقط زمانی در PATH سرویس نوشته می‌شوند که آن دایرکتوری‌ها روی دیسک وجود داشته باشند. این کار PATH سرپرست تولیدشده را با همان ممیزی حداقل-PATH که دکتر بعداً اجرا می‌کند همسو نگه می‌دارد.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + فرادادهٔ ویزارد">
    دکتر هر تغییر پیکربندی را پایدار می‌کند و برای ثبت اجرای دکتر، فرادادهٔ ویزارد را مهر می‌زند.
  </Accordion>
  <Accordion title="19. نکته‌های فضای کاری (پشتیبان‌گیری + سیستم حافظه)">
    دکتر در صورت نبود سیستم حافظهٔ فضای کاری، آن را پیشنهاد می‌دهد و اگر فضای کاری از قبل زیر git نباشد، یک نکتهٔ پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار فضای کاری و پشتیبان‌گیری git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
