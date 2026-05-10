---
read_when:
    - پیکربندی تأییدهای اجرا یا فهرست‌های مجاز
    - پیاده‌سازی تجربهٔ کاربری تأیید exec در برنامهٔ macOS
    - بررسی پرامپت‌های گریز از محیط ایزوله و پیامدهای آن‌ها
sidebarTitle: Exec approvals
summary: 'تأییدیه‌های اجرای میزبان: تنظیمات سیاست، فهرست‌های مجاز، و گردش‌کار YOLO/سخت‌گیرانه'
title: تأییدیه‌های اجرا
x-i18n:
    generated_at: "2026-05-10T20:09:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b1a9649161440bca445e318654b9a48a54ae1dbbca42349ac94b13ecc9fbfbd
    source_path: tools/exec-approvals.md
    workflow: 16
---

تأییدهای exec همان **محافظ اپ همراه / میزبان Node** هستند برای اینکه
یک عامل sandboxed بتواند فرمان‌ها را روی یک میزبان واقعی (`gateway` یا `node`) اجرا کند. یک
قفل ایمنی: فرمان‌ها فقط وقتی مجاز هستند که policy + allowlist +
تأیید کاربر (اختیاری) همگی موافق باشند. تأییدهای exec **روی**
سیاست ابزار و گیتینگ elevated قرار می‌گیرند (مگر اینکه elevated روی `full` تنظیم شده باشد که
تأییدها را رد می‌کند).

<Note>
سیاست مؤثر، **سخت‌گیرانه‌ترِ** `tools.exec.*` و پیش‌فرض‌های تأییدهاست؛ اگر یک فیلد تأیید حذف شده باشد، مقدار `tools.exec`
استفاده می‌شود. exec میزبان همچنین از وضعیت تأییدهای محلی روی همان ماشین استفاده می‌کند - یک
`ask: "always"` محلیِ میزبان در `~/.openclaw/exec-approvals.json` همچنان
درخواست تأیید می‌کند حتی اگر پیش‌فرض‌های نشست یا پیکربندی `ask: "on-miss"` را درخواست کنند.
</Note>

## بررسی سیاست مؤثر

| فرمان                                                          | آنچه نشان می‌دهد                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | سیاست درخواست‌شده، منابع سیاست میزبان، و نتیجه مؤثر.                       |
| `openclaw exec-policy show`                                      | نمای ادغام‌شده ماشین محلی.                                                             |
| `openclaw exec-policy set` / `preset`                            | همگام‌سازی سیاست درخواست‌شده محلی با فایل تأییدهای میزبان محلی در یک گام. |

وقتی یک scope محلی `host=node` را درخواست می‌کند، `exec-policy show` آن
scope را در زمان اجرا به‌صورت مدیریت‌شده توسط Node گزارش می‌کند، نه اینکه وانمود کند فایل
تأییدهای محلی منبع حقیقت است.

اگر رابط کاربری اپ همراه **در دسترس نباشد**، هر درخواستی که
به‌طور معمول prompt می‌داد، با **ask fallback** حل می‌شود (پیش‌فرض: `deny`).

<Tip>
کلاینت‌های تأیید چت بومی می‌توانند affordanceهای ویژه کانال را روی
پیام تأیید در انتظار قرار دهند. برای مثال، Matrix میان‌برهای واکنش را قرار می‌دهد
(`✅` اجازه یک‌باره، `❌` رد، `♾️` اجازه همیشگی) در حالی که همچنان
فرمان‌های `/approve ...` را به‌عنوان fallback در پیام باقی می‌گذارد.
</Tip>

## محل اعمال

تأییدهای exec به‌صورت محلی روی میزبان اجرا اعمال می‌شوند:

- **میزبان Gateway** → فرایند `openclaw` روی ماشین gateway.
- **میزبان Node** → رانر Node (اپ همراه macOS یا میزبان Node بدون رابط).

### مدل اعتماد

