---
read_when:
    - وقتی ارائه‌دهندگان API شکست می‌خورند، یک راهکار پشتیبان قابل‌اعتماد می‌خواهید
    - در حال اجرای Codex CLI یا دیگر CLIهای هوش مصنوعی محلی هستید و می‌خواهید دوباره از آن‌ها استفاده کنید
    - می‌خواهید پل لوپ‌بک MCP را برای دسترسی ابزارهای بک‌اند CLI درک کنید
summary: 'بک‌اندهای CLI: جایگزین CLI هوش مصنوعی محلی با پل ابزار اختیاری MCP'
title: بک‌اندهای CLI
x-i18n:
    generated_at: "2026-05-02T11:44:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: f343469d6a42dc6146196355dc2ba3feed045515c3d8446941b90971aadc9a16
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw می‌تواند **CLIهای هوش مصنوعی محلی** را به‌عنوان یک **مسیر جایگزین فقط متنی** اجرا کند، وقتی ارائه‌دهندگان API از دسترس خارج‌اند،
با محدودیت نرخ مواجه‌اند، یا موقتاً رفتار نادرستی دارند. این طراحی عمداً محافظه‌کارانه است:

- **ابزارهای OpenClaw مستقیماً تزریق نمی‌شوند**، اما backendهایی با `bundleMcp: true`
  می‌توانند ابزارهای Gateway را از طریق یک پل MCP loopback دریافت کنند.
- **جریان‌دهی JSONL** برای CLIهایی که از آن پشتیبانی می‌کنند.
- **Sessionها پشتیبانی می‌شوند** (بنابراین نوبت‌های بعدی منسجم می‌مانند).
- **تصاویر می‌توانند عبور داده شوند** اگر CLI مسیرهای تصویر را بپذیرد.

این بیشتر به‌عنوان یک **شبکه ایمنی** طراحی شده است تا یک مسیر اصلی. زمانی از آن استفاده کنید که
پاسخ‌های متنی «همیشه کار می‌کند» می‌خواهید بدون تکیه بر APIهای خارجی.

اگر runtime کامل harness با کنترل‌های session در ACP، وظایف پس‌زمینه،
اتصال thread/conversation و sessionهای کدنویسی خارجی پایدار می‌خواهید، به‌جای آن از
[Agentهای ACP](/fa/tools/acp-agents) استفاده کنید. backendهای CLI، ACP نیستند.

## شروع سریع مناسب مبتدیان

می‌توانید از Codex CLI **بدون هیچ configای** استفاده کنید (Plugin بسته‌بندی‌شده OpenAI
یک backend پیش‌فرض ثبت می‌کند):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

اگر Gateway شما زیر launchd/systemd اجرا می‌شود و PATH حداقلی است، فقط
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

همین است. هیچ کلید یا config احراز هویت اضافی فراتر از خود CLI لازم نیست.

اگر از یک backend بسته‌بندی‌شده CLI به‌عنوان **ارائه‌دهنده اصلی پیام** روی یک
میزبان Gateway استفاده می‌کنید، OpenClaw اکنون وقتی config شما به‌طور صریح به آن backend در یک model ref یا زیر
`agents.defaults.cliBackends` ارجاع دهد، Plugin بسته‌بندی‌شده مالک آن را به‌صورت خودکار بارگذاری می‌کند.

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

- اگر از `agents.defaults.models` (allowlist) استفاده می‌کنید، باید مدل‌های backend CLI خود را هم آنجا اضافه کنید.
- اگر ارائه‌دهنده اصلی شکست بخورد (احراز هویت، محدودیت نرخ، timeoutها)، OpenClaw
  بعداً backend CLI را امتحان می‌کند.

## نمای کلی پیکربندی

همه backendهای CLI زیر این بخش قرار دارند:

```
agents.defaults.cliBackends
```

هر ورودی با یک **provider id** کلید می‌شود (مثلاً `codex-cli`، `my-cli`).
provider id سمت چپ model ref شما می‌شود:

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

## نحوه کار

