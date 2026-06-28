---
read_when:
    - اجرای دودآزمون‌های زندهٔ ماتریس مدل / بک‌اند CLI / ACP / ارائه‌دهندهٔ رسانه
    - اشکال‌زدایی حل اعتبارنامهٔ آزمون زنده
    - افزودن یک آزمون زندهٔ جدید مخصوص ارائه‌دهنده
sidebarTitle: Live tests
summary: 'تست‌های زنده (مرتبط با شبکه): ماتریس مدل، بک‌اندهای CLI، ACP، ارائه‌دهندگان رسانه، اعتبارنامه‌ها'
title: 'آزمایش: مجموعه‌های زنده'
x-i18n:
    generated_at: "2026-06-28T20:44:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 087ec52b395131889d4ae113f304d71199c58dc9f61a1a5e1e511ae4c5b48c0b
    source_path: help/testing-live.md
    workflow: 16
---

برای شروع سریع، اجراکننده‌های QA، مجموعه‌های واحد/یکپارچه‌سازی، و جریان‌های Docker، به
[آزمون‌گیری](/fa/help/testing) مراجعه کنید. این صفحه مجموعه‌آزمون‌های **زنده** (دارای تماس شبکه‌ای) را پوشش می‌دهد:
ماتریس مدل، بک‌اندهای CLI، ACP، و آزمون‌های زنده ارائه‌دهنده رسانه، به‌همراه
مدیریت اعتبارنامه‌ها.

## زنده: فرمان‌های دود محلی

پیش از بررسی‌های زنده موردی، کلید ارائه‌دهنده لازم را در محیط فرایند export کنید.

دود امن رسانه:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

دود امن آمادگی تماس صوتی:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` یک اجرای خشک است مگر این‌که `--yes` نیز حضور داشته باشد. فقط زمانی از `--yes` استفاده کنید
که عمداً می‌خواهید یک تماس اعلان واقعی برقرار کنید. برای Twilio، Telnyx، و
Plivo، بررسی آمادگی موفق به یک URL عمومی Webhook نیاز دارد؛ fallbackهای
loopback/خصوصیِ فقط‌محلی عامدانه رد می‌شوند.

## زنده: جاروب قابلیت گره Android

- آزمون: `src/gateway/android-node.capabilities.live.test.ts`
- اسکریپت: `pnpm android:test:integration`
- هدف: فراخوانی **هر فرمانی که در حال حاضر** توسط یک گره Android متصل تبلیغ می‌شود و بررسی رفتار قرارداد فرمان.
- دامنه:
  - راه‌اندازی پیش‌شرط‌دار/دستی (این مجموعه، برنامه را نصب/اجرا/جفت نمی‌کند).
  - اعتبارسنجی `node.invoke` Gateway فرمان‌به‌فرمان برای گره Android انتخاب‌شده.
- پیش‌راه‌اندازی لازم:
  - برنامه Android از قبل به gateway متصل و با آن جفت شده باشد.
  - برنامه در پیش‌زمینه نگه داشته شود.
  - مجوزها/رضایت ضبط برای قابلیت‌هایی که انتظار دارید پاس شوند، داده شده باشد.
- بازنویسی‌های اختیاری هدف:
  - `OPENCLAW_ANDROID_NODE_ID` یا `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- جزئیات کامل راه‌اندازی Android: [برنامه Android](/fa/platforms/android)

## زنده: دود مدل (کلیدهای پروفایل)

آزمون‌های زنده به دو لایه تقسیم شده‌اند تا بتوانیم خرابی‌ها را جدا کنیم:

- «مدل مستقیم» به ما می‌گوید ارائه‌دهنده/مدل اصلاً می‌تواند با کلید داده‌شده پاسخ دهد یا نه.
- «دود Gateway» به ما می‌گوید کل خط لوله کامل gateway+agent برای آن مدل کار می‌کند (نشست‌ها، تاریخچه، ابزارها، سیاست sandbox، و غیره).

### لایه ۱: تکمیل مدل مستقیم (بدون gateway)

- آزمون: `src/agents/models.profiles.live.test.ts`
- هدف:
  - برشمردن مدل‌های کشف‌شده
  - استفاده از `getApiKeyForModel` برای انتخاب مدل‌هایی که برایشان اعتبارنامه دارید
  - اجرای یک تکمیل کوچک برای هر مدل (و رگرسیون‌های هدفمند در صورت نیاز)
