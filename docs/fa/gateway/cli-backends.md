---
read_when:
    - شما می‌خواهید هنگام ناکامی ارائه‌دهندگان API یک گزینهٔ پشتیبان قابل‌اعتماد داشته باشید
    - شما در حال اجرای CLIهای هوش مصنوعی محلی هستید و می‌خواهید از آن‌ها دوباره استفاده کنید
    - می‌خواهید پل local loopback MCP را برای دسترسی ابزارهای بک‌اند CLI درک کنید
summary: 'پشتوانه‌های CLI: جایگزین CLI هوش مصنوعی محلی با پل اختیاری ابزار MCP'
title: پشت‌اندهای CLI
x-i18n:
    generated_at: "2026-07-01T08:21:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw می‌تواند **CLIهای هوش مصنوعی محلی** را به‌عنوان یک **جایگزین فقط متنی** اجرا کند، زمانی که ارائه‌دهندگان API از دسترس خارج شده‌اند،
با محدودیت نرخ روبه‌رو هستند، یا موقتاً رفتار نادرست دارند. این قابلیت عمداً محافظه‌کارانه طراحی شده است:

- **ابزارهای OpenClaw مستقیماً تزریق نمی‌شوند**، اما backendهایی با `bundleMcp: true`
  می‌توانند ابزارهای Gateway را از طریق یک پل MCP loopback دریافت کنند.
- **جریان‌دهی JSONL** برای CLIهایی که از آن پشتیبانی می‌کنند.
- **نشست‌ها پشتیبانی می‌شوند** (بنابراین نوبت‌های بعدی منسجم می‌مانند).
- **تصاویر می‌توانند عبور داده شوند** اگر CLI مسیرهای تصویر را بپذیرد.

این قابلیت به‌جای مسیر اصلی، به‌عنوان یک **تور ایمنی** طراحی شده است. زمانی از آن استفاده کنید که
پاسخ‌های متنی «همیشه کار می‌کند» می‌خواهید، بدون اتکا به APIهای خارجی.

اگر یک runtime کامل harness با کنترل‌های نشست ACP، کارهای پس‌زمینه،
اتصال thread/گفت‌وگو، و نشست‌های کدنویسی خارجی پایدار می‌خواهید، به‌جای آن از
[عامل‌های ACP](/fa/tools/acp-agents) استفاده کنید. backendهای CLI، ACP نیستند.

<Tip>
  اگر در حال ساخت یک Plugin backend جدید هستید، از
  [Pluginهای backend CLI](/fa/plugins/cli-backend-plugins) استفاده کنید. این صفحه برای کاربرانی است
  که یک backend از پیش ثبت‌شده را پیکربندی و اجرا می‌کنند.
</Tip>

## شروع سریع مناسب تازه‌کارها

