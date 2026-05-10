---
read_when:
    - اجرای تست‌های دود ماتریس مدل زنده / بک‌اند CLI / ACP / ارائه‌دهندهٔ رسانه
    - اشکال‌زدایی تشخیص اعتبارنامه‌های آزمون زنده
    - افزودن یک آزمون زندهٔ ویژهٔ ارائه‌دهنده
sidebarTitle: Live tests
summary: 'آزمون‌های زنده (درگیر با شبکه): ماتریس مدل، بک‌اندهای CLI، ACP، ارائه‌دهندگان رسانه، اعتبارنامه‌ها'
title: 'آزمون: مجموعه‌های زنده'
x-i18n:
    generated_at: "2026-05-10T19:47:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb020672cd71d03b2cfc78b135c7c39862823c421c0f2f31bae69a42f9c3437f
    source_path: help/testing-live.md
    workflow: 16
---

برای شروع سریع، اجراکننده‌های QA، مجموعه‌های واحد/یکپارچه‌سازی، و جریان‌های Docker، ببینید:
[آزمون](/fa/help/testing). این صفحه مجموعه‌های آزمون **زنده** (دارای تماس شبکه‌ای) را پوشش می‌دهد: ماتریس مدل، بک‌اندهای CLI، ACP، و آزمون‌های زنده ارائه‌دهنده رسانه، به‌علاوه مدیریت اطلاعات اعتباری.

## زنده: فرمان‌های آزمون دود پروفایل محلی

پیش از بررسی‌های زنده موردی، `~/.profile` را source کنید تا کلیدهای ارائه‌دهنده و مسیرهای ابزار محلی با shell شما هماهنگ باشند:

```bash
source ~/.profile
```

آزمون دود ایمن رسانه:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

آزمون دود ایمن آمادگی تماس صوتی:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` یک اجرای آزمایشی است مگر اینکه `--yes` نیز وجود داشته باشد. فقط وقتی از `--yes` استفاده کنید که عمدا می‌خواهید یک تماس اعلان واقعی برقرار کنید. برای Twilio، Telnyx، و Plivo، بررسی موفق آمادگی به یک Webhook URL عمومی نیاز دارد؛ گزینه‌های جایگزین فقط local loopback یا خصوصی عمدا رد می‌شوند.

## زنده: پیمایش قابلیت‌های Node اندروید

- آزمون: `src/gateway/android-node.capabilities.live.test.ts`
- اسکریپت: `pnpm android:test:integration`
- هدف: فراخوانی **هر فرمانی که در حال حاضر** توسط یک Node اندروید متصل اعلام شده است و بررسی رفتار قرارداد فرمان.
- دامنه:
  - آماده‌سازی پیش‌شرطی/دستی (این مجموعه، برنامه را نصب/اجرا/جفت نمی‌کند).
  - اعتبارسنجی `node.invoke` در Gateway برای هر فرمان، برای Node اندروید انتخاب‌شده.
- آماده‌سازی لازم:
  - برنامه اندروید از قبل به Gateway متصل و با آن جفت شده باشد.
  - برنامه در پیش‌زمینه نگه داشته شود.
  - مجوزها/رضایت ضبط برای قابلیت‌هایی که انتظار دارید پاس شوند اعطا شده باشد.
- بازنویسی‌های اختیاری هدف:
  - `OPENCLAW_ANDROID_NODE_ID` یا `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- جزئیات کامل راه‌اندازی اندروید: [برنامه اندروید](/fa/platforms/android)

## زنده: آزمون دود مدل (کلیدهای پروفایل)

آزمون‌های زنده به دو لایه تقسیم شده‌اند تا بتوانیم خرابی‌ها را جدا کنیم:

- «مدل مستقیم» به ما می‌گوید که ارائه‌دهنده/مدل اصلا می‌تواند با کلید داده‌شده پاسخ دهد یا نه.
- «آزمون دود Gateway» به ما می‌گوید که خط لوله کامل gateway+agent برای آن مدل کار می‌کند یا نه (sessionها، history، ابزارها، سیاست sandbox، و غیره).

### لایه ۱: تکمیل مستقیم مدل (بدون Gateway)

