---
read_when:
    - استفاده از ابزار exec یا تغییر آن
    - اشکال‌زدایی رفتار stdin یا TTY
summary: استفاده از ابزار Exec، حالت‌های stdin، و پشتیبانی از TTY
title: ابزار اجرا
x-i18n:
    generated_at: "2026-05-10T20:10:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 445b09c1c6cdc1998c1c2a6b1223fdef438011413d246c4de0de0436465b448f
    source_path: tools/exec.md
    workflow: 16
---

دستورهای پوسته را در فضای کاری اجرا کنید. `exec` یک سطح پوسته تغییردهنده است: دستورها می‌توانند هر جا که میزبان انتخاب‌شده یا فایل‌سیستم sandbox اجازه دهد، فایل ایجاد، ویرایش یا حذف کنند. غیرفعال‌کردن ابزارهای فایل‌سیستم OpenClaw مانند `write`، `edit`، یا `apply_patch` باعث نمی‌شود `exec` فقط‌خواندنی شود.

از اجرای foreground و background از طریق `process` پشتیبانی می‌کند. اگر `process` مجاز نباشد، `exec` به‌صورت همگام اجرا می‌شود و `yieldMs`/`background` را نادیده می‌گیرد.
نشست‌های background برای هر عامل محدود می‌شوند؛ `process` فقط نشست‌های همان عامل را می‌بیند.

## پارامترها

<ParamField path="command" type="string" required>
دستور پوسته برای اجرا.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دایرکتوری کاری برای دستور.
</ParamField>

<ParamField path="env" type="object">
بازنویسی‌های محیطی کلید/مقدار که روی محیط به‌ارث‌رسیده ادغام می‌شوند.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
پس از این تأخیر (ms)، دستور را به‌طور خودکار به background ببرد.
</ParamField>

