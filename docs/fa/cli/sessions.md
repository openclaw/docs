---
read_when:
    - می‌خواهید نشست‌های ذخیره‌شده را فهرست کنید و فعالیت‌های اخیر را ببینید
summary: مرجع CLI برای `openclaw sessions` (فهرست نشست‌های ذخیره‌شده + نحوهٔ استفاده)
title: نشست‌ها
x-i18n:
    generated_at: "2026-04-29T22:38:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

نشست‌های گفت‌وگوی ذخیره‌شده را فهرست کنید.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

انتخاب دامنه:

- پیش‌فرض: فروشگاه عامل پیش‌فرض پیکربندی‌شده
- `--verbose`: ثبت گزارش با جزئیات
- `--agent <id>`: یک فروشگاه عامل پیکربندی‌شده
- `--all-agents`: تجمیع همهٔ فروشگاه‌های عامل پیکربندی‌شده
- `--store <path>`: مسیر صریح فروشگاه (نمی‌توان آن را با `--agent` یا `--all-agents` ترکیب کرد)

یک بستهٔ مسیر اجرا را برای یک نشست ذخیره‌شده صادر کنید:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

این همان مسیر فرمانی است که دستور اسلش `/export-trajectory` پس از تأیید درخواست اجرا توسط مالک از آن استفاده می‌کند. پوشهٔ خروجی همیشه داخل `.openclaw/trajectory-exports/` در فضای کاری انتخاب‌شده resolve می‌شود.

`openclaw sessions --all-agents` فروشگاه‌های عامل پیکربندی‌شده را می‌خواند. کشف نشست‌های Gateway و ACP گسترده‌تر است: آن‌ها همچنین فروشگاه‌های فقط-دیسکی را که زیر ریشهٔ پیش‌فرض `agents/` یا ریشهٔ قالب‌دار `session.store` پیدا می‌شوند، شامل می‌کنند. آن فروشگاه‌های کشف‌شده باید به فایل‌های معمولی `sessions.json` داخل ریشهٔ عامل resolve شوند؛ symlinkها و مسیرهای خارج از ریشه نادیده گرفته می‌شوند.

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

## نگهداری پاک‌سازی

نگهداری را اکنون اجرا کنید (به‌جای انتظار برای چرخهٔ نوشتن بعدی):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` از تنظیمات `session.maintenance` در پیکربندی استفاده می‌کند:

- نکتهٔ دامنه: `openclaw sessions cleanup` فروشگاه‌های نشست، رونوشت‌ها، و sidecarهای مسیر اجرا را نگهداری می‌کند. این فرمان گزارش‌های اجرای cron را (`cron/runs/<jobId>.jsonl`) هرس نمی‌کند؛ آن‌ها با `cron.runLog.maxBytes` و `cron.runLog.keepLines` در [پیکربندی Cron](/fa/automation/cron-jobs#configuration) مدیریت می‌شوند و در [نگهداری Cron](/fa/automation/cron-jobs#maintenance) توضیح داده شده‌اند.

- `--dry-run`: پیش‌نمایش تعداد ورودی‌هایی که بدون نوشتن هرس/محدود می‌شوند.
  - در حالت متنی، dry-run یک جدول اقدام برای هر نشست چاپ می‌کند (`Action`, `Key`, `Age`, `Model`, `Flags`) تا بتوانید ببینید چه چیزهایی نگه داشته می‌شوند و چه چیزهایی حذف می‌شوند.
- `--enforce`: نگهداری را حتی وقتی `session.maintenance.mode` برابر `warn` است اعمال می‌کند.
- `--fix-missing`: ورودی‌هایی را که فایل‌های رونوشتشان وجود ندارد حذف می‌کند، حتی اگر در حالت عادی هنوز بر اساس سن/تعداد حذف نمی‌شدند.
- `--active-key <key>`: یک کلید فعال مشخص را از حذف به‌دلیل بودجهٔ دیسک محافظت می‌کند.
- `--agent <id>`: پاک‌سازی را برای یک فروشگاه عامل پیکربندی‌شده اجرا می‌کند.
- `--all-agents`: پاک‌سازی را برای همهٔ فروشگاه‌های عامل پیکربندی‌شده اجرا می‌کند.
- `--store <path>`: روی یک فایل مشخص `sessions.json` اجرا می‌شود.
- `--json`: یک خلاصهٔ JSON چاپ می‌کند. با `--all-agents`، خروجی شامل یک خلاصه برای هر فروشگاه است.

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
