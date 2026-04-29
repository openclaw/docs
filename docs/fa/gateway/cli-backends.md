---
read_when:
    - زمانی که ارائه‌دهندگان رابط‌های برنامه‌نویسی کاربردی دچار خطا می‌شوند، به یک جایگزین قابل اعتماد نیاز دارید
    - شما Codex CLI یا سایر CLIهای محلی هوش مصنوعی را اجرا می‌کنید و می‌خواهید دوباره از آن‌ها استفاده کنید
    - می‌خواهید پل لوپ‌بک MCP را برای دسترسی ابزارها به بک‌اند CLI درک کنید
summary: 'پشت‌اندهای CLI: مسیر جایگزین محلی CLI هوش مصنوعی با پل اختیاری ابزار MCP'
title: بک‌اندهای CLI
x-i18n:
    generated_at: "2026-04-29T22:49:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 438862ed127a823dcdedc4aacb77b2facb13caa08f7986ef8402833777b6574e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw می‌تواند **CLIهای AI محلی** را به‌عنوان یک **مسیر جایگزین فقط متنی** اجرا کند، وقتی ارائه‌دهندگان API از دسترس خارج‌اند،
با محدودیت نرخ مواجه شده‌اند، یا موقتاً رفتار نادرست دارند. این رفتار عمداً محافظه‌کارانه است:

- **ابزارهای OpenClaw مستقیماً تزریق نمی‌شوند**، اما بک‌اندهایی با `bundleMcp: true`
  می‌توانند ابزارهای Gateway را از طریق یک پل MCP روی local loopback دریافت کنند.
- **استریم JSONL** برای CLIهایی که از آن پشتیبانی می‌کنند.
- **نشست‌ها پشتیبانی می‌شوند** (پس نوبت‌های بعدی منسجم می‌مانند).
- **تصاویر می‌توانند عبور داده شوند** اگر CLI مسیرهای تصویر را بپذیرد.

این به‌عنوان یک **شبکه ایمنی** طراحی شده است، نه مسیر اصلی. وقتی از آن استفاده کنید که
پاسخ‌های متنی «همیشه کار می‌کند» می‌خواهید، بدون اتکا به APIهای خارجی.

اگر یک runtime کامل هارنس با کنترل‌های نشست ACP، وظایف پس‌زمینه،
اتصال thread/conversation، و نشست‌های کدنویسی خارجی پایدار می‌خواهید، به‌جای آن از
[عامل‌های ACP](/fa/tools/acp-agents) استفاده کنید. بک‌اندهای CLI، ACP نیستند.

## شروع سریع مناسب مبتدیان

می‌توانید از Codex CLI **بدون هیچ پیکربندی** استفاده کنید (Plugin داخلی OpenAI
یک بک‌اند پیش‌فرض ثبت می‌کند):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

اگر Gateway شما زیر launchd/systemd اجرا می‌شود و PATH حداقلی است، فقط
مسیر فرمان را اضافه کنید:

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

همین کافی است. هیچ کلید یا پیکربندی احراز هویت اضافی فراتر از خود CLI لازم نیست.

اگر از یک بک‌اند CLI داخلی به‌عنوان **ارائه‌دهنده پیام اصلی** روی یک
میزبان Gateway استفاده می‌کنید، OpenClaw اکنون وقتی پیکربندی شما به‌صراحت به آن بک‌اند در یک ارجاع مدل یا زیر
`agents.defaults.cliBackends` اشاره کند، Plugin داخلی مالک آن را خودکار بارگذاری می‌کند.

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

- اگر از `agents.defaults.models` (allowlist) استفاده می‌کنید، باید مدل‌های بک‌اند CLI خود را هم آنجا اضافه کنید.
- اگر ارائه‌دهنده اصلی شکست بخورد (احراز هویت، محدودیت نرخ، timeout)، OpenClaw
  در مرحله بعد بک‌اند CLI را امتحان می‌کند.

## نمای کلی پیکربندی

همه بک‌اندهای CLI زیر این مسیر قرار دارند:

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

## نحوه کارکرد

