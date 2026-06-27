---
read_when:
    - می‌خواهید از CLI مربوط به memory-wiki استفاده کنید
    - شما در حال مستندسازی یا تغییر `openclaw wiki` هستید
summary: مرجع CLI برای `openclaw wiki` (وضعیت خزانهٔ memory-wiki، جست‌وجو، کامپایل، lint، اعمال، پل، و ابزارهای کمکی Obsidian)
title: ویکی
x-i18n:
    generated_at: "2026-06-27T17:29:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

مخزن `memory-wiki` را بررسی و نگهداری کنید.

ارائه‌شده توسط Plugin همراه `memory-wiki`.

مرتبط:

- [Plugin ویکی حافظه](/fa/plugins/memory-wiki)
- [نمای کلی حافظه](/fa/concepts/memory)
- [CLI: حافظه](/fa/cli/memory)

## کاربرد آن

از `openclaw wiki` زمانی استفاده کنید که یک مخزن دانش کامپایل‌شده با این قابلیت‌ها می‌خواهید:

- جست‌وجوی بومی ویکی و خواندن صفحه‌ها
- ترکیب‌های غنی از خاستگاه
- گزارش‌های تناقض و تازگی
- واردسازی پل از Plugin حافظه فعال
- ابزارهای کمکی اختیاری Obsidian CLI

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

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## فرمان‌ها

### `wiki status`

حالت فعلی مخزن، سلامت، و در دسترس بودن Obsidian CLI را بررسی کنید.

وقتی مطمئن نیستید مخزن راه‌اندازی شده است یا نه، حالت پل سالم است یا نه،
یا ادغام Obsidian در دسترس است یا نه، ابتدا از این استفاده کنید.

وقتی حالت پل فعال است و برای خواندن آرتیفکت‌های حافظه پیکربندی شده است، این فرمان
از Gateway در حال اجرا پرس‌وجو می‌کند تا همان بافت Plugin حافظه فعال را ببیند که
حافظه agent/runtime می‌بیند.

### `wiki doctor`

بررسی‌های سلامت ویکی را اجرا کنید و مشکلات پیکربندی یا مخزن را نشان دهید.

وقتی حالت پل فعال است و برای خواندن آرتیفکت‌های حافظه پیکربندی شده است، این فرمان
پیش از ساخت گزارش از Gateway در حال اجرا پرس‌وجو می‌کند. واردسازی‌های پل غیرفعال
و پیکربندی‌های پلی که آرتیفکت‌های حافظه را نمی‌خوانند، محلی/آفلاین می‌مانند.

مشکلات معمول شامل این‌ها هستند:

- حالت پل بدون آرتیفکت‌های عمومی حافظه فعال شده است
- چیدمان مخزن نامعتبر یا مفقود است
- وقتی حالت Obsidian مورد انتظار است، Obsidian CLI خارجی وجود ندارد

### `wiki init`

چیدمان مخزن ویکی و صفحه‌های آغازین را ایجاد کنید.

این کار ساختار ریشه، از جمله نمایه‌های سطح بالا و دایرکتوری‌های کش را مقداردهی اولیه می‌کند.

### `wiki ingest <path-or-url>`

محتوا را به لایه منبع ویکی وارد کنید.

نکته‌ها:

- واردسازی URL با `ingest.allowUrlIngest` کنترل می‌شود
- صفحه‌های منبع واردشده، خاستگاه را در فرانت‌متر نگه می‌دارند
- وقتی فعال باشد، کامپایل خودکار می‌تواند پس از واردسازی اجرا شود

### `wiki okf import <path>`

یک بسته بازشده Open Knowledge Format را به صفحه‌های مفهومی ویکی وارد کنید.

واردکننده هر سند مفهومی `.md` غیررزرو‌شده را در درخت دایرکتوری OKF می‌خواند،
وجود یک فیلد غیرخالی `type` را الزامی می‌کند، و مقدارهای ناشناخته OKF
برای `type` را به‌عنوان مفهوم‌های عمومی در نظر می‌گیرد. فایل‌های رزروشده OKF یعنی
`index.md` و `log.md` به‌عنوان مفهوم وارد نمی‌شوند.

صفحه‌های واردشده زیر `concepts/` تخت می‌شوند تا جریان‌های موجود کامپایل،
جست‌وجو، دریافت، گزیده و داشبورد ویکی فوراً آن‌ها را ببینند. شناسه مفهومی اصلی OKF،
`type`، `resource`، `tags`، زمان‌مهر، مسیر منبع، و فرانت‌متر کامل
در فرانت‌متر صفحه حفظ می‌شوند. لینک‌های مارک‌داون داخلی OKF
به صفحه‌های ویکی تولیدشده بازنویسی می‌شوند؛ لینک‌های شکسته یا خارجی
بدون تغییر باقی می‌مانند.

نمونه‌ها:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

نمایه‌ها، بلوک‌های مرتبط، داشبوردها، و گزیده‌های کامپایل‌شده را بازسازی کنید.

این کار آرتیفکت‌های پایدارِ ماشین‌محور را در این مسیرها می‌نویسد:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

اگر `render.createDashboards` فعال باشد، کامپایل صفحه‌های گزارش را نیز تازه‌سازی می‌کند.

### `wiki lint`

مخزن را lint کنید و این موارد را گزارش دهید:

- مشکلات ساختاری
- شکاف‌های خاستگاه
- تناقض‌ها
- پرسش‌های باز
- صفحه‌ها/ادعاهای کم‌اطمینان
- صفحه‌ها/ادعاهای کهنه