<ParamField path="background" type="boolean" default="false">
دستور را به‌جای انتظار برای `yieldMs`، بلافاصله به background ببرد.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
timeout پیکربندی‌شده exec را برای این فراخوانی بازنویسی کنید. فقط وقتی `timeout: 0` را تنظیم کنید که دستور باید بدون timeout فرایند exec اجرا شود.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
در صورت امکان، در یک شبه‌ترمینال اجرا شود. برای CLIهای فقط TTY، عامل‌های کدنویسی، و UIهای ترمینالی استفاده کنید.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
محل اجرا. وقتی runtime مربوط به sandbox فعال باشد، `auto` به `sandbox` و در غیر این صورت به `gateway` resolve می‌شود.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
حالت اعمال برای اجرای `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
رفتار اعلان تأیید برای اجرای `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
شناسه/نام Node وقتی `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
درخواست حالت elevated — خروج از sandbox به مسیر میزبان پیکربندی‌شده. فقط وقتی elevated به `full` resolve شود، `security=full` اجباری می‌شود.
</ParamField>

نکته‌ها:

- مقدار پیش‌فرض `host` برابر `auto` است: وقتی runtime مربوط به sandbox برای نشست فعال باشد sandbox، و در غیر این صورت gateway.
- `host` فقط `auto`، `sandbox`، `gateway`، یا `node` را می‌پذیرد. انتخابگر نام میزبان نیست؛ مقدارهای شبیه نام میزبان پیش از اجرای دستور رد می‌شوند.
- `auto` راهبرد مسیریابی پیش‌فرض است، نه یک wildcard. `host=node` برای هر فراخوانی از `auto` مجاز است؛ `host=gateway` برای هر فراخوانی فقط وقتی مجاز است که runtime مربوط به sandbox فعال نباشد.
- بدون پیکربندی اضافه، `host=auto` همچنان «فقط کار می‌کند»: نبود sandbox یعنی به `gateway` resolve می‌شود؛ sandbox زنده یعنی در sandbox می‌ماند.
- `elevated` از sandbox به مسیر میزبان پیکربندی‌شده خارج می‌شود: به‌طور پیش‌فرض `gateway`، یا وقتی `tools.exec.host=node` باشد (یا پیش‌فرض نشست `host=node` باشد) `node`. این فقط وقتی در دسترس است که دسترسی elevated برای نشست/ارائه‌دهنده فعلی فعال باشد.
- تأییدهای `gateway`/`node` توسط `~/.openclaw/exec-approvals.json` کنترل می‌شوند.
- `node` به یک Node جفت‌شده نیاز دارد (برنامه همراه یا میزبان Node بدون رابط).
- اگر چند Node در دسترس باشد، برای انتخاب یکی `exec.node` یا `tools.exec.node` را تنظیم کنید.
- `exec host=node` تنها مسیر اجرای پوسته برای Nodeها است؛ wrapper قدیمی `nodes.run` حذف شده است.
- `timeout` روی اجرای foreground، background، `yieldMs`، gateway، sandbox، و Node `system.run` اعمال می‌شود. اگر حذف شود، OpenClaw از `tools.exec.timeoutSec` استفاده می‌کند؛ `timeout: 0` صریح، timeout فرایند exec را برای آن فراخوانی غیرفعال می‌کند.
- روی میزبان‌های غیر Windows، exec وقتی `SHELL` تنظیم باشد از آن استفاده می‌کند؛ اگر `SHELL` برابر `fish` باشد، برای جلوگیری از اسکریپت‌های ناسازگار با fish، `bash` (یا `sh`)
  را از `PATH` ترجیح می‌دهد، سپس اگر هیچ‌کدام وجود نداشته باشند به `SHELL` برمی‌گردد.
- روی میزبان‌های Windows، exec کشف PowerShell 7 (`pwsh`) را ترجیح می‌دهد (Program Files، ProgramW6432، سپس PATH)،
  سپس به Windows PowerShell 5.1 برمی‌گردد.
- اجرای میزبان (`gateway`/`node`) برای جلوگیری از ربایش باینری یا کد تزریق‌شده، `env.PATH` و بازنویسی‌های loader (`LD_*`/`DYLD_*`) را رد می‌کند.
- OpenClaw در محیط دستور ایجادشده (شامل اجرای PTY و sandbox) مقدار `OPENCLAW_SHELL=exec` را تنظیم می‌کند تا قوانین shell/profile بتوانند زمینه ابزار exec را تشخیص دهند.
- `openclaw channels login` از `exec` مسدود شده است، چون یک جریان تعاملی احراز هویت کانال است؛ آن را در یک ترمینال روی میزبان gateway اجرا کنید، یا وقتی وجود دارد از ابزار ورود بومی کانال در chat استفاده کنید.
- مهم: sandboxing به‌طور پیش‌فرض **خاموش** است. اگر sandboxing خاموش باشد، `host=auto` ضمنی
  به `gateway` resolve می‌شود. `host=sandbox` صریح همچنان به‌صورت بسته شکست می‌خورد، نه اینکه بی‌صدا
  روی میزبان gateway اجرا شود. sandboxing را فعال کنید یا از `host=gateway` همراه با تأییدها استفاده کنید.
- بررسی‌های preflight اسکریپت (برای خطاهای رایج نحو پوسته Python/Node) فقط فایل‌های داخل مرز مؤثر
  `workdir` را بررسی می‌کنند. اگر مسیر اسکریپت به بیرون از `workdir` resolve شود، preflight برای
  آن فایل رد می‌شود.
- برای کار طولانی‌مدتی که اکنون شروع می‌شود، آن را یک بار شروع کنید و وقتی فعال است و دستور خروجی می‌دهد یا شکست می‌خورد، به wake خودکار
  completion تکیه کنید.
  برای logها، وضعیت، ورودی، یا مداخله از `process` استفاده کنید؛ زمان‌بندی را با حلقه‌های sleep، حلقه‌های timeout، یا polling تکراری شبیه‌سازی نکنید.
- برای کاری که باید بعدا یا طبق زمان‌بندی انجام شود، به‌جای الگوهای sleep/delay در
  `exec` از cron استفاده کنید.

## پیکربندی

- `tools.exec.notifyOnExit` (پیش‌فرض: true): وقتی true باشد، نشست‌های exec که به background رفته‌اند هنگام خروج یک رویداد سیستم را در صف می‌گذارند و یک Heartbeat درخواست می‌کنند.
- `tools.exec.approvalRunningNoticeMs` (پیش‌فرض: 10000): وقتی exec مشروط به تأیید بیش از این مقدار طول بکشد، یک اعلان «در حال اجرا» منتشر می‌کند (0 غیرفعال می‌کند).
- `tools.exec.timeoutSec` (پیش‌فرض: 1800): timeout پیش‌فرض exec برای هر دستور، بر حسب ثانیه. `timeout` برای هر فراخوانی آن را بازنویسی می‌کند؛ `timeout: 0` برای هر فراخوانی timeout فرایند exec را غیرفعال می‌کند.
- `tools.exec.host` (پیش‌فرض: `auto`؛ وقتی runtime مربوط به sandbox فعال باشد به `sandbox` و در غیر این صورت به `gateway` resolve می‌شود)
- `tools.exec.security` (پیش‌فرض: `deny` برای sandbox، و در صورت تنظیم‌نبودن `full` برای gateway + Node)
- `tools.exec.ask` (پیش‌فرض: `off`)
- exec میزبان بدون تأیید، پیش‌فرض gateway + Node است. اگر رفتار تأیید/allowlist می‌خواهید، هم `tools.exec.*` و هم `~/.openclaw/exec-approvals.json` میزبان را سخت‌گیرانه‌تر کنید؛ [تأییدهای exec](/fa/tools/exec-approvals#yolo-mode-no-approval) را ببینید.
- YOLO از پیش‌فرض‌های سیاست میزبان (`security=full`، `ask=off`) می‌آید، نه از `host=auto`. اگر می‌خواهید مسیریابی gateway یا Node را اجباری کنید، `tools.exec.host` را تنظیم کنید یا از `/exec host=...` استفاده کنید.
- در حالت `security=full` همراه با `ask=off`، exec میزبان مستقیما از سیاست پیکربندی‌شده پیروی می‌کند؛ هیچ لایه اضافی پیش‌فیلتر heuristic برای مبهم‌سازی دستور یا رد script-preflight وجود ندارد.
- `tools.exec.node` (پیش‌فرض: تنظیم‌نشده)
- `tools.exec.strictInlineEval` (پیش‌فرض: false): وقتی true باشد، فرم‌های eval درون‌خطی مفسر مانند `python -c`، `node -e`، `ruby -e`، `perl -e`، `php -r`، `lua -e`، و `osascript -e` همیشه به تأیید صریح نیاز دارند. `allow-always` همچنان می‌تواند فراخوانی‌های بی‌ضرر مفسر/اسکریپت را ماندگار کند، اما فرم‌های inline-eval همچنان هر بار prompt می‌دهند.
- `tools.exec.pathPrepend`: فهرستی از دایرکتوری‌ها برای prepend کردن به `PATH` برای اجراهای exec (فقط gateway + sandbox).
- `tools.exec.safeBins`: باینری‌های امن فقط stdin که می‌توانند بدون ورودی‌های allowlist صریح اجرا شوند. برای جزئیات رفتار، [safe binها](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) را ببینید.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های صریح اضافی که برای بررسی مسیر `safeBins` مورد اعتماد هستند. ورودی‌های `PATH` هرگز به‌طور خودکار مورد اعتماد قرار نمی‌گیرند. پیش‌فرض‌های داخلی `/bin` و `/usr/bin` هستند.
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

- `host=gateway`: `PATH` مربوط به login-shell شما را در محیط exec ادغام می‌کند. بازنویسی‌های `env.PATH` برای اجرای میزبان
  رد می‌شوند. خود daemon همچنان با یک `PATH` حداقلی اجرا می‌شود:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: داخل container با `sh -lc` (login shell) اجرا می‌شود، بنابراین `/etc/profile` ممکن است `PATH` را بازنشانی کند.
  OpenClaw پس از source شدن profile، `env.PATH` را از طریق یک env var داخلی prepend می‌کند (بدون shell interpolation)؛
  `tools.exec.pathPrepend` اینجا هم اعمال می‌شود.
- `host=node`: فقط بازنویسی‌های env مسدودنشده‌ای که پاس می‌دهید به Node فرستاده می‌شوند. بازنویسی‌های `env.PATH` برای اجرای میزبان
  رد می‌شوند و توسط میزبان‌های Node نادیده گرفته می‌شوند. اگر روی یک Node به ورودی‌های PATH اضافی نیاز دارید،
  محیط سرویس میزبان Node (systemd/launchd) را پیکربندی کنید یا ابزارها را در مکان‌های استاندارد نصب کنید.

اتصال Node برای هر عامل (از index فهرست عامل در پیکربندی استفاده کنید):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI کنترل: تب Nodes شامل یک پنل کوچک «اتصال Node برای Exec» برای همین تنظیمات است.

## بازنویسی‌های نشست (`/exec`)

از `/exec` برای تنظیم پیش‌فرض‌های **هر نشست** برای `host`، `security`، `ask`، و `node` استفاده کنید.
برای نمایش مقدارهای فعلی، `/exec` را بدون آرگومان بفرستید.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## مدل مجوزدهی

`/exec` فقط برای **فرستنده‌های مجاز** (allowlist/جفت‌سازی کانال به‌علاوه `commands.useAccessGroups`) رعایت می‌شود.
فقط **وضعیت نشست** را به‌روزرسانی می‌کند و پیکربندی را نمی‌نویسد. برای hard-disable کردن exec، آن را از طریق سیاست ابزار
(`tools.deny: ["exec"]` یا برای هر عامل) deny کنید. تأییدهای میزبان همچنان اعمال می‌شوند مگر اینکه صریحا
`security=full` و `ask=off` را تنظیم کنید.

## تأییدهای exec (برنامه همراه / میزبان Node)

عامل‌های sandboxشده می‌توانند پیش از اجرای `exec` روی میزبان gateway یا Node به تأیید هر درخواست نیاز داشته باشند.
برای سیاست، allowlist، و جریان UI، [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

وقتی تأییدها لازم باشند، ابزار exec بلافاصله با
`status: "approval-pending"` و یک شناسه تأیید برمی‌گردد. پس از تأیید (یا رد / timeout)،
Gateway رویدادهای سیستم (`Exec finished` / `Exec denied`) را منتشر می‌کند. اگر دستور پس از
`tools.exec.approvalRunningNoticeMs` همچنان در حال اجرا باشد، یک اعلان `Exec running` منتشر می‌شود.
در کانال‌هایی با کارت‌ها/دکمه‌های تأیید بومی، عامل باید ابتدا به همان
UI بومی تکیه کند و فقط وقتی نتیجه ابزار صریحا می‌گوید تأییدهای chat در دسترس نیستند یا تأیید دستی تنها مسیر است، یک دستور دستی `/approve` درج کند.

## Allowlist + safe binها

اعمال allowlist دستی با globهای مسیر باینری resolveشده و globهای نام دستور خام
match می‌شود. نام‌های خام فقط با دستورهایی match می‌شوند که از طریق PATH فراخوانی شده‌اند، بنابراین `rg` می‌تواند با
`/opt/homebrew/bin/rg` وقتی دستور `rg` است match شود، اما نه با `./rg` یا `/tmp/rg`.
وقتی `security=allowlist` باشد، دستورهای پوسته فقط وقتی auto-allow می‌شوند که هر segment در pipeline
در allowlist باشد یا safe bin باشد. زنجیره‌سازی (`;`، `&&`، `||`) و redirectionها
در حالت allowlist رد می‌شوند مگر اینکه هر segment سطح‌بالا، allowlist
(شامل safe binها) را برآورده کند. Redirectionها همچنان پشتیبانی نمی‌شوند.
اعتماد ماندگار `allow-always` این قانون را دور نمی‌زند: یک دستور زنجیره‌ای همچنان نیاز دارد هر
segment سطح‌بالا match شود.

`autoAllowSkills` یک مسیر راحتی جداگانه در تأییدهای exec است. با ورودی‌های allowlist مسیر دستی
یکسان نیست. برای اعتماد صریح سخت‌گیرانه، `autoAllowSkills` را غیرفعال نگه دارید.

از دو کنترل برای کارهای متفاوت استفاده کنید:

- `tools.exec.safeBins`: فیلترهای stream کوچک و فقط stdin.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های مورد اعتماد اضافی صریح برای مسیرهای اجرایی safe-bin.
- `tools.exec.safeBinProfiles`: سیاست argv صریح برای safe binهای سفارشی.
- allowlist: اعتماد صریح برای مسیرهای اجرایی.

`safeBins` را به‌عنوان یک فهرست مجاز عمومی در نظر نگیرید و باینری‌های مفسر/محیط اجرا (برای مثال `python3`، `node`، `ruby`، `bash`) را اضافه نکنید. اگر به آن‌ها نیاز دارید، از مدخل‌های صریح فهرست مجاز استفاده کنید و اعلان‌های تأیید را فعال نگه دارید.
`openclaw security audit` زمانی هشدار می‌دهد که مدخل‌های مفسر/محیط اجرای `safeBins` فاقد پروفایل‌های صریح باشند، و `openclaw doctor --fix` می‌تواند مدخل‌های سفارشی جاافتاده‌ی `safeBinProfiles` را قالب‌بندی اولیه کند.
`openclaw security audit` و `openclaw doctor` همچنین زمانی هشدار می‌دهند که باینری‌های با رفتار گسترده مانند `jq` را صریحاً دوباره به `safeBins` اضافه کنید.
اگر مفسرها را صریحاً در فهرست مجاز قرار می‌دهید، `tools.exec.strictInlineEval` را فعال کنید تا شکل‌های ارزیابی کد درون‌خطی همچنان به تأیید تازه نیاز داشته باشند.

برای جزئیات کامل سیاست و مثال‌ها، [تأییدهای Exec](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) و [باینری‌های امن در برابر فهرست مجاز](/fa/tools/exec-approvals-advanced#safe-bins-versus-allowlist) را ببینید.

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

نظرسنجی برای وضعیت درخواستی است، نه حلقه‌های انتظار. اگر بیدارسازی تکمیل خودکار
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

چسباندن (به‌طور پیش‌فرض با براکت):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` یک ابزار فرعی از `exec` برای ویرایش‌های ساختاریافته‌ی چندفایلی است.
این ابزار به‌طور پیش‌فرض برای مدل‌های OpenAI و OpenAI Codex فعال است. فقط زمانی از پیکربندی استفاده کنید
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