- نحوه فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- برای اجرای واقعی این مجموعه، `OPENCLAW_LIVE_MODELS=modern`، `small`، یا `all` (نام مستعار modern) را تنظیم کنید؛ در غیر این صورت skip می‌شود تا `pnpm test:live` روی دود gateway متمرکز بماند
- نحوه انتخاب مدل‌ها:
  - `OPENCLAW_LIVE_MODELS=modern` برای اجرای allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 5.1، MiniMax M3، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` برای اجرای allowlist محدود مدل‌های کوچک (مسیرهای Qwen 8B/9B سازگار با local، Ollama Gemma، OpenRouter Qwen/GLM، و Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` نام مستعار allowlist مدرن است
  - یا `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist جداشده با ویرگول)
  - اجراهای مدل کوچک Ollama محلی به‌طور پیش‌فرض از `http://127.0.0.1:11434` استفاده می‌کنند؛ `OPENCLAW_LIVE_OLLAMA_BASE_URL` را فقط برای endpointهای LAN، سفارشی، یا Ollama Cloud تنظیم کنید.
  - جاروب‌های modern/all و small به‌طور پیش‌فرض از سقف‌های گزینش‌شده خود استفاده می‌کنند؛ برای جاروب کامل پروفایل‌های انتخاب‌شده `OPENCLAW_LIVE_MAX_MODELS=0` یا برای سقف کوچک‌تر یک عدد مثبت تنظیم کنید.
  - جاروب‌های کامل از `OPENCLAW_LIVE_TEST_TIMEOUT_MS` برای timeout کل آزمون مدل مستقیم استفاده می‌کنند. پیش‌فرض: ۶۰ دقیقه.
  - probeهای مدل مستقیم به‌طور پیش‌فرض با موازی‌سازی ۲۰تایی اجرا می‌شوند؛ برای بازنویسی، `OPENCLAW_LIVE_MODEL_CONCURRENCY` را تنظیم کنید.
- نحوه انتخاب ارائه‌دهندگان:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist جداشده با ویرگول)
- کلیدها از کجا می‌آیند:
  - به‌طور پیش‌فرض: store پروفایل و fallbackهای env
  - برای اجبار به استفاده فقط از **store پروفایل**، `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` را تنظیم کنید
- دلیل وجود این مورد:
  - «API ارائه‌دهنده خراب است / کلید نامعتبر است» را از «خط لوله agent در gateway خراب است» جدا می‌کند
  - رگرسیون‌های کوچک و ایزوله را شامل می‌شود (نمونه: replay استدلال OpenAI Responses/Codex Responses + جریان‌های tool-call)

### لایه ۲: دود Gateway + agent توسعه (کاری که "@openclaw" واقعاً انجام می‌دهد)

- آزمون: `src/gateway/gateway-models.profiles.live.test.ts`
- هدف:
  - بالا آوردن یک gateway درون‌فرایندی
  - ایجاد/patch یک نشست `agent:dev:*` (بازنویسی مدل در هر اجرا)
  - پیمایش مدل‌های دارای کلید و بررسی:
    - پاسخ «معنادار» (بدون ابزار)
    - یک فراخوانی ابزار واقعی کار کند (probe خواندن)
    - probeهای ابزار اضافی اختیاری (probe اجرا+خواندن)
    - مسیرهای رگرسیون OpenAI (فقط tool-call → پیگیری) همچنان کار کنند
- جزئیات probe (تا بتوانید خرابی‌ها را سریع توضیح دهید):
  - probe `read`: آزمون یک فایل nonce در workspace می‌نویسد و از agent می‌خواهد آن را `read` کند و nonce را بازتاب دهد.
  - probe `exec+read`: آزمون از agent می‌خواهد با `exec` یک nonce را در یک فایل temp بنویسد، سپس آن را `read` کند.
  - probe تصویر: آزمون یک PNG تولیدشده (cat + کد تصادفی) را پیوست می‌کند و انتظار دارد مدل `cat <CODE>` را برگرداند.
  - مرجع پیاده‌سازی: `src/gateway/gateway-models.profiles.live.test.ts` و `test/helpers/live-image-probe.ts`.
