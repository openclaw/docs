---
read_when:
    - می‌خواهید هنگام از کار افتادن ارائه‌دهندگان API، یک گزینهٔ پشتیبان قابل‌اعتماد داشته باشید
    - شما Codex CLI یا سایر CLIهای هوش مصنوعی محلی را اجرا می‌کنید و می‌خواهید از آن‌ها دوباره استفاده کنید
    - می‌خواهید پل لوپ‌بک MCP را برای دسترسی به ابزارهای بک‌اند CLI درک کنید
summary: 'بک‌اندهای CLI: جایگزین پشتیبان CLI هوش مصنوعی محلی با پل اختیاری ابزار MCP'
title: بک‌اندهای CLI
x-i18n:
    generated_at: "2026-05-10T19:39:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw می‌تواند **CLIهای هوش مصنوعی محلی** را به‌عنوان یک **مسیر جایگزین فقط متنی** اجرا کند، وقتی ارائه‌دهندگان API از دسترس خارج‌اند،
محدودیت نرخ دارند، یا موقتاً بدرفتار می‌کنند. این طراحی عمداً محافظه‌کارانه است:

- **ابزارهای OpenClaw مستقیماً تزریق نمی‌شوند**، اما backendهایی با `bundleMcp: true`
  می‌توانند ابزارهای gateway را از طریق یک پل MCP مبتنی بر local loopback دریافت کنند.
- **استریم JSONL** برای CLIهایی که از آن پشتیبانی می‌کنند.
- **نشست‌ها پشتیبانی می‌شوند** (تا نوبت‌های پیگیری منسجم بمانند).
- **تصاویر می‌توانند عبور داده شوند** اگر CLI مسیرهای تصویر را بپذیرد.

این بیشتر به‌عنوان یک **شبکه ایمنی** طراحی شده است تا مسیر اصلی. وقتی پاسخ‌های متنی «همیشه کار می‌کند» می‌خواهید
بدون اتکا به APIهای خارجی، از آن استفاده کنید.

اگر runtime کامل harness با کنترل‌های نشست ACP، وظایف پس‌زمینه،
اتصال thread/conversation، و نشست‌های کدنویسی خارجی پایدار می‌خواهید، به‌جای آن از
[عامل‌های ACP](/fa/tools/acp-agents) استفاده کنید. backendهای CLI، ACP نیستند.

<Tip>
  در حال ساخت یک Plugin backend جدید هستید؟ از
  [Pluginهای backend CLI](/fa/plugins/cli-backend-plugins) استفاده کنید. این صفحه برای کاربرانی است
  که یک backend از قبل ثبت‌شده را پیکربندی و اجرا می‌کنند.
</Tip>

## شروع سریع مناسب مبتدیان

می‌توانید از Codex CLI **بدون هیچ پیکربندی‌ای** استفاده کنید (Plugin بسته‌بندی‌شده OpenAI
یک backend پیش‌فرض ثبت می‌کند):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

اگر gateway شما زیر launchd/systemd اجرا می‌شود و PATH حداقلی است، فقط
مسیر command را اضافه کنید:

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

تمام است. هیچ کلید یا پیکربندی auth اضافه‌ای فراتر از خود CLI لازم نیست.

اگر از یک backend CLI بسته‌بندی‌شده به‌عنوان **ارائه‌دهنده اصلی پیام** روی یک
میزبان gateway استفاده می‌کنید، OpenClaw اکنون وقتی پیکربندی شما صراحتاً به آن backend در یک model ref یا زیر
`agents.defaults.cliBackends` اشاره کند، Plugin بسته‌بندی‌شده مالک را به‌صورت خودکار بارگذاری می‌کند.

## استفاده از آن به‌عنوان fallback

یک backend CLI را به فهرست fallback خود اضافه کنید تا فقط وقتی مدل‌های اصلی شکست می‌خورند اجرا شود:

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

- اگر از `agents.defaults.models` (allowlist) استفاده می‌کنید، باید مدل‌های backend CLI خود را هم آنجا وارد کنید.
- اگر ارائه‌دهنده اصلی شکست بخورد (auth، محدودیت نرخ، timeout)، OpenClaw
  بعداً backend CLI را امتحان می‌کند.

## نمای کلی پیکربندی

همه backendهای CLI زیر این مسیر قرار دارند:

```
agents.defaults.cliBackends
```

هر ورودی با یک **provider id** کلیدگذاری می‌شود (مثلاً `codex-cli`، `my-cli`).
provider id به سمت چپ model ref شما تبدیل می‌شود:

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

## شیوه کار

