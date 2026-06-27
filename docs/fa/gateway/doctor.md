---
read_when:
    - افزودن یا اصلاح مهاجرت‌های doctor
    - معرفی تغییرات ناسازگار در پیکربندی
sidebarTitle: Doctor
summary: 'فرمان Doctor: بررسی‌های سلامت، مهاجرت‌های پیکربندی، و مراحل ترمیم'
title: Doctor
x-i18n:
    generated_at: "2026-06-27T17:42:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` ابزار تعمیر + مهاجرت برای OpenClaw است. پیکربندی/وضعیت قدیمی را اصلاح می‌کند، سلامت را بررسی می‌کند، و گام‌های تعمیر قابل‌اقدام ارائه می‌دهد.

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

    پیش‌فرض‌ها را بدون درخواست تأیید بپذیر (از جمله گام‌های تعمیر راه‌اندازی مجدد/سرویس/سندباکس، در صورت کاربرد).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    تعمیرهای پیشنهادی را بدون درخواست تأیید اعمال کن (تعمیرها + راه‌اندازی‌های مجدد در موارد امن).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    بررسی‌های ساختاریافته سلامت را برای CI یا خودکارسازی پیش‌پرواز اجرا کن. این حالت
    فقط‌خواندنی است: درخواست تأیید نمی‌دهد، تعمیر نمی‌کند، پیکربندی را مهاجرت نمی‌دهد، سرویس‌ها را راه‌اندازی مجدد نمی‌کند، یا
    وضعیت را تغییر نمی‌دهد.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    تعمیرهای تهاجمی را هم اعمال کن (پیکربندی‌های سفارشی ناظر را بازنویسی می‌کند).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    بدون درخواست تأیید اجرا کن و فقط مهاجرت‌های امن را اعمال کن (نرمال‌سازی پیکربندی + جابه‌جایی وضعیت روی دیسک). کنش‌های راه‌اندازی مجدد/سرویس/سندباکس را که به تأیید انسانی نیاز دارند رد می‌کند. مهاجرت‌های وضعیت قدیمی هنگام شناسایی به‌طور خودکار اجرا می‌شوند.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    سرویس‌های سیستم را برای نصب‌های اضافی Gateway اسکن کن (launchd/systemd/schtasks).

  </Tab>
</Tabs>

اگر می‌خواهید پیش از نوشتن تغییرات را بازبینی کنید، ابتدا فایل پیکربندی را باز کنید:

```bash
cat ~/.openclaw/openclaw.json
```

## حالت lint فقط‌خواندنی

`openclaw doctor --lint` همتای مناسب خودکارسازیِ
`openclaw doctor --fix` است. هر دو از بررسی‌های سلامت doctor استفاده می‌کنند، اما رویکردشان
متفاوت است:

| حالت                     | درخواست تأیید   | نوشتن پیکربندی/وضعیت     | خروجی                 | کاربرد                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | بله       | خیر                      | گزارش سلامت دوستانه | بررسی وضعیت توسط انسان         |
| `openclaw doctor --fix`  | گاهی | بله، با سیاست تعمیر | گزارش تعمیر دوستانه    | اعمال تعمیرهای تأییدشده       |
| `openclaw doctor --lint` | خیر        | خیر                      | یافته‌های ساختاریافته    | CI، پیش‌پرواز، و گیت‌های بازبینی |

بررسی‌های سلامت مدرن‌شده ممکن است یک پیاده‌سازی اختیاری `repair()` ارائه کنند.
`doctor --fix` وقتی این تعمیرها وجود داشته باشند آن‌ها را اعمال می‌کند و برای بررسی‌هایی که هنوز مهاجرت نکرده‌اند
همچنان از جریان تعمیر موجود doctor استفاده می‌کند.
قرارداد ساختاریافته تعمیر همچنین گزارش تعمیر را از شناسایی جدا می‌کند:
`detect()` یافته‌های فعلی را گزارش می‌کند، در حالی که `repair()` می‌تواند تغییرات،
diffهای پیکربندی/فایل، و اثرات جانبی غیرفایلی را گزارش کند. این کار مسیر مهاجرت را
برای `doctor --fix --dry-run` آینده و خروجی diff باز نگه می‌دارد، بدون اینکه بررسی‌های lint
جهش‌ها را برنامه‌ریزی کنند.

نمونه‌ها:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

خروجی JSON شامل این موارد است:

- `ok`: اینکه آیا هیچ یافته قابل‌نمایشی به آستانه شدت انتخاب‌شده رسیده است یا نه
- `checksRun`: تعداد بررسی‌های سلامت اجراشده
- `checksSkipped`: بررسی‌هایی که به‌خاطر پروفایل انتخاب‌شده، `--only`، یا `--skip` رد شده‌اند
- `findings`: عیب‌یابی‌های ساختاریافته با `checkId`، `severity`، `message`، و
  `path`، `line`، `column`، `ocPath`، و `fixHint` اختیاری

کدهای خروج:

- `0`: هیچ یافته‌ای در آستانه انتخاب‌شده یا بالاتر از آن وجود ندارد
- `1`: یک یا چند یافته به آستانه انتخاب‌شده رسیده‌اند
- `2`: شکست فرمان/زمان اجرا پیش از اینکه یافته‌های lint بتوانند منتشر شوند

از `--severity-min info|warning|error` برای کنترل هم آنچه چاپ می‌شود و هم آنچه
باعث خروج غیرصفر lint می‌شود استفاده کنید. از `--all` برای اجرای موجودی کامل lint استفاده کنید،
از جمله بررسی‌های عمیق‌تر opt-in که از مجموعه پیش‌فرض خودکارسازی کنار گذاشته شده‌اند. از `--only <id>` برای گیت‌های پیش‌پرواز محدود و
از `--skip <id>` برای کنار گذاشتن موقت یک بررسی پرنویز، در حالی که بقیه اجرای
lint فعال می‌ماند، استفاده کنید.
گزینه‌های خروجی lint مانند `--json`، `--severity-min`، `--all`، `--only`، و
`--skip` باید همراه با `--lint` استفاده شوند؛ اجراهای معمول doctor و تعمیر
آن‌ها را رد می‌کنند.

## چه کاری انجام می‌دهد (خلاصه)

