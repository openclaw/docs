---
read_when:
    - اجرای دودآزمایی‌های ماتریس مدل زنده / backend CLI / ACP / media-provider
    - اشکال‌زدایی از تعیین اعتبارنامه‌های آزمون زنده
    - افزودن یک آزمون زندهٔ مختص ارائه‌دهنده
sidebarTitle: Live tests
summary: 'آزمون‌های زنده (درگیر با شبکه): ماتریس مدل‌ها، بک‌اندهای CLI، ACP، ارائه‌دهندگان رسانه، اعتبارنامه‌ها'
title: 'آزمون: مجموعه‌های زنده'
x-i18n:
    generated_at: "2026-04-29T23:00:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

برای شروع سریع، اجراکننده‌های QA، مجموعه‌های واحد/یکپارچه‌سازی، و جریان‌های Docker، به
[آزمایش](/fa/help/testing) مراجعه کنید. این صفحه مجموعه‌های آزمایشی **زنده** (درگیر با شبکه) را
پوشش می‌دهد: ماتریس مدل، پشتانه‌های CLI، ACP، و آزمون‌های زنده ارائه‌دهنده‌های رسانه، به‌همراه
مدیریت اعتبارنامه‌ها.

## زنده: فرمان‌های smoke پروفایل محلی

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

`voicecall smoke` یک اجرای آزمایشی بدون اثر واقعی است مگر این‌که `--yes` هم وجود داشته باشد. فقط زمانی از `--yes` استفاده کنید
که عمدا می‌خواهید یک تماس اعلان واقعی برقرار کنید. برای Twilio، Telnyx، و
Plivo، بررسی موفق آمادگی به یک URL عمومی Webhook نیاز دارد؛ fallbackهای فقط-محلی
loopback/private طبق طراحی رد می‌شوند.

## زنده: پیمایش قابلیت Node اندروید

- آزمون: `src/gateway/android-node.capabilities.live.test.ts`
- اسکریپت: `pnpm android:test:integration`
- هدف: فراخوانی **هر فرمانی که در حال حاضر** توسط یک Node اندروید متصل اعلام شده است و بررسی رفتار قرارداد فرمان.
- دامنه:
  - راه‌اندازی پیش‌شرط‌دار/دستی (این مجموعه، برنامه را نصب/اجرا/جفت نمی‌کند).
  - اعتبارسنجی command-by-command مربوط به `node.invoke` در Gateway برای Node اندروید انتخاب‌شده.
- پیش‌راه‌اندازی لازم:
  - برنامه اندروید از قبل به Gateway متصل و جفت شده باشد.
  - برنامه در پیش‌زمینه نگه داشته شود.
  - مجوزها/رضایت ضبط برای قابلیت‌هایی که انتظار دارید قبول شوند اعطا شده باشد.
