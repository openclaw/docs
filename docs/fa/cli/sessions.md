---
read_when:
    - می‌خواهید نشست‌های ذخیره‌شده را فهرست کنید و فعالیت‌های اخیر را ببینید
summary: مرجع CLI برای `openclaw sessions` (فهرست نشست‌های ذخیره‌شده + نحوهٔ استفاده)
title: جلسات
x-i18n:
    generated_at: "2026-05-05T08:25:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

نشست‌های گفت‌وگوی ذخیره‌شده را فهرست می‌کند.

فهرست نشست‌ها بررسی زنده‌بودن کانال/ارائه‌دهنده نیستند. آن‌ها ردیف‌های
گفت‌وگوی ماندگارشده از ذخیره‌گاه‌های نشست را نشان می‌دهند. یک کانال آرام Discord، Slack، Telegram یا
کانال دیگر می‌تواند بدون ایجاد ردیف نشست جدید دوباره با موفقیت وصل شود
تا زمانی که پیامی پردازش شود. وقتی به اتصال زنده
کانال نیاز دارید، از `openclaw channels status --probe`،
`openclaw status --deep` یا `openclaw health --verbose` استفاده کنید.

پاسخ‌های `openclaw sessions` و Gateway `sessions.list` به‌طور
پیش‌فرض محدود می‌شوند تا ذخیره‌گاه‌های بزرگ و طولانی‌مدت نتوانند فرایند CLI یا حلقه
رویداد Gateway را در انحصار بگیرند. CLI به‌طور پیش‌فرض ۱۰۰ نشست جدیدتر را برمی‌گرداند؛
برای بازه کوچک‌تر/بزرگ‌تر `--limit <n>` را پاس دهید یا وقتی عمداً
به کل ذخیره‌گاه نیاز دارید از `--limit all` استفاده کنید. پاسخ‌های JSON شامل
`totalCount`، `limitApplied` و
`hasMore` هستند تا فراخوان‌ها بتوانند نشان دهند ردیف‌های بیشتری وجود دارد.

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
- `--verbose`: ثبت گزارش با جزئیات
- `--agent <id>`: یک ذخیره‌گاه عامل پیکربندی‌شده
- `--all-agents`: تجمیع همه ذخیره‌گاه‌های عامل پیکربندی‌شده
- `--store <path>`: مسیر صریح ذخیره‌گاه (نمی‌توان آن را با `--agent` یا `--all-agents` ترکیب کرد)
- `--limit <n|all>`: حداکثر ردیف‌های خروجی (پیش‌فرض `100`؛ `all` خروجی کامل را برمی‌گرداند)

خروجی گرفتن از یک بسته مسیر اجرا برای یک نشست ذخیره‌شده:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

این همان مسیر دستوری است که فرمان اسلش `/export-trajectory` پس از
تأیید درخواست اجرا توسط مالک استفاده می‌کند. دایرکتوری خروجی همیشه
داخل `.openclaw/trajectory-exports/` زیر فضای کاری انتخاب‌شده resolve می‌شود.

`openclaw sessions --all-agents` ذخیره‌گاه‌های عامل پیکربندی‌شده را می‌خواند. کشف نشست Gateway و ACP
گسترده‌تر است: آن‌ها ذخیره‌گاه‌های فقط-دیسک پیدا‌شده زیر
ریشه پیش‌فرض `agents/` یا ریشه قالب‌دار `session.store` را نیز شامل می‌شوند. آن
ذخیره‌گاه‌های کشف‌شده باید به فایل‌های عادی `sessions.json` داخل
ریشه عامل resolve شوند؛ symlinkها و مسیرهای خارج از ریشه نادیده گرفته می‌شوند.

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

نگهداری را اکنون اجرا کنید (به‌جای انتظار برای چرخه نوشتن بعدی):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` از تنظیمات `session.maintenance` در پیکربندی استفاده می‌کند:

- نکته دامنه: `openclaw sessions cleanup` ذخیره‌گاه‌های نشست، transcriptها و sidecarهای مسیر اجرا را نگهداری می‌کند. این دستور گزارش‌های اجرای cron (`cron/runs/<jobId>.jsonl`) را هرس نمی‌کند؛ آن‌ها با `cron.runLog.maxBytes` و `cron.runLog.keepLines` در [پیکربندی Cron](/fa/automation/cron-jobs#configuration) مدیریت می‌شوند و در [نگهداری Cron](/fa/automation/cron-jobs#maintenance) توضیح داده شده‌اند.
- پاک‌سازی همچنین transcriptهای اصلی بدون ارجاع، checkpointهای Compaction و sidecarهای مسیر اجرای قدیمی‌تر از `session.maintenance.pruneAfter` را هرس می‌کند؛ فایل‌هایی که هنوز توسط `sessions.json` ارجاع داده شده‌اند حفظ می‌شوند.

- `--dry-run`: پیش‌نمایش تعداد ورودی‌هایی که بدون نوشتن هرس/محدود می‌شوند.
  - در حالت متن، dry-run یک جدول اقدام برای هر نشست چاپ می‌کند (`Action`, `Key`, `Age`, `Model`, `Flags`) تا بتوانید ببینید چه چیزی حفظ و چه چیزی حذف می‌شود.
- `--enforce`: اعمال نگهداری حتی وقتی `session.maintenance.mode` برابر `warn` است.
- `--fix-missing`: حذف ورودی‌هایی که فایل‌های transcript آن‌ها مفقود است، حتی اگر در حالت عادی هنوز به‌خاطر سن/تعداد حذف نمی‌شدند.
- `--active-key <key>`: محافظت از یک کلید فعال مشخص در برابر حذف به‌دلیل بودجه دیسک. اشاره‌گرهای پایدار گفت‌وگوی خارجی، مانند نشست‌های گروهی و نشست‌های گفت‌وگوی thread-scoped، نیز توسط نگهداری سن/تعداد/بودجه دیسک حفظ می‌شوند.
- `--agent <id>`: اجرای پاک‌سازی برای یک ذخیره‌گاه عامل پیکربندی‌شده.
- `--all-agents`: اجرای پاک‌سازی برای همه ذخیره‌گاه‌های عامل پیکربندی‌شده.
- `--store <path>`: اجرا روی یک فایل مشخص `sessions.json`.
- `--json`: چاپ خلاصه JSON. با `--all-agents`، خروجی شامل یک خلاصه برای هر ذخیره‌گاه است.

وقتی یک Gateway در دسترس باشد، پاک‌سازی غیر dry-run برای ذخیره‌گاه‌های عامل پیکربندی‌شده
از طریق Gateway ارسال می‌شود تا همان نویسنده ذخیره‌گاه نشست را با ترافیک زمان اجرا
به اشتراک بگذارد. برای تعمیر آفلاین صریح یک فایل ذخیره‌گاه از `--store <path>` استفاده کنید.

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
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

مرتبط:

- پیکربندی نشست: [مرجع پیکربندی](/fa/gateway/config-agents#session)

## مرتبط

- [مرجع CLI](/fa/cli)
- [مدیریت نشست](/fa/concepts/session)