1. **یک backend انتخاب می‌کند** بر اساس پیشوند provider (`codex-cli/...`).
2. **یک system prompt می‌سازد** با همان prompt و بافت workspace در OpenClaw.
3. **CLI را اجرا می‌کند** با یک شناسه نشست (اگر پشتیبانی شود) تا تاریخچه سازگار بماند.
   backend بسته‌بندی‌شده `claude-cli` برای هر نشست OpenClaw یک فرایند Claude stdio را زنده نگه می‌دارد
   و نوبت‌های پیگیری را از طریق stream-json stdin می‌فرستد.
4. **خروجی را parse می‌کند** (JSON یا متن ساده) و متن نهایی را برمی‌گرداند.
5. **شناسه‌های نشست را پایدار نگه می‌دارد** برای هر backend، تا پیگیری‌ها همان نشست CLI را دوباره استفاده کنند.

<Note>
backend بسته‌بندی‌شده Anthropic یعنی `claude-cli` دوباره پشتیبانی می‌شود. کارکنان Anthropic
به ما گفته‌اند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفاده از
`claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic
یک سیاست جدید منتشر کند.
</Note>

backend بسته‌بندی‌شده OpenAI یعنی `codex-cli`، system prompt در OpenClaw را از طریق override پیکربندی
`model_instructions_file` در Codex عبور می‌دهد (`-c
model_instructions_file="..."`). Codex یک flag به سبک Claude با نام
`--append-system-prompt` ارائه نمی‌کند، بنابراین OpenClaw prompt مونتاژشده را برای هر نشست تازه Codex CLI در یک
فایل موقت می‌نویسد.

backend بسته‌بندی‌شده Anthropic یعنی `claude-cli`، snapshot مربوط به Skills در OpenClaw را
به دو روش دریافت می‌کند: کاتالوگ فشرده Skills در OpenClaw داخل system prompt افزوده‌شده، و
یک Claude Code Plugin موقت که با `--plugin-dir` فرستاده می‌شود. Plugin فقط
Skills واجد شرایط همان agent/session را دارد، بنابراین resolver بومی skill در Claude Code
همان مجموعه فیلترشده‌ای را می‌بیند که OpenClaw در غیر این صورت در
prompt تبلیغ می‌کرد. overrideهای env/API key مربوط به Skill همچنان توسط OpenClaw روی
محیط child process برای اجرا اعمال می‌شوند.

Claude CLI همچنین حالت مجوز noninteractive خودش را دارد. OpenClaw آن را
به‌جای افزودن پیکربندی مخصوص Claude، به سیاست exec موجود نگاشت می‌کند: وقتی
سیاست exec مؤثر درخواست‌شده YOLO باشد (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، OpenClaw گزینه `--permission-mode bypassPermissions` را اضافه می‌کند.
تنظیمات per-agent در `agents.list[].tools.exec` تنظیمات سراسری `tools.exec` را برای
آن agent override می‌کند. برای اجبار یک حالت Claude متفاوت، raw backend args صریح
مانند `--permission-mode default` یا `--permission-mode acceptEdits` را زیر
`agents.defaults.cliBackends.claude-cli.args` و `resumeArgs` متناظر تنظیم کنید.

backend بسته‌بندی‌شده Anthropic یعنی `claude-cli` همچنین سطوح `/think` در OpenClaw را
برای سطوحی غیر از off به flag بومی `--effort` در Claude Code نگاشت می‌کند. `minimal` و
`low` به `low` نگاشت می‌شوند، `adaptive` و `medium` به `medium` نگاشت می‌شوند، و `high`،
`xhigh`، و `max` مستقیماً نگاشت می‌شوند. سایر backendهای CLI به Plugin مالک خود نیاز دارند تا
پیش از آنکه `/think` بتواند روی CLI اجراشده اثر بگذارد، یک mapper معادل argv
اعلام کند.

پیش از آنکه OpenClaw بتواند از backend بسته‌بندی‌شده `claude-cli` استفاده کند، خود Claude Code
باید از قبل روی همان میزبان login شده باشد:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

فقط زمانی از `agents.defaults.cliBackends.claude-cli.command` استفاده کنید که باینری `claude`
از قبل روی `PATH` نباشد.

## نشست‌ها

- اگر CLI از نشست‌ها پشتیبانی می‌کند، `sessionArg` (مثلاً `--session-id`) یا
  `sessionArgs` (placeholder `{sessionId}`) را تنظیم کنید وقتی ID باید در
  چند flag درج شود.
- اگر CLI از یک **زیر‌فرمان resume** با flagهای متفاوت استفاده می‌کند،
  `resumeArgs` (جایگزین `args` هنگام resume) و به‌صورت اختیاری `resumeOutput`
  (برای resumeهای غیر JSON) را تنظیم کنید.
- `sessionMode`:
  - `always`: همیشه یک شناسه نشست بفرستید (اگر هیچ‌کدام ذخیره نشده باشد UUID جدید).
  - `existing`: فقط اگر قبلاً یک شناسه نشست ذخیره شده باشد، آن را بفرستید.
  - `none`: هرگز شناسه نشست نفرستید.
- `claude-cli` به‌صورت پیش‌فرض روی `liveSession: "claude-stdio"`، `output: "jsonl"`،
  و `input: "stdin"` قرار دارد تا نوبت‌های پیگیری، وقتی فرایند Claude فعال است،
  همان فرایند زنده را دوباره استفاده کنند. stdio گرم اکنون پیش‌فرض است، از جمله برای پیکربندی‌های سفارشی
  که فیلدهای transport را حذف می‌کنند. اگر Gateway restart شود یا فرایند idle
  خارج شود، OpenClaw از شناسه نشست ذخیره‌شده Claude resume می‌کند. شناسه‌های نشست ذخیره‌شده
  پیش از resume در برابر transcript پروژه خوانای موجود اعتبارسنجی می‌شوند،
  بنابراین bindingهای خیالی با `reason=transcript-missing` پاک می‌شوند
  به‌جای اینکه بی‌صدا یک نشست تازه Claude CLI را زیر `--resume` شروع کنند.
- نشست‌های زنده Claude نگهبان‌های محدودشده خروجی JSONL را نگه می‌دارند. پیش‌فرض‌ها تا
  8 MiB و 20,000 خط خام JSONL را در هر نوبت مجاز می‌کنند. نوبت‌های Claude با ابزارهای زیاد می‌توانند
  آن‌ها را برای هر backend با
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و `maxTurnLines` افزایش دهند؛ OpenClaw این تنظیمات را به 64 MiB و 100,000
  خط clamp می‌کند.
- نشست‌های ذخیره‌شده CLI تداوم تحت مالکیت provider هستند. reset ضمنی روزانه نشست
  آن‌ها را قطع نمی‌کند؛ `/reset` و سیاست‌های صریح `session.reset` همچنان
  این کار را می‌کنند.
- نشست‌های تازه CLI معمولاً فقط از خلاصه Compaction در OpenClaw
  به‌علاوه دنباله پس از compaction دوباره seed می‌شوند. برای بازیابی نشست‌های کوتاهی که
  پیش از compaction نامعتبر می‌شوند، یک backend می‌تواند با
  `reseedFromRawTranscriptWhenUncompacted: true` opt in کند. OpenClaw همچنان reseed از transcript خام را
  محدود نگه می‌دارد و آن را به invalidationهای ایمن مانند نبودن
  transcriptهای CLI، تغییرات system-prompt/MCP، یا retry پس از session-expired محدود می‌کند؛ تغییرات
  auth profile یا credential-epoch هرگز تاریخچه transcript خام را دوباره seed نمی‌کنند.

نکته‌های serialization:

- `serialize: true` اجراهای همان lane را مرتب نگه می‌دارد.
- بیشتر CLIها روی یک lane provider serialize می‌شوند.
- وقتی هویت auth انتخاب‌شده تغییر کند، OpenClaw استفاده مجدد از نشست CLI ذخیره‌شده را کنار می‌گذارد،
  از جمله تغییر auth profile id، API key ایستا، token ایستا، یا هویت account در OAuth
  وقتی CLI آن را expose کند. چرخش access token و refresh token در OAuth
  نشست CLI ذخیره‌شده را قطع نمی‌کند. اگر یک CLI شناسه account پایدار OAuth را expose نکند،
  OpenClaw اجازه می‌دهد همان CLI مجوزهای resume را enforce کند.

## مقدمه fallback از نشست‌های claude-cli

وقتی یک تلاش `claude-cli` به یک کاندید غیر CLI در
[`agents.defaults.model.fallbacks`](/fa/concepts/model-failover) fail over می‌کند، OpenClaw
تلاش بعدی را با یک context prelude که از transcript محلی JSONL مربوط به Claude Code در
`~/.claude/projects/` برداشت شده است seed می‌کند. بدون این seed، ارائه‌دهنده fallback
از صفر شروع می‌کرد چون transcript نشست خود OpenClaw برای اجراهای `claude-cli` خالی است.

- prelude جدیدترین خلاصه `/compact` یا marker `compact_boundary` را ترجیح می‌دهد،
  سپس تازه‌ترین نوبت‌های پس از boundary را تا سقف بودجه char اضافه می‌کند.
  نوبت‌های پیش از boundary حذف می‌شوند چون خلاصه از قبل نماینده آن‌هاست.
- بلوک‌های ابزار به hintهای فشرده `(tool call: name)` و
  `(tool result: …)` ادغام می‌شوند تا بودجه prompt دقیق بماند. اگر خلاصه
  سرریز کند، با `(truncated)` برچسب‌گذاری می‌شود.
- fallbackهای همان provider از `claude-cli` به `claude-cli` به
  `--resume` خود Claude تکیه می‌کنند و prelude را رد می‌کنند.
- این seed از اعتبارسنجی مسیر فایل نشست موجود Claude دوباره استفاده می‌کند، بنابراین
  مسیرهای دلخواه نمی‌توانند خوانده شوند.

## تصاویر (pass-through)

اگر CLI شما مسیرهای تصویر را می‌پذیرد، `imageArg` را تنظیم کنید:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw تصاویر base64 را در فایل‌های موقت می‌نویسد. اگر `imageArg` تنظیم شده باشد، آن
مسیرها به‌عنوان آرگومان‌های CLI فرستاده می‌شوند. اگر `imageArg` وجود نداشته باشد، OpenClaw
مسیرهای فایل را به prompt اضافه می‌کند (path injection)، که برای CLIهایی که فایل‌های محلی را از مسیرهای ساده
به‌صورت خودکار بارگذاری می‌کنند کافی است.

## ورودی‌ها / خروجی‌ها

- `output: "json"` (پیش‌فرض) تلاش می‌کند JSON را parse کند و متن + شناسه نشست را استخراج کند.
- برای خروجی JSON در Gemini CLI، OpenClaw متن پاسخ را از `response` و
  usage را از `stats` می‌خواند وقتی `usage` وجود ندارد یا خالی است.
- `output: "jsonl"` streamهای JSONL را parse می‌کند (برای مثال Codex CLI `--json`) و پیام نهایی agent به‌علاوه شناسه‌های نشست را
  در صورت وجود استخراج می‌کند.
- `output: "text"` با stdout به‌عنوان پاسخ نهایی رفتار می‌کند.

حالت‌های ورودی:

- `input: "arg"` (پیش‌فرض) prompt را به‌عنوان آخرین آرگومان CLI می‌فرستد.
- `input: "stdin"` prompt را از طریق stdin می‌فرستد.
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

Plugin همراه Google همچنین یک پیش‌فرض برای `google-gemini-cli` ثبت می‌کند:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

پیش‌نیاز: CLI محلی Gemini باید نصب شده باشد و به‌صورت
`gemini` در `PATH` در دسترس باشد (`brew install gemini-cli` یا
`npm install -g @google/gemini-cli`).

نکته‌های JSON در Gemini CLI:

- متن پاسخ از فیلد JSON با نام `response` خوانده می‌شود.
- وقتی `usage` وجود ندارد یا خالی است، مصرف به `stats` بازمی‌گردد.
- مقدار `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
- اگر `stats.input` موجود نباشد، OpenClaw توکن‌های ورودی را از
  `stats.input_tokens - stats.cached` استخراج می‌کند.

