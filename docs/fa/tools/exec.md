---
read_when:
    - استفاده از ابزار exec یا اصلاح آن
    - اشکال‌زدایی رفتار stdin یا TTY
summary: استفاده از ابزار Exec، حالت‌های stdin، و پشتیبانی از TTY
title: ابزار اجرا
x-i18n:
    generated_at: "2026-05-02T22:26:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
    source_path: tools/exec.md
    workflow: 16
---

دستورهای shell را در فضای کاری اجرا کنید. از اجرای پیش‌زمینه + پس‌زمینه از طریق `process` پشتیبانی می‌کند.
اگر `process` مجاز نباشد، `exec` به‌صورت همگام اجرا می‌شود و `yieldMs`/`background` را نادیده می‌گیرد.
نشست‌های پس‌زمینه برای هر عامل محدوده‌بندی می‌شوند؛ `process` فقط نشست‌های همان عامل را می‌بیند.

## پارامترها

<ParamField path="command" type="string" required>
دستور Shell برای اجرا.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
پوشهٔ کاری برای دستور.
</ParamField>

<ParamField path="env" type="object">
بازنویسی‌های محیطی کلید/مقدار که روی محیط موروثی ادغام می‌شوند.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
پس از این تأخیر (میلی‌ثانیه)، دستور را به‌طور خودکار به پس‌زمینه ببرد.
</ParamField>

<ParamField path="background" type="boolean" default="false">
به‌جای انتظار برای `yieldMs`، دستور را بلافاصله به پس‌زمینه ببرد.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
مهلت exec پیکربندی‌شده را برای این فراخوانی بازنویسی می‌کند. `timeout: 0` را فقط وقتی تنظیم کنید که دستور باید بدون مهلت فرایند exec اجرا شود.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
در صورت در دسترس بودن، در یک شبه‌ترمینال اجرا کند. برای CLIهای فقط TTY، عامل‌های کدنویسی، و UIهای ترمینالی استفاده کنید.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
محل اجرا. وقتی زمان‌اجرای sandbox فعال باشد، `auto` به `sandbox` تبدیل می‌شود و در غیر این صورت به `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
حالت اعمال سیاست برای اجرای `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
رفتار اعلان تأیید برای اجرای `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
شناسه/نام Node وقتی `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
درخواست حالت ارتقایافته — خروج از sandbox به مسیر میزبان پیکربندی‌شده. `security=full` فقط وقتی اجباری می‌شود که elevated به `full` تبدیل شود.
</ParamField>

نکات:

- مقدار پیش‌فرض `host` برابر `auto` است: وقتی زمان‌اجرای sandbox برای نشست فعال باشد sandbox، وگرنه gateway.
- `host` فقط `auto`، `sandbox`، `gateway`، یا `node` را می‌پذیرد. این انتخاب‌گر نام میزبان نیست؛ مقدارهای شبیه نام میزبان پیش از اجرای دستور رد می‌شوند.
- `auto` راهبرد پیش‌فرض مسیریابی است، نه یک wildcard. `host=node` برای هر فراخوانی از `auto` مجاز است؛ `host=gateway` برای هر فراخوانی فقط وقتی مجاز است که هیچ زمان‌اجرای sandbox فعالی وجود نداشته باشد.
- بدون پیکربندی اضافی، `host=auto` همچنان «همین‌طور کار می‌کند»: نبود sandbox یعنی به `gateway` تبدیل می‌شود؛ sandbox زنده یعنی در sandbox می‌ماند.
- `elevated` از sandbox به مسیر میزبان پیکربندی‌شده خارج می‌شود: به‌طور پیش‌فرض `gateway`، یا وقتی `tools.exec.host=node` باشد (یا پیش‌فرض نشست `host=node` باشد) `node`. این قابلیت فقط وقتی در دسترس است که دسترسی ارتقایافته برای نشست/ارائه‌دهندهٔ فعلی فعال باشد.
- تأییدهای `gateway`/`node` با `~/.openclaw/exec-approvals.json` کنترل می‌شوند.
- `node` به یک Node جفت‌شده نیاز دارد (اپ همراه یا میزبان Node بدون رابط).
- اگر چند Node در دسترس باشد، برای انتخاب یکی `exec.node` یا `tools.exec.node` را تنظیم کنید.
- `exec host=node` تنها مسیر اجرای shell برای Nodeها است؛ پوشش قدیمی `nodes.run` حذف شده است.
- `timeout` برای اجرای پیش‌زمینه، پس‌زمینه، `yieldMs`، gateway، sandbox، و `system.run` در Node اعمال می‌شود. اگر حذف شود، OpenClaw از `tools.exec.timeoutSec` استفاده می‌کند؛ `timeout: 0` صریح، مهلت فرایند exec را برای آن فراخوانی غیرفعال می‌کند.
- روی میزبان‌های غیر Windows، exec وقتی `SHELL` تنظیم شده باشد از آن استفاده می‌کند؛ اگر `SHELL` برابر `fish` باشد، برای پرهیز از اسکریپت‌های ناسازگار با fish، `bash` (یا `sh`)
  را از `PATH` ترجیح می‌دهد، سپس اگر هیچ‌کدام وجود نداشته باشند به `SHELL` برمی‌گردد.
