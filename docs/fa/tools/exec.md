---
read_when:
    - استفاده یا تغییر ابزار exec
    - اشکال‌زدایی رفتار stdin یا TTY
summary: کاربرد ابزار Exec، حالت‌های stdin، و پشتیبانی از TTY
title: ابزار اجرا
x-i18n:
    generated_at: "2026-05-03T21:42:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

اجرای دستورهای shell در workspace. از اجرای پیش‌زمینه + پس‌زمینه از طریق `process` پشتیبانی می‌کند.
اگر `process` مجاز نباشد، `exec` به‌صورت همگام اجرا می‌شود و `yieldMs`/`background` را نادیده می‌گیرد.
نشست‌های پس‌زمینه برای هر عامل scoped هستند؛ `process` فقط نشست‌های همان عامل را می‌بیند.

## پارامترها

<ParamField path="command" type="string" required>
دستور Shell برای اجرا.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دایرکتوری کاری برای دستور.
</ParamField>

<ParamField path="env" type="object">
بازنویسی‌های محیطی کلید/مقدار که روی محیط به‌ارث‌رسیده merge می‌شوند.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
پس از این تأخیر (ms)، دستور را به‌طور خودکار به پس‌زمینه ببر.
</ParamField>

<ParamField path="background" type="boolean" default="false">
دستور را به‌جای انتظار برای `yieldMs`، بلافاصله به پس‌زمینه ببر.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
timeout پیکربندی‌شده exec را برای این فراخوانی بازنویسی کن. `timeout: 0` را فقط زمانی تنظیم کن که دستور باید بدون timeout فرایند exec اجرا شود.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
در صورت وجود، در یک pseudo-terminal اجرا کن. برای CLIهای فقط TTY، عامل‌های کدنویسی، و UIهای ترمینالی استفاده کن.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
محل اجرا. وقتی runtime sandbox فعال باشد، `auto` به `sandbox` resolve می‌شود و در غیر این صورت به `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
حالت اعمال برای اجرای `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
رفتار prompt تأیید برای اجرای `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
شناسه/نام Node وقتی `host=node` است.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
درخواست حالت elevated — خروج از sandbox به مسیر host پیکربندی‌شده. `security=full` فقط وقتی forced می‌شود که elevated به `full` resolve شود.
</ParamField>

نکات:

- مقدار پیش‌فرض `host` برابر `auto` است: وقتی runtime sandbox برای نشست فعال باشد sandbox، و در غیر این صورت gateway.
- `host` فقط `auto`، `sandbox`، `gateway`، یا `node` را می‌پذیرد. این selector نام میزبان نیست؛ مقدارهای شبیه hostname پیش از اجرای دستور رد می‌شوند.
- `auto` راهبرد routing پیش‌فرض است، نه wildcard. `host=node` در سطح هر فراخوانی از `auto` مجاز است؛ `host=gateway` در سطح هر فراخوانی فقط وقتی مجاز است که هیچ runtime sandbox فعالی وجود نداشته باشد.
- بدون پیکربندی اضافی، `host=auto` همچنان «فقط کار می‌کند»: نبود sandbox یعنی به `gateway` resolve می‌شود؛ sandbox زنده یعنی داخل sandbox می‌ماند.
- `elevated` از sandbox به مسیر host پیکربندی‌شده خارج می‌شود: به‌صورت پیش‌فرض `gateway`، یا وقتی `tools.exec.host=node` باشد (یا پیش‌فرض نشست `host=node` باشد) `node`. این فقط زمانی در دسترس است که دسترسی elevated برای نشست/ارائه‌دهنده فعلی فعال شده باشد.
- تأییدهای `gateway`/`node` توسط `~/.openclaw/exec-approvals.json` کنترل می‌شوند.
- `node` به یک گره paired نیاز دارد (برنامه companion یا میزبان گره headless).
- اگر چند گره در دسترس باشد، برای انتخاب یکی `exec.node` یا `tools.exec.node` را تنظیم کن.
- `exec host=node` تنها مسیر اجرای shell برای گره‌ها است؛ wrapper قدیمی `nodes.run` حذف شده است.
- `timeout` برای اجرای foreground، background، `yieldMs`، gateway، sandbox، و node `system.run` اعمال می‌شود. اگر حذف شود، OpenClaw از `tools.exec.timeoutSec` استفاده می‌کند؛ `timeout: 0` صریح timeout فرایند exec را برای آن فراخوانی غیرفعال می‌کند.
- در میزبان‌های غیر Windows، exec وقتی `SHELL` تنظیم شده باشد از آن استفاده می‌کند؛ اگر `SHELL` برابر `fish` باشد، برای جلوگیری از اسکریپت‌های ناسازگار با fish، `bash` (یا `sh`) را
  از `PATH` ترجیح می‌دهد، سپس اگر هیچ‌کدام وجود نداشته باشند به `SHELL` fallback می‌کند.
- در میزبان‌های Windows، exec کشف PowerShell 7 (`pwsh`) را ترجیح می‌دهد (Program Files، ProgramW6432، سپس PATH)،
  سپس به Windows PowerShell 5.1 fallback می‌کند.
- اجرای host (`gateway`/`node`) برای جلوگیری از binary hijacking یا کد injected،
  `env.PATH` و بازنویسی‌های loader (`LD_*`/`DYLD_*`) را رد می‌کند.
- OpenClaw در محیط دستور spawned شده (از جمله اجرای PTY و sandbox) مقدار `OPENCLAW_SHELL=exec` را تنظیم می‌کند تا قواعد shell/profile بتوانند زمینه exec-tool را تشخیص دهند.
- `openclaw channels login` از `exec` مسدود است چون یک جریان تعاملی channel-auth است؛ آن را در یک ترمینال روی میزبان gateway اجرا کن، یا وقتی ابزار login بومی channel وجود دارد از آن در chat استفاده کن.
- مهم: sandboxing به‌صورت پیش‌فرض **خاموش** است. اگر sandboxing خاموش باشد، `host=auto` ضمنی
  به `gateway` resolve می‌شود. `host=sandbox` صریح همچنان fails closed می‌شود، نه اینکه بی‌صدا
  روی میزبان gateway اجرا شود. sandboxing را فعال کن یا با تأییدها از `host=gateway` استفاده کن.
- بررسی‌های preflight اسکریپت (برای اشتباهات رایج shell-syntax در Python/Node) فقط فایل‌های داخل مرز
  مؤثر `workdir` را inspect می‌کنند. اگر مسیر اسکریپت به بیرون از `workdir` resolve شود، preflight برای
  آن فایل نادیده گرفته می‌شود.
- برای کارهای طولانی‌مدتی که اکنون شروع می‌شوند، آن را یک‌بار شروع کن و وقتی فعال است و دستور output می‌دهد یا fail می‌شود، به wake تکمیل خودکار
  تکیه کن.
  برای logها، وضعیت، ورودی، یا مداخله از `process` استفاده کن؛ scheduling را
  با sleep loopها، timeout loopها، یا polling مکرر شبیه‌سازی نکن.
- برای کاری که باید بعداً یا طبق schedule انجام شود، به‌جای الگوهای sleep/delay در `exec` از cron استفاده کن.

## پیکربندی

- `tools.exec.notifyOnExit` (پیش‌فرض: true): وقتی true باشد، نشست‌های exec پس‌زمینه‌شده هنگام خروج یک system event را enqueue می‌کنند و heartbeat درخواست می‌کنند.
- `tools.exec.approvalRunningNoticeMs` (پیش‌فرض: 10000): وقتی یک exec درگیر approval gate بیشتر از این طول بکشد، یک notice «running» واحد emit کن (0 غیرفعال می‌کند).
- `tools.exec.timeoutSec` (پیش‌فرض: 1800): timeout پیش‌فرض هر دستور exec برحسب ثانیه. `timeout` در سطح هر فراخوانی آن را بازنویسی می‌کند؛ `timeout: 0` در سطح هر فراخوانی timeout فرایند exec را غیرفعال می‌کند.
- `tools.exec.host` (پیش‌فرض: `auto`؛ وقتی runtime sandbox فعال باشد به `sandbox` resolve می‌شود، در غیر این صورت به `gateway`)
- `tools.exec.security` (پیش‌فرض: `deny` برای sandbox، و وقتی unset باشد `full` برای gateway + node)
- `tools.exec.ask` (پیش‌فرض: `off`)
- exec میزبان بدون تأیید برای gateway + node پیش‌فرض است. اگر رفتار approvals/allowlist می‌خواهی، هم `tools.exec.*` و هم `~/.openclaw/exec-approvals.json` میزبان را سخت‌گیرتر کن؛ [تأییدهای Exec](/fa/tools/exec-approvals#yolo-mode-no-approval) را ببین.
- YOLO از پیش‌فرض‌های host-policy می‌آید (`security=full`، `ask=off`)، نه از `host=auto`. اگر می‌خواهی routing به gateway یا node را اجباری کنی، `tools.exec.host` را تنظیم کن یا از `/exec host=...` استفاده کن.
- در حالت `security=full` به‌همراه `ask=off`، host exec مستقیماً policy پیکربندی‌شده را دنبال می‌کند؛ هیچ لایه prefilter اضافی heuristic برای command-obfuscation یا رد script-preflight وجود ندارد.
- `tools.exec.node` (پیش‌فرض: unset)
- `tools.exec.strictInlineEval` (پیش‌فرض: false): وقتی true باشد، فرم‌های eval مفسر inline مانند `python -c`، `node -e`، `ruby -e`، `perl -e`، `php -r`، `lua -e`، و `osascript -e` همیشه به تأیید صریح نیاز دارند. `allow-always` همچنان می‌تواند invocationهای مفسر/اسکریپت benign را persist کند، اما فرم‌های inline-eval همچنان هر بار prompt می‌دهند.
- `tools.exec.pathPrepend`: فهرست دایرکتوری‌هایی که برای اجراهای exec به ابتدای `PATH` افزوده می‌شوند (فقط gateway + sandbox).
- `tools.exec.safeBins`: binaryهای امن فقط stdin که می‌توانند بدون entryهای allowlist صریح اجرا شوند. برای جزئیات رفتار، [Safe bins](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) را ببین.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های صریح اضافی که برای بررسی‌های مسیر `safeBins` trusted هستند. entryهای `PATH` هرگز به‌طور خودکار trusted نمی‌شوند. پیش‌فرض‌های built-in برابر `/bin` و `/usr/bin` هستند.
- `tools.exec.safeBinProfiles`: policy اختیاری argv سفارشی برای هر safe bin (`minPositional`، `maxPositional`، `allowedValueFlags`، `deniedFlags`).

نمونه:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### مدیریت PATH

- `host=gateway`: `PATH` مربوط به login-shell تو را در محیط exec merge می‌کند. بازنویسی‌های `env.PATH` برای اجرای host
  رد می‌شوند. خود daemon همچنان با یک `PATH` حداقلی اجرا می‌شود:
  - macOS: `/opt/homebrew/bin`، `/usr/local/bin`، `/usr/bin`، `/bin`
  - Linux: `/usr/local/bin`، `/usr/bin`، `/bin`
- `host=sandbox`: داخل container، `sh -lc` (login shell) را اجرا می‌کند، بنابراین `/etc/profile` ممکن است `PATH` را reset کند.
  OpenClaw پس از sourcing پروفایل از طریق یک env var داخلی (بدون shell interpolation) `env.PATH` را prepend می‌کند؛
  `tools.exec.pathPrepend` اینجا هم اعمال می‌شود.
- `host=node`: فقط بازنویسی‌های env مسدودنشده‌ای که pass می‌کنی به node ارسال می‌شوند. بازنویسی‌های `env.PATH`
  برای اجرای host رد می‌شوند و توسط میزبان‌های node نادیده گرفته می‌شوند. اگر روی یک node به entryهای PATH اضافی نیاز داری،
  محیط سرویس میزبان node (systemd/launchd) را پیکربندی کن یا ابزارها را در مکان‌های استاندارد install کن.

binding گره در سطح هر عامل (از index فهرست عامل در config استفاده کن):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: تب Nodes یک panel کوچک «binding گره Exec» برای همان تنظیمات دارد.

## بازنویسی‌های نشست (`/exec`)

از `/exec` برای تنظیم پیش‌فرض‌های **در سطح هر نشست** برای `host`، `security`، `ask`، و `node` استفاده کن.
برای نمایش مقادیر فعلی، `/exec` را بدون آرگومان ارسال کن.

نمونه:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## مدل authorization

`/exec` فقط برای **فرستنده‌های authorized** رعایت می‌شود (allowlistها/pairing کانال به‌همراه `commands.useAccessGroups`).
فقط **state نشست** را به‌روزرسانی می‌کند و config را نمی‌نویسد. برای hard-disable کردن exec، آن را از طریق policy ابزار
رد کن (`tools.deny: ["exec"]` یا در سطح هر عامل). تأییدهای host همچنان اعمال می‌شوند مگر اینکه صریحاً
`security=full` و `ask=off` را تنظیم کنی.

## تأییدهای Exec (برنامه companion / میزبان node)

عامل‌های sandboxed می‌توانند پیش از اجرای `exec` روی gateway یا میزبان node، تأیید برای هر درخواست را الزامی کنند.
برای policy، allowlist، و جریان UI، [تأییدهای Exec](/fa/tools/exec-approvals) را ببین.

وقتی تأییدها الزامی باشند، ابزار exec بلافاصله با
`status: "approval-pending"` و یک شناسه approval برمی‌گردد. پس از تأیید (یا رد / timeout)،
Gateway رویدادهای system را emit می‌کند (`Exec finished` / `Exec denied`). اگر دستور پس از
`tools.exec.approvalRunningNoticeMs` همچنان در حال اجرا باشد، یک notice واحد `Exec running` emit می‌شود.
در کانال‌هایی که card/buttonهای approval بومی دارند، عامل باید ابتدا به همان
UI بومی تکیه کند و فقط وقتی نتیجه ابزار صریحاً می‌گوید approvalهای chat در دسترس نیستند یا manual approval تنها مسیر است،
یک دستور `/approve` دستی بیاورد.

## Allowlist + safe bins

اعمال allowlist دستی با globهای مسیر binary resolve‌شده و globهای bare command-name
match می‌کند. نام‌های bare فقط با دستورهایی match می‌شوند که از طریق PATH invoke شده‌اند، بنابراین `rg` می‌تواند با
`/opt/homebrew/bin/rg` match شود وقتی دستور `rg` است، اما نه با `./rg` یا `/tmp/rg`.
وقتی `security=allowlist` باشد، دستورهای shell فقط زمانی auto-allowed می‌شوند که هر segment pipeline
در allowlist باشد یا safe bin باشد. chaining (`;`، `&&`، `||`) و redirectionها
در حالت allowlist رد می‌شوند مگر اینکه هر segment top-level با
allowlist (از جمله safe bins) سازگار باشد. Redirectionها همچنان پشتیبانی نمی‌شوند.
اعتماد durable `allow-always` این قاعده را دور نمی‌زند: یک دستور chained همچنان نیاز دارد هر
segment top-level match شود.

`autoAllowSkills` یک مسیر convenience جداگانه در تأییدهای exec است. با
entryهای allowlist مسیر دستی یکسان نیست. برای اعتماد صریح strict، `autoAllowSkills` را غیرفعال نگه دار.

از دو کنترل برای کارهای متفاوت استفاده کن:

- `tools.exec.safeBins`: فیلترهای stream کوچک و فقط stdin.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های trusted اضافی صریح برای مسیرهای executable مربوط به safe-bin.
- `tools.exec.safeBinProfiles`: policy صریح argv برای safe binهای سفارشی.
- allowlist: اعتماد صریح برای مسیرهای executable.

`safeBins` را به‌عنوان یک فهرست مجاز عمومی در نظر نگیرید، و باینری‌های مفسر/زمان‌اجرا (برای مثال `python3`، `node`، `ruby`، `bash`) را اضافه نکنید. اگر به آن‌ها نیاز دارید، از ورودی‌های صریح فهرست مجاز استفاده کنید و اعلان‌های تأیید را فعال نگه دارید.
`openclaw security audit` هنگامی هشدار می‌دهد که ورودی‌های `safeBins` مربوط به مفسر/زمان‌اجرا فاقد پروفایل‌های صریح باشند، و `openclaw doctor --fix` می‌تواند ورودی‌های سفارشی `safeBinProfiles` گمشده را پایه‌سازی کند.
`openclaw security audit` و `openclaw doctor` همچنین هنگامی هشدار می‌دهند که binهای با رفتار گسترده مانند `jq` را صریحاً دوباره به `safeBins` اضافه کنید.
اگر مفسرها را صریحاً در فهرست مجاز قرار می‌دهید، `tools.exec.strictInlineEval` را فعال کنید تا شکل‌های ارزیابی کد درون‌خطی همچنان به تأیید تازه نیاز داشته باشند.

برای جزئیات و مثال‌های کامل سیاست، [تأییدهای Exec](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) و [Safe bins در برابر فهرست مجاز](/fa/tools/exec-approvals-advanced#safe-bins-versus-allowlist) را ببینید.

## مثال‌ها

پیش‌زمینه:

```json
{ "tool": "exec", "command": "ls -la" }
```

پس‌زمینه + پرس‌وجو:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

پرس‌وجو برای وضعیت درخواستی است، نه حلقه‌های انتظار. اگر بیدارباش تکمیل خودکار
فعال باشد، دستور می‌تواند وقتی خروجی منتشر می‌کند یا شکست می‌خورد، جلسه را بیدار کند.

ارسال کلیدها (به سبک tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

ثبت (فقط ارسال CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

چسباندن (به‌طور پیش‌فرض براکت‌گذاری‌شده):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` یک زیرابزار از `exec` برای ویرایش‌های ساختاریافته چندفایلی است.
برای مدل‌های OpenAI و OpenAI Codex به‌طور پیش‌فرض فعال است. فقط زمانی از پیکربندی استفاده کنید
که می‌خواهید آن را غیرفعال کنید یا آن را به مدل‌های مشخصی محدود کنید:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

