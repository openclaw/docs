---
read_when:
    - می‌خواهید از CLI memory-wiki استفاده کنید
    - شما در حال مستندسازی یا تغییر `openclaw wiki` هستید
summary: مرجع CLI برای `openclaw wiki` (وضعیت خزانهٔ memory-wiki، جست‌وجو، کامپایل، lint، apply، bridge و کمک‌کننده‌های Obsidian)
title: ویکی
x-i18n:
    generated_at: "2026-04-29T22:40:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

مخزن `memory-wiki` را بررسی و نگهداری کنید.

توسط Plugin همراه `memory-wiki` ارائه می‌شود.

مرتبط:

- [Plugin ویکی حافظه](/fa/plugins/memory-wiki)
- [نمای کلی حافظه](/fa/concepts/memory)
- [CLI: حافظه](/fa/cli/memory)

## کاربرد آن چیست

از `openclaw wiki` زمانی استفاده کنید که یک مخزن دانش کامپایل‌شده با این موارد می‌خواهید:

- جست‌وجوی بومی ویکی و خواندن صفحه‌ها
- ترکیب‌های غنی از منشأ
- گزارش‌های تناقض و تازگی
- واردسازی‌های پل از Plugin حافظه فعال
- ابزارهای کمکی اختیاری CLI برای Obsidian

## فرمان‌های رایج

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
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

حالت فعلی مخزن، سلامت، و در دسترس بودن CLI برای Obsidian را بررسی کنید.

وقتی مطمئن نیستید مخزن راه‌اندازی شده است، حالت پل سالم است، یا یکپارچه‌سازی Obsidian در دسترس است، ابتدا از این استفاده کنید.

وقتی حالت پل فعال و برای خواندن آرتیفکت‌های حافظه پیکربندی شده باشد، این فرمان Gateway در حال اجرا را پرس‌وجو می‌کند تا همان زمینه Plugin حافظه فعال را ببیند که حافظه عامل/زمان اجرا می‌بیند.

### `wiki doctor`

بررسی‌های سلامت ویکی را اجرا کنید و مشکلات پیکربندی یا مخزن را نمایش دهید.

وقتی حالت پل فعال و برای خواندن آرتیفکت‌های حافظه پیکربندی شده باشد، این فرمان پیش از ساخت گزارش، Gateway در حال اجرا را پرس‌وجو می‌کند. واردسازی‌های پل غیرفعال و پیکربندی‌های پلی که آرتیفکت‌های حافظه را نمی‌خوانند محلی/آفلاین باقی می‌مانند.

مشکلات معمول شامل این موارد است:

- حالت پل بدون آرتیفکت‌های حافظه عمومی فعال شده است
- چیدمان مخزن نامعتبر یا مفقود
- نبود CLI خارجی Obsidian وقتی حالت Obsidian انتظار می‌رود

### `wiki init`

چیدمان مخزن ویکی و صفحه‌های شروع را ایجاد کنید.

این کار ساختار ریشه، شامل فهرست‌های سطح بالا و پوشه‌های کش را راه‌اندازی می‌کند.

### `wiki ingest <path-or-url>`

محتوا را به لایه منبع ویکی وارد کنید.

نکته‌ها:

- واردسازی URL با `ingest.allowUrlIngest` کنترل می‌شود
- صفحه‌های منبع واردشده منشأ را در frontmatter نگه می‌دارند
- وقتی فعال باشد، پس از واردسازی می‌توان کامپایل خودکار را اجرا کرد

### `wiki compile`

فهرست‌ها، بلوک‌های مرتبط، داشبوردها، و خلاصه‌های کامپایل‌شده را دوباره بسازید.

این آرتیفکت‌های پایدار و قابل استفاده برای ماشین را در مسیرهای زیر می‌نویسد:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

اگر `render.createDashboards` فعال باشد، کامپایل صفحه‌های گزارش را نیز تازه‌سازی می‌کند.

### `wiki lint`

مخزن را lint کنید و این موارد را گزارش دهید:

- مشکلات ساختاری
- شکاف‌های منشأ
- تناقض‌ها
- پرسش‌های باز
- صفحه‌ها/ادعاهای با اطمینان پایین
- صفحه‌ها/ادعاهای کهنه

این را پس از به‌روزرسانی‌های معنادار ویکی اجرا کنید.

### `wiki search <query>`

در محتوای ویکی جست‌وجو کنید.

رفتار به پیکربندی بستگی دارد:

- `search.backend`: `shared` یا `local`
- `search.corpus`: `wiki`، `memory`، یا `all`
- `--mode`: `auto`، `find-person`، `route-question`، `source-evidence`، یا
  `raw-claim`