<AccordionGroup>
  <Accordion title="سلامت، رابط کاربری، و به‌روزرسانی‌ها">
    - به‌روزرسانی اختیاری پیش‌پرواز برای نصب‌های git (فقط تعاملی).
    - بررسی تازگی پروتکل رابط کاربری (وقتی شمای پروتکل جدیدتر باشد Control UI را دوباره می‌سازد).
    - بررسی سلامت + درخواست راه‌اندازی مجدد.
    - خلاصه وضعیت Skills (واجد شرایط/مفقود/مسدود) و وضعیت Plugin.

  </Accordion>
  <Accordion title="پیکربندی و مهاجرت‌ها">
    - نرمال‌سازی پیکربندی برای مقدارهای قدیمی.
    - مهاجرت پیکربندی Talk از فیلدهای تخت قدیمی `talk.*` به `talk.provider` + `talk.providers.<provider>`.
    - بررسی‌های مهاجرت مرورگر برای پیکربندی‌های قدیمی افزونه Chrome و آمادگی Chrome MCP.
    - هشدارهای override ارائه‌دهنده OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - مهاجرت ارائه‌دهنده/پروفایل قدیمی OpenAI Codex (`openai-codex` → `openai`) و هشدارهای سایه‌اندازی برای `models.providers.openai-codex` قدیمی.
    - بررسی پیش‌نیازهای OAuth TLS برای پروفایل‌های OpenAI Codex OAuth.
    - هشدارهای allowlist مربوط به Plugin/ابزار وقتی `plugins.allow` محدودکننده است اما سیاست ابزار هنوز wildcard یا ابزارهای متعلق به Plugin را درخواست می‌کند.
    - مهاجرت وضعیت قدیمی روی دیسک (sessions/agent dir/احراز هویت WhatsApp).
    - مهاجرت کلید قرارداد manifest قدیمی Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - مهاجرت ذخیره Cron قدیمی (`jobId`, `schedule.cron`, فیلدهای سطح‌بالای delivery/payload، `provider` در payload، کارهای fallback Webhook با `notify: true`).
    - پاک‌سازی سیاست زمان اجرای کل عامل قدیمی؛ سیاست زمان اجرای ارائه‌دهنده/مدل انتخاب‌گر مسیر فعال است.
    - پاک‌سازی پیکربندی قدیمی Plugin وقتی Pluginها فعال هستند؛ وقتی `plugins.enabled=false` باشد، ارجاع‌های قدیمی Plugin به‌عنوان پیکربندی مهار بی‌اثر در نظر گرفته می‌شوند و حفظ می‌شوند.

  </Accordion>
  <Accordion title="وضعیت و یکپارچگی">
    - بازرسی فایل قفل نشست و پاک‌سازی قفل‌های قدیمی.
    - تعمیر transcript نشست برای شاخه‌های تکراری بازنویسی prompt که توسط buildهای آسیب‌دیده 2026.4.24 ایجاد شده‌اند.
    - شناسایی tombstone بازیابی پس از راه‌اندازی مجدد subagent گیرکرده، با پشتیبانی `--fix` برای پاک‌سازی flagهای قدیمی بازیابی aborted تا startup همچنان child را restart-aborted تلقی نکند.
    - بررسی‌های یکپارچگی وضعیت و مجوزها (نشست‌ها، transcriptها، دایرکتوری وضعیت).
    - بررسی‌های مجوز فایل پیکربندی (chmod 600) هنگام اجرای محلی.
    - سلامت احراز هویت مدل: انقضای OAuth را بررسی می‌کند، می‌تواند tokenهای نزدیک به انقضا را refresh کند، و وضعیت‌های cooldown/disabled پروفایل احراز هویت را گزارش می‌کند.

  </Accordion>
  <Accordion title="Gateway، سرویس‌ها، و ناظرها">
    - تعمیر تصویر سندباکس وقتی سندباکس فعال است.
    - مهاجرت سرویس قدیمی و شناسایی Gateway اضافی.
    - مهاجرت وضعیت قدیمی کانال Matrix (در حالت `--fix` / `--repair`).
    - بررسی‌های زمان اجرای Gateway (سرویس نصب‌شده اما در حال اجرا نیست؛ label ذخیره‌شده launchd).
    - هشدارهای وضعیت کانال (از Gateway در حال اجرا probe می‌شود).
    - بررسی‌های مجوز مخصوص کانال زیر `openclaw channels capabilities` قرار دارند؛ برای مثال، مجوزهای کانال صوتی Discord با `openclaw channels capabilities --channel discord --target channel:<channel-id>` ممیزی می‌شوند.
    - بررسی‌های پاسخ‌گویی WhatsApp برای سلامت تنزل‌یافته event-loop در Gateway در حالی که کلاینت‌های TUI محلی هنوز در حال اجرا هستند؛ `--fix` فقط کلاینت‌های TUI محلی تأییدشده را متوقف می‌کند.
    - تعمیر مسیر Codex برای refهای مدل قدیمی `openai-codex/*` در مدل‌های اصلی، fallbackها، مدل‌های تولید تصویر/ویدیو، overrideهای heartbeat/subagent/compaction، hookها، overrideهای مدل کانال، و pinهای مسیر نشست؛ `--fix` آن‌ها را به `openai/*` بازنویسی می‌کند، پروفایل‌ها/ترتیب احراز هویت `openai-codex:*` را به `openai:*` مهاجرت می‌دهد، pinهای قدیمی زمان اجرای نشست/کل عامل را حذف می‌کند، و refهای canonical عامل OpenAI را روی harness پیش‌فرض Codex باقی می‌گذارد.
    - ممیزی پیکربندی ناظر (launchd/systemd/schtasks) با تعمیر اختیاری.
    - پاک‌سازی محیط proxy جاسازی‌شده برای سرویس‌های Gateway که هنگام نصب یا به‌روزرسانی مقدارهای shell مربوط به `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` را ضبط کرده‌اند.
    - بررسی‌های بهترین‌روش زمان اجرای Gateway (Node در برابر Bun، مسیرهای version-manager).
    - عیب‌یابی برخورد پورت Gateway (پیش‌فرض `18789`).

  </Accordion>
  <Accordion title="احراز هویت، امنیت، و جفت‌سازی">
    - هشدارهای امنیتی برای سیاست‌های DM باز.
    - بررسی‌های احراز هویت Gateway برای حالت token محلی (وقتی هیچ منبع token وجود ندارد تولید token پیشنهاد می‌کند؛ پیکربندی‌های token SecretRef را بازنویسی نمی‌کند).
    - شناسایی مشکل جفت‌سازی دستگاه (درخواست‌های جفت‌سازی نخستین‌بار معلق، ارتقاهای role/scope معلق، drift قدیمی cache token دستگاه محلی، و drift احراز هویت رکورد جفت‌شده).

  </Accordion>
  <Accordion title="Workspace و shell">
    - بررسی systemd linger در Linux.
    - بررسی اندازه فایل bootstrap Workspace (هشدارهای truncation/نزدیک به حد برای فایل‌های context).
    - بررسی آمادگی Skills برای عامل پیش‌فرض؛ Skills مجاز با binary، env، config، یا الزامات OS مفقود را گزارش می‌کند، و `--fix` می‌تواند Skills در دسترس نبودنی را در `skills.entries` غیرفعال کند.
    - بررسی وضعیت تکمیل shell و نصب/ارتقای خودکار.
    - بررسی آمادگی ارائه‌دهنده embedding جست‌وجوی حافظه (مدل محلی، کلید API راه‌دور، یا binary QMD).
    - بررسی‌های نصب از source (ناهماهنگی workspace مربوط به pnpm، assetهای مفقود UI، binary مفقود tsx).
    - پیکربندی به‌روزشده + metadata ویزارد را می‌نویسد.

  </Accordion>
</AccordionGroup>

## backfill و reset رابط Dreams

صحنه Dreams در Control UI شامل کنش‌های **Backfill**، **Reset**، و **Clear Grounded** برای workflow مربوط به Dreaming مبتنی بر زمینه است. این کنش‌ها از متدهای RPC سبک doctor در Gateway استفاده می‌کنند، اما بخشی از تعمیر/مهاجرت CLI مربوط به `openclaw doctor` نیستند.

کاری که انجام می‌دهند:

- **Backfill** فایل‌های تاریخی `memory/YYYY-MM-DD.md` را در workspace فعال اسکن می‌کند، گذر diary مربوط به REM مبتنی بر زمینه را اجرا می‌کند، و ورودی‌های backfill برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
- **Reset** فقط همان ورودی‌های diary علامت‌گذاری‌شده backfill را از `DREAMS.md` حذف می‌کند.
- **Clear Grounded** فقط ورودی‌های کوتاه‌مدت staged و فقط grounded را حذف می‌کند که از replay تاریخی آمده‌اند و هنوز recall زنده یا پشتیبانی روزانه جمع نکرده‌اند.

کاری که به‌تنهایی انجام **نمی‌دهند**:

- آن‌ها `MEMORY.md` را ویرایش نمی‌کنند
- آن‌ها مهاجرت‌های کامل doctor را اجرا نمی‌کنند
- آن‌ها به‌طور خودکار candidateهای grounded را وارد store ترفیع کوتاه‌مدت زنده نمی‌کنند، مگر اینکه ابتدا مسیر CLI staged را صریحاً اجرا کنید

اگر می‌خواهید replay تاریخی grounded روی lane معمول ترفیع عمیق اثر بگذارد، به‌جای آن از جریان CLI استفاده کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

این کار candidateهای پایدار grounded را در store کوتاه‌مدت Dreaming staged می‌کند، در حالی که `DREAMS.md` را به‌عنوان سطح بازبینی نگه می‌دارد.

