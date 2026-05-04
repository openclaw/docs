---
read_when:
    - می‌خواهید نشست‌های ذخیره‌شده را فهرست کنید و فعالیت‌های اخیر را ببینید
summary: مرجع CLI برای `openclaw sessions` (فهرست‌کردن نشست‌های ذخیره‌شده + نحوه استفاده)
title: نشست‌ها
x-i18n:
    generated_at: "2026-05-04T07:02:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

نشست‌های گفت‌وگوی ذخیره‌شده را فهرست کنید.

فهرست‌های نشست، بررسی زنده‌بودن کانال/ارائه‌دهنده نیستند. آن‌ها ردیف‌های گفت‌وگوی
ماندگارشده از مخزن‌های نشست را نشان می‌دهند. یک Discord، Slack، Telegram یا
کانال دیگرِ ساکت می‌تواند بدون ایجاد ردیف نشست جدید با موفقیت دوباره وصل شود
تا زمانی که پیامی پردازش شود. وقتی به اتصال زندهٔ کانال نیاز دارید از
`openclaw channels status --probe`، `openclaw status --deep` یا
`openclaw health --verbose` استفاده کنید.

پاسخ‌های Gateway `sessions.list` به‌طور پیش‌فرض محدود هستند تا مخزن‌های بزرگ و
دیرپا نتوانند حلقهٔ رویداد Gateway را در انحصار بگیرند. وقتی بازهٔ نتیجهٔ
متفاوتی لازم است، از کلاینت‌های RPC یک `limit` مثبت و صریح ارسال کنید؛ پاسخ‌ها
وقتی فراخوان‌ها نیاز داشته باشند نشان دهند ردیف‌های بیشتری وجود دارد، شامل
`totalCount`، `limitApplied` و `hasMore` هستند.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

انتخاب دامنه:

- پیش‌فرض: مخزن عامل پیش‌فرض پیکربندی‌شده
- `--verbose`: گزارش‌گیری پرجزئیات
- `--agent <id>`: یک مخزن عامل پیکربندی‌شده
- `--all-agents`: تجمیع همهٔ مخزن‌های عامل پیکربندی‌شده
- `--store <path>`: مسیر صریح مخزن (نمی‌توان آن را با `--agent` یا `--all-agents` ترکیب کرد)

یک بستهٔ مسیر اجرا را برای یک نشست ذخیره‌شده صادر کنید:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

این همان مسیر فرمانی است که فرمان اسلش `/export-trajectory` پس از تأیید درخواست
اجرایی توسط مالک استفاده می‌کند. پوشهٔ خروجی همیشه داخل
`.openclaw/trajectory-exports/` در فضای کاری انتخاب‌شده resolve می‌شود.

`openclaw sessions --all-agents` مخزن‌های عامل پیکربندی‌شده را می‌خواند. کشف
نشست در Gateway و ACP گسترده‌تر است: آن‌ها مخزن‌های فقط-دیسکی پیدا‌شده زیر ریشهٔ
پیش‌فرض `agents/` یا یک ریشهٔ قالب‌بندی‌شدهٔ `session.store` را هم شامل می‌شوند.
آن مخزن‌های کشف‌شده باید به فایل‌های عادی `sessions.json` داخل ریشهٔ عامل resolve
شوند؛ symlinkها و مسیرهای بیرون از ریشه نادیده گرفته می‌شوند.

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

همین حالا نگهداری را اجرا کنید (به‌جای انتظار برای چرخهٔ نوشتن بعدی):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` از تنظیمات `session.maintenance` در پیکربندی استفاده می‌کند:

- نکتهٔ دامنه: `openclaw sessions cleanup` مخزن‌های نشست، رونوشت‌ها و sidecarهای مسیر اجرا را نگهداری می‌کند. این فرمان گزارش‌های اجرای cron را (`cron/runs/<jobId>.jsonl`) هرس نمی‌کند؛ این گزارش‌ها با `cron.runLog.maxBytes` و `cron.runLog.keepLines` در [پیکربندی Cron](/fa/automation/cron-jobs#configuration) مدیریت می‌شوند و در [نگهداری Cron](/fa/automation/cron-jobs#maintenance) توضیح داده شده‌اند.

- `--dry-run`: پیش‌نمایش تعداد ورودی‌هایی که بدون نوشتن هرس/محدود می‌شوند.
  - در حالت متنی، dry-run یک جدول اقدام برای هر نشست چاپ می‌کند (`Action`، `Key`، `Age`، `Model`، `Flags`) تا بتوانید ببینید چه چیزی نگه داشته می‌شود و چه چیزی حذف می‌شود.
- `--enforce`: نگهداری را حتی وقتی `session.maintenance.mode` برابر `warn` است اعمال می‌کند.
- `--fix-missing`: ورودی‌هایی را که فایل‌های رونوشتشان وجود ندارد حذف می‌کند، حتی اگر معمولاً هنوز به دلیل سن/تعداد حذف نمی‌شدند.
- `--active-key <key>`: از یک کلید فعال مشخص در برابر تخلیهٔ بودجهٔ دیسک محافظت می‌کند. اشاره‌گرهای بادوام گفت‌وگوی خارجی، مانند نشست‌های گروهی و نشست‌های گفت‌وگوی محدود به thread، نیز توسط نگهداری سن/تعداد/بودجهٔ دیسک نگه داشته می‌شوند.
- `--agent <id>`: پاک‌سازی را برای یک مخزن عامل پیکربندی‌شده اجرا می‌کند.
- `--all-agents`: پاک‌سازی را برای همهٔ مخزن‌های عامل پیکربندی‌شده اجرا می‌کند.
- `--store <path>`: روی یک فایل مشخص `sessions.json` اجرا می‌شود.
- `--json`: خلاصهٔ JSON چاپ می‌کند. با `--all-agents`، خروجی شامل یک خلاصه برای هر مخزن است.

وقتی یک Gateway در دسترس باشد، پاک‌سازی غیر dry-run برای مخزن‌های عامل
پیکربندی‌شده از طریق Gateway ارسال می‌شود تا از همان نویسندهٔ مخزن نشستِ ترافیک
زمان اجرا استفاده کند. برای تعمیر آفلاین صریحِ یک فایل مخزن از `--store <path>`
استفاده کنید.

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
