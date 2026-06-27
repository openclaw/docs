---
read_when:
    - پیکربندی تأییدهای exec یا فهرست‌های مجاز
    - پیاده‌سازی تجربه کاربری تأیید exec در اپلیکیشن macOS
    - مرور اعلان‌های گریز از sandbox و پیامدهای آن‌ها
sidebarTitle: Exec approvals
summary: 'تأییدهای اجرای میزبان: تنظیمات سیاست، فهرست‌های مجاز، و گردش‌کار YOLO/سخت‌گیرانه'
title: تأییدیه‌های اجرا
x-i18n:
    generated_at: "2026-06-27T18:58:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

تأییدهای exec **محافظ برنامهٔ همراه / میزبان node** هستند برای اینکه
یک عامل sandboxed بتواند دستورها را روی یک میزبان واقعی (`gateway` یا `node`) اجرا کند. یک
قفل ایمنی: دستورها فقط وقتی مجازند که سیاست + allowlist +
تأیید کاربر (اختیاری) همگی موافق باشند. تأییدهای exec **روی**
سیاست ابزار و دروازه‌بانی elevated قرار می‌گیرند (مگر اینکه elevated روی `full` تنظیم شده باشد که
تأییدها را رد می‌کند).

برای نمای کلی mode-first از `deny`، `allowlist`، `ask`، `auto`، `full`،
نگاشت Codex Guardian، و مجوزهای harness مربوط به ACPX، ببینید
[حالت‌های مجوز](/fa/tools/permission-modes).

<Note>
سیاست مؤثر، **سخت‌گیرانه‌ترِ** مقدارهای پیش‌فرض `tools.exec.*` و تأییدها است؛
اگر فیلدی از تأییدها حذف شده باشد، مقدار `tools.exec` استفاده می‌شود.
اجرای میزبان همچنین از وضعیت تأییدهای محلی روی همان ماشین استفاده می‌کند - یک
`ask: "always"` محلیِ میزبان در فایل تأییدهای میزبان اجرا، حتی اگر مقدارهای پیش‌فرض نشست یا پیکربندی
`ask: "on-miss"` را درخواست کنند، همچنان درخواست تأیید نشان می‌دهد.
</Note>

## بررسی سیاست مؤثر

| دستور | آنچه نشان می‌دهد |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | سیاست درخواست‌شده، منابع سیاست میزبان، و نتیجهٔ مؤثر. |
| `openclaw exec-policy show` | نمای ادغام‌شدهٔ ماشین محلی. |
| `openclaw exec-policy set` / `preset` | همگام‌سازی سیاست درخواست‌شدهٔ محلی با فایل تأییدهای میزبان محلی در یک گام. |

وقتی یک scope محلی `host=node` را درخواست می‌کند، `exec-policy show` آن
scope را در زمان اجرا به‌عنوان مدیریت‌شده توسط node گزارش می‌کند، نه اینکه وانمود کند فایل
تأییدهای محلی منبع حقیقت است.

اگر رابط کاربری برنامهٔ همراه **در دسترس نباشد**، هر درخواستی که
معمولاً prompt می‌داد، با **ask fallback** حل‌وفصل می‌شود (پیش‌فرض: `deny`).

<Tip>
کلاینت‌های تأیید گفت‌وگوی بومی می‌توانند affordanceهای ویژهٔ کانال را روی
پیام تأیید در انتظار قرار دهند. برای مثال، Matrix میانبرهای واکنش را قرار می‌دهد
(`✅` یک‌بار اجازه بده، `❌` رد کن، `♾️` همیشه اجازه بده) و هم‌زمان
دستورهای `/approve ...` را به‌عنوان fallback در پیام نگه می‌دارد.
</Tip>

## کجا اعمال می‌شود

تأییدهای exec به‌صورت محلی روی میزبان اجرا اعمال می‌شوند:

- **میزبان Gateway** → فرایند `openclaw` روی ماشین gateway.
- **میزبان Node** → اجراکنندهٔ node (برنامهٔ همراه macOS یا میزبان node بی‌واسطه).