فقط در صورت نیاز بازنویسی کنید (مورد رایج: مسیر مطلق `command`).

## پیش‌فرض‌های متعلق به Plugin

پیش‌فرض‌های بک‌اند CLI اکنون بخشی از سطح Plugin هستند:

- Pluginها آن‌ها را با `api.registerCliBackend(...)` ثبت می‌کنند.
- مقدار `id` بک‌اند به پیشوند provider در model refها تبدیل می‌شود.
- پیکربندی کاربر در `agents.defaults.cliBackends.<id>` همچنان پیش‌فرض Plugin را بازنویسی می‌کند.
- پاک‌سازی پیکربندی ویژه هر بک‌اند از طریق hook اختیاری
  `normalizeConfig` همچنان متعلق به Plugin باقی می‌ماند.

Pluginهایی که به shimهای کوچک سازگاری prompt/message نیاز دارند، می‌توانند تبدیل‌های متنی
دوطرفه را بدون جایگزین‌کردن یک provider یا بک‌اند CLI اعلام کنند:

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

`input`، system prompt و user prompt ارسال‌شده به CLI را بازنویسی می‌کند. `output`
دلتاهای assistant در حال stream و متن نهایی parse‌شده را پیش از آن‌که OpenClaw
نشانگرهای کنترلی خودش و تحویل به channel را مدیریت کند، بازنویسی می‌کند.

