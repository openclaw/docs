---
read_when:
    - اجرای ماتریس مدل زنده / بک‌اند CLI / ACP / آزمون‌های اطمینان اولیهٔ ارائه‌دهندهٔ رسانه
    - اشکال‌زدایی از فرایند یافتن اعتبارنامه‌های آزمون زنده
    - افزودن یک آزمون زندهٔ جدید مختص ارائه‌دهنده
sidebarTitle: Live tests
summary: 'آزمون‌های زنده (درگیرکنندهٔ شبکه): ماتریس مدل، بک‌اندهای CLI، ACP، ارائه‌دهندگان رسانه، اعتبارنامه‌ها'
title: 'آزمایش: مجموعه‌های زنده'
x-i18n:
    generated_at: "2026-05-04T11:59:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03b8ca6348137a55c8d5f67c9c166a130a75a744f6a433cb00496756b29d7016
    source_path: help/testing-live.md
    workflow: 16
---

برای شروع سریع، اجراکننده‌های QA، مجموعه‌های واحد/یکپارچه‌سازی، و جریان‌های Docker، [آزمایش](/fa/help/testing) را ببینید. این صفحه مجموعه‌های آزمایشی **زنده** (درگیر با شبکه) را پوشش می‌دهد: ماتریس مدل، backendهای CLI، ACP، و آزمایش‌های زنده ارائه‌دهنده رسانه، به‌علاوه مدیریت اعتبارنامه‌ها.

## زنده: فرمان‌های smoke نمایه محلی

پیش از بررسی‌های زنده موردی، `~/.profile` را source کنید تا کلیدهای ارائه‌دهنده و مسیرهای ابزار محلی با shell شما هم‌خوان باشند:

```bash
source ~/.profile
```

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

`voicecall smoke` یک اجرای خشک است مگر اینکه `--yes` هم وجود داشته باشد. از `--yes` فقط زمانی استفاده کنید که عمدا می‌خواهید یک تماس اعلان واقعی برقرار کنید. برای Twilio، Telnyx، و Plivo، یک بررسی آمادگی موفق به URL عمومی Webhook نیاز دارد؛ جایگزین‌های فقط محلی loopback/خصوصی به‌صورت طراحی‌شده رد می‌شوند.

## زنده: sweep قابلیت Node اندروید

- آزمایش: `src/gateway/android-node.capabilities.live.test.ts`
- اسکریپت: `pnpm android:test:integration`
- هدف: فراخوانی **هر فرمانی که در حال حاضر** توسط یک Node اندروید متصل اعلام شده و assertion رفتار قرارداد فرمان.
- دامنه:
  - راه‌اندازی پیش‌شرط‌دار/دستی (این مجموعه برنامه را نصب/اجرا/جفت نمی‌کند).
  - اعتبارسنجی فرمان‌به‌فرمان Gateway `node.invoke` برای Node اندروید انتخاب‌شده.
- پیش‌راه‌اندازی لازم:
  - برنامه اندروید از قبل به Gateway متصل و با آن جفت شده باشد.
  - برنامه در foreground نگه داشته شود.
  - مجوزها/رضایت capture برای قابلیت‌هایی که انتظار دارید پاس شوند اعطا شده باشد.