### مدل اعتماد

- فراخواننده‌های احراز هویت‌شده توسط Gateway برای آن Gateway اپراتورهای مورد اعتماد هستند.
- nodeهای جفت‌شده آن قابلیت اپراتور مورد اعتماد را به میزبان node گسترش می‌دهند.
- تأییدهای exec خطر اجرای تصادفی را کاهش می‌دهند، اما **نه** مرز احراز هویت به‌ازای کاربر هستند و نه سیاست فقط‌خواندنی فایل‌سیستم.
- پس از تأیید، یک دستور می‌تواند فایل‌ها را مطابق مجوزهای فایل‌سیستم میزبان یا sandbox انتخاب‌شده تغییر دهد.
- اجراهای تأییدشدهٔ میزبان node، زمینهٔ اجرای canonical را bind می‌کنند: cwd canonical، argv دقیق، binding محیط در صورت وجود، و مسیر اجرایی پین‌شده در صورت کاربرد.
- برای shell scriptها و فراخوانی‌های مستقیم فایل interpreter/runtime، OpenClaw همچنین تلاش می‌کند یک عملوند فایل محلی مشخص را bind کند. اگر آن فایل bindشده پس از تأیید اما پیش از اجرا تغییر کند، اجرا به‌جای اجرای محتوای drift کرده رد می‌شود.
- binding فایل عمداً best-effort است، **نه** یک مدل معنایی کامل از هر مسیر loader مربوط به interpreter/runtime. اگر حالت تأیید نتواند دقیقاً یک فایل محلی مشخص را برای bind شناسایی کند، به‌جای وانمود کردن پوشش کامل، از ایجاد اجرای پشتوانه‌دار با تأیید خودداری می‌کند.

### جداسازی macOS

- **سرویس میزبان node**، `system.run` را از طریق IPC محلی به **برنامهٔ macOS** فوروارد می‌کند.
- **برنامهٔ macOS** تأییدها را اعمال می‌کند و دستور را در زمینهٔ UI اجرا می‌کند.

## تنظیمات و ذخیره‌سازی

تأییدها در یک فایل JSON محلی روی میزبان اجرا قرار دارند. وقتی
`OPENCLAW_STATE_DIR` تنظیم شده باشد، فایل از همان دایرکتوری state پیروی می‌کند؛
در غیر این صورت از دایرکتوری state پیش‌فرض OpenClaw استفاده می‌کند:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

