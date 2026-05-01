---
read_when:
    - افزودن یا اصلاح مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'دستور doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل تعمیر'
title: عیب‌یاب
x-i18n:
    generated_at: "2026-05-01T11:46:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: eef5715d485609fa60bdb4aa97ee441b053a60519b9dea03b0c8ec09db157474
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

    پیش‌فرض‌ها را بدون پرسش می‌پذیرد (از جمله مراحل تعمیر راه‌اندازی مجدد/سرویس/sandbox در صورت کاربرد).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    تعمیرهای پیشنهادی را بدون پرسش اعمال می‌کند (تعمیرها + راه‌اندازی مجدد در موارد امن).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    تعمیرهای تهاجمی را نیز اعمال می‌کند (پیکربندی‌های supervisor سفارشی را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    بدون پرسش اجرا می‌شود و فقط مهاجرت‌های امن را اعمال می‌کند (نرمال‌سازی پیکربندی + جابه‌جایی وضعیت روی دیسک). اقدام‌های راه‌اندازی مجدد/سرویس/sandbox را که به تأیید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های Gateway اضافی اسکن می‌کند (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید پیش از نوشتن، تغییرات را بررسی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## چه کاری انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، UI، و به‌روزرسانی‌ها">
    - به‌روزرسانی اختیاری پیش از اجرا برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل UI (وقتی schema پروتکل جدیدتر باشد، Control UI را دوباره می‌سازد).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/ناموجود/مسدود) و وضعیت plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - نرمال‌سازی پیکربندی برای مقادیر قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی Chrome extension و آمادگی Chrome MCP.
    - هشدارهای بازنویسی provider در OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - هشدارهای سایه‌اندازی Codex OAuth (`models.providers.openai-codex`).
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OpenAI Codex OAuth.
    - هشدارهای فهرست مجاز plugin/tool وقتی `plugins.allow` محدودکننده است اما سیاست tool همچنان wildcard یا toolهای متعلق به plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/WhatsApp auth).
    - مهاجرت کلید قرارداد manifest قدیمی plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت ذخیره‌گاه Cron قدیمی (`jobId`, `schedule.cron`, فیلدهای delivery/payload سطح بالا، payload `provider`، jobهای fallback ساده webhook با `notify: true`).
    - مهاجرت runtime-policy قدیمی agent به `agents.defaults.agentRuntime` و `agents.list[].agentRuntime`.
    - پاک‌سازی پیکربندی plugin قدیمی وقتی pluginها فعال هستند؛ وقتی `plugins.enabled=false`، ارجاع‌های قدیمی plugin به‌عنوان پیکربندی مهار بی‌اثر در نظر گرفته و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل قفل session و پاک‌سازی قفل‌های قدیمی.
    - تعمیر transcriptهای session برای شاخه‌های تکراری prompt-rewrite که توسط buildهای تحت‌تأثیر 2026.4.24 ایجاد شده‌اند.
    - شناسایی tombstone بازیابی راه‌اندازی مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌سازی پرچم‌های بازیابی لغوشده قدیمی تا startup همچنان child را restart-aborted در نظر نگیرد.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (sessions، transcripts، state dir).
    - بررسی مجوزهای فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت auth مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای در حال انقضا را تازه‌سازی کند، و وضعیت‌های cooldown/disabled برای auth-profile را گزارش می‌دهد.
    - شناسایی workspace dir اضافی (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و supervisorها">
    - تعمیر تصویر sandbox وقتی sandboxing فعال است.
    - مهاجرت سرویس قدیمی و شناسایی Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های runtime برای Gateway (سرویس نصب شده اما اجرا نمی‌شود؛ برچسب launchd cache شده).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا probe می‌شود).
    - ممیزی پیکربندی supervisor (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط embedded proxy برای سرویس‌های Gateway که مقادیر shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را هنگام نصب یا به‌روزرسانی ضبط کرده‌اند.
    - بررسی‌های بهترین رویه runtime برای Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی تداخل port در Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="Auth، امنیت، و pairing">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های auth در Gateway برای حالت token محلی (وقتی منبع token وجود ندارد، تولید token را پیشنهاد می‌کند؛ پیکربندی‌های SecretRef token را بازنویسی نمی‌کند).
    - شناسایی مشکل pairing دستگاه (درخواست‌های pair بار اول در انتظار، ارتقاهای role/scope در انتظار، drift قدیمی cache محلی device-token، و drift احراز هویت رکورد paired).

  </Accordion>
  <Accordion title="Workspace و shell">
    - بررسی systemd linger در Linux.
    - بررسی اندازه فایل bootstrap در workspace (هشدارهای truncation/near-limit برای فایل‌های context).
    - بررسی وضعیت shell completion و نصب/ارتقای خودکار.
    - بررسی آمادگی provider برای memory search embedding (مدل محلی، کلید API راه‌دور، یا binary QMD).
    - بررسی‌های نصب از source (ناسازگاری pnpm workspace، نبود assets برای UI، نبود binary مربوط به tsx).
    - پیکربندی به‌روزشده + metadata ویزارد را می‌نویسد.

  </Accordion>
</AccordionGroup>

## backfill و reset در Dreams UI

صحنه Dreams در Control UI شامل اقدام‌های **Backfill**، **Reset**، و **Clear Grounded** برای گردش کار grounded dreaming است. این اقدام‌ها از روش‌های RPC به سبک doctor در Gateway استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کارهایی که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر grounded REM diary را اجرا می‌کند، و ورودی‌های backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان ورودی‌های diary علامت‌گذاری‌شده backfill را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط ورودی‌های کوتاه‌مدت staged grounded-only را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه جمع نکرده‌اند.

کارهایی که به‌تنهایی انجام **نمی‌دهند**:

- `MEMORY.md` را ویرایش نمی‌کنند
- مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- کاندیداهای grounded را به‌طور خودکار وارد ذخیره‌گاه promotion کوتاه‌مدت زنده نمی‌کنند، مگر اینکه ابتدا مسیر staged CLI را صریحاً اجرا کنید

اگر می‌خواهید replay تاریخی grounded روی مسیر promotion عمیق عادی اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار کاندیداهای durable grounded را در ذخیره‌گاه dreaming کوتاه‌مدت stage می‌کند، در حالی که `DREAMS.md` را به‌عنوان سطح review نگه می‌دارد.

## رفتار و منطق تفصیلی

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک git checkout باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. نرمال‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override ویژه کانال)، doctor آن‌ها را به schema فعلی نرمال می‌کند.

    این شامل فیلدهای تخت قدیمی Talk نیز می‌شود. پیکربندی عمومی فعلی Talk برابر است با `talk.provider` + `talk.providers.<provider>`. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را در map مربوط به provider بازنویسی می‌کند.

    Doctor همچنین وقتی `plugins.allow` غیرخالی است و سیاست tool از
    wildcard یا ورودی‌های tool متعلق به plugin استفاده می‌کند هشدار می‌دهد. `tools.allow: ["*"]` فقط با toolهای
    pluginهایی مطابقت دارد که واقعاً load می‌شوند؛ این مورد فهرست مجاز انحصاری plugin را دور نمی‌زند.

  </Accordion>
  <Accordion title="2. مهاجرت‌های کلید پیکربندی قدیمی">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    Doctor این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شدند.
    - مهاجرت اعمال‌شده را نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با schema به‌روزشده بازنویسی می‌کند.

    Gateway نیز هنگام startup، وقتی قالب پیکربندی قدیمی را شناسایی کند، مهاجرت‌های doctor را به‌طور خودکار اجرا می‌کند، بنابراین پیکربندی‌های قدیمی بدون دخالت دستی تعمیر می‌شوند. مهاجرت‌های ذخیره‌گاه Cron job توسط `openclaw doctor --fix` انجام می‌شوند.

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
    - برای کانال‌هایی که `accounts` نام‌دار دارند اما هنوز مقادیر کانال سطح بالای تک‌حسابی باقی مانده است، آن مقادیر scoped به حساب را به حساب ارتقایافته‌ای منتقل کنید که برای آن کانال انتخاب شده است (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک هدف نام‌دار/پیش‌فرض موجود و مطابق را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` را حذف کنید؛ برای timeoutهای کند provider/model از `models.providers.<id>.timeoutSeconds` استفاده کنید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` را حذف کنید (تنظیم قدیمی relay extension)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی gateway همچنین providerهایی را که `api` آن‌ها روی یک مقدار enum آینده یا ناشناخته تنظیم شده است، به‌جای fail کردن بسته، نادیده می‌گیرد)

    هشدارهای Doctor همچنین راهنمای account-default را برای کانال‌های چندحسابی شامل می‌شود:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، doctor هشدار می‌دهد که routing جایگزین می‌تواند یک حساب غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی یک account ID ناشناخته تنظیم شده باشد، doctor هشدار می‌دهد و account IDهای پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. جایگزینی‌های provider در OpenCode">
    اگر `models.providers.opencode`،‏ `opencode-zen`، یا `opencode-go` را دستی اضافه کرده باشید، این کار catalog داخلی OpenCode از `@mariozechner/pi-ai` را override می‌کند. این می‌تواند مدل‌ها را به API اشتباه وادار کند یا هزینه‌ها را صفر کند. Doctor هشدار می‌دهد تا بتوانید override را حذف کنید و routing + هزینه‌های API به‌ازای هر مدل را بازیابی کنید.
  </Accordion>
  <Accordion title="2c. مهاجرت مرورگر و آمادگی Chrome MCP">
    اگر پیکربندی مرورگر شما هنوز به مسیر حذف‌شده Chrome extension اشاره می‌کند، doctor آن را به مدل attach فعلی Chrome MCP محلیِ میزبان عادی‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    Doctor همچنین هنگام استفاده از `defaultProfile: "user"` یا یک پروفایل `existing-session` پیکربندی‌شده، مسیر Chrome MCP محلیِ میزبان را بازبینی می‌کند:

    - بررسی می‌کند که آیا Google Chrome برای پروفایل‌های پیش‌فرض auto-connect روی همان میزبان نصب شده است یا نه
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی کمتر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند remote debugging را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`،‏ `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    Doctor نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP محلیِ میزبان همچنان به این موارد نیاز دارد:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان gateway/node
    - مرورگری که به‌صورت محلی در حال اجرا باشد
    - remote debugging فعال در همان مرورگر
    - تأیید نخستین اعلان رضایت attach در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای attach محلی است. Existing-session محدودیت‌های مسیر فعلی Chrome MCP را حفظ می‌کند؛ مسیرهای پیشرفته مانند `responsebody`، خروجی PDF، رهگیری download، و batch actionها همچنان به یک مرورگر مدیریت‌شده یا پروفایل raw CDP نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser، یا دیگر جریان‌های headless اعمال **نمی‌شود**. آن‌ها همچنان از raw CDP استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. پیش‌نیازهای OAuth TLS">
    وقتی یک پروفایل OpenAI Codex OAuth پیکربندی شده باشد، doctor endpoint مجوزدهی OpenAI را probe می‌کند تا تأیید کند stack محلی Node/OpenSSL TLS می‌تواند زنجیره certificate را validate کند. اگر probe با خطای certificate شکست بخورد (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، certificate منقضی‌شده، یا certificate self-signed)، doctor راهنمای رفع مشکل مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، راه‌حل معمولاً `brew postinstall ca-certificates` است. با `--deep`، probe حتی اگر gateway سالم باشد هم اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. جایگزینی‌های provider در Codex OAuth">
    اگر قبلاً تنظیمات transport قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، آن‌ها می‌توانند مسیر داخلی provider در Codex OAuth را که نسخه‌های جدیدتر به‌صورت خودکار استفاده می‌کنند shadow کنند. Doctor وقتی آن تنظیمات transport قدیمی را در کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید override transport کهنه را حذف یا بازنویسی کنید و رفتار داخلی routing/fallback را برگردانید. proxyهای سفارشی و overrideهای فقط header همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. هشدارهای مسیر Plugin در Codex">
    وقتی Plugin همراه Codex فعال باشد، doctor همچنین بررسی می‌کند که آیا refهای مدل primary به‌شکل `openai-codex/*` هنوز از طریق runner پیش‌فرض PI resolve می‌شوند یا نه. وقتی می‌خواهید auth از نوع Codex OAuth/subscription را از طریق PI داشته باشید، این ترکیب معتبر است، اما به‌راحتی با harness بومی app-server در Codex اشتباه گرفته می‌شود. Doctor هشدار می‌دهد و به شکل صریح app-server اشاره می‌کند: `openai/*` به‌همراه `agentRuntime.id: "codex"` یا `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor این مورد را خودکار repair نمی‌کند، چون هر دو مسیر معتبرند:

    - `openai-codex/*` + PI یعنی «از auth نوع Codex OAuth/subscription از طریق runner عادی OpenClaw استفاده کن.»
    - `openai/*` + `runtime: "codex"` یعنی «turn جاسازی‌شده را از طریق app-server بومی Codex اجرا کن.»
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از chat کنترل یا bind کن.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از adapter خارجی ACP/acpx استفاده کن.»

    اگر هشدار ظاهر شد، مسیری را که قصدش را داشتید انتخاب کنید و config را دستی ویرایش کنید. وقتی PI Codex OAuth عمدی است، هشدار را همان‌طور نگه دارید.

  </Accordion>
  <Accordion title="3. مهاجرت‌های وضعیت قدیمی (چیدمان دیسک)">
    Doctor می‌تواند چیدمان‌های قدیمی‌تر روی دیسک را به ساختار فعلی migrate کند:

    - محل ذخیره sessionها + transcriptها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری agent:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت auth در WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (account id پیش‌فرض: `default`)

    این migrationها best-effort و idempotent هستند؛ doctor وقتی هر پوشه قدیمی را به‌عنوان backup باقی بگذارد هشدار صادر می‌کند. Gateway/CLI نیز در startup، sessionهای قدیمی + دایرکتوری agent را به‌صورت خودکار migrate می‌کند تا history/auth/models بدون اجرای دستی doctor در مسیر per-agent قرار بگیرند. auth مربوط به WhatsApp عمداً فقط از طریق `openclaw doctor` migrate می‌شود. عادی‌سازی talk provider/provider-map اکنون با structural equality مقایسه می‌کند، بنابراین diffهایی که فقط ناشی از ترتیب کلیدها هستند دیگر تغییرات تکراری و بی‌اثر `doctor --fix` را فعال نمی‌کنند.

  </Accordion>
  <Accordion title="3a. مهاجرت‌های manifest قدیمی Plugin">
    Doctor همه manifestهای Plugin نصب‌شده را برای کلیدهای capability سطح بالای deprecated (`speechProviders`،‏ `realtimeTranscriptionProviders`،‏ `realtimeVoiceProviders`،‏ `mediaUnderstandingProviders`،‏ `imageGenerationProviders`،‏ `videoGenerationProviders`،‏ `webFetchProviders`،‏ `webSearchProviders`) scan می‌کند. وقتی پیدا شوند، پیشنهاد می‌دهد آن‌ها را به object `contracts` منتقل کند و فایل manifest را درجا بازنویسی کند. این migration idempotent است؛ اگر کلید `contracts` از قبل همان مقدارها را داشته باشد، کلید قدیمی بدون duplication داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های ذخیره‌گاه Cron قدیمی">
    Doctor همچنین store مربوط به cron jobها را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی override شده باشد) برای شکل‌های قدیمی job که scheduler هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی cron شامل این موارد است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload سطح بالا (`message`،‏ `model`،‏ `thinking`، ...) → `payload`
    - فیلدهای delivery سطح بالا (`deliver`،‏ `channel`،‏ `to`،‏ `provider`، ...) → `delivery`
    - aliasهای delivery برای payload `provider` → `delivery.channel` صریح
    - jobهای fallback ساده webhook قدیمی با `notify: true` → `delivery.mode="webhook"` صریح با `delivery.to=cron.webhook`

    Doctor فقط زمانی jobهای `notify: true` را خودکار migrate می‌کند که بتواند این کار را بدون تغییر رفتار انجام دهد. اگر یک job، fallback قدیمی notify را با یک delivery mode غیر-webhook موجود ترکیب کند، doctor هشدار می‌دهد و آن job را برای بررسی دستی باقی می‌گذارد.

  </Accordion>
  <Accordion title="3c. پاک‌سازی lock در session">
    Doctor هر دایرکتوری session مربوط به agent را برای فایل‌های write-lock کهنه scan می‌کند؛ فایل‌هایی که وقتی یک session به‌طور غیرعادی خارج شده باقی مانده‌اند. برای هر lock file پیدا‌شده این موارد را گزارش می‌کند: مسیر، PID، اینکه PID هنوز زنده است یا نه، عمر lock، و اینکه stale در نظر گرفته می‌شود یا نه (PID مرده یا قدیمی‌تر از 30 دقیقه). در حالت `--fix` / `--repair`، lock fileهای stale را خودکار حذف می‌کند؛ در غیر این صورت یک یادداشت چاپ می‌کند و به شما می‌گوید با `--fix` دوباره اجرا کنید.
  </Accordion>
  <Accordion title="3d. repair شاخه transcript در session">
    Doctor فایل‌های JSONL مربوط به sessionهای agent را برای شکل شاخه duplicated ایجادشده توسط باگ بازنویسی transcript prompt در 2026.4.24 scan می‌کند: یک turn کاربر رهاشده با context runtime داخلی OpenClaw به‌همراه sibling فعال که همان prompt قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل affected کنار فایل اصلی backup می‌گیرد و transcript را به شاخه فعال بازنویسی می‌کند تا خواننده‌های history و memory در gateway دیگر turnهای duplicated نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی وضعیت (پایداری session، routing، و ایمنی)">
    دایرکتوری state مرکز عملیاتی سیستم است. اگر ناپدید شود، sessionها، credentials، logs، و config را از دست می‌دهید (مگر اینکه جای دیگری backup داشته باشید).

    Doctor بررسی می‌کند:

    - **دایرکتوری وضعیت وجود ندارد**: درباره از دست رفتن فاجعه‌بار وضعیت هشدار می‌دهد، برای ایجاد دوباره دایرکتوری درخواست تأیید می‌کند، و یادآوری می‌کند که نمی‌تواند داده‌های ازدست‌رفته را بازیابی کند.
    - **مجوزهای دایرکتوری وضعیت**: قابلیت نوشتن را بررسی می‌کند؛ پیشنهاد می‌دهد مجوزها را ترمیم کند (و وقتی ناسازگاری مالک/گروه تشخیص داده شود، راهنمای `chown` صادر می‌کند).
    - **دایرکتوری وضعیت همگام‌سازی‌شده با ابر در macOS**: وقتی وضعیت زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve می‌شود هشدار می‌دهد، چون مسیرهای متکی بر همگام‌سازی می‌توانند باعث I/O کندتر و رقابت‌های قفل/همگام‌سازی شوند.
    - **دایرکتوری وضعیت SD یا eMMC در Linux**: وقتی وضعیت به یک منبع mount از نوع `mmcblk*` resolve می‌شود هشدار می‌دهد، چون I/O تصادفی متکی بر SD یا eMMC می‌تواند هنگام نوشتن نشست و اعتبارنامه کندتر باشد و فرسایش بیشتری ایجاد کند.
    - **دایرکتوری‌های نشست وجود ندارند**: `sessions/` و دایرکتوری ذخیره نشست برای پایدارسازی تاریخچه و جلوگیری از خرابی‌های `ENOENT` لازم هستند.
    - **ناسازگاری رونوشت**: وقتی ورودی‌های اخیر نشست فایل‌های رونوشت گم‌شده دارند هشدار می‌دهد.
    - **نشست اصلی "JSONL یک‌خطی"**: وقتی رونوشت اصلی فقط یک خط دارد علامت‌گذاری می‌کند (تاریخچه در حال انباشته شدن نیست).
    - **چند دایرکتوری وضعیت**: وقتی چند پوشه `~/.openclaw` در دایرکتوری‌های home وجود دارد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره می‌کند هشدار می‌دهد (تاریخچه می‌تواند بین نصب‌ها تقسیم شود).
    - **یادآور حالت راه‌دور**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند که آن را روی میزبان راه‌دور اجرا کنید (وضعیت آنجا قرار دارد).
    - **مجوزهای فایل پیکربندی**: اگر `~/.openclaw/openclaw.json` برای گروه/همه قابل خواندن باشد هشدار می‌دهد و پیشنهاد می‌دهد آن را به `600` محدود کند.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    Doctor پروفایل‌های OAuth را در ذخیره‌گاه احراز هویت بررسی می‌کند، وقتی توکن‌ها در حال انقضا/منقضی‌شده هستند هشدار می‌دهد، و وقتی امن باشد می‌تواند آن‌ها را تازه‌سازی کند. اگر پروفایل OAuth/توکن Anthropic کهنه باشد، یک کلید API برای Anthropic یا مسیر setup-token Anthropic را پیشنهاد می‌دهد. درخواست‌های تازه‌سازی فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های تازه‌سازی را رد می‌کند.

    وقتی تازه‌سازی OAuth به‌صورت دائمی شکست می‌خورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا وقتی provider از شما می‌خواهد دوباره وارد شوید)، doctor گزارش می‌دهد که احراز هویت دوباره لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    Doctor همچنین پروفایل‌های احراز هویتی را گزارش می‌کند که به‌طور موقت به دلایل زیر قابل استفاده نیستند:

    - cooldownهای کوتاه (محدودیت نرخ/timeout/شکست‌های احراز هویت)
    - غیرفعالسازی‌های طولانی‌تر (شکست‌های صورتحساب/اعتبار)

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor ارجاع مدل را در برابر catalog و allowlist اعتبارسنجی می‌کند و وقتی resolve نمی‌شود یا مجاز نیست هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. ترمیم تصویر sandbox">
    وقتی sandboxing فعال باشد، doctor تصاویر Docker را بررسی می‌کند و اگر تصویر فعلی وجود نداشته باشد پیشنهاد می‌دهد بسازد یا به نام‌های legacy جابه‌جا شود.
  </Accordion>
  <Accordion title="7b. وابستگی‌های زمان اجرای Pluginهای bundled">
    Doctor وابستگی‌های زمان اجرا را فقط برای Pluginهای bundled بررسی می‌کند که در پیکربندی فعلی فعال هستند یا با پیش‌فرض manifest bundled خود فعال شده‌اند؛ برای مثال `plugins.entries.discord.enabled: true`، `channels.discord.enabled: true` legacy، `models.providers.*` پیکربندی‌شده / ارجاع‌های مدل agent، یا یک Plugin bundled فعال‌شده به‌صورت پیش‌فرض بدون مالکیت provider. اگر موردی گم شده باشد، doctor بسته‌ها را گزارش می‌دهد و در حالت `openclaw doctor --fix` / `openclaw doctor --repair` آن‌ها را نصب می‌کند. Pluginهای خارجی همچنان از `openclaw plugins install` / `openclaw plugins update` استفاده می‌کنند؛ doctor وابستگی‌ها را برای مسیرهای دلخواه Plugin نصب نمی‌کند.

    هنگام ترمیم doctor، نصب‌های npm وابستگی زمان اجرای bundled در نشست‌های TTY پیشرفت spinner و در خروجی piped/headless پیشرفت خطی دوره‌ای گزارش می‌دهند. راه‌اندازی Gateway و بارگذاری دوباره پیکربندی پیش از import کردن ماژول‌های زمان اجرای Pluginهای bundled وارد حالت plugin-plan می‌شوند؛ importهای عادی زمان اجرا فقط برای verify هستند و ترمیم package-manager را اجرا نمی‌کنند. این نصب‌ها به ریشه نصب زمان اجرای Plugin محدود می‌شوند، با scripts غیرفعال اجرا می‌شوند، package lock نمی‌نویسند، و با یک قفل install-root محافظت می‌شوند تا شروع‌های همزمان CLI یا Gateway هم‌زمان همان درخت `node_modules` را تغییر ندهند. قفل‌های legacy کهنه از شروع‌های Docker/container کشته‌شده وقتی metadata مالکشان نتواند یک incarnation فرایند فعلی را اثبات کند و فایل‌های قفل قدیمی باشند بازپس گرفته می‌شوند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنمای پاک‌سازی">
    Doctor سرویس‌های gateway legacy (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد می‌دهد آن‌ها را حذف کند و سرویس OpenClaw را با پورت gateway فعلی نصب کند. همچنین می‌تواند سرویس‌های اضافی شبیه gateway را اسکن کند و راهنمای پاک‌سازی چاپ کند. سرویس‌های gateway OpenClaw با نام profile، درجه‌یک محسوب می‌شوند و به‌عنوان "extra" علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس gateway سطح کاربر وجود نداشته باشد اما یک سرویس gateway سطح سیستم OpenClaw وجود داشته باشد، doctor به‌طور خودکار سرویس سطح کاربر دومی نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس مورد تکراری را حذف کنید یا وقتی یک supervisor سیستمی مالک چرخه عمر gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Startup Matrix">
    وقتی یک حساب کانال Matrix یک مهاجرت وضعیت legacy معلق یا قابل اقدام دارد، doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس مراحل مهاجرت best-effort را اجرا می‌کند: مهاجرت وضعیت Matrix legacy و آماده‌سازی وضعیت رمزگذاری‌شده legacy. هر دو مرحله غیرکشنده هستند؛ خطاها log می‌شوند و راه‌اندازی ادامه می‌یابد. در حالت فقط‌خواندنی (`openclaw doctor` بدون `--fix`) این بررسی کاملاً رد می‌شود.
  </Accordion>
  <Accordion title="8c. جفت‌سازی دستگاه و انحراف احراز هویت">
    Doctor اکنون وضعیت جفت‌سازی دستگاه را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    آنچه گزارش می‌دهد:

    - درخواست‌های جفت‌سازی بار اول معلق
    - ارتقاهای نقش معلق برای دستگاه‌هایی که قبلاً جفت شده‌اند
    - ارتقاهای scope معلق برای دستگاه‌هایی که قبلاً جفت شده‌اند
    - ترمیم‌های ناسازگاری کلید عمومی که در آن‌ها device id همچنان منطبق است اما هویت دستگاه دیگر با رکورد تأییدشده منطبق نیست
    - رکوردهای جفت‌شده که برای یک نقش تأییدشده توکن فعال ندارند
    - توکن‌های جفت‌شده‌ای که scopeهایشان از خط پایه جفت‌سازی تأییدشده منحرف شده است
    - ورودی‌های device-token محلی cacheشده برای ماشین فعلی که قدیمی‌تر از چرخش توکن سمت gateway هستند یا metadata scope کهنه دارند

    Doctor درخواست‌های جفت‌سازی را خودکار تأیید نمی‌کند و توکن‌های دستگاه را خودکار نمی‌چرخاند. به‌جای آن مراحل بعدی دقیق را چاپ می‌کند:

    - درخواست‌های معلق را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تأیید کنید
    - یک توکن تازه را با `openclaw devices rotate --device <deviceId> --role <role>` بچرخانید
    - یک رکورد کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره تأیید کنید

    این حفره رایج "قبلاً جفت شده اما هنوز pairing required دریافت می‌شود" را می‌بندد: doctor اکنون جفت‌سازی بار اول را از ارتقاهای نقش/scope معلق و از انحراف توکن/هویت دستگاه کهنه متمایز می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک provider بدون allowlist برای DMها باز است، یا وقتی یک policy به شکل خطرناکی پیکربندی شده است هشدار صادر می‌کند.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    اگر به‌عنوان یک سرویس کاربر systemd اجرا شود، doctor مطمئن می‌شود lingering فعال است تا gateway پس از logout زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (skills، plugins، و دایرکتوری‌های legacy)">
    Doctor خلاصه‌ای از وضعیت workspace را برای agent پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: skills واجد شرایط، با نیازمندی‌های گم‌شده، و مسدودشده توسط allowlist را می‌شمارد.
    - **دایرکتوری‌های workspace legacy**: وقتی `~/openclaw` یا دایرکتوری‌های workspace legacy دیگر کنار workspace فعلی وجود دارند هشدار می‌دهد.
    - **وضعیت Plugin**: Pluginهای فعال/غیرفعال/دارای خطا را می‌شمارد؛ شناسه‌های Plugin را برای هر خطا فهرست می‌کند؛ قابلیت‌های Plugin bundle را گزارش می‌دهد.
    - **هشدارهای سازگاری Plugin**: Pluginهایی را که با runtime فعلی مشکل سازگاری دارند علامت‌گذاری می‌کند.
    - **عیب‌یابی Plugin**: هر هشدار یا خطای زمان بارگذاری صادرشده توسط registry Plugin را نمایش می‌دهد.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا فایل‌های context تزریق‌شده دیگر) نزدیک یا بالاتر از بودجه کاراکتر پیکربندی‌شده هستند یا نه. برای هر فایل، شمارش کاراکتر خام در برابر تزریق‌شده، درصد truncation، علت truncation (`max/file` یا `max/total`)، و کل کاراکترهای تزریق‌شده را به‌عنوان کسری از بودجه کل گزارش می‌دهد. وقتی فایل‌ها truncate شده‌اند یا نزدیک محدودیت هستند، doctor نکاتی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی Plugin کانال کهنه">
    وقتی `openclaw doctor --fix` یک Plugin کانال گم‌شده را حذف می‌کند، پیکربندی dangling با scope کانال را که به آن Plugin ارجاع داده نیز حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های heartbeat که نام کانال را آورده‌اند، و overrideهای `agents.*.models["<channel>/*"]`. این کار از loopهای boot در Gateway جلوگیری می‌کند که در آن‌ها runtime کانال از بین رفته اما config همچنان از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند آیا tab completion برای shell فعلی (zsh، bash، fish، یا PowerShell) نصب شده است یا نه:

    - اگر profile shell از یک الگوی completion پویای کند استفاده کند (`source <(openclaw completion ...)`)، doctor آن را به نسخه سریع‌تر فایل cacheشده ارتقا می‌دهد.
    - اگر completion در profile پیکربندی شده باشد اما فایل cache وجود نداشته باشد، doctor به‌طور خودکار cache را بازتولید می‌کند.
    - اگر هیچ completionای اصلاً پیکربندی نشده باشد، doctor درخواست نصب آن را می‌دهد (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای بازتولید دستی cache، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های احراز هویت Gateway (توکن محلی)">
    Doctor آمادگی احراز هویت توکن gateway محلی را بررسی می‌کند.

    - اگر حالت توکن به یک توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، doctor پیشنهاد می‌دهد یکی تولید کند.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما در دسترس نباشد، doctor هشدار می‌دهد و آن را با plaintext بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی هیچ SecretRef توکنی پیکربندی نشده باشد تولید را مجبور می‌کند.

  </Accordion>
  <Accordion title="12b. ترمیم‌های فقط‌خواندنی آگاه از SecretRef">
    برخی جریان‌های ترمیم باید اعتبارنامه‌های پیکربندی‌شده را بدون تضعیف رفتار fail-fast زمان اجرا بررسی کنند.

    - `openclaw doctor --fix` اکنون برای ترمیم‌های هدفمند پیکربندی از همان مدل خلاصه فقط‌خواندنی SecretRef مانند فرمان‌های خانواده status استفاده می‌کند.
    - مثال: ترمیم `allowFrom` / `groupAllowFrom` `@username` در Telegram تلاش می‌کند وقتی اعتبارنامه‌های bot پیکربندی‌شده در دسترس هستند از آن‌ها استفاده کند.
    - اگر توکن bot در Telegram از طریق SecretRef پیکربندی شده اما در مسیر فرمان فعلی در دسترس نباشد، doctor گزارش می‌دهد که credential پیکربندی‌شده-اما-در‌دسترس‌نیست است و به‌جای crash کردن یا گزارش نادرست token به‌عنوان گم‌شده، auto-resolution را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + restart">
    Doctor یک بررسی سلامت اجرا می‌کند و وقتی gateway ناسالم به نظر برسد پیشنهاد می‌دهد آن را restart کند.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی حافظه">
    Doctor بررسی می‌کند آیا provider embedding جست‌وجوی حافظه پیکربندی‌شده برای agent پیش‌فرض آماده است یا نه. رفتار به backend و provider پیکربندی‌شده بستگی دارد:

    - **backend QMD**: بررسی می‌کند آیا binary `qmd` در دسترس و قابل راه‌اندازی است یا نه. اگر نه، راهنمای رفع شامل بسته npm و یک گزینه مسیر binary دستی را چاپ می‌کند.
    - **provider محلی صریح**: وجود یک فایل مدل محلی یا یک URL مدل راه‌دور/قابل دانلود شناخته‌شده را بررسی می‌کند. اگر گم شده باشد، پیشنهاد می‌دهد به یک provider راه‌دور جابه‌جا شوید.
    - **provider راه‌دور صریح** (`openai`، `voyage`، غیره): بررسی می‌کند یک کلید API در محیط یا ذخیره‌گاه احراز هویت وجود دارد. اگر گم شده باشد، راهنمای رفع قابل اقدام چاپ می‌کند.
    - **provider خودکار**: ابتدا دسترس‌پذیری مدل محلی را بررسی می‌کند، سپس هر provider راه‌دور را به ترتیب انتخاب خودکار امتحان می‌کند.

    هنگامی که نتیجه‌ی cached gateway probe در دسترس باشد (Gateway در زمان بررسی سالم بوده باشد)، doctor نتیجه‌ی آن را با پیکربندی قابل مشاهده برای CLI تطبیق می‌دهد و هرگونه مغایرت را گزارش می‌کند. Doctor در مسیر پیش‌فرض یک embedding ping تازه شروع نمی‌کند؛ وقتی بررسی زنده‌ی provider می‌خواهید، از فرمان وضعیت deep memory استفاده کنید.

    برای تأیید آمادگی embedding در زمان اجرا از `openclaw memory status --deep` استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت کانال">
    اگر Gateway سالم باشد، doctor یک channel status probe اجرا می‌کند و هشدارها را همراه با اصلاحات پیشنهادی گزارش می‌کند.
  </Accordion>
  <Accordion title="15. ممیزی و تعمیر پیکربندی supervisor">
    Doctor پیکربندی supervisor نصب‌شده (launchd/systemd/schtasks) را از نظر پیش‌فرض‌های حذف‌شده یا قدیمی (مثلاً وابستگی‌های systemd network-online و تأخیر restart) بررسی می‌کند. وقتی ناسازگاری پیدا کند، به‌روزرسانی را توصیه می‌کند و می‌تواند service file/task را مطابق پیش‌فرض‌های فعلی بازنویسی کند.

    نکات:

    - `openclaw doctor` پیش از بازنویسی پیکربندی supervisor از شما تأیید می‌گیرد.
    - `openclaw doctor --yes` promptهای تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --repair` اصلاحات توصیه‌شده را بدون prompt اعمال می‌کند.
    - `openclaw doctor --repair --force` پیکربندی‌های supervisor سفارشی را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor را برای چرخه‌ی عمر سرویس Gateway در حالت فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌کند و تعمیرات غیرسرویسی را اجرا می‌کند، اما نصب/شروع/restart/bootstrap سرویس، بازنویسی پیکربندی supervisor و پاک‌سازی سرویس‌های قدیمی را رد می‌کند، چون یک supervisor خارجی مالک آن چرخه‌ی عمر است.
    - در Linux، doctor هنگامی که unit منطبق systemd gateway فعال است، metadata فرمان/entrypoint را بازنویسی نمی‌کند. همچنین در اسکن duplicate-service، unitهای اضافی gateway-like غیرفعال و غیرقدیمی را نادیده می‌گیرد تا service fileهای همراه نویز پاک‌سازی ایجاد نکنند.
    - اگر token auth به token نیاز داشته باشد و `gateway.auth.token` با SecretRef مدیریت شود، نصب/تعمیر سرویس doctor، SecretRef را اعتبارسنجی می‌کند اما مقدار token متن ساده‌ی resolveشده را در metadata محیط سرویس supervisor ذخیره نمی‌کند.
    - Doctor مقدارهای محیط سرویس مبتنی بر `.env`/SecretRef مدیریت‌شده‌ای را که نصب‌های قدیمی‌تر LaunchAgent، systemd، یا Windows Scheduled Task به‌صورت inline جاسازی کرده‌اند تشخیص می‌دهد و metadata سرویس را بازنویسی می‌کند تا آن مقدارها به‌جای تعریف supervisor از منبع runtime بارگذاری شوند.
    - Doctor تشخیص می‌دهد چه زمانی فرمان سرویس پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را pin کرده است و metadata سرویس را به پورت فعلی بازنویسی می‌کند.
    - اگر token auth به token نیاز داشته باشد و SecretRef پیکربندی‌شده‌ی token resolve نشده باشد، doctor مسیر نصب/تعمیر را با راهنمایی قابل اقدام مسدود می‌کند.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، doctor نصب/تعمیر را تا زمانی که mode صراحتاً تنظیم شود مسدود می‌کند.
    - برای Linux user-systemd unitها، بررسی‌های drift توکن doctor اکنون هنگام مقایسه‌ی metadata احراز هویت سرویس، هر دو منبع `Environment=` و `EnvironmentFile=` را شامل می‌شود.
    - تعمیرات سرویس doctor از بازنویسی، توقف یا restart یک سرویس Gateway از باینری قدیمی‌تر OpenClaw خودداری می‌کند، وقتی پیکربندی آخرین‌بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را اجبار کنید.

  </Accordion>
  <Accordion title="16. تشخیص‌های runtime و پورت Gateway">
    Doctor runtime سرویس (PID، آخرین exit status) را بررسی می‌کند و وقتی سرویس نصب شده اما واقعاً در حال اجرا نیست هشدار می‌دهد. همچنین برخوردهای پورت روی پورت Gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل (Gateway از قبل در حال اجراست، SSH tunnel) را گزارش می‌کند.
  </Accordion>
  <Accordion title="17. بهترین شیوه‌های runtime Gateway">
    Doctor هنگامی هشدار می‌دهد که سرویس Gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه‌گردان (`nvm`، `fnm`، `volta`، `asdf` و غیره) اجرا شود. کانال‌های WhatsApp و Telegram به Node نیاز دارند، و مسیرهای version-manager می‌توانند پس از ارتقا خراب شوند، چون سرویس shell init شما را بارگذاری نمی‌کند. Doctor در صورت در دسترس بودن یک نصب system Node (Homebrew/apt/choco)، مهاجرت به آن را پیشنهاد می‌دهد.

    سرویس‌های تازه نصب‌شده یا تعمیرشده، ریشه‌های محیط صریح (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های user-bin پایدار را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌شده‌ی version-manager فقط وقتی در PATH سرویس نوشته می‌شوند که آن دایرکتوری‌ها روی دیسک وجود داشته باشند. این کار PATH تولیدشده‌ی supervisor را با همان ممیزی minimal-PATH که doctor بعداً اجرا می‌کند هم‌راستا نگه می‌دارد.

  </Accordion>
  <Accordion title="18. نوشتن پیکربندی و metadata جادوگر">
    Doctor هرگونه تغییر پیکربندی را ذخیره می‌کند و برای ثبت اجرای doctor، metadata جادوگر را مهر می‌زند.
  </Accordion>
  <Accordion title="19. نکته‌های workspace (backup + memory system)">
    Doctor وقتی workspace memory system وجود ندارد آن را پیشنهاد می‌دهد و اگر workspace از قبل زیر git نباشد، نکته‌ای برای backup چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و backup با git (GitHub خصوصی یا GitLab توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [راهنمای اجرایی Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
