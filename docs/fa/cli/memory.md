---
read_when:
    - می‌خواهید حافظهٔ معنایی را نمایه‌سازی یا جست‌وجو کنید
    - در حال اشکال‌زداییِ دسترس‌پذیری حافظه یا نمایه‌سازی هستید
    - می‌خواهید حافظهٔ کوتاه‌مدتِ فراخوانی‌شده را به `MEMORY.md` ارتقا دهید
summary: مرجع CLI برای `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: حافظه
x-i18n:
    generated_at: "2026-05-03T21:28:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a33b848272c8853dd1a83e942124f0df30e096312e58a395c0ea08058e41f8fe
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

نمایه‌سازی و جست‌وجوی حافظهٔ معنایی را مدیریت کنید.
توسط Plugin حافظهٔ فعال ارائه می‌شود (پیش‌فرض: `memory-core`؛ برای غیرفعال‌سازی `plugins.slots.memory = "none"` را تنظیم کنید).

مرتبط:

- مفهوم حافظه: [حافظه](/fa/concepts/memory)
- ویکی حافظه: [ویکی حافظه](/fa/plugins/memory-wiki)
- CLI ویکی: [wiki](/fa/cli/wiki)
- Pluginها: [Pluginها](/fa/tools/plugin)

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

- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند. بدون آن، این فرمان‌ها برای هر عامل پیکربندی‌شده اجرا می‌شوند؛ اگر فهرست عاملی پیکربندی نشده باشد، به عامل پیش‌فرض برمی‌گردند.
- `--verbose`: هنگام پروب‌ها و نمایه‌سازی، گزارش‌های جزئی منتشر می‌کند.

`memory status`:

- `--deep`: آمادگی vector-store محلی، آمادگی embedding-provider، و آمادگی جست‌وجوی برداری معنایی را پروب می‌کند. `memory status` ساده سریع می‌ماند و embedding زنده یا کار کشف provider را اجرا نمی‌کند؛ وضعیت ناشناختهٔ vector-store یا semantic-vector یعنی در آن فرمان پروب نشده است. حالت واژگانی QMD با `searchMode: "search"` حتی با `--deep` پروب‌های برداری معنایی و نگهداری embedding را رد می‌کند.
- `--index`: اگر store کثیف باشد، بازنمایه‌سازی اجرا می‌کند (مستلزم `--deep`).
- `--fix`: قفل‌های recall مانده را تعمیر و فرادادهٔ promotion را نرمال می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

اگر `memory status` مقدار `Dreaming status: blocked` را نشان دهد، Cron مدیریت‌شدهٔ Dreaming فعال است اما Heartbeat که آن را به حرکت درمی‌آورد برای عامل پیش‌فرض اجرا نمی‌شود. برای دو علت رایج، [Dreaming هرگز اجرا نمی‌شود](/fa/concepts/dreaming#dreaming-never-runs-status-shows-blocked) را ببینید.

`memory index`:

- `--force`: یک بازنمایه‌سازی کامل را اجبار می‌کند.

`memory search`:

- ورودی پرس‌وجو: یا `[query]` جایگاهی را پاس دهید یا `--query <text>` را.
- اگر هر دو ارائه شوند، `--query` اولویت دارد.
- اگر هیچ‌کدام ارائه نشود، فرمان با خطا خارج می‌شود.
- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--max-results <n>`: تعداد نتایج برگشتی را محدود می‌کند.
- `--min-score <n>`: مطابقت‌های با امتیاز پایین را حذف می‌کند.
- `--json`: نتایج JSON چاپ می‌کند.

`memory promote`:

promotionهای حافظهٔ کوتاه‌مدت را پیش‌نمایش و اعمال کنید.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- promotionها را در `MEMORY.md` می‌نویسد (پیش‌فرض: فقط پیش‌نمایش).
- `--limit <n>` -- تعداد کاندیداهای نمایش‌داده‌شده را محدود می‌کند.
- `--include-promoted` -- ورودی‌هایی را که قبلاً در چرخه‌های پیشین promote شده‌اند نیز شامل می‌کند.

گزینه‌های کامل:

- کاندیداهای کوتاه‌مدت از `memory/YYYY-MM-DD.md` را با استفاده از سیگنال‌های وزن‌دار promotion رتبه‌بندی می‌کند (`frequency`، `relevance`، `query diversity`، `recency`، `consolidation`، `conceptual richness`).
- از سیگنال‌های کوتاه‌مدت هم از recallهای حافظه و هم از گذرهای دریافت روزانه، به‌علاوهٔ سیگنال‌های تقویتی فاز light/REM استفاده می‌کند.
- وقتی Dreaming فعال باشد، `memory-core` به‌طور خودکار یک Cron job را مدیریت می‌کند که یک sweep کامل (`light -> REM -> deep`) را در پس‌زمینه اجرا می‌کند (نیازی به `openclaw cron add` دستی نیست).
- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--limit <n>`: بیشینهٔ کاندیداها برای بازگرداندن/اعمال.
- `--min-score <n>`: کمینهٔ امتیاز وزن‌دار promotion.
- `--min-recall-count <n>`: کمینهٔ تعداد recall لازم برای یک کاندیدا.
- `--min-unique-queries <n>`: کمینهٔ تعداد پرس‌وجوهای متمایز لازم برای یک کاندیدا.
- `--apply`: کاندیداهای انتخاب‌شده را به `MEMORY.md` اضافه می‌کند و آن‌ها را promoted علامت‌گذاری می‌کند.
- `--include-promoted`: کاندیداهایی را که قبلاً promote شده‌اند در خروجی شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

`memory promote-explain`:

یک کاندیدای مشخص promotion و تفکیک امتیاز آن را توضیح می‌دهد.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: کلید کاندیدا، قطعهٔ مسیر، یا قطعهٔ snippet برای جست‌وجو.
- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--include-promoted`: کاندیداهایی را که قبلاً promote شده‌اند شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

