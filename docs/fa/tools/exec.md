---
read_when:
    - استفاده از ابزار exec یا تغییر آن
    - اشکال‌زدایی رفتار stdin یا TTY
summary: استفاده از ابزار Exec، حالت‌های stdin، و پشتیبانی از TTY
title: ابزار اجرا
x-i18n:
    generated_at: "2026-05-11T20:44:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

اجرای فرمان‌های شل در فضای کاری. `exec` یک سطح شل تغییردهنده است: فرمان‌ها می‌توانند هرجا که میزبان انتخاب‌شده یا سامانهٔ فایل sandbox اجازه دهد، فایل ایجاد، ویرایش یا حذف کنند. غیرفعال کردن ابزارهای سامانهٔ فایل OpenClaw مانند `write`، `edit`، یا `apply_patch` باعث نمی‌شود `exec` فقط‌خواندنی شود.

از اجرای پیش‌زمینه و پس‌زمینه از طریق `process` پشتیبانی می‌کند. اگر `process` مجاز نباشد، `exec` به‌صورت همگام اجرا می‌شود و `yieldMs`/`background` را نادیده می‌گیرد.
نشست‌های پس‌زمینه برای هر عامل محدوده‌بندی می‌شوند؛ `process` فقط نشست‌های همان عامل را می‌بیند.

## پارامترها

<ParamField path="command" type="string" required>
فرمان شلی که باید اجرا شود.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دایرکتوری کاری برای فرمان.
</ParamField>

<ParamField path="env" type="object">
بازنویسی‌های محیطی کلید/مقدار که روی محیط به‌ارث‌رسیده ادغام می‌شوند.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
پس از این تأخیر (میلی‌ثانیه)، فرمان را خودکار به پس‌زمینه ببرد.
</ParamField>

