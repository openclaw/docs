---
read_when:
    - دانشی پایدار فراتر از یادداشت‌های ساده‌ی MEMORY.md می‌خواهید
    - در حال پیکربندی Plugin همراه memory-wiki هستید
    - می‌خواهید wiki_search، wiki_get یا حالت پل را درک کنید
summary: 'memory-wiki: مخزن دانش گردآوری‌شده با منشأ، ادعاها، داشبوردها و حالت پل'
title: ویکی حافظه
x-i18n:
    generated_at: "2026-05-04T02:26:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` یک Plugin بسته‌بندی‌شده است که حافظهٔ پایدار را به یک خزانهٔ دانش کامپایل‌شده تبدیل می‌کند.

این Plugin **جایگزین** Plugin حافظهٔ فعال نمی‌شود. Plugin حافظهٔ فعال همچنان
مالک یادآوری، ارتقا، نمایه‌سازی، و Dreaming است. `memory-wiki` در کنار آن قرار می‌گیرد
و دانش پایدار را به یک ویکی قابل پیمایش با صفحه‌های قطعی،
ادعاهای ساخت‌یافته، منشأ، داشبوردها، و چکیده‌های قابل خواندن برای ماشین کامپایل می‌کند.

از آن زمانی استفاده کنید که می‌خواهید حافظه بیشتر شبیه یک لایهٔ دانش نگهداری‌شده رفتار کند و
کمتر شبیه انبوهی از فایل‌های Markdown باشد.

## چه چیزی اضافه می‌کند

- یک خزانهٔ ویکی اختصاصی با چیدمان صفحهٔ قطعی
- فرادادهٔ ساخت‌یافتهٔ ادعا و شواهد، نه فقط متن روایی
- منشأ، اطمینان، تناقض‌ها، و پرسش‌های باز در سطح صفحه
- چکیده‌های کامپایل‌شده برای مصرف‌کنندگان عامل/زمان اجرا
- ابزارهای بومی ویکی برای جست‌وجو/دریافت/اعمال/لینت
- حالت پل اختیاری که مصنوعات عمومی را از Plugin حافظهٔ فعال وارد می‌کند
- حالت رندر سازگار با Obsidian و یکپارچه‌سازی CLI به‌صورت اختیاری

## چگونه با حافظه هماهنگ می‌شود

این جداسازی را این‌طور در نظر بگیرید:

| لایه                                                   | مالک                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin حافظهٔ فعال (`memory-core`, QMD, Honcho, etc.) | یادآوری، جست‌وجوی معنایی، ارتقا، Dreaming، زمان اجرای حافظه                               |
| `memory-wiki`                                           | صفحه‌های ویکی کامپایل‌شده، سنتزهای غنی از منشأ، داشبوردها، جست‌وجو/دریافت/اعمال ویژهٔ ویکی |

اگر Plugin حافظهٔ فعال مصنوعات یادآوری مشترک را ارائه دهد، OpenClaw می‌تواند
هر دو لایه را در یک گذر با `memory_search corpus=all` جست‌وجو کند.

وقتی به رتبه‌بندی ویژهٔ ویکی، منشأ، یا دسترسی مستقیم به صفحه نیاز دارید، به‌جای آن از
ابزارهای بومی ویکی استفاده کنید.

## الگوی ترکیبی پیشنهادی

یک پیش‌فرض قوی برای راه‌اندازی‌های local-first این است:

- QMD به‌عنوان بک‌اند حافظهٔ فعال برای یادآوری و جست‌وجوی معنایی گسترده
- `memory-wiki` در حالت `bridge` برای صفحه‌های دانش سنتزشدهٔ پایدار

این جداسازی خوب عمل می‌کند چون هر لایه متمرکز می‌ماند:

- QMD یادداشت‌های خام، خروجی‌های نشست، و مجموعه‌های اضافی را قابل جست‌وجو نگه می‌دارد
- `memory-wiki` موجودیت‌های پایدار، ادعاها، داشبوردها، و صفحه‌های منبع را کامپایل می‌کند

قاعدهٔ عملی:

- از `memory_search` وقتی استفاده کنید که یک گذر یادآوری گسترده در سراسر حافظه می‌خواهید
- از `wiki_search` و `wiki_get` وقتی استفاده کنید که نتایج ویکی آگاه از منشأ می‌خواهید
- از `memory_search corpus=all` وقتی استفاده کنید که می‌خواهید جست‌وجوی مشترک هر دو لایه را پوشش دهد

اگر حالت پل صفر مصنوع صادرشده گزارش کند، Plugin حافظهٔ فعال در حال حاضر
ورودی‌های پل عمومی را ارائه نمی‌دهد. ابتدا `openclaw wiki doctor` را اجرا کنید،
سپس تأیید کنید که Plugin حافظهٔ فعال از مصنوعات عمومی پشتیبانی می‌کند.

