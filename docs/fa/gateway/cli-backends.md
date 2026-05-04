---
read_when:
    - وقتی ارائه‌دهندگان API دچار خطا می‌شوند، به یک راهکار جایگزین قابل اعتماد نیاز دارید
    - شما Codex CLI یا CLIهای محلی دیگر هوش مصنوعی را اجرا می‌کنید و می‌خواهید دوباره از آن‌ها استفاده کنید
    - می‌خواهید پل لوپ‌بک MCP را برای دسترسی ابزارهای بک‌اند CLI درک کنید
summary: 'بک‌اندهای CLI: جایگزین CLI هوش مصنوعی محلی با پل ابزار MCP اختیاری'
title: بک‌اندهای CLI
x-i18n:
    generated_at: "2026-05-04T18:23:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55534c48c5e226857b9320fd369416583e5c2efc80eabd4746f939afdd027dc1
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw می‌تواند **CLIهای هوش مصنوعی محلی** را به‌عنوان یک **مسیر جایگزین فقط متنی** اجرا کند، زمانی که ارائه‌دهندگان API از دسترس خارج شده‌اند، محدودیت نرخ دارند، یا موقتاً درست رفتار نمی‌کنند. این رفتار عمداً محافظه‌کارانه است:

- **ابزارهای OpenClaw مستقیماً تزریق نمی‌شوند**، اما پشتیبان‌هایی با `bundleMcp: true`
  می‌توانند ابزارهای Gateway را از طریق یک پل MCP روی loopback دریافت کنند.
- **استریم JSONL** برای CLIهایی که از آن پشتیبانی می‌کنند.
- **Sessionها پشتیبانی می‌شوند** (پس نوبت‌های پیگیری منسجم می‌مانند).
- **تصاویر می‌توانند عبور داده شوند** اگر CLI مسیرهای تصویر را بپذیرد.

این قابلیت به‌جای یک مسیر اصلی، به‌عنوان یک **شبکه ایمنی** طراحی شده است. وقتی پاسخ‌های متنی «همیشه کار می‌کند» را بدون اتکا به APIهای خارجی می‌خواهید، از آن استفاده کنید.

اگر یک runtime کامل harness با کنترل‌های session مربوط به ACP، وظایف پس‌زمینه، اتصال thread/conversation، و sessionهای کدنویسی خارجی پایدار می‌خواهید، به‌جای آن از
[ACP Agents](/fa/tools/acp-agents) استفاده کنید. پشتیبان‌های CLI، ACP نیستند.

## شروع سریع مناسب مبتدیان

می‌توانید از Codex CLI **بدون هیچ تنظیماتی** استفاده کنید (Plugin همراه OpenAI
یک backend پیش‌فرض ثبت می‌کند):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

اگر Gateway شما زیر launchd/systemd اجرا می‌شود و PATH حداقلی است، فقط مسیر command را اضافه کنید:

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

همین کافی است. هیچ key یا تنظیمات auth اضافه‌ای فراتر از خود CLI لازم نیست.

اگر از یک backend همراه CLI به‌عنوان **ارائه‌دهنده اصلی پیام** روی یک میزبان Gateway استفاده می‌کنید، OpenClaw اکنون وقتی config شما صراحتاً به آن backend در یک model ref یا زیر
`agents.defaults.cliBackends`
ارجاع می‌دهد، Plugin همراه مالک آن را به‌صورت خودکار بارگذاری می‌کند.

## استفاده به‌عنوان fallback

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

نکات:

- اگر از `agents.defaults.models` (allowlist) استفاده می‌کنید، باید مدل‌های backend CLI خود را هم آنجا وارد کنید.
- اگر ارائه‌دهنده اصلی شکست بخورد (auth، محدودیت نرخ، timeoutها)، OpenClaw
  سپس backend CLI را امتحان می‌کند.

## نمای کلی پیکربندی

همه backendهای CLI زیر این مسیر قرار دارند:

```
agents.defaults.cliBackends
```

هر ورودی با یک **شناسه ارائه‌دهنده** کلیدگذاری می‌شود (مثلاً `codex-cli`، `my-cli`).
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

## سازوکار

