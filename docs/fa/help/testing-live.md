---
read_when:
    - اجرای آزمون‌های دودِ زنده برای ماتریس مدل / بک‌اند CLI / ACP / ارائه‌دهندهٔ رسانه
    - اشکال‌زداییِ تشخیص اعتبارنامه‌های آزمون زنده
    - افزودن یک آزمون زنده جدید ویژه ارائه‌دهنده
sidebarTitle: Live tests
summary: 'آزمون‌های زنده (با دسترسی به شبکه): ماتریس مدل‌ها، بک‌اندهای CLI، ACP، ارائه‌دهندگان رسانه و اطلاعات احراز هویت'
title: 'آزمایش: مجموعه‌های زنده'
x-i18n:
    generated_at: "2026-07-12T10:12:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

برای شروع سریع، اجراکننده‌های تضمین کیفیت، مجموعه‌آزمون‌های واحد/یکپارچه‌سازی و جریان‌های Docker، به
[آزمایش](/fa/help/testing) مراجعه کنید. این صفحه آزمون‌های **زنده** (دارای تعامل با شبکه) را پوشش می‌دهد:
ماتریس مدل، بک‌اندهای CLI، ACP، ارائه‌دهندگان رسانه و مدیریت اعتبارنامه‌ها.

## زنده: فرمان‌های بررسی سریع محلی

پیش از بررسی‌های زنده موردی، کلید ارائه‌دهنده موردنیاز را در محیط فرایند صادر کنید.

بررسی سریع و ایمن رسانه:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

بررسی سریع و ایمن آمادگی تماس صوتی:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` اجرای آزمایشی است، مگر اینکه `--yes` نیز وجود داشته باشد؛ تنها زمانی از `--yes` استفاده کنید
که قصد برقراری یک تماس واقعی را دارید. برای Twilio، Telnyx و Plivo،
بررسی موفق آمادگی به یک نشانی Webhook عمومی نیاز دارد؛ نشانی‌های local loopback/خصوصی
رد می‌شوند، زیرا این ارائه‌دهندگان نمی‌توانند به آن‌ها دسترسی پیدا کنند.

## زنده: پیمایش قابلیت‌های Node اندروید

- آزمون: `src/gateway/android-node.capabilities.live.test.ts`
- اسکریپت: `pnpm android:test:integration`
- هدف: فراخوانی **تمام فرمان‌هایی که در حال حاضر اعلام می‌شوند** توسط یک Node اندروید متصل و تأیید رفتار قرارداد فرمان.
- دامنه:
  - راه‌اندازی دستی/دارای پیش‌شرط (این مجموعه، برنامه را نصب/اجرا/جفت نمی‌کند).
  - اعتبارسنجی `node.invoke` در Gateway، فرمان‌به‌فرمان، برای Node اندروید انتخاب‌شده.
- پیش‌نیازهای راه‌اندازی:
  - برنامه اندروید از قبل به Gateway متصل و با آن جفت شده باشد.
  - برنامه در پیش‌زمینه نگه داشته شود.
  - مجوزها/رضایت ضبط برای قابلیت‌هایی که انتظار دارید موفق شوند، اعطا شده باشد.
- بازنویسی‌های اختیاری هدف:
  - `OPENCLAW_ANDROID_NODE_ID` یا `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- جزئیات کامل راه‌اندازی اندروید: [برنامه اندروید](/fa/platforms/android)

## زنده: بررسی سریع مدل (کلیدهای نمایه)

آزمون‌های زنده مدل به دو لایه تقسیم شده‌اند تا خرابی‌ها از یکدیگر جدا شوند:

- «مدل مستقیم» مشخص می‌کند که آیا ارائه‌دهنده/مدل با کلید داده‌شده اساساً می‌تواند پاسخ دهد.
- «بررسی سریع Gateway» مشخص می‌کند که آیا خط لوله کامل Gateway+عامل برای آن مدل کار می‌کند یا نه (نشست‌ها، تاریخچه، ابزارها، خط‌مشی محیط ایزوله و غیره).

فهرست‌های گزینش‌شده مدل در ادامه، در `src/agents/live-model-filter.ts` قرار دارند و
به‌مرور زمان تغییر می‌کنند؛ آرایه‌های آن فایل را منبع حقیقت بدانید، نه این
صفحه را.

MiniMax M3 از `minimax/MiniMax-M3` به‌عنوان ارجاع پیش‌فرض ارائه‌دهنده/مدل خود استفاده می‌کند.

### لایه ۱: تکمیل مستقیم مدل (بدون Gateway)

- آزمون: `src/agents/models.profiles.live.test.ts`
- هدف:
  - فهرست‌کردن مدل‌های کشف‌شده
  - استفاده از `getApiKeyForModel` برای انتخاب مدل‌هایی که اعتبارنامه آن‌ها را دارید
  - اجرای یک تکمیل کوچک برای هر مدل (و آزمون‌های رگرسیون هدفمند در صورت نیاز)