- نحوه فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- نحوه انتخاب مدل‌ها:
  - پیش‌فرض: allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M3، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` برای اجرای همان allowlist محدود مدل‌های کوچک از طریق خط لوله کامل gateway+agent
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` نام مستعار allowlist مدرن است
  - یا برای محدودسازی، `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (یا فهرست ویرگولی) را تنظیم کنید
  - جاروب‌های gateway در modern/all و small به‌طور پیش‌فرض از سقف‌های گزینش‌شده خود استفاده می‌کنند؛ برای جاروب کامل انتخاب‌شده `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` یا برای سقف کوچک‌تر یک عدد مثبت تنظیم کنید.
- نحوه انتخاب ارائه‌دهندگان (اجتناب از «همه‌چیز OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist جداشده با ویرگول)
- probeهای ابزار + تصویر همیشه در این آزمون زنده روشن هستند:
  - probe `read` + probe `exec+read` (فشار ابزار)
  - probe تصویر زمانی اجرا می‌شود که مدل پشتیبانی از ورودی تصویر را تبلیغ کند
  - جریان (در سطح بالا):
    - آزمون یک PNG کوچک با "CAT" + کد تصادفی تولید می‌کند (`test/helpers/live-image-probe.ts`)
    - آن را از طریق `agent` و `attachments: [{ mimeType: "image/png", content: "<base64>" }]` می‌فرستد
    - Gateway پیوست‌ها را به `images[]` parse می‌کند (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - agent تعبیه‌شده یک پیام کاربر چندوجهی را به مدل forward می‌کند
    - Assertion: پاسخ شامل `cat` + کد باشد (تحمل OCR: خطاهای جزئی مجازند)

<Tip>
برای دیدن این‌که روی دستگاه خود چه چیزهایی را می‌توانید آزمایش کنید (و شناسه‌های دقیق `provider/model`)، اجرا کنید:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## زنده: دود بک‌اند CLI (Claude، Gemini، یا CLIهای محلی دیگر)

- آزمون: `src/gateway/gateway-cli-backend.live.test.ts`
- هدف: اعتبارسنجی خط لوله Gateway + agent با استفاده از یک بک‌اند CLI محلی، بدون دست‌زدن به پیکربندی پیش‌فرض شما.
- پیش‌فرض‌های دود ویژه هر بک‌اند در تعریف `cli-backend.ts` افزونه مالک قرار دارند.
- فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- پیش‌فرض‌ها:
  - ارائه‌دهنده/مدل پیش‌فرض: `claude-cli/claude-sonnet-4-6`
  - رفتار command/args/image از metadata افزونه بک‌اند CLI مالک می‌آید.
- بازنویسی‌ها (اختیاری):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` برای فرستادن یک پیوست تصویر واقعی (مسیرها به prompt تزریق می‌شوند). دستورهای Docker به‌طور پیش‌فرض این را خاموش نگه می‌دارند مگر صراحتاً درخواست شود.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` برای پاس‌دادن مسیرهای فایل تصویر به‌عنوان args در CLI به‌جای تزریق prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (یا `"list"`) برای کنترل نحوه پاس‌دادن args تصویر وقتی `IMAGE_ARG` تنظیم شده است.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` برای فرستادن نوبت دوم و اعتبارسنجی جریان resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` برای opt in به probe پیوستگی همان‌نشست Claude Sonnet -> Opus وقتی مدل انتخاب‌شده از هدف switch پشتیبانی می‌کند. دستورهای Docker برای قابلیت اتکای تجمیعی، این را به‌طور پیش‌فرض خاموش نگه می‌دارند.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` برای opt in به probe loopback MCP/ابزار. دستورهای Docker به‌طور پیش‌فرض این را خاموش نگه می‌دارند مگر صراحتاً درخواست شود.

نمونه:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

دود ارزان پیکربندی MCP Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

این از Gemini نمی‌خواهد پاسخی تولید کند. همان تنظیمات سیستمی را که
OpenClaw به Gemini می‌دهد می‌نویسد، سپس `gemini --debug mcp list` را اجرا می‌کند تا ثابت کند یک
سرور ذخیره‌شده با `transport: "streamable-http"` به شکل HTTP MCP در Gemini نرمال‌سازی می‌شود
و می‌تواند به یک سرور MCP محلی streamable-HTTP متصل شود.

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

نکته‌ها:

- اجراکننده Docker در `scripts/test-live-cli-backend-docker.sh` قرار دارد.
- دود زنده بک‌اند CLI را داخل تصویر Docker ریپو و به‌عنوان کاربر غیرریشه `node` اجرا می‌کند.
- metadata دود CLI را از افزونه مالک resolve می‌کند، سپس بسته CLI متناظر Linux (`@anthropic-ai/claude-code` یا `@google/gemini-cli`) را در یک prefix قابل‌نوشتن cacheشده در `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) نصب می‌کند.
- `pnpm test:docker:live-cli-backend:claude-subscription` به OAuth قابل‌حمل اشتراک Claude Code از طریق `~/.claude/.credentials.json` همراه با `claudeAiOauth.subscriptionType` یا `CLAUDE_CODE_OAUTH_TOKEN` از `claude setup-token` نیاز دارد. ابتدا `claude -p` مستقیم در Docker را اثبات می‌کند، سپس دو نوبت بک‌اند CLI در Gateway را بدون حفظ env vars کلید API Anthropic اجرا می‌کند. این lane اشتراک، probeهای MCP/ابزار و تصویر Claude را به‌طور پیش‌فرض غیرفعال می‌کند، چون محدودیت‌های استفاده اشتراک واردشده را مصرف می‌کند و Anthropic می‌تواند رفتار billing و rate-limit در Claude Agent SDK / `claude -p` را بدون انتشار OpenClaw تغییر دهد.
- دود زنده بک‌اند CLI اکنون همان جریان انتهابه‌انتها را برای Claude و Gemini تمرین می‌دهد: نوبت متنی، نوبت دسته‌بندی تصویر، سپس فراخوانی ابزار `cron` در MCP که از طریق CLI gateway تأیید می‌شود.
- دود پیش‌فرض Claude همچنین نشست را از Sonnet به Opus patch می‌کند و تأیید می‌کند نشست resumeشده همچنان یادداشت قبلی را به خاطر دارد.

## زنده: دسترس‌پذیری پراکسی APNs HTTP/2

- آزمون: `src/infra/push-apns-http2.live.test.ts`
- هدف: تونل‌زدن از طریق یک پراکسی HTTP CONNECT محلی به endpoint sandbox APNs شرکت Apple، ارسال درخواست اعتبارسنجی APNs HTTP/2، و بررسی این‌که پاسخ واقعی `403 InvalidProviderToken` شرکت Apple از مسیر پراکسی برمی‌گردد.
- فعال‌سازی:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- timeout اختیاری:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## زنده: دود bind در ACP (`/acp spawn ... --bind here`)

- تست: `src/gateway/gateway-acp-bind.live.test.ts`
- هدف: اعتبارسنجی جریان واقعی bind مکالمه ACP با یک عامل ACP زنده:
  - ارسال `/acp spawn <agent> --bind here`
  - bind کردن یک مکالمه مصنوعی کانال پیام در همان محل
  - ارسال یک پیگیری عادی در همان مکالمه
  - تأیید اینکه پیگیری در رونوشت جلسه ACP bindشده ثبت می‌شود
- فعال‌سازی:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- پیش‌فرض‌ها:
  - عامل‌های ACP در Docker: `claude,codex,gemini`
  - عامل ACP برای اجرای مستقیم `pnpm test:live ...`: `claude`
  - کانال مصنوعی: زمینه مکالمه به سبک DM در Slack
  - backend ACP: `acpx`
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
  - این مسیر از سطح `chat.send` در gateway با فیلدهای مسیر مبدأ مصنوعی فقط مخصوص مدیر استفاده می‌کند تا تست‌ها بتوانند بدون وانمود کردن به تحویل خارجی، زمینه کانال پیام را متصل کنند.
  - وقتی `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` تنظیم نشده باشد، تست از registry عامل داخلی Plugin تعبیه‌شده `acpx` برای عامل harness انتخاب‌شده ACP استفاده می‌کند.
  - ایجاد MCP کرون جلسه bindشده به‌صورت پیش‌فرض بهترین تلاش است، چون harnessهای ACP خارجی می‌توانند پس از عبور اثبات bind/تصویر، فراخوانی‌های MCP را لغو کنند؛ برای سخت‌گیرانه کردن آن probe کرون پس از bind، `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` را تنظیم کنید.

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

- اجراکننده Docker در `scripts/test-live-acp-bind-docker.sh` قرار دارد.
- به‌صورت پیش‌فرض، smoke مربوط به bind در ACP را به‌ترتیب روی عامل‌های زنده تجمیعی CLI اجرا می‌کند: `claude`، `codex`، سپس `gemini`.
- برای محدود کردن ماتریس از `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` یا `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` استفاده کنید.
- مواد احراز هویت CLI متناظر را در container آماده می‌کند، سپس اگر CLI زنده درخواستی (`@anthropic-ai/claude-code`، `@openai/codex`، Factory Droid از طریق `https://app.factory.ai/cli`، `@google/gemini-cli` یا `opencode-ai`) موجود نباشد، آن را نصب می‌کند. خود backend ACP بسته تعبیه‌شده `acpx/runtime` از Plugin رسمی `acpx` است.
- گونه Docker مربوط به Droid، برای تنظیمات `~/.factory` را آماده می‌کند، `FACTORY_API_KEY` را forward می‌کند، و به آن کلید API نیاز دارد چون احراز هویت محلی Factory OAuth/keyring قابل انتقال به container نیست. این گونه از ورودی registry داخلی ACPX به نام `droid exec --output-format acp` استفاده می‌کند.
- گونه Docker مربوط به OpenCode یک مسیر regression سخت‌گیرانه برای یک عامل است. این گونه یک مدل پیش‌فرض موقت `OPENCODE_CONFIG_CONTENT` را از `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` می‌نویسد (پیش‌فرض `opencode/kimi-k2.6`)، و `pnpm test:docker:live-acp-bind:opencode` به‌جای پذیرش پرش عمومی پس از bind، به رونوشت assistant bindشده نیاز دارد.
- فراخوانی‌های مستقیم CLI مربوط به `acpx` فقط مسیر دستی/راه‌حل موقت برای مقایسه رفتار بیرون از Gateway هستند. smoke مربوط به bind در Docker ACP، backend زمان‌اجرای تعبیه‌شده `acpx` در OpenClaw را اجرا می‌کند.

