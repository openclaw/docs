---
read_when:
    - می‌خواهید نشست‌های ذخیره‌شده را فهرست کنید و فعالیت‌های اخیر را ببینید
summary: مرجع CLI برای `openclaw sessions` (فهرست نشست‌های ذخیره‌شده + کاربرد)
title: نشست‌ها
x-i18n:
    generated_at: "2026-06-27T17:28:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

نشست‌های گفتگوی ذخیره‌شده را فهرست می‌کند.

فهرست‌های نشست، بررسی زنده‌بودن کانال/ارائه‌دهنده نیستند. آن‌ها ردیف‌های
گفتگوی پایدارشده از ذخیره‌گاه‌های نشست را نشان می‌دهند. یک کانال ساکتِ Discord، Slack، Telegram یا
کانال دیگر می‌تواند بدون ایجاد ردیف نشست جدید، تا زمانی که پیامی پردازش شود،
با موفقیت دوباره متصل شود. وقتی به اتصال زنده کانال نیاز دارید، از
`openclaw channels status --probe`،
`openclaw status --deep`، یا `openclaw health --verbose` استفاده کنید.

پاسخ‌های `openclaw sessions` و Gateway `sessions.list` به‌طور پیش‌فرض محدود هستند
تا ذخیره‌گاه‌های بزرگ و طولانی‌عمر نتوانند فرایند CLI یا حلقه رویداد Gateway را
انحصاری کنند. CLI به‌طور پیش‌فرض ۱۰۰ نشست جدیدتر را برمی‌گرداند؛ برای پنجره‌ای
کوچک‌تر/بزرگ‌تر `--limit <n>` را بفرستید، یا وقتی عمداً به کل ذخیره‌گاه نیاز دارید
از `--limit all` استفاده کنید. پاسخ‌های JSON وقتی فراخوان‌ها نیاز دارند نشان دهند
ردیف‌های بیشتری وجود دارد، شامل `totalCount`، `limitApplied` و `hasMore` هستند.

کلاینت‌های RPC می‌توانند `configuredAgentsOnly: true` را بفرستند تا منبع کشف
ترکیبی گسترده حفظ شود اما فقط ردیف‌های عامل‌هایی برگردد که هم‌اکنون در پیکربندی
حاضر هستند. Control UI به‌طور پیش‌فرض از این حالت استفاده می‌کند تا ذخیره‌گاه‌های
عامل حذف‌شده یا فقط-دیسک دوباره در نمای Sessions ظاهر نشوند.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

انتخاب دامنه:

- پیش‌فرض: ذخیره‌گاه عامل پیش‌فرض پیکربندی‌شده
- `--verbose`: گزارش‌گیری مشروح
- `--agent <id>`: یک ذخیره‌گاه عامل پیکربندی‌شده
- `--all-agents`: تجمیع همه ذخیره‌گاه‌های عامل پیکربندی‌شده
- `--store <path>`: مسیر ذخیره‌گاه صریح (نمی‌تواند با `--agent` یا `--all-agents` ترکیب شود)
- `--limit <n|all>`: بیشینه ردیف‌های خروجی (پیش‌فرض `100`؛ `all` خروجی کامل را برمی‌گرداند)

