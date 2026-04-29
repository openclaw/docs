---
read_when:
    - استفاده از ابزار exec یا تغییر آن
    - اشکال‌زدایی رفتار stdin یا TTY
summary: کاربرد ابزار Exec، حالت‌های stdin، و پشتیبانی از TTY
title: ابزار اجرا
x-i18n:
    generated_at: "2026-04-29T23:42:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

اجرای فرمان‌های shell در workspace. از اجرای foreground + background از طریق `process` پشتیبانی می‌کند.
اگر `process` مجاز نباشد، `exec` به‌صورت همگام اجرا می‌شود و `yieldMs`/`background` را نادیده می‌گیرد.
نشست‌های background برای هر agent محدوده‌بندی شده‌اند؛ `process` فقط نشست‌های همان agent را می‌بیند.

## پارامترها

<ParamField path="command" type="string" required>
فرمان shell برای اجرا.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دایرکتوری کاری برای فرمان.
</ParamField>

<ParamField path="env" type="object">
بازنویسی‌های محیطی کلید/مقدار که روی محیط به‌ارث‌رسیده ادغام می‌شوند.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
پس از این تأخیر (ms)، فرمان را به‌طور خودکار به background ببرد.
</ParamField>

<ParamField path="background" type="boolean" default="false">
فرمان را بلافاصله به background ببرد، به‌جای اینکه منتظر `yieldMs` بماند.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
timeout پیکربندی‌شده exec را برای این فراخوانی بازنویسی می‌کند. فقط زمانی `timeout: 0` را تنظیم کنید که فرمان باید بدون timeout فرایند exec اجرا شود.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
در صورت امکان در یک شبه‌ترمینال اجرا می‌کند. برای CLIهای فقط TTY، coding agents، و UIهای ترمینالی استفاده کنید.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
محل اجرا. وقتی runtime sandbox فعال باشد، `auto` به `sandbox` resolve می‌شود و در غیر این صورت به `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
حالت اعمال برای اجرای `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
رفتار درخواست تأیید برای اجرای `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
شناسه/نام Node وقتی `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
درخواست حالت elevated — خروج از sandbox به مسیر host پیکربندی‌شده. فقط وقتی elevated به `full` resolve شود، `security=full` اجباری می‌شود.
</ParamField>

نکته‌ها:

- مقدار پیش‌فرض `host` برابر `auto` است: وقتی runtime sandbox برای نشست فعال باشد sandbox، و در غیر این صورت gateway.
- `host` فقط `auto`، `sandbox`، `gateway`، یا `node` را می‌پذیرد. این گزینه انتخابگر hostname نیست؛ مقدارهای شبیه hostname پیش از اجرای فرمان رد می‌شوند.
- `auto` راهبرد routing پیش‌فرض است، نه wildcard. `host=node` برای هر فراخوانی از `auto` مجاز است؛ `host=gateway` برای هر فراخوانی فقط وقتی مجاز است که runtime sandbox فعال نباشد.
- بدون پیکربندی اضافه، `host=auto` همچنان «فقط کار می‌کند»: نبود sandbox یعنی به `gateway` resolve می‌شود؛ sandbox زنده یعنی در sandbox باقی می‌ماند.
- `elevated` از sandbox به مسیر host پیکربندی‌شده خارج می‌شود: به‌صورت پیش‌فرض `gateway`، یا وقتی `tools.exec.host=node` باشد (یا مقدار پیش‌فرض نشست `host=node` باشد) `node`. این فقط زمانی در دسترس است که دسترسی elevated برای نشست/provider فعلی فعال باشد.
- تأییدهای `gateway`/`node` توسط `~/.openclaw/exec-approvals.json` کنترل می‌شوند.
- `node` به یک node جفت‌شده نیاز دارد (companion app یا headless node host).
- اگر چند node در دسترس باشد، برای انتخاب یکی `exec.node` یا `tools.exec.node` را تنظیم کنید.
- `exec host=node` تنها مسیر اجرای shell برای nodeها است؛ wrapper قدیمی `nodes.run` حذف شده است.
- `timeout` برای اجرای foreground، background، `yieldMs`، gateway، sandbox، و node `system.run` اعمال می‌شود. اگر حذف شود، OpenClaw از `tools.exec.timeoutSec` استفاده می‌کند؛ `timeout: 0` صریح، timeout فرایند exec را برای آن فراخوانی غیرفعال می‌کند.
- روی hostهای غیر Windows، exec وقتی `SHELL` تنظیم شده باشد از آن استفاده می‌کند؛ اگر `SHELL` برابر `fish` باشد، برای جلوگیری از اسکریپت‌های ناسازگار با fish، `bash` (یا `sh`)
  را از `PATH` ترجیح می‌دهد، سپس اگر هیچ‌کدام وجود نداشته باشند به `SHELL` برمی‌گردد.