- آزمون: `src/agents/models.profiles.live.test.ts`
- هدف:
  - فهرست کردن مدل‌های کشف‌شده
  - استفاده از `getApiKeyForModel` برای انتخاب مدل‌هایی که برایشان credential دارید
  - اجرای یک تکمیل کوچک برای هر مدل (و regressionهای هدفمند در صورت نیاز)
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- برای اجرای واقعی این مجموعه، `OPENCLAW_LIVE_MODELS=modern` (یا `all`، نام مستعار modern) را تنظیم کنید؛ در غیر این صورت skip می‌شود تا `pnpm test:live` روی آزمون دود Gateway متمرکز بماند
- روش انتخاب مدل‌ها:
  - `OPENCLAW_LIVE_MODELS=modern` برای اجرای allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` نام مستعار allowlist مدرن است
  - یا `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist جداشده با ویرگول)
  - پیمایش‌های modern/all به‌صورت پیش‌فرض یک سقف گزینش‌شده با سیگنال بالا دارند؛ برای پیمایش مدرن کامل، `OPENCLAW_LIVE_MAX_MODELS=0` را تنظیم کنید، یا برای سقف کوچک‌تر یک عدد مثبت بدهید.
  - پیمایش‌های کامل از `OPENCLAW_LIVE_TEST_TIMEOUT_MS` برای timeout کل آزمون مدل مستقیم استفاده می‌کنند. پیش‌فرض: ۶۰ دقیقه.
  - probeهای مدل مستقیم به‌صورت پیش‌فرض با موازی‌سازی ۲۰تایی اجرا می‌شوند؛ برای بازنویسی، `OPENCLAW_LIVE_MODEL_CONCURRENCY` را تنظیم کنید.
- روش انتخاب ارائه‌دهنده‌ها:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist جداشده با ویرگول)
- کلیدها از کجا می‌آیند:
  - به‌صورت پیش‌فرض: مخزن پروفایل و fallbackهای env
  - برای الزام به استفاده فقط از **مخزن پروفایل**، `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` را تنظیم کنید
- دلیل وجود این بخش:
  - «API ارائه‌دهنده خراب است / کلید نامعتبر است» را از «خط لوله agent در Gateway خراب است» جدا می‌کند
  - regressionهای کوچک و جداشده را شامل می‌شود (مثال: replay استدلال OpenAI Responses/Codex Responses + جریان‌های tool-call)

### لایه ۲: آزمون دود Gateway + عامل توسعه (کاری که "@openclaw" واقعا انجام می‌دهد)

- آزمون: `src/gateway/gateway-models.profiles.live.test.ts`
- هدف:
  - بالا آوردن یک Gateway درون‌فرآیندی
  - ساخت/patch کردن یک session با `agent:dev:*` (بازنویسی مدل برای هر اجرا)
  - پیمایش مدل‌های دارای کلید و بررسی:
    - پاسخ «معنادار» (بدون ابزار)
    - یک فراخوانی ابزار واقعی کار می‌کند (probe خواندن)
    - probeهای ابزار اضافی اختیاری (probe اجرا+خواندن)
    - مسیرهای regression در OpenAI (فقط tool-call → پیگیری) همچنان کار می‌کنند
- جزئیات probe (برای اینکه بتوانید خرابی‌ها را سریع توضیح دهید):
  - probe `read`: آزمون یک فایل nonce در workspace می‌نویسد و از agent می‌خواهد آن را `read` کند و nonce را برگرداند.
  - probe `exec+read`: آزمون از agent می‌خواهد با `exec` یک nonce را در یک فایل موقت بنویسد، سپس آن را با `read` برگرداند.
  - probe تصویر: آزمون یک PNG تولیدشده (cat + کد تصادفی) را پیوست می‌کند و انتظار دارد مدل `cat <CODE>` را برگرداند.
  - مرجع پیاده‌سازی: `src/gateway/gateway-models.profiles.live.test.ts` و `src/gateway/live-image-probe.ts`.
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- روش انتخاب مدل‌ها:
  - پیش‌فرض: allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` نام مستعار allowlist مدرن است
  - یا برای محدود کردن، `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (یا فهرست جداشده با ویرگول) را تنظیم کنید
  - پیمایش‌های Gateway با modern/all به‌صورت پیش‌فرض یک سقف گزینش‌شده با سیگنال بالا دارند؛ برای پیمایش مدرن کامل، `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` را تنظیم کنید، یا برای سقف کوچک‌تر یک عدد مثبت بدهید.
