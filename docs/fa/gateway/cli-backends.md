---
read_when:
    - وقتی ارائه‌دهندگان API دچار خطا می‌شوند، به یک گزینهٔ جایگزین قابل‌اعتماد نیاز دارید
    - شما CLIهای هوش مصنوعی محلی را اجرا می‌کنید و می‌خواهید دوباره از آن‌ها استفاده کنید
    - می‌خواهید پل loopback ‏MCP را برای دسترسی ابزارهای بک‌اند CLI درک کنید
summary: 'پشتانه‌های CLI: جایگزین CLI هوش مصنوعی محلی با پل ابزار MCP اختیاری'
title: بک‌اندهای CLI
x-i18n:
    generated_at: "2026-06-27T17:40:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw می‌تواند **CLIهای AI محلی** را به‌عنوان **جایگزین فقط‌متنی** اجرا کند، زمانی که ارائه‌دهندگان API از دسترس خارج‌اند،
با محدودیت نرخ مواجه‌اند، یا موقتاً رفتار نادرست دارند. این قابلیت عمداً محافظه‌کارانه طراحی شده است:

- **ابزارهای OpenClaw مستقیماً تزریق نمی‌شوند**، اما بک‌اندهایی با `bundleMcp: true`
  می‌توانند ابزارهای gateway را از طریق یک پل MCP با local loopback دریافت کنند.
- **استریم JSONL** برای CLIهایی که از آن پشتیبانی می‌کنند.
- **نشست‌ها پشتیبانی می‌شوند** (پس نوبت‌های پیگیری منسجم می‌مانند).
- **تصاویر می‌توانند عبور داده شوند** اگر CLI مسیرهای تصویر را بپذیرد.

این بیشتر به‌عنوان یک **شبکه ایمنی** طراحی شده است تا یک مسیر اصلی. وقتی می‌خواهید
پاسخ‌های متنی «همیشه کار می‌کند» داشته باشید، بدون اتکا به APIهای خارجی، از آن استفاده کنید.

اگر یک runtime کامل harness با کنترل‌های نشست ACP، وظایف پس‌زمینه،
اتصال thread/conversation، و نشست‌های کدنویسی خارجی پایدار می‌خواهید، به‌جای آن از
[عامل‌های ACP](/fa/tools/acp-agents) استفاده کنید. بک‌اندهای CLI، ACP نیستند.

<Tip>
  در حال ساخت یک Plugin بک‌اند جدید هستید؟ از
  [Pluginهای بک‌اند CLI](/fa/plugins/cli-backend-plugins) استفاده کنید. این صفحه برای کاربرانی است
  که یک بک‌اند از پیش ثبت‌شده را پیکربندی و اجرا می‌کنند.
</Tip>

## شروع سریع مناسب مبتدیان

