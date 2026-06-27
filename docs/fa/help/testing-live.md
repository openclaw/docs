---
read_when:
    - اجرای آزمون‌های دود ماتریس مدل زنده / بک‌اند CLI / ACP / ارائه‌دهندهٔ رسانه
    - اشکال‌زدایی از حل اعتبارنامه‌های آزمون زنده
    - افزودن یک آزمون زنده جدید مخصوص ارائه‌دهنده
sidebarTitle: Live tests
summary: 'آزمون‌های زنده (درگیر با شبکه): ماتریس مدل، پشتانه‌های CLI، ACP، ارائه‌دهندگان رسانه، اعتبارنامه‌ها'
title: 'آزمایش: مجموعه‌های زنده'
x-i18n:
    generated_at: "2026-06-27T17:54:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

برای شروع سریع، اجراکننده‌های QA، مجموعه‌های واحد/یکپارچه‌سازی، و جریان‌های Docker، به
[Testing](/fa/help/testing) مراجعه کنید. این صفحه مجموعه‌های تست **زنده** (دارای تماس شبکه‌ای) را پوشش می‌دهد:
ماتریس مدل، بک‌اندهای CLI، ACP، و تست‌های زنده ارائه‌دهنده رسانه، به‌همراه
مدیریت اعتبارنامه‌ها.

## زنده: فرمان‌های smoke محلی

پیش از بررسی‌های زنده موردی، کلید ارائه‌دهنده لازم را در محیط فرایند export کنید.

smoke ایمن رسانه:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

smoke ایمن آمادگی تماس صوتی:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` یک اجرای خشک است مگر اینکه `--yes` نیز حاضر باشد. فقط زمانی از `--yes` استفاده کنید
که عمدا می‌خواهید یک تماس اطلاع‌رسانی واقعی برقرار کنید. برای Twilio، Telnyx، و
Plivo، بررسی آمادگی موفق به یک URL عمومی Webhook نیاز دارد؛ جایگزین‌های local-only
loopback/خصوصی بنا به طراحی رد می‌شوند.

## زنده: پیمایش قابلیت گره Android

- تست: `src/gateway/android-node.capabilities.live.test.ts`
- اسکریپت: `pnpm android:test:integration`
- هدف: فراخوانی **هر فرمانی که در حال حاضر** توسط یک گره Android متصل اعلام شده است و assert کردن رفتار قرارداد فرمان.
- دامنه:
  - راه‌اندازی پیش‌شرط‌دار/دستی (این مجموعه app را نصب/اجرا/pair نمی‌کند).
  - اعتبارسنجی command-by-command Gateway `node.invoke` برای گره Android انتخاب‌شده.
- پیش‌راه‌اندازی لازم:
  - app Android از قبل به gateway متصل و paired شده باشد.
  - app در پیش‌زمینه نگه داشته شود.
  - مجوزها/رضایت capture برای قابلیت‌هایی که انتظار دارید پاس شوند داده شده باشد.
- بازنویسی‌های اختیاری هدف:
  - `OPENCLAW_ANDROID_NODE_ID` یا `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- جزئیات کامل راه‌اندازی Android: [Android App](/fa/platforms/android)

## زنده: smoke مدل (کلیدهای پروفایل)

تست‌های زنده به دو لایه تقسیم شده‌اند تا بتوانیم شکست‌ها را جدا کنیم:

- «مدل مستقیم» به ما می‌گوید که ارائه‌دهنده/مدل اساسا می‌تواند با کلید داده‌شده پاسخ دهد.
- «Gateway smoke» به ما می‌گوید کل پایپ‌لاین gateway+agent برای آن مدل کار می‌کند (sessionها، history، tools، سیاست sandbox، و غیره).

### لایه ۱: تکمیل مستقیم مدل (بدون gateway)