1. **یک backend را انتخاب می‌کند** بر اساس پیشوند provider (`codex-cli/...`).
2. **یک system prompt می‌سازد** با استفاده از همان prompt و زمینه workspace در OpenClaw.
3. **CLI را اجرا می‌کند** با یک session id (اگر پشتیبانی شود) تا تاریخچه سازگار بماند.
   backend بسته‌بندی‌شده `claude-cli` برای هر session در OpenClaw یک فرایند Claude stdio را زنده نگه می‌دارد
   و نوبت‌های بعدی را از طریق stream-json stdin می‌فرستد.
4. **خروجی را parse می‌کند** (JSON یا متن ساده) و متن نهایی را برمی‌گرداند.
5. **session idها را ذخیره می‌کند** برای هر backend، تا پیگیری‌ها همان session در CLI را دوباره استفاده کنند.

<Note>
backend بسته‌بندی‌شده Anthropic به نام `claude-cli` دوباره پشتیبانی می‌شود. کارکنان Anthropic
به ما گفته‌اند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw
استفاده از `claude -p` را برای این integration مجاز تلقی می‌کند، مگر اینکه Anthropic
سیاست جدیدی منتشر کند.
</Note>

backend بسته‌بندی‌شده OpenAI به نام `codex-cli`، system prompt متعلق به OpenClaw را از طریق
override در config مربوط به `model_instructions_file` در Codex عبور می‌دهد (`-c
model_instructions_file="..."`). Codex یک flag به سبک Claude مثل
`--append-system-prompt` ارائه نمی‌کند، بنابراین OpenClaw prompt مونتاژشده را برای هر
session تازه Codex CLI در یک فایل موقت می‌نویسد.

backend بسته‌بندی‌شده Anthropic به نام `claude-cli` snapshot مربوط به OpenClaw skills را
از دو مسیر دریافت می‌کند: کاتالوگ فشرده Skills در OpenClaw در system prompt افزوده‌شده، و
یک Plugin موقت Claude Code که با `--plugin-dir` فرستاده می‌شود. Plugin فقط
skills واجد شرایط برای آن agent/session را شامل می‌شود، بنابراین resolver بومی skill در Claude Code
همان مجموعه فیلترشده‌ای را می‌بیند که OpenClaw در غیر این صورت در
prompt اعلام می‌کرد. overrideهای env/API key مربوط به Skill همچنان توسط OpenClaw روی
محیط فرایند child برای اجرا اعمال می‌شوند.