- روی hostهای Windows، exec کشف PowerShell 7 (`pwsh`) را ترجیح می‌دهد (Program Files، ProgramW6432، سپس PATH)،
  سپس به Windows PowerShell 5.1 برمی‌گردد.
- اجرای host (`gateway`/`node`) مقدارهای `env.PATH` و بازنویسی‌های loader (`LD_*`/`DYLD_*`) را رد می‌کند تا
  از hijacking باینری یا کد تزریق‌شده جلوگیری شود.
- OpenClaw در محیط فرمان اجراشده (از جمله اجرای PTY و sandbox)، `OPENCLAW_SHELL=exec` را تنظیم می‌کند تا قواعد shell/profile بتوانند زمینه ابزار exec را تشخیص دهند.
- `openclaw channels login` از `exec` مسدود است چون یک جریان تعاملی channel-auth است؛ آن را در یک ترمینال روی gateway host اجرا کنید، یا وقتی وجود دارد از ابزار login بومی channel در chat استفاده کنید.
- مهم: sandboxing به‌صورت **پیش‌فرض خاموش** است. اگر sandboxing خاموش باشد، `host=auto` ضمنی
  به `gateway` resolve می‌شود. `host=sandbox` صریح همچنان به‌صورت بسته fail می‌شود، به‌جای اینکه بی‌صدا
  روی gateway host اجرا شود. sandboxing را فعال کنید یا از `host=gateway` با تأییدها استفاده کنید.
- بررسی‌های preflight اسکریپت (برای خطاهای رایج syntax در shell مربوط به Python/Node) فقط فایل‌های داخل
  مرز مؤثر `workdir` را بررسی می‌کنند. اگر مسیر اسکریپت به بیرون از `workdir` resolve شود، preflight برای
  آن فایل نادیده گرفته می‌شود.
- برای کارهای طولانی‌مدتی که اکنون شروع می‌شوند، آن را یک‌بار شروع کنید و وقتی فعال است و فرمان خروجی می‌دهد یا fail می‌شود، به بیدارباش خودکار
  completion تکیه کنید.
  برای logها، status، input، یا intervention از `process` استفاده کنید؛ scheduling را
  با حلقه‌های sleep، حلقه‌های timeout، یا polling تکراری شبیه‌سازی نکنید.
- برای کاری که باید بعدا یا طبق زمان‌بندی انجام شود، به‌جای الگوهای sleep/delay در `exec` از cron استفاده کنید.

## پیکربندی