- نحوه فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` در صورت فراخوانی مستقیم Vitest)
  - برای اجرای واقعی این مجموعه، `OPENCLAW_LIVE_MODELS=modern`، `small` یا `all` (نام مستعار `modern`) را تنظیم کنید؛ در غیر این صورت رد می‌شود تا اجرای مستقل `pnpm test:live` همچنان بر بررسی سریع Gateway متمرکز بماند.
- نحوه انتخاب مدل‌ها:
  - `OPENCLAW_LIVE_MODELS=modern` فهرست اولویت گزینش‌شده با سیگنال بالا را اجرا می‌کند (به [زنده: ماتریس مدل](#live-model-matrix-what-we-cover) مراجعه کنید)
  - `OPENCLAW_LIVE_MODELS=small` فهرست اولویت گزینش‌شده مدل‌های کوچک را اجرا می‌کند
  - `OPENCLAW_LIVE_MODELS=all` نام مستعار `modern` است
  - یا `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (فهرست مجاز جداشده با ویرگول)
  - اجرای محلی مدل‌های کوچک Ollama به‌طور پیش‌فرض از `http://127.0.0.1:11434` استفاده می‌کند؛ `OPENCLAW_LIVE_OLLAMA_BASE_URL` را فقط برای نقاط پایانی شبکه محلی، سفارشی یا Ollama Cloud تنظیم کنید.
  - پیمایش‌های modern/all و small به‌طور پیش‌فرض طول فهرست گزینش‌شده خود را به‌عنوان سقف در نظر می‌گیرند؛ برای پیمایش کامل نمایه‌های انتخاب‌شده، `OPENCLAW_LIVE_MAX_MODELS=0` یا برای سقفی کوچک‌تر یک عدد مثبت تنظیم کنید.
  - پیمایش‌های کامل برای مهلت زمانی کل آزمون مدل مستقیم از `OPENCLAW_LIVE_TEST_TIMEOUT_MS` استفاده می‌کنند. پیش‌فرض: ۶۰ دقیقه.
  - کاوش‌های مدل مستقیم به‌طور پیش‌فرض با موازی‌سازی ۲۰تایی اجرا می‌شوند؛ برای بازنویسی، `OPENCLAW_LIVE_MODEL_CONCURRENCY` را تنظیم کنید.
- نحوه انتخاب ارائه‌دهندگان:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (فهرست مجاز جداشده با ویرگول)
- محل دریافت کلیدها:
  - به‌طور پیش‌فرض: مخزن نمایه و جایگزین‌های محیطی
  - برای الزام استفاده **فقط از مخزن نمایه**، `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` را تنظیم کنید
- دلیل وجود این آزمون:
  - «API ارائه‌دهنده خراب است / کلید نامعتبر است» را از «خط لوله عامل Gateway خراب است» جدا می‌کند
  - شامل آزمون‌های رگرسیون کوچک و مجزا است (نمونه: بازپخش استدلال OpenAI Responses/Codex Responses و جریان‌های فراخوانی ابزار)

### لایه ۲: بررسی سریع Gateway + عامل توسعه (آنچه «@openclaw» واقعاً انجام می‌دهد)

- آزمون: `src/gateway/gateway-models.profiles.live.test.ts`
- هدف:
  - راه‌اندازی یک Gateway درون‌فرایندی
  - ایجاد/وصله‌کردن یک نشست `agent:dev:*` (بازنویسی مدل در هر اجرا)
  - پیمایش مدل‌های دارای کلید و تأیید موارد زیر:
    - پاسخ «معنادار» (بدون ابزار)
    - کارکرد یک فراخوانی واقعی ابزار (کاوش خواندن)
    - کاوش‌های اضافی و اختیاری ابزار (کاوش اجرا+خواندن)
    - ادامه کار مسیرهای رگرسیون OpenAI (فقط فراخوانی ابزار ← پیگیری)
- جزئیات کاوش‌ها (برای توضیح سریع خرابی‌ها):
  - کاوش `read`: آزمون یک فایل نانس در فضای کاری می‌نویسد و از عامل می‌خواهد آن را با `read` بخواند و نانس را بازتاب دهد.
  - کاوش `exec+read`: آزمون از عامل می‌خواهد با `exec` یک نانس را در فایلی موقت بنویسد و سپس آن را با `read` بازخوانی کند.
  - کاوش تصویر: آزمون یک PNG تولیدشده (گربه + کد تصادفی) را پیوست می‌کند و انتظار دارد مدل `cat <CODE>` را برگرداند.
  - ارجاع پیاده‌سازی: `src/gateway/gateway-models.profiles.live.test.ts` و `test/helpers/live-image-probe.ts`.
- نحوه فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` در صورت فراخوانی مستقیم Vitest)
- نحوه انتخاب مدل‌ها:
  - پیش‌فرض: فهرست اولویت گزینش‌شده با سیگنال بالا (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` فهرست گزینش‌شده مدل‌های کوچک را از خط لوله کامل Gateway+عامل عبور می‌دهد
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` نام مستعار `modern` است
  - یا برای محدودکردن، `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (یا فهرستی جداشده با ویرگول) را تنظیم کنید
  - پیمایش‌های modern/all و small در Gateway به‌طور پیش‌فرض طول فهرست گزینش‌شده خود را به‌عنوان سقف در نظر می‌گیرند؛ برای پیمایش کامل موارد انتخاب‌شده، `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` یا برای سقفی کوچک‌تر یک عدد مثبت تنظیم کنید.