- overrideهای اختیاری هدف:
  - `OPENCLAW_ANDROID_NODE_ID` یا `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- جزئیات کامل راه‌اندازی اندروید: [برنامه اندروید](/fa/platforms/android)

## زنده: smoke مدل (کلیدهای نمایه)

آزمایش‌های زنده به دو لایه تقسیم شده‌اند تا بتوانیم خطاها را ایزوله کنیم:

- «مدل مستقیم» به ما می‌گوید آیا ارائه‌دهنده/مدل اصلا می‌تواند با کلید داده‌شده پاسخ دهد یا نه.
- «smoke Gateway» به ما می‌گوید آیا کل pipeline کامل gateway+agent برای آن مدل کار می‌کند یا نه (sessionها، تاریخچه، ابزارها، سیاست sandbox، و غیره).

### لایه ۱: تکمیل مستقیم مدل (بدون gateway)

- آزمایش: `src/agents/models.profiles.live.test.ts`
- هدف:
  - شمردن مدل‌های کشف‌شده
  - استفاده از `getApiKeyForModel` برای انتخاب مدل‌هایی که برایشان credential دارید
  - اجرای یک completion کوچک برای هر مدل (و regressionهای هدفمند در صورت نیاز)
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیما فراخوانی می‌کنید)
- `OPENCLAW_LIVE_MODELS=modern` (یا `all`، alias برای modern) را تنظیم کنید تا این مجموعه واقعا اجرا شود؛ در غیر این صورت برای متمرکز نگه داشتن `pnpm test:live` روی smoke Gateway، skip می‌شود
- روش انتخاب مدل‌ها:
  - `OPENCLAW_LIVE_MODELS=modern` برای اجرای allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` یک alias برای allowlist مدرن است
  - یا `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist جداشده با کاما)
  - sweepهای modern/all به‌صورت پیش‌فرض از یک سقف curated با سیگنال بالا استفاده می‌کنند؛ برای sweep کامل مدرن `OPENCLAW_LIVE_MAX_MODELS=0` را تنظیم کنید یا برای سقف کوچک‌تر یک عدد مثبت بگذارید.
  - sweepهای کامل از `OPENCLAW_LIVE_TEST_TIMEOUT_MS` برای timeout کل آزمایش direct-model استفاده می‌کنند. پیش‌فرض: ۶۰ دقیقه.
  - probeهای direct-model به‌صورت پیش‌فرض با موازی‌سازی ۲۰تایی اجرا می‌شوند؛ برای override کردن، `OPENCLAW_LIVE_MODEL_CONCURRENCY` را تنظیم کنید.
- روش انتخاب ارائه‌دهندگان:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist جداشده با کاما)
- کلیدها از کجا می‌آیند:
  - به‌صورت پیش‌فرض: profile store و fallbackهای env
  - برای اجبار به استفاده فقط از **profile store**، `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` را تنظیم کنید
- دلیل وجود این:
  - «API ارائه‌دهنده خراب است / کلید نامعتبر است» را از «pipeline عامل Gateway خراب است» جدا می‌کند
  - regressionهای کوچک و ایزوله را شامل می‌شود (مثال: OpenAI Responses/Codex Responses reasoning replay + جریان‌های tool-call)

### لایه ۲: smoke عامل توسعه + Gateway (آنچه "@openclaw" واقعا انجام می‌دهد)

- آزمایش: `src/gateway/gateway-models.profiles.live.test.ts`
- هدف:
  - بالا آوردن یک Gateway درون‌پردازشی
  - ایجاد/patch کردن یک session با `agent:dev:*` (override مدل برای هر اجرا)
  - پیمایش models-with-keys و assertion موارد زیر:
    - پاسخ «معنادار» (بدون ابزار)
    - یک فراخوانی ابزار واقعی کار کند (probe خواندن)
    - probeهای ابزار اضافی اختیاری (probe exec+read)
    - مسیرهای regression OpenAI (tool-call-only → follow-up) همچنان کار کنند
- جزئیات probe (تا بتوانید خطاها را سریع توضیح دهید):
  - probe `read`: آزمایش یک فایل nonce در workspace می‌نویسد و از عامل می‌خواهد آن را `read` کند و nonce را برگرداند.
  - probe `exec+read`: آزمایش از عامل می‌خواهد با `exec` یک nonce را در فایل temp بنویسد، سپس آن را `read` کند.
  - probe تصویر: آزمایش یک PNG تولیدشده (cat + کد تصادفی) ضمیمه می‌کند و انتظار دارد مدل `cat <CODE>` را برگرداند.
  - مرجع پیاده‌سازی: `src/gateway/gateway-models.profiles.live.test.ts` و `src/gateway/live-image-probe.ts`.
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیما فراخوانی می‌کنید)
- روش انتخاب مدل‌ها:
  - پیش‌فرض: allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` یک alias برای allowlist مدرن است
  - یا برای محدود کردن، `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (یا فهرست جداشده با کاما) را تنظیم کنید
  - sweepهای Gateway برای modern/all به‌صورت پیش‌فرض از یک سقف curated با سیگنال بالا استفاده می‌کنند؛ برای sweep کامل مدرن `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` را تنظیم کنید یا برای سقف کوچک‌تر یک عدد مثبت بگذارید.
- روش انتخاب ارائه‌دهندگان (برای پرهیز از «همه‌چیز OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist جداشده با کاما)
- probeهای ابزار + تصویر همیشه در این آزمایش زنده روشن هستند:
  - probe `read` + probe `exec+read` (فشار ابزار)
  - probe تصویر وقتی اجرا می‌شود که مدل پشتیبانی از ورودی تصویر را اعلام کند
  - جریان (در سطح بالا):
    - آزمایش یک PNG کوچک با “CAT” + کد تصادفی تولید می‌کند (`src/gateway/live-image-probe.ts`)
    - آن را از طریق `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ارسال می‌کند
    - Gateway ضمیمه‌ها را به `images[]` parse می‌کند (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - عامل embedded یک پیام کاربر چندوجهی را به مدل forward می‌کند
    - assertion: پاسخ شامل `cat` + کد باشد (تحمل OCR: خطاهای جزئی مجازند)

<Tip>
برای دیدن اینکه روی دستگاه خود چه چیزهایی را می‌توانید آزمایش کنید (و idهای دقیق `provider/model`)، اجرا کنید:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## زنده: smoke backend CLI (Claude، Codex، Gemini، یا CLIهای محلی دیگر)

- آزمایش: `src/gateway/gateway-cli-backend.live.test.ts`
- هدف: اعتبارسنجی pipeline عامل + Gateway با استفاده از یک backend محلی CLI، بدون دست زدن به پیکربندی پیش‌فرض شما.
- پیش‌فرض‌های smoke مخصوص backend همراه با تعریف `cli-backend.ts` در Plugin مالک قرار دارند.
- فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیما فراخوانی می‌کنید)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- پیش‌فرض‌ها:
  - ارائه‌دهنده/مدل پیش‌فرض: `claude-cli/claude-sonnet-4-6`
  - رفتار command/args/image از metadata Plugin backend CLI مالک می‌آید.
