---
read_when:
    - می‌خواهید حافظهٔ معنایی را نمایه‌سازی یا جست‌وجو کنید
    - در حال اشکال‌زدایی دسترس‌پذیری حافظه یا نمایه‌سازی هستید
    - می‌خواهید حافظه کوتاه‌مدت بازیابی‌شده را به `MEMORY.md` ارتقا دهید
summary: مرجع CLI برای `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: حافظه
x-i18n:
    generated_at: "2026-06-30T14:14:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

نمایه‌سازی و جست‌وجوی حافظهٔ معنایی را مدیریت کنید.
توسط Plugin همراه `memory-core` ارائه می‌شود. این دستور زمانی در دسترس است که
`plugins.slots.memory` مقدار `memory-core` را انتخاب کند (پیش‌فرض)؛ سایر Pluginهای حافظه
فضاهای نام CLI خودشان را ارائه می‌کنند.

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

- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند. بدون آن، این دستورها برای هر عامل پیکربندی‌شده اجرا می‌شوند؛ اگر فهرست عاملی پیکربندی نشده باشد، به عامل پیش‌فرض برمی‌گردند.
- `--verbose`: هنگام بررسی‌ها و نمایه‌سازی، گزارش‌های تفصیلی منتشر می‌کند.

`memory status`:

- `--deep`: آمادگی ذخیره‌گاه برداری محلی، آمادگی ارائه‌دهندهٔ embedding، و آمادگی جست‌وجوی برداری معنایی را بررسی می‌کند. `memory status` ساده سریع می‌ماند و کار زندهٔ embedding یا کشف ارائه‌دهنده را اجرا نمی‌کند؛ وضعیت ناشناختهٔ ذخیره‌گاه برداری یا بردار معنایی یعنی در آن دستور بررسی نشده است. حالت واژگانی QMD با `searchMode: "search"` حتی با `--deep` بررسی‌های برداری معنایی و نگهداشت embedding را رد می‌کند.
- `--index`: اگر ذخیره‌گاه کثیف باشد، بازنمایه‌سازی اجرا می‌کند (مستلزم `--deep` است).
- `--fix`: قفل‌های recall کهنه را تعمیر و فرادادهٔ promotion را نرمال‌سازی می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

اگر `memory status` نشان دهد `Dreaming status: blocked`، Cron مدیریت‌شدهٔ Dreaming فعال است اما Heartbeat محرک آن برای عامل پیش‌فرض اجرا نمی‌شود. برای دو علت رایج، [Dreaming هرگز اجرا نمی‌شود](/fa/concepts/dreaming#dreaming-never-runs-status-shows-blocked) را ببینید.

`memory index`:

- `--force`: یک بازنمایه‌سازی کامل را اجباری می‌کند.

`memory search`:

- ورودی پرس‌وجو: یا `[query]` مکانی را بدهید یا `--query <text>`.
- اگر هر دو ارائه شوند، `--query` اولویت دارد.
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
- `--limit <n>` -- تعداد نامزدهای نمایش‌داده‌شده را سقف‌گذاری می‌کند.
- `--include-promoted` -- ورودی‌هایی را که در چرخه‌های قبلی از قبل promote شده‌اند شامل می‌کند.

گزینه‌های کامل:

- نامزدهای کوتاه‌مدت را از `memory/YYYY-MM-DD.md` با استفاده از سیگنال‌های وزن‌دار promotion (`frequency`، `relevance`، `query diversity`، `recency`، `consolidation`، `conceptual richness`) رتبه‌بندی می‌کند.
- از سیگنال‌های کوتاه‌مدت هم از recallهای حافظه و هم از گذرهای ingestion روزانه، به‌علاوهٔ سیگنال‌های تقویتی مرحلهٔ light/REM استفاده می‌کند.
- وقتی Dreaming فعال باشد، `memory-core` یک کار Cron را به‌صورت خودکار مدیریت می‌کند که یک جاروب کامل (`light -> REM -> deep`) را در پس‌زمینه اجرا می‌کند (نیازی به `openclaw cron add` دستی نیست).
- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--limit <n>`: حداکثر نامزدها برای بازگرداندن/اعمال.
- `--min-score <n>`: حداقل امتیاز وزن‌دار promotion.
- `--min-recall-count <n>`: حداقل تعداد recall لازم برای یک نامزد.
- `--min-unique-queries <n>`: حداقل تعداد پرس‌وجوهای متمایز لازم برای یک نامزد.
- `--apply`: نامزدهای انتخاب‌شده را به `MEMORY.md` اضافه می‌کند و آن‌ها را promote‌شده علامت می‌زند.
- `--include-promoted`: نامزدهایی را که از قبل promote شده‌اند در خروجی شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

`memory promote-explain`:

یک نامزد promotion مشخص و تفکیک امتیاز آن را توضیح می‌دهد.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: کلید نامزد، قطعه‌ای از مسیر، یا قطعه‌ای از snippet برای جست‌وجو.
- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--include-promoted`: نامزدهایی را که از قبل promote شده‌اند شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

`memory rem-harness`:

بازتاب‌های REM، حقیقت‌های نامزد، و خروجی promotion عمیق را بدون نوشتن هیچ‌چیز پیش‌نمایش می‌کند.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: دامنه را به یک عامل واحد محدود می‌کند (پیش‌فرض: عامل پیش‌فرض).
- `--include-promoted`: نامزدهای عمیقی را که از قبل promote شده‌اند شامل می‌کند.
- `--json`: خروجی JSON چاپ می‌کند.

## Dreaming

Dreaming سامانهٔ تحکیم حافظه در پس‌زمینه است، با سه
مرحلهٔ همکاری‌کننده: **light** (مرتب‌سازی/آماده‌سازی مواد کوتاه‌مدت)، **deep** (promote کردن
واقعیت‌های پایدار به `MEMORY.md`)، و **REM** (بازتاب و نمایان‌کردن مضمون‌ها).

- با `plugins.entries.memory-core.config.dreaming.enabled: true` فعال کنید.
- از گفت‌وگو با `/dreaming on|off` تغییر وضعیت دهید (یا با `/dreaming status` بررسی کنید).
  فراخوان‌های کانال برای تغییر این تنظیم باید مالک باشند؛ کلاینت‌های Gateway به
  `operator.admin` نیاز دارند. وضعیت فقط‌خواندنی و راهنما برای ارسال‌کنندگان مجاز
  دستور همچنان در دسترس می‌مانند.
- Dreaming روی یک زمان‌بندی جاروب مدیریت‌شده (`dreaming.frequency`) اجرا می‌شود و مراحل را به‌ترتیب اجرا می‌کند: light، REM، deep.
- فقط مرحلهٔ deep حافظهٔ پایدار را در `MEMORY.md` می‌نویسد.
- خروجی خوانای انسانی مرحله و ورودی‌های دفترچه در `DREAMS.md` (یا `dreams.md` موجود) نوشته می‌شوند، با گزارش‌های اختیاری برای هر مرحله در `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- رتبه‌بندی از سیگنال‌های وزن‌دار استفاده می‌کند: فراوانی recall، ارتباط retrieval، تنوع پرس‌وجو، تازگی زمانی، تحکیم میان‌روزی، و غنای مفهومی مشتق‌شده.
- promotion پیش از نوشتن در `MEMORY.md` یادداشت روزانهٔ زنده را دوباره می‌خواند، بنابراین snippetهای کوتاه‌مدت ویرایش‌شده یا حذف‌شده از snapshotهای کهنهٔ recall-store promote نمی‌شوند.
- اجراهای زمان‌بندی‌شده و دستی `memory promote` پیش‌فرض‌های مرحلهٔ deep یکسانی را به اشتراک می‌گذارند، مگر اینکه overrideهای آستانهٔ CLI را بدهید.
- اجراهای خودکار در سراسر workspaceهای حافظهٔ پیکربندی‌شده پخش می‌شوند.

زمان‌بندی پیش‌فرض:

- **آهنگ جاروب**: `dreaming.frequency = 0 3 * * *`
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

نکته‌ها:

- `memory index --verbose` جزئیات هر مرحله را چاپ می‌کند (ارائه‌دهنده، مدل، منابع، فعالیت batch).
- `memory status` هر مسیر اضافی پیکربندی‌شده از طریق `memorySearch.extraPaths` را شامل می‌شود.
- اگر فیلدهای کلید API راه‌دور Active Memory که عملاً فعال هستند به‌صورت SecretRefs پیکربندی شده باشند، دستور آن مقادیر را از snapshot فعال Gateway حل می‌کند. اگر Gateway در دسترس نباشد، دستور سریعاً شکست می‌خورد.
- نکتهٔ ناهمخوانی نسخهٔ Gateway: این مسیر دستور به Gatewayای نیاز دارد که از `secrets.resolve` پشتیبانی کند؛ Gatewayهای قدیمی‌تر خطای unknown-method برمی‌گردانند.
- آهنگ جاروب زمان‌بندی‌شده را با `dreaming.frequency` تنظیم کنید. سیاست promotion عمیق در غیر این صورت داخلی است، به‌جز `dreaming.phases.deep.maxPromotedSnippetTokens` که طول snippet promote‌شده را محدود می‌کند و در عین حال منشأ را قابل مشاهده نگه می‌دارد. وقتی به overrideهای دستی و یک‌بارهٔ آستانه نیاز دارید، از پرچم‌های CLI روی `memory promote` استفاده کنید.
- `memory rem-harness --path <file-or-dir> --grounded` از یادداشت‌های روزانهٔ تاریخی، `What Happened`، `Reflections`، و `Possible Lasting Updates` مبتنی بر زمینه را بدون نوشتن هیچ‌چیز پیش‌نمایش می‌کند.
- `memory rem-backfill --path <file-or-dir>` ورودی‌های دفترچهٔ مبتنی بر زمینه و برگشت‌پذیر را برای بازبینی UI در `DREAMS.md` می‌نویسد.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` همچنین نامزدهای پایدار مبتنی بر زمینه را در ذخیره‌گاه promotion کوتاه‌مدت زنده seed می‌کند تا مرحلهٔ deep عادی بتواند آن‌ها را رتبه‌بندی کند.
- `memory rem-backfill --rollback` ورودی‌های دفترچهٔ مبتنی بر زمینهٔ نوشته‌شدهٔ قبلی را حذف می‌کند، و `memory rem-backfill --rollback-short-term` نامزدهای کوتاه‌مدت مبتنی بر زمینهٔ stage‌شدهٔ قبلی را حذف می‌کند.
- برای توضیحات کامل مراحل و مرجع پیکربندی، [Dreaming](/fa/concepts/dreaming) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [نمای کلی حافظه](/fa/concepts/memory)