Claude CLI همچنین mode مجوز غیرتعاملی خودش را دارد. OpenClaw آن را
به policy موجود exec نگاشت می‌کند به‌جای افزودن config ویژه Claude: وقتی
policy مؤثر درخواست‌شده exec، YOLO باشد (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، OpenClaw گزینه `--permission-mode bypassPermissions` را اضافه می‌کند.
تنظیمات agent-specific در `agents.list[].tools.exec`، مقدار global `tools.exec` را برای
آن agent override می‌کنند. برای اجبار یک mode متفاوت در Claude، raw backend args صریحی
مثل `--permission-mode default` یا `--permission-mode acceptEdits` را زیر
`agents.defaults.cliBackends.claude-cli.args` و `resumeArgs` متناظر تنظیم کنید.

پیش از اینکه OpenClaw بتواند از backend بسته‌بندی‌شده `claude-cli` استفاده کند، خود Claude Code
باید از قبل روی همان میزبان وارد شده باشد:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

فقط زمانی از `agents.defaults.cliBackends.claude-cli.command` استفاده کنید که binary مربوط به `claude`
از قبل روی `PATH` نباشد.

## Sessionها

- اگر CLI از sessionها پشتیبانی می‌کند، `sessionArg` (مثلاً `--session-id`) یا
  `sessionArgs` (placeholder `{sessionId}`) را زمانی تنظیم کنید که ID باید در
  چند flag درج شود.
- اگر CLI از یک **resume subcommand** با flagهای متفاوت استفاده می‌کند،
  `resumeArgs` را تنظیم کنید (هنگام resume جایگزین `args` می‌شود) و در صورت نیاز `resumeOutput`
  را هم تنظیم کنید (برای resumeهای غیر JSON).
- `sessionMode`:
  - `always`: همیشه یک session id بفرستد (اگر چیزی ذخیره نشده باشد UUID جدید).
  - `existing`: فقط اگر قبلاً session id ذخیره شده باشد، آن را بفرستد.
  - `none`: هرگز session id نفرستد.
- `claude-cli` به‌طور پیش‌فرض روی `liveSession: "claude-stdio"`، `output: "jsonl"`،
  و `input: "stdin"` تنظیم است، تا نوبت‌های بعدی تا وقتی فرایند زنده Claude فعال است
  آن را دوباره استفاده کنند. stdio گرم اکنون پیش‌فرض است، حتی برای configهای سفارشی
  که فیلدهای transport را حذف کرده‌اند. اگر Gateway restart شود یا فرایند idle
  خارج شود، OpenClaw از session id ذخیره‌شده Claude ادامه می‌دهد. session
  idهای ذخیره‌شده پیش از resume در برابر یک transcript پروژه موجود و خواندنی
  تأیید می‌شوند، بنابراین bindingهای phantom با `reason=transcript-missing`
  پاک می‌شوند به‌جای اینکه بی‌صدا یک session تازه Claude CLI زیر `--resume` شروع شود.
- sessionهای زنده Claude محافظ‌های محدودکننده خروجی JSONL دارند. پیش‌فرض‌ها تا
  8 MiB و 20,000 خط خام JSONL در هر turn را مجاز می‌کنند. turnهای Claude با ابزارهای زیاد می‌توانند
  آن‌ها را برای هر backend با
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و `maxTurnLines` افزایش دهند؛ OpenClaw این تنظیمات را به 64 MiB و 100,000
  خط محدود می‌کند.
- sessionهای ذخیره‌شده CLI تداومِ متعلق به provider هستند. reset ضمنی روزانه session
  آن‌ها را قطع نمی‌کند؛ `/reset` و policyهای صریح `session.reset` همچنان
  این کار را انجام می‌دهند.

نکته‌های serialization:

- `serialize: true` اجراهای همان lane را مرتب نگه می‌دارد.
- بیشتر CLIها روی یک lane مربوط به provider serialize می‌شوند.
- OpenClaw استفاده دوباره از session ذخیره‌شده CLI را وقتی identity احراز هویت انتخاب‌شده تغییر کند کنار می‌گذارد،
  از جمله تغییر auth profile id، static API key، static token، یا identity حساب OAuth
  وقتی CLI آن را expose کند. چرخش access token و refresh token در OAuth
  session ذخیره‌شده CLI را قطع نمی‌کند. اگر یک CLI یک OAuth account id
  پایدار expose نکند، OpenClaw اجازه می‌دهد همان CLI مجوزهای resume را enforce کند.

## پیش‌درآمد fallback از sessionهای claude-cli

وقتی یک تلاش `claude-cli` به یک candidate غیر CLI در
[`agents.defaults.model.fallbacks`](/fa/concepts/model-failover) fail over می‌کند، OpenClaw
تلاش بعدی را با یک context prelude که از transcript محلی JSONL در Claude Code
در `~/.claude/projects/` برداشت شده seed می‌کند. بدون این seed، ارائه‌دهنده fallback
از صفر شروع می‌کرد، چون transcript session خود OpenClaw برای اجراهای `claude-cli`
خالی است.

- prelude آخرین summary مربوط به `/compact` یا marker مربوط به `compact_boundary` را ترجیح می‌دهد،
  سپس جدیدترین turnهای پس از boundary را تا سقف بودجه char اضافه می‌کند.
  turnهای پیش از boundary حذف می‌شوند، چون summary از قبل نماینده آن‌هاست.
- بلوک‌های tool به hintهای فشرده `(tool call: name)` و
  `(tool result: …)` ادغام می‌شوند تا بودجه prompt واقع‌گرایانه بماند. اگر summary
  از سقف عبور کند با `(truncated)` برچسب می‌خورد.
- fallbackهای `claude-cli` به `claude-cli` در همان provider به
  `--resume` خود Claude تکیه می‌کنند و prelude را رد می‌کنند.
- seed همان validation مسیر فایل session در Claude موجود را دوباره استفاده می‌کند، بنابراین
  مسیرهای دلخواه قابل خواندن نیستند.

## تصاویر (عبور مستقیم)

اگر CLI شما مسیرهای تصویر را می‌پذیرد، `imageArg` را تنظیم کنید:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw تصاویر base64 را در فایل‌های temp می‌نویسد. اگر `imageArg` تنظیم شده باشد، آن
مسیرها به‌عنوان argهای CLI فرستاده می‌شوند. اگر `imageArg` وجود نداشته باشد، OpenClaw
مسیرهای فایل را به prompt اضافه می‌کند (path injection)، که برای CLIهایی که به‌صورت خودکار
فایل‌های local را از مسیرهای ساده بارگذاری می‌کنند کافی است.

## ورودی‌ها / خروجی‌ها

- `output: "json"` (پیش‌فرض) تلاش می‌کند JSON را parse کند و متن + session id را استخراج کند.
- برای خروجی JSON در Gemini CLI، OpenClaw متن پاسخ را از `response` و
  usage را از `stats` وقتی `usage` وجود ندارد یا خالی است می‌خواند.
- `output: "jsonl"` جریان‌های JSONL را parse می‌کند (برای مثال Codex CLI `--json`) و پیام نهایی agent به‌همراه شناسه‌های session
  را در صورت وجود استخراج می‌کند.
- `output: "text"` stdout را پاسخ نهایی در نظر می‌گیرد.

modeهای ورودی:

- `input: "arg"` (پیش‌فرض) prompt را به‌عنوان آخرین arg در CLI عبور می‌دهد.
- `input: "stdin"` prompt را از طریق stdin می‌فرستد.
- اگر prompt بسیار طولانی باشد و `maxPromptArgChars` تنظیم شده باشد، از stdin استفاده می‌شود.

## پیش‌فرض‌ها (متعلق به Plugin)

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

پیش‌نیاز: Gemini CLI محلی باید نصب باشد و به‌عنوان
`gemini` روی `PATH` در دسترس باشد (`brew install gemini-cli` یا
`npm install -g @google/gemini-cli`).

نکته‌های JSON در Gemini CLI:

- متن پاسخ از فیلد JSON به نام `response` خوانده می‌شود.
- وقتی `usage` وجود ندارد یا خالی است، usage به `stats` fallback می‌کند.
- `stats.cached` به `cacheRead` در OpenClaw normalize می‌شود.
- اگر `stats.input` وجود نداشته باشد، OpenClaw توکن‌های ورودی را از
  `stats.input_tokens - stats.cached` استخراج می‌کند.

فقط در صورت نیاز override کنید (مورد رایج: مسیر absolute برای `command`).

## پیش‌فرض‌های متعلق به Plugin

پیش‌فرض‌های backendهای CLI اکنون بخشی از سطح Plugin هستند:

- Pluginها آن‌ها را با `api.registerCliBackend(...)` ثبت می‌کنند.
- `id` پشتیبان به پیشوند ارائه‌دهنده در ارجاع‌های مدل تبدیل می‌شود.
- پیکربندی کاربر در `agents.defaults.cliBackends.<id>` همچنان پیش‌فرض Plugin را بازنویسی می‌کند.
- پاک‌سازی پیکربندی اختصاصی پشتیبان از طریق قلاب اختیاری
  `normalizeConfig` همچنان در مالکیت Plugin می‌ماند.

Pluginهایی که به شیم‌های کوچک سازگاری پرامپت/پیام نیاز دارند، می‌توانند
تبدیل‌های متنی دوسویه را بدون جایگزین‌کردن ارائه‌دهنده یا پشتیبان CLI اعلام کنند:

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
دلتاهای دستیارِ استریم‌شده و متن نهایی تجزیه‌شده را پیش از آنکه OpenClaw
نشانگرهای کنترلی و تحویل کانال خودش را مدیریت کند، بازنویسی می‌کند.

برای CLIهایی که JSONL سازگار با Claude Code stream-json منتشر می‌کنند،
`jsonlDialect: "claude-stream-json"` را در پیکربندی آن پشتیبان تنظیم کنید.

## هم‌پوشانی‌های MCP بسته‌ای

پشتیبان‌های CLI فراخوانی‌های ابزار OpenClaw را به‌طور مستقیم دریافت **نمی‌کنند**، اما یک پشتیبان می‌تواند
با `bundleMcp: true` به هم‌پوشانی پیکربندی MCP تولیدشده بپیوندد.

رفتار بسته‌ای فعلی:

- `claude-cli`: فایل پیکربندی سخت‌گیرانه MCP تولیدشده
- `codex-cli`: بازنویسی‌های پیکربندی درون‌خطی برای `mcp_servers`؛ سرور
  local loopback تولیدشده OpenClaw با حالت تأیید ابزارِ به‌ازای هر سرورِ Codex علامت‌گذاری می‌شود
  تا فراخوانی‌های MCP نتوانند روی پرامپت‌های تأیید محلی متوقف شوند
- `google-gemini-cli`: فایل تنظیمات سیستم Gemini تولیدشده

وقتی MCP بسته‌ای فعال باشد، OpenClaw:

- یک سرور HTTP MCP از نوع loopback ایجاد می‌کند که ابزارهای Gateway را در اختیار فرایند CLI می‌گذارد
- پل را با یک توکن به‌ازای هر نشست (`OPENCLAW_MCP_TOKEN`) احراز هویت می‌کند
- دسترسی ابزار را به بافت نشست، حساب و کانال فعلی محدود می‌کند
- سرورهای bundle-MCP فعال را برای فضای کاری فعلی بارگذاری می‌کند
- آن‌ها را با هر شکل موجود از پیکربندی/تنظیمات MCP پشتیبان ادغام می‌کند
- پیکربندی اجرا را با استفاده از حالت ادغامِ متعلق به پشتیبان از extension مالک بازنویسی می‌کند

اگر هیچ سرور MCP فعالی وجود نداشته باشد، OpenClaw همچنان وقتی یک
پشتیبان به MCP بسته‌ای بپیوندد، پیکربندی سخت‌گیرانه‌ای تزریق می‌کند تا اجراهای پس‌زمینه ایزوله بمانند.

زمان‌اجراهای MCP بسته‌ایِ محدود به نشست برای استفاده دوباره درون یک نشست کش می‌شوند و سپس
پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بیکاری جمع‌آوری می‌شوند (پیش‌فرض 10
دقیقه؛ برای غیرفعال‌کردن `0` را تنظیم کنید). اجراهای توکار تک‌مرحله‌ای مانند پروب‌های احراز هویت،
تولید slug، و active-memory recall در پایان اجرا درخواست پاک‌سازی می‌کنند تا فرزندان stdio
و استریم‌های Streamable HTTP/SSE فراتر از اجرای جاری زنده نمانند.

## محدودیت‌ها

- **بدون فراخوانی مستقیم ابزار OpenClaw.** OpenClaw فراخوانی‌های ابزار را به
  پروتکل پشتیبان CLI تزریق نمی‌کند. پشتیبان‌ها فقط وقتی به
  `bundleMcp: true` بپیوندند، ابزارهای Gateway را می‌بینند.
- **استریم‌کردن به پشتیبان وابسته است.** برخی پشتیبان‌ها JSONL را استریم می‌کنند؛ برخی دیگر تا زمان
  خروج بافر می‌کنند.
- **خروجی‌های ساخت‌یافته** به قالب JSON متعلق به CLI وابسته‌اند.
- **نشست‌های Codex CLI** از طریق خروجی متنی ادامه پیدا می‌کنند (بدون JSONL)، که نسبت به اجرای اولیه
  `--json` ساختار کمتری دارد. نشست‌های OpenClaw همچنان
  به‌طور معمول کار می‌کنند.

## عیب‌یابی

- **CLI پیدا نشد**: `command` را روی یک مسیر کامل تنظیم کنید.
- **نام مدل اشتباه است**: از `modelAliases` برای نگاشت `provider/model` → مدل CLI استفاده کنید.
- **نبود پیوستگی نشست**: مطمئن شوید `sessionArg` تنظیم شده و `sessionMode`
  برابر `none` نیست (Codex CLI در حال حاضر نمی‌تواند با خروجی JSON ادامه دهد).
- **تصاویر نادیده گرفته می‌شوند**: `imageArg` را تنظیم کنید (و بررسی کنید CLI از مسیرهای فایل پشتیبانی می‌کند).

## مرتبط

- [راهنمای اجرایی Gateway](/fa/gateway)
- [مدل‌های محلی](/fa/gateway/local-models)
