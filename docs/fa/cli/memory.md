---
read_when:
    - می‌خواهید حافظهٔ معنایی را نمایه‌سازی یا جست‌وجو کنید
    - در حال اشکال‌زدایی دسترس‌پذیری حافظه یا نمایه‌سازی هستید
    - می‌خواهید حافظهٔ کوتاه‌مدتِ بازیابی‌شده را به `MEMORY.md` ارتقا دهید
summary: مرجع CLI برای `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: حافظه
x-i18n:
    generated_at: "2026-04-29T22:36:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

نمایه‌سازی و جستجوی حافظهٔ معنایی را مدیریت کنید.
توسط Plugin حافظهٔ فعال ارائه می‌شود (پیش‌فرض: `memory-core`؛ برای غیرفعال‌سازی، `plugins.slots.memory = "none"` را تنظیم کنید).

مرتبط:

- مفهوم حافظه: [حافظه](/fa/concepts/memory)
- ویکی حافظه: [ویکی حافظه](/fa/plugins/memory-wiki)
- CLI ویکی: [wiki](/fa/cli/wiki)
- Plugins: [Plugins](/fa/tools/plugin)

## نمونه‌ها

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## گزینه‌ها

`memory status` و `memory index`:

- `--agent <id>`: محدوده را به یک عامل واحد محدود می‌کند. بدون آن، این دستورها برای هر عامل پیکربندی‌شده اجرا می‌شوند؛ اگر فهرست عاملی پیکربندی نشده باشد، به عامل پیش‌فرض برمی‌گردند.
- `--verbose`: هنگام کاوش‌ها و نمایه‌سازی، گزارش‌های مفصل منتشر می‌کند.

`memory status`:

- `--deep`: دسترس‌پذیری بردار + embedding را کاوش می‌کند. `memory status` ساده سریع می‌ماند و ping زندهٔ embedding اجرا نمی‌کند. `searchMode: "search"` واژگانی QMD حتی با `--deep` کاوش‌های بردار معنایی و نگهداشت embedding را رد می‌کند.
- `--index`: اگر ذخیره‌گاه dirty باشد، بازنمایه‌سازی اجرا می‌کند (به‌صورت ضمنی `--deep`).
- `--fix`: قفل‌های recall کهنه را تعمیر می‌کند و فرادادهٔ promotion را عادی‌سازی می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

اگر `memory status` مقدار `Dreaming status: blocked` را نشان دهد، Cron مدیریت‌شدهٔ Dreaming فعال است اما Heartbeat که آن را پیش می‌برد برای عامل پیش‌فرض اجرا نمی‌شود. برای دو علت رایج، [Dreaming هرگز اجرا نمی‌شود](/fa/concepts/dreaming#dreaming-never-runs-status-shows-blocked) را ببینید.

`memory index`:

- `--force`: بازنمایه‌سازی کامل را اجباری می‌کند.

`memory search`:

- ورودی پرس‌وجو: یا `[query]` موقعیتی را بدهید یا `--query <text>` را.
- اگر هر دو ارائه شوند، `--query` اولویت دارد.
- اگر هیچ‌کدام ارائه نشود، دستور با خطا خارج می‌شود.
- `--agent <id>`: محدوده را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--max-results <n>`: تعداد نتایج برگردانده‌شده را محدود می‌کند.
- `--min-score <n>`: تطابق‌های با امتیاز پایین را فیلتر می‌کند.
- `--json`: نتایج JSON چاپ می‌کند.

`memory promote`:

promotionهای حافظهٔ کوتاه‌مدت را پیش‌نمایش و اعمال کنید.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- promotionها را در `MEMORY.md` می‌نویسد (پیش‌فرض: فقط پیش‌نمایش).
- `--limit <n>` -- تعداد نامزدهای نمایش‌داده‌شده را محدود می‌کند.
- `--include-promoted` -- ورودی‌هایی را که از پیش در چرخه‌های قبلی promote شده‌اند نیز شامل می‌کند.

گزینه‌های کامل:

- نامزدهای کوتاه‌مدت را از `memory/YYYY-MM-DD.md` با استفاده از سیگنال‌های وزن‌دار promotion رتبه‌بندی می‌کند (`frequency`، `relevance`، `query diversity`، `recency`، `consolidation`، `conceptual richness`).
- از سیگنال‌های کوتاه‌مدت حاصل از recallهای حافظه و گذرهای دریافت روزانه، به‌علاوهٔ سیگنال‌های تقویتی فاز light/REM استفاده می‌کند.
- وقتی Dreaming فعال باشد، `memory-core` یک کار Cron را که sweep کامل (`light -> REM -> deep`) را در پس‌زمینه اجرا می‌کند، به‌طور خودکار مدیریت می‌کند (نیازی به `openclaw cron add` دستی نیست).
- `--agent <id>`: محدوده را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--limit <n>`: بیشینهٔ نامزدهایی که برگردانده/اعمال می‌شوند.
- `--min-score <n>`: کمینهٔ امتیاز وزن‌دار promotion.
- `--min-recall-count <n>`: کمینهٔ تعداد recall لازم برای یک نامزد.
- `--min-unique-queries <n>`: کمینهٔ تعداد پرس‌وجوهای متمایز لازم برای یک نامزد.
- `--apply`: نامزدهای انتخاب‌شده را به `MEMORY.md` اضافه می‌کند و آن‌ها را promote‌شده علامت‌گذاری می‌کند.
- `--include-promoted`: نامزدهای از قبل promote‌شده را در خروجی شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

`memory promote-explain`:

یک نامزد promotion مشخص و تفکیک امتیاز آن را توضیح دهید.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: کلید نامزد، بخش مسیر، یا بخش قطعه‌متنی برای جست‌وجو.
- `--agent <id>`: محدوده را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--include-promoted`: نامزدهای از قبل promote‌شده را شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

