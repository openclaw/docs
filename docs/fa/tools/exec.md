---
read_when:
    - استفاده از ابزار exec یا تغییر آن
    - اشکال‌زدایی رفتار stdin یا TTY
summary: کاربرد ابزار Exec، حالت‌های stdin و پشتیبانی از TTY
title: ابزار اجرا
x-i18n:
    generated_at: "2026-05-06T09:46:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9892f030f1eeb83ca0cebac462c469e5f9f000763e4c96d62d82b819f98c3084
    source_path: tools/exec.md
    workflow: 16
---

اجرای دستورهای shell در workspace. از اجرای پیش‌زمینه + پس‌زمینه از طریق `process` پشتیبانی می‌کند.
اگر `process` مجاز نباشد، `exec` به‌صورت همگام اجرا می‌شود و `yieldMs`/`background` را نادیده می‌گیرد.
جلسه‌های پس‌زمینه برای هر agent محدوده‌بندی می‌شوند؛ `process` فقط جلسه‌های همان agent را می‌بیند.

## پارامترها

<ParamField path="command" type="string" required>
دستور Shell برای اجرا.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دایرکتوری کاری برای دستور.
</ParamField>

<ParamField path="env" type="object">
بازنویسی‌های محیطی کلید/مقدار که روی محیط به‌ارث‌رسیده ادغام می‌شوند.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
پس از این تأخیر (ms)، دستور را به‌طور خودکار به پس‌زمینه ببرد.
</ParamField>

