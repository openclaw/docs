---
read_when:
    - می‌خواهید کارت‌های Workboard را از ترمینال بررسی یا ایجاد کنید
    - می‌خواهید اجرای workerهای Workboard را از CLI اعزام کنید
    - شما در حال اشکال‌زدایی رفتار CLI یا دستور اسلش Workboard هستید
summary: مرجع CLI برای کارت‌های `openclaw workboard`، dispatch و اجراهای worker
title: CLI صفحهٔ کار
x-i18n:
    generated_at: "2026-06-27T17:30:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` سطح ترمینالی برای
[Plugin Workboard](/fa/plugins/workboard) همراه است. این دستور به اپراتور امکان می‌دهد کارت‌ها را فهرست کند، یک
کارت بسازد، یک کارت را بررسی کند، و از Gateway در حال اجرا بخواهد کار آماده را به
اجراهای عامل فرعی کارگر ارسال کند.

پیش از استفاده از دستور، Plugin را فعال کنید:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## استفاده

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

این دستور همان پایگاه داده SQLite تحت مالکیت Plugin را می‌خواند و می‌نویسد که
داشبورد و ابزارهای عامل Workboard استفاده می‌کنند. شناسه‌های کارت می‌توانند به صورت شناسه کامل یا با یک
پیشوند بدون ابهام پاس داده شوند، وقتی دستوری شناسه کارت می‌پذیرد.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

خروجی متنی فشرده است:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

ستون‌ها شامل پیشوند شناسه، وضعیت، اولویت، شناسه بورد، شناسه اختیاری عامل، و عنوان هستند.

پرچم‌ها:

| پرچم                 | هدف                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | محدود کردن نتایج به یک فضای نام بورد          |
| `--status <status>`  | محدود کردن نتایج به یک وضعیت Workboard         |
| `--include-archived` | شامل کردن کارت‌های بایگانی‌شده در خروجی متنی فشرده |
| `--json`             | چاپ فهرست کامل کارت‌ها به صورت JSON ماشینی      |

خروجی متنی فشرده به‌طور پیش‌فرض کارت‌های بایگانی‌شده را پنهان می‌کند تا CLI با دستور
`/workboard list` همخوان باشد. برای نمایش آن‌ها `--include-archived` را پاس دهید. خروجی JSON
فهرست کامل کارت‌ها، از جمله کارت‌های بایگانی‌شده، را برای اتوماسیون موجود نگه می‌دارد.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

پرچم‌ها:

| پرچم                    | هدف                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | یادداشت‌های اولیه کارت                      |
| `--status <status>`     | وضعیت اولیه، پیش‌فرض `todo`          |
| `--priority <priority>` | اولویت، پیش‌فرض `normal`              |
| `--agent <id>`          | اختصاص کارت به یک عامل یا شناسه مالک |
| `--board <id>`          | ذخیره کارت در یک فضای نام بورد     |
| `--labels <items>`      | برچسب‌های جداشده با ویرگول                  |
| `--json`                | چاپ کارت ساخته‌شده به صورت JSON ماشینی  |

`create` مستقیماً در وضعیت SQLite مربوط به Workboard می‌نویسد. کارت بلافاصله
در زبانه Workboard در Control UI و برای ابزارهای Workboard قابل مشاهده است.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

