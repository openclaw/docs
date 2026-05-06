---
read_when:
    - اجرای آزمون‌های دود ماتریس مدل زنده / بک‌اند CLI / ACP / تأمین‌کننده رسانه
    - اشکال‌زدایی تشخیص اعتبارنامه‌های آزمون زنده
    - افزودن یک آزمون زنده مختص ارائه‌دهنده
sidebarTitle: Live tests
summary: 'تست‌های زنده (دارای تماس با شبکه): ماتریس مدل‌ها، بک‌اندهای CLI، ACP، ارائه‌دهندگان رسانه، اعتبارنامه‌ها'
title: 'آزمون: مجموعه‌های زنده'
x-i18n:
    generated_at: "2026-05-06T09:23:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a17a8065fd15c6d86ab782cb1fdb00d0b2558be2d43fb7cab3ca6e511055b82e
    source_path: help/testing-live.md
    workflow: 16
---

برای شروع سریع، اجراکننده‌های QA، مجموعه‌های واحد/یکپارچه‌سازی، و جریان‌های Docker، [آزمون](/fa/help/testing) را ببینید. این صفحه مجموعه‌های آزمون **زنده** (دارای تماس شبکه‌ای) را پوشش می‌دهد: ماتریس مدل، Backendهای CLI، ACP، و آزمون‌های زنده ارائه‌دهنده رسانه، به‌همراه مدیریت اعتبارنامه‌ها.

## زنده: دستورهای سلامت سریع پروفایل محلی

قبل از بررسی‌های زنده موردی، `~/.profile` را source کنید تا کلیدهای ارائه‌دهنده و مسیرهای ابزار محلی با shell شما هماهنگ باشند:

```bash
source ~/.profile
```

سلامت سریع رسانه امن:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

سلامت سریع آمادگی تماس صوتی امن:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` یک اجرای آزمایشی خشک است، مگر اینکه `--yes` نیز وجود داشته باشد. فقط وقتی `--yes` را استفاده کنید که عمدا می‌خواهید یک تماس اعلان واقعی برقرار کنید. برای Twilio، Telnyx، و Plivo، بررسی آمادگی موفق به یک URL عمومی Webhook نیاز دارد؛ جایگزین‌های local loopback یا خصوصی فقط-محلی عمدا رد می‌شوند.

## زنده: پیمایش قابلیت‌های Node اندروید

- آزمون: `src/gateway/android-node.capabilities.live.test.ts`
- اسکریپت: `pnpm android:test:integration`
- هدف: فراخوانی **هر دستوری که در حال حاضر** توسط یک Node اندروید متصل اعلام شده و بررسی رفتار قرارداد دستور.
- دامنه:
  - راه‌اندازی دستی/دارای پیش‌شرط (این مجموعه برنامه را نصب/اجرا/pair نمی‌کند).
  - اعتبارسنجی دستوربه‌دستور `node.invoke` در Gateway برای Node اندروید انتخاب‌شده.
- پیش‌راه‌اندازی لازم:
  - برنامه اندروید از قبل به Gateway متصل و pair شده باشد.
  - برنامه در foreground نگه داشته شود.
  - مجوزها/رضایت capture برای قابلیت‌هایی که انتظار دارید قبول شوند، اعطا شده باشد.
- بازنویسی‌های اختیاری هدف:
  - `OPENCLAW_ANDROID_NODE_ID` یا `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- جزئیات کامل راه‌اندازی اندروید: [برنامه اندروید](/fa/platforms/android)

## زنده: سلامت سریع مدل (کلیدهای پروفایل)

آزمون‌های زنده به دو لایه تقسیم شده‌اند تا بتوانیم خرابی‌ها را ایزوله کنیم:

- «مدل مستقیم» به ما می‌گوید ارائه‌دهنده/مدل اساسا با کلید داده‌شده می‌تواند پاسخ دهد.
- «سلامت سریع Gateway» به ما می‌گوید کل pipeline کامل Gateway+عامل برای آن مدل کار می‌کند (نشست‌ها، تاریخچه، ابزارها، سیاست sandbox، و غیره).

### لایه ۱: تکمیل مستقیم مدل (بدون Gateway)

