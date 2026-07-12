---
read_when:
    - می‌خواهید از CLI مربوط به memory-wiki استفاده کنید
    - شما در حال مستندسازی یا تغییر `openclaw wiki` هستید
summary: مرجع CLI برای `openclaw wiki` (وضعیت مخزن memory-wiki، جست‌وجو، کامپایل، بررسی، اعمال، پل ارتباطی، واردکردن از ChatGPT و ابزارهای کمکی Obsidian)
title: ویکی
x-i18n:
    generated_at: "2026-07-12T09:52:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

مخزن `memory-wiki` را بررسی و نگهداری کنید. این قابلیت توسط Plugin همراهِ `memory-wiki` ارائه می‌شود.

مرتبط: [Plugin ویکی حافظه](/fa/plugins/memory-wiki)، [نمای کلی حافظه](/fa/concepts/memory)، [CLI: حافظه](/fa/cli/memory)

## فرمان‌های رایج

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## انتخاب عامل

وقتی مقدار `plugins.entries.memory-wiki.config.vault.scope` برابر با `agent` است، مخزن را با گزینهٔ سطح‌بالای `--agent <id>` انتخاب کنید:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

در راه‌اندازی دارای چند عامل پیکربندی‌شده، گزینهٔ `--agent` برای عملیات CLI الزامی است تا هیچ فرمانی نتواند یک مخزن پیش‌فرض دلخواه را بخواند یا بنویسد. اگر فقط یک عامل پیکربندی شده باشد، همان عامل پیش‌فرض باقی می‌ماند. شناسه‌های ناشناختهٔ عامل پیش از آغاز عملیات مخزن با خطا مواجه می‌شوند. وقتی `vault.scope` برابر با `global` است، این گزینه مسیر انتخاب‌شده را تغییر نمی‌دهد.

کلاینت‌های Gateway نیز از همین قاعده پیروی می‌کنند: در راه‌اندازی چندعاملی با دامنهٔ عامل، در درخواست‌های `wiki.*` متکی به مخزن، `agentId` را ارسال کنید. شناسهٔ مفقود یا ناشناخته خطا محسوب می‌شود. نوبت‌های عامل، ابزارهای ویکی، مکمل‌های پیکرهٔ حافظه و چکیده‌های کامپایل‌شدهٔ پرامپت از قبل زمینهٔ عامل فعال در زمان اجرا را حمل می‌کنند.

## فرمان‌ها

### `wiki status`

حالت و دامنهٔ مخزن، عامل حل‌شده، سلامت و دسترس‌پذیری CLI مربوط به Obsidian را نمایش می‌دهد. ابتدا از این فرمان استفاده کنید تا بررسی کنید آیا مخزن موردنظر مقداردهی اولیه شده، حالت پل سالم است یا یکپارچه‌سازی Obsidian در دسترس است.

وقتی حالت پل فعال است و برای خواندن مصنوعات حافظه پیکربندی شده، این فرمان از Gateway در حال اجرا پرس‌وجو می‌کند تا همان زمینهٔ Plugin حافظهٔ فعال در حافظهٔ عامل/زمان اجرا را ببیند.

### `wiki doctor`

بررسی‌های سلامت ویکی را اجرا و راه‌حل‌های عملی را گزارش می‌کند. در صورت ناسالم بودن، با کد غیرصفر خارج می‌شود.

وقتی حالت پل فعال است و برای خواندن مصنوعات حافظه پیکربندی شده، این فرمان پیش از ساخت گزارش از Gateway در حال اجرا پرس‌وجو می‌کند. واردسازی‌های غیرفعال پل و پیکربندی‌های پلی که مصنوعات حافظه را نمی‌خوانند، محلی/برون‌خط باقی می‌مانند.

مشکلات معمول:

- فعال بودن حالت پل بدون مصنوعات عمومی حافظه
- چیدمان نامعتبر یا مفقود مخزن
- مفقود بودن CLI خارجی Obsidian هنگامی که حالت Obsidian مورد انتظار است

### `wiki init`

چیدمان مخزن ویکی و صفحه‌های آغازین، شامل نمایه‌های سطح‌بالا و پوشه‌های حافظهٔ نهان را ایجاد می‌کند.

### `wiki ingest <path>`

یک فایل محلی Markdown یا متنی را به‌عنوان صفحهٔ منبع، در پوشهٔ `sources/` ویکی وارد می‌کند. `<path>` باید مسیر یک فایل محلی باشد؛ در حال حاضر واردسازی از URL وجود ندارد. فایل‌های دودویی رد می‌شوند.

صفحه‌های منبع واردشده فرادادهٔ منشأ (`sourceType: local-file`، `sourcePath`، `ingestedAt`) دارند. پس از واردسازی، مخزن همیشه دوباره کامپایل می‌شود.

پرچم‌ها: `--title <title>` عنوان منبع را بازنویسی می‌کند (پیش‌فرض: برگرفته از نام فایل).

### `wiki okf import <path>`