سوکت تأیید پیش‌فرض از همان root پیروی می‌کند:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`، یا
`~/.openclaw/exec-approvals.sock` وقتی متغیر تنظیم نشده باشد.

نمونهٔ schema:

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

## پیچ‌های سیاست

### `tools.exec.mode`

`tools.exec.mode` سطح سیاست normalize‌شدهٔ ترجیحی برای exec میزبان است.
مقادیر عبارت‌اند از:

- `deny` - exec میزبان را مسدود کن.
- `allowlist` - فقط دستورهای allowlist‌شده را بدون پرسیدن اجرا کن.
- `ask` - از سیاست allowlist استفاده کن و در missها بپرس.
- `auto` - از سیاست allowlist استفاده کن، matchهای deterministic را مستقیم اجرا کن، و missهای تأیید را پیش از fallback به مسیر تأیید انسانی از طریق بازبین خودکار بومی OpenClaw بفرست.
- `full` - exec میزبان را بدون prompt تأیید اجرا کن.

`tools.exec.security` / `tools.exec.ask` قدیمی همچنان پشتیبانی می‌شوند و وقتی
در scope نشست یا عامل محدودتر تنظیم شده باشند، هنوز اولویت دارند.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - همهٔ درخواست‌های exec میزبان را مسدود کن.
  - `allowlist` - فقط دستورهای allowlist‌شده را مجاز کن.
  - `full` - همه‌چیز را مجاز کن (معادل elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  سیاست ask پیکربندی‌شده برای exec میزبان. رفتار prompt تأیید پایه را
  از `tools.exec.ask` و مقدارهای پیش‌فرض تأییدهای میزبان کنترل می‌کند. پارامتر
  ابزار `ask` به‌ازای هر فراخوانی (ببینید [ابزار Exec](/fa/tools/exec#parameters))
  فقط می‌تواند آن baseline را سخت‌گیرانه‌تر کند، و فراخوانی‌های مدل با منشأ کانال وقتی
  ask مؤثر میزبان `off` است آن را نادیده می‌گیرند.

- `off` - هرگز prompt نده.
- `on-miss` - فقط وقتی allowlist match نمی‌شود prompt بده.
- `always` - روی هر دستور prompt بده. اعتماد بادوام `allow-always` وقتی حالت ask مؤثر `always` است، promptها را **سرکوب نمی‌کند**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  حل‌وفصل وقتی prompt لازم است اما هیچ UI قابل دسترسی نیست. اگر این
  فیلد حذف شده باشد، OpenClaw به‌صورت پیش‌فرض `deny` را استفاده می‌کند.

- `deny` - مسدود کن.
- `allowlist` - فقط اگر allowlist match شود اجازه بده.
- `full` - اجازه بده.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  وقتی `true` باشد، OpenClaw فرم‌های inline code-eval را حتی اگر خود binary مفسر allowlist شده باشد، فقط با تأیید
  در نظر می‌گیرد. دفاع چندلایه
  برای loaderهای مفسر که به‌روشنی به یک عملوند فایل پایدار
  map نمی‌شوند.
</ParamField>

نمونه‌هایی که حالت سخت‌گیرانه می‌گیرد:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

در حالت سخت‌گیرانه، این دستورها همچنان به تأیید صریح نیاز دارند، و
`allow-always` ورودی‌های allowlist جدید را برای آن‌ها
به‌صورت خودکار پایدار نمی‌کند.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  فقط نمایش را در promptهای تأیید exec کنترل می‌کند. وقتی فعال باشد،
  OpenClaw ممکن است spanهای دستور مشتق‌شده از parser را attach کند تا promptهای تأیید Web
  بتوانند tokenهای دستور را highlight کنند. برای فعال‌کردن
  highlight متن دستور، آن را روی `true` تنظیم کنید.
</ParamField>

این تنظیم `security`، `ask`، matching allowlist،
رفتار strict inline-eval، forwarding تأیید، یا اجرای دستور را **تغییر نمی‌دهد**.
می‌تواند به‌صورت global زیر `tools.exec.commandHighlighting` یا به‌ازای هر
عامل زیر `agents.list[].tools.exec.commandHighlighting` تنظیم شود.

## حالت YOLO (بدون تأیید)

اگر می‌خواهید exec میزبان بدون promptهای تأیید اجرا شود، باید
**هر دو** لایهٔ سیاست را باز کنید - سیاست exec درخواست‌شده در پیکربندی OpenClaw
(`tools.exec.*`) **و** سیاست تأییدهای host-local در
فایل تأییدهای میزبان اجرا.

OpenClaw مقدار حذف‌شدهٔ `askFallback` را به‌صورت پیش‌فرض `deny` می‌گذارد. وقتی prompt تأیید بدون UI باید
به allow fallback کند، `askFallback` میزبان را صراحتاً روی `full` تنظیم کنید.

| لایه | تنظیم YOLO |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` روی `gateway`/`node` |
| `tools.exec.ask` | `off` |
| Host `askFallback` | `full` |

<Warning>
**تمایزهای مهم:**

