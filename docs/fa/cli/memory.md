---
read_when:
    - می‌خواهید حافظهٔ معنایی را نمایه‌سازی یا جست‌وجو کنید
    - در حال اشکال‌زدایی دسترس‌پذیری حافظه یا نمایه‌سازی هستید
    - می‌خواهید حافظهٔ کوتاه‌مدت بازیابی‌شده را به `MEMORY.md` ارتقا دهید
summary: مرجع CLI برای `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: حافظه
x-i18n:
    generated_at: "2026-06-27T17:25:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

نمایه‌سازی و جست‌وجوی حافظهٔ معنایی را مدیریت کنید.
توسط Plugin همراه `memory-core` ارائه می‌شود. این دستور زمانی در دسترس است که
`plugins.slots.memory` گزینهٔ `memory-core` را انتخاب کند (پیش‌فرض)؛ Pluginهای حافظهٔ دیگر
فضاهای نام CLI خودشان را ارائه می‌کنند.

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

- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند. بدون آن، این دستورها برای هر عامل پیکربندی‌شده اجرا می‌شوند؛ اگر فهرست عاملی پیکربندی نشده باشد، به عامل پیش‌فرض بازمی‌گردند.
- `--verbose`: هنگام کاوش‌ها و نمایه‌سازی، گزارش‌های دقیق منتشر می‌کند.

`memory status`:

- `--deep`: آمادگی فروشگاه برداری محلی، آمادگی ارائه‌دهندهٔ embedding و آمادگی جست‌وجوی برداری معنایی را کاوش می‌کند. `memory status` ساده سریع می‌ماند و کار زندهٔ embedding یا کشف ارائه‌دهنده را اجرا نمی‌کند؛ وضعیت ناشناختهٔ فروشگاه برداری یا بردار معنایی یعنی در آن دستور کاوش نشده است. `searchMode: "search"` واژگانی QMD حتی با `--deep`، کاوش‌های برداری معنایی و نگهداشت embedding را رد می‌کند.
- `--index`: اگر فروشگاه dirty باشد، بازنمایه‌سازی اجرا می‌کند (مستلزم `--deep`).
- `--fix`: قفل‌های recall کهنه را تعمیر می‌کند و فرادادهٔ promotion را نرمال‌سازی می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

اگر `memory status` مقدار `Dreaming status: blocked` را نشان دهد، cron مدیریت‌شدهٔ Dreaming فعال است اما Heartbeat که آن را راه‌اندازی می‌کند برای عامل پیش‌فرض اجرا نمی‌شود. برای دو علت رایج، [Dreaming هرگز اجرا نمی‌شود](/fa/concepts/dreaming#dreaming-never-runs-status-shows-blocked) را ببینید.

`memory index`:

- `--force`: بازنمایه‌سازی کامل را اجباری می‌کند.

`memory search`:

- ورودی پرس‌وجو: یکی از ورودی‌های موقعیتی `[query]` یا `--query <text>` را پاس دهید.
- اگر هر دو ارائه شوند، `--query` برنده می‌شود.
- اگر هیچ‌کدام ارائه نشود، دستور با خطا خارج می‌شود.
- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--max-results <n>`: تعداد نتایج برگشتی را محدود می‌کند.
- `--min-score <n>`: تطابق‌های با امتیاز پایین را فیلتر می‌کند.
- `--json`: نتایج JSON چاپ می‌کند.

`memory promote`:

promotionهای حافظهٔ کوتاه‌مدت را پیش‌نمایش و اعمال کنید.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- promotionها را در `MEMORY.md` می‌نویسد (پیش‌فرض: فقط پیش‌نمایش).
- `--limit <n>` -- تعداد نامزدهای نمایش‌داده‌شده را محدود می‌کند.
- `--include-promoted` -- ورودی‌هایی را که از قبل در چرخه‌های قبلی promote شده‌اند شامل می‌کند.

گزینه‌های کامل:

- نامزدهای کوتاه‌مدت را از `memory/YYYY-MM-DD.md` با استفاده از سیگنال‌های promotion وزن‌دار (`frequency`، `relevance`، `query diversity`، `recency`، `consolidation`، `conceptual richness`) رتبه‌بندی می‌کند.
- از سیگنال‌های کوتاه‌مدت هم از recallهای حافظه و هم از گذرهای جذب روزانه، به‌علاوهٔ سیگنال‌های تقویتی فازهای سبک/REM استفاده می‌کند.
- وقتی Dreaming فعال باشد، `memory-core` به‌صورت خودکار یک کار cron را مدیریت می‌کند که یک sweep کامل (`light -> REM -> deep`) را در پس‌زمینه اجرا می‌کند (نیازی به `openclaw cron add` دستی نیست).
- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--limit <n>`: بیشینهٔ نامزدهایی که بازگردانده/اعمال می‌شوند.
- `--min-score <n>`: کمینهٔ امتیاز promotion وزن‌دار.
- `--min-recall-count <n>`: کمینهٔ شمار recall لازم برای یک نامزد.
- `--min-unique-queries <n>`: کمینهٔ شمار پرس‌وجوی متمایز لازم برای یک نامزد.
- `--apply`: نامزدهای انتخاب‌شده را به `MEMORY.md` اضافه می‌کند و آن‌ها را promote‌شده علامت می‌زند.
- `--include-promoted`: نامزدهای از قبل promote‌شده را در خروجی شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

`memory promote-explain`:

یک نامزد promotion مشخص و تفکیک امتیاز آن را توضیح دهید.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: کلید نامزد، قطعه‌ای از مسیر، یا قطعه‌ای از snippet برای جست‌وجو.
- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--include-promoted`: نامزدهای از قبل promote‌شده را شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

