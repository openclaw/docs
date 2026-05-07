---
read_when:
    - وقتی ارائه‌دهندگان API با شکست مواجه می‌شوند، به یک گزینهٔ جایگزین قابل اعتماد نیاز دارید
    - شما Codex CLI یا دیگر CLIهای محلی هوش مصنوعی را اجرا می‌کنید و می‌خواهید دوباره از آن‌ها استفاده کنید
    - می‌خواهید پل لوپ‌بک MCP را برای دسترسی به ابزارهای بک‌اند CLI درک کنید
summary: 'بک‌اندهای CLI: جایگزین CLI هوش مصنوعی محلی با پل اختیاری ابزار MCP'
title: بک‌اندهای CLI
x-i18n:
    generated_at: "2026-05-07T13:18:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw می‌تواند **CLIهای AI محلی** را به‌عنوان **fallback فقط‌متنی** اجرا کند، وقتی ارائه‌دهندگان API از دسترس خارج‌اند، محدودیت نرخ دارند، یا موقتاً درست کار نمی‌کنند. این رفتار عمداً محافظه‌کارانه است:

- **ابزارهای OpenClaw مستقیماً تزریق نمی‌شوند**، اما بک‌اندهایی با `bundleMcp: true`
  می‌توانند ابزارهای gateway را از طریق یک پل MCP روی local loopback دریافت کنند.
- **استریم JSONL** برای CLIهایی که از آن پشتیبانی می‌کنند.
- **جلسه‌ها پشتیبانی می‌شوند** (بنابراین نوبت‌های پیگیری منسجم می‌مانند).
- **تصویرها می‌توانند عبور داده شوند** اگر CLI مسیرهای تصویر را بپذیرد.

این قابلیت بیشتر به‌عنوان یک **شبکه ایمنی** طراحی شده است تا مسیر اصلی. وقتی
پاسخ‌های متنی «همیشه کار می‌کند» می‌خواهید، بدون اتکا به APIهای خارجی، از آن استفاده کنید.

اگر runtime کاملی برای harness با کنترل‌های جلسه ACP، کارهای پس‌زمینه،
اتصال thread/گفت‌وگو، و جلسه‌های کدنویسی خارجی پایدار می‌خواهید، به‌جای آن از
[عامل‌های ACP](/fa/tools/acp-agents) استفاده کنید. بک‌اندهای CLI، ACP نیستند.

<Tip>
  در حال ساخت یک Plugin بک‌اند جدید هستید؟ از
  [Pluginهای بک‌اند CLI](/fa/plugins/cli-backend-plugins) استفاده کنید. این صفحه برای کاربرانی است
  که بک‌اندی را پیکربندی و اجرا می‌کنند که از قبل ثبت شده است.
</Tip>

## شروع سریع مناسب مبتدیان

می‌توانید از Codex CLI **بدون هیچ پیکربندی** استفاده کنید (Plugin بسته‌بندی‌شده OpenAI
یک بک‌اند پیش‌فرض ثبت می‌کند):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

اگر gateway شما زیر launchd/systemd اجرا می‌شود و PATH حداقلی است، فقط مسیر
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

همین. هیچ کلید یا پیکربندی احراز هویت اضافه‌ای فراتر از خود CLI لازم نیست.

اگر از یک بک‌اند CLI بسته‌بندی‌شده به‌عنوان **ارائه‌دهنده اصلی پیام** روی یک
میزبان gateway استفاده می‌کنید، OpenClaw اکنون وقتی پیکربندی شما صریحاً در یک ارجاع مدل یا زیر
`agents.defaults.cliBackends` به آن بک‌اند اشاره کند، Plugin بسته‌بندی‌شده مالک آن را به‌طور خودکار بارگذاری می‌کند.

## استفاده از آن به‌عنوان fallback

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

- اگر از `agents.defaults.models` (فهرست مجاز) استفاده می‌کنید، باید مدل‌های بک‌اند CLI خود را هم آنجا وارد کنید.
- اگر ارائه‌دهنده اصلی شکست بخورد (احراز هویت، محدودیت نرخ، timeout)، OpenClaw
  بعد از آن بک‌اند CLI را امتحان می‌کند.

## نمای کلی پیکربندی

همه بک‌اندهای CLI زیر این مسیر قرار می‌گیرند:

```
agents.defaults.cliBackends
```

هر ورودی با یک **شناسه ارائه‌دهنده** کلیدگذاری می‌شود (مثلاً `codex-cli`، `my-cli`).
شناسه ارائه‌دهنده سمت چپ ارجاع مدل شما می‌شود:

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

