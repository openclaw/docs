---
read_when:
    - می‌خواهید دانشی پایدار فراتر از یادداشت‌های ساده‌ی MEMORY.md داشته باشید
    - در حال پیکربندی Plugin همراه memory-wiki هستید
    - می‌خواهید wiki_search، wiki_get یا حالت پل را درک کنید
summary: 'memory-wiki: خزانهٔ دانش گردآوری‌شده با منشأ، ادعاها، داشبوردها و حالت پل'
title: ویکی حافظه
x-i18n:
    generated_at: "2026-04-29T23:16:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` یک Plugin همراه است که حافظهٔ پایدار را به یک
مخزن دانش کامپایل‌شده تبدیل می‌کند.

این جایگزین Plugin حافظهٔ فعال **نمی‌شود**. Plugin حافظهٔ فعال همچنان مالک
یادآوری، ارتقا، نمایه‌سازی و Dreaming است. `memory-wiki` در کنار آن قرار می‌گیرد
و دانش پایدار را به یک ویکی قابل پیمایش با صفحه‌های قطعی، ادعاهای ساخت‌یافته،
منشأ، داشبوردها و خلاصه‌های قابل خواندن توسط ماشین کامپایل می‌کند.

زمانی از آن استفاده کنید که می‌خواهید حافظه بیشتر شبیه یک لایهٔ دانش نگهداری‌شده
رفتار کند و کمتر شبیه انبوهی از فایل‌های Markdown باشد.

## چه چیزهایی اضافه می‌کند

- یک مخزن ویکی اختصاصی با چیدمان صفحهٔ قطعی
- فرادادهٔ ساخت‌یافته برای ادعا و شواهد، نه فقط متن
- منشأ، اطمینان، تناقض‌ها و پرسش‌های باز در سطح صفحه
- خلاصه‌های کامپایل‌شده برای مصرف‌کنندگان عامل/runtime
- ابزارهای بومی ویکی برای search/get/apply/lint
- حالت اختیاری پل که مصنوعات عمومی را از Plugin حافظهٔ فعال وارد می‌کند
- حالت رندر سازگار با Obsidian و یکپارچه‌سازی CLI به‌صورت اختیاری

## چگونه با حافظه هماهنگ می‌شود

این تفکیک را این‌طور در نظر بگیرید:

| لایه                                                   | مالک                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin حافظهٔ فعال (`memory-core`، QMD، Honcho و غیره) | یادآوری، جست‌وجوی معنایی، ارتقا، Dreaming، runtime حافظه                               |
| `memory-wiki`                                           | صفحه‌های ویکی کامپایل‌شده، ترکیب‌های غنی از منشأ، داشبوردها، search/get/apply ویژهٔ ویکی |

اگر Plugin حافظهٔ فعال مصنوعات یادآوری مشترک را ارائه کند، OpenClaw می‌تواند
هر دو لایه را در یک گذر با `memory_search corpus=all` جست‌وجو کند.

وقتی به رتبه‌بندی ویژهٔ ویکی، منشأ، یا دسترسی مستقیم به صفحه نیاز دارید، به‌جای آن
از ابزارهای بومی ویکی استفاده کنید.

## الگوی ترکیبی پیشنهادی

یک پیش‌فرض قوی برای چیدمان‌های local-first این است:

- QMD به‌عنوان backend حافظهٔ فعال برای یادآوری و جست‌وجوی معنایی گسترده
- `memory-wiki` در حالت `bridge` برای صفحه‌های دانش ترکیب‌شدهٔ پایدار

این تفکیک خوب عمل می‌کند، چون هر لایه متمرکز می‌ماند:

- QMD یادداشت‌های خام، خروجی‌های نشست و مجموعه‌های اضافی را قابل جست‌وجو نگه می‌دارد
- `memory-wiki` موجودیت‌های پایدار، ادعاها، داشبوردها و صفحه‌های منبع را کامپایل می‌کند

قاعدهٔ عملی:

- وقتی یک گذر یادآوری گسترده در حافظه می‌خواهید، از `memory_search` استفاده کنید
- وقتی نتایج ویکی آگاه از منشأ می‌خواهید، از `wiki_search` و `wiki_get` استفاده کنید
- وقتی می‌خواهید جست‌وجوی مشترک هر دو لایه را پوشش دهد، از `memory_search corpus=all` استفاده کنید

اگر حالت پل صفر مصنوع صادرشده گزارش کند، Plugin حافظهٔ فعال در حال حاضر
ورودی‌های پل عمومی را ارائه نمی‌کند. ابتدا `openclaw wiki doctor` را اجرا کنید،
سپس تأیید کنید که Plugin حافظهٔ فعال از مصنوعات عمومی پشتیبانی می‌کند.