`memory rem-harness`:

بازتاب‌های REM، حقیقت‌های نامزد، و خروجی promotion عمیق را بدون نوشتن چیزی پیش‌نمایش کنید.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: محدوده را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--include-promoted`: نامزدهای عمیق از قبل promote‌شده را شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

## Dreaming

Dreaming سیستم پس‌زمینهٔ تثبیت حافظه با سه فاز همکار است:
**light** (مرتب‌سازی/مرحله‌بندی مواد کوتاه‌مدت)، **deep** (promote کردن
facts پایدار به `MEMORY.md`)، و **REM** (بازتاب و آشکارسازی درون‌مایه‌ها).

- با `plugins.entries.memory-core.config.dreaming.enabled: true` فعال کنید.
- از chat با `/dreaming on|off` تغییر وضعیت دهید (یا با `/dreaming status` بررسی کنید).
- Dreaming روی یک زمان‌بندی sweep مدیریت‌شده (`dreaming.frequency`) اجرا می‌شود و فازها را به‌ترتیب اجرا می‌کند: light، REM، deep.
- فقط فاز deep حافظهٔ پایدار را در `MEMORY.md` می‌نویسد.
- خروجی قابل‌خواندن برای انسان و ورودی‌های دفترچه در `DREAMS.md` (یا `dreams.md` موجود) نوشته می‌شوند، همراه با گزارش‌های اختیاری هر فاز در `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- رتبه‌بندی از سیگنال‌های وزن‌دار استفاده می‌کند: بسامد recall، ارتباط retrieval، تنوع پرس‌وجو، تازگی زمانی، تثبیت میان‌روزی، و غنای مفهومی مشتق‌شده.
- promotion پیش از نوشتن در `MEMORY.md`، یادداشت روزانهٔ زنده را دوباره می‌خواند، بنابراین قطعه‌های کوتاه‌مدت ویرایش‌شده یا حذف‌شده از snapshotهای کهنهٔ recall-store promote نمی‌شوند.
- اجراهای زمان‌بندی‌شده و اجرای دستی `memory promote` پیش‌فرض‌های فاز deep یکسانی دارند، مگر اینکه overrideهای آستانهٔ CLI را بدهید.
- اجراهای خودکار در سراسر workspaceهای حافظهٔ پیکربندی‌شده پخش می‌شوند.

زمان‌بندی پیش‌فرض:

- **آهنگ sweep**: `dreaming.frequency = 0 3 * * *`
- **آستانه‌های deep**: `minScore=0.8`، `minRecallCount=3`، `minUniqueQueries=3`، `recencyHalfLifeDays=14`، `maxAgeDays=30`

نمونه:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

نکته‌ها:

- `memory index --verbose` جزئیات هر فاز را چاپ می‌کند (provider، model، sources، فعالیت batch).
- `memory status` هر مسیر اضافه‌ای را که از طریق `memorySearch.extraPaths` پیکربندی شده باشد شامل می‌کند.
- اگر فیلدهای کلید API راه‌دور حافظهٔ فعال مؤثر به‌صورت SecretRefs پیکربندی شده باشند، دستور آن مقادیر را از snapshot فعال Gateway resolve می‌کند. اگر gateway دردسترس نباشد، دستور سریع شکست می‌خورد.
- نکتهٔ ناهمخوانی نسخهٔ Gateway: این مسیر دستور به gatewayای نیاز دارد که از `secrets.resolve` پشتیبانی کند؛ gatewayهای قدیمی‌تر خطای unknown-method برمی‌گردانند.
- آهنگ sweep زمان‌بندی‌شده را با `dreaming.frequency` تنظیم کنید. سیاست promotion عمیق در غیر این صورت داخلی است؛ وقتی به overrideهای دستی موردی نیاز دارید، از flagهای CLI روی `memory promote` استفاده کنید.
- `memory rem-harness --path <file-or-dir> --grounded` پیش‌نمایشی grounded از `What Happened`، `Reflections`، و `Possible Lasting Updates` را از یادداشت‌های روزانهٔ تاریخی بدون نوشتن چیزی نشان می‌دهد.
- `memory rem-backfill --path <file-or-dir>` ورودی‌های دفترچهٔ grounded و برگشت‌پذیر را برای بازبینی UI در `DREAMS.md` می‌نویسد.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` همچنین نامزدهای پایدار grounded را در ذخیره‌گاه promotion کوتاه‌مدت زنده seed می‌کند تا فاز deep عادی بتواند آن‌ها را رتبه‌بندی کند.
- `memory rem-backfill --rollback` ورودی‌های دفترچهٔ grounded نوشته‌شدهٔ قبلی را حذف می‌کند، و `memory rem-backfill --rollback-short-term` نامزدهای کوتاه‌مدت grounded مرحله‌بندی‌شدهٔ قبلی را حذف می‌کند.
- برای توضیح کامل فازها و مرجع پیکربندی، [Dreaming](/fa/concepts/dreaming) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی حافظه](/fa/concepts/memory)