1. **یک backend را انتخاب می‌کند** بر اساس پیشوند ارائه‌دهنده (`codex-cli/...`).
2. **یک system prompt می‌سازد** با استفاده از همان prompt و زمینه workspace در OpenClaw.
3. **CLI را اجرا می‌کند** با یک session id (اگر پشتیبانی شود) تا تاریخچه سازگار بماند.
   backend همراه `claude-cli` برای هر session در OpenClaw یک فرایند stdio مربوط به Claude را زنده نگه می‌دارد و نوبت‌های پیگیری را از طریق stdin به‌صورت stream-json می‌فرستد.
4. **خروجی را parse می‌کند** (JSON یا متن ساده) و متن نهایی را برمی‌گرداند.
5. **session idها را نگه می‌دارد** برای هر backend، تا پیگیری‌ها همان session CLI را دوباره استفاده کنند.

<Note>
backend همراه Anthropic یعنی `claude-cli` دوباره پشتیبانی می‌شود. کارکنان Anthropic
به ما گفتند استفاده Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفاده از
`claude -p` را برای این integration مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست تازه‌ای منتشر کند.
</Note>

backend همراه OpenAI یعنی `codex-cli`، system prompt مربوط به OpenClaw را از طریق override تنظیمات
`model_instructions_file` در Codex عبور می‌دهد (`-c
model_instructions_file="..."`). Codex فلگی شبیه Claude با نام
`--append-system-prompt` ارائه نمی‌کند، بنابراین OpenClaw prompt مونتاژشده را برای هر session تازه Codex CLI در یک فایل موقت می‌نویسد.

backend همراه Anthropic یعنی `claude-cli`، snapshot مربوط به Skills در OpenClaw را از دو راه دریافت می‌کند: کاتالوگ فشرده Skills در OpenClaw در system prompt افزوده‌شده، و یک Plugin موقت Claude Code که با `--plugin-dir` ارسال می‌شود. Plugin فقط شامل skillهای واجد شرایط برای آن agent/session است، بنابراین resolver بومی skill در Claude Code همان مجموعه فیلترشده‌ای را می‌بیند که OpenClaw در غیر این صورت در prompt اعلام می‌کرد. overrideهای env/API key مربوط به skill همچنان توسط OpenClaw روی محیط child process برای اجرا اعمال می‌شوند.