- فراخوان‌هایی که با Gateway احراز هویت شده‌اند، عملگرهای مورد اعتماد برای همان Gateway هستند.
- Nodeهای جفت‌شده آن قابلیت عملگر مورد اعتماد را روی میزبان Node گسترش می‌دهند.
- تأییدهای exec ریسک اجرای تصادفی را کاهش می‌دهند، اما **نه** مرز احراز هویت به‌ازای هر کاربر هستند و نه سیاست فقط‌خواندنی فایل‌سیستم.
- پس از تأیید، یک فرمان می‌تواند مطابق مجوزهای فایل‌سیستم میزبان یا sandbox انتخاب‌شده فایل‌ها را تغییر دهد.
- اجراهای تأییدشده روی میزبان Node، زمینه اجرای canonical را bind می‌کنند: cwd canonical، argv دقیق، binding محیط در صورت وجود، و مسیر اجرایی pin‌شده در موارد قابل اعمال.
- برای اسکریپت‌های shell و فراخوانی‌های مستقیم فایل interpreter/runtime، OpenClaw همچنین تلاش می‌کند یک عملوند فایل محلی مشخص را bind کند. اگر آن فایل bindشده پس از تأیید اما پیش از اجرا تغییر کند، اجرا به‌جای اجرای محتوای driftشده رد می‌شود.
- binding فایل عمداً best-effort است، **نه** یک مدل معنایی کامل از همه مسیرهای loader هر interpreter/runtime. اگر حالت تأیید نتواند دقیقاً یک فایل محلی مشخص را برای bind شناسایی کند، به‌جای وانمود کردن پوشش کامل، از صدور اجرای متکی بر تأیید خودداری می‌کند.

### جداسازی macOS

- **سرویس میزبان Node**، `system.run` را از طریق IPC محلی به **اپ macOS** فوروارد می‌کند.
- **اپ macOS** تأییدها را اعمال می‌کند و فرمان را در زمینه UI اجرا می‌کند.

## تنظیمات و ذخیره‌سازی

تأییدها در یک فایل JSON محلی روی میزبان اجرا قرار دارند:

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