- تست: `src/agents/models.profiles.live.test.ts`
- هدف:
  - شمارش مدل‌های کشف‌شده
  - استفاده از `getApiKeyForModel` برای انتخاب مدل‌هایی که برایشان creds دارید
  - اجرای یک تکمیل کوچک برای هر مدل (و رگرسیون‌های هدفمند در صورت نیاز)
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیما فراخوانی می‌کنید)
- برای اجرای واقعی این مجموعه، `OPENCLAW_LIVE_MODELS=modern`، `small`، یا `all` (alias برای modern) را تنظیم کنید؛ در غیر این صورت skip می‌شود تا `pnpm test:live` روی gateway smoke متمرکز بماند
- روش انتخاب مدل‌ها:
  - `OPENCLAW_LIVE_MODELS=modern` برای اجرای allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 5.1، MiniMax M3، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` برای اجرای allowlist محدود مدل‌های کوچک (مسیرهای Qwen 8B/9B سازگار با local، Ollama Gemma، OpenRouter Qwen/GLM، و Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` یک alias برای allowlist مدرن است
  - یا `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist جداشده با کاما)
  - اجراهای محلی مدل کوچک Ollama به‌طور پیش‌فرض از `http://127.0.0.1:11434` استفاده می‌کنند؛ `OPENCLAW_LIVE_OLLAMA_BASE_URL` را فقط برای endpointهای LAN، سفارشی، یا Ollama Cloud تنظیم کنید.
  - پیمایش‌های modern/all و small به‌طور پیش‌فرض از سقف‌های curated خود استفاده می‌کنند؛ برای پیمایش کامل پروفایل‌های انتخاب‌شده `OPENCLAW_LIVE_MAX_MODELS=0` یا برای سقف کوچک‌تر یک عدد مثبت تنظیم کنید.
  - پیمایش‌های کامل از `OPENCLAW_LIVE_TEST_TIMEOUT_MS` برای کل timeout تست direct-model استفاده می‌کنند. پیش‌فرض: ۶۰ دقیقه.
  - probeهای direct-model به‌طور پیش‌فرض با parallelism بیست‌تایی اجرا می‌شوند؛ برای بازنویسی، `OPENCLAW_LIVE_MODEL_CONCURRENCY` را تنظیم کنید.
- روش انتخاب ارائه‌دهنده‌ها:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist جداشده با کاما)
- کلیدها از کجا می‌آیند:
  - به‌طور پیش‌فرض: profile store و fallbackهای env
  - برای enforce کردن فقط **profile store**، `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` را تنظیم کنید
- چرایی وجود این بخش:
  - «API ارائه‌دهنده خراب است / کلید نامعتبر است» را از «پایپ‌لاین agent در gateway خراب است» جدا می‌کند
  - رگرسیون‌های کوچک و ایزوله را در بر می‌گیرد (مثال: replay reasoning در OpenAI Responses/Codex Responses + جریان‌های tool-call)

### لایه ۲: Gateway + smoke عامل dev (آنچه "@openclaw" واقعا انجام می‌دهد)

- تست: `src/gateway/gateway-models.profiles.live.test.ts`
- هدف:
  - راه‌اندازی یک gateway درون‌فرایندی
  - ایجاد/patch یک session با `agent:dev:*` (بازنویسی مدل برای هر اجرا)
  - پیمایش مدل‌های دارای کلید و assert کردن:
    - پاسخ «معنادار» (بدون tools)
    - یک فراخوانی tool واقعی کار می‌کند (probe خواندن)
    - probeهای tool اختیاری بیشتر (probe exec+read)
    - مسیرهای رگرسیون OpenAI (فقط tool-call → follow-up) همچنان کار می‌کنند
- جزئیات probe (تا بتوانید شکست‌ها را سریع توضیح دهید):
  - probe `read`: تست یک فایل nonce در workspace می‌نویسد و از agent می‌خواهد آن را `read` کند و nonce را echo کند.
  - probe `exec+read`: تست از agent می‌خواهد با `exec` یک nonce را در یک فایل temp بنویسد، سپس آن را `read` کند.
  - probe تصویر: تست یک PNG تولیدشده (cat + کد تصادفی) پیوست می‌کند و انتظار دارد مدل `cat <CODE>` را برگرداند.
  - مرجع پیاده‌سازی: `src/gateway/gateway-models.profiles.live.test.ts` و `test/helpers/live-image-probe.ts`.
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیما فراخوانی می‌کنید)
- روش انتخاب مدل‌ها:
  - پیش‌فرض: allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M3، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` برای اجرای همان allowlist محدود مدل‌های کوچک از طریق کل پایپ‌لاین gateway+agent
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` یک alias برای allowlist مدرن است
  - یا برای محدود کردن، `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (یا فهرست جداشده با کاما) را تنظیم کنید
  - پیمایش‌های gateway برای modern/all و small به‌طور پیش‌فرض از سقف‌های curated خود استفاده می‌کنند؛ برای پیمایش کامل موارد انتخاب‌شده `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` یا برای سقف کوچک‌تر یک عدد مثبت تنظیم کنید.
- روش انتخاب ارائه‌دهنده‌ها (برای اجتناب از «همه چیز OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist جداشده با کاما)
- probeهای tool + تصویر همیشه در این تست زنده روشن هستند:
  - probe `read` + probe `exec+read` (فشار tool)
  - probe تصویر زمانی اجرا می‌شود که مدل پشتیبانی از ورودی تصویر را اعلام کند
  - جریان (سطح بالا):
    - تست یک PNG کوچک با "CAT" + کد تصادفی تولید می‌کند (`test/helpers/live-image-probe.ts`)
    - آن را از طریق `agent` با `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ارسال می‌کند
    - Gateway پیوست‌ها را به `images[]` parse می‌کند (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - agent تعبیه‌شده یک پیام کاربر multimodal را به مدل forward می‌کند
    - Assertion: پاسخ شامل `cat` + کد است (تلرانس OCR: خطاهای جزئی مجازند)

<Tip>
برای دیدن اینکه روی ماشین خود چه چیزی را می‌توانید تست کنید (و شناسه‌های دقیق `provider/model`)، اجرا کنید:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## زنده: smoke بک‌اند CLI (Claude، Gemini، یا CLIهای محلی دیگر)

- تست: `src/gateway/gateway-cli-backend.live.test.ts`
- هدف: اعتبارسنجی پایپ‌لاین Gateway + agent با استفاده از یک بک‌اند CLI محلی، بدون دست زدن به config پیش‌فرض شما.
- پیش‌فرض‌های smoke ویژه بک‌اند کنار تعریف `cli-backend.ts` extension مالک قرار دارند.
- فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیما فراخوانی می‌کنید)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- پیش‌فرض‌ها:
  - ارائه‌دهنده/مدل پیش‌فرض: `claude-cli/claude-sonnet-4-6`
  - رفتار command/args/image از metadata بک‌اند CLI Plugin مالک می‌آید.