برای CLIهایی که JSONL سازگار با Claude Code stream-json منتشر می‌کنند،
`jsonlDialect: "claude-stream-json"` را در پیکربندی آن بک‌اند تنظیم کنید.

## هم‌پوشان‌های MCP بسته

بک‌اندهای CLI فراخوانی‌های ابزار OpenClaw را به‌طور مستقیم دریافت نمی‌کنند، اما یک بک‌اند می‌تواند
با `bundleMcp: true` از هم‌پوشان پیکربندی MCP تولیدشده استفاده کند.

رفتار همراه فعلی:

- `claude-cli`: فایل پیکربندی MCP سخت‌گیرانه تولیدشده
- `codex-cli`: بازنویسی‌های درون‌خطی پیکربندی برای `mcp_servers`؛ سرور loopback
  تولیدشده OpenClaw با حالت تأیید ابزار به‌ازای هر سرور در Codex علامت‌گذاری می‌شود
  تا فراخوانی‌های MCP روی promptهای تأیید محلی متوقف نشوند
- `google-gemini-cli`: فایل تنظیمات سیستم Gemini تولیدشده

وقتی MCP بسته فعال باشد، OpenClaw:

- یک سرور HTTP MCP loopback اجرا می‌کند که ابزارهای gateway را در اختیار فرایند CLI می‌گذارد
- bridge را با یک token به‌ازای هر session احراز هویت می‌کند (`OPENCLAW_MCP_TOKEN`)
- دسترسی ابزار را به session، account و context فعلی channel محدود می‌کند
- سرورهای bundle-MCP فعال‌شده برای workspace فعلی را بارگذاری می‌کند
- آن‌ها را با هر شکل موجود از پیکربندی/تنظیمات MCP بک‌اند ادغام می‌کند
- پیکربندی اجرا را با استفاده از حالت integration متعلق به بک‌اند از extension مالک بازنویسی می‌کند

