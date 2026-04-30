---
read_when:
    - افزودن یا تغییر مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'فرمان Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل ترمیم'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-04-30T09:37:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. پیکربندی/وضعیت قدیمی را اصلاح می‌کند، سلامت را بررسی می‌کند، و مراحل تعمیر قابل اجرا ارائه می‌دهد.

## شروع سریع

```bash
openclaw doctor
```

### حالت‌های بی‌نیاز از رابط تعاملی و خودکارسازی

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

    تعمیرهای تهاجمی را نیز اعمال کنید (پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    بدون پرسش اجرا کنید و فقط مهاجرت‌های امن را اعمال کنید (عادی‌سازی پیکربندی + جابه‌جایی‌های وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/sandbox را که به تأیید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های اضافی gateway اسکن کنید (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید پیش از نوشتن، تغییرات را بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## کاری که انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، UI، و به‌روزرسانی‌ها">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل UI (وقتی شِمای پروتکل جدیدتر است Control UI را دوباره می‌سازد).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/گمشده/مسدود) و وضعیت Plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - عادی‌سازی پیکربندی برای مقادیر قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی Chrome extension و آمادگی Chrome MCP.
    - هشدارهای بازنویسی provider در OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌انداختن OAuth در Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OpenAI Codex OAuth.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/WhatsApp auth).
    - مهاجرت کلید قدیمی قرارداد manifest برای Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت store قدیمی Cron (`jobId`, `schedule.cron`, فیلدهای سطح‌بالای delivery/payload، payload `provider`، jobهای fallback ساده webhook با `notify: true`).
    - مهاجرت runtime-policy قدیمی agent به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی قدیمی Plugin وقتی Pluginها فعال هستند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های قدیمی Plugin به‌عنوان پیکربندی containment بی‌اثر در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بررسی فایل قفل session و پاک‌سازی قفل قدیمی.
    - تعمیر رونوشت session برای شاخه‌های تکراری بازنویسی prompt که توسط buildهای تحت‌تأثیر 2026.4.24 ایجاد شده‌اند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (sessions، transcripts، state dir).
    - بررسی‌های مجوز فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت auth مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای نزدیک به انقضا را تازه‌سازی کند، و وضعیت‌های cooldown/disabled برای auth-profile را گزارش می‌دهد.
    - شناسایی پوشه workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و supervisorها">
    - تعمیر image مربوط به sandbox وقتی sandboxing فعال است.
    - مهاجرت سرویس قدیمی و شناسایی gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime برای Gateway (سرویس نصب شده اما در حال اجرا نیست؛ برچسب launchd cache شده).
    - هشدارهای وضعیت کانال (از gateway در حال اجرا بررسی می‌شوند).
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) همراه با تعمیر اختیاری.
    - پاک‌سازی محیط proxy جاسازی‌شده برای سرویس‌های gateway که مقادیر shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را هنگام نصب یا به‌روزرسانی گرفته‌اند.
    - بررسی‌های بهترین‌روش runtime برای Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی تداخل port در Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="Auth، امنیت، و pairing">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های auth در Gateway برای حالت token محلی (وقتی هیچ منبع token وجود ندارد تولید token را پیشنهاد می‌کند؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - شناسایی مشکل pairing دستگاه (درخواست‌های جفت‌سازی نخستین بار در انتظار، ارتقاهای role/scope در انتظار، drift کش قدیمی token دستگاه محلی، و drift در auth رکورد جفت‌شده).

  </Accordion>
  <Accordion title="Workspace و shell">
    - بررسی systemd linger در Linux.
    - بررسی اندازه فایل bootstrap در workspace (هشدارهای truncation/نزدیک به حد برای فایل‌های context).
    - بررسی وضعیت تکمیل shell و نصب/ارتقای خودکار.
    - بررسی آمادگی provider برای embedding در جست‌وجوی memory (مدل محلی، کلید API راه‌دور، یا binary مربوط به QMD).
    - بررسی‌های نصب از source (ناهماهنگی pnpm workspace، دارایی‌های UI گمشده، binary گمشده tsx).
    - پیکربندی به‌روزشده + metadata ویزارد را می‌نویسد.

  </Accordion>
</AccordionGroup>

## backfill و reset در UI مربوط به Dreams

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset**، و **Clear Grounded** برای گردش‌کار grounded dreaming است. این اقدام‌ها از روش‌های RPC سبک gateway doctor استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر grounded REM diary را اجرا می‌کند، و ورودی‌های backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان ورودی‌های علامت‌گذاری‌شده backfill diary را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط ورودی‌های کوتاه‌مدت staged و فقط-grounded را حذف می‌کند که از بازپخش تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه جمع نکرده‌اند.

کاری که به‌تنهایی انجام **نمی‌دهند**:

- `MEMORY.md` را ویرایش نمی‌کنند
- مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- candidateهای grounded را به‌طور خودکار وارد store زنده promotion کوتاه‌مدت نمی‌کنند، مگر اینکه ابتدا مسیر CLI مربوط به staged را صراحتاً اجرا کنید

اگر می‌خواهید بازپخش تاریخی grounded روی lane عادی deep promotion اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار candidateهای durable و grounded را در store مربوط به short-term dreaming قرار می‌دهد و در عین حال `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار دقیق و منطق

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک git checkout باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. عادی‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های قدیمی مقدار باشد (برای مثال `messages.ackReaction` بدون بازنویسی مخصوص کانال)، doctor آن‌ها را به شِمای فعلی عادی‌سازی می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی Talk برابر است با `talk.provider` + `talk.providers.<provider>`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را در map مربوط به provider بازنویسی می‌کند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با شِمای به‌روزشده بازنویسی می‌کند.

    Gateway همچنین هنگام startup، اگر قالب پیکربندی قدیمی را شناسایی کند، مهاجرت‌های doctor را به‌طور خودکار اجرا می‌کند، بنابراین پیکربندی‌های قدیمی بدون مداخله دستی تعمیر می‌شوند. مهاجرت‌های store مربوط به jobهای Cron توسط `openclaw doctor --fix` انجام می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` سطح‌بالا
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
    - برای کانال‌هایی که `accounts` نام‌دار دارند اما مقادیر سطح‌بالای کانالِ تک‌حسابی هنوز باقی مانده است، آن مقادیر scoped به account را به account ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک target نام‌دار/default موجود و مطابق را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - حذف `agents.defaults.llm`؛ برای timeoutهای provider/model کند از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - حذف `browser.relayBindHost` (تنظیم قدیمی extension relay)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (startup مربوط به gateway همچنین providerهایی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده باشد رد می‌کند، به‌جای اینکه با حالت fail-closed متوقف شود)

    هشدارهای Doctor همچنین شامل راهنمایی account-default برای کانال‌های چندحسابی می‌شوند:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که fallback routing می‌تواند یک account غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی یک account ID ناشناخته تنظیم شده باشد، doctor هشدار می‌دهد و account IDهای پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. نادیده‌گیری‌های ارائه‌دهنده OpenCode">
    اگر `models.providers.opencode`، `opencode-zen`، یا `opencode-go` را به‌صورت دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را نادیده می‌گیرد. این می‌تواند مدل‌ها را مجبور کند از API نادرست استفاده کنند یا هزینه‌ها را صفر کند. doctor هشدار می‌دهد تا بتوانید نادیده‌گیری را حذف کنید و مسیریابی API و هزینه‌های هر مدل را بازیابی کنید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر افزونه Chrome حذف‌شده اشاره کند، doctor آن را به مدل اتصال Chrome MCP میزبان-محلی فعلی نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    doctor همچنین وقتی از `defaultProfile: "user"` یا یک پروفایل `existing-session` پیکربندی‌شده استفاده می‌کنید، مسیر Chrome MCP میزبان-محلی را بررسی می‌کند:

    - بررسی می‌کند آیا Google Chrome روی همان میزبان برای پروفایل‌های اتصال خودکار پیش‌فرض نصب شده است یا نه
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند اشکال‌زدایی از راه دور را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP میزبان-محلی همچنان به این موارد نیاز دارد:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان Gateway/Node
    - اجرای محلی مرورگر
    - فعال بودن اشکال‌زدایی از راه دور در آن مرورگر
    - تایید نخستین درخواست رضایت اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. Existing-session محدودیت‌های مسیر Chrome MCP فعلی را حفظ می‌کند؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود، و عملیات دسته‌ای همچنان به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser، یا سایر جریان‌های headless اعمال **نمی‌شود**. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای OAuth TLS">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، doctor نقطه پایانی مجوزدهی OpenAI را بررسی می‌کند تا تایید کند پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر بررسی با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی‌شده، یا گواهی خودامضاشده)، doctor راهنمای رفع مشکل مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولا `brew postinstall ca-certificates` است. با `--deep`، این بررسی حتی اگر Gateway سالم باشد هم اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. نادیده‌گیری‌های ارائه‌دهنده Codex OAuth">
    اگر قبلا تنظیمات انتقال قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر ارائه‌دهنده داخلی Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند، تحت‌الشعاع قرار دهند. doctor وقتی آن تنظیمات انتقال قدیمی را کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید نادیده‌گیری انتقال منسوخ را حذف یا بازنویسی کنید و رفتار مسیریابی/بازگشت داخلی را دوباره به دست آورید. پروکسی‌های سفارشی و نادیده‌گیری‌های فقط-هدر همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. هشدارهای مسیر Plugin کدکس">
    وقتی Plugin بسته‌بندی‌شده Codex فعال باشد، doctor همچنین بررسی می‌کند که آیا ارجاع‌های مدل اصلی `openai-codex/*` هنوز از طریق اجراکننده پیش‌فرض PI حل می‌شوند یا نه. این ترکیب وقتی می‌خواهید احراز هویت OAuth/اشتراک Codex از طریق PI انجام شود معتبر است، اما به‌راحتی با هارنس app-server بومی Codex اشتباه گرفته می‌شود. doctor هشدار می‌دهد و به شکل app-server صریح اشاره می‌کند: `openai/*` به‌علاوه `agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex`.

    doctor این را خودکار تعمیر نمی‌کند چون هر دو مسیر معتبرند:

    - `openai-codex/*` + PI یعنی «از احراز هویت OAuth/اشتراک Codex از طریق اجراکننده عادی OpenClaw استفاده کن.»
    - `openai/*` + `runtime: "codex"` یعنی «نوبت تعبیه‌شده را از طریق app-server بومی Codex اجرا کن.»
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از چت کنترل یا متصل کن.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از آداپتور خارجی ACP/acpx استفاده کن.»

    اگر هشدار ظاهر شد، مسیری را که مد نظرتان بوده انتخاب کنید و پیکربندی را دستی ویرایش کنید. وقتی PI Codex OAuth عمدی است، هشدار را همان‌طور نگه دارید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    doctor می‌تواند چیدمان‌های قدیمی روی دیسک را به ساختار فعلی مهاجرت دهد:

    - ذخیره‌گاه نشست‌ها + رونوشت‌ها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری عامل:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها با بهترین تلاش و idempotent هستند؛ doctor وقتی هر پوشه قدیمی را به‌عنوان پشتیبان باقی بگذارد هشدار منتشر می‌کند. Gateway/CLI همچنین هنگام شروع، نشست‌های قدیمی + دایرکتوری عامل را خودکار مهاجرت می‌دهد تا تاریخچه/احراز هویت/مدل‌ها بدون اجرای دستی doctor در مسیر هر عامل قرار بگیرند. احراز هویت WhatsApp عمدا فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. نرمال‌سازی ارائه‌دهنده گفت‌وگو/نگاشت ارائه‌دهنده اکنون با برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌هایی که فقط مربوط به ترتیب کلیدها هستند دیگر تغییرات تکراری بی‌اثر `doctor --fix` را فعال نمی‌کنند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های مانیفست Plugin قدیمی">
    doctor همه مانیفست‌های Plugin نصب‌شده را برای کلیدهای قابلیت سطح بالای منسوخ (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به شیء `contracts` منتقل کند و فایل مانیفست را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقادیر را داشته باشد، کلید قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های ذخیره‌گاه Cron قدیمی">
    doctor همچنین ذخیره‌گاه کار Cron (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی بازنویسی شده باشد) را برای شکل‌های قدیمی کار که زمان‌بند هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی Cron شامل این موارد است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload سطح بالا (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای delivery سطح بالا (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - نام‌های مستعار delivery مربوط به `provider` در payload → `delivery.channel` صریح
    - کارهای fallback وبهوک ساده قدیمی `notify: true` → `delivery.mode="webhook"` صریح همراه با `delivery.to=cron.webhook`

    doctor فقط وقتی کارهای `notify: true` را خودکار مهاجرت می‌دهد که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر کاری fallback اطلاع‌رسانی قدیمی را با یک حالت delivery غیر وبهوک موجود ترکیب کند، doctor هشدار می‌دهد و آن کار را برای بازبینی دستی باقی می‌گذارد.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    doctor همه دایرکتوری‌های نشست عامل را برای فایل‌های قفل نوشتن مانده اسکن می‌کند؛ فایل‌هایی که وقتی یک نشست به‌صورت غیرعادی خارج شده باقی مانده‌اند. برای هر فایل قفل پیدا شده این موارد را گزارش می‌کند: مسیر، PID، اینکه PID هنوز زنده است یا نه، سن قفل، و اینکه stale محسوب می‌شود یا نه (PID مرده یا قدیمی‌تر از 30 دقیقه). در حالت `--fix` / `--repair` فایل‌های قفل stale را خودکار حذف می‌کند؛ در غیر این صورت یادداشتی چاپ می‌کند و به شما می‌گوید با `--fix` دوباره اجرا کنید.
  </Accordion>
  <Accordion title="3d. تعمیر شاخه رونوشت نشست">
    doctor فایل‌های JSONL نشست عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی رونوشت prompt در 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با زمینه runtime داخلی OpenClaw به‌علاوه یک خواهر/برادر فعال که همان prompt قابل مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل تحت تاثیر کنار فایل اصلی پشتیبان می‌گیرد و رونوشت را به شاخه فعال بازنویسی می‌کند تا تاریخچه Gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (ماندگاری نشست، مسیریابی، و ایمنی)">
    دایرکتوری وضعیت ساقه مغز عملیاتی است. اگر ناپدید شود، نشست‌ها، اعتبارنامه‌ها، لاگ‌ها، و پیکربندی را از دست می‌دهید (مگر اینکه جای دیگری پشتیبان داشته باشید).

    doctor بررسی می‌کند:

    - **دایرکتوری وضعیت موجود نیست**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای ایجاد دوباره دایرکتوری درخواست تایید می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های گم‌شده را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: قابلیت نوشتن را اعتبارسنجی می‌کند؛ پیشنهاد می‌دهد مجوزها را تعمیر کند (و وقتی عدم تطابق مالک/گروه شناسایی شود، راهنمای `chown` منتشر می‌کند).
    - **دایرکتوری وضعیت همگام‌شده با فضای ابری در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` حل شود هشدار می‌دهد، چون مسیرهای متکی بر همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت SD یا eMMC در Linux**: وقتی وضعیت به منبع mount از نوع `mmcblk*` حل شود هشدار می‌دهد، چون I/O تصادفی مبتنی بر SD یا eMMC می‌تواند زیر نوشتن نشست و اعتبارنامه کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های نشست موجود نیستند**: `sessions/` و دایرکتوری ذخیره‌گاه نشست برای ماندگار کردن تاریخچه و جلوگیری از کرش‌های `ENOENT` لازم هستند.
    - **عدم تطابق رونوشت**: وقتی ورودی‌های نشست اخیر فایل‌های رونوشت گم‌شده داشته باشند هشدار می‌دهد.
    - **«JSONL یک‌خطی» نشست اصلی**: وقتی رونوشت اصلی فقط یک خط داشته باشد پرچم‌گذاری می‌کند (تاریخچه انباشته نمی‌شود).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های خانه وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآوری حالت راه دور**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند آن را روی میزبان راه دور اجرا کنید (وضعیت آنجا زندگی می‌کند).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/جهان قابل خواندن باشد هشدار می‌دهد و پیشنهاد می‌دهد به `600` سخت‌گیرانه‌تر شود.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    doctor پروفایل‌های OAuth را در ذخیره‌گاه احراز هویت بررسی می‌کند، وقتی توکن‌ها در حال انقضا/منقضی‌شده باشند هشدار می‌دهد، و وقتی ایمن باشد می‌تواند آن‌ها را تازه‌سازی کند. اگر پروفایل OAuth/توکن Anthropic stale باشد، یک کلید API Anthropic یا مسیر setup-token Anthropic را پیشنهاد می‌دهد. درخواست‌های تازه‌سازی فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های تازه‌سازی را رد می‌کند.

    وقتی تازه‌سازی OAuth به‌صورت دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا ارائه‌دهنده‌ای که می‌گوید باید دوباره وارد شوید)، doctor گزارش می‌دهد که احراز هویت دوباره لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    doctor همچنین پروفایل‌های احراز هویتی را گزارش می‌کند که به این دلایل موقتا غیرقابل استفاده هستند:

    - cooldownهای کوتاه (محدودیت نرخ/timeout/شکست‌های احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های صورت‌حساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hookها">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor ارجاع مدل را در برابر کاتالوگ و allowlist اعتبارسنجی می‌کند و وقتی حل نشود یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. تعمیر تصویر sandbox">
    وقتی sandboxing فعال باشد، doctor تصاویر Docker را بررسی می‌کند و اگر تصویر فعلی موجود نباشد پیشنهاد می‌دهد بسازد یا به نام‌های قدیمی تغییر دهد.
  </Accordion>
  <Accordion title="7b. وابستگی‌های runtime مربوط به Pluginهای بسته‌بندی‌شده">
    doctor وابستگی‌های runtime را فقط برای Pluginهای بسته‌بندی‌شده‌ای که در پیکربندی فعلی فعال‌اند یا به‌صورت پیش‌فرض توسط مانیفست بسته‌بندی‌شده‌شان فعال شده‌اند اعتبارسنجی می‌کند، برای مثال `plugins.entries.discord.enabled: true`، `channels.discord.enabled: true` قدیمی، `models.providers.*` / ارجاع‌های مدل عامل پیکربندی‌شده، یا یک Plugin بسته‌بندی‌شده با فعال‌سازی پیش‌فرض بدون مالکیت ارائه‌دهنده. اگر موردی گم شده باشد، doctor بسته‌ها را گزارش می‌کند و آن‌ها را در حالت `openclaw doctor --fix` / `openclaw doctor --repair` نصب می‌کند. Pluginهای خارجی همچنان از `openclaw plugins install` / `openclaw plugins update` استفاده می‌کنند؛ doctor وابستگی‌ها را برای مسیرهای دلخواه Plugin نصب نمی‌کند.

    هنگام ترمیم doctor، نصب‌های npm وابستگی‌های زمان اجرای bundled در نشست‌های TTY پیشرفت را با spinner گزارش می‌کنند و در خروجی piped/headless به‌صورت دوره‌ای پیشرفت خطی نشان می‌دهند. Gateway و CLI محلی نیز می‌توانند وابستگی‌های زمان اجرای Plugin های bundled فعال را پیش از import کردن یک Plugin bundled، بنا به درخواست ترمیم کنند. این نصب‌ها به ریشه نصب زمان اجرای Plugin محدود هستند، با scripts غیرفعال اجرا می‌شوند، package lock نمی‌نویسند، و با قفل ریشه نصب محافظت می‌شوند تا شروع‌های هم‌زمان CLI یا Gateway در یک زمان همان درخت `node_modules` را تغییر ندهند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنمای پاک‌سازی">
    Doctor سرویس‌های Gateway قدیمی (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد می‌کند آن‌ها را حذف کند و سرویس OpenClaw را با پورت Gateway فعلی نصب کند. همچنین می‌تواند سرویس‌های اضافی شبیه Gateway را اسکن کند و راهنمای پاک‌سازی چاپ کند. سرویس‌های Gateway OpenClaw که با نام پروفایل مشخص شده‌اند، درجه‌اول محسوب می‌شوند و به‌عنوان «اضافی» علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس Gateway سطح کاربر وجود نداشته باشد اما یک سرویس Gateway سطح سیستم OpenClaw وجود داشته باشد، Doctor به‌طور خودکار یک سرویس سطح کاربر دوم نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس نمونه تکراری را حذف کنید یا وقتی یک supervisor سیستمی چرخه‌عمر Gateway را مالک است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Startup Matrix">
    وقتی یک حساب کانال Matrix مهاجرت وضعیت قدیمیِ در انتظار یا قابل اقدام داشته باشد، Doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس مراحل مهاجرت best-effort را اجرا می‌کند: مهاجرت وضعیت قدیمی Matrix و آماده‌سازی وضعیت رمزنگاری‌شده قدیمی. هر دو مرحله غیرکشنده هستند؛ خطاها ثبت می‌شوند و startup ادامه می‌یابد. در حالت فقط‌خواندنی (`openclaw doctor` بدون `--fix`) این بررسی کاملا نادیده گرفته می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و انحراف احراز هویت">
    Doctor اکنون وضعیت جفت‌سازی دستگاه را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    مواردی که گزارش می‌کند:

    - درخواست‌های جفت‌سازی اولیه در انتظار
    - ارتقاهای نقش در انتظار برای دستگاه‌هایی که قبلا جفت شده‌اند
    - ارتقاهای scope در انتظار برای دستگاه‌هایی که قبلا جفت شده‌اند
    - ترمیم‌های عدم تطابق public-key که در آن‌ها device id هنوز مطابقت دارد اما هویت دستگاه دیگر با رکورد تاییدشده مطابقت ندارد
    - رکوردهای جفت‌شده‌ای که برای یک نقش تاییدشده token فعال ندارند
    - token های جفت‌شده‌ای که scope هایشان از baseline جفت‌سازی تاییدشده منحرف شده است
    - ورودی‌های cache محلی device-token برای دستگاه فعلی که قدیمی‌تر از یک چرخش token در سمت Gateway هستند یا metadata scope کهنه دارند

    Doctor درخواست‌های جفت‌سازی را به‌طور خودکار تایید نمی‌کند و token های دستگاه را به‌طور خودکار نمی‌چرخاند. در عوض مراحل بعدی دقیق را چاپ می‌کند:

    - درخواست‌های در انتظار را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تایید کنید
    - یک token تازه را با `openclaw devices rotate --device <deviceId> --role <role>` بچرخانید
    - یک رکورد کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره تایید کنید

    این رخنه رایج «قبلا جفت شده اما هنوز پیام نیاز به جفت‌سازی می‌گیرد» را می‌بندد: Doctor اکنون جفت‌سازی اولیه را از ارتقاهای نقش/scope در انتظار و از انحراف token/هویت دستگاه کهنه تفکیک می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor زمانی هشدار صادر می‌کند که یک provider بدون allowlist برای DM ها باز باشد، یا وقتی یک policy به‌شکل خطرناک پیکربندی شده باشد.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، Doctor مطمئن می‌شود lingering فعال است تا Gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (skills، plugins، و دایرکتوری‌های قدیمی)">
    Doctor خلاصه‌ای از وضعیت workspace را برای agent پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: تعداد skills واجد شرایط، دارای requirements ناقص، و مسدودشده توسط allowlist را می‌شمارد.
    - **دایرکتوری‌های workspace قدیمی**: وقتی `~/openclaw` یا سایر دایرکتوری‌های workspace قدیمی کنار workspace فعلی وجود داشته باشند، هشدار می‌دهد.
    - **وضعیت Plugin**: Plugin های فعال/غیرفعال/خطادار را می‌شمارد؛ برای هر خطا، شناسه‌های Plugin را فهرست می‌کند؛ capability های bundle plugin را گزارش می‌کند.
    - **هشدارهای سازگاری Plugin**: Plugin هایی را که با runtime فعلی مشکل سازگاری دارند علامت‌گذاری می‌کند.
    - **عیب‌یابی Plugin**: هر هشدار یا خطای زمان load که توسط registry Plugin صادر شده باشد را نمایش می‌دهد.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    Doctor بررسی می‌کند آیا فایل‌های bootstrap workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا سایر فایل‌های context تزریق‌شده) نزدیک یا فراتر از بودجه کاراکتر پیکربندی‌شده هستند یا نه. تعداد کاراکتر خام در برابر تزریق‌شده برای هر فایل، درصد truncation، علت truncation (`max/file` یا `max/total`)، و کل کاراکترهای تزریق‌شده به‌عنوان کسری از کل بودجه را گزارش می‌کند. وقتی فایل‌ها truncate شده‌اند یا نزدیک حد هستند، Doctor نکاتی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کانال کهنه">
    وقتی `openclaw doctor --fix` یک Plugin کانال گمشده را حذف می‌کند، config آویزانِ scoped به کانال را که به آن Plugin ارجاع داده بود نیز حذف می‌کند: ورودی‌های `channels.<id>`، target های Heartbeat که نام کانال را آورده بودند، و override های `agents.*.models["<channel>/*"]`. این از loop های بوت Gateway جلوگیری می‌کند که در آن runtime کانال حذف شده اما config هنوز از Gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند آیا تکمیل tab برای shell فعلی (zsh، bash، fish، یا PowerShell) نصب شده است یا نه:

    - اگر پروفایل shell از الگوی تکمیل dynamic کند (`source <(openclaw completion ...)`) استفاده کند، Doctor آن را به نوع سریع‌تر فایل cache شده ارتقا می‌دهد.
    - اگر تکمیل در پروفایل پیکربندی شده باشد اما فایل cache وجود نداشته باشد، Doctor به‌طور خودکار cache را دوباره تولید می‌کند.
    - اگر هیچ تکمیلی اصلا پیکربندی نشده باشد، Doctor برای نصب آن درخواست تایید می‌کند (فقط حالت تعاملی؛ با `--non-interactive` نادیده گرفته می‌شود).

    برای تولید دوباره cache به‌صورت دستی، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (token محلی)">
    Doctor آمادگی احراز هویت token محلی Gateway را بررسی می‌کند.

    - اگر حالت token به token نیاز داشته باشد و هیچ منبع token وجود نداشته باشد، Doctor پیشنهاد تولید یکی را می‌دهد.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما در دسترس نباشد، Doctor هشدار می‌دهد و آن را با plaintext بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی تولید را اجباری می‌کند که هیچ token SecretRef پیکربندی نشده باشد.

  </Accordion>
  <Accordion title="12b. ترمیم‌های فقط‌خواندنی آگاه از SecretRef">
    برخی جریان‌های ترمیم باید credentials پیکربندی‌شده را بدون تضعیف رفتار runtime fail-fast بررسی کنند.

    - `openclaw doctor --fix` اکنون برای ترمیم‌های هدفمند config از همان مدل خلاصه SecretRef فقط‌خواندنی استفاده می‌کند که command های خانواده status استفاده می‌کنند.
    - مثال: ترمیم `allowFrom` / `groupAllowFrom` `@username` در Telegram تلاش می‌کند وقتی credentials بات پیکربندی‌شده در دسترس هستند، از آن‌ها استفاده کند.
    - اگر token بات Telegram از طریق SecretRef پیکربندی شده اما در مسیر command فعلی در دسترس نباشد، Doctor گزارش می‌کند که credential پیکربندی‌شده-اما-ناموجود است و به‌جای crash کردن یا گزارش نادرستِ گمشده بودن token، auto-resolution را نادیده می‌گیرد.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی مجدد">
    Doctor بررسی سلامت اجرا می‌کند و وقتی Gateway ناسالم به نظر برسد، پیشنهاد restart کردن آن را می‌دهد.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند آیا provider embedding جست‌وجوی حافظه پیکربندی‌شده برای agent پیش‌فرض آماده است یا نه. رفتار به backend و provider پیکربندی‌شده بستگی دارد:

    - **backend QMD**: بررسی می‌کند آیا binary `qmd` در دسترس و قابل start است یا نه. اگر نباشد، راهنمای رفع شامل package npm و گزینه مسیر binary دستی را چاپ می‌کند.
    - **provider محلی صریح**: وجود فایل مدل محلی یا URL مدل remote/downloadable شناخته‌شده را بررسی می‌کند. اگر وجود نداشته باشد، پیشنهاد می‌کند به provider remote تغییر دهید.
    - **provider remote صریح** (`openai`، `voyage`، و غیره): بررسی می‌کند API key در environment یا auth store وجود دارد. اگر وجود نداشته باشد، راهنمای رفع قابل اقدام چاپ می‌کند.
    - **provider خودکار**: ابتدا دسترس‌پذیری مدل محلی را بررسی می‌کند، سپس هر provider remote را به‌ترتیب auto-selection امتحان می‌کند.

    وقتی نتیجه probe cache شده Gateway در دسترس باشد (Gateway هنگام بررسی سالم بوده است)، Doctor نتیجه آن را با config قابل مشاهده از CLI تطبیق می‌دهد و هر اختلافی را ذکر می‌کند. Doctor در مسیر پیش‌فرض ping تازه embedding را start نمی‌کند؛ وقتی بررسی زنده provider می‌خواهید، از command وضعیت حافظه deep استفاده کنید.

    برای تایید آمادگی embedding در runtime، `openclaw memory status --deep` را استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، Doctor یک probe وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. audit + ترمیم config supervisor">
    Doctor config نصب‌شده supervisor (launchd/systemd/schtasks) را برای defaults گمشده یا قدیمی (مثلا وابستگی‌های systemd network-online و تاخیر restart) بررسی می‌کند. وقتی عدم تطابق پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند فایل سرویس/task را به defaults فعلی بازنویسی کند.

    نکات:

    - `openclaw doctor` پیش از بازنویسی config supervisor درخواست تایید می‌کند.
    - `openclaw doctor --yes` prompt های ترمیم پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های توصیه‌شده را بدون prompt اعمال می‌کند.
    - `openclaw doctor --repair --force` config های سفارشی supervisor را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` برای چرخه‌عمر سرویس Gateway، Doctor را فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌کند و ترمیم‌های غیرسرویسی را اجرا می‌کند، اما نصب/start/restart/bootstrap سرویس، بازنویسی‌های config supervisor، و پاک‌سازی سرویس قدیمی را نادیده می‌گیرد چون یک supervisor خارجی مالک آن چرخه‌عمر است.
    - در Linux، Doctor metadata مربوط به command/entrypoint را زمانی که unit مطابق Gateway در systemd فعال است بازنویسی نمی‌کند. همچنین هنگام اسکن duplicate-service، unit های غیرفعال غیرقدیمی اضافیِ شبیه Gateway را نادیده می‌گیرد تا فایل‌های سرویس همراه نویز پاک‌سازی ایجاد نکنند.
    - اگر احراز هویت token به token نیاز داشته باشد و `gateway.auth.token` توسط SecretRef مدیریت شود، نصب/ترمیم سرویس Doctor، SecretRef را validate می‌کند اما مقدارهای token plaintext حل‌شده را در metadata محیط سرویس supervisor ماندگار نمی‌کند.
    - Doctor مقدارهای محیط سرویس مبتنی بر `.env`/SecretRef مدیریت‌شده را که نصب‌های قدیمی‌تر LaunchAgent، systemd، یا Windows Scheduled Task به‌صورت inline تعبیه کرده‌اند تشخیص می‌دهد و metadata سرویس را بازنویسی می‌کند تا آن مقدارها به‌جای definition supervisor از منبع runtime load شوند.
    - Doctor تشخیص می‌دهد چه زمانی command سرویس پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را pin کرده است و metadata سرویس را به پورت فعلی بازنویسی می‌کند.
    - اگر احراز هویت token به token نیاز داشته باشد و token SecretRef پیکربندی‌شده حل‌نشده باشد، Doctor مسیر نصب/ترمیم را با راهنمای قابل اقدام مسدود می‌کند.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، Doctor نصب/ترمیم را تا زمانی که mode صریحا تنظیم شود مسدود می‌کند.
    - برای unit های user-systemd در Linux، بررسی‌های انحراف token در Doctor اکنون هنگام مقایسه metadata احراز هویت سرویس، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شود.
    - ترمیم‌های سرویس Doctor از بازنویسی، stop کردن، یا restart کردن یک سرویس Gateway از binary قدیمی‌تر OpenClaw خودداری می‌کنند وقتی config آخرین بار توسط نسخه جدیدتری نوشته شده باشد. به [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) مراجعه کنید.
    - همیشه می‌توانید با `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="16. زمان اجرای Gateway + عیب‌یابی پورت">
    Doctor زمان اجرای سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و زمانی هشدار می‌دهد که سرویس نصب شده اما واقعاً در حال اجرا نیست. همچنین تداخل‌های پورت روی پورت Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل (Gateway از قبل در حال اجرا است، تونل SSH) را گزارش می‌دهد.
  </Accordion>
  <Accordion title="17. بهترین رویه‌های زمان اجرای Gateway">
    Doctor زمانی هشدار می‌دهد که سرویس Gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای مدیر نسخه می‌توانند پس از ارتقاها خراب شوند چون سرویس مقداردهی اولیه شل شما را بارگذاری نمی‌کند. Doctor پیشنهاد می‌دهد در صورت وجود نصب سیستمی Node (Homebrew/apt/choco)، به آن مهاجرت کنید.

    سرویس‌هایی که تازه نصب یا تعمیر شده‌اند ریشه‌های محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های پایدار user-bin را نگه می‌دارند، اما دایرکتوری‌های جایگزین حدسی مدیر نسخه فقط زمانی در PATH سرویس نوشته می‌شوند که آن دایرکتوری‌ها روی دیسک وجود داشته باشند. این کار PATH ناظر تولیدشده را با همان ممیزی حداقلی PATH که Doctor بعداً اجرا می‌کند هم‌راستا نگه می‌دارد.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + فراداده ویزارد">
    Doctor هرگونه تغییر پیکربندی را پایدار می‌کند و فراداده ویزارد را برای ثبت اجرای Doctor مهر می‌زند.
  </Accordion>
  <Accordion title="19. نکته‌های فضای کاری (پشتیبان‌گیری + سامانه حافظه)">
    Doctor هنگام نبود سامانه حافظه فضای کاری، آن را پیشنهاد می‌دهد و اگر فضای کاری از قبل زیر git نباشد، یک نکته پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار فضای کاری و پشتیبان‌گیری با git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