- overrideها (اختیاری):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` برای ارسال یک ضمیمه تصویر واقعی (مسیرها به prompt تزریق می‌شوند). recipeهای Docker به‌صورت پیش‌فرض این را خاموش نگه می‌دارند مگر اینکه صراحتا درخواست شود.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` برای پاس دادن مسیرهای فایل تصویر به‌عنوان آرگومان‌های CLI به‌جای تزریق prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (یا `"list"`) برای کنترل نحوه پاس دادن آرگومان‌های تصویر وقتی `IMAGE_ARG` تنظیم شده است.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` برای ارسال turn دوم و اعتبارسنجی جریان resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` برای opt in به probe پیوستگی همان session از Claude Sonnet -> Opus وقتی مدل انتخاب‌شده از switch target پشتیبانی می‌کند. recipeهای Docker برای قابلیت اطمینان aggregate، این را به‌صورت پیش‌فرض خاموش نگه می‌دارند.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` برای opt in به probe MCP/tool loopback. recipeهای Docker به‌صورت پیش‌فرض این را خاموش نگه می‌دارند مگر اینکه صراحتا درخواست شود.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

smoke ارزان پیکربندی MCP برای Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

این از Gemini نمی‌خواهد پاسخی تولید کند. همان تنظیمات سیستمی را که OpenClaw به Gemini می‌دهد می‌نویسد، سپس `gemini --debug mcp list` را اجرا می‌کند تا ثابت کند یک سرور ذخیره‌شده با `transport: "streamable-http"` به شکل HTTP MCP مربوط به Gemini نرمال‌سازی می‌شود و می‌تواند به یک سرور محلی streamable-HTTP MCP متصل شود.

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
- smoke زنده CLI-backend را داخل image Docker ریپو به‌عنوان کاربر غیر root با نام `node` اجرا می‌کند.
- metadata مربوط به smoke CLI را از افزونه مالک resolve می‌کند، سپس بسته CLI لینوکس منطبق (`@anthropic-ai/claude-code`، `@openai/codex`، یا `@google/gemini-cli`) را در یک prefix قابل نوشتن cacheشده در `OPENCLAW_DOCKER_CLI_TOOLS_DIR` نصب می‌کند (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` به OAuth قابل‌حمل اشتراک Claude Code از طریق یا `~/.claude/.credentials.json` با `claudeAiOauth.subscriptionType` یا `CLAUDE_CODE_OAUTH_TOKEN` از `claude setup-token` نیاز دارد. ابتدا `claude -p` مستقیم را در Docker اثبات می‌کند، سپس دو turn Gateway CLI-backend را بدون حفظ env varهای کلید API Anthropic اجرا می‌کند. این lane اشتراک، probeهای MCP/tool و تصویر Claude را به‌صورت پیش‌فرض غیرفعال می‌کند، چون Claude در حال حاضر استفاده از برنامه شخص ثالث را به‌جای محدودیت‌های عادی پلن اشتراک، از طریق billing مصرف اضافی route می‌کند.
- smoke زنده CLI-backend اکنون همان جریان end-to-end را برای Claude، Codex، و Gemini تمرین می‌کند: turn متنی، turn طبقه‌بندی تصویر، سپس فراخوانی ابزار MCP `cron` که از طریق CLI Gateway راستی‌آزمایی می‌شود.
- smoke پیش‌فرض Claude همچنین session را از Sonnet به Opus patch می‌کند و تایید می‌کند session ادامه‌یافته هنوز یک یادداشت قبلی را به خاطر دارد.

