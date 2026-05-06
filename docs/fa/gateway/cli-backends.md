---
read_when:
    - وقتی ارائه‌دهندگان API دچار مشکل می‌شوند، به یک گزینهٔ جایگزین قابل اعتماد نیاز دارید
    - شما Codex CLI یا دیگر CLIهای هوش مصنوعی محلی را اجرا می‌کنید و می‌خواهید دوباره از آن‌ها استفاده کنید
    - می‌خواهید پل حلقه‌بازگشتی MCP را برای دسترسی به ابزارهای بک‌اند CLI درک کنید
summary: 'بک‌اندهای CLI: مسیر جایگزین محلی CLI هوش مصنوعی با پل اختیاری ابزار MCP'
title: بک‌اندهای CLI
x-i18n:
    generated_at: "2026-05-06T09:16:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffba26a7471dd1f1c0b542187126ad45ff09a507c4eb737682d88b0085f4c5d5
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw می‌تواند **CLIهای AI محلی** را به‌عنوان یک **مسیر جایگزین فقط متنی** اجرا کند، زمانی که ارائه‌دهندگان API از کار افتاده‌اند،
با محدودیت نرخ مواجه شده‌اند، یا به‌طور موقت رفتار نادرستی دارند. این رویکرد عمدا محافظه‌کارانه است:

- **ابزارهای OpenClaw مستقیما تزریق نمی‌شوند**، اما بک‌اندهایی با `bundleMcp: true`
  می‌توانند ابزارهای Gateway را از طریق یک پل MCP روی loopback دریافت کنند.
- **استریم JSONL** برای CLIهایی که از آن پشتیبانی می‌کنند.
- **جلسه‌ها پشتیبانی می‌شوند** (بنابراین نوبت‌های پیگیری منسجم می‌مانند).
- **تصاویر می‌توانند عبور داده شوند** اگر CLI مسیرهای تصویر را بپذیرد.

این به‌جای یک مسیر اصلی، به‌عنوان یک **شبکه ایمنی** طراحی شده است. زمانی از آن استفاده کنید که
پاسخ‌های متنی «همیشه کار می‌کند» را بدون تکیه بر APIهای خارجی می‌خواهید.

اگر یک runtime کامل harness با کنترل‌های جلسه ACP، کارهای پس‌زمینه،
اتصال نخ/گفت‌وگو، و جلسه‌های کدنویسی خارجی پایدار می‌خواهید، به‌جای آن از
[عامل‌های ACP](/fa/tools/acp-agents) استفاده کنید. بک‌اندهای CLI، ACP نیستند.

## شروع سریع مناسب مبتدیان

می‌توانید از Codex CLI **بدون هیچ پیکربندی** استفاده کنید (Plugin بسته‌بندی‌شده OpenAI
یک بک‌اند پیش‌فرض ثبت می‌کند):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

اگر gateway شما تحت launchd/systemd اجرا می‌شود و PATH حداقلی است، فقط مسیر
دستور را اضافه کنید:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

همین است. هیچ کلید یا پیکربندی احراز هویت اضافه‌ای فراتر از خود CLI لازم نیست.

اگر از یک بک‌اند CLI بسته‌بندی‌شده به‌عنوان **ارائه‌دهنده اصلی پیام** روی یک
میزبان gateway استفاده می‌کنید، اکنون OpenClaw هنگامی که پیکربندی شما
به‌صورت صریح در یک ارجاع مدل یا زیر `agents.defaults.cliBackends` به آن بک‌اند
اشاره کند، Plugin بسته‌بندی‌شده مالک را به‌طور خودکار بارگذاری می‌کند.

## استفاده از آن به‌عنوان مسیر جایگزین

یک بک‌اند CLI را به فهرست fallback خود اضافه کنید تا فقط وقتی مدل‌های اصلی شکست می‌خورند اجرا شود:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

نکته‌ها:

- اگر از `agents.defaults.models` (فهرست مجاز) استفاده می‌کنید، باید مدل‌های بک‌اند CLI خود را نیز آنجا اضافه کنید.
- اگر ارائه‌دهنده اصلی شکست بخورد (احراز هویت، محدودیت نرخ، timeoutها)، OpenClaw
  در ادامه بک‌اند CLI را امتحان می‌کند.

## نمای کلی پیکربندی

همه بک‌اندهای CLI زیر این بخش قرار می‌گیرند:

```
agents.defaults.cliBackends
```

هر ورودی با یک **شناسه ارائه‌دهنده** کلیدگذاری می‌شود (مثلا `codex-cli`، `my-cli`).
شناسه ارائه‌دهنده به سمت چپ ارجاع مدل شما تبدیل می‌شود:

```
<provider>/<model>
```

### نمونه پیکربندی

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## روش کار

1. **یک بک‌اند را انتخاب می‌کند** بر اساس پیشوند ارائه‌دهنده (`codex-cli/...`).
2. **یک system prompt می‌سازد** با استفاده از همان prompt و زمینه workspace در OpenClaw.
3. **CLI را اجرا می‌کند** با یک شناسه جلسه (اگر پشتیبانی شود) تا تاریخچه سازگار بماند.
   بک‌اند بسته‌بندی‌شده `claude-cli` برای هر جلسه OpenClaw یک پردازش stdio از Claude را زنده نگه می‌دارد
   و نوبت‌های پیگیری را از طریق stdin با stream-json ارسال می‌کند.
4. **خروجی را parse می‌کند** (JSON یا متن ساده) و متن نهایی را برمی‌گرداند.
5. **شناسه‌های جلسه را ذخیره می‌کند** برای هر بک‌اند، تا پیگیری‌ها دوباره از همان جلسه CLI استفاده کنند.

<Note>
بک‌اند بسته‌بندی‌شده Anthropic با نام `claude-cli` دوباره پشتیبانی می‌شود. کارکنان Anthropic
به ما گفته‌اند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw
استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز در نظر می‌گیرد مگر اینکه Anthropic
سیاست جدیدی منتشر کند.
</Note>

بک‌اند بسته‌بندی‌شده OpenAI با نام `codex-cli`، system prompt متعلق به OpenClaw را از طریق
override پیکربندی `model_instructions_file` در Codex عبور می‌دهد (`-c
model_instructions_file="..."`). Codex یک flag مشابه Claude با نام
`--append-system-prompt` ارائه نمی‌کند، بنابراین OpenClaw برای هر جلسه تازه Codex CLI،
prompt مونتاژشده را در یک فایل موقت می‌نویسد.

بک‌اند بسته‌بندی‌شده Anthropic با نام `claude-cli` snapshot مربوط به Skills در OpenClaw را
از دو مسیر دریافت می‌کند: کاتالوگ فشرده Skills در OpenClaw در system prompt پیوست‌شده، و
یک Plugin موقت Claude Code که با `--plugin-dir` ارسال می‌شود. این Plugin فقط شامل
Skills واجد شرایط برای آن عامل/جلسه است، بنابراین resolver بومی skill در Claude Code
همان مجموعه فیلترشده‌ای را می‌بیند که OpenClaw در غیر این صورت در prompt اعلام می‌کرد.
overrideهای env/API key مربوط به skill همچنان توسط OpenClaw روی محیط پردازش فرزند
برای اجرا اعمال می‌شوند.

Claude CLI حالت مجوز غیرتعاملی خودش را نیز دارد. OpenClaw به‌جای افزودن پیکربندی
مخصوص Claude، آن را به سیاست exec موجود نگاشت می‌کند: وقتی سیاست exec موثر درخواست‌شده
YOLO باشد (`tools.exec.security: "full"` و `tools.exec.ask: "off"`)، OpenClaw
`--permission-mode bypassPermissions` را اضافه می‌کند. تنظیمات
`agents.list[].tools.exec` در سطح هر عامل، `tools.exec` سراسری را برای آن عامل override
می‌کند. برای اجبار یک حالت متفاوت Claude، آرگومان‌های خام صریح بک‌اند مثل
`--permission-mode default` یا `--permission-mode acceptEdits` را زیر
`agents.defaults.cliBackends.claude-cli.args` و `resumeArgs` متناظر تنظیم کنید.