- روش انتخاب ارائه‌دهنده‌ها (برای پرهیز از «همه‌چیز OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist جداشده با ویرگول)
- probeهای ابزار + تصویر همیشه در این آزمون زنده روشن هستند:
  - probe `read` + probe `exec+read` (فشار ابزار)
  - probe تصویر وقتی اجرا می‌شود که مدل پشتیبانی از ورودی تصویر را اعلام کرده باشد
  - جریان (در سطح بالا):
    - آزمون یک PNG کوچک با "CAT" + کد تصادفی تولید می‌کند (`src/gateway/live-image-probe.ts`)
    - آن را از طریق `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ارسال می‌کند
    - Gateway پیوست‌ها را به `images[]` تبدیل می‌کند (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - agent توکار یک پیام کاربر چندوجهی را به مدل فوروارد می‌کند
    - ادعا: پاسخ شامل `cat` + کد باشد (تلورانس OCR: خطاهای جزئی مجاز است)

<Tip>
برای دیدن اینکه چه چیزهایی را می‌توانید روی دستگاه خودتان آزمون کنید (و شناسه‌های دقیق `provider/model`)، اجرا کنید:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## زنده: آزمون دود بک‌اند CLI (Claude، Codex، Gemini، یا CLIهای محلی دیگر)

- آزمون: `src/gateway/gateway-cli-backend.live.test.ts`
- هدف: اعتبارسنجی خط لوله Gateway + agent با استفاده از یک بک‌اند CLI محلی، بدون دست زدن به config پیش‌فرض شما.
- پیش‌فرض‌های آزمون دود ویژه بک‌اند در تعریف `cli-backend.ts` مربوط به Plugin مالک قرار دارند.
- فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- پیش‌فرض‌ها:
  - ارائه‌دهنده/مدل پیش‌فرض: `claude-cli/claude-sonnet-4-6`
  - رفتار فرمان/آرگومان‌ها/تصویر از metadata مربوط به Plugin مالک بک‌اند CLI می‌آید.
- بازنویسی‌ها (اختیاری):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` برای ارسال یک پیوست تصویر واقعی (مسیرها داخل prompt تزریق می‌شوند). recipeهای Docker به‌صورت پیش‌فرض این را خاموش می‌گذارند مگر اینکه صریحا درخواست شود.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` برای پاس دادن مسیر فایل‌های تصویر به‌عنوان آرگومان‌های CLI به‌جای تزریق prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (یا `"list"`) برای کنترل نحوه پاس دادن آرگومان‌های تصویر وقتی `IMAGE_ARG` تنظیم شده است.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` برای ارسال turn دوم و اعتبارسنجی جریان resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` برای opt in کردن به probe پیوستگی همان session از Claude Sonnet -> Opus وقتی مدل انتخاب‌شده از هدف switch پشتیبانی می‌کند. recipeهای Docker برای اطمینان تجمیعی، این را به‌صورت پیش‌فرض خاموش می‌گذارند.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` برای opt in کردن به probe MCP/tool loopback. recipeهای Docker به‌صورت پیش‌فرض این را خاموش می‌گذارند مگر اینکه صریحا درخواست شود.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

آزمون دود ارزان config مربوط به Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

این از Gemini نمی‌خواهد پاسخی تولید کند. همان تنظیمات سیستمی را که OpenClaw به Gemini می‌دهد می‌نویسد، سپس `gemini --debug mcp list` را اجرا می‌کند تا ثابت کند سرور ذخیره‌شده با `transport: "streamable-http"` به شکل HTTP MCP متعلق به Gemini نرمال‌سازی شده و می‌تواند به یک سرور MCP محلی streamable-HTTP وصل شود.

recipe مربوط به Docker:

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

نکات:

- اجراکننده Docker در `scripts/test-live-cli-backend-docker.sh` قرار دارد.
- آزمون دود زنده بک‌اند CLI را داخل تصویر Docker ریپو و به‌عنوان کاربر غیر root یعنی `node` اجرا می‌کند.
- metadata آزمون دود CLI را از extension مالک resolve می‌کند، سپس بسته CLI لینوکسی متناظر (`@anthropic-ai/claude-code`، `@openai/codex`، یا `@google/gemini-cli`) را در یک prefix قابل‌نوشتن cache‌شده در `OPENCLAW_DOCKER_CLI_TOOLS_DIR` نصب می‌کند (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` به OAuth قابل‌حمل اشتراک Claude Code نیاز دارد، از طریق `~/.claude/.credentials.json` با `claudeAiOauth.subscriptionType` یا `CLAUDE_CODE_OAUTH_TOKEN` از `claude setup-token`. ابتدا اجرای مستقیم `claude -p` در Docker را اثبات می‌کند، سپس دو turn بک‌اند CLI در Gateway را بدون نگه داشتن env varهای کلید API Anthropic اجرا می‌کند. این lane اشتراک، probeهای Claude MCP/tool و تصویر را به‌صورت پیش‌فرض غیرفعال می‌کند، چون Claude در حال حاضر استفاده از برنامه‌های شخص ثالث را به‌جای محدودیت‌های عادی طرح اشتراک، از مسیر billing استفاده اضافی عبور می‌دهد.
- آزمون دود زنده بک‌اند CLI اکنون همان جریان end-to-end را برای Claude، Codex، و Gemini تمرین می‌کند: turn متنی، turn طبقه‌بندی تصویر، سپس فراخوانی ابزار MCP با `cron` که از طریق CLI Gateway تایید می‌شود.
- آزمون دود پیش‌فرض Claude همچنین session را از Sonnet به Opus patch می‌کند و بررسی می‌کند که session resumeشده هنوز یک یادداشت قبلی را به خاطر دارد.

## زنده: دسترس‌پذیری proxy مربوط به APNs HTTP/2

- آزمون: `src/infra/push-apns-http2.live.test.ts`
- هدف: تونل زدن از طریق یک proxy محلی HTTP CONNECT به endpoint مربوط به sandbox APNs اپل، ارسال درخواست اعتبارسنجی APNs HTTP/2، و بررسی اینکه پاسخ واقعی `403 InvalidProviderToken` از اپل از مسیر proxy برگردد.
- فعال‌سازی:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- timeout اختیاری:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## زنده: آزمون دود bind مربوط به ACP (`/acp spawn ... --bind here`)

- آزمون: `src/gateway/gateway-acp-bind.live.test.ts`
- هدف: اعتبارسنجی جریان واقعی bind مکالمه ACP با یک عامل زنده ACP:
  - ارسال `/acp spawn <agent> --bind here`
  - bind کردن یک مکالمه مصنوعی کانال پیام در همان‌جا
  - ارسال یک پیگیری عادی در همان مکالمه
  - بررسی اینکه پیگیری در transcript نشست ACP متصل‌شده قرار می‌گیرد
- فعال‌سازی:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- پیش‌فرض‌ها:
  - عامل‌های ACP در Docker: `claude,codex,gemini`
  - عامل ACP برای اجرای مستقیم `pnpm test:live ...`: `claude`
  - کانال مصنوعی: زمینه مکالمه به سبک DM در Slack
  - backend ACP: `acpx`
- overrideها:
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
  - این lane از سطح `chat.send` در Gateway همراه با فیلدهای originating-route مصنوعی مخصوص admin استفاده می‌کند تا آزمون‌ها بتوانند زمینه کانال پیام را بدون وانمود کردن به تحویل خارجی پیوست کنند.
  - وقتی `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` تنظیم نشده باشد، آزمون از رجیستری عامل داخلی Plugin تعبیه‌شده `acpx` برای عامل harness منتخب ACP استفاده می‌کند.
  - ساخت Cron MCP برای نشست متصل‌شده به‌طور پیش‌فرض best-effort است، چون harnessهای خارجی ACP می‌توانند پس از موفقیت اثبات bind/image فراخوانی‌های MCP را لغو کنند؛ برای سخت‌گیرانه کردن آن probe مربوط به Cron پس از bind، `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` را تنظیم کنید.

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

- runner مربوط به Docker در `scripts/test-live-acp-bind-docker.sh` قرار دارد.
- به‌طور پیش‌فرض، smoke مربوط به bind ACP را به‌ترتیب روی عامل‌های تجمیعی زنده CLI اجرا می‌کند: `claude`، `codex`، سپس `gemini`.
- برای محدود کردن matrix از `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` یا `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` استفاده کنید.
- این runner فایل `~/.profile` را source می‌کند، مواد احراز هویت CLI متناظر را در container stage می‌کند، سپس در صورت نبود، CLI زنده درخواست‌شده (`@anthropic-ai/claude-code`، `@openai/codex`، Factory Droid از طریق `https://app.factory.ai/cli`، `@google/gemini-cli` یا `opencode-ai`) را نصب می‌کند. خود backend ACP همان بسته تعبیه‌شده `acpx/runtime` از Plugin رسمی `acpx` است.
- variant مربوط به Droid Docker برای تنظیمات، `~/.factory` را stage می‌کند، `FACTORY_API_KEY` را forward می‌کند و به آن کلید API نیاز دارد، چون احراز هویت محلی OAuth/keyring در Factory قابل انتقال به container نیست. این variant از ورودی رجیستری داخلی ACPX با `droid exec --output-format acp` استفاده می‌کند.
- variant مربوط به OpenCode Docker یک lane رگرسیون سخت‌گیرانه تک‌عاملی است. پس از source کردن `~/.profile`، یک مدل پیش‌فرض موقت `OPENCODE_CONFIG_CONTENT` را از `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` می‌نویسد (پیش‌فرض `opencode/kimi-k2.6`) و `pnpm test:docker:live-acp-bind:opencode` به‌جای پذیرفتن skip عمومی پس از bind، به transcript دستیار متصل‌شده نیاز دارد.
- فراخوانی‌های مستقیم CLI مربوط به `acpx` فقط مسیر دستی/راه‌حل موقت برای مقایسه رفتار خارج از Gateway هستند. smoke مربوط به bind ACP در Docker، backend runtime تعبیه‌شده `acpx` در OpenClaw را اجرا می‌کند.

## زنده: smoke مربوط به harness سرور برنامه Codex

- هدف: اعتبارسنجی harness متعلق به Plugin در Codex از طریق متد عادی gateway
  `agent`:
  - بارگذاری Plugin همراه‌شده `codex`
  - انتخاب `openai/gpt-5.5`، که turnهای عامل OpenAI را به‌طور پیش‌فرض از طریق Codex route می‌کند
  - ارسال اولین turn عامل gateway به `openai/gpt-5.5` با harness منتخب Codex
  - ارسال turn دوم به همان نشست OpenClaw و بررسی اینکه thread سرور برنامه
    می‌تواند resume شود
  - اجرای `/codex status` و `/codex models` از همان مسیر فرمان gateway
  - به‌صورت اختیاری اجرای دو probe shell escalated بازبینی‌شده توسط Guardian: یک
    فرمان بی‌خطر که باید تأیید شود و یک بارگذاری fake-secret که باید
    رد شود تا عامل دوباره سؤال بپرسد
- آزمون: `src/gateway/gateway-codex-harness.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- مدل پیش‌فرض: `openai/gpt-5.5`
- probe اختیاری تصویر: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- probe اختیاری MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- probe اختیاری Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- این smoke مقدار provider/model `agentRuntime.id: "codex"` را اجبار می‌کند تا
  harness خراب Codex نتواند با بازگشت خاموش به PI موفق شود.
- احراز هویت: احراز هویت سرور برنامه Codex از ورود اشتراک محلی Codex. smokeهای
  Docker همچنین می‌توانند در صورت کاربرد، `OPENAI_API_KEY` را برای probeهای غیر Codex ارائه کنند،
  به‌علاوه `~/.codex/auth.json` و `~/.codex/config.toml` کپی‌شده اختیاری.

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

- runner مربوط به Docker در `scripts/test-live-codex-harness-docker.sh` قرار دارد.
- این runner فایل mount‌شده `~/.profile` را source می‌کند، `OPENAI_API_KEY` را پاس می‌دهد، فایل‌های احراز هویت CLI مربوط به Codex را
  در صورت وجود کپی می‌کند، `@openai/codex` را در یک prefix قابل‌نوشتن npm و mount‌شده
  نصب می‌کند، درخت source را stage می‌کند و سپس فقط آزمون زنده Codex-harness را اجرا می‌کند.
- Docker به‌طور پیش‌فرض probeهای image، MCP/tool و Guardian را فعال می‌کند. وقتی به اجرای debug
  محدودتری نیاز دارید، `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` را تنظیم کنید.
- Docker از همان پیکربندی runtime صریح Codex استفاده می‌کند، بنابراین aliasهای legacy یا fallback به PI
  نمی‌توانند رگرسیون harness در Codex را پنهان کنند.

### دستورهای زنده پیشنهادی

allowlistهای محدود و صریح سریع‌ترین و کم‌نوسان‌ترین گزینه‌ها هستند:

- تک‌مدل، مستقیم (بدون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- تک‌مدل، smoke مربوط به gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فراخوانی tool بین چند provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تمرکز Google (کلید API Gemini + Antigravity):
  - Gemini (کلید API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke مربوط به adaptive thinking در Google:
  - اگر کلیدهای محلی در profile shell قرار دارند: `source ~/.profile`
  - پیش‌فرض dynamic در Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - budget dynamic در Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

نکته‌ها:

- `google/...` از Gemini API استفاده می‌کند (کلید API).
- `google-antigravity/...` از پل OAuth در Antigravity استفاده می‌کند (endpoint عامل به سبک Cloud Code Assist).
- `google-gemini-cli/...` از CLI محلی Gemini روی دستگاه شما استفاده می‌کند (احراز هویت جداگانه + رفتارهای خاص tooling).
- Gemini API در برابر Gemini CLI:
  - API: OpenClaw از طریق HTTP با API میزبانی‌شده Gemini در Google تماس می‌گیرد (کلید API / احراز هویت profile)؛ این همان چیزی است که بیشتر کاربران از «Gemini» منظور دارند.
  - CLI: OpenClaw به یک باینری محلی `gemini` shell out می‌کند؛ این باینری احراز هویت خودش را دارد و می‌تواند رفتار متفاوتی داشته باشد (پشتیبانی streaming/tool/اختلاف نسخه).

## زنده: matrix مدل‌ها (پوشش ما)

هیچ «فهرست مدل CI» ثابتی وجود ندارد (زنده opt-in است)، اما این‌ها مدل‌های **پیشنهادی** برای پوشش منظم روی دستگاه توسعه با کلیدها هستند.

### مجموعه smoke مدرن (فراخوانی tool + تصویر)

این اجرای «مدل‌های رایج» است که انتظار داریم فعال بماند:

- OpenAI (غیر Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و `google/gemini-3-flash-preview` (از مدل‌های قدیمی‌تر Gemini 2.x پرهیز کنید)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

اجرای smoke مربوط به gateway با toolها + تصویر:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### baseline: فراخوانی tool (Read + Exec اختیاری)

از هر خانواده provider حداقل یکی را انتخاب کنید:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (یا `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

پوشش افزوده اختیاری (مفید است):

- xAI: `xai/grok-4.3` (یا آخرین مورد موجود)
- Mistral: `mistral/`… (یک مدل با قابلیت «tools» که فعال کرده‌اید انتخاب کنید)
- Cerebras: `cerebras/`… (اگر دسترسی دارید)
- LM Studio: `lmstudio/`… (محلی؛ فراخوانی tool به حالت API بستگی دارد)

### Vision: ارسال تصویر (پیوست → پیام multimodal)

حداقل یک مدل با قابلیت تصویر را در `OPENCLAW_LIVE_GATEWAY_MODELS` بگنجانید (variantهای با قابلیت vision در Claude/Gemini/OpenAI و غیره) تا probe تصویر اجرا شود.

### Aggregatorها / gatewayهای جایگزین

اگر کلیدها را فعال کرده‌اید، از مسیرهای زیر نیز پشتیبانی می‌کنیم:

- OpenRouter: `openrouter/...` (صدها مدل؛ برای یافتن candidateهای دارای قابلیت tool+image از `openclaw models scan` استفاده کنید)
- OpenCode: `opencode/...` برای Zen و `opencode-go/...` برای Go (احراز هویت از طریق `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

providerهای بیشتری که می‌توانید در matrix زنده بگنجانید (اگر credential/config دارید):

- داخلی: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- از طریق `models.providers` (endpointهای سفارشی): `minimax` (cloud/API)، به‌علاوه هر proxy سازگار با OpenAI/Anthropic (LM Studio، vLLM، LiteLLM و غیره)

<Tip>
«همه مدل‌ها» را در docs هاردکد نکنید. فهرست معتبر همان چیزی است که `discoverModels(...)` روی دستگاه شما برمی‌گرداند، به‌علاوه هر کلیدی که موجود است.
</Tip>

## Credentialها (هرگز commit نکنید)

آزمون‌های زنده credentialها را همان‌طور کشف می‌کنند که CLI انجام می‌دهد. پیامدهای عملی:

- اگر CLI کار کند، آزمون‌های زنده باید همان کلیدها را پیدا کنند.
- اگر یک آزمون زنده بگوید "no creds"، آن را همان‌طور اشکال‌زدایی کنید که `openclaw models list` / انتخاب مدل را اشکال‌زدایی می‌کنید.

- پروفایل‌های احراز هویت هر عامل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (این همان چیزی است که در آزمون‌های زنده منظور از "profile keys" است)
- پیکربندی: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- دایرکتوری وضعیت قدیمی: `~/.openclaw/credentials/` (وقتی وجود داشته باشد در خانه زنده مرحله‌بندی‌شده کپی می‌شود، اما مخزن اصلی کلیدهای پروفایل نیست)
- اجراهای زنده محلی به‌طور پیش‌فرض پیکربندی فعال، فایل‌های `auth-profiles.json` هر عامل، `credentials/` قدیمی، و دایرکتوری‌های احراز هویت CLI خارجی پشتیبانی‌شده را در یک خانه آزمون موقت کپی می‌کنند؛ خانه‌های زنده مرحله‌بندی‌شده از `workspace/` و `sandboxes/` صرف‌نظر می‌کنند، و بازنویسی‌های مسیر `agents.*.workspace` / `agentDir` حذف می‌شوند تا کاوش‌ها از فضای کاری واقعی میزبان شما دور بمانند.

اگر می‌خواهید به کلیدهای محیطی تکیه کنید (مثلاً در `~/.profile` صادر شده‌اند)، آزمون‌های محلی را پس از `source ~/.profile` اجرا کنید، یا از اجراکننده‌های Docker زیر استفاده کنید (آن‌ها می‌توانند `~/.profile` را در کانتینر mount کنند).

## زنده Deepgram (رونویسی صدا)

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
  - پس از تغییر ارسال گردش‌کار comfy، polling، دانلودها، یا ثبت Plugin مفید است

## زنده تولید تصویر

- آزمون: `test/image-generation.runtime.live.test.ts`
- فرمان: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ابزار آزمون: `pnpm test:live:media image`
- دامنه:
  - هر Plugin ارائه‌دهنده تولید تصویر ثبت‌شده را فهرست می‌کند
  - پیش از کاوش، متغیرهای محیطی ارائه‌دهنده جاافتاده را از پوسته ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/محیطی را جلوتر از پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نکنند
  - ارائه‌دهنده‌های بدون احراز هویت/پروفایل/مدل قابل استفاده را رد می‌کند
  - هر ارائه‌دهنده پیکربندی‌شده را از مسیر runtime مشترک تولید تصویر اجرا می‌کند:
    - `<provider>:generate`
    - `<provider>:edit` وقتی ارائه‌دهنده پشتیبانی ویرایش را اعلام کند
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط-محیطی

برای مسیر CLI منتشرشده، پس از عبور آزمون زنده ارائه‌دهنده/runtime یک smoke `infer` اضافه کنید:

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
Plugin بسته‌بندی‌شده، runtime مشترک تولید تصویر، و درخواست زنده ارائه‌دهنده
را پوشش می‌دهد. انتظار می‌رود وابستگی‌های Plugin پیش از بارگذاری runtime حاضر باشند.

## زنده تولید موسیقی

- آزمون: `extensions/music-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ابزار آزمون: `pnpm test:live:media music`
- دامنه:
  - مسیر مشترک ارائه‌دهنده تولید موسیقی بسته‌بندی‌شده را تمرین می‌کند
  - در حال حاضر Google و MiniMax را پوشش می‌دهد
  - پیش از کاوش، متغیرهای محیطی ارائه‌دهنده را از پوسته ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/محیطی را جلوتر از پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نکنند
  - ارائه‌دهنده‌های بدون احراز هویت/پروفایل/مدل قابل استفاده را رد می‌کند
  - هر دو حالت runtime اعلام‌شده را وقتی در دسترس باشند اجرا می‌کند:
    - `generate` با ورودی فقط prompt
    - `edit` وقتی ارائه‌دهنده `capabilities.edit.enabled` را اعلام کند
  - پوشش مسیر مشترک فعلی:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: فایل زنده جداگانه Comfy، نه این sweep مشترک
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط-محیطی

## زنده تولید ویدیو

- آزمون: `extensions/video-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ابزار آزمون: `pnpm test:live:media video`
- دامنه:
  - مسیر مشترک ارائه‌دهنده تولید ویدیوی بسته‌بندی‌شده را تمرین می‌کند
  - به‌طور پیش‌فرض از مسیر smoke ایمن برای انتشار استفاده می‌کند: ارائه‌دهنده‌های غیر FAL، یک درخواست text-to-video برای هر ارائه‌دهنده، prompt یک‌ثانیه‌ای lobster، و سقف عملیات برای هر ارائه‌دهنده از `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (به‌طور پیش‌فرض `180000`)
  - به‌طور پیش‌فرض FAL را رد می‌کند چون تأخیر صف سمت ارائه‌دهنده می‌تواند زمان انتشار را غالب کند؛ برای اجرای صریح آن `--video-providers fal` یا `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` را پاس دهید
  - پیش از کاوش، متغیرهای محیطی ارائه‌دهنده را از پوسته ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/محیطی را جلوتر از پروفایل‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نکنند
  - ارائه‌دهنده‌های بدون احراز هویت/پروفایل/مدل قابل استفاده را رد می‌کند
  - به‌طور پیش‌فرض فقط `generate` را اجرا می‌کند
  - `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید تا حالت‌های transform اعلام‌شده نیز وقتی در دسترس باشند اجرا شوند:
    - `imageToVideo` وقتی ارائه‌دهنده `capabilities.imageToVideo.enabled` را اعلام کند و ارائه‌دهنده/مدل انتخاب‌شده ورودی تصویر محلی مبتنی بر buffer را در sweep مشترک بپذیرد
    - `videoToVideo` وقتی ارائه‌دهنده `capabilities.videoToVideo.enabled` را اعلام کند و ارائه‌دهنده/مدل انتخاب‌شده ورودی ویدیوی محلی مبتنی بر buffer را در sweep مشترک بپذیرد
  - ارائه‌دهنده‌های `imageToVideo` اعلام‌شده اما ردشده فعلی در sweep مشترک:
    - `vydra` چون `veo3` بسته‌بندی‌شده فقط متنی است و `kling` بسته‌بندی‌شده به URL تصویر راه‌دور نیاز دارد
  - پوشش ویژه Vydra برای هر ارائه‌دهنده:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - آن فایل `veo3` text-to-video به‌همراه یک مسیر `kling` را اجرا می‌کند که به‌طور پیش‌فرض از fixture URL تصویر راه‌دور استفاده می‌کند
  - پوشش زنده فعلی `videoToVideo`:
    - فقط `runway` وقتی مدل انتخاب‌شده `runway/gen4_aleph` باشد
  - ارائه‌دهنده‌های `videoToVideo` اعلام‌شده اما ردشده فعلی در sweep مشترک:
    - `alibaba`, `qwen`, `xai` چون این مسیرها در حال حاضر به URLهای مرجع راه‌دور `http(s)` / MP4 نیاز دارند
    - `google` چون مسیر مشترک فعلی Gemini/Veo از ورودی محلی مبتنی بر buffer استفاده می‌کند و آن مسیر در sweep مشترک پذیرفته نمی‌شود
    - `openai` چون مسیر مشترک فعلی ضمانت‌های دسترسی ویژه سازمان برای inpaint/remix ویدیو را ندارد
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` برای شامل کردن هر ارائه‌دهنده در sweep پیش‌فرض، از جمله FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` برای کاهش سقف عملیات هر ارائه‌دهنده در یک اجرای smoke تهاجمی
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط-محیطی

## ابزار آزمون زنده رسانه

- فرمان: `pnpm test:live:media`
- هدف:
  - مجموعه‌های زنده مشترک تصویر، موسیقی، و ویدیو را از طریق یک entrypoint بومی repo اجرا می‌کند
  - متغیرهای محیطی ارائه‌دهنده جاافتاده را به‌طور خودکار از `~/.profile` بارگذاری می‌کند
  - هر مجموعه را به‌طور پیش‌فرض به ارائه‌دهنده‌هایی که در حال حاضر احراز هویت قابل استفاده دارند محدود می‌کند
  - از `scripts/test-live.mjs` دوباره استفاده می‌کند، بنابراین رفتار Heartbeat و حالت quiet سازگار می‌ماند
- مثال‌ها:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مرتبط

- [آزمون](/fa/help/testing) - مجموعه‌های unit، integration، QA، و Docker