- بازنویسی‌ها (اختیاری):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` برای ارسال یک پیوست تصویر واقعی (pathها در prompt تزریق می‌شوند). دستورهای Docker این را به‌طور پیش‌فرض خاموش می‌گذارند مگر اینکه صراحتا درخواست شود.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` برای پاس دادن pathهای فایل تصویر به‌عنوان args در CLI به‌جای تزریق prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (یا `"list"`) برای کنترل نحوه پاس دادن args تصویر وقتی `IMAGE_ARG` تنظیم شده است.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` برای ارسال turn دوم و اعتبارسنجی جریان resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` برای opt in به probe پیوستگی همان session از Claude Sonnet -> Opus، وقتی مدل انتخاب‌شده از هدف switch پشتیبانی می‌کند. دستورهای Docker این را برای قابلیت اطمینان aggregate به‌طور پیش‌فرض خاموش می‌گذارند.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` برای opt in به probe MCP/tool loopback. دستورهای Docker این را به‌طور پیش‌فرض خاموش می‌گذارند مگر اینکه صراحتا درخواست شود.

مثال:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

smoke ارزان config MCP برای Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

این از Gemini نمی‌خواهد پاسخی تولید کند. همان system
settings را که OpenClaw به Gemini می‌دهد می‌نویسد، سپس `gemini --debug mcp list` را اجرا می‌کند تا ثابت کند یک سرور
ذخیره‌شده با `transport: "streamable-http"` به شکل HTTP MCP
Gemini نرمال‌سازی می‌شود و می‌تواند به یک سرور MCP محلی streamable-HTTP متصل شود.

دستور Docker:

```bash
pnpm test:docker:live-cli-backend
```

دستورهای Docker تک‌ارائه‌دهنده:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

نکات:

- اجراکننده Docker در `scripts/test-live-cli-backend-docker.sh` قرار دارد.
- smoke زنده بک‌اند CLI را داخل تصویر Docker repo به‌عنوان کاربر غیر root یعنی `node` اجرا می‌کند.
- metadata مربوط به smoke CLI را از extension مالک resolve می‌کند، سپس بسته CLI لینوکسی متناظر (`@anthropic-ai/claude-code` یا `@google/gemini-cli`) را در یک prefix نوشتنی cache شده در `OPENCLAW_DOCKER_CLI_TOOLS_DIR` نصب می‌کند (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` به Claude Code subscription OAuth قابل حمل از طریق یا `~/.claude/.credentials.json` با `claudeAiOauth.subscriptionType` یا `CLAUDE_CODE_OAUTH_TOKEN` از `claude setup-token` نیاز دارد. ابتدا اجرای مستقیم `claude -p` را در Docker ثابت می‌کند، سپس دو turn بک‌اند CLI در Gateway را بدون حفظ env varهای Anthropic API-key اجرا می‌کند. این مسیر subscription probeهای Claude MCP/tool و تصویر را به‌طور پیش‌فرض غیرفعال می‌کند، چون Claude در حال حاضر استفاده از appهای third-party را به‌جای محدودیت‌های عادی subscription plan از مسیر billing برای مصرف اضافی عبور می‌دهد.
- smoke زنده بک‌اند CLI اکنون همان جریان end-to-end را برای Claude و Gemini تمرین می‌کند: turn متنی، turn طبقه‌بندی تصویر، سپس tool call مربوط به MCP `cron` که از طریق gateway CLI تایید می‌شود.
- smoke پیش‌فرض Claude همچنین session را از Sonnet به Opus patch می‌کند و تایید می‌کند session resumed همچنان یک یادداشت قبلی را به خاطر دارد.

