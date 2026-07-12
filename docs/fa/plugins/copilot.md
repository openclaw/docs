---
read_when:
    - می‌خواهید از چارچوب GitHub Copilot SDK برای یک عامل استفاده کنید
    - برای محیط اجرای `copilot` به نمونه‌های پیکربندی نیاز دارید
    - شما در حال متصل‌کردن یک عامل به اشتراک Copilot ‏(github / openclaw / copilot) هستید و می‌خواهید آن را از طریق Copilot CLI اجرا کنید
summary: نوبت‌های عامل تعبیه‌شده OpenClaw را از طریق چارچوب خارجی GitHub Copilot SDK اجرا کنید
title: هارنس SDK کوپایلت
x-i18n:
    generated_at: "2026-07-12T10:23:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

افزونهٔ خارجی `@openclaw/copilot` نوبت‌های عامل Copilot مبتنی بر اشتراک را به‌صورت توکار و از طریق GitHub Copilot CLI (`@github/copilot-sdk`) اجرا می‌کند، نه از طریق چارچوب داخلی OpenClaw. نشست Copilot CLI مالک حلقهٔ سطح‌پایین عامل است: اجرای بومی ابزار، Compaction بومی (`infiniteSessions`) و وضعیت رشتهٔ مدیریت‌شده توسط CLI در `copilotHome`. OpenClaw همچنان مالک کانال‌های گفت‌وگو، فایل‌های نشست، انتخاب مدل، ابزارهای پویا (پل‌شده)، تأییدها، تحویل رسانه، آینهٔ قابل‌مشاهدهٔ رونوشت، پرسش‌های جانبی `/btw` (نگاه کنید به [پرسش‌های جانبی (`/btw`)](#side-questions-btw)) و `openclaw doctor` است.

برای آشنایی با تفکیک گسترده‌تر مدل/ارائه‌دهنده/زمان‌اجرا، از
[زمان‌های اجرای عامل](/fa/concepts/agent-runtimes) شروع کنید.

## الزامات

- OpenClaw با افزونهٔ `@openclaw/copilot` نصب‌شده.
- اگر پیکربندی شما از `plugins.allow` استفاده می‌کند، `copilot` (شناسهٔ مانیفست اعلام‌شده توسط افزونه) را در آن قرار دهید. ورودی فهرست مجاز با نام بستهٔ npm یعنی `@openclaw/copilot` مطابقت نخواهد داشت و حتی با تنظیم `agentRuntime.id: "copilot"` نیز افزونه مسدود باقی می‌ماند.
- یک اشتراک GitHub Copilot که بتواند Copilot CLI را راه‌اندازی کند، یا یک متغیر محیطی `gitHubToken` / ورودی نمایهٔ احراز هویت برای اجراهای بدون رابط یا Cron.
- یک پوشهٔ `copilotHome` قابل‌نوشتن. هنگامی که OpenClaw پوشه‌ای برای عامل فراهم می‌کند، مقدار پیش‌فرض `<agentDir>/copilot` است؛ در غیر این صورت
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` برای مالکیت وضعیت نشست و مهاجرت‌های آتی پیکربندی، [قرارداد doctor](#doctor) افزونه را اجرا می‌کند. این فرمان محیط Copilot CLI را بررسی نمی‌کند.

## نصب

زمان‌اجرای Copilot به‌صورت یک افزونهٔ خارجی عرضه می‌شود تا بستهٔ اصلی `openclaw` شامل `@github/copilot-sdk` یا فایل اجرایی CLI وابسته به سکوی آن، یعنی `@github/copilot-<platform>-<arch>`، نباشد (در مجموع حدود ۲۶۰ مگابایت). آن را فقط برای عامل‌هایی نصب کنید که این زمان‌اجرا را انتخاب می‌کنند:

```bash
openclaw plugins install @openclaw/copilot
```

جادوگر راه‌اندازی، نخستین باری که یک مدل `github-copilot/*` را انتخاب می‌کنید، افزونه را به‌طور خودکار نصب می‌کند، **به‌شرط آنکه** پیکربندی شما آن مدل (یا ارائه‌دهندهٔ آن) را از طریق `agentRuntime: { id: "copilot" }` به زمان‌اجرای Copilot هدایت کند؛ به [شروع سریع](#quickstart) مراجعه کنید. بدون این انتخاب، OpenClaw از ارائه‌دهندهٔ داخلی GitHub Copilot خود استفاده می‌کند و هرگز این افزونه را نصب نمی‌کند.

زمان‌اجرا SDK را به این ترتیب پیدا می‌کند:

1. `import("@github/copilot-sdk")` از بستهٔ نصب‌شدهٔ `@openclaw/copilot`.
2. پوشهٔ جایگزین `~/.openclaw/npm-runtime/copilot/` (مقصد قدیمی نصب در صورت نیاز).

نبود SDK یک خطا با کد `COPILOT_SDK_MISSING` و فرمان نصب مجدد بالا ایجاد می‌کند.

## شروع سریع

یک مدل (یا یک ارائه‌دهنده) را به چارچوب مقید کنید:

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

برای هدایت فقط یک مدل از طریق چارچوب، `agentRuntime.id` را روی ورودی همان مدل تنظیم کنید؛ یا برای هدایت همهٔ مدل‌های یک ارائه‌دهنده، آن را روی ارائه‌دهنده تنظیم کنید.

`github-copilot/auto` نقطهٔ شروع قابل‌حمل است. مدل‌های نام‌گذاری‌شدهٔ Copilot به سیاست حساب و سازمان وابسته‌اند؛ پیش از مقیدکردن یک مدل، تأیید کنید که Copilot CLI احراز هویت‌شدهٔ شما واقعاً آن را ارائه می‌کند.

## ارائه‌دهندگان پشتیبانی‌شده

چارچوب از ارائه‌دهندهٔ معیار `github-copilot` (متعلق به `extensions/github-copilot`) و همچنین ورودی‌های سفارشی `models.providers` پشتیبانی می‌کند، مشروط بر اینکه مدل دارای `baseUrl` غیرخالی و یکی از قالب‌های `api` زیر باشد:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (تکمیل‌های سازگار با OpenAI)
- `openai-completions`
- `openai-responses`

شناسه‌های بومی ارائه‌دهنده (`openai`، `anthropic`، `google`، `ollama`) تحت مالکیت زمان‌های اجرای بومی خود باقی می‌مانند. برای هدایت یک نقطهٔ پایانی از طریق Copilot BYOK، به‌جای آن از یک شناسهٔ متمایز برای ارائه‌دهندهٔ سفارشی استفاده کنید.

نقاط پایانی Copilot BYOK باید نشانی‌های HTTPS عمومی باشند. چارچوب برای هر تلاش یک پراکسی local loopback در اختیار Copilot SDK قرار می‌دهد و سپس ترافیک ارائه‌دهنده را از مسیر واکشی محافظت‌شدهٔ OpenClaw عبور می‌دهد تا تثبیت DNS و سیاست SSRF تحت مالکیت OpenClaw باقی بمانند. برای Ollama محلی، LM Studio یا سرورهای مدل در LAN از زمان‌اجرای بومی OpenClaw استفاده کنید.

## BYOK

Copilot BYOK از قرارداد ارائه‌دهندهٔ سفارشی در سطح نشست SDK استفاده می‌کند. OpenClaw نقطهٔ پایانی حل‌شدهٔ مدل، کلید API، حالت توکن حامل، سرآیندها، شناسهٔ مدل و محدودیت‌های زمینه/خروجی را منتقل می‌کند؛ منطق انتقال ارائه‌دهنده در SDK باقی می‌ماند، نه در هسته.

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

نشست‌های BYOK جدا از نشست‌های اشتراکی و نیز جدا از سایر نقاط پایانی یا اعتبارنامه‌های BYOK کلیدگذاری می‌شوند. چرخش کلید، سرآیندها، مدل یا نقطهٔ پایانی، به‌جای ازسرگیری وضعیت ناسازگار، یک نشست تازهٔ Copilot SDK آغاز می‌کند.

## احراز هویت

ترتیب تقدم که هنگام `runCopilotAttempt` برای هر عامل اعمال می‌شود:

1. **`useLoggedInUser: true` صریح** در ورودی تلاش — از کاربر واردشدهٔ Copilot CLI در `copilotHome` عامل استفاده می‌کند.
2. **`gitHubToken` صریح** در ورودی تلاش (نیازمند `profileId` + `profileVersion`). برای فراخوانی‌های مستقیم CLI و آزمون‌هایی که باید حل نمایهٔ احراز هویت را دور بزنند.
3. **`resolvedApiKey` + `authProfileId` حل‌شده توسط قرارداد** — مسیر اصلی محیط عملیاتی. هسته پیش از فراخوانی چارچوب، نمایهٔ احراز هویت `github-copilot` پیکربندی‌شدهٔ عامل (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) را حل می‌کند؛ بنابراین یک نمایهٔ احراز هویت `github-copilot:<profile>` برای راه‌اندازی‌های بدون رابط، Cron یا چندنمایه‌ای، بدون متغیر محیطی، از ابتدا تا انتها کار می‌کند.
4. **جایگزین متغیر محیطی** که به این ترتیب بررسی می‌شود (نخستین مقدار غیرخالی برنده است؛ رشته‌های خالی غایب محسوب می‌شوند؛ همان ترتیب تقدم ارائه‌دهندهٔ عرضه‌شدهٔ `github-copilot` در `extensions/github-copilot/auth.ts` را بازتاب می‌دهد):
   1. `OPENCLAW_GITHUB_TOKEN` — بازنویسی ویژهٔ چارچوب؛ امکان می‌دهد توکنی را برای چارچوب OpenClaw ثابت کنید، بدون اینکه پیکربندی سراسری `gh` / Copilot CLI را مختل کنید.
   2. `COPILOT_GITHUB_TOKEN` — متغیر محیطی استاندارد Copilot SDK / CLI.
   3. `GH_TOKEN` — متغیر محیطی استاندارد CLI ابزار `gh`.
   4. `GITHUB_TOKEN` — جایگزین عمومی توکن GitHub.

   شناسهٔ نمایهٔ ساخته‌شدهٔ مخزن `env:<NAME>` است؛ نسخهٔ نمایه یک اثرانگشت sha256 برگشت‌ناپذیر از توکن است، بنابراین چرخش مقدار محیطی، مخزن کلاینت را به‌طور کامل باطل می‌کند.

5. **`useLoggedInUser` پیش‌فرض** هنگامی که هیچ نشانه‌ای از توکن موجود نیست.

هر عامل `copilotHome` ویژهٔ خود را دریافت می‌کند تا توکن‌ها، نشست‌ها و پیکربندی Copilot CLI هرگز میان عامل‌های یک دستگاه نشت نکنند. مقدار پیش‌فرض:
`<agentDir>/copilot` (وضعیت SDK را خارج از همان پوشه‌ای نگه می‌دارد که `models.json` / `auth-profiles.json` متعلق به OpenClaw در آن قرار دارد)، یا هنگامی که هیچ پوشهٔ عاملی ارائه نشده است،
`~/.openclaw/agents/<agentId>/copilot`.
برای استفاده از مکانی سفارشی (برای مثال، یک اتصال اشتراکی برای مهاجرت)، آن را با `copilotHome: <path>` در ورودی تلاش بازنویسی کنید.

آزمون‌های زندهٔ چارچوب برای یک توکن مستقیم از `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` استفاده می‌کنند. راه‌اندازی مشترک آزمون زنده، پس از آماده‌سازی نمایه‌های احراز هویت واقعی در خانهٔ آزمون ایزوله، `COPILOT_GITHUB_TOKEN`، `GH_TOKEN` و `GITHUB_TOKEN` را پاک می‌کند؛ بنابراین مقدار `gh auth token` که از طریق متغیر اختصاصی منتقل می‌شود، بدون نشت به مجموعه‌آزمون‌های نامرتبط از پرش‌های کاذب جلوگیری می‌کند.

## سطح پیکربندی

چارچوب پیکربندی را از ورودی هر تلاش (`runCopilotAttempt({...})`) به‌همراه مجموعهٔ کوچکی از مقادیر پیش‌فرض محیطی در `extensions/copilot/src/` می‌خواند:

| فیلد                    | هدف                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | پوشهٔ وضعیت CLI ویژهٔ هر عامل (مقادیر پیش‌فرض در بالا).                                                                                                                                                                                                                                                 |
| `model`                  | رشته یا `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. برای استفاده از انتخاب معمول مدل عامل، آن را حذف کنید؛ چارچوب پشتیبانی‌شدن ارائه‌دهندهٔ حل‌شده را تأیید می‌کند.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. از حل `ThinkLevel` / `ReasoningLevel` در `auto-reply/thinking.ts` متعلق به OpenClaw نگاشت می‌شود.                                                                                                                                                          |
| `infiniteSessionConfig`  | بازنویسی اختیاری برای بلوک `infiniteSessions` در SDK که توسط `harness.compact` هدایت می‌شود. رهاکردن آن به‌شکل فعلی ایمن است.                                                                                                                                                                                        |
| `hooksConfig`            | پیکربندی اختیاری و بومی `SessionHooks` در Copilot SDK برای ابزار/MCP، اعلان کاربر، نشست و بازخوانی‌های خطا. جدا از هوک‌های قابل‌حمل چرخهٔ حیات OpenClaw است.                                                                                                                                   |
| `permissionPolicy`       | بازنویسی اختیاری برای کنترل‌کنندهٔ `onPermissionRequest` در SDK برای انواع ابزار داخلی SDK (`shell`، `write`، `read`، `url`، `mcp`، `memory`، `hook`). به‌عنوان یک شبکهٔ ایمنی، مقدار پیش‌فرض `rejectAllPolicy` است؛ برای اینکه چرا عملاً هرگز فعال نمی‌شود، به [مجوزها و ask_user](#permissions-and-ask_user) مراجعه کنید. |
| `enableSessionTelemetry` | پرچم اختیاری تله‌متری نشست SDK.                                                                                                                                                                                                                                                            |

هوک‌های افزونهٔ OpenClaw به هیچ پیکربندی ویژهٔ Copilot برای تلاش نیاز ندارند. چارچوب `before_prompt_build` (و هوک سازگاری قدیمی `before_agent_start`)، `llm_input`، `llm_output` و `agent_end` را از طریق کمک‌کننده‌های استاندارد چارچوب اجرا می‌کند. Compactionهای موفق SDK همچنین `before_compaction` و `after_compaction` را اجرا می‌کنند. ابزارهای پل‌شدهٔ OpenClaw، `before_tool_call` را اجرا و `after_tool_call` را گزارش می‌کنند؛ `hooksConfig` برای بازخوانی‌های صرفاً بومی SDK که معادل قابل‌حملی ندارند باقی می‌ماند.

هیچ بخش دیگری از OpenClaw نیازی ندارد از این فیلدها آگاه باشد. سایر افزونه‌ها، کانال‌ها و کد هسته فقط قالب استاندارد `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` را می‌بینند.

## Compaction

هنگامی که `harness.compact` اجرا می‌شود، چارچوب Copilot SDK:

1. نشست پیگیری‌شدهٔ SDK را بدون ادامهٔ کارهای در انتظار از سر می‌گیرد.
2. RPC مربوط به Compaction تاریخچه در سطح نشست SDK را فراخوانی می‌کند.
3. نتیجهٔ Compaction در SDK را بدون نوشتن فایل‌های نشانگر سازگاری در فضای کاری برمی‌گرداند.

آینهٔ رونوشت در سمت OpenClaw (در ادامه) دریافت پیام‌های پس از Compaction را ادامه می‌دهد، بنابراین تاریخچهٔ گفت‌وگوی قابل‌مشاهده برای کاربر سازگار باقی می‌ماند.

## آینه‌سازی رونوشت

`runCopilotAttempt` پیام‌های قابل‌آینه‌سازی هر نوبت را هم‌زمان در رونوشت ممیزی OpenClaw و از طریق `extensions/copilot/src/dual-write-transcripts.ts` می‌نویسد. دامنهٔ آینه برای هر نشست جداست (`copilot:${sessionId}`) و برای هر پیام با `${role}:${sha256_16(role,content)}` کلیدگذاری می‌شود؛ بنابراین ورودی‌های دوباره منتشرشدهٔ نوبت‌های پیشین، به‌جای تکرار، با کلیدهای موجود روی دیسک برخورد می‌کنند.

دو لایهٔ مهار خطا پیرامون آینه قرار گرفته‌اند تا شکست در نوشتن رونوشت
هرگز باعث شکست تلاش نشود: یک پوشش داخلی با رویکرد بهترین تلاش، به‌علاوهٔ یک
`.catch(...)` دفاعی در سطح تلاش. خطاها ثبت می‌شوند، نه اینکه به سطح بالاتر
منتقل شوند.

## پرسش‌های جانبی (`/btw`)

`/btw` در این هارنس **بومی نیست**. `createCopilotAgentHarness()`
عمداً `harness.runSideQuestion` را تعریف‌نشده باقی می‌گذارد
(در `extensions/copilot/harness.test.ts`، بخش `describe("runSideQuestion")` تأیید شده است)،
بنابراین توزیع‌کنندهٔ `/btw` در OpenClaw (`src/agents/btw.ts`) به همان
مسیری می‌رود که برای همهٔ زمان‌های اجرای غیر Codex استفاده می‌کند: ارائه‌دهندهٔ مدل
پیکربندی‌شده مستقیماً با یک پرامپت کوتاهِ پرسش جانبی فراخوانی می‌شود و پاسخ از طریق
`streamSimple` به‌صورت جریانی بازگردانده می‌شود (بدون نشست CLI و بدون اشغال اسلات اضافی در مخزن).

این کار نشست‌های Copilot CLI را برای حلقهٔ اصلی نوبت عامل محفوظ نگه می‌دارد و
رفتار `/btw` را با دیگر زمان‌های اجرای غیر Codex یکسان می‌کند.

## Doctor

`extensions/copilot/doctor-contract-api.ts` به‌طور خودکار توسط
`src/plugins/doctor-contract-registry.ts` بارگذاری می‌شود. موارد زیر را ارائه می‌کند:

- یک `legacyConfigRules` خالی (هنوز هیچ فیلد بازنشسته‌ای وجود ندارد).
- یک `normalizeCompatibilityConfig` بدون عملیات (حفظ شده تا بازنشستگی‌های آیندهٔ فیلدها
  جایگاهی پایدار در درخت مخزن داشته باشند).
- یک ورودی `sessionRouteStateOwners`: ارائه‌دهندهٔ `github-copilot`، زمان اجرای
  `copilot`، کلید نشست CLI با مقدار `copilot` و پیشوند پروفایل احراز هویت `github-copilot:`.

## محدودیت‌ها

- هارنس، `github-copilot` به‌علاوهٔ شناسه‌های ارائه‌دهندهٔ سفارشی BYOK بدون مالک را بر عهده می‌گیرد.
  شناسه‌های ارائه‌دهندهٔ بومی که مالکشان در مانیفست مشخص شده است، حتی وقتی
  `agentRuntime.id` به‌اجبار روی `copilot` تنظیم شود، در زمان اجرای مالک خود باقی می‌مانند.
- هیچ سطح TUIای وجود ندارد؛ TUI مربوط به PI برای زمان‌های اجرایی که سطح همتا ندارند
  همچنان گزینهٔ بازگشتی است.
- هنگام تغییر یک عامل به `copilot`، وضعیت نشست PI مهاجرت نمی‌کند.
  انتخاب برای هر تلاش انجام می‌شود؛ نشست‌های موجود PI همچنان معتبر می‌مانند.
- `ask_user` از همان مسیر پرامپت‌وپاسخ OpenClaw استفاده می‌کند که هارنس Codex
  به کار می‌برد: وقتی SDK مربوط به Copilot ورودی کاربر را درخواست می‌کند، OpenClaw یک
  پرامپت مسدودکننده در کانال/TUI فعال ارسال می‌کند و پیام بعدی کاربر در صف،
  درخواست SDK را رفع می‌کند.

## مجوزها و ask_user

اعمال مجوز برای ابزارهای پل‌زدهٔ OpenClaw **درون پوشش ابزار**
انجام می‌شود، نه از طریق فراخوان بازگشتی `onPermissionRequest` در SDK. همان
`wrapToolWithBeforeToolCallHook` که PI استفاده می‌کند
(`src/agents/agent-tools.before-tool-call.ts`) توسط
`createOpenClawCodingTools` روی هر ابزار کدنویسی اعمال می‌شود: تشخیص حلقه، سیاست‌های
Plugin مورد اعتماد، هوک‌های پیش از فراخوانی ابزار و تأییدهای دومرحله‌ای Plugin از طریق
Gateway (`plugin.approval.request`) همگی دقیقاً از همان مسیر کدی عبور می‌کنند
که تلاش‌های بومی PI استفاده می‌کنند.

ابزار SDK که `convertOpenClawToolToSdkTool` بازمی‌گرداند با این موارد علامت‌گذاری شده است:

- `overridesBuiltInTool: true` — ابزار داخلی هم‌نام در Copilot CLI
  (edit، read، write، bash، ...) را جایگزین می‌کند تا هر فراخوانی ابزار
  دوباره به OpenClaw هدایت شود.
- `skipPermission: true` — به SDK می‌گوید پیش از فراخوانی ابزار،
  `onPermissionRequest({kind: "custom-tool"})` را اجرا نکند. تابع پوشش‌داده‌شدهٔ
  `execute()` از قبل بررسی سیاستی غنی‌تر OpenClaw را انجام می‌دهد؛ یک
  پرامپت در سطح SDK یا اعمال سیاست OpenClaw را دور می‌زند
  (اجازه به همه) یا هر فراخوانی ابزار را مسدود می‌کند (رد همه) — هیچ‌کدام
  با هم‌ارزی PI مطابقت ندارد.

هارنس Codex درون مخزن از همین تفکیک استفاده می‌کند: ابزارهای پل‌زدهٔ OpenClaw
پوشش داده می‌شوند (`extensions/codex/src/app-server/dynamic-tools.ts`) و
گونه‌های تأیید بومی خود codex-app-server
(`item/commandExecution/requestApproval`، `item/fileChange/requestApproval`،
`item/permissions/requestApproval`) از طریق `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`) هدایت می‌شوند. معادل آن در
SDK مربوط به Copilot — سیاست بسته در برابر خطای `rejectAllPolicy` برای هر گونهٔ
غیر `custom-tool` که زمانی به `onPermissionRequest` برسد — همان شبکهٔ ایمنی است و
در عمل هرگز فعال نمی‌شود، زیرا `overridesBuiltInTool: true` همهٔ ابزارهای
داخلی را کنار می‌زند.

برای اینکه لایهٔ ابزار پوشش‌داده‌شده بتواند تصمیم‌های سیاستی هم‌ارز با PI بگیرد،
هارنس تمام زمینهٔ ابزارِ تلاش PI را به
`createOpenClawCodingTools` ارسال می‌کند: هویت (`senderIsOwner`، `memberRoleIds`،
`ownerOnlyToolAllowlist`، ...)، کانال/مسیریابی (`groupId`،
`currentChannelId`، `replyToMode`، کلیدهای تغییر وضعیت ابزار پیام)، احراز هویت
(`authProfileStore`)، هویت اجرا (`sessionKey` / `runSessionKey` مشتق‌شده
از `sandboxSessionKey`، `runId`)، زمینهٔ مدل (`modelApi`،
`modelContextWindowTokens`، `modelCompat`، `modelHasVision`) و هوک‌های اجرا
(`onToolOutcome`، `onYield`). بدون این فیلدها، فهرست‌های مجاز ویژهٔ مالک
به‌طور پیش‌فرض و بی‌صدا رد می‌کنند، سیاست‌های اعتماد Plugin نمی‌توانند دامنهٔ درست
را تشخیص دهند و `session_status: "current"` به یک کلید قدیمی سندباکس
تبدیل می‌شود. سازندهٔ پل `extensions/copilot/src/tool-bridge.ts` است که
فراخوانی مرجع PI در `src/agents/embedded-agent-runner/run/attempt.ts:1262` را
بازتاب می‌دهد. `runAttempt` زمینهٔ سندباکس را از طریق درز مشترک
`resolveSandboxContext` رفع می‌کند، یک دایرکتوری کاری مؤثر به SDK می‌دهد و
`sandbox` به‌همراه فضای کاری ایجاد زیرعامل را به پل ابزار ارسال می‌کند.
پل همچنین کنترل‌های محدودشدهٔ ساخت ابزار را که می‌تواند در مرز SDK اعمال کند
ارسال می‌کند: `includeCoreTools`، فهرست مجاز ابزار زمان اجرا و
`toolConstructionPlan`.

پل همچنین برای هم‌ارزی با PI از راهکار کمکی مشترک سطح ابزار هارنس در
`openclaw/plugin-sdk/agent-harness-tool-runtime` استفاده می‌کند. وقتی
جست‌وجوی ابزار فعال باشد، SDK به‌جای همهٔ شِمای ابزارهای OpenClaw، ابزارهای کنترلی
فشرده به‌همراه یک اجراکنندهٔ پنهان کاتالوگ را می‌بیند. وقتی حالت کد فعال باشد،
راهکار کمکی همان سطح کنترل حالت کد و چرخهٔ عمر کاتالوگ مورد استفادهٔ دیگر هارنس‌های
عامل را می‌سازد. پیش‌فرض‌های سبک برای مدل محلی، پالایش شِمای سازگار با زمان اجرا،
آب‌دهی دایرکتوری و پاک‌سازی کاتالوگ همگی در راهکار کمکی مشترک باقی می‌مانند تا
هارنس‌های Copilot و مجاور Codex از یکدیگر منحرف نشوند.

### توکن GitHub در سطح نشست

قرارداد SDK مربوط به Copilot میان توکن GitHub **در سطح کلاینت**
(`CopilotClientOptions.gitHubToken`، که خود فرایند CLI را احراز هویت می‌کند)
و توکن **در سطح نشست** (`SessionConfig.gitHubToken`، که حذف محتوا،
مسیریابی مدل و سهمیهٔ آن نشست را تعیین می‌کند و در هر دو `createSession` و
`resumeSession` رعایت می‌شود) تمایز قائل است. هارنس احراز هویت را یک بار از طریق
`resolveCopilotAuth` رفع می‌کند و وقتی حالت احراز هویت `gitHubToken` باشد،
هر دو فیلد را تنظیم می‌کند (یک `auth.gitHubToken` صریح یا یک `resolvedApiKey`
حل‌شده طبق قرارداد از پروفایل احراز هویت پیکربندی‌شدهٔ `github-copilot`). وقتی حالت
حل‌شده `useLoggedInUser` باشد، فیلد سطح نشست حذف می‌شود تا SDK همچنان
هویت را از هویت واردشده استخراج کند.

`ask_user` از `SessionConfig.onUserInputRequest` استفاده می‌کند. پل برای درخواست‌های
دارای گزینه‌های ثابت، شاخص یا برچسب گزینه را می‌پذیرد؛ وقتی درخواست SDK اجازه دهد،
پاسخ‌های آزاد را می‌پذیرد؛ و هنگامی که تلاش OpenClaw متوقف شود، درخواست معلق را
لغو می‌کند.

## مرتبط

- [زمان‌های اجرای عامل](/fa/concepts/agent-runtimes)
- [هارنس Codex](/fa/plugins/codex-harness)
- [Pluginهای هارنس عامل (مرجع SDK)](/fa/plugins/sdk-agent-harness)