`memory rem-harness`:

بازتاب‌های REM، حقیقت‌های نامزد، و خروجی promotion عمیق را بدون نوشتن هیچ‌چیز پیش‌نمایش کنید.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--include-promoted`: نامزدهای عمیق از قبل promote‌شده را شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

## Dreaming

Dreaming سامانهٔ پس‌زمینهٔ consolidation حافظه با سه فاز همکار است:
**light** (مرتب‌سازی/آماده‌سازی مواد کوتاه‌مدت)، **deep** (promote کردن
واقعیت‌های پایدار به `MEMORY.md`)، و **REM** (بازتاب و نمایان‌کردن تم‌ها).

- با `plugins.entries.memory-core.config.dreaming.enabled: true` فعال کنید.
- از چت با `/dreaming on|off` تغییر وضعیت دهید (یا با `/dreaming status` بررسی کنید).
- Dreaming بر اساس یک برنامهٔ sweep مدیریت‌شده (`dreaming.frequency`) اجرا می‌شود و فازها را به‌ترتیب اجرا می‌کند: light، REM، deep.
- فقط فاز deep حافظهٔ پایدار را در `MEMORY.md` می‌نویسد.
- خروجی فاز قابل‌خواندن برای انسان و ورودی‌های دفترچه در `DREAMS.md` (یا `dreams.md` موجود) نوشته می‌شوند، با گزارش‌های اختیاری هر فاز در `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- رتبه‌بندی از سیگنال‌های وزن‌دار استفاده می‌کند: بسامد recall، ارتباط retrieval، تنوع پرس‌وجو، تازگی زمانی، consolidation بین‌روزی، و غنای مفهومی مشتق‌شده.
- promotion پیش از نوشتن در `MEMORY.md` یادداشت روزانهٔ زنده را دوباره می‌خواند، بنابراین snippetهای کوتاه‌مدت ویرایش‌شده یا حذف‌شده از snapshotهای کهنهٔ recall-store promote نمی‌شوند.
- اجراهای زمان‌بندی‌شده و `memory promote` دستی، همان پیش‌فرض‌های فاز deep را به اشتراک می‌گذارند مگر اینکه overrideهای آستانهٔ CLI را پاس دهید.
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

- `memory index --verbose` جزئیات هر فاز را چاپ می‌کند (ارائه‌دهنده، مدل، منابع، فعالیت batch).
- `memory status` هر مسیر اضافی پیکربندی‌شده از طریق `memorySearch.extraPaths` را شامل می‌کند.
- اگر فیلدهای کلید API راه‌دور Active Memory به‌طور مؤثر به‌صورت SecretRefs پیکربندی شده باشند، دستور آن مقادیر را از snapshot فعال Gateway resolve می‌کند. اگر Gateway در دسترس نباشد، دستور سریعاً fail می‌شود.
- یادداشت ناهمخوانی نسخهٔ Gateway: این مسیر دستور به Gatewayای نیاز دارد که از `secrets.resolve` پشتیبانی کند؛ Gatewayهای قدیمی‌تر خطای unknown-method برمی‌گردانند.
- cadence زمان‌بندی‌شدهٔ sweep را با `dreaming.frequency` تنظیم کنید. سیاست promotion عمیق در غیر این صورت داخلی است، به‌جز `dreaming.phases.deep.maxPromotedSnippetTokens` که طول snippet promote‌شده را محدود می‌کند و در عین حال provenance را قابل‌مشاهده نگه می‌دارد. وقتی به overrideهای دستی یک‌بارهٔ آستانه نیاز دارید، از flagهای CLI روی `memory promote` استفاده کنید.
- `memory rem-harness --path <file-or-dir> --grounded` از یادداشت‌های روزانهٔ تاریخی، `What Happened`، `Reflections`، و `Possible Lasting Updates` grounded را بدون نوشتن هیچ‌چیز پیش‌نمایش می‌کند.
- `memory rem-backfill --path <file-or-dir>` ورودی‌های دفترچهٔ grounded برگشت‌پذیر را برای بازبینی UI در `DREAMS.md` می‌نویسد.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` همچنین نامزدهای پایدار grounded را در فروشگاه promotion کوتاه‌مدت زنده seed می‌کند تا فاز deep معمول بتواند آن‌ها را رتبه‌بندی کند.
- `memory rem-backfill --rollback` ورودی‌های دفترچهٔ grounded را که قبلاً نوشته شده‌اند حذف می‌کند، و `memory rem-backfill --rollback-short-term` نامزدهای کوتاه‌مدت grounded را که قبلاً stage شده‌اند حذف می‌کند.
- برای توضیحات کامل فازها و مرجع پیکربندی، [Dreaming](/fa/concepts/dreaming) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی حافظه](/fa/concepts/memory)
