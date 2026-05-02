---
read_when:
    - می‌خواهید جلسات ذخیره‌شده را فهرست کنید و فعالیت اخیر را ببینید
summary: مرجع CLI برای `openclaw sessions` (فهرست کردن نشست‌های ذخیره‌شده + نحوه استفاده)
title: نشست‌ها
x-i18n:
    generated_at: "2026-05-02T20:42:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c9ec3ca55f7c5b6217b481e9da62f5416df73e69405a0dc15e77d2afeac723f
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

نشست‌های مکالمه ذخیره‌شده را فهرست کنید.

فهرست‌های نشست، بررسی زنده‌بودن کانال/ارائه‌دهنده نیستند. آن‌ها ردیف‌های
مکالمه پایدارشده را از ذخیره‌گاه‌های نشست نشان می‌دهند. یک کانال ساکت Discord،
Slack، Telegram یا کانالی دیگر می‌تواند بدون ایجاد ردیف نشست جدید، تا زمانی که
پیامی پردازش شود، با موفقیت دوباره وصل شود. وقتی به اتصال زنده کانال نیاز دارید،
از `openclaw channels status --probe`،‏ `openclaw status --deep` یا
`openclaw health --verbose` استفاده کنید.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

انتخاب دامنه:

- پیش‌فرض: ذخیره‌گاه عامل پیش‌فرض پیکربندی‌شده
- `--verbose`: ثبت گزارش تفصیلی
- `--agent <id>`: یک ذخیره‌گاه عامل پیکربندی‌شده
- `--all-agents`: تجمیع همه ذخیره‌گاه‌های عامل پیکربندی‌شده
- `--store <path>`: مسیر صریح ذخیره‌گاه (نمی‌تواند با `--agent` یا `--all-agents` ترکیب شود)

یک بسته مسیر اجرا برای یک نشست ذخیره‌شده صادر کنید:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

این همان مسیر دستوری است که پس از تایید درخواست اجرا توسط مالک، توسط دستور اسلش
`/export-trajectory` استفاده می‌شود. دایرکتوری خروجی همیشه داخل
`.openclaw/trajectory-exports/` زیر فضای کاری انتخاب‌شده resolve می‌شود.

`openclaw sessions --all-agents` ذخیره‌گاه‌های عامل پیکربندی‌شده را می‌خواند.
کشف نشست Gateway و ACP گسترده‌تر است: آن‌ها ذخیره‌گاه‌های فقط-دیسک را هم که زیر
ریشه پیش‌فرض `agents/` یا ریشه قالب‌دار `session.store` پیدا می‌شوند شامل
می‌کنند. این ذخیره‌گاه‌های کشف‌شده باید به فایل‌های معمولی `sessions.json` داخل
ریشه عامل resolve شوند؛ پیوندهای نمادین و مسیرهای خارج از ریشه نادیده گرفته
می‌شوند.

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
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## نگه‌داری پاک‌سازی

نگه‌داری را اکنون اجرا کنید (به‌جای انتظار برای چرخه نوشتن بعدی):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` از تنظیمات `session.maintenance` در پیکربندی استفاده می‌کند:

- نکته دامنه: `openclaw sessions cleanup` ذخیره‌گاه‌های نشست، transcriptها و فایل‌های جانبی مسیر اجرا را نگه‌داری می‌کند. این دستور گزارش‌های اجرای cron (`cron/runs/<jobId>.jsonl`) را هرس نمی‌کند؛ آن‌ها توسط `cron.runLog.maxBytes` و `cron.runLog.keepLines` در [پیکربندی Cron](/fa/automation/cron-jobs#configuration) مدیریت می‌شوند و در [نگه‌داری Cron](/fa/automation/cron-jobs#maintenance) توضیح داده شده‌اند.

- `--dry-run`: پیش‌نمایش تعداد ورودی‌هایی که بدون نوشتن هرس/محدود می‌شوند.
  - در حالت متنی، dry-run یک جدول اقدام برای هر نشست چاپ می‌کند (`Action`، `Key`، `Age`، `Model`، `Flags`) تا بتوانید ببینید چه چیزی نگه داشته می‌شود و چه چیزی حذف می‌شود.
- `--enforce`: نگه‌داری را حتی وقتی `session.maintenance.mode` برابر `warn` است اعمال می‌کند.
- `--fix-missing`: ورودی‌هایی را که فایل‌های transcript آن‌ها گم شده‌اند حذف می‌کند، حتی اگر به طور عادی هنوز از نظر سن/تعداد مشمول حذف نمی‌شدند.
- `--active-key <key>`: از یک کلید فعال مشخص در برابر تخلیه ناشی از بودجه دیسک محافظت می‌کند. اشاره‌گرهای بادوام مکالمه خارجی، مانند نشست‌های گروهی و نشست‌های گفت‌وگوی محدود به thread، نیز توسط نگه‌داری سن/تعداد/بودجه دیسک نگه داشته می‌شوند.
- `--agent <id>`: پاک‌سازی را برای یک ذخیره‌گاه عامل پیکربندی‌شده اجرا می‌کند.
- `--all-agents`: پاک‌سازی را برای همه ذخیره‌گاه‌های عامل پیکربندی‌شده اجرا می‌کند.
- `--store <path>`: روی یک فایل `sessions.json` مشخص اجرا می‌کند.
- `--json`: خلاصه JSON چاپ می‌کند. با `--all-agents`، خروجی شامل یک خلاصه برای هر ذخیره‌گاه است.

وقتی یک Gateway در دسترس باشد، پاک‌سازی غیر dry-run برای ذخیره‌گاه‌های عامل
پیکربندی‌شده از طریق Gateway فرستاده می‌شود تا همان نویسنده ذخیره‌گاه نشست
را که ترافیک زمان اجرا استفاده می‌کند به اشتراک بگذارد. برای تعمیر آفلاین صریح
یک فایل ذخیره‌گاه، از `--store <path>` استفاده کنید.

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