پیشرفت مسیر قابل‌خواندن برای انسان را برای نشست‌های ذخیره‌شده دنبال کنید:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` رویدادهای اخیر JSONL مسیر را به‌صورت خطوط پیشرفت فشرده نمایش می‌دهد. بدون `--session-key`، ابتدا نشست‌های در حال اجرا و سپس آخرین نشست ذخیره‌شده را دنبال می‌کند. `--tail <count>` کنترل می‌کند چند رویداد موجود پیش از حالت دنبال‌کردن چاپ شوند؛ مقدار پیش‌فرض `80` است و `0` از انتهای فعلی شروع می‌کند. `--follow` به تماشای فایل‌های مسیر انتخاب‌شده ادامه می‌دهد، از جمله فایل‌های جابه‌جاشده‌ای که با `<session>.trajectory-path.json` ارجاع شده‌اند.

نمای پیشرفت عمداً محافظه‌کارانه است: متن پرامپت، آرگومان‌های ابزار، و بدنه‌های نتیجه ابزار چاپ نمی‌شوند. فراخوانی‌های ابزار نام ابزار را با `{...redacted...}` نشان می‌دهند؛ نتایج ابزار وضعیت‌هایی مانند `ok`، `error` یا `done` را نشان می‌دهند؛ خطوط تکمیل مدل ارائه‌دهنده/مدل و وضعیت پایانی را نشان می‌دهند.

یک بسته مسیر برای یک نشست ذخیره‌شده صادر کنید:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

این همان مسیر فرمانی است که فرمان اسلش `/export-trajectory` پس از تأیید درخواست exec توسط مالک استفاده می‌کند. دایرکتوری خروجی همیشه داخل `.openclaw/trajectory-exports/` زیر فضای کاری انتخاب‌شده حل می‌شود.

`openclaw sessions --all-agents` ذخیره‌گاه‌های عامل پیکربندی‌شده را می‌خواند. کشف نشست Gateway و ACP
گسترده‌تر است: آن‌ها ذخیره‌گاه‌های فقط-دیسک یافت‌شده زیر ریشه پیش‌فرض `agents/` یا یک ریشه قالب‌دار `session.store` را نیز شامل می‌شوند. آن ذخیره‌گاه‌های کشف‌شده باید به فایل‌های عادی `sessions.json` داخل ریشه عامل حل شوند؛ پیوندهای نمادین و مسیرهای خارج از ریشه نادیده گرفته می‌شوند.

نمونه‌های JSON:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## نگهداری پاک‌سازی

همین حالا نگهداری را اجرا کنید (به‌جای انتظار برای چرخه نوشتن بعدی):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` از تنظیمات `session.maintenance` در پیکربندی استفاده می‌کند:

- یادداشت دامنه: `openclaw sessions cleanup` ذخیره‌گاه‌های نشست، رونویس‌ها، و فایل‌های جانبی مسیر را نگهداری می‌کند. این فرمان تاریخچه اجرای Cron را هرس نمی‌کند؛ آن تاریخچه با `cron.runLog.keepLines` در [پیکربندی Cron](/fa/automation/cron-jobs#configuration) مدیریت می‌شود و در [نگهداری Cron](/fa/automation/cron-jobs#maintenance) توضیح داده شده است.
- پاک‌سازی همچنین رونویس‌های اصلی بدون ارجاع، نقاط بررسی Compaction، و فایل‌های جانبی مسیر قدیمی‌تر از `session.maintenance.pruneAfter` را هرس می‌کند؛ فایل‌هایی که هنوز توسط `sessions.json` ارجاع شده‌اند حفظ می‌شوند.
- پاک‌سازی، پاک‌سازی کوتاه‌عمر کاوش اجرای مدل Gateway را جداگانه با عنوان `modelRunPruned` گزارش می‌کند. این فقط با کلیدهای صریح سخت‌گیرانه‌ای مطابقت دارد که شکلی مانند `agent:*:explicit:model-run-<uuid>` دارند. نگهداری ثابت `24h` است، اما با فشار محدود می‌شود: فقط وقتی فشار نگهداری/سقف ورودی نشست رسیده باشد، ردیف‌های کاوش کهنه را حذف می‌کند. وقتی اجرا می‌شود، پاک‌سازی اجرای مدل پیش از پاک‌سازی کهنگی سراسری و سقف‌گذاری انجام می‌شود.

- `--dry-run`: پیش‌نمایش اینکه چند ورودی بدون نوشتن هرس/سقف‌گذاری می‌شوند.
  - در حالت متن، اجرای خشک یک جدول اقدام به‌ازای هر نشست چاپ می‌کند (`Action`، `Key`، `Age`، `Model`، `Flags`) به‌همراه خلاصه‌ای گروه‌بندی‌شده بر اساس برچسب نشست تا بتوانید ببینید چه چیزی نگه داشته می‌شود و چه چیزی حذف می‌شود.
- `--enforce`: نگهداری را حتی وقتی `session.maintenance.mode` برابر `warn` است اعمال می‌کند.
- `--fix-missing`: ورودی‌هایی را که فایل‌های رونویس آن‌ها گم شده یا فقط سربرگ/خالی هستند حذف می‌کند، حتی اگر هنوز به‌طور عادی به‌دلیل سن/تعداد خارج نمی‌شدند.
- `--fix-dm-scope`: وقتی `session.dmScope` برابر `main` است، ردیف‌های مستقیم-DM کهنه با کلید همتا را که از مسیریابی‌های قبلی `per-peer`، `per-channel-peer` یا `per-account-channel-peer` باقی مانده‌اند بازنشسته می‌کند. ابتدا از `--dry-run` استفاده کنید؛ اعمال پاک‌سازی آن ردیف‌ها را از `sessions.json` حذف می‌کند و رونویس‌هایشان را به‌عنوان بایگانی‌های حذف‌شده حفظ می‌کند.
- `--active-key <key>`: یک کلید فعال مشخص را از بیرون‌ریزی بودجه دیسک محافظت می‌کند. اشاره‌گرهای گفتگوی خارجی بادوام، مانند نشست‌های گروهی و نشست‌های چت محدود به رشته، نیز توسط نگهداری سن/تعداد/بودجه دیسک نگه داشته می‌شوند.
- `--agent <id>`: پاک‌سازی را برای یک ذخیره‌گاه عامل پیکربندی‌شده اجرا می‌کند.
- `--all-agents`: پاک‌سازی را برای همه ذخیره‌گاه‌های عامل پیکربندی‌شده اجرا می‌کند.
- `--store <path>`: روی یک فایل `sessions.json` مشخص اجرا می‌شود.
- `--json`: خلاصه JSON چاپ می‌کند. با `--all-agents`، خروجی شامل یک خلاصه برای هر ذخیره‌گاه است.

وقتی یک Gateway در دسترس باشد، پاک‌سازی غیر خشک برای ذخیره‌گاه‌های عامل پیکربندی‌شده از طریق Gateway فرستاده می‌شود تا همان نویسنده ذخیره‌گاه نشست را با ترافیک زمان اجرا به‌اشتراک بگذارد. برای تعمیر آفلاین صریح یک فایل ذخیره‌گاه از `--store <path>` استفاده کنید.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## فشرده‌سازی یک نشست

بودجه زمینه را برای یک نشست گیرکرده یا بیش‌ازحد بزرگ بازیابی کنید. `openclaw sessions compact <key>` پوشش درجه‌اول پیرامون Gateway RPC با نام `sessions.compact` است و به یک Gateway در حال اجرا نیاز دارد.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- بدون `--max-lines`، Gateway رونویس را با LLM خلاصه می‌کند. این می‌تواند کند باشد، بنابراین مقدار پیش‌فرض `--timeout` برابر `180000` میلی‌ثانیه است.
- با `--max-lines <n>`، آن را به آخرین `n` خط رونویس کوتاه می‌کند و رونویس قبلی را به‌عنوان فایل جانبی `.bak` بایگانی می‌کند.
- `--agent <id>`: عاملی که مالک نشست است؛ برای کلیدهای `global` الزامی است.
- `--url` / `--token` / `--password`: بازنویسی‌های اتصال Gateway.
- `--timeout <ms>`: مهلت RPC بر حسب میلی‌ثانیه.
- `--json`: محموله خام RPC را چاپ می‌کند.

وقتی Gateway یک Compaction ناموفق گزارش کند یا در دسترس نباشد، فرمان با وضعیت غیرصفر خارج می‌شود، بنابراین cronها و اسکریپت‌ها هرگز یک بی‌عملی خاموش را با موفقیت اشتباه نمی‌گیرند.

> نکته: `openclaw agent --message '/compact ...'` مسیر Compaction نیست. فرمان‌های اسلش از CLI توسط بررسی فرستنده مجاز رد می‌شوند؛ آن فراخوانی به‌جای بی‌عملی خاموش، با وضعیت غیرصفر و راهنمایی ارجاع‌دهنده به اینجا خارج می‌شود.

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` می‌پذیرد:

| فیلد      | نوع        | الزامی | توضیح                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | رشته      | بله      | کلید نشست برای فشرده‌سازی (برای مثال `agent:main:main`).    |
| `agentId`  | رشته      | خیر       | شناسه عاملی که مالک نشست است (برای کلیدهای `global`).        |
| `maxLines` | عدد صحیح ≥ 1 | خیر       | به‌جای خلاصه‌سازی LLM، به آخرین N خط کوتاه می‌کند. |

نمونه پاسخ خلاصه‌سازی LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

نمونه پاسخ کوتاه‌سازی (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## مرتبط

- پیکربندی نشست: [مرجع پیکربندی](/fa/gateway/config-agents#session)
- [مرجع CLI](/fa/cli)
- [مدیریت نشست](/fa/concepts/session)