بک‌اند بسته‌بندی‌شده Anthropic با نام `claude-cli` همچنین سطوح `/think` در OpenClaw را
برای سطوح غیر off به flag بومی `--effort` در Claude Code نگاشت می‌کند. `minimal` و
`low` به `low` نگاشت می‌شوند، `adaptive` و `medium` به `medium` نگاشت می‌شوند، و `high`،
`xhigh`، و `max` مستقیما نگاشت می‌شوند. بک‌اندهای CLI دیگر پیش از آنکه `/think` بتواند
روی CLI ایجادشده اثر بگذارد، نیاز دارند Plugin مالکشان یک mapper معادل برای argv
اعلام کند.

پیش از آنکه OpenClaw بتواند از بک‌اند بسته‌بندی‌شده `claude-cli` استفاده کند، خود Claude Code
باید از قبل روی همان میزبان وارد شده باشد:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

فقط زمانی از `agents.defaults.cliBackends.claude-cli.command` استفاده کنید که باینری `claude`
از قبل روی `PATH` نیست.

## جلسه‌ها

- اگر CLI از جلسه‌ها پشتیبانی می‌کند، `sessionArg` (مثلا `--session-id`) یا
  `sessionArgs` (placeholder `{sessionId}`) را زمانی تنظیم کنید که شناسه باید
  در چند flag درج شود.
- اگر CLI از یک **زیردستور resume** با flagهای متفاوت استفاده می‌کند، `resumeArgs`
  (هنگام resume جایگزین `args` می‌شود) و به‌صورت اختیاری `resumeOutput`
  (برای resumeهای غیر JSON) را تنظیم کنید.
- `sessionMode`:
  - `always`: همیشه یک شناسه جلسه ارسال می‌کند (اگر هیچ‌کدام ذخیره نشده باشد، UUID جدید).
  - `existing`: فقط اگر قبلا شناسه‌ای ذخیره شده باشد، شناسه جلسه را ارسال می‌کند.
  - `none`: هرگز شناسه جلسه ارسال نمی‌کند.
- `claude-cli` به‌طور پیش‌فرض روی `liveSession: "claude-stdio"`، `output: "jsonl"`،
  و `input: "stdin"` تنظیم می‌شود تا نوبت‌های پیگیری تا زمانی که پردازش live Claude
  فعال است، دوباره از آن استفاده کنند. stdio گرم اکنون پیش‌فرض است، از جمله برای
  پیکربندی‌های سفارشی که فیلدهای transport را حذف می‌کنند. اگر Gateway راه‌اندازی مجدد شود
  یا پردازش idle خارج شود، OpenClaw از شناسه جلسه ذخیره‌شده Claude ادامه می‌دهد.
  شناسه‌های جلسه ذخیره‌شده پیش از resume در برابر یک transcript پروژه موجود و خواندنی
  بررسی می‌شوند، بنابراین اتصال‌های phantom با `reason=transcript-missing` پاک می‌شوند
  به‌جای اینکه بی‌صدا یک جلسه تازه Claude CLI زیر `--resume` شروع شود.
- جلسه‌های live در Claude محافظ‌های محدودکننده خروجی JSONL دارند. پیش‌فرض‌ها تا
  8 MiB و 20,000 خط خام JSONL را در هر نوبت مجاز می‌کنند. نوبت‌های Claude با ابزارهای زیاد
  می‌توانند این محدودیت‌ها را برای هر بک‌اند با
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و `maxTurnLines` افزایش دهند؛ OpenClaw این تنظیمات را به 64 MiB و 100,000
  خط clamp می‌کند.
