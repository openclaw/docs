---
read_when:
    - می‌خواهید نشست‌های ذخیره‌شده را فهرست کنید و فعالیت‌های اخیر را ببینید
summary: مرجع CLI برای `openclaw sessions` (فهرست کردن نشست‌های ذخیره‌شده + نحوهٔ استفاده)
title: نشست‌ها
x-i18n:
    generated_at: "2026-05-07T13:15:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

نشست‌های مکالمه ذخیره‌شده را فهرست کنید.

فهرست‌های نشست، بررسی زنده‌بودن کانال/ارائه‌دهنده نیستند. آن‌ها ردیف‌های مکالمه پایدارشده را از ذخیره‌گاه‌های نشست نشان می‌دهند. یک کانال ساکت مانند Discord، Slack، Telegram یا کانالی دیگر می‌تواند بدون ایجاد ردیف نشست جدید، تا زمانی که پیامی پردازش شود، با موفقیت دوباره وصل شود. وقتی به اتصال زنده کانال نیاز دارید از `openclaw channels status --probe`، `openclaw status --deep` یا `openclaw health --verbose` استفاده کنید.

پاسخ‌های `openclaw sessions` و `sessions.list` در Gateway به‌صورت پیش‌فرض محدود هستند تا ذخیره‌گاه‌های بزرگ و دیرپا نتوانند فرایند CLI یا حلقه رویداد Gateway را در انحصار بگیرند. CLI به‌صورت پیش‌فرض ۱۰۰ نشست جدیدتر را برمی‌گرداند؛ برای پنجره‌ای کوچک‌تر/بزرگ‌تر `--limit <n>` را بفرستید یا وقتی عمداً به کل ذخیره‌گاه نیاز دارید از `--limit all` استفاده کنید. پاسخ‌های JSON شامل `totalCount`، `limitApplied` و `hasMore` هستند، برای زمانی که فراخوان‌ها باید نشان دهند ردیف‌های بیشتری وجود دارد.

کارخواه‌های RPC می‌توانند `configuredAgentsOnly: true` را بفرستند تا منبع کشف ترکیبی گسترده حفظ شود، اما فقط ردیف‌های عامل‌هایی برگردانده شود که در حال حاضر در پیکربندی وجود دارند. رابط کاربری کنترل به‌صورت پیش‌فرض از این حالت استفاده می‌کند تا ذخیره‌گاه‌های عامل حذف‌شده یا فقط-روی-دیسک دوباره در نمای نشست‌ها ظاهر نشوند.

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
- `--store <path>`: مسیر صریح ذخیره‌گاه (نمی‌تواند با `--agent` یا `--all-agents` ترکیب شود)
- `--limit <n|all>`: بیشینه ردیف‌های خروجی (پیش‌فرض `100`؛ `all` خروجی کامل را برمی‌گرداند)

یک بسته مسیر اجرا را برای یک نشست ذخیره‌شده صادر کنید:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

این مسیر فرمانی است که فرمان اسلش `/export-trajectory` پس از تأیید درخواست اجرا توسط مالک استفاده می‌کند. دایرکتوری خروجی همیشه داخل `.openclaw/trajectory-exports/` در فضای کاری انتخاب‌شده resolve می‌شود.

`openclaw sessions --all-agents` ذخیره‌گاه‌های عامل پیکربندی‌شده را می‌خواند. کشف نشست در Gateway و ACP گسترده‌تر است: آن‌ها ذخیره‌گاه‌های فقط-روی-دیسکِ یافت‌شده زیر ریشه پیش‌فرض `agents/` یا ریشه قالب‌دار `session.store` را نیز شامل می‌کنند. آن ذخیره‌گاه‌های کشف‌شده باید به فایل‌های عادی `sessions.json` داخل ریشه عامل resolve شوند؛ پیوندهای نمادین و مسیرهای بیرون از ریشه رد می‌شوند.

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

اکنون نگهداری را اجرا کنید (به‌جای انتظار برای چرخه نوشتن بعدی):

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