خروجی متنی خط فشرده کارت و یادداشت‌ها را چاپ می‌کند. خروجی JSON رکورد کامل
کارت را برمی‌گرداند، از جمله فراداده اجرا، تلاش‌ها، نظرها، پیوندها، اثبات،
آرتیفکت‌ها، لاگ‌های کارگر، وضعیت پروتکل، عیب‌یابی‌ها، و فراداده اتوماسیون.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` ابتدا متد RPC در Gateway در حال اجرا را فراخوانی می‌کند:
`workboard.cards.dispatch`. این مسیر از همان زمان اجرای عامل فرعی استفاده می‌کند که
کنش dispatch داشبورد استفاده می‌کند، بنابراین کارت‌های آماده به اجراهای کارگر دارای ردیابی وظیفه با
کلیدهای نشست پیوندخورده تبدیل می‌شوند. کارت‌هایی که عامل اختصاص‌یافته دارند از کلیدهای نشست عامل فرعی
با دامنه عامل استفاده می‌کنند؛ کارت‌های بدون اختصاص یک کلید عامل فرعی بدون دامنه نگه می‌دارند تا عامل پیش‌فرض
پیکربندی‌شده Gateway حفظ شود.

حلقه dispatch:

1. فرزندان آماده از نظر وابستگی را به `ready` ارتقا می‌دهد.
2. claimهای منقضی‌شده یا اجراهای کارگر زمان‌تمام‌شده را مسدود می‌کند.
3. فراداده dispatch را روی کارت‌های آماده ثبت می‌کند.
4. یک دسته کوچک از کارت‌های آماده و بدون claim را انتخاب می‌کند.
5. هر کارت انتخاب‌شده را برای dispatchکننده یا عامل اختصاص‌یافته claim می‌کند.
6. یک اجرای کارگر عامل فرعی را با زمینه محدود کارت و توکن claim کارت شروع می‌کند.
7. شناسه اجرای کارگر، کلید نشست، پیوند وظیفه وقتی دفترکل وظیفه Gateway آن را گزارش می‌کند، وضعیت اجرا، و لاگ کارگر را روی کارت ذخیره می‌کند.

انتخاب عمداً محافظه‌کارانه است. یک dispatch به‌طور پیش‌فرض حداکثر سه
کارگر را شروع می‌کند، کارت‌های بایگانی‌شده یا از قبل claimشده را نادیده می‌گیرد، و در یک گذر فقط یک
کارت برای هر مالک یا عامل شروع می‌کند. کارت‌هایی که از قبل متعلق به کار در حال اجرای فعال
یا در بازبینی هستند برای dispatch بعدی باقی می‌مانند.

اگر شروع کارگر پس از claim شدن کارت شکست بخورد، Workboard آن کارت را مسدود می‌کند،
claim را پاک می‌کند، و شکست را در فراداده اجرای کارت و لاگ کارگر ثبت می‌کند.
این کار شروع‌های ناموفق را قابل مشاهده نگه می‌دارد، به‌جای اینکه کارت را بی‌صدا به
صف برگرداند.

اگر هدف Gateway صریحی ارائه نشود و Gateway محلی در دسترس نباشد
یا هنوز متد dispatch مربوط به Workboard را ارائه نکند، CLI به dispatch فقط-داده
روی وضعیت محلی Workboard برمی‌گردد. dispatch فقط-داده همچنان می‌تواند
وابستگی‌ها را ارتقا دهد، claimهای کهنه را پاک کند، و اجراهای زمان‌تمام‌شده را مسدود کند، اما
کارگرها را شروع نمی‌کند. خطاهای احراز هویت، مجوز، اعتبارسنجی، و خطاهای مربوط به
هدف صریح `--url` یا `--token` مستقیماً گزارش می‌شوند.

خروجی متنی شروع‌های کارگر را گزارش می‌کند:

```text
dispatch complete: started=2 failures=0
```

خروجی fallback صریح است:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

خروجی JSON شامل نتیجه dispatch است. dispatch مبتنی بر Gateway می‌تواند شامل
`started` و `startFailures` باشد؛ fallback فقط-داده شامل
`gatewayUnavailable: true` است. توکن‌های claim از خروجی JSON کارت حذف می‌شوند.

در داشبورد، همان نتیجه dispatch به صورت یک خلاصه کوتاه نشان داده می‌شود تا
اپراتور بتواند بدون باز کردن جزئیات کارت ببیند چند کارت شروع، ارتقا، مسدود، بازپس‌گیری، یا
ناموفق شده‌اند.

## هم‌ارزی دستور اسلش

کانال‌های دارای قابلیت دستور می‌توانند از دستور اسلش متناظر استفاده کنند:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

dispatch با دستور اسلش نیز از زمان اجرای عامل فرعی Gateway استفاده می‌کند، بنابراین از
همان رفتار claim، شروع کارگر، و شکست پیروی می‌کند که مسیر Gateway در داشبورد و CLI
دارد.

`/workboard list` و `/workboard show` دستورهای خواندنی برای فرستندگان دستور مجاز هستند.
`/workboard create` و `/workboard dispatch` وضعیت بورد را تغییر می‌دهند و
روی سطوح چت به وضعیت مالک یا یک کلاینت Gateway با `operator.write`
یا `operator.admin` نیاز دارند.

## مجوزها

مسیر dispatch در CLI، RPC مربوط به Gateway را با scopeهای `operator.read` و
`operator.write` فراخوانی می‌کند. یک توکن Gateway فقط‌خواندنی می‌تواند داده‌های Workboard را
از طریق متدهای خواندنی بررسی کند، اما نمی‌تواند کارت بسازد یا کارگرها را dispatch کند.

دستورهای محلی `list`، `create`، و `show` روی دایرکتوری وضعیت محلی OpenClaw
مورد استفاده پروفایل فعلی عمل می‌کنند. وقتی به ریشه وضعیت متفاوتی نیاز دارید، روی دستور
سطح بالای `openclaw` از `--dev` یا `--profile <name>` استفاده کنید.

## عیب‌یابی

### هیچ کارتی ظاهر نمی‌شود

تأیید کنید Plugin برای همان پروفایل و ریشه وضعیت فعال است:

```bash
openclaw plugins inspect workboard --runtime --json
```

اگر داشبورد کارت‌ها را نشان می‌دهد اما CLI نشان نمی‌دهد، بررسی کنید که هر دو دستور از
تنظیم یکسان `--dev` یا `--profile` استفاده کنند.

### Dispatch می‌گوید فقط-داده

Gateway را شروع یا بازراه‌اندازی کنید:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

سپس دوباره `openclaw workboard dispatch` را امتحان کنید. fallback فقط-داده برای پاک‌سازی
وضعیت محلی مفید است، اما اجراهای کارگر به یک Gateway زنده نیاز دارند.

### Dispatch چیزی را شروع نمی‌کند

وجود دست‌کم یک کارت `ready` بدون claim فعال را بررسی کنید:

```bash
openclaw workboard list --status ready
```

کارت‌ها همچنین وقتی همان مالک از قبل کار در حال اجرا یا در بازبینی داشته باشد ممکن است نادیده گرفته شوند.
کار تکمیل‌شده را به `done` منتقل کنید، claimهای کهنه را از طریق ابزارهای Workboard آزاد کنید،
یا پس از پایان کارگر فعال دوباره dispatch را اجرا کنید.

## مرتبط

- [Plugin Workboard](/fa/plugins/workboard)
- [مرجع CLI](/fa/cli)
- [دستورهای اسلش](/fa/tools/slash-commands)
- [Control UI](/fa/web/control-ui)