1. **یک بک‌اند را انتخاب می‌کند** بر اساس پیشوند ارائه‌دهنده (`codex-cli/...`).
2. **یک پرامپت سیستم می‌سازد** با استفاده از همان پرامپت OpenClaw و زمینه workspace.
3. **CLI را اجرا می‌کند** با شناسه جلسه (اگر پشتیبانی شود) تا تاریخچه سازگار بماند.
   بک‌اند بسته‌بندی‌شده `claude-cli` برای هر جلسه OpenClaw یک فرایند Claude stdio را زنده نگه می‌دارد
   و نوبت‌های پیگیری را از طریق stdin با stream-json ارسال می‌کند.
4. **خروجی را parse می‌کند** (JSON یا متن ساده) و متن نهایی را برمی‌گرداند.
5. **شناسه‌های جلسه را پایدار می‌کند** برای هر بک‌اند، تا پیگیری‌ها از همان جلسه CLI دوباره استفاده کنند.

<Note>
بک‌اند بسته‌بندی‌شده Anthropic `claude-cli` دوباره پشتیبانی می‌شود. کارکنان Anthropic
به ما گفتند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw
استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic
سیاست جدیدی منتشر کند.
</Note>

بک‌اند بسته‌بندی‌شده OpenAI `codex-cli` پرامپت سیستم OpenClaw را از طریق
override پیکربندی `model_instructions_file` در Codex عبور می‌دهد (`-c
model_instructions_file="..."`). Codex فلگی شبیه Claude مثل
`--append-system-prompt` ارائه نمی‌کند، بنابراین OpenClaw پرامپت گردآوری‌شده را برای هر
جلسه تازه Codex CLI در یک فایل موقت می‌نویسد.

بک‌اند بسته‌بندی‌شده Anthropic `claude-cli` اسنپ‌شات Skills مربوط به OpenClaw را
از دو راه دریافت می‌کند: کاتالوگ فشرده Skills در OpenClaw داخل پرامپت سیستم افزوده‌شده، و
یک Plugin موقت Claude Code که با `--plugin-dir` پاس داده می‌شود. Plugin فقط
Skills واجد شرایط برای آن agent/session را در بر دارد، بنابراین resolver بومی skill در Claude Code
همان مجموعه فیلترشده‌ای را می‌بیند که OpenClaw در غیر این صورت در پرامپت اعلام می‌کرد.
overrideهای env/API key مربوط به Skill همچنان توسط OpenClaw روی محیط فرایند فرزند
برای اجرا اعمال می‌شوند.

