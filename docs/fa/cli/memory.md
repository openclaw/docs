---
read_when:
    - می‌خواهید حافظهٔ معنایی را نمایه‌سازی یا جست‌وجو کنید
    - در حال عیب‌یابی دسترس‌پذیری حافظه یا نمایه‌سازی هستید
    - می‌خواهید حافظهٔ کوتاه‌مدتِ بازیابی‌شده را به `MEMORY.md` ارتقا دهید
summary: مرجع CLI برای `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: حافظه
x-i18n:
    generated_at: "2026-05-06T17:54:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7137f8a9529095204699de5fee7a0baf5d5a377792dc93b4059145d0eefab737
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

نمایه‌سازی و جست‌وجوی حافظهٔ معنایی را مدیریت کنید.
ارائه‌شده توسط Plugin حافظهٔ فعال (پیش‌فرض: `memory-core`؛ برای غیرفعال‌کردن، `plugins.slots.memory = "none"` را تنظیم کنید).

مرتبط:

- مفهوم حافظه: [حافظه](/fa/concepts/memory)
- ویکی حافظه: [ویکی حافظه](/fa/plugins/memory-wiki)
- CLI ویکی: [wiki](/fa/cli/wiki)
- Pluginها: [Pluginها](/fa/tools/plugin)

## مثال‌ها

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

- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند. بدون آن، این دستورها برای هر عامل پیکربندی‌شده اجرا می‌شوند؛ اگر هیچ فهرست عاملی پیکربندی نشده باشد، به عامل پیش‌فرض برمی‌گردند.
- `--verbose`: هنگام بررسی‌ها و نمایه‌سازی، گزارش‌های دقیق منتشر می‌کند.

`memory status`:

- `--deep`: آمادگی ذخیره‌گاه برداری محلی، آمادگی ارائه‌دهندهٔ embedding، و آمادگی جست‌وجوی برداری معنایی را بررسی می‌کند. `memory status` ساده سریع می‌ماند و کار زندهٔ embedding یا کشف ارائه‌دهنده را اجرا نمی‌کند؛ وضعیت ناشناختهٔ ذخیره‌گاه برداری یا بردار معنایی یعنی در آن دستور بررسی نشده است. `searchMode: "search"` واژگانی QMD حتی با `--deep` هم بررسی‌های برداری معنایی و نگهداری embedding را رد می‌کند.
- `--index`: اگر ذخیره‌گاه dirty باشد، نمایه‌سازی مجدد اجرا می‌کند (به‌طور ضمنی `--deep`).
- `--fix`: قفل‌های recall کهنه را ترمیم می‌کند و فرادادهٔ ارتقا را نرمال‌سازی می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

اگر `memory status` مقدار `Dreaming status: blocked` را نشان دهد، Cron مدیریت‌شدهٔ Dreaming فعال است اما Heartbeat که آن را راه می‌اندازد برای عامل پیش‌فرض اجرا نمی‌شود. برای دو علت رایج، [Dreaming هرگز اجرا نمی‌شود](/fa/concepts/dreaming#dreaming-never-runs-status-shows-blocked) را ببینید.

`memory index`:

- `--force`: یک نمایه‌سازی مجدد کامل را اجباری می‌کند.

`memory search`:

- ورودی پرس‌وجو: یا `[query]` مکانی را پاس بدهید یا `--query <text>`.
- اگر هر دو ارائه شوند، `--query` اولویت دارد.
- اگر هیچ‌کدام ارائه نشود، دستور با خطا خارج می‌شود.
- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--max-results <n>`: تعداد نتایج بازگردانده‌شده را محدود می‌کند.
- `--min-score <n>`: تطابق‌های با امتیاز پایین را فیلتر می‌کند.
- `--json`: نتایج JSON چاپ می‌کند.

`memory promote`:

پیش‌نمایش و اعمال ارتقاهای حافظهٔ کوتاه‌مدت.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- ارتقاها را در `MEMORY.md` می‌نویسد (پیش‌فرض: فقط پیش‌نمایش).
- `--limit <n>` -- تعداد نامزدهای نمایش‌داده‌شده را محدود می‌کند.
- `--include-promoted` -- ورودی‌هایی را که پیش‌تر در چرخه‌های قبلی ارتقا یافته‌اند هم شامل می‌کند.

گزینه‌های کامل:

- نامزدهای کوتاه‌مدت را از `memory/YYYY-MM-DD.md` با استفاده از سیگنال‌های وزن‌دار ارتقا (`frequency`، `relevance`، `query diversity`، `recency`، `consolidation`، `conceptual richness`) رتبه‌بندی می‌کند.
- از سیگنال‌های کوتاه‌مدت هم از recallهای حافظه و هم از گذرهای ingestion روزانه، به‌علاوهٔ سیگنال‌های تقویتی فاز light/REM استفاده می‌کند.
- وقتی Dreaming فعال باشد، `memory-core` به‌طور خودکار یک کار Cron را مدیریت می‌کند که یک پیمایش کامل (`light -> REM -> deep`) را در پس‌زمینه اجرا می‌کند (نیازی به `openclaw cron add` دستی نیست).
- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--limit <n>`: بیشینهٔ نامزدهایی که بازگردانده/اعمال می‌شوند.
- `--min-score <n>`: کمینهٔ امتیاز وزن‌دار ارتقا.
- `--min-recall-count <n>`: کمینهٔ تعداد recall لازم برای یک نامزد.
- `--min-unique-queries <n>`: کمینهٔ تعداد پرس‌وجوهای متمایز لازم برای یک نامزد.
- `--apply`: نامزدهای انتخاب‌شده را به `MEMORY.md` اضافه می‌کند و آن‌ها را ارتقایافته علامت می‌زند.
- `--include-promoted`: نامزدهایی را که از قبل ارتقا یافته‌اند در خروجی شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

`memory promote-explain`:

یک نامزد ارتقای مشخص و تجزیهٔ امتیاز آن را توضیح می‌دهد.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: کلید نامزد، قطعه‌ای از مسیر، یا قطعه‌ای از snippet برای جست‌وجو.
- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--include-promoted`: نامزدهایی را که از قبل ارتقا یافته‌اند شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