## رفتار تفصیلی و منطق

<AccordionGroup>
  <Accordion title="0. به‌روزرسانی اختیاری (نصب‌های git)">
    اگر این یک checkout از git باشد و doctor به‌صورت تعاملی اجرا شود، پیش از اجرای doctor پیشنهاد به‌روزرسانی (fetch/rebase/build) می‌دهد.
  </Accordion>
  <Accordion title="1. نرمال‌سازی پیکربندی">
    اگر پیکربندی شامل شکل‌های مقدار قدیمی باشد (برای مثال `messages.ackReaction` بدون override مخصوص کانال)، doctor آن‌ها را به شمای فعلی نرمال‌سازی می‌کند.

    این شامل فیلدهای تخت قدیمی Talk هم می‌شود. پیکربندی عمومی فعلی گفتار Talk برابر `talk.provider` + `talk.providers.<provider>` است، و پیکربندی صدای realtime برابر `talk.realtime.*` است. Doctor شکل‌های قدیمی `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` را در map ارائه‌دهنده بازنویسی می‌کند، و selectorهای realtime سطح‌بالای قدیمی (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) را به `talk.realtime` بازنویسی می‌کند.

    پزشک همچنین وقتی `plugins.allow` خالی نباشد و سیاست ابزار از
    ورودی‌های wildcard یا ابزارهای متعلق به Plugin استفاده کند هشدار می‌دهد. `tools.allow: ["*"]` فقط با ابزارهایی
    از Pluginهایی که واقعاً بارگذاری می‌شوند منطبق می‌شود؛ فهرست مجاز انحصاری Pluginها را دور نمی‌زند.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    وقتی پیکربندی شامل کلیدهای منسوخ باشد، فرمان‌های دیگر از اجرا خودداری می‌کنند و از شما می‌خواهند `openclaw doctor` را اجرا کنید.

    پزشک این کارها را انجام می‌دهد:

    - توضیح می‌دهد کدام کلیدهای قدیمی پیدا شده‌اند.
    - مهاجرتی را که اعمال کرده نشان می‌دهد.
    - `~/.openclaw/openclaw.json` را با طرح‌واره‌ی به‌روزشده بازنویسی می‌کند.

    راه‌اندازی Gateway قالب‌های قدیمی پیکربندی را نمی‌پذیرد و از شما می‌خواهد `openclaw doctor --fix` را اجرا کنید؛ هنگام راه‌اندازی `openclaw.json` را بازنویسی نمی‌کند. مهاجرت‌های مخزن کارهای Cron نیز توسط `openclaw doctor --fix` انجام می‌شوند.

    مهاجرت‌های فعلی:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - حذف `channels.webchat` و `gateway.webchat` بازنشسته‌شده
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` در سطح بالا
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` قدیمی → `talk.provider` + `talk.providers.<provider>`
    - گزینشگرهای بلادرنگ Talk قدیمی در سطح بالا (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` و `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` و `messages.tts.providers.microsoft`
    - فیلدهای انتخاب گوینده TTS (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` و `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` و `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - برای کانال‌هایی که `accounts` نام‌گذاری‌شده دارند اما هنوز مقدارهای سطح بالای تک‌حسابی کانال باقی مانده است، آن مقدارهای محدود به حساب را به حساب ارتقایافته‌ی انتخاب‌شده برای آن کانال منتقل کن (`accounts.default` برای بیشتر کانال‌ها؛ Matrix می‌تواند یک مقصد نام‌گذاری‌شده/پیش‌فرض منطبق موجود را حفظ کند)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - حذف `agents.defaults.llm`؛ برای مهلت‌های زمانی کندِ ارائه‌دهنده/مدل از `models.providers.<id>.timeoutSeconds` استفاده کنید و وقتی کل اجرا باید طولانی‌تر بماند، مهلت زمانی عامل/اجرا را بالاتر از آن مقدار نگه دارید
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - حذف `browser.relayBindHost` (تنظیم قدیمی رله افزونه)
    - `models.providers.*.api: "openai"` قدیمی → `"openai-completions"` (راه‌اندازی Gateway همچنین ارائه‌دهندگانی را که `api` آن‌ها روی مقدار enum آینده یا ناشناخته تنظیم شده باشد رد می‌کند، به‌جای اینکه بسته و ناموفق شود)
    - حذف `plugins.entries.codex.config.codexDynamicToolsProfile`؛ کارساز برنامه‌ی Codex همیشه ابزارهای بومی فضای کاری Codex را بومی نگه می‌دارد

    هشدارهای پزشک همچنین شامل راهنمایی پیش‌فرض حساب برای کانال‌های چندحسابی است:

    - اگر دو یا چند ورودی `channels.<channel>.accounts` بدون `channels.<channel>.defaultAccount` یا `accounts.default` پیکربندی شده باشند، پزشک هشدار می‌دهد که مسیریابی fallback می‌تواند حسابی غیرمنتظره را انتخاب کند.
    - اگر `channels.<channel>.defaultAccount` روی یک شناسه حساب ناشناخته تنظیم شده باشد، پزشک هشدار می‌دهد و شناسه‌های حساب پیکربندی‌شده را فهرست می‌کند.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    اگر `models.providers.opencode`، `opencode-zen`، یا `opencode-go` را به‌صورت دستی افزوده باشید، کاتالوگ داخلی OpenCode از `openclaw/plugin-sdk/llm` را بازنویسی می‌کند. این می‌تواند مدل‌ها را مجبور کند روی API اشتباه قرار بگیرند یا هزینه‌ها را صفر کند. پزشک هشدار می‌دهد تا بتوانید این بازنویسی را حذف کنید و مسیریابی API + هزینه‌های هر مدل را برگردانید.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    اگر پیکربندی مرورگر شما هنوز به مسیر حذف‌شده‌ی افزونه Chrome اشاره می‌کند، پزشک آن را به مدل attach فعلی Chrome MCP میزبان-محلی عادی‌سازی می‌کند:

    - `browser.profiles.*.driver: "extension"` به `"existing-session"` تبدیل می‌شود
    - `browser.relayBindHost` حذف می‌شود

    پزشک همچنین وقتی از `defaultProfile: "user"` یا یک پروفایل `existing-session` پیکربندی‌شده استفاده می‌کنید، مسیر Chrome MCP میزبان-محلی را ممیزی می‌کند:

    - بررسی می‌کند که آیا Google Chrome برای پروفایل‌های پیش‌فرض اتصال خودکار روی همان میزبان نصب شده است
    - نسخه Chrome شناسایی‌شده را بررسی می‌کند و وقتی کمتر از Chrome 144 باشد هشدار می‌دهد
    - یادآوری می‌کند که اشکال‌زدایی راه‌دور را در صفحه inspect مرورگر فعال کنید (برای مثال `chrome://inspect/#remote-debugging`، `brave://inspect/#remote-debugging`، یا `edge://inspect/#remote-debugging`)

    پزشک نمی‌تواند تنظیم سمت Chrome را برای شما فعال کند. Chrome MCP میزبان-محلی همچنان به این موارد نیاز دارد:

    - یک مرورگر مبتنی بر Chromium نسخه 144+ روی میزبان gateway/node
    - اجرای محلی مرورگر
    - فعال بودن اشکال‌زدایی راه‌دور در آن مرورگر
    - تأیید نخستین درخواست رضایت attach در مرورگر

    آمادگی در اینجا فقط درباره پیش‌نیازهای attach محلی است. Existing-session محدودیت‌های فعلی مسیر Chrome MCP را نگه می‌دارد؛ مسیرهای پیشرفته مانند `responsebody`، صدور PDF، رهگیری دانلود، و کنش‌های دسته‌ای همچنان به مرورگر مدیریت‌شده یا پروفایل خام CDP نیاز دارند.

    این بررسی برای Docker، sandbox، remote-browser، یا جریان‌های headless دیگر اعمال نمی‌شود. آن‌ها همچنان از CDP خام استفاده می‌کنند.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    وقتی یک پروفایل OAuth مربوط به OpenAI Codex پیکربندی شده باشد، پزشک نقطه پایانی مجوزدهی OpenAI را بررسی می‌کند تا تأیید کند پشته TLS محلی Node/OpenSSL می‌تواند زنجیره گواهی را اعتبارسنجی کند. اگر بررسی با خطای گواهی ناموفق شود (برای مثال `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`، گواهی منقضی، یا گواهی خودامضا)، پزشک راهنمای رفع مشکل مخصوص پلتفرم را چاپ می‌کند. در macOS با Node نصب‌شده از Homebrew، رفع مشکل معمولاً `brew postinstall ca-certificates` است. با `--deep`، بررسی حتی اگر gateway سالم باشد اجرا می‌شود.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    اگر قبلاً تنظیمات انتقال قدیمی OpenAI را زیر `models.providers.openai-codex` اضافه کرده باشید، می‌توانند مسیر داخلی ارائه‌دهنده Codex OAuth را که نسخه‌های جدیدتر به‌طور خودکار استفاده می‌کنند پنهان کنند. پزشک وقتی این تنظیمات انتقال قدیمی را در کنار Codex OAuth ببیند هشدار می‌دهد تا بتوانید بازنویسی انتقال کهنه را حذف یا بازنویسی کنید و رفتار داخلی مسیریابی/fallback را برگردانید. پراکسی‌های سفارشی و بازنویسی‌های فقط-سرآیند همچنان پشتیبانی می‌شوند و این هشدار را فعال نمی‌کنند.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    پزشک ارجاع‌های مدل قدیمی `openai-codex/*` را بررسی می‌کند. مسیریابی بومی harness مربوط به Codex از ارجاع‌های مدل canonical `openai/*` استفاده می‌کند؛ نوبت‌های عامل OpenAI به‌جای مسیر ارائه‌دهنده OpenAI در OpenClaw از طریق harness کارساز برنامه Codex عبور می‌کنند.

    در حالت `--fix` / `--repair`، پزشک ارجاع‌های عامل پیش‌فرض و هر عامل را بازنویسی می‌کند، از جمله مدل‌های اصلی، fallbackها، مدل‌های تولید تصویر/ویدئو، بازنویسی‌های heartbeat/subagent/compaction، hookها، بازنویسی‌های مدل کانال، و وضعیت مسیر نشست پایدارشده‌ی کهنه:

    - `openai-codex/gpt-*` به `openai/gpt-*` تبدیل می‌شود.
    - قصد Codex برای ارجاع‌های مدل عامل تعمیرشده به ورودی‌های `agentRuntime.id: "codex"` محدود به ارائه‌دهنده/مدل منتقل می‌شود.
    - پیکربندی runtime قدیمیِ کل عامل و pinهای runtime نشست پایدارشده حذف می‌شوند، زیرا انتخاب runtime محدود به ارائه‌دهنده/مدل است.
    - سیاست runtime موجود ارائه‌دهنده/مدل حفظ می‌شود، مگر اینکه ارجاع مدل قدیمی تعمیرشده برای حفظ مسیر احراز هویت قدیمی به مسیریابی Codex نیاز داشته باشد.
    - فهرست‌های fallback مدل موجود با بازنویسی ورودی‌های قدیمی خود حفظ می‌شوند؛ تنظیمات هر مدل کپی‌شده از کلید قدیمی به کلید canonical `openai/*` منتقل می‌شوند.
    - `modelProvider`/`providerOverride`، `model`/`modelOverride`، اعلان‌های fallback، و pinهای پروفایل احراز هویت نشست پایدارشده در همه مخازن نشست عامل کشف‌شده تعمیر می‌شوند.
    - `/codex ...` یعنی «یک گفت‌وگوی بومی Codex را از chat کنترل یا bind کن.»
    - `/acp ...` یا `runtime: "acp"` یعنی «از adapter خارجی ACP/acpx استفاده کن.»

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    پزشک همچنین مخازن نشست عامل کشف‌شده را برای وضعیت مسیر منسوخِ خودکارساخته‌شده پس از انتقال مدل‌های پیکربندی‌شده یا runtime از یک مسیر متعلق به Plugin مانند Codex اسکن می‌کند.

    `openclaw doctor --fix` می‌تواند وضعیت منسوخ خودکارساخته‌شده مانند pinهای مدل `modelOverrideSource: "auto"`، فراداده مدل runtime، شناسه‌های harness pin‌شده، bindهای نشست CLI، و بازنویسی‌های خودکار پروفایل احراز هویت را وقتی مسیر مالک آن‌ها دیگر پیکربندی نشده پاک کند. انتخاب‌های صریح کاربر یا مدل نشست قدیمی برای بازبینی دستی گزارش می‌شوند و دست‌نخورده می‌مانند؛ وقتی آن مسیر دیگر مورد نظر نیست، آن‌ها را با `/model ...`، `/new`، یا بازنشانی نشست تغییر دهید.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    پزشک می‌تواند چیدمان‌های قدیمی‌تر روی دیسک را به ساختار فعلی مهاجرت دهد:

    - مخزن نشست‌ها + رونوشت‌ها:
      - از `~/.openclaw/sessions/` به `~/.openclaw/agents/<agentId>/sessions/`
    - دایرکتوری عامل:
      - از `~/.openclaw/agent/` به `~/.openclaw/agents/<agentId>/agent/`
    - وضعیت احراز هویت WhatsApp (Baileys):
      - از `~/.openclaw/credentials/*.json` قدیمی (به‌جز `oauth.json`)
      - به `~/.openclaw/credentials/whatsapp/<accountId>/...` (شناسه حساب پیش‌فرض: `default`)

    این مهاجرت‌ها بهترین‌تلاش و idempotent هستند؛ پزشک وقتی هر پوشه قدیمی را به‌عنوان نسخه پشتیبان باقی بگذارد هشدار صادر می‌کند. Gateway/CLI نیز هنگام راه‌اندازی، نشست‌های قدیمی + دایرکتوری عامل را خودکار مهاجرت می‌دهد تا تاریخچه/احراز هویت/مدل‌ها بدون اجرای دستی پزشک در مسیر هر عامل قرار بگیرند. احراز هویت WhatsApp عمداً فقط از طریق `openclaw doctor` مهاجرت داده می‌شود. عادی‌سازی ارائه‌دهنده/نقشه ارائه‌دهنده Talk اکنون با برابری ساختاری مقایسه می‌کند، بنابراین تفاوت‌هایی که فقط مربوط به ترتیب کلیدها هستند دیگر تغییرهای تکراری و بی‌اثر `doctor --fix` را فعال نمی‌کنند.

  </Accordion>
  <Accordion title="3a. مهاجرت مانیفست‌های Plugin قدیمی">
    ابزار doctor همه مانیفست‌های Plugin نصب‌شده را برای کلیدهای قابلیت سطح‌بالای منسوخ (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) اسکن می‌کند. وقتی آن‌ها را پیدا کند، پیشنهاد می‌دهد آن‌ها را به شیء `contracts` منتقل کند و فایل مانیفست را درجا بازنویسی کند. این مهاجرت idempotent است؛ اگر کلید `contracts` از قبل همان مقدارها را داشته باشد، کلید قدیمی بدون تکرار داده حذف می‌شود.
  </Accordion>
  <Accordion title="3b. مهاجرت‌های ذخیره‌گاه Cron قدیمی">
    ابزار doctor همچنین ذخیره‌گاه کارهای Cron را (`~/.openclaw/cron/jobs.json` به‌صورت پیش‌فرض، یا `cron.store` وقتی override شده باشد) برای شکل‌های قدیمی کار که زمان‌بند هنوز برای سازگاری می‌پذیرد بررسی می‌کند.

    پاک‌سازی‌های فعلی Cron شامل این موارد است:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - فیلدهای payload سطح‌بالا (`message`, `model`, `thinking`, ...) → `payload`
    - فیلدهای delivery سطح‌بالا (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - نام‌های مستعار delivery مربوط به `provider` در payload → `delivery.channel` صریح
    - کارهای fallback قدیمی Webhook با `notify: true` → delivery صریح Webhook از `cron.webhook` وقتی تنظیم شده باشد؛ کارهای announce همان delivery گفت‌وگوی خود را نگه می‌دارند و `delivery.completionDestination` می‌گیرند. وقتی `cron.webhook` تنظیم نشده باشد، نشانگر بی‌اثر سطح‌بالای `notify` برای کارهای بدون مقصد حذف می‌شود (delivery موجود، از جمله announce، حفظ می‌شود) چون delivery در runtime هرگز آن را نمی‌خواند

    Gateway همچنین ردیف‌های Cron بدشکل را هنگام بارگذاری پاک‌سازی می‌کند تا کارهای معتبر همچنان اجرا شوند. ردیف‌های خام بدشکل، پیش از حذف از `jobs.json`، کنار ذخیره‌گاه فعال در `jobs-quarantine.json` کپی می‌شوند؛ doctor ردیف‌های قرنطینه‌شده را گزارش می‌کند تا بتوانید آن‌ها را دستی بازبینی یا تعمیر کنید.

    شروع به کار Gateway تصویر runtime را نرمال‌سازی می‌کند و نشانگر سطح‌بالای `notify` را نادیده می‌گیرد، اما پیکربندی پایدار Cron را برای تعمیر doctor دست‌نخورده می‌گذارد. وقتی `cron.webhook` تنظیم نشده باشد، doctor نشانگر بی‌اثر را برای کارهایی که مقصد مهاجرت ندارند (`delivery.mode` برابر none/غایب، مقصد Webhook غیرقابل‌استفاده، یا delivery موجود announce/chat) حذف می‌کند و delivery موجود را دست‌نخورده می‌گذارد، بنابراین اجرای مکرر `doctor --fix` دیگر درباره همان کار هشدار تکراری نمی‌دهد. اگر `cron.webhook` تنظیم شده باشد اما URL معتبر HTTP(S) نباشد، doctor همچنان هشدار می‌دهد و نشانگر را باقی می‌گذارد تا بتوانید URL را درست کنید.

    در Linux، doctor همچنین وقتی crontab کاربر هنوز `~/.openclaw/bin/ensure-whatsapp.sh` قدیمی را اجرا می‌کند هشدار می‌دهد. این اسکریپت host-local توسط OpenClaw فعلی نگهداری نمی‌شود و وقتی Cron نتواند به bus کاربر systemd برسد، می‌تواند پیام‌های نادرست `Gateway inactive` را در `~/.openclaw/logs/whatsapp-health.log` بنویسد. ورودی کهنه crontab را با `crontab -e` حذف کنید؛ برای بررسی‌های سلامت فعلی از `openclaw channels status --probe`، `openclaw doctor`، و `openclaw gateway status` استفاده کنید.

  </Accordion>
  <Accordion title="3c. پاک‌سازی قفل جلسه">
    ابزار doctor همه دایرکتوری‌های جلسه agent را برای فایل‌های write-lock کهنه اسکن می‌کند — فایل‌هایی که وقتی یک جلسه به‌صورت غیرعادی خارج شده باقی مانده‌اند. برای هر فایل قفل پیدا شده، این موارد را گزارش می‌کند: مسیر، PID، اینکه PID هنوز زنده است یا نه، سن قفل، و اینکه کهنه محسوب می‌شود یا نه (PID مرده، metadata مالک بدشکل، قدیمی‌تر از ۳۰ دقیقه، یا PID زنده‌ای که بتوان ثابت کرد متعلق به فرایند غیر OpenClaw است). در حالت `--fix` / `--repair`، قفل‌هایی را که مالک مرده، orphaned، بازیافت‌شده، malformed-old، یا غیر OpenClaw دارند به‌صورت خودکار حذف می‌کند. قفل‌های قدیمی که هنوز متعلق به یک فرایند زنده OpenClaw هستند گزارش می‌شوند اما سر جای خود می‌مانند تا doctor نویسنده فعال transcript را قطع نکند.
  </Accordion>
  <Accordion title="3d. تعمیر شاخه transcript جلسه">
    ابزار doctor فایل‌های JSONL جلسه agent را برای شکل شاخه تکراری ایجادشده توسط باگ بازنویسی transcript پرامپت 2026.4.24 اسکن می‌کند: یک نوبت کاربر رهاشده با context داخلی runtime OpenClaw به‌علاوه یک sibling فعال که همان پرامپت قابل‌مشاهده کاربر را دارد. در حالت `--fix` / `--repair`، doctor از هر فایل آسیب‌دیده کنار فایل اصلی پشتیبان می‌گیرد و transcript را به شاخه فعال بازنویسی می‌کند تا خواننده‌های history و memory در gateway دیگر نوبت‌های تکراری نبینند.
  </Accordion>
  <Accordion title="4. بررسی‌های یکپارچگی state (پایداری جلسه، routing، و safety)">
    دایرکتوری state ساقه مغز عملیاتی است. اگر ناپدید شود، sessionها، credentials، logها، و config را از دست می‌دهید (مگر اینکه جای دیگری backup داشته باشید).

    ابزار doctor بررسی می‌کند:

    - **دایرکتوری state وجود ندارد**: درباره از دست رفتن فاجعه‌بار state هشدار می‌دهد، برای بازایجاد دایرکتوری prompt می‌دهد، و یادآوری می‌کند که نمی‌تواند داده‌های گمشده را بازیابی کند.
    - **مجوزهای دایرکتوری state**: قابلیت نوشتن را راستی‌آزمایی می‌کند؛ پیشنهاد تعمیر مجوزها را می‌دهد (و وقتی ناسازگاری owner/group تشخیص داده شود، یک راهنمای `chown` منتشر می‌کند).
    - **دایرکتوری state همگام‌سازی‌شده با cloud در macOS**: وقتی state زیر iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) یا `~/Library/CloudStorage/...` resolve شود هشدار می‌دهد، چون مسیرهای sync-backed می‌توانند باعث I/O کندتر و raceهای lock/sync شوند.
    - **دایرکتوری state روی SD یا eMMC در Linux**: وقتی state به منبع mount از نوع `mmcblk*` resolve شود هشدار می‌دهد، چون I/O تصادفی مبتنی بر SD یا eMMC زیر نوشتن‌های session و credential می‌تواند کندتر باشد و سریع‌تر فرسوده شود.
    - **دایرکتوری state ناپایدار در Linux**: وقتی state به `tmpfs` یا `ramfs` resolve شود هشدار می‌دهد، چون sessionها، credentials، config، و state مربوط به SQLite به‌همراه sidecarهای WAL/journal آن با reboot ناپدید می‌شوند. mountهای `overlay` در Docker عمدا علامت‌گذاری نمی‌شوند چون لایه‌های قابل‌نوشتن آن‌ها تا زمانی که container باقی بماند، در rebootهای host پایدار می‌مانند.
    - **دایرکتوری‌های session وجود ندارند**: `sessions/` و دایرکتوری ذخیره‌گاه session برای پایدار نگه داشتن history و جلوگیری از crashهای `ENOENT` لازم‌اند.
    - **ناسازگاری transcript**: وقتی ورودی‌های اخیر session فایل‌های transcript گمشده داشته باشند هشدار می‌دهد.
    - **JSONL یک‌خطی session اصلی**: وقتی transcript اصلی فقط یک خط داشته باشد علامت‌گذاری می‌کند (history در حال انباشته شدن نیست).
    - **چند دایرکتوری state**: وقتی چند پوشه `~/.openclaw` در home directoryهای مختلف وجود داشته باشد یا وقتی `OPENCLAW_STATE_DIR` به جای دیگری اشاره کند هشدار می‌دهد (history می‌تواند بین نصب‌ها split شود).
    - **یادآوری remote mode**: اگر `gateway.mode=remote` باشد، doctor یادآوری می‌کند آن را روی host ریموت اجرا کنید (state آنجاست).
    - **مجوزهای فایل config**: اگر `~/.openclaw/openclaw.json` برای group/world خواندنی باشد هشدار می‌دهد و پیشنهاد سخت‌گیرانه‌تر کردن به `600` را می‌دهد.

  </Accordion>
  <Accordion title="5. سلامت احراز هویت مدل (انقضای OAuth)">
    ابزار doctor پروفایل‌های OAuth را در ذخیره‌گاه auth بررسی می‌کند، وقتی tokenها در حال انقضا/منقضی‌شده باشند هشدار می‌دهد، و وقتی امن باشد می‌تواند آن‌ها را refresh کند. اگر پروفایل Anthropic OAuth/token کهنه باشد، یک Anthropic API key یا مسیر setup-token آنتروپیک را پیشنهاد می‌کند. promptهای refresh فقط هنگام اجرای تعاملی (TTY) ظاهر می‌شوند؛ `--non-interactive` تلاش‌های refresh را رد می‌کند.

    وقتی refresh مربوط به OAuth به‌صورت دائمی شکست بخورد (برای مثال `refresh_token_reused`، `invalid_grant`، یا provider به شما بگوید دوباره sign in کنید)، doctor گزارش می‌دهد که re-auth لازم است و دستور دقیق `openclaw models auth login --provider ...` را برای اجرا چاپ می‌کند.

    ابزار doctor همچنین پروفایل‌های auth را گزارش می‌کند که به‌دلیل موارد زیر موقتا غیرقابل‌استفاده‌اند:

    - cooldownهای کوتاه (rate limitها/timeoutها/خرابی‌های auth)
    - disableهای طولانی‌تر (خرابی‌های billing/credit)

    پروفایل‌های قدیمی Codex OAuth که tokenهایشان در macOS Keychain قرار دارد (onboarding قدیمی‌تر پیش از چیدمان sidecar مبتنی بر فایل) فقط توسط doctor تعمیر می‌شوند. یک‌بار `openclaw doctor --fix` را از یک terminal تعاملی اجرا کنید تا tokenهای قدیمی متکی بر Keychain به‌صورت inline به `auth-profiles.json` مهاجرت کنند؛ پس از آن، نوبت‌های embedded (Telegram، Cron، dispatch مربوط به sub-agent) آن‌ها را به‌عنوان پروفایل‌های canonical OpenAI OAuth resolve می‌کنند.

  </Accordion>
  <Accordion title="6. اعتبارسنجی مدل hooks">
    اگر `hooks.gmail.model` تنظیم شده باشد، doctor مرجع مدل را در برابر catalog و allowlist اعتبارسنجی می‌کند و وقتی resolve نشود یا مجاز نباشد هشدار می‌دهد.
  </Accordion>
  <Accordion title="7. تعمیر تصویر sandbox">
    وقتی sandboxing فعال باشد، doctor تصویرهای Docker را بررسی می‌کند و اگر تصویر فعلی وجود نداشته باشد، پیشنهاد build کردن یا switch به نام‌های قدیمی را می‌دهد.
  </Accordion>
  <Accordion title="7b. پاک‌سازی نصب Plugin">
    ابزار doctor در حالت `openclaw doctor --fix` / `openclaw doctor --repair`، state قدیمی staging وابستگی Plugin تولیدشده توسط OpenClaw را حذف می‌کند. این شامل rootهای وابستگی تولیدشده کهنه، دایرکتوری‌های قدیمی install-stage، خرده‌ریزهای package-local از کد تعمیر وابستگی bundled-plugin قبلی، و کپی‌های managed npm یتیم یا بازیابی‌شده از Pluginهای bundled با `@openclaw/*` است که می‌توانند مانیفست bundled فعلی را shadow کنند. doctor همچنین بسته host با نام `openclaw` را به Pluginهای managed npm که `peerDependencies.openclaw` اعلام می‌کنند relink می‌کند، تا importهای runtime package-local مانند `openclaw/plugin-sdk/*` پس از updateها یا تعمیرهای npm همچنان resolve شوند.

    doctor همچنین می‌تواند Pluginهای downloadable گمشده را وقتی config به آن‌ها ارجاع می‌دهد اما registry محلی Plugin نمی‌تواند آن‌ها را پیدا کند، دوباره نصب کند. نمونه‌ها شامل `plugins.entries` مادی، تنظیمات channel/provider/search پیکربندی‌شده، و runtimeهای agent پیکربندی‌شده است. هنگام updateهای package، doctor در زمانی که package اصلی در حال swap شدن است از اجرای تعمیر Plugin با package-manager خودداری می‌کند؛ اگر یک Plugin پیکربندی‌شده هنوز به recovery نیاز دارد، پس از update دوباره `openclaw doctor --fix` را اجرا کنید. شروع Gateway و reload پیکربندی package managerها را اجرا نمی‌کنند؛ نصب Pluginها همچنان کار صریح doctor/install/update باقی می‌ماند.

  </Accordion>
  <Accordion title="8. مهاجرت‌های سرویس Gateway و راهنمای پاک‌سازی">
    ابزار doctor سرویس‌های gateway قدیمی (launchd/systemd/schtasks) را تشخیص می‌دهد و پیشنهاد می‌کند آن‌ها را حذف کند و سرویس OpenClaw را با پورت فعلی Gateway نصب کند. همچنین می‌تواند سرویس‌های اضافی gateway-like را اسکن کند و راهنمای پاک‌سازی چاپ کند. سرویس‌های Gateway مربوط به OpenClaw با نام profile، first-class محسوب می‌شوند و به‌عنوان «extra» علامت‌گذاری نمی‌شوند.

    در Linux، اگر سرویس gateway در سطح کاربر وجود نداشته باشد اما یک سرویس Gateway مربوط به OpenClaw در سطح سیستم وجود داشته باشد، doctor به‌صورت خودکار سرویس دوم در سطح کاربر نصب نمی‌کند. با `openclaw gateway status --deep` یا `openclaw doctor --deep` بررسی کنید، سپس duplicate را حذف کنید یا وقتی یک system supervisor مالک lifecycle مربوط به Gateway است، `OPENCLAW_SERVICE_REPAIR_POLICY=external` را تنظیم کنید.

  </Accordion>
  <Accordion title="8b. مهاجرت Startup Matrix">
    وقتی یک حساب channel در Matrix مهاجرت state قدیمی pending یا actionable داشته باشد، doctor (در حالت `--fix` / `--repair`) یک snapshot پیش از مهاجرت ایجاد می‌کند و سپس گام‌های مهاجرت best-effort را اجرا می‌کند: مهاجرت state قدیمی Matrix و آماده‌سازی encrypted-state قدیمی. هر دو گام non-fatal هستند؛ خطاها log می‌شوند و startup ادامه پیدا می‌کند. در حالت read-only (`openclaw doctor` بدون `--fix`) این بررسی کاملا رد می‌شود.
  </Accordion>
  <Accordion title="8c. Device pairing و auth drift">
    doctor اکنون state مربوط به device-pairing را به‌عنوان بخشی از گذر سلامت عادی بررسی می‌کند.

    مواردی که گزارش می‌دهد:

    - درخواست‌های first-time pairing در انتظار
    - ارتقاهای role در انتظار برای deviceهایی که از قبل pair شده‌اند
    - ارتقاهای scope در انتظار برای deviceهایی که از قبل pair شده‌اند
    - تعمیرهای public-key mismatch که در آن device id هنوز match است اما identity دستگاه دیگر با record تاییدشده match نیست
    - recordهای paired که برای یک role تاییدشده token فعال ندارند
    - tokenهای paired که scopeهایشان بیرون از baseline تاییدشده pairing drift کرده است
    - ورودی‌های cached محلی device-token برای ماشین فعلی که پیش از rotation سمت Gateway برای token هستند یا metadata مربوط به scope کهنه دارند

    doctor درخواست‌های pair را auto-approve نمی‌کند و device tokenها را auto-rotate نمی‌کند. در عوض گام‌های بعدی دقیق را چاپ می‌کند:

    - درخواست‌های pending را با `openclaw devices list` بررسی کنید
    - درخواست دقیق را با `openclaw devices approve <requestId>` تایید کنید
    - یک token تازه را با `openclaw devices rotate --device <deviceId> --role <role>` rotate کنید
    - یک record کهنه را با `openclaw devices remove <deviceId>` حذف و دوباره تایید کنید

    این شکاف رایج «قبلاً جفت شده اما هنوز پیام نیاز به جفت‌سازی می‌گیرد» را می‌بندد: doctor اکنون جفت‌سازی نخستین‌بار را از ارتقاهای در انتظار نقش/دامنه و از drift توکن/هویت دستگاه منقضی‌شده تفکیک می‌کند.

  </Accordion>
  <Accordion title="9. هشدارهای امنیتی">
    Doctor وقتی یک provider بدون allowlist برای پیام‌های مستقیم باز است، یا وقتی یک policy به شکل خطرناکی پیکربندی شده باشد، هشدار صادر می‌کند.
  </Accordion>
  <Accordion title="10. ماندگاری systemd (Linux)">
    اگر به‌عنوان یک سرویس کاربری systemd اجرا شود، doctor مطمئن می‌شود lingering فعال است تا gateway پس از خروج کاربر همچنان زنده بماند.
  </Accordion>
  <Accordion title="11. وضعیت workspace (skills، plugins، و TaskFlows)">
    Doctor خلاصه‌ای از وضعیت workspace را برای agent پیش‌فرض چاپ می‌کند:

    - **وضعیت Skills**: تعداد skills واجد شرایط، دارای الزامات مفقود، و مسدودشده توسط allowlist را می‌شمارد.
    - **وضعیت Plugin**: تعداد plugins فعال/غیرفعال/خطادار را می‌شمارد؛ شناسه‌های plugin را برای هر خطا فهرست می‌کند؛ قابلیت‌های bundle plugin را گزارش می‌دهد.
    - **هشدارهای سازگاری Plugin**: plugins دارای مشکلات سازگاری با runtime فعلی را علامت‌گذاری می‌کند.
    - **عیب‌یابی‌های Plugin**: هر هشدار یا خطای زمان بارگذاری را که plugin registry صادر کرده باشد نمایان می‌کند.
    - **بازیابی TaskFlow**: TaskFlows مدیریت‌شده مشکوک را که به بررسی دستی یا لغو نیاز دارند نمایان می‌کند.

  </Accordion>
  <Accordion title="11b. اندازه فایل bootstrap">
    Doctor بررسی می‌کند که آیا فایل‌های bootstrap workspace (برای مثال `AGENTS.md`، `CLAUDE.md`، یا دیگر فایل‌های context تزریق‌شده) نزدیک به بودجه کاراکتر پیکربندی‌شده هستند یا از آن عبور کرده‌اند. برای هر فایل تعداد کاراکتر خام در برابر تزریق‌شده، درصد truncation، علت truncation (`max/file` یا `max/total`)، و کل کاراکترهای تزریق‌شده را به‌عنوان کسری از بودجه کل گزارش می‌کند. وقتی فایل‌ها truncate شده باشند یا نزدیک به حد باشند، doctor نکته‌هایی برای تنظیم `agents.defaults.bootstrapMaxChars` و `agents.defaults.bootstrapTotalMaxChars` چاپ می‌کند.
  </Accordion>
  <Accordion title="11d. پاک‌سازی plugin channel منقضی">
    وقتی `openclaw doctor --fix` یک plugin channel مفقود را حذف می‌کند، config معلقِ scoped به channel را که به آن plugin ارجاع داده بود نیز حذف می‌کند: ورودی‌های `channels.<id>`، هدف‌های heartbeat که نام channel را داشتند، و overrideهای `agents.*.models["<channel>/*"]`. این کار از boot loopهای Gateway جلوگیری می‌کند که در آن runtime کانال حذف شده اما config هنوز از gateway می‌خواهد به آن bind شود.
  </Accordion>
  <Accordion title="11c. تکمیل shell">
    Doctor بررسی می‌کند که آیا tab completion برای shell فعلی نصب شده است یا نه (zsh، bash، fish، یا PowerShell):

    - اگر پروفایل shell از الگوی completion پویای کند (`source <(openclaw completion ...)`) استفاده کند، doctor آن را به گونه سریع‌ترِ فایل cacheشده ارتقا می‌دهد.
    - اگر completion در پروفایل پیکربندی شده اما فایل cache مفقود باشد، doctor cache را به‌طور خودکار بازتولید می‌کند.
    - اگر هیچ completion پیکربندی نشده باشد، doctor برای نصب آن prompt می‌دهد (فقط حالت تعاملی؛ با `--non-interactive` رد می‌شود).

    برای بازتولید دستی cache، `openclaw completion --write-state` را اجرا کنید.

  </Accordion>
  <Accordion title="12. بررسی‌های auth Gateway (توکن محلی)">
    Doctor آمادگی auth توکن local gateway را بررسی می‌کند.

    - اگر حالت توکن به یک توکن نیاز داشته باشد و هیچ منبع توکنی وجود نداشته باشد، doctor پیشنهاد می‌کند یکی تولید کند.
    - اگر `gateway.auth.token` توسط SecretRef مدیریت شود اما در دسترس نباشد، doctor هشدار می‌دهد و آن را با plaintext بازنویسی نمی‌کند.
    - `openclaw doctor --generate-gateway-token` فقط وقتی هیچ token SecretRef پیکربندی نشده باشد تولید را اجباری می‌کند.

  </Accordion>
  <Accordion title="12b. تعمیرهای read-only آگاه از SecretRef">
    بعضی flowهای تعمیر باید credentials پیکربندی‌شده را بدون تضعیف رفتار fail-fast runtime بررسی کنند.

    - `openclaw doctor --fix` اکنون برای تعمیرهای هدفمند config از همان مدل خلاصه SecretRef فقط‌خواندنی استفاده می‌کند که commandهای خانواده status استفاده می‌کنند.
    - مثال: تعمیر Telegram `allowFrom` / `groupAllowFrom` `@username` تلاش می‌کند وقتی bot credentials پیکربندی‌شده در دسترس باشد از آن‌ها استفاده کند.
    - اگر token bot Telegram از طریق SecretRef پیکربندی شده اما در مسیر command فعلی در دسترس نباشد، doctor گزارش می‌کند که credential پیکربندی‌شده-اما-دردسترس‌نیست است و به‌جای crash کردن یا گزارش اشتباه token به‌عنوان مفقود، auto-resolution را رد می‌کند.

  </Accordion>
  <Accordion title="13. بررسی سلامت Gateway + راه‌اندازی مجدد">
    Doctor یک health check اجرا می‌کند و وقتی gateway ناسالم به نظر برسد، پیشنهاد restart کردن آن را می‌دهد.
  </Accordion>
  <Accordion title="13b. آمادگی جست‌وجوی memory">
    Doctor بررسی می‌کند که آیا provider embedding جست‌وجوی memory پیکربندی‌شده برای agent پیش‌فرض آماده است یا نه. رفتار به backend و provider پیکربندی‌شده بستگی دارد:

    - **backend QMD**: probe می‌کند که آیا binary `qmd` در دسترس و قابل start شدن است یا نه. اگر نه، راهنمای fix شامل package npm و یک گزینه مسیر binary دستی چاپ می‌کند.
    - **provider local صریح**: وجود یک فایل مدل local یا URL مدل remote/downloadable شناخته‌شده را بررسی می‌کند. اگر مفقود باشد، پیشنهاد می‌کند به یک provider remote تغییر دهید.
    - **provider remote صریح** (`openai`، `voyage`، و غیره): تأیید می‌کند که یک API key در environment یا auth store وجود دارد. اگر مفقود باشد، hintهای fix قابل اقدام چاپ می‌کند.
    - **provider auto legacy**: `memorySearch.provider: "auto"` را به‌عنوان OpenAI در نظر می‌گیرد، آمادگی OpenAI را بررسی می‌کند، و `doctor --fix` آن را به `provider: "openai"` بازنویسی می‌کند.

    وقتی نتیجه probe cacheشده gateway در دسترس باشد (gateway در زمان بررسی سالم بوده)، doctor نتیجه آن را با config قابل مشاهده برای CLI تطبیق می‌دهد و هر ناهمخوانی را یادآوری می‌کند. Doctor در مسیر پیش‌فرض ping تازه embedding را شروع نمی‌کند؛ وقتی بررسی زنده provider می‌خواهید از command وضعیت deep memory استفاده کنید.

    برای تأیید آمادگی embedding در runtime، `openclaw memory status --deep` را استفاده کنید.

  </Accordion>
  <Accordion title="14. هشدارهای وضعیت channel">
    اگر gateway سالم باشد، doctor یک probe وضعیت channel اجرا می‌کند و هشدارها را همراه با fixهای پیشنهادی گزارش می‌دهد.
  </Accordion>
  <Accordion title="15. audit و تعمیر config supervisor">
    Doctor config نصب‌شده supervisor (launchd/systemd/schtasks) را برای پیش‌فرض‌های مفقود یا قدیمی (مثلاً وابستگی‌های systemd network-online و تأخیر restart) بررسی می‌کند. وقتی ناهمخوانی پیدا کند، update را توصیه می‌کند و می‌تواند service file/task را به پیش‌فرض‌های فعلی بازنویسی کند.

    نکته‌ها:

    - `openclaw doctor` قبل از بازنویسی config supervisor prompt می‌دهد.
    - `openclaw doctor --yes` promptهای تعمیر پیش‌فرض را می‌پذیرد.
    - `openclaw doctor --fix` fixهای توصیه‌شده را بدون prompt اعمال می‌کند (`--repair` یک alias است).
    - `openclaw doctor --fix --force` configهای supervisor سفارشی را بازنویسی می‌کند.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` doctor را برای lifecycle سرویس gateway فقط‌خواندنی نگه می‌دارد. همچنان سلامت سرویس را گزارش می‌دهد و تعمیرهای غیرسرویسی را اجرا می‌کند، اما install/start/restart/bootstrap سرویس، بازنویسی config supervisor، و پاک‌سازی سرویس legacy را رد می‌کند چون یک supervisor خارجی مالک آن lifecycle است.
    - در Linux، وقتی unit gateway مطابق systemd فعال است، doctor metadata command/entrypoint را بازنویسی نمی‌کند. همچنین هنگام scan سرویس‌های duplicate، unitهای اضافی شبیه gateway که inactive و غیر-legacy هستند را نادیده می‌گیرد تا service fileهای همراه noise پاک‌سازی ایجاد نکنند.
    - اگر auth توکن به token نیاز داشته باشد و `gateway.auth.token` توسط SecretRef مدیریت شود، install/repair سرویس doctor، SecretRef را validate می‌کند اما مقدارهای token plaintext resolveشده را در metadata environment سرویس supervisor persist نمی‌کند.
    - Doctor مقدارهای environment سرویس مدیریت‌شده با `.env`/SecretRef را که installهای قدیمی‌تر LaunchAgent، systemd، یا Windows Scheduled Task به‌صورت inline embedded کرده‌اند تشخیص می‌دهد و metadata سرویس را بازنویسی می‌کند تا آن مقدارها به‌جای definition supervisor از منبع runtime بارگذاری شوند.
    - Doctor تشخیص می‌دهد که فرمان سرویس پس از تغییر `gateway.port` هنوز یک `--port` قدیمی را pin کرده است و metadata سرویس را به port فعلی بازنویسی می‌کند.
    - اگر auth توکن به token نیاز داشته باشد و token SecretRef پیکربندی‌شده unresolved باشد، doctor مسیر install/repair را با راهنمای قابل اقدام block می‌کند.
    - اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` unset باشد، doctor تا زمانی که mode صریحاً set نشود install/repair را block می‌کند.
    - برای unitهای Linux user-systemd، بررسی‌های drift توکن doctor اکنون هنگام مقایسه metadata auth سرویس، هم sourceهای `Environment=` و هم `EnvironmentFile=` را شامل می‌شود.
    - تعمیرهای سرویس Doctor از بازنویسی، stop، یا restart کردن یک سرویس gateway از binary قدیمی‌تر OpenClaw خودداری می‌کنند وقتی config آخرین بار توسط نسخه‌ای جدیدتر نوشته شده باشد. [عیب‌یابی Gateway](/fa/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) را ببینید.
    - همیشه می‌توانید از طریق `openclaw gateway install --force` یک بازنویسی کامل را force کنید.

  </Accordion>
  <Accordion title="16. عیب‌یابی‌های runtime و port Gateway">
    Doctor runtime سرویس (PID، آخرین exit status) را inspect می‌کند و وقتی سرویس نصب شده اما واقعاً در حال اجرا نیست هشدار می‌دهد. همچنین collisionهای port روی port gateway (پیش‌فرض `18789`) را بررسی می‌کند و علت‌های محتمل را گزارش می‌دهد (gateway از قبل در حال اجراست، SSH tunnel).
  </Accordion>
  <Accordion title="17. بهترین رویه‌های runtime Gateway">
    Doctor وقتی سرویس gateway روی Bun یا مسیر Node مدیریت‌شده با نسخه (`nvm`، `fnm`، `volta`، `asdf`، و غیره) اجرا شود هشدار می‌دهد. channelهای WhatsApp + Telegram به Node نیاز دارند، و مسیرهای version-manager می‌توانند پس از upgrade خراب شوند چون سرویس init shell شما را load نمی‌کند. Doctor پیشنهاد می‌کند وقتی نصب system Node در دسترس باشد (Homebrew/apt/choco)، به آن migrate کند.

    LaunchAgentهای macOS که تازه نصب یا تعمیر شده‌اند به‌جای کپی کردن PATH shell تعاملی، از یک PATH canonical سیستم (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) استفاده می‌کنند، بنابراین binaryهای سیستم مدیریت‌شده با Homebrew همچنان در دسترس می‌مانند در حالی که Volta، asdf، fnm، pnpm، و دیگر دایرکتوری‌های version-manager تعیین نمی‌کنند child processهای Node کدام مسیر را resolve کنند. سرویس‌های Linux همچنان rootهای صریح environment (`NVM_DIR`، `FNM_DIR`، `VOLTA_HOME`، `ASDF_DATA_DIR`، `BUN_INSTALL`، `PNPM_HOME`) و دایرکتوری‌های user-bin پایدار را نگه می‌دارند، اما دایرکتوری‌های fallback حدس‌زده‌شده version-manager فقط وقتی روی disk وجود داشته باشند در PATH سرویس نوشته می‌شوند.

  </Accordion>
  <Accordion title="18. نوشتن config + metadata wizard">
    Doctor هر تغییر config را persist می‌کند و metadata wizard را برای ثبت اجرای doctor stamp می‌کند.
  </Accordion>
  <Accordion title="19. نکته‌های workspace (backup + سیستم memory)">
    Doctor وقتی سیستم memory workspace مفقود باشد آن را پیشنهاد می‌کند و اگر workspace از قبل زیر git نباشد یک نکته backup چاپ می‌کند.

    برای راهنمای کامل ساختار workspace و backup با git (GitHub یا GitLab خصوصی توصیه می‌شود)، [/concepts/agent-workspace](/fa/concepts/agent-workspace) را ببینید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [runbook Gateway](/fa/gateway)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