`memory rem-harness`:

بازتاب‌های REM، حقیقت‌های کاندیدا، و خروجی promotion عمیق را بدون نوشتن چیزی پیش‌نمایش می‌کند.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--include-promoted`: کاندیداهای عمیقی را که قبلاً promote شده‌اند شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

## Dreaming

Dreaming سامانهٔ ادغام حافظه در پس‌زمینه است که سه فاز همکار دارد:
**light** (مرتب‌سازی/آماده‌سازی مواد کوتاه‌مدت)، **deep** (promote کردن
واقعیت‌های ماندگار به `MEMORY.md`)، و **REM** (بازتاب و آشکارسازی مضمون‌ها).

- با `plugins.entries.memory-core.config.dreaming.enabled: true` فعال کنید.
- از گفت‌وگو با `/dreaming on|off` تغییر دهید (یا با `/dreaming status` بررسی کنید).
- Dreaming روی یک زمان‌بندی sweep مدیریت‌شده (`dreaming.frequency`) اجرا می‌شود و فازها را به‌ترتیب اجرا می‌کند: light، REM، deep.
- فقط فاز deep حافظهٔ ماندگار را در `MEMORY.md` می‌نویسد.
- خروجی فاز و ورودی‌های diary به‌شکل خوانا برای انسان در `DREAMS.md` (یا `dreams.md` موجود) نوشته می‌شوند، با گزارش‌های اختیاری هر فاز در `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- رتبه‌بندی از سیگنال‌های وزن‌دار استفاده می‌کند: فراوانی recall، مرتبط‌بودن بازیابی، تنوع پرس‌وجو، تازگی زمانی، ادغام میان‌روزی، و غنای مفهومی مشتق‌شده.
- promotion پیش از نوشتن در `MEMORY.md` یادداشت روزانهٔ زنده را دوباره می‌خواند، بنابراین snippetهای کوتاه‌مدتی که ویرایش یا حذف شده‌اند از snapshotهای قدیمی recall-store promote نمی‌شوند.
- اجراهای زمان‌بندی‌شده و دستی `memory promote` پیش‌فرض‌های همان فاز deep را به‌اشتراک می‌گذارند، مگر اینکه overrideهای آستانهٔ CLI را پاس دهید.
- اجراهای خودکار در سراسر workspaceهای حافظهٔ پیکربندی‌شده fan out می‌شوند.

زمان‌بندی پیش‌فرض:

- **cadence sweep**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` جزئیات هر فاز را چاپ می‌کند (provider، مدل، منابع، فعالیت batch).
- `memory status` هر مسیر اضافهٔ پیکربندی‌شده از طریق `memorySearch.extraPaths` را شامل می‌شود.
- اگر فیلدهای کلید API راه دور active memory به‌صورت SecretRefs پیکربندی شده باشند، فرمان این مقادیر را از snapshot فعال Gateway resolve می‌کند. اگر Gateway در دسترس نباشد، فرمان سریع شکست می‌خورد.
- نکتهٔ ناسازگاری نسخهٔ Gateway: این مسیر فرمان به Gatewayای نیاز دارد که از `secrets.resolve` پشتیبانی کند؛ Gatewayهای قدیمی‌تر خطای روش ناشناخته برمی‌گردانند.
- cadence زمان‌بندی‌شدهٔ sweep را با `dreaming.frequency` تنظیم کنید. سیاست promotion عمیق در غیر این صورت داخلی است؛ وقتی به overrideهای دستی یک‌باره نیاز دارید، از flagهای CLI روی `memory promote` استفاده کنید.
- `memory rem-harness --path <file-or-dir> --grounded` از یادداشت‌های روزانهٔ تاریخی، `What Happened`، `Reflections`، و `Possible Lasting Updates` مبتنی بر منبع را بدون نوشتن چیزی پیش‌نمایش می‌کند.
- `memory rem-backfill --path <file-or-dir>` ورودی‌های diary مبتنی بر منبع و برگشت‌پذیر را برای بازبینی UI در `DREAMS.md` می‌نویسد.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` همچنین کاندیداهای ماندگار مبتنی بر منبع را در store زندهٔ promotion کوتاه‌مدت seed می‌کند تا فاز deep معمولی بتواند آن‌ها را رتبه‌بندی کند.
- `memory rem-backfill --rollback` ورودی‌های diary مبتنی بر منبعی را که قبلاً نوشته شده‌اند حذف می‌کند، و `memory rem-backfill --rollback-short-term` کاندیداهای کوتاه‌مدت مبتنی بر منبعی را که قبلاً stage شده‌اند حذف می‌کند.
- برای توضیحات کامل فازها و مرجع پیکربندی، [Dreaming](/fa/concepts/dreaming) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی حافظه](/fa/concepts/memory)