- جلسه‌های CLI ذخیره‌شده، تداوم تحت مالکیت ارائه‌دهنده هستند. reset روزانه ضمنی
  آن‌ها را قطع نمی‌کند؛ `/reset` و سیاست‌های صریح `session.reset` همچنان این کار را
  انجام می‌دهند.

نکته‌های serialization:

- `serialize: true` اجرای همان lane را مرتب نگه می‌دارد.
- بیشتر CLIها روی یک lane ارائه‌دهنده serialize می‌شوند.
- OpenClaw وقتی هویت احراز هویت انتخاب‌شده تغییر کند، استفاده دوباره از جلسه CLI ذخیره‌شده را کنار می‌گذارد،
  از جمله تغییر شناسه auth profile، static API key، static token، یا هویت حساب OAuth
  وقتی CLI آن را ارائه کند. چرخش توکن‌های دسترسی و refresh در OAuth، جلسه CLI ذخیره‌شده را
  قطع نمی‌کند. اگر یک CLI شناسه پایدار حساب OAuth ارائه نکند، OpenClaw اجازه می‌دهد
  همان CLI مجوزهای resume را اعمال کند.

## مقدمه fallback از جلسه‌های claude-cli

وقتی تلاش `claude-cli` به یک گزینه غیر CLI در
[`agents.defaults.model.fallbacks`](/fa/concepts/model-failover) fail over می‌کند، OpenClaw
تلاش بعدی را با یک مقدمه زمینه‌ای seed می‌کند که از transcript محلی JSONL متعلق به
Claude Code در `~/.claude/projects/` برداشت شده است. بدون این seed، ارائه‌دهنده fallback
از ابتدا و بدون زمینه شروع می‌کرد، چون transcript جلسه خود OpenClaw برای اجراهای
`claude-cli` خالی است.

- مقدمه، جدیدترین خلاصه `/compact` یا marker `compact_boundary` را ترجیح می‌دهد،
  سپس تازه‌ترین نوبت‌های پس از boundary را تا سقف بودجه نویسه اضافه می‌کند. نوبت‌های
  پیش از boundary حذف می‌شوند چون خلاصه از قبل نماینده آن‌هاست.
- بلوک‌های ابزار به hintهای فشرده `(tool call: name)` و
  `(tool result: …)` ادغام می‌شوند تا بودجه prompt دقیق بماند. اگر خلاصه سرریز شود،
  با `(truncated)` برچسب می‌خورد.
- fallbackهای `claude-cli` به `claude-cli` با همان ارائه‌دهنده به `--resume` خود Claude
  تکیه می‌کنند و از مقدمه صرف‌نظر می‌کنند.
- این seed از همان اعتبارسنجی مسیر فایل جلسه Claude موجود استفاده می‌کند، بنابراین
  مسیرهای دلخواه قابل خواندن نیستند.

## تصاویر (عبور مستقیم)

اگر CLI شما مسیرهای تصویر را می‌پذیرد، `imageArg` را تنظیم کنید:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw تصاویر base64 را در فایل‌های موقت می‌نویسد. اگر `imageArg` تنظیم شده باشد، آن
مسیرها به‌عنوان آرگومان‌های CLI ارسال می‌شوند. اگر `imageArg` وجود نداشته باشد، OpenClaw
مسیرهای فایل را به prompt اضافه می‌کند (تزریق مسیر)، که برای CLIهایی که فایل‌های محلی را
به‌طور خودکار از مسیرهای ساده بارگذاری می‌کنند کافی است.

## ورودی‌ها / خروجی‌ها

- `output: "json"` (پیش‌فرض) تلاش می‌کند JSON را parse کند و متن + شناسه جلسه را استخراج کند.
- برای خروجی JSON در Gemini CLI، OpenClaw متن پاسخ را از `response` و
  usage را از `stats` می‌خواند، زمانی که `usage` وجود ندارد یا خالی است.