Claude CLI حالت permission غیرتعاملی خودش را هم دارد. OpenClaw آن را به‌جای اضافه کردن config مخصوص Claude، به policy موجود exec نگاشت می‌کند: وقتی policy مؤثر درخواست‌شده exec برابر YOLO باشد (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، OpenClaw مقدار `--permission-mode bypassPermissions` را اضافه می‌کند.
تنظیمات per-agent در `agents.list[].tools.exec` مقدار global `tools.exec` را برای آن agent override می‌کند. برای اجبار یک حالت متفاوت Claude، raw backend args صریحی مانند `--permission-mode default` یا `--permission-mode acceptEdits` را زیر
`agents.defaults.cliBackends.claude-cli.args` و `resumeArgs` متناظر تنظیم کنید.

backend همراه Anthropic یعنی `claude-cli` همچنین سطح‌های `/think` در OpenClaw را برای سطح‌های غیر off به فلگ بومی `--effort` در Claude Code نگاشت می‌کند. `minimal` و
`low` به `low` نگاشت می‌شوند، `adaptive` و `medium` به `medium` نگاشت می‌شوند، و `high`،
`xhigh`، و `max` مستقیماً نگاشت می‌شوند. دیگر backendهای CLI نیاز دارند Plugin مالکشان یک argv mapper معادل اعلام کند تا `/think` بتواند روی CLI ایجادشده اثر بگذارد.

پیش از اینکه OpenClaw بتواند از backend همراه `claude-cli` استفاده کند، خود Claude Code
باید از قبل روی همان میزبان login شده باشد:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

فقط زمانی از `agents.defaults.cliBackends.claude-cli.command` استفاده کنید که binary مربوط به `claude`
از قبل در `PATH` نباشد.

## Sessionها

- اگر CLI از sessionها پشتیبانی می‌کند، `sessionArg` را تنظیم کنید (مثلاً `--session-id`) یا
  `sessionArgs` را (placeholder `{sessionId}`) وقتی ID باید در چند flag درج شود.
- اگر CLI از یک **resume subcommand** با flagهای متفاوت استفاده می‌کند،
  `resumeArgs` را تنظیم کنید (هنگام resume جایگزین `args` می‌شود) و در صورت نیاز `resumeOutput`
  را هم تنظیم کنید (برای resumeهای غیر JSON).
- `sessionMode`:
  - `always`: همیشه یک session id بفرست (اگر ذخیره نشده باشد، UUID جدید).
  - `existing`: فقط اگر قبلاً ذخیره شده باشد، session id بفرست.
  - `none`: هرگز session id نفرست.
- `claude-cli` به‌صورت پیش‌فرض روی `liveSession: "claude-stdio"`، `output: "jsonl"`،
  و `input: "stdin"` تنظیم شده تا نوبت‌های پیگیری تا وقتی فعال است همان فرایند زنده Claude را دوباره استفاده کنند. اکنون stdio گرم پیش‌فرض است، حتی برای configهای سفارشی که فیلدهای transport را حذف می‌کنند. اگر Gateway restart شود یا فرایند idle خارج شود، OpenClaw از session id ذخیره‌شده Claude ادامه می‌دهد. session idهای ذخیره‌شده پیش از resume در برابر transcript پروژه موجود و خواندنی بررسی می‌شوند، بنابراین bindingهای phantom با `reason=transcript-missing` پاک می‌شوند، به‌جای اینکه بی‌صدا یک session تازه Claude CLI زیر `--resume` شروع شود.
- sessionهای زنده Claude محافظ‌های محدودکننده خروجی JSONL دارند. پیش‌فرض‌ها تا
  8 MiB و 20,000 خط خام JSONL برای هر نوبت اجازه می‌دهند. نوبت‌های Claude با tool زیاد می‌توانند آن‌ها را برای هر backend با
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و `maxTurnLines` بالا ببرند؛ OpenClaw این تنظیمات را به 64 MiB و 100,000
  خط محدود می‌کند.
- sessionهای CLI ذخیره‌شده تداومِ مالکیت‌شده توسط provider هستند. reset ضمنی روزانه session
  آن‌ها را قطع نمی‌کند؛ `/reset` و policyهای صریح `session.reset` همچنان
  این کار را انجام می‌دهند.

نکات serialization:

- `serialize: true` اجراهای هم‌lane را مرتب نگه می‌دارد.
- بیشتر CLIها روی یک lane ارائه‌دهنده serialize می‌شوند.
- وقتی هویت auth انتخاب‌شده تغییر کند، OpenClaw استفاده دوباره از session ذخیره‌شده CLI را کنار می‌گذارد،
  از جمله auth profile id تغییرکرده، static API key، static token، یا هویت account در OAuth
  وقتی CLI یکی را expose کند. چرخش OAuth access و refresh token
  session ذخیره‌شده CLI را قطع نمی‌کند. اگر یک CLI شناسه پایدار account در OAuth
  expose نکند، OpenClaw اجازه می‌دهد همان CLI مجوزهای resume را enforce کند.

## پیش‌درآمد fallback از sessionهای claude-cli

وقتی یک تلاش `claude-cli` به یک candidate غیر CLI در
[`agents.defaults.model.fallbacks`](/fa/concepts/model-failover) fail over می‌کند، OpenClaw
تلاش بعدی را با یک پیش‌درآمد زمینه‌ای seed می‌کند که از transcript محلی JSONL در Claude Code
در `~/.claude/projects/` برداشت شده است. بدون این seed، ارائه‌دهنده fallback
سرد شروع می‌کرد چون transcript session خود OpenClaw برای اجراهای `claude-cli` خالی است.

- prelude آخرین summary مربوط به `/compact` یا marker مربوط به `compact_boundary` را ترجیح می‌دهد،
  سپس تازه‌ترین نوبت‌های پس از boundary را تا سقف بودجه char اضافه می‌کند. نوبت‌های پیش از boundary حذف می‌شوند چون summary از قبل نماینده آن‌هاست.
- blockهای tool به hintهای فشرده `(tool call: name)` و
  `(tool result: …)` ادغام می‌شوند تا بودجه prompt واقعی بماند. اگر summary سرریز شود با
  `(truncated)` برچسب‌گذاری می‌شود.
- fallbackهای هم‌ارائه‌دهنده از `claude-cli` به `claude-cli` به `--resume` خود Claude متکی هستند و prelude را رد می‌کنند.
- این seed همان اعتبارسنجی موجود مسیر session-file در Claude را دوباره استفاده می‌کند، بنابراین مسیرهای arbitrary نمی‌توانند خوانده شوند.

## تصاویر (عبور مستقیم)

اگر CLI شما مسیرهای تصویر را می‌پذیرد، `imageArg` را تنظیم کنید:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw تصاویر base64 را در فایل‌های temp می‌نویسد. اگر `imageArg` تنظیم شده باشد، آن مسیرها به‌عنوان args به CLI پاس داده می‌شوند. اگر `imageArg` وجود نداشته باشد، OpenClaw مسیرهای فایل را به prompt اضافه می‌کند (path injection)، که برای CLIهایی که فایل‌های محلی را به‌صورت خودکار از مسیرهای ساده بارگذاری می‌کنند کافی است.

## ورودی‌ها / خروجی‌ها

- `output: "json"` (پیش‌فرض) تلاش می‌کند JSON را parse کند و متن + session id را استخراج کند.
- برای خروجی JSON در Gemini CLI، وقتی `usage` وجود ندارد یا خالی است، OpenClaw متن پاسخ را از `response` و
  usage را از `stats` می‌خواند.
- `output: "jsonl"` استریم‌های JSONL را parse می‌کند (برای مثال Codex CLI `--json`) و پیام نهایی agent به‌علاوه شناسه‌های session را در صورت وجود استخراج می‌کند.
- `output: "text"` stdout را پاسخ نهایی در نظر می‌گیرد.

حالت‌های ورودی:

- `input: "arg"` (پیش‌فرض) prompt را به‌عنوان آخرین arg در CLI پاس می‌دهد.
- `input: "stdin"` prompt را از طریق stdin می‌فرستد.
- اگر prompt بسیار طولانی باشد و `maxPromptArgChars` تنظیم شده باشد، از stdin استفاده می‌شود.

## پیش‌فرض‌ها (مالکیت‌شده توسط Plugin)

Plugin همراه OpenAI همچنین یک پیش‌فرض برای `codex-cli` ثبت می‌کند:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin همراه Google نیز یک پیش‌فرض برای `google-gemini-cli` ثبت می‌کند:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

پیش‌نیاز: Gemini CLI محلی باید نصب شده و به‌صورت
`gemini` روی `PATH` در دسترس باشد (`brew install gemini-cli` یا
`npm install -g @google/gemini-cli`).

نکات JSON در Gemini CLI:

- متن پاسخ از فیلد JSON `response` خوانده می‌شود.
- وقتی `usage` وجود ندارد یا خالی است، مصرف به `stats` برمی‌گردد.
- `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
- اگر `stats.input` موجود نباشد، OpenClaw توکن‌های ورودی را از
  `stats.input_tokens - stats.cached` به دست می‌آورد.

فقط در صورت نیاز بازنویسی کنید (رایج: مسیر مطلق `command`).

## پیش‌فرض‌های متعلق به Plugin

پیش‌فرض‌های backend مربوط به CLI اکنون بخشی از سطح Plugin هستند:

- Pluginها آن‌ها را با `api.registerCliBackend(...)` ثبت می‌کنند.
- `id` مربوط به backend به پیشوند provider در ارجاع‌های مدل تبدیل می‌شود.
- پیکربندی کاربر در `agents.defaults.cliBackends.<id>` همچنان پیش‌فرض Plugin را بازنویسی می‌کند.
- پاک‌سازی پیکربندی ویژه‌ی backend از طریق hook اختیاری
  `normalizeConfig` همچنان متعلق به Plugin می‌ماند.

Pluginهایی که به shimهای کوچک سازگاری prompt/message نیاز دارند، می‌توانند
تبدیل‌های متنی دوسویه را بدون جایگزین کردن provider یا backend مربوط به CLI تعریف کنند:

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
دلتاهای جاری‌شونده‌ی دستیار و متن نهایی تجزیه‌شده را پیش از آن‌که OpenClaw
نشانگرهای کنترلی و تحویل به کانال خودش را مدیریت کند، بازنویسی می‌کند.

برای CLIهایی که JSONL سازگار با Claude Code stream-json تولید می‌کنند، در پیکربندی همان backend مقدار
`jsonlDialect: "claude-stream-json"` را تنظیم کنید.

## پوشش‌های MCP همراه

backendهای CLI فراخوانی ابزار OpenClaw را به‌طور مستقیم دریافت نمی‌کنند، اما یک backend می‌تواند
با `bundleMcp: true` از پوشش پیکربندی MCP تولیدشده استفاده کند.

رفتار همراه فعلی:

- `claude-cli`: فایل پیکربندی MCP سخت‌گیرانه‌ی تولیدشده
- `codex-cli`: بازنویسی‌های پیکربندی درون‌خطی برای `mcp_servers`؛ سرور loopback تولیدشده‌ی
  OpenClaw با حالت تأیید ابزارِ هر سرور در Codex علامت‌گذاری می‌شود
  تا فراخوانی‌های MCP روی promptهای تأیید محلی متوقف نشوند
- `google-gemini-cli`: فایل تنظیمات سیستم Gemini تولیدشده

وقتی MCP همراه فعال باشد، OpenClaw:

- یک سرور MCP مبتنی بر HTTP loopback راه‌اندازی می‌کند که ابزارهای gateway را در اختیار فرایند CLI می‌گذارد
- پل را با یک توکن ویژه‌ی هر نشست (`OPENCLAW_MCP_TOKEN`) احراز هویت می‌کند
- دسترسی ابزار را به نشست، حساب و زمینه‌ی کانال فعلی محدود می‌کند
- سرورهای MCP همراه فعال‌شده را برای workspace فعلی بارگذاری می‌کند
- آن‌ها را با هر شکل موجود از پیکربندی/تنظیمات MCP مربوط به backend ادغام می‌کند
- پیکربندی اجرا را با استفاده از حالت یکپارچه‌سازی متعلق به backend از extension مالک بازنویسی می‌کند

اگر هیچ سرور MCP فعالی وجود نداشته باشد، OpenClaw همچنان وقتی یک
backend استفاده از MCP همراه را انتخاب کرده باشد، یک پیکربندی سخت‌گیرانه تزریق می‌کند تا اجراهای پس‌زمینه ایزوله بمانند.

runtimeهای MCP همراهِ محدود به نشست برای استفاده‌ی دوباره در همان نشست cache می‌شوند و سپس
پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بیکاری پاک‌سازی می‌شوند (پیش‌فرض ۱۰
دقیقه؛ برای غیرفعال کردن `0` را تنظیم کنید). اجراهای تعبیه‌شده‌ی یک‌باره مانند بررسی‌های auth،
تولید slug و یادآوری active-memory در پایان اجرا درخواست پاک‌سازی می‌کنند تا فرزندان stdio
و جریان‌های Streamable HTTP/SSE پس از اجرا باقی نمانند.

## محدودیت‌ها

- **بدون فراخوانی مستقیم ابزار OpenClaw.** OpenClaw فراخوانی ابزار را به
  پروتکل backend مربوط به CLI تزریق نمی‌کند. backendها فقط وقتی ابزارهای gateway را می‌بینند که استفاده از
  `bundleMcp: true` را انتخاب کرده باشند.
- **Streaming وابسته به backend است.** برخی backendها JSONL را stream می‌کنند؛ برخی دیگر
  تا زمان خروج، buffer می‌کنند.
- **خروجی‌های ساخت‌یافته** به قالب JSON در CLI بستگی دارند.
- **نشست‌های Codex CLI** از طریق خروجی متنی از سر گرفته می‌شوند (بدون JSONL)، که نسبت به اجرای اولیه‌ی `--json`
  ساختار کمتری دارد. نشست‌های OpenClaw همچنان
  به‌طور عادی کار می‌کنند.

## عیب‌یابی

- **CLI پیدا نشد**: `command` را روی یک مسیر کامل تنظیم کنید.
- **نام مدل نادرست**: از `modelAliases` برای نگاشت `provider/model` → مدل CLI استفاده کنید.
- **نبود پیوستگی نشست**: مطمئن شوید `sessionArg` تنظیم شده و `sessionMode` برابر
  `none` نیست (Codex CLI در حال حاضر نمی‌تواند با خروجی JSON از سر گرفته شود).
- **تصاویر نادیده گرفته می‌شوند**: `imageArg` را تنظیم کنید (و بررسی کنید CLI از مسیرهای فایل پشتیبانی می‌کند).

## مرتبط

- [راهنمای عملیاتی Gateway](/fa/gateway)
- [مدل‌های محلی](/fa/gateway/local-models)