1. **یک بک‌اند را انتخاب می‌کند** بر اساس پیشوند ارائه‌دهنده (`codex-cli/...`).
2. **یک system prompt می‌سازد** با همان prompt و زمینه workspace در OpenClaw.
3. **CLI را اجرا می‌کند** با یک شناسه نشست (اگر پشتیبانی شود) تا تاریخچه سازگار بماند.
   بک‌اند داخلی `claude-cli` برای هر نشست OpenClaw یک فرایند Claude stdio را زنده نگه می‌دارد
   و نوبت‌های بعدی را از طریق stdin با stream-json ارسال می‌کند.
4. **خروجی را parse می‌کند** (JSON یا متن ساده) و متن نهایی را برمی‌گرداند.
5. **شناسه‌های نشست را پایدار ذخیره می‌کند** برای هر بک‌اند، تا نوبت‌های بعدی از همان نشست CLI استفاده کنند.

<Note>
بک‌اند داخلی Anthropic با نام `claude-cli` دوباره پشتیبانی می‌شود. کارکنان Anthropic
به ما گفتند استفاده Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفاده از
`claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند مگر اینکه Anthropic
سیاست جدیدی منتشر کند.
</Note>

بک‌اند داخلی OpenAI با نام `codex-cli`، system prompt مربوط به OpenClaw را از طریق
بازنویسی پیکربندی `model_instructions_file` در Codex عبور می‌دهد (`-c
model_instructions_file="..."`). Codex یک پرچم شبیه Claude مانند
`--append-system-prompt` ارائه نمی‌کند، بنابراین OpenClaw برای هر نشست تازه Codex CLI، prompt مونتاژشده را در یک
فایل موقت می‌نویسد.

بک‌اند داخلی Anthropic با نام `claude-cli`، snapshot مربوط به Skills در OpenClaw را
از دو راه دریافت می‌کند: کاتالوگ فشرده Skills در OpenClaw داخل system prompt افزوده‌شده، و
یک Plugin موقت Claude Code که با `--plugin-dir` پاس داده می‌شود. Plugin فقط
Skills واجد شرایط برای آن agent/session را شامل می‌شود، بنابراین resolver بومی skill در Claude Code
همان مجموعه فیلترشده‌ای را می‌بیند که OpenClaw در غیر این صورت در
prompt اعلام می‌کرد. بازنویسی‌های env/API key مربوط به Skill همچنان توسط OpenClaw روی
محیط فرایند فرزند برای اجرا اعمال می‌شوند.

Claude CLI همچنین حالت مجوز noninteractive خودش را دارد. OpenClaw آن را
به policy موجود exec نگاشت می‌کند، به‌جای اینکه پیکربندی مخصوص Claude اضافه کند: وقتی
policy مؤثر و درخواست‌شده exec برابر YOLO باشد (`tools.exec.security: "full"` و
`tools.exec.ask: "off"`)، OpenClaw گزینه `--permission-mode bypassPermissions` را اضافه می‌کند.
تنظیمات `agents.list[].tools.exec` برای هر agent، تنظیمات سراسری `tools.exec` را برای
همان agent بازنویسی می‌کند. برای اجبار یک حالت متفاوت Claude، raw backend args صریح
مانند `--permission-mode default` یا `--permission-mode acceptEdits` را زیر
`agents.defaults.cliBackends.claude-cli.args` و `resumeArgs` متناظر تنظیم کنید.

قبل از اینکه OpenClaw بتواند از بک‌اند داخلی `claude-cli` استفاده کند، خود Claude Code
باید از قبل روی همان میزبان وارد شده باشد:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

فقط وقتی از `agents.defaults.cliBackends.claude-cli.command` استفاده کنید که باینری `claude`
از قبل روی `PATH` نباشد.

## نشست‌ها

- اگر CLI از نشست‌ها پشتیبانی می‌کند، `sessionArg` را تنظیم کنید (مثلاً `--session-id`) یا
  وقتی ID باید در چند پرچم درج شود، `sessionArgs` را (placeholder `{sessionId}`) تنظیم کنید.
- اگر CLI از یک **زیرفرمان resume** با پرچم‌های متفاوت استفاده می‌کند، `resumeArgs` را تنظیم کنید
  (هنگام resume جایگزین `args` می‌شود) و در صورت نیاز `resumeOutput` را هم تنظیم کنید
  (برای resumeهای غیر JSON).
- `sessionMode`:
  - `always`: همیشه یک شناسه نشست ارسال کن (اگر ذخیره نشده بود، UUID جدید).
  - `existing`: فقط اگر قبلاً ذخیره شده بود، شناسه نشست ارسال کن.
  - `none`: هرگز شناسه نشست ارسال نکن.
- `claude-cli` به‌صورت پیش‌فرض `liveSession: "claude-stdio"`، `output: "jsonl"`،
  و `input: "stdin"` دارد، تا نوبت‌های بعدی در زمان فعال بودن فرایند زنده Claude دوباره از آن استفاده کنند.
  stdio گرم اکنون پیش‌فرض است، از جمله برای پیکربندی‌های سفارشی
  که فیلدهای transport را حذف می‌کنند. اگر Gateway دوباره راه‌اندازی شود یا فرایند idle
  خارج شود، OpenClaw از شناسه نشست ذخیره‌شده Claude resume می‌کند. شناسه‌های نشست ذخیره‌شده
  پیش از resume با یک transcript پروژه خواندنی موجود بررسی می‌شوند، بنابراین bindingهای خیالی با
  `reason=transcript-missing` پاک می‌شوند، به‌جای اینکه بی‌صدا یک نشست تازه Claude CLI را زیر `--resume` آغاز کنند.
- نشست‌های CLI ذخیره‌شده، continuity متعلق به ارائه‌دهنده هستند. reset ضمنی نشست روزانه
  آن‌ها را قطع نمی‌کند؛ `/reset` و policyهای صریح `session.reset` همچنان
  این کار را انجام می‌دهند.

نکته‌های serialization:

- `serialize: true` اجراهای same-lane را به‌ترتیب نگه می‌دارد.
- بیشتر CLIها روی یک provider lane serialize می‌شوند.
- OpenClaw وقتی هویت احراز هویت انتخاب‌شده تغییر کند، استفاده دوباره از نشست CLI ذخیره‌شده را کنار می‌گذارد،
  از جمله تغییر شناسه auth profile، static API key، static token، یا هویت حساب OAuth
  وقتی CLI آن را ارائه کند. چرخش access token و refresh token در OAuth
  نشست CLI ذخیره‌شده را قطع نمی‌کند. اگر یک CLI شناسه حساب OAuth پایدار ارائه نکند،
  OpenClaw اجازه می‌دهد همان CLI مجوزهای resume را اعمال کند.

## پیش‌درآمد fallback از نشست‌های claude-cli

وقتی یک تلاش `claude-cli` به یک candidate غیر CLI در
[`agents.defaults.model.fallbacks`](/fa/concepts/model-failover) fail over می‌شود، OpenClaw
تلاش بعدی را با یک context prelude که از transcript محلی JSONL مربوط به Claude Code در `~/.claude/projects/` برداشت شده، seed می‌کند.
بدون این seed، ارائه‌دهنده fallback سرد شروع می‌کند، چون transcript نشست خود OpenClaw
برای اجراهای `claude-cli` خالی است.

- prelude آخرین خلاصه `/compact` یا marker مربوط به `compact_boundary` را ترجیح می‌دهد،
  سپس جدیدترین نوبت‌های پس از boundary را تا سقف char budget اضافه می‌کند.
  نوبت‌های پیش از boundary حذف می‌شوند چون خلاصه از قبل نماینده آن‌هاست.
- بلوک‌های ابزار به hintهای فشرده `(tool call: name)` و
  `(tool result: …)` ادغام می‌شوند تا بودجه prompt واقعی بماند. اگر خلاصه
  سرریز کند، با `(truncated)` برچسب‌گذاری می‌شود.
- fallbackهای same-provider از `claude-cli` به `claude-cli` به `--resume` خود Claude تکیه می‌کنند
  و prelude را رد می‌کنند.
- seed از validation موجود مسیر فایل نشست Claude دوباره استفاده می‌کند، بنابراین
  مسیرهای دلخواه قابل خواندن نیستند.

## تصاویر (عبور)

اگر CLI شما مسیرهای تصویر را می‌پذیرد، `imageArg` را تنظیم کنید:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw تصاویر base64 را در فایل‌های موقت می‌نویسد. اگر `imageArg` تنظیم شده باشد، آن
مسیرها به‌عنوان آرگومان‌های CLI پاس داده می‌شوند. اگر `imageArg` وجود نداشته باشد، OpenClaw
مسیرهای فایل را به prompt اضافه می‌کند (path injection)، که برای CLIهایی که فایل‌های محلی را از مسیرهای ساده به‌طور خودکار
بارگذاری می‌کنند کافی است.

## ورودی‌ها / خروجی‌ها

- `output: "json"` (پیش‌فرض) تلاش می‌کند JSON را parse کند و متن + شناسه نشست را استخراج کند.
- برای خروجی JSON مربوط به Gemini CLI، OpenClaw متن پاسخ را از `response` و
  usage را از `stats` می‌خواند، وقتی `usage` وجود ندارد یا خالی است.
- `output: "jsonl"` استریم‌های JSONL را parse می‌کند (برای مثال Codex CLI `--json`) و پیام نهایی agent به‌همراه شناسه‌های نشست را، اگر موجود باشند، استخراج می‌کند.
- `output: "text"` stdout را پاسخ نهایی در نظر می‌گیرد.

حالت‌های ورودی:

- `input: "arg"` (پیش‌فرض) prompt را به‌عنوان آخرین آرگومان CLI پاس می‌دهد.
- `input: "stdin"` prompt را از طریق stdin ارسال می‌کند.
- اگر prompt خیلی طولانی باشد و `maxPromptArgChars` تنظیم شده باشد، از stdin استفاده می‌شود.

## پیش‌فرض‌ها (متعلق به Plugin)

Plugin داخلی OpenAI همچنین یک پیش‌فرض برای `codex-cli` ثبت می‌کند:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin داخلی Google همچنین یک پیش‌فرض برای `google-gemini-cli` ثبت می‌کند:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

پیش‌نیاز: Gemini CLI محلی باید نصب شده و به‌عنوان
`gemini` روی `PATH` در دسترس باشد (`brew install gemini-cli` یا
`npm install -g @google/gemini-cli`).

نکته‌های JSON در Gemini CLI:

- متن پاسخ از فیلد JSON با نام `response` خوانده می‌شود.
- وقتی `usage` وجود ندارد یا خالی است، usage به `stats` fallback می‌کند.
- `stats.cached` به `cacheRead` در OpenClaw نرمال‌سازی می‌شود.
- اگر `stats.input` وجود نداشته باشد، OpenClaw توکن‌های ورودی را از
  `stats.input_tokens - stats.cached` استخراج می‌کند.

فقط در صورت نیاز بازنویسی کنید (مورد رایج: مسیر مطلق `command`).

## پیش‌فرض‌های متعلق به Plugin

پیش‌فرض‌های بک‌اند CLI اکنون بخشی از سطح Plugin هستند:

- Pluginها آن‌ها را با `api.registerCliBackend(...)` ثبت می‌کنند.
- `id` بک‌اند به پیشوند ارائه‌دهنده در ارجاع‌های مدل تبدیل می‌شود.
- پیکربندی کاربر در `agents.defaults.cliBackends.<id>` همچنان پیش‌فرض Plugin را بازنویسی می‌کند.
- پاک‌سازی پیکربندی مخصوص بک‌اند از طریق hook اختیاری
  `normalizeConfig` همچنان متعلق به Plugin می‌ماند.

Pluginهایی که به شیم‌های کوچک سازگاری پرامپت/پیام نیاز دارند، می‌توانند تبدیل‌های متنی دوسویه را بدون جایگزین کردن provider یا backend مربوط به CLI اعلام کنند:

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
دلتاهای assistant در حال stream شدن و متن نهایی parse‌شده را پیش از آنکه OpenClaw
نشانگرهای کنترلی و تحویل channel خودش را مدیریت کند، بازنویسی می‌کند.

برای CLIهایی که JSONL سازگار با Claude Code stream-json تولید می‌کنند،
`jsonlDialect: "claude-stream-json"` را در config آن backend تنظیم کنید.

## پوشش‌های MCP باندل‌شده

backendهای CLI فراخوانی‌های ابزار OpenClaw را مستقیما دریافت نمی‌کنند، اما یک backend می‌تواند
با `bundleMcp: true` از یک پوشش config تولیدشده MCP استفاده کند.

رفتار باندل‌شده فعلی:

- `claude-cli`: فایل config سخت‌گیرانه MCP تولیدشده
- `codex-cli`: overrideهای config درون‌خطی برای `mcp_servers`؛ server تولیدشده
  OpenClaw loopback با حالت تایید ابزارِ هر server در Codex علامت‌گذاری می‌شود
  تا فراخوانی‌های MCP نتوانند روی پرامپت‌های تایید محلی متوقف شوند
- `google-gemini-cli`: فایل تنظیمات سیستم Gemini تولیدشده

وقتی MCP باندل‌شده فعال باشد، OpenClaw:

- یک server HTTP MCP روی loopback راه‌اندازی می‌کند که ابزارهای gateway را در اختیار فرایند CLI قرار می‌دهد
- bridge را با یک token ویژه هر session احراز هویت می‌کند (`OPENCLAW_MCP_TOKEN`)
- دسترسی ابزار را به session، account و زمینه channel فعلی محدود می‌کند
- serverهای bundle-MCP فعال را برای workspace فعلی بارگذاری می‌کند
- آن‌ها را با هر شکل config/settings موجود MCP در backend ادغام می‌کند
- config راه‌اندازی را با استفاده از حالت integration متعلق به backend از extension مالک بازنویسی می‌کند

اگر هیچ server مربوط به MCP فعال نباشد، OpenClaw همچنان وقتی یک
backend از MCP باندل‌شده استفاده کند، یک config سخت‌گیرانه تزریق می‌کند تا اجراهای پس‌زمینه ایزوله بمانند.

runtimeهای MCP باندل‌شده با scope مربوط به session برای استفاده دوباره در یک session cache می‌شوند، سپس
پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بیکاری پاک‌سازی می‌شوند (پیش‌فرض ۱۰
دقیقه؛ برای غیرفعال‌سازی `0` تنظیم کنید). اجراهای embedded تک‌مرحله‌ای مانند probeهای auth،
تولید slug، و درخواست‌های یادآوری active-memory در پایان اجرا پاک‌سازی می‌شوند تا فرزندان stdio
و streamهای Streamable HTTP/SSE پس از اجرا باقی نمانند.

## محدودیت‌ها

- **بدون فراخوانی مستقیم ابزارهای OpenClaw.** OpenClaw فراخوانی‌های ابزار را به
  protocol مربوط به backend CLI تزریق نمی‌کند. backendها فقط وقتی ابزارهای gateway را می‌بینند که از
  `bundleMcp: true` استفاده کنند.
- **Streaming وابسته به backend است.** برخی backendها JSONL را stream می‌کنند؛ برخی دیگر تا
  خروج buffer می‌کنند.
- **خروجی‌های ساخت‌یافته** به فرمت JSON مربوط به CLI وابسته‌اند.
- **sessionهای Codex CLI** از طریق خروجی متنی resume می‌شوند (بدون JSONL)، که نسبت به
  اجرای اولیه `--json` ساختار کمتری دارد. sessionهای OpenClaw همچنان به‌طور عادی کار می‌کنند.

## عیب‌یابی

- **CLI پیدا نشد**: `command` را به یک مسیر کامل تنظیم کنید.
- **نام model اشتباه است**: از `modelAliases` برای نگاشت `provider/model` → model مربوط به CLI استفاده کنید.
- **عدم تداوم session**: مطمئن شوید `sessionArg` تنظیم شده و `sessionMode` برابر
  `none` نیست (Codex CLI در حال حاضر نمی‌تواند با خروجی JSON resume کند).
- **تصاویر نادیده گرفته می‌شوند**: `imageArg` را تنظیم کنید (و بررسی کنید CLI از مسیرهای فایل پشتیبانی می‌کند).

## مرتبط

- [runbook مربوط به Gateway](/fa/gateway)
- [modelهای محلی](/fa/gateway/local-models)