می‌توانید از Claude Code CLI **بدون هیچ پیکربندی‌ای** استفاده کنید (Plugin همراه Anthropic
یک backend پیش‌فرض ثبت می‌کند):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` وقتی هیچ فهرست عامل صریحی پیکربندی نشده باشد، شناسه عامل پیش‌فرض است. اگر
از چند عامل استفاده می‌کنید، آن را با شناسه عاملی که می‌خواهید اجرا شود جایگزین کنید.

اگر Gateway شما زیر launchd/systemd اجرا می‌شود و PATH حداقلی است، فقط
مسیر فرمان را اضافه کنید:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

همین کافی است. هیچ کلیدی و هیچ پیکربندی احراز هویت اضافی‌ای، فراتر از خود CLI، لازم نیست.

اگر از یک backend CLI همراه به‌عنوان **ارائه‌دهنده پیام اصلی** روی میزبان
Gateway استفاده می‌کنید، OpenClaw اکنون وقتی پیکربندی شما به‌طور صریح در یک model ref یا زیر
`agents.defaults.cliBackends` به آن backend ارجاع دهد، Plugin همراه مالک آن را به‌صورت خودکار بارگذاری می‌کند.

## استفاده از آن به‌عنوان جایگزین

یک backend CLI را به فهرست جایگزین‌های خود اضافه کنید تا فقط زمانی اجرا شود که مدل‌های اصلی شکست می‌خورند:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

نکته‌ها:

- اگر از `agents.defaults.models` (فهرست مجاز) استفاده می‌کنید، باید مدل‌های backend CLI خود را هم در آن بگنجانید.
- اگر ارائه‌دهنده اصلی شکست بخورد (احراز هویت، محدودیت نرخ، timeout)، OpenClaw
  در گام بعد backend CLI را امتحان می‌کند.

## نمای کلی پیکربندی

همه backendهای CLI زیر این مسیر قرار می‌گیرند:

```
agents.defaults.cliBackends
```

هر ورودی با یک **شناسه ارائه‌دهنده** کلیدگذاری می‌شود (مثلاً `claude-cli`، `my-cli`).
شناسه ارائه‌دهنده سمت چپ model ref شما می‌شود:

```
<provider>/<model>
```

### نمونه پیکربندی

```json5
{
  agents: {
    defaults: {
      cliBackends: {
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
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## نحوه کارکرد

1. **یک backend انتخاب می‌کند** بر اساس پیشوند ارائه‌دهنده (`claude-cli/...`).
2. **یک system prompt می‌سازد** با استفاده از همان prompt و زمینه workspace در OpenClaw.
3. **CLI را اجرا می‌کند** همراه با شناسه نشست (اگر پشتیبانی شود) تا تاریخچه سازگار بماند.
   backend همراه `claude-cli` برای هر نشست OpenClaw یک فرایند stdio مربوط به Claude را زنده نگه می‌دارد
   و نوبت‌های بعدی را از طریق stdin نوع stream-json ارسال می‌کند.
4. **خروجی را parse می‌کند** (JSON یا متن ساده) و متن نهایی را برمی‌گرداند.
5. **شناسه‌های نشست را پایدار نگه می‌دارد** برای هر backend، تا نوبت‌های بعدی از همان نشست CLI دوباره استفاده کنند.

<Note>
backend همراه Anthropic با نام `claude-cli` دوباره پشتیبانی می‌شود. کارکنان Anthropic
به ما گفتند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw
استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic
سیاست جدیدی منتشر کند.
</Note>

backend همراه Anthropic با نام `claude-cli` برای Skills مربوط به OpenClaw، resolver بومی skill در Claude Code را ترجیح می‌دهد. وقتی snapshot فعلی skills شامل دست‌کم
یک skill انتخاب‌شده با مسیر materialized باشد، OpenClaw یک Plugin موقت Claude
Code را با `--plugin-dir` ارسال می‌کند و کاتالوگ تکراری skills در OpenClaw را
از system prompt پیوست‌شده حذف می‌کند. اگر snapshot هیچ plugin
skill materialized نداشته باشد، OpenClaw کاتالوگ prompt را به‌عنوان fallback نگه می‌دارد. overrideهای env/API key مربوط به skill
همچنان توسط OpenClaw روی محیط فرایند فرزند برای اجرا اعمال می‌شوند.

Claude CLI همچنین حالت مجوز غیرتعاملی خودش را دارد. OpenClaw آن را
به policy اجرایی موجود map می‌کند، به‌جای اینکه پیکربندی policy ویژه Claude اضافه کند.
برای نشست‌های زنده Claude که توسط OpenClaw مدیریت می‌شوند، policy اجرایی مؤثر OpenClaw
مرجع نهایی است: YOLO (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`) Claude را با
`--permission-mode bypassPermissions` اجرا می‌کند، در حالی که policy اجرایی مؤثر محدودکننده
Claude را با `--permission-mode default` اجرا می‌کند. تنظیمات هر عامل در
`agents.list[].tools.exec` تنظیمات سراسری `tools.exec` را برای همان
عامل override می‌کند. آرگومان‌های خام backend مربوط به Claude همچنان ممکن است شامل `--permission-mode` باشند، اما اجراهای زنده
Claude این flag را normalize می‌کنند تا با policy اجرایی مؤثر OpenClaw مطابقت داشته باشد.

backend همراه Anthropic با نام `claude-cli` همچنین سطح‌های `/think` در OpenClaw را
برای سطح‌های غیر off به flag بومی `--effort` در Claude Code map می‌کند. `minimal` و
`low` به `low`، `adaptive` و `medium` به `medium`، و `high`،
`xhigh`، و `max` مستقیماً map می‌شوند. سایر backendهای CLI به Plugin مالک خود نیاز دارند تا
پیش از آنکه `/think` بتواند بر CLI اجراشده اثر بگذارد، یک mapper معادل argv
اعلام کند.

پیش از آنکه OpenClaw بتواند از backend همراه `claude-cli` استفاده کند، خود Claude Code
باید از قبل روی همان میزبان login شده باشد:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

نصب‌های Docker نیاز دارند Claude Code داخل home پایدارشده container نصب و login شده باشد،
نه فقط روی میزبان. ببینید:
[backend Claude CLI در Docker](/fa/install/docker#claude-cli-backend-in-docker).

از `agents.defaults.cliBackends.claude-cli.command` فقط زمانی استفاده کنید که باینری `claude`
از قبل روی `PATH` نباشد.

## نشست‌ها

- اگر CLI از نشست‌ها پشتیبانی می‌کند، `sessionArg` (مثلاً `--session-id`) یا
  `sessionArgs` (placeholder `{sessionId}`) را تنظیم کنید، وقتی لازم است شناسه
  در چند flag درج شود.
- اگر CLI از یک **زیر‌فرمان resume** با flagهای متفاوت استفاده می‌کند،
  `resumeArgs` (هنگام resume جایگزین `args` می‌شود) و در صورت نیاز `resumeOutput`
  (برای resumeهای غیر JSON) را تنظیم کنید.
- `sessionMode`:
  - `always`: همیشه یک شناسه نشست ارسال کن (اگر هیچ‌کدام ذخیره نشده باشد، UUID جدید).
  - `existing`: فقط اگر پیش‌تر شناسه‌ای ذخیره شده بود، شناسه نشست ارسال کن.
  - `none`: هرگز شناسه نشست ارسال نکن.
- `claude-cli` به‌صورت پیش‌فرض روی `liveSession: "claude-stdio"`، `output: "jsonl"`،
  و `input: "stdin"` است تا نوبت‌های بعدی تا وقتی فرایند زنده Claude فعال است،
  از همان فرایند دوباره استفاده کنند. stdio گرم اکنون پیش‌فرض است، از جمله برای configهای سفارشی
  که فیلدهای transport را حذف می‌کنند. اگر Gateway restart شود یا فرایند idle
  خارج شود، OpenClaw از شناسه نشست ذخیره‌شده Claude resume می‌کند. شناسه‌های نشست ذخیره‌شده
  پیش از resume در برابر یک transcript خواندنی موجود از project بررسی می‌شوند، بنابراین
  bindingهای خیالی با `reason=transcript-missing` پاک می‌شوند
  به‌جای اینکه بی‌صدا یک نشست تازه Claude CLI زیر `--resume` شروع شود.
- نشست‌های زنده Claude نگهبان‌های محدودشده خروجی JSONL را نگه می‌دارند. پیش‌فرض‌ها تا
  8 MiB و 20,000 خط خام JSONL در هر نوبت را مجاز می‌کنند. نوبت‌های Claude با ابزارهای زیاد می‌توانند
  آن‌ها را برای هر backend با
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و `maxTurnLines` افزایش دهند؛ OpenClaw این تنظیمات را به 64 MiB و 100,000
  خط clamp می‌کند.
- نشست‌های ذخیره‌شده CLI تداوم متعلق به ارائه‌دهنده هستند. reset ضمنی روزانه نشست
  آن‌ها را قطع نمی‌کند؛ `/reset` و policyهای صریح `session.reset` همچنان
  این کار را انجام می‌دهند.
- نشست‌های تازه CLI معمولاً فقط از خلاصه Compaction در OpenClaw
  به‌همراه دنباله پس از Compaction reseed می‌شوند. برای بازیابی نشست‌های کوتاهی که
  پیش از Compaction نامعتبر شده‌اند، یک backend می‌تواند با
  `reseedFromRawTranscriptWhenUncompacted: true` opt in کند. OpenClaw همچنان reseed از transcript خام را
  محدود نگه می‌دارد و آن را به invalidationهای امنی مثل نبود transcriptهای CLI،
  تغییرات system-prompt/MCP، یا retry به‌علت session-expired محدود می‌کند؛ تغییرات
  auth profile یا credential-epoch هرگز تاریخچه transcript خام را reseed نمی‌کنند.

نکته‌های serialization:

- `serialize: true` اجراهای همان lane را مرتب نگه می‌دارد.
- بیشتر CLIها روی یک lane ارائه‌دهنده serialize می‌شوند.
- OpenClaw وقتی هویت احراز هویت انتخاب‌شده تغییر کند، استفاده مجدد از نشست ذخیره‌شده CLI را کنار می‌گذارد،
  از جمله تغییر شناسه auth profile، static API key، static token، یا هویت حساب OAuth
  وقتی CLI آن را در معرض می‌گذارد. چرخش توکن‌های access و refresh در OAuth
  نشست ذخیره‌شده CLI را قطع نمی‌کند. اگر یک CLI شناسه حساب OAuth پایدار در معرض نگذارد،
  OpenClaw اجازه می‌دهد همان CLI مجوزهای resume را enforce کند.

## پیش‌درآمد fallback از نشست‌های claude-cli

وقتی یک تلاش `claude-cli` به یک candidate غیر CLI در
[`agents.defaults.model.fallbacks`](/fa/concepts/model-failover) fail over می‌کند، OpenClaw
تلاش بعدی را با یک پیش‌درآمد زمینه که از transcript محلی JSONL مربوط به Claude Code
در `~/.claude/projects/` برداشت شده seed می‌کند. بدون این seed، ارائه‌دهنده fallback
سرد شروع می‌کرد، چون transcript نشست خود OpenClaw برای اجراهای `claude-cli` خالی است.

- پیش‌درآمد آخرین خلاصه `/compact` یا marker با نام `compact_boundary` را ترجیح می‌دهد،
  سپس تازه‌ترین نوبت‌های پس از boundary را تا سقف بودجه char اضافه می‌کند.
  نوبت‌های پیش از boundary حذف می‌شوند، چون خلاصه از قبل نماینده آن‌هاست.
- بلوک‌های ابزار به hintهای فشرده `(tool call: name)` و
  `(tool result: …)` coalesce می‌شوند تا بودجه prompt واقع‌بینانه بماند. اگر خلاصه
  سرریز شود، با `(truncated)` برچسب می‌خورد.
- fallbackهای همان ارائه‌دهنده از `claude-cli` به `claude-cli` به `--resume` خود Claude تکیه می‌کنند
  و پیش‌درآمد را رد می‌کنند.
- این seed از همان اعتبارسنجی مسیر session-file در Claude استفاده می‌کند، بنابراین
  مسیرهای دلخواه نمی‌توانند خوانده شوند.

## تصاویر (عبور مستقیم)

اگر CLI شما مسیرهای تصویر را می‌پذیرد، `imageArg` را تنظیم کنید:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw تصاویر base64 را در فایل‌های موقت می‌نویسد. اگر `imageArg` تنظیم شده باشد، آن
مسیرها به‌عنوان آرگومان‌های CLI ارسال می‌شوند. اگر `imageArg` وجود نداشته باشد، OpenClaw
مسیرهای فایل را به prompt اضافه می‌کند (تزریق مسیر)، که برای CLIهایی که فایل‌های محلی را به‌صورت خودکار
از مسیرهای ساده load می‌کنند کافی است.

## ورودی‌ها / خروجی‌ها

- `output: "json"` (پیش‌فرض) تلاش می‌کند JSON را parse کند و متن + شناسه نشست را استخراج کند.
- برای خروجی JSON در Gemini CLI، OpenClaw متن پاسخ را از `response` و usage
  را از `stats` می‌خواند، وقتی `usage` وجود ندارد یا خالی است. پیش‌فرض همراه Gemini CLI
  از `stream-json` استفاده می‌کند، اما overrideهای قدیمی `--output-format json` همچنان از
  parser مربوط به JSON استفاده می‌کنند.
- `output: "jsonl"` جریان‌های JSONL را parse می‌کند و پیام نهایی عامل به‌همراه شناسه‌های
  نشست را در صورت وجود استخراج می‌کند.
- `output: "text"` stdout را به‌عنوان پاسخ نهایی در نظر می‌گیرد.

حالت‌های ورودی:

- `input: "arg"` (پیش‌فرض) پرامپت را به‌عنوان آخرین آرگومان CLI ارسال می‌کند.
- `input: "stdin"` پرامپت را از طریق stdin می‌فرستد.
- اگر پرامپت بسیار طولانی باشد و `maxPromptArgChars` تنظیم شده باشد، از stdin استفاده می‌شود.

## پیش‌فرض‌ها (متعلق به plugin)

پیش‌فرض‌های بک‌اند CLI همراه، نزد plugin مالک خود قرار دارند. برای مثال،
Anthropic مالک `claude-cli` است و Google مالک `google-gemini-cli` است. اجراهای عامل OpenAI Codex
از طریق `openai/*` از هارنس app-server مربوط به Codex استفاده می‌کنند؛ OpenClaw دیگر
یک بک‌اند همراه `codex-cli` ثبت نمی‌کند.

plugin همراه Anthropic یک پیش‌فرض برای `claude-cli` ثبت می‌کند:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

plugin همراه Google نیز یک پیش‌فرض برای `google-gemini-cli` ثبت می‌کند:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

پیش‌نیاز: Gemini CLI محلی باید نصب شده و به‌صورت
`gemini` در `PATH` در دسترس باشد (`brew install gemini-cli` یا
`npm install -g @google/gemini-cli`).

نکات خروجی Gemini CLI:

- تجزیه‌گر پیش‌فرض `stream-json` رویدادهای `message` دستیار، رویدادهای ابزار،
  مصرف نهایی `result`، و رویدادهای خطای مرگبار Gemini را می‌خواند.
- اگر آرگومان‌های Gemini را به `--output-format json` بازنویسی کنید، OpenClaw آن
  بک‌اند را دوباره به `output: "json"` نرمال‌سازی می‌کند و متن پاسخ را از فیلد `response`
  در JSON می‌خواند.
- وقتی `usage` وجود ندارد یا خالی است، مصرف به `stats` برمی‌گردد.
- `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
- اگر `stats.input` وجود نداشته باشد، OpenClaw توکن‌های ورودی را از
  `stats.input_tokens - stats.cached` استخراج می‌کند.

فقط در صورت نیاز بازنویسی کنید (رایج: مسیر مطلق `command`).

## پیش‌فرض‌های متعلق به plugin

پیش‌فرض‌های بک‌اند CLI اکنون بخشی از سطح plugin هستند:

- pluginها آن‌ها را با `api.registerCliBackend(...)` ثبت می‌کنند.
- `id` بک‌اند به پیشوند provider در ارجاع‌های مدل تبدیل می‌شود.
- پیکربندی کاربر در `agents.defaults.cliBackends.<id>` همچنان پیش‌فرض plugin را بازنویسی می‌کند.
- پاک‌سازی پیکربندی اختصاصی بک‌اند از طریق هوک اختیاری
  `normalizeConfig` همچنان متعلق به plugin می‌ماند.

pluginهایی که به شیم‌های کوچک سازگاری پرامپت/پیام نیاز دارند می‌توانند
تبدیل‌های متنی دوسویه را بدون جایگزین کردن provider یا بک‌اند CLI اعلام کنند:

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

`input` پرامپت سیستم و پرامپت کاربرِ ارسال‌شده به CLI را بازنویسی می‌کند. `output`
متن دستیارِ استریم‌شده و متن نهاییِ تجزیه‌شده را پیش از آنکه OpenClaw
نشانگرهای کنترلی خود و تحویل کانال را پردازش کند، بازنویسی می‌کند. برای فراخوانی‌های مدلِ دارای پشتوانه provider،
`output` همچنین مقادیر رشته‌ای داخل آرگومان‌های ساختاریافته فراخوانی ابزار را پس از
ترمیم استریم و پیش از اجرای ابزار بازیابی می‌کند. قطعه‌های JSON خام provider
بدون تغییر می‌مانند؛ مصرف‌کنندگان باید از payload ساختاریافته partial، end، یا result استفاده کنند.

برای CLIهایی که رویدادهای JSONL اختصاصی provider منتشر می‌کنند، `jsonlDialect` را روی پیکربندی همان
بک‌اند تنظیم کنید. dialectهای پشتیبانی‌شده عبارت‌اند از `claude-stream-json` برای استریم‌های سازگار با Claude
Code و `gemini-stream-json` برای رویدادهای `stream-json` در Gemini CLI.

## مالکیت Compaction بومی

برخی بک‌اندهای CLI عاملی را اجرا می‌کنند که رونوشت **خودش** را فشرده می‌کند، بنابراین OpenClaw نباید
خلاصه‌ساز حفاظتی خود را روی آن‌ها اجرا کند - این کار با Compaction خود بک‌اند تداخل دارد
و می‌تواند نوبت را با شکست قطعی مواجه کند.

`claude-cli` هیچ endpoint هارنسی ندارد - Claude Code درون‌خود فشرده‌سازی می‌کند - بنابراین
`ownsNativeCompaction: true` را اعلام می‌کند، و OpenClaw از مسیر Compaction یک no-op برمی‌گرداند.
جلسه‌های هارنس بومی مانند Codex در عوض همچنان به endpoint Compaction هارنس خود
مسیریابی می‌شوند.

چون بک‌اند مالک Compaction است، راه‌حل موقت قدیمیِ تنظیم
`contextTokens: 1_000_000` صرفاً برای جلوگیری از فعال شدن حفاظت OpenClaw روی یک
جلسه claude-cli **دیگر لازم نیست** - opt-out جایگزین آن می‌شود.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

فقط برای بک‌اندی `ownsNativeCompaction` را اعلام کنید که واقعاً مالک Compaction خود است: باید
هنگامی که به پنجره زمینه خود نزدیک می‌شود، رونوشت خود را به‌طور قابل اتکا محدود کند و یک
جلسه قابل ازسرگیری را پایدار نگه دارد (مثلاً `--resume` / `--session-id`)؛ در غیر این صورت یک جلسه معوق می‌تواند
بالاتر از بودجه باقی بماند. جلسه‌های متناظر با `agentHarnessId` همچنان به endpoint هارنس مسیردهی می‌شوند.

## هم‌پوشانی‌های MCP بسته

بک‌اندهای CLI فراخوانی‌های ابزار OpenClaw را مستقیماً دریافت **نمی‌کنند**، اما یک بک‌اند می‌تواند
با `bundleMcp: true` به یک هم‌پوشانی پیکربندی MCP تولیدشده opt in کند.

رفتار همراه فعلی:

- `claude-cli`: فایل پیکربندی سخت‌گیرانه MCP تولیدشده
- `google-gemini-cli`: فایل تنظیمات سیستمی Gemini تولیدشده

وقتی MCP بسته فعال باشد، OpenClaw:

- یک سرور HTTP MCP روی local loopback اجرا می‌کند که ابزارهای gateway را در اختیار فرایند CLI قرار می‌دهد
- پل را با یک توکن برای هر جلسه (`OPENCLAW_MCP_TOKEN`) احراز هویت می‌کند
- دسترسی ابزار را به زمینه جلسه، حساب، و کانال فعلی محدود می‌کند
- سرورهای bundle-MCP فعال را برای workspace فعلی بارگذاری می‌کند
- آن‌ها را با هر شکل موجود پیکربندی/تنظیمات MCP بک‌اند ادغام می‌کند
- پیکربندی اجرا را با استفاده از حالت یکپارچه‌سازی متعلق به بک‌اند از extension مالک بازنویسی می‌کند

اگر هیچ سرور MCP فعال نباشد، OpenClaw همچنان وقتی یک
بک‌اند به MCP بسته opt in کند، یک پیکربندی سخت‌گیرانه تزریق می‌کند تا اجراهای پس‌زمینه ایزوله بمانند.

runtimeهای MCP همراهِ محدود به جلسه برای استفاده مجدد درون یک جلسه cache می‌شوند، سپس
پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بی‌کاری جمع‌آوری می‌شوند (پیش‌فرض 10
دقیقه؛ برای غیرفعال‌سازی `0` تنظیم کنید). اجراهای تعبیه‌شده یک‌باره مانند probeهای احراز هویت،
تولید slug، و درخواست‌های بازیابی active-memory در پایان اجرا پاک‌سازی می‌شوند تا فرزندان stdio
و استریم‌های Streamable HTTP/SSE بیشتر از اجرا زنده نمانند.

## سقف بازکاشت تاریخچه

وقتی یک جلسه تازه CLI از روی رونوشت پیشین OpenClaw مقداردهی اولیه می‌شود (برای
مثال پس از تلاش مجدد `session_expired`)، بلوک رندرشده
`<conversation_history>` محدود می‌شود تا پرامپت‌های بازکاشت بیش از حد بزرگ نشوند.
پیش‌فرض `12288` نویسه است (حدود 3000 توکن).

بک‌اندهای Claude CLI به‌طور خودکار از سقف بزرگ‌تری استفاده می‌کنند که از tier زمینه
Claude حل‌شده مشتق می‌شود. اجراهای استاندارد Claude با 200K توکن برش بزرگ‌تری از رونوشت را
نگه می‌دارند، و اجراهای Claude با 1M توکن باز هم برش بزرگ‌تری نگه می‌دارند، در حالی که سایر بک‌اندهای CLI
پیش‌فرض محافظه‌کارانه را نگه می‌دارند.

- این سقف فقط بلوک تاریخچه قبلیِ پرامپت بازکاشت را کنترل می‌کند. محدودیت‌های
  خروجی جلسه زنده جداگانه در `reliability.outputLimits`
  تنظیم می‌شوند (نگاه کنید به [جلسه‌ها](#sessions)).

## محدودیت‌ها

- **بدون فراخوانی مستقیم ابزار OpenClaw.** OpenClaw فراخوانی‌های ابزار را به
  پروتکل بک‌اند CLI تزریق نمی‌کند. بک‌اندها فقط وقتی gateway tools را می‌بینند که به
  `bundleMcp: true` opt in کنند.
- **استریمینگ اختصاصی بک‌اند است.** برخی بک‌اندها JSONL را استریم می‌کنند؛ برخی دیگر
  تا خروج صبر می‌کنند و سپس خروجی را یکجا می‌دهند.
- **خروجی‌های ساختاریافته** به قالب JSON خود CLI وابسته‌اند.

## عیب‌یابی

- **CLI پیدا نشد**: `command` را روی یک مسیر کامل تنظیم کنید.
- **نام مدل نادرست**: از `modelAliases` برای نگاشت `provider/model` → مدل CLI استفاده کنید.
- **نبود پیوستگی جلسه**: مطمئن شوید `sessionArg` تنظیم شده و `sessionMode` برابر
  `none` نیست.
- **تصاویر نادیده گرفته می‌شوند**: `imageArg` را تنظیم کنید (و بررسی کنید CLI از مسیر فایل‌ها پشتیبانی می‌کند).

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [مدل‌های محلی](/fa/gateway/local-models)