## زنده: smoke برای harness سرور برنامه Codex

- هدف: اعتبارسنجی harness متعلق به Plugin برای Codex از طریق متد عادی
  `agent` در gateway:
  - بارگذاری Plugin بسته‌بندی‌شده `codex`
  - انتخاب `openai/gpt-5.5` که به‌صورت پیش‌فرض نوبت‌های عامل OpenAI را از طریق Codex مسیریابی می‌کند
  - ارسال نخستین نوبت عامل gateway به `openai/gpt-5.5` با harness انتخاب‌شده Codex
  - ارسال نوبت دوم به همان جلسه OpenClaw و تأیید اینکه thread سرور برنامه
    می‌تواند ادامه پیدا کند
  - اجرای `/codex status` و `/codex models` از همان مسیر فرمان gateway
  - اجرای اختیاری دو probe شل ارتقایافته با بازبینی Guardian: یک فرمان بی‌خطر
    که باید تأیید شود و یک بارگذاری fake-secret که باید رد شود تا عامل پاسخ بخواهد
- تست: `src/gateway/gateway-codex-harness.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- مدل پیش‌فرض: `openai/gpt-5.5`
- probe اختیاری تصویر: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- probe اختیاری MCP/ابزار: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- probe اختیاری Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke، provider/model `agentRuntime.id: "codex"` را اجبار می‌کند تا یک harness خراب Codex
  نتواند با fallback بی‌صدا به OpenClaw موفق شود.
- احراز هویت: احراز هویت سرور برنامه Codex از ورود اشتراک محلی Codex. smokeهای Docker
  همچنین می‌توانند در صورت کاربرد، `OPENAI_API_KEY` را برای probeهای غیر Codex فراهم کنند،
  به‌علاوه `~/.codex/auth.json` و `~/.codex/config.toml` کپی‌شده اختیاری.

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

- اجراکننده Docker در `scripts/test-live-codex-harness-docker.sh` قرار دارد.
- `OPENAI_API_KEY` را عبور می‌دهد، فایل‌های احراز هویت CLI مربوط به Codex را وقتی وجود داشته باشند کپی می‌کند، `@openai/codex` را در یک prefix قابل نوشتن و mountشده npm
  نصب می‌کند، درخت منبع را آماده می‌کند، سپس فقط تست زنده harness مربوط به Codex را اجرا می‌کند.
- Docker به‌صورت پیش‌فرض probeهای تصویر، MCP/ابزار و Guardian را فعال می‌کند. وقتی به یک اجرای debug محدودتر نیاز دارید،
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` را تنظیم کنید.
- Docker از همان پیکربندی صریح زمان‌اجرای Codex استفاده می‌کند، بنابراین aliasهای قدیمی یا fallback مربوط به OpenClaw
  نمی‌توانند regression در harness Codex را پنهان کنند.

### دستورهای زنده پیشنهادی

allowlistهای محدود و صریح سریع‌ترین و کم‌نوسان‌ترین گزینه‌ها هستند:

- مدل تکی، مستقیم (بدون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- پروفایل مستقیم مدل کوچک:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- پروفایل gateway برای مدل کوچک:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke برای Ollama Cloud API:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- مدل تکی، smoke در gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فراخوانی ابزار در چند provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke مستقیم Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- تمرکز روی Google (کلید Gemini API + Antigravity):
  - Gemini (کلید API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke تفکر تطبیقی Google:
  - پیش‌فرض پویا Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - بودجه پویا Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

نکته‌ها:

- `google/...` از Gemini API استفاده می‌کند (کلید API).
- `google-antigravity/...` از پل OAuth مربوط به Antigravity استفاده می‌کند (endpoint عامل به سبک Cloud Code Assist).
- `google-gemini-cli/...` از CLI محلی Gemini روی دستگاه شما استفاده می‌کند (احراز هویت جداگانه + نکته‌های خاص ابزار).
- Gemini API در برابر Gemini CLI:
  - API: OpenClaw، Gemini API میزبانی‌شده Google را از طریق HTTP فراخوانی می‌کند (کلید API / احراز هویت پروفایل)؛ این همان چیزی است که بیشتر کاربران از «Gemini» منظور دارند.
  - CLI: OpenClaw به یک باینری محلی `gemini` shell out می‌کند؛ این مسیر احراز هویت خودش را دارد و می‌تواند متفاوت رفتار کند (streaming/پشتیبانی ابزار/ناهمخوانی نسخه).

## زنده: ماتریس مدل‌ها (آنچه پوشش می‌دهیم)

هیچ «فهرست مدل CI» ثابتی وجود ندارد (زنده opt-in است)، اما این‌ها مدل‌های **پیشنهادی** برای پوشش منظم روی یک دستگاه توسعه با کلیدها هستند.

### مجموعه smoke مدرن (فراخوانی ابزار + تصویر)

این اجرای «مدل‌های رایج» است که انتظار داریم کارکرد آن حفظ شود:

- OpenAI (غیر Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و `google/gemini-3-flash-preview` (از مدل‌های قدیمی‌تر Gemini 2.x پرهیز کنید)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API عمومی) یا `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

اجرای smoke در gateway با ابزارها + تصویر:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط مبنا: فراخوانی ابزار (Read + Exec اختیاری)

حداقل یکی را از هر خانواده provider انتخاب کنید:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (یا `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (API عمومی) یا `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

پوشش اضافی اختیاری (خوب است داشته باشید):

- xAI: `xai/grok-4.3` (یا جدیدترین مورد موجود)
- Mistral: `mistral/`… (یک مدل دارای قابلیت "tools" را که فعال کرده‌اید انتخاب کنید)
- Cerebras: `cerebras/`… (اگر دسترسی دارید)
- LM Studio: `lmstudio/`… (محلی؛ فراخوانی ابزار به حالت API بستگی دارد)

### بینایی: ارسال تصویر (پیوست → پیام چندوجهی)

برای اجرای probe تصویر، حداقل یک مدل با قابلیت تصویر را در `OPENCLAW_LIVE_GATEWAY_MODELS` قرار دهید (گونه‌های دارای قابلیت بینایی Claude/Gemini/OpenAI و غیره).

### تجمیع‌کننده‌ها / gatewayهای جایگزین

اگر کلیدها را فعال کرده‌اید، از تست از طریق این‌ها نیز پشتیبانی می‌کنیم:

- OpenRouter: `openrouter/...` (صدها مدل؛ برای یافتن گزینه‌های دارای قابلیت ابزار+تصویر از `openclaw models scan` استفاده کنید)
- OpenCode: `opencode/...` برای Zen و `opencode-go/...` برای Go (احراز هویت از طریق `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

providerهای بیشتری که می‌توانید در ماتریس زنده بگنجانید (اگر اعتبارنامه/پیکربندی دارید):

- داخلی: `openai`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- از طریق `models.providers` (نقاط پایانی سفارشی): `minimax` (ابر/API)، به‌علاوه هر پراکسی سازگار با OpenAI/Anthropic (LM Studio، vLLM، LiteLLM و غیره)

<Tip>
در مستندات «همه مدل‌ها» را سخت‌کد نکنید. فهرست معتبر همان چیزی است که `discoverModels(...)` روی دستگاه شما برمی‌گرداند، به‌علاوه هر کلیدی که در دسترس است.
</Tip>

## اعتبارنامه‌ها (هرگز commit نکنید)

آزمون‌های زنده اعتبارنامه‌ها را همان‌طور کشف می‌کنند که CLI انجام می‌دهد. پیامدهای عملی:

- اگر CLI کار می‌کند، آزمون‌های زنده باید همان کلیدها را پیدا کنند.
- اگر یک آزمون زنده می‌گوید «بدون اعتبارنامه»، همان‌طور عیب‌یابی کنید که `openclaw models list` / انتخاب مدل را عیب‌یابی می‌کنید.

- نمایه‌های احراز هویت به‌ازای هر عامل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (این همان چیزی است که «کلیدهای نمایه» در آزمون‌های زنده معنی می‌دهد)
- پیکربندی: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- پوشه وضعیت قدیمی: `~/.openclaw/credentials/` (در صورت وجود، به خانه زنده مرحله‌بندی‌شده کپی می‌شود، اما مخزن اصلی کلید نمایه نیست)
- اجراهای زنده محلی به‌طور پیش‌فرض پیکربندی فعال، فایل‌های `auth-profiles.json` به‌ازای هر عامل، `credentials/` قدیمی، و پوشه‌های احراز هویت CLI خارجی پشتیبانی‌شده را به یک خانه آزمون موقت کپی می‌کنند؛ خانه‌های زنده مرحله‌بندی‌شده از `workspace/` و `sandboxes/` صرف‌نظر می‌کنند، و بازنویسی‌های مسیر `agents.*.workspace` / `agentDir` حذف می‌شوند تا کاوش‌ها از فضای کاری واقعی میزبان شما دور بمانند.

اگر می‌خواهید به کلیدهای env تکیه کنید، پیش از آزمون‌های محلی آن‌ها را export کنید یا از اجراکننده‌های
Docker پایین با یک `OPENCLAW_PROFILE_FILE` صریح استفاده کنید.

## Deepgram زنده (رونویسی صوت)

- آزمون: `extensions/deepgram/audio.live.test.ts`
- فعال‌سازی: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## طرح کدنویسی زنده BytePlus

- آزمون: `extensions/byteplus/live.test.ts`
- فعال‌سازی: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- بازنویسی اختیاری مدل: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## رسانه گردش‌کار زنده ComfyUI

- آزمون: `extensions/comfy/comfy.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- دامنه:
  - مسیرهای داخلی تصویر، ویدیو، و `music_generate` در comfy را تمرین می‌کند
  - هر قابلیت را رد می‌کند مگر اینکه `plugins.entries.comfy.config.<capability>` پیکربندی شده باشد
  - پس از تغییر ارسال گردش‌کار comfy، نظرسنجی، دانلودها، یا ثبت Plugin مفید است

## تولید تصویر زنده

- آزمون: `test/image-generation.runtime.live.test.ts`
- دستور: `pnpm test:live test/image-generation.runtime.live.test.ts`
- هارنس: `pnpm test:live:media image`
- دامنه:
  - همه Pluginهای ارائه‌دهنده تولید تصویر ثبت‌شده را فهرست می‌کند
  - پیش از کاوش، از متغیرهای env ارائه‌دهنده که قبلا export شده‌اند استفاده می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/env را جلوتر از نمایه‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نکنند
  - ارائه‌دهنده‌هایی را که احراز هویت/نمایه/مدل قابل استفاده ندارند رد می‌کند
  - هر ارائه‌دهنده پیکربندی‌شده را از طریق runtime مشترک تولید تصویر اجرا می‌کند:
    - `<provider>:generate`
    - `<provider>:edit` وقتی ارائه‌دهنده پشتیبانی از ویرایش را اعلام می‌کند
- ارائه‌دهنده‌های داخلی فعلی پوشش‌داده‌شده:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت مخزن نمایه و نادیده گرفتن بازنویسی‌های فقط env

برای مسیر CLI ارسال‌شده، پس از موفق شدن آزمون زنده ارائه‌دهنده/runtime، یک smoke با `infer` اضافه کنید:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

این مورد تجزیه آرگومان‌های CLI، حل پیکربندی/عامل پیش‌فرض، فعال‌سازی
Plugin داخلی، runtime مشترک تولید تصویر، و درخواست زنده ارائه‌دهنده
را پوشش می‌دهد. انتظار می‌رود وابستگی‌های Plugin پیش از بارگذاری runtime حاضر باشند.

## تولید موسیقی زنده

- آزمون: `extensions/music-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- هارنس: `pnpm test:live:media music`
- دامنه:
  - مسیر مشترک ارائه‌دهنده داخلی تولید موسیقی را تمرین می‌کند
  - در حال حاضر Google و MiniMax را پوشش می‌دهد
  - پیش از کاوش، از متغیرهای env ارائه‌دهنده که قبلا export شده‌اند استفاده می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/env را جلوتر از نمایه‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نکنند
  - ارائه‌دهنده‌هایی را که احراز هویت/نمایه/مدل قابل استفاده ندارند رد می‌کند
  - هر دو حالت runtime اعلام‌شده را وقتی در دسترس باشند اجرا می‌کند:
    - `generate` با ورودی فقط prompt
    - `edit` وقتی ارائه‌دهنده `capabilities.edit.enabled` را اعلام می‌کند
  - پوشش مسیر مشترک فعلی:
    - `google`: `generate`، `edit`
    - `minimax`: `generate`
    - `comfy`: فایل زنده جداگانه Comfy، نه این جاروب مشترک
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- رفتار احراز هویت اختیاری:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت مخزن نمایه و نادیده گرفتن بازنویسی‌های فقط env

## تولید ویدیو زنده

- آزمون: `extensions/video-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- هارنس: `pnpm test:live:media video`
- دامنه:
  - مسیر مشترک ارائه‌دهنده داخلی تولید ویدیو را تمرین می‌کند
  - به‌طور پیش‌فرض از مسیر smoke ایمن برای انتشار استفاده می‌کند: ارائه‌دهنده‌های غیر FAL، یک درخواست متن‌به‌ویدیو برای هر ارائه‌دهنده، prompt یک‌ثانیه‌ای خرچنگ، و سقف عملیات به‌ازای هر ارائه‌دهنده از `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` به‌طور پیش‌فرض)
  - به‌طور پیش‌فرض FAL را رد می‌کند چون تأخیر صف سمت ارائه‌دهنده می‌تواند زمان انتشار را غالب کند؛ برای اجرای صریح آن، `--video-providers fal` یا `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` را پاس دهید
  - پیش از کاوش، از متغیرهای env ارائه‌دهنده که قبلا export شده‌اند استفاده می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/env را جلوتر از نمایه‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی shell را پنهان نکنند
  - ارائه‌دهنده‌هایی را که احراز هویت/نمایه/مدل قابل استفاده ندارند رد می‌کند
  - به‌طور پیش‌فرض فقط `generate` را اجرا می‌کند
  - `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید تا حالت‌های transform اعلام‌شده نیز وقتی در دسترس هستند اجرا شوند:
    - `imageToVideo` وقتی ارائه‌دهنده `capabilities.imageToVideo.enabled` را اعلام می‌کند و ارائه‌دهنده/مدل انتخاب‌شده ورودی تصویر محلی پشتوانه‌دار با buffer را در جاروب مشترک می‌پذیرد
    - `videoToVideo` وقتی ارائه‌دهنده `capabilities.videoToVideo.enabled` را اعلام می‌کند و ارائه‌دهنده/مدل انتخاب‌شده ورودی ویدیوی محلی پشتوانه‌دار با buffer را در جاروب مشترک می‌پذیرد
  - ارائه‌دهنده‌های `imageToVideo` اعلام‌شده اما ردشده فعلی در جاروب مشترک:
    - `vydra` چون `veo3` داخلی فقط متنی است و `kling` داخلی به URL تصویر راه‌دور نیاز دارد
  - پوشش اختصاصی ارائه‌دهنده Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - آن فایل به‌طور پیش‌فرض `veo3` متن‌به‌ویدیو را به‌همراه یک مسیر `kling` اجرا می‌کند که از fixture URL تصویر راه‌دور استفاده می‌کند
  - پوشش زنده فعلی `videoToVideo`:
    - `runway` فقط وقتی مدل انتخاب‌شده `runway/gen4_aleph` باشد
  - ارائه‌دهنده‌های `videoToVideo` اعلام‌شده اما ردشده فعلی در جاروب مشترک:
    - `alibaba`، `qwen`، `xai` چون آن مسیرها در حال حاضر به URLهای مرجع راه‌دور `http(s)` / MP4 نیاز دارند
    - `google` چون مسیر مشترک فعلی Gemini/Veo از ورودی محلی پشتوانه‌دار با buffer استفاده می‌کند و آن مسیر در جاروب مشترک پذیرفته نمی‌شود
    - `openai` چون مسیر مشترک فعلی تضمین‌های دسترسی ویرایش ویدیوی اختصاصی org را ندارد
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` برای شامل کردن همه ارائه‌دهنده‌ها در جاروب پیش‌فرض، از جمله FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` برای کاهش سقف عملیات هر ارائه‌دهنده در یک اجرای smoke سخت‌گیرانه
- رفتار احراز هویت اختیاری:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت مخزن نمایه و نادیده گرفتن بازنویسی‌های فقط env

## هارنس زنده رسانه

- دستور: `pnpm test:live:media`
- هدف:
  - مجموعه‌های زنده مشترک تصویر، موسیقی، و ویدیو را از طریق یک entrypoint بومی repo اجرا می‌کند
  - از متغیرهای env ارائه‌دهنده که قبلا export شده‌اند استفاده می‌کند
  - هر مجموعه را به‌طور پیش‌فرض به ارائه‌دهنده‌هایی محدود می‌کند که در حال حاضر احراز هویت قابل استفاده دارند
  - از `scripts/test-live.mjs` دوباره استفاده می‌کند، بنابراین رفتار Heartbeat و حالت quiet سازگار می‌ماند
- مثال‌ها:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مرتبط

- [آزمون‌گیری](/fa/help/testing) - مجموعه‌های واحد، یکپارچه‌سازی، QA، و Docker