Claude CLI همچنین حالت مجوز غیرتعاملی خودش را دارد. OpenClaw آن را به
سیاست exec موجود map می‌کند، به‌جای اینکه پیکربندی مخصوص Claude اضافه کند: وقتی
سیاست exec مؤثرِ درخواست‌شده YOLO باشد (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، OpenClaw مقدار `--permission-mode bypassPermissions` را اضافه می‌کند.
تنظیمات اختصاصی هر عامل در `agents.list[].tools.exec` تنظیمات سراسری `tools.exec` را برای
آن عامل override می‌کند. برای اجبار به یک حالت متفاوت Claude، raw backend args صریح
مثل `--permission-mode default` یا `--permission-mode acceptEdits` را زیر
`agents.defaults.cliBackends.claude-cli.args` و `resumeArgs` متناظر تنظیم کنید.

بک‌اند بسته‌بندی‌شده Anthropic `claude-cli` همچنین سطح‌های `/think` در OpenClaw را
برای سطح‌های غیر off به فلگ بومی `--effort` در Claude Code map می‌کند. `minimal` و
`low` به `low`، `adaptive` و `medium` به `medium`، و `high`،
`xhigh`، و `max` مستقیماً map می‌شوند. بک‌اندهای CLI دیگر نیاز دارند Plugin مالکشان
یک mapper معادل برای argv اعلام کند تا `/think` بتواند روی CLI اجراشده اثر بگذارد.

پیش از آنکه OpenClaw بتواند از بک‌اند بسته‌بندی‌شده `claude-cli` استفاده کند، خود Claude Code
باید از قبل روی همان میزبان وارد شده باشد:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

از `agents.defaults.cliBackends.claude-cli.command` فقط وقتی استفاده کنید که باینری `claude`
از قبل در `PATH` نیست.

## جلسه‌ها

- اگر CLI از جلسه‌ها پشتیبانی می‌کند، `sessionArg` (مثلاً `--session-id`) یا
  `sessionArgs` (placeholder `{sessionId}`) را وقتی شناسه باید در چند فلگ درج شود تنظیم کنید.
- اگر CLI از یک **زیر‌دستور resume** با فلگ‌های متفاوت استفاده می‌کند، `resumeArgs`
  را تنظیم کنید (هنگام resume جایگزین `args` می‌شود) و به‌صورت اختیاری `resumeOutput`
  را هم تنظیم کنید (برای resumeهای غیر JSON).
- `sessionMode`:
  - `always`: همیشه شناسه جلسه ارسال کن (اگر چیزی ذخیره نشده باشد UUID جدید).
  - `existing`: فقط اگر قبلاً شناسه‌ای ذخیره شده باشد، شناسه جلسه ارسال کن.
  - `none`: هرگز شناسه جلسه ارسال نکن.
- مقدار پیش‌فرض `claude-cli` برابر است با `liveSession: "claude-stdio"`، `output: "jsonl"`،
  و `input: "stdin"`، بنابراین نوبت‌های پیگیری تا وقتی فرایند زنده Claude فعال است از آن دوباره استفاده می‌کنند.
  اکنون stdio گرم پیش‌فرض است، از جمله برای پیکربندی‌های سفارشی
  که فیلدهای transport را حذف می‌کنند. اگر Gateway دوباره راه‌اندازی شود یا فرایند idle
  خارج شود، OpenClaw از شناسه جلسه ذخیره‌شده Claude resume می‌کند. شناسه‌های جلسه ذخیره‌شده
  پیش از resume در برابر transcript پروژه موجود و خواندنی بررسی می‌شوند، بنابراین bindingهای خیالی
  با `reason=transcript-missing` پاک می‌شوند، به‌جای اینکه بی‌سروصدا یک جلسه تازه Claude CLI زیر `--resume` شروع شود.
- جلسه‌های زنده Claude guardهای محدود JSONL output را نگه می‌دارند. پیش‌فرض‌ها تا
  8 MiB و 20,000 خط خام JSONL برای هر نوبت اجازه می‌دهند. نوبت‌های Claude با ابزار زیاد می‌توانند
  آن‌ها را برای هر بک‌اند با
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  و `maxTurnLines` افزایش دهند؛ OpenClaw این تنظیمات را به 64 MiB و 100,000
  خط محدود می‌کند.
- جلسه‌های CLI ذخیره‌شده، تداوم مالکیت‌شده توسط ارائه‌دهنده هستند. reset ضمنی روزانه جلسه
  آن‌ها را قطع نمی‌کند؛ `/reset` و سیاست‌های صریح `session.reset` همچنان
  این کار را انجام می‌دهند.

نکته‌های serialization:

- `serialize: true` اجراهای همان lane را مرتب نگه می‌دارد.
- بیشتر CLIها روی یک lane ارائه‌دهنده serialize می‌شوند.
- وقتی هویت auth انتخاب‌شده تغییر کند، OpenClaw استفاده دوباره از جلسه CLI ذخیره‌شده را کنار می‌گذارد،
  از جمله تغییر شناسه پروفایل auth، کلید API ثابت، token ثابت، یا هویت
  حساب OAuth وقتی CLI یکی را آشکار کند. چرخش access token و refresh token در OAuth
  جلسه CLI ذخیره‌شده را قطع نمی‌کند. اگر CLI شناسه حساب OAuth پایدار آشکار نکند،
  OpenClaw اجازه می‌دهد همان CLI مجوزهای resume را enforce کند.

## prelude fallback از جلسه‌های claude-cli

وقتی یک تلاش `claude-cli` به یک کاندید غیر CLI در
[`agents.defaults.model.fallbacks`](/fa/concepts/model-failover) fail over می‌کند، OpenClaw
تلاش بعدی را با یک prelude زمینه‌ای که از transcript محلی JSONL در Claude Code
در `~/.claude/projects/` برداشت شده seed می‌کند. بدون این seed، ارائه‌دهنده fallback
از صفر شروع می‌کرد، چون transcript جلسه خود OpenClaw برای اجراهای `claude-cli` خالی است.

- prelude تازه‌ترین خلاصه `/compact` یا نشانگر `compact_boundary` را ترجیح می‌دهد،
  سپس تازه‌ترین نوبت‌های پس از boundary را تا سقف بودجه کاراکتر اضافه می‌کند.
  نوبت‌های پیش از boundary حذف می‌شوند، چون خلاصه از قبل نماینده آن‌هاست.
- بلوک‌های ابزار به hintهای فشرده `(tool call: name)` و
  `(tool result: …)` ادغام می‌شوند تا بودجه پرامپت واقعی بماند. اگر خلاصه
  از حد بگذرد با `(truncated)` برچسب می‌خورد.
- fallbackهای `claude-cli` به `claude-cli` با همان ارائه‌دهنده به
  `--resume` خود Claude تکیه می‌کنند و prelude را رد می‌کنند.
- seed از اعتبارسنجی موجود مسیر فایل جلسه Claude دوباره استفاده می‌کند، بنابراین
  مسیرهای دلخواه نمی‌توانند خوانده شوند.

## تصویرها (عبور مستقیم)

اگر CLI شما مسیرهای تصویر را می‌پذیرد، `imageArg` را تنظیم کنید:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw تصویرهای base64 را در فایل‌های موقت می‌نویسد. اگر `imageArg` تنظیم شده باشد، آن
مسیرها به‌عنوان آرگومان‌های CLI پاس داده می‌شوند. اگر `imageArg` وجود نداشته باشد، OpenClaw
مسیرهای فایل را به پرامپت اضافه می‌کند (تزریق مسیر)، که برای CLIهایی که فایل‌های محلی را
از مسیرهای ساده به‌طور خودکار load می‌کنند کافی است.

## ورودی‌ها / خروجی‌ها

- `output: "json"` (پیش‌فرض) تلاش می‌کند JSON را parse کند و متن + شناسه جلسه را استخراج کند.
- برای خروجی JSON در Gemini CLI، وقتی `usage` وجود ندارد یا خالی است، OpenClaw متن پاسخ را از `response` و
  usage را از `stats` می‌خواند.
- `output: "jsonl"` استریم‌های JSONL را parse می‌کند (برای مثال Codex CLI `--json`) و پیام نهایی عامل را به‌علاوه شناسه‌های جلسه، در صورت وجود، استخراج می‌کند.
- `output: "text"` با stdout به‌عنوان پاسخ نهایی رفتار می‌کند.

حالت‌های ورودی:

- `input: "arg"` (پیش‌فرض) پرامپت را به‌عنوان آخرین آرگومان CLI پاس می‌دهد.
- `input: "stdin"` پرامپت را از طریق stdin ارسال می‌کند.
- اگر پرامپت بسیار طولانی باشد و `maxPromptArgChars` تنظیم شده باشد، از stdin استفاده می‌شود.

## پیش‌فرض‌ها (مالکیت‌شده توسط Plugin)

Plugin بسته‌بندی‌شده OpenAI همچنین یک مقدار پیش‌فرض برای `codex-cli` ثبت می‌کند:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin بسته‌بندی‌شده Google نیز یک مقدار پیش‌فرض برای `google-gemini-cli` ثبت می‌کند:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

پیش‌نیاز: CLI محلی Gemini باید نصب شده و به‌صورت
`gemini` در `PATH` در دسترس باشد (`brew install gemini-cli` یا
`npm install -g @google/gemini-cli`).

نکات JSON مربوط به CLI Gemini:

- متن پاسخ از فیلد JSON با نام `response` خوانده می‌شود.
- وقتی `usage` وجود نداشته باشد یا خالی باشد، مصرف به `stats` بازمی‌گردد.
- `stats.cached` در OpenClaw به `cacheRead` نرمال‌سازی می‌شود.
- اگر `stats.input` موجود نباشد، OpenClaw توکن‌های ورودی را از
  `stats.input_tokens - stats.cached` استخراج می‌کند.

فقط در صورت نیاز بازنویسی کنید (رایج: مسیر مطلق `command`).

## پیش‌فرض‌های متعلق به Plugin

پیش‌فرض‌های بک‌اند CLI اکنون بخشی از سطح Plugin هستند:

- Plugins آن‌ها را با `api.registerCliBackend(...)` ثبت می‌کنند.
- `id` بک‌اند به پیشوند ارائه‌دهنده در ارجاع‌های مدل تبدیل می‌شود.
- پیکربندی کاربر در `agents.defaults.cliBackends.<id>` همچنان پیش‌فرض Plugin را بازنویسی می‌کند.
- پاک‌سازی پیکربندی اختصاصی بک‌اند از طریق هوک اختیاری
  `normalizeConfig` همچنان متعلق به Plugin باقی می‌ماند.

Plugins که به شیم‌های کوچک سازگاری پرامپت/پیام نیاز دارند، می‌توانند تبدیل‌های
متنی دوسویه را بدون جایگزین کردن یک ارائه‌دهنده یا بک‌اند CLI اعلام کنند:

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
دلتاهای دستیار در جریان و متن نهایی تجزیه‌شده را، پیش از اینکه OpenClaw نشانگرهای
کنترلی خودش و تحویل کانال را مدیریت کند، بازنویسی می‌کند.

برای CLIهایی که JSONL سازگار با Claude Code stream-json تولید می‌کنند،
`jsonlDialect: "claude-stream-json"` را روی پیکربندی همان بک‌اند تنظیم کنید.

## پوشش‌های MCP بسته

بک‌اندهای CLI تماس‌های ابزار OpenClaw را مستقیما دریافت **نمی‌کنند**، اما یک بک‌اند می‌تواند
با `bundleMcp: true` در یک پوشش پیکربندی MCP تولیدشده شرکت کند.

رفتار بسته‌شده فعلی:

- `claude-cli`: فایل پیکربندی سخت‌گیرانه MCP تولیدشده
- `codex-cli`: بازنویسی‌های پیکربندی درون‌خطی برای `mcp_servers`؛ سرور
  local loopback تولیدشده OpenClaw با حالت تایید ابزارِ مخصوص هر سرور در Codex
  علامت‌گذاری می‌شود تا تماس‌های MCP روی پرامپت‌های تایید محلی متوقف نشوند
- `google-gemini-cli`: فایل تنظیمات سیستم Gemini تولیدشده

وقتی MCP بسته فعال باشد، OpenClaw:

- یک سرور HTTP MCP از نوع loopback اجرا می‌کند که ابزارهای gateway را در اختیار فرایند CLI قرار می‌دهد
- پل را با یک توکن مخصوص هر نشست (`OPENCLAW_MCP_TOKEN`) احراز هویت می‌کند
- دسترسی ابزار را به نشست، حساب، و زمینه کانال فعلی محدود می‌کند
- سرورهای bundle-MCP فعال را برای فضای کاری فعلی بارگذاری می‌کند
- آن‌ها را با هر شکل پیکربندی/تنظیمات MCP موجود برای بک‌اند ادغام می‌کند
- پیکربندی اجرا را با استفاده از حالت یکپارچه‌سازی متعلق به بک‌اند از extension مالک بازنویسی می‌کند

اگر هیچ سرور MCP فعالی وجود نداشته باشد، OpenClaw همچنان وقتی یک
بک‌اند در MCP بسته شرکت می‌کند، پیکربندی سخت‌گیرانه‌ای تزریق می‌کند تا اجراهای پس‌زمینه ایزوله بمانند.

runtimeهای MCP بسته و محدود به نشست برای استفاده دوباره درون یک نشست کش می‌شوند، سپس
پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بیکاری حذف می‌شوند (پیش‌فرض 10
دقیقه؛ برای غیرفعال کردن `0` تنظیم کنید). اجراهای تعبیه‌شده یک‌باره مانند بررسی‌های احراز هویت،
تولید slug، و درخواست‌های بازیابی active-memory در پایان اجرا پاک‌سازی می‌شوند تا فرزندان stdio
و جریان‌های Streamable HTTP/SSE پس از اجرا باقی نمانند.

## محدودیت‌ها

- **بدون تماس مستقیم ابزار OpenClaw.** OpenClaw تماس‌های ابزار را به
  پروتکل بک‌اند CLI تزریق نمی‌کند. بک‌اندها فقط وقتی ابزارهای gateway را می‌بینند که در
  `bundleMcp: true` شرکت کنند.
- **Streaming وابسته به بک‌اند است.** برخی بک‌اندها JSONL را به‌صورت جریان ارسال می‌کنند؛ برخی دیگر تا
  زمان خروج، خروجی را بافر می‌کنند.
- **خروجی‌های ساختاریافته** به قالب JSON مربوط به CLI وابسته‌اند.
- **نشست‌های CLI Codex** از طریق خروجی متنی از سر گرفته می‌شوند (بدون JSONL)، که نسبت به اجرای اولیه `--json`
  ساختار کمتری دارد. نشست‌های OpenClaw همچنان
  به‌صورت عادی کار می‌کنند.

## عیب‌یابی

- **CLI پیدا نشد**: `command` را روی یک مسیر کامل تنظیم کنید.
- **نام مدل نادرست**: از `modelAliases` برای نگاشت `provider/model` → مدل CLI استفاده کنید.
- **نبود پیوستگی نشست**: مطمئن شوید `sessionArg` تنظیم شده و `sessionMode`
  برابر `none` نیست (CLI Codex در حال حاضر نمی‌تواند با خروجی JSON از سر گرفته شود).
- **تصاویر نادیده گرفته می‌شوند**: `imageArg` را تنظیم کنید (و بررسی کنید که CLI از مسیرهای فایل پشتیبانی می‌کند).

## مرتبط

- [دفترچه اجرایی Gateway](/fa/gateway)
- [مدل‌های محلی](/fa/gateway/local-models)