## زنده: دسترسی‌پذیری پروکسی APNs HTTP/2

- تست: `src/infra/push-apns-http2.live.test.ts`
- هدف: tunnel کردن از طریق یک پروکسی HTTP CONNECT محلی به endpoint sandbox APNs شرکت Apple، ارسال درخواست اعتبارسنجی APNs HTTP/2، و assert کردن اینکه پاسخ واقعی `403 InvalidProviderToken` شرکت Apple از مسیر پروکسی برمی‌گردد.
- فعال‌سازی:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- timeout اختیاری:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## زنده: smoke bind برای ACP (`/acp spawn ... --bind here`)

- تست: `src/gateway/gateway-acp-bind.live.test.ts`
- هدف: اعتبارسنجی جریان واقعی اتصال مکالمهٔ ACP با یک عامل زندهٔ ACP:
  - ارسال `/acp spawn <agent> --bind here`
  - اتصال درجا به یک مکالمهٔ مصنوعی کانال پیام
  - ارسال یک پیگیری عادی در همان مکالمه
  - تأیید اینکه پیگیری در رونوشت نشست متصل‌شدهٔ ACP ثبت می‌شود
- فعال‌سازی:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- پیش‌فرض‌ها:
  - عامل‌های ACP در Docker: `claude,codex,gemini`
  - عامل ACP برای اجرای مستقیم `pnpm test:live ...`: `claude`
  - کانال مصنوعی: زمینهٔ مکالمه به سبک DM در Slack
  - پشتوانهٔ ACP: `acpx`
- بازنویسی‌ها:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- نکته‌ها:
  - این مسیر از سطح `chat.send` در Gateway همراه با فیلدهای مصنوعی مسیر مبدأ مخصوص مدیر استفاده می‌کند تا تست‌ها بتوانند بدون وانمود کردن به تحویل بیرونی، زمینهٔ کانال پیام را متصل کنند.
  - وقتی `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` تنظیم نشده باشد، تست از رجیستری عامل داخلی Plugin تعبیه‌شدهٔ `acpx` برای عامل انتخاب‌شدهٔ هارنس ACP استفاده می‌کند.
  - ایجاد MCP مربوط به Cron نشست متصل‌شده به‌طور پیش‌فرض بهترین‌تلاش است، چون هارنس‌های بیرونی ACP می‌توانند پس از عبور اثبات اتصال/تصویر، فراخوانی‌های MCP را لغو کنند؛ برای سخت‌گیرانه کردن این بررسی Cron پس از اتصال، `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` را تنظیم کنید.

مثال:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

دستور Docker:

```bash
pnpm test:docker:live-acp-bind
```

دستورهای Docker برای یک عامل:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

نکته‌های Docker:

- اجراکنندهٔ Docker در `scripts/test-live-acp-bind-docker.sh` قرار دارد.
- به‌طور پیش‌فرض، آزمون smoke اتصال ACP را در برابر عامل‌های تجمیعی زندهٔ CLI به‌ترتیب اجرا می‌کند: `claude`، سپس `codex`، سپس `gemini`.
- برای محدود کردن ماتریس، از `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` یا `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` استفاده کنید.
- مواد احراز هویت CLI متناظر را در کانتینر مرحله‌بندی می‌کند، سپس اگر CLI زندهٔ درخواستی موجود نباشد، آن را نصب می‌کند (`@anthropic-ai/claude-code`، `@openai/codex`، Factory Droid از طریق `https://app.factory.ai/cli`، `@google/gemini-cli` یا `opencode-ai`). خودِ پشتوانهٔ ACP بستهٔ تعبیه‌شدهٔ `acpx/runtime` از Plugin رسمی `acpx` است.
- گونهٔ Docker مربوط به Droid، `~/.factory` را برای تنظیمات مرحله‌بندی می‌کند، `FACTORY_API_KEY` را فوروارد می‌کند، و به آن کلید API نیاز دارد چون احراز هویت محلی Factory با OAuth/keyring به کانتینر قابل انتقال نیست. این گونه از ورودی رجیستری داخلی ACPX با `droid exec --output-format acp` استفاده می‌کند.
- گونهٔ Docker مربوط به OpenCode یک مسیر سخت‌گیرانهٔ رگرسیون تک‌عاملی است. این مسیر یک مدل پیش‌فرض موقت `OPENCODE_CONFIG_CONTENT` را از `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` می‌نویسد (پیش‌فرض `opencode/kimi-k2.6`) و `pnpm test:docker:live-acp-bind:opencode` به‌جای پذیرش پرش عمومی پس از اتصال، به رونوشت دستیار متصل‌شده نیاز دارد.
- فراخوانی‌های مستقیم CLI مربوط به `acpx` فقط یک مسیر دستی/راه‌حل موقت برای مقایسهٔ رفتار بیرون از Gateway هستند. آزمون smoke اتصال ACP در Docker پشتوانهٔ زمان اجرای تعبیه‌شدهٔ `acpx` در OpenClaw را اجرا می‌کند.

