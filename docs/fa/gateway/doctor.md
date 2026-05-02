---
read_when:
    - افزودن یا اصلاح مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'فرمان Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل تعمیر'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-02T11:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d306099cda1d7f6079ab94ce8bd4a716b8ccf9ab3637e14743c8a1c83db35ca6
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. این ابزار پیکربندی/وضعیت کهنه را اصلاح می‌کند، سلامت را بررسی می‌کند و گام‌های تعمیر قابل اجرا ارائه می‌دهد.

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

    پذیرش پیش‌فرض‌ها بدون پرسش (از جمله گام‌های تعمیر راه‌اندازی مجدد/سرویس/سندباکس در صورت کاربرد).

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

    اعمال تعمیرهای تهاجمی‌تر نیز (پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    اجرا بدون پرسش و فقط اعمال مهاجرت‌های امن (نرمال‌سازی پیکربندی + انتقال وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/سندباکس را که به تأیید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    اسکن سرویس‌های سیستم برای نصب‌های Gateway اضافی (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید پیش از نوشتن تغییرات را بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## چه کاری انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، UI و به‌روزرسانی‌ها">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل UI (وقتی schema پروتکل جدیدتر باشد Control UI را دوباره می‌سازد).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/مفقود/مسدود) و وضعیت plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - نرمال‌سازی پیکربندی برای مقادیر قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای بازنویسی provider در OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌اندازی OAuth در Codex (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OpenAI Codex OAuth.
    - هشدارهای allowlist مربوط به Plugin/ابزار وقتی `plugins.allow` محدودکننده است اما سیاست ابزار همچنان wildcard یا ابزارهای متعلق به plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/احراز هویت WhatsApp).
    - مهاجرت کلید قرارداد manifest قدیمی plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت فروشگاه cron قدیمی (`jobId`, `schedule.cron`, فیلدهای سطح بالای delivery/payload، payload `provider`، jobهای fallback ساده `notify: true` webhook).
    - مهاجرت policy قدیمی runtime عامل به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی کهنه plugin وقتی pluginها فعال هستند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های کهنه plugin به‌عنوان پیکربندی containment غیرفعال تلقی شده و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل lock نشست و پاک‌سازی lockهای کهنه.
    - تعمیر transcript نشست برای شاخه‌های prompt-rewrite تکراری که توسط buildهای متاثر 2026.4.24 ایجاد شده‌اند.
    - تشخیص tombstone بازیابی-راه‌اندازی مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌کردن flagهای کهنه بازیابی abort‌شده تا startup دیگر child را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (نشست‌ها، transcriptها، پوشه وضعیت).
    - بررسی مجوزهای فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای رو به انقضا را تازه‌سازی کند و وضعیت‌های cooldown/disabled پروفایل احراز هویت را گزارش می‌دهد.
    - تشخیص پوشه workspace اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها و supervisorها">
    - تعمیر تصویر سندباکس وقتی سندباکس فعال است.
    - مهاجرت سرویس قدیمی و تشخیص Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime Gateway (سرویس نصب شده اما در حال اجرا نیست؛ label کش‌شده launchd).
    - هشدارهای وضعیت کانال (probe‌شده از Gateway در حال اجرا).
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy تعبیه‌شده برای سرویس‌های Gateway که هنگام نصب یا به‌روزرسانی مقادیر shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را ثبت کرده‌اند.
    - بررسی‌های بهترین‌رویه runtime Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی تداخل پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="احراز هویت، امنیت و pairing">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی هیچ منبع token وجود ندارد، تولید token را پیشنهاد می‌دهد؛ پیکربندی‌های SecretRef مربوط به token را بازنویسی نمی‌کند).
    - تشخیص مشکل در pairing دستگاه (درخواست‌های pending برای اولین pairing، ارتقاهای pending نقش/scope، drift کهنه کش token دستگاه محلی و drift احراز هویت رکورد pair‌شده).

  </Accordion>
  <Accordion title="Workspace و shell">
    - بررسی systemd linger در Linux.
    - بررسی اندازه فایل bootstrap workspace (هشدارهای truncation/نزدیک به حد برای فایل‌های context).
    - بررسی وضعیت تکمیل shell و نصب/ارتقای خودکار.
    - بررسی آمادگی provider مربوط به embedding جست‌وجوی حافظه (مدل محلی، کلید API دوردست یا binary مربوط به QMD).
    - بررسی‌های نصب از source (عدم تطابق workspace در pnpm، دارایی‌های UI مفقود، binary مفقود tsx).
    - نوشتن پیکربندی به‌روزشده + metadata مربوط به wizard.

  </Accordion>
</AccordionGroup>

## backfill و reset در UI مربوط به Dreams

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset** و **Clear Grounded** برای گردش‌کار dreaming زمینه‌مند است. این اقدام‌ها از روش‌های RPC سبک doctor در Gateway استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر دفترچه REM زمینه‌مند را اجرا می‌کند و entryهای backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان entryهای دفترچه backfill علامت‌گذاری‌شده را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط entryهای کوتاه‌مدت staged و صرفا grounded را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه جمع نکرده‌اند.

کاری که خودشان انجام **نمی‌دهند**:

- آن‌ها `MEMORY.md` را ویرایش نمی‌کنند
- آن‌ها مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- آن‌ها به‌طور خودکار candidateهای grounded را وارد فروشگاه promotion کوتاه‌مدت زنده نمی‌کنند، مگر اینکه ابتدا مسیر staged در CLI را صریحا اجرا کنید

اگر می‌خواهید replay تاریخی grounded بر lane معمول promotion عمیق اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار candidateهای پایدار grounded را در فروشگاه dreaming کوتاه‌مدت stage می‌کند و در عین حال `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار دقیق و منطق

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک checkout مربوط به git باشد و doctor به‌صورت تعاملی در حال اجرا باشد، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. نرمال‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override مختص کانال)، doctor آن‌ها را به schema فعلی نرمال‌سازی می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی Talk برابر است با `talk.provider` + `talk.providers.<provider>`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را به map مربوط به provider بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` غیرخالی است و سیاست ابزار از
    entryهای wildcard یا ابزارهای متعلق به plugin استفاده می‌کند هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهای
    pluginهایی match می‌شود که واقعا load می‌شوند؛ این گزینه allowlist انحصاری plugin را دور نمی‌زند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با schema به‌روزشده بازنویسی می‌کند.

    Gateway همچنین هنگام startup وقتی قالب پیکربندی قدیمی را تشخیص دهد، مهاجرت‌های doctor را به‌طور خودکار اجرا می‌کند، بنابراین پیکربندی‌های کهنه بدون دخالت دستی تعمیر می‌شوند. مهاجرت‌های فروشگاه job در Cron توسط `openclaw doctor --fix` انجام می‌شوند.

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
    - برای کانال‌هایی که `accounts` نام‌دار دارند اما هنوز مقدارهای سطح بالای تک‌حساب قدیمی در کانال باقی مانده است، آن مقدارهای محدود به حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک هدف نام‌دار/پیش‌فرض موجود و مطابق را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای مهلت‌های زمانی طولانی provider/model از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم قدیمی رله extension)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (هنگام راه‌اندازی Gateway، providerهایی که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده نیز به‌جای شکست بسته، رد می‌شوند)

    هشدارهای doctor همچنین شامل راهنمایی پیش‌فرض حساب برای کانال‌های چندحسابی است:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که مسیریابی پشتیبان می‌تواند یک حساب غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی شناسه حساب ناشناخته تنظیم شده باشد، doctor هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. بازنویسی‌های provider در OpenCode">
    اگر `models.providers.opencode`، `opencode-zen`، یا `opencode-go` را دستی اضافه کرده باشید، کاتالوگ داخلی OpenCode از `@mariozechner/pi-ai` را بازنویسی می‌کند. این می‌تواند modelها را به API اشتباه وادار کند یا هزینه‌ها را صفر کند. doctor هشدار می‌دهد تا بتوانید بازنویسی را حذف کنید و مسیریابی API به‌ازای هر model + هزینه‌ها را برگردانید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر حذف‌شده extension کروم اشاره می‌کند، doctor آن را به مدل اتصال Chrome MCP میزبان-محلی فعلی نرمال‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    doctor همچنین وقتی از `defaultProfile: "user"` یا یک profile پیکربندی‌شده `existing-session` استفاده می‌کنید، مسیر Chrome MCP میزبان-محلی را ممیزی می‌کند:

    - بررسی می‌کند آیا Google Chrome برای profileهای اتصال خودکار پیش‌فرض روی همان میزبان نصب شده است یا نه
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی پایین‌تر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند remote debugging را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP میزبان-محلی همچنان نیاز دارد به:

    - مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان gateway/node
    - اجرای محلی مرورگر
    - فعال بودن remote debugging در آن مرورگر
    - تأیید نخستین اعلان رضایت اتصال در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای اتصال محلی است. Existing-session محدودیت‌های مسیر Chrome MCP فعلی را حفظ می‌کند؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری دانلود، و عملیات دسته‌ای همچنان به مرورگر مدیریت‌شده یا profile خام CDP نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser، یا جریان‌های headless دیگر اعمال **نمی‌شود**. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای OAuth TLS">
    وقتی یک profile مربوط به OpenAI Codex OAuth پیکربندی شده باشد، doctor نقطه پایانی مجوزدهی OpenAI را بررسی می‌کند تا تأیید کند که پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر بررسی با خطای گواهی شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی، یا گواهی self-signed)، doctor راهنمای رفع مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولاً `brew postinstall ca-certificates` است. با `--deep`، این بررسی حتی اگر gateway سالم باشد هم اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. بازنویسی‌های provider در Codex OAuth">
    اگر قبلاً تنظیمات transport قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر provider داخلی Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند تحت‌الشعاع قرار دهند. doctor وقتی آن تنظیمات transport قدیمی را کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی transport منسوخ را حذف یا بازنویسی کنید و رفتار مسیریابی/پشتیبان داخلی را برگردانید. proxyهای سفارشی و بازنویسی‌های فقط-header همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. هشدارهای مسیر Plugin در Codex">
    وقتی Plugin همراه Codex فعال باشد، doctor همچنین بررسی می‌کند که آیا refهای model اصلی `openai-codex/*` هنوز از طریق runner پیش‌فرض PI resolve می‌شوند یا نه. وقتی می‌خواهید احراز هویت Codex OAuth/subscription از طریق PI انجام شود، این ترکیب معتبر است، اما با harness بومی app-server در Codex به‌راحتی اشتباه گرفته می‌شود. doctor هشدار می‌دهد و به شکل صریح app-server اشاره می‌کند: `openai/*` به‌همراه `agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex`.

    doctor این را خودکار ترمیم نمی‌کند، چون هر دو مسیر معتبر هستند:

    - `openai-codex/*` + PI یعنی «استفاده از احراز هویت Codex OAuth/subscription از طریق runner معمول OpenClaw.»
    - `openai/*` + `agentRuntime.id: "codex"` یعنی «اجرای turn تعبیه‌شده از طریق app-server بومی Codex.»
    - `/codex ...` یعنی «کنترل یا bind کردن یک گفت‌وگوی بومی Codex از chat.»
    - `/acp ...` یا `runtime: "acp"` یعنی «استفاده از adapter خارجی ACP/acpx.»

    اگر هشدار ظاهر شد، مسیری را که قصد داشتید انتخاب کنید و config را دستی ویرایش کنید. وقتی PI Codex OAuth عمدی است، هشدار را همان‌طور نگه دارید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    doctor می‌تواند چیدمان‌های قدیمی‌تر روی دیسک را به ساختار فعلی migrate کند:

    - Sessions store + transcripts:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری Agent:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها best-effort و idempotent هستند؛ doctor وقتی هر پوشه قدیمی را به‌عنوان پشتیبان باقی بگذارد هشدار صادر می‌کند. Gateway/CLI همچنین sessions + دایرکتوری agent قدیمی را هنگام راه‌اندازی خودکار migrate می‌کند تا history/auth/models بدون اجرای دستی doctor در مسیر به‌ازای هر agent قرار بگیرند. احراز هویت WhatsApp عمداً فقط از طریق `openclaw doctor` migrate می‌شود. نرمال‌سازی talk provider/provider-map اکنون با برابری ساختاری مقایسه می‌کند، بنابراین diffهای فقط ناشی از ترتیب key دیگر باعث تغییرات no-op تکراری `doctor --fix` نمی‌شوند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های manifest قدیمی Plugin">
    doctor همه manifestهای Plugin نصب‌شده را برای keyهای capability سطح بالای منسوخ (`speechProviders`، `realtimeTranscriptionProviders`، `realtimeVoiceProviders`، `mediaUnderstandingProviders`، `imageGenerationProviders`، `videoGenerationProviders`، `webFetchProviders`، `webSearchProviders`) اسکن می‌کند. وقتی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به آبجکت `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر key `contracts` از قبل همان مقدارها را داشته باشد، key قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های cron store قدیمی">
    doctor همچنین cron job store را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی override شده باشد) برای شکل‌های قدیمی job که scheduler هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی cron شامل موارد زیر است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload سطح بالا (`message`، `model`، `thinking`، ...) → `payload`
    - فیلدهای delivery سطح بالا (`deliver`، `channel`، `to`، `provider`، ...) → `delivery`
    - aliasهای delivery در payload `provider` → `delivery.channel` صریح
    - jobهای fallback webhook قدیمی و ساده `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    doctor فقط وقتی jobهای `notify: true` را خودکار migrate می‌کند که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر یک job، fallback notify قدیمی را با یک حالت delivery غیر-webhook موجود ترکیب کند، doctor هشدار می‌دهد و آن job را برای بازبینی دستی باقی می‌گذارد.

    در Linux، doctor همچنین وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را فراخوانی کند هشدار می‌دهد. این اسکریپت میزبان-محلی توسط OpenClaw فعلی نگهداری نمی‌شود و وقتی cron نتواند به bus کاربر systemd برسد، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی منسوخ crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor`، و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل نشست">
    Doctor هر دایرکتوری نشست عامل را برای فایل‌های قفل نوشتن مانده اسکن می‌کند — فایل‌هایی که وقتی یک نشست به‌طور غیرعادی خارج شده، باقی مانده‌اند. برای هر فایل قفل یافت‌شده گزارش می‌دهد: مسیر، PID، اینکه آیا PID هنوز زنده است یا نه، عمر قفل، و اینکه آیا مانده محسوب می‌شود یا نه (PID مرده یا قدیمی‌تر از ۳۰ دقیقه). در حالت `--fix` / `--repair` فایل‌های قفل مانده را به‌طور خودکار حذف می‌کند؛ در غیر این صورت یادداشتی چاپ می‌کند و به شما می‌گوید با `--fix` دوباره اجرا کنید.
  </Accordion>
  <Accordion title="3d. تعمیر شاخه رونوشت نشست">
    Doctor فایل‌های JSONL نشست عامل را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی رونوشت پرامپت 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با زمینه اجرای داخلی OpenClaw به‌علاوه یک هم‌نیا‌ی فعال که همان پرامپت قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل آسیب‌دیده کنار نسخه اصلی پشتیبان می‌گیرد و رونوشت را به شاخه فعال بازنویسی می‌کند تا تاریخچه gateway و خواننده‌های حافظه دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (پایداری نشست، مسیریابی، و ایمنی)">
    دایرکتوری وضعیت، ساقه مغز عملیاتی است. اگر ناپدید شود، نشست‌ها، اعتبارنامه‌ها، لاگ‌ها، و پیکربندی را از دست می‌دهید (مگر اینکه جای دیگری پشتیبان داشته باشید).

    Doctor بررسی می‌کند:

    - **دایرکتوری وضعیت گم شده**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای بازسازی دایرکتوری درخواست تأیید می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های گم‌شده را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: قابل‌نوشتن بودن را تأیید می‌کند؛ پیشنهاد تعمیر مجوزها را می‌دهد (و وقتی ناسازگاری مالک/گروه تشخیص داده شود، راهنمای `chown` منتشر می‌کند).
    - **دایرکتوری وضعیت همگام‌شده با ابر در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای پشتیبانی‌شده با همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت SD یا eMMC در Linux**: وقتی وضعیت به یک منبع mount از نوع `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی مبتنی بر SD یا eMMC می‌تواند زیر نوشتن‌های نشست و اعتبارنامه کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری‌های نشست گم شده‌اند**: `sessions/` و دایرکتوری ذخیره نشست برای پایدار کردن تاریخچه و جلوگیری از crashهای `ENOENT` لازم هستند.
    - **ناسازگاری رونوشت**: وقتی ورودی‌های نشست اخیر فایل‌های رونوشت گم‌شده داشته باشند هشدار می‌دهد.
    - **نشست اصلی "JSONL تک‌خطی"**: وقتی رونوشت اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (تاریخچه در حال انباشته شدن نیست).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های home وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآور حالت راه‌دور**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند که آن را روی میزبان راه‌دور اجرا کنید (وضعیت آنجا قرار دارد).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/همه قابل‌خواندن باشد هشدار می‌دهد و پیشنهاد سخت‌تر کردن به `600` را می‌دهد.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در ذخیره‌گاه احراز هویت بررسی می‌کند، وقتی توکن‌ها نزدیک به انقضا یا منقضی شده‌اند هشدار می‌دهد، و وقتی امن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل OAuth/توکن Anthropic مانده باشد، یک کلید API Anthropic یا مسیر setup-token Anthropic را پیشنهاد می‌کند. درخواست‌های refresh فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی refresh OAuth به‌طور دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا وقتی provider به شما بگوید دوباره وارد شوید)، doctor گزارش می‌دهد که احراز هویت مجدد لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های احراز هویتی را گزارش می‌کند که موقتاً به این دلایل غیرقابل‌استفاده هستند:

    - cooldownهای کوتاه (محدودیت نرخ/timeoutها/شکست‌های احراز هویت)
    - غیرفعال‌سازی‌های طولانی‌تر (شکست‌های صورتحساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor مرجع مدل را در برابر کاتالوگ و allowlist اعتبارسنجی می‌کند و وقتی resolve نشود یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. تعمیر تصویر sandbox">
    وقتی sandboxing فعال باشد، doctor تصاویر Docker را بررسی می‌کند و اگر تصویر فعلی گم شده باشد، پیشنهاد build یا تغییر به نام‌های legacy را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    Doctor در حالت `openclaw doctor --fix` / `openclaw doctor --repair` وضعیت staging وابستگی Plugin قدیمی تولیدشده توسط OpenClaw را حذف می‌کند. این شامل ریشه‌های وابستگی تولیدشده مانده، دایرکتوری‌های قدیمی install-stage، و بقایای محلی package از کد تعمیر وابستگی bundled-plugin قبلی است.

    Doctor همچنین می‌تواند Pluginهای قابل‌دانلود پیکربندی‌شده را دوباره نصب کند وقتی پیکربندی به آن‌ها اشاره می‌کند اما رجیستری محلی Plugin نمی‌تواند آن‌ها را پیدا کند. راه‌اندازی Gateway و بارگذاری دوباره پیکربندی package managerها را اجرا نمی‌کنند؛ نصب‌های Plugin همچنان کار صریح doctor/install/update باقی می‌مانند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنمایی‌های پاک‌سازی">
    Doctor سرویس‌های legacy gateway (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد حذف آن‌ها و نصب سرویس OpenClaw با پورت Gateway فعلی را می‌دهد. همچنین می‌تواند سرویس‌های اضافی شبیه gateway را اسکن کند و راهنمایی‌های پاک‌سازی چاپ کند. سرویس‌های OpenClaw gateway دارای نام پروفایل، first-class در نظر گرفته می‌شوند و به‌عنوان "اضافی" علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس Gateway سطح کاربر گم شده باشد اما یک سرویس OpenClaw gateway سطح سیستم وجود داشته باشد، doctor به‌طور خودکار سرویس سطح کاربر دومی نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس مورد تکراری را حذف کنید یا وقتی یک supervisor سیستمی lifecycle gateway را مالک است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Matrix هنگام راه‌اندازی">
    وقتی یک حساب کانال Matrix یک مهاجرت وضعیت legacy در انتظار یا قابل‌اقدام داشته باشد، doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس مراحل مهاجرت best-effort را اجرا می‌کند: مهاجرت وضعیت legacy Matrix و آماده‌سازی وضعیت رمزگذاری‌شده legacy. هر دو مرحله غیرکشنده هستند؛ خطاها لاگ می‌شوند و راه‌اندازی ادامه می‌یابد. در حالت فقط‌خواندنی (`openclaw doctor` بدون `--fix`) این بررسی کاملاً رد می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و انحراف احراز هویت">
    Doctor اکنون وضعیت جفت‌سازی دستگاه را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌دهد:

    - درخواست‌های جفت‌سازی نخستین‌بار در انتظار
    - ارتقاهای نقش در انتظار برای دستگاه‌هایی که از قبل جفت شده‌اند
    - ارتقاهای scope در انتظار برای دستگاه‌هایی که از قبل جفت شده‌اند
    - تعمیرهای ناسازگاری کلید عمومی که در آن‌ها شناسه دستگاه هنوز مطابقت دارد اما هویت دستگاه دیگر با رکورد تأییدشده مطابقت ندارد
    - رکوردهای جفت‌شده‌ای که برای یک نقش تأییدشده توکن فعال ندارند
    - توکن‌های جفت‌شده‌ای که scopeهایشان از baseline جفت‌سازی تأییدشده منحرف شده است
    - ورودی‌های cache محلی device-token برای ماشین فعلی که قدیمی‌تر از یک چرخش توکن سمت gateway هستند یا metadata scope مانده دارند

    Doctor درخواست‌های جفت‌سازی را auto-approve نمی‌کند و توکن‌های دستگاه را auto-rotate نمی‌کند. در عوض مراحل بعدی دقیق را چاپ می‌کند:

    - درخواست‌های در انتظار را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک توکن تازه را با `openclaw devices rotate --device <deviceId> --role <role>` بچرخانید
    - یک رکورد مانده را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این حفره رایج "از قبل جفت شده اما هنوز pairing required دریافت می‌کند" را می‌بندد: doctor اکنون جفت‌سازی نخستین‌بار را از ارتقاهای نقش/scope در انتظار و از انحراف توکن/هویت دستگاه مانده متمایز می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک provider بدون allowlist برای DMها باز است، یا وقتی یک policy به شکل خطرناک پیکربندی شده است هشدار منتشر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان سرویس کاربر systemd اجرا شود، doctor مطمئن می‌شود lingering فعال است تا gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (Skills، Pluginها، و دایرکتوری‌های legacy)">
    Doctor خلاصه‌ای از وضعیت workspace را برای عامل پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: skillهای واجد شرایط، دارای requirements گم‌شده، و مسدودشده توسط allowlist را می‌شمارد.
    - **دایرکتوری‌های workspace legacy**: وقتی `~/openclaw` یا دایرکتوری‌های workspace legacy دیگر در کنار workspace فعلی وجود داشته باشند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای فعال/غیرفعال/دارای خطا را می‌شمارد؛ شناسه‌های Plugin را برای هر خطا فهرست می‌کند؛ قابلیت‌های bundle plugin را گزارش می‌دهد.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را علامت‌گذاری می‌کند که با runtime فعلی مشکلات سازگاری دارند.
    - **تشخیص‌های Plugin**: هر هشدار یا خطای زمان بارگذاری منتشرشده توسط رجیستری Plugin را نمایان می‌کند.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا فایل‌های زمینه تزریق‌شده دیگر) نزدیک یا بالاتر از بودجه کاراکتر پیکربندی‌شده هستند یا نه. برای هر فایل شمارش کاراکتر خام در برابر تزریق‌شده، درصد truncation، علت truncation (`max/file` یا `max/total`)، و کل کاراکترهای تزریق‌شده را به‌عنوان کسری از بودجه کل گزارش می‌دهد. وقتی فایل‌ها truncate شده باشند یا نزدیک حد باشند، doctor نکته‌هایی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کانال مانده">
    وقتی `openclaw doctor --fix` یک Plugin کانال گم‌شده را حذف می‌کند، پیکربندی dangling با scope کانال را هم که به آن Plugin اشاره کرده بود حذف می‌کند: ورودی‌های `channels.<id>`، اهداف Heartbeat که نام کانال را آورده بودند، و overrideهای `agents.*.models["<channel>/*"]`. این از loopهای boot در Gateway جلوگیری می‌کند، جایی که runtime کانال از بین رفته اما پیکربندی هنوز از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند که آیا tab completion برای shell فعلی (zsh، bash، fish، یا PowerShell) نصب شده است یا نه:

    - اگر پروفایل shell از الگوی completion پویای کند (`source <(openclaw completion ...)`) استفاده کند، doctor آن را به نسخه سریع‌تر فایل cache ارتقا می‌دهد.
    - اگر completion در پروفایل پیکربندی شده باشد اما فایل cache گم شده باشد، doctor به‌طور خودکار cache را دوباره تولید می‌کند.
    - اگر هیچ completionای اصلاً پیکربندی نشده باشد، doctor درخواست نصب آن را می‌دهد (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای تولید دوباره cache به‌صورت دستی `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (توکن محلی)">
    Doctor آمادگی احراز هویت توکن gateway محلی را بررسی می‌کند.

    - اگر حالت توکن به یک توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، doctor پیشنهاد تولید یکی را می‌دهد.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما در دسترس نباشد، doctor هشدار می‌دهد و آن را با متن آشکار overwrite نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی هیچ token SecretRef پیکربندی نشده باشد تولید را اجباری می‌کند.

  </Accordion>
  <Accordion title="12b. تعمیرهای فقط‌خواندنی آگاه از SecretRef">
    برخی جریان‌های تعمیر باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار fail-fast در runtime بررسی کنند.

    - `openclaw doctor --fix` اکنون از همان مدل خلاصه فقط‌خواندنی SecretRef مانند دستورهای خانواده status برای تعمیرهای هدفمند پیکربندی استفاده می‌کند.
    - مثال: تعمیر `allowFrom` / `groupAllowFrom` `@username` در Telegram تلاش می‌کند وقتی اعتبارنامه‌های bot پیکربندی‌شده در دسترس باشند از آن‌ها استفاده کند.
    - اگر توکن bot Telegram از طریق SecretRef پیکربندی شده اما در مسیر دستور فعلی در دسترس نباشد، doctor گزارش می‌دهد که اعتبارنامه پیکربندی‌شده-اما-در‌دسترس‌نیست است و به‌جای crash کردن یا گزارش نادرست توکن به‌عنوان گم‌شده، auto-resolution را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی مجدد">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی gateway ناسالم به نظر برسد پیشنهاد راه‌اندازی مجدد آن را می‌دهد.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند که آیا provider embedding جست‌وجوی حافظه پیکربندی‌شده برای عامل پیش‌فرض آماده است یا نه. رفتار به backend و provider پیکربندی‌شده بستگی دارد:

    - **پس‌زمینه QMD**: بررسی می‌کند آیا فایل باینری `qmd` در دسترس و قابل شروع است یا نه. اگر نباشد، راهنمای رفع مشکل را، از جمله بسته npm و گزینه مسیر دستی فایل باینری، چاپ می‌کند.
    - **ارائه‌دهنده محلی صریح**: وجود یک فایل مدل محلی یا یک URL مدل راه‌دور/قابل‌دانلودِ شناخته‌شده را بررسی می‌کند. اگر موجود نباشد، پیشنهاد می‌کند به یک ارائه‌دهنده راه‌دور تغییر دهید.
    - **ارائه‌دهنده راه‌دور صریح** (`openai`، `voyage` و غیره): بررسی می‌کند کلید API در محیط یا مخزن احراز هویت وجود داشته باشد. اگر موجود نباشد، راهنمایی‌های عملی برای رفع مشکل چاپ می‌کند.
    - **ارائه‌دهنده خودکار**: ابتدا دسترس‌پذیری مدل محلی را بررسی می‌کند، سپس هر ارائه‌دهنده راه‌دور را به‌ترتیب انتخاب خودکار امتحان می‌کند.

    وقتی نتیجه کاوش cached Gateway در دسترس باشد (Gateway هنگام بررسی سالم بوده است)، doctor نتیجه آن را با پیکربندی قابل‌مشاهده برای CLI تطبیق می‌دهد و هرگونه مغایرت را یادداشت می‌کند. Doctor در مسیر پیش‌فرض یک embedding ping تازه شروع نمی‌کند؛ وقتی بررسی زنده ارائه‌دهنده را می‌خواهید، از فرمان وضعیت حافظه عمیق استفاده کنید.

    از `openclaw memory status --deep` برای تأیید آمادگی embedding در زمان اجرا استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک کاوش وضعیت کانال اجرا می‌کند و هشدارها را همراه با رفع‌های پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. ممیزی + ترمیم پیکربندی supervisor">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را برای پیش‌فرض‌های ناقص یا قدیمی (مثلاً وابستگی‌های network-online در systemd و تأخیر راه‌اندازی مجدد) بررسی می‌کند. وقتی مغایرتی پیدا کند، یک به‌روزرسانی پیشنهاد می‌کند و می‌تواند فایل service/task را با پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor درخواست تأیید می‌کند.
    - `openclaw doctor --yes` درخواست‌های ترمیم پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` رفع‌های پیشنهادی را بدون درخواست تأیید اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های سفارشی supervisor را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`، doctor را برای چرخه‌عمر سرویس Gateway فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌کند و ترمیم‌های غیرسرویسی را اجرا می‌کند، اما نصب/شروع/راه‌اندازی مجدد/bootstrap سرویس، بازنویسی‌های پیکربندی supervisor، و پاک‌سازی سرویس legacy را رد می‌کند، چون یک supervisor خارجی مالک آن چرخه‌عمر است.
    - در Linux، doctor هنگام فعال بودن واحد systemd Gateway متناظر، فراداده command/entrypoint را بازنویسی نمی‌کند. همچنین در اسکن سرویس تکراری، واحدهای اضافی غیرفعال و غیر-legacy شبیه Gateway را نادیده می‌گیرد تا فایل‌های سرویس همراه نویز پاک‌سازی ایجاد نکنند.
    - اگر token auth به token نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/ترمیم سرویس doctor، SecretRef را اعتبارسنجی می‌کند اما مقدارهای token متن ساده حل‌شده را در فراداده محیط سرویس supervisor پایدار نمی‌کند.
    - Doctor مقدارهای محیط سرویس مدیریت‌شده با `.env`/SecretRef را که نصب‌های قدیمی‌تر LaunchAgent، systemd یا Windows Scheduled Task به‌صورت inline جاسازی کرده‌اند تشخیص می‌دهد و فراداده سرویس را بازنویسی می‌کند تا آن مقدارها به‌جای تعریف supervisor از منبع زمان اجرا بارگذاری شوند.
    - Doctor تشخیص می‌دهد چه زمانی فرمان سرویس پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را ثابت نگه داشته است و فراداده سرویس را به port فعلی بازنویسی می‌کند.
    - اگر token auth به token نیاز داشته باشد و SecretRef پیکربندی‌شده token حل نشده باشد، doctor مسیر نصب/ترمیم را با راهنمایی عملی مسدود می‌کند.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/ترمیم را تا زمانی که mode صریحاً تنظیم شود مسدود می‌کند.
    - برای واحدهای user-systemd در Linux، بررسی‌های drift مربوط به token در doctor اکنون هنگام مقایسه فراداده احراز هویت سرویس، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شود.
    - ترمیم‌های سرویس Doctor از بازنویسی، توقف یا راه‌اندازی مجدد یک سرویس Gateway از فایل باینری قدیمی‌تر OpenClaw خودداری می‌کنند، وقتی پیکربندی آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. به [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) مراجعه کنید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را اجباری کنید.

  </Accordion>
  <Accordion title="16. زمان اجرای Gateway + عیب‌یابی port">
    Doctor زمان اجرای سرویس (PID، آخرین وضعیت خروج) را بررسی می‌کند و وقتی سرویس نصب شده اما عملاً در حال اجرا نیست هشدار می‌دهد. همچنین برخوردهای port روی port Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل (Gateway از قبل در حال اجراست، SSH tunnel) را گزارش می‌دهد.
  </Accordion>
  <Accordion title="17. بهترین رویه‌های زمان اجرای Gateway">
    Doctor وقتی سرویس Gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود هشدار می‌دهد. کانال‌های WhatsApp + Telegram به Node نیاز دارند، و مسیرهای version-manager می‌توانند پس از ارتقا خراب شوند چون سرویس shell init شما را بارگذاری نمی‌کند. Doctor پیشنهاد می‌کند وقتی نصب system Node در دسترس است (Homebrew/apt/choco)، به آن مهاجرت کنید.

    LaunchAgentهای macOS که تازه نصب یا ترمیم شده‌اند، به‌جای کپی کردن PATH پوسته تعاملی، از یک PATH سیستمی canonical (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین Volta، asdf، fnm، pnpm و دیگر دایرکتوری‌های version-manager تعیین نمی‌کنند که فرایندهای فرزند Node به کدام مسیر resolve شوند. سرویس‌های Linux همچنان ریشه‌های محیطی صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های پایدار user-bin را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌شده version-manager فقط وقتی روی دیسک وجود داشته باشند در PATH سرویس نوشته می‌شوند.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی + فراداده wizard">
    Doctor هر تغییر پیکربندی را پایدار می‌کند و برای ثبت اجرای doctor، فراداده wizard را مهر می‌زند.
  </Accordion>
  <Accordion title="19. نکته‌های workspace (پشتیبان‌گیری + سیستم حافظه)">
    Doctor وقتی سیستم حافظه workspace موجود نباشد آن را پیشنهاد می‌کند و اگر workspace از قبل زیر git نباشد یک نکته پشتیبان‌گیری چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و پشتیبان‌گیری git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook مربوط به Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
