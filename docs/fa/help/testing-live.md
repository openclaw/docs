---
read_when:
    - اجرای آزمون‌های دود ماتریس مدل زنده / بک‌اند CLI / ACP / media-provider
    - اشکال‌زدایی تعیین اعتبارنامه‌های آزمون زنده
    - افزودن یک آزمون زندهٔ جدیدِ ویژهٔ ارائه‌دهنده
sidebarTitle: Live tests
summary: 'آزمون‌های زنده (در ارتباط با شبکه): ماتریس مدل، بک‌اندهای CLI، ACP، ارائه‌دهندگان رسانه، اعتبارنامه‌ها'
title: 'آزمون: مجموعه‌آزمون‌های زنده'
x-i18n:
    generated_at: "2026-05-02T11:50:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2268f20ce5c0bbee8bf610938851fe529f5e21fa31fe08a70400df94e9241cc3
    source_path: help/testing-live.md
    workflow: 16
---

برای شروع سریع، اجراکننده‌های QA، مجموعه‌های تست واحد/یکپارچه‌سازی و جریان‌های Docker، به
[تست کردن](/fa/help/testing) مراجعه کنید. این صفحه مجموعه‌های تست **زنده** (دارای ارتباط شبکه‌ای) را پوشش می‌دهد:
ماتریس مدل، بک‌اندهای CLI، ACP، و تست‌های زنده ارائه‌دهنده رسانه، به‌همراه
مدیریت اعتبارنامه‌ها.

## زنده: دستورهای smoke پروفایل محلی

پیش از بررسی‌های زنده موردی، `~/.profile` را source کنید تا کلیدهای ارائه‌دهنده و مسیرهای ابزار محلی
با shell شما هم‌خوان باشند:

```bash
source ~/.profile
```

smoke امن رسانه:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

smoke امن آمادگی تماس صوتی:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` یک اجرای خشک است مگر اینکه `--yes` نیز حضور داشته باشد. فقط زمانی از `--yes` استفاده کنید
که عمدا می‌خواهید یک تماس اطلاع‌رسانی واقعی برقرار کنید. برای Twilio، Telnyx، و
Plivo، بررسی موفق آمادگی به یک URL عمومی Webhook نیاز دارد؛ جایگزین‌های فقط‌محلی
local loopback/خصوصی طبق طراحی رد می‌شوند.

## زنده: پیمایش قابلیت Node اندروید

- تست: `src/gateway/android-node.capabilities.live.test.ts`
- اسکریپت: `pnpm android:test:integration`
- هدف: فراخوانی **هر دستوری که در حال حاضر** توسط یک Node اندروید متصل اعلام شده است و اعتبارسنجی رفتار قرارداد دستور.
- دامنه:
  - آماده‌سازی پیش‌شرط‌دار/دستی (این مجموعه، برنامه را نصب/اجرا/جفت‌سازی نمی‌کند).
  - اعتبارسنجی دستوربه‌دستور Gateway `node.invoke` برای Node اندروید انتخاب‌شده.
- آماده‌سازی ضروری پیشین:
  - برنامه اندروید از قبل متصل و با Gateway جفت شده باشد.
  - برنامه در پیش‌زمینه نگه داشته شود.
  - مجوزها/رضایت ضبط برای قابلیت‌هایی که انتظار دارید قبول شوند اعطا شده باشد.
- بازنویسی‌های اختیاری هدف:
  - `OPENCLAW_ANDROID_NODE_ID` یا `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- جزئیات کامل راه‌اندازی اندروید: [برنامه اندروید](/fa/platforms/android)

## زنده: smoke مدل (کلیدهای پروفایل)

تست‌های زنده به دو لایه تقسیم شده‌اند تا بتوانیم خرابی‌ها را جدا کنیم:

- «مدل مستقیم» به ما می‌گوید ارائه‌دهنده/مدل اساسا می‌تواند با کلید داده‌شده پاسخ دهد.
- «smoke Gateway» به ما می‌گوید کل خط لوله Gateway+عامل برای آن مدل کار می‌کند (نشست‌ها، تاریخچه، ابزارها، سیاست sandbox، و غیره).

### لایه ۱: تکمیل مستقیم مدل (بدون Gateway)

