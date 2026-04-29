---
read_when:
    - می‌خواهید بدانید حافظه چگونه کار می‌کند
    - می‌خواهید بدانید کدام فایل‌های حافظه را باید بنویسید
summary: چگونه OpenClaw موارد را در سراسر نشست‌ها به خاطر می‌سپارد
title: نمای کلی حافظه
x-i18n:
    generated_at: "2026-04-29T22:43:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw چیزها را با نوشتن **فایل‌های Markdown ساده** در workspace عامل شما به خاطر می‌سپارد. مدل فقط آنچه را که روی دیسک ذخیره می‌شود «به خاطر می‌سپارد»؛ هیچ وضعیت پنهانی وجود ندارد.

## روش کار

عامل شما سه فایل مرتبط با حافظه دارد:

- **`MEMORY.md`** — حافظهٔ بلندمدت. واقعیت‌ها، ترجیحات و تصمیم‌های پایدار. در شروع هر جلسهٔ DM بارگذاری می‌شود.
- **`memory/YYYY-MM-DD.md`** — یادداشت‌های روزانه. زمینه و مشاهدات جاری. یادداشت‌های امروز و دیروز به‌طور خودکار بارگذاری می‌شوند.
- **`DREAMS.md`** (اختیاری) — دفترچهٔ Dream Diary و خلاصه‌های sweep مربوط به Dreaming برای بازبینی انسانی، شامل ورودی‌های backfill تاریخی مبتنی بر شواهد.

این فایل‌ها در workspace عامل قرار دارند (پیش‌فرض `~/.openclaw/workspace`).

<Tip>
اگر می‌خواهید عامل شما چیزی را به خاطر بسپارد، فقط از آن بخواهید: «به خاطر بسپار که من TypeScript را ترجیح می‌دهم.» آن را در فایل مناسب می‌نویسد.
</Tip>

## تعهدهای استنباط‌شده

بعضی پیگیری‌های آینده واقعیت‌های پایدار نیستند. اگر به مصاحبه‌ای در فردا اشاره کنید، حافظهٔ مفید ممکن است «بعد از مصاحبه پیگیری کن» باشد، نه «این را برای همیشه در `MEMORY.md` ذخیره کن».

[تعهدها](/fa/concepts/commitments) حافظه‌های پیگیری کوتاه‌مدت و اختیاری برای همین مورد هستند. OpenClaw آن‌ها را در یک گذر پس‌زمینهٔ پنهان استنباط می‌کند، به همان عامل و کانال محدود می‌کند، و check-inهای سررسیدشده را از طریق heartbeat تحویل می‌دهد. یادآورها‌ی صریح همچنان از [وظایف زمان‌بندی‌شده](/fa/automation/cron-jobs) استفاده می‌کنند.

## ابزارهای حافظه

عامل دو ابزار برای کار با حافظه دارد:

- **`memory_search`** — یادداشت‌های مرتبط را با جست‌وجوی معنایی پیدا می‌کند، حتی وقتی عبارت‌بندی با متن اصلی متفاوت باشد.
- **`memory_get`** — یک فایل حافظهٔ مشخص یا بازه‌ای از خطوط را می‌خواند.

هر دو ابزار توسط Plugin حافظهٔ فعال ارائه می‌شوند (پیش‌فرض: `memory-core`).

## Plugin همراه ویکی حافظه

اگر می‌خواهید حافظهٔ پایدار بیشتر شبیه یک پایگاه دانش نگهداری‌شده رفتار کند تا فقط یادداشت‌های خام، از Plugin همراه `memory-wiki` استفاده کنید.

`memory-wiki` دانش پایدار را به یک مخزن ویکی با این ویژگی‌ها کامپایل می‌کند:

- ساختار صفحهٔ قطعی
- ادعاها و شواهد ساختاریافته
- ردیابی تناقض و تازگی
- داشبوردهای تولیدشده
- digestهای کامپایل‌شده برای مصرف‌کنندگان عامل/runtime
- ابزارهای بومی ویکی مانند `wiki_search`، `wiki_get`، `wiki_apply` و `wiki_lint`

این جایگزین Plugin حافظهٔ فعال نمی‌شود. Plugin حافظهٔ فعال همچنان مالک recall، promotion و Dreaming است. `memory-wiki` یک لایهٔ دانش سرشار از provenance در کنار آن اضافه می‌کند.

