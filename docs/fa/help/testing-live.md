---
read_when:
    - اجرای آزمون‌های دود ماتریس مدل‌های زنده / پشتانه CLI / ACP / ارائه‌دهنده رسانه
    - اشکال‌زدایی از شناسایی اعتبارنامه‌های آزمون زنده
    - افزودن یک آزمون زندهٔ ویژهٔ ارائه‌دهنده
sidebarTitle: Live tests
summary: 'آزمون‌های زنده (در تماس با شبکه): ماتریس مدل، بک‌اندهای CLI، ACP، ارائه‌دهندگان رسانه، اعتبارنامه‌ها'
title: 'آزمایش: مجموعه‌های آزمون زنده'
x-i18n:
    generated_at: "2026-05-03T11:37:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4057d8875fa3404108e89e4381c1dd14e96abbc2af13c4934fc6c0dbf878fc00
    source_path: help/testing-live.md
    workflow: 16
---

برای شروع سریع، اجراکننده‌های QA، مجموعه‌های واحد/یکپارچه‌سازی، و جریان‌های Docker، به
[آزمایش](/fa/help/testing) مراجعه کنید. این صفحه مجموعه‌آزمون‌های **زنده** (درگیر با شبکه) را پوشش می‌دهد:
ماتریس مدل، پشت‌صحنه‌های CLI، ACP، و آزمون‌های زنده ارائه‌دهنده رسانه، به‌همراه
مدیریت اعتبارنامه‌ها.

## زنده: دستورهای آزمون دود پروفایل محلی

پیش از بررسی‌های زنده موردی، `~/.profile` را source کنید تا کلیدهای ارائه‌دهنده و مسیرهای ابزار محلی
با شل شما هم‌خوان باشند:

```bash
source ~/.profile
```

آزمون دود امن رسانه:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

آزمون دود امن آمادگی تماس صوتی:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` یک اجرای خشک است مگر اینکه `--yes` نیز حضور داشته باشد. از `--yes` فقط
وقتی استفاده کنید که عمدا می‌خواهید یک تماس اعلان واقعی برقرار کنید. برای Twilio، Telnyx، و
Plivo، بررسی آمادگی موفق به URL عمومی Webhook نیاز دارد؛ جایگزین‌های حلقه‌بازگشت/خصوصی فقط‌محلی
طبق طراحی رد می‌شوند.

## زنده: پیمایش قابلیت Node اندروید

- آزمون: `src/gateway/android-node.capabilities.live.test.ts`
- اسکریپت: `pnpm android:test:integration`
- هدف: فراخوانی **هر دستوری که در حال حاضر** توسط یک Node اندروید متصل اعلام می‌شود و بررسی رفتار قرارداد دستور.
- دامنه:
  - راه‌اندازی پیش‌شرط‌دار/دستی (این مجموعه برنامه را نصب/اجرا/جفت‌سازی نمی‌کند).
  - اعتبارسنجی `node.invoke` در Gateway به‌صورت دستوربه‌دستور برای Node اندروید انتخاب‌شده.
- پیش‌راه‌اندازی لازم:
  - برنامه اندروید از قبل به Gateway متصل و با آن جفت شده باشد.
  - برنامه در پیش‌زمینه نگه داشته شود.
  - مجوزها/رضایت ضبط برای قابلیت‌هایی که انتظار دارید موفق شوند اعطا شده باشد.
- بازنویسی‌های اختیاری هدف:
  - `OPENCLAW_ANDROID_NODE_ID` یا `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- جزئیات کامل راه‌اندازی اندروید: [برنامه اندروید](/fa/platforms/android)

## زنده: آزمون دود مدل (کلیدهای پروفایل)

آزمون‌های زنده به دو لایه تقسیم شده‌اند تا بتوانیم خرابی‌ها را جدا کنیم:

- «مدل مستقیم» به ما می‌گوید ارائه‌دهنده/مدل اصلا می‌تواند با کلید داده‌شده پاسخ دهد یا نه.
- «آزمون دود Gateway» به ما می‌گوید کل خط لوله Gateway+عامل برای آن مدل کار می‌کند (نشست‌ها، تاریخچه، ابزارها، سیاست sandbox، و غیره).

### لایه ۱: تکمیل مستقیم مدل (بدون Gateway)

- آزمون: `src/agents/models.profiles.live.test.ts`
- هدف:
  - شمارش مدل‌های کشف‌شده
  - استفاده از `getApiKeyForModel` برای انتخاب مدل‌هایی که برایشان اعتبارنامه دارید
  - اجرای یک تکمیل کوچک برای هر مدل (و رگرسیون‌های هدفمند در صورت نیاز)