## زنده: قابلیت دسترسی proxy HTTP/2 برای APNs

- آزمایش: `src/infra/push-apns-http2.live.test.ts`
- هدف: تونل زدن از طریق یک proxy محلی HTTP CONNECT به endpoint sandbox APNs اپل، ارسال درخواست اعتبارسنجی APNs HTTP/2، و assertion اینکه پاسخ واقعی `403 InvalidProviderToken` اپل از مسیر proxy برمی‌گردد.
- فعال‌سازی:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- timeout اختیاری:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## زنده: smoke bind برای ACP (`/acp spawn ... --bind here`)

- آزمون: `src/gateway/gateway-acp-bind.live.test.ts`
- هدف: اعتبارسنجی جریان واقعی اتصال مکالمه ACP با یک عامل زنده ACP:
  - ارسال `/acp spawn <agent> --bind here`
  - اتصال یک مکالمه مصنوعی کانال پیام در همان محل
  - ارسال یک پیگیری عادی در همان مکالمه
  - بررسی اینکه پیگیری در رونوشت جلسه ACP متصل‌شده ثبت می‌شود
- فعال‌سازی:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- پیش‌فرض‌ها:
  - عامل‌های ACP در Docker: `claude,codex,gemini`
  - عامل ACP برای اجرای مستقیم `pnpm test:live ...`: `claude`
  - کانال مصنوعی: زمینه مکالمه به سبک پیام مستقیم Slack
  - بک‌اند ACP: `acpx`
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
  - این مسیر از سطح `chat.send` مربوط به Gateway همراه با فیلدهای مسیر مبدأ مصنوعی فقط ویژه مدیر استفاده می‌کند تا آزمون‌ها بتوانند بدون وانمود کردن به تحویل خارجی، زمینه کانال پیام را متصل کنند.
  - وقتی `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` تنظیم نشده باشد، آزمون از رجیستری عامل داخلی Plugin تعبیه‌شده `acpx` برای عامل هارنس ACP انتخاب‌شده استفاده می‌کند.
  - ایجاد MCP مربوط به Cron جلسه متصل‌شده به‌صورت پیش‌فرض بر پایه بهترین تلاش است، چون هارنس‌های خارجی ACP می‌توانند پس از عبور اثبات اتصال/تصویر، فراخوانی‌های MCP را لغو کنند؛ برای سخت‌گیرانه کردن آن بررسی Cron پس از اتصال، `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` را تنظیم کنید.

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

دستورهای Docker تک‌عاملی:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

نکته‌های Docker:

- اجراکننده Docker در `scripts/test-live-acp-bind-docker.sh` قرار دارد.
- به‌صورت پیش‌فرض، smoke اتصال ACP را به‌ترتیب در برابر عامل‌های زنده تجمیعی CLI اجرا می‌کند: `claude`، سپس `codex`، سپس `gemini`.
- برای محدود کردن ماتریس از `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`، یا `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` استفاده کنید.
- این اجراکننده `~/.profile` را بارگذاری می‌کند، مواد احراز هویت CLI مطابق را وارد کانتینر می‌کند، سپس در صورت نبودن، CLI زنده درخواستی (`@anthropic-ai/claude-code`، `@openai/codex`، Factory Droid از طریق `https://app.factory.ai/cli`، `@google/gemini-cli`، یا `opencode-ai`) را نصب می‌کند. خود بک‌اند ACP، بسته تعبیه‌شده `acpx/runtime` از Plugin رسمی `acpx` است.
- گونه Docker مربوط به Droid، `~/.factory` را برای تنظیمات وارد می‌کند، `FACTORY_API_KEY` را منتقل می‌کند، و به آن کلید API نیاز دارد چون احراز هویت OAuth/keyring محلی Factory به کانتینر قابل انتقال نیست. این گونه از ورودی رجیستری داخلی ACPX یعنی `droid exec --output-format acp` استفاده می‌کند.
- گونه Docker مربوط به OpenCode یک مسیر رگرسیون سخت‌گیرانه تک‌عاملی است. پس از بارگذاری `~/.profile`، یک مدل پیش‌فرض موقت `OPENCODE_CONFIG_CONTENT` را از `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (پیش‌فرض `opencode/kimi-k2.6`) می‌نویسد، و `pnpm test:docker:live-acp-bind:opencode` به‌جای پذیرش رد شدن عمومی پس از اتصال، به رونوشت دستیار متصل‌شده نیاز دارد.
- فراخوانی‌های مستقیم CLI مربوط به `acpx` فقط مسیر دستی/دورزدنی برای مقایسه رفتار بیرون از Gateway هستند. smoke اتصال ACP در Docker، بک‌اند runtime تعبیه‌شده `acpx` در OpenClaw را اجرا می‌کند.

## زنده: smoke هارنس app-server مربوط به Codex

- هدف: اعتبارسنجی هارنس متعلق به Plugin برای Codex از طریق متد عادی gateway
  `agent`:
  - بارگذاری Plugin بسته‌بندی‌شده `codex`
  - انتخاب `OPENCLAW_AGENT_RUNTIME=codex`
  - ارسال نخستین نوبت عامل gateway به `openai/gpt-5.5` با اجبار هارنس Codex
  - ارسال نوبت دوم به همان جلسه OpenClaw و بررسی اینکه نخ app-server
    می‌تواند ادامه پیدا کند
  - اجرای `/codex status` و `/codex models` از همان مسیر فرمان gateway
  - به‌صورت اختیاری اجرای دو بررسی shell با ارتقای مجوز و بازبینی Guardian: یک
    فرمان بی‌خطر که باید تأیید شود و یک بارگذاری راز جعلی که باید رد شود
    تا عامل دوباره سؤال کند
- آزمون: `src/gateway/gateway-codex-harness.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- مدل پیش‌فرض: `openai/gpt-5.5`
- بررسی اختیاری تصویر: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- بررسی اختیاری MCP/ابزار: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- بررسی اختیاری Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- این smoke از `agentRuntime.id: "codex"` استفاده می‌کند تا هارنس خراب Codex
  نتواند با بازگشت بی‌صدا به PI قبول شود.