- نحوه انتخاب ارائه‌دهندگان (برای جلوگیری از «همه‌چیز از OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (فهرست مجاز جداشده با ویرگول)
- کاوش‌های ابزار و تصویر در این آزمون زنده همیشه فعال‌اند:
  - کاوش `read` + کاوش `exec+read` (فشار ابزار)
  - کاوش تصویر زمانی اجرا می‌شود که مدل پشتیبانی از ورودی تصویر را اعلام کند
  - جریان (در سطح کلی):
    - آزمون یک PNG کوچک با «CAT» + کد تصادفی تولید می‌کند (`test/helpers/live-image-probe.ts`)
    - آن را از طریق `agent` و `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ارسال می‌کند
    - Gateway پیوست‌ها را به `images[]` تجزیه می‌کند (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - عامل تعبیه‌شده یک پیام چندوجهی کاربر را به مدل ارسال می‌کند
    - تأیید: پاسخ شامل `cat` + کد است (با اغماض OCR: خطاهای جزئی مجازند)

<Tip>
برای مشاهده مواردی که می‌توانید روی دستگاه خود آزمایش کنید (و شناسه‌های دقیق `provider/model`)، اجرا کنید:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## زنده: بررسی سریع بک‌اند CLI (Claude، Gemini یا دیگر CLIهای محلی)

- آزمون: `src/gateway/gateway-cli-backend.live.test.ts`
- هدف: اعتبارسنجی خط لوله Gateway + عامل با استفاده از یک بک‌اند CLI محلی، بدون دست‌زدن به پیکربندی پیش‌فرض شما.
- پیش‌فرض‌های بررسی سریع مختص هر بک‌اند، در تعریف `cli-backend.ts` متعلق به Plugin مالک قرار دارند.
- فعال‌سازی:
  - `pnpm test:live` (یا `OPENCLAW_LIVE_TEST=1` در صورت فراخوانی مستقیم Vitest)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- پیش‌فرض‌ها:
  - ارائه‌دهنده/مدل پیش‌فرض: `claude-cli/claude-sonnet-4-6`
  - رفتار فرمان/آرگومان‌ها/تصویر از فراداده Plugin مالک بک‌اند CLI دریافت می‌شود.
- بازنویسی‌ها (اختیاری):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` برای ارسال یک پیوست تصویری واقعی (مسیرها به پرامپت تزریق می‌شوند). در دستورالعمل‌های Docker به‌طور پیش‌فرض غیرفعال است.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` برای ارسال مسیر فایل‌های تصویر به‌عنوان آرگومان‌های CLI، به‌جای تزریق در پرامپت.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (یا `"list"`) برای کنترل نحوه ارسال آرگومان‌های تصویر هنگام تنظیم `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` برای ارسال نوبت دوم و اعتبارسنجی جریان ازسرگیری.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` برای فعال‌سازی اختیاری کاوش پیوستگی همان نشست از Claude Sonnet به Opus، هنگامی که مدل انتخاب‌شده از هدف تغییر پشتیبانی می‌کند. به‌طور پیش‌فرض، از جمله در دستورالعمل‌های Docker، غیرفعال است.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` برای فعال‌سازی اختیاری کاوش local loopback ابزار/MCP. در دستورالعمل‌های Docker به‌طور پیش‌فرض غیرفعال است.

نمونه:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

بررسی سریع و کم‌هزینه پیکربندی MCP در Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

این کار از Gemini نمی‌خواهد پاسخی تولید کند. همان تنظیمات سیستمی را که OpenClaw
به Gemini می‌دهد می‌نویسد، سپس `gemini --debug mcp list` را اجرا می‌کند تا ثابت کند
یک سرور ذخیره‌شده با `transport: "streamable-http"` به قالب HTTP MCP در Gemini
نرمال‌سازی می‌شود و می‌تواند به یک سرور محلی MCP با HTTP جریانی متصل شود.

دستورالعمل Docker:

```bash
pnpm test:docker:live-cli-backend
```

دستورالعمل‌های Docker تک‌ارائه‌دهنده:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

نکات:

- اجراکننده Docker در `scripts/test-live-cli-backend-docker.sh` قرار دارد.
- بررسی سریع زنده بک‌اند CLI را درون تصویر Docker مخزن، با کاربر غیرریشه `node` اجرا می‌کند.
- فراداده بررسی سریع CLI را از Plugin مالک استخراج می‌کند، سپس بسته CLI متناظر لینوکس (`@anthropic-ai/claude-code` یا `@google/gemini-cli`) را در پیشوند قابل‌نوشتن و کش‌شده در `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) نصب می‌کند.
- `codex-cli` دیگر بک‌اند CLI همراه‌شده نیست؛ در عوض از `openai/*` با زمان‌اجرای کارساز برنامه Codex استفاده کنید (به [زنده: بررسی سریع هارنس کارساز برنامه Codex](#live-codex-app-server-harness-smoke) مراجعه کنید).
- `pnpm test:docker:live-cli-backend:claude-subscription` به OAuth قابل‌حمل اشتراک Claude Code، از طریق `~/.claude/.credentials.json` با `claudeAiOauth.subscriptionType` یا `CLAUDE_CODE_OAUTH_TOKEN` حاصل از `claude setup-token` نیاز دارد. ابتدا اجرای مستقیم `claude -p` را در Docker اثبات می‌کند، سپس دو نوبت بک‌اند CLI در Gateway را بدون حفظ متغیرهای محیطی کلید API Anthropic اجرا می‌کند. این مسیر اشتراک، کاوش‌های ابزار/MCP و تصویر Claude را به‌طور پیش‌فرض غیرفعال می‌کند، زیرا محدودیت‌های مصرف اشتراک واردشده را مصرف می‌کند و Anthropic می‌تواند رفتار صورتحساب و محدودیت نرخ Claude Agent SDK / `claude -p` را بدون انتشار نسخه‌ای از OpenClaw تغییر دهد.
- Claude و Gemini از طریق پرچم‌های بالا از مجموعه کاوش یکسانی (نوبت متنی، طبقه‌بندی تصویر، فراخوانی ابزار `cron` در MCP، پیوستگی تغییر مدل) پشتیبانی می‌کنند، اما هیچ‌یک از این کاوش‌ها به‌طور پیش‌فرض اجرا نمی‌شوند؛ در صورت نیاز هرکدام را با پرچم مربوطه فعال کنید.

## زنده: دسترس‌پذیری پراکسی HTTP/2 برای APNs

- آزمون: `src/infra/push-apns-http2.live.test.ts`
- هدف: ایجاد تونل از طریق یک پراکسی محلی HTTP CONNECT به نقطه پایانی آزمایشی APNs اپل، ارسال درخواست اعتبارسنجی HTTP/2 در APNs و تأیید اینکه پاسخ واقعی `403 InvalidProviderToken` اپل از مسیر پراکسی بازمی‌گردد.
- فعال‌سازی:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- مهلت زمانی اختیاری:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## زنده: بررسی سریع اتصال ACP (`/acp spawn ... --bind here`)

- آزمون: `src/gateway/gateway-acp-bind.live.test.ts`
- هدف: اعتبارسنجی جریان واقعی اتصال مکالمه ACP با یک عامل زنده ACP:
  - ارسال `/acp spawn <agent> --bind here`
  - اتصال درجا به یک مکالمه مصنوعی کانال پیام
  - ارسال یک پیام پیگیری عادی در همان مکالمه
  - تأیید اینکه پیام پیگیری در رونوشت نشست ACP متصل ثبت می‌شود
- فعال‌سازی:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- پیش‌فرض‌ها:
  - عامل‌های ACP در Docker: `claude,codex,gemini`
  - عامل ACP برای اجرای مستقیم `pnpm test:live ...`: `claude`
  - کانال مصنوعی: زمینه مکالمه به سبک پیام خصوصی Slack
  - پشتیبان ACP: `acpx`
- بازنویسی‌ها:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (یا `on`/`true`/`yes`) برای اجبار به فعال‌بودن کاوش تصویر؛ هر مقدار دیگری آن را به‌اجبار غیرفعال می‌کند. به‌طور پیش‌فرض برای همه عامل‌ها به‌جز `opencode` اجرا می‌شود.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- نکات:
  - این مسیر از سطح `chat.send` در Gateway همراه با فیلدهای مصنوعی مسیر مبدأ که فقط برای مدیر در دسترس‌اند استفاده می‌کند تا آزمون‌ها بتوانند بدون تظاهر به تحویل خارجی، زمینه کانال پیام را پیوست کنند.
  - وقتی `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` تنظیم نشده باشد، آزمون از رجیستری داخلی عامل در Plugin تعبیه‌شده `acpx` برای عامل مهار آزمون ACP انتخاب‌شده استفاده می‌کند.
  - ایجاد Cron MCP برای نشست متصل، به‌طور پیش‌فرض بر مبنای بهترین تلاش است، زیرا مهارهای آزمون خارجی ACP ممکن است پس از موفقیت اثبات اتصال/تصویر، فراخوانی‌های MCP را لغو کنند؛ برای سخت‌گیرانه‌کردن این کاوش Cron پس از اتصال، `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` را تنظیم کنید.

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

نکات Docker:

- اجراکننده Docker در `scripts/test-live-acp-bind-docker.sh` قرار دارد.
- به‌طور پیش‌فرض، آزمون دود اتصال ACP را به‌ترتیب در برابر عامل‌های زنده تجمیعی CLI اجرا می‌کند: ابتدا `claude`، سپس `codex` و بعد `gemini`.
- برای محدودکردن ماتریس، از `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`، `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` یا `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` استفاده کنید.
- داده‌های احراز هویت CLI منطبق را در کانتینر قرار می‌دهد، سپس اگر CLI زنده درخواستی موجود نباشد، آن را نصب می‌کند (`@anthropic-ai/claude-code`، `@openai/codex`، Factory Droid از طریق `https://app.factory.ai/cli`، `@google/gemini-cli` یا `opencode-ai`). خود پشتیبان ACP، بسته تعبیه‌شده `acpx/runtime` از Plugin رسمی `acpx` است.
- گونه Docker مربوط به Droid، مسیر `~/.factory` را برای تنظیمات در کانتینر قرار می‌دهد، `FACTORY_API_KEY` را منتقل می‌کند و به این کلید API نیاز دارد، زیرا احراز هویت محلی OAuth/جاکلیدی Factory قابل انتقال به کانتینر نیست. این گونه از ورودی رجیستری داخلی `droid exec --output-format acp` در ACPX استفاده می‌کند.
- گونه Docker مربوط به OpenCode یک مسیر سخت‌گیرانه رگرسیون تک‌عاملی است. این گونه، مدل پیش‌فرض موقت `OPENCODE_CONFIG_CONTENT` را از `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` می‌نویسد (پیش‌فرض `opencode/kimi-k2.6`).
- فراخوانی‌های مستقیم CLI مربوط به `acpx` فقط مسیری دستی/راهکار موقت برای مقایسه رفتار خارج از Gateway هستند. آزمون دود اتصال ACP در Docker، پشتیبان زمان‌اجرای تعبیه‌شده `acpx` در OpenClaw را آزمایش می‌کند.

## زنده: آزمون دود مهار app-server مربوط به Codex

- هدف: اعتبارسنجی مهار Codex تحت مالکیت Plugin از طریق متد عادی `agent` در Gateway:
  - بارگذاری Plugin همراه `codex`
  - انتخاب یک مدل OpenAI از طریق `/model <ref> --runtime codex`
  - ارسال نخستین نوبت عامل در Gateway با سطح تفکر درخواستی
  - ارسال نوبت دوم به همان نشست OpenClaw و تأیید اینکه رشته app-server می‌تواند از سر گرفته شود
  - اجرای `/codex status` و `/codex models` از طریق همان مسیر فرمان Gateway
  - اجرای اختیاری دو کاوش پوسته‌ای ارتقایافته با بازبینی Guardian: یک فرمان بی‌خطر که باید تأیید شود و یک بارگذاری حاوی راز جعلی که باید رد شود تا عامل پرسش تکمیلی مطرح کند
- آزمون: `src/gateway/gateway-codex-harness.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- مدل مبنای مهار: `openai/gpt-5.6-luna`
- پیش‌فرض انتخاب با کلید API تازه OpenAI: `openai/gpt-5.6`
- تفکر پیش‌فرض: `low`
- بازنویسی مدل: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- بازنویسی تفکر: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- بازنویسی ماتریس: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- حالت احراز هویت: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (پیش‌فرض) از ورود کپی‌شده Codex استفاده می‌کند؛ `api-key` از `OPENAI_API_KEY` از طریق app-server مربوط به Codex استفاده می‌کند.
- کاوش اختیاری تصویر: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- کاوش اختیاری MCP/ابزار: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- کاوش اختیاری Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- آزمون دود، مقدار `agentRuntime.id: "codex"` را برای ارائه‌دهنده/مدل اجباری می‌کند تا مهار خراب Codex نتواند با بازگشت خاموش به OpenClaw موفق شود.
- احراز هویت: احراز هویت app-server مربوط به Codex از ورود محلی اشتراک Codex، یا `OPENAI_API_KEY` وقتی `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` باشد. Docker می‌تواند برای اجراهای اشتراکی، `~/.codex/auth.json` و `~/.codex/config.toml` را کپی کند.

دستور محلی:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

دستور Docker:

```bash
pnpm test:docker:live-codex-harness
```

ماتریس بومی GPT-5.6 در Codex:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

پیش‌فرض کلید API تازه OpenAI:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

این اثبات، `OPENCLAW_LIVE_GATEWAY_MODELS` را تنظیم‌نشده باقی می‌گذارد، مدل را از طریق درز انتخاب استنتاج در فرایند راه‌اندازی اولیه تازه تعیین می‌کند، `openai/gpt-5.6` را بررسی می‌کند و سپس یک نوبت واقعی Gateway را با مدل تعیین‌شده اجرا می‌کند.

ماتریس GPT-5.6 تعبیه‌شده در OpenClaw:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

نکات Docker:

- اجراکننده Docker در `scripts/test-live-codex-harness-docker.sh` قرار دارد.
- این اجراکننده `OPENAI_API_KEY` را منتقل می‌کند، در صورت وجود فایل‌های احراز هویت CLI مربوط به Codex آن‌ها را کپی می‌کند، `@openai/codex` را در یک پیشوند npm نصب‌شده و قابل‌نوشتن نصب می‌کند، درخت منبع را آماده می‌کند و سپس فقط آزمون زنده مهار Codex را اجرا می‌کند.
- Docker به‌طور پیش‌فرض کاوش‌های تصویر، MCP/ابزار و Guardian را فعال می‌کند. وقتی به اجرای اشکال‌زدایی محدودتری نیاز دارید، `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` یا `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` یا `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` را تنظیم کنید.
- Docker از همان پیکربندی صریح زمان‌اجرای Codex استفاده می‌کند، بنابراین نام‌های مستعار قدیمی یا بازگشت به OpenClaw نمی‌توانند رگرسیون مهار Codex را پنهان کنند.
- هدف‌های ماتریس به‌صورت ترتیبی در یک کانتینر اجرا می‌شوند. اسکریپت Docker مهلت زمانی پیش‌فرض ۳۵ دقیقه‌ای خود را بر اساس تعداد هدف‌ها مقیاس می‌دهد؛ هر مهلت زمانی پوسته بیرونی یا CI باید همین زمان کل را مجاز بداند. CI مرجع، هر هدف GPT-5.6 را در یک بخش جداگانه نگه می‌دارد.

### دستورهای پیشنهادی اجرای زنده

فهرست‌های مجاز محدود و صریح، سریع‌ترین و کم‌نوسان‌ترین گزینه‌اند:

- یک مدل، مستقیم (بدون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- نمایه مستقیم مدل کوچک:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- نمایه Gateway مدل کوچک:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- آزمون دود API ابری Ollama:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- یک مدل، آزمون دود Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فراخوانی ابزار در چند ارائه‌دهنده:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- آزمون دود مستقیم GLM-5.2 در Z.AI Coding Plan:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- تمرکز بر Google (کلید API مربوط به Gemini به‌همراه Antigravity):
  - Gemini (کلید API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- آزمون دود تفکر تطبیقی Google (`qa manual` از CLI خصوصی تضمین کیفیت — به `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` و یک نسخه بررسی‌شده از منبع نیاز دارد؛ [نمای کلی تضمین کیفیت](/fa/concepts/qa-e2e-automation) را ببینید):
  - پیش‌فرض پویای Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - بودجه پویای Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

نکات:

- `google/...` از API مربوط به Gemini استفاده می‌کند (کلید API).
- `google-antigravity/...` از پل OAuth مربوط به Antigravity استفاده می‌کند (نقطه پایانی عامل به سبک Cloud Code Assist).
- `google-gemini-cli/...` از CLI محلی Gemini روی دستگاه شما استفاده می‌کند (احراز هویت جداگانه به‌همراه ویژگی‌های خاص ابزار).
- API مربوط به Gemini در برابر CLI مربوط به Gemini:
  - API: ‏OpenClaw، API میزبانی‌شده Gemini در Google را از طریق HTTP فراخوانی می‌کند (کلید API / احراز هویت نمایه)؛ این همان چیزی است که بیشتر کاربران از «Gemini» منظور دارند.
  - CLI: ‏OpenClaw یک باینری محلی `gemini` را از طریق پوسته اجرا می‌کند؛ این باینری احراز هویت مختص خود را دارد و ممکن است رفتار متفاوتی نشان دهد (پشتیبانی از پخش جریانی/ابزار/ناهم‌ترازی نسخه‌ها).

## زنده: ماتریس مدل (موارد تحت پوشش)

اجرای زنده اختیاری است، بنابراین هیچ «فهرست مدل CI» ثابتی وجود ندارد. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (و نام مستعار `all` برای آن‌ها) فهرست اولویت گزینش‌شده از `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` در `src/agents/live-model-filter.ts` را با این ترتیب اولویت اجرا می‌کنند:

| ارائه‌دهنده/مدل                              | یادداشت‌ها |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

فهرست گزینش‌شدهٔ **مدل‌های کوچک** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`) از `SMALL_LIVE_MODEL_PRIORITY`:

| ارائه‌دهنده/مدل             |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

نکات مربوط به فهرست مدرن:

- ارائه‌دهندگان `codex` و `codex-cli` از پیمایش مدرن پیش‌فرض کنار گذاشته شده‌اند (آن‌ها رفتار بخش پشتی CLI/ACP را پوشش می‌دهند که در بالا جداگانه آزمایش شده است). خود `openai/gpt-5.5` به‌طور پیش‌فرض از طریق چارچوب آزمایشی سرور برنامهٔ Codex مسیریابی می‌شود؛ به [اجرای زنده: آزمون دود چارچوب سرور برنامهٔ Codex](#live-codex-app-server-harness-smoke) مراجعه کنید.
- در پیمایش مدرن، `fireworks`، `google`، `openrouter` و `xai` فقط شناسه‌های مدل صراحتاً گزینش‌شدهٔ خود را اجرا می‌کنند (فهرست به‌صورت خودکار به «تمام مدل‌های این ارائه‌دهنده» گسترش نمی‌یابد).
- برای اجرای کاوش تصویر، دست‌کم یک مدل دارای قابلیت تصویر (گونه‌های بینایی خانواده‌های Claude/Gemini/OpenAI و مانند آن‌ها) را در `OPENCLAW_LIVE_GATEWAY_MODELS` بگنجانید.

آزمون دود Gateway را با ابزارها و تصویر، روی مجموعه‌ای دست‌چین‌شده از چند ارائه‌دهنده اجرا کنید:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

پوشش تکمیلی اختیاری خارج از فهرست‌های گزینش‌شده (داشتن آن مفید است؛ مدلی با قابلیت «ابزارها» که فعال کرده‌اید انتخاب کنید):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (اگر دسترسی دارید)
- LM Studio: `lmstudio/...` (محلی؛ فراخوانی ابزار به حالت API بستگی دارد)

### تجمیع‌کننده‌ها / Gatewayهای جایگزین

اگر کلیدها را فعال کرده‌اید، می‌توانید از این مسیرها نیز آزمایش کنید:

- OpenRouter: `openrouter/...` (صدها مدل؛ برای یافتن گزینه‌های دارای قابلیت ابزار و تصویر از `openclaw models scan` استفاده کنید)
- OpenCode: ‏`opencode/...` برای Zen و `opencode-go/...` برای Go (احراز هویت از طریق `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

ارائه‌دهندگان بیشتری که می‌توانید در ماتریس زنده بگنجانید (اگر اطلاعات احراز هویت/پیکربندی را دارید):

- داخلی: `anthropic`، `cerebras`، `github-copilot`، `google`، `google-antigravity`، `google-gemini-cli`، `google-vertex`، `groq`، `mistral`، `openai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `zai`
- از طریق `models.providers` (نقاط پایانی سفارشی): ‏`minimax` (ابر/API)، به‌علاوهٔ هر پراکسی سازگار با OpenAI/Anthropic ‏(LM Studio، vLLM، LiteLLM و غیره)

<Tip>
«همهٔ مدل‌ها» را در مستندات به‌صورت ثابت کدنویسی نکنید. فهرست معتبر، هر چیزی است که `discoverModels(...)` روی دستگاه شما بازمی‌گرداند، به‌علاوهٔ کلیدهای موجود.
</Tip>

## اطلاعات احراز هویت (هرگز ثبت نکنید)

آزمایش‌های زنده، اطلاعات احراز هویت را به همان روشی کشف می‌کنند که CLI انجام می‌دهد. پیامدهای عملی:

- اگر CLI کار می‌کند، آزمایش‌های زنده نیز باید همان کلیدها را پیدا کنند.
- اگر یک آزمایش زنده پیام «اطلاعات احراز هویت موجود نیست» می‌دهد، آن را به همان روشی اشکال‌زدایی کنید که `openclaw models list` / انتخاب مدل را اشکال‌زدایی می‌کنید.

- نمایه‌های احراز هویت هر عامل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (منظور از «کلیدهای نمایه» در آزمایش‌های زنده همین است)
- پیکربندی: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- پوشهٔ قدیمی OAuth: ‏`~/.openclaw/credentials/` (در صورت وجود، در خانهٔ زندهٔ مرحله‌بندی‌شده کپی می‌شود، اما مخزن اصلی کلیدهای نمایه نیست)
- اجراهای زندهٔ محلی، پیکربندی فعال را (با حذف بازنویسی‌های `agents.*.workspace` / `agentDir`) همراه با فایل `auth-profiles.json` هر عامل کپی می‌کنند؛ بقیهٔ پوشهٔ آن عامل کپی نمی‌شود، بنابراین داده‌های `workspace/` و `sandboxes/` هرگز به خانهٔ مرحله‌بندی‌شده نمی‌رسند. افزون بر این، پوشهٔ قدیمی `credentials/` و فایل‌ها/پوشه‌های احراز هویت پشتیبانی‌شدهٔ CLIهای خارجی (`.claude.json`، `.claude/.credentials.json`، `.claude/settings*.json`، `.claude/backups`، `.codex/auth.json`، `.codex/config.toml`، `.gemini`، `.minimax`) نیز در یک خانهٔ آزمایشی موقت کپی می‌شوند.

اگر می‌خواهید به کلیدهای محیطی تکیه کنید، پیش از آزمایش‌های محلی آن‌ها را صادر کنید یا از
اجراکننده‌های Docker در ادامه، با یک `OPENCLAW_PROFILE_FILE` صریح استفاده کنید.

## اجرای زندهٔ Deepgram (رونویسی صوت)

- آزمایش: `extensions/deepgram/audio.live.test.ts`
- فعال‌سازی: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## اجرای زندهٔ طرح کدنویسی BytePlus

- آزمایش: `extensions/byteplus/live.test.ts`
- فعال‌سازی: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- بازنویسی اختیاری مدل: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## اجرای زندهٔ رسانه در گردش‌کار ComfyUI

- آزمایش: `extensions/comfy/comfy.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- دامنه:
  - مسیرهای داخلی تصویر، ویدئو و `music_generate` در comfy را اجرا می‌کند
  - هر قابلیت را رد می‌کند، مگر اینکه `plugins.entries.comfy.config.<capability>` پیکربندی شده باشد
  - پس از تغییر ارسال گردش‌کار comfy، نظرسنجی، بارگیری‌ها یا ثبت Plugin مفید است

## اجرای زندهٔ تولید تصویر

- آزمایش: `test/image-generation.runtime.live.test.ts`
- فرمان: `pnpm test:live test/image-generation.runtime.live.test.ts`
- چارچوب آزمایشی: `pnpm test:live:media image`
- دامنه:
  - تمام Pluginهای ثبت‌شدهٔ ارائه‌دهندهٔ تولید تصویر را فهرست می‌کند
  - پیش از کاوش، از متغیرهای محیطی ارائه‌دهنده که از قبل صادر شده‌اند استفاده می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/محیطی را مقدم بر نمایه‌های احراز هویت ذخیره‌شده به‌کار می‌گیرد تا کلیدهای آزمایشی منقضی در `auth-profiles.json` اطلاعات احراز هویت واقعی پوسته را پنهان نکنند
  - ارائه‌دهندگانی را که احراز هویت/نمایه/مدل قابل‌استفاده ندارند رد می‌کند
  - هر ارائه‌دهندهٔ پیکربندی‌شده را از طریق زمان اجرای مشترک تولید تصویر اجرا می‌کند:
    - `<provider>:generate`
    - در صورتی که ارائه‌دهنده پشتیبانی از ویرایش را اعلام کند، `<provider>:edit`
- ارائه‌دهندگان داخلی فعلی که پوشش داده می‌شوند:
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
  - برای اجبار احراز هویت از مخزن نمایه و نادیده‌گرفتن بازنویسی‌هایی که فقط در محیط هستند، از `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` استفاده کنید

برای مسیر CLI عرضه‌شده، پس از موفقیت آزمایش زندهٔ ارائه‌دهنده/زمان اجرا، یک آزمون دود `infer` اضافه کنید:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "تصویر آزمایشی تخت و مینیمال: یک مربع آبی روی پس‌زمینهٔ سفید، بدون متن." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

این کار تجزیهٔ آرگومان‌های CLI، رفع پیکربندی/عامل پیش‌فرض، فعال‌سازی
Plugin داخلی، زمان اجرای مشترک تولید تصویر و درخواست زندهٔ ارائه‌دهنده
را پوشش می‌دهد. انتظار می‌رود وابستگی‌های Plugin پیش از بارگذاری زمان اجرا موجود باشند.

## اجرای زندهٔ تولید موسیقی

- آزمایش: `extensions/music-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- چارچوب آزمایشی: `pnpm test:live:media music`
- دامنه:
  - مسیر مشترک و داخلی ارائه‌دهندهٔ تولید موسیقی را اجرا می‌کند
  - در حال حاضر `fal`، `google`، `minimax` و `openrouter` را پوشش می‌دهد
  - پیش از کاوش، از متغیرهای محیطی ارائه‌دهنده که از قبل صادر شده‌اند استفاده می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/محیطی را مقدم بر نمایه‌های احراز هویت ذخیره‌شده به‌کار می‌گیرد تا کلیدهای آزمایشی منقضی در `auth-profiles.json` اطلاعات احراز هویت واقعی پوسته را پنهان نکنند
  - ارائه‌دهندگانی را که احراز هویت/نمایه/مدل قابل‌استفاده ندارند رد می‌کند
  - هر دو حالت زمان اجرای اعلام‌شده را، در صورت موجودبودن، اجرا می‌کند:
    - `generate` با ورودی فقط شامل اعلان
    - در صورتی که ارائه‌دهنده `capabilities.edit.enabled` را اعلام کند، `edit`
  - `comfy` فایل زندهٔ جداگانهٔ خود را دارد و در این پیمایش مشترک نیست
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- رفتار اختیاری احراز هویت:
  - برای اجبار احراز هویت از مخزن نمایه و نادیده‌گرفتن بازنویسی‌هایی که فقط در محیط هستند، از `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` استفاده کنید

## اجرای زندهٔ تولید ویدئو

- آزمون: `extensions/video-generation-providers.live.test.ts`
- فعال‌سازی: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- چارچوب آزمون: `pnpm test:live:media video`
- دامنه:
  - مسیر مشترک ارائه‌دهندگان همراهِ تولید ویدئو را در `alibaba`، `byteplus`، `deepinfra`، `fal`، `google`، `minimax`، `openai`، `openrouter`، `pixverse`، `qwen`، `runway`، `together`، `vydra` و `xai` آزمایش می‌کند
  - به‌طور پیش‌فرض از مسیر آزمون دودِ امن برای انتشار استفاده می‌کند: یک درخواست متن‌به‌ویدئو برای هر ارائه‌دهنده، پرامپت یک‌ثانیه‌ای خرچنگ و سقف زمانی هر عملیات ارائه‌دهنده از `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (به‌طور پیش‌فرض `180000`)
  - به‌طور پیش‌فرض FAL را نادیده می‌گیرد، زیرا تأخیر صف در سمت ارائه‌دهنده ممکن است بر زمان انتشار غالب شود؛ برای اجرای صریح آن، `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` را ارسال کنید (یا فهرست موارد نادیده‌گرفته‌شده را پاک کنید)
  - پیش از کاوش، از متغیرهای محیطی ازپیش‌صادرشدهٔ ارائه‌دهنده استفاده می‌کند
  - به‌طور پیش‌فرض کلیدهای API زنده/محیطی را بر پروفایل‌های احراز هویت ذخیره‌شده مقدم می‌داند تا کلیدهای آزمون منقضی‌شده در `auth-profiles.json` اعتبارنامه‌های واقعی پوسته را پنهان نکنند
  - ارائه‌دهندگانی را که احراز هویت/پروفایل/مدل قابل‌استفاده ندارند، نادیده می‌گیرد
  - به‌طور پیش‌فرض فقط `generate` را اجرا می‌کند
  - برای اجرای حالت‌های تبدیل اعلام‌شده در صورت دسترس‌بودن نیز، `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` را تنظیم کنید:
    - `imageToVideo` هنگامی که ارائه‌دهنده `capabilities.imageToVideo.enabled` را اعلام کرده باشد و ارائه‌دهنده/مدل انتخاب‌شده در پیمایش مشترک، ورودی تصویر محلی مبتنی بر بافر را بپذیرد
    - `videoToVideo` هنگامی که ارائه‌دهنده `capabilities.videoToVideo.enabled` را اعلام کرده باشد و ارائه‌دهنده/مدل انتخاب‌شده در پیمایش مشترک، ورودی ویدئوی محلی مبتنی بر بافر را بپذیرد
  - ارائه‌دهندهٔ فعلی `imageToVideo` که اعلام شده اما در پیمایش مشترک نادیده گرفته می‌شود:
    - `vydra` (ورودی تصویر محلی مبتنی بر بافر در این مسیر پشتیبانی نمی‌شود)
  - پوشش اختصاصی ارائه‌دهنده برای Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - آن فایل، تبدیل متن‌به‌ویدئو با `veo3` را به‌همراه یک مسیر تصویر‌به‌ویدئو با `kling` اجرا می‌کند که به‌طور پیش‌فرض از یک نمونهٔ URL تصویر راه‌دور استفاده می‌کند (برای بازنویسی از `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` استفاده کنید).
  - پوشش اختصاصی ارائه‌دهنده برای xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - حالت کلاسیک ابتدا یک فریم نخست PNG محلی مربعی تولید می‌کند، هندسه را حذف می‌کند، یک کلیپ یک‌ثانیه‌ای تصویر‌به‌ویدئو درخواست می‌کند، تا تکمیل‌شدن وضعیت را نظرسنجی می‌کند و بافر بارگیری‌شده را تأیید می‌کند.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - حالت 1.5 یک فریم نخست PNG محلی تولید می‌کند، یک کلیپ یک‌ثانیه‌ای تصویر‌به‌ویدئو با کیفیت 1080P درخواست می‌کند، تا تکمیل‌شدن وضعیت را نظرسنجی می‌کند و بافر بارگیری‌شده را تأیید می‌کند.
  - پوشش زندهٔ فعلی `videoToVideo`:
    - فقط `runway`، هنگامی که مدل انتخاب‌شده به `gen4_aleph` نگاشت شود
  - ارائه‌دهندگان فعلی `videoToVideo` که اعلام شده‌اند اما در پیمایش مشترک نادیده گرفته می‌شوند:
    - `alibaba`، `google`، `openai`، `qwen` و `xai`، زیرا این مسیرها در حال حاضر به URLهای مرجع راه‌دور `http(s)` نیاز دارند، نه ورودی محلی مبتنی بر بافر
- محدودسازی اختیاری:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - برای گنجاندن همهٔ ارائه‌دهندگان در پیمایش پیش‌فرض، از جمله FAL، `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - برای کاهش سقف زمانی هر عملیات ارائه‌دهنده در یک اجرای دود تهاجمی، `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- رفتار اختیاری احراز هویت:
  - برای اجبار احراز هویت از مخزن پروفایل و نادیده‌گرفتن بازنویسی‌های صرفاً محیطی، `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## چارچوب آزمون زندهٔ رسانه

- فرمان: `pnpm test:live:media`
- نقطهٔ ورود: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`، که برای هر مجموعهٔ انتخاب‌شده `pnpm test:live -- <suite-test-file>` را اجرا می‌کند تا رفتار Heartbeat و حالت بی‌صدا با دیگر اجراهای `pnpm test:live` سازگار بماند.
- هدف:
  - مجموعه‌های زندهٔ مشترک تصویر، موسیقی و ویدئو را از طریق یک نقطهٔ ورود بومی مخزن اجرا می‌کند
  - متغیرهای محیطی مفقود ارائه‌دهندگان را به‌طور خودکار از `~/.profile` بارگذاری می‌کند
  - به‌طور پیش‌فرض، هر مجموعه را به ارائه‌دهندگانی محدود می‌کند که در حال حاضر احراز هویت قابل‌استفاده دارند
- پرچم‌ها:
  - `--providers <csv>` پالایهٔ سراسری ارائه‌دهندگان؛ `--image-providers` / `--music-providers` / `--video-providers` دامنهٔ پالایه را به یک مجموعه محدود می‌کنند
  - `--all-providers` پالایش خودکار مبتنی بر احراز هویت را نادیده می‌گیرد
  - `--allow-empty` هنگامی که پس از پالایش هیچ ارائه‌دهندهٔ قابل‌اجرایی باقی نماند، با کد `0` خارج می‌شود
  - `--quiet` / `--no-quiet` به `test:live` منتقل می‌شوند
- نمونه‌ها:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## مرتبط

- [آزمون](/fa/help/testing) - مجموعه‌های واحد، یکپارچه‌سازی، تضمین کیفیت و Docker