می‌توانید از Claude Code CLI **بدون هیچ پیکربندی‌ای** استفاده کنید (Plugin بسته‌بندی‌شده Anthropic
یک بک‌اند پیش‌فرض ثبت می‌کند):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` شناسه پیش‌فرض عامل است وقتی فهرست عامل صریحی پیکربندی نشده باشد. اگر
از چند عامل استفاده می‌کنید، آن را با شناسه عاملی که می‌خواهید اجرا شود جایگزین کنید.

اگر gateway شما زیر launchd/systemd اجرا می‌شود و PATH حداقلی است، فقط
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

همین است. هیچ کلیدی و هیچ پیکربندی احراز هویت اضافه‌ای فراتر از خود CLI لازم نیست.

اگر از یک بک‌اند CLI بسته‌بندی‌شده به‌عنوان **ارائه‌دهنده اصلی پیام** روی یک
میزبان gateway استفاده می‌کنید، OpenClaw اکنون وقتی پیکربندی شما به‌طور صریح
به آن بک‌اند در یک ارجاع مدل یا زیر
`agents.defaults.cliBackends` اشاره کند، Plugin بسته‌بندی‌شده مالک را خودکار بارگذاری می‌کند.

## استفاده از آن به‌عنوان جایگزین

یک بک‌اند CLI را به فهرست جایگزین‌های خود اضافه کنید تا فقط وقتی مدل‌های اصلی شکست می‌خورند اجرا شود:

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

- اگر از `agents.defaults.models` (فهرست مجاز) استفاده می‌کنید، باید مدل‌های بک‌اند CLI خود را هم در آن وارد کنید.
- اگر ارائه‌دهنده اصلی شکست بخورد (احراز هویت، محدودیت نرخ، timeout)، OpenClaw
  در گام بعد بک‌اند CLI را امتحان می‌کند.

## نمای کلی پیکربندی

همه بک‌اندهای CLI زیر این مسیر قرار دارند:

```
agents.defaults.cliBackends
```

هر ورودی با یک **شناسه ارائه‌دهنده** کلیدگذاری می‌شود (مثلاً `claude-cli`، `my-cli`).
شناسه ارائه‌دهنده به سمت چپ ارجاع مدل شما تبدیل می‌شود:

```
<provider>/<model>
```

### پیکربندی نمونه

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

1. **یک بک‌اند را انتخاب می‌کند** بر اساس پیشوند ارائه‌دهنده (`claude-cli/...`).
2. **یک system prompt می‌سازد** با استفاده از همان prompt و بافت workspace در OpenClaw.
3. **CLI را اجرا می‌کند** با یک شناسه نشست (اگر پشتیبانی شود) تا تاریخچه سازگار بماند.
   بک‌اند بسته‌بندی‌شده `claude-cli` برای هر نشست OpenClaw یک فرایند stdio مربوط به Claude را زنده نگه می‌دارد
   و نوبت‌های پیگیری را از طریق stream-json stdin می‌فرستد.
4. **خروجی را parse می‌کند** (JSON یا متن ساده) و متن نهایی را برمی‌گرداند.
5. **شناسه‌های نشست را پایدار نگه می‌دارد** به‌ازای هر بک‌اند، تا پیگیری‌ها همان نشست CLI را دوباره استفاده کنند.

<Note>
بک‌اند بسته‌بندی‌شده Anthropic با نام `claude-cli` دوباره پشتیبانی می‌شود. کارکنان Anthropic
به ما گفتند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw
استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic
سیاست جدیدی منتشر کند.
</Note>

بک‌اند بسته‌بندی‌شده Anthropic با نام `claude-cli` برای Skills در OpenClaw ترجیحاً از resolver مهارت بومی Claude Code استفاده می‌کند. وقتی snapshot فعلی Skills حداقل
یک skill انتخاب‌شده با مسیر materialized داشته باشد، OpenClaw یک Plugin موقت Claude
Code را با `--plugin-dir` ارسال می‌کند و کاتالوگ تکراری Skills مربوط به OpenClaw
را از system prompt ضمیمه‌شده حذف می‌کند. اگر snapshot هیچ Plugin
skill materialized نداشته باشد، OpenClaw کاتالوگ prompt را به‌عنوان جایگزین نگه می‌دارد. بازنویسی‌های env/API key مربوط به Skill همچنان توسط OpenClaw روی محیط فرایند فرزند برای آن
اجرا اعمال می‌شوند.

Claude CLI همچنین حالت مجوز غیرتعاملی خودش را دارد. OpenClaw آن را
به سیاست exec موجود نگاشت می‌کند، به‌جای اینکه پیکربندی سیاست مخصوص Claude اضافه کند.
برای نشست‌های زنده Claude که توسط OpenClaw مدیریت می‌شوند، سیاست exec مؤثر OpenClaw
مرجع است: YOLO (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`) Claude را با
`--permission-mode bypassPermissions` اجرا می‌کند، در حالی که سیاست exec مؤثر محدودکننده
Claude را با `--permission-mode default` اجرا می‌کند. تنظیمات
`agents.list[].tools.exec` در سطح هر عامل، `tools.exec` سراسری را برای همان
عامل override می‌کند. آرگومان‌های خام بک‌اند Claude همچنان ممکن است شامل `--permission-mode` باشند، اما اجرای زنده
Claude آن flag را نرمال‌سازی می‌کند تا با سیاست exec مؤثر OpenClaw همخوان شود.