- آزمون: `src/agents/models.profiles.live.test.ts`
- هدف:
  - فهرست‌کردن مدل‌های کشف‌شده
  - استفاده از `getApiKeyForModel` برای انتخاب مدل‌هایی که برایشان اعتبارنامه دارید
  - اجرای یک تکمیل کوچک برای هر مدل (و رگرسیون‌های هدفمند در صورت نیاز)
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- برای اجرای واقعی این مجموعه، `OPENCLAW_LIVE_MODELS=modern` (یا `all`، نام مستعار modern) را تنظیم کنید؛ در غیر این صورت، برای اینکه `pnpm test:live` روی سلامت سریع Gateway متمرکز بماند، skip می‌شود
- روش انتخاب مدل‌ها:
  - `OPENCLAW_LIVE_MODELS=modern` برای اجرای allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` نام مستعار allowlist مدرن است
  - یا `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist جداشده با ویرگول)
  - پیمایش‌های modern/all به‌صورت پیش‌فرض از یک سقف گزینشی با سیگنال بالا استفاده می‌کنند؛ برای پیمایش مدرن کامل `OPENCLAW_LIVE_MAX_MODELS=0` یا برای سقف کوچک‌تر یک عدد مثبت تنظیم کنید.
  - پیمایش‌های کامل از `OPENCLAW_LIVE_TEST_TIMEOUT_MS` برای timeout کل آزمون مدل مستقیم استفاده می‌کنند. پیش‌فرض: ۶۰ دقیقه.
  - probeهای مدل مستقیم به‌صورت پیش‌فرض با موازی‌سازی ۲۰تایی اجرا می‌شوند؛ برای بازنویسی، `OPENCLAW_LIVE_MODEL_CONCURRENCY` را تنظیم کنید.
- روش انتخاب ارائه‌دهنده‌ها:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist جداشده با ویرگول)
- کلیدها از کجا می‌آیند:
  - به‌صورت پیش‌فرض: ذخیره‌گاه پروفایل و fallbackهای env
  - برای الزام فقط به **ذخیره‌گاه پروفایل**، `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` را تنظیم کنید
- دلیل وجود این مورد:
  - «API ارائه‌دهنده خراب است / کلید نامعتبر است» را از «pipeline عامل Gateway خراب است» جدا می‌کند
  - رگرسیون‌های کوچک و ایزوله را در خود دارد (مثال: بازپخش reasoning در OpenAI Responses/Codex Responses + جریان‌های tool-call)

### لایه ۲: سلامت سریع Gateway + عامل توسعه (کاری که "@openclaw" واقعا انجام می‌دهد)

- آزمون: `src/gateway/gateway-models.profiles.live.test.ts`
- هدف:
  - بالا آوردن یک Gateway درون‌پردازشی
  - ایجاد/patch کردن یک نشست `agent:dev:*` (بازنویسی مدل در هر اجرا)
  - پیمایش مدل‌های دارای کلید و بررسی:
    - پاسخ «معنادار» (بدون ابزار)
    - یک فراخوانی ابزار واقعی کار می‌کند (probe خواندن)
    - probeهای ابزار اضافی اختیاری (probe اجرا+خواندن)
    - مسیرهای رگرسیون OpenAI (فقط-tool-call → پیگیری) همچنان کار می‌کنند
- جزئیات probe (تا بتوانید خرابی‌ها را سریع توضیح دهید):
  - probe `read`: آزمون یک فایل nonce در workspace می‌نویسد و از عامل می‌خواهد آن را `read` کند و nonce را echo کند.
  - probe `exec+read`: آزمون از عامل می‌خواهد با `exec` یک nonce را در فایل موقت بنویسد، سپس آن را `read` کند.
  - probe تصویر: آزمون یک PNG تولیدشده (cat + کد تصادفی) را attach می‌کند و انتظار دارد مدل `cat <CODE>` را برگرداند.
  - مرجع پیاده‌سازی: `src/gateway/gateway-models.profiles.live.test.ts` و `src/gateway/live-image-probe.ts`.
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- روش انتخاب مدل‌ها:
  - پیش‌فرض: allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` نام مستعار allowlist مدرن است
  - یا برای محدودکردن، `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (یا فهرست جداشده با ویرگول) را تنظیم کنید
  - پیمایش‌های Gateway در حالت modern/all به‌صورت پیش‌فرض از یک سقف گزینشی با سیگنال بالا استفاده می‌کنند؛ برای پیمایش مدرن کامل `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` یا برای سقف کوچک‌تر یک عدد مثبت تنظیم کنید.