وقتی حالت پل فعال است و `bridge.readMemoryArtifacts` فعال شده است،
`openclaw wiki status`، `openclaw wiki doctor`، و `openclaw wiki bridge
import` از طریق Gateway در حال اجرا می‌خوانند. این کار بررسی‌های پل CLI را با
بافت Plugin حافظه در زمان اجرا هم‌راستا نگه می‌دارد. اگر پل غیرفعال باشد یا خواندن مصنوعات
خاموش شده باشد، این دستورها رفتار محلی/آفلاین خود را حفظ می‌کنند.

## حالت‌های خزانه

`memory-wiki` از سه حالت خزانه پشتیبانی می‌کند:

### `isolated`

خزانهٔ خودش، منابع خودش، بدون وابستگی به `memory-core`.

از این حالت زمانی استفاده کنید که می‌خواهید ویکی ذخیره‌گاه دانش گزینش‌شدهٔ خودش باشد.

### `bridge`

مصنوعات حافظهٔ عمومی و رویدادهای حافظه را از Plugin حافظهٔ فعال
از طریق نقاط اتصال عمومی SDK Plugin می‌خواند.

از این حالت زمانی استفاده کنید که می‌خواهید ویکی مصنوعات صادرشدهٔ Plugin حافظه را
بدون دسترسی به درون‌ساخت‌های خصوصی Plugin کامپایل و سازمان‌دهی کند.

حالت پل می‌تواند این موارد را نمایه کند:

- مصنوعات حافظهٔ صادرشده
- گزارش‌های رؤیا
- یادداشت‌های روزانه
- فایل‌های ریشهٔ حافظه
- لاگ‌های رویداد حافظه

### `unsafe-local`

راه فرار صریح همان‌ماشین برای مسیرهای خصوصی محلی.

این حالت عمداً آزمایشی و غیرقابل حمل است. فقط زمانی از آن استفاده کنید که
مرز اعتماد را می‌فهمید و مشخصاً به دسترسی به سیستم فایل محلی نیاز دارید که
حالت پل نمی‌تواند فراهم کند.

## چیدمان خزانه

Plugin یک خزانه را به این شکل مقداردهی اولیه می‌کند:

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
- `entities/` برای چیزها، افراد، سیستم‌ها، پروژه‌ها، و اشیای پایدار
- `concepts/` برای ایده‌ها، انتزاع‌ها، الگوها، و سیاست‌ها
- `syntheses/` برای خلاصه‌های کامپایل‌شده و جمع‌بندی‌های نگهداری‌شده
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

این همان چیزی است که باعث می‌شود ویکی بیشتر شبیه یک لایهٔ باور عمل کند تا یک
انباشت منفعل از یادداشت‌ها. ادعاها می‌توانند ردیابی، امتیازدهی، به چالش کشیده شدن، و
بازحل شدن به منابع را داشته باشند.

## فرادادهٔ موجودیت رو به عامل

صفحه‌های موجودیت همچنین می‌توانند فرادادهٔ مسیریابی برای استفادهٔ عامل داشته باشند. این
frontmatter عمومی است، بنابراین برای افراد، تیم‌ها، سیستم‌ها، پروژه‌ها، یا هر نوع
موجودیت دیگری کار می‌کند.

فیلدهای رایج شامل این موارد است:

- `entityType`: برای مثال `person`، `team`، `system`، یا `project`
- `canonicalId`: کلید هویت پایدار که در سراسر نام‌های مستعار و واردات استفاده می‌شود
- `aliases`: نام‌ها، شناسه‌ها، یا برچسب‌هایی که باید به همان صفحه resolve شوند
- `privacyTier`: `public`، `local-private`، `sensitive`، یا `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: راهنمایی‌های فشردهٔ مسیریابی
- `lastRefreshedAt`: مُهر زمانی تازه‌سازی منبع، جدا از زمان ویرایش صفحه
- `personCard`: کارت مسیریابی اختیاری ویژهٔ شخص با شناسه‌ها، شبکه‌های اجتماعی،
  ایمیل‌ها، منطقهٔ زمانی، مسیر، موارد قابل پرسش، مواردی که نباید پرسیده شوند، اطمینان، و حریم خصوصی
- `relationships`: یال‌های تایپ‌شده به صفحه‌های مرتبط با مقصد، نوع، وزن،
  اطمینان، نوع شواهد، سطح حریم خصوصی، و یادداشت

برای یک ویکی افراد، عامل معمولاً باید با
`reports/person-agent-directory.md` شروع کند، سپس پیش از استفاده از جزئیات تماس یا واقعیت‌های استنباط‌شده،
صفحهٔ شخص را با `wiki_get` باز کند.

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

گام کامپایل صفحه‌های ویکی را می‌خواند، خلاصه‌ها را نرمال‌سازی می‌کند، و مصنوعات پایدار
رو به ماشین را در این مسیرها منتشر می‌کند:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

این چکیده‌ها وجود دارند تا عامل‌ها و کد زمان اجرا مجبور نباشند صفحه‌های Markdown را
scrape کنند.

خروجی کامپایل‌شده همچنین این موارد را تأمین می‌کند:

- نمایه‌سازی گذر اول ویکی برای جریان‌های جست‌وجو/دریافت
- جست‌وجوی شناسهٔ ادعا به صفحه‌های مالک
- مکمل‌های فشردهٔ prompt
- تولید گزارش/داشبورد

## داشبوردها و گزارش‌های سلامت

وقتی `render.createDashboards` فعال باشد، کامپایل داشبوردها را در
`reports/` نگهداری می‌کند.

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
- خوشه‌های ادعاهای رقیب
- ادعاهایی که شواهد ساخت‌یافته ندارند
- صفحه‌ها و ادعاهای کم‌اطمینان
- تازگی منسوخ یا ناشناخته
- صفحه‌هایی با پرسش‌های حل‌نشده
- کارت‌های مسیریابی شخص/موجودیت
- یال‌های رابطهٔ ساخت‌یافته
- پوشش کلاس شواهد
- سطوح حریم خصوصی غیرعمومی که پیش از استفاده نیاز به بازبینی دارند

## جست‌وجو و بازیابی

`memory-wiki` از دو بک‌اند جست‌وجو پشتیبانی می‌کند:

- `shared`: در صورت وجود، از جریان جست‌وجوی حافظهٔ مشترک استفاده کنید
- `local`: ویکی را به‌صورت محلی جست‌وجو کنید

همچنین از سه پیکره پشتیبانی می‌کند:

- `wiki`
- `memory`
- `all`

رفتار مهم:

- `wiki_search` و `wiki_get` در صورت امکان از چکیده‌های کامپایل‌شده به‌عنوان گذر اول استفاده می‌کنند
- شناسه‌های ادعا می‌توانند به صفحهٔ مالک resolve شوند
- ادعاهای مورد مناقشه/منسوخ/تازه بر رتبه‌بندی اثر می‌گذارند
- برچسب‌های منشأ می‌توانند وارد نتایج شوند
- حالت جست‌وجو می‌تواند رتبه‌بندی را به سمت یافتن شخص، مسیریابی پرسش، شواهد منبع،
  یا ادعاهای خام متمایل کند

قاعدهٔ عملی:

- از `memory_search corpus=all` برای یک گذر یادآوری گسترده استفاده کنید
- وقتی به رتبه‌بندی ویژهٔ ویکی،
  منشأ، یا ساختار باور در سطح صفحه اهمیت می‌دهید، از `wiki_search` + `wiki_get` استفاده کنید

حالت‌های جست‌وجو:

- `auto`: پیش‌فرض متوازن
- `find-person`: موجودیت‌های شبیه شخص، نام‌های مستعار، شناسه‌ها، شبکه‌های اجتماعی، و
  شناسه‌های canonical را تقویت می‌کند
- `route-question`: کارت‌های عامل، راهنمایی‌های ask-for، راهنمایی‌های best-used-for، و
  بافت رابطه را تقویت می‌کند
- `source-evidence`: صفحه‌های منبع و فرادادهٔ شواهد ساخت‌یافته را تقویت می‌کند
- `raw-claim`: ادعاهای ساخت‌یافتهٔ مطابق را تقویت می‌کند و فرادادهٔ ادعا/شواهد را
  در نتایج برمی‌گرداند

وقتی یک نتیجه با یک ادعای ساخت‌یافته مطابق باشد، `wiki_search` می‌تواند
`matchedClaimId`، `matchedClaimStatus`، `matchedClaimConfidence`،
`evidenceKinds`، و `evidenceSourceIds` را در payload جزئیاتش برگرداند. خروجی متنی
نیز در صورت وجود، خط‌های فشردهٔ `Claim:` و `Evidence:` را شامل می‌شود.

## ابزارهای عامل

Plugin این ابزارها را ثبت می‌کند:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

کارکرد آن‌ها:

- `wiki_status`: حالت فعلی خزانه، سلامت، دسترس‌پذیری CLI مربوط به Obsidian
- `wiki_search`: صفحه‌های ویکی و، در صورت پیکربندی، پیکره‌های حافظهٔ مشترک را جست‌وجو می‌کند؛
  `mode` را برای یافتن شخص، مسیریابی پرسش، شواهد منبع، یا واکاوی ادعای خام می‌پذیرد
- `wiki_get`: یک صفحهٔ ویکی را با شناسه/مسیر می‌خواند یا به پیکرهٔ حافظهٔ مشترک fallback می‌کند
- `wiki_apply`: جهش‌های محدود سنتز/فراداده بدون جراحی آزادانهٔ صفحه
- `wiki_lint`: بررسی‌های ساختاری، شکاف‌های منشأ، تناقض‌ها، پرسش‌های باز

Plugin همچنین یک مکمل پیکرهٔ حافظهٔ غیرانحصاری ثبت می‌کند، تا
`memory_search` و `memory_get` مشترک بتوانند وقتی Plugin حافظهٔ فعال
از انتخاب پیکره پشتیبانی می‌کند، به ویکی دسترسی داشته باشند.

## رفتار prompt و بافت

وقتی `context.includeCompiledDigestPrompt` فعال باشد، بخش‌های prompt حافظه
یک snapshot کامپایل‌شدهٔ فشرده از `agent-digest.json` اضافه می‌کنند.

این snapshot عمداً کوچک و پرسیگنال است:

- فقط صفحه‌های برتر
- فقط ادعاهای برتر
- شمار تناقض‌ها
- شمار پرسش‌ها
- توصیفگرهای اطمینان/تازگی

این حالت opt-in است، چون شکل prompt را تغییر می‌دهد و عمدتاً برای موتورهای بافت
یا مونتاژ prompt قدیمی که به‌صراحت مکمل‌های حافظه را مصرف می‌کنند مفید است.

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

کلیدهای اصلی:

- `vaultMode`: `isolated`، `bridge`، `unsafe-local`
- `vault.renderMode`: `native` یا `obsidian`
- `bridge.readMemoryArtifacts`: وارد کردن مصنوعات عمومی Plugin حافظه فعال
- `bridge.followMemoryEvents`: گنجاندن گزارش‌های رویداد در حالت پل
- `search.backend`: `shared` یا `local`
- `search.corpus`: `wiki`، `memory` یا `all`
- `context.includeCompiledDigestPrompt`: افزودن نمای فشردهٔ digest به بخش‌های پرامپت حافظه
- `render.createBacklinks`: تولید بلوک‌های مرتبط قطعی
- `render.createDashboards`: تولید صفحه‌های داشبورد

### مثال: حالت QMD + پل

وقتی QMD را برای یادآوری و `memory-wiki` را برای یک لایهٔ دانشی نگهداری‌شده می‌خواهید، از این استفاده کنید:

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

- QMD مسئول یادآوری حافظه فعال می‌ماند
- `memory-wiki` روی صفحه‌های کامپایل‌شده و داشبوردها متمرکز می‌ماند
- شکل پرامپت تا زمانی که عمداً پرامپت‌های digest کامپایل‌شده را فعال کنید، بدون تغییر می‌ماند

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

وقتی `vault.renderMode` برابر `obsidian` است، Plugin Markdown سازگار با Obsidian می‌نویسد و می‌تواند به‌صورت اختیاری از CLI رسمی `obsidian` استفاده کند.

گردش‌کارهای پشتیبانی‌شده شامل موارد زیر است:

- بررسی وضعیت
- جست‌وجوی vault
- باز کردن یک صفحه
- فراخوانی یک فرمان Obsidian
- رفتن به یادداشت روزانه

این اختیاری است. ویکی همچنان در حالت بومی بدون Obsidian کار می‌کند.

## گردش‌کار پیشنهادی

1. Plugin حافظه فعال خود را برای یادآوری/ارتقا/Dreaming نگه دارید.
2. `memory-wiki` را فعال کنید.
3. مگر اینکه صراحتاً حالت پل را بخواهید، با حالت `isolated` شروع کنید.
4. وقتی منشأ و شواهد اهمیت دارد، از `wiki_search` / `wiki_get` استفاده کنید.
5. برای ترکیب‌های محدود یا به‌روزرسانی‌های فراداده، از `wiki_apply` استفاده کنید.
6. پس از تغییرات معنادار، `wiki_lint` را اجرا کنید.
7. اگر دیدپذیری موارد کهنه/تناقض‌ها را می‌خواهید، داشبوردها را روشن کنید.

## مستندات مرتبط

- [مرور کلی حافظه](/fa/concepts/memory)
- [CLI: memory](/fa/cli/memory)
- [CLI: wiki](/fa/cli/wiki)
- [مرور کلی Plugin SDK](/fa/plugins/sdk-overview)