<ParamField path="background" type="boolean" default="false">
به‌جای انتظار برای `yieldMs`، دستور را بلافاصله به پس‌زمینه ببرد.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
مهلت زمانی پیکربندی‌شده exec را برای این فراخوانی بازنویسی کنید. فقط زمانی `timeout: 0` را تنظیم کنید که دستور باید بدون مهلت زمانی فرایند exec اجرا شود.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
در صورت امکان در یک شبه‌ترمینال اجرا کنید. برای CLIهای فقط TTY، agentهای کدنویسی، و UIهای ترمینالی استفاده کنید.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
محل اجرا. وقتی runtime سندباکس فعال باشد، `auto` به `sandbox` و در غیر این صورت به `gateway` resolve می‌شود.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
حالت اعمال سیاست برای اجرای `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
رفتار درخواست تأیید برای اجرای `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
شناسه/نام Node وقتی `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
درخواست حالت elevated — خروج از سندباکس به مسیر host پیکربندی‌شده. `security=full` فقط زمانی اجباری می‌شود که elevated به `full` resolve شود.
</ParamField>

نکات:

- مقدار پیش‌فرض `host` برابر `auto` است: وقتی runtime سندباکس برای جلسه فعال باشد sandbox، وگرنه gateway.
- `host` فقط `auto`، `sandbox`، `gateway`، یا `node` را می‌پذیرد. انتخاب‌گر hostname نیست؛ مقدارهای شبیه hostname پیش از اجرای دستور رد می‌شوند.
- `auto` راهبرد مسیریابی پیش‌فرض است، نه wildcard. `host=node` در سطح هر فراخوانی از `auto` مجاز است؛ `host=gateway` در سطح هر فراخوانی فقط وقتی مجاز است که runtime سندباکس فعال نباشد.
- بدون پیکربندی اضافی، `host=auto` همچنان «بدون دردسر کار می‌کند»: نبود سندباکس یعنی به `gateway` resolve می‌شود؛ سندباکس زنده یعنی داخل سندباکس می‌ماند.
- `elevated` از سندباکس به مسیر host پیکربندی‌شده خارج می‌شود: به‌طور پیش‌فرض `gateway`، یا وقتی `tools.exec.host=node` باشد (یا پیش‌فرض جلسه `host=node` باشد) `node`. این فقط وقتی در دسترس است که دسترسی elevated برای جلسه/provider فعلی فعال شده باشد.
- تأییدهای `gateway`/`node` توسط `~/.openclaw/exec-approvals.json` کنترل می‌شوند.
- `node` به یک Node جفت‌شده نیاز دارد (اپلیکیشن همراه یا میزبان Node بدون رابط).
- اگر چند Node در دسترس باشد، برای انتخاب یکی `exec.node` یا `tools.exec.node` را تنظیم کنید.
- `exec host=node` تنها مسیر اجرای shell برای Nodeها است؛ wrapper قدیمی `nodes.run` حذف شده است.
- `timeout` روی اجرای پیش‌زمینه، پس‌زمینه، `yieldMs`، gateway، sandbox، و اجرای `system.run` در Node اعمال می‌شود. اگر حذف شود، OpenClaw از `tools.exec.timeoutSec` استفاده می‌کند؛ `timeout: 0` صریح، مهلت زمانی فرایند exec را برای همان فراخوانی غیرفعال می‌کند.
- روی hostهای غیر Windows، exec وقتی `SHELL` تنظیم باشد از آن استفاده می‌کند؛ اگر `SHELL` برابر `fish` باشد، برای پرهیز از اسکریپت‌های ناسازگار با fish، `bash` (یا `sh`)
  را از `PATH` ترجیح می‌دهد، سپس اگر هیچ‌کدام وجود نداشته باشند به `SHELL` برمی‌گردد.
- روی hostهای Windows، exec کشف PowerShell 7 (`pwsh`) را ترجیح می‌دهد (Program Files، ProgramW6432، سپس PATH)،
  سپس به Windows PowerShell 5.1 برمی‌گردد.
- اجرای host (`gateway`/`node`) مقدارهای `env.PATH` و بازنویسی‌های loader (`LD_*`/`DYLD_*`) را رد می‌کند تا
  از ربایش binary یا کد تزریق‌شده جلوگیری شود.
- OpenClaw مقدار `OPENCLAW_SHELL=exec` را در محیط دستور spawned (شامل اجرای PTY و sandbox) تنظیم می‌کند تا قواعد shell/profile بتوانند زمینه exec-tool را تشخیص دهند.
- `openclaw channels login` از `exec` مسدود است، چون یک جریان تعاملی احراز هویت channel است؛ آن را در یک ترمینال روی host مربوط به gateway اجرا کنید، یا وقتی وجود دارد از ابزار login بومی channel از داخل chat استفاده کنید.
- مهم: sandboxing به‌طور **پیش‌فرض غیرفعال** است. اگر sandboxing خاموش باشد، `host=auto` ضمنی
  به `gateway` resolve می‌شود. `host=sandbox` صریح همچنان به‌صورت بسته شکست می‌خورد، نه اینکه بی‌صدا
  روی host مربوط به gateway اجرا شود. sandboxing را فعال کنید یا با تأییدها از `host=gateway` استفاده کنید.
- بررسی‌های preflight اسکریپت (برای خطاهای رایج syntax در shell مربوط به Python/Node) فقط فایل‌های داخل مرز
  مؤثر `workdir` را بررسی می‌کنند. اگر مسیر یک اسکریپت بیرون از `workdir` resolve شود، preflight برای
  آن فایل رد می‌شود.
- برای کار طولانی‌مدتی که اکنون شروع می‌شود، آن را یک‌بار شروع کنید و وقتی wake تکمیل خودکار فعال است و دستور خروجی می‌دهد یا شکست می‌خورد، به آن تکیه کنید.
  برای logها، وضعیت، ورودی، یا مداخله از `process` استفاده کنید؛ scheduling را با حلقه‌های sleep، حلقه‌های timeout، یا polling تکراری شبیه‌سازی نکنید.
- برای کاری که باید بعداً یا طبق زمان‌بندی انجام شود، به‌جای الگوهای sleep/delay در `exec` از Cron استفاده کنید.

## پیکربندی

- `tools.exec.notifyOnExit` (پیش‌فرض: true): وقتی true باشد، جلسه‌های exec پس‌زمینه‌شده در زمان خروج یک رویداد system را صف می‌کنند و Heartbeat درخواست می‌کنند.
- `tools.exec.approvalRunningNoticeMs` (پیش‌فرض: 10000): وقتی exec وابسته به تأیید بیشتر از این مقدار اجرا شود، یک اعلان «running» واحد منتشر می‌کند (0 غیرفعال می‌کند).
- `tools.exec.timeoutSec` (پیش‌فرض: 1800): مهلت زمانی پیش‌فرض exec برای هر دستور بر حسب ثانیه. `timeout` در سطح هر فراخوانی آن را بازنویسی می‌کند؛ `timeout: 0` در سطح هر فراخوانی مهلت زمانی فرایند exec را غیرفعال می‌کند.
- `tools.exec.host` (پیش‌فرض: `auto`؛ وقتی runtime سندباکس فعال باشد به `sandbox` وگرنه به `gateway` resolve می‌شود)
- `tools.exec.security` (پیش‌فرض: `deny` برای sandbox، و اگر تنظیم نشده باشد `full` برای gateway + node)
- `tools.exec.ask` (پیش‌فرض: `off`)
- exec بدون تأیید روی host، پیش‌فرض gateway + node است. اگر رفتار تأیید/allowlist می‌خواهید، هم `tools.exec.*` و هم `~/.openclaw/exec-approvals.json` روی host را سخت‌گیرانه‌تر کنید؛ [تأییدهای Exec](/fa/tools/exec-approvals#yolo-mode-no-approval) را ببینید.
- YOLO از پیش‌فرض‌های سیاست host می‌آید (`security=full`، `ask=off`)، نه از `host=auto`. اگر می‌خواهید مسیریابی gateway یا node را اجباری کنید، `tools.exec.host` را تنظیم کنید یا از `/exec host=...` استفاده کنید.
- در حالت `security=full` به‌همراه `ask=off`، exec روی host مستقیماً از سیاست پیکربندی‌شده پیروی می‌کند؛ هیچ لایه اضافی پیش‌فیلتر heuristic برای command-obfuscation یا رد script-preflight وجود ندارد.
- `tools.exec.node` (پیش‌فرض: تنظیم‌نشده)
- `tools.exec.strictInlineEval` (پیش‌فرض: false): وقتی true باشد، فرم‌های eval درون‌خطی interpreter مانند `python -c`، `node -e`، `ruby -e`، `perl -e`، `php -r`، `lua -e`، و `osascript -e` همیشه به تأیید صریح نیاز دارند. `allow-always` همچنان می‌تواند invocationهای بی‌خطر interpreter/script را ماندگار کند، اما فرم‌های inline-eval همچنان هر بار prompt می‌دهند.
- `tools.exec.pathPrepend`: فهرستی از دایرکتوری‌ها برای افزودن به ابتدای `PATH` در اجراهای exec (فقط gateway + sandbox).
- `tools.exec.safeBins`: binaryهای امن فقط stdin که می‌توانند بدون entryهای صریح allowlist اجرا شوند. برای جزئیات رفتار، [Safe bins](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) را ببینید.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های صریح اضافی که برای بررسی مسیرهای `safeBins` مورد اعتماد هستند. entryهای `PATH` هرگز به‌طور خودکار مورد اعتماد قرار نمی‌گیرند. پیش‌فرض‌های داخلی `/bin` و `/usr/bin` هستند.
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

- `host=gateway`: `PATH` مربوط به login-shell شما را در محیط exec ادغام می‌کند. بازنویسی‌های `env.PATH` برای اجرای host
  رد می‌شوند. خود daemon همچنان با یک `PATH` حداقلی اجرا می‌شود:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: داخل container، `sh -lc` (login shell) را اجرا می‌کند، بنابراین `/etc/profile` ممکن است `PATH` را reset کند.
  OpenClaw پس از source شدن profile، `env.PATH` را از طریق یک env var داخلی به ابتدا اضافه می‌کند (بدون shell interpolation)؛
  `tools.exec.pathPrepend` اینجا هم اعمال می‌شود.
- `host=node`: فقط بازنویسی‌های env غیرمسدودی که می‌فرستید به Node ارسال می‌شوند. بازنویسی‌های `env.PATH`
  برای اجرای host رد می‌شوند و توسط hostهای Node نادیده گرفته می‌شوند. اگر روی یک Node به entryهای اضافی PATH نیاز دارید،
  محیط سرویس host مربوط به Node را پیکربندی کنید (systemd/launchd) یا ابزارها را در مکان‌های استاندارد نصب کنید.

Binding هر agent به Node (از index فهرست agent در config استفاده کنید):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: تب Nodes یک panel کوچک «Binding Node برای Exec» برای همان تنظیمات دارد.

## بازنویسی‌های جلسه (`/exec`)

از `/exec` برای تنظیم پیش‌فرض‌های **هر جلسه** برای `host`، `security`، `ask`، و `node` استفاده کنید.
برای نمایش مقدارهای فعلی، `/exec` را بدون argument بفرستید.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## مدل مجوزدهی

`/exec` فقط برای **فرستنده‌های مجاز** رعایت می‌شود (allowlistهای channel/pairing به‌همراه `commands.useAccessGroups`).
فقط **state جلسه** را به‌روزرسانی می‌کند و config نمی‌نویسد. برای غیرفعال‌سازی سخت exec، آن را از طریق tool
policy رد کنید (`tools.deny: ["exec"]` یا برای هر agent). تأییدهای Host همچنان اعمال می‌شوند، مگر اینکه صراحتاً
`security=full` و `ask=off` را تنظیم کنید.

## تأییدهای Exec (اپلیکیشن همراه / host مربوط به Node)

agentهای sandboxed می‌توانند پیش از اجرای `exec` روی gateway یا host مربوط به Node، تأیید برای هر درخواست را لازم کنند.
برای سیاست، allowlist، و جریان UI، [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

وقتی تأییدها لازم باشند، ابزار exec بلافاصله با
`status: "approval-pending"` و یک approval id برمی‌گردد. پس از تأیید (یا رد / timeout)،
Gateway رویدادهای system منتشر می‌کند (`Exec finished` / `Exec denied`). اگر دستور پس از
`tools.exec.approvalRunningNoticeMs` همچنان در حال اجرا باشد، یک اعلان `Exec running` واحد منتشر می‌شود.
در channelهایی که card/button تأیید بومی دارند، agent باید ابتدا به همان UI بومی تکیه کند و فقط وقتی command دستی `/approve` را بیاورد که نتیجه tool صراحتاً بگوید تأییدهای chat در دسترس نیستند یا تأیید دستی تنها مسیر است.

## Allowlist + safe bins

اعمال allowlist دستی با globهای مسیر binary resolve‌شده و globهای نام ساده command مطابقت می‌دهد.
نام‌های ساده فقط با commandهایی مطابقت دارند که از طریق PATH فراخوانی شده‌اند، پس `rg` می‌تواند با
`/opt/homebrew/bin/rg` وقتی command برابر `rg` است مطابقت کند، اما نه با `./rg` یا `/tmp/rg`.
وقتی `security=allowlist` باشد، commandهای shell فقط وقتی به‌طور خودکار مجاز می‌شوند که هر segment در pipeline
در allowlist باشد یا safe bin باشد. زنجیره‌سازی (`;`، `&&`، `||`) و redirectionها
در حالت allowlist رد می‌شوند، مگر اینکه هر segment سطح‌بالا allowlist را برآورده کند
(شامل safe binها). Redirectionها همچنان پشتیبانی نمی‌شوند.
اعتماد پایدار `allow-always` این قاعده را دور نمی‌زند: یک command زنجیره‌شده همچنان نیاز دارد هر
segment سطح‌بالا مطابقت داشته باشد.

`autoAllowSkills` یک مسیر convenience جداگانه در تأییدهای exec است. با entryهای allowlist مسیر دستی یکسان نیست.
برای اعتماد صریح و strict، `autoAllowSkills` را غیرفعال نگه دارید.

از دو کنترل برای کارهای متفاوت استفاده کنید:

- `tools.exec.safeBins`: فیلترهای stream کوچک، فقط stdin.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های مورد اعتماد صریح اضافی برای مسیرهای executable مربوط به safe-bin.
- `tools.exec.safeBinProfiles`: سیاست argv صریح برای safe binهای سفارشی.
- allowlist: اعتماد صریح برای مسیرهای executable.

با `safeBins` مانند یک فهرست مجاز عمومی رفتار نکنید و باینری‌های مفسر/زمان اجرا (برای مثال `python3`، `node`، `ruby`، `bash`) را اضافه نکنید. اگر به آن‌ها نیاز دارید، از ورودی‌های صریح فهرست مجاز استفاده کنید و درخواست‌های تأیید را فعال نگه دارید.
`openclaw security audit` زمانی هشدار می‌دهد که ورودی‌های مفسر/زمان اجرای `safeBins` فاقد پروفایل‌های صریح باشند، و `openclaw doctor --fix` می‌تواند ورودی‌های سفارشیِ مفقود `safeBinProfiles` را بسازد.
`openclaw security audit` و `openclaw doctor` همچنین زمانی هشدار می‌دهند که باینری‌های با رفتار گسترده مانند `jq` را به‌صورت صریح دوباره به `safeBins` اضافه کنید.
اگر مفسرها را به‌صورت صریح در فهرست مجاز قرار می‌دهید، `tools.exec.strictInlineEval` را فعال کنید تا فرم‌های ارزیابی کد درون‌خطی همچنان به تأیید تازه نیاز داشته باشند.

برای جزئیات کامل خط‌مشی و نمونه‌ها، [تأییدهای Exec](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) و [باینری‌های امن در برابر فهرست مجاز](/fa/tools/exec-approvals-advanced#safe-bins-versus-allowlist) را ببینید.

## نمونه‌ها

پیش‌زمینه:

```json
{ "tool": "exec", "command": "ls -la" }
```

پس‌زمینه + نظرسنجی:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

نظرسنجی برای وضعیت درخواستی است، نه حلقه‌های انتظار. اگر بیدارباش تکمیل خودکار
فعال باشد، فرمان می‌تواند هنگام تولید خروجی یا شکست، نشست را بیدار کند.

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

`apply_patch` یک زیرابزار از `exec` برای ویرایش‌های ساختاریافته چندفایلی است.
برای مدل‌های OpenAI و OpenAI Codex به‌طور پیش‌فرض فعال است. فقط زمانی از پیکربندی استفاده کنید
که می‌خواهید آن را غیرفعال کنید یا به مدل‌های مشخصی محدود کنید:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

نکات:

- فقط برای مدل‌های OpenAI/OpenAI Codex در دسترس است.
- خط‌مشی ابزار همچنان اعمال می‌شود؛ `allow: ["write"]` به‌صورت ضمنی `apply_patch` را مجاز می‌کند.
- `deny: ["write"]` باعث رد `apply_patch` نمی‌شود؛ `apply_patch` را صراحتاً رد کنید یا وقتی نوشتن‌های patch نیز باید مسدود شوند، از `deny: ["group:fs"]` استفاده کنید.
- پیکربندی زیر `tools.exec.applyPatch` قرار دارد.
- مقدار پیش‌فرض `tools.exec.applyPatch.enabled` برابر `true` است؛ برای غیرفعال کردن ابزار برای مدل‌های OpenAI، آن را روی `false` بگذارید.
- مقدار پیش‌فرض `tools.exec.applyPatch.workspaceOnly` برابر `true` است (محدود به workspace). فقط زمانی آن را روی `false` بگذارید که عمداً می‌خواهید `apply_patch` بیرون از دایرکتوری workspace بنویسد/حذف کند.

## مرتبط

- [تأییدهای Exec](/fa/tools/exec-approvals) — دروازه‌های تأیید برای فرمان‌های shell
- [Sandboxing](/fa/gateway/sandboxing) — اجرای فرمان‌ها در محیط‌های sandboxed
- [فرایند پس‌زمینه](/fa/gateway/background-process) — exec طولانی‌مدت و ابزار process
- [امنیت](/fa/gateway/security) — خط‌مشی ابزار و دسترسی ارتقایافته