- `tools.exec.host=auto` انتخاب می‌کند exec **کجا** اجرا شود: sandbox وقتی در دسترس باشد، در غیر این صورت gateway.
- YOLO انتخاب می‌کند exec میزبان **چگونه** تأیید شود: `security=full` به‌علاوهٔ `ask=off`.
- در حالت YOLO، OpenClaw یک دروازهٔ تأیید heuristic جداگانه برای پنهان‌سازی دستور یا لایهٔ رد پیش‌بررسی script روی سیاست exec میزبان پیکربندی‌شده اضافه **نمی‌کند**.
- `auto` مسیریابی gateway را به override آزاد از یک نشست sandboxed تبدیل نمی‌کند. درخواست به‌ازای هر فراخوانی `host=node` از `auto` مجاز است؛ `host=gateway` فقط وقتی از `auto` مجاز است که هیچ runtime مربوط به sandbox فعال نباشد. برای یک پیش‌فرض non-auto پایدار، `tools.exec.host` را تنظیم کنید یا صراحتاً از `/exec host=...` استفاده کنید.

</Warning>

providerهای پشتیبانی‌شده با CLI که حالت مجوز noninteractive خود را expose می‌کنند
می‌توانند از این سیاست پیروی کنند. Claude CLI وقتی سیاست exec مؤثر OpenClaw
YOLO باشد، `--permission-mode bypassPermissions` را اضافه می‌کند.
برای نشست‌های زندهٔ Claude مدیریت‌شده توسط OpenClaw، سیاست exec مؤثر OpenClaw
بر حالت مجوز بومی Claude authoritative است:
YOLO اجراهای زنده را به `--permission-mode bypassPermissions` normalize می‌کند، و
سیاست exec مؤثر محدودکننده اجراهای زنده را به
`--permission-mode default` normalize می‌کند، حتی اگر آرگومان‌های raw backend مربوط به Claude حالت دیگری را مشخص کنند.

اگر تنظیم محافظه‌کارانه‌تری می‌خواهید، سیاست exec OpenClaw را دوباره به
`allowlist` / `on-miss` یا `deny` سخت‌گیرانه‌تر کنید.

### راه‌اندازی «هرگز prompt نده» پایدار برای میزبان gateway

<Steps>
  <Step title="سیاست پیکربندی درخواست‌شده را تنظیم کنید">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="فایل تأییدهای میزبان را همسان کنید">
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

آن میانبر محلی هر دو مورد را به‌روزرسانی می‌کند:

- `tools.exec.host/security/ask` محلی.
- مقدارهای پیش‌فرض فایل تأییدهای محلی، شامل `askFallback: "full"`.

این عمداً فقط محلی است. برای تغییر تأییدهای میزبان gateway یا میزبان node
از راه دور، از `openclaw approvals set --gateway` یا
`openclaw approvals set --node <id|name|ip>` استفاده کنید.

### میزبان Node

برای یک میزبان node، به‌جای آن همان فایل تأییدها را روی همان node اعمال کنید:

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
**محدودیت‌های فقط‌محلی:**

- `openclaw exec-policy` تأییدهای node را همگام‌سازی نمی‌کند.
- `openclaw exec-policy set --host node` رد می‌شود.
- تأییدهای exec مربوط به node در زمان اجرا از node دریافت می‌شوند، بنابراین به‌روزرسانی‌های هدف‌گذاری‌شده برای node باید از `openclaw approvals --node ...` استفاده کنند.

</Note>

### میانبر فقط نشست

- ‎`/exec security=full ask=off` فقط نشست فعلی را تغییر می‌دهد.
- ‎`/elevated full` یک میان‌بر اضطراری است که تأییدهای exec را فقط زمانی رد می‌کند که
  هم سیاست درخواستی و هم فایل تأییدهای میزبان به
  ‎`security: "full"` و ‎`ask: "off"` برسند. یک فایل میزبان سخت‌گیرتر، مانند
  ‎`ask: "always"`، همچنان درخواست تأیید نشان می‌دهد.

اگر فایل تأییدهای میزبان سخت‌گیرتر از پیکربندی بماند، سیاست سخت‌گیرتر میزبان
همچنان برنده است.

## فهرست مجاز (برای هر عامل)

