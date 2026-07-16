---
read_when:
    - می‌خواهید برای یک عامل از چارچوب GitHub Copilot SDK استفاده کنید
    - برای runtime ‏`copilot` به نمونه‌های پیکربندی نیاز دارید
    - در حال اتصال یک عامل به اشتراک Copilot (github / openclaw / copilot) هستید و می‌خواهید آن را از طریق Copilot CLI اجرا کنید
summary: نوبت‌های عامل تعبیه‌شده OpenClaw را از طریق هارنس خارجی GitHub Copilot SDK اجرا کنید
title: مهار Copilot SDK
x-i18n:
    generated_at: "2026-07-16T16:47:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

Plugin خارجی `@openclaw/copilot` گردش‌های عامل Copilot اشتراکیِ تعبیه‌شده را به‌جای
هارنس داخلی OpenClaw، از طریق GitHub Copilot CLI (`@github/copilot-sdk`)
اجرا می‌کند. نشست Copilot CLI مالک حلقه سطح‌پایین عامل است: اجرای بومی ابزار،
Compaction بومی (`infiniteSessions`) و وضعیت رشته مدیریت‌شده توسط CLI در
`copilotHome`. OpenClaw همچنان مالک کانال‌های گفت‌وگو، فایل‌های نشست،
انتخاب مدل، ابزارهای پویا (پل‌شده)، تأییدها، تحویل رسانه، آینه رونوشت قابل‌مشاهده،
پرسش‌های جانبی `/btw` (نگاه کنید به
[پرسش‌های جانبی (`/btw`)](#side-questions-btw)) و `openclaw doctor` است.

برای تفکیک گسترده‌تر مدل/ارائه‌دهنده/زمان اجرا، از
[زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) شروع کنید.

## الزامات

- OpenClaw با Plugin ‏`@openclaw/copilot` نصب‌شده.
- اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `copilot` (شناسه مانیفستی که
  Plugin اعلام می‌کند) را اضافه کنید. ورودی فهرست مجاز با نام بسته npm یعنی
  `@openclaw/copilot` مطابقت نخواهد داشت و حتی با تنظیم
  `agentRuntime.id: "copilot"` نیز Plugin مسدود می‌ماند.
- اشتراک GitHub Copilot که بتواند Copilot CLI را راه‌اندازی کند، یا
  متغیر محیطی `gitHubToken` / ورودی نمایه احراز هویت برای اجراهای بدون رابط یا Cron.
- دایرکتوری `copilotHome` قابل‌نوشتن. وقتی OpenClaw دایرکتوری عامل
  ارائه می‌کند، مقدار پیش‌فرض `<agentDir>/copilot` است؛ در غیر این صورت
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` قرارداد [doctor](#doctor) مربوط به Plugin را برای مالکیت
وضعیت نشست و مهاجرت‌های آینده پیکربندی اجرا می‌کند. این فرمان محیط Copilot CLI را
بررسی نمی‌کند.

## نصب

زمان اجرای Copilot به‌صورت یک Plugin خارجی عرضه می‌شود تا بسته اصلی
`openclaw` شامل `@github/copilot-sdk` یا باینری CLI مختص پلتفرم آن،
یعنی `@github/copilot-<platform>-<arch>`، نباشد (در مجموع حدود 260 MB).
آن را فقط برای عامل‌هایی نصب کنید که این زمان اجرا را انتخاب می‌کنند:

```bash
openclaw plugins install @openclaw/copilot
```

جادوگر راه‌اندازی، نخستین باری که یک مدل `github-copilot/*` را انتخاب کنید
**و** پیکربندی شما آن مدل (یا ارائه‌دهنده‌اش) را از طریق `agentRuntime: { id: "copilot" }`
به زمان اجرای Copilot هدایت کند، Plugin را به‌طور خودکار نصب می‌کند؛ به
[شروع سریع](#quickstart) مراجعه کنید. بدون این انتخاب، OpenClaw از ارائه‌دهنده
داخلی GitHub Copilot خود استفاده می‌کند و هرگز این Plugin را نصب نمی‌کند.

زمان اجرا SDK را با این ترتیب پیدا می‌کند:

1. `import("@github/copilot-sdk")` از بسته نصب‌شده `@openclaw/copilot`.
2. دایرکتوری جایگزین `~/.openclaw/npm-runtime/copilot/` (مقصد قدیمی نصب
   برحسب تقاضا).

نبود SDK یک خطا با کد `COPILOT_SDK_MISSING` و فرمان نصب مجدد بالا ایجاد می‌کند.

## شروع سریع

یک مدل (یا یک ارائه‌دهنده) را به هارنس سنجاق کنید:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

`agentRuntime.id` را روی ورودی یک مدل تنظیم کنید تا فقط همان مدل از طریق
هارنس هدایت شود، یا آن را روی یک ارائه‌دهنده تنظیم کنید تا تمام مدل‌های آن
ارائه‌دهنده هدایت شوند.

`github-copilot/auto` نقطه شروع قابل‌حمل است. مدل‌های نام‌گذاری‌شده Copilot
به سیاست حساب و سازمان وابسته‌اند؛ پیش از سنجاق‌کردن یک مدل، تأیید کنید که
Copilot CLI احرازهویت‌شده شما واقعاً آن را ارائه می‌دهد.

## ارائه‌دهندگان پشتیبانی‌شده

هارنس از ارائه‌دهنده معیار `github-copilot` (متعلق به
`extensions/github-copilot`) و همچنین ورودی‌های سفارشی `models.providers` پشتیبانی
می‌کند، مشروط بر اینکه مدل دارای `baseUrl` غیرخالی و یکی از
ساختارهای `api` زیر باشد:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (تکمیل‌های سازگار با OpenAI)
- `openai-completions`
- `openai-responses`

شناسه‌های ارائه‌دهنده بومی (`openai`، `anthropic`، `google`، `ollama`)
در مالکیت زمان‌های اجرای بومی خود باقی می‌مانند. برای هدایت یک نقطه پایانی از
طریق Copilot BYOK، به‌جای آن از شناسه‌ای مجزا برای ارائه‌دهنده سفارشی استفاده کنید.

نقاط پایانی Copilot BYOK باید نشانی‌های عمومی HTTPS باشند. هارنس در هر تلاش
یک پراکسی loopback به Copilot SDK می‌دهد، سپس ترافیک ارائه‌دهنده را از مسیر
واکشی محافظت‌شده OpenClaw عبور می‌دهد تا سنجاق‌کردن DNS و سیاست SSRF همچنان
در مالکیت OpenClaw باقی بماند. برای Ollama محلی، LM Studio یا سرورهای مدل LAN
از زمان اجرای بومی OpenClaw استفاده کنید.

## BYOK

Copilot BYOK از قرارداد ارائه‌دهنده سفارشی SDK در سطح نشست استفاده می‌کند.
OpenClaw نقطه پایانی حل‌شده مدل، کلید API، حالت توکن حامل، سرآیندها، شناسه مدل
و محدودیت‌های زمینه/خروجی را ارسال می‌کند؛ منطق انتقال ارائه‌دهنده در SDK
باقی می‌ماند، نه در هسته.

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

نشست‌های BYOK جدا از نشست‌های اشتراکی و نیز جدا از سایر نقاط پایانی یا
اعتبارنامه‌های BYOK کلیدگذاری می‌شوند. چرخش کلید، سرآیندها، مدل یا نقطه پایانی،
به‌جای ازسرگیری وضعیت ناسازگار، یک نشست تازه Copilot SDK را آغاز می‌کند.

## احراز هویت

ترتیب اولویت که در هر عامل هنگام `runCopilotAttempt` اعمال می‌شود:

1. **`useLoggedInUser: true` صریح** در ورودی تلاش — از کاربر واردشده
   Copilot CLI در `copilotHome` عامل استفاده می‌کند.
2. **`gitHubToken` صریح** در ورودی تلاش (نیازمند `profileId` +
   `profileVersion`). برای فراخوانی‌های مستقیم CLI و آزمون‌هایی که باید
   حل نمایه احراز هویت را دور بزنند.
3. **`resolvedApiKey` + `authProfileId` حل‌شده توسط قرارداد** — مسیر
   اصلی تولید. هسته پیش از فراخوانی هارنس، نمایه احراز هویت
   `github-copilot` پیکربندی‌شده عامل (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) را حل می‌کند،
   بنابراین یک نمایه احراز هویت `github-copilot:<profile>` برای تنظیمات بدون رابط،
   Cron یا چندنمایه‌ای، بدون متغیرهای محیطی، از ابتدا تا انتها کار می‌کند.
4. **جایگزین متغیر محیطی**، به این ترتیب بررسی می‌شود (نخستین مقدار
   غیرخالی برنده است، رشته‌های خالی غایب محسوب می‌شوند؛ همان اولویت ارائه‌دهنده
   عرضه‌شده `github-copilot` در `extensions/github-copilot/auth.ts` را بازتاب می‌دهد):
   1. `OPENCLAW_GITHUB_TOKEN` — بازنویسی ویژه هارنس؛ به شما اجازه می‌دهد
      توکنی را برای هارنس OpenClaw سنجاق کنید، بی‌آنکه پیکربندی سراسری
      `gh` / Copilot CLI را مختل کنید.
   2. `COPILOT_GITHUB_TOKEN` — متغیر محیطی استاندارد Copilot SDK / CLI.
   3. `GH_TOKEN` — متغیر محیطی استاندارد CLI ‏`gh`.
   4. `GITHUB_TOKEN` — جایگزین عمومی توکن GitHub.

   شناسه نمایه مخزن ترکیبی `env:<NAME>` است؛ نسخه نمایه یک اثرانگشت
   برگشت‌ناپذیر sha256 از توکن است، بنابراین چرخش مقدار محیطی مخزن کلاینت را
   به‌طور کامل نوسازی می‌کند.

5. **`useLoggedInUser` پیش‌فرض** هنگامی که هیچ نشانه توکنی در دسترس نیست.

هر عامل `copilotHome` مخصوص خود را دریافت می‌کند تا توکن‌ها، نشست‌ها و
پیکربندی Copilot CLI هرگز میان عامل‌های یک دستگاه نشت نکنند. مقدار پیش‌فرض:
`<agentDir>/copilot` (وضعیت SDK را خارج از همان دایرکتوری
`models.json` / `auth-profiles.json` متعلق به OpenClaw نگه می‌دارد)، یا
`~/.openclaw/agents/<agentId>/copilot` وقتی هیچ دایرکتوری عاملی ارائه نشده باشد.
برای مکان سفارشی، `copilotHome: <path>` را در ورودی تلاش بازنویسی کنید
(برای مثال، یک mount مشترک برای مهاجرت).

آزمون‌های زنده هارنس از `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` برای توکن مستقیم استفاده می‌کنند.
راه‌اندازی مشترک آزمون زنده پس از قراردادن نمایه‌های واقعی احراز هویت در خانه
ایزوله آزمون، `COPILOT_GITHUB_TOKEN`، `GH_TOKEN` و `GITHUB_TOKEN` را پاک می‌کند؛
بنابراین مقدار `gh auth token` که از طریق متغیر اختصاصی ارسال شود، بدون نشت
به مجموعه‌آزمون‌های نامرتبط از ردشدن اشتباه آزمون جلوگیری می‌کند.

## سطح پیکربندی

هارنس پیکربندی را از ورودی هر تلاش (`runCopilotAttempt({...})`) به‌علاوه مجموعه کوچکی
از پیش‌فرض‌های محیطی درون `extensions/copilot/src/` می‌خواند:

| فیلد                    | هدف                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | دایرکتوری وضعیت CLI هر عامل (پیش‌فرض‌ها در بالا).                                                                                                                                                                                                                                                 |
| `model`                  | رشته یا `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. برای استفاده از انتخاب عادی مدل عامل حذفش کنید؛ هارنس پشتیبانی‌شدن ارائه‌دهنده حل‌شده را تأیید می‌کند.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. از حل `ThinkLevel` / `ReasoningLevel` متعلق به OpenClaw در `auto-reply/thinking.ts` نگاشت می‌شود.                                                                                                                                                          |
| `infiniteSessionConfig`  | بازنویسی اختیاری برای بلوک `infiniteSessions` در SDK که توسط `harness.compact` هدایت می‌شود. باقی‌گذاشتن آن بدون تغییر ایمن است.                                                                                                                                                                                        |
| `hooksConfig`            | پیکربندی بومی و اختیاری `SessionHooks` در Copilot SDK برای فراخوان‌های بازگشتی ابزار/MCP، اعلان کاربر، نشست و خطا. از هوک‌های چرخه‌عمر قابل‌حمل OpenClaw جدا است.                                                                                                                                   |
| `permissionPolicy`       | بازنویسی اختیاری برای کنترل‌کننده `onPermissionRequest` در SDK برای انواع ابزار داخلی SDK (`shell`، `write`، `read`، `url`، `mcp`، `memory`، `hook`). برای ایمنی، مقدار پیش‌فرض `rejectAllPolicy` است؛ برای دلیل اینکه در عمل هرگز اجرا نمی‌شود، به [مجوزها و ask_user](#permissions-and-ask_user) مراجعه کنید. |
| `enableSessionTelemetry` | پرچم اختیاری دورسنجی نشست SDK.                                                                                                                                                                                                                                                            |

هوک‌های Plugin ‏OpenClaw به پیکربندی ویژه تلاش برای Copilot نیاز ندارند. هارنس
`before_prompt_build` (و هوک سازگاری قدیمی `before_agent_start`)،
`llm_input`، `llm_output` و `agent_end` را از طریق
کمک‌کننده‌های استاندارد هارنس اجرا می‌کند. Compactionهای موفق SDK همچنین
`before_compaction` و `after_compaction` را اجرا می‌کنند. ابزارهای پل‌شده OpenClaw
`before_tool_call` را اجرا و `after_tool_call` را گزارش می‌کنند؛
`hooksConfig` برای فراخوان‌های بازگشتی صرفاً بومی SDK که همتای قابل‌حمل ندارند
باقی می‌ماند.

هیچ بخش دیگری در OpenClaw لازم نیست از این فیلدها آگاه باشد. سایر Pluginها،
کانال‌ها و کد هسته فقط ساختار استاندارد `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult` را می‌بینند.

## Compaction

هنگامی که `harness.compact` اجرا می‌شود، هارنس Copilot SDK:

1. نشست ردیابی‌شده SDK را بدون ادامه‌دادن کار معلق از سر می‌گیرد.
2. RPC مربوط به Compaction تاریخچه در سطح نشست SDK را فراخوانی می‌کند.
3. نتیجه Compaction در SDK را بدون نوشتن فایل‌های نشانگر سازگاری
   در فضای کاری برمی‌گرداند.

آینه رونوشت در سمت OpenClaw (در ادامه) همچنان پیام‌های پس از Compaction را
دریافت می‌کند، بنابراین تاریخچه گفت‌وگوی قابل‌مشاهده برای کاربر سازگار می‌ماند.

## آینه‌سازی رونوشت

`runCopilotAttempt` پیام‌های قابل‌آینه‌سازی هر نوبت را از طریق
`extensions/copilot/src/dual-write-transcripts.ts` به‌صورت دوگانه در رونوشت ممیزی
OpenClaw می‌نویسد. دامنه آینه به هر نشست محدود است
(`copilot:${sessionId}`) و کلیدگذاری آن برای هر پیام انجام می‌شود
(`${role}:${sha256_16(role,content)}`)، بنابراین ورودی‌های نوبت‌های پیشین که دوباره منتشر می‌شوند،
به‌جای تکرار، با کلیدهای موجود روی دیسک برخورد می‌کنند.

دو لایه مهار خرابی، آینه را در بر می‌گیرند تا خرابی نوشتن رونوشت
هرگز تلاش را با شکست مواجه نکند: یک پوشش داخلی با رویکرد بهترین تلاش، به‌علاوه یک
`.catch(...)` دفاع در عمق در سطح تلاش. خرابی‌ها ثبت می‌شوند، نه
نمایان.

## پرسش‌های جانبی (`/btw`)

`/btw` در این هارنس **بومی نیست**. `createCopilotAgentHarness()`
عمداً `harness.runSideQuestion` را تعریف‌نشده باقی می‌گذارد
(تأییدشده در `extensions/copilot/harness.test.ts`، `describe("runSideQuestion")`)،
بنابراین توزیع‌کننده `/btw` در OpenClaw (`src/agents/btw.ts`) به همان
مسیری می‌افتد که برای هر زمان اجرای غیر Codex استفاده می‌کند: ارائه‌دهنده مدل
پیکربندی‌شده مستقیماً با یک پرامپت کوتاه پرسش جانبی فراخوانی می‌شود و پاسخ از طریق
`streamSimple` به‌صورت جریانی بازگردانده می‌شود (بدون نشست CLI و بدون شکاف اضافی در مخزن).

این کار نشست‌های Copilot CLI را برای حلقه اصلی نوبت عامل محفوظ نگه می‌دارد و
رفتار `/btw` را با دیگر زمان‌های اجرای غیر Codex یکسان نگه می‌دارد.

## Doctor

`extensions/copilot/doctor-contract-api.ts` به‌طور خودکار توسط
`src/plugins/doctor-contract-registry.ts` بارگذاری می‌شود. موارد زیر را ارائه می‌کند:

- یک `legacyConfigRules` خالی (هنوز هیچ فیلد بازنشسته‌ای وجود ندارد).
- یک `normalizeCompatibilityConfig` بدون عملیات (حفظ شده تا بازنشستگی‌های آینده فیلدها
  خانه‌ای پایدار درون درخت داشته باشند).
- یک ورودی `sessionRouteStateOwners`: ارائه‌دهنده `github-copilot`، زمان اجرا
  `copilot`، کلید نشست CLI به نام `copilot`، پیشوند نمایه احراز هویت `github-copilot:`.

## محدودیت‌ها

- هارنس مالکیت `github-copilot` به‌علاوه شناسه‌های سفارشی و بدون مالک ارائه‌دهنده BYOK را بر عهده می‌گیرد.
  شناسه‌های بومی ارائه‌دهنده که مالکشان مانیفست است، حتی وقتی
  `agentRuntime.id` به‌اجبار روی `copilot` تنظیم شده باشد، در زمان اجرای مالک خود باقی می‌مانند.
- هیچ سطح TUI وجود ندارد؛ TUI متعلق به PI برای زمان‌های اجرای بدون سطح همتا
  همچنان گزینه جایگزین است.
- وقتی یک عامل به `copilot` تغییر می‌کند، وضعیت نشست PI مهاجرت نمی‌کند.
  انتخاب برای هر تلاش انجام می‌شود؛ نشست‌های موجود PI همچنان معتبر می‌مانند.
- `ask_user` از همان مسیر پرامپت و پاسخ OpenClaw در هارنس Codex
  استفاده می‌کند: وقتی Copilot SDK ورودی کاربر را درخواست می‌کند، OpenClaw یک
  پرامپت مسدودکننده را به کانال/TUI فعال ارسال می‌کند و پیام بعدی کاربر
  در صف، درخواست SDK را حل می‌کند.

## مجوزها و ask_user

اعمال مجوز برای ابزارهای پل‌زده OpenClaw **درون پوشش ابزار**
انجام می‌شود، نه از طریق بازفراخوانی `onPermissionRequest` در SDK. همان
`wrapToolWithBeforeToolCallHook` که PI استفاده می‌کند
(`src/agents/agent-tools.before-tool-call.ts`)، توسط
`createOpenClawCodingTools` بر هر ابزار کدنویسی اعمال می‌شود: تشخیص حلقه، خط‌مشی‌های
Plugin مورد اعتماد، هوک‌های پیش از فراخوانی ابزار و تأییدهای دومرحله‌ای Plugin از طریق
Gateway (`plugin.approval.request`) همگی دقیقاً از همان مسیر کدی عبور می‌کنند
که تلاش‌های بومی PI طی می‌کنند.

هر ابزار SDK که پل ابزار Copilot بازمی‌گرداند، با موارد زیر علامت‌گذاری می‌شود:

- `overridesBuiltInTool: true` — ابزار داخلی هم‌نام در Copilot CLI
  (edit، read، write، bash، ...) را جایگزین می‌کند تا هر فراخوانی ابزار دوباره
  به OpenClaw هدایت شود.
- `skipPermission: true` — به SDK می‌گوید پیش از فراخوانی ابزار،
  `onPermissionRequest({kind: "custom-tool"})` را فعال نکند. `execute()` پوشش‌داده‌شده از قبل
  بررسی غنی‌تر خط‌مشی OpenClaw را انجام می‌دهد؛ یک پرامپت در سطح SDK یا
  اعمال OpenClaw را میان‌بر می‌زند (اجازه‌دادن به همه) یا همه فراخوانی‌های ابزار را مسدود می‌کند
  (رد همه) — هیچ‌یک با هم‌ترازی PI مطابقت ندارد.

هارنس Codex درون درخت از همین تفکیک استفاده می‌کند: ابزارهای پل‌زده OpenClaw
پوشش داده می‌شوند (`extensions/codex/src/app-server/dynamic-tools.ts`) و
انواع تأیید بومی متعلق به codex-app-server
(`item/commandExecution/requestApproval`، `item/fileChange/requestApproval`،
`item/permissions/requestApproval`) از طریق `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`) هدایت می‌شوند. معادل آن در Copilot SDK
— `rejectAllPolicy` با شکست بسته برای هر نوع غیر `custom-tool`
که هرگز به `onPermissionRequest` برسد — همان شبکه ایمنی است و
در عمل هرگز فعال نمی‌شود، زیرا `overridesBuiltInTool: true` جای هر
ابزار داخلی را می‌گیرد.

برای اینکه لایه ابزار پوشش‌داده‌شده تصمیم‌های خط‌مشی معادل PI بگیرد،
هارنس تمام زمینه ابزار تلاش PI را به
`createOpenClawCodingTools` ارسال می‌کند: هویت (`senderIsOwner`، `memberRoleIds`،
`ownerOnlyToolAllowlist`، ...)، کانال/مسیریابی (`groupId`،
`currentChannelId`، `replyToMode`، کلیدهای تغییر وضعیت ابزار پیام)، احراز هویت
(`authProfileStore`)، هویت اجرا (`sessionKey` / `runSessionKey` مشتق‌شده
از `sandboxSessionKey`، `runId`)، زمینه مدل (`modelApi`،
`modelContextWindowTokens`، `modelCompat`، `modelHasVision`) و هوک‌های اجرا
(`onToolOutcome`، `onYield`). بدون این فیلدها، فهرست‌های مجاز مختص مالک
به‌طور بی‌صدا و پیش‌فرض رد می‌کنند، خط‌مشی‌های اعتماد Plugin نمی‌توانند به دامنه درست
نگاشت شوند و `session_status: "current"` به یک کلید قدیمی سندباکس نگاشت می‌شود. سازنده
پل `extensions/copilot/src/tool-bridge.ts` است که فراخوانی مرجع PI
در `src/agents/embedded-agent-runner/run/attempt.ts:1262` را بازتاب می‌دهد.
`runAttempt` زمینه سندباکس را از طریق درز مشترک
`resolveSandboxContext` نگاشت می‌کند، یک دایرکتوری کاری مؤثر به SDK می‌دهد
و `sandbox` به‌علاوه فضای کاری ایجاد زیرعامل را به پل ابزار
ارسال می‌کند. پل همچنین کنترل‌های محدود ساخت ابزار را که می‌تواند
در مرز SDK اعمال کند، ارسال می‌کند: `includeCoreTools`، فهرست مجاز ابزارهای زمان اجرا
و `toolConstructionPlan`.

پل برای هم‌ترازی PI همچنین از راهنمای مشترک سطح ابزار هارنس در
`openclaw/plugin-sdk/agent-harness-tool-runtime` استفاده می‌کند. وقتی
جست‌وجوی ابزار فعال باشد، SDK به‌جای همه طرح‌واره‌های ابزار OpenClaw، ابزارهای کنترلی
فشرده به‌علاوه یک اجراکننده پنهان کاتالوگ را می‌بیند. وقتی حالت کد فعال باشد،
راهنما همان سطح کنترلی حالت کد و چرخه عمر کاتالوگ مورد استفاده دیگر هارنس‌های عامل
را می‌سازد. پیش‌فرض‌های سبک مدل محلی، پالایش طرح‌واره سازگار با زمان اجرا،
آب‌رسانی دایرکتوری و پاک‌سازی کاتالوگ همگی در راهنمای مشترک باقی می‌مانند تا
هارنس‌های Copilot و مجاور Codex از یکدیگر منحرف نشوند.

### توکن GitHub در سطح نشست

قرارداد Copilot SDK میان توکن GitHub در **سطح کلاینت**
(`CopilotClientOptions.gitHubToken`، که خود فرایند CLI را احراز هویت می‌کند)
و توکن **سطح نشست** (`SessionConfig.gitHubToken`، که
حذف محتوا، مسیریابی مدل و سهمیه آن نشست را تعیین می‌کند؛ در هر دو
`createSession` و `resumeSession` رعایت می‌شود) تمایز قائل است. هارنس احراز هویت را یک‌بار از طریق
`resolveCopilotAuth` نگاشت می‌کند و وقتی حالت احراز هویت `gitHubToken` باشد،
هر دو فیلد را تنظیم می‌کند (یک `auth.gitHubToken` صریح یا یک `resolvedApiKey`
نگاشت‌شده طبق قرارداد از یک نمایه احراز هویت `github-copilot` پیکربندی‌شده). وقتی حالت
نگاشت‌شده `useLoggedInUser` باشد، فیلد سطح نشست حذف می‌شود تا SDK همچنان
هویت را از هویت واردشده استخراج کند.

`ask_user` از `SessionConfig.onUserInputRequest` استفاده می‌کند. پل برای درخواست‌های
دارای گزینه‌های ثابت، نمایه‌ها یا برچسب گزینه‌ها را می‌پذیرد، وقتی درخواست SDK
اجازه دهد پاسخ‌های آزاد را می‌پذیرد و هنگامی که تلاش OpenClaw لغو شود،
درخواست معلق را لغو می‌کند.

## مرتبط

- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes)
- [هارنس Codex](/fa/plugins/codex-harness)
- [Pluginهای هارنس عامل (مرجع SDK)](/fa/plugins/sdk-agent-harness)