## دستگیره‌های سیاست

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - همه درخواست‌های exec میزبان را مسدود می‌کند.
  - `allowlist` - فقط فرمان‌های موجود در allowlist را مجاز می‌کند.
  - `full` - همه چیز را مجاز می‌کند (معادل elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - هرگز prompt نمی‌دهد.
  - `on-miss` - فقط وقتی allowlist مطابقت ندارد prompt می‌دهد.
  - `always` - روی هر فرمان prompt می‌دهد. اعتماد پایدار `allow-always` وقتی حالت ask مؤثر `always` است، promptها را **سرکوب نمی‌کند**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  نحوه حل وقتی prompt لازم است اما هیچ UI قابل دسترسی نیست.

- `deny` - مسدود می‌کند.
- `allowlist` - فقط اگر allowlist مطابقت داشته باشد مجاز می‌کند.
- `full` - مجاز می‌کند.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  وقتی `true` باشد، OpenClaw فرم‌های inline code-eval را حتی اگر خود باینری interpreter در allowlist باشد، فقط با تأیید مجاز می‌داند. دفاع چندلایه
  برای loaderهای interpreter که به‌صورت تمیز به یک عملوند فایل پایدار
  نگاشت نمی‌شوند.
</ParamField>

نمونه‌هایی که حالت سخت‌گیرانه می‌گیرد:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

در حالت سخت‌گیرانه این فرمان‌ها همچنان به تأیید صریح نیاز دارند، و
`allow-always` به‌طور خودکار ورودی‌های allowlist جدید را برای آن‌ها پایدار نمی‌کند.

## حالت YOLO (بدون تأیید)

اگر می‌خواهید exec میزبان بدون promptهای تأیید اجرا شود، باید
**هر دو** لایه سیاست را باز کنید - سیاست exec درخواست‌شده در پیکربندی OpenClaw
(`tools.exec.*`) **و** سیاست تأییدهای محلی میزبان در
`~/.openclaw/exec-approvals.json`.

YOLO رفتار پیش‌فرض میزبان است مگر اینکه صریحاً آن را سخت‌گیرانه‌تر کنید:

| لایه                 | تنظیم YOLO               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` روی `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**تمایزهای مهم:**

- `tools.exec.host=auto` انتخاب می‌کند exec **کجا** اجرا شود: وقتی sandbox در دسترس است در sandbox، در غیر این صورت gateway.
- YOLO انتخاب می‌کند exec میزبان **چگونه** تأیید شود: `security=full` به‌همراه `ask=off`.
- در حالت YOLO، OpenClaw یک گیت تأیید جداگانه مبتنی بر heuristic برای command-obfuscation یا لایه رد script-preflight روی سیاست exec میزبان پیکربندی‌شده اضافه **نمی‌کند**.
- `auto` باعث نمی‌شود مسیریابی gateway از یک نشست sandboxed به یک override آزاد تبدیل شود. درخواست per-call با `host=node` از `auto` مجاز است؛ `host=gateway` فقط زمانی از `auto` مجاز است که هیچ runtime sandbox فعالی وجود نداشته باشد. برای یک پیش‌فرض پایدار غیر auto، `tools.exec.host` را تنظیم کنید یا صریحاً از `/exec host=...` استفاده کنید.

</Warning>

ارائه‌دهندگان متکی به CLI که حالت مجوز noninteractive خودشان را expose می‌کنند
می‌توانند از این سیاست پیروی کنند. Claude CLI وقتی سیاست exec درخواست‌شده OpenClaw
در حالت YOLO باشد، `--permission-mode bypassPermissions` را اضافه می‌کند. این رفتار backend را با آرگومان‌های صریح Claude
زیر `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` override کنید -
برای مثال `--permission-mode default`، `acceptEdits`، یا
`bypassPermissions`.

اگر یک راه‌اندازی محافظه‌کارانه‌تر می‌خواهید، یکی از دو لایه را دوباره به
`allowlist` / `on-miss` یا `deny` سخت‌گیرانه‌تر کنید.

### راه‌اندازی پایدار «هرگز prompt نده» برای میزبان Gateway

<Steps>
  <Step title="سیاست پیکربندی درخواست‌شده را تنظیم کنید">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="فایل تأییدهای میزبان را هماهنگ کنید">
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

### میان‌بر محلی

```bash
openclaw exec-policy preset yolo
```

این میان‌بر محلی هر دو مورد را به‌روزرسانی می‌کند:

- `tools.exec.host/security/ask` محلی.
- پیش‌فرض‌های محلی `~/.openclaw/exec-approvals.json`.

این عمداً فقط محلی است. برای تغییر تأییدهای میزبان Gateway یا میزبان Node
به‌صورت remote، از `openclaw approvals set --gateway` یا
`openclaw approvals set --node <id|name|ip>` استفاده کنید.

### میزبان Node

برای یک میزبان Node، همان فایل تأییدها را به‌جای آن روی همان Node اعمال کنید:

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

- `openclaw exec-policy` تأییدهای Node را همگام‌سازی نمی‌کند.
- `openclaw exec-policy set --host node` رد می‌شود.
- تأییدهای exec مربوط به Node در زمان اجرا از Node گرفته می‌شوند، بنابراین به‌روزرسانی‌های هدف‌گرفته‌شده برای Node باید از `openclaw approvals --node ...` استفاده کنند.

</Note>

### میان‌بر فقط نشست

- `/exec security=full ask=off` فقط نشست فعلی را تغییر می‌دهد.
- `/elevated full` یک میان‌بر اضطراری است که تأییدهای exec را نیز برای همان نشست رد می‌کند.

اگر فایل تأییدهای میزبان سخت‌گیرانه‌تر از پیکربندی باقی بماند، سیاست سخت‌گیرانه‌تر میزبان
همچنان برنده است.

## Allowlist (به‌ازای هر عامل)

Allowlistها **به‌ازای هر عامل** هستند. اگر چند عامل وجود دارد، در اپ macOS عاملی را که
ویرایش می‌کنید تغییر دهید. الگوها تطابق glob هستند.

الگوها می‌توانند glob مسیر باینری resolveشده یا glob نام فرمان بدون مسیر باشند.
نام‌های بدون مسیر فقط فرمان‌هایی را تطبیق می‌دهند که از طریق `PATH` فراخوانی شده‌اند، بنابراین `rg` می‌تواند
`/opt/homebrew/bin/rg` را وقتی فرمان `rg` است تطبیق دهد، اما **نه** `./rg` یا
`/tmp/rg`. وقتی می‌خواهید به یک مکان باینری مشخص اعتماد کنید، از glob مسیر استفاده کنید.

ورودی‌های legacy در `agents.default` هنگام بارگذاری به `agents.main` مهاجرت داده می‌شوند.
زنجیره‌های shell مثل `echo ok && pwd` همچنان نیاز دارند هر segment سطح بالایی
قواعد allowlist را برآورده کند.

نمونه‌ها:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### محدود کردن آرگومان‌ها با argPattern

وقتی یک ورودی allowlist باید یک باینری و یک شکل خاص از آرگومان را تطبیق دهد، `argPattern` را اضافه کنید. OpenClaw عبارت منظم را
روی آرگومان‌های parseشده فرمان ارزیابی می‌کند، بدون token اجرایی
(`argv[0]`). برای ورودی‌های دستی، آرگومان‌ها با یک
فاصله تکی join می‌شوند، بنابراین وقتی به تطابق دقیق نیاز دارید الگو را anchor کنید.

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

آن ورودی `python3 safe.py` را مجاز می‌کند؛ `python3 other.py` یک miss در allowlist است. اگر یک ورودی فقط مسیر برای همان باینری نیز وجود داشته باشد، آرگومان‌های تطبیق‌نیافته
همچنان می‌توانند به آن ورودی فقط مسیر fallback کنند. وقتی هدف محدود کردن باینری به آرگومان‌های اعلام‌شده است، ورودی فقط مسیر را حذف کنید.

ورودی‌هایی که توسط جریان‌های تأیید ذخیره شده‌اند می‌توانند از یک قالب جداکننده داخلی برای
تطابق دقیق argv استفاده کنند. ترجیح دهید به‌جای ویرایش دستی مقدار encodeشده، از UI یا جریان تأیید برای بازتولید آن
ورودی‌ها استفاده کنید. اگر OpenClaw نتواند argv را برای یک segment فرمان
parse کند، ورودی‌های دارای `argPattern` تطبیق داده نمی‌شوند.

هر ورودی allowlist پشتیبانی می‌کند از:

| فیلد              | معنی                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | glob مسیر باینری resolve‌شده یا glob نام دستور ساده           |
| `argPattern`       | regex اختیاری argv؛ ورودی‌های حذف‌شده فقط مسیر هستند            |
| `id`               | UUID پایدار مورد استفاده برای هویت UI                              |
| `source`           | منبع ورودی، مانند `allow-always`                          |
| `commandText`      | متن دستور ثبت‌شده زمانی که جریان تأیید ورودی را ایجاد کرده است |
| `lastUsedAt`       | timestamp آخرین استفاده                                           |
| `lastUsedCommand`  | آخرین دستوری که match شده است                                     |
| `lastResolvedPath` | آخرین مسیر باینری resolve‌شده                                     |

## اجازه‌دهی خودکار به CLIهای Skills

وقتی **اجازه‌دهی خودکار به CLIهای Skills** فعال باشد، فایل‌های اجرایی ارجاع‌شده توسط
Skills شناخته‌شده، روی Nodeها (Node در macOS یا میزبان Node بدون رابط گرافیکی)
به‌عنوان allowlisted در نظر گرفته می‌شوند. این کار از `skills.bins` روی RPC مربوط به Gateway برای دریافت
فهرست binهای Skills استفاده می‌کند. اگر allowlistهای دستی سخت‌گیرانه می‌خواهید، این گزینه را غیرفعال کنید.

<Warning>
- این یک **allowlist ضمنی برای راحتی** است و از ورودی‌های allowlist دستی مسیر جداست.
- برای محیط‌های اپراتوری قابل اعتماد در نظر گرفته شده است که Gateway و Node در یک مرز اعتماد قرار دارند.
- اگر اعتماد صریح و سخت‌گیرانه لازم دارید، `autoAllowSkills: false` را نگه دارید و فقط از ورودی‌های allowlist دستی مسیر استفاده کنید.

</Warning>

## binهای ایمن و forwarding تأیید

برای binهای ایمن (مسیر سریع فقط stdin)، جزئیات binding مفسر، و
نحوه forward کردن promptهای تأیید به Slack/Discord/Telegram (یا اجرای آن‌ها به‌عنوان
کلاینت‌های تأیید native)، ببینید
[تأییدهای Exec - پیشرفته](/fa/tools/exec-approvals-advanced).

## ویرایش UI کنترل

از کارت **UI کنترل → Nodeها → تأییدهای Exec** برای ویرایش پیش‌فرض‌ها،
overrideهای هر agent و allowlistها استفاده کنید. یک scope انتخاب کنید (Defaults یا یک agent)،
policy را تنظیم کنید، الگوهای allowlist را اضافه/حذف کنید، سپس **Save** را بزنید. UI
metadata آخرین استفاده را برای هر الگو نشان می‌دهد تا بتوانید فهرست را مرتب نگه دارید.

انتخابگر target، **Gateway** (تأییدهای محلی) یا یک **Node** را انتخاب می‌کند.
Nodeها باید `system.execApprovals.get/set` را advertise کنند (اپ macOS یا
میزبان Node بدون رابط گرافیکی). اگر یک Node هنوز exec approvals را advertise نمی‌کند،
`~/.openclaw/exec-approvals.json` محلی آن را مستقیم ویرایش کنید.

CLI: `openclaw approvals` از ویرایش Gateway یا Node پشتیبانی می‌کند - ببینید
[CLI تأییدها](/fa/cli/approvals).

## جریان تأیید

وقتی prompt لازم باشد، Gateway رویداد
`exec.approval.requested` را برای کلاینت‌های اپراتور broadcast می‌کند. UI کنترل و اپ macOS
آن را از طریق `exec.approval.resolve` resolve می‌کنند، سپس Gateway درخواست
تأییدشده را به میزبان Node forward می‌کند.

برای `host=node`، درخواست‌های تأیید شامل payload متعارف `systemRunPlan`
هستند. Gateway هنگام forward کردن درخواست‌های تأییدشده `system.run`، از آن plan به‌عنوان context معتبر
command/cwd/session استفاده می‌کند.

این برای latency تأیید async مهم است:

- مسیر exec در Node، یک plan متعارف را از ابتدا آماده می‌کند.
- رکورد تأیید، آن plan و metadata مربوط به binding آن را ذخیره می‌کند.
- پس از تأیید، فراخوانی نهایی `system.run` که forward می‌شود، به‌جای اعتماد به ویرایش‌های بعدی caller، از plan ذخیره‌شده دوباره استفاده می‌کند.
- اگر caller پس از ایجاد درخواست تأیید، `command`، `rawCommand`، `cwd`، `agentId` یا `sessionKey` را تغییر دهد، Gateway اجرای forward‌شده را به‌عنوان عدم تطابق تأیید رد می‌کند.

## رویدادهای سیستم

چرخه عمر Exec به‌صورت پیام‌های سیستم نمایش داده می‌شود:

- `Exec running` (فقط اگر دستور از آستانه اعلان running فراتر برود).
- `Exec finished`.
- `Exec denied`.

این‌ها پس از گزارش رویداد توسط Node، در session مربوط به agent ارسال می‌شوند.
تأییدهای exec با میزبان Gateway، پس از پایان دستور، همان رویدادهای چرخه عمر را emit می‌کنند
(و در صورت طولانی‌تر شدن اجرا از آستانه، به‌صورت اختیاری هنگام running نیز).
execهای gating‌شده با تأیید، برای همبستگی آسان، از id تأیید به‌عنوان `runId` در این
پیام‌ها دوباره استفاده می‌کنند.

## رفتار تأیید ردشده

وقتی یک تأیید exec async رد می‌شود، OpenClaw از استفاده دوباره agent از
خروجی هر اجرای قبلی همان دستور در session جلوگیری می‌کند.
دلیل رد شدن همراه با راهنمایی صریح ارسال می‌شود که هیچ خروجی دستوری
در دسترس نیست؛ این مانع می‌شود agent ادعا کند خروجی جدیدی وجود دارد یا
دستور ردشده را با نتایج stale از یک اجرای موفق قبلی تکرار کند.

## پیامدها

- **`full`** قدرتمند است؛ هر زمان ممکن است allowlistها را ترجیح دهید.
- **`ask`** شما را در چرخه نگه می‌دارد و همچنان تأییدهای سریع را ممکن می‌کند.
- allowlistهای هر agent از نشت تأییدهای یک agent به دیگران جلوگیری می‌کنند.
- تأییدها فقط برای درخواست‌های host exec از **فرستنده‌های مجاز** اعمال می‌شوند. فرستنده‌های غیرمجاز نمی‌توانند `/exec` صادر کنند.
- `/exec security=full` یک convenience در سطح session برای اپراتورهای مجاز است و بنا بر طراحی، تأییدها را رد می‌کند. برای hard-block کردن host exec، امنیت تأییدها را روی `deny` تنظیم کنید یا tool مربوط به `exec` را از طریق policy ابزار deny کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="تأییدهای Exec - پیشرفته" href="/fa/tools/exec-approvals-advanced" icon="gear">
    binهای ایمن، binding مفسر، و forwarding تأیید به chat.
  </Card>
  <Card title="ابزار Exec" href="/fa/tools/exec" icon="terminal">
    ابزار اجرای دستور shell.
  </Card>
  <Card title="حالت Elevated" href="/fa/tools/elevated" icon="shield-exclamation">
    مسیر break-glass که تأییدها را هم رد می‌کند.
  </Card>
  <Card title="Sandboxing" href="/fa/gateway/sandboxing" icon="box">
    حالت‌های sandbox و دسترسی به workspace.
  </Card>
  <Card title="امنیت" href="/fa/gateway/security" icon="lock">
    مدل امنیتی و hardening.
  </Card>
  <Card title="Sandbox در برابر policy ابزار در برابر elevated" href="/fa/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    چه زمانی از هر کنترل استفاده کنید.
  </Card>
  <Card title="Skills" href="/fa/tools/skills" icon="sparkles">
    رفتار اجازه‌دهی خودکار مبتنی بر Skills.
  </Card>
</CardGroup>