- شیوه فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- `OPENCLAW_LIVE_MODELS=modern` (یا `all`، نام مستعار modern) را تنظیم کنید تا این مجموعه واقعا اجرا شود؛ در غیر این صورت برای تمرکز `pnpm test:live` بر آزمون دود Gateway، رد می‌شود
- شیوه انتخاب مدل‌ها:
  - `OPENCLAW_LIVE_MODELS=modern` برای اجرای فهرست مجاز مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` نام مستعار فهرست مجاز مدرن است
  - یا `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (فهرست مجاز جداشده با ویرگول)
  - پیمایش‌های modern/all به‌طور پیش‌فرض از یک سقف گزینش‌شده با سیگنال بالا استفاده می‌کنند؛ برای پیمایش مدرن کامل `OPENCLAW_LIVE_MAX_MODELS=0` یا برای سقف کوچک‌تر یک عدد مثبت تنظیم کنید.
  - پیمایش‌های کامل از `OPENCLAW_LIVE_TEST_TIMEOUT_MS` برای مهلت زمانی کل آزمون مدل مستقیم استفاده می‌کنند. پیش‌فرض: ۶۰ دقیقه.
  - بررسی‌های مدل مستقیم به‌طور پیش‌فرض با موازی‌سازی ۲۰تایی اجرا می‌شوند؛ برای بازنویسی، `OPENCLAW_LIVE_MODEL_CONCURRENCY` را تنظیم کنید.
- شیوه انتخاب ارائه‌دهنده‌ها:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (فهرست مجاز جداشده با ویرگول)
- کلیدها از کجا می‌آیند:
  - به‌طور پیش‌فرض: ذخیره‌گاه پروفایل و جایگزین‌های env
  - برای الزام فقط به **ذخیره‌گاه پروفایل**، `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` را تنظیم کنید
- دلیل وجود این بخش:
  - «API ارائه‌دهنده خراب است / کلید نامعتبر است» را از «خط لوله عامل Gateway خراب است» جدا می‌کند
  - رگرسیون‌های کوچک و ایزوله را در بر دارد (مثال: بازپخش reasoning در OpenAI Responses/Codex Responses + جریان‌های فراخوانی ابزار)

### لایه ۲: آزمون دود Gateway + عامل dev (کاری که "@openclaw" واقعا انجام می‌دهد)

- آزمون: `src/gateway/gateway-models.profiles.live.test.ts`
- هدف:
  - بالا آوردن یک Gateway درون‌فرآیندی
  - ساخت/وصله‌کردن یک نشست `agent:dev:*` (بازنویسی مدل در هر اجرا)
  - پیمایش مدل‌های دارای کلید و بررسی:
    - پاسخ «معنادار» (بدون ابزار)
    - یک فراخوانی ابزار واقعی کار می‌کند (بررسی خواندن)
    - بررسی‌های اختیاری ابزار اضافی (بررسی exec+read)
    - مسیرهای رگرسیون OpenAI (فقط فراخوانی ابزار → پیگیری) همچنان کار می‌کنند
- جزئیات بررسی (تا بتوانید خرابی‌ها را سریع توضیح دهید):
  - بررسی `read`: آزمون یک فایل nonce در فضای کاری می‌نویسد و از عامل می‌خواهد آن را `read` کند و nonce را برگرداند.
  - بررسی `exec+read`: آزمون از عامل می‌خواهد با `exec` یک nonce را در یک فایل موقت بنویسد، سپس آن را با `read` برگرداند.
  - بررسی تصویر: آزمون یک PNG تولیدشده (گربه + کد تصادفی) را پیوست می‌کند و انتظار دارد مدل `cat <CODE>` را برگرداند.
  - مرجع پیاده‌سازی: `src/gateway/gateway-models.profiles.live.test.ts` و `src/gateway/live-image-probe.ts`.
