---
read_when:
    - می‌خواهید از هارنس GitHub Copilot SDK برای یک عامل استفاده کنید
    - برای runtime `copilot` به نمونه‌های پیکربندی نیاز دارید
    - شما در حال متصل‌کردن یک عامل به اشتراک Copilot (github / openclaw / copilot) هستید و می‌خواهید آن را از طریق Copilot CLI اجرا کنید.
summary: اجرای نوبت‌های عامل تعبیه‌شده OpenClaw از طریق هارنس خارجی GitHub Copilot SDK
title: هارنس SDK Copilot
x-i18n:
    generated_at: "2026-06-27T18:14:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

Plugin خارجی `@openclaw/copilot` به OpenClaw اجازه می‌دهد نوبت‌های agent مربوط به Copilot اشتراکیِ تعبیه‌شده را از طریق GitHub Copilot CLI (`@github/copilot-sdk`) به‌جای harness داخلی PI اجرا کند.

وقتی می‌خواهید نشست Copilot CLI مالک حلقه سطح پایین agent باشد، از harness مربوط به Copilot SDK استفاده کنید: اجرای بومی ابزار، compaction بومی (`infiniteSessions`)، و وضعیت thread مدیریت‌شده توسط CLI زیر `copilotHome`.
OpenClaw همچنان مالک کانال‌های چت، فایل‌های نشست، انتخاب مدل، ابزارهای پویای OpenClaw (bridge شده)، تأییدها، تحویل رسانه، آینه transcript قابل مشاهده، پرسش‌های جانبی `/btw` (که با fallback درختی PI مدیریت می‌شوند — ببینید
[پرسش‌های جانبی (`/btw`)](#side-questions-btw))، و `openclaw doctor` است.

برای تفکیک گسترده‌تر مدل/ارائه‌دهنده/runtime، از
[runtimeهای agent](/fa/concepts/agent-runtimes) شروع کنید.

## الزامات

- OpenClaw با Plugin نصب‌شده `@openclaw/copilot`.
- اگر config شما از `plugins.allow` استفاده می‌کند، `copilot` (شناسه manifest اعلام‌شده توسط Plugin) را اضافه کنید. allowlist محدودکننده‌ای که از نام بسته npm-style یعنی `@openclaw/copilot` استفاده کند، Plugin را مسدود باقی می‌گذارد و runtime حتی با `agentRuntime.id: "copilot"` بارگذاری نمی‌شود.
- اشتراک GitHub Copilot که بتواند Copilot CLI را هدایت کند (یا یک ورودی env / auth-profile برای `gitHubToken` برای اجراهای headless / cron).
- یک دایرکتوری قابل نوشتن `copilotHome`. مقدار پیش‌فرض harness وقتی OpenClaw یک دایرکتوری agent فراهم کند، `<agentDir>/copilot` است؛ در غیر این صورت برای ایزوله‌سازی کامل به‌ازای هر agent، `~/.openclaw/agents/<agentId>/copilot` است.

`openclaw doctor` برای مالکیت اعلامی وضعیت نشست و مهاجرت‌های سازگاری آینده، [قرارداد doctor](#doctor) مربوط به Plugin را اجرا می‌کند. این دستور probeهای محیط Copilot CLI را اجرا نمی‌کند.

## نصب Plugin

runtime مربوط به Copilot یک Plugin خارجی است، بنابراین بسته اصلی `openclaw` وابستگی `@github/copilot-sdk` یا باینری CLI وابسته به پلتفرم آن، یعنی `@github/copilot-<platform>-<arch>`، را حمل نمی‌کند. این‌ها با هم حدود 260 MB اضافه می‌کنند، پس آن‌ها را فقط برای agentهایی نصب کنید که به این runtime opt-in می‌کنند:

```bash
openclaw plugins install @openclaw/copilot
```

wizard اولین بار که یک مدل `github-copilot/*` را انتخاب کنید **و** config شما مدل (یا provider آن) را از طریق `agentRuntime: { id: "copilot" }` وارد runtime مربوط به Copilot agent کند، Plugin را نصب می‌کند (پایین‌تر [شروع سریع](#quickstart) را ببینید).
بدون opt-in، openclaw از provider داخلی GitHub Copilot خودش استفاده می‌کند و هرگز Plugin runtime را نصب نمی‌کند.

runtime، SDK را به این ترتیب resolve می‌کند:

1. `import("@github/copilot-sdk")` از بسته نصب‌شده `@openclaw/copilot`.
2. دایرکتوری fallback شناخته‌شده `~/.openclaw/npm-runtime/copilot/` (هدف نصب on-demand قدیمی).

نبودن SDK یک خطای واحد با کد `COPILOT_SDK_MISSING` و دستور نصب مجدد Plugin در بالا نشان می‌دهد.

## شروع سریع

یک مدل (یا یک provider) را به harness پین کنید:

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

هر دو مسیر معادل‌اند. وقتی فقط همان مدل باید از طریق harness مسیریابی شود، از `agentRuntime.id` روی یک ورودی مدل استفاده کنید؛ وقتی همه مدل‌های زیر آن provider باید از آن استفاده کنند، `agentRuntime.id` را روی یک provider تنظیم کنید.

`github-copilot/auto` نقطه شروع قابل حمل است. مدل‌های نام‌دار Copilot به account و policy سازمان وابسته‌اند، پس فقط پس از تأیید اینکه Copilot CLI احرازشده آن را ارائه می‌کند، یک مدل را پین کنید.

## providerهای پشتیبانی‌شده

harness پشتیبانی از provider canonical یعنی `github-copilot` را اعلام می‌کند (همان شناسه‌ای که مالک آن `extensions/github-copilot` است):

- `github-copilot`

همچنین از ورودی‌های سفارشی `models.providers` پشتیبانی می‌کند، وقتی مدل انتخاب‌شده یک `baseUrl` غیرخالی و یکی از این شکل‌های API را داشته باشد:

- `openai-responses`
- `openai-completions`
- `ollama` (تکمیل‌های سازگار با OpenAI)
- `azure-openai-responses`
- `anthropic-messages`

شناسه‌های provider بومی مانند `openai`، `anthropic`، `google`، و `ollama` همچنان در مالکیت runtimeهای بومی خود می‌مانند. هنگام مسیریابی یک endpoint از طریق Copilot BYOK از یک شناسه provider سفارشی متمایز استفاده کنید.

endpointهای Copilot BYOK باید URLهای HTTPS شبکه عمومی باشند. harness به Copilot SDK برای هر تلاش یک URL پروکسی loopback می‌دهد، سپس ترافیک provider را از مسیر fetch محافظت‌شده OpenClaw عبور می‌دهد تا DNS pinning و policy مربوط به SSRF همچنان در مالکیت OpenClaw بمانند. برای Ollama محلی، LM Studio، یا سرورهای مدل LAN از runtime بومی OpenClaw استفاده کنید.

## BYOK

Copilot BYOK از قرارداد custom provider در سطح نشست SDK استفاده می‌کند. OpenClaw endpoint مدل resolveشده، کلید API، حالت bearer-token، headerها، شناسه مدل، و محدودیت‌های context/output را بدون انتقال منطق transport مربوط به provider به core ارسال می‌کند.

برای مثال:

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

نشست‌های BYOK جدا از نشست‌های اشتراکی و جدا از endpointها یا fingerprintهای credential دیگر کلیدگذاری می‌شوند. چرخاندن کلید، headerها، مدل، یا endpoint به‌جای از سرگیری وضعیت ناسازگار، یک نشست تازه Copilot SDK می‌سازد.

## Auth

اولویت به‌ازای هر agent، که هنگام `runCopilotAttempt` اعمال می‌شود:

1. **`useLoggedInUser: true` صریح** روی ورودی تلاش. از کاربر logged-in مربوط به Copilot CLI که زیر `copilotHome` آن agent resolve شده استفاده می‌کند.
2. **`gitHubToken` صریح** روی ورودی تلاش (با `profileId` + `profileVersion`). برای فراخوانی‌های مستقیم CLI و تست‌هایی مفید است که caller می‌خواهد resolve شدن auth-profile را دور بزند.
3. **`resolvedApiKey` + `authProfileId` resolveشده توسط قرارداد** از شکل `EmbeddedRunAttemptParams`. این **مسیر اصلی production** است: core پیش از فراخوانی harness، auth profile پیکربندی‌شده `github-copilot` مربوط به agent را (از طریق `src/infra/provider-usage.auth.ts:resolveProviderAuths`) resolve می‌کند، و harness هر دو field را مستقیماً مصرف می‌کند.
   این باعث می‌شود یک auth profile به شکل `github-copilot:<profile>` برای setupهای headless / cron / multi-profile بدون env varها، end-to-end کار کند.
4. **fallback متغیر محیطی** برای اجراهای مستقیم CLI / dogfood که هیچ auth profileای پیکربندی نشده است. runtime متغیرهای زیر را به ترتیب اولویت بررسی می‌کند و با provider منتشرشده `github-copilot` (`extensions/github-copilot/auth.ts`) و setup مستندشده Copilot SDK همسو است:
   1. `OPENCLAW_GITHUB_TOKEN` -- override مخصوص harness؛ این را تنظیم کنید تا بدون دست‌زدن به config سراسری سیستم برای `gh` / Copilot CLI، یک token را برای harness OpenClaw پین کنید.
   2. `COPILOT_GITHUB_TOKEN` -- متغیر env استاندارد Copilot SDK / CLI.
   3. `GH_TOKEN` -- متغیر env استاندارد `gh` CLI (با اولویت provider موجود `github-copilot` مطابقت دارد).
   4. `GITHUB_TOKEN` -- fallback عمومی token مربوط به GitHub.

   اولین مقدار غیرخالی برنده است؛ رشته‌های خالی غایب در نظر گرفته می‌شوند. شناسه pool profile ساخته‌شده `env:<NAME>` است و profileVersion یک fingerprint غیرقابل بازگشت sha256 از token است، بنابراین چرخاندن مقدار env به‌طور تمیز pool کلاینت را باطل می‌کند.

5. **`useLoggedInUser` پیش‌فرض** وقتی هیچ سیگنال token در دسترس نیست.

هر agent یک `copilotHome` اختصاصی می‌گیرد تا tokenها، نشست‌ها، و config مربوط به Copilot CLI بین agentهای روی یک ماشین نشت نکنند. مقدار پیش‌فرض وقتی host یک دایرکتوری agent به harness می‌دهد، `<agentDir>/copilot` است (که وضعیت SDK را از `models.json` / `auth-profiles.json` متعلق به OpenClaw در همان دایرکتوری ایزوله می‌کند)، و در غیر این صورت `~/.openclaw/agents/<agentId>/copilot` است.
وقتی به یک مکان سفارشی نیاز دارید (برای مثال، یک mount مشترک برای migration)، روی ورودی تلاش با `copilotHome: <path>` override کنید.

تست‌های زنده harness وقتی یک token مستقیم لازم باشد از `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` استفاده می‌کنند. setup مشترک live-test عمداً پس از stage کردن auth profileهای واقعی در test home ایزوله، `COPILOT_GITHUB_TOKEN`، `GH_TOKEN`، و `GITHUB_TOKEN` را پاک می‌کند؛ بنابراین عبور دادن مقدار `gh auth token` از طریق متغیر اختصاصی live-test از skipهای کاذب جلوگیری می‌کند بدون اینکه token را در معرض suiteهای نامرتبط قرار دهد.

## سطح پیکربندی

harness پیکربندی خود را از ورودی به‌ازای هر تلاش (`runCopilotAttempt({...})`) به‌علاوه مجموعه کوچکی از پیش‌فرض‌های env داخل `extensions/copilot/src/` می‌خواند:

- `copilotHome` — دایرکتوری وضعیت CLI به‌ازای هر agent (پیش‌فرض‌ها در بالا مستند شده‌اند).
- `model` — رشته یا `{ provider, id, api?, baseUrl?, headers?, authHeader? }`.
  وقتی حذف شود، OpenClaw از انتخاب مدل عادی agent استفاده می‌کند و harness تأیید می‌کند provider resolveشده پشتیبانی می‌شود.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. از resolve شدن `ThinkLevel` / `ReasoningLevel` متعلق به OpenClaw در `auto-reply/thinking.ts` map می‌شود.
- `infiniteSessionConfig` — override اختیاری برای بلوک `infiniteSessions` در SDK که توسط `harness.compact` هدایت می‌شود. گذاشتن پیش‌فرض‌ها به همان شکل امن است.
- `hooksConfig` — config اختیاری سازگاری `SessionHooks` بومی Copilot SDK برای callbackهای tool/MCP، user-prompt، session، و error.
  این از hookهای lifecycle قابل حمل OpenClaw جدا است.
- `permissionPolicy` — override اختیاری برای handler مربوط به `onPermissionRequest` در SDK که برای گونه‌های ابزار داخلی SDK (`shell`، `write`، `read`، `url`، `mcp`، `memory`، `hook`) استفاده می‌شود. به‌عنوان یک safety net مقدار پیش‌فرض آن `rejectAllPolicy` است؛ در عمل SDK هرگز هیچ‌کدام از آن گونه‌ها را فراخوانی نمی‌کند، چون هر ابزار bridge‌شده OpenClaw با `overridesBuiltInTool: true` و `skipPermission: true` ثبت می‌شود تا 100٪ فراخوانی‌های ابزار از `execute()` پیچیده‌شده OpenClaw عبور کنند. ببینید [مجوزها و ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — flag اختیاری telemetry نشست SDK.

hookهای Plugin در OpenClaw به پیکربندی تلاش مخصوص Copilot نیاز ندارند. harness، `before_prompt_build` (و hook سازگاری قدیمی `before_agent_start`)، `llm_input`، `llm_output`، و `agent_end` را از طریق helperهای استاندارد harness اجرا می‌کند. compactionهای موفق SDK همچنین `before_compaction` و `after_compaction` را اجرا می‌کنند. ابزارهای bridge‌شده OpenClaw همچنان `before_tool_call` را اجرا می‌کنند و `after_tool_call` را گزارش می‌دهند؛ `hooksConfig` برای callbackهای فقط SDK بومی که معادل قابل حمل ندارند باقی می‌ماند.

هیچ چیز در بقیه OpenClaw لازم نیست درباره این fieldها بداند. سایر Pluginها، کانال‌ها، و کد core فقط شکل استاندارد `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` را می‌بینند.

## Compaction

وقتی `harness.compact` اجرا می‌شود، harness مربوط به Copilot SDK:

1. نشست SDK ردیابی‌شده را بدون ادامه دادن کار معلق از سر می‌گیرد.
2. RPC مربوط به compaction تاریخچه در محدوده نشست SDK را فراخوانی می‌کند.
3. نتیجه compaction SDK را بدون نوشتن فایل‌های marker سازگاری زیر workspace برمی‌گرداند.

آینه transcript سمت OpenClaw (پایین‌تر ببینید) همچنان پیام‌های پس از compaction را دریافت می‌کند، بنابراین تاریخچه چت قابل مشاهده برای کاربر سازگار می‌ماند.

## آینه‌سازی transcript

`runCopilotAttempt` پیام‌های قابل آینه‌سازی هر turn را از طریق `extensions/copilot/src/dual-write-transcripts.ts` به‌صورت dual-write در audit transcript متعلق به OpenClaw می‌نویسد. آینه در محدوده هر نشست است (`copilot:${sessionId}`) و از یک هویت به‌ازای هر پیام (`${role}:${sha256_16(role,content)}`) استفاده می‌کند تا انتشارهای مجدد ورودی‌های turn قبلی با کلیدهای موجود روی دیسک برخورد کنند و تکراری نشوند.

آینه در دو لایه containment خطا پیچیده شده تا شکست در نوشتن transcript نتواند تلاش را شکست دهد: یک wrapper داخلی best-effort و یک `.catch(...)` دفاعی عمیق در سطح تلاش. شکست‌ها log می‌شوند اما نمایش داده نمی‌شوند.

## پرسش‌های جانبی (`/btw`)

`/btw` در این هارنس **بومی نیست**. `createCopilotAgentHarness()`
عمدا `harness.runSideQuestion` را تعریف‌نشده می‌گذارد، بنابراین توزیع‌کننده `/btw`
در OpenClaw (`src/agents/btw.ts`) به همان مسیر fallback درون‌درختی PI می‌افتد
که برای هر زمان‌اجرای غیر Codex استفاده می‌کند: ارائه‌دهنده مدل پیکربندی‌شده
مستقیما با یک پرامپت کوتاه پرسش جانبی فراخوانی می‌شود و از طریق
`streamSimple` بازپخش می‌شود (بدون نشست CLI، بدون اسلات اضافی pool).

این کار نشست‌های Copilot CLI را برای چرخه اصلی نوبت عامل رزرو نگه می‌دارد و
رفتار `/btw` را با دیگر زمان‌اجراهای مبتنی بر PI یکسان نگه می‌دارد. این قرارداد در
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
زیر `describe("runSideQuestion")` تصریح شده است.

## Doctor

`extensions/copilot/doctor-contract-api.ts` به‌طور خودکار توسط
`src/plugins/doctor-contract-registry.ts` بارگذاری می‌شود. این موارد را فراهم می‌کند:

- یک `legacyConfigRules` خالی (بدون فیلد بازنشسته در MVP).
- یک `normalizeCompatibilityConfig` بدون عملیات (نگه داشته شده تا بازنشستگی‌های
  فیلد در آینده یک خانه پایدار درون‌درختی داشته باشند).
- یک ورودی `sessionRouteStateOwners` که ارائه‌دهنده `github-copilot`؛
  زمان‌اجرای `copilot`؛ کلید نشست CLI با مقدار `copilot`؛ و پیشوند پروفایل احراز هویت
  `github-copilot:` را مطالبه می‌کند.

## محدودیت‌ها

- هارنس، `github-copilot` به‌علاوه شناسه‌های ارائه‌دهنده BYOK سفارشی بدون مالک را
  مطالبه می‌کند. شناسه‌های ارائه‌دهنده بومیِ متعلق به manifest حتی وقتی
  `agentRuntime.id` به‌اجبار `copilot` شود، روی زمان‌اجرای مالک خود باقی می‌مانند.
- هارنس TUI را تحویل نمی‌دهد؛ TUI مربوط به PI بدون تغییر است و برای هر زمان‌اجرایی
  که سطح همتا ندارد، fallback باقی می‌ماند.
- وقتی یک عامل به `copilot` تغییر می‌کند، وضعیت نشست PI مهاجرت داده نمی‌شود.
  انتخاب به‌ازای هر تلاش است؛ نشست‌های PI موجود معتبر باقی می‌مانند.
- `ask_user` از همان مسیر پرامپت‌وپاسخ OpenClaw استفاده می‌کند که هارنس Codex
  استفاده می‌کند. وقتی Copilot SDK از کاربر ورودی می‌خواهد، OpenClaw یک پرامپت
  مسدودکننده به کانال/TUI فعال ارسال می‌کند و پیام کاربر بعدی در صف، درخواست SDK
  را حل می‌کند.

## مجوزها و ask_user

اعمال مجوز برای ابزارهای پل‌زده OpenClaw **داخل wrapper ابزار** انجام می‌شود،
نه از طریق callback با نام `onPermissionRequest` در SDK. همان
`wrapToolWithBeforeToolCallHook` که PI استفاده می‌کند
(`src/agents/pi-tools.before-tool-call.ts`) توسط `createOpenClawCodingTools`
روی هر ابزار کدنویسی اعمال می‌شود: تشخیص loop، سیاست‌های Plugin معتمد،
hookهای پیش از فراخوانی ابزار، و تاییدهای دومرحله‌ای Plugin از طریق Gateway
(`plugin.approval.request`) همگی با دقیقا همان مسیر کدی اجرا می‌شوند که تلاش‌های
PI بومی استفاده می‌کنند.

برای اینکه آن wrapper مالک تصمیم باشد، ابزار SDK برگشتی از
`convertOpenClawToolToSdkTool` با این موارد علامت‌گذاری می‌شود:

- `overridesBuiltInTool: true` — ابزار داخلی هم‌نام Copilot CLI
  (edit، read، write، bash، …) را جایگزین می‌کند تا هر فراخوانی ابزار
  دوباره به OpenClaw مسیریابی شود.
- `skipPermission: true` — به SDK می‌گوید پیش از فراخوانی ابزار،
  `onPermissionRequest({kind: "custom-tool"})` را اجرا نکند.
  `execute()` بسته‌بندی‌شده، بررسی سیاست غنی‌تر OpenClaw را به‌صورت داخلی انجام
  می‌دهد؛ یک پرامپت در سطح SDK یا اعمال OpenClaw را دور می‌زند (اگر allow-all
  کنیم) یا هر فراخوانی ابزار را مسدود می‌کند (اگر reject-all کنیم) — هیچ‌کدام
  با هم‌ارزی PI سازگار نیست.

هارنس codex درون‌درختی از همین تفکیک استفاده می‌کند: ابزارهای پل‌زده OpenClaw
بسته‌بندی می‌شوند (`extensions/codex/src/app-server/dynamic-tools.ts`) و گونه‌های
تایید بومیِ خود codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) از طریق
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`) مسیریابی می‌شوند. معادل آن
در Copilot SDK — `rejectAllPolicy` fail-closed برای هر گونه غیر `custom-tool`
که به `onPermissionRequest` برسد — همان شبکه ایمنی است، و در عمل اجرا نمی‌شود
چون `overridesBuiltInTool: true` هر ابزار داخلی را کنار می‌زند.

برای اینکه لایه ابزار بسته‌بندی‌شده تصمیم‌های سیاستی هم‌ارز PI بگیرد، هارنس
کل زمینه ابزارِ تلاش PI را به `createOpenClawCodingTools` منتقل می‌کند — هویت
(`senderIsOwner`, `memberRoleIds`, `ownerOnlyToolAllowlist`, …)، کانال/مسیریابی
(`groupId`, `currentChannelId`, `replyToMode`, تغییر وضعیت‌های message-tool)،
احراز هویت (`authProfileStore`)، هویت اجرا
(`sessionKey`/`runSessionKey` مشتق‌شده از `sandboxSessionKey`,
`runId`)، زمینه مدل (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`)، و hookهای اجرا (`onToolOutcome`,
`onYield`). بدون این فیلدها، allowlistهای فقط-مالک به‌صورت بی‌صدا مانند
deny-by-default رفتار می‌کنند، سیاست‌های اعتماد Plugin نمی‌توانند به دامنه درست
حل شوند، و `session_status: "current"` به یک کلید sandbox کهنه حل می‌شود.
سازنده bridge در `extensions/copilot/src/tool-bridge.ts` است و فراخوانی مرجع PI
را در `src/agents/pi-embedded-runner/run/attempt.ts:1029-1117` بازتاب می‌دهد.
`runAttempt` از قبل زمینه sandbox را از طریق درز مشترک `resolveSandboxContext`
حل می‌کند، یک دایرکتوری کاری موثر را به SDK می‌دهد، و `sandbox` به‌علاوه فضای
کاری spawn زیرعامل را به tool bridge منتقل می‌کند. bridge همچنین کنترل‌های
محدود ساخت ابزار را که می‌تواند در مرز SDK اعمال کند منتقل می‌کند: `includeCoreTools`،
allowlist ابزار زمان‌اجرا، و `toolConstructionPlan`.

bridge همچنین برای هم‌ارزی PI از helper سطح ابزار هارنس مشترک در
`openclaw/plugin-sdk/agent-harness-tool-runtime` استفاده می‌کند. وقتی tool-search
فعال باشد، SDK به‌جای هر schema ابزار OpenClaw، ابزارهای کنترلی فشرده به‌همراه
یک اجراکننده catalog پنهان را می‌بیند. وقتی code mode فعال باشد، helper همان
سطح کنترل code-mode و چرخه عمر catalog را می‌سازد که دیگر هارنس‌های عامل استفاده
می‌کنند. پیش‌فرض‌های سبک برای مدل محلی، فیلتر کردن schema سازگار با زمان‌اجرا،
آب‌رسانی دایرکتوری، و پاک‌سازی catalog همگی در helper مشترک می‌مانند تا هارنس‌های
Copilot و مجاور Codex دچار انحراف نشوند.

### توکن GitHub در سطح نشست

قرارداد Copilot SDK بین توکن GitHub در **سطح کلاینت**
(`CopilotClientOptions.gitHubToken`، استفاده‌شده برای احراز هویت خود فرایند
CLI) و توکن در **سطح نشست** (`SessionConfig.gitHubToken`، که exclusion محتوا،
مسیریابی مدل، و quota را برای آن نشست تعیین می‌کند و هم در `createSession` و هم
در `resumeSession` رعایت می‌شود) تمایز می‌گذارد. هارنس احراز هویت را یک‌بار از
طریق `resolveCopilotAuth` حل می‌کند و وقتی حالت احراز هویت `gitHubToken` باشد
(یک `auth.gitHubToken` صریح یا یک `resolvedApiKey` حل‌شده طبق قرارداد از یک
پروفایل احراز هویت `github-copilot` پیکربندی‌شده)، هر دو فیلد را تنظیم می‌کند.
وقتی حالت حل‌شده `useLoggedInUser` باشد، فیلد سطح نشست حذف می‌شود تا SDK همچنان
هویت را از هویت واردشده استخراج کند.

`ask_user` از `SessionConfig.onUserInputRequest` استفاده می‌کند. bridge برای
درخواست‌های با گزینه ثابت، اندیس‌ها یا برچسب‌های گزینه را می‌پذیرد، وقتی درخواست
SDK اجازه دهد پاسخ‌های آزاد را می‌پذیرد، و وقتی تلاش OpenClaw لغو شود، درخواست
در انتظار را لغو می‌کند.

## مرتبط

- [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes)
- [هارنس Codex](/fa/plugins/codex-harness)
- [Pluginهای هارنس عامل (مرجع SDK)](/fa/plugins/sdk-agent-harness)
