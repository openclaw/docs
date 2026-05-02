---
read_when:
    - می‌خواهید جلسه‌های ذخیره‌شده را فهرست کنید و فعالیت اخیر را ببینید
summary: مرجع CLI برای `openclaw sessions` (فهرست‌کردن نشست‌های ذخیره‌شده + نحوهٔ استفاده)
title: نشست‌ها
x-i18n:
    generated_at: "2026-05-02T11:40:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c7f0d521756ace4af05451b925256f89661bf971533541764c128e2be9d6431
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

نشست‌های مکالمه ذخیره‌شده را فهرست کنید.

فهرست نشست‌ها بررسی زنده‌بودن کانال/ارائه‌دهنده نیستند. آن‌ها ردیف‌های
مکالمه پایدارشده را از ذخیره‌گاه‌های نشست نشان می‌دهند. یک Discord، Slack، Telegram، یا
کانال دیگر که ساکت است می‌تواند بدون ایجاد ردیف نشست جدید با موفقیت دوباره وصل شود
تا زمانی که پیامی پردازش شود. وقتی به اتصال زنده کانال نیاز دارید از
`openclaw channels status --probe`، `openclaw status --deep`، یا
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
- `--verbose`: ثبت گزارش مفصل
- `--agent <id>`: یک ذخیره‌گاه عامل پیکربندی‌شده
- `--all-agents`: تجمیع همه ذخیره‌گاه‌های عامل پیکربندی‌شده
- `--store <path>`: مسیر ذخیره‌گاه صریح (نمی‌تواند با `--agent` یا `--all-agents` ترکیب شود)

یک بسته مسیر حرکت را برای یک نشست ذخیره‌شده صادر کنید:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

این مسیر فرمانی است که پس از تأیید درخواست exec توسط مالک، فرمان اسلش `/export-trajectory` از آن استفاده می‌کند. دایرکتوری خروجی همیشه داخل `.openclaw/trajectory-exports/` زیر فضای کاری انتخاب‌شده resolve می‌شود.

`openclaw sessions --all-agents` ذخیره‌گاه‌های عامل پیکربندی‌شده را می‌خواند. کشف نشست Gateway و ACP گسترده‌تر است: آن‌ها ذخیره‌گاه‌های فقط-دیسک را هم که زیر ریشه پیش‌فرض `agents/` یا ریشه قالب‌دار `session.store` پیدا می‌شوند شامل می‌کنند. آن ذخیره‌گاه‌های کشف‌شده باید به فایل‌های عادی `sessions.json` داخل ریشه عامل resolve شوند؛ symlinkها و مسیرهای بیرون از ریشه نادیده گرفته می‌شوند.

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

نگهداری را همین حالا اجرا کنید (به‌جای انتظار برای چرخه نوشتن بعدی):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` از تنظیمات `session.maintenance` در پیکربندی استفاده می‌کند:

- نکته دامنه: `openclaw sessions cleanup` از ذخیره‌گاه‌های نشست، transcriptها، و sidecarهای مسیر حرکت نگهداری می‌کند. این فرمان گزارش‌های اجرای Cron (`cron/runs/<jobId>.jsonl`) را هرس نمی‌کند؛ آن‌ها با `cron.runLog.maxBytes` و `cron.runLog.keepLines` در [پیکربندی Cron](/fa/automation/cron-jobs#configuration) مدیریت می‌شوند و در [نگهداری Cron](/fa/automation/cron-jobs#maintenance) توضیح داده شده‌اند.

- `--dry-run`: پیش‌نمایش اینکه چند ورودی بدون نوشتن هرس/محدود می‌شوند.
  - در حالت متنی، dry-run یک جدول اقدام برای هر نشست (`Action`، `Key`، `Age`، `Model`، `Flags`) چاپ می‌کند تا ببینید چه چیزی نگه داشته می‌شود و چه چیزی حذف می‌شود.
- `--enforce`: نگهداری را حتی وقتی `session.maintenance.mode` برابر `warn` است اعمال کنید.
- `--fix-missing`: ورودی‌هایی را که فایل‌های transcript آن‌ها گم شده‌اند حذف کنید، حتی اگر معمولاً هنوز از نظر سن/تعداد حذف نمی‌شدند.
- `--active-key <key>`: از یک کلید فعال مشخص در برابر بیرون‌رانی بودجه دیسک محافظت کنید. اشاره‌گرهای مکالمه خارجی بادوام، مانند نشست‌های گروهی و نشست‌های گفت‌وگوی محدود به thread، نیز توسط نگهداری سن/تعداد/بودجه دیسک نگه داشته می‌شوند.
- `--agent <id>`: پاک‌سازی را برای یک ذخیره‌گاه عامل پیکربندی‌شده اجرا کنید.
- `--all-agents`: پاک‌سازی را برای همه ذخیره‌گاه‌های عامل پیکربندی‌شده اجرا کنید.
- `--store <path>`: روی یک فایل مشخص `sessions.json` اجرا کنید.
- `--json`: یک خلاصه JSON چاپ کنید. با `--all-agents`، خروجی شامل یک خلاصه برای هر ذخیره‌گاه است.

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