وقتی حالت پل فعال است و `bridge.readMemoryArtifacts` فعال شده،
`openclaw wiki status`، `openclaw wiki doctor` و `openclaw wiki bridge
import` از طریق Gateway در حال اجرا می‌خوانند. این کار بررسی‌های پل CLI را با
زمینهٔ Plugin حافظه در runtime همسو نگه می‌دارد. اگر پل غیرفعال باشد یا خواندن
مصنوعات خاموش شده باشد، این فرمان‌ها رفتار محلی/آفلاین خود را حفظ می‌کنند.

## حالت‌های مخزن

`memory-wiki` از سه حالت مخزن پشتیبانی می‌کند:

### `isolated`

مخزن خودش، منابع خودش، بدون وابستگی به `memory-core`.

وقتی می‌خواهید ویکی فروشگاه دانش گزینش‌شدهٔ خودش باشد، از این حالت استفاده کنید.

### `bridge`

مصنوعات حافظهٔ عمومی و رویدادهای حافظه را از Plugin حافظهٔ فعال
از طریق seamهای عمومی plugin SDK می‌خواند.

وقتی می‌خواهید ویکی مصنوعات صادرشدهٔ Plugin حافظه را بدون ورود به internals
خصوصی Plugin کامپایل و سازمان‌دهی کند، از این حالت استفاده کنید.

حالت پل می‌تواند این موارد را نمایه کند:

- مصنوعات حافظهٔ صادرشده
- گزارش‌های dream
- یادداشت‌های روزانه
- فایل‌های ریشهٔ حافظه
- لاگ‌های رویداد حافظه

### `unsafe-local`

راه فرار صریح برای مسیرهای خصوصی محلی روی همان ماشین.

این حالت عمداً آزمایشی و غیرقابل‌انتقال است. فقط وقتی از آن استفاده کنید که
مرز اعتماد را می‌فهمید و مشخصاً به دسترسی فایل‌سیستم محلی نیاز دارید که
حالت پل نمی‌تواند فراهم کند.

## چیدمان مخزن

Plugin یک مخزن را به این شکل مقداردهی اولیه می‌کند:

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

- `sources/` برای مواد خام واردشده و صفحه‌های پشتیبانی‌شده با پل
- `entities/` برای چیزها، افراد، سیستم‌ها، پروژه‌ها و اشیای پایدار
- `concepts/` برای ایده‌ها، انتزاع‌ها، الگوها و سیاست‌ها
- `syntheses/` برای خلاصه‌های کامپایل‌شده و rollupهای نگهداری‌شده
- `reports/` برای داشبوردهای تولیدشده

## ادعاها و شواهد ساخت‌یافته

صفحه‌ها می‌توانند frontmatter ساخت‌یافتهٔ `claims` داشته باشند، نه فقط متن آزاد.

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

این همان چیزی است که باعث می‌شود ویکی بیشتر شبیه یک لایهٔ باور عمل کند تا
یک محل تخلیهٔ منفعل یادداشت‌ها. ادعاها می‌توانند ردیابی، امتیازدهی، محل اختلاف
و تا منابع حل‌وفصل شوند.

## فرادادهٔ موجودیت روبه‌روی عامل

صفحه‌های موجودیت می‌توانند فرادادهٔ مسیریابی برای استفادهٔ عامل نیز داشته باشند.
این frontmatter عمومی است، بنابراین برای افراد، تیم‌ها، سیستم‌ها، پروژه‌ها یا
هر نوع موجودیت دیگری کار می‌کند.

فیلدهای رایج شامل این موارد است:

- `entityType`: برای مثال `person`، `team`، `system` یا `project`
- `canonicalId`: کلید هویت پایدار که در نام‌های مستعار و واردات استفاده می‌شود
- `aliases`: نام‌ها، handleها یا برچسب‌هایی که باید به همان صفحه resolve شوند
- `privacyTier`: `public`، `local-private`، `sensitive` یا `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: راهنمایی‌های فشردهٔ مسیریابی
- `lastRefreshedAt`: timestamp تازه‌سازی منبع جدا از زمان ویرایش صفحه
- `personCard`: کارت مسیریابی اختیاری مخصوص شخص با handleها، شبکه‌های اجتماعی،
  ایمیل‌ها، timezone، lane، ask-for، avoid-asking-for، confidence و privacy
- `relationships`: یال‌های تایپ‌شده به صفحه‌های مرتبط با target، kind، weight،
  confidence، evidence kind، privacy tier و note

برای ویکی افراد، عامل معمولاً باید با
`reports/person-agent-directory.md` شروع کند، سپس پیش از استفاده از جزئیات تماس
یا حقایق استنباط‌شده، صفحهٔ شخص را با `wiki_get` باز کند.

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

## خط لولهٔ کامپایل

مرحلهٔ کامپایل صفحه‌های ویکی را می‌خواند، خلاصه‌ها را نرمال‌سازی می‌کند و
مصنوعات پایدار روبه‌روی ماشین را در این مسیرها منتشر می‌کند:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

این خلاصه‌ها وجود دارند تا عامل‌ها و کد runtime مجبور نباشند صفحه‌های Markdown
را scrape کنند.

خروجی کامپایل‌شده همچنین این موارد را نیرو می‌دهد:

- نمایه‌سازی گذر اول ویکی برای جریان‌های search/get
- lookup شناسهٔ ادعا به صفحه‌های مالک
- مکمل‌های فشردهٔ prompt
- تولید گزارش/داشبورد

## داشبوردها و گزارش‌های سلامت

وقتی `render.createDashboards` فعال باشد، کامپایل داشبوردها را زیر `reports/`
نگهداری می‌کند.

گزارش‌های داخلی شامل این موارد است:

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
- صفحه‌ها و ادعاهای با اطمینان پایین
- تازگی قدیمی یا نامعلوم
- صفحه‌های دارای پرسش‌های حل‌نشده
- کارت‌های مسیریابی شخص/موجودیت
- یال‌های رابطهٔ ساخت‌یافته
- پوشش کلاس شواهد
- سطوح privacy غیرعمومی که پیش از استفاده به بازبینی نیاز دارند

## جست‌وجو و بازیابی

`memory-wiki` از دو backend جست‌وجو پشتیبانی می‌کند:

- `shared`: استفاده از جریان جست‌وجوی حافظهٔ مشترک وقتی در دسترس باشد
- `local`: جست‌وجوی محلی ویکی

همچنین از سه corpus پشتیبانی می‌کند:

- `wiki`
- `memory`
- `all`

رفتار مهم:

- `wiki_search` و `wiki_get` در صورت امکان از خلاصه‌های کامپایل‌شده به‌عنوان گذر اول استفاده می‌کنند
- شناسه‌های ادعا می‌توانند به صفحهٔ مالک resolve شوند
- ادعاهای مورد اختلاف/قدیمی/تازه بر رتبه‌بندی اثر می‌گذارند
- برچسب‌های منشأ می‌توانند در نتایج باقی بمانند
- حالت جست‌وجو می‌تواند رتبه‌بندی را برای lookup شخص، مسیریابی پرسش، شواهد
  منبع یا ادعاهای خام جهت‌دهی کند

قاعدهٔ عملی:

- برای یک گذر یادآوری گسترده، از `memory_search corpus=all` استفاده کنید
- وقتی رتبه‌بندی ویژهٔ ویکی، منشأ یا ساختار باور در سطح صفحه برایتان مهم است،
  از `wiki_search` + `wiki_get` استفاده کنید

حالت‌های جست‌وجو:

- `auto`: پیش‌فرض متعادل
- `find-person`: تقویت موجودیت‌های شبیه شخص، نام‌های مستعار، handleها، socials و
  شناسه‌های canonical
- `route-question`: تقویت کارت‌های عامل، راهنمایی‌های ask-for، راهنمایی‌های best-used-for و
  زمینهٔ رابطه
- `source-evidence`: تقویت صفحه‌های منبع و فرادادهٔ شواهد ساخت‌یافته
- `raw-claim`: تقویت ادعاهای ساخت‌یافتهٔ مطابق و برگرداندن فرادادهٔ claim/evidence
  در نتایج

وقتی یک نتیجه با ادعای ساخت‌یافته مطابق باشد، `wiki_search` می‌تواند
`matchedClaimId`، `matchedClaimStatus`، `matchedClaimConfidence`،
`evidenceKinds` و `evidenceSourceIds` را در payload جزئیات خود برگرداند. خروجی
متنی نیز در صورت وجود، خطوط فشردهٔ `Claim:` و `Evidence:` را شامل می‌شود.

## ابزارهای عامل

Plugin این ابزارها را ثبت می‌کند:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

کارکرد آن‌ها:

- `wiki_status`: حالت فعلی مخزن، سلامت، در دسترس بودن CLI برای Obsidian
- `wiki_search`: جست‌وجوی صفحه‌های ویکی و، در صورت پیکربندی، corpusهای حافظهٔ مشترک؛
  `mode` را برای lookup شخص، مسیریابی پرسش، شواهد منبع یا drilldown ادعای خام می‌پذیرد
- `wiki_get`: خواندن صفحهٔ ویکی با id/path یا fallback به corpus حافظهٔ مشترک
- `wiki_apply`: جهش‌های محدود synthesis/metadata بدون جراحی آزاد صفحه
- `wiki_lint`: بررسی‌های ساختاری، شکاف‌های منشأ، تناقض‌ها، پرسش‌های باز

Plugin همچنین یک مکمل corpus حافظهٔ غیرانحصاری ثبت می‌کند، بنابراین
`memory_search` و `memory_get` مشترک می‌توانند وقتی Plugin حافظهٔ فعال از انتخاب
corpus پشتیبانی می‌کند به ویکی دسترسی داشته باشند.

## رفتار prompt و context

وقتی `context.includeCompiledDigestPrompt` فعال باشد، بخش‌های prompt حافظه
یک snapshot کامپایل‌شدهٔ فشرده از `agent-digest.json` اضافه می‌کنند.

این snapshot عمداً کوچک و پرسیگنال است:

- فقط صفحه‌های برتر
- فقط ادعاهای برتر
- تعداد تناقض‌ها
- تعداد پرسش‌ها
- qualifierهای confidence/freshness

این گزینه opt-in است، چون شکل prompt را تغییر می‌دهد و عمدتاً برای موتورهای
context یا مونتاژ prompt قدیمی مفید است که صراحتاً مکمل‌های حافظه را مصرف می‌کنند.

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

کلیدهای تغییر اصلی:

- `vaultMode`:‏ `isolated`،‏ `bridge`،‏ `unsafe-local`
- `vault.renderMode`:‏ `native` یا `obsidian`
- `bridge.readMemoryArtifacts`: وارد کردن آرتیفکت‌های عمومی Plugin حافظه فعال
- `bridge.followMemoryEvents`: گنجاندن لاگ‌های رویداد در حالت bridge
- `search.backend`:‏ `shared` یا `local`
- `search.corpus`:‏ `wiki`،‏ `memory`، یا `all`
- `context.includeCompiledDigestPrompt`: افزودن اسنپ‌شات فشرده digest به بخش‌های پرامپت حافظه
- `render.createBacklinks`: تولید بلاک‌های مرتبطِ قطعی
- `render.createDashboards`: تولید صفحه‌های داشبورد

### مثال: حالت QMD + bridge

وقتی QMD را برای یادآوری و `memory-wiki` را برای یک لایه دانش نگهداری‌شده می‌خواهید، از این استفاده کنید:

```json5
{
  memory: {
    backend: "qmd",
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

- QMD مسئول یادآوری Active Memory می‌ماند
- `memory-wiki` روی صفحه‌های کامپایل‌شده و داشبوردها متمرکز می‌ماند
- شکل پرامپت تا وقتی عمداً پرامپت‌های digest کامپایل‌شده را فعال نکنید، بدون تغییر می‌ماند

## CLI

`memory-wiki` همچنین یک سطح CLI سطح‌بالا ارائه می‌کند:

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

وقتی `vault.renderMode` برابر `obsidian` باشد، Plugin، Markdown سازگار با Obsidian می‌نویسد و می‌تواند به‌صورت اختیاری از CLI رسمی `obsidian` استفاده کند.

گردش‌کارهای پشتیبانی‌شده شامل این موارد هستند:

- بررسی وضعیت
- جست‌وجوی vault
- باز کردن یک صفحه
- فراخوانی یک فرمان Obsidian
- رفتن به یادداشت روزانه

این اختیاری است. ویکی همچنان در حالت native بدون Obsidian کار می‌کند.

## گردش‌کار پیشنهادی

1. Plugin حافظه فعال خود را برای یادآوری/ارتقا/Dreaming نگه دارید.
2. `memory-wiki` را فعال کنید.
3. با حالت `isolated` شروع کنید، مگر اینکه صراحتاً حالت bridge را بخواهید.
4. وقتی منشأ اهمیت دارد، از `wiki_search` / `wiki_get` استفاده کنید.
5. برای سنتزهای محدود یا به‌روزرسانی‌های فراداده، از `wiki_apply` استفاده کنید.
6. پس از تغییرات معنادار، `wiki_lint` را اجرا کنید.
7. اگر نمایان‌سازی موارد قدیمی/تناقض‌ها را می‌خواهید، داشبوردها را روشن کنید.

## اسناد مرتبط

- [نمای کلی حافظه](/fa/concepts/memory)
- [CLI: memory](/fa/cli/memory)
- [CLI: wiki](/fa/cli/wiki)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