- یادداشت دامنه: `openclaw sessions cleanup` ذخیره‌گاه‌های نشست، رونویسی‌ها و sidecarهای مسیر اجرا را نگهداری می‌کند. این فرمان گزارش‌های اجرای cron (`cron/runs/<jobId>.jsonl`) را هرس نمی‌کند؛ آن‌ها با `cron.runLog.maxBytes` و `cron.runLog.keepLines` در [پیکربندی Cron](/fa/automation/cron-jobs#configuration) مدیریت می‌شوند و در [نگهداری Cron](/fa/automation/cron-jobs#maintenance) توضیح داده شده‌اند.
- پاک‌سازی همچنین رونویسی‌های اصلی ارجاع‌نشده، checkpointهای Compaction و sidecarهای مسیر اجرای قدیمی‌تر از `session.maintenance.pruneAfter` را هرس می‌کند؛ فایل‌هایی که هنوز توسط `sessions.json` ارجاع داده می‌شوند حفظ می‌شوند.

- `--dry-run`: پیش‌نمایش اینکه چند ورودی بدون نوشتن هرس/محدود می‌شوند.
  - در حالت متنی، اجرای خشک یک جدول اقدام برای هر نشست چاپ می‌کند (`Action`، `Key`، `Age`، `Model`، `Flags`) تا بتوانید ببینید چه چیزی نگه داشته می‌شود و چه چیزی حذف می‌شود.
- `--enforce`: نگهداری را حتی وقتی `session.maintenance.mode` برابر `warn` است اعمال کنید.
- `--fix-missing`: ورودی‌هایی را که فایل‌های رونویسی آن‌ها موجود نیست حذف کنید، حتی اگر معمولاً هنوز از نظر سن/تعداد حذف نمی‌شدند.
- `--fix-dm-scope`: وقتی `session.dmScope` برابر `main` است، ردیف‌های direct-DM قدیمی با کلید همتا را که از مسیریابی‌های قبلی `per-peer`، `per-channel-peer` یا `per-account-channel-peer` باقی مانده‌اند بازنشسته کنید. ابتدا از `--dry-run` استفاده کنید؛ اعمال پاک‌سازی آن ردیف‌ها را از `sessions.json` حذف می‌کند و رونویسی‌های آن‌ها را به‌عنوان آرشیوهای حذف‌شده حفظ می‌کند.
- `--active-key <key>`: از یک کلید فعال مشخص در برابر حذف به‌دلیل بودجه دیسک محافظت کنید. اشاره‌گرهای بادوام مکالمه خارجی، مانند نشست‌های گروهی و نشست‌های گفت‌وگوی محدود به thread، نیز توسط نگهداری مبتنی بر سن/تعداد/بودجه دیسک نگه داشته می‌شوند.
- `--agent <id>`: پاک‌سازی را برای یک ذخیره‌گاه عامل پیکربندی‌شده اجرا کنید.
- `--all-agents`: پاک‌سازی را برای همه ذخیره‌گاه‌های عامل پیکربندی‌شده اجرا کنید.
- `--store <path>`: روی یک فایل مشخص `sessions.json` اجرا کنید.
- `--json`: خلاصه JSON چاپ کنید. با `--all-agents`، خروجی شامل یک خلاصه برای هر ذخیره‌گاه است.

وقتی Gateway در دسترس باشد، پاک‌سازی غیرخشک برای ذخیره‌گاه‌های عامل پیکربندی‌شده از طریق Gateway فرستاده می‌شود تا همان نویسنده ذخیره‌گاه نشست را با ترافیک زمان اجرا به اشتراک بگذارد. برای تعمیر آفلاین صریح یک فایل ذخیره‌گاه از `--store <path>` استفاده کنید.

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

مرتبط:

- پیکربندی نشست: [مرجع پیکربندی](/fa/gateway/config-agents#session)

## مرتبط

- [مرجع CLI](/fa/cli)
- [مدیریت نشست](/fa/concepts/session)