- تست: `src/agents/models.profiles.live.test.ts`
- هدف:
  - شمارش مدل‌های کشف‌شده
  - استفاده از `getApiKeyForModel` برای انتخاب مدل‌هایی که برایشان اعتبارنامه دارید
  - اجرای یک تکمیل کوچک برای هر مدل (و رگرسیون‌های هدفمند در صورت نیاز)
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- برای اجرای واقعی این مجموعه، `OPENCLAW_LIVE_MODELS=modern` (یا `all`، نام مستعار modern) را تنظیم کنید؛ در غیر این صورت رد می‌شود تا `pnpm test:live` روی smoke Gateway متمرکز بماند
- روش انتخاب مدل‌ها:
  - `OPENCLAW_LIVE_MODELS=modern` برای اجرای فهرست مجاز مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` نام مستعار فهرست مجاز مدرن است
  - یا `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (فهرست مجاز جداشده با ویرگول)
  - پیمایش‌های modern/all به‌طور پیش‌فرض یک سقف گزینش‌شده با سیگنال بالا دارند؛ برای پیمایش مدرن کامل، `OPENCLAW_LIVE_MAX_MODELS=0` یا برای سقف کوچک‌تر یک عدد مثبت تنظیم کنید.
  - پیمایش‌های کامل از `OPENCLAW_LIVE_TEST_TIMEOUT_MS` برای مهلت زمانی کل تست مدل مستقیم استفاده می‌کنند. پیش‌فرض: ۶۰ دقیقه.
  - probeهای مدل مستقیم به‌طور پیش‌فرض با موازی‌سازی ۲۰تایی اجرا می‌شوند؛ برای بازنویسی، `OPENCLAW_LIVE_MODEL_CONCURRENCY` را تنظیم کنید.
- روش انتخاب ارائه‌دهنده‌ها:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (فهرست مجاز جداشده با ویرگول)
- کلیدها از کجا می‌آیند:
  - به‌طور پیش‌فرض: ذخیره‌گاه پروفایل و fallbackهای env
  - برای اعمال اجباری فقط **ذخیره‌گاه پروفایل**، `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` را تنظیم کنید
- دلیل وجود این بخش:
  - «API ارائه‌دهنده خراب است / کلید نامعتبر است» را از «خط لوله عامل Gateway خراب است» جدا می‌کند
  - رگرسیون‌های کوچک و ایزوله را دربر می‌گیرد (مثال: بازپخش reasoning OpenAI Responses/Codex Responses + جریان‌های tool-call)

### لایه ۲: smoke Gateway + عامل dev (کاری که "@openclaw" واقعا انجام می‌دهد)

- تست: `src/gateway/gateway-models.profiles.live.test.ts`
- هدف:
  - راه‌اندازی یک Gateway درون‌فرایندی
  - ساخت/patch کردن یک نشست `agent:dev:*` (بازنویسی مدل برای هر اجرا)
  - پیمایش models-with-keys و اعتبارسنجی:
    - پاسخ «معنادار» (بدون ابزار)
    - یک فراخوانی ابزار واقعی کار می‌کند (probe خواندن)
    - probeهای ابزار اضافی اختیاری (probe اجرا+خواندن)
    - مسیرهای رگرسیون OpenAI (فقط tool-call → پیگیری) همچنان کار می‌کنند
- جزئیات probe (تا بتوانید خرابی‌ها را سریع توضیح دهید):
  - probe `read`: تست یک فایل nonce در workspace می‌نویسد و از عامل می‌خواهد آن را `read` کند و nonce را بازتاب دهد.
  - probe `exec+read`: تست از عامل می‌خواهد با `exec` یک nonce را در یک فایل موقت بنویسد، سپس آن را با `read` برگرداند.
  - probe تصویر: تست یک PNG تولیدشده (cat + کد تصادفی) پیوست می‌کند و انتظار دارد مدل `cat <CODE>` را برگرداند.
  - مرجع پیاده‌سازی: `src/gateway/gateway-models.profiles.live.test.ts` و `src/gateway/live-image-probe.ts`.
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- روش انتخاب مدل‌ها:
  - پیش‌فرض: فهرست مجاز مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` نام مستعار فهرست مجاز مدرن است
  - یا برای محدود کردن، `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (یا فهرست جداشده با ویرگول) را تنظیم کنید
  - پیمایش‌های Gateway از نوع modern/all به‌طور پیش‌فرض یک سقف گزینش‌شده با سیگنال بالا دارند؛ برای پیمایش مدرن کامل، `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` یا برای سقف کوچک‌تر یک عدد مثبت تنظیم کنید.
