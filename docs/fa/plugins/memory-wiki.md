---
read_when:
    - شما دانشی ماندگار فراتر از یادداشت‌های سادهٔ MEMORY.md می‌خواهید
    - شما در حال پیکربندی Plugin همراهِ memory-wiki هستید
    - برای عامل‌ها در یک Gateway به مخزن‌های ویکی جداگانه نیاز دارید
    - می‌خواهید wiki_search، wiki_get یا حالت پل را درک کنید
summary: 'memory-wiki: مخزن دانشِ تدوین‌شده با منشأ، ادعاها، داشبوردها و حالت پل ارتباطی'
title: ویکی حافظه
x-i18n:
    generated_at: "2026-07-12T10:28:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` یک افزونهٔ همراه است که دانش ماندگار را به یک ویکی قابل پیمایش تبدیل می‌کند: صفحه‌های قطعی، ادعاهای ساخت‌یافته همراه با شواهد، منشأ، داشبوردها و خلاصه‌های ماشین‌خوان.

این افزونه جایگزین افزونهٔ حافظهٔ فعال نمی‌شود. بازیابی، ارتقا، نمایه‌سازی و Dreaming همچنان بر عهدهٔ هر پشتیبان حافظه‌ای است که پیکربندی شده باشد (`memory-core`، QMD، Honcho و غیره). `memory-wiki` در کنار آن قرار می‌گیرد و دانش را در قالب یک لایهٔ ویکی نگهداری‌شده تدوین می‌کند.

| لایه                  | مسئولیت                                                                            |
| -------------------- | --------------------------------------------------------------------------------- |
| افزونهٔ حافظهٔ فعال   | بازیابی، جست‌وجوی معنایی، ارتقا، Dreaming، زمان‌اجرای حافظه                       |
| `memory-wiki`        | صفحه‌های تدوین‌شدهٔ ویکی، ترکیب‌های غنی از منشأ، داشبوردها، جست‌وجو/دریافت/اعمال ویکی |

قاعدهٔ عملی:

- `memory_search` برای یک مرحلهٔ بازیابی گسترده در همهٔ پیکره‌های پیکربندی‌شده
- `wiki_search` / `wiki_get` هنگامی که رتبه‌بندی ویژهٔ ویکی، منشأ یا ساختار باور در سطح صفحه را می‌خواهید
- `memory_search corpus=all` برای پوشش هر دو لایه در یک فراخوانی، به‌شرط آنکه افزونهٔ حافظهٔ فعال از انتخاب پیکره پشتیبانی کند