- شیوه فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
- شیوه انتخاب مدل‌ها:
  - پیش‌فرض: فهرست مجاز مدرن (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` نام مستعار فهرست مجاز مدرن است
  - یا برای محدودسازی، `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (یا فهرست جداشده با ویرگول) را تنظیم کنید
  - پیمایش‌های Gateway در حالت modern/all به‌طور پیش‌فرض از یک سقف گزینش‌شده با سیگنال بالا استفاده می‌کنند؛ برای پیمایش مدرن کامل `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` یا برای سقف کوچک‌تر یک عدد مثبت تنظیم کنید.
- شیوه انتخاب ارائه‌دهنده‌ها (برای پرهیز از «همه‌چیز OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (فهرست مجاز جداشده با ویرگول)
- بررسی‌های ابزار + تصویر همیشه در این آزمون زنده فعال‌اند:
  - بررسی `read` + بررسی `exec+read` (فشار ابزار)
  - بررسی تصویر وقتی اجرا می‌شود که مدل پشتیبانی از ورودی تصویر را اعلام کند
  - جریان (در سطح بالا):
    - آزمون یک PNG کوچک با “CAT” + کد تصادفی تولید می‌کند (`src/gateway/live-image-probe.ts`)
    - آن را از طریق `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` می‌فرستد
    - Gateway پیوست‌ها را به `images[]` تجزیه می‌کند (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - عامل تعبیه‌شده یک پیام کاربر چندوجهی را به مدل ارسال می‌کند
    - بررسی: پاسخ شامل `cat` + کد باشد (تحمل OCR: خطاهای جزئی مجازند)

<Tip>
برای دیدن اینکه روی دستگاهتان چه چیزهایی را می‌توانید آزمایش کنید (و شناسه‌های دقیق `provider/model`)، اجرا کنید:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## زنده: آزمون دود پشت‌صحنه CLI (Claude، Codex، Gemini، یا CLIهای محلی دیگر)

- آزمون: `src/gateway/gateway-cli-backend.live.test.ts`
- هدف: اعتبارسنجی خط لوله Gateway + عامل با استفاده از یک پشت‌صحنه CLI محلی، بدون دست‌زدن به پیکربندی پیش‌فرض شما.
- پیش‌فرض‌های آزمون دود مختص هر پشت‌صحنه همراه با تعریف `cli-backend.ts` در Plugin مالک آن قرار دارند.
- فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` اگر Vitest را مستقیم فراخوانی می‌کنید)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- پیش‌فرض‌ها:
  - ارائه‌دهنده/مدل پیش‌فرض: `claude-cli/claude-sonnet-4-6`
  - رفتار دستور/آرگومان‌ها/تصویر از فراداده Plugin پشت‌صحنه CLI مالک می‌آید.
- بازنویسی‌ها (اختیاری):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` برای ارسال یک پیوست تصویر واقعی (مسیرها در prompt تزریق می‌شوند). دستورالعمل‌های Docker این مورد را به‌طور پیش‌فرض خاموش می‌گذارند مگر اینکه صریحا درخواست شود.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` برای پاس‌دادن مسیرهای فایل تصویر به‌عنوان آرگومان‌های CLI به‌جای تزریق در prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (یا `"list"`) برای کنترل شیوه پاس‌دادن آرگومان‌های تصویر وقتی `IMAGE_ARG` تنظیم شده است.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` برای ارسال نوبت دوم و اعتبارسنجی جریان ازسرگیری.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` برای فعال‌کردن اختیاری بررسی تداوم همان‌نشست Claude Sonnet -> Opus وقتی مدل انتخاب‌شده از هدف تعویض پشتیبانی می‌کند. دستورالعمل‌های Docker برای قابلیت اتکای تجمیعی، این مورد را به‌طور پیش‌فرض خاموش می‌گذارند.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` برای فعال‌کردن اختیاری بررسی حلقه‌بازگشت MCP/ابزار. دستورالعمل‌های Docker این مورد را به‌طور پیش‌فرض خاموش می‌گذارند مگر اینکه صریحا درخواست شود.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

آزمون دود ارزان پیکربندی MCP برای Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

این از Gemini نمی‌خواهد پاسخی تولید کند. همان تنظیمات سامانه‌ای را که OpenClaw به Gemini می‌دهد
می‌نویسد، سپس `gemini --debug mcp list` را اجرا می‌کند تا ثابت کند یک سرور ذخیره‌شده با
`transport: "streamable-http"` به شکل HTTP MCP در Gemini نرمال‌سازی می‌شود
و می‌تواند به یک سرور محلی streamable-HTTP MCP متصل شود.

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

نکته‌ها:

- اجراکننده Docker در `scripts/test-live-cli-backend-docker.sh` قرار دارد.
- آزمون دود زنده پشت‌صحنه CLI را داخل تصویر Docker مخزن، به‌عنوان کاربر غیرریشه `node` اجرا می‌کند.
- فراداده آزمون دود CLI را از افزونه مالک حل می‌کند، سپس بسته CLI لینوکس متناظر (`@anthropic-ai/claude-code`، `@openai/codex`، یا `@google/gemini-cli`) را در یک پیشوند قابل‌نوشتن cache‌شده در `OPENCLAW_DOCKER_CLI_TOOLS_DIR` نصب می‌کند (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` به OAuth قابل‌حمل اشتراک Claude Code نیاز دارد، از طریق `~/.claude/.credentials.json` با `claudeAiOauth.subscriptionType` یا `CLAUDE_CODE_OAUTH_TOKEN` از `claude setup-token`. ابتدا اجرای مستقیم `claude -p` در Docker را ثابت می‌کند، سپس دو نوبت پشت‌صحنه CLI در Gateway را بدون حفظ متغیرهای env کلید API Anthropic اجرا می‌کند. این مسیر اشتراک، بررسی‌های MCP/ابزار و تصویر Claude را به‌طور پیش‌فرض غیرفعال می‌کند، چون Claude در حال حاضر استفاده برنامه‌های شخص ثالث را به‌جای محدودیت‌های عادی طرح اشتراک، از مسیر صورت‌حساب مصرف اضافی عبور می‌دهد.
- آزمون دود زنده پشت‌صحنه CLI اکنون همان جریان سرتاسری را برای Claude، Codex، و Gemini تمرین می‌کند: نوبت متنی، نوبت طبقه‌بندی تصویر، سپس فراخوانی ابزار MCP `cron` که از طریق CLI Gateway تأیید می‌شود.
- آزمون دود پیش‌فرض Claude همچنین نشست را از Sonnet به Opus وصله می‌کند و بررسی می‌کند نشست ازسرگرفته‌شده همچنان یک یادداشت قبلی را به خاطر دارد.

## زنده: آزمون دود bind در ACP (`/acp spawn ... --bind here`)

- آزمون: `src/gateway/gateway-acp-bind.live.test.ts`
- هدف: اعتبارسنجی جریان واقعی bind کردن گفت‌وگوی ACP با یک عامل زنده ACP:
  - ارسال `/acp spawn <agent> --bind here`
  - bind کردن یک گفت‌وگوی مصنوعی کانال پیام در همان‌جا
  - ارسال یک پیگیری عادی در همان گفت‌وگو
  - تأیید اینکه پیگیری در transcript نشست ACP bind‌شده قرار می‌گیرد
- فعال‌سازی:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- پیش‌فرض‌ها:
  - عامل‌های ACP در Docker: `claude,codex,gemini`
  - عامل ACP برای اجرای مستقیم `pnpm test:live ...`: `claude`
  - کانال مصنوعی: بافت گفت‌وگوی سبک DM در Slack
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
  - این lane از سطح `chat.send` در gateway همراه با فیلدهای synthetic originating-route فقط مخصوص ادمین استفاده می‌کند تا آزمون‌ها بتوانند بافت کانال پیام را بدون تظاهر به تحویل بیرونی متصل کنند.
  - وقتی `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` تنظیم نشده باشد، آزمون از registry داخلی عامل در Plugin تعبیه‌شده `acpx` برای عامل انتخاب‌شده harness مربوط به ACP استفاده می‌کند.
  - ایجاد MCP کران نشست bind‌شده به‌طور پیش‌فرض best-effort است، چون harnessهای بیرونی ACP می‌توانند پس از عبور اثبات bind/image فراخوانی‌های MCP را لغو کنند؛ برای سخت‌گیرانه کردن این probe کران پس از bind، `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` را تنظیم کنید.

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

دستورهای Docker تک‌عامله:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

یادداشت‌های Docker:

- runner مربوط به Docker در `scripts/test-live-acp-bind-docker.sh` قرار دارد.
- به‌طور پیش‌فرض، smoke مربوط به bind در ACP را به‌ترتیب در برابر عامل‌های live CLI تجمیعی اجرا می‌کند: `claude`، `codex`، سپس `gemini`.
- برای محدود کردن matrix از `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` یا `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` استفاده کنید.
- این runner فایل `~/.profile` را source می‌کند، material احراز هویت CLI متناظر را در container آماده می‌کند، سپس در صورت نبودن CLI زنده درخواستی (`@anthropic-ai/claude-code`، `@openai/codex`، Factory Droid از طریق `https://app.factory.ai/cli`، `@google/gemini-cli` یا `opencode-ai`) آن را نصب می‌کند. backend خود ACP بسته تعبیه‌شده `acpx/runtime` از Plugin رسمی `acpx` است.
- نسخه Docker مربوط به Droid برای تنظیمات، `~/.factory` را آماده می‌کند، `FACTORY_API_KEY` را forward می‌کند و به آن API key نیاز دارد، چون احراز هویت محلی Factory با OAuth/keyring به container قابل‌انتقال نیست. این نسخه از entry داخلی `droid exec --output-format acp` در registry مربوط به ACPX استفاده می‌کند.
- نسخه Docker مربوط به OpenCode یک lane رگرسیون سخت‌گیرانه تک‌عامله است. پس از source کردن `~/.profile`، یک مدل پیش‌فرض موقت `OPENCODE_CONFIG_CONTENT` را از `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (پیش‌فرض `opencode/kimi-k2.6`) می‌نویسد، و `pnpm test:docker:live-acp-bind:opencode` به‌جای پذیرش skip عمومی پس از bind، به یک transcript دستیار bind‌شده نیاز دارد.
- فراخوانی‌های مستقیم CLI مربوط به `acpx` فقط مسیر دستی/راه‌حل موقت برای مقایسه رفتار بیرون از Gateway هستند. smoke مربوط به bind در Docker ACP، backend runtime تعبیه‌شده `acpx` در OpenClaw را تمرین می‌دهد.

## زنده: smoke مربوط به harness سرور برنامه Codex

- هدف: اعتبارسنجی harness متعلق به Plugin برای Codex از طریق متد عادی `agent` در gateway:
  - بارگذاری Plugin همراه `codex`
  - انتخاب `OPENCLAW_AGENT_RUNTIME=codex`
  - ارسال اولین نوبت عامل gateway به `openai/gpt-5.5` با اجبار harness مربوط به Codex
  - ارسال نوبت دوم به همان نشست OpenClaw و تأیید اینکه thread سرور برنامه می‌تواند resume شود
  - اجرای `/codex status` و `/codex models` از طریق همان مسیر فرمان gateway
  - اجرای اختیاری دو probe shell ارتقایافته بازبینی‌شده توسط Guardian: یک فرمان بی‌ضرر که باید تأیید شود و یک بارگذاری fake-secret که باید رد شود تا عامل دوباره سؤال کند
- آزمون: `src/gateway/gateway-codex-harness.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- مدل پیش‌فرض: `openai/gpt-5.5`
- probe اختیاری تصویر: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- probe اختیاری MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- probe اختیاری Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- این smoke از `agentRuntime.id: "codex"` استفاده می‌کند تا harness خراب Codex نتواند با fallback بی‌صدا به PI عبور کند.
- احراز هویت: احراز هویت سرور برنامه Codex از login اشتراک محلی Codex. smokeهای Docker همچنین می‌توانند در صورت کاربرد، برای probeهای غیر Codex، `OPENAI_API_KEY` را به‌همراه `~/.codex/auth.json` و `~/.codex/config.toml` کپی‌شده اختیاری ارائه کنند.

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

- runner مربوط به Docker در `scripts/test-live-codex-harness-docker.sh` قرار دارد.
- این runner فایل mounted `~/.profile` را source می‌کند، `OPENAI_API_KEY` را پاس می‌دهد، فایل‌های احراز هویت Codex CLI را در صورت وجود کپی می‌کند، `@openai/codex` را در یک prefix قابل‌نوشتن mounted برای npm نصب می‌کند، source tree را آماده می‌کند، سپس فقط آزمون زنده harness مربوط به Codex را اجرا می‌کند.
- Docker به‌طور پیش‌فرض probeهای image، MCP/tool و Guardian را فعال می‌کند. وقتی به اجرای debug محدودتری نیاز دارید، `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` یا `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` یا `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` را تنظیم کنید.
- Docker از همان پیکربندی صریح runtime مربوط به Codex استفاده می‌کند، بنابراین aliasهای legacy یا fallback به PI نمی‌توانند رگرسیون harness مربوط به Codex را پنهان کنند.

### دستورهای زنده پیشنهادی

allowlistهای محدود و صریح سریع‌ترین و کم‌ناپایدارترین گزینه‌ها هستند:

- مدل تکی، مستقیم (بدون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- مدل تکی، smoke مربوط به gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فراخوانی ابزار در چند provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تمرکز Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke مربوط به adaptive thinking در Google:
  - اگر کلیدهای محلی در shell profile هستند: `source ~/.profile`
  - پیش‌فرض dynamic در Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - budget پویا در Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

یادداشت‌ها:

- `google/...` از Gemini API استفاده می‌کند (API key).
- `google-antigravity/...` از پل OAuth مربوط به Antigravity استفاده می‌کند (endpoint عامل به سبک Cloud Code Assist).
- `google-gemini-cli/...` از Gemini CLI محلی روی دستگاه شما استفاده می‌کند (احراز هویت جداگانه + ویژگی‌های خاص tooling).
- مقایسه Gemini API و Gemini CLI:
  - API: OpenClaw از طریق HTTP با Gemini API میزبانی‌شده Google تماس می‌گیرد (احراز هویت API key / profile)؛ این همان چیزی است که بیشتر کاربران از «Gemini» منظور دارند.
  - CLI: OpenClaw به یک باینری محلی `gemini` shell out می‌کند؛ این مسیر احراز هویت خودش را دارد و می‌تواند رفتار متفاوتی داشته باشد (پشتیبانی streaming/tool/اختلاف نسخه).

## زنده: matrix مدل‌ها (آنچه پوشش می‌دهیم)

هیچ «فهرست مدل CI» ثابتی وجود ندارد (زنده opt-in است)، اما این‌ها مدل‌های **پیشنهادی** برای پوشش منظم روی دستگاه توسعه با کلیدها هستند.

### مجموعه smoke مدرن (فراخوانی ابزار + تصویر)

این اجرای «مدل‌های رایج» است که انتظار داریم فعال بماند:

- OpenAI (غیر Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و `google/gemini-3-flash-preview` (از مدل‌های قدیمی‌تر Gemini 2.x پرهیز کنید)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

اجرای smoke مربوط به gateway با ابزارها + تصویر:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط پایه: فراخوانی ابزار (Read + Exec اختیاری)

از هر خانواده provider حداقل یکی را انتخاب کنید:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (یا `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (یا `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

پوشش اضافی اختیاری (خوب است داشته باشید):

- xAI: `xai/grok-4.3` (یا آخرین مورد در دسترس)
- Mistral: `mistral/`… (یک مدل توانمند برای «tools» که فعال دارید انتخاب کنید)
- Cerebras: `cerebras/`… (اگر دسترسی دارید)
- LM Studio: `lmstudio/`… (محلی؛ فراخوانی ابزار به حالت API بستگی دارد)

### Vision: ارسال تصویر (attachment → پیام multimodal)

برای تمرین probe تصویر، حداقل یک مدل image-capable را در `OPENCLAW_LIVE_GATEWAY_MODELS` بگنجانید (گونه‌های vision-capable مربوط به Claude/Gemini/OpenAI و غیره).

### aggregatorها / gatewayهای جایگزین

اگر کلیدها را فعال کرده‌اید، ما همچنین از آزمون از طریق این‌ها پشتیبانی می‌کنیم:

- OpenRouter: `openrouter/...` (صدها مدل؛ برای یافتن candidateهای tool+image capable از `openclaw models scan` استفاده کنید)
- OpenCode: `opencode/...` برای Zen و `opencode-go/...` برای Go (احراز هویت از طریق `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

providerهای بیشتری که می‌توانید در matrix زنده بگنجانید (اگر credential/config دارید):

- داخلی: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- از طریق `models.providers` (endpointهای سفارشی): `minimax` (cloud/API)، به‌علاوه هر proxy سازگار با OpenAI/Anthropic (LM Studio، vLLM، LiteLLM و غیره)

<Tip>
«all models» را در docs هاردکد نکنید. فهرست معتبر همان چیزی است که `discoverModels(...)` روی دستگاه شما برمی‌گرداند، به‌علاوه هر کلیدی که در دسترس است.
</Tip>

## credentialها (هرگز commit نکنید)

آزمون‌های زنده credentialها را همان‌طور کشف می‌کنند که CLI انجام می‌دهد. پیامدهای عملی:

- اگر CLI کار کند، آزمون‌های زنده باید همان کلیدها را پیدا کنند.
- اگر یک آزمون زنده بگوید «هیچ اعتبارنامه‌ای نیست»، همان‌طور اشکال‌زدایی کنید که `openclaw models list` / انتخاب مدل را اشکال‌زدایی می‌کنید.

- نمایه‌های احراز هویت به‌ازای هر عامل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (منظور از «کلیدهای نمایه» در آزمون‌های زنده همین است)
- پیکربندی: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- دایرکتوری وضعیت قدیمی: `~/.openclaw/credentials/` (در صورت وجود، به خانه زنده مرحله‌بندی‌شده کپی می‌شود، اما مخزن اصلی کلیدهای نمایه نیست)
- اجراهای محلی زنده به‌طور پیش‌فرض پیکربندی فعال، فایل‌های `auth-profiles.json` به‌ازای هر عامل، `credentials/` قدیمی، و دایرکتوری‌های احراز هویت CLI خارجی پشتیبانی‌شده را در یک خانه آزمون موقت کپی می‌کنند؛ خانه‌های زنده مرحله‌بندی‌شده از `workspace/` و `sandboxes/` صرف‌نظر می‌کنند، و بازنویسی‌های مسیر `agents.*.workspace` / `agentDir` حذف می‌شوند تا کاوش‌ها از فضای کاری واقعی میزبان شما دور بمانند.

اگر می‌خواهید به کلیدهای محیطی تکیه کنید (مثلاً موارد صادرشده در `~/.profile`)، آزمون‌های محلی را پس از `source ~/.profile` اجرا کنید، یا از اجراکننده‌های Docker زیر استفاده کنید (آن‌ها می‌توانند `~/.profile` را در کانتینر mount کنند).

## اجرای زنده Deepgram (رونویسی صوتی)

- آزمون: `extensions/deepgram/audio.live.test.ts`
- فعال‌سازی: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## اجرای زنده برنامه کدنویسی BytePlus

- آزمون: `extensions/byteplus/live.test.ts`
- فعال‌سازی: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- بازنویسی اختیاری مدل: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## اجرای زنده رسانه گردش‌کار ComfyUI

- آزمون: `extensions/comfy/comfy.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- دامنه:
  - مسیرهای تصویر، ویدئو، و `music_generate` بسته‌بندی‌شده comfy را تمرین می‌کند
  - هر قابلیت را رد می‌کند مگر اینکه `plugins.entries.comfy.config.<capability>` پیکربندی شده باشد
  - پس از تغییر در ارسال گردش‌کار comfy، polling، دانلودها، یا ثبت Plugin مفید است

## اجرای زنده تولید تصویر

- آزمون: `test/image-generation.runtime.live.test.ts`
- فرمان: `pnpm test:live test/image-generation.runtime.live.test.ts`
- سازوکار آزمون: `pnpm test:live:media image`
- دامنه:
  - همه Pluginهای ارائه‌دهنده تولید تصویر ثبت‌شده را فهرست می‌کند
  - متغیرهای محیطی ارائه‌دهنده‌های مفقود را پیش از کاوش از پوسته ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض از کلیدهای API زنده/محیطی پیش از نمایه‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نکنند
  - ارائه‌دهنده‌هایی را که احراز هویت/نمایه/مدل قابل استفاده ندارند رد می‌کند
  - هر ارائه‌دهنده پیکربندی‌شده را از مسیر زمان‌اجرای مشترک تولید تصویر عبور می‌دهد:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از مخزن نمایه و نادیده گرفتن بازنویسی‌های صرفاً محیطی

برای مسیر CLI منتشرشده، پس از موفقیت آزمون زنده ارائه‌دهنده/زمان‌اجرا، یک smoke با `infer` اضافه کنید:

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
Plugin بسته‌بندی‌شده، زمان‌اجرای مشترک تولید تصویر، و درخواست زنده ارائه‌دهنده را پوشش می‌دهد.
انتظار می‌رود وابستگی‌های Plugin پیش از بارگذاری زمان‌اجرا حاضر باشند.

## اجرای زنده تولید موسیقی

- آزمون: `extensions/music-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- سازوکار آزمون: `pnpm test:live:media music`
- دامنه:
  - مسیر مشترک ارائه‌دهنده تولید موسیقی بسته‌بندی‌شده را تمرین می‌کند
  - در حال حاضر Google و MiniMax را پوشش می‌دهد
  - متغیرهای محیطی ارائه‌دهنده را پیش از کاوش از پوسته ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض از کلیدهای API زنده/محیطی پیش از نمایه‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نکنند
  - ارائه‌دهنده‌هایی را که احراز هویت/نمایه/مدل قابل استفاده ندارند رد می‌کند
  - هر دو حالت زمان‌اجرای اعلام‌شده را در صورت وجود اجرا می‌کند:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از مخزن نمایه و نادیده گرفتن بازنویسی‌های صرفاً محیطی

## اجرای زنده تولید ویدئو

- آزمون: `extensions/video-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- سازوکار آزمون: `pnpm test:live:media video`
- دامنه:
  - مسیر مشترک ارائه‌دهنده تولید ویدئوی بسته‌بندی‌شده را تمرین می‌کند
  - به‌طور پیش‌فرض از مسیر smoke ایمن برای انتشار استفاده می‌کند: ارائه‌دهنده‌های غیر FAL، یک درخواست متن‌به‌ویدئو برای هر ارائه‌دهنده، prompt یک‌ثانیه‌ای خرچنگ، و سقف عملیات به‌ازای هر ارائه‌دهنده از `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` به‌طور پیش‌فرض)
  - به‌طور پیش‌فرض FAL را رد می‌کند چون تأخیر صف سمت ارائه‌دهنده می‌تواند زمان انتشار را غالب کند؛ برای اجرای صریح آن `--video-providers fal` یا `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` را ارسال کنید
  - متغیرهای محیطی ارائه‌دهنده را پیش از کاوش از پوسته ورود شما (`~/.profile`) بارگذاری می‌کند
  - به‌طور پیش‌فرض از کلیدهای API زنده/محیطی پیش از نمایه‌های احراز هویت ذخیره‌شده استفاده می‌کند، تا کلیدهای آزمون کهنه در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نکنند
  - ارائه‌دهنده‌هایی را که احراز هویت/نمایه/مدل قابل استفاده ندارند رد می‌کند
  - به‌طور پیش‌فرض فقط `generate` را اجرا می‌کند
  - برای اجرای حالت‌های تبدیل اعلام‌شده در صورت وجود نیز `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید:
    - `imageToVideo` وقتی ارائه‌دهنده `capabilities.imageToVideo.enabled` را اعلام کند و ارائه‌دهنده/مدل انتخاب‌شده ورودی تصویر محلی پشتیبانی‌شده با buffer را در sweep مشترک بپذیرد
    - `videoToVideo` وقتی ارائه‌دهنده `capabilities.videoToVideo.enabled` را اعلام کند و ارائه‌دهنده/مدل انتخاب‌شده ورودی ویدئوی محلی پشتیبانی‌شده با buffer را در sweep مشترک بپذیرد
  - ارائه‌دهنده‌های `imageToVideo` اعلام‌شده اما ردشده فعلی در sweep مشترک:
    - `vydra` چون `veo3` بسته‌بندی‌شده فقط متنی است و `kling` بسته‌بندی‌شده به URL تصویر راه‌دور نیاز دارد
  - پوشش ویژه ارائه‌دهنده Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - آن فایل، متن‌به‌ویدئوی `veo3` را به‌همراه یک مسیر `kling` اجرا می‌کند که به‌طور پیش‌فرض از fixture URL تصویر راه‌دور استفاده می‌کند
  - پوشش زنده فعلی `videoToVideo`:
    - `runway` فقط وقتی مدل انتخاب‌شده `runway/gen4_aleph` باشد
  - ارائه‌دهنده‌های `videoToVideo` اعلام‌شده اما ردشده فعلی در sweep مشترک:
    - `alibaba`، `qwen`، `xai` چون آن مسیرها در حال حاضر به URLهای مرجع راه‌دور `http(s)` / MP4 نیاز دارند
    - `google` چون مسیر مشترک فعلی Gemini/Veo از ورودی محلی پشتیبانی‌شده با buffer استفاده می‌کند و آن مسیر در sweep مشترک پذیرفته نمی‌شود
    - `openai` چون مسیر مشترک فعلی تضمین دسترسی سازمان‌محور به inpaint/remix ویدئو را ندارد
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` برای شامل کردن همه ارائه‌دهنده‌ها در sweep پیش‌فرض، از جمله FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` برای کاهش سقف هر عملیات ارائه‌دهنده در یک اجرای smoke تهاجمی
- رفتار اختیاری احراز هویت:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اجبار احراز هویت از مخزن نمایه و نادیده گرفتن بازنویسی‌های صرفاً محیطی

## سازوکار آزمون زنده رسانه

- فرمان: `pnpm test:live:media`
- هدف:
  - مجموعه‌های زنده مشترک تصویر، موسیقی، و ویدئو را از طریق یک نقطه ورود بومی repo اجرا می‌کند
  - متغیرهای محیطی ارائه‌دهنده‌های مفقود را از `~/.profile` به‌طور خودکار بارگذاری می‌کند
  - به‌طور پیش‌فرض هر مجموعه را به ارائه‌دهنده‌هایی محدود می‌کند که در حال حاضر احراز هویت قابل استفاده دارند
  - از `scripts/test-live.mjs` دوباره استفاده می‌کند، بنابراین رفتار Heartbeat و حالت بی‌صدا سازگار می‌ماند
- مثال‌ها:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مرتبط

- [آزمون](/fa/help/testing) — مجموعه‌های واحد، یکپارچه‌سازی، QA، و Docker