- احراز هویت: احراز هویت app-server مربوط به Codex از ورود محلی اشتراک Codex. smokeهای Docker
  در صورت کاربرد می‌توانند برای بررسی‌های غیر Codex، `OPENAI_API_KEY` را نیز فراهم کنند،
  به‌علاوه کپی اختیاری `~/.codex/auth.json` و `~/.codex/config.toml`.

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

نکته‌های Docker:

- اجراکننده Docker در `scripts/test-live-codex-harness-docker.sh` قرار دارد.
- این اجراکننده `~/.profile` مانت‌شده را بارگذاری می‌کند، `OPENAI_API_KEY` را پاس می‌دهد، فایل‌های احراز هویت CLI مربوط به Codex را در صورت وجود کپی می‌کند، `@openai/codex` را در یک پیشوند npm مانت‌شده و قابل نوشتن نصب می‌کند، درخت منبع را آماده می‌کند، سپس فقط آزمون زنده هارنس Codex را اجرا می‌کند.
- Docker به‌صورت پیش‌فرض بررسی‌های تصویر، MCP/ابزار، و Guardian را فعال می‌کند. وقتی به اجرای اشکال‌زدایی محدودتری نیاز دارید، `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` را تنظیم کنید.
- Docker از همان پیکربندی runtime صریح Codex استفاده می‌کند، بنابراین نام‌های مستعار قدیمی یا بازگشت به PI
  نمی‌توانند رگرسیون هارنس Codex را پنهان کنند.

### دستورهای زنده پیشنهادی

فهرست‌های مجاز محدود و صریح، سریع‌ترین و کم‌نوسان‌ترین گزینه‌ها هستند:

- تک‌مدل، مستقیم (بدون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- تک‌مدل، smoke از طریق gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فراخوانی ابزار در چندین ارائه‌دهنده:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تمرکز بر Google (کلید API مربوط به Gemini + Antigravity):
  - Gemini (کلید API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke تفکر تطبیقی Google:
  - اگر کلیدهای محلی در profile شل قرار دارند: `source ~/.profile`
  - پیش‌فرض پویای Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - بودجه پویای Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

نکته‌ها:

- `google/...` از API مربوط به Gemini استفاده می‌کند (کلید API).
- `google-antigravity/...` از پل OAuth مربوط به Antigravity استفاده می‌کند (نقطه پایانی عامل به سبک Cloud Code Assist).
- `google-gemini-cli/...` از CLI محلی Gemini روی دستگاه شما استفاده می‌کند (احراز هویت جداگانه + ویژگی‌های خاص ابزار).
- API مربوط به Gemini در برابر CLI مربوط به Gemini:
  - API: OpenClaw، API میزبانی‌شده Gemini از Google را از طریق HTTP فراخوانی می‌کند (کلید API / احراز هویت profile)؛ بیشتر کاربران از «Gemini» همین را منظور می‌کنند.
  - CLI: OpenClaw یک باینری محلی `gemini` را از طریق shell اجرا می‌کند؛ این مسیر احراز هویت خودش را دارد و می‌تواند رفتار متفاوتی داشته باشد (پشتیبانی از streaming/ابزار/ناهمگونی نسخه).

## زنده: ماتریس مدل (پوشش ما)

هیچ «فهرست مدل CI» ثابتی وجود ندارد (زنده اختیاری است)، اما این‌ها مدل‌های **پیشنهادی** برای پوشش منظم روی دستگاه توسعه با کلیدها هستند.

### مجموعه smoke مدرن (فراخوانی ابزار + تصویر)

این اجرای «مدل‌های رایج» است که انتظار داریم کارکرد آن حفظ شود:

- OpenAI (غیر Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google (API مربوط به Gemini): `google/gemini-3.1-pro-preview` و `google/gemini-3-flash-preview` (از مدل‌های قدیمی‌تر Gemini 2.x پرهیز کنید)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

اجرای smoke از طریق gateway با ابزارها + تصویر:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط پایه: فراخوانی ابزار (Read + Exec اختیاری)

از هر خانواده ارائه‌دهنده دست‌کم یکی را انتخاب کنید:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (یا `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

پوشش اضافی اختیاری (داشتنش خوب است):

- xAI: `xai/grok-4.3` (یا جدیدترین مورد موجود)
- Mistral: `mistral/`… (یک مدل دارای قابلیت «ابزارها» را که برایتان فعال است انتخاب کنید)
- Cerebras: `cerebras/`… (اگر دسترسی دارید)
- LM Studio: `lmstudio/`… (محلی؛ فراخوانی ابزار به حالت API بستگی دارد)

### بینایی: ارسال تصویر (پیوست ← پیام چندوجهی)

دست‌کم یک مدل دارای قابلیت تصویر را در `OPENCLAW_LIVE_GATEWAY_MODELS` قرار دهید (گونه‌های دارای قابلیت بینایی Claude/Gemini/OpenAI و غیره) تا بررسی تصویر اجرا شود.

### تجمیع‌کننده‌ها / gatewayهای جایگزین

اگر کلیدها را فعال کرده‌اید، از طریق این‌ها نیز از آزمون پشتیبانی می‌کنیم:

- OpenRouter: `openrouter/...` (صدها مدل؛ برای یافتن گزینه‌های دارای قابلیت ابزار+تصویر از `openclaw models scan` استفاده کنید)
- OpenCode: `opencode/...` برای Zen و `opencode-go/...` برای Go (احراز هویت از طریق `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ارائه‌دهنده‌های بیشتری که می‌توانید در ماتریس زنده بگنجانید (اگر اعتبارنامه/پیکربندی دارید):

- داخلی: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- از طریق `models.providers` (نقاط پایانی سفارشی): `minimax` (cloud/API)، به‌علاوه هر proxy سازگار با OpenAI/Anthropic (LM Studio، vLLM، LiteLLM، و غیره)

<Tip>
«همه مدل‌ها» را در مستندات hardcode نکنید. فهرست معتبر همان چیزی است که `discoverModels(...)` روی دستگاه شما برمی‌گرداند، به‌علاوه هر کلیدی که در دسترس است.
</Tip>

## اعتبارنامه‌ها (هرگز commit نکنید)

آزمون‌های زنده اعتبارنامه‌ها را به همان روشی پیدا می‌کنند که CLI انجام می‌دهد. پیامدهای عملی:

- اگر CLI کار می‌کند، آزمون‌های زنده باید همان کلیدها را پیدا کنند.
- اگر یک آزمون زنده می‌گوید «اعتبارنامه‌ای نیست»، آن را همان‌طور عیب‌یابی کنید که `openclaw models list` / انتخاب مدل را عیب‌یابی می‌کنید.

- پروفایل‌های احراز هویت برای هر عامل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (منظور از «کلیدهای پروفایل» در آزمون‌های زنده همین است)
- پیکربندی: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- دایرکتوری وضعیت قدیمی: `~/.openclaw/credentials/` (در صورت وجود، به خانه زنده مرحله‌بندی‌شده کپی می‌شود، اما محل اصلی نگهداری کلیدهای پروفایل نیست)
- اجراهای زنده محلی به‌طور پیش‌فرض پیکربندی فعال، فایل‌های `auth-profiles.json` برای هر عامل، `credentials/` قدیمی، و دایرکتوری‌های احراز هویت CLI خارجی پشتیبانی‌شده را در یک خانه آزمون موقت کپی می‌کنند؛ خانه‌های زنده مرحله‌بندی‌شده از `workspace/` و `sandboxes/` صرف‌نظر می‌کنند، و بازنویسی‌های مسیر `agents.*.workspace` / `agentDir` حذف می‌شوند تا کاوش‌ها از فضای کاری واقعی میزبان شما دور بمانند.

اگر می‌خواهید به کلیدهای محیطی تکیه کنید (مثلاً در `~/.profile` خود export شده‌اند)، آزمون‌های محلی را پس از `source ~/.profile` اجرا کنید، یا از اجراکننده‌های Docker زیر استفاده کنید (آن‌ها می‌توانند `~/.profile` را داخل کانتینر mount کنند).

## زنده Deepgram (رونویسی صوتی)

- آزمون: `extensions/deepgram/audio.live.test.ts`
- فعال‌سازی: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## زنده طرح کدنویسی BytePlus

- آزمون: `extensions/byteplus/live.test.ts`
- فعال‌سازی: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- بازنویسی اختیاری مدل: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## زنده رسانه گردش‌کار ComfyUI

- آزمون: `extensions/comfy/comfy.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- دامنه:
  - مسیرهای تصویر، ویدیو، و `music_generate` بسته‌بندی‌شده comfy را تمرین می‌کند
  - هر قابلیت را رد می‌کند مگر اینکه `plugins.entries.comfy.config.<capability>` پیکربندی شده باشد
  - پس از تغییر ارسال گردش‌کار comfy، نظرسنجی، دانلودها، یا ثبت Plugin مفید است

## زنده تولید تصویر

- آزمون: `test/image-generation.runtime.live.test.ts`
- فرمان: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ابزار آزمون: `pnpm test:live:media image`
- دامنه:
  - هر Plugin ارائه‌دهنده تولید تصویر ثبت‌شده را فهرست می‌کند
  - پیش از کاوش، متغیرهای محیطی ارائه‌دهنده‌های غایب را از shell ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/محیطی را جلوتر از پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون منقضی در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نکنند
  - ارائه‌دهندگانی را که احراز هویت/پروفایل/مدل قابل استفاده ندارند رد می‌کند
  - هر ارائه‌دهنده پیکربندی‌شده را از مسیر runtime مشترک تولید تصویر اجرا می‌کند:
    - `<provider>:generate`
    - `<provider>:edit` وقتی ارائه‌دهنده پشتیبانی ویرایش را اعلام می‌کند
- ارائه‌دهندگان بسته‌بندی‌شده فعلی که پوشش داده می‌شوند:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجباری کردن احراز هویت از محل ذخیره پروفایل و نادیده گرفتن بازنویسی‌های فقط محیطی

برای مسیر CLI ارائه‌شده، پس از موفق شدن آزمون زنده ارائه‌دهنده/runtime، یک دودآزمون `infer` اضافه کنید:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

این مورد، تجزیه آرگومان‌های CLI، حل پیکربندی/عامل پیش‌فرض، فعال‌سازی
Plugin بسته‌بندی‌شده، runtime مشترک تولید تصویر، و درخواست زنده ارائه‌دهنده
را پوشش می‌دهد. انتظار می‌رود وابستگی‌های Plugin پیش از بارگذاری runtime موجود باشند.

## زنده تولید موسیقی

- آزمون: `extensions/music-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ابزار آزمون: `pnpm test:live:media music`
- دامنه:
  - مسیر مشترک ارائه‌دهنده تولید موسیقی بسته‌بندی‌شده را تمرین می‌کند
  - در حال حاضر Google و MiniMax را پوشش می‌دهد
  - پیش از کاوش، متغیرهای محیطی ارائه‌دهنده را از shell ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/محیطی را جلوتر از پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون منقضی در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نکنند
  - ارائه‌دهندگانی را که احراز هویت/پروفایل/مدل قابل استفاده ندارند رد می‌کند
  - هر دو حالت runtime اعلام‌شده را در صورت وجود اجرا می‌کند:
    - `generate` با ورودی فقط prompt
    - `edit` وقتی ارائه‌دهنده `capabilities.edit.enabled` را اعلام می‌کند
  - پوشش فعلی مسیر مشترک:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: فایل زنده جداگانه Comfy، نه این پیمایش مشترک
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجباری کردن احراز هویت از محل ذخیره پروفایل و نادیده گرفتن بازنویسی‌های فقط محیطی

## زنده تولید ویدیو

- آزمون: `extensions/video-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ابزار آزمون: `pnpm test:live:media video`
- دامنه:
  - مسیر مشترک ارائه‌دهنده تولید ویدیوی بسته‌بندی‌شده را تمرین می‌کند
  - به مسیر دودآزمون امن برای انتشار پیش‌فرض می‌شود: ارائه‌دهندگان غیر FAL، یک درخواست متن‌به‌ویدیو برای هر ارائه‌دهنده، prompt یک‌ثانیه‌ای lobster، و سقف عملیات برای هر ارائه‌دهنده از `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (به‌طور پیش‌فرض `180000`)
  - به‌طور پیش‌فرض FAL را رد می‌کند، چون تأخیر صف سمت ارائه‌دهنده می‌تواند بر زمان انتشار غالب شود؛ برای اجرای صریح آن، `--video-providers fal` یا `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` را پاس دهید
  - پیش از کاوش، متغیرهای محیطی ارائه‌دهنده را از shell ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/محیطی را جلوتر از پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون منقضی در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نکنند
  - ارائه‌دهندگانی را که احراز هویت/پروفایل/مدل قابل استفاده ندارند رد می‌کند
  - به‌طور پیش‌فرض فقط `generate` را اجرا می‌کند
  - `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید تا حالت‌های تبدیل اعلام‌شده نیز در صورت وجود اجرا شوند:
    - `imageToVideo` وقتی ارائه‌دهنده `capabilities.imageToVideo.enabled` را اعلام می‌کند و ارائه‌دهنده/مدل انتخاب‌شده در پیمایش مشترک، ورودی تصویر محلی مبتنی بر buffer را می‌پذیرد
    - `videoToVideo` وقتی ارائه‌دهنده `capabilities.videoToVideo.enabled` را اعلام می‌کند و ارائه‌دهنده/مدل انتخاب‌شده در پیمایش مشترک، ورودی ویدیوی محلی مبتنی بر buffer را می‌پذیرد
  - ارائه‌دهندگان `imageToVideo` اعلام‌شده اما ردشده فعلی در پیمایش مشترک:
    - `vydra` چون `veo3` بسته‌بندی‌شده فقط متنی است و `kling` بسته‌بندی‌شده به URL تصویر راه‌دور نیاز دارد
  - پوشش ویژه ارائه‌دهنده Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - آن فایل، متن‌به‌ویدیوی `veo3` به‌علاوه یک مسیر `kling` را اجرا می‌کند که به‌طور پیش‌فرض از fixture URL تصویر راه‌دور استفاده می‌کند
  - پوشش زنده فعلی `videoToVideo`:
    - `runway` فقط وقتی مدل انتخاب‌شده `runway/gen4_aleph` باشد
  - ارائه‌دهندگان `videoToVideo` اعلام‌شده اما ردشده فعلی در پیمایش مشترک:
    - `alibaba`, `qwen`, `xai` چون آن مسیرها در حال حاضر به URLهای مرجع راه‌دور `http(s)` / MP4 نیاز دارند
    - `google` چون مسیر مشترک فعلی Gemini/Veo از ورودی محلی مبتنی بر buffer استفاده می‌کند و آن مسیر در پیمایش مشترک پذیرفته نمی‌شود
    - `openai` چون مسیر مشترک فعلی تضمین دسترسی سازمانی ویژه به inpaint/remix ویدیو را ندارد
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` برای شامل کردن هر ارائه‌دهنده در پیمایش پیش‌فرض، از جمله FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` برای کاهش سقف هر عملیات ارائه‌دهنده در یک اجرای دودآزمون تهاجمی
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجباری کردن احراز هویت از محل ذخیره پروفایل و نادیده گرفتن بازنویسی‌های فقط محیطی

## ابزار آزمون زنده رسانه

- فرمان: `pnpm test:live:media`
- هدف:
  - مجموعه‌های زنده مشترک تصویر، موسیقی، و ویدیو را از طریق یک نقطه ورود بومی repo اجرا می‌کند
  - متغیرهای محیطی غایب ارائه‌دهنده را از `~/.profile` به‌طور خودکار بارگذاری می‌کند
  - هر مجموعه را به‌طور پیش‌فرض به ارائه‌دهندگانی که در حال حاضر احراز هویت قابل استفاده دارند محدود می‌کند
  - از `scripts/test-live.mjs` دوباره استفاده می‌کند، بنابراین رفتار Heartbeat و حالت کم‌صدا سازگار می‌ماند
- نمونه‌ها:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مرتبط

- [آزمون](/fa/help/testing) — مجموعه‌های unit، integration، QA، و Docker