## زنده: آزمون smoke هارنس app-server مربوط به Codex

- هدف: اعتبارسنجی هارنس Codex تحت مالکیت Plugin از طریق متد معمول Gateway
  `agent`:
  - بارگذاری Plugin بسته‌بندی‌شدهٔ `codex`
  - انتخاب `openai/gpt-5.5`، که به‌طور پیش‌فرض نوبت‌های عامل OpenAI را از طریق Codex مسیریابی می‌کند
  - ارسال نخستین نوبت عامل Gateway به `openai/gpt-5.5` با هارنس انتخاب‌شدهٔ Codex
  - ارسال نوبت دوم به همان نشست OpenClaw و تأیید اینکه ریسمان app-server می‌تواند از سر گرفته شود
  - اجرای `/codex status` و `/codex models` از طریق همان مسیر فرمان Gateway
  - در صورت تمایل، اجرای دو بررسی shell با ارتقای سطح و بازبینی Guardian: یک فرمان بی‌خطر که باید تأیید شود و یک بارگذاری راز جعلی که باید رد شود تا عامل دوباره سؤال کند
- تست: `src/gateway/gateway-codex-harness.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- مدل پیش‌فرض: `openai/gpt-5.5`
- بررسی اختیاری تصویر: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- بررسی اختیاری MCP/ابزار: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- بررسی اختیاری Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- این آزمون smoke، ارائه‌دهنده/مدل را با `agentRuntime.id: "codex"` اجبار می‌کند تا هارنس خراب Codex نتواند با fallback بی‌صدای OpenClaw قبول شود.
- احراز هویت: احراز هویت app-server مربوط به Codex از ورود اشتراک محلی Codex. آزمون‌های smoke در Docker همچنین می‌توانند در صورت کاربرد، برای بررسی‌های غیر Codex مقدار `OPENAI_API_KEY` را فراهم کنند، به‌همراه کپی اختیاری `~/.codex/auth.json` و `~/.codex/config.toml`.

دستور محلی:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

دستور Docker:

```bash
pnpm test:docker:live-codex-harness
```

نکته‌های Docker:

- اجراکنندهٔ Docker در `scripts/test-live-codex-harness-docker.sh` قرار دارد.
- مقدار `OPENAI_API_KEY` را عبور می‌دهد، فایل‌های احراز هویت Codex CLI را هنگام وجود کپی می‌کند، `@openai/codex` را در یک پیشوند npm قابل نوشتن و متصل‌شده نصب می‌کند، درخت منبع را مرحله‌بندی می‌کند، سپس فقط تست زندهٔ هارنس Codex را اجرا می‌کند.
- Docker به‌طور پیش‌فرض بررسی‌های تصویر، MCP/ابزار، و Guardian را فعال می‌کند. وقتی به اجرای عیب‌یابی محدودتری نیاز دارید، `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` یا `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` یا `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` را تنظیم کنید.
- Docker از همان پیکربندی صریح زمان اجرای Codex استفاده می‌کند، بنابراین نام‌های مستعار قدیمی یا fallback مربوط به OpenClaw نمی‌توانند رگرسیون هارنس Codex را پنهان کنند.

### دستورهای زندهٔ پیشنهادی

فهرست‌های مجاز محدود و صریح، سریع‌ترین و کم‌نوسان‌ترین گزینه‌ها هستند:

- یک مدل، مستقیم (بدون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- پروفایل مستقیم مدل کوچک:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- پروفایل Gateway برای مدل کوچک:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- آزمون smoke برای API مربوط به Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- یک مدل، آزمون smoke از طریق Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فراخوانی ابزار در چند ارائه‌دهنده:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- آزمون smoke مستقیم Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- تمرکز بر Google (کلید API مربوط به Gemini + Antigravity):
  - Gemini (کلید API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- آزمون smoke تفکر تطبیقی Google:
  - پیش‌فرض پویا Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - بودجهٔ پویا Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

نکته‌ها:

- `google/...` از API مربوط به Gemini استفاده می‌کند (کلید API).
- `google-antigravity/...` از پل OAuth مربوط به Antigravity استفاده می‌کند (نقطهٔ پایانی عامل به سبک Cloud Code Assist).
- `google-gemini-cli/...` از Gemini CLI محلی روی دستگاه شما استفاده می‌کند (احراز هویت جداگانه + ریزه‌کاری‌های ابزار).
- Gemini API در برابر Gemini CLI:
  - API: OpenClaw از طریق HTTP با API میزبانی‌شدهٔ Gemini توسط Google تماس می‌گیرد (کلید API / احراز هویت پروفایل)؛ این همان چیزی است که بیشتر کاربران از «Gemini» منظور می‌کنند.
  - CLI: OpenClaw یک باینری محلی `gemini` را از طریق shell اجرا می‌کند؛ این مسیر احراز هویت خودش را دارد و می‌تواند رفتار متفاوتی داشته باشد (پشتیبانی از جریان‌دهی/ابزار/اختلاف نسخه).

## زنده: ماتریس مدل‌ها (آنچه پوشش می‌دهیم)

هیچ «فهرست مدل CI» ثابتی وجود ندارد (زنده اختیاری است)، اما این‌ها مدل‌های **پیشنهادی** برای پوشش منظم روی دستگاه توسعه با کلیدها هستند.

### مجموعهٔ smoke مدرن (فراخوانی ابزار + تصویر)

این همان اجرای «مدل‌های رایج» است که انتظار داریم کارکرد آن حفظ شود:

- OpenAI (غیر Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و `google/gemini-3-flash-preview` (از مدل‌های قدیمی‌تر Gemini 2.x پرهیز کنید)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API عمومی) یا `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