- روی میزبان‌های Windows، exec کشف PowerShell 7 (`pwsh`) را ترجیح می‌دهد (Program Files، سپس ProgramW6432، سپس PATH)،
  سپس به Windows PowerShell 5.1 برمی‌گردد.
- اجرای میزبان (`gateway`/`node`) برای جلوگیری از ربایش باینری یا تزریق کد، `env.PATH` و بازنویسی‌های loader (`LD_*`/`DYLD_*`) را رد می‌کند.
- OpenClaw در محیط دستور ساخته‌شده (از جمله اجرای PTY و sandbox) `OPENCLAW_SHELL=exec` را تنظیم می‌کند تا قواعد shell/profile بتوانند زمینهٔ ابزار exec را تشخیص دهند.
- `openclaw channels login` از `exec` مسدود است، چون یک جریان تعاملی احراز هویت کانال است؛ آن را در ترمینالی روی میزبان gateway اجرا کنید، یا وقتی وجود دارد از ابزار ورود بومی کانال از چت استفاده کنید.
- مهم: sandboxing به‌طور پیش‌فرض **خاموش است**. اگر sandboxing خاموش باشد، `host=auto` ضمنی
  به `gateway` تبدیل می‌شود. `host=sandbox` صریح همچنان به‌صورت بسته شکست می‌خورد، نه اینکه بی‌صدا
  روی میزبان gateway اجرا شود. sandboxing را فعال کنید یا از `host=gateway` همراه با تأییدها استفاده کنید.
- بررسی‌های پیش‌اجرای اسکریپت (برای اشتباهات رایج نحو shell در Python/Node) فقط فایل‌های داخل مرز
  مؤثر `workdir` را بررسی می‌کنند. اگر مسیر اسکریپت به خارج از `workdir` برسد، پیش‌اجرا برای
  آن فایل رد می‌شود.
- برای کارهای طولانی‌مدتی که اکنون شروع می‌شوند، آن را یک‌بار شروع کنید و وقتی فعال است و دستور خروجی می‌دهد یا شکست می‌خورد، به بیدارباش تکمیل خودکار تکیه کنید.
  از `process` برای گزارش‌ها، وضعیت، ورودی، یا مداخله استفاده کنید؛ زمان‌بندی را با حلقه‌های sleep، حلقه‌های timeout، یا polling تکراری شبیه‌سازی نکنید.
- برای کاری که باید بعداً یا طبق زمان‌بندی انجام شود، به‌جای الگوهای sleep/delay با `exec` از cron استفاده کنید.

## پیکربندی

