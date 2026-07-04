---
read_when:
    - می‌خواهید نشست‌های ذخیره‌شده را فهرست کنید و فعالیت‌های اخیر را ببینید
summary: مرجع CLI برای `openclaw sessions` (فهرست نشست‌های ذخیره‌شده + نحوه استفاده)
title: جلسات
x-i18n:
    generated_at: "2026-07-04T20:39:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

جلسه‌های گفت‌وگوی ذخیره‌شده را فهرست می‌کند.

فهرست‌های جلسه، بررسی زنده‌بودن کانال/ارائه‌دهنده نیستند. آن‌ها ردیف‌های
گفت‌وگوی ماندگارشده از ذخیره‌گاه‌های جلسه را نشان می‌دهند. یک کانال ساکت Discord، Slack، Telegram یا
کانال دیگر می‌تواند بدون ایجاد ردیف جلسه جدید، با موفقیت دوباره متصل شود
تا زمانی که پیامی پردازش شود. وقتی به اتصال زنده کانال نیاز دارید، از
`openclaw channels status --probe`، `openclaw status --deep`، یا `openclaw health --verbose`
استفاده کنید.

پاسخ‌های `openclaw sessions` و Gateway `sessions.list` به‌طور پیش‌فرض محدود هستند
تا ذخیره‌گاه‌های بزرگ و طولانی‌عمر نتوانند فرایند CLI یا حلقه رویداد Gateway را
در انحصار بگیرند. CLI به‌طور پیش‌فرض ۱۰۰ جلسه جدیدتر را برمی‌گرداند؛ برای یک
پنجره کوچک‌تر/بزرگ‌تر `--limit <n>` را بدهید، یا وقتی عمداً به کل ذخیره‌گاه نیاز دارید
از `--limit all` استفاده کنید. پاسخ‌های JSON شامل `totalCount`، `limitApplied` و
`hasMore` هستند، برای زمانی که فراخوان‌ها باید نشان دهند ردیف‌های بیشتری وجود دارد.

کلاینت‌های RPC می‌توانند `configuredAgentsOnly: true` را بدهند تا منبع کشف ترکیبی
گسترده حفظ شود، اما فقط ردیف‌های عامل‌هایی برگردد که اکنون در پیکربندی حضور دارند.
Control UI به‌طور پیش‌فرض از آن حالت استفاده می‌کند تا ذخیره‌گاه‌های عامل حذف‌شده یا فقط-دیسکی
دوباره در نمای جلسه‌ها ظاهر نشوند.

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
- `--verbose`: ثبت گزارش مفصل
- `--agent <id>`: یک ذخیره‌گاه عامل پیکربندی‌شده
- `--all-agents`: تجمیع همه ذخیره‌گاه‌های عامل پیکربندی‌شده
- `--store <path>`: مسیر صریح ذخیره‌گاه (نمی‌توان آن را با `--agent` یا `--all-agents` ترکیب کرد)
- `--limit <n|all>`: حداکثر ردیف‌های خروجی (پیش‌فرض `100`؛ `all` خروجی کامل را برمی‌گرداند)