این را پس از به‌روزرسانی‌های معنادار ویکی اجرا کنید.

### `wiki search <query>`

محتوای ویکی را جست‌وجو کنید.

رفتار به پیکربندی بستگی دارد:

- `search.backend`: `shared` یا `local`
- `search.corpus`: `wiki`، `memory`، یا `all`
- `--mode`: `auto`، `find-person`، `route-question`، `source-evidence`، یا
  `raw-claim`

وقتی رتبه‌بندی یا جزئیات خاستگاه ویژه ویکی می‌خواهید، از `wiki search` استفاده کنید.
برای یک گذر بازیابی مشترکِ گسترده، وقتی Plugin حافظه فعال جست‌وجوی مشترک را ارائه می‌کند،
`openclaw memory search` را ترجیح دهید.

حالت‌های جست‌وجو به عامل کمک می‌کنند سطح درست را انتخاب کند:

- `find-person`: نام‌های مستعار، هندل‌ها، شبکه‌های اجتماعی، شناسه‌های کانونی، و صفحه‌های شخص
- `route-question`: راهنمایی‌های ask-for/best-used-for و بافت رابطه
- `source-evidence`: صفحه‌های منبع و فیلدهای شواهد ساختاریافته
- `raw-claim`: متن ادعای ساختاریافته همراه با فراداده ادعا/شواهد

نمونه‌ها:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

وقتی یک نتیجه با یک ادعای ساختاریافته منطبق شود، خروجی متنی شامل خطوط `Claim:` و `Evidence:` است. خروجی JSON همچنین
`matchedClaimId`، `matchedClaimStatus`، `matchedClaimConfidence`، `evidenceKinds`، و
`evidenceSourceIds` را برای واکاوی سمت عامل نمایان می‌کند.

### `wiki get <lookup>`

یک صفحه ویکی را با شناسه یا مسیر نسبی بخوانید.

نمونه‌ها:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

جهش‌های محدود را بدون جراحی آزادانه صفحه اعمال کنید.

جریان‌های پشتیبانی‌شده شامل این‌ها هستند:

- ایجاد/به‌روزرسانی یک صفحه ترکیب
- به‌روزرسانی فراداده صفحه
- پیوست کردن شناسه‌های منبع
- افزودن پرسش‌ها
- افزودن تناقض‌ها
- به‌روزرسانی اطمینان/وضعیت
- نوشتن ادعاهای ساختاریافته

این فرمان وجود دارد تا ویکی بتواند بدون ویرایش دستی بلوک‌های مدیریت‌شده، به‌طور ایمن تکامل پیدا کند.

### `wiki bridge import`

آرتیفکت‌های عمومی حافظه را از Plugin حافظه فعال به صفحه‌های منبعِ پشتیبانی‌شده با پل وارد کنید.

وقتی در حالت `bridge` هستید و می‌خواهید تازه‌ترین آرتیفکت‌های حافظه صادرشده
به مخزن ویکی کشیده شوند، از این استفاده کنید.

برای خواندن‌های فعال آرتیفکت پل، CLI واردسازی را از طریق Gateway RPC مسیریابی می‌کند
تا واردسازی از بافت Plugin حافظه زمان اجرا استفاده کند. اگر واردسازی‌های پل
غیرفعال باشند یا خواندن آرتیفکت‌ها خاموش شده باشد، فرمان رفتار محلی/آفلاین
با واردسازی صفر را نگه می‌دارد.

### `wiki unsafe-local import`

از مسیرهای محلی که صریحاً در حالت `unsafe-local` پیکربندی شده‌اند واردسازی کنید.

این قابلیت عمداً آزمایشی و فقط برای همان ماشین است.

### `wiki obsidian ...`

فرمان‌های کمکی Obsidian برای مخزن‌هایی که در حالت سازگار با Obsidian اجرا می‌شوند.

زیر‌فرمان‌ها:

- `status`
- `search`
- `open`
- `command`
- `daily`

وقتی `obsidian.useOfficialCli` فعال است، این‌ها به CLI رسمی `obsidian` روی `PATH` نیاز دارند.

## راهنمای کاربردی استفاده

- وقتی خاستگاه و هویت صفحه اهمیت دارد، از `wiki search` + `wiki get` استفاده کنید.
- به‌جای ویرایش دستی بخش‌های تولیدشده مدیریت‌شده، از `wiki apply` استفاده کنید.
- پیش از اعتماد به محتوای متناقض یا کم‌اطمینان، از `wiki lint` استفاده کنید.
- پس از واردسازی‌های انبوه یا تغییرات منبع، وقتی داشبوردها و گزیده‌های کامپایل‌شده تازه را فوراً می‌خواهید،
  از `wiki compile` استفاده کنید.
- وقتی یک کاتالوگ داده، خروجی مستندات، یا خط لوله غنی‌سازی عامل
  از قبل بسته‌های مارک‌داون OKF تولید می‌کند، از `wiki okf import` استفاده کنید.
- وقتی حالت پل به آرتیفکت‌های حافظه تازه صادرشده وابسته است،
  از `wiki bridge import` استفاده کنید.

## ارتباط‌های پیکربندی

رفتار `openclaw wiki` با این موارد شکل می‌گیرد:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

برای مدل کامل پیکربندی، [Plugin ویکی حافظه](/fa/plugins/memory-wiki) را ببینید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [ویکی حافظه](/fa/plugins/memory-wiki)