اجرای آزمون smoke Gateway با ابزارها + تصویر:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط پایه: فراخوانی ابزار (Read + Exec اختیاری)

از هر خانوادهٔ ارائه‌دهنده دست‌کم یکی را انتخاب کنید:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (یا `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (API عمومی) یا `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

پوشش اختیاری اضافی (مفید است):

- xAI: `xai/grok-4.3` (یا آخرین مورد موجود)
- Mistral: `mistral/`… (یک مدل توانمند در «ابزارها» را که فعال کرده‌اید انتخاب کنید)
- Cerebras: `cerebras/`… (اگر دسترسی دارید)
- LM Studio: `lmstudio/`… (محلی؛ فراخوانی ابزار به حالت API بستگی دارد)

### بینایی: ارسال تصویر (پیوست ← پیام چندوجهی)

دست‌کم یک مدل توانمند در تصویر را در `OPENCLAW_LIVE_GATEWAY_MODELS` بگنجانید (گونه‌های توانمند در بینایی Claude/Gemini/OpenAI و غیره) تا بررسی تصویر اجرا شود.

### تجمیع‌کننده‌ها / Gatewayهای جایگزین

اگر کلیدها را فعال کرده‌اید، از طریق این‌ها نیز از تست پشتیبانی می‌کنیم:

- OpenRouter: `openrouter/...` (صدها مدل؛ برای یافتن گزینه‌های توانمند در ابزار+تصویر از `openclaw models scan` استفاده کنید)
- OpenCode: `opencode/...` برای Zen و `opencode-go/...` برای Go (احراز هویت از طریق `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ارائه‌دهنده‌های بیشتری که می‌توانید در ماتریس زنده بگنجانید (اگر اعتبارنامه/پیکربندی دارید):

- داخلی: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- از طریق `models.providers` (نقاط پایانی سفارشی): `minimax` (ابر/API)، به‌علاوه هر پراکسی سازگار با OpenAI/Anthropic (LM Studio، vLLM، LiteLLM و غیره)

<Tip>
«همه مدل‌ها» را در مستندات هاردکد نکنید. فهرست معتبر همان چیزی است که `discoverModels(...)` روی دستگاه شما برمی‌گرداند، به‌علاوه هر کلیدی که در دسترس است.
</Tip>

## اعتبارنامه‌ها (هرگز commit نکنید)

تست‌های زنده اعتبارنامه‌ها را همان‌طور کشف می‌کنند که CLI انجام می‌دهد. پیامدهای عملی:

- اگر CLI کار می‌کند، تست‌های زنده باید همان کلیدها را پیدا کنند.
- اگر یک تست زنده می‌گوید «اعتبارنامه‌ای نیست»، همان‌طور اشکال‌زدایی کنید که `openclaw models list` / انتخاب مدل را اشکال‌زدایی می‌کنید.

- پروفایل‌های احراز هویت به‌ازای هر عامل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (این همان چیزی است که «کلیدهای پروفایل» در تست‌های زنده یعنی)
- پیکربندی: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- دایرکتوری وضعیت قدیمی: `~/.openclaw/credentials/` (در صورت وجود، به خانه زنده مرحله‌بندی‌شده کپی می‌شود، اما مخزن اصلی کلیدهای پروفایل نیست)
- اجراهای محلی زنده به‌طور پیش‌فرض پیکربندی فعال، فایل‌های `auth-profiles.json` به‌ازای هر عامل، `credentials/` قدیمی، و دایرکتوری‌های احراز هویت CLI خارجی پشتیبانی‌شده را در یک خانه تست موقت کپی می‌کنند؛ خانه‌های زنده مرحله‌بندی‌شده `workspace/` و `sandboxes/` را رد می‌کنند، و بازنویسی‌های مسیر `agents.*.workspace` / `agentDir` حذف می‌شوند تا probeها از workspace واقعی میزبان شما دور بمانند.

اگر می‌خواهید به کلیدهای env تکیه کنید، آن‌ها را پیش از تست‌های محلی export کنید یا از
اجراکننده‌های Docker زیر با یک `OPENCLAW_PROFILE_FILE` صریح استفاده کنید.

## زنده Deepgram (رونویسی صوت)

- تست: `extensions/deepgram/audio.live.test.ts`
- فعال‌سازی: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## زنده برنامه کدنویسی BytePlus

- تست: `extensions/byteplus/live.test.ts`
- فعال‌سازی: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- بازنویسی اختیاری مدل: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## زنده رسانه workflow ComfyUI

- تست: `extensions/comfy/comfy.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- دامنه:
  - مسیرهای تصویر، ویدئو، و `music_generate` بسته‌بندی‌شده comfy را تمرین می‌کند
  - هر قابلیت را رد می‌کند مگر اینکه `plugins.entries.comfy.config.<capability>` پیکربندی شده باشد
  - پس از تغییر ارسال workflowهای comfy، polling، دانلودها، یا ثبت Plugin مفید است

## زنده تولید تصویر

- تست: `test/image-generation.runtime.live.test.ts`
- فرمان: `pnpm test:live test/image-generation.runtime.live.test.ts`
- harness: `pnpm test:live:media image`
- دامنه:
  - هر Plugin ارائه‌دهنده ثبت‌شده تولید تصویر را فهرست می‌کند
  - پیش از probe کردن، از env varهای ارائه‌دهنده که از قبل export شده‌اند استفاده می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/env را پیش از پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، بنابراین کلیدهای تست کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نمی‌کنند
  - ارائه‌دهنده‌هایی را که auth/profile/model قابل استفاده ندارند رد می‌کند
  - هر ارائه‌دهنده پیکربندی‌شده را از مسیر runtime مشترک تولید تصویر اجرا می‌کند:
    - `<provider>:generate`
    - `<provider>:edit` وقتی ارائه‌دهنده پشتیبانی edit را اعلام کند
- ارائه‌دهنده‌های بسته‌بندی‌شده فعلی که پوشش داده می‌شوند:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجباری کردن احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط-env

برای مسیر CLI عرضه‌شده، پس از موفق شدن تست زنده ارائه‌دهنده/runtime، یک smoke از `infer` اضافه کنید:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

این مورد parsing آرگومان‌های CLI، resolution پیکربندی/عامل پیش‌فرض، فعال‌سازی
Plugin بسته‌بندی‌شده، runtime مشترک تولید تصویر، و درخواست زنده ارائه‌دهنده را
پوشش می‌دهد. انتظار می‌رود وابستگی‌های Plugin پیش از بارگذاری runtime موجود باشند.

## زنده تولید موسیقی

- تست: `extensions/music-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- harness: `pnpm test:live:media music`
- دامنه:
  - مسیر مشترک ارائه‌دهنده بسته‌بندی‌شده تولید موسیقی را تمرین می‌کند
  - در حال حاضر Google و MiniMax را پوشش می‌دهد
  - پیش از probe کردن، از env varهای ارائه‌دهنده که از قبل export شده‌اند استفاده می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/env را پیش از پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، بنابراین کلیدهای تست کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نمی‌کنند
  - ارائه‌دهنده‌هایی را که auth/profile/model قابل استفاده ندارند رد می‌کند
  - هر دو حالت runtime اعلام‌شده را در صورت موجود بودن اجرا می‌کند:
    - `generate` با ورودی فقط-prompt
    - `edit` وقتی ارائه‌دهنده `capabilities.edit.enabled` را اعلام کند
  - پوشش lane مشترک فعلی:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: فایل زنده جداگانه Comfy، نه این sweep مشترک
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجباری کردن احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط-env

## زنده تولید ویدئو

- تست: `extensions/video-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- harness: `pnpm test:live:media video`
- دامنه:
  - مسیر مشترک ارائه‌دهنده بسته‌بندی‌شده تولید ویدئو را تمرین می‌کند
  - پیش‌فرض آن مسیر smoke امن برای release است: ارائه‌دهنده‌های غیر-FAL، یک درخواست text-to-video به‌ازای هر ارائه‌دهنده، prompt یک‌ثانیه‌ای خرچنگ، و سقف عملیات به‌ازای هر ارائه‌دهنده از `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (به‌طور پیش‌فرض `180000`)
  - FAL را به‌طور پیش‌فرض رد می‌کند، چون latency صف سمت ارائه‌دهنده می‌تواند زمان release را غالب کند؛ برای اجرای صریح آن `--video-providers fal` یا `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` را پاس دهید
  - پیش از probe کردن، از env varهای ارائه‌دهنده که از قبل export شده‌اند استفاده می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/env را پیش از پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، بنابراین کلیدهای تست کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نمی‌کنند
  - ارائه‌دهنده‌هایی را که auth/profile/model قابل استفاده ندارند رد می‌کند
  - به‌طور پیش‌فرض فقط `generate` را اجرا می‌کند
  - برای اجرای حالت‌های transform اعلام‌شده در صورت موجود بودن، `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید:
    - `imageToVideo` وقتی ارائه‌دهنده `capabilities.imageToVideo.enabled` را اعلام کند و ارائه‌دهنده/مدل انتخاب‌شده ورودی تصویر محلی buffer-backed را در sweep مشترک بپذیرد
    - `videoToVideo` وقتی ارائه‌دهنده `capabilities.videoToVideo.enabled` را اعلام کند و ارائه‌دهنده/مدل انتخاب‌شده ورودی ویدئوی محلی buffer-backed را در sweep مشترک بپذیرد
  - ارائه‌دهنده‌های `imageToVideo` اعلام‌شده اما ردشده فعلی در sweep مشترک:
    - `vydra` چون `veo3` بسته‌بندی‌شده فقط متن است و `kling` بسته‌بندی‌شده به URL تصویر remote نیاز دارد
  - پوشش ویژه ارائه‌دهنده Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - آن فایل `veo3` text-to-video را به‌علاوه یک lane از `kling` اجرا می‌کند که به‌طور پیش‌فرض از fixture URL تصویر remote استفاده می‌کند
  - پوشش زنده فعلی `videoToVideo`:
    - `runway` فقط وقتی مدل انتخاب‌شده `runway/gen4_aleph` باشد
  - ارائه‌دهنده‌های `videoToVideo` اعلام‌شده اما ردشده فعلی در sweep مشترک:
    - `alibaba`, `qwen`, `xai` چون آن مسیرها در حال حاضر به URLهای مرجع remote از نوع `http(s)` / MP4 نیاز دارند
    - `google` چون lane مشترک فعلی Gemini/Veo از ورودی محلی buffer-backed استفاده می‌کند و آن مسیر در sweep مشترک پذیرفته نمی‌شود
    - `openai` چون lane مشترک فعلی تضمین‌های دسترسی edit ویدئوی ویژه سازمان را ندارد
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` برای گنجاندن هر ارائه‌دهنده در sweep پیش‌فرض، از جمله FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` برای کاهش سقف عملیات هر ارائه‌دهنده در یک اجرای smoke تهاجمی
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجباری کردن احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط-env

## harness زنده رسانه

- فرمان: `pnpm test:live:media`
- هدف:
  - مجموعه‌های زنده مشترک تصویر، موسیقی، و ویدئو را از طریق یک نقطه ورود بومی repo اجرا می‌کند
  - از env varهای ارائه‌دهنده که از قبل export شده‌اند استفاده می‌کند
  - هر مجموعه را به‌طور پیش‌فرض به ارائه‌دهنده‌هایی محدود می‌کند که در حال حاضر احراز هویت قابل استفاده دارند
  - از `scripts/test-live.mjs` دوباره استفاده می‌کند، بنابراین رفتار Heartbeat و حالت بی‌صدا سازگار می‌ماند
- مثال‌ها:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مرتبط

- [تست‌کردن](/fa/help/testing) - مجموعه‌های unit، integration، QA، و Docker
