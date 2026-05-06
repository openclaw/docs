---
read_when:
    - پیکربندی تأییدهای exec یا فهرست‌های مجاز
    - پیاده‌سازی تجربه کاربری تأیید exec در برنامه macOS
    - بررسی پرامپت‌های فرار از سندباکس و پیامدهای آن‌ها
sidebarTitle: Exec approvals
summary: 'تأییدیه‌های اجرای میزبان: تنظیمات سیاست‌گذاری، فهرست‌های مجاز، و گردش‌کار YOLO/سخت‌گیرانه'
title: تأییدیه‌های اجرا
x-i18n:
    generated_at: "2026-05-06T09:46:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

تأییدهای exec، **محافظ برنامه همراه / میزبان node** برای اجازه دادن به
یک عامل sandboxed جهت اجرای فرمان‌ها روی یک میزبان واقعی (`gateway` یا `node`) هستند. یک
قفل ایمنی: فرمان‌ها فقط وقتی مجازند که policy + allowlist +
تأیید کاربر (اختیاری) همگی موافق باشند. تأییدهای exec **روی**
policy ابزار و elevated gating قرار می‌گیرند (مگر اینکه elevated روی `full` تنظیم شده باشد، که
تأییدها را رد می‌کند).

<Note>
policy مؤثر، **سخت‌گیرانه‌ترِ** پیش‌فرض‌های `tools.exec.*` و approvals است؛ اگر فیلدی از approvals حذف شود، مقدار `tools.exec` استفاده می‌شود. Host exec همچنین از وضعیت approvals محلی روی همان ماشین استفاده می‌کند - یک
`ask: "always"` محلیِ میزبان در `~/.openclaw/exec-approvals.json` همچنان
prompt می‌دهد، حتی اگر پیش‌فرض‌های session یا config مقدار `ask: "on-miss"` را درخواست کنند.
</Note>

## بررسی policy مؤثر

| فرمان                                                            | چه چیزی را نشان می‌دهد                                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | policy درخواست‌شده، منابع policy میزبان، و نتیجه مؤثر را نشان می‌دهد.                  |
| `openclaw exec-policy show`                                      | نمای ادغام‌شده ماشین محلی.                                                            |
| `openclaw exec-policy set` / `preset`                            | policy درخواست‌شده محلی را در یک مرحله با فایل approvals میزبان محلی همگام می‌کند.    |

وقتی یک محدوده محلی `host=node` را درخواست می‌کند، `exec-policy show` آن
محدوده را در زمان اجرا به‌عنوان node-managed گزارش می‌کند، نه اینکه وانمود کند فایل
approvals محلی منبع حقیقت است.

اگر UI برنامه همراه **در دسترس نباشد**، هر درخواستی که
معمولاً prompt می‌داد با **ask fallback** حل می‌شود (پیش‌فرض: `deny`).

<Tip>
کلاینت‌های تأیید chat بومی می‌توانند قابلیت‌های اختصاصی channel را روی
پیام تأیید pending مقداردهی اولیه کنند. برای مثال، Matrix میانبرهای واکنش را
مقداردهی می‌کند (`✅` اجازه یک‌بار، `❌` رد، `♾️` اجازه همیشه) و هم‌زمان
فرمان‌های `/approve ...` را نیز به‌عنوان fallback در پیام نگه می‌دارد.
</Tip>

## محل اعمال

تأییدهای exec به‌صورت محلی روی میزبان اجرا اعمال می‌شوند:

- **میزبان Gateway** → فرایند `openclaw` روی ماشین gateway.
- **میزبان Node** → اجراکننده node (برنامه همراه macOS یا میزبان node بدون UI).

### مدل اعتماد

- فراخواننده‌های Gateway-authenticated برای آن Gateway اپراتورهای معتمد هستند.
- nodeهای جفت‌شده آن قابلیت اپراتور معتمد را به میزبان node گسترش می‌دهند.
- تأییدهای exec ریسک اجرای تصادفی را کاهش می‌دهند، اما **مرز auth برای هر کاربر** نیستند.
- اجراهای تأییدشده روی میزبان node، زمینه اجرای canonical را bind می‌کنند: cwd canonical، argv دقیق، binding env در صورت وجود، و مسیر executable پین‌شده در صورت کاربرد.
- برای shell scriptها و فراخوانی‌های مستقیم فایل interpreter/runtime، OpenClaw همچنین تلاش می‌کند یک operand فایل محلی مشخص را bind کند. اگر آن فایل bind‌شده پس از تأیید اما پیش از اجرا تغییر کند، اجرا به‌جای اجرای محتوای drifted رد می‌شود.
- binding فایل عمداً best-effort است، **نه** یک مدل معنایی کامل از هر مسیر loader مربوط به interpreter/runtime. اگر حالت approval نتواند دقیقاً یک فایل محلی مشخص را برای bind شناسایی کند، به‌جای وانمود کردن پوشش کامل، از mint کردن یک اجرای approval-backed خودداری می‌کند.

