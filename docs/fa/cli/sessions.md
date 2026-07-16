---
read_when:
    - می‌خواهید نشست‌های ذخیره‌شده را فهرست کنید و فعالیت‌های اخیر را ببینید
summary: مرجع CLI برای `openclaw sessions` (فهرست نشست‌های ذخیره‌شده + میزان استفاده)
title: نشست‌ها
x-i18n:
    generated_at: "2026-07-16T15:56:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

نشست‌های مکالمه ذخیره‌شده را فهرست کنید.

فهرست نشست‌ها، بررسی زنده‌بودن کانال/ارائه‌دهنده نیست. این فهرست‌ها ردیف‌های
مکالمه ماندگارشده در مخازن نشست را نشان می‌دهند. یک کانال کم‌فعالیت Discord، Slack، Telegram یا
کانالی دیگر می‌تواند بدون ایجاد ردیف نشست جدید با موفقیت دوباره متصل شود
تا زمانی که پیامی پردازش شود. هنگامی که به اتصال زنده
کانال نیاز دارید، از `openclaw channels status --probe`،
`openclaw status --deep` یا `openclaw health --verbose` استفاده کنید.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

پرچم‌ها:

| پرچم                 | توضیحات                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | یک مخزن عامل پیکربندی‌شده (پیش‌فرض: عامل پیش‌فرض پیکربندی‌شده).        |
| `--all-agents`       | تجمیع همه مخازن عامل پیکربندی‌شده.                                 |
| `--store <path>`     | مسیر صریح مخزن (نمی‌توان آن را با `--agent` یا `--all-agents` ترکیب کرد). |
| `--active <minutes>` | فقط نشست‌هایی را نشان دهید که طی N دقیقه گذشته به‌روزرسانی شده‌اند.                  |
| `--limit <n\|all>`   | حداکثر تعداد ردیف‌های خروجی (پیش‌فرض `100`؛ `all` خروجی کامل را برمی‌گرداند).        |
| `--json`             | خروجی قابل‌خواندن برای ماشین.                                               |
| `--verbose`          | ثبت گزارش تفصیلی.                                                       |

`openclaw sessions` و RPC مربوط به `sessions.list` در Gateway به‌طور پیش‌فرض محدود هستند
تا مخازن بزرگ و دیرپا نتوانند فرایند CLI یا حلقه رویداد Gateway را
در انحصار بگیرند. CLI به‌طور پیش‌فرض جدیدترین 100 نشست را برمی‌گرداند؛ برای یک بازه
کوچک‌تر/بزرگ‌تر، `--limit <n>` را ارسال کنید، یا هنگامی که عمداً به کل
مخزن نیاز دارید از `--limit all` استفاده کنید. پاسخ‌های JSON شامل `totalCount`، `limitApplied` و `hasMore`
هستند تا فراخوان‌ها بتوانند وجود ردیف‌های بیشتر را نشان دهند.

کلاینت‌های RPC می‌توانند `configuredAgentsOnly: true` را ارسال کنند تا منبع گسترده
کشف ترکیبی حفظ شود، اما فقط ردیف‌های عامل‌هایی بازگردانده شوند که در حال حاضر در پیکربندی وجود دارند.
Control UI به‌طور پیش‌فرض از این حالت استفاده می‌کند تا مخازن عامل حذف‌شده یا صرفاً موجود روی دیسک
دوباره در نمای نشست‌ها ظاهر نشوند.

