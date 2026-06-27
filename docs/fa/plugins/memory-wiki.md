---
read_when:
    - شما به دانشی پایدار فراتر از یادداشت‌های ساده‌ی MEMORY.md نیاز دارید
    - شما در حال پیکربندی Plugin همراه memory-wiki هستید
    - می‌خواهید wiki_search، wiki_get یا حالت پل را درک کنید
summary: 'memory-wiki: مخزن دانش گردآوری‌شده با منشأ، ادعاها، داشبوردها و حالت پل'
title: ویکی حافظه
x-i18n:
    generated_at: "2026-06-27T18:19:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` یک Plugin همراه است که حافظه پایدار را به یک
مخزن دانش کامپایل‌شده تبدیل می‌کند.

این Plugin جایگزین Plugin حافظه فعال **نمی‌شود**. Plugin حافظه فعال همچنان
مالک یادآوری، ارتقا، نمایه‌سازی، و Dreaming است. `memory-wiki` کنار آن قرار می‌گیرد
و دانش پایدار را به یک ویکی قابل پیمایش با صفحه‌های قطعی،
ادعاهای ساخت‌یافته، منشأ، داشبوردها، و چکیده‌های قابل خواندن توسط ماشین کامپایل می‌کند.

از آن زمانی استفاده کنید که می‌خواهید حافظه بیشتر شبیه یک لایه دانش نگه‌داری‌شده رفتار کند و
کمتر شبیه توده‌ای از فایل‌های Markdown باشد.

## آنچه اضافه می‌کند

- یک مخزن ویکی اختصاصی با چیدمان صفحه قطعی
- فراداده ساخت‌یافته ادعا و شواهد، نه فقط نثر
- منشأ، اطمینان، تناقض‌ها، و پرسش‌های باز در سطح صفحه
- چکیده‌های کامپایل‌شده برای مصرف‌کنندگان عامل/زمان اجرا
- ابزارهای جستجو/دریافت/اعمال/بررسی بومی ویکی
- درون‌ریزی‌های Open Knowledge Format به مفاهیم ویکی کامپایل‌شده
- حالت پل اختیاری که مصنوعات عمومی را از Plugin حافظه فعال درون‌ریزی می‌کند
- حالت رندر سازگار با Obsidian و یکپارچه‌سازی CLI اختیاری

## نحوه جای‌گیری آن در کنار حافظه

این جداسازی را این‌گونه در نظر بگیرید:

| لایه                                                    | مالک                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin حافظه فعال (`memory-core`، QMD، Honcho، و غیره) | یادآوری، جستجوی معنایی، ارتقا، Dreaming، زمان اجرای حافظه                                  |
| `memory-wiki`                                           | صفحه‌های ویکی کامپایل‌شده، ترکیب‌های سرشار از منشأ، داشبوردها، جستجو/دریافت/اعمال اختصاصی ویکی |

اگر Plugin حافظه فعال مصنوعات یادآوری مشترک را ارائه کند، OpenClaw می‌تواند
هر دو لایه را در یک گذر با `memory_search corpus=all` جستجو کند.

وقتی به رتبه‌بندی اختصاصی ویکی، منشأ، یا دسترسی مستقیم به صفحه نیاز دارید، به‌جای آن از
ابزارهای بومی ویکی استفاده کنید.

## الگوی ترکیبی پیشنهادی

یک پیش‌فرض قوی برای راه‌اندازی‌های محلی‌اول این است:

- QMD به‌عنوان پشتوانه حافظه فعال برای یادآوری و جستجوی معنایی گسترده
- `memory-wiki` در حالت `bridge` برای صفحه‌های دانش ترکیب‌شده و پایدار

این جداسازی خوب کار می‌کند، چون هر لایه متمرکز می‌ماند:

- QMD یادداشت‌های خام، خروجی‌های نشست، و مجموعه‌های اضافی را قابل جستجو نگه می‌دارد
- `memory-wiki` موجودیت‌های پایدار، ادعاها، داشبوردها، و صفحه‌های منبع را کامپایل می‌کند

قاعده عملی:

- وقتی یک گذر یادآوری گسترده روی حافظه می‌خواهید، از `memory_search` استفاده کنید
- وقتی نتایج ویکی آگاه از منشأ می‌خواهید، از `wiki_search` و `wiki_get` استفاده کنید
- وقتی می‌خواهید جستجوی مشترک هر دو لایه را پوشش دهد، از `memory_search corpus=all` استفاده کنید