- روش انتخاب ارائه‌دهنده‌ها (برای اجتناب از «همه‌چیز OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist جداشده با ویرگول)
- probeهای ابزار + تصویر در این آزمون زنده همیشه روشن‌اند:
  - probe `read` + probe `exec+read` (فشار ابزار)
  - وقتی مدل پشتیبانی از ورودی تصویر را اعلام کند، probe تصویر اجرا می‌شود
  - جریان (در سطح بالا):
    - آزمون یک PNG کوچک با "CAT" + کد تصادفی تولید می‌کند (`src/gateway/live-image-probe.ts`)
    - آن را از طریق `agent` و `attachments: [{ mimeType: "image/png", content: "<base64>" }]` می‌فرستد
    - Gateway پیوست‌ها را به `images[]` parse می‌کند (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - عامل embedded یک پیام کاربر چندوجهی را به مدل forward می‌کند
    - assertion: پاسخ شامل `cat` + کد باشد (تحمل OCR: خطاهای جزئی مجازند)

<Tip>
برای دیدن اینکه روی دستگاه خود چه چیزهایی را می‌توانید آزمون کنید (و idهای دقیق `provider/model`)، اجرا کنید:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## زنده: سلامت سریع Backend CLI (Claude، Codex، Gemini، یا CLIهای محلی دیگر)

- آزمون: `src/gateway/gateway-cli-backend.live.test.ts`
- هدف: اعتبارسنجی pipeline Gateway + عامل با استفاده از یک Backend CLI محلی، بدون دست‌زدن به پیکربندی پیش‌فرض شما.
- پیش‌فرض‌های سلامت سریع مخصوص Backend در تعریف `cli-backend.ts` متعلق به Plugin مالک قرار دارند.
- فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- پیش‌فرض‌ها:
  - ارائه‌دهنده/مدل پیش‌فرض: `claude-cli/claude-sonnet-4-6`
  - رفتار دستور/args/تصویر از metadata متعلق به Plugin Backend CLI مالک می‌آید.
- بازنویسی‌ها (اختیاری):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` برای ارسال یک پیوست تصویر واقعی (مسیرها داخل prompt تزریق می‌شوند). recipeهای Docker به‌صورت پیش‌فرض این را خاموش می‌گذارند مگر اینکه صریحا درخواست شود.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` برای پاس‌دادن مسیرهای فایل تصویر به‌عنوان args در CLI به‌جای تزریق prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (یا `"list"`) برای کنترل نحوه پاس‌دادن args تصویر وقتی `IMAGE_ARG` تنظیم شده است.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` برای ارسال نوبت دوم و اعتبارسنجی جریان resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` برای ورود اختیاری به probe تداوم همان نشست Claude Sonnet -> Opus وقتی مدل انتخاب‌شده از هدف switch پشتیبانی می‌کند. recipeهای Docker برای قابلیت اتکای تجمعی به‌صورت پیش‌فرض این را خاموش می‌گذارند.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` برای ورود اختیاری به probe MCP/tool loopback. recipeهای Docker به‌صورت پیش‌فرض این را خاموش می‌گذارند مگر اینکه صریحا درخواست شود.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

سلامت سریع ارزان پیکربندی MCP در Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

این از Gemini نمی‌خواهد پاسخی تولید کند. همان تنظیمات سیستمی را که OpenClaw به Gemini می‌دهد می‌نویسد، سپس `gemini --debug mcp list` را اجرا می‌کند تا ثابت کند یک سرور ذخیره‌شده با `transport: "streamable-http"` به شکل HTTP MCP در Gemini نرمال‌سازی می‌شود و می‌تواند به یک سرور محلی streamable-HTTP MCP متصل شود.

recipe Docker:

```bash
pnpm test:docker:live-cli-backend
```

recipeهای Docker تک‌ارائه‌دهنده:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

نکته‌ها:

- اجراکننده Docker در `scripts/test-live-cli-backend-docker.sh` قرار دارد.
- سلامت سریع Backend CLI زنده را داخل image Docker مخزن به‌عنوان کاربر غیر-root با نام `node` اجرا می‌کند.
- metadata سلامت سریع CLI را از extension مالک resolve می‌کند، سپس package CLI لینوکس متناظر (`@anthropic-ai/claude-code`، `@openai/codex`، یا `@google/gemini-cli`) را در یک prefix قابل‌نوشتن cache‌شده در `OPENCLAW_DOCKER_CLI_TOOLS_DIR` نصب می‌کند (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` به OAuth قابل‌حمل اشتراک Claude Code نیاز دارد، یا از طریق `~/.claude/.credentials.json` با `claudeAiOauth.subscriptionType` یا `CLAUDE_CODE_OAUTH_TOKEN` از `claude setup-token`. ابتدا اجرای مستقیم `claude -p` در Docker را ثابت می‌کند، سپس دو نوبت Backend CLI در Gateway را بدون حفظ env vars کلید API Anthropic اجرا می‌کند. این lane اشتراک، probeهای MCP/tool و تصویر Claude را به‌صورت پیش‌فرض غیرفعال می‌کند، چون Claude در حال حاضر استفاده از برنامه‌های شخص ثالث را به‌جای محدودیت‌های معمول طرح اشتراک، از مسیر صورت‌حساب extra-usage عبور می‌دهد.
- سلامت سریع Backend CLI زنده اکنون همان جریان end-to-end را برای Claude، Codex، و Gemini اجرا می‌کند: نوبت متن، نوبت طبقه‌بندی تصویر، سپس فراخوانی ابزار MCP `cron` که از طریق Gateway CLI تأیید می‌شود.
- سلامت سریع پیش‌فرض Claude همچنین نشست را از Sonnet به Opus patch می‌کند و تأیید می‌کند نشست resumeشده هنوز یک یادداشت قبلی را به خاطر دارد.

## زنده: دسترسی‌پذیری proxy HTTP/2 برای APNs

- آزمون: `src/infra/push-apns-http2.live.test.ts`
- هدف: تونل‌زدن از طریق یک proxy محلی HTTP CONNECT به endpoint sandbox APNs اپل، ارسال درخواست اعتبارسنجی HTTP/2 در APNs، و بررسی اینکه پاسخ واقعی `403 InvalidProviderToken` اپل از مسیر proxy برمی‌گردد.
- فعال‌سازی:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- timeout اختیاری:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## زنده: سلامت سریع bind در ACP (`/acp spawn ... --bind here`)

- آزمون: `src/gateway/gateway-acp-bind.live.test.ts`
- هدف: اعتبارسنجی جریان واقعی اتصال مکالمه ACP با یک عامل زنده ACP:
  - ارسال `/acp spawn <agent> --bind here`
  - اتصال یک مکالمه ساختگی کانال پیام در همان محل
  - ارسال یک پیگیری معمولی در همان مکالمه
  - بررسی اینکه پیگیری وارد رونوشت نشست ACP متصل‌شده می‌شود
- فعال‌سازی:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- پیش‌فرض‌ها:
  - عامل‌های ACP در Docker: `claude,codex,gemini`
  - عامل ACP برای اجرای مستقیم `pnpm test:live ...`: `claude`
  - کانال ساختگی: زمینه مکالمه به سبک پیام مستقیم Slack
  - پشتانه ACP: `acpx`
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
- یادداشت‌ها:
  - این مسیر از سطح Gateway به نام `chat.send` با فیلدهای مسیر مبدأ ساختگیِ فقط ویژه مدیر استفاده می‌کند تا آزمون‌ها بتوانند زمینه کانال پیام را بدون وانمود کردن به تحویل بیرونی پیوست کنند.
  - وقتی `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` تنظیم نشده باشد، آزمون از رجیستری داخلی عامل در Plugin تعبیه‌شده `acpx` برای عامل هارنس ACP انتخاب‌شده استفاده می‌کند.
  - ایجاد MCP مربوط به Cron نشست متصل‌شده به‌طور پیش‌فرض با بهترین تلاش انجام می‌شود، چون هارنس‌های ACP بیرونی می‌توانند پس از گذشتن اثبات اتصال/تصویر، فراخوانی‌های MCP را لغو کنند؛ برای سخت‌گیرانه کردن آن وارسی Cron پس از اتصال، `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` را تنظیم کنید.

نمونه:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

دستور Docker:

```bash
pnpm test:docker:live-acp-bind
```

دستورهای Docker تک‌عاملی:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

یادداشت‌های Docker:

- اجراکننده Docker در `scripts/test-live-acp-bind-docker.sh` قرار دارد.
- به‌طور پیش‌فرض، دودآزمون اتصال ACP را در برابر عامل‌های زنده تجمیعی CLI به‌ترتیب اجرا می‌کند: `claude`، سپس `codex`، و بعد `gemini`.
- برای محدود کردن ماتریس از `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`، یا `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` استفاده کنید.
- این اجراکننده `~/.profile` را source می‌کند، مواد احراز هویت CLI متناظر را داخل کانتینر آماده می‌کند، سپس در صورت نبود، CLI زنده درخواست‌شده (`@anthropic-ai/claude-code`، `@openai/codex`، Factory Droid از طریق `https://app.factory.ai/cli`، `@google/gemini-cli`، یا `opencode-ai`) را نصب می‌کند. خود پشتانه ACP بسته تعبیه‌شده `acpx/runtime` از Plugin رسمی `acpx` است.
- گونه Docker مربوط به Droid، `~/.factory` را برای تنظیمات آماده می‌کند، `FACTORY_API_KEY` را عبور می‌دهد، و به آن کلید API نیاز دارد چون احراز هویت OAuth/keyring محلی Factory به کانتینر قابل حمل نیست. این گونه از ورودی رجیستری داخلی ACPX یعنی `droid exec --output-format acp` استفاده می‌کند.
- گونه Docker مربوط به OpenCode یک مسیر رگرسیون سخت‌گیرانه تک‌عاملی است. پس از source کردن `~/.profile`، یک مدل پیش‌فرض موقت `OPENCODE_CONFIG_CONTENT` را از `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` می‌نویسد (پیش‌فرض `opencode/kimi-k2.6`) و `pnpm test:docker:live-acp-bind:opencode` به‌جای پذیرش پرش عمومی پس از اتصال، به رونوشت دستیار متصل‌شده نیاز دارد.
- فراخوانی‌های مستقیم CLI مربوط به `acpx` فقط مسیر دستی/راه‌حل جایگزین برای مقایسه رفتار بیرون از Gateway هستند. دودآزمون اتصال ACP در Docker پشتانه زمان‌اجرای تعبیه‌شده `acpx` در OpenClaw را تمرین می‌دهد.

## زنده: دودآزمون هارنس سرور برنامه Codex

- هدف: اعتبارسنجی هارنس Codex تحت مالکیت Plugin از طریق متد معمول Gateway
  `agent`:
  - بارگذاری Plugin همراه `codex`
  - انتخاب `OPENCLAW_AGENT_RUNTIME=codex`
  - ارسال نخستین نوبت عامل Gateway به `openai/gpt-5.5` با اجبار هارنس Codex
  - ارسال نوبت دوم به همان نشست OpenClaw و بررسی اینکه نخ سرور برنامه
    می‌تواند ادامه پیدا کند
  - اجرای `/codex status` و `/codex models` از همان مسیر فرمان Gateway
  - در صورت تمایل، اجرای دو وارسی پوسته ارتقایافته با بازبینی Guardian: یک
    فرمان بی‌خطر که باید تأیید شود و یک بارگذاری راز جعلی که باید
    رد شود تا عامل پرسش بازگشتی مطرح کند
- آزمون: `src/gateway/gateway-codex-harness.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- مدل پیش‌فرض: `openai/gpt-5.5`
- وارسی اختیاری تصویر: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- وارسی اختیاری MCP/ابزار: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- وارسی اختیاری Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- دودآزمون از `agentRuntime.id: "codex"` استفاده می‌کند تا هارنس خراب Codex
  نتواند با بازگشت بی‌صدای fallback به PI قبول شود.
- احراز هویت: احراز هویت سرور برنامه Codex از ورود محلی اشتراک Codex. دودآزمون‌های Docker
  همچنین می‌توانند در صورت کاربرد، `OPENAI_API_KEY` را برای وارسی‌های غیر Codex فراهم کنند،
  به‌علاوه نسخه‌های کپی‌شده اختیاری `~/.codex/auth.json` و `~/.codex/config.toml`.

دستور محلی:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

دستور Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

یادداشت‌های Docker:

- اجراکننده Docker در `scripts/test-live-codex-harness-docker.sh` قرار دارد.
- این اجراکننده `~/.profile` نصب‌شده را source می‌کند، `OPENAI_API_KEY` را عبور می‌دهد، فایل‌های احراز هویت CLI مربوط به Codex را
  در صورت وجود کپی می‌کند، `@openai/codex` را در یک پیشوند npm نصب‌شده و قابل نوشتن
  نصب می‌کند، درخت منبع را آماده می‌کند، سپس فقط آزمون زنده هارنس Codex را اجرا می‌کند.
- Docker به‌طور پیش‌فرض وارسی‌های تصویر، MCP/ابزار، و Guardian را فعال می‌کند. وقتی به اجرای
  اشکال‌زدایی محدودتری نیاز دارید، `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` را تنظیم کنید.
- Docker از همان پیکربندی صریح زمان‌اجرای Codex استفاده می‌کند، بنابراین نام‌های مستعار قدیمی یا fallback
  به PI نمی‌توانند رگرسیون هارنس Codex را پنهان کنند.

### دستورهای زنده پیشنهادی

فهرست‌های مجاز محدود و صریح سریع‌ترین و کم‌نوسان‌ترین گزینه‌ها هستند:

- تک‌مدل، مستقیم (بدون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- تک‌مدل، دودآزمون Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فراخوانی ابزار در چند ارائه‌دهنده:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تمرکز Google (کلید API Gemini + Antigravity):
  - Gemini (کلید API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- دودآزمون تفکر تطبیقی Google:
  - اگر کلیدهای محلی در پروفایل پوسته هستند: `source ~/.profile`
  - پیش‌فرض پویا Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - بودجه پویا Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

یادداشت‌ها:

- `google/...` از API مربوط به Gemini استفاده می‌کند (کلید API).
- `google-antigravity/...` از پل OAuth مربوط به Antigravity استفاده می‌کند (نقطه پایانی عامل به سبک Cloud Code Assist).
- `google-gemini-cli/...` از CLI محلی Gemini روی دستگاه شما استفاده می‌کند (احراز هویت جداگانه + ظرایف ابزاردهی).
- Gemini API در برابر Gemini CLI:
  - API: OpenClaw، API میزبانی‌شده Gemini متعلق به Google را از طریق HTTP فراخوانی می‌کند (کلید API / احراز هویت پروفایل)؛ این همان چیزی است که بیشتر کاربران از "Gemini" منظور دارند.
  - CLI: OpenClaw به یک باینری محلی `gemini` shell out می‌کند؛ این باینری احراز هویت خودش را دارد و می‌تواند متفاوت رفتار کند (پشتیبانی streaming/ابزار/ناهمگونی نسخه).

## زنده: ماتریس مدل (آنچه پوشش می‌دهیم)

هیچ «فهرست مدل CI» ثابتی وجود ندارد (زنده اختیاری است)، اما این‌ها مدل‌های **پیشنهادی** برای پوشش منظم روی دستگاه توسعه با کلیدها هستند.

### مجموعه دودآزمون مدرن (فراخوانی ابزار + تصویر)

این اجرای «مدل‌های رایج» است که انتظار داریم کارکرد آن حفظ شود:

- OpenAI (غیر Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و `google/gemini-3-flash-preview` (از مدل‌های قدیمی‌تر Gemini 2.x پرهیز کنید)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

اجرای دودآزمون Gateway با ابزارها + تصویر:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### مبنا: فراخوانی ابزار (Read + Exec اختیاری)

از هر خانواده ارائه‌دهنده، دست‌کم یکی را انتخاب کنید:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (یا `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

پوشش افزوده اختیاری (مفید برای داشتن):

- xAI: `xai/grok-4.3` (یا جدیدترین موجود)
- Mistral: `mistral/`… (یک مدل توانمند در «ابزارها» که فعال کرده‌اید انتخاب کنید)
- Cerebras: `cerebras/`… (اگر دسترسی دارید)
- LM Studio: `lmstudio/`… (محلی؛ فراخوانی ابزار به حالت API بستگی دارد)

### بینایی: ارسال تصویر (پیوست → پیام چندوجهی)

برای تمرین وارسی تصویر، دست‌کم یک مدل دارای قابلیت تصویر را در `OPENCLAW_LIVE_GATEWAY_MODELS` وارد کنید (گونه‌های دارای قابلیت بینایی Claude/Gemini/OpenAI و غیره).

### گردآورنده‌ها / Gatewayهای جایگزین

اگر کلیدها را فعال کرده‌اید، از طریق این موارد هم از آزمون پشتیبانی می‌کنیم:

- OpenRouter: `openrouter/...` (صدها مدل؛ برای یافتن نامزدهای دارای قابلیت ابزار+تصویر از `openclaw models scan` استفاده کنید)
- OpenCode: `opencode/...` برای Zen و `opencode-go/...` برای Go (احراز هویت از طریق `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ارائه‌دهندگان بیشتری که می‌توانید در ماتریس زنده وارد کنید (اگر اعتبارنامه/پیکربندی دارید):

- داخلی: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- از طریق `models.providers` (نقطه‌های پایانی سفارشی): `minimax` (cloud/API)، به‌علاوه هر پراکسی سازگار با OpenAI/Anthropic (LM Studio، vLLM، LiteLLM، و غیره)

<Tip>
«همه مدل‌ها» را در مستندات hardcode نکنید. فهرست معتبر همان چیزی است که `discoverModels(...)` روی دستگاه شما برمی‌گرداند، به‌علاوه هر کلیدی که در دسترس است.
</Tip>

## اعتبارنامه‌ها (هرگز commit نکنید)

آزمون‌های زنده اعتبارنامه‌ها را همان‌طور کشف می‌کنند که CLI کشف می‌کند. پیامدهای عملی:

- اگر CLI کار می‌کند، آزمون‌های زنده باید همان کلیدها را پیدا کنند.
- اگر یک آزمون زنده می‌گوید «اعتبارنامه‌ای نیست»، همان‌طور اشکال‌زدایی کنید که `openclaw models list` / انتخاب مدل را اشکال‌زدایی می‌کنید.

- پروفایل‌های احراز هویت هر عامل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (در آزمون‌های زنده منظور از «کلیدهای پروفایل» همین است)
- پیکربندی: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- پوشهٔ وضعیت قدیمی: `~/.openclaw/credentials/` (در صورت وجود، به خانهٔ زندهٔ مرحله‌بندی‌شده کپی می‌شود، اما مخزن اصلی کلیدهای پروفایل نیست)
- اجراهای زندهٔ محلی به‌طور پیش‌فرض پیکربندی فعال، فایل‌های `auth-profiles.json` هر عامل، `credentials/` قدیمی، و پوشه‌های احراز هویت CLI خارجی پشتیبانی‌شده را در یک خانهٔ آزمون موقت کپی می‌کنند؛ خانه‌های زندهٔ مرحله‌بندی‌شده از `workspace/` و `sandboxes/` صرف‌نظر می‌کنند، و بازنویسی‌های مسیر `agents.*.workspace` / `agentDir` حذف می‌شوند تا probeها از فضای کاری واقعی میزبان شما دور بمانند.

اگر می‌خواهید به کلیدهای env تکیه کنید (برای مثال export شده در `~/.profile`)، آزمون‌های محلی را پس از `source ~/.profile` اجرا کنید، یا از اجراکننده‌های Docker زیر استفاده کنید (آن‌ها می‌توانند `~/.profile` را داخل کانتینر mount کنند).

## Deepgram زنده (رونویسی صوتی)

- آزمون: `extensions/deepgram/audio.live.test.ts`
- فعال‌سازی: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## طرح کدنویسی زندهٔ BytePlus

- آزمون: `extensions/byteplus/live.test.ts`
- فعال‌سازی: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- بازنویسی اختیاری مدل: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## رسانهٔ گردش‌کار زندهٔ ComfyUI

- آزمون: `extensions/comfy/comfy.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- دامنه:
  - مسیرهای تصویر، ویدیو، و `music_generate` همراه comfy را اجرا می‌کند
  - هر قابلیت را رد می‌کند مگر اینکه `plugins.entries.comfy.config.<capability>` پیکربندی شده باشد
  - پس از تغییر ارسال گردش‌کار comfy، polling، دانلودها، یا ثبت Plugin مفید است

## تولید تصویر زنده

- آزمون: `test/image-generation.runtime.live.test.ts`
- دستور: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ابزار آزمون: `pnpm test:live:media image`
- دامنه:
  - همهٔ Pluginهای provider ثبت‌شدهٔ تولید تصویر را فهرست می‌کند
  - پیش از probe، متغیرهای env مفقود provider را از shell ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/env را مقدم بر پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، بنابراین کلیدهای آزمون قدیمی در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نمی‌کنند
  - providerهایی را که احراز هویت/پروفایل/مدل قابل استفاده ندارند رد می‌کند
  - هر provider پیکربندی‌شده را از مسیر runtime مشترک تولید تصویر اجرا می‌کند:
    - `<provider>:generate`
    - `<provider>:edit` وقتی provider پشتیبانی از ویرایش را اعلام کند
- providerهای همراه فعلی تحت پوشش:
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
- رفتار احراز هویت اختیاری:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجباری کردن احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط env

برای مسیر CLI منتشرشده، پس از موفق شدن آزمون زندهٔ provider/runtime، یک smoke از نوع `infer` اضافه کنید:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

این مورد parsing آرگومان‌های CLI، حل پیکربندی/عامل پیش‌فرض، فعال‌سازی
Plugin همراه، runtime مشترک تولید تصویر، و درخواست زندهٔ provider را پوشش می‌دهد.
انتظار می‌رود وابستگی‌های Plugin پیش از بارگذاری runtime حاضر باشند.

## تولید موسیقی زنده

- آزمون: `extensions/music-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ابزار آزمون: `pnpm test:live:media music`
- دامنه:
  - مسیر provider مشترک همراه تولید موسیقی را اجرا می‌کند
  - در حال حاضر Google و MiniMax را پوشش می‌دهد
  - پیش از probe، متغیرهای env مربوط به provider را از shell ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/env را مقدم بر پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، بنابراین کلیدهای آزمون قدیمی در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نمی‌کنند
  - providerهایی را که احراز هویت/پروفایل/مدل قابل استفاده ندارند رد می‌کند
  - هر دو حالت runtime اعلام‌شده را در صورت موجود بودن اجرا می‌کند:
    - `generate` با ورودی فقط prompt
    - `edit` وقتی provider مقدار `capabilities.edit.enabled` را اعلام کند
  - پوشش مسیر مشترک فعلی:
    - `google`: `generate`، `edit`
    - `minimax`: `generate`
    - `comfy`: فایل زندهٔ جداگانهٔ Comfy، نه این sweep مشترک
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- رفتار احراز هویت اختیاری:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجباری کردن احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط env

## تولید ویدیو زنده

- آزمون: `extensions/video-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ابزار آزمون: `pnpm test:live:media video`
- دامنه:
  - مسیر provider مشترک همراه تولید ویدیو را اجرا می‌کند
  - به‌طور پیش‌فرض از مسیر smoke مناسب انتشار استفاده می‌کند: providerهای غیر FAL، یک درخواست متن‌به‌ویدیو برای هر provider، prompt یک‌ثانیه‌ای lobster، و سقف عملیات برای هر provider از `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` به‌طور پیش‌فرض)
  - FAL را به‌طور پیش‌فرض رد می‌کند چون latency صف سمت provider می‌تواند زمان انتشار را غالب کند؛ برای اجرای صریح آن `--video-providers fal` یا `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` را ارسال کنید
  - پیش از probe، متغیرهای env مربوط به provider را از shell ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/env را مقدم بر پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، بنابراین کلیدهای آزمون قدیمی در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نمی‌کنند
  - providerهایی را که احراز هویت/پروفایل/مدل قابل استفاده ندارند رد می‌کند
  - به‌طور پیش‌فرض فقط `generate` را اجرا می‌کند
  - برای اجرای حالت‌های transform اعلام‌شده در صورت موجود بودن، `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید:
    - `imageToVideo` وقتی provider مقدار `capabilities.imageToVideo.enabled` را اعلام کند و provider/مدل انتخاب‌شده در sweep مشترک ورودی تصویر محلی مبتنی بر buffer را بپذیرد
    - `videoToVideo` وقتی provider مقدار `capabilities.videoToVideo.enabled` را اعلام کند و provider/مدل انتخاب‌شده در sweep مشترک ورودی ویدیوی محلی مبتنی بر buffer را بپذیرد
  - providerهای `imageToVideo` اعلام‌شده اما ردشدهٔ فعلی در sweep مشترک:
    - `vydra` چون `veo3` همراه فقط متن‌محور است و `kling` همراه به URL تصویر راه‌دور نیاز دارد
  - پوشش مختص provider برای Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - آن فایل به‌طور پیش‌فرض `veo3` متن‌به‌ویدیو به‌علاوهٔ یک مسیر `kling` را اجرا می‌کند که از fixture با URL تصویر راه‌دور استفاده می‌کند
  - پوشش زندهٔ فعلی `videoToVideo`:
    - `runway` فقط وقتی مدل انتخاب‌شده `runway/gen4_aleph` باشد
  - providerهای `videoToVideo` اعلام‌شده اما ردشدهٔ فعلی در sweep مشترک:
    - `alibaba`، `qwen`، `xai` چون این مسیرها در حال حاضر به URLهای مرجع راه‌دور `http(s)` / MP4 نیاز دارند
    - `google` چون مسیر مشترک فعلی Gemini/Veo از ورودی محلی مبتنی بر buffer استفاده می‌کند و آن مسیر در sweep مشترک پذیرفته نمی‌شود
    - `openai` چون مسیر مشترک فعلی تضمین‌های دسترسی inpaint/remix ویدیویی مختص سازمان را ندارد
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` برای شامل کردن همهٔ providerها در sweep پیش‌فرض، از جمله FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` برای کاهش سقف هر عملیات provider جهت اجرای smoke تهاجمی
- رفتار احراز هویت اختیاری:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجباری کردن احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط env

## ابزار آزمون رسانهٔ زنده

- دستور: `pnpm test:live:media`
- هدف:
  - suiteهای زندهٔ مشترک تصویر، موسیقی، و ویدیو را از طریق یک entrypoint بومی repo اجرا می‌کند
  - متغیرهای env مفقود provider را به‌طور خودکار از `~/.profile` بارگذاری می‌کند
  - به‌طور پیش‌فرض هر suite را به providerهایی که در حال حاضر احراز هویت قابل استفاده دارند محدود می‌کند
  - از `scripts/test-live.mjs` دوباره استفاده می‌کند، بنابراین رفتار Heartbeat و حالت quiet سازگار می‌ماند
- مثال‌ها:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مرتبط

- [آزمون](/fa/help/testing) - suiteهای واحد، یکپارچه‌سازی، QA، و Docker