`--all-agents` مخازن عامل پیکربندی‌شده را می‌خواند. کشف نشست
Gateway و ACP گسترده‌تر است: این کشف شامل مخازن SQLite حل‌شده از
ریشه‌های عامل پیکربندی‌شده یا ریشه قالب‌بندی‌شده `session.store` نیز می‌شود. مسیرهای انتخابگر
قدیمی باید درون ریشه عامل حل شوند؛ پیوندهای نمادین و مسیرهای خارج از ریشه
نادیده گرفته می‌شوند.

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## دنبال‌کردن پیشرفت مسیر اجرا

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` رویدادهای اخیر مسیر اجرای زمان‌اجرا را به‌شکل خطوط
پیشرفت فشرده نمایش می‌دهد. بدون `--session-key`، ابتدا نشست‌های در حال اجرا و سپس
آخرین نشست ذخیره‌شده را دنبال می‌کند. `--tail <count>` تعداد رویدادهای موجودی را
که پیش از حالت دنبال‌کردن چاپ می‌شوند کنترل می‌کند؛ پیش‌فرض `80` است و `0` از انتهای فعلی آغاز می‌کند.
`--follow` نظارت بر نشست انتخاب‌شده مبتنی بر SQLite یا یک
فایل صریح مسیر اجرای قدیمی را ادامه می‌دهد.

نمای پیشرفت عمداً محافظه‌کارانه است: متن پرامپت، آرگومان‌های ابزار
و بدنه نتایج ابزار چاپ نمی‌شوند. فراخوانی ابزار نام ابزار را همراه با
`{...redacted...}` نشان می‌دهد؛ نتایج ابزار وضعیت‌هایی مانند `ok`، `error` یا `done` را نشان می‌دهند؛
خطوط تکمیل مدل، ارائه‌دهنده/مدل و وضعیت پایانی را نشان می‌دهند.

## صادرکردن یک بسته مسیر اجرا

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

این مسیر فرمانی است که فرمان اسلش `/export-trajectory` پس از
تأیید درخواست اجرا توسط مالک استفاده می‌کند. مسیر شاخه خروجی همیشه
درون `.openclaw/trajectory-exports/` و زیر فضای کاری انتخاب‌شده حل می‌شود.

## نگه‌داری پاک‌سازی

نگه‌داری را اکنون اجرا کنید و منتظر چرخه نوشتن بعدی نمانید:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` از تنظیمات `session.maintenance` در پیکربندی استفاده می‌کند
([مرجع پیکربندی](/fa/gateway/config-agents#session)):

- نکته درباره دامنه: `openclaw sessions cleanup` مخازن نشست،
  رونوشت‌ها، ردیف‌های مسیر اجرا و فایل‌های جانبی قدیمی مسیر اجرا را نگه‌داری می‌کند. این فرمان
  تاریخچه اجرای Cron را هرس نمی‌کند؛ این تاریخچه به‌طور خودکار جدیدترین 2000 ردیف هر کار را نگه می‌دارد
  ([پیکربندی Cron](/fa/automation/cron-jobs#configuration)).
- پاک‌سازی همچنین مصنوعات رونوشت قدیمی/بایگانی‌شده بدون ارجاع،
  نقاط وارسی Compaction و فایل‌های جانبی مسیر اجرا با قدمت بیشتر از
  `session.maintenance.pruneAfter` را هرس می‌کند؛ مصنوعاتی که همچنان توسط ردیف‌های نشست SQLite
  ارجاع داده می‌شوند، حفظ خواهند شد.
- پاک‌سازی، حذف آزمون‌های کوتاه‌عمر اجرای مدل Gateway را جداگانه با عنوان
  `modelRunPruned` گزارش می‌کند. این مورد فقط با کلیدهای صریح و سخت‌گیرانه‌ای با قالب
  `agent:*:explicit:model-run-<uuid>` مطابقت دارد. دوره نگه‌داری مقدار ثابت `24h` است و
  به فشار وابسته است: فقط زمانی ردیف‌های آزمون منقضی را حذف می‌کند که
  نگه‌داری ورودی نشست/فشار سقف ظرفیت رخ دهد. هنگام اجرا، پاک‌سازی اجرای مدل
  پیش از پاک‌سازی عمومی موارد منقضی و اعمال سقف انجام می‌شود.

پرچم‌ها:

| پرچم                 | توضیحات                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | بدون نوشتن، تعداد ورودی‌هایی را که هرس یا محدود می‌شوند پیش‌نمایش می‌کند. در حالت متنی، یک جدول اقدام به‌ازای هر نشست (`Action`، `Key`، `Age`، `Model`، `Flags`) به‌همراه خلاصه‌ای گروه‌بندی‌شده بر اساس برچسب نشست چاپ می‌کند.                                                                                                       |
| `--enforce`          | حتی زمانی که `session.maintenance.mode` برابر با `warn` است، نگه‌داری را اعمال می‌کند.                                                                                                                                                                                                                                          |
| `--fix-missing`      | ورودی‌های قدیمی را که مصنوعات رونوشت بایگانی‌شده آن‌ها وجود ندارد یا فقط دارای سرآیند/خالی است حذف می‌کند، حتی اگر معمولاً هنوز بر اساس سن/تعداد حذف نمی‌شدند.                                                                                                                                                             |
| `--fix-dm-scope`     | هنگامی که `session.dmScope` برابر با `main` است، ردیف‌های پیام مستقیم قدیمی مبتنی بر کلید همتا را که از مسیریابی‌های پیشین `per-peer`، `per-channel-peer` یا `per-account-channel-peer` باقی مانده‌اند بازنشسته می‌کند. ابتدا از `--dry-run` استفاده کنید؛ اعمال آن، این ردیف‌ها را از SQLite حذف و مصنوعات رونوشت قدیمی آن‌ها را به‌صورت بایگانی‌های حذف‌شده حفظ می‌کند. |
| `--active-key <key>` | از یک کلید فعال مشخص در برابر بیرون‌اندازی به‌دلیل بودجه دیسک محافظت می‌کند. اشاره‌گرهای ماندگار مکالمات خارجی، مانند نشست‌های گروهی و نشست‌های گفت‌وگوی محدود به رشته، نیز در نگه‌داری بر اساس سن/تعداد/بودجه دیسک حفظ می‌شوند.                                                                                               |
| `--agent <id>`       | پاک‌سازی را برای یک مخزن عامل پیکربندی‌شده اجرا می‌کند.                                                                                                                                                                                                                                                                |
| `--all-agents`       | پاک‌سازی را برای همه مخازن عامل پیکربندی‌شده اجرا می‌کند.                                                                                                                                                                                                                                                               |
| `--store <path>`     | روی یک مسیر انتخابگر مخزن قدیمی مشخص اجرا می‌شود.                                                                                                                                                                                                                                                         |
| `--json`             | یک خلاصه JSON چاپ می‌کند. همراه با `--all-agents`، خروجی شامل یک خلاصه برای هر مخزن است.                                                                                                                                                                                                                          |

هنگامی که Gateway در دسترس باشد، پاک‌سازی غیرا‌زمایشی برای مخازن عامل پیکربندی‌شده
از طریق Gateway ارسال می‌شود تا از همان نویسنده مخزن نشستِ ترافیک
زمان‌اجرا استفاده کند. برای تعمیر صریح آفلاین یک انتخابگر مخزن قدیمی
از `--store <path>` استفاده کنید.

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

بودجه زمینه را برای یک نشست گیرکرده یا بیش‌ازحد بزرگ بازیابی کنید. `openclaw sessions
compact <key>` پوشش درجه‌اول RPC مربوط به `sessions.compact`
در Gateway است و به Gateway در حال اجرا نیاز دارد.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- بدون `--max-lines`، Gateway رونوشت را با LLM خلاصه می‌کند. CLI
  به‌طور پیش‌فرض مهلت زمانی کلاینت اعمال نمی‌کند؛ Gateway مالک چرخه عمر
  پیکربندی‌شده Compaction است.
- با `--max-lines <n>`، رونوشت به آخرین `n` خط محدود می‌شود و
  رونوشت قبلی به‌صورت یک فایل جانبی `.bak` بایگانی می‌شود.
- `--agent <id>`: عاملی که مالک نشست است؛ برای کلیدهای `global` الزامی است.
- `--url` / `--token` / `--password`: بازنویسی‌های اتصال Gateway.
- `--timeout <ms>`: مهلت زمانی اختیاری RPC در سمت کلاینت، برحسب میلی‌ثانیه.
- `--json`: محموله خام RPC را چاپ می‌کند.

وقتی Gateway یک Compaction ناموفق را گزارش کند یا در دسترس نباشد، فرمان با کد خروج غیرصفر خاتمه می‌یابد؛ بنابراین Cronها و اسکریپت‌ها هرگز یک عملیات بی‌اثر و بی‌سروصدا را با موفقیت اشتباه نمی‌گیرند.

<Note>
`openclaw agent --message '/compact ...'` مسیر Compaction **نیست**. فرمان‌های اسلش از CLI در بررسی فرستنده مجاز رد می‌شوند؛ آن فراخوانی با کد خروج غیرصفر خاتمه می‌یابد و به‌جای اجرای بی‌اثر و بی‌سروصدا، راهنمایی‌ای ارائه می‌کند که به اینجا ارجاع می‌دهد.
</Note>

### RPC مربوط به sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` موارد زیر را می‌پذیرد:

| فیلد      | نوع        | الزامی | توضیحات                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | رشته      | بله      | کلید نشست برای Compaction (برای مثال `agent:main:main`).    |
| `agentId`  | رشته      | خیر       | شناسه عاملی که مالک نشست است (برای کلیدهای `global`).        |
| `maxLines` | عدد صحیح ≥ 1 | خیر       | به‌جای خلاصه‌سازی با LLM، محتوا را به آخرین N خط محدود می‌کند. |

نمونه پاسخ خلاصه‌سازی با LLM:

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

- [پیکربندی نشست](/fa/gateway/config-agents#session)
- [مدیریت نشست](/fa/concepts/session)
- [Compaction](/fa/concepts/compaction)
- [مرجع CLI](/fa/cli)