<ParamField path="background" type="boolean" default="false">
فرمان را به‌جای انتظار برای `yieldMs` بلافاصله به پس‌زمینه ببرد.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
مهلت زمانی پیکربندی‌شدهٔ exec را برای این فراخوانی بازنویسی می‌کند. `timeout: 0` را فقط وقتی تنظیم کنید که فرمان باید بدون مهلت زمانی فرایند exec اجرا شود.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
در صورت دسترس بودن، در یک شبه‌ترمینال اجرا شود. برای CLIهای فقط TTY، عامل‌های کدنویسی، و رابط‌های کاربری ترمینالی استفاده کنید.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
محل اجرا. وقتی runtime مربوط به sandbox فعال باشد، `auto` به `sandbox`، و در غیر این صورت به `gateway` resolve می‌شود.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
برای فراخوانی‌های عادی ابزار نادیده گرفته می‌شود. امنیت `gateway` / `node` توسط
`tools.exec.security` و `~/.openclaw/exec-approvals.json` کنترل می‌شود؛ حالت elevated فقط وقتی می‌تواند
`security=full` را اجبار کند که اپراتور صراحتاً دسترسی elevated بدهد.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
رفتار اعلان تأیید برای اجرای `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
شناسه/نام Node وقتی `host=node` باشد.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
درخواست حالت elevated — خروج از sandbox به مسیر میزبان پیکربندی‌شده. `security=full` فقط وقتی اجبار می‌شود که elevated به `full` resolve شود.
</ParamField>

نکات:

- `host` به‌طور پیش‌فرض `auto` است: وقتی runtime مربوط به sandbox برای نشست فعال باشد sandbox، و در غیر این صورت gateway.
- `host` فقط `auto`، `sandbox`، `gateway`، یا `node` را می‌پذیرد. این گزینه انتخابگر نام میزبان نیست؛ مقدارهای شبیه نام میزبان پیش از اجرای فرمان رد می‌شوند.
- `auto` راهبرد مسیریابی پیش‌فرض است، نه یک wildcard. `host=node` در سطح هر فراخوانی از `auto` مجاز است؛ `host=gateway` در سطح هر فراخوانی فقط وقتی مجاز است که runtime مربوط به sandbox فعال نباشد.
- بدون پیکربندی اضافه، `host=auto` همچنان «فقط کار می‌کند»: نبود sandbox یعنی به `gateway` resolve می‌شود؛ sandbox زنده یعنی داخل sandbox می‌ماند.
- `elevated` از sandbox به مسیر میزبان پیکربندی‌شده خارج می‌شود: به‌طور پیش‌فرض `gateway`، یا وقتی `tools.exec.host=node` باشد (یا پیش‌فرض نشست `host=node` باشد) `node`. این قابلیت فقط وقتی در دسترس است که دسترسی elevated برای نشست/ارائه‌دهندهٔ فعلی فعال باشد.
- تأییدهای `gateway`/`node` توسط `~/.openclaw/exec-approvals.json` کنترل می‌شوند.
- `node` به یک node جفت‌شده نیاز دارد (companion app یا میزبان node بدون رابط).
- اگر چند node در دسترس باشد، برای انتخاب یکی `exec.node` یا `tools.exec.node` را تنظیم کنید.
- `exec host=node` تنها مسیر اجرای شل برای nodeها است؛ wrapper قدیمی `nodes.run` حذف شده است.
- `timeout` برای اجرای پیش‌زمینه، پس‌زمینه، `yieldMs`، gateway، sandbox، و اجرای `system.run` مربوط به node اعمال می‌شود. اگر حذف شود، OpenClaw از `tools.exec.timeoutSec` استفاده می‌کند؛ `timeout: 0` صریح مهلت زمانی فرایند exec را برای آن فراخوانی غیرفعال می‌کند.
- روی میزبان‌های غیر Windows، exec وقتی `SHELL` تنظیم شده باشد از آن استفاده می‌کند؛ اگر `SHELL` برابر `fish` باشد، برای پرهیز از اسکریپت‌های ناسازگار با fish، `bash` (یا `sh`)
  را از `PATH` ترجیح می‌دهد، سپس اگر هیچ‌کدام وجود نداشته باشند به `SHELL` برمی‌گردد.
- روی میزبان‌های Windows، exec کشف PowerShell 7 (`pwsh`) را ترجیح می‌دهد (Program Files، ProgramW6432، سپس PATH)،
  سپس به Windows PowerShell 5.1 برمی‌گردد.
- اجرای میزبان (`gateway`/`node`) مقدارهای override برای `env.PATH` و loader (`LD_*`/`DYLD_*`) را رد می‌کند تا
  از ربایش باینری یا کد تزریق‌شده جلوگیری شود.
- OpenClaw در محیط فرمان ایجادشده `OPENCLAW_SHELL=exec` را تنظیم می‌کند (از جمله اجرای PTY و sandbox) تا قواعد shell/profile بتوانند زمینهٔ ابزار exec را تشخیص دهند.
- `openclaw channels login` از `exec` مسدود شده است چون یک جریان تعاملی احراز هویت کانال است؛ آن را در ترمینالی روی میزبان gateway اجرا کنید، یا وقتی وجود دارد از ابزار ورود بومی کانال در چت استفاده کنید.
- مهم: sandboxing به‌طور پیش‌فرض **خاموش است**. اگر sandboxing خاموش باشد، `host=auto` ضمنی
  به `gateway` resolve می‌شود. `host=sandbox` صریح همچنان به‌صورت بسته شکست می‌خورد، نه اینکه بی‌صدا
  روی میزبان gateway اجرا شود. sandboxing را فعال کنید یا از `host=gateway` همراه با تأییدها استفاده کنید.
- بررسی‌های preflight اسکریپت (برای خطاهای رایج نحو شل Python/Node) فقط فایل‌های داخل مرز
  مؤثر `workdir` را بررسی می‌کنند. اگر مسیر اسکریپت بیرون از `workdir` resolve شود، preflight برای
  آن فایل رد می‌شود.
- برای کارهای طولانی‌مدتی که اکنون شروع می‌شوند، آن را یک‌بار شروع کنید و وقتی فعال است و فرمان خروجی می‌دهد یا شکست می‌خورد، به بیدارباش تکمیل خودکار تکیه کنید.
  از `process` برای لاگ‌ها، وضعیت، ورودی، یا مداخله استفاده کنید؛ زمان‌بندی را با حلقه‌های sleep، حلقه‌های timeout، یا polling تکراری شبیه‌سازی نکنید.
- برای کاری که باید بعداً یا طبق برنامه انجام شود، به‌جای الگوهای sleep/delay در `exec` از Cron استفاده کنید.

## پیکربندی

- `tools.exec.notifyOnExit` (پیش‌فرض: true): وقتی true باشد، نشست‌های exec پس‌زمینه‌شده هنگام خروج یک رویداد سامانه را در صف می‌گذارند و یک Heartbeat درخواست می‌کنند.
- `tools.exec.approvalRunningNoticeMs` (پیش‌فرض: 10000): وقتی یک exec نیازمند تأیید بیش از این مدت اجرا شود، یک اعلان واحد «running» منتشر می‌کند (0 غیرفعال می‌کند).
- `tools.exec.timeoutSec` (پیش‌فرض: 1800): مهلت زمانی پیش‌فرض exec برای هر فرمان بر حسب ثانیه. `timeout` در سطح هر فراخوانی آن را بازنویسی می‌کند؛ `timeout: 0` در سطح هر فراخوانی مهلت زمانی فرایند exec را غیرفعال می‌کند.
- `tools.exec.host` (پیش‌فرض: `auto`؛ وقتی runtime مربوط به sandbox فعال باشد به `sandbox`، و در غیر این صورت به `gateway` resolve می‌شود)
- `tools.exec.security` (پیش‌فرض: `deny` برای sandbox، و وقتی تنظیم نشده باشد `full` برای gateway + node)
- `tools.exec.ask` (پیش‌فرض: `off`)
- exec میزبان بدون تأیید، پیش‌فرض gateway + node است. اگر رفتار تأیید/allowlist می‌خواهید، هم `tools.exec.*` و هم `~/.openclaw/exec-approvals.json` میزبان را سخت‌گیرانه‌تر کنید؛ [تأییدهای Exec](/fa/tools/exec-approvals#yolo-mode-no-approval) را ببینید.
- YOLO از پیش‌فرض‌های سیاست میزبان می‌آید (`security=full`، `ask=off`)، نه از `host=auto`. اگر می‌خواهید مسیریابی gateway یا node را اجبار کنید، `tools.exec.host` را تنظیم کنید یا از `/exec host=...` استفاده کنید.
- در حالت `security=full` به‌همراه `ask=off`، host exec مستقیماً از سیاست پیکربندی‌شده پیروی می‌کند؛ هیچ لایهٔ اضافی heuristic برای پیش‌فیلتر ابهام‌سازی فرمان یا رد script-preflight وجود ندارد.
- `tools.exec.node` (پیش‌فرض: تنظیم‌نشده)
- `tools.exec.strictInlineEval` (پیش‌فرض: false): وقتی true باشد، فرم‌های eval درون‌خطی مفسر مانند `python -c`، `node -e`، `ruby -e`، `perl -e`، `php -r`، `lua -e`، و `osascript -e` همیشه به تأیید صریح نیاز دارند. `allow-always` همچنان می‌تواند فراخوانی‌های بی‌ضرر مفسر/اسکریپت را ماندگار کند، اما فرم‌های inline-eval همچنان هر بار اعلان می‌دهند.
- `tools.exec.commandHighlighting` (پیش‌فرض: false): وقتی true باشد، اعلان‌های تأیید می‌توانند بخش‌های فرمان استخراج‌شده توسط parser را در متن فرمان برجسته کنند. برای فعال‌سازی برجسته‌سازی متن فرمان بدون تغییر سیاست تأیید exec، آن را به‌صورت سراسری یا برای هر عامل روی `true` تنظیم کنید.
- `tools.exec.pathPrepend`: فهرست دایرکتوری‌هایی که برای اجراهای exec به ابتدای `PATH` افزوده می‌شوند (فقط gateway + sandbox).
- `tools.exec.safeBins`: باینری‌های امن فقط-stdin که می‌توانند بدون ورودی‌های allowlist صریح اجرا شوند. برای جزئیات رفتار، [باینری‌های امن](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) را ببینید.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های صریح اضافی که برای بررسی مسیر `safeBins` مورد اعتمادند. ورودی‌های `PATH` هرگز خودکار مورد اعتماد قرار نمی‌گیرند. پیش‌فرض‌های داخلی `/bin` و `/usr/bin` هستند.
- `tools.exec.safeBinProfiles`: سیاست argv سفارشی اختیاری برای هر باینری امن (`minPositional`، `maxPositional`، `allowedValueFlags`، `deniedFlags`).

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

- `host=gateway`: `PATH` شل ورود شما را در محیط exec ادغام می‌کند. مقدارهای override برای `env.PATH`
  در اجرای میزبان رد می‌شوند. خود daemon همچنان با یک `PATH` حداقلی اجرا می‌شود:
  - macOS: `/opt/homebrew/bin`، `/usr/local/bin`، `/usr/bin`، `/bin`
  - Linux: `/usr/local/bin`، `/usr/bin`، `/bin`
- `host=sandbox`: داخل کانتینر `sh -lc` (شل ورود) را اجرا می‌کند، بنابراین `/etc/profile` ممکن است `PATH` را بازنشانی کند.
  OpenClaw پس از بارگذاری profile، `env.PATH` را از طریق یک متغیر محیطی داخلی (بدون interpolation شل) به ابتدا اضافه می‌کند؛
  `tools.exec.pathPrepend` اینجا هم اعمال می‌شود.
- `host=node`: فقط overrideهای env مسدودنشده‌ای که ارسال می‌کنید به node فرستاده می‌شوند. مقدارهای override برای `env.PATH`
  در اجرای میزبان رد می‌شوند و میزبان‌های node آن‌ها را نادیده می‌گیرند. اگر روی یک node به ورودی‌های PATH اضافی نیاز دارید،
  محیط سرویس میزبان node (systemd/launchd) را پیکربندی کنید یا ابزارها را در مکان‌های استاندارد نصب کنید.

اتصال node در سطح هر عامل (از شاخص فهرست عامل در config استفاده کنید):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

رابط کاربری کنترل: زبانهٔ Nodes شامل یک پنل کوچک «Exec node binding» برای همین تنظیمات است.

## بازنویسی‌های نشست (`/exec`)

از `/exec` برای تنظیم پیش‌فرض‌های **در سطح هر نشست** برای `host`، `security`، `ask`، و `node` استفاده کنید.
برای نمایش مقدارهای فعلی، `/exec` را بدون آرگومان ارسال کنید.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## مدل مجوزدهی

`/exec` فقط برای **فرستنده‌های مجاز** رعایت می‌شود (allowlistهای کانال/جفت‌سازی به‌همراه `commands.useAccessGroups`).
فقط **وضعیت نشست** را به‌روزرسانی می‌کند و config نمی‌نویسد. برای غیرفعال‌سازی سخت exec، آن را از طریق سیاست ابزار
رد کنید (`tools.deny: ["exec"]` یا در سطح هر عامل). تأییدهای میزبان همچنان اعمال می‌شوند، مگر اینکه صراحتاً
`security=full` و `ask=off` را تنظیم کنید.

## تأییدهای Exec (companion app / میزبان node)

عامل‌های sandboxشده می‌توانند پیش از اجرای `exec` روی میزبان gateway یا node به تأیید برای هر درخواست نیاز داشته باشند.
برای سیاست، allowlist، و جریان رابط کاربری، [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

وقتی تأییدها لازم باشند، ابزار exec بلافاصله با
`status: "approval-pending"` و یک شناسهٔ تأیید برمی‌گردد. پس از تأیید (یا رد / timeout)،
Gateway رویدادهای سامانه را منتشر می‌کند (`Exec finished` / `Exec denied`). اگر فرمان پس از
`tools.exec.approvalRunningNoticeMs` همچنان در حال اجرا باشد، یک اعلان واحد `Exec running` منتشر می‌شود.
در کانال‌هایی با کارت‌ها/دکمه‌های تأیید بومی، عامل باید ابتدا به همان
رابط کاربری بومی تکیه کند و فقط وقتی نتیجهٔ ابزار صراحتاً می‌گوید تأییدهای چت در دسترس نیستند یا تأیید دستی تنها مسیر است، یک فرمان دستی `/approve` درج کند.

## Allowlist + باینری‌های امن

اعمال allowlist دستی با globهای مسیر باینری resolveشده و globهای نام فرمان خام تطبیق می‌دهد. نام‌های خام فقط فرمان‌هایی را تطبیق می‌دهند که از طریق PATH فراخوانی شده‌اند، بنابراین وقتی فرمان `rg` باشد، `rg` می‌تواند
`/opt/homebrew/bin/rg` را تطبیق دهد، اما نه `./rg` یا `/tmp/rg`.
وقتی `security=allowlist` باشد، فرمان‌های شل فقط زمانی خودکار مجاز می‌شوند که هر segment در pipeline
در allowlist باشد یا یک باینری امن باشد. زنجیره‌سازی (`;`، `&&`، `||`) و redirectionها
در حالت allowlist رد می‌شوند، مگر اینکه هر segment سطح‌بالا
allowlist را برآورده کند (از جمله باینری‌های امن). Redirectionها همچنان پشتیبانی نمی‌شوند.
اعتماد پایدار `allow-always` این قاعده را دور نمی‌زند: یک فرمان زنجیره‌شده همچنان نیاز دارد هر
segment سطح‌بالا تطبیق داشته باشد.

`autoAllowSkills` یک مسیر راحتی جداگانه در تأییدهای exec است. این با
ورودی‌های allowlist مسیر دستی یکسان نیست. برای اعتماد صریح سخت‌گیرانه، `autoAllowSkills` را غیرفعال نگه دارید.

از این دو کنترل برای کارهای متفاوت استفاده کنید:

- `tools.exec.safeBins`: فیلترهای جریانی کوچک و فقط مبتنی بر stdin.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های مورداعتماد اضافی و صریح برای مسیرهای اجرایی safe-bin.
- `tools.exec.safeBinProfiles`: سیاست argv صریح برای safe binهای سفارشی.
- فهرست مجاز: اعتماد صریح برای مسیرهای اجرایی.

با `safeBins` مثل یک فهرست مجاز عمومی رفتار نکنید و باینری‌های مفسر/زمان اجرا (برای مثال `python3`، `node`، `ruby`، `bash`) را اضافه نکنید. اگر به آن‌ها نیاز دارید، از ورودی‌های صریح فهرست مجاز استفاده کنید و اعلان‌های تأیید را فعال نگه دارید.
`openclaw security audit` وقتی ورودی‌های `safeBins` مفسر/زمان اجرا پروفایل‌های صریح نداشته باشند هشدار می‌دهد، و `openclaw doctor --fix` می‌تواند ورودی‌های سفارشیِ گم‌شده‌ی `safeBinProfiles` را داربست‌سازی کند.
`openclaw security audit` و `openclaw doctor` همچنین وقتی binهای با رفتار گسترده مانند `jq` را به‌صورت صریح دوباره به `safeBins` اضافه کنید هشدار می‌دهند.
اگر مفسرها را به‌صورت صریح در فهرست مجاز قرار می‌دهید، `tools.exec.strictInlineEval` را فعال کنید تا شکل‌های ارزیابی کد درون‌خطی همچنان به تأیید تازه نیاز داشته باشند.

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

نظرسنجی برای وضعیت درخواستی است، نه حلقه‌های انتظار. اگر بیدارباش تکمیل خودکار
فعال باشد، فرمان می‌تواند وقتی خروجی منتشر می‌کند یا شکست می‌خورد، نشست را بیدار کند.

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

`apply_patch` یک ابزار فرعی از `exec` برای ویرایش‌های ساختاریافته‌ی چندفایلی است.
برای مدل‌های OpenAI و OpenAI Codex به‌طور پیش‌فرض فعال است. فقط زمانی از پیکربندی استفاده کنید
که بخواهید آن را غیرفعال کنید یا به مدل‌های مشخص محدود کنید:

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
- سیاست ابزار همچنان اعمال می‌شود؛ `allow: ["write"]` به‌صورت ضمنی `apply_patch` را مجاز می‌کند.
- `deny: ["write"]`، `apply_patch` را منع نمی‌کند؛ `apply_patch` را صریحاً منع کنید یا وقتی نوشتن‌های patch نیز باید مسدود شوند از `deny: ["group:fs"]` استفاده کنید.
- پیکربندی زیر `tools.exec.applyPatch` قرار دارد.
- مقدار پیش‌فرض `tools.exec.applyPatch.enabled` برابر `true` است؛ برای غیرفعال‌کردن ابزار برای مدل‌های OpenAI آن را روی `false` تنظیم کنید.
- مقدار پیش‌فرض `tools.exec.applyPatch.workspaceOnly` برابر `true` است (محدود به workspace). فقط زمانی آن را روی `false` تنظیم کنید که عمداً می‌خواهید `apply_patch` بیرون از دایرکتوری workspace بنویسد/حذف کند.

## مرتبط

- [تأییدهای Exec](/fa/tools/exec-approvals) — دروازه‌های تأیید برای فرمان‌های shell
- [Sandboxing](/fa/gateway/sandboxing) — اجرای فرمان‌ها در محیط‌های sandbox‌شده
- [فرایند پس‌زمینه](/fa/gateway/background-process) — ابزار exec و process طولانی‌اجرا
- [امنیت](/fa/gateway/security) — سیاست ابزار و دسترسی ارتقایافته