- بازنویسی‌های اختیاری هدف:
  - `OPENCLAW_ANDROID_NODE_ID` یا `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- جزئیات کامل راه‌اندازی اندروید: [برنامه اندروید](/fa/platforms/android)

## زنده: smoke مدل (کلیدهای پروفایل)

آزمون‌های زنده به دو لایه تقسیم شده‌اند تا بتوانیم خرابی‌ها را جدا کنیم:

- «مدل مستقیم» به ما می‌گوید آیا ارائه‌دهنده/مدل اصولا با کلید داده‌شده پاسخ می‌دهد یا نه.
- «smoke Gateway» به ما می‌گوید کل pipeline کامل Gateway+agent برای آن مدل کار می‌کند (sessionها، تاریخچه، ابزارها، سیاست sandbox و غیره).

### لایه ۱: تکمیل مستقیم مدل (بدون Gateway)

- آزمون: `src/agents/models.profiles.live.test.ts`
- هدف:
  - شمارش مدل‌های کشف‌شده
  - استفاده از `getApiKeyForModel` برای انتخاب مدل‌هایی که برایشان اعتبارنامه دارید
  - اجرای یک تکمیل کوچک برای هر مدل (و رگرسیون‌های هدفمند در صورت نیاز)
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- برای اجرای واقعی این مجموعه، `OPENCLAW_LIVE_MODELS=modern` (یا `all`، نام مستعار modern) را تنظیم کنید؛ در غیر این صورت برای متمرکز نگه داشتن `pnpm test:live` روی smoke Gateway، رد می‌شود
- روش انتخاب مدل‌ها:
  - `OPENCLAW_LIVE_MODELS=modern` برای اجرای allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` نام مستعار allowlist مدرن است
  - یا `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist جداشده با ویرگول)
  - پیمایش‌های modern/all به‌طور پیش‌فرض از یک سقف گزینش‌شده و پرسیگنال استفاده می‌کنند؛ برای پیمایش کامل مدرن `OPENCLAW_LIVE_MAX_MODELS=0` را تنظیم کنید یا برای سقف کوچک‌تر یک عدد مثبت بدهید.
  - پیمایش‌های کامل از `OPENCLAW_LIVE_TEST_TIMEOUT_MS` برای timeout کل آزمون مدل مستقیم استفاده می‌کنند. پیش‌فرض: ۶۰ دقیقه.
  - probeهای مدل مستقیم به‌طور پیش‌فرض با موازی‌سازی ۲۰تایی اجرا می‌شوند؛ برای بازنویسی، `OPENCLAW_LIVE_MODEL_CONCURRENCY` را تنظیم کنید.
- روش انتخاب ارائه‌دهنده‌ها:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist جداشده با ویرگول)
- کلیدها از کجا می‌آیند:
  - به‌طور پیش‌فرض: profile store و fallbackهای env
  - برای اجبار به استفاده فقط از **profile store**، `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` را تنظیم کنید
- دلیل وجود این بخش:
  - «API ارائه‌دهنده خراب است / کلید نامعتبر است» را از «pipeline عامل Gateway خراب است» جدا می‌کند
  - رگرسیون‌های کوچک و ایزوله را در خود دارد (نمونه: بازپخش reasoning در OpenAI Responses/Codex Responses + جریان‌های tool-call)

### لایه ۲: smoke مربوط به Gateway + عامل dev (کاری که "@openclaw" واقعا انجام می‌دهد)

- آزمون: `src/gateway/gateway-models.profiles.live.test.ts`
- هدف:
  - بالا آوردن یک Gateway درون‌فرایندی
  - ساخت/patch یک session با `agent:dev:*` (بازنویسی مدل برای هر اجرا)
  - پیمایش مدل‌های دارای کلید و بررسی:
    - پاسخ «معنادار» (بدون ابزار)
    - یک فراخوانی ابزار واقعی کار کند (probe خواندن)
    - probeهای ابزار اضافی اختیاری (probe اجرا+خواندن)
    - مسیرهای رگرسیون OpenAI (فقط tool-call ← follow-up) همچنان کار کنند
- جزئیات probe (تا بتوانید خرابی‌ها را سریع توضیح دهید):
  - probe `read`: آزمون یک فایل nonce در workspace می‌نویسد و از عامل می‌خواهد آن را `read` کند و nonce را بازتاب دهد.
  - probe `exec+read`: آزمون از عامل می‌خواهد با `exec` یک nonce را در یک فایل موقت بنویسد، سپس آن را `read` کند.
  - probe تصویر: آزمون یک PNG تولیدشده (cat + کد تصادفی) را پیوست می‌کند و انتظار دارد مدل `cat <CODE>` را برگرداند.
  - مرجع پیاده‌سازی: `src/gateway/gateway-models.profiles.live.test.ts` و `src/gateway/live-image-probe.ts`.
- روش فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- روش انتخاب مدل‌ها:
  - پیش‌فرض: allowlist مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` نام مستعار allowlist مدرن است
  - یا برای محدود کردن، `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (یا فهرست جداشده با ویرگول) را تنظیم کنید
  - پیمایش‌های modern/all Gateway به‌طور پیش‌فرض از یک سقف گزینش‌شده و پرسیگنال استفاده می‌کنند؛ برای پیمایش کامل مدرن `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` را تنظیم کنید یا برای سقف کوچک‌تر یک عدد مثبت بدهید.
- روش انتخاب ارائه‌دهنده‌ها (برای اجتناب از «همه‌چیز OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist جداشده با ویرگول)
- probeهای ابزار + تصویر همیشه در این آزمون زنده فعال‌اند:
  - probe `read` + probe `exec+read` (فشار ابزار)
  - probe تصویر زمانی اجرا می‌شود که مدل پشتیبانی از ورودی تصویر را اعلام کند
  - جریان (در سطح بالا):
    - آزمون یک PNG کوچک با “CAT” + کد تصادفی تولید می‌کند (`src/gateway/live-image-probe.ts`)
    - آن را از طریق `agent` و `attachments: [{ mimeType: "image/png", content: "<base64>" }]` می‌فرستد
    - Gateway پیوست‌ها را به `images[]` تجزیه می‌کند (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - عامل embedded یک پیام کاربر چندوجهی را به مدل forward می‌کند
    - assertion: پاسخ شامل `cat` + کد باشد (تحمل OCR: خطاهای جزئی مجازند)

<Tip>
برای دیدن این‌که روی دستگاهتان چه چیزهایی را می‌توانید آزمایش کنید (و شناسه‌های دقیق `provider/model`)، اجرا کنید:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## زنده: smoke پشتانه CLI (Claude، Codex، Gemini، یا CLIهای محلی دیگر)

- آزمون: `src/gateway/gateway-cli-backend.live.test.ts`
- هدف: اعتبارسنجی pipeline مربوط به Gateway + عامل با استفاده از یک پشتانه CLI محلی، بدون دست زدن به config پیش‌فرض شما.
- پیش‌فرض‌های smoke اختصاصی پشتانه در تعریف `cli-backend.ts` متعلق به Plugin مالک قرار دارند.
- فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- پیش‌فرض‌ها:
  - ارائه‌دهنده/مدل پیش‌فرض: `claude-cli/claude-sonnet-4-6`
  - رفتار فرمان/آرگومان‌ها/تصویر از metadata مربوط به Plugin پشتانه CLI مالک می‌آید.
- بازنویسی‌ها (اختیاری):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` برای ارسال یک پیوست تصویر واقعی (مسیرها به prompt تزریق می‌شوند). recipeهای Docker به‌طور پیش‌فرض این را خاموش می‌گذارند مگر این‌که صراحتا درخواست شود.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` برای پاس دادن مسیرهای فایل تصویر به‌عنوان آرگومان‌های CLI به‌جای تزریق در prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (یا `"list"`) برای کنترل نحوه پاس دادن آرگومان‌های تصویر وقتی `IMAGE_ARG` تنظیم شده است.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` برای ارسال نوبت دوم و اعتبارسنجی جریان resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` برای opt in به probe تداوم همان session از Claude Sonnet -> Opus، وقتی مدل انتخاب‌شده از هدف switch پشتیبانی می‌کند. recipeهای Docker برای قابلیت اتکای تجمیعی به‌طور پیش‌فرض این را خاموش می‌گذارند.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` برای opt in به probe loopback مربوط به MCP/tool. recipeهای Docker به‌طور پیش‌فرض این را خاموش می‌گذارند مگر این‌که صراحتا درخواست شود.