بک‌اند بسته‌بندی‌شده Anthropic با نام `claude-cli` همچنین سطوح `/think` در OpenClaw
را برای سطوحی غیر از off به flag بومی `--effort` در Claude Code نگاشت می‌کند. `minimal` و
`low` به `low` نگاشت می‌شوند، `adaptive` و `medium` به `medium` نگاشت می‌شوند، و `high`،
`xhigh`، و `max` مستقیماً نگاشت می‌شوند. سایر بک‌اندهای CLI نیاز دارند Plugin مالکشان
یک argv mapper معادل اعلام کند تا `/think` بتواند روی CLI ایجادشده اثر بگذارد.

پیش از آنکه OpenClaw بتواند از بک‌اند بسته‌بندی‌شده `claude-cli` استفاده کند، خود Claude Code
باید از قبل روی همان میزبان وارد شده باشد:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

نصب‌های Docker نیاز دارند Claude Code داخل home پایدارشده کانتینر نصب شده و وارد شده باشد،
نه فقط روی میزبان. ببینید:
[بک‌اند Claude CLI در Docker](/fa/install/docker#claude-cli-backend-in-docker).

از `agents.defaults.cliBackends.claude-cli.command` فقط زمانی استفاده کنید که binary مربوط به `claude`
از قبل در `PATH` نباشد.

## نشست‌ها

- اگر CLI از نشست‌ها پشتیبانی می‌کند، `sessionArg` (مثلاً `--session-id`) یا
  `sessionArgs` (placeholder `{sessionId}`) را تنظیم کنید، وقتی شناسه باید
  در چند flag وارد شود.
- اگر CLI از یک **زیر‌فرمان resume** با flagهای متفاوت استفاده می‌کند،
  `resumeArgs` را تنظیم کنید (هنگام resume جایگزین `args` می‌شود) و در صورت نیاز `resumeOutput`
  را هم تنظیم کنید (برای resumeهای غیر JSON).
- `sessionMode`:
  - `always`: همیشه یک شناسه نشست بفرست (اگر ذخیره نشده باشد UUID جدید).
  - `existing`: فقط اگر قبلاً شناسه نشست ذخیره شده باشد، آن را بفرست.
  - `none`: هرگز شناسه نشست نفرست.
- `claude-cli` به‌طور پیش‌فرض `liveSession: "claude-stdio"`، `output: "jsonl"`،
  و `input: "stdin"` دارد تا نوبت‌های پیگیری، فرایند زنده Claude را تا زمانی که
  فعال است دوباره استفاده کنند. stdio گرم اکنون پیش‌فرض است، از جمله برای پیکربندی‌های سفارشی
  که فیلدهای transport را حذف می‌کنند. اگر Gateway دوباره راه‌اندازی شود یا فرایند idle
  خارج شود، OpenClaw از شناسه نشست ذخیره‌شده Claude ادامه می‌دهد. شناسه‌های نشست ذخیره‌شده
  پیش از resume در برابر transcript پروژه موجود و خواندنی بررسی می‌شوند،
  بنابراین bindingهای خیالی به‌جای اینکه بی‌صدا یک نشست تازه Claude CLI را زیر `--resume`
  شروع کنند، با `reason=transcript-missing` پاک می‌شوند.
- نشست‌های زنده Claude guardهای محدودکننده خروجی JSONL را نگه می‌دارند. پیش‌فرض‌ها تا
  8 MiB و 20,000 خط JSONL خام را در هر نوبت اجازه می‌دهند. نوبت‌های Claude با ابزار زیاد می‌توانند
  آن‌ها را برای هر بک‌اند با
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و `maxTurnLines` افزایش دهند؛ OpenClaw این تنظیمات را به 64 MiB و 100,000
  خط clamp می‌کند.
- نشست‌های CLI ذخیره‌شده، پیوستگی تحت مالکیت ارائه‌دهنده هستند. reset روزانه ضمنی
  آن‌ها را قطع نمی‌کند؛ `/reset` و سیاست‌های صریح `session.reset` همچنان
  این کار را می‌کنند.
- نشست‌های تازه CLI معمولاً فقط از خلاصه Compaction مربوط به OpenClaw
  به‌علاوه دنباله پس از Compaction دوباره seed می‌شوند. برای بازیابی نشست‌های کوتاهی که
  پیش از Compaction نامعتبر می‌شوند، یک بک‌اند می‌تواند با
  `reseedFromRawTranscriptWhenUncompacted: true` opt in کند. OpenClaw همچنان reseed
  از transcript خام را محدود نگه می‌دارد و آن را به نامعتبرسازی‌های ایمن مانند نبودن
  transcriptهای CLI، تغییرات system-prompt/MCP، یا retry به‌دلیل session-expired محدود می‌کند؛ تغییرات
  profile احراز هویت یا credential-epoch هرگز تاریخچه transcript خام را دوباره seed نمی‌کنند.

نکته‌های serialization:

- `serialize: true` اجراهای همان lane را مرتب نگه می‌دارد.
- بیشتر CLIها روی یک lane ارائه‌دهنده serialize می‌شوند.
- OpenClaw وقتی هویت احراز هویت انتخاب‌شده تغییر کند، استفاده مجدد از نشست CLI ذخیره‌شده را کنار می‌گذارد،
  از جمله تغییر شناسه profile احراز هویت، API key ایستا، token ایستا، یا هویت
  حساب OAuth وقتی CLI یکی را expose کند. چرخش access token و refresh token
  در OAuth نشست CLI ذخیره‌شده را قطع نمی‌کند. اگر یک CLI شناسه حساب OAuth
  پایدار expose نکند، OpenClaw اجازه می‌دهد همان CLI مجوزهای resume را اعمال کند.

## مقدمه جایگزین از نشست‌های claude-cli

وقتی یک تلاش `claude-cli` به یک گزینه غیر CLI در
[`agents.defaults.model.fallbacks`](/fa/concepts/model-failover) fail over می‌کند، OpenClaw تلاش
بعدی را با یک مقدمه بافتی seed می‌کند که از transcript محلی JSONL مربوط به Claude Code
در `~/.claude/projects/` برداشت شده است. بدون این seed، ارائه‌دهنده جایگزین
از ابتدا شروع می‌کند، چون transcript نشست خود OpenClaw برای اجراهای `claude-cli`
خالی است.

- این مقدمه آخرین خلاصه `/compact` یا نشانگر `compact_boundary`
  را ترجیح می‌دهد، سپس جدیدترین نوبت‌های پس از boundary را تا سقف بودجه نویسه
  ضمیمه می‌کند. نوبت‌های پیش از boundary حذف می‌شوند، چون خلاصه از قبل نماینده
  آن‌هاست.
- بلوک‌های ابزار به اشاره‌های فشرده `(tool call: name)` و
  `(tool result: …)` ادغام می‌شوند تا بودجه prompt دقیق بماند. اگر خلاصه
  از سقف عبور کند، برچسب `(truncated)` می‌گیرد.
- جایگزین‌های هم‌ارائه‌دهنده از `claude-cli` به `claude-cli` به `--resume` خود Claude
  تکیه می‌کنند و مقدمه را رد می‌کنند.
- این seed همان اعتبارسنجی مسیر فایل نشست Claude موجود را دوباره استفاده می‌کند، بنابراین
  مسیرهای دلخواه قابل خواندن نیستند.

## تصاویر (عبور مستقیم)

اگر CLI شما مسیرهای تصویر را می‌پذیرد، `imageArg` را تنظیم کنید:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw تصاویر base64 را در فایل‌های موقت می‌نویسد. اگر `imageArg` تنظیم شده باشد، آن
مسیرها به‌عنوان آرگومان‌های CLI ارسال می‌شوند. اگر `imageArg` وجود نداشته باشد، OpenClaw
مسیرهای فایل را به prompt ضمیمه می‌کند (تزریق مسیر)، که برای CLIهایی که فایل‌های محلی را
از مسیرهای ساده خودکار بارگذاری می‌کنند کافی است.

## ورودی‌ها / خروجی‌ها

- `output: "json"` (پیش‌فرض) تلاش می‌کند JSON را parse کند و متن + شناسه نشست را استخراج کند.
- برای خروجی JSON مربوط به Gemini CLI، OpenClaw متن پاسخ را از `response` و usage
  را از `stats` می‌خواند وقتی `usage` وجود نداشته باشد یا خالی باشد. پیش‌فرض بسته‌بندی‌شده Gemini CLI
  از `stream-json` استفاده می‌کند، اما overrideهای قدیمی `--output-format json` همچنان از
  parser JSON استفاده می‌کنند.
- `output: "jsonl"` استریم‌های JSONL را parse می‌کند و پیام نهایی عامل به‌همراه شناسه‌های نشست
  را در صورت وجود استخراج می‌کند.
- `output: "text"` stdout را پاسخ نهایی در نظر می‌گیرد.

حالت‌های ورودی:

- `input: "arg"` (پیش‌فرض) پرامپت را به‌عنوان آخرین آرگومان CLI پاس می‌دهد.
- `input: "stdin"` پرامپت را از طریق stdin ارسال می‌کند.
- اگر پرامپت بسیار طولانی باشد و `maxPromptArgChars` تنظیم شده باشد، از stdin استفاده می‌شود.

## پیش‌فرض‌ها (متعلق به Plugin)

پیش‌فرض‌های بک‌اند CLI باندل‌شده همراه با Plugin مالک خود قرار دارند. برای مثال،
Anthropic مالک `claude-cli` است و Google مالک `google-gemini-cli` است. اجراهای عامل OpenAI Codex
از هارنس app-server Codex از طریق `openai/*` استفاده می‌کنند؛ OpenClaw دیگر
یک بک‌اند باندل‌شده `codex-cli` ثبت نمی‌کند.

Plugin باندل‌شده Anthropic یک پیش‌فرض برای `claude-cli` ثبت می‌کند:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Plugin باندل‌شده Google نیز یک پیش‌فرض برای `google-gemini-cli` ثبت می‌کند:

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

پیش‌نیاز: CLI محلی Gemini باید نصب شده باشد و به‌صورت
`gemini` در `PATH` در دسترس باشد (`brew install gemini-cli` یا
`npm install -g @google/gemini-cli`).

نکات خروجی Gemini CLI:

- پارسر پیش‌فرض `stream-json` رویدادهای `message` دستیار، رویدادهای ابزار،
  مصرف نهایی `result`، و رویدادهای خطای مهلک Gemini را می‌خواند.
- اگر آرگومان‌های Gemini را به `--output-format json` بازنویسی کنید، OpenClaw آن
  بک‌اند را دوباره به `output: "json"` نرمال‌سازی می‌کند و متن پاسخ را از فیلد
  `response` در JSON می‌خواند.
- وقتی `usage` وجود نداشته باشد یا خالی باشد، مصرف به `stats` برمی‌گردد.
- `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
- اگر `stats.input` وجود نداشته باشد، OpenClaw توکن‌های ورودی را از
  `stats.input_tokens - stats.cached` استخراج می‌کند.

فقط در صورت نیاز بازنویسی کنید (رایج: مسیر مطلق `command`).

## پیش‌فرض‌های متعلق به Plugin

پیش‌فرض‌های بک‌اند CLI اکنون بخشی از سطح Plugin هستند:

- Pluginها آن‌ها را با `api.registerCliBackend(...)` ثبت می‌کنند.
- `id` بک‌اند به پیشوند ارائه‌دهنده در ارجاع‌های مدل تبدیل می‌شود.
- پیکربندی کاربر در `agents.defaults.cliBackends.<id>` همچنان پیش‌فرض Plugin را بازنویسی می‌کند.
- پاک‌سازی پیکربندی ویژه بک‌اند از طریق هوک اختیاری
  `normalizeConfig` همچنان متعلق به Plugin می‌ماند.

Pluginهایی که به شیم‌های کوچک سازگاری پرامپت/پیام نیاز دارند، می‌توانند
تبدیل‌های متنی دوسویه را بدون جایگزین کردن یک ارائه‌دهنده یا بک‌اند CLI اعلام کنند:

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

`input` پرامپت سیستم و پرامپت کاربر پاس‌داده‌شده به CLI را بازنویسی می‌کند. `output`
دلتاهای استریم‌شده دستیار و متن نهایی پارس‌شده را پیش از آن‌که OpenClaw
نشانگرهای کنترلی خودش و تحویل کانال را مدیریت کند، بازنویسی می‌کند.

برای CLIهایی که رویدادهای JSONL ویژه ارائه‌دهنده تولید می‌کنند، `jsonlDialect` را روی
پیکربندی آن بک‌اند تنظیم کنید. گویش‌های پشتیبانی‌شده عبارت‌اند از `claude-stream-json` برای استریم‌های سازگار با Claude
Code و `gemini-stream-json` برای رویدادهای `stream-json` در Gemini CLI.

## مالکیت Compaction بومی

برخی بک‌اندهای CLI عاملی را اجرا می‌کنند که رونوشت **خودش** را فشرده می‌کند، بنابراین OpenClaw نباید
خلاصه‌ساز محافظتی خود را روی آن‌ها اجرا کند - انجام این کار با Compaction خود بک‌اند تداخل پیدا می‌کند
و می‌تواند نوبت را با شکست سخت مواجه کند.

`claude-cli` هیچ نقطه پایانی هارنسی ندارد - Claude Code به‌صورت داخلی فشرده می‌کند - بنابراین
`ownsNativeCompaction: true` را اعلام می‌کند، و OpenClaw از مسیر Compaction یک عملیات بدون اثر برمی‌گرداند.
نشست‌های هارنس بومی مانند Codex در عوض همچنان به نقطه پایانی Compaction هارنس خود
مسیردهی می‌شوند.

چون بک‌اند مالک Compaction است، راهکار موقت قدیمیِ تنظیم
`contextTokens: 1_000_000` صرفا برای جلوگیری از اجرای محافظ OpenClaw روی یک
نشست claude-cli **دیگر لازم نیست** - انصراف جایگزین آن شده است.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction` را فقط برای بک‌اندی اعلام کنید که واقعا مالک Compaction خودش است: باید
با نزدیک شدن به پنجره زمینه، رونوشت خودش را به‌طور قابل اتکا محدود کند و یک
نشست قابل ازسرگیری را پایدار کند (مثلا `--resume` / `--session-id`)؛ در غیر این صورت یک نشست به‌تعویق‌افتاده می‌تواند
بیش از بودجه باقی بماند. نشست‌های دارای `agentHarnessId` مطابق همچنان به نقطه پایانی هارنس مسیریابی می‌شوند.

## هم‌پوشانی‌های MCP باندل

بک‌اندهای CLI فراخوانی‌های ابزار OpenClaw را به‌صورت مستقیم دریافت **نمی‌کنند**، اما یک بک‌اند می‌تواند
با `bundleMcp: true` به یک هم‌پوشانی پیکربندی MCP تولیدشده بپیوندد.

رفتار باندل‌شده فعلی:

- `claude-cli`: فایل پیکربندی سخت‌گیرانه MCP تولیدشده
- `google-gemini-cli`: فایل تنظیمات سیستم Gemini تولیدشده

وقتی MCP باندل فعال باشد، OpenClaw:

- یک سرور MCP HTTP loopback راه‌اندازی می‌کند که ابزارهای gateway را برای فرایند CLI در معرض دسترس قرار می‌دهد
- پل را با یک توکن ویژه هر نشست (`OPENCLAW_MCP_TOKEN`) احراز هویت می‌کند
- دسترسی ابزار را به زمینه نشست، حساب، و کانال فعلی محدود می‌کند
- سرورهای bundle-MCP فعال را برای workspace فعلی بارگذاری می‌کند
- آن‌ها را با هر شکل پیکربندی/تنظیمات MCP موجود بک‌اند ادغام می‌کند
- پیکربندی راه‌اندازی را با استفاده از حالت یکپارچه‌سازی متعلق به بک‌اند از افزونه مالک بازنویسی می‌کند

اگر هیچ سرور MCP فعال نباشد، OpenClaw همچنان زمانی که یک
بک‌اند به MCP باندل بپیوندد، یک پیکربندی سخت‌گیرانه تزریق می‌کند تا اجراهای پس‌زمینه ایزوله بمانند.

runtimeهای MCP باندل‌شده با محدوده نشست برای استفاده دوباره درون یک نشست کش می‌شوند، سپس
پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بیکاری پاک‌سازی می‌شوند (پیش‌فرض ۱۰
دقیقه؛ برای غیرفعال‌سازی `0` را تنظیم کنید). اجراهای جاسازی‌شده تک‌مرحله‌ای مانند پروب‌های احراز هویت،
تولید slug، و درخواست فراخوانی active-memory در پایان اجرا پاک‌سازی می‌شوند تا فرزندان stdio
و استریم‌های Streamable HTTP/SSE پس از اجرا زنده نمانند.

## سقف تاریخچه reseed

وقتی یک نشست CLI تازه از یک رونوشت قبلی OpenClaw بذرگذاری می‌شود (برای
مثال پس از تلاش دوباره `session_expired`)، بلوک رندرشده
`<conversation_history>` سقف‌گذاری می‌شود تا پرامپت‌های reseed
از کنترل خارج نشوند. پیش‌فرض `12288` نویسه است (حدود ۳۰۰۰ توکن).

بک‌اندهای Claude CLI به‌صورت خودکار از سقف بزرگ‌تری استفاده می‌کنند که از سطح زمینه حل‌شده
Claude مشتق شده است. اجراهای استاندارد ۲۰۰K توکنی Claude بخش بزرگ‌تری از رونوشت را نگه می‌دارند،
و اجراهای ۱M توکنی Claude دوباره بخش بزرگ‌تری را نگه می‌دارند، در حالی که سایر بک‌اندهای CLI
پیش‌فرض محافظه‌کارانه را حفظ می‌کنند.

- این سقف فقط بلوک تاریخچه قبلی پرامپت reseed را کنترل می‌کند. محدودیت‌های خروجی
  نشست زنده به‌صورت جداگانه زیر `reliability.outputLimits`
  تنظیم می‌شوند (نگاه کنید به [نشست‌ها](#sessions)).

## محدودیت‌ها

- **بدون فراخوانی مستقیم ابزار OpenClaw.** OpenClaw فراخوانی ابزار را به
  پروتکل بک‌اند CLI تزریق نمی‌کند. بک‌اندها فقط زمانی ابزارهای gateway را می‌بینند که به
  `bundleMcp: true` بپیوندند.
- **استریم‌کردن ویژه بک‌اند است.** برخی بک‌اندها JSONL را استریم می‌کنند؛ برخی دیگر
  تا خروج بافر می‌کنند.
- **خروجی‌های ساختاریافته** به قالب JSON مربوط به CLI وابسته‌اند.

## عیب‌یابی

- **CLI پیدا نشد**: `command` را به یک مسیر کامل تنظیم کنید.
- **نام مدل اشتباه**: از `modelAliases` برای نگاشت `provider/model` → مدل CLI استفاده کنید.
- **نبود پیوستگی نشست**: مطمئن شوید `sessionArg` تنظیم شده و `sessionMode`
  `none` نیست.
- **تصاویر نادیده گرفته می‌شوند**: `imageArg` را تنظیم کنید (و بررسی کنید CLI از مسیرهای فایل پشتیبانی می‌کند).

## مرتبط

- [runbook ‏Gateway](/fa/gateway)
- [مدل‌های محلی](/fa/gateway/local-models)