اگر حالت پل صفر مصنوع صادرشده گزارش کند، Plugin حافظه فعال در حال حاضر
ورودی‌های عمومی پل را ارائه نمی‌کند. ابتدا `openclaw wiki doctor` را اجرا کنید،
سپس تأیید کنید که Plugin حافظه فعال از مصنوعات عمومی پشتیبانی می‌کند.

وقتی حالت پل فعال است و `bridge.readMemoryArtifacts` فعال شده،
`openclaw wiki status`، `openclaw wiki doctor`، و `openclaw wiki bridge
import` از طریق Gateway در حال اجرا می‌خوانند. این کار بررسی‌های پل CLI را
با زمینه Plugin حافظه زمان اجرا هم‌راستا نگه می‌دارد. اگر پل غیرفعال باشد یا خواندن مصنوعات
خاموش شده باشد، آن دستورها رفتار محلی/آفلاین خود را حفظ می‌کنند.

## حالت‌های مخزن

`memory-wiki` از سه حالت مخزن پشتیبانی می‌کند:

### `isolated`

مخزن خودش، منابع خودش، بدون وابستگی به `memory-core`.

وقتی می‌خواهید ویکی ذخیره دانش گزینش‌شده خودش باشد، از این استفاده کنید.

### `bridge`

مصنوعات عمومی حافظه و رویدادهای حافظه را از Plugin حافظه فعال
از طریق مرزهای عمومی SDK Plugin می‌خواند.

وقتی می‌خواهید ویکی مصنوعات صادرشده Plugin حافظه را بدون ورود به درون‌سازهای خصوصی Plugin
کامپایل و سازمان‌دهی کند، از این استفاده کنید.

حالت پل می‌تواند این موارد را نمایه کند:

- مصنوعات حافظه صادرشده
- گزارش‌های رویا
- یادداشت‌های روزانه
- فایل‌های ریشه حافظه
- لاگ‌های رویداد حافظه

### `unsafe-local`

راه فرار صریح همان‌ماشین برای مسیرهای خصوصی محلی.

این حالت عمداً آزمایشی و غیرقابل‌حمل است. فقط زمانی از آن استفاده کنید که
مرز اعتماد را می‌فهمید و مشخصاً به دسترسی فایل‌سیستم محلی نیاز دارید که
حالت پل نمی‌تواند فراهم کند.

## چیدمان مخزن

Plugin یک مخزن را این‌گونه مقداردهی اولیه می‌کند:

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

محتوای مدیریت‌شده داخل بلوک‌های تولیدشده می‌ماند. بلوک‌های یادداشت انسانی حفظ می‌شوند.

گروه‌های اصلی صفحه عبارت‌اند از:

- `sources/` برای مواد خام درون‌ریزی‌شده و صفحه‌های پشتیبانی‌شده با پل
- `entities/` برای چیزها، افراد، سامانه‌ها، پروژه‌ها، و اشیای پایدار
- `concepts/` برای ایده‌ها، انتزاع‌ها، الگوها، و سیاست‌ها
- `syntheses/` برای خلاصه‌های کامپایل‌شده و گردآوری‌های نگه‌داری‌شده
- `reports/` برای داشبوردهای تولیدشده

## درون‌ریزی‌های Open Knowledge Format

`memory-wiki` می‌تواند بسته‌های بازشده Open Knowledge Format را با این دستور درون‌ریزی کند:

```bash
openclaw wiki okf import ./bundles/ga4
```

این تمیزترین تناسب را زمانی دارد که یک کاتالوگ داده، خزنده مستندات، یا
عامل غنی‌سازی از قبل OKF تولید می‌کند: OKF را به‌عنوان مصنوع تبادل قابل‌حمل
نگه دارید، سپس بگذارید `memory-wiki` آن را به صفحه‌های مفهومی بومی OpenClaw و
چکیده‌های کامپایل‌شده تبدیل کند.

درون‌ریز از شکل OKF v0.1 پیروی می‌کند:

- فایل‌های غیررزروشده `.md` سندهای مفهومی هستند
- هر مفهوم درون‌ریزی‌شده به یک فیلد frontmatter غیرخالی `type` نیاز دارد
- مقادیر ناشناخته `type` در OKF پذیرفته می‌شوند
- فایل‌های رزروشده `index.md` و `log.md` به‌عنوان مفهوم درون‌ریزی نمی‌شوند
- پیوندهای Markdown خراب یا خارجی حفظ می‌شوند

صفحه‌های مفهومی درون‌ریزی‌شده زیر `concepts/` تخت می‌شوند تا مسیرهای موجود کامپایل،
جستجو، دریافت، داشبورد، و چکیده پرامپت آن‌ها را بدون افزودن یک درخت دوم ویکی ببینند.
هر صفحه شناسه مفهوم OKF اصلی، مسیر منبع، `type`،
`resource`، `tags`، زمان‌مهر، و frontmatter کامل تولیدکننده را نگه می‌دارد. پیوندهای داخلی OKF
به صفحه‌های مفهومی تولیدشده ویکی بازنویسی می‌شوند و همچنین به‌عنوان ورودی‌های ساخت‌یافته
`relationships` با `kind: okf-link` منتشر می‌شوند.

## ادعاهای ساخت‌یافته و شواهد

صفحه‌ها می‌توانند frontmatter ساخت‌یافته `claims` داشته باشند، نه فقط متن آزاد.

هر ادعا می‌تواند شامل این موارد باشد:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

ورودی‌های شواهد می‌توانند شامل این موارد باشند:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

این همان چیزی است که باعث می‌شود ویکی بیشتر شبیه یک لایه باور عمل کند تا یک
انباشت منفعل از یادداشت‌ها. ادعاها می‌توانند ردیابی، امتیازدهی، به چالش کشیده، و به منابع
برگردانده و حل‌وفصل شوند.

## فراداده موجودیت روبه‌روی عامل

صفحه‌های موجودیت همچنین می‌توانند فراداده مسیریابی برای استفاده عامل داشته باشند. این
frontmatter عمومی است، بنابراین برای افراد، تیم‌ها، سامانه‌ها، پروژه‌ها، یا هر نوع موجودیت دیگر
کار می‌کند.

فیلدهای رایج شامل این موارد هستند:

- `entityType`: برای مثال `person`، `team`، `system`، یا `project`
- `canonicalId`: کلید هویت پایدار که در نام‌های مستعار و درون‌ریزی‌ها استفاده می‌شود
- `aliases`: نام‌ها، شناسه‌ها، یا برچسب‌هایی که باید به همان صفحه resolve شوند
- `privacyTier`: `public`، `local-private`، `sensitive`، یا `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: راهنمایی‌های فشرده مسیریابی
- `lastRefreshedAt`: زمان‌مهر تازه‌سازی منبع جدا از زمان ویرایش صفحه
- `personCard`: کارت مسیریابی اختیاری ویژه شخص با شناسه‌ها، شبکه‌های اجتماعی،
  ایمیل‌ها، منطقه زمانی، مسیر، موارد درخواست، مواردی که نباید درخواست شوند، اطمینان، و حریم خصوصی
- `relationships`: یال‌های نوع‌دار به صفحه‌های مرتبط با هدف، نوع، وزن،
  اطمینان، نوع شواهد، رده حریم خصوصی، و یادداشت

برای یک ویکی افراد، عامل معمولاً باید با
`reports/person-agent-directory.md` شروع کند، سپس پیش از استفاده از جزئیات تماس یا واقعیت‌های استنباط‌شده،
صفحه شخص را با `wiki_get` باز کند.

مثال:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## خط لوله کامپایل

مرحله کامپایل صفحه‌های ویکی را می‌خواند، خلاصه‌ها را نرمال می‌کند، و مصنوعات پایدار
روبروی ماشین را زیر این مسیرها منتشر می‌کند:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

این چکیده‌ها وجود دارند تا عامل‌ها و کد زمان اجرا مجبور نباشند صفحه‌های Markdown را
استخراج کنند.

خروجی کامپایل‌شده همچنین این موارد را تأمین می‌کند:

- نمایه‌سازی گذر نخست ویکی برای جریان‌های جستجو/دریافت
- جستجوی شناسه ادعا به صفحه‌های مالک
- مکمل‌های فشرده پرامپت
- تولید گزارش/داشبورد

## داشبوردها و گزارش‌های سلامت

وقتی `render.createDashboards` فعال باشد، کامپایل داشبوردها را زیر
`reports/` نگه‌داری می‌کند.

گزارش‌های داخلی شامل این موارد هستند:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

این گزارش‌ها مواردی مانند این‌ها را ردیابی می‌کنند:

- خوشه‌های یادداشت تناقض
- خوشه‌های ادعای رقیب
- ادعاهای فاقد شواهد ساخت‌یافته
- صفحه‌ها و ادعاهای کم‌اطمینان
- تازگی کهنه یا نامعلوم
- صفحه‌های دارای پرسش‌های حل‌نشده
- کارت‌های مسیریابی شخص/موجودیت
- یال‌های رابطه ساخت‌یافته
- پوشش کلاس شواهد
- رده‌های حریم خصوصی غیرعمومی که پیش از استفاده نیازمند بازبینی هستند

## جستجو و بازیابی

`memory-wiki` از دو پشتوانه جستجو پشتیبانی می‌کند:

- `shared`: استفاده از جریان جستجوی حافظه مشترک در صورت دسترسی
- `local`: جستجوی محلی ویکی

همچنین از سه پیکره پشتیبانی می‌کند:

- `wiki`
- `memory`
- `all`

رفتار مهم:

- `wiki_search` و `wiki_get` در صورت امکان از چکیده‌های کامپایل‌شده به‌عنوان گذر نخست استفاده می‌کنند
- شناسه‌های ادعا می‌توانند به صفحه مالک برگردانده شوند
- ادعاهای مورد مناقشه/کهنه/تازه بر رتبه‌بندی اثر می‌گذارند
- برچسب‌های منشأ می‌توانند در نتایج باقی بمانند
- حالت جستجو می‌تواند رتبه‌بندی را برای یافتن شخص، مسیریابی پرسش، شواهد منبع،
  یا ادعاهای خام سوگیری دهد

قاعده عملی:

- برای یک گذر یادآوری گسترده از `memory_search corpus=all` استفاده کنید
- وقتی رتبه‌بندی اختصاصی ویکی، منشأ، یا ساختار باور در سطح صفحه برایتان مهم است،
  از `wiki_search` + `wiki_get` استفاده کنید

حالت‌های جستجو:

- `auto`: پیش‌فرض متوازن
- `find-person`: تقویت موجودیت‌های شبیه شخص، نام‌های مستعار، شناسه‌ها، شبکه‌های اجتماعی، و
  شناسه‌های canonical
- `route-question`: تقویت کارت‌های عامل، راهنمایی‌های ask-for، راهنمایی‌های best-used-for، و
  زمینه رابطه
- `source-evidence`: تقویت صفحه‌های منبع و فراداده شواهد ساخت‌یافته
- `raw-claim`: تقویت ادعاهای ساخت‌یافته منطبق و بازگرداندن فراداده ادعا/شواهد
  در نتایج

وقتی یک نتیجه با یک ادعای ساخت‌یافته منطبق شود، `wiki_search` می‌تواند
`matchedClaimId`، `matchedClaimStatus`، `matchedClaimConfidence`،
`evidenceKinds`، و `evidenceSourceIds` را در payload جزئیات خود برگرداند. خروجی متن
همچنین در صورت دسترسی، خط‌های فشرده `Claim:` و `Evidence:` را شامل می‌شود.

## ابزارهای عامل

Plugin این ابزارها را ثبت می‌کند:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

کاری که انجام می‌دهند:

- `wiki_status`: حالت مخزن فعلی، سلامت، دسترس‌پذیری CLI Obsidian
- `wiki_search`: جستجوی صفحه‌های ویکی و، در صورت پیکربندی، پیکره‌های حافظه مشترک؛
  `mode` را برای یافتن شخص، مسیریابی پرسش، شواهد منبع، یا واکاوی ادعای خام می‌پذیرد
- `wiki_get`: خواندن یک صفحه ویکی بر اساس شناسه/مسیر یا بازگشت به پیکره حافظه مشترک
- `wiki_apply`: جهش‌های محدود ترکیب/فراداده بدون جراحی آزاد صفحه
- `wiki_lint`: بررسی‌های ساختاری، شکاف‌های منشأ، تناقض‌ها، پرسش‌های باز

این Plugin همچنین یک مکمل غیرانحصاری برای پیکرهٔ حافظه ثبت می‌کند، بنابراین `memory_search` و `memory_get` مشترک می‌توانند وقتی Plugin حافظهٔ فعال از انتخاب پیکره پشتیبانی می‌کند به ویکی دسترسی داشته باشند.

## رفتار پرامپت و زمینه

وقتی `context.includeCompiledDigestPrompt` فعال باشد، بخش‌های پرامپت حافظه یک اسنپ‌شات فشرده و کامپایل‌شده از `agent-digest.json` را اضافه می‌کنند.

این اسنپ‌شات عمداً کوچک و پرسیگنال است:

- فقط صفحه‌های برتر
- فقط ادعاهای برتر
- تعداد تناقض‌ها
- تعداد پرسش‌ها
- توصیف‌گرهای اطمینان/تازگی

این گزینه اختیاری است، چون شکل پرامپت را تغییر می‌دهد و عمدتاً برای موتورهای زمینه یا مونتاژ پرامپت قدیمی مفید است که به‌طور صریح مکمل‌های حافظه را مصرف می‌کنند.

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

کلیدهای تغییر:

- `vaultMode`: `isolated`، `bridge`، `unsafe-local`
- `vault.renderMode`: `native` یا `obsidian`
- `bridge.readMemoryArtifacts`: وارد کردن مصنوعات عمومی Plugin حافظهٔ فعال
- `bridge.followMemoryEvents`: شامل کردن لاگ‌های رویداد در حالت پل
- `search.backend`: `shared` یا `local`
- `search.corpus`: `wiki`، `memory`، یا `all`
- `context.includeCompiledDigestPrompt`: افزودن اسنپ‌شات خلاصهٔ فشرده به بخش‌های پرامپت حافظه
- `render.createBacklinks`: تولید بلوک‌های مرتبط قطعی
- `render.createDashboards`: تولید صفحه‌های داشبورد

### مثال: حالت QMD + پل

وقتی می‌خواهید QMD برای بازیابی و `memory-wiki` برای یک لایهٔ دانشی نگهداری‌شده باشد، از این استفاده کنید:

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

این موارد را حفظ می‌کند:

- مسئولیت بازیابی حافظهٔ فعال با QMD
- تمرکز `memory-wiki` بر صفحه‌ها و داشبوردهای کامپایل‌شده
- شکل پرامپت بدون تغییر تا زمانی که عمداً پرامپت‌های خلاصهٔ کامپایل‌شده را فعال کنید

## CLI

`memory-wiki` همچنین یک سطح CLI سطح‌بالا ارائه می‌دهد:

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

برای مرجع کامل فرمان‌ها، [CLI: wiki](/fa/cli/wiki) را ببینید.

## پشتیبانی Obsidian

وقتی `vault.renderMode` برابر `obsidian` باشد، Plugin Markdown سازگار با Obsidian می‌نویسد و می‌تواند به‌صورت اختیاری از CLI رسمی `obsidian` استفاده کند.

گردش‌کارهای پشتیبانی‌شده شامل این موارد هستند:

- بررسی وضعیت
- جست‌وجوی vault
- باز کردن یک صفحه
- فراخوانی یک فرمان Obsidian
- رفتن به یادداشت روزانه

این اختیاری است. ویکی در حالت بومی بدون Obsidian همچنان کار می‌کند.

## گردش‌کار پیشنهادی

1. Plugin حافظهٔ فعال خود را برای بازیابی/ترفیع/Dreaming نگه دارید.
2. `memory-wiki` را فعال کنید.
3. با حالت `isolated` شروع کنید، مگر اینکه صراحتاً حالت پل را بخواهید.
4. وقتی منشأ اهمیت دارد از `wiki_search` / `wiki_get` استفاده کنید.
5. برای سنتزهای محدود یا به‌روزرسانی‌های فراداده از `wiki_apply` استفاده کنید.
6. پس از تغییرات معنادار `wiki_lint` را اجرا کنید.
7. اگر دیدپذیری موارد کهنه/تناقض‌ها را می‌خواهید، داشبوردها را روشن کنید.

## اسناد مرتبط

- [نمای کلی حافظه](/fa/concepts/memory)
- [CLI: memory](/fa/cli/memory)
- [CLI: wiki](/fa/cli/wiki)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