پیشرفت مسیر قابل‌خواندن برای انسان را برای جلسه‌های ذخیره‌شده دنبال کنید:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` رویدادهای JSONL اخیر مسیر را به‌صورت خطوط پیشرفت فشرده نمایش می‌دهد. بدون `--session-key`، ابتدا جلسه‌های در حال اجرا را دنبال می‌کند و سپس آخرین جلسه ذخیره‌شده را. `--tail <count>` کنترل می‌کند پیش از حالت دنبال‌کردن چند رویداد موجود چاپ شود؛ پیش‌فرض `80` است، و `0` از انتهای فعلی شروع می‌کند. `--follow` به تماشای فایل‌های مسیر انتخاب‌شده ادامه می‌دهد، از جمله فایل‌های جابه‌جاشده‌ای که توسط `<session>.trajectory-path.json` ارجاع شده‌اند.

نمای پیشرفت عمداً محافظه‌کارانه است: متن پرامپت، آرگومان‌های ابزار و بدنه‌های نتیجه ابزار چاپ نمی‌شوند. فراخوانی‌های ابزار نام ابزار را با `{...redacted...}` نشان می‌دهند؛ نتایج ابزار وضعیت‌هایی مانند `ok`، `error` یا `done` را نشان می‌دهند؛ خطوط تکمیل مدل، ارائه‌دهنده/مدل و وضعیت پایانی را نشان می‌دهند.

یک بسته مسیر برای یک جلسه ذخیره‌شده صادر کنید:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

این همان مسیر فرمانی است که پس از تأیید درخواست اجرا توسط مالک، دستور اسلش `/export-trajectory` استفاده می‌کند. دایرکتوری خروجی همیشه داخل `.openclaw/trajectory-exports/` زیر فضای کاری انتخاب‌شده resolve می‌شود.

`openclaw sessions --all-agents` ذخیره‌گاه‌های عامل پیکربندی‌شده را می‌خواند. کشف جلسه در Gateway و ACP
گسترده‌تر است: آن‌ها ذخیره‌گاه‌های فقط-دیسکی را نیز شامل می‌شوند که زیر ریشه پیش‌فرض `agents/` یا یک ریشه قالب‌دار `session.store` پیدا شده‌اند. آن ذخیره‌گاه‌های کشف‌شده باید به فایل‌های عادی `sessions.json` داخل ریشه عامل resolve شوند؛ symlinkها و مسیرهای بیرون از ریشه نادیده گرفته می‌شوند.

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
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` از تنظیمات `session.maintenance` در پیکربندی استفاده می‌کند:

- یادداشت دامنه: `openclaw sessions cleanup` ذخیره‌گاه‌های جلسه، transcriptها و sidecarهای مسیر را نگهداری می‌کند. این فرمان تاریخچه اجرای cron را هرس نمی‌کند؛ آن تاریخچه توسط `cron.runLog.keepLines` در [پیکربندی Cron](/fa/automation/cron-jobs#configuration) مدیریت می‌شود و در [نگهداری Cron](/fa/automation/cron-jobs#maintenance) توضیح داده شده است.
- پاک‌سازی همچنین transcriptهای اصلی بدون ارجاع، checkpointهای Compaction، و sidecarهای مسیر قدیمی‌تر از `session.maintenance.pruneAfter` را هرس می‌کند؛ فایل‌هایی که هنوز توسط `sessions.json` ارجاع شده‌اند حفظ می‌شوند.
- پاک‌سازی، حذف کاوش‌های کوتاه‌عمر اجرای مدل Gateway را جداگانه با عنوان `modelRunPruned` گزارش می‌کند. این فقط با کلیدهای صریح سخت‌گیرانه‌ای مطابقت دارد که شکلی مانند `agent:*:explicit:model-run-<uuid>` دارند. نگهداری ثابت `24h` است، اما با فشار کنترل می‌شود: فقط وقتی فشار نگهداری/سقف ورودی جلسه رسیده باشد، ردیف‌های کاوش کهنه را حذف می‌کند. وقتی اجرا شود، پاک‌سازی اجرای مدل پیش از پاک‌سازی کهنگی سراسری و اعمال سقف انجام می‌شود.

- `--dry-run`: پیش‌نمایش می‌دهد چند ورودی بدون نوشتن هرس/محدود می‌شوند.
  - در حالت متنی، dry-run یک جدول اقدام برای هر جلسه چاپ می‌کند (`Action`، `Key`، `Age`، `Model`، `Flags`) به‌علاوه یک خلاصه گروه‌بندی‌شده بر اساس برچسب جلسه، تا بتوانید ببینید چه چیزی نگه داشته می‌شود و چه چیزی حذف می‌شود.
- `--enforce`: نگهداری را حتی وقتی `session.maintenance.mode` برابر `warn` است اعمال می‌کند.
- `--fix-missing`: ورودی‌هایی را حذف می‌کند که فایل‌های transcript آن‌ها گم شده یا فقط دارای سربرگ/خالی هستند، حتی اگر معمولاً هنوز به‌دلیل سن/تعداد حذف نمی‌شدند.
- `--fix-dm-scope`: وقتی `session.dmScope` برابر `main` است، ردیف‌های direct-DM کهنه مبتنی بر کلید همتا را که از مسیریابی‌های قبلی `per-peer`، `per-channel-peer` یا `per-account-channel-peer` باقی مانده‌اند بازنشسته می‌کند. ابتدا از `--dry-run` استفاده کنید؛ اعمال پاک‌سازی آن ردیف‌ها را از `sessions.json` حذف می‌کند و transcriptهایشان را به‌عنوان آرشیوهای حذف‌شده حفظ می‌کند.
- `--active-key <key>`: یک کلید فعال مشخص را از بیرون‌رانی بودجه دیسک محافظت می‌کند. اشاره‌گرهای گفت‌وگوی خارجی بادوام، مانند جلسه‌های گروهی و جلسه‌های چت محدود به thread، نیز توسط نگهداری مبتنی بر سن/تعداد/بودجه دیسک نگه داشته می‌شوند.
- `--agent <id>`: پاک‌سازی را برای یک ذخیره‌گاه عامل پیکربندی‌شده اجرا می‌کند.
- `--all-agents`: پاک‌سازی را برای همه ذخیره‌گاه‌های عامل پیکربندی‌شده اجرا می‌کند.
- `--store <path>`: روی یک فایل `sessions.json` مشخص اجرا می‌شود.
- `--json`: یک خلاصه JSON چاپ می‌کند. با `--all-agents`، خروجی شامل یک خلاصه برای هر ذخیره‌گاه است.

وقتی یک Gateway در دسترس باشد، پاک‌سازی غیر-dry-run برای ذخیره‌گاه‌های عامل پیکربندی‌شده
از طریق Gateway ارسال می‌شود تا همان نویسنده ذخیره‌گاه جلسه را با ترافیک زمان اجرا به اشتراک بگذارد.
برای تعمیر آفلاین صریح یک فایل ذخیره‌گاه، از `--store <path>` استفاده کنید.

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

## فشرده‌سازی یک جلسه

بودجه context را برای یک جلسه گیرکرده یا بیش‌ازحد بزرگ بازیابی کنید. `openclaw sessions compact <key>` پوشش درجه‌یک روی RPC ‏`sessions.compact` در Gateway است و به یک Gateway در حال اجرا نیاز دارد.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- بدون `--max-lines`، Gateway با LLM transcript را خلاصه می‌کند. CLI به‌طور پیش‌فرض ضرب‌الاجل کلاینت اعمال نمی‌کند؛ Gateway مالک چرخه عمر Compaction پیکربندی‌شده است.
- با `--max-lines <n>`، به آخرین `n` خط transcript کوتاه می‌کند و transcript قبلی را به‌عنوان یک sidecar با پسوند `.bak` آرشیو می‌کند.
- `--agent <id>`: عاملی که مالک جلسه است؛ برای کلیدهای `global` الزامی است.
- `--url` / `--token` / `--password`: بازنویسی‌های اتصال Gateway.
- `--timeout <ms>`: مهلت اختیاری RPC سمت کلاینت بر حسب میلی‌ثانیه.
- `--json`: payload خام RPC را چاپ می‌کند.

وقتی Gateway یک Compaction ناموفق گزارش کند یا در دسترس نباشد، فرمان با وضعیت غیرصفر خارج می‌شود؛ بنابراین cronها و اسکریپت‌ها هرگز یک no-op خاموش را با موفقیت اشتباه نمی‌گیرند.

> نکته: `openclaw agent --message '/compact ...'` مسیر Compaction نیست. دستورهای اسلش از CLI توسط بررسی فرستنده مجاز رد می‌شوند؛ آن فراخوانی با وضعیت غیرصفر خارج می‌شود و به‌جای no-op خاموش، راهنمایی‌ای ارائه می‌کند که به اینجا اشاره دارد.

### RPC ‏sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` می‌پذیرد:

| فیلد      | نوع        | الزامی | توضیح                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | رشته      | بله      | کلید جلسه برای فشرده‌سازی (برای نمونه `agent:main:main`).    |
| `agentId`  | رشته      | خیر       | شناسه عاملی که مالک جلسه است (برای کلیدهای `global`).        |
| `maxLines` | عدد صحیح ≥ ۱ | خیر       | به‌جای خلاصه‌سازی LLM، به آخرین N خط کوتاه می‌کند. |

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

- پیکربندی جلسه: [مرجع پیکربندی](/fa/gateway/config-agents#session)
- [مرجع CLI](/fa/cli)
- [مدیریت جلسه](/fa/concepts/session)