نکته‌ها:

- فقط برای مدل‌های OpenAI/OpenAI Codex در دسترس است.
- سیاست ابزار همچنان اعمال می‌شود؛ `allow: ["write"]` به‌طور ضمنی `apply_patch` را مجاز می‌کند.
- `deny: ["write"]`، `apply_patch` را منع نمی‌کند؛ `apply_patch` را صریحاً منع کنید یا وقتی نوشتن وصله‌ها هم باید مسدود شود از `deny: ["group:fs"]` استفاده کنید.
- پیکربندی زیر `tools.exec.applyPatch` قرار دارد.
- مقدار پیش‌فرض `tools.exec.applyPatch.enabled` برابر `true` است؛ برای غیرفعال کردن ابزار برای مدل‌های OpenAI آن را روی `false` بگذارید.
- مقدار پیش‌فرض `tools.exec.applyPatch.workspaceOnly` برابر `true` است (محدود به فضای کاری). فقط زمانی آن را روی `false` بگذارید که عمداً می‌خواهید `apply_patch` بیرون از دایرکتوری فضای کاری بنویسد/حذف کند.

## مرتبط

- [تأییدهای Exec](/fa/tools/exec-approvals) — دروازه‌های تأیید برای فرمان‌های پوسته
- [سندباکس‌سازی](/fa/gateway/sandboxing) — اجرای فرمان‌ها در محیط‌های سندباکس‌شده
- [فرایند پس‌زمینه](/fa/gateway/background-process) — اجرای طولانی‌مدت و ابزار فرایند
- [امنیت](/fa/gateway/security) — سیاست ابزار و دسترسی ارتقایافته
