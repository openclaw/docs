---
read_when:
    - استفاده یا تغییر ابزار exec
    - اشکال‌زدایی رفتار stdin یا TTY
summary: استفاده از ابزار exec، حالت‌های stdin، و پشتیبانی از TTY
title: ابزار اجرا
x-i18n:
    generated_at: "2026-06-27T18:58:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

دستورهای shell را در فضای کاری اجرا کنید. `exec` یک سطح shell تغییردهنده است: دستورها می‌توانند هرجا که میزبان انتخاب‌شده یا فایل‌سیستم sandbox اجازه دهد، فایل ایجاد، ویرایش یا حذف کنند. غیرفعال کردن ابزارهای فایل‌سیستم OpenClaw مانند `write`، `edit`، یا `apply_patch` باعث نمی‌شود `exec` فقط‌خواندنی شود.

از اجرای پیش‌زمینه + پس‌زمینه از طریق `process` پشتیبانی می‌کند. اگر `process` مجاز نباشد، `exec` به‌صورت همگام اجرا می‌شود و `yieldMs`/`background` را نادیده می‌گیرد.
نشست‌های پس‌زمینه برای هر agent محدودسازی می‌شوند؛ `process` فقط نشست‌های همان agent را می‌بیند.

## پارامترها

<ParamField path="command" type="string" required>
دستور shell برای اجرا.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
دایرکتوری کاری برای دستور.
</ParamField>

<ParamField path="env" type="object">
بازنویسی‌های محیطی کلید/مقدار که روی محیط به‌ارث‌رسیده ادغام می‌شوند.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
پس از این تاخیر (میلی‌ثانیه)، دستور را خودکار به پس‌زمینه ببرید.
</ParamField>

<ParamField path="background" type="boolean" default="false">
به‌جای انتظار برای `yieldMs`، دستور را بلافاصله به پس‌زمینه ببرید.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
زمان‌پایان پیکربندی‌شده `exec` را برای این فراخوانی بازنویسی کنید. فقط وقتی دستور باید بدون زمان‌پایان فرایند `exec` اجرا شود، `timeout: 0` را تنظیم کنید.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
در صورت وجود، در یک شبه‌ترمینال اجرا کنید. برای CLIهای فقط TTY، agentهای کدنویسی، و رابط‌های کاربری ترمینالی استفاده کنید.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
محل اجرا. وقتی یک runtime مربوط به sandbox فعال باشد، `auto` به `sandbox` و در غیر این صورت به `gateway` resolve می‌شود.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
برای فراخوانی‌های معمول ابزار نادیده گرفته می‌شود. امنیت `gateway` / `node` توسط
`tools.exec.security` و فایل تاییدهای میزبان کنترل می‌شود؛ حالت elevated فقط وقتی operator صراحتا دسترسی elevated بدهد می‌تواند
`security=full` را اجباری کند.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
حالت پایه پرسش از `tools.exec.ask` و تاییدهای میزبان می‌آید.
برای فراخوانی‌های مدل با مبدا channel، وقتی ask موثر میزبان `off` باشد، `ask` هر فراخوانی نادیده گرفته می‌شود؛ در غیر این صورت فقط می‌تواند به حالتی سخت‌گیرانه‌تر
سخت‌تر شود. فراخواننده‌های داخلی/API مورداعتماد که ابزارهای exec را با مقدار صریح `ask` می‌سازند، بدون تغییر می‌مانند.
</ParamField>