- روش انتخاب ارائه‌دهنده‌ها (پرهیز از «همه‌چیز OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (فهرست مجاز جداشده با ویرگول)
- probeهای ابزار + تصویر همیشه در این تست زنده فعال هستند:
  - probe `read` + probe `exec+read` (فشار ابزار)
  - probe تصویر زمانی اجرا می‌شود که مدل پشتیبانی ورودی تصویر را اعلام کند
  - جریان (در سطح بالا):
    - تست یک PNG کوچک با «CAT» + کد تصادفی تولید می‌کند (`src/gateway/live-image-probe.ts`)
    - آن را از طریق `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ارسال می‌کند
    - Gateway پیوست‌ها را به `images[]` تبدیل می‌کند (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - عامل تعبیه‌شده یک پیام کاربر چندوجهی را به مدل ارسال می‌کند
    - Assertion: پاسخ شامل `cat` + کد است (تلرانس OCR: خطاهای جزئی مجازند)

<Tip>
برای دیدن اینکه چه چیزهایی را می‌توانید روی ماشین خود تست کنید (و شناسه‌های دقیق `provider/model`)، اجرا کنید:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## زنده: smoke بک‌اند CLI (Claude، Codex، Gemini، یا CLIهای محلی دیگر)

- تست: `src/gateway/gateway-cli-backend.live.test.ts`
- هدف: اعتبارسنجی خط لوله Gateway + عامل با استفاده از یک بک‌اند CLI محلی، بدون دست‌زدن به پیکربندی پیش‌فرض شما.
- پیش‌فرض‌های smoke ویژه هر بک‌اند با تعریف `cli-backend.ts` Plugin مالک قرار دارند.
- فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- پیش‌فرض‌ها:
  - ارائه‌دهنده/مدل پیش‌فرض: `claude-cli/claude-sonnet-4-6`
  - رفتار دستور/آرگومان‌ها/تصویر از فراداده Plugin بک‌اند CLI مالک می‌آید.
- بازنویسی‌ها (اختیاری):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` برای ارسال یک پیوست تصویر واقعی (مسیرها به prompt تزریق می‌شوند). دستورالعمل‌های Docker این را به‌طور پیش‌فرض خاموش نگه می‌دارند مگر اینکه صراحتا درخواست شود.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` برای ارسال مسیرهای فایل تصویر به‌عنوان آرگومان‌های CLI به‌جای تزریق prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (یا `"list"`) برای کنترل نحوه ارسال آرگومان‌های تصویر وقتی `IMAGE_ARG` تنظیم شده است.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` برای ارسال turn دوم و اعتبارسنجی جریان resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` برای فعال کردن probe تداوم همان نشست Claude Sonnet -> Opus وقتی مدل انتخاب‌شده از هدف switch پشتیبانی می‌کند. دستورالعمل‌های Docker این را برای قابلیت اتکای تجمیعی به‌طور پیش‌فرض خاموش نگه می‌دارند.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` برای فعال کردن probe MCP/tool loopback. دستورالعمل‌های Docker این را به‌طور پیش‌فرض خاموش نگه می‌دارند مگر اینکه صراحتا درخواست شود.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

smoke ارزان پیکربندی Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

این از Gemini نمی‌خواهد پاسخی تولید کند. همان تنظیمات سیستمی را که OpenClaw به Gemini می‌دهد
می‌نویسد، سپس `gemini --debug mcp list` را اجرا می‌کند تا ثابت کند یک سرور ذخیره‌شده با
`transport: "streamable-http"` به شکل HTTP MCP متعلق به Gemini نرمال‌سازی می‌شود
و می‌تواند به یک سرور MCP محلی streamable-HTTP متصل شود.

دستورالعمل Docker:

```bash
pnpm test:docker:live-cli-backend
```

دستورالعمل‌های Docker تک‌ارائه‌دهنده:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

نکات:

- اجراکننده Docker در `scripts/test-live-cli-backend-docker.sh` قرار دارد.
- smoke زنده بک‌اند CLI را داخل تصویر Docker مخزن، به‌عنوان کاربر غیر-root به نام `node` اجرا می‌کند.
- فراداده smoke CLI را از extension مالک resolve می‌کند، سپس بسته CLI لینوکس متناظر (`@anthropic-ai/claude-code`، `@openai/codex`، یا `@google/gemini-cli`) را در یک prefix قابل‌نوشتن cacheشده در `OPENCLAW_DOCKER_CLI_TOOLS_DIR` نصب می‌کند (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` به OAuth قابل‌حمل اشتراک Claude Code از طریق `~/.claude/.credentials.json` با `claudeAiOauth.subscriptionType` یا `CLAUDE_CODE_OAUTH_TOKEN` از `claude setup-token` نیاز دارد. ابتدا اجرای مستقیم `claude -p` در Docker را اثبات می‌کند، سپس دو turn بک‌اند CLI Gateway را بدون حفظ متغیرهای env کلید API Anthropic اجرا می‌کند. این lane اشتراک، probeهای MCP/tool و تصویر Claude را به‌طور پیش‌فرض غیرفعال می‌کند، زیرا Claude در حال حاضر استفاده از برنامه شخص ثالث را به‌جای محدودیت‌های عادی طرح اشتراک، از مسیر صورتحساب مصرف اضافی عبور می‌دهد.
- smoke زنده بک‌اند CLI اکنون همان جریان end-to-end را برای Claude، Codex، و Gemini اجرا می‌کند: turn متنی، turn طبقه‌بندی تصویر، سپس فراخوانی ابزار MCP `cron` که از طریق CLI Gateway تأیید می‌شود.
- smoke پیش‌فرض Claude همچنین نشست را از Sonnet به Opus patch می‌کند و تأیید می‌کند نشست resumeشده همچنان یک یادداشت قبلی را به خاطر دارد.

## زنده: smoke اتصال ACP (`/acp spawn ... --bind here`)

- آزمایش: `src/gateway/gateway-acp-bind.live.test.ts`
- هدف: اعتبارسنجی جریان واقعی bind مکالمه ACP با یک agent زنده ACP:
  - ارسال `/acp spawn <agent> --bind here`
  - bind کردن یک مکالمه مصنوعی message-channel در همان محل
  - ارسال یک پیگیری عادی در همان مکالمه
  - اطمینان از اینکه پیگیری وارد transcript نشست bind شده ACP می‌شود
- فعال‌سازی:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- پیش‌فرض‌ها:
  - agentهای ACP در Docker: `claude,codex,gemini`
  - agent ACP برای اجرای مستقیم `pnpm test:live ...`: `claude`
  - کانال مصنوعی: context مکالمه به سبک DM در Slack
  - backend مربوط به ACP: `acpx`
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
- یادداشت‌ها:
  - این lane از سطح gateway به نام `chat.send` همراه با فیلدهای synthetic originating-route فقط برای admin استفاده می‌کند تا آزمایش‌ها بتوانند context مربوط به message-channel را بدون وانمود کردن به تحویل خارجی متصل کنند.
  - وقتی `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` تنظیم نشده باشد، آزمایش برای agent انتخاب‌شده ACP harness از رجیستری agent داخلی Plugin تعبیه‌شده `acpx` استفاده می‌کند.
  - ساخت Cron MCP برای نشست bind شده به طور پیش‌فرض best-effort است، چون harnessهای خارجی ACP می‌توانند فراخوانی‌های MCP را پس از عبور از proof مربوط به bind/image لغو کنند؛ برای سخت‌گیرانه کردن آن probe مربوط به Cron پس از bind، `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` را تنظیم کنید.

مثال:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

دستورالعمل Docker:

```bash
pnpm test:docker:live-acp-bind
```

دستورالعمل‌های Docker برای یک agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

یادداشت‌های Docker:

- اجراکننده Docker در `scripts/test-live-acp-bind-docker.sh` قرار دارد.
- به طور پیش‌فرض، smoke مربوط به bind در ACP را به‌ترتیب در برابر agentهای live CLI تجمیعی اجرا می‌کند: `claude`، سپس `codex`، سپس `gemini`.
- برای محدود کردن matrix از `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`، یا `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` استفاده کنید.
- این اجراکننده `~/.profile` را source می‌کند، material مربوط به احراز هویت CLI مطابق را در container stage می‌کند، سپس در صورت نبودن، live CLI درخواستی (`@anthropic-ai/claude-code`، `@openai/codex`، Factory Droid از طریق `https://app.factory.ai/cli`، `@google/gemini-cli`، یا `opencode-ai`) را نصب می‌کند. خود backend مربوط به ACP همان package تعبیه‌شده `acpx/runtime` از Plugin رسمی `acpx` است.
- variant مربوط به Droid در Docker، `~/.factory` را برای settings stage می‌کند، `FACTORY_API_KEY` را forward می‌کند، و به آن API key نیاز دارد چون احراز هویت local Factory OAuth/keyring به container قابل انتقال نیست. این variant از entry رجیستری داخلی ACPX به نام `droid exec --output-format acp` استفاده می‌کند.
- variant مربوط به OpenCode در Docker یک lane سخت‌گیرانه regression برای یک agent است. پس از source کردن `~/.profile`، یک default model موقت در `OPENCODE_CONFIG_CONTENT` از `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` می‌نویسد (پیش‌فرض `opencode/kimi-k2.6`) و `pnpm test:docker:live-acp-bind:opencode` به‌جای پذیرفتن skip عمومی پس از bind، به transcript مربوط به assistant bind شده نیاز دارد.
- فراخوانی‌های مستقیم CLI مربوط به `acpx` فقط یک مسیر دستی/workaround برای مقایسه رفتار خارج از Gateway هستند. smoke مربوط به bind در Docker ACP، backend runtime تعبیه‌شده `acpx` در OpenClaw را تمرین می‌دهد.

## زنده: smoke مربوط به Codex app-server harness

- هدف: اعتبارسنجی Codex harness متعلق به Plugin از مسیر عادی gateway
  method به نام `agent`:
  - بارگذاری Plugin همراه `codex`
  - انتخاب `OPENCLAW_AGENT_RUNTIME=codex`
  - ارسال نخستین turn مربوط به gateway agent به `openai/gpt-5.5` با Codex harness اجباری
  - ارسال turn دوم به همان نشست OpenClaw و اطمینان از اینکه thread مربوط به app-server
    می‌تواند resume شود
  - اجرای `/codex status` و `/codex models` از همان مسیر command مربوط به gateway
  - اجرای اختیاری دو probe مربوط به shell escalated که توسط Guardian بازبینی می‌شوند: یک
    command بی‌خطر که باید تأیید شود و یک upload جعلی secret که باید
    رد شود تا agent دوباره سؤال بپرسد
- آزمایش: `src/gateway/gateway-codex-harness.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- مدل پیش‌فرض: `openai/gpt-5.5`
- probe اختیاری image: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- probe اختیاری MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- probe اختیاری Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- این smoke مقدار `OPENCLAW_AGENT_HARNESS_FALLBACK=none` را تنظیم می‌کند تا Codex
  harness خراب نتواند با fallback بی‌صدا به PI قبول شود.
- احراز هویت: احراز هویت Codex app-server از ورود local اشتراک Codex. smokeهای Docker
  همچنین می‌توانند در صورت کاربرد، برای probeهای غیر Codex مقدار `OPENAI_API_KEY` را ارائه کنند،
  به‌علاوه کپی اختیاری `~/.codex/auth.json` و `~/.codex/config.toml`.

دستورالعمل local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

دستورالعمل Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

یادداشت‌های Docker:

- اجراکننده Docker در `scripts/test-live-codex-harness-docker.sh` قرار دارد.
- این اجراکننده `~/.profile` mount شده را source می‌کند، `OPENAI_API_KEY` را pass می‌کند، فایل‌های احراز هویت Codex CLI را
  در صورت وجود کپی می‌کند، `@openai/codex` را در یک prefix قابل نوشتن npm که mount شده نصب می‌کند،
  درخت source را stage می‌کند، سپس فقط آزمایش زنده Codex-harness را اجرا می‌کند.
- Docker به طور پیش‌فرض probeهای image، MCP/tool، و Guardian را فعال می‌کند. وقتی به اجرای debug
  محدودتری نیاز دارید، `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` را تنظیم کنید.
- Docker همچنین `OPENCLAW_AGENT_HARNESS_FALLBACK=none` را export می‌کند، مطابق با config آزمایش زنده
  تا aliasهای legacy یا fallback به PI نتوانند regression مربوط به Codex harness را پنهان کنند.

### دستورالعمل‌های زنده پیشنهادی

allowlistهای محدود و صریح سریع‌ترین و کم‌نوسان‌ترین گزینه هستند:

- یک مدل، مستقیم (بدون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- یک مدل، gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فراخوانی tool در چند provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تمرکز Google (کلید Gemini API + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - اگر کلیدهای local در shell profile قرار دارند: `source ~/.profile`
  - default پویای Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - budget پویای Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

یادداشت‌ها:

- `google/...` از Gemini API استفاده می‌کند (API key).
- `google-antigravity/...` از bridge مربوط به Antigravity OAuth استفاده می‌کند (endpoint مربوط به agent به سبک Cloud Code Assist).
- `google-gemini-cli/...` از Gemini CLI local روی دستگاه شما استفاده می‌کند (احراز هویت جداگانه + ویژگی‌های خاص tooling).
- Gemini API در برابر Gemini CLI:
  - API: OpenClaw از طریق HTTP با API میزبانی‌شده Gemini در Google تماس می‌گیرد (API key / احراز هویت profile)؛ این همان چیزی است که بیشتر کاربران از «Gemini» منظور دارند.
  - CLI: OpenClaw یک binary به نام `gemini` را به‌صورت local در shell اجرا می‌کند؛ احراز هویت خودش را دارد و می‌تواند رفتار متفاوتی داشته باشد (پشتیبانی streaming/tool/اختلاف version).

## زنده: matrix مدل‌ها (آنچه پوشش می‌دهیم)

هیچ «فهرست مدل CI» ثابتی وجود ندارد (live اختیاری است)، اما این‌ها مدل‌های **پیشنهادی** برای پوشش منظم روی دستگاه توسعه با کلیدها هستند.

### مجموعه smoke مدرن (tool calling + image)

این اجرای «مدل‌های رایج» است که انتظار داریم کارکرد آن حفظ شود:

- OpenAI (غیر Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و `google/gemini-3-flash-preview` (از مدل‌های قدیمی‌تر Gemini 2.x پرهیز کنید)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

اجرای gateway smoke با tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### baseline: tool calling (Read + Exec اختیاری)

از هر خانواده provider حداقل یکی را انتخاب کنید:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (یا `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

پوشش اختیاری بیشتر (خوب است داشته باشید):

- xAI: `xai/grok-4.3` (یا آخرین مورد موجود)
- Mistral: `mistral/`… (یک مدل با قابلیت “tools” که فعال کرده‌اید انتخاب کنید)
- Cerebras: `cerebras/`… (اگر دسترسی دارید)
- LM Studio: `lmstudio/`… (local؛ tool calling به mode مربوط به API بستگی دارد)

### Vision: ارسال image (attachment → پیام multimodal)

حداقل یک مدل دارای قابلیت image را در `OPENCLAW_LIVE_GATEWAY_MODELS` قرار دهید (variantهای دارای قابلیت vision در Claude/Gemini/OpenAI و غیره) تا probe مربوط به image اجرا شود.

### Aggregatorها / gatewayهای جایگزین

اگر کلیدها را فعال کرده‌اید، آزمایش از مسیرهای زیر را نیز پشتیبانی می‌کنیم:

- OpenRouter: `openrouter/...` (صدها مدل؛ برای یافتن candidateهای دارای قابلیت tool+image از `openclaw models scan` استفاده کنید)
- OpenCode: `opencode/...` برای Zen و `opencode-go/...` برای Go (احراز هویت از طریق `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

providerهای بیشتری که می‌توانید در matrix زنده قرار دهید (اگر creds/config دارید):

- Built-in: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- از طریق `models.providers` (endpointهای سفارشی): `minimax` (cloud/API)، به‌علاوه هر proxy سازگار با OpenAI/Anthropic (LM Studio، vLLM، LiteLLM، و غیره)

<Tip>
در docs عبارت "all models" را hardcode نکنید. فهرست معتبر همان چیزی است که `discoverModels(...)` روی دستگاه شما برمی‌گرداند، به‌علاوه کلیدهایی که در دسترس هستند.
</Tip>

## Credentials (هرگز commit نکنید)

آزمایش‌های زنده credentialها را به همان روشی که CLI انجام می‌دهد کشف می‌کنند. پیامدهای عملی:

- اگر CLI کار کند، تست‌های زنده باید همان کلیدها را پیدا کنند.
- اگر یک تست زنده بگوید «no creds»، همان‌طور عیب‌یابی کنید که `openclaw models list` / انتخاب مدل را عیب‌یابی می‌کنید.

- پروفایل‌های احراز هویت هر عامل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (منظور از «کلیدهای پروفایل» در تست‌های زنده همین است)
- پیکربندی: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- دایرکتوری وضعیت قدیمی: `~/.openclaw/credentials/` (در صورت وجود، به خانه‌ی زنده‌ی مرحله‌بندی‌شده کپی می‌شود، اما مخزن اصلی کلید پروفایل نیست)
- اجراهای زنده‌ی محلی به‌صورت پیش‌فرض پیکربندی فعال، فایل‌های `auth-profiles.json` هر عامل، `credentials/` قدیمی، و دایرکتوری‌های احراز هویت CLI خارجی پشتیبانی‌شده را در یک خانه‌ی موقت تست کپی می‌کنند؛ خانه‌های زنده‌ی مرحله‌بندی‌شده `workspace/` و `sandboxes/` را رد می‌کنند، و بازنویسی‌های مسیر `agents.*.workspace` / `agentDir` حذف می‌شوند تا پروب‌ها از فضای کاری واقعی میزبان شما دور بمانند.

اگر می‌خواهید به کلیدهای محیطی تکیه کنید (مثلاً صادرشده در `~/.profile`)، تست‌های محلی را پس از `source ~/.profile` اجرا کنید، یا از اجراکننده‌های Docker زیر استفاده کنید (آن‌ها می‌توانند `~/.profile` را داخل کانتینر mount کنند).

## اجرای زنده‌ی Deepgram (رونویسی صوتی)

- تست: `extensions/deepgram/audio.live.test.ts`
- فعال‌سازی: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## اجرای زنده‌ی طرح کدنویسی BytePlus

- تست: `extensions/byteplus/live.test.ts`
- فعال‌سازی: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- بازنویسی اختیاری مدل: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## اجرای زنده‌ی رسانه‌ی گردش‌کار ComfyUI

- تست: `extensions/comfy/comfy.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- دامنه:
  - مسیرهای تصویر، ویدئو، و `music_generate` بسته‌بندی‌شده‌ی comfy را تمرین می‌کند
  - هر قابلیت را رد می‌کند مگر اینکه `plugins.entries.comfy.config.<capability>` پیکربندی شده باشد
  - پس از تغییر ارسال گردش‌کار comfy، نظرسنجی، دانلودها، یا ثبت Plugin مفید است

## اجرای زنده‌ی تولید تصویر

- تست: `test/image-generation.runtime.live.test.ts`
- فرمان: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- دامنه:
  - همه‌ی Pluginهای ارائه‌دهنده‌ی ثبت‌شده‌ی تولید تصویر را فهرست می‌کند
  - پیش از پروب کردن، متغیرهای محیطی ارائه‌دهنده‌ی گم‌شده را از پوسته‌ی ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌صورت پیش‌فرض کلیدهای API زنده/محیطی را مقدم بر پروفایل‌های احراز هویت ذخیره‌شده به کار می‌گیرد، تا کلیدهای تست قدیمی در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نکنند
  - ارائه‌دهنده‌های بدون احراز هویت/پروفایل/مدل قابل‌استفاده را رد می‌کند
  - هر ارائه‌دهنده‌ی پیکربندی‌شده را از مسیر runtime مشترک تولید تصویر اجرا می‌کند:
    - `<provider>:generate`
    - `<provider>:edit` وقتی ارائه‌دهنده پشتیبانی از ویرایش را اعلام کند
- ارائه‌دهنده‌های بسته‌بندی‌شده‌ی فعلی که پوشش داده می‌شوند:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط‌محیطی

برای مسیر CLI منتشرشده، پس از موفقیت تست زنده‌ی ارائه‌دهنده/runtime، یک smoke مربوط به `infer` اضافه کنید:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

این مورد، تجزیه‌ی آرگومان‌های CLI، حل پیکربندی/عامل پیش‌فرض، فعال‌سازی
Plugin بسته‌بندی‌شده، runtime مشترک تولید تصویر، و درخواست زنده‌ی ارائه‌دهنده
را پوشش می‌دهد. انتظار می‌رود وابستگی‌های Plugin پیش از بارگذاری runtime وجود داشته باشند.

## اجرای زنده‌ی تولید موسیقی

- تست: `extensions/music-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- دامنه:
  - مسیر مشترک ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی تولید موسیقی را تمرین می‌کند
  - در حال حاضر Google و MiniMax را پوشش می‌دهد
  - پیش از پروب کردن، متغیرهای محیطی ارائه‌دهنده را از پوسته‌ی ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌صورت پیش‌فرض کلیدهای API زنده/محیطی را مقدم بر پروفایل‌های احراز هویت ذخیره‌شده به کار می‌گیرد، تا کلیدهای تست قدیمی در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نکنند
  - ارائه‌دهنده‌های بدون احراز هویت/پروفایل/مدل قابل‌استفاده را رد می‌کند
  - هر دو حالت runtime اعلام‌شده را در صورت وجود اجرا می‌کند:
    - `generate` با ورودی فقط prompt
    - `edit` وقتی ارائه‌دهنده `capabilities.edit.enabled` را اعلام کند
  - پوشش فعلی مسیر مشترک:
    - `google`: `generate`، `edit`
    - `minimax`: `generate`
    - `comfy`: فایل زنده‌ی جداگانه‌ی Comfy، نه این sweep مشترک
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط‌محیطی

## اجرای زنده‌ی تولید ویدئو

- تست: `extensions/video-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- دامنه:
  - مسیر مشترک ارائه‌دهنده‌ی بسته‌بندی‌شده‌ی تولید ویدئو را تمرین می‌کند
  - به‌صورت پیش‌فرض از مسیر smoke امن برای انتشار استفاده می‌کند: ارائه‌دهنده‌های غیر FAL، یک درخواست متن‌به‌ویدئو برای هر ارائه‌دهنده، prompt یک‌ثانیه‌ای lobster، و سقف عملیات هر ارائه‌دهنده از `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` به‌صورت پیش‌فرض)
  - به‌صورت پیش‌فرض FAL را رد می‌کند، چون تأخیر صف سمت ارائه‌دهنده می‌تواند بر زمان انتشار غالب شود؛ برای اجرای صریح آن `--video-providers fal` یا `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` را پاس دهید
  - پیش از پروب کردن، متغیرهای محیطی ارائه‌دهنده را از پوسته‌ی ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌صورت پیش‌فرض کلیدهای API زنده/محیطی را مقدم بر پروفایل‌های احراز هویت ذخیره‌شده به کار می‌گیرد، تا کلیدهای تست قدیمی در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نکنند
  - ارائه‌دهنده‌های بدون احراز هویت/پروفایل/مدل قابل‌استفاده را رد می‌کند
  - به‌صورت پیش‌فرض فقط `generate` را اجرا می‌کند
  - برای اجرای حالت‌های تبدیل اعلام‌شده در صورت وجود، `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید:
    - `imageToVideo` وقتی ارائه‌دهنده `capabilities.imageToVideo.enabled` را اعلام کند و ارائه‌دهنده/مدل انتخاب‌شده در sweep مشترک، ورودی تصویر محلی پشتیبانی‌شده با buffer را بپذیرد
    - `videoToVideo` وقتی ارائه‌دهنده `capabilities.videoToVideo.enabled` را اعلام کند و ارائه‌دهنده/مدل انتخاب‌شده در sweep مشترک، ورودی ویدئوی محلی پشتیبانی‌شده با buffer را بپذیرد
  - ارائه‌دهنده‌های فعلی `imageToVideo` که اعلام شده‌اند اما در sweep مشترک رد می‌شوند:
    - `vydra` چون `veo3` بسته‌بندی‌شده فقط متنی است و `kling` بسته‌بندی‌شده به URL تصویر راه‌دور نیاز دارد
  - پوشش ویژه‌ی ارائه‌دهنده‌ی Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - آن فایل، متن‌به‌ویدئوی `veo3` به‌علاوه‌ی یک مسیر `kling` را اجرا می‌کند که به‌صورت پیش‌فرض از fixture URL تصویر راه‌دور استفاده می‌کند
  - پوشش زنده‌ی فعلی `videoToVideo`:
    - `runway` فقط وقتی مدل انتخاب‌شده `runway/gen4_aleph` باشد
  - ارائه‌دهنده‌های فعلی `videoToVideo` که اعلام شده‌اند اما در sweep مشترک رد می‌شوند:
    - `alibaba`، `qwen`، `xai` چون آن مسیرها در حال حاضر به URLهای مرجع راه‌دور `http(s)` / MP4 نیاز دارند
    - `google` چون مسیر مشترک فعلی Gemini/Veo از ورودی محلی پشتیبانی‌شده با buffer استفاده می‌کند و آن مسیر در sweep مشترک پذیرفته نمی‌شود
    - `openai` چون مسیر مشترک فعلی تضمین‌های دسترسی سازمانی ویژه به inpaint/remix ویدئو ندارد
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` برای شامل کردن همه‌ی ارائه‌دهنده‌ها در sweep پیش‌فرض، از جمله FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` برای کاهش سقف عملیات هر ارائه‌دهنده در یک اجرای smoke سخت‌گیرانه
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از مخزن پروفایل و نادیده گرفتن بازنویسی‌های فقط‌محیطی

## Harness زنده‌ی رسانه

- فرمان: `pnpm test:live:media`
- هدف:
  - مجموعه‌های زنده‌ی مشترک تصویر، موسیقی، و ویدئو را از طریق یک نقطه‌ی ورود بومی repo اجرا می‌کند
  - متغیرهای محیطی ارائه‌دهنده‌ی گم‌شده را به‌صورت خودکار از `~/.profile` بارگذاری می‌کند
  - به‌صورت پیش‌فرض هر مجموعه را خودکار به ارائه‌دهنده‌هایی که در حال حاضر احراز هویت قابل‌استفاده دارند محدود می‌کند
  - از `scripts/test-live.mjs` دوباره استفاده می‌کند، بنابراین رفتار Heartbeat و حالت quiet سازگار می‌ماند
- نمونه‌ها:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مرتبط

- [تست](/fa/help/testing) — مجموعه‌های unit، integration، QA، و Docker