یک بستهٔ بازشده با قالب Open Knowledge Format را به صفحه‌های مفهومی ویکی وارد می‌کند.

واردکننده همهٔ سندهای مفهومی رزروشده‌نبودۀ `.md` را در درخت پوشهٔ OKF می‌خواند، وجود فیلد غیرخالی `type` را الزامی می‌داند و مقادیر ناشناختهٔ `type` در OKF را به‌عنوان مفاهیم عمومی در نظر می‌گیرد. فایل‌های رزروشدهٔ `index.md` و `log.md` در OKF به‌عنوان مفهوم وارد نمی‌شوند.

صفحه‌های واردشده زیر `concepts/` مسطح می‌شوند تا روندهای فعلی کامپایل، جست‌وجو، دریافت، چکیده و داشبورد ویکی فوراً آن‌ها را ببینند. شناسهٔ اصلی مفهوم در OKF، `type`، `resource`، `tags`، مُهر زمانی، مسیر منبع و کل فراداده در فرادادهٔ صفحه حفظ می‌شوند. پیوندهای داخلی Markdown در OKF به صفحه‌های تولیدشدهٔ ویکی بازنویسی می‌شوند؛ پیوندهای خراب یا خارجی بدون تغییر باقی می‌مانند. پس از واردسازی، مخزن همیشه دوباره کامپایل می‌شود.

نمونه‌ها:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

نمایه‌ها، بلوک‌های مرتبط، داشبوردها و چکیده‌های کامپایل‌شده را از نو می‌سازد. مصنوعات پایدار ماشین‌محور را در مسیرهای زیر می‌نویسد:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

اگر `render.createDashboards` فعال باشد، کامپایل صفحه‌های گزارش را نیز تازه‌سازی می‌کند.

### `wiki lint`

مخزن را وارسی می‌کند و گزارشی شامل موارد زیر می‌نویسد:

- مشکلات ساختاری (پیوندهای خراب، شناسه‌های مفقود/تکراری، نوع یا عنوان مفقود صفحه، فرادادهٔ نامعتبر)
- شکاف‌های منشأ (شناسه‌های مفقود منبع، منشأ مفقود واردسازی)
- تناقض‌ها (تناقض‌های علامت‌گذاری‌شده، ادعاهای متعارض)
- پرسش‌های باز
- صفحه‌ها و ادعاهای با اطمینان پایین
- صفحه‌ها و ادعاهای منسوخ

این فرمان را پس از به‌روزرسانی‌های مهم ویکی اجرا کنید.

### `wiki search <query>`

محتوای ویکی را جست‌وجو می‌کند. رفتار به پیکربندی بستگی دارد:

- `search.backend`: `shared` یا `local`
- `search.corpus`: `wiki`، `memory` یا `all`
- `--mode`: `auto`، `find-person`، `route-question`، `source-evidence` یا `raw-claim`

برای رتبه‌بندی و منشأ ویژهٔ ویکی از `wiki search` استفاده کنید. برای یک مرحلهٔ گستردهٔ یادآوری مشترک، هنگامی که Plugin حافظهٔ فعال جست‌وجوی مشترک را ارائه می‌کند، `openclaw memory search` را ترجیح دهید.

حالت‌های جست‌وجو:

- `find-person`: نام‌های مستعار، نام‌های کاربری، شبکه‌های اجتماعی، شناسه‌های معیار و صفحه‌های افراد
- `route-question`: راهنمای «از چه کسی بپرسیم»/«بهترین کاربرد» و زمینهٔ ارتباط
- `source-evidence`: صفحه‌های منبع و فیلدهای ساختاریافتهٔ شواهد
- `raw-claim`: متن ساختاریافتهٔ ادعا همراه با فرادادهٔ ادعا/شواهد

نمونه‌ها:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

وقتی نتیجه‌ای با یک ادعای ساختاریافته تطبیق داشته باشد، خروجی متنی شامل خط‌های `Claim:` و `Evidence:` است. خروجی JSON علاوه بر این، `matchedClaimId`، `matchedClaimStatus`، `matchedClaimConfidence`، `evidenceKinds` و `evidenceSourceIds` را برای بررسی عمیق از سمت عامل ارائه می‌کند.

### `wiki get <lookup>`

یک صفحهٔ ویکی را با شناسه یا مسیر نسبی می‌خواند.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

بدون جراحی آزادانهٔ صفحه، تغییرات محدود را اعمال می‌کند:

- `apply synthesis <title>`: یک صفحهٔ ترکیبی با بدنهٔ خلاصهٔ مدیریت‌شده ایجاد یا تازه‌سازی می‌کند
- `apply metadata <lookup>`: فرادادهٔ یک صفحهٔ موجود را به‌روزرسانی می‌کند