فهرست‌های مجاز **برای هر عامل** هستند. اگر چند عامل وجود دارد، در برنامه macOS عاملی را که
ویرایش می‌کنید تغییر دهید. الگوها تطابق‌های glob هستند.

الگوها می‌توانند globهای مسیر باینری resolve‌شده یا globهای نام فرمان ساده باشند.
نام‌های ساده فقط با فرمان‌هایی که از طریق ‎`PATH` فراخوانی شده‌اند تطبیق می‌کنند، بنابراین ‎`rg` می‌تواند با
‎`/opt/homebrew/bin/rg` وقتی فرمان ‎`rg` است تطبیق کند، اما **نه** با ‎`./rg` یا
‎`/tmp/rg`. وقتی می‌خواهید به یک مکان باینری مشخص اعتماد کنید، از glob مسیر استفاده کنید.

ورودی‌های قدیمی ‎`agents.default` هنگام بارگذاری به ‎`agents.main` مهاجرت داده می‌شوند.
زنجیره‌های shell مانند ‎`echo ok && pwd` همچنان نیاز دارند که هر بخش سطح‌بالا
قوانین فهرست مجاز را برآورده کند.

نمونه‌ها:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### محدود کردن آرگومان‌ها با argPattern

وقتی یک ورودی فهرست مجاز باید با یک باینری و یک شکل آرگومان
مشخص تطبیق کند، ‎`argPattern` را اضافه کنید. OpenClaw عبارت منظم را
روی آرگومان‌های فرمان parse‌شده ارزیابی می‌کند، بدون در نظر گرفتن توکن اجرایی
(‎`argv[0]`). برای ورودی‌هایی که دستی نوشته شده‌اند، آرگومان‌ها با یک
فاصله تکی به هم وصل می‌شوند، بنابراین وقتی به تطبیق دقیق نیاز دارید الگو را anchor کنید.

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

آن ورودی ‎`python3 safe.py` را مجاز می‌کند؛ ‎`python3 other.py` یک عدم تطبیق
فهرست مجاز است. اگر برای همان باینری یک ورودی فقط-مسیر نیز وجود داشته باشد، آرگومان‌های
تطبیق‌نخورده همچنان می‌توانند به آن ورودی فقط-مسیر fallback کنند. وقتی هدف
محدود کردن باینری به آرگومان‌های اعلام‌شده است، ورودی فقط-مسیر را حذف کنید.

ورودی‌هایی که توسط جریان‌های تأیید ذخیره می‌شوند می‌توانند از یک قالب جداکننده داخلی برای
تطبیق دقیق argv استفاده کنند. برای بازتولید آن ورودی‌ها، UI یا جریان تأیید را
به ویرایش دستی مقدار کدگذاری‌شده ترجیح دهید. اگر OpenClaw نتواند
argv را برای یک بخش فرمان parse کند، ورودی‌های دارای ‎`argPattern` تطبیق نمی‌کنند.

هر ورودی فهرست مجاز پشتیبانی می‌کند از:

| فیلد              | معنی                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | glob مسیر باینری resolve‌شده یا glob نام فرمان ساده           |
| `argPattern`       | regex اختیاری argv؛ ورودی‌های حذف‌شده فقط-مسیر هستند            |
| `id`               | UUID پایدار استفاده‌شده برای هویت UI                              |
| `source`           | منبع ورودی، مانند ‎`allow-always`                          |
| `commandText`      | متن فرمان ثبت‌شده وقتی یک جریان تأیید ورودی را ایجاد کرده است |
| `lastUsedAt`       | مهر زمانی آخرین استفاده                                           |
| `lastUsedCommand`  | آخرین فرمانی که تطبیق داشته است                                     |
| `lastResolvedPath` | آخرین مسیر باینری resolve‌شده                                     |

## مجازسازی خودکار CLIهای Skills