- `tools.exec.notifyOnExit` (پیش‌فرض: true): وقتی true باشد، نشست‌های exec که به background رفته‌اند، هنگام خروج یک رویداد system را در صف می‌گذارند و یک Heartbeat درخواست می‌کنند.
- `tools.exec.approvalRunningNoticeMs` (پیش‌فرض: 10000): وقتی یک exec که پشت دروازه approval است بیش از این مقدار طول بکشد، یک اعلان «running» واحد منتشر می‌کند (0 غیرفعال می‌کند).
- `tools.exec.timeoutSec` (پیش‌فرض: 1800): timeout پیش‌فرض exec برای هر فرمان، بر حسب ثانیه. `timeout` در هر فراخوانی آن را بازنویسی می‌کند؛ `timeout: 0` در هر فراخوانی timeout فرایند exec را غیرفعال می‌کند.
- `tools.exec.host` (پیش‌فرض: `auto`؛ وقتی runtime sandbox فعال باشد به `sandbox` resolve می‌شود، در غیر این صورت به `gateway`)
- `tools.exec.security` (پیش‌فرض: `deny` برای sandbox، `full` برای gateway + node وقتی تنظیم نشده باشد)
- `tools.exec.ask` (پیش‌فرض: `off`)
- exec بدون approval روی host، پیش‌فرض gateway + node است. اگر رفتار approvals/allowlist می‌خواهید، هم `tools.exec.*` و هم `~/.openclaw/exec-approvals.json` روی host را سخت‌گیرانه‌تر کنید؛ [تأییدهای Exec](/fa/tools/exec-approvals#no-approval-yolo-mode) را ببینید.
- YOLO از پیش‌فرض‌های سیاست host می‌آید (`security=full`، `ask=off`)، نه از `host=auto`. اگر می‌خواهید routing به gateway یا node را اجباری کنید، `tools.exec.host` را تنظیم کنید یا از `/exec host=...` استفاده کنید.
- در حالت `security=full` به‌همراه `ask=off`، host exec مستقیما از سیاست پیکربندی‌شده پیروی می‌کند؛ هیچ لایه prefilter ابهام‌زدایی فرمان یا رد script-preflight اضافه‌ای وجود ندارد.
- `tools.exec.node` (پیش‌فرض: تنظیم‌نشده)
- `tools.exec.strictInlineEval` (پیش‌فرض: false): وقتی true باشد، فرم‌های eval مفسر inline مانند `python -c`، `node -e`، `ruby -e`، `perl -e`، `php -r`، `lua -e`، و `osascript -e` همیشه به approval صریح نیاز دارند. `allow-always` همچنان می‌تواند فراخوانی‌های بی‌خطر مفسر/اسکریپت را پایدار کند، اما فرم‌های inline-eval همچنان هر بار prompt می‌دهند.
- `tools.exec.pathPrepend`: فهرستی از دایرکتوری‌ها برای افزودن به ابتدای `PATH` برای اجرای exec (فقط gateway + sandbox).
- `tools.exec.safeBins`: باینری‌های امن فقط-stdin که می‌توانند بدون entryهای allowlist صریح اجرا شوند. برای جزئیات رفتار، [Safe bins](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) را ببینید.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های صریح اضافه که برای بررسی مسیر `safeBins` قابل اعتماد هستند. entryهای `PATH` هرگز به‌صورت خودکار trusted نمی‌شوند. پیش‌فرض‌های داخلی `/bin` و `/usr/bin` هستند.
- `tools.exec.safeBinProfiles`: سیاست argv سفارشی اختیاری برای هر safe bin (`minPositional`، `maxPositional`، `allowedValueFlags`، `deniedFlags`).

مثال:

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

- `host=gateway`: `PATH` مربوط به login-shell شما را در محیط exec ادغام می‌کند. بازنویسی‌های `env.PATH` برای اجرای host رد می‌شوند. خود daemon همچنان با `PATH` حداقلی اجرا می‌شود:
  - macOS: `/opt/homebrew/bin`، `/usr/local/bin`، `/usr/bin`، `/bin`
  - Linux: `/usr/local/bin`، `/usr/bin`، `/bin`
- `host=sandbox`: داخل container، `sh -lc` (login shell) را اجرا می‌کند، پس `/etc/profile` ممکن است `PATH` را reset کند.
  OpenClaw پس از sourcing پروفایل، از طریق یک env var داخلی (بدون interpolation در shell)، `env.PATH` را به ابتدا اضافه می‌کند؛
  `tools.exec.pathPrepend` اینجا هم اعمال می‌شود.
- `host=node`: فقط بازنویسی‌های env مسدودنشده‌ای که ارسال می‌کنید به node فرستاده می‌شوند. بازنویسی‌های `env.PATH` برای اجرای host رد می‌شوند و توسط node hostها نادیده گرفته می‌شوند. اگر روی یک node به entryهای PATH اضافه نیاز دارید،
  محیط سرویس node host را پیکربندی کنید (systemd/launchd) یا ابزارها را در مکان‌های استاندارد نصب کنید.

binding هر agent به node (از index فهرست agent در config استفاده کنید):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: tab مربوط به Nodes یک پنل کوچک «Exec node binding» برای همین تنظیمات دارد.

## بازنویسی‌های نشست (`/exec`)

از `/exec` برای تنظیم پیش‌فرض‌های **هر نشست** برای `host`، `security`، `ask`، و `node` استفاده کنید.
برای نمایش مقدارهای فعلی، `/exec` را بدون آرگومان بفرستید.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## مدل مجوزدهی

`/exec` فقط برای **فرستنده‌های مجاز** (channel allowlistها/pairing به‌همراه `commands.useAccessGroups`) پذیرفته می‌شود.
این فقط **state نشست** را به‌روزرسانی می‌کند و config نمی‌نویسد. برای hard-disable کردن exec، آن را از طریق سیاست tool
رد کنید (`tools.deny: ["exec"]` یا برای هر agent). approvalهای host همچنان اعمال می‌شوند مگر اینکه صراحتا
`security=full` و `ask=off` را تنظیم کنید.

## تأییدهای Exec (companion app / node host)

agentهای sandboxed می‌توانند پیش از اجرای `exec` روی gateway یا node host به approval برای هر درخواست نیاز داشته باشند.
برای سیاست، allowlist، و جریان UI، [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

وقتی approvalها لازم باشند، ابزار exec بلافاصله با
`status: "approval-pending"` و یک شناسه approval برمی‌گردد. پس از approve شدن (یا deny / timed out شدن)،
Gateway رویدادهای system را منتشر می‌کند (`Exec finished` / `Exec denied`). اگر فرمان پس از
`tools.exec.approvalRunningNoticeMs` همچنان در حال اجرا باشد، یک اعلان `Exec running` واحد منتشر می‌شود.
روی channelهایی که card/buttonهای approval بومی دارند، agent باید ابتدا به آن
UI بومی تکیه کند و فقط وقتی ابزار result صراحتا می‌گوید approvalهای chat در دسترس نیستند یا approval دستی تنها مسیر است،
یک فرمان دستی `/approve` درج کند.

## Allowlist + safe bins

اعمال allowlist دستی با globهای مسیر باینری resolveشده و globهای command-name خام
مطابقت می‌دهد. نام‌های خام فقط با فرمان‌هایی که از طریق PATH فراخوانی شده‌اند match می‌شوند، بنابراین `rg` می‌تواند با
`/opt/homebrew/bin/rg` وقتی فرمان `rg` است match شود، اما نه با `./rg` یا `/tmp/rg`.
وقتی `security=allowlist` باشد، فرمان‌های shell فقط زمانی به‌طور خودکار allowed می‌شوند که هر segment در pipeline
در allowlist باشد یا safe bin باشد. chaining (`;`، `&&`، `||`) و redirectionها
در حالت allowlist رد می‌شوند مگر اینکه هر segment سطح بالا شرط
allowlist را برآورده کند (از جمله safe binها). redirectionها همچنان پشتیبانی نمی‌شوند.
اعتماد پایدار `allow-always` این قاعده را دور نمی‌زند: یک فرمان chained همچنان نیاز دارد هر
segment سطح بالا match شود.

`autoAllowSkills` یک مسیر convenience جداگانه در approvalهای exec است. این با entryهای
allowlist مسیر دستی یکی نیست. برای اعتماد صریح سخت‌گیرانه، `autoAllowSkills` را غیرفعال نگه دارید.

از این دو کنترل برای کارهای متفاوت استفاده کنید:

- `tools.exec.safeBins`: فیلترهای stream کوچک و فقط-stdin.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های اضافه صریح trusted برای مسیرهای executable مربوط به safe-bin.
- `tools.exec.safeBinProfiles`: سیاست argv صریح برای safe binهای سفارشی.
- allowlist: اعتماد صریح برای مسیرهای executable.

با `safeBins` مثل یک فهرست مجاز عمومی رفتار نکنید، و باینری‌های مفسر/زمان اجرا (برای مثال `python3`، `node`، `ruby`، `bash`) را اضافه نکنید. اگر به آن‌ها نیاز دارید، از ورودی‌های صریح فهرست مجاز استفاده کنید و اعلان‌های تأیید را فعال نگه دارید.
`openclaw security audit` زمانی هشدار می‌دهد که ورودی‌های مفسر/زمان اجرای `safeBins` فاقد پروفایل‌های صریح باشند، و `openclaw doctor --fix` می‌تواند ورودی‌های سفارشیِ گمشده‌ی `safeBinProfiles` را قالب‌بندی اولیه کند.
`openclaw security audit` و `openclaw doctor` همچنین زمانی هشدار می‌دهند که binهای با رفتار گسترده مانند `jq` را صراحتاً دوباره به `safeBins` اضافه کنید.
اگر مفسرها را صراحتاً در فهرست مجاز قرار می‌دهید، `tools.exec.strictInlineEval` را فعال کنید تا شکل‌های ارزیابی کد درون‌خطی همچنان به تأیید تازه نیاز داشته باشند.

برای جزئیات کامل سیاست و مثال‌ها، [تأییدهای Exec](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) و [Safe bins در برابر فهرست مجاز](/fa/tools/exec-approvals-advanced#safe-bins-versus-allowlist) را ببینید.

## مثال‌ها

پیش‌زمینه:

```json
{ "tool": "exec", "command": "ls -la" }
```

پس‌زمینه + نظرسنجی:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

نظرسنجی برای وضعیت درخواستی است، نه حلقه‌های انتظار. اگر بیدارباش تکمیل خودکار فعال باشد، فرمان می‌تواند وقتی خروجی تولید می‌کند یا شکست می‌خورد نشست را بیدار کند.

ارسال کلیدها (به سبک tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

ارسال (فقط ارسال CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

چسباندن (به‌طور پیش‌فرض bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` یک زیرابزار از `exec` برای ویرایش‌های ساختاریافته‌ی چندفایلی است.
این ابزار به‌طور پیش‌فرض برای مدل‌های OpenAI و OpenAI Codex فعال است. فقط زمانی از پیکربندی استفاده کنید
که بخواهید آن را غیرفعال کنید یا به مدل‌های مشخصی محدود کنید:

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
- سیاست ابزار همچنان اعمال می‌شود؛ `allow: ["write"]` به‌صورت ضمنی `apply_patch` را مجاز می‌کند.
- پیکربندی زیر `tools.exec.applyPatch` قرار دارد.
- مقدار پیش‌فرض `tools.exec.applyPatch.enabled` برابر `true` است؛ برای غیرفعال کردن ابزار برای مدل‌های OpenAI آن را روی `false` تنظیم کنید.
- مقدار پیش‌فرض `tools.exec.applyPatch.workspaceOnly` برابر `true` است (محدود به فضای کاری). فقط زمانی آن را روی `false` تنظیم کنید که عمداً می‌خواهید `apply_patch` بیرون از پوشه‌ی فضای کاری بنویسد/حذف کند.

## مرتبط

- [تأییدهای Exec](/fa/tools/exec-approvals) — دروازه‌های تأیید برای فرمان‌های shell
- [Sandboxing](/fa/gateway/sandboxing) — اجرای فرمان‌ها در محیط‌های sandboxed
- [فرایند پس‌زمینه](/fa/gateway/background-process) — ابزار exec و process طولانی‌مدت
- [امنیت](/fa/gateway/security) — سیاست ابزار و دسترسی ارتقایافته