- `output: "jsonl"` استریم‌های JSONL را parse می‌کند (برای مثال Codex CLI `--json`) و پیام نهایی عامل به‌همراه
  شناسه‌های جلسه را در صورت وجود استخراج می‌کند.
- `output: "text"` stdout را به‌عنوان پاسخ نهایی در نظر می‌گیرد.

حالت‌های ورودی:

- `input: "arg"` (پیش‌فرض) prompt را به‌عنوان آخرین آرگومان CLI ارسال می‌کند.
- `input: "stdin"` prompt را از طریق stdin ارسال می‌کند.
- اگر prompt بسیار طولانی باشد و `maxPromptArgChars` تنظیم شده باشد، از stdin استفاده می‌شود.

## پیش‌فرض‌ها (تحت مالکیت Plugin)

Plugin بسته‌بندی‌شده OpenAI همچنین یک پیش‌فرض برای `codex-cli` ثبت می‌کند:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin بسته‌بندی‌شده Google نیز یک پیش‌فرض برای `google-gemini-cli` ثبت می‌کند:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

پیش‌نیاز: Gemini CLI محلی باید نصب شده باشد و به‌عنوان
`gemini` روی `PATH` در دسترس باشد (`brew install gemini-cli` یا
`npm install -g @google/gemini-cli`).

نکته‌های JSON برای Gemini CLI:

- متن پاسخ از فیلد JSON `response` خوانده می‌شود.
- وقتی `usage` وجود نداشته باشد یا خالی باشد، استفاده به `stats` برمی‌گردد.
- `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
- اگر `stats.input` وجود نداشته باشد، OpenClaw توکن‌های ورودی را از
  `stats.input_tokens - stats.cached` به‌دست می‌آورد.

فقط در صورت نیاز بازنویسی کنید (مورد رایج: مسیر مطلق `command`).

## پیش‌فرض‌های متعلق به Plugin

پیش‌فرض‌های بک‌اند CLI اکنون بخشی از سطح Plugin هستند:

- Pluginها آن‌ها را با `api.registerCliBackend(...)` ثبت می‌کنند.
- `id` بک‌اند به پیشوند ارائه‌دهنده در ارجاع‌های مدل تبدیل می‌شود.
- پیکربندی کاربر در `agents.defaults.cliBackends.<id>` همچنان پیش‌فرض Plugin را بازنویسی می‌کند.
- پاک‌سازی پیکربندی مخصوص بک‌اند از طریق قلاب اختیاری
  `normalizeConfig` همچنان متعلق به Plugin می‌ماند.

Pluginهایی که به شیم‌های کوچک سازگاری پرامپت/پیام نیاز دارند، می‌توانند
تبدیل‌های متنی دوسویه را بدون جایگزین‌کردن یک ارائه‌دهنده یا بک‌اند CLI اعلام کنند:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` پرامپت سیستم و پرامپت کاربر ارسال‌شده به CLI را بازنویسی می‌کند. `output`
دلتاهای دستیارِ استریم‌شده و متن نهاییِ تجزیه‌شده را پیش از آن‌که OpenClaw
نشانگرهای کنترلی و تحویل کانال خودش را مدیریت کند، بازنویسی می‌کند.

برای CLIهایی که JSONL سازگار با Claude Code stream-json منتشر می‌کنند،
`jsonlDialect: "claude-stream-json"` را در پیکربندی آن بک‌اند تنظیم کنید.

## هم‌پوشانی‌های MCP بسته‌بندی‌شده

بک‌اندهای CLI فراخوانی‌های ابزار OpenClaw را به‌طور مستقیم دریافت نمی‌کنند، اما یک بک‌اند می‌تواند
با `bundleMcp: true` استفاده از هم‌پوشانی پیکربندی MCP تولیدشده را فعال کند.

رفتار بسته‌بندی‌شده فعلی:

- `claude-cli`: فایل پیکربندی سخت‌گیرانه MCP تولیدشده
- `codex-cli`: بازنویسی‌های پیکربندی درون‌خطی برای `mcp_servers`؛ سرور loopback
  تولیدشده OpenClaw با حالت تأیید ابزارِ هر-سرورِ Codex علامت‌گذاری می‌شود
  تا فراخوانی‌های MCP نتوانند روی اعلان‌های تأیید محلی متوقف شوند
- `google-gemini-cli`: فایل تنظیمات سیستم Gemini تولیدشده

وقتی MCP بسته‌بندی‌شده فعال باشد، OpenClaw:

- یک سرور HTTP MCP از نوع loopback راه‌اندازی می‌کند که ابزارهای Gateway را در اختیار فرایند CLI قرار می‌دهد
- پل را با یک توکن مخصوص هر نشست (`OPENCLAW_MCP_TOKEN`) احراز هویت می‌کند
- دسترسی ابزار را به زمینه نشست، حساب، و کانال فعلی محدود می‌کند
- سرورهای bundle-MCP فعال‌شده را برای workspace فعلی بارگذاری می‌کند
- آن‌ها را با هر شکل موجودِ پیکربندی/تنظیمات MCP بک‌اند ادغام می‌کند
- پیکربندی راه‌اندازی را با استفاده از حالت یکپارچه‌سازی متعلق به بک‌اند از افزونه مالک بازنویسی می‌کند

اگر هیچ سرور MCP فعال نباشد، وقتی یک بک‌اند استفاده از MCP بسته‌بندی‌شده را فعال کند،
OpenClaw همچنان یک پیکربندی سخت‌گیرانه تزریق می‌کند تا اجراهای پس‌زمینه ایزوله بمانند.

زمان‌اجراهای MCP بسته‌بندی‌شده با دامنه نشست برای استفاده دوباره در همان نشست کش می‌شوند، سپس
پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بیکاری جمع‌آوری می‌شوند (پیش‌فرض ۱۰
دقیقه؛ برای غیرفعال‌کردن روی `0` تنظیم کنید). اجراهای تعبیه‌شده یک‌باره مانند کاوش‌های احراز هویت،
تولید slug، و درخواست‌های یادآوری active-memory پاک‌سازی را در پایان اجرا انجام می‌دهند تا فرزندان stdio
و جریان‌های Streamable HTTP/SSE پس از پایان اجرا باقی نمانند.

## محدودیت‌ها

- **بدون فراخوانی مستقیم ابزار OpenClaw.** OpenClaw فراخوانی ابزار را در
  پروتکل بک‌اند CLI تزریق نمی‌کند. بک‌اندها فقط زمانی ابزارهای Gateway را می‌بینند که استفاده از
  `bundleMcp: true` را فعال کنند.
- **Streaming مخصوص هر بک‌اند است.** بعضی بک‌اندها JSONL را استریم می‌کنند؛ برخی دیگر
  تا زمان خروج بافر می‌کنند.
- **خروجی‌های ساختاریافته** به قالب JSON خود CLI وابسته‌اند.
- **نشست‌های Codex CLI** از طریق خروجی متن از سر گرفته می‌شوند (بدون JSONL)، که نسبت به
  اجرای اولیه `--json` ساختار کمتری دارد. نشست‌های OpenClaw همچنان
  به‌طور عادی کار می‌کنند.

## عیب‌یابی

- **CLI پیدا نشد**: `command` را روی یک مسیر کامل تنظیم کنید.
- **نام مدل نادرست است**: از `modelAliases` برای نگاشت `provider/model` → مدل CLI استفاده کنید.
- **تداوم نشست وجود ندارد**: مطمئن شوید `sessionArg` تنظیم شده و `sessionMode` برابر
  `none` نیست (Codex CLI در حال حاضر نمی‌تواند با خروجی JSON از سر گرفته شود).
- **تصاویر نادیده گرفته می‌شوند**: `imageArg` را تنظیم کنید (و بررسی کنید CLI از مسیرهای فایل پشتیبانی می‌کند).

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [مدل‌های محلی](/fa/gateway/local-models)