هر دو گزینه‌های `--source-id`، `--contradiction` و `--question` (هرکدام قابل تکرار)، `--confidence <n>` (از ۰ تا ۱) و `--status <status>` را می‌پذیرند. `apply metadata` همچنین گزینهٔ `--clear-confidence` را برای حذف مقدار اطمینان ذخیره‌شده می‌پذیرد. این روش پشتیبانی‌شده برای تکامل صفحه‌های ویکی است تا بلوک‌های مدیریت‌شدهٔ تولیدی دست‌نخورده باقی بمانند.

### `wiki bridge import`

مصنوعات عمومی حافظه را از Plugin حافظهٔ فعال به صفحه‌های منبع متکی به پل وارد می‌کند. در حالت `bridge` از این فرمان برای انتقال تازه‌ترین مصنوعات صادرشدهٔ حافظه به مخزن ویکی استفاده کنید.

برای خواندن مصنوعات فعال پل، CLI واردسازی را از طریق RPC مربوط به Gateway هدایت می‌کند تا از زمینهٔ Plugin حافظه در زمان اجرا استفاده شود. اگر واردسازی‌های پل غیرفعال باشند یا خواندن مصنوعات خاموش باشد، فرمان رفتار محلی/برون‌خط با صفر واردسازی را حفظ می‌کند. تازه‌سازی نمایه پس از واردسازی با `ingest.autoCompile` کنترل می‌شود.

### `wiki unsafe-local import`

در حالت `unsafe-local`، از مسیرهای محلی که صراحتاً در `unsafeLocal.paths` پیکربندی شده‌اند وارد می‌کند. این قابلیت عمداً آزمایشی و محدود به همان ماشین است. تازه‌سازی نمایه پس از واردسازی با `ingest.autoCompile` کنترل می‌شود.

### `wiki chatgpt import`

یک خروجی ChatGPT را به صفحه‌های منبع پیش‌نویس ویکی وارد می‌کند.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| پرچم             | پیش‌فرض    | توضیحات                                                                |
| ----------------- | ---------- | ---------------------------------------------------------------------- |
| `--export <path>` | (الزامی)   | پوشهٔ خروجی ChatGPT یا مسیر `conversations.json`.                      |
| `--dry-run`       | `false`    | پیش‌نمایش تعداد موارد ایجادشده/به‌روزشده/ردشده بدون نوشتن صفحه‌ها.     |

یک واردسازی غیرآزمایشی که هر صفحه‌ای را تغییر دهد، شناسهٔ اجرای واردسازی را ثبت می‌کند که در خلاصه چاپ می‌شود و برای بازگردانی لازم است.

### `wiki chatgpt rollback <run-id>`

یک اجرای واردسازی ChatGPT را که قبلاً اعمال شده بازمی‌گرداند، صفحه‌های ایجادشده توسط آن را حذف می‌کند و صفحه‌هایی را که بازنویسی کرده بود بازیابی می‌کند. اگر اجرا قبلاً بازگردانده شده باشد، هیچ عملی انجام نمی‌دهد (و `alreadyRolledBack` را گزارش می‌کند).

### `wiki obsidian ...`

فرمان‌های کمکی Obsidian برای مخزن‌هایی که در حالت سازگار با Obsidian اجرا می‌شوند: `status`، `search`، `open`، `command`، `daily`. وقتی `obsidian.useOfficialCli` فعال است، این فرمان‌ها به CLI رسمی `obsidian` در `PATH` نیاز دارند.

اعتبارسنجی پیکربندی، مقدار `obsidian.useOfficialCli: true` را هنگامی که `vault.scope` برابر با `agent` است رد می‌کند، زیرا `obsidian.vaultName` یک تنظیم سراسری است، نه نگاشت به‌ازای هر عامل. رندر Markdown سازگار با Obsidian همچنان در دسترس است.

## راهنمای کاربرد عملی

- وقتی منشأ و هویت صفحه اهمیت دارد، از `wiki search` + `wiki get` استفاده کنید.
- به‌جای ویرایش دستی بخش‌های تولیدی مدیریت‌شده، از `wiki apply` استفاده کنید.
- پیش از اعتماد به محتوای متناقض یا با اطمینان پایین، از `wiki lint` استفاده کنید.
- پس از واردسازی‌های انبوه یا تغییرات منبع، وقتی داشبوردهای تازه و چکیده‌های کامپایل‌شده را فوراً می‌خواهید، از `wiki compile` استفاده کنید.
- وقتی یک کاتالوگ داده، خروجی مستندات یا خط لولهٔ غنی‌سازی عامل از قبل بسته‌های Markdown در قالب OKF تولید می‌کند، از `wiki okf import` استفاده کنید.
- وقتی حالت پل به مصنوعات حافظه‌ای که به‌تازگی صادر شده‌اند وابسته است، از `wiki bridge import` استفاده کنید.

## ارتباط با پیکربندی

رفتار `openclaw wiki` تحت تأثیر موارد زیر است:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

برای مدل کامل پیکربندی، به [Plugin ویکی حافظه](/fa/plugins/memory-wiki) مراجعه کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [ویکی حافظه](/fa/plugins/memory-wiki)