نمونه:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

smoke ارزان config برای Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

این از Gemini نمی‌خواهد پاسخی تولید کند. همان تنظیمات سیستمی را که OpenClaw به Gemini می‌دهد می‌نویسد، سپس `gemini --debug mcp list` را اجرا می‌کند تا ثابت کند یک سرور ذخیره‌شده با `transport: "streamable-http"` به شکل HTTP MCP در Gemini نرمال‌سازی می‌شود و می‌تواند به یک سرور MCP محلی streamable-HTTP وصل شود.

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
- smoke زنده پشتانه CLI را داخل تصویر Docker repo به‌عنوان کاربر غیر root با نام `node` اجرا می‌کند.
- metadata مربوط به smoke CLI را از extension مالک resolve می‌کند، سپس بسته CLI لینوکسی منطبق (`@anthropic-ai/claude-code`، `@openai/codex`، یا `@google/gemini-cli`) را در یک پیشوند قابل‌نوشتن cacheشده در `OPENCLAW_DOCKER_CLI_TOOLS_DIR` نصب می‌کند (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` به OAuth قابل‌حمل اشتراک Claude Code از طریق `~/.claude/.credentials.json` با `claudeAiOauth.subscriptionType` یا `CLAUDE_CODE_OAUTH_TOKEN` از `claude setup-token` نیاز دارد. ابتدا اجرای مستقیم `claude -p` در Docker را اثبات می‌کند، سپس دو نوبت پشتانه CLI در Gateway را بدون حفظ متغیرهای env کلید API Anthropic اجرا می‌کند. این lane اشتراک، probeهای MCP/tool و تصویر Claude را به‌طور پیش‌فرض غیرفعال می‌کند، چون Claude در حال حاضر استفاده از برنامه‌های third-party را به‌جای محدودیت‌های عادی طرح اشتراک، از طریق صورتحساب extra-usage مسیریابی می‌کند.
- smoke زنده پشتانه CLI اکنون همان جریان end-to-end را برای Claude، Codex، و Gemini تمرین می‌کند: نوبت متن، نوبت طبقه‌بندی تصویر، سپس فراخوانی ابزار `cron` مربوط به MCP که از طریق CLI مربوط به Gateway تأیید می‌شود.
- smoke پیش‌فرض Claude همچنین session را از Sonnet به Opus patch می‌کند و تأیید می‌کند که session ازسرگرفته‌شده هنوز یک یادداشت قبلی را به خاطر دارد.

## زنده: smoke اتصال ACP (`/acp spawn ... --bind here`)

- آزمایش: `src/gateway/gateway-acp-bind.live.test.ts`
- هدف: اعتبارسنجی جریان واقعی bind مکالمه ACP با یک عامل زنده ACP:
  - ارسال `/acp spawn <agent> --bind here`
  - bind کردن یک مکالمه مصنوعی کانال پیام در همان محل
  - ارسال یک پیگیری عادی در همان مکالمه
  - تأیید اینکه پیگیری در رونوشت جلسه bind شده ACP ثبت می‌شود
- فعال‌سازی:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- پیش‌فرض‌ها:
  - عامل‌های ACP در Docker: `claude,codex,gemini`
  - عامل ACP برای اجرای مستقیم `pnpm test:live ...`: `claude`
  - کانال مصنوعی: زمینه مکالمه به سبک Slack DM
  - پشتیبان ACP: `acpx`
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
  - این مسیر از سطح `chat.send` در Gateway با فیلدهای originating-route مصنوعی فقط ویژه ادمین استفاده می‌کند تا آزمایش‌ها بتوانند زمینه کانال پیام را بدون تظاهر به تحویل بیرونی پیوست کنند.
  - وقتی `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` تنظیم نشده باشد، آزمایش از رجیستری داخلی عامل در Plugin تعبیه‌شده `acpx` برای عامل انتخاب‌شده harness ACP استفاده می‌کند.
  - ایجاد MCP برای Cron جلسه bind شده به‌صورت پیش‌فرض بهترین‌تلاش است، چون harnessهای بیرونی ACP می‌توانند پس از گذراندن اثبات bind/image فراخوانی‌های MCP را لغو کنند؛ `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` را تنظیم کنید تا آن کاوش Cron پس از bind سخت‌گیرانه شود.

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

یادداشت‌های Docker:

- اجراکننده Docker در `scripts/test-live-acp-bind-docker.sh` قرار دارد.
- به‌صورت پیش‌فرض، smoke مربوط به bind ACP را به‌ترتیب روی عامل‌های CLI زنده تجمیعی اجرا می‌کند: `claude`، سپس `codex`، سپس `gemini`.
- برای محدود کردن ماتریس از `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`، یا `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` استفاده کنید.
- این اجراکننده `~/.profile` را source می‌کند، مواد احراز هویت CLI متناظر را داخل کانتینر stage می‌کند، سپس در صورت نبود، CLI زنده درخواستی (`@anthropic-ai/claude-code`، `@openai/codex`، Factory Droid از طریق `https://app.factory.ai/cli`، `@google/gemini-cli`، یا `opencode-ai`) را نصب می‌کند. خود پشتیبان ACP بسته تعبیه‌شده همراه `acpx/runtime` از Plugin `acpx` است.
- گونه Docker مربوط به Droid، `~/.factory` را برای تنظیمات stage می‌کند، `FACTORY_API_KEY` را forward می‌کند، و به آن کلید API نیاز دارد چون احراز هویت محلی Factory OAuth/keyring به کانتینر قابل انتقال نیست. از ورودی رجیستری داخلی ACPX به نام `droid exec --output-format acp` استفاده می‌کند.
- گونه Docker مربوط به OpenCode یک مسیر رگرسیون سخت‌گیرانه تک‌عاملی است. پس از source کردن `~/.profile`، یک مدل پیش‌فرض موقت `OPENCODE_CONFIG_CONTENT` را از `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` می‌نویسد (پیش‌فرض `opencode/kimi-k2.6`)، و `pnpm test:docker:live-acp-bind:opencode` به‌جای پذیرش skip عمومی پس از bind، به رونوشت دستیار bind شده نیاز دارد.
- فراخوانی‌های مستقیم CLI مربوط به `acpx` فقط مسیر دستی/راه‌حل موقت برای مقایسه رفتار بیرون از Gateway هستند. smoke مربوط به bind ACP در Docker، پشتیبان runtime تعبیه‌شده `acpx` در OpenClaw را تمرین می‌دهد.

## زنده: smoke مربوط به harness سرور برنامه Codex

- هدف: اعتبارسنجی harness متعلق به Plugin در Codex از طریق روش عادی Gateway
  `agent`:
  - بارگذاری Plugin همراه `codex`
  - انتخاب `OPENCLAW_AGENT_RUNTIME=codex`
  - ارسال نخستین نوبت عامل Gateway به `openai/gpt-5.5` با اجبار harness Codex
  - ارسال نوبت دوم به همان جلسه OpenClaw و تأیید اینکه thread سرور برنامه
    می‌تواند ادامه یابد
  - اجرای `/codex status` و `/codex models` از همان مسیر فرمان Gateway
  - در صورت نیاز، اجرای دو کاوش shell با ارتقای دسترسی و بازبینی‌شده توسط Guardian: یک فرمان بی‌ضرر
    که باید تأیید شود و یک بارگذاری fake-secret که باید رد شود
    تا عامل دوباره سؤال کند
- آزمایش: `src/gateway/gateway-codex-harness.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- مدل پیش‌فرض: `openai/gpt-5.5`
- کاوش تصویر اختیاری: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- کاوش MCP/tool اختیاری: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- کاوش Guardian اختیاری: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- این smoke مقدار `OPENCLAW_AGENT_HARNESS_FALLBACK=none` را تنظیم می‌کند تا harness خراب Codex نتواند با fallback بی‌صدای به PI عبور کند.
- احراز هویت: احراز هویت سرور برنامه Codex از ورود اشتراک محلی Codex. smokeهای Docker
  همچنین می‌توانند در صورت کاربرد، برای کاوش‌های غیر Codex مقدار `OPENAI_API_KEY` را ارائه کنند،
  به‌همراه کپی اختیاری `~/.codex/auth.json` و `~/.codex/config.toml`.

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
- این اجراکننده `~/.profile` mount شده را source می‌کند، `OPENAI_API_KEY` را عبور می‌دهد، در صورت وجود فایل‌های احراز هویت CLI مربوط به Codex را کپی می‌کند، `@openai/codex` را در یک prefix قابل نوشتن npm که mount شده نصب می‌کند، درخت منبع را stage می‌کند، سپس فقط آزمایش زنده harness Codex را اجرا می‌کند.
- Docker کاوش‌های تصویر، MCP/tool، و Guardian را به‌صورت پیش‌فرض فعال می‌کند. وقتی به اجرای اشکال‌زدایی محدودتری نیاز دارید، `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` یا
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` را تنظیم کنید.
- Docker همچنین `OPENCLAW_AGENT_HARNESS_FALLBACK=none` را export می‌کند که با پیکربندی آزمایش زنده همخوان است، تا aliasهای قدیمی یا fallback به PI نتوانند رگرسیون harness Codex را پنهان کنند.

### دستورهای زنده پیشنهادی

allowlistهای محدود و صریح سریع‌ترین و کم‌نوسان‌ترین گزینه‌اند:

- مدل تکی، مستقیم (بدون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- مدل تکی، smoke از طریق Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فراخوانی ابزار در چند ارائه‌دهنده:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تمرکز Google (کلید API مربوط به Gemini + Antigravity):
  - Gemini (کلید API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke تفکر تطبیقی Google:
  - اگر کلیدهای محلی در پروفایل shell قرار دارند: `source ~/.profile`
  - پیش‌فرض پویا Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - بودجه پویای Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

یادداشت‌ها:

- `google/...` از API مربوط به Gemini استفاده می‌کند (کلید API).
- `google-antigravity/...` از پل OAuth مربوط به Antigravity استفاده می‌کند (endpoint عامل به سبک Cloud Code Assist).
- `google-gemini-cli/...` از CLI محلی Gemini روی ماشین شما استفاده می‌کند (احراز هویت جداگانه + جزئیات خاص ابزار).
- Gemini API در برابر Gemini CLI:
  - API: OpenClaw API میزبانی‌شده Gemini متعلق به Google را از طریق HTTP فراخوانی می‌کند (کلید API / احراز هویت پروفایل)؛ این همان چیزی است که بیشتر کاربران از «Gemini» منظور دارند.
  - CLI: OpenClaw به یک binary محلی `gemini` shell out می‌کند؛ احراز هویت خودش را دارد و می‌تواند رفتار متفاوتی داشته باشد (پشتیبانی streaming/tool/اختلاف نسخه).

## زنده: ماتریس مدل (آنچه پوشش می‌دهیم)

هیچ «فهرست مدل CI» ثابتی وجود ندارد (زنده opt-in است)، اما این‌ها مدل‌های **پیشنهادی** برای پوشش منظم روی ماشین توسعه با کلیدها هستند.

### مجموعه smoke مدرن (فراخوانی ابزار + تصویر)

این اجرای «مدل‌های رایج» است که انتظار داریم همچنان کار کند:

- OpenAI (غیر Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و `google/gemini-3-flash-preview` (از مدل‌های قدیمی‌تر Gemini 2.x پرهیز کنید)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

اجرای smoke Gateway با ابزارها + تصویر:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط مبنا: فراخوانی ابزار (Read + Exec اختیاری)

از هر خانواده ارائه‌دهنده دست‌کم یکی را انتخاب کنید:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (یا `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

پوشش اضافی اختیاری (خوب است داشته باشید):

- xAI: `xai/grok-4` (یا جدیدترین گزینه موجود)
- Mistral: `mistral/`… (یک مدل توانمند برای «ابزارها» که فعال کرده‌اید انتخاب کنید)
- Cerebras: `cerebras/`… (اگر دسترسی دارید)
- LM Studio: `lmstudio/`… (محلی؛ فراخوانی ابزار به حالت API بستگی دارد)

### بینایی: ارسال تصویر (پیوست → پیام چندوجهی)

دست‌کم یک مدل دارای قابلیت تصویر را در `OPENCLAW_LIVE_GATEWAY_MODELS` بگنجانید (گونه‌های دارای قابلیت بینایی Claude/Gemini/OpenAI و غیره) تا کاوش تصویر اجرا شود.

### تجمیع‌کننده‌ها / Gatewayهای جایگزین

اگر کلیدها را فعال کرده‌اید، از آزمایش از طریق موارد زیر نیز پشتیبانی می‌کنیم:

- OpenRouter: `openrouter/...` (صدها مدل؛ برای یافتن نامزدهای دارای قابلیت ابزار+تصویر از `openclaw models scan` استفاده کنید)
- OpenCode: `opencode/...` برای Zen و `opencode-go/...` برای Go (احراز هویت از طریق `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ارائه‌دهنده‌های بیشتری که می‌توانید در ماتریس زنده بگنجانید (اگر credentials/config دارید):

- داخلی: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- از طریق `models.providers` (endpointهای سفارشی): `minimax` (cloud/API)، به‌علاوه هر proxy سازگار با OpenAI/Anthropic (LM Studio، vLLM، LiteLLM، و غیره)

<Tip>
«همه مدل‌ها» را در مستندات hardcode نکنید. فهرست معتبر همان چیزی است که `discoverModels(...)` روی ماشین شما برمی‌گرداند، به‌علاوه هر کلیدی که در دسترس است.
</Tip>

## Credentials (هرگز commit نکنید)

آزمایش‌های زنده credentials را به همان روشی کشف می‌کنند که CLI انجام می‌دهد. پیامدهای عملی:

- اگر CLI کار کند، آزمون‌های زنده باید همان کلیدها را پیدا کنند.
- اگر یک آزمون زنده بگوید «اعتبارنامه‌ای نیست»، آن را همان‌طور اشکال‌زدایی کنید که `openclaw models list` / انتخاب مدل را اشکال‌زدایی می‌کنید.

- پروفایل‌های احراز هویت هر عامل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (منظور از «کلیدهای پروفایل» در آزمون‌های زنده همین است)
- پیکربندی: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- پوشه وضعیت قدیمی: `~/.openclaw/credentials/` (در صورت وجود، به خانه زنده مرحله‌بندی‌شده کپی می‌شود، اما محل اصلی نگهداری کلیدهای پروفایل نیست)
- اجراهای زنده محلی به‌صورت پیش‌فرض پیکربندی فعال، فایل‌های `auth-profiles.json` هر عامل، `credentials/` قدیمی، و پوشه‌های احراز هویت CLI خارجی پشتیبانی‌شده را به یک خانه آزمون موقت کپی می‌کنند؛ خانه‌های زنده مرحله‌بندی‌شده از `workspace/` و `sandboxes/` صرف‌نظر می‌کنند، و بازنویسی‌های مسیر `agents.*.workspace` / `agentDir` حذف می‌شوند تا کاوش‌ها از فضای کاری واقعی میزبان شما دور بمانند.

اگر می‌خواهید به کلیدهای محیطی تکیه کنید (برای مثال خروجی‌گرفته‌شده در `~/.profile`)، آزمون‌های محلی را پس از `source ~/.profile` اجرا کنید، یا از اجراکننده‌های Docker زیر استفاده کنید (آن‌ها می‌توانند `~/.profile` را داخل کانتینر mount کنند).

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
  - مسیرهای تصویر، ویدئو، و `music_generate` بسته‌بندی‌شده comfy را اجرا می‌کند
  - هر قابلیت را رد می‌کند مگر اینکه `plugins.entries.comfy.config.<capability>` پیکربندی شده باشد
  - پس از تغییر ارسال گردش‌کار comfy، polling، دانلودها، یا ثبت Plugin مفید است

## زنده تولید تصویر

- آزمون: `test/image-generation.runtime.live.test.ts`
- فرمان: `pnpm test:live test/image-generation.runtime.live.test.ts`
- چارچوب اجرا: `pnpm test:live:media image`
- دامنه:
  - هر Plugin ارائه‌دهنده ثبت‌شده تولید تصویر را فهرست می‌کند
  - متغیرهای محیطی ارائه‌دهنده‌های جاافتاده را پیش از کاوش، از پوسته ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌صورت پیش‌فرض کلیدهای API زنده/محیطی را پیش از پروفایل‌های احراز هویت ذخیره‌شده به کار می‌برد، بنابراین کلیدهای آزمون قدیمی در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نمی‌کنند
  - ارائه‌دهنده‌های بدون احراز هویت/پروفایل/مدل قابل استفاده را رد می‌کند
  - هر ارائه‌دهنده پیکربندی‌شده را از مسیر زمان‌اجرای مشترک تولید تصویر عبور می‌دهد:
    - `<provider>:generate`
    - `<provider>:edit` وقتی ارائه‌دهنده پشتیبانی ویرایش را اعلام کرده باشد
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از محل نگهداری پروفایل و نادیده گرفتن بازنویسی‌های فقط محیطی

برای مسیر CLI ارسال‌شده، پس از موفقیت آزمون زنده ارائه‌دهنده/زمان‌اجرا، یک smoke با `infer` اضافه کنید:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

این مورد parsing آرگومان‌های CLI، resolve شدن پیکربندی/عامل پیش‌فرض، فعال‌سازی Plugin بسته‌بندی‌شده، تعمیر وابستگی‌های زمان‌اجرای بسته‌بندی‌شده در زمان نیاز، زمان‌اجرای مشترک تولید تصویر، و درخواست زنده ارائه‌دهنده را پوشش می‌دهد.

## زنده تولید موسیقی

- آزمون: `extensions/music-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- چارچوب اجرا: `pnpm test:live:media music`
- دامنه:
  - مسیر مشترک ارائه‌دهنده بسته‌بندی‌شده تولید موسیقی را اجرا می‌کند
  - در حال حاضر Google و MiniMax را پوشش می‌دهد
  - متغیرهای محیطی ارائه‌دهنده را پیش از کاوش، از پوسته ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌صورت پیش‌فرض کلیدهای API زنده/محیطی را پیش از پروفایل‌های احراز هویت ذخیره‌شده به کار می‌برد، بنابراین کلیدهای آزمون قدیمی در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نمی‌کنند
  - ارائه‌دهنده‌های بدون احراز هویت/پروفایل/مدل قابل استفاده را رد می‌کند
  - هر دو حالت زمان‌اجرای اعلام‌شده را در صورت وجود اجرا می‌کند:
    - `generate` با ورودی فقط prompt
    - `edit` وقتی ارائه‌دهنده `capabilities.edit.enabled` را اعلام کرده باشد
  - پوشش فعلی مسیر مشترک:
    - `google`: `generate`، `edit`
    - `minimax`: `generate`
    - `comfy`: فایل زنده جداگانه Comfy، نه این sweep مشترک
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از محل نگهداری پروفایل و نادیده گرفتن بازنویسی‌های فقط محیطی

## زنده تولید ویدئو

- آزمون: `extensions/video-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- چارچوب اجرا: `pnpm test:live:media video`
- دامنه:
  - مسیر مشترک ارائه‌دهنده بسته‌بندی‌شده تولید ویدئو را اجرا می‌کند
  - به‌صورت پیش‌فرض مسیر smoke مناسب انتشار را به کار می‌برد: ارائه‌دهنده‌های غیر FAL، یک درخواست متن به ویدئو برای هر ارائه‌دهنده، prompt یک‌ثانیه‌ای lobster، و یک سقف عملیات برای هر ارائه‌دهنده از `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (به‌صورت پیش‌فرض `180000`)
  - به‌صورت پیش‌فرض FAL را رد می‌کند، چون latency صف سمت ارائه‌دهنده می‌تواند زمان انتشار را غالب کند؛ برای اجرای صریح آن `--video-providers fal` یا `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` را پاس دهید
  - متغیرهای محیطی ارائه‌دهنده را پیش از کاوش، از پوسته ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌صورت پیش‌فرض کلیدهای API زنده/محیطی را پیش از پروفایل‌های احراز هویت ذخیره‌شده به کار می‌برد، بنابراین کلیدهای آزمون قدیمی در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نمی‌کنند
  - ارائه‌دهنده‌های بدون احراز هویت/پروفایل/مدل قابل استفاده را رد می‌کند
  - به‌صورت پیش‌فرض فقط `generate` را اجرا می‌کند
  - برای اجرای حالت‌های تبدیل اعلام‌شده در صورت وجود، `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید:
    - `imageToVideo` وقتی ارائه‌دهنده `capabilities.imageToVideo.enabled` را اعلام کرده باشد و ارائه‌دهنده/مدل انتخاب‌شده در sweep مشترک ورودی تصویر محلی با پشتوانه buffer را بپذیرد
    - `videoToVideo` وقتی ارائه‌دهنده `capabilities.videoToVideo.enabled` را اعلام کرده باشد و ارائه‌دهنده/مدل انتخاب‌شده در sweep مشترک ورودی ویدئوی محلی با پشتوانه buffer را بپذیرد
  - ارائه‌دهنده‌های `imageToVideo` اعلام‌شده اما ردشده فعلی در sweep مشترک:
    - `vydra` چون `veo3` بسته‌بندی‌شده فقط متنی است و `kling` بسته‌بندی‌شده به URL تصویر راه‌دور نیاز دارد
  - پوشش Vydra مخصوص ارائه‌دهنده:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - آن فایل متن به ویدئو `veo3` به‌علاوه یک مسیر `kling` را اجرا می‌کند که به‌صورت پیش‌فرض از fixture URL تصویر راه‌دور استفاده می‌کند
  - پوشش زنده فعلی `videoToVideo`:
    - فقط `runway` وقتی مدل انتخاب‌شده `runway/gen4_aleph` باشد
  - ارائه‌دهنده‌های `videoToVideo` اعلام‌شده اما ردشده فعلی در sweep مشترک:
    - `alibaba`، `qwen`، `xai` چون آن مسیرها فعلاً به URLهای مرجع راه‌دور `http(s)` / MP4 نیاز دارند
    - `google` چون مسیر مشترک فعلی Gemini/Veo از ورودی محلی با پشتوانه buffer استفاده می‌کند و آن مسیر در sweep مشترک پذیرفته نمی‌شود
    - `openai` چون مسیر مشترک فعلی تضمین‌های دسترسی inpaint/remix ویدئوی مخصوص سازمان را ندارد
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` برای گنجاندن همه ارائه‌دهنده‌ها در sweep پیش‌فرض، از جمله FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` برای کاهش سقف عملیات هر ارائه‌دهنده در یک اجرای smoke تهاجمی
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از محل نگهداری پروفایل و نادیده گرفتن بازنویسی‌های فقط محیطی

## چارچوب اجرای زنده رسانه

- فرمان: `pnpm test:live:media`
- هدف:
  - مجموعه‌های زنده مشترک تصویر، موسیقی، و ویدئو را از طریق یک entrypoint بومی repo اجرا می‌کند
  - متغیرهای محیطی ارائه‌دهنده جاافتاده را به‌طور خودکار از `~/.profile` بارگذاری می‌کند
  - به‌صورت پیش‌فرض هر مجموعه را به ارائه‌دهنده‌هایی که در حال حاضر احراز هویت قابل استفاده دارند محدود می‌کند
  - از `scripts/test-live.mjs` دوباره استفاده می‌کند، بنابراین رفتار Heartbeat و حالت quiet ثابت می‌ماند
- نمونه‌ها:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مرتبط

- [آزمون](/fa/help/testing) — مجموعه‌های واحد، یکپارچه‌سازی، QA، و Docker