یک راه‌اندازی رایج با اولویت اجرای محلی: QMD به‌عنوان پشتیبان حافظهٔ فعال برای بازیابی و `memory-wiki` در حالت `bridge` برای صفحه‌های ترکیبی ماندگار. نمونهٔ حالت QMD + bridge را در بخش [پیکربندی](#configuration) ببینید.

اگر حالت bridge صفر خروجی صادرشده گزارش می‌کند، افزونهٔ حافظهٔ فعال در حال حاضر ورودی‌های عمومی bridge را ارائه نمی‌دهد. ابتدا `openclaw wiki doctor` را اجرا کنید، سپس تأیید کنید که افزونهٔ حافظهٔ فعال از خروجی‌های عمومی پشتیبانی می‌کند.

## حالت‌های مخزن

- `isolated` (پیش‌فرض): مخزن مستقل، منابع مستقل و بدون وابستگی به افزونهٔ حافظهٔ فعال. برای یک انبارهٔ دانش مستقل و گزینش‌شده از این حالت استفاده کنید.
- `bridge`: خروجی‌های عمومی حافظه و گزارش‌های رویداد را از طریق رابط‌های عمومی SDK افزونه از افزونهٔ حافظهٔ فعال می‌خواند. برای تدوین خروجی‌های صادرشدهٔ افزونهٔ حافظه، بدون دسترسی به بخش‌های داخلی و خصوصی افزونه، از این حالت استفاده کنید.
- `unsafe-local`: راه گریز صریح روی همان دستگاه برای مسیرهای محلی خصوصی. این حالت عمداً آزمایشی و غیرقابل‌حمل است؛ فقط زمانی از آن استفاده کنید که مرز اعتماد را درک می‌کنید و مشخصاً به دسترسی محلی به سامانهٔ فایل نیاز دارید که حالت bridge نمی‌تواند فراهم کند.

حالت مخزن و دامنهٔ مخزن دو انتخاب جداگانه‌اند:

- `vaultMode` تعیین می‌کند ورودی‌های ویکی از کجا تأمین شوند.
- `vault.scope` تعیین می‌کند همهٔ عامل‌ها از یک مخزن استفاده کنند یا هر عامل یک مخزن فرزند داشته باشد.

`vault.scope: "global"` پیش‌فرض است و رفتار موجودِ تک‌مخزنی را حفظ می‌کند. هنگامی که عامل‌ها نباید صفحه‌های ویکی، خلاصه‌های تدوین‌شده، نتایج جست‌وجو یا عملیات نوشتن را با یکدیگر به اشتراک بگذارند، از `vault.scope: "agent"` همراه با حالت `isolated` یا `bridge` استفاده کنید. دامنهٔ عامل را نمی‌توان با حالت `unsafe-local` ترکیب کرد، زیرا مسیرهای خصوصی پیکربندی‌شده ورودی‌های تحت مالکیت عامل نیستند. اعتبارسنجی پیکربندی این ترکیب را رد می‌کند.

حالت bridge می‌تواند بر اساس کلیدهای تغییر وضعیت پیکربندی `bridge.*` موارد زیر را نمایه‌سازی کند:

- خروجی‌های صادرشدهٔ حافظه (`indexMemoryRoot`)
- یادداشت‌های روزانه (`indexDailyNotes`)
- گزارش‌های Dreaming (`indexDreamReports`)
- گزارش‌های رویداد حافظه (`followMemoryEvents`)

هنگامی که حالت bridge فعال است و `bridge.readMemoryArtifacts` فعال شده، دستورهای `openclaw wiki status`، `openclaw wiki doctor` و `openclaw wiki bridge import` از طریق Gateway در حال اجرا مسیریابی می‌شوند تا همان زمینهٔ افزونهٔ حافظهٔ فعال را ببینند که حافظهٔ عامل/زمان‌اجرا می‌بیند. اگر bridge غیرفعال باشد یا خواندن خروجی‌ها خاموش باشد، این دستورها رفتار محلی/آفلاین خود را حفظ می‌کنند.

## چیدمان مخزن

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

محتوای مدیریت‌شده درون بلوک‌های تولیدشده باقی می‌ماند؛ بلوک‌های یادداشت انسانی در بازتولیدها حفظ می‌شوند.

- `sources/`: مواد خام واردشده و صفحه‌های متکی بر bridge/unsafe-local
- `entities/`: موجودیت‌های ماندگار مانند اشیا، افراد، سامانه‌ها، پروژه‌ها و موارد دیگر
- `concepts/`: ایده‌ها، انتزاع‌ها، الگوها و سیاست‌ها (همچنین محل مقصد واردسازی‌های OKF)
- `syntheses/`: خلاصه‌های تدوین‌شده و تجمیع‌های نگهداری‌شده
- `reports/`: داشبوردهای تولیدشده

## واردسازی‌های قالب دانش باز

```bash
openclaw wiki okf import ./bundles/ga4
```

یک بستهٔ استخراج‌شدهٔ قالب دانش باز را به صفحه‌های مفهومی ویکی وارد کنید. این روش زمانی مناسب است که یک کاتالوگ داده، خزندهٔ مستندات یا عامل غنی‌سازی از قبل OKF تولید می‌کند: OKF را به‌عنوان خروجی قابل‌حمل تبادل نگه دارید و اجازه دهید `memory-wiki` آن را به صفحه‌های مفهومی بومی OpenClaw و خلاصه‌های تدوین‌شده تبدیل کند.

- فایل‌های `.md` رزروشده‌نباشند، اسناد مفهومی هستند
- هر مفهوم واردشده به یک فیلد غیرخالی `type` در frontmatter نیاز دارد؛ نبود `type` هشدار `missing-type` ایجاد می‌کند و فایل نادیده گرفته می‌شود
- مقادیر ناشناختهٔ `type` به‌عنوان مفاهیم عمومی پذیرفته می‌شوند
- `index.md` و `log.md` رزروشده‌اند و هرگز به‌عنوان مفهوم وارد نمی‌شوند
- پیوندهای Markdown خراب یا خارجی بدون تغییر باقی می‌مانند

صفحه‌های واردشده زیر `concepts/` به‌صورت تخت قرار می‌گیرند تا جریان‌های موجود تدوین، جست‌وجو، دریافت و داشبورد بدون نیاز به درخت ویکی دوم آن‌ها را ببینند. هر صفحه شناسهٔ اصلی مفهوم OKF، مسیر منبع، `type`، `resource`، `tags`، مُهر زمانی و کل frontmatter تولیدکننده را حفظ می‌کند. پیوندهای داخلی OKF به صفحه‌های مفهومی تولیدشدهٔ ویکی بازنویسی می‌شوند و هم‌زمان ورودی‌های ساخت‌یافتهٔ `relationships` با `kind: okf-link` نیز ایجاد می‌کنند.

## ادعاها و شواهد ساخت‌یافته

صفحه‌ها دارای frontmatter ساخت‌یافتهٔ `claims` هستند، نه صرفاً متن آزاد. هر ادعا می‌تواند شامل `id`، `text`، `status`، `confidence`، `evidence[]` و `updatedAt` باشد. هر ورودی شواهد می‌تواند شامل `kind`، `sourceId`، `path`، `lines`، `weight`، `confidence`، `privacyTier`، `note` و `updatedAt` باشد.

این ویژگی باعث می‌شود ویکی مانند یک لایهٔ باور عمل کند، نه انباشتگاهی منفعل از یادداشت‌ها. ادعاها را می‌توان ردیابی، امتیازدهی، به چالش کشید و با رجوع به منابع حل‌وفصل کرد.

## فرادادهٔ موجودیت برای عامل‌ها

صفحه‌های موجودیت دارای فرادادهٔ مسیریابی عمومی هستند که برای افراد، تیم‌ها، سامانه‌ها، پروژه‌ها یا هر نوع موجودیت دیگری قابل استفاده است:

- `entityType`: برای نمونه `person`، `team`، `system`، `project`
- `canonicalId`: کلید هویت پایدار در میان نام‌های مستعار و واردسازی‌ها
- `aliases`: نام‌ها، شناسه‌ها یا برچسب‌هایی که به همان صفحه ارجاع می‌دهند
- `privacyTier`: رشته‌ای با قالب آزاد؛ `public` بدون نیاز به بازبینی در نظر گرفته می‌شود و هر مقدار دیگری (برای نمونه `local-private`، `sensitive`، `confirm-before-use`) در `reports/privacy-review.md` علامت‌گذاری می‌شود
- `bestUsedFor` / `notEnoughFor`: راهنمای فشردهٔ مسیریابی
- `lastRefreshedAt`: مُهر زمانی تازه‌سازی منبع، جدا از زمان ویرایش صفحه
- `personCard`: کارت مسیریابی اختیاری و ویژهٔ افراد (شناسه‌ها، شبکه‌های اجتماعی، ایمیل‌ها، منطقهٔ زمانی، حوزه، موارد مناسب برای پرسش، موارد نامناسب برای پرسش، میزان اطمینان، سطح حریم خصوصی)
- `relationships`: یال‌های نوع‌دار به صفحه‌های مرتبط (هدف، نوع، وزن، میزان اطمینان، نوع شواهد، سطح حریم خصوصی، یادداشت)

برای ویکی افراد، از `reports/person-agent-directory.md` شروع کنید، سپس پیش از استفاده از جزئیات تماس یا واقعیت‌های استنباط‌شده، صفحهٔ شخص را با `wiki_get` باز کنید.

<Accordion title="Entity page example">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Example ecosystem routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Example ecosystem
  askFor:
    - Example rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Other Person
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex is useful for example-ecosystem routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## خط لولهٔ تدوین

تدوین، صفحه‌های ویکی را می‌خواند، خلاصه‌ها را نرمال‌سازی می‌کند و خروجی‌های پایدار ماشین‌محور را در مسیرهای زیر ایجاد می‌کند:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

عامل‌ها و کد زمان‌اجرا به‌جای استخراج اطلاعات از Markdown، این خلاصه‌ها را می‌خوانند. خروجی تدوین‌شده همچنین نمایه‌سازی مرحلهٔ نخست ویکی را برای جست‌وجو/دریافت، یافتن صفحهٔ مالک بر اساس شناسهٔ ادعا، مکمل‌های فشردهٔ اعلان و تولید گزارش فراهم می‌کند.

## داشبوردها و گزارش‌های سلامت

هنگامی که `render.createDashboards` فعال است، فرایند تدوین داشبوردهای زیر را در `reports/` نگهداری می‌کند:

| گزارش                               | موارد ردیابی‌شده                                  |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | صفحه‌های دارای پرسش‌های حل‌نشده                    |
| `reports/contradictions.md`         | خوشه‌های یادداشت‌های متناقض                        |
| `reports/low-confidence.md`         | صفحه‌ها و ادعاهای دارای اطمینان پایین              |
| `reports/claim-health.md`           | ادعاهای فاقد شواهد ساخت‌یافته                      |
| `reports/stale-pages.md`            | تازگی منقضی یا نامشخص                              |
| `reports/person-agent-directory.md` | کارت‌های مسیریابی شخص/موجودیت                      |
| `reports/relationship-graph.md`     | یال‌های رابطهٔ ساخت‌یافته                          |
| `reports/provenance-coverage.md`    | پوشش رده‌های شواهد                                 |
| `reports/privacy-review.md`         | سطوح حریم خصوصی غیرعمومی که پیش از استفاده نیازمند بازبینی‌اند |

## جست‌وجو و بازیابی

دو پشتیبان جست‌وجو:

- `shared`: در صورت دردسترس‌بودن، استفاده از جریان جست‌وجوی حافظهٔ مشترک
- `local`: جست‌وجوی محلی در ویکی

سه پیکره: `wiki`، `memory`، `all`.

- `wiki_search` / `wiki_get` در صورت امکان از خلاصه‌های تدوین‌شده به‌عنوان مرحلهٔ نخست استفاده می‌کنند
- شناسه‌های ادعا به صفحهٔ مالک بازگردانده می‌شوند
- ادعاهای مورد اختلاف/منقضی/تازه بر رتبه‌بندی اثر می‌گذارند
- برچسب‌های منشأ در نتایج حفظ می‌شوند

حالت‌های جست‌وجو (پارامتر `--mode` / پارامتر ابزار `mode`):

| حالت             | موارد تقویت‌شده                                               |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | پیش‌فرض متعادل                                                 |
| `find-person`     | موجودیت‌های شخص‌مانند، نام‌های مستعار، شناسه‌ها، شبکه‌های اجتماعی، شناسه‌های متعارف |
| `route-question`  | کارت‌های عامل، راهنمای موارد مناسب برای پرسش/بهترین کاربرد و زمینهٔ روابط |
| `source-evidence` | صفحه‌های منبع و فرادادهٔ شواهد ساخت‌یافته                     |
| `raw-claim`       | ادعاهای ساخت‌یافتهٔ منطبق؛ فرادادهٔ ادعا/شواهد را برمی‌گرداند |

هنگامی که یک نتیجه با ادعایی ساخت‌یافته مطابقت دارد، `wiki_search` مقادیر `matchedClaimId`، `matchedClaimStatus`، `matchedClaimConfidence`، `evidenceKinds` و `evidenceSourceIds` را در بار جزئیات خود برمی‌گرداند. خروجی متنی در صورت دردسترس‌بودن، شامل خط‌های فشردهٔ `Claim:` و `Evidence:` است.

## ابزارهای عامل

| ابزار         | هدف                                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | حالت و دامنهٔ کنونی مخزن، عاملِ شناسایی‌شده، سلامت و در دسترس بودن CLI مربوط به Obsidian                                                                                      |
| `wiki_search` | جست‌وجوی صفحات ویکی و، در صورت پیکربندی، پیکرهٔ حافظهٔ مشترک؛ برای یافتن اشخاص، مسیریابی پرسش‌ها، شواهد منبع یا بررسی عمیق ادعاهای خام، `mode` را می‌پذیرد                    |
| `wiki_get`    | خواندن یک صفحهٔ ویکی با شناسه/مسیر؛ اگر جست‌وجوی مشترک فعال باشد و مورد پیدا نشود، به پیکرهٔ حافظهٔ مشترک رجوع می‌کند                                                        |
| `wiki_apply`  | اعمال تغییرات محدود در ترکیب محتوا/فراداده، بدون دست‌کاری آزادانهٔ صفحه                                                                                                      |
| `wiki_lint`   | بررسی‌های ساختاری، شکاف‌های منشأ، تناقض‌ها و پرسش‌های باز                                                                                                                     |

این Plugin همچنین یک مکمل غیرانحصاری برای پیکرهٔ حافظه ثبت می‌کند؛ بنابراین،
اگر Plugin فعال حافظه از انتخاب پیکره پشتیبانی کند، `memory_search` و
`memory_get` مشترک نیز می‌توانند به ویکی دسترسی داشته باشند.

## رفتار اعلان و زمینه

وقتی `context.includeCompiledDigestPrompt` فعال باشد، بخش‌های اعلان حافظه
یک تصویر لحظه‌ای فشرده و کامپایل‌شده از `agent-digest.json` را اضافه می‌کنند:
فقط صفحات برتر، فقط ادعاهای برتر، تعداد تناقض‌ها، تعداد پرسش‌ها و
توصیف‌گرهای اطمینان/تازگی. این قابلیت اختیاری است، زیرا شکل اعلان را تغییر
می‌دهد؛ اهمیت اصلی آن برای موتورهای زمینه یا سازوکارهای ساخت اعلان است که
مکمل‌های حافظه را به‌طور صریح مصرف می‌کنند.

## پیکربندی

پیکربندی را زیر `plugins.entries.memory-wiki.config` قرار دهید:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            scope: "global",
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

گزینه‌های کلیدی:

| کلید                                       | مقادیر / پیش‌فرض                                | توضیحات                                                                                     |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (پیش‌فرض)، `bridge`، `unsafe-local` | رفتار ورودی و یکپارچه‌سازی را انتخاب می‌کند                                                 |
| `vault.scope`                              | `global` (پیش‌فرض)، `agent`                    | یک مخزن مشترک یا یک مخزن فرزند برای هر عامل                                                  |
| `vault.path`                               | پیش‌فرض سراسری `~/.openclaw/wiki/main`         | مسیر دقیق مخزن در دامنهٔ سراسری؛ مسیر والد در دامنهٔ عامل به‌طور پیش‌فرض `~/.openclaw/wiki` است |
| `vault.renderMode`                         | `native` (پیش‌فرض)، `obsidian`                 |                                                                                             |
| `bridge.readMemoryArtifacts`               | پیش‌فرض `true`                                 | مصنوعات عمومی Plugin فعال حافظه را وارد می‌کند                                              |
| `bridge.followMemoryEvents`                | پیش‌فرض `true`                                 | گزارش‌های رویداد را در حالت پل شامل می‌کند                                                  |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | پیش‌فرض `false`                                | برای اجرای واردسازی‌های `unsafe-local` الزامی است                                           |
| `unsafeLocal.paths`                        | پیش‌فرض `[]`                                   | مسیرهای محلی صریح برای واردسازی در حالت `unsafe-local`                                      |
| `search.backend`                           | `shared` (پیش‌فرض)، `local`                    |                                                                                             |
| `search.corpus`                            | `wiki` (پیش‌فرض)، `memory`، `all`              |                                                                                             |
| `context.includeCompiledDigestPrompt`      | پیش‌فرض `false`                                | تصویر لحظه‌ای فشردهٔ چکیدهٔ عامل انتخاب‌شده را به بخش‌های اعلان حافظه اضافه می‌کند          |
| `render.createBacklinks`                   | پیش‌فرض `true`                                 | بلوک‌های مرتبطِ قطعی تولید می‌کند                                                            |
| `render.createDashboards`                  | پیش‌فرض `true`                                 | صفحات داشبورد تولید می‌کند                                                                  |

### مخزن‌های مختص هر عامل

برای اختصاص یک ویکی جداگانه به هر عامل پیکربندی‌شده، `vault.scope` را روی
`agent` تنظیم کنید. در این دامنه، `vault.path` یک پوشهٔ والد است و OpenClaw
شناسهٔ نرمال‌شدهٔ عامل را به آن اضافه می‌کند:

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

مسیرهای حاصل `~/.openclaw/wiki/support` و
`~/.openclaw/wiki/marketing` هستند. اگر `vault.path` در دامنهٔ عامل حذف شود،
مسیر والد به‌طور پیش‌فرض `~/.openclaw/wiki` خواهد بود. بنابراین عامل پیش‌فرض
`main` مسیر موجود `~/.openclaw/wiki/main` را حفظ می‌کند.

ابزارهای عامل، چکیده‌های اعلان کامپایل‌شده و مکمل ویکی که از طریق
`memory_search` / `memory_get` ارائه می‌شود، مخزن را از زمینهٔ عامل فعال
شناسایی می‌کنند. برای فراخوانی‌های CLI و Gateway در تنظیمی با چند عامل
پیکربندی‌شده، عامل را به‌طور صریح با `openclaw wiki --agent <agentId> ...`
یا `agentId` درخواست Gateway مشخص کنید. اگر فقط یک عامل پیکربندی شده باشد،
در صورت ارائه نشدن شناسه همان عامل پیش‌فرض باقی می‌ماند.

در حالت پل، واردسازی‌های مختص عامل تنها زمانی یک مصنوع عمومی حافظه را
می‌پذیرند که `agentIds` آن شامل عامل انتخاب‌شده باشد. مصنوعات متعلق به عاملی
دیگر، مصنوعات فاقد فرادادهٔ مالکیت یا مصنوعات دارای مالک ناشناخته نادیده
گرفته می‌شوند. دامنهٔ سراسری رفتار موجود مصنوعات مشترک را حفظ می‌کند.

<Warning>
تغییر `vault.scope` یک مخزن موجود را کپی یا تفکیک نمی‌کند. در دامنهٔ عامل،
یک `vault.path` که به‌طور صریح پیکربندی شده باشد به پوشهٔ والد تبدیل می‌شود؛
بنابراین پیش از تغییر عامل‌های محیط عملیاتی، صفحات موجود را آگاهانه جابه‌جا
یا وارد کنید. ابتدا از مخزن نسخهٔ پشتیبان تهیه کنید.

مخزن‌های مختص عامل یک مرز دانشی درون همان فرایند هستند، نه یک مرز امنیتی
سیستم‌عامل. Pluginها و ابزارهای بدون محیط ایزوله که به سامانهٔ فایل میزبان
دسترسی دارند، همچنان می‌توانند پوشهٔ عامل دیگری را بخوانند. وقتی عامل‌ها به
یکدیگر اعتماد ندارند، از [محیط ایزوله](/fa/gateway/sandboxing) یا
[پروفایل‌های جداگانهٔ Gateway](/fa/gateway/multiple-gateways) استفاده کنید.
</Warning>

### نمونه: QMD و حالت پل

زمانی از این تنظیم استفاده کنید که QMD را برای بازیابی و `memory-wiki` را
برای یک لایهٔ دانشی نگه‌داری‌شده می‌خواهید. تمرکز هر لایه حفظ می‌شود: QMD
یادداشت‌های خام، خروجی‌های نشست و مجموعه‌های اضافی را قابل جست‌وجو نگه
می‌دارد، در حالی که `memory-wiki` موجودیت‌های پایدار، ادعاها، داشبوردها و
صفحات منبع را کامپایل می‌کند.

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

با این تنظیم، QMD مسئول بازیابی حافظهٔ فعال باقی می‌ماند، `memory-wiki` بر
صفحات کامپایل‌شده و داشبوردها تمرکز می‌کند و شکل اعلان تا زمانی که آگاهانه
اعلان‌های چکیدهٔ کامپایل‌شده را فعال نکنید، بدون تغییر می‌ماند.

## CLI

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

برای مرجع کامل فرمان‌ها، از جمله `wiki okf import`، `wiki apply metadata`،
`wiki unsafe-local import`، `wiki chatgpt import` / `wiki chatgpt rollback` و
مجموعهٔ کامل زیرفرمان‌های `wiki obsidian`، به [CLI: ویکی](/fa/cli/wiki) مراجعه
کنید.

## پشتیبانی از Obsidian

وقتی `vault.renderMode` برابر با `obsidian` باشد، Plugin فایل Markdown سازگار
با Obsidian می‌نویسد و می‌تواند به‌صورت اختیاری از CLI رسمی `obsidian` برای
بررسی وضعیت، جست‌وجوی مخزن، باز کردن صفحه، فراخوانی فرمان و رفتن به یادداشت
روزانه استفاده کند. این قابلیت اختیاری است؛ ویکی بدون Obsidian نیز در حالت
بومی کار می‌کند.

مخزن‌های مختص عامل همچنان می‌توانند از Markdown سازگار با Obsidian استفاده
کنند، اما اعتبارسنجی پیکربندی ترکیب `obsidian.useOfficialCli: true` با
`vault.scope: "agent"` را رد می‌کند. تنظیم کنونی `obsidian.vaultName` سراسری
است و نمی‌تواند برای هر عامل یک مخزن متمایز Obsidian انتخاب کند. به‌جای آن
از ابزارهای ویکی و عملیات CLI استفاده کنید، یا ویکیِ تحت مدیریت Obsidian را
در دامنهٔ سراسری نگه دارید.

## گردش کار پیشنهادی

<Steps>
<Step title="Plugin حافظهٔ فعال را برای بازیابی حفظ کنید">
مالکیت بازیابی، ارتقا و Dreaming در اختیار بخش پشتیبان حافظهٔ پیکربندی‌شده باقی می‌ماند.
</Step>
<Step title="memory-wiki را فعال کنید">
مگر اینکه به‌طور صریح حالت پل را بخواهید، با حالت `isolated` شروع کنید.
</Step>
<Step title="وقتی منشأ اهمیت دارد، از wiki_search / wiki_get استفاده کنید">
هنگامی که رتبه‌بندی مختص ویکی یا ساختار باور در سطح صفحه را می‌خواهید، این ابزارها را به `memory_search` ترجیح دهید.
</Step>
<Step title="برای ترکیب‌های محدود یا به‌روزرسانی فراداده از wiki_apply استفاده کنید">
از ویرایش دستی بلوک‌های تولیدشده و مدیریت‌شده خودداری کنید.
</Step>
<Step title="پس از تغییرات معنادار، wiki_lint را اجرا کنید">
تناقض‌ها، پرسش‌های باز و شکاف‌های منشأ را شناسایی می‌کند.
</Step>
<Step title="برای مشاهدهٔ موارد قدیمی/متناقض، داشبوردها را فعال کنید">
`render.createDashboards: true` را تنظیم کنید (پیش‌فرض).
</Step>
</Steps>

## مستندات مرتبط

- [نمای کلی حافظه](/fa/concepts/memory)
- [CLI: حافظه](/fa/cli/memory)
- [CLI: ویکی](/fa/cli/wiki)
- [نمای کلی SDK مربوط به Plugin](/fa/plugins/sdk-overview)