<ParamField path="node" type="string">
شناسه/نام Node وقتی `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
درخواست حالت elevated — خروج از sandbox به مسیر میزبان پیکربندی‌شده. `security=full` فقط وقتی elevated به `full` resolve شود اجباری می‌شود.
</ParamField>

یادداشت‌ها:

- مقدار پیش‌فرض `host` برابر `auto` است: وقتی runtime مربوط به sandbox برای نشست فعال باشد sandbox، و در غیر این صورت Gateway.
- `host` فقط `auto`، `sandbox`، `gateway`، یا `node` را می‌پذیرد. این یک انتخابگر hostname نیست؛ مقدارهای شبیه hostname پیش از اجرای دستور رد می‌شوند.
- `auto` راهبرد مسیریابی پیش‌فرض است، نه wildcard. `host=node` در هر فراخوانی از `auto` مجاز است؛ `host=gateway` در هر فراخوانی فقط وقتی مجاز است که هیچ runtime مربوط به sandbox فعال نباشد.
- `tools.exec.mode` knob سیاست نرمال‌شده است. مقدارها `deny`، `allowlist`، `ask`، `auto`، و `full` هستند. `auto` تطبیق‌های قطعی allowlist/safe-bin را مستقیم اجرا می‌کند و هر مورد تایید باقی‌مانده exec را پیش از پرسیدن از انسان، از طریق auto reviewer بومی OpenClaw مسیریابی می‌کند. `ask` / `ask=always` همچنان هر بار از انسان می‌پرسد.
- بدون پیکربندی اضافه، `host=auto` همچنان «فقط کار می‌کند»: نبود sandbox یعنی به `gateway` resolve می‌شود؛ sandbox زنده یعنی داخل sandbox می‌ماند.
- `elevated` از sandbox به مسیر میزبان پیکربندی‌شده خارج می‌شود: به‌صورت پیش‌فرض `gateway`، یا وقتی `tools.exec.host=node` باشد (یا پیش‌فرض نشست `host=node` باشد) `node`. فقط وقتی دسترسی elevated برای نشست/ارائه‌دهنده فعلی فعال باشد در دسترس است.
- تاییدهای `gateway`/`node` توسط فایل تاییدهای میزبان کنترل می‌شوند.
- `node` به یک node جفت‌شده نیاز دارد (اپ همراه یا میزبان node بدون رابط).
- اگر چند node در دسترس باشد، برای انتخاب یکی `exec.node` یا `tools.exec.node` را تنظیم کنید.
- `exec host=node` تنها مسیر اجرای shell برای nodeها است؛ wrapper قدیمی `nodes.run` حذف شده است.
- `timeout` برای اجرای پیش‌زمینه، پس‌زمینه، `yieldMs`، Gateway، sandbox، و اجرای `system.run` در node اعمال می‌شود. اگر حذف شود، OpenClaw از `tools.exec.timeoutSec` استفاده می‌کند؛ `timeout: 0` صریح، زمان‌پایان فرایند exec را برای آن فراخوانی غیرفعال می‌کند.
- روی میزبان‌های غیر Windows، exec وقتی `SHELL` تنظیم باشد از آن استفاده می‌کند؛ اگر `SHELL` برابر `fish` باشد، برای جلوگیری از scriptهای ناسازگار با fish، `bash` (یا `sh`)
  را از `PATH` ترجیح می‌دهد، سپس اگر هیچ‌کدام وجود نداشت به `SHELL` fallback می‌کند.
- روی میزبان‌های Windows، exec کشف PowerShell 7 (`pwsh`) را ترجیح می‌دهد (Program Files، ProgramW6432، سپس PATH)،
  سپس به Windows PowerShell 5.1 fallback می‌کند.
- روی میزبان‌های Gateway غیر Windows، دستورهای exec مربوط به bash و zsh از یک snapshot راه‌اندازی استفاده می‌کنند. OpenClaw alias/functionهای قابل source شدن
  و یک مجموعه محیطی کوچک و امن را از فایل‌های راه‌اندازی shell در
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` ثبت می‌کند، سپس پیش از هر دستور exec آن snapshot را source می‌کند.
  متغیرهایی که شبیه secret هستند حذف می‌شوند؛ exec در sandbox و node از این snapshot استفاده نمی‌کند. برای غیرفعال کردن این مسیر snapshot،
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` را در محیط فرایند Gateway تنظیم کنید.
- اجرای میزبان (`gateway`/`node`) برای جلوگیری از binary hijacking یا کد تزریق‌شده،
  `env.PATH` و بازنویسی‌های loader (`LD_*`/`DYLD_*`) را رد می‌کند.
- OpenClaw در محیط دستور spawn شده (شامل اجرای PTY و sandbox) `OPENCLAW_SHELL=exec` را تنظیم می‌کند تا قواعد shell/profile بتوانند زمینه ابزار exec را تشخیص دهند.
- برای اجراهای با مبدا channel، وقتی channel آن شناسه‌ها را فراهم کرده باشد، OpenClaw همچنین payload محدود JSON هویت فرستنده/chat را در
  `OPENCLAW_CHANNEL_CONTEXT` در دسترس می‌گذارد.
- `openclaw channels login` از `exec` مسدود شده است چون یک جریان تعاملی auth مربوط به channel است؛ آن را در یک ترمینال روی میزبان gateway اجرا کنید، یا وقتی ابزار ورود بومی channel وجود دارد، از همان ابزار در chat استفاده کنید.
- مهم: sandboxing به‌صورت **پیش‌فرض خاموش** است. اگر sandboxing خاموش باشد، `host=auto` ضمنی
  به `gateway` resolve می‌شود. `host=sandbox` صریح همچنان fail closed می‌شود، نه اینکه بی‌صدا
  روی میزبان gateway اجرا شود. sandboxing را فعال کنید یا از `host=gateway` همراه با تاییدها استفاده کنید.
- بررسی‌های preflight مربوط به script (برای اشتباهات رایج syntax مربوط به shell در Python/Node) فقط فایل‌های داخل مرز
  موثر `workdir` را بررسی می‌کنند. اگر مسیر script بیرون از `workdir` resolve شود، preflight برای
  آن فایل رد می‌شود.
- برای کارهای طولانی‌مدتی که اکنون شروع می‌شوند، آن را یک بار شروع کنید و وقتی فعال است و دستور خروجی تولید کند یا شکست بخورد، به wake خودکار
  تکمیل تکیه کنید.
  از `process` برای logها، وضعیت، ورودی، یا مداخله استفاده کنید؛ scheduling را با حلقه‌های sleep، حلقه‌های timeout، یا polling تکراری شبیه‌سازی نکنید.
- برای کاری که باید بعدا یا طبق زمان‌بندی انجام شود، به‌جای الگوهای sleep/delay در `exec` از Cron استفاده کنید.

## پیکربندی

- `tools.exec.notifyOnExit` (پیش‌فرض: true): وقتی true باشد، نشست‌های exec پس‌زمینه‌شده هنگام خروج یک رویداد سیستم را در صف می‌گذارند و یک Heartbeat درخواست می‌کنند.
- `tools.exec.approvalRunningNoticeMs` (پیش‌فرض: 10000): وقتی یک exec وابسته به تایید بیش از این مدت اجرا شود، یک اعلان «در حال اجرا» منفرد منتشر کنید (0 غیرفعال می‌کند).
- `tools.exec.timeoutSec` (پیش‌فرض: 1800): زمان‌پایان پیش‌فرض exec برای هر دستور بر حسب ثانیه. `timeout` هر فراخوانی آن را بازنویسی می‌کند؛ `timeout: 0` هر فراخوانی، زمان‌پایان فرایند exec را غیرفعال می‌کند.
- `tools.exec.host` (پیش‌فرض: `auto`؛ وقتی runtime مربوط به sandbox فعال باشد به `sandbox` و در غیر این صورت به `gateway` resolve می‌شود)
- `tools.exec.security` (پیش‌فرض: `deny` برای sandbox، و وقتی تنظیم نشده باشد `full` برای gateway + node)
- `tools.exec.ask` (پیش‌فرض: `off`)
- exec میزبان بدون تایید، پیش‌فرض برای gateway + node است. اگر رفتار تایید/allowlist می‌خواهید، هم `tools.exec.*` و هم فایل تاییدهای میزبان را سخت‌گیرانه‌تر کنید؛ [تاییدهای Exec](/fa/tools/exec-approvals#yolo-mode-no-approval) را ببینید.
- YOLO از پیش‌فرض‌های سیاست میزبان می‌آید (`security=full`، `ask=off`)، نه از `host=auto`. اگر می‌خواهید مسیریابی gateway یا node را اجباری کنید، `tools.exec.host` را تنظیم کنید یا از `/exec host=...` استفاده کنید.
- در حالت `security=full` به‌همراه `ask=off`، exec میزبان مستقیما از سیاست پیکربندی‌شده پیروی می‌کند؛ هیچ prefilter ابهام‌زدایی دستور یا لایه رد script-preflight اکتشافی اضافه‌ای وجود ندارد.
- `tools.exec.node` (پیش‌فرض: تنظیم‌نشده)
- `tools.exec.strictInlineEval` (پیش‌فرض: false): وقتی true باشد، فرم‌های eval درون‌خطی interpreter مانند `python -c`، `node -e`، `ruby -e`، `perl -e`، `php -r`، `lua -e`، و `osascript -e` به reviewer یا تایید صریح نیاز دارند. در `mode=auto`، مسیر عادی تایید exec ممکن است اجازه دهد auto reviewer بومی یک دستور یک‌باره و آشکارا کم‌ریسک را تایید کند؛ فراخوانی‌های مستقیم `system.run` روی میزبان node همچنان به تایید صریح نیاز دارند، چون نمی‌توانند دستور را به مسیر تایید انسانی بدهند. اگر reviewer درخواست کند، درخواست به انسان می‌رود. `allow-always` همچنان می‌تواند فراخوانی‌های benign interpreter/script را پایدار کند، اما فرم‌های inline-eval به قواعد مجاز بادوام تبدیل نمی‌شوند.
- `tools.exec.commandHighlighting` (پیش‌فرض: false): وقتی true باشد، promptهای تایید می‌توانند spanهای دستور استخراج‌شده توسط parser را در متن دستور برجسته کنند. برای فعال کردن برجسته‌سازی متن دستور بدون تغییر سیاست تایید exec، آن را به‌صورت سراسری یا برای هر agent روی `true` تنظیم کنید.
- `tools.exec.pathPrepend`: فهرست دایرکتوری‌هایی که برای اجراهای exec به ابتدای `PATH` افزوده می‌شوند (فقط gateway + sandbox).
- `tools.exec.safeBins`: binaryهای امن فقط stdin که می‌توانند بدون entryهای allowlist صریح اجرا شوند. برای جزئیات رفتار، [binaryهای امن](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) را ببینید.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های صریح اضافی که برای بررسی‌های مسیر `safeBins` مورداعتماد هستند. entryهای `PATH` هرگز خودکار trusted نمی‌شوند. پیش‌فرض‌های داخلی `/bin` و `/usr/bin` هستند.
- `tools.exec.safeBinProfiles`: سیاست argv سفارشی اختیاری برای هر safe bin (`minPositional`، `maxPositional`، `allowedValueFlags`، `deniedFlags`).

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

- `host=gateway`: `PATH` مربوط به login-shell شما را در محیط exec ادغام می‌کند. بازنویسی‌های `env.PATH` برای اجرای میزبان
  رد می‌شوند. خود daemon همچنان با یک `PATH` حداقلی اجرا می‌شود:
  - macOS: `/opt/homebrew/bin`، `/usr/local/bin`، `/usr/bin`، `/bin`
  - Linux: `/usr/local/bin`، `/usr/bin`، `/bin`
    - برای جلوگیری از اینکه پیکربندی shell کاربر (مانند `~/.zshenv` یا `/etc/zshenv`) مسیرهای اولویت‌دار را هنگام راه‌اندازی بازنویسی کند، entryهای `tools.exec.pathPrepend` درست پیش از اجرا، به‌صورت امن به ابتدای `PATH` نهایی داخل دستور shell افزوده می‌شوند.
- `host=sandbox`: داخل container با `sh -lc` (login shell) اجرا می‌شود، بنابراین `/etc/profile` ممکن است `PATH` را reset کند.
  OpenClaw پس از source شدن profile، `env.PATH` را از طریق یک env var داخلی (بدون shell interpolation) به ابتدا اضافه می‌کند؛
  `tools.exec.pathPrepend` اینجا هم اعمال می‌شود.
- `host=node`: فقط بازنویسی‌های env غیرمسدودی که می‌فرستید به node ارسال می‌شوند. بازنویسی‌های `env.PATH`
  برای اجرای میزبان رد می‌شوند و توسط میزبان‌های node نادیده گرفته می‌شوند. اگر روی یک node به entryهای اضافی PATH نیاز دارید،
  محیط سرویس میزبان node (systemd/launchd) را پیکربندی کنید یا ابزارها را در مکان‌های استاندارد نصب کنید.

اتصال node برای هر agent (از index فهرست agent در config استفاده کنید):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

رابط کاربری کنترل: زبانه Nodes یک panel کوچک «اتصال node مربوط به Exec» برای همین تنظیمات دارد.

## بازنویسی‌های نشست (`/exec`)

از `/exec` برای تنظیم پیش‌فرض‌های **هر نشست** برای `host`، `security`، `ask`، و `node` استفاده کنید.
برای نمایش مقدارهای فعلی، `/exec` را بدون آرگومان بفرستید.

نمونه:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## مدل مجوزدهی

`/exec` فقط برای **فرستندگان مجاز** رعایت می‌شود (فهرست‌های مجاز/جفت‌سازی کانال به‌علاوه `commands.useAccessGroups`).
این دستور فقط **وضعیت نشست** را به‌روزرسانی می‌کند و config نمی‌نویسد. فرستندگان مجاز کانال خارجی می‌توانند
این پیش‌فرض‌های نشست را تنظیم کنند. کلاینت‌های داخلی gateway/webchat برای ماندگار کردن آن‌ها به `operator.admin` نیاز دارند.
برای غیرفعال‌سازی سخت exec، آن را از طریق خط‌مشی ابزار رد کنید (`tools.deny: ["exec"]` یا برای هر agent). تأییدهای میزبان
همچنان اعمال می‌شوند مگر اینکه صراحتاً `security=full` و `ask=off` را تنظیم کنید.

## تأییدهای exec (برنامه همراه / میزبان Node)

agentهای sandbox‌شده می‌توانند قبل از اجرای `exec` روی Gateway یا میزبان Node، برای هر درخواست به تأیید نیاز داشته باشند.
برای خط‌مشی، فهرست مجاز، و جریان UI، [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

وقتی تأییدها لازم باشند، ابزار exec بلافاصله با
`status: "approval-pending"` و یک شناسه تأیید برمی‌گردد. پس از تأیید (یا رد / پایان مهلت)،
Gateway فقط برای اجراهای تأییدشده رویدادهای سیستمی پیشرفت و تکمیل فرمان را منتشر می‌کند
(`Exec running` / `Exec finished`). تأییدهای ردشده یا پایان‌مهلت‌خورده نهایی هستند و
نشست agent را با رویداد سیستمی رد بیدار نمی‌کنند.
در کانال‌هایی با کارت‌ها/دکمه‌های تأیید بومی، agent باید ابتدا به همان
UI بومی تکیه کند و فقط زمانی فرمان دستی `/approve` را اضافه کند که نتیجه ابزار
صراحتاً بگوید تأییدهای chat در دسترس نیستند یا تأیید دستی تنها مسیر است.

## فهرست مجاز + باینری‌های امن

اعمال فهرست مجاز دستی با globهای مسیر باینری resolve‌شده و globهای نام فرمان ساده مطابقت می‌دهد.
نام‌های ساده فقط با فرمان‌هایی که از طریق PATH فراخوانی می‌شوند مطابقت دارند، بنابراین `rg` می‌تواند با
`/opt/homebrew/bin/rg` وقتی فرمان `rg` است مطابقت داشته باشد، اما با `./rg` یا `/tmp/rg` نه.
وقتی `security=allowlist` باشد، فرمان‌های shell فقط در صورتی به‌صورت خودکار مجاز می‌شوند که هر بخش pipeline
در فهرست مجاز باشد یا یک باینری امن باشد. زنجیره‌سازی (`;`، `&&`، `||`) و redirectionها
در حالت فهرست مجاز رد می‌شوند مگر اینکه هر بخش سطح‌بالا، فهرست مجاز
(از جمله باینری‌های امن) را برآورده کند. Redirectionها همچنان پشتیبانی نمی‌شوند.
اعتماد پایدار `allow-always` این قاعده را دور نمی‌زند: یک فرمان زنجیره‌ای همچنان نیاز دارد هر
بخش سطح‌بالا مطابقت داشته باشد.

`autoAllowSkills` یک مسیر راحتی جداگانه در تأییدهای exec است. این همان
ورودی‌های فهرست مجاز مسیر دستی نیست. برای اعتماد صریح سخت‌گیرانه، `autoAllowSkills` را غیرفعال نگه دارید.

از این دو کنترل برای کارهای متفاوت استفاده کنید:

- `tools.exec.safeBins`: فیلترهای stream کوچک و فقط stdin.
- `tools.exec.safeBinTrustedDirs`: دایرکتوری‌های قابل‌اعتماد اضافی صریح برای مسیرهای executable باینری امن.
- `tools.exec.safeBinProfiles`: خط‌مشی argv صریح برای باینری‌های امن سفارشی.
- فهرست مجاز: اعتماد صریح برای مسیرهای executable.

با `safeBins` مثل یک فهرست مجاز عمومی رفتار نکنید، و باینری‌های interpreter/runtime (برای مثال `python3`، `node`، `ruby`، `bash`) را اضافه نکنید. اگر به آن‌ها نیاز دارید، از ورودی‌های فهرست مجاز صریح استفاده کنید و promptهای تأیید را فعال نگه دارید.
`openclaw security audit` وقتی ورودی‌های interpreter/runtime در `safeBins` فاقد profileهای صریح باشند هشدار می‌دهد، و `openclaw doctor --fix` می‌تواند ورودی‌های سفارشی گمشده `safeBinProfiles` را scaffold کند.
`openclaw security audit` و `openclaw doctor` همچنین وقتی باینری‌های دارای رفتار گسترده مانند `jq` را صراحتاً دوباره به `safeBins` اضافه کنید هشدار می‌دهند.
اگر interpreterها را صراحتاً در فهرست مجاز قرار می‌دهید، `tools.exec.strictInlineEval` را فعال کنید تا شکل‌های inline code-eval همچنان به بازبین یا تأیید صریح نیاز داشته باشند.

برای جزئیات کامل خط‌مشی و مثال‌ها، [تأییدهای exec](/fa/tools/exec-approvals-advanced#safe-bins-stdin-only) و [باینری‌های امن در برابر فهرست مجاز](/fa/tools/exec-approvals-advanced#safe-bins-versus-allowlist) را ببینید.

## مثال‌ها

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling برای وضعیت درخواستی است، نه حلقه‌های انتظار. اگر بیدارباش تکمیل خودکار
فعال باشد، فرمان می‌تواند وقتی خروجی منتشر می‌کند یا شکست می‌خورد نشست را بیدار کند.

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

Paste (به‌صورت پیش‌فرض bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` یک subtool از `exec` برای ویرایش‌های ساختاریافته چندفایلی است.
این ابزار به‌صورت پیش‌فرض برای مدل‌های OpenAI و OpenAI Codex فعال است. فقط زمانی از config استفاده کنید
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
- خط‌مشی ابزار همچنان اعمال می‌شود؛ `allow: ["write"]` به‌صورت ضمنی `apply_patch` را مجاز می‌کند.
- `deny: ["write"]`، `apply_patch` را رد نمی‌کند؛ `apply_patch` را صراحتاً رد کنید یا وقتی نوشتن patch نیز باید مسدود شود از `deny: ["group:fs"]` استفاده کنید.
- Config زیر `tools.exec.applyPatch` قرار دارد.
- `tools.exec.applyPatch.enabled` به‌صورت پیش‌فرض `true` است؛ برای غیرفعال کردن ابزار برای مدل‌های OpenAI آن را روی `false` تنظیم کنید.
- `tools.exec.applyPatch.workspaceOnly` به‌صورت پیش‌فرض `true` است (محدود به workspace). فقط زمانی آن را روی `false` تنظیم کنید که عمداً می‌خواهید `apply_patch` بیرون از دایرکتوری workspace بنویسد/حذف کند.

## مرتبط

- [تأییدهای exec](/fa/tools/exec-approvals) — دروازه‌های تأیید برای فرمان‌های shell
- [Sandboxing](/fa/gateway/sandboxing) — اجرای فرمان‌ها در محیط‌های sandbox‌شده
- [فرایند پس‌زمینه](/fa/gateway/background-process) — exec طولانی‌اجرا و ابزار process
- [امنیت](/fa/gateway/security) — خط‌مشی ابزار و دسترسی elevated