وقتی رتبه‌بندی ویژه ویکی یا جزئیات منشأ می‌خواهید، از `wiki search` استفاده کنید.
برای یک گذر بازیابی مشترک گسترده، وقتی Plugin حافظه فعال جست‌وجوی مشترک را ارائه می‌کند، `openclaw memory search` را ترجیح دهید.

حالت‌های جست‌وجو به عامل کمک می‌کنند سطح درست را انتخاب کند:

- `find-person`: نام‌های مستعار، شناسه‌ها، شبکه‌های اجتماعی، شناسه‌های canonical، و صفحه‌های افراد
- `route-question`: راهنماهای پرسیدن از/بهترین کاربرد برای و زمینه رابطه
- `source-evidence`: صفحه‌های منبع و فیلدهای شواهد ساختاریافته
- `raw-claim`: متن ادعای ساختاریافته همراه با فراداده ادعا/شواهد

مثال‌ها:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

خروجی متنی وقتی نتیجه‌ای با یک ادعای ساختاریافته مطابقت داشته باشد، شامل خطوط `Claim:` و `Evidence:` است. خروجی JSON همچنین `matchedClaimId`، `matchedClaimStatus`، `matchedClaimConfidence`، `evidenceKinds`، و `evidenceSourceIds` را برای بررسی عمیق سمت عامل ارائه می‌کند.

### `wiki get <lookup>`

یک صفحه ویکی را بر اساس شناسه یا مسیر نسبی بخوانید.

مثال‌ها:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

جهش‌های محدود را بدون جراحی آزادانه صفحه اعمال کنید.

جریان‌های پشتیبانی‌شده شامل این موارد است:

- ایجاد/به‌روزرسانی یک صفحه ترکیب
- به‌روزرسانی فراداده صفحه
- پیوست کردن شناسه‌های منبع
- افزودن پرسش‌ها
- افزودن تناقض‌ها
- به‌روزرسانی اطمینان/وضعیت
- نوشتن ادعاهای ساختاریافته

این فرمان وجود دارد تا ویکی بتواند بدون ویرایش دستی بلوک‌های مدیریت‌شده، با ایمنی تکامل یابد.

### `wiki bridge import`

آرتیفکت‌های حافظه عمومی را از Plugin حافظه فعال به صفحه‌های منبع پشتیبانی‌شده با پل وارد کنید.

وقتی می‌خواهید آخرین آرتیفکت‌های حافظه صادرشده به مخزن ویکی کشیده شوند، از این در حالت `bridge` استفاده کنید.

برای خواندن‌های فعال آرتیفکت پل، CLI واردسازی را از مسیر RPC مربوط به Gateway عبور می‌دهد تا واردسازی از زمینه Plugin حافظه زمان اجرا استفاده کند. اگر واردسازی‌های پل غیرفعال باشند یا خواندن آرتیفکت‌ها خاموش باشد، فرمان رفتار محلی/آفلاین با واردسازی صفر را حفظ می‌کند.

### `wiki unsafe-local import`

از مسیرهای محلی صریحا پیکربندی‌شده در حالت `unsafe-local` واردسازی کنید.

این عمدا آزمایشی و فقط برای همان ماشین است.

### `wiki obsidian ...`

فرمان‌های کمکی Obsidian برای مخزن‌هایی که در حالت سازگار با Obsidian اجرا می‌شوند.

زیرفرمان‌ها:

- `status`
- `search`
- `open`
- `command`
- `daily`

وقتی `obsidian.useOfficialCli` فعال باشد، این‌ها به CLI رسمی `obsidian` در `PATH` نیاز دارند.

## راهنمای کاربرد عملی

- وقتی منشأ و هویت صفحه مهم است، از `wiki search` + `wiki get` استفاده کنید.
- به جای ویرایش دستی بخش‌های تولیدشده مدیریت‌شده، از `wiki apply` استفاده کنید.
- پیش از اعتماد به محتوای متناقض یا کم‌اطمینان، از `wiki lint` استفاده کنید.
- پس از واردسازی‌های دسته‌ای یا تغییرات منبع، وقتی داشبوردها و خلاصه‌های کامپایل‌شده تازه را فورا می‌خواهید، از `wiki compile` استفاده کنید.
- وقتی حالت پل به آرتیفکت‌های حافظه تازه صادرشده وابسته است، از `wiki bridge import` استفاده کنید.

## پیوندهای پیکربندی

رفتار `openclaw wiki` توسط این موارد شکل می‌گیرد:

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