[ویکی حافظه](/fa/plugins/memory-wiki) را ببینید.

## جست‌وجوی حافظه

وقتی یک ارائه‌دهندهٔ embedding پیکربندی شده باشد، `memory_search` از **جست‌وجوی ترکیبی** استفاده می‌کند؛ یعنی ترکیب شباهت برداری (معنای معنایی) با تطبیق کلیدواژه (عبارت‌های دقیق مانند IDها و نمادهای کد). پس از داشتن API key برای هر ارائه‌دهندهٔ پشتیبانی‌شده، این قابلیت بدون پیکربندی اضافی کار می‌کند.

<Info>
OpenClaw ارائه‌دهندهٔ embedding شما را از روی API keyهای موجود به‌طور خودکار تشخیص می‌دهد. اگر کلید OpenAI، Gemini، Voyage یا Mistral پیکربندی کرده باشید، جست‌وجوی حافظه به‌طور خودکار فعال می‌شود.
</Info>

برای جزئیات دربارهٔ روش کار جست‌وجو، گزینه‌های تنظیم و راه‌اندازی ارائه‌دهنده، [جست‌وجوی حافظه](/fa/concepts/memory-search) را ببینید.

## backendهای حافظه

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/fa/concepts/memory-builtin">
مبتنی بر SQLite. بدون پیکربندی اضافی با جست‌وجوی کلیدواژه، شباهت برداری و جست‌وجوی ترکیبی کار می‌کند. وابستگی اضافه ندارد.
</Card>
<Card title="QMD" icon="search" href="/fa/concepts/memory-qmd">
sidecar محلی‌محور با reranking، گسترش query و توانایی index کردن دایرکتوری‌های بیرون از workspace.
</Card>
<Card title="Honcho" icon="brain" href="/fa/concepts/memory-honcho">
حافظهٔ بین‌جلسه‌ای AI-native با مدل‌سازی کاربر، جست‌وجوی معنایی و آگاهی چندعاملی. نصب Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/fa/plugins/memory-lancedb">
حافظهٔ همراه مبتنی بر LanceDB با embeddingهای سازگار با OpenAI، auto-recall، auto-capture و پشتیبانی از embedding محلی Ollama.
</Card>
</CardGroup>

## لایهٔ ویکی دانش

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/fa/plugins/memory-wiki">
حافظهٔ پایدار را به یک مخزن ویکی سرشار از provenance با ادعاها، داشبوردها، حالت bridge و workflowهای سازگار با Obsidian کامپایل می‌کند.
</Card>
</CardGroup>

## flush خودکار حافظه

پیش از آنکه [Compaction](/fa/concepts/compaction) گفت‌وگوی شما را خلاصه کند، OpenClaw یک نوبت بی‌صدا اجرا می‌کند که به عامل یادآوری می‌کند زمینهٔ مهم را در فایل‌های حافظه ذخیره کند. این به‌طور پیش‌فرض فعال است؛ لازم نیست چیزی را پیکربندی کنید.

برای نگه داشتن آن نوبت نگهداری روی یک مدل محلی، یک override دقیق برای مدل memory-flush تنظیم کنید:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

این override فقط روی نوبت memory-flush اعمال می‌شود و زنجیرهٔ fallback جلسهٔ فعال را به ارث نمی‌برد.

<Tip>
flush حافظه از از دست رفتن context هنگام Compaction جلوگیری می‌کند. اگر عامل شما واقعیت‌های مهمی در گفت‌وگو داشته باشد که هنوز در فایل نوشته نشده‌اند، پیش از انجام خلاصه‌سازی به‌طور خودکار ذخیره می‌شوند.
</Tip>

## Dreaming

Dreaming یک گذر اختیاری تثبیت پس‌زمینه برای حافظه است. سیگنال‌های کوتاه‌مدت را جمع‌آوری می‌کند، candidateها را امتیازدهی می‌کند و فقط آیتم‌های واجد شرایط را به حافظهٔ بلندمدت (`MEMORY.md`) ارتقا می‌دهد.

طراحی شده است تا حافظهٔ بلندمدت پرسیگنال بماند:

- **اختیاری**: به‌طور پیش‌فرض غیرفعال است.
- **زمان‌بندی‌شده**: وقتی فعال باشد، `memory-core` به‌طور خودکار یک cron job تکرارشونده را برای یک sweep کامل Dreaming مدیریت می‌کند.
- **آستانه‌دار**: ارتقاها باید از gateهای امتیاز، فراوانی recall و تنوع query عبور کنند.
- **قابل بازبینی**: خلاصه‌های فاز و ورودی‌های دفترچه در `DREAMS.md` برای بازبینی انسانی نوشته می‌شوند.

برای رفتار فازها، سیگنال‌های امتیازدهی و جزئیات Dream Diary، [Dreaming](/fa/concepts/dreaming) را ببینید.

## backfill مبتنی بر شواهد و promotion زنده

سیستم Dreaming اکنون دو lane بازبینی نزدیک به هم دارد:

- **Dreaming زنده** از store کوتاه‌مدت Dreaming زیر `memory/.dreams/` کار می‌کند و همان چیزی است که فاز عمیق عادی هنگام تصمیم‌گیری دربارهٔ آنچه می‌تواند به `MEMORY.md` ارتقا یابد استفاده می‌کند.
- **backfill مبتنی بر شواهد** یادداشت‌های تاریخی `memory/YYYY-MM-DD.md` را به‌عنوان فایل‌های روز مستقل می‌خواند و خروجی بازبینی ساختاریافته را در `DREAMS.md` می‌نویسد.

backfill مبتنی بر شواهد زمانی مفید است که می‌خواهید یادداشت‌های قدیمی‌تر را دوباره پخش کنید و بدون ویرایش دستی `MEMORY.md` بررسی کنید سیستم چه چیزی را پایدار می‌داند.

وقتی استفاده می‌کنید از:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

candidateهای پایدار مبتنی بر شواهد مستقیماً ارتقا داده نمی‌شوند. آن‌ها در همان store کوتاه‌مدت Dreaming قرار می‌گیرند که فاز عمیق عادی از قبل استفاده می‌کند. یعنی:

- `DREAMS.md` سطح بازبینی انسانی باقی می‌ماند.
- store کوتاه‌مدت سطح رتبه‌بندی رو به ماشین باقی می‌ماند.
- `MEMORY.md` همچنان فقط توسط promotion عمیق نوشته می‌شود.

اگر تصمیم گرفتید replay مفید نبوده است، می‌توانید artifactهای stage‌شده را بدون دست زدن به ورودی‌های عادی دفترچه یا وضعیت recall عادی حذف کنید:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## مطالعهٔ بیشتر

- [موتور حافظهٔ داخلی](/fa/concepts/memory-builtin): backend پیش‌فرض SQLite.
- [موتور حافظهٔ QMD](/fa/concepts/memory-qmd): sidecar پیشرفتهٔ محلی‌محور.
- [حافظهٔ Honcho](/fa/concepts/memory-honcho): حافظهٔ بین‌جلسه‌ای AI-native.
- [حافظهٔ LanceDB](/fa/plugins/memory-lancedb): Plugin مبتنی بر LanceDB با embeddingهای سازگار با OpenAI.
- [ویکی حافظه](/fa/plugins/memory-wiki): مخزن دانش کامپایل‌شده و ابزارهای بومی ویکی.
- [جست‌وجوی حافظه](/fa/concepts/memory-search): pipeline جست‌وجو، ارائه‌دهندگان و تنظیم.
- [Dreaming](/fa/concepts/dreaming): promotion پس‌زمینه از recall کوتاه‌مدت به حافظهٔ بلندمدت.
- [مرجع پیکربندی حافظه](/fa/reference/memory-config): همهٔ knobهای پیکربندی.
- [Compaction](/fa/concepts/compaction): نحوهٔ تعامل Compaction با حافظه.

## مرتبط

- [Active memory](/fa/concepts/active-memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
- [موتور حافظهٔ داخلی](/fa/concepts/memory-builtin)
- [حافظهٔ Honcho](/fa/concepts/memory-honcho)
- [حافظهٔ LanceDB](/fa/plugins/memory-lancedb)
- [تعهدها](/fa/concepts/commitments)