وقتی **مجازسازی خودکار CLIهای Skills** فعال باشد، فایل‌های اجرایی ارجاع‌شده توسط
Skills شناخته‌شده روی نودها (نود macOS یا میزبان نود headless)
به عنوان مجازشده در نظر گرفته می‌شوند. این کار از ‎`skills.bins` از طریق Gateway RPC برای دریافت
فهرست binهای skill استفاده می‌کند. اگر فهرست‌های مجاز دستی سخت‌گیرانه می‌خواهید، این گزینه را غیرفعال کنید.

<Warning>
- این یک **فهرست مجاز ضمنی برای راحتی** است، جدا از ورودی‌های دستی فهرست مجاز مسیر.
- برای محیط‌های اپراتور مورد اعتماد در نظر گرفته شده است که Gateway و نود در یک مرز اعتماد هستند.
- اگر به اعتماد صریح سخت‌گیرانه نیاز دارید، ‎`autoAllowSkills: false` را نگه دارید و فقط از ورودی‌های دستی فهرست مجاز مسیر استفاده کنید.

</Warning>

## binهای امن و هدایت تأیید

برای binهای امن (مسیر سریع فقط-stdin)، جزئیات اتصال مفسر، و
نحوه هدایت درخواست‌های تأیید به Slack/Discord/Telegram (یا اجرای آن‌ها به‌عنوان
کلاینت‌های تأیید native)، ببینید
[تأییدهای Exec - پیشرفته](/fa/tools/exec-approvals-advanced).

## ویرایش Control UI

برای ویرایش پیش‌فرض‌ها، overrideهای هر عامل، و فهرست‌های مجاز، از کارت **Control UI → Nodes → Exec approvals** استفاده کنید.
یک scope (Defaults یا یک عامل) انتخاب کنید،
سیاست را تنظیم کنید، الگوهای فهرست مجاز را اضافه/حذف کنید، سپس **Save** را بزنید. UI
فراداده آخرین استفاده را برای هر الگو نشان می‌دهد تا بتوانید فهرست را مرتب نگه دارید.

گزینشگر هدف **Gateway** (تأییدهای محلی) یا یک **Node** را انتخاب می‌کند.
نودها باید ‎`system.execApprovals.get/set` را advertise کنند (برنامه macOS یا
میزبان نود headless). اگر یک نود هنوز exec approvals را advertise نمی‌کند،
فایل تأییدهای محلی آن را مستقیماً ویرایش کنید.

CLI: ‎`openclaw approvals` از ویرایش gateway یا node پشتیبانی می‌کند - ببینید
[CLI تأییدها](/fa/cli/approvals).

## جریان تأیید

وقتی یک درخواست لازم باشد، Gateway
‎`exec.approval.requested` را برای کلاینت‌های اپراتور broadcast می‌کند. Control UI و برنامه macOS
آن را از طریق ‎`exec.approval.resolve` resolve می‌کنند، سپس Gateway درخواست
تأییدشده را به میزبان نود forward می‌کند.

برای ‎`host=node`، درخواست‌های تأیید شامل payload متعارف ‎`systemRunPlan`
هستند. Gateway هنگام forward کردن درخواست‌های تأییدشده ‎`system.run`
از آن plan به عنوان زمینه معتبر command/cwd/session استفاده می‌کند.

این برای latency تأیید async مهم است:

- مسیر exec نود از ابتدا یک plan متعارف آماده می‌کند.
- رکورد تأیید آن plan و فراداده binding آن را ذخیره می‌کند.
- پس از تأیید، فراخوانی نهایی forward‌شده ‎`system.run` به جای اعتماد به ویرایش‌های بعدی caller، از plan ذخیره‌شده دوباره استفاده می‌کند.
- اگر caller پس از ایجاد درخواست تأیید، ‎`command`، ‎`rawCommand`، ‎`cwd`، ‎`agentId`، یا ‎`sessionKey` را تغییر دهد، Gateway اجرای forward‌شده را به عنوان عدم تطبیق تأیید رد می‌کند.

## رویدادهای سیستم

چرخه عمر exec به صورت پیام‌های سیستم ارائه می‌شود:

- ‎`Exec running` (فقط اگر فرمان از آستانه اعلان running عبور کند).
- ‎`Exec finished`.

این‌ها پس از گزارش رویداد توسط نود، در نشست عامل posted می‌شوند.
تأییدهای exec ردشده برای خود فرمان میزبان terminal هستند: فرمان
اجرا نمی‌شود. برای تأییدهای async عامل اصلی با یک نشست مبدأ،
OpenClaw رد شدن را به عنوان یک followup داخلی به همان نشست post می‌کند تا
عامل بتواند انتظار برای فرمان async را متوقف کند و از repair نتیجه گمشده جلوگیری کند.
اگر نشستی وجود نداشته باشد یا نشست قابل resume نباشد، OpenClaw همچنان می‌تواند
یک رد کوتاه را به اپراتور یا مسیر چت مستقیم گزارش کند. رد شدن‌ها برای
نشست‌های subagent به subagent post نمی‌شوند.
تأییدهای exec با میزبان Gateway همان رویدادهای چرخه عمر را وقتی
فرمان تمام می‌شود emit می‌کنند (و به صورت اختیاری وقتی بیشتر از آستانه اجرا می‌شود).
execهای gated با تأیید از id تأیید به عنوان ‎`runId` در این
پیام‌ها برای correlation آسان استفاده می‌کنند.

## رفتار تأیید ردشده

وقتی یک تأیید exec async رد می‌شود، OpenClaw فرمان میزبان را
terminal و fail-closed در نظر می‌گیرد. برای نشست‌های عامل اصلی، رد شدن به عنوان یک
followup نشست داخلی تحویل داده می‌شود که به عامل می‌گوید فرمان async اجرا نشده است.
این تداوم transcript را بدون افشای خروجی فرمان stale حفظ می‌کند. اگر
تحویل نشست در دسترس نباشد، OpenClaw وقتی یک مسیر امن وجود داشته باشد به یک رد کوتاه برای اپراتور یا
چت مستقیم fallback می‌کند.

## پیامدها

- **`full`** قدرتمند است؛ هر جا ممکن است فهرست‌های مجاز را ترجیح دهید.
- **`ask`** شما را در حلقه نگه می‌دارد و همچنان تأییدهای سریع را ممکن می‌کند.
- فهرست‌های مجاز هر عامل از نشت تأییدهای یک عامل به دیگران جلوگیری می‌کنند.
- تأییدها فقط برای درخواست‌های exec میزبان از **فرستندگان مجاز** اعمال می‌شوند. فرستندگان غیرمجاز نمی‌توانند ‎`/exec` صادر کنند.
- ‎`/exec security=full` یک راحتی سطح نشست برای اپراتورهای مجاز است و طبق طراحی تأییدها را رد می‌کند. برای hard-block کردن exec میزبان، security تأییدها را روی ‎`deny` تنظیم کنید یا ابزار ‎`exec` را از طریق سیاست ابزار deny کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/fa/tools/exec-approvals-advanced" icon="gear">
    binهای امن، اتصال مفسر، و هدایت تأیید به چت.
  </Card>
  <Card title="Exec tool" href="/fa/tools/exec" icon="terminal">
    ابزار اجرای فرمان shell.
  </Card>
  <Card title="Elevated mode" href="/fa/tools/elevated" icon="shield-exclamation">
    مسیر اضطراری که تأییدها را نیز رد می‌کند.
  </Card>
  <Card title="Sandboxing" href="/fa/gateway/sandboxing" icon="box">
    حالت‌های sandbox و دسترسی به workspace.
  </Card>
  <Card title="Security" href="/fa/gateway/security" icon="lock">
    مدل امنیتی و سخت‌سازی.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/fa/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    چه زمانی سراغ هر کنترل بروید.
  </Card>
  <Card title="Skills" href="/fa/tools/skills" icon="sparkles">
    رفتار مجازسازی خودکار مبتنی بر Skills.
  </Card>
</CardGroup>