نکته‌ها:

- فقط برای مدل‌های OpenAI/OpenAI Codex در دسترس است.
- سیاست ابزار همچنان اعمال می‌شود؛ `allow: ["write"]` به‌طور ضمنی `apply_patch` را مجاز می‌کند.
- `deny: ["write"]`، `apply_patch` را منع نمی‌کند؛ `apply_patch` را صریحاً منع کنید یا زمانی که نوشتن patch نیز باید مسدود شود از `deny: ["group:fs"]` استفاده کنید.
- پیکربندی زیر `tools.exec.applyPatch` قرار دارد.
- مقدار پیش‌فرض `tools.exec.applyPatch.enabled` برابر `true` است؛ برای غیرفعال کردن ابزار برای مدل‌های OpenAI آن را روی `false` بگذارید.
- مقدار پیش‌فرض `tools.exec.applyPatch.workspaceOnly` برابر `true` است (محدود به workspace). فقط در صورتی آن را روی `false` بگذارید که عمداً می‌خواهید `apply_patch` بیرون از دایرکتوری workspace بنویسد/حذف کند.

## مرتبط

- [تأییدهای Exec](/fa/tools/exec-approvals) — دروازه‌های تأیید برای فرمان‌های shell
- [Sandboxing](/fa/gateway/sandboxing) — اجرای فرمان‌ها در محیط‌های sandbox‌شده
- [فرایند پس‌زمینه](/fa/gateway/background-process) — exec طولانی‌اجرا و ابزار process
- [امنیت](/fa/gateway/security) — سیاست ابزار و دسترسی ارتقایافته