`memory rem-harness`:

بازتاب‌های REM، حقیقت‌های نامزد، و خروجی ارتقای عمیق را بدون نوشتن هیچ‌چیز پیش‌نمایش می‌کند.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--include-promoted`: نامزدهای عمیقی را که از قبل ارتقا یافته‌اند شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

## Dreaming

Dreaming سامانهٔ تثبیت حافظه در پس‌زمینه است، با سه فاز همکار:
**light** (مرتب‌سازی/آماده‌سازی مواد کوتاه‌مدت)، **deep** (ارتقای
حقایق پایدار به `MEMORY.md`)، و **REM** (بازتاب و برجسته‌کردن مضمون‌ها).

- با `plugins.entries.memory-core.config.dreaming.enabled: true` فعال کنید.
- از چت با `/dreaming on|off` تغییر وضعیت دهید (یا با `/dreaming status` بررسی کنید).
- Dreaming طبق یک زمان‌بندی پیمایش مدیریت‌شده (`dreaming.frequency`) اجرا می‌شود و فازها را به‌ترتیب اجرا می‌کند: light، REM، deep.
- فقط فاز deep حافظهٔ پایدار را در `MEMORY.md` می‌نویسد.
- خروجی خوانای انسانی فازها و ورودی‌های دفترچه در `DREAMS.md` (یا `dreams.md` موجود) نوشته می‌شوند، با گزارش‌های اختیاری برای هر فاز در `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- رتبه‌بندی از سیگنال‌های وزن‌دار استفاده می‌کند: بسامد recall، ارتباط retrieval، تنوع پرس‌وجو، تازگی زمانی، تثبیت بین‌روزی، و غنای مفهومی مشتق‌شده.
- ارتقا پیش از نوشتن در `MEMORY.md` یادداشت روزانهٔ زنده را دوباره می‌خواند، بنابراین snippetهای کوتاه‌مدت ویرایش‌شده یا حذف‌شده از snapshotهای کهنهٔ recall-store ارتقا نمی‌گیرند.
- اجراهای زمان‌بندی‌شده و دستی `memory promote` همان پیش‌فرض‌های فاز deep را به‌اشتراک می‌گذارند، مگر اینکه بازنویسی‌های آستانهٔ CLI را پاس بدهید.
- اجراهای خودکار در سراسر workspaceهای حافظهٔ پیکربندی‌شده پخش می‌شوند.

زمان‌بندی پیش‌فرض:

- **آهنگ پیمایش**: `dreaming.frequency = 0 3 * * *`
- **آستانه‌های Deep**: `minScore=0.8`، `minRecallCount=3`، `minUniqueQueries=3`، `recencyHalfLifeDays=14`، `maxAgeDays=30`

مثال:

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

یادداشت‌ها:

- `memory index --verbose` جزئیات هر فاز را چاپ می‌کند (ارائه‌دهنده، مدل، منابع، فعالیت batch).
- `memory status` هر مسیر اضافی پیکربندی‌شده از طریق `memorySearch.extraPaths` را شامل می‌شود.
- اگر فیلدهای کلید API ریموت Active Memory که عملاً فعال هستند به‌صورت SecretRefs پیکربندی شده باشند، دستور آن مقدارها را از snapshot فعال Gateway resolve می‌کند. اگر Gateway در دسترس نباشد، دستور سریع شکست می‌خورد.
- یادداشت ناهمخوانی نسخهٔ Gateway: این مسیر دستور به Gatewayای نیاز دارد که از `secrets.resolve` پشتیبانی کند؛ Gatewayهای قدیمی‌تر خطای روش ناشناخته برمی‌گردانند.
- آهنگ پیمایش زمان‌بندی‌شده را با `dreaming.frequency` تنظیم کنید. سیاست ارتقای deep در غیر این صورت داخلی است؛ وقتی به بازنویسی‌های دستی یک‌باره نیاز دارید، روی `memory promote` از فلگ‌های CLI استفاده کنید.
- `memory rem-harness --path <file-or-dir> --grounded` از یادداشت‌های روزانهٔ تاریخی، `What Happened`، `Reflections`، و `Possible Lasting Updates` grounded را بدون نوشتن هیچ‌چیز پیش‌نمایش می‌کند.
- `memory rem-backfill --path <file-or-dir>` ورودی‌های دفترچهٔ grounded برگشت‌پذیر را برای بازبینی UI در `DREAMS.md` می‌نویسد.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` همچنین نامزدهای پایدار grounded را در ذخیره‌گاه ارتقای کوتاه‌مدت زنده seed می‌کند تا فاز deep عادی بتواند آن‌ها را رتبه‌بندی کند.
- `memory rem-backfill --rollback` ورودی‌های دفترچهٔ grounded نوشته‌شدهٔ قبلی را حذف می‌کند، و `memory rem-backfill --rollback-short-term` نامزدهای کوتاه‌مدت grounded آماده‌سازی‌شدهٔ قبلی را حذف می‌کند.
- برای توضیحات کامل فازها و مرجع پیکربندی، [Dreaming](/fa/concepts/dreaming) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی حافظه](/fa/concepts/memory)