### تفکیک macOS

- **سرویس میزبان node**، `system.run` را از طریق IPC محلی به **برنامه macOS** فوروارد می‌کند.
- **برنامه macOS** approvals را enforce می‌کند و فرمان را در زمینه UI اجرا می‌کند.

## تنظیمات و ذخیره‌سازی

Approvals در یک فایل JSON محلی روی میزبان اجرا قرار دارند:

```text
~/.openclaw/exec-approvals.json
```

نمونه schema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## کلیدهای policy

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - همه درخواست‌های host exec را block می‌کند.
  - `allowlist` - فقط فرمان‌های allowlisted را اجازه می‌دهد.
  - `full` - همه چیز را اجازه می‌دهد (معادل elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - هرگز prompt نده.
  - `on-miss` - فقط وقتی allowlist match نمی‌شود prompt بده.
  - `always` - برای هر فرمان prompt بده. اعتماد بادوام `allow-always` وقتی حالت ask مؤثر `always` باشد، promptها را **متوقف نمی‌کند**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  حل‌وفصل وقتی prompt لازم است اما هیچ UI در دسترس نیست.

- `deny` - block.
- `allowlist` - فقط اگر allowlist match شود اجازه بده.
- `full` - اجازه بده.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  وقتی `true` باشد، OpenClaw فرم‌های inline code-eval را approval-only در نظر می‌گیرد،
  حتی اگر خود binary مربوط به interpreter در allowlist باشد. این defense-in-depth
  برای loaderهای interpreter است که به‌صورت تمیز به یک operand فایل پایدار
  map نمی‌شوند.
</ParamField>

نمونه‌هایی که strict mode آن‌ها را می‌گیرد:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

در strict mode این فرمان‌ها همچنان به تأیید صریح نیاز دارند، و
`allow-always` ورودی‌های allowlist جدید را به‌صورت خودکار برای آن‌ها
persist نمی‌کند.

## حالت YOLO (بدون تأیید)

اگر می‌خواهید host exec بدون promptهای approval اجرا شود، باید
**هر دو** لایه policy را باز کنید - requested exec policy در config
OpenClaw (`tools.exec.*`) **و** policy approvals محلی میزبان در
`~/.openclaw/exec-approvals.json`.

YOLO رفتار پیش‌فرض میزبان است، مگر اینکه آن را صراحتاً سخت‌گیرانه‌تر کنید:

| لایه                  | تنظیم YOLO                 |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` روی `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**تمایزهای مهم:**

- `tools.exec.host=auto` انتخاب می‌کند exec **کجا** اجرا شود: sandbox وقتی در دسترس باشد، وگرنه gateway.
- YOLO انتخاب می‌کند host exec **چگونه** تأیید شود: `security=full` به‌علاوه `ask=off`.
- در حالت YOLO، OpenClaw یک heuristic command-obfuscation approval gate جداگانه یا لایه script-preflight rejection روی policy پیکربندی‌شده host exec اضافه **نمی‌کند**.
- `auto` مسیر‌یابی gateway را به override آزاد از یک session sandboxed تبدیل نمی‌کند. درخواست per-call با `host=node` از `auto` مجاز است؛ `host=gateway` فقط وقتی از `auto` مجاز است که هیچ runtime مربوط به sandbox فعال نباشد. برای یک پیش‌فرض non-auto پایدار، `tools.exec.host` را تنظیم کنید یا صراحتاً از `/exec host=...` استفاده کنید.

</Warning>

providerهای CLI-backed که حالت permission غیرتعاملی خودشان را expose می‌کنند
می‌توانند از این policy پیروی کنند. Claude CLI وقتی policy exec درخواست‌شده
OpenClaw در حالت YOLO باشد، `--permission-mode bypassPermissions` را اضافه می‌کند.
این رفتار backend را با argهای صریح Claude زیر
`agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` override کنید -
برای مثال `--permission-mode default`، `acceptEdits`، یا
`bypassPermissions`.

اگر setup محافظه‌کارانه‌تری می‌خواهید، یکی از لایه‌ها را به
`allowlist` / `on-miss` یا `deny` سخت‌گیرانه‌تر کنید.

### setup پایدار gateway-host برای «هرگز prompt نده»

<Steps>
  <Step title="تنظیم policy پیکربندی درخواست‌شده">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="همسان‌سازی فایل approvals میزبان">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### میانبر محلی

```bash
openclaw exec-policy preset yolo
```

این میانبر محلی هر دو مورد را به‌روزرسانی می‌کند:

- `tools.exec.host/security/ask` محلی.
- پیش‌فرض‌های محلی `~/.openclaw/exec-approvals.json`.

این عمداً فقط محلی است. برای تغییر approvals مربوط به gateway-host یا node-host
از راه دور، از `openclaw approvals set --gateway` یا
`openclaw approvals set --node <id|name|ip>` استفاده کنید.

### میزبان Node

برای یک میزبان node، همان فایل approvals را به‌جای آن روی همان node اعمال کنید:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**محدودیت‌های فقط محلی:**

- `openclaw exec-policy` approvals مربوط به node را همگام‌سازی نمی‌کند.
- `openclaw exec-policy set --host node` رد می‌شود.
- approvals مربوط به node exec در زمان اجرا از node واکشی می‌شوند، بنابراین updateهای هدف‌گیری‌شده برای node باید از `openclaw approvals --node ...` استفاده کنند.

</Note>

### میانبر فقط session

- `/exec security=full ask=off` فقط session فعلی را تغییر می‌دهد.
- `/elevated full` یک میانبر break-glass است که approvals مربوط به exec را نیز برای آن session رد می‌کند.

اگر فایل approvals میزبان سخت‌گیرانه‌تر از config باقی بماند، policy سخت‌گیرانه‌ترِ میزبان
همچنان برنده است.

## Allowlist (به‌ازای هر agent)

Allowlists **به‌ازای هر agent** هستند. اگر چند agent وجود داشته باشد، در برنامه macOS انتخاب کنید کدام agent را
ویرایش می‌کنید. Patternها matchهای glob هستند.

Patternها می‌توانند globهای مسیر binary resolved یا globهای نام فرمان ساده باشند.
نام‌های ساده فقط فرمان‌هایی را match می‌کنند که از طریق `PATH` فراخوانی شده‌اند، بنابراین `rg` می‌تواند
`/opt/homebrew/bin/rg` را وقتی فرمان `rg` است match کند، اما **نه** `./rg` یا
`/tmp/rg`. وقتی می‌خواهید به یک محل binary مشخص اعتماد کنید، از path glob استفاده کنید.

ورودی‌های legacy مربوط به `agents.default` هنگام load به `agents.main` migrate می‌شوند.
زنجیره‌های shell مانند `echo ok && pwd` همچنان نیاز دارند هر segment سطح بالایی
قواعد allowlist را برآورده کند.

نمونه‌ها:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### محدود کردن argumentها با argPattern

وقتی یک ورودی allowlist باید یک binary و یک شکل argument مشخص را match کند،
`argPattern` را اضافه کنید. OpenClaw عبارت منظم را روی argumentهای command parsed،
به‌جز token مربوط به executable (`argv[0]`) ارزیابی می‌کند. برای ورودی‌های hand-authored، argumentها با یک
space واحد join می‌شوند، بنابراین وقتی match دقیق لازم دارید pattern را anchor کنید.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

آن ورودی `python3 safe.py` را اجازه می‌دهد؛ `python3 other.py` یک allowlist
miss است. اگر یک ورودی path-only برای همان binary نیز وجود داشته باشد، argumentهای unmatched
همچنان می‌توانند به آن ورودی path-only fallback کنند. وقتی هدف محدود کردن binary به argumentهای
اعلام‌شده است، ورودی path-only را حذف کنید.

ورودی‌هایی که توسط جریان‌های approval ذخیره می‌شوند می‌توانند از یک قالب separator داخلی برای
exact argv matching استفاده کنند. به‌جای hand-edit کردن مقدار encoded، UI یا جریان approval را برای بازتولید آن
ورودی‌ها ترجیح دهید. اگر OpenClaw نتواند argv را برای یک command segment parse کند، ورودی‌های دارای `argPattern` match نمی‌شوند.

هر ورودی allowlist پشتیبانی می‌کند:

| فیلد              | معنی                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | الگوی تطبیق مسیر دودویی حل‌شده یا الگوی تطبیق نام فرمان ساده           |
| `argPattern`       | عبارت منظم اختیاری برای argv؛ ورودی‌های حذف‌شده فقط بر پایه مسیر هستند            |
| `id`               | UUID پایدار که برای هویت رابط کاربری استفاده می‌شود                              |
| `source`           | منبع ورودی، مانند `allow-always`                          |
| `commandText`      | متن فرمانی که هنگام ایجاد ورودی توسط جریان تأیید ثبت شده است |
| `lastUsedAt`       | مُهر زمانی آخرین استفاده                                           |
| `lastUsedCommand`  | آخرین فرمانی که مطابقت داشت                                     |
| `lastResolvedPath` | آخرین مسیر دودویی حل‌شده                                     |

## CLIهای Skills با مجوز خودکار

وقتی **CLIهای Skills با مجوز خودکار** فعال باشد، فایل‌های اجرایی که توسط
Skills شناخته‌شده ارجاع شده‌اند، روی Nodeها (Node در macOS یا میزبان
Node بدون رابط) در فهرست مجاز تلقی می‌شوند. این از `skills.bins` از طریق RPC
Gateway برای دریافت فهرست binهای Skill استفاده می‌کند. اگر فهرست‌های مجاز دستی سخت‌گیرانه می‌خواهید، این گزینه را غیرفعال کنید.

<Warning>
- این یک **فهرست مجاز ضمنی برای راحتی** است و از ورودی‌های دستی فهرست مجاز مسیر جداست.
- برای محیط‌های عملیاتی مورد اعتماد طراحی شده است که در آن‌ها Gateway و Node در یک مرز اعتماد هستند.
- اگر اعتماد صریح سخت‌گیرانه می‌خواهید، `autoAllowSkills: false` را نگه دارید و فقط از ورودی‌های دستی فهرست مجاز مسیر استفاده کنید.

</Warning>

## binهای امن و ارسال تأیید

برای binهای امن (مسیر سریع فقط stdin)، جزئیات اتصال مفسر، و
نحوه ارسال درخواست‌های تأیید به Slack/Discord/Telegram (یا اجرای آن‌ها به‌عنوان
کلاینت‌های تأیید بومی)، ببینید
[تأییدهای exec - پیشرفته](/fa/tools/exec-approvals-advanced).

## ویرایش رابط کنترل

از کارت **رابط کنترل → Nodeها → تأییدهای exec** برای ویرایش پیش‌فرض‌ها،
بازنویسی‌های هر عامل، و فهرست‌های مجاز استفاده کنید. یک دامنه انتخاب کنید (پیش‌فرض‌ها یا یک عامل)،
سیاست را تنظیم کنید، الگوهای فهرست مجاز را اضافه/حذف کنید، سپس **ذخیره** را بزنید. رابط کاربری
فراداده آخرین استفاده را برای هر الگو نشان می‌دهد تا بتوانید فهرست را مرتب نگه دارید.

انتخابگر هدف، **Gateway** (تأییدهای محلی) یا یک **Node** را انتخاب می‌کند.
Nodeها باید `system.execApprovals.get/set` را اعلام کنند (برنامه macOS یا
میزبان Node بدون رابط). اگر یک Node هنوز تأییدهای exec را اعلام نمی‌کند،
`~/.openclaw/exec-approvals.json` محلی آن را مستقیماً ویرایش کنید.

CLI: `openclaw approvals` از ویرایش Gateway یا Node پشتیبانی می‌کند - ببینید
[CLI تأییدها](/fa/cli/approvals).

## جریان تأیید

وقتی یک درخواست لازم باشد، Gateway رویداد
`exec.approval.requested` را برای کلاینت‌های اپراتور پخش می‌کند. رابط کنترل و برنامه macOS
آن را از طریق `exec.approval.resolve` حل می‌کنند، سپس Gateway درخواست
تأییدشده را به میزبان Node ارسال می‌کند.

برای `host=node`، درخواست‌های تأیید شامل payload استاندارد `systemRunPlan`
هستند. Gateway هنگام ارسال درخواست‌های تأییدشده `system.run`
از آن طرح به‌عنوان زمینه معتبر command/cwd/session استفاده می‌کند.

این برای تأخیر تأیید async مهم است:

- مسیر exec در Node از ابتدا یک طرح استاندارد آماده می‌کند.
- رکورد تأیید آن طرح و فراداده اتصال آن را ذخیره می‌کند.
- پس از تأیید، فراخوانی نهایی ارسال‌شده `system.run` به‌جای اعتماد به ویرایش‌های بعدی فراخوان، از طرح ذخیره‌شده دوباره استفاده می‌کند.
- اگر فراخوان پس از ایجاد درخواست تأیید، `command`، `rawCommand`، `cwd`، `agentId` یا `sessionKey` را تغییر دهد، Gateway اجرای ارسال‌شده را به‌عنوان عدم تطابق تأیید رد می‌کند.

## رویدادهای سیستم

چرخه عمر exec به‌صورت پیام‌های سیستمی نمایش داده می‌شود:

- `Exec running` (فقط اگر فرمان از آستانه اعلان در حال اجرا فراتر برود).
- `Exec finished`.
- `Exec denied`.

این‌ها پس از گزارش رویداد توسط Node در نشست عامل پست می‌شوند.
تأییدهای exec با میزبان Gateway هنگام پایان فرمان همان رویدادهای چرخه عمر را منتشر می‌کنند
(و به‌صورت اختیاری وقتی اجرا طولانی‌تر از آستانه شود).
execهای محدود به تأیید، برای همبستگی آسان، از شناسه تأیید به‌عنوان `runId` در این
پیام‌ها دوباره استفاده می‌کنند.

## رفتار تأیید ردشده

وقتی یک تأیید exec async رد می‌شود، OpenClaw جلوی عامل را می‌گیرد تا
از خروجی هر اجرای قبلی همان فرمان در نشست دوباره استفاده نکند.
دلیل رد شدن همراه با راهنمایی صریح ارسال می‌شود که هیچ خروجی فرمانی
در دسترس نیست؛ این باعث می‌شود عامل ادعا نکند خروجی جدیدی وجود دارد یا
فرمان ردشده را با نتایج قدیمی از یک اجرای موفق قبلی تکرار نکند.

## پیامدها

- **`full`** قدرتمند است؛ هرجا ممکن است فهرست‌های مجاز را ترجیح دهید.
- **`ask`** شما را در جریان نگه می‌دارد، در عین حال تأییدهای سریع را هم ممکن می‌کند.
- فهرست‌های مجاز هر عامل مانع نشت تأییدهای یک عامل به دیگران می‌شوند.
- تأییدها فقط برای درخواست‌های exec میزبان از **فرستندگان مجاز** اعمال می‌شوند. فرستندگان غیرمجاز نمی‌توانند `/exec` صادر کنند.
- `/exec security=full` یک میان‌بر در سطح نشست برای اپراتورهای مجاز است و طبق طراحی از تأییدها عبور می‌کند. برای مسدودسازی قطعی exec میزبان، امنیت تأییدها را روی `deny` تنظیم کنید یا ابزار `exec` را از طریق سیاست ابزار رد کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/fa/tools/exec-approvals-advanced" icon="gear">
    binهای امن، اتصال مفسر، و ارسال تأیید به چت.
  </Card>
  <Card title="Exec tool" href="/fa/tools/exec" icon="terminal">
    ابزار اجرای فرمان Shell.
  </Card>
  <Card title="Elevated mode" href="/fa/tools/elevated" icon="shield-exclamation">
    مسیر اضطراری که تأییدها را هم رد می‌کند.
  </Card>
  <Card title="Sandboxing" href="/fa/gateway/sandboxing" icon="box">
    حالت‌های sandbox و دسترسی به workspace.
  </Card>
  <Card title="Security" href="/fa/gateway/security" icon="lock">
    مدل امنیتی و سخت‌سازی.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/fa/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    چه زمانی به سراغ هر کنترل بروید.
  </Card>
  <Card title="Skills" href="/fa/tools/skills" icon="sparkles">
    رفتار مجوز خودکار مبتنی بر Skill.
  </Card>
</CardGroup>