اگر هیچ سرور MCP فعالی وجود نداشته باشد، وقتی یک بک‌اند MCP بسته را فعال می‌کند،
OpenClaw همچنان یک پیکربندی سخت‌گیرانه تزریق می‌کند تا اجراهای پس‌زمینه ایزوله بمانند.

runtimeهای MCP همراه با محدوده session برای استفاده مجدد درون یک session cache می‌شوند، سپس
پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بیکاری پاک می‌شوند (پیش‌فرض ۱۰
دقیقه؛ برای غیرفعال‌سازی `0` را تنظیم کنید). اجراهای embedded یک‌باره مانند بررسی‌های auth،
تولید slug، و active-memory recall در پایان اجرا cleanup درخواست می‌کنند تا فرزندان stdio
و streamهای Streamable HTTP/SSE پس از اجرا باقی نمانند.

## محدودیت‌ها

- **بدون فراخوانی مستقیم ابزار OpenClaw.** OpenClaw فراخوانی ابزار را به
  پروتکل بک‌اند CLI تزریق نمی‌کند. بک‌اندها فقط وقتی ابزارهای gateway را می‌بینند که
  `bundleMcp: true` را فعال کنند.
- **Streaming ویژه بک‌اند است.** بعضی بک‌اندها JSONL را stream می‌کنند؛ برخی دیگر
  تا زمان خروج buffer می‌کنند.
- **خروجی‌های ساخت‌یافته** به قالب JSON خود CLI وابسته‌اند.
- **sessionهای Codex CLI** از طریق خروجی متنی resume می‌شوند (بدون JSONL)، که نسبت به
  اجرای اولیه `--json` ساخت‌یافتگی کمتری دارد. sessionهای OpenClaw همچنان
  به‌صورت عادی کار می‌کنند.

## عیب‌یابی

- **CLI پیدا نشد**: مقدار `command` را روی یک مسیر کامل تنظیم کنید.
- **نام مدل نادرست**: از `modelAliases` برای نگاشت `provider/model` → مدل CLI استفاده کنید.
- **نبود تداوم session**: مطمئن شوید `sessionArg` تنظیم شده و `sessionMode`
  برابر `none` نیست (Codex CLI در حال حاضر نمی‌تواند با خروجی JSON resume شود).
- **نادیده گرفته‌شدن تصاویر**: مقدار `imageArg` را تنظیم کنید (و مطمئن شوید CLI از مسیرهای فایل پشتیبانی می‌کند).

## مرتبط

- [runbook مربوط به Gateway](/fa/gateway)
- [مدل‌های محلی](/fa/gateway/local-models)