- `tools.exec.notifyOnExit` (پیش‌فرض: true): وقتی true باشد، نشست‌های exec پس‌زمینه‌شده هنگام خروج یک رویداد سیستم در صف می‌گذارند و درخواست Heartbeat می‌کنند.
- `tools.exec.approvalRunningNoticeMs` (پیش‌فرض: 10000): وقتی exec دارای مانع تأیید بیشتر از این مقدار طول بکشد، یک اعلان واحد «در حال اجرا» صادر می‌کند (0 غیرفعال می‌کند).
- `tools.exec.timeoutSec` (پیش‌فرض: 1800): مهلت پیش‌فرض exec برای هر دستور، بر حسب ثانیه. `timeout` در هر فراخوانی آن را بازنویسی می‌کند؛ `timeout: 0` در هر فراخوانی مهلت فرایند exec را غیرفعال می‌کند.
- `tools.exec.host` (پیش‌فرض: `auto`؛ وقتی زمان‌اجرای sandbox فعال باشد به `sandbox` وگرنه به `gateway` تبدیل می‌شود)
- `tools.exec.security` (پیش‌فرض: `deny` برای sandbox، و وقتی تنظیم نشده باشد `full` برای gateway + node)
- `tools.exec.ask` (پیش‌فرض: `off`)
- اجرای میزبان بدون تأیید، پیش‌فرض gateway + node است. اگر رفتار تأیید/allowlist می‌خواهید، هم `tools.exec.*` و هم `~/.openclaw/exec-approvals.json` میزبان را سخت‌گیرانه‌تر کنید؛ [تأییدهای Exec](/fa/tools/exec-approvals#yolo-mode-no-approval) را ببینید.
- YOLO از پیش‌فرض‌های سیاست میزبان (`security=full`، `ask=off`) می‌آید، نه از `host=auto`. اگر می‌خواهید مسیریابی gateway یا node را اجباری کنید، `tools.exec.host` را تنظیم کنید یا از `/exec host=...` استفاده کنید.
- در حالت `security=full` به‌همراه `ask=off`، exec میزبان مستقیماً از سیاست پیکربندی‌شده پیروی می‌کند؛ هیچ لایهٔ اضافی پیش‌فیلتر ابتکاری مبهم‌سازی دستور یا رد پیش‌اجرای اسکریپت وجود ندارد.
- `tools.exec.node` (پیش‌فرض: تنظیم‌نشده)
- `tools.exec.strictInlineEval` (پیش‌فرض: false): وقتی true باشد، شکل‌های eval درون‌خطی مفسر مانند `python -c`، `node -e`، `ruby -e`، `perl -e`، `php -r`، `lua -e`، و `osascript -e` همیشه به تأیید صریح نیاز دارند. `allow-always` همچنان می‌تواند فراخوانی‌های بی‌خطر مفسر/اسکریپت را پایدار کند، اما شکل‌های inline-eval همچنان هر بار اعلان می‌دهند.
- `tools.exec.pathPrepend`: فهرست پوشه‌هایی برای افزودن به ابتدای `PATH` در اجراهای exec (فقط gateway + sandbox).
- `tools.exec.safeBins`: باینری‌های امن فقط stdin که می‌توانند بدون ورودی‌های صریح allowlist اجرا شوند. برای جزئیات رفتار، [باینری‌های امن](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) را ببینید.
- `tools.exec.safeBinTrustedDirs`: پوشه‌های صریح اضافی که برای بررسی‌های مسیر `safeBins` مورد اعتمادند. ورودی‌های `PATH` هرگز به‌طور خودکار مورد اعتماد قرار نمی‌گیرند. پیش‌فرض‌های داخلی `/bin` و `/usr/bin` هستند.
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

- `host=gateway`: `PATH` مربوط به login-shell شما را در محیط exec ادغام می‌کند. بازنویسی‌های `env.PATH` برای اجرای میزبان
  رد می‌شوند. خود daemon همچنان با یک `PATH` حداقلی اجرا می‌شود:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: داخل container، `sh -lc` (login shell) را اجرا می‌کند، بنابراین `/etc/profile` ممکن است `PATH` را بازنشانی کند.
  OpenClaw پس از بارگذاری profile، `env.PATH` را از طریق یک متغیر env داخلی به ابتدا اضافه می‌کند (بدون درون‌یابی shell)؛
  `tools.exec.pathPrepend` اینجا هم اعمال می‌شود.
- `host=node`: فقط بازنویسی‌های env مسدودنشده‌ای که ارسال می‌کنید به Node فرستاده می‌شوند. بازنویسی‌های `env.PATH` برای اجرای میزبان
  رد می‌شوند و توسط میزبان‌های Node نادیده گرفته می‌شوند. اگر روی یک Node به ورودی‌های PATH اضافی نیاز دارید،
  محیط سرویس میزبان Node را پیکربندی کنید (systemd/launchd) یا ابزارها را در مکان‌های استاندارد نصب کنید.

اتصال Node برای هر عامل (از نمایهٔ فهرست عامل در پیکربندی استفاده کنید):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI کنترل: برگهٔ Nodes یک پنل کوچک «اتصال Node برای Exec» برای همان تنظیمات دارد.

## بازنویسی‌های نشست (`/exec`)

از `/exec` برای تنظیم پیش‌فرض‌های **هر نشست** برای `host`، `security`، `ask`، و `node` استفاده کنید.
برای نمایش مقدارهای فعلی، `/exec` را بدون آرگومان بفرستید.

مثال:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## مدل مجوزدهی

`/exec` فقط برای **فرستنده‌های مجاز** رعایت می‌شود (allowlistهای کانال/جفت‌سازی به‌همراه `commands.useAccessGroups`).
این فقط **وضعیت نشست** را به‌روزرسانی می‌کند و پیکربندی را نمی‌نویسد. برای غیرفعال‌سازی سخت exec، آن را از طریق سیاست ابزار
(`tools.deny: ["exec"]` یا برای هر عامل) deny کنید. تأییدهای میزبان همچنان اعمال می‌شوند مگر اینکه صریحاً
`security=full` و `ask=off` را تنظیم کنید.

## تأییدهای Exec (اپ همراه / میزبان Node)

عامل‌های sandbox‌شده می‌توانند پیش از اجرای `exec` روی میزبان gateway یا Node، برای هر درخواست تأیید لازم داشته باشند.
برای سیاست، allowlist، و جریان UI، [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

وقتی تأییدها لازم باشند، ابزار exec بلافاصله با
`status: "approval-pending"` و یک شناسهٔ تأیید برمی‌گردد. پس از تأیید (یا رد / پایان مهلت)،
Gateway رویدادهای سیستم (`Exec finished` / `Exec denied`) را صادر می‌کند. اگر دستور پس از `tools.exec.approvalRunningNoticeMs` هنوز
در حال اجرا باشد، یک اعلان واحد `Exec running` صادر می‌شود.
در کانال‌هایی با کارت‌ها/دکمه‌های تأیید بومی، عامل باید ابتدا به همان UI بومی تکیه کند و فقط وقتی نتیجهٔ ابزار صریحاً می‌گوید تأییدهای چت در دسترس نیستند یا تأیید دستی تنها مسیر است، یک دستور دستی `/approve` درج کند.

## Allowlist + باینری‌های امن

اعمال allowlist دستی با globهای مسیر باینری resolveشده و globهای نام دستور خام
مطابقت می‌دهد. نام‌های خام فقط با دستورهایی که از طریق PATH فراخوانی شده‌اند مطابقت دارند، بنابراین `rg` می‌تواند با
`/opt/homebrew/bin/rg` مطابقت داشته باشد وقتی دستور `rg` است، اما نه با `./rg` یا `/tmp/rg`.
وقتی `security=allowlist` باشد، دستورهای shell فقط در صورتی به‌طور خودکار مجاز می‌شوند که هر segment در pipeline
در allowlist باشد یا یک باینری امن باشد. زنجیره‌سازی (`;`، `&&`، `||`) و redirectionها
در حالت allowlist رد می‌شوند مگر اینکه هر segment سطح بالایی allowlist را
برآورده کند (از جمله باینری‌های امن). Redirectionها همچنان پشتیبانی نمی‌شوند.
اعتماد پایدار `allow-always` از این قاعده عبور نمی‌کند: یک دستور زنجیره‌شده همچنان نیاز دارد که هر
segment سطح بالا مطابقت داشته باشد.

`autoAllowSkills` یک مسیر راحتی جداگانه در تأییدهای exec است. این با ورودی‌های
allowlist مسیر دستی یکسان نیست. برای اعتماد صریح سخت‌گیرانه، `autoAllowSkills` را غیرفعال نگه دارید.

از دو کنترل برای کارهای متفاوت استفاده کنید:

- `tools.exec.safeBins`: فیلترهای جریان کوچک و فقط stdin.
- `tools.exec.safeBinTrustedDirs`: پوشه‌های مورد اعتماد اضافی صریح برای مسیرهای اجرایی باینری امن.
- `tools.exec.safeBinProfiles`: سیاست argv صریح برای باینری‌های امن سفارشی.
- allowlist: اعتماد صریح برای مسیرهای اجرایی.

`safeBins` را به‌عنوان یک allowlist عمومی در نظر نگیرید، و باینری‌های interpreter/runtime را اضافه نکنید (برای مثال `python3`، `node`، `ruby`، `bash`). اگر به آن‌ها نیاز دارید، از ورودی‌های allowlist صریح استفاده کنید و اعلان‌های تایید را فعال نگه دارید.
`openclaw security audit` زمانی هشدار می‌دهد که ورودی‌های interpreter/runtime در `safeBins` پروفایل‌های صریح نداشته باشند، و `openclaw doctor --fix` می‌تواند ورودی‌های سفارشیِ جاافتاده در `safeBinProfiles` را scaffold کند.
`openclaw security audit` و `openclaw doctor` همچنین وقتی هشدار می‌دهند که binهای دارای رفتار گسترده مانند `jq` را به‌طور صریح دوباره به `safeBins` اضافه کنید.
اگر interpreterها را به‌طور صریح allowlist می‌کنید، `tools.exec.strictInlineEval` را فعال کنید تا فرم‌های inline code-eval همچنان به تایید تازه نیاز داشته باشند.

برای جزئیات کامل policy و نمونه‌ها، [تاییدهای Exec](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) و [Safe bins در برابر allowlist](/fa/tools/exec-approvals-advanced#safe-bins-versus-allowlist) را ببینید.

## نمونه‌ها

پیش‌زمینه:

```json
{ "tool": "exec", "command": "ls -la" }
```

پس‌زمینه + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling برای وضعیت درخواستی است، نه حلقه‌های انتظار. اگر بیدارسازی تکمیل خودکار
فعال باشد، دستور می‌تواند وقتی خروجی تولید می‌کند یا شکست می‌خورد session را بیدار کند.

ارسال کلیدها (به سبک tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (فقط ارسال CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Paste (به‌طور پیش‌فرض bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` یک subtool از `exec` برای ویرایش‌های چندفایلی ساختاریافته است.
برای مدل‌های OpenAI و OpenAI Codex به‌طور پیش‌فرض فعال است. فقط زمانی از config استفاده کنید
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
- policy ابزار همچنان اعمال می‌شود؛ `allow: ["write"]` به‌طور ضمنی `apply_patch` را مجاز می‌کند.
- Config زیر `tools.exec.applyPatch` قرار دارد.
- مقدار پیش‌فرض `tools.exec.applyPatch.enabled` برابر `true` است؛ برای غیرفعال کردن ابزار برای مدل‌های OpenAI آن را روی `false` تنظیم کنید.
- مقدار پیش‌فرض `tools.exec.applyPatch.workspaceOnly` برابر `true` است (محدود به workspace). فقط اگر عمدا می‌خواهید `apply_patch` بیرون از دایرکتوری workspace بنویسد/حذف کند، آن را روی `false` تنظیم کنید.

## مرتبط

- [تاییدهای Exec](/fa/tools/exec-approvals) — gateهای تایید برای دستورهای shell
- [Sandboxing](/fa/gateway/sandboxing) — اجرای دستورها در محیط‌های sandboxed
- [فرایند پس‌زمینه](/fa/gateway/background-process) — ابزار exec و process طولانی‌مدت
- [امنیت](/fa/gateway/security) — policy ابزار و دسترسی elevated
